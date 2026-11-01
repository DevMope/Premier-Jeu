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
  t.contour(); t.texture(scene, cle); noterVolumeHD(scene, cle, toit, yE, ch); return cle;
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
  retraitHD(t, px, py, px + pl - 1, py + ph - 1, (x, y) => { const m = t.mat(x, y); return x >= px && x < px + pl && y >= py && y < py + ph && m !== 'taille' && m !== 'fer' && m !== 'laiton'; });
  marcheHD(t, px - 5, px + pl + 4, bas - 4, 3, 1); marcheHD(t, px - 7, px + pl + 6, bas, 3, 2);
  for (const fx of [0.2, 0.8]) { const wx = Math.round(L * fx - 8) + ox, wy = yR + 18; fenetre5(t, wx, wy, 16, 22, { volet, g: graine + 5 });
    retraitHD(t, wx + 1, wy + 1, wx + 14, wy + 20, (x, y) => t.mat(x, y) === 'vitreJ'); }
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
  noterVolumeHD(s, cle, toit, yC, ch, (x, y) => y >= 18 + oy && Math.abs(x - 100 - ox) <= (y - 18 - oy) * 3 + 2);   // (la neige : le toit, pas le fronton)
  return cle;
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
//     la profondeur, 1,8 sans étage) ; la cheminée debout sur le pan ; la lucarne debout sur le pan, son petit toit ; les
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
  const prof = o.prof || Math.round(L * 0.21), montee = o.montee || Math.round(prof * (etages.length ? 2.3 : 1.8)), P = montee + Math.round(prof * VOLUME_HD.prof);
  const ox = 8, D = 8, M = P + (cheminee !== null ? 44 : 10), oy = M - yT, W = L + 2 * ox, H = src.h + oy, t = toileM5(W, H);
  Object.assign(t.rampes, src.rampes);   // (l'enduit de cette maison : enduit5 a changé sa rampe « platre »)
  for (let y = yT + 3; y < src.h; y++) for (let x = 0; x < src.l; x++) { const m = src.mat(x, y); if (m) t.poser(x + ox, y + oy, m, src.teinte(x, y)); }
  const motif = toitMat === 'chaume' ? 'chaume' : toitMat === 'ardoiseToit' ? 'ardoise' : 'tuile', mat = toitMat === 'chaume' ? 'chaumeA' : toitMat;
  const yE = M, xa = ox - D + 2, xb = L + ox + D - 3;
  const toit = toitCroupeHD(t, { xa, xb, yEgout: yE, montee, prof, mat, motif, g: graine + 31 });
  ombreRiveHD(t, xa, xb, yE, m => !!m);
  // les fenêtres du rez-de-chaussée : l'appui vu par le dessus, le linteau en retrait
  for (const fx of fenetresRdc) { const wx = Math.round(L * fx - 8) + ox, wy = yR + 18 + oy; appuiHD(t, wx - 4, wx + 19, wy + 23); retraitHD(t, wx + 1, wy + 1, wx + 14, wy + 20, (x, y) => t.mat(x, y) === 'vitreJ'); }
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
    retraitHD(t, px, py, px + pl - 1, basV - 1, (x, y) => { const q = t.mat(x, y); return x >= px && x < px + pl && y >= py && y < basV && (q === m || q === 'vitreJ'); });
    if (porte.marches !== false) { marcheHD(t, px - 5, px + pl + 4, basV, 2, 1); marcheHD(t, px - 7, px + pl + 6, basV + 3, 1, 1); } }
  // la cheminée, la lucarne, debout sur le pan
  const ch = cheminee !== null ? chemineeVolumeHD(t, toit, Math.round(L * cheminee) - 7 + ox, 14, Math.round(prof * 0.45), 30, 'brique2') : null;
  const lu = lucarne !== null ? lucarneVolumeHD(t, toit, Math.round(L * lucarne) - 12 + ox, Math.round(prof * 0.3), motif, mat, graine + 41) : null;
  bordsMurHD(t, ox, L + ox - 1, yE + 3, H - 1);
  for (let x = 0; x < W; x++) { teinterV(t, x, H - 1, -2); teinterV(t, x, H - 2, -1); }
  t.contour(); t.texture(s, cle);
  noterVolumeHD(s, cle, toit, yE, ch, lu ? (x, y) => x >= lu.lx && x < lu.lx + lu.l && y >= lu.ly && y < lu.bas : null);
  s.textures.get(cle).info89 = { L: W, H, yR: yR + oy, yT: yE, bas: basV };
  return cle;
}
