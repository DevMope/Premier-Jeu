// (v1.65, la rue Soucolline vue de haut, étape 6b) Trois bâtiments de la rue dans la projection validée (maisonVolumeHD.js :
// verticales 1:1, tout ce qui est horizontal vu par le dessus et écrasé × 0,75, sans point de fuite ; toit en croupe ; l'ombre
// de la rive sur le haut du mur ; le dessus éclairé des appuis, des marches, des poutres ; les ouvertures en retrait ; la
// pierre modelée ; l'ombre de contact au pied). Une fonction par bâtiment, le même design, les mêmes couleurs :
//   - le porche de la place des Mastres (porcheVolumeHD) : l'arche de chêne, sa palissade, la place au travers ;
//   - l'atelier des Mages-Charpentiers (atelierMagesVolumeHD) et son chantier (chantierMagesVolumeHD) ;
//   - l'impasse du Corbeau (impasseVolumeHD) et sa lanterne rouge (lanterneCorbeauHD).
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

// ======================= 1. LE PORCHE DE LA PLACE DES MASTRES =======================
// Le design de la planche 80 (porche A, rueVieHD.js : porcheRueHD) : deux poteaux de chêne sur leurs socles de grès, les
// aisseliers, le linteau, un petit toit de tuiles, les deux battants ouverts vers la place, la palissade de pieux de part et
// d'autre, les chaînes de l'écriteau ; par l'ouverture, la place (peindrePlacePorche : la même, ses fanions, ses étals).
// Dans la projection : le petit toit devient un toit en croupe (8 de montée, 12 de profondeur) ; le linteau dépasse du toit
// de chaque côté et l'on voit le dessus de ses abouts ; l'ombre de la rive sur le linteau ; les battants, ouverts vers le fond,
// ne rapetissent plus : ils montent en parallélogramme (0,75 × leur profondeur), leur chant du haut vu par le dessus ; les
// socles de grès montrent leur dessus (et l'ombre du poteau dessus) ; les pieux, leur pointe éclairée à gauche ; les deux
// traverses, leur dessus. L'ombre de l'arche (ombrePorcheVolumeHD) : sous le toit, sur le seuil couvert ; devant, la bande
// d'ombre du débord du toit sur le seuil de dalles, l'ombre des socles et du pied de la palissade.
const PORCHE_VOLUME = { L: 176, H: 154, oy: 2, poteaux: [26, 150], linteau: 24, toit: { xa: 6, xb: 169, montee: 8, prof: 12 }, seuil: 14 };
function porcheVolumeHD(scene, jour = true) {
  const saison = (typeof saisonActuelle === 'function' && saisonActuelle()) || 'moissons';
  const suf = saison + (jour ? '_jour' : '_nuit'), cle = 'porcheVolumeHD_' + suf;
  if (scene.textures.exists(cle)) return cle;
  const { L, H, poteaux: [pg, pd], linteau, toit: R } = PORCHE_VOLUME, sol = H - 1, haut = linteau + 7, x0 = pg + 5, x1 = pd - 4;
  // la place, au travers (une toile à part, posée derrière ; les passants vont et viennent entre les deux)
  const f = toileDecor(L, H); Object.assign(f.rampes, RAMPES_RUE); f.rampes.gres = rampe(0xb8a07a);
  peindrePlacePorche(f, x0, x1, haut, sol, jour, saison);
  f.texture(scene, 'placePorcheV_' + suf);
  const t = toileDecor(L, H); Object.assign(t.rampes, RAMPES_RUE); t.rampes.gres = rampe(0xb8a07a);
  const { D, enDessus } = dessus6b(t);
  // 1. les deux battants, ouverts vers la place : ils partent du gond et s'enfoncent (14 de large à l'écran, 54 de profondeur :
  //    40 rangs plus haut au bout), sans rapetisser ; le gauche tourne sa face vers la droite (dans l'ombre), le droit au soleil
  for (const [xg, sens, g, base] of [[x0, 1, 8201, 2], [x1 - 1, -1, 8202, 3]]) {
    const dx = 14, monte = 40, hb = 92;
    for (let u = 0; u <= dx; u++) {
      const x = xg + sens * u, yb = sol - 2 - Math.round(u / dx * monte), yt = yb - hb, joint = u > 0 && u % 3 === 0;
      for (let y = yt + 1; y <= yb; y++) {
        const e = yb - y; if (e === Math.round(hb * 0.18) || e === Math.round(hb * 0.8)) { t.poser(x, y, 'fer', 3); continue; }   // (les pentures)
        if (e === Math.round(hb * 0.18) - 1 || e === Math.round(hb * 0.8) - 1) { t.poser(x, y, 'fer', 1); continue; }
        t.poser(x, y, 'chene', joint ? 1 : u === dx ? 0 : base + (hachage(Math.floor(u / 3), Math.floor(y / 9), g) > 0.6 ? 1 : 0) - (u > dx * 0.6 ? 1 : 0));
      }
      enDessus(() => t.poser(x, yt, 'chene', 5));   // le chant du haut du battant, vu par le dessus
    }
  }
  // 2. les aisseliers, entre les poteaux et le linteau (leur arête du haut au soleil)
  for (const [xp, sens] of [[pg + 4, 1], [pd - 5, -1]]) for (let k = 0; k < 18; k++) for (let e = 0; e < 3; e++) t.poser(xp + sens * k, haut + 17 - k + e, 'chene', e === 0 ? 4 : 2);
  // 3. les poteaux, debout sur leurs socles de grès ; le socle : sa face de moellons, son dessus (3 rangs) et l'ombre du poteau
  for (const cx of [pg, pd]) {
    planche(t, cx - 4, haut, 9, sol - 8 - haut, 'chene', { horizontale: false, graine: 8203 + cx, noeuds: 1 });
    for (let y = haut; y < sol - 8; y++) { t.poser(cx - 4, y, 'chene', 5); t.poser(cx + 4, y, 'chene', 1); }
    moellons(t, cx - 7, sol - 6, 15, 7, 8204 + cx, 'gres', 7);
    enDessus(() => { for (let x = cx - 7; x <= cx + 7; x++) for (const [y, k] of [[sol - 9, 4], [sol - 8, 4], [sol - 7, 5]]) {
      if (x >= cx - 4 && x <= cx + 4 && y < sol - 8) continue;   // (le poteau est debout dessus)
      t.poser(x, y, 'gres', x > cx + 4 && x <= cx + 6 ? k - 2 : x === cx - 7 ? 5 : k); } });
  }
  // 4. la palissade, de part et d'autre : les pieux taillés en pointe (la facette gauche au soleil), les deux traverses (leur dessus)
  for (const [a, b] of [[0, pg - 7], [pd + 8, L]]) {
    for (let x = a; x < b; x++) {
      const p = (x - a) % 5, top = sol - 40 + Math.round(Math.abs(p - 2) * 1.2);
      for (let y = top + 2; y <= sol; y++) t.poser(x, y, 'chene', p === 4 ? 0 : p === 0 ? 4 : 2 + (hachage(Math.floor((x - a) / 5), y >> 3, 8205) > 0.7 ? 1 : 0));
      enDessus(() => { t.poser(x, top, 'chene', p <= 2 ? 5 : 3); t.poser(x, top + 1, 'chene', p <= 2 ? 4 : 2); });
    }
    for (const y of [sol - 30, sol - 10]) for (let x = a; x < b; x++) {
      enDessus(() => t.poser(x, y - 1, 'cheneSombre', 5)); t.poser(x, y, 'cheneSombre', 3); t.poser(x, y + 1, 'cheneSombre', 1); teinterV(t, x, y + 2, -1); }
  }
  // 5. le linteau ; ses abouts dépassent du toit : on en voit le dessus
  planche(t, 0, linteau, L, 7, 'chene', { graine: 8206, noeuds: 2 });
  for (let x = 0; x < L; x++) t.poser(x, linteau + 7, 'cheneSombre', 1);
  for (const [a, b] of [[0, R.xa - 1], [R.xb + 1, L - 1]]) enDessus(() => { for (let x = a; x <= b; x++) { t.poser(x, linteau - 3, 'chene', 4); t.poser(x, linteau - 2, 'chene', 4); t.poser(x, linteau - 1, 'chene', 5); } });
  // 6. le petit toit en croupe, de tuiles ; l'ombre de sa rive sur le linteau
  let toit; enDessus(() => { toit = toitCroupeHD(t, { xa: R.xa, xb: R.xb, yEgout: linteau - 3, montee: R.montee, prof: R.prof, mat: 'tuile', motif: 'tuile', g: 8207, bois: 'chene' }); });
  for (let x = R.xa; x <= R.xb; x++) for (let k = 0; k < 4; k++) if (t.mat(x, linteau + k) === 'chene') teinterV(t, x, linteau + k, k < 2 ? -2 : -1);
  // 7. les chaînes de l'écriteau (il pend sous le linteau ; son nom s'écrit par-dessus)
  for (const x of [68, 108]) for (let y = linteau + 8; y < linteau + 13; y++) t.poser(x, y, 'fer', y % 2 ? 4 : 2);
  t.contour(); t.texture(scene, cle);
  scene.textures.get(cle).toit89 = { haut: toit.yF - 2, bas: linteau - 1, chem: null, lucarne: null, nu: null };
  if (saison === 'givre') neigeDessus6b(scene, cle, t, D);
  return cle;
}
// L'ombre de l'arche : sous le toit, le seuil couvert (au fond de l'ouverture) ; devant, sur le seuil de dalles de la rue, la
// bande d'ombre du débord du toit (un peu décalée à droite : la lumière vient d'en haut à gauche), l'ombre des socles et le
// pied de la palissade. Une texture à poser par-dessus la place et ses passants, sous le porche (son rang sol = H - 1).
function ombrePorcheVolumeHD(scene) {
  const cle = 'ombrePorcheVolumeHD'; if (scene.textures.exists(cle)) return cle;
  const { L, H, poteaux: [pg, pd], toit: R, seuil } = PORCHE_VOLUME, sol = H - 1, Hs = H + seuil;
  const tex = scene.textures.createCanvas(cle, L, Hs), c = tex.getContext(), img = c.createImageData(L, Hs), q = img.data;
  const a = (x, y, v) => { if (x < 0 || y < 0 || x >= L || y >= Hs) return; const i = (y * L + x) * 4; q[i] = 14; q[i + 1] = 10; q[i + 2] = 22; q[i + 3] = Math.max(q[i + 3], Math.round(255 * v)); };
  const cover = Math.round(R.prof * VOLUME_HD.prof);   // (12 rangs : la profondeur couverte par le toit)
  for (let y = sol - cover; y <= sol; y++) for (let x = pg + 5; x < pd - 4; x++) { const v = (y - (sol - cover)) / cover; a(x, y, 0.16 + 0.22 * Math.min(1, v * 2.2)); }
  for (let k = 1; k <= 6; k++) for (let x = R.xa + 3; x <= R.xb + 3; x++) { const bord = Math.min(1, Math.min(x - R.xa - 3, R.xb + 3 - x) / 5); a(x, sol + k, (k < 5 ? 0.3 : 0.18) * bord); }
  for (const cx of [pg, pd]) for (let k = 1; k <= 5; k++) for (let x = cx - 7; x <= cx + 10; x++) a(x, sol + k, 0.42 - k * 0.05);
  for (const [g, d] of [[0, pg - 8], [pd + 8, L - 1]]) for (let k = 1; k <= 4; k++) for (let x = g; x <= d; x++) a(x + 1, sol + k, 0.34 - k * 0.07);
  for (const [xg, sens] of [[pg + 5, 1], [pd - 5, -1]]) for (let u = 0; u <= 14; u++) { const yb = sol - 2 - Math.round(u / 14 * 40); for (let k = 1; k <= 3; k++) a(xg + sens * u + k, yb + 1 - (sens < 0 ? 0 : 0), 0.3 - k * 0.07); }   // (l'ombre des battants, au pied)
  c.putImageData(img, 0, 0); tex.refresh(); return cle;
}

// ======================= 2. L'ATELIER DES MAGES-CHARPENTIERS =======================
// Le design de l'atelier (pattesHD.js : atelierMagesHD) : l'assise de pierre, l'enduit clair et les colombages sombres, les
// runes gravées sur la sablière, les grandes portes de grange ouvertes (dedans, la patte géante sur ses tréteaux, l'établi),
// les deux fenêtres éclairées, la cheminée de pierre, les ardoises bleu nuit, l'enseigne (un rabot et une baguette croisés).
// Dans la projection : un toit en croupe d'ardoises bleu nuit (38 de montée, 26 de profondeur), la cheminée debout sur le pan ;
// l'enseigne n'est plus peinte dans le pignon : c'est un panneau debout sur le pan avant, sur ses deux pieds de fer, son chant
// du haut vu par le dessus, son ombre sur les ardoises ; l'ombre de la rive sur le haut du mur ; les poutres, leur dessus
// éclairé et leur ombre sur l'enduit ; par les grandes portes, le plancher de l'atelier, vu par le dessus, qui s'enfonce
// dans l'ombre ; le dessus de l'établi ; les appuis des fenêtres, leurs vitres en retrait ; le dessus du soubassement, la
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
  // 3. les grandes portes de grange ouvertes : le noir de l'atelier ; son plancher vu par le dessus (16 rangs), plus clair vers
  //    la rue ; les deux vantaux rabattus contre le mur (leur chant du haut au soleil) ; la patte géante sur ses tréteaux, l'établi
  for (let y = 70 + O; y < 132 + O; y++) for (let x = 46; x < 110; x++) t.poser(x, y, 'cheneSombre', 0);
  for (let y = 116 + O; y < 132 + O; y++) { const v = (y - 116 - O) / 15; for (let x = 46; x < 110; x++) t.poser(x, y, 'chene', (x - 46) % 8 === 0 ? 0 : v > 0.7 ? 2 : v > 0.35 ? 1 : 0); }
  for (const [a, b] of [[34, 46], [110, 122]]) { for (let y = 70 + O; y < 132 + O; y++) for (let x = a; x < b; x++) t.poser(x, y, 'chene', (x - a) % 4 === 0 ? 1 : x === a + 1 ? 4 : 3);
    enDessus(() => { for (let x = a; x < b; x++) t.poser(x, 69 + O, 'chene', 5); }); }
  for (const [a, b] of [[56, 62], [94, 100]]) segmentHD(t, [a, 126 + O], [b, 126 + O], 1, 'cheneClair');
  segmentHD(t, [56, 126 + O], [58, 112 + O], 1, 'cheneClair'); segmentHD(t, [98, 126 + O], [96, 112 + O], 1, 'cheneClair');
  segmentHD(t, [60, 110 + O], [78, 98 + O], 4.5, 'cheneClair', { bandes: 6, mat2: 'fer' }); segmentHD(t, [78, 98 + O], [96, 110 + O], 3.5, 'cheneClair', { bandes: 6, mat2: 'fer' });
  disqueHD(t, 78, 98 + O, 4.5, 'laiton', 3); disqueHD(t, 78, 98 + O, 2, 'rune', 5);
  for (let x = 50; x < 66; x++) { t.poser(x, 115 + O, 'chene', 4); t.poser(x, 116 + O, 'chene', 5); for (let y = 117; y < 122; y++) t.poser(x, y + O, 'chene', y === 121 ? 1 : 2); }   // l'établi : son dessus, sa face
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
