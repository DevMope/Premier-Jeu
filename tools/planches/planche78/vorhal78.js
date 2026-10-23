// Planche 78 : Vorhal'Düm l'Affamé, le nouveau design du joueur. Un géant assis sur un trône de pierre sculptée,
// la capuche vide (personne n'a jamais vu son visage), un immense manteau hérissé, un long bâton noueux coiffé d'un
// crâne de bête, la main levée pleine de magie. Même moteur que les bêtes (ToileHD, lumière en haut à gauche),
// plus un liseré froid : la lueur tourne derrière sa tête.
module.exports = `
  const MAGIE_BLEUE = [0x10264a, 0x1e4a86, 0x3a7ac0, 0x6ab0e8, 0xb0e4ff, 0xf4fcff];
  const MAGIE_VIOLETTE = [0x3a0a5a, 0x6a1a9a, 0x9a3ad8, 0xc070ff, 0xe0b0ff, 0xfff0ff];
  const NEANT = [0x000000, 0x020204, 0x040408, 0x06060c, 0x0a0a12, 0x0e0e18];
  const dansPoly = pts => (x, y) => { const px = x + 0.5, py = y + 0.5; let d = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) d = !d; }
    return d; };
  // un polygone avec une normale choisie (n(x, y) -> [nx, ny, nz])
  const polyN = (pts, n) => { const d = dansPoly(pts); return (x, y) => d(x, y) ? n(x, y) : null; };
  const cyl = (cx, demi, ny = -0.15) => (x, y) => { const nx = Math.max(-0.95, Math.min(0.95, (x + 0.5 - cx) / demi)); return [nx, ny, Math.sqrt(Math.max(0.05, 1 - nx * nx - ny * ny))]; };
  const plat = (ny = -0.3) => () => [0, ny, Math.sqrt(1 - ny * ny)];

  // une vue de la toile décalée vers le bas : ce qu'on y dessine descend de D pixels
  const decale = (t, D) => ({ l: t.l, h: t.h, rampes: t.rampes, dans: (x, y) => t.dans(x, y + D), mat: (x, y) => t.mat(x, y + D), poser: (x, y, m, i) => t.poser(x, y + D, m, i),
    forme: (m, f, o) => t.forme(m, (x, y) => f(x, y - D), o) });
  function vorhalTroneHD(s, { cle = 'vorhal_trone', magie = MAGIE_VIOLETTE } = {}) {
    if (s.textures.exists(cle)) return cle;
    const L = 300, H = 344, cx = 150, t = toileDecor(L, H);
    t.relief = true;
    Object.assign(t.rampes, { trone: rampe(0x353a44), troneS: rampe(0x292d36), robe: rampe(0x202229), manteau: rampe(0x1a1c22), epine: rampe(0x15161c),
      baton: rampe(0x30281f), os: rampe(0xb0a898), griffe: rampe(0x343c48), magie, etoile: MAGIE_BLEUE, neant: NEANT, lisere: rampe(0x6a8a9a) });
    const D = 30, tb = decale(t, D);   // (v2 : le haut du corps descend de 30 : il est assis au fond du trône, plus au bord)
    // la pierre sculptée : un treillis de losanges creusés, une bosse au milieu de chacun
    const treillis = (x0, y0, px = 12, py = 16) => (x, y) => { const dx = ((x - x0) % px + px) % px - px / 2, dy = ((y - y0) % py + py) % py - py / 2;
      const v = Math.abs(dx) / (px / 2) + Math.abs(dy) / (py / 2); return Math.abs(v - 0.85) < 0.13 ? -1.3 : v < 0.3 ? 0.6 : 0; };

    // --- le trône ---
    // le dossier, large, sculpté
    t.forme('troneS', polyN([[52, 40], [248, 40], [248, 300], [52, 300]], plat(-0.2)), { motif: (x, y) => (fbm(x * 0.2, y * 0.2, 4) - 0.5) * 0.8 });
    t.forme('trone', polyN([[46, 32], [254, 32], [254, 44], [46, 44]], plat(-0.7)), { motif: (x, y) => (y === 38 ? -1 : 0) + (x % 8 === 0 ? -0.6 : 0) });
    // les deux montants, cannelés, cerclés de bagues, coiffés d'une boule de pierre
    for (const [x0, x1] of [[38, 66], [234, 262]]) { const m = (x0 + x1) / 2;
      t.forme('trone', polyN([[x0, 306], [x0, 34], [x1, 34], [x1, 306]], cyl(m, 15)), { motif: (x, y) => (y % 44 < 4 ? 0.6 : 0) + (y % 44 === 4 ? -1.2 : 0) + ((x - x0) % 7 === 0 ? -0.7 : 0) });
      t.forme('trone', polyN([[x0 - 4, 24], [x1 + 4, 24], [x1 + 4, 36], [x0 - 4, 36]], cyl(m, 18, -0.5)), { decalage: 0.1 });
      t.forme('trone', ellipsoide(m, 16, 10, 9), { decalage: 0.2 }); t.forme('trone', polyN([[m - 4, 22], [m + 4, 22], [m + 3, 26], [m - 3, 26]], plat()), { decalage: -0.4 }); }
    // les accoudoirs : un bloc massif, la face sculptée dans un cadre, le dessus arrondi, un socle
    for (const [x0, x1] of [[24, 100], [200, 276]]) { const m = (x0 + x1) / 2;
      t.forme('trone', polyN([[x0, 170], [x1, 170], [x1, 300], [x0, 300]], plat(-0.05)), { motif: (x, y) => { const cadre = x < x0 + 6 || x > x1 - 7 || y < 177 || y > 293; const creux = x === x0 + 6 || x === x1 - 7 || y === 177 || y === 293; const rune = Math.abs(x - m) < 1.2 && y > 192 && y < 280 || [[m, 222, m - 20, 200], [m, 222, m + 20, 200], [m, 252, m - 20, 274], [m, 252, m + 20, 274]].some(([ax, ay, bx, by]) => { const dx = bx - ax, dy = by - ay, u = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy))); return Math.hypot(ax + u * dx - x, ay + u * dy - y) < 1.2; });
        return creux ? -1.5 : cadre ? 0.3 : rune ? -1.4 : -0.4 + (fbm(x * 0.25, y * 0.25, 6) - 0.5) * 0.7; } });
      t.forme('trone', (x, y) => { if (x < x0 - 3 || x > x1 + 3 || y < 158 || y > 172) return null; const ny = (y + 0.5 - 165) / 8; return [0, ny, Math.sqrt(Math.max(0.05, 1 - ny * ny))]; }, { decalage: 0.1 });
      t.forme('trone', polyN([[x0 - 4, 298], [x1 + 4, 298], [x1 + 4, 310], [x0 - 4, 310]], plat(-0.4)), { decalage: -0.2 }); }

    // --- le corps ---
    // le manteau, des épaules aux hanches
    tb.forme('manteau', polyN([[86, 102], [98, 86], [124, 74], [176, 74], [202, 86], [214, 102], [208, 140], [194, 182], [106, 182], [92, 140]], cyl(cx, 66, -0.1)), { tramage: true, motif: (x, y) => Math.sin((x - cx) * 0.42 + y * 0.04) * 0.45 });
    // la robe : les genoux sous l'étoffe, puis elle tombe jusqu'au sol et s'étale sur la marche
    const robe = [[104, 206], [196, 206], [208, 214], [216, 226], [218, 240], [214, 254], [222, 278], [238, 302], [256, 320], [44, 320], [62, 302], [78, 278], [86, 254], [82, 240], [84, 226], [92, 214]];
    const demiRobe = y => y < 254 ? 62 : 64 + (y - 254) * 0.6, yG = 236;   // (yG : le haut des genoux)
    t.forme('robe', (x, y) => { if (!dansPoly(robe)(x, y)) return null; const nx = Math.max(-0.9, Math.min(0.9, (x + 0.5 - cx) / (demiRobe(y) + 16))); const ny = y < yG ? -0.6 : 0.05; return [nx, ny, Math.sqrt(Math.max(0.05, 1 - nx * nx - ny * ny))]; },
      { tramage: true, motif: (x, y) => { const ax = Math.abs(x - cx);
        const creux = Math.max(0, 1 - (ax / 40) ** 2);
        if (ax < 40 && y > yG - 10 && y < yG - 6 + 4 * 7 + (5 + 4 * 3) * creux + 3) { for (let k = 0; k < 5; k++) { const yk = yG - 8 + k * 7 + (5 + k * 3) * creux, d = y - yk; if (d >= 0 && d < 2) return -1.1; if (d > -2 && d < 0) return 0.5; } return -0.4 * creux; }   // (l'étoffe tendue entre les genoux)
        if (y < yG) return -0.2 + Math.sin((x - cx) * 0.3) * 0.3;   // (le dessus des cuisses, à plat sur le siège)
        const sg = x < cx ? -1 : 1, w = (7 + fbm(x * 0.03, 3, 8) * 5) * (1 + (y - yG) / 50), u = (x - (cx + sg * 30 + (sg > 0 ? 4 : 0))) / w;   // (les plis qui tombent de chaque genou)
        return Math.sin(u * Math.PI + fbm(x * 0.05, y * 0.02, 5) * 1.5) * 0.95 - (Math.abs(x - cx - 3 - Math.sin(y * 0.05) * 3) < 2.5 + (y - yG) * 0.06 ? 0.8 : 0) + (y > 306 ? Math.sin(x * 0.45) * 0.5 : 0); } });
    for (const sg of [-1, 1]) t.forme('robe', ellipsoide(cx + sg * 36, yG + 6, 25, 11, (x, y) => y <= yG + 6), { bord: false, ombre: false, tramage: true, decalage: 0.25, motif: (x, y) => { const n = Math.hypot((x - cx - sg * 36) / 25, (y - yG - 6) / 11); return y < yG + 2 && n > 0.85 ? -0.5 : 0; } });
    // l'ombre du siège : sous les cuisses, entre les accoudoirs, le fond du trône est dans le noir
    for (let y = 196; y < 212; y++) for (let x = 100; x < 200; x++) if (!t.mat(x, y) || t.mat(x, y) === 'troneS') t.poser(x, y, 'troneS', y < 204 ? 0 : 1);
    // les lambeaux du manteau qui pendent sur le giron
    for (let k = 0; k < 14; k++) { const x = 110 + k * 6.1 + hachage(k, 1, 7) * 3, lg = 10 + hachage(k, 2, 7) * 18, pli = (hachage(k, 4, 7) - 0.5) * 6, w = 2.2 + hachage(k, 5, 7) * 1.6;
      tb.forme(k % 3 ? 'manteau' : 'epine', polyN([[x - w, 176], [x + w, 176], [x + pli * 0.5 + w * 0.5, 176 + lg * 0.6], [x + pli, 176 + lg], [x + pli * 0.5 - w * 0.6, 176 + lg * 0.55]], plat(-0.1)), { decalage: -0.3 + hachage(k, 3, 7) * 0.6 }); }
    // la poitrine : une arête d'épines au milieu
    for (let y = 98; y < 166; y += 7) tb.forme('epine', polyN([[cx - 6 + (y - 98) * 0.04, y], [cx + 6 - (y - 98) * 0.04, y], [cx, y + 9]], plat(-0.4)), { decalage: 0.2 });

    // --- les bras, dans leurs manches ---
    const manche = (pts, ep, dec = 0) => { for (let i = 0; i < pts.length - 1; i++) traitHD(t, 'manteau', [pts[i], pts[i + 1]], ep[i], dec); };
    // à gauche (sa main droite) : le coude posé sur l'accoudoir, la main serrée sur le bâton
    manche([[102, 126], [92, 138], [84, 150], [78, 160]], [13, 12.5, 12], 0.1);
    manche([[76, 160], [70, 156], [66, 150], [64, 146]], [10.5, 10, 9.5], 0.3);
    t.forme('manteau', polyN([[54, 150], [74, 150], [92, 166], [94, 184], [86, 206], [76, 190], [64, 176], [54, 166]], cyl(72, 18, 0.1)), { decalage: -0.25, motif: (x, y) => Math.sin(x * 0.8 + y * 0.1) * 0.5 });
    // à droite (sa main gauche) : le coude sur l'accoudoir, l'avant-bras levé
    manche([[198, 126], [208, 138], [216, 150], [222, 160]], [13, 12.5, 12], 0.1);
    manche([[224, 160], [230, 156], [235, 150], [238, 146]], [10.5, 10, 9.5], 0.3);
    t.forme('manteau', polyN([[228, 150], [248, 150], [248, 168], [238, 184], [222, 204], [208, 186], [208, 166]], cyl(232, 18, 0.1)), { decalage: -0.25, motif: (x, y) => Math.sin(x * 0.8 + y * 0.1) * 0.5 });

    // --- le col hérissé : trois gerbes d'épines tout autour de la capuche ---
    const C = [cx, 86];
    for (const [n, r0, r1, mat, dec, g] of [[42, 24, 94, 'epine', -0.45, 1], [32, 22, 70, 'epine', -0.1, 2], [24, 18, 50, 'manteau', 0.1, 3]]) for (let k = 0; k < n; k++) {
      const a = Math.PI * (1.0 + 1.0 * k / (n - 1)) + (hachage(k, 9, g) - 0.5) * 0.1, cote = Math.abs(Math.cos(a));
      const long = r1 * (0.55 + hachage(k, 4, g) * 0.45) * (0.8 + cote * 0.45), larg = 0.09 + hachage(k, 5, g) * 0.07, tord = (hachage(k, 6, g) - 0.5) * 0.12;
      const pt = (rr, da) => [C[0] + Math.cos(a + da) * rr, C[1] + Math.sin(a + da) * rr * 0.86];
      tb.forme(mat, polyN([pt(r0, -larg), pt(r0 + (long - r0) * 0.5, -larg * 0.5 + tord), pt(long, tord * 2), pt(r0 + (long - r0) * 0.5, larg * 0.5 + tord), pt(r0, larg)], (x, y) => { const dx = x - C[0], dy = y - C[1], d = Math.hypot(dx, dy) || 1; return [dx / d * 0.55, dy / d * 0.55 - 0.15, 0.8]; }), { decalage: dec + hachage(k, 7, g) * 0.45 });
    }
    // les épines qui retombent sur les épaules
    for (const sg of [-1, 1]) for (let k = 0; k < 8; k++) { const x = cx + sg * (34 + k * 7), y = 86 + k * 5, lg = 24 + hachage(k, 8, sg + 3) * 22;
      tb.forme('epine', polyN([[x - 4, y], [x + 4, y], [x + sg * lg * 0.6, y + lg]], (xx, yy) => [sg * 0.5, -0.2, 0.84]), { decalage: hachage(k, 2, sg + 5) * 0.4 - 0.25 }); }

    // --- la capuche, haute et pointue, et dessous le néant ---
    const capuche = [[151, 2], [158, 10], [164, 24], [168, 42], [170, 62], [166, 80], [150, 88], [134, 80], [130, 62], [132, 42], [136, 24], [144, 10]];
    tb.forme('robe', (x, y) => dansPoly(capuche)(x, y) ? (ellipsoide(150, 50, 22, 44)(x, y) || [(x - 150) / 22, 0.4, 0.5]) : null, { decalage: 0.2, motif: (x, y) => (Math.abs(x - 151) < 0.7 && y < 20 ? -1 : 0) + Math.sin((x - 150) * 0.55) * 0.3 });
    tb.forme('neant', polyN([[150, 20], [156, 26], [160, 38], [161, 54], [158, 68], [150, 75], [142, 68], [139, 54], [140, 38], [144, 26]], plat()), { bord: false, ombre: false });
    for (let y = 20; y < 76; y++) for (let x = 136; x < 164; x++) if (tb.mat(x, y) === 'neant') tb.poser(x, y, 'neant', 0);
    for (let y = 16; y < 80; y++) for (let x = 132; x < 168; x++) { if (tb.mat(x, y) !== 'robe') continue; const pres = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1]].some(([dx, dy]) => tb.mat(x + dx, y + dy) === 'neant');
      if (pres) tb.poser(x, y, 'robe', y < 50 ? 4 : y < 66 ? 3 : 1); }

    // --- le bâton noueux, posé sur la marche, et le crâne de bête au sommet ---
    const B = [[44, 320], [48, 292], [45, 258], [50, 224], [52, 192], [56, 160], [60, 130], [64, 100], [68, 72]];
    traitHD(t, 'baton', B, 3.8, 0); for (let i = 1; i < B.length - 1; i += 2) traitHD(t, 'baton', [[B[i][0] - 1, B[i][1] - 12], [B[i][0] + 2, B[i][1]], [B[i][0] - 1, B[i][1] + 12]], 2.2, 0.3);
    for (const [k, r] of [[2, 4.4], [4, 4], [6, 4.2], [7, 3.8]]) t.forme('baton', ellipsoide(B[k][0] + 0.5, B[k][1], r, r * 1.3), { decalage: 0.15, motif: (x, y) => ((x + y) % 4 === 0 ? -0.7 : 0) });
    for (let i = 0; i < B.length - 1; i++) { const [ax, ay] = B[i], [bx, by] = B[i + 1]; for (let u = 0.2; u < 1; u += 0.35) { const x = Math.round(ax + (bx - ax) * u + 1), y = Math.round(ay + (by - ay) * u); if (t.mat(x, y) === 'baton') t.poser(x, y, 'baton', 1); } }
    for (const pts of [[[68, 42], [63, 32], [65, 22]], [[68, 42], [76, 36], [88, 35]], [[67, 44], [59, 39], [57, 29]]]) traitHD(tb, 'baton', pts, 1.6, 0.1);
    // le crâne, tourné vers la droite : la boîte crânienne, le long museau, la mâchoire, les crocs, l'orbite vide, les cornes en arrière
    tb.forme('os', ellipsoide(76, 20, 12, 10), { decalage: 0.1 });
    tb.forme('os', polyN([[80, 13], [104, 18], [107, 23], [84, 27]], (x, y) => [0.1, -0.5, 0.86]), { decalage: 0.05, motif: (x, y) => (x % 5 === 0 ? -0.5 : 0) });
    tb.forme('os', polyN([[82, 29], [103, 27], [101, 31], [83, 33]], plat(0.2)), { decalage: -0.4 });
    for (let x = 84; x < 103; x++) if (x % 3 !== 0) tb.poser(x, 27, 'neant', 0);
    for (let x = 85; x < 102; x += 3) { tb.poser(x, 27, 'os', 5); tb.poser(x, 28, 'os', 4); }
    tb.forme('neant', ellipsoide(80, 18, 3.4, 3.2), { bord: false, ombre: false }); tb.poser(103, 19, 'neant', 0); tb.poser(104, 20, 'neant', 0);
    for (let y = 22; y < 30; y += 2) tb.poser(70, y, 'os', 1);   // (les sutures)
    traitHD(tb, 'os', [[70, 13], [60, 6], [50, 7], [43, 13], [43, 21]], 2.3, 0.2); traitHD(tb, 'os', [[74, 11], [68, 3], [60, 1]], 1.6, 0.2);
    // la main qui serre le bâton (les doigts repliés dessus, les griffes)
    tb.forme('griffe', ellipsoide(66, 112, 6, 9), { decalage: -0.4 });   // (le dos de la main, derrière le bâton)
    for (const [k, y] of [[0, 105], [1, 109.5], [2, 114], [3, 118.5]]) { tb.forme('griffe', ellipsoide(59, y, 8.5 - (k === 3 ? 1.5 : 0), 2.6), { decalage: 0.2 - k * 0.1 });
      tb.poser(50 + (k === 3 ? 1 : 0), Math.round(y), 'os', 4); tb.poser(49 + (k === 3 ? 1 : 0), Math.round(y) + 1, 'os', 3); tb.poser(50 + (k === 3 ? 1 : 0), Math.round(y) + 2, 'os', 2); }
    traitHD(tb, 'griffe', [[66, 104], [60, 99], [55, 100]], 2.2, 0.3); tb.poser(54, 99, 'os', 4); tb.poser(53, 100, 'os', 3);   // (le pouce, par-dessus)
    // --- la main levée, ouverte, griffue, et la magie au creux ---
    tb.forme('griffe', ellipsoide(241, 106, 11, 7), { decalage: 0 });
    for (const pts of [[[232, 102], [226, 90], [224, 80], [226, 72]], [[238, 100], [236, 86], [236, 74], [239, 66]], [[245, 100], [247, 86], [250, 76], [254, 70]], [[250, 104], [258, 94], [263, 86], [266, 82]], [[232, 110], [224, 106], [219, 100]]]) {
      traitHD(tb, 'griffe', pts, 2.3, 0); const [x2, y2] = pts[pts.length - 1], [x1, y1] = pts[pts.length - 2], dx = Math.sign(x2 - x1) || 1; tb.poser(x2 + dx, y2 - 1, 'os', 5); tb.poser(x2 + dx, y2 - 2, 'os', 4); tb.poser(x2 + 2 * dx, y2 - 3, 'os', 3); tb.poser(x2 + 2 * dx, y2 - 4, 'os', 2); }
    for (let y = 68; y < 112; y++) for (let x = 220; x < 266; x++) { const d = Math.hypot(x - 243, y - 88); if (tb.mat(x, y) === 'griffe' && d < 19 && tb.mat(x, y - 1) !== 'griffe') tb.poser(x, y, 'magie', d < 11 ? 3 : 2); }
    // (la flamme elle-même est une image à part, deux fois plus fine : flammeVorhalHD)
    // --- l'agrafe du manteau : une petite étoile froide au milieu de la poitrine ---
    for (const [dx, dy, i] of [[0, 0, 5], [1, 0, 4], [-1, 0, 4], [0, 1, 4], [0, -1, 4], [2, 0, 3], [-2, 0, 3], [0, 2, 3], [0, -2, 3], [3, 0, 2], [-3, 0, 2], [0, 3, 2], [0, -3, 2]]) tb.poser(cx + dx, 96 + dy, 'etoile', i);

    // --- les marches de l'estrade ---
    for (const [y0, y1, m] of [[318, 326, 22], [326, 335, 12], [335, 344, 2]]) t.forme('trone', polyN([[m, y0], [L - m, y0], [L - m, y1], [m, y1]], plat(0.15)), { decalage: -0.3, motif: (x, y) => (y === y0 ? 1.2 : 0) + ((x * 3 + y0) % 41 === 0 ? -1 : 0) });
    // la robe s'étale sur la marche du haut ; le pied du bâton y est posé
    t.forme('robe', polyN([[56, 316], [244, 316], [258, 323], [42, 323]], (x, y) => { const nx = Math.max(-0.9, Math.min(0.9, (x - cx) / 120)); return [nx, -0.2, Math.sqrt(1 - nx * nx - 0.04)]; }), { tramage: true, decalage: -0.3, motif: (x, y) => { const sg = x < cx ? -1 : 1, w = (7 + fbm(x * 0.03, 3, 8) * 5) * 2.6, u = (x - (cx + sg * 30 + (sg > 0 ? 4 : 0))) / w; return Math.sin(u * Math.PI + fbm(x * 0.05, y * 0.02, 5) * 1.5) * 0.7; } });
    traitHD(t, 'baton', [[44, 318], [44, 323]], 3, -0.2);

    // --- le liseré froid : la lueur qui tourne derrière sa tête accroche le haut de la capuche et des épines ---
    const pris = [];
    for (let y = 1; y < 200; y++) for (let x = 1; x < L - 1; x++) { const m = t.mat(x, y); if (!m || m === 'neant' || m === 'magie' || m === 'etoile' || m === 'os' || m.startsWith('trone')) continue;
      const d = Math.hypot(x - cx, (y - 44 - D) * 1.1); if (d > 100) continue;
      if (!t.mat(x, y - 1) || (t.mat(x, y - 1) || '').startsWith('trone')) pris.push([x, y, d]); }
    for (const [x, y, d] of pris) t.poser(x, y, 'lisere', d < 50 ? 3 : d < 80 ? 2 : 1);

    t.contour(); t.texture(s, cle); return cle;
  }
  // La flamme de pouvoir au creux de sa main : quatre images qui bouclent, deux fois plus fines que lui.
  // Des langues de feu qui montent et se séparent, un cœur presque blanc, des braises qui s'échappent.
  function flammeVorhalHD(s, k, { magie = MAGIE_VIOLETTE, cle = 'vorhal_flamme' } = {}) {
    const nom = cle + '_' + k; if (s.textures.exists(nom)) return nom;
    const W = 64, Hf = 100, t = new ToileHD(W, Hf), bx = 32, by = 92; t.rampes.f = magie;
    for (let y = 0; y < Hf; y++) for (let x = 0; x < W; x++) {
      const h = (by - y) / 88; if (h < -0.08 || h > 1) continue;
      const ondule = Math.sin(y * 0.12 + k * 1.57) * 3.4 * Math.max(0, h) + Math.sin(y * 0.27 - k * 1.57) * 1.6 * h;
      const larg = 30 * Math.sqrt(Math.max(0, h + 0.08)) * Math.pow(Math.max(0, 1 - h), 1.25) + 2 * (1 - h); if (larg < 0.6) continue;
      const nx = (x + 0.5 - bx - ondule) / larg;
      const n = fbm(x * 0.1, y * 0.065 + k * 0.55, 7, 3), langues = Math.sin(nx * 5 + n * 6 + k * 0.8) * 0.3 * h;
      const I = (1 - Math.abs(nx) ** 1.4) * (1 - h * 0.5) - (n - 0.5) * 1.2 * (0.2 + h) + langues - h * 0.15;
      if (!(I >= 0.1)) continue;
      let i = I > 0.8 ? 5 : I > 0.64 ? 4 : I > 0.48 ? 3 : I > 0.33 ? 2 : I > 0.2 ? 1 : 0;
      if (i < 5 && (I * 10) % 1 > (BAYER[y % 4][x % 4] + 0.5) / 16 + 0.55) i++;   // (un peu de tramage aux frontières)
      t.poser(x, y, 'f', i);
    }
    for (let j = 0; j < 10; j++) { const x = Math.round(bx + (hachage(j, k, 3) - 0.5) * 40), y = Math.round(4 + hachage(j, 9, k + 1) * 30) ; if (y > 0 && !t.mat(x, y)) { t.poser(x, y, 'f', 3 + (j % 3)); if (j % 2) t.poser(x, y + 1, 'f', 2); } }
    t.texture(s, nom); return nom;
  }
`;
