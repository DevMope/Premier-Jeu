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
    r.soleil = scene.add.circle(P.fin, sol - 96, 46, 0xfff0b0).setDepth(-2.6).setScrollFactor(1);
    r.halo = scene.add.image(P.fin, sol - 96, 'halo').setScale(6).setTint(0xffd080).setAlpha(0.75).setBlendMode(Phaser.BlendModes.ADD).setDepth(-2.5);
    r.rayons = [];
    for (let k = 0; k < 9; k++) { const a = -Math.PI + (k + 0.5) * Math.PI / 9, ry = scene.add.triangle(P.fin, sol - 96, 0, 0, Math.cos(a - 0.05) * 900, Math.sin(a - 0.05) * 900, Math.cos(a + 0.05) * 900, Math.sin(a + 0.05) * 900, 0xfff0c0, 0.16).setOrigin(0, 0).setBlendMode(Phaser.BlendModes.ADD).setDepth(-2.55);
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
  for (let x = 40; x < W; x += 150) if (!aube || Math.abs(x - (P.fin - 0.2 * (W - 960))) > 120) scene.add.image(x + hachage(x, 1, 923) * 60, sol - 4, textureArbre(scene, hachage(x, 2, 923) > 0.5 ? 'chenes' : 'ronds')).setOrigin(0.5, 1).setScale(1.6).setTint(aube ? 0x6a5a7a : 0x1e2a3e).setDepth(-1.5).setScrollFactor(0.8);
  for (const x of [P.saule0, 760, 1380, 2190]) scene.add.image(x, sol + 6, textureArbre(scene, 'saules')).setOrigin(0.5, 1).setScale(2.6).setTint(aube ? 0xd8c8b8 : 0x6a7a9a).setDepth(1);
  // l'eau : une vraie surface (le ciel s'y reflète, plus clair au loin, plus sombre devant), des rides qui scintillent
  // et qui suivent le courant. `xl`/`xr` : les bords de l'eau à chaque hauteur (un lit, un canal, un étang).
  const C = aube ? { haut: 0xd8946e, bas: 0x2a3060, ride: 0xffe8b0, rive: 0x2e3420, berge: 0x6a5434 } : { haut: 0x4a6aa0, bas: 0x0a1028, ride: 0xb8d0ff, rive: 0x141c14, berge: 0x2a2218 };
  const melange = (c0, c1, k) => Phaser.Display.Color.GetColor(...[16, 8, 0].map(d => { const a = (c0 >> d) & 255, b = (c1 >> d) & 255; return Math.round(a + (b - a) * k); }));
  const surface = (y0, y1, xl, xr, prof, { courant = null, rides = 30, clair = 1, teintes = null } = {}) => {
    const ge = scene.add.graphics().setDepth(prof);
    // (teintes : plusieurs couleurs du loin vers le près, pour un étang qui reflète tout le ciel de l'aube)
    const teinte = k => { if (!teintes) return melange(C.haut, C.bas, Math.min(1, k / clair)); const t = Math.min(0.999, k) * (teintes.length - 1), i = Math.floor(t); return melange(teintes[i], teintes[i + 1], t - i); };
    for (let y = y0; y < y1; y += 2) { const k = Math.pow((y - y0) / Math.max(1, y1 - y0), 0.7); ge.fillStyle(teinte(k)).fillRect(xl(y), y, xr(y) - xl(y), 2); }
    // les rides : de petits traits clairs qui naissent, brillent et s'effacent, emportés par le courant
    for (let k = 0; k < rides; k++) {
      const y = y0 + 3 + hachage(k, 8, 926 + prof * 10) * (y1 - y0 - 6), x = xl(y) + hachage(k, 9, 926) * (xr(y) - xl(y)), w = 6 + (y - y0) / (y1 - y0 + 1) * 16;
      const ri = scene.add.rectangle(x, y, w, 2, C.ride, 0.5).setDepth(prof + 0.01).setBlendMode(Phaser.BlendModes.ADD);
      scene.tweens.add({ targets: ri, alpha: 0.05, duration: 700 + (k % 7) * 150, yoyo: true, repeat: -1, delay: k * 60 });
      if (courant) scene.tweens.add({ targets: ri, ...courant(x, y), duration: 2600 + (k % 5) * 400, repeat: -1, delay: k * 90 });
    }
    return ge;
  };
  // le sol : la terre, le chemin plus clair, l'herbe en touffes ; coupé par le lit du ruisseau, et qui s'arrête au bord de
  // l'étang (la berge descend jusqu'à l'eau)
  const g = scene.add.graphics().setDepth(2);
  const rives = [[0, P.ruisseau], [P.ruisseauFin, P.ponton + 30]];
  for (const [x0, x1] of rives) {
    g.fillStyle(aube ? 0x4a5a2a : 0x22301e).fillRect(x0, sol - 6, x1 - x0, 80);
    g.fillStyle(aube ? 0x8a7048 : 0x3e3426).fillRect(x0, sol + 20, x1 - x0, 34);
    for (let x = x0; x < x1; x += 9) { const h = 4 + hachage(x, 3, 924) * 8; g.fillStyle(aube ? 0x6a8a3a : 0x2e4a26).fillTriangle(x, sol - 4, x + 3, sol - 4 - h, x + 6, sol - 4); }
    for (let k = 0; k < 40; k++) g.fillStyle(aube ? 0x6a5434 : 0x2a2218).fillRect(x0 + hachage(k, 4, 924 + x0) * (x1 - x0), sol + 22 + hachage(k, 5, 924) * 30, 4, 2);
  }
  // --- le ruisseau : il coupe le chemin. Il vient du fond (entre deux rives d'herbe, de plus en plus étroit vers les
  // collines) et coule vers nous d'un seul tenant, en s'élargissant ; à hauteur du chemin, la terre est entaillée : deux
  // berges en pente descendent jusqu'à l'eau, qui file sous le pont jusqu'au bas de l'écran.
  {
    const a0 = P.ruisseau, b0 = P.ruisseauFin, m = (a0 + b0) / 2, yLoin = sol - 74, yBas = 545;
    // (la demi-largeur de l'eau, du lointain jusqu'à nous, d'une seule courbe ; en bas, l'eau touche presque le bord
    // du chemin coupé, en haut, ce n'est plus qu'un filet)
    const demi = y => 22 + Phaser.Math.Clamp(y - yLoin, 0, yBas - yLoin) * ((b0 - a0) / 2 - 40) / (yBas - yLoin);   // (en perspective : la largeur croît comme la distance au fond)
    const xl = y => m - demi(y), xr = y => m + demi(y);
    // les rives qui fuient vers les collines : une bande d'herbe qui s'élargit et rejoint le chemin à sa hauteur
    const rv = scene.add.graphics().setDepth(1.97);
    for (let y = yLoin - 2; y < sol - 4; y += 2) {
      const u = (y - yLoin) / (sol - 4 - yLoin), w = 4 + u * u * (demi(sol - 4) - demi(y) + 40 - 4);
      for (const sx of [-1, 1]) {
        const bord = sx < 0 ? xl(y) : xr(y);
        rv.fillStyle(aube ? 0x4a5a2a : 0x22301e).fillRect(sx < 0 ? bord - w : bord, y, w, 2);
        rv.fillStyle(C.berge).fillRect(sx < 0 ? bord - 2 - u * 3 : bord, y, 2 + u * 3, 2);   // (le liseré de terre mouillée)
      }
    }
    // l'eau, d'un seul tenant, du lointain jusqu'au bas de l'écran
    surface(yLoin, yBas, xl, xr, 1.96, { rides: 40, clair: 2.2, courant: (x, y) => ({ y: Math.min(yBas - 4, y + 60), x: x + (x - m) * 0.35, scaleX: 1.7 }) });
    // les berges de notre côté : la terre entaillée, en pente du bord du chemin jusqu'à l'eau (plus sombre en bas, des
    // cailloux, des racines, l'herbe qui pend au bord) — elles prolongent le chemin au lieu de le couper net
    const lit = scene.add.graphics().setDepth(2.02);
    for (const sx of [-1, 1]) {
      const bordChemin = sx < 0 ? a0 : b0;
      for (let y = sol - 6; y < yBas; y += 2) {
        const eau = sx < 0 ? xl(y) : xr(y), x0 = Math.min(bordChemin, eau), x1 = Math.max(bordChemin, eau);
        const u = (y - sol + 6) / (yBas - sol + 6);
        lit.fillStyle(melange(C.berge, 0x0a0806, u * 0.55)).fillRect(x0, y, x1 - x0, 2);
        lit.fillStyle(0x000000, 0.35).fillRect(sx < 0 ? x1 - 3 : x0, y, 3, 2);   // (l'ombre au ras de l'eau)
      }
      lit.fillStyle(aube ? 0x4a5a2a : 0x22301e).fillRect(Math.min(bordChemin, bordChemin - sx * 14), sol - 6, 14, 5);   // (l'herbe qui déborde)
      for (let k = 0; k < 6; k++) { const x = bordChemin - sx * (4 + k * 3), h = 4 + hachage(k, 2, 930 + sx) * 6; lit.fillStyle(aube ? 0x6a8a3a : 0x2e4a26).fillTriangle(x, sol - 4, x + 2, sol + h, x + 4, sol - 4); }   // (des brins qui pendent)
      for (let k = 0; k < 10; k++) { const y = sol + hachage(k, 3, 930 + sx) * (yBas - sol - 10), e = sx < 0 ? xl(y) : xr(y), x = bordChemin + (e - bordChemin) * hachage(k, 4, 930 + sx); lit.fillStyle(0x000000, 0.3).fillRect(x, y, 4, 3).fillStyle(0x8a8070, 0.6).fillRect(x, y, 3, 2); }   // (des cailloux)
      for (let k = 0; k < 2; k++) { const y = sol + 10 + k * 18; lit.lineStyle(2, 0x1a120a, 0.8).lineBetween(bordChemin, y, bordChemin + ((sx < 0 ? xl(y) : xr(y)) - bordChemin) * 0.6, y + 8); }   // (des racines)
    }
    // de petits roseaux sur les rives lointaines, de plus en plus petits
    for (const sx of [-1, 1]) for (let k = 0; k < 5; k++) { const y = yLoin + 6 + k * 7, e = 0.5 + k * 0.22; const ro = scene.add.image((sx < 0 ? xl(y) : xr(y)) + sx * (6 + k * 4), y + 2, 'roseauxHD_' + (k % 2)).setOrigin(0.5, 1).setScale(e).setDepth(1.98).setTint(aube ? 0xffffff : 0x8a9ab8); scene.tweens.add({ targets: ro, angle: 2, duration: 1400 + k * 200, yoyo: true, repeat: -1 }); }
    // le reflet de la lune (ou du ciel) qui tremble au milieu du courant
    for (let k = 0; k < 14; k++) { const y = yLoin + 4 + k * 5, ri = scene.add.rectangle(m + (hachage(k, 2, 929) - 0.5) * 10, y, 4 + k * 3, 2, aube ? 0xfff0c0 : 0xe8f0ff, 0.7).setDepth(1.965).setBlendMode(Phaser.BlendModes.ADD); scene.tweens.add({ targets: ri, alpha: 0.15, scaleX: 0.5, duration: 400 + k * 60, yoyo: true, repeat: -1 }); }
    r.ruisseau = { xl, xr };
  }
  // --- le bief : un canal de pierre au pied du moulin ; l'eau y file vite vers la roue (on voit les rides courir)
  {
    const y0 = sol - 54, y1 = sol - 10;
    const mur = scene.add.graphics().setDepth(1.58);
    for (let x = P.bief; x < P.biefFin; x += 22) { const i = Math.floor(x / 22) % 3; mur.fillStyle(0x1a1a1e).fillRect(x, y0 - 8, 22, 9).fillStyle([0x6a6670, 0x5a5660, 0x7a7680][i]).fillRect(x + 1, y0 - 7, 20, 7); }   // la margelle du fond
    surface(y0, y1, () => P.bief, () => P.biefFin, 1.6, { rides: 40, clair: 1.4, courant: (x, y) => ({ x: x + 160, alpha: 0 }) });
    const av = scene.add.graphics().setDepth(1.63);
    for (let x = P.bief; x < P.biefFin; x += 26) { const i = Math.floor(x / 26) % 3; av.fillStyle(0x141418).fillRect(x, y1 - 1, 26, 10).fillStyle([0x7a7680, 0x6a6670, 0x8a8690][i]).fillRect(x + 1, y1, 24, 8); }   // le muret de devant
    // le courant : de longs filets clairs qui filent vers la roue, de plus en plus vite près d'elle, et l'écume qui
    // bouillonne sous les aubes
    for (let k = 0; k < 16; k++) {
      const y = y0 + 6 + (k % 8) * ((y1 - y0 - 12) / 7), l = 26 + (k % 4) * 12, f = scene.add.rectangle(P.bief + hachage(k, 1, 931) * (P.roue - P.bief - 120), y, l, 2, C.ride, 0.55).setDepth(1.61).setBlendMode(Phaser.BlendModes.ADD);
      const aller = () => { f.setPosition(P.bief + hachage(k, 2, 931) * 200, y).setAlpha(0.55); scene.tweens.add({ targets: f, x: P.roue - 40, alpha: 0.1, duration: 1800 + (k % 5) * 260, ease: 'Quad.easeIn', onComplete: aller }); };
      scene.tweens.add({ targets: f, x: P.roue - 40, alpha: 0.1, duration: 1200 + (k % 5) * 200, ease: 'Quad.easeIn', onComplete: aller });
    }
    const ecume = scene.add.graphics().setDepth(1.62);
    for (let k = 0; k < 18; k++) ecume.fillStyle(0xe8f4ff, 0.35 + hachage(k, 3, 932) * 0.4).fillEllipse(P.roue - 70 + hachage(k, 4, 932) * 140, y0 + 2 + hachage(k, 5, 932) * 14, 10 + hachage(k, 6, 932) * 16, 4 + hachage(k, 7, 932) * 4);
    scene.tweens.add({ targets: ecume, alpha: 0.55, duration: 300, yoyo: true, repeat: -1 });
    // la tête du bief : un pilier de pierre et la vanne de bois (une crémaillère, sa manivelle) ; l'eau du ruisseau
    // entre par-dessous en bouillonnant. Au bout, un pilier aussi, et l'eau qui se déverse dans l'étang.
    const tete = scene.add.graphics().setDepth(1.64);
    for (const [x, haut] of [[P.bief - 18, 70], [P.biefFin - 6, 14]]) {
      tete.fillStyle(0x141418).fillRect(x - 2, y1 + 9 - haut - 2, 26, haut + 4);
      for (let yy = y1 + 9 - haut; yy < y1 + 9; yy += 10) for (let xx = x; xx < x + 22; xx += 11) tete.fillStyle([0x7a7680, 0x6a6670, 0x8a8690][(xx + yy) % 3]).fillRect(xx + ((yy / 10) % 2) * 2, yy + 1, 10, 9);
      tete.fillStyle(0x9a96a0).fillRect(x - 3, y1 + 9 - haut - 4, 28, 4);
    }
    const xv = P.bief + 4;
    tete.fillStyle(0x1a1008).fillRect(xv, y0 - 46, 30, 46 + 12).fillStyle(0x6a4a2a).fillRect(xv + 2, y0 - 44, 26, 52);
    for (let k = 0; k < 4; k++) tete.fillStyle(0x4a2e18).fillRect(xv + 2, y0 - 40 + k * 12, 26, 2);   // (les planches de la vanne)
    tete.fillStyle(0x2a2a30).fillRect(xv + 13, y0 - 66, 4, 22).fillStyle(0x5a5a64).fillCircle(xv + 15, y0 - 68, 5).fillStyle(0x2a2a30).fillCircle(xv + 15, y0 - 68, 2);   // (la crémaillère et la manivelle)
    for (let k = 0; k < 10; k++) {
      const b = scene.add.ellipse(xv + 34 + Math.random() * 10, y0 + 6 + (k % 5) * 6, 10, 4, 0xe8f4ff, 0.6).setDepth(1.62);
      scene.tweens.add({ targets: b, x: b.x + 60 + k * 6, alpha: 0, scaleX: 1.8, duration: 900 + k * 70, repeat: -1, delay: k * 90 });
    }
    for (let k = 0; k < 8; k++) {   // (au bout, la petite chute dans l'étang)
      const c = scene.add.rectangle(P.biefFin + 22 + Math.random() * 6, y0 + 4, 3, 6, 0xd8ecff, 0.7).setDepth(1.95);
      scene.tweens.add({ targets: c, y: sol - 30, x: c.x + 8, alpha: 0.1, duration: 500, repeat: -1, delay: k * 70 });
    }
    r.bief = { y0, y1 };
  }
  // --- l'étang : la rive d'en face (herbe sombre, roseaux, le reflet des arbres), la surface où le ciel se reflète, et
  // au lever du soleil, une colonne d'or qui tremble sous lui
  {
    const y0 = sol - 44, x0 = P.biefFin - 2;   // (l'étang commence là où le bief se jette)
    surface(y0, 540, () => x0, () => W, 1.9, { rides: 60, clair: 1.2, teintes: aube ? [0xf0b47a, 0xc07a74, 0x6a4a70, 0x2a2a50] : [0x3a5488, 0x1a2a54, 0x0a1028] });
    const rf = scene.add.graphics().setDepth(1.91);
    // le reflet sombre de la rive d'en face et de ses arbres : des masses renversées, déchirées par les rides
    for (let x = x0; x < W; x += 6) { const h = 10 + fbm(x * 0.02, 1, 933) * 26; for (let y = y0; y < y0 + h; y += 2) if (hachage(x, y, 934) > (y - y0) / h * 0.7) rf.fillStyle(0x000000, (aube ? 0.22 : 0.32) * (1 - (y - y0) / h * 0.6)).fillRect(x, y, 6, 2); }
    rf.fillStyle(C.rive).fillRect(x0, y0 - 5, W - x0, 6);
    for (let x = x0; x < W; x += 7) rf.fillStyle(C.rive).fillTriangle(x, y0 - 4, x + 2, y0 - 9 - hachage(x, 1, 927) * 8, x + 5, y0 - 4);
    // la berge de notre côté, qui descend dans l'eau au pied du ponton
    const bg = scene.add.graphics().setDepth(2.05);
    bg.fillStyle(C.berge).fillPoints([{ x: P.ponton + 30, y: sol - 6 }, { x: P.ponton + 80, y: 528 }, { x: P.ponton + 80, y: 540 }, { x: P.ponton + 30, y: 540 }], true);
    if (aube) {
      r.colonne = [];
      for (let k = 0; k < 26; k++) { const y = y0 + 6 + k * 3.6, w = 14 + k * 3.2, ri = scene.add.rectangle(P.fin + (hachage(k, 3, 928) - 0.5) * w * 0.6, y, w, 2, 0xfff0b0, 0.75).setDepth(1.92).setBlendMode(Phaser.BlendModes.ADD);
        scene.tweens.add({ targets: ri, alpha: 0.2, scaleX: 0.6, duration: 500 + (k % 5) * 120, yoyo: true, repeat: -1, delay: k * 40 }); r.colonne.push(ri); }
      scene.add.image(P.fin, y0 + 40, 'halo').setScale(3, 1.4).setTint(0xffc060).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD).setDepth(1.915);
    }
    // l'eau qui clapote autour de ce qui s'y plante : les poteaux du ponton, les roseaux
    r.ronds = (x, y, l = 18) => { const o = scene.add.ellipse(x, y, l, 4).setStrokeStyle(1, C.ride, 0.6).setDepth(2.31); scene.tweens.add({ targets: o, scaleX: 1.6, scaleY: 1.4, alpha: 0, duration: 1600, repeat: -1, delay: Math.random() * 1600 }); return o; };
  }
  // le moulin, derrière le bief, et sa roue qui tourne dans l'eau
  r.moulin = scene.add.image(P.moulin, sol - 30, 'moulinHD').setOrigin(0.5, 1).setScale(2).setDepth(1.5).setTint(aube ? 0xffe8d0 : 0x9aa4c8);
  r.roue = scene.add.image(P.roue, sol - 92, 'roueMoulinHD').setScale(2).setDepth(1.55).setTint(aube ? 0xffe8d0 : 0x9aa4c8);
  scene.tweens.add({ targets: r.roue, angle: 360, duration: 9000, repeat: -1 });
  r.lucarne = scene.add.image(P.moulin + 52, sol - 230, 'halo').setScale(0.7).setTint(0xffb050).setAlpha(aube ? 0.2 : 0.55).setBlendMode(Phaser.BlendModes.ADD).setDepth(1.6);
  // l'eau qui jaillit sous la roue
  scene.time.addEvent({ delay: 90, loop: true, callback: () => { if (!r.roue.active) return; const e = scene.add.image(P.roue - 30 + Math.random() * 60, sol - 50, 'halo').setScale(0.14 + Math.random() * 0.08).setTint(0xd8f0ff).setAlpha(0.7).setDepth(1.7); scene.tweens.add({ targets: e, y: e.y - 22 - Math.random() * 18, x: e.x + 26, alpha: 0, duration: 650, onComplete: () => e.destroy() }); } });
  // le pont sur le ruisseau (avec sa planche pourrie)
  // (le tablier à hauteur des pieds : on marche dessus ; les poteaux plongent dans le ruisseau)
  r.pont = scene.add.image(P.pont, SOL_PROMENADE - 24, 'pontMoulinHD_casse').setOrigin(0.5, 0).setScale(2).setDepth(2.4);
  for (const x of [P.ruisseau - 6, P.ruisseauFin - 174]) scene.add.image(x, SOL_PROMENADE - 24, 'pontMoulinHD').setOrigin(0, 0).setScale(2).setDepth(2.39).setCrop(0, 0, 90, 44);
  // le ponton et la barque, sur l'étang
  scene.add.image(P.ponton, SOL_PROMENADE - 16, 'pontonHD').setOrigin(0, 0).setScale(2).setDepth(2.4);
  const barque = scene.add.image(P.ponton + 330, sol - 10, 'barqueHD').setOrigin(0.5, 0.5).setScale(2).setDepth(2.3).setTint(aube ? 0xffffff : 0x9aa4c8);
  scene.tweens.add({ targets: barque, y: barque.y + 3, angle: 2, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  // (la barque s'enfonce dans l'eau : sa coque disparaît sous la ligne de flottaison, son reflet tremble dessous)
  const flot = scene.add.graphics().setDepth(2.32); const bas = barque.y + barque.displayHeight / 2 + 4;
  flot.fillStyle(aube ? 0x9a6476 : 0x1e305e, 0.8).fillRect(barque.x - barque.displayWidth / 2 - 4, sol - 2, barque.displayWidth + 8, bas - sol + 2).fillStyle(C.ride, 0.5).fillRect(barque.x - barque.displayWidth / 2 - 2, sol - 2, barque.displayWidth + 4, 2);
  const refl = scene.add.image(barque.x, sol + 14, 'barqueHD').setScale(2, -1.2).setTint(0x000000).setAlpha(0.3).setDepth(1.93);
  scene.tweens.add({ targets: refl, scaleX: 2.05, alpha: 0.18, duration: 900, yoyo: true, repeat: -1 });
  for (const dx of [-60, 0, 60]) r.ronds(barque.x + dx, sol + 2, 30);
  for (const x of [P.ponton + 30, P.ponton + 130, P.ponton + 230, P.ponton + 320]) r.ronds(x, SOL_PROMENADE + 22, 16);
  // les roseaux, au bord de l'eau (certains devant le chemin)
  for (const [x, d, k] of [[P.ruisseau - 30, 2.5, 0], [P.ruisseauFin + 20, 2.5, 1], [P.bief + 20, 1.7, 0], [P.biefFin - 40, 1.7, 1], [P.etang + 60, 2.5, 1], [P.etang + 420, 2.25, 0], [P.etang + 520, 2.25, 1], [560, 9, 0], [1560, 9, 1], [2180, 9, 0]]) {
    const ro = scene.add.image(x, d >= 9 ? 545 : sol - 2, 'roseauxHD_' + k).setOrigin(0.5, 1).setScale(2.2).setDepth(d).setTint(aube ? 0xffffff : 0x8a9ab8);
    scene.tweens.add({ targets: ro, angle: 2, duration: 1500 + (x % 700), yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    if (x > P.ponton && d < 9) r.ronds(x, sol, 26);
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
