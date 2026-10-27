// (v1.64, planche 89 v4 b, chantier 1 de la ville en quartiers : la grand-place remise d'aplomb) Les dessins du nord et
// de l'est de la grand-place.
//   Au nord, à la place des six façades de la rue qui y étaient recopiées (coupées par le bord, deux fois chacune) : le pied
//   des Coteaux. Une pente d'herbe en deux terrasses, les buttes et leurs portes rondes (dessinées comme sur la planche
//   89 v2 : encadrement de pierres en éventail, panneaux peints, bouton de laiton au milieu, fenêtre ronde et sa jardinière,
//   lanterne, boîte aux lettres), leurs cheminées qui fument, et le chemin creux qui monte aux Coteaux entre deux murets de
//   pierre sèche.
//   À l'est, au bout du sentier : le coin de l'étang du Moulin (ses rives irrégulières, ses roseaux, ses nénuphars, gelé
//   l'hiver), et la cabane de Barnabé, qui a quitté la place pour ses pilotis, avec son ponton, sa passerelle et sa barque.
// Tout suit la saison de la place (paletteSaisonComte) ; chaque texture est peinte une fois et gardée.

const COTEAUX_PLACE = {
  haut: 140,              // la bande au-dessus de la place (y négatifs) où monte la pente
  levre: 172,             // le pied du talus, au bord du chemin du haut de la place
  terrasse: 46,           // le chemin de la terrasse d'en haut
  escalier: [1034, 1106], // le chemin creux (entre ses deux murets)
  echelle: 1.8,           // les buttes, à l'échelle des étals
  // [x, couleur de la porte, graine, fleurs] : en bas, au bord de la place ; en haut, sur la terrasse
  bas: [[115, 'porteVerte', 71, 'fleurR2'], [730, 'porteRouge', 72, 'fleurJ2'], [1670, 'porteJaune', 73, 'fleurP2'], [2060, 'porteBleue', 74, 'fleurB2']],
  hauts: [[400, 'porteBleue', 75, 'fleurJ2'], [1330, 'porteVerte', 76, 'fleurR2'], [1900, 'porteRouge', 77, 'fleurB2']],
};
// L'étang, en demi-pixels de la place (comme le plan du sol) ; le ponton, la passerelle et la cabane en pixels de la place
const ETANG_PLACE = { cx: 1068, cy: 478, rx: 150, ry: 92, ponton: [1872, 880, 2104, 962], passerelle: [1826, 918, 1874, 950], cabane: [1985, 905] };
function dansEtangPlace(x, y) {
  const E = ETANG_PLACE, dx = (x - E.cx) / E.rx, dy = (y - E.cy) / E.ry;
  if (Math.abs(dx) > 1.3 || Math.abs(dy) > 1.3) return false;
  return dx * dx + dy * dy < 1 + (fbm(x * 0.05, y * 0.05, 7711) - 0.5) * 0.24;   // (une rive qui ondule, comme celle d'une rivière)
}
// Un point de la place (en pixels) est-il dans l'eau ? (le ponton et la passerelle portent)
function eauPlace(X, Y) {
  const E = ETANG_PLACE, dans = ([x0, y0, x1, y1]) => X >= x0 && X <= x1 && Y >= y0 && Y <= y1;
  if (X < 1780 || dans(E.ponton) || dans(E.passerelle)) return false;
  return dansEtangPlace(X / 2, Y / 2);
}

const RAMPES_COTEAUX = {
  enduitC: rampe(0xe4d4b0), voletR: rampe(0x8a3a2a), pierreS: rampe(0xa89a80), mousseC: rampe(0x5e7a36),
  feuilleV2: rampe(0x3e7a30), feuilleC2: rampe(0x5a9a3a), fleurR2: rampeVive(0xd8323e), fleurP2: rampeVive(0xe86a9a), fleurJ2: rampeVive(0xf0c020), fleurB2: rampeVive(0x7a8ae8),
  porteVerte: rampe(0x2e6e3a), porteRouge: rampe(0x9a3226), porteJaune: rampe(0xc89a2e), porteBleue: rampe(0x2e548e),
  vitreJ: [0x16202c, 0x22303e, 0x34485a, 0x4a6478, 0x7a98ac, 0xc8dce4], neigeC: [0x8a9aac, 0xa8b8c8, 0xc4d2de, 0xdce6ee, 0xeef4f8, 0xffffff],
  storeB: rampe(0xece4d0),
};
function toileCoteaux(l, h, pal) {
  const t = toileDecor(l, h), S = pal.sol;
  Object.assign(t.rampes, RAMPES_RUE, RAMPES_COTEAUX);
  t.rampes.gazon = rampe(S.herbe); t.rampes.terreC = rampe(S.terre); t.rampes.pierreC = rampe(S.pierre); t.rampes.feuilleS = rampe(S.feuille);
  t.rampes.fleurS = rampe(S.fleur); t.rampes.fleur2S = rampe(S.fleur2);
  return t;
}

// Une jardinière de bois sous une fenêtre, et ses fleurs qui débordent (l'hiver : quelques brins de buis)
function jardiniereCoteaux(t, x0, y0, l, fleur, graine, hiver) {
  for (let y = y0; y < y0 + 4; y++) for (let x = x0; x < x0 + l; x++) t.poser(x, y, 'chene', y === y0 ? 4 : y === y0 + 3 ? 1 : 2 + ((x - x0) % 7 === 0 ? -1 : 0));
  for (let x = x0; x < x0 + l; x += 2) { const h = (hiver ? 1 : 2) + Math.floor(hachage(x, 1, graine) * 3); for (let y = y0 - h; y < y0; y++) t.poser(x + (y % 2), y, hachage(x, y, graine) > 0.5 ? 'feuilleV2' : 'feuilleC2', 2 + (y === y0 - h ? 2 : 0)); }
  if (!hiver) for (let k = 0; k < l / 3; k++) { const x = x0 + 1 + Math.floor(hachage(k, 2, graine) * (l - 2)), y = y0 - 2 - Math.floor(hachage(k, 3, graine) * 3); t.poser(x, y, fleur, 4); t.poser(x + 1, y, fleur, 3); t.poser(x, y - 1, fleur, 5); }
  else for (let x = x0; x < x0 + l; x++) t.poser(x, y0, 'neigeC', 5);
  for (const x of [x0 + 2, x0 + l - 3]) for (let y = y0 + 4; y < y0 + 7; y++) t.poser(x, y, 'cheneSombre', 2);   // les équerres
}

// Une butte des Coteaux et son trou de hobbit, vus de face : le flanc de la colline gazonné (de la couleur de la place,
// selon la saison), le mur de pierres sèches taillé dedans, l'enduit à la chaux autour de la porte ronde, la porte peinte,
// la fenêtre ronde, la jardinière, la lanterne, la boîte aux lettres, la barrière, la cheminée qui sort de l'herbe.
//   n : le numéro de la butte (sa graine) ; o : { couleur, fleurs, fenetre, cheminee, banc, barriere, boite, lanterne }
function trouCoteauxHD(s, pal, n, o = {}) {
  const saison = pal.saison || 'semailles', cle = 'trouCoteaux_' + n + '_' + saison;
  if (s.textures.exists(cle)) return cle;
  const { L = 150, H = 96, couleur = 'porteVerte', r = 17, fenetre = 1, cheminee = 0.72, barriere = true, boite = true, lanterne = true, fleurs = 'fleurR2', banc = false } = o;
  const graine = n, hiver = saison === 'givre';
  const t = toileCoteaux(L, H, pal), base = H - 6, cx = Math.round(L * (fenetre ? 0.42 : 0.5)), cy = base - r - 2;
  // 1. la butte, éclairée en haut à gauche ; quelques fleurs dans l'herbe (au printemps et l'été)
  const dome = x => { const nx = (x + 0.5 - L / 2) / (L / 2); return Math.abs(nx) >= 1 ? 1e9 : base - (base - 6) * Math.pow(1 - nx * nx, 0.55) + (fbm(x * 0.2, 1, graine) - 0.5) * 2; };
  for (let y = 0; y <= base; y++) for (let x = 0; x < L; x++) {
    const yt = dome(x); if (y < yt) continue;
    // (la lumière vient d'en haut à gauche : le dôme s'éclaire à gauche et en haut, s'assombrit à droite et à son pied,
    // en dégradé tramé ; le liseré clair au faîte)
    const nx = (x + 0.5 - L / 2) / (L / 2), v = (y - yt) / Math.max(1, base - yt);
    const f = 3.2 - nx * 0.95 + (0.4 - v) * 1.1 + (y - yt < 2 ? 0.9 : 0) + (fbm(x * 0.08, y * 0.12, graine + 1) - 0.5) * 1.5;
    let k = Math.floor(f); if (f - k > (BAYER[y % 4][x % 4] + 0.5) / 16) k++;
    t.poser(x, y, 'gazon', k);
  }
  const fleuri = saison === 'semailles' || saison === 'moissons';
  for (let q = 0; q < L * H / 30; q++) {
    const x = Math.floor(hachage(q, 1, graine + 2) * L), y = Math.floor(hachage(q, 2, graine + 2) * base);
    if (t.mat(x, y) !== 'gazon' || t.mat(x, y + 2) !== 'gazon' || t.mat(x, y - 2) !== 'gazon') continue;
    const k = t.teinte(x, y);
    if (fleuri && hachage(q, 3, graine + 2) < 0.07) { const f = ['fleurS', 'fleur2S', 'fleurB2', 'storeB'][q % 4]; t.poser(x, y, f, 4); t.poser(x + 1, y, f, 3); t.poser(x, y + 1, 'gazon', 1); }
    else if (saison === 'brumes' && hachage(q, 3, graine + 2) < 0.05) { t.poser(x, y, 'feuilleS', 3); t.poser(x + 1, y, 'feuilleS', 4); }
    else { t.poser(x - 1, y, 'gazon', k + 1); t.poser(x, y - 1, 'gazon', k + 1); t.poser(x + 1, y, 'gazon', k + 1); t.poser(x, y + 1, 'gazon', k - 1); }
  }
  // 2. le mur de façade, taillé dans la butte : des pierres sèches arrondies ; le gazon du dessus retombe en franges
  const rm = r + 22, wy = cy - r - 9, wb = x => { const dx = (x + 0.5 - cx) / rm; return Math.abs(dx) >= 1 ? 1e9 : wy + (1 - Math.sqrt(1 - dx * dx)) * (base - wy) * 0.9; };
  for (let y = 0; y <= base; y++) for (let x = cx - rm; x <= cx + rm; x++) {
    const yw = wb(x); if (y < yw) continue;
    const gx = Math.floor(x / 7), gy = Math.floor(y / 5); let d1 = 1e9, d2 = 1e9, bst = null;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const ax = gx + i, ay = gy + j, fx = (ax + (ay % 2) * 0.5 + 0.2 + hachage(ax, ay, graine + 4) * 0.6) * 7, fy = (ay + 0.25 + hachage(ax, ay, graine + 5) * 0.5) * 5; const d = Math.hypot((x + 0.5 - fx) / 7, (y + 0.5 - fy) / 5) * 7; if (d < d1) { d2 = d1; d1 = d; bst = [ax, ay, fx, fy]; } else if (d < d2) d2 = d; }
    if (d2 - d1 < 1.2) { t.poser(x, y, 'pierreS', 0); continue; }
    const rel = (x + 0.5 - bst[2]) / 7 + (y + 0.5 - bst[3]) / 5;
    let k = 3 + (hachage(bst[0], bst[1], graine + 6) > 0.7 ? 1 : 0) + (d2 - d1 < 2.4 ? (rel < 0 ? 1 : -1) : 0) - (x > cx + rm * 0.55 ? 1 : 0);
    if (y - yw < 3) k -= 2;   // l'ombre du gazon qui surplombe
    t.poser(x, y, 'pierreS', k);
  }
  for (let x = cx - rm; x <= cx + rm; x++) { const yw = Math.round(wb(x)); if (yw > base) continue; const l = 1 + Math.floor(hachage(x, 9, graine) * 3); for (let k = 0; k < l; k++) t.poser(x, yw + k, 'gazon', k === l - 1 ? 1 : 2); t.poser(x, yw - 1, 'gazon', 4); }
  // l'enduit blanc à la chaux, juste autour de la porte
  for (let y = cy - r - 7; y <= base; y++) for (let x = cx - r - 7; x <= cx + r + 7; x++) { const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy); if (d > r + 7 || (y > cy && Math.abs(x + 0.5 - cx) > r + 7)) continue; t.poser(x, y, 'enduitC', 4 - (x > cx + r * 0.4 ? 1 : 0) - (y > base - 2 ? 1 : 0) + (hachage(x, y, graine + 3) > 0.94 ? -1 : 0)); }
  // 3. la porte ronde : l'encadrement de pierres taillées en éventail, la porte peinte en planches, le bouton de laiton au milieu
  const re = r + 4;
  for (let y = cy - re; y <= base; y++) for (let x = cx - re; x <= cx + re; x++) {
    const dx = x + 0.5 - cx, dy = y + 0.5 - cy, d = Math.hypot(dx, dy);
    if (d > re || (y > cy + r && Math.abs(dx) > r)) continue;
    if (d > r) { const a = Math.atan2(dy, dx), joint = ((a + Math.PI) * 8 / Math.PI) % 1 < 0.14; t.poser(x, y, 'taille', joint ? 1 : (dx + dy < 0 ? 5 : dx + dy < re * 0.6 ? 3 : 2)); continue; }
    let k;
    const lum = -(dx + dy) / (r * 1.4);
    if (d > r - 2) k = d > r - 1 ? 1 : 2;   // la feuillure, dans l'ombre
    else if (d > r - 5) k = 3 + Math.round(lum * 1.2);
    else if (d > r - 6) k = 1;
    else { const pl = Math.floor((x - cx + r) / 4), j = (x - cx + r) % 4 === 0; k = j ? 2 : 3 + Math.round(lum) + (hachage(pl, 1, graine) > 0.8 ? 1 : 0); }
    t.poser(x, y, couleur, k);
  }
  for (let a = 0; a < 16; a++) { const ang = a / 16 * Math.PI * 2; t.poser(Math.round(cx + Math.cos(ang) * (r - 3.5) - 0.5), Math.round(cy + Math.sin(ang) * (r - 3.5) - 0.5), 'laiton', 4); }
  for (const [a, b, k] of [[-1, -1, 5], [0, -1, 5], [-1, 0, 5], [0, 0, 4], [1, 0, 3], [0, 1, 2], [1, 1, 1], [1, -1, 3], [-1, 1, 3], [-2, 0, 3], [2, 0, 2], [0, -2, 4], [0, 2, 1]]) t.poser(cx + a, cy + b, 'laiton', k);
  // le seuil en demi-lune et ses deux marches
  for (let y = base - 1; y <= base + 5; y++) for (let x = cx - r - 6; x <= cx + r + 6; x++) { const dx = (x + 0.5 - cx) / (r + 6), dy = (y - base + 1) / 6; if (dx * dx + dy * dy > 1) continue; t.poser(x, y, 'taille', y === base - 1 ? 5 : y === base + 2 ? 5 : y > base + 3 ? 2 : 3); }
  // 4. la fenêtre ronde et sa jardinière ; la lanterne ; la boîte aux lettres ; la barrière ; le banc
  if (fenetre) { const fx = cx + r + 18, fy = cy - 2, rf = 7;
    for (let y = fy - rf - 3; y <= fy + rf + 3; y++) for (let x = fx - rf - 3; x <= fx + rf + 3; x++) { const d = Math.hypot(x + 0.5 - fx, y + 0.5 - fy); if (d > rf + 2.5) continue;
      if (d > rf) t.poser(x, y, couleur, y < fy ? 4 : 2); else { const croix = Math.abs(x + 0.5 - fx) < 0.8 || Math.abs(y + 0.5 - fy) < 0.8; const ref = (x - fx) - (y - fy) > 1 && (x - fx) - (y - fy) < 4; t.poser(x, y, croix ? couleur : 'vitreJ', croix ? 3 : ref ? 5 : y < fy ? 3 : 2); } }
    jardiniereCoteaux(t, fx - 9, fy + rf + 5, 19, fleurs, graine + 5, hiver); }
  if (lanterne) { const lx = cx - r - 10, ly = cy - 8; for (let y = ly; y < ly + 9; y++) for (let x = lx; x < lx + 6; x++) { const cadre = x === lx || x === lx + 5 || y === ly || y === ly + 8; t.poser(x, y, cadre ? 'fer' : 'vitre', cadre ? 2 : 4); } for (let x = lx + 1; x < lx + 5; x++) t.poser(x, ly - 1, 'fer', 3); t.poser(lx + 2, ly - 2, 'fer', 2); }
  if (boite) { const bx = Math.round(L * 0.86), by = base - 14; for (let y = by; y < base + 2; y++) t.poser(bx + 2, y, 'chene', 2); for (let y = by - 6; y < by; y++) for (let x = bx - 2; x < bx + 7; x++) t.poser(x, y, 'voletR', y === by - 6 ? 4 : x === bx - 2 ? 4 : 2); for (let x = bx; x < bx + 5; x++) t.poser(x, by - 3, 'fer', 1); }
  if (barriere) for (const [xa, xb] of [[2, cx - r - 12], [cx + r + 30, Math.round(L * 0.8)]]) { if (xb <= xa) continue; for (let x = xa; x < xb; x++) for (const yy of [base - 6, base - 3]) t.poser(x, yy, 'chene', yy === base - 6 ? 4 : 2); for (let x = xa; x < xb; x += 5) for (let y = base - 9; y < base + 1; y++) t.poser(x, y, 'chene', y === base - 9 ? 5 : x === xa ? 3 : 2); }
  if (banc) { const bx = cx - r - 30; for (let x = bx; x < bx + 16; x++) { t.poser(x, base - 6, 'chene', 4); t.poser(x, base - 5, 'chene', 2); } for (const x of [bx + 1, bx + 13]) for (let y = base - 4; y < base + 1; y++) t.poser(x, y, 'cheneSombre', 2); }
  // 5. la cheminée de pierre qui sort de l'herbe, au sommet (la fumée part de son chapeau : t.cheminee)
  if (cheminee !== null) { const chx = Math.round(L * cheminee) - 4, dxn = (chx + 4 - L / 2) / (L / 2), chy = Math.round(base - (base - 4) * Math.sqrt(Math.max(0, 1 - dxn * dxn))) - 6;
    for (let y = chy; y < chy + 13; y++) for (let x = chx; x < chx + 9; x++) t.poser(x, y, 'taille', y === chy ? 5 : (y - chy) % 4 === 0 ? 1 : x < chx + 3 ? 4 : 2);
    for (let x = chx - 1; x < chx + 10; x++) t.poser(x, chy - 1, hiver ? 'neigeC' : 'taille', hiver ? 5 : 4);
    t.cheminee = [chx + 4, chy - 2]; }
  // (pas de contour noir : la butte fait partie de la pente, son faîte n'a que son liseré clair)
  t.texture(s, cle); s.textures.get(cle).cheminee = t.cheminee || null; return cle;
}

// Les buttes de la place (en bas : au bord de la place ; en haut : sur la terrasse), toujours dessinées pareil
function trouCoteauxPlace(s, pal, [x, couleur, graine, fleurs], enHaut = false) {
  return trouCoteauxHD(s, pal, graine, { couleur, fleurs, banc: graine === 72, boite: !enHaut || graine === 76, fenetre: graine === 74 ? 0 : 1, cheminee: [0.72, 0.3, 0.66, 0.7, 0.28, 0.74, 0.62][(graine - 71) % 7] });
}

// La pente des Coteaux, au-dessus de la place (demi-résolution, ×2) : de y = -haut jusqu'au pied du talus. L'herbe a le
// grain de celle de la place ; le talus se termine par un liseré clair, et son ombre tombe sur le chemin du haut. Une
// terrasse coupe la pente (le chemin des portes d'en haut) ; le chemin creux monte tout droit, marche après marche, entre
// deux murets de pierre sèche, et s'élargit en palier là où il croise la terrasse.
function penteCoteauxHD(s, pal) {
  const saison = pal.saison || 'semailles', cle = 'penteCoteaux_' + saison;
  if (s.textures.exists(cle)) return cle;
  const C = COTEAUX_PLACE, L = 1100, H = Math.ceil((C.levre + C.haut) / 2) + 4, t = toileCoteaux(L, H, pal), G0 = 7800;
  t.rampes.murS = rampe(0x8a8270);   // (la pierre sèche des murets, plus grise que les marches)
  const rang = wy => Math.round((wy + C.haut) / 2);
  const levre = x => rang(C.levre) + Math.round((fbm(x * 0.06, 2, G0) - 0.5) * 3);
  const terr = x => rang(C.terrasse) + Math.round(Math.sin(x / 37) * 1.5 + (fbm(x * 0.05, 5, G0 + 1) - 0.5) * 2);
  const [e0, e1] = C.escalier.map(v => Math.round(v / 2));
  const hiver = saison === 'givre';
  for (let x = 0; x < L; x++) {
    const yl = levre(x), yt = terr(x), esc = x >= e0 && x <= e1;
    for (let y = 0; y <= yl + 2; y++) {
      if (y > yl) { t.poser(x, y, 'terreC', y === yl + 1 ? 1 : 2); continue; }   // l'ombre du talus sur le chemin du haut
      const surTerrasse = Math.abs(y - yt) <= 4;
      if (esc) {
        // les deux murets de pierre sèche, larges de quatre : le bord d'herbe, le chaperon de pierres, la face intérieure (à
        // l'ombre à gauche, au soleil à droite) ; le chemin, entre eux, est plus bas que la pente
        const mur = x <= e0 + 3 ? 'g' : x >= e1 - 3 ? 'd' : null;
        if (mur && !surTerrasse) {
          const i = mur === 'g' ? x - e0 : e1 - x;   // 0 : le bord d'herbe ; 1-2 : le chaperon ; 3 : la face intérieure
          const pierre = Math.floor((y + (mur === 'g' ? 0 : 2)) / 4), joint = (y + (mur === 'g' ? 0 : 2)) % 4 === 3;
          if (i === 0) { t.poser(x, y, 'gazon', 2); continue; }
          if (i === 3) { t.poser(x, y, 'murS', joint ? 0 : mur === 'g' ? 1 : 3); continue; }
          if (!joint && fbm(x * 0.5, y * 0.25, G0 + 4) > 0.64) { t.poser(x, y, hiver ? 'neigeC' : 'mousseC', hiver ? 5 : i === 1 ? 4 : 3); continue; }
          t.poser(x, y, 'murS', joint ? 1 : (i === 1 ? 4 : 3) + (hachage(pierre, x, G0 + 3) > 0.7 ? 1 : 0) - (hachage(pierre, x, G0 + 13) < 0.15 ? 1 : 0)); continue;
        }
        if (surTerrasse) {   // le palier, là où le chemin creux croise la terrasse : de grandes dalles
          const dl = Math.floor((x - e0) / 9), dr = Math.floor((y - yt + 4) / 5), jt = (x - e0) % 9 === 0 || (y - yt + 4) % 5 === 4;
          t.poser(x, y, 'pierreC', jt ? 1 : 3 + (hachage(dl, dr, G0 + 5) > 0.6 ? 1 : 0) - (y === yt - 4 ? 1 : 0)); continue;
        }
        // les marches (six rangs chacune) : la contremarche, face à nous, sombre en bas ; le nez éclairé ; le giron, de longues
        // dalles ; l'ombre du muret de gauche sur le côté
        const p = ((yl - y) % 6 + 6) % 6, marche = Math.floor((yl - y) / 6);
        const contre = p <= 1, jv = contre ? (x + marche * 5) % 9 === 0 : (x + marche * 11) % 19 === 0;
        let k = p === 0 ? 0 : p === 1 ? 1 : p === 2 ? 4 : p === 5 ? 2 : 3;
        if (x < e0 + 9 && !contre) k -= 1;
        if (x < e0 + 6) k -= 1;
        if (jv && p !== 2) k = Math.min(k, 1);
        if (hiver && p >= 3 && hachage(x, marche, G0 + 6) > 0.25) { t.poser(x, y, 'neigeC', p === 3 ? 5 : 4); continue; }
        if (!hiver && !contre && p !== 2 && (x < e0 + 6 || x > e1 - 6) && fbm(x * 0.3, y * 0.3, G0 + 7) > 0.6) { t.poser(x, y, 'mousseC', 2 + (p > 3 ? 1 : 0)); continue; }   // la mousse dans les coins
        t.poser(x, y, 'pierreC', k); continue;
      }
      if (surTerrasse) {   // le chemin de la terrasse : l'ombre de la pente en haut, le bord éclairé en bas
        const q = fbm(x * 0.05, y * 0.1, G0 + 8);
        t.poser(x, y, 'terreC', y === yt - 4 ? 1 : y === yt - 3 ? 2 : y === yt + 4 ? 4 : q > 0.6 ? 4 : q < 0.3 ? 2 : 3); continue;
      }
      // l'herbe : le grain de la place, un peu plus claire en haut (la crête prend le soleil), le liseré au pied du talus
      // et au-dessus de la terrasse
      const pg = fbm(x * 0.025, y * 0.025, G0 + 9), q = hachage(x, y, G0 + 10);
      let k = pg > 0.6 ? 4 : 3;
      if (pg > 0.56 && pg <= 0.6 && (x + y) % 2 === 0) k = 4;
      if (q > 0.97) k += 1; else if (q < 0.025) k -= 1;
      if (y < 10 && pg > 0.45) k = Math.max(k, 4);
      if (y === yl || y === yt - 5) k = 5;
      else if (y === yl - 1 || y === yt + 5) k = Math.max(k, 4);
      // l'herbe qui retombe sur les murets du chemin creux
      if ((x === e0 - 1 || x === e1 + 1) && y < yl) k = 2;
      t.poser(x, y, 'gazon', k);
    }
  }
  // des touffes en V, des fleurs au printemps et l'été, des feuilles mortes à l'automne
  const fleuri = saison === 'semailles' || saison === 'moissons';
  for (let q = 0; q < L * H / 200; q++) {
    const x = Math.floor(hachage(q, 1, G0 + 11) * L), y = Math.floor(hachage(q, 2, G0 + 11) * H);
    if (t.mat(x, y) !== 'gazon' || t.mat(x, y + 3) !== 'gazon' || t.mat(x - 1, y - 1) !== 'gazon') continue;
    const r = hachage(q, 3, G0 + 11);
    if (fleuri && r < 0.09) { const m = r < 0.05 ? 'fleurS' : 'fleur2S'; for (const [a, b] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) t.poser(x + a, y + b, m, 4); t.poser(x, y, 'fleur2S', 5); t.poser(x, y + 2, 'feuilleS', 2); }
    else if (saison === 'brumes' && r < 0.12) { t.poser(x, y, 'feuilleS', 3); t.poser(x + 1, y, 'feuilleS', 4); t.poser(x, y + 1, 'feuilleS', 2); }
    else if (!hiver) { t.poser(x - 1, y - 1, 'gazon', 5); t.poser(x, y, 'gazon', 4); t.poser(x + 1, y - 1, 'gazon', 5); t.poser(x, y + 1, 'gazon', 1); }
  }
  t.texture(s, cle); return cle;
}

// Le portique du chemin creux : deux poteaux de chêne plantés au pied des murets, la traverse de bois clair où le nom est
// gravé (le lettrage : poserLettrage) ; une barrière basse en travers des premières marches (on les refait)
const PORTIQUE_COTEAUX = { L: 46, H: 44, traverse: [4, 6, 38, 11] };
function portiqueCoteauxHD(s, saison) {
  const cle = 'portiqueCoteaux_' + (saison === 'givre' ? 'givre' : 'x'); if (s.textures.exists(cle)) return cle;
  const P = PORTIQUE_COTEAUX, t = toileCoteaux(P.L, P.H, paletteSaisonComte(saison)); t.rampes.pin = rampe(BOIS_CLAIR_NOM);
  for (const x0 of [1, P.L - 5]) { planche(t, x0, 2, 4, P.H - 2, 'cheneSombre', { horizontale: false, graine: 7840 + x0 }); for (let y = 2; y < P.H; y++) t.poser(x0, y, 'cheneSombre', 4); t.poser(x0 + 1, 1, 'cheneSombre', 4); t.poser(x0 + 2, 1, 'cheneSombre', 3); }
  const [tx, ty, tl, th] = P.traverse;
  planche(t, tx, ty, tl, th, 'pin', { graine: 7845, noeuds: 1 });
  for (let x = tx; x < tx + tl; x++) { t.poser(x, ty, 'pin', 5); t.poser(x, ty + th - 1, 'chene', 1); }
  for (const [x, y] of [[tx + 2, ty + 2], [tx + tl - 3, ty + 2], [tx + 2, ty + th - 3], [tx + tl - 3, ty + th - 3]]) t.poser(x, y, 'fer', 4);
  // la lanterne pendue sous la traverse, à droite
  { const lx = P.L - 13, ly = ty + th + 3; t.poser(lx + 2, ty + th, 'fer', 2); t.poser(lx + 2, ty + th + 1, 'fer', 2); t.poser(lx + 2, ty + th + 2, 'fer', 3);
    for (let y = ly; y < ly + 7; y++) for (let x = lx; x < lx + 5; x++) { const cadre = x === lx || x === lx + 4 || y === ly || y === ly + 6; t.poser(x, y, cadre ? 'fer' : 'vitre', cadre ? 2 : 3); } }
  if (saison === 'givre') for (let x = tx; x < tx + tl; x++) t.poser(x, ty - 1, 'neigeC', 5);
  t.contour(); t.texture(s, cle); return cle;
}

// Des roseaux au bord de l'eau : des tiges, des feuilles en lame, des massettes brunes (dorés à l'automne, secs et
// poudrés de neige l'hiver). Posés par le pied, ils se balancent un peu au vent.
function roseauxPlaceHD(s, saison, k) {
  const cle = 'roseauxPlace_' + k + '_' + saison; if (s.textures.exists(cle)) return cle;
  const L = 26, H = 40, t = toileDecor(L, H), n = 6 + (k % 3);
  t.rampes.tige = rampe({ brumes: 0xa88a3a, givre: 0x9a8e6e }[saison] || 0x5a8a32);
  t.rampes.lame = rampe({ brumes: 0xc0a050, givre: 0xb0a488 }[saison] || 0x6a9a3a);
  t.rampes.massette = rampe(0x6a3e1e); t.rampes.neigeC = RAMPES_COTEAUX.neigeC;
  for (let i = 0; i < n; i++) {
    const x0 = 3 + hachage(i, k, 7861) * (L - 6), h = 20 + hachage(i, 2, 7862 + k) * 18, pench = (hachage(i, 3, 7863 + k) - 0.5) * 8;
    traitHD(t, i % 3 === 1 ? 'lame' : 'tige', [[x0, H - 1], [x0 + pench * 0.5, H - h * 0.6], [x0 + pench, H - h]], i % 3 === 1 ? 0.9 : 0.6, 0.2 * (i % 2));
    if (i % 2 === 0) { t.forme('massette', ellipsoide(x0 + pench, H - h + 4, 1.5, 3.6), { decalage: 0.3 }); if (saison === 'givre') { t.poser(Math.round(x0 + pench), Math.round(H - h), 'neigeC', 5); t.poser(Math.round(x0 + pench) - 1, Math.round(H - h + 1), 'neigeC', 4); } }
  }
  t.contour(); t.texture(s, cle); return cle;
}

// La cabane de Barnabé, posée sur son ponton : la même que sur la place (planches délavées, bardeaux, auvent rayé, filet,
// séchoir, enseigne au poisson), mais ses murs descendent jusqu'aux planches du ponton, sans l'assise de pierre (96 × 96,
// comme l'ancienne : ce qui s'y accroche reste à sa place). L'hiver, la neige sur le toit.
function cabanePilotisHD(scene, saison) {
  const cle = 'cabanePilotisHD' + (saison === 'givre' ? '_givre' : ''); if (scene.textures.exists(cle)) return cle;
  const L = 96, H = 96, t = toilePeche(L, H); Object.assign(t.rampes, RAMPES_DECOR); t.rampes.neigeC = RAMPES_COTEAUX.neigeC;
  for (let x = 6; x < L - 6; x += 6) planche(t, x, 30, 6, 62, 'chene', { horizontale: false, graine: 900 + x, noeuds: 1 });
  for (let x = 5; x < L - 5; x++) { t.poser(x, 92, 'cheneSombre', 2); t.poser(x, 93, 'cheneSombre', 1); t.poser(x, 94, 'cheneSombre', 2); t.poser(x, 95, 'cheneSombre', 1); }   // la sablière, posée sur le ponton
  for (let y = 8; y < 32; y++) for (let x = 0; x < L; x++) {
    const bord = Math.abs(x - L / 2) < (y - 6) * 2.4 + 6; if (!bord) continue;
    const rang = Math.floor((y - 8) / 4), dec = (rang % 2) * 4, b = Math.floor((x + dec) / 8);
    t.poser(x, y, 'cheneSombre', (y - 8) % 4 === 3 ? 0 : 2 + Math.round(hachage(b, rang, 901) * 2) - ((x + dec) % 8 === 0 ? 1 : 0));
  }
  if (saison === 'givre') for (let y = 8; y < 30; y++) for (let x = 0; x < L; x++) { const bord = Math.abs(x - L / 2) < (y - 6) * 2.4 + 6; if (bord && ((y - 8) % 4 !== 3) && fbm(x * 0.15, y * 0.3, 7870) > 0.42 - (y < 14 ? 0.3 : 0)) t.poser(x, y, 'neigeC', y < 12 ? 5 : 4); }
  for (let y = 40; y < 62; y++) for (let x = 16; x < L - 16; x++) t.poser(x, y, 'cheneSombre', y < 44 ? 0 : 1);
  t.rampes.auventP = rampe(0x3a6a9a); t.rampes.lin = RAMPES_OBJETS.lin;
  for (let y = 34; y < 42; y++) for (let x = 12; x < L - 12; x++) { const bande = Math.floor(x / 8) % 2; if (y >= 40 && Math.abs((x % 8) - 4) > (42 - y) * 2) continue; t.poser(x, y, bande ? 'lin' : 'auventP', y < 36 ? 4 : 3); }
  planche(t, 10, 60, L - 20, 5, 'chene', { graine: 902, noeuds: 2 }); for (let x = 10; x < L - 10; x++) t.poser(x, 60, 'chene', 5);
  for (let y = 30; y < 90; y++) for (let x = 0; x < 14; x++) if ((x + y) % 4 === 0 || (x - y + 100) % 4 === 0) t.poser(x, y, 'filet', 3 + ((x + y) % 8 === 0 ? 1 : 0));
  for (const [x, y] of [[3, 34], [9, 46], [4, 58], [10, 70], [5, 82]]) { t.poser(x, y, 'liege', 4); t.poser(x + 1, y, 'liege', 3); t.poser(x, y + 1, 'liege', 2); t.poser(x + 1, y + 1, 'liege', 2); }
  for (let x = L - 14; x < L; x++) t.poser(x, 44, 'cheneSombre', 3);
  planche(t, 30, 0, 36, 10, 'chene', { graine: 903, noeuds: 0 }); for (const [x, y] of [[36, 2], [36, 8]]) t.poser(x, y, 'cheneSombre', 0);
  t.contour(); t.texture(scene, cle); return cle;
}

// Le ponton de la cabane et sa passerelle jusqu'à la rive (demi-résolution, ×2, posé par son coin haut gauche en
// (passerelle.x0, ponton.y0)) : des planches couchées d'est en ouest sur le ponton, en travers sur la passerelle ; la
// lisse du bord, et les pilotis qui plongent dans l'eau, plus sombres là où ils sont mouillés.
function pontonPlaceHD(s, saison) {
  const cle = 'pontonPlace' + (saison === 'givre' ? '_givre' : ''); if (s.textures.exists(cle)) return cle;
  const E = ETANG_PLACE, [px0, py0, px1, py1] = E.ponton, [qx0, qy0, qx1, qy1] = E.passerelle;
  const L = Math.round((px1 - qx0) / 2), H = Math.round((py1 - py0) / 2) + 10, t = toileDecor(L, H), G0 = 7880;
  t.rampes.neigeC = RAMPES_COTEAUX.neigeC;
  const dx = Math.round((px0 - qx0) / 2), dyH = Math.round((py1 - py0) / 2);
  const qa = Math.round((qy0 - py0) / 2), qb = Math.round((qy1 - py0) / 2), qr = Math.round((qx1 - qx0) / 2);
  // le ponton : des planches de 3 rangs, leurs aboutages décalés
  for (let y = 0; y < dyH; y++) for (let x = dx; x < L; x++) {
    const pl = Math.floor(y / 3), joint = y % 3 === 2 || (x + pl * 11) % 23 === 0;
    let k = joint ? 1 : 3 + (fbm(x * 0.2, pl * 1.3, G0) > 0.58 ? 1 : 0) - (hachage(Math.floor((x + pl * 11) / 23), pl, G0 + 1) > 0.8 ? 1 : 0);
    if (x === dx || x === L - 1) k = Math.min(k, 2);
    t.poser(x, y, 'chene', k);
  }
  // la passerelle : les mêmes planches, plus étroite, de la rive au ponton ; son bout repose sur la vase de la rive
  for (let y = qa; y < qb; y++) for (let x = 0; x < Math.max(qr, dx); x++) {
    const pl = Math.floor((y - qa) / 3), joint = (y - qa) % 3 === 2 || (x + pl * 7) % 17 === 0;
    t.poser(x, y, 'chene', joint ? 1 : 3 + (fbm(x * 0.2, pl * 1.3, G0 + 2) > 0.58 ? 1 : 0) - (x < 3 ? 1 : 0));
  }
  // la lisse du bord (face à nous), sous le ponton et sous la passerelle
  for (let x = dx; x < L; x++) { t.poser(x, dyH, 'cheneSombre', 4); t.poser(x, dyH + 1, 'cheneSombre', 2); }
  for (let x = 4; x < dx; x++) { t.poser(x, qb, 'cheneSombre', 4); t.poser(x, qb + 1, 'cheneSombre', 2); }
  // les pilotis
  const pieu = (x0, y0, h) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + 3; x++) t.poser(x, y, 'cheneSombre', y > y0 + h - 4 ? 0 : x === x0 ? 3 : 2); };
  for (let x = dx + 3; x < L - 2; x += 26) pieu(x, dyH + 2, 8);
  pieu(L - 4, dyH + 2, 8);
  for (const x of [8, dx - 6]) pieu(x, qb + 2, 7);
  if (saison === 'givre') for (let x = dx; x < L; x++) for (let y = 0; y < dyH; y++) if (fbm(x * 0.12, y * 0.25, G0 + 3) > (x - dx < 6 || L - x < 6 || dyH - y < 4 ? 0.4 : 0.62)) t.poser(x, y, 'neigeC', 4 + (hachage(x, y, G0 + 4) > 0.5 ? 1 : 0));
  t.contour(); t.texture(s, cle); return cle;
}
// Une bitte d'amarrage : un pieu qui dépasse au coin du ponton, sa corde enroulée (5 × 14)
function bittePontonHD(s) {
  const cle = 'bittePonton'; if (s.textures.exists(cle)) return cle;
  const t = toileDecor(6, 14); t.rampes.corde = rampe(0xc8a870);
  for (let y = 0; y < 14; y++) for (let x = 1; x < 5; x++) t.poser(x, y, 'cheneSombre', y === 0 ? 5 : x === 1 ? 4 : 2);
  for (const y of [6, 8]) for (let x = 0; x < 6; x++) t.poser(x, y, 'corde', x < 2 ? 4 : 2);
  t.contour(); t.texture(s, cle); return cle;
}
// La barque, vue de trois quarts (50 × 20) : on voit dedans (le fond dans l'ombre, deux bancs, une rame couchée), le
// plat-bord clair tout autour, et le bordé à clins du côté qui nous fait face ; l'arrière arrondi à gauche, la proue
// effilée à droite
function barquePlaceHD(s, saison) {
  const cle = 'barquePlace' + (saison === 'givre' ? '_givre' : ''); if (s.textures.exists(cle)) return cle;
  const L = 50, H = 20, t = toileDecor(L, H), yc = 7; t.rampes.neigeC = RAMPES_COTEAUX.neigeC;
  const larg = x => { const u = (x + 0.5) / L; if (u < 0.12) return 6.2 * Math.sqrt(Math.max(0, u / 0.12)) * 0.5 + 3.1; if (u < 0.55) return 6.2; return 6.2 * Math.max(0, 1 - Math.pow((u - 0.55) / 0.45, 1.5)); };
  for (let x = 0; x < L; x++) {
    const w = larg(x); if (w < 0.6) continue;
    const yLoin = Math.round(yc - w * 0.62), yPres = Math.round(yc + w * 0.62), yQuille = Math.round(yPres + 1 + w * 0.75);
    for (let y = yLoin; y <= yQuille; y++) {
      if (y === yLoin || y === yPres) { t.poser(x, y, 'chene', y === yPres ? 5 : 4); continue; }   // le plat-bord
      if (y < yPres) {   // l'intérieur : le fond à l'ombre du bord d'en face, les bancs
        const banc = (Math.abs(x - 15) <= 1 || Math.abs(x - 29) <= 1) && w > 3;
        t.poser(x, y, banc ? 'chene' : 'cheneSombre', banc ? (y === yLoin + 1 ? 2 : 4) : y <= yLoin + 1 ? 2 : 3); continue;
      }
      t.poser(x, y, 'chene', y === yQuille ? 1 : (y - yPres) % 2 ? 3 : 2);   // le bordé, à clins
    }
  }
  for (let x = 8; x < 36; x++) { const y = Math.round(yc - 1 + (x - 8) * 0.08); t.poser(x, y, 'chene', 5); }   // la rame
  for (let x = 34; x < 38; x++) t.poser(x, yc + 1, 'chene', 4);   // sa pale
  if (saison === 'givre') for (let x = 2; x < 40; x++) if (hachage(x, 1, 7890) > 0.3) t.poser(x, Math.round(yc - larg(x) * 0.62) - 0, 'neigeC', 5);
  t.contour(); t.texture(s, cle); return cle;
}
