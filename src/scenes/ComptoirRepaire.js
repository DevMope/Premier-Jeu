// (v1.29, planche 53) Le soir, chez toi : « Le repaire », le livre noir. Trois projets côté ombre, l'un après
// l'autre, chacun installé en une nuit. Dans n'importe quelle scène.
function repaireDuSoir(scene, suite) {
  const G = window.GAME, r = repaireDe(G);
  creerRepaireHD(scene); textureGamin(scene);
  const objets = [];
  const voile = scene.add.rectangle(480, 270, 960, 540, 0x0a0604, 0.6).setDepth(80).setInteractive();
  const L = scene.add.container(480, 262).setDepth(81);
  objets.push(voile, L);
  const fermer = (relancer = false) => {
    if (!voile.active) return;
    for (const x of objets) { if (x.fond) { x.fond.destroy(); x.label.destroy(); } else if (x.active) x.destroy(); }
    if (relancer) repaireDuSoir(scene, suite); else if (suite) suite();
  };
  const bouton = (x, y, l, texte, action, actif = true) => { const b = creerBouton(scene, x, y, l, texte, action); b.fond.setDepth(82); b.label.setDepth(82.1); if (!actif) b.setActif(false); objets.push(b); return b; };
  // le cuir rouge sombre, cousu de fil d'or, les coins de laiton
  const g0 = scene.add.graphics();
  g0.fillStyle(0x0e0606).fillRoundedRect(-326, -230, 652, 460, 14).fillStyle(0x3a1612).fillRoundedRect(-318, -222, 636, 444, 10);
  for (let i = 0; i < 60; i++) g0.fillStyle(0x000000, 0.06).fillCircle(-300 + ((i * 97) % 600), -200 + ((i * 53) % 400), 10 + (i % 5) * 6);
  g0.lineStyle(2, 0xb8864a, 0.8);
  for (let x = -306; x < 306; x += 12) { g0.lineBetween(x, -212, x + 6, -212); g0.lineBetween(x, 212, x + 6, 212); }
  for (let y = -206; y < 206; y += 12) { g0.lineBetween(-308, y, -308, y + 6); g0.lineBetween(308, y, 308, y + 6); }
  for (const [cx, cy] of [[-310, -214], [310, -214], [-310, 214], [310, 214]]) g0.fillStyle(0x8a6a2a).fillRect(cx - 6, cy - 6, 12, 12).fillStyle(0xd8b060).fillRect(cx - 4, cy - 4, 5, 5);
  L.add(g0.setInteractive(new Phaser.Geom.Rectangle(-326, -230, 652, 460), Phaser.Geom.Rectangle.Contains));
  // les deux sceaux de cire, le trou de serrure
  for (const x of [-268, 268]) { const g = scene.add.graphics(); g.fillStyle(0x5a0a0a).fillCircle(x, -187, 21).fillStyle(0x9a1a14).fillCircle(x, -188, 20).fillStyle(0xb83a2a).fillCircle(x - 4, -192, 9).fillStyle(0x1a0606).fillCircle(x, -192, 5).fillTriangle(x - 4, -178, x + 4, -178, x, -190); L.add(g); }
  L.add(scene.add.text(0, -198, 'LE REPAIRE SOUS LE COMPTOIR', style(19, '#f0c8a0', { fontStyle: 'bold', stroke: '#1a0606', strokeThickness: 4 })).setOrigin(0.5));
  L.add(scene.add.text(0, -176, "Le livre noir · pour ceux qui marchent du côté de l'ombre", style(12, '#e0b8a0', { fontStyle: 'italic' })).setOrigin(0.5));
  const paye = payeRepaire(G), total = totalRepaire(), g = scene.add.graphics(); L.add(g);
  g.fillStyle(0x1a0606).fillRoundedRect(-230, -160, 460, 16, 6).fillStyle(0x3a2020).fillRoundedRect(-228, -158, 456, 12, 5);
  if (paye) g.fillStyle(0xc03a2a).fillRoundedRect(-228, -158, Math.max(10, 456 * paye / total), 12, 5);
  L.add(scene.add.text(0, -139, `Déjà payé : ${paye.toLocaleString('fr-FR')} p. sur ${total.toLocaleString('fr-FR')} p.`, style(11, '#f0c8a0', { fontStyle: 'bold' })).setOrigin(0.5, 0));
  const suivant = projetRepaire(G);
  REPAIRE.projets.forEach((p, i) => {
    const x = -212 + i * 212, k = scene.add.container(x, 28); L.add(k);
    const fait = !!(r.bati[p.id]), chantier = r.chantier === p.id, bloque = !fait && !chantier && suivant && suivant.id !== p.id;
    k.add(scene.add.rectangle(0, 0, 200, 290, fait ? 0x2a1414 : 0x3a1c1a).setStrokeStyle(3, 0xa02a20));
    k.add(scene.add.text(0, -130, p.nom, style(15, '#f0c8a0', { fontStyle: 'bold' })).setOrigin(0.5));
    if (p.id === 'cave') { k.add(scene.add.image(0, -54, 'caveRepaire').setScale(0.4)); k.add(scene.add.rectangle(0, -54, 192, 108).setStrokeStyle(2, 0x1a0606)); }
    if (p.id === 'informateurs') k.add(scene.add.image(0, 0, 'gamin').setOrigin(0.5, 1).setScale(echelleJoueur(6.6)));
    if (p.id === 'garde') k.add(scene.add.image(0, 0, corpsHD(scene, GARDE.capitaine)).setOrigin(0.5, 1).setScale(5.4 * ECHELLE_CORPS));
    if (bloque) k.add(scene.add.rectangle(0, -54, 196, 120, 0x3a1c1a, 0.55));
    const etat = fait ? (p.id === 'garde' ? (r.manquee > 0 ? 'enveloppe manquée !' : 'payée ✓') : 'installé ✓') : chantier ? 'installé cette nuit' : `${p.prix.toLocaleString('fr-FR')} p.`;
    k.add(scene.add.text(0, 18, etat, style(14, fait && !(p.id === 'garde' && r.manquee > 0) || chantier ? '#9ae08a' : bloque ? '#a08070' : '#ff9a80', { fontStyle: 'bold' })).setOrigin(0.5));
    k.add(scene.add.text(0, 64, p.effet, style(11, '#f3e0cc', { wordWrap: { width: 184 }, align: 'center' })).setOrigin(0.5));
    k.add(scene.add.text(0, 118, bloque ? `Après ${REPAIRE.projets[i - 1].nom.toLowerCase()}.` : p.decor, style(10, '#c8a090', { fontStyle: 'italic', wordWrap: { width: 184 }, align: 'center' })).setOrigin(0.5));
  });
  let note = 'Le repaire est complet. Personne ne sait ce qui dort sous ton comptoir.';
  if (r.chantier) note = 'Des ouvriers sans nom viendront cette nuit. Tu n’entendras rien.';
  else if (suivant) note = peutPayer(G, suivant.prix) ? 'Chaque projet s’installe en une nuit, sans bruit.' : `Il te manque ${(suivant.prix - Math.floor(G.argent)).toLocaleString('fr-FR')} pièces pour ${suivant.nom.toLowerCase()}.`;
  if (repaireA(G, 'garde')) note += ` L'enveloppe du capitaine : ${REPAIRE.enveloppe} p. chaque fin de semaine.`;
  L.add(scene.add.text(0, 186, note, style(12, suivant && !r.chantier && !peutPayer(G, suivant.prix) ? '#ff8a7a' : '#e0c8a8', { fontStyle: 'bold italic', wordWrap: { width: 580 }, align: 'center' })).setOrigin(0.5));
  if (suivant && !r.chantier) bouton(480, 492, 340, `${suivant.id === 'garde' ? 'Acheter' : suivant.id === 'cave' ? 'Creuser' : 'Payer'} ${suivant.nom.toLowerCase()} (${suivant.prix.toLocaleString('fr-FR')} p.)`, () => {
    const res = installerRepaire(G);
    if (!res.ok) { Son.jouer('refus'); return; }
    Son.jouer('pieces'); Son.jouer('glisse'); scene.cameras.main.flash(250, 120, 20, 20);
    gainEnDirect(scene, 480, 300, `−${res.projet.prix.toLocaleString('fr-FR')} p. (le repaire)`, false, { profondeur: 130 });
    if (typeof noterJournal === 'function') noterJournal(`repaire : ${res.projet.id}`);
    scene.time.delayedCall(700, () => fermer(true));
  }, peutPayer(G, suivant.prix));
  objets.push(scene.add.text(950, 530, '▶ clique à côté pour refermer', style(12, '#d6bf98', { fontStyle: 'italic' })).setOrigin(1, 1).setDepth(82));
  L.setScale(0.9).setAlpha(0); scene.tweens.add({ targets: L, scale: 1, alpha: 1, duration: 260, ease: 'Back.easeOut' });
  scene.time.delayedCall(400, () => { if (voile.active) voile.once('pointerdown', () => fermer()); });
  return fermer;
}
