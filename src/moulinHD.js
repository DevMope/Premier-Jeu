// (v1.35, planche 60 v2) Le Vieux Moulin, près de l'étang : le décor de la quête du chat amoureux. On le parcourt à pied
// comme la rue, de gauche à droite : le sentier et ses roseaux, le pont de planches sur le ruisseau (une planche
// pourrie), le moulin et sa roue à aubes sur le bief, puis l'étang, où l'aventure finit au lever du soleil.
// Toutes les images sont peintes comme les façades de la rue (toile ×2, posées par le bas).
const LARGEUR_MOULIN = 2880;
const PLACES_MOULIN = { entree: 120, panneau: 380, saule0: 180, ruisseau: 930, ruisseauFin: 1270, pont: 1100, moulin: 1760, roue: 1918, bief: 1440, biefFin: 2240, etang: 2250, ponton: 2330, fin: 2700 };
const SOL_MOULIN = 470;

function creerMoulinHD(scene) {
  if (scene.textures.exists('moulinHD')) return;
  const toile = (l, h) => { const t = toileDecor(l, h); Object.assign(t.rampes, RAMPES_RUE); return t; };

  // --- Le moulin : un soubassement de gros moellons, l'étage à colombages (le grenier, sa lucarne éclairée), un toit
  // de tuiles moussues ; sur le côté, le palier de fer où tourne l'axe de la roue
  {
    const L = 150, H = 160, t = toile(L, H), rdc = 92;
    t.rampes.mousse = rampe(0x4a6a2a);
    moellons(t, 14, rdc, L - 28, H - rdc, 901, 'pierre', 11);
    enduit(t, 18, 44, L - 36, rdc - 44, 902, true);
    for (const x of [18, 50, 82, L - 23]) planche(t, x, 44, 5, rdc - 44, 'cheneSombre', { horizontale: false, graine: 903 + x });
    for (const [x0, x1, y0, y1] of [[23, 50, 46, 90], [55, 82, 90, 46]]) for (let k = 0; k <= 26; k++) { const x = Math.round(x0 + (x1 - x0) * k / 26), y = Math.round(y0 + (y1 - y0) * k / 26); for (let d = 0; d < 3; d++) t.poser(x + d, y, 'cheneSombre', 2); }   // (les écharpes en croix)
    planche(t, 12, rdc - 5, L - 24, 6, 'cheneSombre', { graine: 905, noeuds: 2 });
    toitRue(t, 2, L - 3, 8, 46, 'tuile', 906);
    for (let k = 0; k < 90; k++) { const x = Math.round(20 + hachage(k, 1, 907) * (L - 40)), y = Math.round(14 + hachage(k, 2, 907) * 30); if (t.mat(x, y) === 'tuile') t.poser(x, y, 'mousse', 2 + (k % 3)); }   // la mousse
    fenetreRue(t, 92, 56, 18, 18, true);                    // la lucarne du grenier, éclairée
    fenetreRue(t, 30, 104, 14, 16, false, false);
    porteRue(t, 58, H - 46, 26, 46, { arc: true, graine: 908 });
    // le palier de l'axe, sur le mur de droite
    for (let y = 106; y < 122; y++) for (let x = L - 22; x < L - 10; x++) t.poser(x, y, 'fer', (x === L - 22 || y === 106) ? 4 : 2);
    // une échelle de meunier contre le mur, des sacs de farine au pied
    for (const x of [100, 110]) planche(t, x, 96, 2, H - 96, 'chene', { horizontale: false, graine: 909 + x });
    for (let y = 100; y < H; y += 8) for (let x = 100; x < 112; x++) t.poser(x, y, 'chene', 4);
    t.rampes.farine = rampe(0xd8ccb0);
    for (const [cx, cy, r] of [[124, H - 9, 8], [116, H - 6, 6]]) t.forme('farine', ellipsoide(cx, cy, r, r * 0.8), { decalage: 0.2 });
    t.contour(); t.texture(scene, 'moulinHD');
  }

  // --- La roue à aubes : une jante de chêne, huit rayons, des aubes tout autour, le moyeu de fer
  {
    const R = 36, L = 2 * R + 4, t = toile(L, L), c = L / 2;
    t.rampes.algue = rampe(0x3a5a2a);
    for (let y = 0; y < L; y++) for (let x = 0; x < L; x++) {
      const dx = x + 0.5 - c, dy = y + 0.5 - c, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
      const jante = d >= R - 7 && d <= R - 3, rayon = d < R - 5 && Math.abs(((a / (Math.PI / 4)) % 1 + 1) % 1 - 0.5) > 0.45 - 1.6 / Math.max(4, d);
      const aube = d > R - 7 && d <= R && Math.abs(((a / (Math.PI / 6)) % 1 + 1) % 1 - 0.5) > 0.38;
      if (jante) t.poser(x, y, 'chene', d < R - 5 ? 4 : 2);
      else if (aube) t.poser(x, y, dy > 0 && hachage(x, y, 911) > 0.6 ? 'algue' : 'cheneSombre', 3 + (dx < 0 ? 1 : 0));
      else if (rayon && d > 5) t.poser(x, y, 'chene', 3);
      if (d <= 6) t.poser(x, y, 'fer', d < 3 ? 4 : 2);
    }
    t.contour(); t.texture(scene, 'roueMoulinHD');
  }

  // --- Le pont de planches (vu de côté) : le tablier, ses poteaux plantés dans le ruisseau, une main courante de
  // corde ; et sa variante à la planche pourrie (un trou, une planche qui pend)
  for (const casse of [false, true]) {
    const L = 180, H = 44, t = toile(L, H);
    t.rampes.corde = rampe(0xc8a870);
    for (let x = 0; x < L; x += 30) planche(t, x + 2, 8, 6, H - 8, 'cheneSombre', { horizontale: false, graine: 913 + x });   // les poteaux
    for (let x = 0; x < L; x++) {
      const trou = casse && x > 96 && x < 118;
      if (!trou) for (let y = 12; y < 19; y++) t.poser(x, y, 'chene', y === 12 ? 5 : y === 18 ? 1 : (x % 12 === 0 ? 1 : 3));
      const yc = Math.round(5 + Math.sin((x % 30) / 30 * Math.PI) * 3);
      t.poser(x, yc, 'corde', 3); t.poser(x, yc + 1, 'corde', 1);
    }
    if (casse) for (let k = 0; k < 16; k++) { const x = 100 + Math.round(k * 0.5), y = 18 + k; t.poser(x, y, 'chene', 3); t.poser(x + 1, y, 'chene', 2); t.poser(x + 2, y, 'chene', 1); }
    t.contour(); t.texture(scene, casse ? 'pontMoulinHD_casse' : 'pontMoulinHD');
  }

  // --- Les roseaux : des tiges fines, des feuilles en lame, et les massettes brunes
  for (const [k, n] of [[0, 7], [1, 5]]) {
    const L = 34, H = 52, t = toile(L, H);
    t.rampes.tige = rampe(0x5a7a32); t.rampes.massette = rampe(0x6a3e1e);
    for (let i = 0; i < n; i++) {
      const x0 = 4 + hachage(i, k, 915) * (L - 8), h = 26 + hachage(i, 2, 915 + k) * 24, pench = (hachage(i, 3, 915) - 0.5) * 8;
      traitHD(t, 'tige', [[x0, H - 1], [x0 + pench * 0.5, H - h * 0.6], [x0 + pench, H - h]], 0.7, 0.2 * (i % 2));
      if (i % 2 === 0) t.forme('massette', ellipsoide(x0 + pench, H - h + 4, 1.6, 4), { decalage: 0.3 });
    }
    t.contour(); t.texture(scene, 'roseauxHD_' + k);
  }

  // --- Le ponton de l'étang et la barque amarrée
  {
    const L = 150, H = 40, t = toile(L, H);
    for (let x = 6; x < L; x += 36) planche(t, x, 10, 6, H - 10, 'cheneSombre', { horizontale: false, graine: 917 + x });
    planche(t, 0, 8, L, 8, 'chene', { graine: 918, noeuds: 3 });
    t.contour(); t.texture(scene, 'pontonHD');
  }
  {
    const L = 80, H = 22, t = toile(L, H);
    t.forme('chene', (x, y) => { const u = (x + 0.5 - L / 2) / (L / 2), v = (y + 0.5) / H; return v > 0.25 && v < 1 && Math.abs(u) < 1 - Math.pow(v - 0.25, 2) * 0.6 && v > 0.25 + Math.pow(Math.abs(u), 6) * 0.5 ? [u * 0.3, 0.3, 0.9] : null; }, { motif: (x, y) => (y % 4 === 0 ? -0.8 : 0) });
    for (let x = 10; x < L - 10; x++) t.poser(x, 6, 'cheneSombre', 2);
    t.contour(); t.texture(scene, 'barqueHD');
  }

  // --- Le renard (vu de profil, tourné vers la gauche) : roux, le poitrail et le bout de la queue blancs, les pattes
  // noires ; et le renard que la magie de l'Engeance a gagné : le poil terni, des veines violettes, les yeux qui luisent
  for (const infecte of [false, true]) for (const pas of [0, 1]) {
    const t = toileDecor(56, 34);
    t.rampes.poilR = rampe(infecte ? 0x7a3e34 : 0xd2642a); t.rampes.blancR = rampe(infecte ? 0xb8a8b0 : 0xf2e8d8); t.rampes.noirR = rampe(0x2a1c18);
    t.rampes.veine = rampe(0xb050f0); t.rampes.oeilR = rampe(infecte ? 0xd890ff : 0xf0b020);
    const poils = (x, y) => ((x * 3 + y * 5) % 7 === 0 ? -0.8 : 0);
    // la queue en panache, relevée derrière, le bout blanc
    t.forme('poilR', (x, y) => { const u = (x - 38) / 16, v = (y - 14) / 7; return u > 0 && u < 1.1 && Math.abs(v + u * u * 1.2 - 0.4) < 0.9 - u * 0.2 ? [0.3, -0.2, 0.8] : null; }, { motif: poils });
    t.forme('blancR', (x, y) => { const u = (x - 38) / 16, v = (y - 14) / 7; return u > 0.82 && u < 1.1 && Math.abs(v + u * u * 1.2 - 0.4) < 0.9 - u * 0.2 ? [0.3, -0.2, 0.8] : null; });
    const pattes = pas ? [[36, 40], [41, 37], [15, 19], [20, 16]] : [[36, 36], [41, 41], [15, 15], [20, 20]];
    pattes.forEach(([x, x2], i) => { traitHD(t, 'poilR', [[x, 19], [x2, 26]], 1.3, i % 2 ? 0 : -0.3); traitHD(t, 'noirR', [[x2, 26], [x2, 32]], 1.1, i % 2 ? 0 : -0.3); });
    t.forme('poilR', ellipsoide(28, 17, 13, 5.5), { motif: poils });                              // le corps, mince
    t.forme('blancR', ellipsoide(17, 19, 5, 3.5), { bord: false });                               // le poitrail
    t.forme('poilR', ellipsoide(11, 11, 6, 5), { decalage: 0.2 });                                // la tête
    t.forme('poilR', (x, y) => (x >= 0 && x <= 8 && y >= 11 && y <= 15 && y - 11 <= (8 - x) * 0.6 + 2 ? [-0.4, 0, 0.8] : null), { decalage: 0.3 });   // le museau pointu
    t.forme('blancR', ellipsoide(6, 14.5, 3.5, 1.6), { bord: false });                            // la joue blanche
    for (const ox of [10, 14]) t.forme('poilR', (x, y) => (y >= 0 && y <= 7 && Math.abs(x + 0.5 - ox) <= (y + 0.5) * 0.42 ? [0, -0.5, 0.8] : null));   // les grandes oreilles
    for (const ox of [10, 14]) t.poser(ox, 4, 'noirR', 2);
    t.poser(0, 12, 'noirR', 0); t.poser(0, 13, 'noirR', 0);                                       // la truffe
    t.poser(7, 9, 'oeilR', 5); t.poser(8, 9, 'oeilR', infecte ? 5 : 3);
    if (infecte) {
      // les veines violettes qui courent sous le poil, et les crocs
      for (const pts of [[[24, 13], [30, 15], [36, 13]], [[20, 18], [26, 20], [33, 19]], [[11, 7], [13, 11], [12, 14]]]) traitHD(t, 'veine', pts, 0.45, 0.6);
      for (const x of [2, 4]) t.poser(x, 15, 'cire', 5);
    }
    t.contour(); t.texture(scene, `renardHD${infecte ? '_infecte' : ''}${pas ? '_pas' : ''}`);
  }
}

// Le décor entier (largeur LARGEUR_MOULIN) : le ciel (la nuit, ou l'aube en grande pompe), les collines, les arbres, le
// chemin, le ruisseau et son pont, le bief et le moulin à la roue qui tourne, l'étang. Renvoie de quoi animer la scène.
function construireMoulin(scene, { aube = false } = {}) {
  creerMoulinHD(scene); creerEauHD(scene); creerHalo(scene);
  const P = PLACES_MOULIN, sol = SOL_MOULIN, W = LARGEUR_MOULIN, r = {};
  // le ciel : une nuit d'encre bleue, ou l'aube (bleu, rose, or)
  const ciel = scene.add.graphics().setDepth(-3).setScrollFactor(0);
  const bandes = aube ? [[0x2a3a7a, 0], [0x6a5a9a, 0.25], [0xe08a7a, 0.5], [0xf8b870, 0.72], [0xffe0a0, 1]] : [[0x060a20, 0], [0x0e1636, 0.45], [0x22305a, 0.85], [0x34406a, 1]];
  for (let y = 0; y < sol; y += 2) {
    const v = y / sol; let i = 0; while (i < bandes.length - 2 && v > bandes[i + 1][1]) i++;
    const [c0, v0] = bandes[i], [c1, v1] = bandes[i + 1], k = Phaser.Math.Clamp((v - v0) / (v1 - v0), 0, 1);
    ciel.fillStyle(Phaser.Display.Color.GetColor(...['r', 'g', 'b'].map((_, j) => { const a = (c0 >> (16 - 8 * j)) & 255, b = (c1 >> (16 - 8 * j)) & 255; return Math.round(a + (b - a) * k); }))).fillRect(0, y, 960, 2);
  }
  if (!aube) {
    for (let k = 0; k < 60; k++) { const e = scene.add.rectangle(hachage(k, 1, 920) * 960, hachage(k, 2, 920) * 260, 2, 2, 0xfff8e0).setAlpha(0.4).setDepth(-2.9).setScrollFactor(0); scene.tweens.add({ targets: e, alpha: 0.95, duration: 600 + (k % 5) * 300, yoyo: true, repeat: -1, delay: k * 70 }); }
    scene.add.image(780, 80, 'halo').setScale(1.5).setTint(0xf3ecc8).setAlpha(0.45).setBlendMode(Phaser.BlendModes.ADD).setDepth(-2.8).setScrollFactor(0);
    scene.add.circle(780, 80, 22, 0xf3ecc8).setDepth(-2.8).setScrollFactor(0);
  } else {
    // le soleil qui se lève derrière les collines de l'étang, et ses rayons
    r.soleil = scene.add.circle(P.fin, sol - 70, 46, 0xfff0b0).setDepth(-2.6).setScrollFactor(1);
    r.halo = scene.add.image(P.fin, sol - 70, 'halo').setScale(6).setTint(0xffd080).setAlpha(0.75).setBlendMode(Phaser.BlendModes.ADD).setDepth(-2.5);
    r.rayons = [];
    for (let k = 0; k < 9; k++) { const a = -Math.PI + (k + 0.5) * Math.PI / 9, ry = scene.add.triangle(P.fin, sol - 70, 0, 0, Math.cos(a - 0.05) * 900, Math.sin(a - 0.05) * 900, Math.cos(a + 0.05) * 900, Math.sin(a + 0.05) * 900, 0xfff0c0, 0.16).setOrigin(0, 0).setBlendMode(Phaser.BlendModes.ADD).setDepth(-2.55);
      scene.tweens.add({ targets: ry, alpha: 0.05, duration: 2200 + k * 200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }); r.rayons.push(ry); }
  }
  // les collines lointaines, en deux plans qui glissent moins vite
  for (const [f, c, h, g] of [[0.25, aube ? 0x7a6a9a : 0x141c34, 120, 921], [0.5, aube ? 0x5a5a7a : 0x1a2440, 80, 922]]) {
    const gc = scene.add.graphics().setDepth(f === 0.25 ? -2.4 : -2.2).setScrollFactor(f);
    gc.fillStyle(c);
    const pts = [{ x: 0, y: sol }]; for (let x = 0; x <= W * f + 960; x += 40) pts.push({ x, y: sol - 40 - h * fbm(x * 0.004, 1, g) });
    pts.push({ x: W * f + 960, y: sol }); gc.fillPoints(pts, true);
  }
  // une rangée d'arbres sombres au loin, et quelques saules près du chemin
  for (let x = 40; x < W; x += 150) scene.add.image(x + hachage(x, 1, 923) * 60, sol - 4, textureArbre(scene, hachage(x, 2, 923) > 0.5 ? 'chenes' : 'ronds')).setOrigin(0.5, 1).setScale(1.6).setTint(aube ? 0x6a5a7a : 0x1e2a3e).setDepth(-1.5).setScrollFactor(0.8);
  for (const x of [P.saule0, 760, 1380, 2190]) scene.add.image(x, sol + 6, textureArbre(scene, 'saules')).setOrigin(0.5, 1).setScale(2.6).setTint(aube ? 0xd8c8b8 : 0x6a7a9a).setDepth(1);
  // le sol : la terre, le chemin plus clair, l'herbe en touffes
  const g = scene.add.graphics().setDepth(2);
  g.fillStyle(aube ? 0x4a5a2a : 0x22301e).fillRect(0, sol - 6, W, 80);
  g.fillStyle(aube ? 0x8a7048 : 0x3e3426).fillRect(0, sol + 20, W, 34);
  for (let x = 0; x < W; x += 9) { const h = 4 + hachage(x, 3, 924) * 8; g.fillStyle(aube ? 0x6a8a3a : 0x2e4a26).fillTriangle(x, sol - 4, x + 3, sol - 4 - h, x + 6, sol - 4); }
  for (let k = 0; k < 120; k++) g.fillStyle(aube ? 0x6a5434 : 0x2a2218).fillRect(hachage(k, 4, 924) * W, sol + 22 + hachage(k, 5, 924) * 30, 4, 2);
  // l'eau : le ruisseau (sous le pont), le bief (devant le moulin), l'étang (au bout)
  const eau = (x0, x1, y0, y1, prof) => {
    const f = scene.add.tileSprite(x0, y0, x1 - x0, y1 - y0, 'eauFondHD').setOrigin(0).setTileScale(2, (y1 - y0) / 32).setDepth(prof).setTint(aube ? 0xffd8c0 : 0x8090c0);
    const s = scene.add.tileSprite(x0, y0 - 4, x1 - x0, 12, 'surfaceHD').setOrigin(0).setTileScale(2).setDepth(prof + 0.01).setAlpha(0.8);
    scene.tweens.add({ targets: f, tilePositionX: -480, duration: 14000, repeat: -1 }); scene.tweens.add({ targets: s, tilePositionX: -480, duration: 5000, repeat: -1 });
    return f;
  };
  eau(P.ruisseau, P.ruisseauFin, sol - 6, 540, 2.2);
  eau(P.bief, P.biefFin, sol - 44, sol - 4, 1.6);
  eau(P.ponton + 40, W, sol - 60, 540, 2.2);
  eau(P.etang, P.ponton + 40, sol - 60, sol - 6, 2.2);   // (au bord de l'étang, le chemin reste à sec jusqu'au ponton)
  // le moulin, derrière le bief, et sa roue qui tourne dans l'eau
  r.moulin = scene.add.image(P.moulin, sol - 30, 'moulinHD').setOrigin(0.5, 1).setScale(2).setDepth(1.5).setTint(aube ? 0xffe8d0 : 0x9aa4c8);
  r.roue = scene.add.image(P.roue, sol - 92, 'roueMoulinHD').setScale(2).setDepth(1.55).setTint(aube ? 0xffe8d0 : 0x9aa4c8);
  scene.tweens.add({ targets: r.roue, angle: 360, duration: 9000, repeat: -1 });
  r.lucarne = scene.add.image(P.moulin + 52, sol - 230, 'halo').setScale(0.7).setTint(0xffb050).setAlpha(aube ? 0.2 : 0.55).setBlendMode(Phaser.BlendModes.ADD).setDepth(1.6);
  // l'eau qui jaillit sous la roue
  scene.time.addEvent({ delay: 180, loop: true, callback: () => { if (!r.roue.active) return; const e = scene.add.image(P.roue - 20 + Math.random() * 40, sol - 30, 'halo').setScale(0.12).setTint(0xd8f0ff).setAlpha(0.7).setDepth(1.7); scene.tweens.add({ targets: e, y: e.y - 14 - Math.random() * 10, x: e.x + 20, alpha: 0, duration: 600, onComplete: () => e.destroy() }); } });
  // le pont sur le ruisseau (avec sa planche pourrie)
  // (le tablier à hauteur des pieds : on marche dessus ; les poteaux plongent dans le ruisseau)
  r.pont = scene.add.image(P.pont, SOL_PROMENADE - 24, 'pontMoulinHD_casse').setOrigin(0.5, 0).setScale(2).setDepth(2.4);
  for (const x of [P.ruisseau - 6, P.ruisseauFin - 174]) scene.add.image(x, SOL_PROMENADE - 24, 'pontMoulinHD').setOrigin(0, 0).setScale(2).setDepth(2.39).setCrop(0, 0, 90, 44);
  // le ponton et la barque, sur l'étang
  scene.add.image(P.ponton, SOL_PROMENADE - 16, 'pontonHD').setOrigin(0, 0).setScale(2).setDepth(2.4);
  const barque = scene.add.image(P.ponton + 330, sol - 10, 'barqueHD').setOrigin(0.5, 0.5).setScale(2).setDepth(2.3).setTint(aube ? 0xffffff : 0x9aa4c8);
  scene.tweens.add({ targets: barque, y: barque.y + 3, angle: 2, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  // les roseaux, au bord de l'eau (certains devant le chemin)
  for (const [x, d, k] of [[P.ruisseau - 30, 2.5, 0], [P.ruisseauFin + 20, 2.5, 1], [P.bief + 20, 1.7, 0], [P.biefFin - 40, 1.7, 1], [P.etang + 60, 2.5, 1], [P.etang + 420, 2.25, 0], [P.etang + 520, 2.25, 1], [560, 9, 0], [1560, 9, 1], [2180, 9, 0]]) {
    const ro = scene.add.image(x, d >= 9 ? 545 : sol - 2, 'roseauxHD_' + k).setOrigin(0.5, 1).setScale(2.2).setDepth(d).setTint(aube ? 0xffffff : 0x8a9ab8);
    scene.tweens.add({ targets: ro, angle: 2, duration: 1500 + (x % 700), yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
  // l'écriteau, à l'entrée du sentier
  if (typeof ecriteauRue === 'function') ecriteauRue(scene, P.panneau, sol - 50, 'Le Vieux Moulin ▶', { taille: 12, profondeur: 2.6 });
  // les lucioles, la nuit
  if (!aube) for (let k = 0; k < 24; k++) {
    const l = scene.add.image(hachage(k, 6, 925) * W, sol - 30 - hachage(k, 7, 925) * 120, 'halo').setScale(0.06).setTint(0xd8ff80).setBlendMode(Phaser.BlendModes.ADD).setDepth(8.8);
    scene.tweens.add({ targets: l, x: l.x + 30, y: l.y - 20, alpha: 0.2, duration: 2000 + k * 120, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
  return r;
}

// La brume de l'Engeance autour d'une bête gagnée par sa magie : une lueur violette, des volutes qui montent, les yeux
// qui brillent dans le noir
function brumeEngeance(scene, bete) {
  creerHalo(scene);
  const lueur = scene.add.image(bete.x, bete.y - bete.displayHeight * 0.5, 'halo').setScale(1.4, 0.9).setTint(0x8a30d0).setAlpha(0.5).setBlendMode(Phaser.BlendModes.ADD).setDepth(bete.depth - 0.01);
  scene.tweens.add({ targets: lueur, alpha: 0.25, scale: 1.2, duration: 900, yoyo: true, repeat: -1 });
  const oeil = scene.add.image(0, 0, 'halo').setScale(0.12).setTint(0xe0a0ff).setBlendMode(Phaser.BlendModes.ADD).setDepth(bete.depth + 0.01);
  const fumee = scene.time.addEvent({ delay: 160, loop: true, callback: () => {
    if (!bete.active) { fumee.remove(); return; }
    const v = scene.add.image(bete.x + (Math.random() - 0.5) * bete.displayWidth * 0.8, bete.y - Math.random() * bete.displayHeight * 0.6, 'halo').setScale(0.18).setTint(Math.random() < 0.5 ? 0x6a2a9a : 0x2a1a3a).setAlpha(0.6).setDepth(bete.depth + 0.02);
    scene.tweens.add({ targets: v, y: v.y - 40 - Math.random() * 30, x: v.x + (Math.random() - 0.5) * 20, scale: 0.5, alpha: 0, duration: 1400, onComplete: () => v.destroy() });
  } });
  const suivre = () => { if (!bete.active) return; const s = bete.flipX ? 1 : -1; oeil.setPosition(bete.x + s * bete.displayWidth * 0.36, bete.y - bete.displayHeight * 0.72); lueur.setPosition(bete.x, bete.y - bete.displayHeight * 0.5); };
  suivre(); scene.events.on('update', suivre);
  return { lueur, oeil, fumee, arreter: () => { fumee.remove(); scene.events.off('update', suivre); scene.tweens.add({ targets: [lueur, oeil], alpha: 0, duration: 800 }); } };
}

// Le chat debout sur ses pattes arrière, un cigare à la patte : le secret du chat (il parle depuis le début)
function textureChatDebout(scene, look, { cigare = true } = {}) {
  const cle = `chatDebout_${look.pelage}_${look.yeux}_${look.collier}${cigare ? '' : '_sans'}`;
  if (scene.textures.exists(cle)) return cle;
  const P = PELAGES_CHAT[look.pelage] || PELAGES_CHAT.gris, Y = YEUX_CHAT[look.yeux] || YEUX_CHAT.vert, C = COLLIERS_CHAT[look.collier] || COLLIERS_CHAT.aucun;
  const t = toileDecor(32, 44);
  t.rampes.poil = rampe(P.poil); t.rampes.ventre = rampe(P.ventre); t.rampes.oeil = rampe(Y.couleur);
  if (P.taches) t.rampes.tache = rampe(P.taches);
  if (C.couleur) t.rampes.collier = rampe(C.couleur);
  t.rampes.cigare = rampe(0x6a3a1a); t.rampes.braise = rampe(0xff7020);
  const rayures = P.rayures ? (x, y) => ((y + Math.floor(x * 0.6)) % 4 === 0 ? -1 : 0) : (x, y) => (hachage(x, y, 17) > 0.9 ? -0.4 : 0);
  traitHD(t, 'poil', [[9, 40], [4, 38], [2, 33], [4, 29]], 1.4);                                  // la queue, enroulée
  for (const [x, d] of [[12, -0.3], [17, 0]]) { traitHD(t, 'poil', [[x, 33], [x, 40]], 1.6, d); t.forme('poil', ellipsoide(x + 2, 41.5, 3, 1.4), { decalage: d }); }   // les pattes arrière, les pieds
  t.forme('poil', ellipsoide(15, 27, 6.5, 9), { motif: rayures });                                // le corps, debout
  t.forme('ventre', ellipsoide(17, 28, 3.6, 6.5), { decalage: 0.3 });
  traitHD(t, 'poil', [[11, 22], [8, 27], [11, 30]], 1.2, -0.2);                                   // une patte sur la hanche
  // la tête, les oreilles, l'œil mi-clos (l'air de celui qui en sait long)
  const cx = 16, cy = 12;
  for (const ox of [-2.4, 1.8]) t.forme('poil', (x, y) => (y >= cy - 8 && y <= cy - 2 && Math.abs(x + 0.5 - (cx + ox)) <= (y - (cy - 8)) * 0.42 + 0.2 ? [0, -0.6, 0.8] : null), { decalage: 0.2 });
  t.forme('poil', ellipsoide(cx, cy, 5, 4.3), { motif: rayures });
  t.forme('ventre', ellipsoide(cx + 3.4, cy + 1.6, 2.4, 1.8), { decalage: 0.2 });
  t.poser(cx + 2, cy - 1, 'oeil', 4); t.poser(cx + 3, cy - 1, 'oeil', 2); t.poser(cx + 2, cy - 2, 'poil', 1); t.poser(cx + 3, cy - 2, 'poil', 1);   // (la paupière lourde)
  t.poser(cx + 5, cy + 1, 'verreRouge', 3);
  if (C.couleur) for (let x = cx - 4; x <= cx + 2; x++) for (const y of [cy + 4, cy + 5]) if (t.mat(x, y)) t.poser(x, y, 'collier', y === cy + 4 ? 4 : 2);
  // l'autre patte levée vers la bouche, le cigare entre les doigts, sa braise
  traitHD(t, 'poil', [[19, 21], [23, 19], [22, 15]], 1.2, 0.3);
  if (cigare) { traitHD(t, 'cigare', [[21, 15], [28, 13]], 0.7, 0.4); t.poser(28, 13, 'braise', 5); t.poser(29, 13, 'braise', 3); }
  if (P.taches) for (let y = 0; y < t.h; y++) for (let x = 0; x < t.l; x++) if (t.mat(x, y) === 'poil' && fbm(x * 0.22, y * 0.22, 433) > 0.56) t.poser(x, y, 'tache', t.k[y * t.l + x]);
  t.contour(); t.texture(scene, cle);
  return cle;
}
