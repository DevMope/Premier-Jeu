// (v1.49, planche 73 v2 validée « parfait ») Les dessins de la grand-place du marché, et les palettes des régions.

// Les palettes : 60 % (la couleur qui domine), 30 % (la seconde), 10 % (l'accent), + les complémentaires.
// `sol` : comment le sol de la région s'en sert (herbe, terre, pierre, fleurs, feuillage).
const PALETTES_REGIONS = {
  comte: { nom: 'La Comté', lieu: 'le marché, ta rue, le Moulin', p: [[0x7aa84e, 'vert prairie'], [0xc8a06a, 'ocre de terre battue'], [0xc23a2c, 'rouge garance']], compl: [0xf2e4c4, 0x7ab8d8, 0x7a5230, 0xe8c040],
    sol: { herbe: 0x7aa84e, terre: 0xc8a06a, pierre: 0xb8ac94, fleur: 0xd84a3a, fleur2: 0xf0d050, feuille: 0x5a8a3a }, humeur: 'chaud, rond, rassurant : le pays où l’on rentre' },
  monts: { nom: 'Les Monts des nains', lieu: 'forges, mines, cols', p: [[0x667086, 'ardoise bleutée'], [0x9a5a32, 'rouille et cuivre'], [0xf0b030, 'or de forge']], compl: [0xe8eef2, 0xe0602a, 0x3a3a44, 0x8a9aa8],
    sol: { herbe: 0x7d8a6e, terre: 0x8c8274, pierre: 0x6e7890, fleur: 0xf0b030, fleur2: 0xe8eef2, feuille: 0x4e6a5a }, humeur: 'froid dehors, braise dedans' },
  foret: { nom: 'Les Forêts des elfes', lieu: 'Lothlórien, Fondcombe', p: [[0x3e6e4a, 'vert profond'], [0x9ab8c8, 'argent bleuté'], [0xe8d890, 'or pâle']], compl: [0x7a6a9a, 0xf4f4ec, 0x2a4a3a, 0xb8d8a0],
    sol: { herbe: 0x4a7e50, terre: 0x7a6a4a, pierre: 0xa8b8b8, fleur: 0xe8d890, fleur2: 0xc8b8e8, feuille: 0x2e5a3c }, humeur: 'calme, ancien, lumière qui filtre' },
  cite: { nom: 'La Cité des hommes', lieu: 'Hautval, le Conseil', p: [[0xd8ccb0, 'pierre crème'], [0x2e4a8a, 'bleu royal'], [0xb02a2a, 'rouge des bannières']], compl: [0xd0a040, 0x6e9a4a, 0x4a4038, 0xf4ecd8],
    sol: { herbe: 0x6e9a4a, terre: 0xbcae92, pierre: 0xd4c8ac, fleur: 0xb02a2a, fleur2: 0x2e4a8a, feuille: 0x4a7a3a }, humeur: 'ordre, pouvoir, cérémonie' },
  mages: { nom: 'Les Terres des mages', lieu: 'tours, Bibliothèque, Opale', p: [[0x5a3a7a, 'violet'], [0x1e2a5a, 'bleu nuit'], [0x3ad0c0, 'turquoise des sorts']], compl: [0xe0c050, 0xe88ab8, 0x2a1a3a, 0xc8c8e8],
    sol: { herbe: 0x4a6a72, terre: 0x6a5a7a, pierre: 0x7a6a9a, fleur: 0x3ad0c0, fleur2: 0xe0c050, feuille: 0x3a4a6a }, humeur: 'mystère, étoiles, savoir' },
  bannis: { nom: 'Les Terres des Bannis', lieu: 'le marché noir, l’Antre', p: [[0x3a2e2a, 'brun-noir'], [0x6a7a3a, 'vert maladif'], [0xa01a1a, 'rouge sang']], compl: [0xd8d0b8, 0x5a2a5a, 0x1a1414, 0xc8a050],
    sol: { herbe: 0x5a6432, terre: 0x4e3e32, pierre: 0x5a5450, fleur: 0xa01a1a, fleur2: 0xd8d0b8, feuille: 0x3e4a26 }, humeur: 'menace, sécheresse, braises' },
};

// Le sol d'une place, à la Stardew : herbe partout, terre battue là où l'on marche (sous les étals, les chemins),
// dalles de pierre au centre seulement, qui se dispersent en pas japonais vers les bords. L'herbe déborde sur la
// terre (un liseré clair, une ombre dessous) : le sol a du relief.
//   plan : { centre:[x,y], rTerre, rDalles, pads:[[x,y,l,h]], chemins:[[[x,y],[x,y]],...], largeur, pas:[[x,y]] }
function solPlaceHD(scene, cle, pal, L, H, plan) {
  if (scene.textures.exists(cle)) return cle;
  const t = toileDecor(L, H), R = t.rampes, s = pal.sol;
  R.herbeP = rampe(s.herbe); R.terreP = rampe(s.terre); R.pierreP = rampe(s.pierre); R.fleurP = rampe(s.fleur); R.fleur2P = rampe(s.fleur2); R.feuilleP = rampe(s.feuille);
  R.jointP = rampe(((s.terre >> 1) & 0x7f7f7f));
  const [cx, cy] = plan.centre, G0 = plan.graine || 7600;
  const distSeg = (x, y, [ax, ay], [bx, by]) => { const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1; const u = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l2)); return Math.hypot(ax + u * dx - x, ay + u * dy - y); };
  // 1. qui est quoi : 0 herbe, 1 terre, 2 dalle
  const type = new Uint8Array(L * H), dalle = new Int32Array(L * H).fill(-1), bord = new Float32Array(L * H), cote = new Int8Array(L * H);
  const C = 12;   // la taille moyenne d'une dalle
  for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) {
    const n = (fbm(x * 0.06, y * 0.06, G0) - 0.5) * 14, i = y * L + x;
    const dr = Math.hypot(x - cx, (y - cy) * 1.55);
    let terre = dr < plan.rTerre + n;
    if (!terre) for (const [px, py, pl, ph] of plan.pads) { const ex = Math.max(0, Math.abs(x - px) - pl / 2), ey = Math.max(0, Math.abs(y - py) - ph / 2); if (Math.hypot(ex, ey * 1.4) < 8 + n * 0.6) { terre = true; break; } }
    if (!terre) for (const c of plan.chemins) if (distSeg(x, y, c[0], c[1]) < (c[2] || plan.largeur) + n * 0.4) { terre = true; break; }
    if (!terre) continue;
    type[i] = 1;
    // les dalles : un pavage irrégulier (cellules de Voronoï), plein au centre, clairsemé vers les bords
    const gx = Math.floor(x / C), gy = Math.floor(y / C);
    let d1 = 1e9, d2 = 1e9, best = null;
    for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) {
      const ax = gx + k, ay = gy + j, fx = (ax + 0.15 + hachage(ax, ay, G0 + 1) * 0.7) * C, fy = (ay + 0.15 + hachage(ax, ay, G0 + 2) * 0.7) * C;
      const d = Math.hypot(x + 0.5 - fx, (y + 0.5 - fy) * 1.2);
      if (d < d1) { d2 = d1; d1 = d; best = [ax, ay, fx, fy]; } else if (d < d2) d2 = d;
    }
    const [ax, ay, fx, fy] = best, drF = Math.hypot(fx - cx, (fy - cy) * 1.55);
    let proba = drF < plan.rDalles - 26 ? 0.96 : drF < plan.rDalles ? 0.96 - (drF - plan.rDalles + 26) / 26 * 0.7 : drF < plan.rDalles + 30 ? 0.18 : 0;
    for (const [sx, sy] of plan.pas || []) if (Math.hypot(fx - sx, fy - sy) < 8) proba = 1;
    if (hachage(ax, ay, G0 + 3) < proba && d2 - d1 > 1.4) { type[i] = 2; dalle[i] = (ay & 0xffff) * 65536 + (ax & 0xffff); bord[i] = d2 - d1; cote[i] = (x - fx) + (y - fy) * 1.3 < 0 ? 1 : -1; }
    else if (hachage(ax, ay, G0 + 3) < proba) { type[i] = 3; }   // le joint entre deux dalles
  }
  // 2. on peint, avec le relief
  const T = (x, y) => (x < 0 || y < 0 || x >= L || y >= H ? 0 : type[y * L + x]);
  for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) {
    const i = y * L + x, ty = type[i];
    if (ty === 0) {
      // l'herbe : des plaques plus claires ou plus sombres, des brins, et le liseré clair au bord de la terre
      const p = fbm(x * 0.025, y * 0.025, G0 + 4), q = hachage(x, y, G0 + 5);
      let k = p > 0.6 ? 4 : 3;
      if (p > 0.56 && p <= 0.6 && (x + y) % 2 === 0) k = 4;   // (un tramage doux entre les deux tons)
      if (q > 0.97) k += 1; else if (q < 0.025) k -= 1;
      if (T(x, y + 1) && T(x, y + 1) !== 0) k = 5; else if (T(x, y + 2) && T(x, y + 2) !== 0) k = 4;
      t.poser(x, y, 'herbeP', k);
    } else if (ty === 1) {
      // la terre battue : douce, quelques cailloux ; à l'ombre de l'herbe qui la surplombe, plus sombre
      const p = fbm(x * 0.05, y * 0.05, G0 + 6);
      let k = p > 0.6 ? 4 : p < 0.24 ? 2 : 3;
      if (T(x, y - 1) === 0) k = 1; else if (T(x, y - 2) === 0 || T(x - 1, y) === 0) k = Math.min(k, 2);
      if (T(x, y - 1) === 2 || T(x - 1, y - 1) === 2) k = Math.min(k, 2);
      t.poser(x, y, 'terreP', k);
    } else if (ty === 3) t.poser(x, y, hachage(x >> 2, y >> 2, G0 + 7) < 0.3 ? 'herbeP' : 'jointP', 2);
    else {
      // une dalle : son ton à elle, biseau clair en haut à gauche, sombre en bas à droite, un peu de grain
      const d = dalle[i], v = hachage(d & 0xffff, d >> 16, G0 + 8);
      let k = 3 + (v > 0.7 ? 1 : v < 0.25 ? -1 : 0);
      if (bord[i] < 3.2) k += cote[i];
      if (hachage(x, y, G0 + 9) > 0.93) k -= 1;
      if (v > 0.9 && fbm(x * 0.3, y * 0.3, G0 + 10) > 0.62) { t.poser(x, y, 'herbeP', 2); continue; }   // (de la mousse sur les vieilles)
      t.poser(x, y, 'pierreP', k);
    }
  }
  // 3. des touffes d'herbe en V et des fleurs (l'accent) dans l'herbe, des cailloux sur la terre
  for (let n = 0; n < L * H / 260; n++) {
    const x = Math.floor(hachage(n, 1, G0 + 11) * L), y = Math.floor(hachage(n, 2, G0 + 11) * H);
    if (T(x, y) !== 0 || T(x, y + 3) !== 0) continue;
    const r = hachage(n, 3, G0 + 11);
    if (r < 0.08) { const m = r < 0.05 ? 'fleurP' : 'fleur2P'; for (const [a, b] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) t.poser(x + a, y + b, m, 4); t.poser(x, y, 'fleur2P', 5); t.poser(x, y + 2, 'feuilleP', 2); }
    else { t.poser(x - 1, y - 1, 'herbeP', 5); t.poser(x, y, 'herbeP', 4); t.poser(x + 1, y - 1, 'herbeP', 5); t.poser(x, y + 1, 'herbeP', 1); }
  }
  for (let n = 0; n < L * H / 900; n++) {
    const x = Math.floor(hachage(n, 4, G0 + 12) * L), y = Math.floor(hachage(n, 5, G0 + 12) * H);
    if (T(x, y) !== 1 || T(x + 1, y + 1) !== 1) continue;
    t.poser(x, y, 'pierreP', 4); t.poser(x + 1, y, 'pierreP', 3); t.poser(x, y + 1, 'terreP', 1); t.poser(x + 1, y + 1, 'terreP', 1);
  }
  t.texture(scene, cle); return cle;
}

// Un arbre (vu un peu de face, comme chez Stardew) : un tronc, une couronne en grappes éclairée d'en haut à gauche
function arbrePlaceHD(scene, pal, variante = 0) {
  const cle = 'arbrePlace_' + pal.nom + '_' + variante; if (scene.textures.exists(cle)) return cle;
  const L = 64, H = 84, t = toileDecor(L, H), R = t.rampes;
  R.feuilleP = rampe(pal.sol.feuille); R.ecorce = rampe(0x6a4a2e); R.fleurP = rampe(pal.sol.fleur);
  for (let y = 54; y < 82; y++) { const w = 4 + (y > 74 ? (y - 74) * 0.8 : 0); for (let x = Math.round(32 - w); x < Math.round(32 + w); x++) t.poser(x, y, 'ecorce', x < 30 ? 4 : x > 34 ? 1 : 2 + (hachage(x, y >> 2, 77) > 0.7 ? 1 : 0)); }
  const grappes = [[32, 30, 24], [18, 38, 14], [46, 38, 14], [24, 20, 13], [40, 20, 13], [32, 46, 15]];
  for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) {
    let dedans = null;
    for (const [gx, gy, r] of grappes) { const d = Math.hypot(x + 0.5 - gx, (y + 0.5 - gy) * 1.05) / r; if (d < 1 && (!dedans || d < dedans[0])) dedans = [d, gx, gy, r]; }
    if (!dedans) continue;
    const [d, gx, gy] = dedans, lum = ((gx - x) + (gy - y)) / 20 + (32 - x) / 50 + (30 - y) / 40;
    let k = 3 + Math.round(lum * 1.1) - (d > 0.86 ? 1 : 0);
    if (hachage(x >> 1, y >> 1, 78 + variante) > 0.88) k += 1;
    t.poser(x, y, 'feuilleP', k);
  }
  if (variante === 1) for (let n = 0; n < 14; n++) { const x = 12 + Math.floor(hachage(n, 1, 79) * 40), y = 12 + Math.floor(hachage(n, 2, 79) * 36); if (t.mat(x, y) === 'feuilleP') { t.poser(x, y, 'fleurP', 4); t.poser(x + 1, y, 'fleurP', 3); } }
  t.contour(); t.texture(scene, cle); return cle;
}
// Un buisson rond
function buissonPlaceHD(scene, pal) {
  const cle = 'buissonPlace_' + pal.nom; if (scene.textures.exists(cle)) return cle;
  const L = 34, H = 22, t = toileDecor(L, H); t.rampes.feuilleP = rampe(pal.sol.feuille); t.rampes.fleurP = rampe(pal.sol.fleur);
  for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) { let best = 9; for (const [gx, gy, r] of [[11, 12, 10], [23, 12, 10], [17, 8, 9]]) best = Math.min(best, Math.hypot(x + 0.5 - gx, y + 0.5 - gy) / r); if (best < 1) t.poser(x, y, 'feuilleP', 3 + Math.round((17 - x) / 14 + (8 - y) / 8) - (best > 0.85 ? 1 : 0) + (hachage(x, y, 81) > 0.9 ? 1 : 0)); }
  for (const [x, y] of [[9, 7], [22, 9], [15, 13], [27, 14]]) { t.poser(x, y, 'fleurP', 4); t.poser(x + 1, y, 'fleurP', 3); }
  t.contour(); t.texture(scene, cle); return cle;
}
// Une ombre portée (ellipse douce), sous tout ce qui est debout
function ombrePlaceHD(scene) {
  const cle = 'ombrePlace'; if (scene.textures.exists(cle)) return cle;
  const c = scene.textures.createCanvas(cle, 64, 24), g = c.getContext(), d = g.createRadialGradient(32, 12, 2, 32, 12, 32);
  d.addColorStop(0, 'rgba(20,12,4,0.42)'); d.addColorStop(0.65, 'rgba(20,12,4,0.3)'); d.addColorStop(1, 'rgba(20,12,4,0)');
  g.save(); g.scale(1, 24 / 64); g.fillStyle = d; g.beginPath(); g.arc(32, 32, 32, 0, Math.PI * 2); g.fill(); g.restore(); c.refresh();
  return cle;
}
// Une barrière basse de bois (un tronçon de `n` piquets)
function barrierePlaceHD(scene, n = 5) {
  const cle = 'barrierePlace' + n; if (scene.textures.exists(cle)) return cle;
  const L = n * 10 + 2, H = 16, t = toileDecor(L, H);
  for (let k = 0; k <= n; k++) for (let y = 1; y < 16; y++) for (let x = k * 10; x < k * 10 + 3; x++) t.poser(x, y, 'chene', x === k * 10 ? 4 : 2 + (y === 1 ? 2 : 0));
  for (const yy of [5, 10]) for (let x = 0; x < L; x++) for (let k = 0; k < 2; k++) t.poser(x, yy + k, 'chene', k === 0 ? 4 : 2);
  t.contour(); t.texture(scene, cle); return cle;
}

// Un grand panneau de nom, pendu à une potence : on le lit de loin
function enseigneLieu(s, x, y, nom, metier, couleur = '#f3d98a', prof = 0) {
  const o = [];
  const tn = s.add.text(x, y, nom, style(15, couleur, { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 5 })).setOrigin(0.5, 1).setDepth(prof + 0.2);
  const tm = metier ? s.add.text(x, y - 2, metier, style(11, '#fff4dc', { stroke: '#1a0e06', strokeThickness: 3 })).setOrigin(0.5, 1).setDepth(prof + 0.2) : null;
  const l = Math.max(tn.width, tm ? tm.width : 0, 80) + 22;   // (v1.61 : la ligne du métier tient aussi sur la planche)
  o.push(s.add.image(x, y - (metier ? 18 : 10), planchetteHD(s, Math.round(l / 2), metier ? 22 : 14)).setScale(2).setDepth(prof + 0.1));
  o.push(tn);
  if (tm) { tn.setY(y - 14); o.push(tm); }
  return o;
}

// Une planchette de bois clouée (le fond des grands panneaux de noms)
function planchetteHD(scene, l, h) {
  const cle = 'planchette_' + l + 'x' + h; if (scene.textures.exists(cle)) return cle;
  const t = toileDecor(l, h);
  planche(t, 0, 0, l, h, 'chene', { graine: 7420 + l, noeuds: 1 });
  for (let x = 0; x < l; x++) { t.poser(x, 0, 'cheneSombre', 4); t.poser(x, h - 1, 'cheneSombre', 1); }
  for (const [x, y] of [[2, 2], [l - 3, 2], [2, h - 3], [l - 3, h - 3]]) t.poser(x, y, 'fer', 4);
  t.contour(); t.texture(scene, cle); return cle;
}

// (v1.62) Le plan du sol de la grand-place (terre battue sous les étals et sur les chemins d'usure, dalles au centre,
// herbe ailleurs) : la place le peint vu d'au-dessus, la vue du mendiant le reprend en perspective.
function planSolPlace() {
  const pads = Object.entries(LIEUX_PLACE).filter(([k]) => !['fontaine', 'arche', 'moulin', 'carte'].includes(k)).map(([k, [x, y]]) => PETITS_LIEUX.includes(k) ? [x / 2, y / 2 - 6, 44, 18] : [x / 2, y / 2 - 12, 104, 34]);
  pads.push([530, 500, 40, 20]);
  const chemins = [...pads.map(([x, y]) => [[450, 318], [x, y]]), [[450, 318], [450, 520], 12], [[450, 318], [900, 382], 8], [[0, 92], [900, 92], 11]];
  return { centre: [450, 318], rTerre: 150, rDalles: 104, pads, chemins, largeur: 8, pas: [[450, 432], [452, 452], [448, 472], [451, 492]] };
}
// Un point du plan (en demi-pixels de la place, continus) est-il de terre battue ? (le même calcul que solPlaceHD)
function estTerrePlace(plan, x, y) {
  const distSeg = (x, y, [ax, ay], [bx, by]) => { const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1; const u = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l2)); return Math.hypot(ax + u * dx - x, ay + u * dy - y); };
  const n = (fbm(x * 0.06, y * 0.06, plan.graine || 7600) - 0.5) * 14, [cx, cy] = plan.centre;
  if (Math.hypot(x - cx, (y - cy) * 1.55) < plan.rTerre + n) return true;
  for (const [px, py, pl, ph] of plan.pads) { const ex = Math.max(0, Math.abs(x - px) - pl / 2), ey = Math.max(0, Math.abs(y - py) - ph / 2); if (Math.hypot(ex, ey * 1.4) < 8 + n * 0.6) return true; }
  for (const c of plan.chemins) if (distSeg(x, y, c[0], c[1]) < (c[2] || plan.largeur) + n * 0.4) return true;
  return false;
}

// --- (v1.62, planche 80, système A validé) Le porche couvert, à l'entrée de la place côté rue ---
// Deux poteaux de chêne sur leurs socles de grès, un linteau, un petit toit de tuiles, les deux battants ouverts vers
// la place ; l'écriteau pend sous le linteau. L'ouverture est vide : on voit le chemin, et qui passe.
function toilePorche(l, h) { const t = toileDecor(l, h); Object.assign(t.rampes, RAMPES_RUE); t.rampes.gres = rampe(0xb8a07a); return t; }
// Un battant ouvert vers la place, vu de biais : il part du gond (xh, bas) et file vers l'intérieur (sens) et vers le
// fond (il monte à l'écran) ; des planches et deux pentures
function battantOuvert(t, xh, bas, sens, { dx = 11, dy = 14, haut = 46, graine = 1 } = {}) {
  for (let u = 0; u <= dx; u++) {
    const x = xh + sens * u, yb = bas - Math.round(u / dx * dy), yt = yb - haut;
    for (let y = yt; y <= yb; y++) {
      const h = yb - y, joint = u > 0 && u % Math.max(3, Math.round(dx / 4)) === 0;
      const penture = (Math.abs(h - haut * 0.18) < 1 || Math.abs(h - haut * 0.8) < 1) && u < dx - 1;
      if (penture) { t.poser(x, y, 'fer', 3); continue; }
      if (Math.abs(h - haut * 0.18 + 1.5) < 0.6 || Math.abs(h - haut * 0.8 + 1.5) < 0.6) { t.poser(x, y, 'fer', 1); continue; }
      t.poser(x, y, 'chene', joint ? 1 : u === dx ? 1 : y === yt ? 4 : 2 + (hachage(Math.floor(u / 3), Math.floor(h / 9), graine) > 0.6 ? 1 : 0));
    }
  }
}
// Le porche (120×84, demi-résolution, ×2 sur la place) ; PORCHE_MARCHE : où sont ses poteaux et ses battants
const PORCHE_MARCHE = { L: 120, H: 84, poteaux: [25, 94], socle: 6, chaines: [46, 73], linteau: 18 };
function porcheMarcheHD(scene) {
  if (scene.textures.exists('porcheMarcheHD')) return 'porcheMarcheHD';
  const L = PORCHE_MARCHE.L, H = PORCHE_MARCHE.H, sol = H - 1, t = toilePorche(L, H);
  battantOuvert(t, 29, sol - 3, 1, { dx: 13, dy: 16, haut: 48, graine: 7401 }); battantOuvert(t, 90, sol - 3, -1, { dx: 13, dy: 16, haut: 48, graine: 7402 });
  for (const cx of PORCHE_MARCHE.poteaux) {
    moellons(t, cx - 6, sol - 7, 13, 8, 7403 + cx, 'gres', 6);                                         // le socle de pierre
    for (let x = cx - 6; x <= cx + 6; x++) t.poser(x, sol - 7, 'gres', 5);
    planche(t, cx - 3, 22, 7, sol - 29, 'chene', { horizontale: false, graine: 7404 + cx, noeuds: 1 });  // le poteau
    for (let y = 22; y < sol - 7; y++) { t.poser(cx - 3, y, 'chene', 5); t.poser(cx + 3, y, 'chene', 1); }
  }
  for (const [x0, sens] of [[28, 1], [91, -1]]) for (let k = 0; k < 13; k++) for (let e = 0; e < 3; e++) t.poser(x0 + sens * k, 36 - k + e, 'chene', e === 0 ? 4 : 2);   // les aisseliers
  planche(t, 10, 18, 100, 6, 'chene', { graine: 7405, noeuds: 2 });                                   // le linteau
  for (let x = 10; x < 110; x++) t.poser(x, 24, 'cheneSombre', 1);
  toitRue(t, 2, 117, 4, 18, 'tuile', 7406);                                                           // le petit toit de tuiles
  for (const x of PORCHE_MARCHE.chaines) for (let y = 25; y < 29; y++) t.poser(x, y, 'fer', y % 2 ? 4 : 2);   // les chaînes de l'écriteau
  t.contour(); t.texture(scene, 'porcheMarcheHD'); return 'porcheMarcheHD';
}
// Un écriteau peint (fond crème, cadre de chêne), à la taille du texte mesuré : rien ne déborde
function pancarteMarcheHD(scene, l, h) {
  const cle = 'pancarteMarche_' + l + 'x' + h; if (scene.textures.exists(cle)) return cle;
  const t = toileDecor(l, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < l; x++) { const cadre = x < 1 || y < 1 || x >= l - 1 || y >= h - 1; t.poser(x, y, cadre ? 'cheneSombre' : 'parchemin', cadre ? (x < 1 || y < 1 ? 4 : 1) : 4 + (fbm(x * 0.1, y * 0.3, 7430) > 0.62 ? 1 : 0) - (y === 1 ? 1 : 0)); }
  t.contour(); t.texture(scene, cle); return cle;
}
// L'écriteau qui pend sous le linteau (son haut en yHaut) ; lignes : [[texte, taille, style en plus], ...]
function ecriteauPorche(s, x, yHaut, lignes) {
  const tt = lignes.map(([txt, taille, extra], i) => s.add.text(x, 0, txt, style(taille, i ? '#5a3a1e' : '#3a2410', extra)).setOrigin(0.5, 0));
  const W = Math.max(...tt.map(o => o.width)) + 18, Hh = tt.reduce((a, o) => a + o.height - 2, 0) + 10;
  const l = Math.ceil(W / 2), h = Math.ceil(Hh / 2);
  const im = s.add.image(x, yHaut, pancarteMarcheHD(s, l, h)).setOrigin(0.5, 0).setScale(2);
  let y = yHaut + 5; for (const o of tt) { o.setY(y); y += o.height - 2; }
  return [im, ...tt];
}

// --- (v1.62, planche 80 validée) Le mendiant vu de près, dans son vrai coin de la grand-place ---
// On le regarde depuis là où se tient JeuneGoy (juste au sud de lui) : derrière lui, c'est la place elle-même, en
// perspective. Le sol est celui de la place (même plan, même grain), les étals, les maisons, les arbres et la fontaine
// sont posés à leur vraie distance, avec un peu de brume au loin. Plus de mur de ruelle.
// La caméra : 2,5 m au sud du mendiant, les yeux à 1,45 m ; 40 px de la place font 1 m ; l'horizon en y0.
const CAMERA_MENDIANT = { X: 756, Y: 1100, h: 1.45, f: 512, y0: 208, m: 40 };
function projeterMendiant(X, Y) { const C = CAMERA_MENDIANT, d = (C.Y - Y) / C.m; if (d <= 0.2) return null; const k = C.f / d; return { d, k, x: 480 + (X - C.X) / C.m * k, y: C.y0 + C.h * k, e: k / C.m }; }

// Le sol vu du coin du mendiant (480 de large, à demi-résolution, de l'horizon au bas de l'écran), une texture par
// saison. Il est long à peindre : on le prépare par petits morceaux pendant qu'on se promène sur la place
// (budget : le temps qu'on peut y passer à chaque appel, en ms), et on le finit d'un coup si la vue s'ouvre avant.
const SOLS_MENDIANT = {};
function solMendiantHD(s, saison, budget = Infinity) {
  const cle = 'solMendiant_' + saison;
  if (s.textures.exists(cle)) return cle;
  const src = 'solPlace_' + saison;
  if (!s.textures.exists(src) || !s.palettePlace) return null;
  const etat = SOLS_MENDIANT[cle] = SOLS_MENDIANT[cle] || { suite: peindreSolMendiant(s, s.palettePlace, src) };
  const fin = performance.now() + budget;
  let r;
  do { r = etat.suite.next(); } while (!r.done && performance.now() < fin);
  if (!r.done) return null;
  const { W, H, img, r0 } = r.value, tex = s.textures.createCanvas(cle, W, H);
  tex.getContext().putImageData(img, 0, 0); tex.refresh(); tex.r0 = r0;
  delete SOLS_MENDIANT[cle];
  return cle;
}
function* peindreSolMendiant(s, pal, src) {
  const C = CAMERA_MENDIANT, S = pal.sol, plan = planSolPlace(), G0 = 7600;
  const R = { herbe: rampe(S.herbe), terre: rampe(S.terre), pierre: rampe(S.pierre), fleur: rampe(S.fleur), fleur2: rampe(S.fleur2), feuille: rampe(S.feuille), joint: rampe(((S.terre >> 1) & 0x7f7f7f)) };
  const qui = new Map(); for (const [m, r] of Object.entries(R)) r.forEach((c, k) => { if (!qui.has(c)) qui.set(c, [m, k]); });
  const image = s.textures.get(src).getSourceImage();
  const px0 = image.getContext('2d').getImageData(0, 0, image.width, image.height).data, SW = image.width, SH = image.height;
  const lire = (X, Y) => { const x = Math.floor(X / 2), y = Math.floor(Y / 2); if (x < 0 || y < 0 || x >= SW || y >= SH) return ['herbe', 3]; const i = (y * SW + x) * 4, c = (px0[i] << 16) | (px0[i + 1] << 8) | px0[i + 2]; return qui.get(c) || ['herbe', 3]; };
  const r0 = Math.floor(C.y0 / 2) + 1, W = 480, H = 270 - r0;
  const img = new ImageData(W, H), brume = [0xd8, 0xcc, 0xb4];
  for (let py = 0; py < H; py++) {
    const sy = (r0 + py) * 2 + 1, d = C.h * C.f / (sy - C.y0), dLoin = C.h * C.f / Math.max(0.5, sy - 1 - C.y0), dPres = C.h * C.f / (sy + 1 - C.y0);
    const prof = (dLoin - dPres) * C.m / 2;   // combien de demi-pixels de place ce rang couvre, en profondeur
    for (let px = 0; px < W; px++) {
      const lat = ((px * 2 + 1) - 480) * d / C.f, X = C.X + lat * C.m, Y = C.Y - d * C.m;
      let c;
      if (d < 7) {
        // de près : le plan exact (bords nets, sans escaliers), le grain de la place, et des détails à la bonne taille
        const x = X / 2, y = Y / 2, T = (a, b) => estTerrePlace(plan, a, b);
        const terre = T(x, y), [mPl, kPl] = lire(X, Y);
        if (terre && (mPl === 'pierre' || mPl === 'joint')) c = R[mPl][kPl];
        else if (terre) {
          const p = fbm(x * 0.05, y * 0.05, G0 + 6);
          let k = p > 0.6 ? 4 : p < 0.24 ? 2 : 3;
          if (!T(x, y - 1)) k = 1; else if (!T(x, y - 2) || !T(x - 1, y)) k = Math.min(k, 2);
          const g = hachage(Math.floor(X * 0.9), Math.floor(Y * 0.9), 7611);
          if (g > 0.985) k = 5; else if (g > 0.965) k = 4; else if (g < 0.03) k = Math.max(1, k - 1);   // le gravier
          c = R.terre[k];
        } else {
          const p = fbm(x * 0.025, y * 0.025, G0 + 4);
          let k = p > 0.6 ? 4 : 3;
          if (T(x, y + 1)) k = 5; else if (T(x, y + 2)) k = 4;
          const b = hachage(px, Math.floor(sy / 3), 7612);
          if (b > 0.9) k = Math.min(5, k + 1); else if (b < 0.07) k -= 1;   // les brins
          const f = hachage(Math.floor(X / 3), Math.floor(Y / 3), 7613);
          c = f > 0.992 ? R.fleur[4] : f > 0.986 ? R.fleur2[4] : R.herbe[Math.max(0, k)];
        }
      } else {
        // au loin : la couleur moyenne de ce que le pixel couvre sur la place
        const n = Math.max(1, Math.min(10, Math.ceil(prof))); let rr = 0, gg = 0, bb = 0;
        for (let j = 0; j < n; j++) { const [m, k] = lire(X, Y - (j / n - 0.5) * prof * 2); const cc = R[m][k]; rr += cc >> 16; gg += (cc >> 8) & 255; bb += cc & 255; }
        c = (Math.round(rr / n) << 16) | (Math.round(gg / n) << 8) | Math.round(bb / n);
      }
      const a = Math.max(0, Math.min(0.4, (d - 6) / 45)), i = (py * W + px) * 4;
      img.data[i] = (c >> 16) * (1 - a) + brume[0] * a; img.data[i + 1] = ((c >> 8) & 255) * (1 - a) + brume[1] * a; img.data[i + 2] = (c & 255) * (1 - a) + brume[2] * a; img.data[i + 3] = 255;
    }
    yield py;
  }
  return { W, H, img, r0 };
}

// Un groupe de la place (un étal avec son marchand, le crieur...) photographié tel qu'il est ce matin, pour le poser au
// loin (la même texture est repeinte à chaque visite : les étals changent d'un jour à l'autre)
function instantanePlace(s, g, cle) {
  const W = 300, H = 300, ox = 150, oy = 280, [x, y, sc] = [g.x, g.y, g.scaleX];
  const dt = s.textures.exists(cle) ? s.textures.get(cle) : s.textures.addDynamicTexture(cle, W, H);
  dt.clear();
  g.setPosition(ox, oy).setScale(1); dt.draw(g); g.setPosition(x, y).setScale(sc);
  dt.oy = oy;
  return cle;
}
// Une palissade vue de près (le bout de la barrière gauche, à 2 m), peinte à demi-résolution à cette distance
function palissadePresHD(s, l, h, poteaux, rails) {
  const cle = 'palissadeMendiant'; if (s.textures.exists(cle)) return cle;
  const t = toileDecor(l, h);
  for (const [y0, e] of rails) planche(t, 0, y0, l, e, 'chene', { graine: 7620 + y0, noeuds: 2 });
  for (const [x0, e] of poteaux) { planche(t, x0, 0, e, h, 'chene', { horizontale: false, graine: 7630 + x0, noeuds: 1 }); for (let y = 0; y < h; y++) { t.poser(x0, y, 'chene', 4); t.poser(x0 + e - 1, y, 'chene', 1); } }
  t.contour(); t.texture(s, cle); return cle;
}

// L'eau de la fontaine vue d'à hauteur d'homme : des reflets qui dansent, le rideau de gouttes qui tombe de la vasque,
// les jets des deux lions, le petit jet du sommet ; tout est placé avec la même projection que la fontaine
function eauFontaineBasse(s, c, info) {
  const F = FONTAINE_RELIEF, P = info.projeter, Ri = F.R - F.rebord, [, v2, , vr2] = F.vasque;
  for (let k = 0; k < 6; k++) {
    const X = (hachage(k, 1, 913) - 0.5) * Ri * 1.3, Z = (hachage(k, 2, 914) - 0.5) * Ri * 0.9, q = P(X, F.hEau, Z);
    const r = s.add.ellipse(q.x, q.y, 0.4 * q.k, 2, 0xffffff, 0.45); c.add(r);
    s.tweens.add({ targets: r, alpha: 0.05, scaleX: 1.6, duration: 900 + k * 170, yoyo: true, repeat: -1, delay: k * 140 });
  }
  const ev = s.time.addEvent({ delay: 70, loop: true, callback: () => {
    if (!c.active) { ev.remove(); return; }
    // une goutte du rebord de la vasque (la moitié qui nous fait face), jusqu'à l'eau du bassin, à la verticale
    const phi = Math.PI * (0.08 + Math.random() * 0.84), X = Math.cos(phi) * (vr2 - 0.04), Z = -Math.sin(phi) * (vr2 - 0.04);
    const a = P(X, v2, Z), b = P(X, F.hEau, Z), g = s.add.circle(a.x, a.y, 1.4, 0xc8f0ff, 0.9); c.add(g);
    s.tweens.add({ targets: g, y: b.y, duration: 430 + Math.random() * 60, ease: 'Quad.easeIn', onComplete: () => {
      g.destroy(); if (!c.active || Math.random() > 0.3) return;
      const o = s.add.ellipse(b.x, b.y, 6, 2).setStrokeStyle(1, 0xe8fcff, 0.7); c.add(o);
      s.tweens.add({ targets: o, scaleX: 2.2, scaleY: 1.6, alpha: 0, duration: 420, onComplete: () => o.destroy() }); } });
    // les jets des lions, en arc, jusqu'à l'eau
    if (Math.random() < 0.6) for (const sens of [-1, 1]) {
      const m = P(sens * (F.col + 0.2), F.lion - 0.04, -0.03), e = P(sens * (0.95 + Math.random() * 0.15), F.hEau, -0.05), j = s.add.circle(m.x, m.y, 1.3, 0xd8f4ff, 0.95); c.add(j);
      s.tweens.add({ targets: j, x: e.x, duration: 360, ease: 'Linear' });
      s.tweens.add({ targets: j, y: e.y, duration: 360, ease: 'Quad.easeIn', onComplete: () => j.destroy() });
    }
    // le petit jet du sommet
    if (Math.random() < 0.4) { const h = P(0, F.boule[0] + F.boule[1], 0), j = s.add.circle(h.x, h.y, 1.1, 0xe8fcff, 0.95); c.add(j);
      s.tweens.add({ targets: j, x: j.x + (Math.random() - 0.5) * 16, duration: 520, ease: 'Linear' });
      s.tweens.add({ targets: j, y: h.y - 7, duration: 240, ease: 'Quad.easeOut', yoyo: true, onComplete: () => j.destroy() }); }
  } });
}

// Le décor complet de la vue du mendiant : le ciel et les collines, le sol, puis tout ce qui est debout, du plus loin
// au plus près, avec un voile de brume sur le lointain ; au premier plan, le bout de la barrière.
//   fontaine : { x, sol } le centre du bassin sur la place
function decorMendiantHD(s, saison, fontaine) {
  const c = s.add.container(0, 0), C = CAMERA_MENDIANT, pal = s.palettePlace, G = s.G;
  const fond = s.add.graphics(); c.add(fond); dessinerComte(fond, 0, 0, 960, C.y0 + 14, 'aube');
  const sol = solMendiantHD(s, saison);
  if (sol) c.add(s.add.image(0, s.textures.get(sol).r0 * 2, sol).setOrigin(0).setScale(2));
  const objets = [];
  const poser = (cle, X, Y, echellePlace, { oy = 1, ombre = 0, flip = false } = {}) => { const P = projeterMendiant(X, Y); if (P) objets.push({ d: P.d, P, cle, echellePlace, oy, ombre, flip }); };
  [['rueForgeHD', 110], ['rueImpasseHD', 300], ['rueBanqueHD', 470], ['rueBanqueHD', 1330], ['rueImpasseHD', 1500], ['rueForgeHD', 1690]].forEach(([k, x]) => { if (s.textures.exists(k)) poser(k, x, 160, 1.3); });
  [[70, 420, 0], [70, 760, 1], [1740, 420, 1], [420, 740, 1], [1390, 760, 0], [560, 200, 0], [1250, 200, 1]].forEach(([x, y, v]) => poser(arbrePlaceHD(s, pal, v), x, y, 2.2, { ombre: 120 }));
  const marcheDuJour = typeof jourDeMarche === 'function' && jourDeMarche(G);
  [[250, 760], [1520, 760], [700, 760], [1100, 760], ...(marcheDuJour ? [] : [[460, 470], [1340, 470]])].forEach(([x, y]) => poser(buissonPlaceHD(s, pal), x, y, 2.2, { ombre: 70 }));
  if (marcheDuJour) [[450, 486, false], [1350, 486, true]].forEach(([x, y, miroir]) => poser(charretteColporteurHD(s), x, y, 2.2, { ombre: 230, flip: miroir }));
  // les étals et les lieux, photographiés sur la place même, avec leurs marchands
  const faits = new Set();
  for (const g of s.place.list) {
    const k = g.cle; if (!k || faits.has(k) || k === 'mendiant' || !LIEUX_PLACE[k]) continue;
    faits.add(k);
    const [x, y] = LIEUX_PLACE[k], cle = instantanePlace(s, g, 'instantaneMendiant_' + k);
    poser(cle, x, y, 0.9, { oy: s.textures.get(cle).oy / 300, ombre: PETITS_LIEUX.includes(k) ? 90 : 200 });
  }
  // la fontaine, dessinée en relief avec la même caméra que le sol, et ses deux pots de fleurs
  const lat = (fontaine.x - C.X) / C.m, prof = (C.Y - fontaine.sol) / C.m;
  const fo = fontaineVueBasseHD(s, C, lat, prof);
  objets.push({ d: prof, fontaine: fo });
  for (const sens of [-1, 1]) poser(potFleursHD(s), fontaine.x + sens * 150, fontaine.sol + 50, 1.1, { flip: sens > 0 });
  objets.sort((a, b) => b.d - a.d);
  let voile = false;
  for (const o of objets) {
    if (!voile && o.d < 12) { voile = true; c.add(s.add.rectangle(480, 0, 960, projeterMendiant(0, C.Y - 12 * C.m).y + 2, 0xe8dcc4, 0.16).setOrigin(0.5, 0)); }
    if (o.fontaine) {
      // son ombre, portée à droite (le soleil vient de la gauche), puis la fontaine et son eau qui bouge
      const F = FONTAINE_RELIEF, P = o.fontaine.projeter, av = P(0.5, 0, -F.R), ar = P(0.5, 0, F.R), mi = P(0.5, 0, 0);
      c.add(s.add.image(mi.x + 4, (av.y + ar.y) / 2, ombrePlaceHD(s)).setScale((F.R + 0.3) * 2 * mi.k / 64, Math.max(4, av.y - ar.y + 6) / 24));
      c.add(s.add.image(o.fontaine.x, o.fontaine.y, o.fontaine.cle).setOrigin(0).setScale(2));
      eauFontaineBasse(s, c, o.fontaine);
      continue;
    }
    const sc = o.echellePlace * o.P.e;
    if (o.ombre) c.add(s.add.image(o.P.x + o.ombre * o.P.e * 0.05, o.P.y, ombrePlaceHD(s)).setScale(o.ombre * o.P.e / 64, o.ombre * o.P.e * 0.11 / 24));
    c.add(s.add.image(o.P.x, o.P.y, o.cle).setOrigin(0.5, o.oy).setScale(sc).setFlipX(o.flip));
  }
  // au premier plan, à gauche : le bout de la barrière, à 2 m (dessinée à cette distance, pas agrandie)
  const P = projeterMendiant(693, 1020), e = P.e, hP = 16 * 2.2 * e;
  const xd = Math.round(P.x + 6.6 * e), largeur = Math.ceil(xd / 2) + 1, haut = Math.round((P.y - hP) / 2);
  const poteaux = [[Math.round(P.x / 2), Math.round(6.6 * e / 2)], [Math.round(projeterMendiant(671, 1020).x / 2), Math.round(6.6 * e / 2)]].filter(([x]) => x > -20);
  const rails = [[Math.round(5 * 2.2 * e / 2), Math.round(2 * 2.2 * e / 2)], [Math.round(10 * 2.2 * e / 2), Math.round(2 * 2.2 * e / 2)]];
  c.add(s.add.image(0, haut * 2, palissadePresHD(s, largeur, 270 - haut, poteaux.map(([x, w]) => [Math.max(0, x), w]), rails)).setOrigin(0).setScale(2));
  return c;
}

// (v1.49) La palette du Comté selon la saison : l'herbe jaunit aux moissons, rougit aux brumes, blanchit au givre
function paletteSaisonComte(saison) {
  const b = PALETTES_REGIONS.comte, s = { ...b.sol };
  if (saison === 'moissons') Object.assign(s, { herbe: 0x94a84a, feuille: 0x6a8a32, fleur: 0xe8b030, fleur2: 0xf0e070 });
  else if (saison === 'brumes') Object.assign(s, { herbe: 0x8a9a52, feuille: 0xc06a2a, fleur: 0xd85a2a, fleur2: 0xe0a040, terre: 0xb89262 });
  else if (saison === 'givre') Object.assign(s, { herbe: 0xdce6ec, feuille: 0x9ab0a8, fleur: 0xffffff, fleur2: 0xc8d8e8, terre: 0xa89880, pierre: 0xb0aaa0 });
  return { ...b, nom: b.nom + ' ' + (saison || ''), sol: s };
}
