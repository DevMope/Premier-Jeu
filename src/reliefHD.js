// (v1.65, la rue Soucolline, retours du 01/11, phase 1) L'ESSAI DE STYLE « en vrai relief », sur trois bâtiments : le
// barbier (le Fil d'Argent), la maison haute à colombages et la banque. À côté de la fontaine (dessinée en volume), leurs
// façades faisaient « collage » : plates, sans épaisseur. Ici, le même dessin reçoit son volume, avec une seule lumière,
// le soleil en haut à gauche :
//   - le toit a une épaisseur (sa rive éclairée, sa sous-face sombre) et déborde ; il jette son ombre sur la façade ;
//   - les fenêtres et les portes sont en retrait : l'ombre du linteau et du jambage gauche dans l'embrasure, le jambage
//     droit éclairé, un appui de pierre qui dépasse (dessus clair, dessous dans l'ombre, et son ombre sur le mur) ;
//   - les poutres et les pierres accrochent la lumière (arêtes du haut et de gauche claires, du bas et de droite sombres)
//     et jettent une ombre fine sur l'enduit ; le soubassement dépasse ;
//   - quand un côté du bâtiment est libre, son mur de côté se voit en trois quarts, dans l'ombre, et le toit le couvre ;
//   - la cheminée est un volume (une face éclairée, une face dans l'ombre, son chapeau) ;
//   - au pied des murs, sur le pavé, une ombre de contact (ombrePiedHD).
// RELIEF_ESSAI (ou window.RELIEF_ESSAI = false) : avec ou sans, pour comparer sur les captures avant de l'étendre.
// (Réponses du 01/11, phase 2) L'essai des murs de côté est ABANDONNÉ (« pas logique vu qu'on est en face ») : RELIEF_ESSAI
// reste à false. La direction validée est l'EFFET DE HAUTEUR DE CAMÉRA, façon Stardew Valley : on voit le toit par le dessus,
// la façade en dessous, le sol comme un plan ; c'est le second essai, VUE_HAUT_ESSAI, plus bas dans ce fichier.
const RELIEF_ESSAI = false;
function reliefActif() { return (typeof window !== 'undefined' && window.RELIEF_ESSAI !== undefined) ? !!window.RELIEF_ESSAI : RELIEF_ESSAI; }
const VUE_HAUT_ESSAI = true;
function vueHautActive() { return (typeof window !== 'undefined' && window.VUE_HAUT_ESSAI !== undefined) ? !!window.VUE_HAUT_ESSAI : VUE_HAUT_ESSAI; }
// (Réponses du 01/11, après-midi, Q194/Q195 : phase 3) LA CAMÉRA PLUS HAUTE. La projection choisie, en chiffres, d'après les
// références Stardew (angle d'environ 45° par le dessus) :
//   - les façades (verticales) : 1 pixel pour 1 pixel, inchangées ;
//   - les toits et le sol (horizontaux) : 1 pixel vertical à l'écran pour 1 pixel de profondeur ; un toit occupe donc à peu
//     près autant de hauteur que sa façade (le barbier : 70 de pan avant + 16 de pan arrière pour 86 de mur) ; les rangs de
//     tuiles se resserrent vers le faîte (ils s'éloignent) ; le pan arrière rentre vers le fond ;
//   - les personnages gardés tels quels, avec leur ombre au sol en ellipse ; les bancs, réverbères, bacs et la tente aussi ;
//   - les trottoirs comme un plan : la bordure jette une marche d'ombre sur la chaussée (Q198-2) ;
//   - la caméra recule (zoom 1,1 au lieu de 1,25) et JeuneGoy se tient plus bas à l'écran (+40), pour que toits et chaussée
//     tiennent à l'écran.
// CAMERA_HAUTE_ESSAI (ou window.CAMERA_HAUTE_ESSAI = false pour revoir la phase 2) ; appliqué au tronçon d'essai seulement.
const CAMERA_HAUTE_ESSAI = true;
function cameraHauteActive() { return vueHautActive() && ((typeof window !== 'undefined' && window.CAMERA_HAUTE_ESSAI !== undefined) ? !!window.CAMERA_HAUTE_ESSAI : CAMERA_HAUTE_ESSAI); }
const TRONCON_ESSAI = { x0: 2000, x1: 3560 };   // (le barbier, la maison haute, la banque, la tente, et leur bout de rue)
// (Réponses du 01/11, soir, Q199 à Q208 : phase 4) LE RACCORD TOIT-FAÇADE, et l'angle un peu plus incliné. D'après Stardew :
// le toit n'est pas un rectangle posé sur la façade, c'est un volume : sa rive avant, épaisse, déborde devant la façade et y
// jette son ombre ; ses rives de côté descendent en biais (le toit converge vers le faîte : 14 px de chaque côté) ; le faîte a
// sa ligne claire et ses faîtières ; le pan arrière s'échappe vers le fond, plus étroit encore ; sous la rive, la façade a sa
// sablière en léger renflement ; ses deux bords portent une bande fine et sombre (les murs latéraux, deux à trois pixels).
// Les chiffres : toit (pan avant) = 1,2 × la hauteur de la façade ; pan arrière 14 à 16 rangs ; zoom 1,0.
// Les personnages (Q207) : une variante de projection (corpsVuDeHaut) : la tête et les épaules 10 % plus larges, les jambes
// 20 % plus courtes, à partir des mêmes images (corpsHD n'est pas refait). VOLUME_ESSAI (window.VOLUME_ESSAI = false : la phase 3).
const VOLUME_ESSAI = true;
function volumeActif() { return cameraHauteActive() && ((typeof window !== 'undefined' && window.VOLUME_ESSAI !== undefined) ? !!window.VOLUME_ESSAI : VOLUME_ESSAI); }
// Un toit en volume, le faîte parallèle à la rue : un trapèze (large à l'égout, qui converge de conv vers le faîte), ses
// rangs en perspective, ses rives de côté en biais (bois : la gauche éclairée, la droite dans l'ombre), le faîte, le pan
// arrière qui s'échappe, la rive avant épaisse (D de débord de chaque côté). xa..xb : la façade.
function toitVolume(t, { xa, xb, yEgout, hAvant, hDos, mat = 'ardoiseToit', g = 1, D = 6, conv = 14, pas = 8, rang = 4, bois = 'cheneSombre' }) {
  const yF = yEgout - hAvant, yH = yF - 2 - hDos, rangAu = rangsPerspective(yEgout, hAvant, rang), nCols = Math.max(4, Math.round((xb - xa + 2 * D) / pas));
  const bord = v => [xa - D + v * (conv + D), xb + D - v * (conv + D)];
  const tuile = (x, y, xl, xr, r, k0, dk) => { const w = xr - xl, u = (x - xl) / w, cp = u * nCols + (r % 2) * 0.5, frac = cp - Math.floor(cp), joint = frac * (w / nCols) < 1, h = hachage(Math.floor(cp), r, g);
    return clampR(k0 + (h > 0.84 ? 1 : h < 0.12 ? -1 : 0) + dk - (joint ? 1 : 0)); };
  for (let y = yF; y < yEgout; y++) { const v = (yEgout - y) / hAvant, [xl, xr] = bord(v), [r, f] = rangAu(y);
    for (let x = Math.round(xl); x <= Math.round(xr); x++) t.poser(x, y, mat, tuile(x, y, xl, xr, r, 3 + (v > 0.72 ? 1 : 0), f >= 1 - 1 / rang - 1e-6 ? 1 : f < 1 / rang ? -2 : 0));
    for (let d = 0; d < 2; d++) { t.poser(Math.round(xl) + d, y, bois, d ? 3 : 4); t.poser(Math.round(xr) - d, y, bois, d ? 1 : 0); } }   // les rives de côté, en biais
  { const [xl, xr] = bord(1); for (let x = Math.round(xl) - 1; x <= Math.round(xr) + 1; x++) { t.poser(x, yF - 1, mat, 5); t.poser(x, yF - 2, mat, x % 6 === 5 ? 2 : 4); } }   // le faîte
  for (let y = yH; y < yF - 2; y++) { const v = 1 + (yF - 2 - y) / hAvant * 1.8, [xl, xr] = bord(v), r = Math.floor((y - yH) / 3), ty = (y - yH) % 3;
    for (let x = Math.round(xl); x <= Math.round(xr); x++) if (!t.mat(x, y)) t.poser(x, y, mat, y === yH ? 0 : tuile(x, y, xl, xr, r, 1, ty === 0 ? 1 : 0)); }   // le pan arrière
  for (let x = xa - D; x <= xb + D; x++) { t.poser(x, yEgout, bois, 4); t.poser(x, yEgout + 1, bois, 2); t.poser(x, yEgout + 2, bois, 0); }   // la rive avant : chant éclairé, sous-face
  return { yF, yH };
}
// La façade sous son toit : la sablière en léger renflement, l'ombre de la rive, et les murs latéraux en bande fine sombre
function facadeVolume(t, xa, xb, yHaut, yBas, mur) {
  for (let x = xa; x <= xb; x++) for (const [dy, d] of [[0, 1], [1, 1], [2, -1]]) if (mur(t.mat(x, yHaut + dy))) teinterR(t, x, yHaut + dy, d);
  ombreDebordR(t, xa, xb, yHaut + 3, 8, mur);
  for (let y = yHaut; y <= yBas; y++) for (const [x, d] of [[xa, -2], [xa + 1, -1], [xb, -3], [xb - 1, -2], [xb - 2, -1]]) if (mur(t.mat(x, y))) teinterR(t, x, y, d);
}
// (Q207) Un personnage un peu plus vu de dessus : à partir de son image, la tête et les épaules (60 % du haut) 10 % plus
// larges, les jambes (40 % du bas) 20 % plus courtes. La même clé, suivie de _vh ; rien d'autre ne change.
function corpsVuDeHaut(s, cle) {
  if (!volumeActif() || !s.textures.exists(cle) || /_vh$/.test(cle)) return cle;
  const k = cle + '_vh'; if (s.textures.exists(k)) return k;
  const src = s.textures.get(cle).getSourceImage(), w = src.width, h = src.height; if (!w || !h) return cle;
  const yc = Math.round(h * 0.6), w2 = Math.round(w * 1.1), W = w2 + (w2 - w) % 2, H2 = yc + Math.round((h - yc) * 0.8);
  const tex = s.textures.createCanvas(k, W, H2), c = tex.getContext(); c.imageSmoothingEnabled = false;
  c.drawImage(src, 0, 0, w, yc, (W - w2) / 2, 0, w2, yc);
  c.drawImage(src, 0, yc, w, h - yc, (W - w) / 2, yc, w, H2 - yc);
  tex.refresh(); return k;
}

// --- les outils, sur une toile (une matière et un ton de 0 à 5 par pixel) ---
function teinterR(t, x, y, d) { const m = t.mat(x, y); if (!m) return; t.poser(x, y, m, Math.max(0, Math.min(5, t.teinte(x, y) + d))); }
// recopier une toile dans une autre, décalée (pour agrandir le cadre d'un dessin)
function recopierToile(src, t, ox, oy) { for (let y = 0; y < src.h; y++) for (let x = 0; x < src.l; x++) { const m = src.mat(x, y); if (m) t.poser(x + ox, y + oy, m, src.teinte(x, y)); } }
// l'embrasure d'une ouverture (dedans(x, y) : le pixel est dans l'ouverture) : l'ombre du linteau et du jambage gauche,
// le jambage droit éclairé ; et l'appui, s'il y en a un (sa ligne y, de xa à xb)
function embrasureR(t, x0, y0, x1, y1, dedans, { appui = null, prof = 3 } = {}) {
  const sous = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { if (!dedans(x, y)) continue;
    let d = 0;
    if (!dedans(x, y - 1) || !dedans(x, y - 2)) d -= 2; else if (prof > 2 && !dedans(x, y - 3)) d -= 1;   // sous le linteau
    if (!dedans(x - 1, y)) d -= 2; else if (prof > 1 && !dedans(x - 2, y)) d -= 1;                       // le jambage gauche fait de l'ombre
    if (!dedans(x + 1, y) && d === 0) d = 1;                                                 // le jambage droit, éclairé
    if (d) sous.push([x, y, Math.max(-3, d)]); }
  for (const [x, y, d] of sous) teinterR(t, x, y, d);
  if (appui) { const [ya, xa, xb, mat = 'pierre'] = appui;
    for (let x = xa; x <= xb; x++) { t.poser(x, ya, mat, 5); t.poser(x, ya + 1, mat, 2); teinterR(t, x + 1, ya + 2, -1); } }
}
// les arêtes : un pixel d'une matière en saillie (poutre, pierre, corniche) s'éclaire du côté du soleil (haut, gauche),
// s'assombrit de l'autre (bas, droite), et son ombre tombe d'un pixel sur le mur, en bas à droite
function aretesR(t, x0, y0, x1, y1, saillie, mur) {
  const L = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const m = t.mat(x, y); if (!m) continue;
    if (saillie(m, x, y)) { let d = 0; if (!saillie(t.mat(x, y - 1), x, y - 1)) d += 1; if (!saillie(t.mat(x - 1, y), x - 1, y)) d += 1; if (!saillie(t.mat(x, y + 1), x, y + 1)) d -= 1; if (!saillie(t.mat(x + 1, y), x + 1, y)) d -= 1; if (d) L.push([x, y, Math.max(-1, Math.min(1, d))]); }
    else if (mur(m) && (saillie(t.mat(x - 1, y - 1), x - 1, y - 1) || saillie(t.mat(x, y - 1), x, y - 1)) && !saillie(t.mat(x + 1, y), x + 1, y)) L.push([x, y, -1]); }
  for (const [x, y, d] of L) teinterR(t, x, y, d);
}
// l'ombre du débord du toit (ou d'une corniche) sur le mur, sous la ligne y : forte d'abord, puis qui s'efface
function ombreDebordR(t, x0, x1, y, h, mur) { for (let k = 0; k < h; k++) for (let x = x0; x <= x1; x++) if (mur(t.mat(x, y + k))) teinterR(t, x, y + k, k < Math.ceil(h * 0.6) ? -2 : -1); }
// la façade est une boîte : son arête de gauche (au soleil) plus claire, celle de droite plus sombre
function boiteR(t, x0, x1, y0, y1, mur) {
  for (let y = y0; y <= y1; y++) for (const [x, d] of [[x0, 1], [x0 + 1, 1], [x1, -1], [x1 - 1, -1]]) if (mur(t.mat(x, y))) teinterR(t, x, y, d);
}
// le mur de côté, en trois quarts, à droite de la façade (dans l'ombre : le soleil est à gauche) : chaque colonne recule
// d'un demi-pixel vers le haut ; on y recopie, plus sombres, les matières de la façade à la même hauteur
function murDeCoteR(t, xBord, yHaut, yBas, larg, { recul = 0.5, source = null, assombrir = 2 } = {}) {
  for (let c = 0; c < larg; c++) { const sh = Math.round((c + 1) * recul), sx = source ? source(c) : xBord - 2 - (c % 9);
    for (let y = yHaut; y <= yBas; y++) { const m = t.mat(sx, y); if (!m) continue; const k = t.teinte(sx, y) - assombrir - (c === 0 ? 1 : 0);
      t.poser(xBord + c, y - sh, m, Math.max(0, Math.min(5, k))); } }
}
// l'ombre de contact au pied d'un mur, sur le pavé (une image, posée dans le monde sous le bâtiment) : larg × 9 pixels,
// noire et transparente, plus forte contre le mur ; à droite, l'ombre portée du mur de côté (cote : sa largeur)
function ombrePiedHD(s, larg, cote = 0) {
  const cle = `ombrePied_${larg}_${cote}`; if (s.textures.exists(cle)) return cle;
  const H = 12, L = larg + cote, tex = s.textures.createCanvas(cle, L, H), c = tex.getContext();
  for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) {
    const v = 1 - y / H, bord = Math.min(1, x / 3, (L - 1 - x) / 3), surCote = x >= larg ? 1 - (x - larg) / Math.max(1, cote) : 1;
    const a = 0.62 * v * v * bord * surCote; if (a <= 0.01) continue;
    c.fillStyle = `rgba(16,12,20,${a.toFixed(3)})`; c.fillRect(x, y, 1, 1); }
  tex.refresh(); return cle;
}

// --- 1. le barbier (le Fil d'Argent), en relief : le même dessin (peindreBoutiqueBarbier), dans un cadre agrandi (4 de
//     débord de chaque côté, 8 de toit en plus en haut) ---
const RELIEF_BARBIER = { ox: 4, oy: 8, L: 132, H: 120 };
function barbierReliefHD(s) {
  const cle = 'boutiqueBarbierHD_relief'; if (s.textures.exists(cle)) return cle;
  const src = peindreBoutiqueBarbier(), { ox, oy, L, H } = RELIEF_BARBIER, t = toileDecor(L, H); rampesBarbier(t);
  // a. le toit refait en volume : des rangs d'ardoises (le pan éclairé à gauche, plus sombre à droite), la rive épaisse qui
  //    déborde, le faîtage clair ; on garde le reste du dessin
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.l; x++) { const m = src.mat(x, y); if (m && !(y < 26 && m === 'ardoise')) t.poser(x + ox, y + oy, m, src.teinte(x, y)); }
  const yE = 26 + oy, yF = 3 + oy;   // l'égout (sous la rive), le faîtage
  for (let y = yF; y < yE; y++) { const v = (y - yF) / (yE - yF), demi = 22 + v * (L / 2 - 22), xa = Math.round(L / 2 - demi), xb = Math.round(L / 2 + demi);
    const r = Math.floor((y - yF) / 3), dec = (r % 2) * 4;
    for (let x = xa; x <= xb; x++) { const u = (x - xa) / Math.max(1, xb - xa), b = Math.floor((x + dec) / 8), joint = (x + dec) % 8 === 0 || (y - yF) % 3 === 2;
      let k = 3 - (u > 0.62 ? 1 : 0) + (u < 0.2 ? 1 : 0) + (hachage(b, r, 7311) > 0.82 ? 1 : 0) - (joint ? 1 : 0);
      if (y === yF) k = 5; if (x === xa) k = 4; if (x === xb) k = 1;
      t.poser(x, y, 'ardoise', Math.max(0, Math.min(5, k))); } }
  for (let x = 0; x < L; x++) { t.poser(x, yE, 'cheneSombre', 4); t.poser(x, yE + 1, 'cheneSombre', 2); t.poser(x, yE + 2, 'cheneSombre', 0); }   // la rive : son chant éclairé, sa sous-face
  const mur = m => m === 'platre', bois = m => m === 'cheneSombre' || m === 'chene';
  ombreDebordR(t, ox, L - ox - 1, yE + 3, 8, mur);
  boiteR(t, ox + 2, L - ox - 3, yE + 3, 97 + oy, m => mur(m) || bois(m));
  // b. les poutres et l'assise de pierre accrochent la lumière ; l'assise dépasse (son dessus éclairé)
  aretesR(t, ox, yE + 3, L - ox - 1, H - 1, (m, x, y) => bois(m) && y < 98 + oy, mur);
  aretesR(t, ox, 98 + oy, L - ox - 1, H - 1, m => m === 'pierre', () => false);
  for (let x = ox; x < L - ox; x++) if (t.mat(x, 98 + oy) === 'pierre') t.poser(x, 98 + oy, 'pierre', 5);
  // c. l'auvent : sa bordure festonnée devant, et l'ombre qu'il jette sur la vitrine
  for (let x = 12 + ox; x < 58 + ox; x++) { teinterR(t, x, 62 + oy, -2); teinterR(t, x, 63 + oy, -1); }
  // d. la vitrine et la porte en retrait (la porte est ronde en haut), la marche qui dépasse
  embrasureR(t, 14 + ox, 63 + oy, 55 + ox, 88 + oy, (x, y) => x >= 14 + ox && x <= 55 + ox && y >= 63 + oy && y <= 88 + oy && t.mat(x, y) !== 'chene', { appui: [90 + oy, 12 + ox, 57 + ox, 'pierre'] });
  const porte = (x, y) => { const dx = (x + 0.5 - 88 - ox) / 16, dy = (y + 0.5 - 74 - oy) / 16; return x >= 72 + ox && x < 104 + ox && y >= 58 + oy && y < 96 + oy && (y >= 74 + oy || dx * dx + dy * dy <= 1); };
  embrasureR(t, 72 + ox, 58 + oy, 103 + ox, 95 + oy, porte);
  for (let x = 70 + ox; x < 106 + ox; x++) { t.poser(x, 96 + oy, 'pierre', 5); t.poser(x, 97 + oy, 'pierre', 3); t.poser(x, 99 + oy, 'pierre', 1); }
  // e. le pied des murs, un peu plus sombre (l'ombre portée du sol)
  for (let x = ox; x < L - ox; x++) for (let k = 1; k <= 2; k++) teinterR(t, x, H - k, -1);
  t.contour(); t.texture(s, cle); return cle;
}

// --- 2. la banque, en relief : le même dessin (peindreBanqueRue), son mur de côté à droite (la palissade du porche ne le
//     cache qu'en bas), le toit d'ardoise qu'on voit derrière le fronton, les fenêtres et la porte en retrait ---
const RELIEF_BANQUE = { ox: 0, oy: 12, cote: 18, L: 218, H: 188 };
function banqueReliefHD(s) {
  const cle = 'rueBanqueHD_relief'; if (s.textures.exists(cle)) return cle;
  const src = peindreBanqueRue(), { oy, cote, L, H } = RELIEF_BANQUE, t = toileDecor(L, H); Object.assign(t.rampes, RAMPES_RUE);
  // a. derrière le fronton : les deux pans du toit d'ardoise qui reculent (le pan gauche au soleil, le droit dans l'ombre),
  //    le faîtage qui part de la pointe
  for (let y = 18; y < 50; y++) { const v = (y - 18) / 32, xa = Math.round(100 - v * 96), xb = Math.round(100 + v * 96);
    for (let k = 1; k <= 10; k++) { const sh = Math.round(k * 0.55);
      const r = Math.floor((y + k) / 3), joint = (y + k) % 3 === 0;
      t.poser(xa - 0 + k - 1 + 0, y + oy - sh - 3, 'ardoiseToit', 3 + (joint ? -1 : 0) + (hachage(r, xa, 7321) > 0.85 ? 1 : 0));
      t.poser(xb + k - 1, y + oy - sh - 3, 'ardoiseToit', 1 + (joint ? -1 : 0) + (hachage(r, xb, 7322) > 0.85 ? 1 : 0)); } }
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.l; x++) { const m = src.mat(x, y); if (m) t.poser(x, y + oy, m, src.teinte(x, y)); }
  const pierre = m => m === 'taille', yC = 50 + oy;
  // b. le mur de côté (à droite), en pierre de taille, dans l'ombre ; la corniche y fait retour ; le toit le couvre
  murDeCoteR(t, 200, yC, H - 1 - 10, cote, { recul: 0.55, source: c => 186 - (c % 12), assombrir: 2 });
  for (let c = 0; c < cote; c++) { const sh = Math.round((c + 1) * 0.55); t.poser(200 + c, yC - sh, 'taille', 3); t.poser(200 + c, yC + 1 - sh, 'taille', 1); t.poser(200 + c, yC + 2 - sh, 'taille', 0);
    for (let k = 1; k <= 8; k++) t.poser(200 + c, yC - sh - k, 'ardoiseToit', k === 8 ? 2 : 1 + (k % 3 === 0 ? -1 : 0)); }
  // c. la corniche et le fronton dépassent : leur ombre sur le mur ; les colonnes et les pierres accrochent la lumière
  ombreDebordR(t, 4, 196, yC + 3, 7, pierre);
  boiteR(t, 10, 189, yC + 3, H - 12, pierre);
  for (let y = 18 + oy; y < yC; y++) { const v = (y - 18 - oy) / 32, xa = Math.round(100 - v * 96), xb = Math.round(100 + v * 96); teinterR(t, xa, y, 1); teinterR(t, xa + 1, y, 1); teinterR(t, xb, y, -2); teinterR(t, xb - 1, y, -1);
    for (let x = xa + 3; x < xb - 2; x++) if (y < 18 + oy + 4 + (x < 100 ? (100 - x) * 0.33 : (x - 100) * 0.33) - 0) teinterR(t, x, y + 2, -1); }   // (le tympan, en retrait sous la corniche rampante)
  // d. les fenêtres et la porte en retrait, leurs appuis ; les marches : le dessus de chaque marche éclairé
  for (const fx of [20, 162]) embrasureR(t, fx, 70 + oy, fx + 17, 115 + oy, (x, y) => x >= fx && x <= fx + 17 && y >= 70 + oy && y <= 115 + oy, { appui: [116 + oy, fx - 2, fx + 19, 'taille'] });
  const porte = (x, y) => { const dx = (x + 0.5 - 100) / 20, dy = (y + 0.5 - (176 - 62 + 20) - oy) / 20; return x >= 80 && x < 120 && y >= 176 - 62 + oy && y < 176 - 10 + oy && (y >= 176 - 62 + 20 + oy || dx * dx + dy * dy <= 1); };
  embrasureR(t, 80, 176 - 62 + oy, 119, 176 - 11 + oy, porte, { prof: 3 });
  // e. le pied des murs, sur le pavé
  for (let x = 0; x < 200; x++) teinterR(t, x, H - 1, -1);
  t.contour(); t.texture(s, cle); return cle;
}

// --- 3. la maison haute : maison5 avec { relief: true } (villeDecorHD.js) ; ses outils sont ici ---
// Les retouches de relief d'une maison de ville déjà peinte (sa toile t, sa géométrie) : l'ombre du débord, les poutres et
// les pierres qui accrochent la lumière, les fenêtres et la porte en retrait, la cheminée en volume, le mur de côté.
function reliefMaison5(t, g) {
  const { L, yR, yT, bas, x0, x1, trous, porte, cheminee, cote, M } = g;
  const mur = m => m === 'platre' || /^enduit/.test(m || '') || m === 'taille' || m === 'taille3', bois = m => m === 'cheneSombre' || m === 'chene';
  // les poutres (colombages, sablières, corbeaux) et les pierres de taille
  aretesR(t, 0, yT + 6, L - 1, yR - 1, bois, mur);
  aretesR(t, x0, yR, x1 - 1, bas - 4, m => m === 'taille', () => false);
  // l'ombre du débord du toit sur l'étage du haut
  ombreDebordR(t, 0, L - 1, yT + 6, 8, m => mur(m) || bois(m));
  boiteR(t, x0, x1 - 1, yT + 6, bas - 5, m => mur(m) || bois(m));
  // les fenêtres et la porte en retrait, leurs appuis
  for (const [fx, fy, fl, fh] of trous) embrasureR(t, fx + 2, fy + 2, fx + fl - 3, fy + fh - 3, (x, y) => x >= fx + 2 && x <= fx + fl - 3 && y >= fy + 2 && y <= fy + fh - 3);
  if (porte) { const [px, py, pl, ph] = porte; embrasureR(t, px + 3, py + 3, px + pl - 4, py + ph - 2, (x, y) => x >= px + 3 && x <= px + pl - 4 && y >= py + 3 && y <= py + ph - 2, { prof: 3 }); }
  // la cheminée : sa face de gauche au soleil, celle de droite dans l'ombre, son chapeau
  if (cheminee) { const [cx, ch, chh] = cheminee; for (let y = ch; y < ch + chh; y++) { teinterR(t, cx - 6, y, 1); teinterR(t, cx + 5, y, -2); teinterR(t, cx + 6, y, -2); teinterR(t, cx + 4, y, -1); } }
  // le pied du mur, un peu plus sombre
  for (let x = x0; x < x1; x++) teinterR(t, x, bas - 4, -1);
  // le mur de côté (à droite) : l'étage et le rez-de-chaussée recopiés plus sombres, reculant vers le haut ; le toit le couvre
  if (cote) {
    murDeCoteR(t, x1, yT + 6, bas, cote, { recul: 0.5, source: c => x1 - 2 - (c % 10), assombrir: 2 });
    for (let c = 0; c < cote; c++) { const sh = Math.round((c + 1) * 0.5);
      for (let k = 0; k < 5; k++) { const y = yT + 6 - sh - k; if (y < 0) continue; const m = t.mat(L - 3, yT + 2 - k) || 'tuile'; t.poser(x1 + c, y, m, Math.max(0, (k === 0 ? 0 : 2) - (c > cote - 3 ? 1 : 0))); }
      t.poser(x1 + c, yT + 7 - sh, 'cheneSombre', 0); }
  }
}

// ======================= L'ESSAI « VUE DE HAUT » (réponses du 01/11, phase 2) =======================
// Ce que veut le joueur : un effet de hauteur de caméra comme dans Stardew Valley. Le toit se voit par le dessus (son pan
// avant, large, puis le faîte et un bout du pan arrière, plus court parce qu'il s'éloigne), avec son épaisseur et son débord ;
// la façade est en dessous, plus courte ; la cheminée est un volume posé sur le pan ; le bâtiment jette son ombre sur le
// sol, à sa droite (le soleil en haut à gauche). Les mêmes façades, enseignes et couleurs ; seul le toit change de nature.
// Essai sur trois bâtiments : le barbier (barbierVueHautHD), la banque (banqueVueHautHD), la maison haute (maison5 avec
// { vueHaut: true } : vueHautMaison5). VUE_HAUT_ESSAI (ou window.VUE_HAUT_ESSAI) : avec ou sans, pour les captures.
const clampR = k => Math.max(0, Math.min(5, k));
// Un toit à deux pans vu de haut, le faîte parallèle à la rue : le pan avant (de l'égout yEgout, exclu, jusqu'au faîte), le
// faîtage, le pan arrière dans l'ombre (hDos rangs, serrés : il s'éloigne), les rives qui débordent. pas × rang : une tuile.
// perspective : les rangs se resserrent vers le faîte (phase 3) ; rangAu(y) : le rang et la position dans le rang, en (0..1)
function rangsPerspective(yEgout, hAvant, rang) {
  const n = Math.max(2, Math.round(hAvant / (rang * 0.72)));
  return y => { const u = Math.min(1, (yEgout - y) / hAvant), s = n * (2 * u - u * u); return [Math.floor(s), s - Math.floor(s)]; };
}
function toitVuDeHaut(t, { x0, x1, yEgout, hAvant, hDos, mat = 'ardoiseToit', g = 1, pas = 8, rang = 4, perspective = false }) {
  const yF = yEgout - hAvant, yH = yF - 2 - hDos, rangAu = perspective ? rangsPerspective(yEgout, hAvant, rang) : y => [Math.floor((yEgout - 1 - y) / rang), ((yEgout - 1 - y) % rang) / rang];
  for (let y = yF; y < yEgout; y++) { const [r, f] = rangAu(y), dec = (r % 2) * (pas >> 1), v = (y - yF) / hAvant;
    for (let x = x0; x <= x1; x++) { const tx = ((x + dec) % pas + pas) % pas, h = hachage(Math.floor((x + dec) / pas), r, g);
      let k = 3 + (h > 0.84 ? 1 : h < 0.12 ? -1 : 0) + (v < 0.28 ? 1 : 0);   // vers le faîte, le pan prend plus de lumière
      if (f >= 1 - 1 / rang - 1e-6) k += 1; else if (f < 1 / rang) k -= 2;   // le haut de la tuile éclairé, son bas dans l'ombre du recouvrement
      if (tx === pas - 1) k -= 1;                                           // le joint
      if (x < x0 + 2) k += 1; else if (x > x1 - 2) k -= 1;
      t.poser(x, y, mat, clampR(k)); } }
  for (let x = x0 - 1; x <= x1 + 1; x++) { t.poser(x, yF - 1, mat, 5); t.poser(x, yF - 2, mat, x % 6 === 5 ? 2 : 4); }   // le faîtage
  for (let y = yH; y < yF - 2; y++) { const r = Math.floor((y - yH) / 3), ty = (y - yH) % 3, dec = (r % 2) * (pas >> 1), ret = Math.floor((yF - 2 - y) / 5);   // (le pan arrière rentre un peu : la perspective)
    for (let x = x0 + ret; x <= x1 - ret; x++) { const tx = ((x + dec) % pas + pas) % pas; let k = 1 + (ty === 0 ? 1 : 0) - (tx === pas - 1 ? 1 : 0) + (hachage(Math.floor((x + dec) / pas), r, g + 1) > 0.85 ? 1 : 0); if (y === yH) k = 0; if (!t.mat(x, y)) t.poser(x, y, mat, clampR(k)); } }
  for (let x = x0 - 1; x <= x1 + 1; x++) { t.poser(x, yEgout, mat, 1); t.poser(x, yEgout + 1, 'cheneSombre', 4); t.poser(x, yEgout + 2, 'cheneSombre', 1); }   // la rive : son chant éclairé, sa sous-face
  for (let y = yF - 2; y <= yEgout; y++) { t.poser(x0 - 1, y, mat, 4); t.poser(x1 + 1, y, mat, 0); }   // les rives de côté
  return { yF, yH };
}
// Une cheminée posée sur un pan de toit, en volume : la face gauche au soleil, la droite dans l'ombre, le chapeau, les mitres
function chemineeVueHaut(t, cx, yHaut, h, g = 1) {
  cheminee5(t, cx, yHaut, h, g);
  for (let y = yHaut; y < yHaut + h; y++) { teinterR(t, cx - 6, y, 1); teinterR(t, cx + 5, y, -2); teinterR(t, cx + 6, y, -2); teinterR(t, cx + 4, y, -1); }
  for (let k = 1; k <= 3; k++) for (let x = cx + 8; x < cx + 8 + k; x++) teinterR(t, x, yHaut + h - k, -2);   // son ombre sur le pan, à droite
}
// L'ombre que le bâtiment jette sur le sol (une image posée sur le trottoir, au pied de la façade) : elle s'étale vers la
// droite et vers le bas, et s'efface en s'éloignant du mur. larg × h pixels (× 2 dans le monde).
function ombrePorteeHD(s, larg, h = 10) {
  const cle = `ombrePortee_${larg}_${h}`; if (s.textures.exists(cle)) return cle;
  const L = larg + h + 2, tex = s.textures.createCanvas(cle, L, h), c = tex.getContext();
  for (let y = 0; y < h; y++) { const v = 1 - y / h, xa = 3 + y * 0.8, xb = larg + y * 0.8;
    for (let x = 0; x < L; x++) { const bord = Math.min(1, Math.max(0, x - xa + 1), Math.max(0, xb - x + 1)); const a = 0.5 * v * v * bord; if (a <= 0.01) continue;
      c.fillStyle = `rgba(16,12,24,${a.toFixed(3)})`; c.fillRect(x, y, 1, 1); } }
  tex.refresh(); return cle;
}
// --- 1. le barbier vu de haut : le même dessin, dans un cadre plus haut (oy rangs de plus pour le toit) ; son toit d'ardoise
//     à deux pans, une petite cheminée de brique sur le pan avant, les mêmes retouches de volume sur la façade ---
const VUE_HAUT_BARBIER = { ox: 4, oy: 30, L: 132, H: 142 };
// (phase 3, la caméra plus haute) le même barbier, avec un toit de 70 + 16 rangs : oy 64, H 176 ; la cheminée en (104, 46)
const CAMERA_HAUTE_BARBIER = { ox: 4, oy: 64, L: 132, H: 176, chem: [104, 44] };
// (phase 4, le volume) le pan avant fait 1,2 × le mur (104 pour 86), le pan arrière 14 : oy 96, H 208 ; 6 de débord de chaque côté
const VOLUME_BARBIER = { ox: 6, oy: 96, L: 136, H: 208, chem: [106, 76] };
function reglagesBarbier() { return volumeActif() ? VOLUME_BARBIER : cameraHauteActive() ? CAMERA_HAUTE_BARBIER : VUE_HAUT_BARBIER; }
function barbierVueHautHD(s) {
  const haut = cameraHauteActive(), vol = volumeActif(), cle = vol ? 'boutiqueBarbierHD_haut4' : haut ? 'boutiqueBarbierHD_haut3' : 'boutiqueBarbierHD_haut'; if (s.textures.exists(cle)) return cle;
  const src = peindreBoutiqueBarbier(), { ox, oy, L, H } = reglagesBarbier(), t = toileDecor(L, H); rampesBarbier(t);
  for (const [m, c] of [['brique2', 0x9a4a34], ['terreCuite', 0xb86a48], ['suieX', 0x2a2420], ['taille', 0x9a9488]]) if (!t.rampes[m]) t.rampes[m] = rampe(c);
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.l; x++) { const m = src.mat(x, y); if (m && !(y < 26 && m === 'ardoise')) t.poser(x + ox, y + oy, m, src.teinte(x, y)); }
  const yE = 26 + oy, mur = m => m === 'platre', bois = m => m === 'cheneSombre' || m === 'chene';
  const { yF } = vol ? toitVolume(t, { xa: 2 + ox, xb: L - ox - 3, yEgout: yE, hAvant: 104, hDos: 14, mat: 'ardoise', g: 7331, D: 6, conv: 14 })
    : toitVuDeHaut(t, { x0: ox, x1: L - ox - 1, yEgout: yE, hAvant: haut ? 70 : 40, hDos: haut ? 16 : 12, mat: 'ardoise', g: 7331, perspective: haut });
  chemineeVueHaut(t, 100 + ox, yF + (vol ? 12 : haut ? 10 : 8), vol ? 16 : haut ? 14 : 12, 7332);
  if (vol) facadeVolume(t, 2 + ox, L - ox - 3, yE + 3, H - 3, m => mur(m) || bois(m)); else ombreDebordR(t, ox, L - ox - 1, yE + 3, 7, mur);
  aretesR(t, ox, yE + 3, L - ox - 1, H - 1, (m, x, y) => bois(m) && y < 98 + oy, mur);
  for (let x = 12 + ox; x < 58 + ox; x++) { teinterR(t, x, 62 + oy, -2); teinterR(t, x, 63 + oy, -1); }
  embrasureR(t, 14 + ox, 63 + oy, 55 + ox, 88 + oy, (x, y) => x >= 14 + ox && x <= 55 + ox && y >= 63 + oy && y <= 88 + oy && t.mat(x, y) !== 'chene', { appui: [90 + oy, 12 + ox, 57 + ox, 'pierre'] });
  const porte = (x, y) => { const dx = (x + 0.5 - 88 - ox) / 16, dy = (y + 0.5 - 74 - oy) / 16; return x >= 72 + ox && x < 104 + ox && y >= 58 + oy && y < 96 + oy && (y >= 74 + oy || dx * dx + dy * dy <= 1); };
  embrasureR(t, 72 + ox, 58 + oy, 103 + ox, 95 + oy, porte);
  for (let x = 70 + ox; x < 106 + ox; x++) { t.poser(x, 96 + oy, 'pierre', 5); t.poser(x, 97 + oy, 'pierre', 3); t.poser(x, 99 + oy, 'pierre', 1); }
  for (let x = ox; x < L - ox; x++) for (let k = 1; k <= 2; k++) teinterR(t, x, H - k, -1);
  t.contour(); t.texture(s, cle); return cle;
}
// --- 2. la banque vue de haut : derrière le fronton, le toit d'ardoise à deux pans dont le faîte s'éloigne de la rue (le pan
//     gauche au soleil, le droit dans l'ombre), qui rentre un peu vers le fond ; les fenêtres et la porte en retrait ---
const VUE_HAUT_BANQUE = { ox: 0, oy: 36, L: 200, H: 212 };
// (phase 3) la banque avec 64 rangs de toit au-dessus du fronton (la profondeur du bâtiment) : oy 70, H 246
const CAMERA_HAUTE_BANQUE = { ox: 0, oy: 70, L: 200, H: 246 };
// (phase 4) 90 rangs de toit au-dessus du fronton, qui convergent plus fort (0,3 par rang), les rives de bois en biais
const VOLUME_BANQUE = { ox: 0, oy: 96, L: 200, H: 272 };
function reglagesBanque() { return volumeActif() ? VOLUME_BANQUE : cameraHauteActive() ? CAMERA_HAUTE_BANQUE : VUE_HAUT_BANQUE; }
function banqueVueHautHD(s) {
  const haut = cameraHauteActive(), vol = volumeActif(), cle = vol ? 'rueBanqueHD_haut4' : haut ? 'rueBanqueHD_haut3' : 'rueBanqueHD_haut'; if (s.textures.exists(cle)) return cle;
  const src = peindreBanqueRue(), { oy, L, H } = reglagesBanque(), t = toileDecor(L, H); Object.assign(t.rampes, RAMPES_RUE);
  const yC = 50 + oy, yTop = 18 + oy - (vol ? 90 : haut ? 64 : 30), mat = 'ardoiseToit', rangAu = rangsPerspective(yC + 1, yC + 1 - yTop, 8);
  for (let y = yTop; y <= yC; y++) { const demi = 94 - (yC - y) * (vol ? 0.3 : haut ? 0.2 : 0.14), xa = Math.round(100 - demi), xb = Math.round(100 + demi), [rp, fp] = rangAu(y);
    if (vol && y > yTop + 1) { for (let d = 0; d < 2; d++) { t.poser(xa + d, y, 'cheneSombre', d ? 3 : 4); t.poser(xb - d, y, 'cheneSombre', d ? 1 : 0); } }   // (phase 4) les rives de bois en biais
    for (let x = xa; x <= xb; x++) { const d = Math.abs(x - 100), c = Math.floor(d / 4), tc = d % 4, dec = (c % 2) * 4, ty = haut ? ((rp + (dec ? 1 : 0)) % 2 ? (fp < 0.14 ? 7 : 0) : (fp > 0.86 ? 7 : 0)) : ((y + dec) % 8 + 8) % 8, h = hachage(c, haut ? rp + (dec ? 1 : 0) : Math.floor((y + dec) / 8), 7341);
      let k = (x < 100 ? 3 : 1) + (h > 0.84 ? 1 : h < 0.12 ? -1 : 0) + (tc === 0 ? 1 : tc === 3 ? -1 : 0) - (ty === 7 ? 1 : 0);
      if (x === 100 || x === 99) k = 5; else if (x === 101) k = 4;              // le faîte
      if (y === yTop || y === yTop + 1) k = y === yTop ? 0 : 2;                 // le bord du fond
      if (x === xa) k = 4; else if (x === xb) k = 0;                            // les rives
      t.poser(x, y, mat, clampR(k)); } }
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.l; x++) { const m = src.mat(x, y); if (m) t.poser(x, y + oy, m, src.teinte(x, y)); }
  const pierre = m => m === 'taille';
  ombreDebordR(t, 4, 196, yC + 3, 6, pierre);
  if (vol) for (let y = yC + 3; y < H - 2; y++) for (const [x, d] of [[10, -2], [11, -1], [189, -3], [188, -2], [187, -1]]) if (pierre(t.mat(x, y))) teinterR(t, x, y, d);   // (phase 4) les murs latéraux en bande fine
  for (let y = 18 + oy; y < yC; y++) { const v = (y - 18 - oy) / 32, xa = Math.round(100 - v * 96), xb = Math.round(100 + v * 96); teinterR(t, xa, y, 1); teinterR(t, xa + 1, y, 1); teinterR(t, xb, y, -2); teinterR(t, xb - 1, y, -1);
    for (let x = xa + 3; x < xb - 2; x++) if (y < 18 + oy + 4 + (x < 100 ? (100 - x) * 0.33 : (x - 100) * 0.33)) teinterR(t, x, y + 2, -1); }
  for (const fx of [20, 162]) embrasureR(t, fx, 70 + oy, fx + 17, 115 + oy, (x, y) => x >= fx && x <= fx + 17 && y >= 70 + oy && y <= 115 + oy, { appui: [116 + oy, fx - 2, fx + 19, 'taille'] });
  const porte = (x, y) => { const dx = (x + 0.5 - 100) / 20, dy = (y + 0.5 - (176 - 62 + 20) - oy) / 20; return x >= 80 && x < 120 && y >= 176 - 62 + oy && y < 176 - 10 + oy && (y >= 176 - 62 + 20 + oy || dx * dx + dy * dy <= 1); };
  embrasureR(t, 80, 176 - 62 + oy, 119, 176 - 11 + oy, porte, { prof: 3 });
  for (let x = 0; x < 200; x++) teinterR(t, x, H - 1, -1);
  t.contour(); t.texture(s, cle); return cle;
}
// --- 3. la maison haute : maison5 avec { vueHaut: true } (villeDecorHD.js), qui laisse 16 rangs de plus en haut (M = 34) ---
// Le toit d'ardoise de maison5 est déjà un pan avant ; on ajoute le pan arrière au-dessus de sa crête (sans recouvrir la
// cheminée, qui le domine), l'ombre du débord sur l'étage, les ouvertures en retrait, les poutres qui accrochent la lumière.
function vueHautMaison5(t, g) {
  const { L, yR, yT, bas, x0, x1, trous, porte, cheminee, M } = g, haut = cameraHauteActive(), vol = volumeActif(), hDos = haut ? 20 : 14;
  // (phase 4, le volume) le toit est effacé et redessiné en trapèze (toitVolume), la cheminée reposée dessus, la façade
  // reçoit sa sablière et ses bandes de côté
  if (vol) { for (let y = 0; y <= yT + 5; y++) for (let x = 0; x < L; x++) t.effacer(x, y);
    const yE = yT + 2, hA = yE - (M + 6), hD = Math.min(16, M + 6 - 2 - 2), { yF } = toitVolume(t, { xa: 0, xb: L - 1, yEgout: yE, hAvant: hA, hDos: hD, mat: 'ardoiseToit', g: 7353, D: 0, conv: 14 });
    if (cheminee) { chemineeVueHaut(t, cheminee[0], yF + 14, 16, 7354); t.cheminee = [cheminee[0], yF + 4]; }
    const mur = m => m === 'platre' || /^enduit/.test(m || '') || m === 'taille' || m === 'taille3', bois = m => m === 'cheneSombre' || m === 'chene';
    facadeVolume(t, 0, L - 1, yE + 3, bas - 5, m => mur(m) || bois(m));
    aretesR(t, 0, yE + 6, L - 1, yR - 1, bois, mur); aretesR(t, x0, yR, x1 - 1, bas - 4, m => m === 'taille', () => false);
    for (const [fx, fy, fl, fh] of trous) embrasureR(t, fx + 2, fy + 2, fx + fl - 3, fy + fh - 3, (x, y) => x >= fx + 2 && x <= fx + fl - 3 && y >= fy + 2 && y <= fy + fh - 3);
    if (porte) { const [px, py, pl, ph] = porte; embrasureR(t, px + 3, py + 3, px + pl - 4, py + ph - 2, (x, y) => x >= px + 3 && x <= px + pl - 4 && y >= py + 3 && y <= py + ph - 2, { prof: 3 }); }
    return yF - 2 - hD; }
  // (phase 3) le pan avant repeint en perspective : ses rangs se resserrent vers le faîte (la cheminée et la lucarne restent)
  if (haut) { const yE = yT + 2, rangAu = rangsPerspective(yE + 1, yE + 1 - (M + 5), 4);
    for (let y = M + 5; y <= yE; y++) { const [r, f] = rangAu(y), dec = (r % 2) * 4, v = (y - M - 5) / (yE - M - 5);
      for (let x = -3; x < L + 3; x++) { const m = t.mat(x, y); if (!/ardoise|tuile/.test(m || '')) continue; const tx = ((x + dec) % 8 + 8) % 8, h = hachage(Math.floor((x + dec) / 8), r, 7352);
        let k = 3 + (h > 0.84 ? 1 : h < 0.12 ? -1 : 0) + (v < 0.28 ? 1 : 0); if (f >= 0.74) k += 1; else if (f < 0.26) k -= 2; if (tx === 7) k -= 1; if (x < 0) k += 1; else if (x > L - 1) k -= 1;
        t.poser(x, y, m, clampR(k)); } } }
  let xa = L, xb = -1; for (let x = -3; x < L + 3; x++) if (/ardoise|tuile|chaume/.test(t.mat(x, M + 5) || '')) { xa = Math.min(xa, x); xb = Math.max(xb, x); }
  const mat = t.mat(Math.round(L / 2), M + 5) || 'ardoiseToit', yH = M + 1 - hDos;
  for (let y = yH; y <= M + 1; y++) { const r = Math.floor((y - yH) / 3), ty = (y - yH) % 3, dec = (r % 2) * 4, ret = Math.floor((M + 1 - y) / 5);
    for (let x = xa + ret; x <= xb - ret; x++) { if (t.mat(x, y)) continue; const tx = ((x + dec) % 8 + 8) % 8; let k = 1 + (ty === 0 ? 1 : 0) - (tx === 7 ? 1 : 0) + (hachage(Math.floor((x + dec) / 8), r, 7351) > 0.85 ? 1 : 0); if (y === yH) k = 0; t.poser(x, y, mat, clampR(k)); } }
  const mur = m => m === 'platre' || /^enduit/.test(m || '') || m === 'taille' || m === 'taille3', bois = m => m === 'cheneSombre' || m === 'chene';
  aretesR(t, 0, yT + 6, L - 1, yR - 1, bois, mur);
  aretesR(t, x0, yR, x1 - 1, bas - 4, m => m === 'taille', () => false);
  ombreDebordR(t, 0, L - 1, yT + 6, 7, m => mur(m) || bois(m));
  for (const [fx, fy, fl, fh] of trous) embrasureR(t, fx + 2, fy + 2, fx + fl - 3, fy + fh - 3, (x, y) => x >= fx + 2 && x <= fx + fl - 3 && y >= fy + 2 && y <= fy + fh - 3);
  if (porte) { const [px, py, pl, ph] = porte; embrasureR(t, px + 3, py + 3, px + pl - 4, py + ph - 2, (x, y) => x >= px + 3 && x <= px + pl - 4 && y >= py + 3 && y <= py + ph - 2, { prof: 3 }); }
  if (cheminee) { const [cx, ch, chh] = cheminee; for (let y = ch; y < ch + chh; y++) { teinterR(t, cx - 6, y, 1); teinterR(t, cx + 5, y, -2); teinterR(t, cx + 6, y, -2); teinterR(t, cx + 4, y, -1); }
    for (let k = 1; k <= 3; k++) for (let x = cx + 8; x < cx + 8 + k; x++) teinterR(t, x, ch + chh - k, -2); }
  for (let x = x0; x < x1; x++) teinterR(t, x, bas - 4, -1);
  return yH;
}
