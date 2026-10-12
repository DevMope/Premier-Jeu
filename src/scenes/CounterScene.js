// Le comptoir : les voyageurs se présentent à la fenêtre,
// le joueur leur prépare un colis avec son stock.

const FENETRE = { x: 300, y: 20, w: 360, h: 230 };

class CounterScene extends Phaser.Scene {
  constructor() { super('Comptoir'); }

  create() {
    this.G = window.GAME;
    this.voyageur = null;
    this.enService = false;
    this.colis = {};

    this.dessinerPiece();
    this.creerFenetre();
    this.creerPanneauGauche();
    this.creerCommande();
    this.creerDialogue();
    this.creerStock();
    this.creerArgent();

    this.boutonRemettre = creerBouton(this, 840, 470, 200, 'Remettre le colis', () => this.remettreColis());
    this.boutonDormir = creerBouton(this, 840, 470, 200, 'Aller dormir', () => this.scene.start('Nuit'));
    this.boutonDormir.setVisible(false);

    this.voyageurSuivant();
  }

  // --- Décor ---

  dessinerPiece() {
    const g = this.add.graphics();
    // Mur en planches
    g.fillStyle(0x5a3a22, 1);
    g.fillRect(0, 0, 960, 340);
    g.lineStyle(2, 0x45291a, 1);
    for (let y = 0; y < 340; y += 34) g.lineBetween(0, y, 960, y);
    for (let y = 0; y < 340; y += 34) {
      const decal = (y / 34) % 2 ? 0 : 60;
      for (let x = decal; x < 960; x += 120) g.lineBetween(x, y, x, y + 34);
    }
    // Poutres
    g.fillStyle(0x3b2410, 1);
    g.fillRect(0, 0, 960, 12);
    g.fillRect(280, 0, 14, 340);
    g.fillRect(666, 0, 14, 340);
    // Bureau
    g.fillStyle(0x8a5a2b, 1);
    g.fillRect(0, 340, 960, 200);
    g.fillStyle(0x6b4423, 1);
    g.fillRect(0, 340, 960, 14);
    g.lineStyle(2, 0x7a4e24, 1);
    for (let y = 380; y < 540; y += 40) g.lineBetween(0, y, 960, y);
  }

  creerFenetre() {
    const { x, y, w, h } = FENETRE;
    this.paysage = this.add.graphics();
    dessinerComte(this.paysage, x, y, w, h, 0);
    this.voile = this.add.rectangle(x + w / 2, y + h / 2, w, h, 0x0a0a30, 0);

    // Tout ce qui est dans la fenêtre est découpé à sa taille.
    const forme = this.make.graphics({ add: false });
    forme.fillStyle(0xffffff).fillRect(x, y, w, h);
    const masque = forme.createGeometryMask();
    this.paysage.setMask(masque);

    this.perso = this.add.image(-100, y + h - 10, 'perso_hobbit').setOrigin(0.5, 1).setScale(9);
    this.perso.setMask(masque);

    // Cadre et rebord de la fenêtre
    const cadre = this.add.graphics();
    cadre.lineStyle(10, 0x3b2410, 1);
    cadre.strokeRect(x - 5, y - 5, w + 10, h + 10);
    cadre.fillStyle(0x6b4423, 1);
    cadre.fillRect(x - 14, y + h, w + 28, 14);
  }

  creerPanneauGauche() {
    this.add.rectangle(145, 135, 250, 230, 0x2a1a10, 0.55).setStrokeStyle(2, 0x3b2410);
    this.texteJour = this.add.text(30, 32, '', style(22, '#f3d98a', { fontStyle: 'bold' }));
    this.add.text(30, 70, 'Voyageurs du jour :', style(16, '#c9b48a'));
    this.texteFile = this.add.text(30, 96, '', style(15, '#f3e6c8', { lineSpacing: 6, wordWrap: { width: 230 } }));
  }

  creerCommande() {
    // Parchemin de la commande
    this.add.rectangle(815, 135, 260, 230, 0xead9b0).setStrokeStyle(3, 0x8a6a3a);
    this.titreCommande = this.add.text(700, 30, '', style(17, '#3b2410', { fontStyle: 'bold', wordWrap: { width: 235 } }));
    this.lignesCommande = [];
    for (let i = 0; i < 4; i++) {
      const y = 80 + i * 30;
      const icone = this.add.image(712, y, 'ration').setScale(3).setVisible(false);
      const txt = this.add.text(735, y, '', style(16, '#3b2410')).setOrigin(0, 0.5);
      const zone = this.add.rectangle(815, y, 240, 32, 0x000000, 0).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => this.reprendre(i));
      this.lignesCommande.push({ icone, txt, zone, id: null });
    }
    this.add.text(700, 226, 'Cliquer une ligne pour reprendre', style(11, '#7a5a3a', { fontStyle: 'italic' }));
    this.texteChance = this.add.text(815, 206, '', style(17, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5);
  }

  creerDialogue() {
    this.add.rectangle(480, 296, 920, 70, 0x1e130a, 0.85).setStrokeStyle(2, 0xc9a227);
    this.nomParleur = this.add.text(32, 266, '', style(15, '#f3d98a', { fontStyle: 'bold' }));
    this.texteDialogue = this.add.text(32, 286, '', style(15, '#f3e6c8', { wordWrap: { width: 900 } }));
  }

  creerStock() {
    this.add.text(170, 360, 'Ton stock — clique sur un objet pour l\'ajouter au colis', style(14, '#2a1a10', { fontStyle: 'italic' }));
    this.cases = {};
    Object.keys(ITEMS).forEach((id, i) => {
      const x = 205 + (i % 4) * 130;
      const y = 410 + Math.floor(i / 4) * 70;
      const fond = this.add.rectangle(x, y, 120, 60, 0x6b4423).setStrokeStyle(2, 0x3b2410)
        .setInteractive({ useHandCursor: true });
      this.add.image(x - 38, y, id).setScale(4);
      this.add.text(x - 14, y - 16, ITEMS[id].nom, style(14, '#f3e6c8'));
      const qte = this.add.text(x - 14, y + 2, '', style(16, '#f3d98a', { fontStyle: 'bold' }));
      fond.on('pointerover', () => fond.setFillStyle(0x7a5030));
      fond.on('pointerout', () => fond.setFillStyle(0x6b4423));
      fond.on('pointerdown', () => this.donner(id));
      this.cases[id] = { fond, qte };
    });
  }

  creerArgent() {
    this.pieces = this.add.graphics();
    this.texteArgent = this.add.text(70, 510, '', style(18, '#f3d98a', { fontStyle: 'bold' })).setOrigin(0.5);
    this.dessinerPieces();
  }

  // Une petite pile de pièces qui grandit avec l'argent.
  dessinerPieces() {
    const n = Phaser.Math.Clamp(Math.ceil(this.G.argent / 5), 0, 24);
    this.pieces.clear();
    for (let i = 0; i < n; i++) {
      const colonne = i % 3;
      const hauteur = Math.floor(i / 3);
      const x = 40 + colonne * 30;
      const y = 480 - hauteur * 7;
      this.pieces.fillStyle(0x9a7a10, 1).fillEllipse(x, y + 2, 26, 10);
      this.pieces.fillStyle(0xe8c040, 1).fillEllipse(x, y, 26, 10);
    }
    this.texteArgent.setText(this.G.argent + ' pièces');
  }

  // --- Déroulement ---

  voyageurSuivant() {
    this.voyageur = null;
    this.majPanneauGauche();
    this.majStock();
    if (this.G.file.length === 0) return this.finDeJournee();

    this.voyageur = this.G.file.shift();
    this.colis = {};
    this.boutonRemettre.setActif(false);
    this.nomParleur.setText('');
    this.texteDialogue.setText('Quelqu\'un approche du comptoir...');
    this.majCommande();

    this.perso.setTexture('perso_' + this.voyageur.race).setFlipX(false).setX(FENETRE.x - 60);
    this.tweens.add({
      targets: this.perso, x: FENETRE.x + FENETRE.w / 2, duration: 1200, ease: 'Sine.easeOut',
      onComplete: () => {
        this.nomParleur.setText(this.voyageur.nom);
        this.texteDialogue.setText(this.voyageur.accueil);
        this.boutonRemettre.setActif(true);
        this.enService = true;
        this.majCommande();
      },
    });
    this.marche(1200);
  }

  // Petit sautillement pendant la marche.
  marche(duree) {
    this.tweens.add({ targets: this.perso, scaleY: 8.6, duration: 150, yoyo: true, repeat: Math.floor(duree / 300) - 1 });
  }

  donner(id) {
    if (!this.enService) return;
    const commande = commandeDe(this.voyageur);
    if (!commande[id]) {
      return this.dire("Hum, je n'ai pas besoin de ça, merci.");
    }
    if ((this.colis[id] || 0) >= commande[id]) {
      return this.dire("J'en ai assez comme ça !");
    }
    if (this.G.stock[id] <= 0) {
      return this.dire("Tu n'en as plus en stock...", '');
    }
    this.G.stock[id]--;
    this.colis[id] = (this.colis[id] || 0) + 1;
    this.majStock();
    this.majCommande();
  }

  reprendre(i) {
    const id = this.lignesCommande[i].id;
    if (!this.enService || !id || !this.colis[id]) return;
    this.colis[id]--;
    this.G.stock[id]++;
    this.majStock();
    this.majCommande();
  }

  dire(texte, nom = this.voyageur.nom) {
    this.nomParleur.setText(nom);
    this.texteDialogue.setText(texte);
  }

  remettreColis() {
    const v = this.voyageur;
    const chance = chanceDeRetour(v, this.colis);
    this.G.partis.push({ voyageur: v, colis: { ...this.colis }, chance });
    this.enService = false;
    this.boutonRemettre.setActif(false);

    const phrase = chance >= 0.75 ? 'Parfait ! Je reviendrai avec ta part du butin, promis !'
      : chance >= 0.4 ? "Ce n'est pas tout ce que je voulais... mais je ferai avec."
      : "C'est tout ? Bon... Souhaite-moi bonne chance.";
    this.dire(phrase, v.nom);

    this.perso.setFlipX(true);
    this.tweens.add({
      targets: this.perso, x: FENETRE.x + FENETRE.w + 60, duration: 1400, delay: 600, ease: 'Sine.easeIn',
      onStart: () => this.marche(1400),
      onComplete: () => this.voyageurSuivant(),
    });
  }

  finDeJournee() {
    this.voyageur = null;
    this.majCommande();
    this.boutonRemettre.setVisible(false);
    this.boutonDormir.setVisible(true);
    this.dire('Le soleil se couche sur la Comté. Tous les voyageurs sont partis à l\'aventure.', 'Fin de la journée');
    this.tweens.add({ targets: this.voile, fillAlpha: 0.55, duration: 2000 });
  }

  // --- Mise à jour de l'affichage ---

  majPanneauGauche() {
    this.texteJour.setText('Jour ' + this.G.jour);
    const lignes = [];
    for (const p of this.G.partis) lignes.push('✓ ' + p.voyageur.nom);
    if (this.voyageur) lignes.push('► ' + this.voyageur.nom);
    for (const v of this.G.file) lignes.push('• ' + v.nom + '\n   ' + v.quete);
    this.texteFile.setText(lignes.join('\n'));
  }

  majStock() {
    for (const [id, c] of Object.entries(this.cases)) {
      const n = this.G.stock[id];
      c.qte.setText('x ' + n).setColor(n > 0 ? '#f3d98a' : '#a05040');
    }
  }

  majCommande() {
    const v = this.voyageur;
    const commande = v ? commandeDe(v) : {};
    const ids = Object.keys(commande);
    this.titreCommande.setText(v ? 'Commande de ' + v.nom : 'Aucune commande');
    this.lignesCommande.forEach((ligne, i) => {
      const id = ids[i];
      ligne.id = id || null;
      ligne.icone.setVisible(!!id);
      if (!id) return ligne.txt.setText('');
      ligne.icone.setTexture(id);
      const donne = this.colis[id] || 0;
      const ok = donne >= commande[id];
      ligne.txt.setText(`${ITEMS[id].nom}  ${donne} / ${commande[id]}  ${ok ? '✓' : ''}`)
        .setColor(ok ? '#2f6a2a' : '#3b2410');
    });
    if (v) {
      const c = chanceDeRetour(v, this.colis);
      const couleur = c >= 0.75 ? '#2f6a2a' : c >= 0.4 ? '#8a6a10' : '#a03030';
      this.texteChance.setText(`Chances de retour : ${Math.round(c * 100)} %`).setColor(couleur);
      this.majPanneauGauche();
    } else {
      this.texteChance.setText('');
    }
  }
}
