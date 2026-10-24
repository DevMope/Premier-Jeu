// (v1.63) Les arbres de la Comté, peints un par un : un tronc d'écorce (fibres, crevasses, racines qui s'évasent), des
// branches qui se divisent, un feuillage en masses de touffes (chacune éclairée en haut à gauche, sombre en dessous, de
// petits paquets de feuilles et des éclats de lumière), et la saison : fleurs et pétales au printemps, vert dense l'été
// (des pommes au pommier), roux et feuilles tombées à l'automne, branches nues et neige l'hiver.
// Quatre espèces : le chêne (large, tronc épais), le pommier (bas, noueux, fleuri ou chargé de fruits), le bouleau
// (tronc blanc moucheté de noir, couronne légère) et le saule (ses longues branches qui pendent).
// peindreArbre() dessine par `put(x, y, matière, teinte)` : la même peinture sert pour l'arbre de la façade (une toile
// ×2), pour ceux de la place vus par le porche, et pour ceux des collines du paysage.
const ESPECES_ARBRE = ['chene', 'pommier', 'bouleau', 'saule'];

// Les couleurs : [clair-vif, moyen, sombre] du feuillage par espèce et par saison ; l'écorce, les fleurs, les fruits, la neige.
const FEUILLAGES_ARBRE = {
  chene: { semailles: [0x7cc050, 0x9ad060, 0x58a044], moissons: [0x2f7a2a, 0x468f34, 0x1f5c26], brumes: [0xc8601e, 0xe09a30, 0x9a3a18], givre: [0x6a5a48, 0x7a6a58, 0x5a4a3a] },
  pommier: { semailles: [0x78b858, 0x98cc68, 0x58a048], moissons: [0x3a8a30, 0x54a040, 0x2a6a2a], brumes: [0xc8482a, 0xe0a030, 0x9a3018], givre: [0x6a5a48, 0x7a6a58, 0x5a4a3a] },
  bouleau: { semailles: [0x9ad060, 0xb8e070, 0x78b850], moissons: [0x4a9a38, 0x6ab048, 0x34802c], brumes: [0xe8c030, 0xf0d860, 0xc09020], givre: [0x7a6a58, 0x8a7a68, 0x6a5a48] },
  saule: { semailles: [0x98c860, 0xb4d878, 0x78b050], moissons: [0x5a9a3a, 0x78b048, 0x44802c], brumes: [0xc8b040, 0xe0d060, 0x98902c], givre: [0x8a7a50, 0x9a8a60, 0x6a5a3a] },
};
function rampesArbre(saison, espece, couleur = null) {
  const S = saison || 'moissons', f = (FEUILLAGES_ARBRE[espece] || FEUILLAGES_ARBRE.chene)[S];
  const [a, b, c] = couleur === null ? f : [couleur, teinte(couleur, 1.16), teinte(couleur, 0.78)];
  const ecorce = { chene: 0x5a4230, pommier: 0x6a5240, bouleau: 0x4a3a40, saule: 0x5a5238 }[espece] || 0x5a4230;
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
};

// Peint un arbre de hauteur H dont le pied est en (cx, base). `put(x, y, matière, teinte)` pose un pixel.
function peindreArbre(put1, { cx, base, H, espece = 'chene', saison = 'moissons', graine = 1, ecartG = 1, ecartD = 1 }) {
  let muet = false; const put = (x, y, m, i) => { if (!muet) put1(Math.round(x), Math.round(y), m, Math.max(0, Math.min(5, Math.round(i)))); };   // (muet : on trace à blanc pour connaître le bout des branches)
  const E = PARAMS_ARBRE[espece] || PARAMS_ARBRE.chene, g = graine * 977 + (ESPECES_ARBRE.indexOf(espece) + 1) * 131;
  const hiver = saison === 'givre', automne = saison === 'brumes', printemps = saison === 'semailles';
  const petit = H < 40, mini = H < 22;
  const w0 = Math.max(mini ? 1.6 : 2.2, E.w0 * H), w1 = Math.max(mini ? 1.1 : 1.6, E.w1 * H);
  const tx = cx + E.pen * H + (hachage(1, 1, g) - 0.5) * 0.03 * H, ty = base - E.th * H;
  const ccx = cx + E.pen * H * 1.5, ccy = base - E.cy * H, rxc = E.rx * H, ryc = E.ry * H;
  // 1. les touffes du fond (le feuillage derrière les branches), puis le tronc et les branches, puis les touffes de devant
  const tips = [];
  const branche = (x, y, ang, len, w, niv, k) => {
    const x1 = x + Math.cos(ang) * len, y1 = y + Math.sin(ang) * len, ww = w * (niv > 0 ? 0.64 : 0.55);
    traitArbre(put, x, y, x1, y1, Math.max(w, 1), Math.max(ww, mini ? 1 : 0.9), E.mat === 'arbEcorceB' && niv >= 2 && !hiver ? 'arbEcorceB' : 'arbEcorce', g + k, { neige: hiver && w >= 1.4 });
    if (niv <= 0 || len < 2.2) { tips.push([x1, y1, ang]); return; }
    const nb = niv >= 2 && hachage(k, 5, g) > 0.45 ? 3 : 2;
    for (let b = 0; b < nb; b++) {
      const dev = (b - (nb - 1) / 2) * (0.5 + hachage(k, b, g) * 0.4) * (espece === 'bouleau' ? (hiver ? 1.1 : 0.6) : 1) + (hachage(k, 7 + b, g) - 0.5) * 0.35;
      branche(x1, y1, ang + dev, len * (0.64 + hachage(k, 9 + b, g) * 0.2), ww, niv - 1, k * 3 + b + 1);
    }
  };
  // le tronc : une courbe douce, plus fine en haut ; les racines qui s'évasent au pied
  const troncPts = []; for (let k = 0; k <= 6; k++) { const u = k / 6; troncPts.push([cx + (tx - cx) * u + (fbm(u * 3, 1, g) - 0.5) * 0.045 * H * Math.sin(u * Math.PI), base - (base - ty) * u]); }
  const dessinerTronc = () => {
    for (let k = 0; k < 6; k++) traitArbre(put, troncPts[k][0], troncPts[k][1], troncPts[k + 1][0], troncPts[k + 1][1], w0 + (w1 - w0) * (k / 6), w0 + (w1 - w0) * ((k + 1) / 6), E.mat, g + k, { bouleau: espece === 'bouleau' });
    if (!mini) for (const sens of [-1, 1]) {   // (des racines, de chaque côté)
      for (let r = 0; r < (petit ? 1 : 2); r++) traitArbre(put, cx + sens * w0 * 0.25, base - w0 * (1.6 - r * 0.5), cx + sens * w0 * (1.25 + r * 0.6 + hachage(sens, r, g) * 0.15), base, w0 * 0.55, 1, E.mat, g + 40 + r + sens, { bouleau: false });
    }
  };
  // les grosses branches, du haut du tronc
  const [fx, fy] = troncPts[6], limbes = espece === 'bouleau' ? 3 : 3;
  const lancer = () => {
    for (let b = 0; b < limbes; b++) {
      const t = limbes === 1 ? 0 : (b / (limbes - 1) - 0.5) * 2;
      const ang = -Math.PI / 2 + t * E.ecart * (espece === 'bouleau' && hiver ? 1.9 : 1) * (t < 0 ? ecartG : ecartD) + (hachage(b, 2, g) - 0.5) * 0.35;
      branche(fx, fy + w1 * 0.3, ang, E.len * H * (1 - Math.abs(t) * 0.12) * (0.9 + hachage(b, 3, g) * 0.25), w1 * (0.95 - Math.abs(t) * 0.12), E.niv - (mini ? 1 : 0), b + 1);
    }
  };
  // les touffes : chacune une masse bosselée, éclairée en haut à gauche
  const touffes = [];
  const gardees = [];
  const ajouterTouffe = (x, y, r) => {
    const i = touffes.length, tirage = hachage(i, 4, g);
    touffes.push({ x, y, r: Math.max(r, 1.8), mat: tirage < 0.5 ? 'arbFeuA' : tirage < 0.8 ? 'arbFeuB' : 'arbFeuC', i });
  };
  const peindreTouffe = t => {
    const { x, y, r, mat, i } = t, rx = r * 1.1, ry = r * 0.95, gg = g + 100 + i * 7;
    for (let Y = Math.floor(y - ry) - 1; Y <= Math.ceil(y + ry) + 1; Y++) for (let X = Math.floor(x - rx) - 1; X <= Math.ceil(x + rx) + 1; X++) {
      const nx = (X + 0.5 - x) / rx, ny = (Y + 0.5 - y) / ry, d0 = Math.hypot(nx, ny);
      const d = d0 + (fbm(X * 0.55, Y * 0.55, gg) - 0.5) * (petit ? 0.45 : 0.7);
      if (d > 1) continue;
      const z = Math.sqrt(Math.max(0, 1 - Math.min(1, d0 * d0)));
      let lum = -(nx * 0.55 + ny * 0.72) * 0.62 + z * 0.5 - ((X - ccx) / rxc * 0.5 + (Y - ccy) / ryc * 0.7) * 0.32;
      let k = 2.05 + lum * 2.5;
      const f = fbm(X * 0.42, Y * 0.42, gg + 1);
      k += f > 0.64 ? 1 : f < 0.34 ? -1 : 0;
      const h1 = hachage(X, Y, gg + 2);
      if (h1 > 0.93) k += 1; else if (h1 < 0.05) k -= 1;
      if (d > 0.8 && ny > -0.15) k -= 1;   // (le dessous du bouquet, dans l'ombre)
      let m = mat;
      if (printemps && espece === 'pommier' && !mini && fbm(X * 0.5, Y * 0.5, gg + 8) > 0.5) { put(X, Y, hachage(X, Y, gg + 9) > 0.8 ? 'arbFleurB' : 'arbFleur', k + 1); continue; }   // (le pommier en fleurs)
      if (printemps && espece !== 'pommier' && !petit && hachage(X, Y, gg + 11) > 0.985) { put(X, Y, 'arbFleurB', 4); continue; }   // (quelques chatons, quelques fleurs)
      if (automne && hachage(X >> 1, Y >> 1, gg + 12) > 0.8) m = 'arbFeuB';              // (des feuilles plus claires)
      put(X, Y, m, k);
      if (saison === 'moissons' && espece === 'pommier' && !petit && hachage(X, Y, gg + 10) > 0.986 && lum > -0.2) { put(X, Y, 'arbPomme', 4); put(X + 1, Y, 'arbPomme', 2); put(X, Y + 1, 'arbPomme', 2); put(X + 1, Y + 1, 'arbPomme', 1); }   // (une pomme)
    }
  };
  if (!hiver) {
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
    // (nu : quelques rameaux fins au bout des branches)
    if (!mini && espece !== 'bouleau') for (const [bx, by, ang] of tips) for (let b = -1; b <= 1; b += espece === 'saule' ? 2 : 1) traitArbre(put, bx, by, bx + Math.cos(ang + b * 0.6) * H * 0.07, by + Math.sin(ang + b * 0.6) * H * 0.07, 1, 0.8, 'arbEcorce', g + 60 + b, { neige: false });
  }
  // le saule : ses longues branches qui pendent du bord de la couronne
  if (espece === 'saule') {
    const n = Math.max(6, Math.round(rxc * 0.6));
    for (let k = 0; k < n; k++) {
      const u = (k + hachage(k, 20, g) * 0.8) / n * 2 - 1;
      if (Math.abs(u) < 0.16) continue;   // (le tronc reste visible)
      const X0 = ccx + u * rxc * 0.97, Y0 = ccy + Math.sqrt(Math.max(0, 1 - u * u)) * ryc * 0.75;
      const long = (0.34 + hachage(k, 21, g) * 0.3) * H * (1 - Math.abs(u) * 0.2), epais = hachage(k, 22, g) > 0.55 && H >= 60;
      if (hiver && k % 2) continue;   // (l'hiver : la moitié des branches seulement)
      for (let y = 0; y < long; y++) {
        const X = Math.round(X0 + Math.sin(y * 0.3 + k) * 0.8), Y = Math.round(Y0 + y);
        if (Y > base - 2) break;
        if (hiver) { put(X, Y, 'arbEcorce', 2 + (y % 5 === 0 ? 1 : 0)); continue; }
        const ton = 2 + (y % 3 === 0 ? 1 : 0) + (long - y < 4 ? 1 : 0) + (u < 0 ? 1 : 0) - (y < 5 ? 1 : 0), m = hachage(k, y >> 2, g) > 0.5 ? 'arbFeuA' : 'arbFeuB';
        put(X, Y, m, ton); if (epais) put(X + 1, Y, m, ton - 1);
      }
    }
  }
  // au pied : de l'herbe, de la mousse ; l'hiver un monticule de neige ; l'automne des feuilles tombées, au printemps des pétales
  if (!mini) {
    if (hiver) {
      const rr = 0.15 * H, h = Math.max(2, Math.round(0.03 * H));
      for (let X = Math.round(cx - rr); X <= Math.round(cx + rr); X++) { const hh = Math.round(h * Math.sqrt(Math.max(0, 1 - ((X - cx) / rr) ** 2))); for (let y = 0; y < hh; y++) put(X, base + 1 - y, 'arbNeige', y === hh - 1 ? 5 : 3 + (X < cx ? 1 : 0)); }
    } else {
      for (let k = 0; k < Math.round(0.14 * H); k++) { const X = Math.round(cx + (hachage(k, 30, g) - 0.5) * 0.7 * H), Y = base + Math.round(hachage(k, 31, g) * 2);
        if (automne) put(X, Y, ['arbFeuA', 'arbFeuB', 'arbFeuC'][k % 3], 3 + (k % 2));
        else if (printemps && espece === 'pommier') put(X, Y, k % 2 ? 'arbFleur' : 'arbFleurB', 4);
        else if (k % 3 === 0) { put(X, Y, 'arbFeuC', 3); put(X, Y - 1, 'arbFeuA', 3); } }
    }
  }
}

// Un arbre de la façade ou de la place, sur sa propre toile (×2), mis en cache : { cle, pied } (pied : nombre de lignes sous le pied)
// `cote` : -1 pour retenir les branches de gauche (l'arbre est à droite, un passage ou des bottes à sa gauche), 1 pour celles de droite
function arbreHD(scene, espece, saison, H, graine = 1, cote = 0) {
  const cle = `arbreHD_${espece}_${saison}_${H}_${graine}_${cote}`;
  if (scene.textures.exists(cle)) return cle;
  const L = Math.round(H * 1.1) + 6, Ht = H + 5, base = H + 2;
  const t = toileDecor(L, Ht); Object.assign(t.rampes, rampesArbre(saison, espece));
  peindreArbre((x, y, m, i) => t.poser(x, y, m, i), { cx: Math.floor(L / 2), base, H, espece, saison, graine, ecartG: cote < 0 ? 0.5 : 1, ecartD: cote > 0 ? 0.55 : 1 });
  t.contour(); t.texture(scene, cle);
  return cle;
}
const PIED_ARBRE = 3;   // (les lignes de la toile sous le pied de l'arbre)
