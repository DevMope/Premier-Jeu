// (v1.22, planche 49 v2) Les oiseaux messagers : le pigeon et le corbeau (posé, ailes hautes, ailes basses),
// l'aigle du Conseil de profil vers la droite (trois battements, posé). Faits comme les objets du jeu.
function creerOiseauxMessagers(s) { if (s.textures.exists('pigeonPose')) return;
  // --- le petit oiseau (pigeon ou corbeau) ---
  const petit = (cle, l, h, base, cou, bec, oeil, aile) => {
    const t = toileObjet(l, h); t.rampes.plume = rampe(base); t.rampes.cou = rampe(cou); t.rampes.bec = rampe(bec); t.rampes.patte = rampe(oeil ? 0x3a3a44 : 0xd0705a);
    if (aile === 'pose') {
      // posé : le corps redressé, la queue qui descend en arrière, deux pattes fines bien sur le rebord
      const cx = 13, cy = 11;
      t.forme('plume', polygoneHD([[cx + 4, cy + 1], [cx + 11, cy + 5], [cx + 10, cy + 8], [cx + 3, cy + 5]]), { motif: (x, y) => (x % 2 ? -0.4 : 0) });
      t.forme('plume', ellipsoide(cx, cy, 6.4, 5));
      t.forme('cou', ellipsoide(cx - 4, cy - 4, 3.2, 3.4), { decalage: 0.3 });
      t.forme('plume', ellipsoide(cx - 5, cy - 7, 2.8, 2.6), { decalage: 0.5 });
      t.poser(cx - 8, cy - 7, 'bec', 3); t.poser(cx - 9, cy - 7, 'bec', 4); t.poser(cx - 6, cy - 8, 'encre', 0); if (oeil) t.poser(cx - 6, cy - 8, 'flamme', 4);
      t.forme('plume', polygoneHD([[cx - 3, cy - 3], [cx + 5, cy - 1], [cx + 9, cy + 4], [cx + 1, cy + 3]]), { decalage: -0.3 });
      for (const [x, y] of [[cx + 3, cy + 1], [cx + 5, cy + 2], [cx + 7, cy + 3]]) t.poser(x, y, 'plume', 1);
      for (const dx of [-2, 1]) { for (let y = cy + 4; y <= h - 2; y++) t.poser(cx + dx, y, 'patte', 2); for (const k of [-1, 0, 1]) t.poser(cx + dx + k, h - 1, 'patte', 3); }
      if (!oeil) { t.poser(cx + 1, cy + 5, 'parchemin', 4); t.poser(cx + 2, cy + 5, 'parchemin', 3); t.poser(cx + 2, cy + 6, 'tissuRouge', 4); }
      t.contour(); t.texture(s, cle); return; }
    const cy = aile === 'pose' ? 11 : 12, cx = aile === 'pose' ? 12 : 14;
    // l'aile du fond (en vol), plus sombre
    if (aile === 'haut') t.forme('plume', polygoneHD([[cx - 2, cy - 2], [cx + 2, cy - 3], [cx + 6, cy - 11], [cx + 2, cy - 10]]), { decalage: -1.2 });
    if (aile === 'bas') t.forme('plume', polygoneHD([[cx - 2, cy + 1], [cx + 3, cy + 1], [cx + 5, cy + 8], [cx + 1, cy + 7]]), { decalage: -1.2 });
    // la queue en éventail, le corps, le cou, la tête
    t.forme('plume', polygoneHD([[cx + 5, cy - 1], [cx + 12, cy - 3], [cx + 13, cy + 1], [cx + 6, cy + 3]]), { motif: (x, y) => (x % 2 ? -0.4 : 0) });
    for (let k = 0; k < 3; k++) t.poser(cx + 12, cy - 2 + k, 'plume', 0);
    t.forme('plume', ellipsoide(cx, cy, 7, 4.4));
    t.forme('cou', ellipsoide(cx - 5, cy - 3, 3, 3.4), { decalage: 0.3 });
    t.forme('plume', ellipsoide(cx - 7, cy - 5.5, 2.8, 2.6), { decalage: 0.5 });
    t.poser(cx - 10, cy - 5, 'bec', 3); t.poser(cx - 11, cy - 5, 'bec', 4); t.poser(cx - 8, cy - 6, 'encre', 0); if (oeil) t.poser(cx - 8, cy - 6, 'flamme', 4);
    // l'aile près de nous
    if (aile === 'pose') { t.forme('plume', polygoneHD([[cx - 3, cy - 2], [cx + 6, cy - 2], [cx + 9, cy + 1], [cx, cy + 3]]), { decalage: -0.3 }); for (const x of [cx + 2, cx + 4, cx + 6]) t.poser(x, cy, 'plume', 1);
      for (const dx of [-2, 1]) { trait(t, 'patte', cx + dx, cy + 4, cx + dx, h - 2, 0.5); t.poser(cx + dx - 1, h - 1, 'patte', 2); t.poser(cx + dx, h - 1, 'patte', 2); t.poser(cx + dx + 1, h - 1, 'patte', 2); } }
    if (aile === 'haut') { t.forme('plume', polygoneHD([[cx - 4, cy - 1], [cx + 3, cy - 1], [cx + 10, cy - 11], [cx + 6, cy - 12], [cx + 2, cy - 11], [cx - 2, cy - 7]]), { motif: (x, y) => ((x + y) % 3 === 0 ? -0.5 : 0) });
      for (const [a, b] of [[cx + 4, cy - 8], [cx + 6, cy - 9], [cx + 8, cy - 10]]) t.poser(a, b, 'plume', 0); }
    if (aile === 'bas') { t.forme('plume', polygoneHD([[cx - 4, cy], [cx + 3, cy], [cx + 7, cy + 10], [cx + 3, cy + 11], [cx - 1, cy + 9], [cx - 3, cy + 4]]), { motif: (x, y) => ((x + y) % 3 === 0 ? -0.5 : 0) });
      for (const [a, b] of [[cx + 2, cy + 8], [cx + 4, cy + 9], [cx + 5, cy + 7]]) t.poser(a, b, 'plume', 0);
      t.poser(cx + 1, cy + 4, 'patte', 2); t.poser(cx + 2, cy + 4, 'patte', 2); }
    // le petit rouleau à la patte (le pigeon seulement)
    if (cle.startsWith('pigeon')) { const ry = aile === 'pose' ? h - 5 : cy + 4; t.forme('parchemin', (x, y) => (x >= cx - 1 && x <= cx + 3 && y >= ry && y <= ry + 1 ? [0, -0.3, 0.9] : null), { decalage: 0.3 }); t.poser(cx + 1, ry, 'tissuRouge', 4); t.poser(cx + 1, ry + 1, 'tissuRouge', 3); }
    t.contour(); t.texture(s, cle); };
  petit('pigeonPose', 26, 20, 0x8a8aa0, 0x5a8a7a, 0xe0a050, false, 'pose');
  petit('pigeonVolH', 30, 26, 0x8a8aa0, 0x5a8a7a, 0xe0a050, false, 'haut');
  petit('pigeonVolB', 30, 26, 0x8a8aa0, 0x5a8a7a, 0xe0a050, false, 'bas');
  petit('corbeauPose', 26, 20, 0x2a2a36, 0x34344a, 0x3a3a44, true, 'pose');
  petit('corbeauVolH', 30, 26, 0x2a2a36, 0x34344a, 0x3a3a44, true, 'haut');
  petit('corbeauVolB', 30, 26, 0x2a2a36, 0x34344a, 0x3a3a44, true, 'bas');
  // --- l'aigle du Conseil, de profil, tourné vers la droite ---
  const aigle = (cle, aile, pose = false) => {
    const L = 64, H = 46, t = toileObjet(L, H);
    t.rampes.plume = rampe(0x7a4a22); t.rampes.fonce = rampe(0x4a2c14); t.rampes.blanc = rampe(0xe8e4d8); t.rampes.bec = rampe(0xe8b020); t.rampes.sac = rampe(0x9a7a4a);
    const cx = 30, cy = pose ? 24 : 22;
    const plumes = (pts, mat = 'plume', dec = 0) => t.forme(mat, polygoneHD(pts), { decalage: dec, motif: (x, y) => ((x * 2 + y) % 5 === 0 ? -0.6 : 0) });
    // l'aile du fond
    if (aile === 'haut') plumes([[cx - 2, cy - 3], [cx + 4, cy - 4], [cx + 2, cy - 18], [cx - 6, cy - 20]], 'fonce', -0.6);
    if (aile === 'bas') plumes([[cx - 2, cy + 1], [cx + 5, cy + 1], [cx + 4, cy + 14], [cx - 3, cy + 12]], 'fonce', -0.6);
    // la queue blanche, le corps, les cuisses
    t.forme('blanc', polygoneHD([[cx - 10, cy - 2], [cx - 22, cy - 4], [cx - 23, cy + 2], [cx - 10, cy + 3]]), { motif: (x, y) => (y % 2 ? -0.4 : 0) });
    t.forme('plume', ellipsoide(cx, cy, 12, 5.6), { motif: (x, y) => ((x + y * 3) % 7 === 0 ? -0.6 : 0) });
    t.forme('fonce', ellipsoide(cx + 1, cy + 4, 5, 3), { decalage: -0.2 });
    // le cou et la tête blanche, le bec crochu jaune, l'œil
    t.forme('blanc', ellipsoide(cx + 12, cy - 3, 5, 4.4), { decalage: 0.4 });
    t.forme('blanc', ellipsoide(cx + 9, cy - 1, 4, 3.6), { decalage: 0.2 });
    for (const [x, y, k] of [[cx + 17, cy - 4, 4], [cx + 18, cy - 4, 4], [cx + 19, cy - 3, 3], [cx + 19, cy - 2, 2], [cx + 18, cy - 2, 3], [cx + 17, cy - 3, 3]]) t.poser(x, y, 'bec', k);
    t.poser(cx + 14, cy - 5, 'encre', 0); t.poser(cx + 13, cy - 6, 'fonce', 1); t.poser(cx + 14, cy - 6, 'fonce', 1);
    // les serres et le baluchon (deux manches de torches qui dépassent), ou les pattes posées
    if (pose) { for (const dx of [-1, 3]) { trait(t, 'bec', cx + dx, cy + 5, cx + dx, cy + 12, 0.6); for (const k of [-1, 0, 1, 2]) t.poser(cx + dx + k, cy + 13, 'bec', 2); } }
    else { trait(t, 'bec', cx + 1, cy + 5, cx + 2, cy + 10, 0.6); trait(t, 'bec', cx + 4, cy + 5, cx + 5, cy + 10, 0.6);
      t.forme('sac', ellipsoide(cx + 3, cy + 14, 4.4, 3.6), { decalage: 0.3 }); for (let x = cx; x <= cx + 6; x++) t.poser(x, cy + 11, 'chanvre', 3);
      trait(t, 'chene', cx + 1, cy + 9, cx - 1, cy + 4, 0.5); trait(t, 'chene', cx + 6, cy + 9, cx + 8, cy + 4, 0.5); }
    // l'aile près de nous : levée, à plat (ouverte vers nous), baissée, ou repliée (posé)
    if (aile === 'haut') { plumes([[cx - 6, cy - 2], [cx + 6, cy - 2], [cx + 4, cy - 12], [cx - 2, cy - 21], [cx - 8, cy - 22], [cx - 12, cy - 20], [cx - 9, cy - 10]]);
      for (let k = 0; k < 4; k++) trait(t, 'fonce', cx - 12 + k * 2.5, cy - 20, cx - 9 + k * 2.5, cy - 14, 0.4); }
    if (aile === 'plat') { plumes([[cx - 8, cy - 2], [cx + 7, cy - 2], [cx + 3, cy - 6], [cx - 10, cy - 9], [cx - 24, cy - 10], [cx - 27, cy - 7], [cx - 20, cy - 4]]);
      for (let k = 0; k < 5; k++) trait(t, 'fonce', cx - 26 + k * 3, cy - 9, cx - 22 + k * 3, cy - 6, 0.4); }
    if (aile === 'bas') { plumes([[cx - 6, cy - 1], [cx + 6, cy - 1], [cx + 5, cy + 6], [cx, cy + 17], [cx - 6, cy + 19], [cx - 10, cy + 15], [cx - 8, cy + 6]]);
      for (let k = 0; k < 4; k++) trait(t, 'fonce', cx - 9 + k * 2.5, cy + 11, cx - 7 + k * 2.5, cy + 17, 0.4); }
    if (aile === 'repliee') { plumes([[cx - 9, cy - 4], [cx + 8, cy - 3], [cx + 5, cy + 3], [cx - 16, cy + 4]]); for (let k = 0; k < 4; k++) t.poser(cx - 12 + k * 3, cy + 2, 'fonce', 0); }
    t.contour(); t.texture(s, cle); };
  aigle('aigleVolH', 'haut'); aigle('aigleVolM', 'plat'); aigle('aigleVolB', 'bas');
  { // posé, redressé, de profil vers la droite : la tête blanche en haut, l'aile repliée le long du corps, les serres sur le perchoir
    const t = toileObjet(30, 44); t.rampes.plume = rampe(0x7a4a22); t.rampes.fonce = rampe(0x4a2c14); t.rampes.blanc = rampe(0xe8e4d8); t.rampes.bec = rampe(0xe8b020);
    t.forme('blanc', polygoneHD([[10, 30], [16, 30], [13, 42], [8, 42]]), { motif: (x, y) => (x % 2 ? -0.4 : 0) });
    t.forme('plume', ellipsoide(14, 22, 7, 11), { motif: (x, y) => ((x + y * 3) % 7 === 0 ? -0.6 : 0) });
    t.forme('blanc', ellipsoide(16, 9, 5, 5), { decalage: 0.4 });
    for (const [x, y, k] of [[21, 8, 4], [22, 8, 4], [23, 9, 3], [23, 10, 2], [22, 10, 3], [21, 9, 3]]) t.poser(x, y, 'bec', k);
    t.poser(18, 7, 'encre', 0); t.poser(17, 6, 'fonce', 1); t.poser(18, 6, 'fonce', 1);
    t.forme('fonce', polygoneHD([[9, 14], [15, 14], [17, 30], [11, 36], [7, 28]]), { decalage: -0.2, motif: (x, y) => ((x * 2 + y) % 5 === 0 ? -0.6 : 0) });
    for (let k = 0; k < 4; k++) t.poser(10 + k, 31 + k, 'plume', 1);
    for (const dx of [12, 16]) { for (let y = 32; y <= 37; y++) t.poser(dx, y, 'bec', 3); for (const k of [-1, 0, 1, 2]) t.poser(dx + k, 38, 'bec', 2); }
    t.contour(); t.texture(s, 'aiglePose'); }
  // les battements, en animations
  const anim = (cle, frames, fr) => { if (!s.anims.exists(cle)) s.anims.create({ key: cle, frames: frames.map(f => ({ key: f })), frameRate: fr, repeat: -1 }); };
  anim('volPigeon', ['pigeonVolH', 'pigeonVolB'], 8); anim('volCorbeau', ['corbeauVolH', 'corbeauVolB'], 7);
  anim('volAigle', ['aigleVolH', 'aigleVolM', 'aigleVolB', 'aigleVolM'], 6); }
