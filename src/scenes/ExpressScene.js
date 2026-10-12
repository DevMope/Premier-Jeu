// Le marchand express : le vieux Grippesou, gobelin avare recroquevillé
// à côté de sa caravane. Tout est bien plus cher... mais livré tout de suite dans le colis.
// La scène s'ouvre par-dessus le comptoir, qui reste en pause avec son client.
class ExpressScene extends Phaser.Scene {
  constructor() { super('Express'); }

  init(data) {
    this.comptoir = data.comptoir;
  }

  create() {
    const G = this.G = window.GAME;
    const g = this.add.graphics();
    dessinerComte(g, 0, 0, 960, 540, 0.4);
    g.fillStyle(0xc9a46a).fillRect(0, 430, 960, 110);

    dessinerCaravane(this, 260, 435);
    // Sa pile de pièces, qu'il couve du regard
    const pile = this.add.graphics();
    for (let i = 0; i < 9; i++) {
      pile.fillStyle(0x9a7a10).fillEllipse(500 + (i % 3) * 16, 434 - Math.floor(i / 3) * 6, 20, 8);
      pile.fillStyle(0xe8c040).fillEllipse(500 + (i % 3) * 16, 432 - Math.floor(i / 3) * 6, 20, 8);
    }
    // Le gobelin, recroquevillé, qui se frotte les mains
    this.gobelin = this.add.image(440, 435, 'perso_gobelin').setOrigin(0.5, 1).setScale(8).setAngle(14);
    this.tweens.add({ targets: this.gobelin, angle: 18, scaleY: 7.7, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.add.text(30, 22, MARCHAND_EXPRESS.nom, style(26, '#f3d98a', { fontStyle: 'bold', stroke: '#2a1a10', strokeThickness: 5 }));
    this.add.text(30, 58, 'Marchand express · livré directement dans le colis', style(14, '#fff4dc', { fontStyle: 'italic', stroke: '#2a1a10', strokeThickness: 3 }));

    // Ce qu'il dit
    this.add.rectangle(290, 488, 540, 76, 0x1e130a, 0.92).setStrokeStyle(2, 0xc9a227);
    this.texteGobelin = this.add.text(34, 460, '', style(15, '#f3e6c8', { wordWrap: { width: 510 }, lineSpacing: 4 }));
    this.parler(auHasard([
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
  }

  creerEtal() {
    const G = this.G;
    const v = this.comptoir.voyageur;
    this.add.rectangle(780, 250, 340, 380, 0xead9b0).setStrokeStyle(3, 0x8a6a3a);
    this.add.text(780, 78, "L'étal de Grippesou", style(18, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5);
    this.add.text(780, 100, `Pour ${v.nom}`, style(12, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5);
    this.lignes = [];
    const ids = Object.keys(G.express);
    if (!ids.length) this.add.text(780, 250, 'Plus rien à vendre aujourd\'hui.', style(14, '#3b2410')).setOrigin(0.5);
    ids.forEach((id, i) => {
      const y = 140 + i * 62;
      this.add.image(632, y + 6, id).setScale(4);
      this.add.text(660, y - 10, ITEMS[id].nom, style(15, '#3b2410', { fontStyle: 'bold' }));
      this.add.text(660, y + 10, `${G.express[id].prix} p. (Gédéon : ~${ITEMS[id].prix} p.)`, style(12, '#a03030'));
      const reste = this.add.text(660, y + 26, '', style(11, '#6b4a2a'));
      const btn = this.add.rectangle(895, y + 6, 70, 30, 0x8a5a2b).setStrokeStyle(2, 0x3b2410).setInteractive({ useHandCursor: true });
      this.add.text(895, y + 6, 'Acheter', style(12, '#fff4dc', { fontStyle: 'bold' })).setOrigin(0.5);
      btn.on('pointerdown', () => this.acheter(id));
      this.lignes.push({ id, reste });
    });
    this.texteArgent = this.add.text(780, 420, '', style(14, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5);
    this.maj();
  }

  acheter(id) {
    const G = this.G;
    const c = this.comptoir;
    const offre = G.express[id];
    const commande = commandeDe(c.voyageur);
    if (!commande[id]) return this.parler(`${c.voyageur.nom} n'en a pas besoin ? Alors pourquoi tu regardes, hein ?`);
    if ((c.colis[id] || 0) >= commande[id]) return this.parler('Le colis en a déjà assez. Grippesou n\'est pas un voleur... pas toujours.');
    if (offre.qte <= 0) return this.parler('Plus rien ! Tout vendu ! Reviens demain, avec plus de pièces.');
    if (!peutPayer(G, offre.prix)) return this.parler("Pas de pièces, pas de marchandise ! File, mendiant !");
    G.argent -= offre.prix;
    offre.qte--;
    c.colis[id] = (c.colis[id] || 0) + 1;
    this.parler(auHasard(['Hé hé ! Merci pour les pièces...', 'Excellent choix. Excellent prix. Pour moi.', 'Vendu ! Grippesou est content.']));
    this.tweens.add({ targets: this.gobelin, y: 425, duration: 120, yoyo: true });
    this.maj();
  }

  maj() {
    for (const l of this.lignes) l.reste.setText(`Il en reste ${this.G.express[l.id].qte}`);
    this.texteArgent.setText(`Ta bourse : ${this.G.argent} pièces`);
  }

  fermer() {
    this.scene.stop();
    this.scene.resume('Comptoir');
  }
}
