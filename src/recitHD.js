// Les récits en HD : les créatures et les décors des épreuves que vivent les aventuriers.
// Même style que le reste (ToileHD : dégradés de 6 teintes, lumière en haut à gauche).
// Les créatures regardent vers la gauche, vers l'aventurier qui arrive.

// Un trait épais (pour les pattes, les os, les bâtons...).
function traitHD(t, mat, pts, epaisseur = 1.2, decalage = 0) {
  t.forme(mat, (x, y) => {
    for (let k = 0; k < pts.length - 1; k++) {
      const [ax, ay] = pts[k], [bx, by] = pts[k + 1];
      const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1;
      const u = Math.max(0, Math.min(1, ((x + 0.5 - ax) * dx + (y + 0.5 - ay) * dy) / l2));
      const px = ax + u * dx - (x + 0.5), py = ay + u * dy - (y + 0.5);
      const d = Math.hypot(px, py);
      if (d < epaisseur) return [-px / epaisseur, -py / epaisseur, Math.sqrt(Math.max(0.1, 1 - (d / epaisseur) ** 2))];
    }
    return null;
  }, { decalage });
}

const ABIME = [0x020204, 0x08080c, 0x101014, 0x18181e, 0x222228, 0x2e2e36];

function creerRecitHD(scene) {
  if (scene.textures.exists('loupHD')) return;
  const fourrure = (t, nom, base) => { t.rampes[nom] = rampe(base); };
  const poils = (x, y) => ((x * 3 + y * 5) % 7 === 0 ? -0.8 : 0);

  // Le loup, babines retroussées
  {
    const t = toileDecor(58, 36);
    fourrure(t, 'poil', 0x6e6e78); fourrure(t, 'ventre', 0xb8b4ac);
    traitHD(t, 'poil', [[48, 16], [54, 9], [56, 5]], 2.6, 0.1);                                  // la queue
    for (const [x, d] of [[40, -0.3], [45, 0]]) traitHD(t, 'poil', [[x, 20], [x + 1, 27], [x - 1, 33]], 1.7, d); // pattes arrière
    t.forme('poil', ellipsoide(32, 17, 16, 7.5), { motif: poils });
    t.forme('ventre', ellipsoide(30, 21, 11, 3), { bord: false });
    for (const [x, d] of [[19, -0.3], [24, 0]]) traitHD(t, 'poil', [[x, 20], [x, 27], [x - 1, 33]], 1.7, d); // pattes avant
    t.forme('poil', ellipsoide(19, 16, 8, 8.5), { motif: poils });                                // le poitrail
    t.forme('poil', ellipsoide(11, 11, 7, 6), { decalage: 0.2 });                                  // la tête
    t.forme('poil', ellipsoide(4, 14, 5.5, 3), { decalage: 0.3 });                                 // le museau
    for (const ox of [11, 15]) t.forme('poil', (x, y) => (y >= 1 && y <= 7 && Math.abs(x + 0.5 - ox) <= (y - 1) * 0.5 ? [0, -0.5, 0.8] : null)); // les oreilles
    t.poser(8, 9, 'gemme', 5); t.poser(9, 9, 'encre', 0);                                         // l'œil jaune
    t.poser(0, 13, 'encre', 0); t.poser(0, 14, 'encre', 0);                                       // la truffe
    for (let x = 1; x < 8; x++) t.poser(x, 16, 'encre', 1);                                        // la gueule
    for (const x of [2, 5]) t.poser(x, 17, 'cire', 5);                                             // les crocs
    t.contour(); t.texture(scene, 'loupHD');
  }
  // Le sanglier, défenses en avant
  {
    const t = toileDecor(58, 36);
    fourrure(t, 'poil', 0x5a3a22); fourrure(t, 'groin', 0xb07a6a);
    for (const [x, d] of [[42, -0.3], [47, 0], [18, -0.3], [23, 0]]) traitHD(t, 'poil', [[x, 24], [x, 33]], 1.8, d);
    t.forme('poil', ellipsoide(32, 18, 19, 10), { motif: poils });
    for (let x = 16; x < 46; x += 2) traitHD(t, 'encre', [[x, 9 - Math.sin((x - 16) / 30 * Math.PI) * 2], [x + 1, 6 - Math.sin((x - 16) / 30 * Math.PI) * 3]], 0.8); // la crête de soies
    t.forme('poil', ellipsoide(12, 21, 9, 8), { decalage: 0.2 });
    t.forme('groin', ellipsoide(3.5, 24, 3.5, 3.4), { decalage: 0.3 });
    traitHD(t, 'cire', [[6, 26], [4, 22], [5, 19]], 0.9, 0.6);                                    // la défense
    t.forme('poil', (x, y) => (y >= 10 && y <= 15 && Math.abs(x + 0.5 - 16) <= (y - 10) * 0.6 ? [0, -0.5, 0.8] : null));
    t.poser(9, 18, 'verreRouge', 5); t.poser(10, 18, 'encre', 0);
    traitHD(t, 'poil', [[51, 16], [55, 18]], 0.8);
    t.contour(); t.texture(scene, 'sanglierHD');
  }
  // L'araignée géante, au sablier rouge
  {
    const t = toileDecor(64, 42);
    fourrure(t, 'chitine', 0x2a1e34);
    for (const [ox, sens, j] of [[22, -1, 0], [24, -1, 1], [27, 1, 2], [30, 1, 3]]) {
      const pied = 4 + j * 8 + (sens > 0 ? 20 : 0);
      traitHD(t, 'chitine', [[ox, 22], [ox + sens * 6 + (j - 1.5) * 5, 8 + j], [pied, 40]], 1.3, -0.1);
    }
    t.forme('chitine', ellipsoide(42, 17, 14, 11), { motif: (x, y) => ((x + y) % 5 === 0 ? 0.6 : 0) });
    t.forme('verreRouge', (x, y) => (Math.abs(y + 0.5 - 17) < 4 && Math.abs(x + 0.5 - 42) < 1.2 + Math.abs(y + 0.5 - 17) * 0.5 ? [0, 0, 1] : null), { decalage: 0.5 });
    t.forme('chitine', ellipsoide(24, 23, 8, 6.5), { decalage: 0.2 });
    for (const [x, y] of [[18, 21], [20, 20], [19, 23], [21, 22]]) t.poser(x, y, 'verreRouge', 5);
    for (const x of [17, 21]) traitHD(t, 'cire', [[x, 26], [x - 1, 30]], 0.7, 0.4);              // les crochets
    t.contour(); t.texture(scene, 'araigneeHD');
  }
  // Le yéti, immense et blanc
  {
    const t = toileDecor(48, 66);
    fourrure(t, 'poil', 0xe4eaf2); fourrure(t, 'peauBleue', 0x6a7a9a);
    for (const x of [16, 31]) traitHD(t, 'poil', [[x, 50], [x, 64]], 4, -0.2);                     // les jambes
    traitHD(t, 'poil', [[38, 26], [42, 40], [40, 54]], 4.2, -0.3);                                  // le bras du fond
    t.forme('poil', ellipsoide(24, 36, 16, 19), { motif: poils });
    traitHD(t, 'poil', [[10, 26], [6, 40], [8, 54]], 4.4, 0.1);                                     // le bras levé
    t.forme('poil', ellipsoide(22, 14, 10, 10), { motif: poils });
    t.forme('peauBleue', ellipsoide(19, 17, 6, 5.5), { decalage: 0.2 });
    for (const x of [16, 21]) { t.poser(x, 15, 'verreRouge', 5); t.poser(x, 16, 'encre', 0); }
    for (let x = 15; x < 23; x++) t.poser(x, 20, 'encre', 0);
    for (const x of [16, 21]) t.poser(x, 21, 'cire', 5);
    for (const [x, y] of [[6, 56], [9, 57], [11, 56]]) t.poser(x, y, 'encre', 1);                  // les griffes
    t.contour(); t.texture(scene, 'yetiHD');
  }
  // Le troll des collines, sa massue à la main
  {
    const t = toileDecor(56, 70);
    fourrure(t, 'peauTroll', 0x6a7a3a); fourrure(t, 'pagne', 0x6a4a2a);
    traitHD(t, 'chene', [[8, 64], [5, 38], [4, 30]], 2, 0.1);                                       // le manche de la massue
    t.forme('chene', ellipsoide(4, 26, 5, 8), { decalage: 0.2, motif: (x, y) => ((x * 7 + y * 3) % 9 === 0 ? -1 : 0) });
    for (const x of [20, 34]) traitHD(t, 'peauTroll', [[x, 50], [x + 1, 68]], 4.2, -0.2);
    traitHD(t, 'peauTroll', [[42, 28], [46, 44], [44, 56]], 4.5, -0.3);
    t.forme('peauTroll', ellipsoide(28, 36, 17, 18), { motif: poils });
    t.forme('pagne', (x, y) => (y >= 44 && y <= 54 && Math.abs(x + 0.5 - 28) < 15 - (y - 44) * 0.3 ? [0, 0.3, 0.9] : null), { decalage: -0.1 });
    traitHD(t, 'peauTroll', [[16, 28], [10, 42], [8, 50]], 4.6, 0.1);
    t.forme('peauTroll', ellipsoide(22, 17, 9, 8), { decalage: 0.2 });
    t.forme('peauTroll', ellipsoide(16, 19, 4, 3.5), { decalage: 0.4 });                            // le gros nez
    t.poser(19, 14, 'gemme', 5); t.poser(20, 14, 'encre', 0); t.poser(24, 14, 'gemme', 5);
    for (let x = 15; x < 25; x++) t.poser(x, 22, 'encre', 0);
    for (const x of [16, 23]) { t.poser(x, 21, 'cire', 5); t.poser(x, 20, 'cire', 4); }            // les défenses
    t.contour(); t.texture(scene, 'trollHD');
  }
  // Le fantôme, translucide
  {
    const t = toileDecor(32, 44);
    fourrure(t, 'brume', 0xc8dcf0);
    t.forme('brume', (x, y) => {
      const ondule = Math.sin(x * 0.7) * 2;
      if (y > 28 + ondule + (x > 16 ? (x - 16) * 0.6 : 0)) return null;
      return ellipsoide(15, 18, 11, 18)(x, y);
    });
    for (const [x, y] of [[10, 13], [17, 13]]) for (let k = 0; k < 4; k++) t.poser(x + (k % 2), y + (k >> 1), 'encre', 0);
    for (let k = 0; k < 4; k++) t.poser(12 + k, 21 + (k % 2), 'encre', 1);
    t.texture(scene, 'espritHD');
  }
  // Le squelette (les morts-vivants), et sa vieille lame
  {
    const t = toileDecor(28, 58);
    t.rampes.os = [0x3a3428, 0x6a6250, 0x9a927a, 0xc8c0a6, 0xe6dfc8, 0xfffaea];
    for (const x of [11, 16]) traitHD(t, 'os', [[x, 36], [x, 46], [x - 1, 56]], 1.1);
    traitHD(t, 'os', [[14, 14], [14, 36]], 1.1);                                                    // la colonne
    for (let k = 0; k < 5; k++) traitHD(t, 'os', [[9, 18 + k * 3], [19, 18 + k * 3]], 0.7, -0.2 * (k % 2)); // les côtes
    traitHD(t, 'os', [[9, 36], [19, 36]], 1);
    traitHD(t, 'os', [[9, 16], [5, 26], [4, 34]], 1);
    traitHD(t, 'fer', [[4, 34], [1, 22]], 1, 0.4);                                                   // la lame rouillée
    traitHD(t, 'os', [[19, 16], [22, 26], [20, 34]], 1);
    t.forme('os', ellipsoide(13, 8, 6, 6.5), { decalage: 0.2 });
    for (const [x, y] of [[10, 7], [14, 7]]) { t.poser(x, y, 'encre', 0); t.poser(x + 1, y, 'encre', 0); t.poser(x, y + 1, 'verreVert', 5); }
    for (let x = 10; x < 16; x++) t.poser(x, 12, (x % 2) ? 'encre' : 'os', 2);
    t.contour(); t.texture(scene, 'squeletteHD');
  }
  // La grotte : une arche de roche et sa bouche noire
  {
    const t = toileDecor(120, 96);
    t.forme('pierre', (x, y) => {
      const bord = 96 - Math.abs(x - 60) * 1.4 - Math.sin(x * 0.3) * 4;
      if (y < 96 - bord * 0.95) return null;
      const n = fbm(x * 0.08, y * 0.08, 940);
      return [(x - 60) / 70, -0.6 + n * 0.4, 0.7];
    }, { motif: (x, y) => (fbm(x * 0.25, y * 0.25, 941) > 0.62 ? -1 : 0) });
    t.rampes.abime = ABIME;
    t.forme('abime', ellipsoide(58, 82, 26, 34), { bord: false, decalage: -0.5 });
    for (let k = 0; k < 6; k++) traitHD(t, 'pierre', [[40 + k * 7, 50 + Math.abs(k - 2.5) * 4], [41 + k * 7, 58 + Math.abs(k - 2.5) * 4]], 1.2, -0.5); // stalactites
    t.contour(); t.texture(scene, 'grotteHD');
  }
  // Le gouffre : une faille noire aux bords rocheux
  {
    const t = toileDecor(100, 26);
    t.forme('pierre', (x, y) => (y >= 4 && (x < 16 + Math.sin(y) * 2 || x > 84 + Math.sin(y * 1.3) * 2) ? [x < 50 ? 0.5 : -0.5, -0.3, 0.8] : null), { motif: poils });
    t.rampes.abime = ABIME;
    t.forme('abime', (x, y) => (y >= 4 && x >= 16 && x <= 84 ? [0, -0.3 + y / 40, 0.8] : null), { bord: false });
    for (let x = 18; x < 84; x++) t.poser(x, 4, 'pierre', 1);
    t.contour(); t.texture(scene, 'gouffreHD');
  }
  // Le feu de camp : des bûches croisées et un cercle de pierres
  {
    const t = toileDecor(40, 16);
    traitHD(t, 'chene', [[6, 13], [34, 8]], 2.2); traitHD(t, 'chene', [[6, 8], [34, 13]], 2.2, 0.2);
    for (let k = 0; k < 7; k++) t.forme('pierre', ellipsoide(3 + k * 5.6, 13.5, 2.6, 2), { decalage: 0.2 });
    t.contour(); t.texture(scene, 'feuCampHD');
  }
  // Un rocher (les éboulis, l'avalanche)
  {
    const t = toileDecor(30, 26);
    t.forme('pierre', ellipsoide(15, 14, 14, 11.5), { motif: (x, y) => (fbm(x * 0.3, y * 0.3, 950) > 0.6 ? -1 : 0) });
    t.contour(); t.texture(scene, 'rocherHD');
  }
  // Les champignons vénéneux
  {
    const t = toileDecor(40, 22);
    for (const [x, h, r] of [[8, 12, 7], [22, 16, 9], [33, 9, 5]]) {
      traitHD(t, 'cire', [[x, 22], [x, 22 - h + 2]], 1.6);
      t.forme('verreRouge', (xx, y) => (y <= 22 - h + 3 ? ellipsoide(x, 22 - h + 2, r, r * 0.65)(xx, y) : null), { decalage: 0.3 });
      for (const [dx, dy] of [[-r * 0.4, -2], [r * 0.3, -3], [0, -1]]) t.poser(Math.round(x + dx), Math.round(22 - h + dy), 'cire', 5);
    }
    t.contour(); t.texture(scene, 'champignonsHD');
  }
  // Une goutte de lumière (feux follets, éclats de magie)
  {
    const t = toileDecor(8, 8);
    t.rampes.lueur = [0x2a8a6a, 0x4ab08a, 0x70d0a8, 0xa0f0d0, 0xd0fff0, 0xffffff];
    t.forme('lueur', ellipsoide(4, 4, 3.5, 3.5), { decalage: 0.8 });
    t.texture(scene, 'lueurHD');
  }
}

// --- (v0.57) La Bête de l'antre : un grand wyrm aux écailles sombres, ailes repliées, cornes,
// la gueule ouverte où rougeoie le feu (un leurre ? on ne le saura qu'à l'Antre...) ---
function creerBeteAntreHD(scene) {
  if (scene.textures.exists('beteAntreHD')) return;
  const t = toileDecor(100, 66);
  t.rampes.ecailleB = rampe(0x4a2420); t.rampes.ventreB = rampe(0xa8784a); t.rampes.aile = rampe(0x3a1418);
  t.rampes.corneB = rampe(0xd8ccb0); t.rampes.feu = [0x7a1a08, 0xb83a10, 0xe86a18, 0xf8a030, 0xffd060, 0xfff4c0];
  t.rampes.oeilB = [0x5a3a00, 0x9a6a00, 0xd8a010, 0xf8d030, 0xfff070, 0xffffd0];
  const ecailles = (x, y) => (((x * 5 + y * 3) % 6 === 0) ? -0.7 : ((x + y * 2) % 7 === 0 ? 0.4 : 0));
  // l'aile repliée, derrière le corps : une membrane tendue sur trois baleines
  t.forme('aile', (x, y) => {
    if (y < 4 || y > 36 || x < 44 || x > 94) return null;
    const haut = 4 + Math.abs(x - 74) * 0.5, bas = 36 - Math.max(0, x - 82) * 1.2;
    return y >= haut + Math.sin(x * 0.4) * 1.5 && y <= bas ? [0.2, -0.6, 0.7] : null;
  }, { decalage: -0.2 });
  for (const [x1, y1] of [[52, 30], [66, 16], [86, 26]]) traitHD(t, 'corneB', [[74, 6], [x1, y1]], 0.9, 0.2);
  // la queue, qui remonte en fouet vers la droite
  traitHD(t, 'ecailleB', [[78, 48], [90, 50], [96, 40], [98, 30]], 4.5, -0.1);
  // les pattes de derrière et de devant, avec leurs griffes
  for (const [x0, ep] of [[72, 5.5], [64, 5], [38, 5], [30, 4.5]]) traitHD(t, 'ecailleB', [[x0, 44], [x0 - 2, 56], [x0 - 4, 62]], ep, x0 % 2 ? -0.3 : 0.1);
  for (const x0 of [68, 60, 34, 26]) for (const d of [-3, 0, 3]) { t.poser(x0 + d - 1, 64, 'corneB', 4); t.poser(x0 + d - 2, 65, 'corneB', 2); }
  // le grand corps, et son ventre clair
  t.forme('ecailleB', ellipsoide(56, 40, 26, 15), { motif: ecailles, decalage: 0.3 });
  t.forme('ventreB', (x, y) => { const nx = (x + 0.5 - 54) / 22, ny = (y + 0.5 - 46) / 8; return nx * nx + ny * ny <= 1 && y > 42 ? [nx * 0.5, 0.6, 0.6] : null; }, { motif: (x, y) => (y % 3 === 0 ? -0.6 : 0) });
  // le cou qui se dresse vers la gauche, puis la tête
  traitHD(t, 'ecailleB', [[42, 34], [32, 24], [24, 20]], 7, 0.2);
  t.forme('ecailleB', ellipsoide(17, 20, 11, 8), { motif: ecailles, decalage: 0.35 });
  t.forme('ecailleB', ellipsoide(6, 22, 7, 4.5), { decalage: 0.25 });                               // le museau
  // la gueule ouverte : la mâchoire du bas, les crocs, le feu au fond
  t.forme('ecailleB', (x, y) => (x >= 0 && x <= 18 && y >= 27 && y <= 31 - (18 - x) * 0.12 ? [0, 0.5, 0.7] : null), { decalage: 0.1 });
  for (let x = 2; x < 16; x++) for (let y = 25; y < 28; y++) t.poser(x, y, 'feu', 5 - Math.floor((16 - x) / 4) - (y === 27 ? 1 : 0));
  for (const x of [3, 7, 11]) { t.poser(x, 25, 'corneB', 5); t.poser(x, 26, 'corneB', 3); t.poser(x + 1, 27, 'corneB', 4); }
  // les cornes, l'œil qui luit, la naseau qui fume
  traitHD(t, 'corneB', [[20, 14], [28, 6], [34, 4]], 1.6, 0.3);
  traitHD(t, 'corneB', [[15, 13], [20, 5], [24, 1]], 1.3, 0.3);
  t.poser(13, 18, 'oeilB', 5); t.poser(14, 18, 'oeilB', 4); t.poser(13, 19, 'oeilB', 3); t.poser(14, 19, 'feu', 0);
  t.poser(2, 20, 'feu', 0); t.poser(3, 20, 'feu', 1);
  // les piques le long du dos
  for (const [x, y] of [[30, 17], [36, 22], [44, 26], [52, 25], [60, 25], [68, 27], [76, 31], [84, 40], [92, 40]]) {
    for (let j = 0; j < 4; j++) for (let i = -2 + Math.ceil(j / 2); i <= 2 - Math.ceil(j / 2); i++) if (!t.mat(x + i, y - j) || t.mat(x + i, y - j) === 'aile') t.poser(x + i, y - j, 'corneB', j < 2 ? 3 : 4);
  }
  t.contour();
  t.texture(scene, 'beteAntreHD');
}
