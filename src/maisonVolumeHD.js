// (v1.65, la rue Soucolline, planche de concept « ville vue de haut ») UNE MAISON EN UN SEUL VOLUME, à la projection de
// Stardew Valley. Module d'essai, NON BRANCHÉ (ni index.html ni web/jeu.html ne le chargent) : il sert la planche de concept.
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
function toitCroupeHD(t, { xa, xb, yEgout, montee, prof, mat = 'ardoise', g = 7331, bois = 'chene' }) {
  const P = montee + Math.round(prof * VOLUME_HD.prof), yBas = yEgout - 1, yF = yBas - P + 1;   // le pan avant : de yF à yBas
  const recul = prof;                                        // la croupe à 45° : le faîte rentre de prof de chaque côté
  const hCote = Math.round(2 * prof * VOLUME_HD.prof);       // la hauteur à l'écran du bord de côté (toute la profondeur)
  const xl = y => xa + (yBas - y) / P * recul, xr = y => xb - (yBas - y) / P * recul;
  const yDos = x => (yBas - hCote) - Math.min(x - xa, xb - x) * (P - hCote) / recul;   // le bord arrière des croupes
  const slate = (x, y, base) => { const r = Math.floor((yBas - y) / 4), ty = (yBas - y) % 4, dec = (r % 2) * 5, b = Math.floor((x + dec) / 10);
    if (ty === 0) return base - 2;                                                  // le bas de chaque ardoise, dans l'ombre de la suivante
    if ((x + dec) % 10 === 0) return base - 2;                                     // le joint vertical
    const h = hachage(b, r, g); return base + (h > 0.86 ? 1 : h < 0.1 ? -1 : 0) + (ty === 3 ? 0 : 0); };
  for (let y = yF; y <= yBas; y++) {
    const v = (yBas - y) / P, l = xl(y), r = xr(y), haut = v > 0.62 ? 1 : 0;
    for (let x = xa; x <= xb; x++) {
      if (x >= l && x <= r) t.poser(x, y, mat, slate(x, y, 3 + haut));                   // le pan avant, plus clair vers le faîte (le ciel)
      else if (y > yDos(x)) t.poser(x, y, mat, slate(x, y, x < l ? 4 : 2));             // la croupe gauche au soleil, la droite dans l'ombre
    }
    t.poser(Math.round(l), y, mat, 5); t.poser(Math.round(r), y, mat, 0);               // les arêtiers : l'un accroche la lumière, l'autre l'ombre
  }
  for (let x = Math.round(xl(yF)); x <= Math.round(xr(yF)); x++) { t.poser(x, yF - 1, mat, 5); t.poser(x, yF - 2, mat, x % 6 === 5 ? 2 : 4); }   // le faîte et ses faîtières
  for (let y = yBas - hCote; y <= yBas; y++) { t.poser(xa, y, bois, 4); t.poser(xb, y, 'cheneSombre', 1); }   // le chant des rives de côté
  for (let x = xa; x <= xb; x++) { t.poser(x, yEgout, bois, 5); t.poser(x, yEgout + 1, bois, 3); t.poser(x, yEgout + 2, 'cheneSombre', 1); }   // la planche de rive : dessus, chant, sous-face
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
  chemineeVolumeHD(t, toit, 98 + ox, 12, 12, 30);
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
  t.contour(); t.texture(scene, cle); return cle;
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
