// (v1.65, la ville des Hobbits en quartiers, chantier 2 : le socle) Le plan de la ville (touche M), peint pixel par pixel
// et affiché ×2 : c'est celui de la planche 89 v7, validé le 26/10 (panneau 1). Les prés et les champs aux haies
// irrégulières, la rivière aux Trois Pommes et son pont de pierre, l'étang, les Coteaux et leurs buttes à portes rondes,
// les rues pavées, la place des Mastres et ses étals, les maisons vues d'en haut, le Rempart et la Grand-Porte, la
// chapelle, l'hospice, le Vieux Moulin et sa roue, la cabane de Barnabé sur pilotis, les trois pommiers, les bois, la rose
// des vents. Rien dans l'eau qui ne devrait pas y être ; aucun nom ne couvre un dessin (PLAN_VILLE_INFO.boites).
// Les noms, les médaillons des passages et « tu es ici » sont posés par-dessus, à la résolution des textes (villeQuartiers.js).

const PLAN_VILLE = { L: 477, H: 268 };
// Ce que le dessin du plan sait de lui-même : les boîtes des dessins (pour que rien d'écrit ne les couvre), les pommiers
const PLAN_VILLE_INFO = { boites: [], pommiers: [] };
function* planVilleEtapes(s, cle = 'planVilleHD') {
  if (s.textures.exists(cle)) return cle;
  const { L, H } = PLAN_VILLE, t = toileV2(L, H), R = t.rampes, boites = [];
  Object.assign(R, { herbeK: rampe(0x8cb860), herbeK2: rampe(0x7aa852), colline: rampe(0x86b45a), foretK: rampe(0x3e7a3a), foretK2: rampe(0x4e8a3e), ble: rampe(0xd8c06a), labour: rampe(0xa88454), pre: rampe(0x9cc068),
    eauK: [0x1e4a6e, 0x2a5e86, 0x3a76a0, 0x5a96bc, 0x8abcd8, 0xd0e8f2], terreK: rampe(0xc8a470), paveK: rampe(0xb0a490), murK: rampe(0x9a9080), murC: rampe(0xd8ccb0),
    toitR: rampe(0xb84a2e), toitA: rampe(0x4a5468), toitC: rampe(0xd0a850), murH: rampe(0xe8dcc0), encre: rampe(0x4a3420), pomme: rampeVive(0xd02a20), violet: rampeVive(0x6a3a9a), bois: rampe(0x8a5a30), boisS: rampe(0x5a3a20) });
  const P = (x, y, m, k) => t.poser(Math.round(x), Math.round(y), m, k), MX0 = X => 70 + X * 0.065;
  const boite = (x0, y0, x1, y1, nom) => boites.push([x0, y0, x1, y1, nom]);
  yield;
  // ---- 0. les prés ; les champs : des parcelles aux bords irréguliers, des sillons qui suivent la pente, des haies, une meule, des moutons ----
  for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) { const n = fbm(x * 0.04, y * 0.05, 9101); t.poser(x, y, n > 0.58 ? 'herbeK' : 'herbeK2', 3 + (n > 0.66 ? 1 : n < 0.34 ? -1 : 0)); }
  const parcelles = [];
  const parcelle = (cx, cy, rx, ry, m, ang, g) => {
    const dedans = (x, y) => { const u = (x + 0.5 - cx) / rx, v = (y + 0.5 - cy) / ry; return u ** 4 + v ** 4 + (fbm(x * 0.2, y * 0.2, g) - 0.5) * 0.35 < 1; };
    for (let y = Math.floor(cy - ry - 2); y <= cy + ry + 2; y++) for (let x = Math.floor(cx - rx - 2); x <= cx + rx + 2; x++) { if (!dedans(x, y)) continue;
      const w = (x - cx) * Math.sin(ang) + (y - cy) * Math.cos(ang) + Math.sin((x - cx) / 7 + g) * 1.2;   // le sillon ondule avec le terrain
      const sil = ((Math.floor(w / 2) % 2) + 2) % 2;
      if (m === 'pre') t.poser(x, y, 'pre', 3 + (hachage(x, y, g) > 0.9 ? 1 : 0)); else t.poser(x, y, m, m === 'ble' ? 3 + sil : 2 + sil);
    }
    // la haie tout autour : des touffes rondes, sombres ; une ouverture côté chemin
    for (let a = 0; a < 6.283; a += 0.09) { const c = Math.cos(a), sn = Math.sin(a), r = Math.pow(Math.pow(Math.abs(c), 4) + Math.pow(Math.abs(sn), 4), -0.25);
      const x = Math.round(cx + c * rx * r * 1.06), y = Math.round(cy + sn * ry * r * 1.08); if (Math.abs(a - 3.14) < 0.25) continue; P(x, y, 'foretK', 2 + (hachage(x, y, g) > 0.5 ? 1 : 0)); P(x + 1, y, 'foretK', 3); }
    parcelles.push([cx - rx - 2, cy - ry - 2, cx + rx + 2, cy + ry + 2]);
  };
  parcelle(28, 126, 19, 11, 'labour', 0.25, 9131); parcelle(28, 153, 19, 11, 'ble', -0.2, 9132); parcelle(28, 205, 19, 12, 'pre', 0, 9133);
  parcelle(262, 256, 22, 6, 'ble', 0.05, 9134); parcelle(314, 256, 24, 6, 'labour', -0.1, 9135); parcelle(459, 160, 9, 15, 'ble', 1.3, 9136); parcelle(459, 198, 9, 15, 'labour', 1.5, 9137);
  { const mx = 34, my = 150; t.forme('ble', ellipsoide(mx, my, 3.2, 2.6), { decalage: 0.6 }); P(mx + 1, my + 3, 'boisS', 1); P(mx + 2, my + 3, 'boisS', 1); }   // la meule de foin
  { const mx = 266, my = 255; t.forme('ble', ellipsoide(mx, my, 3, 2.3), { decalage: 0.6 }); }
  for (const [x, y] of [[22, 203], [30, 209], [36, 201]]) { P(x, y, 'murH', 5); P(x + 1, y, 'murH', 4); P(x, y + 1, 'murH', 3); P(x - 1, y, 'boisS', 1); }   // des moutons au pré
  const arbre = (x, y, r = 3, m = 'foretK') => { t.forme(m, ellipsoide(x, y, r, r * 0.9), { decalage: 0.45 }); P(x + 1, y + r, 'boisS', 1); };
  for (let y = 108; y < 232; y++) { if (y > 174 && y < 182) continue; P(53, y, 'terreK', 3); P(54, y, 'terreK', 4); }   // le chemin des champs, le long du rempart
  yield;
  // ---- 1. la rivière aux Trois Pommes ----
  const riv = [[449, -4], [445, 30], [440, 64], [437, 100], [438, 140], [434, 176], [425, 204], [406, 224], [372, 233], [320, 235], [250, 236], [180, 236], [120, 237], [60, 236], [-6, 238]];
  const distRiv = (x, y) => { let d = 1e9; for (let i = 0; i < riv.length - 1; i++) { const [ax, ay] = riv[i], [bx, by] = riv[i + 1], dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy, u = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l2)); d = Math.min(d, Math.hypot(ax + u * dx - x, ay + u * dy - y)); } return d; };
  const larg = (x, y) => y > 214 ? 7.5 : 5.5;
  const distRiv3 = (x, y) => distRiv(x, y) - larg(x, y); PLAN_VILLE_INFO.distRiv = distRiv3;
  for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) { const d = distRiv(x, y), w = larg(x, y); if (d < w) t.poser(x, y, 'eauK', d < w - 1.6 ? (fbm(x * 0.2, y * 0.3, 9104) > 0.62 ? 4 : 3) : 2); else if (d < w + 1.5) t.poser(x, y, 'terreK', d < w + 0.8 ? 2 : 4); }
  for (let n = 0; n < 200; n++) { const x = Math.floor(hachage(n, 1, 9105) * L), y = Math.floor(hachage(n, 2, 9105) * H); if (distRiv(x, y) < larg(x, y) - 2.2) { P(x, y, 'eauK', 5); P(x + 1, y, 'eauK', 5); } }
  yield;
  // ---- 2. l'étang, à l'est de la grand-place ----
  const ex = 394, ey = 156, erx = 25, ery = 11;
  for (let y = ey - ery - 3; y < ey + ery + 3; y++) for (let x = ex - erx - 3; x < ex + erx + 3; x++) { const d = Math.hypot((x + 0.5 - ex) / erx, (y + 0.5 - ey) / ery) + (fbm(x * 0.2, y * 0.2, 9106) - 0.5) * 0.1; if (d < 1) t.poser(x, y, 'eauK', d < 0.82 ? (hachage(x >> 1, y, 9107) > 0.93 && d > 0.3 ? 4 : 3) : 2); else if (d < 1.1) t.poser(x, y, 'terreK', 3); }
  for (const [x, y] of [[376, 160], [384, 163], [408, 151]]) { P(x, y, 'foretK2', 4); P(x + 1, y, 'foretK2', 3); P(x, y - 1, 'pomme', 5); }   // des nénuphars
  for (let x = ex + erx; x < 433; x++) { const y = Math.round(ey + Math.sin((x - ex - erx) / 3) * 1.2); P(x, y, 'eauK', 3); P(x, y + 1, 'eauK', 2); }   // le ru qui file à la rivière
  yield;
  // ---- 3. les Coteaux : la pente douce qui monte au nord ; une butte ronde par maison, sa porte ronde au pied, côté sud ;
  //      des sentiers qui serpentent en contrebas des buttes, et un petit chemin de la porte au sentier ----
  { // le relief des Coteaux : de larges croupes (somme de bosses douces), ombrées en trois tons, la lumière du nord-ouest
    const croupes = [[120, 50, 46, 34], [200, 40, 48, 32], [270, 30, 40, 26], [360, 44, 52, 30], [160, 100, 44, 26], [230, 104, 30, 20], [410, 28, 30, 24]];
    const h = (x, y) => croupes.reduce((v, [cx, cy, rx, ry]) => v + Math.exp(-(((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2) * 2), 0);
    for (let y = 4; y < 132; y++) for (let x = 70; x < 432; x++) { if (Math.hypot((x - 307) / 50, (y - 108) / 32) < 1) continue; const v = h(x, y); if (v < 0.35) continue;
      const lum = -((h(x + 2, y) - h(x - 2, y)) + (h(x, y + 2) - h(x, y - 2))) * 6; const k = lum > 0.35 ? 4 : lum < -0.35 ? 2 : 3;
      t.poser(x, y, v < 0.45 ? 'herbeK' : 'colline', v < 0.45 ? 3 : k + ((x + y) % 2 === 0 && Math.abs(Math.abs(lum) - 0.35) < 0.06 ? (lum > 0 ? -1 : 1) : 0)); }
  }
  const chemin = (pts, w, m, k) => { for (let i = 0; i < pts.length - 1; i++) { const [ax, ay] = pts[i], [bx, by] = pts[i + 1], n = Math.ceil(Math.hypot(bx - ax, by - ay) * 2); for (let j = 0; j <= n; j++) { const x = ax + (bx - ax) * j / n, y = ay + (by - ay) * j / n; for (let a = -w; a <= w; a++) for (let b = -w; b <= w; b++) if (a * a + b * b <= w * w + 0.5) P(x + a, y + b, m, k + (b === -w ? 1 : b === w ? -1 : 0)); } } };
  const courbe = (pts, w, m, k) => { const q = []; for (let i = 0; i < pts.length - 1; i++) { const [ax, ay] = pts[i], [bx, by] = pts[i + 1]; for (let u = 0; u < 1; u += 0.08) { const v = u * u * (3 - 2 * u); q.push([ax + (bx - ax) * u, ay + (by - ay) * v]); } } q.push(pts[pts.length - 1]); chemin(q, w, m, k); };
  courbe([[307, 82], [298, 64], [292, 44], [300, 20], [296, -4]], 1, 'terreK', 3);                 // le chemin creux
  courbe([[MX0(1615), 140], [176, 122], [168, 108], [176, 86], [170, 70], [178, 48]], 1, 'terreK', 3);   // le chemin des Coteaux, en haut de la ruelle du Pommier
  courbe([[88, 76], [124, 82], [170, 77], [214, 84], [252, 79], [292, 76]], 1, 'terreK', 3);      // le sentier du bas
  courbe([[118, 50], [150, 56], [178, 48], [214, 54], [256, 47], [296, 50]], 1, 'terreK', 3);    // le sentier du haut
  courbe([[316, 66], [346, 72], [384, 66], [420, 72]], 1, 'terreK', 3);
  courbe([[MX0(2700), 140], [252, 116], [236, 102], [214, 84]], 0.8, 'terreK', 3);
  const buttes = [[104, 66, 'voletV'], [148, 64, 'voletR'], [196, 70, 'voletJ'], [236, 66, 'voletB'], [278, 62, 'voletV'], [138, 38, 'voletB'], [196, 36, 'voletR'], [240, 34, 'voletV'], [334, 56, 'voletJ'], [368, 52, 'voletR'], [404, 58, 'voletB'], [120, 104, 'voletJ'], [214, 112, 'voletV']];
  for (const [cx, cy, c] of buttes) {   // la butte : une demi-sphère d'herbe, éclairée en haut à gauche, posée sur la pente
    t.forme('colline', (x, y) => { const nx = (x + 0.5 - cx) / 14, ny = (y + 0.5 - cy) / 10; if (ny > 0.1 || nx * nx + ny * ny > 1) return null; return [nx, ny, Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny))]; }, { decalage: 0.35 });
  }
  for (const [cx, cy, c] of buttes) {
    const px = cx - 2, py = cy - 1;
    for (let b = -4; b <= 2; b++) for (let a = -4; a <= 4; a++) { const d = Math.hypot(a, b); if (d > 4.1) continue; P(px + a, py + b, d > 2.7 ? 'murC' : c, d > 2.7 ? (b < 0 && a < 1 ? 5 : 3) : (a + b < 0 ? 4 : 2)); }
    P(px, py, 'or', 5);
    for (const [a, b, m, k] of [[6, -2, c, 3], [7, -2, c, 3], [8, -2, c, 3], [5, -1, c, 2], [6, -1, 'eauK', 5], [7, -1, c, 2], [8, -1, 'eauK', 4], [9, -1, c, 2], [6, 0, c, 2], [7, 0, c, 2], [8, 0, c, 2]]) P(px + a, py + b, m, k);
    for (let a = -3; a <= 3; a++) P(px + a, py + 3, 'murC', 4);
    P(px, py + 4, 'terreK', 3); P(px, py + 5, 'terreK', 3); P(px + 1, py + 6, 'terreK', 3);
    P(cx + 5, cy - 8, 'murK', 4); P(cx + 6, cy - 8, 'murK', 2); P(cx + 5, cy - 9, 'murK', 4); P(cx + 6, cy - 9, 'murK', 2); P(cx + 6, cy - 11, 'murH', 5); P(cx + 7, cy - 12, 'murH', 4);
    for (const a of [-8, -6, 11, 12]) P(px + a, py + 2, ['fleurR2', 'fleurJ2'][Math.abs(a) % 2], 4);
    boite(px - 5, py - 12, px + 11, py + 3, 'porte');
  }
  for (const [x, y] of [[124, 86], [172, 58], [258, 56], [300, 90], [352, 80], [390, 82], [96, 50], [430, 40], [222, 22], [160, 18], [350, 30], [124, 120], [244, 124]]) arbre(x, y, 2.8, 'foretK2');
  yield;
  // ---- 4. les rues pavées, les chemins ----
  const MX = MX0;
  chemin([[-4, 178], [60, 178]], 2, 'terreK', 3);
  courbe([[Math.round(MX(3640)) + 50, 112], [372, 108], [396, 104], [414, 106], [428, 106]], 1.1, 'terreK', 3);   // le chemin du Moulin (v6 : de la place au moulin, par le haut, loin de la cabane)
  courbe([[401, 148], [410, 142], [419, 137], [426, 124], [430, 109]], 0.8, 'terreK', 3);   // (v6) le sentier de la cabane : le long de l'étang, jusqu'au moulin
  chemin([[200, 222], [200, 248], [204, 268]], 1.6, 'terreK', 3);
  chemin([[60, 178], [MX(3900), 178]], 2.4, 'paveK', 3); chemin([[MX(548), 152], [MX(2780), 152]], 1.6, 'paveK', 3);
  chemin([[MX(1615), 152], [MX(1615), 178]], 1.6, 'paveK', 3); chemin([[MX(594), 152], [MX(594), 178]], 1.2, 'paveK', 3); chemin([[MX(2152), 152], [MX(2152), 178]], 1, 'paveK', 2);
  chemin([[MX(3640), 134], [MX(3640), 178]], 1.6, 'paveK', 3); chemin([[MX(2700), 152], [MX(2700), 128], [254, 112]], 0.8, 'terreK', 3);
  for (let y = 178; y < 190; y++) for (let x = Math.round(MX(1420)); x < Math.round(MX(2010)); x++) t.poser(x, y, 'paveK', 3 + ((x + y) % 4 === 0 ? 1 : 0));
  t.forme('murK', ellipsoide(MX(1860), 184, 2.6, 1.8), { decalage: 0.6 }); P(MX(1860), 183, 'eauK', 5);
  // le talus : un pré en pente entre la rue et le bas-quartier ; le mur de soutènement et son ombre ; l'escalier des Marches
  for (let y = 182; y < 199; y++) for (let x = 66; x < 342; x++) { if (y < 190 && x >= MX(1420) && x < MX(2010)) continue; t.poser(x, y, 'herbeK2', y > 195 ? 2 : 3 + (hachage(x, y, 9113) > 0.9 ? 1 : 0)); }
  for (let x = 66; x < 342; x++) { P(x, 197, 'murK', 4); P(x, 198, 'murK', 2); P(x, 199, 'murK', 1); P(x, 200, 'boisS', 0); }
  for (let y = 190; y < 202; y++) for (let x = Math.round(MX(1510)) - 1; x <= Math.round(MX(1510)) + 1; x++) P(x, y, 'paveK', y % 2 ? 5 : 2);
  yield;
  // ---- 5. la grand-place : un cercle de pierres, la terre battue, le dallage en éventail autour de la fontaine, chaque étal à sa place ----
  const PCX = Math.round(MX(3640)), PCY = 104, RX = 53, RY = 33;
  const dEll = (x, y) => Math.hypot((x + 0.5 - PCX) / RX, (y + 0.5 - PCY) / RY);
  for (let y = PCY - RY - 3; y < PCY + RY + 3; y++) for (let x = PCX - RX - 3; x < PCX + RX + 3; x++) { const d = dEll(x, y) + (fbm(x * 0.15, y * 0.15, 9110) - 0.5) * 0.04;
    if (d > 1.04) continue;
    if (d > 0.945) { P(x, y, 'murK', d > 1.0 ? 1 : (Math.floor((x + y) / 3) % 2 ? 4 : 3)); continue; }   // le cercle de pierres qui borde la place
    const dx = x + 0.5 - PCX, dy = (y + 0.5 - PCY) * 1.55, r = Math.hypot(dx, dy);
    if (r < 25) { const ring = Math.floor(r / 3.6), ang = Math.atan2(dy, dx) + Math.PI, seg = Math.floor(ang * (ring * 2 + 8) / 6.283); P(x, y, 'paveK', (r % 3.6 < 0.9) ? 2 : ((ring + seg) % 2 ? 4 : 3)); }   // l'éventail autour de la fontaine
    else if (r < 27.5) P(x, y, 'murK', Math.floor(Math.atan2(dy, dx) * 12) % 2 ? 4 : 3);                                  // sa bordure
    else { let k = 3 + (fbm(x * 0.2, y * 0.2, 9111) > 0.6 ? 1 : 0); if (d > 0.88) k -= 1; P(x, y, 'terreK', k); }          // la terre battue
  }
  // des chemins d'usure, du centre vers chaque entrée (la terre plus foncée)
  for (const [ax, ay] of [[0, 33], [-50, 0], [50, 8], [0, -33]]) for (let u = 0.28; u <= 1; u += 0.02) { const x = PCX + ax * u, y = PCY + ay * u * 0.95; if (dEll(x, y) < 0.94 && Math.hypot((x - PCX), (y - PCY) * 1.55) > 28) { P(x, y, 'terreK', 2); P(x + 1, y, 'terreK', 3); } }
  // la fontaine aux vœux : une vasque ronde de pierre, l'eau, la colonne, le jet
  t.forme('murK', ellipsoide(PCX, PCY + 1, 7.5, 4.6), { decalage: 0.7 }); t.forme('eauK', ellipsoide(PCX, PCY, 5.6, 3.1), { decalage: 0.5, bord: false, ombre: false });
  for (let a = 0; a < 5; a++) P(PCX - 3 + a, PCY + 1, 'eauK', a % 2 ? 4 : 5);
  for (let k = 0; k < 6; k++) { P(PCX, PCY - 1 - k, 'murK', k < 5 ? 4 : 5); P(PCX + 1, PCY - 1 - k, 'murK', 2); } P(PCX - 1, PCY - 7, 'murK', 5); P(PCX + 2, PCY - 7, 'murK', 3); P(PCX, PCY - 8, 'eauK', 5); P(PCX - 1, PCY - 9, 'eauK', 4); P(PCX + 1, PCY - 9, 'eauK', 4); P(PCX, PCY - 10, 'eauK', 5);
  // les étals, chacun reconnaissable (la couleur de son auvent, ce qu'il vend), à sa place sur la place (d'après la vraie place du jeu)
  // (v6) chaque étal tient debout : deux poteaux plantés en terre pour l'auvent, un comptoir posé sur deux tréteaux dont
  // les pieds touchent le sol, l'ombre sous le plateau et l'ombre portée sur la terre battue
  const etalMini = (cx, by, kind) => {
    const W = 11, x0 = cx - 5, K = { forge: ['toitA', 'fer'], apoth: ['voletV', 'murH'], encheres: ['voletR', 'murH'], gedeon: ['voletB', 'murH'], tailleuse: ['fleurP2', 'murH'], bazar: ['violet', 'murH'], brocante: ['voletJ', 'terreCuite'], garderobe: ['voletB', 'voletR'] }[kind];
    const sh = (x, y, d) => { const m = t.mat(x, y); if (m) t.poser(x, y, m, Math.max(0, t.teinte(x, y) - d)); };   // assombrir le sol, quel qu'il soit
    for (let a = 1; a <= W; a++) sh(x0 + a, by + 1, 1);   // l'ombre portée
    for (let y = by - 9; y <= by; y++) { P(x0, y, 'bois', 2); P(x0 + W - 1, y, 'bois', 1); }   // les poteaux, jusqu'au sol
    for (let y = by - 8; y < by - 4; y++) for (let a = 1; a < W - 1; a++) P(x0 + a, y, 'boisS', 1);   // le fond de l'étal, dans l'ombre
    for (let a = 1; a < W - 1; a++) { P(x0 + a, by - 2, 'boisS', 0); sh(x0 + a, by - 1, 2); sh(x0 + a, by, 1); }   // l'ombre sous le plateau, sur le sol
    for (let a = 0; a < W; a++) { P(x0 + a, by - 4, 'bois', 5); P(x0 + a, by - 3, 'bois', 3); }   // le plateau, la planche de devant
    for (const tx of [x0 + 2, x0 + W - 3]) { P(tx, by - 2, 'bois', 4); P(tx, by - 1, 'bois', 4); P(tx - 1, by, 'bois', 4); P(tx + 1, by, 'bois', 3); }   // les tréteaux, pieds écartés
    for (let a = -1; a <= W; a++) { const r = Math.floor((a + 1) / 2) % 2; P(x0 + a, by - 12, K[0], 1); P(x0 + a, by - 11, r ? K[0] : K[1], 5); P(x0 + a, by - 10, r ? K[0] : K[1], 4); P(x0 + a, by - 9, r ? K[0] : K[1], 3); if (a % 2 === 0 && a >= 0 && a < W) P(x0 + a, by - 8, r ? K[0] : K[1], 2); }   // l'auvent rayé, son bord festonné
    const bit = (a, b, m, k = 4) => P(x0 + a, by - b - 2, m, k);
    if (kind === 'apoth') { for (const [a, m] of [[2, 'voletV'], [4, 'voletB'], [6, 'voletR'], [8, 'voletV']]) { bit(a, 3, m, 5); bit(a, 4, m, 4); bit(a, 5, 'murH', 5); } }
    else if (kind === 'encheres') { bit(5, 3, 'boisS', 2); bit(5, 4, 'boisS', 3); bit(4, 5, 'bois', 5); bit(5, 5, 'bois', 4); bit(6, 5, 'bois', 3); for (const a of [2, 8]) { bit(a, 3, 'or', 5); bit(a, 4, 'or', 3); } for (let k = 11; k < 15; k++) bit(5, k, 'boisS', 2); bit(6, 14, 'voletR', 5); bit(7, 14, 'voletR', 4); bit(6, 13, 'voletR', 3); }
    else if (kind === 'forge') { for (const a of [3, 4, 5, 6]) { bit(a, 3, 'fer', 4); } bit(4, 4, 'fer', 5); bit(5, 4, 'fer', 4); bit(8, 3, 'braise', 5); bit(9, 3, 'braise', 4); bit(8, 4, 'braise', 3); for (let k = 11; k < 14; k++) { bit(8, k, 'brique', 3); bit(9, k, 'brique', 2); } bit(8, 14, 'murH', 5); bit(9, 15, 'murH', 4); bit(8, 16, 'murH', 3); }
    else if (kind === 'gedeon') { for (const a of [2, 4, 6]) { bit(a, 3, 'murH', 5); bit(a, 4, 'murH', 4); bit(a + 1, 3, 'cire', 3); } bit(8, 3, 'encre', 4); bit(8, 4, 'encre', 5); bit(9, 5, 'murH', 5); }
    else if (kind === 'tailleuse') { for (const [a, m] of [[1, 'violet'], [3, 'voletJ'], [5, 'voletB'], [7, 'voletR'], [9, 'fleurP2']]) for (let b = 3; b < 8; b++) bit(a, b, m, b > 6 ? 5 : 3 + (b % 2)); }
    else if (kind === 'bazar') { for (const [a, b, m] of [[2, 3, 'voletR'], [4, 3, 'voletJ'], [6, 3, 'voletV'], [8, 3, 'voletB'], [3, 4, 'voletV'], [7, 4, 'voletR']]) { bit(a, b, m, 5); bit(a + 1, b, m, 3); bit(a, b + 1, m, 4); } for (let k = 3; k < 8; k++) bit(10, k, 'chanvre', 3); }
    else if (kind === 'brocante') { for (const [a, m] of [[2, 'terreCuite'], [5, 'fer'], [8, 'or']]) { bit(a, 3, m, 4); bit(a + 1, 3, m, 2); bit(a, 4, m, 5); bit(a + 1, 4, m, 3); bit(a, 5, m, 4); } for (let k = 3; k < 7; k++) bit(10, k, 'boisS', 3); bit(9, 7, 'or', 5); bit(10, 7, 'or', 4); }
    else if (kind === 'garderobe') { for (let a = 1; a < 10; a++) bit(a, 7, 'boisS', 3); for (const [a, m, h] of [[2, 'voletB', 4], [4, 'voletR', 5], [6, 'voletJ', 4], [8, 'violet', 5]]) for (let b = 3; b < 3 + h; b++) { bit(a, b, m, 4); bit(a + 1, b, m, 2); } }
  };
  const ZP = (x, y) => [PCX + (x / 1800 - 0.5) * 92, PCY + (y / 1040 - 0.5) * 56];
  for (const [kind, lx, ly] of [['forge', 330, 340], ['apoth', 560, 310], ['encheres', 900, 290], ['gedeon', 1240, 310], ['tailleuse', 1470, 340], ['bazar', 170, 610], ['brocante', 170, 870], ['garderobe', 1630, 610]]) { const [x, y] = ZP(lx, ly); etalMini(Math.round(x), Math.round(y) + 3, kind); }
  // (v6) la colonne et le jet de la fontaine, devant l'étal des enchères (la fontaine est plus au sud)
  for (let k = 0; k < 6; k++) { P(PCX, PCY - 1 - k, 'murK', k < 5 ? 4 : 5); P(PCX + 1, PCY - 1 - k, 'murK', 2); } P(PCX - 1, PCY - 7, 'murK', 5); P(PCX + 2, PCY - 7, 'murK', 3); P(PCX, PCY - 8, 'eauK', 5); P(PCX - 1, PCY - 9, 'eauK', 4); P(PCX + 1, PCY - 9, 'eauK', 4); P(PCX, PCY - 10, 'eauK', 5);
  { // le crieur (une estrade et sa cloche), le tableau d'affichage, le mendiant et son chien, le coin des jeux, la carte du monde
    let [x, y] = ZP(660, 560); x = Math.round(x); y = Math.round(y) + 2;
    for (let a = -3; a <= 3; a++) { P(x + a, y, 'bois', 4); P(x + a, y + 1, 'boisS', 1); } P(x, y - 1, 'murH', 5); P(x, y - 2, 'murH', 4); P(x, y - 3, 'terreCuite', 4); P(x + 2, y - 2, 'or', 5); P(x + 2, y - 3, 'or', 4); P(x - 2, y - 1, 'boisS', 2);
    [x, y] = ZP(1140, 560); x = Math.round(x); y = Math.round(y) + 2; for (let k = 0; k < 7; k++) { P(x - 4, y - k, 'bois', 2); P(x + 4, y - k, 'bois', 2); } for (let a = -4; a <= 4; a++) for (let b = 1; b < 6; b++) P(x + a, y - b, a === -4 || a === 4 || b === 1 || b === 5 ? 'bois' : 'cire', a === -4 || b === 5 ? 4 : 3); for (const [a, b] of [[-2, 2], [0, 3], [2, 2], [1, 4]]) P(x + a, y - b, 'murH', 5);
    [x, y] = ZP(770, 1000); x = Math.round(x); y = Math.round(y); for (let a = -3; a <= 3; a++) for (let b = 0; b < 2; b++) P(x + a, y + b, 'voletR', 3 - b); P(x - 1, y - 1, 'terreCuite', 4); P(x - 1, y - 2, 'peau', 4); P(x - 1, y - 3, 'boisS', 3); P(x + 4, y, 'murH', 4); P(x + 5, y, 'murH', 3); P(x + 5, y - 1, 'bois', 4); P(x + 6, y - 1, 'bois', 3);
    [x, y] = ZP(560, 920); x = Math.round(x); y = Math.round(y); for (let b = 0; b < 8; b++) for (let a = -b / 2; a <= b / 2; a++) P(x + a, y - 8 + b, Math.floor(a) % 2 ? 'voletR' : 'murH', 4 - (a > 1 ? 1 : 0)); P(x, y - 9, 'boisS', 2); P(x + 1, y - 10, 'or', 5); P(x + 2, y - 10, 'or', 4); P(x, y, 'boisS', 0);
    [x, y] = ZP(1060, 1000); x = Math.round(x); y = Math.round(y); for (let k = 0; k < 8; k++) P(x, y - k, 'bois', 2); for (const [a, b, m] of [[-1, 6, 'cire'], [0, 6, 'cire'], [1, 6, 'cire'], [-1, 5, 'cire'], [0, 5, 'cire'], [1, 5, 'cire']]) P(x + a + 2, y - b, m, 5); P(x + 2, y - 5, 'voletR', 4); P(x - 2, y - 7, 'murH', 5); P(x - 3, y - 7, 'murH', 4);
  }
  // des arbres et des buissons, là où la vraie place en a, sur l'herbe (jamais sur la terre des chemins)
  for (const [dx, dy, v] of [[-57, -22, 0], [-58, 12, 1], [58, -20, 1], [57, 20, 0], [-30, -38, 1], [34, -38, 0], [-34, 36, 0], [38, 36, 1]]) arbre(PCX + dx, PCY + dy, 3.4, v ? 'foretK2' : 'foretK');
  for (const [lx, ly] of [[250, 760], [1520, 760], [700, 760], [1100, 760], [460, 470], [1340, 470]]) { const [x, y] = ZP(lx, ly); t.forme('foretK2', ellipsoide(Math.round(x), Math.round(y), 2.4, 1.6), { decalage: 0.5, ombre: false }); P(x, y - 1, 'fleurR2', 4); P(x + 1, y, 'fleurJ2', 4); }
  // l'entrée sud de la place : deux piliers de pierre et leurs lanternes (la route vers l'arche des Mastres)
  for (const dx of [-5, 4]) { for (let b = 0; b < 6; b++) for (let a = 0; a < 2; a++) P(PCX + dx + a, PCY + RY - 3 + b, 'murK', b === 0 ? 5 : a === 0 ? 4 : 2); P(PCX + dx, PCY + RY - 5, 'or', 5); P(PCX + dx + 1, PCY + RY - 5, 'or', 3); P(PCX + dx, PCY + RY - 6, 'fer', 3); }
  boite(PCX - RX, PCY - RY - 12, PCX + RX, PCY + RY + 10, 'place');
  yield;
  // ---- 6. les maisons en miniature, vues d'en haut : le toit à deux pans (le pan nord dans l'ombre, le faîtage clair,
  //      le pan sud au soleil), ou le pignon tourné vers la rue ; dessous, un bout de façade avec sa porte ; les cheminées ----
  const toitMini = (x, y, l, mat, { ht = 6, hm = 3, pignon = false, chem = false, mur = 'murH', fumee = false, porte = true } = {}) => {
    x = Math.round(x); l = Math.max(4, Math.round(l)); y = Math.round(y);
    for (let b = 0; b < hm; b++) for (let a = 0; a < l; a++) P(x + a, y - b, mur, b === hm - 1 ? 2 : a === 0 ? 4 : 3);
    if (porte) { P(x + Math.floor(l / 2), y, 'boisS', 0); if (hm > 2) P(x + Math.floor(l / 2), y - 1, 'boisS', 1); }
    for (let a = 1; a < l - 1; a += 3) if (Math.abs(a - Math.floor(l / 2)) > 1) P(x + a, y - 1, 'eauK', 1);
    const y0 = y - hm - ht + 1;
    for (let b = 0; b < ht; b++) { const v = b / (ht - 1), ins = pignon ? 0 : (b === 0 ? 1 : 0);
      for (let a = ins; a < l - ins; a++) { let k;
        if (pignon) { const u = (a + 0.5) / l; k = Math.abs(u - 0.5) < 0.09 ? 5 : u < 0.5 ? 4 : 2; if (b === ht - 1) k = 1; if (b % 2 === 1 && k !== 5) k -= 1; }
        else { k = v < 0.3 ? 2 : v < 0.45 ? 5 : 4 - (v > 0.8 ? 1 : 0); if (b === ht - 1) k = 1; if (mat !== 'toitC' && b % 2 === 1 && k > 1 && k < 5) k -= 1; if (mat !== 'toitC' && (a + b) % 4 === 0 && k > 2 && k < 5) k -= 1; }
        if (a === l - 1 && k > 1) k -= 1;
        P(x + a, y0 + b, mat, k); } }
    if (chem) { const cx = x + l - 3; P(cx, y0 - 1, 'brique', 4); P(cx + 1, y0 - 1, 'brique', 2); P(cx, y0, 'brique', 3); P(cx + 1, y0, 'brique', 2); if (fumee) { P(cx, y0 - 3, 'murH', 5); P(cx + 1, y0 - 4, 'murH', 4); } }
    return [x, y0, x + l, y];
  };
  const LOT = (X, W) => [MX(X - W / 2) + 0.5, W * 0.065 - 1];
  // la rue Soucolline, côté nord, d'ouest en est, chacun reconnaissable
  { let [x, l] = LOT(420, 240); toitMini(x, 176, l, 'toitR', { chem: true });                              // les Pommeroy
    [x, l] = LOT(757, 218); toitMini(x, 176, l, 'toitR', { pignon: true });                                  // la maison aux volets bleus
    [x, l] = LOT(1016, 288); toitMini(x, 176, l, 'toitA', { mur: 'murK', chem: true, fumee: true }); P(x + Math.floor(l / 2), 175, 'braise', 4);   // la forge : ardoise, pierre, la braise à la porte
    [x, l] = LOT(1324, 320); toitMini(x, 176, l, 'toitC', { ht: 7, chem: true, fumee: true });                // ton comptoir, au chaume
    for (let a = 0; a < Math.round(l); a++) if (a === 0 || a === Math.round(l) - 1) P(x + a, 176 - 9, 'toitC', 2);
    [x, l] = LOT(1876, 320); toitMini(x, 176, l, 'voletB', { mur: 'murC' }); P(x + Math.round(l / 2) + 3, 174, 'or', 5);   // la maison du paon : murs blancs, toit bleu, l'enseigne d'or
    [x, l] = LOT(2152, 224); toitMini(x, 176, l, 'toitA', { ht: 7, hm: 4, porte: false }); P(x + Math.floor(l / 2), 176, 'boisS', 0); P(x + Math.floor(l / 2), 175, 'boisS', 0); P(x + Math.floor(l / 2), 174, 'boisS', 1);   // la maison haute et son passage
    [x, l] = LOT(2615, 198); toitMini(x, 176, l, 'toitR', { pignon: true }); P(x, 175, 'voletR', 5); P(x, 174, 'murH', 5); P(x, 173, 'voletR', 5);   // le barbier et son poteau
    [x, l] = LOT(2819, 198); toitMini(x, 176, l, 'toitC', { chem: true });
    [x, l] = LOT(3049, 250); toitMini(x, 176, l, 'voletB', { mur: 'murH' }); P(x + 3, 170, 'eauK', 5); P(x + l - 4, 170, 'eauK', 5);   // les Mages : les runes qui luisent
    [x, l] = LOT(3340, 320); x = Math.round(x); l = Math.round(l);                                       // la banque : un fronton, des colonnes, un toit plat d'ardoise
    for (let a = 0; a < l; a++) { for (let b = 0; b < 5; b++) P(x + a, 176 - b, 'murC', b === 4 ? 5 : (a % 3 === 1 ? 2 : 4)); for (let b = 5; b < 8; b++) P(x + a, 176 - b, 'toitA', b === 5 ? 1 : 3); }
    for (let a = 0; a < l; a++) { const h = Math.round(3 - Math.abs(a - l / 2) / (l / 2) * 3); for (let b = 0; b < h; b++) P(x + a, 168 - b, 'murC', 4); } P(x + Math.floor(l / 2), 166, 'or', 5); P(x + Math.floor(l / 2), 176, 'boisS', 0); P(x + Math.floor(l / 2), 175, 'boisS', 0);
  }
  for (let b = 0; b < 9; b++) for (let a = -b * 0.55; a <= b * 0.55; a++) P(MX(2370) + a, 168 + b, 'violet', 3 + (a < 0 ? 1 : 0) - (b % 3 === 2 ? 1 : 0));   // la tente d'Ysmée, et son fanion d'or
  P(MX(2370), 166, 'boisS', 2); P(MX(2370), 167, 'boisS', 2); P(MX(2370) + 1, 166, 'or', 5); P(MX(2370) + 2, 166, 'or', 4); P(MX(2370), 176, 'boisS', 0); P(MX(2370), 175, 'boisS', 0);
  { const ax = Math.round(MX(3520)) - 2;   // l'arche des Mastres : deux tours à créneaux, un chemin de ronde, la baie en plein cintre, une bannière rouge
    for (const dx of [0, 13]) { for (let b = 0; b < 12; b++) for (let a = 0; a < 5; a++) P(ax + dx + a, 177 - b, 'murK', b === 11 ? 5 : a === 0 ? 4 : a === 4 ? 2 : 3 - (b % 4 === 3 ? 1 : 0)); for (const a of [0, 2, 4]) P(ax + dx + a, 165 - 1, 'murK', 5); P(ax + dx + 2, 172, 'fer', 1); P(ax + dx + 2, 171, 'fer', 1); }
    for (let a = 5; a < 13; a++) for (let b = 0; b < 8; b++) P(ax + a, 177 - b, b === 7 ? 'toitA' : 'murK', b === 7 ? 4 : 3 - (a > 10 ? 1 : 0));
    for (let b = 0; b < 6; b++) for (let a = 6; a < 12; a++) { const dx = a - 8.5, dy = b - 3; if (b > 2 || Math.hypot(dx, dy) < 3) P(ax + a, 177 - b, 'boisS', 0); }
    for (let k = 0; k < 4; k++) P(ax + 9, 169 - k, 'voletR', 4); P(ax + 8, 169, 'voletR', 3); P(ax + 10, 169, 'voletR', 3); }
  // la rue Haute, côté nord ; le carrefour du Puits ; le jardin du Pommier
  { const R = [[660, 192, 'toitA', {}], [866, 205, 'toitR', { pignon: true }], [1086, 218, 'toitR', { ht: 7, hm: 4, chem: true }], [1255, 115, 'toitR', {}], [1418, 208, 'toitA', { chem: true, fumee: true }], [1812, 192, 'toitC', {}], [2230, 208, 'toitA', { pignon: true }], [2440, 192, 'toitR', { chem: true }]];
    for (const [X, W, m, o] of R) { const [x, l] = LOT(X, W); toitMini(x, 150, l, m, o); } }
  for (let a = -6; a <= 6; a++) for (let b = 0; b < 4; b++) P(MX(1615) + a, 151 + b, 'paveK', 4 - (b === 3 ? 1 : 0) + ((a + b) % 3 === 0 ? -1 : 0));   // le carrefour
  P(MX(1745), 152, 'murK', 4); P(MX(1745) + 1, 152, 'murK', 2); P(MX(1745), 151, 'toitR', 4); P(MX(1745) + 1, 151, 'toitR', 3); P(MX(1745), 153, 'eauK', 2);   // le puits
  for (let a = 0; a < 12; a++) { P(MX(1930) + a, 150, 'murK', 4); P(MX(1930) + a, 151, 'murK', 2); }   // le muret du jardin
  arbre(MX(2030), 145, 3.4, 'foretK2'); for (const [a, b] of [[-1, -1], [1, 0], [2, -2], [-2, 1]]) P(MX(2030) + a, 145 + b, 'pomme', 5);
  for (let n = 0; n < 24; n++) { const x = 80 + hachage(n, 1, 9114) * 240, y = 157 + hachage(n, 2, 9114) * 6; if (Math.abs(x - MX(1615)) < 4 || Math.abs(x - MX(594)) < 3 || Math.abs(x - MX(2152)) < 3) continue; t.forme(n % 3 ? 'herbeK2' : 'foretK', ellipsoide(x, y, 2.2, 1.6), { decalage: 0.3, ombre: false }); }
  boite(76, 139, 334, 182, 'ville');
  // (v6) le bas-quartier, dessiné comme le reste de la ville : une rangée de petites maisons adossées au mur de soutènement,
  // leurs façades et leurs portes sur la ruelle de vieux pavés ; la descente des Marches ; l'impasse du Corbeau entre deux
  // maisons, son mur de briques au fond ; puis le quai, les barques amarrées
  for (let y = 201; y < 222; y++) for (let x = 100; x < 341; x++) t.poser(x, y, 'herbeK2', 2);
  for (let y = 212; y < 222; y++) for (let x = 100; x < 341; x++) P(x, y, 'paveK', (y === 212 ? 1 : y === 221 ? 2 : 3) + (((x >> 1) + y) % 5 === 0 ? -1 : 0));   // la ruelle de vieux pavés
  { const xD = Math.round(MX(1510)), xI = Math.round(MX(2000)), trous = [[xD - 2, xD + 3], [xI - 1, xI + 5]];
    const mats = ['toitR', 'toitA', 'toitR', 'toitC', 'toitA', 'toitR', 'toitC'], murs = ['murH', 'murK', 'murH', 'murC'];
    let x = 101, n = 0;
    while (x < 336) { const tr = trous.find(([a, b]) => x + 9 > a && x < b); if (tr) { x = tr[1] + 1; continue; }
      let l = 9 + Math.floor(hachage(n, 1, 9147) * 5); const nxt = trous.find(([a]) => a > x); if (nxt && x + l > nxt[0] - 1) l = nxt[0] - 1 - x; if (x + l > 340) l = 340 - x; if (l < 6) { x += l + 1; continue; }
      toitMini(x, 211, l, mats[n % 7], { ht: 6, hm: 3, pignon: n % 5 === 2, mur: murs[n % 4], chem: n % 3 !== 1, fumee: n % 4 === 0 });
      x += l + (n % 4 === 3 ? 1 : 0); n++; }
    for (let y = 200; y < 212; y++) for (let x2 = xD - 1; x2 <= xD + 1; x2++) P(x2, y, 'paveK', y % 2 ? 5 : 2);   // la descente des Marches
    for (let y = 203; y < 212; y++) for (let x2 = xI; x2 < xI + 4; x2++) P(x2, y, 'boisS', y < 205 ? 1 : 0);   // l'impasse du Corbeau, et son mur de briques au fond
    for (let x2 = xI; x2 < xI + 4; x2++) { P(x2, 201, 'brique', 4); P(x2, 202, 'brique', 2); }
    for (const rx of [150, 230, 300]) { P(rx, 213, 'fer', 1); P(rx, 214, 'fer', 1); P(rx, 212, 'or', 5); }   // des réverbères sur la ruelle
  }
  for (let x = 100; x < 341; x++) { P(x, 222, 'murC', 4); P(x, 223, 'murC', 2); P(x, 224, 'murK', 1); }   // le quai
  for (const bx of [140, 214, 296]) { for (let a = 0; a < 8; a++) { const w = a === 0 || a === 7 ? 0 : 1; for (let b = -w; b <= w; b++) P(bx + a, 228 + b, 'bois', b === -1 ? 4 : 2); } P(bx + 3, 228, 'boisS', 1); P(bx + 4, 228, 'boisS', 1); P(bx + 3, 225, 'bois', 2); P(bx + 3, 226, 'bois', 2); }   // les barques et leur amarre
  boite(100, 196, 342, 230, 'basq');
  // le lavoir, au bout du quai : un toit de tuiles sur poteaux, le bassin, le linge
  { const lx = 322; for (let a = 0; a < 16; a++) { for (let b = 0; b < 3; b++) P(lx + a, 217 + b, 'toitR', b === 0 ? 4 : b === 2 ? 1 : 3); for (const yy of [220, 221]) P(lx + a, yy, a === 0 || a === 15 || a === 7 ? 'bois' : 'eauK', 3); P(lx + a, 222, 'murC', 4); } for (const a of [3, 5, 10, 12]) P(lx + a, 220, 'murH', 5); boite(lx - 1, 216, lx + 17, 223, 'lavoir'); }
  yield;
  // ---- 7. le Rempart : la muraille et ses tours, la Grand-Porte, la chapelle, l'hospice, le terrain de la Confrérie ----
  const mur = [[68, 22], [64, 64], [62, 104], [62, 146], [63, 200], [68, 232]];
  for (let i = 0; i < mur.length - 1; i++) chemin([mur[i], mur[i + 1]], 1.3, 'murK', 3);
  for (const [x, y] of mur) { t.forme('murK', ellipsoide(x, y, 3.6, 3.2), { decalage: 0.5 }); for (let a = -3; a <= 3; a += 2) P(x + a, y - 3, 'murK', 5); boite(x - 4, y - 4, x + 4, y + 4, 'tour'); }
  { // la Grand-Porte : deux tours carrées, la voûte, la herse, les bannières
    const gx = 62, gy = 178;
    for (const dy of [-6, 6]) for (let b = -3; b <= 3; b++) for (let a = -4; a <= 4; a++) P(gx + a, gy + dy + b, 'murK', b === -3 ? 5 : a < 0 ? 4 : 2);
    for (const dy of [-6, 6]) { for (let a = -4; a <= 4; a += 2) P(gx + a, gy + dy - 4, 'murK', 5); P(gx + 1, gy + dy - 1, 'voletR', 4); P(gx + 1, gy + dy, 'voletR', 3); }
    for (let b = -2; b <= 2; b++) for (let a = -3; a <= 3; a++) P(gx + a, gy + b, Math.abs(b) < 2 && Math.abs(a) < 3 ? 'boisS' : 'murK', 1);
    for (let a = -3; a <= 3; a++) { P(gx + a, gy - 2, 'boisS', 0); for (let b = -1; b <= 1; b++) P(gx + a, gy + b, 'paveK', 3); P(gx + a, gy + 2, 'murK', 1); }
    boite(gx - 5, gy - 10, gx + 5, gy + 10, 'porte');
  }
  { // la chapelle : la nef, le clocher, la flèche et sa croix d'or
    const cx = 80, cy = 120;
    for (let a = 0; a < 12; a++) { for (let b = 0; b < 4; b++) P(cx + a, cy - b, 'murH', b === 3 ? 2 : 3 + (a === 0 ? 1 : 0)); for (let b = 4; b < 8; b++) P(cx + a, cy - b, 'toitA', b === 7 ? 4 : 3); }
    for (let b = 0; b < 10; b++) for (let a = 0; a < 4; a++) P(cx + a, cy - b, 'murH', a === 0 ? 4 : 3 - (a === 3 ? 1 : 0));
    for (let b = 10; b < 15; b++) for (let a = 0; a < 4; a++) if (Math.abs(a - 1.5) < (15 - b) * 0.4) P(cx + a, cy - b, 'toitA', a < 2 ? 4 : 2);
    P(cx + 1, cy - 16, 'or', 5); P(cx + 2, cy - 16, 'or', 5); P(cx + 1, cy - 17, 'or', 5); P(cx + 1, cy - 15, 'or', 4); P(cx + 1, cy - 6, 'eauK', 5); P(cx + 7, cy - 2, 'eauK', 4); P(cx + 10, cy - 2, 'eauK', 4);
    boite(cx - 1, cy - 17, cx + 12, cy + 1, 'chapelle');
  }
  { // l'hospice : une longue maison, une croix rouge à la porte, son jardin
    const hx = 76, hy = 214;
    for (let a = 0; a < 20; a++) { for (let b = 0; b < 4; b++) P(hx + a, hy - b, 'murH', b === 3 ? 2 : 3 + (a === 0 ? 1 : 0)); for (let b = 4; b < 9; b++) P(hx + a, hy - b, 'toitR', b === 4 ? 1 : b === 8 ? 4 : 3); }
    for (const a of [3, 7, 13, 17]) P(hx + a, hy - 2, 'eauK', 2); P(hx + 10, hy, 'boisS', 0); P(hx + 10, hy - 1, 'boisS', 0);
    for (const [a, b] of [[10, -4], [9, -3], [11, -3], [10, -3], [10, -2]]) P(hx + a - 4, hy + b - 2, 'voletR', 4);
    boite(hx, hy - 9, hx + 20, hy + 1, 'hospice');
  }
  for (let a = 0; a < 18; a++) for (let b = 0; b < 10; b++) P(94 + a, 128 + b, 'terreK', 3 + ((a + b) % 7 === 0 ? 1 : 0));   // le terrain de la Confrérie : la terre battue, deux tentes, la bannière
  for (const [tx, ty] of [[99, 136], [107, 134]]) for (let b = 0; b < 5; b++) for (let a = -b; a <= b; a++) P(tx + a, ty - 4 + b, 'murH', a < 0 ? 5 : 3);
  for (let b = 0; b < 6; b++) P(110, 129 + b, 'bois', 2); P(111, 129, 'voletB', 4); P(112, 129, 'voletB', 4); P(111, 130, 'voletB', 3);
  for (let a = -1; a <= 18; a++) { P(94 + a, 127, 'bois', 3); P(94 + a, 138, 'bois', 2); }
  yield;
  // ---- 8. le Vieux Moulin : la maison du meunier sur la rive est, la grande roue dans le bief ; la passerelle ----
  { const mx = 446, my = 96;
    for (let a = 0; a < 16; a++) { for (let b = 0; b < 6; b++) P(mx + a, my - b, 'murK', b === 5 ? 2 : 3 + (a === 0 ? 1 : 0) - (a === 15 ? 1 : 0)); for (let b = 6; b < 12; b++) P(mx + a, my - b, 'toitR', b === 6 ? 1 : b === 11 ? 4 : 3 - (a > 12 ? 1 : 0)); }
    P(mx + 8, my, 'boisS', 0); P(mx + 8, my - 1, 'boisS', 0); P(mx + 8, my - 2, 'boisS', 1); P(mx + 4, my - 3, 'eauK', 5); P(mx + 12, my - 3, 'eauK', 5);
    // la roue : un cercle de bois, ses rayons, ses aubes ; la moitié basse dans l'eau du bief
    const wx = 440, wy = 94, r = 6;
    for (let b = -r - 1; b <= r + 1; b++) for (let a = -r - 1; a <= r + 1; a++) { const d = Math.hypot(a, b); if (d > r + 0.6) continue; const ang = Math.atan2(b, a), rayon = Math.abs(((ang * 4 / Math.PI) % 1 + 1) % 1 - 0.5) > 0.38;
      if (d > r - 1.2) P(wx + a, wy + b, 'bois', a + b < 0 ? 4 : 2); else if (d < 1.2) P(wx + a, wy + b, 'boisS', 1); else if (rayon) P(wx + a, wy + b, 'bois', 3); }
    for (let k = 0; k < 8; k++) { const ang = k / 8 * Math.PI * 2; P(wx + Math.cos(ang) * (r + 1.2), wy + Math.sin(ang) * (r + 1.2), 'boisS', 2); }
    for (let a = -r; a <= r; a++) if (Math.abs(a) > 1) P(wx + a, wy + r - 0.5, 'eauK', 5);   // l'écume au pied de la roue
    for (let x = 428; x < 446; x++) for (let y = 105; y < 108; y++) P(x, y, 'bois', y === 105 ? 4 : y === 107 ? 1 : 3);   // la passerelle
    for (const x of [430, 437, 444]) P(x, 108, 'boisS', 1);
    boite(433, 83, 462, 108, 'moulin');
  }
  yield;
  // ---- 9. la cabane de Barnabé, au bord de l'étang : sur pilotis, planches, toit de chaume, cheminée qui fume, porche, échelle, ponton, barque, filets, poissons qui sèchent ----
  { const cx = 380, cy = 152;   // (v6) un peu plus loin de la place, au bord de l'étang, tournée vers l'eau et vers le moulin
    for (let a = -2; a < 17; a++) { P(cx + a, cy + 2, 'terreK', 2); P(cx + a, cy + 3, 'terreK', 1); }   // l'ombre sur la rive
    for (const a of [1, 7, 13]) for (let b = 1; b < 5; b++) P(cx + a, cy + b, 'boisS', 2);   // les pilotis
    for (let a = 0; a < 14; a++) for (let b = 0; b < 8; b++) P(cx + a, cy - b, 'bois', a % 2 ? 2 : 3 + (b === 0 ? 1 : 0) - (a === 13 ? 1 : 0));   // les murs de planches
    for (let a = 0; a < 14; a++) P(cx + a, cy + 1, 'boisS', 1);
    for (let b = 0; b < 5; b++) for (let a = 0; a < 3; a++) P(cx + 3 + a, cy - b, 'boisS', 1 + (a === 0 ? 1 : 0)); P(cx + 5, cy - 2, 'or', 4);   // la porte, son loquet
    for (let b = 2; b < 5; b++) for (let a = 0; a < 3; a++) P(cx + 8 + a, cy - b, a === 1 || b === 3 ? 'fer' : 'or', a === 1 || b === 3 ? 2 : 5);   // la fenêtre éclairée
    for (let b = 0; b < 9; b++) { const l = 18 - b * 1.4; for (let a = 0; a < l; a++) P(cx - 2 + (18 - l) / 2 + a, cy - 8 - b, b === 8 ? 'toitC' : 'toitC', b === 0 ? 1 : b === 8 ? 5 : 3 + (((a + b) % 3 === 0) ? -1 : 0) + (a < 2 ? 1 : 0)); }   // le toit de chaume, brin à brin
    for (let a = 4; a < 13; a++) P(cx + a, cy - 17, 'toitC', 5);
    for (let b = 0; b < 4; b++) { P(cx + 11, cy - 15 - b, 'murK', 3); P(cx + 12, cy - 15 - b, 'murK', 2); } P(cx + 11, cy - 19, 'murK', 5); P(cx + 12, cy - 19, 'murK', 4); P(cx + 12, cy - 21, 'murH', 5); P(cx + 13, cy - 22, 'murH', 4); P(cx + 12, cy - 23, 'murH', 3); P(cx + 14, cy - 24, 'murH', 3);   // la cheminée et sa fumée
    for (let a = 0; a < 6; a++) { P(cx + 14 + a, cy + 0, 'bois', 4); P(cx + 14 + a, cy + 1, 'boisS', 1); } for (const a of [15, 19]) for (let b = 1; b < 4; b++) P(cx + a, cy - b, 'boisS', 2); for (let a = 15; a < 20; a++) P(cx + a, cy - 3, 'bois', 3);   // le porche sur l'eau, sa rambarde
    for (let b = 0; b < 6; b++) { P(cx - 2, cy - b + 1, 'bois', 3); P(cx - 4, cy - b + 1, 'bois', 3); if (b % 2) { P(cx - 3, cy - b + 1, 'bois', 4); } }   // l'échelle
    for (let b = 0; b < 12; b++) for (let a = 0; a < 3; a++) P(cx + 20 + a, cy + 2 + b * 0 + (a === 0 ? 0 : 0), 'bois', 3);   // le ponton qui avance dans l'étang
    for (let a = 0; a < 14; a++) { P(cx + 20 + a, cy + 1, 'bois', a % 4 === 0 ? 1 : 4); P(cx + 20 + a, cy + 2, 'bois', a % 4 === 0 ? 1 : 3); P(cx + 20 + a, cy + 3, 'boisS', 1); }
    for (let b = 0; b < 4; b++) P(cx + 34, cy - b, 'boisS', 2); P(cx + 34, cy - 4, 'fer', 3); P(cx + 33, cy - 5, 'or', 5); P(cx + 34, cy - 5, 'or', 4); P(cx + 35, cy - 5, 'or', 3);   // le fanal au bout du ponton
    for (let a = 0; a < 8; a++) P(cx + 26 + a, cy - 1 - Math.round(a * 0.4), 'boisS', 3); for (let b = 0; b < 8; b++) P(cx + 34, cy - 4 + b, 'murH', 3);   // la canne et sa ligne
    for (let a = 0; a < 8; a++) for (let b = 0; b < 2; b++) P(cx + 25 + a, cy + 8 + b, a === 0 || a === 7 ? 'boisS' : 'bois', a === 0 || a === 7 ? 1 : 4 - b);   // la barque
    for (const a of [27, 30]) P(cx + a, cy + 7, 'boisS', 2); P(cx + 31, cy + 6, 'murH', 5);
    for (let a = 0; a < 7; a++) for (let b = 0; b < 6; b++) P(cx - 14 + a, cy - 6 + b, (a + b) % 2 ? 'chanvre' : 'cheneSombre', 3); for (const a of [-14, -8]) for (let b = -7; b < 1; b++) P(cx + a, cy + b, 'bois', 2);   // le séchoir à filets (mailles en damier)
    for (let a = 0; a < 3; a++) { P(cx + 16 + a * 2, cy - 5, 'murH', 5); P(cx + 16 + a * 2, cy - 4, 'murH', 4); P(cx + 16 + a * 2, cy - 3, 'voletB', 3); }   // des poissons qui sèchent sous le porche
    for (let b = 0; b < 3; b++) for (let a = 0; a < 3; a++) P(cx - 7 + a, cy + 0 + b, 'bois', a === 0 ? 4 : 2);   // un tonneau
    boite(cx - 15, cy - 24, cx + 36, cy + 11, 'cabane'); }
  // les roseaux, les nénuphars et deux canards sur l'étang
  for (let n = 0; n < 16; n++) { const a = hachage(n, 1, 9160) * 6.283; const x = Math.round(394 + Math.cos(a) * 26), y = Math.round(156 + Math.sin(a) * 12); if (x < 400 && y > 136 && y < 168) continue; if (x >= 394 && x < 418 && y < 156) continue; for (let b = 0; b < 4; b++) P(x, y - b, 'foretK2', b > 2 ? 5 : 3); P(x + 1, y - 3, 'boisS', 3); P(x + 1, y - 4, 'boisS', 2); }
  for (const [x, y] of [[386, 163], [401, 158], [409, 152]]) { P(x, y, 'foretK2', 4); P(x + 1, y, 'foretK2', 3); P(x, y + 1, 'foretK2', 2); P(x + 1, y - 1, 'fleurJ2', 5); }
  for (const [x, y] of [[414, 160], [418, 163]]) { P(x, y, 'murH', 5); P(x + 1, y, 'murH', 4); P(x - 1, y - 1, 'murH', 5); P(x - 1, y - 2, 'bois', 3); P(x - 2, y - 2, 'toitC', 5); }
  yield;
  // ---- 10. les trois pommiers, sur la rive, au coude de la rivière (jamais dans l'eau) : un houppier rond, des pommes rouges ----
  const pommiers = [];
  for (const [x, y] of [[404, 186], [412, 178], [397, 194], [418, 170]]) { if (pommiers.length < 3 && distRiv3(x, y) > 7 && distRiv3(x, y + 6) > 3) pommiers.push([x, y]); }
  for (const [x, y] of pommiers) { for (let b = 2; b < 6; b++) { P(x, y + b, 'boisS', 2); P(x + 1, y + b, 'bois', 2); } t.forme('foretK2', ellipsoide(x, y, 4.6, 4.1), { decalage: 0.55 });
    for (const [a, b] of [[-2, -2], [1, -3], [3, -1], [-3, 1], [0, 1], [2, 2]]) { P(x + a, y + b, 'pomme', 5); P(x + a, y + b + 1, 'pomme', 3); }
    P(x + 3, y + 6, 'pomme', 4); boite(x - 5, y - 5, x + 5, y + 6, 'pommier'); }
  PLAN_VILLE_INFO.pommiers = pommiers;
  yield;
  // ---- 11. le pont de pierre du sud ----
  for (let y = 226; y < 247; y++) for (let x = 195; x < 206; x++) if (distRiv(x, y) < 9.6) t.poser(x, y, 'murK', x === 195 || x === 205 ? 1 : (y % 4 === 0 ? 2 : 4));
  boite(194, 226, 207, 247, 'pont');
  yield;
  // ---- 13. la rose des vents, le cadre ----
  { const cx = 456, cy = 244; for (let k = -8; k <= 8; k++) P(cx, cy + k, 'encre', k < 0 ? 4 : 2); for (let k = -6; k <= 6; k++) P(cx + k, cy, 'encre', 2);
    for (let k = 1; k < 4; k++) { P(cx - k, cy - 8 + k * 2, 'encre', 3); P(cx + k, cy - 8 + k * 2, 'encre', 1); P(cx - k, cy + 8 - k * 2, 'encre', 3); P(cx + k, cy + 8 - k * 2, 'encre', 1); }
    for (let a = 0; a < 24; a++) { const ang = a / 24 * Math.PI * 2; P(cx + Math.cos(ang) * 4.5, cy + Math.sin(ang) * 4.5, 'encre', 3); } P(cx, cy - 8, 'voletR', 4); P(cx, cy - 7, 'voletR', 4); boite(cx - 7, cy - 16, cx + 7, cy + 9, 'rose'); }
  yield;
  // ---- 12. les bois (aux coins, jamais sur l'eau, les rues ou les maisons) ----
  for (let n = 0; n < 320; n++) { const x = hachage(n, 1, 9103) * L, y = hachage(n, 2, 9103) * H; const bois = (x < 58 && y < 100) || (x > 446 && y < 70) || (x > 424 && y > 232) || (y > 256 && x < 226) || (x < 52 && y > 222); if (!bois || distRiv3(x, y) < 4 || boites.some(([a, b, c, d]) => x > a - 4 && x < c + 4 && y > b - 4 && y < d + 4)) continue; arbre(x, y, 2.4 + hachage(n, 3, 9103) * 1.3, n % 4 ? 'foretK' : 'foretK2'); }
  for (let x = 0; x < L; x++) for (const [y, k] of [[0, 1], [1, 2], [2, 4], [H - 1, 1], [H - 2, 2], [H - 3, 4]]) t.poser(x, y, 'encre', k);
  for (let y = 0; y < H; y++) for (const [x, k] of [[0, 1], [1, 2], [2, 4], [L - 1, 1], [L - 2, 2], [L - 3, 4]]) t.poser(x, y, 'encre', k);
  t.texture(s, cle); PLAN_VILLE_INFO.boites = boites;
  return cle;
}
// Le plan d'un seul coup (à la première ouverture, s'il n'a pas été préparé avant)
function planVilleHD(s, cle = 'planVilleHD') {
  const g = planVilleEtapes(s, cle); let r = g.next();
  while (!r.done) r = g.next();
  return cle;
}
// Le plan préparé par morceaux, une partie du dessin par image, quelques secondes après l'arrivée dans un quartier :
// à la première pression sur M, il est prêt
function prechaufferPlanVille(s, delai = 4000) {
  if (s.textures.exists('planVilleHD')) return null;
  let g = null; const debut = s.time.now + delai;
  const ev = s.time.addEvent({ delay: 16, loop: true, callback: () => {
    if (s.time.now < debut) return;
    if (s.textures.exists('planVilleHD')) { ev.remove(); return; }
    if (!g) g = planVilleEtapes(s);
    if (g.next().done) { ev.remove(); if (typeof planVilleGrise === 'function') planVilleGrise(s); }
  } });
  return ev;
}
