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
    const retour = creerBouton(this, 80, 30, 130, '◀ Menu', () => allerA(this, 'Titre'));
    retour.label.setFontSize(15);

    // L'aperçu : toi, au début de l'aventure
    this.add.image(220, 250, panneauHD(this, 380, 330)).setScale(2);
    this.apercu = this.add.image(220, 350, 'perso_heros').setOrigin(0.5, 1).setScale(echelleJoueur(13));
    this.nomApercu = this.add.text(220, 372, '', style(20, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5);
    // (v1.32) pour un garçon, on prévient : la barbe choisie ne pousse qu'à 18 ans
    this.texteAge = this.add.text(220, 396, `${AGE_DEPART} ans`, style(14, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5);

    // Garçon ou fille
    this.boutonsGenre = [[false, 'Garçon', 140], [true, 'Fille', 300]].map(([feminin, texte, x]) => {
      const b = creerBouton(this, x, 112, 140, texte, () => {
        this.feminin = feminin;
        this.ap.coiffure = apparenceParDefaut(feminin).coiffure;
        this.ap.barbe = 0;
        this.menu.regler({ feminin, barbe: false });
        this.maj();
      });
      return { feminin, b };
    });

    // Les choix, sur un parchemin : des onglets et des vignettes (v1.32, planche 57)
    this.menu = panneauApparence(this, { x: 705, y: 258, l: 470, h: 410, ap: this.ap, feminin: this.feminin, stade: 'petit', barbe: false, aDixHuitAns: true, quandChange: () => this.maj(true) });

    // Le nom de ton comptoir : un vrai champ à remplir, avec un crayon
    this.nomShop = NOM_SHOP_DEFAUT;
    this.add.text(220, 432, "Le nom de ton comptoir :", style(16, '#f3e6c8', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 4 })).setOrigin(0.5);
    const champ = this.add.rectangle(190, 470, 300, 38, 0xfff8e8).setStrokeStyle(3, 0x8a6a3a).setInteractive({ useHandCursor: true });
    this.texteShop = this.add.text(50, 470, '', style(16, '#3b2410', { fontStyle: 'bold' })).setOrigin(0, 0.5);
    this.curseur = this.add.rectangle(0, 470, 2, 22, 0x3b2410);
    this.tweens.add({ targets: this.curseur, alpha: 0, duration: 500, yoyo: true, repeat: -1 });
    const ecrire = () => demanderTexte('Le nom de ton comptoir', this.nomShop, NOM_SHOP_MAX, nom => {
      if (!this.sys.isActive()) return;   // (v0.58 : on a quitté l'écran pendant que la fenêtre était ouverte)
      if (nom) this.nomShop = nom;
      this.maj();
    });
    champ.on('pointerdown', ecrire);
    champ.on('pointerover', () => champ.setStrokeStyle(3, 0xc9a227));
    champ.on('pointerout', () => champ.setStrokeStyle(3, 0x8a6a3a));
    const crayon = creerBouton(this, 382, 470, 76, '✎', ecrire);
    crayon.label.setFontSize(20);
    this.add.text(220, 500, '(touche le champ pour changer le nom)', style(13, '#e8d4a8', { fontStyle: 'italic', stroke: '#1a0e06', strokeThickness: 3 })).setOrigin(0.5);

    // (v1.40) le didacticiel de Garrick : une case claire, cochée par défaut (on la retrouve dans le menu ☰)
    this.didacticiel = typeof didacticielPrefere === 'function' ? didacticielPrefere() : true;
    const caseD = this.add.text(805, 22, '', style(15, '#f3e6c8', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 4 })).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const noteD = this.add.text(805, 42, '', style(11, '#e8d4a8', { fontStyle: 'italic', stroke: '#1a0e06', strokeThickness: 3 })).setOrigin(0.5);
    const majD = () => { caseD.setText(`${this.didacticiel ? '☑' : '☐'} Didacticiel de Garrick`); noteD.setText(this.didacticiel ? 'conseillé pour une première partie' : 'pas de conseils, tout ouvert dès le jour 1'); };
    caseD.on('pointerdown', () => { this.didacticiel = !this.didacticiel; Son.jouer('clic'); majD(); });
    caseD.on('pointerover', () => caseD.setColor('#ffe066')); caseD.on('pointerout', () => caseD.setColor('#f3e6c8'));
    majD();
    creerBouton(this, 590, 495, 180, 'Au hasard', () => this.auHasard());
    creerBouton(this, 815, 495, 240, "Commencer l'histoire", () => this.commencer());
    this.maj();
  }

  auHasard() {
    for (const cle of Object.keys(this.ap)) this.ap[cle] = Phaser.Math.Between(0, APPARENCE[cle].length - 1);
    if (Math.random() < 0.7) this.ap.couleurBarbe = 0;   // (le plus souvent, la barbe suit les cheveux)
    this.ap.barbe = 0;   // (la barbe se choisit à 18 ans, devant le miroir)
    this.menu.rafraichir();
    this.maj();
  }

  maj() {
    creerTexturesJoueur(this, this.ap, this.feminin);
    const genre = this.feminin ? 'fille' : 'garcon';
    this.apercu.setTexture('joueur_petit');
    this.nomApercu.setText(NOMS_JOUEUR[genre].petit);
    this.texteAge.setText(this.feminin ? `${AGE_DEPART} ans` : `${AGE_DEPART} ans · la barbe se choisira à 18 ans, au miroir`);
    this.texteShop.setText(this.nomShop);
    for (let taille = 16; this.texteShop.width > 270 && taille >= 10; taille--) this.texteShop.setFontSize(taille);
    this.curseur.setX(this.texteShop.x + this.texteShop.width + 3);
    for (const g of this.boutonsGenre) {
      const choisi = g.feminin === this.feminin;
      g.b.fond.setTint(choisi ? 0xffffff : 0x8a7a6a);
      g.b.label.setColor(choisi ? '#ffe9a0' : '#c8b8a0');
    }
  }

  commencer() {
    if (typeof reglerDidacticiel === 'function') reglerDidacticiel(this.didacticiel, null);
    nouvellePartie({ feminin: this.feminin, apparence: { ...this.ap }, nomShop: this.nomShop });
    allerA(this, 'IntroHistoire');
  }
}

const SOL_FORET = 337, SOL_COMTE = 352;   // (v0.58 : les pieds posés sur la berge, puis sur le chemin)

class IntroHistoireScene extends Cinematique {
  constructor() { super('IntroHistoire'); }

  create() {
    this.fini = false; // (la scène peut être rejouée dans la même session)
    const G = window.GAME;
    this.f = G.joueur.feminin;
    creerInterieurHD(this);
    this.e = this.f ? 'e' : '';
    this.cameras.main.fadeIn(600);

    // La forêt, et sa rivière turquoise où dansent les reflets du soleil
    this.fond = this.add.graphics();
    dessinerComte(this.fond, 0, 0, 960, 370, 0, 'foret');
    this.riviere = poserRiviereHD(this, 332, 58);
    // La forêt tout autour : la berge sous nos pieds, l'ombre des arbres, de grands sapins devant,
    // la voûte des branches en haut, et quelques rais de soleil qui percent.
    creerForetPremierPlanHD(this);
    this.foret = this.add.container(0, 0);
    // (la berge est derrière les personnages : on marche dessus, et l'aventurier flotte devant)
    this.berge = this.add.tileSprite(0, 318, 960, 14, 'bergeHD').setOrigin(0).setTileScale(2).setDepth(-0.5);
    this.foret.add(this.add.rectangle(480, 185, 960, 370, 0x06140a, 0.2));
    for (let k = 0; k < 4; k++) {
      const r = this.add.triangle(0, 0, 120 + k * 230, 0, 160 + k * 230, 0, 260 + k * 230, 330, 0xfff4c0, 0.07).setOrigin(0).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: r, alpha: 0.14, duration: 2200 + k * 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.foret.add(r);
    }
    this.foret.add(this.add.tileSprite(0, 0, 960, 88, 'vouteForetHD').setOrigin(0).setTileScale(2));
    for (const [x, e] of [[-6, 2.2], [900, 2.4], [760, 1.7]]) this.foret.add(this.add.image(x, 372, 'sapinPremierPlanHD').setOrigin(0, 1).setScale(e));
    this.foret.setDepth(2.5);
    this.voile = this.add.rectangle(480, 185, 960, 370, 0x05051a, 0);

    textureJoueur(this, G); // (crée les textures du joueur si besoin)
    this.heros = this.add.image(220, SOL_FORET, 'joueur_petit').setOrigin(0.5, 1).setScale(echelleJoueur(7.5));   // (v0.57 : plus grand)
    // Quand il ne marche pas, il regarde Garrick (de trois-quarts, vers la droite)
    this.regarder = () => this.heros.setTexture(textureJoueur(this, G, 'troisQuarts')).setFlipX(false);
    this.aller = async (x) => { this.heros.setTexture('joueur_petit'); await this.marcher(this.heros, x); this.regarder(); };
    // (v0.58) Garrick arrive blessé : bandage, sang, manteau déchiré ; on le revoit guéri au retour
    this.mentor = this.add.image(-80, 345, corpsHD(this, 'mentorBlesse')).setOrigin(0.5, 0.5).setScale(7 * ECHELLE_CORPS).setAngle(90);   // (v0.57 : plus grand)
    // Le devant de la rivière, par-dessus l'aventurier : seuls sa tête et son torse dépassent de l'eau.
    const ligneEau = 342;
    this.eauDevant = this.add.tileSprite(0, ligneEau, 960, 390 - ligneEau, 'eauFondHD').setOrigin(0).setTileScale(2, 60 / 32).setAlpha(0.8);
    this.eauDevant.tilePositionY = (ligneEau - 330) / (60 / 32);
    this.tweens.add({ targets: this.eauDevant, tilePositionX: -480, duration: 16000, repeat: -1 });
    const reflets = this.refletsDevant = this.add.tileSprite(0, ligneEau, 960, 390 - ligneEau, 'caustiquesHD').setOrigin(0).setTileScale(2, 60 / 32).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: reflets, tilePositionX: -480, duration: 9000, repeat: -1 });
    // Des rides qui s'écartent autour de lui, et l'écume de son sillage
    this.dansLEau = true;
    this.time.addEvent({ delay: 420, loop: true, callback: () => {
      if (!this.dansLEau || this.mentor.x < 0) return;
      const ride = this.add.ellipse(this.mentor.x, ligneEau, 70, 8).setStrokeStyle(2, 0xe8fcff, 0.7).setDepth(0.5);
      this.tweens.add({ targets: ride, scaleX: 2, scaleY: 1.8, alpha: 0, duration: 1300, onComplete: () => ride.destroy() });
      const ecume = this.add.circle(this.mentor.x - 40 + Math.random() * 10, ligneEau - 1 + Math.random() * 3, 2 + Math.random() * 2, 0xffffff, 0.8).setDepth(0.5);
      this.tweens.add({ targets: ecume, x: ecume.x - 60, alpha: 0, duration: 1200, onComplete: () => ecume.destroy() });
    } });

    this.ombreSol(this.heros);
    // les voix : la tienne, et celle de Garrick (un peu plus grave)
    this.voixHeros = { nom: G.joueur.nom || 'JeuneGoy', race: 'humain', feminin: this.f };
    this.voixGarrick = { nom: 'Garrick', race: 'humain' };
    this.creerBoiteTexte();
    this.boutonPasser(() => this.finir());
    this.regarder();
    this.volerAvantDeRaconter();
  }

  // L'entrée : la caméra vole à travers les arbres de la forêt, de plus en plus vite, jusqu'à
  // arriver sur notre personnage au bord de la rivière. Là, l'histoire commence.
  async volerAvantDeRaconter() {
    const cam = this.cameras.main;
    const boite = [this.boite, this.entete, this.texte, this.indice];
    boite.forEach(o => o.setVisible(false));
    // On part de très près, au cœur du bois, et on recule jusqu'au plan de la rivière.
    // (la caméra du jeu est déjà zoomée depuis le coin en haut à gauche : on multiplie, et on
    // calcule nous-mêmes le défilement pour viser un point)
    const z0 = cam.zoom, k = 2.6;
    cam.setZoom(z0 * k).setScroll(430 - 480 / k, 200 - 270 / k);
    const nuit = this.add.rectangle(480, 185, 960, 370, 0x03110a, 0.9).setDepth(29);
    Son.jouer('vent', { duree: 5 });
    // Les arbres qu'on frôle : chacun surgit du fond, grossit et file sur le côté
    const vol = [];
    const arbres = [[0.0, -1, 2.2], [0.5, 1, 2.6], [0.95, -1, 1.9], [1.35, 1, 2.4], [1.7, -1, 2.8], [2.0, 1, 2.0], [2.3, -1, 2.5], [2.6, 1, 2.3], [2.9, -1, 2.0], [3.2, 1, 2.4], [3.5, -1, 1.8]];
    for (const [delai, cote, taille] of arbres) {
      const a = this.add.image(430 + cote * 30, 230, 'sapinPremierPlanHD').setOrigin(0.5, 1).setScale(0.35).setDepth(30).setAlpha(0).setTint(0x0c2214);
      vol.push(a);
      this.time.delayedCall(delai * 1000, () => {
        if (this.fini) return;
        Son.jouer('vol', { force: 0.6 + taille * 0.2 });
        this.tweens.add({ targets: a, alpha: 1, duration: 100 });
        this.tweens.add({ targets: a, scale: taille * 3, x: 430 + cote * 700, y: 230 + 420, duration: 700, ease: 'Cubic.easeIn', onComplete: () => a.destroy() });
      });
    }
    // La lumière revient à mesure qu'on sort du bois, et la caméra se pose sur la rivière
    this.tweens.add({ targets: nuit, fillAlpha: 0, duration: 3200, delay: 1200 });
    await this.animer({ targets: cam, zoom: z0, scrollX: 0, scrollY: 0, duration: 4400, ease: 'Sine.easeInOut' });
    nuit.destroy(); vol.forEach(a => a.active && a.destroy());
    cam.setZoom(z0).setScroll(0, 0);
    if (this.fini) return;
    boite.forEach(o => o.setVisible(true));
    this.raconter();
  }

  // --- (v1.08, planche 37 C) Garrick dans le courant : le rondin raté, puis le vieux tonneau ---
  // Le rondin (une bûche ronde qui flotte, sa mousse, ses cernes) et le vieux tonneau cerclé de fer
  texturesRiviere() {
    if (!this.textures.exists('rondinRiviere')) {
      const t = this.make.graphics({ add: false });
      t.fillStyle(0x4a2e18).fillRoundedRect(0, 6, 200, 30, 14).fillStyle(0x6a4424).fillRoundedRect(4, 8, 192, 12, 8);
      for (let x = 14; x < 186; x += 22) t.fillStyle(0x3a2210).fillRect(x, 12 + (x % 3) * 4, 12, 2);
      t.fillStyle(0xc8a070).fillEllipse(196, 21, 14, 28).lineStyle(2, 0x8a6030).strokeEllipse(196, 21, 8, 18);
      t.fillStyle(0x3a6a2a).fillRect(60, 2, 3, 8).fillRect(58, 0, 8, 3);
      t.generateTexture('rondinRiviere', 206, 40); t.destroy();
    }
    if (!this.textures.exists('tonneauRiviere')) {
      const t = this.make.graphics({ add: false });
      t.fillStyle(0x7a4a22).fillRoundedRect(0, 0, 64, 80, 10);
      for (let x = 6; x < 60; x += 11) t.fillStyle(0x5a3416).fillRect(x, 2, 2, 76);
      t.fillStyle(0x3a3a40).fillRect(0, 12, 64, 6).fillRect(0, 62, 64, 6).fillStyle(0x8a8a90).fillRect(0, 12, 64, 2).fillRect(0, 62, 64, 2);
      t.fillStyle(0x9a6a3a).fillEllipse(32, 4, 60, 10);
      t.generateTexture('tonneauRiviere', 64, 82); t.destroy();
    }
  }

  // Il bat des bras dans l'eau : ses images de pas, en boucle (jamais une image figée qui glisse)
  nagerAvec(pose) {
    const cle = corpsHD(this, 'mentorBlesse', pose);
    const imgs = [cle, cle + '_pas1', cle, cle + '_pas2'];
    if (this.brasse) this.brasse.remove();
    let k = 0;
    this.mentor.setTexture(cle);
    this.brasse = this.time.addEvent({ delay: 300, loop: true, callback: () => { if (this.mentor.active) this.mentor.setTexture(imgs[++k % 4]); } });
  }

  // Une bulle « blub » qui remonte (il boit la tasse)
  blub(x, y) {
    const t = this.add.text(x, y, 'blub', style(13, '#e8fcff', { fontStyle: 'bold italic', stroke: '#1a4a5a', strokeThickness: 3 })).setOrigin(0.5).setDepth(3);
    this.tweens.add({ targets: t, y: y - 30, alpha: 0, duration: 1200, onComplete: () => t.destroy() });
  }

  async garrickDansLeCourant() {
    const eau = 342, g = this.mentor, E = 7 * ECHELLE_CORPS;
    this.texturesRiviere();
    // il arrive en se débattant, les bras en l'air, la tête à peine hors de l'eau
    g.setOrigin(0.5, 0.45).setScale(E * 1.05).setAngle(-8).setPosition(-90, eau - 10);
    this.nagerAvec('leves');
    this.tweens.add({ targets: g, angle: 8, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    // le rondin flotte devant lui, il tangue doucement
    // (plus loin que toi, au milieu de la rivière : on voit bien la scène)
    const rondin = this.add.image(200, eau + 6, 'rondinRiviere').setScale(1.1);
    this.children.moveBelow(rondin, g);
    this.tweens.add({ targets: rondin, x: 470, duration: 2600, ease: 'Sine.easeOut' });
    const roulis = this.tweens.add({ targets: rondin, angle: { from: -4, to: 4 }, y: eau + 2, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    await this.animer({ targets: g, x: 380, duration: 2100, ease: 'Sine.easeOut' });
    if (this.fini) return;
    // il s'y agrippe et se hisse dessus...
    this.emotion(g, '!', 900);
    Son.jouer('voix', { personne: this.voixGarrick, ton: 'etonne', duree: 0.5 });
    this.tweens.killTweensOf(g);
    await this.animer({ targets: g, x: 432, y: eau - 30, angle: -24, duration: 450, ease: 'Quad.easeOut' });
    // ... mais le rondin bascule et l'envoie au fond
    roulis.remove();
    this.onomatopee(g.x + 80, eau - 130, 'OUPS !', '#f3d98a');
    this.tweens.add({ targets: rondin, angle: 200, duration: 650, ease: 'Quad.easeIn' });
    await this.animer({ targets: g, x: 420, y: eau + 40, angle: 30, duration: 500, ease: 'Quad.easeIn' });
    if (this.fini) return;
    eclaboussure(this, g.x, eau, { taille: 1.4, profondeur: 3, ronds: true });
    this.onomatopee(g.x - 60, eau - 50, 'PLOUF !', '#c8e8ff');
    // le rondin s'en va avec le courant, en roulant
    this.tweens.add({ targets: rondin, x: 1180, angle: 560, duration: 3000, ease: 'Sine.easeIn', onComplete: () => rondin.destroy() });
    this.time.delayedCall(250, () => this.blub(g.x - 10, eau - 20));
    this.time.delayedCall(650, () => this.blub(g.x + 14, eau - 26));
    await this.attendre(800);
    // il remonte en crachant de l'eau... et voit arriver un vieux tonneau
    await this.animer({ targets: g, y: eau - 10, angle: -6, duration: 450, ease: 'Back.easeOut' });
    this.onomatopee(g.x + 40, eau - 80, 'KOF KOF !');
    this.tweens.add({ targets: g, angle: 8, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const tonneau = this.tonneau = this.add.image(60, eau + 10, 'tonneauRiviere').setScale(1.15).setAngle(84);
    this.children.moveBelow(tonneau, this.eauDevant);
    this.tweens.add({ targets: tonneau, angle: { from: 78, to: 90 }, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    g.setFlipX(true);   // (il se retourne vers lui)
    await this.animer({ targets: tonneau, x: g.x - 30, duration: 1600, ease: 'Sine.easeOut' });
    if (this.fini) return;
    // il s'y cramponne de tout son poids : on voit sa tête et ses bras par-dessus
    g.setFlipX(false);
    this.tweens.killTweensOf(g);
    this.nagerAvec('accueil');
    this.onomatopee(g.x, eau - 90, 'OUF !', '#fff4dc');
    await this.animer({ targets: g, x: tonneau.x + 6, y: eau - 22, angle: -10, duration: 350, ease: 'Quad.easeOut' });
    // désormais, le tonneau le porte : il le suit, et tous deux tanguent avec le courant
    const suivre = () => { if (tonneau.active && g.active && this.tonneau === tonneau) tonneau.setPosition(g.x - 6, g.y + 32); };
    this.events.on('update', suivre);
    this.events.once('shutdown', () => this.events.off('update', suivre));
    this.suivreTonneau = suivre;
    this.tweens.add({ targets: g, angle: { from: -12, to: -2 }, y: eau - 18, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  // Tiré sur la berge : il lâche le tonneau, qui file avec le courant ; on le sort allongé, comme avant
  lacherTonneau() {
    if (this.brasse) { this.brasse.remove(); this.brasse = null; }
    if (this.suivreTonneau) { this.events.off('update', this.suivreTonneau); this.suivreTonneau = null; }
    const t = this.tonneau; this.tonneau = null;
    if (t && t.active) this.tweens.add({ targets: t, x: 1100, angle: 300, duration: 3200, ease: 'Sine.easeIn', onComplete: () => t.destroy() });
    this.mentor.setTexture(corpsHD(this, 'mentorBlesse')).setOrigin(0.5, 0.5).setScale(7 * ECHELLE_CORPS).setFlipX(false).setAngle(90).setY(345);
  }

  finir() {
    if (this.fini) return;
    this.fini = true;
    this.cameras.main.fadeOut(500);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Renovation'));
  }

  // Changement de décor : de la forêt et sa rivière aux collines de la Comté et leur chemin.
  async versLaComte() {
    // (v0.57) un vrai fondu au noir, puis la Comté qui apparaît doucement
    this.cameras.main.fadeOut(800, 0, 0, 0);
    await this.attendre(850);
    if (this.fini) return;   // (audit v0.59 : « Passer » pendant le fondu)
    this.riviere.setVisible(false); this.eauDevant.setVisible(false); this.refletsDevant.setVisible(false); this.foret.setVisible(false); this.berge.setVisible(false);
    const comte = this.add.graphics().setDepth(-1);
    dessinerComte(comte, 0, 0, 960, 370, 0, 'comte');
    comte.paysage.setDepth(-1);
    this.fond.paysage.setVisible(false);
    this.add.image(0, 330, pavesHD(this, 960, 60)).setOrigin(0).setScale(2).setDepth(-0.5).setTint(0xc8b090);
    this.heros.setPosition(300, SOL_COMTE); this.heros.sol = SOL_COMTE;
    this.cameras.main.fadeIn(1200, 0, 0, 0);
    await this.attendre(1000);
  }

  async raconter() {
    const e = this.e;
    const petit = this.f ? 'petite' : 'petit';

    this.ecrire('Il y a bien longtemps...', `Dans la Comté vivait un${e} jeune orphelin${e}. Pas de famille, pas de maison... juste la rivière, et beaucoup d'imagination.`);
    await this.attendreClic();

    // (v1.08, planche 37 C validée) L'aventurier arrive en se débattant dans le courant : il tente
    // d'agripper un rondin qui roule et lui échappe, boit la tasse, puis se cramponne à un vieux tonneau.
    this.ecrire('Un matin...', "La rivière a charrié quelque chose d'inhabituel : un aventurier à moitié noyé, qui se débattait dans le courant.");
    this.time.delayedCall(1300, () => { this.emotion(this.heros, '!'); Son.jouer('voix', { personne: this.voixHeros, ton: 'peur' }); this.geste(this.heros, 'recule'); });
    await this.garrickDansLeCourant();
    this.ajouterTexte(" Il a raté un rondin, bu la moitié de la rivière... et s'est cramponné à un vieux tonneau.");
    await this.animer({ targets: this.mentor, x: 520, duration: 2400, ease: 'Sine.easeOut' });   // (le tonneau le suit)
    await this.attendreClic();

    // Tu tires... et tu tombes sur les fesses.
    await this.aller(430);
    this.regarderVers(this.heros, this.mentor);
    this.ecrire('', 'Tu as tiré. Et tiré. Et tiré encore...');
    Son.jouer('voix', { personne: this.voixHeros, ton: 'fache', duree: 0.6 });
    await this.animer({ targets: this.heros, x: 410, duration: 250, yoyo: true, repeat: 2 });
    this.onomatopee(400, 250, 'HNNNG !');
    await this.animer({ targets: this.heros, x: 360, angle: -80, duration: 300, ease: 'Quad.easeOut' });
    this.onomatopee(360, 280, 'BOUM !', '#f3d98a');
    this.cameras.main.shake(200, 0.008);
    await this.attendre(500);
    this.tweens.killTweensOf(this.mentor);
    this.dansLEau = false;
    this.lacherTonneau();   // (il lâche le tonneau, qui file avec le courant ; on le sort de l'eau allongé)
    // Il sort de l'eau dans une gerbe d'éclaboussures
    for (const dx of [-30, 20]) eclaboussure(this, this.mentor.x + dx, 342, { taille: 1.6, profondeur: 3, ronds: dx < 0 });   // (v0.70)
    await this.animer({ targets: this.mentor, x: 470, y: 308, angle: 90, duration: 600, ease: 'Back.easeOut' });
    this.onomatopee(470, 270, 'SPLOTCH');
    await this.animer({ targets: this.heros, angle: 0, duration: 300 });
    // Il gémit, à peine conscient
    this.emotion(this.mentor, '…', 1800);
    Son.jouer('voix', { personne: this.voixGarrick, ton: 'triste', duree: 0.9 });
    this.ecrire('', "Tu l'as sorti de l'eau. Il pesait aussi lourd qu'un âne... et sentait à peu près pareil.");
    this.time.delayedCall(700, () => this.emotion(this.heros, 'larme', 1200));
    await this.attendreClic();

    // La nuit, au coin du feu.
    await this.animer({ targets: this.voile, fillAlpha: 0.6, duration: 1200 });
    creerRecitHD(this); creerInterieurHD(this); creerHalo(this);
    const feu = this.add.container(0, 0).setDepth(2);
    feu.add(this.add.image(580, 322, 'feuCampHD').setOrigin(0.5, 1).setScale(2.5));
    for (const [dx, e, delai] of [[-9, 4, 2], [9, 4, 1], [0, 6, 0]]) {
      const f = this.add.sprite(580 + dx, 310, 'flammeBougie0').setOrigin(0.5, 1).setScale(e * 1.5, e).play('flammeBougie');
      f.anims.setProgress(delai / 3);
      feu.add(f);
    }
    const lueurFeu = this.add.image(580, 292, 'halo').setScale(3).setTint(0xffa040).setAlpha(0.45).setBlendMode(Phaser.BlendModes.ADD).setDepth(8);
    feu.add(lueurFeu);
    this.tweens.add({ targets: lueurFeu, alpha: 0.3, scale: 2.7, duration: 300, yoyo: true, repeat: -1 });
    this.ecrire('Pendant des jours...', 'Tu as fait un feu, réparé ses armes, soigné ses blessures, et chassé pour le nourrir.');
    this.regarderVers(this.heros, this.mentor);
    for (const id of ['epee', 'bandage', 'potion']) {
      const icone = this.add.image(470, 260, iconeObjet(this, id)).setScale(0).setDepth(5);
      await this.animer({ targets: icone, scale: 3.5, duration: 250, ease: 'Back.easeOut' });
      await this.animer({ targets: icone, alpha: 0, y: 230, duration: 400 });
      icone.destroy();
    }
    await this.attendreClic();

    // Il mange comme quatre.
    this.ecrire('', 'Il mangeait comme quatre.');
    // (v0.57 : des bruits variés, un à la fois, au lieu de « MIAM » empilés)
    const bruits = ['Miam !', 'Crunch !', 'Glou !', 'Miam !'];
    for (let i = 0; i < 4; i++) {
      const r = this.add.image(380, 300, iconeObjet(this, i === 2 ? 'gourde' : 'ration')).setScale(2.6).setDepth(5);
      this.animer({ targets: r, x: 470, y: 310, duration: 300 }).then(() => r.destroy());
      this.onomatopee(500 + (i % 2) * 50, 250 - (i % 2) * 20, bruits[i]);
      await this.attendre(520);
    }
    this.ecrire('', 'Il mangeait comme quatre. Peut-être même comme cinq.');
    this.emotion(this.heros, '?');
    Son.jouer('voix', { personne: this.voixHeros, ton: 'etonne', duree: 0.5 });
    await this.attendreClic();

    // Le départ et la promesse.
    feu.destroy();
    await this.animer({ targets: this.voile, fillAlpha: 0, duration: 1000 });
    // Guéri : debout, le manteau recousu, plus de bandage ; il se tourne vers toi
    this.mentor.setTexture(corpsHD(this, 'mentor')).setOrigin(0.5, 1).setAngle(0).setPosition(500, SOL_FORET);
    this.ombreSol(this.mentor);
    this.regarderVers(this.heros, this.mentor);
    await this.replique('Garrick Cœur-de-Chêne', `« Je te dois la vie, ${petit}. Sans toi, la rivière m'emportait jusqu'à la mer. »`,
      { sprite: this.mentor, vers: this.heros, personne: this.voixGarrick, ton: 'merci', emotion: 'merci', geste: 'hoche' });
    const reve = this.pensee(this.mentor, coffreTresorHD(this), { echelle: 1.3 });
    await this.replique('Garrick Cœur-de-Chêne', '« Si je survis à ma quête, je reviendrai te récompenser. Avec un trésor, foi de Cœur-de-Chêne ! Promis. »',
      { sprite: this.mentor, vers: this.heros, personne: this.voixGarrick, ton: 'content' });
    this.fermerPensee(reve);
    await this.replique(nomJoueur(window.GAME, 'petit'), '« Revenez vivant, surtout ! »', { sprite: this.heros, vers: this.mentor, personne: this.voixHeros, ton: 'inquiet', emotion: '♥' });
    // Il s'en va de l'autre côté du chemin ; tu le salues jusqu'à ce qu'il disparaisse
    const depart = this.marcher(this.mentor, 1020, 4);
    this.time.delayedCall(500, () => { this.geste(this.heros, 'salut'); this.emotion(this.mentor, 'joie', 900); });
    await depart;
    await this.aller(300);

    // Le temps passe... et on rentre dans la Comté, au bord du chemin, à guetter son retour.
    await this.versLaComte();
    this.ecrire('', 'Les jours ont passé. Puis les semaines. De retour dans la Comté, tu guettais le chemin... Tu commençais à croire qu\'il ne reviendrait jamais...');
    this.time.delayedCall(800, () => { this.emotion(this.heros, '…', 2000); Son.jouer('voix', { personne: this.voixHeros, ton: 'triste' }); });
    await this.animer({ targets: this.voile, fillAlpha: 0.7, duration: 500, yoyo: true, repeat: 2 });
    await this.attendreClic();

    // Le retour : Garrick porte un coffre au trésor à bout de bras, au-dessus de sa tête !
    this.mentor.setTexture(corpsHD(this, 'mentor', 'leves')).setPosition(1020, SOL_COMTE); this.mentor.sol = SOL_COMTE;
    const coffre = this.add.image(1020, 220, coffreTresorHD(this)).setOrigin(0.5, 1).setScale(2).setDepth(5);
    const porter = () => coffre.setPosition(this.mentor.x, this.mentor.y - this.mentor.displayHeight + 8);
    this.events.on('update', porter);
    this.events.once('shutdown', () => this.events.off('update', porter)); // (si on passe la cinématique)
    // (quelques pièces s'en échappent en route)
    this.time.addEvent({ delay: 260, repeat: 8, callback: () => {
      if (!coffre.active) return;
      const p = this.add.image(coffre.x + Phaser.Math.Between(-20, 20), coffre.y - 40, 'pieceFace').setScale(2).setDepth(6);
      this.tweens.add({ targets: p, y: p.y - 40, x: p.x + Phaser.Math.Between(-30, 30), alpha: 0, angle: 180, duration: 700, onComplete: () => p.destroy() });
    } });
    this.ecrire('', "Et puis, un soir, quelqu'un a sifflé au bout du chemin...");
    Son.jouer('siffle');
    this.time.delayedCall(600, () => { this.regarderVers(this.heros, this.mentor); this.emotion(this.heros, '!'); this.geste(this.heros, 'saut'); Son.jouer('voix', { personne: this.voixHeros, ton: 'etonne' }); });
    await this.marcher(this.mentor, 520, 5);
    this.regarderVers(this.mentor, this.heros);
    // Il pose le coffre à tes pieds, dans un nuage d'étincelles
    this.events.off('update', porter);
    this.mentor.setTexture(corpsHD(this, 'mentor'));
    await this.animer({ targets: coffre, x: 430, y: 334, duration: 450, ease: 'Bounce.easeOut' });
    this.cameras.main.shake(150, 0.004);
    for (let i = 0; i < 10; i++) {
      const etoile = this.add.star(Phaser.Math.Between(380, 480), Phaser.Math.Between(250, 310), 4, 3, 7, 0xffe066).setDepth(6);
      this.tweens.add({ targets: etoile, alpha: 0, scale: 2, duration: 900, delay: i * 80, onComplete: () => etoile.destroy() });
    }
    await this.replique('Garrick Cœur-de-Chêne', `« Tu croyais que je t'avais oublié${e} ? Voici ta part du trésor ! Alors, que veux-tu en faire ? »`,
      { sprite: this.mentor, vers: this.heros, personne: this.voixGarrick, ton: 'rire', emotion: 'joie', geste: 'bras', quoi: 'mentor' });
    const souvenir = this.pensee(this.heros, iconeObjet(this, 'bandage'), { echelle: 2.6 });
    await this.replique(nomJoueur(window.GAME, 'petit'), "« Je ne sais pas... J'ai bien aimé m'occuper de vous. Vous soigner, vous nourrir, vous préparer pour la route. »",
      { sprite: this.heros, vers: this.mentor, personne: this.voixHeros, ton: 'inquiet' });
    this.fermerPensee(souvenir);
    creerComptoirCarteHD(this);
    const idee = this.pensee(this.mentor, 'comptoirCarteHD', { echelle: 1.4 });   // (il rêve déjà de ton shop)
    await this.replique('Garrick Cœur-de-Chêne', '« Alors c\'est tout trouvé ! Tu vas ouvrir un comptoir pour les aventuriers comme moi. Je t\'offre ta première échoppe, et un petit capital pour commencer. »',
      { sprite: this.mentor, vers: this.heros, personne: this.voixGarrick, ton: 'content', emotion: 'idee', geste: 'hoche' });
    this.fermerPensee(idee);
    this.emotion(this.heros, '♥');
    Son.jouer('voix', { personne: this.voixHeros, ton: 'content' });
    await this.geste(this.heros, 'saut');

    // Le shop : une vieille auberge à remettre en état (la scène de rénovation).
    this.finir();
  }
}
