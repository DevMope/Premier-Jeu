// (v1.32, planche 56 image 3 validée) Le miroir des 18 ans : au premier matin d'adulte, un nouveau reflet, offert une fois.
// Coiffure, couleur des cheveux, barbe (pour un garçon) et habits ; la peau et les yeux ne changent pas.
function miroirAFaire(G) { return !!G && G.joueur && ageJoueur(G) >= 18 && !G.miroirFait; }

// Oublie toutes les images du joueur déjà peintes (après un changement de reflet, tout est redessiné)
function oublierTexturesJoueur(scene) {
  for (const k of scene.textures.getTextureKeys()) if (k.startsWith('joueur_')) scene.textures.remove(k);
}

function miroirDes18Ans(scene, suite) {
  const G = window.GAME, f = G.joueur.feminin, ap = { ...G.joueur.apparence };
  creerInterieurHD(scene);
  const objets = [];
  const voile = scene.add.rectangle(480, 270, 960, 540, 0x0a0604, 0.7).setDepth(80).setInteractive();
  const L = scene.add.container(0, 0).setDepth(81);
  objets.push(voile, L);
  // le grand miroir ovale, cadre doré
  const g = scene.add.graphics();
  g.fillStyle(0x6a4a1a).fillEllipse(240, 262, 330, 430).fillStyle(0xd0a830).fillEllipse(240, 262, 314, 414).fillStyle(0x8a6a2a).fillEllipse(240, 262, 296, 396).fillStyle(0xbcd0d8).fillEllipse(240, 262, 280, 380);
  g.fillStyle(0xffffff, 0.18).fillEllipse(190, 182, 70, 160);
  L.add(g);
  const reflet = scene.add.image(240, 422, '__DEFAULT').setOrigin(0.5, 1);
  L.add(reflet);
  const peindre = () => {
    if (scene.textures.exists('miroir_reflet')) { reflet.setTexture('__DEFAULT'); scene.textures.remove('miroir_reflet'); }
    dessinerJoueurHD(ap, 'adulte', f, 0, G.tenue || []).texture(scene, 'miroir_reflet');
    reflet.setTexture('miroir_reflet').setScale(11 * 16 / JOUEUR_H * TAILLE_SELON_AGE.adulte);
  };
  L.add(scene.add.text(240, 446, `${nomJoueur(G, 'adulte')}, ${ageJoueur(G)} ans`, style(18, '#f3e6c8', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 4 })).setOrigin(0.5));
  // les choix : le même menu qu'à la création, à onglets et vignettes (la peau et les yeux ne changent pas)
  L.add(scene.add.text(700, 50, 'LE MIROIR · TES 18 ANS', style(18, '#f3e6c8', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 4 })).setOrigin(0.5));
  L.add(scene.add.text(700, 72, 'Un nouveau reflet, offert : ce que tu veux changer', style(12, '#e8d4a8', { fontStyle: 'italic', stroke: '#1a0e06', strokeThickness: 3 })).setOrigin(0.5));
  const menu = panneauApparence(scene, { x: 700, y: 283, l: 460, h: 384, ap, feminin: f, stade: 'adulte', barbe: !f, visage: false, prof: 82, quandChange: () => peindre() });
  objets.push({ destroy: () => menu.detruire(), active: true });
  const garder = creerBouton(scene, 700, 505, 240, 'Garder ce reflet', () => {
    G.joueur.apparence = ap; G.miroirFait = G.jour;
    oublierTexturesJoueur(scene);
    if (scene.textures.exists('miroir_reflet')) { reflet.setTexture('__DEFAULT'); scene.textures.remove('miroir_reflet'); }
    if (typeof noterJournal === 'function') noterJournal('miroir des 18 ans');
    Son.jouer('pieces');
    for (const x of objets) { if (x.fond) { x.fond.destroy(); x.label.destroy(); } else if (x.active) x.destroy(); }
    if (suite) suite();
  });
  garder.fond.setDepth(82); garder.label.setDepth(82.1); objets.push(garder);
  peindre();
  L.setAlpha(0); scene.tweens.add({ targets: L, alpha: 1, duration: 400 });
}
