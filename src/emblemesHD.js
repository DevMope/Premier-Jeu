// Les emblèmes du monde : un écu peint pour chaque royaume du Conseil, pour le Conseil lui-même et
// sa Confrérie, pour les Bannis et chacun de leurs peuples, et pour la Main Noire.
// Chaque écu : un champ coloré éclairé d'en haut à gauche, une bordure de métal, une figure au centre.
// (Un détail pour les attentifs : le soleil du Conseil a un œil... fermé. Et la lune des Bannis
// berce une fleur de pommier, comme la Vallée des Pommiers qu'on appelle aujourd'hui le Bourbier.)
const EMBLEMES = {
  conseil: { nom: 'Le Conseil des Gardiens', champ: 0x2a4a8a, metal: 'or' },
  confrerie: { nom: 'La Confrérie du Dernier Rempart', champ: 0x2a4a8a, metal: 'argent' },
  comte: { nom: 'La Comté des Hobbits', champ: 0x4a8a3a, metal: 'or' },
  hommes: { nom: 'Le Royaume des Hommes', champ: 0x9a2424, metal: 'argent' },
  nains: { nom: 'Le Royaume des Nains', champ: 0x3a3a44, metal: 'or' },
  elfes: { nom: 'Le Royaume des Elfes', champ: 0x1f6a62, metal: 'argent' },
  mages: { nom: 'Le Royaume des Mages', champ: 0x4a2a8a, metal: 'or' },
  bambous: { nom: 'Les Monts de Bambou', champ: 0xe8dcc0, metal: 'bronze' },
  bannis: { nom: 'Les Bannis', champ: 0x1e1628, metal: 'argentTerni' },
  gobelins: { nom: 'Les Gobelins', champ: 0x4a5a46, metal: 'bronze' },
  orcs: { nom: 'Les Orcs', champ: 0x16301a, metal: 'fer' },
  loups: { nom: 'Les Loups-garous', champ: 0x161c34, metal: 'argentTerni' },
  vampires: { nom: 'Les Vampires', champ: 0x4a1030, metal: 'or' },
  momies: { nom: 'Les Momies', champ: 0xd0b070, metal: 'or' },
  trolls: { nom: 'Les Trolls', champ: 0x3a4a3a, metal: 'fer' },
  mainNoire: { nom: 'La Main Noire', champ: 0x8a1a1a, metal: 'fer' },
};
// L'emblème de chaque royaume de la carte
const EMBLEME_ROYAUME = { comte: 'comte', humains: 'hommes', nains: 'nains', elfes: 'elfes', mages: 'mages', bambous: 'bambous', bannis: 'bannis' };

const ECU_L = 40, ECU_H = 48;

// L'écu français : haut droit, flancs droits jusqu'au milieu, puis une pointe arrondie.
// `m` : la marge (pour la bordure de métal autour du champ).
function dansEcu(x, y, m = 0) {
  const X = x + 0.5, Y = y + 0.5, haut = 1 + m, bas = ECU_H - 1 - m * 1.3, demi = ECU_L / 2 - 1 - m, y0 = 24;
  if (Y < haut || Y > bas) return false;
  let w = demi;
  if (Y > y0) { const u = (Y - y0) / (bas - y0); w = demi * Math.sqrt(Math.max(0, 1 - u * u)); }
  return Math.abs(X - ECU_L / 2) <= w;
}

function peindreEmbleme(scene, cle) {
  const e = EMBLEMES[cle];
  const t = toileDecor(ECU_L, ECU_H);
  const R = t.rampes;
  R.champ = rampe(e.champ);
  R.argent = rampe(0xc8ccd8); R.argentTerni = rampe(0x9a98aa); R.bronze = rampe(0xb07a3a); R.fer = rampe(0x6a6a74);
  R.orE = rampe(0xe0b030);
  const metal = e.metal === 'or' ? 'orE' : e.metal;
  const cx = ECU_L / 2;
  // Le champ, puis la bordure de métal (avec un liseré sombre à l'intérieur)
  t.forme('champ', (x, y) => dansEcu(x, y, 2.5) ? [(x + 0.5 - cx) / 18 * 0.5, (y + 0.5 - 22) / 22 * 0.5 - 0.15, 0.8] : null, { decalage: -0.2 });
  t.forme(metal, (x, y) => dansEcu(x, y) && !dansEcu(x, y, 2.5) ? [(x + 0.5 - cx) / 18, (y + 0.5 - 24) / 24 - 0.2, 0.6] : null, { decalage: 0.3 });
  for (let y = 0; y < ECU_H; y++) for (let x = 0; x < ECU_L; x++) if (dansEcu(x, y, 2.5) && !dansEcu(x, y, 3.5)) t.poser(x, y, 'champ', 0);

  // --- Les outils de la figure ---
  const F = (mat, dedans, opts = {}) => t.forme(mat, (x, y) => dansEcu(x, y, 3.5) ? dedans(x, y) : null, { decalage: 0.1, ...opts });
  const disque = (x0, y0, r) => ellipsoide(x0, y0, r, r);
  const poly = pts => (x, y) => {
    const X = x + 0.5, Y = y + 0.5; let dedans = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > Y) !== (yj > Y) && X < (xj - xi) * (Y - yi) / (yj - yi) + xi) dedans = !dedans;
    }
    return dedans ? [0, -0.3, 0.9] : null;
  };
  const rect = (x0, y0, w, h) => (x, y) => x + 0.5 >= x0 && x + 0.5 <= x0 + w && y + 0.5 >= y0 && y + 0.5 <= y0 + h ? [(x + 0.5 - x0 - w / 2) / w, (y + 0.5 - y0 - h / 2) / h * 0.5 - 0.2, 0.8] : null;
  const sauf = (a, b) => (x, y) => a(x, y) && !b(x, y) ? a(x, y) : null;
  const trait = (mat, x0, y0, x1, y1, ep = 1.5, ton = null) => {
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2);
    const vus = new Set();
    for (let j = 0; j <= n; j++) {
      const px = x0 + (x1 - x0) * j / n, py = y0 + (y1 - y0) * j / n;
      for (let dy = -ep; dy <= ep; dy++) for (let dx = -ep; dx <= ep; dx++) {
        if (dx * dx + dy * dy > ep * ep / 1.4) continue;
        const x = Math.round(px + dx - 0.5), y = Math.round(py + dy - 0.5), k = y * ECU_L + x;
        if (vus.has(k) || !dansEcu(x, y, 3.5)) continue;
        vus.add(k);
        t.poser(x, y, mat, ton ?? (dx + dy < 0 ? 4 : 2));
      }
    }
  };
  t.relief = true;

  switch (cle) {
    case 'conseil': { // un soleil d'or à douze rayons... et en son cœur, un œil fermé
      for (let a = 0; a < 12; a++) {
        const ang = a / 12 * Math.PI * 2 - Math.PI / 2, r1 = 7.5, r2 = a % 2 ? 10.5 : 13;
        trait('orE', cx + Math.cos(ang) * r1, 21 + Math.sin(ang) * r1, cx + Math.cos(ang) * r2, 21 + Math.sin(ang) * r2, a % 2 ? 1 : 1.4);
      }
      F('orE', disque(cx, 21, 7), { decalage: 0.5 });
      // l'œil fermé : une seule paupière en arc, les cils qui retombent en éventail
      for (let i = -4; i <= 4; i++) t.poser(Math.round(cx - 0.5 + i), Math.round(20.5 + i * i * 0.1), 'orE', 0);
      for (const i of [-3, -1.2, 1.2, 3]) { const x = Math.round(cx - 0.5 + i), y = Math.round(21.5 + i * i * 0.1); t.poser(x, y, 'orE', 1); t.poser(x + Math.sign(i), y + 1, 'orE', 1); }
      break;
    }
    case 'confrerie': { // une tour de rempart blanche, crénelée, sous un petit soleil d'or
      R.pierreB = rampe(0xe4e0d4);
      F('pierreB', (x, y) => rect(13, 19, 14, 21)(x, y) || (y + 0.5 >= 15 && y + 0.5 < 19.5 && [13, 18.5, 23.5].some(c => x + 0.5 >= c && x + 0.5 <= c + 3.5) ? [0, -0.5, 0.8] : null));
      F('champ', (x, y) => { const d = ((x + 0.5 - cx) / 2.6) ** 2 + ((y + 0.5 - 34) / 4) ** 2; return (d <= 1 && y + 0.5 >= 33) || (Math.abs(x + 0.5 - cx) <= 2.6 && y + 0.5 >= 34 && y + 0.5 <= 40) ? [0, 0, 1] : null; }, { decalage: -2.5, bord: false, ombre: false });
      for (let x = 13; x < 27; x++) if (x % 3 === 0) t.poser(x, 25, 'pierreB', 1);
      for (let x = 13; x < 27; x++) if ((x + 1) % 3 === 0) t.poser(x, 30, 'pierreB', 1);
      F('orE', disque(cx, 9, 2.6), { decalage: 0.6 });
      for (let a = 0; a < 8; a++) { const ang = a / 8 * Math.PI * 2; t.poser(Math.round(cx - 0.5 + Math.cos(ang) * 4.2), Math.round(8.5 + Math.sin(ang) * 4.2), 'orE', 4); }
      break;
    }
    case 'comte': { // une colline, une porte ronde au bouton de laiton, un pommier
      R.herbe = rampe(0x8ac85a); R.porte = rampe(0x3a7a3a); R.tronc = rampe(0x6a4424); R.pomme = rampe(0xd83a2a);
      F('herbe', ellipsoide(cx, 42, 19, 16), { decalage: 0.3 });
      F('orE', disque(cx, 32, 6.5), { decalage: 0.2 });
      F('porte', disque(cx, 32, 5.2), { decalage: 0 });
      F('orE', disque(cx, 32, 1.4), { decalage: 1, bord: false });   // (le bouton de laiton, au milieu de la porte)
      for (let x = 3; x < 37; x++) for (let y = 27; y < 44; y++) if (t.mat(x, y) === 'herbe' && hachage(x, y, 23) > 0.86) t.poser(x, y, 'herbe', 1);
      trait('tronc', 11, 22, 11, 15, 1);
      F('herbe', disque(11, 13, 4.5), { decalage: -0.4 });
      for (const [px, py] of [[9, 12], [12, 11], [13, 14], [10, 15]]) t.poser(px, py, 'pomme', 4);
      break;
    }
    case 'hommes': { // deux épées croisées sous une couronne
      R.lame = rampe(0xd8dce4); R.garde = rampe(0xc89a30); R.rubis = rampe(0xc81828);
      trait('lame', 11, 38, 29, 16, 1.4); trait('lame', 29, 38, 11, 16, 1.4);
      trait('garde', 10, 31, 16, 36, 1); trait('garde', 30, 31, 24, 36, 1);
      t.forme('garde', disque(10, 39, 1.5), { decalage: 0.5 }); t.forme('garde', disque(30, 39, 1.5), { decalage: 0.5 });
      F('orE', (x, y) => rect(12, 10.5, 16, 3.5)(x, y) || poly([[12, 11], [13.5, 5.5], [16, 11]])(x, y) || poly([[17, 11], [20, 4], [23, 11]])(x, y) || poly([[24, 11], [26.5, 5.5], [28, 11]])(x, y), { decalage: 0.4 });
      for (const px of [15, 20, 25]) t.poser(px - 1, 12, 'rubis', 4);
      break;
    }
    case 'nains': { // la montagne enneigée, et devant, un vrai marteau de paladin : tête massive à deux faces cerclées d'or, manche gainé
      R.roche = rampe(0x8a8a94); R.neige = rampe(0xf4f8ff); R.acier = rampe(0xa8b0c0); R.gaine = rampe(0x2a3a8a);
      F('roche', poly([[3, 42], [20, 14], [37, 42]]));
      F('neige', poly([[15.5, 22], [20, 14], [24.5, 22], [22, 20.5], [20, 23], [18, 20.5]]), { decalage: 0.5 });
      // le manche, gainé de bleu et cerclé d'or
      F('gaine', rect(18.4, 24, 3.2, 16), { decalage: 0 });
      for (const y of [28, 32, 36]) for (let x = 18; x < 22; x++) t.poser(x, y, 'orE', x === 18 ? 2 : 4);
      F('orE', rect(17.4, 39, 5.2, 3), { decalage: 0.4 });
      // la tête : un bloc d'acier, les deux faces de frappe évasées
      F('acier', poly([[10, 15], [30, 15], [31, 25], [9, 25]]), { decalage: 0.2 });
      F('acier', poly([[5, 13], [11, 14.5], [11, 25.5], [5, 27]]), { decalage: 0.5 });
      F('acier', poly([[35, 13], [29, 14.5], [29, 25.5], [35, 27]]), { decalage: -0.2 });
      // les cerclages d'or des deux faces, et la plaque d'or au centre
      for (const x of [10, 29]) for (let y = 14; y <= 26; y++) t.poser(x, y, 'orE', y < 20 ? 4 : 2);
      for (const x of [5, 34]) for (let y = 13; y <= 27; y++) if (dansEcu(x, y, 3.5)) t.poser(x, y, 'orE', y < 20 ? 4 : 2);
      F('orE', rect(16.5, 17, 7, 6), { decalage: 0.5 });
      t.poser(19, 19, 'gaine', 4); t.poser(20, 19, 'gaine', 5); t.poser(19, 20, 'gaine', 3); t.poser(20, 20, 'gaine', 4);
      break;
    }
    case 'elfes': { // l'Arbre-Mère d'argent, ses racines et sa grande couronne
      F('argent', poly([[17.5, 38], [22.5, 38], [21.2, 25], [18.8, 25]]));
      trait('argent', 19, 37, 13, 40, 1); trait('argent', 21, 37, 27, 40, 1);
      trait('argent', 19.5, 28, 14, 22, 0.9); trait('argent', 20.5, 28, 26, 22, 0.9);
      R.feuillage = rampe(0xa8d8c0);
      for (const [x0, y0, r] of [[cx, 15, 7], [12.5, 20, 4.5], [27.5, 20, 4.5]]) F('feuillage', disque(x0, y0, r), { decalage: -0.2, motif: (x, y) => (hachage(Math.floor(x / 2), Math.floor(y / 2), 17) - 0.5) * 2.2 });
      for (const [px, py] of [[16, 12], [23, 14], [19, 18], [13, 19], [27, 21], [21, 10]]) t.poser(px, py, 'argent', 5);
      break;
    }
    case 'mages': { // une tour de cristal sous une étoile à huit branches
      R.cristal = rampe(0xc8b8f8);
      F('cristal', poly([[16, 42], [24, 42], [23, 24], [20, 18], [17, 24]]), { decalage: 0.3 });
      for (let y = 24; y < 42; y++) t.poser(20, y, 'cristal', 5);
      for (let a = 0; a < 8; a++) { const ang = a / 8 * Math.PI * 2, r = a % 2 ? 3.5 : 6; trait('orE', cx, 11, cx + Math.cos(ang) * r, 11 + Math.sin(ang) * r, a % 2 ? 0.8 : 1.1); }
      F('orE', disque(cx, 11, 1.8), { decalage: 1, bord: false });
      for (const [px, py] of [[9, 18], [31, 22], [11, 30], [29, 33]]) t.poser(px, py, 'orE', 5);
      break;
    }
    case 'bambous': { // trois tiges de bambou et leurs feuilles
      R.bambou = rampe(0x4a9a3a);
      for (const [x0, h] of [[13, 30], [20, 34], [27, 28]]) {
        F('bambou', rect(x0 - 1.6, 42 - h, 3.2, h - 2));
        for (let y = 42 - h + 5; y < 40; y += 6) for (let dx = -2; dx <= 1; dx++) t.poser(x0 + dx, y, 'bambou', 1);
      }
      for (const [x0, y0, ang] of [[16, 16, -0.5], [24, 13, 0.5], [9, 22, -0.4], [31, 20, 0.4]]) F('bambou', (x, y) => { const dx = x + 0.5 - x0, dy = y + 0.5 - y0, u = dx * Math.cos(ang) + dy * Math.sin(ang), v = -dx * Math.sin(ang) + dy * Math.cos(ang); return (u / 4.5) ** 2 + (v / 1.3) ** 2 <= 1 ? [0, -0.4, 0.9] : null; }, { decalage: 0.5 });
      break;
    }
    case 'bannis': { // un croissant de lune qui berce une fleur de pommier
      R.fleur = rampe(0xf0a8c8); R.coeurFleur = rampe(0xf0d050);
      F('argentTerni', sauf(disque(19, 22, 11), disque(24, 18, 9)), { decalage: 0.4 });
      for (let a = 0; a < 5; a++) { const ang = a / 5 * Math.PI * 2 - Math.PI / 2; F('fleur', disque(22 + Math.cos(ang) * 2.6, 28 + Math.sin(ang) * 2.6, 2), { decalage: 0.4 }); }
      F('coeurFleur', disque(22, 28, 1.2), { decalage: 0.8, bord: false });
      for (const [px, py] of [[10, 9], [31, 12], [29, 37], [8, 33]]) t.poser(px, py, 'argentTerni', 5);
      break;
    }
    case 'gobelins': { // une dague courbe, pointe en bas : les gobelins sont doués pour l'assassinat
      R.lame = rampe(0xd8dce4); R.garde = rampe(0x5a3a1a); R.sang = rampe(0xb81818);
      // la lame, qui s'affine jusqu'à la pointe, avec son fil clair à gauche et son ombre à droite
      for (let j = 0; j <= 22; j++) {
        const u = j / 22, y = 18 + j, demi = 3.4 * (1 - u * u * 0.95) + 0.3, xc = cx + Math.sin(u * Math.PI * 0.5) * 1.2;
        for (let x = Math.round(xc - demi); x <= Math.round(xc + demi); x++) if (dansEcu(x, y, 3.5)) t.poser(x, y, 'lame', x < xc - demi * 0.5 ? 5 : x > xc + demi * 0.4 ? 2 : 4);
      }
      // la garde recourbée vers la lame, et la poignée de cuir sombre avec son pommeau
      F('garde', poly([[11, 16], [29, 16], [28, 19], [23, 18], [17, 18], [12, 19]]), { decalage: 0.1 });
      F('garde', rect(18.4, 7, 3.2, 9), { decalage: -0.3 });
      for (const y of [9, 12]) for (let x = 18; x < 22; x++) t.poser(x, y, 'garde', 1);
      F('bronze', disque(cx, 6.5, 2), { decalage: 0.4 });
      t.poser(cx + 2, 36, 'sang', 4); t.poser(cx + 2, 37, 'sang', 3);   // (une goutte au bout de la lame)
      break;
    }
    case 'orcs': { // deux défenses d'ivoire croisées
      R.ivoire = rampe(0xf0e6c8);
      for (const sens of [-1, 1]) for (let j = 0; j <= 40; j++) {
        // (chaque défense part d'un coin du bas, se bombe vers l'extérieur et pointe vers le haut)
        const u = j / 40, x = cx + sens * (8 - u * 5 + Math.sin(u * Math.PI) * 4.5), y = 40 - u * 31, ep = 2.8 - u * 2.3;
        for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) if (dx * dx + dy * dy <= ep * ep) { const px = Math.round(x + dx - 0.5), py = Math.round(y + dy - 0.5); if (dansEcu(px, py, 3.5)) t.poser(px, py, 'ivoire', dx * sens < 0 ? 4 : 2); }
      }
      break;
    }
    case 'loups': { // une tête de loup noire devant une lune rouge
      R.luneR = rampe(0xc83a28); R.ombre = rampe(0x101018); R.oeilJ = rampe(0xf0c020);
      F('luneR', disque(cx, 20, 11), { decalage: 0.2 });
      F('ombre', poly([[12, 43], [13, 33], [11.5, 21], [16, 27], [20, 25.5], [24, 27], [28.5, 21], [27, 33], [28, 43]]), { decalage: -1 });
      F('ombre', poly([[16, 36], [20, 41], [24, 36], [20, 33]]), { decalage: -0.5 });
      t.poser(16, 31, 'oeilJ', 5); t.poser(17, 31, 'oeilJ', 4); t.poser(23, 31, 'oeilJ', 4); t.poser(24, 31, 'oeilJ', 5);
      break;
    }
    case 'vampires': { // une chauve-souris aux ailes festonnées, et une goutte de sang
      R.ombre = rampe(0x141018); R.sang = rampe(0xc81818);
      const aile = s => poly([[cx + s * 2, 19], [cx + s * 15, 11], [cx + s * 13.5, 18], [cx + s * 15.5, 22], [cx + s * 11, 22], [cx + s * 10.5, 27], [cx + s * 6.5, 24.5], [cx + s * 2, 28]]);
      F('ombre', (x, y) => aile(-1)(x, y) || aile(1)(x, y) || ellipsoide(cx, 22, 3, 6)(x, y) || poly([[17.5, 17], [18, 12.5], [19.5, 16]])(x, y) || poly([[22.5, 17], [22, 12.5], [20.5, 16]])(x, y), { decalage: -0.6 });
      t.poser(19, 18, 'sang', 5); t.poser(21, 18, 'sang', 5);
      F('sang', (x, y) => disque(cx, 37, 2.6)(x, y) || poly([[cx - 2, 36], [cx, 31], [cx + 2, 36]])(x, y), { decalage: 0.5 });
      break;
    }
    case 'momies': { // un ankh de lapis-lazuli cerclé d'or
      R.lapis = rampe(0x2a4aa8);
      F('lapis', (x, y) => sauf(ellipsoide(cx, 14, 5, 6), ellipsoide(cx, 14, 2.4, 3.4))(x, y) || rect(11, 20, 18, 3.4)(x, y) || rect(18.2, 22, 3.6, 18)(x, y), { decalage: 0.2 });
      for (let y = 8; y < 40; y++) if (y % 6 === 0) t.poser(cx - 1, y, 'orE', 4);
      break;
    }
    case 'trolls': { // un vieux pont de pierre moussu au-dessus d'un torrent
      R.roche = rampe(0x8a867a); R.mousse = rampe(0x6a9a3a); R.eau = rampe(0x3a6a9a);
      F('roche', sauf(rect(4, 18, 32, 14), ellipsoide(cx, 33, 9, 9)), { decalage: 0.2 });
      for (let x = 5; x < 36; x += 4) for (let y = 19; y < 32; y += 4) t.poser(x + (y % 8 ? 2 : 0), y, 'roche', 1);
      for (let x = 5; x < 36; x++) if (hachage(x, 3, 91) > 0.35) t.poser(x, 18, 'mousse', hachage(x, 4, 91) > 0.5 ? 4 : 3);
      for (let x = 5; x < 36; x++) if (hachage(x, 5, 91) > 0.6) t.poser(x, 17, 'mousse', 4);
      for (let y = 34; y < 42; y += 3) for (let x = 6; x < 35; x++) if ((x + y) % 5 < 3) t.poser(x, y, 'eau', 4);
      break;
    }
    case 'mainNoire': { // une main noire, ouverte
      R.ombre = rampe(0x18141a);
      F('ombre', (x, y) => rect(13, 21, 13, 13)(x, y) || ellipsoide(19.5, 34, 6.5, 4)(x, y) ||
        rect(13, 11, 2.8, 11)(x, y) || rect(16.4, 8, 2.8, 14)(x, y) || rect(19.8, 8.5, 2.8, 13)(x, y) || rect(23.2, 11.5, 2.8, 10)(x, y) ||
        poly([[13, 30], [7, 23], [8.5, 21.5], [14, 25]])(x, y), { decalage: -0.4 });
      break;
    }
  }
  t.contour();
  t.texture(scene, 'embleme_' + cle);
}

function creerEmblemesHD(scene) {
  for (const cle of Object.keys(EMBLEMES)) if (!scene.textures.exists('embleme_' + cle)) peindreEmbleme(scene, cle);
}
