// (v1.16, planche 43 v5 validée) Le petit bar, côté écrans : la fenêtre du soir, chez toi. Cinq onglets : ce soir
// (jouer la soirée, laisser l'équipe, fermer), l'équipe (embaucher), les installations (bâtir), la bande (choisir),
// embellir (pièce par pièce, esthétique seulement).

function barDuSoir(scene, suite, page = 'soir') {
  const G = window.GAME, b = barDe(G);
  const objets = [];
  const voile = scene.add.rectangle(480, 270, 960, 540, 0x0a0604, 0.55).setDepth(80).setInteractive();
  const L = scene.add.container(480, 258).setDepth(81);
  objets.push(voile, L);
  L.add(scene.add.image(0, 0, panneauHD(scene, 900, 440)).setScale(2).setInteractive());   // (un clic dans le panneau ne le ferme pas)
  const fermer = (relancer = false) => {
    if (!voile.active) return;
    for (const x of objets) { if (x.fond) { x.fond.destroy(); x.label.destroy(); } else if (x.active) x.destroy(); }
    if (relancer) barDuSoir(scene, suite, relancer); else if (suite) suite();
  };
  const bouton = (x, y, l, texte, action, actif = true) => { const bt = creerBouton(scene, x, y, l, texte, action); bt.fond.setDepth(82); bt.label.setDepth(82.1); if (!actif) bt.setActif(false); objets.push(bt); return bt; };
  const texte = (x, y, t, taille, coul, opts = {}) => { const o = scene.add.text(x, y, t, style(taille, coul, opts)).setOrigin(opts.ox ?? 0.5, opts.oy ?? 0.5); L.add(o); return o; };
  const etoiles = n => '★'.repeat(Math.round(n)) + '☆'.repeat(Math.max(0, BAR.renommee.max - Math.round(n)));
  texte(0, -198, `LE PETIT BAR · ${BAR.styles[stylePiece(G, 'facade')].toUpperCase()}`, 19, '#5a0e0e', { fontStyle: 'bold' });
  texte(0, -176, `renommée ${etoiles(b.renommee)} · ${pluriel(Object.keys(b.equipe).length, 'employé', 'employés')} · ${pluriel(b.soireesJouees, 'soirée jouée', 'soirées jouées')}`, 12, '#3b2410', { fontStyle: 'italic' });
  // les onglets
  [['Ce soir', 'soir'], ["L'équipe", 'equipe'], ['Les installations', 'installations'], ['La bande', 'bande'], ['Embellir', 'embellir']].forEach(([t, id], i) => {
    const actif = page === id, o = texte(-336 + i * 168, -148, t, 14, actif ? '#fff4dc' : '#3b2410', { fontStyle: 'bold', backgroundColor: actif ? '#5a3a1a' : '#e8d8b0', padding: { x: 10, y: 4 } });
    if (!actif) o.setInteractive({ useHandCursor: true }).on('pointerdown', () => { Son.jouer('page'); fermer(id); });
  });

  if (page === 'soir') {
    const decide = soireeDecidee(G), ce = b.ce, n = clientsDuSoir(G), paies = paiesDuSoir(G), ct = conteurDuJour(G), bande = b.bande && BAR.bandes[b.bande];
    // à gauche : ce qui attend ce soir
    L.add(scene.add.rectangle(-210, -6, 400, 222, 0xf3e6c8).setStrokeStyle(2, 0x8a6a3a));
    texte(-210, -104, 'Ce soir au petit bar', 15, '#3b2410', { fontStyle: 'bold' });
    const lignes = [
      `${pluriel(n, 'client attendu', 'clients attendus')} (renommée, ${bande ? 'bande, ' : ''}${ct ? 'conteur, ' : ''}habitués)`,
      `${Math.round(recetteParClient(G) * 10) / 10} p. par client servi (${barA(G, 'cuisine') && aEmbauche(G, 'cuisinier') ? 'une chope, et souvent un plat' : 'des chopes'})`,
      bande ? `sur la scène : ${bande.nom} (${bande.paie} p.)` : barA(G, 'scene') ? 'la scène est vide : choisis une bande' : 'pas encore de scène',
      ct ? `le conteur du jour : ${ct.nom} ${'★'.repeat(ct.etoiles)} (${ct.paie} p., +${ct.clients} clients)` : '',
      `les paies du soir : ${paies.total} p.`,
    ].filter(Boolean);
    lignes.forEach((l, i) => texte(-396, -76 + i * 26, '• ' + l, 12, '#3b2410', { ox: 0, wordWrap: { width: 370 } }));
    if (!aEmbauche(G, 'barman')) texte(-210, 84, 'Il faut au moins un barman pour ouvrir (onglet « L’équipe »).', 12, '#b02020', { fontStyle: 'bold', wordWrap: { width: 370 }, align: 'center' });
    // à droite : le dernier bilan, et midi
    L.add(scene.add.rectangle(210, -6, 400, 222, 0xf0e8d8).setStrokeStyle(2, 0x8a6a3a));
    texte(210, -104, decide ? 'Ce soir, c’est décidé' : 'La dernière soirée', 15, '#3b2410', { fontStyle: 'bold' });
    const d = b.dernier;
    const bilan = decide && ce.mode === 'ferme' ? ['Le bar reste fermé ce soir : pas de paie.']
      : d ? [d.mode === 'joue' ? `Jouée (jour ${d.jour}) : ${d.servis} servis sur ${d.attendus}` : `Toute seule (jour ${d.jour}) : ${d.clients} clients`,
        `recette ${d.recette} p.${d.pourboires ? ` · pourboires ${d.pourboires} p.` : ''} · paies −${d.paies} p.${d.perte ? ` · pertes −${d.perte} p.` : ''}`,
        `bilan : ${d.gain >= 0 ? '+' : ''}${d.gain} p.${d.mode === 'joue' && d.renommee ? ` · renommée ${d.renommee > 0 ? '+' : ''}${Math.round(d.renommee * 100) / 100}` : ''}`,
        d.rumeur ? `une rumeur : ${d.rumeur}` : ''].filter(Boolean)
        : ['Pas encore de soirée.'];
    if (b.midi && b.midi.jour === G.jour) bilan.push(b.midi.ferme ? 'À midi : la terrasse est restée fermée.' : `À midi, la terrasse : ${b.midi.gain >= 0 ? '+' : ''}${b.midi.gain} p.`);
    bilan.forEach((l, i) => texte(26, -76 + i * 26, l, 12, '#3b2410', { ox: 0, wordWrap: { width: 370 } }));
    const seul = peutTournerSeul(G), reste = Math.max(0, BAR.seul.soirsComplets - (b.soirsComplets || 0));
    texte(210, 84, seul ? 'L’équipe peut tenir le bar toute seule.' : equipeComplete(G) ? `Encore ${pluriel(reste, 'soirée jouée', 'soirées jouées')} au complet, et l’équipe pourra tourner seule.` : 'L’équipe n’est pas au complet (barman, serveur, et cuisinier avec la cuisine).', 12, seul ? '#2f5a2a' : '#6b4a2a', { fontStyle: 'bold italic', wordWrap: { width: 370 }, align: 'center' });
    texte(0, 136, 'Une soirée jouée prend tout ton soir (19 h – minuit) : pas de promenade ensuite. Fermé, le bar ne paie personne.', 11, '#6b4a2a', { fontStyle: 'italic' });
    if (!decide) {
      const ok = aEmbauche(G, 'barman');
      bouton(250, 432, 220, 'Jouer la soirée', () => { fermer(); if (typeof lancerSoireeBar === 'function') lancerSoireeBar(scene); }, ok && scene.scene.manager.keys.Bar !== undefined);
      bouton(480, 432, 220, `Laisser l'équipe (${paiesDuSoir(G, false, true).total} p.)`, () => {
        const res = soireeSeule(G);
        if (res.erreur) { Son.jouer('refus'); if (scene.annoncer) scene.annoncer(res.erreur); return; }
        Son.jouer('pieces'); fermer('soir');
        if (scene.annoncer) scene.annoncer(`Le petit bar a tourné tout seul : ${res.clients} clients, ${res.gain >= 0 ? '+' : ''}${res.gain} p. une fois l'équipe payée.`);
      }, seul);
      bouton(710, 432, 220, 'Fermer ce soir', () => { fermerLeBarCeSoir(G); Son.jouer('page'); fermer('soir'); });
    }
  } else if (page === 'equipe') {
    texte(0, -118, 'Une paie chaque soir où le bar ouvre (jouée ou toute seule). Fermé, personne n’est payé.', 12, '#3b2410', { fontStyle: 'italic' });
    Object.entries(BAR.equipe).forEach(([qui, e], i) => {
      const x = -340 + i * 170, y = 0, pris = aEmbauche(G, qui), possible = peutEmbaucher(G, qui);
      const c = scene.add.container(x, y); L.add(c);
      c.add(scene.add.rectangle(0, 0, 160, 210, pris ? 0xe8f0d0 : 0xf3e6c8).setStrokeStyle(2, pris ? 0x4a8a3a : 0x8a6a3a));
      const im = imageCorps(scene, 0, 0, { ...e.quoi, niveau: qui === 'videur' ? ['novice', 'aguerri', 'veteran'][niveauVideur(G)] : 'aguerri' }, qui === 'videur' ? 3.4 : 4).setPosition(0, -14);
      c.add(im);
      c.add(scene.add.text(0, 14, `${e.nom}, ${e.titre}`, style(13, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
      c.add(scene.add.text(0, 34, e.role, style(10, '#6b4a2a', { fontStyle: 'italic', wordWrap: { width: 150 }, align: 'center' })).setOrigin(0.5));
      const paie = qui === 'videur' ? `${BAR.videur.niveaux[niveauVideur(G)].paie} p. (${BAR.videur.niveaux[niveauVideur(G)].nom})` : `${e.paie} p. le soir`;
      c.add(scene.add.text(0, 60, paie, style(12, '#8a1a14', { fontStyle: 'bold' })).setOrigin(0.5));
      const etat = pris ? 'embauché' + (e.feminin ? 'e' : '') : possible ? '' : e.installation === 'cuisine' ? 'il faut la cuisine' : e.installation === 'videur' ? 'il faut son poste' : '';
      if (etat) c.add(scene.add.text(0, 82, etat, style(11, pris ? '#2f5a2a' : '#6b4a2a', { fontStyle: 'bold italic' })).setOrigin(0.5));
      const bt = bouton(480 + x, 258 + y + 86, 130, pris ? 'Renvoyer' : 'Embaucher', () => {
        const res = pris ? renvoyerDuBar(G, qui) : embaucherAuBar(G, qui);
        if (!res.ok) { Son.jouer('refus'); return; }
        Son.jouer(pris ? 'page' : 'pieces'); fermer('equipe');
      }, pris || possible);
      bt.fond.setScale(bt.fond.scaleX, 0.85);
    });
    texte(0, 136, `Au complet (barman, serveur, et cuisinier s'il y a la cuisine) depuis ${BAR.seul.soirsComplets} soirées jouées : le bar peut tourner seul. La serveuse aide dès ${BAR.clients.serveuse} clients.`, 11, '#2f5a2a', { fontStyle: 'bold italic', wordWrap: { width: 820 }, align: 'center' });
  } else if (page === 'installations') {
    const suivante = installationBar(G), couleurs = [0x4a8a3a, 0x2a4a8a, 0x8a5a2a, 0x5a2a8a];
    BAR.installations.forEach((i, k) => {
      const x = -315 + k * 210, fait = barA(G, i.id), chantier = b.chantier === i.id;
      const c = scene.add.container(x, -6); L.add(c);
      c.add(scene.add.rectangle(0, 0, 196, 226, fait ? 0xdcd0a8 : 0xf3e6c8).setStrokeStyle(3, couleurs[k]));
      c.add(scene.add.text(0, -90, i.nom, style(15, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
      c.add(scene.add.text(0, -68, fait ? 'déjà faite' : chantier ? 'bâtie cette nuit' : i.prix + ' p.', style(13, fait || chantier ? '#2f5a2a' : '#8a1a14', { fontStyle: 'bold' })).setOrigin(0.5));
      c.add(scene.add.text(0, 10, i.effet, style(12, '#3b2410', { wordWrap: { width: 176 }, align: 'center' })).setOrigin(0.5));
      if (!fait && !chantier && suivante && suivante.id !== i.id) c.add(scene.add.text(0, -50, `après ${BAR.installations[k - 1].nom.toLowerCase()}`, style(10, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5));
    });
    texte(0, 124, '⚠ Les prix sont ceux des installations. Les paies (l’équipe, la bande, le conteur) viennent en plus, chaque soir où le bar ouvre.', 12, '#b02020', { fontStyle: 'bold', wordWrap: { width: 820 }, align: 'center' });
    if (suivante && !b.chantier) bouton(480, 432, 320, `Bâtir ${suivante.nom.toLowerCase()} (${suivante.prix} p.)`, () => {
      const res = batirAuBar(G);
      if (!res.ok) { Son.jouer('refus'); return; }
      Son.jouer('pieces'); scene.cameras.main.flash(250, 255, 240, 160);
      if (typeof noterJournal === 'function') noterJournal(`bar : ${res.installation.id}`);
      fermer('installations');
    }, peutPayer(G, suivante.prix));
    else texte(0, 150, b.chantier ? 'Les ouvriers viennent cette nuit : des coups de marteau au réveil.' : 'Tout est bâti.', 12, '#2f5a2a', { fontStyle: 'bold italic' });
  } else if (page === 'bande') {
    if (!barA(G, 'scene')) texte(0, -10, 'Il faut d’abord bâtir la scène (onglet « Les installations »).', 15, '#6b4a2a', { fontStyle: 'bold italic' });
    else {
      texte(0, -118, 'Une bande à la fois, sur la scène ; sa paie chaque soir ouvert. Le conteur du jour, lui, change chaque soir.', 12, '#3b2410', { fontStyle: 'italic' });
      Object.entries(BAR.bandes).forEach(([cle, B], k) => {
        const x = -280 + k * 280, choisie = b.bande === cle, coul = [0x4a8a3a, 0x8a3a1a, 0x5a2a8a][k];
        const c = scene.add.container(x, -4); L.add(c);
        c.add(scene.add.rectangle(0, 0, 264, 210, choisie ? 0xe8f0d0 : 0xf3e6c8).setStrokeStyle(choisie ? 4 : 2, coul));
        c.add(scene.add.text(0, -84, B.nom, style(16, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
        c.add(scene.add.text(0, -62, B.qui, style(11, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5));
        c.add(scene.add.text(0, -36, `paie : ${B.paie} p. chaque soir`, style(13, '#8a1a14', { fontStyle: 'bold' })).setOrigin(0.5));
        c.add(scene.add.text(0, -12, `+${B.clients} clients · ${B.effet}`, style(12, '#2f5a2a', { fontStyle: 'bold', wordWrap: { width: 240 }, align: 'center' })).setOrigin(0.5));
        if (choisie) c.add(scene.add.text(0, 60, '♪ sur la scène ce soir ♪', style(13, '#2f5a2a', { fontStyle: 'bold italic' })).setOrigin(0.5));
        bouton(480 + x, 258 + 70, 170, choisie ? 'Pas de bande' : 'La choisir', () => { choisirBandeDuBar(G, choisie ? null : cle); Son.jouer('clic'); fermer('bande'); });
      });
    }
  } else {
    // embellir : sept pièces, l'auberge puis la brasserie (esthétique seulement)
    texte(0, -120, 'Esthétique : le décor seulement, rien de plus à gagner. Chaque pièce s’achète à part ; la brasserie s’ouvre quand l’auberge est complète.', 11, '#8a1a14', { fontStyle: 'bold italic' });
    BAR.pieces.forEach((pc, k) => {
      const y = -92 + k * 31, n = stylePiece(G, pc.id), suiv = prochainePiece(G, pc.id);
      L.add(scene.add.rectangle(0, y, 820, 28, k % 2 ? 0xeadcb8 : 0xf3e6c8));
      texte(-400, y, pc.nom, 13, '#3b2410', { fontStyle: 'bold', ox: 0 });
      texte(-220, y, `aujourd'hui : ${['la taverne', "l'auberge", 'la brasserie'][n]}`, 12, '#3b2410', { ox: 0 });
      texte(30, y, !suiv ? 'au plus beau' : suiv.bloque ? `brasserie (${suiv.prix} p.) : après l'auberge` : `→ ${['', "l'auberge", 'la brasserie'][suiv.style]} : ${suiv.prix} p.`, 12, !suiv ? '#2f5a2a' : suiv.bloque ? '#6b4a2a' : '#8a1a14', { ox: 0, fontStyle: 'bold' });
      if (suiv && !suiv.bloque) {
        const t = texte(350, y, 'Acheter', 12, '#fff4dc', { fontStyle: 'bold', backgroundColor: peutPayer(G, suiv.prix) ? '#5a3a1a' : '#a89878', padding: { x: 8, y: 2 } });
        if (peutPayer(G, suiv.prix)) t.setInteractive({ useHandCursor: true }).on('pointerdown', () => { const res = embellirBar(G, pc.id); if (!res.ok) { Son.jouer('refus'); return; } Son.jouer('pieces'); fermer('embellir'); });
      }
    });
  }
  objets.push(scene.add.text(950, 530, '▶ clique à côté pour refermer', style(12, '#d6bf98', { fontStyle: 'italic' })).setOrigin(1, 1).setDepth(82));
  L.setScale(0.9).setAlpha(0); scene.tweens.add({ targets: L, scale: 1, alpha: 1, duration: 260, ease: 'Back.easeOut' });
  scene.time.delayedCall(400, () => { if (voile.active) voile.once('pointerdown', () => fermer()); });
  return fermer;
}
