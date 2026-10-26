// (v1.63, planche 81 v2 validée) Le décor du comptoir du matin, peint pixel par pixel, dans chacun de ses six styles.
// Tout se peint en demi-résolution (1 pixel peint = 2 pixels à l'écran), comme le reste du comptoir.
// Les places ne changent pas d'un style à l'autre : l'étagère suspendue en haut à droite (le calendrier du jour),
// le tableau de la commande dessous, l'horloge régulateur dans le coin, le pot de plante collé au montant droit
// de la fenêtre et la tisane à côté, un bouquet (ou ce qu'il faut) au montant gauche, les clés entre l'ardoise et
// la fenêtre, la clochette au coin de la fenêtre. Le style change les matières et les objets.

// Les places, à l'écran
const DECOR_MATIN = {
  etagere: { x: 682, y: 4, l: 111, h: 22 },          // (en pixels peints)
  tableau: { x: 682, y: 48, l: 111, h: 102 },
  parchemin: { x: 692, y: 56, l: 101, h: 94 },
  horloge: { x: 906, y: 4, l: 25, h: 125 },
  cadran: { x: 931, y: 38 },                         // le centre du cadran
  pivot: { x: 931, y: 80 },                          // le haut du balancier
};

// Les matières de chaque style
function paletteComptoir(st) {
  const R = RAMPES_DECOR;
  const or = [0x5a3a08, 0x8a6010, 0xc09020, 0xe8c040, 0xf8e070, 0xfffcd0];
  const P = {
    champetre: { bois: R.chene, sombre: R.cheneSombre, metal: R.laiton, appui: R.pierre, lames: R.chene, lamesS: R.cheneSombre, mur: R.platre, fond: 'liege', lien: 'chanvre', rouge: R.cuirRouge },
    floral: { bois: rampe(0x9cc0b0), sombre: rampe(0x6a948a), metal: R.laiton, appui: rampe(0xe4d8cc), lames: rampe(0xeee0d4), lamesS: rampe(0xd2bcb0), mur: rampe(0xe2bcb4), peint: rampe(0xd8607a), feuille: rampe(0x5a9a4a), fond: 'liege', lien: 'ruban', rouge: rampe(0xc03a4a) },
    montagnard: { bois: rampe(0x6a5644), sombre: rampe(0x3a3230), metal: R.fer, appui: rampe(0x8a8a8e), lames: rampe(0x6e5a46), lamesS: rampe(0x3a2e26), mur: rampe(0x8c8a8a), fond: 'ardoise', lien: 'chaine', rouge: R.cuirRouge },
    artisan: { bois: BOIS_LUXE[2].bois, sombre: BOIS_LUXE[2].sombre, metal: R.laiton, appui: rampe(0xd6cec2), lames: BOIS_LUXE[2].bois, lamesS: BOIS_LUXE[2].sombre, mur: rampe(0x2e5a4e), mur2: rampe(0x3c6c5c), fond: 'feutre', lien: 'chaineLaiton', rouge: R.cuirRouge },
    lumiere: { bois: rampe(0xdac8a2), sombre: rampe(0xa8926a), metal: or, appui: rampe(0xeae4d8), lames: rampe(0xece8de), lamesS: rampe(0xb4b0a6), mur: rampe(0xece6da), azur: rampe(0x4a7ab8), fond: 'azur', lien: 'chaineOr', rouge: rampe(0x3a5aa8) },
    ombre: { bois: rampe(0x3a2e36), sombre: rampe(0x1a1418), metal: R.fer, appui: rampe(0x3c383e), lames: rampe(0x342a30), lamesS: rampe(0x161014), mur: rampe(0x2c2432), motif: rampe(0x8a8aa0), fond: 'velours', lien: 'chaine', rouge: rampe(0xb02424) },
  };
  return P[st] || P.champetre;
}

// Une toile aux matières du style : bois, boisS, metal, appui, lames, lamesS, mur…
function toileComptoir(l, h, st) {
  const t = toileDecor(l, h), P = paletteComptoir(st);
  for (const [k, v] of Object.entries(P)) if (Array.isArray(v)) t.rampes[k] = v;
  t.rampes.boisS = P.sombre;
  if (!P.feuille) t.rampes.feuille = rampe(0x4a8a3a);
  t.rampes.terre = rampe(0xb06a3a); t.rampes.feuilleV = rampe(0x4aa03a); t.rampes.porcelaine = rampe(0xeeeae2);
  t.rampes.etain = rampe(0x9a9ca4); t.rampes.lavande = rampe(0x8a62c8); t.rampes.rose = rampe(0xd8607a); t.rampes.blanc = rampe(0xf2eee6);
  t.rampes.ambre = rampe(0xc8781e); t.rampes.bleuF = rampe(0x3a64b0); t.rampes.pin = rampe(0x2e6a3a); t.rampes.noirR = rampe(0x5a0a16);
  t.rampes.feuilleS = rampe(0x2a4a2a); t.rampes.or = [0x5a3a08, 0x8a6010, 0xc09020, 0xe8c040, 0xf8e070, 0xfffcd0];
  t.rampes.cire = RAMPES_DECOR.cire; t.rampes.chanvre = RAMPES_OBJETS.chanvre;
  return t;
}

// Un cadre biseauté de bois (ou de métal) autour d'un rectangle de la toile
function cadreBiseau(t, x0, y0, l, h, e, mat, { clous = null } = {}) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + l; x++) {
    const d = Math.min(x - x0, y - y0, x0 + l - 1 - x, y0 + h - 1 - y);
    if (d >= e) continue;
    const lumiere = (y - y0 === d) || (x - x0 === d);
    let i = d === 0 ? 1 : lumiere ? 4 - (d > 1 ? 1 : 0) : 2;
    if (d === e - 1) i = lumiere ? 1 : 4;                       // l'arête intérieure : l'ombre en haut à gauche
    i += Math.round((fbm(x * 0.2, y * 0.2, 707) - 0.5) * 1.2);
    t.poser(x, y, mat, i);
  }
  if (clous) for (const [x, y] of clous) { t.poser(x, y, clous.mat || 'metal', 5); t.poser(x + 1, y + 1, clous.mat || 'metal', 1); }
}

// Une petite fleur peinte (cinq points) : le style floral en sème partout
function fleurPeinte(t, x, y, mat = 'peint') {
  t.poser(x, y, mat, 5); t.poser(x - 1, y, mat, 3); t.poser(x + 1, y, mat, 3); t.poser(x, y - 1, mat, 4); t.poser(x, y + 1, mat, 2);
  if (t.rampes.feuille) { t.poser(x + 2, y + 1, 'feuille', 3); t.poser(x - 2, y + 1, 'feuille', 2); }
}

// --- Le mur ---
function murComptoirStyle(scene, st) {
  if (st === 'champetre' || !STYLES_COMPTOIR[st]) return 'murComptoir';
  const cle = 'murComptoir_' + st;
  if (scene.textures.exists(cle)) return cle;
  const t = toileComptoir(480, 170, st), P = paletteComptoir(st);
  t.rampes.platre = P.mur; t.rampes.cheneSombre = P.sombre; t.rampes.pierre = P.appui;
  if (st === 'montagnard') {
    // le granit, en gros blocs assisés, et ses joints creux
    for (let y = 0; y < 170; y++) for (let x = 0; x < 480; x++) {
      const rang = Math.floor(y / 13), dec = (rang * 11) % 26, bx = (x + dec) % 26, by = y % 13, bloc = Math.floor((x + dec) / 26) + rang * 40;
      const joint = bx === 0 || by === 0;
      let i = 3 + Math.round((fbm(x * 0.18, y * 0.18, 610 + bloc) - 0.5) * 1.6) + (hachage(x, y, 611) < 0.08 ? 1 : hachage(x, y, 612) < 0.06 ? -1 : 0);
      if (by === 1 || bx === 1) i++; if (by === 12 || bx === 25) i--;
      t.poser(x, y, 'mur', joint ? 0 : i);
    }
  } else enduit(t, 0, 0, 480, 170, 91);
  if (st === 'artisan') for (let y = 0; y < 170; y++) for (let x = 0; x < 480; x++) {
    // le papier rayé : deux verts, un filet clair
    const u = x % 12, mat = u < 6 ? 'mur' : 'mur2';
    let i = 3 + Math.round((fbm(x * 0.05, y * 0.05, 620) - 0.5) * 0.8);
    if (u === 6) i = 4; if (u === 0) i = 2;
    t.poser(x, y, mat, i);
  }
  if (st === 'ombre') for (let y = 0; y < 170; y++) for (let x = 0; x < 480; x++) {
    const a = (x + y) % 16, b = (x - y + 1600) % 16;
    if (a === 0 || b === 0) t.poser(x, y, 'motif', a === 0 && b === 0 ? 4 : 1);
  }
  if (st !== 'montagnard') { pierres(t, 0, 152, 72, 18, 92); pierres(t, 400, 148, 80, 22, 93); }
  // les poteaux et la sablière
  planche(t, 0, 0, 480, 8, 'cheneSombre', { graine: 94, noeuds: st === 'lumiere' || st === 'floral' ? 0 : 4 });
  for (const x of [140, 334]) { planche(t, x, 8, 8, 162, 'cheneSombre', { horizontale: false, graine: 95 + x, noeuds: 2 }); for (const y of [14, 160]) clou(t, x + 3, y); }
  planche(t, 0, 162, 480, 8, 'cheneSombre', { graine: 97, noeuds: 4 });
  if (st === 'floral') for (let x = 6; x < 480; x += 12) { for (let k = 0; k < 12; k++) t.poser(x - 6 + k, 13, 'boisS', 4); fleurPeinte(t, x, 11); }
  if (st === 'artisan') for (let x = 0; x < 480; x++) { t.poser(x, 8, 'metal', 4); t.poser(x, 9, 'metal', 2); t.poser(x, 161, 'metal', 4); }
  if (st === 'lumiere') for (let x = 0; x < 480; x++) {
    for (let y = 8; y < 14; y++) t.poser(x, y, 'azur', y === 8 ? 4 : y === 13 ? 1 : 3);
    if (x % 14 === 7) { t.poser(x, 10, 'metal', 5); t.poser(x - 1, 11, 'metal', 4); t.poser(x + 1, 11, 'metal', 4); t.poser(x, 11, 'metal', 5); t.poser(x, 12, 'metal', 3); }
  }
  if (st === 'montagnard' || st === 'ombre') for (let x = 20; x < 480; x += 40) { for (let y = 0; y < 8; y++) { t.poser(x, y, 'metal', 3); t.poser(x + 1, y, 'metal', 2); t.poser(x + 2, y, 'metal', 1); } clou(t, x, 3); }
  t.texture(scene, cle);
  return cle;
}

// --- Le cadre de la fenêtre (le même dessin que le cadre d'origine, dans les matières du style) ---
function cadreFenetreStyle(scene, st) {
  if (st === 'champetre' || !STYLES_COMPTOIR[st]) return 'cadreFenetre';
  const cle = 'cadreFenetre_' + st;
  if (scene.textures.exists(cle)) return cle;
  const L = 196, H = 128, ox = 8, oy = 8, w = 180, h = 115;
  const t = toileComptoir(L, H, st), P = paletteComptoir(st);
  t.rampes.chene = P.bois; t.rampes.cheneSombre = P.sombre; t.rampes.pierre = P.appui;
  for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) {
    if (x >= ox && x < ox + w && y >= oy && y < oy + h) continue;
    const d = Math.min(Math.abs(x - ox + 0.5), Math.abs(x - (ox + w) + 0.5), Math.abs(y - oy + 0.5), Math.abs(y - (oy + h) + 0.5));
    if (d < 4.5) t.poser(x, y, 'chene', (x < ox || y < oy) ? 4 - Math.floor(d / 2) : 1 + Math.floor(d / 2));
    else if (st === 'montagnard') { const bloc = Math.floor(x / 9) + Math.floor(y / 7) * 30; t.poser(x, y, 'pierre', (x % 9 === 0 || y % 7 === 0) ? 0 : 2 + Math.round(fbm(x * 0.3, y * 0.3, 630 + bloc) * 2)); }
    else t.poser(x, y, 'cheneSombre', 2 + Math.round(fbm(x * 0.1, y * 0.4, 51) * 2));
  }
  // le filet de métal (laiton, or) le long de l'ouverture
  if (st === 'artisan' || st === 'lumiere') for (let y = oy - 3; y < oy + h + 3; y++) for (let x = ox - 3; x < ox + w + 3; x++) {
    const d = Math.min(Math.abs(x - ox + 0.5), Math.abs(x - (ox + w) + 0.5), Math.abs(y - oy + 0.5), Math.abs(y - (oy + h) + 0.5));
    if (Math.abs(d - 3) < 0.5 && !(x >= ox && x < ox + w && y >= oy && y < oy + h)) t.poser(x, y, 'metal', (x < ox || y < oy) ? 4 : 2);
  }
  pierres(t, 0, H - 5, L, 5, 52);
  for (let x = 0; x < L; x++) t.poser(x, H - 5, 'pierre', 5);
  for (const [x, y] of [[2, 2], [L - 4, 2], [2, H - 13], [L - 4, H - 13]]) { t.poser(x, y, 'metal', 5); t.poser(x + 1, y, 'metal', 3); t.poser(x, y + 1, 'metal', 2); t.poser(x + 1, y + 1, 'metal', 1); }
  if (st === 'montagnard' || st === 'ombre') for (let k = 10; k < L - 10; k += 14) { t.poser(k, 3, 'metal', 5); t.poser(k + 1, 4, 'metal', 1); }
  if (st === 'floral') for (const [x, y] of [[3, 3], [L - 4, 3], [3, H - 12], [L - 4, H - 12], [L / 2, 2], [3, H / 2], [L - 4, H / 2]]) fleurPeinte(t, Math.round(x), Math.round(y));
  t.texture(scene, cle);
  return cle;
}

// --- L'ardoise de gauche, dans un cadre du style ---
function ardoiseStyle(scene, st) {
  if (st === 'champetre' || !STYLES_COMPTOIR[st]) return 'ardoiseComptoir';
  const cle = 'ardoiseComptoir_' + st;
  if (scene.textures.exists(cle)) return cle;
  const t = toileComptoir(125, 115, st);
  for (let y = 0; y < 115; y++) for (let x = 0; x < 125; x++) t.poser(x, y, 'ardoise', 2 + Math.round((fbm(x * 0.15, y * 0.15, 21) - 0.5) * 1.6) + (hachage(x, y, 22) < 0.04 ? 1 : 0));
  for (let k = 0; k < 6; k++) { const yy = 20 + hachage(k, 1, 23) * 80, xx = 10 + hachage(k, 2, 23) * 70; for (let s = 0; s < 30; s++) if (hachage(k, s, 24) < 0.6) t.poser(xx + s, yy + Math.sin(s / 4) * 2, 'ardoise', 4); }
  const metal = st === 'montagnard' || st === 'ombre';
  cadreBiseau(t, 0, 0, 125, 115, 5, metal ? 'boisS' : 'bois');
  if (metal) for (let x = 6; x < 120; x += 10) { for (const y of [2, 112]) { t.poser(x, y, 'metal', 5); t.poser(x + 1, y, 'metal', 1); } }
  if (metal) for (let y = 8; y < 110; y += 10) { for (const x of [2, 122]) { t.poser(x, y, 'metal', 5); t.poser(x, y + 1, 'metal', 1); } }
  if (st === 'artisan' || st === 'lumiere') for (const [cx, cy, sx, sy] of [[0, 0, 1, 1], [124, 0, -1, 1], [0, 114, 1, -1], [124, 114, -1, -1]])
    for (let j = 0; j < 7; j++) for (let k = 0; j + k < 7; k++) t.poser(cx + sx * k, cy + sy * j, 'metal', j + k === 6 ? 1 : (j === 0 || k === 0) ? 4 : 3);
  if (st === 'floral') for (let x = 6; x < 122; x += 9) { fleurPeinte(t, x, 2); fleurPeinte(t, x + 4, 112); }
  if (st === 'ombre') for (const [x, y] of [[2, 2], [122, 2], [2, 112], [122, 112]]) { t.poser(x, y, 'rouge', 5); t.poser(x + (x > 60 ? -1 : 1), y, 'rouge', 3); }
  t.contour();
  t.texture(scene, cle);
  return cle;
}

// --- Le store à lames : 20 lames, et cinq fentes où passe le jour (et l'ombre de la file) ---
const FENTES_STORE = [11, 35, 59, 83, 107];   // (les lignes peintes des fentes, du haut du store)
function storeStyle(scene, st) {
  const cle = 'storeLames_' + st;
  if (scene.textures.exists(cle)) return cle;
  const L = 180, H = 121, t = toileComptoir(L, H, st), P = paletteComptoir(st);
  for (let yy = 0; yy < H; yy += 6) {
    planche(t, 0, yy, L, 5, 'lames', { graine: 980 + yy, noeuds: st === 'floral' || st === 'lumiere' ? 0 : 1 });
    for (let x = 0; x < L; x++) { t.poser(x, yy + 5, 'lamesS', FENTES_STORE.includes(yy + 5) ? 0 : 1); t.poser(x, yy, 'lames', 4); }
  }
  // le store peint : une guirlande de petites fleurs sur une lame sur quatre, deux filets verts
  if (st === 'floral') for (let yy = 18; yy < H - 8; yy += 24) { for (let x = 0; x < L; x++) { t.poser(x, yy, 'boisS', 4); t.poser(x, yy + 4, 'boisS', 3); } for (let x = 6; x < L; x += 10) fleurPeinte(t, x, yy + 2); }
  if (st === 'lumiere') for (let yy = 0; yy < H - 6; yy += 6) for (let x = 0; x < L; x++) if ((yy / 6) % 4 === 2) t.poser(x, yy + 2, 'azur', 3);
  if (st === 'montagnard') for (const bx of [24, L - 27]) for (let y = 0; y < H - 4; y++) { t.poser(bx, y, 'metal', 4); t.poser(bx + 1, y, 'metal', 3); t.poser(bx + 2, y, 'metal', 1); if (y % 12 === 3) { t.poser(bx + 1, y, 'metal', 5); t.poser(bx + 1, y + 1, 'metal', 0); } }
  const barre = st === 'artisan' || st === 'lumiere' ? 'metal' : 'fer';
  for (let x = 0; x < L; x++) for (let k = 0; k < 4; k++) t.poser(x, H - 4 + k, barre, k === 0 ? 4 : k === 3 ? 1 : 3);   // la barre du bas
  for (const x of [L / 2 - 30, L / 2 + 30]) for (let k = 0; k < 3; k++) { t.poser(x, H - 7 + k, barre, 4); t.poser(x + 1, H - 7 + k, barre, 2); }   // les deux poignées
  t.texture(scene, cle);
  return cle;
}

// L'écriteau pendu à sa chaîne : FERMÉ (rouge) d'un côté, OUVERT (vert) de l'autre
function ecriteauStyle(scene, st, ouvert) {
  const cle = 'ecriteau_' + st + (ouvert ? '_ouvert' : '');
  if (scene.textures.exists(cle)) return cle;
  const t = toileComptoir(48, 18, st);
  t.rampes.peinture = ouvert ? rampe(0x3a7a2a) : st === 'lumiere' ? rampe(0x2a4a9a) : rampe(0xa82018);
  cadreBiseau(t, 0, 0, 48, 18, 2, st === 'montagnard' || st === 'ombre' ? 'boisS' : 'bois');
  for (let y = 2; y < 16; y++) for (let x = 2; x < 46; x++) t.poser(x, y, 'peinture', 3 + Math.round((fbm(x * 0.2, y * 0.3, ouvert ? 641 : 640) - 0.5) * 1.4) - (y === 2 || x === 2 ? 1 : 0));
  for (const x of [5, 42]) { t.poser(x, 1, 'metal', 5); t.poser(x, 2, 'metal', 2); }   // les pitons de la chaîne
  if (st === 'floral') { fleurPeinte(t, 6, 9); fleurPeinte(t, 41, 9); }
  t.contour();
  t.texture(scene, cle);
  return cle;
}

// Le cadenas de la barre du bas : fermé, puis l'anse qui saute
function cadenasHD(scene) {
  if (scene.textures.exists('cadenas_0')) return;
  for (const ouvert of [0, 1]) {
    const t = toileDecor(9, 12);
    const anse = ouvert ? -2 : 0;
    for (let y = 0; y < 5; y++) for (const x of [1, 6]) { if (ouvert && x === 6 && y > 2) continue; t.poser(x + (ouvert && x === 1 ? 0 : 0), y + anse + 2, 'fer', x === 1 ? 4 : 2); }
    for (let x = 2; x < 6; x++) t.poser(x, anse + 1 + 1, 'fer', 4);
    t.forme('laiton', (x, y) => (x >= 0 && x <= 7 && y >= 5 && y <= 11 ? [(x - 3.5) / 5, (y - 8) / 5, 0.8] : null));
    t.poser(4, 8, 'encre', 0); t.poser(4, 9, 'encre', 0);
    t.contour();
    t.texture(scene, 'cadenas_' + ouvert);
  }
}

// --- L'étagère suspendue : le calendrier, puis les objets du style ---
function etagereMatinStyle(scene, st) {
  const cle = 'etagereMatin_' + st;
  if (scene.textures.exists(cle)) return { cle, flammes: FLAMMES_ETAGERE[st] || [] };
  const { l: L, h: H } = DECOR_MATIN.etagere, t = toileComptoir(L, H, st), P = paletteComptoir(st);
  // les deux liens qui la pendent à la poutre
  for (const x of [7, L - 8]) for (let y = 0; y < 18; y++) {
    if (P.lien === 'chanvre' || P.lien === 'ruban') t.poser(x, y, P.lien === 'ruban' ? 'peint' : 'chanvre', y % 2 ? 2 : 4);
    else t.poser(x, y, P.lien === 'chaine' ? 'fer' : 'metal', y % 3 === 0 ? 1 : y % 3 === 1 ? 4 : 3);
  }
  // la planche, épaisse, éclairée sur le dessus
  for (let x = 0; x < L; x++) for (let y = 18; y < 22; y++) t.poser(x, y, st === 'montagnard' ? 'boisS' : 'bois', y === 18 ? 5 : y === 21 ? 1 : 3 - (hachage(x, y, 650) < 0.2 ? 1 : 0));
  if (st === 'montagnard' || st === 'ombre') for (let x = 3; x < L; x += 12) { t.poser(x, 19, 'metal', 5); t.poser(x + 1, 20, 'metal', 1); }
  if (st === 'artisan' || st === 'lumiere') for (let x = 0; x < L; x++) t.poser(x, 21, 'metal', 3);
  if (st === 'floral') for (let x = 6; x < L; x += 10) fleurPeinte(t, x, 20);
  // le calendrier du jour (le chiffre s'écrit par-dessus)
  for (let y = 4; y < 18; y++) for (let x = 3; x < 16; x++) t.poser(x, y, y < 8 ? 'rouge' : 'parchemin', y < 8 ? (y === 4 ? 4 : 3) : x === 3 || y === 17 ? 3 : 5 - (hachage(x, y, 651) < 0.1 ? 1 : 0));
  for (const x of [6, 12]) { t.poser(x, 3, 'fer', 4); t.poser(x, 4, 'fer', 2); }
  OBJETS_ETAGERE[st](t);
  t.contour();
  t.texture(scene, cle);
  return { cle, flammes: FLAMMES_ETAGERE[st] || [] };
}
// les flammes des bougies de l'étagère (en pixels peints, depuis le coin de l'étagère) : elles vacillent à part
const FLAMMES_ETAGERE = { lumiere: [[21, 3], [27, 5]], ombre: [[21, 6], [26, 3], [31, 8]] };

// Un bocal de verre : son contenu, son couvercle de tissu noué
function bocal(t, x0, mat, couvercle = 'lin') {
  for (let y = 8; y < 18; y++) for (let x = x0; x < x0 + 8; x++) {
    const bord = x === x0 || x === x0 + 7 || y === 17;
    t.poser(x, y, bord ? 'verre' : y < 10 ? 'verre' : mat, bord ? 3 : y < 10 ? 4 : 3 + (x === x0 + 1 ? 1 : 0) - (x === x0 + 6 ? 1 : 0));
  }
  t.poser(x0 + 1, 11, 'verre', 5); t.poser(x0 + 1, 12, 'verre', 5);
  for (let x = x0 - 1; x < x0 + 9; x++) { t.poser(x, 6, couvercle, 4); t.poser(x, 7, couvercle, 2); }
  t.poser(x0 + 4, 5, 'chanvre', 3);
}
// Un livre couché (sa tranche de pages, son dos de couleur)
function livreCouche(t, x0, x1, y0, ep, mat) {
  for (let y = y0; y < y0 + ep; y++) for (let x = x0; x < x1; x++) t.poser(x, y, (x === x0 || x === x1 - 1 || y === y0) ? mat : (x > x0 + 1 ? 'parchemin' : mat), y === y0 ? 4 : (x === x0 || x === x1 - 1) ? 2 : 4 - (y % 2));
  for (let x = x0; x < x1; x++) t.poser(x, y0 + ep - 1, mat, 1);
}
function livreDebout(t, x, l, h, mat) { for (let y = 18 - h; y < 18; y++) for (let k = 0; k < l; k++) t.poser(x + k, y, mat, k === 0 ? 4 : k === l - 1 ? 1 : 3 - ((y - 18 + h) === 2 || (y - 18 + h) === h - 3 ? 2 : 0)); }
// Une bougie (corps, coulures) ; la flamme est à part
function bougiePeinte(t, x, haut, mat = 'cire', l = 3) { for (let y = haut; y < 18; y++) for (let k = 0; k < l; k++) t.poser(x + k, y, mat, k === 0 ? 4 : k === l - 1 ? 2 : 3); t.poser(x + 1, haut - 1, 'encre', 1); t.poser(x, haut + 2, mat, 5); }

const OBJETS_ETAGERE = {
  champetre(t) {
    t.rampes.miel = rampe(0xe09a20);
    bocal(t, 20, 'verreVert'); bocal(t, 30, 'verreRouge', 'tissuRouge'); bocal(t, 40, 'miel');
    // le sablier : deux plateaux de bois, le sable qui coule
    for (let x = 51; x < 59; x++) { t.poser(x, 4, 'bois', 4); t.poser(x, 17, 'bois', 2); }
    for (const x of [51, 58]) for (let y = 5; y < 17; y++) t.poser(x, y, 'bois', 3);
    for (let y = 5; y < 17; y++) { const w = Math.abs(y - 10.5) < 1.5 ? 1 : Math.min(3, Math.round(Math.abs(y - 10.5) * 0.6)); for (let x = 55 - w; x < 55 + w; x++) t.poser(x, y, y > 12 ? 'chanvre' : 'verre', y > 12 ? (y > 14 ? 4 : 3) : 4); }
    t.poser(54, 10, 'chanvre', 4); t.poser(54, 11, 'chanvre', 4);
    livreCouche(t, 62, 86, 14, 4, 'encre'); livreCouche(t, 64, 82, 11, 3, 'cuirRouge');
    livreCouche(t, 88, 104, 15, 3, 'chanvre');
  },
  floral(t) {
    // un vase de porcelaine et ses roses, une tasse fleurie, trois petits pots de lavande
    for (let y = 10; y < 18; y++) { const w = y < 12 ? 2 : 3 + (y > 13 && y < 16 ? 1 : 0); for (let x = 25 - w; x < 25 + w; x++) t.poser(x, y, 'porcelaine', x === 25 - w ? 5 : x === 24 + w ? 2 : 4); }
    t.poser(24, 14, 'peint', 4); t.poser(26, 14, 'bleuF', 4); t.poser(25, 15, 'peint', 3);
    for (const [x, y] of [[22, 6], [25, 4], [28, 6], [24, 8], [27, 8]]) { t.forme('rose', ellipsoide(x, y, 1.8, 1.6)); }
    for (const [x, y] of [[21, 9], [29, 9]]) t.poser(x, y, 'feuille', 3);
    // la tasse et sa soucoupe
    for (let y = 12; y < 17; y++) for (let x = 36; x < 43; x++) t.poser(x, y, 'porcelaine', x === 36 ? 5 : x === 42 ? 2 : 4);
    t.poser(43, 13, 'porcelaine', 3); t.poser(44, 14, 'porcelaine', 2); t.poser(43, 15, 'porcelaine', 3);
    for (let x = 34; x < 46; x++) t.poser(x, 17, 'porcelaine', 3);
    fleurPeinte(t, 39, 14);
    // un soliflore, une seule tulipe
    for (let y = 11; y < 18; y++) { t.poser(50, y, 'verre', 4); t.poser(51, y, 'verre', 3); }
    for (let y = 5; y < 11; y++) t.poser(50, y, 'feuille', 3);
    t.forme('rose', ellipsoide(50.5, 4, 1.6, 2.2), { decalage: 0.3 });
    livreCouche(t, 56, 72, 14, 4, 'rose'); livreCouche(t, 58, 70, 11, 3, 'boisS');
    for (const x of [76, 86, 96]) {
      for (let y = 13; y < 18; y++) for (let k = 0; k < 6; k++) t.poser(x + k, y, 'terre', k === 0 ? 4 : k === 5 ? 1 : 3);
      for (let k = 0; k < 6; k++) t.poser(x + k, 13, 'terre', 5);
      for (const [dx, h] of [[1, 5], [3, 7], [4, 4]]) for (let y = 13 - h; y < 13; y++) t.poser(x + dx, y, y < 13 - h + 3 ? 'lavande' : 'feuille', y < 13 - h + 3 ? 3 + (y % 2) : 2);
    }
  },
  montagnard(t) {
    t.rampes.amethyste = rampe(0x8a52c8); t.rampes.lingot = rampe(0xd8a634);
    // la géode : une coque de pierre grise, des cristaux violets
    t.forme('pierre', ellipsoide(25, 13, 6.5, 5.5, (x, y) => y >= 8));
    t.forme('amethyste', ellipsoide(25, 13.5, 4.6, 3.8, (x, y) => y >= 9), { motif: (x, y) => ((x * 3 + y * 5) % 4 === 0 ? 1.2 : 0) });
    for (const [x, y] of [[23, 11], [26, 12], [25, 14]]) t.poser(x, y, 'amethyste', 5);
    // l'enclume, sur son billot
    for (let y = 14; y < 18; y++) for (let x = 36; x < 44; x++) t.poser(x, y, 'boisS', x === 36 ? 4 : x === 43 ? 1 : 3);
    for (let x = 33; x < 48; x++) { t.poser(x, 10, 'fer', 4); t.poser(x, 11, 'fer', 3); if (x > 34 && x < 46) t.poser(x, 12, 'fer', 2); }
    for (let x = 30; x < 33; x++) t.poser(x, 10 + (x === 30 ? 1 : 0), 'fer', 3);
    for (let x = 37; x < 43; x++) t.poser(x, 13, 'fer', 1);
    // les lingots, en pyramide
    const lingot = (x0, y0, mat) => { for (let x = x0; x < x0 + 8; x++) { t.poser(x, y0, mat, 5); t.poser(x, y0 + 1, mat, 3); t.poser(x, y0 + 2, mat, 2); } t.poser(x0, y0 + 2, mat, 1); };
    lingot(52, 15, 'lingot'); lingot(61, 15, 'fer'); lingot(56, 12, 'lingot');
    // la corne à boire, cerclée de fer
    traitHD(t, 'cire', [[74, 16], [80, 15], [88, 12], [95, 8], [99, 5]], 1.5, 0.1);
    for (let y = 13; y < 18; y++) t.poser(73, y, 'cire', 3);
    for (const x of [77, 90]) for (let y = 11; y < 18; y++) if (t.mat(x, y) === 'cire') t.poser(x, y, 'fer', 3);
    t.poser(99, 5, 'boisS', 1);
  },
  artisan(t) {
    // trois fioles bouchées, rouge, verte et bleue
    for (const [x, mat, h] of [[20, 'verreRouge', 9], [26, 'verreVert', 12], [32, 'bleuF', 8]]) {
      t.forme('verre', ellipsoide(x + 2, 15, 2.8, 2.8));
      for (let y = 18 - h; y < 14; y++) { t.poser(x + 1, y, 'verre', 4); t.poser(x + 2, y, 'verre', 3); }
      t.forme(mat, ellipsoide(x + 2, 15.5, 2, 1.8), { decalage: 0.2 });
      t.poser(x + 1, 17 - h, 'chene', 4); t.poser(x + 2, 17 - h, 'chene', 3);
    }
    // l'astrolabe : un anneau de laiton, sa règle, son pied
    for (let a = 0; a < 64; a++) { const x = 46 + Math.cos(a / 64 * 6.283) * 5, y = 9 + Math.sin(a / 64 * 6.283) * 5; t.poser(Math.round(x), Math.round(y), 'metal', y < 9 ? 4 : 2); }
    traitHD(t, 'metal', [[42, 13], [50, 5]], 0.6, 0.4);
    t.poser(46, 9, 'metal', 5);
    for (let y = 14; y < 18; y++) t.poser(46, y, 'metal', 3);
    for (let x = 43; x < 50; x++) t.poser(x, 17, 'metal', 2);
    // la balance de laiton
    for (let y = 5; y < 18; y++) t.poser(64, y, 'metal', 3);
    for (let x = 57; x < 72; x++) t.poser(x, 6, 'metal', 4);
    for (const cx of [58, 70]) { for (let y = 7; y < 12; y++) t.poser(cx, y, 'metal', 2); for (let x = cx - 3; x <= cx + 3; x++) t.poser(x, 12, 'metal', x === cx - 3 ? 4 : 3); for (let x = cx - 2; x <= cx + 2; x++) t.poser(x, 13, 'metal', 2); }
    for (let x = 61; x < 68; x++) t.poser(x, 17, 'metal', 2);
    t.poser(64, 4, 'metal', 5);
    // des livres debout, reliés de cuir
    livreDebout(t, 80, 4, 12, 'cuirRouge'); livreDebout(t, 84, 4, 13, 'boisS'); livreDebout(t, 88, 3, 11, 'encre'); livreDebout(t, 91, 4, 12, 'feuilleS');
    for (const x of [81, 85, 92]) { t.poser(x, 9, 'metal', 4); t.poser(x + 1, 9, 'metal', 4); }
    livreCouche(t, 97, 107, 15, 3, 'cuirRouge');
  },
  lumiere(t) {
    t.rampes.vitrailR = rampe(0xc83a3a); t.rampes.vitrailB = rampe(0x3a6ac8); t.rampes.vitrailJ = rampe(0xe8c040);
    // deux cierges dans leurs bougeoirs d'or
    bougiePeinte(t, 20, 6, 'cire', 3); bougiePeinte(t, 26, 8, 'cire', 3);
    for (let x = 18; x < 31; x++) t.poser(x, 17, 'metal', x === 18 ? 4 : 3);
    // le petit vitrail rond sur son pied
    for (let y = 2; y < 15; y++) for (let x = 34; x < 47; x++) {
      const d = Math.hypot(x + 0.5 - 40.5, y + 0.5 - 8.5); if (d > 6.3) continue;
      if (d > 5.3) { t.poser(x, y, 'metal', y < 8 ? 4 : 2); continue; }
      const a = Math.atan2(y + 0.5 - 8.5, x + 0.5 - 40.5), s = Math.floor((a + Math.PI) / (Math.PI / 3)) % 3;
      t.poser(x, y, d < 1.5 ? 'vitrailJ' : ['vitrailR', 'vitrailB', 'vitrailJ'][s], (Math.round(d) % 2 ? 3 : 4));
    }
    for (let y = 15; y < 18; y++) t.poser(40, y, 'metal', 3); for (let x = 37; x < 45; x++) t.poser(x, 17, 'metal', 2);
    // le livre saint, couverture blanche, fermoir d'or
    for (let y = 6; y < 18; y++) for (let x = 51; x < 61; x++) t.poser(x, y, 'blanc', x === 51 ? 5 : x === 60 ? 2 : 4 - (y === 17 ? 2 : 0));
    for (let y = 6; y < 18; y++) t.poser(61, y, 'parchemin', 3);
    for (const [x, y] of [[55, 9], [56, 9], [55, 10], [56, 10], [54, 11], [57, 11]]) t.poser(x, y, 'metal', 4);
    for (let y = 11; y < 14; y++) t.poser(61, y, 'metal', 5);
    // la fiole d'eau claire
    t.forme('verre', ellipsoide(67, 15, 2.6, 2.6)); for (let y = 9; y < 13; y++) t.poser(67, y, 'verre', 4); t.forme('bleuF', ellipsoide(67, 15.5, 1.8, 1.6), { decalage: 0.4 }); t.poser(67, 8, 'metal', 4);
    // le soleil d'or, sur son socle
    for (let k = 0; k < 16; k++) { const a = k / 16 * 6.283; for (let r = 4; r < (k % 2 ? 6 : 7.5); r++) t.poser(Math.round(84 + Math.cos(a) * r), Math.round(8 + Math.sin(a) * r), 'metal', k % 2 ? 3 : 4); }
    t.forme('metal', ellipsoide(84, 8, 3.6, 3.6), { decalage: 0.4 });
    for (let y = 15; y < 18; y++) for (let x = 81; x < 88; x++) t.poser(x, y, 'appui', y === 15 ? 5 : 3);
    livreCouche(t, 92, 106, 15, 3, 'azur');
  },
  ombre(t) {
    t.rampes.cireNoire = rampe(0x2a2630); t.rampes.vertPoison = rampe(0x4ac85a);
    // trois chandelles noires, coulures de cire
    bougiePeinte(t, 20, 9, 'cireNoire', 3); bougiePeinte(t, 25, 6, 'cireNoire', 3); bougiePeinte(t, 30, 11, 'cireNoire', 3);
    for (let x = 18; x < 35; x++) t.poser(x, 17, 'metal', 2);
    // le corbeau de fer, l'œil rouge
    t.forme('boisS', ellipsoide(44, 12, 5, 3.6), { decalage: 0.4 });
    t.forme('boisS', ellipsoide(48, 8, 2.6, 2.4), { decalage: 0.6 });
    for (const [x, y] of [[51, 8], [52, 8], [53, 9]]) t.poser(x, y, 'metal', 3);
    t.poser(49, 7, 'rouge', 5);
    traitHD(t, 'boisS', [[40, 13], [36, 15], [35, 16]], 0.9, 0.3);
    for (const x of [43, 46]) { t.poser(x, 16, 'metal', 2); t.poser(x, 17, 'metal', 2); }
    // la fiole verte qui luit
    t.forme('verre', ellipsoide(60, 14.5, 3, 3)); for (let y = 8; y < 12; y++) t.poser(60, y, 'verre', 4); t.forme('vertPoison', ellipsoide(60, 15, 2.2, 2), { decalage: 0.6 }); t.poser(60, 7, 'boisS', 3);
    // la dague, couchée
    for (let x = 66; x < 80; x++) { t.poser(x, 15, 'fer', 5); t.poser(x, 16, 'fer', x > 77 ? 3 : 2); }
    t.poser(80, 16, 'fer', 4);
    for (let x = 61; x < 65; x++) { t.poser(x, 15, 'boisS', 3); t.poser(x, 16, 'boisS', 2); }
    for (let y = 13; y < 18; y++) t.poser(65, y, 'metal', 4);
    t.poser(61, 15, 'rouge', 5);
    // la plaque de la Main Noire : une main rouge sur le fer noir
    for (let y = 4; y < 18; y++) for (let x = 86; x < 104; x++) t.poser(x, y, 'boisS', x === 86 || y === 4 ? 4 : x === 103 || y === 17 ? 0 : 2);
    t.dessin(90, 5, ['...o.o....', '..oo.o.o..', '..oo.oo.o.', '..oooooo.o', 'o.oooooooo', '.ooooooooo', '..ooooooo.', '...ooooo..', '...ooooo..', '....ooo...', '....ooo...'], { o: ['rouge', 4] });
    for (const [x, y] of [[93, 6], [95, 6], [97, 7], [91, 9]]) t.poser(x, y, 'rouge', 5);
  },
};

// --- Le tableau de la commande : liège, feutre, ardoise, velours ou azur, dans son cadre ---
function tableauStyle(scene, st) {
  const cle = 'tableauCommande_' + st;
  if (scene.textures.exists(cle)) return cle;
  const { l: L, h: H } = DECOR_MATIN.tableau, t = toileComptoir(L, H, st), P = paletteComptoir(st);
  t.rampes.liege = rampe(0xa87a4a); t.rampes.feutre = rampe(0x2e5a46); t.rampes.velours = rampe(0x3a1e30); t.rampes.feutreAzur = rampe(0x3a5a9a);
  for (let y = 4; y < H - 4; y++) for (let x = 4; x < L - 4; x++) {
    if (P.fond === 'liege') {
      const h1 = hachage(x, y, 660), v = fbm(x * 0.25, y * 0.25, 661);
      t.poser(x, y, 'liege', 3 + (h1 < 0.18 ? -2 : h1 < 0.34 ? -1 : h1 > 0.9 ? 1 : h1 > 0.97 ? 2 : 0) + Math.round((v - 0.5) * 1.6));
    } else if (P.fond === 'feutre' || P.fond === 'azur') {
      const m = P.fond === 'feutre' ? 'feutre' : 'feutreAzur';
      t.poser(x, y, m, 3 + Math.round((fbm(x * 0.12, y * 0.12, 662) - 0.5) * 1.2) + ((x + y) % 23 === 0 ? 1 : 0) - (hachage(x, y, 663) < 0.06 ? 1 : 0));
    } else if (P.fond === 'velours') {
      t.poser(x, y, 'velours', 2 + Math.round((fbm(x * 0.3, y * 0.015, 664) - 0.5) * 1.4 + Math.sin(x * 0.11) * 0.45) + (hachage(x, y, 665) < 0.1 ? 1 : 0));
    } else t.poser(x, y, 'ardoise', 2 + Math.round((fbm(x * 0.15, y * 0.15, 666) - 0.5) * 1.6) + (hachage(x, y, 667) < 0.04 ? 1 : 0));
    if (y < 7 || x < 7) t.poser(x, y, t.mat(x, y), t.teinte(x, y) - 1);   // l'ombre du cadre
  }
  const cadre = st === 'artisan' || st === 'lumiere' ? 'metal' : st === 'montagnard' || st === 'ombre' ? 'boisS' : 'bois';
  cadreBiseau(t, 0, 0, L, H, 4, cadre);
  if (st === 'artisan' || st === 'lumiere') for (let x = 4; x < L - 4; x++) { t.poser(x, 4, 'bois', 1); t.poser(x, H - 5, 'bois', 1); }
  if (st === 'montagnard' || st === 'ombre') { for (let x = 5; x < L - 4; x += 9) for (const y of [1, H - 2]) { t.poser(x, y, 'metal', 5); t.poser(x + 1, y, 'metal', 1); } for (let y = 6; y < H - 4; y += 9) for (const x of [1, L - 2]) { t.poser(x, y, 'metal', 5); t.poser(x, y + 1, 'metal', 1); } }
  if (st === 'floral') { for (let x = 5; x < L - 3; x += 8) { fleurPeinte(t, x, 1); fleurPeinte(t, x + 4, H - 2); } }
  if (st === 'lumiere') for (const [x, y] of [[12, 12], [L - 13, 12], [12, H - 13], [L - 13, H - 13]]) { t.poser(x, y, 'metal', 5); t.poser(x - 1, y, 'metal', 3); t.poser(x + 1, y, 'metal', 3); t.poser(x, y - 1, 'metal', 3); t.poser(x, y + 1, 'metal', 3); }
  // de vieilles punaises, des trous d'épingle, un coin de papier oublié
  if (P.fond === 'liege') {
    for (const [x, y] of [[16, 16], [22, 21], [92, 84], [80, 30], [30, 76]]) t.poser(x, y, 'liege', 0);
    for (const [x, y] of [[18, 14], [91, 78]]) { t.poser(x, y, 'verreRouge', 4); t.poser(x + 1, y, 'verreRouge', 3); t.poser(x, y + 1, 'verreRouge', 2); }
  }
  t.texture(scene, cle);
  return cle;
}

// Le parchemin de la commande, aux bords déchirés, épinglé sur le tableau
function parcheminTableauHD(scene) {
  const cle = 'parcheminTableau';
  if (scene.textures.exists(cle)) return cle;
  const { l: L, h: H } = DECOR_MATIN.parchemin, t = toileDecor(L, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) {
    const bord = Math.min(x, y, L - 1 - x, H - 1 - y), dechire = fbm(x * 0.3, y * 0.3, 671) * 2.6;
    if (bord < dechire - 0.6) continue;
    let i = 4 + Math.round((fbm(x * 0.07, y * 0.07, 672) - 0.55) * 2.2);
    if (bord < dechire + 1.6) i -= 2;
    if (x < 5 || x > L - 6) i -= 1;
    if (fbm(x * 0.04, y * 0.05, 673) > 0.72) i--;
    t.poser(x, y, 'parchemin', i);
  }
  for (const x of [3, L - 5]) t.forme('verreRouge', ellipsoide(x + 1, 3, 2.1, 2.1), { decalage: 0.3 });
  t.texture(scene, cle);
  return cle;
}

// La carte « Ce matin, dehors », épinglée au milieu du tableau
function carteDehorsHD(scene) {
  const cle = 'carteDehors';
  if (scene.textures.exists(cle)) return cle;
  const L = 66, H = 32, t = toileDecor(L, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) {
    const bord = Math.min(x, y, L - 1 - x, H - 1 - y);
    t.poser(x, y, 'parchemin', bord === 0 ? 3 : 5 - (fbm(x * 0.1, y * 0.1, 675) > 0.68 ? 1 : 0) - (y > H - 3 ? 1 : 0));
  }
  t.forme('verreRouge', ellipsoide(33, 2.5, 1.8, 1.8), { decalage: 0.3 });
  t.texture(scene, cle);
  return cle;
}

// --- L'horloge régulateur : la caisse, le cadran ; le balancier et les aiguilles bougent à part ---
function horlogeStyle(scene, st) {
  const cle = 'horlogeMatin_' + st;
  if (scene.textures.exists(cle)) return cle;
  const { l: L, h: H } = DECOR_MATIN.horloge, t = toileComptoir(L, H, st), P = paletteComptoir(st);
  const bois = st === 'montagnard' || st === 'ombre' ? 'boisS' : 'bois';
  t.rampes.ivoire = st === 'montagnard' ? rampe(0xb8bcc0) : rampe(0xf2ead6);
  // le fronton et son épi
  for (let y = 2; y < 7; y++) for (let x = 2 + (6 - y); x < L - 2 - (6 - y); x++) t.poser(x, y, bois, y === 2 ? 5 : x < L / 2 ? 4 : 2);
  t.poser(12, 0, 'metal', 4); t.poser(12, 1, 'metal', 3); t.poser(11, 1, 'metal', 2); t.poser(13, 1, 'metal', 2);
  // la tête, carrée, qui porte le cadran
  cadreBiseau(t, 1, 7, L - 2, 24, 3, bois);
  for (let y = 10; y < 28; y++) for (let x = 4; x < L - 4; x++) t.poser(x, y, bois, 2);
  const cx = 12.5, cy = 17.5;
  for (let y = 7; y < 29; y++) for (let x = 2; x < L - 2; x++) {
    const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
    if (d < 8.6) t.poser(x, y, 'ivoire', 4 + (d < 6 ? 1 : 0) - ((x + 0.5 < cx && y + 0.5 > cy && d > 7) ? 1 : 0));
    else if (d < 9.8) t.poser(x, y, 'metal', y < cy ? 4 : 2);
  }
  for (let k = 0; k < 12; k++) { const a = k / 12 * 6.283; t.poser(Math.round(cx - 0.5 + Math.cos(a) * 7.2), Math.round(cy - 0.5 + Math.sin(a) * 7.2), 'encre', k % 3 ? 2 : 0); }
  // le cou mouluré, puis la caisse et sa vitre
  for (let x = 2; x < L - 2; x++) { t.poser(x, 31, 'metal', 3); t.poser(x, 32, bois, 4); t.poser(x, 33, bois, 1); }
  cadreBiseau(t, 1, 34, L - 2, 79, 3, bois);
  t.rampes.caisse = rampe(st === 'ombre' ? 0x1a1218 : st === 'artisan' ? 0x2a1610 : 0x2a2018);
  for (let y = 37; y < 110; y++) for (let x = 4; x < L - 4; x++) t.poser(x, y, 'caisse', 1 + (hachage(x, y, 680) < 0.08 ? 1 : 0) - (x === 4 || y === 37 ? 1 : 0));   // le fond de la caisse, dans l'ombre
  if (st === 'artisan' || st === 'lumiere') for (let y = 35; y < 112; y++) { t.poser(3, y, 'metal', 4); t.poser(L - 4, y, 'metal', 2); }
  // le socle, plus large
  cadreBiseau(t, 0, 113, L, 10, 2, bois);
  for (let y = 115; y < 121; y++) for (let x = 2; x < L - 2; x++) t.poser(x, y, bois, 3);
  for (const x of [1, L - 4]) for (let y = 123; y < 125; y++) for (let k = 0; k < 3; k++) t.poser(x + k, y, bois, 1);
  if (st === 'floral') { fleurPeinte(t, 5, 4); fleurPeinte(t, L - 6, 4); fleurPeinte(t, 12, 117); for (const y of [44, 72, 100]) { fleurPeinte(t, 2, y); fleurPeinte(t, L - 3, y); } }
  if (st === 'montagnard' || st === 'ombre') for (const [x, y] of [[2, 8], [L - 3, 8], [2, 29], [L - 3, 29], [2, 36], [L - 3, 36], [2, 110], [L - 3, 110]]) { t.poser(x, y, 'metal', 5); t.poser(x, y + 1, 'metal', 1); }
  if (st === 'ombre') { t.poser(12, 116, 'rouge', 5); t.poser(11, 117, 'rouge', 3); t.poser(13, 117, 'rouge', 3); t.poser(12, 118, 'rouge', 2); }
  t.texture(scene, cle);
  // le balancier : une tige, la lentille
  const cb = 'balancier_' + st;
  if (!scene.textures.exists(cb)) {
    const b = toileComptoir(9, 64, st);
    const lentille = st === 'artisan' ? 'verre' : st === 'ombre' ? 'rouge' : st === 'montagnard' ? 'fer' : 'metal';
    for (let y = 0; y < 55; y++) { b.poser(4, y, 'metal', 4); b.poser(5, y, 'metal', 2); }
    b.forme(lentille, ellipsoide(4.5, 58.5, 4, 4), { decalage: 0.3 });
    b.contour(); b.texture(scene, cb);
  }
  // le reflet de la vitre, posé par-dessus le balancier
  if (!scene.textures.exists('vitreHorloge')) {
    const v = toileDecor(17, 73);
    for (let y = 0; y < 73; y++) for (let x = 0; x < 17; x++) { const d = (x + y * 0.45) % 22; if (d < 1.2 || (d > 4 && d < 4.8)) v.poser(x, y, 'verre', 5); }
    v.texture(scene, 'vitreHorloge');
  }
  return cle;
}

// --- Le pot de plante, collé au montant droit : chaque style a le sien ---

// Une feuille ovale, orientée (angle en radians, 0 = vers la droite), avec sa nervure
function feuilleOrientee(t, mat, cx, cy, l, w, a, { nervure = true, decalage = 0 } = {}) {
  const c = Math.cos(a), s = Math.sin(a);
  t.forme(mat, (x, y) => {
    const dx = x + 0.5 - cx, dy = y + 0.5 - cy, u = (dx * c + dy * s) / l, v = (-dx * s + dy * c) / (w * (1 - Math.abs(u) * 0.35));
    const d = u * u + v * v;
    return d <= 1 ? [dx / (l + 1), dy / (w + 1), Math.sqrt(1 - d) * 0.9 + 0.1] : null;
  }, { decalage });
  if (nervure) for (let k = -l * 0.7; k <= l * 0.7; k += 0.5) { const x = Math.round(cx + c * k - 0.5), y = Math.round(cy + s * k - 0.5); if (t.mat(x, y) === mat) t.poser(x, y, mat, t.teinte(x, y) - 1); }
}

// Un pot (évasé vers le haut), son rebord, et la terre
function potPeint(t, mat, { haut = 17, bas = 28, l0 = 15, l1 = 11, cx = 11, terre = true } = {}) {
  for (let y = haut; y < bas; y++) {
    const w = (l0 + (l1 - l0) * (y - haut) / (bas - haut)) / 2;
    for (let x = Math.round(cx - w); x < Math.round(cx + w); x++) t.poser(x, y, mat, x < cx - w + 2 ? 4 : x > cx + w - 3 ? 1 : 3 - (y === bas - 1 ? 1 : 0) + (y === haut + 2 ? -1 : 0));
  }
  for (let x = Math.round(cx - l0 / 2) - 1; x < Math.round(cx + l0 / 2) + 1; x++) { t.poser(x, haut - 1, mat, 5); t.poser(x, haut, mat, 4); t.poser(x, haut + 1, mat, 2); }
  if (terre) for (let x = Math.round(cx - l0 / 2) + 1; x < Math.round(cx + l0 / 2) - 1; x++) t.poser(x, haut - 2, 'boisS', 1);
}

function planteStyle(scene, st) {
  const cle = 'planteMatin_' + st;
  if (scene.textures.exists(cle)) return cle;
  const L = 22, H = 28, t = toileComptoir(L, H, st);
  t.relief = true;   // (chaque feuille porte son ombre sur celles de dessous : on les distingue)
  if (st === 'champetre') {
    // le basilic : des feuilles luisantes en dôme, dans un pot de terre cuite
    t.rampes.basilic = rampe(0x48a83a);
    for (const [x, y, a, l] of [[5, 13, 2.6, 4], [17, 13, 0.5, 4], [8, 12, 2.0, 3.6], [14, 12, 1.1, 3.6], [11, 11, 1.57, 3.4], [4, 8, 2.8, 3.4], [18, 8, 0.3, 3.4],
      [8, 7, 2.3, 3.4], [14, 7, 0.8, 3.4], [11, 5, 1.6, 3.2], [7, 3, 2.4, 2.8], [15, 3, 0.7, 2.8], [11, 1.8, 1.57, 2.4]]) feuilleOrientee(t, 'basilic', x, y, l, 2.1, a + Math.PI);
    for (const [x, y] of [[11, 15], [11, 16]]) t.poser(x, y, 'feuilleS', 2);
    potPeint(t, 'terre');
  } else if (st === 'floral') {
    // les géraniums : des feuilles rondes, trois ombelles rouges, un pot de faïence peint
    t.rampes.geranium = rampe(0xd8303a); t.rampes.feuilleG = rampe(0x4a8a3a);
    for (const [x, y, r] of [[5, 14, 3.2], [17, 14, 3.2], [9, 12, 3], [14, 12, 3], [11, 14, 2.8], [3, 11, 2.4], [19, 11, 2.4]]) {
      t.forme('feuilleG', ellipsoide(x, y, r, r * 0.8), { motif: (a, b) => (Math.hypot(a + 0.5 - x, b + 0.5 - y) > r * 0.55 && Math.hypot(a + 0.5 - x, b + 0.5 - y) < r * 0.75 ? -0.7 : 0) });
    }
    for (const [x0, y0, x1, y1] of [[6, 7, 8, 12], [16, 6, 14, 12], [11, 3, 11, 11]]) traitHD(t, 'feuilleG', [[x0, y0], [x1, y1]], 0.5, -0.3);
    for (const [x, y] of [[6, 5.5], [16, 4.5], [11, 2.5]]) {
      for (const [dx, dy] of [[0, 0], [-1.8, 0.6], [1.8, 0.6], [-0.9, -1.4], [0.9, -1.4], [-0.9, 1.6], [0.9, 1.6]]) t.forme('geranium', ellipsoide(x + dx, y + dy, 1.25, 1.2), { decalage: 0.25, bord: false });
      t.poser(Math.round(x - 1), Math.round(y - 1), 'geranium', 5); t.poser(Math.round(x + 1), Math.round(y), 'geranium', 2);
    }
    potPeint(t, 'porcelaine', { l0: 16, l1: 12 });
    for (let x = 5; x < 18; x += 3) { t.poser(x, 21, 'peint', 4); t.poser(x + 1, 21, 'peint', 3); t.poser(x + 1, 23, 'bleuF', 3); }
    for (let x = 5; x < 18; x++) { t.poser(x, 19, 'bleuF', 3); t.poser(x, 25, 'bleuF', 2); }
  } else if (st === 'montagnard') {
    // un petit pin et des edelweiss, dans un seau de bois cerclé de fer
    for (let k = 0; k < 5; k++) { const y0 = 1 + k * 3, w = 1 + k * 1.1; for (let y = y0; y < y0 + 4; y++) for (let x = Math.round(15 - w * (y - y0 + 1) / 4); x <= Math.round(15 + w * (y - y0 + 1) / 4); x++) t.poser(x, y, 'pin', x < 15 ? 4 - (y === y0 + 3 ? 1 : 0) : 2 - (y === y0 + 3 ? 1 : 0)); }
    for (let y = 16; y < 18; y++) t.poser(15, y, 'boisS', 2);
    for (const [x, y] of [[5, 7], [8, 11], [4, 13], [10, 15]]) {
      for (const [dx, dy] of [[0, -1.6], [1.5, -0.5], [0.95, 1.3], [-0.95, 1.3], [-1.5, -0.5]]) t.forme('blanc', ellipsoide(x + dx, y + dy, 1.05, 1.05), { bord: false, decalage: 0.2 });
      t.poser(x, y, 'or', 4);
      for (let yy = y + 2; yy < 17; yy++) t.poser(x, yy, 'feuilleS', 3);
    }
    for (let y = 17; y < 28; y++) for (let x = 3; x < 19; x++) t.poser(x, y, 'boisS', 3 + ((x - 3) % 3 === 0 ? -1 : 0) + (x < 5 ? 1 : 0) - (x > 16 ? 1 : 0) - (y === 27 ? 1 : 0));
    for (let x = 2; x < 20; x++) t.poser(x, 17, 'boisS', 5);
    for (const y of [19, 25]) for (let x = 3; x < 19; x++) t.poser(x, y, 'fer', x < 6 ? 5 : x > 15 ? 1 : 3);
    for (const x of [5, 16]) t.poser(x, 19, 'fer', 5);
  } else if (st === 'artisan') {
    // la fougère, sous sa cloche de verre, sur un socle de laiton
    for (let x = 2; x < 20; x++) { t.poser(x, 25, 'metal', 5); t.poser(x, 26, 'metal', 3); t.poser(x, 27, 'metal', 1); }
    for (let x = 7; x < 15; x++) for (let y = 21; y < 25; y++) t.poser(x, y, 'terre', x < 9 ? 4 : 2);
    t.rampes.fougere = rampe(0x3a9a3a);
    for (const [a, l] of [[-2.5, 10], [-2.1, 12], [-1.57, 13], [-1.05, 12], [-0.65, 10], [-2.9, 8], [-0.25, 8]]) {
      for (let s = 1; s <= l; s++) {
        const x = 11 + Math.cos(a) * s, y = 21 + Math.sin(a) * s + 0.018 * s * s, px = Math.round(x - 0.5), py = Math.round(y - 0.5);
        t.poser(px, py, 'fougere', 2);
        if (s > 1 && s < l) { const n = -Math.sin(a), m = Math.cos(a); t.poser(Math.round(px + n * 1.2), Math.round(py + m * 1.2), 'fougere', 4); t.poser(Math.round(px - n * 1.2), Math.round(py - m * 1.2), 'fougere', 3); }
      }
    }
    for (let y = 1; y < 25; y++) for (let x = 2; x < 20; x++) {
      const dx = (x + 0.5 - 11) / 8.6, dy = y < 9 ? (y + 0.5 - 9) / 8 : 0, d = Math.hypot(dx, dy);
      if (Math.abs(d - 0.95) < 0.065 || (y >= 9 && (x === 2 || x === 19))) t.poser(x, y, 'verre', x < 11 ? 5 : 3);
    }
    for (let y = 4; y < 21; y++) if (y % 7 < 5) t.poser(5, y, 'verre', 5);
    t.poser(11, 0, 'metal', 5); t.poser(10, 1, 'metal', 3); t.poser(12, 1, 'metal', 2);
  } else if (st === 'lumiere') {
    // des lys blancs, dans un pot de faïence bleue et blanche
    t.rampes.lys = rampe(0xf4f0e4);
    for (const [x0, y0] of [[7, 6], [14, 4], [17, 9]]) traitHD(t, 'feuille', [[x0, y0 + 2], [11, 17]], 0.5, -0.2);
    for (const [x, y, a] of [[6, 14, 2.7], [16, 13, 0.4], [9, 12, 2.2], [13, 11, 0.9]]) feuilleOrientee(t, 'feuille', x, y, 3.6, 1.1, a);
    for (const [x, y] of [[7, 5], [14, 3], [17, 8]]) {
      t.forme('lys', (a, b) => (b >= y - 3 && b <= y + 2 && Math.abs(a + 0.5 - x) <= (b - y + 3) * 0.55 + 0.5 ? [(a + 0.5 - x) / 3, -0.4, 0.8] : null), { decalage: 0.5 });
      for (const dx of [-1, 1]) t.poser(x + dx, y - 4, 'lys', 4);
      t.poser(x, y - 1, 'or', 4); t.poser(x, y - 2, 'or', 5);
    }
    potPeint(t, 'porcelaine', { l0: 15, l1: 11 });
    for (let x = 4; x < 18; x++) { t.poser(x, 19, 'bleuF', 4); t.poser(x, 25, 'bleuF', 3); }
    for (let x = 5; x < 17; x += 3) { t.poser(x, 22, 'bleuF', 4); t.poser(x + 1, 21, 'bleuF', 3); t.poser(x + 1, 23, 'bleuF', 3); }
  } else {
    // les roses noires, dans un pot de fer
    t.rampes.roseN = rampe(0x6a0e1c);
    for (const [x0, y0] of [[6, 6], [15, 4], [11, 9]]) traitHD(t, 'feuilleS', [[x0, y0], [11, 17]], 0.5, -0.3);
    for (const [x, y, a] of [[5, 13, 2.8], [17, 12, 0.3], [8, 10, 2.3], [14, 9, 0.8]]) feuilleOrientee(t, 'feuilleS', x, y, 3, 1.6, a);
    for (const [x, y] of [[6, 5], [15, 3.5], [11, 8.5]]) {
      t.forme('roseN', ellipsoide(x, y, 2.6, 2.4), { motif: (a, b) => (Math.abs(Math.hypot(a + 0.5 - x, b + 0.5 - y) - 1.4) < 0.5 ? -1 : 0), decalage: 0.2 });
      t.poser(Math.round(x) - 1, Math.round(y) - 1, 'roseN', 5);
    }
    for (let y = 17; y < 28; y++) for (let x = 4; x < 18; x++) t.poser(x, y, 'fer', x < 6 ? 4 : x > 15 ? 1 : 2 + (y === 18 ? 2 : 0) - (y === 27 ? 1 : 0));
    for (let x = 3; x < 19; x++) { t.poser(x, 17, 'fer', 5); t.poser(x, 16, 'fer', 3); }
    for (const x of [6, 15]) t.poser(x, 22, 'fer', 5);
  }
  t.contour();
  t.texture(scene, cle);
  return cle;
}

// La tisane (ou ce qu'on boit dans ce style), à côté du pot
function tisaneStyle(scene, st) {
  const cle = 'tisaneMatin_' + st;
  if (scene.textures.exists(cle)) return cle;
  const L = 18, H = 15, t = toileComptoir(L, H, st);
  const anse = (mat, x, y0, y1) => { for (let y = y0; y <= y1; y++) t.poser(x + (y === y0 || y === y1 ? 0 : 2), y, mat, 2); for (const y of [y0, y1]) t.poser(x + 1, y, mat, 3); };
  if (st === 'champetre') {
    // un gros bol de terre vernissée, la tisane dorée, une soucoupe
    for (let y = 4; y < 13; y++) for (let x = 3; x < 13; x++) t.poser(x, y, 'terre', x === 3 ? 5 : x === 4 ? 4 : x === 12 ? 1 : 3 - (y > 10 ? 1 : 0));
    for (let x = 3; x < 13; x++) { t.poser(x, 4, 'terre', 5); t.poser(x, 5, 'ambre', x < 6 ? 4 : 3); }
    for (let x = 4; x < 12; x++) t.poser(x, 8, 'terre', 2);
    anse('terre', 13, 6, 10);
    for (let x = 1; x < 16; x++) { t.poser(x, 13, 'porcelaine', 4); t.poser(x, 14, 'porcelaine', 2); }
  } else if (st === 'floral') {
    // la théière fleurie, son bec, son couvercle
    t.forme('porcelaine', ellipsoide(8, 9.5, 5.5, 4.8));
    t.forme('porcelaine', ellipsoide(8, 4.5, 2.6, 1.4), { decalage: 0.3 }); t.poser(8, 2, 'peint', 4); t.poser(8, 3, 'porcelaine', 3);
    traitHD(t, 'porcelaine', [[12.5, 9], [15, 6.5], [16.5, 4.5]], 0.9, 0);
    for (const [x, y] of [[3, 7], [1.5, 8], [1.5, 10], [3, 11.5]]) t.poser(Math.round(x), Math.round(y), 'porcelaine', 2);
    fleurPeinte(t, 6, 10); fleurPeinte(t, 10, 8); t.poser(8, 12, 'rose', 4);
    for (let x = 4; x < 13; x++) t.poser(x, 14, 'porcelaine', 2);
  } else if (st === 'montagnard') {
    // la chope d'étain, couvercle à charnière et poucier
    for (let y = 4; y < 14; y++) for (let x = 3; x < 12; x++) t.poser(x, y, 'etain', x === 3 ? 5 : x === 4 ? 4 : x === 11 ? 1 : 3);
    for (let x = 2; x < 13; x++) { t.poser(x, 3, 'etain', 5); t.poser(x, 14, 'etain', 2); }
    for (const y of [6, 11]) for (let x = 3; x < 12; x++) t.poser(x, y, 'etain', 2);
    anse('etain', 12, 5, 11);
    t.poser(12, 2, 'etain', 4); t.poser(13, 1, 'etain', 5);
  } else if (st === 'artisan') {
    // le thé dans un verre, sa monture de laiton ciselée
    for (let y = 1; y < 13; y++) for (let x = 4; x < 12; x++) t.poser(x, y, y < 3 ? 'verre' : 'ambre', y < 3 ? 5 : 3 + (x === 5 ? 2 : 0) - (x === 11 ? 1 : 0));
    for (let y = 6; y < 14; y++) for (let x = 3; x < 13; x++) if (y > 11 || y === 6 || (x + y) % 3 === 0 || x === 3 || x === 12) t.poser(x, y, 'metal', x === 3 ? 5 : y > 11 ? 2 : 3);
    anse('metal', 13, 6, 11);
    for (let x = 2; x < 15; x++) t.poser(x, 14, 'metal', 1);
  } else if (st === 'lumiere') {
    // le bol de faïence bleue et blanche
    for (let y = 6; y < 13; y++) { const w = 6.5 - Math.max(0, y - 9) * 0.9; for (let x = Math.round(9 - w); x < Math.round(9 + w); x++) t.poser(x, y, (x + y) % 4 === 0 && y > 7 ? 'bleuF' : 'porcelaine', x === Math.round(9 - w) ? 5 : x === Math.round(9 + w) - 1 ? 2 : 3); }
    for (let x = 2; x < 16; x++) { t.poser(x, 6, 'bleuF', 4); t.poser(x, 5, 'porcelaine', 5); }
    for (let x = 4; x < 14; x++) t.poser(x, 7, 'ambre', 3);
    for (let x = 6; x < 12; x++) t.poser(x, 13, 'porcelaine', 2);
  } else {
    // la coupe noire au filet rouge, sur son pied
    for (let y = 3; y < 9; y++) { const w = 5.5 - (y - 3) * 0.7; for (let x = Math.round(9 - w); x < Math.round(9 + w); x++) t.poser(x, y, 'boisS', x === Math.round(9 - w) ? 5 : 2); }
    for (let x = 3; x < 15; x++) { t.poser(x, 3, 'rouge', 4); t.poser(x, 2, 'boisS', 4); }
    for (let y = 9; y < 13; y++) t.poser(9, y, 'boisS', 4);
    for (let x = 5; x < 14; x++) { t.poser(x, 13, 'boisS', 3); t.poser(x, 14, 'boisS', 1); }
  }
  t.contour();
  t.texture(scene, cle);
  return cle;
}

// Ce qui pend au montant gauche de la fenêtre
function montantStyle(scene, st) {
  const cle = 'montantMatin_' + st;
  if (scene.textures.exists(cle)) return cle;
  const L = 12, H = 36, t = toileComptoir(L, H, st);
  t.poser(6, 0, 'fer', 5); t.poser(6, 1, 'fer', 2);   // le clou
  for (let y = 1; y < 5; y++) { t.poser(6 - (y > 2 ? 1 : 0), y, st === 'artisan' || st === 'lumiere' ? 'metal' : 'chanvre', 3); t.poser(6 + (y > 2 ? 1 : 0), y, st === 'artisan' || st === 'lumiere' ? 'metal' : 'chanvre', 2); }
  if (st === 'champetre' || st === 'floral') {
    // un bouquet qui sèche, tête en bas : les tiges liées en haut, les fleurs en bas
    const tige = st === 'floral' ? 'feuille' : 'feuilleV';
    // des tiges fines, une par une, qui s'écartent sous le lien
    for (let k = 0; k < 7; k++) { const xa = 4.6 + k * 0.4, xb = 1 + k * 1.6; for (let y = 5; y < 20; y++) { const u = Math.max(0, (y - 8) / 12), xx = Math.round(xa + (xb - xa) * u); t.poser(xx, y, tige, 2 + ((k + y) % 3 === 0 ? 1 : 0) + (k < 3 ? 1 : 0)); } }
    for (let x = 3; x < 10; x++) { t.poser(x, 6, st === 'floral' ? 'peint' : 'chanvre', 4); t.poser(x, 7, st === 'floral' ? 'peint' : 'chanvre', 2); }
    if (st === 'champetre') for (let k = 0; k < 7; k++) { const x = Math.round(1 + k * 1.6 + 0.2); for (let y = 18; y < 31 - (k % 3) * 2; y++) { t.poser(x, y, 'lavande', 2 + ((y + k) % 2) * 2); if (y % 2 === 0) t.poser(x + (k < 3 ? -1 : 1), y, 'lavande', 3); } }
    else {
      t.rampes.roseS = rampe(0xb8404e);
      for (const [x, y] of [[2.5, 21], [6, 23], [9.5, 21], [4, 27], [8, 27]]) { t.forme('roseS', ellipsoide(x, y, 2, 2), { decalage: -0.2, motif: (a, b) => (Math.abs(Math.hypot(a + 0.5 - x, b + 0.5 - y) - 1) < 0.45 ? -1 : 0) }); }
      for (const [x, y] of [[1, 18], [11, 19], [5, 25]]) t.poser(x, y, 'feuille', 2);
    }
  } else if (st === 'montagnard') {
    // la corne à boire, au bout d'une courroie de cuir
    for (let y = 4; y < 11; y++) { t.poser(Math.round(4 + (y - 4) * -0.3), y, 'cuirRouge', 3); t.poser(Math.round(8 + (y - 4) * 0.2), y, 'cuirRouge', 2); }
    traitHD(t, 'cire', [[3, 11], [3.5, 17], [5.5, 24], [9, 30], [10.5, 33]], 1.8, 0.1);
    for (let x = 1; x < 7; x++) { t.poser(x, 12, 'fer', 4); t.poser(x, 13, 'fer', 2); }
    for (const [x, y] of [[5, 24], [8, 29]]) if (t.mat(x, y) === 'cire') t.poser(x, y, 'cire', 2);
    t.poser(10, 33, 'boisS', 1); t.poser(11, 34, 'boisS', 1);
  } else if (st === 'artisan') {
    // la petite lanterne de laiton (sa lueur vacille à part)
    t.rampes.lueur = rampe(0xf0b848);
    for (let y = 5; y < 9; y++) for (let x = 4 - (y - 5) * 0.5; x < 8 + (y - 5) * 0.5; x++) t.poser(Math.round(x), y, 'metal', y === 5 ? 5 : 3);
    for (let y = 9; y < 23; y++) for (let x = 2; x < 10; x++) t.poser(x, y, x === 2 || x === 9 || x === 6 ? 'metal' : 'lueur', x === 2 ? 5 : x === 9 ? 1 : x === 6 ? 3 : 3 + (y > 12 && y < 19 ? 2 : 0));
    for (let x = 1; x < 11; x++) { t.poser(x, 9, 'metal', 4); t.poser(x, 23, 'metal', 2); t.poser(x, 24, 'metal', 1); }
    t.forme('flamme', ellipsoide(5, 16, 1, 1.8), { bord: false, decalage: 0.8 });
  } else if (st === 'lumiere') {
    // un rameau de laurier noué d'un ruban d'or
    traitHD(t, 'boisS', [[6, 5], [6, 32]], 0.55, 0);
    for (let k = 0; k < 8; k++) { const y = 8 + k * 3; feuilleOrientee(t, 'feuille', k % 2 ? 8.6 : 3.4, y + 1, 2.8, 1.1, k % 2 ? 0.6 : Math.PI - 0.6, { decalage: 0.1 }); }
    for (let x = 3; x < 10; x++) t.poser(x, 6, 'metal', 4);
    for (const [x, y] of [[3, 7], [2, 8], [9, 7], [10, 9]]) t.poser(x, y, 'metal', 3);
  } else {
    // la dague dans son fourreau, pendue par sa lanière
    for (let y = 4; y < 8; y++) t.poser(6, y, 'cuirRouge', 2);
    for (let y = 8; y < 13; y++) { t.poser(5, y, 'boisS', 4); t.poser(6, y, 'boisS', 2); t.poser(7, y, 'boisS', 1); }
    t.forme('rouge', ellipsoide(6, 8, 1.2, 1.2), { decalage: 0.5 });
    for (let x = 2; x < 11; x++) { t.poser(x, 13, 'metal', 4); t.poser(x, 14, 'metal', 2); }
    for (let y = 15; y < 32; y++) for (let x = 4; x < 9; x++) t.poser(x, y, 'boisS', x === 4 ? 4 : x === 8 ? 0 : 2 + (y % 6 === 0 ? 2 : 0));
    for (let x = 4; x < 9; x++) { t.poser(x, 21, 'metal', 3); t.poser(x, 32, 'metal', 3); }
    t.poser(6, 33, 'metal', 4);
  }
  t.contour();
  t.texture(scene, cle);
  return cle;
}

// Les clés de la maison, à leur clou entre l'ardoise et la fenêtre : un anneau, deux clés à panneton
function clesHD(scene, st) {
  const dore = st === 'artisan' || st === 'lumiere', cle = 'clesMatin_' + (dore ? 'or' : 'fer');
  if (scene.textures.exists(cle)) return cle;
  const t = toileComptoir(10, 22, st), m = dore ? 'metal' : 'fer';
  t.poser(5, 0, 'fer', 5); t.poser(5, 1, 'fer', 2);
  for (let a = 0; a < 24; a++) t.poser(Math.round(4.5 + Math.cos(a / 24 * 6.283) * 2.6), Math.round(4.6 + Math.sin(a / 24 * 6.283) * 2.6), m, a > 12 ? 4 : 2);
  // la grande clé : un anneau ovale, la tige, le panneton à deux dents
  for (let a = 0; a < 16; a++) t.poser(Math.round(2.5 + Math.cos(a / 16 * 6.283) * 1.6), Math.round(9 + Math.sin(a / 16 * 6.283) * 1.8), m, a > 8 ? 4 : 2);
  for (let y = 11; y < 21; y++) t.poser(2, y, m, 3);
  for (const [x, y] of [[3, 17], [4, 17], [3, 19], [4, 19], [4, 18], [3, 20]]) t.poser(x, y, m, 3);
  // la petite clé
  for (let a = 0; a < 12; a++) t.poser(Math.round(7 + Math.cos(a / 12 * 6.283) * 1.4), Math.round(9 + Math.sin(a / 12 * 6.283) * 1.4), m, a > 6 ? 4 : 2);
  for (let y = 11; y < 17; y++) t.poser(7, y, m, 4);
  for (const [x, y] of [[8, 15], [8, 16], [9, 16]]) t.poser(x, y, m, 3);
  t.contour();
  t.texture(scene, cle);
  return cle;
}

// La clochette du comptoir, sur sa potence de fer, au coin de la fenêtre
function clochetteStyle(scene, st) {
  const cle = 'clochetteMatin_' + st;
  if (scene.textures.exists(cle)) return cle;
  const t = toileComptoir(12, 16, st), m = st === 'montagnard' ? 'fer' : 'metal';
  for (let y = 0; y < 4; y++) t.poser(6, y, 'fer', 3);
  t.forme(m, (x, y) => (y >= 4 && y <= 12 && Math.abs(x + 0.5 - 6) <= 1.5 + (y - 4) * 0.5 ? [(x + 0.5 - 6) / 5, (y - 8) / 8, 0.8] : null));
  for (let x = 1; x < 11; x++) t.poser(x, 12, m, x < 4 ? 4 : 2);
  t.poser(6, 13, 'fer', 2); t.poser(6, 14, 'fer', 4);
  t.contour();
  t.texture(scene, cle);
  return cle;
}
// La potence de la clochette (fixe)
function potenceHD(scene) {
  if (scene.textures.exists('potenceClochette')) return 'potenceClochette';
  const t = toileDecor(12, 6);
  for (let x = 0; x < 12; x++) { t.poser(x, 1, 'fer', 4); t.poser(x, 2, 'fer', 2); }
  for (let y = 0; y < 6; y++) t.poser(11, y, 'fer', 3);
  t.poser(10, 3, 'fer', 2); t.poser(9, 3, 'fer', 1);
  t.contour();
  t.texture(scene, 'potenceClochette');
  return 'potenceClochette';
}

// Une flamme de bougie, en deux images (elle vacille)
function flammeHD(scene) {
  if (scene.textures.exists('flammeBougie_0')) return;
  for (const k of [0, 1]) {
    const t = toileDecor(3, 5);
    t.dessin(0, 0, k ? ['.o.', '.O.', 'oOo', 'OYO', '.Y.'] : ['...', 'o..', 'oO.', 'OYO', '.Y.'], { o: ['flamme', 3], O: ['flamme', 4], Y: ['flamme', 5] });
    t.texture(scene, 'flammeBougie_' + k);
  }
}

// --- Le décor fixe du matin, posé dans une scène (le comptoir, son aperçu dans le carnet, la promenade) ---
// ox, oy : le décalage (0, 0 au comptoir) ; renvoie les objets créés, pour qu'on les anime
function poserDecorMatin(scene, st, { ox = 0, oy = 0, profondeur = 0, conteneur = null, heure = 10, jour = 1 } = {}) {
  const ajouter = o => { if (conteneur) conteneur.add(o); return o; };
  const im = (x, y, cle, d = profondeur) => ajouter(scene.add.image(ox + x, oy + y, cle).setOrigin(0).setScale(2).setDepth(d));
  const r = {};
  const et = etagereMatinStyle(scene, st);
  r.etagere = im(DECOR_MATIN.etagere.x, DECOR_MATIN.etagere.y, et.cle);
  r.calendrier = ajouter(scene.add.text(ox + DECOR_MATIN.etagere.x + 19, oy + DECOR_MATIN.etagere.y + 25, String(jour), style(12, '#2a1608', { fontStyle: 'bold', brut: true })).setOrigin(0.5).setDepth(profondeur));
  flammeHD(scene);
  r.flammes = et.flammes.map(([fx, fy]) => ajouter(scene.add.image(ox + DECOR_MATIN.etagere.x + fx * 2 + 3, oy + DECOR_MATIN.etagere.y + fy * 2 + 2, 'flammeBougie_0').setOrigin(0.5, 1).setScale(2).setDepth(profondeur)));
  r.tableau = im(DECOR_MATIN.tableau.x, DECOR_MATIN.tableau.y, tableauStyle(scene, st));
  horlogeStyle(scene, st);
  r.horloge = im(DECOR_MATIN.horloge.x, DECOR_MATIN.horloge.y, 'horlogeMatin_' + st);
  r.balancier = ajouter(scene.add.image(ox + DECOR_MATIN.pivot.x, oy + DECOR_MATIN.pivot.y, 'balancier_' + st).setOrigin(0.5, 0.03).setScale(2).setDepth(profondeur));
  r.vitre = ajouter(scene.add.image(ox + DECOR_MATIN.horloge.x + 8, oy + DECOR_MATIN.horloge.y + 74, 'vitreHorloge').setOrigin(0).setScale(2).setAlpha(0.22).setDepth(profondeur));
  r.aiguilles = ajouter(scene.add.graphics().setDepth(profondeur));
  r.dessinerAiguilles = h => {
    const g = r.aiguilles, cx = ox + DECOR_MATIN.cadran.x, cy = oy + DECOR_MATIN.cadran.y;
    const hh = ((h % 12) + 12) % 12, mm = h - Math.floor(h);
    const aH = (hh / 12) * Math.PI * 2 - Math.PI / 2, aM = mm * Math.PI * 2 - Math.PI / 2;
    g.clear();
    g.lineStyle(3, 0x1a0e06, 1).lineBetween(cx, cy, cx + Math.cos(aH) * 8, cy + Math.sin(aH) * 8);
    g.lineStyle(2, 0x1a0e06, 1).lineBetween(cx, cy, cx + Math.cos(aM) * 12, cy + Math.sin(aM) * 12);
    g.fillStyle(st === 'ombre' ? 0xb02424 : 0xc9a227, 1).fillCircle(cx, cy, 2);
  };
  r.dessinerAiguilles(heure);
  return r;
}

// Les objets posés dans la fenêtre et sur ses montants (au comptoir, devant le store et le client)
function poserObjetsFenetre(scene, st, { ox = 0, oy = 0, profondeur = 2.9, conteneur = null } = {}) {
  const ajouter = o => { if (conteneur) conteneur.add(o); return o; };
  const { x, y, w, h } = FENETRE, r = {};
  r.plante = ajouter(scene.add.image(ox + x + w, oy + y + h, planteStyle(scene, st)).setOrigin(1, 1).setScale(2).setDepth(profondeur));
  r.tisane = ajouter(scene.add.image(ox + x + w - 46, oy + y + h, tisaneStyle(scene, st)).setOrigin(1, 1).setScale(2).setDepth(profondeur));
  r.montant = ajouter(scene.add.image(ox + x - 8, oy + y + 4, montantStyle(scene, st)).setOrigin(0.5, 0).setScale(2).setDepth(3.1));
  r.cles = ajouter(scene.add.image(ox + 277, oy + 118, clesHD(scene, st)).setOrigin(0.5, 0).setScale(2).setDepth(3.1));
  r.potence = ajouter(scene.add.image(ox + x + w + 20, oy + y - 6, potenceHD(scene)).setOrigin(1, 0).setScale(2).setDepth(3.1));
  r.clochette = ajouter(scene.add.image(ox + x + w + 4, oy + y - 4, clochetteStyle(scene, st)).setOrigin(0.5, 0).setScale(2).setDepth(3.1));
  return r;
}

// La vapeur qui monte d'une boisson chaude : de petits flocons qui s'élèvent et s'effacent
function vapeur(scene, x, y, profondeur, masque = null) {
  return scene.time.addEvent({ delay: 650, loop: true, callback: () => {
    creerHalo(scene);
    const p = scene.add.image(x + Phaser.Math.Between(-3, 3), y, 'halo').setScale(0.07, 0.1).setTint(0xfff8ee).setAlpha(0.5).setDepth(profondeur);
    if (masque) p.setMask(masque);
    scene.tweens.add({ targets: p, y: y - Phaser.Math.Between(18, 26), x: p.x + Phaser.Math.Between(-6, 6), alpha: 0, scaleX: 0.16, scaleY: 0.2, duration: 2000, ease: 'Sine.easeOut', onComplete: () => p.destroy() });
  } });
}

// --- Le carnet de la tapissière, page « Le comptoir » ---

// Les deux onglets du carnet (« Les pièces », « Le comptoir ») : actif souligné, l'autre en italique
function ongletsCarnet(s, L, actif, allerA) {
  const G = s.G || window.GAME, piecesOuvertes = !!decoDe(G) || (typeof decoProposee === 'function' && decoProposee(G));
  [['pieces', piecesOuvertes ? 'Les pièces' : '🔒 Les pièces', -110], ['comptoir', 'Le comptoir', 110]].forEach(([id, nom, x]) => {
    const on = id === actif;
    const t = s.add.text(x, -192, nom, style(15, on ? '#3b2410' : '#8a6a4a', { fontStyle: on ? 'bold' : 'italic' })).setOrigin(0.5);
    L.add(t);
    if (on) L.add(s.add.rectangle(x, -181, t.width + 8, 2, 0x8a2a1a));
    else t.setInteractive({ useHandCursor: true }).on('pointerover', () => t.setColor('#5a3a1c')).on('pointerout', () => t.setColor('#8a6a4a')).on('pointerdown', () => { Son.jouer('page'); allerA(id); });
  });
  L.add(s.add.rectangle(0, -172, 640, 1, 0x8a6a3a, 0.6));
}

// Ce que dit la ligne d'un style : posé, acheté, son prix, ou ce qu'il faut pour l'ouvrir
function etatLigneStyle(G, id) {
  const S = STYLES_COMPTOIR[id], prix = S.prix.toLocaleString('fr-FR');
  if (styleComptoir(G) === id) return { texte: '✓ posé', couleur: '#2f7a2a' };
  if (styleComptoirAchete(G, id)) return { texte: 'acheté · se remet sans repayer', couleur: '#5a3a1a' };
  if (!styleComptoirOuvert(G, id)) return { texte: `🔒 ${prix} p. · ${S.verrou}`, couleur: '#8a7a6a' };
  return { texte: `${prix} p.`, couleur: G.argent >= S.prix ? '#3b2410' : '#a03020' };
}

// L'aperçu d'un style : le coin droit du comptoir (la fenêtre, le store, l'étagère, le tableau, l'horloge), en petit
function apercuComptoir(s, st, x, y, l, h) {
  const G = s.G || window.GAME, ech = 0.74, x0 = 548;
  const c = s.add.container(x, y);
  const fond = s.add.graphics(); fond.fillStyle(0x1a0e06).fillRect(-3, -3, l + 6, h + 6); c.add(fond);
  const v = s.add.container(-x0 * ech, 0).setScale(ech); c.add(v);
  creerDecorComptoir(s); creerObjetsHD(s);
  v.add(s.add.image(0, 0, murComptoirStyle(s, st)).setOrigin(0).setScale(2));
  const store = s.add.image(FENETRE.x + FENETRE.w / 2, FENETRE.y + FENETRE.h + 6, storeStyle(s, st)).setOrigin(0.5, 1).setScale(2);
  v.add(store);
  const lueurs = s.add.graphics(); for (const fy of FENTES_STORE) lueurs.fillStyle(['floral', 'lumiere'].includes(st) ? 0xffcc58 : 0xfff0b8, 0.9).fillRect(FENETRE.x, FENETRE.y + FENETRE.h + 6 - store.displayHeight + fy * 2, FENETRE.w, 2);
  v.add(lueurs);
  v.add(s.add.image(FENETRE.x - 16, FENETRE.y - 16, cadreFenetreStyle(s, st)).setOrigin(0).setScale(2));
  poserObjetsFenetre(s, st, { conteneur: v });
  const d = poserDecorMatin(s, st, { conteneur: v, heure: 10, jour: typeof dateDuJour === 'function' ? dateDuJour(G).jourDuMois : G.jour });
  d.balancier.setAngle(5);
  const carte = s.add.container(DECOR_MATIN.tableau.x + DECOR_MATIN.tableau.l, DECOR_MATIN.tableau.y + 82).setAngle(-2);
  carte.add(s.add.image(0, 0, carteDehorsHD(s)).setScale(2));
  carte.add(s.add.text(0, -12, 'Ce matin, dehors :', style(12, '#5a3a1c', { fontStyle: 'italic' })).setOrigin(0.5));
  carte.add(s.add.text(0, 10, '3 personnes', style(16, '#2a1608', { fontStyle: 'bold' })).setOrigin(0.5));
  v.add(carte);
  // (tout ce qui dépasse du cadre de l'aperçu est découpé)
  const forme = s.make.graphics({ add: false }); forme.fillStyle(0xffffff).fillRect(0, 0, l, h);
  c.formeMasque = forme; c.once('destroy', () => forme.destroy());
  return c;
}

// Le carnet ouvert à la page « Le comptoir » : la liste des styles à gauche, l'aperçu à droite
function carnetComptoir(s, rafraichir, choisi = null) {
  const G = s.G || window.GAME, objets = [];
  const voile = s.add.rectangle(480, 270, 960, 540, 0x0a0604, 0.55).setDepth(90).setInteractive();
  const L = s.add.container(480, 262).setDepth(91);
  let vu = choisi || styleComptoir(G), apercu = null;
  const vider = () => { for (const o of objets) { if (o.fond) { o.fond.destroy(); o.label.destroy(); } else if (o.active) o.destroy(); } objets.length = 0; };
  const fermer = () => { vider(); if (apercu) apercu.destroy(); L.destroy(); voile.destroy(); if (rafraichir) rafraichir(); };
  const allerA = id => {
    if (id !== 'pieces') return;
    if (decoDe(G)) { fermer(); carnetDeco(s, rafraichir); return; }
    if (typeof decoProposee === 'function' && decoProposee(G)) { fermer(); visiteTapissiere(s, ok => { if (ok) carnetDeco(s, rafraichir); else carnetComptoir(s, rafraichir); }); return; }
    Son.jouer('refus');
    gainEnDirect(s, 370, 92, 'Les pièces : quand toute la maison sera refaite', false, { taille: 13 });
  };
  const dessiner = () => {
    vider(); L.removeAll(true); if (apercu) { apercu.destroy(); apercu = null; }
    L.add(s.add.image(0, 0, panneauHD(s, 720, 480)).setScale(2));
    L.add(s.add.text(0, -218, "LE CARNET D'ÉCHANTILLONS", style(19, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
    ongletsCarnet(s, L, 'comptoir', allerA);
    // la liste des styles
    ORDRE_STYLES_COMPTOIR.forEach((id, i) => {
      const S = STYLES_COMPTOIR[id], y = -138 + i * 52, ouvert = styleComptoirOuvert(G, id), e = etatLigneStyle(G, id);
      const g = s.add.graphics(); L.add(g);
      g.fillStyle(id === vu ? 0xd8c498 : 0xe8d8b0, id === vu ? 0.95 : 0.5).fillRoundedRect(-334, y - 24, 338, 48, 6);
      if (id === vu) g.lineStyle(2, 0x2f7a2a).strokeRoundedRect(-334, y - 24, 338, 48, 6);
      S.nuancier.forEach((c, k) => { g.fillStyle(0x2a1608).fillRect(-327, y - 20 + k * 14, 12, 12); g.fillStyle(c).fillRect(-326, y - 19 + k * 14, 10, 10); });
      const pl = s.add.image(-292, y + 22, planteStyle(s, id)).setOrigin(0.5, 1).setScale(1.5); if (!ouvert) pl.setTint(0x9a9080); L.add(pl);
      const nom = s.add.text(-268, y - 23, S.nom, style(14, ouvert ? '#3b2410' : '#7a6a5a', { fontStyle: 'bold' })); L.add(nom);
      const resume = s.add.text(-268, y - 6, S.resume, style(11, '#6b4a2a', { fontStyle: 'italic' })); L.add(resume);
      const etat = s.add.text(-268, y + 8, e.texte, style(11, e.couleur, { fontStyle: 'bold' })); L.add(etat);
      for (const t of [nom, resume, etat]) for (let k = parseInt(t.style.fontSize, 10) - 1; t.width > 266 && k >= 9; k--) t.setFontSize(k);
      const zone = s.add.zone(480 - 165, 262 + y, 338, 48).setInteractive({ useHandCursor: true }).setDepth(92); objets.push(zone);
      zone.on('pointerdown', () => { if (vu === id) return; Son.jouer('page'); vu = id; dessiner(); });
    });
    // l'aperçu du style regardé
    const AX = 18, AY = -166, AL = 314, AH = 200;
    apercu = apercuComptoir(s, vu, 480 + AX, 262 + AY, AL, AH).setDepth(91.5);
    const m = apercu.formeMasque; m.setPosition(480 + AX, 262 + AY); apercu.setMask(m.createGeometryMask());
    const cadre = s.add.graphics().setDepth(91.6); cadre.lineStyle(3, 0x3b2410).strokeRect(480 + AX - 2, 262 + AY - 2, AL + 4, AH + 4); objets.push(cadre);
    const leg = s.add.text(AX + AL / 2, AY + AH + 12, `Aperçu : ${STYLES_COMPTOIR[vu].nom} — l'horloge, le calendrier et la commande ne bougent pas`, style(11, '#6b4a2a', { fontStyle: 'italic', align: 'center', wordWrap: { width: AL } })).setOrigin(0.5, 0);
    L.add(leg);
    L.add(s.add.text(AX + AL / 2, AY + AH + 50, `Ta fortune : ${G.argent.toLocaleString('fr-FR')} p.`, style(12, '#5a3a1a', { fontStyle: 'bold' })).setOrigin(0.5, 0));
    // les deux boutons
    const S = STYLES_COMPTOIR[vu], pose = styleComptoir(G) === vu, achete = styleComptoirAchete(G, vu), ouvert = styleComptoirOuvert(G, vu);
    const libelle = pose ? '✓ Style posé' : !ouvert ? '🔒 Pas encore' : achete ? 'Remettre ce style' : `Poser ce style · ${S.prix.toLocaleString('fr-FR')} p.`;
    const poser = creerBouton(s, 480 + 175, 262 + 186, 280, libelle, () => {
      if (pose || !ouvert) { Son.jouer('refus'); return; }
      if (!achete && G.argent < S.prix) { Son.jouer('refus'); gainEnDirect(s, 480 + 175, 262 + 150, `il manque ${(S.prix - G.argent).toLocaleString('fr-FR')} p.`, false, { taille: 13 }); return; }
      const p = poserStyleComptoir(G, vu);
      if (p < 0) { Son.jouer('refus'); return; }
      Son.jouer(p ? 'pieces' : 'glisse');
      if (p) gainEnDirect(s, 480 + 175, 262 + 150, `−${p.toLocaleString('fr-FR')} p.`, false);
      if (typeof noterJournal === 'function') noterJournal(`style du comptoir : ${S.nom}`);
      dessiner();
    });
    poser.label.setFontSize(16);
    if (pose || !ouvert) poser.setActif(false);
    const f = creerBouton(s, 480 - 170, 262 + 186, 220, 'Fermer le carnet', fermer);
    f.label.setFontSize(16);
    for (const b of [poser, f]) { b.fond.setDepth(93); b.label.setDepth(93.1); objets.push(b); }
    L.add(s.add.text(0, 220, 'Ysaline passe dès le comptoir en chêne verni · le carnet s’ouvre aussi au bureau', style(11, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5));
  };
  dessiner();
}

// La première visite d'Ysaline, dès le comptoir en chêne verni : la page « Le comptoir » de son carnet, offerte
function visiteTapissiereComptoir(s, apres) {
  const G = s.G || window.GAME;
  G.tapissiereVue = G.tapissiereVue || G.jour;
  const objets = [], voile = s.add.rectangle(480, 270, 960, 540, 0x0a0604, 0.45).setDepth(90).setInteractive(); objets.push(voile);
  const fig = imageCorps(s, 380, 506, { race: 'humain', nom: 'Ysaline Bellecroix', feminin: true, costume: 'noble', habit: 0x6a2a5a, cheveux: 0x3a2418, niveau: 3 }, 6.4).setDepth(91); objets.push(fig);
  const bul = s.add.container(600, 300).setDepth(92), gb = s.add.graphics(); objets.push(bul);
  gb.fillStyle(0xfff8e8).fillRoundedRect(-180, -78, 360, 140, 12).lineStyle(3, 0x8a6a3a).strokeRoundedRect(-180, -78, 360, 140, 12).fillStyle(0xfff8e8).fillTriangle(-160, 62, -130, 62, -180, 92); bul.add(gb);
  bul.add(s.add.text(-166, -68, 'Maîtresse Ysaline Bellecroix, tapissière', style(11, '#6b4a2a', { fontStyle: 'bold italic' })));
  bul.add(s.add.text(-166, -48, '« Un comptoir verni ! Il mérite mieux que des murs nus. Mon carnet d’échantillons, page « Le comptoir » : le champêtre t’est offert, les autres styles se posent quand tu veux, et d’autres viendront à mesure que ta maison grandit. »', style(12, '#2a1608', { wordWrap: { width: 332 } })));
  const fermer = () => { for (const o of objets) { if (o.fond) { o.fond.destroy(); o.label.destroy(); } else if (o.active) o.destroy(); } };
  const b1 = creerBouton(s, 520, 412, 220, 'Ouvrir le carnet', () => { fermer(); carnetComptoir(s, apres); });
  const b2 = creerBouton(s, 750, 412, 160, 'Plus tard', () => { fermer(); if (apres) apres(); });
  for (const b of [b1, b2]) { b.fond.setDepth(93); b.label.setDepth(93.1); objets.push(b); }
}
