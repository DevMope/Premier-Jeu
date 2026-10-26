// (planches 85 et 86) Le rig des corps : de vraies poses sans dessiner chaque image à la main.
//  1. ToileRig : une toile qui garde, pour chaque pixel, la pile de ce qu'on y a posé (la matière, le ton, la normale,
//     la partie du corps, l'ordre de dessin). dessinerCorpsVue s'en sert avec l'option `rig`.
//  2. rigDeformer(t, poses) : la toile déformée, chaque partie du corps tournée autour de son articulation (le buste
//     autour des hanches, la tête autour du cou, tout le corps autour des hanches ou des pieds), rééclairée, recernée.
//  3. optsMarche(phase, vue) : un vrai cycle de marche (le pied qui passe se lève, le genou plie, les bras balancent, le
//     corps monte et descend), en huit images, pour toutes les vues.
//  4. avecOptionsCorps(options, dessin) : un dessin du moteur avec des options en plus (le joueur passe par
//     dessinerJoueurHD, qui ne les transmet pas).

class ToileRig extends ToileHD {
  constructor(l, h) {
    super(l, h);
    this.rig = { px: [], seq: 0, formes: 0 };
    this.partie = 'corps';
    this.dansForme = false;
  }
  // Un pixel posé à la main (pas par une forme) : il garde son ton, sans normale (on ne le rééclaire pas), sauf s'il
  // retouche une forme de la même matière (une ombre, un reflet) : on garde alors l'écart de ton
  poser(x, y, mat, i) {
    if (this.dansForme || !this.dans(x, y)) return super.poser(x, y, mat, i);
    const idx = y * this.l + x, pile = this.rig.px[idx] || (this.rig.px[idx] = []), haut = pile[pile.length - 1];
    i = Math.max(0, Math.min(5, i));
    if (haut && this.m[idx] && haut.mat === mat && haut.n && this.m[idx] === mat) { const d = i - this.k[idx]; haut.dk = (haut.dk || 0) + d; haut.k += d; }
    else pile.push({ mat, k: i, n: null, part: haut && this.m[idx] ? haut.part : this.partie, seq: ++this.rig.seq });
    super.poser(x, y, mat, i);
  }
  // L'ombre portée : comme ToileHD, mais on note quelle partie l'a portée (elle disparaît si les deux parties se séparent)
  ombrer(ens, pts, portee = 2) {
    const faits = new Set();
    for (const [x, y] of pts) for (let dy = 0; dy <= portee; dy++) for (let dx = 0; dx <= Math.min(1, portee - dy); dx++) {
      if (!dx && !dy) continue;
      const nx = x + dx, ny = y + dy, idx = ny * this.l + nx;
      if (!this.dans(nx, ny) || ens.has(idx) || this.c[idx] === null || faits.has(idx) || !this.m[idx]) continue;
      faits.add(idx);
      const pile = this.rig.px[idx], haut = pile && pile[pile.length - 1];
      super.poser(nx, ny, this.m[idx], this.k[idx] - 1);
      if (haut) (haut.ombres = haut.ombres || []).push(this.partie);
    }
  }
  forme(mat, dedans, { decalage = 0, tramage = false, bord = true, motif = null, ombre = null, portee = 2 } = {}) {
    const id = ++this.rig.formes, pts = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.l; x++) { const n = dedans(x, y); if (n) pts.push([x, y, n]); }
    const ens = new Set(pts.map(([x, y]) => y * this.l + x));
    const dans = (x, y) => this.dans(x, y) && ens.has(y * this.l + x);
    if (ombre ?? (this.relief && bord)) this.ombrer(ens, pts, portee);
    this.dansForme = true;
    for (const [x, y, n] of pts) {
      const lum = n[0] * LUMIERE[0] + n[1] * LUMIERE[1] + n[2] * LUMIERE[2], mo = motif ? motif(x, y) : 0;
      const f = 1.2 + (lum + 0.15) * 3.6 + decalage + mo;
      let i = Math.floor(f);
      if (tramage && f - i > (BAYER[y % 4][x % 4] + 0.5) / 16) i++; else if (!tramage && f - i > 0.5) i++;
      if (this.cel) i = f < 2.3 ? 1 : f < 3.7 ? 3 : 4;
      if (bord) { if (!dans(x + 1, y) || !dans(x, y + 1)) i = Math.min(i, 1); else if (!dans(x - 1, y) || !dans(x, y - 1)) i = Math.max(Math.min(i, 3), i - 1); }
      this.poser(x, y, mat, i);
      const idx = y * this.l + x, pile = this.rig.px[idx] || (this.rig.px[idx] = []);
      pile.push({ mat, k: Math.max(0, Math.min(5, i)), n: [n[0], n[1], n[2]], b: 1.2 + 0.15 * 3.6 + decalage + mo, bord, cel: this.cel, id, part: this.partie, seq: ++this.rig.seq });
    }
    this.dansForme = false;
  }
}

// Les chaînes d'articulations : chaque partie suit les rotations de celles dont elle dépend
const CHAINES_RIG = { jambeP: ['global', 'jambeP'], jambeL: ['global', 'jambeL'], corps: ['global', 'buste'], brasP: ['global', 'buste', 'brasP'], brasL: ['global', 'buste', 'brasL'],
  mainP: ['global', 'buste', 'brasP'], mainL: ['global', 'buste', 'brasL'], tete: ['global', 'buste', 'tete'],
  avantP: ['global', 'buste', 'brasP'], avantL: ['global', 'buste', 'brasL'] };   // (planche 85 v2 : l'avant-bras à part, voir options.avantBras)

// Déformer une toile « rig » : poses = { global, buste, tete, brasP, brasL, jambeP, jambeL } : { a (degrés), px, py (le
// pivot, dans la toile), tx, ty }. `parties` : ne rendre que ces parties ; `ordre` : { partie: décalage d'ordre de dessin }.
// La nouvelle toile a `vers(x, y, partie)` : où va un point de la toile d'origine.
function rigDeformer(t, poses = {}, { marge = 6, parties = null, trous = true, ordre = {} } = {}) {
  const aff = p => { if (!p) return [1, 0, 0, 0, 1, 0]; const a = (p.a || 0) * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), px = p.px || 0, py = p.py || 0;
    return [c, -s, -c * px + s * py + px + (p.tx || 0), s, c, -s * px - c * py + py + (p.ty || 0)]; };
  const comp = (A, B) => [A[0] * B[0] + A[1] * B[3], A[0] * B[1] + A[1] * B[4], A[0] * B[2] + A[1] * B[5] + A[2], A[3] * B[0] + A[4] * B[3], A[3] * B[1] + A[4] * B[4], A[3] * B[2] + A[4] * B[5] + A[5]];
  const M = {}, ANG = {};
  for (const [part, ch] of Object.entries(CHAINES_RIG)) { let m = [1, 0, 0, 0, 1, 0], a = 0; for (const j of ch) { m = comp(m, aff(poses[j])); a += (poses[j] && poses[j].a) || 0; } M[part] = m; ANG[part] = a; }
  const memeM = (p, q) => { const A = M[p] || M.corps, B = M[q] || M.corps; return A.every((v, i) => Math.abs(v - B[i]) < 1e-6); };
  const app = (m, x, y) => [m[0] * x + m[1] * y + m[2], m[3] * x + m[4] * y + m[5]];
  const L = t.l, H = t.h, R = t.rig.px;
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (let i = 0; i < L * H; i++) {
    const pile = R[i]; if (!pile || !pile.length || t.m[i] === null) continue;
    const x = i % L, y = (i / L) | 0;
    for (const r of pile) { if (parties && !parties.includes(r.part)) continue; const m = M[r.part] || M.corps;
      for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const [X, Y] = app(m, x + dx, y + dy); if (X < x0) x0 = X; if (Y < y0) y0 = Y; if (X > x1) x1 = X; if (Y > y1) y1 = Y; } }
  }
  const ox = Math.floor(x0) - marge, oy = Math.floor(y0) - marge, W = Math.ceil(x1) - ox + marge, HH = Math.ceil(y1) - oy + marge;
  const best = new Array(W * HH).fill(null), membres = new Map(), SUB = [1 / 6, 1 / 2, 5 / 6];
  for (let i = 0; i < L * H; i++) {
    const pile = R[i]; if (!pile || !pile.length || t.m[i] === null) continue;
    const x = i % L, y = (i / L) | 0;
    for (const r of pile) {
      if (parties && !parties.includes(r.part)) continue;
      const m = M[r.part] || M.corps;
      let S = r.id ? membres.get(r.id) : null; if (r.id && !S) membres.set(r.id, S = new Set());
      const q = r.seq + (ordre[r.part] || 0);
      for (const sy of SUB) for (const sx of SUB) {
        const [X, Y] = app(m, x + sx, y + sy), j = (Math.floor(Y) - oy) * W + (Math.floor(X) - ox);
        if (S) S.add(j);
        if (!best[j] || best[j].q < q) best[j] = { r, q };
      }
    }
  }
  const t2 = new ToileHD(W, HH); t2.rampes = t.rampes; t2.relief = t.relief; t2.cel = t.cel;
  const parts = new Array(W * HH).fill(null);
  for (let j = 0; j < W * HH; j++) {
    if (!best[j]) continue;
    const r = best[j].r, X = j % W, Y = (j / W) | 0, a = (ANG[r.part] || 0) * Math.PI / 180;
    let i;
    if (!r.n || Math.abs(a) < 1e-6) i = r.k;
    else {
      const c = Math.cos(a), s = Math.sin(a), nx = r.n[0] * c - r.n[1] * s, ny = r.n[0] * s + r.n[1] * c, nz = r.n[2];
      const f = r.b + (nx * LUMIERE[0] + ny * LUMIERE[1] + nz * LUMIERE[2]) * 3.6; i = Math.floor(f); if (f - i > 0.5) i++;
      if (r.cel) i = f < 2.3 ? 1 : f < 3.7 ? 3 : 4;
      if (r.bord) { const S = membres.get(r.id), has = (x, y) => x >= 0 && y >= 0 && x < W && y < HH && S.has(y * W + x); if (!has(X + 1, Y) || !has(X, Y + 1)) i = Math.min(i, 1); else if (!has(X - 1, Y) || !has(X, Y - 1)) i = Math.max(Math.min(i, 3), i - 1); }
      i += r.dk || 0;
    }
    if (r.ombres) for (const p of r.ombres) if (memeM(p, r.part)) i -= 1;
    t2.poser(X, Y, r.mat, i); parts[j] = r.part;
  }
  // les jours qui s'ouvrent aux articulations (la hanche quand le buste se penche) : bouchés s'il y avait de la matière
  if (trous) for (let passe = 0; passe < 2; passe++) {
    const aj = [];
    for (let Y = 1; Y < HH - 1; Y++) for (let X = 1; X < W - 1; X++) {
      const j = Y * W + X; if (t2.m[j]) continue;
      const v = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => (Y + dy) * W + X + dx).filter(q => t2.m[q]);
      if (v.length < 3) continue;
      const q = v[0], p = parts[q] || 'corps', m = M[p], det = m[0] * m[4] - m[1] * m[3];
      const xs = X + 0.5 + ox - m[2], ys = Y + 0.5 + oy - m[5], sx = Math.floor((m[4] * xs - m[1] * ys) / det), sy = Math.floor((-m[3] * xs + m[0] * ys) / det);
      if (sx >= 0 && sy >= 0 && sx < L && sy < H && t.m[sy * L + sx]) aj.push([X, Y, t2.m[q], t2.k[q], p]);
    }
    for (const [X, Y, m, k, p] of aj) { t2.poser(X, Y, m, k); parts[Y * W + X] = p; }
  }
  contourEpais(t2, CONTOUR_CORPS.tours);
  t2.vers = (x, y, part = 'corps') => { const [X, Y] = app(M[part] || M.corps, x, y); return [X - ox, Y - oy]; };
  t2.reperes2 = t.reperes2;
  return t2;
}

// Un dessin du moteur avec des options en plus (le temps d'un appel)
function avecOptionsCorps(options, dessin) {
  const avant = OPTIONS_CORPS_EN_PLUS;
  OPTIONS_CORPS_EN_PLUS = avant ? { ...avant, ...options } : options;
  try { return dessin(); } finally { OPTIONS_CORPS_EN_PLUS = avant; }
}

// --- La marche (planche 85, validée) : phase 0 = le talon de la jambe proche se pose devant ---
// A : la demi-foulée ; leve : la hauteur du pied qui passe ; tilt : la perspective (le pied loin de nous paraît plus haut) ;
// bob : de combien le corps descend au contact. De face ou de dos, ce qui ne se voit pas en profondeur passe en hauteur.
const MARCHE_HD = { images: 8, duree: 70 };
function optsMarche(phi, vue = 'troisQuarts', { A = 3.2, leve = 3, tilt = 0.32, bob = 1.6, bras = 1 } = {}) {
  const ph = (cote, pres, decal) => (((phi + (cote === pres ? 0 : 0.5) + decal) % 1) + 1) % 1;
  const semelle = vue === 'dos';
  const jambe = (ctx) => {
    const { k, ep, yB, sol, cote, pres, c } = ctx, psi = ph(cote, pres, 0), fc = Math.abs(c) > 0.9 ? 1 : 0;
    let z, lv, flex, dedans;
    if (psi < 0.5) { const u = psi / 0.5; z = A * k * (1 - 2 * u); lv = u > 0.72 ? (u - 0.72) / 0.28 * 1.3 * k : 0; flex = u < 0.25 ? Math.sin(u / 0.25 * Math.PI) * 0.9 : 0; dedans = Math.sin(Math.PI * u) * 0.05; }
    else { const u = (psi - 0.5) / 0.5, e = (1 - Math.cos(Math.PI * u)) / 2; z = A * k * (-1 + 2 * e); lv = Math.sin(Math.PI * Math.min(1, u * 1.12)) * (leve + fc * 1.6) * k + (u < 0.18 ? (1 - u / 0.18) * 1.3 * k : 0); flex = Math.sin(Math.PI * u) * 2.6; dedans = Math.sin(Math.PI * u) * 0.16; }
    const prof = z * c, persp = Math.max(0, A * k - prof) * tilt * (fc ? 1.5 : 1), lvT = lv + persp;
    const piedY = sol - 3 * k - lvT, hancheY = yB - 1 * k;
    const genou = [cote * ep * (0.45 - dedans * 0.6), z * 0.5 + (0.4 + flex) * k, hancheY + (piedY + 3 * k - hancheY) * 0.5 - flex * (0.35 + fc * 0.5) * k];
    return { genou, pied: [cote * ep * (0.48 - dedans * fc), z, piedY], leve: lvT, semelle: semelle && psi > 0.36 && psi < 0.64 ? 1.4 : 0 };
  };
  const brasF = (ctx) => {
    const { k, ep, yT, yB, cote, pres, c } = ctx, psi = ph(cote, pres, 0.5), w = Math.cos(2 * Math.PI * psi), fc = Math.abs(c) > 0.9 ? 1 : 0;
    const Lb = (yB + 1.5 * k) - (yT + 2 * k), th = w * (fc ? 0.5 : 0.36) * bras, fl = Math.max(0, w) * (fc ? 0.7 : 0.45) * bras;
    const e = [cote * (ep - 0.8 * k), 0.3 * k, yT + 2 * k], dC = Lb * 0.5, dM = Lb * 0.52;
    const coude = [cote * (ep + 1.2 * k + Math.max(0, w) * fc * 0.5 * k), e[1] + Math.sin(th) * dC, e[2] + Math.cos(th) * dC];
    const main = [cote * (ep + 0.6 * k - Math.max(0, w) * (fc ? 2.2 : 0.9) * k + Math.max(0, -w) * (fc ? 1 : 0.4) * k), coude[1] + Math.sin(th + fl) * dM, coude[2] + Math.cos(th + fl) * dM];
    return { coude, main };
  };
  // (de face et de dos, le côté proche est le côté 1) la main qui vient vers nous passe devant le corps, celle qui s'en va derrière
  let ordreBras = null;
  if (vue === 'face' || vue === 'dos') {
    ordreBras = {}; const sens = vue === 'dos' ? -1 : 1;
    for (const [cle, cote] of [['P', 1], ['L', -1]]) { const w = Math.cos(2 * Math.PI * ph(cote, 1, 0.5)) * sens; if (w > 0.25) ordreBras[cle] = 'devant'; else if (w < -0.25) ordreBras[cle] = 'derriere'; }
  }
  return { membres: { jambeP: jambe, jambeL: jambe, brasP: brasF, brasL: brasF }, bob: bob * FINESSE * (1 + Math.cos(4 * Math.PI * phi)) / 2, ordreBras };
}
