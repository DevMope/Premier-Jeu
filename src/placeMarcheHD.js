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
  const l = Math.max(tn.width, 80) + 22;
  o.push(s.add.image(x, y - (metier ? 18 : 10), planchetteHD(s, Math.round(l / 2), metier ? 22 : 14)).setScale(2).setDepth(prof + 0.1));
  o.push(tn);
  if (metier) { tn.setY(y - 14); o.push(s.add.text(x, y - 2, metier, style(11, '#fff4dc', { stroke: '#1a0e06', strokeThickness: 3 })).setOrigin(0.5, 1).setDepth(prof + 0.2)); }
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

// (v1.49) La palette du Comté selon la saison : l'herbe jaunit aux moissons, rougit aux brumes, blanchit au givre
function paletteSaisonComte(saison) {
  const b = PALETTES_REGIONS.comte, s = { ...b.sol };
  if (saison === 'moissons') Object.assign(s, { herbe: 0x94a84a, feuille: 0x6a8a32, fleur: 0xe8b030, fleur2: 0xf0e070 });
  else if (saison === 'brumes') Object.assign(s, { herbe: 0x8a9a52, feuille: 0xc06a2a, fleur: 0xd85a2a, fleur2: 0xe0a040, terre: 0xb89262 });
  else if (saison === 'givre') Object.assign(s, { herbe: 0xdce6ec, feuille: 0x9ab0a8, fleur: 0xffffff, fleur2: 0xc8d8e8, terre: 0xa89880, pierre: 0xb0aaa0 });
  return { ...b, nom: b.nom + ' ' + (saison || ''), sol: s };
}
