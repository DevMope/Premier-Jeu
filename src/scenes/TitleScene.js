// Le cadre du titre : laque rouge, double liseré d'or, frise de grecques, et deux dragons
// d'or à la chinoise qui se disputent la perle enflammée, au milieu, en haut.
function cadreDragonHD(scene) {
  if (scene.textures.exists('cadreDragon')) return 'cadreDragon';
  const L = 340, H = 116, M = L / 2;
  const t = toileDecor(L, H);
  t.rampes.or = [0x3a2006, 0x6e440c, 0xa8761c, 0xd8aa30, 0xf2d060, 0xfff2b8];
  t.rampes.laque = rampe(0x6e1212);
  t.rampes.perle = [0x2a3a5a, 0x5a7aa8, 0x9ab8e0, 0xd0e2f6, 0xf0f6ff, 0xffffff];
  t.rampes.flamme = [0x5a1004, 0x9a2a06, 0xd85a10, 0xf09a20, 0xffd060, 0xfff0b0];
  t.rampes.rouge = rampe(0xb02a1a);
  // Tout est symétrique : on dessine la moitié gauche, la droite en est le miroir.
  const g = x => (x < M ? x : L - 1 - x);
  const sx = x => (x < M ? 1 : -1);

  // Le panneau de laque, plus sombre sur les bords, avec des nuages porte-bonheur en filigrane
  t.forme('laque', (x, y) => {
    if (x < 7 || x > L - 8 || y < 9 || y > H - 8) return null;
    const bordure = Math.min(g(x) - 7, y - 9, H - 8 - y) / 24;
    const volute = Math.sin(g(x) * 0.18 + Math.sin(y * 0.2) * 2) * Math.sin(y * 0.22 + g(x) * 0.05);
    return [0, -0.2, 0.55 + Math.min(1, bordure) * 0.35 + (volute > 0.75 ? 0.08 : 0)];
  }, { bord: false });
  // Double liseré d'or : un jonc épais à l'extérieur, un filet à l'intérieur
  const jonc = (x, y) => {
    const d = Math.min(x, L - 1 - x, y, H - 1 - y);
    if (d >= 3 && d <= 7) { const u = (d - 5) / 2.5; return [x < 5 || x > L - 6 ? -u * sx(x) : 0, y < 8 ? -u : y > H - 9 ? u : 0, Math.sqrt(Math.max(0.1, 1 - u * u))]; }
    if (d === 12) return [0, -0.3, 0.9];
    return null;
  };
  t.forme('or', jonc, { bord: false });
  // La frise de grecques, en bas, entre les deux liserés
  const grecque = ['xxxxxx.', 'x....x.', 'x.xx.x.', 'x.x..x.', 'x.xxxx.', 'x......'];
  for (let x0 = 22; x0 + 6 < L - 22; x0 += 7) {
    grecque.forEach((l, j) => [...l].forEach((c, i) => { if (c === 'x') t.poser(x0 + i, H - 17 + j - 5, 'or', 3 + (j < 2 ? 1 : 0)); }));
  }
  // Les médaillons des coins, avec une gemme rouge
  for (const [cx, cy] of [[11, 11], [11, H - 12], [L - 12, 11], [L - 12, H - 12]]) {
    t.forme('or', ellipsoide(cx, cy, 7.5, 7.5), { decalage: 0.3 });
    t.forme('rouge', ellipsoide(cx, cy, 3.2, 3.2), { decalage: 0.8 });
  }

  // Le dragon : une ligne souple qui monte de la queue (en bas à gauche) jusqu'à la tête (vers le centre)
  const ctrl = [[16, 100], [12, 74], [20, 50], [12, 30], [30, 16], [52, 26], [72, 12], [94, 24], [112, 14], [128, 22], [140, 16]];
  const pts = [];
  for (let k = 0; k < ctrl.length - 1; k++) {
    const p0 = ctrl[Math.max(0, k - 1)], p1 = ctrl[k], p2 = ctrl[k + 1], p3 = ctrl[Math.min(ctrl.length - 1, k + 2)];
    for (let u = 0; u < 1; u += 0.04) {
      const u2 = u * u, u3 = u2 * u;
      const c = i => 0.5 * ((2 * p1[i]) + (-p0[i] + p2[i]) * u + (2 * p0[i] - 5 * p1[i] + 4 * p2[i] - p3[i]) * u2 + (-p0[i] + 3 * p1[i] - 3 * p2[i] + p3[i]) * u3);
      pts.push([c(0), c(1)]);
    }
  }
  const n = pts.length;
  const rayon = i => 1.6 + 4.2 * Math.sin(Math.min(1, (i / n) * 1.5) * Math.PI / 2);
  const proche = (x, y) => {
    let best = 1e9, bi = 0;
    for (let i = 0; i < n; i++) { const d = (pts[i][0] - x) ** 2 + (pts[i][1] - y) ** 2; if (d < best) { best = d; bi = i; } }
    return [Math.sqrt(best), bi];
  };
  // Pour un point : distance à l'échine, indice, et de quel côté (dos < 0, ventre > 0)
  const repere = (xl, y) => {
    const [d, i] = proche(xl + 0.5, y + 0.5);
    const [ax, ay] = pts[Math.max(0, i - 1)], [bx, by] = pts[Math.min(n - 1, i + 1)];
    const tx = bx - ax, ty = by - ay, tl = Math.hypot(tx, ty) || 1;
    const nx = ty / tl, ny = -tx / tl; // vers le dos
    const cote = (xl + 0.5 - pts[i][0]) * nx + (y + 0.5 - pts[i][1]) * ny;
    return { d, i, cote, nx, ny };
  };
  // La crête dorsale : des nageoires rouges, en dents de scie
  t.forme('rouge', (x, y) => {
    const { d, i, cote, nx, ny } = repere(g(x), y);
    if (i < 4 || i > n - 8) return null;
    const r = rayon(i);
    const dent = r + 1 + 3.2 * (1 - ((i % 4) / 4));
    return cote > 0 && d > r - 0.5 && d < dent ? [nx * sx(x), ny, 0.6] : null;
  }, { decalage: 0.1 });
  // Le corps écailleux, au ventre clair
  t.rampes.ventre = [0x6a4a14, 0x9a7a2a, 0xc8a850, 0xe6d08a, 0xf6e8b8, 0xfffae6];
  for (const [mat, ventre] of [['or', false], ['ventre', true]]) t.forme(mat, (x, y) => {
    const xl = g(x); const { d, i, cote } = repere(xl, y);
    const r = rayon(i);
    if (d > r) return null;
    if (ventre !== (cote < -r * 0.35)) return null;
    const u = d / r;
    const [px, py] = pts[i];
    return [((xl + 0.5 - px) / r) * sx(x), (y + 0.5 - py) / r, Math.sqrt(Math.max(0.05, 1 - u * u))];
  }, { bord: !ventre, motif: ventre ? (x, y) => ((g(x) + y) % 3 === 0 ? -0.8 : 0) : (x, y) => (((g(x) >> 1) + y) % 3 === 0 && (g(x) - y) % 2 === 0 ? -1.1 : 0) });
  // La flamme au bout de la queue
  t.forme('flamme', (x, y) => { const xl = g(x); const [px, py] = pts[0]; const dx = xl + 0.5 - px, dy = y + 0.5 - py; const r = Math.hypot(dx, dy); const a = Math.atan2(dy, dx); return r < 6 + Math.sin(a * 4) * 2 && dy > -3 ? [dx / 8 * sx(x), dy / 8, 0.6] : null; }, { decalage: 0.4 });
  // Quatre pattes griffues
  for (const f of [0.3, 0.38, 0.66, 0.74]) {
    const i = Math.floor(n * f), [px, py] = pts[i], r = rayon(i);
    const { nx, ny } = repere(px, py);
    const fx = px - nx * (r + 4), fy = py - ny * (r + 4);
    const kx = px - nx * (r + 1.2), ky = py - ny * (r + 1.2);
    t.forme('or', (x, y) => { const e = ellipsoide(kx, ky, 3.2, 3.2)(g(x), y) || ellipsoide((kx + fx) / 2, (ky + fy) / 2, 2.3, 2.3)(g(x), y) || ellipsoide(fx, fy, 2.6, 1.5)(g(x), y); return e ? [e[0] * sx(x), e[1], e[2]] : null; }, { decalage: 0.1 });
    for (const dx of [-2, 0, 2]) for (const xx of [fx + dx, L - 1 - (fx + dx)]) t.poser(Math.round(xx), Math.round(fy + 1.5), 'cire', 5);
  }
  // La tête : crinière de flammes rouges, crâne, long museau, gueule ouverte, cornes, œil de braise, moustaches
  const [hx, hy] = pts[n - 1];
  const miroir = (cx, cy, rx, ry) => (x, y) => { const e = ellipsoide(cx, cy, rx, ry)(g(x), y); return e ? [e[0] * sx(x), e[1], e[2]] : null; };
  for (const [dx, dy, r] of [[-7, -5, 3.4], [-9, -1, 3.2], [-7, 3, 3], [-4, -7, 3]]) t.forme('rouge', miroir(hx + dx, hy + dy, r, r), { decalage: 0.2 });
  t.forme('or', miroir(hx, hy - 1, 7.5, 6.2), { decalage: 0.2 });
  t.forme('or', miroir(hx + 9, hy - 1, 6, 3.6), { decalage: 0.35 });
  t.forme('rouge', miroir(hx + 7, hy + 2.5, 4, 1.4), { decalage: -0.6 });
  t.forme('or', miroir(hx + 6, hy + 4.6, 4.5, 1.5), { decalage: -0.1 });
  for (let k = 0; k < 9; k++) for (const xx of [hx - 2 - k, L - 1 - (hx - 2 - k)]) { t.poser(Math.round(xx), Math.round(hy - 6 - k * 0.75), 'ventre', 5); t.poser(Math.round(xx), Math.round(hy - 5 - k * 0.75), 'or', 2); }
  for (const xx of [hx + 2, L - 1 - (hx + 2)]) { const d = xx < M ? 1 : -1; t.poser(Math.round(xx), Math.round(hy - 3), 'cire', 5); t.poser(Math.round(xx) + d, Math.round(hy - 3), 'flamme', 4); t.poser(Math.round(xx) + d, Math.round(hy - 2), 'rouge', 0); }
  for (let k = 0; k < 16; k++) { const wx = hx + 12 + k * 0.85, wy = hy - 1 - Math.sin(k / 15 * Math.PI) * 6 - k * 0.25; for (const xx of [wx, L - 1 - wx]) t.poser(Math.round(xx), Math.round(wy), 'ventre', 4); }
  for (const xx of [hx + 10, hx + 6, L - 1 - (hx + 10), L - 1 - (hx + 6)]) t.poser(Math.round(xx), Math.round(hy + 2), 'cire', 5); // les crocs
  // La perle enflammée, au centre, que les deux dragons convoitent
  t.forme('flamme', (x, y) => { const d = Math.hypot(x + 0.5 - M, y + 0.5 - 13); const a = Math.atan2(y - 13, x - M); return d < 7.5 + Math.sin(a * 5) * 1.6 && d > 4 ? [Math.cos(a), Math.sin(a), 0.5] : null; }, { decalage: 0.6 });
  t.forme('perle', ellipsoide(M - 0.5, 12.5, 4.2, 4.2), { decalage: 0.5 });
  t.contour();
  t.texture(scene, 'cadreDragon');
  return 'cadreDragon';
}

// Écran titre : continuer la partie sauvegardée, en commencer une nouvelle, ou gérer les sauvegardes.
class TitleScene extends Phaser.Scene {
  constructor() { super('Titre'); }

  preload() { chargerFx(this); }   // (v0.70 : les effets de fumée et d'eau)

  create() {
    // (v0.93) la nature autour, selon l'heure de l'appareil ; elle se tait quand on quitte le titre
    Son.nature(true);
    this.events.once('shutdown', () => Son.nature(false));
    this.events.once('sleep', () => Son.nature(false));
    creerToutesLesTextures(this);

    const g = this.add.graphics();
    dessinerComte(g, 0, 0, 960, 540, 0.35);
    // Le titre, dans son cadre de laque aux dragons d'or
    this.add.image(480, 176, cadreDragonHD(this)).setScale(2);
    this.add.text(480, 168, 'Le Passage des Aventuriers', style(40, '#ffe8a0', { fontStyle: 'bold', stroke: '#3a0a06', strokeThickness: 6 })).setOrigin(0.5)
      .setShadow(0, 3, '#1a0402', 4, true, true);
    this.add.text(480, 216, 'Prépare leurs provisions. Parie sur leur retour.', style(20, '#f6e2c0', { fontStyle: 'italic', stroke: '#3a0a06', strokeThickness: 4 })).setOrigin(0.5);
    // La version du jeu, en bas à gauche
    this.add.text(14, 528, VERSION_JEU, style(15, '#fff4dc', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 4 })).setOrigin(0, 1);
    if (!this.scene.isActive('Hud')) this.scene.launch('Hud');

    this.texteSauvegarde = this.add.text(480, 318, 'Recherche de ta sauvegarde...', style(14, '#fff4dc', { fontStyle: 'italic', stroke: '#2a1a10', strokeThickness: 4 })).setOrigin(0.5);
    this.boutonContinuer = creerBouton(this, 480, 360, 300, 'Continuer', () => this.continuer());
    this.boutonContinuer.setVisible(false);
    creerBouton(this, 480, 410, 300, 'Nouvelle partie', () => allerA(this, 'Intro'));
    creerBouton(this, 400, 460, 150, 'Sauvegardes', () => this.ouvrirSauvegardes());
    creerBouton(this, 560, 460, 150, 'Réglages', () => { const h = this.scene.get('Hud'); if (h && h.ouvrirReglages) h.ouvrirReglages(); });
    this.chercher();
  }

  async chercher() {
    this.trouvees = await Sauvegarde.trouver();
    if (!this.scene.isActive()) return;
    const p = this.trouvees.meilleure;
    this.boutonContinuer.setVisible(!!p);
    if (p) this.boutonContinuer.setTexte(`Continuer · ${p.nom}, jour ${p.jour}`);
    this.texteSauvegarde.setText(p
      ? `Dernière sauvegarde : ${new Date(p.date).toLocaleString('fr-FR')}${this.trouvees.compte ? ' · aussi sur ton compte' : ''}`
      : 'Aucune sauvegarde pour le moment.');
  }

  continuer() {
    const p = this.trouvees && this.trouvees.meilleure;
    if (p) this.charger(p);
  }

  charger(p) {
    const lieu = Sauvegarde.charger(p);
    if (lieu === 'Maison') this.scene.start('Nuit', { matin: true });
    else this.scene.start(lieu, lieu === 'Nuit' ? { matin: false } : {});
  }

  ouvrirSauvegardes() {
    this.input.enabled = false;
    const codes = () => ouvrirFenetreSauvegardes(this.trouvees || { locale: Sauvegarde.lireLocale(), nuage: null, meilleure: Sauvegarde.lireLocale(), compte: false },
      p => { this.input.enabled = true; this.charger(p); },
      () => { this.input.enabled = true; this.chercher(); });
    // (v0.57) d'abord les emplacements et le point de reprise ; les codes sont un cran plus loin
    ouvrirFenetreEmplacements({ peutSauver: false, surCharger: p => { this.input.enabled = true; this.charger(p); }, surFermer: () => { this.input.enabled = true; }, surCodes: codes });
  }
}
