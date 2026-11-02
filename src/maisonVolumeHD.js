// (v1.65, la rue Soucolline, planche de concept « ville vue de haut ») UNE MAISON EN UN SEUL VOLUME, à la projection de
// Stardew Valley. (Planche de concept, puis étapes 2 et 3 : validé sur le barbier et la maison haute ; branché dans la rue
// Soucolline, quartierSoucolline.js : le barbier, la maison haute, la tente, la banque et toutes les maisons de ville, maison5.)
//
// LA PROJECTION (mesurée sur les références Stardew, voir la planche) : une vue de trois quarts par le dessus, SANS
// perspective (pas de point de fuite, rien ne converge) :
//   - tout ce qui est vertical (les murs, les portes, les personnages) : 1 pixel pour 1 pixel, de face ;
//   - tout ce qui est horizontal (le dessus des choses : les toits, les appuis, les marches, le sol) se voit par le dessus,
//     écrasé : 1 pixel de profondeur = 0,75 pixel de hauteur à l'écran (la caméra est à environ 37° au-dessus de l'horizon) ;
//   - un pan de toit, qui monte ET s'enfonce, mesure donc à l'écran : sa hauteur + 0,75 × sa profondeur. Ici le barbier :
//     46 de montée pour 24 de profondeur = 64 rangs à l'écran, pour 86 de façade (toit / façade = 0,74 ; Stardew : 0,6 à 1) ;
//   - le pan arrière, plus raide que le regard, est caché : on ne voit que le faîte (en vue zénithale, on le verrait : c'est
//     ce qui trahissait l'essai refusé) ;
//   - le toit est EN CROUPE, comme la ferme de Stardew : les deux petits pans de côté (une croupe éclairée à gauche, une
//     dans l'ombre à droite) donnent au pan avant sa forme de trapèze, pour une raison géométrique honnête (le faîte est
//     plus court que l'égout de 24 px de chaque côté), et non par convergence ;
//   - la façade reste frontale, mais on voit le DESSUS de tout ce qui dépasse : la planche de rive (chant éclairé,
//     sous-face sombre) et son ombre épaisse de 8 rangs sur le haut du mur ; le dessus de l'auvent (6 rangs, ses rayures) ;
//     le dessus de l'appui de la vitrine (2 rangs de pierre claire) ; le dessus de la marche (6 rangs) ; le dessus du
//     soubassement (2 rangs) ; les poutres horizontales par leur dessus clair ; les ouvertures en retrait (l'ombre du
//     linteau dedans, 3 rangs) ; au pied du mur, l'ombre de contact sur le trottoir ;
//   - une seule lumière, le ciel, du haut (un peu à gauche) : pas de murs de côté (on est en face).
// Le dessin de la façade est celui de la planche 72 (peindreBoutiqueBarbier, barbierHD.js) : même design, mêmes couleurs,
// mêmes enseignes ; seuls changent le toit et les dessus.

const VOLUME_HD = { prof: 0.75 };   // (1 pixel de profondeur = 0,75 pixel d'écran)

// Les repères du barbier en volume : la façade d'origine (124 × 112, le mur de y 26 à 98, l'assise de 98 à 112) est posée
// en (ox, oy) dans une toile plus grande ; le toit occupe le haut.
const BARBIER_VOLUME = { L: 136, H: 172, ox: 6, oy: 60, egout: 86, montee: 46, prof: 24, debord: 8 };

function teinterV(t, x, y, d) { const m = t.mat(x, y); if (!m) return; t.poser(x, y, m, Math.max(0, Math.min(5, t.teinte(x, y) + d))); }

// Un toit en croupe vu de trois quarts par le dessus. xa..xb : l'égout (déjà avec le débord) ; yEgout : la rangée du haut
// de la planche de rive ; montee, prof : le pan avant ; la croupe recule d'autant qu'elle est profonde (45° en plan).
function toitCroupeHD(t, { xa, xb, yEgout, montee, prof, mat = 'ardoise', g = 7331, bois = 'chene', motif = 'ardoise' }) {
  const P = montee + Math.round(prof * VOLUME_HD.prof), yBas = yEgout - 1, yF = yBas - P + 1;   // le pan avant : de yF à yBas
  const recul = prof;                                        // la croupe à 45° : le faîte rentre de prof de chaque côté
  const hCote = Math.round(2 * prof * VOLUME_HD.prof);       // la hauteur à l'écran du bord de côté (toute la profondeur)
  const xl = y => xa + (yBas - y) / P * recul, xr = y => xb - (yBas - y) / P * recul;
  const yDos = x => (yBas - hCote) - Math.min(x - xa, xb - x) * (P - hCote) / recul;   // le bord arrière des croupes
  const slate = (x, y, base) => { const r = Math.floor((yBas - y) / 4), ty = (yBas - y) % 4, dec = (r % 2) * 5, b = Math.floor((x + dec) / 10);
    if (ty === 0) return base - 2;                                                  // le bas de chaque ardoise, dans l'ombre de la suivante
    if ((x + dec) % 10 === 0) return base - 2;                                     // le joint vertical
    const h = hachage(b, r, g); return base + (h > 0.86 ? 1 : h < 0.1 ? -1 : 0) + (ty === 3 ? 0 : 0); };
  // (étape 3) la tuile : des rangs de 4, des tuiles de 6, le bas arrondi (on voit le creux entre deux) ; le chaume : des
  // bandes de 7 rangs de roseaux, leurs liens, deux paille ; l'ardoise : celle du barbier (validée)
  const tuile = (x, y, base) => { const r = Math.floor((yBas - y) / 4), tyH = 3 - (yBas - y) % 4, dec = (r % 2) * 3, tx = ((x + dec) % 6 + 6) % 6, h = hachage(Math.floor((x + dec) / 6), r, g);
    if (tyH === 3 && (tx === 0 || tx === 5)) return base - 2; let k = base + (h > 0.86 ? 1 : h < 0.12 ? -1 : 0); if (tyH === 0) k++; else if (tyH === 3) k--; if (tx === 0 && tyH < 3) k++; else if (tx === 5) k--; return k; };
  const chaume = (x, y, base) => { const bande = Math.floor((yBas - y) / 7), bd = (yBas - y) % 7, sens = fbm(x * 0.9, y * 0.12, g), brin = hachage(x, 3, g) * 0.96;
    let k = base + (sens > 0.58 ? 1 : sens < 0.38 ? -1 : 0) + (brin > 0.9 ? 1 : 0) + (bd === 6 ? 1 : 0) - (bd === 0 ? 1 : 0); if (bd === 3 && (x + bande) % 3 === 0) k--; return k; };
  const matDe = (x, y) => motif === 'chaume' ? (hachage(Math.floor((yBas - y) / 7), x >> 3, g + 1) > 0.5 ? 'chaumeA' : 'chaumeB') : mat;
  const motifDe = motif === 'tuile' ? tuile : motif === 'chaume' ? chaume : slate, mat0 = motif === 'chaume' ? 'chaumeA' : mat, mat1 = motif === 'chaume' ? 'chaumeB' : mat;
  const pose = (x, y, base) => t.poser(x, y, matDe(x, y), motifDe(x, y, base));
  for (let y = yF; y <= yBas; y++) {
    const v = (yBas - y) / P, l = xl(y), r = xr(y), haut = v > 0.62 ? 1 : 0;
    for (let x = xa; x <= xb; x++) {
      if (x >= l && x <= r) pose(x, y, 3 + haut);                                         // le pan avant, plus clair vers le faîte (le ciel)
      else if (y > yDos(x)) pose(x, y, x < l ? 4 : 2);                                    // la croupe gauche au soleil, la droite dans l'ombre
    }
    t.poser(Math.round(l), y, mat0, 5); t.poser(Math.round(r), y, mat1, 0);             // les arêtiers : l'un accroche la lumière, l'autre l'ombre
  }
  if (motif === 'chaume') for (let x = Math.round(xl(yF)) - 2; x <= Math.round(xr(yF)) + 2; x++) for (let k = 1; k <= 4; k++) t.poser(x, yF - k, 'chaumeA', k === 4 ? 5 : k === 1 ? 2 : 3 + ((x + k) % 4 === 0 ? -1 : 0));   // le faîtage : un boudin de chaume
  else for (let x = Math.round(xl(yF)); x <= Math.round(xr(yF)); x++) { t.poser(x, yF - 1, mat, 5); t.poser(x, yF - 2, mat, x % 6 === 5 ? 2 : 4); }   // le faîte et ses faîtières
  if (motif === 'chaume') {   // le chaume n'a pas de planche de rive : son bord épais, une frange irrégulière
    for (let y = yBas - hCote; y <= yBas; y++) { t.poser(xa, y, 'chaumeA', 4); t.poser(xb, y, 'chaumeB', 1); }
    for (let x = xa; x <= xb; x++) { const fr = Math.floor(hachage(x, 1, g) * 3); t.poser(x, yEgout, 'chaumeA', 4); t.poser(x, yEgout + 1, 'chaumeB', 2); for (let k = 0; k <= fr; k++) t.poser(x, yEgout + 2 + k, 'chaumeB', 1); }
  } else {
    for (let y = yBas - hCote; y <= yBas; y++) { t.poser(xa, y, bois, 4); t.poser(xb, y, 'cheneSombre', 1); }   // le chant des rives de côté
    for (let x = xa; x <= xb; x++) { t.poser(x, yEgout, bois, 5); t.poser(x, yEgout + 1, bois, 3); t.poser(x, yEgout + 2, 'cheneSombre', 1); }   // la planche de rive : dessus, chant, sous-face
  }
  return { yF, yBas, surface: d => yBas - d * (montee / prof + VOLUME_HD.prof) };   // surface(d) : la rangée du pan à la profondeur d
}
// Une cheminée de brique debout sur le pan : sa face avant (1:1), son dessus (écrasé), son ombre sur les ardoises
function chemineeVolumeHD(t, toit, x0, larg, d, haut, mat = 'brique2') {
  const yPied = Math.round(toit.surface(d)), yHaut = yPied - haut, prof = Math.round(8 * VOLUME_HD.prof);
  for (let y = yHaut; y <= yPied; y++) for (let x = x0; x < x0 + larg; x++) t.poser(x, y, mat, x === x0 ? 4 : x === x0 + larg - 1 ? 1 : (y - yHaut) % 4 === 3 ? 2 : 3 + (hachage(x >> 1, y >> 2, 7340) > 0.8 ? 1 : 0));
  for (let y = yHaut - prof; y < yHaut; y++) for (let x = x0; x < x0 + larg; x++) t.poser(x, y, mat, y === yHaut - prof ? 5 : 4);   // le dessus
  for (let y = yHaut - prof + 1; y < yHaut - 1; y++) for (let x = x0 + 2; x < x0 + larg - 2; x++) t.poser(x, y, 'fer', 0);          // le conduit, noir
  for (let k = 1; k <= 3; k++) for (let y = yHaut + 4; y <= yPied + 2 * k; y++) teinterV(t, x0 + larg - 1 + k, y, -2);                 // son ombre, à droite, sur le pan
  for (let y = yPied + 1; y <= yPied + 2; y++) for (let x = x0 + 1; x < x0 + larg + 2; x++) teinterV(t, x, y, -1);                    // et à son pied
  return { cx: x0 + Math.floor(larg / 2), haut: yHaut - prof, h: yPied - yHaut + prof + 1, l: larg, x0 };
}
// Ce que la rue lit sur une texture en volume : la fumée (tex.cheminee), la neige du Givre (tex.toit89 : du faîte à la rive,
// la cheminée et ce qui n'est pas du toit restent nus)
function noterVolumeHD(s, cle, toit, yEgout, ch, nu = null) {
  const tex = s.textures.get(cle); tex.cheminee = ch ? [ch.cx, ch.haut - 2] : null;
  tex.toit89 = { haut: toit.yF - 2, bas: yEgout + 2, chem: ch ? { cx: ch.cx, haut: ch.haut, h: ch.h } : null, lucarne: null, nu };
}

// Le Fil d'Argent en un seul volume : la façade de la planche 72, redessinée avec ses dessus, sous son toit en croupe
function barbierVolumeHD(scene) {
  const cle = 'boutiqueBarbierVolumeHD'; if (scene.textures.exists(cle)) return cle;
  const R = BARBIER_VOLUME, { L, H, ox, oy } = R, t = toileDecor(L, H); rampesBarbier(t);
  for (const [m, c] of [['brique2', 0x9a4a34]]) if (!t.rampes[m]) t.rampes[m] = rampe(c);
  // 1. la façade d'origine (sans son petit toit de 22 rangs), posée dans la grande toile
  const src = peindreBoutiqueBarbier();
  for (let y = 26; y < src.h; y++) for (let x = 0; x < src.l; x++) { const m = src.mat(x, y); if (m) t.poser(x + ox, y + oy, m, src.teinte(x, y)); }
  const mur = m => m === 'platre', bois = m => m === 'cheneSombre' || m === 'chene';
  // 2. les poutres : le dessus des horizontales éclairé, les verticales éclairées à gauche, et leur petite ombre sur l'enduit
  for (const x of [6, 60, src.l - 10]) for (let y = 26; y < 98; y++) { t.poser(x + ox, y + oy, 'cheneSombre', 4); t.poser(x + 3 + ox, y + oy, 'cheneSombre', 1); if (mur(t.mat(x + 4 + ox, y + oy))) teinterV(t, x + 4 + ox, y + oy, -1); }
  for (let x = 6; x < src.l - 6; x++) { t.poser(x + ox, 50 + oy, 'cheneSombre', 5); t.poser(x + ox, 53 + oy, 'cheneSombre', 1); if (mur(t.mat(x + ox, 54 + oy))) teinterV(t, x + ox, 54 + oy, -1); }
  // 3. le toit en croupe, et l'ombre épaisse de sa rive sur le haut du mur
  const yE = R.egout, xa = 6 - R.debord + ox, xb = src.l - 7 + R.debord + ox;
  const toit = toitCroupeHD(t, { xa, xb, yEgout: yE, montee: R.montee, prof: R.prof });
  for (let k = 3; k < 11; k++) for (let x = xa; x <= xb; x++) if (mur(t.mat(x, yE + k)) || bois(t.mat(x, yE + k))) teinterV(t, x, yE + k, k < 8 ? -2 : -1);
  const ch = chemineeVolumeHD(t, toit, 98 + ox, 12, 12, 30);
  // 4. l'auvent vu par le dessus : ses rayures sur 6 rangs, son bord roulé, la frange qui pend, son ombre sur la vitrine
  for (let y = 54; y < 64; y++) for (let x = 12; x < 58; x++) {
    const bande = Math.floor(x / 5) % 2 ? 'blanc' : 'vert';
    if (y < 60) t.poser(x + ox, y + oy, bande, 4);                                                    // le dessus, au soleil
    else if (y === 60) t.poser(x + ox, y + oy, bande, 2);                                             // le bord roulé
    else if (Math.abs((x % 5) - 2.5) <= (64 - y) * 1.5) t.poser(x + ox, y + oy, bande, 3);            // la frange, en festons
  }
  for (let y = 64; y < 68; y++) for (let x = 13; x < 57; x++) teinterV(t, x + ox, y + oy, y < 67 ? -2 : -1);
  // 5. l'appui de la vitrine en pierre : son dessus clair sur 2 rangs, son chant, son ombre
  for (let x = 12; x < 58; x++) { t.poser(x + ox, 90 + oy, 'pierre', 5); t.poser(x + ox, 91 + oy, 'pierre', 4); t.poser(x + ox, 92 + oy, 'pierre', 2); teinterV(t, x + ox, 93 + oy, -2); }
  // 6. la porte, en retrait : l'ombre du linteau dedans (elle suit l'arc), le jambage gauche ; elle descend jusqu'à la marche
  const dansPorte = (x, y) => { const dx = (x + 0.5 - 88) / 16, dy = (y + 0.5 - 74) / 16; return x >= 72 && x < 104 && y >= 58 && y < 100 && (y >= 74 || dx * dx + dy * dy <= 1); };
  for (let x = 72; x < 104; x++) for (let y = 98; y < 100; y++) t.poser(x + ox, y + oy, 'chene', (x - 72) % 8 === 0 ? 1 : 3);
  for (let x = 72; x < 104; x++) { let yt = 58; while (yt < 100 && !dansPorte(x, yt)) yt++; for (let k = 0; k < 4; k++) if (dansPorte(x, yt + k) && t.mat(x + ox, yt + k + oy) !== 'fer') teinterV(t, x + ox, yt + k + oy, k < 3 ? -2 : -1); }
  for (let y = 58; y < 100; y++) for (const x of [72, 73]) if (dansPorte(x, y) && t.mat(x + ox, y + oy) !== 'fer') teinterV(t, x + ox, y + oy, -1);
  // 7. le soubassement : son dessus clair sur 2 rangs ; la marche devant la porte, vue par le dessus (6 rangs), puis son chant
  for (let x = 4; x < src.l - 4; x++) { t.poser(x + ox, 98 + oy, 'pierre', 5); if (t.mat(x + ox, 99 + oy) === 'pierre') t.poser(x + ox, 99 + oy, 'pierre', 4); }
  for (let y = 100; y < 112; y++) for (let x = 70; x < 106; x++) t.poser(x + ox, y + oy, 'pierre', y < 105 ? 4 : y === 105 ? 5 : y === 111 ? 1 : 2);
  // 8. les bords du mur tournent (une bande fine), et le pied du mur touche le trottoir
  for (let y = yE + 3; y < H; y++) { teinterV(t, 4 + ox, y, -1); teinterV(t, src.l - 5 + ox, y, -1); teinterV(t, src.l - 6 + ox, y, -1); }
  for (let x = 0; x < L; x++) { teinterV(t, x, H - 1, -2); teinterV(t, x, H - 2, -1); }
  t.contour(); t.texture(scene, cle); pierresRondesTexture(scene, cle, [{ r: [4 + ox, 100 + oy, 119 + ox, H - 3], regulier: true, graine: 7203, sauf: [[69 + ox, 95 + oy, 107 + ox, H]] }]); noterVolumeHD(scene, cle, toit, yE, ch); return cle;
}
// L'ombre de contact d'une maison sur le trottoir : une bande qui s'estompe en descendant (à poser au pied, en (x, yBase))
function ombreContactMaisonHD(scene, larg, h = 7) {
  const cle = 'ombreContactMaison' + larg + '_' + h; if (scene.textures.exists(cle)) return cle;
  const tex = scene.textures.createCanvas(cle, larg, h), c = tex.getContext(), img = c.createImageData(larg, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < larg; x++) { const u = 1 - y / h, b = Math.min(1, Math.min(x, larg - 1 - x) / 6); const i = (y * larg + x) * 4; img.data[i] = 12; img.data[i + 1] = 10; img.data[i + 2] = 20; img.data[i + 3] = Math.round(120 * u * u * b); }
  c.putImageData(img, 0, 0); tex.refresh(); return cle;
}
// L'ombre en ellipse d'un personnage (ses pieds au centre du bord bas)
function ombreEllipseHD(scene, l = 34, h = 11) {
  const cle = 'ombreEllipse' + l + '_' + h; if (scene.textures.exists(cle)) return cle;
  const tex = scene.textures.createCanvas(cle, l, h), c = tex.getContext(), img = c.createImageData(l, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < l; x++) { const dx = (x + 0.5 - l / 2) / (l / 2), dy = (y + 0.5 - h / 2) / (h / 2), d = dx * dx + dy * dy; const i = (y * l + x) * 4; img.data[i] = 12; img.data[i + 1] = 10; img.data[i + 2] = 20; img.data[i + 3] = d > 1 ? 0 : Math.round(110 * (1 - d * 0.55)); }
  c.putImageData(img, 0, 0); tex.refresh(); return cle;
}

// ======================= ÉTAPE 2 : la maison haute, la banque, la tente d'Ysmée, à la même projection =======================
// (Le barbier et sa projection sont validés ; « chaque autre bâtiment doit être fait et validé dans cette projection ».)

// L'intérieur d'une ouverture en retrait : l'ombre du linteau sur les premiers rangs, le jambage gauche un ton plus sombre
function retraitHD(t, x0, y0, x1, y1, dedans, rangs = 3) {
  for (let x = x0; x <= x1; x++) { let yt = y0; while (yt <= y1 && !dedans(x, yt)) yt++; for (let k = 0; k <= rangs; k++) if (dedans(x, yt + k)) teinterV(t, x, yt + k, k < rangs ? -2 : -1); }
  for (let y = y0; y <= y1; y++) for (const x of [x0, x0 + 1]) if (dedans(x, y)) teinterV(t, x, y, -1);
}
// Un appui de pierre vu par le dessus : 2 rangs clairs, son chant, son ombre sur le mur
function appuiHD(t, x0, x1, y, mat = 'taille') { for (let x = x0; x <= x1; x++) { t.poser(x, y, mat, 5); t.poser(x, y + 1, mat, 4); t.poser(x, y + 2, mat, 2); teinterV(t, x, y + 3, -2); } }
// Une marche (ou un perron) vue par le dessus : son dessus (prof rangs, le bord avant plus clair), puis son chant
function marcheHD(t, x0, x1, y, prof, chant, mat = 'taille') {
  for (let x = x0; x <= x1; x++) { for (let k = 0; k < prof; k++) t.poser(x, y + k, mat, k === prof - 1 ? 5 : 4); for (let k = 0; k < chant; k++) t.poser(x, y + prof + k, mat, k === chant - 1 ? 1 : 2); }
}
// L'ombre de la planche de rive sur le haut du mur (8 rangs, deux tons), et les bords du mur qui tournent
function ombreRiveHD(t, xa, xb, yE, mur) { for (let k = 3; k < 11; k++) for (let x = xa; x <= xb; x++) if (mur(t.mat(x, yE + k))) teinterV(t, x, yE + k, k < 8 ? -2 : -1); }
function bordsMurHD(t, xa, xb, y0, y1) { for (let y = y0; y <= y1; y++) { teinterV(t, xa, y, -1); teinterV(t, xb, y, -1); teinterV(t, xb - 1, y, -1); } }

// --- 1. La maison haute à colombages (mvB89 : rez-de-chaussée de pierre de taille, deux étages, porte verte, volets rouges,
//     fleurs roses), la même façade que maison5 (villeDecorHD.js), avec ses dessus, sous un toit d'ardoises en croupe ---
const MAISON_HAUTE_VOLUME = { L: 140, rdc: 68, etages: [48, 46], montee: 70, prof: 30, debord: 8, ox: 8, M: 126 };
function maisonHauteVolumeHD(s) {
  const cle = 'maisonHauteVolumeHD'; if (s.textures.exists(cle)) return cle;
  const R = MAISON_HAUTE_VOLUME, { L, rdc, etages, ox, M } = R, graine = 5, bois = 'cheneSombre', volet = 'voletR', fleur = 'fleurP2';
  const hF = etages[0] + etages[1] + rdc, H = M + hF + 5, W = L + 2 * ox, t = toileM5(W, H), bas = H - 5, yR = bas - rdc, x0 = 4 + ox, x1 = L - 4 + ox;
  // le rez-de-chaussée : pierre de taille, le soubassement (son dessus clair)
  murPierre5(t, x0, yR, x1 - x0, rdc, { g: graine + 1 });
  for (let x = x0; x < x1; x++) for (let k = 0; k < 4; k++) t.poser(x, bas - k, 'taille3', k === 0 ? 1 : k === 1 ? 2 : k === 3 ? 5 : 3 + (hachage(x >> 3, 1, graine) > 0.6 ? 1 : 0));
  // la porte verte (relevée de 4 : ses deux marches vues par le dessus descendent jusqu'au trottoir)
  const pl = 24, ph = 50, px = Math.round(L * 0.5 - pl / 2) + ox, py = bas - ph - 4;
  porte5(t, px, py, pl, ph, { peinte: 'porteVerte', g: graine + 3, marches: false });
  retraitHD(t, px, py, px + pl - 1, py + ph - 1, (x, y) => { const m = t.mat(x, y); return x >= px && x < px + pl && y >= py && y < py + ph && m !== 'taille' && m !== 'fer' && m !== 'laiton'; }, 5);
  marcheHD(t, px - 5, px + pl + 4, bas - 4, 3, 1); marcheHD(t, px - 7, px + pl + 6, bas, 3, 2);
  for (const fx of [0.2, 0.8]) { const wx = Math.round(L * fx - 8) + ox, wy = yR + 18; fenetre5(t, wx, wy, 16, 22, { volet, g: graine + 5 });
    retraitHD(t, wx + 1, wy + 1, wx + 14, wy + 20, (x, y) => t.mat(x, y) === 'vitreJ', 5); }
  // les étages : encorbellement, enduit ocre, colombages, fenêtres (appuis vus par le dessus, linteaux en retrait), jardinières
  let y = yR; const fenetres = [[0.2, 0.8], [0.2, 0.5, 0.8]];
  etages.forEach((h, i) => {
    const yE = y - h; enduit5(t, ox, yE, L, h, 'enduitO', graine + 10 + i);
    const trous = fenetres[i].map(fx => [Math.round(L * fx - 8) + ox, yE + 13, 16, 24]);
    colombages5(t, ox, yE, L, h, { bois, trous, g: graine + 20 + i });
    for (const [fx, fy] of trous) {
      for (let yy = fy + 25; yy < fy + 28; yy++) for (let xx = fx - 2; xx < fx + 19; xx++) t.poser(xx, yy, 'terreCuite', 3);   // la terre de la jardinière, vue par le dessus (sous les fleurs)
      fenetre5(t, fx, fy, 16, 24, { volet, rideau: hachage(fx - ox, i, graine) > 0.5, g: graine + fx - ox, pierre: false });
      appuiHD(t, fx - 2, fx + 17, fy + 24);
      retraitHD(t, fx + 1, fy + 1, fx + 14, fy + 22, (x, y) => t.mat(x, y) === 'vitreJ' || t.mat(x, y) === 'cuirRouge');
      jardiniere5(t, fx - 3, fy + 29, 22, fleur, graine + fx - ox);
    }
    if (i === 0) for (let cx = 7 + ox; cx < L - 8 + ox; cx += 17) for (let k = 0; k < 6; k++) for (let j = 0; j <= 5 - k; j++) t.poser(cx + j, y + k, bois, k === 0 ? 5 : j === 0 ? 3 : 1);   // les corbeaux, leur dessus clair
    for (let x = ox; x < L + ox; x++) for (let k = 4; k < 8; k++) if (t.mat(x, yE + k) === 'platre') t.poser(x, yE + k, 'platre', t.teinte(x, yE + k) - (k < 6 ? 2 : 1));
    y = yE;
  });
  // le toit en croupe, sa rive, son ombre ; la descente de gouttière ; la cheminée debout sur le pan
  const yT = y, xa = ox - R.debord + 2, xb = L + ox + R.debord - 3;
  const toit = toitCroupeHD(t, { xa, xb, yEgout: yT, montee: R.montee, prof: R.prof, mat: 'ardoiseToit', g: graine + 31 });
  ombreRiveHD(t, xa, xb, yT, m => m === 'platre' || m === 'cheneSombre');
  gouttiere5(t, 0, 0, yT + 3, 3 + ox, bas);
  const ch = chemineeVolumeHD(t, toit, Math.round(L * 0.72) - 7 + ox, 14, 14, 34, 'brique2');
  bordsMurHD(t, ox, L + ox - 1, yT + 3, H - 1);
  for (let x = 0; x < W; x++) { teinterV(t, x, H - 1, -2); teinterV(t, x, H - 2, -1); }
  t.contour(); t.texture(s, cle);
  pierresRondesTexture(s, cle, [{ r: [x0 + 9, yR, x1 - 10, bas - 4], sousFace: 7, graine: 582, sauf: [...[0.2, 0.8].map(fx => { const wx = Math.round(L * fx - 8) + ox, wy = yR + 18; return [wx - 5, wy - 6, wx + 20, wy + 27]; }), [px - 6, py - 7, px + pl + 5, bas + 4]] }]);   // (Q268) la pierre du bas, à la Stardew
  noterVolumeHD(s, cle, toit, yT, ch); s.textures.get(cle).info89 = { L: W, H, yR, yT, bas };
  return cle;
}

// --- 2. La Banque Centrale Goyenne : le fronton gardé, un toit d'ardoises en croupe derrière ; la corniche vue par le dessus,
//     les chapiteaux et les bases des colonnes, les appuis des fenêtres, la porte en retrait, le perron à trois marches.
//     (étape 3, « les côtés trop dénudés sous l'envergure du toit ») la façade occupe toute la largeur sous le toit : le mur de
//     pierre va d'un bout à l'autre du fronton (de 4 à 196, au lieu de 10 à 190), deux pilastres d'angle le bordent (plats,
//     un chapiteau et une base, le gauche au soleil, le droit dans l'ombre) ; le toit ne déborde plus que de 6 de chaque côté
//     du mur, comme celui de la maison haute ---
const BANQUE_VOLUME = { L: 200, H: 176, ox: 4, oy: 80, montee: 48, prof: 40, debord: 4 };
function banqueVolumeHD(s) {
  const cle = 'banqueVolumeHD'; if (s.textures.exists(cle)) return cle;
  const R = BANQUE_VOLUME, { L, ox, oy } = R, H = R.H, W = L + 2 * ox, T = H + oy, t = toileDecor(W, T); Object.assign(t.rampes, RAMPES_RUE);
  for (const [m, c] of [['brique2', 0x9a4a34], ['ardoiseToit', 0x2e3842]]) if (!t.rampes[m]) t.rampes[m] = typeof RAMPES_V2 !== 'undefined' && RAMPES_V2[m] ? RAMPES_V2[m] : rampe(c);
  const xm0 = 4 + ox, xm1 = L - 5 + ox;   // le mur, d'un bout à l'autre du fronton
  // le toit, derrière : son égout est la corniche
  const yC = 50 + oy, xa = 2 - R.debord + ox, xb = L - 3 + R.debord + ox;
  const toit = toitCroupeHD(t, { xa, xb, yEgout: yC, montee: R.montee, prof: R.prof, mat: 'ardoiseToit', g: 852, bois: 'taille' });
  const ch = chemineeVolumeHD(t, toit, 166 + ox, 14, 16, 30, 'brique2');
  // le mur de pierre, le fronton et son ombre sur le toit, la corniche (dessus, chant, sous-face) et son ombre
  moellons(t, xm0, yC, xm1 - xm0 + 1, H - 50, 850, 'taille', 16);
  for (let y = 18; y < 50; y++) { const v = (y - 18) / 32, fa = Math.round(100 - v * 96), fb = Math.round(100 + v * 96); for (let x = fa; x <= fb; x++) t.poser(x + ox, y + oy, 'taille', x < fa + 2 ? 5 : y > 46 ? 1 : 3);
    for (let k = 1; k <= 3; k++) teinterV(t, fb + k + ox, y + oy, -2); }
  for (let x = 0; x < L; x++) { t.poser(x + ox, 49 + oy, 'taille', 4); t.poser(x + ox, 50 + oy, 'taille', 5); t.poser(x + ox, 51 + oy, 'taille', 2); t.poser(x + ox, 52 + oy, 'taille', 1); }
  ombreRiveHD(t, xm0, xm1, yC, m => m === 'taille');
  ornementsBanqueHD(t, ox, oy);
  // les pilastres d'angle : plats (pas de cannelures), 11 de large, leur chapiteau et leur base vus par le dessus
  for (const [p0, sol] of [[xm0, true], [xm1 - 10, false]]) {
    for (let y = 56 + oy; y < T - 12; y++) for (let x = p0; x <= p0 + 10; x++) t.poser(x, y, 'taille', x === p0 ? (sol ? 5 : 3) : x === p0 + 10 ? (sol ? 2 : 1) : sol ? 4 : 3);
    for (let x = p0 - 1; x <= p0 + 11; x++) { t.poser(x, 53 + oy, 'taille', 4); t.poser(x, 54 + oy, 'taille', 5); t.poser(x, 55 + oy, 'taille', 2); t.poser(x, 56 + oy, 'taille', 1); }
    for (let x = p0 - 1; x <= p0 + 11; x++) { t.poser(x, T - 16, 'taille', 5); t.poser(x, T - 15, 'taille', 4); t.poser(x, T - 14, 'taille', 3); t.poser(x, T - 13, 'taille', 2); }
    if (sol) for (let y = 57 + oy; y < T - 16; y++) teinterV(t, p0 + 11, y, -1);   // (l'ombre fine du pilastre gauche sur le mur)
  }
  // les colonnes cannelées : chapiteau (dessus sur 2 rangs) et base (dessus) ; elles descendent jusqu'au perron
  for (const cx of [52 + ox, 148 + ox]) {
    for (let y = 56 + oy; y < T - 12; y++) for (let x = cx - 7; x <= cx + 7; x++) t.poser(x, y, 'taille', (x - cx + 7) % 4 === 0 ? 2 : x < cx - 3 ? 5 : x > cx + 3 ? 2 : 4);
    for (let x = cx - 10; x <= cx + 10; x++) { t.poser(x, 53 + oy, 'taille', 4); t.poser(x, 54 + oy, 'taille', 5); t.poser(x, 55 + oy, 'taille', 2); t.poser(x, 56 + oy, 'taille', 1); }
    for (let x = cx - 10; x <= cx + 10; x++) { t.poser(x, T - 16, 'taille', 5); t.poser(x, T - 15, 'taille', 4); t.poser(x, T - 14, 'taille', 3); t.poser(x, T - 13, 'taille', 2); }
    for (let x = cx + 8; x <= cx + 10; x++) for (let y = 57 + oy; y < T - 16; y++) teinterV(t, x, y, -1);   // l'ombre de la colonne sur le mur
  }
  // les hautes fenêtres grillagées (appui de pierre vu par le dessus, linteau en retrait), la porte cloutée d'or en retrait
  for (const fx of [20 + ox, 162 + ox]) { fenetreRue(t, fx, 70 + oy, 18, 46, true, false); for (let y = 70 + oy; y < 116 + oy; y += 6) for (let x = fx; x < fx + 18; x++) t.poser(x, y, 'fer', 2);
    appuiHD(t, fx - 2, fx + 19, 116 + oy); retraitHD(t, fx + 1, 71 + oy, fx + 16, 114 + oy, (x, y) => t.mat(x, y) === 'vitre'); }
  const px = 80 + ox, py = T - 12 - 52;
  porteRue(t, px, py, 40, 52, { arc: true, mat: 'cheneSombre', graine: 851 });
  for (let y = py + 12; y < T - 14; y += 7) for (const x of [4, 16, 23, 35]) t.poser(px + x, y, 'or', 5);
  retraitHD(t, px, py, px + 39, T - 13, (x, y) => { const m = t.mat(x, y); return x >= px && x < px + 40 && y >= py && y < T - 12 && (m === 'cheneSombre' || m === 'fer'); });
  // le perron : trois marches vues par le dessus (3 rangs de dessus, 1 de chant chacune)
  for (let k = 0; k < 3; k++) marcheHD(t, 64 - k * 6 + ox, 135 + k * 6 + ox, T - 12 + k * 4, 3, 1);
  bordsMurHD(t, xm0, xm1, yC + 3, T - 1);
  for (let x = 0; x < W; x++) { teinterV(t, x, T - 1, -2); teinterV(t, x, T - 2, -1); }
  t.contour(); t.texture(s, cle);
  pierresRondesTexture(s, cle, [{ r: [xm0 + 12, yC + 7, xm1 - 12, T - 17], regulier: true, graine: 853, sauf: [...[52 + ox, 148 + ox].map(cx => [cx - 11, yC, cx + 11, T]), ...[20 + ox, 162 + ox].map(fx => [fx - 3, 68 + oy, fx + 20, 121 + oy]), [80 + ox - 2, T - 66, 80 + ox + 41, T]] }]);   // (Q268) la pierre de taille
  noterVolumeHD(s, cle, toit, yC, ch, (x, y) => y >= 18 + oy && Math.abs(x - 100 - ox) <= (y - 18 - oy) * 3 + 2);   // (la neige : le toit, pas le fronton)
  return cle;
}

// (étape 4, Q248) les ornements qui encadrent l'écriture et le médaillon : des denticules le long des rampants du fronton ;
// de part et d'autre du médaillon (le logo, posé par la rue en 85..115 × 20..44), deux rinceaux d'or, une tige qui s'enroule
// en volute et ses feuilles ; sous lui, un cartouche de pierre moulurée (la moulure claire en haut, sombre en bas, un filet
// d'or au-dedans, deux oreilles enroulées aux bouts), où se lit « BANQUE CENTRALE GOYENNE » (posée par la rue, rangs 45 à 52)
function ornementsBanqueHD(t, ox, oy) {
  const P = (x, y, m, k) => t.poser(Math.round(x) + ox, Math.round(y) + oy, m, k);
  for (let y = 22; y < 48; y += 3) { const v = (y - 18) / 32, fa = Math.round(100 - v * 96), fb = Math.round(100 + v * 96); P(fa + 4, y, 'taille', 1); P(fa + 4, y + 1, 'taille', 5); P(fb - 4, y, 'taille', 1); P(fb - 4, y + 1, 'taille', 4); }   // les denticules
  for (const sg of [-1, 1]) {   // les rinceaux, en miroir
    const tige = []; for (let k = 0; k <= 40; k++) { const u = k / 40; tige.push([100 + sg * (17 + 30 * u), 42 - 5 * Math.sin(Math.PI * u) - 2 * u]); }
    for (let k = 0; k <= 60; k++) { const a = k / 60 * Math.PI * 3.2, r = 5.5 * (1 - k / 72); tige.push([100 + sg * (47 + 1 - Math.cos(a) * r), 36 - Math.sin(a) * r * 0.9]); }   // la volute
    for (const [x, y] of tige) { P(x, y, 'or', 4); P(x, y + 1, 'or', 2); }
    for (let k = 4; k < 36; k += 7) { const [x, y] = tige[k]; for (const [dx, dy, kk] of [[0, -1, 5], [sg, -2, 4], [-sg, -2, 3], [0, -3, 4], [sg * 2, 2, 3], [sg * 3, 2, 2]]) P(x + dx, y + dy, 'or', kk); }   // les feuilles
  }
  const x0 = 50, x1 = 150, y0 = 44, y1 = 53;   // le cartouche
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const bord = y === y0 || y === y1 || x === x0 || x === x1, filet = (y === y0 + 2 || y === y1 - 2) && x > x0 + 2 && x < x1 - 2 || (x === x0 + 2 || x === x1 - 2) && y > y0 + 1 && y < y1 - 1;
    P(x, y, filet ? 'or' : 'taille', bord ? (y === y0 || x === x0 ? 5 : 1) : filet ? 4 : 2); }
  for (const sg of [-1, 1]) { const cx = sg < 0 ? x0 - 3 : x1 + 3; for (let a = 0; a < 40; a++) { const th = a / 40 * Math.PI * 2.6, r = 3.6 * (1 - a / 52); P(cx - sg * Math.cos(th) * r, 48.5 + Math.sin(th) * r, 'or', 4 - (a % 5 === 0 ? 1 : 0)); } P(cx, 48, 'or', 5); }   // les oreilles
}

// --- 3. La tente de Madame Ysmée : le cône vu de trois quarts par le dessus. (étape 3, « énorme, massive ») plus petite :
//     son pied, un cercle de rayon 54, devient à l'écran une ellipse de 54 × 34 (la profondeur un peu tassée, × 0,63 au lieu
//     de 0,75, pour qu'elle reste une tente et non un chapiteau) ; le sommet à 92 au-dessus du centre du pied. Les bandes de
//     la toile sont les génératrices du cône ; l'ourlet d'or festonné suit l'arc avant ; l'entrée, les rideaux noués, la
//     boule de cristal et la table au fond, la lanterne, le mât, le fanion, les étoiles : les mêmes, à la même échelle. ---
const TENTE_VOLUME = { L: 150, H: 162, rx: 54, ry: 34, haut: 92 };
function tenteYsmeeVolumeHD(s) {
  const cle = 'tenteYsmeeVolumeHD'; if (s.textures.exists(cle)) return cle;
  const R = TENTE_VOLUME, { L, H, rx, ry, haut } = R, t = toileV2(L, H), cx = 75, yBase = H - 4, yc = yBase - ry, ya = yc - haut, e = rx / 70;
  const bande = th => Math.floor(th / Math.PI * 7) % 2, teinteA = th => 3 + (Math.cos(th) < -0.33 ? 1 : Math.cos(th) > 0.33 ? -1 : 0) - (bande(th) ? 1 : 0);
  const generatrice = (th, arriere) => { const ex = cx + rx * Math.cos(th), ey = yc + (arriere ? -1 : 1) * ry * Math.sin(th), n = Math.ceil(Math.hypot(ex - cx, ey - ya));
    for (let i = 0; i <= n; i++) { const u = i / n, x = Math.round(cx + (ex - cx) * u), y = Math.round(ya + (ey - ya) * u); for (const dx of [0, 1]) t.poser(x + dx, y, 'tenteV', Math.max(0, Math.min(5, teinteA(th) + (u < 0.12 ? 1 : 0) - (arriere ? 1 : 0)))); } };
  for (let i = 0; i <= 900; i++) generatrice(Math.PI * i / 900, true);
  for (let i = 0; i <= 1400; i++) generatrice(Math.PI * i / 1400, false);
  // l'ourlet d'or festonné, le long de l'arc avant
  const yFront = x => yc + ry * Math.sqrt(Math.max(0, 1 - ((x + 0.5 - cx) / rx) ** 2));
  for (let x = cx - rx; x <= cx + rx; x++) { const yf = Math.round(yFront(x)), f = Math.floor((x + 200) / 6) % 2; for (let y = yf - 3; y <= yf - 1 + f; y++) t.poser(x, y, 'tenteOr', y === yf - 3 ? 4 : 2); }
  // l'entrée : un triangle sombre jusqu'au pied, les rideaux noués de cordons d'or
  const yS = ya + Math.round(haut * 0.42), yP = yBase - 3, we = 22 * e;
  for (let y = yS; y < yP; y++) { const v = (y - yS) / (yP - yS), w = 4 + v * we; for (let x = Math.round(cx - w); x <= cx + w; x++) t.poser(x, y, 'tenteV2', Math.abs(x - cx) < w - 5 ? 0 : 2); }
  for (const s0 of [-1, 1]) { const y0 = ya + Math.round(haut * 0.55); for (let y = y0; y < yP; y++) { const v = (y - y0) / (yP - y0), w = 5 + v * 5; for (let k = 0; k < w; k++) t.poser(Math.round(cx + s0 * (we + 2 + v * 2 - k)), y, 'tenteOr', k === 0 ? 4 : 2 + (k % 3 === 0 ? 1 : 0)); } for (let k = -2; k <= 2; k++) t.poser(Math.round(cx + s0 * we) + k, ya + Math.round(haut * 0.66), 'or', 5); }
  // la boule de cristal et la table ronde, au fond (son dessus vu par le dessus : une ellipse)
  for (let y = -3; y <= 3; y++) for (let x = -8; x <= 8; x++) if ((x / 8) ** 2 + (y / 3) ** 2 <= 1) t.poser(cx + x, yBase - 18 + y, 'cuirRouge', y < 0 ? 4 : 3);
  t.forme('lanterneV', ellipsoide(cx, yBase - 24, 4, 4), { decalage: 1, ombre: false });
  // le mât et le fanion d'or, les étoiles cousues, la lanterne violette
  for (let y = ya - 28; y < ya + 2; y++) { t.poser(cx, y, 'chene', 3); t.poser(cx + 1, y, 'chene', 1); }
  for (let y = ya - 27; y < ya - 15; y++) for (let x = cx + 2; x < cx + 2 + Math.round((ya - 15 - y) * 1.6); x++) t.poser(x, y, 'tenteOr', 3 + (y < ya - 24 ? 1 : 0));
  for (const [dx, v] of [[-0.57, 0.8], [0.54, 0.62], [-0.23, 0.36], [0.71, 0.95], [-0.8, 0.98], [0.26, 0.24]]) { const sx = Math.round(cx + dx * rx * v), sy = Math.round(ya + v * (haut + ry * 0.6)); if (t.mat(sx, sy) !== 'tenteV') continue; t.poser(sx, sy, 'or', 5); t.poser(sx - 1, sy, 'or', 3); t.poser(sx + 1, sy, 'or', 3); t.poser(sx, sy - 1, 'or', 3); t.poser(sx, sy + 1, 'or', 3); }
  const lx = Math.round(cx - rx * 0.66), ly = ya + Math.round(haut * 0.56); for (let y = ly - 8; y < ly; y++) t.poser(lx + 3, y, 'fer', 2); for (let y = ly; y < ly + 9; y++) for (let x = lx; x < lx + 7; x++) t.poser(x, y, (x === lx || x === lx + 6 || y === ly || y === ly + 8) ? 'fer' : 'lanterneV', (x === lx || x === lx + 6 || y === ly || y === ly + 8) ? 2 : 4);
  t.contour(); t.texture(s, cle); return cle;
}

// --- 4. (étape 3) Les maisons de ville (maison5, villeDecorHD.js) en un seul volume : la même façade (peindreMaison5, sans son
//     toit), posée sous un toit en croupe de tuiles, d'ardoises ou de chaume (le pan : prof ≈ 0,21 × la largeur, montée 2,3 ×
//     la profondeur, 1,5 sans étage : Q249) ; la cheminée debout sur le pan ; la lucarne debout sur le pan, son petit toit ; les
//     appuis des fenêtres vus par le dessus, les linteaux en retrait, la terre des jardinières, l'ombre sous le store de la
//     vitrine, la porte en retrait et ses marches vues par le dessus ; l'ombre de la rive, les bords du mur, le pied du mur.
//     (maison5(…, { volume: true }) l'appelle) ---
function lucarneVolumeHD(t, toit, lx, d, motif, mat, g) {
  const yPied = Math.round(toit.surface(d)), hf = 18, y0 = yPied - hf, l = 24;
  for (let y = y0; y <= yPied; y++) for (let x = lx; x < lx + l; x++) { const joint = (y - y0) % 6 === 5; t.poser(x, y, 'platre', 3 + (x < lx + 3 ? 1 : 0) - (x > lx + l - 4 ? 1 : 0) - (joint ? 1 : 0)); }
  for (let y = y0; y <= yPied; y++) { t.poser(lx, y, 'cheneSombre', 3); t.poser(lx + l - 1, y, 'cheneSombre', 2); }
  fenetre5(t, lx + 6, y0 + 5, 12, hf - 7, { volet: null, pierre: false, g });
  retraitHD(t, lx + 7, y0 + 6, lx + 16, yPied - 3, (x, y) => t.mat(x, y) === 'vitreJ');
  for (let k = 1; k <= 2; k++) for (let y = y0 + 3; y <= yPied + 1; y++) teinterV(t, lx + l - 1 + k, y, -2);   // son ombre sur le pan
  // son petit toit : un triangle vu un peu par le dessus (12 rangs), le faîte qui rentre dans le pan
  const cm = motif === 'chaume' ? 'chaumeA' : mat;
  for (let yy = y0 - 12; yy < y0 + 1; yy++) { const v = (yy - y0 + 12) / 12; for (let x = Math.round(lx + 12 - v * 15); x <= Math.round(lx + 11 + v * 15); x++) { const row = Math.floor((yy - y0 + 12) / 3), tx = (x + (row % 2) * 3) % 6;
    t.poser(x, yy, cm, (x < lx + 12 ? 3 : 2) + (yy === y0 ? -1 : 0) - (tx === 5 && motif !== 'chaume' ? 1 : 0) + ((yy - y0 + 12) % 3 === 0 ? 1 : 0)); } }
  for (let x = lx + 9; x < lx + 15; x++) t.poser(x, y0 - 13, cm, 5);
  return { lx: lx - 4, ly: y0 - 13, bas: yPied + 1, l: l + 8 };
}
function maisonVolume5(s, cle, o) {
  const R = peindreMaison5({ ...o, sansToit: true }), src = R.t, { L, yR, yT, bas } = R;
  const { etages = [54], toitMat = 'tuile', porte = { x: 0.62, l: 24, h: 50 }, vitrine = null, fenetresRdc = [], fenetres = null, jardinieres = true, cheminee = 0.72, lucarne = null, graine = 1, bois = 'cheneSombre', rdc = 68 } = o;
  const prof = o.prof || Math.round(L * 0.21), montee = o.montee || Math.round(prof * (etages.length ? 2.3 : 1.5)), P = montee + Math.round(prof * VOLUME_HD.prof);
  const ox = 8, D = 8, M = P + (cheminee !== null ? 44 : 10), oy = M - yT, W = L + 2 * ox, H = src.h + oy, t = toileM5(W, H);
  Object.assign(t.rampes, src.rampes);   // (l'enduit de cette maison : enduit5 a changé sa rampe « platre »)
  for (let y = yT + 3; y < src.h; y++) for (let x = 0; x < src.l; x++) { const m = src.mat(x, y); if (m) t.poser(x + ox, y + oy, m, src.teinte(x, y)); }
  const motif = toitMat === 'chaume' ? 'chaume' : toitMat === 'ardoiseToit' ? 'ardoise' : 'tuile', mat = toitMat === 'chaume' ? 'chaumeA' : toitMat;
  const yE = M, xa = ox - D + 2, xb = L + ox + D - 3;
  const toit = toitCroupeHD(t, { xa, xb, yEgout: yE, montee, prof, mat, motif, g: graine + 31 });
  ombreRiveHD(t, xa, xb, yE, m => !!m);
  // les fenêtres du rez-de-chaussée : l'appui vu par le dessus, le linteau en retrait
  for (const fx of fenetresRdc) { const wx = Math.round(L * fx - 8) + ox, wy = yR + 18 + oy; appuiHD(t, wx - 4, wx + 19, wy + 23); retraitHD(t, wx + 1, wy + 1, wx + 14, wy + 20, (x, y) => t.mat(x, y) === 'vitreJ', 5); }
  // les étages : appuis, linteaux en retrait, la terre des jardinières vue par le dessus
  let y = yR; etages.forEach((h, i) => { const yEt = y - h, nf = fenetres ? fenetres[i] : [0.25, 0.75];
    for (const f of nf) { const fx = Math.round(L * f - 8) + ox, fy = yEt + 13 + oy;
      appuiHD(t, fx - 2, fx + 17, fy + 24); retraitHD(t, fx + 1, fy + 1, fx + 14, fy + 22, (x, y) => t.mat(x, y) === 'vitreJ' || t.mat(x, y) === 'cuirRouge');
      if (jardinieres) for (let yy = fy + 26; yy < fy + 28; yy++) for (let xx = fx - 2; xx < fx + 19; xx++) if (!/^(feuille|fleur)/.test(t.mat(xx, yy) || '')) t.poser(xx, yy, 'terreCuite', 2 + (yy === fy + 26 ? 1 : 0)); }
    y = yEt; });
  // la vitrine : l'ombre du store sur les vitres, les vitres en retrait
  if (vitrine) { const vx = Math.round(L * vitrine.x - vitrine.l / 2) + ox, vy = yR + 18 + oy, vh = rdc - 28;
    for (let k = 0; k < 4; k++) for (let x = vx; x < vx + vitrine.l; x++) teinterV(t, x, vy + k, k < 3 ? -2 : -1);
    for (let x = vx - 7; x < vx + vitrine.l + 7; x++) if (t.mat(x, vy - 14)) t.poser(x, vy - 14, t.mat(x, vy - 14), 5);   // (le haut du store, au soleil)
    retraitHD(t, vx, vy + 4, vx + vitrine.l - 1, vy + vh - 10, (x, y) => t.mat(x, y) === 'vitreJ', 1); }
  // la porte en retrait, ses deux marches vues par le dessus
  const basV = bas + oy;
  if (porte) { const pl = porte.l, px = Math.round(L * porte.x - pl / 2) + ox, py = basV - porte.h, m = porte.peinte || 'cheneSombre';
    retraitHD(t, px, py, px + pl - 1, basV - 1, (x, y) => { const q = t.mat(x, y); return x >= px && x < px + pl && y >= py && y < basV && (q === m || q === 'vitreJ'); }, 5);
    if (porte.marches !== false) { marcheHD(t, px - 5, px + pl + 4, basV, 2, 1); marcheHD(t, px - 7, px + pl + 6, basV + 3, 1, 1); } }
  // la cheminée, la lucarne, debout sur le pan
  const ch = cheminee !== null ? chemineeVolumeHD(t, toit, Math.round(L * cheminee) - 7 + ox, 14, Math.round(prof * 0.45), 30, 'brique2') : null;
  const lu = lucarne !== null ? lucarneVolumeHD(t, toit, Math.round(L * lucarne) - 12 + ox, Math.round(prof * 0.3), motif, mat, graine + 41) : null;
  for (let x = 4 + ox; x < L - 4 + ox; x++) if (/^taille/.test(t.mat(x, basV - 3) || '')) { t.poser(x, basV - 3, 'taille3', 5); t.poser(x, basV - 2, 'taille3', 4); teinterV(t, x, basV - 4, -1); }   // le soubassement qui avance : son dessus
  bordsMurHD(t, ox, L + ox - 1, yE + 3, H - 1);
  for (let x = 0; x < W; x++) { teinterV(t, x, H - 1, -2); teinterV(t, x, H - 2, -1); }
  t.contour(); t.texture(s, cle);
  {   // (Q268) la pierre du bas, à la Stardew (hors des encadrements, des chaînes d'angle et du soubassement)
    const sauf = fenetresRdc.map(fx => { const wx = Math.round(L * fx - 8) + ox, wy = yR + 18 + oy; return [wx - 5, wy - 6, wx + 20, wy + 27]; });
    if (porte) { const px = Math.round(L * porte.x - porte.l / 2) + ox; sauf.push([px - 6, basV - porte.h - 7, px + porte.l + 5, basV + 4]); }
    if (vitrine) { const vx = Math.round(L * vitrine.x - vitrine.l / 2) + ox, vy = yR + 18 + oy; sauf.push([vx - 9, vy - 16, vx + vitrine.l + 8, vy + rdc - 24]); }
    if (o.porche) { const px = Math.round(L * o.porche.x - o.porche.l / 2) + ox; sauf.push([px - 7, yR + oy, px + o.porche.l + 6, basV + 4]); }
    pierresRondesTexture(s, cle, [{ r: [13 + ox, yR + oy, L - 14 + ox, basV - 4], sauf, sousFace: etages.length ? 7 : 0, graine: graine + 77 }]); }
  noterVolumeHD(s, cle, toit, yE, ch, lu ? (x, y) => x >= lu.lx && x < lu.lx + lu.l && y >= lu.ly && y < lu.bas : null);
  s.textures.get(cle).info89 = { L: W, H, yR: yR + oy, yT: yE, bas: basV };
  return cle;
}

// --- 5. (étape 4, Q250) Les bâtiments faits à la main de la rue d'avant (ton comptoir, la forge, les Pommeroy…) dans la
//     même projection, sans redessiner leur façade validée : on garde leur texture sous la rangée `coupe` (le haut du mur,
//     sous l'égout de leur ancien toit), et on pose dessus le toit en croupe (de la même couverture), la cheminée et la
//     lucarne debout sur le pan, les marches vues par le dessus ; puis, sur les pixels de la façade : l'ombre de la rive (8
//     rangs), les ouvertures en retrait (r : l'ombre du linteau dans les 3 premiers rangs de l'ouverture, le jambage gauche ;
//     interieur : l'ombre suit le haut de ce qui est sombre, pour un arc), les dessus éclairés (d : un appui, une sablière,
//     une tablette ; et leur ombre dessous), les bords du mur, le pied du mur. Les coordonnées : celles de la texture d'origine.
function revolumeHD(s, src, cle, o) {
  if (s.textures.exists(cle)) return cle;
  if (!s.textures.exists(src)) return src;
  const img = s.textures.get(src).getSourceImage(), Wd = img.width, Hs = img.height;
  const { coupe, xa, xb, montee, prof, mat = 'tuile', motif = 'tuile', g = 1, bois = 'chene', cheminee = null, lucarne = null, ops = [], mur = [0, Wd - 1], rampes = {}, marches = [] } = o;
  const egout = coupe - 3, P = montee + Math.round(prof * VOLUME_HD.prof), oy = Math.max(0, P + (cheminee ? 44 : 10) - egout), H = Hs + oy;
  const t = toileDecor(Wd, H); Object.assign(t.rampes, RAMPES_RUE, typeof RAMPES_V2 !== 'undefined' ? RAMPES_V2 : {}, rampes);
  const toit = toitCroupeHD(t, { xa, xb, yEgout: egout + oy, montee, prof, mat, motif, g, bois });
  const ch = cheminee ? chemineeVolumeHD(t, toit, cheminee.x, cheminee.l || 14, cheminee.d || Math.round(prof * 0.45), cheminee.h || 30, cheminee.mat || 'brique2') : null;
  const lu = lucarne ? lucarneVolumeHD(t, toit, lucarne.x, lucarne.d || Math.round(prof * 0.3), motif, mat, g + 41) : null;
  for (const [x0, x1, y, p, c] of marches) marcheHD(t, x0, x1, y + oy, p, c);
  t.contour();
  const cv = document.createElement('canvas'); cv.width = Wd; cv.height = H; const ctx = cv.getContext('2d');
  ctx.drawImage(img, 0, coupe, Wd, Hs - coupe, 0, coupe + oy, Wd, Hs - coupe);
  const D = ctx.getImageData(0, 0, Wd, H), d = D.data;
  for (let i = 0; i < t.c.length; i++) { const c = t.c[i]; if (c === null) continue; d[i * 4] = c >> 16; d[i * 4 + 1] = (c >> 8) & 255; d[i * 4 + 2] = c & 255; d[i * 4 + 3] = 255; }
  const ok = (x, y) => x >= 0 && y >= 0 && x < Wd && y < H && d[(y * Wd + x) * 4 + 3] >= 128;
  const lum = (x, y) => { const i = (y * Wd + x) * 4; return 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]; };
  const mul = (x, y, f) => { if (!ok(x, y)) return; const i = (y * Wd + x) * 4; d[i] *= f; d[i + 1] *= f; d[i + 2] *= f; };
  const eclaire = (x, y, f) => { if (!ok(x, y)) return; const i = (y * Wd + x) * 4; for (let c = 0; c < 3; c++) d[i + c] += (255 - d[i + c]) * f; };
  const Y = coupe + oy;
  for (const op of ops) {
    if (op.r) { const [x0, y0, x1, y1] = op.r, k = op.k || 3;
      for (let x = x0; x <= x1; x++) { let yt = y0 + oy; if (op.interieur) while (yt <= y1 + oy && lum(x, yt) > 70) yt++; if (yt > y1 + oy) continue; for (let j = 0; j < k; j++) mul(x, yt + j, 0.66); mul(x, yt + k, 0.84); }
      for (let y = y0; y <= y1; y++) for (const [x, f] of [[x0, 0.84], [x0 + 1, 0.9]]) if (!op.interieur || lum(x, y + oy) < 90) mul(x, y + oy, f); }
    if (op.d) { const [x0, x1, y] = op.d, n = op.n || 2; for (let x = x0; x <= x1; x++) { for (let j = 0; j < n; j++) eclaire(x, y + oy + j, j ? 0.14 : 0.28); mul(x, y + oy + n, 0.74); } }
  }
  pierresRondesDonnees(d, Wd, H, ops.filter(op => op.pierre).map(op => ({ r: [op.pierre[0], op.pierre[1] + oy, op.pierre[2], op.pierre[3] + oy], sousFace: op.pierre[4] || 0, graine: g, sauf: (op.sauf || []).map(([a, b, c, e]) => [a, b + oy, c, e + oy]) })));   // (Q268) la pierre à la Stardew
  for (let k = 0; k < 8; k++) for (let x = xa; x <= xb; x++) mul(x, Y + k, k < 5 ? 0.66 : 0.82);   // l'ombre de la rive
  for (let y = Y; y < H; y++) { mul(mur[0], y, 0.86); mul(mur[1], y, 0.8); mul(mur[1] - 1, y, 0.9); }   // les bords du mur
  for (let x = 0; x < Wd; x++) { mul(x, H - 1, 0.72); mul(x, H - 2, 0.86); }   // le pied du mur
  ctx.putImageData(D, 0, 0);
  s.textures.addCanvas(cle, cv);
  noterVolumeHD(s, cle, toit, egout + oy, ch, lu ? (x, y) => x >= lu.lx && x < lu.lx + lu.l && y >= lu.ly && y < lu.bas : null);
  s.textures.get(cle).volume89 = { oy, coupe };
  return cle;
}
// Ton comptoir, à son niveau n (0 : la chaumière … 3 : la belle maison ; etage : l'appartement) : la même façade (exterieurHD.js)
const BARDEAU_COMPTOIR = [0x2a1a0e, 0x4a3018, 0x6a4626, 0x8a6036, 0xa87a4a, 0xc49a68], BRIQUE_COMPTOIR = [0x3a1410, 0x5e2018, 0x823024, 0xa04030, 0xbc5844, 0xd8806a];
function comptoirVolumeHD(s, n = 3, etage = false) {
  if (etage) creerEtageHD(s); else creerFacadeHD(s, n);
  const src = etage ? 'facadeHD_4' : 'facadeHD_' + n, dy = etage ? 50 : 0, haut = n >= 2;
  const ops = [{ pierre: [22, (haut ? 108 : n === 0 ? 116 : 113) + dy, 177, 174 + dy, haut ? 7 : 0], sauf: [[24, 110 + dy, 96, 166 + dy], [117, 110 + dy, 165, 176 + dy]] }, { r: [31, 123 + dy, 88, 157 + dy], k: 5 }, { d: [22, 97, 158 + dy], n: 2 }, { r: [124, 116 + dy, 157, 171 + dy], interieur: true, k: 5 }];
  if (haut) { for (const fy0 of etage ? [70, 120] : [70]) for (const fx0 of [47, 105, 163]) ops.push({ r: [fx0 + 1, fy0 + 1, fx0 + 16, fy0 + 22] }, { d: [fx0 - 2, fx0 + 19, fy0 + 24], n: 1 }); ops.push({ d: [8, 191, 102 + dy], n: 1 }); }
  return revolumeHD(s, src, 'comptoirVolumeHD_' + (etage ? 4 : n), { coupe: haut ? 58 : n === 0 ? 116 : 113, xa: haut ? 4 : 10, xb: haut ? 195 : 189, prof: haut ? 32 : 28, montee: haut ? 62 : 42,
    mat: n === 0 ? 'chaumeA' : n === 1 ? 'ardoiseToit' : n === 2 ? 'bardeau' : 'tuile', motif: n === 0 ? 'chaume' : n === 1 ? 'ardoise' : 'tuile', g: 707 + n, rampes: { bardeau: BARDEAU_COMPTOIR, brique: BRIQUE_COMPTOIR },
    cheminee: { x: 148, l: n === 3 ? 14 : 12, mat: n === 3 ? 'brique' : 'pierre' }, lucarne: n === 3 ? { x: 88 } : null, ops, mur: haut ? [12, 187] : [18, 181], marches: [[118, 163, 172 + dy, 2, 2]] });
}
// La forge de Thorgal (le jour, la nuit) : son toit d'ardoises, sa cheminée de pierre ; la grande arche en retrait, la fenêtre
function forgeVolumeHD(s, jour) {
  return revolumeHD(s, jour ? 'rueForgeHD_jour' : 'rueForgeHD', 'forgeVolumeHD' + (jour ? '_jour' : ''), { coupe: 43, xa: 2, xb: 177, prof: 30, montee: 56, mat: 'ardoiseToit', motif: 'ardoise', g: 844,
    cheminee: { x: 128, l: 20, mat: 'pierre', h: 34 }, mur: [8, 168],
    ops: [{ r: [30, 100, 110, 168], interieur: true, k: 4 }, { r: [130, 112, 142, 129] }, { d: [8, 168, 69], n: 1 }] });
}
// Les Pommeroy : leur toit de tuiles ; les fenêtres de l'étage et du rez-de-chaussée en retrait, leurs appuis, la porte
function pommeroyVolumeHD(s) {
  return revolumeHD(s, 'rueMaisonHD_0', 'pommeroyVolumeHD', { coupe: 53, xa: 2, xb: 147, prof: 28, montee: 54, mat: 'tuile', motif: 'tuile', g: 815, mur: [9, 140],
    ops: [{ pierre: [9, 97, 140, 158, 6], sauf: [[104, 111, 128, 136], [45, 112, 73, 160]] }, { r: [25, 61, 40, 77] }, { r: [107, 61, 122, 77] }, { d: [22, 43, 79], n: 1 }, { d: [104, 125, 79], n: 1 }, { r: [109, 115, 124, 131], k: 5 }, { d: [106, 127, 133], n: 1 }, { r: [48, 116, 70, 159], interieur: true, k: 5 }] });
}
// (Q252) La potence de fer d'où pend une plaque de rue, fixée au poteau d'un réverbère (vers la gauche), et le petit poteau
// de bois (son chapeau, son pied de pierre vu par le dessus) qui porte une plaque devant un perron
function potencePlaqueHD(s) {
  const cle = 'potencePlaqueHD'; if (s.textures.exists(cle)) return cle;
  const t = toileDecor(46, 18);
  for (let x = 0; x < 46; x++) { t.poser(x, 2, 'fer', x === 45 ? 2 : 4); t.poser(x, 3, 'fer', 2); }
  for (let k = 0; k < 13; k++) t.poser(44 - k, 3 + k, 'fer', 3);   // la jambe de force
  for (const x of [8, 28]) for (let y = 4; y < 18; y++) t.poser(x, y, 'fer', y % 2 ? 2 : 4);   // les deux chaînettes
  for (let y = 0; y < 6; y++) { t.poser(44, y, 'fer', 3); t.poser(45, y, 'fer', 1); }   // le collier
  t.contour(); t.texture(s, cle); return cle;
}
function poteauPlaqueHD(s) {
  const cle = 'poteauPlaqueHD'; if (s.textures.exists(cle)) return cle;
  const t = toileDecor(12, 52);
  for (let y = 4; y < 46; y++) for (let x = 3; x < 9; x++) t.poser(x, y, 'chene', x === 3 ? 4 : x === 8 ? 1 : 3);
  for (let x = 2; x < 10; x++) { t.poser(x, 2, 'chene', 5); t.poser(x, 3, 'chene', 2); }   // le chapeau
  for (let y = 44; y < 52; y++) for (let x = 0; x < 12; x++) t.poser(x, y, 'pierre', y < 47 ? 4 : y === 51 ? 1 : 2);   // le pied de pierre (son dessus, son chant)
  t.contour(); t.texture(s, cle); return cle;
}

// ======================= ÉTAPE 5 (Q258) : la forge de Thorgal, refaite entièrement =======================
// Ce n'est pas une maison : une halle de forge ouverte sur la rue, qu'on voit d'en haut. Le sol de terre battue, vu par le
// dessus, s'enfonce jusqu'au mur du fond, de pierre ; contre lui, le foyer (un bloc de pierre, son dessus où rougeoient les
// braises) sous sa grande hotte, qui monte en cheminée massive à travers le toit ; à côté, le soufflet de cuir ; au mur, le
// râtelier des outils (pinces, marteaux, un fer à cheval) ; devant, l'enclume sur sa souche, le bac de trempe (son eau vue
// par le dessus, une pince dedans), le tas de charbon ; au fond à droite, les bûches empilées. Le toit (Q267, la piste A
// validée) : un grand appentis de bardeaux, d'un seul pan qui monte vers le mur du fond, sur trois poteaux.
// Les dimensions : 184 × 196 ; le sol de la rue au rang 195 ; l'égout (le bord avant du toit) à 80 au-dessus du sol ; la
// halle profonde de 44 (le sol vu : 33 rangs) ; le foyer à (42, 151).
const FORGE_VOLUME = { L: 184, H: 196, feu: [42, 151], ecriteau: [130, 120] };
function rampesForge(t) {
  Object.assign(t.rampes, RAMPES_RUE, typeof RAMPES_V2 !== 'undefined' ? RAMPES_V2 : {});
  Object.assign(t.rampes, { sol: rampe(0x7a6650), charbon: rampe(0x3a3634), eau: rampe(0x3e6e8e), bardeau: BARDEAU_COMPTOIR, cuirF: rampe(0x8a4a2a) });
}
function interieurForgeHD(t, g = 861) {
  const Hb = 195, fond = Hb - 33, P = (x, y, m, k) => t.poser(Math.round(x), Math.round(y), m, Math.max(0, Math.min(5, k)));
  // le sol de terre battue (plus sombre vers le fond, sous le toit ; noirci de charbon près du foyer)
  for (let y = fond; y <= Hb; y++) for (let x = 2; x < 182; x++) { const n = fbm(x * 0.12, y * 0.2, g); P(x, y, 'sol', 3 + (n > 0.62 ? 1 : n < 0.36 ? -1 : 0) - (y < fond + 8 ? 1 : 0) - (Math.hypot(x - 40, (y - 170) * 1.6) < 30 && hachage(x, y, g) > 0.5 ? 1 : 0)); }
  // le mur du fond, de pierre, dans l'ombre du toit : chaque assise son dessus clair, son joint sombre
  for (let y = 100; y < fond; y++) { const r = Math.floor((fond - 1 - y) / 6), ty = (fond - 1 - y) % 6, dec = (r % 2) * 7; for (let x = 2; x < 182; x++) { const b = Math.floor((x + dec) / 14), jv = (x + dec) % 14 === 0;
    P(x, y, 'pierre', ty === 0 || jv ? 0 : ty === 5 ? 3 : 2 + (hachage(b, r, g) > 0.7 ? 1 : 0) - (y < fond - 26 ? 1 : 0)); } }
  // le râtelier et les outils pendus
  for (let x = 100; x < 152; x++) { P(x, 130, 'chene', 4); P(x, 131, 'chene', 2); }
  for (const [x, sorte] of [[104, 'pince'], [114, 'marteau'], [123, 'fer'], [133, 'marteau'], [143, 'pince']]) {
    if (sorte === 'pince') for (let k = 0; k < 18; k++) { P(x + Math.floor(k / 9), 132 + k, 'fer', 4); P(x + 3 - Math.floor(k / 9), 132 + k, 'fer', 2); }
    else if (sorte === 'marteau') { for (let k = 0; k < 14; k++) P(x + 1, 132 + k, 'chene', 3); for (let y = 146; y < 150; y++) for (let k = -2; k <= 4; k++) P(x + k, y, 'fer', y === 146 ? 5 : 3); }
    else for (let a = 0; a < 26; a++) { const th = Math.PI * (0.15 + a / 26 * 1.7); P(x + 3 + Math.cos(th) * 5, 140 + Math.sin(th) * 6, 'fer', 4); }   // le fer à cheval
  }
  // les bûches empilées (leurs bouts : des cernes), au fond à droite
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3 - (r === 2 ? 1 : 0); c++) { const cx = 156 + c * 8 + r * 4, cy = 165 - r * 7;
    for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) { const q = Math.hypot(x, y); if (q > 4.2) continue; P(cx + x, cy + y, q > 3.3 ? 'cheneSombre' : 'chene', q > 3.3 ? 2 : q < 1 ? 3 : 4 + (Math.round(q) % 2 ? 0 : -1) - (x > 1 ? 1 : 0)); } }
  // le foyer : un bloc de pierre (sa face, son dessus où rougeoient les braises)
  const hx0 = 14, hx1 = 70;
  for (let y = 156; y < 172; y++) for (let x = hx0; x <= hx1; x++) { const r = Math.floor((y - 156) / 5), ty = (y - 156) % 5, dec = (r % 2) * 6, jv = (x - hx0 + dec) % 12 === 0;
    const cendrier = Math.abs(x - 42) < 9 && y > 161; P(x, y, cendrier ? 'charbon' : 'taille', cendrier ? (y < 164 ? 0 : 1) : ty === 4 || jv ? 1 : ty === 0 ? 4 : 3 - (x > hx1 - 3 ? 1 : 0)); }
  for (let y = 148; y < 156; y++) for (let x = hx0; x <= hx1; x++) { const rebord = x < hx0 + 4 || x > hx1 - 4 || y < 150 || y > 153;
    if (rebord) P(x, y, 'taille', y === 148 || x < hx0 + 2 ? 5 : 4); else { const q = Math.hypot((x - 42) / 22, (y - 151.5) / 2.5), n = hachage(x, y, g + 3); P(x, y, 'braise', 5 - Math.floor(q * 3) + (n > 0.8 ? 1 : n < 0.2 ? -1 : 0)); } }
  // la hotte : sa lèvre au-dessus du feu, puis elle monte en se resserrant ; une frise naine de chevrons, l'emblème (l'enclume et le marteau)
  for (let x = hx0 - 6; x <= hx1 + 6; x++) { P(x, 145, 'taille', 5); P(x, 146, 'taille', 3); P(x, 147, 'taille', 1); }
  for (let y = 60; y < 145; y++) { const v = (145 - y) / 85, a = hx0 - 4 + v * 26, b = hx1 + 4 - v * 26; for (let x = Math.round(a); x <= Math.round(b); x++) { const r = Math.floor((145 - y) / 6), ty = (145 - y) % 6, jv = (x + (r % 2) * 7) % 14 === 0;
    P(x, y, 'taille', ty === 0 || jv ? 1 : ty === 5 ? 4 : 3 + (x < a + 3 ? 1 : x > b - 3 ? -1 : 0)); } }
  for (let x = 20; x <= 64; x++) { const z = Math.abs(((x - 20) % 8) - 4); P(x, 136 + z - 2, 'laiton', 4); P(x, 137 + z - 2, 'laiton', 2); }   // la frise de chevrons
  for (let x = 36; x <= 48; x++) P(x, 128, 'fer', 4); for (let x = 39; x <= 45; x++) { P(x, 129, 'fer', 3); P(x, 130, 'fer', 2); } for (let x = 37; x <= 47; x++) P(x, 131, 'fer', 3);   // l'enclume de l'emblème
  for (let k = 0; k < 7; k++) P(46 - k, 121 + k, 'chene', 4); for (let x = 44; x <= 49; x++) { P(x, 119, 'fer', 4); P(x, 120, 'fer', 3); }   // son marteau
  // le soufflet de cuir, contre le mur, son bec vers le feu
  for (let y = 154; y < 167; y++) { const v = (y - 154) / 13; for (let x = 74; x <= 94; x++) { const w = (x - 74) / 20; if (Math.abs(v - 0.5) > 0.5 - w * 0.35) continue;
    P(x, y, y < 156 || y > 164 ? 'chene' : 'cuirF', y < 156 ? 4 : y > 164 ? 2 : 3 - ((y - 156) % 3 === 0 ? 1 : 0)); } }
  for (let x = 68; x < 75; x++) P(x, 160, 'fer', 3);
  // le tas de charbon, devant à gauche
  for (let y = 178; y <= 193; y++) for (let x = 14; x <= 46; x++) { const q = Math.hypot((x - 30) / 16, (y - 193) / 15); if (q > 1) continue; const n = hachage(x, y, g + 5); P(x, y, 'charbon', 2 + (n > 0.85 ? 2 : n > 0.6 ? 1 : 0) + (y < 182 ? 1 : 0) - (x > 38 ? 1 : 0)); }
  // l'enclume sur sa souche
  for (let y = 176; y <= 186; y++) for (let x = 108; x <= 122; x++) P(x, y, 'chene', (x - 108) % 4 === 0 ? 2 : x < 111 ? 4 : 3);
  for (let y = 172; y < 177; y++) for (let x = 107; x <= 123; x++) if (((x - 115) / 8.5) ** 2 + ((y - 174.5) / 2.6) ** 2 <= 1) P(x, y, 'chene', Math.hypot(x - 115, (y - 174.5) * 3) % 3 < 1 ? 3 : 5);
  for (let y = 166; y < 172; y++) for (let x = 110 - (171 - y); x <= 120 + (171 - y); x++) P(x, y, 'fer', x < 112 ? 4 : 2);
  for (let y = 161; y < 166; y++) for (let x = 102; x <= 128; x++) P(x, y, 'fer', y === 161 ? 5 : y === 162 ? 4 : y === 165 ? 1 : 3);   // la table de l'enclume, vue par le dessus
  for (let y = 162; y <= 164; y++) for (let x = 94 + (y - 162) * 2; x < 102; x++) P(x, y, 'fer', y === 162 ? 4 : 2);   // la bigorne
  for (let k = 0; k < 9; k++) P(112 + k, 160, 'chene', 4); for (let y = 158; y < 161; y++) for (let x = 120; x < 124; x++) P(x, y, 'fer', y === 158 ? 5 : 3);   // un marteau posé
  // le bac de trempe : sa face de planches cerclées, son eau vue par le dessus, une pince dedans
  for (let y = 180; y <= 191; y++) for (let x = 136; x <= 168; x++) P(x, y, 'chene', (y === 183 || y === 189) ? 1 : (x - 136) % 6 === 0 ? 2 : 3 + (x < 139 ? 1 : 0));
  for (let x = 136; x <= 168; x++) for (const y of [183, 189]) P(x, y, 'fer', 3);
  for (let y = 172; y < 180; y++) for (let x = 136; x <= 168; x++) { const rive = y < 174 || y > 178 || x < 139 || x > 165; P(x, y, rive ? 'chene' : 'eau', rive ? (y < 174 ? 5 : 3) : 3 + ((x + y * 2) % 11 === 0 ? 2 : 0) - (y > 177 ? 1 : 0)); }
  for (let k = 0; k < 10; k++) { P(150 + k, 175 - Math.floor(k / 3), 'fer', 4); P(152 + k, 177 - Math.floor(k / 3), 'fer', 2); }
  // la lueur du feu sur ce qui l'entoure
  for (let y = 120; y <= Hb; y++) for (let x = 0; x < 120; x++) { const m = t.mat(x, y); if (!m || m === 'braise') continue; const q = Math.hypot(x - 42, (y - 151) * 1.3); if (q < 30 && (m === 'pierre' || m === 'sol')) teinterV(t, x, y, 1); }
}
// les poteaux de chêne (une base de pierre vue par le dessus, des jambes de force sous la poutre)
function poteauxForgeHD(t, xs, y0, Hb) {
  for (const x0 of xs) { for (let y = y0; y < Hb - 3; y++) for (let x = x0; x < x0 + 8; x++) t.poser(x, y, 'chene', x === x0 ? 5 : x === x0 + 7 ? 1 : (x - x0) === 3 ? 2 : 3);
    for (let y = Hb - 3; y <= Hb; y++) for (let x = x0 - 2; x < x0 + 10; x++) t.poser(x, y, 'taille', y === Hb - 3 ? 5 : y === Hb ? 1 : 3);
    for (let k = 0; k < 12; k++) for (const sg of [-1, 1]) { const x = sg < 0 ? x0 - k : x0 + 7 + k; if (x < 1 || x > 182) continue; t.poser(x, y0 + 12 - k, 'chene', sg < 0 ? 4 : 2); t.poser(x, y0 + 13 - k, 'chene', 2); } }
}
// la poutre de façade (son dessus clair), ses runes naines gravées
function poutreForgeHD(t, xa, xb, y) {
  for (let x = xa; x <= xb; x++) for (let k = 0; k < 6; k++) t.poser(x, y + k, 'chene', k === 0 ? 5 : k === 5 ? 1 : 3);
  for (let x = xa + 6; x < xb - 6; x += 9) { for (const [a, b] of [[0, 1], [0, 2], [0, 3], [1, 1], [2, 2], [1, 3], [2, 4]]) t.poser(x + a, y + b, 'cheneSombre', 1); t.poser(x + 1, y + 4, 'chene', 4); }
}
// l'ombre sous le toit, sur le haut de l'intérieur (pas sur les poteaux, ni sur le feu)
function ombreSousToitForge(t, y0, y1) { for (let y = y0; y < y1; y++) for (let x = 1; x < 183; x++) { const m = t.mat(x, y); if (m && m !== 'braise' && m !== 'chene') teinterV(t, x, y, y < y0 + 8 ? -2 : -1); } }
// la cheminée massive de la hotte, au-dessus du toit (une face éclairée, son chapeau vu par le dessus, son conduit noir)
function chemineeForgeHD(t, x0, x1, yBas, yHaut) {
  for (let y = yHaut + 8; y <= yBas; y++) for (let x = x0; x <= x1; x++) { const r = Math.floor((yBas - y) / 6), ty = (yBas - y) % 6, jv = (x + (r % 2) * 6) % 12 === 0;
    t.poser(x, y, 'taille', ty === 0 || jv ? 1 : ty === 5 ? 4 : 3 + (x < x0 + 3 ? 1 : x > x1 - 4 ? -1 : 0)); }
  for (let y = yHaut; y < yHaut + 8; y++) for (let x = x0 - 2; x <= x1 + 2; x++) { const dedans = x > x0 + 4 && x < x1 - 4 && y > yHaut + 1 && y < yHaut + 6; t.poser(x, y, dedans ? 'charbon' : 'taille', dedans ? 0 : y === yHaut ? 5 : 4); }
  for (let k = 1; k <= 3; k++) for (let y = yHaut + 10; y <= yBas + 3; y++) teinterV(t, x1 + k, y, -2);
}
function forgeAppentisHD(s) {
  const cle = 'forgeAppentisHD'; if (s.textures.exists(cle)) return cle;
  const { L, H } = FORGE_VOLUME, Hb = H - 1, t = toileDecor(L, H); rampesForge(t);
  interieurForgeHD(t);
  const yE = 115, P = 63, yT = yE - P;
  for (let x = 2; x < 182; x++) for (let k = 0; k < 3; k++) t.poser(x, yT - 3 + k, 'pierre', k === 0 ? 5 : 3);   // le haut du mur du fond, où s'appuie le pan
  for (let y = yT; y < yE; y++) for (let x = 2; x < 182; x++) {   // le pan de bardeaux, qui monte vers le fond
    const r = Math.floor((yE - 1 - y) / 4), ty = (yE - 1 - y) % 4, dec = (r % 2) * 3, tx = ((x + dec) % 5 + 5) % 5, h = hachage(Math.floor((x + dec) / 5), r, 862), v = (yE - y) / P;
    let k = 3 + (v > 0.6 ? 1 : 0) + (h > 0.85 ? 1 : h < 0.12 ? -1 : 0); if (ty === 0) k -= 2; else if (ty === 3) k++; if (tx === 4) k--; if (x < 5) k++; else if (x > 178) k--;
    t.poser(x, y, 'bardeau', k); }
  for (let y = yT - 3; y < yE; y++) { t.poser(1, y, 'chene', 4); t.poser(182, y, 'cheneSombre', 1); }   // les rives de côté
  for (let x = 1; x <= 182; x++) { t.poser(x, yE, 'chene', 5); t.poser(x, yE + 1, 'chene', 3); t.poser(x, yE + 2, 'cheneSombre', 1); }   // la planche de rive
  chemineeForgeHD(t, 28, 56, yT + 12, 16);
  ombreSousToitForge(t, yE + 9, yE + 30);
  poutreForgeHD(t, 1, 182, yE + 3); poteauxForgeHD(t, [4, 92, 172], yE + 9, Hb);
  t.contour(); t.texture(s, cle); const tex = s.textures.get(cle); tex.cheminee = [42, 16]; tex.forge = FORGE_VOLUME;
  tex.toit89 = { haut: yT - 2, bas: yE + 2, chem: { cx: 42, haut: 16, h: yT + 13 - 16 }, lucarne: null, nu: null };
  return cle;
}
// (Q267) la piste A, validée : l'appentis de bardeaux
function forgeHalleHD(s) { return forgeAppentisHD(s); }

// ======================= ÉTAPE 6 (Q268) : la pierre à la façon de Stardew =======================
// On repeint la maçonnerie des rez-de-chaussée, dans sa couleur (la moyenne de ses pierres, gardée) : des assises de
// hauteurs variées (5 à 8), des pierres de tailles variées (7 à 18), aux coins arrondis, aux joints irréguliers (une pierre
// sur trois monte ou descend d'un rang) ; chaque pierre modelée : son dessus au soleil (deux rangs clairs), son corps, son
// pied dans l'ombre, son côté droit plus sombre, une teinte à elle ; le mortier sombre entre elles. Puis le dégradé vers le
// sol et, sous un étage qui avance, la bande d'ombre de sa sous-face. Ne sont repeints que les pixels de pierre de la zone
// (ni les vitres, ni les portes, ni les volets), hors des rectangles « sauf » (les encadrements de pierre des ouvertures,
// les chaînes d'angle, le soubassement, les colonnes). zones : { r: [x0, y0, x1, y1], sauf: [[x0, y0, x1, y1], …], sousFace, graine,
// regulier } (regulier : la pierre de taille de la banque et du barbier, des assises égales de 7, des blocs de 12 à 20)
function pierresRondesDonnees(d, W, H, zones) {
  const lum = i => 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2];
  const pierre = (x, y) => { if (x < 0 || y < 0 || x >= W || y >= H) return false; const i = (y * W + x) * 4; if (d[i + 3] < 128) return false; const r = d[i], g = d[i + 1], b = d[i + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b); return mx > 34 && (mx - mn) / mx < 0.3; };
  for (const z of zones) {
    const [x0, y0, x1, y1] = z.r, sauf = z.sauf || [], g = z.graine || 1, sf = z.sousFace || 0;
    const hors = (x, y) => sauf.some(([a, b, c, e]) => x >= a && x <= c && y >= b && y <= e);
    let sr = 0, sg = 0, sb = 0, n = 0; const masque = new Uint8Array((x1 - x0 + 1) * (y1 - y0 + 1)), at = (x, y) => (y - y0) * (x1 - x0 + 1) + (x - x0);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (pierre(x, y) && !hors(x, y)) { masque[at(x, y)] = 1; const i = (y * W + x) * 4; if (lum(i) > 60) { sr += d[i]; sg += d[i + 1]; sb += d[i + 2]; n++; } }
    if (!n) continue;
    const moy = [sr / n, sg / n, sb / n], TONS = [0.5, 0.66, 0.84, 1.0, 1.12, 1.24];
    const poser = (x, y, k, t) => { if (x < x0 || x > x1 || y < y0 || y > y1 || !masque[at(x, y)]) return; const i = (y * W + x) * 4, f = TONS[Math.max(0, Math.min(5, k))] * t; for (let c = 0; c < 3; c++) d[i + c] = Math.max(0, Math.min(255, moy[c] * f)); masque[at(x, y)] = 2; };
    // le mortier, partout d'abord
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) poser(x, y, z.regulier ? 1 : 0, 1), masque[at(x, y)] = masque[at(x, y)] ? 1 : 0;
    let y = y0 - Math.floor(hachage(1, 2, g) * 3), r = 0;
    while (y <= y1) {
      const h = z.regulier ? 7 : 5 + Math.floor(hachage(r, 7, g) * 4); let x = x0 - Math.floor(hachage(r, 3, g) * 12), c = 0;
      while (x <= x1) {
        const w = z.regulier ? 12 + Math.floor(hachage(c, r, g + 1) * 9) : 7 + Math.floor(hachage(c, r, g + 1) * 12), saut = z.regulier ? 0.5 : hachage(c, r, g + 2), ya = y + (saut < 0.17 ? 1 : saut > 0.83 ? -1 : 0), yb = y + h - 2 - (hachage(c, r, g + 3) < 0.25 ? 1 : 0), t = 0.92 + hachage(c, r, g + 4) * 0.16, rad = z.regulier ? 1 : w > 12 && yb - ya > 4 ? 2 : 1;
        for (let yy = ya; yy <= yb; yy++) for (let xx = x; xx <= x + w - 2; xx++) {
          const u = xx - x, v = yy - ya, du = Math.min(u, x + w - 2 - xx), dv = Math.min(v, yb - yy); if (du + dv < rad) continue;   // les coins arrondis
          let k = 3 + (hachage(xx, yy, g + 5) > 0.88 ? 1 : hachage(xx, yy, g + 5) < 0.08 ? -1 : 0);
          if (v === 0) k = 5; else if (v === 1) k = 4; else if (yy === yb) k = 1; else if (yy === yb - 1) k = 2;
          if (u === 0 && v > 1) k = Math.min(5, k + 1); else if (xx === x + w - 2 && v > 0) k = Math.max(1, k - 1);
          poser(xx, yy, k, t); }
        x += w; c++;
      }
      y += h; r++;
    }
    // le dégradé vers le sol, la sous-face de l'étage qui avance
    for (let yy = y0; yy <= y1; yy++) { const v = (yy - y0) / Math.max(1, y1 - y0), f = (1 - 0.18 * Math.pow(v, 1.4)) * (sf && yy - y0 < sf ? (yy - y0 < sf * 0.6 ? 0.66 : 0.82) : 1);
      for (let x = x0; x <= x1; x++) { const i = (yy * W + x) * 4; if (d[i + 3] < 128) continue; d[i] *= f; d[i + 1] *= f; d[i + 2] *= f; } }
  }
}
function pierresRondesTexture(s, cle, zones) {
  const tex = s.textures.get(cle), c = tex.getSourceImage(), ctx = c.getContext('2d'), D = ctx.getImageData(0, 0, c.width, c.height);
  pierresRondesDonnees(D.data, c.width, c.height, zones); ctx.putImageData(D, 0, 0); if (tex.refresh) tex.refresh();
}
