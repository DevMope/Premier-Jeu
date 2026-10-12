// La création du personnage : garçon ou fille, puis cheveux, yeux, bouche,
// barbe, couleurs... L'aperçu montre le personnage au début de l'aventure.
class IntroScene extends Phaser.Scene {
  constructor() { super('Intro'); }

  create() {
    this.feminin = false;
    this.ap = apparenceParDefaut(false);
    this.cameras.main.setBackgroundColor('#1e140c');
    this.cameras.main.fadeIn(400);
    this.add.text(480, 34, 'Qui es-tu ?', style(30, '#f3d98a', { fontStyle: 'bold' })).setOrigin(0.5);

    // L'aperçu : toi, au début de l'aventure
    this.add.rectangle(220, 250, 380, 330, 0x2a1a10).setStrokeStyle(3, 0xc9a227);
    this.apercu = this.add.image(220, 350, 'perso_heros').setOrigin(0.5, 1).setScale(13);
    this.nomApercu = this.add.text(220, 372, '', style(18, '#f3d98a', { fontStyle: 'bold' })).setOrigin(0.5);
    this.add.text(220, 398, `${AGE_DEPART} ans · la barbe poussera à 18 ans`, style(12, '#c9b48a', { fontStyle: 'italic' })).setOrigin(0.5);

    // Garçon ou fille
    this.boutonsGenre = [[false, 'Garçon', 140], [true, 'Fille', 300]].map(([feminin, texte, x]) => {
      const fond = this.add.rectangle(x, 110, 140, 36, 0x5a4030).setStrokeStyle(2, 0xc9a227).setInteractive({ useHandCursor: true });
      this.add.text(x, 110, texte, style(16, '#fff4dc', { fontStyle: 'bold' })).setOrigin(0.5);
      fond.on('pointerdown', () => {
        this.feminin = feminin;
        this.ap.coiffure = apparenceParDefaut(feminin).coiffure;
        this.maj();
      });
      return { feminin, fond };
    });

    // Les choix
    const options = [
      ['coiffure', 'Coiffure'], ['cheveux', 'Cheveux'], ['peau', 'Peau'], ['yeux', 'Yeux'],
      ['bouche', 'Bouche'], ['barbe', 'Barbe'], ['haut', 'Habit du haut'], ['bas', 'Habit du bas'],
    ];
    this.lignes = options.map(([cle, libelle], i) => {
      const y = 100 + i * 42;
      this.add.text(450, y, libelle, style(16, '#f3e6c8')).setOrigin(0, 0.5);
      this.fleche(640, y, '◀', () => this.changer(cle, -1));
      this.fleche(880, y, '▶', () => this.changer(cle, 1));
      const valeur = this.add.text(760, y, '', style(15, '#f3d98a', { fontStyle: 'bold' })).setOrigin(0.5);
      const pastille = this.add.rectangle(690, y, 16, 16, 0xffffff).setStrokeStyle(1, 0x000000);
      return { cle, valeur, pastille };
    });

    creerBouton(this, 600, 480, 180, 'Au hasard', () => this.auHasard());
    creerBouton(this, 820, 480, 230, "Commencer l'histoire", () => this.commencer());
    this.maj();
  }

  fleche(x, y, texte, action) {
    const t = this.add.text(x, y, texte, style(20, '#c9a227', { fontStyle: 'bold' })).setOrigin(0.5).setInteractive({ useHandCursor: true });
    t.on('pointerdown', action);
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
    creerTexturesJoueur(this, this.ap);
    const genre = this.feminin ? 'fille' : 'garcon';
    this.apercu.setTexture('joueur_petit');
    this.nomApercu.setText(NOMS_JOUEUR[genre].petit);
    for (const b of this.boutonsGenre) b.fond.setFillStyle(b.feminin === this.feminin ? 0x8a5a2b : 0x3b2a1a);
    for (const l of this.lignes) {
      const choix = APPARENCE[l.cle][this.ap[l.cle]];
      const couleur = Array.isArray(choix);
      l.valeur.setText(couleur ? choix[0] : choix);
      l.pastille.setVisible(couleur);
      if (couleur) l.pastille.setFillStyle(choix[1]);
    }
  }

  commencer() {
    nouvellePartie({ feminin: this.feminin, apparence: { ...this.ap } });
    this.scene.start('IntroHistoire');
  }
}

class IntroHistoireScene extends Cinematique {
  constructor() { super('IntroHistoire'); }

  create() {
    const G = window.GAME;
    this.f = G.joueur.feminin;
    this.e = this.f ? 'e' : '';
    this.cameras.main.fadeIn(600);

    // La rivière, au pied des collines
    this.fond = this.add.graphics();
    dessinerComte(this.fond, 0, 0, 960, 370, 0);
    this.riviere = this.add.graphics();
    this.riviere.fillStyle(0x2f6a9a).fillRect(0, 330, 960, 50);
    this.vagues = [];
    for (let i = 0; i < 14; i++) {
      const v = this.add.rectangle(i * 75, 340 + (i % 3) * 10, 22, 3, 0x8fd0f0);
      this.tweens.add({ targets: v, x: v.x + 75, duration: 1800, repeat: -1 });
      this.vagues.push(v);
    }
    this.voile = this.add.rectangle(480, 185, 960, 370, 0x05051a, 0);

    this.heros = this.add.image(220, 330, 'joueur_petit').setOrigin(0.5, 1).setScale(4);
    this.mentor = this.add.image(-80, 345, 'perso_mentor').setOrigin(0.5, 0.5).setScale(6).setAngle(90);

    this.creerBoiteTexte();
    this.boutonPasser(() => this.finir());
    this.raconter();
  }

  finir() {
    if (this.fini) return;
    this.fini = true;
    this.cameras.main.fadeOut(500);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Comptoir'));
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

    // Le retour, avec un coffre !
    this.mentor.setPosition(1020, 330);
    const coffre = this.add.image(1020, 220, 'coffre').setScale(6).setDepth(5);
    this.tweens.add({ targets: coffre, x: 520, duration: 2500 });
    this.ecrire('', "Et puis, un soir, quelqu'un siffla au bout du chemin...");
    await this.marcher(this.mentor, 520, 5);
    for (let i = 0; i < 10; i++) {
      const etoile = this.add.star(Phaser.Math.Between(470, 570), Phaser.Math.Between(170, 230), 4, 3, 7, 0xffe066).setDepth(6);
      this.tweens.add({ targets: etoile, alpha: 0, scale: 2, duration: 900, delay: i * 80, onComplete: () => etoile.destroy() });
    }
    this.ecrire('Garrick Cœur-de-Chêne', `« Tu croyais que je t'avais oublié${e} ? Voici ta part du trésor ! Alors, que veux-tu en faire ? »`);
    await this.attendreClic();
    this.ecrire(nomJoueur(window.GAME, 'petit'), "« Je ne sais pas... J'ai bien aimé m'occuper de vous. Vous soigner, vous nourrir, vous préparer pour la route. »");
    await this.attendreClic();
    this.ecrire('Garrick Cœur-de-Chêne', '« Alors c\'est tout trouvé ! Tu vas ouvrir un comptoir pour les aventuriers comme moi. Je t\'offre ton premier shop, et un petit capital pour commencer. »');
    await this.attendreClic();

    // Le comptoir.
    await this.animer({ targets: this.cameras.main, alpha: 0, duration: 400 });
    this.tweens.killAll();
    this.children.removeAll(true);
    this.cameras.main.setAlpha(1);
    const g = this.add.graphics();
    dessinerComte(g, 0, 0, 960, 370, 0.15);
    const facade = dessinerFacade(this, 480, 345);
    const heros = this.add.image(140, 345, 'joueur_petit').setOrigin(0.5, 1).setScale(5);
    this.add.image(90, 345, 'perso_mentor').setOrigin(0.5, 1).setScale(6);
    this.creerBoiteTexte();
    this.boutonPasser(() => this.finir());
    this.ecrire('Le Comptoir', 'Et c\'est ainsi que tout commença.');
    await this.marcher(heros, facade.porteX - 60);
    this.onomatopee(facade.porteX - 60, 200, 'TADAAA !', '#f3d98a');
    await this.attendreClic();
    this.finir();
  }
}
