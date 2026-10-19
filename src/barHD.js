// (v1.16, planche 43 v3 validée) La salle du petit bar, dans ses trois styles : le mur, un vrai sol en profondeur
// (de y = 340 à 540 : le damier de la brasserie ne monte jamais sur le mur), la passe-plat de la cuisine, l'étagère à
// bouteilles et le comptoir ; les tables, les chaises, et les clients attablés (assis sur leur chaise, à côté de la table).
// Le style vient de la pièce qu'on a embellie (le sol, les murs, les tables, les chaises, le comptoir, les lumières).
  const BOIS_BAR = { taverne: [0x3a2010, 0x6a4424, 0x8a5c34], auberge: [0x4a3018, 0x9a6a3a, 0xc08a50], brasserie: [0x1a0e08, 0x4a2414, 0x6a3420] };
  const SOL_BAR = 340;
  // une chaise, posée au sol ; 'dos' : -1 = le dossier à gauche (le client regarde à droite), 1 = à droite
  const chaiseBar = (s, x, sol, assise, dos = -1, st = 'taverne', d = 3.6) => { const g = s.add.graphics().setDepth(d), [f, m, c] = BOIS_BAR[st];
    const l = 34, x0 = x - l / 2, xd = dos < 0 ? x0 : x0 + l - 7, h = st === 'taverne' ? 0 : 40;
    g.fillStyle(f).fillRect(x0 + 2, assise, 6, sol - assise).fillRect(x0 + l - 8, assise, 6, sol - assise);
    if (h) { g.fillStyle(f).fillRect(xd - 1, assise - h - 2, 9, h + 4).fillStyle(m).fillRect(xd + 1, assise - h, 5, h);
      if (st === 'auberge') g.fillStyle(f).fillRect(xd - 2, assise - h - 6, 11, 6).fillStyle(0x3a5a2a).fillRect(xd, assise - h - 5, 7, 4);
      else g.fillStyle(0x6a1a1a).fillRoundedRect(xd - 2, assise - h + 4, 11, h - 10, 3).fillStyle(0xd8a830).fillCircle(xd + 3, assise - h + 2, 3); }
    g.fillStyle(f).fillRect(x0 - 2, assise - 3, l + 4, 9).fillStyle(st === 'brasserie' ? 0x8a1a1a : m).fillRect(x0, assise - 1, l, 5).fillStyle(c).fillRect(x0, assise - 1, l, 1);
    if (st === 'auberge') g.fillStyle(0xd8c090).fillRect(x0 + 4, assise - 4, l - 8, 3);
    if (st === 'brasserie') g.fillStyle(0xd8a830).fillRect(x0 + 2, sol - 3, 6, 3).fillRect(x0 + l - 8, sol - 3, 6, 3);
    return g; };
  // une table posée au sol (son pied touche 'sol') : ronde en bois, carrée à nappe, ronde de marbre au pied de cuivre
  const tableBar = (s, tx, sol, st = 'taverne', d = 3.6, garnie = true) => { const g = s.add.graphics().setDepth(d), [f, m, c] = BOIS_BAR[st], ty = sol - 40;
    if (st === 'taverne') { g.fillStyle(f).fillRect(tx - 6, ty, 12, 40).fillRect(tx - 22, sol - 5, 44, 5); g.fillStyle(f).fillEllipse(tx, ty, 110, 30).fillStyle(m).fillEllipse(tx, ty - 3, 106, 25).fillStyle(c).fillEllipse(tx - 8, ty - 6, 60, 8); }
    else if (st === 'auberge') { g.fillStyle(f).fillRect(tx - 48, ty, 8, 40).fillRect(tx + 40, ty, 8, 40); g.fillStyle(f).fillRect(tx - 56, ty - 12, 112, 16);
      for (let k = 0; k < 8; k++) g.fillStyle(k % 2 ? 0xf0e8d8 : 0x3a6a3a).fillRect(tx - 54 + k * 13.5, ty - 10, 13.5, 8); g.fillStyle(0x3a6a3a).fillRect(tx - 54, ty - 2, 108, 10); for (let k = 0; k < 8; k++) g.fillStyle(0xf0e8d8).fillTriangle(tx - 54 + k * 13.5, ty + 8, tx - 40.5 + k * 13.5, ty + 8, tx - 47 + k * 13.5, ty + 14); }
    else { g.fillStyle(0x6a4a10).fillRect(tx - 4, ty, 8, 40).fillStyle(0xd8a830).fillRect(tx - 2, ty, 3, 40).fillStyle(0x6a4a10).fillEllipse(tx, sol - 2, 46, 8).fillStyle(0xd8a830).fillEllipse(tx, sol - 3, 40, 5);
      g.fillStyle(0x6a4a10).fillEllipse(tx, ty, 104, 26).fillStyle(0xe8e4dc).fillEllipse(tx, ty - 3, 98, 21).fillStyle(0xb8b4ac).fillEllipse(tx + 14, ty - 2, 30, 6).fillStyle(0xffffff).fillEllipse(tx - 16, ty - 6, 40, 5); }
    if (garnie) { const bougie = st === 'brasserie' ? 0xfff0c0 : 0xffd060; g.fillStyle(0xe8d8b0).fillRect(tx - 2, ty - 26, 5, 14).fillStyle(bougie).fillCircle(tx, ty - 29, 3); s.add.image(tx, ty - 28, 'halo').setScale(0.5).setTint(0xffb050).setAlpha(0.5).setBlendMode(Phaser.BlendModes.ADD).setDepth(d + 0.01); }
    return g; };
  // un client attablé : sa chaise à côté de la table, assis dessus, tourné vers la table
  const attableBar = (s, x, sol, quoi, e = 6.4, dos = -1, st = 'taverne', d = 3.7) => {
    const c = imageCorps(s, x, sol, quoi, e, 'assis').setDepth(d).setFlipX(dos > 0);
    const assise = Math.round(sol - c.displayHeight * 0.18);
    chaiseBar(s, x + dos * 6, sol, assise, dos, st, d - 0.05);
    s.tweens.add({ targets: c, y: sol - 1.5, duration: 900 + (x % 7) * 90, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });   // (un petit mouvement : il respire)
    return c; };
  // la salle entière, dans un style ; renvoie le centre du comptoir (x0)
  const salleBar = (s, st = 'taverne', opts = {}) => {
    const stSol = opts.sol || st, stLum = opts.lumieres || st, stCpt = opts.comptoir || st;   // (chaque pièce a son style : on peut les mélanger)
    creerInterieurHD(s); creerDecorPlaceHD(s); creerHalo(s);
    const W = s.add.graphics().setDepth(0);
    // ——— le mur
    if (st === 'taverne') { s.add.image(0, 0, murInterieur(s, 'murBar', { poteaux: [272, 412], graine: 777 })).setOrigin(0).setScale(2).setTint(0x8a5c3c); }
    else if (st === 'auberge') {
      W.fillStyle(0xe6dcc2).fillRect(0, 0, 960, SOL_BAR);   // la chaux
      for (let k = 0; k < 160; k++) { const x = (k * 97) % 960, y = (k * 53) % 250; W.fillStyle(k % 2 ? 0xd8ccb0 : 0xf0e8d4).fillRect(x, y, 6 + (k % 5) * 3, 2); }
      W.fillStyle(0x4a2c16);   // les colombages
      W.fillRect(0, 54, 960, 12).fillRect(0, 238, 960, 12);
      for (const x of [0, 236, 476, 716, 948]) W.fillRect(x, 54, 12, 196);
      for (const x of [12, 488]) { W.lineStyle(10, 0x4a2c16).lineBetween(x, 238, x + 112, 66).lineBetween(x + 224, 238, x + 112, 66); }
      W.fillStyle(0x3a5a2a).fillRect(0, 250, 960, SOL_BAR - 250).fillStyle(0x2a4420).fillRect(0, 250, 960, 6);   // le soubassement vert
      for (let x = 0; x < 960; x += 40) W.fillStyle(0x2e4c24).fillRect(x, 256, 2, SOL_BAR - 256);
      // une fenêtre à petits carreaux, une jardinière
      W.fillStyle(0x4a2c16).fillRect(286, 92, 140, 120).fillStyle(0x2a3a5a).fillRect(294, 100, 124, 104);
      for (let k = 0; k < 2; k++) for (let j = 0; j < 3; j++) W.fillStyle(0x4a6a9a).fillRect(298 + k * 62, 104 + j * 34, 56, 30);
      W.fillStyle(0xfff4c0, 0.8).fillCircle(390, 124, 8);
      W.fillStyle(0x3a5a2a).fillRect(280, 208, 152, 14); for (let k = 0; k < 9; k++) W.fillStyle([0xe86060, 0xf0e0a0, 0xf0a0c0][k % 3]).fillCircle(288 + k * 17, 204, 6);
      // les fanions
      W.lineStyle(2, 0x2a1a10).lineBetween(0, 24, 960, 24); for (let k = 0; k < 24; k++) W.fillStyle([0x3a6a3a, 0xe8d8b0, 0xc84a3a][k % 3]).fillTriangle(k * 40, 24, k * 40 + 30, 24, k * 40 + 15, 44);
    } else {
      W.fillStyle(0x245a56).fillRect(0, 0, 960, SOL_BAR);   // le vert-bleu profond
      W.fillStyle(0x1a4440).fillRect(0, 0, 960, 14);
      W.lineStyle(3, 0xc8961c); for (const x of [20, 250, 480]) W.strokeRect(x, 40, 200, 170);   // les moulures dorées
      W.lineStyle(1, 0xffd858, 0.6); for (const x of [26, 256, 486]) W.strokeRect(x, 46, 188, 158);
      W.fillStyle(0x3a1c10).fillRect(0, 226, 960, SOL_BAR - 226).fillStyle(0x4a2414).fillRect(0, 232, 960, SOL_BAR - 238);   // la boiserie
      for (let x = 10; x < 960; x += 80) W.lineStyle(2, 0x2a1208).strokeRect(x, 244, 68, SOL_BAR - 256);
      W.fillStyle(0xd8a830).fillRect(0, 226, 960, 4).fillRect(0, SOL_BAR - 6, 960, 3);
      // un grand miroir au cadre doré
      W.fillStyle(0xc8961c).fillRect(272, 58, 156, 136).fillStyle(0x8ab8c0).fillRect(280, 66, 140, 120).fillStyle(0xd8f0f4, 0.5).fillTriangle(284, 70, 340, 70, 284, 150);
    }
    // ——— le sol (de SOL_BAR à 540, en profondeur)
    const S = s.add.graphics().setDepth(0.2);
    if (stSol === 'brasserie') {
      // le damier noir et crème, en perspective : il reste entre SOL_BAR et le bas de l'écran
      // (chaque rang est plus haut et plus large que celui du fond, et les colonnes partent du milieu : la perspective)
      let y = SOL_BAR; for (let r = 0; y < 540; r++) { const h = 10 + r * 3, l = 40 + r * 9;
        for (let k = -14; k <= 14; k++) S.fillStyle((k + r) % 2 ? 0x1e2a28 : 0xd8d0bc).fillRect(480 + k * l - l / 2, y, l + 1, h + 1); y += h; }
      S.fillStyle(0x000000, 0.18).fillRect(0, SOL_BAR, 960, 8);
    } else {
      const bois = stSol === 'auberge' ? [0x9a6a40, 0x8a5c36, 0xaa784a] : [0x6a4428, 0x5e3c22, 0x74492c];
      let y = SOL_BAR; for (let r = 0; y < 540; r++) { const h = 12 + r * 3; S.fillStyle(bois[r % 3]).fillRect(0, y, 960, h); S.fillStyle(0x2a1a10, 0.45).fillRect(0, y + h - 2, 960, 2);
        for (let k = 0; k < 9; k++) S.fillStyle(0x2a1a10, 0.35).fillRect(((k * 131 + r * 57) % 960), y, 2, h - 2); y += h; }
      S.fillStyle(0x000000, 0.25).fillRect(0, SOL_BAR, 960, 6);
      if (stSol === 'auberge') { S.fillStyle(0x7a2a1e).fillEllipse(330, 470, 420, 70).fillStyle(0x9a3a26).fillEllipse(330, 470, 396, 58).lineStyle(3, 0xd8b060).strokeEllipse(330, 470, 360, 46).lineStyle(2, 0x3a5a2a).strokeEllipse(330, 470, 320, 36); }
    }
    vignette(s, stSol === 'brasserie' ? 0.6 : 0.75, 0);
    // ——— les lumières
    if (stLum === 'taverne') for (const x of [250, 460]) { s.add.image(x, 120, 'halo').setScale(3).setTint(0xffa040).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD).setDepth(0.5); const g = s.add.graphics().setDepth(1); g.fillStyle(0x2a1a10).fillRect(x - 6, 60, 12, 20).fillStyle(0xffd060).fillRect(x - 4, 64, 8, 12).lineStyle(2, 0x2a1a10).lineBetween(x, 0, x, 60); }
    else if (stLum === 'auberge') for (const x of [250, 470]) { s.add.image(x, 100, 'halo').setScale(2.6).setTint(0xffc060).setAlpha(0.4).setBlendMode(Phaser.BlendModes.ADD).setDepth(0.5); const g = s.add.graphics().setDepth(1); g.lineStyle(2, 0x2a1a10).lineBetween(x, 0, x, 70); g.fillStyle(0x2a3a1a).fillTriangle(x - 14, 78, x + 14, 78, x, 66).fillRect(x - 11, 78, 22, 26).fillStyle(0xffe08a).fillRect(x - 8, 81, 16, 20).fillStyle(0x2a3a1a).fillRect(x - 13, 104, 26, 4); }
    else { const g = s.add.graphics().setDepth(1); for (const x of [210, 450]) { g.lineStyle(3, 0xc8961c).lineBetween(x, 0, x, 50); g.fillStyle(0xc8961c).fillEllipse(x, 58, 130, 16).fillStyle(0xffd858).fillEllipse(x, 56, 120, 8);
        for (let k = 0; k < 6; k++) { const lx = x - 50 + k * 20; g.fillStyle(0xc8961c).fillRect(lx - 1, 50, 2, 8).fillStyle(0xfff0c0).fillCircle(lx, 48, 4); s.add.image(lx, 48, 'halo').setScale(0.5).setTint(0xffd060).setAlpha(0.7).setBlendMode(Phaser.BlendModes.ADD).setDepth(1.05); }
        s.add.image(x, 120, 'halo').setScale(3.4).setTint(0xffe090).setAlpha(0.3).setBlendMode(Phaser.BlendModes.ADD).setDepth(0.5); } }
    // ——— la passe-plat de la cuisine, à gauche
    const pg = s.add.graphics().setDepth(1.2), cadre = st === 'auberge' ? 0x4a2c16 : st === 'brasserie' ? 0xc8961c : 0x1a0e08;
    pg.fillStyle(cadre).fillRect(30, 120, 170, 120).fillStyle(0x3a2010).fillRect(36, 126, 158, 108);
    s.add.image(115, 210, 'halo').setScale(1.8).setTint(0xff7020).setAlpha(0.5).setBlendMode(Phaser.BlendModes.ADD).setDepth(1.25);
    const cuisinier = s.cuisinierBar = imageCorps(s, 115, 330, { race: 'orc', nom: 'Cuisinier', costume: 'forgeron', habit: 0xece6d8, cheveux: 0x1a1410 }, 7.4).setDepth(1.3); cuisinier.y = 138 + cuisinier.displayHeight;
    const m = s.make.graphics({}, false); m.fillStyle(0xffffff).fillRect(36, 126, 158, 108); cuisinier.setMask(m.createGeometryMask());
    s.tweens.add({ targets: cuisinier, x: 128, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    s.add.graphics().setDepth(1.4).fillStyle(st === 'brasserie' ? 0xd8c8a8 : 0x6a4424).fillRect(24, 234, 182, 12);
    s.add.text(115, 108, 'La cuisine', style(13, '#f3a060', { fontStyle: 'bold', stroke: '#1a0a06', strokeThickness: 4 })).setOrigin(0.5).setDepth(1.5);
    // ——— le bar : l'étagère à bouteilles, le barman, le comptoir (posé au sol à y = 440)
    const x0 = 560, g = s.add.graphics().setDepth(2);
    g.fillStyle(stCpt === 'brasserie' ? 0x1a0e08 : 0x2a1a10).fillRect(x0, 90, 340, 160).lineStyle(3, stCpt === 'brasserie' ? 0xc8961c : 0x1a0e08).strokeRect(x0, 90, 340, 160);
    if (stCpt === 'brasserie') g.fillStyle(0x6a9aa0, 0.55).fillRect(x0 + 6, 96, 328, 148);   // un miroir derrière les bouteilles
    for (let r = 0; r < 3; r++) { g.fillStyle(stCpt === 'brasserie' ? 0xc8961c : 0x5a3a20).fillRect(x0 + 6, 136 + r * 44, 328, 7);
      for (let k = 0; k < 12; k++) { const c = [0x3a6a3a, 0x7a2a2a, 0x8a6a2a, 0x2a3a6a, 0x5a2a5a, 0xc89040][(k * 3 + r) % 6], h = 18 + ((k * 7 + r * 3) % 4) * 4, bx = x0 + 14 + k * 27; g.fillStyle(c).fillRect(bx, 136 + r * 44 - h, 12, h).fillRect(bx + 4, 136 + r * 44 - h - 7, 4, 7); g.fillStyle(0xffffff, 0.25).fillRect(bx + 2, 136 + r * 44 - h + 3, 2, h - 6); } }
    s.add.text(x0 + 170, 82, 'Le petit bar', style(16, stCpt === 'brasserie' ? '#ffd858' : '#f3a060', { fontStyle: 'bold', stroke: '#1a0a06', strokeThickness: 4 })).setOrigin(0.5).setDepth(2.1);
    if (opts.barman !== false) { const barman = s.barmanBar = imageCorps(s, x0 + 150, 336, { race: 'nain', nom: 'Barman', costume: 'forgeron', habit: stCpt === 'brasserie' ? 0x1a1a1a : 0x7a2a2a, cheveux: 0x8a3a1a, barbe: 'pleine' }, 6.4).setDepth(3.2);
      s.tweens.add({ targets: barman, y: 333, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }); }
    const gc = s.add.graphics().setDepth(3.5);
    if (stCpt === 'taverne') { gc.fillStyle(0x4a2c16).fillRect(x0 - 20, 336, 380, 104).fillStyle(0x6a4424).fillRect(x0 - 26, 326, 392, 12); for (let k = 0; k < 7; k++) gc.fillStyle(0x3a2010).fillRect(x0 - 10 + k * 56, 344, 3, 92); }
    else if (stCpt === 'auberge') { gc.fillStyle(0x3a5a2a).fillRect(x0 - 20, 336, 380, 104).fillStyle(0xb88a50).fillRect(x0 - 26, 326, 392, 12).fillStyle(0x8a6034).fillRect(x0 - 26, 336, 392, 4);
      for (let k = 0; k < 6; k++) gc.lineStyle(3, 0x2a4420).strokeRect(x0 - 6 + k * 62, 350, 50, 76); }
    else { gc.fillStyle(0x3a1c10).fillRect(x0 - 20, 336, 380, 104); for (let k = 0; k < 6; k++) gc.lineStyle(2, 0xc8961c).strokeRect(x0 - 6 + k * 62, 350, 50, 76);
      gc.fillStyle(0xc8961c).fillRect(x0 - 26, 324, 392, 14).fillStyle(0xffd858).fillRect(x0 - 26, 324, 392, 3).fillStyle(0xc8961c).fillRect(x0 - 20, 428, 380, 6);
      gc.lineStyle(3, 0xd8a830).lineBetween(x0 + 60, 324, x0 + 60, 296); gc.fillStyle(0xd8a830).fillCircle(x0 + 60, 294, 6).fillRect(x0 + 50, 302, 20, 4); }
    s.add.image(x0 + 330, 330, 'tonneauxHD').setOrigin(0.5, 1).setScale(2).setDepth(3.4);
    return x0; };
