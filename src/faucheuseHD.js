// Planche à valider : la Faucheuse en HD. CE FICHIER N'EST PAS CHARGÉ PAR LE JEU (ni index.html ni web/jeu.html).
// Il s'appuie sur sageFormesHD.js (sfToile, sfTubeForme, sfBezier, sfChemin, sfPoly, sfEll, sfMotifFourrure, sfContour,
// sfColler) et sur le moteur du jeu (ToileHD, ellipsoide, fbm, hachage, rampeVive).
//
// Ce qui reste du vieux sprite : la capuche noire, les yeux rouges, la faux. Le reste est neuf : une robe noire à
// reflets bleu-nuit, lourde, dont l'ourlet s'effiloche en brume ; une capuche profonde à longue pointe, bordée d'un
// liseré de givre ; une broche d'argent qui tient un pétale noir ; une fine chaîne d'argent à la taille, un petit
// sablier qui y pend ; des mains fines et pâles. Deux visages possibles : un crâne fin et pâle sous la capuche (les
// orbites rouges), ou l'ombre pure, seulement les yeux. La faux : un long manche de bois noir cerclé d'argent, une lame
// longue et mince, au fil de givre bleu, gravée d'une rune, un croissant d'argent à la jointure. Majestueuse, pas
// horrifique : droite, immobile, les mains posées sur la faux.
const FH_RAMPES = {
  robe: [0x050408, 0x0c0a12, 0x14121e, 0x1c1a2a, 0x2a2840, 0x3e3c58],
  robeC: [0x08060c, 0x100e18, 0x1a1826, 0x262436, 0x363450, 0x4c4a6a],   // (la capuche, un peu plus claire : elle se détache de la robe)
  os: [0x030205, 0x06050a, 0x0b0a10, 0x111017, 0x18161f, 0x201e29],   // (v3 : presque opaque, on le devine à peine dans la pénombre)   // (v2 : un os dans la pénombre de la capuche, jamais plus clair que l'ambiance)
  osR: [0x0c0507, 0x12070a, 0x1a090c, 0x240c0f, 0x301012, 0x3e1416],   // (v3 : la lueur des yeux effleure l'os)
  doublure: [0x020104, 0x06030c, 0x0c0616, 0x140a22, 0x1c0e2e, 0x26143c],   // (v4 : la doublure, plus sombre, un peu violette)
  cuirF: [0x0a0606, 0x160c0c, 0x221414, 0x301c1a, 0x3e2622, 0x50322c],   // (la poignée)
  lune: [0x3e4460, 0x6a7290, 0x98a0bc, 0xc0c8da, 0xdee2ee, 0xf4f6fc],   // (la lame : un morceau de lune, blanc nacré)
  luneN: [0x7a6c90, 0xa898c0, 0xd0c4e0, 0xeae0f4, 0xf6f0fc, 0xffffff],   // (les reflets nacrés, rosés)   // (l'os éclairé par les orbites)
  osMain: [0x3a3844, 0x52505e, 0x6c6a78, 0x8a8896, 0xa4a2ae, 0xbcbac4],
  orbite: [0x1a0608, 0x3a0a0c, 0x6a0e10, 0x9a1414, 0xd01c18, 0xff3a2a],
  oeilR: [0x4a0a0a, 0x8a1010, 0xc81c14, 0xff3a2a, 0xff7a60, 0xffd0c0],
  givre: [0x2a4a6a, 0x4a7aa0, 0x78aacc, 0xa8d4ec, 0xd4ecf8, 0xf4fcff],
  argentF: [0x2a2c38, 0x50525e, 0x7c7e8c, 0xa8aab6, 0xcccdd6, 0xf0f0f6],
  lame: [0x3a3c48, 0x5c5e6c, 0x8a8c9a, 0xb8bac6, 0xdadce4, 0xf6f8fc],
  manche: [0x0a0806, 0x16120c, 0x221c14, 0x2e261c, 0x3c3226, 0x4e4234],
  petale: [0x050306, 0x0c0810, 0x160e1c, 0x221628, 0x2e1e38, 0x3c2a48],
  sable: [0x6a5a30, 0x9a8448, 0xc0a860, 0xdcc478, 0xecd890, 0xf8ecb0],
  ombreP: [0x000000, 0x020204, 0x040408, 0x06060c, 0x0a0a12, 0x10101a],
};
function fhToile(l, h) { const t = sfToile(l, h, { cel: false }); Object.assign(t.rampes, FH_RAMPES); return t; }
// Le givre : de petits cristaux (trois pointes), posés à plat
function fhCristal(t, x, y, h, decalage = 0.6) {
  for (let j = 0; j < 3; j++) { const px = x + (j - 1) * h * 0.4, hh = h * (j === 1 ? 1 : 0.55), a = (j - 1) * 0.35;
    t.forme('givre', sfPoly([[px - h * 0.18, y], [px + h * 0.18, y], [px + Math.sin(a) * hh * 0.5 + h * 0.08, y - hh], [px + Math.sin(a) * hh * 0.5 - h * 0.08, y - hh]], [-0.3, -0.4, 0.85]), { decalage, ombre: false }); }
}
// La faux : A le bout du manche (en bas), B le haut (la jointure) ; la lame part de B vers `cote` et se courbe vers le bas
function fhFaux(t, A, B, k, cote = 1, { lame = true, eteinte = false } = {}) {   // (eteinte : la lame mate, d'un blanc éteint, en temps normal)
  // le manche : une colonne d'os emboîtés (des vertèbres), un fil sombre au milieu, des cercles d'argent
  const n = Math.max(6, Math.round(Math.hypot(B[0] - A[0], B[1] - A[1]) / (3.2 * k)));
  sfTubeForme(t, 'manche', [A, B], u => 1.2 * k, { decalage: -0.4, ombre: false });
  for (let i = 0; i <= n; i++) { const u = i / n, x = A[0] + (B[0] - A[0]) * u, y = A[1] + (B[1] - A[1]) * u;
    if (u > 0.12 && u < 0.3) continue;   // (là, la poignée)
    t.forme('osMain', sfEll(x, y, 2 * k, 2.1 * k), { decalage: 0.1, motif: (px, py) => (py + 0.5 > y + 0.6 * k ? -0.9 : px + 0.5 < x - 0.5 * k ? 0.3 : 0) });
    for (const c of [-1, 1]) sfTubeForme(t, 'osMain', [[x + c * 1.8 * k, y - 0.6 * k], [x + c * 2.7 * k, y - 0.2 * k]], v => 0.45 * k, { decalage: -0.3, ombre: false }); }   // (les apophyses)
  // la poignée de la main du bas : une bande de cuir sombre enroulée en spirale, entre deux bagues
  { const P1 = [A[0] + (B[0] - A[0]) * 0.12, A[1] + (B[1] - A[1]) * 0.12], P2 = [A[0] + (B[0] - A[0]) * 0.3, A[1] + (B[1] - A[1]) * 0.3];
    sfTubeForme(t, 'cuirF', [P1, P2], v => 1.8 * k, { decalage: 0.2, motif: i => (i && ((i.s + i.o * 3 * k) / (1.6 * k)) % 1 < 0.25 ? -0.9 : 0) }); }
  for (const u of [0.04, 0.12, 0.3, 0.55, 0.97]) { const x = A[0] + (B[0] - A[0]) * u, y = A[1] + (B[1] - A[1]) * u; sfTubeForme(t, 'argentF', [[x, y - 1.1 * k], [x, y + 1.1 * k]], v => (u === 0.55 ? 2.9 : 2.5) * k, { decalage: 0.4 }); }   // (les colliers d'argent : un au milieu, plus large)
  if (!lame) return;
  // (v3) la jointure, nette : le dernier os s'arrête, un collier d'argent épais, une douille d'argent sombre où entre la
  // lame ; un vide sombre entre l'os et l'argent, pour bien les séparer
  const ux = (B[0] - A[0]), uy = (B[1] - A[1]), ul = Math.hypot(ux, uy), dx = ux / ul, dy = uy / ul;
  const J = [B[0] + dx * 2.2 * k, B[1] + dy * 2.2 * k];
  sfTubeForme(t, 'manche', [B, J], u => 0.7 * k, { decalage: -1, ombre: false });
  sfTubeForme(t, 'argentF', [[J[0] - dx * 0.8 * k, J[1] - dy * 0.8 * k], [J[0] + dx * 1.6 * k, J[1] + dy * 1.6 * k]], u => 2.3 * k, { decalage: 0.5 });
  t.forme('argentF', sfPoly([[J[0] - 2.4 * k, J[1]], [J[0] + 2.4 * k, J[1]], [J[0] + cote * 4.5 * k, J[1] - 4 * k], [J[0] - cote * 1 * k, J[1] - 3.2 * k]], [0, -0.4, 0.9]), { decalage: 0.1 });   // (la douille)
  // la lame : un grand croissant de lune, plus long que son porteur n'est large ; le dos épais, le fil qui s'affine
  const L = 66 * k, P0 = [J[0] + cote * 1.5 * k, J[1] - 3.5 * k];
  const pts = sfBezier(P0, [P0[0] + cote * L * 0.25, P0[1] - 22 * k], [P0[0] + cote * L * 0.85, P0[1] - 20 * k], [P0[0] + cote * L * 1.0, P0[1] + 12 * k], 36);
  const tb = sfTube(pts, u => (5.6 * k) * Math.pow(Math.sin(Math.PI * Math.min(1, 0.06 + u * 0.98)), 0.7) + 0.4);
  const cr = []; for (let i = 0; i < 9; i++) { const q = pts[4 + Math.floor(hachage(i, 1, 13) * 26)]; cr.push([q[0] + (hachage(i, 2, 13) - 0.5) * 4 * k, q[1] + (hachage(i, 3, 13) - 0.3) * 4 * k, (0.5 + hachage(i, 4, 13) * 1.1) * k]); }
  const motifLune = (i, x, y) => { if (!i) return 0; let m = (fbm(x * 0.06, y * 0.06, 21, 3) - 0.5) * 0.9;
    for (const [cx, cy, r] of cr) { const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / r; if (d < 1) m += d > 0.7 ? 0.5 : -1.1; }   // (les cratères ténus : un creux, un rebord clair)
    return m + (i.o * cote < -0.6 ? -0.8 : 0); };
  sfForme(t, 'lune', (x, y) => tb.info(x, y), { garder: i => i.dedans, decalage: eteinte ? -1.7 : -0.9, tramage: true, motif: motifLune });
  if (!eteinte) sfForme(t, 'luneN', (x, y) => tb.info(x, y), { garder: (i, x, y) => i.dedans && fbm(x * 0.05, y * 0.09, 33, 2) > 0.62, decalage: -0.6, tramage: true, ombre: false, bord: false, motif: motifLune });   // (la nacre)
  sfForme(t, 'givre', (x, y) => tb.info(x, y), { garder: i => i.dedans && i.o * cote > 0.78, decalage: eteinte ? 0.2 : 1.3, ombre: false, bord: false });
  const q = tb.pts[10]; for (const [ddx, ddy] of [[0, -1], [0, 0], [0, 1], [1, 0], [-1, 0]]) t.poser(Math.round(q[0] + ddx * k * 0.8), Math.round(q[1] + ddy * k * 0.8 + 1 * k), 'givre', 1);   // (la rune, gravée, bleutée)
  t.lameFaux = pts;   // (pour sa lueur : le halo lunaire qui pulse, les poussières de lumière)
  return pts;
}
// La lueur de la faux, dans une scène : un halo froid le long de la lame (qui pulse), des poussières de lumière qui
// s'en détachent et dérivent. pts : la lame dans la texture ; (x0, y0) : où est le coin haut-gauche de la texture ; e : l'échelle
function fhLueurFaux(s, pts, x0, y0, e, { prof = 4, pulse = true, poussieres = 22, allumee = true, grande = 1 } = {}) {   // (allumee : seulement quand elle se dévoile ; grande : la taille des poussières)
  const objets = []; if (!allumee || !pts) return objets;
  for (let i = 2; i < pts.length - 2; i += 3) { const [x, y] = pts[i], f = Math.sin(Math.PI * i / pts.length);
    const h = s.add.image(x0 + x * e, y0 + y * e, 'halo').setScale(0.55 * e * f + 0.15, 0.45 * e * f + 0.12).setTint(0xd8e4ff).setAlpha(0.2).setBlendMode(Phaser.BlendModes.ADD).setDepth(prof); objets.push(h);
    if (pulse) s.tweens.add({ targets: h, alpha: 0.1, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: i * 30 }); }
  const [mx, my] = pts[Math.floor(pts.length * 0.5)];
  objets.push(s.add.image(x0 + mx * e, y0 + my * e, 'halo').setScale(2.2 * e, 1.4 * e).setTint(0xa8b8ff).setAlpha(0.16).setBlendMode(Phaser.BlendModes.ADD).setDepth(prof - 0.05));
  for (let i = 0; i < poussieres; i++) { const q = pts[2 + Math.floor(hachage(i, 1, 41) * (pts.length - 4))], dx = (hachage(i, 2, 41) - 0.5) * 22, dy = -hachage(i, 3, 41) * 26 - 2;
    const p = s.add.rectangle(x0 + (q[0] + dx * 0.3) * e, y0 + (q[1] + dy * 0.3) * e, hachage(i, 4, 41) > 0.7 ? 2 : 1, hachage(i, 4, 41) > 0.7 ? 2 : 1, hachage(i, 5, 41) > 0.5 ? 0xffffff : 0xc8d8ff).setAlpha(0.5 + hachage(i, 6, 41) * 0.5).setDepth(prof + 0.1).setScale(2 * grande); objets.push(p);
    s.tweens.add({ targets: p, x: p.x + dx * e * 0.4, y: p.y + dy * e * 0.4, alpha: 0.15, duration: 2200 + hachage(i, 7, 41) * 1800, repeat: -1, delay: hachage(i, 8, 41) * 2000 }); }
  return objets;
}
// La Faucheuse en pied : vue 'face' ou 'troisQuarts' (elle regarde à droite) ; visage 'crane' ou 'ombre' ;
// dissolution de 0 (entière) à 1 (dissoute dans l'ombre) ; faux : la tient-elle
function faucheuseCorpsHD(vue = 'face', { visage = 'crane', dissolution = 0, faux = true, souvenirs = ['petale', 'sablier', 'plume'], devoilee = false } = {}) {   // (souvenirs : ceux qu'elle porte encore, pas encore donnés)
  const k = 2, L = 250, H = 302, sol = 290, dir = vue === 'troisQuarts' ? 1 : 0, s = dir ? 1.4 : 0;   // (s : le décalage du visage vers où elle regarde)
  const t = fhToile(L, H), fond = fhToile(L, H), dev = fhToile(L, H);
  const cx = 66 + (dir ? 2 : 0), cy = 146;   // (la tête : haute, elle est grande)
  // --- derrière : la pointe de la capuche qui retombe dans le dos, la faux (de trois-quarts, la lame devant) ---
  const ptX = cx - (dir ? 18 : 0) * k;
  sfTubeForme(fond, 'robeC', sfBezier([cx - (dir ? 6 : 0) * k, cy - 10 * k], [cx - 8 * k, cy - 2 * k], [ptX - 4 * k, cy + 12 * k], [ptX - 2 * k, cy + 26 * k], 14), u => (dir ? 4.2 : 3.2) * k * (1 - u * 0.85) + 0.5, { decalage: -0.2 });
  const fauxA = [cx + (dir ? 11 : 15) * k, sol - 1], fauxB = [cx + (dir ? 9 : 13) * k, cy - 46 * k];
  if (faux) fhFaux(dev, fauxA, fauxB, k, 1, { eteinte: !devoilee });   // (la faux devant elle : elle la tient à deux mains)
  // --- la robe : large aux épaules, étroite à la taille, qui s'évase jusqu'au sol et s'effiloche en brume ---
  const robe = (x, y) => { if (y < cy + 6 * k || y > sol) return null; const v = (y - cy - 6 * k) / (sol - cy - 6 * k);
    const demi = (13 - 3 * Math.sin(v * 3.1) * (v < 0.5 ? 1 : 0) + v * v * 22) * k + (v > 0.55 ? (v - 0.55) * 20 * k : 0), ax = cx + s * k * 2 * (1 - v);
    const dx = (x + 0.5 - ax) / demi; if (Math.abs(dx) > 1) return null;
    // (v4) les lambeaux : des déchirures longues et irrégulières au bas de la cape
    const dech = (0.4 + 0.6 * hachage(Math.floor(x / 5), 3, 7)) * 16 * k * (0.5 + 0.5 * Math.abs(Math.sin(x * 0.21 + hachage(Math.floor(x / 9), 4, 7) * 3)));
    if (y > sol - dech) return null;
    // les plis lourds : ils partent des épaules et s'écartent vers le bas ; la normale tourne d'un pli à l'autre
    const ph = dx * (4 + v * 3) * Math.PI + Math.sin(y * 0.03) * 0.6, nx = dx * 0.55 + Math.sin(ph) * 0.55 * Math.min(1, v * 3);
    return [nx, -0.12, Math.sqrt(Math.max(0.05, 1 - nx * nx))]; };
  t.forme('robe', robe, { decalage: -0.15, motif: (x, y) => (fbm(x * 0.05, y * 0.05, 4, 2) - 0.5) * 0.6 });
  // les effilochures : de fins fils qui pendent sous les lambeaux et se perdent (la brume, dans la scène)
  for (let i = 0; i < 26; i++) { const x = cx - 30 * k + hachage(i, 1, 17) * 60 * k; let y0 = sol; while (y0 > cy && !(t.m[Math.round(y0) * L + Math.round(x)])) y0--; if (y0 <= cy) continue; const l = (3 + hachage(i, 2, 17) * 9) * k;
    sfTubeForme(t, 'robe', sfBezier([x, y0], [x + 1 * k, y0 + l * 0.4], [x - 1 * k, y0 + l * 0.7], [x + (hachage(i, 3, 17) - 0.5) * 3 * k, y0 + l], 8), u => (0.7 - u * 0.5) * k + 0.25, { decalage: -0.4 - hachage(i, 4, 17) * 0.4, ombre: false }); }
  // la chaîne d'argent à la taille, le petit sablier qui pend
  const yT = cy + 34 * k; for (let x = cx - 8 * k; x <= cx + 8 * k; x += 2) { const y = yT + Math.abs(x - cx) * 0.18; t.poser(Math.round(x + s * k), Math.round(y), 'argentF', (x / 2) % 2 ? 4 : 2); }
  const sx = cx + 5 * k + s * k, sy = yT + 2 * k;
  if (souvenirs.includes('plume')) { const px = cx - 6 * k + s * k; sfTubeForme(t, 'argentF', [[px, yT + 1 * k], [px, yT + 3 * k]], u => 0.4 * k, { decalage: 0.3 });   // (la plume grise, pendue à la chaîne)
    const pl = sfBezier([px, yT + 3 * k], [px - 1 * k, yT + 7 * k], [px - 1.5 * k, yT + 11 * k], [px - 3 * k, yT + 15 * k], 12); sfTubeForme(t, 'osMain', pl, u => (0.4 + 1.6 * Math.sin(Math.PI * Math.min(1, u * 1.1))) * k, { decalage: 0.2, ombre: false, motif: i => (i && Math.abs(i.o) < 0.12 ? -0.9 : i && (i.s / (1.4 * k)) % 1 < 0.3 ? -0.4 : 0.2) }); }
  if (souvenirs.includes('sablier')) { sfTubeForme(t, 'argentF', [[sx, sy], [sx, sy + 3 * k]], u => 0.5 * k, { decalage: 0.3 });
  t.forme('argentF', sfPoly([[sx - 1.6 * k, sy + 3 * k], [sx + 1.6 * k, sy + 3 * k], [sx + 0.3 * k, sy + 5.2 * k], [sx + 1.6 * k, sy + 7.4 * k], [sx - 1.6 * k, sy + 7.4 * k], [sx - 0.3 * k, sy + 5.2 * k]], [0, -0.3, 0.9]), { decalage: 0.4 });
  t.forme('sable', sfPoly([[sx - 0.9 * k, sy + 5.9 * k], [sx + 0.9 * k, sy + 5.9 * k], [sx + 1.1 * k, sy + 7 * k], [sx - 1.1 * k, sy + 7 * k]], [0, 0, 1]), { decalage: 0.5, ombre: false, bord: false }); }
  // --- les manches larges et les mains fines, posées sur la faux (ou croisées) ---
  for (const cote of [-1, 1]) {
    const ex = cx + cote * 11 * k + s * k * 1.5, ey = cy + 12 * k, mx = faux ? cx + (dir ? 9 : 13) * k + (cote < 0 ? -1.5 * k : 1.5 * k) : cx + cote * 4 * k, my = faux ? cy + 20 * k + (cote < 0 ? 6 * k : 0) : cy + 30 * k;
    const pts = sfBezier([ex, ey], [ex + cote * 5 * k, ey + 6 * k], [mx + cote * 2 * k, my - 4 * k], [mx, my], 10);
    sfTubeForme(t, 'robe', pts, u => (4.2 + u * 1.6) * k, { decalage: -0.1 + (cote > 0 ? 0.15 : -0.1), motif: i => (i && Math.abs(i.o) > 0.7 ? -0.6 : 0) });
    // la main : une paume étroite et pâle, quatre doigts longs qui se referment sur le manche
    const mat = visage === 'ombre' ? 'robeC' : 'osMain';
    t.forme(mat, sfEll(mx, my + 1 * k, 1.6 * k, 2.2 * k), { decalage: 0.3 });
    for (let d = 0; d < 4; d++) sfTubeForme(t, mat, [[mx - 1.2 * k + d * 0.8 * k, my + 1.5 * k], [mx - 1.4 * k + d * 0.9 * k, my + 4.6 * k]], u => 0.42 * k, { decalage: 0.2 - d * 0.1, ombre: false });
    if (visage === 'ombre') for (let d = 0; d < 4; d++) t.poser(Math.round(mx - 1.4 * k + d * 0.9 * k), Math.round(my + 4.6 * k), 'givre', 4);   // (l'ombre : le bout des doigts givré)
  }
  // --- la capuche : profonde, pointue vers l'arrière, bordée d'un liseré de givre ; l'intérieur noir, le visage ---
  const hx = cx + (dir ? -1 : 0) * k, hy = cy;
  t.forme('robeC', (x, y) => { const dx = (x + 0.5 - hx + (dir && x + 0.5 < hx ? (hx - x - 0.5) * 0.2 : 0)) / (13 * k), dy = (y + 0.5 - hy) / (15 * k); const d = dx * dx + dy * dy; if (d > 1 || y > hy + 12 * k) return null; const a = Math.atan2(dy, dx), pli = Math.sin(a * 7 + d * 3) * 0.45 * d; return [dx * 0.9 + Math.cos(a + 1.57) * pli, dy * 0.6 + Math.sin(a + 1.57) * pli, Math.sqrt(Math.max(0.05, 1 - d))]; }, { decalage: 0.1, motif: (x, y) => (fbm(x * 0.08, y * 0.08, 9, 2) - 0.5) * 0.5 });   // (v4 : des plis qui suivent la tête)
  t.forme('robeC', sfPoly([[hx - 13 * k, hy + 6 * k], [hx + 13 * k, hy + 6 * k], [hx + 16 * k, hy + 20 * k], [hx - 16 * k, hy + 20 * k]], (px, py) => { const f = Math.sin((px - hx) / k * 0.9) * 0.6; return [f, -0.3, 0.8]; }), { decalage: -0.1 });   // (les pans plissés sur les épaules)
  // l'ouverture : un creux noir profond ; de trois-quarts, décalé vers où elle regarde
  const ox = hx + s * k * 4.5, oy = hy + 1 * k, orx = (dir ? 6.5 : 9.5) * k, ory = 11 * k;
  t.forme('robeC', sfEll(ox, oy, orx + 1.6 * k, ory + 1.6 * k), { decalage: 0.9, ombre: false });   // (l'épaisseur du tissu au bord de la capuche)
  t.forme('doublure', sfEll(ox, oy, orx + 0.4 * k, ory + 0.4 * k), { decalage: 0.4, ombre: false, bord: false });   // (la doublure, plus sombre, à l'ouverture)
  t.forme('ombreP', sfEll(ox, oy, orx - 0.6 * k, ory - 0.6 * k), { decalage: -2, ombre: false, bord: false, motif: (x, y) => -Math.pow(1 - Math.hypot((x - ox) / orx, (y - oy) / ory), 1) * 2 });
  if (visage === 'crane') {
    // (v2) un crâne qui appartient à la capuche : dans sa pénombre (plus sombre vers le haut et le bas), le front à peine
    // plus clair, les orbites rouges qui rougissent l'os autour d'elles, la mâchoire dans l'ombre ; de trois-quarts, le
    // crâne est plus étroit et l'orbite du fond plus petite
    const sx2 = ox + s * k * 0.4, sy2 = oy + 0.5 * k, rx = (dir ? 4.6 : 5.6) * k;
    t.forme('os', (x, y) => { const dx = (x + 0.5 - sx2) / rx, dy = (y + 0.5 - sy2 + 1.5 * k) / (6.2 * k); if (dx * dx + dy * dy > 1) return null; return [dx * 0.9, dy * 0.6, Math.sqrt(1 - dx * dx * 0.81 - dy * dy * 0.36)]; },
      { decalage: -0.3, motif: (x, y) => { const dy = (y + 0.5 - sy2 + 1.5 * k) / (6.2 * k); return (dy < -0.55 ? -1.2 : dy > 0.5 ? -1 : 0) + (dir && x + 0.5 < sx2 - rx * 0.5 ? -0.8 : 0); } });
    t.forme('os', sfPoly([[sx2 - rx * 0.62, sy2 + 3 * k], [sx2 + rx * 0.62, sy2 + 3 * k], [sx2 + rx * 0.42, sy2 + 8.5 * k], [sx2 - rx * 0.42, sy2 + 8.5 * k]], [0, 0.2, 0.95]), { decalage: -1.6, motif: (x, y) => (y > sy2 + 6.5 * k && (Math.floor(x / k) % 2) ? -0.8 : 0) });   // (la mâchoire, dans l'ombre)
    for (const cote of [-1, 1]) { const ex = sx2 + cote * rx * 0.43 + s * k * 0.3, ey = sy2 - 0.5 * k, petit = dir && cote < 0 ? 0.7 : 1;
      t.forme('osR', sfEll(ex, ey, 2.8 * k * petit, 2.4 * k * petit), { decalage: 0.2, ombre: false, bord: false, motif: (x, y) => -Math.hypot(x - ex, y - ey) / (2.2 * k) });   // (l'os rougi par l'orbite)
      t.forme('orbite', sfEll(ex, ey, 1.7 * k * petit, 1.5 * k * petit), { decalage: -1.2, ombre: false }); t.forme('oeilR', sfEll(ex, ey, 0.9 * k * petit, 0.8 * k * petit), { decalage: 1.2, ombre: false, bord: false }); t.poser(Math.round(ex - 0.3 * k), Math.round(ey - 0.3 * k), 'oeilR', 5); }
    t.forme('ombreP', sfPoly([[sx2 - 0.8 * k, sy2 + 1.5 * k], [sx2 + 0.8 * k, sy2 + 1.5 * k], [sx2, sy2 + 3.4 * k]], [0, 0, 1]), { decalage: -1.5, ombre: false, bord: false });   // (le nez : un creux)
    for (let i = -2; i <= 2; i += 2) { const x = Math.round(sx2 + i * rx * 0.3), y = Math.round(sy2 - 7.2 * k + Math.abs(i) * 0.8 * k); t.poser(x, y, 'givre', 1); }   // (le givre du liseré descend sur le front)
  } else {
    for (const cote of [-1, 1]) { const ex = ox + cote * 2.4 * k + s * k * 0.3, ey = oy - 0.5 * k;
      t.forme('oeilR', sfEll(ex, ey, 1.3 * k, 0.9 * k), { decalage: 0.6, ombre: false, bord: false }); t.poser(Math.round(ex), Math.round(ey), 'oeilR', 5); }
  }
  // le liseré de givre tout autour de l'ouverture, la broche d'argent au pétale noir sous le menton
  for (let a = -2.2; a < 2.2; a += 0.08) { const x = Math.round(ox + Math.cos(a - 1.57) * (orx + 0.8 * k)), y = Math.round(oy + Math.sin(a - 1.57) * (ory + 0.8 * k)); t.poser(x, y, 'givre', 4); if (Math.round(a * 10) % 3 === 0) t.poser(x, y - 1, 'givre', 5); }
  const bx = ox, by = oy + 13 * k; t.forme('argentF', sfEll(bx, by, 1.4 * k, 1.4 * k), { decalage: 0.5 });
  if (souvenirs.includes('petale')) t.forme('petale', sfPoly([[bx, by - 0.5 * k], [bx + 2.4 * k, by + 1 * k], [bx + 1.2 * k, by + 4 * k], [bx - 1 * k, by + 3 * k]], [0.2, -0.3, 0.9]), { decalage: 0.4 });
  // --- le givre à ses pieds, les cristaux sur l'ourlet ---
  for (let i = 0; i < 7; i++) { const x = cx - 18 * k + i * 6 * k + hachage(i, 1, 3) * 3 * k, h = (2 + hachage(i, 2, 3) * 3) * k; fhCristal(dev, x, sol - 2 - hachage(i, 4, 3) * 6 * k, h, 0.5); }
  // --- elle se dissout dans l'ombre : le bas s'efface en rubans, des lambeaux montent ---
  if (dissolution > 0) {
    const seuil = sol - dissolution * 1.15 * (sol - cy + 16 * k);
    for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) { const i = y * L + x; if (t.c[i] === null) continue;
      const bruit = (fbm(x * 0.07, y * 0.04, 11, 2) - 0.5) * 30 * k, ruban = Math.sin(x * 0.5 + y * 0.08) > 0.6 - dissolution * 0.4;
      if (y > seuil + bruit || (dissolution > 0.3 && ruban && y > seuil - 14 * k * dissolution)) { t.c[i] = null; t.m[i] = null; } }
    for (let m = 0; m < 14 * dissolution; m++) { const x = cx + (hachage(m, 5, 2) - 0.5) * 50 * k, y0 = Math.min(sol, seuil + hachage(m, 6, 2) * 20 * k), l = (10 + hachage(m, 7, 2) * 24) * k;
      sfTubeForme(dev, m % 3 ? 'robe' : 'robeC', sfBezier([x, y0], [x + Math.sin(m) * 6 * k, y0 - l * 0.4], [x - Math.sin(m * 2) * 6 * k, y0 - l * 0.75], [x + Math.sin(m) * 3 * k, y0 - l], 10), u => (1.6 - u * 1.3) * k + 0.3, { decalage: 0.1, ombre: false }); }
  }
  sfContour(fond, 1); sfContour(t, 2); dev.contour();
  const T = fhToile(L, H); sfColler(T, fond); sfColler(T, t); sfColler(T, dev);
  T.reperes = { sol, cx, tete: [hx, hy], yeux: [[ox - 2.4 * k, oy], [ox + 2.4 * k, oy]], lame: dev.lameFaux || null };
  return T;
}
// Le buste, à la taille des bustes du comptoir (80 × 100, affiché ×2,3 ; elle dépasse en haut comme les grands)
function faucheuseBusteHD({ visage = 'crane', parle = false, devoilee = false } = {}) {
  // (v4) la toile monte au-dessus des 80 × 100 des bustes : la lame tient entière au-dessus de sa capuche (posé par le bas,
  // le buste reste à sa place dans la fenêtre)
  const k = 2, L = 120, H = 150, t = fhToile(L, H), fond = fhToile(L, H), dev = fhToile(L, H), cx = 60, cy = 94;
  // la pointe de la capuche dans le dos, la faux derrière l'épaule
  sfTubeForme(fond, 'robeC', sfBezier([cx, cy - 20 * k], [cx - 12 * k, cy - 10 * k], [cx - 22 * k, cy + 6 * k], [cx - 24 * k, cy + 22 * k], 12), u => 4 * k * (1 - u * 0.85) + 0.5, { decalage: -0.3 });
  fhFaux(fond, [cx + 15 * k, H], [cx + 16 * k, cy - 30 * k], 1.3, -1, { eteinte: !devoilee });
  // les épaules et la robe
  t.forme('robe', sfPoly([[cx - 19 * k, cy + 14 * k], [cx + 19 * k, cy + 14 * k], [cx + 26 * k, H], [cx - 26 * k, H]], [0, -0.3, 0.92]), { decalage: -0.3, motif: (x, y) => { const pli = Math.sin((x - cx) * 0.2 + y * 0.01); return pli > 0.8 ? 0.5 : pli < -0.8 ? -0.6 : 0; } });
  // la capuche, haute et large, les pans sur les épaules
  t.forme('robeC', (x, y) => { const dx = (x + 0.5 - cx) / (17 * k), dy = (y + 0.5 - cy) / (20 * k); const d = dx * dx + dy * dy; if (d > 1 || y > cy + 14 * k) return null; return [dx * 0.9, dy * 0.6, Math.sqrt(Math.max(0.05, 1 - d))]; }, { decalage: 0, motif: (x, y) => (fbm(x * 0.08, y * 0.08, 9, 2) - 0.5) * 0.8 });
  t.forme('robeC', sfPoly([[cx - 17 * k, cy + 6 * k], [cx + 17 * k, cy + 6 * k], [cx + 21 * k, cy + 24 * k], [cx - 21 * k, cy + 24 * k]], [0, -0.3, 0.9]), { decalage: -0.3, motif: (x) => ((x - cx) % (6 * k) < 1 ? -0.7 : 0) });
  const ox = cx, oy = cy + 1 * k, orx = 12 * k, ory = 14.5 * k;
  t.forme('robeC', sfEll(ox, oy, orx + 2 * k, ory + 2 * k), { decalage: 0.9, ombre: false });
  t.forme('doublure', sfEll(ox, oy, orx + 0.5 * k, ory + 0.5 * k), { decalage: 0.4, ombre: false, bord: false });
  t.forme('ombreP', sfEll(ox, oy, orx - 0.6 * k, ory - 0.6 * k), { decalage: -2, ombre: false, bord: false, motif: (x, y) => -Math.pow(1 - Math.hypot((x - ox) / orx, (y - oy) / ory), 1) * 2 });
  if (visage === 'crane') {
    const sx2 = ox, sy2 = oy + 1 * k;
    t.forme('os', (x, y) => { const dx = (x + 0.5 - sx2) / (7.4 * k), dy = (y + 0.5 - sy2 + 2 * k) / (8 * k); if (dx * dx + dy * dy > 1) return null; return [dx * 0.9, dy * 0.6, Math.sqrt(1 - dx * dx * 0.81 - dy * dy * 0.36)]; }, { decalage: -0.3, motif: (x, y) => { const dy = (y + 0.5 - sy2 + 2 * k) / (8 * k); return dy < -0.55 ? -1.2 : dy > 0.5 ? -1 : 0; } });
    t.forme('os', sfPoly([[sx2 - 4.8 * k, sy2 + 4 * k], [sx2 + 4.8 * k, sy2 + 4 * k], [sx2 + 3.2 * k, sy2 + (parle ? 12 : 11) * k], [sx2 - 3.2 * k, sy2 + (parle ? 12 : 11) * k]], [0, 0.2, 0.95]), { decalage: -1.6, motif: (x, y) => (y > sy2 + 8.5 * k && (Math.floor(x / k) % 2) ? -0.8 : 0) });
    if (parle) t.forme('ombreP', sfPoly([[sx2 - 2.6 * k, sy2 + 8.6 * k], [sx2 + 2.6 * k, sy2 + 8.6 * k], [sx2 + 2.2 * k, sy2 + 10.2 * k], [sx2 - 2.2 * k, sy2 + 10.2 * k]], [0, 0, 1]), { decalage: -1.5, ombre: false, bord: false });
    for (let i = -2; i <= 2; i += 2) { const x = Math.round(sx2 + i * 2.2 * k), y = Math.round(sy2 - 9.4 * k + Math.abs(i) * 1 * k); t.poser(x, y, 'givre', 1); }
    for (const cote of [-1, 1]) { const ex = sx2 + cote * 3.2 * k, ey = sy2 - 0.8 * k;
      t.forme('osR', sfEll(ex, ey, 3.8 * k, 3.2 * k), { decalage: 0.2, ombre: false, bord: false, motif: (x, y) => -Math.hypot(x - ex, y - ey) / (3 * k) });
      t.forme('orbite', sfEll(ex, ey, 2.3 * k, 2 * k), { decalage: -1.2, ombre: false }); t.forme('oeilR', sfEll(ex, ey, 1.2 * k, 1.05 * k), { decalage: 1.2, ombre: false, bord: false }); t.poser(Math.round(ex - 0.4 * k), Math.round(ey - 0.4 * k), 'oeilR', 5); }
    t.forme('ombreP', sfPoly([[sx2 - 1 * k, sy2 + 2 * k], [sx2 + 1 * k, sy2 + 2 * k], [sx2, sy2 + 4.4 * k]], [0, 0, 1]), { decalage: -1.5, ombre: false, bord: false });
  } else {
    for (const cote of [-1, 1]) { const ex = ox + cote * 3.2 * k, ey = oy - 0.8 * k; t.forme('oeilR', sfEll(ex, ey, 1.8 * k, 1.2 * k), { decalage: 0.6, ombre: false, bord: false }); t.poser(Math.round(ex), Math.round(ey), 'oeilR', 5); }
  }
  for (let a = -2.2; a < 2.2; a += 0.06) { const x = Math.round(ox + Math.cos(a - 1.57) * (orx + 1 * k)), y = Math.round(oy + Math.sin(a - 1.57) * (ory + 1 * k)); t.poser(x, y, 'givre', 4); if (Math.round(a * 10) % 3 === 0) t.poser(x, y - 1, 'givre', 5); }
  const bx = ox, by = oy + 17 * k; t.forme('argentF', sfEll(bx, by, 1.8 * k, 1.8 * k), { decalage: 0.5 });
  t.forme('petale', sfPoly([[bx, by - 0.6 * k], [bx + 3.2 * k, by + 1.4 * k], [bx + 1.6 * k, by + 5.2 * k], [bx - 1.4 * k, by + 4 * k]], [0.2, -0.3, 0.9]), { decalage: 0.4 });
  // la main pâle sur le manche, devant
  const mx = cx + 13 * k, my = cy + 10 * k, mat = visage === 'ombre' ? 'robeC' : 'osMain';
  t.forme(mat, sfEll(mx, my, 2.2 * k, 2.8 * k), { decalage: 0.3 }); for (let d = 0; d < 4; d++) sfTubeForme(t, mat, [[mx - 1.6 * k + d * 1.1 * k, my + 1 * k], [mx - 1.9 * k + d * 1.2 * k, my + 5.5 * k]], u => 0.55 * k, { decalage: 0.2 - d * 0.1, ombre: false });
  sfContour(fond, 1); sfContour(t, 2);
  const T = fhToile(L, H); sfColler(T, fond); sfColler(T, t); sfColler(T, dev); T.reperes = { lame: fond.lameFaux || null }; return T;
}
