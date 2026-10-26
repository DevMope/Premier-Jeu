// (v1.63) La berceuse du lac : la page que le vieux voyageur laisse à sa quatrième visite. Ses paroles, son air (une
// boîte à musique, synthétisée comme les autres sons du jeu), la page elle-même (pliée en quatre, une petite portée,
// une fleur séchée glissée dedans, une tache d'eau), et ses échos : le vieux voyageur en fredonne un peu plus à chaque
// visite, la barde ne la connaît pas, et d'autres pourraient un jour la reconnaître (berceuseConnue).

const BERCEUSE = {
  titre: 'La berceuse du lac',
  // Trois couplets de quatre heptasyllabes, rimes croisées (lus à voix haute : 7 pieds, l'accent sur la dernière)
  couplets: [
    ['Dors, la brume est sur le lac,', 'Les roseaux ferment les yeux ;', 'La lanterne, au bout du bac,', 'Fait un petit soleil bleu.'],
    ["L'automne a jauni la rive,", "Les feuilles s'en vont dormir ;", 'La barque, au fil qui dérive,', 'Sait le chemin pour venir.'],
    ['Et si tu cherches nos voix,', 'Fredonne-la doucement :', "L'eau répondra, cette fois,", "Comme elle a fait si souvent."],
  ],
  // L'air, en la mineur, à trois temps : [demi-tons depuis le la 440, durée en temps]. Une ligne = trois mesures
  // (sept notes, une par pied, la dernière tenue). Il monte, se pose, s'élève vers la lanterne, puis redescend.
  //   1 : la do mi | ré do si | do—      2 : si do ré | mi ré do | si—
  //   3 : la do mi | la' sol mi | fa—     4 : mi ré do | si do si | la—
  melodie: [
    [0, 1], [3, 1], [7, 1], [5, 1], [3, 1], [2, 1], [3, 3],
    [2, 1], [3, 1], [5, 1], [7, 1], [5, 1], [3, 1], [2, 3],
    [0, 1], [3, 1], [7, 1], [12, 1], [10, 1], [7, 1], [8, 3],
    [7, 1], [5, 1], [3, 1], [2, 1], [3, 1], [2, 1], [0, 3],
  ],
  // une note grave au premier temps de chaque mesure (la, sol, do · sol, la, mi · la, do, fa · la, mi, la)
  basse: [-12, -14, -9, -14, -12, -17, -12, -9, -16, -12, -17, -12],
  temps: 0.42,   // (secondes par temps : une ligne dure 9 temps, l'air entier un peu plus de quinze secondes)
};
const DUREE_LIGNE_BERCEUSE = 9 * BERCEUSE.temps;

// Le point d'accroche des autres histoires (Dame Ardéline, dans un autre lot, pourrait la reconnaître) :
// vrai dès que tu as la page.
function berceuseConnue(G) { return !!(G && G.evtComptoir && G.evtComptoir.berceuse); }

// --- Le son : la boîte à musique, ou le vieux voyageur qui fredonne (une voix douce, une octave plus bas) ---
if (typeof INSTRUMENTS !== 'undefined') {
  INSTRUMENTS.fredon = { voix: [['sine', 1, 0.8], ['sine', 2, 0.1], ['triangle', 1, 0.12]], attaque: 0.14, decroissance: 0.2, tenue: 0.75, relache: 0.3, volume: 0.15, vibrato: 0.007, filtre: 760 };
}
if (typeof SONS !== 'undefined') {
  // o.notes : combien de notes (un fragment) ; o.instrument : 'boiteAMusique' (défaut) ou 'fredon' ; o.octave : -1 plus bas
  SONS.berceuse = function (t, bus, o = {}) {
    const instrument = o.instrument || 'boiteAMusique', oct = Math.pow(2, o.octave || 0), n = Math.min(o.notes || BERCEUSE.melodie.length, BERCEUSE.melodie.length);
    const T = BERCEUSE.temps;
    let temps = 0;
    for (let i = 0; i < n; i++) {
      const [d, duree] = BERCEUSE.melodie[i];
      // (la boîte à musique ralentit un peu à la toute fin, comme un ressort qui se détend)
      const ralenti = instrument === 'boiteAMusique' && i >= BERCEUSE.melodie.length - 3 ? 1.18 : 1;
      this.note(instrument, 440 * oct * Math.pow(2, d / 12), t + temps * T, duree * T * (instrument === 'fredon' ? 0.95 : 0.6) * ralenti, instrument === 'fredon' ? 0.9 : 1, bus);
      temps += duree * ralenti;
    }
    if (instrument === 'boiteAMusique' && !o.sansBasse) {
      const mesures = Math.ceil(BERCEUSE.melodie.slice(0, n).reduce((s, [, d]) => s + d, 0) / 3);
      for (let m = 0; m < Math.min(mesures, BERCEUSE.basse.length); m++) this.note('boiteAMusique', 440 * Math.pow(2, BERCEUSE.basse[m] / 12), t + m * 3 * T * (m >= 11 ? 1.1 : 1), 3 * T * 0.5, 0.55, bus);
    }
  };
  if (typeof VOLUME_SONS !== 'undefined') VOLUME_SONS.berceuse = 1.6;
}
// la durée d'un fragment de n notes, en millisecondes (pour attendre qu'il soit fini)
function dureeBerceuse(n = BERCEUSE.melodie.length) { return BERCEUSE.melodie.slice(0, n).reduce((s, [, d]) => s + d, 0) * BERCEUSE.temps * 1000 * 1.06; }

// --- La page : pliée en quatre, une portée de notes, une fleur séchée glissée dedans, une tache d'eau ---
function texBerceuse(scene) {
  const cle = 'berceusePage';
  if (scene.textures.exists(cle)) return cle;
  const L = 300, H = 214;
  const tex = scene.textures.createCanvas(cle, L, H), ctx = tex.getContext();
  const img = ctx.createImageData(L, H), D = img.data;
  let graine = 1931;
  const rnd = () => (graine = (graine * 16807) % 2147483647) / 2147483647;
  const poser = (x, y, r, g, b, a = 255) => { if (x < 0 || y < 0 || x >= L || y >= H) return; const i = (y * L + x) * 4; D[i] = r; D[i + 1] = g; D[i + 2] = b; D[i + 3] = a; };
  const assombrir = (x, y, k) => { if (x < 0 || y < 0 || x >= L || y >= H) return; const i = (y * L + x) * 4; if (!D[i + 3]) return; D[i] = Math.max(0, Math.min(255, D[i] + k)); D[i + 1] = Math.max(0, Math.min(255, D[i + 1] + k * 1.05)); D[i + 2] = Math.max(0, Math.min(255, D[i + 2] + k * 1.25)); };
  const melanger = (x, y, [r, g, b], a) => { if (x < 0 || y < 0 || x >= L || y >= H) return; const i = (y * L + x) * 4; D[i] = D[i] * (1 - a) + r * a; D[i + 1] = D[i + 1] * (1 - a) + g * a; D[i + 2] = D[i + 2] * (1 - a) + b * a; D[i + 3] = 255; };
  // le papier : jauni, plus sombre vers les bords usés, quelques fibres
  for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) {
    const bord = Math.min(x, y, L - 1 - x, H - 1 - y);
    if (bord === 0 && rnd() < 0.55) continue;
    if (bord === 1 && rnd() < 0.14) continue;
    const v = Math.min(1, bord / 16), n = (rnd() - 0.5) * 9;
    poser(x, y, 228 - (1 - v) * 40 + n, 212 - (1 - v) * 46 + n, 170 - (1 - v) * 52 + n);
  }
  for (let k = 0; k < 70; k++) { const x = rnd() * L | 0, y = rnd() * H | 0, l = 2 + rnd() * 5 | 0; for (let j = 0; j < l; j++) assombrir(x + j, y + (j > l / 2 ? 1 : 0), -7); }
  // les deux plis (en quatre) : un trait sombre, un reflet clair à côté, un peu d'usure au croisement
  for (let y = 2; y < H - 2; y++) { assombrir(149, y, -20 - rnd() * 6); assombrir(150, y, -9); assombrir(151, y, 10); }
  for (let x = 2; x < L - 2; x++) { assombrir(x, 106, -18 - rnd() * 6); assombrir(x, 107, -8); assombrir(x, 108, 9); }
  for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) if (dx * dx + dy * dy <= 9) assombrir(150 + dx, 107 + dy, -6);
  // la tache d'eau : un cerne irrégulier, plus sombre sur son bord (là où l'eau a séché)
  const tx = 240, ty = 160, rx = 32, ry = 21;
  for (let y = ty - ry - 4; y <= ty + ry + 4; y++) for (let x = tx - rx - 4; x <= tx + rx + 4; x++) {
    const a = Math.atan2(y - ty, x - tx), ond = 1 + Math.sin(a * 5 + 0.7) * 0.07 + Math.sin(a * 3 - 1.1) * 0.05;
    const d = Math.sqrt(((x - tx) / rx) ** 2 + ((y - ty) / ry) ** 2) / ond;
    if (d < 0.84) assombrir(x, y, -5 - (d < 0.5 ? 0 : 3));
    else if (d < 1) assombrir(x, y, -14 - (d - 0.84) * 110);
  }
  // la portée : cinq lignes à l'encre pâlie, une clé de sol, et les sept premières notes de l'air
  const encre = [64, 44, 26];
  for (const ly of [30, 34, 38, 42, 46]) for (let x = 70; x <= 232; x++) if (rnd() > 0.04) melanger(x, ly, encre, 0.62);
  const cle7 = ['..##.', '.#..#', '.#..#', '..#.#', '...#.', '..##.', '.#.#.', '#..#.', '#..##', '#.#.#', '#..#.#', '.#.#.#', '..###.', '...#..', '...#..', '.#.#..', '..#...'];
  cle7.forEach((l, j) => { for (let i = 0; i < l.length; i++) if (l[i] === '#') melanger(73 + i, 27 + j, encre, 0.8); });
  // (en haut, la mesure à trois temps : deux petits chiffres)
  for (const [x, y] of [[84, 31], [85, 31], [86, 32], [85, 33], [86, 34], [84, 35], [85, 35]]) melanger(x, y, encre, 0.7);
  for (const [x, y] of [[84, 38], [84, 39], [86, 38], [86, 39], [84, 40], [85, 40], [86, 40], [86, 41], [86, 42]]) melanger(x, y, encre, 0.7);
  const hauteurs = { 0: 40, 2: 38, 3: 36, 5: 34, 7: 32 };   // la, si, do, ré, mi
  const notes = BERCEUSE.melodie.slice(0, 7), xs = [96, 110, 124, 142, 156, 170, 190];
  notes.forEach(([d, duree], i) => {
    const cx = xs[i], cy = hauteurs[d], plein = duree < 3;
    for (const [dy, a, b] of [[-1, 0, 2], [0, -1, 2], [1, -1, 1]])   // (une tête penchée : [dy, de dx, à dx])
      for (let x = a; x <= b; x++) if (plein || !(dy === 0 && x >= 0 && x <= 1)) melanger(cx + x, cy + dy, encre, 0.85);
    if (cy <= 38) for (let k = 1; k <= 9; k++) melanger(cx - 1, cy + k, encre, 0.8);   // (en haut de la portée : la queue descend)
    else for (let k = 1; k <= 9; k++) melanger(cx + 2, cy - k, encre, 0.8);
    if (!plein) melanger(cx + 5, cy - 1, encre, 0.85);   // (la blanche pointée, tenue)
  });
  for (const bx of [134, 182]) for (let y = 30; y <= 46; y++) melanger(bx, y, encre, 0.7);   // les barres de mesure
  for (let y = 30; y <= 46; y++) { melanger(229, y, encre, 0.6); melanger(231, y, encre, 0.9); melanger(232, y, encre, 0.9); }
  // (une petite reprise de la plume, là où l'encre a bavé)
  for (const [x, y] of [[233, 47], [234, 48], [234, 49]]) melanger(x, y, encre, 0.35);
  // la fleur séchée, glissée dans la page : un brin de bruyère des rives, sa tige brune, trois feuilles fines,
  // une fleur mauve fanée (cinq pétales veinés, un cœur ocre), un bouton, et une petite fleur sur le côté
  const ombre = (x, y) => assombrir(x + 1, y + 2, -16);
  const trait = (x0, y0, x1, y1, ep, c) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2; for (let k = 0; k <= n; k++) { const x = x0 + (x1 - x0) * k / n, y = y0 + (y1 - y0) * k / n + Math.sin(k / n * 3.1) * 1.5; for (let e = 0; e < ep; e++) { ombre(x + e | 0, y | 0); } for (let e = 0; e < ep; e++) poser(x + e | 0, y | 0, c[0] - e * 12, c[1] - e * 12, c[2] - e * 8); } };
  trait(8, 211, 50, 150, 2, [112, 98, 58]);   // la tige
  trait(33, 175, 60, 168, 1, [104, 92, 54]);  // le petit rameau
  const feuille = (fx, fy, dx, dy, l) => { for (let k = 0; k < l; k++) { const t = k / l, w = Math.sin(t * Math.PI) * 2.2; for (let e = -w; e <= w; e += 0.5) { const x = fx + dx * k - dy * e | 0, y = fy + dy * k + dx * e | 0; ombre(x, y); const v = e < 0 ? 0 : -14; poser(x, y, 128 + v, 122 + v, 70 + v); } } };
  feuille(18, 197, 1, -0.35, 11); feuille(27, 184, -1, -0.55, 10); feuille(39, 170, 1, -0.9, 9);
  const fleur = (fx, fy, r, n = 5) => {
    for (let q = 0; q < n; q++) {
      const a = q / n * Math.PI * 2 - 0.5, px = fx + Math.cos(a) * r, py = fy + Math.sin(a) * r * 0.85;
      const R = r * 0.72;
      for (let dy = -R - 1; dy <= R + 1; dy++) for (let dx = -R - 1; dx <= R + 1; dx++) {
        const d = (dx * dx + dy * dy * 1.25) / (R * R); if (d > 1) continue;
        const x = px + dx | 0, y = py + dy | 0; ombre(x, y);
        const clair = (dx * Math.cos(a) + dy * Math.sin(a)) < 0, veine = Math.abs(dx * Math.sin(a) - dy * Math.cos(a)) < 0.5 && d < 0.7;
        const c = veine ? [128, 92, 122] : d > 0.7 ? [140, 106, 136] : clair ? [192, 164, 186] : [166, 132, 160];
        poser(x, y, c[0], c[1], c[2]);
      }
    }
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) poser(fx + dx | 0, fy + dy | 0, 190, 146, 70);
    poser(fx - 1 | 0, fy - 1 | 0, 226, 192, 116);
  };
  fleur(51, 148, 5.2); fleur(62, 166, 3.2);
  // le bouton, encore fermé
  for (const [x, y, c] of [[44, 158, 150], [45, 157, 170], [44, 157, 182], [45, 158, 140], [44, 159, 130]]) { ombre(x, y); poser(x, y, c, c * 0.78 | 0, c * 0.95 | 0); }
  ctx.putImageData(img, 0, 0);
  tex.refresh();
  return cle;
}

// --- L'ouvrir : la page se déplie par-dessus la scène ; on peut en jouer l'air, couplet après couplet ---
function ouvrirBerceuse(scene, quandFini = null) {
  const G = window.GAME, E = etatEvt(G);
  E.berceuseLue = (E.berceuseLue || 0) + 1;
  const boite = scene.add.container(0, 0).setDepth(60);
  const fixe = o => { o.setScrollFactor(0); boite.add(o); return o; };
  fixe(scene.add.rectangle(480, 270, 960, 540, 0x0a0604, 0.72).setInteractive());
  const page = scene.add.container(480, 258); fixe(page);
  page.add(scene.add.image(0, 0, texBerceuse(scene)).setScale(2));
  const encre = '#4a2c14';
  page.add(scene.add.text(0, -184, BERCEUSE.titre, style(17, encre, { fontStyle: 'bold italic' })).setOrigin(0.5).setAlpha(0.92));
  // les couplets : le premier et le deuxième côte à côte, le troisième au milieu, plus bas
  const places = [[-135, -86], [135, -86], [0, 20]], lignes = [];
  BERCEUSE.couplets.forEach((c, k) => c.forEach((v, i) => {
    const t = scene.add.text(places[k][0], places[k][1] + i * 22, v, style(14, encre, { fontStyle: 'italic' })).setOrigin(0.5).setAlpha(0.88);
    page.add(t); lignes.push(t);
  }));
  page.setScale(0.35, 0.08).setAlpha(0);
  scene.tweens.add({ targets: page, scaleX: 1, duration: 260, ease: 'Quad.easeOut' });
  scene.tweens.add({ targets: page, scaleY: 1, alpha: 1, duration: 420, delay: 120, ease: 'Back.easeOut' });
  Son.jouer('page');
  // l'air : un couplet à la fois (le suivant à chaque fois), la ligne chantée s'éclaire
  let enCours = null, retour = null;
  const ambiance = typeof Son !== 'undefined' ? Son.themeVoulu : null;
  const remettre = () => { lignes.forEach(t => t.active && t.setColor(encre).setAlpha(0.88)); };
  const jouer = creerBouton(scene, 372, 504, 210, '♪ Jouer l\'air', () => {
    if (enCours) return;
    const k = (E.berceuseJouee || 0) % BERCEUSE.couplets.length;
    E.berceuseJouee = (E.berceuseJouee || 0) + 1;
    if (Son.pret) Son.ambiance(null);
    Son.jouer('berceuse');
    jouer.setActif(false);
    enCours = [];
    for (let i = 0; i < 4; i++) enCours.push(scene.time.delayedCall(i * DUREE_LIGNE_BERCEUSE * 1000, () => { remettre(); const t = lignes[k * 4 + i]; if (t && t.active) t.setColor('#8a3410').setAlpha(1); }));
    enCours.push(scene.time.delayedCall(dureeBerceuse() + 300, () => { remettre(); enCours = null; if (jouer.fond.active) jouer.setActif(true); }));
    if (retour) retour.remove();
    retour = scene.time.delayedCall(dureeBerceuse() + 1800, () => { if (scene.sys.isActive() && ambiance && !Son.theme) Son.ambiance(ambiance); });
  });
  const replier = creerBouton(scene, 588, 504, 210, 'Replier la page', () => {
    for (const m of enCours || []) m.remove();
    if (retour) { retour.remove(); retour = null; }
    if (ambiance && !Son.theme) scene.time.delayedCall(enCours ? 600 : 0, () => scene.sys.isActive() && Son.ambiance(ambiance));
    Son.jouer('page');
    for (const b of [jouer, replier]) { b.fond.destroy(); b.label.destroy(); }
    scene.tweens.add({ targets: page, scaleY: 0.08, alpha: 0, duration: 260, ease: 'Quad.easeIn', onComplete: () => { boite.destroy(); if (quandFini) quandFini(); } });
  });
  for (const b of [jouer, replier]) { b.fond.setScrollFactor(0).setDepth(61); b.label.setScrollFactor(0).setDepth(61); }
  boite.boutons = { jouer, replier }; boite.lignes = lignes;   // (pour les essais)
  scene.pageBerceuse = boite;
  return boite;
}
