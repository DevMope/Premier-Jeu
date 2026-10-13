// La création du personnage : garçon ou fille, puis cheveux, yeux, bouche,
// barbe, couleurs... L'aperçu montre le personnage au début de l'aventure.
class IntroScene extends Phaser.Scene {
  constructor() { super('Intro'); }

  create() {
    this.feminin = false;
    this.ap = apparenceParDefaut(false);
    this.cameras.main.fadeIn(400);
    // Le bureau, deux grands parchemins : toi à gauche, tes choix à droite
    creerInterieurHD(this);
    creerBureauHD(this);
    this.add.image(0, 0, 'bureauBois').setOrigin(0).setScale(2).setTint(0xa08870);
    vignette(this, 0.6, 0);
    this.add.text(480, 30, 'Qui es-tu ?', style(32, '#f3d98a', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 6 })).setOrigin(0.5);
    const retour = creerBouton(this, 80, 30, 130, '◀ Menu', () => this.scene.start('Titre'));
    retour.label.setFontSize(15);

    // L'aperçu : toi, au début de l'aventure
    this.add.image(220, 250, panneauHD(this, 380, 330)).setScale(2);
    this.apercu = this.add.image(220, 350, 'perso_heros').setOrigin(0.5, 1).setScale(echelleJoueur(13));
    this.nomApercu = this.add.text(220, 372, '', style(20, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5);
    this.add.text(220, 396, `${AGE_DEPART} ans · la barbe poussera à 18 ans`, style(14, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5);

    // Garçon ou fille
    this.boutonsGenre = [[false, 'Garçon', 140], [true, 'Fille', 300]].map(([feminin, texte, x]) => {
      const b = creerBouton(this, x, 112, 140, texte, () => {
        this.feminin = feminin;
        this.ap.coiffure = apparenceParDefaut(feminin).coiffure;
        this.maj();
      });
      return { feminin, b };
    });

    // Les choix, sur un parchemin
    this.add.image(705, 262, panneauHD(this, 470, 380)).setScale(2);
    const options = [
      ['coiffure', 'Coiffure'], ['cheveux', 'Cheveux'], ['peau', 'Peau'], ['yeux', 'Yeux'],
      ['bouche', 'Bouche'], ['barbe', 'Barbe'], ['haut', 'Habit du haut'], ['bas', 'Habit du bas'],
    ];
    this.lignes = options.map(([cle, libelle], i) => {
      const y = 108 + i * 41;
      this.add.text(496, y, libelle, style(18, '#3b2410', { fontStyle: 'bold' })).setOrigin(0, 0.5);
      this.fleche(660, y, '◀', () => this.changer(cle, -1));
      this.fleche(890, y, '▶', () => this.changer(cle, 1));
      const valeur = this.add.text(785, y, '', style(17, '#5a2a10', { fontStyle: 'bold' })).setOrigin(0.5);
      const pastille = this.add.rectangle(705, y, 18, 18, 0xffffff).setStrokeStyle(2, 0x3b2410);
      return { cle, valeur, pastille };
    });

    // Le nom de ton auberge : un vrai champ à remplir, avec un crayon
    this.nomShop = NOM_SHOP_DEFAUT;
    this.add.text(220, 432, "Le nom de ton auberge :", style(16, '#f3e6c8', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 4 })).setOrigin(0.5);
    const champ = this.add.rectangle(190, 470, 300, 38, 0xfff8e8).setStrokeStyle(3, 0x8a6a3a).setInteractive({ useHandCursor: true });
    this.texteShop = this.add.text(50, 470, '', style(16, '#3b2410', { fontStyle: 'bold' })).setOrigin(0, 0.5);
    this.curseur = this.add.rectangle(0, 470, 2, 22, 0x3b2410);
    this.tweens.add({ targets: this.curseur, alpha: 0, duration: 500, yoyo: true, repeat: -1 });
    const ecrire = () => demanderTexte('Le nom de ton auberge', this.nomShop, NOM_SHOP_MAX, nom => {
      if (nom) this.nomShop = nom;
      this.maj();
    });
    champ.on('pointerdown', ecrire);
    champ.on('pointerover', () => champ.setStrokeStyle(3, 0xc9a227));
    champ.on('pointerout', () => champ.setStrokeStyle(3, 0x8a6a3a));
    const crayon = creerBouton(this, 382, 470, 76, '✎', ecrire);
    crayon.label.setFontSize(20);
    this.add.text(220, 500, '(touche le champ pour changer le nom)', style(13, '#e8d4a8', { fontStyle: 'italic', stroke: '#1a0e06', strokeThickness: 3 })).setOrigin(0.5);

    creerBouton(this, 590, 495, 180, 'Au hasard', () => this.auHasard());
    creerBouton(this, 815, 495, 240, "Commencer l'histoire", () => this.commencer());
    this.maj();
  }

  fleche(x, y, texte, action) {
    const b = creerBouton(this, x, y, 50, texte, action);
    b.label.setFontSize(16);
  }

  changer(cle, sens) {
    const n = APPARENCE[cle].length;
    this.ap[cle] = (this.ap[cle] + sens + n) % n;
    this.maj();
  }

  auHasard() {
    for (const cle of Object.keys(this.ap)) this.ap[cle] = Phaser.Math.Between(0, APPARENCE[cle].length - 1);
    this.maj();
  }

  maj() {
    creerTexturesJoueur(this, this.ap, this.feminin);
    const genre = this.feminin ? 'fille' : 'garcon';
    this.apercu.setTexture('joueur_petit');
    this.nomApercu.setText(NOMS_JOUEUR[genre].petit);
    this.texteShop.setText(this.nomShop);
    for (let taille = 16; this.texteShop.width > 270 && taille >= 10; taille--) this.texteShop.setFontSize(taille);
    this.curseur.setX(this.texteShop.x + this.texteShop.width + 3);
    for (const g of this.boutonsGenre) {
      const choisi = g.feminin === this.feminin;
      g.b.fond.setTint(choisi ? 0xffffff : 0x8a7a6a);
      g.b.label.setColor(choisi ? '#ffe9a0' : '#c8b8a0');
    }
    for (const l of this.lignes) {
      const choix = APPARENCE[l.cle][this.ap[l.cle]];
      const couleur = Array.isArray(choix);
      l.valeur.setText(couleur ? choix[0] : choix);
      l.pastille.setVisible(couleur);
      if (couleur) l.pastille.setFillStyle(choix[1]);
    }
  }

  commencer() {
    nouvellePartie({ feminin: this.feminin, apparence: { ...this.ap }, nomShop: this.nomShop });
    this.scene.start('IntroHistoire');
  }
}

class IntroHistoireScene extends Cinematique {
  constructor() { super('IntroHistoire'); }

  create() {
    const G = window.GAME;
    this.f = G.joueur.feminin;
    creerInterieurHD(this);
    this.e = this.f ? 'e' : '';
    this.cameras.main.fadeIn(600);

    // La rivière, au pied des collines
    this.fond = this.add.graphics();
    dessinerComte(this.fond, 0, 0, 960, 370, 0);
    // L'eau qui coule (une texture peinte qui défile)
    this.riviere = this.add.tileSprite(0, 330, 960, 50, riviereHD(this)).setOrigin(0).setTileScale(2);
    this.tweens.add({ targets: this.riviere, tilePositionX: -240, duration: 4000, repeat: -1 });
    this.vagues = [];
    for (let i = 0; i < 14; i++) {
      const v = this.add.rectangle(i * 75, 340 + (i % 3) * 10, 22, 3, 0x8fd0f0);
      this.tweens.add({ targets: v, x: v.x + 75, duration: 1800, repeat: -1 });
      this.vagues.push(v);
    }
    this.voile = this.add.rectangle(480, 185, 960, 370, 0x05051a, 0);

    textureJoueur(this, G); // (crée les textures du joueur si besoin)
    this.heros = this.add.image(220, 330, 'joueur_petit').setOrigin(0.5, 1).setScale(echelleJoueur(6));
    this.mentor = this.add.image(-80, 345, corpsHD(this, 'mentor')).setOrigin(0.5, 0.5).setScale(6 * ECHELLE_CORPS).setAngle(90);

    this.creerBoiteTexte();
    this.boutonPasser(() => this.finir());
    this.raconter();
  }

  finir() {
    if (this.fini) return;
    this.fini = true;
    this.cameras.main.fadeOut(500);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Renovation'));
  }

  async raconter() {
    const e = this.e;
    const petit = this.f ? 'petite' : 'petit';

    this.ecrire('Il y a bien longtemps...', `Dans la Comté vivait un${e} jeune orphelin${e}. Pas de famille, pas de maison... juste la rivière, et beaucoup d'imagination.`);
    await this.attendreClic();

    // L'aventurier arrive en flottant, comme un vieux tonneau.
    this.tweens.add({ targets: this.mentor, y: 352, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.ecrire('Un matin...', "La rivière charria quelque chose d'inhabituel : un aventurier à moitié noyé, qui flottait comme un vieux tonneau.");
    await this.animer({ targets: this.mentor, x: 520, duration: 2600, ease: 'Sine.easeOut' });
    await this.attendreClic();

    // Tu tires... et tu tombes sur les fesses.
    await this.marcher(this.heros, 430);
    this.ecrire('', 'Tu as tiré. Et tiré. Et tiré encore...');
    await this.animer({ targets: this.heros, x: 410, duration: 250, yoyo: true, repeat: 2 });
    this.onomatopee(400, 250, 'HNNNG !');
    await this.animer({ targets: this.heros, x: 360, angle: -80, duration: 300, ease: 'Quad.easeOut' });
    this.onomatopee(360, 280, 'BOUM !', '#f3d98a');
    this.cameras.main.shake(200, 0.008);
    await this.attendre(500);
    this.tweens.killTweensOf(this.mentor);
    await this.animer({ targets: this.mentor, x: 470, y: 318, duration: 600, ease: 'Back.easeOut' });
    this.onomatopee(470, 270, 'SPLOTCH');
    await this.animer({ targets: this.heros, angle: 0, duration: 300 });
    this.ecrire('', "Tu l'as sorti de l'eau. Il pesait aussi lourd qu'un âne... et sentait à peu près pareil.");
    await this.attendreClic();

    // La nuit, au coin du feu.
    await this.animer({ targets: this.voile, fillAlpha: 0.6, duration: 1200 });
    const feu = this.add.graphics().setDepth(2);
    feu.fillStyle(0x6b4423).fillRect(560, 322, 40, 8);
    feu.fillStyle(0xf08a24).fillTriangle(562, 322, 580, 286, 598, 322);
    feu.fillStyle(0xffe066).fillTriangle(570, 322, 580, 300, 590, 322);
    this.tweens.add({ targets: feu, scaleY: 1.04, duration: 120, yoyo: true, repeat: -1 });
    this.ecrire('Pendant des jours...', 'Tu as fait un feu, réparé ses armes, soigné ses blessures, et chassé pour le nourrir.');
    for (const id of ['epee', 'bandage', 'potion']) {
      const icone = this.add.image(470, 260, id).setScale(0).setDepth(5);
      await this.animer({ targets: icone, scale: 5, duration: 250, ease: 'Back.easeOut' });
      await this.animer({ targets: icone, alpha: 0, y: 230, duration: 400 });
      icone.destroy();
    }
    await this.attendreClic();

    // Il mange comme quatre.
    this.ecrire('', 'Il mangeait comme quatre.');
    for (let i = 0; i < 6; i++) {
      const r = this.add.image(380, 300, 'ration').setScale(4).setDepth(5);
      this.animer({ targets: r, x: 470, y: 310, duration: 300 }).then(() => r.destroy());
      this.onomatopee(490 + (i % 2) * 30, 260 - i * 6, 'MIAM');
      await this.attendre(250);
    }
    this.ecrire('', 'Il mangeait comme quatre. Peut-être même comme cinq.');
    await this.attendreClic();

    // Le départ et la promesse.
    feu.destroy();
    await this.animer({ targets: this.voile, fillAlpha: 0, duration: 1000 });
    this.mentor.setOrigin(0.5, 1).setAngle(0).setPosition(470, 330);
    this.ecrire('Garrick Cœur-de-Chêne', `« Je te dois la vie, ${petit}. Si je survis à ma quête, je reviendrai te récompenser. Promis. »`);
    await this.attendreClic();
    await this.marcher(this.mentor, 1020, 4);
    await this.marcher(this.heros, 300);

    // Le temps passe.
    this.ecrire('', 'Les jours passèrent. Puis les semaines. Tu commençais à croire qu\'il ne reviendrait jamais...');
    await this.animer({ targets: this.voile, fillAlpha: 0.7, duration: 500, yoyo: true, repeat: 2 });
    await this.attendreClic();

    // Le retour : Garrick porte un coffre au trésor à bout de bras, au-dessus de sa tête !
    this.mentor.setTexture(corpsHD(this, 'mentor', 'leves')).setPosition(1020, 330);
    const coffre = this.add.image(1020, 220, coffreTresorHD(this)).setOrigin(0.5, 1).setScale(2).setDepth(5);
    const porter = () => coffre.setPosition(this.mentor.x, this.mentor.y - this.mentor.displayHeight + 8);
    this.events.on('update', porter);
    // (quelques pièces s'en échappent en route)
    this.time.addEvent({ delay: 260, repeat: 8, callback: () => {
      if (!coffre.active) return;
      const p = this.add.image(coffre.x + Phaser.Math.Between(-20, 20), coffre.y - 40, 'pieceFace').setScale(2).setDepth(6);
      this.tweens.add({ targets: p, y: p.y - 40, x: p.x + Phaser.Math.Between(-30, 30), alpha: 0, angle: 180, duration: 700, onComplete: () => p.destroy() });
    } });
    this.ecrire('', "Et puis, un soir, quelqu'un siffla au bout du chemin...");
    await this.marcher(this.mentor, 520, 5);
    // Il pose le coffre à tes pieds, dans un nuage d'étincelles
    this.events.off('update', porter);
    this.mentor.setTexture(corpsHD(this, 'mentor'));
    await this.animer({ targets: coffre, x: 430, y: 334, duration: 450, ease: 'Bounce.easeOut' });
    this.cameras.main.shake(150, 0.004);
    for (let i = 0; i < 10; i++) {
      const etoile = this.add.star(Phaser.Math.Between(380, 480), Phaser.Math.Between(250, 310), 4, 3, 7, 0xffe066).setDepth(6);
      this.tweens.add({ targets: etoile, alpha: 0, scale: 2, duration: 900, delay: i * 80, onComplete: () => etoile.destroy() });
    }
    this.ecrire('Garrick Cœur-de-Chêne', `« Tu croyais que je t'avais oublié${e} ? Voici ta part du trésor ! Alors, que veux-tu en faire ? »`);
    await this.attendreClic();
    this.ecrire(nomJoueur(window.GAME, 'petit'), "« Je ne sais pas... J'ai bien aimé m'occuper de vous. Vous soigner, vous nourrir, vous préparer pour la route. »");
    await this.attendreClic();
    this.ecrire('Garrick Cœur-de-Chêne', '« Alors c\'est tout trouvé ! Tu vas ouvrir un comptoir pour les aventuriers comme moi. Je t\'offre ton premier shop, et un petit capital pour commencer. »');
    await this.attendreClic();

    // Le shop : une vieille auberge à remettre en état (la scène de rénovation).
    this.finir();
  }
}
