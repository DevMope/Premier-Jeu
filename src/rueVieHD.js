// (v1.62, planche 81 validée, panneaux 1 à 3) La rue vivante : la fontaine de la rue, plus riche (dans l'esprit de la
// grande fontaine du marché : grès doré, frise d'oves, coquille, colonne cannelée, deux mufles de bronze, vasque qui
// déborde), et tout ce qui vit autour : chez les Brindeloup, les jardinières, le lierre, les bûches et leur chat qui
// dort, le panier, le balai, les sabots, le bidon, le romarin, le linge ; des pigeons, un moineau, de l'herbe, des
// papillons, des abeilles, une libellule, des poissons rouges. Rien ne glisse : chaque bête a ses images. La nuit et
// en hiver, ni fleurs ni insectes. L'été, des bottes de paille (saisonsHD.js) rangées dans le creux entre les Brindeloup et le barbier.
// (planche 80, porche A) L'arche du marché devient un porche couvert, vu depuis la rue, la place au travers.
// Les décors sont peints en demi-résolution (affichés ×2, comme les façades) ; les bêtes à la finesse des personnages.

// La fontaine, en trois couches pour que l'eau passe entre : le bas (bassin, margelle, paroi sculptée, marche, mousse,
// lierre, iris), l'eau qui bouge et ses poissons (posés par la scène), le haut (colonne, mufles, vasque, boule)
const FONTAINE_RUE = { L: 128, H: 100, cx: 64, rebordY: 62, rx: 58, ry: 10, eauRx: 51, eauRy: 7, paroi: 22, vasqueY: 27, vasqueRx: 17, lionY: 45, boule: 15 };
function fontaineRueHD(s) {
  if (s.textures.exists('fontaineRueBas')) return;
  const F = FONTAINE_RUE;
  const rampesF = t => {
    t.rampes.pierre = rampe(0xb8a07a); t.rampes.mousse = rampe(0x5a7a3a); t.rampes.bronze = rampe(0x4a8a78);
    t.rampes.lierre = rampe(0x2e6a26); t.rampes.lierreC = rampe(0x4a8a30); t.rampes.fougere = rampe(0x4a8a34);
    t.rampes.iris = rampeVive(0x6a4ac8); t.rampes.tige = rampe(0x3a6a2a); t.rampes.galet = rampe(0x5a6a6a); t.rampes.feuilleMorte = rampe(0xa8783a);
    t.rampes.eauFond = [0x0a1a24, 0x10283a, 0x16364c, 0x1e4660, 0x285a78, 0x346e90];
    t.rampes.paquerette = [0x8a8a7a, 0xb8b8a8, 0xdadacc, 0xf0f0e4, 0xffffff, 0xffffff];
  };
  const dans = (x, y, cx, cy, rx, ry) => ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1;
  // ---------- le bas : bassin, margelle, paroi, marche (avec ses fleurs, ou sans : la nuit, l'hiver) ----------
  for (const fleurs of [true, false]) {
    const t = toileDecor(F.L, F.H); rampesF(t);
    const cx = F.cx, cy = F.rebordY;
    // la marche (le socle), un peu plus large que le bassin
    const rs = F.rx + 4;
    for (let x = cx - rs; x <= cx + rs; x++) {
      const nx = (x + 0.5 - cx) / rs; if (Math.abs(nx) > 1) continue;
      const haut = Math.round(cy + F.paroi + (F.ry + 1.5) * Math.sqrt(1 - nx * nx)) - 2, bas = haut + 5;
      for (let y = haut; y <= bas; y++) t.poser(x, y, 'pierre', y === haut ? 5 : y === bas ? 1 : Math.round(3 - nx * 1.2) - (y > haut + 2 ? 1 : 0));
      if ((x - cx + 200) % 21 === 0) for (let y = haut + 1; y < bas; y++) t.poser(x, y, 'pierre', 1);   // (les joints des dalles)
    }
    // la paroi du bassin : des blocs taillés, une frise sous la margelle, une coquille sculptée au milieu
    for (let x = cx - F.rx; x <= cx + F.rx; x++) {
      const nx = (x + 0.5 - cx) / F.rx; if (Math.abs(nx) > 1) continue;
      const haut = cy + F.ry * Math.sqrt(1 - nx * nx), bas = haut + F.paroi;
      for (let y = Math.floor(haut); y <= bas; y++) {
        const joint = Math.round(x - cx) % 16 === 0 && y > haut + 10 || Math.abs(y - (haut + 15)) < 0.6;
        let ton = Math.round(3.2 - nx * 1.5 - Math.abs(nx) * 0.9) + (joint ? -2 : 0);
        if (fbm(x * 0.5, y * 0.09, 8101) > 0.66 && y > haut + 4) ton -= 1;                    // les coulures d'humidité
        if (y > bas - 4 && hachage(x, y, 8102) > 0.42) { t.poser(x, y, 'mousse', 2 + Math.round(hachage(x, 1, 8103) * 2)); continue; }
        t.poser(x, y, 'pierre', ton);
      }
      // la frise : deux sillons, et des oves en relief entre eux
      const h0 = Math.round(haut) + 2, sh = Math.round(-nx * 1.5);
      t.poser(x, h0, 'pierre', 1 + sh); t.poser(x, h0 + 7, 'pierre', 1 + sh);
      const m = ((x - cx) % 8 + 8) % 8;
      for (let j = 1; j < 7; j++) { const d = Math.hypot((m - 3.5) / 3.2, (j - 3.5) / 2.8); if (d < 1) t.poser(x, h0 + j, 'pierre', (d < 0.5 ? 5 : 4) + sh - (m > 4 && j > 3 ? 1 : 0)); else if (d < 1.25) t.poser(x, h0 + j, 'pierre', 1 + sh); }
    }
    // la coquille sculptée, au milieu de la paroi
    { const sx = cx, sy = cy + F.ry + 17;
      for (let y = sy - 6; y <= sy; y++) for (let x = sx - 7; x <= sx + 7; x++) {
        const dx = x + 0.5 - sx, dy = y + 0.5 - sy, r = Math.hypot(dx, dy * 1.15); if (r > 7 || dy > 0) continue;
        const a = Math.atan2(-dy, dx), cote = Math.floor(a / Math.PI * 9);
        t.poser(x, y, 'pierre', r > 6.2 ? 1 : (cote % 2 ? 4 : 2) + (dx < 0 ? 1 : 0));
      }
      for (let x = sx - 2; x <= sx + 2; x++) t.poser(x, sy + 1, 'pierre', 2);
    }
    // la margelle : un anneau de pierre claire, épais ; le fond d'eau sombre au milieu (un peu plus bas que le bord)
    for (let y = cy - F.ry - 1; y <= cy + F.ry + 1; y++) for (let x = cx - F.rx - 1; x <= cx + F.rx + 1; x++) {
      if (!dans(x, y, cx, cy, F.rx, F.ry)) continue;
      if (dans(x, y, cx, cy, F.eauRx, F.eauRy)) {
        if (dans(x, y, cx, cy + 1.2, F.eauRx - 0.5, F.eauRy - 0.6)) t.poser(x, y, 'eauFond', 1 + Math.round((y - cy + F.eauRy) / (2 * F.eauRy) * 2.2));
        else t.poser(x, y, 'pierre', y < cy ? 2 : 3);   // (la paroi intérieure, au-dessus de l'eau)
        continue;
      }
      const devant = y > cy, bordExt = !dans(x, y + 1, cx, cy, F.rx, F.ry);
      t.poser(x, y, 'pierre', bordExt && devant ? 5 : devant ? 4 : 5 - (hachage(x >> 2, y, 8104) > 0.8 ? 1 : 0));
    }
    // au fond de l'eau : des galets, une feuille tombée
    for (let k = 0; k < 26; k++) { const x = Math.round(cx + (hachage(k, 1, 8105) - 0.5) * 2 * (F.eauRx - 6)), y = Math.round(cy + 1 + hachage(k, 2, 8105) * (F.eauRy - 2));
      if (t.mat(x, y) === 'eauFond') { t.poser(x, y, 'galet', 2 + Math.round(hachage(k, 3, 8105) * 2)); if (hachage(k, 4, 8105) > 0.5) t.poser(x + 1, y, 'galet', 2); } }
    for (const [x, y] of [[cx - 30, cy + 3], [cx + 22, cy + 4]]) { t.poser(x, y, 'feuilleMorte', 3); t.poser(x + 1, y, 'feuilleMorte', 4); t.poser(x + 2, y + 1, 'feuilleMorte', 2); }
    // le lierre qui grimpe sur la paroi, à gauche, et retombe par-dessus la margelle
    for (const [x0, k0, n] of [[cx - F.rx + 5, 0, 30], [cx - F.rx + 14, 7, 20]]) {
      let x = x0, y = F.H - 4;
      for (let k = 0; k < n; k++) {
        x += Math.round(Math.sin((k + k0) * 0.9) * 1.2); y -= 1.1;
        if (y < cy - 1) break;
        t.poser(x, Math.round(y), 'tige', 2);
        if (k % 2 === 0) { const sx = k % 4 === 0 ? -2 : 2; t.forme(k % 3 ? 'lierre' : 'lierreC', ellipsoide(x + sx, Math.round(y), 2.2, 1.6), { decalage: 0.2 + (k % 3) * 0.25, bord: false, ombre: false });
          t.poser(x + sx + (sx < 0 ? -1 : 1), Math.round(y) - 1, k % 3 ? 'lierre' : 'lierreC', 4); }
      }
    }
    // des fougères dans un joint, à droite
    for (const [fx, fy] of [[cx + 38, cy + F.ry + 14], [cx + 46, cy + F.ry + 10]]) for (const [a, l] of [[-2.4, 5], [-1.9, 6], [-1.3, 6], [-0.8, 5]]) {
      for (let k = 1; k <= l; k++) { const x = Math.round(fx + Math.cos(a) * k), y = Math.round(fy + Math.sin(a) * k + k * k * 0.06); t.poser(x, y, 'fougere', 3 - (k > l - 2 ? 1 : 0)); if (k % 2 === 0) t.poser(x + 1, y, 'fougere', 4); }
    }
    // des iris au pied, à droite : de longues feuilles en lame (et, à la belle saison, trois fleurs violettes)
    { const ix = cx + F.rx - 2, sol = F.H - 1;
      for (const [dx, h, pente] of [[-4, 20, -0.25], [-2, 25, -0.1], [0, 28, 0.05], [2, 23, 0.18], [4, 17, 0.32], [6, 12, 0.45]]) for (let k = 0; k < h; k++) { const x = Math.round(ix + dx + pente * k + (k * k * pente * 0.012)), y = sol - k; t.poser(x, y, 'tige', 2 + (k > h * 0.6 ? 1 : 0) + (dx < 1 ? 1 : 0)); }
      if (fleurs) for (const [fx, fy] of [[ix - 1, sol - 31], [ix + 6, sol - 25], [ix - 6, sol - 24]]) {
        for (let k = 0; k < 7; k++) t.poser(fx, fy + k + 3, 'tige', 3);
        t.forme('iris', ellipsoide(fx, fy, 2.2, 2.6), { decalage: 0.5, ombre: false });
        t.forme('iris', ellipsoide(fx - 2.2, fy + 2.4, 1.8, 1.3), { decalage: -0.2, ombre: false }); t.forme('iris', ellipsoide(fx + 2.4, fy + 2.4, 1.8, 1.3), { decalage: -0.2, ombre: false });
        t.poser(fx, fy + 1, 'or', 5); t.poser(fx, fy + 2, 'or', 4);
      }
    }
    // des pâquerettes au pied de la marche, à gauche (à la belle saison)
    if (fleurs) for (let k = 0; k < 7; k++) { const x = 6 + Math.round(hachage(k, 1, 8107) * 22), y = F.H - 2 - Math.round(hachage(k, 2, 8107) * 2); t.poser(x, y, 'tige', 3); t.poser(x, y - 1, 'paquerette', 4); t.poser(x - 1, y - 1, 'paquerette', 3); t.poser(x + 1, y - 1, 'paquerette', 3); t.poser(x, y - 2, 'paquerette', 4); t.poser(x, y - 1, 'or', 5); }
    // l'anneau de fer scellé dans la margelle, la chaîne et le gobelet d'étain (on boit à la fontaine)
    { const ax = cx + 30, ay = cy + 8;
      t.poser(ax, ay, 'fer', 4); t.poser(ax + 1, ay, 'fer', 2); t.poser(ax, ay + 1, 'fer', 2);
      for (let k = 1; k < 9; k++) t.poser(ax + Math.round(k * 0.6), ay + k, 'fer', k % 2 ? 4 : 2);
      t.forme('fer', (x, y) => (x >= ax + 3 && x <= ax + 7 && y >= ay + 9 && y <= ay + 14 && Math.abs(x + 0.5 - (ax + 5)) <= 2 + (y - ay - 9) * 0.1 ? [(x + 0.5 - ax - 5) / 3, 0, 0.8] : null), { decalage: 0.9 });
      t.poser(ax + 4, ay + 9, 'fer', 1); t.poser(ax + 5, ay + 9, 'fer', 1); t.poser(ax + 6, ay + 9, 'fer', 1);
    }
    t.contour(); t.texture(s, fleurs ? 'fontaineRueBas' : 'fontaineRueBasNu');
  }
  // ---------- le haut : la colonne, les mufles, la vasque, la boule ----------
  {
    const t = toileDecor(F.L, F.H); rampesF(t);
    const cx = F.cx;
    for (let y = F.vasqueY + 6; y <= F.rebordY; y++) for (let x = cx - 5; x <= cx + 5; x++) {
      const n = (x + 0.5 - cx) / 5.5;
      t.poser(x, y, 'pierre', Math.round(3.4 - n * 1.6 - Math.abs(n) * 0.8 + ((x - cx + 5) % 3 === 0 ? -1 : 0)) - (y > F.rebordY - 3 ? 1 : 0));
    }
    for (const yb of [F.lionY + 8, F.vasqueY + 9]) t.forme('pierre', ellipsoide(cx, yb, 7, 2), { decalage: 0.6 });
    t.forme('pierre', ellipsoide(cx, F.rebordY - 1, 7.5, 2.2, (x, y) => y <= F.rebordY), { decalage: 0.2 });   // (la base, qui sort de l'eau)
    // les deux mufles de lion en bronze vert-de-gris : l'eau sort de leur gueule
    for (const sens of [-1, 1]) {
      const lx = cx + sens * 6, ly = F.lionY;
      t.forme('bronze', ellipsoide(lx, ly, 4.2, 4.6), { decalage: -0.5, motif: (x, y) => ((Math.round(Math.atan2(y + 0.5 - ly, x + 0.5 - lx) * 2.6) % 2) ? -0.7 : 0.2) });   // (la crinière)
      t.forme('bronze', ellipsoide(lx + sens * 1.2, ly + 0.2, 2.6, 2.8), { decalage: 0.7 });                                                                            // (la face)
      t.forme('bronze', ellipsoide(lx + sens * 3, ly + 1.4, 1.8, 1.5), { decalage: 1.1 });                                                                              // (le museau)
      t.poser(Math.round(lx + sens * 1.2), ly - 1, 'encre', 1);                                                                                                         // (l'œil)
      t.poser(Math.round(lx + sens * 4.4), ly + 2, 'encre', 0); t.poser(Math.round(lx + sens * 3.6), ly + 2, 'eauFond', 1);                                              // (la gueule ouverte)
    }
    // la vasque haute : le dessous en coupe, le rebord, son eau ; deux becs où l'eau déborde
    t.forme('pierre', (x, y) => (y >= F.vasqueY && y <= F.vasqueY + 7 && Math.abs(x + 0.5 - cx) <= F.vasqueRx - (y - F.vasqueY) * 1.6 ? [(x + 0.5 - cx) / F.vasqueRx, 0.5, 0.7] : null), { decalage: -0.3, motif: (x, y) => ((x - cx + 40) % 4 === 0 ? -0.6 : 0) });
    t.forme('pierre', ellipsoide(cx, F.vasqueY, F.vasqueRx, 4), { decalage: 0.9 });
    t.forme('eauFond', ellipsoide(cx, F.vasqueY - 0.5, F.vasqueRx - 3, 2.2), { decalage: 2.4, bord: false, ombre: false });
    for (const sens of [-1, 1]) t.forme('pierre', ellipsoide(cx + sens * (F.vasqueRx + 0.5), F.vasqueY + 0.5, 2, 1.4), { decalage: 0.6 });
    // le petit pied, la boule
    for (let y = F.boule + 4; y < F.vasqueY - 2; y++) for (let x = cx - 2; x <= cx + 2; x++) t.poser(x, y, 'pierre', x < cx ? 4 : 2);
    t.forme('pierre', ellipsoide(cx, F.boule, 4.5, 4.5), { decalage: 0.5 });
    t.forme('mousse', ellipsoide(cx + 2, F.boule + 3.5, 2.4, 1), { decalage: 0.2, bord: false, ombre: false });   // (de la mousse, là où l'eau ruisselle)
    t.contour(); t.texture(s, 'fontaineRueHaut');
  }
}

// ---------- les objets de la rue (×2, comme les façades) ----------
function objetsRueHD(s) {
  if (s.textures.exists('seauRue')) return;
  const T = (l, h) => { const t = toileDecor(l, h); Object.assign(t.rampes, { terre: rampe(0xb8603a), feuille: rampe(0x3e7a30), feuilleC: rampe(0x5a9a3a), fleurR: rampeVive(0xd8323e), fleurP: rampeVive(0xe86a9a), fleurB: rampeVive(0xf0eee0),
    pomme: rampeVive(0xc8382a), pommeV: rampeVive(0x8ab030), osier: rampe(0xb08a4a), lait: rampe(0x9aa0a8), buche: rampe(0x8a6a44), aubier: rampe(0xd8b07a), herbe: rampe(0x4a8a34), jaune: rampeVive(0xf0c020),
    paille: rampe(0xd8b048), linB: rampe(0xe8e4d8), linR: rampeVive(0xb83a2a), linBl: rampeVive(0x3a6ab0), romarin: rampe(0x4a6a4a), nenu: rampe(0x3a7a3a), rose: rampeVive(0xf0a0c0), tige: rampe(0x3a6a2a), terreau: rampe(0x4a3424) }); return t; };
  // le seau de bois cerclé de fer, son anse de corde
  { const t = T(12, 13);
    t.forme('chene', (x, y) => (y >= 4 && y <= 12 && Math.abs(x + 0.5 - 6) <= 5 - (12 - y) * 0.08 ? [(x + 0.5 - 6) / 5.5, 0, 0.8] : null), { motif: (x, y) => (x % 2 ? -0.5 : 0) });
    for (const y of [5, 10]) for (let x = 1; x <= 10; x++) t.poser(x, y, 'fer', x < 4 ? 4 : 2);
    t.rampes.eauFond = [0x10283a, 0x16364c, 0x1e4660, 0x285a78, 0x346e90, 0x5a9ac0]; t.forme('eauFond', ellipsoide(6, 4, 4.5, 1.2), { bord: false, ombre: false });
    for (let a = 0; a <= Math.PI; a += 0.2) t.poser(Math.round(6 - Math.cos(a) * 5), Math.round(4 - Math.sin(a) * 3.5), 'chanvre', 3);
    t.contour(); t.texture(s, 'seauRue'); }
  // le pot de terre cuite et ses géraniums rouges (sur la margelle) ; sans fleurs, la nuit et l'hiver
  for (const fleurs of [true, false]) { const t = T(14, 15);
    t.forme('terre', (x, y) => (y >= 8 && y <= 14 && Math.abs(x + 0.5 - 7) <= 4.5 - (y - 8) * 0.15 ? [(x + 0.5 - 7) / 5, 0, 0.8] : null));
    t.forme('terre', ellipsoide(7, 8, 5.2, 1.4), { decalage: 0.6 });
    for (const [x, y] of [[3, 6], [6, 5], [10, 6], [8, 7], [4, 8], [11, 8], [2, 9]]) t.forme(x % 2 ? 'feuille' : 'feuilleC', ellipsoide(x, y, 2.2, 1.6), { decalage: 0.2, ombre: false });
    if (fleurs) for (const [x, y] of [[4, 2], [8, 1], [11, 3]]) { t.forme('fleurR', ellipsoide(x, y, 2, 1.8), { decalage: 0.4, ombre: false }); t.poser(x, y, 'fleurR', 5); t.poser(x, y + 2, 'tige', 2); }
    t.contour(); t.texture(s, fleurs ? 'potGeraniumRue' : 'potGeraniumRueNu'); }
  // les feuilles de nénuphar (deux tailles) et une fleur rose
  for (const [cle, rx, ry] of [['nenupharRueA', 4.6, 1.6], ['nenupharRueB', 3.4, 1.2]]) { const t = T(11, 5);
    t.forme('nenu', ellipsoide(5.5, 2.5, rx, ry, (x, y) => !(x >= 5 && x <= 7 && y <= 2)), { decalage: 0.4 });
    t.poser(5, 2, 'nenu', 1); t.contour(); t.texture(s, cle); }
  { const t = T(7, 5); for (const [x, y, i] of [[1, 3, 3], [2, 2, 4], [3, 1, 5], [4, 2, 4], [5, 3, 3], [2, 3, 4], [3, 3, 5], [4, 3, 4], [3, 2, 5]]) t.poser(x, y, 'rose', i); t.poser(3, 3, 'jaune', 5); t.poser(2, 4, 'nenu', 3); t.poser(3, 4, 'nenu', 3); t.poser(4, 4, 'nenu', 3); t.contour(); t.texture(s, 'fleurNenupharRue'); }
  // une jardinière de bois sous une fenêtre, débordante de géraniums (rouges ou roses) qui retombent ; la nuit et l'hiver,
  // seulement les feuilles
  for (const [cle, fl, l] of [['jardiniereRueR', 'fleurR', 24], ['jardiniereRueP', 'fleurP', 24], ['jardiniereRueNu', null, 24]]) { const t = T(l + 2, 16);
    for (let k = 0; k < 2; k++) planche(t, 1, 9 + k * 3, l, 3, 'chene', { graine: 8150 + k + l, noeuds: 0 });
    for (const x of [1, l]) for (let y = 9; y < 15; y++) t.poser(x, y, 'fer', y === 9 ? 4 : 2);
    for (let x = 1; x <= l; x++) t.poser(x, 15, 'cheneSombre', 1);
    for (let k = 0; k < 13; k++) { const x = 2 + Math.round(hachage(k, 1, 8160 + l) * (l - 3)), y = 6 + Math.round(hachage(k, 2, 8160 + l) * 3); t.forme(k % 2 ? 'feuille' : 'feuilleC', ellipsoide(x, y, 2.2, 1.7), { decalage: 0.1, ombre: false }); }
    for (const [x0, n] of [[4, 5], [l - 5, 4], [l / 2, 3]]) for (let k = 0; k < n; k++) { t.poser(Math.round(x0 + Math.sin(k) * 0.6), 10 + k, 'feuille', 2 + (k % 2)); if (k % 2) t.poser(Math.round(x0 + 1), 10 + k, 'feuilleC', 3); }   // (les tiges qui retombent devant)
    if (fl) {
      for (const [x, y] of [[3, 3], [7, 2], [11, 4], [15, 2], [19, 3], [22, 4], [5, 6], [17, 6]]) if (x < l) { t.forme(fl, ellipsoide(x, y, 1.9, 1.7), { decalage: 0.5, ombre: false }); t.poser(x, y, fl, 5); }
      for (const [x, y] of [[4, 14], [l - 4, 13]]) t.forme(fl, ellipsoide(x, y, 1.4, 1.2), { decalage: 0.3, ombre: false });
    }
    t.contour(); t.texture(s, cle); }
  // le lierre qui grimpe au coin d'une maison (de la rue jusqu'à l'étage)
  { const L = 18, H = 112, t = T(L, H); t.rampes.lierre = rampe(0x2e6a26); t.rampes.lierreC = rampe(0x4a8a30); t.rampes.tigeL = rampe(0x5a4a30);
    for (const [x0, y0, g] of [[6, H - 1, 0], [11, H - 1, 3], [8, H - 40, 5]]) { let x = x0, y = y0;
      for (let k = 0; k < 140; k++) { x += Math.sin(k * 0.21 + g) * 0.45; x = Math.max(3, Math.min(L - 4, x)); y -= 0.8; if (y < 2) break;
        t.poser(Math.round(x), Math.round(y), 'tigeL', 2);
        const dens = y > H * 0.5 ? 0.62 : 0.42;
        if (hachage(k, g, 8170) < dens) { const sx = hachage(k, g + 1, 8170) < 0.5 ? -2 : 2, m = hachage(k, g + 2, 8170) < 0.4 ? 'lierreC' : 'lierre';
          t.forme(m, ellipsoide(x + sx, y, 2.3, 1.7), { decalage: 0.1 + hachage(k, g + 3, 8170) * 0.7, bord: false, ombre: false });
          t.poser(Math.round(x + sx * 1.6), Math.round(y) - 1, m, 4); } } }
    t.contour(); t.texture(s, 'lierreMurRue'); }
  // le balai de bruyère, appuyé au mur
  { const t = T(10, 46);
    for (let y = 0; y < 32; y++) { t.poser(5, y, 'chene', 4); t.poser(6, y, 'chene', 2); }
    for (const y of [31, 33]) for (let x = 3; x <= 7; x++) t.poser(x, y, 'chanvre', 3);
    t.forme('paille', (x, y) => (y >= 32 && y <= 45 && Math.abs(x + 0.5 - 5.5) <= 2 + (y - 32) * 0.22 ? [(x - 5) / 5, 0.2, 0.8] : null), { motif: (x, y) => (x % 2 ? -0.7 : 0) });
    t.contour(); t.texture(s, 'balaiRue'); }
  // une paire de sabots sur le pas de la porte
  { const t = T(16, 6);
    for (const x0 of [1, 8]) { t.forme('chene', ellipsoide(x0 + 3.5, 3.4, 3.6, 2.4, (x, y) => y >= 1), { decalage: 0.3 }); t.forme('cheneSombre', ellipsoide(x0 + 4.5, 2, 1.6, 0.8), { bord: false, ombre: false }); }
    t.contour(); t.texture(s, 'sabotsRue'); }
  // le bidon de lait (le laitier est passé)
  { const t = T(10, 15);
    t.forme('lait', (x, y) => (y >= 5 && y <= 14 && Math.abs(x + 0.5 - 5) <= 4 ? [(x + 0.5 - 5) / 4.5, 0, 0.8] : null), { decalage: 0.4 });
    t.forme('lait', (x, y) => (y >= 2 && y <= 5 && Math.abs(x + 0.5 - 5) <= 2.4 ? [(x + 0.5 - 5) / 3, 0, 0.8] : null), { decalage: 0.6 });
    t.forme('lait', ellipsoide(5, 2, 3, 1.2), { decalage: 0.8 });
    for (let x = 1; x <= 8; x++) t.poser(x, 9, 'lait', 1);
    t.contour(); t.texture(s, 'bidonRue'); }
  // un tas de bûches, sous la fenêtre
  { const t = T(36, 18);
    for (let r = 0; r < 3; r++) for (let k = 0; k < 6 - r; k++) { const x = 4 + k * 5.4 + r * 2.7, y = 15 - r * 4.4;
      t.forme('buche', ellipsoide(x, y, 2.8, 2.4), { decalage: 0.1 }); t.forme('aubier', ellipsoide(x - 0.3, y - 0.2, 1.8, 1.5), { decalage: 0.6, bord: false, ombre: false }); t.poser(Math.round(x - 0.3), Math.round(y - 0.2), 'buche', 2); }
    t.contour(); t.texture(s, 'buchesRue'); }
  // un panier d'osier plein de pommes
  { const t = T(16, 12);
    for (const [x, y, m] of [[4, 4, 'pomme'], [7, 3, 'pommeV'], [10, 4, 'pomme'], [12, 5, 'pomme'], [6, 5, 'pomme']]) t.forme(m, ellipsoide(x, y, 2.2, 2), { decalage: 0.3 });
    t.forme('osier', (x, y) => (y >= 5 && y <= 11 && Math.abs(x + 0.5 - 8) <= 7 - (y - 5) * 0.3 ? [(x + 0.5 - 8) / 7, 0.2, 0.8] : null), { motif: (x, y) => ((x + y) % 2 ? -0.6 : 0) });
    for (let x = 1; x <= 14; x++) t.poser(x, 5, 'osier', 4);
    t.contour(); t.texture(s, 'panierRue'); }
  // un baquet de romarin, à côté de la porte (ses petites fleurs blanches, à la belle saison)
  for (const fleurs of [true, false]) { const t = T(16, 20);
    t.forme('chene', (x, y) => (y >= 12 && y <= 19 && Math.abs(x + 0.5 - 8) <= 6 - (y - 12) * 0.2 ? [(x + 0.5 - 8) / 6, 0, 0.8] : null), { motif: (x, y) => (x % 3 === 0 ? -0.6 : 0) });
    for (const y of [13, 18]) for (let x = 2; x <= 14; x++) t.poser(x, y, 'fer', 2);
    for (let k = 0; k < 16; k++) { const x0 = 3 + k * 0.65, a = -Math.PI / 2 + (k - 7.5) * 0.09; for (let j = 0; j < 9 + (k % 3) * 2; j++) t.poser(Math.round(x0 + Math.cos(a) * j), Math.round(12 + Math.sin(a) * j), 'romarin', 2 + ((j + k) % 3 === 0 ? 2 : 1)); }
    if (fleurs) for (const [x, y] of [[5, 4], [9, 2], [12, 5]]) t.poser(x, y, 'fleurB', 3);
    t.contour(); t.texture(s, fleurs ? 'romarinRue' : 'romarinRueNu'); }
  // des touffes d'herbe et des pissenlits, entre les pavés et au pied des murs
  { const t = T(9, 7); for (const [a, l] of [[-2.2, 5], [-1.8, 6], [-1.5, 6], [-1.2, 5], [-0.9, 4]]) for (let k = 0; k < l; k++) t.poser(Math.round(4 + Math.cos(a) * k), Math.round(6 + Math.sin(a) * k), 'herbe', 2 + (k > 2 ? 1 : 0)); t.contour(); t.texture(s, 'touffeRue'); }
  { const t = T(7, 9); for (let y = 3; y < 9; y++) t.poser(3, y, 'herbe', 2); for (const [x, y] of [[1, 8], [5, 8], [0, 7], [6, 7]]) t.poser(x, y, 'herbe', 3); t.forme('jaune', ellipsoide(3.5, 2, 2.2, 1.8), { decalage: 0.4, ombre: false }); t.contour(); t.texture(s, 'pissenlitRue'); }
  // la corde à linge, deux images (le linge se balance au vent)
  for (let f = 0; f < 2; f++) { const L = 62, H = 30, t = T(L, H);
    const corde = x => 3 + Math.round(Math.sin(x / (L - 1) * Math.PI) * 5);
    for (let x = 0; x < L; x++) t.poser(x, corde(x), 'chanvre', 2);
    const v = f ? 1 : -1;   // (le vent : le bas des linges part d'un côté, puis de l'autre)
    const linge = (x0, l, h, mat, motif) => { const y0 = corde(x0 + l / 2) + 1;
      for (let y = 0; y < h; y++) { const dec = Math.round(v * y / h * 1.6); for (let x = 0; x < l; x++) { let i = 3 + (x === 0 ? 1 : x === l - 1 ? -1 : 0) + (y === h - 1 ? -1 : 0); if (motif) i += motif(x, y); t.poser(x0 + x + dec, y0 + y, mat, i); } }
      t.poser(x0 + 1, y0 - 1, 'cheneSombre', 2); t.poser(x0 + l - 2, y0 - 1, 'cheneSombre', 2); };   // (les pinces)
    // une chemise blanche (le col, les manches qui pendent), un torchon rayé, deux chaussettes, un tablier bleu
    const dec = y => Math.round(v * y / 13 * 1.6);
    { const x0 = 5, y0 = corde(11) + 1;
      for (let y = 0; y < 13; y++) for (let x = 0; x < 12; x++) { if (y < 2 && x > 4 && x < 7) continue; t.poser(x0 + x + dec(y), y0 + y, 'linB', 3 + (x === 0 ? 1 : x === 11 ? -1 : 0) + (y === 12 ? -1 : 0) + (x === 6 && y > 2 && y % 3 === 0 ? -2 : 0)); }
      for (const sx of [-3, 12]) for (let y = 1; y < 9; y++) for (let x = 0; x < 3; x++) t.poser(x0 + sx + x + dec(y), y0 + y, 'linB', 2 + (x === 0 ? 1 : 0) - (y === 8 ? 1 : 0));
      t.poser(x0 + 1, y0 - 1, 'cheneSombre', 2); t.poser(x0 + 10, y0 - 1, 'cheneSombre', 2); }
    linge(24, 10, 9, 'linR', (x, y) => (Math.floor(x / 2) % 2 ? 1 : -1));
    for (const [x0, mat] of [[37, 'linBl'], [43, 'linR']]) { const y0 = corde(x0) + 1;
      for (let y = 0; y < 7; y++) for (let x = 0; x < 3; x++) t.poser(x0 + x + dec(y), y0 + y, mat, 3 + (x === 0 ? 1 : 0) - (y === 0 ? 1 : 0));
      for (let x = 3; x < 5; x++) for (let y = 5; y < 7; y++) t.poser(x0 + x + dec(y), y0 + y, mat, 2);
      t.poser(x0 + 1, y0 - 1, 'cheneSombre', 2); }
    { const x0 = 49, y0 = corde(54) + 1;
      for (let y = 0; y < 15; y++) { const l = y < 4 ? 6 : 10, ox = y < 4 ? 2 : 0; for (let x = 0; x < l; x++) t.poser(x0 + ox + x + dec(y), y0 + y, 'linBl', 3 + (x === 0 ? 1 : x === l - 1 ? -1 : 0) + (y === 14 ? -1 : 0) + (y === 4 ? -1 : 0)); }
      for (let y = 8; y < 11; y++) for (let x = 3; x < 7; x++) t.poser(x0 + x + dec(y), y0 + y, 'linBl', x === 3 || y === 10 ? 2 : 4);   // (la poche)
      for (const sx of [0, 9]) for (let y = 4; y < 9; y++) t.poser(x0 + sx + dec(y), y0 + y + 1, 'lin', 4);                       // (les cordons qui pendent)
      t.poser(x0 + 3, y0 - 1, 'cheneSombre', 2); t.poser(x0 + 6, y0 - 1, 'cheneSombre', 2); }
    t.contour(); t.texture(s, 'lingeRue_' + f); }
}

// ---------- les petites bêtes, à la finesse des personnages (×1) ----------
function betesRueHD(s) {
  if (s.textures.exists('pigeonRue_debout')) return;
  const T = (l, h) => { const t = toileObjet(l, h); Object.assign(t.rampes, { plume: rampe(0x8a8aa0), plumeF: rampe(0x6a6a80), cou: rampe(0x5a8a7a), bec: rampe(0x2a2a30), patte: rampe(0xd0705a), oeilP: rampeVive(0xe8801a) }); return t; };
  // le pigeon, tourné vers la gauche : debout, boit (la tête baissée vers l'eau), picore, ailes levées (il s'ébroue), gonflé (il roucoule)
  const pigeon = pose => { const t = T(24, 19), cx = 12, sol = 18, b = pose === 'boit' || pose === 'picore' ? 1 : 0;
    const cy = 11 + b;
    t.forme('plumeF', polygoneHD([[cx + 3, cy - 1], [cx + 11, cy + (b ? -3 : 1)], [cx + 11, cy + (b ? 0 : 4)], [cx + 3, cy + 3]]), { motif: (x, y) => (x % 2 ? -0.4 : 0) });   // (la queue)
    if (pose === 'ailes') t.forme('plumeF', polygoneHD([[cx - 1, cy - 2], [cx + 5, cy - 2], [cx + 9, cy - 10], [cx + 3, cy - 9]]), { decalage: -0.6 });
    t.forme('plume', ellipsoide(cx, cy, pose === 'gonfle' ? 6.6 : 6, pose === 'gonfle' ? 5.2 : 4.4));
    // le cou irisé, la tête
    const tete = pose === 'boit' ? [cx - 8, cy + 2] : pose === 'picore' ? [cx - 8, sol - 3] : pose === 'gonfle' ? [cx - 4, cy - 8] : [cx - 5, cy - 7];
    traitHD(t, 'cou', [[cx - 3, cy - 1], [(cx - 3 + tete[0]) / 2, (cy - 1 + tete[1]) / 2 - (b ? 1 : 0)], [tete[0] + 1, tete[1] + 1]], pose === 'gonfle' ? 3.4 : 2.6, 0.3);
    t.forme('plume', ellipsoide(tete[0], tete[1], 2.6, 2.3), { decalage: 0.5 });
    t.poser(tete[0] - 3, tete[1] + 0, 'bec', 3); t.poser(tete[0] - 4, tete[1] + (b ? 1 : 0), 'bec', 2); t.poser(tete[0] - 2, tete[1] - 1, 'lin', 5);
    t.poser(tete[0] - 1, tete[1] - 1, 'oeilP', 4); t.poser(tete[0] - 1, tete[1], 'encre', 0);
    // l'aile près de nous : repliée (deux barres noires) ou levée
    if (pose === 'ailes') { t.forme('plume', polygoneHD([[cx - 3, cy - 1], [cx + 4, cy - 1], [cx + 10, cy - 12], [cx + 5, cy - 13], [cx, cy - 9]]), { motif: (x, y) => ((x + y) % 3 === 0 ? -0.5 : 0) });
      for (const [x, y] of [[cx + 6, cy - 10], [cx + 7, cy - 9], [cx + 8, cy - 11]]) t.poser(x, y, 'encre', 1); }
    else { t.forme('plume', polygoneHD([[cx - 3, cy - 2], [cx + 5, cy - 2], [cx + 9, cy + 2], [cx, cy + 3]]), { decalage: -0.2 });
      for (const [x, y] of [[cx + 2, cy], [cx + 3, cy], [cx + 4, cy + 1], [cx + 3, cy + 2], [cx + 4, cy + 2], [cx + 5, cy + 2]]) t.poser(x, y, 'encre', 1); }
    for (const dx of [-1, 2]) { for (let y = cy + 4; y < sol; y++) t.poser(cx + dx, y, 'patte', 3); t.poser(cx + dx - 1, sol, 'patte', 2); t.poser(cx + dx, sol, 'patte', 3); t.poser(cx + dx + 1, sol, 'patte', 2); }
    t.contour(); t.texture(s, 'pigeonRue_' + pose); };
  ['debout', 'boit', 'picore', 'ailes', 'gonfle'].forEach(pigeon);
  // le papillon : ailes ouvertes, ailes levées (deux images), en trois robes : le citron, la piéride, le paon du jour
  const papillon = (nom, base, motif) => [0, 1].forEach(f => { const t = toileObjet(11, 9); t.rampes.aile = rampeVive(base);
    if (!f) { for (const sx of [-1, 1]) { t.forme('aile', ellipsoide(5.5 + sx * 2.8, 3.2, 2.6, 2.8), { decalage: 0.5, ombre: false }); t.forme('aile', ellipsoide(5.5 + sx * 2.2, 6.4, 1.8, 1.8), { decalage: 0.1, ombre: false }); }
      if (motif) motif(t); }
    else { t.forme('aile', ellipsoide(5.5, 2.4, 1.8, 3.2, (x, y) => y < 5), { decalage: 0.1, ombre: false }); t.forme('aile', ellipsoide(5, 2.2, 0.9, 2.4, (x, y) => y < 5), { decalage: 0.9, ombre: false, bord: false }); }
    for (let y = f ? 4 : 2; y < 8; y++) t.poser(5, y, 'encre', y < 4 ? 1 : 2);
    if (!f) { t.poser(4, 0, 'encre', 2); t.poser(6, 0, 'encre', 2); } else { t.poser(3, 3, 'encre', 2); t.poser(2, 2, 'encre', 2); }
    t.contour(); t.texture(s, 'papillonRue_' + nom + f); });
  papillon('citron', 0xf0d838, null);
  papillon('pieride', 0xf2f0e6, t => { for (const [x, y] of [[1, 2], [2, 1], [9, 2], [8, 1], [3, 3], [7, 3]]) t.poser(x, y, 'encre', x === 3 || x === 7 ? 3 : 1); });
  papillon('paon', 0xc0482e, t => { t.rampes.oeilA = rampeVive(0x3a6ad8); for (const x of [2, 8]) { t.poser(x, 2, 'oeilA', 4); t.poser(x, 3, 'or', 5); t.poser(x + (x < 5 ? 1 : -1), 2, 'encre', 1); } for (const x of [3, 7]) t.poser(x, 6, 'encre', 1); });
  // l'abeille : ailes hautes, ailes basses
  [0, 1].forEach(f => { const t = toileObjet(7, 6); t.rampes.miel = rampeVive(0xe8b020);
    t.forme('miel', ellipsoide(3.5, 3.6, 2.6, 1.6), { decalage: 0.4, ombre: false });
    t.poser(3, 3, 'encre', 1); t.poser(3, 4, 'encre', 1); t.poser(5, 3, 'encre', 1); t.poser(5, 4, 'encre', 1); t.poser(1, 3, 'encre', 0);
    for (const [x, y] of f ? [[3, 0], [4, 0], [4, 1], [2, 1]] : [[4, 1], [5, 1], [5, 2], [3, 2]]) t.poser(x, y, 'verre', 5);
    t.contour(); t.texture(s, 'abeilleRue_' + f); });
  // la libellule bleue : ailes en avant, ailes en arrière
  [0, 1].forEach(f => { const t = toileObjet(17, 9); t.rampes.libel = rampeVive(0x2a7ac8);
    for (let x = 5; x < 16; x++) t.poser(x, 4, 'libel', x % 2 ? 4 : 3);
    t.forme('libel', ellipsoide(4, 4, 1.8, 1.4), { decalage: 0.4, ombre: false });
    t.forme('libel', ellipsoide(1.8, 3.8, 1.4, 1.4), { decalage: 0.8, ombre: false }); t.poser(1, 3, 'encre', 1);
    for (const [ax, ay, bx, by] of f ? [[4, 3, 1, 0], [5, 3, 8, 0], [4, 5, 1, 8], [5, 5, 8, 8]] : [[4, 3, 2, 0], [5, 3, 9, 1], [4, 5, 2, 8], [5, 5, 9, 7]])
      for (let k = 0; k <= 5; k++) { const x = Math.round(ax + (bx - ax) * k / 5), y = Math.round(ay + (by - ay) * k / 5); t.poser(x, y, 'verre', k % 2 ? 5 : 4); }
    t.contour(); t.texture(s, 'libelluleRue_' + f); });
  // le poisson rouge : la queue d'un côté, puis de l'autre
  [0, 1].forEach(f => { const t = toileObjet(10, 6); t.rampes.poisson = rampeVive(0xf0701a);
    t.forme('poisson', ellipsoide(3.6, 3, 3.2, 1.8), { decalage: 0.5, ombre: false });
    t.forme('poisson', polygoneHD(f ? [[6, 3], [9.5, 0.6], [9.5, 3.4]] : [[6, 3], [9.5, 2.6], [9.5, 5.4]]), { decalage: 0.2, ombre: false });
    t.poser(1, 2, 'encre', 0);
    t.texture(s, 'poissonRue_' + f); });
  // le moineau sur le réverbère : posé, picore
  ['pose', 'picore'].forEach(pose => { const t = toileObjet(12, 10); t.rampes.brun = rampe(0x8a6038); t.rampes.gris = rampe(0x9a948a);
    const b = pose === 'picore';
    t.forme('brun', polygoneHD([[7, 5], [11, b ? 2 : 4], [11, b ? 4 : 6], [7, 7]]));
    t.forme('gris', ellipsoide(6, 6, 3.6, 2.6)); t.forme('brun', ellipsoide(6.5, 5.2, 3, 1.8), { motif: (x, y) => (x % 2 ? -0.6 : 0) });
    t.forme('brun', ellipsoide(b ? 2.4 : 3, b ? 6.6 : 3, 2, 1.8), { decalage: 0.3 }); t.poser(b ? 0 : 1, b ? 7 : 3, 'chanvre', 4); t.poser(2, b ? 6 : 2, 'encre', 0);
    for (const x of [5, 7]) t.poser(x, 9, 'cheneSombre', 2);
    t.contour(); t.texture(s, 'moineauRue_' + pose); });
}

// ---------- (planche 80, porche A) le porche couvert du marché, vu depuis la rue ----------
// Deux poteaux de chêne sur leurs socles de grès, les aisseliers, le linteau, un petit toit de tuiles ; les deux battants
// sont ouverts vers la place (ils fuient vers le fond, derrière les poteaux) ; une palissade de part et d'autre. Par
// l'ouverture, la place : colorée le jour, endormie la nuit. Les chaînes de l'écriteau pendent sous le linteau.
const PORCHE_RUE = { L: 176, H: 152, poteaux: [26, 150], linteau: 22, chaines: [68, 108] };

// La place du marché vue par le porche, selon la saison et l'heure : les maisons du fond (neige sur les toits l'hiver,
// fenêtres allumées la nuit), deux arbres (en fleurs, verts, roux, nus), la petite fontaine de la place (gelée l'hiver),
// deux étals (bâchés la nuit) et ce qu'on y vend selon la saison, les guirlandes, les passants le jour, une lanterne la
// nuit. Tout est peint dans l'ouverture [x0, x1[ × [haut, sol] de la toile du porche.
function peindrePlacePorche(t, x0, x1, haut, sol, jour, saison) {
  const S = saison || 'moissons', hiver = S === 'givre', n = jour ? 0 : -2;
  const dans = (x, y) => x >= x0 && x < x1 && y >= haut && y <= sol;
  const P = (x, y, m, k) => { if (dans(x, y)) t.poser(x, y, m, Math.max(0, Math.min(5, Math.round(k)))); };
  const ciel = jour ? { semailles: 0x9ad4f0, moissons: 0x8cc4ec, brumes: 0xa8b4c4, givre: 0xbccce0 }[S] : 0x161c30;
  const feuillage = { semailles: 0x6cc050, moissons: 0x3a8a30, brumes: 0xd06a28, givre: 0x6a5a48 }[S];
  const tissus = { semailles: [0xe878a8, 0x7ac0e8], moissons: [0xc83a2a, 0x2a5ab8], brumes: [0xc86a20, 0x8a3a1a], givre: [0x2a7a3a, 0xb82a2a] }[S];
  Object.assign(t.rampes, { cielP: rampe(ciel), neige: [0x8a96a8, 0xaab6c8, 0xc8d2e0, 0xdce4ee, 0xeef2f8, 0xffffff], feuillageP: rampe(feuillage),
    fleurP: rampeVive(0xf8b0d0), tissuA: rampe(tissus[0]), tissuB: rampe(tissus[1]), fanionR: rampe(0xc83a2a), fanionB: rampe(0x2a5ab8), fanionJ: rampe(0xe0b030),
    fanionV: rampe(0x3a8a3a), sapin: rampe(0x2a6a30), peauF: rampe(0xd8a070), habitA: rampe(hiver ? 0x3a2a4a : 0x8a3a3a), habitB: rampe(hiver ? 0x2a3a5a : 0x3a6a9a),
    habitC: rampe(hiver ? 0x4a3a2a : 0x5a8a3a), habitD: rampe(hiver ? 0x5a2a2a : 0x8a6a9a), citrouille: rampeVive(0xe0701a), pomme: rampeVive(0xc8382a),
    pain: rampe(0xc8904a), ble: rampe(0xd8b048), eauP: rampe(hiver ? 0xc8e0ec : 0x4a9ac8), gresP: rampe(0xb8a07a), braise: RAMPES_RUE.braise, bache: rampe(0x6a5a44) });
  // (v1.64, retours du joueur) le ciel n'est plus peint : le haut de l'ouverture reste vide, et l'on voit à travers le vrai
  // ciel de la rue (son heure, son temps, ses nuages et ses étoiles)
  const base = sol - 39;   // (le pied des maisons du fond : la place commence là)
  // (v1.64, planche 89 v4 b, chantier 1) au fond de la place, plus de maisons : le pied des Coteaux, comme sur la place
  // elle-même. La pente d'herbe ondule sous le ciel ; deux buttes, leurs portes rondes dans leur cercle de pierre, une fenêtre
  // ronde (allumée la nuit), une cheminée qui sort de l'herbe.
  t.rampes.penteP = rampe({ semailles: 0x7aa84e, moissons: 0x94a84a, brumes: 0x8a9a52, givre: 0xdce6ec }[S]);
  Object.assign(t.rampes, { porteRP: rampe(0x9a3226), porteVP: rampe(0x2e6e3a), porteJP: rampe(0xc89a2e) });
  for (let x = x0; x < x1; x++) {
    const crete = base - 24 - Math.round(Math.sin((x - x0) / 19) * 4 + Math.sin((x - x0) / 7) * 1.2);
    for (let y = crete; y < base; y++) P(x, y, 'penteP', (y === crete ? 4 : y > base - 4 ? 2 : 3) + n);
  }
  for (const [bx, rx, porte, fen] of [[x0 + 26, 17, 'porteRP', 1], [x0 + 86, 19, 'porteVP', -1]]) {
    const ry = rx * 0.78;
    for (let y = Math.floor(base - ry); y < base; y++) for (let x = bx - rx; x <= bx + rx; x++) {
      const u = (x + 0.5 - bx) / rx, v = (base - y - 0.5) / ry; if (u * u + v * v > 1) continue;
      P(x, y, 'penteP', (v > 0.92 ? 4 : 3 - (u > 0.45 ? 1 : 0) + (u < -0.3 && v > 0.4 ? 1 : 0)) + n);
    }
    const pr = 4.2, py = base - pr - 0.5;   // la porte ronde, son cercle de pierre, le bouton de laiton au milieu
    for (let y = Math.floor(py - pr - 2); y < base; y++) for (let x = Math.floor(bx - pr - 2); x <= bx + pr + 2; x++) {
      const d = Math.hypot(x + 0.5 - bx, y + 0.5 - py); if (d > pr + 1.6 && !(y >= py && Math.abs(x + 0.5 - bx) <= pr + 1.6)) continue;
      P(x, y, d <= pr || (y >= py && Math.abs(x + 0.5 - bx) <= pr) ? porte : 'gresP', (d <= pr || (y >= py && Math.abs(x + 0.5 - bx) <= pr) ? 3 - (x > bx ? 1 : 0) : 4) + n);
    }
    P(bx, Math.round(py), 'or', 5 + n);
    const fx = bx + fen * 10, fy = base - 6;   // la fenêtre ronde
    for (let y = fy - 2; y <= fy + 2; y++) for (let x = fx - 2; x <= fx + 2; x++) { const d = Math.hypot(x - fx, y - fy); if (d > 2.3) continue; P(x, y, d > 1.4 ? porte : jour ? 'vitreNoire' : 'vitre', d > 1.4 ? 4 + n : jour ? 3 : 4); }
    const cx = bx - fen * 8, cy = Math.round(base - ry * Math.sqrt(1 - (8 / rx) ** 2)) - 3;   // la cheminée
    for (let y = cy; y < cy + 5; y++) for (let x = cx; x < cx + 3; x++) P(x, y, 'pierre', (y === cy ? 4 : x === cx ? 3 : 2) + n);
    if (hiver) for (let x = cx; x < cx + 3; x++) P(x, cy - 1, 'neige', 5 + n / 2);
    else for (let k = 0; k < 5; k++) P(cx + 1 + Math.round(Math.sin(k * 1.3) * 1.2) + Math.floor(k / 2), cy - 2 - k * 2, 'neige', (jour ? 3 : 1) + (k < 2 ? 1 : 0));   // (un filet de fumée)
  }
  // le sol de la place : pavé, poussière d'été, herbe du printemps, feuilles rousses, ou neige et ses traces
  for (let y = base; y <= sol; y++) for (let x = x0; x < x1; x++) {
    const v = (y - base) / (sol - base), pas = 3 + v * 7, rang = Math.floor(Math.pow(v, 0.7) * 9), joint = ((x - x0) / pas + rang * 0.5) % 1 < 0.14 || (y - base) % Math.max(2, Math.round(pas * 0.5)) === 0;
    if (hiver) { const trace = Math.abs(x - (x0 + 57 + (y - base) * 0.4)) < 2 || Math.abs(x - (x0 + 30 - (y - base) * 0.3)) < 1.5; P(x, y, trace ? 'pierre' : 'neige', (trace ? 2 : 4 - (joint ? 1 : 0)) + n); continue; }
    P(x, y, 'pierre', (joint ? 1 : 3 + (S === 'moissons' ? 1 : 0)) + n - (v < 0.15 ? 1 : 0));
    if (S === 'semailles' && hachage(x, y, 8234) > 0.95) P(x, y, 'feuillageP', 3 + n);
    if (S === 'brumes' && hachage(x, y, 8235) > 0.9) P(x, y, hachage(x, y, 8236) > 0.5 ? 'feuillageP' : 'fanionJ', 3 + n);
  }
  // deux arbres de la place, devant les maisons : de vrais arbres (arbresHD.js), deux espèces, qui suivent la saison
  [[x0 + 20, 'pommier', 'P1', 1], [x0 + 95, 'bouleau', 'P2', 2]].forEach(([ax, espece, suf, gr]) => {
    for (const [m, ramp] of Object.entries(rampesArbre(S, espece))) t.rampes[m + suf] = ramp;
    peindreArbre((x, y, m, i) => P(x, y, m + suf, i + n), { cx: ax, base: base + 3, H: 36, espece, saison: S, graine: gr });
  });
  // la petite fontaine de la place, au milieu (l'hiver, son eau est gelée et ne coule plus)
  { const fx = x0 + 57, fy = base + 9;
    for (let y = fy - 4; y <= fy + 3; y++) for (let x = fx - 13; x <= fx + 13; x++) { const d = ((x + 0.5 - fx) / 13) ** 2 + ((y + 0.5 - fy) / 3.5) ** 2; if (d <= 1) P(x, y, d < 0.55 && y <= fy ? 'eauP' : 'gresP', (d < 0.55 && y <= fy ? 3 : y > fy ? 2 : 4) + n); }
    for (let y = fy - 14; y < fy - 2; y++) { P(fx, y, 'gresP', 4 + n); P(fx + 1, y, 'gresP', 2 + n); }
    for (let x = fx - 5; x <= fx + 6; x++) { P(x, fy - 14, 'gresP', 4 + n); P(x, fy - 13, 'gresP', 2 + n); }
    if (hiver) for (let x = fx - 5; x <= fx + 6; x++) P(x, fy - 15, 'neige', 5 + n / 2);
    else if (jour) for (const k of [1, 3, 5]) { P(fx - 6, fy - 13 + k, 'eauP', 4); P(fx + 7, fy - 13 + k, 'eauP', 4); } }
  // deux étals : l'auvent rayé (bâché la nuit, neigeux l'hiver), les montants, la table, la marchandise de la saison
  for (const [ex, el, i] of [[x0 + 3, 26, 0], [x0 + 84, 27, 1]]) {
    const ya = base + 2, yt = base + 15;
    for (let y = ya; y < ya + 6; y++) for (let x = ex - (y - ya) / 2; x < ex + el + (y - ya) / 2; x++) {
      const xr = Math.round(x), raye = Math.floor((xr - ex) / 3) % 2;
      if (hiver && y < ya + 2) { P(xr, y, 'neige', 5 + n / 2); continue; }
      P(xr, y, !jour ? 'bache' : raye ? (i ? 'tissuB' : 'tissuA') : 'parchemin', (jour ? 3 : 2) + (y === ya ? 1 : 0) - (y === ya + 5 ? 1 : 0) + (jour ? 0 : n / 2));
    }
    for (const px of [ex, ex + el - 2]) for (let y = ya + 6; y < yt + 9; y++) { P(px, y, 'chene', 2 + n); P(px + 1, y, 'chene', 1 + n); }
    for (let y = yt; y < yt + 3; y++) for (let x = ex - 1; x < ex + el + 1; x++) P(x, y, jour ? 'chene' : 'bache', (y === yt ? 4 : 2) + n);
    if (!jour) { for (let y = yt - 5; y < yt; y++) for (let x = ex + 1; x < ex + el - 1; x++) P(x, y, 'bache', 2 + n / 2 + (y === yt - 5 ? 1 : 0)); continue; }   // (la marchandise, sous sa bâche)
    for (let x = ex + 1; x < ex + el - 1; x += 3) {
      const m = S === 'semailles' ? ['fleurP', 'feuillageP', 'fanionJ'][(x + i) % 3] : S === 'moissons' ? ['pain', 'ble', 'pomme'][(x + i) % 3] : S === 'brumes' ? ['citrouille', 'pomme', 'pain'][(x + i) % 3] : ['pain', 'sapin'][(x + i) % 2];
      P(x, yt - 1, m, 4); P(x + 1, yt - 1, m, 3); P(x, yt - 2, m, 3);
    }
    if (S === 'moissons' && i === 0) for (const gx of [ex - 4, ex - 2]) { for (let y = yt - 6; y < yt + 9; y++) P(gx, y, 'ble', y < yt - 3 ? 5 : 3); P(gx - 1, yt - 6, 'ble', 4); P(gx + 1, yt - 6, 'ble', 4); P(gx, yt + 2, 'chanvre', 2); }   // (deux gerbes de blé, appuyées contre l'étal)
    if (S === 'brumes' && i === 1) for (const [cx, cy] of [[ex + el + 3, yt + 7], [ex + el + 6, yt + 8]]) for (let y = cy - 2; y <= cy + 1; y++) for (let x = cx - 2; x <= cx + 2; x++) P(x, y, 'citrouille', 3 + (x < cx ? 1 : 0));   // (des citrouilles au pied de l'étal)
    if (hiver && i === 1) { for (let x = ex + el + 2; x < ex + el + 7; x++) P(x, yt + 5, 'fer', 2); for (let x = ex + el + 3; x < ex + el + 6; x++) P(x, yt + 4, 'braise', 4); for (let y = yt + 6; y < yt + 9; y++) P(ex + el + 4, y, 'fer', 1); }   // (le brasero du marchand de marrons)
  }
  // les guirlandes, d'un côté à l'autre (l'hiver, du sapin et des nœuds rouges)
  for (const [ya, creux] of [[haut + 14, 7], [haut + 28, 5]]) for (let x = x0; x < x1; x++) {
    const u = (x - x0) / (x1 - x0), y = Math.round(ya + Math.sin(u * Math.PI) * creux);
    P(x, y, hiver ? 'sapin' : 'chene', (hiver ? 3 : 1) + n);
    if (hiver) { if ((x - x0) % 9 === 0) { P(x, y + 1, 'fanionR', 4 + n); P(x, y + 2, 'fanionR', 3 + n); } else P(x, y + 1, 'sapin', 2 + n); continue; }
    if ((x - x0) % 6 < 4) { const m = (S === 'brumes' ? ['fanionR', 'fanionJ', 'tissuA', 'tissuB'] : ['fanionR', 'fanionB', 'fanionJ', 'fanionV'])[Math.floor((x - x0) / 6) % 4];
      for (let k = 1; k <= 4 - Math.abs(((x - x0) % 6) - 1.5) * 1.2; k++) P(x, y + k, m, 3 + n); }
  }
  // (v1.64) les passants ne sont plus peints : ce sont de vrais petits corps qui vont et viennent (passantsPorche) ; la nuit,
  // une lanterne veille sur la place endormie
  if (!jour) { const lx = x0 + 40; for (let y = base - 6; y < sol - 6; y++) P(lx, y, 'fer', 2); for (let y = base - 12; y < base - 6; y++) for (let x = lx - 2; x <= lx + 2; x++) P(x, y, x === lx - 2 || x === lx + 2 ? 'fer' : 'vitre', x === lx - 2 || x === lx + 2 ? 1 : 5); }
  // des caisses et un tonneau, devant, de part et d'autre (la neige dessus, l'hiver)
  for (const [cx, cl, ch] of [[x0 + 2, 8, 7], [x1 - 15, 9, 8], [x1 - 9, 6, 5]]) for (let y = sol - ch; y <= sol; y++) for (let x = cx; x < cx + cl; x++)
    P(x, y, hiver && y === sol - ch ? 'neige' : 'chene', (hiver && y === sol - ch ? 5 : (x === cx || y === sol - ch ? 4 : 2) + ((x + y) % 4 === 0 ? -1 : 0)) + n);
}

// (v1.64, retours du joueur) Les passants de la place, vus à travers le porche depuis la rue : de vrais petits corps du
// moteur, à l'échelle de leur distance (plus petits au fond), qui flânent d'un bout à l'autre de l'ouverture, s'arrêtent,
// respirent, repartent dans l'autre sens. Ils passent derrière les battants et les poteaux (le porche est posé par-dessus).
//   foule : le conteneur, entre la place peinte et le porche ; cx, sol : le pied du porche dans la rue
function passantsPorche(scene, foule, cx, sol, { hiver = false } = {}) {
  const { poteaux: [pg, pd] } = PORCHE_RUE, X = tx => cx + (tx - PORCHE_RUE.L / 2) * 2, Y = ty => sol + 2 - (PORCHE_RUE.H - ty) * 2;
  const xa = X(pg + 18), xb = X(pd - 17), races = ['humain', 'hobbit', 'nain', 'elfe', 'humain', 'hobbit'];
  [[0.2, 3, 2.75], [0.55, 8, 2.35], [0.85, 2, 2.85], [0.38, 11, 2.15], [0.68, 5, 2.55]].forEach(([u, prof, ech], i) => {
    const quoi = { nom: 'Flâneur du porche ' + i, race: races[i % races.length], feminin: i % 2 === 1, niveau: 'novice' };
    const y = Y(PORCHE_RUE.H - 3 - prof), p = imageCorps(scene, xa + (xb - xa) * u, y, quoi, ech).setFlipX(i % 2 === 0);
    foule.add(p); foule.sort('y');
    const souffle = () => scene.tweens.add({ targets: p, scaleY: p.scaleY * 1.015, duration: 1300 + i * 170, yoyo: true, repeat: 1, ease: 'Sine.easeInOut' });
    const suite = () => {
      if (!p.active) return;
      if (Math.random() < 0.45) { souffle(); scene.time.delayedCall(2600 + Math.random() * 3000, suite); return; }   // (il s'arrête, regarde un étal)
      const cible = Phaser.Math.Clamp(p.x + (Math.random() < 0.5 ? -1 : 1) * (40 + Math.random() * 90), xa, xb), duree = Math.abs(cible - p.x) / 0.022;
      if (duree < 300) { scene.time.delayedCall(800, suite); return; }
      p.setFlipX(cible < p.x);
      pasDeMarche(scene, p, duree, { poussiere: false });
      scene.tweens.add({ targets: p, x: cible, duration: duree, onComplete: () => scene.time.delayedCall(600 + Math.random() * 2400, suite) });
    };
    scene.time.delayedCall(400 + i * 700, suite);
  });
}

// Le porche, pour la saison du jour et l'heure (une texture par saison, faite la première fois qu'on en a besoin)
function porcheRueHD(scene, jour = true) {
  const saison = (typeof saisonActuelle === 'function' && saisonActuelle()) || 'moissons';
  const cle = 'porcheRueHD_' + saison + (jour ? '_jour' : '_nuit');
  if (scene.textures.exists(cle)) return cle;
  const { L, H, poteaux: [pg, pd], linteau } = PORCHE_RUE, sol = H - 1, hiver = saison === 'givre';
  {
    const x0 = pg + 5, x1 = pd - 4, haut = linteau + 7;
    // (v1.64) la place, au travers : une toile à part, posée derrière le porche ; entre les deux passent les passants de la
    // place (de vrais corps), et au-dessus de la pente des Coteaux, c'est le ciel de la rue
    const f = toileDecor(L, H); Object.assign(f.rampes, RAMPES_RUE); f.rampes.gres = rampe(0xb8a07a);
    peindrePlacePorche(f, x0, x1, haut, sol, jour, saison);
    f.texture(scene, 'placePorche_' + saison + (jour ? '_jour' : '_nuit'));
    const t = toileDecor(L, H); Object.assign(t.rampes, RAMPES_RUE); t.rampes.gres = rampe(0xb8a07a);
    // les deux battants, ouverts vers la place : ils partent du gond et fuient vers le fond (plus courts, plus hauts du bas)
    for (const [xg, sens, g] of [[x0, 1, 8201], [x1 - 1, -1, 8202]]) {
      const dx = 12, hb = 92;
      for (let u = 0; u <= dx; u++) {
        const v = u / dx, x = xg + sens * u, yb = sol - 2 - Math.round(v * 9), yt = sol - 2 - hb + Math.round(v * 7);
        for (let y = yt; y <= yb; y++) {
          const h = (yb - y) / (yb - yt);
          if (Math.abs(h - 0.18) < 0.012 || Math.abs(h - 0.8) < 0.012) { t.poser(x, y, 'fer', 3); continue; }   // (les pentures)
          const joint = u > 0 && u % 3 === 0;
          t.poser(x, y, 'chene', joint ? 1 : u === dx ? 0 : y === yt ? 4 : 2 + (hachage(Math.floor(u / 3), Math.floor(y / 9), g) > 0.6 ? 1 : 0) - (u > dx * 0.6 ? 1 : 0));
        }
      }
    }
    // les aisseliers, entre les poteaux et le linteau
    for (const [xp, sens] of [[pg + 4, 1], [pd - 5, -1]]) for (let k = 0; k < 18; k++) for (let e = 0; e < 3; e++) t.poser(xp + sens * k, haut + 17 - k + e, 'chene', e === 0 ? 4 : 2);
    // les poteaux, sur leurs socles de grès
    for (const cx of [pg, pd]) {
      planche(t, cx - 4, haut, 9, sol - 8 - haut, 'chene', { horizontale: false, graine: 8203 + cx, noeuds: 1 });
      for (let y = haut; y < sol - 8; y++) { t.poser(cx - 4, y, 'chene', 5); t.poser(cx + 4, y, 'chene', 1); }
      moellons(t, cx - 7, sol - 8, 15, 9, 8204 + cx, 'gres', 7);
      for (let x = cx - 7; x <= cx + 7; x++) t.poser(x, sol - 8, 'gres', 5);
    }
    // la palissade, de part et d'autre : des pieux taillés en pointe, deux traverses
    for (const [a, b] of [[0, pg - 7], [pd + 8, L]]) {
      for (let x = a; x < b; x++) {
        const p = (x - a) % 5, pointe = Math.abs(p - 2) * 1.2;
        for (let y = sol - 40 + Math.round(pointe); y <= sol; y++) t.poser(x, y, 'chene', p === 4 ? 0 : p === 0 ? 4 : 2 + (hachage(Math.floor((x - a) / 5), y >> 3, 8205) > 0.7 ? 1 : 0));
      }
      for (const y of [sol - 30, sol - 10]) for (let x = a; x < b; x++) { t.poser(x, y, 'cheneSombre', 3); t.poser(x, y + 1, 'cheneSombre', 1); }
    }
    // le linteau, le petit toit de tuiles
    planche(t, 4, linteau, L - 8, 7, 'chene', { graine: 8206, noeuds: 2 });
    for (let x = 4; x < L - 4; x++) t.poser(x, linteau + 7, 'cheneSombre', 1);
    toitRue(t, 0, L - 1, 6, linteau, 'tuile', 8207);
    // les chaînes de l'écriteau (il pend sous le linteau ; son nom s'écrit par-dessus)
    for (const x of PORCHE_RUE.chaines) for (let y = linteau + 8; y < linteau + 13; y++) t.poser(x, y, 'fer', y % 2 ? 4 : 2);
    // l'hiver, la neige sur la pointe des pieux, les socles et les traverses (le toit, lui, est blanchi par la saison)
    if (hiver) { t.rampes.neige = [0x8a96a8, 0xaab6c8, 0xc8d2e0, 0xdce4ee, 0xeef2f8, 0xffffff];
      for (const [a, b] of [[0, pg - 7], [pd + 8, L]]) for (let x = a; x < b; x++) { const p = (x - a) % 5; if (p > 0 && p < 4) t.poser(x, sol - 41 + Math.round(Math.abs(p - 2) * 1.2), 'neige', 5); }
      for (const cx of [pg, pd]) for (let x = cx - 7; x <= cx + 7; x++) { t.poser(x, sol - 9, 'neige', 5); t.poser(x, sol - 8, 'neige', 4); }
      for (const y of [sol - 31, sol - 11]) for (let x = 0; x < L; x++) if (x < pg - 7 || x >= pd + 8) t.poser(x, y, 'neige', 4); }
    t.contour(); t.texture(scene, cle);
  }
  return cle;
}

// Les deux chats de la rue : celui des Brindeloup (qui dort sur les bûches) et celui qui guette les pigeons à la
// fontaine. Jamais le même pelage que le tien, s'il est adopté (on ne croirait pas le voir ici).
function chatsDeLaRue(scene, G = window.GAME) {
  const tien = G && typeof chatAdopte === 'function' && chatAdopte(G) && typeof lookChat === 'function' ? lookChat(G).pelage : null;
  const choisir = liste => liste.find(p => p !== tien);
  const dormeur = creerChatHD(scene, { pelage: choisir(['roux', 'creme']), yeux: 'vert', collier: 'bleu' }, 'chatBrindeloup_' + choisir(['roux', 'creme']));
  const guetteur = creerChatHD(scene, { pelage: choisir(['noir', 'blanc']), yeux: 'or', collier: 'aucun' }, 'chatFontaine_' + choisir(['noir', 'blanc']));
  return { dormeur, guetteur };
}

// Tout ce qui vit dans la rue, posé à partir de x = o. Tout tient dans un seul conteneur (à la profondeur `prof`), pour que
// la rue puisse défiler d'un bloc (le départ en voyage) sans que rien ne s'en détache. Renvoie le conteneur.
function vieDeLaRue(scene, o, { jour = false, sol = 470, prof = jour ? 8.2 : 7.6 } = {}) {
  const G = window.GAME, P = PLACES_RUE, s = scene;
  fontaineRueHD(s); objetsRueHD(s); betesRueHD(s);
  const chats = chatsDeLaRue(s, G);
  const saison = typeof saisonActuelle === 'function' ? saisonActuelle() : null, hiver = saison === 'givre', ete = saison === 'moissons';
  const temps = G && typeof meteoDu === 'function' ? meteoDu(G) : 'soleil', mouille = ['pluie', 'orage', 'neige'].includes(temps);
  const fleurs = jour && !hiver, insectes = fleurs && !mouille && temps !== 'vent';
  const c = s.add.container(0, 0).setDepth(prof);
  const aj = (o2, dans = c) => { dans.add(o2); return o2; };
  const vivant = () => c.active && !!c.scene;
  const basculer = (img, cles, delai, hasard = 0) => { let k = 0; const tick = () => { if (!img.active) return; k = (k + 1) % cles.length; img.setTexture(cles[k]); s.time.delayedCall(delai + Math.random() * hasard, tick); }; s.time.delayedCall(Math.random() * delai, tick); return img; };
  const image = (x, y, cle, ox = 0.5, oy = 1, ech = 1) => aj(s.add.image(x, y, cle).setOrigin(ox, oy).setScale(ech));

  // ================= la maison des Brindeloup, et ce qui vit autour =================
  const mg = o + P.maison1 - 136, mh = sol + 2 - 320;   // (le coin haut-gauche de la maison, dans le monde)
  const MX = px => mg + px * 2, MY = py => mh + py * 2;
  image(MX(19.5), MY(75), fleurs ? 'jardiniereRueR' : 'jardiniereRueNu', 0, 0, 2);
  image(MX(87.5), MY(75), fleurs ? 'jardiniereRueP' : 'jardiniereRueNu', 0, 0, 2);
  image(MX(3), MY(160), 'lierreMurRue', 0, 1, 2);
  image(MX(13), MY(160) + 2, 'buchesRue', 0, 1, 2);
  image(MX(20), MY(134), 'panierRue', 0, 1, 2);
  image(MX(68), MY(160) + 2, 'balaiRue', 0.5, 1, 2).setAngle(-7);
  image(MX(86), MY(160) + 4, 'sabotsRue', 0.5, 1, 2);
  image(MX(104), MY(160) + 2, 'bidonRue', 0.5, 1, 2);
  image(MX(122), MY(160) + 3, fleurs ? 'romarinRue' : 'romarinRueNu', 0.5, 1, 2);
  // le chat des Brindeloup, qui dort sur le tas de bûches (il respire)
  basculer(image(MX(31), MY(143) + 2, chats.dormeur + '_dort0'), [chats.dormeur + '_dort0', chats.dormeur + '_dort1'], 900, 200);
  // (l'été) les bottes de paille, rangées dans le creux entre les Brindeloup et le barbier, contre le mur, sur le sol
  // (toujours au même endroit : jamais au milieu du passage, ni devant une porte ou un tonneau)
  if (ete) { const xb = o + (P.maison1 + 136 + P.barbier - 124) / 2; texturesPailleHD(s);
    aj(s.add.ellipse(xb + 2, sol + 1, 70, 8, 0x000000, 0.22)); image(xb, sol + 2, 'bottesPailleRue', 0.5, 1, 2); }
  // la corde à linge, de la fenêtre des Brindeloup au mur du barbier : le linge se balance (rentré la nuit et sous la pluie)
  if (jour && !mouille) basculer(image(MX(117), MY(72), 'lingeRue_0', 0, 0, 2), ['lingeRue_0', 'lingeRue_1'], 700, 500);
  // les pigeons
  const pigeon = (x, y, flip, poses, delai, hasard) => basculer(image(x, y, 'pigeonRue_' + poses[0]).setFlipX(flip), poses.map(p => 'pigeonRue_' + p), delai, hasard);
  // deux pigeons sur le faîte du toit : l'un roucoule (il se gonfle), l'autre regarde la rue ; la nuit, ils dorment, gonflés
  if (jour) { pigeon(MX(58), MY(4), false, ['debout', 'gonfle', 'gonfle', 'debout'], 600, 500); pigeon(MX(80), MY(4), true, ['debout', 'debout', 'picore'], 900, 700); }
  else { image(MX(58), MY(4), 'pigeonRue_gonfle'); image(MX(68), MY(4), 'pigeonRue_gonfle').setFlipX(true); }
  // l'herbe (et les pissenlits, à la belle saison) au pied des murs et entre les pavés ; l'hiver, la neige la couvre
  if (!hiver) for (const [x, cle] of [[MX(4), 'pissenlit'], [MX(40), 'pissenlit'], [MX(56), 'touffe'], [MX(134), 'touffe'], [o + 2880, 'pissenlit'], [o + 2896, 'touffe'], [o + 3175, 'touffe'], [o + 3440, 'pissenlit'], [o + 3460, 'touffe']])
    if (!(ete && Math.abs(x - (o + (P.maison1 + 136 + P.barbier - 124) / 2)) < 40)) image(x, sol + 4, (cle === 'pissenlit' && fleurs ? 'pissenlit' : 'touffe') + 'Rue', 0.5, 1, 2);   // (l'été, rien devant les bottes)

  // ================= la fontaine, en trois couches : le bassin, l'eau (et ses poissons), la colonne =================
  const F = FONTAINE_RUE, E = 2, X0 = o + P.fontaine, bas = sol + 30, gauche = X0 - F.L, haut = bas - F.H * E;
  const X = px => gauche + px * E, Y = py => haut + py * E;
  aj(s.add.ellipse(X0, bas - 2, F.L * E, 16, 0x000000, 0.25));
  image(X0, bas, fleurs ? 'fontaineRueBas' : 'fontaineRueBasNu', 0.5, 1, E);
  const ex = X0, ey = Y(F.rebordY + 1.2), rx = (F.eauRx - 1) * E, ry = (F.eauRy - 0.8) * E;
  // les poissons rouges, sous l'eau : ils nagent d'un bout à l'autre, la queue bat
  for (let k = 0; k < 3; k++) {
    const y = ey - ry * 0.4 + k * ry * 0.45, xa = ex - rx * (0.55 - k * 0.1), xb = ex + rx * (0.5 - k * 0.08);
    const p = image(xa, y, 'poissonRue_0', 0.5, 0.5).setAlpha(0.85);
    basculer(p, ['poissonRue_0', 'poissonRue_1'], 220 - k * 30);
    const aller = vers => { if (!p.active) return; s.tweens.add({ targets: p, x: vers ? xb : xa, duration: 5200 + k * 1300, ease: 'Sine.easeInOut', onStart: () => p.setFlipX(vers), onComplete: () => aller(!vers) }); };
    p.x = xa + (xb - xa) * (0.2 + k * 0.3); aller(k % 2 === 0);
  }
  aj(s.add.ellipse(ex, ey, rx * 2, ry * 2, 0x4aa0c8, 0.45));
  const lum = aj(s.add.ellipse(ex - rx * 0.3, ey - ry * 0.3, rx, ry * 0.5, 0xd8f4ff, 0.2).setBlendMode(Phaser.BlendModes.ADD));
  s.tweens.add({ targets: lum, x: ex + rx * 0.25, duration: 3400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  for (let k = 0; k < 6; k++) { const r = aj(s.add.ellipse(ex + (hachage(k, 1, 8201) - 0.5) * rx * 1.5, ey + (hachage(k, 2, 8201) - 0.5) * ry * 1.1, 14, 2, 0xffffff, 0.5));
    s.tweens.add({ targets: r, alpha: 0.05, scaleX: 1.6, duration: 900 + k * 170, yoyo: true, repeat: -1, delay: k * 150 }); }
  const ronds = aj(s.add.container(0, 0));   // (les ronds dans l'eau, sous la colonne)
  image(X0, bas, 'fontaineRueHaut', 0.5, 1, E);
  // les nénuphars, posés sur l'eau (ils se balancent à peine) ; pas l'hiver
  if (!hiver) for (const [dx, dy, cle] of [[-62, 2, 'nenupharRueA'], [-44, 6, 'nenupharRueB'], [58, -2, 'nenupharRueA']]) {
    const n = image(ex + dx, ey + dy, cle, 0.5, 0.5, E);
    s.tweens.add({ targets: n, y: n.y + 1, duration: 1800 + Math.random() * 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    if (dx === -62 && fleurs) { const f = image(n.x + 1, n.y - 3, 'fleurNenupharRue', 0.5, 0.5, E); s.tweens.add({ targets: f, y: f.y + 1, duration: 2100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }); }
  }
  // l'eau qui tombe : les deux mufles crachent en arc, la vasque déborde par ses becs, le petit jet de la boule retombe ;
  // les gouttes font des ronds dans l'eau. (Un nombre fixe de gouttes qui reviennent sans cesse, chacune sur son trajet :
  // rien ne se crée en route, la fontaine coûte la même chose à chaque image, même quand le jeu rame.)
  const gouttes = aj(s.add.container(0, 0));
  const h = (n, k, g) => hachage(n, k, g);
  const trajets = [];
  for (const sens of [-1, 1]) {
    const mx = X(F.cx + sens * 10.4), my = Y(F.lionY + 2.2);
    for (let k = 0; k < 8; k++) trajets.push({ duree: 430, phase: k / 8 + h(k, sens, 8210) * 0.06, r: 1.7, sorte: 'mufle', sens, mx, my, k: k * 2 + (sens > 0 ? 1 : 0) });
    const bx = X(F.cx + sens * (F.vasqueRx + 1.5)), by = Y(F.vasqueY + 1.5);
    for (let k = 0; k < 3; k++) trajets.push({ duree: 330, phase: k / 3 + h(k, sens, 8211) * 0.1, r: 1.4, sorte: 'bec', sens, mx: bx, my: by, k: 40 + k * 2 + (sens > 0 ? 1 : 0) });
  }
  for (let k = 0; k < 5; k++) trajets.push({ duree: 520, phase: k / 5, r: 1.3, sorte: 'jet', mx: X(F.cx), my: Y(F.boule - 4), k: 60 + k });
  for (const tr of trajets) tr.g = aj(s.add.circle(tr.mx, tr.my, tr.r, tr.sorte === 'jet' ? 0xe8fcff : 0xd8f4ff, 0.95), gouttes);
  const lesRonds = [];
  for (let j = 0; j < 8; j++) { const sens = j % 2 ? 1 : -1, bec = j >= 6;
    lesRonds.push({ e: aj(s.add.ellipse(0, 0, 8, 2).setStrokeStyle(1, 0xe8fcff, 0.7).setVisible(false), ronds), sens, bec, duree: 600 + j * 37, phase: h(j, 1, 8213), j }); }
  const couler = () => {
    if (!vivant()) return arreter();
    const t = s.time.now;
    for (const tr of trajets) {
      const v = (t / tr.duree + tr.phase), n = Math.floor(v), u = v - n, g = tr.g;
      if (tr.sorte === 'mufle') { const portee = 38 + h(n, tr.k, 8214) * 10, yl = ey + (h(n, tr.k, 8215) - 0.3) * 6; g.setPosition(tr.mx + tr.sens * portee * u, tr.my + (yl - tr.my) * u * u); }
      else if (tr.sorte === 'bec') { g.setVisible(h(n, tr.k, 8216) < 0.7); const yl = ey - 2 + h(n, tr.k, 8217) * 4; g.setPosition(tr.mx + tr.sens * 2 * u, tr.my + (yl - tr.my) * u * u); }
      else { g.setVisible(h(n, tr.k, 8218) < 0.6); const dx = (h(n, tr.k, 8219) - 0.5) * 18, m = 1 - (2 * u - 1) ** 2; g.setPosition(tr.mx + dx * u * 0.87, tr.my - 12 * m); }
    }
    for (const r of lesRonds) {
      const v = t / r.duree + r.phase, n = Math.floor(v), u = (v - n) * r.duree / 520;
      if (u >= 1) { r.e.setVisible(false); continue; }
      const x = r.bec ? X(F.cx + r.sens * (F.vasqueRx + 1.5)) + r.sens * 2 : X(F.cx + r.sens * 10.4) + r.sens * (38 + h(n, r.j, 8220) * 10);
      const y = r.bec ? ey - 2 + h(n, r.j, 8221) * 4 : ey + (h(n, r.j, 8222) - 0.3) * 6;
      r.e.setVisible(true).setPosition(x, y).setScale(1 + 1.6 * u, 1 + 0.8 * u).setAlpha(1 - u);
    }
  };
  const arreter = () => s.events.off('update', couler);
  s.events.on('update', couler); s.events.once('shutdown', arreter);
  // --- sur la margelle et autour : le pot de géraniums, le seau, la flaque où l'eau a débordé ---
  image(X(18), Y(70), fleurs ? 'potGeraniumRue' : 'potGeraniumRueNu', 0.5, 1, E);
  image(X0 + 132, bas + 4, 'seauRue', 0.5, 1, E);
  const flaque = aj(s.add.ellipse(X0 - 108, bas + 4, 46, 8, 0x8ac0d8, 0.55));
  s.tweens.add({ targets: flaque, alpha: 0.4, duration: 1400, yoyo: true, repeat: -1 });
  if (jour) {
    // --- les pigeons : l'un boit sur la margelle, l'autre s'ébroue dans la flaque, deux picorent sur les pavés ---
    pigeon(X(97), Y(71.5), false, ['debout', 'boit', 'boit', 'debout'], 700, 600);
    pigeon(X0 - 104, bas + 5, true, ['debout', 'ailes', 'debout', 'ailes', 'debout', 'debout', 'debout'], 160, 120);
    pigeon(X0 + 168, bas + 5, false, ['debout', 'picore', 'debout', 'picore', 'picore'], 380, 400);
    pigeon(X0 + 196, bas + 3, true, ['picore', 'debout', 'debout', 'picore'], 420, 500);
    // --- le chat, assis au pied de la fontaine : il guette le pigeon de la flaque, le bout de la queue bat ---
    basculer(image(X0 - 168, bas + 5, chats.guetteur + '_assis0'), [chats.guetteur + '_assis0', chats.guetteur + '_assis1'], 520, 300);
    // --- un moineau sur le réverbère d'à côté (il a reculé pour laisser la place à la fontaine) ---
    basculer(image(o + 3480, sol + 6 - 178, 'moineauRue_pose'), ['moineauRue_pose', 'moineauRue_picore', 'moineauRue_pose'], 500, 700);
  }
  // --- les insectes (à la belle saison, le jour, au sec) : papillons, abeilles, une libellule au-dessus de l'eau ---
  if (insectes) {
    const voleter = (img, cx, cy, r, ryv, duree, frames, f = 90) => { basculer(img, frames, f, 30); let a = Math.random() * 6.28;
      const ev = s.time.addEvent({ delay: 30, loop: true, callback: () => { if (!img.active) return ev.remove(); a += 30 / duree * 6.28; img.setPosition(Math.round(cx + Math.cos(a) * r + Math.sin(a * 2.7) * r * 0.25), Math.round(cy + Math.sin(a * 1.6) * ryv)); img.setFlipX(Math.sin(a) > 0); } }); return img; };
    const bete = cle => image(0, 0, cle, 0.5, 0.5);
    voleter(bete('papillonRue_citron0'), X(18), Y(58), 16, 9, 4200, ['papillonRue_citron0', 'papillonRue_citron1'], 80);
    basculer(image(X(118), Y(64), 'papillonRue_paon0', 0.5, 0.5), ['papillonRue_paon0', 'papillonRue_paon0', 'papillonRue_paon1'], 420, 500);   // (posé sur un iris, il ouvre et ferme les ailes)
    for (let k = 0; k < 3; k++) voleter(bete('abeilleRue_0'), k < 2 ? X(116) : X(18), k < 2 ? Y(70 + k * 6) : Y(64), 7, 5, 1400 + k * 400, ['abeilleRue_0', 'abeilleRue_1'], 35);
    const lib = image(ex - 66, ey - 20, 'libelluleRue_0', 0.5, 0.5); basculer(lib, ['libelluleRue_0', 'libelluleRue_1'], 30, 10);
    const darder = () => { if (!lib.active) return; const cote = Math.random() < 0.5 ? -1 : 1, x = ex + cote * (44 + Math.random() * (rx * 0.75 - 44)), y = ey - 14 - Math.random() * 16; lib.setFlipX(x > lib.x); s.tweens.add({ targets: lib, x, y, duration: 260, ease: 'Quad.easeOut', onComplete: () => s.time.delayedCall(900 + Math.random() * 1400, darder) }); };
    s.time.delayedCall(800, darder);
    // des papillons et des abeilles autour des jardinières des Brindeloup
    voleter(bete('papillonRue_pieride0'), MX(32), MY(70), 22, 10, 5200, ['papillonRue_pieride0', 'papillonRue_pieride1'], 85);
    for (let k = 0; k < 2; k++) voleter(bete('abeilleRue_0'), MX(98 + k * 8), MY(78), 8, 4, 1300 + k * 500, ['abeilleRue_0', 'abeilleRue_1'], 35);
  }
  return c;
}
