// (v1.64, planche 82 v2 validée) Le bureau devient une vraie pièce, derrière sa porte. Ici, tous ses dessins :
// - la porte d'intérieur de l'arrière-boutique (un seul modèle, pour la chambre et pour le bureau) : chambranle mouluré
//   et sa corniche, vantail à quatre panneaux, bec-de-cane de laiton sur sa rosace, deux fiches ; il s'ouvre vers la
//   pièce d'à côté en six images (0° à 75°), et l'on voit la pièce par l'ouverture ;
// - la même porte vue du bureau, de plus près : la poignée à droite, elle s'ouvre vers nous ;
// - les meubles du bureau (chacun a sa version éclairée, pour le survol) et ce qu'on voit quand on s'en approche ;
// - le joueur assis à son bureau, de face, les avant-bras sur le plateau, la plume à la main.
// Peint en demi-résolution et affiché en ×2, avec les murs, le plancher et les bougies de l'intérieur (interieurHD.js).

// L'arrière-boutique s'élargit de 180 px vers la droite, pour la porte du bureau (la caméra y suit le joueur)
const ELARGI_ARRIERE = 180, LARGEUR_ARRIERE = 960 + ELARGI_ARRIERE;
const PORTES_ARRIERE = { chambre: 688, bureau: 818 };

let RAMPES_BUREAU_CACHE = null;
function rampesBureau() {
  if (!RAMPES_BUREAU_CACHE) RAMPES_BUREAU_CACHE = {
    lueur: [0x8a5a18, 0xb07a24, 0xd8a03a, 0xf0c860, 0xfae09a, 0xfff6d8], velours: rampe(0x2a5a3a), bronze: rampe(0xb87333), argentM: rampe(0xc8d0d8),
    orM: rampe(0xe8b830), violet: rampe(0x9a6ad8), gris: rampe(0x4a4a50), rougeP: rampeVive(0x9a2a1e), bleu: rampeVive(0x3a5a9a), vert: rampeVive(0x3a7a3a),
    violetR: rampeVive(0x6a3a9a), rougeR: rampeVive(0xa82a22), orR: rampeVive(0xc8941e), cuirB: rampeVive(0x6a4a2a), paille: rampe(0xd8b048), galet: rampe(0x8a8a84),
    corde: rampe(0xb89a5a), osier: rampe(0xb08a4a), sepia: rampe(0x7a5a3a), verre: [0x0a0c14, 0x141a2a, 0x1e2840, 0x3a4a70, 0x6a7aa0, 0xb0c0e0],
    platreChaud: [0x7a5a34, 0x9a7444, 0xba9056, 0xd8ac6a, 0xecc888, 0xfae4b0], platreFroid: [0x3e3a44, 0x5a5462, 0x77707e, 0x958c98, 0xb0a6ae, 0xc8bec2],
    couverture: rampeVive(0x8a3a2a), plan: [0x2a3e5a, 0x3e5a7a, 0x5a7a9a, 0x8aa2b8, 0xb8c8d4, 0xdce4ea],
  };
  return RAMPES_BUREAU_CACHE;
}
function toileBureau(l, h) { const t = toileDecor(l, h); Object.assign(t.rampes, rampesBureau()); return t; }
// La texture, et sa version éclairée (« _clair ») : chaque pixel d'un ton plus clair, pour le survol
function textureEtClair(t, scene, cle) {
  t.texture(scene, cle);
  const c = t.c.slice();
  for (let i = 0; i < t.c.length; i++) if (t.m[i] && t.rampes[t.m[i]]) t.c[i] = t.rampes[t.m[i]][Math.min(5, t.k[i] + 1)];
  t.texture(scene, cle + '_clair');
  t.c = c;
}
// Un trait de pixels (pour les plans, les cotes, les dessins à l'encre)
function traitBureau(t, x0, y0, x1, y1, mat, ton) {
  const n = Math.max(1, Math.round(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
  for (let k = 0; k <= n; k++) t.poser(Math.round(x0 + (x1 - x0) * k / n), Math.round(y0 + (y1 - y0) * k / n), mat, ton);
}

// ===================================================================================================================
// La porte d'intérieur de l'arrière-boutique (chambre, bureau) : 100 × 180 à l'écran (la porte de la rue en fait 220)
// ===================================================================================================================
const PORTE_INT = { L: 50, H: 90, cadre: 6, haut: 10, VL: 38, VH: 80 };
const ANGLES_PORTE = [0, 15, 30, 45, 60, 75];
// Le vantail à plat, vu de face (la poignée à gauche, les fiches à droite ; `miroir` : l'inverse)
function vantailInterieur(miroir = false) {
  const { VL: L, VH: H } = PORTE_INT, t = toileBureau(L, H);
  for (let x = 0; x < L; x += 5) planche(t, x, 0, Math.min(5, L - x), H, 'chene', { horizontale: false, graine: 8801 + x, noeuds: 0 });
  for (const [y0, h] of [[0, 5], [42, 7], [72, 8]]) planche(t, 0, y0, L, h, 'chene', { graine: 8811 + y0, noeuds: 0 });
  for (let y = 5; y < 72; y++) for (const x of [17, 18, 19, 20]) planche(t, x, y, 1, 1, 'chene', { graine: 8820, noeuds: 0 });
  // les quatre panneaux, en creux, avec leur plate-bande en biseau
  [[5, 5, 12, 37], [21, 5, 12, 37], [5, 49, 12, 23], [21, 49, 12, 23]].forEach(([x0, y0, l, h], k) => {
    planche(t, x0, y0, l, h, 'chene', { horizontale: false, graine: 8830 + k, noeuds: k === 1 ? 1 : 0, usure: false });
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + l; x++) {
      const b = Math.min(x - x0, y - y0, x0 + l - 1 - x, y0 + h - 1 - y);
      if (b === 0) t.poser(x, y, 'cheneSombre', (x === x0 + l - 1 || y === y0 + h - 1) ? 4 : 0);
      else if (b === 1) t.poser(x, y, 'chene', (x === x0 + 1 || y === y0 + 1) ? 1 : 5);
      else if (b === 2) t.poser(x, y, 'chene', (x === x0 + 2 || y === y0 + 2) ? 2 : 4);
    }
  });
  for (let y = 0; y < H; y++) { t.poser(0, y, 'chene', 5); t.poser(L - 1, y, 'cheneSombre', 1); }
  for (let x = 0; x < L; x++) { t.poser(x, 0, 'chene', 5); t.poser(x, H - 1, 'cheneSombre', 1); }
  // le bec-de-cane (côté libre) : la rosace allongée, la béquille qui pointe vers le milieu, l'entrée de serrure ; les fiches
  const px = 2;
  for (let y = 41; y < 53; y++) for (let x = px; x < px + 3; x++) t.poser(x, y, 'laiton', y === 41 || x === px ? 5 : (y === 52 || x === px + 2) ? 2 : 4);
  for (let x = px + 1; x < px + 8; x++) { t.poser(x, 44, 'laiton', 5); t.poser(x, 45, 'laiton', x === px + 7 ? 3 : 2); }
  t.poser(px + 8, 45, 'laiton', 2); t.poser(px + 7, 46, 'cheneSombre', 0);
  for (let x = px + 3; x < px + 8; x++) t.poser(x, 46, 'cheneSombre', 1);
  t.poser(px + 1, 49, 'cheneSombre', 0); t.poser(px + 1, 50, 'cheneSombre', 0);
  for (const y0 of [8, 66]) for (let y = y0; y < y0 + 6; y++) { t.poser(L - 2, y, 'laiton', y === y0 ? 5 : y === y0 + 5 ? 1 : 3); t.poser(L - 1, y, 'laiton', y === y0 + 2 ? 5 : 2); }
  if (miroir) { const c = t.c.slice(), m = t.m.slice(), k = t.k.slice(); for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) { const a = y * L + x, b = y * L + (L - 1 - x); t.c[a] = c[b]; t.m[a] = m[b]; t.k[a] = k[b]; } }
  return t;
}
// Le vantail qui pivote sur ses fiches (à droite) et s'éloigne de nous : son bord libre rapetisse un peu
function vantailQuiSeloigne(src, deg) {
  const { VL, VH } = PORTE_INT, a = deg * Math.PI / 180, l = Math.max(2, Math.round(VL * Math.cos(a))), f = 1 / (1 + 0.12 * Math.sin(a)), oeil = VH * 0.28;
  const t = toileBureau(VL, VH);
  for (let X = 0; X < l; X++) {
    const u = 1 - (X + 0.5) / l, ech = 1 + (f - 1) * u;
    for (let Y = 0; Y < VH; Y++) {
      const y = Math.floor(oeil + (Y + 0.5 - oeil) / ech), x = Math.min(VL - 1, Math.floor((X + 0.5) / l * VL));
      if (y < 0 || y >= VH) continue;
      const idx = y * VL + x; if (!src.m[idx]) continue;
      t.poser(VL - l + X, Y, src.m[idx], src.k[idx] - (deg > 50 ? 1 : 0));
    }
  }
  // l'épaisseur du vantail, au bord libre
  for (let Y = 0; Y < VH; Y++) { const y = oeil + (Y + 0.5 - oeil) * f; if (y >= 0 && y < VH) { t.poser(VL - l - 1, Y, 'cheneSombre', 3); if (deg > 40) t.poser(VL - l - 2, Y, 'chene', 2); } }
  return t;
}
// Ce qu'on voit par la porte ouverte : le bureau (enduit doré, lambris, un pied de table, les plans au mur) ou la chambre
function dedansPorte(quoi) {
  const { VL, VH } = PORTE_INT, t = toileBureau(VL, VH), chambre = quoi === 'chambre', mur = chambre ? 'platre' : 'platreChaud';
  for (let y = 0; y < VH; y++) for (let x = 0; x < VL; x++) {
    if (y < 50) t.poser(x, y, mur, 3 + Math.round((fbm(x * 0.2, y * 0.2, 8851) - 0.5) * 1.4) + (!chambre && x > 14 && x < 30 && y > 8 ? 1 : 0) - (chambre ? 1 : 0));
    else if (y < 52) t.poser(x, y, 'cheneSombre', y === 50 ? 4 : 2);
    else if (y < 68) t.poser(x, y, 'chene', ((x % 6) === 0 ? 1 : 3) + (!chambre && x > 16 && x < 32 ? 1 : 0) - (chambre ? 1 : 0));
    else t.poser(x, y, 'chene', ((x + Math.floor((y - 68) / 3) * 7) % 13 === 0 ? 1 : 3) + (y > 74 ? 1 : 0) - (chambre ? 1 : 0));
  }
  if (chambre) {
    // le pied du lit et sa couverture qui tombe, la lueur de la fenêtre sur le mur
    for (let y = 40; y < 76; y++) for (let x = 0; x < 15; x++) { const pli = Math.sin((x + y * 0.3) * 0.9) > 0.6; t.poser(x, y, y < 44 ? 'cheneSombre' : 'couverture', y < 44 ? (y === 40 ? 4 : 2) : (pli ? 2 : 3) + (x < 2 ? 1 : 0)); }
    for (let y = 44; y < 78; y++) { t.poser(15, y, 'cheneSombre', 1); t.poser(16, y, 'cheneSombre', 2); }
    for (let y = 8; y < 30; y++) for (let x = 24; x < 34; x++) if ((x + y) % 2 === 0) t.poser(x, y, 'platre', 4);
  } else {
    for (let y = 10; y < 26; y++) for (let x = 4; x < 12; x++) t.poser(x, y, 'cheneSombre', (x === 4 || y === 10) ? 3 : 1);   // (un cadre au mur : les plans)
    for (let y = 12; y < 24; y++) for (let x = 6; x < 10; x++) t.poser(x, y, 'parchemin', 4);
    for (let y = 54; y < 76; y++) { t.poser(28, y, 'cheneSombre', 2); t.poser(29, y, 'cheneSombre', 3); }   // (le pied de la table)
    for (let x = 22; x < VL; x++) { t.poser(x, 53, 'chene', 5); t.poser(x, 54, 'cheneSombre', 2); }
  }
  return t;
}
function texturesPorteInterieure(s) {
  if (s.textures.exists('porteInt_chambranle')) return;
  creerInterieurHD(s);
  const { L, H, cadre, haut } = PORTE_INT;
  // le chambranle : deux montants moulurés, la traverse du haut, une petite corniche ; le seuil de chêne sombre
  { const t = toileBureau(L, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) {
      if (x >= cadre && x < L - cadre && y >= haut) continue;
      if (y < 3) { t.poser(x, y, 'cheneSombre', y === 0 ? 5 : y === 1 ? 3 : 1); continue; }
      const d = y >= haut ? Math.min(x, L - 1 - x) : Math.min(x, L - 1 - x, y - 3), cote = y >= haut ? (x < cadre ? 'g' : 'd') : 'h';
      t.poser(x, y, 'chene', [1, 4, 5, 2, 3, 2][Math.min(5, d)] + (cote === 'd' && d < 2 ? -1 : 0));
    }
    for (let x = 0; x < L; x++) t.poser(x, 3, 'cheneSombre', 0);
    for (let x = cadre; x < L - cadre; x++) t.poser(x, haut, 'cheneSombre', 0);
    for (let x = cadre - 1; x < L - cadre + 1; x++) { t.poser(x, H - 1, 'cheneSombre', 2); t.poser(x, H - 2, 'cheneSombre', 4); }
    t.contour(); t.texture(s, 'porteInt_chambranle'); }
  const plat = vantailInterieur(false);
  plat.texture(s, 'porteInt_v0');
  for (const deg of ANGLES_PORTE.slice(1)) { const t = vantailQuiSeloigne(plat, deg); t.contour(); t.texture(s, 'porteInt_v' + deg); }
  dedansPorte('bureau').texture(s, 'porteInt_dedans_bureau');
  dedansPorte('chambre').texture(s, 'porteInt_dedans_chambre');
}

// Une porte d'intérieur posée : x = son milieu, sol = le bas. Renvoie la porte : ses images, `ouvrir()`/`fermer()` (des
// promesses : le vantail tourne image par image), `poignee` (où est le bec-de-cane, à l'écran), `ouverture` (le passage).
function poserPorteInterieure(s, x, sol, { prof = 3.2, ecriteau = null, dedans = 'bureau' } = {}) {
  texturesPorteInterieure(s); creerHalo(s);
  const { L, H, cadre, haut, VL } = PORTE_INT, x0 = x - L, y0 = sol - H * 2, ox = x0 + cadre * 2, oy = y0 + haut * 2;
  const p = { x, sol, prof, etat: 0, images: [] };
  p.dedans = s.add.image(ox, oy, 'porteInt_dedans_' + dedans).setOrigin(0).setScale(2).setDepth(prof - 0.03);
  p.vantail = s.add.image(ox, oy, 'porteInt_v0').setOrigin(0).setScale(2).setDepth(prof - 0.02);
  p.chambranle = s.add.image(x0, y0, 'porteInt_chambranle').setOrigin(0).setScale(2).setDepth(prof);
  // la lumière de la pièce d'à côté, quand la porte s'ouvre : par l'ouverture, et sur le plancher
  p.lueur = s.add.image(x, sol - 70, 'halo').setScale(1.1, 1.6).setTint(dedans === 'chambre' ? 0xd8c0a0 : 0xffc870).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD).setDepth(prof - 0.01);
  p.solLueur = s.add.graphics().setDepth(prof + 0.3).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
  p.solLueur.fillStyle(0xffd890, 0.16).fillPoints([{ x: ox, y: sol }, { x: ox + VL * 2, y: sol }, { x: ox + VL * 2 + 44, y: sol + 64 }, { x: ox - 30, y: sol + 64 }], true);
  p.solLueur.fillStyle(0xffd890, 0.1).fillPoints([{ x: ox + 8, y: sol }, { x: ox + VL * 2 - 8, y: sol }, { x: ox + VL * 2 + 16, y: sol + 40 }, { x: ox - 10, y: sol + 40 }], true);
  p.images.push(p.dedans, p.vantail, p.chambranle, p.lueur, p.solLueur);
  // la plaque de laiton vissée sur la frise du chambranle
  if (ecriteau) {
    const g = s.add.graphics().setDepth(prof + 0.01), ey = y0 + 13;
    const texte = s.add.text(x, ey, ecriteau, style(10, '#3a2006', { fontStyle: 'bold italic', brut: true })).setOrigin(0.5).setDepth(prof + 0.02);
    const w = Math.min(L * 2 - 8, Math.max(56, Math.ceil(texte.width) + 14));
    if (texte.width > w - 8) texte.setScale((w - 8) / texte.width);
    g.fillStyle(0x4a3008).fillRoundedRect(x - w / 2 - 1, ey - 8, w + 2, 16, 3).fillStyle(0xc8962a).fillRoundedRect(x - w / 2, ey - 7, w, 14, 3)
      .fillStyle(0xe8c050).fillRect(x - w / 2 + 2, ey - 6, w - 4, 2).fillStyle(0x8a6418).fillRect(x - w / 2 + 2, ey + 5, w - 4, 1);
    g.fillStyle(0x5a3a0a).fillCircle(x - w / 2 + 4, ey, 1.2).fillCircle(x + w / 2 - 4, ey, 1.2);
    p.plaque = [g, texte]; p.images.push(g, texte);
  }
  p.poignee = { x: ox + 14, y: oy + 90 };
  p.ouverture = { x: ox + VL, haut: oy, l: VL * 2 };
  p.decaler = dx => { p.x += dx; p.poignee.x += dx; p.ouverture.x += dx; };   // (la promenade pose la pièce plus loin)
  p.montrer = deg => {
    p.etat = deg;
    if (!p.vantail.active) return;
    p.vantail.setTexture('porteInt_v' + deg);
    p.lueur.setAlpha(0.55 * deg / 75); p.solLueur.setAlpha(deg / 75);
  };
  const tourner = (vers) => new Promise(ok => {
    const i0 = ANGLES_PORTE.indexOf(p.etat), i1 = ANGLES_PORTE.indexOf(vers), pas = i1 > i0 ? 1 : -1;
    if (i0 === i1) return ok();
    let i = i0;
    const suivant = () => { i += pas; p.montrer(ANGLES_PORTE[i]); if (i === i1) return ok(); s.time.delayedCall(70, suivant); };
    s.time.delayedCall(40, suivant);
  });
  p.ouvrir = () => { if (typeof Son !== 'undefined') Son.jouer('porte'); return tourner(75); };
  p.fermer = () => tourner(0).then(() => { if (typeof Son !== 'undefined') Son.jouer('glisse'); });
  p.detruire = () => { for (const o of p.images) if (o && o.destroy) o.destroy(); };
  return p;
}

// ===================================================================================================================
// La même porte, vue du bureau : plus près (128 × 324 à l'écran), la poignée à droite, les fiches à gauche ; le vantail
// s'ouvre vers nous (son bord libre grandit un peu en approchant)
// ===================================================================================================================
const PORTE_GRANDE = { L: 64, H: 162, cadre: 7, haut: 12, VL: 50, VH: 150, marge: 8 };
function vantailGrand() {
  const { VL, VH } = PORTE_GRANDE, t = toileBureau(VL, VH);
  const st = 7, mt = 6, tr = 8, lockY = Math.round(VH * 0.52), lr = 9, br = 15, pw = Math.floor((VL - 2 * st - mt) / 2);
  for (let x = 0; x < VL; x += 7) planche(t, x, 0, Math.min(7, VL - x), VH, 'chene', { horizontale: false, graine: 8901 + x, noeuds: 0 });
  for (const [y0, h] of [[0, tr], [lockY, lr], [VH - br, br]]) planche(t, 0, y0, VL, h, 'chene', { graine: 8911 + y0, noeuds: 0 });
  [[st, tr, pw, lockY - tr], [st + pw + mt, tr, pw, lockY - tr], [st, lockY + lr, pw, VH - br - lockY - lr], [st + pw + mt, lockY + lr, pw, VH - br - lockY - lr]].forEach(([x0, y0, l, h], k) => {
    planche(t, x0, y0, l, h, 'chene', { horizontale: false, graine: 8930 + k, noeuds: k === 2 ? 1 : 0, usure: false });
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + l; x++) { const b = Math.min(x - x0, y - y0, x0 + l - 1 - x, y0 + h - 1 - y);
      if (b === 0) t.poser(x, y, 'cheneSombre', (x === x0 + l - 1 || y === y0 + h - 1) ? 4 : 0);
      else if (b === 1) t.poser(x, y, 'chene', (x === x0 + 1 || y === y0 + 1) ? 1 : 5);
      else if (b <= 3) t.poser(x, y, 'chene', (x - x0 === b || y - y0 === b) ? 2 : 4); }
  });
  for (let y = 0; y < VH; y++) { t.poser(0, y, 'chene', 5); t.poser(VL - 1, y, 'cheneSombre', 1); }
  for (let x = 0; x < VL; x++) { t.poser(x, 0, 'cheneSombre', 0); t.poser(x, VH - 1, 'cheneSombre', 1); }
  const px = VL - 6, ly = lockY + 2;
  for (let y = ly - 4; y < ly + 12; y++) for (let x = px; x < px + 4; x++) t.poser(x, y, 'laiton', y === ly - 4 || x === px ? 5 : (y === ly + 11 || x === px + 3) ? 2 : 4);
  for (let x = px - 9; x < px + 2; x++) { t.poser(x, ly, 'laiton', 5); t.poser(x, ly + 1, 'laiton', 3); t.poser(x, ly + 2, 'cheneSombre', 1); }
  t.poser(px - 10, ly + 1, 'laiton', 2);
  for (const y of [ly + 6, ly + 7, ly + 8]) { t.poser(px + 1, y, 'cheneSombre', 0); t.poser(px + 2, y, y === ly + 8 ? 'cheneSombre' : 'laiton', 0); }
  for (const y0 of [Math.round(VH * 0.08), Math.round(VH * 0.84)]) for (let y = y0; y < y0 + 9; y++) { t.poser(0, y, 'laiton', y === y0 ? 5 : y === y0 + 8 ? 1 : 4); t.poser(1, y, 'laiton', y === y0 + 3 ? 5 : 2); }
  return t;
}
// Le vantail qui pivote sur ses fiches (à gauche) et vient vers nous : la toile a `marge` pixels de plus en haut et en bas
function vantailQuiVient(src, deg) {
  const { VL, VH, marge } = PORTE_GRANDE, a = deg * Math.PI / 180, l = Math.max(2, Math.round(VL * Math.cos(a))), f = 1 + 0.12 * Math.sin(a), oeil = VH * 0.3;
  const t = toileBureau(VL + 3, VH + 2 * marge);
  for (let X = 0; X < l; X++) {
    const u = (X + 0.5) / l, ech = 1 + (f - 1) * u, x = Math.min(VL - 1, Math.floor(u * VL));
    for (let Y = 0; Y < VH + 2 * marge; Y++) {
      const y = Math.floor(oeil + (Y - marge + 0.5 - oeil) / ech);
      if (y < 0 || y >= VH) continue;
      const idx = y * VL + x; if (!src.m[idx]) continue;
      t.poser(X, Y, src.m[idx], src.k[idx] - (deg > 50 ? 1 : 0));
    }
  }
  // l'épaisseur du vantail, au bord libre, qui se montre de plus en plus
  const ep = deg > 30 ? 2 : 1;
  for (let Y = 0; Y < VH + 2 * marge; Y++) { const y = oeil + (Y - marge + 0.5 - oeil) / f; if (y >= 0 && y < VH) for (let e = 0; e < ep; e++) t.poser(l + e, Y, e ? 'cheneSombre' : 'chene', e ? 2 : 3); }
  return t;
}
// L'arrière-boutique, vue du bureau par la porte ouverte : l'enduit, le lambris, le plancher, la lueur d'une bougie
function dehorsPorteGrande() {
  const { VL, VH } = PORTE_GRANDE, t = toileBureau(VL, VH);
  for (let y = 0; y < VH; y++) for (let x = 0; x < VL; x++) {
    const lum = Math.max(0, 1 - Math.hypot(x - 34, y - 52) / 40);
    if (y < 96) t.poser(x, y, 'platreChaud', 1 + Math.round((fbm(x * 0.15, y * 0.15, 8961) - 0.5) * 1.4 + lum * 1.8));
    else if (y < 99) t.poser(x, y, 'cheneSombre', y === 96 ? 4 : 2);
    else if (y < 126) t.poser(x, y, 'chene', ((x % 7) === 0 ? 1 : 2) + (lum > 0.2 ? 1 : 0));
    else t.poser(x, y, 'chene', ((x + Math.floor((y - 126) / 4) * 9) % 17 === 0 ? 1 : 2) + (y > 140 ? 1 : 0));
  }
  // un bouquet d'herbes qui sèche sous la poutre, la bougie sur son appui
  for (let y = 0; y < 22; y++) { const w = Math.max(0, Math.round((y - 6) * 0.35)); for (let dx = -w; dx <= w; dx++) t.poser(12 + dx, y, y < 6 ? 'corde' : 'vert', y < 6 ? 3 : 2 + ((dx + y) % 3 === 0 ? 1 : 0)); }
  for (let x = 26; x < 44; x++) { t.poser(x, 66, 'cheneSombre', 4); t.poser(x, 67, 'cheneSombre', 2); }
  for (let y = 58; y < 66; y++) { t.poser(34, y, 'cire', 4); t.poser(35, y, 'cire', 3); }
  t.poser(34, 56, 'lueur', 5); t.poser(35, 57, 'lueur', 4); t.poser(34, 57, 'lueur', 5);
  return t;
}
function texturesPorteGrande(s) {
  if (s.textures.exists('porteGrande_chambranle')) return;
  const { L, H, cadre, haut } = PORTE_GRANDE;
  { const t = toileBureau(L, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) {
      if (x >= cadre && x < L - cadre && y >= haut) continue;
      if (y < 4) { t.poser(x, y, 'cheneSombre', y === 0 ? 5 : y === 1 ? 4 : y === 2 ? 3 : 1); continue; }
      const d = y >= haut ? Math.min(x, L - 1 - x) : Math.min(x, L - 1 - x, y - 4);
      t.poser(x, y, 'chene', [1, 4, 5, 3, 2, 3, 4][Math.min(6, d)] + ((y >= haut && x >= L - cadre && d < 2) ? -1 : 0));
    }
    for (let x = 0; x < L; x++) t.poser(x, 4, 'cheneSombre', 0);
    for (let x = cadre; x < L - cadre; x++) t.poser(x, haut, 'cheneSombre', 0);
    t.contour(); textureEtClair(t, s, 'porteGrande_chambranle'); }
  const plat = vantailGrand();
  for (const deg of ANGLES_PORTE) {
    const t = deg ? vantailQuiVient(plat, deg) : (() => { const v = toileBureau(PORTE_GRANDE.VL + 3, PORTE_GRANDE.VH + 2 * PORTE_GRANDE.marge);
      for (let y = 0; y < PORTE_GRANDE.VH; y++) for (let x = 0; x < PORTE_GRANDE.VL; x++) { const i = y * PORTE_GRANDE.VL + x; if (plat.m[i]) v.poser(x, y + PORTE_GRANDE.marge, plat.m[i], plat.k[i]); }
      // le jour qui passe dessous (la lumière de l'arrière-boutique)
      for (let x = 1; x < PORTE_GRANDE.VL - 1; x++) v.poser(x, PORTE_GRANDE.VH + PORTE_GRANDE.marge - 1, 'parchemin', 4);
      return v; })();
    if (deg) t.contour();
    textureEtClair(t, s, 'porteGrande_v' + deg);
  }
  dehorsPorteGrande().texture(s, 'porteGrande_dehors');
}
// La porte du bureau, côté bureau : renvoie la porte (comme poserPorteInterieure), x = son milieu, sol = le bas
function poserPorteGrande(s, x, sol, { prof = 1, ecriteau = null } = {}) {
  texturesPorteGrande(s); creerHalo(s);
  const { L, H, cadre, haut, VL, VH, marge } = PORTE_GRANDE, x0 = x - L, y0 = sol - H * 2, ox = x0 + cadre * 2, oy = y0 + haut * 2;
  const p = { x, sol, prof, etat: 0, images: [] };
  p.dehors = s.add.image(ox, oy, 'porteGrande_dehors').setOrigin(0).setScale(2).setDepth(prof - 0.03);
  p.chambranle = s.add.image(x0, y0, 'porteGrande_chambranle').setOrigin(0).setScale(2).setDepth(prof);
  p.vantail = s.add.image(ox, oy - marge * 2, 'porteGrande_v0').setOrigin(0).setScale(2).setDepth(prof + 0.02);
  p.lueur = s.add.graphics().setDepth(prof + 0.01).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
  p.lueur.fillStyle(0xffd8a0, 0.12).fillPoints([{ x: ox + 20, y: sol }, { x: ox + VL * 2, y: sol }, { x: ox + VL * 2 - 10, y: sol + 70 }, { x: ox - 40, y: sol + 70 }], true);
  p.images.push(p.dehors, p.chambranle, p.vantail, p.lueur);
  if (ecriteau) {
    const g = s.add.graphics().setDepth(prof + 0.03), ey = y0 + 17;
    const texte = s.add.text(x, ey, ecriteau, style(11, '#3a2006', { fontStyle: 'bold italic', brut: true })).setOrigin(0.5).setDepth(prof + 0.04);
    const w = Math.min(L * 2 - 12, Math.ceil(texte.width) + 16);
    if (texte.width > w - 8) texte.setScale((w - 8) / texte.width);
    g.fillStyle(0x4a3008).fillRoundedRect(x - w / 2 - 1, ey - 9, w + 2, 18, 3).fillStyle(0xc8962a).fillRoundedRect(x - w / 2, ey - 8, w, 16, 3)
      .fillStyle(0xe8c050).fillRect(x - w / 2 + 2, ey - 7, w - 4, 2).fillStyle(0x8a6418).fillRect(x - w / 2 + 2, ey + 6, w - 4, 1);
    g.fillStyle(0x5a3a0a).fillCircle(x - w / 2 + 4, ey, 1.3).fillCircle(x + w / 2 - 4, ey, 1.3);
    p.plaque = [g, texte]; p.images.push(g, texte);
  }
  p.poignee = { x: ox + (VL - 8) * 2, y: oy + (Math.round(VH * 0.52) + 3) * 2 };
  p.ouverture = { x: ox + VL, haut: oy, l: VL * 2 };
  p.montrer = deg => {
    p.etat = deg;
    if (!p.vantail.active) return;
    p.vantail.setTexture('porteGrande_v' + deg + (p.survol ? '_clair' : ''));
    p.lueur.setAlpha(deg / 75);
  };
  p.eclairer = (oui) => { p.survol = oui; p.montrer(p.etat); p.chambranle.setTexture('porteGrande_chambranle' + (oui ? '_clair' : '')); };
  const tourner = (vers) => new Promise(ok => {
    const i0 = ANGLES_PORTE.indexOf(p.etat), i1 = ANGLES_PORTE.indexOf(vers), pas = i1 > i0 ? 1 : -1;
    if (i0 === i1) return ok();
    let i = i0;
    const suivant = () => { i += pas; p.montrer(ANGLES_PORTE[i]); if (i === i1) return ok(); s.time.delayedCall(70, suivant); };
    s.time.delayedCall(40, suivant);
  });
  p.ouvrir = () => { if (typeof Son !== 'undefined') Son.jouer('porte'); return tourner(75); };
  p.fermer = () => tourner(0).then(() => { if (typeof Son !== 'undefined') Son.jouer('glisse'); });
  p.detruire = () => { for (const o of p.images) if (o && o.destroy) o.destroy(); };
  return p;
}

// Où est la main tendue (pose « empoigne ») dans une texture du joueur : le pixel opaque le plus loin devant lui, à
// hauteur d'épaule. Renvoie { dx, dy } : depuis le milieu de ses pieds, en pixels de la texture (dy vers le haut).
const MAINS_TENDUES = {};
function mainTendue(scene, cle) {
  const tex = scene.textures.get(cle);
  if (MAINS_TENDUES[cle] && MAINS_TENDUES[cle].tenue === tex.tenue) return MAINS_TENDUES[cle];
  const img = tex.getSourceImage(), c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
  const d = ctx.getImageData(0, 0, img.width, img.height).data;
  let best = null;
  for (let y = Math.round(img.height * 0.15); y < img.height * 0.62; y++) for (let x = img.width - 1; x >= 0; x--) if (d[(y * img.width + x) * 4 + 3] > 128) { if (!best || x > best[0]) best = [x, y]; break; }
  if (!best) best = [img.width * 0.75, img.height * 0.45];
  return (MAINS_TENDUES[cle] = { dx: best[0] - 2 - img.width / 2, dy: img.height - best[1], tenue: tex.tenue });
}

// ===================================================================================================================
// Les meubles du bureau (chacun aussi en « _clair », pour le survol)
// ===================================================================================================================
// Les tiroirs du meuble des carnets, dans l'ordre (deux colonnes de cinq) ; null : un tiroir vide
const TIROIRS_BUREAU = [['reputation', 'Réputation'], ['camps', 'Lumière et ombre'], ['etrange', 'Choses étranges'], ['aventuriers', 'Les missions'],
  ['commerce', 'Le commerce'], ['carnet', null], ['formes', 'Les formes'], ['voyage', 'Le voyage'], [null, ''], ['competences', 'Compétences']];
function texturesBureau(s) {
  if (s.textures.exists('bureauTable')) return;
  creerInterieurHD(s); creerBureauHD(s);
  // ---------- la table de travail, vue du côté du visiteur : le plateau, la ceinture et son tiroir, deux caissons à
  // tiroirs, le panneau de fond entre eux (il cache les jambes de celui qui écrit), la plinthe et ses pieds en boule ----------
  { const L = 130, H = 58, t = toileBureau(L, H);
    planche(t, 0, 0, L, 10, 'chene', { graine: 9301, noeuds: 3 });
    for (let x = 0; x < L; x++) { t.poser(x, 0, 'chene', 2); t.poser(x, 1, 'chene', 4); t.poser(x, 9, 'chene', 5); t.poser(x, 10, 'chene', 3); t.poser(x, 11, 'cheneSombre', 1); }
    planche(t, 2, 12, L - 4, 11, 'chene', { graine: 9302, noeuds: 1 });
    // le tiroir de ceinture, au milieu
    for (const [x0, x1] of [[44, 86]]) { for (let y = 13; y < 22; y++) { t.poser(x0, y, 'cheneSombre', 1); t.poser(x1, y, 'chene', 4); } for (let x = x0; x <= x1; x++) { t.poser(x, 13, 'cheneSombre', 1); t.poser(x, 21, 'chene', 4); }
      t.forme('laiton', ellipsoide((x0 + x1) / 2, 17.5, 3.2, 1.6), { decalage: 0.6 }); }
    for (let x = 2; x < L - 2; x++) t.poser(x, 22, 'cheneSombre', 0);
    // les deux caissons et leurs tiroirs ; le panneau de fond, en retrait
    for (let y = 23; y < 52; y++) for (let x = 40; x < 90; x++) t.poser(x, y, 'cheneSombre', y < 25 ? 0 : 2 + Math.round((fbm(x * 0.1, y * 0.1, 9303) - 0.5) * 1.2));
    for (let y = 27; y < 49; y++) { t.poser(45, y, 'cheneSombre', 1); t.poser(84, y, 'cheneSombre', 4); } for (let x = 45; x <= 84; x++) { t.poser(x, 27, 'cheneSombre', 1); t.poser(x, 48, 'cheneSombre', 4); }
    for (const x0 of [2, 90]) {
      planche(t, x0, 23, 38, 29, 'chene', { horizontale: false, graine: 9304 + x0, noeuds: 1 });
      for (let y = 23; y < 52; y++) { t.poser(x0, y, 'chene', 4); t.poser(x0 + 37, y, 'cheneSombre', 1); }
      for (const [y0, y1] of [[25, 37], [39, 50]]) {
        for (let x = x0 + 3; x < x0 + 35; x++) { t.poser(x, y0, 'cheneSombre', 1); t.poser(x, y1, 'chene', 5); }
        for (let y = y0; y <= y1; y++) { t.poser(x0 + 3, y, 'cheneSombre', 1); t.poser(x0 + 34, y, 'chene', 4); }
        moulure(t, x0 + 5, y0 + 2, 28, 0);
        t.forme('laiton', ellipsoide(x0 + 19, (y0 + y1) / 2 + 1, 2.6, 1.5), { decalage: 0.6 });
      }
    }
    for (let x = 0; x < L; x++) for (let y = 52; y < 55; y++) t.poser(x, y, 'cheneSombre', y === 52 ? 4 : 2);
    for (const cx of [6, 34, 96, 124]) t.forme('cheneSombre', ellipsoide(cx, 56, 3.4, 2.2), { decalage: 0.5 });
    t.contour(); textureEtClair(t, s, 'bureauTable'); }
  // ---------- la chaise à barreaux, vue de face (derrière la table) : deux montants et leurs pommeaux, trois barreaux ----------
  { const L = 46, H = 64, t = toileBureau(L, H);
    for (const x of [4, 38]) { for (let y = 3; y < H; y++) { t.poser(x, y, 'chene', 4); t.poser(x + 1, y, 'chene', 3); t.poser(x + 2, y, 'chene', 2); t.poser(x + 3, y, 'cheneSombre', 2); }
      t.forme('chene', ellipsoide(x + 1.5, 2.2, 2.4, 2.2), { decalage: 0.6 }); }
    for (const [y, h] of [[6, 5], [17, 3], [27, 3]]) for (let x = 8; x < 38; x++) { const c = Math.round(Math.sin((x - 8) / 30 * Math.PI) * 1.4);
      for (let k = 0; k < h; k++) t.poser(x, y + k + c, 'chene', k === 0 ? 5 : k === h - 1 ? 1 : 3); }
    for (let x = 2; x < 44; x++) for (let y = 40; y < 45; y++) t.poser(x, y, 'paille', y === 40 ? 5 : (x + y) % 3 === 0 ? 2 : 3);   // (l'assise paillée)
    t.contour(); t.texture(s, 'bureauChaise'); }
  // ---------- le registre ouvert sur la table : les pages, et ses cinq signets qui pendent par-dessus le bord ----------
  { const L = 54, H = 30, t = toileBureau(L, H), dos = 27;
    for (let x = 1; x < L - 1; x++) for (let y = 13; y < 16; y++) t.poser(x, y, 'cuirRouge', y === 15 ? 1 : 3);
    for (let x = 2; x < L - 2; x++) { const u = Math.abs(x + 0.5 - dos) / (dos - 2), haut = Math.round(3 + (1 - Math.sin(Math.min(1, u) * Math.PI / 2)) * 3 - (u > 0.85 ? (u - 0.85) * 8 : 0));
      for (let y = Math.max(0, haut); y < 13; y++) t.poser(x, y, 'parchemin', 4 + (y === haut ? 1 : 0) - (Math.abs(x + 0.5 - dos) < 2 ? 2 : 0) - (y > 10 ? 1 : 0));
      for (let y = 11; y < 13; y++) t.poser(x, y, 'parchemin', 2 + (y % 2)); }
    for (let y = 5; y < 11; y += 2) for (const [a, b] of [[5, 24], [30, 49]]) for (let x = a; x < b; x++) if (hachage(x, y, 8303) > 0.3) t.poser(x, y, 'encre', 3);
    [['cuirRouge', 21], ['bleu', 24], ['vert', 27], ['orR', 30], ['violetR', 33]].forEach(([m, x], k) => { const l = 6 + (k % 3) * 2 + (k === 1 ? 4 : 0); for (let y = 14; y < 15 + l; y++) for (const dx of [0, 1]) t.poser(x + dx, y, m, 3 + (dx ? -1 : 0) + (y === 14 + l ? -1 : 0)); });
    t.contour(); textureEtClair(t, s, 'bureauRegistre'); }
  // ---------- la feuille du jour, à plat, sous son galet ; l'encrier et sa plume ; la pile de vieux registres ----------
  { const t = toileBureau(26, 9);
    for (let y = 2; y < 9; y++) for (let x = 0; x < 24; x++) t.poser(x + Math.round((8 - y) * 0.3), y, 'parchemin', y === 2 ? 5 : 4 - (x === 23 ? 1 : 0));
    for (let y = 4; y < 8; y += 2) for (let x = 3; x < 19; x++) if (hachage(x, y, 8304) > 0.35) t.poser(x + 2, y, 'encre', 3);
    t.forme('galet', ellipsoide(20, 3.6, 3.8, 2.4), { decalage: 0.4 });
    t.contour(); textureEtClair(t, s, 'bureauFeuille'); }
  { const t = toileBureau(14, 24);
    t.forme('verre', ellipsoide(5, 19.5, 4, 3.4, (x, y) => y >= 17), { decalage: -0.6 }); t.forme('cheneSombre', ellipsoide(5, 16.4, 2, 1), { decalage: 0.4 });
    for (let k = 0; k < 15; k++) { const x = Math.round(6 + k * 0.42), y = 15 - k; t.poser(x, y, 'lin', 5); if (k > 4) { t.poser(x + 1, y, 'lin', 3); t.poser(x + 2, y + 1, 'lin', 2); } if (k > 7 && k < 13) t.poser(x + 3, y + 1, 'lin', 2); }
    t.contour(); t.texture(s, 'bureauEncrier'); }
  { const L = 32, H = 42, t = toileBureau(L, H);
    [['cuirRouge', 0], ['cuirB', 6], ['vert', 12]].forEach(([m, y0], k) => { for (let y = y0; y < y0 + 6; y++) for (let x = 2 + k; x < 28 + k % 2; x++) t.poser(x, y, (x === 2 + k || x === 27 + k % 2) ? m : y === y0 ? m : 'parchemin', y === y0 ? 4 : (x === 2 + k) ? 3 : y === y0 + 5 ? 2 : 3); });
    planche(t, 0, 18, L, 5, 'chene', { graine: 8318, noeuds: 1 });
    for (const x of [3, 26]) for (let y = 23; y < H; y++) { t.poser(x, y, 'chene', 4); t.poser(x + 1, y, 'chene', 2); t.poser(x + 2, y, 'chene', 2); }
    for (let x = 4; x < 27; x++) t.poser(x, 33, 'chene', 3);
    t.contour(); t.texture(s, 'bureauTabouret'); }
  { const t = toileBureau(18, 20);
    t.forme('osier', (x, y) => (y >= 6 && y <= 19 && Math.abs(x + 0.5 - 9) <= 7 - (y - 6) * 0.12 ? [(x + 0.5 - 9) / 8, 0.1, 0.8] : null), { motif: (x, y) => ((x + y) % 2 ? -0.6 : 0) });
    for (const [x, y] of [[6, 5], [11, 4], [9, 6]]) t.forme('parchemin', ellipsoide(x, y, 2.6, 2.2), { decalage: 0.4, motif: (xx, yy) => (hachage(xx, yy, 8319) > 0.6 ? -1 : 0) });
    t.contour(); t.texture(s, 'bureauCorbeille'); }
  // ---------- l'ardoise des comptes, pendue à son clou par une ficelle ----------
  { const L = 58, H = 56, t = toileBureau(L, H);
    for (let k = 0; k <= 12; k++) { const u = k / 12; t.poser(Math.round(6 + u * 23), Math.round(7 - u * 6), 'corde', 3); t.poser(Math.round(52 - u * 23), Math.round(7 - u * 6), 'corde', 2); }
    t.forme('fer', ellipsoide(29, 1, 1.4, 1.2), { decalage: 0.6 });
    for (let y = 6; y < H; y++) for (let x = 0; x < L; x++) { const b = Math.min(x, y - 6, L - 1 - x, H - 1 - y);
      if (b < 3) t.poser(x, y, 'chene', b === 0 ? 1 : (x < 3 || y < 9 ? 4 : 2)); else { let i = 2 + Math.round((fbm(x * 0.15, y * 0.15, 8310) - 0.5) * 1.6); if (hachage(x, y, 8311) < 0.03) i++; t.poser(x, y, 'ardoise', i); } }
    for (let k = 0; k < 5; k++) { const yy = 14 + hachage(k, 1, 8312) * 34, xx = 6 + hachage(k, 2, 8312) * 30; for (let q = 0; q < 16; q++) if (hachage(k, q, 8313) < 0.5) t.poser(Math.round(xx + q), Math.round(yy + Math.sin(q / 3) * 1.4), 'ardoise', 4); }
    for (let x = 6; x < 13; x++) { t.poser(x, H - 3, 'lin', 5); t.poser(x, H - 4, 'lin', 4); }   // (un bout de craie, sur le cadre)
    t.contour(); textureEtClair(t, s, 'bureauArdoise'); }
  // ---------- les plans de la maison, punaisés : l'élévation à l'encre sépia, des cotes, le sceau de l'architecte ----------
  { const L = 46, H = 44, t = toileBureau(L, H);
    for (let y = 2; y < H; y++) for (let x = 1; x < L - 1; x++) { const b = Math.min(x - 1, y - 2, L - 2 - x, H - 1 - y); if (b < 2 - fbm(x * 0.4, y * 0.4, 8315) * 2) continue; t.poser(x, y, 'parchemin', 4 + Math.round((fbm(x * 0.08, y * 0.08, 8316) - 0.55) * 2) - (b < 2 ? 1 : 0)); }
    const T2 = (a, b, c, d) => traitBureau(t, a, b, c, d, 'sepia', 2);
    T2(9, 18, 23, 7); T2(23, 7, 37, 18); T2(9, 18, 37, 18); T2(11, 18, 11, 36); T2(35, 18, 35, 36); T2(11, 36, 35, 36); T2(11, 27, 35, 27);
    T2(21, 29, 21, 36); T2(26, 29, 26, 36); T2(21, 29, 26, 29); for (const fx of [14, 29]) { T2(fx, 20, fx + 4, 20); T2(fx, 24, fx + 4, 24); T2(fx, 20, fx, 24); T2(fx + 4, 20, fx + 4, 24); }
    T2(11, 39, 35, 39); T2(11, 38, 11, 40); T2(35, 38, 35, 40); T2(40, 18, 40, 36); T2(39, 18, 41, 18); T2(39, 36, 41, 36);
    t.forme('rougeP', ellipsoide(6, 38, 2.6, 2.6), { decalage: 0.3 });
    for (const [x, y] of [[3, 4], [L - 4, 4], [3, H - 3], [L - 4, H - 3]]) t.forme('fer', ellipsoide(x, y, 1.3, 1.3), { decalage: 0.6 });
    t.contour(); textureEtClair(t, s, 'bureauPlans'); }
  // ---------- le carnet de la forge, pendu à un clou par sa cordelette ----------
  { const t = toileBureau(16, 26);
    for (let k = 0; k < 6; k++) { t.poser(8 - Math.round(k * 0.8), 1 + k, 'corde', 3); t.poser(8 + Math.round(k * 0.8), 1 + k, 'corde', 2); }
    t.forme('fer', ellipsoide(8, 1, 1.2, 1.1), { decalage: 0.6 });
    for (let y = 7; y < 26; y++) for (let x = 2; x < 14; x++) t.poser(x, y, x < 4 ? 'cuirRouge' : 'cuirB', x < 4 ? 2 : (y === 7 ? 4 : x === 13 ? 1 : 3));
    t.dessin(5, 13, ['.ooooo.', '..ooo..', '.ooooo.'], { o: ['fer', 1] });   // (l'enclume, frappée sur la couverture)
    t.contour(); textureEtClair(t, s, 'bureauCarnetForge'); }
}
// Le meuble à tiroirs : deux colonnes de cinq tiroirs ; un porte-étiquette de laiton sur chacun, garni d'une carte s'il
// a son carnet (`actifs` : dix booléens)
function texMeubleBureau(s, actifs) {
  const cle = 'bureauMeuble_' + actifs.map(a => (a ? 1 : 0)).join('');
  if (s.textures.exists(cle)) return cle;
  const L = 92, H = 164, t = toileBureau(L, H);
  planche(t, 0, 0, L, 7, 'cheneSombre', { graine: 8305, noeuds: 2 });
  for (let x = 0; x < L; x++) { t.poser(x, 0, 'cheneSombre', 5); t.poser(x, 6, 'cheneSombre', 1); t.poser(x, 3, 'cheneSombre', 4); }
  planche(t, 2, 7, L - 4, 146, 'chene', { horizontale: false, graine: 8306, noeuds: 2 });
  for (let k = 0; k < 10; k++) { const col = k % 2, row = Math.floor(k / 2), x0 = 6 + col * 42, y0 = 9 + row * 29;
    planche(t, x0, y0, 38, 27, 'chene', { graine: 8307 + k, noeuds: hachage(k, 1, 8308) > 0.6 ? 1 : 0 });
    for (let x = x0; x < x0 + 38; x++) { t.poser(x, y0, 'chene', 5); t.poser(x, y0 + 26, 'cheneSombre', 1); t.poser(x, y0 - 1, 'cheneSombre', 0); }
    for (let y = y0; y < y0 + 27; y++) { t.poser(x0, y, 'chene', 4); t.poser(x0 + 37, y, 'cheneSombre', 1); }
    const cx = x0 + 19;
    for (let y = y0 + 6; y < y0 + 13; y++) for (let x = cx - 8; x <= cx + 8; x++) { const bord = y === y0 + 6 || y === y0 + 12 || x === cx - 8 || x === cx + 8;
      t.poser(x, y, bord ? 'laiton' : actifs[k] ? 'parchemin' : 'cheneSombre', bord ? (y === y0 + 6 || x === cx - 8 ? 5 : 2) : actifs[k] ? 4 : 1); }
    if (actifs[k]) for (let x = cx - 5; x <= cx + 5; x++) if (hachage(x, k, 8309) > 0.3) t.poser(x, y0 + 9, 'encre', 3);
    t.forme('laiton', ellipsoide(cx, y0 + 19, 2, 2), { decalage: 0.6 }); }
  for (let y = 153; y < H; y++) for (let x = 0; x < L; x++) { const pied = (x < 8 || x > L - 9) || y < 158; if (pied) t.poser(x, y, 'cheneSombre', y === 153 ? 4 : y === 157 ? 1 : 3); }
  t.contour(); textureEtClair(t, s, cle);
  return cle;
}
// Le tableau des succès, dans la pièce : du velours vert dans un cadre, les médailles en rangs (grises tant qu'on ne les a
// pas), la plaque de laiton. `ids` : les succès dans l'ordre du tableau ; `gagnes` : ceux qu'on a.
function texTableauSucces(s, ids, gagnes) {
  const cle = 'bureauSucces_' + ids.map(id => (gagnes.includes(id) ? 1 : 0)).join('');
  if (s.textures.exists(cle)) return cle;
  const L = 56, H = 62, t = toileBureau(L, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) { const b = Math.min(x, y, L - 1 - x, H - 1 - y);
    if (b < 3) t.poser(x, y, 'cheneSombre', b === 0 ? 0 : (x < 3 || y < 3 ? 4 : 2)); else t.poser(x, y, 'velours', 2 + Math.round((fbm(x * 0.3, y * 0.3, 8314) - 0.5) * 1.2) - (b === 3 ? 1 : 0)); }
  ids.slice(0, 35).forEach((id, k) => { const col = k % 7, row = Math.floor(k / 7), x = 6 + col * 7, y = 6 + row * 8, S = SUCCES[id], ok = gagnes.includes(id);
    const mat = ok ? { bronze: 'bronze', argent: 'argentM', or: 'orM', secret: 'violet' }[S.palier] : 'gris';
    t.poser(x + 1, y, ok ? 'cuirRouge' : 'gris', ok ? 3 : 1); t.poser(x + 2, y, ok ? 'bleu' : 'gris', ok ? 3 : 1); t.poser(x + 1, y + 1, ok ? 'cuirRouge' : 'gris', 2); t.poser(x + 2, y + 1, ok ? 'bleu' : 'gris', 2);
    t.forme(mat, ellipsoide(x + 2, y + 4, 2.4, 2.4), { decalage: ok ? 0.6 : -0.4, ombre: false }); });
  for (let y = H - 13; y < H - 5; y++) for (let x = 14; x < L - 14; x++) t.poser(x, y, 'laiton', y === H - 13 ? 5 : y === H - 6 ? 2 : 4);
  t.contour(); textureEtClair(t, s, cle);
  return cle;
}
// Le calendrier du mois, pendu au poteau : les jours passés barrés, aujourd'hui entouré de rouge
function texCalendrierBureau(s, jourDuMois) {
  const cle = 'bureauCalendrier_' + jourDuMois;
  if (s.textures.exists(cle)) return cle;
  const t = toileBureau(28, 36);
  t.forme('fer', ellipsoide(14, 1.5, 1.4, 1.3), { decalage: 0.6 });
  for (let y = 3; y < 36; y++) for (let x = 1; x < 27; x++) t.poser(x, y, 'parchemin', (x === 26 || y === 35) ? 2 : y < 9 ? 3 : 4);
  for (let x = 4; x < 24; x++) t.poser(x, 6, 'rougeP', 3);
  for (let k = 0; k < JOURS_PAR_MOIS; k++) { const c = k % 7, r = Math.floor(k / 7), X = Math.round(3 + c * 3.3), y = 12 + r * 6;
    t.poser(X, y, 'encre', 2); t.poser(X + 1, y, 'encre', 2);
    if (k + 1 < jourDuMois) { t.poser(X - 1, y + 1, 'encre', 3); t.poser(X + 2, y - 1, 'encre', 3); }
    if (k + 1 === jourDuMois) for (let a = 0; a < 6.28; a += 0.3) t.poser(Math.round(X + 0.5 + Math.cos(a) * 2.4), Math.round(y + Math.sin(a) * 2.2), 'rougeP', 4); }
  t.contour(); textureEtClair(t, s, cle);
  return cle;
}

// ===================================================================================================================
// Ce qu'on voit quand on s'approche d'un meuble
// ===================================================================================================================
function texturesZoomBureau(s) {
  if (s.textures.exists('zoomRegistre')) return;
  creerInterieurHD(s); creerBureauHD(s);
  // le grand registre ouvert : la couverture de cuir, les deux pages qui se bombent vers la reliure, la tranche des pages
  { const L = 300, H = 226, dos = 150, t = toileBureau(L, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) { const b = Math.min(x, y, L - 1 - x, H - 1 - y); if (b < 5) t.poser(x, y, 'cuirRouge', b === 0 ? 0 : (x < 5 || y < 5 ? 4 : 2) + Math.round((fbm(x * 0.3, y * 0.3, 8401) - 0.5))); }
    for (let y = 5; y < H - 5; y++) for (let x = 5; x < L - 5; x++) {
      const g = Math.abs(x + 0.5 - dos), bordPages = y > H - 12 || x < 9 || x > L - 10;
      if (bordPages) { t.poser(x, y, 'parchemin', ((y > H - 12 ? y : x) % 2) ? 2 : 3); continue; }
      let i = 4 + Math.round((fbm(x * 0.05, y * 0.06, 8402) - 0.5) * 0.9);
      if (g < 7) i -= Math.ceil((7 - g) / 1.8);
      if (y < 9) i += 1;
      t.poser(x, y, 'parchemin', i);
    }
    for (const [x, y] of [[0, 0], [L - 8, 0], [0, H - 8], [L - 8, H - 8]]) for (let j = 0; j < 8; j++) for (let k = 0; k < 8 - j; k++) t.poser(x === 0 ? x + k : x + 7 - k, y === 0 ? y + j : y + 7 - j, 'laiton', j === 0 || k === 0 ? 4 : 3);
    t.texture(s, 'zoomRegistre'); }
  // une page qui tourne : un feuillet seul (il se plie en tournant)
  { const L = 145, H = 214, t = toileBureau(L, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) t.poser(x, y, 'parchemin', 4 + Math.round((fbm(x * 0.05, y * 0.06, 8441) - 0.5) * 0.9) - (x < 4 ? 1 : 0) - (y > H - 3 ? 1 : 0));
    t.texture(s, 'zoomFeuillet'); }
  // les languettes : du cuir collé au bord des pages (une couleur par section), cousu tout autour ; le haut de la languette
  // est pris entre les feuilles. Une version « active » (la section où le livre est ouvert), plus claire.
  // (deux longueurs : quand elles sont nombreuses d'un côté, une sur deux dépasse plus, comme les onglets décalés d'un vrai registre)
  for (const [k, m] of ['cuirB', 'rougeR', 'bleu', 'vert', 'orR', 'violetR'].entries()) for (const actif of [0, 1]) for (const [suf, H] of [['', 24], ['_long', 34]]) {
    const L = 44, t = toileBureau(L, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) {
      const r = 5, coin = y > H - 1 - r && (x < r || x > L - 1 - r) && Math.hypot(x < r ? r - x - 0.5 : x + 0.5 - (L - r), y + 0.5 - (H - r)) > r;
      if (coin) continue;
      const b2 = Math.min(x, L - 1 - x, H - 1 - y);
      let i = 3 + actif - (b2 === 0 ? 2 : 0) + (x < 2 ? 1 : 0) - (y > H - 4 ? 1 : 0) + Math.round((fbm(x * 0.45, y * 0.45, 8420 + k) - 0.5) * 1.6) - (hachage(x, y, 8430 + k) < 0.08 ? 1 : 0);
      if (y < 2) i = y < 1 ? 0 : 2;
      t.poser(x, y, m, i);
    }
    for (let x = 3; x < L - 3; x += 2) t.poser(x, H - 3, m, 5);
    for (let y = 4; y < H - 3; y += 2) { t.poser(2, y, m, 5); t.poser(L - 3, y, m, 5); }
    t.contour(); t.texture(s, 'zoomLanguette' + k + suf + (actif ? '_actif' : ''));
  }
  // la feuille du jour, un peu froissée ; le galet qui la tient ; le billet de la date ; l'encrier en grand
  { const L = 140, H = 152, t = toileBureau(L, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) { const b = Math.min(x, y, L - 1 - x, H - 1 - y), d = fbm(x * 0.3, y * 0.3, 8403) * 2.4; if (b < d - 0.6) continue;
      let i = 4 + Math.round((fbm(x * 0.06, y * 0.06, 8404) - 0.55) * 2); if (b < d + 1.6) i -= 1; if (Math.abs(x - 70) < 0.6 && hachage(y, 1, 8405) > 0.3) i -= 1; t.poser(x, y, 'parchemin', i); }
    t.texture(s, 'zoomFeuilleJour'); }
  { const t = toileBureau(30, 18); t.forme('galet', ellipsoide(15, 10, 13, 7), { decalage: 0.5, motif: (x, y) => (fbm(x * 0.3, y * 0.3, 8406) > 0.6 ? -0.6 : 0) }); t.contour(); t.texture(s, 'zoomGalet'); }
  { const t = toileBureau(150, 16); for (let y = 0; y < 16; y++) for (let x = 0; x < 150; x++) { const b = Math.min(x, y, 149 - x, 15 - y); t.poser(x, y, 'parchemin', b === 0 ? 2 : 4 - (y > 13 ? 1 : 0)); } t.contour(); textureEtClair(t, s, 'zoomBillet'); }
  { const t = toileBureau(30, 54);
    t.forme('verre', (x, y) => (y >= 36 && y <= 53 && Math.abs(x + 0.5 - 11) <= 9 - Math.max(0, 40 - y) * 0.9 ? [(x + 0.5 - 11) / 10, 0, 0.8] : null), { decalage: -0.3 });
    t.forme('cheneSombre', (x, y) => (y >= 31 && y <= 36 && Math.abs(x + 0.5 - 11) <= 4 ? [(x - 11) / 5, 0, 0.8] : null), { decalage: 0.4 });
    for (let k = 0; k < 34; k++) { const x = Math.round(12 + k * 0.42), y = 34 - k; t.poser(x, y, 'lin', 5); if (k > 8) { t.poser(x + 1, y, 'lin', 4); t.poser(x + 2, y + 1, 'lin', 3); t.poser(x - 1, y + 1, 'lin', 3); } if (k > 14 && k < 30) { t.poser(x + 3, y + 1, 'lin', 2); t.poser(x - 2, y + 2, 'lin', 2); } }
    t.contour(); t.texture(s, 'zoomEncrier'); }
  // le meuble à tiroirs, de près : le bâti (les creux des tiroirs : celui qu'on tire laisse voir le noir)
  { const L = 210, H = 250, t = toileBureau(L, H);
    planche(t, 0, 0, L, 10, 'cheneSombre', { graine: 8407, noeuds: 3 }); for (let x = 0; x < L; x++) { t.poser(x, 0, 'cheneSombre', 5); t.poser(x, 9, 'cheneSombre', 1); t.poser(x, 4, 'cheneSombre', 4); }
    planche(t, 2, 10, L - 4, 232, 'chene', { horizontale: false, graine: 8408, noeuds: 2 });
    for (let y = 242; y < H; y++) for (let x = 0; x < L; x++) t.poser(x, y, 'cheneSombre', y === 242 ? 4 : 2);
    for (let k = 0; k < 10; k++) { const col = k % 2, row = Math.floor(k / 2), x0 = 8 + col * 99, y0 = 14 + row * 45; for (let y = y0; y < y0 + 42; y++) for (let x = x0; x < x0 + 95; x++) t.poser(x, y, 'cheneSombre', 0); }
    t.texture(s, 'zoomMeuble'); }
  const faceTiroir = (cle, carte) => { const L = 95, H = 42, t = toileBureau(L, H);
    planche(t, 0, 0, L, H, 'chene', { graine: 8409 + cle.length, noeuds: 1 });
    for (let x = 0; x < L; x++) { t.poser(x, 0, 'chene', 5); t.poser(x, 1, 'chene', 4); t.poser(x, H - 1, 'cheneSombre', 0); t.poser(x, H - 2, 'chene', 1); }
    for (let y = 0; y < H; y++) { t.poser(0, y, 'chene', 4); t.poser(L - 1, y, 'cheneSombre', 0); t.poser(L - 2, y, 'chene', 1); }
    moulure(t, 4, 4, L - 8, 0); moulure(t, 4, H - 6, L - 8, 0);
    for (let y = 8; y < 22; y++) for (let x = 18; x < 77; x++) { const b = y === 8 || y === 21 || x === 18 || x === 76; t.poser(x, y, b ? 'laiton' : carte ? 'parchemin' : 'cheneSombre', b ? (y === 8 || x === 18 ? 5 : 2) : carte ? 4 + (y === 9 ? 1 : 0) : 1); }
    t.forme('laiton', ellipsoide(47.5, 31, 4, 3.4), { decalage: 0.6 }); t.forme('laiton', ellipsoide(47.5, 31, 1.6, 1.3), { decalage: -0.6, bord: false });
    t.contour(); textureEtClair(t, s, cle); };
  faceTiroir('zoomFaceTiroir', true); faceTiroir('zoomFaceTiroir_vide', false);
  // le tiroir tiré : ses côtés, son fond, et dedans le carnet de cuir et un crayon (le carnet est posé à part, pour qu'on le sorte)
  { const L = 103, H = 34, t = toileBureau(L, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) { const cote = x < 5 || x > L - 6; t.poser(x, y, cote ? 'chene' : 'cheneSombre', cote ? (x < 5 ? 2 : 3) : 1 + Math.round(y / 14)); }
    for (let x = 68; x < 92; x++) { t.poser(x, 14, 'orR', 4); t.poser(x, 15, 'orR', 2); } t.poser(66, 14, 'lin', 5); t.poser(67, 14, 'cheneSombre', 1); t.poser(67, 15, 'cheneSombre', 1); for (let x = 92; x < 95; x++) { t.poser(x, 14, 'cuirRouge', 3); t.poser(x, 15, 'cuirRouge', 2); }
    t.texture(s, 'zoomTiroirOuvert'); }
  // le carnet fermé (dans le tiroir, ou qu'on sort) : le cuir, la couture, l'étiquette
  { const L = 50, H = 21, t = toileBureau(L, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) t.poser(x, y, x < 4 ? 'cuirRouge' : 'cuirB', x === 0 || y === 0 ? 4 : x === L - 1 || y === H - 1 ? 1 : x < 4 ? 2 : 3);
    for (let x = 6; x < L - 2; x += 2) { t.poser(x, 2, 'cuirB', 5); t.poser(x, H - 3, 'cuirB', 5); }
    for (let y = 6; y < 15; y++) for (let x = 12; x < 42; x++) t.poser(x, y, 'parchemin', y === 6 ? 5 : y === 14 ? 2 : 4);
    for (let y = 16; y < 21; y++) { t.poser(34, y, 'rougeR', 3); t.poser(35, y, 'rougeR', 2); }
    t.contour(); t.texture(s, 'zoomCarnetFerme'); }
  // le carnet ouvert, en grand (540 × 422, comme le registre d'autrefois : les pages du jeu s'y posent telles quelles)
  { const L = 270, H = 211, dos = 135, t = toileBureau(L, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) { const b = Math.min(x, y, L - 1 - x, H - 1 - y);
      if (b < 4) t.poser(x, y, 'cuirB', b === 0 ? 0 : (x < 4 || y < 4 ? 4 : 2) + Math.round((fbm(x * 0.4, y * 0.4, 8501) - 0.5)));
      else { const g = Math.abs(x + 0.5 - dos); let i = 4 + Math.round((fbm(x * 0.05, y * 0.06, 8502) - 0.5) * 0.9); if (g < 8) i -= Math.ceil((8 - g) / 2); if (y > H - 8 || x < 7 || x > L - 8) i = ((y > H - 8 ? y : x) % 2) ? 2 : 3; t.poser(x, y, 'parchemin', i); } }
    for (let y = 150; y < H; y++) { t.poser(dos + 3, y, 'rougeR', 3); t.poser(dos + 4, y, 'rougeR', 2); }   // (le signet de soie, dans la reliure)
    t.contour(); t.texture(s, 'zoomCarnet'); }
  // les plans de la maison, dépliés : un grand papier quadrillé, l'élévation en filigrane, quatre punaises
  { const L = 270, H = 211, t = toileBureau(L, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) { const b = Math.min(x, y, L - 1 - x, H - 1 - y); if (b < 2 - fbm(x * 0.3, y * 0.3, 8601) * 2) continue;
      let i = 4 + Math.round((fbm(x * 0.04, y * 0.05, 8602) - 0.55) * 1.6) - (b < 3 ? 1 : 0);
      if ((x % 12 === 0 || y % 12 === 0) && b > 4) i = Math.min(i, 3);
      t.poser(x, y, 'parchemin', i); }
    t.rampes.filigrane = t.rampes.parchemin.map((c, i, r) => r[Math.max(0, i - 1)]);
    const T3 = (a, b, c, d) => traitBureau(t, a, b, c, d, 'parchemin', 3);
    T3(85, 95, 135, 55); T3(135, 55, 185, 95); T3(92, 95, 92, 170); T3(178, 95, 178, 170); T3(92, 170, 178, 170); T3(92, 132, 178, 132); T3(125, 145, 125, 170); T3(145, 145, 145, 170); T3(125, 145, 145, 145);
    for (const [x, y] of [[6, 6], [L - 7, 6], [6, H - 7], [L - 7, H - 7]]) t.forme('rougeP', ellipsoide(x, y, 2.6, 2.6), { decalage: 0.5 });
    t.contour(); t.texture(s, 'zoomPlans'); }
  // le tableau des succès, de près : le cadre de chêne sombre, le velours vert, la plaque
  { const L = 222, H = 206, t = toileBureau(L, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) { const b = Math.min(x, y, L - 1 - x, H - 1 - y);
      if (b < 7) t.poser(x, y, 'cheneSombre', b === 0 ? 0 : b < 3 ? (x < 3 || y < 3 ? 5 : 1) : (x < 7 || y < 7 ? 4 : 2));
      else t.poser(x, y, 'velours', 2 + Math.round((fbm(x * 0.2, y * 0.2, 8410) - 0.5) * 1.4) - (b < 9 ? 1 : 0)); }
    for (let y = H - 26; y < H - 12; y++) for (let x = 56; x < L - 56; x++) t.poser(x, y, 'laiton', y === H - 26 ? 5 : y === H - 13 ? 1 : 4 - ((x + y) % 7 === 0 ? 1 : 0));
    for (const x of [59, L - 60]) t.poser(x, H - 19, 'laiton', 1);
    t.texture(s, 'zoomSucces'); }
}

// ===================================================================================================================
// Le joueur assis à son bureau : de face, derrière la table, les avant-bras posés sur le plateau, la plume dans la main
// droite. Les gestes : 'repos' (les deux mains à plat), 'ecrit0' à 'ecrit2' (la plume avance sur la page). La texture
// garde sa taille (`tailleAssis` : la hauteur de la taille, à poser sur l'assise de la chaise).
// ===================================================================================================================
const GESTES_BUREAU = {
  repos:  { pres: [[1.12, 4, 0.66], [0.5, 14, 0.62]], loin: [[1.12, 4, 0.66], [0.5, 14, 0.62]] },
  ecrit0: { pres: [[1.1, 5, 0.64], [0.34, 15, 0.6]], loin: [[1.12, 4, 0.66], [0.55, 13, 0.62]] },
  ecrit1: { pres: [[1.1, 5, 0.64], [0.22, 15, 0.61]], loin: [[1.12, 4, 0.66], [0.55, 13, 0.62]] },
  ecrit2: { pres: [[1.08, 5, 0.63], [0.1, 15, 0.6]], loin: [[1.12, 4, 0.66], [0.55, 13, 0.62]] },
};
function textureJoueurBureau(scene, G, geste = 'repos') {
  const stade = stadeJoueur(G), tenue = signatureJoueur(G), cle = `joueur_${stade}_bureau_${geste}`;
  if (scene.textures.exists(cle) && scene.textures.get(cle).tenue === tenue) return cle;
  const b = GESTES_BUREAU[geste] || GESTES_BUREAU.repos;
  const yP = (a, v) => (Number.isInteger(v) ? a.yT + v * a.k : a.yT + a.P.torse * v);
  const poser = (proche, a) => { const p = b[proche ? 'pres' : 'loin']; return [[a.ep * p[0][0], p[0][1] * a.k, yP(a, p[0][2])], [a.ep * p[1][0], p[1][1] * a.k, yP(a, p[1][2])]]; };
  const t = avecOptionsCorps({ bras: { assis: true, poser } }, () => dessinerJoueurHD(apparenceDuJour(G), stade, G.joueur.feminin, 0, G.tenue || [], 'face', null));
  // la plume d'oie dans la main droite (à gauche à l'écran, de face), penchée vers l'épaule
  const m = t.mainsBras && t.mainsBras.pres, plume = new Set();
  if (geste !== 'repos' && m) {
    t.rampes.plumeB = rampeVive(0xf0ecdc);
    const [mx, my] = m.M, sens = mx < t.l / 2 ? -1 : 1;
    const poserP = (x, y, ton) => { t.poser(x, y, 'plumeB', ton); plume.add(y * t.l + x); };
    for (let k = 0; k < 22; k++) { const x = Math.round(mx + sens * (2 + k * 0.45)), y = Math.round(my + 2 - k * 0.9); poserP(x, y, k < 3 ? 2 : 5 - (k % 3 === 0 ? 1 : 0)); if (k > 6) poserP(x + sens, y + 1, 3); if (k > 9 && k < 19) poserP(x + sens * 2, y + 2, 2); }
  }
  // les avant-bras et les mains, à part : ils se posent sur le plateau, par-dessus le registre (le reste du corps est
  // derrière la table)
  const mains = new ToileHD(t.l, t.h);
  if (t.mainsBras) {
    // (seulement la manche, la peau des mains et la plume : ni le tablier, ni la chemise autour)
    const k = FINESSE, MANCHES = ['habit', 'cuir', 'metal', 'fourrure', 'moufle', 'gilet'], MAINS = ['peau', 'moufle'];
    const seg = (px, py, a, b) => { const vx = b[0] - a[0], vy = b[1] - a[1], u = Math.max(0, Math.min(1, ((px - a[0]) * vx + (py - a[1]) * vy) / (vx * vx + vy * vy || 1))); return Math.hypot(px - a[0] - u * vx, py - a[1] - u * vy); };
    const garde = new Set();
    for (const cote of ['pres', 'loin']) {
      const { C, M } = t.mainsBras[cote], debut = [C[0] + (M[0] - C[0]) * 0.3, C[1] + (M[1] - C[1]) * 0.3];
      for (let y = 0; y < t.h; y++) for (let x = 0; x < t.l; x++) {
        const i = y * t.l + x, m2 = t.m[i]; if (t.c[i] === null || !m2) continue;
        const dBras = seg(x + 0.5, y + 0.5, debut, M), dMain = Math.hypot(x + 0.5 - M[0], (y + 0.5 - M[1] - 1 * k) * 0.9);
        if ((MANCHES.includes(m2) && dBras <= 2.7 * k) || (MAINS.includes(m2) && dMain <= 3.4 * k)) garde.add(i);
      }
    }
    for (const i of plume) garde.add(i);
    // le trait qui les cerne : les pixels sans matière, voisins de ce qu'on garde
    const cerne = [];
    for (let y = 1; y < t.h - 1; y++) for (let x = 1; x < t.l - 1; x++) { const i = y * t.l + x; if (t.c[i] === null || t.m[i] || garde.has(i)) continue; if ([i - 1, i + 1, i - t.l, i + t.l].some(j => garde.has(j))) cerne.push(i); }
    for (const i of [...garde, ...cerne]) mains.c[i] = t.c[i];
  }
  if (scene.textures.exists(cle)) scene.textures.remove(cle);
  if (scene.textures.exists(cle + '_mains')) scene.textures.remove(cle + '_mains');
  t.texture(scene, cle); mains.texture(scene, cle + '_mains');
  const tex = scene.textures.get(cle); tex.tenue = tenue; tex.tailleAssis = t.tailleAssis; tex.mains = t.mainsBras ? { pres: t.mainsBras.pres.M, loin: t.mainsBras.loin.M } : null;
  return cle;
}

// ===================================================================================================================
// Les trajets à pied (l'arrière-boutique, le bureau) : le joueur marche, ses jambes vont avec ses pas ; rien ne glisse
// ===================================================================================================================
// Il va jusqu'à (x, y) : `vue` 'face' (de trois-quarts, tourné du côté où il va), 'deFace' (il vient vers nous) ou 'dos'
// (il s'en va). `echelle` : sa taille à l'arrivée (il s'éloigne, il s'approche). Renvoie une promesse.
function marcherJusqua(scene, heros, x, y, { vue = 'face', vitesse = 0.3, echelle = null } = {}) {
  const G = window.GAME, cle = textureJoueur(scene, G, vue);
  heros.setCrop().setTexture(cle).setOrigin(0.5, 1);
  if (vue !== 'face') heros.setFlipX(false);
  else if (Math.abs(x - heros.x) > 2) heros.setFlipX(x < heros.x);
  const d = Math.hypot(x - heros.x, y - heros.y), duree = Math.max(180, d / vitesse);
  return new Promise(ok => {
    if (d < 1) return ok();
    pasDeMarche(scene, heros, duree, { poussiere: false });
    // (à l'arrivée, il s'arrête net : plus d'image de pas qui viendrait écraser la pose suivante)
    const props = { targets: heros, x, y, duration: duree, ease: 'Linear', onComplete: () => { if (heros.marche) { heros.marche.remove(); heros.marche = null; } if (heros.active) heros.setTexture(cle); ok(); } };
    if (echelle) { props.scaleX = echelle; props.scaleY = echelle; }
    scene.tweens.add(props);
  });
}
// Il se tourne (sans bouger) : la même image debout, sous un autre angle
function tournerJoueur(scene, heros, vue, versGauche = false) {
  if (heros.marche) { heros.marche.remove(); heros.marche = null; }
  heros.setCrop().setTexture(textureJoueur(scene, window.GAME, vue)).setOrigin(0.5, 1).setFlipX(vue === 'face' && versGauche);
}
function pauseBureau(scene, ms) { return new Promise(ok => scene.time.delayedCall(ms, ok)); }
