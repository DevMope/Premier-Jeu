// Planche 79 : l'ogre du péage (il ne peut plus s'appeler troll : c'est un peuple du jeu).
// Un ogre ventru, deux fois plus grand qu'un homme, une marmite cabossée pour casque, un tablier de cuir rapiécé,
// la caisse du péage à la ceinture, une massue taillée dans un poteau de pont. Il regarde à gauche (la maison arrive
// de la gauche). Dessiné à la finesse des personnages (cel, relief, contour), en plusieurs poses : il marche vraiment.
module.exports = `
  const dansP = pts => (x, y) => { const px = x + 0.5, py = y + 0.5; let d = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) d = !d; }
    return d; };
  const polyO = (pts, n) => { const d = dansP(pts); return (x, y) => d(x, y) ? n(x, y) : null; };
  const cylO = (cx, demi, ny = -0.1) => (x, y) => { const nx = Math.max(-0.95, Math.min(0.95, (x + 0.5 - cx) / demi)); return [nx, ny, Math.sqrt(Math.max(0.05, 1 - nx * nx - ny * ny))]; };
  // un membre en deux segments, épais à la racine
  const membre = (t, mat, a, b, c, e1, e2, dec = 0) => { traitHD(t, mat, [a, b], e1, dec); traitHD(t, mat, [b, c], e2, dec); };

  // pose = { jambes: 'droit' | 'pas1' | 'pas2', bras: 'epaule' | 'leve' | 'piece', visage: 'colere' | 'joie' | 'larmes' | 'neutre', souffle: 0 | 1 }
  function ogreHD(s, { jambes = 'droit', bras = 'epaule', visage = 'colere', souffle = 0 } = {}) {
    const cle = ['ogre', jambes, bras, visage, souffle].join('_'); if (s.textures.exists(cle)) return cle;
    const L = 200, H = 300, t = new ToileHD(L, H); t.relief = true; t.cel = true;
    Object.assign(t.rampes, { peau: rampe(0xc8906a), joue: rampe(0xd0705a), nez: rampe(0xc85a4a), ongle: rampe(0x6a5040), dent: rampe(0xe0d4b0),
      gilet: rampe(0x8a3a2a), cuir: rampe(0x7a5838), rapiece: rampe(0x9a7a48), rapiece2: rampe(0x5a4a3e), corde: rampe(0xb89a5a),
      marmite: rampe(0x4a4e56), bois: rampe(0x8a6a44), boisF: rampe(0x6a4e32), fer: rampe(0x6a6e78), laiton: rampe(0xc8a040), poil: rampe(0x5a3a24),
      oeil: [0x1a0e08, 0x2a180c, 0x6a4a1a, 0xc89a3a, 0xf0e8d0, 0xffffff], larme: [0x2a5a8a, 0x4a8ac0, 0x6ab0e0, 0x9ad0f0, 0xc8ecff, 0xffffff] });
    const sol = 296, dy = souffle ? 1 : 0;   // (il respire : le haut du corps monte d'un pixel)
    // --- les jambes : courtes et massives, les pieds nus, larges, aux orteils ronds ---
    const J = { droit: [[[118, 226], [122, 258], [124, 286]], [[88, 226], [84, 258], [82, 286]]],
      pas1: [[[118, 226], [132, 256], [140, 284]], [[88, 226], [80, 254], [70, 286]]],
      pas2: [[[118, 226], [112, 254], [108, 282]], [[88, 226], [90, 258], [94, 286]]] }[jambes];
    const pied = (x, y, dev, mat = 'peau', dec = 0) => { t.forme(mat, ellipsoide(x - 8, y + 3, 17, 8, (xx, yy) => yy <= sol), { decalage: dec });
      for (let k = 0; k < 4; k++) t.forme(mat, ellipsoide(x - 22 + k * 5, y + 6, 3.4, 3), { decalage: dec + 0.1 });
      for (let k = 0; k < 4; k++) { t.poser(x - 24 + k * 5, y + 5, 'ongle', 3); t.poser(x - 23 + k * 5, y + 5, 'ongle', 4); } };
    // la jambe du fond, plus sombre
    const [fond, devant] = J;
    membre(t, 'peau', fond[0], fond[1], fond[2], 13, 11, -0.6); pied(fond[2][0], fond[2][1] + 2, 0, 'peau', -0.6);
    // le bras du fond (sa main gauche) : il pend, la main tenant la caisse du péage... ou il aide à lever la massue
    const BF = bras === 'leve' ? [[146, 104 - dy], [158, 70], [128, 34]] : bras === 'piece' ? [[146, 104 - dy], [164, 150], [160, 196]] : [[146, 104 - dy], [166, 150], [162, 194]];
    membre(t, 'peau', BF[0], BF[1], BF[2], 12, 10, -0.5);
    t.forme('peau', ellipsoide(BF[2][0], BF[2][1] + 4, 10, 9), { decalage: -0.5 });
    // --- le ventre, la poitrine, les épaules voûtées ---
    t.forme('peau', ellipsoide(104, 172 - dy, 60, 60), { motif: (x, y) => (y > 186 && Math.abs(x - 98) < 3 && y < 196 ? -1.2 : 0) });   // (le nombril)
    t.forme('peau', ellipsoide(114, 110 - dy, 60, 42), { decalage: 0.1 });
    t.forme('peau', ellipsoide(150, 96 - dy, 26, 22), { bord: false, ombre: false, decalage: -0.3 });   // (le haut du dos voûté)
    // les poils de la poitrine
    for (let k = 0; k < 26; k++) { const x = 80 + Math.round(hachage(k, 1, 5) * 50), y = 102 + Math.round(hachage(k, 2, 5) * 34) - dy; if (t.mat(x, y) === 'peau') { t.poser(x, y, 'poil', 2); t.poser(x + 1, y + 1, 'poil', 1); } }
    // le dos voûté, et la grosse bandoulière de cuir qui tient la caisse du péage
    traitHD(t, 'cuir', [[84, 86 - dy], [110, 140 - dy], [132, 206 - dy]], 4.2, 0.1);
    for (let k = 0; k < 6; k++) { const u = k / 5, x = Math.round(84 + (132 - 84) * u + Math.sin(u * 3) * 4), y = Math.round(86 + 120 * u - dy); t.poser(x, y, 'laiton', 4); }   // (les rivets)
    // --- le tablier de cuir rapiécé, la ceinture de corde, la caisse du péage, les trophées ---
    t.forme('cuir', polyO([[56, 206], [152, 206], [158, 236], [150, 250], [118, 246], [96, 252], [64, 246], [52, 232]], cylO(104, 60, 0.1)), { motif: (x, y) => (y % 9 === 0 ? -0.6 : 0) });
    t.forme('rapiece', polyO([[74, 214], [92, 214], [92, 230], [74, 230]], cylO(83, 10)), { motif: (x, y) => ((x === 74 || x === 91 || y === 214 || y === 229) && (x + y) % 2 ? -1.4 : 0) });
    t.forme('rapiece2', polyO([[118, 222], [136, 220], [138, 236], [120, 238]], cylO(128, 10)), { motif: (x, y) => ((x === 119 || x === 136 || y === 221) && (x + y) % 2 ? -1.4 : 0) });
    traitHD(t, 'corde', [[50, 204 - dy], [100, 210 - dy], [158, 204 - dy]], 3.4, 0.2);
    for (let x = 52; x < 158; x += 4) { const y = Math.round(204 - dy + 6 * (1 - ((x - 104) / 54) ** 2)); if (t.mat(x, y) === 'corde') t.poser(x, y, 'corde', 1); }
    // la caisse du péage (une boîte de chêne cerclée de fer, sa fente, son cadenas), et ce qu'il a pris aux voyageurs : des clés, un fer à cheval, une clochette
    t.forme('bois', polyO([[104, 212], [128, 212], [128, 234], [104, 234]], cylO(116, 14)), { motif: (x, y) => (x % 6 === 0 ? -0.5 : 0) });
    for (const y of [214, 231]) traitHD(t, 'fer', [[104, y], [128, y]], 1.1, 0.2);
    for (let x = 110; x < 122; x++) t.poser(x, 219, 'fer', 0);
    t.forme('laiton', ellipsoide(116, 238, 3.4, 3), { decalage: 0.3 }); traitHD(t, 'laiton', [[114, 236], [114, 233], [118, 233], [118, 236]], 0.8, 0.3);
    traitHD(t, 'fer', [[72, 208], [70, 220]], 0.8); for (const [dx, dy2] of [[-2, 0], [2, 3], [-1, 6]]) traitHD(t, 'fer', [[70, 220], [70 + dx * 2, 226 + dy2]], 0.9, 0.3);
    t.forme('fer', (x, y) => { const d = Math.hypot(x + 0.5 - 146, y + 0.5 - 220); return d < 6 && d > 3.4 && y > 216 ? [0, -0.4, 0.9] : null; });   // (le fer à cheval)
    t.forme('laiton', ellipsoide(58, 216, 4, 4.4), { decalage: 0.3 }); t.poser(58, 220, 'fer', 0);   // (la clochette)
    // la jambe de devant, et son pied
    membre(t, 'peau', devant[0], devant[1], devant[2], 14, 12, 0); pied(devant[2][0], devant[2][1] + 2, 0);
    // --- la tête : petite sur ce grand corps, jetée en avant ; la mâchoire énorme ---
    const hx = 60, hy = 66 - dy;
    t.forme('peau', ellipsoide(hx + 18, hy + 28, 20, 18), { decalage: -0.2 });   // (le cou, épais comme une souche)
    t.forme('peau', ellipsoide(hx + 30, hy + 2, 10, 12), { decalage: -0.1 }); t.forme('peau', ellipsoide(hx + 30, hy + 2, 5, 7), { decalage: -0.6, ombre: false });   // (l'oreille en chou-fleur)
    t.forme('laiton', (x, y) => { const d = Math.hypot(x + 0.5 - (hx + 30), y + 0.5 - (hy + 14)); return d < 3.6 && d > 1.8 ? [0, 0, 1] : null; });   // (l'anneau de laiton)
    t.forme('peau', ellipsoide(hx, hy, 26, 26), { decalage: 0.15 });
    const ouvert = visage === 'colere' || visage === 'joie';
    t.forme('peau', ellipsoide(hx - 6, hy + 20 + (ouvert ? 2 : 0), 25, 14), { decalage: 0 });   // (la mâchoire, en avant)
    // la bouche : fendue d'une oreille à l'autre, les dents de travers ; deux crocs du bas qui dépassent
    if (ouvert) { t.forme('nez', polyO([[hx - 28, hy + 16], [hx + 6, hy + 14], [hx + 2, hy + 24], [hx - 24, hy + 25]], () => [0, 0, 1]), { bord: false, ombre: false, decalage: -2 });
      for (let x = hx - 26; x < hx + 4; x += 4) { t.forme('dent', polyO([[x, hy + 15], [x + 3, hy + 15], [x + 2, hy + 19]], () => [0, -0.3, 0.9])); }
      if (visage === 'joie') for (let x = hx - 24; x < hx; x += 5) t.forme('dent', polyO([[x, hy + 25], [x + 3, hy + 25], [x + 1.5, hy + 21]], () => [0, -0.3, 0.9])); }
    else for (let x = hx - 26; x < hx + 4; x++) { const y = Math.round(hy + 18 + ((x - (hx - 11)) / 15) ** 2 * (visage === 'larmes' ? 4 : -1)); t.poser(x, y, 'peau', 0); }
    t.forme('dent', polyO([[hx - 24, hy + 18], [hx - 19, hy + 18], [hx - 22, hy + 9]], () => [0, -0.5, 0.8])); t.forme('dent', polyO([[hx - 4, hy + 17], [hx + 1, hy + 17], [hx - 2, hy + 9]], () => [0.2, -0.5, 0.8]));
    // le gros nez rouge, en patate ; les joues
    t.forme('nez', ellipsoide(hx - 22, hy + 4, 10, 9), { decalage: 0.3 }); t.forme('nez', ellipsoide(hx - 27, hy + 9, 4, 3), { decalage: -0.8, ombre: false });
    t.forme('joue', ellipsoide(hx - 2, hy + 8, 7, 5), { bord: false, ombre: false, decalage: -0.2 });
    for (const [x, y] of [[hx - 8, hy - 16], [hx + 14, hy + 4], [hx - 30, hy + 2]]) t.forme('joue', ellipsoide(x, y, 1.8, 1.8), { decalage: -0.2, ombre: false });   // (les verrues)
    // les petits yeux enfoncés sous l'arcade lourde, et ses sourcils
    const yo = hy - 8;
    for (const ox of [hx - 14, hx + 2]) { t.forme('oeil', ellipsoide(ox, yo, 3.6, 3), { bord: false, ombre: false, decalage: 1 }); t.forme('oeil', ellipsoide(ox - 1, yo + 0.5, 1.6, 1.8), { bord: false, ombre: false, decalage: -3 }); t.poser(Math.round(ox - 2), yo - 1, 'oeil', 5); }
    const fronce = visage === 'colere' ? 1 : visage === 'larmes' ? -1 : 0;
    for (const [ox, sg] of [[hx - 14, -1], [hx + 2, 1]]) traitHD(t, 'poil', [[ox - 6, yo - 5 - fronce * (sg < 0 ? -1 : 1) * 0], [ox + 5, yo - 5 + fronce * 2 * (sg < 0 ? 1 : -1)]], 1.8, 0);
    if (visage === 'larmes') for (const ox of [hx - 16, hx]) for (let j = 0; j < 9; j++) t.poser(ox, yo + 4 + j, 'larme', 3 + (j % 2));
    // les quelques cheveux, et la marmite cabossée enfoncée sur le crâne en guise de casque
    t.forme('marmite', polyO([[hx - 28, hy - 14], [hx - 22, hy - 30], [hx + 22, hy - 32], [hx + 28, hy - 14]], cylO(hx, 28, -0.2)), { motif: (x, y) => (Math.hypot(x - (hx + 8), y - (hy - 24)) < 5 ? -0.9 : 0) });   // (une bosse)
    t.forme('marmite', polyO([[hx - 33, hy - 16], [hx + 32, hy - 16], [hx + 30, hy - 11], [hx - 31, hy - 11]], cylO(hx, 33, -0.6)), { decalage: 0.2 });
    traitHD(t, 'fer', [[hx + 24, hy - 26], [hx + 34, hy - 30], [hx + 36, hy - 22]], 1.3, 0.2);   // (l'anse)
    for (let k = 0; k < 5; k++) traitHD(t, 'poil', [[hx + 22 + k * 2, hy - 10], [hx + 26 + k * 3, hy - 2 + k]], 0.7, 0);
    // --- le bras de devant (sa main droite) et la massue : un poteau de pont, carré, cerclé de fer, hérissé de clous ---
    const massue = (a, b, ep = 7) => { const [ax, ay] = a, [bx, by] = b, ux = bx - ax, uy = by - ay, l = Math.hypot(ux, uy), nx = -uy / l, ny = ux / l;
      const coin = (u, e) => [ax + ux * u + nx * e, ay + uy * u + ny * e];
      t.forme('boisF', polyO([coin(0, -ep * 0.6), coin(0, ep * 0.6), coin(1, ep), coin(1, -ep)], (x, y) => [nx * 0.5, ny * 0.5 - 0.2, 0.8]), { motif: (x, y) => { const e = (x + 0.5 - ax) * nx + (y + 0.5 - ay) * ny; return Math.abs(e % 4) < 0.7 ? -0.6 : 0; } });
      for (const u of [0.55, 0.85]) traitHD(t, 'fer', [coin(u, -ep - 0.5), coin(u, ep + 0.5)], 1.4, 0.2);
      for (const [u, e] of [[0.68, -ep], [0.72, ep], [0.95, -ep * 0.6], [0.78, -ep * 0.9], [0.92, ep * 0.9]]) { const [px, py] = coin(u, e * 1.15); t.poser(Math.round(px), Math.round(py), 'fer', 4); t.poser(Math.round(px + nx), Math.round(py + ny), 'fer', 2); } };
    if (bras === 'leve') {   // (la massue levée à deux mains, au-dessus de la marmite)
      massue([120, 40], [20, 2], 8);
      membre(t, 'peau', [74, 98 - dy], [70, 64], [108, 34], 13, 11, 0.1);
      t.forme('peau', ellipsoide(112, 36, 10, 9), { decalage: 0.1 }); t.forme('peau', ellipsoide(130, 34, 9, 8), { decalage: -0.2 });
    } else if (bras === 'piece') {   // (il mord la pièce : la massue posée contre lui, la main à la bouche)
      massue([44, 294], [70, 196], 7);
      membre(t, 'peau', [74, 98 - dy], [44, 132], [40, 86], 13, 11, 0.1);
      t.forme('peau', ellipsoide(40, 82, 9, 8), { decalage: 0.1 }); t.forme('laiton', ellipsoide(33, 80, 3.4, 3.4), { decalage: 0.6, ombre: false });
    } else {   // (appuyé sur sa massue, plantée devant lui comme une canne)
      massue([26, 294], [32, 172], 8);
      membre(t, 'peau', [74, 98 - dy], [52, 140 - dy], [34, 168 - dy], 12, 13, 0.1);
      traitHD(t, 'joue', [[60, 120 - dy], [66, 128 - dy]], 0.8, -0.3);   // (une vieille cicatrice)
      t.forme('peau', ellipsoide(33, 170 - dy, 10, 9), { decalage: 0.1 });
      for (const y of [166, 170, 174]) { t.poser(25, y - dy, 'peau', 0); t.poser(26, y - dy, 'peau', 0); }   // (les doigts serrés sur le bois)
    }
    t.contour(); t.texture(s, cle); return cle;
  }
`;
