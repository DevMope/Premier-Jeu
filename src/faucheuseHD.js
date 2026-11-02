// La Faucheuse en HD (planches validées, v1 à v8). Chargée par le jeu, après sageFormesHD.js.
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
  tendon: [0x010102, 0x08080c, 0x141418, 0x24242e, 0x3e3e4c, 0x6a6a7e],   // (v6 : les tendons noirs, luisants)
  cendre: [0x000000, 0x020104, 0x050309, 0x0a0710, 0x120d1c, 0x1e1630],   // (les cendres, un noir de suie au reflet violet)
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
  // (v5) le manche : une colonne de vertèbres sculptées, irrégulières, qui se chevauchent (pas de « collier de perles ») ;
  // des côtes fines qui s'enroulent autour ; des runes d'argent qui luisent faiblement d'un bleu lunaire ; des colliers
  // d'argent ciselés ; un pommeau en bas (une vertèbre caudale en pointe) ; une petite tête d'os à la jointure
  const ux0 = B[0] - A[0], uy0 = B[1] - A[1], ul0 = Math.hypot(ux0, uy0), ax = ux0 / ul0, ay = uy0 / ul0, ang = Math.atan2(ay, ax), nx0 = -ay, ny0 = ax;
  const P = u => [A[0] + ux0 * u, A[1] + uy0 * u];
  // le pommeau : une vertèbre caudale qui s'effile en pointe, sous le manche
  const Q = [A[0] - ax * 7 * k, A[1] - ay * 7 * k];
  sfTubeForme(t, 'osMain', [A, Q], u => (1.9 - u * 1.6) * k + 0.4, { decalage: -0.1, motif: i => (i && (i.s / (1.6 * k)) % 1 < 0.25 ? -0.8 : 0) });
  sfTubeForme(t, 'manche', [A, B], u => 1.3 * k, { decalage: -0.5, ombre: false });
  const pas = 2.7 * k, n = Math.max(6, Math.round(ul0 / pas));
  for (let i = 0; i <= n; i++) { const u = i / n; if (u > 0.11 && u < 0.31) continue;   // (là, la poignée)
    const [x, y] = P(u), h = hachage(i, 1, 51), rA = (1.6 + h * 0.6) * k, rT = (2 + hachage(i, 2, 51) * 0.5) * k, tor = (hachage(i, 3, 51) - 0.5) * 0.3;
    // le corps de la vertèbre (allongé dans l'axe, un peu de travers), sa crête, son creux sculpté au milieu
    t.forme('osMain', sfEll(x, y, rA, rT, ang + tor), { decalage: 0.05, motif: (px, py) => { const lx = (px + 0.5 - x) * ax + (py + 0.5 - y) * ay, ly = (px + 0.5 - x) * nx0 + (py + 0.5 - y) * ny0;
      return (Math.abs(lx) < 0.35 * k ? -0.9 : 0) + (ly < -rT * 0.4 ? 0.4 : ly > rT * 0.45 ? -0.7 : 0) + (hachage(Math.floor(px / 2), Math.floor(py / 2), 52) > 0.85 ? -0.4 : 0); } });
    // l'apophyse, d'un côté puis de l'autre, recourbée
    const c = i % 2 ? 1 : -1, b0 = [x + nx0 * c * rT * 0.8, y + ny0 * c * rT * 0.8];
    sfTubeForme(t, 'osMain', sfBezier(b0, [b0[0] + nx0 * c * 1.2 * k, b0[1] + ny0 * c * 1.2 * k], [b0[0] + nx0 * c * 1.8 * k - ax * 1 * k, b0[1] + ny0 * c * 1.8 * k - ay * 1 * k], [b0[0] + nx0 * c * 2 * k - ax * 2.2 * k, b0[1] + ny0 * c * 2 * k - ay * 2.2 * k], 6), v => (0.55 - v * 0.35) * k + 0.25, { decalage: -0.2, ombre: false });
    // une rune d'argent, qui luit faiblement (bleu lunaire), une vertèbre sur trois
    if (i % 3 === 1) for (const [a1, b1] of [[0, -0.6], [0, 0], [0, 0.6], [0.5, 0], [-0.5, 0]]) t.poser(Math.round(x + ax * a1 * k + nx0 * b1 * k), Math.round(y + ay * a1 * k + ny0 * b1 * k), 'givre', 3);
  }
  // les côtes fines qui s'enroulent autour du manche (devant, puis derrière : on ne voit que l'avant de chaque tour)
  for (const [u0, u1] of [[0.34, 0.46], [0.6, 0.72], [0.8, 0.9]]) { const [x0, y0] = P(u0), [x1, y1] = P(u1), r = 2.6 * k;
    sfTubeForme(t, 'osMain', sfBezier([x0 - nx0 * r, y0 - ny0 * r], [x0 + (x1 - x0) * 0.3 + nx0 * r * 1.3, y0 + (y1 - y0) * 0.3 + ny0 * r * 1.3], [x0 + (x1 - x0) * 0.7 + nx0 * r * 1.3, y0 + (y1 - y0) * 0.7 + ny0 * r * 1.3], [x1 - nx0 * r, y1 - ny0 * r], 14), v => 0.55 * k + 0.25, { decalage: 0.25, motif: i => (i && i.o > 0.4 ? -0.7 : 0) }); }
  // la poignée de la main du bas : une bande de cuir sombre enroulée en spirale, entre deux bagues
  { const P1 = P(0.11), P2 = P(0.31);
    sfTubeForme(t, 'cuirF', [P1, P2], v => 1.9 * k, { decalage: 0.25, motif: i => (i && ((i.s + i.o * 3 * k) / (1.4 * k)) % 1 < 0.3 ? -1 : 0.2) }); }
  // les colliers d'argent ciselés : des filets, une perle de pierre de lune au milieu
  for (const u of [0.03, 0.11, 0.31, 0.55, 0.97]) { const [x, y] = P(u), r = (u === 0.55 ? 3 : 2.6) * k;
    sfTubeForme(t, 'argentF', [[x - ax * 1.2 * k, y - ay * 1.2 * k], [x + ax * 1.2 * k, y + ay * 1.2 * k]], v => r, { decalage: 0.4, motif: i => (i && (Math.floor(i.s / (0.5 * k)) % 3 === 1 ? -0.9 : 0) + (i && Math.abs(i.o) < 0.2 && Math.floor(i.s / (0.5 * k)) % 3 === 2 ? 0.6 : 0)) });
    t.forme('lune', sfEll(x + nx0 * r * 0.1, y + ny0 * r * 0.1, 0.7 * k, 0.7 * k), { decalage: 0.6, ombre: false }); }
  // la petite tête d'os, à la jointure avec la lame : un crâne de bête, ses orbites où luit un peu de bleu
  { const [hx, hy] = P(0.995); t.forme('osMain', sfEll(hx - ax * 1.2 * k, hy - ay * 1.2 * k, 2.6 * k, 3 * k, ang), { decalage: 0.2 });
    t.forme('osMain', sfEll(hx - ax * 3.2 * k + nx0 * 0.4 * k, hy - ay * 3.2 * k + ny0 * 0.4 * k, 1.6 * k, 1.8 * k, ang), { decalage: -0.2 });   // (le museau, vers le bas)
    for (const c of [-1, 1]) { const ex = hx - ax * 0.6 * k + nx0 * c * 1.2 * k, ey = hy - ay * 0.6 * k + ny0 * c * 1.2 * k; t.forme('ombreP', sfEll(ex, ey, 0.8 * k, 0.8 * k), { decalage: -1, ombre: false, bord: false }); t.poser(Math.round(ex), Math.round(ey), 'givre', 4); } }
  if (!lame) return;
  // (v3) la jointure, nette : le dernier os s'arrête, un collier d'argent épais, une douille d'argent sombre où entre la
  // lame ; un vide sombre entre l'os et l'argent, pour bien les séparer
  const ux = (B[0] - A[0]), uy = (B[1] - A[1]), ul = Math.hypot(ux, uy), dx = ux / ul, dy = uy / ul;
  const J = [B[0] + dx * 2.2 * k, B[1] + dy * 2.2 * k];
  sfTubeForme(t, 'manche', [B, J], u => 1.3 * k, { decalage: -0.8, ombre: false });
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
  // (v6) la jonction, massive : une large douille d'argent épaisse qui enserre le talon de la lame, ciselée de filets, la
  // petite tête d'os enchâssée sur sa face ; des tendons noirs et épais qui s'enroulent autour, débordent sur le dos de la
  // lame et sur le haut du manche, et retombent en lanières
  const nx = -dy, ny = dx, Cx = (J[0] + P0[0]) / 2 + cote * 1 * k, Cy = (J[1] + P0[1]) / 2 - 1 * k;
  const D = (a, b) => [Cx + dx * a * k + nx * b * k * cote, Cy + dy * a * k + ny * b * k * cote];   // (a : le long du manche, b : vers la lame)
  t.forme('argentF', sfPoly([D(-6, -6.5), D(-6, 8), D(1.5, 11.5), D(6.5, 9), D(7, -5), D(1, -8)], (px, py) => [((px - Cx) * nx + (py - Cy) * ny) / (9 * k) * cote * 0.7, -0.35, 0.85]),
    { decalage: 0.15, motif: (px, py) => { const a = ((px - Cx) * dx + (py - Cy) * dy) / k, b = ((px - Cx) * nx + (py - Cy) * ny) / k * cote; return (Math.abs(a + 3.4) < 0.5 || Math.abs(a - 3.6) < 0.5 ? -0.9 : 0) + (Math.abs(a) < 2.6 && Math.abs(b - 1) < 6 && (Math.floor((a + b) * 1.3) % 3 === 0) ? -0.4 : 0); } });
  for (const a of [-3.4, 3.6]) for (let b = -4; b <= 7; b += 2.2) t.poser(Math.round(D(a, b)[0]), Math.round(D(a, b)[1]), 'argentF', 5);   // (les rivets)
  { const [sx, sy] = D(0, 1.2); t.forme('osMain', sfEll(sx, sy, 2.3 * k, 2.6 * k), { decalage: 0.25 }); t.forme('osMain', sfEll(sx + dx * 2 * k, sy + dy * 2 * k, 1.4 * k, 1.5 * k), { decalage: -0.1 });
    for (const c of [-1, 1]) { const ex = sx - dx * 0.5 * k + nx * c * 1 * k, ey = sy - dy * 0.5 * k + ny * c * 1 * k; t.forme('ombreP', sfEll(ex, ey, 0.75 * k, 0.75 * k), { decalage: -1, ombre: false, bord: false }); t.poser(Math.round(ex), Math.round(ey), 'givre', 4); } }
  // les tendons : chacun part du dos de la lame, fait le tour de la douille, s'enroule sur le haut du manche ; d'autres retombent
  const dos = i => pts[Math.min(pts.length - 1, 3 + i)];
  for (let i = 0; i < 4; i++) { const q = dos(2 + i * 3), r = (1.6 + (i % 2) * 0.6) * k;   // (ils passent en travers de la douille, font le tour du manche, et repassent devant)
    const chemin = sfChemin(q, [[[q[0] - ny * cote * 4 * k, q[1] + nx * cote * 4 * k], D(3 - i, 9 - i * 2), D(1 - i, 2 - i * 2)], [D(-1 - i, -6), D(-4 - i, -9), D(-7 - i, -3)], [D(-9 - i, 4), D(-12 - i, 3), D(-14 - i * 1.5, -5)], [D(-16 - i * 1.5, -8), D(-19 - i * 1.5, -2), D(-21 - i * 2, 1)]], 12);
    sfTubeForme(t, 'tendon', chemin, u => r * (1 - u * 0.45) + 0.3, { decalage: 0.4, motif: i2 => (i2 && i2.o < -0.45 ? 1.2 : i2 && (i2.s / (1.8 * k)) % 1 < 0.18 ? -0.7 : 0) }); }
  for (let i = 0; i < 6; i++) { const [x0, y0] = D(-1 + i * 1.4, 10 - (i % 3)), l = (10 + hachage(i, 1, 61) * 16) * k, o = (hachage(i, 2, 61) - 0.5) * 5 * k;   // (les lanières qui débordent du côté de la lame et retombent)
    sfTubeForme(t, 'tendon', sfBezier([x0, y0], [x0 + o * 0.4, y0 + l * 0.35], [x0 - o * 0.6, y0 + l * 0.7], [x0 + o, y0 + l], 10), u => (1.3 - u * 0.95) * k + 0.3, { decalage: 0.2, motif: i2 => (i2 && i2.o < -0.5 ? 0.9 : 0) }); }
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
// fumee : { longueur, dissip } la traînée de fumée noire (elle se déplace vers la droite, la fumée s'étire derrière elle) ;
// { immobile: true } la fumée qui monte doucement du bas de sa cape ; null : rien
// cendres : { phase (0 à 1, l'image de l'animation), longueur (0 : immobile ; sinon la traînée, elle avance vers la droite), densite } :
// les cendres noires qui se détachent d'elle en continu (fumee : l'ancienne option, gardée pour mémoire)
// levitation : { hauteur, phase } elle flotte au-dessus du sol (un vide sombre sous ses lambeaux, son ombre plus petite et
// floue au sol), et ondule doucement (phase de 0 à 1, en boucle) ; vent : de 0 à 1, elle glisse vers la droite : le bas de sa
// cape et ses lambeaux traînent en arrière, la faux suit avec un petit retard
function faucheuseCorpsHD(vue = 'face', { visage = 'crane', dissolution = 0, faux = true, souvenirs = ['petale', 'sablier', 'plume'], devoilee = false, fumee = null, cendres = null, levitation = null, vent = 0 } = {}) {
  const MARGE = cendres ? Math.round((cendres.longueur || 0) * 1.1 + 50) : !fumee ? 0 : fumee.immobile ? 40 : Math.round(fumee.longueur * 1.2 + 60);   // (la place de la traînée, à gauche)   // (souvenirs : ceux qu'elle porte encore, pas encore donnés)
  const k = 2, L = 250 + MARGE, H = 302, sol = 290, dir = vue === 'troisQuarts' ? 1 : 0, s = dir ? 1.4 : 0;   // (s : le décalage du visage vers où elle regarde)
  const t = fhToile(L, H), fond = fhToile(L, H), dev = fhToile(L, H);
  const cx = 66 + MARGE + (dir ? 2 : 0), cy = 146;   // (la tête : haute, elle est grande)
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
  if (fumee) fhFumee(fond, cx, cy, sol, k, fumee);
  if (cendres) fhCendres(fond, dev, cx, cy, sol, k, cendres);
  if (vent) {   // (le bas de la cape traîne en arrière : chaque rangée glisse d'autant plus qu'elle est basse ; la faux suit en retard)
    const glisse = (toile, y) => -Math.round(vent * 12 * k * Math.pow(Math.max(0, (y - cy) / (sol - cy)), 1.5));
    for (const toile of [t, fond]) for (let y = cy; y < H; y++) { const d = glisse(toile, y); if (!d) continue; const ligne = [], mats = [], ks = [];
      for (let x = 0; x < L; x++) { const i = y * L + x; ligne.push(toile.c[i]); mats.push(toile.m[i]); ks.push(toile.k[i]); }
      for (let x = 0; x < L; x++) { const sx = x - d, i = y * L + x, ok = sx >= 0 && sx < L; toile.c[i] = ok ? ligne[sx] : null; toile.m[i] = ok ? mats[sx] : null; toile.k[i] = ok ? ks[sx] : 0; } }
    const r = Math.round(vent * 3 * k); if (r) { const c = dev.c.slice(), m = dev.m.slice(), kk = dev.k.slice(); for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) { const i = y * L + x, sx = x + r, ok = sx < L; dev.c[i] = ok ? c[i + r] : null; dev.m[i] = ok ? m[i + r] : null; dev.k[i] = ok ? kk[i + r] : 0; } }
    if (dev.lameFaux) dev.lameFaux = dev.lameFaux.map(([x, y]) => [x - r, y]);
  }
  sfContour(fond, 1); sfContour(t, 2); dev.contour();
  const T = fhToile(L, H); sfColler(T, fond); sfColler(T, t); sfColler(T, dev);
  T.reperes = { sol, cx, tete: [hx, hy], yeux: [[ox - 2.4 * k, oy], [ox + 2.4 * k, oy]], lame: dev.lameFaux || null };
  if (!levitation) return T;
  // la lévitation : la toile s'allonge vers le bas (le vide sous ses lambeaux) ; elle monte et descend doucement ; son ombre au
  // sol, plus petite et floue (tramée), d'autant plus petite qu'elle est haute
  const haut = Math.round(levitation.hauteur || 24 * k), amp = levitation.amplitude ?? 3 * k, ond = Math.round(Math.sin((levitation.phase || 0) * Math.PI * 2) * amp);
  const H2 = H + haut + amp + 8, T2 = fhToile(L, H2), dy = amp - ond;
  for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) { const i = y * L + x; if (T.c[i] === null) continue; const j = (y + dy) * L + x; T2.c[j] = T.c[i]; T2.m[j] = T.m[i]; T2.k[j] = T.k[i]; }
  const B = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]], syO = H2 - 5, rx = (26 - (haut + dy) / k * 0.25) * k, ry = 3 * k;
  for (let y = syO - ry; y <= syO + ry; y++) for (let x = Math.round(cx - rx); x <= cx + rx; x++) { const dd = Math.pow((x - cx) / rx, 2) + Math.pow((y - syO) / ry, 2); if (dd > 1) continue;
    if ((1 - dd) * 1.3 * 16 > B[y % 4][(x % 4 + 4) % 4] + 2) T2.poser(x, y, 'ombreP', 1); }
  T2.reperes = { ...T.reperes, yeux: T.reperes.yeux.map(([x, y]) => [x, y + dy]), lame: T.reperes.lame ? T.reperes.lame.map(([x, y]) => [x, y + dy]) : null, sol: H2 - 5, corps: dy };
  return T2;
}
// Le buste, à la taille des bustes du comptoir (80 × 100, affiché ×2,3 ; elle dépasse en haut comme les grands)
function faucheuseBusteHD({ visage = 'crane', parle = false, devoilee = false, souvenirs = ['petale', 'sablier', 'plume'] } = {}) {
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
  if (souvenirs.includes('petale')) t.forme('petale', sfPoly([[bx, by - 0.6 * k], [bx + 3.2 * k, by + 1.4 * k], [bx + 1.6 * k, by + 5.2 * k], [bx - 1.4 * k, by + 4 * k]], [0.2, -0.3, 0.9]), { decalage: 0.4 });
  // la main pâle sur le manche, devant
  const mx = cx + 13 * k, my = cy + 10 * k, mat = visage === 'ombre' ? 'robeC' : 'osMain';
  t.forme(mat, sfEll(mx, my, 2.2 * k, 2.8 * k), { decalage: 0.3 }); for (let d = 0; d < 4; d++) sfTubeForme(t, mat, [[mx - 1.6 * k + d * 1.1 * k, my + 1 * k], [mx - 1.9 * k + d * 1.2 * k, my + 5.5 * k]], u => 0.55 * k, { decalage: 0.2 - d * 0.1, ombre: false });
  sfContour(fond, 1); sfContour(t, 2);
  const T = fhToile(L, H); sfColler(T, fond); sfColler(T, t); sfColler(T, dev); T.reperes = { lame: fond.lameFaux || null, yeux: [[cx - 3.2 * k, cy + 0.2 * k], [cx + 3.2 * k, cy + 0.2 * k]] }; return T;
}

// La fumée noire qu'elle laisse derrière elle (comme une silhouette qui vole) : des volutes tramées, d'un noir dense près
// d'elle, qui s'étirent, montent un peu et se dissipent. Immobile : quelques volutes qui montent doucement du bas de sa cape.
SF_RAMPES.fumee = [0x000000, 0x030206, 0x07050c, 0x0c0912, 0x130f1c, 0x1c1628];
function fhFumee(t, cx, cy, sol, k, { longueur = 200, dissip = 0, immobile = false, graine = 7 } = {}) {
  t.rampes.fumee = SF_RAMPES.fumee;
  const B = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  for (let y = 0; y < t.h; y++) for (let x = 0; x < t.l; x++) {
    let d;
    const n = fbm(x * 0.04 + graine, y * 0.07, graine, 3), ruban = Math.sin(y * 0.12 + x * 0.025 + n * 5);
    if (immobile) {
      // la fumée monte des lambeaux, en volutes qui ondulent, et s'efface vers le haut et sur les côtés
      const h = (sol + 4 * k - y) / ((sol - cy) * 0.85), lx = (x - cx - Math.sin(y * 0.05 + graine) * 4 * k) / (44 * k); if (h < -0.03 || h > 1 || Math.abs(lx) > 1) continue;
      d = (1 - h) * (1 - lx * lx) * (0.55 + 1.3 * n + ruban * 0.2) - 0.12;   // (tout passe par l'enveloppe : des bords doux)
    } else {
      // la traînée : derrière elle (à gauche) ; elle s'élargit, monte, se défait en volutes et pâlit en s'éloignant
      const dist = cx - 14 * k - x; if (dist < -12 * k) continue;
      const f = Math.max(0, dist) / longueur; if (f > 1.2) continue;
      const axe = (cy + sol) * 0.56 - f * 26 * k + Math.sin(dist * 0.025 + graine) * 7 * k, demi = (18 + f * 30) * k;
      const v = Math.abs(y - axe) / demi; if (v > 1) continue;
      d = (1 - v) * Math.max(0, 1.15 - f) * (0.6 + 1.3 * n + ruban * 0.25) - dissip * (0.5 + f) - 0.1 - (dist < 0 ? -dist / (12 * k) : 0);
    }
    if (d <= 0) continue;
    const cran = Math.min(1, d * 1.6) * 3 + (B[y % 4][x % 4] + 0.5) / 16; if (cran < 0.9) continue;   // (tramée : de plus en plus de trous en se dissipant)
    if (t.c[y * t.l + x] !== null) continue;
    t.poser(x, y, 'fumee', Math.max(0, Math.min(5, Math.round(d * 3 + (fbm(x * 0.12, y * 0.12, graine + 3, 2) - 0.5) * 3))));
  }
}

// (v6) Les cendres : toute la noirceur qu'elle renferme s'évapore d'elle, sans fin. Des flocons et des gouttes noires, de
// tailles variées, se détachent de sa capuche, de ses épaules et de sa cape, montent en tournoyant et se dissolvent.
// phase : l'image de l'animation (0 à 1, en boucle) ; longueur : quand elle avance (vers la droite), elles restent derrière
// elle et font la traînée ; densite : plus ou moins dense
function fhCendres(fond, dev, cx, cy, sol, k, { phase = 0, longueur = 0, densite = 1, graine = 9 } = {}) {
  for (const t of [fond, dev]) t.rampes.cendre = FH_RAMPES.cendre;
  const n = Math.round((longueur ? 260 : 150) * densite);
  for (let i = 0; i < n; i++) {
    const h = hachage(i, 1, graine), a = (h + phase) % 1;   // (l'âge de la cendre : 0 elle se détache, 1 elle s'est dissoute)
    // d'où elle part : la capuche, les épaules, ou la cape (plus nombreuses), sur le bord de la silhouette
    const z = hachage(i, 2, graine), bord = hachage(i, 3, graine) - 0.5;
    const [x0, y0] = z < 0.25 ? [cx + bord * 26 * k, cy - 12 * k + Math.abs(bord) * 18 * k] : z < 0.5 ? [cx + bord * 34 * k, cy + 10 * k] : [cx + bord * (30 + hachage(i, 4, graine) * 40) * k, cy + 20 * k + hachage(i, 5, graine) * (sol - cy - 24 * k)];
    const monte = (26 + hachage(i, 6, graine) * 46) * k * (longueur ? 0.55 : 1), tour = (hachage(i, 7, graine) - 0.5) * 10 * k;
    let x = x0 + Math.sin(a * 7 + i) * tour * a + bord * 8 * k * a, y = y0 - a * monte - a * a * 6 * k;
    if (longueur) x -= a * longueur * (0.7 + 0.5 * hachage(i, 8, graine));   // (elle avance : la cendre reste derrière)
    const taille = (0.6 + hachage(i, 9, graine) * 2.4) * k * Math.pow(1 - a, 0.8); if (taille < 0.55) continue;
    const goutte = hachage(i, 10, graine) > 0.55, rot = a * 6 + i;
    const t = hachage(i, 11, graine) > 0.7 ? dev : fond;   // (certaines passent devant elle)
    if (goutte) {   // une goutte : ronde, avec une queue qui pend vers le bas (elle vient de se détacher)
      t.forme('cendre', sfEll(x, y, taille * 0.8, taille * 0.9), { decalage: -0.2, ombre: false, bord: false });
      sfTubeForme(t, 'cendre', [[x, y + taille * 0.5], [x + Math.sin(rot) * 0.6 * k, y + taille * 2.2]], u => taille * 0.45 * (1 - u * 0.8) + 0.3, { decalage: -0.6, ombre: false, bord: false });
    } else t.forme('cendre', sfEll(x, y, taille, taille * (0.4 + 0.4 * Math.abs(Math.sin(rot))), rot), { decalage: -0.3, ombre: false, bord: false });   // un flocon qui tournoie
    if (taille > 1.4 * k) t.poser(Math.round(x - taille * 0.3), Math.round(y - taille * 0.3), 'cendre', 5);   // (un reflet violet, comme une suie mouillée)
  }
}

// (v7) Les cendres laissées en place, dans le monde : chaque cendre se détache d'elle à une image donnée, là où elle est à ce
// moment-là, puis monte, tournoie et se dissout là où elle est née (elle ne la suit pas). source(f) : où est son corps à
// l'image f ({ x, haut, bas, demi } en pixels de la toile du monde) ; f : l'image à dessiner ; parImage : combien de cendres
// se détachent à chaque image
function fhCendresMonde(t, source, f, { parImage = 9, vie = 22, graine = 5, e = 1, fines = 0 } = {}) {   // (fines : les poussières de suie et braises éteintes du sillage, par image)
  t.rampes.cendre = FH_RAMPES.cendre; t.rampes.braiseE = [0x1a1622, 0x2a2434, 0x3c3448, 0x524862, 0x6a5e7e, 0x857a98];
  // (v8) le sillage : de fines poussières de suie et quelques braises éteintes, d'un gris violet, qui tourbillonnent derrière
  // elle puis retombent ou se dissolvent (seulement quand elle avance)
  if (fines) for (let f0 = Math.max(1, f - 30); f0 <= f; f0++) { const S = source(f0), S0 = source(f0 - 1); if (!S || !S0) continue;
    const vx = S.x - S0.x; if (Math.abs(vx) < 0.5) continue;
    for (let j = 0; j < fines; j++) { const id = f0 * 53 + j, h = n => hachage(id, n, graine + 3), a = (f - f0 + h(1)) / 30; if (a > 1) continue;
      const x0 = S.x - Math.sign(vx) * (S.demi * (0.4 + h(2) * 0.9)), y0 = S.haut + h(3) * (S.bas - S.haut) * 1.05;
      const tourne = (h(4) - 0.5) * 26 * e, retombe = h(5) > 0.45;
      const x = x0 - vx * 0.35 * a * 6 + Math.sin(a * 9 + id) * tourne * a, y = y0 + (retombe ? a * a * 40 * e : -a * (20 + h(6) * 30) * e) + Math.cos(a * 9 + id) * tourne * 0.4 * a;
      if (h(7) < a * 0.9) continue;   // (elles se dissolvent en route)
      const braise = h(8) > 0.82, m = braise ? 'braiseE' : 'cendre', taille = braise ? (h(9) > 0.5 ? 2 : 1) : 1;
      for (let dy = 0; dy < taille; dy++) for (let dx = 0; dx < taille; dx++) t.poser(Math.round(x) + dx, Math.round(y) + dy, m, braise ? 3 + Math.round((1 - a) * 2) : 2 + (h(10) > 0.6 ? 1 : 0));
    } }
  for (let f0 = Math.max(0, f - vie); f0 <= f; f0++) { const S = source(f0); if (!S) continue;
    for (let j = 0; j < parImage; j++) { const id = f0 * 31 + j, h = n => hachage(id, n, graine), a = (f - f0 + h(1)) / vie; if (a > 1) continue;
      const zone = h(2), bord = h(3) - 0.5;
      const x0 = S.x + bord * S.demi * (zone < 0.3 ? 0.6 : 1), y0 = zone < 0.3 ? S.haut + Math.abs(bord) * (S.bas - S.haut) * 0.25 : S.haut + (0.2 + h(4) * 0.8) * (S.bas - S.haut);
      const monte = (30 + h(5) * 60) * e, tour = (h(6) - 0.5) * 18 * e;
      const x = x0 + Math.sin(a * 6 + id) * tour * a, y = y0 - a * monte - a * a * 10 * e;
      const taille = (0.8 + h(7) * 3) * e * Math.pow(1 - a, 0.8); if (taille < 0.6) continue;
      if (h(8) > 0.55) { t.forme('cendre', sfEll(x, y, taille * 0.8, taille * 0.9), { decalage: -0.2, ombre: false, bord: false });
        sfTubeForme(t, 'cendre', [[x, y + taille * 0.5], [x + Math.sin(a * 5 + id) * 1.2 * e, y + taille * 2.2]], u => taille * 0.45 * (1 - u * 0.8) + 0.3, { decalage: -0.6, ombre: false, bord: false }); }
      else t.forme('cendre', sfEll(x, y, taille, taille * (0.4 + 0.4 * Math.abs(Math.sin(a * 6 + id))), a * 6 + id), { decalage: -0.3, ombre: false, bord: false });
      if (taille > 2.2 * e) t.poser(Math.round(x - taille * 0.3), Math.round(y - taille * 0.3), 'cendre', 5);
    } }
}

// =====================================================================================================================
// Dans le jeu : ses textures (son buste à la fenêtre du comptoir, sa silhouette dans la file, en lévitation), ses
// souvenirs portés (ceux qu'elle n'a pas encore donnés), ses cendres qui s'évaporent d'elle et restent derrière elle, et
// sa dissolution dans l'ombre quand elle repart. Son aura et la lueur de la Larme de Lune ne s'allument pas ici (aucun
// moment du jeu où elle se dévoile, pour l'instant).
// =====================================================================================================================
const FH_RELIQUES = { petale: 'petaleNoir', sablier: 'sablier', plume: 'plumeCorbeau' };
// Les souvenirs qu'elle porte encore : ceux de ses reliques qu'elle ne t'a pas encore laissées
function souvenirsFaucheuse(G) {
  const donnes = (G && G.faucheuse && G.faucheuse.reliques) || [];
  return Object.keys(FH_RELIQUES).filter(s => !donnes.includes(FH_RELIQUES[s]));
}
// Sa texture : quoi = 'buste' (la fenêtre du comptoir) ou 'corps' (en pied ; levitation : elle flotte au-dessus du sol).
// Les corps portent le préfixe « corps_ » : ils prennent l'échelle des corps HD (echelleCorps).
function textureFaucheuseHD(scene, quoi = 'corps', { vue = 'troisQuarts', G = (typeof GAME !== 'undefined' ? GAME : null), levitation = true } = {}) {
  const sv = souvenirsFaucheuse(G), sig = sv.join('-') || 'aucun';
  const cle = quoi === 'buste' ? 'busteHD_faucheuse_' + sig : 'corps_faucheuseHD_' + vue + (levitation ? '_lev_' : '_sol_') + sig;
  if (!scene.textures.exists(cle)) {
    const t = quoi === 'buste' ? faucheuseBusteHD({ visage: 'crane', souvenirs: sv }) : faucheuseCorpsHD(vue, { visage: 'crane', souvenirs: sv, ...(levitation ? { levitation: { hauteur: 48, phase: 0.25 } } : {}) });
    t.texture(scene, cle); const tex = scene.textures.get(cle); tex.reperesFaucheuse = t.reperes;
    tex.toileFH = t; tex.geomFH = quoi === 'buste' ? { cy: 94, k: 2 } : { cy: 146, k: 2 };   // (pour sa dissolution)
  }
  return cle;
}
// Sa taille dans la file, à côté des autres (elle les dépasse d'une tête, sa faux au-dessus) : un facteur de l'échelle des corps
const FH_ECHELLE_FILE = 0.8;
// Les petites cendres (quatre formes : trois flocons, une goutte), dessinées une fois
function texturesCendresFH(scene) {
  if (scene.textures.exists('fhCendre3')) return;
  const formes = [[2, 1.4, 0], [3, 2, 0.6], [4.5, 2.6, 1.1], [3, 3, 0]];
  formes.forEach(([rx, ry, ang], i) => { const t = fhToile(14, 18); t.rampes.cendre = FH_RAMPES.cendre;
    t.forme('cendre', sfEll(7, 7, rx, ry, ang), { decalage: -0.2, ombre: false, bord: false });
    if (i === 3) sfTubeForme(t, 'cendre', [[7, 9], [7.5, 15]], u => 1.4 * (1 - u * 0.8) + 0.3, { decalage: -0.6, ombre: false, bord: false });   // (la goutte et sa queue)
    if (rx > 3) t.poser(6, 6, 'cendre', 5);
    t.contour(); t.texture(scene, 'fhCendre' + i); });
}
// Ses cendres, dans une scène : elles se détachent de `cible` (une image posée par le bas), montent en tournoyant et se
// dissolvent ; elles restent là où elles sont nées (quand elle glisse, elles font sa traînée). Rend { arreter, rafale }.
function cendresFaucheuse(scene, cible, { masque = null, cadence = 70, haut = 0.88, bas = 0.15, large = 0.42 } = {}) {
  texturesCendresFH(scene);
  const vivantes = [];
  const une = (dense = 1) => {
    if (!cible.active || !cible.visible || cible.alpha < 0.05) return;
    const h = cible.displayHeight, w = cible.displayWidth, e = Math.max(0.55, Math.min(1.1, cible.scaleX * 0.6));
    const x = cible.x + (Math.random() - 0.5) * w * large, y = cible.y - h * (bas + Math.random() * (haut - bas));
    const c = scene.add.image(x, y, 'fhCendre' + Math.floor(Math.random() * 4)).setScale(e * (0.5 + Math.random() * 0.7)).setDepth(cible.depth + (Math.random() < 0.3 ? 0.05 : -0.05)).setAngle(Math.random() * 360);
    if (masque) c.setMask(masque);
    vivantes.push(c);
    const duree = 1600 + Math.random() * 1400, monte = (30 + Math.random() * 55) * e * dense, derive = (Math.random() - 0.5) * 30 * e;
    scene.tweens.add({ targets: c, y: y - monte, duration: duree, ease: 'Sine.easeOut' });
    scene.tweens.add({ targets: c, x: x + derive, duration: duree / 2, yoyo: true, ease: 'Sine.easeInOut' });
    scene.tweens.add({ targets: c, angle: c.angle + (Math.random() - 0.5) * 540, scale: c.scale * 0.2, alpha: 0, duration: duree, ease: 'Quad.easeIn',
      onComplete: () => { c.destroy(); const i = vivantes.indexOf(c); if (i >= 0) vivantes.splice(i, 1); } });
  };
  const minuterie = scene.time.addEvent({ delay: cadence, loop: true, callback: () => { une(); if (Math.random() < 0.5) une(); } });
  return {
    rafale: (n = 30) => { for (let i = 0; i < n; i++) scene.time.delayedCall(i * 25, () => une(1.4)); },
    arreter: () => { minuterie.remove(); },
    detruire: () => { minuterie.remove(); for (const c of vivantes.splice(0)) c.destroy(); },
  };
}
// Son buste à la fenêtre du comptoir : à cette échelle, la Larme de Lune tient entière dans le cadre ; la pointe de sa
// lame à FH_HAUT_BUSTE sous le haut de la fenêtre (les étiquettes de la file et de l'heure descendent jusqu'à 36 px
// sous le haut, et elle flotte de 7 px)
const FH_ECHELLE_BUSTE = 1.45, FH_HAUT_BUSTE = 52;
// Une image de sa dissolution (planche validée) : le bas se défait en un bord effiloché, des rubans d'ombre s'en
// détachent et montent ; d de 0 (entière) à 1. T : sa toile finie ; cy, k : le haut du corps et l'échelle de la toile.
function fhDissoudreToile(T, d, { cy, k, graine = 11 }) {
  const L = T.l, H = T.h, C = fhToile(L, H), sol = H;
  C.rampes = { ...T.rampes }; C.c = T.c.slice(); C.m = T.m.slice(); C.k = T.k.slice();
  const seuil = sol - d * 1.15 * (sol - cy + 16 * k);
  for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) { const i = y * L + x; if (C.c[i] === null) continue;
    const bruit = (fbm(x * 0.07, y * 0.04, graine, 2) - 0.5) * 30 * k, ruban = Math.sin(x * 0.5 + y * 0.08) > 0.6 - d * 0.4;
    if (y > seuil + bruit || (d > 0.3 && ruban && y > seuil - 14 * k * d)) { C.c[i] = null; C.m[i] = null; }
    else if (y > seuil + bruit - 3 * k) C.poser(x, y, C.m[i] || 'robe', Math.min(C.k[i], 1));   // (le bord qui se défait s'assombrit)
  }
  const dev = fhToile(L, H), cx = L / 2;
  for (let m = 0; m < 14 * d; m++) { const x = cx + (hachage(m, 5, 2) - 0.5) * 50 * k, y0 = Math.min(sol, seuil + hachage(m, 6, 2) * 20 * k), l = (10 + hachage(m, 7, 2) * 24) * k;
    sfTubeForme(dev, m % 3 ? 'robe' : 'robeC', sfBezier([x, y0], [x + Math.sin(m) * 6 * k, y0 - l * 0.4], [x - Math.sin(m * 2) * 6 * k, y0 - l * 0.75], [x + Math.sin(m) * 3 * k, y0 - l], 10), u => (1.6 - u * 1.3) * k + 0.3, { decalage: 0.1, ombre: false }); }
  sfColler(C, dev);
  return C;
}
const FH_ETAPES_DISSOLUTION = [0.12, 0.24, 0.36, 0.48, 0.6, 0.72, 0.84, 0.95];
// Les images de sa dissolution, pour une texture faite par textureFaucheuseHD (une fois chacune) ; [] sinon
function texturesDissolutionFH(scene, cle) {
  const tex = scene.textures.get(cle), T = tex && tex.toileFH; if (!T) return [];
  return FH_ETAPES_DISSOLUTION.map((d, i) => { const c = cle + '_dis' + i;
    if (!scene.textures.exists(c)) fhDissoudreToile(T, d, tex.geomFH).texture(scene, c);
    return c; });
}
// Elle se dissout dans l'ombre (planche validée) : le bas se défait en rubans d'ombre au bord effiloché, une rafale de
// cendres monte, ses yeux s'éteignent quand l'ombre les atteint, et le reste s'efface. fin() quand elle a disparu.
function dissoudreFaucheuse(scene, img, { duree = 1600, cendres = null, yeux = [], fin = null } = {}) {
  const images = texturesDissolutionFH(scene, img.texture.key), etat = { p: 0 }, w = img.width, h = img.height;
  let eteints = false;
  if (cendres) cendres.rafale(40);
  scene.tweens.add({ targets: etat, p: 1, duration: duree, ease: 'Sine.easeIn',
    onUpdate: () => {
      if (images.length) { const n = Math.min(images.length - 1, Math.floor(etat.p * images.length)); if (img.texture.key !== images[n]) img.setTexture(images[n]); }
      else img.setCrop(0, 0, w, Math.max(1, h * (1 - etat.p * 0.92)));   // (une texture sans toile : simplement coupée)
      img.setAlpha(1 - Math.max(0, etat.p - 0.75) / 0.25);
      if (!eteints && etat.p > 0.55) { eteints = true; for (const o of yeux) scene.tweens.add({ targets: o, alpha: 0, duration: 260, onComplete: () => o.destroy() }); }
    },
    onComplete: () => { if (!eteints) for (const o of yeux) o.destroy(); if (fin) fin(); } });
}
// Les lueurs rouges de ses yeux, sur une image posée par le bas (origine 0.5, 1)
function yeuxFaucheuse(scene, img, prof = null) {
  const R = scene.textures.get(img.texture.key).reperesFaucheuse; if (!R || !R.yeux || typeof creerHalo !== 'function') return [];
  creerHalo(scene);
  return R.yeux.map(([ex, ey]) => { const x = img.x + (img.flipX ? img.width / 2 - ex : ex - img.width / 2) * img.scaleX, y = img.y - (img.height - ey) * img.scaleY;
    const o = scene.add.image(x, y, 'halo').setScale(Math.max(0.06, img.scaleX * 0.07)).setTint(0xff3a2a).setAlpha(0.85).setBlendMode(Phaser.BlendModes.ADD).setDepth((prof ?? img.depth) + 0.1);
    if (img.mask) o.setMask(img.mask); return o; });
}
