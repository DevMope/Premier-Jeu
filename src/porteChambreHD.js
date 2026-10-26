// (planche 85 v2, retouche validée) La porte de la chambre vers l'arrière-boutique : une vraie porte, du même modèle que
// toutes les portes intérieures (celles du bureau, planche 82 v2 : bureauHD.js, poserPorteInterieure). Le dessin est le
// même, pixel pour pixel : chambranle mouluré et sa corniche, vantail à quatre panneaux, bec-de-cane de laiton sur sa
// rosace, deux fiches ; il s'ouvre en six images (0° à 75°) vers la pièce d'à côté, et l'on voit l'arrière-boutique par
// l'ouverture (l'enduit doré, le lambris, le plancher, une étagère de bocaux). La plaque de laiton porte son nom.
// (À la fusion avec le chantier du bureau, ces fonctions peuvent céder la place à poserPorteInterieure : même modèle.)

const PORTE_CHAMBRE = { L: 50, H: 90, cadre: 6, haut: 10, VL: 38, VH: 80 };
const ANGLES_PORTE_CHAMBRE = [0, 15, 30, 45, 60, 75];
function toilePorteChambre(l, h) {
  const t = toileDecor(l, h);
  t.rampes.platreChaud = [0x7a5a34, 0x9a7444, 0xba9056, 0xd8ac6a, 0xecc888, 0xfae4b0];
  t.rampes.bocal = [0x1a2a2a, 0x2a4a44, 0x3e6a5e, 0x5a8a78, 0x8ab8a0, 0xc8e8d4];
  return t;
}
// Le vantail à plat, vu de face (la poignée à gauche, les fiches à droite)
function vantailPorteChambre() {
  const { VL: L, VH: H } = PORTE_CHAMBRE, t = toilePorteChambre(L, H);
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
  return t;
}
// Le vantail qui pivote sur ses fiches (à droite) et s'éloigne de nous : son bord libre rapetisse un peu
function vantailPorteChambreQuiSeloigne(src, deg) {
  const { VL, VH } = PORTE_CHAMBRE, a = deg * Math.PI / 180, l = Math.max(2, Math.round(VL * Math.cos(a))), f = 1 / (1 + 0.12 * Math.sin(a)), oeil = VH * 0.28;
  const t = toilePorteChambre(VL, VH);
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
// Ce qu'on voit par la porte ouverte : l'arrière-boutique (l'enduit doré, le lambris, le plancher, une étagère de bocaux)
function dedansPorteChambre() {
  const { VL, VH } = PORTE_CHAMBRE, t = toilePorteChambre(VL, VH);
  for (let y = 0; y < VH; y++) for (let x = 0; x < VL; x++) {
    if (y < 50) t.poser(x, y, 'platreChaud', 3 + Math.round((fbm(x * 0.2, y * 0.2, 8851) - 0.5) * 1.4) + (x > 14 && x < 30 && y > 8 ? 1 : 0));
    else if (y < 52) t.poser(x, y, 'cheneSombre', y === 50 ? 4 : 2);
    else if (y < 68) t.poser(x, y, 'chene', ((x % 6) === 0 ? 1 : 3) + (x > 16 && x < 32 ? 1 : 0));
    else t.poser(x, y, 'chene', ((x + Math.floor((y - 68) / 3) * 7) % 13 === 0 ? 1 : 3) + (y > 74 ? 1 : 0));
  }
  // l'étagère de l'arrière-boutique, et ses bocaux
  for (let x = 8; x < VL; x++) { t.poser(x, 28, 'chene', 5); t.poser(x, 29, 'cheneSombre', 2); }
  for (const [bx, h] of [[11, 7], [18, 9], [25, 6], [31, 8]]) for (let y = 28 - h; y < 28; y++) for (let x = bx; x < bx + 4; x++) t.poser(x, y, 'bocal', x === bx ? 4 : x === bx + 3 ? 1 : (y === 28 - h ? 5 : 3));
  return t;
}
function texturesPorteChambre(s) {
  if (s.textures.exists('porteCh_chambranle')) return;
  creerInterieurHD(s);
  const { L, H, cadre, haut } = PORTE_CHAMBRE;
  // le chambranle : deux montants moulurés, la traverse du haut, une petite corniche ; le seuil de chêne sombre
  { const t = toilePorteChambre(L, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) {
      if (x >= cadre && x < L - cadre && y >= haut) continue;
      if (y < 3) { t.poser(x, y, 'cheneSombre', y === 0 ? 5 : y === 1 ? 3 : 1); continue; }
      const d = y >= haut ? Math.min(x, L - 1 - x) : Math.min(x, L - 1 - x, y - 3), cote = y >= haut ? (x < cadre ? 'g' : 'd') : 'h';
      t.poser(x, y, 'chene', [1, 4, 5, 2, 3, 2][Math.min(5, d)] + (cote === 'd' && d < 2 ? -1 : 0));
    }
    for (let x = 0; x < L; x++) t.poser(x, 3, 'cheneSombre', 0);
    for (let x = cadre; x < L - cadre; x++) t.poser(x, haut, 'cheneSombre', 0);
    for (let x = cadre - 1; x < L - cadre + 1; x++) { t.poser(x, H - 1, 'cheneSombre', 2); t.poser(x, H - 2, 'cheneSombre', 4); }
    t.contour(); t.texture(s, 'porteCh_chambranle'); }
  const plat = vantailPorteChambre();
  plat.texture(s, 'porteCh_v0');
  for (const deg of ANGLES_PORTE_CHAMBRE.slice(1)) { const t = vantailPorteChambreQuiSeloigne(plat, deg); t.contour(); t.texture(s, 'porteCh_v' + deg); }
  dedansPorteChambre().texture(s, 'porteCh_dedans');
}

// La porte posée : x = son milieu, sol = le bas. Renvoie la porte : ses images, `ouvrir()`/`fermer()` (des promesses : le
// vantail tourne image par image), `montrer(deg)`, `poignee` (où est le bec-de-cane), `zone` (le rectangle de la porte).
function poserPorteChambre(s, x, sol, { prof = 2.5, ecriteau = null } = {}) {
  texturesPorteChambre(s); creerHalo(s);
  const { L, H, cadre, haut, VL } = PORTE_CHAMBRE, x0 = x - L, y0 = sol - H * 2, ox = x0 + cadre * 2, oy = y0 + haut * 2;
  const p = { x, sol, prof, etat: 0, images: [], zone: [x0, y0, L * 2, H * 2] };
  p.dedans = s.add.image(ox, oy, 'porteCh_dedans').setOrigin(0).setScale(2).setDepth(prof - 0.03);
  p.vantail = s.add.image(ox, oy, 'porteCh_v0').setOrigin(0).setScale(2).setDepth(prof - 0.02);
  p.chambranle = s.add.image(x0, y0, 'porteCh_chambranle').setOrigin(0).setScale(2).setDepth(prof);
  // la lumière de l'arrière-boutique, quand la porte s'ouvre : par l'ouverture, et sur le plancher
  p.lueur = s.add.image(x, sol - 70, 'halo').setScale(1.1, 1.6).setTint(0xffc870).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD).setDepth(prof - 0.01);
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
  p.montrer = deg => {
    p.etat = deg;
    if (!p.vantail.active) return;
    p.vantail.setTexture('porteCh_v' + deg);
    p.lueur.setAlpha(0.55 * deg / 75); p.solLueur.setAlpha(deg / 75);
  };
  const tourner = (vers) => new Promise(ok => {
    const i0 = ANGLES_PORTE_CHAMBRE.indexOf(p.etat), i1 = ANGLES_PORTE_CHAMBRE.indexOf(vers), pas = i1 > i0 ? 1 : -1;
    if (i0 === i1) return ok();
    let i = i0;
    const suivant = () => { if (!p.vantail.active) return ok(); i += pas; p.montrer(ANGLES_PORTE_CHAMBRE[i]); if (i === i1) return ok(); s.time.delayedCall(70, suivant); };
    s.time.delayedCall(40, suivant);
  });
  p.ouvrir = () => { if (typeof Son !== 'undefined') Son.jouer('porte'); return tourner(75); };
  p.fermer = () => tourner(0).then(() => { if (typeof Son !== 'undefined') Son.jouer('glisse'); });
  p.detruire = () => { for (const o of p.images) if (o && o.destroy) o.destroy(); };
  return p;
}
