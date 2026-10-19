// (lot C, planche 40 v2) La boutique du paon : une maison de maître en pierre blanche, l'étage enduit au bleu du
// Conseil, des colonnes et un fronton, des vitrines cintrées sous des auvents rayés, un tapis rouge. Rien de commun
// avec le comptoir du joueur (chaumière, pierre et colombages), à aucun niveau.
const FACADE_RIVAL = { L: 200, H: 176, porte: [86, 122, 28, 54], enseigne: [128, 112] };
// (v1.12) `v` : la même maison repeinte (l'orphelinat, plus tard le bar) : d'autres couleurs, sans l'emblème du Conseil
function creerFacadeRivalHD(scene, n = 1, v = null) {
  const cle = 'facadeRivalHD_' + n + (v ? '_' + v.nom : '');
  if (scene.textures.exists(cle)) return cle;
  const { L, H } = FACADE_RIVAL;
  const t = toileDecor(L, H);
  Object.assign(t.rampes, RAMPES_EXTERIEUR);
  t.rampes.blanche = [0x6a6458, 0x9a948a, 0xc4beb2, 0xdcd6ca, 0xece8de, 0xfaf8f2];
  t.rampes.bleu = [0x101e3a, 0x1a2e5a, 0x24407a, 0x2e5296, 0x4068b0, 0x6a8cc8];
  t.rampes.or = [0x5a3a08, 0x8a5e10, 0xb8861c, 0xd8a830, 0xf0c850, 0xfff0a0];
  t.rampes.rouge = [0x3a0608, 0x5e0c10, 0x861418, 0xa8201e, 0xc83a30, 0xe06050];
  t.rampes.vitreBleue = [0x2a2010, 0x5a4220, 0x9a7638, 0xd8b060, 0xf0d890, 0xfff6d8];
  if (v && v.rampes) Object.assign(t.rampes, v.rampes);
  const P = (x, y, m, i) => { if (x >= 0 && y >= 0 && x < L && y < H) t.poser(x, y, m, Math.max(0, Math.min(5, i))); };
  // pierre de taille : de grands blocs réguliers, joints fins, lumière en haut à gauche
  const taille = (x0, y0, l, h, bl = 22, bh = 10, g = 1) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + l; x++) {
    const r = Math.floor((y - y0) / bh), dec = (r % 2) * (bl >> 1), bx = (x - x0 + dec) % bl, by = (y - y0) % bh;
    P(x, y, 'blanche', bx === 0 || by === 0 ? 1 : 4 - (by === bh - 1 || bx === bl - 1 ? 1 : 0) + (by === 1 ? 1 : 0) + Math.round((hachage(Math.floor((x + dec) / bl), r, g) - 0.5) * 0.9)); } };
  // 1. le toit : un comble d'ardoise bleue à la Mansart, crête d'or, et un fronton au milieu
  for (let y = 16; y < 52; y++) { const m = Math.round((52 - y) * 0.18); for (let x = 4 + m; x < L - 4 - m; x++) { const rang = Math.floor((y - 16) / 4), bx = (x + (rang % 2) * 3) % 6; P(x, y, 'ardoise', (y - 16) % 4 === 3 ? 1 : 3 + (bx === 0 ? -1 : 0) + (x < 40 ? 1 : 0)); } }
  for (let x = 12; x < L - 12; x++) { P(x, 15, 'or', 4); P(x, 16, 'or', 2); }
  for (let k = 0; k < 9; k++) { const x = 20 + k * 20; P(x, 13, 'or', 5); P(x, 14, 'or', 3); P(x - 1, 14, 'or', 3); P(x + 1, 14, 'or', 3); }   // les épis d'or
  // le fronton triangulaire en pierre blanche, avec son oculus (l'emblème du Conseil y est posé)
  for (let y = 2; y < 52; y++) { const demi = (y - 2) * 0.95; for (let x = Math.round(100 - demi); x <= Math.round(100 + demi); x++) { const bord = Math.abs(x - 100) > demi - 2.5; P(x, y, 'blanche', bord ? 2 : 4 + (x < 100 ? 1 : 0) - (y > 48 ? 1 : 0)); } }
  for (let y = 22; y < 46; y++) for (let x = 88; x < 113; x++) { const d = Math.hypot(x - 100, y - 34); if (d < 11) P(x, y, 'bleu', 1 + Math.round((11 - d) / 4)); else if (d < 12.5) P(x, y, 'or', 3); }
  // 2. la corniche
  for (let y = 50; y < 56; y++) for (let x = 6; x < L - 6; x++) P(x, y, 'blanche', y === 50 ? 5 : y === 55 ? 1 : 3 + (y === 51 ? 1 : 0));
  // 3. l'étage : enduit bleu du Conseil, chaînes d'angle blanches
  for (let y = 56; y < 104; y++) for (let x = 12; x < L - 12; x++) P(x, y, 'bleu', 3 + Math.round((fbm(x * 0.06, y * 0.06, 811) - 0.5) * 1.2));
  for (const x0 of [12, L - 24]) for (let y = 56; y < 104; y++) for (let x = x0; x < x0 + 12; x++) { const r = Math.floor((y - 56) / 8), large = r % 2 ? 12 : 8, dx = x0 < 100 ? x - x0 : x0 + 11 - x; if (dx < large) P(x, y, 'blanche', (y - 56) % 8 === 0 ? 2 : 4 + (dx === 0 ? 1 : 0)); }
  // les deux hautes fenêtres, encadrées de blanc, et la porte-fenêtre du balcon (cintrée)
  const fenetre = (x0, y0, l, h, cintre) => {
    for (let y = y0 - 3; y < y0 + h + 3; y++) for (let x = x0 - 3; x < x0 + l + 3; x++) { const dans = x >= x0 && x < x0 + l && y >= y0 && y < y0 + h; if (cintre && y < y0 + l / 2) { const d = Math.hypot(x - (x0 + l / 2 - 0.5), y - (y0 + l / 2)); if (d > l / 2 + 3) continue; if (d > l / 2) { P(x, y, 'blanche', 4); continue; } } else if (!dans) { P(x, y, 'blanche', x < x0 ? 5 : 3); continue; }
      const carreau = (x - x0) % 7 === 0 || (y - y0) % 8 === 0; P(x, y, carreau ? 'blanche' : 'vitreBleue', carreau ? 4 : 3 + ((x - x0) % 7 < 3 ? 1 : 0)); }
  };
  fenetre(30, 64, 22, 30, false); fenetre(148, 64, 22, 30, false); fenetre(88, 60, 24, 38, true);
  for (let x = 82; x < 118; x++) { P(x, 92, 'fer', 1); P(x, 99, 'fer', 1); if (x % 4 === 0) for (let y = 92; y < 100; y++) P(x, y, 'fer', 2); }   // la balustrade de fer
  for (let x = 82; x < 118; x++) for (let y = 100; y < 104; y++) P(x, y, 'blanche', 3);
  for (const fx of [30, 148]) for (let x = fx - 2; x < fx + 24; x++) { P(x, 96, 'cheneSombre', 2); P(x, 97, 'cheneSombre', 1); if ((x - fx) % 4 === 1) { P(x, 95, 'rouge', 5); P(x, 94, 'rouge', 4); P(x + 1, 95, 'porteVerte', 4); } }   // jardinières de fleurs rouges
  // 4. le bandeau entre les deux niveaux
  for (let y = 104; y < 110; y++) for (let x = 8; x < L - 8; x++) P(x, y, 'blanche', y === 104 ? 5 : y === 109 ? 1 : 3);
  // 5. le rez-de-chaussée : pierre de taille, deux colonnes, une double porte bleue aux poignées d'or
  taille(14, 110, L - 28, 66, 22, 10, 812);
  for (const cx of [80, 120]) { for (let y = 114; y < 176; y++) for (let x = cx - 5; x < cx + 5; x++) { const u = (x - cx + 0.5) / 5; P(x, y, 'blanche', y < 120 || y > 170 ? 3 : Math.round(4.6 - Math.abs(u + 0.35) * 3)); } for (let x = cx - 7; x < cx + 7; x++) { P(x, 113, 'blanche', 5); P(x, 114, 'blanche', 3); P(x, 175, 'blanche', 2); } }
  const [px, py, pl, ph] = FACADE_RIVAL.porte;
  for (let y = py; y < py + ph; y++) for (let x = px; x < px + pl; x++) { const milieu = x === px + (pl >> 1); P(x, y, 'bleu', milieu ? 0 : 2 + ((x - px) % 14 > 1 && (x - px) % 14 < 12 && (y - py) % 18 > 2 && (y - py) % 18 < 15 ? 1 : 0)); }
  for (let y = py - 6; y < py; y++) for (let x = px - 2; x < px + pl + 2; x++) { const d = Math.hypot(x - (px + pl / 2), y - py); if (d < pl / 2 + 2) P(x, y, 'vitreBleue', 4); }   // l'imposte vitrée
  for (const dx of [-3, 3]) for (let k = 0; k < 3; k++) P(px + (pl >> 1) + dx, py + 28 + k, 'or', 5 - k);
  // les deux vitrines cintrées, illuminées, pleines d'objets qui brillent
  const vitrine = (x0) => { const y0 = 122, l = 40, h = 40; for (let y = y0 - 2; y < y0 + h; y++) for (let x = x0 - 2; x < x0 + l + 2; x++) { const top = y < y0 + 8 ? Math.hypot((x - x0 - l / 2) / (l / 2 + 2), (y - y0 - 8) / 10) : 0; if (top > 1) continue; const cadre = x < x0 || x >= x0 + l || (y < y0 + 8 && top > 0.86); P(x, y, cadre ? 'or' : 'vitreBleue', cadre ? 3 : 3 + (y > y0 + h - 12 ? -1 : 1) + (hachage(x, y, 813) < 0.04 ? 2 : 0)); }
    // deux étagères de bois sombre, chargées de coupes d'or, de fioles bleues et d'épées d'apparat
    for (const ey of [y0 + 20, y0 + h - 8]) { for (let x = x0 + 2; x < x0 + l - 2; x++) { P(x, ey, 'cheneSombre', 2); P(x, ey + 1, 'cheneSombre', 0); }
      for (let k = 0; k < 5; k++) { const ox = x0 + 5 + k * 7, sorte = (k + ey) % 3;
        if (sorte === 0) { for (let j = 0; j < 6; j++) for (let i = 0; i < 4; i++) if (j < 3 || i === 1 || i === 2 || j === 5) P(ox + i, ey - 1 - j, 'or', j === 5 ? 3 : 2 + (i === 1 ? 2 : 0)); }
        else if (sorte === 1) { for (let j = 0; j < 7; j++) for (let i = 0; i < 3; i++) if (j < 5 || i === 1) P(ox + i, ey - 1 - j, 'bleu', 2 + (i === 0 ? 2 : 0)); P(ox + 1, ey - 8, 'or', 4); }
        else { for (let j = 0; j < 10; j++) P(ox + 1, ey - 1 - j, 'fer', j > 7 ? 2 : 4); for (let i = 0; i < 3; i++) P(ox + i, ey - 8, 'or', 3); } } } };
  vitrine(24); vitrine(136);
  // les auvents rayés bleu et blanc, à festons
  for (const x0 of [20, 132]) for (let y = 112; y < 121; y++) for (let x = x0; x < x0 + 48; x++) { if (y === 120 && (x - x0) % 6 > 3) continue; P(x, y, Math.floor((x - x0) / 6) % 2 ? 'blanche' : 'bleu', y === 112 ? 5 : 3 + (y > 117 ? -1 : 0)); }
  // le tapis rouge, devant la porte, et ses deux marches
  for (let y = 171; y < 176; y++) for (let x = px - 6; x < px + pl + 6; x++) P(x, y, y === 171 ? 'blanche' : 'rouge', y === 171 ? 5 : 3 + (x % 5 === 0 ? 1 : 0));
  // (plus tard, quand il s'enrichit) : des dorures en plus, sans rien emprunter à la maison du joueur
  if (n >= 2) { for (let x = 14; x < L - 14; x++) { P(x, 110, 'or', 4); P(x, 109, 'or', 2); } for (const cx of [80, 120]) for (let x = cx - 7; x < cx + 7; x++) P(x, 113, 'or', 5); }
  t.texture(scene, cle);
  return cle;
}
// La façade du paon posée dans une scène, avec son enseigne ovale dorée (pas celle du joueur), sa bannière et ses affiches
function dessinerFacadeRival(scene, cx, sol, n = 1, nom = 'Au Comptoir Agréé', v = null) {
  const cle = creerFacadeRivalHD(scene, n, v); creerEmblemesHD(scene);
  const [eC, eF, eL] = (v && v.enseigne) || [0xb8861c, 0x101e3a, 0xf0c850];
  const image = scene.add.image(cx, sol + 2, cle).setOrigin(0.5, 1).setScale(2);
  const gauche = cx - FACADE_RIVAL.L, haut = sol + 2 - FACADE_RIVAL.H * 2;
  if (!v) scene.add.image(gauche + 100 * 2, haut + 34 * 2, 'embleme_conseil').setScale(0.42);
  // l'enseigne ovale : fond bleu nuit, cadre d'or, lettres d'or, pendue à une potence de fer forgé
  const ex = gauche + 172 * 2, ey = haut + 118 * 2;
  const g = scene.add.graphics();
  g.lineStyle(4, 0x2a2a30).lineBetween(ex - 40, ey - 18, ex + 38, ey - 18).lineBetween(ex + 34, ey - 18, ex + 34, ey - 36);
  g.lineStyle(2, 0x2a2a30).lineBetween(ex - 22, ey - 18, ex - 22, ey - 6).lineBetween(ex + 22, ey - 18, ex + 22, ey - 6);
  g.fillStyle(eC).fillEllipse(ex, ey + 14, 120, 44).fillStyle(eF).fillEllipse(ex, ey + 14, 110, 36).lineStyle(2, eL).strokeEllipse(ex, ey + 14, 100, 30);
  const hex = c => '#' + c.toString(16).padStart(6, '0');
  scene.add.text(ex, ey + 14, nom, style(11, hex(eL), { fontStyle: 'bold', stroke: hex(eF), strokeThickness: 2 })).setOrigin(0.5);
  const porteX = gauche + (FACADE_RIVAL.porte[0] + FACADE_RIVAL.porte[2] / 2) * 2;
  return { image, porteX, gauche, haut };
}
