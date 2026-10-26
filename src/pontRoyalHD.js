// (v1.57, planches 75 v2 et 75 maisons validées) Pont-Royal, la ville du Royaume des Hommes bâtie sur le grand pont
// du fleuve ; la Porte des Hommes (la frontière) ; les barges et leurs bateliers ; la garde ; la Halle des Bateliers ;
// les quatre styles de maison de la ville ; et la maison qui marche sur la route du grand voyage.
function rampesVille(t) {
  t.rampes.eau = rampe(0x3a6a90); t.rampes.refl = rampe(0x34506a); t.rampes.tuile = rampe(0xa84a2e); t.rampes.ocre = rampe(0xd8a860);
  t.rampes.rose = rampe(0xd89a88); t.rampes.vert = rampe(0x6a8a5a); t.rampes.or = rampe(0xd8b048); t.rampes.bleuRoi = rampe(0x2a4a8a);
  t.rampes.verre = rampe(0x6a8aa8); t.rampes.lueur = rampe(0xf0c050); t.rampes.mousse = rampe(0x5e7a3a); t.rampes.rive = rampe(0x6a7a4a);
  t.rampes.pierreB = rampe(0xd4cec0); t.rampes.banniere = rampe(0x9a2424); t.rampes.terreT = rampe(0x7a6448); t.rampes.argent = rampe(0xdadee6); t.rampes.noirB = rampe(0x24242e);
}
// une maison à colombages, vue de face : base (bx, by) au sol, largeur l, étages n ; enduit, toit, encorbellement
function maisonColombages(t, bx, by, l, n, { enduit = 'platre', toit = 'tuile', graine = 1, encorbellement = 2, boutique = false, lumiere = false } = {}) {
  const he = 22, haut = by - n * he;
  for (let e = 0; e < n; e++) {
    const d = e ? encorbellement : 0, y0 = by - (e + 1) * he, x0 = bx - d, x1 = bx + l + d;
    for (let y = y0; y < y0 + he; y++) for (let x = x0; x < x1; x++) t.poser(x, y, enduit, 3 + (fbm(x * 0.2, y * 0.2, graine + e) > 0.64 ? -1 : 0) + (y === y0 + he - 1 ? -1 : 0));
    // les colombages : sablière, poteaux, croix de Saint-André
    for (let x = x0; x < x1; x++) { t.poser(x, y0, 'cheneSombre', 2); t.poser(x, y0 + he - 1, 'cheneSombre', 1); }
    const nb = Math.max(2, Math.round(l / 14));
    for (let k = 0; k <= nb; k++) { const x = Math.round(x0 + k * (x1 - x0 - 2) / nb); for (let y = y0; y < y0 + he; y++) { t.poser(x, y, 'cheneSombre', 2); t.poser(x + 1, y, 'cheneSombre', 1); } }
    if (e === 0 && boutique) {
      // la boutique du rez-de-chaussée : une grande baie, un auvent
      for (let y = y0 + 6; y < y0 + he - 1; y++) for (let x = bx + 4; x < bx + l - 4; x++) t.poser(x, y, (x - bx) % 9 === 4 ? 'cheneSombre' : lumiere ? 'lueur' : 'verre', (x - bx) % 9 === 4 ? 1 : lumiere ? 3 : 2);
      for (let x = bx + 2; x < bx + l - 2; x++) for (let y = y0 + 2; y < y0 + 6; y++) t.poser(x, y, (Math.floor((x - bx) / 4) % 2) ? 'tuile' : 'toile', 4 - (y - y0 - 2));
    } else {
      // les fenêtres à petits carreaux
      const nf = Math.max(1, Math.floor(l / 16));
      for (let k = 0; k < nf; k++) { const fx = Math.round(x0 + (k + 0.5) * (x1 - x0) / nf) - 4;
        for (let y = y0 + 6; y < y0 + 17; y++) for (let x = fx; x < fx + 8; x++) { const cadre = x === fx || x === fx + 7 || y === y0 + 6 || y === y0 + 16 || x === fx + 4 || y === y0 + 11;
          t.poser(x, y, cadre ? 'cheneSombre' : (lumiere && hachage(k, e, graine) > 0.5 ? 'lueur' : 'verre'), cadre ? 1 : 3 + (x < fx + 3 && y < y0 + 10 ? 1 : 0)); }
        for (let x = fx - 1; x < fx + 9; x++) t.poser(x, y0 + 17, 'pierre', 3); }
    }
  }
  // le toit en pignon, raide, avec sa cheminée
  const d = n > 1 ? encorbellement : 0, x0 = bx - d - 2, x1 = bx + l + d + 2, cx = (x0 + x1) / 2, hp = Math.round((x1 - x0) * 0.62);
  for (let y = haut - hp; y < haut; y++) for (let x = x0; x < x1; x++) { if (Math.abs(x + 0.5 - cx) > (y - (haut - hp)) * (x1 - x0) / 2 / hp + 0.5) continue;
    const r = Math.floor((y - haut + hp) / 3), dec = (r % 2) * 3, joint = (x + dec) % 6 === 0 || (y - haut + hp) % 3 === 2;
    t.poser(x, y, toit, joint ? 1 : 3 + (x < cx ? 1 : 0) - (hachage(Math.floor((x + dec) / 6), r, graine) > 0.8 ? 1 : 0)); }
  // la petite lucarne
  if (hp > 14) for (let y = haut - Math.round(hp * 0.45); y < haut - Math.round(hp * 0.45) + 6; y++) for (let x = Math.round(cx) - 2; x < Math.round(cx) + 3; x++) t.poser(x, y, lumiere ? 'lueur' : 'verre', 2);
  const chx = Math.round(cx + (x1 - x0) * 0.22);
  for (let y = haut - Math.round(hp * 0.7) - 6; y < haut - Math.round(hp * 0.4); y++) for (let x = chx; x < chx + 5; x++) t.poser(x, y, 'pierre', (y % 3 === 0 || x === chx + 4) ? 1 : 3);
  return { haut: haut - hp, gauche: x0, droite: x1 };
}
// des pierres de taille en assises
function pierresTaille(t, x0, y0, x1, y1, graine = 5, mat = 'pierre') {
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const r = Math.floor((y - y0) / 5), dec = (r % 2) * 6, b = Math.floor((x + dec) / 12), joint = (y - y0) % 5 === 4 || (x + dec) % 12 === 0;
    t.poser(x, y, mat, joint ? 1 : 2 + Math.round(hachage(b, r, graine) * 1.6) + (fbm(x * 0.3, y * 0.3, graine) > 0.7 ? 1 : 0)); }
}

// Pont-Royal vu du fleuve : le grand pont de pierre à cinq arches, les maisons serrées dessus (certaines en
// encorbellement au-dessus de l'eau, sur des jambes de force), la chapelle au milieu, la porte fortifiée à gauche,
// le rocher de la citadelle à droite ; le fleuve et ses reflets. Le lot vide (x 286..344) attend la maison.
function pontRoyalHD(scene, { lot = true } = {}) {
  const cle = 'pontRoyalHD' + (lot ? '' : '_plein'); if (scene.textures.exists(cle)) return cle;
  const L = 480, H = 235, t = toileDecor(L, H); rampesVille(t);
  const eauY = 176, tablier = 120;
  // la rive lointaine à gauche (les remparts de la ville basse) et le rocher de la citadelle à droite
  for (let x = 0; x < 60; x++) { const h = 150 + Math.round(fbm(x * 0.05, 1, 3) * 8); for (let y = h; y < eauY; y++) t.poser(x, y, y < h + 3 ? 'rive' : 'pierre', y < h + 3 ? 3 : 2 + ((x + y) % 7 === 0 ? 1 : 0)); }
  // (le rocher monte en pente derrière le bout du pont, ses strates et ses failles, la mousse sur les replats ; son pied est
  // caché par le tablier et la culée : il ne descend jamais en plaque grise jusqu'à l'eau)
  const roc = x => Math.round(Math.max(70, 124 - (x - 392) * 1.15) + (fbm(x * 0.09, 2, 9) - 0.5) * 7);
  for (let x = 392; x < L; x++) for (let y = roc(x); y < tablier + 4; y++) {
    const n = fbm(x * 0.12, y * 0.3, 23), faille = Math.abs(fbm(x * 0.05, y * 0.05, 29) - 0.5) < 0.014, strate = (y + Math.round(x * 0.35)) % 9 === 0;
    t.poser(x, y, y < roc(x) + 2 && n > 0.4 ? 'mousse' : 'pierre', faille || strate ? 1 : Math.min(4, 1 + Math.round(n * 2.4) + (x < 430 ? 0 : 1))); }
  // la citadelle sur son rocher : un donjon, une tour ronde, la bannière d'or du royaume
  pierresTaille(t, 432, 30, 470, 82, 21, 'pierreB');
  for (let x = 432; x < 470; x++) for (let y = 82; y < roc(x) + 2; y++) t.poser(x, y, 'pierreB', (y % 5 === 4 || x % 12 === 0) ? 1 : 2);   // (ses fondations, jusqu'au rocher)
  for (let x = 430; x < 472; x++) if ((x - 430) % 6 < 3) for (let y = 24; y < 30; y++) t.poser(x, y, 'pierreB', 4);
  // la tour blanche du duc, fine et haute, son toit pointu d'ardoise
  pierresTaille(t, 440, -6, 456, 30, 23, 'pierreB');
  for (let y = 0; y < 12; y++) for (let x = 438; x < 458; x++) if (Math.abs(x + 0.5 - 448) <= Math.max(0, y - 0) * 0.85) t.poser(x, y, 'ardoise', x < 448 ? 4 : 2);
  banniereRoyale(t, 466, 34, 7, 26);
  for (let y = 40; y < 52; y++) for (let x = 446; x < 452; x++) t.poser(x, y, 'lueur', 3);

  // le pont : le tablier et le parapet, les piles et leurs avant-becs, les cinq arches
  const piles = [26, 112, 198, 284, 370, 454], demi = 10;
  for (let y = tablier; y < eauY + 4; y++) for (let x = 20; x < 444; x++) {
    let trou = false;
    for (let k = 0; k < piles.length - 1; k++) { const a = piles[k] + demi, b = piles[k + 1] - demi, c = (a + b) / 2, r = (b - a) / 2;
      if (x >= a && x < b && y > tablier + 12 + r - Math.sqrt(Math.max(0, r * r - (x + 0.5 - c) ** 2))) trou = true; }
    if (trou) continue;
    const r = Math.floor((y - tablier) / 5), dec = (r % 2) * 6, joint = (y - tablier) % 5 === 4 || (x + dec) % 12 === 0;
    t.poser(x, y, 'pierreB', joint ? 1 : 3 + (hachage(Math.floor((x + dec) / 12), r, 7) > 0.75 ? 1 : 0) - (y > eauY - 8 ? 1 : 0) + (y < tablier + 3 ? 1 : 0));
  }
  // les claveaux autour de chaque arche (une couronne plus claire, aux joints rayonnants)
  for (let k = 0; k < piles.length - 1; k++) { const a = piles[k] + demi, b = piles[k + 1] - demi, c = (a + b) / 2, r = (b - a) / 2, cy = tablier + 12 + r;
    for (let y = tablier + 8; y < eauY; y++) for (let x = a - 4; x < b + 4; x++) { const d = Math.hypot(x + 0.5 - c, y + 0.5 - cy); if (y > cy || d < r || d > r + 4) continue;
      const ang = Math.atan2(cy - y, x - c), joint = Math.round(ang / Math.PI * 18 * 2) % 2 === 0 && d > r + 1;
      t.poser(x, y, 'pierreB', joint ? 2 : 4); } }
  // les avant-becs triangulaires au pied des piles, la mousse au ras de l'eau
  for (const p of piles.slice(1, -1)) for (let y = eauY - 18; y < eauY + 4; y++) { const w = demi + 2 - Math.max(0, (eauY - 18 - y)); for (let x = p - w; x < p + w; x++) t.poser(x, y, 'pierreB', x < p ? 3 : 2); for (let x = p - w; x < p + w; x++) if (y > eauY - 4 && hachage(x, y, 4) > 0.4) t.poser(x, y, 'mousse', 2); }
  // le parapet, ses balustres
  for (let x = 0; x < 452; x++) for (let y = tablier - 6; y < tablier; y++) t.poser(x, y, 'pierreB', y === tablier - 6 ? 4 : (x % 5 === 0 ? 1 : 3));
  // la culée de droite : un massif de pierre qui porte la dernière arche, du tablier jusqu'au lit du fleuve ; son pied s'évase
  // en gradins (l'empattement), un contrefort, deux cordons de pierre ; la mousse au ras de l'eau
  for (let y = tablier - 6; y < eauY + 4; y++) {
    const x0 = 444 - (y > eauY - 22 ? Math.min(3, Math.floor((y - (eauY - 22)) / 6)) * 3 : 0);
    for (let x = x0; x < L; x++) { const r = Math.floor((y - tablier) / 5), dec = (r % 2) * 6, joint = (y - tablier) % 5 === 4 || (x + dec) % 12 === 0, cordon = y === tablier + 14 || y === eauY - 22;
      t.poser(x, y, 'pierreB', cordon ? 4 : joint ? 1 : 2 + (hachage(Math.floor((x + dec) / 12), r, 41) > 0.7 ? 1 : 0) + (x < x0 + 2 ? 1 : 0) - (y > eauY - 8 ? 1 : 0)); }
    if (y > eauY - 6) for (let x = x0; x < L; x++) if (hachage(x, y, 6) > 0.5) t.poser(x, y, 'mousse', 2);
  }
  for (let y = tablier + 15; y < eauY - 22; y++) for (let x = 446; x < 454; x++) t.poser(x, y, 'pierreB', x === 446 ? 4 : x === 453 ? 1 : 3);   // (le contrefort)
  // au bout du tablier, la porte de la citadelle, taillée dans le rocher : son arc de pierre, la herse levée, une lanterne
  for (let y = 74; y < tablier - 6; y++) for (let x = 452; x < L; x++) {
    const dx = x + 0.5 - 466, haut = y + 0.5 < 90, dedans = Math.abs(dx) < 9 && (!haut || Math.hypot(dx, y + 0.5 - 90) < 9), cadre = Math.abs(dx) < 13 && (!haut || Math.hypot(dx, y + 0.5 - 90) < 13);
    if (dedans) t.poser(x, y, (y - 82) % 6 === 0 && y < 92 ? 'fer' : 'noirB', (y - 82) % 6 === 0 && y < 92 ? 2 : 1);
    else if (cadre) t.poser(x, y, 'pierreB', haut ? (Math.round(Math.atan2(90 - y, dx) * 4) % 2 ? 4 : 2) : (y % 5 === 4 ? 1 : 3));
  }
  for (let y = 98; y < 104; y++) for (let x = 450; x < 452; x++) t.poser(x, y, 'lueur', 4);
  // les maisons sur le pont, serrées, de hauteurs différentes (le lot vide reste vide)
  const M = [[42, 22, 3, 'platre', 'ardoise'], [66, 22, 2, 'ocre', 'ardoise'], [90, 26, 3, 'platre', 'tuile'], [118, 20, 2, 'platre', 'ardoise'],
             [140, 22, 3, 'rose', 'ardoise'], [222, 24, 3, 'platre', 'ardoise'], [248, 30, 2, 'platre', 'tuile'], [350, 26, 3, 'platre', 'ardoise'], [378, 22, 2, 'ocre', 'ardoise'], [402, 24, 3, 'platre', 'ardoise']];
  if (!lot) M.push([288, 52, 2, 'platre', 'tuile']);
  M.forEach(([x, l, n, e, toit], i) => maisonColombages(t, x, tablier - 6, l, n, { enduit: e, toit, graine: i * 7 + 1, lumiere: i % 3 === 0 }));
  // la chapelle du pont, au milieu : nef de pierre, clocher pointu, cloche
  pierresTaille(t, 166, 70, 214, tablier - 6, 13, 'pierreB');
  for (let y = 54; y < 70; y++) for (let x = 162; x < 218; x++) if (Math.abs(x + 0.5 - 190) <= (y - 54) * 1.75 + 1) t.poser(x, y, 'ardoise', (x + y) % 4 === 0 ? 1 : 3);
  pierresTaille(t, 182, 20, 198, 70, 17, 'pierreB');
  for (let y = 0; y < 22; y++) for (let x = 180; x < 200; x++) if (Math.abs(x + 0.5 - 190) <= y * 0.48 + 0.5) t.poser(x, y, 'ardoise', x < 190 ? 4 : 2);
  for (let y = 32; y < 42; y++) for (let x = 186; x < 194; x++) t.poser(x, y, y < 35 ? 'cheneSombre' : 'laiton', y < 35 ? 1 : 3 + (x < 189 ? 1 : 0));
  for (let y = 84; y < 106; y++) for (let x = 184; x < 196; x++) if (Math.hypot(x + 0.5 - 190, Math.max(0, 90 - y)) < 6) t.poser(x, y, 'verre', 2 + ((x + y) % 3 === 0 ? 2 : 0));
  // la porte fortifiée à l'entrée du pont : une tour carrée et son toit
  // (planche 77) la rive gauche est haute : la route arrive à plat, à hauteur du tablier, jusqu'à la tour ; sous la tour,
  // le talus de terre et de roche descend jusqu'au fleuve sous la première arche (herbe, buissons, un sentier vers l'eau)
  const talus = x => Math.round(tablier + 2 + Math.max(0, x - 30) * 1.25 + (fbm(x * 0.2, 5, 51) - 0.5) * 4);
  for (let x = 0; x < 80; x++) for (let y = Math.max(tablier, talus(x)); y < eauY + 3; y++) {
    const n = fbm(x * 0.15, y * 0.2, 53), haut = y < talus(x) + 3;
    const herbe = n < 0.47 || haut;
    t.poser(x, y, herbe ? 'rive' : n > 0.64 ? 'pierre' : 'terreT', herbe ? 3 - (haut && y > talus(x) + 1 ? 1 : 0) - (y > eauY - 8 ? 1 : 0) + (hachage(x, y, 57) > 0.85 ? 1 : 0) : n > 0.64 ? 2 + (n > 0.72 ? 1 : 0) : 2 + Math.round((n - 0.5) * 4));
    if (!haut && hachage(x, y, 55) > 0.93) t.poser(x, y, 'rive', 2);
  }
  pierresTaille(t, 0, tablier - 1, 40, tablier + 14, 33, 'pierreB');   // (le soubassement de la tour, posé sur le talus)
  for (const [bx, by, r] of [[46, talus(46) - 1, 4], [60, talus(60), 3.5], [8, tablier + 20, 3]]) { disqueHD(t, bx, by, r, 'vert', 2); disqueHD(t, bx - 1, by - 1, r * 0.6, 'vert', 3); }
  for (let k = 0; k < 9; k++) { const x = 34 + k * 5, y = talus(x) - 1; t.poser(x, y, 'pierreB', 4); t.poser(x + 1, y, 'pierreB', 3); }   // (les marches du sentier qui descend au fleuve)
  for (let y = eauY - 3; y < eauY + 3; y++) for (let x = 60; x < 84; x++) if (hachage(x, y, 5) > 0.45 && t.mat(x, y)) t.poser(x, y, 'mousse', 2);
  pierresTaille(t, 6, 50, 36, tablier, 31, 'pierreB');
  for (let y = 30; y < 50; y++) for (let x = 2; x < 40; x++) if (Math.abs(x + 0.5 - 21) <= (y - 30) * 0.95 + 1) t.poser(x, y, 'ardoise', x < 21 ? 4 : 2);
  for (let y = 86; y < tablier; y++) for (let x = 14; x < 28; x++) if (Math.hypot(x + 0.5 - 21, Math.max(0, 92 - y)) < 7) t.poser(x, y, 'cheneSombre', 1);
  for (let y = 60; y < 70; y++) for (let x = 18; x < 24; x++) t.poser(x, y, 'lueur', 3);
  banniereRoyale(t, 30, 54, 7, 30);
  // les jambes de force sous les maisons en encorbellement, au-dessus de l'eau
  for (const x of [40, 92, 146, 236, 262, 362, 414]) for (let k = 0; k < 14; k++) { t.poser(x - k * 0.6, tablier + 2 + k, 'cheneSombre', 2); t.poser(x + 1 - k * 0.6, tablier + 2 + k, 'cheneSombre', 1); }
  // les lanternes du parapet
  for (const x of [60, 140, 240, 330, 420]) { for (let y = tablier - 18; y < tablier - 6; y++) t.poser(x, y, 'fer', 2); for (let y = tablier - 22; y < tablier - 17; y++) for (let xx = x - 2; xx < x + 3; xx++) t.poser(xx, y, 'lueur', 4); }
  // sous les arches, au loin : le fleuve qui continue, et l'autre rive basse
  for (let y = 150; y < eauY; y++) for (let x = 0; x < L; x++) if (!t.mat(x, y)) t.poser(x, y, y < 156 ? 'rive' : 'eau', y < 156 ? 2 : 2 + ((x + y * 3) % 11 === 0 ? 1 : 0) + (y > 166 ? 1 : 0));
  // le fleuve : l'eau, puis le reflet de tout ce qui est au-dessus (renversé, assombri, ondulé)
  for (let y = eauY; y < H; y++) for (let x = 0; x < L; x++) {
    if (t.mat(x, y)) continue;
    const ys = 2 * eauY - y - 1, ond = Math.round(Math.sin(y * 0.9 + x * 0.05) * (1 + (y - eauY) * 0.04)), xs = x + ond;
    const m = t.mat(xs, ys), k = t.teinte(xs, ys);
    const vague = (Math.floor(x / 9 + Math.sin(y * 1.3) * 2) + y) % 7 === 0;
    if (m && m !== 'eau' && m !== 'refl') t.poser(x, y, 'refl', Math.max(0, Math.min(4, k - 1)) + (vague ? 1 : 0));
    else t.poser(x, y, 'eau', 3 + (vague ? 1 : 0) + (y < eauY + 2 ? 1 : 0) - ((y - eauY) > 40 ? 1 : 0));
  }
  t.contour(); t.texture(scene, cle); return cle;
}

// Une longue bannière du royaume, pendue à une hampe : rouge, bordée d'argent, la couronne et les épées croisées
function banniereRoyale(t, x0, y0, l, h) {
  for (let x = x0 - 1; x < x0 + l + 1; x++) t.poser(x, y0 - 1, 'fer', 3);
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + l; x++) { const pointe = y > y0 + h - 4 && Math.abs(x + 0.5 - x0 - l / 2) < (y - (y0 + h - 4)) * l / 7; if (pointe) continue;
    const bord = x === x0 || x === x0 + l - 1; t.poser(x, y, bord ? 'argent' : 'banniere', bord ? 3 : 3 + (x === x0 + 1 ? 1 : 0) - (Math.floor((y - y0) / 3) % 4 === 0 ? 1 : 0)); }
  const cx = x0 + Math.floor(l / 2); for (let j = -2; j <= 2; j++) { t.poser(cx + j, y0 + 8 + j, 'argent', 4); t.poser(cx - j, y0 + 8 + j, 'argent', 4); } for (let x = cx - 2; x <= cx + 2; x++) t.poser(x, y0 + 4, 'argent', 5);
}
// Une barge du fleuve, sans son batelier (on pose un vrai personnage dessus) : coque de planches goudronnées, proue
// relevée, plat-bord clair, caisses, tonneaux et sacs, un abri de toile rayée à l'arrière
function bargeHD(scene, charge = 'caisses') {
  const cle = 'bargeHD2_' + charge; if (scene.textures.exists(cle)) return cle;
  const L = 130, H = 44, t = toileDecor(L, H); rampesVille(t); t.rampes.goudron = rampe(0x3a2c22); t.rampes.sac = rampe(0xc8b080);
  const haut = x => 26 - Math.max(0, 14 - x) * 0.7 - Math.max(0, x - (L - 12)) * 0.9;   // (la proue et la poupe relevées)
  for (let x = 2; x < L - 2; x++) { const h0 = Math.round(haut(x)), bas = 40 - Math.round(Math.max(0, 10 - x) * 0.6 + Math.max(0, x - (L - 10)) * 0.6);
    for (let y = h0; y < bas; y++) t.poser(x, y, y < h0 + 2 ? 'chene' : 'goudron', y < h0 + 2 ? 4 : ((y - h0) % 4 === 3 ? 1 : 2 + (hachage(Math.floor(x / 10), Math.floor((y - h0) / 4), 7) > 0.7 ? 1 : 0))); }
  for (let x = 8; x < L - 8; x += 12) for (let y = Math.round(haut(x)) + 2; y < 36; y++) t.poser(x, y, 'goudron', 1);
  // la cargaison : des caisses, des tonneaux, des sacs
  for (const [x, y, l, h] of [[20, 14, 12, 12], [33, 16, 10, 10], [26, 6, 10, 8]]) for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + l; xx++) t.poser(xx, yy, 'chene', (xx === x || xx === x + l - 1 || yy === y || yy === y + h - 1 || xx - x === yy - y) ? 2 : 4 - (xx > x + l - 3 ? 1 : 0));
  for (const x of [46, 54]) for (let y = 12; y < 26; y++) for (let xx = x; xx < x + 7; xx++) t.poser(xx, y, (y === 15 || y === 22) ? 'fer' : 'chene', (y === 15 || y === 22) ? 3 : 3 + (xx === x + 2 ? 1 : 0) - (xx === x + 6 ? 1 : 0));
  for (const [x, y] of [[63, 18], [70, 19], [66, 13]]) disqueHD(t, x + 3, y + 3, 4, 'sac', 3);
  // l'abri de toile rayée, sur quatre perches
  for (const x of [84, 112]) for (let y = 6; y < 26; y++) t.poser(x, y, 'cheneSombre', 2);
  for (let y = 2; y < 9; y++) for (let x = 80; x < 117; x++) if (y > 2 + Math.abs(x - 98) * 0.12) t.poser(x, y, Math.floor((x - 80) / 4) % 2 ? 'banniere' : 'toile', y < 4 ? 4 : 3 - (y === 8 ? 1 : 0));
  // la lanterne à la proue
  for (let y = 4; y < 20; y++) t.poser(L - 9, y, 'fer', 2); for (let y = 4; y < 9; y++) for (let x = L - 11; x < L - 7; x++) t.poser(x, y, 'lueur', 4);
  t.contour(); t.texture(scene, cle); return cle;
}
// La barge sur l'eau, avec son batelier (un vrai personnage, à l'échelle) et sa perche, et son reflet
function poserBarge(s, x, y, sc = 2, flip = false) {
  // (le batelier est posé avant la coque : il se tient sur le pont, derrière le plat-bord qui cache ses pieds)
  const bx = x + (flip ? -1 : 1) * 30 * sc;
  const q = { race: 'humain', nom: 'Le batelier', costume: 'pirate', habit: 0x2a4a8a, cheveux: 0x2a1a10, barbe: 'courte', niveau: 'aguerri' };
  const h = imageCorps(s, bx, y - 15 * sc, q, sc * 1.25).setFlipX(flip);
  const b = s.add.image(x, y, bargeHD(s)).setOrigin(0.5, 1).setScale(sc).setFlipX(flip);
  const r = s.add.image(x, y - 4 * sc, bargeHD(s)).setOrigin(0.5, 0).setScale(sc, -sc * 0.6).setFlipX(flip).setTint(0x34506a).setAlpha(0.5);
  r.setScale(sc, sc * 0.6); r.setFlipY(true);
  const g = s.add.graphics(); g.lineStyle(Math.max(2, sc), 0x6b4423); g.lineBetween(bx + (flip ? 1 : -1) * 6 * sc, y - 40 * sc, bx + (flip ? -1 : 1) * 18 * sc, y + 6 * sc);
  return { b, h };
}

// La rue sur le pont (vue de la rue, à l'échelle du jeu) : à gauche le tonnelier, au milieu le lot vide où la
// maison s'accroupit (derrière : le parapet, le fleuve, l'autre rive et la citadelle), à droite une maison haute et
// la Halle des Bateliers avec sa poutre de levage et une caisse au bout de la corde.
function rueDuPontHD(scene, { nu = false } = {}) {
  const saA = typeof saisonActuelle === 'function' ? saisonActuelle() : 'moissons';   // (v1.63 : les petits arbres de l'autre rive suivent la saison)
  const cle = 'rueDuPontHD' + (nu ? '_nu' : '') + '_' + saA; if (scene.textures.exists(cle)) return cle;   // (nu : le pont sans ses maisons, juste après la tour de tête de pont)
  const L = 480, H = 235, t = toileDecor(L, H); rampesVille(t);
  const sol = H, eauY = 158;
  // au loin : l'autre rive, ses toits, la citadelle sur son rocher (petite), puis le fleuve
  for (let x = 0; x < L; x++) { const h = 138 + Math.round(fbm(x * 0.04, 3, 5) * 10); for (let y = h; y < eauY; y++) t.poser(x, y, 'rive', 2 + (y < h + 2 ? 1 : 0)); }
  // l'autre rive : des maisons en volume (le pignon face à nous, le côté qui fuit dans l'ombre), deux rangées, les
  // plus lointaines plus pâles ; des arbres entre elles
  for (const loin of [true, false]) {
    const n = loin ? 19 : 13, pas = L / n;
    for (let k = 0; k < n; k++) {
      const x0 = Math.round(k * pas + hachage(k, loin ? 1 : 2, 13) * pas * 0.3), w = Math.round((loin ? 12 : 16) + hachage(k, 3, loin ? 5 : 6) * (loin ? 4 : 6));
      if (x0 + w > 186 && x0 < 270) continue;   // (le rocher de la citadelle)
      maisonLointaine(t, x0, loin ? 143 : 151, w, loin ? 2 : 2 + (hachage(k, 4, 9) > 0.6 ? 1 : 0), { loin, graine: k * 7 + (loin ? 3 : 1) });
      if (!loin && hachage(k, 10, 4) > 0.55) {
        const ax = x0 - 4;
        if (typeof peindreArbre === 'function') {   // (v1.63) de vrais petits arbres, peints par arbresHD.js, de la saison
          const esp = ['chene', 'bouleau', 'aulne'][k % 3], R = rampesArbre(saA, esp);
          for (const m in R) t.rampes[m + '_pr' + k] = R[m].map(c => melangeCouleur(c, 0xb8c8d0, 0.2));   // (un peu de distance)
          peindreArbre((x, y, m, i) => t.poser(x, y, m + '_pr' + k, i), { cx: ax, base: 150, H: 15, espece: esp, saison: saA, graine: k + 3 });
        } else { for (let y = 141; y < 150; y++) t.poser(ax, y, 'cheneSombre', 1); disqueHD(t, ax, 139, 4, 'vert', 2); disqueHD(t, ax - 1, 137, 2.5, 'vert', 3); }
      }
    }
  }
  // le rocher de la citadelle : des strates, des failles, de la mousse sur les replats
  for (let x = 192; x < 266; x++) { const h = 104 + Math.round(Math.abs(x - 229) * 0.95 + (fbm(x * 0.15, 4, 21) - 0.5) * 8); for (let y = h; y < 142; y++) {
    const n = fbm(x * 0.12, y * 0.3, 23), faille = Math.abs(fbm(x * 0.05, y * 0.05, 29) - 0.5) < 0.012;
    t.poser(x, y, y < h + 2 && n > 0.45 ? 'mousse' : 'pierre', faille ? 1 : 1 + Math.round(n * 2.4) + (x < 229 ? 1 : 0)); } }
  pierresTaille(t, 214, 74, 244, 106, 41, 'pierreB'); pierresTaille(t, 222, 44, 236, 74, 43, 'pierreB'); for (let y = 30; y < 44; y++) for (let x = 220; x < 238; x++) if (Math.abs(x + 0.5 - 229) <= (y - 30) * 0.65) t.poser(x, y, 'ardoise', x < 229 ? 4 : 2); for (let x = 212; x < 246; x += 5) for (let y = 70; y < 75; y++) t.poser(x, y, 'pierreB', 3); banniereRoyale(t, 240, 76, 5, 18);
  for (let y = eauY; y < 200; y++) for (let x = 0; x < L; x++) t.poser(x, y, 'eau', 3 + ((Math.floor(x / 11 + Math.sin(y) * 2) + y) % 6 === 0 ? 1 : 0) - (y > 185 ? 1 : 0));
  // le parapet de pierre du pont, avec ses balustres et sa main courante
  for (let y = 196; y < sol; y++) for (let x = 0; x < L; x++) { const main = y < 202, bal = y >= 202 && y < 226;
    if (bal) { const k = (x % 12); if (k < 3 || k > 8) continue; t.poser(x, y, 'pierre', k === 4 ? 4 : k === 8 ? 1 : 3 - (Math.abs(y - 214) > 8 ? 0 : 0)); }
    else t.poser(x, y, 'pierre', main ? (y === 196 ? 5 : 3) : 2 + ((x + (y % 2) * 6) % 12 === 0 ? -1 : 0)); }
  if (nu) { t.contour(); t.texture(scene, cle); return cle; }
  // à gauche : le tonnelier (trois étages, sa boutique, ses tonneaux)
  maisonColombages(t, 2, sol, 78, 3, { enduit: 'platre', toit: 'ardoise', graine: 3, boutique: true, encorbellement: 3 });
  for (const x of [8, 24]) for (let y = sol - 18; y < sol; y++) for (let xx = x; xx < x + 13; xx++) t.poser(xx, y, (y - sol + 18) % 6 === 2 ? 'fer' : 'chene', (y - sol + 18) % 6 === 2 ? 3 : 3 + (xx === x + 3 ? 1 : 0) - (xx === x + 12 ? 1 : 0));
  for (let y = sol - 74; y < sol - 62; y++) for (let x = 28; x < 78; x++) t.poser(x, y, 'chene', y === sol - 74 || y === sol - 63 || x === 28 || x === 77 ? 1 : 4);
  // à droite : une maison haute et étroite, puis la Halle des Bateliers
  maisonColombages(t, 310, sol, 44, 4, { enduit: 'rose', toit: 'ardoise', graine: 9, encorbellement: 3 });
  dessinerHalle(t, 360, sol);
  t.contour(); t.texture(scene, cle); return cle;
}

// Le grand bouclier de la garde de Pont-Royal : planches noires, cerclage d'acier riveté, les épées croisées et la
// couronne peintes en argent, trois étoiles
function bouclierPontHD(scene) {
  const cle = 'bouclierPontHD'; if (scene.textures.exists(cle)) return cle;
  const L = 18, H = 34, t = toileDecor(L, H); rampesVille(t);
  for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) { const bas = y > H - 8 && Math.abs(x + 0.5 - L / 2) > (H - y) * L / 16; if (bas) continue;
    const bord = x <= 1 || x >= L - 2 || y <= 1 || (y > H - 9 && Math.abs(x + 0.5 - L / 2) > (H - y) * L / 16 - 2);
    t.poser(x, y, bord ? 'fer' : 'noirB', bord ? (x < L / 2 ? 4 : 2) : 2 + (x % 5 === 0 ? -1 : 0) + (x < 5 ? 1 : 0)); }
  for (const [x, y] of [[1, 4], [L - 2, 4], [1, 14], [L - 2, 14], [1, 24], [L - 2, 24]]) t.poser(x, y, 'argent', 5);
  const cx = Math.floor(L / 2); for (let j = -4; j <= 4; j++) { t.poser(cx + j, 15 + j, 'argent', 4); t.poser(cx - j, 15 + j, 'argent', 4); }
  for (let x = cx - 3; x <= cx + 3; x++) t.poser(x, 8, 'argent', 5); for (const d of [-3, 0, 3]) t.poser(cx + d, 7, 'argent', 5);
  for (const [x, y] of [[4, 4], [cx, 3], [L - 5, 4]]) t.poser(x, y, 'argent', 5);
  t.contour(); t.texture(scene, cle); return cle;
}
// Un garde de Pont-Royal, en pied, sa lance et son bouclier
function gardePont(s, x, y, sc = 6.4, flip = false, nom = 'Garde du pont') {
  const q = { race: 'humain', nom, costume: 'gardeRoyal', habit: 0x1c1c24, cheveux: 0x1a1612, coiffure: 'long', niveau: 'aguerri', armeEmportee: 'lance', serieux: true };
  const g = imageCorps(s, x, y, q, sc).setFlipX(flip);
  const b = s.add.image(x + (flip ? -1 : 1) * sc * 3.4, y - sc * 1.2, bouclierPontHD(s)).setOrigin(0.5, 1).setScale(sc * 0.27);
  return { g, b };
}
// La Porte des Hommes, à la frontière : deux tours de pierre blanche, une grande arche, la herse levée, les bannières
function porteDesHommesHD(scene) {
  const cle = 'porteDesHommesHD'; if (scene.textures.exists(cle)) return cle;
  const L = 300, H = 230, t = toileDecor(L, H); rampesVille(t);
  const sol = H;
  // le mur et l'arche centrale
  pierresTaille(t, 70, 70, 230, sol, 61, 'pierreB');
  for (let y = 90; y < sol; y++) for (let x = 104; x < 196; x++) if (y > 136 - Math.sqrt(Math.max(0, 46 * 46 - (x + 0.5 - 150) ** 2)) + 46 - 46) { if (Math.hypot(x + 0.5 - 150, Math.max(0, 136 - y)) < 46) { t.c[y * L + x] = null; t.m[y * L + x] = null; } }
  for (let y = 84; y < 140; y++) for (let x = 100; x < 200; x++) { const d = Math.hypot(x + 0.5 - 150, y + 0.5 - 136); if (y < 136 && d >= 46 && d < 52) t.poser(x, y, 'pierreB', Math.round(Math.atan2(136 - y, x - 150) * 6) % 2 ? 4 : 2); }
  // la herse levée, dents en bas
  for (let y = 90; y < 112; y++) for (let x = 108; x < 192; x++) if (Math.hypot(x + 0.5 - 150, Math.max(0, 136 - y)) < 46 && ((x - 108) % 8 < 2 || (y - 90) % 8 < 2)) t.poser(x, y, 'fer', 2);
  for (let x = 110; x < 192; x += 8) for (let y = 112; y < 117; y++) t.poser(x, y, 'fer', 3);
  // les créneaux du mur
  for (let x = 70; x < 230; x++) if ((x - 70) % 10 < 6) for (let y = 62; y < 70; y++) t.poser(x, y, 'pierreB', 4);
  // les deux tours rondes, leurs toits pointus, leurs meurtrières, leurs bannières
  for (const [x0, x1] of [[20, 80], [220, 280]]) {
    pierresTaille(t, x0, 40, x1, sol, x0 + 7, 'pierreB');
    for (let y = 0; y < 40; y++) for (let x = x0 - 4; x < x1 + 4; x++) if (Math.abs(x + 0.5 - (x0 + x1) / 2) <= y * 0.9) t.poser(x, y, 'ardoise', x < (x0 + x1) / 2 ? 4 : 2);
    for (const y of [70, 120]) for (let yy = y; yy < y + 14; yy++) for (let x = (x0 + x1) / 2 - 2; x < (x0 + x1) / 2 + 2; x++) t.poser(x, yy, 'noirB', 1);
    banniereRoyale(t, (x0 + x1) / 2 - 5, 90, 10, 40);
  }
  // l'écusson au-dessus de l'arche
  banniereRoyale(t, 142, 70, 16, 14);
  t.contour(); t.texture(scene, cle); return cle;
}

// Une maison de l'autre rive, en volume : la façade à pignon face à nous (enduit, colombages, fenêtres encadrées et
// leurs volets, une porte), le mur de côté qui fuit vers la droite dans l'ombre, le toit qui suit (le pan de côté plus
// sombre), une cheminée. `loin` : plus pâle et bleutée (la brume du fleuve).
function maisonLointaine(t, x0, base, w, etages, { loin = false, graine = 1 } = {}) {
  const he = loin ? 7 : 9, haut = base - etages * he, sd = Math.max(3, Math.round(w * 0.4)), monte = Math.round(sd * 0.45);
  const enduit = ['platre', 'pierreB', 'platre', 'ocre', 'platre', 'rose'][graine % 6], toit = graine % 4 === 1 ? 'tuile' : 'ardoise';
  const B = i => Math.min(5, i + (loin ? 1 : 0));
  // les fondations, qui descendent jusqu'à la rive (jamais de maison qui flotte)
  for (let y = base; y < base + 10; y++) for (let x = x0; x < x0 + w + sd; x++) t.poser(x, y, 'pierre', B(1 + (x < x0 + w ? 1 : 0)));
  // le mur de côté (dans l'ombre)
  for (let x = 0; x < sd; x++) { const dy = Math.round(x * monte / sd); for (let y = haut - dy; y < base - dy; y++) t.poser(x0 + w + x, y, enduit, B(1)); }
  // la façade
  for (let y = haut; y < base; y++) for (let x = x0; x < x0 + w; x++) t.poser(x0 + (x - x0), y, enduit, B(3 + (x === x0 ? 1 : 0) - (hachage(x, y, graine) > 0.9 ? 1 : 0)));
  const colombage = enduit === 'platre' || enduit === 'ocre';
  for (let e = 0; e <= etages; e++) { const y = base - e * he - (e ? 0 : 1); for (let x = x0; x < x0 + w; x++) t.poser(x, Math.min(base - 1, y), colombage ? 'cheneSombre' : 'pierreB', colombage ? B(1) : B(2)); }
  if (colombage) for (let y = haut; y < base; y++) { t.poser(x0, y, 'cheneSombre', B(1)); t.poser(x0 + w - 1, y, 'cheneSombre', B(1)); }
  // les fenêtres (deux par étage, cadre clair, carreau sombre ou éclairé), la porte au rez-de-chaussée
  for (let e = 0; e < etages; e++) { const y0 = base - (e + 1) * he + 2;
    for (const fx of [x0 + Math.round(w * 0.22), x0 + Math.round(w * 0.62)]) { if (e === 0 && fx > x0 + w * 0.5) continue;
      const lumiere = hachage(graine, e * 3 + fx, 21) > 0.62;
      for (let y = y0; y < y0 + (loin ? 3 : 4); y++) for (let x = fx; x < fx + (loin ? 2 : 3); x++) t.poser(x, y, lumiere ? 'lueur' : 'verre', lumiere ? 4 : B(1));
      if (!loin) { for (let y = y0; y < y0 + 4; y++) { t.poser(fx - 1, y, 'banniere', 2); t.poser(fx + 3, y, 'banniere', 2); } for (let x = fx - 1; x < fx + 4; x++) t.poser(x, y0 + 4, 'pierre', 4); } } }
  if (!loin) { const px = x0 + Math.round(w * 0.6); for (let y = base - 6; y < base - 1; y++) for (let x = px; x < px + 3; x++) t.poser(x, y, 'cheneSombre', y === base - 6 ? 3 : 2); }
  // le toit : le pignon face à nous, puis le pan de côté qui fuit
  const hp = Math.round(w * 0.6), cx = x0 + w / 2;
  for (let y = haut - hp; y < haut; y++) for (let x = x0 - 1; x < x0 + w + 1; x++) {
    const d = Math.abs(x + 0.5 - cx), lim = (y - (haut - hp)) * (w / 2 + 1) / hp; if (d > lim) continue;
    const bord = d > lim - 1.2; t.poser(x, y, bord ? toit : enduit, bord ? B(x < cx ? 4 : 2) : B(2));   // (le pignon montre son enduit, bordé par le toit)
  }
  if (hp > 5) t.poser(Math.round(cx), haut - Math.round(hp * 0.45), loin ? 'verre' : 'lueur', loin ? B(1) : 3);
  for (let x = 0; x <= sd; x++) { const dy = Math.round(x * monte / sd); for (let j = 0; j <= hp; j++) { const xx = Math.round(cx + j * (w / 2 + 1) / hp) + x, yy = haut - hp + j - dy; t.poser(xx, yy, toit, B(1 + ((j + x) % 3 === 0 ? 1 : 0))); t.poser(xx, yy + 1, toit, B(1)); } }
  // la cheminée sur le pan de côté
  if (hachage(graine, 7, 3) > 0.35) { const chx = Math.round(cx + w * 0.3 + sd * 0.4), chy = haut - Math.round(hp * 0.55) - Math.round(sd * 0.2); for (let y = chy - 4; y < chy + 2; y++) for (let x = chx; x < chx + 2; x++) t.poser(x, y, 'pierre', B(x === chx ? 3 : 1)); }
}

// La Halle des Bateliers (planche 75 v2, refaite) : la maison de la guilde, au bout du lot. Au rez-de-chaussée, une
// arcade de pierre blanche (deux grandes arches ouvertes sur l'entrepôt sombre où l'on devine tonneaux et ballots,
// clés de voûte, lanternes de fer) ; à l'étage, en encorbellement sur des corbeaux, des colombages, une galerie de bois
// à balustres et la bannière du royaume ; un grand toit d'ardoise à deux lucarnes, un clocheton à cloche et sa
// girouette en poisson ; au pignon, la poutre de levage, sa grande roue et la caisse pendue au filet ; l'enseigne
// sculptée (la rame et l'ancre) ; au pied, cordages lovés, tonneaux, sacs.
function dessinerHalle(t, x0, sol) {
  const L = 102, x1 = x0 + L, rdc = sol - 70, etage = rdc - 46, toitH = 40;
  // le soubassement et l'arcade de pierre blanche
  pierresTaille(t, x0, rdc, x1, sol, 91, 'pierreB');
  for (let y = sol - 4; y < sol; y++) for (let x = x0 - 1; x < x1 + 1; x++) t.poser(x, y, 'pierre', y === sol - 4 ? 4 : 2);
  for (const ax of [x0 + 27, x0 + 75]) {
    const r = 19, ys = sol - 4 - 30;   // (le départ de l'arc)
    for (let y = ys - r; y < sol - 4; y++) for (let x = ax - r; x < ax + r; x++) { const d = y < ys ? Math.hypot(x + 0.5 - ax, y + 0.5 - ys) : Math.abs(x + 0.5 - ax);
      if (d < r - 3) t.poser(x, y, 'noirB', 1 + (y > sol - 12 ? 0 : 0)); else if (d < r && y < ys + 2) t.poser(x, y, 'pierreB', Math.round(Math.atan2(ys - y, x - ax) * 5) % 2 ? 4 : 2); }
    for (let y = ys - r - 1; y < ys - r + 5; y++) for (let x = ax - 3; x < ax + 3; x++) t.poser(x, y, 'pierreB', 5);   // (la clé de voûte)
    // dans l'entrepôt : des tonneaux et des ballots dans la pénombre
    for (const [dx, h] of [[-12, 12], [-1, 9], [9, 13]]) for (let y = sol - 4 - h; y < sol - 4; y++) for (let x = ax + dx; x < ax + dx + 8; x++) t.poser(x, y, (y - (sol - 4 - h)) % 5 === 1 ? 'fer' : 'chene', (y - (sol - 4 - h)) % 5 === 1 ? 1 : 1 + (x === ax + dx + 2 ? 1 : 0));
  }
  // les lanternes de fer entre les arches et aux angles
  for (const lx of [x0 + 4, x0 + 51, x1 - 5]) { for (let x = lx - 2; x < lx + 3; x++) t.poser(x, rdc + 14, 'fer', 2); for (let y = rdc + 15; y < rdc + 22; y++) for (let x = lx - 2; x < lx + 2; x++) t.poser(x, y, y === rdc + 15 || y === rdc + 21 ? 'fer' : 'lueur', y === rdc + 15 || y === rdc + 21 ? 2 : 4); }
  // le bandeau sculpté et les corbeaux qui portent l'étage
  for (let x = x0 - 2; x < x1 + 2; x++) for (let y = rdc - 3; y < rdc + 1; y++) t.poser(x, y, 'pierreB', y === rdc - 3 ? 5 : 3);
  for (let cx = x0 + 2; cx < x1; cx += 10) for (let j = 0; j < 5; j++) for (let x = cx; x < cx + 4 - Math.floor(j * 0.6); x++) t.poser(x, rdc - 3 - j, 'cheneSombre', 2);
  // l'étage à colombages, en encorbellement
  const e0 = x0 - 4, e1 = x1 + 4;
  for (let y = etage; y < rdc - 3; y++) for (let x = e0; x < e1; x++) t.poser(x, y, 'platre', 3 + (fbm(x * 0.2, y * 0.2, 93) > 0.66 ? -1 : 0));
  for (let x = e0; x < e1; x++) { t.poser(x, etage, 'cheneSombre', 2); t.poser(x, etage + 1, 'cheneSombre', 1); t.poser(x, rdc - 4, 'cheneSombre', 1); }
  for (let k = 0; k <= 8; k++) { const x = Math.round(e0 + k * (e1 - e0 - 2) / 8); for (let y = etage; y < rdc - 3; y++) { t.poser(x, y, 'cheneSombre', 2); t.poser(x + 1, y, 'cheneSombre', 1); } }
  for (let k = 0; k < 8; k += 2) { const xa = Math.round(e0 + k * (e1 - e0 - 2) / 8), xb = Math.round(e0 + (k + 1) * (e1 - e0 - 2) / 8); for (let j = 0; j <= 12; j++) { t.poser(Math.round(xa + (xb - xa) * j / 12), Math.round(etage + 4 + j * 1.8), 'cheneSombre', 2); t.poser(Math.round(xb - (xb - xa) * j / 12), Math.round(etage + 4 + j * 1.8), 'cheneSombre', 2); } }
  // les fenêtres à petits carreaux, éclairées, et la porte-fenêtre au centre
  for (const fx of [e0 + 14, e1 - 24]) for (let y = etage + 8; y < etage + 24; y++) for (let x = fx; x < fx + 10; x++) { const cadre = x === fx || x === fx + 9 || y === etage + 8 || y === etage + 23 || (x - fx) % 3 === 0 || (y - etage - 8) % 4 === 0; t.poser(x, y, cadre ? 'cheneSombre' : 'lueur', cadre ? 1 : 3 + (x < fx + 4 ? 1 : 0)); }
  const pc = Math.round((e0 + e1) / 2); for (let y = etage + 6; y < rdc - 6; y++) for (let x = pc - 7; x < pc + 7; x++) { const cadre = x === pc - 7 || x === pc + 6 || x === pc || y === etage + 6; t.poser(x, y, cadre ? 'cheneSombre' : 'verre', cadre ? 1 : 2 + (y < etage + 14 ? 1 : 0)); }
  // la galerie de bois à balustres, tout le long de l'étage, et la bannière qui y pend
  for (let x = e0 - 2; x < e1 + 2; x++) { t.poser(x, rdc - 16, 'chene', 4); t.poser(x, rdc - 15, 'chene', 2); t.poser(x, rdc - 5, 'chene', 3); }
  for (let x = e0; x < e1; x += 4) for (let y = rdc - 14; y < rdc - 5; y++) t.poser(x, y, 'chene', y === rdc - 10 ? 4 : 3);
  banniereRoyale(t, pc - 5, rdc - 5, 10, 22);
  // le grand toit d'ardoise, ses deux lucarnes, le clocheton et sa cloche, la girouette en poisson
  const tc = (e0 + e1) / 2;
  for (let y = etage - toitH; y < etage; y++) for (let x = e0 - 4; x < e1 + 4; x++) { const lim = (y - (etage - toitH)) * ((e1 - e0) / 2 + 4) / toitH; if (Math.abs(x + 0.5 - tc) > lim) continue;
    const r = Math.floor((y - etage + toitH) / 3), dec = (r % 2) * 3, j = (x + dec) % 6 === 0 || (y - etage + toitH) % 3 === 2; t.poser(x, y, 'ardoise', j ? 1 : 3 + (x < tc ? 1 : 0) - (hachage(Math.floor((x + dec) / 6), r, 95) > 0.85 ? 1 : 0)); }
  for (let x = e0 - 4; x < e1 + 4; x++) t.poser(x, etage - 1, 'cheneSombre', 2);
  for (const lx of [Math.round(tc - 26), Math.round(tc + 16)]) { for (let y = etage - 20; y < etage - 4; y++) for (let x = lx; x < lx + 10; x++) t.poser(x, y, x === lx || x === lx + 9 ? 'cheneSombre' : y < etage - 15 ? 'cheneSombre' : 'lueur', x === lx || x === lx + 9 ? 1 : y < etage - 15 ? 2 : 3);
    for (let y = etage - 26; y < etage - 19; y++) for (let x = lx - 2; x < lx + 12; x++) if (Math.abs(x + 0.5 - lx - 5) <= (y - etage + 26) * 1.1) t.poser(x, y, 'ardoise', x < lx + 5 ? 4 : 2); }
  const bt = Math.round(tc); for (let y = etage - toitH - 14; y < etage - toitH + 6; y++) for (let x = bt - 6; x < bt + 6; x++) { const ouvert = y > etage - toitH - 10 && y < etage - toitH && Math.abs(x + 0.5 - bt) < 3.5; t.poser(x, y, ouvert ? 'noirB' : 'chene', ouvert ? 1 : x === bt - 6 || x === bt + 5 ? 1 : 3); }
  disqueHD(t, bt, etage - toitH - 5, 2.6, 'laiton', 4);
  for (let y = etage - toitH - 24; y < etage - toitH - 14; y++) for (let x = bt - 8; x < bt + 8; x++) if (Math.abs(x + 0.5 - bt) <= (y - etage + toitH + 24) * 0.8) t.poser(x, y, 'ardoise', x < bt ? 4 : 2);
  for (let y = etage - toitH - 32; y < etage - toitH - 24; y++) t.poser(bt, y, 'fer', 3);
  for (let x = bt - 5; x < bt + 6; x++) { const yy = etage - toitH - 32 + Math.round(Math.abs(x - bt) * 0.3); t.poser(x, yy, 'laiton', 4); } t.poser(bt + 6, etage - toitH - 33, 'laiton', 4); t.poser(bt + 6, etage - toitH - 30, 'laiton', 4);
  // la poutre de levage au pignon, sa grande roue, la corde et la caisse pendue dans son filet
  const pb = etage - 10, px = e1 + 2;
  for (let x = e1 - 6; x < px + 10; x++) for (let y = pb; y < pb + 4; y++) t.poser(x, y, 'cheneSombre', y === pb ? 3 : 2);
  for (let j = 0; j < 9; j++) { t.poser(px + j, pb + 4 + j, 'cheneSombre', 2); t.poser(px + j, pb + 5 + j, 'cheneSombre', 1); }
  for (let a = 0; a < 6.3; a += 0.15) { t.poser(Math.round(px + 5 + Math.cos(a) * 5), Math.round(pb - 3 + Math.sin(a) * 5), 'chene', 4); } for (let a = 0; a < 6.3; a += 0.8) for (let r = 0; r < 5; r++) t.poser(Math.round(px + 5 + Math.cos(a) * r), Math.round(pb - 3 + Math.sin(a) * r), 'chene', 3);
  for (let y = pb + 4; y < rdc + 8; y++) t.poser(px + 9, y, 'toile', 2);
  for (let y = rdc + 8; y < rdc + 20; y++) for (let x = px + 3; x < px + 15; x++) { const filet = (x + y) % 3 === 0 || (x - y) % 3 === 0; t.poser(x, y, filet ? 'toile' : 'chene', filet ? 2 : 4 - (x > px + 12 ? 1 : 0)); }
  // l'enseigne sculptée, pendue à sa potence entre les arches : la rame et l'ancre sur fond bleu, bordée d'or
  const sx = x0 + 58, sy = rdc + 30; for (let x = sx - 10; x < sx + 2; x++) t.poser(x, rdc + 26, 'fer', 2);
  for (let y = sy; y < sy + 16; y++) for (let x = sx - 14; x < sx + 2; x++) t.poser(x, y, x === sx - 14 || x === sx + 1 || y === sy || y === sy + 15 ? 'or' : 'bleuRoi', x === sx - 14 || x === sx + 1 || y === sy || y === sy + 15 ? 4 : 3);
  segmentHD(t, [sx - 12, sy + 13], [sx, sy + 2], 1, 'chene'); for (let y = sy + 3; y < sy + 12; y++) t.poser(sx - 6, y, 'fer', 4); for (let x = sx - 9; x < sx - 2; x++) t.poser(x, sy + 11 - Math.round(Math.abs(x - sx + 6) * 0.5), 'fer', 4); disqueHD(t, sx - 6, sy + 3, 1.2, 'fer', 4);
  // au pied de la Halle : un cordage lové, des tonneaux, des sacs
  for (let a = 0; a < 6.3 * 3; a += 0.2) t.poser(Math.round(x0 + 8 + Math.cos(a) * (2 + a * 0.25)), Math.round(sol - 7 + Math.sin(a) * (1 + a * 0.08)), 'toile', 2 + Math.round(a) % 2);
  for (const bx of [x1 - 14, x1 - 6]) for (let y = sol - 16; y < sol - 4; y++) for (let x = bx; x < bx + 7; x++) t.poser(x, y, (y - sol + 16) % 5 === 1 ? 'fer' : 'chene', (y - sol + 16) % 5 === 1 ? 3 : 3 + (x === bx + 2 ? 1 : 0) - (x === bx + 6 ? 1 : 0));
}

function rampesMaisons(t) {
  rampesVille(t);
  const R = { pierreB: 0xd8d2c4, pierreG: 0x98a0ac, pierreS: 0x8e8678, ardoise: 0x3a4250, ocre: 0xd29a52, rose: 0xd88c7a, bois: 0x7a4e2a, boisN: 0x3a2a22,
    goudron: 0x3a322c, verre: 0x3e5e7e, lueur: 0xf0c050, or: 0xd8b048, fer: 0x45454e, rouge: 0x9a2424, vert: 0x3a6a4a, bleu: 0x2a4a8a, sarcelle: 0x2e7a7a,
    feuille: 0x5a8a3a, fleur: 0xd04a5a, terre: 0xb0603a, noirM: 0x22222c, toile: 0xeadfc4, argent: 0xdadee6, zinc: 0x7a8490, cuir: 0x6a3a1a };
  for (const k in R) t.rampes[k] = rampe(R[k]);
  t.rampes.tuileR = [0x3a140c, 0x5e2214, 0x86341e, 0xa8482a, 0xc8663e, 0xe08a5a];
}
const MPR = {
  rect(t, x0, y0, x1, y1, m, i) { x0 = Math.round(x0); x1 = Math.round(x1); y0 = Math.round(y0); y1 = Math.round(y1); for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) t.poser(x, y, m, typeof i === 'function' ? i(x, y) : i); },
  // des pierres de taille en assises (rh : hauteur d'une assise, rw : longueur d'un bloc)
  assises(t, x0, y0, x1, y1, m, g, rh = 6, rw = 14) { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const r = Math.floor((y - y0) / rh), dec = (r % 2) * (rw >> 1), b = Math.floor((x - x0 + dec) / rw), jy = (y - y0) % rh;
    const joint = jy === rh - 1 || (x - x0 + dec) % rw === 0; t.poser(x, y, m, joint ? 1 : Math.min(5, (jy === 0 ? 4 : 3) - (hachage(b, r, g) > 0.78 ? 1 : 0) + (fbm(x * 0.3, y * 0.3, g) > 0.74 ? 1 : 0))); } },
  // un enduit lisse, un peu nuagé
  crepi(t, x0, y0, x1, y1, m, g) { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) t.poser(x, y, m, 3 + (fbm(x * 0.15, y * 0.15, g) > 0.62 ? -1 : 0) + (hachage(x, y, g) > 0.95 ? 1 : 0)); },
  // une baie en plein cintre : (x, y) le haut de l'arc, w la largeur, h la hauteur totale ; vitres claires ou éclairées
  baie(t, x, y, w, h, { lueur = false, cadre = 'pierreB', bord = 2, meneau = 'boisN', carreaux = true } = {}) {
    const r = w / 2, cx = x + r, ys = y + r;
    for (let yy = y - bord; yy < y + h + bord; yy++) for (let xx = x - bord; xx < x + w + bord; xx++) {
      const dx = xx + 0.5 - cx, haut = yy + 0.5 < ys, d = haut ? Math.hypot(dx, yy + 0.5 - ys) : Math.abs(dx);
      const dedans = d < r && yy < y + h, autour = d < r + bord;
      if (dedans) { const mn = carreaux && (Math.abs(dx) < 0.6 || (!haut && (yy - Math.round(ys)) % 7 === 6));
        t.poser(xx, yy, mn ? meneau : lueur ? 'lueur' : 'verre', mn ? 1 : lueur ? 3 + (dx < 0 && yy < ys + 5 ? 1 : 0) : 2 + (dx < -r * 0.3 && yy < ys + 6 ? 2 : 0)); }
      else if (autour) t.poser(xx, yy, cadre, haut && dx < 0 ? 4 : yy >= y + h ? 2 : 3);
    } },
  // une fenêtre droite à quatre carreaux, son cadre et son appui
  fenetre(t, x, y, w, h, { lueur = false, cadre = 'pierreB', meneau = 'boisN', appui = true } = {}) {
    for (let yy = y - 2; yy < y + h + (appui ? 3 : 2); yy++) for (let xx = x - 2; xx < x + w + 2; xx++) { const dedans = xx >= x && xx < x + w && yy >= y && yy < y + h;
      if (!dedans) { t.poser(xx, yy, cadre, yy < y ? 4 : yy >= y + h ? (yy === y + h + 2 ? 1 : 3) : 3); continue; }
      const mn = xx === x + (w >> 1) || yy === y + (h >> 1); t.poser(xx, yy, mn ? meneau : lueur ? 'lueur' : 'verre', mn ? 1 : lueur ? 3 + (xx < x + 3 ? 1 : 0) : 2 + (xx < x + 3 && yy < y + 4 ? 2 : 0)); } },
  // une porte de planches : cintrée ou droite, deux pentures de fer, l'anneau de laiton
  porte(t, x, y, w, h, m, { arc = true, clous = true } = {}) { const r = w / 2, cx = x + r, ys = y + (arc ? r : 0);
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) { if (arc && yy + 0.5 < ys && Math.hypot(xx + 0.5 - cx, yy + 0.5 - ys) > r) continue;
      const pl = (xx - x) % 6 === 0, bande = Math.abs(yy - Math.round(y + h * 0.32)) < 1 || Math.abs(yy - Math.round(y + h * 0.78)) < 1;
      t.poser(xx, yy, bande ? 'fer' : m, bande ? 2 : pl ? 1 : 3 + ((xx - x) % 6 === 1 ? 1 : 0) - (yy > y + h - 3 ? 1 : 0)); }
    if (clous) for (const yy of [Math.round(y + h * 0.32), Math.round(y + h * 0.78)]) for (let xx = x + 3; xx < x + w - 2; xx += 6) t.poser(xx, yy, 'fer', 4);
    disqueHD(t, x + w - 6, y + h * 0.56, 1.7, 'or', 4); },
  // l'arc de pierre autour d'une porte cintrée (claveaux, clé)
  archivolte(t, x, y, w, ep = 4, m = 'pierreB', h = 0) { const r = w / 2, cx = x + r, ys = y + r;
    for (let yy = y - ep; yy < ys + 1; yy++) for (let xx = x - ep; xx < x + w + ep; xx++) { const d = Math.hypot(xx + 0.5 - cx, yy + 0.5 - ys); if (d < r || d >= r + ep) continue;
      const a = Math.atan2(ys - yy - 0.5, xx + 0.5 - cx), cl = Math.floor(a / Math.PI * 9); t.poser(xx, yy, m, (Math.abs(a - Math.floor(a / Math.PI * 9 + 0.5) * Math.PI / 9) < 0.05) ? 1 : 3 + (cl % 2) + (xx < cx ? 0 : -1)); }
    MPR.rect(t, Math.round(cx) - 3, y - ep - 1, Math.round(cx) + 3, y + 2, m, 5);
    if (h) for (const xx of [x - ep, x + w]) MPR.rect(t, xx, ys, xx + ep, ys + h, m, (X, Y) => (Y - ys) % 8 === 7 ? 1 : X === xx ? 4 : 3); },
  // la vitrine-comptoir (FACADE.fenetre) : de la lumière, deux étagères garnies, un appui de bois
  vitrine(t, cadre = 'boisN', { linteau = null } = {}) { const [x, y, w, h] = FACADE.fenetre;
    for (let yy = y - 3; yy < y + h + 3; yy++) for (let xx = x - 3; xx < x + w + 3; xx++) { const bord = xx < x || xx >= x + w || yy < y || yy >= y + h;
      if (bord) { t.poser(xx, yy, cadre, yy < y ? 4 : xx < x ? 3 : 2); continue; }
      const mn = (xx - x) % 16 === 15; t.poser(xx, yy, mn ? cadre : 'lueur', mn ? 1 : 2 + (yy < y + h * 0.55 ? 1 : 0) + (xx < x + 12 ? 1 : 0)); }
    for (const ey of [y + 13, y + 26]) { MPR.rect(t, x, ey, x + w, ey + 2, 'bois', 2);
      for (let k = 0; k < 9; k++) { const bx = x + 3 + k * 7, m = ['rouge', 'vert', 'bleu', 'or', 'fer', 'cuir'][Math.floor(hachage(k, ey, 5) * 6)], hh = 4 + Math.floor(hachage(k, ey, 6) * 5);
        if ((bx - x) % 16 > 13) continue; MPR.rect(t, bx, ey - hh, bx + 3, ey, m, (X, Y) => X === bx ? 4 : 2); t.poser(bx + 1, ey - hh - 1, m, 4); } }
    MPR.rect(t, x - 6, y + h + 3, x + w + 6, y + h + 8, 'bois', (X, Y) => Y === y + h + 3 ? 4 : Y === y + h + 7 ? 1 : 3);
    if (linteau) { MPR.rect(t, x - 5, y - 8, x + w + 5, y - 3, linteau, (X, Y) => Y === y - 8 ? 5 : (X - x + 5) % 9 === 0 ? 1 : 3); MPR.rect(t, x + w / 2 - 3, y - 10, x + w / 2 + 3, y - 2, linteau, 5); } },
  enseigneFer(t) { const [ex, ey] = FACADE.enseigne; for (let x = ex - 6; x < ex + 26; x++) t.poser(x, ey, 'fer', x % 3 ? 3 : 1); for (let k = 0; k < 10; k++) t.poser(ex + 18 - k, ey + k, 'fer', 2); },
  ardoise(t, x, y, m, i0, g) { const r = Math.floor(y / 3), dec = (r % 2) * 3, j = (x + dec) % 6 === 0 || y % 3 === 2; t.poser(x, y, m, j ? 1 : Math.max(0, i0 - (hachage(Math.floor((x + dec) / 6), r, g) > 0.85 ? 1 : 0))); },
  tuiles(t, x, y, i0, g) { const r = Math.floor(y / 4), dec = (r % 2) * 3, rond = (x + dec) % 6; t.poser(x, y, 'tuileR', y % 4 === 3 ? 1 : Math.max(0, i0 + (rond < 2 ? 1 : rond > 4 ? -1 : 0) - (hachage(Math.floor((x + dec) / 6), r, g) > 0.88 ? 1 : 0))); },
  lanterne(t, x, y) { MPR.rect(t, x - 1, y - 6, x + 1, y, 'fer', 2); MPR.rect(t, x - 3, y, x + 3, y + 2, 'fer', 3); MPR.rect(t, x - 3, y + 2, x + 3, y + 9, 'lueur', (X) => X === x - 3 || X === x + 2 ? 2 : 4); MPR.rect(t, x - 3, y + 9, x + 3, y + 11, 'fer', 2); },
  pot(t, x, y, w = 8) { MPR.rect(t, x, y, x + w, y + 6, 'terre', (X) => X === x ? 4 : X === x + w - 1 ? 2 : 3); for (let k = 0; k < w + 4; k++) { const hh = 3 + Math.floor(hachage(x, k, 3) * 5); for (let j = 0; j < hh; j++) t.poser(x - 2 + k, y - 1 - j, 'feuille', 2 + (j > hh - 2 ? 2 : 0)); if (hachage(k, x, 8) > 0.7) t.poser(x - 2 + k, y - hh - 1, 'fleur', 4); } },
};

// 1. La Tour Blanche (le style de la garde, façon cité de pierre) : la pierre blanche en grandes assises, des
// créneaux sur le toit plat, une tourelle ronde à poivrière d'ardoise et sa bannière, trois hautes baies cintrées
// au-dessus d'un balcon de pierre, la porte cintrée sous sa clé, des meurtrières dans la tour
function maisonTourBlanche(t) {
  const sol = 176;
  MPR.assises(t, 14, 48, 164, sol - 8, 'pierreB', 11, 7, 16);
  MPR.assises(t, 12, sol - 8, 166, sol, 'pierreG', 12, 4, 10);
  // le chemin de ronde : un bandeau sur ses corbeaux, puis les merlons
  MPR.rect(t, 10, 40, 168, 48, 'pierreB', (x, y) => y === 40 ? 5 : y === 47 ? 1 : 3);
  for (let x = 14; x < 164; x += 6) MPR.rect(t, x, 48, x + 3, 52, 'pierreB', (X, Y) => Y === 51 ? 1 : 2);
  for (let x = 10; x < 162; x += 12) MPR.rect(t, x, 28, x + 8, 40, 'pierreB', (X, Y) => Y === 28 ? 5 : X === x + 7 ? 2 : 4);
  // la cheminée, sur le toit plat
  MPR.assises(t, 138, 12, 152, 28, 'pierreB', 13, 4, 7); MPR.rect(t, 136, 10, 154, 13, 'pierreB', 5);
  // la tourelle ronde, à droite
  const tx0 = 162, tx1 = 196, tcx = (tx0 + tx1) / 2, tr = (tx1 - tx0) / 2;
  const col = x => Math.floor((Math.asin(Math.max(-1, Math.min(1, (x + 0.5 - tcx) / tr))) / Math.PI + 0.5) * 7);
  for (let y = 26; y < sol; y++) for (let x = tx0; x < tx1; x++) { const u = (x + 0.5 - tcx) / tr, r = Math.floor(y / 6), c0 = col(x + (r % 2) * 2), c1 = col(x - 1 + (r % 2) * 2);
    const joint = y % 6 === 5 || (c0 !== c1 && x > tx0), sh = Math.round(3.6 - u * 1.4 - Math.pow(Math.abs(u), 3) * 1.4);
    t.poser(x, y, y >= sol - 8 ? 'pierreG' : 'pierreB', joint ? Math.max(0, sh - 2) : Math.max(1, Math.min(5, sh))); }
  for (let y = 22; y < 28; y++) for (let x = tx0 - 2; x < tx1 + 2; x++) t.poser(x, y, 'pierreB', y === 22 ? 5 : 2);
  for (let y = 0; y < 22; y++) for (let x = tx0 - 3; x < tx1 + 3; x++) { const lim = (y + 1) * (tr + 3) / 22; if (Math.abs(x + 0.5 - tcx) > lim) continue; MPR.ardoise(t, x, y, 'ardoise', x < tcx - lim * 0.3 ? 4 : x > tcx + lim * 0.4 ? 2 : 3, 17); }
  t.poser(Math.round(tcx), 0, 'or', 5); t.poser(Math.round(tcx) - 1, 1, 'or', 4); t.poser(Math.round(tcx), 1, 'or', 4);
  for (const my of [64, 132]) { MPR.rect(t, Math.round(tcx) - 3, my - 2, Math.round(tcx) + 3, my + 14, 'pierreB', 5); MPR.rect(t, Math.round(tcx) - 1, my, Math.round(tcx) + 1, my + 12, 'noirM', 1); }
  banniereRoyale(t, 172, 88, 14, 30);
  // l'étage : trois hautes baies cintrées et le balcon de pierre sur ses consoles
  for (const [bx, l] of [[26, false], [66, true], [104, false]]) MPR.baie(t, bx, 58, 18, 38, { lueur: l });
  MPR.rect(t, 18, 96, 132, 100, 'pierreB', (x, y) => y === 96 ? 5 : 2);
  for (let x = 22; x < 130; x += 4) MPR.rect(t, x, 88, x + 2, 96, 'pierreB', (X, Y) => X === x ? 4 : 2);
  MPR.rect(t, 18, 86, 132, 88, 'pierreB', 5);
  for (const cx of [24, 50, 76, 102, 126]) for (let j = 0; j < 5; j++) MPR.rect(t, cx - 2 + j * 0.4, 100 + j, cx + 3 - j * 0.4, 101 + j, 'pierreB', 2);
  // le grand bandeau mouluré entre l'étage et la boutique
  MPR.rect(t, 12, 108, 166, 112, 'pierreB', (x, y) => y === 108 ? 5 : y === 111 ? 1 : 3);
  // la boutique : la vitrine sous un linteau à clé, la porte cintrée dans son arc
  MPR.vitrine(t, 'pierreB', { linteau: 'pierreB' });
  const [px, py, pl, ph] = FACADE.porte; MPR.porte(t, px, py - 4, pl, ph + 4, 'rouge'); MPR.archivolte(t, px, py - 4, pl, 4, 'pierreB', 30);
  for (let j = -2; j <= 2; j++) { t.poser(px + pl / 2 + j, py - 12, 'argent', 5); } t.poser(px + pl / 2, py - 13, 'argent', 5);
  MPR.enseigneFer(t);
}

// 2. La Maison du Pont (les échoppes accrochées au pont) : la boutique de pierre au rez-de-chaussée, puis deux étages
// d'enduit ocre qui débordent au-dessus de la rue sur de grosses consoles de bois ; des volets verts, des jardinières
// fleuries, un toit de tuiles presque plat aux larges avant-toits sur chevrons, la cheminée coiffée de son petit toit
function maisonDuPont(t) {
  const sol = 176;
  MPR.assises(t, 18, 112, 182, sol, 'pierreS', 21, 6, 12);
  // les grosses consoles de bois qui portent les étages
  MPR.rect(t, 6, 100, 194, 106, 'bois', (x, y) => y === 100 ? 4 : y === 105 ? 1 : 3);
  for (const cx of [10, 40, 70, 100, 130, 160, 190]) for (let j = 0; j < 12; j++) { const w = Math.max(2, 6 - Math.floor(j / 2)); MPR.rect(t, cx - (w >> 1), 106 + j, cx - (w >> 1) + w, 107 + j, 'bois', (X) => X === cx - (w >> 1) ? 4 : 2); }
  // les étages d'enduit ocre, le cordon de pierre entre les deux
  MPR.crepi(t, 6, 42, 194, 100, 'ocre', 23);
  MPR.rect(t, 6, 70, 194, 73, 'pierreB', (x, y) => y === 70 ? 5 : 2);
  for (const fy of [48, 78]) for (const fx of [20, 62, 112, 154]) {
    MPR.fenetre(t, fx, fy, 12, 16, { lueur: hachage(fx, fy, 3) > 0.55, cadre: 'pierreB' });
    for (const [sx, sens] of [[fx - 9, -1], [fx + 14, 1]]) MPR.rect(t, sx, fy - 1, sx + 7, fy + 17, 'vert', (X, Y) => (Y - fy) % 4 === 3 ? 1 : X === sx || X === sx + 6 ? 2 : 3);
    if (fy === 78) { MPR.rect(t, fx - 2, fy + 19, fx + 14, fy + 23, 'bois', 2); for (let k = 0; k < 16; k++) { const hh = 2 + Math.floor(hachage(fx, k, 4) * 3); for (let j = 0; j < hh; j++) t.poser(fx - 2 + k, fy + 18 - j, j === hh - 1 && k % 3 === 1 ? 'fleur' : 'feuille', j === hh - 1 && k % 3 === 1 ? 4 : 3); } }
  }
  // le toit de tuiles presque plat, ses avant-toits et les bouts de chevrons
  for (let y = 22; y < 40; y++) { const d = Math.round((40 - y) * 2.2); for (let x = 0 + d; x < 200 - d; x++) MPR.tuiles(t, x, y, x < 60 ? 4 : 3, 29); }
  MPR.rect(t, 0, 38, 200, 40, 'tuileR', 2);
  for (let x = 2; x < 198; x += 7) MPR.rect(t, x, 40, x + 3, 44, 'bois', (X, Y) => Y === 43 ? 1 : 3);
  MPR.rect(t, 6, 40, 194, 42, 'boisN', 1);
  // la cheminée et son petit toit
  MPR.crepi(t, 150, 6, 162, 30, 'ocre', 31); for (let y = 0; y < 7; y++) for (let x = 146 - Math.floor(y / 2); x < 166 + Math.floor(y / 2); x++) MPR.tuiles(t, x, y, 3, 33);
  MPR.rect(t, 152, 7, 160, 10, 'noirM', 1);
  // la boutique : une vitrine dans son cadre de bois, l'étal qu'on rabat le matin, la porte de planches
  MPR.vitrine(t, 'boisN');
  MPR.rect(t, 22, 166, 98, 170, 'bois', (x, y) => y === 166 ? 4 : 2); for (const x of [26, 92]) MPR.rect(t, x, 170, x + 2, 176, 'boisN', 1);
  const [px, py, pl, ph] = FACADE.porte; MPR.porte(t, px, py, pl, ph, 'vert', { arc: false }); MPR.rect(t, px - 3, py - 4, px + pl + 3, py, 'pierreB', (x, y) => y === py - 4 ? 5 : 3);
  MPR.lanterne(t, 112, 116); MPR.lanterne(t, 170, 116);
  MPR.enseigneFer(t);
}

// 3. La Maison des Pêcheurs (le bourg des bateliers sur pilotis) : des planches goudronnées, un grand pignon pointu
// dont les rives sculptées se croisent en deux têtes de poisson, un oculus à rayons, une galerie de bois à l'étage
// avec ses lanternes, les encadrements peints en vert d'eau, le volet de l'étal relevé en auvent, un filet qui sèche
function maisonDesPecheurs(t) {
  const sol = 176;
  MPR.assises(t, 14, sol - 8, 186, sol, 'pierreS', 41, 4, 10);
  for (let y = 56; y < sol - 8; y++) for (let x = 16; x < 184; x++) { const pl = Math.floor((y - 56) / 5), seam = (y - 56) % 5 === 4, clou = (x + pl * 7) % 23 === 0 && (y - 56) % 5 === 2;
    t.poser(x, y, 'goudron', seam ? 0 : clou ? 4 : 2 + (fbm(x * 0.08, pl, 43) > 0.6 ? 1 : 0)); }
  for (const x of [14, 182]) MPR.rect(t, x, 54, x + 4, sol - 8, 'boisN', (X) => X === x ? 3 : 1);
  // le grand pignon : planches verticales, l'oculus, les rives peintes qui se croisent en têtes de poisson
  const cx = 100, base = 58, sommet = 6;
  for (let y = sommet; y < base; y++) { const lim = (y - sommet) * 96 / (base - sommet); for (let x = cx - lim; x < cx + lim; x++) { const xx = Math.round(x); t.poser(xx, y, 'goudron', (xx - cx + 200) % 6 === 0 ? 0 : 2 + (xx < cx ? 1 : 0)); } }
  for (let a = 0; a < 6.3; a += 0.02) for (let r = 0; r < 9; r++) { const x = Math.round(cx + Math.cos(a) * r), y = Math.round(32 + Math.sin(a) * r); t.poser(x, y, r > 7 ? 'sarcelle' : (Math.round(a * 8 / Math.PI) % 2 && r > 1) ? 'lueur' : 'boisN', r > 7 ? 4 : 3); }
  for (const s of [-1, 1]) for (let j = -4; j < 104; j++) { const x = Math.round(cx + s * j * 96 / (base - sommet) * 0.5), y = sommet + Math.round(j * 0.5); for (let e = 0; e < 5; e++) t.poser(x, y + e, 'sarcelle', e === 0 ? 4 : e === 4 ? 1 : (j % 6 === 0 ? 2 : 3)); }
  for (const s of [-1, 1]) { const hx = cx - s * 10; MPR.rect(t, Math.min(hx, hx + s * 8), 0, Math.max(hx, hx + s * 8), 4, 'sarcelle', 3); t.poser(hx + s * 6, 1, 'noirM', 1); for (let k = 0; k < 4; k++) t.poser(hx + s * (9 + k), k, 'sarcelle', 2); }
  // la cheminée de pierre qui perce le pan
  MPR.assises(t, 150, 12, 162, 40, 'pierreS', 47, 4, 6);
  // la galerie de l'étage, ses balustres, ses lanternes ; les fenêtres de l'étage
  for (const fx of [30, 86, 142]) { MPR.fenetre(t, fx, 66, 16, 20, { lueur: fx !== 86, cadre: 'sarcelle', meneau: 'boisN', appui: false }); }
  MPR.rect(t, 8, 96, 192, 100, 'bois', (x, y) => y === 96 ? 4 : 2);
  MPR.rect(t, 8, 86, 192, 88, 'bois', 4);
  for (let x = 10; x < 192; x += 5) MPR.rect(t, x, 88, x + 2, 96, 'bois', (X) => X === x ? 3 : 2);
  for (const x of [12, 100, 188]) for (let y = 100; y < 106; y++) MPR.rect(t, x - 1, y, x + 1, y + 1, 'boisN', 1);
  MPR.lanterne(t, 22, 106); MPR.lanterne(t, 178, 106);
  // l'étal : le volet relevé en auvent sur ses deux béquilles, la vitrine
  MPR.vitrine(t, 'sarcelle');
  for (let y = 104; y < 113; y++) MPR.rect(t, 22 - (y - 104), y, 98 + (y - 104), y + 1, 'bois', (x) => (x + 200) % 6 === 0 ? 1 : y === 112 ? 2 : 3);
  segmentHD(t, [26, 128], [18, 112], 0.6, 'boisN'); segmentHD(t, [94, 128], [102, 112], 0.6, 'boisN');
  // la porte peinte, le filet qui sèche et deux rames croisées
  const [px, py, pl, ph] = FACADE.porte; MPR.porte(t, px, py, pl, ph, 'sarcelle', { arc: false });
  MPR.rect(t, px - 3, py - 5, px + pl + 3, py, 'boisN', (x, y) => y === py - 5 ? 3 : 1);
  for (let y = 120; y < 152; y++) for (let x = 162; x < 182; x++) if ((x + y) % 4 === 0 || (x - y + 400) % 4 === 0) t.poser(x, y + Math.round(Math.sin((x - 162) / 20 * Math.PI) * 3), 'toile', 3);
  segmentHD(t, [104, 122], [118, 160], 0.7, 'bois'); segmentHD(t, [118, 122], [104, 160], 0.7, 'bois');
  MPR.rect(t, 101, 156, 107, 166, 'bois', 4); MPR.rect(t, 115, 156, 121, 166, 'bois', 4);
  MPR.enseigneFer(t);
}

// 5. La Maison à Loggia (les maisons des quais, côté soleil) : un enduit rose, une arcade au rez-de-chaussée (la
// vitrine et la porte à l'abri sous les arcs), une loggia à colonnettes à l'étage, et sur le toit plat une terrasse à
// balustres, une treille de bois couverte de vigne, des pots de fleurs, et le petit belvédère à toit de tuiles
function maisonALoggia(t) {
  const sol = 176;
  MPR.crepi(t, 12, 56, 188, sol, 'rose', 61);
  // l'arcade du rez-de-chaussée : le fond dans l'ombre, les piliers et les arcs de pierre
  MPR.rect(t, 26, 108, 174, sol, 'pierreS', (x, y) => 1 + (fbm(x * 0.1, y * 0.1, 63) > 0.6 ? 1 : 0) + (y > sol - 30 ? 1 : 0));   // (le fond de l'arcade, dans l'ombre)
  MPR.vitrine(t, 'boisN'); const [px, py, pl, ph] = FACADE.porte; MPR.porte(t, px, py, pl, ph, 'boisN', { arc: true });
  for (const [ax, aw] of [[26, 70], [104, 70]]) { const r = aw / 2, cx = ax + r, ys = 148;
    for (let y = 104; y < ys; y++) for (let x = ax; x < ax + aw; x++) { const d = Math.hypot(x + 0.5 - cx, y + 0.5 - ys); if (d < r) continue; if (d < r + 5) t.poser(x, y, 'pierreB', 3 + (Math.floor(Math.atan2(ys - y, x - cx) * 6) % 2)); else t.poser(x, y, 'rose', 3); } }
  for (const x of [18, 96, 174]) { MPR.rect(t, x, 104, x + 8, sol, 'pierreB', (X, Y) => X === x ? 5 : X === x + 7 ? 2 : (Y - 104) % 9 === 8 ? 2 : 4); MPR.rect(t, x - 2, 140, x + 10, 144, 'pierreB', (X, Y) => Y === 140 ? 5 : 2); }
  MPR.rect(t, 14, 100, 186, 104, 'pierreB', (x, y) => y === 100 ? 5 : 2);
  // la loggia de l'étage : cinq petits arcs sur colonnettes, la balustrade, des plantes qui pendent
  MPR.rect(t, 22, 62, 178, 96, 'noirM', (x, y) => 1 + (y > 84 ? 1 : 0));
  for (let k = 0; k < 5; k++) { const ax = 22 + k * 31.2, r = 15.6, cx = ax + r, ys = 76;
    for (let y = 60; y < ys; y++) for (let x = Math.floor(ax); x < Math.ceil(ax + 2 * r); x++) { const d = Math.hypot(x + 0.5 - cx, y + 0.5 - ys); if (d < r - 1) continue; t.poser(x, y, d < r + 2 ? 'pierreB' : 'rose', d < r + 2 ? 4 : 3); }
    if (k % 2 === 0) for (let j = 0; j < 9; j++) t.poser(Math.round(cx) + (j % 3) - 1, 64 + j, 'feuille', 3 + (j % 2)); }
  for (let k = 0; k <= 5; k++) { const x = Math.round(22 + k * 31.2) - 1; MPR.rect(t, x - 1, 62, x + 3, 96, 'pierreB', (X) => X === x - 1 ? 5 : X === x + 2 ? 2 : 4); MPR.rect(t, x - 2, 74, x + 4, 77, 'pierreB', 5); }
  MPR.rect(t, 18, 86, 182, 88, 'pierreB', 5); for (let x = 20; x < 182; x += 4) MPR.rect(t, x, 88, x + 2, 96, 'pierreB', (X) => X === x ? 4 : 2); MPR.rect(t, 18, 96, 182, 98, 'pierreB', 2);
  // le toit plat : la balustrade de la terrasse, la treille et sa vigne, les pots
  MPR.rect(t, 10, 50, 190, 56, 'pierreB', (x, y) => y === 50 ? 5 : y === 55 ? 1 : 3);
  for (let x = 12; x < 140; x += 4) MPR.rect(t, x, 42, x + 2, 50, 'pierreB', (X) => X === x ? 4 : 2); MPR.rect(t, 10, 40, 140, 42, 'pierreB', 5);
  for (const x of [20, 62, 104]) MPR.rect(t, x, 16, x + 3, 40, 'bois', (X) => X === x ? 4 : 2);
  MPR.rect(t, 14, 14, 140, 18, 'bois', (x, y) => y === 14 ? 4 : 2);
  for (let x = 14; x < 140; x++) { const hh = 2 + Math.floor(fbm(x * 0.2, 1, 65) * 7); for (let j = 0; j < hh; j++) t.poser(x, 18 + j, 'feuille', 2 + ((x + j) % 3 === 0 ? 2 : 0)); if (hachage(x, 2, 66) > 0.86) { t.poser(x, 18 + hh, 'rouge', 3); t.poser(x, 19 + hh, 'rouge', 2); } }
  MPR.pot(t, 34, 34); MPR.pot(t, 80, 34, 10); MPR.pot(t, 120, 34);
  // le belvédère, à droite, et son toit de tuiles en pavillon (la cheminée le perce)
  MPR.crepi(t, 140, 14, 186, 50, 'rose', 67); MPR.baie(t, 154, 22, 18, 24, { lueur: true, cadre: 'pierreB' });
  for (let y = 2; y < 14; y++) { const d = Math.round((14 - y) * 1.9); for (let x = 136 + d; x < 190 - d; x++) MPR.tuiles(t, x, y, x < 163 ? 4 : 3, 69); }
  MPR.rect(t, 136, 13, 190, 15, 'tuileR', 2);
  MPR.crepi(t, 152, 0, 160, 8, 'rose', 71); MPR.rect(t, 151, 0, 161, 2, 'pierreB', 5);
  MPR.enseigneFer(t);
}



// Les quatre styles de maison de Pont-Royal retenus par le joueur, à la taille de la façade du jeu (porte, vitrine et
// enseigne à leur place) : on les achète chez l'architecte de la ville, et on les garde ensuite partout.
const STYLES_PONT_ROYAL = {
  tourBlanche: { nom: 'La Tour Blanche', dessin: maisonTourBlanche, prix: 6000, texte: "Grandes assises de pierre blanche, créneaux, tourelle à poivrière et sa bannière, trois hautes baies au-dessus d'un balcon de pierre." },
  maisonPont: { nom: 'La Maison du Pont', dessin: maisonDuPont, prix: 4500, texte: "La boutique de pierre, puis deux étages d'enduit ocre qui débordent sur de grosses consoles, volets verts et jardinières." },
  pecheurs: { nom: 'La Maison des Pêcheurs', dessin: maisonDesPecheurs, prix: 3500, texte: "Planches goudronnées, grand pignon aux rives en têtes de poisson, galerie et lanternes, le filet qui sèche." },
  loggia: { nom: 'La Maison à Loggia', dessin: maisonALoggia, prix: 5000, texte: "Enduit rose, arcade, loggia à colonnettes, terrasse à balustres sous la treille, petit belvédère de tuiles." },
};
const ORDRE_STYLES_PONT_ROYAL = ['tourBlanche', 'maisonPont', 'pecheurs', 'loggia'];
function maisonStylePR(s, id) { const cle = 'maisonPR_' + id; if (s.textures.exists(cle)) return cle;
  const t = toileDecor(FACADE.L, FACADE.H); rampesMaisons(t); STYLES_PONT_ROYAL[id].dessin(t); t.contour(); t.texture(s, cle); return cle; }

// --- La maison sur la route du grand voyage ---
// la maison sur ses quatre pattes, dans la campagne ; fumee : 'epaisse', 'normale', 'maigre', 'aucune' ; pose : 'marche', 'debout', 'assise'
function maisonEnRoute(s, cx, sol, { fumee = 'normale', pose = 'marche', filet = 12, poseChat = 'assis0' } = {}) {
  const haut = pose === 'assise' ? sol + 6 : sol - 142;
  if (pose === 'assise') {
    // posée à même le sol : une ombre écrasée dessous, les pattes repliées couchées de chaque côté, le filet vide par terre
    const om = s.add.graphics(); om.fillStyle(0x2a1a0a, 0.35).fillEllipse(cx, sol + 8, 560, 26);
    // les pattes repliées : la hanche vissée au bas du mur (un peu derrière le coin), le genou relevé, le pied à plat
    const lf = 166;   // (la moitié du mur de la chaumière, sans le débord du toit)
    const f = dessinerFacade(s, cx, haut, undefined, undefined, { fumee: false }); f.tonneaux.setVisible(false);
    [[cx - lf + 4, true], [cx + lf - 4, false]].forEach(([x, fl]) => s.add.image(x, sol + 6, patteMaisonHD(s, 'repliee', 'chene')).setOrigin(fl ? 1 : 0, 1).setScale(1.75).setFlipX(fl));   // (la plaque vissée sur le coin du mur)
    f.enseigne.setDepth(1);   // (l'enseigne pend devant la patte)
    const nu = s.add.graphics(); for (let k = 0; k < 9; k++) nu.fillStyle(0xd8c098, 0.5).fillCircle(cx - 230 + k * 58, sol + 6 - (k % 2) * 3, 9 + (k % 3) * 3);   // (la poussière de la chute)
    if (filet !== null) s.add.image(cx + 250, sol + 16, filetBoisHD(s, filet)).setOrigin(0.5, 1).setScale(1.05).setAngle(4);
    fumer(s, f, fumee); chatSur(s, cx, haut, poseChat); return f;
  }
  const leve = pose === 'marche';
  s.add.image(cx - 50, sol - 10, patteMaisonHD(s, 'debout', 'chene')).setOrigin(0.5, 1).setScale(1.68).setTint(0x7a6a5e);
  s.add.image(cx + 170, sol - (leve ? 24 : 10), patteMaisonHD(s, leve ? 'pas' : 'debout', 'chene', 11)).setOrigin(0.5, 1).setScale(1.68).setTint(0x7a6a5e);
  s.add.image(cx, haut - 6, dessousMaisonHD(s)).setOrigin(0.5, 0).setScale(2);
  if (filet !== null) { const fi = s.add.image(cx + 4, haut + 60, filetBoisHD(s, filet)).setOrigin(0.5, 0).setScale(2); if (leve) fi.setAngle(-4); }
  s.add.image(cx - 110, sol - (leve ? 14 : 0), patteMaisonHD(s, leve ? 'pas' : 'debout', 'chene')).setOrigin(0.5, 1).setScale(1.75);
  s.add.image(cx + 110, sol, patteMaisonHD(s, 'debout', 'chene')).setOrigin(0.5, 1).setScale(1.75);
  s.add.image(cx, haut - 4, attachesMaisonHD(s)).setOrigin(0.5, 0).setScale(2);
  const f = dessinerFacade(s, cx, haut, undefined, undefined, { fumee: false }); f.tonneaux.setVisible(false);
  fumer(s, f, fumee); chatSur(s, cx, haut, poseChat);
  return f;
}
function chatSur(s, cx, haut, pose) { const ch = creerChatHD(s, lookChat(GAME)) + '_' + pose; s.add.image(cx - 36, haut - 264, ch).setOrigin(0.5, 1).setScale(2.4); }
// la fumée de la cheminée, toujours à l'opposé de la marche (la maison va à droite : la fumée file à gauche)
function fumer(s, f, sorte) {
  if (sorte === 'aucune') return;
  const im = f.image, gauche = im.x - im.displayWidth / 2, haut = im.y - im.displayHeight;
  const [x, y, l] = chemineeFacade(niveauFacade(GAME)), cx = gauche + (x + l / 2) * 2, cy = haut + y * 2;
  const R = { epaisse: { d: 150, e: 3.0, a: 1, t: 0x5a5450, v: -150 }, normale: { d: 420, e: 2.2, a: 0.95, t: null, v: -90 }, maigre: { d: 700, e: 1.5, a: 0.75, t: null, v: -40 } }[sorte];
  // on avance le temps : la traînée est déjà là quand on prend la photo
  for (let k = 0; k < 14; k++) s.time.delayedCall(k * R.d * 0.5, () => {});
  s.time.addEvent({ delay: R.d, loop: true, callback: () => bouffeeFumee(s, cx, cy, { echelle: R.e, monte: 110, vent: R.v, duree: 3200, alpha: R.a, teinte: R.t, profondeur: im.depth + 0.01, conteneur: im.parentContainer || null }) });
}
function decorRoute(s, moment = 0) {
  const pay = paysageHD(s, 960, 470, 'comte', moment); s.add.image(0, 0, pay).setOrigin(0).setDisplaySize(960, 470);
  s.add.image(0, 470, cheminTerreHD(s, 960, 70)).setOrigin(0).setDisplaySize(960, 70);
}
function encart(s, x, y, l, h) { return s.add.rectangle(x, y, l, h, 0x1e140a, 0.86).setStrokeStyle(2, 0xd8b048).setDepth(30); }
function texteEncart(s, x, y, t, taille = 13, coul = '#f3d98a', o = {}) { return s.add.text(x, y, t, style(taille, coul, { fontStyle: 'bold', ...o })).setOrigin(0.5).setDepth(31); }
// le tableau de bord du voyage : la jauge du feu, les heures qui restent, le filet
function tableauVoyage(s, niveau, heures, filet) {
  encart(s, 118, 74, 210, 120);
  s.add.image(70, 66, jaugeFeuHD(s, niveau)).setScale(2.4).setDepth(31);
  texteEncart(s, 70, 112, 'le feu', 11, '#e8d4a8', { fontStyle: 'italic' });
  texteEncart(s, 170, 52, heures, 15);
  texteEncart(s, 170, 72, 'de marche', 11, '#e8d4a8', { fontStyle: 'italic' });
  s.add.image(170, 100, filetBoisHD(s, filet)).setScale(0.75).setDepth(31);
  texteEncart(s, 170, 124, filet + ' / 12 places', 11, '#e8d4a8');
}
function bulle74(s, x, y, t, l = 260) { const tx = s.add.text(x, y, t, style(13, '#2a1a10', { fontStyle: 'bold', align: 'center', wordWrap: { width: l } })).setOrigin(0.5).setDepth(41); s.add.rectangle(x, y, tx.width + 20, tx.height + 14, 0xfff4dc).setStrokeStyle(2, 0x6b4a2a).setDepth(40); }
function narration74(s, x, y, t, l = 320) { const tx = s.add.text(x, y, t, style(13, '#f6ead0', { fontStyle: 'italic', align: 'center', wordWrap: { width: l } })).setOrigin(0.5).setDepth(41); s.add.rectangle(x, y, tx.width + 22, tx.height + 14, 0x1a120a, 0.88).setDepth(40); }

// Le feu de camp : deux bûches croisées, des pierres autour, et la flamme en trois images (on les alterne)
function feuDeCampHD(scene, k = 0) {
  const cle = 'feuDeCampHD_' + k; if (scene.textures.exists(cle)) return cle;
  const L = 34, H = 40, t = toileDecor(L, H); rampesVille(t); t.rampes.flamme = [0x7a1e08, 0xb83a10, 0xe8661c, 0xf8a030, 0xffd860, 0xfff4c0]; t.rampes.braise = rampe(0xc84a18);
  for (const [x0, y0, x1, y1] of [[3, 36, 30, 30], [4, 30, 31, 36]]) segmentHD(t, [x0, y0], [x1, y1], 2.2, 'chene', {});
  for (const [x, y] of [[2, 37], [9, 38], [17, 38], [25, 38], [31, 37]]) disqueHD(t, x, y, 2.2, 'pierre', 2);
  const hauteur = [24, 28, 22][k % 3], penche = [0, 1.5, -1.5][k % 3];
  for (let y = 36 - hauteur; y < 34; y++) { const u = (y - (36 - hauteur)) / hauteur, l = Math.sin(u * Math.PI * 0.9) * 8 + 1, cx = 17 + penche * (1 - u);
    for (let x = Math.floor(cx - l); x <= cx + l; x++) { const d = Math.abs(x + 0.5 - cx) / l; t.poser(x, y, 'flamme', Math.max(0, Math.min(5, Math.round(5 - d * 3 - (1 - u) * 1.5 + (u > 0.7 ? 1 : 0))))); } }
  for (const [x, y] of [[11, 33], [21, 33], [16, 34]]) t.poser(x, y, 'braise', 5);
  t.contour(); t.texture(scene, cle); return cle;
}
