// (v1.28, planche 52) Le soir, chez toi : « La Confrérie », le livre des dons. Trois projets, l'un après l'autre,
// chacun bâti en une nuit. Dans n'importe quelle scène.
function confrerieDuSoir(scene, suite) {
  const G = window.GAME, c = confrerieDe(G);
  creerConfrerieHD(scene); creerEmblemesHD(scene);
  const objets = [];
  const voile = scene.add.rectangle(480, 270, 960, 540, 0x0a0604, 0.55).setDepth(80).setInteractive();
  const L = scene.add.container(480, 262).setDepth(81);
  objets.push(voile, L);
  L.add(scene.add.image(0, 0, panneauHD(scene, 640, 460)).setScale(2).setInteractive());
  const fermer = (relancer = false) => {
    if (!voile.active) return;
    for (const x of objets) { if (x.fond) { x.fond.destroy(); x.label.destroy(); } else if (x.active) x.destroy(); }
    if (relancer) confrerieDuSoir(scene, suite); else if (suite) suite();
  };
  const bouton = (x, y, l, texte, action, actif = true) => { const b = creerBouton(scene, x, y, l, texte, action); b.fond.setDepth(82); b.label.setDepth(82.1); if (!actif) b.setActif(false); objets.push(b); return b; };
  for (const x of [-268, 268]) { const em = scene.add.image(x, -192, 'embleme_confrerie'); em.setScale(46 / em.width); L.add(em); }
  L.add(scene.add.text(0, -202, 'LA CONFRÉRIE DU DERNIER REMPART', style(19, '#1a2c58', { fontStyle: 'bold' })).setOrigin(0.5));
  L.add(scene.add.text(0, -180, 'Le livre des dons · pour ceux qui marchent du côté de la lumière', style(12, '#3b2410', { fontStyle: 'italic' })).setOrigin(0.5));
  // la jauge de ce qui est déjà donné
  const donne = donneConfrerie(G), total = totalConfrerie(), g = scene.add.graphics(); L.add(g);
  g.fillStyle(0x3b2410).fillRoundedRect(-230, -164, 460, 16, 6).fillStyle(0xe8d8b0).fillRoundedRect(-228, -162, 456, 12, 5);
  if (donne) g.fillStyle(0x3a62aa).fillRoundedRect(-228, -162, Math.max(10, 456 * donne / total), 12, 5);
  L.add(scene.add.text(0, -143, `Déjà donné : ${donne.toLocaleString('fr-FR')} p. sur ${total.toLocaleString('fr-FR')} p.`, style(11, '#1a2c58', { fontStyle: 'bold' })).setOrigin(0.5, 0));
  // les trois projets
  const suivant = projetConfrerie(G);
  CONFRERIE.projets.forEach((p, i) => {
    const x = -212 + i * 212, k = scene.add.container(x, 26); L.add(k);
    const bati = confrerieA(G, p.id), chantier = c.chantier === p.id, bloque = !bati && !chantier && suivant && suivant.id !== p.id;
    k.add(scene.add.rectangle(0, 0, 200, 290, bati ? 0xdcd8c0 : 0xf3e6c8).setStrokeStyle(3, 0x2a4a8a));
    k.add(scene.add.text(0, -130, p.nom, style(15, '#1a2c58', { fontStyle: 'bold' })).setOrigin(0.5));
    if (p.id === 'hospice') k.add(scene.add.image(0, -54, 'rueHospiceHD').setScale(0.82));
    if (p.id === 'chapelle') k.add(scene.add.image(0, -54, 'rueChapelleHD_jour').setScale(0.5));
    if (p.id === 'escouade') {
      [3, 1, 0, 2, 5].forEach((n, j) => k.add(scene.add.image(-64 + j * 32, 0 - (j % 2) * 4, corpsHD(scene, 'soldat' + n)).setOrigin(0.5, 1).setScale(4.4 * ECHELLE_CORPS)));
      const em = scene.add.image(-70, -96, 'embleme_confrerie'); em.setScale(24 / em.width); k.add(em);
    }
    if (bloque) k.add(scene.add.rectangle(0, -54, 196, 120, 0xf3e6c8, 0.55));
    const etat = bati ? 'bâti ✓' : chantier ? 'bâti cette nuit' : `${p.prix.toLocaleString('fr-FR')} p.`;
    k.add(scene.add.text(0, 18, etat, style(14, bati || chantier ? '#2f5a2a' : bloque ? '#8a6a4a' : '#8a1a14', { fontStyle: 'bold' })).setOrigin(0.5));
    k.add(scene.add.text(0, 64, p.effet, style(11, '#3b2410', { wordWrap: { width: 184 }, align: 'center' })).setOrigin(0.5));
    k.add(scene.add.text(0, 118, bloque ? `Après ${CONFRERIE.projets[i - 1].nom.toLowerCase()}.` : p.decor, style(10, '#6b4a2a', { fontStyle: 'italic', wordWrap: { width: 184 }, align: 'center' })).setOrigin(0.5));
  });
  let note = 'Tout est bâti : la Confrérie grave ton nom au fronton de la chapelle.';
  if (c.chantier) note = 'Les maçons de la Confrérie viennent cette nuit : des chants et des coups de marteau.';
  else if (suivant) note = peutPayer(G, suivant.prix) ? `Chaque projet se bâtit en une nuit (+${CONFRERIE.reputation} de réputation).` : `Il te manque ${(suivant.prix - Math.floor(G.argent)).toLocaleString('fr-FR')} pièces pour ${suivant.nom.toLowerCase()}.`;
  L.add(scene.add.text(0, 188, note, style(12, suivant && !c.chantier && !peutPayer(G, suivant.prix) ? '#b02020' : '#2f5a2a', { fontStyle: 'bold italic', wordWrap: { width: 560 }, align: 'center' })).setOrigin(0.5));
  if (suivant && !c.chantier) bouton(480, 492, 340, `Financer ${suivant.nom.toLowerCase()} (${suivant.prix.toLocaleString('fr-FR')} p.)`, () => {
    const res = financerConfrerie(G);
    if (!res.ok) { Son.jouer('refus'); return; }
    Son.jouer('pieces'); Son.jouer('cloche'); scene.cameras.main.flash(250, 200, 220, 255);
    gainEnDirect(scene, 480, 300, `−${res.projet.prix.toLocaleString('fr-FR')} p. (don à la Confrérie)`, false, { profondeur: 130 });
    if (typeof noterJournal === 'function') noterJournal(`confrérie : ${res.projet.id}`);
    scene.time.delayedCall(700, () => fermer(true));
  }, peutPayer(G, suivant.prix));
  objets.push(scene.add.text(950, 530, '▶ clique à côté pour refermer', style(12, '#d6bf98', { fontStyle: 'italic' })).setOrigin(1, 1).setDepth(82));
  L.setScale(0.9).setAlpha(0); scene.tweens.add({ targets: L, scale: 1, alpha: 1, duration: 260, ease: 'Back.easeOut' });
  scene.time.delayedCall(400, () => { if (voile.active) voile.once('pointerdown', () => fermer()); });
  return fermer;
}
