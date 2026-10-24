// (v0.99, lot B-1, planche 21) Les saisons qui se voient : la Comté change de couleurs (le paysage
// peint, voir paysageHD), et devant les scènes du dehors (la façade, la rue, le marché) : deux arbres
// dont le feuillage suit la saison, les fleurs du printemps, les blés et les meules de l'été, les
// feuilles rousses qui tombent et la brume de l'automne, la neige, le toit blanc et le bonhomme de
// neige de l'hiver.

// La saison du jour (pour la peinture des paysages ; rien hors d'une partie)
let SAISON_FORCEE = null;   // (le passage de saison peint l'ancienne puis la nouvelle)
function saisonActuelle() {
  if (SAISON_FORCEE) return SAISON_FORCEE;
  const G = window.GAME;
  return G && G.jour && typeof saisonDe === 'function' ? saisonDe(G) : null;
}

// Les couleurs de la Comté selon la saison (celles de la planche 21)
const BIOMES_SAISON = (() => {
  const C = BIOMES.comte;
  return {
    semailles: { ...C, loin: 0x8ccf6a, pres: 0x6cb84c, horizon: 0xf4f0c8, ciel: 0x9ad8f4, arbres: 0x5aa848 },
    moissons: { ...C, loin: 0xc8b450, pres: 0xb89a3a, horizon: 0xf8e4a0, ciel: 0x86c8f0, chemin: 0xd8b878, arbres: 0x3a7a30 },
    brumes: { ...C, loin: 0xb07a3a, pres: 0x8a6a30, horizon: 0xe8c8a0, ciel: 0xa8b4c0, soleil: 0xffe0b0, arbres: 0xc0601e },
    givre: { ...C, loin: 0xe4ecf4, pres: 0xf4f8fc, horizon: 0xf0f4ff, ciel: 0xb8cce0, chemin: 0xd8dce4, soleil: 0xf8f8ff, arbres: 0x8a8478 },
  };
})();
const RELIEFS_SAISON = {
  semailles: { fleurs: 0xf06090 },
  moissons: { fleurs: 0xf0c850 },
  brumes: { fleurs: 0xd0702a, brume: 0.35 },
  givre: { fleurs: 0xffffff },
};

// Le décor de saison, par-dessus une scène du dehors.
// opts : { sol (y du sol), arbres: [[x, échelle], ...], prof (la profondeur des arbres), facade (ce que
// rend dessinerFacade, pour la neige du toit), bonhomme: x, sansParticules, largeur }
function decorSaison(scene, opts = {}) {
  const s = saisonActuelle();
  if (!s) return null;
  const sol = opts.sol ?? 440, L = opts.largeur || 960, prof = opts.prof ?? 7;
  const fixe = o => (opts.fixe ? o.setScrollFactor(0) : o);
  const objets = [];
  const ajout = o => { objets.push(o); return o; };
  // un hasard reproductible (le décor ne saute pas d'une visite à l'autre)
  let graine = 7 + (window.GAME ? window.GAME.jour : 0) * 13;
  const rnd = (a, b) => { graine = (graine * 16807) % 2147483647; return a + (graine / 2147483647) * (b - a); };
  const g = ajout(scene.add.graphics().setDepth(prof - 0.5));

  // Le sol : des fleurs au printemps, des feuilles en automne, la neige en hiver
  if (opts.sansSol) {}
  else if (s === 'semailles') for (let k = 0; k < L / 4; k++) g.fillStyle([0xf06090, 0xffe060, 0xffffff, 0xb070f0, 0xff8040][k % 5]).fillCircle(Math.round(rnd(0, L)), Math.round(rnd(sol - 4, sol + 30)), 2);
  else if (s === 'brumes') for (let k = 0; k < L / 6; k++) g.fillStyle([0xc85a20, 0xe0902a, 0xa04018][k % 3]).fillRect(Math.round(rnd(0, L)), Math.round(rnd(sol - 2, sol + 40)), 5, 3);
  else if (s === 'givre') { g.fillStyle(0xf4f8fc, 0.92).fillRect(0, sol - 3, L, 10); for (let k = 0; k < L / 8; k++) g.fillStyle(0xffffff).fillEllipse(rnd(0, L), sol + rnd(4, 60), rnd(14, 40), rnd(4, 8)); }
  if (s === 'moissons' && opts.meules !== false && !opts.sansSol) {
    // (v1.62) les bottes de paille de l'été, peintes comme le décor (vraie paille, liens, brins qui dépassent, ombre au sol),
    // et posées seulement là où elles ne cachent rien : à côté des tonneaux de la façade, contre le mur, si la place est
    // libre jusqu'à l'arbre (jamais devant un tonneau, une porte, une autre maison, ni sur le chemin des clients).
    // `meules` : [[x], ...] pour les poser soi-même ; [] pour n'en poser aucune.
    texturesPailleHD(scene);
    const places = opts.meules || placesBottesFacade(scene, opts, sol, L);
    for (const [mx, sorte, my] of places) {
      if (sorte === 'charrette') {   // (au premier plan, sur les pavés)
        ajout(fixe(scene.add.ellipse(mx + 6, my - 3, 150, 14, 0x000000, 0.22).setDepth(prof - 0.45)));
        ajout(fixe(scene.add.image(mx, my, 'charretteFoin').setOrigin(0.5, 1).setScale(2).setDepth(prof - 0.4)));
        continue;
      }
      ajout(fixe(scene.add.ellipse(mx + 4, sol + 3, 92, 12, 0x000000, 0.22).setDepth(prof - 0.45)));
      ajout(fixe(scene.add.image(mx, sol + 4, 'bottesPailleFacade').setOrigin(0.5, 1).setScale(2).setDepth(prof - 0.4)));
    }
  }
  // La neige sur le toit et les rebords de la façade
  if (s === 'givre' && opts.facade && opts.facade.image && opts.facade.zones && opts.facade.zones.toit) {
    // (la même façade, peinte en blanc, mais seulement le haut du toit : la neige suit sa forme exacte)
    const im = opts.facade.image, [, ty, , th] = opts.facade.zones.toit;
    const haut = im.y - im.displayHeight, sy = Math.max(0, (ty - haut) / im.scaleY);
    const neige = ajout(scene.add.image(im.x, im.y, im.texture.key).setOrigin(im.originX, im.originY).setScale(im.scaleX, im.scaleY).setDepth(im.depth + 0.01).setTintFill(0xf8fbff).setAlpha(0.95));
    neige.setCrop(0, 0, im.width, sy + th * 0.32 / im.scaleY);
    if (opts.facade.zones.fenetre) { const [fx, fy, fl] = opts.facade.zones.fenetre; ajout(scene.add.rectangle(fx + fl / 2, fy - 3, fl + 12, 5, 0xf8fbff).setDepth(im.depth + 0.02)); }
  }

  // (v0.99) la neige sur d'autres toits (les maisons de la rue) : le haut de chaque image, peint en blanc
  if (s === 'givre') for (const [im, part] of opts.toits || []) {
    if (!im || !im.active) continue;
    const n = ajout(scene.add.image(im.x, im.y, im.texture.key, im.frame.name).setOrigin(im.originX, im.originY).setScale(im.scaleX, im.scaleY).setDepth(im.depth + 0.01).setTintFill(0xf8fbff).setAlpha(0.93));
    n.setCrop(0, 0, im.width, im.height * part);
  }

  // Les arbres du premier plan, peints un par un (arbresHD.js) : une espèce par arbre, jamais la même deux fois côte à côte.
  // `arbres` : [[x, échelle, espèce?], ...] ; sans espèce, on alterne (chêne, pommier, bouleau, saule) selon la place dans la liste.
  (opts.arbres || []).forEach(([x, ech], k) => {
    const esp = especeDuArbre(opts, k), H = Math.round(112 * ech), cle = arbreHD(scene, esp, s, H, 1 + k, x > 480 ? -1 : 1);   // (les branches se retiennent du côté de la maison)
    const base = sol + 30 * ech;
    ajout(fixe(scene.add.ellipse(x + 8 * ech, base - 1, 92 * ech, 12 * ech, 0x000000, 0.2).setDepth(prof - 0.01)));   // (son ombre au sol)
    ajout(fixe(scene.add.image(x, base + PIED_ARBRE * 2, cle).setOrigin(0.5, 1).setScale(2).setDepth(prof)));
  });
  // Le bonhomme de neige
  if (s === 'givre' && opts.bonhomme !== undefined) {
    const b2 = ajout(scene.add.graphics().setDepth(prof)), bx = opts.bonhomme, by = sol + 50;
    b2.fillStyle(0xdde6f0).fillCircle(bx, by - 22, 26).fillStyle(0xf8fbff).fillCircle(bx - 3, by - 25, 22);
    b2.fillStyle(0xdde6f0).fillCircle(bx, by - 62, 19).fillStyle(0xf8fbff).fillCircle(bx - 2, by - 64, 16);
    b2.fillStyle(0xdde6f0).fillCircle(bx, by - 92, 14).fillStyle(0xf8fbff).fillCircle(bx - 2, by - 94, 12);
    b2.fillStyle(0x1a1410).fillCircle(bx - 5, by - 96, 2).fillCircle(bx + 5, by - 96, 2).fillCircle(bx, by - 66, 2).fillCircle(bx, by - 56, 2);
    b2.fillStyle(0xe87020).fillTriangle(bx, by - 92, bx + 14, by - 90, bx, by - 88);
    b2.fillStyle(0xc82a20).fillRect(bx - 14, by - 80, 28, 6).fillRect(bx + 6, by - 80, 6, 18);
    b2.fillStyle(0x2a2420).fillRect(bx - 12, by - 112, 24, 4).fillRect(bx - 8, by - 126, 16, 14);
    b2.lineStyle(3, 0x5a3a20).lineBetween(bx - 18, by - 64, bx - 40, by - 80).lineBetween(bx + 18, by - 64, bx + 38, by - 78);
    fixe(b2);
  }
  fixe(g);

  // Ce qui tombe du ciel : des pétales, des feuilles, des flocons ; la brume au ras du sol
  if (!opts.sansParticules) {
    const n = { semailles: 26, moissons: 0, brumes: 34, givre: 70 }[s];
    for (let k = 0; k < n; k++) {
      const coul = s === 'semailles' ? [0xf8c0d8, 0xffffff][k % 2] : s === 'brumes' ? [0xc85a20, 0xe0902a, 0xa04018][k % 3] : 0xffffff;
      const p = ajout(fixe(scene.add.rectangle(rnd(0, L), rnd(-sol, sol), s === 'givre' ? 3 : 5, s === 'givre' ? 3 : 3, coul, s === 'givre' ? 0.9 : 1).setDepth(prof + 1)));
      const vent = s === 'givre' ? rnd(-30, 30) : rnd(60, 200);
      scene.tweens.add({ targets: p, y: p.y + sol + 60, x: p.x + vent, angle: s === 'givre' ? 0 : 360, duration: rnd(5000, 10000), repeat: -1 });
    }
    if (s === 'brumes') for (let k = 0; k < 3; k++) {
      const b = ajout(fixe(scene.add.rectangle(L / 2, sol - 10 - k * 26, L, 34, 0xe8eef4, 0.16).setDepth(prof + 0.5)));
      scene.tweens.add({ targets: b, alpha: 0.08, x: L / 2 + 30, duration: 4000 + k * 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    if (s === 'moissons') ajout(fixe(scene.add.rectangle(L / 2, 270, L, 540, 0xffd890, 0.08).setBlendMode(Phaser.BlendModes.ADD).setDepth(prof + 0.5)));
    if (s === 'givre') ajout(fixe(scene.add.rectangle(L / 2, 270, L, 540, 0x9ab8e0, 0.1).setBlendMode(Phaser.BlendModes.MULTIPLY).setDepth(prof + 0.5)));
  }
  return objets;
}

// Les petites icônes de saison (16×16) : une fleur rose, un épi de blé, une feuille rousse, un flocon
function creerIconesSaison(scene) {
  if (scene.textures.exists('iconeSaison_givre')) return;
  const dessins = {
    semailles: [['..p..', '.ppp.', 'pjpjp', '.ppp.', '..v..', '.vv..', '..v..'], { p: 0xf070a0, j: 0xffe060, v: 0x4a9a3a }],
    moissons: [['..o..', '.ooo.', '.ooo.', '..o..', '.ooo.', '..t..', '..t..'], { o: 0xf0c040, t: 0xb08a2a }],
    brumes: [['...o.', '..oor', '.oorr', 'oorr.', '.rr..', '.t...', 't....'], { o: 0xe8902a, r: 0xc0501e, t: 0x6a4020 }],
    givre: [['b..b..b', '.b.b.b.', '..bbb..', 'bbbwbbb', '..bbb..', '.b.b.b.', 'b..b..b'], { b: 0xd8ecff, w: 0xffffff }],
  };
  for (const [s, [lignes, couleurs]] of Object.entries(dessins)) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false }), k = 2, ox = (16 - lignes[0].length * k) / 2, oy = (16 - lignes.length * k) / 2;
    lignes.forEach((l, y) => [...l].forEach((ch, x) => { if (couleurs[ch]) { g.fillStyle(0x1a0e06).fillRect(ox + x * k - 1, oy + y * k - 1, k + 2, k + 2); } }));
    lignes.forEach((l, y) => [...l].forEach((ch, x) => { if (couleurs[ch]) g.fillStyle(couleurs[ch]).fillRect(ox + x * k, oy + y * k, k, k); }));
    g.generateTexture('iconeSaison_' + s, 16, 16); g.destroy();
  }
}

// (v1.62) Les bottes de paille de l'été, peintes comme le décor (demi-résolution, affichées ×2) : la paille en fibres,
// le dessus plus clair, le bout coupé tout piqueté, les deux liens de ficelle, des brins qui dépassent ; une fourche
// appuyée. Deux tas : vus de côté (devant la façade, à côté des tonneaux), vus par le bout (dans le creux entre deux
// maisons de la rue). À l'échelle des personnages : une botte fait à peu près la hauteur d'un genou.
function texturesPailleHD(scene) {
  if (scene.textures.exists('bottesPailleFacade')) return;
  const T = (l, h) => { const t = toileDecor(l, h); Object.assign(t.rampes, {
    paille: [0x4a3410, 0x7a5a1c, 0xa8822e, 0xcca248, 0xe6c46a, 0xf8e4a0], bout: [0x3e2c0e, 0x6e5018, 0x9c7628, 0xc09840, 0xdcb85e, 0xf0d890],
    ficelle: [0x2a1a0e, 0x4a3018, 0x6a4a28, 0x8a6a40, 0xa88a5a, 0xc8aa78] }); return t; };
  const borne = k => Math.max(0, Math.min(5, Math.round(k)));
  // Une botte vue de côté. Les deux ficelles font le tour dans la longueur : on les voit sur le dessus (deux traits
  // dans la longueur) et sur le bout (deux traits debout) ; le flanc montre la paille couchée, partagée en « tranches »
  // (le pressage), et des tiges coupées qui hérissent la surface. Le bout, à droite, fuit vers le fond.
  const deCote = (t, x0, y0, L, H, g) => {
    const coin = (x, y) => (x === x0 && (y === y0 + 3 || y === y0 + H - 1));   // (les coins un peu ronds)
    // le dessus (3 rangs, qui fuient vers la droite) et ses deux ficelles dans la longueur
    for (let r = 0; r < 3; r++) for (let x = x0 + 2 - r; x < x0 + L + 2 - r; x++) {
      if (r === 0 && (x === x0 + 2 || x === x0 + L + 1)) continue;
      t.poser(x, y0 + r, 'paille', borne(4 + (hachage(x, r, g) > 0.7 ? 1 : 0) - (hachage(x >> 1, r, g + 1) < 0.18 ? 1 : 0) - (r === 2 ? 1 : 0)));
    }
    for (let x = x0 + 3; x < x0 + L - 1; x++) if (hachage(x, 7, g) > 0.25) { t.poser(x + 1, y0, 'ficelle', 3); t.poser(x, y0 + 2, 'ficelle', 2); }
    // le flanc : la paille couchée (des fibres dans la longueur), les tranches du pressage, les tiges coupées
    const tranches = []; for (let x = x0 + 3 + Math.floor(hachage(1, 2, g) * 2); x < x0 + L - 2; x += 4 + Math.floor(hachage(x, 3, g) * 3)) tranches.push(x);
    for (let y = y0 + 3; y < y0 + H; y++) for (let x = x0; x < x0 + L; x++) {
      if (coin(x, y)) continue;
      let k = 3 + Math.round((fbm(x * 0.12, y * 0.9, g) - 0.5) * 2.4);
      if (hachage(x, y, g + 2) > 0.86) k += 1; if (hachage(x, y, g + 5) > 0.93) k -= 2;   // (les tiges coupées : un point clair, un trou sombre)
      if (tranches.includes(x) && hachage(x, y >> 1, g + 6) > 0.3) k -= 1;
      if (x === x0) k += 1; if (y === y0 + 3) k += 1;
      if (y >= y0 + H - 2) k -= y === y0 + H - 1 ? 2 : 1;   // (le bas, dans l'ombre du sol)
      t.poser(x, y, 'paille', borne(k));
    }
    // le bout : la paille repliée du pressage, plus sombre, et les deux ficelles debout
    for (let e = 0; e < 3; e++) for (let y = y0 + 2 - e; y < y0 + H - 1 - e + (e === 0 ? 1 : 0); y++) {
      const x = x0 + L + e; if (y < y0) continue;
      const fil = (y - y0) > 1 && (e === 1);
      t.poser(x, y, fil && (y % 4 === 1) ? 'ficelle' : 'bout', borne(fil && (y % 4 === 1) ? 2 : 2 + Math.round(fbm(e * 2, y * 0.7, g + 3) * 1.6) - (e === 2 ? 1 : 0) - (y >= y0 + H - 2 - e ? 1 : 0)));
    }
  };
  // Une botte vue par le bout : la face aux deux ficelles debout, piquetée de tiges ; le dessus et le flanc qui fuient
  const parLeBout = (t, x0, y0, W, H, g) => {
    for (let r = 0; r < 3; r++) for (let x = x0 + 2 - r; x < x0 + W + 2 - r; x++) {
      if (r === 0 && (x === x0 + 2 || x === x0 + W + 1)) continue;
      t.poser(x, y0 + r, 'paille', borne(4 + (hachage(x, r, g) > 0.72 ? 1 : 0) - (r === 2 ? 1 : 0)));
    }
    const fils = [x0 + Math.round(W * 0.28), x0 + Math.round(W * 0.72)];
    for (let y = y0 + 3; y < y0 + H; y++) for (let x = x0; x < x0 + W; x++) {
      if ((x === x0 || x === x0 + W - 1) && (y === y0 + 3 || y === y0 + H - 1)) continue;
      let k = 2 + Math.round(fbm(x * 0.35, y * 0.35, g) * 2.2) + (hachage(x, y, g + 1) > 0.7 ? 1 : 0) - (hachage(x, y, g + 2) > 0.9 ? 2 : 0);
      if (x === x0) k += 1; if (x === x0 + W - 1) k -= 1; if (y === y0 + 3) k += 1; if (y >= y0 + H - 2) k -= 1;
      t.poser(x, y, 'bout', borne(k));
    }
    for (const x of fils) { for (let y = y0 + 3; y < y0 + H - 1; y++) t.poser(x, y, 'ficelle', (y - y0) % 3 ? 2 : 3); for (let r = 0; r < 3; r++) t.poser(x + 2 - r, y0 + r, 'ficelle', 3); }
    for (let e = 0; e < 2; e++) for (let y = y0 + 2 - e; y < y0 + H - 1 - e; y++) t.poser(x0 + W + e, y, 'paille', borne(2 + Math.round((fbm(e, y * 0.9, g + 4) - 0.5) * 2) - e));
  };
  // des brins qui dépassent (posés après le contour : de simples fils de paille, sans cerne)
  const brins = (t, pts, g) => pts.forEach(([x, y, dx, dy, n], k) => { for (let i = 0; i < n; i++) t.poser(x + dx * i, y + dy * i, 'paille', i === n - 1 ? 4 : 5 - (hachage(k, i, g) > 0.6 ? 1 : 0)); });
  // la fourche à foin, appuyée contre le tas : un manche de frêne, et trois dents de fer recourbées
  // (posée après le contour, comme les brins : un trait fin, ses dents bien séparées)
  const fourche = (t, xb, yb, h) => {
    for (let k = 0; k < h; k++) { const x = Math.round(xb - k * 0.12); t.poser(x, yb - k, 'chene', 4); t.poser(x + 1, yb - k, 'cheneSombre', 1); }
    const xt = Math.round(xb - h * 0.12), yt = yb - h;
    for (let x = xt - 2; x <= xt + 3; x++) t.poser(x, yt, 'fer', x === xt - 2 ? 4 : 2);
    for (const dx of [-2, 1, 3]) for (let k = 1; k <= 5; k++) t.poser(xt + dx + (k >= 4 ? (dx < 0 ? -1 : dx > 1 ? 1 : 0) : 0), yt - k, 'fer', k > 3 ? 4 : 2);
  };
  // devant la façade : deux bottes couchées l'une sur l'autre, de côté, et la fourche
  { const L = 40, H = 31, t = T(L, H), sol = H - 1;
    deCote(t, 1, sol - 12, 29, 13, 8301);
    deCote(t, 5, sol - 24, 26, 12, 8302);
    t.contour();
    fourche(t, 36, sol, 22);
    brins(t, [[8, sol - 25, 1, -1, 2], [14, sol - 25, 0, -1, 2], [21, sol - 25, -1, -1, 3], [28, sol - 25, 1, -1, 2], [4, sol - 19, -1, 0, 2], [0, sol - 6, -1, 1, 1], [3, sol - 13, -1, -1, 2],
      [25, sol - 13, 0, -1, 2], [17, sol - 13, 1, -1, 2], [31, sol - 7, 1, 0, 1], [33, sol - 19, 1, 0, 1]], 8303);
    for (const x of [3, 8, 13, 19, 24, 29]) t.poser(x, sol, 'paille', 4 + (x % 2));   // (de la paille tombée au pied)
    t.texture(scene, 'bottesPailleFacade'); }
  // une charrette à foin, vue de côté, garée au bord de la rue (là où les bottes n'ont pas de mur contre lequel s'adosser) :
  // le plateau de planches, une ridelle basse, la grande roue cerclée de fer, les brancards posés au sol sur leur béquille,
  // et deux bottes bien calées
  { const L = 74, H = 46, t = T(L, H), sol = H - 1, wx = 22, wy = sol - 10, wr = 10, plat = sol - 21;
    // les bottes, derrière la ridelle
    deCote(t, 6, plat - 12, 26, 12, 8321);
    deCote(t, 9, plat - 23, 20, 11, 8322);
    // les brancards : deux longues perches qui descendent jusqu'au sol, et la béquille qui les soutient
    for (let k = 0; k < 24; k++) { const x = 48 + k, y = plat + 1 + Math.round(k * 0.7); for (let e = 0; e < 2; e++) t.poser(x, y + e, 'chene', e ? 2 : 4); }
    for (let y = sol - 8; y <= sol; y++) { t.poser(66, y, 'cheneSombre', 2); t.poser(67, y, 'chene', 3); }
    // le plateau (planches), la poutre dessous et l'essieu
    planche(t, 4, plat, 46, 4, 'chene', { graine: 8323, noeuds: 1 });
    for (let x = 4; x < 50; x++) { t.poser(x, plat + 4, 'cheneSombre', 2); t.poser(x, plat + 5, 'cheneSombre', 1); }
    for (let x = wx - 6; x < wx + 8; x++) t.poser(x, wy, 'fer', 1);
    // la ridelle : une planche haute de quatre rangs, à claire-voie, devant les bottes
    for (let x = 4; x < 50; x++) for (let y = plat - 5; y < plat; y++) { const mont = (x - 4) % 9 === 0 || x === 49; if (mont || y === plat - 5 || y === plat - 1) t.poser(x, y, 'chene', mont ? 2 : y === plat - 5 ? 4 : 2); }
    // la roue : jante de bois cerclée de fer, huit rayons, moyeu
    for (let y = wy - wr - 1; y <= wy + wr + 1; y++) for (let x = wx - wr - 1; x <= wx + wr + 1; x++) {
      const d = Math.hypot(x + 0.5 - wx, y + 0.5 - wy);
      if (d <= wr && d > wr - 1.5) t.poser(x, y, 'fer', (x + 0.5 < wx ? 3 : 1) + (y + 0.5 < wy ? 1 : 0));
      else if (d <= wr - 1.5 && d > wr - 3.4) t.poser(x, y, 'chene', (x + 0.5 < wx ? 4 : 2));
      else if (d <= 2.2) t.poser(x, y, 'chene', d < 1.2 ? 1 : 3);
    }
    for (let a = 0; a < 8; a++) for (let r = 2.2; r < wr - 3.2; r += 0.5) t.poser(Math.floor(wx + Math.cos(a * Math.PI / 4 + 0.2) * r), Math.floor(wy + Math.sin(a * Math.PI / 4 + 0.2) * r), 'chene', (a % 4 < 2 ? 4 : 2));
    t.poser(wx, wy, 'fer', 4);
    t.contour();
    // des brins de paille qui dépassent des bottes, et de la paille tombée de la charrette
    brins(t, [[10, plat - 24, 0, -1, 2], [16, plat - 24, 1, -1, 2], [22, plat - 24, 0, -1, 3], [7, plat - 13, -1, -1, 2], [30, plat - 12, 1, 0, 2]], 8324);
    for (const x of [wx - 12, wx - 4, wx + 6, wx + 14, 34]) { t.poser(x, sol, 'paille', 4); t.poser(x + 1, sol, 'paille', 3); }
    t.texture(scene, 'charretteFoin'); }
  // dans la rue : trois bottes vues par le bout (deux dessous, une dessus) et la fourche
  { const L = 34, H = 31, t = T(L, H), sol = H - 1;
    parLeBout(t, 1, sol - 12, 12, 13, 8311);
    parLeBout(t, 14, sol - 12, 12, 13, 8312);
    parLeBout(t, 7, sol - 24, 12, 12, 8313);
    t.contour();
    fourche(t, 31, sol, 23);
    brins(t, [[9, sol - 25, 0, -1, 2], [13, sol - 25, 1, -1, 2], [18, sol - 25, 1, -1, 3], [6, sol - 17, -1, 0, 2], [0, sol - 6, -1, 0, 1], [13, sol - 13, 0, -1, 2], [21, sol - 18, 1, 0, 1], [3, sol - 13, -1, -1, 2]], 8314);
    for (const x of [4, 11, 18, 24]) t.poser(x, sol, 'paille', 4);
    t.texture(scene, 'bottesPailleRue'); }
}

// L'espèce du k-ième arbre de `opts.arbres` ([x, échelle, espèce?]) : celle qu'on a demandée, sinon on alterne (chêne,
// pommier, bouleau, saule) selon la place dans la liste ; un arbre seul est un bouleau.
function especeDuArbre(opts, k) {
  const liste = opts.arbres || [], demandee = liste[k] && liste[k][2];
  return demandee || (liste.length === 1 ? 'bouleau' : ESPECES_ARBRE[k % ESPECES_ARBRE.length]);
}

// Où poser la paille devant la façade. D'abord des bottes à droite des tonneaux, adossées au coin de la maison, si la place
// est libre (ni arbre, ni maison voisine, ni pattes) ; sinon une charrette à foin garée au bord de la rue, au premier plan,
// là où il n'y a que des pavés (jamais devant un personnage, un texte ou un autre décor). Sinon, rien.
// Renvoie [[x, 'botte']] ou [[x, 'charrette', y]].
function placesBottesFacade(scene, opts, sol, L) {
  const f = opts.facade, tn = f && f.tonneaux;
  const libre = (g, d, haut, bas, sauf = []) => {   // (rien d'autre dans ce rectangle ?)
    for (const o of scene.children.list) {
      if (sauf.includes(o) || !o.visible || !['Image', 'Sprite', 'Container', 'Text'].includes(o.type) || !o.getBounds) continue;
      if (o.texture && /^(paves|paysage|arbreHD_)/.test(o.texture.key)) continue;   // (le paysage, les pavés : tout le fond ; les arbres : traités à part)
      if (o.scrollFactorX === 0 && o.type !== 'Text') continue;                      // (le voile, l'interface)
      const b = o.getBounds();
      if (b.right > g && b.left < d && b.bottom > haut && b.top < bas) return false;
    }
    return true;
  };
  if (tn && tn.active && tn.visible) {
    const w = 84, h = 60, x = tn.x + tn.displayWidth * (1 - tn.originX) + 4 + w / 2;
    let ok = x + w / 2 <= L - 6;
    // (un arbre : on ne recouvre pas son tronc, mais on peut s'adosser à lui)
    const arbres = opts.arbres || [];
    for (let k = 0; ok && k < arbres.length; k++) { const [ax, ech] = arbres[k], p = PARAMS_ARBRE[especeDuArbre(opts, k)] || PARAMS_ARBRE.chene;
      const Ha = Math.round(112 * ech), basA = sol + 30 * ech;
      if (Math.abs(ax - x) < w / 2 + Ha * p.w0) ok = false;   // (le tronc : les racines courent au ras du sol, plus bas que les bottes)
      // le feuillage : s'il descend plus bas que le haut des bottes et les recouvre, on ne les pose pas
      else if (basA - (p.cy - p.ry) * Ha * 2 > sol + 4 - h && Math.abs(ax + p.pen * Ha * 3 - x) < w / 2 + p.rx * Ha * 2 * 0.9) ok = false; }
    if (ok && libre(x - w / 2, x + w / 2, sol - h, sol - 2, [tn])) return [[x, 'botte']];
  }
  // la charrette : au bas de l'écran (les pavés), là où personne ne se tient
  const bas = Math.min(sol + 94, (scene.cameras.main.scrollY || 0) + 540 - 6), haut = bas - 92;
  if (haut > sol + 1) for (const x of [470, 620, 330, 780, 190]) if (x + 74 < L - 20 && libre(x - 74, x + 74, haut, bas)) return [[x, 'charrette', bas]];
  return [];
}
