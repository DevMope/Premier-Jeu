// Planche à valider : le Grand Sage dans ses trois formes (humaine, mi-dragon, dragon serpentin).
// CE FICHIER N'EST PAS CHARGÉ PAR LE JEU (ni index.html ni web/jeu.html) : il ne sert qu'à dessiner la planche.
//
// - La forme humaine est celle du jeu, telle quelle (corpsHD 'sage', planche 32).
// - La forme mi-dragon part du même dessin (dessinerCorpsVue, costume 'sage') : le corps grandit, la peau se couvre
//   d'écailles bleu-violet, les yeux prennent la couleur du cristal, les cornes percent à côté de la couronne, la
//   moustache s'allonge en barbillons, la crinière blanche s'ébouriffe, une longue queue pousse, la robe se déchire ;
//   il porte la grande cape de fourrure de son exil. Un seul réglage `f` (0 : humain, 1 : mi-dragon) donne aussi les
//   étapes de la transformation.
// - Le dragon serpentin est dessiné en tubes (le corps, les pattes, la crinière, les barbillons) et sa tête de face ou
//   de trois-quarts. Ce qui survit d'une forme à l'autre : la couronne d'or aux pierres bleues (coincée entre les cornes),
//   le bleu du cristal (les yeux), le blanc de la barbe et des cheveux (barbillons, crinière), l'ivoire et l'or de la robe
//   (le ventre), le rouge de la cape (les nageoires et la crête), l'argent aux runes des avant-bras (les bracelets d'écailles).

const SF_RAMPES = {
  ecaille: [0x0c0a2e, 0x1a1a62, 0x242c8c, 0x2f44ae, 0x4a66c8, 0x7e98e0],   // (v2 : un bleu plus royal, plus foncé)
  ventre: [0x4a3a2a, 0x8a7458, 0xb8a27e, 0xd8c8a2, 0xece0c2, 0xfaf4e2],
  criniere: [0x34344c, 0x62627e, 0x9696ae, 0xc6c6d6, 0xe8e8f0, 0xffffff],
  corne: [0x221a2a, 0x4e4250, 0x82746e, 0xb4a48c, 0xdacdb0, 0xf4ecd6],
  oeilD: [0x0a3a4a, 0x187080, 0x30b0c8, 0x70e8f8, 0xb8f8ff, 0xffffff],
  gueule: [0x1a0408, 0x3a0a12, 0x6a1420, 0x962a30, 0xb84a48, 0xd87060],
  dent: [0x4a4038, 0x8a8070, 0xbab0a0, 0xe0d8c8, 0xf4eee2, 0xffffff],
  crete: [0x2a0608, 0x5a0e10, 0x8a1a18, 0xb02a22, 0xd04a34, 0xe8784c],
  orD: [0x3a2410, 0x7a4a14, 0xb07a1e, 0xd8a634, 0xf0cf5a, 0xfff0a8],
  pierre: [0x0c2a3a, 0x16507a, 0x2a86b8, 0x56c0e8, 0x9ce4f8, 0xe8fcff],
  argentD: [0x1e2230, 0x464c5e, 0x7a8294, 0xaab2c0, 0xd2d8e0, 0xf4f6fa],
  fourrure: [0x1e0608, 0x3e0c10, 0x601418, 0x821e20, 0xa2342c, 0xc0503c],
  col: [0x0c080e, 0x1a141e, 0x2a2230, 0x3e3446, 0x564a60, 0x74687e],
  ombreSol: [0x000000, 0x000000, 0x000000, 0x000000, 0x000000, 0x000000],
};
const SF_PROP_HUMAIN = { H: 64, ep: 9, torse: 22, rx: 8.4, ry: 9, membre: 1 };
const SF_PROP_DRAGON = { H: 90, ep: 15.5, torse: 31, rx: 11.2, ry: 11.4, membre: 1.85 };

// --- Petits outils ---
const sfLerp = (a, b, f) => a + (b - a) * f;
const sfLisse = f => f <= 0 ? 0 : f >= 1 ? 1 : f * f * (3 - 2 * f);
const sfEntre = (f, a, b) => sfLisse((f - a) / (b - a));
function sfHash(x, y, g = 0) { return hachage(Math.floor(x), Math.floor(y), g); }
function sfToile(l, h, { cel = false, relief = true } = {}) { const t = new ToileHD(l, h); Object.assign(t.rampes, SF_RAMPES); t.cel = cel; t.relief = relief; return t; }
// Une courbe de Bézier cubique, en n points
function sfBezier(p0, p1, p2, p3, n = 24) {
  const pts = [];
  for (let i = 0; i <= n; i++) { const u = i / n, v = 1 - u;
    pts.push([v * v * v * p0[0] + 3 * v * v * u * p1[0] + 3 * v * u * u * p2[0] + u * u * u * p3[0], v * v * v * p0[1] + 3 * v * v * u * p1[1] + 3 * v * u * u * p2[1] + u * u * u * p3[1]]); }
  return pts;
}
// Plusieurs Béziers bout à bout (chaque morceau : [c1, c2, fin]), depuis p0
function sfChemin(p0, morceaux, n = 20) {
  let pts = [p0], a = p0;
  for (const [c1, c2, b] of morceaux) { pts = pts.concat(sfBezier(a, c1, c2, b, n).slice(1)); a = b; }
  return pts;
}

// Un tube le long d'une ligne brisée : pour chaque pixel, le point le plus proche de l'axe, l'abscisse s (0 à L), la
// position u (0 à 1), le côté o (-1 à 1, signé : à gauche ou à droite du sens de marche) et la normale d'un cylindre.
function sfTube(pts, rayon) {
  const R = typeof rayon === 'function' ? rayon : () => rayon;
  const seg = []; let L = 0;
  for (let i = 0; i < pts.length - 1; i++) { const [ax, ay] = pts[i], [bx, by] = pts[i + 1], l = Math.hypot(bx - ax, by - ay) || 0.001; seg.push({ ax, ay, bx, by, l, s0: L }); L += l; }
  let rmax = 0; for (let i = 0; i <= 40; i++) rmax = Math.max(rmax, R(i / 40));
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  const info = (x, y, marge = 0) => {
    const px = x + 0.5, py = y + 0.5, m = rmax + marge + 1;
    if (px < x0 - m || px > x1 + m || py < y0 - m || py > y1 + m) return null;
    let best = null;
    for (const g of seg) {
      const dx = g.bx - g.ax, dy = g.by - g.ay;
      const t = Math.max(0, Math.min(1, ((px - g.ax) * dx + (py - g.ay) * dy) / (g.l * g.l)));
      const qx = g.ax + t * dx, qy = g.ay + t * dy, d2 = (px - qx) * (px - qx) + (py - qy) * (py - qy);
      if (!best || d2 < best.d2) best = { d2, s: g.s0 + t * g.l, g, qx, qy };
    }
    const u = best.s / L, r = Math.max(0.3, R(u)), d = Math.sqrt(best.d2);
    if (d > r + marge) return null;
    const g = best.g, tx = (g.bx - g.ax) / g.l, ty = (g.by - g.ay) / g.l;
    const cote = Math.sign(tx * (py - best.qy) - ty * (px - best.qx)) || 1;
    const nx = (px - best.qx) / r, ny = (py - best.qy) / r;
    return { n: [nx, ny, Math.sqrt(Math.max(0.03, 1 - nx * nx - ny * ny))], s: best.s, u, o: cote * Math.min(1, d / r), d, r, tx, ty, dedans: d <= r };
  };
  return { info, L, pts, R };
}
// Une forme dont la fonction rend une « info » (avec sa normale n) : le motif reçoit l'info du pixel
function sfForme(t, mat, fInfo, { garder = null, motif = null, ...reste } = {}) {
  const cache = new Map();
  t.forme(mat, (x, y) => { const i = fInfo(x, y); if (!i || (garder && !garder(i, x, y))) return null; cache.set(y * t.l + x, i); return i.n; },
    { ...reste, motif: motif ? (x, y) => motif(cache.get(y * t.l + x), x, y) : null });
}
// Un tube posé tel quel (les cornes, les barbillons, les mèches)
function sfTubeForme(t, mat, pts, rayon, opts = {}) { const tb = sfTube(pts, rayon); sfForme(t, mat, (x, y) => tb.info(x, y), { garder: i => i.dedans, ...opts }); return tb; }
// Les écailles sur un tube : des rangées décalées d'écailles rondes qui se recouvrent (bord sombre côté queue)
function sfMotifEcailles(pas = 5, large = 5, force = 1) {
  return i => { if (!i) return 0;
    const v = Math.asin(Math.max(-1, Math.min(1, i.o))) * i.r;
    const a = i.s / pas, ra = Math.floor(a), fa = a - ra;
    const b = v / large + (ra % 2) * 0.5, fb = b - Math.floor(b) - 0.5;
    if (fa > 0.78 - 1.6 * fb * fb) return -1.1 * force;
    if (fa < 0.3 && Math.abs(fb) < 0.22) return 0.35 * force;
    return 0; };
}
// Les plaques du ventre : de larges bandes en travers, un joint sombre, un filet d'or tous les quelques joints
function sfMotifVentre(pas = 6) { return i => { if (!i) return 0; const f = (i.s / pas) % 1; return f < 0.16 ? -1.2 : f < 0.32 ? 0.35 : 0; }; }
// La fourrure : des mèches verticales de longueurs inégales, des pointes plus claires
function sfMotifFourrure(x, y, g = 12) {
  const col = Math.floor(x), dec = sfHash(col, 0, g) * 7, seg = Math.floor((y + dec) / 6), pos = ((y + dec) % 6) / 6;
  const v = sfHash(col, seg, g + 1);
  return (v > 0.72 ? 0.8 : v < 0.22 ? -0.9 : 0) + (pos > 0.8 ? -0.5 : pos < 0.2 ? 0.3 : 0);
}
// Efface des pixels : sur une toile du rig, ce qui était dessous réapparaît ; puis le contour qui les entourait, s'il ne
// borde plus rien, s'en va
function sfEffacer(t, test) {
  const ot = new Set();
  for (let y = 0; y < t.h; y++) for (let x = 0; x < t.l; x++) { const i = y * t.l + x; if (t.c[i] !== null && t.m[i] && test(x, y, i)) ot.add(i); }
  for (const i of ot) {
    const pile = t.rig && t.rig.px[i];
    while (pile && pile.length && test(i % t.l, Math.floor(i / t.l), i, pile[pile.length - 1].mat)) pile.pop();
    const h = pile && pile[pile.length - 1];
    if (h && t.rampes[h.mat]) { t.c[i] = t.rampes[h.mat][h.k]; t.m[i] = h.mat; t.k[i] = h.k; } else { t.c[i] = null; t.m[i] = null; }
  }
  const pres = i => { const x = i % t.l, y = Math.floor(i / t.l); for (const j of ot) { const dx = Math.abs(j % t.l - x), dy = Math.abs(Math.floor(j / t.l) - y); if (dx <= 3 && dy <= 3) return true; } return false; };
  const cand = []; for (let i = 0; i < t.c.length; i++) if (t.c[i] !== null && !t.m[i] && pres(i)) cand.push(i);
  for (const i of cand) { const x = i % t.l, y = Math.floor(i / t.l); let voisin = false;
    for (let dy = -2; dy <= 2 && !voisin; dy++) for (let dx = -2; dx <= 2; dx++) { const X = x + dx, Y = y + dy; if (t.dans(X, Y) && t.m[Y * t.l + X]) { voisin = true; break; } }
    if (!voisin) t.c[i] = null; }
}
// Un contour sombre d'un ou deux tours autour de tout ce qui est dessiné
function sfContour(t, tours = 2) { contourEpais(t, tours); }
// Colle la toile b sur a, décalée de (ox, oy) : les pixels non vides de b recouvrent a (garder(x, y, idx) pour trier)
function sfColler(a, b, ox = 0, oy = 0, garder = null) {
  for (let y = 0; y < b.h; y++) for (let x = 0; x < b.l; x++) {
    const i = y * b.l + x; if (b.c[i] === null || (garder && !garder(x, y, i))) continue;
    const X = x + ox, Y = y + oy; if (!a.dans(X, Y)) continue;
    const j = Y * a.l + X; a.c[j] = b.c[i]; a.m[j] = b.m[i]; a.k[j] = b.k[i];
  }
}

// =====================================================================================================================
// 1. Le Sage qui se transforme : f = 0 (humain) … 1 (mi-dragon)
//    vue : 'face' ou 'troisQuarts' ; exil : la grande cape de fourrure (sinon sa cape d'écailles rouges) ;
//    rage : les bras jetés en l'air, la gueule ouverte, sans bâton
// =====================================================================================================================
function sageTransformeHD(f = 1, vue = 'face', { exil = true, rage = false, baton = true, garderTaille = false, couverture = null } = {}) {
  const modeleBaton = baton === 'auto' ? (f < 0.6 ? 'serres' : 'bois') : typeof baton === 'string' ? baton : null;
  const k = FINESSE;
  const sp = specCorps('sage', null, vue);
  const fe = sfLisse(f);
  // les proportions et les traits de l'étape
  const P = {}; for (const c in SF_PROP_HUMAIN) P[c] = sfLerp(SF_PROP_HUMAIN[c], SF_PROP_DRAGON[c], garderTaille ? 0 : fe);
  P.H = Math.round(P.H);   // (la hauteur de la toile doit tomber juste)
  const race = 'sageEtape' + Math.round(f * 100) + (rage ? 'r' : '') + (garderTaille ? 't' : '') + (couverture !== null ? 'c' : '');
  PROPORTIONS[race] = P;
  TRAITS_PEUPLES[race] = { ...(f > 0.12 ? { yeux: 0x70e8f8 } : {}), ...(f > 0.3 ? { fente: true } : {}), ...(f > 0.55 ? { dents: 'crocs' } : {}),
    ...(f > 0.4 ? { griffes: true } : {}), ...(f > 0.72 ? { grandesMains: true } : {}), ...(f > 0.5 ? { sourcil: 1.5 } : {}) };
  const gene = { ...sp.gene, race };
  const margeL = Math.round(sfLerp(0, 15, fe) * k) + (rage ? 14 * k : 0);
  const opts = { ...sp.options, rig: true, margeL, fache: f > 0.45 || rage, ...(modeleBaton && !rage ? { margeHaut: 30 * k } : {}) };
  if (f > 0.6 && !rage) opts.boucheForcee = 3;
  if (rage) {
    opts.baille = true;
    opts.membres = { brasP: (A) => ({ coude: [A.cote * (A.ep + 9 * k), 2 * k, A.yT - 1 * k], main: [A.cote * (A.ep + 13 * k), 3 * k, A.yT - 15 * k] }),
      brasL: (A) => ({ coude: [A.cote * (A.ep + 8 * k), 1 * k, A.yT + 5 * k], main: [A.cote * (A.ep + 17 * k), 1 * k, A.yT + 13 * k] }) };
  }
  const b = dessinerCorpsVue(gene, sp.tenue, 'sage', 0, rage ? 'stupeur' : null, vue, opts);
  // la partie du corps de chaque pixel (le haut de la pile du rig)
  const partie = i => { const p = b.rig && b.rig.px[i]; return p && p.length ? p[p.length - 1].part : null; };
  // (v2) où est le bâton du jeu, avant de l'effacer : le nouveau prend sa place
  const bb0 = { x0: 1e9, x1: -1e9, y1: -1e9 }; for (let i = 0; i < b.c.length; i++) if (b.m[i] === 'batonS') { const x = i % b.l, y = Math.floor(i / b.l); bb0.x0 = Math.min(bb0.x0, x); bb0.x1 = Math.max(bb0.x1, x); bb0.y1 = Math.max(bb0.y1, y); }
  if (!baton || rage || modeleBaton) sfEffacer(b, (x, y, i, mat) => ['batonS', 'canne'].includes(mat || b.m[i]) || ((mat || b.m[i]) === 'cristal' && y < b.reperes.yT - 4 * k));
  const rep = b.reperes, cy = rep.cy, yT = rep.yT, yB = rep.yB;
  let sol = 0; for (let i = 0; i < b.c.length; i++) if (b.c[i] !== null) sol = Math.floor(i / b.l);
  // les repères tirés du dessin : le visage, la couronne, les yeux, la bouche
  const bb = () => ({ x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9, n: 0, sx: 0, sy: 0 });
  const ajoute = (B, x, y) => { B.x0 = Math.min(B.x0, x); B.y0 = Math.min(B.y0, y); B.x1 = Math.max(B.x1, x); B.y1 = Math.max(B.y1, y); B.n++; B.sx += x; B.sy += y; };
  const visage = bb(), couronne = bb(), tete = bb(), barbe = bb(), lin = bb(), yeux = [];
  for (let y = 0; y < b.h; y++) for (let x = 0; x < b.l; x++) {
    const i = y * b.l + x, m = b.m[i], p = partie(i); if (!m) continue;
    if (p === 'tete') { ajoute(tete, x, y); if (m === 'peau') ajoute(visage, x, y); if (m === 'or' || (m === 'cristal' && y < cy)) ajoute(couronne, x, y); if (m === 'barbe') ajoute(barbe, x, y);
      if (m === 'iris' || m === 'pupille' && y > cy - 4 * k && y < cy + 4 * k) { let o = yeux.find(e => Math.abs(e.x - x) < 4 * k); if (!o) yeux.push(o = { x, y, n: 0, sx: 0, sy: 0 }); o.n++; o.sx += x; o.sy += y; o.x = o.sx / o.n; o.y = o.sy / o.n; } }
    if (m === 'lin') ajoute(lin, x, y);
  }
  const fcx = (visage.x0 + visage.x1) / 2, oeilY = yeux.length ? yeux.reduce((a, e) => a + e.y, 0) / yeux.length : cy;
  const moustacheY = Math.min(barbe.y0 + 3.2 * k, oeilY + 4.5 * k);
  // --- la peau qui se couvre d'écailles (depuis les tempes, les joues et le dos des mains) ---
  const peau = b.rampes.peau, ec = SF_RAMPES.ecaille, cov = couverture ?? sfLerp(-0.2, 1.25, sfEntre(f, 0.08, 0.95));
  for (let y = 0; y < b.h; y++) for (let x = 0; x < b.l; x++) {
    const i = y * b.l + x; if (b.m[i] !== 'peau') continue;
    const p = partie(i), surVisage = p === 'tete';
    const dc = surVisage ? Math.hypot((x - fcx) / ((visage.x1 - visage.x0) / 2 + 1), (y - oeilY) / ((visage.y1 - visage.y0) / 2 + 1)) : 1;
    const n = fbm(x * 0.21, y * 0.21, 7) * 0.7 + (1 - Math.min(1, dc)) * 0.55;
    if (f >= 0.999 || n < cov) {
      // une écaille : des rangées décalées, le bas de chaque écaille plus sombre
      const r = Math.floor(y / 2), cx2 = (x + (r % 2) * 1.5) / 3, bord = (y % 2 === 1) && (Math.abs(cx2 - Math.floor(cx2) - 0.5) < 0.34);
      let kk = b.k[i] + (bord ? -1 : 0) + (f > 0.5 && !surVisage && (x + y) % 5 === 0 ? 1 : 0);
      if (surVisage && dc < 0.45 && f > 0.5) kk = b.k[i];   // (le milieu du visage reste lisible : les écailles y sont fines)
      kk = Math.max(0, Math.min(5, kk));
      b.c[i] = ec[kk]; b.m[i] = 'ecaille'; b.k[i] = kk;
    } else if (n < cov + 0.12) { const kk = Math.max(0, b.k[i] - 1); b.c[i] = ec[Math.min(5, kk + 2)]; }   // (le bord des plaques : une teinte bleutée)
  }
  // --- les yeux : la couleur du cristal, de plus en plus vive ---
  for (let i = 0; i < b.c.length; i++) {
    if (b.m[i] === 'iris' && f > 0.12) { const kk = Math.min(5, b.k[i] + (f > 0.6 ? 1 : 0)); b.c[i] = SF_RAMPES.oeilD[kk]; }
    if (b.m[i] === 'blanc' && f > 0.25 && partie(i) === 'tete') b.c[i] = SF_RAMPES.oeilD[5];
  }
  // --- la cape : sa cape d'écailles rouges, ou la grande cape de fourrure de l'exil (des mèches, un bas effiloché) ---
  if (exil) for (let y = 0; y < b.h; y++) for (let x = 0; x < b.l; x++) {
    const i = y * b.l + x; if (b.m[i] !== 'cape') continue;
    if (y > sol - 3 * k - sfHash(x / 2, 0, 3) * 4 * k) { b.c[i] = null; b.m[i] = null; continue; }   // le bas effiloché
    const pile = b.rig.px[i], n = pile && pile.length && pile[pile.length - 1].n;
    const lum = n ? n[0] * LUMIERE[0] + n[1] * LUMIERE[1] + n[2] * LUMIERE[2] : 0;
    const kk = Math.max(0, Math.min(5, Math.round(1.2 + (lum + 0.15) * 3.6 - 0.9 + sfMotifFourrure(x, y))));
    b.c[i] = SF_RAMPES.fourrure[kk]; b.m[i] = 'fourrure'; b.k[i] = kk;
  }
  // --- la robe qui se déchire : le bas en lambeaux ; sur la poitrine, l'ivoire devient les plaques du ventre ---
  const dechire = sfEntre(f, 0.45, 1) * 9 * k;
  if (dechire > 0) for (let y = 0; y < b.h; y++) for (let x = 0; x < b.l; x++) {
    const i = y * b.l + x, m = b.m[i]; if (m !== 'habit' && m !== 'lin' && m !== 'or') continue;
    if (y < yB + 4 * k) continue;
    const h = dechire * (0.35 + 0.65 * Math.abs(Math.sin(x * 0.42 + sfHash(x / 3, 1, 5) * 3)));
    if (y > sol - h) { b.c[i] = null; b.m[i] = null; }
  }
  if (f > 0.62) for (let y = 0; y < b.h; y++) for (let x = 0; x < b.l; x++) {
    const i = y * b.l + x; if (b.m[i] !== 'lin' || y > yB - 1 * k) continue;
    const joint = (y - lin.y0) % 5 === 0, kk = Math.max(0, Math.min(5, b.k[i] + (joint ? -2 : 0)));
    b.c[i] = SF_RAMPES.ventre[kk]; b.m[i] = 'ventre'; b.k[i] = kk;
  }
  // la toile finale : de la place pour la queue, les cornes, la crinière
  const PX = Math.round(sfLerp(4, 40, fe) * k) + (rage ? 10 * k : 0), PH = Math.round(sfLerp(0, 22, sfEntre(f, 0.25, 1)) * k);
  const W = b.l + 2 * PX, H = b.h + PH;
  const ox = PX, oy = PH, X = x => x + ox, Y = y => y + oy;
  const cxB = X(b.l / 2), solF = Y(sol);
  const dir = vue === 'troisQuarts' ? 1 : 0;   // (de trois-quarts, il regarde vers la droite)
  const T = sfToile(W, H, { cel: true }), arriere = sfToile(W, H, { cel: true }), milieu = sfToile(W, H, { cel: true }), avant = sfToile(W, H, { cel: true }), fins = sfToile(W, H, { cel: true });
  fins.relief = false;
  // --- derrière : la queue, la crinière, la corne du fond ---
  const tq = sfEntre(f, 0.4, 1);
  if (tq > 0) {
    const cote = dir ? -1 : 1, hx = cxB + cote * (P.ep * 0.2) * k, hy = Y(yB) + 6 * k;
    const longueur = tq * 44 * k, ex = hx + cote * longueur * 0.95;
    const pts = sfChemin([hx, hy], [[[hx + cote * 6 * k, hy + 16 * k], [hx + cote * longueur * 0.4, solF - 2 * k], [hx + cote * longueur * 0.7, solF - 5 * k]],
      [[hx + cote * longueur * 0.9, solF - 7 * k], [ex + cote * 6 * k, solF - 12 * k - tq * 6 * k], [ex - cote * 2 * k, solF - 20 * k * tq - 4 * k]]], 18);
    const r0 = sfLerp(2.5, 7.5, tq) * k;
    const tb = sfTube(pts, u => r0 * (1 - u * 0.8));
    // les épines du dos de la queue (sombres), puis la queue, son dessous ivoire, la touffe blanche du bout
    sfForme(arriere, 'col', (x, y) => { const i = tb.info(x, y, 3 * k); if (!i || i.dedans || i.o > 0 || i.u > 0.85) return null; const pic = 1 - ((i.s / (3.5 * k)) % 1); return i.d - i.r < pic * 2.6 * k * (1 - i.u * 0.6) ? i : null; }, { decalage: 0.4 });
    sfForme(arriere, 'ecaille', (x, y) => tb.info(x, y), { garder: i => i.dedans && i.o < 0.45, motif: sfMotifEcailles(2.6 * k, 2.4 * k, 0.8), decalage: 0.1 });
    sfForme(arriere, 'ventre', (x, y) => tb.info(x, y), { garder: i => i.dedans && i.o >= 0.45, motif: sfMotifVentre(2.4 * k), decalage: 0.2 });
    if (tq > 0.6) for (let m = 0; m < 7; m++) { const [bx, by] = pts[pts.length - 1], a = -Math.PI / 2 + (m - 3) * 0.32 - cote * 0.3;
      sfTubeForme(arriere, 'criniere', sfBezier([bx, by], [bx + Math.cos(a) * 4 * k, by + Math.sin(a) * 4 * k], [bx + Math.cos(a + 0.4) * 8 * k, by + Math.sin(a + 0.4) * 8 * k], [bx + Math.cos(a + 0.7) * 11 * k * tq, by + Math.sin(a + 0.7) * 11 * k * tq], 10), u => 1.6 * k * (1 - u * 0.85), { decalage: 0.3 }); }
  }
  // la crinière : des mèches blanches qui se hérissent autour de la tête et tombent dans le dos
  const tc = sfEntre(f, 0.45, 1);
  const hcx = X((tete.x0 + tete.x1) / 2), hcy = Y(cy), hrx = (tete.x1 - tete.x0) / 2, hry = (Y(barbe.y0) - Y(tete.y0)) * 0.55 + 2 * k;
  if (tc > 0) for (let m = 0; m < 15; m++) {
    const a = Math.PI * (-0.05 - m / 14 * 0.9) + (dir ? -0.25 : 0), cos = Math.cos(a), sin = Math.sin(a);
    if (Math.abs(sin) > 0.97) continue;
    const bx = hcx + cos * hrx * 0.8, by = hcy + sin * hry * 0.7 - 2 * k, lg = (9 + (m % 3) * 3) * k * tc;
    const ax = cos * (cos > 0 ? 1 : 1), ay = sin * 0.6 + 0.6;
    sfTubeForme(arriere, 'criniere', sfBezier([bx, by], [bx + ax * lg * 0.4, by + ay * lg * 0.2 - 3 * k], [bx + ax * lg * 0.8, by + ay * lg * 0.6], [bx + ax * lg * 1.05, by + ay * lg + 4 * k], 10), u => 2.2 * k * (1 - u * 0.8), { decalage: 0.2 + (m % 2) * 0.3 });
  }
  // --- les cornes : deux bois qui percent à côté de la couronne, montent, s'écartent et se recourbent ---
  const tcorne = sfEntre(f, 0.28, 1);
  const corne = (toile, cote, base, ech, ecart = 1, avance = 0) => {   // (v2 : ecart < 1 et avance : la corne vue de trois-quarts, tournée avec la tête)
    const [bx, by] = base, l = tcorne * 22 * k * ech, cx0 = cote;
    cote = cote * ecart;
    if (l < 1.5 * k) { fins.forme('corne', ellipsoide(bx, by - 0.3 * k, 1.1 * k, 0.9 * k), { decalage: 0.6 }); return; }
    const pts = sfBezier([bx, by], [bx + cote * l * 0.35 + avance * l * 0.15, by - l * 0.25], [bx + cote * l * 0.75 + avance * l * 0.5, by - l * 0.55], [bx + cote * l * 0.6 + avance * l * 0.8, by - l * 1.05], 18);
    const tb = sfTubeForme(toile, 'corne', pts, u => (2.6 * k * ech) * (1 - u * 0.75) + 0.4, { decalage: 0.25, motif: i => (i && (i.s / (2.2 * k)) % 1 < 0.22 && i.u < 0.7 ? -0.8 : 0) });
    if (tcorne > 0.6) { const [qx, qy] = pts[8]; sfTubeForme(toile, 'corne', sfBezier([qx, qy], [qx + cote * 3 * k, qy - 1 * k], [qx + cote * 6 * k, qy - 3 * k], [qx + cote * 7 * k * ech, qy - 7 * k * ech], 10), u => 1.5 * k * ech * (1 - u * 0.7) + 0.4, { decalage: 0.35 }); }
    return tb;
  };
  const cg = [X(couronne.x0) + 1 * k, Y(couronne.y1) - 0.5 * k], cd = [X(couronne.x1) - 1 * k, Y(couronne.y1) - 0.5 * k];
  if (tcorne > 0) {
    if (dir) { corne(avant, -1, [X(tete.x0) + 2 * k, cg[1] - 0.5 * k], 1.05, 0.95, 0); corne(arriere, 1, [X(couronne.x1) - 3 * k, cg[1] - 3 * k], 0.8, 0.6, -0.1); }   // (v3 : la tempe proche à gauche, la tempe éloignée derrière la tête)
    else { corne(avant, -1, cg, 1); corne(avant, 1, cd, 1); }
  }
  // --- la grande cape de fourrure de l'exil : elle tombe des épaules jusqu'au sol, plus large que lui, et s'évase ---
  if (exil) {
    const ccx = cxB - dir * 4 * k, wH = (P.ep + 4) * k, wB = (P.ep + 9 + fe * 7) * k, yH = Y(yT) - 2 * k, yS = solF + 1 * k;
    arriere.forme('fourrure', (x, y) => {
      if (y < yH || y > yS) return null;
      const v = (y - yH) / (yS - yH), w = wH + (wB - wH) * Math.pow(v, 0.75), dx = (x + 0.5 - ccx) / w;
      if (Math.abs(dx) > 1) return null;
      if (y > yS - sfHash(x / 2, 5, 11) * 4 * k - Math.abs(Math.sin(x * 0.45)) * 2 * k) return null;   // le bas effiloché
      return [dx * 0.9, -0.15, Math.sqrt(Math.max(0.05, 1 - 0.81 * dx * dx))];
    }, { decalage: -0.5, motif: sfMotifFourrure });
    // le haut col de fourrure : il couvre les épaules et monte derrière la tête, jusqu'aux oreilles
    const largeur = (P.ep + 7 + fe * 3) * k, ccy = Y(yT) + 1 * k, haut = (11 + fe * 7) * k, bas = (7 + fe * 4) * k, ccx2 = cxB - dir * 1.5 * k;
    milieu.forme('fourrure', (x, y) => {
      const dx = (x + 0.5 - ccx2) / largeur; if (Math.abs(dx) > 1) return null;
      const touffe = (Math.abs(Math.sin(x * 0.7)) * 1.6 + sfHash(x / 2, 2, 9) * 1.8) * k;
      const yb = ccy + bas * Math.sqrt(1 - dx * dx) + touffe, yh = ccy - haut * Math.sqrt(Math.max(0, 1 - Math.pow(Math.abs(dx), 2.4))) - touffe * 0.5;
      if (y < yh || y > yb) return null;
      return [dx * 0.85, (y - (yh + yb) / 2) / ((yb - yh) / 2 + 1) * 0.7, 0.55];
    }, { decalage: 0.9, motif: (x, y) => sfMotifFourrure(x, y, 30) * 1.3 });
  }
  // --- les pieds griffus qui sortent de la robe déchirée ---
  const tp = sfEntre(f, 0.5, 1);
  if (tp > 0) for (const cote of [-1, 1]) {
    const px = cxB + cote * (P.ep * 0.42) * k + (dir ? 2 * k : 0), py = solF - 1.5 * k, lp = sfLerp(3, 6, tp) * k;
    milieu.forme('ecaille', ellipsoide(px, py - lp * 0.35, lp, lp * 0.55), { decalage: 0.1 });
    for (const g of [-1, 0, 1]) { const gx = px + g * lp * 0.62 + (dir ? lp * 0.4 : 0), gy = py + 0.5 * k;
      sfTubeForme(milieu, 'corne', sfBezier([gx, gy - 1.5 * k], [gx + g * 1 * k + (dir ? 1.5 * k : 0), gy - 0.5 * k], [gx + g * 1.5 * k + (dir ? 2.5 * k : 0), gy + 0.5 * k], [gx + g * 2 * k + (dir ? 3.5 * k : 0), gy + 1 * k], 6), u => 1.1 * k * (1 - u * 0.6) + 0.3, { decalage: 0.5 }); }
  }
  // (v2) de face, le bas du visage s'arrondit : des bajoues et une mâchoire d'écailles par-dessus les coins carrés
  if (!dir && f > 0.6) {
    const jy = Y(oeilY) + 3.2 * k, rx = 2.6 * k * sfEntre(f, 0.6, 1);
    for (const cote of [-1, 1]) avant.forme('ecaille', ellipsoide(X(cote < 0 ? visage.x0 : visage.x1) + cote * 0.9 * k, jy, rx, 3.4 * k), { decalage: cote < 0 ? 0.1 : -0.3, motif: (x, y) => ((y % 2 === 1) && (Math.abs(((x + (Math.floor(y / 2) % 2) * 1.5) / 3) % 1 - 0.5) < 0.34) ? -1 : 0) });
  }
  // --- devant : les barbillons (la moustache qui s'allonge), la fêlure de la couronne ---
  const tb2 = sfEntre(f, 0.42, 1);
  if (tb2 > 0) for (const cote of [-1, 1]) {
    if (dir && cote < 0) continue;
    const bx = (dir ? X(visage.x1) - 1 * k : X(cote < 0 ? visage.x0 : visage.x1) + cote * 1.5 * k), by = Y(moustacheY) + (dir ? 0 : 1 * k), l = tb2 * 30 * k;
    const c2 = dir ? 1 : cote;
    // (le barbillon part du coin de la moustache, file loin vers l'extérieur en remontant un peu, puis retombe en ondulant)
    const chemin = rage ? [[[bx + c2 * l * 0.3, by - 1 * k], [bx + c2 * l * 0.55, by - l * 0.15], [bx + c2 * l * 0.6, by - l * 0.4]], [[bx + c2 * l * 0.65, by - l * 0.6], [bx + c2 * l * 0.9, by - l * 0.55], [bx + c2 * l * 1.0, by - l * 0.8]]]
      : dir ? [[[bx + c2 * l * 0.35, by - 3 * k], [bx + c2 * l * 0.7, by - 3 * k], [bx + c2 * l * 0.85, by + l * 0.18]], [[bx + c2 * l * 0.95, by + l * 0.35], [bx + c2 * l * 0.8, by + l * 0.5], [bx + c2 * l * 0.95, by + l * 0.72]]]
      : [[[bx + c2 * l * 0.2, by - 2 * k], [bx + c2 * l * 0.36, by + l * 0.04], [bx + c2 * l * 0.34, by + l * 0.3]], [[bx + c2 * l * 0.32, by + l * 0.52], [bx + c2 * l * 0.44, by + l * 0.66], [bx + c2 * l * 0.34, by + l * 0.95]]];   // (v2 : le long de la barbe, pas devant la bouche)
    sfTubeForme(fins, 'criniere', sfChemin([bx, by], chemin, 16), u => 0.8 * k * (1 - u * 0.65) + 0.25, { decalage: 0.6, ombre: false });
    if (dir) sfTubeForme(fins, 'criniere', sfChemin([bx - 3 * k, by + 1 * k], [[[bx + l * 0.05, by + l * 0.1], [bx + l * 0.25, by + l * 0.18], [bx + l * 0.3, by + l * 0.4]], [[bx + l * 0.34, by + l * 0.6], [bx + l * 0.5, by + l * 0.7], [bx + l * 0.48, by + l * 0.9]]], 16), u => 0.7 * k * (1 - u * 0.65) + 0.25, { decalage: 0.2, ombre: false });
  }
  // la gueule : deux crocs d'ivoire qui dépassent de la moustache ; en rage, la gueule grande ouverte
  if (f > 0.55) {
    const gx = X(fcx) + (dir ? 2.5 * k : 0), gy = Y(moustacheY) + 1.5 * k;
    if (rage) {
      fins.forme('gueule', ellipsoide(gx, gy + 2.6 * k, 3.6 * k, 3 * k), { decalage: -0.8, ombre: false });
      fins.forme('gueule', ellipsoide(gx, gy + 3.6 * k, 2 * k, 1.4 * k), { decalage: 0.6, ombre: false, bord: false });   // (la langue)
      for (const cote of [-1, 1]) {
        fins.forme('dent', (x, y) => { const dy = y + 0.5 - gy, dx = Math.abs(x + 0.5 - (gx + cote * 2.1 * k)); return dy > 0 && dy < 2.6 * k && dx < 0.9 * k * (1 - dy / (2.6 * k)) + 0.3 ? [0, 0, 1] : null; }, { decalage: 0.4, ombre: false, bord: false });
        fins.forme('dent', (x, y) => { const dy = gy + 5.4 * k - (y + 0.5), dx = Math.abs(x + 0.5 - (gx + cote * 2.3 * k)); return dy > 0 && dy < 1.9 * k && dx < 0.7 * k * (1 - dy / (1.9 * k)) + 0.3 ? [0, 0, 1] : null; }, { decalage: 0.2, ombre: false, bord: false });
      }
    } else for (const cote of [-1, 1]) {
      if (dir && cote < 0) continue;
      fins.forme('dent', (x, y) => { const dy = y + 0.5 - gy, dx = Math.abs(x + 0.5 - (gx + cote * 2 * k)); return dy > 0 && dy < 2.2 * k && dx < 0.8 * k * (1 - dy / (2.2 * k)) + 0.3 ? [0, 0, 1] : null; }, { decalage: 0.4, ombre: false, bord: false });
    }
  }
  // --- la toile finale, couche par couche ---
  sfContour(arriere, 2); sfContour(milieu, 2); sfContour(avant, 2); fins.contour();
  sfColler(T, arriere);
  sfColler(T, b, ox, oy);
  // ce qui passe devant le col de fourrure : la tête, les mains, le bâton, les avant-bras
  const devant = (x, y, i) => { const p = partie(i), m = b.m[i]; return p === 'tete' || p === 'mainP' || p === 'mainL' || m === 'batonS' || m === 'baton' || (m === 'cristal' && y < cy) || (m === 'ecaille' && p === 'corps') || ((p === 'brasP' || p === 'brasL') && (rage || y > yT + 9 * k)) || m === 'griffe'; };
  sfColler(T, milieu);
  if (exil || tp > 0) {
    sfColler(T, b, ox, oy, devant);
    // un trait sombre entre la tête et le col
    for (let y = 1; y < b.h - 1; y++) for (let x = 1; x < b.l - 1; x++) { const i = y * b.l + x; if (b.m[i] === null || !devant(x, y, i)) continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const j = Y(y + dy) * W + X(x + dx); if (milieu.c[j] !== null && !(b.m[(y + dy) * b.l + x + dx] && devant(x + dx, y + dy, (y + dy) * b.l + x + dx))) T.c[j] = NOIR_CONTOUR; } }
  }
  // la couronne fêlée (une fente sombre, une pierre qui saute)
  if (f > 0.55) { const fx = X(fcx) + (dir ? 2 * k : -1 * k); let x = fx;
    for (let y = Y(couronne.y0); y <= Y(couronne.y1); y++) { const j = y * W + Math.round(x); if (T.c[j] !== null) T.c[j] = 0x2a1808; x += (y % 2 ? 0.8 : -0.6); } }
  sfColler(T, avant);
  sfColler(T, fins);
  if (modeleBaton && !rage && bb0.x1 >= 0) {
    const bt = sfToile(W, H, { cel: true });
    const xb = X((bb0.x0 + bb0.x1) / 2) + 0.5, yb = Y(bb0.y1) + 0.5, yh = Y(tete.y0) - (modeleBaton === 'serres' ? 22 : 24) * k;
    T.reperes = T.reperes || {}; T.cristalBaton = sfBatonMage(bt, xb, yb, yh, k * (0.8 + 0.5 * fe), modeleBaton);
    sfContour(bt, 2); sfColler(T, bt);
    sfColler(T, b, ox, oy, (x, y, i) => { const p = partie(i); return (p === 'mainP' || p === 'mainL') && b.m[i] !== 'batonS'; });
  }
  let haut = 0; while (haut < H && T.c.slice(haut * W, haut * W + W).every(c => c === null)) haut++;
  T.reperes = { haut, sol: solF, cx: cxB, yeux: yeux.map(e => [X(e.x), Y(e.y)]), cristal: T.cristalBaton || (rep.cristal && !modeleBaton ? [X(rep.cristal[0]), Y(rep.cristal[1])] : null), tete: [hcx, hcy], H };
  return T;
}
function sageTransformeTexture(scene, cle, f, vue, opts = {}) {
  if (!scene.textures.exists(cle)) { const t = sageTransformeHD(f, vue, opts); t.texture(scene, cle); scene.textures.get(cle).reperes = t.reperes; }
  return scene.textures.get(cle).reperes;
}

// =====================================================================================================================
// 2. Le dragon serpentin : la tête (de trois-quarts ou de face), le corps en tubes, les pattes
//    e : l'échelle de la tête (e = 1 : le crâne fait 48 pixels de large, la tête 110 de long)
// =====================================================================================================================
// Une ellipse tournée (angle en radians), avec sa normale
function sfEll(cx, cy, rx, ry, ang = 0) {
  const c = Math.cos(ang), s = Math.sin(ang), m = Math.max(rx, ry) + 1;
  return (x, y) => { const dx0 = x + 0.5 - cx, dy0 = y + 0.5 - cy; if (Math.abs(dx0) > m || Math.abs(dy0) > m) return null;
    const dx = (dx0 * c + dy0 * s) / rx, dy = (-dx0 * s + dy0 * c) / ry, d = dx * dx + dy * dy; if (d > 1) return null;
    const nx = dx * c - dy * s, ny = dx * s + dy * c; return [nx, ny, Math.sqrt(1 - d)]; };
}
// Un polygone (points [x, y]), avec une normale fixe ou calculée
function sfPoly(pts, n = [0, -0.3, 0.95]) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return (x, y) => { const px = x + 0.5, py = y + 0.5; if (px < x0 || px > x1 || py < y0 || py > y1) return null; let d = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) d = !d; }
    return d ? (typeof n === 'function' ? n(px, py) : n) : null; };
}
// Les écailles posées à plat (la tête) : des rangées décalées d'écailles rondes
function sfEcailles2D(taille, force = 1) {
  return (x, y) => { const a = y / (taille * 0.8), ra = Math.floor(a), fa = a - ra, b = x / taille + (ra % 2) * 0.5, fb = b - Math.floor(b) - 0.5;
    if (fa > 0.78 - 1.5 * fb * fb) return -1 * force; if (fa < 0.28 && Math.abs(fb) < 0.2) return 0.35 * force; return 0; };
}
// Une dent (un triangle pointu) : de (x, y) vers (x + dx, y + dy), large de w à la base
function sfDent(t, x, y, dx, dy, w, mat = 'dent') {
  const l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l;
  t.forme(mat, (px, py) => { const qx = px + 0.5 - x, qy = py + 0.5 - y, a = qx * ux + qy * uy, b = Math.abs(-qx * uy + qy * ux); return a >= 0 && a <= l && b <= w / 2 * (1 - a / l) + 0.35 ? [-uy * 0.3, ux * 0.3 - 0.3, 0.9] : null; }, { decalage: 0.3, ombre: false });
}
// La texture d'une mèche : de fines stries le long du poil
function sfMotifMeche(i) { return i ? (Math.abs(i.o) > 0.55 ? -0.35 : (Math.floor((i.o + 1) * 3.5) % 2 ? 0.25 : -0.1)) : 0; }
// Une mèche (crinière, barbe, barbillon) : un tube effilé
function sfMeche(t, pts, r0, opts = {}) { return sfTubeForme(t, 'criniere', pts, u => r0 * (1 - u * 0.8) + 0.35, { decalage: 0.25, ...opts }); }
// Une corne en bois de cerf : la perche, et des andouillers
function sfCorne(t, pts, r0, andouillers = [], opts = {}) {
  const tb = sfTubeForme(t, 'corne', pts, u => r0 * (1 - u * 0.72) + 0.4, { decalage: 0.2, motif: i => (i && i.u < 0.75 && (i.s / Math.max(3, r0 * 0.9)) % 1 < 0.2 ? -0.7 : 0), ...opts });
  for (const [u, dx, dy] of andouillers) { const p = tb.pts[Math.min(tb.pts.length - 1, Math.round(u * (tb.pts.length - 1)))];
    sfTubeForme(t, 'corne', sfBezier(p, [p[0] + dx * 0.3, p[1] + dy * 0.45], [p[0] + dx * 0.7, p[1] + dy * 0.8], [p[0] + dx, p[1] + dy], 12), v => r0 * (1 - u * 0.6) * 0.62 * (1 - v * 0.7) + 0.4, { decalage: 0.3, ...opts }); }
  return tb;
}
// La couronne d'or aux pierres bleues, posée en anneau (cx, cy, rx, ry), ep : l'épaisseur du bandeau
function sfCouronne(t, cx, cy, rx, ry, ep, pointes = 5) {
  const anneau = (x, y) => { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = Math.sqrt(dx * dx + dy * dy); return Math.abs(d - 1) * Math.min(rx, ry) <= ep * 0.5 ? [dx * 0.6, -0.2, 0.75] : null; };
  // le bandeau a de la hauteur : l'anneau, et l'anneau remonté d'une épaisseur, devant
  t.forme('orD', (x, y) => { for (let d = 0; d <= Math.round(ep * 0.7); d++) { const n = anneau(x, y + d); if (n && (d === 0 || (y + d + 0.5 - cy) > -ry * 0.1)) return n; } return null; }, { decalage: 0.3 });
  for (let i = 0; i < pointes; i++) {
    const a = Math.PI * (0.12 + 0.76 * i / (pointes - 1)), px = cx - Math.cos(a) * rx, py = cy + Math.sin(a) * ry - ep * 0.6, h = ep * (i === (pointes - 1) / 2 ? 2.6 : 1.8);
    t.forme('orD', sfPoly([[px - ep * 0.75, py + 0.5], [px + ep * 0.75, py + 0.5], [px, py - h]], [0, -0.5, 0.85]), { decalage: 0.4 });
    t.forme('pierre', sfEll(px, py + ep * 0.15, Math.max(0.9, ep * 0.34), Math.max(0.9, ep * 0.38)), { decalage: 0.8, ombre: false });
  }
}
// Une nageoire d'oreille (le rouge de la cape) : un éventail de rayons qui pointent vers l'arrière
function sfNageoire(t, x, y, e, dir, ang = 0, decalage = 0) {
  const pts = [[0, -2], [-14, -14], [-11, -6], [-22, -9], [-16, -1], [-24, 3], [-14, 5], [-18, 10], [-4, 6]];
  const c = Math.cos(ang), s = Math.sin(ang);
  t.forme('crete', sfPoly(pts.map(([px, py]) => [x + dir * (px * c - py * s) * e, y + (px * s + py * c) * e]), [-0.2 * dir, -0.3, 0.92]), { decalage, motif: (px) => ((Math.floor(px / Math.max(2, 2.4 * e))) % 2 ? -0.4 : 0.2) });
}

// La tête de trois-quarts : elle regarde vers dir (1 : la droite) ; gueule de 0 (fermée) à 1 (grande ouverte)
function sfTeteDragon3q(t, x0, y0, e, { dir = 1, gueule = 0.4 } = {}) {
  const P = (px, py) => [x0 + dir * px * e, y0 + py * e];
  const E = (px, py, rx, ry, ang = 0) => { const [x, y] = P(px, py); return sfEll(x, y, rx * e, ry * e, ang * dir); };
  const C = pts => pts.map(([px, py]) => P(px, py));
  const sc = Math.max(3, 5.5 * e), g = gueule;
  // derrière : le barbillon du fond, la crinière, la corne et la nageoire du fond
  sfMeche(t, sfChemin(P(48, 10), [[P(36, 30), P(16, 30), P(-6, 38)], [P(-28, 46), P(-50, 36), P(-74, 50)], [P(-90, 58), P(-104, 52), P(-118, 62)]], 14), 2 * e, { decalage: -0.4 });
  t.forme('criniere', E(-22, 6, 24, 22), { decalage: -1.2, motif: (x, y) => sfMotifFourrure(x, y, 41) * 0.8 });
  for (let m = 0; m < 14; m++) { const v = m / 13, bx = -12 - Math.sin(v * Math.PI) * 10, by = -20 + v * 46, dy = -0.7 + v * 1.6, l = 56 + ((m * 7) % 5) * 9, r = 6.5 - ((m * 3) % 4) * 0.6;
    sfLoche(t, ...P(bx, by), -dir, dy, l * e, r * e, { decalage: ((m * 5) % 3) * 0.3 - 0.35, chute: 0.3, onde: 0.1 + (m % 3) * 0.04 }); }
  sfCorne(t, sfBezier(P(-20, -8), P(-26, -22), P(-34, -34), P(-44, -44), 20), 4.2 * e, [[0.45, -1 * dir * e, -14 * e], [0.78, -4 * dir * e, -10 * e]], { decalage: -0.45 });   // (v2 : la corne du fond, tournée avec la tête)
  sfNageoire(t, ...P(-15, -6), e, dir, 0.3, -0.5);
  // la mâchoire du bas, qui s'ouvre en tournant
  const aj = 0.1 + 0.26 * g;
  t.forme('gueule', sfPoly(C([[0, 13], [50, 13], [52, 16], [48 - g * 2, 18 + 22 * g], [30, 16 + 14 * g], [4, 18]]), [0, 0, 1]), { decalage: -0.9, ombre: false });
  t.forme('gueule', E(26, 16 + 9 * g, 15, 3.5 + 2 * g, aj), { decalage: 0.5, ombre: false, bord: false });   // (la langue)
  t.forme('ecaille', E(23, 21 + 6 * g, 27, 7, aj), { decalage: -0.2, motif: sfEcailles2D(sc, 0.7) });
  t.forme('ventre', E(21, 25 + 7 * g, 24, 4, aj), { decalage: 0.1, motif: (x) => ((Math.floor(x / Math.max(3, 4 * e))) % 2 ? -0.5 : 0.1) });
  for (let i = 0; i < 6; i++) { const px = 12 + i * 6.4, [x, y] = P(px, 15 + (px - 4) * Math.tan(aj) * 0.95 + 4 * g); sfDent(t, x, y, 0, -(i === 5 ? 6 : 3) * e, (i === 5 ? 3.4 : 2.4) * e); }
  // le crâne, la joue, le museau, le nez
  t.forme('ecaille', E(0, 0, 24, 20), { decalage: 0.1, motif: sfEcailles2D(sc) });
  t.forme('ecaille', E(2, 10, 16, 11), { decalage: 0, motif: sfEcailles2D(sc) });
  t.forme('ecaille', E(27, 5, 28, 12.5), { decalage: 0.15, motif: sfEcailles2D(sc * 0.85, 0.8) });
  t.forme('ecaille', E(45, 6, 14, 10.5), { decalage: 0.2, motif: sfEcailles2D(sc * 0.8, 0.6) });
  t.forme('ecaille', E(29, -2, 22, 3.6, -0.06), { decalage: 0.7, ombre: false, motif: (x) => ((Math.floor(x / Math.max(3, 4 * e))) % 2 ? -0.6 : 0) });   // (l'arête du museau)
  t.forme('ecaille', E(53, 4, 8, 7.5, -0.2), { decalage: 0.35, motif: sfEcailles2D(sc * 0.6, 0.4) });
  t.forme('col', E(57.5, 1.5, 2.6, 1.6, 0.4), { decalage: -0.4, ombre: false, bord: false });   // (la narine)
  for (let i = 0; i < 7; i++) { const px = 12 + i * 6.2, [x, y] = P(px, 14.5); sfDent(t, x, y, 0, (i === 6 || i === 2 ? 6.5 : 3.2) * e, (i === 6 || i === 2 ? 3.6 : 2.4) * e); }
  // l'arcade, l'œil couleur du cristal, la fente de la pupille
  t.forme('col', E(15, -2.2, 8.6, 4.2, -0.18), { decalage: -0.4, ombre: false });
  t.forme('oeilD', E(15.5, -2, 7, 2.6, -0.18), { decalage: 0.9, ombre: false });
  t.forme('col', E(16.5, -2, 0.9, 2.4, 0), { decalage: -2, ombre: false, bord: false });
  t.forme('ecaille', E(12, -8.5, 16, 6, -0.2), { decalage: 0.35, motif: sfEcailles2D(sc * 0.7, 0.5) });
  // la nageoire d'oreille, la couronne coincée entre les cornes, la corne de devant
  sfNageoire(t, ...P(-8, -2), e * 1.1, dir, 0.2, 0.1);
  sfCouronne(t, ...P(-2, -16), 15 * e, 5 * e, 3.2 * e, 5);
  sfCorne(t, sfBezier(P(4, -17), P(-2, -40), P(-18, -56), P(-40, -62), 22), 6 * e, [[0.33, dir * 8 * e, -20 * e], [0.68, -2 * dir * e, -18 * e]], { decalage: 0.2 });
  // la barbe blanche sous le menton, le barbillon de devant
  for (const [bx, l, r] of [[6, 30, 3.6], [10, 40, 4], [15, 48, 4.4], [20, 44, 4.2], [25, 40, 4], [30, 32, 3.4], [34, 24, 3]]) {
    const by = 26 + 8 * g + (bx - 6) * 0.15;
    sfLoche(t, ...P(bx, by), -dir * 0.35, 1, l * e, r * e, { decalage: (bx % 2 ? 0.35 : 0), chute: 0, onde: 0.1 });
  }
  sfMeche(t, sfChemin(P(50, 12), [[P(42, 32), P(18, 36), P(-6, 52)], [P(-24, 64), P(-48, 54), P(-74, 70)], [P(-92, 80), P(-108, 72), P(-126, 82)]], 14), 2.4 * e, { decalage: 0.4, ombre: false });
  return { oeil: P(15.5, -2.4), cristal: P(-2, -21), nez: P(56, 2) };
}

// Une grosse mèche de crinière : partie de (x, y), elle file dans la direction (dx, dy) en ondulant, et retombe
function sfLoche(t, x, y, dx, dy, l, r, { decalage = 0, chute = 0.5, onde = 0.18 } = {}) {
  const n = Math.hypot(dx, dy) || 1, ux = dx / n, uy = dy / n, px = -uy, py = ux;
  const pt = (f, o) => [x + ux * l * f + px * l * o, y + uy * l * f + py * l * o + l * chute * f * f];
  return sfTubeForme(t, 'criniere', sfChemin([x, y], [[pt(0.2, onde), pt(0.38, onde), pt(0.5, 0)], [pt(0.62, -onde), pt(0.8, -onde), pt(1, 0.05)]], 12), u => r * (1 - u * 0.93) + 0.35, { decalage, motif: sfMotifMeche });
}
// La tête de face : elle nous regarde, la gueule ouverte
function sfTeteDragonFace(t, x0, y0, e, { gueule = 0.5 } = {}) {
  const P = (px, py) => [x0 + px * e, y0 + py * e];
  const E = (px, py, rx, ry, ang = 0) => { const [x, y] = P(px, py); return sfEll(x, y, rx * e, ry * e, ang); };
  const sc = Math.max(3, 6 * e), g = gueule;
  // derrière : la masse de la crinière, ses grosses mèches qui s'écartent et retombent ; les cornes ; les nageoires
  t.forme('criniere', E(0, 2, 38, 26), { decalage: -1.2, motif: (x, y) => sfMotifFourrure(x, y, 40) * 0.8 });
  for (let m = 0; m < 24; m++) { const a = (m % 2 ? 1 : -1) * (0.15 + Math.floor(m / 2) / 11 * 1.05), s = Math.sign(a), ang = -Math.PI / 2 + a * 1.25, bx = Math.cos(ang) * 22, by = 2 + Math.sin(ang) * 16;
    const l = (52 + ((m * 7) % 5) * 9) * (Math.abs(a) > 1 ? 0.8 : 1), r = 6.5 - ((m * 3) % 4) * 0.6;
    sfLoche(t, ...P(bx, by), Math.cos(ang), Math.sin(ang) * 0.7 + 0.25, l * e, r * e, { decalage: ((m * 5) % 3) * 0.3 - 0.35, chute: 0.6, onde: (0.1 + (m % 3) * 0.04) * s }); }
  for (const s of [-1, 1]) {
    sfCorne(t, sfBezier(P(s * 14, -20), P(s * 22, -44), P(s * 38, -60), P(s * 58, -66), 22), 6.5 * e, [[0.3, s * 3 * e, -22 * e], [0.64, s * 2 * e, -18 * e]], { decalage: s > 0 ? -0.15 : 0.2 });
    sfNageoire(t, ...P(s * 29, 2), e * 1.2, s, 0.15, s > 0 ? -0.2 : 0.2);
  }
  // les joues, le crâne large, la mâchoire du bas (le dessous ivoire)
  for (const s of [-1, 1]) t.forme('ecaille', E(s * 19, 13, 15, 13), { decalage: s > 0 ? -0.2 : 0.1, motif: sfEcailles2D(sc) });
  t.forme('ecaille', E(0, -6, 29, 20), { decalage: 0.05, motif: sfEcailles2D(sc) });
  t.forme('ecaille', E(0, 45 + 6 * g, 20, 8.5), { decalage: -0.1, motif: sfEcailles2D(sc, 0.7) });
  t.forme('ventre', E(0, 49 + 7 * g, 16, 5), { decalage: 0.1, motif: (x, y) => ((Math.floor(y / Math.max(3, 3 * e))) % 2 ? -0.5 : 0.1) });
  // la gueule ouverte, la langue, les crocs
  t.forme('gueule', E(0, 37 + 4 * g, 17, 4 + 6 * g), { decalage: -1, ombre: false });
  t.forme('gueule', E(0, 41 + 7 * g, 9, 2.5 + 2 * g), { decalage: 0.5, ombre: false, bord: false });
  for (const s of [-1, 1]) { sfDent(t, ...P(s * 10, 33.5 + 1 * g), 0, (6 + 3 * g) * e, 3.6 * e); sfDent(t, ...P(s * 14.5, 34.5), 0, 2.6 * e, 2.4 * e); sfDent(t, ...P(s * 5, 34), 0, 2.4 * e, 2.2 * e);
    sfDent(t, ...P(s * 11, 42 + 9 * g), 0, -(4.5 + 2 * g) * e, 3.2 * e); sfDent(t, ...P(s * 5.5, 42.5 + 9.5 * g), 0, -2.4 * e, 2 * e); }
  // le museau large et court, ses plaques, la truffe et ses deux grosses narines
  t.forme('ecaille', E(0, 16, 24, 12.5), { decalage: 0.2, motif: sfEcailles2D(sc * 0.85, 0.7) });
  for (let i = 0; i < 3; i++) t.forme('ecaille', E(0, 6 + i * 4.2, 9 - i * 1.2, 1.7), { decalage: 0.9 - i * 0.15, ombre: false });
  t.forme('ecaille', E(0, 24.5, 17, 6.5), { decalage: 0.4, motif: sfEcailles2D(sc * 0.6, 0.4) });
  for (const s of [-1, 1]) { t.forme('ecaille', E(s * 8.5, 23.5, 5.5, 3.6, s * 0.3), { decalage: 0.6, ombre: false }); t.forme('col', E(s * 8.5, 24.2, 3.2, 1.7, s * 0.4), { decalage: -0.4, ombre: false, bord: false }); }
  // les arcades lourdes, froncées en V, et les yeux plissés couleur du cristal
  for (const s of [-1, 1]) {
    t.forme('col', E(s * 15, -0.5, 9, 4.6, -s * 0.3), { decalage: -0.4, ombre: false });
    t.forme('oeilD', E(s * 15, 0, 7.2, 2.8, -s * 0.3), { decalage: 0.9, ombre: false });
    t.forme('col', E(s * 14.5, 0.2, 0.9, 2.5, 0), { decalage: -2, ombre: false, bord: false });
    t.forme('ecaille', E(s * 14.5, -6.2, 16.5, 5.6, -s * 0.42), { decalage: s > 0 ? 0.05 : 0.45, motif: sfEcailles2D(sc * 0.7, 0.5) });
  }
  // la couronne coincée entre les cornes, la barbe, les deux barbillons
  sfCouronne(t, ...P(0, -21), 17 * e, 4.5 * e, 3.4 * e, 5);
  for (const [bx, l, r] of [[-16, 26, 3.4], [16, 26, 3.4], [-12, 36, 3.8], [12, 36, 3.8], [-7, 44, 4.2], [7, 44, 4.2], [-2, 50, 4.4], [3, 48, 4.4]]) {
    const by = 52 + 8 * g - Math.abs(bx) * 0.2;
    sfLoche(t, ...P(bx, by), bx * 0.025, 1, l * e, r * e, { decalage: (Math.abs(bx) % 2 ? 0.35 : 0), chute: 0, onde: 0.09 * (bx < 0 ? -1 : 1) });
  }
  for (const s of [-1, 1]) sfMeche(t, sfChemin(P(s * 17, 26), [[P(s * 34, 20), P(s * 50, 26), P(s * 56, 40)], [P(s * 62, 54), P(s * 52, 68), P(s * 62, 82)], [P(s * 70, 94), P(s * 82, 90), P(s * 90, 102)]], 14), 2.6 * e, { decalage: 0.4, ombre: false });
  return { yeux: [P(-15, -0.5), P(15, -0.5)], cristal: P(0, -25) };
}

// Un morceau du corps : la crête rouge sur le dos, les écailles, le ventre ivoire bordé d'un filet d'or.
// ventre : de quel côté du sens de marche est le ventre (1 ou -1) ; s0 : l'abscisse du début (les écailles se suivent
// d'un morceau à l'autre, sans couture : les bords des côtés sont foncés à la main, pas de bord aux bouts)
function sfCorpsDragon(t, pts, R, { e = 1, ventre = 1, crete = true, decalage = 0, criniere = false, largeVentre = 0.4, s0 = 0 } = {}) {
  const tb0 = sfTube(pts, R), hC = 10 * e, pasC = Math.max(4, 10 * e), sc = Math.max(4, 11 * e);
  const tb = { ...tb0, info: (x, y, m) => { const i = tb0.info(x, y, m); if (i) i.s += s0; return i; } };
  const cote = i => (Math.abs(i.o) > 0.9 ? -1.1 : 0);
  if (crete) sfForme(t, 'crete', (x, y) => { const i = tb.info(x, y, hC); if (!i || i.dedans || i.o * ventre > 0 || i.u < 0.02 || i.u > 0.98) return null;
    const fr = (i.s / pasC) % 1, h = hC * (0.25 + 0.75 * (1 - fr)) * (0.6 + 0.4 * Math.min(1, i.r / (14 * e)));
    return i.d - i.r < h ? { ...i, n: [i.n[0] * 0.7, i.n[1] * 0.7, 0.7] } : null; }, { decalage: decalage - 0.1, motif: i => (i && (i.s / pasC) % 1 > 0.85 ? -0.8 : 0) });
  if (criniere) for (let s = tb0.L * 0.04; s < tb0.L * 0.96; s += Math.max(5, 9 * e)) {
    // une mèche blanche qui sort du dos et file vers la queue
    const u = s / tb0.L, i0 = Math.min(tb0.pts.length - 2, Math.floor(u * (tb0.pts.length - 1))), [ax, ay] = tb0.pts[i0], [bx, by] = tb0.pts[i0 + 1];
    const l = Math.hypot(bx - ax, by - ay) || 1, tx = (bx - ax) / l, ty = (by - ay) / l, nx = ventre * ty, ny = -ventre * tx, r = R(u) * 0.85;
    const x = ax + nx * r, y = ay + ny * r, lg = (16 + (Math.floor(s) % 3) * 6) * e * criniere;
    sfTubeForme(t, 'criniere', sfBezier([x, y], [x + nx * lg * 0.4 - tx * lg * 0.2, y + ny * lg * 0.4 - ty * lg * 0.2], [x + nx * lg * 0.5 - tx * lg * 0.6, y + ny * lg * 0.5 - ty * lg * 0.6], [x + nx * lg * 0.3 - tx * lg, y + ny * lg * 0.3 - ty * lg], 10), v => 3.6 * e * (1 - v * 0.9) + 0.35, { decalage: decalage + 0.1, motif: sfMotifMeche });
  }
  const mE = sfMotifEcailles(sc, sc * 0.9, 1);
  const o = { bord: false, ombre: true };
  sfForme(t, 'ecaille', (x, y) => tb.info(x, y), { ...o, garder: i => i.dedans && i.o * ventre < largeVentre, decalage, motif: (i, x, y) => mE(i) + (sfHash(x / 9, y / 9, 3) - 0.5) * 0.5 + cote(i) });
  sfForme(t, 'ventre', (x, y) => tb.info(x, y), { ...o, garder: i => i.dedans && i.o * ventre >= largeVentre + 0.07, decalage: decalage + 0.15, motif: i => sfMotifVentre(Math.max(3, 6 * e))(i) + cote(i) });
  sfForme(t, 'orD', (x, y) => tb.info(x, y), { ...o, garder: i => i.dedans && i.o * ventre >= largeVentre && i.o * ventre < largeVentre + 0.07, decalage: decalage + 0.3, ombre: false });
  return tb0;
}
// Le corps entier, en morceaux qui se suivent (chaque morceau : { pts, ordre }) : un même rayon R(u) sur toute la
// longueur, les morceaux dessinés du fond vers l'avant (ordre croissant) ; rend les morceaux avec leur position
function sfCorpsEntier(t, morceaux, R, opts = {}) {
  let L = 0; const info = morceaux.map(m => { const tb = sfTube(m.pts, 1); const r = { ...m, s0: L, L: tb.L }; L += tb.L; return r; });
  for (const m of [...info].sort((a, b) => (a.ordre || 0) - (b.ordre || 0)))
    sfCorpsDragon(t, m.pts, u => R((m.s0 + u * m.L) / L), { ...opts, ...(m.opts || {}), s0: m.s0 });
  return { L, info };
}
// Une patte : la cuisse, la touffe blanche du coude, l'avant-bras et son bracelet d'argent aux runes, quatre serres d'ivoire
function sfPatteDragon(t, A, B, C, r, { e = 1, decalage = 0, sens = 1 } = {}) {
  const sc = Math.max(3, 6 * e);
  sfTubeForme(t, 'ecaille', [A, B], u => r * (1 - u * 0.25), { decalage, motif: sfMotifEcailles(sc, sc * 0.8, 0.8) });
  for (let m = 0; m < 3; m++) sfMeche(t, sfBezier(B, [B[0] - sens * (6 + m * 3) * e, B[1] + (2 + m * 4) * e], [B[0] - sens * (12 + m * 4) * e, B[1] + (6 + m * 5) * e], [B[0] - sens * (18 + m * 4) * e, B[1] + (4 + m * 7) * e], 10), 3 * e, { decalage: decalage + 0.2 });
  const tb = sfTubeForme(t, 'ecaille', [B, C], u => r * 0.78 * (1 - u * 0.2), { decalage: decalage + 0.05, motif: sfMotifEcailles(sc * 0.9, sc * 0.75, 0.8) });
  sfForme(t, 'argentD', (x, y) => tb.info(x, y, 0.8), { garder: i => i.u > 0.32 && i.u < 0.56 && i.d <= i.r + 0.8, decalage: decalage + 0.3, motif: i => (i && Math.abs(i.u - 0.44) < 0.04 && Math.floor(i.s / 2) % 3 === 0 ? 2 : 0) });
  sfForme(t, 'oeilD', (x, y) => tb.info(x, y), { garder: i => i.dedans && Math.abs(i.u - 0.44) < 0.035 && Math.floor((i.o + 1) * 4) % 2 === 0, decalage: 1.2, ombre: false, bord: false });
  t.forme('ecaille', sfEll(C[0], C[1], r * 0.85, r * 0.6), { decalage: decalage + 0.1, motif: sfEcailles2D(sc * 0.7, 0.6) });
  for (let g = 0; g < 4; g++) { const a = (g - 1.5) * 0.45, gx = C[0] + Math.sin(a) * r * 0.75 + sens * r * 0.35, gy = C[1] + r * 0.25;
    sfTubeForme(t, 'corne', sfBezier([gx, gy], [gx + sens * r * 0.35 + Math.sin(a) * r * 0.3, gy + r * 0.25], [gx + sens * r * 0.6 + Math.sin(a) * r * 0.4, gy + r * 0.3], [gx + sens * r * 0.75 + Math.sin(a) * r * 0.45, gy + r * 0.62], 8), u => r * 0.2 * (1 - u * 0.75) + 0.3, { decalage: decalage + 0.4 }); }
}

// =====================================================================================================================
// 3. Les décors et les mises en scène de la planche
// =====================================================================================================================
Object.assign(SF_RAMPES, {
  roche: [0x07060a, 0x100d16, 0x1a1522, 0x251e30, 0x342a40, 0x483c56],
  rocheC: [0x0c0a12, 0x18141f, 0x262030, 0x362c42, 0x4a3e58, 0x625474],
  nuage: [0x100c22, 0x1c1636, 0x2a224a, 0x3c3260, 0x544a7c, 0x766c9c],
  lune: [0x6a6478, 0x8a8498, 0xaaa4b6, 0xc8c4d2, 0xe2dfe8, 0xf8f6fa],
  mont: [0x05040a, 0x0a0812, 0x100c1c, 0x181226, 0x221a32, 0x2e2440],
  montL: [0x0e0b1c, 0x141026, 0x1c1632, 0x241c3e, 0x2e244a, 0x3a2e58],
  bois: [0x1e120a, 0x3a2414, 0x5a3a1e, 0x7a542c, 0x9a703c, 0xb88e52],
  braise: [0x2a0606, 0x5a1008, 0x8a2010, 0xc04018, 0xe87a2a, 0xffc060],
});
// Un fond « d'atelier » (comme la planche 32) : un dégradé violet, un sol, l'ombre des pieds
function sfFondAtelier(s, { sol = 492, ombres = [] } = {}) {
  const g = s.add.graphics().setDepth(0);
  for (let y = 0; y < 540; y += 4) { const f = y / sol, c = y < sol ? [34 + f * 22, 26 + f * 16, 46 + f * 22] : [24, 19, 30];
    g.fillStyle(Phaser.Display.Color.GetColor(c[0] | 0, c[1] | 0, c[2] | 0)).fillRect(0, y, 960, 4); }
  g.fillStyle(0x3e3250).fillRect(0, sol, 960, 2);
  for (const [x, w] of ombres) g.fillStyle(0x0c0910, 0.55).fillEllipse(x, sol + 8, w, 16);
  return g;
}
// Une étiquette lisible sur fond sombre
function sfEtiquette(s, x, y, txt, { taille = 13, couleur = '#f3e6c8', o = 0.5, italique = true, fond = '#0c0a10cc' } = {}) {
  return s.add.text(x, y, txt, style(taille, couleur, { fontStyle: italique ? 'italic' : 'bold', brut: true, backgroundColor: fond, padding: { x: 6, y: 3 } })).setOrigin(o, 0.5).setDepth(80);
}
// La roche : une surface bosselée (bruit), éclairée d'en haut à gauche
function sfRoche(t, mat, dedans, { echelle = 0.05, graine = 1, decalage = 0, relief = 1 } = {}) {
  const h = (x, y) => fbm(x * echelle, y * echelle, graine, 4);
  t.forme(mat, (x, y) => { if (!dedans(x, y)) return null; const dx = (h(x + 1, y) - h(x - 1, y)) * 9 * relief, dy = (h(x, y + 1) - h(x, y - 1)) * 9 * relief; const n = Math.hypot(dx, dy, 1); return [-dx / n, -dy / n, 1 / n]; },
    { decalage, tramage: true, motif: (x, y) => (fbm(x * 0.12, y * 0.12, graine + 5, 2) - 0.5) * 0.7, bord: false, ombre: false });
}
// La grande grotte : le fond qui se perd dans le noir, des piliers au loin, les parois proches, la voûte et ses
// stalactites, le sol (fendu, qui luit, quand sa colère le fend)
function sfGrotteHD(W, H, { sol = 470, fentes = true, cristaux = true, graine = 3 } = {}) {
  const t = sfToile(W, H), cx = W / 2, op = { bord: false, ombre: false, tramage: true };
  t.forme('roche', () => [0, 0, 1], { ...op, decalage: -2.7, motif: (x, y) => Math.max(0, 0.95 - Math.hypot((x - cx) / W, (y - sol * 0.8) / H) * 2.4) + (fbm(x * 0.025, y * 0.025, graine, 2) - 0.5) * 0.6 });
  // des piliers au loin, à peine éclairés
  for (let i = 0; i < 8; i++) { const x0 = W * (0.16 + 0.68 * hachage(i, 1, graine)), w = W * (0.012 + 0.022 * hachage(i, 2, graine)), pente = (hachage(i, 3, graine) - 0.5) * 0.12;
    t.forme('roche', (x, y) => { if (y > sol - 2) return null; const xc = x0 + (y - sol) * pente + Math.sin(y * 0.04 + i) * 3, ww = w * (0.75 + 0.5 * Math.abs(Math.sin(y * 0.015 + i * 2))), dx = (x + 0.5 - xc) / ww; return Math.abs(dx) < 1 ? [dx * 0.9, 0, Math.sqrt(1 - dx * dx * 0.81)] : null; },
      { ...op, decalage: -1.9 + hachage(i, 4, graine) * 0.5, motif: (x, y) => (fbm(x * 0.09, y * 0.015, graine + i, 2) - 0.5) * 0.9 }); }
  // les parois proches, à gauche et à droite : elles s'arrondissent vers nous
  const bord = (y, c) => W * (0.1 + 0.06 * Math.sin(y / H * 5 + graine + c * 2) + 0.07 * fbm(c * 9, y * 0.012, graine + 2, 3));
  for (const c of [-1, 1]) t.forme('rocheC', (x, y) => { const b0 = bord(y, c), d = c < 0 ? b0 - x : x - (W - b0); if (d < 0) return null; const r = Math.min(1, d / 50); return [-c * (1 - r) * 0.85, -0.15, 0.35 + r * 0.6]; },
    { ...op, decalage: -0.9, motif: (x, y) => (fbm(x * 0.03, y * 0.03, graine + 6, 3) - 0.5) * 1.1 });
  // la voûte, qui descend sur les côtés, et ses stalactites
  const voute = x => H * (0.03 + 0.16 * Math.pow((x - cx) / (W / 2), 2)) + 10 * fbm(x * 0.02, 0, graine + 4, 2);
  t.forme('rocheC', (x, y) => { const v = voute(x); return y < v ? [0, 0.4, 0.9] : null; }, { ...op, decalage: -1.2, motif: (x, y) => (fbm(x * 0.04, y * 0.04, graine + 8, 2) - 0.5) * 0.9 });
  for (let i = 0; i < 34; i++) { const x = (i + hachage(i, 1, graine)) * W / 34, v = voute(x), l = (16 + hachage(i, 2, graine) * 80) * (H / 540) * (1.2 - Math.abs(x - cx) / W), w = (5 + hachage(i, 3, graine) * 10) * (W / 960);
    t.forme(i % 3 ? 'rocheC' : 'roche', (px, py) => { if (py < v - 3 || py > v + l) return null; const ww = w * (1 - (py - v) / l), dx = (px + 0.5 - x) / Math.max(0.6, ww); return Math.abs(dx) < 1 ? [dx * 0.85, 0.2, Math.sqrt(Math.max(0.05, 1 - dx * dx * 0.72 - 0.04))] : null; },
      { ...op, tramage: false, decalage: -0.9 - hachage(i, 5, graine) * 0.6 }); }
  // le sol, plus clair au milieu (la lueur), et ses éboulis
  t.forme('rocheC', (x, y) => (y >= sol - 4 + Math.sin(x * 0.03) * 2 ? [0, -0.75, 0.65] : null), { ...op, decalage: -1.3, motif: (x, y) => Math.max(0, 0.9 - Math.abs(x - cx) / W * 2.6) + (fbm(x * 0.05, y * 0.12, graine + 11, 3) - 0.5) * 1.0 });
  for (let i = 0; i < 46; i++) { const x = hachage(i, 5, graine) * W, y = sol + 3 + Math.pow(hachage(i, 6, graine), 0.8) * (H - sol - 6), r = 1.5 + hachage(i, 7, graine) * 6 * (y - sol + 16) / 50;
    t.forme(i % 2 ? 'roche' : 'rocheC', sfEll(x, y, r * 1.5, r * 0.75), { decalage: -0.6 + Math.max(0, 0.7 - Math.abs(x - cx) / W * 2) }); }
  if (fentes) for (let f = 0; f < 9; f++) { let x = cx + (hachage(f, 8, graine) - 0.5) * 50, y = sol + 4, a = Math.PI * (0.08 + 0.84 * f / 8);
    for (let pas = 0; pas < 70; pas++) { x -= Math.cos(a) * 3; y += Math.sin(a) * 0.7 + 0.15; a += (hachage(f, pas, graine) - 0.5) * 0.5; if (y > H - 1 || x < 0 || x > W) break;
      const kk = pas < 25 ? 5 : pas < 50 ? 4 : 3; t.poser(Math.round(x), Math.round(y), 'oeilD', kk); t.poser(Math.round(x) + 1, Math.round(y), 'oeilD', kk - 1); t.poser(Math.round(x), Math.round(y) + 1, 'oeilD', 1); } }
  if (cristaux) for (let i = 0; i < 10; i++) { const c = i % 2 ? 1 : -1, y = H * (0.3 + hachage(i, 10, graine) * 0.5), x = c < 0 ? bord(y, c) - 6 - hachage(i, 9, graine) * 30 : W - bord(y, c) + 6 + hachage(i, 9, graine) * 30, h = 8 + hachage(i, 11, graine) * 14;
    for (let j = 0; j < 3; j++) { const px = x + (j - 1) * h * 0.4, hh = h * (j === 1 ? 1 : 0.6), a = (j - 1) * 0.4 - c * 0.3;
      t.forme(j === 1 ? 'pierre' : 'ecaille', sfPoly([[px - 2.5, y], [px + 2.5, y], [px + 2.5 + Math.sin(a) * hh, y - hh], [px + Math.sin(a) * hh, y - hh - 3]], [-0.4, -0.4, 0.8]), { decalage: 0.2 }); } }
  return t;
}
// JeuneGoy en tout petit (pour l'échelle du dragon) : les mêmes couleurs que lui, vu de dos, qui lève la tête
function sfJeuneGoyMinuscule(t, x, y) {
  t.rampes.jgC = rampeVive(0xa86a2a); t.rampes.jgB = rampeVive(0x2e6aa8); t.rampes.jgT = rampeVive(0xe8dcc0); t.rampes.jgP = rampeVive(0x5a4a3a); t.rampes.jgS = rampeVive(0x7a4a22); t.rampes.peauJ = RAMPES.peau;
  t.dessin(x - 4, y - 16, [
    '..ccccc..',
    '.ccccccc.',
    '.ccccccc.',
    '..cccpc..',
    '.bbbbbbb.',
    'bbbtbtbbb',
    'b.btttb.b',
    'p.btttb.p',
    '..ttttt..',
    '..ttttt..',
    '..dd.dd..',
    '..dd.dd..',
    '..dd.dd..',
    '..ss.ss..',
    '.sss.sss.',
  ], { c: ['jgC', 3], p: ['peauJ', 3], b: ['jgB', 3], t: ['jgT', 3], d: ['jgP', 2], s: ['jgS', 2] });
}

// Le dragon serpentin entier, enroulé dans le ciel (une toile de W × H, à l'échelle 1)
function sfDragonCiel(t, { dx = 0, dy = -24 } = {}) {
  const e = 0.7, B = (a, c1, c2, b) => sfBezier([a[0] + dx, a[1] + dy], [c1[0] + dx, c1[1] + dy], [c2[0] + dx, c2[1] + dy], [b[0] + dx, b[1] + dy], 26), Q = (x, y) => [x + dx, y + dy];
  const R = u => u < 0.2 ? 13 + 7 * u / 0.2 : Math.max(2.5, 20 * Math.pow(1 - (u - 0.2) / 0.8, 0.7));
  const morceaux = [
    { pts: B([300, 206], [342, 176], [372, 124], [452, 118]), ordre: 9, opts: { criniere: 0.9 } },
    { pts: B([452, 118], [548, 112], [632, 192], [602, 286]), ordre: 8 },
    { pts: B([602, 286], [576, 362], [470, 398], [420, 346]), ordre: 2 },
    { pts: B([420, 346], [374, 300], [420, 228], [506, 240]), ordre: 3 },
    { pts: B([506, 240], [592, 252], [692, 346], [772, 306]), ordre: 1 },
    { pts: B([772, 306], [842, 270], [862, 188], [924, 150]), ordre: 4 },
  ];
  // les pattes du fond, plus sombres ; le corps ; les pattes de devant (courtes, trapues, les serres en avant)
  sfPatteDragon(t, Q(470, 126), Q(478, 152), Q(458, 166), 7, { e, decalage: -0.7, sens: -1 });
  sfPatteDragon(t, Q(730, 312), Q(754, 336), Q(780, 330), 6.5, { e, decalage: -0.7, sens: 1 });   // (les pattes arrière filent vers la queue)
  const corps = sfCorpsEntier(t, morceaux, R, { e, ventre: 1 });
  sfPatteDragon(t, Q(424, 138), Q(426, 166), Q(402, 178), 8, { e, sens: -1 });
  sfPatteDragon(t, Q(690, 322), Q(714, 350), Q(744, 348), 7.5, { e, sens: 1 });
  for (let m = 0; m < 7; m++) sfLoche(t, ...Q(922, 151), 1, -0.6 + (m - 3) * 0.28, (22 + (m % 3) * 6) * 0.9, 4.5 * 0.9, { decalage: (m % 2) * 0.3, chute: -0.15, onde: 0.15 });
  const tete = sfTeteDragon3q(t, ...Q(288, 214), e, { dir: -1, gueule: 0.65 });
  return { tete, corps };
}
// Le ciel de nuit d'orage : des bandes de couleur, des étoiles (Phaser)
function sfCielNuit(s, { haut = 0x0a0820, bas = 0x3a2a58, h = 540 } = {}) {
  const g = s.add.graphics().setDepth(0), a = Phaser.Display.Color.IntegerToColor(haut), b = Phaser.Display.Color.IntegerToColor(bas);
  for (let y = 0; y < h; y += 3) { const f = Math.pow(y / h, 1.3); g.fillStyle(Phaser.Display.Color.GetColor(a.red + (b.red - a.red) * f | 0, a.green + (b.green - a.green) * f | 0, a.blue + (b.blue - a.blue) * f | 0)).fillRect(0, y, 960, 3); }
  for (let i = 0; i < 90; i++) { const x = hachage(i, 1, 77) * 960, y = hachage(i, 2, 77) * h * 0.6; g.fillStyle(0xe8e4ff, 0.25 + hachage(i, 3, 77) * 0.6).fillRect(Math.round(x), Math.round(y), 1, 1); }
  return g;
}
// La lune, des nuages, les montagnes et la bouche de la grotte (des toiles à l'échelle 1)
function sfLuneHD(r) {
  const t = sfToile(2 * r + 4, 2 * r + 4, { relief: false });
  t.forme('lune', sfEll(r + 2, r + 2, r, r), { decalage: 0.6, motif: (x, y) => (fbm(x * 0.06, y * 0.06, 9, 3) - 0.5) * 2.2, bord: false });
  for (let i = 0; i < 9; i++) { const a = hachage(i, 1, 4) * 6.28, d = hachage(i, 2, 4) * r * 0.75, rr = 2 + hachage(i, 3, 4) * r * 0.16;
    const el = sfEll(r + 2 + Math.cos(a) * d, r + 2 + Math.sin(a) * d, rr, rr * 0.85); t.forme('lune', (x, y) => (el(x, y) ? [-0.3, -0.3, 0.9] : null), { decalage: -0.6, tramage: true, bord: false, ombre: false }); }
  return t;
}
function sfNuagesHD(W, H, bandes, graine = 5) {
  const t = sfToile(W, H, { relief: false });
  for (const [y0, ep, densite] of bandes) t.forme('nuage', (x, y) => { const v = fbm(x * 0.012, y * 0.03, graine + y0, 4) + (1 - Math.abs(y - y0) / ep) * 0.55 - 0.62 - (1 - densite) * 0.3; if (Math.abs(y - y0) > ep || v < 0) return null; return [0, -Math.min(1, v * 4) * 0.8 + 0.1, 0.6]; },
    { decalage: 0.2, tramage: true, motif: (x, y) => (fbm(x * 0.05, y * 0.08, graine + 3, 2) - 0.5) * 1.4, bord: false });
  return t;
}
function sfMontagnesHD(W, H, { grotte = [760, 470] } = {}) {
  const t = sfToile(W, H);
  const ligne = (x, g, amp, base) => base - amp * (0.5 * fbm(x * 0.006, 0, g, 4) + 0.5 * Math.abs(Math.sin(x * 0.009 + g)));
  sfRoche(t, 'montL', (x, y) => y > ligne(x, 2, 150, 470), { echelle: 0.012, graine: 2, decalage: -0.4, relief: 0.6 });
  sfRoche(t, 'mont', (x, y) => y > ligne(x, 8, 120, 520) - (Math.abs(x - grotte[0]) < 160 ? 70 * (1 - Math.abs(x - grotte[0]) / 160) : 0), { echelle: 0.016, graine: 8, decalage: -0.2, relief: 0.6 });
  // la bouche de la grotte, dans la montagne de devant : un trou noir, une lueur bleu-violet au fond
  const [gx, gy] = grotte;
  t.forme('roche', (x, y) => { const dx = (x + 0.5 - gx) / 34, dy = (y + 0.5 - gy) / 40; return dx * dx + dy * dy < 1 && y < gy + 10 ? [0, 0, 1] : null; }, { decalage: -2, bord: false, ombre: false });
  t.forme('flamme', (x, y) => { const dx = (x + 0.5 - gx) / 20, dy = (y + 0.5 - gy - 8) / 16; return dx * dx + dy * dy < 1 && y < gy + 10 ? [0, -0.2, 0.9] : null; }, { decalage: -1.6, tramage: true, bord: false, ombre: false, motif: (x, y) => -Math.hypot(x - gx, (y - gy - 10) * 1.2) / 14 + 0.6 });
  // le piton rocheux de JeuneGoy, devant, à gauche
  sfRoche(t, 'mont', (x, y) => x < 190 - (y < 470 ? (470 - y) * 1.6 : 0) + Math.sin(y * 0.2) * 3 && y > 452, { echelle: 0.025, graine: 12, decalage: 0.5, relief: 0.5 });
  return t;
}

// Les flammes de sa rage (l'essence du dragon) : des langues violettes à plusieurs tons (violet profond au bord, cœur
// bleu pâle, pointes blanches), qui lèchent et se tordent, et des braises qui montent
SF_RAMPES.flamme = [0x2a0a4e, 0x5614a0, 0x8a30e0, 0xb070ff, 0xc8d4ff, 0xffffff];
function sfFlammesHD(W, H, cx, sol, largeur, hauteur, graine = 2) {
  const t = sfToile(W, H, { relief: false }), langues = [];
  for (let i = 0; i < 23; i++) {
    const u = i / 22 - 0.5, x0 = cx + u * largeur * 2 + (hachage(i, 7, graine) - 0.5) * 14;
    const h = hauteur * (0.35 + 0.65 * Math.cos(u * 2.4)) * (0.55 + 0.6 * hachage(i, 1, graine)), w = largeur * (0.09 + 0.07 * hachage(i, 2, graine));
    langues.push({ x0, h, w, ph: hachage(i, 3, graine) * 6.3, tors: 0.25 + hachage(i, 4, graine) * 0.6, pench: u * 0.5 });
  }
  for (let y = sol; y > sol - hauteur * 1.15; y--) for (let x = cx - largeur * 1.4; x < cx + largeur * 1.4; x++) {
    let best = null;
    for (const L of langues) { const v = (sol - y) / L.h; if (v < 0 || v > 1) continue;
      const xc = L.x0 + Math.sin(v * 6 + L.ph) * L.w * L.tors * v * 2.5 + L.pench * v * 40, ww = L.w * (1 - v * v) * (0.7 + 0.5 * Math.sin(v * 3.14 + L.ph)) + 0.6;
      const r = Math.abs(x + 0.5 - xc) / ww; if (r < 1 && (!best || r + v * 0.6 < best.r + best.v * 0.6)) best = { r, v }; }
    if (!best) continue;
    const { r, v } = best, pointe = v > 0.82 && r < 0.5;
    let ton = 4.2 - r * 3.4 - v * 1.4 + (pointe ? 2.5 : 0) + (hachage(x, y, graine) - 0.5) * 0.7;
    t.poser(Math.round(x), y, 'flamme', Math.max(0, Math.min(5, Math.round(ton))));
  }
  // les braises : de petits points vifs qui montent en zigzag, plus pâles en haut
  for (let i = 0; i < 70; i++) { const bx = cx + (hachage(i, 11, graine) - 0.5) * largeur * 2.6, m = hachage(i, 12, graine), by = sol - m * hauteur * 1.5 - 4;
    const x = Math.round(bx + Math.sin(m * 9 + i) * 8), y = Math.round(by); if (y < 0) continue;
    t.poser(x, y, 'flamme', m > 0.6 ? 5 : 4); if (m < 0.5) { t.poser(x + 1, y, 'flamme', 3); t.poser(x, y + 1, 'flamme', 3); } }
  return t;
}
// Les fissures du sol : elles partent toutes de (cx, cy), rayonnent et se ramifient, bleu électrique
SF_RAMPES.fissure = [0x0a3a4a, 0x1a8aa0, 0x30c8e0, 0x70e8f8, 0xb8f8ff, 0xffffff];
function sfFissuresHD(W, H, cx, cy, { n = 6, longueur = 420, aplat = 0.4, graine = 4, solHaut = null } = {}) {
  const t = sfToile(W, H, { relief: false }), yMin = solHaut ?? cy - 4;
  const trace = (x, y, a, l, ep, prof) => {
    for (let pas = 0; pas < l; pas++) {
      x += Math.cos(a) * 2; y += Math.sin(a) * 2 * aplat; a += (hachage(Math.round(x / 3), Math.round(y / 3), graine + prof) - 0.5) * 0.3;
      if (x < 1 || x > W - 2) return; if (y > H - 1) return;
      if (y < yMin) { y = yMin; a = Math.cos(a) > 0 ? 0.05 : Math.PI - 0.05; }   // (au fond de la salle, elle court le long du mur)
      const f = pas / l, e = Math.max(1, Math.round(ep * (1 - f)));
      for (let d = 0; d < e; d++) t.poser(Math.round(x), Math.round(y) + d, 'fissure', d === 0 ? (f < 0.4 ? 5 : 4) : 2);
      t.poser(Math.round(x), Math.round(y) + e, 'fissure', 0);
      if (prof < 2 && (pas === Math.round(l * 0.3) || pas === Math.round(l * 0.62))) trace(x, y, a + (hachage(pas, prof, graine) > 0.5 ? 0.8 : -0.8), l * 0.45, ep * 0.6, prof + 1);
    }
  };
  for (let i = 0; i < n; i++) { const a = Math.PI * 2 * (i + 0.35 + 0.3 * hachage(i, 1, graine)) / n; trace(cx, cy, a, longueur * (0.6 + 0.6 * hachage(i, 2, graine)) / 2, 3.5, 0); }
  return t;
}
// Le bâton de mage (v2) : deux modèles, bien plus imposants, qui gardent le cristal bleu. x : son axe ; yBas : le sol ;
// yHaut : le sommet du cristal ; k : la finesse (l'échelle du personnage). Rend le cœur du cristal (pour sa lueur).
// 'serres' : un bois sombre cerclé d'or, trois serres d'or qui enserrent un grand cristal ;
// 'bois'   : un bois torsadé, des runes qui luisent, deux bois d'argent (comme ses cornes) autour du cristal
function sfBatonMage(t, x, yBas, yHaut, k, modele = 'bois') {
  t.rampes.boisS = rampeVive(0x4a2a18); t.rampes.boisT = rampeVive(0x6a4626);
  const yCr = yHaut + 7 * k, yTige = yCr + 3.5 * k;
  if (modele === 'serres') {
    cylindre(t, 'boisS', [x, yTige], [x, yBas], 1.9 * k, { decalage: 0.3, motif: (px, py) => (((py * 0.8 + px * 1.9) / k) % 7 < 1.4 ? -0.9 : (fbm(px * 0.3, py * 0.06, 3) - 0.5) * 0.8) });   // (le bois, une veine en spirale)
    for (const yy of [yBas - 3 * k, yTige + 12 * k, yTige + 26 * k]) { cylindre(t, 'orD', [x, yy - 1.4 * k], [x, yy + 1.4 * k], 2.4 * k, { decalage: 0.5 }); t.forme('pierre', ellipsoide(x, yy, 0.9 * k, 0.9 * k), { decalage: 0.8, ombre: false, bord: false }); }   // (les cercles d'or et leur pierre)
    cylindre(t, 'orD', [x, yTige - 1 * k], [x, yTige + 3 * k], 2.8 * k, { decalage: 0.4 });   // (le collet d'or)
    // les trois serres d'or qui montent autour du cristal et se referment sur sa pointe
    for (const [c, dec] of [[-1, 0.3], [1, 0.1], [0, -0.2]]) { const bx = x + c * 2.6 * k, ex = x + c * 0.9 * k;
      sfTubeForme(t, 'orD', sfBezier([bx, yTige], [bx + c * 2.8 * k, yTige - 4 * k], [ex + c * 3.6 * k, yHaut + 3 * k], [ex, yHaut - 0.5 * k], 14), u => 1.2 * k * (1 - u * 0.5) + 0.4, { decalage: dec + 0.2 }); }
    t.forme('oeilD', (px, py) => { const dx = (px + 0.5 - x) / (2.6 * k), dy = (py + 0.5 - yCr) / (6.5 * k); return Math.abs(dx) + Math.abs(dy) * 0.9 <= 1 ? [dx, dy * 0.5, 0.8] : null; }, { decalage: 0.9, ombre: false });   // (le grand cristal, un losange)
    t.forme('oeilD', ellipsoide(x - 0.8 * k, yCr - 2 * k, 0.6 * k, 1.8 * k), { decalage: 1.6, ombre: false, bord: false });   // (le reflet)
    for (const c of [-1, 1]) t.forme('orD', ellipsoide(x + c * 3.2 * k, yCr + 4.5 * k, 0.9 * k, 0.9 * k), { decalage: 0.6, ombre: false });   // (deux petites pierres d'or)
  } else {
    cylindre(t, 'boisT', [x, yTige], [x, yBas], 1.8 * k, { decalage: 0.4, motif: (px, py) => (((py + px * 1.6) / k) % 5 < 1.1 ? -0.9 : 0) });   // (le bois torsadé, plus épais)
    cylindre(t, 'argentD', [x, yBas - 4 * k], [x, yBas], 2.1 * k, { decalage: 0.4 });   // (la férule d'argent)
    for (let j = 0; j < 9; j++) { const yy = yTige + 8 * k + j * 6 * k; if (yy > yBas - 8 * k) break; const c = j % 2 ? 1 : -1;   // (les runes d'argent qui luisent, en spirale)
      t.poser(Math.round(x + c * 0.9 * k), Math.round(yy), 'oeilD', 5); t.poser(Math.round(x + c * 0.9 * k) + 1, Math.round(yy) + 1, 'oeilD', 3); t.poser(Math.round(x + c * 0.9 * k) - 1, Math.round(yy) - 1, 'oeilD', 3); }
    cylindre(t, 'argentD', [x, yTige - 1.5 * k], [x, yTige + 3 * k], 2.7 * k, { decalage: 0.4, motif: (px, py) => (Math.round(py / k) % 3 === 0 ? -0.6 : 0.2) });   // (le collet d'argent)
    // deux bois d'argent qui s'écartent autour du cristal, comme ses cornes
    for (const c of [-1, 1]) { const bx = x + c * 2 * k;
      const tb = sfTubeForme(t, 'argentD', sfBezier([bx, yTige], [bx + c * 3 * k, yTige - 5 * k], [bx + c * 5.5 * k, yHaut + 6 * k], [bx + c * 3.5 * k, yHaut - 1 * k], 16), u => 1.4 * k * (1 - u * 0.6) + 0.4, { decalage: c < 0 ? 0.5 : 0.1 });
      const q = tb.pts[7]; sfTubeForme(t, 'argentD', sfBezier(q, [q[0] + c * 1.5 * k, q[1] - 1 * k], [q[0] + c * 3 * k, q[1] - 2.5 * k], [q[0] + c * 3.6 * k, q[1] - 5 * k], 8), u => 0.9 * k * (1 - u * 0.6) + 0.4, { decalage: 0.4 }); }
    t.forme('oeilD', (px, py) => { const dx = (px + 0.5 - x) / (2.3 * k), dy = (py + 0.5 - yCr) / (6 * k); return dx * dx + dy * dy * 0.9 <= 1 && Math.abs(dy) * 0.8 + Math.abs(dx) * 0.5 <= 1 ? [dx, dy * 0.5, 0.8] : null; }, { decalage: 0.9, ombre: false });   // (le grand cristal, taillé)
    t.poser(Math.round(x - 0.7 * k), Math.round(yCr - 2.5 * k), 'oeilD', 5); t.poser(Math.round(x - 0.7 * k), Math.round(yCr - 2.5 * k) + 1, 'oeilD', 5);
  }
  return [x, yCr];
}
