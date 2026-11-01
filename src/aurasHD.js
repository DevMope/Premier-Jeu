// Planche à valider : les auras (idée du joueur, 01/11). Une aura entoure un personnage et dit au joueur quel « type »
// de pouvoir il a (sa couleur) et à quel point il est puissant (sa taille, en cinq paliers), comme dans Hunter x Hunter,
// One Piece ou Dragon Ball.
// CE FICHIER N'EST PAS CHARGÉ PAR LE JEU (ni index.html ni web/jeu.html). Il s'appuie sur sageFormesHD.js (sfToile,
// hachage, rampeVive, halo) : à charger avant lui.
//
// Les couleurs, dans la logique de ces animés : chacune a un sens, les mélanges se lisent par leurs deux couleurs
// (l'extérieur des langues = la première, le cœur = la seconde ; « perce » : la seconde ne se voit qu'au cœur, par éclats).
const AURAS_COULEURS = {
  noirRouge: { nom: 'noir et rouge', sens: 'agressif, malsain, un pouvoir qui dévore', ext: 0x1a0a12, int: 0xd82020 },
  or: { nom: 'or', sens: 'noblesse et puissance, le pouvoir légitime', ext: 0xd8a020, int: 0xfff0a0 },
  violet: { nom: 'violet', sens: 'menaçant et puissant, un pouvoir qui domine', ext: 0x6a20b0, int: 0xd090ff },
  bleu: { nom: 'bleu', sens: 'la maîtrise, le calme, la magie des sorts', ext: 0x2050c0, int: 0x90d8ff },
  blanc: { nom: 'blanc', sens: 'pureté, éveil, un pouvoir sacré ou guérisseur', ext: 0xc8d8f0, int: 0xffffff },
  vert: { nom: 'vert', sens: 'la vie, la nature, la terre (sombre : le poison)', ext: 0x2a9a3a, int: 0xc0ffa0 },
  argent: { nom: 'argent', sens: 'ancienneté, protection, un pouvoir hérité', ext: 0x8a92a8, int: 0xf0f4ff },
  rouge: { nom: 'rouge', sens: 'la rage, le combat, la force brute', ext: 0xc02018, int: 0xffb060 },
  noir: { nom: 'noir', sens: 'le néant, la mort, ce qui efface', ext: 0x08060c, int: 0x3a2a4a },
  orange: { nom: 'orange', sens: 'la chaleur, la forge, la passion', ext: 0xe06010, int: 0xffe080 },
  orViolet: { nom: 'or, le violet qui perce', sens: 'une noblesse de façade, une menace dessous', ext: 0xd8a020, int: 0xc070ff, perce: true },
  bleuBlanc: { nom: 'bleu et blanc', sens: 'une magie maîtrisée et pure (la glace, la lumière)', ext: 0x3070d0, int: 0xffffff },
  vertNoir: { nom: 'vert et noir', sens: 'le poison, la corruption de la nature', ext: 0x0c1a10, int: 0x60e040 },
  rougeOr: { nom: 'rouge et or', sens: 'un guerrier noble, la force au service d’un rang', ext: 0xc02018, int: 0xffd060 },
  violetNoir: { nom: 'violet et noir', sens: 'une domination sans retour, la magie interdite', ext: 0x0a0612, int: 0x9a40e0 },
  argentBleu: { nom: 'argent et bleu', sens: 'un don ancien et maîtrisé (une magie spéciale)', ext: 0x8a92a8, int: 0x70c0ff },
};
// Les cinq paliers de puissance : la taille de l'aura, ce qui s'y ajoute
const AURAS_PALIERS = [
  null,
  { nom: '1. le halo', desc: 'un halo discret autour du corps', h: 0, l: 0, halo: 0.75 },
  { nom: '2. la lueur', desc: 'des langues courtes qui montent le long du corps', h: 0.45, l: 0.6, halo: 0.9 },
  { nom: '3. l’aura', desc: 'des flammes qui l’enveloppent, plus hautes que lui', h: 0.95, l: 0.85, halo: 1.3 },
  { nom: '4. la tempête', desc: 'l’aura double, des éclairs, des étincelles', h: 1.35, l: 1.15, halo: 1.9, eclairs: 4, etincelles: 40 },
  { nom: '5. le déchaînement', desc: 'elle remplit l’écran, la foudre, les débris qui lévitent', h: 1.9, l: 1.7, halo: 2.8, eclairs: 8, etincelles: 90, debris: 14, sol: true },
];
// Les langues d'une aura : comme les flammes du Sage, mais à deux couleurs (extérieur, cœur) et autour de tout le corps :
// elles partent des pieds et des flancs. (W, H) la toile ; (cx, sol) les pieds ; (lc, hc) la largeur et la hauteur du corps
function auraLanguesHD(t, cx, sol, lc, hc, couleur, palier, graine = 3) {
  const C = AURAS_COULEURS[couleur], P = AURAS_PALIERS[palier];
  const ext = rampeVive(C.ext), int = rampeVive(C.int);
  t.rampes.auraE = ext; t.rampes.auraI = int; t.rampes.auraB = [0xffffff, 0xffffff, 0xffffff, 0xffffff, 0xffffff, 0xffffff];
  const largeur = lc * P.l, hauteur = hc * P.h, langues = [];
  const n = 7 + palier * 3;
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1) - 0.5, x0 = cx + u * largeur * 1.3 + (hachage(i, 7, graine) - 0.5) * 10;
    const flanc = Math.abs(u) > 0.3;   // (sur les flancs, les langues partent plus haut, le long du corps)
    const base = flanc ? sol - hc * (0.15 + hachage(i, 8, graine) * 0.55) : sol;
    const h = hauteur * (0.45 + 0.55 * Math.cos(u * 2.2)) * (0.6 + 0.6 * hachage(i, 1, graine)) * (flanc ? 0.7 : 1), w = largeur * (0.075 + 0.05 * hachage(i, 2, graine)) * (palier <= 3 ? 1.3 : 1);
    langues.push({ x0, h, w, base, ph: hachage(i, 3, graine) * 6.3, tors: 0.2 + hachage(i, 4, graine) * 0.6, pench: u * 0.35 });
  }
  const y0 = Math.max(0, Math.floor(sol - hauteur * 1.2)), x0 = Math.max(0, Math.floor(cx - largeur)), x1 = Math.min(t.l - 1, Math.ceil(cx + largeur));
  for (let y = Math.min(t.h - 1, sol + 2); y > y0; y--) for (let x = x0; x <= x1; x++) {
    let best = null;
    for (const L of langues) { const v = (L.base - y) / L.h; if (v < 0 || v > 1) continue;
      const xc = L.x0 + Math.sin(v * 6 + L.ph) * L.w * L.tors * v * 2.5 + L.pench * v * 50, ww = L.w * (1 - v * v) * (0.7 + 0.5 * Math.sin(v * 3.14 + L.ph)) + 0.6;
      const r = Math.abs(x + 0.5 - xc) / ww; if (r < 1 && (!best || r + v * 0.6 < best.r + best.v * 0.6)) best = { r, v }; }
    if (!best) continue;
    const { r, v } = best, bruit = (hachage(x, y, graine) - 0.5) * 0.7, pointe = v > 0.82 && r < 0.45;
    if (pointe && palier >= 3) { t.poser(x, y, 'auraB', 5); continue; }
    if (C.perce) { const perce = hachage(Math.floor(x / 3), Math.floor(y / 5), graine + 2) > 0.8 && r < 0.4; t.poser(x, y, perce ? 'auraI' : 'auraE', Math.max(0, Math.min(5, Math.round(4.6 - r * 3 - v * 1.4 + bruit)))); continue; }
    if (r < 0.42 - v * 0.2) t.poser(x, y, 'auraI', Math.max(0, Math.min(5, Math.round(4.5 - r * 4 - v * 1.2 + bruit))));
    else t.poser(x, y, 'auraE', Math.max(0, Math.min(5, Math.round(4.3 - r * 3 - v * 1.4 + bruit))));
  }
  // les étincelles qui montent, les éclairs, les débris qui lévitent
  if (P.etincelles) for (let i = 0; i < P.etincelles; i++) { const m = hachage(i, 12, graine), bx = cx + (hachage(i, 11, graine) - 0.5) * largeur * 2.6, by = sol - m * hauteur * 1.4 - 4;
    const x = Math.round(bx + Math.sin(m * 9 + i) * 10), y = Math.round(by); if (y < 0 || x < 0 || x >= t.l) continue; t.poser(x, y, m > 0.5 ? 'auraB' : 'auraI', 5); if (m < 0.4) t.poser(x + 1, y, 'auraI', 3); }
  if (P.eclairs) for (let e = 0; e < P.eclairs; e++) {
    let x = cx + (hachage(e, 21, graine) - 0.5) * largeur * 1.6, y = sol - hc * (0.1 + hachage(e, 22, graine) * 0.9);
    const a0 = (hachage(e, 23, graine) - 0.5) * 2.2 - Math.PI / 2, pas = 8 + Math.round(hachage(e, 24, graine) * 8);
    for (let j = 0; j < pas; j++) { const a = a0 + (hachage(e, j + 30, graine) - 0.5) * 1.8, l = 10 + hachage(e, j + 50, graine) * 18, nx = x + Math.cos(a) * l, ny = y + Math.sin(a) * l;
      for (let s = 0; s <= l; s++) { const px = Math.round(x + (nx - x) * s / l), py = Math.round(y + (ny - y) * s / l); t.poser(px, py, 'auraB', 5); t.poser(px + 1, py, 'auraB', 5); t.poser(px - 1, py, 'auraI', 4); t.poser(px, py + 1, 'auraI', 4); t.poser(px, py - 1, 'auraI', 3); }
      x = nx; y = ny; }
  }
  if (P.debris) { t.rampes.debris = rampeVive(0x3a3240);
    for (let d = 0; d < P.debris; d++) { const a = hachage(d, 41, graine) * 6.28, dist = largeur * (0.5 + hachage(d, 42, graine) * 0.9), rx = 2 + hachage(d, 43, graine) * 6;
      const x = cx + Math.cos(a) * dist, y = sol - 10 - Math.abs(Math.sin(a)) * hauteur * 0.5 - hachage(d, 44, graine) * hc * 0.6;
      t.forme('debris', ellipsoide(x, y, rx, rx * 0.7), { decalage: 0.2 }); } }
  return t;
}
// Pose une aura autour d'une image de personnage posée par les pieds (img : origine 0.5, 1), dans une scène
function auraHD(s, img, couleur, palier, { graine = 3, prof = null, cle = null } = {}) {
  const C = AURAS_COULEURS[couleur], P = AURAS_PALIERS[palier], p0 = prof ?? img.depth;
  const lc = img.displayWidth * 0.75, hc = img.displayHeight, cx = img.x, sol = img.y;
  const objets = [];
  const halo = (x, y, sx, sy, teinte, alpha, prof) => objets.push(s.add.image(x, y, 'halo').setScale(sx, sy).setTint(teinte).setAlpha(alpha).setBlendMode(Phaser.BlendModes.ADD).setDepth(prof));
  halo(cx, sol - hc * 0.5, hc / 130 * P.halo * 1.2, hc / 130 * P.halo * 1.5, C.ext, 0.6, p0 - 0.3);
  halo(cx, sol - hc * 0.45, hc / 130 * P.halo * 0.6, hc / 130 * P.halo * 0.9, C.int, 0.5, p0 - 0.25);
  if (P.sol) halo(cx, sol + 2, hc / 130 * P.halo * 1.6, hc / 130 * 0.5, C.int, 0.45, p0 - 0.2);
  if (palier >= 2) {
    const W = Math.ceil(lc * P.l * 3.6 + 80), H = Math.ceil(hc * P.h * 1.5 + hc + 20), t = sfToile(W, H, { relief: false });
    auraLanguesHD(t, W / 2, H - 12, lc, hc, couleur, palier, graine);
    const k = cle || ('aura_' + couleur + '_' + palier + '_' + graine + '_' + Math.round(hc)); t.texture(s, k);
    objets.push(s.add.image(cx, sol + 12, k).setOrigin(0.5, 1).setDepth(p0 - 0.1).setAlpha(0.92));
    // quelques langues devant lui, au bas du corps
    if (palier >= 3) { const t2 = sfToile(W, 80, { relief: false }); auraLanguesHD(t2, W / 2, 70, lc * 0.8, hc * 0.25, couleur, 2, graine + 9); t2.texture(s, k + '_av'); objets.push(s.add.image(cx, sol + 10, k + '_av').setOrigin(0.5, 1).setDepth(p0 + 0.1).setAlpha(0.8)); }
    halo(cx, sol - hc * 0.4, hc / 130 * P.halo * 0.5, hc / 130 * P.halo * 0.7, C.int, 0.22, p0 + 0.05);   // (la lumière sur lui)
  }
  return objets;
}
