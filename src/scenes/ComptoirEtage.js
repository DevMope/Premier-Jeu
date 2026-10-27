// (v1.30, planche 54) Le soir, chez toi : « L'étage », trois chantiers au-dessus du shop, l'un après l'autre.
// Dans n'importe quelle scène.
function etageDuSoir(scene, suite) {
  const G = window.GAME, e = etageDe(G);
  creerEtageHD(scene);
  const objets = [];
  const voile = scene.add.rectangle(480, 270, 960, 540, 0x0a0604, 0.55).setDepth(80).setInteractive();
  const L = scene.add.container(480, 262).setDepth(81);
  objets.push(voile, L);
  L.add(scene.add.image(0, 0, panneauHD(scene, 640, 460)).setScale(2).setInteractive());
  const fermer = (relancer = false) => {
    if (!voile.active) return;
    for (const x of objets) { if (x.fond) { x.fond.destroy(); x.label.destroy(); } else if (x.active) x.destroy(); }
    if (relancer) etageDuSoir(scene, suite); else if (suite) suite();
  };
  const bouton = (x, y, l, texte, action, actif = true) => { const b = creerBouton(scene, x, y, l, texte, action); b.fond.setDepth(82); b.label.setDepth(82.1); if (!actif) b.setActif(false); objets.push(b); return b; };
  L.add(scene.add.text(0, -200, "L'ÉTAGE AU-DESSUS DU SHOP", style(19, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
  L.add(scene.add.text(0, -178, "Trois chantiers, l'un après l'autre · pour tous, lumière, ombre ou neutre", style(12, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5));
  const suivant = projetEtage(G);
  ETAGE.projets.forEach((p, i) => {
    const x = -212 + i * 212, k = scene.add.container(x, 8); L.add(k);
    const bati = !!e.bati[p.id], chantier = e.chantier === p.id, bloque = !bati && !chantier && suivant && suivant.id !== p.id;
    k.add(scene.add.rectangle(0, 0, 200, 300, bati ? 0xdcd0a8 : 0xf3e6c8).setStrokeStyle(3, 0x8a6a3a));
    k.add(scene.add.text(0, -136, p.nom, style(15, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
    k.add(scene.add.image(0, -56, { grenier: 'grenierHD', salon: 'fauteuilHD', appartement: 'facadeHD_4' }[p.id]).setScale({ grenier: 0.4, salon: 2.4, appartement: 0.5 }[p.id]));
    if (bloque) k.add(scene.add.rectangle(0, -56, 196, 140, 0xf3e6c8, 0.5));
    k.add(scene.add.text(0, 30, bati ? 'bâti ✓' : chantier ? 'bâti cette nuit' : `${p.prix.toLocaleString('fr-FR')} p.`, style(14, bati || chantier ? '#2f5a2a' : bloque ? '#8a6a4a' : '#8a1a14', { fontStyle: 'bold' })).setOrigin(0.5));
    k.add(scene.add.text(0, 74, p.effet, style(11, '#3b2410', { wordWrap: { width: 184 }, align: 'center' })).setOrigin(0.5));
    k.add(scene.add.text(0, 124, bloque ? `Après ${ETAGE.projets[i - 1].nom.toLowerCase()}.` : p.decor, style(10, '#6b4a2a', { fontStyle: 'italic', wordWrap: { width: 184 }, align: 'center' })).setOrigin(0.5));
  });
  let note = "L'étage est fini : la plus haute maison de la rue.";
  if (e.chantier) note = 'Les ouvriers viennent cette nuit : des coups de marteau au-dessus de ta tête.';
  else if (suivant) note = peutPayer(G, suivant.prix) ? `Chaque chantier se termine en une nuit (+${ETAGE.reputation} de réputation).` : `Il te manque ${(suivant.prix - Math.floor(G.argent)).toLocaleString('fr-FR')} pièces pour ${suivant.nom.toLowerCase()}.`;
  L.add(scene.add.text(0, 182, note, style(12, suivant && !e.chantier && !peutPayer(G, suivant.prix) ? '#b02020' : '#2f5a2a', { fontStyle: 'bold italic', wordWrap: { width: 560 }, align: 'center' })).setOrigin(0.5));
  if (suivant && !e.chantier) bouton(480, 492, 330, `Bâtir ${suivant.nom.toLowerCase()} (${suivant.prix.toLocaleString('fr-FR')} p.)`, () => {
    const res = batirEtage(G);
    if (!res.ok) { Son.jouer('refus'); return; }
    Son.jouer('pieces'); if (!(typeof sonAChoisir === 'function' && sonAChoisir('marteau', { lieu: 'charpentier', matiere: 'bois' }))) Son.jouer('marteau');   // (v1.64 : les charpentiers) scene.cameras.main.flash(250, 255, 240, 160);
    gainEnDirect(scene, 480, 300, `−${res.projet.prix.toLocaleString('fr-FR')} p. (l'étage)`, false, { profondeur: 130 });
    if (typeof noterJournal === 'function') noterJournal(`étage : ${res.projet.id}`);
    scene.time.delayedCall(700, () => fermer(true));
  }, peutPayer(G, suivant.prix));
  objets.push(scene.add.text(950, 530, '▶ clique à côté pour refermer', style(12, '#d6bf98', { fontStyle: 'italic' })).setOrigin(1, 1).setDepth(82));
  L.setScale(0.9).setAlpha(0); scene.tweens.add({ targets: L, scale: 1, alpha: 1, duration: 260, ease: 'Back.easeOut' });
  scene.time.delayedCall(400, () => { if (voile.active) voile.once('pointerdown', () => fermer()); });
  return fermer;
}
