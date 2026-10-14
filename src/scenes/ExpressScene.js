// Le marchand express : le vieux Grippesou, gobelin avare recroquevillé
// à côté de sa caravane. Tout est bien plus cher... mais tu l'as tout de suite, sur le comptoir :
// ce dont le client a besoin va directement dans son colis, le reste dans ta réserve.
// La scène s'ouvre par-dessus le comptoir, qui reste en pause avec son client.
class ExpressScene extends Phaser.Scene {
  constructor() { super('Express'); }

  init(data) {
    this.comptoir = data.comptoir;
    this.vendeur = data.vendeur || 'grippesou'; // ou 'colporteur' : Barnabé et sa hotte, un peu plus cher qu'au marché
    this.achats = [];
  }

  create() {
    const G = this.G = window.GAME;
    // (v0.57) Le paysage du Comté en HD, et un chemin de terre battue
    this.add.image(0, 0, paysageHD(this, 960, 440, 'comte', 0)).setOrigin(0).setScale(2);
    this.add.image(0, 425, cheminTerreHD(this, 960, 120)).setOrigin(0).setScale(2);

    if (this.vendeur === 'colporteur') {
      // Barnabé et son âne attelé à la charrette, lui qui s'éponge le front
      this.add.image(236, 438, charretteColporteurHD(this)).setOrigin(0.5, 1).setScale(2.4);
      Son.jouer('sabots');
      this.gobelin = imageCorps(this, 470, 435, 'colporteur', 8);
      this.tweens.add({ targets: this.gobelin, y: 431, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.add.text(30, 22, COLPORTEUR.nom, style(26, '#f3d98a', { fontStyle: 'bold', stroke: '#2a1a10', strokeThickness: 5 }));
      this.add.text(30, 58, 'Colporteur · des choses rares, directement dans ta réserve · un peu plus cher qu\'au marché', style(14, '#fff4dc', { fontStyle: 'italic', stroke: '#2a1a10', strokeThickness: 3 }));
    } else {
      this.add.image(250, 440, roulotteGrippesouHD(this)).setOrigin(0.5, 1).setScale(2.5);
      creerHalo(this);
      lumiere(this, 92, 302, 70, 0xffc060, 0.45);
      // Sa bourse débordante, qu'il couve du regard
      creerBoursesHD(this);
      this.add.image(565, 440, 'bourseHD4').setOrigin(0.5, 1).setScale(2.6);
      // Le gobelin, recroquevillé, qui se frotte les mains
      this.gobelin = imageCorps(this, 490, 438, 'gobelin', 10).setAngle(12);
      this.tweens.add({ targets: this.gobelin, angle: 18, scaleY: this.gobelin.scaleY * 0.96, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.add.text(30, 22, MARCHAND_EXPRESS.nom, style(26, '#f3d98a', { fontStyle: 'bold', stroke: '#2a1a10', strokeThickness: 5 }));
      this.add.text(30, 58, 'Marchand express · tout de suite, sur ton comptoir · bien plus cher', style(14, '#fff4dc', { fontStyle: 'italic', stroke: '#2a1a10', strokeThickness: 3 }));
    }

    // Ce qu'il dit
    this.add.rectangle(290, 488, 540, 76, 0x1e130a, 0.92).setStrokeStyle(2, 0xc9a227);
    this.texteGobelin = this.add.text(34, 460, '', style(15, '#f3e6c8', { wordWrap: { width: 510 }, lineSpacing: 4 }));
    this.parler(this.vendeur === 'colporteur' ? auHasard([
      'Regarde-moi ça ! Trouvé dans une foire à trois jours de marche. Tu ne verras pas ça tous les jours.',
      'Ma charrette déborde... fais-moi plaisir, allège-la un peu !',
      'Un peu plus cher qu\'au marché, c\'est vrai. Mais mes jambes, elles, ne sont pas gratuites.',
    ]) : auHasard([
      'Hé hé hé... Du bon matos, très rare, très cher. Pour toi, prix d\'ami... enfin, presque.',
      'Tu as des pièces ? Grippesou aime les pièces. Grippesou a ce qu\'il te faut.',
      'Pressé, hein ? Les gens pressés paient plus cher. C\'est la loi du marché, hé hé.',
    ]));

    this.creerEtal();
    const retour = creerBouton(this, 780, 495, 260, 'Retour au comptoir', () => this.fermer());
    retour.fond.setDepth(5);
    retour.label.setDepth(5);
  }

  parler(texte) {
    this.texteGobelin.setText('« ' + texte + ' »');
    Son.jouer('voix', { race: this.vendeur === 'colporteur' ? 'humain' : 'gobelin', nom: this.vendeur === 'colporteur' ? 'Barnabé' : 'Grippesou', duree: Math.min(1.6, 0.3 + texte.length * 0.018) });
  }

  creerEtal() {
    const G = this.G;
    const v = this.comptoir.voyageur;
    this.add.image(780, 250, panneauHD(this, 340, 380)).setScale(2);
    const colporteur = this.vendeur === 'colporteur';
    this.add.text(780, 78, colporteur ? 'La charrette de Barnabé' : "L'étal de Grippesou", style(18, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5);
    this.add.text(780, 100, colporteur ? 'Pour ta réserve' : `Pour ${v.nom}`, style(12, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5);
    this.lignes = [];
    // Ses objets, puis (certains jours) son fer et son cuir hors de prix.
    const stock = colporteur ? (G.colporteurOffre || {}) : G.express;
    const lignes = [...Object.keys(stock).map(id => ({ id, offre: stock[id], nom: ITEMS[id].nom, prix: ITEMS[id].prix })),
      ...(colporteur ? [] : Object.keys(G.expressMateriaux || {}).map(id => ({ id, offre: G.expressMateriaux[id], nom: MATERIAUX[id].nom, prix: MATERIAUX[id].prix, materiau: true })))];
    if (!lignes.length) this.add.text(780, 250, 'Plus rien à vendre aujourd\'hui.', style(14, '#3b2410')).setOrigin(0.5);
    const ecart = lignes.length > 1 ? Math.min(62, 250 / (lignes.length - 1)) : 62;
    lignes.forEach((l, i) => {
      const y = 140 + i * ecart;
      this.add.image(632, y + 6, iconeObjet(this, l.id)).setScale(2.4);
      this.add.text(660, y - 10, l.nom, style(15, '#3b2410', { fontStyle: 'bold' }));
      this.add.text(660, y + 10, `${l.offre.prix} p. (au marché : ~${l.prix} p.)`, style(12, colporteur ? '#8a6a10' : '#a03030'));
      const reste = this.add.text(856, y - 8, '', style(11, '#6b4a2a')).setOrigin(1, 0);   // (sur la ligne du nom : la liste ne se chevauche plus)
      const btn = this.add.rectangle(895, y + 6, 70, 30, 0x8a5a2b).setStrokeStyle(2, 0x3b2410).setInteractive({ useHandCursor: true });
      this.add.text(895, y + 6, 'Acheter', style(12, '#fff4dc', { fontStyle: 'bold' })).setOrigin(0.5);
      btn.on('pointerdown', () => (l.materiau ? this.acheterMateriau(l.id) : this.acheter(l.id)));
      this.lignes.push({ offre: l.offre, reste });
    });
    this.bourse = bourse(this, 760, 470, this.G.argent, { echelle: 1.6, taille: 14, couleur: '#fff4dc', aDroite: true });
    this.maj();
  }

  acheter(id) {
    const G = this.G;
    const c = this.comptoir;
    const colporteur = this.vendeur === 'colporteur';
    const offre = colporteur ? G.colporteurOffre[id] : G.express[id];
    const commande = c.voyageur ? commandeDe(c.voyageur) : {};
    // Si le client en a besoin, ça va directement dans son colis ; sinon, dans ta réserve.
    const pourLeClient = !colporteur && commande[id] && (c.colis[id] || 0) < commande[id];
    const non = texte => { Son.jouer('refus'); return this.parler(texte); };
    if (offre.qte <= 0) return non(colporteur ? 'Plus un seul ! Tu as vidé ma hotte.' : 'Plus rien ! Tout vendu ! Reviens demain, avec plus de pièces.');
    if (!peutPayer(G, offre.prix)) return non(colporteur ? "Pas assez de pièces... Une autre fois, l'ami." : "Pas de pièces, pas de marchandise ! File, mendiant !");
    if (!pourLeClient && stockTotal(G) >= G.capacite) return non(colporteur ? "Ta réserve est pleine, je n'ai nulle part où poser ça !" : 'Ta réserve est pleine ! Grippesou ne vend pas de place, hé hé.');
    payer(G, offre.prix, colporteur ? 'colporteur' : 'express');
    offre.qte--;
    if (pourLeClient) c.colis[id] = (c.colis[id] || 0) + 1;
    else G.stock[id]++;
    Son.jouer('achat');
    this.achats.push(`${ITEMS[id].nom} (${pourLeClient ? 'dans le baluchon' : 'dans ta réserve'})`);
    this.parler(colporteur ? auHasard(['Bien choisi ! Ça te servira, crois-moi.', 'Et une chose de moins à porter. Merci !']) : auHasard(['Hé hé ! Merci pour les pièces...', 'Excellent choix. Excellent prix. Pour moi.', 'Vendu ! Grippesou est content.']));
    this.tweens.add({ targets: this.gobelin, y: 425, duration: 120, yoyo: true });
    this.maj();
  }

  // Le fer et le cuir vont directement avec tes matières premières.
  acheterMateriau(id) {
    const G = this.G;
    const offre = G.expressMateriaux[id];
    if (offre.qte <= 0) { Son.jouer('refus'); return this.parler('Plus de ' + MATERIAUX[id].nom.toLowerCase() + ' ! Hé hé, il fallait se décider plus vite.'); }
    if (!peutPayer(G, offre.prix)) { Son.jouer('refus'); return this.parler(`Du ${MATERIAUX[id].nom.toLowerCase()}, à ce prix-là, ça se mérite ! Reviens avec des pièces.`); }
    payer(G, offre.prix, 'express');
    offre.qte--;
    G.materiaux[id] = (G.materiaux[id] || 0) + 1;
    Son.jouer('achat');
    this.achats.push(`${MATERIAUX[id].nom} (avec tes matériaux)`);
    this.parler(auHasard(['Du ' + MATERIAUX[id].nom.toLowerCase() + ' de première qualité ! Enfin... de qualité.', 'Hé hé hé ! Tu ne trouveras pas moins cher. Ici.']));
    this.tweens.add({ targets: this.gobelin, y: 425, duration: 120, yoyo: true });
    this.maj();
  }

  maj() {
    for (const l of this.lignes) l.reste.setText(`reste ${l.offre.qte}`);
    this.bourse.maj(this.G.argent);
  }

  fermer() {
    this.scene.stop();
    this.scene.resume('Comptoir', { achats: this.achats, vendeur: this.vendeur });
  }
}
