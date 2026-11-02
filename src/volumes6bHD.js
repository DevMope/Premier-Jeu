// (v1.65, la rue Soucolline vue de haut, étape 6b) Trois bâtiments de la rue dans la projection validée (maisonVolumeHD.js :
// verticales 1:1, tout ce qui est horizontal vu par le dessus et écrasé × 0,75, sans point de fuite ; toit en croupe ; l'ombre
// de la rive sur le haut du mur ; le dessus éclairé des appuis, des marches, des poutres ; les ouvertures en retrait ; la
// pierre modelée ; l'ombre de contact au pied). Une fonction par bâtiment, le même design, les mêmes couleurs :
//   - le porche de la place des Mastres (porcheVolumeHD, étape 7b : deux pistes, l'arche A et la halle B) ;
//   - l'atelier des Mages-Charpentiers (atelierMagesVolumeHD) et son chantier (chantierMagesVolumeHD) ;
//   - l'impasse du Corbeau (impasseVolumeHD) et sa lanterne rouge (lanterneCorbeauHD) : (Q275) PAS BRANCHÉE, elle ira au bout ouest,
//     contre le Rempart (Q168), avec le chantier du Rempart ; la rue garde l'ancienne impasse en attendant.
// Chacun prépare aussi sa couche de neige du Givre (« cle_neige ») : la neige se pose sur tous les dessus (le toit, le haut
// des murs, des poutres, des socles, des pieux, le sol de la ruelle), pas seulement sur le toit.

// ---- outils communs ----
// Les dessus : la toile retient quels pixels sont « vus par le dessus » (posés dans enDessus) ; un pixel recouvert ensuite par
// autre chose ne l'est plus (un simple changement de ton, teinterV, le garde).
function dessus6b(t) {
  const D = new Uint8Array(t.l * t.h), poser0 = t.poser.bind(t), dans0 = t.dans.bind(t); let marquer = false;
  t.poser = (x, y, m, i) => { if (!dans0(x, y)) return; const j = y * t.l + x, meme = t.m[j] === m; poser0(x, y, m, i); D[j] = marquer ? 1 : meme ? D[j] : 0; };
  return { D, enDessus: f => { marquer = true; f(); marquer = false; }, marquer: (x, y) => { if (t.dans(x, y) && t.m[y * t.l + x]) D[y * t.l + x] = 1; } };
}
// Décaler une toile vers le bas (pour lui donner de la place en haut sans changer les coordonnées du dessin)
function decaler6b(t, dy) { const p = t.poser, m = t.mat.bind(t), k = t.teinte.bind(t);
  t.poser = (x, y, a, i) => p(x, y + dy, a, i); t.mat = (x, y) => m(x, y + dy); t.teinte = (x, y) => k(x, y + dy); }
// La couche de neige : blanche sur chaque dessus (bleutée dans l'ombre, son bord bas un ton plus sombre), un petit coussin
// qui dépasse au-dessus du bord haut, et le trait du contour gardé (bleui)
function neigeDessus6b(s, cle, t, D, ombreDe = null) {
  const k = cle + '_neige'; if (s.textures.exists(k)) return k;
  const L = t.l, H = t.h, out = s.textures.createCanvas(k, L, H), o = out.getContext(), img = o.createImageData(L, H), q = img.data;
  const plein = (x, y) => x >= 0 && y >= 0 && x < L && y < H && t.m[y * L + x] !== null;
  const mettre = (x, y, c) => { const i = (y * L + x) * 4, f = ombreDe ? ombreDe(x, y) : 1; q[i] = (c >> 16) * f; q[i + 1] = ((c >> 8) & 255) * f; q[i + 2] = (c & 255) * f; q[i + 3] = 255; };
  const trou = new Uint8Array(L * H);
  for (let x = 0; x < L; x++) for (let y = 0; y < H; y++) { if (!D[y * L + x]) continue; let e = y; while (e + 1 < H && D[(e + 1) * L + x]) e++; const n = e - y + 1;
    if (n > 12) for (let k = y; k <= e; k++) { const v = (k - y) / n; if (v > 0.68 && fbm(x * 0.15, k * 0.3, 9414) > 0.62 - (v - 0.68) * 0.5) trou[k * L + x] = 1; }
    y = e; }
  for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) {
    const i = y * L + x; if (!D[i] || t.c[i] === null) continue;
    if (trou[i]) continue;   // (vers le bas d'un grand dessus, une tuile, une ardoise perce la neige)
    const c = t.c[i], lum = 0.3 * (c >> 16) + 0.59 * ((c >> 8) & 255) + 0.11 * (c & 255);
    if (lum < 48 && (!plein(x - 1, y) || !plein(x + 1, y))) { mettre(x, y, 0x3c4658); continue; }   // le contour, bleui
    const bas = y + 1 < H && !D[i + L], h = hachage(x, y, 9415), ombre = t.k[i] <= 1;
    const kk = t.k[i];   // (le relief de ce qu'elle recouvre se devine : les joints des ardoises, des tuiles, des pierres)
    mettre(x, y, bas ? (ombre ? 0xb4c2d4 : 0xc8d4e4) : kk <= 1 ? 0xc6d2e2 : kk === 2 ? 0xd8e2ee : kk === 3 ? (h > 0.9 ? 0xe2eaf4 : 0xecf2f8) : h < 0.06 ? 0xffffff : 0xf6f9fc);
    if (y > 1 && !D[i - L] && !plein(x, y - 1)) { mettre(x, y - 1, hachage(x, 2, 9416) > 0.3 ? 0xf8fbff : 0xe8eef6); mettre(x, y - 2, 0x5a6a80); }   // le coussin, et son trait
  }
  o.putImageData(img, 0, 0); out.refresh(); return k;
}
// La toile en canvas (pour modeler la pierre et poser des ombres douces avant d'en faire une texture)
function toileCanvas6b(t) {
  const cv = document.createElement('canvas'); cv.width = t.l; cv.height = t.h; const ctx = cv.getContext('2d'), I = ctx.createImageData(t.l, t.h), d = I.data;
  for (let i = 0; i < t.c.length; i++) { const c = t.c[i]; if (c === null) continue; d[i * 4] = c >> 16; d[i * 4 + 1] = (c >> 8) & 255; d[i * 4 + 2] = c & 255; d[i * 4 + 3] = 255; }
  const mul = (x, y, f) => { if (x < 0 || y < 0 || x >= t.l || y >= t.h) return; const i = (y * t.l + x) * 4; if (d[i + 3] < 128) return; d[i] *= f; d[i + 1] *= f; d[i + 2] *= f; };
  return { cv, ctx, I, d, mul, fin: (s, cle) => { ctx.putImageData(I, 0, 0); s.textures.addCanvas(cle, cv); } };
}

// ======================= 1. LE PORCHE DE LA PLACE DES MASTRES (étape 7b, Q273 : refait, deux pistes) =======================
// L'entrée de la place des Mastres, le cœur de la ville : il doit s'accorder avec les bâtiments validés (le barbier, la maison
// haute, la banque, les maisons de ville) : leur pierre modelée, leurs toits en croupe, leurs ombres. Deux pistes :
//   A. l'arche des Mastres : deux piliers de pierre modelée (leur soubassement, leur chapiteau), un linteau de chêne massif
//      (le dessus de ses abouts), ses aisseliers, un vrai toit en croupe de tuiles ; deux lanternes de fer pendues aux piliers,
//      deux bacs de fleurs à leur pied, des murets de part et d'autre ; les fanions tendus sous le linteau ;
//   B. la halle des Mastres : une halle couverte de trois travées sur quatre poteaux de chêne (leurs socles de pierre), un
//      grand toit en croupe ; on voit dessous le sol de dalles de la halle s'enfoncer dans l'ombre jusqu'aux poteaux du fond,
//      et la place au-delà, au soleil ; dans les travées de côté, un muret de pierre et ses bacs de fleurs ; deux lanternes
//      pendues à la sablière de la travée du milieu.
// Ce qu'on voit de la place, au travers (peindrePlaceVueHaute6b), est dans la même projection : son sol de dalles s'enfonce
// sans rapetisser (les rangs écrasés × 0,75), et ce qui s'y tient (les étals, la fontaine, les arbres, les passants) est à
// l'échelle de la rue.
const PORCHE_PISTES = {
  A: { piste: 'A', L: 176, H: 187, sol: 186, piliers: [[12, 37], [138, 163]], yI: 56, toit: { xa: 8, xb: 167, montee: 20, prof: 20 }, couvert: 30, seuil: 12,
    lanternes: [[46, 100], [129, 100]], chaines: [68, 108], ecriteau: 68, passants: [22, 40], ouverture: [38, 138] },
  B: { piste: 'B', L: 176, H: 187, sol: 186, poteaux: [10, 58, 118, 166], yB: 56, toit: { xa: 1, xb: 174, montee: 26, prof: 30 }, fond: 45, seuil: 14,
    lanternes: [[74, 78], [102, 78]], chaines: [68, 108], ecriteau: 72, passants: [47, 52], ouverture: [0, 176] },
};
// (étape 8b) À la réflexion, un « portail » devant le marché fait bizarre : trois façons d'ouvrir la rue sur la place.
//   1. pas de porche : la rue s'élargit et débouche sur la place, entre la banque et sa voisine ; les pavés de la rue se fondent
//      dans ceux de la place ; le marché déborde dans le bout de la rue (un étal, des caisses), des fanions entre les façades ;
//   2. une ouverture marquée, jamais fermée (conseillée) : deux piliers bas de pierre modelée, sur chacun un poteau de chêne et
//      sa lanterne de fer, des bacs de fleurs à leur pied, une guirlande de fanions tendue au-dessus ; des caisses du marché ;
//   3. l'arche A gardée, mais très ouverte (sans murets) et en retrait sur la place ; le marché déborde devant elle, dans la rue.
// Toutes trois : la voisine de la banque ferme l'angle est (une maison de ville, elle aussi en un seul volume).
Object.assign(PORCHE_PISTES, {
  1: { piste: '1', L: 176, H: 205, sol: 204, ouvert: true, seuil: 12, passants: [18, 46], ouverture: [0, 176], lanternes: [], debord: true, fanionsFacades: true },
  2: { piste: '2', L: 176, H: 205, sol: 204, ouvert: true, seuil: 12, passants: [18, 46], ouverture: [0, 176], bornes: [22, 153], lanternes: [[33, 114], [142, 114]], guirlande: 104, ecriteau: 126, caisses: true },
  3: { piste: '3', L: 176, H: 205, sol: 204, ouvert: true, recul: 30, piliers: [[6, 27], [148, 169]], yI: 54, toit: { xa: 2, xb: 173, montee: 20, prof: 20 }, couvert: 30, seuil: 12, murets: false,
    lanternes: [[37, 98], [138, 98]], chaines: [68, 108], ecriteau: 66, passants: [2, 26], ouverture: [0, 176], debord: true },
});
const PORCHE_PISTE = '4';   // (étape 9b : le vrai début de la place, à l'échelle de la rue ; window.PORCHE_PISTE = '1', '2', '3', '4', 'A' ou 'B' pour comparer)
function porchePiste() { return PORCHE_PISTES[(typeof window !== 'undefined' && window.PORCHE_PISTE) || PORCHE_PISTE] || PORCHE_PISTES.A; }
// Les couleurs du porche et de la place, selon la saison
function rampesPorche6b(t, saison) {
  const S = saison, hiver = S === 'givre';
  Object.assign(t.rampes, RAMPES_RUE, { gres: rampe(0xb8a07a), gresP: rampe(0xb8a07a), terre: rampe(0x5e3e26), neige: [0x8a96a8, 0xaab6c8, 0xc8d2e0, 0xdce4ee, 0xeef2f8, 0xffffff],
    fanionR: rampe(0xc83a2a), fanionB: rampe(0x2a5ab8), fanionJ: rampe(0xe0b030), fanionV: rampe(0x3a8a3a), sapin: rampe(0x2a6a30), feuille: rampe(hiver ? 0x3a5a3a : 0x4a8a34),
    fleurA: rampeVive({ semailles: 0xf080b0, moissons: 0xe83a2a, brumes: 0xe07a20, givre: 0xc82a2a }[S] || 0xe83a2a), fleurB: rampeVive({ semailles: 0xf0d040, moissons: 0xf0a020, brumes: 0x9a4ab0, givre: 0xe8e8f0 }[S] || 0xf0a020),
    eauP: rampe(hiver ? 0xc8e0ec : 0x4a9ac8), bache: rampe(0x6a5a44), pierreP: rampe(0x9a948a) });
}
// Un bac de fleurs vu d'en haut : sa face de planches, son dessus (la terre), les fleurs de la saison (l'hiver, du sapin)
function bacFleurs6b(t, x0, x1, yBas, saison, g, enDessus) {
  const hiver = saison === 'givre';
  for (let y = yBas - 9; y <= yBas; y++) for (let x = x0; x <= x1; x++) t.poser(x, y, 'chene', y === yBas ? 1 : (x - x0) % 7 === 0 ? 2 : y === yBas - 9 ? 5 : y === yBas - 5 ? 2 : 3 + (x === x0 ? 1 : 0) - (x === x1 ? 1 : 0));
  enDessus(() => { for (let y = yBas - 13; y < yBas - 9; y++) for (let x = x0 + 1; x < x1; x++) t.poser(x, y, 'terre', y === yBas - 13 ? 2 : 3); });
  for (let k = 0; k < Math.floor((x1 - x0) / 4); k++) {   // les touffes : leurs feuilles, leurs fleurs (au soleil en haut à gauche)
    const cx = x0 + 3 + k * 4 + Math.round(hachage(k, 1, g) * 2), h = 5 + Math.floor(hachage(k, 2, g) * 5), base = yBas - 11 - Math.floor(hachage(k, 3, g) * 2);
    for (let j = 0; j < h; j++) for (let e = -1; e <= 1; e++) if (Math.abs(e) + j * 0.15 < 1.6) t.poser(cx + e, base - j, hiver ? 'sapin' : 'feuille', 3 + (e < 0 ? 1 : e > 0 ? -1 : 0) - (j < 2 ? 1 : 0));
    if (hiver) continue;
    const m = k % 2 ? 'fleurA' : 'fleurB', fy = base - h;
    for (const [dx, dy, i] of [[0, 0, 5], [-1, 0, 4], [1, 0, 3], [0, -1, 4], [0, 1, 2]]) t.poser(cx + dx, fy + dy, m, i);
  }
}
// Une lanterne de fer pendue à une potence : son chapeau vu par le dessus, son verre (allumé la nuit)
function lanterne6b(t, cx, yHaut, nuit, enDessus) {
  enDessus(() => { for (let x = cx - 3; x <= cx + 3; x++) t.poser(x, yHaut, 'fer', 4); });
  for (let x = cx - 3; x <= cx + 3; x++) t.poser(x, yHaut + 1, 'fer', 2);
  for (let y = yHaut + 2; y < yHaut + 9; y++) for (let x = cx - 2; x <= cx + 2; x++) { const bord = x === cx - 2 || x === cx + 2; t.poser(x, y, bord ? 'fer' : 'vitre', bord ? 2 : nuit ? (x === cx && y > yHaut + 3 ? 5 : 4) : (x === cx - 1 ? 3 : 1)); }
  for (let x = cx - 2; x <= cx + 2; x++) t.poser(x, yHaut + 9, 'fer', 2); t.poser(cx, yHaut + 10, 'fer', 1);
}
// Les fanions, tendus d'un côté à l'autre (l'hiver, une guirlande de sapin et ses nœuds rouges)
function fanions6b(t, x0, x1, ya, creux, saison) {
  const hiver = saison === 'givre';
  for (let x = x0; x <= x1; x++) {
    const u = (x - x0) / (x1 - x0), y = Math.round(ya + Math.sin(u * Math.PI) * creux);
    t.poser(x, y, hiver ? 'sapin' : 'cheneSombre', hiver ? 3 : 2);
    if (hiver) { if ((x - x0) % 9 === 0) { t.poser(x, y + 1, 'fanionR', 4); t.poser(x, y + 2, 'fanionR', 3); } else t.poser(x, y + 1, 'sapin', 2); continue; }
    if ((x - x0) % 7 < 5) { const m = (saison === 'brumes' ? ['fanionR', 'fanionJ', 'fleurA', 'fleurB'] : ['fanionR', 'fanionB', 'fanionJ', 'fanionV'])[Math.floor((x - x0) / 7) % 4];
      for (let k = 1; k <= 5 - Math.abs(((x - x0) % 7) - 2) * 1.6; k++) t.poser(x, y + k, m, k === 1 ? 4 : 3); }
  }
}
// Un étal du marché, vu d'en haut : la table (sa face, son dessus et ce qu'on y vend), l'auvent rayé vu par le dessus (bâché la
// nuit, neigeux l'hiver) sur ses deux montants, son ombre au sol ; yb : le rang du pied de l'étal
function etal6b(P, ex, el, yb, i, jour, S) {
  const hiver = S === 'givre', n = jour ? 0 : -2, yt = yb - 13, ya = yb - 36;
  const tissus = { semailles: ['fleurA', 'fanionB'], moissons: ['fanionR', 'fanionB'], brumes: ['fleurB', 'fanionR'], givre: ['fanionV', 'fanionR'] }[S] || ['fanionR', 'fanionB'];
  for (const px of [ex + 1, ex + el - 2]) for (let y = ya; y <= yb; y++) { P(px, y, 'chene', 3 + n); P(px + 1, y, 'chene', 1 + n); }
  for (let y = yt; y <= yb - 4; y++) for (let x = ex; x < ex + el; x++) P(x, y, jour ? 'chene' : 'bache', (y === yt ? 4 : y === yb - 4 ? 1 : 2) + n);
  for (let y = yt - 7; y < yt; y++) for (let x = ex; x < ex + el; x++) P(x, y, jour ? 'chene' : 'bache', (y === yt - 1 ? 5 : 4) + n);
  if (jour) for (let x = ex + 2; x < ex + el - 2; x += 4) for (let r = 0; r < 2; r++) { const yy = yt - 6 + r * 3, m = S === 'semailles' ? ['fleurA', 'feuille', 'fleurB'][(x + r + i) % 3] : S === 'givre' ? ['pain', 'sapin'][(x + r) % 2] : S === 'brumes' ? ['citrouille', 'pomme', 'pain'][(x + r + i) % 3] : ['pain', 'ble', 'pomme'][(x + r + i) % 3];
    P(x, yy, m, 4); P(x + 1, yy, m, 3); P(x, yy + 1, m, 3); P(x + 1, yy + 1, m, 2); }
  for (let y = ya - 10; y < ya; y++) for (let x = ex - 2; x < ex + el + 2; x++) { const raye = Math.floor((x - ex + 2) / 4) % 2;
    if (hiver && y < ya - 2) { P(x, y, 'neige', 5 + n / 2); continue; } P(x, y, !jour ? 'bache' : raye ? tissus[i] : 'parchemin', (y === ya - 10 ? 4 : 3) + (jour ? 0 : n / 2)); }
  for (let x = ex - 2; x < ex + el + 2; x++) { const raye = Math.floor((x - ex + 2) / 4) % 2; P(x, ya, !jour ? 'bache' : raye ? tissus[i] : 'parchemin', 2 + n); if (x % 4 < 2) P(x, ya + 1, !jour ? 'bache' : raye ? tissus[i] : 'parchemin', 1 + n); }
  for (let x = ex - 1; x < ex + el + 2; x++) { P(x, yb + 1, 'terre', 1 + n); P(x + 1, yb + 2, 'terre', 2 + n); }
}
// La place des Mastres vue au travers du porche, dans la projection. x0..x1 : l'ouverture ; yH : son haut ; sol : le pied du
// porche (le rang de la rue). Une rangée à la profondeur d (en pixels de plan) est au rang sol − 0,75·d. La place a 92 de
// profondeur : au fond, le talus des Coteaux (ses portes rondes, ses arbres), et le ciel de la rue au-dessus.
function peindrePlaceVueHaute6b(t, x0, x1, yH, sol, jour, saison) {
  const S = saison, hiver = S === 'givre', n = jour ? 0 : -2, Y = d => sol - Math.round(d * VOLUME_HD.prof);
  const P = (x, y, m, k) => { if (x >= x0 && x < x1 && y >= yH && y <= sol) t.poser(Math.round(x), Math.round(y), m, Math.max(0, Math.min(5, Math.round(k)))); };
  const mx = (x0 + x1) / 2, yE = Y(92);   // (la place a 92 de profondeur ; au fond, le talus des Coteaux)
  Object.assign(t.rampes, { pain: rampe(0xc8904a), ble: rampe(0xd8b048), pomme: rampeVive(0xc8382a), citrouille: rampeVive(0xe0701a), penteP: rampe({ semailles: 0x7aa84e, moissons: 0x94a84a, brumes: 0x8a9a52, givre: 0xdce6ec }[S] || 0x94a84a),
    porteRP: rampe(0x9a3226), porteVP: rampe(0x2e6e3a) });
  // 1. au fond, le pied des Coteaux : un talus d'herbe (sa crête ondule), deux portes rondes dans leur cercle de pierre, une
  //    fenêtre ronde (allumée la nuit), une cheminée qui sort de l'herbe ; deux arbres sur la crête ; au-dessus, le ciel de la rue
  const crete = x => yE - 30 - Math.round(Math.sin((x - x0) / 17) * 3 + Math.sin((x - x0) / 6) * 1);
  [[x0 + 14, 'pommier', 'P1', 1], [x1 - 14, 'bouleau', 'P2', 2]].forEach(([ax, espece, suf, gr]) => {
    for (const [m, ramp] of Object.entries(rampesArbre(S, espece))) t.rampes[m + suf] = ramp;
    peindreArbre((x, y, m, i) => P(x, y, m + suf, i + n), { cx: ax, base: crete(ax) + 3, H: 64, espece, saison: S, graine: gr });
  });
  for (let x = x0; x < x1; x++) for (let y = crete(x); y < yE; y++) P(x, y, 'penteP', (y === crete(x) ? 4 : y > yE - 4 ? 2 : 3 + (hachage(x >> 1, y >> 1, 7820) > 0.85 ? 1 : 0)) + n);
  for (const [bx, porte, fen] of [[x0 + 24, 'porteRP', 1], [x1 - 26, 'porteVP', -1]]) {
    const pr = 9, py = yE - pr - 1;
    for (let y = py - pr - 3; y <= yE; y++) for (let x = bx - pr - 3; x <= bx + pr + 3; x++) {
      const d = Math.hypot(x + 0.5 - bx, y + 0.5 - py), bas = y >= py && Math.abs(x + 0.5 - bx) <= pr + 2.5;
      if (d > pr + 2.5 && !bas) continue; const dedans = d <= pr || (y >= py && Math.abs(x + 0.5 - bx) <= pr);
      P(x, y, dedans ? porte : 'pierreP', dedans ? 3 - (x > bx + 2 ? 1 : 0) + ((x - bx + 20) % 4 === 0 ? -1 : 0) + n : (y < py - pr ? 5 : x < bx ? 4 : 2) + n); }
    P(bx, py + 1, 'or', 5 + n); P(bx + 1, py + 1, 'or', 3 + n);
    const fx = bx + fen * 18, fy = yE - 14;
    for (let y = fy - 4; y <= fy + 4; y++) for (let x = fx - 4; x <= fx + 4; x++) { const d = Math.hypot(x - fx, y - fy); if (d > 4.3) continue; P(x, y, d > 3 ? 'pierreP' : jour ? 'vitreNoire' : 'vitre', d > 3 ? 4 + n : jour ? 3 : 5); }
    const cx = bx - fen * 14, cy = crete(cx) - 6;
    for (let y = cy; y < cy + 8; y++) for (let x = cx; x < cx + 5; x++) P(x, y, 'pierreP', (y === cy ? 5 : x === cx ? 4 : 2) + n);
    if (hiver) for (let x = cx; x < cx + 5; x++) P(x, cy - 1, 'neige', 5 + n / 2);
  }
  // 2. le sol de la place : des pavés ronds, en rangs décalés (comme la chaussée de la rue, et de sa taille), chacun son dessus au
  //    soleil, son pied sombre, la terre entre eux ; 7 rangs d'écran pour un pavé ; la saison (l'herbe, les feuilles, la neige et son chemin)
  for (let y = yE; y <= sol; y++) { const r = Math.floor((sol - y) / 7), ty0 = (sol - y) % 7, ty = ty0 >= 5 ? 4 : ty0 === 4 ? 3 : ty0 >= 2 ? 2 : ty0, dec = (r % 2) * 6;   // (étape 8b : de la taille des pavés de la rue, qui s'y fondent)
    for (let x = x0; x < x1; x++) { const tx0 = ((x - x0 + dec) % 13 + 13) % 13, tx = tx0 === 0 ? 0 : tx0 === 1 ? 1 : tx0 === 12 ? 7 : tx0 === 11 ? 6 : 3, h = hachage(Math.floor((x - x0 + dec) / 13), r, 7811), gap = tx === 0 || ty0 === 6 || ((tx === 1 || tx === 7) && (ty0 === 0 || ty0 === 5));
      if (hiver) { const trace = Math.abs(x - mx - Math.sin((sol - y) * 0.05) * 6) < 5; P(x, y, trace ? 'pierreP' : 'neige', trace ? (gap ? 1 : 3) + n : (gap ? 3 : 4 + (h > 0.8 ? 1 : 0)) + n / 2); continue; }
      P(x, y, gap ? 'terre' : 'pierreP', gap ? 2 + n : (ty === 3 ? 4 : ty === 0 ? 2 : 3) + (h > 0.78 ? 1 : h < 0.15 ? -1 : 0) - (tx === 6 ? 1 : 0) + n);
      if (S === 'semailles' && gap && hachage(x, y, 7812) > 0.7) P(x, y, 'feuille', 3 + n);
      if (S === 'brumes' && hachage(x >> 1, y >> 1, 7813) > 0.94) P(x, y, hachage(x, y, 7814) > 0.5 ? 'fleurA' : 'fanionJ', 3 + n); } }
  for (let x = x0; x < x1; x++) for (let k = 0; k < 2; k++) P(x, yE + k, 'terre', 1 + k + n);   // (le pied du talus)
  // 3. deux étals contre le talus : la table (sa face, son dessus et ce qu'on y vend, vus d'en haut), l'auvent rayé vu par le
  //    dessus (bâché la nuit, neigeux l'hiver) sur ses deux montants
  for (const [ex, el, d, i] of [[x0 + 2, 32, 80, 0], [x1 - 34, 32, 84, 1]]) etal6b(P, ex, el, Y(d), i, jour, S);
  // 4. la fontaine de la place, au milieu : son bassin rond vu d'en haut (la margelle, l'eau, gelée l'hiver), sa paroi, la colonne,
  //    la vasque ; son ombre au sol
  { const fx = mx, fy = Y(66), rx = 15, ry = 11.25;
    for (let x = Math.floor(fx - rx + 2); x <= fx + rx + 2; x++) for (let k = 0; k < 2; k++) P(x, fy + ry + 5 + k, 'terre', 1 + k + n);
    for (let y = Math.floor(fy - ry - 1); y <= fy + ry + 6; y++) for (let x = Math.floor(fx - rx - 1); x <= fx + rx + 1; x++) {
      const u = (x + 0.5 - fx) / rx, v = (y + 0.5 - fy) / ry, q = u * u + v * v, vb = (y - 5 + 0.5 - fy) / ry, qb = u * u + vb * vb;
      if (q <= 1) { const eau = q < 0.6; P(x, y, eau ? 'eauP' : 'pierreP', eau ? 3 + (hachage(x, y, 7815) > 0.9 && !hiver ? 2 : 0) - (v < -0.4 ? 1 : 0) + n : (v < 0 ? 5 : 4) + n); }
      else if (qb <= 1 && y > fy) P(x, y, 'pierreP', (u < -0.6 ? 4 : u > 0.6 ? 1 : 2) + n);
    }
    for (let y = fy - 18; y < fy; y++) { P(fx - 1, y, 'pierreP', 4 + n); P(fx, y, 'pierreP', 3 + n); P(fx + 1, y, 'pierreP', 1 + n); }
    for (let y = fy - 21; y <= fy - 17; y++) for (let x = fx - 6; x <= fx + 6; x++) { const q = ((x + 0.5 - fx) / 6) ** 2 + ((y + 0.5 - (fy - 19)) / 2.3) ** 2; if (q <= 1) P(x, y, y < fy - 19 ? (hiver ? 'neige' : 'eauP') : 'pierreP', (y < fy - 19 ? 4 : 2) + n); }
    if (jour && !hiver) for (const s of [-1, 1]) for (let k = 0; k < 7; k++) P(fx + s * (7 + k * 0.6), fy - 17 + k * 2, 'eauP', 5); }
  // la nuit, un réverbère veille sur la place endormie
  if (!jour) { const lx = mx - 26, ly = Y(76); for (let y = ly - 40; y <= ly; y++) { P(lx, y, 'fer', 2); P(lx + 1, y, 'fer', 1); } for (let y = ly - 48; y < ly - 40; y++) for (let x = lx - 2; x <= lx + 3; x++) P(x, y, x === lx - 2 || x === lx + 3 ? 'fer' : 'vitre', x === lx - 2 || x === lx + 3 ? 1 : 5); }
}
// Le porche de la piste choisie, pour la saison et l'heure : { porche, place, ombre } (trois textures : la place derrière, l'ombre
// sur le seuil, le porche devant ; les passants vont et viennent entre la place et le porche)
function porcheVolumeHD(scene, jour = true, PP = porchePiste()) {
  const saison = (typeof saisonActuelle === 'function' && saisonActuelle()) || 'moissons';
  const suf = PP.piste + '_' + saison + (jour ? '_jour' : '_nuit'), place = 'placePorcheV_' + suf, ombre = 'ombrePorcheV_' + PP.piste;
  const cle = PP.piste === '1' ? null : 'porcheVolumeHD_' + suf;
  if (!scene.textures.exists(place)) {   // la place, au travers (derrière le porche, ou dans l'ouverture de la rue)
    const f = toileDecor(PP.L, PP.H); rampesPorche6b(f, saison);
    if (PP.ouvert) peindrePlaceVueHaute6b(f, 0, PP.L, 0, PP.sol, jour, saison);
    else if (PP.piste === 'B') peindrePlaceVueHaute6b(f, 0, PP.L, PP.yB + 6, PP.sol, jour, saison);
    else peindrePlaceVueHaute6b(f, PP.ouverture[0], PP.ouverture[1], PP.yI, PP.sol, jour, saison);
    f.texture(scene, place);
  }
  const PA = PP.recul ? { ...PP, sol: PP.sol - PP.recul } : PP;   // (3 : l'arche en retrait sur la place)
  if (cle && !scene.textures.exists(cle)) (PP.piste === 'B' ? porcheHalleHD : PP.piste === '2' ? bornesPlaceHD : porcheArcheHD)(scene, PA, cle, jour, saison);
  if (PP.piste !== '1') ombrePorche7b(scene, PA, ombre);
  return { porche: cle, place, ombre: PP.piste === '1' ? null : ombre };
}
// --- piste A : l'arche des Mastres ---
function porcheArcheHD(s, PP, cle, jour, saison) {
  const { L, H, sol, piliers, yI, toit: R, chaines } = PP, nuit = !jour, [o0, o1] = PP.ouverture;
  const t = toileDecor(L, H); rampesPorche6b(t, saison); const { D, enDessus } = dessus6b(t);
  // 1. les murets, de part et d'autre (leur chaperon vu par le dessus)
  if (PP.murets !== false) for (const [a, b] of [[0, 9], [166, L - 1]]) { for (let y = sol - 30; y <= sol; y++) for (let x = a; x <= b; x++) t.poser(x, y, 'pierre', 3);
    enDessus(() => { for (let x = a; x <= b; x++) { t.poser(x, sol - 34, 'taille', 4); t.poser(x, sol - 33, 'taille', 5); } }); for (let x = a; x <= b; x++) { t.poser(x, sol - 32, 'taille', 3); t.poser(x, sol - 31, 'taille', 1); } }
  // 2. les deux piliers de pierre : le fût (modelé ensuite), le soubassement qui avance (son dessus), le chapiteau
  for (const [a, b] of piliers) {
    for (let y = yI + 4; y <= sol - 9; y++) for (let x = a; x <= b; x++) t.poser(x, y, 'pierre', 3);
    enDessus(() => { for (let x = a - 2; x <= b + 2; x++) { t.poser(x, sol - 10, 'taille', 4); t.poser(x, sol - 9, 'taille', 5); } });
    for (let y = sol - 8; y <= sol; y++) for (let x = a - 2; x <= b + 2; x++) t.poser(x, y, 'taille', y === sol ? 1 : x === a - 2 ? 4 : x === b + 2 ? 2 : 3 - (y > sol - 3 ? 1 : 0));
    for (let x = a - 2; x <= b + 2; x++) { t.poser(x, yI, 'taille', 5); t.poser(x, yI + 1, 'taille', 4); t.poser(x, yI + 2, 'taille', 2); t.poser(x, yI + 3, 'taille', 1); }   // le chapiteau
    for (let x = a; x <= b; x++) for (let k = 0; k < 3; k++) teinterV(t, x, yI + 4 + k, k < 2 ? -2 : -1);   // (son ombre sur le fût)
  }
  // 3. les aisseliers de chêne, du haut des piliers au linteau
  for (const [xp, sens] of [[piliers[0][1] + 1, 1], [piliers[1][0] - 1, -1]]) for (let k = 0; k < 20; k++) for (let e = 0; e < 4; e++) t.poser(xp + sens * k, yI + 19 - k + e, 'chene', e === 0 ? 5 : e === 3 ? 1 : 3);
  // 4. le linteau de chêne massif (ses abouts dépassent du toit : leur dessus) ; l'ombre de la rive sur lui
  planche(t, 0, yI - 9, L, 9, 'chene', { graine: 8216, noeuds: 3 });
  for (let x = 0; x < L; x++) t.poser(x, yI - 1, 'cheneSombre', 1);
  for (const [a, b] of [[0, R.xa - 1], [R.xb + 1, L - 1]]) enDessus(() => { for (let x = a; x <= b; x++) { t.poser(x, yI - 12, 'chene', 4); t.poser(x, yI - 11, 'chene', 4); t.poser(x, yI - 10, 'chene', 5); } });
  let toit; enDessus(() => { toit = toitCroupeHD(t, { xa: R.xa, xb: R.xb, yEgout: yI - 12, montee: R.montee, prof: R.prof, mat: 'tuile', motif: 'tuile', g: 8217, bois: 'chene' }); });
  for (let x = R.xa; x <= R.xb; x++) for (let k = 0; k < 5; k++) if (t.mat(x, yI - 9 + k) === 'chene') teinterV(t, x, yI - 9 + k, k < 3 ? -2 : -1);
  // 5. les fanions sous le linteau, les chaînes de l'écriteau, les deux lanternes sur leur potence
  fanions6b(t, piliers[0][1] + 1, piliers[1][0] - 1, yI + 9, 5, saison); fanions6b(t, piliers[0][1] + 1, piliers[1][0] - 1, yI + 19, 3, saison);
  for (const x of chaines) for (let y = yI; y < yI + 6; y++) t.poser(x, y, 'fer', y % 2 ? 4 : 2);
  for (const [lx, ly] of PP.lanternes) { const sens = lx < L / 2 ? -1 : 1, x0 = sens < 0 ? piliers[0][1] : piliers[1][0];
    for (let x = Math.min(x0, lx); x <= Math.max(x0, lx); x++) t.poser(x, ly - 14, 'fer', 3); t.poser(x0, ly - 13, 'fer', 2); t.poser(lx, ly - 13, 'fer', 2);
    lanterne6b(t, lx, ly - 12, nuit, enDessus); }
  // 6. les bacs de fleurs, au pied des piliers
  for (const [a, b] of piliers) bacFleurs6b(t, a, b, sol, saison, a + 8218, enDessus);
  t.contour();
  const C = toileCanvas6b(t);
  pierresRondesDonnees(C.d, L, H, [...piliers.map(([a, b], i) => ({ r: [a, yI + 4, b, sol - 11], graine: 8219 + i })), ...(PP.murets !== false ? [{ r: [0, sol - 30, 9, sol], graine: 8221 }, { r: [166, sol - 30, L - 1, sol], graine: 8222 }] : [])]);
  for (let x = 0; x < L; x++) { C.mul(x, sol, 0.74); C.mul(x, sol - 1, 0.88); }
  C.fin(s, cle);
  s.textures.get(cle).toit89 = { haut: toit.yF - 2, bas: yI - 10, chem: null, lucarne: null, nu: null };
  if (saison === 'givre') neigeDessus6b(s, cle, t, D);
}
// --- piste B : la halle des Mastres ---
function porcheHalleHD(s, PP, cle, jour, saison) {
  const { L, H, sol, poteaux, yB, toit: R, fond, chaines } = PP, nuit = !jour, yFd = sol - fond;
  const t = toileDecor(L, H); rampesPorche6b(t, saison); const { D, enDessus } = dessus6b(t);
  // 1. le fond de la halle : ses poteaux du fond (dans l'ombre du toit), et le sol de grandes dalles qui s'enfonce dans l'ombre
  for (const cx of poteaux) for (let y = yB + 7; y <= yFd; y++) for (let x = cx - 3; x <= cx + 3; x++) t.poser(x, y, 'chene', x === cx - 3 ? 2 : x === cx + 3 ? 0 : 1);
  for (let y = yFd + 1; y <= sol; y++) { const r = Math.floor((sol - y) / 9), ty = (sol - y) % 9, v = (y - yFd) / fond, dec = (r % 2) * 11;
    for (let x = 0; x < L; x++) { const tx = (x + dec) % 22; t.poser(x, y, 'gres', (ty === 8 || tx === 0 ? 0 : ty === 7 ? 3 : 2) - (v < 0.4 ? 1 : 0) + (v > 0.85 ? 1 : 0)); } }
  // 2. les poteaux de devant sur leurs socles de pierre (le dessus des socles) ; les murets des travées de côté et leurs bacs
  for (const cx of poteaux) {
    for (let y = yB + 7; y <= sol - 9; y++) for (let x = cx - 4; x <= cx + 4; x++) t.poser(x, y, 'chene', x === cx - 4 ? 5 : x === cx + 4 ? 1 : x === cx ? 2 : 3);
    enDessus(() => { for (let x = cx - 7; x <= cx + 7; x++) { t.poser(x, sol - 11, 'taille', 4); t.poser(x, sol - 10, 'taille', 5); } });
    for (let x = cx - 4; x <= cx + 4; x++) t.poser(x, sol - 11, 'chene', 2);
    for (let y = sol - 9; y <= sol; y++) for (let x = cx - 7; x <= cx + 7; x++) t.poser(x, y, 'taille', y === sol ? 1 : x === cx - 7 ? 4 : x === cx + 7 ? 2 : 3);
  }
  for (const [a, b] of [[poteaux[0] + 8, poteaux[1] - 8], [poteaux[2] + 8, poteaux[3] - 8]]) {
    for (let y = sol - 26; y <= sol; y++) for (let x = a; x <= b; x++) t.poser(x, y, 'pierre', 3);
    enDessus(() => { for (let x = a; x <= b; x++) { t.poser(x, sol - 30, 'taille', 4); t.poser(x, sol - 29, 'taille', 5); } });
    for (let x = a; x <= b; x++) { t.poser(x, sol - 28, 'taille', 3); t.poser(x, sol - 27, 'taille', 1); }
    bacFleurs6b(t, a + 3, b - 3, sol - 30, saison, a + 8231, enDessus);
  }
  // 3. les aisseliers, la sablière de devant, le grand toit en croupe, l'ombre de sa rive
  for (const cx of poteaux) for (const sens of [-1, 1]) { if ((cx < 20 && sens < 0) || (cx > L - 20 && sens > 0)) continue;
    for (let k = 0; k < 14; k++) for (let e = 0; e < 3; e++) t.poser(cx + sens * (4 + k), yB + 21 - k + e, 'chene', e === 0 ? 5 : e === 2 ? 1 : 3); }
  planche(t, 0, yB, L, 8, 'chene', { graine: 8232, noeuds: 3 }); for (let x = 0; x < L; x++) t.poser(x, yB + 7, 'cheneSombre', 1);
  let toit; enDessus(() => { toit = toitCroupeHD(t, { xa: R.xa, xb: R.xb, yEgout: yB - 3, montee: R.montee, prof: R.prof, mat: 'tuile', motif: 'tuile', g: 8233, bois: 'chene' }); });
  for (let x = 0; x < L; x++) for (let k = 0; k < 4; k++) if (t.mat(x, yB + k) === 'chene') teinterV(t, x, yB + k, k < 2 ? -2 : -1);
  //    l'ombre du toit sur le haut de la halle (le dessous est dans l'ombre)
  for (let y = yB + 8; y < yB + 20; y++) for (let x = 0; x < L; x++) if (t.mat(x, y) === 'chene') teinterV(t, x, y, y < yB + 13 ? -1 : 0);
  // 4. les fanions dans la travée du milieu, les chaînes de l'écriteau, les deux lanternes pendues à la sablière
  fanions6b(t, poteaux[1] + 5, poteaux[2] - 5, yB + 26, 5, saison);
  for (const x of chaines) for (let y = yB + 8; y < yB + 12; y++) t.poser(x, y, 'fer', y % 2 ? 4 : 2);
  for (const [lx, ly] of PP.lanternes) { for (let y = yB + 8; y < ly - 12; y++) t.poser(lx, y, 'fer', y % 2 ? 3 : 1); lanterne6b(t, lx, ly - 12, nuit, enDessus); }
  t.contour();
  const C = toileCanvas6b(t);
  pierresRondesDonnees(C.d, L, H, [{ r: [poteaux[0] + 8, sol - 26, poteaux[1] - 8, sol], graine: 8234 }, { r: [poteaux[2] + 8, sol - 26, poteaux[3] - 8, sol], graine: 8235 }]);
  for (let x = 0; x < L; x++) { C.mul(x, sol, 0.74); C.mul(x, sol - 1, 0.88); }
  C.fin(s, cle);
  s.textures.get(cle).toit89 = { haut: toit.yF - 2, bas: yB - 1, chem: null, lucarne: null, nu: null };
  if (saison === 'givre') neigeDessus6b(s, cle, t, D);
}
// L'ombre du porche : (A) sous le toit, sur le seuil couvert de la place ; devant, sur les dalles de la rue, la bande d'ombre du
// débord du toit (un peu à droite : la lumière vient d'en haut à gauche), l'ombre des piliers, des poteaux, des murets
function ombrePorche7b(scene, PP, cle) {
  if (scene.textures.exists(cle)) return cle;
  const { L, H, sol, toit: R, seuil } = PP, Hs = H + seuil, tex = scene.textures.createCanvas(cle, L, Hs), c = tex.getContext(), img = c.createImageData(L, Hs), q = img.data;
  const a = (x, y, v) => { if (x < 0 || y < 0 || x >= L || y >= Hs) return; const i = (y * L + x) * 4; q[i] = 14; q[i + 1] = 10; q[i + 2] = 22; q[i + 3] = Math.max(q[i + 3], Math.round(255 * v)); };
  if (PP.couvert) { const [o0, o1] = [PP.piliers[0][1] + 1, PP.piliers[1][0]]; for (let y = sol - PP.couvert; y <= sol; y++) for (let x = o0; x < o1; x++) { const v = (y - (sol - PP.couvert)) / PP.couvert; a(x, y, 0.14 + 0.24 * Math.min(1, v * 2.5)); } }
  if (R) for (let k = 1; k <= 7; k++) for (let x = R.xa + 4; x <= R.xb + 4; x++) { const bord = Math.min(1, Math.min(x - R.xa - 4, R.xb + 4 - x) / 6); a(x, sol + k, (k < 5 ? 0.26 : 0.15) * bord); }
  const pieds = PP.bornes ? PP.bornes.map(cx => [cx - 12, cx + 14]) : PP.piliers ? PP.piliers.map(([a0, b0]) => [a0 - 2, b0 + 5]).concat(PP.murets !== false ? [[0, 12], [166, L - 1]] : []) : PP.poteaux.map(cx => [cx - 7, cx + 10]);
  for (const [g, d] of pieds) for (let k = 1; k <= 5; k++) for (let x = g; x <= d; x++) a(x, sol + k, 0.44 - k * 0.06);
  c.putImageData(img, 0, 0); tex.refresh(); return cle;
}
// Les passants de la place, vus au travers du porche : de vrais corps, à l'échelle de la rue (la projection : rien ne rapetisse
// au loin), qui flânent d'un bout à l'autre de l'ouverture sur le sol de la place, s'arrêtent, repartent. Ils passent derrière
// les piliers (le porche est posé par-dessus). foule : le conteneur ; cx, sol : le pied du porche dans le lot.
function passantsPlace6b(scene, foule, PP, { hiver = false } = {}) {
  const X = tx => (tx - PP.L / 2) * 2, Y = ty => 2 - (PP.H - ty) * 2, [o0, o1] = PP.ouverture, [p0, p1] = PP.passants;
  const xa = X(o0 + 8), xb = X(o1 - 8), races = ['humain', 'hobbit', 'nain', 'elfe', 'hobbit'], ech = 4.5 / SOUCO.F;
  [[0.15, 0.2], [0.5, 0.75], [0.82, 0.4], [0.35, 1], [0.65, 0]].forEach(([u, pr], i) => {
    const quoi = { nom: 'Flâneur du porche ' + i, race: races[i % races.length], feminin: i % 2 === 1, niveau: 'novice' };
    const p = imageCorps(scene, xa + (xb - xa) * u, Y(PP.sol - Math.round(p0 + (p1 - p0) * pr)), quoi, ech).setFlipX(i % 2 === 0);
    foule.add(p); foule.sort('y');
    const souffle = () => scene.tweens.add({ targets: p, scaleY: p.scaleY * 1.015, duration: 1300 + i * 170, yoyo: true, repeat: 1, ease: 'Sine.easeInOut' });
    const suite = () => {
      if (!p.active) return;
      if (Math.random() < 0.45) { souffle(); scene.time.delayedCall(2600 + Math.random() * 3000, suite); return; }
      const cible = Phaser.Math.Clamp(p.x + (Math.random() < 0.5 ? -1 : 1) * (40 + Math.random() * 90), xa, xb), duree = Math.abs(cible - p.x) / 0.03;
      if (duree < 300) { scene.time.delayedCall(800, suite); return; }
      p.setFlipX(cible < p.x); pasDeMarche(scene, p, duree, { poussiere: false });
      scene.tweens.add({ targets: p, x: cible, duration: duree, onComplete: () => scene.time.delayedCall(600 + Math.random() * 2400, suite) });
    };
    scene.time.delayedCall(400 + i * 700, suite);
  });
}

// ======================= 2. L'ATELIER DES MAGES-CHARPENTIERS =======================
// Le design de l'atelier (pattesHD.js : atelierMagesHD) : l'assise de pierre, l'enduit clair et les colombages sombres, les
// runes gravées sur la sablière, les grandes portes de grange ouvertes (dedans, la patte géante sur ses tréteaux, l'établi),
// les deux fenêtres éclairées, la cheminée de pierre, les ardoises bleu nuit, l'enseigne (un rabot et une baguette croisés).
// Dans la projection : un toit en croupe d'ardoises bleu nuit (38 de montée, 26 de profondeur), la cheminée debout sur le pan ;
// l'enseigne n'est plus peinte dans le pignon : c'est un panneau debout sur le pan avant, sur ses deux pieds de fer, son chant
// du haut vu par le dessus, son ombre sur les ardoises ; son nom sur la façade, jour et nuit (Q274) ; l'ombre de la rive
// sur le haut du mur ; les poutres, leur dessus éclairé et leur ombre sur l'enduit ; par les grandes portes, un vrai atelier vu
// d'en haut (interieurMages7b) ; les appuis des fenêtres, leurs vitres en retrait ; le dessus du soubassement, la
// pierre modelée, le pied du mur. Le chantier (avant l'ouverture) : la même maison, nue, dans la même projection.
const MAGES_VOLUME = { L: 156, H: 156, oy: 6, yE: 63, toit: { xa: 4, xb: 151, montee: 38, prof: 26 }, enseigne: { x: 62, d: 9 } };
function atelierMagesVolumeHD(s) {
  const cle = 'atelierMagesVolumeHD'; if (s.textures.exists(cle)) return cle;
  const { L, H, oy: O, yE, toit: R, enseigne: EN } = MAGES_VOLUME, t = toileDecor(L, H); Object.assign(t.rampes, RAMPES_RUE); rampesMages(t);
  const { D, enDessus, marquer } = dessus6b(t);
  // 1. l'assise de pierre (modelée à la fin) et le dessus du soubassement
  for (let y = 134 + O; y < H; y++) for (let x = 8; x < L - 8; x++) t.poser(x, y, 'pierre', 3);
  enDessus(() => { for (let x = 8; x < L - 8; x++) { t.poser(x, 132 + O, 'pierre', x === 8 ? 5 : 4); t.poser(x, 133 + O, 'pierre', 5); } });
  // 2. les murs : l'enduit clair, les colombages sombres, les runes gravées sur la sablière
  for (let y = 66; y < 132 + O; y++) for (let x = 12; x < L - 12; x++) t.poser(x, y, 'platre', 3 + (fbm(x * 0.15, (y - O) * 0.15, 6401) > 0.62 ? -1 : 0));
  for (const x of [12, 40, 116, 140]) segmentHD(t, [x + 2, 132 + O], [x + 2, 62 + O], 2.2, 'cheneSombre');
  for (const y of [61, 94]) segmentHD(t, [12, y + O], [L - 12, y + O], 2.2, 'cheneSombre');
  segmentHD(t, [14, 94 + O], [40, 63 + O], 1.6, 'cheneSombre'); segmentHD(t, [142, 94 + O], [116, 63 + O], 1.6, 'cheneSombre');
  //    les poutres : le dessus des horizontales au soleil, leur ombre sur l'enduit ; les poteaux éclairés à gauche
  for (const y of [92 + O]) for (let x = 12; x < L - 12; x++) { if (t.mat(x, y) === 'cheneSombre') t.poser(x, y, 'cheneSombre', 5); if (t.mat(x, y + 5) === 'platre') teinterV(t, x, y + 5, -1); }
  for (const x of [14, 42, 118, 142]) for (let y = 66; y < 132 + O; y++) { if (t.mat(x - 2, y) === 'cheneSombre') t.poser(x - 2, y, 'cheneSombre', 4); if (t.mat(x + 4, y) === 'platre') teinterV(t, x + 4, y, -1); }
  for (let k = 0; k < 9; k++) { const x = 20 + k * 14; if (x > 38 && x < 116) continue; t.poser(x, 66, 'rune', 5); t.poser(x + 1, 67, 'rune', 4); }
  // 3. (Q274) les grandes portes de grange ouvertes sur un vrai atelier, vu d'en haut (interieurMages7b) ; les deux vantaux
  //    rabattus contre le mur (leur chant du haut au soleil)
  interieurMages7b(t, O);
  for (const [a, b] of [[34, 46], [110, 122]]) { for (let y = 70 + O; y < 132 + O; y++) for (let x = a; x < b; x++) t.poser(x, y, 'chene', (x - a) % 4 === 0 ? 1 : x === a + 1 ? 4 : 3);
    enDessus(() => { for (let x = a; x < b; x++) t.poser(x, 69 + O, 'chene', 5); }); }
  // 4. les fenêtres à petits carreaux, éclairées : leurs vitres en retrait, leur appui de pierre vu par le dessus
  for (const x0 of [18, 122]) {
    for (let y = 100; y < 120; y++) for (let x = x0; x < x0 + 16; x++) { const pl = (x - x0) % 8 === 0 || (y - 100) % 10 === 0; t.poser(x, y + O, pl ? 'cheneSombre' : 'laiton', pl ? 1 : 4); }
    retraitHD(t, x0 + 1, 101 + O, x0 + 15, 119 + O, (x, y) => t.mat(x, y) === 'laiton', 2);
    enDessus(() => appuiHD(t, x0 - 2, x0 + 17, 120 + O, 'pierre'));
  }
  // 5. le toit en croupe d'ardoises bleu nuit, l'ombre épaisse de sa rive sur le haut du mur, la cheminée debout sur le pan
  let toit; enDessus(() => { toit = toitCroupeHD(t, { xa: R.xa, xb: R.xb, yEgout: yE, montee: R.montee, prof: R.prof, mat: 'bleuNuit', motif: 'ardoise', g: 6411, bois: 'chene' }); });
  ombreRiveHD(t, R.xa, R.xb, yE, m => m === 'platre' || m === 'cheneSombre');
  const ch = chemineeVolumeHD(t, toit, 112, 12, 13, 24, 'pierre');
  for (let y = ch.haut; y < ch.haut + 6; y++) for (let x = ch.x0; x < ch.x0 + ch.l; x++) if (t.mat(x, y) === 'pierre') marquer(x, y);
  // 6. l'enseigne, debout sur le pan avant : le même panneau (un rabot et une baguette croisés), son chant du haut vu par le
  //    dessus, ses deux pieds de fer, son ombre sur les ardoises (à droite et dessous)
  const yP = Math.round(toit.surface(EN.d)), ex = EN.x, ey = yP - 23;   // (le haut du panneau ; son pied à 3 rangs du pan)
  for (const fx of [ex + 4, ex + 27]) for (let y = ey + 20; y <= yP; y++) { t.poser(fx, y, 'fer', 3); t.poser(fx + 1, y, 'fer', 1); }
  for (let k = 1; k <= 3; k++) for (let y = ey + 4; y <= yP + 2; y++) teinterV(t, ex + 31 + k, y, -2);
  for (let y = yP + 1; y <= yP + 2; y++) for (let x = ex + 2; x < ex + 34; x++) teinterV(t, x, y, -1);
  enDessus(() => { for (let x = ex; x < ex + 32; x++) { t.poser(x, ey, 'chene', 5); t.poser(x, ey + 1, 'chene', 4); } });
  const B = (x, y) => [x - 62 + ex, y - 36 + ey + 2];   // (le dessin du panneau d'origine, 62..93 × 36..53)
  for (let y = 36; y < 54; y++) for (let x = 62; x < 94; x++) t.poser(...B(x, y), 'chene', y === 36 || y === 53 ? 1 : x === 62 ? 4 : x === 93 ? 2 : 3);
  segmentHD(t, B(66, 50), B(90, 40), 1.2, 'cheneSombre'); disqueHD(t, ...B(90, 40), 1.6, 'rune', 5);
  for (let x = 68; x < 86; x++) for (let y = 42; y < 47; y++) t.poser(...B(x, y), x < 72 ? 'chene' : 'cheneSombre', 3); for (let x = 74; x < 80; x++) t.poser(...B(x, 41), 'fer', 4);
  // 7. les bords du mur, le pied du mur ; la pierre modelée (les assises égales de l'atelier)
  bordsMurHD(t, 12, L - 13, yE + 3, 131 + O);
  t.contour();
  const C = toileCanvas6b(t);
  pierresRondesDonnees(C.d, L, H, [{ r: [8, 134 + O, L - 9, H - 3], regulier: true, graine: 6413 }]);
  for (let x = 0; x < L; x++) { C.mul(x, H - 1, 0.72); C.mul(x, H - 2, 0.86); }
  C.fin(s, cle);
  const tex = s.textures.get(cle); tex.cheminee = [ch.cx, ch.haut - 2]; tex.volume89 = { enseigne: [ex, ey, 32, 20] };
  neigeDessus6b(s, cle, t, D);
  return cle;
}
// (Q274) L'intérieur de l'atelier, vu par les grandes portes (46..109 × 76..137) : plus jamais un trou noir. Un atelier de
// charpentiers-mages, lisible vu d'en haut, à la lumière chaude d'une lanterne et à la lueur bleue des runes :
//   - le plancher (ses lames vers le fond), qui s'enfonce de 34 rangs (45 de profondeur) et s'assombrit, semé de copeaux ;
//   - le mur du fond, de planches : les plans cloués (une maison sur pattes, à l'encre), le râtelier des outils (la scie, le
//     maillet, l'équerre, les ciseaux à bois), une étagère et ses pots ;
//   - au milieu, la patte géante en cours, sur ses tréteaux (le dessin de l'atelier d'avant) ;
//   - devant à gauche, l'établi (son dessus vu d'en haut, l'étau, un rabot) et sur lui la maquette d'une maison sur pattes ;
//   - devant à droite, une poutre en cours sur deux tréteaux (son dessus, les traits de mesure), le ciseau enchanté posé
//     dessus, qui luit bleu ; des copeaux en tas dessous ;
//   - le chat de l'atelier, roulé en boule sur les copeaux ; la lanterne qui pend sous le linteau ; l'ombre du linteau.
function interieurMages7b(t, O, partie = 'tout') {   // (partie : 'tout' ; 'avant' : seulement l'établi et la poutre, posés par-dessus ceux qui travaillent ; 'chat')
  Object.assign(t.rampes, { copeau: rampe(0xd8b070), chatA: rampe(0x8a7058), maquette: rampe(0xe8dcc0), terreCuite: rampe(0xb8603a) });
  const x0 = 46, x1 = 109, yH = 70 + O, yS = 131 + O, yF = yS - 33, P = (x, y, m, k) => { if (x >= x0 && x <= x1 && y >= yH && y <= yS) t.poser(Math.round(x), Math.round(y), m, Math.max(0, Math.min(5, Math.round(k)))); };
  const fond = partie === 'tout', avant = partie === 'tout' || partie === 'avant', chat = partie === 'chat', eb = yS - 2;
  if (fond) {
  // le mur du fond, de planches, et sa lisse
  for (let y = yH; y < yF; y++) for (let x = x0; x <= x1; x++) P(x, y, 'chene', (x - x0) % 9 === 0 ? 0 : 1 + (hachage((x - x0) / 9 | 0, 3, 6431) > 0.6 ? 1 : 0) - (y < yH + 6 ? 1 : 0));
  for (let x = x0; x <= x1; x++) { P(x, yF - 1, 'cheneSombre', 2); P(x, yF, 'cheneSombre', 0); }
  // le plancher, vu par le dessus : ses lames vont vers le fond ; plus clair vers les portes (le jour qui entre)
  for (let y = yF + 1; y <= yS; y++) { const v = (y - yF) / (yS - yF); for (let x = x0; x <= x1; x++) P(x, y, 'chene', (x - x0) % 8 === 0 ? 0 : 1 + (v > 0.45 ? 1 : 0) + (v > 0.8 ? 1 : 0) + (hachage((x - x0) / 8 | 0, y >> 2, 6432) > 0.85 ? 1 : 0)); }
  // les plans cloués au mur : une maison sur pattes, à l'encre, sur le parchemin ; leurs clous
  for (const [px, py, w, h] of [[49, yH + 9, 15, 12], [92, yH + 13, 14, 11]]) {
    for (let y = py; y < py + h; y++) for (let x = px; x < px + w; x++) P(x, y, 'parchemin', y === py ? 4 : x === px + w - 1 || y === py + h - 1 ? 2 : 3);
    const cx = px + (w >> 1);
    for (let x = cx - 4; x <= cx + 3; x++) { P(x, py + 6, 'encre', 2); P(x, py + 3, 'encre', 2); }   // les murs, le toit
    for (let y = py + 3; y <= py + 6; y++) { P(cx - 4, y, 'encre', 2); P(cx + 3, y, 'encre', 2); }
    for (let k = 0; k < 3; k++) { P(cx - 3 + k, py + 2 - k, 'encre', 2); P(cx + 2 - k, py + 2 - k, 'encre', 2); }
    for (const lx of [cx - 3, cx + 2]) for (let y = py + 7; y < py + h - 1; y++) P(lx + ((y - py) % 2), y, 'encre', 2);   // les pattes
    for (const [nx, ny] of [[px, py], [px + w - 1, py], [px, py + h - 1], [px + w - 1, py + h - 1]]) P(nx, ny, 'fer', 4);
  }
  // le râtelier des outils (une lisse, la scie, le maillet, l'équerre, deux ciseaux) et l'étagère des pots
  const yr = yH - 10;   // (le râtelier, haut sur le mur : la patte est devant, plus bas)
  for (let x = 66; x <= 90; x++) { P(x, yr + 12, 'chene', 4); P(x, yr + 13, 'cheneSombre', 1); }
  for (let k = 0; k < 9; k++) for (let y = 0; y <= Math.floor(k * 0.55); y++) P(67 + k, yr + 14 + y, 'fer', y === 0 ? 4 : 3);   // la scie
  for (let y = yr + 14; y < yr + 17; y++) for (let x = 76; x <= 77; x++) P(x, y, 'chene', 3);
  for (let y = yr + 14; y < yr + 20; y++) P(80, y, 'chene', 3); for (let x = 78; x <= 82; x++) for (let y = yr + 20; y < yr + 23; y++) P(x, y, 'chene', y === yr + 20 ? 5 : 3);   // le maillet
  for (let y = yr + 14; y < yr + 24; y++) P(85, y, 'fer', 4); for (let x = 85; x <= 89; x++) P(x, yr + 24, 'fer', 4);   // l'équerre
  for (const cx of [72, 75]) { for (let y = yr + 14; y < yr + 18; y++) P(cx, y, 'chene', 4); for (let y = yr + 18; y < yr + 22; y++) P(cx, y, 'fer', 3); }
  // la patte géante en cours, au milieu, sur ses tréteaux (son dessin d'avant, un peu plus au fond)
  const dy = O - 6;
  for (const [a, b] of [[56, 62], [94, 100]]) segmentHD(t, [a, 124 + dy], [b, 124 + dy], 1, 'cheneClair');
  segmentHD(t, [56, 124 + dy], [58, 110 + dy], 1, 'cheneClair'); segmentHD(t, [98, 124 + dy], [96, 110 + dy], 1, 'cheneClair');
  for (const [a, b] of [[54, 64], [92, 102]]) for (let x = a; x <= b; x++) P(x, 109 + dy, 'cheneClair', 5);   // (le dessus des tréteaux)
  segmentHD(t, [60, 108 + dy], [78, 96 + dy], 4.5, 'cheneClair', { bandes: 6, mat2: 'fer' }); segmentHD(t, [78, 96 + dy], [96, 108 + dy], 3.5, 'cheneClair', { bandes: 6, mat2: 'fer' });
  disqueHD(t, 78, 96 + dy, 4.5, 'laiton', 3); disqueHD(t, 78, 96 + dy, 2, 'rune', 5);
  }
  if (avant) {
  // l'établi, devant à gauche : son dessus vu d'en haut, sa face, ses pieds ; l'étau, un rabot ; la maquette d'une maison sur pattes

  for (let y = eb - 9; y <= eb; y++) for (const lx of [48, 64]) P(lx, y, 'cheneSombre', 2);
  for (let y = eb - 13; y < eb - 9; y++) for (let x = 47; x <= 66; x++) P(x, y, 'chene', y === eb - 10 ? 1 : 2);
  for (let y = eb - 19; y < eb - 13; y++) for (let x = 47; x <= 66; x++) P(x, y, 'chene', y === eb - 14 ? 5 : 4 - ((x - 47) % 10 === 0 ? 1 : 0));
  for (let y = eb - 15; y < eb - 9; y++) { P(66, y, 'fer', 3); P(67, y, 'fer', 1); }   // l'étau
  for (let x = 60; x <= 64; x++) { P(x, eb - 18, 'chene', 5); P(x, eb - 17, 'cheneSombre', 2); } P(62, eb - 19, 'fer', 4);   // un rabot
  { const mx = 52, my = eb - 18;   // la maquette : 4 pattes fines, le corps blanc, la fenêtre, le toit de tuile rouge
    for (const lx of [mx, mx + 6]) for (let y = my - 4; y < my; y++) { P(lx, y, 'cheneClair', 3); P(lx + 1, y + 1, 'cheneClair', 2); }
    for (let y = my - 10; y < my - 4; y++) for (let x = mx - 1; x <= mx + 7; x++) P(x, y, 'maquette', x === mx - 1 ? 5 : x === mx + 7 ? 2 : 4);
    P(mx + 3, my - 8, 'vitre', 4); P(mx + 4, my - 8, 'vitre', 4);
    for (let y = my - 14; y < my - 10; y++) for (let x = mx - 2 + (my - 11 - y) * 0.5; x <= mx + 8 - (my - 11 - y) * 0.5; x++) P(x, y, 'tuile', y === my - 14 ? 5 : 3); }
  // la poutre en cours, devant à droite, sur deux tréteaux : son dessus (les traits de mesure), sa face ; le ciseau enchanté
  for (const lx of [83, 104]) for (let y = eb - 8; y <= eb; y++) { P(lx, y, 'cheneClair', 3); P(lx + 1, y, 'cheneClair', 1); }
  for (let y = eb - 11; y < eb - 8; y++) for (let x = 78; x <= 109; x++) P(x, y, 'cheneClair', y === eb - 9 ? 1 : 2);
  for (let y = eb - 15; y < eb - 11; y++) for (let x = 78; x <= 109; x++) P(x, y, 'cheneClair', y === eb - 15 ? 5 : (x - 78) % 8 === 4 && y === eb - 13 ? 2 : 4);
  for (let x = 90; x <= 97; x++) P(x, eb - 13, x < 93 ? 'chene' : 'fer', x < 93 ? 3 : 5);   // le ciseau à bois, posé
  for (const [rx, ry] of [[95, eb - 16], [98, eb - 14], [93, eb - 17], [99, eb - 17], [96, eb - 19]]) P(rx, ry, 'rune', 5);   // sa lueur
  for (let y = eb - 21; y <= eb - 10; y++) for (let x = 89; x <= 103; x++) if (Math.hypot(x - 95, (y - (eb - 14)) * 1.3) < 7 && t.mat(x, y) !== 'rune') teinterV(t, x, y, 1);
  }
  // les copeaux : des boucles claires sur le plancher, en tas sous la poutre et près de l'établi ; le chat roulé en boule dessus
  if (fond) for (let k = 0; k < 46; k++) { const cx = x0 + 2 + hachage(k, 1, 6433) * (x1 - x0 - 4), cy = yF + 3 + hachage(k, 2, 6433) * (yS - yF - 4), tas = (cx > 78 && cy > eb - 8) || (cx < 70 && cy > eb - 6);
    if (!tas && hachage(k, 3, 6433) > 0.45) continue; P(cx, cy, 'copeau', 4); P(cx + 1, cy, 'copeau', 3); if (hachage(k, 4, 6433) > 0.5) P(cx, cy - 1, 'copeau', 5); }
  if (avant) for (let y = eb - 3; y <= eb + 1; y++) for (let x = 86; x <= 102; x++) if (((x - 94) / 8.5) ** 2 + ((y - eb + 1) / 2.6) ** 2 <= 1) P(x, y, 'copeau', y < eb - 1 ? 5 : 3);
  if (chat) { const cx = 70, cy = eb - 1;   // le chat : une boule tigrée, la tête posée sur la queue, une oreille
    for (let y = cy - 4; y <= cy; y++) for (let x = cx - 5; x <= cx + 5; x++) { const q = ((x - cx) / 5.5) ** 2 + ((y - cy + 2) / 2.6) ** 2; if (q <= 1) P(x, y, 'chatA', (y < cy - 2 ? 4 : 3) - ((x + y) % 3 === 0 ? 1 : 0)); }
    for (let y = cy - 4; y <= cy - 1; y++) for (let x = cx + 4; x <= cx + 7; x++) if (Math.hypot(x - cx - 5.5, y - cy + 2.5) < 2) P(x, y, 'chatA', 4);
    P(cx + 7, cy - 5, 'chatA', 3); P(cx + 5, cy - 5, 'chatA', 3); P(cx + 6, cy - 3, 'fer', 0);
    for (let x = cx - 4; x <= cx + 3; x++) P(x, cy + 1, 'chatA', 2); }
  // la lanterne qui pend sous le linteau, et sa lumière chaude autour d'elle ; l'ombre du linteau sur le haut
  const lx = 101; if (fond) { for (let y = yH; y < yH + 3; y++) P(lx, y, 'fer', 2);
  for (let y = yH + 3; y < yH + 9; y++) for (let x = lx - 2; x <= lx + 2; x++) P(x, y, x === lx - 2 || x === lx + 2 ? 'fer' : 'vitre', x === lx - 2 || x === lx + 2 ? 2 : 5); }
  for (let y = yH; y <= yS; y++) for (let x = x0; x <= x1; x++) { const m = t.mat(x, y); if (!m || m === 'vitre' || m === 'rune') continue; const d = Math.hypot(x - lx, (y - yH - 6) * 1.2);
    if (d < 22) teinterV(t, x, y, 1); else if (d > 50 && y < yF) teinterV(t, x, y, -1); }
  for (let y = yH; y < yH + 3; y++) for (let x = x0; x <= x1; x++) if (t.mat(x, y) && t.mat(x, y) !== 'vitre') teinterV(t, x, y, -2);
  for (let y = yH; y <= yS; y++) for (const x of [x0, x0 + 1]) if (t.mat(x, y)) teinterV(t, x, y, -1);
}
// Le chantier : l'assise de pierre, le plancher neuf (vu par le dessus, jusqu'au fond), le colombage nu de chêne clair (devant,
// et celui du fond qu'on voit au travers), un mur de planches à moitié, la charpente du toit en croupe, nue (les arêtiers, le
// faîtage, les chevrons du pan avant ; la bâche sur sa moitié droite), l'échafaudage (ses planchers vus par le dessus) et son
// échelle, la poutre et la planche qui flottent dans leur lueur bleue (un sort de lévitation), le tas de planches.
function chantierMagesVolumeHD(s) {
  const cle = 'chantierMagesVolumeHD'; if (s.textures.exists(cle)) return cle;
  const { L, H, oy: O, yE, toit: R } = MAGES_VOLUME, DY = 14, t = toileDecor(L, H + DY); Object.assign(t.rampes, RAMPES_RUE); rampesMages(t);
  const { D, enDessus } = dessus6b(t); decaler6b(t, DY);   // (14 rangs de plus en haut : la poutre qui monte au-dessus du faîte)
  const P = R.montee + Math.round(R.prof * VOLUME_HD.prof), yBas = yE - 1, yF = yBas - P + 1, rec = R.prof, hC = Math.round(2 * R.prof * VOLUME_HD.prof), fond = hC;
  const xl = y => R.xa + (yBas - y) / P * rec, xr = y => R.xb - (yBas - y) / P * rec;
  // 1. le colombage du fond, vu au travers (plus sombre) : ses poteaux, ses sablières, et la rive du fond du toit
  for (const x of [14, 52, 92, 134]) segmentHD(t, [x, 131 + O - fond], [x, 67 - fond], 1.4, 'cheneSombre');
  segmentHD(t, [12, 67 - fond], [L - 12, 67 - fond], 1.3, 'cheneSombre');
  segmentHD(t, [R.xa, yBas - hC], [R.xb, yBas - hC], 1.1, 'cheneSombre');
  for (const [a, b] of [[[R.xa, yBas - hC], [R.xa + rec, yF]], [[R.xb, yBas - hC], [R.xb - rec, yF]]]) segmentHD(t, a, b, 1.1, 'cheneSombre');
  // 2. le plancher neuf, vu par le dessus, du fond jusqu'à la rue (les lames vont vers le fond)
  enDessus(() => { for (let y = 132 + O - fond; y < 132 + O; y++) { const v = (y - (132 + O - fond)) / fond; for (let x = 12; x < L - 12; x++) { if (t.mat(x, y)) continue;
    t.poser(x, y, 'chene', (x - 12) % 7 === 0 ? 1 : 2 + (v > 0.5 ? 1 : 0) + (hachage((x - 12) / 7 | 0, y >> 2, 6421) > 0.8 ? 1 : 0) - (v < 0.2 ? 1 : 0)); } } });
  // 3. l'assise de pierre et son dessus
  for (let y = 134 + O; y < H; y++) for (let x = 8; x < L - 8; x++) t.poser(x, y, 'pierre', 3);
  enDessus(() => { for (let x = 8; x < L - 8; x++) { t.poser(x, 132 + O, 'pierre', 4); t.poser(x, 133 + O, 'pierre', 5); } });
  // 4. la charpente du toit, nue : les chevrons du pan avant, les arêtiers, le faîtage ; la bâche sur la moitié droite
  for (let x = Math.round(xl(yF)) + 10; x < xr(yF) - 4; x += 22) segmentHD(t, [x, yBas], [x, yF], 1.1, 'cheneClair');
  for (const y of [yBas - 28]) segmentHD(t, [xl(y), y], [xr(y), y], 0.8, 'cheneClair');   // (deux liteaux)
  for (let y = yF; y <= yBas; y++) for (let x = Math.max(80, Math.ceil(xl(y))); x <= xr(y) - 1; x++) { if ((x - 80) > (y - yF) * 1.6 + 6) continue;
    t.poser(x, y, 'bache', 3 + (Math.floor((x + y) / 7) % 2 ? -1 : 0) + (y > yBas - 4 ? -1 : 0) + (y < yF + 3 ? 1 : 0)); }
  enDessus(() => { segmentHD(t, [R.xa, yBas], [R.xa + rec, yF], 1.6, 'cheneClair'); segmentHD(t, [R.xb, yBas], [R.xb - rec, yF], 1.6, 'cheneClair');
    segmentHD(t, [R.xa + rec, yF], [R.xb - rec, yF], 1.8, 'cheneClair');
    for (let x = R.xa; x <= R.xb; x++) { t.poser(x, yE, 'cheneClair', 5); t.poser(x, yE + 1, 'cheneClair', 3); t.poser(x, yE + 2, 'chene', 1); } });   // la sablière d'égout, son dessus
  // 5. le colombage de devant, en chêne clair tout neuf : poteaux, sablières (leur dessus au soleil), décharges
  for (const x of [14, 52, 92, 134]) segmentHD(t, [x, 132 + O], [x, 66], 2.6, 'cheneClair');
  enDessus(() => { for (const y of [67, 96 + O]) segmentHD(t, [12, y], [138, y], 2.4, 'cheneClair'); });
  segmentHD(t, [14, 96 + O], [52, 132 + O], 1.8, 'cheneClair'); segmentHD(t, [92, 96 + O], [134, 132 + O], 1.8, 'cheneClair');
  // 6. un mur de planches, à moitié monté (son chant du haut vu par le dessus)
  for (const [a, b, y0] of [[17, 50, 104], [55, 90, 116]]) { for (let x = a; x < b; x++) for (let y = y0 + O; y < 131 + O; y++) t.poser(x, y, 'chene', (x - a) % 6 === 0 ? 1 : x === a + 1 ? 4 : 3 + (hachage(Math.floor((x - a) / 6), y >> 3, 5) > 0.7 ? -1 : 0));
    enDessus(() => { for (let x = a; x < b; x++) t.poser(x, y0 + O - 1, 'chene', 5); }); }
  // 7. l'échafaudage, devant à droite : ses perches, ses deux planchers vus par le dessus, ses croix, l'échelle
  for (const x of [100, 128, L - 4]) segmentHD(t, [x, H - 2], [x, 56], 1.4, 'cheneClair');
  for (const y of [76, 110]) { enDessus(() => { for (let x = 98; x < L - 2; x++) { t.poser(x, y - 3, 'chene', 4); t.poser(x, y - 2, 'chene', (x - 98) % 9 === 0 ? 3 : 4); t.poser(x, y - 1, 'chene', 5); } });
    for (let x = 98; x < L - 2; x++) { t.poser(x, y, 'chene', 2); t.poser(x, y + 1, 'chene', 1); } }
  for (const y of [86, 120]) segmentHD(t, [100, y + O], [128, y + 10 + O], 1, 'cheneClair');
  segmentHD(t, [112, H - 2], [104, 74], 1, 'cheneClair'); segmentHD(t, [120, H - 2], [112, 74], 1, 'cheneClair');
  for (let k = 0; k < 9; k++) { const y = 150 - k * 8.5; segmentHD(t, [112 - k, y], [120 - k, y], 0.7, 'cheneClair'); }
  // 8. la poutre qui monte toute seule vers le faîte, la planche qui flotte : leur lueur bleue (un sort de lévitation)
  segmentHD(t, [60, yF - 4], [92, yF - 12], 2, 'cheneClair');
  for (const [x, y] of [[58, 8], [66, 2], [76, 11], [88, -1], [95, 8], [70, 14]]) { t.poser(x, y + yF - 16, 'rune', 5); t.poser(x + 1, y + yF - 16, 'rune', 3); t.poser(x, y + yF - 15, 'rune', 3); }
  for (let x = 20; x < 46; x++) { const y = 74 + O + Math.round((x - 20) * 0.12); enDessus(() => t.poser(x, y, 'chene', 5)); for (let k = 1; k < 4; k++) t.poser(x, y + k, 'chene', k === 1 ? 3 : 2); }
  for (const [x, y] of [[18, 70], [24, 82], [33, 69], [44, 84], [48, 72], [29, 86], [40, 66]]) { t.poser(x, y + O, 'rune', 5); t.poser(x + 1, y + O, 'rune', 3); t.poser(x, y + O + 1, 'rune', 3); }
  // 9. le tas de planches, au pied (le dessus de chaque planche au soleil)
  for (let k = 0; k < 4; k++) { const y = 128 + O - 6 + k * 2; enDessus(() => { for (let x = 60 - k * 2; x < 92 + k; x++) t.poser(x, y, 'chene', 5); }); for (let x = 60 - k * 2; x < 92 + k; x++) t.poser(x, y + 1, 'chene', 2); }
  t.contour();
  const C = toileCanvas6b(t);
  pierresRondesDonnees(C.d, L, H + DY, [{ r: [8, 134 + O + DY, L - 9, H + DY - 3], regulier: true, graine: 6414 }]);
  for (let x = 0; x < L; x++) { C.mul(x, H + DY - 1, 0.72); C.mul(x, H + DY - 2, 0.86); }
  C.fin(s, cle);
  neigeDessus6b(s, cle, t, D);
  return cle;
}

// ======================= 3. L'IMPASSE DU CORBEAU =======================
// Le design de l'impasse (rueHD.js : rueImpasseHD) : deux piliers de pierre à l'entrée, leurs chapeaux, la poutre qui les
// relie (l'écriteau y pend à deux chaînes), les murs de pierre qui s'enfoncent, le sol pavé, la porte basse au fond (en arc,
// son judas grillé). Plus de point de fuite : vue d'en haut, la ruelle est un couloir droit. Les murs de côté sont vus par la
// tranche : on voit leur dessus (le chaperon de pierre), qui file vers le fond sur 44 rangs (58 de profondeur × 0,75), et le
// bout des murs (les piliers) de face ; entre eux, le sol de la ruelle, vu par le dessus, ses pavés en rangs, qui s'enfonce et
// s'assombrit (l'ombre du mur de gauche, le fond toujours dans l'ombre) ; au bout, le mur du fond de face, sa porte basse en
// retrait, et sa lanterne rouge, éteinte (allumée les soirs du marché noir : lanterneCorbeauHD) ; tout en haut, le chaperon
// du mur du fond qui ferme le « U ». La pierre est modelée (dessus clair, pied sombre, joints irréguliers) ; le chaperon des murs
// est de pierre de taille claire, au soleil ; le pied de chaque mur, une ligne d'ombre sur le sol.
const IMPASSE_VOLUME = { L: 95, H: 147, mur: 96, fond: 44, ecriteau: [41, 67], lanterne: [60, 88] };
function impasseVolumeHD(s) {
  const cle = 'impasseVolumeHD'; if (s.textures.exists(cle)) return cle;
  const { L, H, mur: hw, fond: f } = IMPASSE_VOLUME, sol = H - 1, t = toileDecor(L, H); Object.assign(t.rampes, RAMPES_RUE);
  t.rampes.paveI = [0x1e1c1a, 0x34302c, 0x4a443e, 0x625a52, 0x7e756a, 0x9c9286];
  const { D, enDessus } = dessus6b(t), yF = sol - f, yH = yF - hw, yM = sol - hw, xg = 9, xd = L - 10;   // (le pied du mur du fond, son haut, le haut des piliers, l'intérieur)
  // 1. le sol de la ruelle, vu par le dessus : des pavés en rangs de 4 (le joint, le dessus éclairé, le pied), plus sombres vers
  //    le fond, l'ombre du mur de gauche le long de son pied
  for (let y = yF; y <= sol; y++) { const r = Math.floor((y - yF) / 4), ty = (y - yF) % 4, dec = (r % 2) * 3, v = (y - yF) / f;
    for (let x = xg; x <= xd; x++) { const tx = (x - xg + dec) % 6, h = hachage(Math.floor((x - xg + dec) / 6), r, 829), coin = (ty === 1 || ty === 3) && (tx === 1 || tx === 5);
      const k = ty === 0 || tx === 0 ? 0 : coin ? 1 : (ty === 1 ? 4 : ty === 2 ? 3 : 2) + (h > 0.8 ? 1 : h < 0.16 ? -1 : 0) - (tx === 5 ? 1 : 0);
      const neige = x - xg < 5 + 4 * fbm(y * 0.2, 1, 839) || xd - x < 5 + 4 * fbm(y * 0.2, 2, 839) || v < 0.12;   // (l'hiver : contre les murs et au fond ; le milieu piétiné)
      if (neige) enDessus(() => t.poser(x, y, 'paveI', k)); else t.poser(x, y, 'paveI', k); } }
  // 2. le mur du fond, de face (la pierre est modelée à la fin) ; son chaperon, tout en haut, vu par le dessus
  for (let y = yH + 1; y < yF; y++) for (let x = xg; x <= xd; x++) t.poser(x, y, 'pierre', 3);
  enDessus(() => { for (let x = 0; x < L; x++) for (let k = 0; k < 5; k++) { const y = yH - 4 + k, j = (x + (k > 1 ? 5 : 0)) % 11 === 0; t.poser(x, y, 'taille', k === 4 ? 1 : j ? 2 : k === 3 ? 5 : 4 - (hachage(x / 11 | 0, 1, 833) > 0.7 ? 1 : 0)); } });
  // 3. le dessus des murs de côté (leur chaperon), qui file du haut des piliers jusqu'au mur du fond
  enDessus(() => { for (const [a, b] of [[0, xg - 1], [xd + 1, L - 1]]) for (let y = yH + 1; y < yM; y++) for (let x = a; x <= b; x++) {
    const j = (yM - y) % 7 === 0; t.poser(x, y, 'taille', j ? 2 : x === a ? (a ? 2 : 5) : x === b ? (a ? 1 : 3) : 4 + (hachage((yM - y) / 7 | 0, a, 832) > 0.75 ? 1 : 0)); } });
  // 4. les piliers (le bout des murs), de face ; leur chapeau, son dessus et son chant
  for (const [a, b] of [[0, xg - 1], [xd + 1, L - 1]]) {
    for (let y = yM + 2; y <= sol; y++) for (let x = a; x <= b; x++) t.poser(x, y, 'pierre', 3);
    enDessus(() => { for (let x = a; x <= b; x++) { t.poser(x, yM - 2, 'taille', 4); t.poser(x, yM - 1, 'taille', 5); } });
    for (let x = a; x <= b; x++) { t.poser(x, yM, 'taille', 3); t.poser(x, yM + 1, 'taille', 1); }
  }
  // 5. la poutre qui relie les piliers (son dessus au soleil), les chaînes, la planche de l'écriteau (son chant du haut)
  planche(t, 4, yM + 4, L - 8, 5, 'cheneSombre', { graine: 835, noeuds: 2 });
  enDessus(() => { for (let x = 4; x < L - 4; x++) { t.poser(x, yM + 2, 'cheneSombre', 4); t.poser(x, yM + 3, 'cheneSombre', 5); } });
  for (const x of [30, 52]) for (let y = yM + 9; y < yM + 13; y++) t.poser(x, y, 'fer', y % 2 ? 4 : 2);
  planche(t, 26, yM + 13, 30, 8, 'chene', { graine: 834 }); enDessus(() => { for (let x = 26; x < 56; x++) t.poser(x, yM + 12, 'chene', 5); });
  // 6. la porte basse au fond, en arc, son judas grillé, en retrait dans le mur
  porteRue(t, 41, yF - 22, 13, 22, { arc: true, graine: 831 });
  for (let x = 45; x < 51; x += 2) for (let y = yF - 18; y < yF - 14; y++) t.poser(x, y, 'fer', 2);
  retraitHD(t, 41, yF - 22, 53, yF - 1, (x, y) => { const m = t.mat(x, y); return x >= 41 && x <= 53 && y >= yF - 22 && (m === 'cheneSombre' || m === 'fer' || m === 'laiton'); }, 3);
  // 7. la lanterne rouge, éteinte, à droite de la porte : sa potence, son chapeau vu par le dessus, son verre sombre
  const [lx, ly] = IMPASSE_VOLUME.lanterne;   // (le centre du pied de la lanterne)
  for (let x = 56; x <= lx; x++) t.poser(x, ly - 12, 'fer', 3); t.poser(56, ly - 11, 'fer', 2);
  enDessus(() => { for (let x = lx - 3; x <= lx + 3; x++) t.poser(x, ly - 10, 'fer', 4); });
  for (let x = lx - 3; x <= lx + 3; x++) t.poser(x, ly - 9, 'fer', 2);
  for (let y = ly - 8; y < ly; y++) for (let x = lx - 2; x <= lx + 2; x++) t.poser(x, y, x === lx - 2 || x === lx + 2 ? 'fer' : 'toileRouge', x === lx - 2 || x === lx + 2 ? 2 : y < ly - 5 ? 2 : 1);
  for (let x = lx - 2; x <= lx + 2; x++) t.poser(x, ly, 'fer', 2);
  t.contour();
  // 8. la pierre modelée (les piliers, le mur du fond), puis l'ombre de la ruelle : le mur du fond s'assombrit vers le bas et
  //    sur sa gauche (l'ombre du mur de côté) ; le pied des piliers
  const C = toileCanvas6b(t);
  pierresRondesDonnees(C.d, L, H, [{ r: [0, yM + 2, xg - 1, sol], graine: 836 }, { r: [xd + 1, yM + 2, L - 1, sol], graine: 837 },
    { r: [xg, yH + 1, xd, yF - 1], graine: 838, sauf: [[39, yF - 24, 55, yF], [54, ly - 14, lx + 4, ly + 1]] }]);
  for (let y = yH + 1; y < yF; y++) { const v = (y - yH) / hw; for (let x = xg; x <= xd; x++) C.mul(x, y, (0.66 - 0.34 * Math.pow(v, 0.7)) * (x - xg < 10 ? 0.74 : x - xg < 16 ? 0.88 : 1)); }
  for (let y = yF; y <= sol; y++) { const v = (y - yF) / f; for (let x = xg; x <= xd; x++) C.mul(x, y, (0.42 + 0.58 * Math.pow(v, 1.3)) * (x - xg < 6 ? 0.7 : x - xg < 13 ? 0.86 : 1)); }   // (le sol : le fond dans l'ombre, l'ombre du mur de gauche)
  for (let x = xg; x <= xd; x++) for (let k = 0; k < 3; k++) C.mul(x, yF + k, 0.6 + k * 0.14);   // (le pied du mur du fond, sur le sol)
  for (let y = yF; y <= sol; y++) { C.mul(xg, y, 0.55); C.mul(xg + 1, y, 0.8); C.mul(xd, y, 0.6); }   // (le pied des murs de côté : leur ligne d'ombre)
  for (let x = 0; x < L; x++) { C.mul(x, sol, 0.72); C.mul(x, sol - 1, 0.86); }
  C.fin(s, cle);
  neigeDessus6b(s, cle, t, D, (x, y) => y >= yF ? 0.6 + 0.4 * Math.pow((y - yF) / f, 1.2) : 1);   // (la neige du sol de la ruelle, dans son ombre)
  return cle;
}
// La lanterne rouge allumée (les soirs du marché noir), posée sur celle de l'impasse : le verre qui brûle, sa flamme
function lanterneCorbeauHD(s) {
  const cle = 'lanterneCorbeauHD'; if (s.textures.exists(cle)) return cle;
  const t = toileDecor(5, 8); t.rampes.feuR = [0x5a0a06, 0x9a1a0e, 0xd83a1a, 0xff5a2a, 0xff9a5a, 0xffd8a0];
  for (let y = 0; y < 8; y++) for (let x = 0; x < 5; x++) t.poser(x, y, x === 0 || x === 4 ? 'fer' : 'feuR', x === 0 || x === 4 ? 2 : y > 2 && y < 6 && x === 2 ? 5 : y > 1 ? 4 : 3);
  t.texture(s, cle); return cle;
}

// --- solution 2 : l'ouverture marquée (deux piliers bas de pierre, leurs poteaux de chêne et leurs lanternes, les bacs de fleurs,
//     la guirlande de fanions tendue au-dessus ; rien qui ressemble à une porte) ---
function bornesPlaceHD(s, PP, cle, jour, saison) {
  const { L, H, sol, bornes, guirlande } = PP, nuit = !jour, t = toileDecor(L, H); rampesPorche6b(t, saison); const { D, enDessus } = dessus6b(t);
  const tops = [];
  for (const cx of bornes) {
    const sens = cx < L / 2 ? 1 : -1, a = cx - 9, b = cx + 9;
    // le pilier bas : son soubassement (son dessus), son fût de pierre (modelé ensuite), son chapeau vu par le dessus
    for (let y = sol - 5; y <= sol; y++) for (let x = a - 2; x <= b + 2; x++) t.poser(x, y, 'taille', y === sol ? 1 : x === a - 2 ? 4 : x === b + 2 ? 2 : 3);
    enDessus(() => { for (let x = a - 2; x <= b + 2; x++) { t.poser(x, sol - 7, 'taille', 4); t.poser(x, sol - 6, 'taille', 5); } });
    for (let y = sol - 38; y < sol - 7; y++) for (let x = a; x <= b; x++) t.poser(x, y, 'pierre', 3);
    enDessus(() => { for (let x = a - 2; x <= b + 2; x++) { t.poser(x, sol - 44, 'taille', 4); t.poser(x, sol - 43, 'taille', 5); } });
    for (let x = a - 2; x <= b + 2; x++) { t.poser(x, sol - 42, 'taille', 3); t.poser(x, sol - 41, 'taille', 2); t.poser(x, sol - 40, 'taille', 1); }
    for (let x = a; x <= b; x++) for (let k = 0; k < 2; k++) teinterV(t, x, sol - 39 + k, -2 + k);
    // le poteau de chêne, sa potence vers l'ouverture, la lanterne qui pend
    const yP = guirlande - 6;
    for (let y = yP; y < sol - 44; y++) for (let x = cx - 3; x <= cx + 3; x++) t.poser(x, y, 'chene', x === cx - 3 ? 5 : x === cx + 3 ? 1 : x === cx ? 2 : 3);
    enDessus(() => { for (let x = cx - 4; x <= cx + 4; x++) t.poser(x, yP - 1, 'chene', 5); });
    const [lx, ly] = PP.lanternes[bornes.indexOf(cx)];
    for (let x = Math.min(cx, lx); x <= Math.max(cx, lx); x++) { enDessus(() => t.poser(x, ly - 15, 'chene', 5)); t.poser(x, ly - 14, 'chene', 3); t.poser(x, ly - 13, 'cheneSombre', 1); }
    for (let k = 0; k < 7; k++) t.poser(cx + sens * (4 + k), ly - 12 + k, 'chene', 3);   // (la jambe de force)
    t.poser(lx, ly - 12, 'fer', 2); lanterne6b(t, lx, ly - 11, nuit, enDessus);
    tops.push(cx);
    bacFleurs6b(t, cx - 12, cx + 12, sol, saison, cx + 8241, enDessus);
  }
  // la guirlande, d'un poteau à l'autre, au-dessus de l'ouverture (et une seconde, plus basse)
  fanions6b(t, tops[0] + 4, tops[1] - 4, guirlande, 12, saison); fanions6b(t, tops[0] + 4, tops[1] - 4, guirlande + 2, 18, saison);
  t.contour();
  const C = toileCanvas6b(t);
  pierresRondesDonnees(C.d, L, H, bornes.map((cx, i) => ({ r: [cx - 9, sol - 38, cx + 9, sol - 8], graine: 8251 + i })));
  C.fin(s, cle);
  if (saison === 'givre') neigeDessus6b(s, cle, t, D);
}
// Un étal du marché qui déborde dans la rue, et des caisses (vues d'en haut : leur dessus au soleil), à poser dans le monde
function etalRue7b(s, i, jour) {
  const saison = (typeof saisonActuelle === 'function' && saisonActuelle()) || 'moissons', cle = `etalRue7b_${i}_${saison}_${jour ? 'j' : 'n'}`;
  if (s.textures.exists(cle)) return cle;
  const t = toileDecor(40, 52); rampesPorche6b(t, saison); Object.assign(t.rampes, { pain: rampe(0xc8904a), ble: rampe(0xd8b048), pomme: rampeVive(0xc8382a), citrouille: rampeVive(0xe0701a) });
  etal6b((x, y, m, k) => t.poser(Math.round(x), Math.round(y), m, Math.max(0, Math.min(5, Math.round(k)))), 4, 32, 48, i, jour, saison);
  t.contour(); t.texture(s, cle); return cle;
}
function caissesRue7b(s, jour) {
  const saison = (typeof saisonActuelle === 'function' && saisonActuelle()) || 'moissons', hiver = saison === 'givre', cle = `caissesRue7b_${saison}_${jour ? 'j' : 'n'}`;
  if (s.textures.exists(cle)) return cle;
  const t = toileDecor(46, 30); rampesPorche6b(t, saison); Object.assign(t.rampes, { pomme: rampeVive(0xc8382a), citrouille: rampeVive(0xe0701a) }); const n = jour ? 0 : -1;
  const caisse = (x0, w, yb, h, prof, fruit) => {
    for (let y = yb - h; y <= yb; y++) for (let x = x0; x < x0 + w; x++) t.poser(x, y, 'chene', ((y - yb + h) % 5 === 4 ? 1 : x === x0 ? 4 : x === x0 + w - 1 ? 1 : 3) + n);
    for (let y = yb - h - prof; y < yb - h; y++) for (let x = x0; x < x0 + w; x++) t.poser(x, y, hiver ? 'neige' : fruit && x > x0 && x < x0 + w - 1 && y > yb - h - prof ? fruit : 'chene', hiver ? 5 : fruit ? 3 + ((x + y) % 2) : (y === yb - h - prof ? 5 : 4) + n);
  };
  caisse(2, 16, 28, 10, 5, jour && saison === 'brumes' ? 'citrouille' : jour ? 'pomme' : null); caisse(6, 12, 15, 8, 4, null);
  for (let y = 12; y <= 28; y++) for (let x = 26; x < 40; x++) { const u = (x - 33) / 7; if (Math.abs(u) > 1) continue; t.poser(x, y, (y - 12) % 6 === 0 ? 'fer' : 'chene', ((y - 12) % 6 === 0 ? 3 : 3 - (u > 0.5 ? 1 : 0) + (u < -0.5 ? 1 : 0)) + n); }   // un tonneau
  for (let y = 8; y < 12; y++) for (let x = 26; x < 40; x++) if (((x - 32.5) / 7) ** 2 + ((y - 10) / 2.2) ** 2 <= 1) t.poser(x, y, hiver ? 'neige' : 'chene', (hiver ? 5 : 4) + n);
  t.contour(); t.texture(s, cle); return cle;
}

// ======================= (Q280) CEUX QUI TRAVAILLENT DANS L'ATELIER DES MAGES =======================
// Certains jours (un tirage au jour), un ou deux apprentis, ou le maître et un apprenti, sont au travail dans l'atelier : l'un
// rabote à l'établi (des copeaux volent), l'autre porte une planche d'un bout à l'autre, le maître trace sur un plan déroulé
// sur la poutre. Ils sont debout derrière l'établi et la poutre (posés par-dessus eux : atelierMagesAvantHD). Les autres jours,
// l'atelier est vide, ou seul le chat dort sur les copeaux (atelierMagesChatHD). La nuit, l'atelier dort (le chat, parfois).
function atelierMagesAvantHD(s) {
  const cle = 'atelierMagesAvantHD'; if (s.textures.exists(cle)) return cle;
  const { L, H, oy: O } = MAGES_VOLUME, t = toileDecor(L, H); Object.assign(t.rampes, RAMPES_RUE); rampesMages(t); interieurMages7b(t, O, 'avant'); t.texture(s, cle); return cle;
}
function atelierMagesChatHD(s) {
  const cle = 'atelierMagesChatHD'; if (s.textures.exists(cle)) return cle;
  const { L, H, oy: O } = MAGES_VOLUME, t = toileDecor(L, H); Object.assign(t.rampes, RAMPES_RUE); rampesMages(t); interieurMages7b(t, O, 'chat'); t.texture(s, cle); return cle;
}
function tirageAtelierMages(G) {
  const f = typeof window !== 'undefined' && window.MAGES_TIRAGE; if (f) return f;
  const r = hachage(G ? G.jour : 0, 11, 7003);
  return r < 0.2 ? 'maitre' : r < 0.42 ? 'deux' : r < 0.58 ? 'planche' : r < 0.8 ? 'chat' : 'vide';
}
// Dans le lot de l'atelier (ses coordonnées), après l'image de l'atelier : pose les gens du jour, puis l'avant de l'atelier
// par-dessus eux, puis ce qui est posé sur la poutre (le plan) et les copeaux qui volent
function ouvriersMages(s, jour) {
  const G = window.GAME, quoi = tirageAtelierMages(G), M = MAGES_VOLUME, X = x => (x - M.L / 2) * 2, Y = y => 2 - (M.H - y) * 2, ech = 4.5 / SOUCO.F;
  if (!jour) { if (quoi === 'chat' || quoi === 'vide') s.add.image(0, 2, atelierMagesChatHD(s)).setOrigin(0.5, 1).setScale(2); return quoi; }
  if (quoi === 'chat') { s.add.image(0, 2, atelierMagesChatHD(s)).setOrigin(0.5, 1).setScale(2); return quoi; }
  if (quoi === 'vide') return quoi;
  const corps = (q, x, y) => imageCorps(s, x, y, q, ech);
  const apprenti = (k, fem) => ({ nom: 'Apprenti des Mages ' + k, race: 'hobbit', feminin: fem, niveau: 'novice' });
  const raboteur = quoi === 'maitre' || quoi === 'deux';
  let r = null, m = null, p = null;
  if (raboteur) r = corps(apprenti(1, false), X(57), Y(129)).setFlipX(true);
  if (quoi === 'maitre') m = corps({ nom: 'Le maître-charpentier', race: 'nain', niveau: 'aguerri' }, X(96), Y(128)).setFlipX(true);
  if (quoi === 'deux' || quoi === 'planche') p = corps(apprenti(2, true), X(74), Y(127));
  const planche = p ? s.add.rectangle(p.x, p.y, 44, 5, 0xa8743c).setStrokeStyle(1, 0x4a2e18) : null;
  s.add.image(0, 2, atelierMagesAvantHD(s)).setOrigin(0.5, 1).setScale(2);   // (l'établi et la poutre, devant eux)
  // le rabot : des allers-retours, des copeaux qui volent
  if (r) {
    s.tweens.add({ targets: r, x: r.x + 7, duration: 360, yoyo: true, repeat: -1, repeatDelay: 260, ease: 'Sine.easeInOut' });
    const copeaux = [0, 1, 2, 3].map(() => s.add.rectangle(0, 0, 3, 2, 0xe0c080).setVisible(false));
    let k = 0; s.time.addEvent({ delay: 620, loop: true, callback: () => { const c = copeaux[k++ % copeaux.length]; if (!c.active || !r.active) return;
      c.setPosition(r.x + 18, Y(114)).setVisible(true).setAlpha(1); s.tweens.add({ targets: c, x: c.x + 8 + Math.random() * 14, y: c.y - 6 - Math.random() * 6, angle: 200, duration: 380, yoyo: false, onComplete: () => s.tweens.add({ targets: c, y: Y(116), alpha: 0, duration: 420 }) }); } });
  }
  // le maître, penché sur le plan déroulé sur la poutre : il s'incline, trace ; la pointe court sur le parchemin
  if (m) {
    s.tweens.add({ targets: m, angle: -5, duration: 1100, yoyo: true, repeat: -1, repeatDelay: 900, ease: 'Sine.easeInOut' });
    s.add.rectangle(X(97), Y(119), 30, 7, 0xe8d8b0).setStrokeStyle(1, 0x8a7050);
    const trait = s.add.rectangle(X(91), Y(119), 2, 2, 0x2a3a6a);
    s.tweens.add({ targets: trait, x: X(103), duration: 1700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', onYoyo: () => trait.setY(Y(119) + (Math.random() < 0.5 ? -2 : 2)) });
  }
  // la planche portée sur l'épaule, d'un bout de l'atelier à l'autre (il marche, se retourne)
  if (p) {
    const suivre = () => planche.setPosition(p.x + (p.flipX ? -6 : 6), p.y - p.displayHeight * 0.8);
    suivre(); const xa = X(60), xb = X(98);
    const aller = () => { if (!p.active) return; const cible = p.x < (xa + xb) / 2 ? xb : xa, duree = Math.abs(cible - p.x) / 0.03;
      p.setFlipX(cible < p.x); pasDeMarche(s, p, duree, { poussiere: false });
      s.tweens.add({ targets: p, x: cible, duration: duree, onUpdate: suivre, onComplete: () => { suivre(); s.time.delayedCall(900 + Math.random() * 1600, aller); } }); };
    s.time.delayedCall(600, aller);
  }
  return quoi;
}

// ======================= ÉTAPE 9b : LE BOUT DE LA RUE À LA MÊME ÉCHELLE QUE LA PLACE (Q283), LE POIDS PUBLIC (Q285) =======================
// Le marché vu au bout de la rue était une petite vue rapetissée (ses étals à 43 % de leur taille, sa fontaine à 33 %). La rue
// et la place ont le même monde (les gens y sont à 4,5 ; un pixel du monde est le même) : la rue débouche donc directement sur
// le vrai début de la place, posé dans le monde de la rue, à sa vraie place et à sa vraie taille : son sol (le même dessin que
// la scène de la place : solPlaceHD), ses passants, le jour de marché la charrette d'un colporteur. On n'en voit qu'un morceau,
// entre la banque et le poids public : le reste est hors cadre. On y entre en marchant.
// Le point de la place qui fait face au bout de la rue (son entrée sud : LIEUX_PLACE.arche, 900 × 1040) est en (3640, YN) dans la rue.
Object.assign(PORCHE_PISTES, { 4: { piste: '4', reel: true, ouvert: true, lanternes: [], L: 176, H: 205, sol: 204, seuil: 12, passants: [18, 46], ouverture: [0, 176] } });
const PLACE_DANS_RUE = { X: 3640, x0: 3500, x1: 3772, profondeur: 560 };
function placeReelleRue9b(s, ici, { jour, saison, YN }) {
  const D = PLACE_DANS_RUE, A = typeof LIEUX_PLACE !== 'undefined' ? LIEUX_PLACE.arche : [900, 1040], enRue = (px, py) => [D.X + (px - A[0]), YN - (A[1] - py)];
  // 1. le sol de la place, le même que dans sa scène : on en découpe le morceau qu'on voit par le bout de la rue
  const pal = paletteSaisonComte(saison), cleSol = solPlaceHD(s, 'solPlace_' + saison, pal, PLACE_MARCHE.L / 2, 520, planSolPlace());
  const k = 'solPlaceTranche_' + saison;
  if (!s.textures.exists(k)) {
    const src = s.textures.get(cleSol).getSourceImage(), px0 = A[0] + (D.x0 - D.X), py0 = A[1] - D.profondeur, l = (D.x1 - D.x0) / 2, h = D.profondeur / 2;
    const cv = document.createElement('canvas'); cv.width = l; cv.height = h; const c = cv.getContext('2d'); c.imageSmoothingEnabled = false;
    c.drawImage(src, px0 / 2, py0 / 2, l, h, 0, 0, l, h);
    const I = c.getImageData(0, 0, l, h), d = I.data;   // (sous le bord de la rue, l'ombre des façades et du trottoir)
    for (let y = h - 4; y < h; y++) for (let x = 0; x < l; x++) { const i = (y * l + x) * 4, f = 0.78 + (h - 1 - y) * 0.05; d[i] *= f; d[i + 1] *= f; d[i + 2] *= f; }
    c.putImageData(I, 0, 0); s.textures.addCanvas(k, cv);
  }
  ici.img(D.x0, YN - D.profondeur, k, 2, YN - D.profondeur - 1, 0, 0);
  // la fontaine de la place, à sa place (son pied à 378 du bord de la rue) et à sa taille : la banque et le poids public la cachent
  // en partie, comme dans la réalité ; ses deux pots de fleurs
  if (typeof fontaineLoinHD === 'function' && typeof FONTAINE_LOIN !== 'undefined') {
    const F = FONTAINE_LOIN, [fx, fy] = enRue(900, 662), solF = fy - (F.H - F.sol) * 2;
    ici.img(fx + 12, solF + 6, ombrePlaceHD(s), 1, solF - 60, 0.5, 0.5).setScale((F.ext.rx * 4 + 30) / 64, (F.ext.ry * 4 + 18) / 24);
    ici.img(fx, fy, fontaineLoinHD(s), 2, solF);
    if (typeof potFleursLoinHD === 'function') for (const sens of [-1, 1]) ici.img(fx + sens * 150, fy + 4, potFleursLoinHD(s), 2, fy + 4).setFlipX(sens > 0);
  }
  // 2. le jour de marché, la charrette d'un colporteur, juste à l'entrée de la place (le marché qui commence) et son colporteur
  const G = window.GAME, marche = typeof jourDeMarche === 'function' && G && jourDeMarche(G);
  if (marche && typeof charretteColporteurHD === 'function') {
    const [cx, cy] = [3712, YN - 64]; ici.img(cx, cy, charretteColporteurHD(s), 2.2, cy).setFlipX(true);
    if (jour) { const v = imageCorps(s, cx - 74, cy + 30, 'colporteur', 4.5); ici.poser(v, cy + 30); s.tweens.add({ targets: v, scaleY: v.scaleY * 1.015, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }); }
  }
  // 3. les passants de la place, à l'échelle de la rue (le jour) : ils flânent sur la place, au bout de la rue
  if (!jour) return;
  const races = ['humain', 'hobbit', 'nain', 'elfe', 'hobbit'];
  [[3540, YN - 46, 0], [3626, YN - 112, 1], [3690, YN - 28, 2], [3580, YN - 170, 3]].forEach(([x, y, i]) => {
    const p = imageCorps(s, x, y, { nom: 'Flâneur de la place ' + i, race: races[i], feminin: i % 2 === 1, niveau: 'novice' }, 4.5).setFlipX(i % 2 === 0); ici.poser(p, y);
    const suite = () => { if (!p.active) return;
      if (Math.random() < 0.45) { s.tweens.add({ targets: p, scaleY: p.scaleY * 1.015, duration: 1300, yoyo: true, repeat: 1 }); s.time.delayedCall(2600 + Math.random() * 3000, suite); return; }
      const cible = Phaser.Math.Clamp(p.x + (Math.random() < 0.5 ? -1 : 1) * (40 + Math.random() * 80), D.x0 + 24, D.x1 - 24), duree = Math.abs(cible - p.x) / 0.03;
      if (duree < 300) { s.time.delayedCall(800, suite); return; }
      p.setFlipX(cible < p.x); pasDeMarche(s, p, duree, { poussiere: false });
      s.tweens.add({ targets: p, x: cible, duration: duree, onComplete: () => s.time.delayedCall(600 + Math.random() * 2400, suite) }); };
    s.time.delayedCall(400 + i * 700, suite);
  });
}
// --- (Q285) Le poids public, à l'angle est du bout de la rue, à l'entrée de la place : une petite loge ouverte sur la rue, son
//     mur du fond de pierre modelée, deux poteaux de chêne sur leurs socles, sa sablière, son auvent de planches (son dessus vu
//     d'en haut), un toit en croupe de tuiles ; dedans, la grande balance à fléau sur son portique de chêne, ses deux plateaux de
//     laiton pendus à leurs chaînes (un sac sur l'un), les poids de fonte empilés, l'ardoise des tarifs au mur, le registre ouvert
//     sur son pupitre ; devant, des sacs et une caisse à peser. Le préposé y pèse, certains jours (posé par la rue).
const POIDS_PUBLIC = { L: 84, H: 150, X: 3838, yE: 58, ecriteau: [42, 64], prepose: [22, 142] };
function poidsPublicHD(s, jour) {
  const saison = (typeof saisonActuelle === 'function' && saisonActuelle()) || 'moissons', cle = 'poidsPublicHD_' + saison + (jour ? '_j' : '_n');
  if (s.textures.exists(cle)) return cle;
  const { L, H, yE } = POIDS_PUBLIC, sol = H - 1, t = toileDecor(L, H); rampesPorche6b(t, saison); const { D, enDessus } = dessus6b(t);
  Object.assign(t.rampes, { ardoiseT: [0x14161a, 0x1e2228, 0x2a3038, 0x3a424c, 0x8a929a, 0xe8ecf0], sac: rampe(0xc8a878), bardeauP: rampe(0x8a6a44) });
  const yF = sol - 18, yAuv = yE + 12;   // (le pied du mur du fond : la loge a 24 de profondeur ; l'auvent, sous la sablière)
  // 1. le mur du fond (de pierre, dans l'ombre de la loge), le sol de dalles vu d'en haut
  for (let y = yE + 3; y < yF; y++) for (let x = 2; x < L - 2; x++) t.poser(x, y, 'pierre', 3);
  for (let y = yF; y <= sol; y++) { const r = Math.floor((sol - y) / 6), ty = (sol - y) % 6; for (let x = 2; x < L - 2; x++) t.poser(x, y, 'taille', (ty === 5 || (x + r * 7) % 14 === 0 ? 1 : ty === 4 ? 4 : 3) - (y < yF + 5 ? 1 : 0)); }
  // 2. l'ardoise des tarifs, au mur : son cadre, ses lignes de craie
  for (let y = yAuv + 12; y < yAuv + 30; y++) for (let x = 56; x < 74; x++) { const cadre = x === 56 || x === 73 || y === yAuv + 12 || y === yAuv + 29; t.poser(x, y, cadre ? 'chene' : 'ardoiseT', cadre ? (y === yAuv + 12 ? 5 : 2) : ((y - yAuv - 15) % 4 === 0 && x > 58 && x < 71 - ((y * 3) % 5) ? 5 : 2)); }
  // 3. la balance à fléau : le portique de chêne, le fléau de fer (son dessus éclairé), les chaînes, les deux plateaux de laiton vus d'en haut
  const bx = 40, yb = sol - 8;
  for (const ux of [bx - 13, bx + 13]) for (let y = yAuv + 16; y <= yb; y++) { t.poser(ux, y, 'chene', 4); t.poser(ux + 1, y, 'chene', 2); }
  enDessus(() => { for (let x = bx - 14; x <= bx + 15; x++) t.poser(x, yAuv + 15, 'chene', 5); }); for (let x = bx - 14; x <= bx + 15; x++) t.poser(x, yAuv + 16, 'chene', 2);
  for (let y = yAuv + 17; y < yAuv + 21; y++) t.poser(bx, y, 'fer', 3);
  for (let x = bx - 12; x <= bx + 12; x++) { t.poser(x, yAuv + 20, 'laiton', 5); t.poser(x, yAuv + 21, 'fer', 4); t.poser(x, yAuv + 22, 'fer', 2); } t.poser(bx, yAuv + 20, 'laiton', 5); t.poser(bx, yAuv + 23, 'laiton', 4);
  for (const px of [bx - 11, bx + 11]) {
    for (let y = yAuv + 23; y < yAuv + 38; y++) { t.poser(px - 3 + Math.round((y - yAuv - 23) * 0.1), y, 'fer', y % 2 ? 4 : 2); t.poser(px + 3 - Math.round((y - yAuv - 23) * 0.1), y, 'fer', y % 2 ? 2 : 1); }
    for (let y = yAuv + 37; y <= yAuv + 42; y++) for (let x = px - 7; x <= px + 7; x++) { const q = ((x - px) / 7.5) ** 2 + ((y - yAuv - 39.5) / 2.6) ** 2; if (q <= 1) t.poser(x, y, 'laiton', y < yAuv + 39 ? 5 : y > yAuv + 41 ? 2 : 4); }
  }
  for (let y = yAuv + 29; y <= yAuv + 38; y++) for (let x = bx + 6; x <= bx + 16; x++) { const q = ((x - bx - 11) / 5.5) ** 2 + ((y - yAuv - 34) / 5) ** 2; if (q <= 1) t.poser(x, y, 'sac', (y < yAuv + 32 ? 4 : 3) - (x > bx + 13 ? 1 : 0)); }   // (un sac sur le plateau)
  // 4. les poids de fonte empilés (leur dessus éclairé), le pupitre et son registre ouvert
  for (const [cx, w, yy] of [[14, 6, sol - 6], [14, 5, sol - 11], [14, 4, sol - 15], [24, 4, sol - 5]]) { for (let y = yy - 4; y <= yy; y++) for (let x = cx - w; x <= cx + w; x++) t.poser(x, y, 'fer', x < cx - w + 2 ? 3 : 2 - (y === yy ? 1 : 0)); enDessus(() => { for (let x = cx - w; x <= cx + w; x++) { t.poser(x, yy - 5, 'fer', 4); t.poser(x, yy - 6, 'fer', 5); } }); }
  for (let y = sol - 28; y <= sol - 4; y++) { t.poser(66, y, 'chene', 3); t.poser(67, y, 'chene', 1); }
  for (let y = sol - 34; y < sol - 28; y++) for (let x = 59; x <= 74; x++) t.poser(x, y, 'chene', y === sol - 29 ? 1 : 3);
  for (let y = sol - 37; y < sol - 33; y++) for (let x = 60; x <= 73; x++) t.poser(x, y, x === 66 ? 'chene' : 'parchemin', x === 66 ? 2 : y === sol - 37 ? 5 : (y + x) % 3 === 0 ? 2 : 4);   // (le registre ouvert, vu d'en haut)
  // 5. la loge dans son ombre, puis ce qui est devant : les poteaux, les socles, la sablière, l'auvent, le toit
  for (let y = yE + 3; y <= sol; y++) for (let x = 2; x < L - 2; x++) { const m = t.mat(x, y); if (m && m !== 'laiton' && m !== 'parchemin' && m !== 'fer' && (y < yAuv + 14 || m === 'pierre')) teinterV(t, x, y, y < yAuv + 8 ? -2 : -1); }
  for (const px of [3, L - 10]) {
    for (let y = yE + 3; y <= sol - 8; y++) for (let x = px; x < px + 7; x++) t.poser(x, y, 'chene', x === px ? 5 : x === px + 6 ? 1 : 3);
    enDessus(() => { for (let x = px - 2; x < px + 9; x++) { t.poser(x, sol - 9, 'taille', 4); t.poser(x, sol - 8, 'taille', 5); } });
    for (let y = sol - 7; y <= sol; y++) for (let x = px - 2; x < px + 9; x++) t.poser(x, y, 'taille', y === sol ? 1 : x === px - 2 ? 4 : 2);
  }
  planche(t, 0, yE + 3, L, 7, 'chene', { graine: 8261, noeuds: 1 }); for (let x = 0; x < L; x++) t.poser(x, yE + 9, 'cheneSombre', 1);
  enDessus(() => { for (let y = yE + 10; y < yAuv + 3; y++) for (let x = 0; x < L; x++) t.poser(x, y, 'bardeauP', (x % 6 === 0 ? 2 : 4) + (y === yAuv + 2 ? 1 : 0)); });   // l'auvent de planches, vu par le dessus
  for (let x = 0; x < L; x++) { t.poser(x, yAuv + 3, 'bardeauP', 2); t.poser(x, yAuv + 4, 'cheneSombre', 1); for (let k = 5; k < 9; k++) teinterV(t, x, yAuv + k, k < 7 ? -2 : -1); }
  let toit; enDessus(() => { toit = toitCroupeHD(t, { xa: 0, xb: L - 1, yEgout: yE, montee: 18, prof: 18, mat: 'tuile', motif: 'tuile', g: 8262, bois: 'chene' }); });
  for (let x = 0; x < L; x++) for (let k = 3; k < 6; k++) if (t.mat(x, yE + k) === 'chene') teinterV(t, x, yE + k, -1);
  // 6. devant, sur le pavé : deux sacs et une caisse à peser
  for (const [cx, cy] of [[30, sol], [38, sol - 1]]) for (let y = cy - 9; y <= cy; y++) for (let x = cx - 5; x <= cx + 5; x++) { const q = ((x - cx) / 5.5) ** 2 + ((y - cy + 4) / 5.2) ** 2; if (q <= 1) t.poser(x, y, 'sac', (y < cy - 6 ? 5 : 3) - (x > cx + 2 ? 1 : 0)); }
  for (let y = sol - 9; y <= sol; y++) for (let x = 48; x < 60; x++) t.poser(x, y, 'chene', y === sol - 9 ? 5 : y === sol ? 1 : (y - sol) % 4 === 0 ? 2 : 3);
  t.contour();
  const C = toileCanvas6b(t);
  pierresRondesDonnees(C.d, L, H, [{ r: [2, yAuv + 5, L - 3, yF - 1], graine: 8263 }]);
  for (let x = 0; x < L; x++) { C.mul(x, sol, 0.74); C.mul(x, sol - 1, 0.88); }
  C.fin(s, cle);
  if (saison === 'givre') neigeDessus6b(s, cle, t, D);
  return cle;
}
// Le préposé du poids public, certains jours (un tirage au jour) : il attend à côté de la balance, se tourne, écrit
function preposePoidsPublic(s, ici, YN) {
  const G = window.GAME, P = POIDS_PUBLIC, f = typeof window !== 'undefined' && window.PREPOSE_POIDS;
  if (!(f !== undefined ? f : hachage(G ? G.jour : 0, 5, 7101) < 0.65)) return null;
  const x = P.X + (P.prepose[0] - P.L / 2) * 1.6, y = YN + 2 - (P.H - P.prepose[1]) * 1.6;
  const p = imageCorps(s, x, y, { nom: 'Le préposé au poids public', race: 'hobbit', niveau: 'aguerri' }, 4.5); ici.poser(p, YN + 1);
  s.tweens.add({ targets: p, scaleY: p.scaleY * 1.012, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  s.time.addEvent({ delay: 3800, loop: true, callback: () => p.active && p.setFlipX(!p.flipX) });
  return p;
}
