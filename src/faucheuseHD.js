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
  os: [0x6a6878, 0x8e8c9c, 0xb4b2be, 0xd4d2da, 0xe8e6ec, 0xf8f6fa],
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
function fhFaux(t, A, B, k, cote = 1, { lame = true } = {}) {
  const r = 1.1 * k;
  sfTubeForme(t, 'manche', [A, B], u => r, { decalage: 0.3, motif: i => (i && (i.s / (7 * k)) % 1 < 0.08 ? 0.9 : i && Math.abs(i.o) > 0.6 ? -0.5 : 0) });
  for (const u of [0.08, 0.5, 0.94]) { const x = A[0] + (B[0] - A[0]) * u, y = A[1] + (B[1] - A[1]) * u; sfTubeForme(t, 'argentF', [[x, y - 1 * k], [x, y + 1 * k]], v => r + 0.5 * k, { decalage: 0.4 }); }   // (les cercles d'argent)
  if (!lame) return;
  // la jointure : un croissant d'argent qui tient la lame
  t.forme('argentF', sfEll(B[0], B[1], 2.4 * k, 1.6 * k), { decalage: 0.5 });
  t.forme('robe', sfEll(B[0] + cote * 0.4 * k, B[1], 1.1 * k, 0.9 * k), { decalage: 0.2, ombre: false, bord: false });
  // la lame : longue, mince, qui part vers le côté, s'incurve et descend en pointe ; le dos épais, le fil clair de givre
  const L = 26 * k, pts = sfBezier([B[0] - cote * 2 * k, B[1] - 0.5 * k], [B[0] + cote * L * 0.4, B[1] - 3.5 * k], [B[0] + cote * L * 0.85, B[1] - 0.5 * k], [B[0] + cote * L * 1.0, B[1] + 8 * k], 24);
  const tb = sfTube(pts, u => (2.6 * k) * (1 - u * 0.92) + 0.4);
  sfForme(t, 'lame', (x, y) => tb.info(x, y), { garder: i => i.dedans, decalage: 0.35, motif: i => (i ? (i.o * cote < -0.55 ? -1.1 : i.o * cote > 0.45 ? 0.5 : 0) : 0) });   // (le dos sombre, le plat qui prend la lumière)
  sfForme(t, 'givre', (x, y) => tb.info(x, y), { garder: i => i.dedans && i.o * cote > 0.72, decalage: 0.9, ombre: false, bord: false });   // (le fil de givre)
  // la rune gravée sur le plat : trois traits
  const q = tb.pts[7]; for (const [dx, dy] of [[0, -1], [0, 0], [0, 1], [1, 0], [-1, 0]]) t.poser(Math.round(q[0] + dx * k * 0.8), Math.round(q[1] + dy * k * 0.8 - 0.3 * k), 'robe', 2);
}
// La Faucheuse en pied : vue 'face' ou 'troisQuarts' (elle regarde à droite) ; visage 'crane' ou 'ombre' ;
// dissolution de 0 (entière) à 1 (dissoute dans l'ombre) ; faux : la tient-elle
function faucheuseCorpsHD(vue = 'face', { visage = 'crane', dissolution = 0, faux = true } = {}) {
  const k = 2, L = 150, H = 232, sol = 220, dir = vue === 'troisQuarts' ? 1 : 0, s = dir ? 0.55 : 0;   // (s : le décalage du visage vers où elle regarde)
  const t = fhToile(L, H), fond = fhToile(L, H), dev = fhToile(L, H);
  const cx = 66 + (dir ? 2 : 0), cy = 76;   // (la tête : haute, elle est grande)
  // --- derrière : la pointe de la capuche qui retombe dans le dos, la faux (de trois-quarts, la lame devant) ---
  const ptX = cx - (dir ? 14 : 0) * k;
  sfTubeForme(fond, 'robeC', sfBezier([cx, cy - 10 * k], [cx - 6 * k, cy - 2 * k], [ptX - 4 * k, cy + 12 * k], [ptX - 2 * k, cy + 24 * k], 14), u => 3.2 * k * (1 - u * 0.85) + 0.5, { decalage: -0.2 });
  const fauxA = [cx + (dir ? 11 : 15) * k, sol - 1], fauxB = [cx + (dir ? 9 : 13) * k, cy - 22 * k];
  if (faux) fhFaux(dev, fauxA, fauxB, k, 1);   // (la faux devant elle : elle la tient à deux mains)
  // --- la robe : large aux épaules, étroite à la taille, qui s'évase jusqu'au sol et s'effiloche en brume ---
  const robe = (x, y) => { if (y < cy + 6 * k || y > sol) return null; const v = (y - cy - 6 * k) / (sol - cy - 6 * k);
    const demi = (13 - 3 * Math.sin(v * 3.1) * (v < 0.5 ? 1 : 0) + v * v * 22) * k + (v > 0.55 ? (v - 0.55) * 20 * k : 0), ax = cx + s * k * 2 * (1 - v);
    const dx = (x + 0.5 - ax) / demi; if (Math.abs(dx) > 1) return null;
    if (y > sol - 10 * k && hachage(Math.floor(x / 2), 3, 7) * 10 * k < (y - sol + 10 * k) * (0.6 + 0.6 * Math.abs(Math.sin(x * 0.35)))) return null;   // (l'ourlet effiloché)
    return [dx * 0.8, -0.12, Math.sqrt(Math.max(0.05, 1 - 0.64 * dx * dx))]; };
  t.forme('robe', robe, { decalage: -0.25, motif: (x, y) => { const pli = Math.sin((x - cx) * 0.22 + y * 0.015) + (fbm(x * 0.05, y * 0.05, 4, 2) - 0.5) * 1.6; return y > cy + 30 * k ? (pli > 0.75 ? 0.55 : pli < -0.75 ? -0.7 : 0) : 0; } });
  // la chaîne d'argent à la taille, le petit sablier qui pend
  const yT = cy + 34 * k; for (let x = cx - 8 * k; x <= cx + 8 * k; x += 2) { const y = yT + Math.abs(x - cx) * 0.18; t.poser(Math.round(x + s * k), Math.round(y), 'argentF', (x / 2) % 2 ? 4 : 2); }
  const sx = cx + 5 * k + s * k, sy = yT + 2 * k; sfTubeForme(t, 'argentF', [[sx, sy], [sx, sy + 3 * k]], u => 0.5 * k, { decalage: 0.3 });
  t.forme('argentF', sfPoly([[sx - 1.6 * k, sy + 3 * k], [sx + 1.6 * k, sy + 3 * k], [sx + 0.3 * k, sy + 5.2 * k], [sx + 1.6 * k, sy + 7.4 * k], [sx - 1.6 * k, sy + 7.4 * k], [sx - 0.3 * k, sy + 5.2 * k]], [0, -0.3, 0.9]), { decalage: 0.4 });
  t.forme('sable', sfPoly([[sx - 0.9 * k, sy + 5.9 * k], [sx + 0.9 * k, sy + 5.9 * k], [sx + 1.1 * k, sy + 7 * k], [sx - 1.1 * k, sy + 7 * k]], [0, 0, 1]), { decalage: 0.5, ombre: false, bord: false });
  // --- les manches larges et les mains fines, posées sur la faux (ou croisées) ---
  for (const cote of [-1, 1]) {
    const ex = cx + cote * 11 * k + s * k * 1.5, ey = cy + 12 * k, mx = faux ? cx + (dir ? 9 : 13) * k + (cote < 0 ? -1.5 * k : 1.5 * k) : cx + cote * 4 * k, my = faux ? cy + 20 * k + (cote < 0 ? 6 * k : 0) : cy + 30 * k;
    const pts = sfBezier([ex, ey], [ex + cote * 5 * k, ey + 6 * k], [mx + cote * 2 * k, my - 4 * k], [mx, my], 10);
    sfTubeForme(t, 'robe', pts, u => (4.2 + u * 1.6) * k, { decalage: -0.1 + (cote > 0 ? 0.15 : -0.1), motif: i => (i && Math.abs(i.o) > 0.7 ? -0.6 : 0) });
    // la main : une paume étroite et pâle, quatre doigts longs qui se referment sur le manche
    const mat = visage === 'ombre' ? 'robeC' : 'os';
    t.forme(mat, sfEll(mx, my + 1 * k, 1.6 * k, 2.2 * k), { decalage: 0.3 });
    for (let d = 0; d < 4; d++) sfTubeForme(t, mat, [[mx - 1.2 * k + d * 0.8 * k, my + 1.5 * k], [mx - 1.4 * k + d * 0.9 * k, my + 4.6 * k]], u => 0.42 * k, { decalage: 0.2 - d * 0.1, ombre: false });
    if (visage === 'ombre') for (let d = 0; d < 4; d++) t.poser(Math.round(mx - 1.4 * k + d * 0.9 * k), Math.round(my + 4.6 * k), 'givre', 4);   // (l'ombre : le bout des doigts givré)
  }
  // --- la capuche : profonde, pointue vers l'arrière, bordée d'un liseré de givre ; l'intérieur noir, le visage ---
  const hx = cx + s * k * 2, hy = cy;
  t.forme('robeC', (x, y) => { const dx = (x + 0.5 - hx) / (13 * k), dy = (y + 0.5 - hy) / (15 * k); const d = dx * dx + dy * dy; if (d > 1 || y > hy + 12 * k) return null; return [dx * 0.9, dy * 0.6, Math.sqrt(Math.max(0.05, 1 - d))]; }, { decalage: 0, motif: (x, y) => (fbm(x * 0.08, y * 0.08, 9, 2) - 0.5) * 0.8 });
  t.forme('robeC', sfPoly([[hx - 13 * k, hy + 6 * k], [hx + 13 * k, hy + 6 * k], [hx + 15 * k, hy + 18 * k], [hx - 15 * k, hy + 18 * k]], [0, -0.3, 0.9]), { decalage: -0.3, motif: (x, y) => ((x - hx) % (5 * k) < 1 ? -0.7 : 0) });   // (les pans de la capuche sur les épaules)
  // l'ouverture : un creux noir profond ; de trois-quarts, décalé vers où elle regarde
  const ox = hx + s * k * 3, oy = hy + 1 * k, orx = (dir ? 8.5 : 9.5) * k, ory = 11 * k;
  t.forme('ombreP', sfEll(ox, oy, orx, ory), { decalage: -2, ombre: false, bord: false, motif: (x, y) => -Math.pow(1 - Math.hypot((x - ox) / orx, (y - oy) / ory), 1) * 2 });
  if (visage === 'crane') {
    // un crâne fin et pâle : le front haut, les pommettes, la mâchoire fermée ; dans l'ombre vers le bas
    const sx2 = ox + s * k * 0.5, sy2 = oy + 0.5 * k;
    t.forme('os', (x, y) => { const dx = (x + 0.5 - sx2) / (5.6 * k), dy = (y + 0.5 - sy2 + 1.5 * k) / (6.2 * k); if (dx * dx + dy * dy > 1) return null; return [dx * 0.9, dy * 0.6, Math.sqrt(1 - dx * dx * 0.81 - dy * dy * 0.36)]; }, { decalage: -0.2, motif: (x, y) => (y > sy2 + 2 * k ? -(y - sy2 - 2 * k) / (4 * k) * 1.4 : 0) });
    t.forme('os', sfPoly([[sx2 - 3.6 * k, sy2 + 3 * k], [sx2 + 3.6 * k, sy2 + 3 * k], [sx2 + 2.4 * k, sy2 + 8.5 * k], [sx2 - 2.4 * k, sy2 + 8.5 * k]], [0, 0.2, 0.95]), { decalage: -0.9, motif: (x, y) => (y > sy2 + 6.5 * k && (Math.floor(x / k) % 2) ? -0.8 : 0) });   // (la mâchoire, les dents suggérées)
    for (const cote of [-1, 1]) { const ex = sx2 + cote * 2.4 * k + s * k * 0.3, ey = sy2 - 0.5 * k;
      t.forme('orbite', sfEll(ex, ey, 1.7 * k, 1.5 * k), { decalage: -1.2, ombre: false }); t.forme('oeilR', sfEll(ex, ey, 0.9 * k, 0.8 * k), { decalage: 1.2, ombre: false, bord: false }); t.poser(Math.round(ex - 0.3 * k), Math.round(ey - 0.3 * k), 'oeilR', 5); }
    t.forme('ombreP', sfPoly([[sx2 - 0.8 * k, sy2 + 1.5 * k], [sx2 + 0.8 * k, sy2 + 1.5 * k], [sx2, sy2 + 3.4 * k]], [0, 0, 1]), { decalage: -1.5, ombre: false, bord: false });   // (le nez : un creux)
  } else {
    for (const cote of [-1, 1]) { const ex = ox + cote * 2.4 * k + s * k * 0.3, ey = oy - 0.5 * k;
      t.forme('oeilR', sfEll(ex, ey, 1.3 * k, 0.9 * k), { decalage: 0.6, ombre: false, bord: false }); t.poser(Math.round(ex), Math.round(ey), 'oeilR', 5); }
  }
  // le liseré de givre tout autour de l'ouverture, la broche d'argent au pétale noir sous le menton
  for (let a = -2.2; a < 2.2; a += 0.08) { const x = Math.round(ox + Math.cos(a - 1.57) * (orx + 0.8 * k)), y = Math.round(oy + Math.sin(a - 1.57) * (ory + 0.8 * k)); t.poser(x, y, 'givre', 4); if (Math.round(a * 10) % 3 === 0) t.poser(x, y - 1, 'givre', 5); }
  const bx = ox, by = oy + 13 * k; t.forme('argentF', sfEll(bx, by, 1.4 * k, 1.4 * k), { decalage: 0.5 });
  t.forme('petale', sfPoly([[bx, by - 0.5 * k], [bx + 2.4 * k, by + 1 * k], [bx + 1.2 * k, by + 4 * k], [bx - 1 * k, by + 3 * k]], [0.2, -0.3, 0.9]), { decalage: 0.4 });
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
  T.reperes = { sol, cx, tete: [hx, hy], yeux: [[ox - 2.4 * k, oy], [ox + 2.4 * k, oy]] };
  return T;
}
// Le buste, à la taille des bustes du comptoir (80 × 100, affiché ×2,3 ; elle dépasse en haut comme les grands)
function faucheuseBusteHD({ visage = 'crane', parle = false } = {}) {
  const k = 2, L = 80, H = 100, t = fhToile(L, H), fond = fhToile(L, H), dev = fhToile(L, H), cx = 40, cy = 44;
  // la pointe de la capuche dans le dos, la faux derrière l'épaule
  sfTubeForme(fond, 'robeC', sfBezier([cx, cy - 20 * k], [cx - 12 * k, cy - 10 * k], [cx - 22 * k, cy + 6 * k], [cx - 24 * k, cy + 22 * k], 12), u => 4 * k * (1 - u * 0.85) + 0.5, { decalage: -0.3 });
  fhFaux(fond, [cx + 15 * k, H], [cx + 13 * k, cy - 24 * k], k * 1.3, 1);
  // les épaules et la robe
  t.forme('robe', sfPoly([[cx - 19 * k, cy + 14 * k], [cx + 19 * k, cy + 14 * k], [cx + 26 * k, H], [cx - 26 * k, H]], [0, -0.3, 0.92]), { decalage: -0.3, motif: (x, y) => { const pli = Math.sin((x - cx) * 0.2 + y * 0.01); return pli > 0.8 ? 0.5 : pli < -0.8 ? -0.6 : 0; } });
  // la capuche, haute et large, les pans sur les épaules
  t.forme('robeC', (x, y) => { const dx = (x + 0.5 - cx) / (17 * k), dy = (y + 0.5 - cy) / (20 * k); const d = dx * dx + dy * dy; if (d > 1 || y > cy + 14 * k) return null; return [dx * 0.9, dy * 0.6, Math.sqrt(Math.max(0.05, 1 - d))]; }, { decalage: 0, motif: (x, y) => (fbm(x * 0.08, y * 0.08, 9, 2) - 0.5) * 0.8 });
  t.forme('robeC', sfPoly([[cx - 17 * k, cy + 6 * k], [cx + 17 * k, cy + 6 * k], [cx + 21 * k, cy + 24 * k], [cx - 21 * k, cy + 24 * k]], [0, -0.3, 0.9]), { decalage: -0.3, motif: (x) => ((x - cx) % (6 * k) < 1 ? -0.7 : 0) });
  const ox = cx, oy = cy + 1 * k, orx = 12 * k, ory = 14.5 * k;
  t.forme('ombreP', sfEll(ox, oy, orx, ory), { decalage: -2, ombre: false, bord: false, motif: (x, y) => -Math.pow(1 - Math.hypot((x - ox) / orx, (y - oy) / ory), 1) * 2 });
  if (visage === 'crane') {
    const sx2 = ox, sy2 = oy + 1 * k;
    t.forme('os', (x, y) => { const dx = (x + 0.5 - sx2) / (7.4 * k), dy = (y + 0.5 - sy2 + 2 * k) / (8 * k); if (dx * dx + dy * dy > 1) return null; return [dx * 0.9, dy * 0.6, Math.sqrt(1 - dx * dx * 0.81 - dy * dy * 0.36)]; }, { decalage: -0.2, motif: (x, y) => (y > sy2 + 2 * k ? -(y - sy2 - 2 * k) / (5 * k) * 1.4 : 0) });
    t.forme('os', sfPoly([[sx2 - 4.8 * k, sy2 + 4 * k], [sx2 + 4.8 * k, sy2 + 4 * k], [sx2 + 3.2 * k, sy2 + (parle ? 12 : 11) * k], [sx2 - 3.2 * k, sy2 + (parle ? 12 : 11) * k]], [0, 0.2, 0.95]), { decalage: -0.9, motif: (x, y) => (y > sy2 + 8.5 * k && (Math.floor(x / k) % 2) ? -0.8 : 0) });
    if (parle) t.forme('ombreP', sfPoly([[sx2 - 2.6 * k, sy2 + 8.6 * k], [sx2 + 2.6 * k, sy2 + 8.6 * k], [sx2 + 2.2 * k, sy2 + 10.2 * k], [sx2 - 2.2 * k, sy2 + 10.2 * k]], [0, 0, 1]), { decalage: -1.5, ombre: false, bord: false });
    for (const cote of [-1, 1]) { const ex = sx2 + cote * 3.2 * k, ey = sy2 - 0.8 * k;
      t.forme('orbite', sfEll(ex, ey, 2.3 * k, 2 * k), { decalage: -1.2, ombre: false }); t.forme('oeilR', sfEll(ex, ey, 1.2 * k, 1.05 * k), { decalage: 1.2, ombre: false, bord: false }); t.poser(Math.round(ex - 0.4 * k), Math.round(ey - 0.4 * k), 'oeilR', 5); }
    t.forme('ombreP', sfPoly([[sx2 - 1 * k, sy2 + 2 * k], [sx2 + 1 * k, sy2 + 2 * k], [sx2, sy2 + 4.4 * k]], [0, 0, 1]), { decalage: -1.5, ombre: false, bord: false });
  } else {
    for (const cote of [-1, 1]) { const ex = ox + cote * 3.2 * k, ey = oy - 0.8 * k; t.forme('oeilR', sfEll(ex, ey, 1.8 * k, 1.2 * k), { decalage: 0.6, ombre: false, bord: false }); t.poser(Math.round(ex), Math.round(ey), 'oeilR', 5); }
  }
  for (let a = -2.2; a < 2.2; a += 0.06) { const x = Math.round(ox + Math.cos(a - 1.57) * (orx + 1 * k)), y = Math.round(oy + Math.sin(a - 1.57) * (ory + 1 * k)); t.poser(x, y, 'givre', 4); if (Math.round(a * 10) % 3 === 0) t.poser(x, y - 1, 'givre', 5); }
  const bx = ox, by = oy + 17 * k; t.forme('argentF', sfEll(bx, by, 1.8 * k, 1.8 * k), { decalage: 0.5 });
  t.forme('petale', sfPoly([[bx, by - 0.6 * k], [bx + 3.2 * k, by + 1.4 * k], [bx + 1.6 * k, by + 5.2 * k], [bx - 1.4 * k, by + 4 * k]], [0.2, -0.3, 0.9]), { decalage: 0.4 });
  // la main pâle sur le manche, devant
  const mx = cx + 13 * k, my = cy + 10 * k, mat = visage === 'ombre' ? 'robeC' : 'os';
  t.forme(mat, sfEll(mx, my, 2.2 * k, 2.8 * k), { decalage: 0.3 }); for (let d = 0; d < 4; d++) sfTubeForme(t, mat, [[mx - 1.6 * k + d * 1.1 * k, my + 1 * k], [mx - 1.9 * k + d * 1.2 * k, my + 5.5 * k]], u => 0.55 * k, { decalage: 0.2 - d * 0.1, ombre: false });
  sfContour(fond, 1); sfContour(t, 2);
  const T = fhToile(L, H); sfColler(T, fond); sfColler(T, t); sfColler(T, dev); return T;
}
