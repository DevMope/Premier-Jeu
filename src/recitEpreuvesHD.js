// (v0.59) Les récits mis en scène : les images qui manquaient pour jouer chaque épreuve comme
// une petite scène (le loup qui marche, bondit et hurle ; les chauves-souris ; le serpent ; le
// panneau de la route, la tente, le tronc en travers du chemin, le coffre piégé...).
// Même style que recitHD.js : ToileHD, lumière en haut à gauche ; les bêtes regardent à gauche.

// Un polygone plein, pour `t.forme` (bombé vers le haut)
function polygoneHD(pts) {
  return (x, y) => {
    const px = x + 0.5, py = y + 0.5;
    let dedans = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) dedans = !dedans;
    }
    return dedans ? [0, -0.3, 0.9] : null;
  };
}

// Le loup, dans toutes ses attitudes : 'debout' (comme loupHD), 'pas', 'bond', 'hurle'
function dessinerLoupHD(scene, cle, mode) {
  const t = toileDecor(58, 36);
  t.rampes.poil = rampe(0x6e6e78); t.rampes.ventre = rampe(0xb8b4ac);
  const poils = (x, y) => ((x * 3 + y * 5) % 7 === 0 ? -0.8 : 0);
  const bond = mode === 'bond', hurle = mode === 'hurle', pas = mode === 'pas';
  const dy = bond ? -3 : 0;
  traitHD(t, 'poil', bond ? [[48, 14], [54, 11], [57, 10]] : [[48, 16], [54, 9], [56, 5]], 2.6, 0.1);   // la queue
  const arriere = bond ? [[[40, 17], [47, 21], [54, 23]], [[45, 17], [51, 22], [57, 25]]]
    : pas ? [[[40, 20], [42, 27], [44, 33]], [[45, 20], [44, 27], [41, 33]]]
      : [[[40, 20], [41, 27], [39, 33]], [[45, 20], [46, 27], [44, 33]]];
  arriere.forEach((pts, i) => traitHD(t, 'poil', pts, 1.7, i ? 0 : -0.3));
  t.forme('poil', ellipsoide(32, 17 + dy, 16, 7.5), { motif: poils });
  t.forme('ventre', ellipsoide(30, 21 + dy, 11, 3), { bord: false });
  const avant = bond ? [[[19, 17], [12, 21], [5, 22]], [[24, 17], [17, 23], [10, 26]]]
    : pas ? [[[19, 20], [17, 27], [15, 33]], [[24, 20], [25, 27], [27, 33]]]
      : [[[19, 20], [19, 27], [18, 33]], [[24, 20], [24, 27], [23, 33]]];
  avant.forEach((pts, i) => traitHD(t, 'poil', pts, 1.7, i ? 0 : -0.3));
  t.forme('poil', ellipsoide(19, 16 + dy, 8, 8.5), { motif: poils });                                 // le poitrail
  if (hurle) {
    // la tête renversée vers la lune, la gueule ouverte
    t.forme('poil', ellipsoide(15, 8, 6.5, 6), { decalage: 0.2 });
    traitHD(t, 'poil', [[13, 6], [7, 1]], 2.6, 0.3);                                                 // le museau, pointé vers le ciel
    for (const ox of [18, 21]) t.forme('poil', (x, y) => (y >= 2 && y <= 7 && Math.abs(x + 0.5 - ox - (7 - y) * 0.6) <= (y - 2) * 0.45 ? [0, -0.5, 0.8] : null));
    t.poser(13, 6, 'gemme', 5); t.poser(14, 6, 'encre', 0);
    t.poser(5, 0, 'encre', 0);
    for (const [x, y] of [[8, 4], [9, 5], [10, 6], [11, 7]]) t.poser(x, y, 'encre', 1);                 // la gueule ouverte
  } else {
    t.forme('poil', ellipsoide(11, 11 + dy, 7, 6), { decalage: 0.2 });
    t.forme('poil', ellipsoide(4, 14 + dy, 5.5, 3), { decalage: 0.3 });
    for (const ox of [11, 15]) t.forme('poil', (x, y) => (y >= 1 + dy && y <= 7 + dy && Math.abs(x + 0.5 - ox) <= (y - 1 - dy) * 0.5 ? [0, -0.5, 0.8] : null));
    t.poser(8, 9 + dy, 'gemme', 5); t.poser(9, 9 + dy, 'encre', 0);
    t.poser(0, 13 + dy, 'encre', 0); t.poser(0, 14 + dy, 'encre', 0);
    for (let x = 1; x < 8; x++) t.poser(x, 16 + dy, 'encre', 1);
    for (const x of [2, 5]) t.poser(x, 17 + dy, 'cire', 5);
  }
  t.contour(); t.texture(scene, cle);
}

// Le sanglier qui trotte (les pattes en ciseaux)
function dessinerSanglierHD(scene, cle, pas) {
  const t = toileDecor(58, 36);
  t.rampes.poil = rampe(0x5a3a22); t.rampes.groin = rampe(0xb07a6a);
  const poils = (x, y) => ((x * 3 + y * 5) % 7 === 0 ? -0.8 : 0);
  const pattes = pas ? [[42, 45], [47, 45], [18, 15], [23, 26]] : [[42, 42], [47, 47], [18, 18], [23, 23]];
  pattes.forEach(([x, x2], i) => traitHD(t, 'poil', [[x, 24], [x2, 33]], 1.8, i % 2 ? 0 : -0.3));
  t.forme('poil', ellipsoide(32, 18, 19, 10), { motif: poils });
  for (let x = 16; x < 46; x += 2) traitHD(t, 'encre', [[x, 9 - Math.sin((x - 16) / 30 * Math.PI) * 2], [x + 1, 6 - Math.sin((x - 16) / 30 * Math.PI) * 3]], 0.8);
  t.forme('poil', ellipsoide(12, 21, 9, 8), { decalage: 0.2 });
  t.forme('groin', ellipsoide(3.5, 24, 3.5, 3.4), { decalage: 0.3 });
  traitHD(t, 'cire', [[6, 26], [4, 22], [5, 19]], 0.9, 0.6);
  t.forme('poil', (x, y) => (y >= 10 && y <= 15 && Math.abs(x + 0.5 - 16) <= (y - 10) * 0.6 ? [0, -0.5, 0.8] : null));
  t.poser(9, 18, 'verreRouge', 5); t.poser(10, 18, 'encre', 0);
  traitHD(t, 'poil', [[51, 16], [55, 18]], 0.8);
  t.contour(); t.texture(scene, cle);
}

function creerRecitEpreuvesHD(scene) {
  if (scene.textures.exists('loupHD_bond')) return;
  creerRecitHD(scene);
  creerHalo(scene);
  dessinerLoupHD(scene, 'loupHD_pas', 'pas');
  dessinerLoupHD(scene, 'loupHD_bond', 'bond');
  dessinerLoupHD(scene, 'loupHD_hurle', 'hurle');
  dessinerSanglierHD(scene, 'sanglierHD_pas', true);

  // La chauve-souris : ailes hautes, ailes basses
  for (const [cle, haut] of [['chauveSourisHD0', true], ['chauveSourisHD1', false]]) {
    const t = toileDecor(24, 14);
    t.rampes.cuirCS = rampe(0x3a2e3a);
    const ailes = haut ? [[[11, 7], [2, 0], [4, 4], [1, 5], [6, 8]], [[13, 7], [22, 0], [20, 4], [23, 5], [18, 8]]]
      : [[[11, 6], [1, 9], [4, 10], [2, 13], [7, 10]], [[13, 6], [23, 9], [20, 10], [22, 13], [17, 10]]];
    for (const a of ailes) t.forme('cuirCS', polygoneHD(a), { decalage: -0.2 });
    t.forme('cuirCS', ellipsoide(12, 7, 2.6, 3.4), { decalage: 0.3 });
    for (const ox of [11, 13]) t.poser(ox, 3, 'cuirCS', 3);
    t.poser(11, 6, 'verreRouge', 5); t.poser(13, 6, 'verreRouge', 5);
    t.contour(); t.texture(scene, cle);
  }
  // Le serpent, la tête dressée, en deux ondulations
  for (const [cle, ph] of [['serpentHD0', 0], ['serpentHD1', Math.PI]]) {
    const t = toileDecor(46, 18);
    t.rampes.ecaille = rampe(0x5a7a2a); t.rampes.ventreS = rampe(0xc8b870);
    for (let x = 44; x > 10; x -= 1) {
      const y = 14 + Math.sin(x * 0.32 + ph) * 2.2, ep = 1.4 + (44 - x) / 34 * 1.6;
      traitHD(t, 'ecaille', [[x, y], [x - 1, 14 + Math.sin((x - 1) * 0.32 + ph) * 2.2]], ep, 0.1);
    }
    traitHD(t, 'ecaille', [[11, 14], [8, 10], [7, 6]], 2.8, 0.2);                                     // le cou dressé
    t.forme('ecaille', ellipsoide(5, 5, 4, 2.8), { decalage: 0.3 });
    for (let x = 14; x < 42; x += 5) { const y = Math.round(14 + Math.sin(x * 0.32 + ph) * 2.2) - 1; t.poser(x, y, 'encre', 1); t.poser(x + 1, y, 'encre', 2); }   // les losanges du dos
    for (let y = 8; y < 14; y++) t.poser(9, y, 'ventreS', 4);
    t.poser(4, 4, 'gemme', 5); t.poser(4, 5, 'encre', 0);
    t.poser(0, 6, 'verreRouge', 4); t.poser(1, 6, 'verreRouge', 5); t.poser(0, 7, 'verreRouge', 3);   // la langue fourchue
    t.contour(); t.texture(scene, cle);
  }
  // Une petite araignée (qui descend au bout de son fil)
  {
    const t = toileDecor(14, 12);
    t.rampes.chitineP = rampe(0x2a1e34);
    for (const [a, b] of [[[5, 6], [1, 2]], [[5, 7], [0, 7]], [[5, 8], [1, 11]], [[9, 6], [13, 2]], [[9, 7], [14, 7]], [[9, 8], [13, 11]]]) traitHD(t, 'chitineP', [a, b], 0.6);
    t.forme('chitineP', ellipsoide(7, 7, 3.2, 3.6), { decalage: 0.3 });
    t.poser(6, 9, 'verreRouge', 5); t.poser(8, 9, 'verreRouge', 5);
    t.contour(); t.texture(scene, 'araignetteHD');
  }
  // Le panneau de la route : un poteau et deux flèches de bois
  {
    const t = toileDecor(40, 50);
    traitHD(t, 'chene', [[20, 50], [20, 6]], 1.8, -0.1);
    t.forme('chene', polygoneHD([[4, 8], [30, 8], [36, 12], [30, 16], [4, 16]]), { decalage: 0.2, motif: (x, y) => (y % 3 === 0 ? -0.7 : 0) });
    t.forme('chene', polygoneHD([[36, 20], [10, 20], [4, 24], [10, 28], [36, 28]]), { decalage: 0.1, motif: (x, y) => (y % 3 === 1 ? -0.7 : 0) });
    for (const [x, y] of [[9, 12], [27, 12], [14, 24], [31, 24]]) t.poser(x, y, 'fer', 3);
    t.contour(); t.texture(scene, 'panneauRouteHD');
  }
  // La borne, au bord du chemin
  {
    const t = toileDecor(16, 20);
    t.forme('pierre', (x, y) => (y >= 4 && x >= 2 && x <= 13 ? [(x - 7.5) / 8, -0.2, 0.9] : ellipsoide(7.5, 5, 5.5, 4.5)(x, y)), { motif: (x, y) => (fbm(x * 0.4, y * 0.4, 960) > 0.62 ? -1 : 0) });
    for (let x = 5; x < 11; x++) t.poser(x, 9, 'encre', 2);
    t.poser(6, 11, 'encre', 2); t.poser(9, 11, 'encre', 2);
    t.contour(); t.texture(scene, 'borneHD');
  }
  // La tente du campement
  {
    const t = toileDecor(60, 40);
    t.rampes.toileT = rampe(0xb89a6a);
    t.forme('toileT', polygoneHD([[30, 2], [58, 38], [2, 38]]), { motif: (x, y) => ((x + y * 2) % 9 === 0 ? -0.6 : 0) });
    t.rampes.abime = ABIME;
    t.forme('abime', polygoneHD([[30, 12], [40, 38], [20, 38]]), { bord: false });
    traitHD(t, 'toileT', [[30, 12], [24, 38]], 0.8, 0.4);
    traitHD(t, 'chene', [[30, 0], [30, 6]], 0.9);
    for (const x of [4, 56]) traitHD(t, 'chanvre', [[x, 38], [x + (x < 30 ? -3 : 3), 39]], 0.6);
    t.contour(); t.texture(scene, 'tenteHD');
  }
  // Un buisson épais (où se cachent les yeux, les brigands...)
  {
    const t = toileDecor(48, 28);
    t.rampes.feuille = rampe(0x3f6a2e);
    for (const [x, y, r] of [[10, 18, 9], [22, 13, 12], [36, 16, 10], [28, 20, 9], [16, 21, 8], [42, 21, 6]]) t.forme('feuille', ellipsoide(x, y, r, r * 0.85), { motif: (xx, yy) => (fbm(xx * 0.35, yy * 0.35, 970) > 0.6 ? -1 : (xx * 5 + yy * 3) % 11 === 0 ? 0.8 : 0) });
    t.contour(); t.texture(scene, 'buissonHD');
  }
  // Le tronc abattu en travers du chemin
  {
    const t = toileDecor(100, 22);
    t.rampes.ecorce = rampe(0x5a4028); t.rampes.feuille = rampe(0x3f6a2e);
    traitHD(t, 'ecorce', [[8, 13], [92, 14]], 7.5, 0.1);
    for (let x = 12; x < 90; x += 6) t.poser(x, 10 + (x % 3), 'encre', 1);
    t.forme('cire', ellipsoide(93, 14, 3.5, 7), { decalage: 0.2, motif: (x, y) => (Math.hypot(x - 93, (y - 14) * 0.5) % 2 < 0.8 ? -1 : 0) });   // la coupe et ses cernes
    traitHD(t, 'ecorce', [[40, 8], [36, 1]], 1.6, 0.2); traitHD(t, 'ecorce', [[66, 9], [72, 3]], 1.3, 0.2);    // des moignons de branches
    t.forme('feuille', ellipsoide(36, 2, 4, 2.5), { decalage: 0.3 });
    t.contour(); t.texture(scene, 'troncHD');
  }
  // L'arc (et une flèche)
  {
    const t = toileDecor(14, 34);
    traitHD(t, 'chene', [[4, 1], [10, 8], [12, 17], [10, 26], [4, 33]], 1.1, 0.2);
    for (let y = 2; y < 33; y++) t.poser(4, y, 'chanvre', 4);
    t.contour(); t.texture(scene, 'arcHD');
    const f = toileDecor(30, 7);
    traitHD(f, 'chene', [[4, 3.5], [26, 3.5]], 0.6);
    f.forme('fer', polygoneHD([[30, 3.5], [25, 0.5], [25, 6.5]]), { decalage: 0.4 });
    for (const [a, b] of [[[0, 0], [6, 3]], [[0, 7], [6, 4]]]) traitHD(f, 'tissuRouge', [a, b], 0.8);
    f.contour(); f.texture(scene, 'flecheHD');
  }
  // Le coffre au trésor : fermé, puis ouvert (et l'or qui brille dedans)
  for (const [cle, ouvert] of [['coffreRecitHD0', false], ['coffreRecitHD1', true]]) {
    const t = toileDecor(32, 30);
    planche(t, 3, 14, 26, 14, 'chene', { graine: 7 });
    for (const x of [3, 15, 27]) for (let y = 14; y < 28; y++) { t.poser(x, y, 'laiton', y === 14 ? 5 : 3); t.poser(x + 1, y, 'laiton', 2); }
    if (ouvert) {
      for (let x = 5; x < 27; x++) for (let y = 11; y < 15; y++) t.poser(x, y, 'laiton', 3 + ((x + y) % 3 === 0 ? 2 : (x * y) % 4 === 0 ? 1 : 0));    // les pièces
      t.forme('chene', polygoneHD([[3, 13], [29, 13], [27, 1], [5, 1]]), { decalage: -0.3 });              // le couvercle, rabattu en arrière
      t.rampes.abime = ABIME;
      t.forme('abime', polygoneHD([[6, 12], [26, 12], [25, 4], [7, 4]]), { bord: false });
    } else {
      t.forme('chene', (x, y) => (y >= 6 && y < 15 && x >= 3 && x < 29 && (y >= 9 || Math.hypot((x + 0.5 - 16) / 13, (y + 0.5 - 10) / 4) <= 1) ? [0, -0.6, 0.8] : null), { decalage: 0.1 });
      for (let x = 13; x < 19; x++) for (let y = 11; y < 16; y++) t.poser(x, y, 'laiton', y === 11 ? 5 : 3);
      t.poser(15, 13, 'encre', 0); t.poser(16, 13, 'encre', 0);
    }
    t.contour(); t.texture(scene, cle);
  }
  // Une paillasse (les blessés allongés dessus)
  {
    const t = toileDecor(60, 10);
    t.forme('chanvre', (x, y) => (y >= 3 && y <= 9 && x >= 1 && x <= 58 ? [0, -0.5 + (y - 3) / 8, 0.8] : null), { motif: (x, y) => ((x * 3 + y) % 5 === 0 ? -0.8 : 0) });
    for (let x = 2; x < 58; x += 3) t.poser(x, 2, 'chanvre', 4);
    t.contour(); t.texture(scene, 'paillasseHD');
  }
  // Un palmier (l'oasis) et un mirage
  {
    const t = toileDecor(50, 70);
    t.rampes.palme = rampe(0x4a8a3a); t.rampes.stipe = rampe(0x8a6a40);
    traitHD(t, 'stipe', [[22, 70], [24, 40], [27, 14]], 2.6, 0.1);
    for (let y = 18; y < 68; y += 4) t.poser(Math.round(22 + (70 - y) * 0.08), y, 'stipe', 1);
    for (const [ax, ay] of [[4, 22], [10, 8], [27, 2], [44, 8], [48, 22], [16, 26], [38, 26]]) traitHD(t, 'palme', [[27, 14], [(27 + ax) / 2, Math.min(14, ay) - 4], [ax, ay]], 1.8, 0.1);
    t.contour(); t.texture(scene, 'palmierHD');
  }
  // Un arbre feuillu (et sa version morte, aux branches tordues)
  for (const [cle, mort] of [['arbreRecitHD', false], ['arbreMortHD', true]]) {
    const t = toileDecor(80, 110);
    t.rampes.ecorce = rampe(mort ? 0x4a3c34 : 0x5a4028); t.rampes.feuille = rampe(0x356a2e);
    traitHD(t, 'ecorce', [[40, 110], [41, 80], [38, 50]], 4.2, -0.1);
    for (const br of [[[39, 62], [22, 44], [10, 36]], [[40, 56], [58, 40], [70, 34]], [[38, 50], [36, 30], [42, 14]], [[24, 46], [20, 30]], [[57, 41], [62, 26]]]) traitHD(t, 'ecorce', br, mort ? 1.4 : 2, 0.1);
    for (let y = 70; y < 108; y += 5) t.poser(40 + (y % 3) - 1, y, 'ecorce', 1);
    if (!mort) {
      for (const [x, y, r] of [[40, 28, 22], [20, 40, 17], [62, 38, 18], [30, 18, 15], [52, 16, 16], [12, 30, 11], [70, 28, 11], [41, 46, 14]]) {
        t.forme('feuille', ellipsoide(x, y, r, r * 0.82), { motif: (xx, yy) => (fbm(xx * 0.3, yy * 0.3, 980) > 0.62 ? -1 : (xx * 7 + yy * 3) % 13 === 0 ? 0.9 : 0) });
      }
    } else {
      for (const br of [[[10, 36], [4, 30], [2, 22]], [[70, 34], [76, 26]], [[42, 14], [46, 4]], [[20, 30], [14, 20]]]) traitHD(t, 'ecorce', br, 0.9, 0.2);
    }
    t.contour(); t.texture(scene, cle);
  }
  // La lumière (pour percer l'obscurité) : pleine au centre, qui s'éteint doucement au bord
  if (!scene.textures.exists('lumiereHD')) {
    const c = scene.textures.createCanvas('lumiereHD', 128, 128);
    const ctx = c.getContext();
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255,255,255,1)'); grad.addColorStop(0.45, 'rgba(255,255,255,0.95)');
    grad.addColorStop(0.75, 'rgba(255,255,255,0.45)'); grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 128, 128); c.refresh();
  }
  // (2e lot) La pierre tombale, moussue, un peu penchée
  {
    const t = toileDecor(22, 30);
    t.rampes.tombe = rampe(0x8a8a90); t.rampes.mousseT = rampe(0x4a6a32);
    t.forme('tombe', (x, y) => (y >= 8 && x >= 2 && x <= 19 ? [(x - 10.5) / 10, -0.2, 0.9] : ellipsoide(10.5, 9, 8.5, 7.5)(x, y)), { motif: (x, y) => (fbm(x * 0.4, y * 0.4, 990) > 0.64 ? -1 : 0) });
    for (let y = 9; y < 20; y++) t.poser(10, y, 'encre', 2);
    for (let x = 7; x < 14; x++) t.poser(x, 12, 'encre', 2);
    for (let k = 0; k < 9; k++) { const x = 2 + Math.floor(hachage(k, 1, 991) * 17), y = 22 + Math.floor(hachage(k, 2, 991) * 7); t.poser(x, y, 'mousseT', 3); }
    t.contour(); t.texture(scene, 'tombeHD');
  }
  // Le golem gardien : des blocs de pierre empilés, des runes qui luisent
  {
    const t = toileDecor(50, 70);
    t.rampes.roc = rampe(0x8a8070); t.rampes.rune = [0x0a3a4a, 0x1a6a8a, 0x2aa0c0, 0x50d0f0, 0x90f0ff, 0xe0ffff];
    const blocs = (x, y) => (fbm(x * 0.35, y * 0.35, 995) > 0.66 ? -1 : (x * 3 + y * 7) % 17 === 0 ? 0.8 : 0);
    for (const x of [16, 33]) t.forme('roc', (xx, y) => (y >= 48 && y <= 69 && Math.abs(xx + 0.5 - x) < 6 ? [(xx + 0.5 - x) / 6, 0, 0.8] : null), { motif: blocs });
    t.forme('roc', ellipsoide(25, 36, 18, 15), { motif: blocs });
    for (const [x0, x1] of [[8, 2], [42, 48]]) t.forme('roc', (xx, y) => (y >= 24 && y <= 56 && Math.abs(xx + 0.5 - (x0 + (x1 - x0) * (y - 24) / 32)) < 5.5 ? [0, 0, 0.8] : null), { motif: blocs, decalage: 0.1 });
    for (const x of [2, 48]) t.forme('roc', ellipsoide(x, 58, 6.5, 5.5), { motif: blocs, decalage: 0.2 });
    t.forme('roc', ellipsoide(25, 14, 10, 9), { motif: blocs, decalage: 0.2 });
    for (const x of [21, 28]) { t.poser(x, 13, 'rune', 5); t.poser(x + 1, 13, 'rune', 4); }
    for (const [x, y] of [[20, 34], [22, 36], [24, 38], [26, 36], [28, 34], [24, 32], [25, 40]]) t.poser(x, y, 'rune', 4);
    t.contour(); t.texture(scene, 'golemHD');
  }
  // La pierre levée (les ruines, les esprits)
  {
    const t = toileDecor(20, 50);
    t.rampes.menhir = rampe(0x7a7a80);
    t.forme('menhir', (x, y) => { const l = 7 - Math.abs(y - 26) * 0.08 + Math.sin(y * 0.4) * 0.6; return y >= 3 && Math.abs(x + 0.5 - 10) < l ? [(x + 0.5 - 10) / l, -0.2, 0.9] : null; }, { motif: (x, y) => (fbm(x * 0.4, y * 0.3, 996) > 0.62 ? -1 : 0) });
    for (let y = 14; y < 40; y += 6) { t.poser(9, y, 'encre', 2); t.poser(10, y + 1, 'encre', 2); }
    t.contour(); t.texture(scene, 'pierreLeveeHD');
  }
  // L'autel (où repose l'objet maudit)
  {
    const t = toileDecor(36, 30);
    t.rampes.marbre = rampe(0xb8b0a0);
    t.forme('marbre', polygoneHD([[2, 4], [34, 4], [34, 9], [2, 9]]), { decalage: 0.3 });
    t.forme('marbre', polygoneHD([[8, 9], [28, 9], [26, 26], [10, 26]]), { motif: (x, y) => (x % 4 === 0 ? -0.8 : 0) });
    t.forme('marbre', polygoneHD([[4, 26], [32, 26], [32, 30], [4, 30]]), { decalage: 0.1 });
    t.contour(); t.texture(scene, 'autelHD');
  }
  // Le sarcophage dressé (les momies)
  {
    const t = toileDecor(24, 56);
    t.rampes.or = rampe(0xc8a040); t.rampes.lapis = rampe(0x2a4a9a);
    t.forme('or', ellipsoide(12, 28, 11, 27), { motif: (x, y) => (y % 6 === 0 ? -1 : 0) });
    t.forme('lapis', (x, y) => (y >= 4 && y <= 18 && Math.abs(x + 0.5 - 12) < 9 && (x + y) % 3 !== 0 ? [0, 0, 1] : null));
    t.forme('or', ellipsoide(12, 12, 5.5, 7), { decalage: 0.3 });
    t.poser(10, 11, 'encre', 0); t.poser(14, 11, 'encre', 0);
    for (let y = 24; y < 50; y += 4) for (let x = 6; x < 18; x += 3) t.poser(x, y, 'lapis', 3);
    t.contour(); t.texture(scene, 'sarcophageHD');
  }
  // Le cactus (le désert)
  {
    const t = toileDecor(30, 46);
    t.rampes.cactus = rampe(0x4a8a3a);
    traitHD(t, 'cactus', [[15, 46], [15, 6]], 4.5, 0.1);
    traitHD(t, 'cactus', [[11, 26], [5, 24], [5, 14]], 2.8, 0);
    traitHD(t, 'cactus', [[19, 20], [25, 18], [25, 10]], 2.6, 0);
    for (let y = 8; y < 44; y += 4) { t.poser(13, y, 'cactus', 1); t.poser(17, y + 2, 'cactus', 1); }
    t.contour(); t.texture(scene, 'cactusHD');
  }
  // (v0.59) Le trône : haut dossier sculpté, velours pourpre, accoudoirs et pommeaux dorés
  {
    const t = toileDecor(44, 66);
    t.rampes.or = rampe(0xc8a040); t.rampes.velours = rampe(0x7a1a3a);
    t.forme('or', polygoneHD([[6, 64], [6, 14], [10, 6], [16, 8], [22, 1], [28, 8], [34, 6], [38, 14], [38, 64]]), { motif: (x, y) => ((x + y) % 7 === 0 ? 0.8 : y % 9 === 0 ? -0.8 : 0) });
    t.forme('velours', polygoneHD([[11, 40], [11, 16], [16, 12], [22, 9], [28, 12], [33, 16], [33, 40]]), { motif: (x, y) => ((x * 3 + y * 5) % 11 === 0 ? -0.8 : 0) });
    t.forme('velours', polygoneHD([[3, 44], [41, 44], [41, 50], [3, 50]]), { decalage: 0.3 });
    for (const x of [2, 42]) { t.forme('or', polygoneHD([[x - 3, 36], [x + 3, 36], [x + 3, 64], [x - 3, 64]]), { decalage: 0.1 }); t.forme('or', ellipsoide(x, 34, 3.5, 3.5), { decalage: 0.4 }); }
    t.forme('gemme', ellipsoide(22, 13, 2.5, 2.5), { decalage: 0.6 });
    t.contour(); t.texture(scene, 'troneHD');
  }
  // La montagne enneigée (avalanche) : un grand versant aux arêtes rocheuses, des sapins blanchis
  {
    const L = 240, H = 150, t = toileDecor(L, H);
    t.rampes.neigeM = rampe(0xe8f0f8); t.rampes.rocM = rampe(0x6a6a78); t.rampes.sapinM = rampe(0x2a4a3a);
    t.forme('neigeM', (x, y) => { const crete = H - x * 0.6 - Math.sin(x * 0.07) * 8 - fbm(x * 0.05, 0, 330) * 14; return y >= crete ? [-0.4, -0.6, 0.7] : null; }, { motif: (x, y) => (fbm(x * 0.08, y * 0.12, 331) > 0.6 ? -1 : 0) });
    for (const [x, h] of [[30, 26], [52, 22], [120, 18], [150, 24], [200, 20], [220, 16]]) {
      const base = Math.min(H - 1, Math.round(H - x * 0.6 + 40 + (x % 3) * 6));
      for (let j = 0; j < h; j++) { const l = Math.round((j / h) * h * 0.35); for (let i = -l; i <= l; i++) t.poser(x + i, base - h + j, j % 5 === 0 && Math.abs(i) < l ? 'neigeM' : 'sapinM', Math.abs(i) === l ? 1 : 3); }
    }
    t.contour(); t.texture(scene, 'montagneHD');
  }
}

// (v0.60) Les souvenirs que la Faucheuse laisse sur le comptoir, un par âme offerte
const RELIQUES_FAUCHEUSE = [
  { id: 'petaleNoir', nom: 'Un pétale noir', texte: "Un pétale de rose, noir comme l'encre. Il ne fane pas." },
  { id: 'plumeCorbeau', nom: 'Une plume de corbeau', texte: 'Une longue plume noire, encore tiède.' },
  { id: 'sablier', nom: 'Un sablier', texte: "Un petit sablier dont le sable ne tombe que lorsqu'on ne le regarde pas." },
  { id: 'bougieNoire', nom: 'Une bougie noire', texte: "Une bougie noire à la flamme verte. Elle ne fond jamais." },
  { id: 'craneOiseau', nom: "Un crâne d'oiseau", texte: "Un minuscule crâne d'oiseau, poli comme un galet." },
  { id: 'fauxMiniature', nom: 'Une faux miniature', texte: 'Une faux grande comme un doigt. La lame est vraie.' },
];
function creerReliquesFaucheuseHD(scene) {
  if (scene.textures.exists('relique_petaleNoir')) return;
  const nouvelle = (id, l, h, dessin) => { const t = toileDecor(l, h); dessin(t); t.contour(); t.texture(scene, 'relique_' + id); };
  nouvelle('petaleNoir', 14, 12, t => {
    t.rampes.noirRose = rampe(0x3a1428);
    t.forme('noirRose', ellipsoide(7, 6, 6, 4.5), { motif: (x, y) => (x === 7 ? -0.8 : 0) });
    t.poser(3, 4, 'noirRose', 5); t.poser(4, 3, 'noirRose', 5);
  });
  nouvelle('plumeCorbeau', 20, 10, t => {
    t.rampes.corbeau = rampe(0x1e1e2a);
    t.forme('corbeau', polygoneHD([[1, 8], [8, 3], [19, 1], [12, 6], [3, 9]]), { motif: (x, y) => ((x + y) % 3 === 0 ? -0.8 : 0) });
    traitHD(t, 'cire', [[1, 8], [16, 2]], 0.5, 0.4);
  });
  nouvelle('sablier', 12, 18, t => {
    t.rampes.or = rampe(0xc8a040); t.rampes.verreS = rampe(0xa8c8d8); t.rampes.sable = rampe(0xd8b070);
    for (const y of [1, 15]) t.forme('or', polygoneHD([[1, y], [11, y], [11, y + 2], [1, y + 2]]), { decalage: 0.2 });
    t.forme('verreS', polygoneHD([[2, 3], [10, 3], [6, 9], [10, 15], [2, 15], [6, 9]]), { decalage: 0.4 });
    t.forme('sable', polygoneHD([[3, 15], [9, 15], [6, 11]]), { decalage: 0.1 });
    for (let y = 9; y < 12; y++) t.poser(6, y, 'sable', 4);
  });
  nouvelle('bougieNoire', 10, 20, t => {
    t.rampes.cireNoire = rampe(0x24202a); t.rampes.flammeV = [0x1a5a2a, 0x2a8a3a, 0x4ab85a, 0x7ae08a, 0xb0ffb8, 0xe8ffe8];
    t.forme('cireNoire', polygoneHD([[2, 8], [8, 8], [8, 19], [2, 19]]), { decalage: 0.1 });
    t.forme('flammeV', ellipsoide(5, 4, 2.2, 3.6), { decalage: 0.8 });
    t.poser(3, 9, 'cireNoire', 5); t.poser(3, 10, 'cireNoire', 4);
  });
  nouvelle('craneOiseau', 16, 10, t => {
    t.rampes.os = [0x3a3428, 0x6a6250, 0x9a927a, 0xc8c0a6, 0xe6dfc8, 0xfffaea];
    t.forme('os', ellipsoide(10, 5, 5, 4), { decalage: 0.3 });
    t.forme('os', polygoneHD([[6, 4], [0, 6], [6, 7]]), { decalage: 0.1 });
    t.poser(10, 4, 'encre', 0); t.poser(11, 4, 'encre', 0);
  });
  nouvelle('fauxMiniature', 14, 20, t => {
    t.rampes.manche = rampe(0x4a3420);
    traitHD(t, 'manche', [[9, 19], [8, 3]], 0.8);
    t.forme('fer', polygoneHD([[8, 2], [1, 3], [0, 6], [3, 4], [8, 4]]), { decalage: 0.5 });
  });
}

