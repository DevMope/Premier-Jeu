// (v1.63) Les arbres du jeu, peints un par un : un tronc d'écorce (fibres, crevasses, racines qui s'évasent), des
// branches qui se divisent, un feuillage en masses de touffes (chacune éclairée en haut à gauche, sombre en dessous, de
// petits paquets de feuilles et des éclats de lumière), et la saison : fleurs et pétales au printemps, vert dense l'été
// (des pommes au pommier), roux et feuilles tombées à l'automne, branches nues (et neige, là où il neige) l'hiver.
// Les feuillus : le chêne (large, tronc épais), le pommier (bas, noueux, fleuri ou chargé de fruits), le bouleau (tronc
// blanc moucheté de noir, couronne légère), le saule (ses longues branches qui pendent), l'aulne (des rivières, ovale et
// sombre), le buisson. Les toujours verts : le sapin (ses étages de branches, la neige sur chaque étage), le cyprès
// (une flamme sombre), l'ambrenne des elfes de Sérambre (planche 91 : un tronc de brins de cuivre torsadés, des feuilles en
// écailles d'or, d'or en toute saison). Et l'arbre mort, tordu,
// des Brumes et des terres maudites.
// peindreArbre() dessine par `put(x, y, matière, teinte)` : la même peinture sert pour les arbres sur une toile ×2 (la
// façade, la place, les récits), pour ceux peints dans une autre toile (le porche) et pour ceux des collines du paysage.
const ESPECES_ARBRE = ['chene', 'pommier', 'bouleau', 'saule'];
const TOUTES_ESPECES_ARBRE = ['chene', 'pommier', 'bouleau', 'saule', 'aulne', 'buisson', 'sapin', 'cypres', 'ambrenne', 'mort', 'palmier'];
const TOUJOURS_VERTS = ['sapin', 'cypres', 'ambrenne', 'palmier'];

// Les couleurs : [clair-vif, moyen, sombre] du feuillage par espèce et par saison ; l'écorce, les fleurs, les fruits, la neige.
const FEUILLAGES_ARBRE = {
  chene: { semailles: [0x7cc050, 0x9ad060, 0x58a044], moissons: [0x2f7a2a, 0x468f34, 0x1f5c26], brumes: [0xc8601e, 0xe09a30, 0x9a3a18], givre: [0x6a5a48, 0x7a6a58, 0x5a4a3a] },
  pommier: { semailles: [0x78b858, 0x98cc68, 0x58a048], moissons: [0x3a8a30, 0x54a040, 0x2a6a2a], brumes: [0xc8482a, 0xe0a030, 0x9a3018], givre: [0x6a5a48, 0x7a6a58, 0x5a4a3a] },
  bouleau: { semailles: [0x9ad060, 0xb8e070, 0x78b850], moissons: [0x4a9a38, 0x6ab048, 0x34802c], brumes: [0xe8c030, 0xf0d860, 0xc09020], givre: [0x7a6a58, 0x8a7a68, 0x6a5a48] },
  saule: { semailles: [0x98c860, 0xb4d878, 0x78b050], moissons: [0x5a9a3a, 0x78b048, 0x44802c], brumes: [0xc8b040, 0xe0d060, 0x98902c], givre: [0x8a7a50, 0x9a8a60, 0x6a5a3a] },
  aulne: { semailles: [0x6aac48, 0x86c058, 0x4a8a3a], moissons: [0x2a6a30, 0x3e8038, 0x1c5026], brumes: [0xa8702a, 0xc89838, 0x7a4a1e], givre: [0x5a4a40, 0x6a5a4a, 0x4a3a32] },
  buisson: { semailles: [0x72b850, 0x92c860, 0x52984a], moissons: [0x3a7a30, 0x529040, 0x2a5e2a], brumes: [0xb8502a, 0xd88a30, 0x8a3420], givre: [0x6a5a48, 0x7a6a58, 0x5a4a3a] },
  sapin: { semailles: [0x2e6a3c, 0x3e7e46, 0x1e4e30], moissons: [0x285e36, 0x387440, 0x1a442c], brumes: [0x2a5a36, 0x3a6e40, 0x1c462c], givre: [0x264e34, 0x34623c, 0x183c2a] },
  cypres: { semailles: [0x346a36, 0x447e40, 0x22502a], moissons: [0x2c5e30, 0x3c723a, 0x1c4826], brumes: [0x2e5a30, 0x3e6e38, 0x1e4626], givre: [0x2a5230, 0x3a6636, 0x1a4024] },
  ambrenne: { semailles: [0xd8b030, 0xeed060, 0xa8801c], moissons: [0xd8a020, 0xf0c840, 0xa87414], brumes: [0xd89020, 0xeeb840, 0xa86414], givre: [0xd8a828, 0xeccc58, 0xa87c1c] },
  mort: { semailles: [0x6a7a5a, 0x7a8a6a, 0x4a5a42], moissons: [0x6a7a5a, 0x7a8a6a, 0x4a5a42], brumes: [0x6a7a5a, 0x7a8a6a, 0x4a5a42], givre: [0x6a7a5a, 0x7a8a6a, 0x4a5a42] },
  palmier: { semailles: [0x4a9a3a, 0x68b048, 0x2e7030], moissons: [0x4a8a36, 0x66a444, 0x2c682c], brumes: [0x5a8a36, 0x78a448, 0x386a2c], givre: [0x4a8236, 0x649c44, 0x2c642c] },
};
// `couleur` : le feuillage prend la couleur des arbres du paysage de la contrée (pour que le premier plan et les collines
// aillent ensemble) ; l'automne le rougit, le printemps l'éclaircit
function rampesArbre(saison, espece, couleur = null) {
  if (espece === 'ambrenne') return rampesAmbrenne(saison);
  const S = saison || 'moissons', f = (FEUILLAGES_ARBRE[espece] || FEUILLAGES_ARBRE.chene)[S];
  let base = couleur;
  if (couleur !== null && !TOUJOURS_VERTS.includes(espece) && espece !== 'mort') {
    if (S === 'brumes') base = melangeCouleur(couleur, f[0], 0.6);
    else if (S === 'semailles') base = melangeCouleur(couleur, f[0], 0.3);
  }
  const [a, b, c] = base === null ? f : [base, teinte(base, 1.16), teinte(base, 0.78)];
  const ecorce = { chene: 0x5a4230, pommier: 0x6a5240, bouleau: 0x4a3a40, saule: 0x5a5238, aulne: 0x4a4038, buisson: 0x5a4430, sapin: 0x4a3428, cypres: 0x4a3a2a, mort: 0x5a5048, palmier: 0x8a6a40 }[espece] || 0x5a4230;
  return { arbFeuA: rampe(a), arbFeuB: rampe(b), arbFeuC: rampe(c), arbEcorce: rampe(ecorce),
    arbEcorceB: [0x6a6a62, 0x9a9a92, 0xc4c4bc, 0xe2e2da, 0xf2f2ec, 0xffffff],
    arbFleur: rampe(0xf4b0cc), arbFleurB: [0xc8b8c0, 0xe4dce0, 0xf4eef2, 0xfffafc, 0xffffff, 0xffffff],
    arbPomme: rampeVive(0xc82828), arbNeige: [0x8a96a8, 0xaab6c8, 0xc8d2e0, 0xdce4ee, 0xeef2f8, 0xffffff] };
}

// Un trait épais, éclairé en haut à gauche : tronc, racine, branche. `neige` : de la neige sur le dessus.
function traitArbre(put, x0, y0, x1, y1, w0, w1, mat, g, { neige = false, bouleau = false } = {}) {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, n = Math.ceil(L * 2);
  const px = -dy / L, py = dx / L;
  for (let k = 0; k <= n; k++) {
    const u = k / n, x = x0 + dx * u, y = y0 + dy * u, r = Math.max(0.55, (w0 + (w1 - w0) * u) / 2);
    for (let j = -Math.ceil(r) - 0.5; j <= Math.ceil(r) + 0.5; j += 0.5) {
      const a = j / r; if (Math.abs(a) > 1.001) continue;
      const X = Math.round(x + px * j), Y = Math.round(y + py * j);
      const z = Math.sqrt(1 - a * a), lum = px * a * -0.55 + py * a * -0.6 + z * 0.55;
      let i = 1.7 + (lum + 0.15) * 3.1 + (fbm(j * 0.8 + x * 0.25, y * 0.14, g) - 0.5) * 1.7;
      if (hachage(X, Y >> 1, g + 3) > 0.92) i -= 2;   // (une crevasse d'écorce)
      if (bouleau && r >= 1.2 && ((Y % 5 === 0 || Y % 7 === 3) && hachage(Y >> 1, 3, g) > 0.35 && Math.abs(a) < 0.7)) { put(X, Y, 'arbEcorce', 1); continue; }   // (les marques noires du bouleau)
      put(X, Y, mat, Math.round(i));
    }
    if (neige && r >= 0.9 && Math.abs(dy) / L < 0.8 && hachage(k, 2, g) > 0.12) { const X = Math.round(x), Y = Math.round(y - r - 0.6); put(X, Y, 'arbNeige', 4 + (hachage(k, 3, g) > 0.5 ? 1 : 0)); if (r >= 1.6) put(X, Y + 1, 'arbNeige', 3); }
  }
}

const PARAMS_ARBRE = {
  //            tronc : hauteur, largeur bas, largeur haut, penche ; couronne : centre y, rx, ry ; touffe : rayon, nombre ; branches : écart, longueur, niveaux
  chene: { th: 0.34, w0: 0.115, w1: 0.07, pen: 0.01, cy: 0.64, rx: 0.34, ry: 0.3, r: 0.115, n: 20, ecart: 1.15, len: 0.17, niv: 3, mat: 'arbEcorce' },
  pommier: { th: 0.34, w0: 0.085, w1: 0.052, pen: 0.05, cy: 0.63, rx: 0.43, ry: 0.23, r: 0.105, n: 22, ecart: 1.25, len: 0.15, niv: 3, mat: 'arbEcorce' },
  bouleau: { th: 0.5, w0: 0.05, w1: 0.03, pen: 0.025, cy: 0.69, rx: 0.2, ry: 0.31, r: 0.075, n: 20, ecart: 0.42, len: 0.15, niv: 3, mat: 'arbEcorceB' },
  saule: { th: 0.36, w0: 0.1, w1: 0.06, pen: -0.03, cy: 0.7, rx: 0.44, ry: 0.19, r: 0.115, n: 18, ecart: 1.05, len: 0.16, niv: 3, mat: 'arbEcorce' },
  aulne: { th: 0.36, w0: 0.075, w1: 0.048, pen: 0.015, cy: 0.66, rx: 0.27, ry: 0.32, r: 0.1, n: 20, ecart: 0.85, len: 0.16, niv: 3, mat: 'arbEcorce' },
  buisson: { th: 0.08, w0: 0.08, w1: 0.06, pen: 0, cy: 0.42, rx: 0.48, ry: 0.36, r: 0.16, n: 14, ecart: 1.3, len: 0.16, niv: 2, mat: 'arbEcorce', sansTronc: true },
  mort: { th: 0.42, w0: 0.1, w1: 0.06, pen: 0.06, cy: 0.66, rx: 0.32, ry: 0.28, r: 0.1, n: 0, ecart: 1.25, len: 0.18, niv: 3, mat: 'arbEcorce', tord: 0.16 },
};

// Peint un arbre de hauteur H dont le pied est en (cx, base). `put(x, y, matière, teinte)` pose un pixel.
// `neige` : de la neige sur les branches et au pied (par défaut l'hiver) ; `mousse` : la mousse qui pend (l'arbre mort des marais).
function peindreArbre(put1, { cx, base, H, espece = 'chene', saison = 'moissons', graine = 1, ecartG = 1, ecartD = 1, neige = saison === 'givre', mousse = false, etroit = 1, ecartX = 1 }) {
  if (espece === 'palmier') return peindrePalmier(put1, { cx, base, H, graine, neige });
  if (espece === 'sapin') return peindreSapin(put1, { cx, base, H, graine, neige, etroit });
  if (espece === 'cypres') return peindreCypres(put1, { cx, base, H, graine, neige });
  if (espece === 'ambrenne') return peindreAmbrenne(put1, { cx, base, H, graine, saison, neige, ecartX });
  let muet = false; const put = (x, y, m, i) => { if (!muet) put1(Math.round(x), Math.round(y), m, Math.max(0, Math.min(5, Math.round(i)))); };   // (muet : on trace à blanc pour connaître le bout des branches)
  const E = PARAMS_ARBRE[espece] || PARAMS_ARBRE.chene, g = graine * 977 + (TOUTES_ESPECES_ARBRE.indexOf(espece) + 1) * 131;
  const mort = espece === 'mort', hiver = saison === 'givre', nu = mort || (hiver && !TOUJOURS_VERTS.includes(espece));
  const automne = saison === 'brumes' && !mort, printemps = saison === 'semailles' && !mort;
  const petit = H < 40, mini = H < 22;
  const w0 = Math.max(mini ? 1.6 : 2.2, E.w0 * H), w1 = Math.max(mini ? 1.1 : 1.6, E.w1 * H);
  const tx = cx + E.pen * H + (hachage(1, 1, g) - 0.5) * 0.03 * H, ty = base - E.th * H;
  const ccx = cx + E.pen * H * 1.5, ccy = base - E.cy * H, rxc = E.rx * H * ecartX, ryc = E.ry * H;
  // 1. les touffes du fond (le feuillage derrière les branches), puis le tronc et les branches, puis les touffes de devant
  const tips = [];
  const branche = (x, y, ang, len, w, niv, k) => {
    const x1 = x + Math.cos(ang) * len, y1 = y + Math.sin(ang) * len, ww = w * (niv > 0 ? 0.64 : 0.55);
    traitArbre(put, x, y, x1, y1, Math.max(w, 1), Math.max(ww, mini ? 1 : 0.9), E.mat === 'arbEcorceB' && niv >= 2 && !nu ? 'arbEcorceB' : 'arbEcorce', g + k, { neige: neige && w >= 1.4 });
    if (niv <= 0 || len < 2.2) { tips.push([x1, y1, ang]); return; }
    // (l'arbre mort : des branches cassées, d'autres qui retombent, tordues)
    const nb = mort ? (hachage(k, 5, g) > 0.55 ? 2 : 1) : niv >= 2 && hachage(k, 5, g) > 0.45 ? 3 : 2;
    for (let b = 0; b < nb; b++) {
      const dev = (b - (nb - 1) / 2) * (0.5 + hachage(k, b, g) * 0.4) * (espece === 'bouleau' ? (nu ? 1.1 : 0.6) : 1) + (hachage(k, 7 + b, g) - 0.5) * (mort ? 1.3 : 0.35) + (mort && nb === 1 ? (hachage(k, 8, g) - 0.5) * 1.2 : 0);
      branche(x1, y1, ang + dev, len * (mort ? 0.55 + hachage(k, 9 + b, g) * 0.35 : 0.64 + hachage(k, 9 + b, g) * 0.2), ww, niv - 1, k * 3 + b + 1);
    }
  };
  // le tronc : une courbe douce (tordue pour l'arbre mort), plus fine en haut ; les racines qui s'évasent au pied
  const tord = E.tord || 0.045;
  const troncPts = []; for (let k = 0; k <= 6; k++) { const u = k / 6; troncPts.push([cx + (tx - cx) * u + (fbm(u * 3, 1, g) - 0.5) * tord * H * Math.sin(u * Math.PI) * (mort ? 2 : 1), base - (base - ty) * u]); }
  const dessinerTronc = () => {
    if (E.sansTronc) return;
    for (let k = 0; k < 6; k++) traitArbre(put, troncPts[k][0], troncPts[k][1], troncPts[k + 1][0], troncPts[k + 1][1], w0 + (w1 - w0) * (k / 6), w0 + (w1 - w0) * ((k + 1) / 6), E.mat, g + k, { bouleau: espece === 'bouleau' });
    if (!mini) for (const sens of [-1, 1]) {   // (des racines, de chaque côté)
      for (let r = 0; r < (petit ? 1 : 2); r++) traitArbre(put, cx + sens * w0 * 0.25, base - w0 * (1.6 - r * 0.5), cx + sens * w0 * (1.25 + r * 0.6 + hachage(sens, r, g) * 0.15), base, w0 * 0.55, 1, E.mat, g + 40 + r + sens, { bouleau: false });
    }
  };
  // les grosses branches, du haut du tronc (le buisson : des tiges qui partent du sol)
  const [fx, fy] = E.sansTronc ? [cx, base - 1] : troncPts[6], limbes = E.sansTronc ? 5 : 3;
  const lancer = () => {
    for (let b = 0; b < limbes; b++) {
      const t = limbes === 1 ? 0 : (b / (limbes - 1) - 0.5) * 2;
      const ang = -Math.PI / 2 + t * E.ecart * (espece === 'bouleau' && nu ? 1.9 : 1) * (t < 0 ? ecartG : ecartD) + (hachage(b, 2, g) - 0.5) * (mort ? 0.8 : 0.35);
      branche(fx, fy + w1 * 0.3, ang, E.len * H * (1 - Math.abs(t) * 0.12) * (0.9 + hachage(b, 3, g) * 0.25), (E.sansTronc ? w0 * 0.5 : w1) * (0.95 - Math.abs(t) * 0.12), E.niv - (mini ? 1 : 0), b + 1);
    }
  };
  // les touffes : chacune une masse bosselée, éclairée en haut à gauche
  const touffes = [];
  const ajouterTouffe = (x, y, r) => {
    const i = touffes.length, tirage = hachage(i, 4, g);
    touffes.push({ x, y, r: Math.max(r, 1.8), mat: tirage < 0.5 ? 'arbFeuA' : tirage < 0.8 ? 'arbFeuB' : 'arbFeuC', i });
  };
  const C = { g, ccx, ccy, rxc, ryc, petit, mini, printemps, automne, saison, espece, base, sansTronc: E.sansTronc, neige: neige && !nu };
  const peindreTouffe = t => touffeArbre(put, t, C);
  if (!nu) {
    // les graines de touffes : le bout des branches (on les connaît après les avoir tracées à blanc), puis une spirale qui remplit la couronne
    muet = true; lancer(); muet = false;
    const bouts = tips.splice(0, tips.length);
    for (const [bx, by] of bouts) ajouterTouffe(Math.max(ccx - rxc, Math.min(ccx + rxc, bx + (hachage(bx, 1, g) - 0.5) * E.r * H)), Math.max(ccy - ryc, Math.min(ccy + ryc * 0.9, by + (hachage(by, 2, g) - 0.5) * E.r * H * 0.6)), E.r * H * (0.8 + hachage(bx, by, g) * 0.35));
    for (let i = 0; i < E.n; i++) { const a = i * 2.39996, rr = Math.sqrt((i + 0.5) / E.n); ajouterTouffe(ccx + Math.cos(a) * rr * rxc * 0.92, ccy + Math.sin(a) * rr * ryc * 0.92, E.r * H * (0.82 + hachage(i, 6, g) * 0.34)); }
    for (const t of touffes) if (automne && hachage(t.i, 11, g) < 0.2) t.r = 0;   // (l'automne : des trous, les feuilles sont tombées)
    touffes.sort((a, b) => a.y - b.y || a.x - b.x);
    const devant = t => { const centre = Math.abs(t.x - cx) < 0.13 * H && t.y > ccy + 0.2 * ryc; return !centre && hachage(t.i, 12, g) > 0.52; };
    for (const t of touffes) if (t.r > 0 && !devant(t)) peindreTouffe(t);
    dessinerTronc(); lancer();
    for (const t of touffes) if (t.r > 0 && devant(t)) peindreTouffe(t);
  } else {
    dessinerTronc(); lancer();
    // (nu : quelques rameaux fins au bout des branches ; l'arbre mort a ses moignons)
    if (!mini && espece !== 'bouleau') for (const [bx, by, ang] of tips) for (let b = -1; b <= 1; b += espece === 'saule' || mort ? 2 : 1) traitArbre(put, bx, by, bx + Math.cos(ang + b * (mort ? 0.9 : 0.6)) * H * (mort ? 0.045 : 0.07), by + Math.sin(ang + b * (mort ? 0.9 : 0.6)) * H * (mort ? 0.045 : 0.07), 1, 0.8, 'arbEcorce', g + 60 + b, { neige: false });
    // (la mousse grise qui pend des branches mortes, dans les marais)
    if (mort && mousse && !mini) for (const [bx, by] of tips) if (hachage(Math.round(bx), Math.round(by), g + 70) > 0.45) { const l = Math.round(H * (0.06 + hachage(Math.round(bx), 2, g) * 0.1)); for (let y = 0; y < l; y++) put(bx + Math.sin(y * 0.5) * 0.7, by + 1 + y, y % 3 ? 'arbFeuA' : 'arbFeuC', 2 + (y < 2 ? 1 : 0)); }
  }
  // le saule : ses longues branches qui pendent du bord de la couronne
  if (espece === 'saule') {
    const n = Math.max(6, Math.round(rxc * 0.6));
    for (let k = 0; k < n; k++) {
      const u = (k + hachage(k, 20, g) * 0.8) / n * 2 - 1;
      if (Math.abs(u) < 0.16) continue;   // (le tronc reste visible)
      const X0 = ccx + u * rxc * 0.97, Y0 = ccy + Math.sqrt(Math.max(0, 1 - u * u)) * ryc * 0.75;
      const long = (0.34 + hachage(k, 21, g) * 0.3) * H * (1 - Math.abs(u) * 0.2), epais = hachage(k, 22, g) > 0.55 && H >= 60;
      if (nu && k % 2) continue;   // (l'hiver : la moitié des branches seulement)
      for (let y = 0; y < long; y++) {
        const X = Math.round(X0 + Math.sin(y * 0.3 + k) * 0.8), Y = Math.round(Y0 + y);
        if (Y > base - 2) break;
        if (nu) { put(X, Y, 'arbEcorce', 2 + (y % 5 === 0 ? 1 : 0)); continue; }
        const ton = 2 + (y % 3 === 0 ? 1 : 0) + (long - y < 4 ? 1 : 0) + (u < 0 ? 1 : 0) - (y < 5 ? 1 : 0), m = hachage(k, y >> 2, g) > 0.5 ? 'arbFeuA' : 'arbFeuB';
        put(X, Y, m, ton); if (epais) put(X + 1, Y, m, ton - 1);
      }
    }
  }
  // l'aulne l'hiver : ses chatons bruns qui pendent
  if (espece === 'aulne' && nu && !petit) for (const [bx, by] of tips) if (hachage(Math.round(bx), 5, g) > 0.5) { put(bx, by + 1, 'arbEcorce', 3); put(bx, by + 2, 'arbEcorce', 2); }
  piedArbre(put, { cx, base, H, g, neige, automne, printemps: printemps && (espece === 'pommier' || espece === 'buisson'), mini, sec: mort });
}

// Une touffe de feuillage : une masse bosselée, éclairée en haut à gauche (et aussi par la couronne entière : `C.ccx`,
// `C.ccy`, `C.rxc`, `C.ryc`), de petits paquets de feuilles, des éclats ; les fleurs, les pommes
function touffeArbre(put, t, C) {
  const { g, ccx, ccy, rxc, ryc, petit, mini, printemps, automne, saison, espece, base, sansTronc, neige = false } = C;
  const { x, y, r, mat, i } = t, rx = r * 1.1, ry = r * 0.95, gg = g + 100 + i * 7;
  for (let Y = Math.floor(y - ry) - 1; Y <= Math.ceil(y + ry) + 1; Y++) for (let X = Math.floor(x - rx) - 1; X <= Math.ceil(x + rx) + 1; X++) {
    if (sansTronc && Y > base) continue;
    const nx = (X + 0.5 - x) / rx, ny = (Y + 0.5 - y) / ry, d0 = Math.hypot(nx, ny);
    const d = d0 + (fbm(X * 0.55, Y * 0.55, gg) - 0.5) * (petit ? 0.45 : 0.7);
    if (d > 1) continue;
    const z = Math.sqrt(Math.max(0, 1 - Math.min(1, d0 * d0)));
    if (neige && ny < -0.5 + (fbm(X * 0.6, Y * 0.6, gg + 14) - 0.5) * 0.3 && hachage(X, Y, gg + 15) > 0.1) { put(X, Y, 'arbNeige', nx < 0.2 ? 5 : 3); continue; }   // (la neige posée sur le feuillage)
    let lum = -(nx * 0.55 + ny * 0.72) * 0.62 + z * 0.5 - ((X - ccx) / rxc * 0.5 + (Y - ccy) / ryc * 0.7) * 0.32;
    let k = 2.05 + lum * 2.5;
    const f = fbm(X * 0.42, Y * 0.42, gg + 1);
    k += f > 0.64 ? 1 : f < 0.34 ? -1 : 0;
    const h1 = hachage(X, Y, gg + 2);
    if (h1 > 0.93) k += 1; else if (h1 < 0.05) k -= 1;
    if (d > 0.8 && ny > -0.15) k -= 1;   // (le dessous du bouquet, dans l'ombre)
    let m = mat;
    if (printemps && espece === 'pommier' && !mini && fbm(X * 0.5, Y * 0.5, gg + 8) > 0.5) { put(X, Y, hachage(X, Y, gg + 9) > 0.8 ? 'arbFleurB' : 'arbFleur', k + 1); continue; }   // (le pommier en fleurs)
    if (printemps && espece === 'buisson' && !mini && hachage(X, Y, gg + 11) > 0.955) { put(X, Y, 'arbFleurB', 4); continue; }   // (le buisson fleuri)
    if (printemps && espece !== 'pommier' && !petit && hachage(X, Y, gg + 11) > 0.985) { put(X, Y, 'arbFleurB', 4); continue; }   // (quelques chatons, quelques fleurs)
    if (automne && hachage(X >> 1, Y >> 1, gg + 12) > 0.8) m = 'arbFeuB';              // (des feuilles plus claires)
    put(X, Y, m, k);
    if (saison === 'moissons' && espece === 'pommier' && !petit && hachage(X, Y, gg + 10) > 0.986 && lum > -0.2) { put(X, Y, 'arbPomme', 4); put(X + 1, Y, 'arbPomme', 2); put(X, Y + 1, 'arbPomme', 2); put(X + 1, Y + 1, 'arbPomme', 1); }   // (une pomme)
  }
}

// Au pied : de l'herbe ; l'hiver un monticule de neige ; l'automne des feuilles tombées ; au printemps des pétales
function piedArbre(put, { cx, base, H, g, neige, automne, printemps, mini, sec = false }) {
  if (mini) return;
  if (neige) {
    const rr = 0.15 * H, h = Math.max(2, Math.round(0.03 * H));
    for (let X = Math.round(cx - rr); X <= Math.round(cx + rr); X++) { const hh = Math.round(h * Math.sqrt(Math.max(0, 1 - ((X - cx) / rr) ** 2))); for (let y = 0; y < hh; y++) put(X, base + 1 - y, 'arbNeige', y === hh - 1 ? 5 : 3 + (X < cx ? 1 : 0)); }
  } else if (!sec) {
    for (let k = 0; k < Math.round(0.14 * H); k++) { const X = Math.round(cx + (hachage(k, 30, g) - 0.5) * 0.7 * H), Y = base + Math.round(hachage(k, 31, g) * 2);
      if (automne) put(X, Y, ['arbFeuA', 'arbFeuB', 'arbFeuC'][k % 3], 3 + (k % 2));
      else if (printemps) put(X, Y, k % 2 ? 'arbFleur' : 'arbFleurB', 4);
      else if (k % 3 === 0) { put(X, Y, 'arbFeuC', 3); put(X, Y - 1, 'arbFeuA', 3); } }
  }
}

// Le sapin : un tronc court, des étages de branches qui retombent (de plus en plus courts vers la pointe), leurs bords en
// aiguilles, la lumière à gauche ; là où il neige, la neige posée sur chaque étage, juste sous les branches de l'étage du dessus
function peindreSapin(put1, { cx, base, H, graine = 1, neige = false, etroit = 1 }) {
  const put = (x, y, m, i) => put1(Math.round(x), Math.round(y), m, Math.max(0, Math.min(5, Math.round(i))));
  const g = graine * 977 + 7001, mini = H < 22, n = Math.max(3, Math.min(10, Math.round(H / 13)));
  traitArbre(put, cx, base, cx, base - 0.2 * H, Math.max(2, 0.075 * H), Math.max(1.5, 0.055 * H), 'arbEcorce', g);
  const top = base - H, bot = base - 0.1 * H, W = (0.27 + hachage(1, 9, g) * 0.04) * H * etroit, pas = (bot - top) / n;
  const bas = e => bot - (bot - top) * (e / n) * 0.93;
  for (let e = 0; e < n; e++) {
    // (chaque étage a sa largeur, un peu de travers ; ses branches retombent vers le bout)
    const yb = bas(e), hE = pas * 1.75, w = W * (1 - (e / n) * 0.86) * (0.88 + hachage(e, 3, g) * 0.24) + 1, ybSuiv = e + 1 < n ? bas(e + 1) : -1e9;
    const biais = (hachage(e, 4, g) - 0.5) * 0.18, retombe = pas * 0.45, ya = yb - hE;
    for (let y = Math.floor(ya); y <= Math.ceil(yb + retombe); y++) for (let x = Math.floor(cx - w * 1.2 - 1); x <= Math.ceil(cx + w * 1.2 + 1); x++) {
      const u = (x + 0.5 - cx) / w, ybx = yb + retombe * u * u + biais * u * pas;   // (le bas de l'étage, plus bas au bout des branches)
      const f = (ybx - y) / hE; if (f < 0 || f > 1) continue;
      const demi = w * Math.pow(1 - f, 0.85) * (1 + (fbm(y * 0.5, e, g) - 0.5) * 0.2);
      {
        const dx = (x + 0.5 - cx) / Math.max(1, demi); if (Math.abs(dx) > 1) continue;
        if (f < 0.12 && hachage(x, e, g) > 0.55) continue;                // (le bord des branches : des aiguilles)
        if (Math.abs(dx) > 0.8 && hachage(x, y, g + 1) > 0.62) continue;
        // la neige, sur le dessus de l'étage, juste sous l'étage suivant (à gauche surtout, où le soleil ne l'a pas fondue)
        if (neige && y >= ybSuiv - 1 && y <= ybSuiv + Math.max(2, pas * 0.35) && dx < 0.55 && hachage(x, y, g + 4) > 0.18) { put(x, y, 'arbNeige', dx < 0 ? 5 : 4); continue; }
        let k = 2.6 - dx * 1.25 + f * 0.5 - (f < 0.2 ? 0.9 : 0) + (fbm(x * 0.6, y * 0.6, g + 2) - 0.5) * 1.4;
        if ((((x - Math.round(y * 0.8) + e) % 3) + 3) % 3 === 0) k -= 0.6;   // (les aiguilles, en biais)
        if (hachage(x, y, g + 3) > 0.94) k += 1;
        put(x, y, k < 1.6 ? 'arbFeuC' : hachage(x >> 1, y >> 1, g + 5) > 0.75 ? 'arbFeuB' : 'arbFeuA', k);
      }
    }
  }
  for (let y = Math.floor(top) - 2; y < top + 3; y++) put(cx, y, neige && y < top ? 'arbNeige' : 'arbFeuA', 3);   // (la pointe)
  piedArbre(put, { cx, base, H, g, neige, automne: false, printemps: false, mini, sec: true });
}

// Le cyprès : une flamme sombre, haute et serrée, ses touffes en longues mèches verticales
function peindreCypres(put1, { cx, base, H, graine = 1, neige = false }) {
  const put = (x, y, m, i) => put1(Math.round(x), Math.round(y), m, Math.max(0, Math.min(5, Math.round(i))));
  const g = graine * 977 + 7301, mini = H < 22;
  traitArbre(put, cx, base, cx, base - 0.12 * H, Math.max(2, 0.06 * H), Math.max(1.5, 0.045 * H), 'arbEcorce', g);
  const top = base - H, bas = base - 0.07 * H, W = (0.1 + hachage(2, 9, g) * 0.02) * H;
  for (let y = Math.floor(top); y <= bas; y++) {
    const t = (y - top) / (bas - top), demi = W * Math.sin(Math.min(1, t * 1.06) * Math.PI * 0.95) + 1;
    for (let x = Math.floor(cx - demi - 1); x <= Math.ceil(cx + demi + 1); x++) {
      const dx = (x + 0.5 - cx) / demi; if (Math.abs(dx) > 1) continue;
      if (Math.abs(dx) > 0.78 && hachage(x, y, g + 1) > 0.55) continue;
      if (neige && dx < 0.2 && hachage(x, y >> 1, g + 4) > 0.86) { put(x, y, 'arbNeige', 4); continue; }
      let k = 2.8 - dx * 1.4 - t * 0.4 + (fbm(x * 0.9, y * 0.14, g + 2) - 0.5) * 1.8;
      if (fbm(x * 0.5, y * 0.22, g + 3) > 0.62) k += 0.8;
      put(x, y, k < 1.6 ? 'arbFeuC' : 'arbFeuA', k);
    }
  }
  piedArbre(put, { cx, base, H, g, neige, automne: false, printemps: false, mini, sec: true });
}

// Le palmier (l'oasis, les côtes chaudes) : un stipe qui se courbe, cerclé d'anneaux, et sa couronne de palmes qui
// retombent en arc, chacune avec ses folioles ; des dattes sous la couronne
function peindrePalmier(put1, { cx, base, H, graine = 1, neige = false }) {
  const put = (x, y, m, i) => put1(Math.round(x), Math.round(y), m, Math.max(0, Math.min(5, Math.round(i))));
  const g = graine * 977 + 7601, sens = hachage(1, 2, g) > 0.5 ? 1 : -1, courbe = (0.1 + hachage(2, 2, g) * 0.08) * H * sens;
  const pt = u => [cx + courbe * u * u, base - u * H * 0.82];
  for (let k = 0; k < 10; k++) { const [x0, y0] = pt(k / 10), [x1, y1] = pt((k + 1) / 10), w = Math.max(2, 0.07 * H * (1 - k / 14)); traitArbre(put, x0, y0, x1, y1, w, w * 0.94, 'arbEcorce', g + k); }
  for (let k = 1; k < 26; k++) { const [x, y] = pt(k / 26), w = Math.max(1, 0.035 * H * (1 - k / 40)); for (let j = -Math.ceil(w); j <= Math.ceil(w); j++) put(x + j, y, 'arbEcorce', 1 + (j < 0 ? 1 : 0)); }   // (les anneaux du stipe)
  const [tx, ty] = pt(1);
  for (let k = 0; k < 5; k++) put(tx - 2 + k, ty + 2 + (k % 2), 'arbEcorce', 1);   // (les dattes, sous la couronne)
  const n = 9;
  for (let p = 0; p < n; p++) {
    const a = -Math.PI / 2 + (p / (n - 1) - 0.5) * 2 * 1.5 + (hachage(p, 3, g) - 0.5) * 0.25, L = H * (0.32 + hachage(p, 4, g) * 0.12), tombe = 0.55 + Math.abs(Math.cos(a)) * 0.5;
    let px = tx, py = ty;
    for (let s2 = 1; s2 <= 22; s2++) {
      const u = s2 / 22, x = tx + Math.cos(a) * L * u, y = ty + Math.sin(a) * L * u + tombe * L * u * u;
      const m = p % 3 === 0 ? 'arbFeuC' : p % 3 === 1 ? 'arbFeuA' : 'arbFeuB', k = 3.2 - (Math.cos(a) > 0 ? 0.6 : 0) - u * 0.8;
      traitArbre((X, Y, mm, i) => put(X, Y, m, k + (i - 2.5) * 0.3), px, py, x, y, 1.6, 1.2, m, g + p);
      // les folioles, de chaque côté de la nervure, qui pendent
      for (const c of [-1, 1]) { const l = Math.max(1, Math.round((1 - u * 0.7) * H * 0.1 + 1)); for (let q = 1; q <= l; q++) put(x + c * q * 0.55, y + q * 0.85, m, k - 0.3 - q * 0.12 + (c < 0 ? 0.3 : 0)); }
      if (neige && s2 % 3 === 0 && u < 0.7) put(x, y - 1, 'arbNeige', 4);
      px = x; py = y;
    }
  }
}

// La largeur de toile qu'il faut à une espèce de hauteur H (en pixels de la toile)
function largeurArbre(espece, H) {
  const k = { sapin: 0.7, cypres: 0.32, bouleau: 0.66, ambrenne: 1.05, aulne: 0.86, buisson: 1.15, mort: 1.0, palmier: 0.95 }[espece] || 1.1;
  return Math.round(H * k) + 8;
}

// Un arbre sur sa propre toile (×2), mis en cache. `cote` : -1 pour retenir les branches de gauche (l'arbre est à
// droite, un passage ou des bottes à sa gauche), 1 pour celles de droite. `opts` : { neige, couleur, mousse }.
function arbreHD(scene, espece, saison, H, graine = 1, cote = 0, opts = {}) {
  const { neige = saison === 'givre', couleur = null, mousse = false } = opts;
  const cle = `arbreHD_${espece}_${saison}_${H}_${graine}_${cote}${neige === (saison === 'givre') ? '' : neige ? '_n' : '_s'}${couleur === null ? '' : '_' + couleur.toString(16)}${mousse ? '_m' : ''}`;
  return toileArbreHD(scene, cle, espece, saison, H, graine, { cote, neige, couleur, mousse });
}
// La toile d'un arbre, mise en cache sous `cle`. `L`, `Ht` : pour imposer la taille de la toile (le pied reste à
// PIED_ARBRE lignes du bas).
function toileArbreHD(scene, cle, espece, saison, H, graine = 1, { cote = 0, neige = saison === 'givre', couleur = null, mousse = false, L = null, Ht = null, etroit = 1, ecartX = 1 } = {}) {
  if (scene.textures.exists(cle)) return cle;
  const l = L || (espece === 'chene' || espece === 'pommier' || espece === 'saule' ? Math.round(H * 1.1) + 6 : largeurArbre(espece, H));
  const h = Ht || Math.round(H * 1.08) + 5, base = h - PIED_ARBRE;   // (un peu de ciel au-dessus : la couronne déborde parfois de H)
  const t = toileDecor(l, h); Object.assign(t.rampes, rampesArbre(saison, espece, couleur));
  peindreArbre((x, y, m, i) => t.poser(x, y, m, i), { cx: Math.floor(l / 2), base, H, espece, saison, graine, ecartG: cote < 0 ? 0.5 : 1, ecartD: cote > 0 ? 0.55 : 1, neige, mousse, etroit, ecartX });
  // (v1.64, retours du joueur : « pourquoi l'hiver les arbres ne sont pas remplis de neige ? ») l'hiver, là où il neige, les
  // arbres nus gardent la neige sur toutes leurs branches, jusqu'aux rameaux : sur le dessus de chaque branche, un ou deux
  // rangs de neige (plus épais à gauche, côté soleil, moins sous les branches qui la couvrent) ; le tronc n'en a pas
  if (neige && saison === 'givre' && !TOUJOURS_VERTS.includes(espece)) {
    const yTronc = base - Math.round(0.3 * H), bois = m => m === 'arbEcorce' || m === 'arbEcorceB';
    // 1. le dessus de chaque branche se couvre : la neige s'y pose en bourrelet, et recouvre l'écorce de ses premiers rangs ;
    //    dans la couronne, elle s'accroche aussi aux branches de dessous (plus grise : à l'ombre des branches du dessus)
    const avant = t.m.slice();   // (on lit l'arbre tel qu'il était peint : la neige posée ne change pas la suite)
    const bv = (x, y) => x >= 0 && y >= 0 && x < l && y < h && bois(avant[y * l + x]);
    for (let y = 1; y < yTronc; y++) for (let x = 0; x < l; x++) {
      if (!bv(x, y)) continue;
      const d = !bv(x, y - 1) ? 0 : !bv(x, y - 2) ? 1 : 2, q = hachage(x, y, graine * 31 + 10);
      const gauche = x < l / 2 + (hachage(x >> 2, y >> 2, graine * 31 + 9) - 0.5) * 6;
      if (d === 0) { if (avant[(y - 1) * l + x] === null && q > 0.05) t.poser(x, y - 1, 'arbNeige', gauche ? 5 : 4); t.poser(x, y, 'arbNeige', gauche ? 4 : 3); }
      else if (d === 1 && q > 0.35) t.poser(x, y, 'arbNeige', gauche ? 3 : 2);
      else if (q > 0.82) t.poser(x, y, 'arbNeige', 2);
    }
    // 2. là où les rameaux sont serrés, la neige comble les creux : des paquets accrochés dans la couronne
    const ajouts = [];
    for (let y = 1; y < yTronc - 2; y++) for (let x = 1; x < l - 1; x++) {
      if (t.mat(x, y) !== null) continue;
      let n = 0; for (const [a, c] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) { const m = t.mat(x + a, y + c); if (m === 'arbNeige' || bois(m)) n++; }
      if (n >= 4 && hachage(x, y, graine * 31 + 11) > 0.25) ajouts.push([x, y]);
    }
    for (const [x, y] of ajouts) t.poser(x, y, 'arbNeige', x < l / 2 ? 5 : 4);
  }
  t.contour(); t.texture(scene, cle);
  return cle;
}
const PIED_ARBRE = 3;   // (les lignes de la toile sous le pied de l'arbre)
// L'origine verticale d'une toile d'arbre pour que le pied (et non le bas de la toile) se pose au point donné
function origineArbre(scene, cle) { const h = scene.textures.get(cle).getSourceImage().height || 1; return 1 - PIED_ARBRE / h; }

// --- Les arbres de chaque contrée ---
// La saison des arbres d'une contrée : celle de l'année, sauf là où l'hiver ne finit jamais (les neiges) ; et s'il y
// a de la neige sur les branches (seulement là où le paysage est enneigé)
function saisonArbresContree(biome) {
  const s = typeof saisonActuelle === 'function' ? saisonActuelle() : null;
  return ['neige', 'citadelle'].includes(biome) ? 'givre' : biome === 'val' ? 'brumes' : s || 'moissons';   // (planche 91 : le val d'Ardévanne garde son automne)
}
function neigeArbresContree(biome, saison) {
  return ['neige', 'citadelle'].includes(biome) || (biome === 'comte' && saison === 'givre');
}
// Les essences de chaque contrée (on tire dans la liste ; jamais deux fois de suite la même, à côté)
const ESSENCES_CONTREE = {
  comte: ['chene', 'chene', 'pommier', 'bouleau'], foret: ['sapin', 'sapin', 'chene', 'sapin', 'bouleau'], monastere: ['cypres', 'chene', 'cypres', 'saule'],
  sanctuaire: ['ambrenne', 'ambrenne', 'ambrenne'], val: ['chene', 'chene', 'bouleau'], cote: ['chene', 'bouleau', 'saule'], repaire: ['sapin', 'mort', 'sapin'], bourbier: ['mort', 'saule', 'mort'],
  marais: ['mort', 'saule', 'mort'], nuitPourpre: ['mort'], neige: ['sapin'], citadelle: ['sapin'], tour: ['mort'],
};
function essenceContree(biome, k) {
  const l = ESSENCES_CONTREE[biome] || ESSENCES_CONTREE.comte;
  return l[((k % l.length) + l.length) % l.length];
}

// --- Les arbres des récits (les épreuves) : de la saison et de la contrée, en cache ; `v` : la variante ---
// `sorte` : 'feuillu' (l'essence de la contrée : sapin dans les neiges, palmier au désert), 'chene', 'pommier',
// 'mort', 'buisson' (l'hiver, un buis toujours vert sous la neige : on peut encore s'y cacher), 'palmier'
const NEIGES_RECIT = ['neige', 'citadelle', 'montagne', 'glace'];
function arbreRecitHD(scene, sorte, biome = 'comte', v = 0) {
  const froid = NEIGES_RECIT.includes(biome), sa = froid ? 'givre' : saisonArbresContree(biome), neige = froid || neigeArbresContree(biome, sa);
  let esp = sorte;
  if (sorte === 'feuillu') esp = froid ? 'sapin' : ['desert', 'oasis'].includes(biome) ? 'palmier' : ['chene', 'aulne', 'chene', 'bouleau'][v % 4];
  const cle = `arbreRecit_${esp}_${sa}${neige ? '_n' : ''}_${v}`;
  if (esp === 'buisson') return sa === 'givre' ? toileArbreHD(scene, cle, 'buisson', 'moissons', 26, 60 + v, { neige: true, couleur: 0x2e5232, L: 48, Ht: 30, ecartX: 1.45 })
    : toileArbreHD(scene, cle, 'buisson', sa, 26, 60 + v, { neige, L: 48, Ht: 30, ecartX: 1.45 });
  if (esp === 'palmier') return toileArbreHD(scene, cle, 'palmier', 'moissons', 66, 61 + v, { neige: false, L: 64, Ht: 72 });
  return toileArbreHD(scene, cle, esp, sa, 100, 62 + v * 5, { neige, mousse: esp === 'mort' && ['marais', 'bourbier'].includes(biome) });
}
// les feuilles qui tombent d'un arbre secoué (l'hiver : la neige des branches)
function couleurFeuillesRecit(biome = 'comte') {
  const sa = NEIGES_RECIT.includes(biome) ? 'givre' : saisonArbresContree(biome);
  return { semailles: 0x6aa83e, moissons: 0x3f7a34, brumes: 0xc8702a, givre: 0xe8eef4 }[sa] || 0x3f7a34;
}

// Un arbre sur mesure (l'arbre penché du ravin, dont la branche passe au-dessus du vide) : des traits (le tronc, les
// branches) [x0, y0, x1, y1, w0, w1] et des touffes [x, y, r], en pixels de la toile ; l'hiver, nu (et neigeux s'il le faut)
function arbreSurMesureHD(scene, cle, l, h, { traits = [], touffes = [], saison = 'moissons', espece = 'chene', neige = saison === 'givre', graine = 5 } = {}) {
  if (scene.textures.exists(cle)) return cle;
  const t = toileDecor(l, h); Object.assign(t.rampes, rampesArbre(saison, espece));
  const put = (x, y, m, i) => t.poser(Math.round(x), Math.round(y), m, Math.max(0, Math.min(5, Math.round(i))));
  const g = graine * 977 + 8101, nu = saison === 'givre';
  const xs = touffes.map(p => p[0]), ys = touffes.map(p => p[1]);
  const C = { g, ccx: (Math.min(...xs, l) + Math.max(...xs, 0)) / 2, ccy: (Math.min(...ys, h) + Math.max(...ys, 0)) / 2, rxc: Math.max(8, (Math.max(...xs, 0) - Math.min(...xs, l)) / 2 + 6), ryc: Math.max(8, (Math.max(...ys, 0) - Math.min(...ys, h)) / 2 + 6),
    petit: false, mini: false, printemps: saison === 'semailles', automne: saison === 'brumes', saison, espece, base: h, sansTronc: false };
  const T = touffes.map(([x, y, r], i) => ({ x, y, r, i, mat: ['arbFeuA', 'arbFeuB', 'arbFeuC'][Math.floor(hachage(i, 4, g) * 3)] }));
  if (!nu) T.filter((p, i) => i % 2).forEach(p => touffeArbre(put, p, C));
  traits.forEach(([x0, y0, x1, y1, w0, w1], k) => traitArbre(put, x0, y0, x1, y1, w0, w1, 'arbEcorce', g + k, { neige: neige && w1 >= 1.4 }));
  if (!nu) T.filter((p, i) => i % 2 === 0).forEach(p => touffeArbre(put, p, C));
  else {
    // (nu) au bout de chaque branche fine, des rameaux qui fourchent deux fois (comme les arbres nus de peindreArbre)
    const fourche = (x, y, a, L, w, niv, k) => {
      const x1 = x + Math.cos(a) * L, y1 = y + Math.sin(a) * L;
      traitArbre(put, x, y, x1, y1, w, Math.max(0.5, w * 0.7), 'arbEcorce', g + 50 + k, { neige: neige && niv === 3 });
      if (niv > 0) for (const c of [-1, 1]) fourche(x1, y1, a + c * (0.42 + hachage(k, c + 3, g) * 0.25) - 0.08, L * 0.68, Math.max(0.5, w * 0.7), niv - 1, k * 3 + c + 2);
    };
    traits.forEach(([x0, y0, x1, y1, w0, w1], k) => { if (w1 <= 2.6) fourche(x1, y1, Math.atan2(y1 - y0, x1 - x0), 7 + hachage(k, 9, g) * 4, Math.min(1.3, w1), 3, k + 1); });
  }
  t.contour(); t.texture(scene, cle);
  return cle;
}

// --- (planche 91, validée) L'ambrenne, l'arbre doré de Sérambre ---
// Son tronc : trois (ou cinq) brins de bois cuivré qui s'enroulent l'un autour de l'autre comme une corde, du vert-de-gris
// dans les creux ; en haut, les brins se dénouent et deviennent les maîtresses branches. Ses feuilles se recouvrent comme
// des écailles d'or (on voit le bord arrondi de chacune) ; elle reste d'or toute l'année (un or plus pâle aux Semailles,
// plus cuivré aux Brumes). Des ombres ambrées, jamais olive.
const OR_A = [0x4a2008, 0x7a3e0c, 0xae6a16, 0xd89a22, 0xf0c23e, 0xfce48a], OR_B = [0x5a2c0a, 0x8a4e10, 0xc08020, 0xe6b232, 0xf8d65a, 0xfff2b0], OR_C = [0x3a1606, 0x62300c, 0x904c14, 0xb8701e, 0xd8962e, 0xf0c060];
const ORS_AMBRENNE = (() => { const pale = r => r.map(c => melangeCouleur(c, 0xfff4c0, 0.12)), cuivre = r => r.map(c => melangeCouleur(c, 0xc0501a, 0.14));
  return { moissons: [OR_A, OR_B, OR_C], semailles: [pale(OR_A), pale(OR_B), OR_C], brumes: [cuivre(OR_A), OR_B, cuivre(OR_C)], givre: [OR_A, pale(OR_B), OR_C] }; })();
const RAMPE_CUIVRE = [0x2e1208, 0x5a2810, 0x8a4420, 0xb8662e, 0xdc9048, 0xf6c47c];
const RAMPE_VERTDEGRIS = [0x14302c, 0x22483e, 0x346a58, 0x4e8a72, 0x74ac90, 0xa8d2b8];
const RAMPE_ECLAT_OR = [0x8a6410, 0xc09028, 0xe8c048, 0xf8e07c, 0xfff2b4, 0xfffbe8];
function rampesAmbrenne(saison) {
  const f = ORS_AMBRENNE[saison || 'moissons'] || ORS_AMBRENNE.moissons;
  return { arbFeuA: f[0], arbFeuB: f[1], arbFeuC: f[2], arbEcorce: RAMPE_CUIVRE, arbEcorceB: RAMPE_CUIVRE, arbVert: RAMPE_VERTDEGRIS, arbFleur: RAMPE_ECLAT_OR,
    arbFleurB: [0xc8b8c0, 0xe4dce0, 0xf4eef2, 0xfffafc, 0xffffff, 0xffffff], arbPomme: rampeVive(0xc82828), arbNeige: [0x8a96a8, 0xaab6c8, 0xc8d2e0, 0xdce4ee, 0xeef2f8, 0xffffff] };
}

// --- La torsade : des brins qui s'enroulent le long d'un chemin ---
// chemin(u) → [x, y] pour u de 0 (le pied) à 1 ; largeur(u) : la demi-largeur de toute la torsade ; nb brins ;
// tours : combien de fois ils font le tour ; mat : la matière (le cuivre), matV : le vert-de-gris des creux.
// Une mémoire de profondeur (zb) : un brin de derrière ne repeint jamais un brin de devant au même endroit.
function torsade(put, chemin, { largeur, nb = 3, tours = 1.2, phase = 0, mat = 'arbEcorce', matV = 'arbVert', g = 1, zb = null, pas = 0.35, ecart = 0.5, fibres = true }) {
  const P0 = chemin(0), P1 = chemin(1);
  let L = 0, prev = P0; for (let i = 1; i <= 40; i++) { const p = chemin(i / 40); L += Math.hypot(p[0] - prev[0], p[1] - prev[1]); prev = p; }
  const n = Math.max(8, Math.ceil(L / pas)), Z = zb || new Map();
  for (let j = 0; j <= n; j++) {
    const u = j / n, [x, y] = chemin(u), [xa, ya] = chemin(Math.max(0, u - 0.004)), [xb, yb] = chemin(Math.min(1, u + 0.004));
    let tx = xb - xa, ty = yb - ya; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
    const nx = -ty, ny = tx, W = largeur(u), R = W * ecart, ws = W * (nb >= 4 ? 0.5 : 0.6);
    const brins = [];
    for (let b = 0; b < nb; b++) { const ph = phase + b * Math.PI * 2 / nb + u * tours * Math.PI * 2; brins.push({ b, off: Math.sin(ph) * R, z: Math.cos(ph) }); }
    brins.sort((p, q) => p.z - q.z);
    for (const B of brins) {
      const r = Math.max(0.7, ws * (0.92 + B.z * 0.08));
      for (let a = -r - 0.5; a <= r + 0.5; a += 0.5) {
        const ar = a / r; if (Math.abs(ar) > 1) continue;
        const X = Math.round(x + nx * (B.off + a)), Y = Math.round(y + ny * (B.off + a)), cle = Y * 4096 + X;
        const p = Z.get(cle); if (p && p.z > B.z + 0.02 && Math.abs(p.j - j) < n * 0.08) continue;
        Z.set(cle, { z: B.z, j });
        // la lumière vient d'en haut à gauche ; le brin de derrière est dans l'ombre des autres
        const sz = Math.sqrt(1 - ar * ar), lum = (nx * ar) * -0.6 + (ny * ar) * -0.55 + sz * 0.6;
        let k = 1.05 + (lum + 0.2) * 2.9 + B.z * 0.8;
        if (fibres) k += (fbm(j * pas * 0.35 + B.b * 7, ar * 1.6 + B.b, g) - 0.5) * 1.5;   // (les fibres du bois, le long du brin)
        if (Math.abs(ar) > 0.74) k -= 1.4;   // (le sillon entre deux brins)
        const h = hachage(X, Y, g + 5);
        if (k < 2.2 && h > 0.83) { put(X, Y, matV, 2 + (h > 0.93 ? 1 : 0)); continue; }   // (le vert-de-gris, dans les creux)
        if (h < 0.03) k += 1.4;   // (un éclat de cuivre poli)
        put(X, Y, mat, k);
      }
    }
  }
  return Z;
}

// Une touffe d'écailles d'or : chaque feuille est une écaille ronde dont le bas recouvre celle d'en dessous ;
// on voit son bord, sombre, et le haut de chacune qui accroche la lumière. Éclairée en haut à gauche, comme les autres.
function touffeEcailles(put, t, C) {
  const { g, ccx, ccy, rxc, ryc, petit, base } = C;
  const { x, y, r, mat, i } = t, rx = r * 1.12, ry = r * 0.92, gg = g + 100 + i * 7;
  const hS = Math.max(1.6, (C.ecaille || r * 0.3) * (0.85 + hachage(i, 21, g) * 0.3)), wS = hS * 1.7, oy = hachage(i, 22, g) * hS;
  for (let Y = Math.floor(y - ry) - 1; Y <= Math.ceil(y + ry) + 1; Y++) for (let X = Math.floor(x - rx) - 1; X <= Math.ceil(x + rx) + 1; X++) {
    if (Y > base) continue;
    const nx = (X + 0.5 - x) / rx, ny = (Y + 0.5 - y) / ry, d0 = Math.hypot(nx, ny);
    const d = d0 + (fbm(X * 0.5, Y * 0.5, gg) - 0.5) * (petit ? 0.4 : 0.55);
    if (d > 1) continue;
    const z = Math.sqrt(Math.max(0, 1 - Math.min(1, d0 * d0)));
    let lum = -(nx * 0.55 + ny * 0.72) * 0.6 + z * 0.5 - ((X - ccx) / rxc * 0.5 + (Y - ccy) / ryc * 0.7) * 0.3;
    let k = 2.1 + lum * 2.4;
    // l'écaille : rangées décalées ; la plus haute qui couvre le pixel est celle qu'on voit
    const r0 = Math.floor((Y + 0.5 - oy) / hS);
    let vu = null;
    for (let rr = r0 - 2; rr <= r0 && !vu; rr++) {
      const dec = (rr & 1 ? wS / 2 : 0) + hachage(rr, 3, gg) * wS;
      const col0 = Math.round((X + 0.5 - dec) / wS);
      for (let col = col0 - 1; col <= col0 + 1; col++) {
        const jx = (hachage(col, rr, gg + 8) - 0.5) * wS * 0.4, jy = (hachage(col, rr, gg + 9) - 0.5) * hS * 0.4;
        const ex = (X + 0.5 - (col * wS + dec + jx)) / (wS * 0.62), ey = (Y + 0.5 - (rr * hS + oy + jy)) / (hS * 1.55);
        if (ey >= 0 && ex * ex + ey * ey <= 1) { vu = { ex, ey, e: Math.sqrt(ex * ex + ey * ey), col, rr }; break; }
      }
    }
    if (vu) {
      if (vu.e > 0.78 && vu.ey > 0.32) k -= 1.2 + (lum < 0 ? 0.4 : 0);          // (le bord arrondi de l'écaille, dans l'ombre de celle d'en dessous)
      else if (vu.ey < 0.34 && Math.abs(vu.ex) < 0.55) k += 0.9;   // (le haut, qui accroche la lumière)
      if (hachage(vu.col, vu.rr, gg + 4) > 0.82) k += 0.6; else if (hachage(vu.col, vu.rr, gg + 5) > 0.86) k -= 0.6;   // (chaque écaille a son ton)
    }
    if (d > 0.82 && ny > -0.1) k -= 1;   // (le dessous de la touffe)
    if (hachage(X, Y, gg + 13) > 0.988 && k > 2.6) { put(X, Y, 'arbFleur', 4); continue; }   // (une écaille qui scintille)
    put(X, Y, k < 1.6 ? 'arbFeuC' : mat, k);
  }
}

// Une couronne d'or : des touffes semées en spirale dans l'ovale (ccx, ccy, rxc, ryc), du fond vers l'avant
function couronneOr(put, { ccx, ccy, rxc, ryc, n = 20, r = 10, g = 1, base = 9999, petit = false, ecaille = null, filtre = null }) {
  const C = { g, ccx, ccy, rxc, ryc, petit, base, ecaille };
  const T = [];
  for (let i = 0; i < n; i++) {
    const a = i * 2.39996 + hachage(i, 1, g) * 0.6, rr = Math.sqrt((i + 0.5) / n);
    const tx = ccx + Math.cos(a) * rr * rxc * 0.9, ty = ccy + Math.sin(a) * rr * ryc * 0.85;
    if (filtre && !filtre(tx, ty)) continue;
    const h = hachage(i, 4, g);
    T.push({ x: tx, y: ty, r: r * (0.8 + hachage(i, 6, g) * 0.4), mat: h < 0.55 ? 'arbFeuA' : h < 0.85 ? 'arbFeuB' : 'arbFeuC', i });
  }
  T.sort((a, b) => a.y - b.y || a.x - b.x);
  T.forEach(t => touffeEcailles(put, t, C));
  return T;
}

// L'ambrenne : le pied en (cx, base), haut de H. `brins` : 3 (5 pour un très vieil arbre).
function peindreAmbrenne(put1, { cx, base, H, graine = 1, saison = 'moissons', neige = false, brins = 3, ecartX = 1 }) {
  const put = (x, y, m, i) => put1(Math.round(x), Math.round(y), m, Math.max(0, Math.min(5, Math.round(i))));
  const g = graine * 977 + 9101, petit = H < 40, mini = H < 22;
  const th = 0.46, ty = base - th * H, pen = (hachage(1, 1, g) - 0.5) * 0.06 * H;
  const W0 = Math.max(1.8, 0.1 * H), W1 = Math.max(1.3, 0.06 * H);
  const ccx = cx + pen * 1.4, ccy = base - 0.74 * H, rxc = 0.44 * H * ecartX, ryc = 0.24 * H;
  const zb = new Map();
  // les touffes du fond (derrière les branches)
  const C = { g, ccx, ccy, rxc, ryc, petit, base, ecaille: Math.max(1.6, H / 34) };
  const touffes = [];
  const nT = mini ? 7 : petit ? 12 : 22;
  for (let i = 0; i < nT; i++) {
    const a = i * 2.39996, rr = Math.sqrt((i + 0.5) / nT), h = hachage(i, 4, g);
    touffes.push({ x: ccx + Math.cos(a) * rr * rxc * 0.9, y: ccy + Math.sin(a) * rr * ryc * 0.85, r: (0.12 + hachage(i, 6, g) * 0.05) * H, mat: h < 0.55 ? 'arbFeuA' : h < 0.85 ? 'arbFeuB' : 'arbFeuC', i });
  }
  // (un dôme un peu aplati, plus large en haut : quelques touffes de plus sur le dessus)
  for (let i = 0; i < (petit ? 3 : 6); i++) { const u = (i + 0.5) / (petit ? 3 : 6) * 2 - 1; touffes.push({ x: ccx + u * rxc * 0.78, y: ccy - ryc * (0.55 + (1 - u * u) * 0.35), r: 0.13 * H, mat: 'arbFeuB', i: 40 + i }); }
  touffes.sort((a, b) => a.y - b.y || a.x - b.x);
  const devant = t => t.y > ccy + 0.05 * ryc && Math.abs(t.x - cx) > 0.08 * H && hachage(t.i, 12, g) > 0.45;
  touffes.filter(t => !devant(t)).forEach(t => touffeEcailles(put, t, C));
  // le tronc torsadé, du pied (un peu évasé) jusqu'à la fourche
  const chemin = u => [cx + pen * u + Math.sin(u * Math.PI) * (hachage(2, 2, g) - 0.5) * 0.04 * H, base - 1 - (base - 1 - ty) * u];
  torsade(put, chemin, { largeur: u => (W0 + (W1 - W0) * u) * (1 + Math.max(0, 0.18 - u) * 3.2), nb: brins, tours: 0.9 + hachage(3, 3, g) * 0.4, phase: hachage(4, 4, g) * 6, g, zb, fibres: !mini });
  // les racines : chaque brin s'en va de son côté sur le sol
  if (!mini) for (let b = 0; b < brins; b++) { const u = brins === 1 ? 0 : b / (brins - 1) * 2 - 1, X1 = cx + u * (0.2 * H) + (hachage(b, 7, g) - 0.5) * 0.04 * H;
    traitArbre(put, cx + u * W0 * 0.6, base - W0 * 0.9, X1, base, W0 * 0.7, 1.2, 'arbEcorce', g + 30 + b); }
  // en haut, les brins se dénouent : chacun devient une maîtresse branche, qui se divise encore
  const branche = (x, y, ang, len, w, niv, k) => {
    const x1 = x + Math.cos(ang) * len, y1 = y + Math.sin(ang) * len;
    traitArbre(put, x, y, x1, y1, Math.max(w, 1), Math.max(w * 0.62, 0.9), 'arbEcorce', g + k);
    if (niv <= 0 || len < 2.4) return;
    for (let b = 0; b < 2; b++) branche(x1, y1, ang + (b - 0.5) * (0.62 + hachage(k, b, g) * 0.35) + (hachage(k, 7 + b, g) - 0.5) * 0.3, len * (0.62 + hachage(k, 9 + b, g) * 0.18), w * 0.62, niv - 1, k * 3 + b + 1);
  };
  const [fx, fy] = chemin(1);
  for (let b = 0; b < brins; b++) {
    const u = brins === 1 ? 0 : b / (brins - 1) * 2 - 1;
    // (la maîtresse branche part en se tordant un peu : une courbe en deux traits)
    const a = -Math.PI / 2 + u * 0.95 + (hachage(b, 2, g) - 0.5) * 0.25, L1 = (0.15 + hachage(b, 3, g) * 0.05) * H;
    const mx = fx + u * W1 * 0.5 + Math.cos(a - u * 0.25) * L1 * 0.5, my = fy + Math.sin(a - u * 0.25) * L1 * 0.5;
    traitArbre(put, fx + u * W1 * 0.5, fy + 1, mx, my, W1 * 0.95, W1 * 0.75, 'arbEcorce', g + 50 + b);
    branche(mx, my, a, L1 * 0.85, W1 * 0.72, mini ? 1 : 2, b + 1);
  }
  // les touffes de devant
  touffes.filter(devant).forEach(t => touffeEcailles(put, t, C));
  // au pied : des feuilles d'or tombées (il en tombe toute l'année, une à une)
  if (!mini) for (let k = 0; k < Math.round(0.18 * H); k++) { const X = Math.round(cx + (hachage(k, 30, g) - 0.5) * 0.8 * H), Y = base + Math.round(hachage(k, 31, g) * 2); put(X, Y, ['arbFeuA', 'arbFeuB', 'arbFeuC'][k % 3], 3 + (k % 2)); }
  if (neige) piedArbre(put, { cx, base, H, g, neige: true, mini });
}

