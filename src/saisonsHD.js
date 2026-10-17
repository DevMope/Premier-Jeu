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
    // les meules de foin et une gerbe, au bord de la rue
    for (const [mx, r] of opts.meules || [[L * 0.17, 26], [L * 0.8, 22]]) {
      const my = sol + 6;
      g.fillStyle(0xa87a20).fillEllipse(mx, my - r * 0.4, r * 2.2, r * 1.6).fillStyle(0xd8a838).fillEllipse(mx - 3, my - r * 0.4 - 3, r * 2, r * 1.4);
      for (let k = 0; k < 10; k++) g.fillStyle(0xf0c850).fillRect(mx - r + k * r * 0.2, my - r * 0.9 + (k % 3) * 4, 6, 2);
      g.fillStyle(0x8a5a18).fillRect(mx - r, my + r * 0.15, r * 2, 3);
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

  // Les deux arbres du premier plan, au feuillage de saison
  const feuilles = { semailles: [0x7ac860, 0xa8e080, 0xf8c0d8], moissons: [0x3a8a30, 0x4ea040, 0x2e7228], brumes: [0xd0702a, 0xe8a030, 0xb04a20], givre: null }[s];
  for (const [x, ech] of opts.arbres || []) {
    const a = ajout(scene.add.graphics().setDepth(prof)), base = sol + 30 * ech;
    a.fillStyle(0x4a3220).fillRect(x - 7 * ech, base - 120 * ech, 14 * ech, 120 * ech);
    a.fillStyle(0x3a2616).fillRect(x - 7 * ech, base - 120 * ech, 4 * ech, 120 * ech);
    a.lineStyle(5 * ech, 0x4a3220);
    const branches = [[0, -90, -40, -150], [0, -100, 45, -160], [0, -120, -10, -190], [0, -70, 50, -110]];
    for (const [dx, dy, ex, ey] of branches) a.lineBetween(x + dx * ech, base + dy * ech, x + ex * ech, base + ey * ech);
    const touffes = [[-40, -150, 34], [45, -160, 36], [-10, -192, 40], [50, -112, 28], [-34, -112, 28], [8, -150, 36]];
    if (feuilles) for (const [i, [dx, dy, r]] of touffes.entries()) { a.fillStyle(feuilles[i % 3]).fillCircle(x + dx * ech, base + dy * ech, r * ech); a.fillStyle(feuilles[(i + 1) % 3], 0.8).fillCircle(x + (dx - 8) * ech, base + (dy - 8) * ech, r * 0.55 * ech); }
    if (s === 'semailles') for (let k = 0; k < 30; k++) a.fillStyle(0xffffff).fillCircle(x + rnd(-70, 80) * ech, base + rnd(-225, -90) * ech, 2.5 * ech);   // les fleurs de pommier
    if (s === 'brumes') for (let k = 0; k < 18; k++) a.fillStyle(0xd0702a).fillRect(x + rnd(-80, 80) * ech, base - rnd(0, 6), 5, 3);
    if (s === 'givre') { a.fillStyle(0xf8fbff); for (const [dx, , ex, ey] of branches) a.fillRect(x + Math.min(dx, ex) * ech, base + ey * ech - 4, Math.abs(ex - dx) * ech * 0.6, 4); a.fillRect(x - 8 * ech, base - 124 * ech, 16 * ech, 5); }
    fixe(a);
  }
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
