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
const RELIEF_ESSAI = true;
function reliefActif() { return (typeof window !== 'undefined' && window.RELIEF_ESSAI !== undefined) ? !!window.RELIEF_ESSAI : RELIEF_ESSAI; }

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
