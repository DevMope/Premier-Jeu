// Le Marché des Mastres, chaque matin avant d'ouvrir le comptoir :
// quatre étals (épicerie, forge, apothicaire, tailleuse), le Bazar de Rosalie (les cadeaux), les enchères,
// le coin des jeux, le mendiant, et le crieur qui annonce les nouvelles du jour.
// La rue est plus large que l'écran : on la parcourt avec les flèches ◀ ▶.
const LARGEUR_MARCHE = 2080;
const DEPLACEMENT_RUE = 360;
// La vue d'ensemble : la rue entière, réduite, posée sur la grand-place.
const VUE_MARCHE = { echelle: 0.45, x: 12, y: 170 };
// On clique sur un lieu pour l'ouvrir dans le panneau du bas.
class MarcheScene extends Phaser.Scene {
  constructor() { super('Marche'); }

  create() {
    const G = this.G = window.GAME;
    G.banniere = G.jour;
    // (Phaser réutilise la scène d'un jour à l'autre : on repart de zéro)
    this.groupes = [];
    this.desEnCours = false;
    this.etatBonneteau = 'attente';
    // Les étals du jour (s'ils n'ont pas été garnis cette nuit, par exemple avec une vieille sauvegarde)
    const vides = !G.etals || !Object.values(G.etals).some(e => Object.keys(e || {}).length);
    if (vides || (G.etalsJour !== undefined && G.etalsJour !== G.jour)) { G.etals = etalsDuJour(G); G.etalsJour = G.jour; }
    this.cameras.main.fadeIn(500);

    // Le fond de la vue d'ensemble : le ciel, les collines, et la grand-place pavée
    const fondVue = this.add.graphics();
    dessinerComte(fondVue, 0, 0, 960, VUE_MARCHE.y + 300 * VUE_MARCHE.echelle, 'aube'); // le matin, au lever du soleil
    this.add.image(0, VUE_MARCHE.y + 182 * VUE_MARCHE.echelle, placeMarcheHD(this)).setOrigin(0).setScale(2);
    creerLieuxMarcheHD(this);
    this.etiquettesRue = [];

    // La rue du marché, plus large que l'écran : vue de loin d'abord, on s'approche d'un lieu en cliquant.
    this.monde = this.add.container(0, 0);
    const g = this.add.graphics();
    this.monde.add(g);
    dessinerComte(g, 0, 0, LARGEUR_MARCHE, 300, 'aube');
    this.paysageRue = g.paysage;
    this.paveRue = this.add.image(0, 250, pavesHD(this, LARGEUR_MARCHE, 50)).setOrigin(0).setScale(2);
    this.monde.add(this.paveRue);
    this.time.delayedCall(600, () => Son.jouer('coq'));
    this.add.text(480, 22, `Le Marché des Mastres · matin du jour ${G.jour}`, style(24, '#fff4dc', { fontStyle: 'bold', stroke: '#2a1a10', strokeThickness: 5 })).setOrigin(0.5).setDepth(5);

    // Les étals, les enchères, les jeux et le mendiant
    this.positions = { mendiant: [70, 'lieu'], bazar: [1030, 'lieu'], encheres: [1220, 'lieu'], jeux: [1410, 'lieu'], crieur: [1595, 'lieu'], brocante: [1790, 'lieu'], garderobe: [1980, 'lieu'] };
    Object.entries(MARCHANDS).forEach(([cle, m], i) => {
      this.positions[cle] = [260 + i * 190, 'etal'];
      this.creerEtal(cle, m, 260 + i * 190);
    });
    this.creerSurbrillance();
    // Le mendiant, debout contre son tonneau, appuyé sur son bâton, et Brisquet couché à ses pieds
    {
      const avant = this.children.list.length;
      creerDecorPlaceHD(this);
      this.add.image(118, 250, 'tonneauxHD').setOrigin(0.5, 1).setScale(1.5);
      imageCorps(this, 96, 250, 'mendiant', 4.6);
      this.add.image(42, 252, chienHD(this, 'profil', true)).setOrigin(0.5, 1).setScale(0.7);
      this.etiquettesRue.push(this.add.text(84, 262, 'Le mendiant et son chien', style(13, '#fff4dc', { fontStyle: 'bold', stroke: '#2a1a10', strokeThickness: 4 })).setOrigin(0.5));
      this.add.rectangle(84, 200, 160, 120, 0xffffff, 0).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.ouvrirMendiant());
      this.grouper(avant, 84);
    }
    // Le Bazar de Rosalie : une échoppe à rayures vertes, Rosalie derrière sa table de cadeaux
    if (lieuOuvert(G, 'bazar')) this.creerEchoppe(1030, 0x4f8a3a, { nom: 'Rosalie', race: 'hobbit', feminin: true, niveau: 'aguerri' },
      Object.keys(CADEAUX).slice(0, 4), 'Le Bazar de Rosalie', 'Cadeaux', () => this.ouvrirBazar(), 'rosalie');
    else this.creerChantier(1030, 'bazar');
    // La brocante de Firmin (décorations pour le shop) et la garde-robe de Marcelline (pour toi)
    if (lieuOuvert(G, 'brocante')) this.creerEchoppe(1790, 0x8a5a2a, { nom: 'Firmin', race: 'humain', feminin: false, niveau: 'aguerri' },
      ['tropheeCerf', 'horloge', 'globe', 'carillon'], 'La brocante de Firmin', 'Décorations', () => this.ouvrirBrocante(), 'firmin');
    else this.creerChantier(1790, 'brocante');
    if (lieuOuvert(G, 'garderobe')) this.creerEchoppe(1980, 0x7a3a6a, { nom: 'Marcelline', race: 'humain', feminin: true, niveau: 'aguerri' },
      ['chapeau', 'bandana', 'montre', 'pipe'], 'La garde-robe de Marcelline', 'Vêtements et accessoires', () => this.ouvrirGardeRobe(), 'marcelline');
    else this.creerChantier(1980, 'garderobe');
    // Les enchères : une estrade drapée de velours, un portique à bannière, le commissaire au pupitre
    if (!lieuOuvert(G, 'encheres')) this.creerChantier(1220, 'encheres');
    else {
      const avant = this.children.list.length;
      this.add.image(1220, 250, 'estradeEncheres').setOrigin(0.5, 1).setScale(2);
      this.add.text(1220, 126, 'ENCHÈRES', style(14, '#ffe9a0', { fontStyle: 'bold', stroke: '#3a0a0a', strokeThickness: 3 })).setOrigin(0.5);
      imageCorps(this, 1242, 212, { nom: 'Maître Adjugé', race: 'humain', niveau: 'veteran' }, 4.5);
      this.add.image(1212, 212, 'pupitreHD').setOrigin(0.5, 1).setScale(2);
      for (const [i, id] of ['amulette', 'epee'].entries()) this.add.image(1184 + i * 70, 208, iconeObjet(this, id)).setOrigin(0.5, 1).setScale(1.6);
      this.etiquettesRue.push(this.add.text(1220, 262, 'Les enchères', style(13, '#fff4dc', { fontStyle: 'bold', stroke: '#2a1a10', strokeThickness: 4 })).setOrigin(0.5));
      this.add.rectangle(1220, 200, 150, 110, 0xffffff, 0).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.ouvrirEncheres());
      this.grouper(avant, 1220);
    }
    // Le coin des jeux : un auvent violet, Grippesou derrière sa table de dés et de gobelets
    if (!lieuOuvert(G, 'jeux')) this.creerChantier(1410, 'jeux');
    else {
      const avant = this.children.list.length;
      this.add.image(1410, 252, 'auventJeux').setOrigin(0.5, 1).setScale(2);
      this.add.text(1410, 82, '🎲 JEUX 🎲', style(13, '#ffe9a0', { fontStyle: 'bold', stroke: '#2a1040', strokeThickness: 4 })).setOrigin(0.5);
      imageCorps(this, 1410, 230, 'gobelin', 4.5);
      this.add.image(1410, 250, 'tableJeux').setOrigin(0.5, 1).setScale(2);
      this.etiquettesRue.push(this.add.text(1410, 262, 'Le coin des jeux', style(13, '#fff4dc', { fontStyle: 'bold', stroke: '#2a1a10', strokeThickness: 4 })).setOrigin(0.5));
      this.add.rectangle(1410, 200, 150, 110, 0xffffff, 0).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.ouvrirJeux());
      this.grouper(avant, 1410);
    }
    // Le crieur, sur son estrade, à côté de sa cloche
    {
      const avant = this.children.list.length;
      this.add.image(1600, 252, 'estradeCrieur').setOrigin(0.5, 1).setScale(2);
      this.crieur = imageCorps(this, 1590, 210, 'garde', 4.5);
      this.add.image(1572, 170, 'parcheminComptoir').setDisplaySize(16, 22);
      this.add.text(1604, 230, 'NOUVELLES\nDU JOUR', style(11, '#ffe9a0', { fontStyle: 'bold', stroke: '#2a1a10', strokeThickness: 3, align: 'center', lineSpacing: -2 })).setOrigin(0.5);
      this.etiquettesRue.push(this.add.text(1600, 262, 'Le crieur', style(13, '#fff4dc', { fontStyle: 'bold', stroke: '#2a1a10', strokeThickness: 4 })).setOrigin(0.5));
      this.add.rectangle(1600, 200, 110, 120, 0xffffff, 0).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.ouvrirCrieur());
      this.grouper(avant, 1600);
      this.tweens.add({ targets: this.crieur, angle: { from: -3, to: 3 }, duration: 600, yoyo: true, repeat: -1 });
    }

    // Le panneau du bas et la barre d'infos
    this.fondPanneau = this.add.image(480, 388, panneauHD(this, 940, 168)).setScale(2);
    this.retour = creerBouton(this, 100, 94, 170, '◀ Le marché', () => this.vueEnsemble());
    this.retour.label.setFontSize(15);
    this.retour.fond.setDepth(21); this.retour.label.setDepth(21);
    this.creerVueEnsemble();
    this.add.rectangle(480, 510, 960, 60, 0x2a1a10);
    this.bourse = bourse(this, 34, 532, this.G.argent, { echelle: 1.4, taille: 14, aDroite: true });
    this.texteInfos = this.add.text(112, 498, '', style(13, '#f3e6c8', { lineSpacing: 4 }));
    creerBouton(this, 640, 510, 170, 'Rentrer chez toi', () => this.rentrer());
    creerBouton(this, 840, 510, 210, 'Ouvrir le comptoir', () => this.ouvrir());

    this.vueEnsemble(true);
    this.time.delayedCall(700, () => conseilGarrick(this, 'marche'));
    afficherStatutSauvegarde(this, 940, 46, 1);
    // Les commandes prévues, qu'on déroule ou referme
    this.commandesOuvertes = false;
    this.boutonCommandes = this.add.text(16, 46, '', style(14, '#fff4dc', { fontStyle: 'bold', backgroundColor: '#3b2410', padding: { x: 10, y: 5 } }))
      .setDepth(21).setInteractive({ useHandCursor: true });
    this.boutonCommandes.on('pointerdown', () => this.basculerCommandes());
    this.majBoutonCommandes();

    // Le crieur annonce la première nouvelle du jour (clic : toutes les nouvelles).
    if (G.gazette && G.gazette.jour === G.jour && G.gazette.lignes.length) {
      // Une bulle qui sort de la bouche du crieur (dans la vue d'ensemble)
      const arc = this.arcVue(1600);
      const cx = VUE_MARCHE.x + 1590 * VUE_MARCHE.echelle, cy = VUE_MARCHE.y + (250 + arc.dy - 100 * arc.echelle) * VUE_MARCHE.echelle;
      const texte = this.add.text(cx - 24, cy - 34, '📯 « Oyez, oyez ! ' + G.gazette.lignes[0] + ' »', style(13, '#3b2410', {
        fontStyle: 'italic', backgroundColor: '#f6ead0', padding: { x: 8, y: 6 }, wordWrap: { width: 300 } })).setOrigin(1, 1).setDepth(6);
      const queue = this.add.triangle(0, 0, 0, 0, 14, 0, 22, 30, 0xf6ead0).setOrigin(0).setPosition(cx - 38, cy - 35).setDepth(6);
      this.bulleCrieur = this.add.container(0, 0, [texte, queue]).setDepth(6);
      texte.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.ouvrirCrieur());
    }

    // Les nouvelles de l'atelier (une réparation terminée cette nuit)
    if (nouvellesDuMatin(G).length) {
      const t = this.add.text(480, 52, nouvellesDuMatin(G).join('\n'), style(13, '#fff4dc', { fontStyle: 'bold', backgroundColor: '#3b2410', padding: { x: 8, y: 3 }, align: 'center', wordWrap: { width: 640 } })).setOrigin(0.5).setDepth(5);
      this.tweens.add({ targets: t, alpha: 0, delay: 6000, duration: 800 });
    }
  }

  // Les flèches ◀ ▶ pour se déplacer dans la rue du marché.
  creerFlechesRue() {
    this.flechesRue = [[-1, 30], [1, 930]].map(([sens, x]) => {
      const fond = this.add.image(x, 165, boutonFlecheHD(this)).setScale(2.2).setFlipX(sens < 0).setDepth(6).setInteractive({ useHandCursor: true });
      fond.on('pointerdown', () => { Son.jouer('clic'); this.deplacer(this.monde.x - sens * DEPLACEMENT_RUE); });
      fond.on('pointerover', () => fond.setScale(2.4)); fond.on('pointerout', () => fond.setScale(2.2));
      this.tweens.add({ targets: fond, x: x + sens * 4, duration: 500, yoyo: true, repeat: -1 });
      return { sens, fond, t: fond };
    });
    this.majFlechesRue();
  }

  // Fait glisser la rue jusqu'à une position (bornée aux deux bouts de la rue).
  deplacer(x) {
    const cible = Phaser.Math.Clamp(x, 960 - LARGEUR_MARCHE, 0);
    this.tweens.add({ targets: this.monde, x: cible, duration: 450, ease: 'Sine.easeInOut', onComplete: () => this.majFlechesRue() });
  }

  majFlechesRue() {
    if (!this.flechesRue) return;
    for (const f of this.flechesRue) {
      const visible = f.sens < 0 ? this.monde.x < 0 : this.monde.x > 960 - LARGEUR_MARCHE;
      f.fond.setVisible(visible);
      f.t.setVisible(visible);
    }
  }

  // La flèche qui sautille au-dessus du lieu qu'on regarde.
  creerSurbrillance() {
    const f = this.add.graphics();
    f.fillStyle(0xffe066).fillTriangle(-12, -10, 12, -10, 0, 8);
    f.lineStyle(2, 0x3b2410).strokeTriangle(-12, -10, 12, -10, 0, 8);
    this.flecheLieu = this.add.container(0, 0, [f]).setVisible(false);
    this.tweens.add({ targets: f, y: 8, duration: 450, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.monde.add(this.flecheLieu);
  }

  // Tout ce qu'on vient de créer forme un lieu : un groupe posé au sol en (x, 250), qu'on peut
  // avancer, reculer et agrandir pour la vue d'ensemble en demi-cercle.
  grouper(avant, x) {
    const objets = this.children.list.slice(avant);
    const c = this.add.container(x, 250);
    for (const o of objets) { o.x -= x; o.y -= 250; }
    c.add(objets);
    this.monde.add(c);
    (this.groupes = this.groupes || []).push(c);
  }

  // Dans la vue d'ensemble, les lieux forment un demi-cercle autour de la grand-place :
  // ceux du milieu sont au fond (plus haut, plus petits), ceux des bouts au premier plan.
  arcVue(x) {
    const u = (x - LARGEUR_MARCHE / 2) / (LARGEUR_MARCHE / 2);
    return { dy: 125 * u * u - 62, echelle: 0.74 + 0.42 * u * u };
  }

  disposer(enArc, instantane) {
    for (const c of this.groupes) {
      const { dy, echelle } = enArc ? this.arcVue(c.x) : { dy: 0, echelle: 1 };
      this.tweens.killTweensOf(c);
      if (instantane) c.setY(250 + dy).setScale(echelle);
      else this.tweens.add({ targets: c, y: 250 + dy, scale: echelle, duration: 550, ease: 'Sine.easeInOut' });
    }
    this.paveRue.setVisible(!enArc);
    // Les plus proches passent devant
    [...this.groupes].sort((a, b) => this.arcVue(a.x).dy - this.arcVue(b.x).dy).forEach(c => this.monde.bringToTop(c));
    this.monde.bringToTop(this.flecheLieu);
  }

  // On s'approche du lieu : la rue grandit et glisse jusqu'à lui, le panneau du bas s'ouvre.
  montrer(cle) {
    this.lieuMontre = cle;
    const [x, type] = this.positions[cle];
    const etal = type === 'etal';
    this.flecheLieu.setVisible(true).setPosition(x, etal ? 46 : 128);
    this.modeVue = false;
    this.tweens.killTweensOf(this.monde);
    this.tweens.add({ targets: this.monde, scale: 1, y: 0, x: Phaser.Math.Clamp(480 - x, 960 - LARGEUR_MARCHE, 0), duration: 550, ease: 'Sine.easeInOut' });
    this.disposer(false, false);
    if (this.paysageRue) this.paysageRue.setVisible(true);
    this.etiquettesRue.forEach(t => t.setVisible(true));
    this.vue.setVisible(false);
    if (this.bulleCrieur) this.bulleCrieur.setVisible(false);
    for (const o of [this.fondPanneau, this.retour.fond, this.retour.label]) o.setVisible(true);
  }

  // La vue d'ensemble : tout le marché tient sur l'écran, vu d'un peu plus loin.
  vueEnsemble(instantane = false) {
    const { x, y, echelle } = VUE_MARCHE;
    this.modeVue = true;
    this.lieuMontre = null;
    this.tweens.killTweensOf(this.monde);
    if (instantane) this.monde.setPosition(x, y).setScale(echelle);
    else this.tweens.add({ targets: this.monde, x, y, scale: echelle, duration: 550, ease: 'Sine.easeInOut' });
    this.disposer(true, instantane);
    if (this.paysageRue) this.paysageRue.setVisible(false);
    this.etiquettesRue.forEach(t => t.setVisible(false));
    this.flecheLieu.setVisible(false);
    this.vue.setVisible(true);
    if (this.bulleCrieur) this.bulleCrieur.setVisible(true);
    if (this.contenu) this.contenu.setVisible(false);
    for (const o of [this.fondPanneau, this.retour.fond, this.retour.label]) o.setVisible(false);
  }

  // Une pièce dans la fontaine, une fois par jour : on fait un vœu (ça servira, plus tard...)
  jeterPiece() {
    const G = this.G;
    const erreur = jeterPieceFontaine(G);
    if (erreur) return this.message(erreur, '#a03030');
    Son.jouer('piece');
    const piece = this.add.image(560, 300, 'pieceFace').setScale(1.6).setDepth(6);
    this.tweens.add({ targets: piece, x: 480, duration: 650, ease: 'Linear' });
    this.tweens.add({ targets: piece, y: 240, duration: 320, ease: 'Quad.easeOut', yoyo: true, onComplete: () => {
      this.tweens.add({ targets: piece, y: 392, angle: 540, scale: 0.6, duration: 330, ease: 'Quad.easeIn', onComplete: () => {
        Son.jouer('glou');
        for (let k = 0; k < 6; k++) { const r = this.add.ellipse(480, 392, 10, 4).setStrokeStyle(1, 0xe8fcff, 0.8).setDepth(6); this.tweens.add({ targets: r, scaleX: 3 + k, scaleY: 2 + k * 0.5, alpha: 0, duration: 700, delay: k * 70, onComplete: () => r.destroy() }); }
        piece.destroy();
      } });
    } });
    this.majInfos();
    const n = G.fontainePieces;
    this.message(`Plouf ! Tu fermes les yeux et tu fais un vœu... ${n === 1 ? 'Ta première pièce dort au fond de la fontaine.' : `${n} pièces dorment au fond de la fontaine.`}`);
  }

  // Les noms des lieux, lisibles dans la vue d'ensemble, et l'invitation à s'approcher.
  creerVueEnsemble() {
    const { x: ox, y: oy, echelle } = VUE_MARCHE;
    const c = this.vue = this.add.container(0, 0).setDepth(5);
    // La grand-place : une fontaine, des charrettes, des sacs de grain, des tonneaux, des pigeons,
    // et une guirlande de fanions au-dessus des toits.
    creerDecorPlaceHD(this);
    const guirlande = this.add.graphics();
    const couleurs = [0xc0302a, 0xe8c040, 0x2f6a9a, 0x4f8a3a, 0xf3e6c8];
    guirlande.lineStyle(1, 0x3b2410, 0.8);
    const fil = x => 136 + Math.sin((x - 40) / 880 * Math.PI) * 30;
    guirlande.beginPath(); guirlande.moveTo(40, fil(40));
    for (let x = 40; x <= 920; x += 10) guirlande.lineTo(x, fil(x));
    guirlande.strokePath();
    for (let x = 52, k = 0; x < 914; x += 22, k++) {
      guirlande.fillStyle(couleurs[k % couleurs.length]).fillTriangle(x - 6, fil(x - 6), x + 6, fil(x + 6), x, fil(x) + 12);
    }
    c.add(guirlande);
    const decor = [
      ['charretteHD', 92, 448, 1.5, false], ['charretteHD', 872, 452, 1.5, true],
      ['sacsHD', 262, 462, 1.4, false], ['tonneauxHD', 330, 466, 1.3, false],
      ['sacsHD', 700, 466, 1.3, true], ['tonneauxHD', 628, 462, 1.4, true],
    ];
    for (const [cle, x, y, e, miroir] of decor) c.add(this.add.image(x, y, cle).setOrigin(0.5, 1).setScale(e).setFlipX(miroir));
    const fontaine = this.add.image(480, 438, 'fontaineHD').setOrigin(0.5, 1).setScale(1.6).setInteractive({ useHandCursor: true });
    fontaine.on('pointerdown', () => this.jeterPiece());
    c.add(fontaine);
    // Le jet de la fontaine
    this.time.addEvent({ delay: 90, loop: true, callback: () => {
      if (!this.vue.visible) return;
      const goutte = this.add.circle(480 + Phaser.Math.Between(-3, 3), 372, 1.6, 0xc8f0ff, 0.9);
      c.add(goutte);
      const cote = Phaser.Math.FloatBetween(-1, 1);
      this.tweens.add({ targets: goutte, x: 480 + cote * 16, y: 390, duration: 380, ease: 'Quad.easeIn', onComplete: () => {
        this.tweens.add({ targets: goutte, x: 480 + cote * 40, y: 414, alpha: 0.3, duration: 340, ease: 'Quad.easeIn', onComplete: () => goutte.destroy() });
      } });
    } });
    // Des pigeons qui picorent, et s'envolent de temps en temps
    for (let k = 0; k < 4; k++) {
      const x0 = 400 + k * 46, y0 = 452 + (k % 2) * 8;
      const pigeon = this.add.image(x0, y0, 'pigeonHD').setScale(1.8).setFlipX(k % 2 === 1);
      c.add(pigeon);
      this.tweens.add({ targets: pigeon, angle: 25, duration: 160, yoyo: true, repeat: -1, repeatDelay: 900 + k * 330 });
      this.time.addEvent({ delay: 7000 + k * 2300, loop: true, callback: () => {
        this.tweens.add({ targets: pigeon, x: x0 + Phaser.Math.Between(-80, 80), y: y0 - 70, duration: 700, yoyo: true, ease: 'Sine.easeOut' });
      } });
    }
    const noms = { mendiant: 'Le mendiant', bazar: 'Le Bazar de Rosalie', encheres: 'Les enchères', jeux: 'Le coin des jeux', crieur: 'Le crieur', brocante: 'La brocante', garderobe: 'La garde-robe' };
    const ouvrir = { mendiant: () => this.ouvrirMendiant(), bazar: () => this.ouvrirBazar(), encheres: () => this.ouvrirEncheres(), jeux: () => this.ouvrirJeux(), crieur: () => this.ouvrirCrieur(),
      brocante: () => this.ouvrirBrocante(), garderobe: () => this.ouvrirGardeRobe() };
    for (const [cle, [x, type]] of Object.entries(this.positions)) {
      const ferme = type !== 'etal' && !lieuOuvert(this.G, cle);
      const nom = type === 'etal' ? MARCHANDS[cle].nom : ferme ? `${noms[cle]}\n(en travaux)` : noms[cle];
      const t = this.add.text(ox + x * echelle, oy + (250 + this.arcVue(x).dy) * echelle + 6, nom, style(13, ferme ? '#c9b48a' : '#fff4dc', { fontStyle: ferme ? 'italic' : 'bold', stroke: '#1a0e06', strokeThickness: 4, align: 'center', wordWrap: { width: 96 } }))
        .setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
      t.on('pointerdown', ferme ? () => this.message(`${noms[cle]} ouvre le jour ${OUVERTURE_LIEUX[cle]}.`) : type === 'etal' ? () => this.ouvrirEtal(cle) : ouvrir[cle]);
      if (type === 'etal') c.add(this.add.text(t.x, t.y + t.height + 2, MARCHANDS[cle].metier, style(11, '#e8d4a8', { fontStyle: 'italic', stroke: '#1a0e06', strokeThickness: 3 })).setOrigin(0.5, 0));
      c.add(t);
    }
    // Quelques passants flânent sur la grand-place
    const peuples = ['humain', 'nain', 'elfe', 'hobbit', 'humain', 'nain'];
    for (let i = 0; i < 4; i++) {
      const versDroite = i % 2 === 0, y = 434 + i * 13;
      const p = imageCorps(this, 0, y, { nom: 'Passant ' + i, race: peuples[(this.G.jour + i) % peuples.length], feminin: i % 2 === 1, niveau: 'novice' }, 2.8).setFlipX(!versDroite);
      c.add(p);
      pasDeMarche(this, p, 0, { poussiere: false });
      const marcher = (depart) => {
        p.x = depart;
        this.tweens.add({ targets: p, x: versDroite ? 1010 : -50, duration: Math.abs((versDroite ? 1010 : -50) - depart) * (26 + i * 5), onComplete: () => marcher(versDroite ? -50 : 1010) });
      };
      marcher(120 + i * 230);
    }
    const invite = this.add.text(480, 356, 'Clique sur un lieu pour t\'en approcher', style(17, '#f3d98a', { fontStyle: 'bold italic', stroke: '#1a0e06', strokeThickness: 5 })).setOrigin(0.5);
    this.tweens.add({ targets: invite, alpha: 0.5, duration: 900, yoyo: true, repeat: -1 });
    c.add(invite);
  }

  // Une échoppe (Bazar) : auvent, vendeur derrière, table par-dessus, objets dessus.
  creerEchoppe(x, couleur, personne, icones, nom, metier, action, decor = null) {
    const avant = this.children.list.length;
    const etal = etalHD(this, couleur);
    this.add.image(x, 244, etal).setOrigin(0.5, 1).setScale(2);
    imageCorps(this, x, 205, personne, 5);
    this.add.image(x, 244, etal).setOrigin(0.5, 1).setScale(2).setCrop(0, 56, 88, 26);
    this.decorerEtal(x, couleur, decor);
    this.etalage(x, icones.map(id => [id, 2]));
    this.etiquettesRue.push(this.add.text(x, 254, nom, style(13, '#fff4dc', { fontStyle: 'bold', stroke: '#2a1a10', strokeThickness: 4 })).setOrigin(0.5),
      this.add.text(x, 272, metier, style(11, '#fff4dc', { stroke: '#2a1a10', strokeThickness: 3 })).setOrigin(0.5));
    this.add.rectangle(x, 160, 170, 140, 0xffffff, 0).setInteractive({ useHandCursor: true }).on('pointerdown', action);
    this.grouper(avant, x);
  }

  // La marchandise posée sur la table : une cagette par article, avec quelques exemplaires
  // empilés dedans (plus il y en a en stock, plus la pile est haute), un peu de travers.
  etalage(x, articles) {
    const liste = articles.filter(([, n]) => n > 0).slice(0, 4);
    const pas = liste.length > 3 ? 34 : 42;
    liste.forEach(([id, n], i) => {
      const cx = x + (i - (liste.length - 1) / 2) * pas;
      for (let k = 0; k < Math.min(3, Math.ceil(n / 2)); k++) {
        this.add.image(cx - 6 + k * 6, 186 - (k % 2) * 4, iconeObjet(this, id)).setOrigin(0.5, 1).setScale(1.7).setAngle((k - 1) * 8);
      }
      this.add.image(cx, 194, 'cagetteHD').setOrigin(0.5, 1).setScale(1.6);
    });
  }

  // Un étal : auvent rayé aux couleurs du marchand, comptoir, marchand derrière.
  creerEtal(cle, m, x) {
    const avant = this.children.list.length;
    // L'étal (poteaux et auvent), le marchand derrière, puis la table par-dessus lui
    const etal = etalHD(this, m.couleur);
    this.add.image(x, 244, etal).setOrigin(0.5, 1).setScale(2);
    imageCorps(this, x, 205, { nom: m.nom, race: m.race, feminin: /Mère|Hilda|Rosalie/.test(m.nom), niveau: 'aguerri' }, 5);
    this.add.image(x, 244, etal).setOrigin(0.5, 1).setScale(2).setCrop(0, 56, 88, 26);
    this.decorerEtal(x, m.couleur, cle);
    this.etalage(x, Object.entries(this.G.etals[cle] || {}).map(([id, o]) => [id, o.qte]));
    this.etiquettesRue.push(this.add.text(x, 254, m.nom, style(13, couleurNom(this.G, m.nom, true), { fontStyle: 'bold', stroke: '#2a1a10', strokeThickness: 4 })).setOrigin(0.5),
      this.add.text(x, 272, m.metier, style(11, '#fff4dc', { stroke: '#2a1a10', strokeThickness: 3 })).setOrigin(0.5));
    const zone = this.add.rectangle(x, 160, 170, 140, 0xffffff, 0).setInteractive({ useHandCursor: true });
    // Un premier clic s'approche de l'étal ; un second, sur l'étal qu'on regarde déjà, le montre de tout près
    zone.on('pointerdown', () => (!this.modeVue && this.lieuMontre === cle ? this.vitrine(cle) : this.ouvrirEtal(cle)));
    // Tout ce qu'on vient de créer appartient à la rue (qui glisse).
    this.grouper(avant, x);
  }

  // Un lieu encore en travaux : des poteaux, des planches en croix, un écriteau qui annonce
  // l'ouverture, quelques planches et un tonneau par terre. On ne peut qu'y lire l'écriteau.
  creerChantier(x, cle) {
    const avant = this.children.list.length;
    const jour = OUVERTURE_LIEUX[cle], nom = NOMS_LIEUX_MARCHE[cle];
    const g = this.add.graphics();
    g.fillStyle(0x4a3018).fillRect(x - 74, 100, 8, 150).fillRect(x + 66, 100, 8, 150);
    g.fillStyle(0x6a4a28).fillRect(x - 72, 100, 4, 150).fillRect(x + 68, 100, 4, 150);
    g.lineStyle(7, 0x3a2410).lineBetween(x - 70, 110, x + 70, 240).lineBetween(x + 70, 110, x - 70, 240);
    g.lineStyle(4, 0x8a6a3a).lineBetween(x - 70, 110, x + 70, 240).lineBetween(x + 70, 110, x - 70, 240);
    g.fillStyle(0x5a3a1a).fillRect(x - 80, 96, 160, 8);
    g.fillStyle(0x3a2410, 0.5).fillRect(x - 60, 246, 70, 6).fillRect(x - 20, 240, 80, 6);
    g.fillStyle(0x7a5a32).fillRect(x - 58, 244, 70, 6).fillRect(x - 18, 238, 80, 6);
    this.add.image(x + 62, 252, 'tonneauxHD').setOrigin(0.5, 1).setScale(1.1);
    // L'écriteau cloué en travers
    this.add.image(x, 176, panneauHD(this, 150, 54, 'ardoise')).setScale(1.2).setAngle(-4);
    this.add.text(x, 166, 'EN TRAVAUX', style(13, '#f3d98a', { fontStyle: 'bold' })).setOrigin(0.5).setAngle(-4);
    this.add.text(x, 184, `${nom}\nouvre le jour ${jour}`, style(10, '#e8d4a8', { align: 'center' })).setOrigin(0.5).setAngle(-4);
    this.etiquettesRue.push(this.add.text(x, 262, 'En travaux', style(13, '#c9b48a', { fontStyle: 'bold italic', stroke: '#2a1a10', strokeThickness: 4 })).setOrigin(0.5));
    const zone = this.add.rectangle(x, 170, 160, 160, 0xffffff, 0).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => { Son.jouer('marteau'); this.message(`${nom} est en travaux : ouverture le jour ${jour}. ${jour - this.G.jour === 1 ? "C'est pour demain !" : `Encore ${jour - this.G.jour} jours de patience.`}`); });
    this.grouper(avant, x);
  }

  // Devant l'étal : un tapis aux couleurs du marchand, et ce qui dit son métier
  decorerEtal(x, couleur, qui) {
    decorsEtalsHD(this); creerDecorPlaceHD(this);
    this.add.image(x, 252, tapisEtalHD(this, couleur)).setOrigin(0.5, 1).setScale(2);
    const decos = {
      gedeon: [['sacsHD', -66, 252], ['panierPommesHD', 70, 252]],
      forge: [['enclumeHD', 70, 252], ['tonneauxHD', -68, 252]],
      apothicaire: [['chaudronHD', 70, 252], ['herbesHD', -40, 116, 0]],
      tailleuse: [['mannequinHD', 72, 252], ['rouleauxHD', -68, 252]],
      rosalie: [['paquetsHD', 70, 252]],
      firmin: [['bricabracHD', -68, 252], ['cagetteHD', 70, 252]],
      marcelline: [['porteChapeauxHD', 72, 252]],
    }[qui] || [];
    for (const [cle, dx, y, origineY = 1] of decos) this.add.image(x + dx, y, cle).setOrigin(0.5, origineY).setScale(2);
  }
  creerLieu(x, texture, nom, action, { tint = 0xffffff, angle = 0, echelle = 5 }) {
    const avant = this.children.list.length;
    const perso = imageCorps(this, x, 245, texture.replace('perso_', ''), echelle).setTint(tint).setAngle(angle);
    this.etiquettesRue.push(this.add.text(x, 262, nom, style(13, '#fff4dc', { fontStyle: 'bold', stroke: '#2a1a10', strokeThickness: 4 })).setOrigin(0.5));
    const zone = this.add.rectangle(x, 200, 110, 120, 0xffffff, 0).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', action);
    this.grouper(avant, x);
    return perso;
  }

  // Vide le panneau du bas et le prépare pour un nouveau lieu.
  panneau(titre, sousTitre = '') {
    // On quitte le bonneteau pendant le mélange : Fil-de-Fer rend la mise (la partie n'a pas eu lieu).
    // Une fois les gobelets posés, partir sans choisir, c'est perdre sa mise (audit v0.53).
    if (this.etatBonneteau === 'melange') {
      encaisser(this.G, this.mise, 'jeux');
      this.G.jeux.bonneteau = Math.max(0, this.G.jeux.bonneteau - 1);
    }
    this.etatBonneteau = 'attente';
    if (this.contenu) this.contenu.destroy();
    this.tweens.killTweensOf(this.cibles || []);
    this.cibles = [];
    const c = this.contenu = this.add.container(0, 0);
    c.add(this.add.text(30, 314, titre, style(17, '#3b2410', { fontStyle: 'bold' })));
    c.add(this.add.text(930, 316, sousTitre, style(12, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(1, 0));
    this.majInfos();
    return c;
  }

  bouton(c, x, y, l, texte, action, couleur = 0x8a5a2b) {
    const fond = this.add.rectangle(x, y, l, 26, couleur).setStrokeStyle(2, 0x3b2410).setInteractive({ useHandCursor: true });
    const label = this.add.text(x, y, texte, style(12, '#fff4dc', { fontStyle: 'bold' })).setOrigin(0.5);
    fond.on('pointerdown', () => { Son.jouer('clic'); action(); });
    c.add([fond, label]);
    return { fond, label };
  }

  majInfos() {
    const G = this.G;
    Sauvegarde.planifier(G, 'Marche');
    const p = prevision(G, G.jour);
    this.bourse.maj(G.argent);
    this.texteInfos.setText(`Réserve : ${stockTotal(G)}/${G.capacite} · Fer ${G.materiaux.fer} · Cuir ${G.materiaux.cuir} · Fil d'or ${G.materiaux.filOr || 0}\n` +
      `Aujourd'hui : entre ${p.min} et ${p.max} clients attendus${p.annonces ? `, + ${p.annonces} annoncé${p.annonces > 1 ? 's' : ''} par lettre` : ''} (un stock varié en attire plus)`);
  }

  message(texte, couleur = '#3b2410') {
    if (couleur === '#a03030') Son.jouer('refus');
    if (this.texteMessage) this.texteMessage.destroy();
    if (this.contenu && !this.modeVue) {
      this.texteMessage = this.add.text(480, 460, texte, style(13, couleur, { fontStyle: 'bold' })).setOrigin(0.5);
      this.contenu.add(this.texteMessage);
    } else {
      // Dans la vue d'ensemble (ou de tout près) : une bulle sur la place, qui s'efface d'elle-même
      this.texteMessage = this.add.text(480, 492, texte, style(14, couleur === '#a03030' ? '#ffb0a0' : '#fff4dc', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 4, align: 'center', wordWrap: { width: 760 } })).setOrigin(0.5).setDepth(45);
      this.tweens.add({ targets: this.texteMessage, alpha: 0, delay: 3500, duration: 500 });
    }
  }

  // --- Les commandes prévues (lettres acceptées) ---

  majBoutonCommandes() {
    const n = this.G.annonces.filter(a => a.acceptee && a.jour >= this.G.jour).length;
    this.boutonCommandes.setText(`Commandes prévues (${n}) ${this.commandesOuvertes ? '▲' : '▼'}`);
  }

  basculerCommandes() {
    this.commandesOuvertes = !this.commandesOuvertes;
    this.majBoutonCommandes();
    if (this.panneauCommandes) this.panneauCommandes.destroy();
    this.panneauCommandes = null;
    if (this.commandesOuvertes) this.creerPanneauCommandes();
  }

  creerPanneauCommandes() {
    const G = this.G;
    const c = this.panneauCommandes = this.add.container(0, 0).setDepth(20);
    c.add(this.add.rectangle(480, 178, 940, 240, 0xead9b0, 0.97).setStrokeStyle(3, 0x8a6a3a).setInteractive());

    // À gauche : les commandes, jour par jour
    const lettres = G.annonces.filter(a => a.acceptee && a.jour >= G.jour).sort((a, b) => a.jour - b.jour);
    const enAttente = G.annonces.filter(a => !a.acceptee).length;
    const lignes = [];
    let jour = null;
    for (const a of lettres) {
      if (a.jour !== jour) {
        jour = a.jour;
        lignes.push({ texte: jour === G.jour ? `Aujourd'hui (jour ${jour})` : jour === G.jour + 1 ? `Demain (jour ${jour})` : `Jour ${jour}`, titre: true });
      }
      lignes.push({ texte: `• ${a.voyageur.nom} : ${commandeEnTexte(a.voyageur)}` });
    }
    if (!lignes.length) lignes.push({ texte: 'Aucune commande acceptée pour les jours à venir.' });
    if (enAttente) lignes.push({ texte: `(+ ${enAttente} lettre${enAttente > 1 ? 's' : ''} sans réponse : à accepter ou refuser le soir)`, discret: true });
    c.add(this.add.text(220, 66, 'Les commandes reçues par lettre', style(15, '#3b2410', { fontStyle: 'bold' })));
    lignes.slice(0, 11).forEach((l, i) => c.add(this.add.text(30, 94 + i * 17, l.texte,
      style(l.titre ? 13 : 12, l.discret ? '#8a6a4a' : '#3b2410', { fontStyle: l.titre ? 'bold' : l.discret ? 'italic' : 'normal' }))));
    if (lignes.length > 11) c.add(this.add.text(30, 94 + 11 * 17, `+ ${lignes.length - 11} lignes...`, style(11, '#8a6a4a')));

    // À droite : le total à prévoir, comparé à ta réserve
    const x0 = 560;
    c.add(this.add.text(x0, 70, 'Total à prévoir', style(15, '#3b2410', { fontStyle: 'bold' })));
    [['auj.', 175], ['total', 228], ['tu as', 268]].forEach(([t, dx]) =>
      c.add(this.add.text(x0 + dx, 78, t, style(11, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5)));
    const aujourdhui = totalCommandes(G, G.jour, G.jour);
    const toutes = totalCommandes(G);
    const ids = Object.keys(ITEMS).filter(id => toutes[id]);
    if (!ids.length) c.add(this.add.text(x0, 100, 'Rien à prévoir pour l\'instant.', style(12, '#6b4a2a')));
    ids.forEach((id, i) => {
      const y = 104 + i * 22;
      const manque = toutes[id] - G.stock[id];
      c.add(this.add.image(x0 + 10, y, iconeObjet(this, id)).setScale(2));
      c.add(this.add.text(x0 + 28, y, ITEMS[id].nom, style(13, '#3b2410')).setOrigin(0, 0.5));
      c.add(this.add.text(x0 + 175, y, String(aujourdhui[id] || 0), style(13, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
      c.add(this.add.text(x0 + 228, y, String(toutes[id]), style(13, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
      c.add(this.add.text(x0 + 268, y, String(G.stock[id]), style(13, '#3b2410')).setOrigin(0.5));
      c.add(this.add.text(x0 + 300, y, manque > 0 ? `il en manque ${manque}` : 'OK', style(12, manque > 0 ? '#a03030' : '#2f6a2a', { fontStyle: 'bold' })).setOrigin(0, 0.5));
    });
    c.add(this.add.text(x0, 280, 'Les clients imprévus ne sont pas comptés : garde un peu de marge !', style(11, '#6b4a2a', { fontStyle: 'italic' })));
  }

  // --- Un étal ---

  // L'étal de tout près : la marchandise du jour bien disposée sur la nappe, le marchand qui la
  // vante, les prix sur des étiquettes. On clique sur un article pour l'acheter.
  vitrine(cle) {
    const G = this.G, m = MARCHANDS[cle];
    if (this.vitrineOuverte) this.vitrineOuverte.destroy();
    const c = this.vitrineOuverte = this.add.container(0, 0).setDepth(40);
    const panneau = this.contenu;
    if (panneau) panneau.setVisible(false);
    const fermer = () => { Son.jouer('glisse'); c.destroy(); this.vitrineOuverte = null; if (panneau && panneau.active) panneau.setVisible(true); };
    c.add(this.add.rectangle(480, 270, 960, 540, 0x120a04, 0.86).setInteractive().on('pointerdown', fermer));
    // L'auvent au-dessus, la grande table drapée aux couleurs du marchand, la planche du devant
    const etal = etalHD(this, m.couleur);
    c.add(this.add.image(560, 118, etal).setOrigin(0.5, 0).setScale(8.7, 7).setCrop(0, 0, 88, 22));
    c.add(this.add.rectangle(560, 356, 760, 210, m.couleur).setStrokeStyle(3, 0x2a1a10));
    for (let y = 262; y < 450; y += 24) c.add(this.add.rectangle(560, y, 760, 2, 0xffffff, 0.08));
    c.add(this.add.image(560, 470, tapisEtalHD(this, m.couleur)).setOrigin(0.5, 1).setScale(7.6, 2.2));
    c.add(this.add.rectangle(560, 452, 760, 14, 0x5a3a1a).setStrokeStyle(2, 0x2a1a10));
    // Le matériel du métier, autour de la table : les outils du forgeron, les bocaux et les
    // champignons de l'apothicaire, les pains et le fromage de l'épicier, les fourrures de la tailleuse
    propsVitrineHD(this); decorsEtalsHD(this); creerDecorPlaceHD(this);
    // Quatre places : pendu sous l'auvent à gauche / à droite, posé par terre à gauche / à droite
    const places = { penduG: [236, 128, 0.5, 0], penduD: [884, 128, 0.5, 0], solG: [206, 538, 0.5, 1], solD: [922, 538, 0.5, 1] };
    const props = {
      gedeon: { penduG: ['painsHD', 2.2], solG: ['sacsHD', 2.2], solD: ['panierPommesHD', 2.6] },
      forge: { penduG: ['outilsForgeHD', 2.2], solG: ['tonneauxHD', 1.7], solD: ['enclumeHD', 2.4] },
      apothicaire: { penduG: ['bocauxHD', 2.2], penduD: ['herbesHD', 2.4], solG: ['bocauxHD', 1.8], solD: ['chaudronHD', 2.4] },
      tailleuse: { penduG: ['fourruresHD', 2.2], solG: ['rouleauxHD', 2.2], solD: ['mannequinHD', 2.4] },
    }[cle] || {};
    for (const [place, [tex, e]] of Object.entries(props)) { const [x, y, ox, oy] = places[place]; if (this.textures.exists(tex)) c.add(this.add.image(x, y, tex).setOrigin(ox, oy).setScale(e)); }
    // Le marchand, en buste, sur le côté, qui te parle
    const personne = { nom: m.nom, race: m.race, feminin: /Mère|Hilda|Rosalie/.test(m.nom) };
    c.add(this.add.image(100, 470, textureBusteHD(this, personne, 'content')).setOrigin(0.5, 1).setScale(2.1));
    const offre = G.etals[cle], ids = m.objets.filter(id => offre[id] && offre[id].qte > 0);
    const phrases = ids.length ? [`Approche, approche ! Regarde-moi ${ids.length > 1 ? 'ces merveilles' : 'cette merveille'}...`, 'Tout est frais de ce matin. Tu ne trouveras pas mieux sur la place !', `Un œil de connaisseur, je vois. Fais ton choix !`] : ['Tout est parti ! Reviens demain, de bonne heure.'];
    Son.jouer('voix', { personne, ton: 'bonjour' });
    c.add(this.add.text(560, 88, `« ${Phaser.Utils.Array.GetRandom(phrases)} »`, style(15, '#fff4dc', { fontStyle: 'italic', stroke: '#1a0e06', strokeThickness: 4, align: 'center', wordWrap: { width: 700 } })).setOrigin(0.5, 0));
    c.add(this.add.text(560, 50, `${m.nom} · ${m.metier}`, style(22, '#f3d98a', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 5 })).setOrigin(0.5));
    // La marchandise, bien alignée sur la nappe : l'objet en grand, sa pile, son étiquette
    const pas = Math.min(160, 700 / Math.max(1, ids.length));
    ids.forEach((id, i) => {
      const x = 560 + (i - (ids.length - 1) / 2) * pas, o = offre[id], prix = prixMarchand(G, cle, id);
      const groupe = [];
      for (let k = 0; k < Math.min(3, Math.ceil(o.qte / 2)); k++) groupe.push(this.add.image(x - 10 + k * 10, 420 - k * 6, iconeObjet(this, id)).setOrigin(0.5, 1).setScale(4.6).setAngle((k - 1) * 6));
      const etiquette = this.add.image(x, 436, panneauHD(this, 64, 30)).setScale(1.7).setAngle(3);
      const texte = this.add.text(x, 436, `${prix} p.`, style(15, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5).setAngle(3);
      const nom = this.add.text(x, 318, `${nomObjet(id)}\n× ${o.qte}`, style(13, '#fff4dc', { align: 'center', stroke: '#1a0e06', strokeThickness: 3 })).setOrigin(0.5, 1);
      const zone = this.add.rectangle(x, 400, pas - 8, 130, 0xffffff, 0).setInteractive({ useHandCursor: true });
      zone.on('pointerover', () => groupe.forEach(g => g.setScale(5))); zone.on('pointerout', () => groupe.forEach(g => g.setScale(4.6)));
      zone.on('pointerdown', () => {
        const r = acheterAuMarche(G, cle, id);
        if (r.erreur) return this.message(r.erreur, '#a03030');
        Son.jouer('achat');
        this.message(r.message || `Acheté : ${nomObjet(id)}.`);
        this.majInfos();
        if (this.commandesOuvertes) { this.panneauCommandes.destroy(); this.creerPanneauCommandes(); }
        this.vitrine(cle);
      });
      c.add([...groupe, etiquette, texte, nom, zone]);
    });
    if (!ids.length) c.add(this.add.text(560, 390, 'Les cagettes sont vides...', style(16, '#c9b48a', { fontStyle: 'italic', stroke: '#1a0e06', strokeThickness: 3 })).setOrigin(0.5));
    const b = creerBouton(this, 836, 46, 200, '◀ Reculer', fermer);
    c.add([b.fond, b.label]);
    c.add(this.add.text(480, 505, 'Clique sur un article pour l\'acheter', style(12, '#e8d4a8', { fontStyle: 'italic', stroke: '#1a0e06', strokeThickness: 3 })).setOrigin(0.5));
  }

  ouvrirEtal(cle) {
    const G = this.G;
    this.montrer(cle);
    const m = MARCHANDS[cle];
    const rel = niveauRelation(G, m.nom);
    const remise = remiseMarchand(G, cle);
    const c = this.panneau(`${m.nom} · ${m.metier}`, `Relation : ${rel.nom}${remise ? ` · remise ${Math.round(remise * 100)} %` : ''} · les prix changent chaque jour`);
    const offre = G.etals[cle];
    const ids = m.objets.filter(id => offre[id]);
    m.objets.filter(id => !offre[id]).forEach(id => ids.push(id));
    ids.forEach((id, i) => {
      const x = 40 + (i % 2) * 460;
      const y = 352 + Math.floor(i / 2) * 34;
      const o = offre[id];
      c.add(this.add.image(x + 12, y, iconeObjet(this, id)).setScale(2.4));
      c.add(this.add.text(x + 34, y, nomObjet(id), style(14, '#3b2410')).setOrigin(0, 0.5));
      const enStock = id in MATERIAUX ? G.materiaux[id] : G.stock[id];
      c.add(this.add.text(x + 150, y, `tu as ${enStock}`, style(12, '#6b4a2a')).setOrigin(0, 0.5));
      if (!o) {
        c.add(this.add.text(x + 260, y, "Pas aujourd'hui", style(12, '#8a6a4a', { fontStyle: 'italic' })).setOrigin(0, 0.5));
        return;
      }
      c.add(this.add.text(x + 230, y, `${prixMarchand(G, cle, id)} p.`, style(14, '#3b2410', { fontStyle: 'bold' })).setOrigin(0, 0.5));
      const libelle = o.qte > 0 ? `Acheter (${o.qte})` : 'Épuisé';
      const b = this.bouton(c, x + 345, y, 100, libelle, () => {
        const r = acheterAuMarche(G, cle, id);
        if (r.erreur) return this.message(r.erreur, '#a03030');
        Son.jouer('achat');
        this.ouvrirEtal(cle);
        if (this.commandesOuvertes) { this.panneauCommandes.destroy(); this.creerPanneauCommandes(); }
        this.message(r.message || `Acheté : ${nomObjet(id)}.`);
      });
      if (o.qte <= 0 || !peutPayer(G, prixMarchand(G, cle, id))) { b.fond.setAlpha(0.5); b.label.setAlpha(0.5); }
    });
  }

  // --- Les enchères : on choisit jusqu'à 3 objets, qui forment un lot ---

  ouvrirEncheres() {
    const G = this.G;
    if (!lieuOuvert(G, 'encheres')) return this.message(`${NOMS_LIEUX_MARCHE.encheres} ouvre le jour ${OUVERTURE_LIEUX.encheres}.`);
    this.montrer('encheres');
    const c = this.panneau('Les enchères', 'Lord Pommeroy, Dame Ysaline, Gros Bob et Thrain Fendroc se disputent tes objets');
    if (G.encheresJour === G.jour) {
      c.add(this.add.text(30, 360, "La vente du jour est terminée. Reviens demain avec d'autres objets !", style(14, '#3b2410')));
      return;
    }
    const dispo = G.tresors.filter(t => !t.reparation);
    if (!dispo.length) {
      c.add(this.add.text(30, 352, "Tu n'as aucun objet à vendre.\nRachète des objets aux aventuriers à la fin de leur récit, et répare-les à l'atelier (le soir).",
        style(14, '#3b2410', { lineSpacing: 4 })));
      return;
    }
    this.lot = this.lot ? this.lot.filter(t => dispo.includes(t)) : [];
    c.add(this.add.text(30, 336, `Clique sur 1 à ${OBJETS_PAR_LOT} objets pour former un lot. Un lot de la même catégorie attire les collectionneurs.`, style(12, '#6b4a2a', { fontStyle: 'italic' })));
    dispo.slice(0, 8).forEach((t, i) => {
      const x = 30 + (i % 2) * 260;
      const y = 362 + Math.floor(i / 2) * 26;
      const choisi = this.lot.includes(t);
      const fond = this.add.rectangle(x + 125, y, 250, 24, choisi ? 0xc9a046 : 0xd8c498).setStrokeStyle(1, 0x8a6a3a).setInteractive({ useHandCursor: true });
      fond.on('pointerdown', () => {
        if (choisi) this.lot = this.lot.filter(x => x !== t);
        else if (this.lot.length < OBJETS_PAR_LOT) this.lot.push(t);
        this.ouvrirEncheres();
      });
      c.add([fond, this.add.image(x + 12, y, iconeObjet(this, 'tr_' + t.categorie)).setScale(1.4),
        this.add.rectangle(x + 246, y, 8, 20, ETATS[t.etat].couleur),
        this.add.text(x + 26, y, `${t.nom} · ${estRestaure(t) ? 'Restauré ★' : ETATS[t.etat].nom} · ~${valeurTresor(t)} p.`, style(11, ETATS[t.etat].texte, { fontStyle: 'bold' })).setOrigin(0, 0.5)]);
    });
    const estimation = this.lot.reduce((s, t) => s + valeurTresor(t), 0);
    c.add(this.add.text(560, 340, this.lot.length ? `Lot de ${this.lot.length} objet${this.lot.length > 1 ? 's' : ''} · estimé ~${estimation} p.` : 'Aucun objet choisi',
      style(14, '#3b2410', { fontStyle: 'bold' })));
    if (this.lot.length) this.bouton(c, 830, 342, 170, 'Mettre aux enchères', () => this.vendre());
  }

  vendre() {
    const G = this.G;
    const lot = this.lot;
    this.lot = [];
    const r = vendreAuxEncheres(G, lot);
    Son.jouer('maillet');
    const c = this.panneau('Les enchères', 'La vente commence !');
    c.add(this.add.text(30, 345, `Le lot : ${lot.map(t => t.nom).join(', ')} (estimé ~${r.estimation} p.)`, style(13, '#3b2410', { fontStyle: 'bold' })));
    // Les enchérisseurs, avec leur bulle
    const bulles = {};
    ENCHERISSEURS.forEach((e, i) => {
      const x = 120 + i * 200;
      c.add(imageCorps(this, x, 440, { nom: e.nom, race: e.race, niveau: 'veteran' }, 3));
      c.add(this.add.text(x, 444, e.nom, style(11, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5, 0));
      bulles[e.nom] = this.add.text(x + 20, 385, '', style(14, '#fff4dc', { fontStyle: 'bold', backgroundColor: '#3b2410', padding: { x: 6, y: 3 } })).setOrigin(0, 0.5);
      c.add(bulles[e.nom]);
    });
    const actuel = this.add.text(930, 345, '', style(14, '#a03030', { fontStyle: 'bold' })).setOrigin(1, 0);
    c.add(actuel);
    r.deroule.forEach((b, i) => this.time.delayedCall(400 + i * 380, () => {
      Object.values(bulles).forEach(t => t.setAlpha(0.35));
      bulles[b.nom].setText(`${b.montant} p. !`).setAlpha(1);
      this.tweens.add({ targets: bulles[b.nom], scale: { from: 1.3, to: 1 }, duration: 200 });
      actuel.setText(`Enchère : ${b.montant} p.`);
    }));
    this.time.delayedCall(700 + r.deroule.length * 380, () => {
      if (!r.gagnant) return this.message("Personne n'a enchéri... Tes objets te reviennent.", '#a03030');
      this.message(`Adjugé ! ${r.gagnant.nom} remporte le lot pour ${r.prix} pièces.`, '#2f6a2a');
      this.majInfos();
    });
  }

  // --- Le mendiant ---

  ouvrirMendiant() {
    const G = this.G;
    this.montrer('mendiant');
    const c = this.panneau('Le mendiant et son chien', `Tu lui as déjà donné ${G.mendiant} pièce${G.mendiant > 1 ? 's' : ''} · ${G.chienNourri || 0} ration${G.chienNourri > 1 ? 's' : ''} au chien`);
    c.add(this.add.text(30, 340, "Un vieil homme est assis contre un tonneau, une sébile ébréchée entre les mains. Son gros chien,\nBrisquet, dort contre lui, et lève un œil sur toi. Personne ne s'arrête jamais pour eux.",
      style(14, '#3b2410', { lineSpacing: 4 })));
    [1, 5, 10].forEach((n, i) => this.bouton(c, 120 + i * 150, 400, 130, `Donner ${n} pièce${n > 1 ? 's' : ''}`, () => {
      const merci = donnerAuMendiant(G, n);
      if (!merci) return this.message("Tu n'as pas assez d'argent.", '#a03030');
      Son.jouer('pieces', { montant: n });
      this.ouvrirMendiant();
      this.message(merci);
    }));
    // Une ration par jour pour le chien (ça compte, pour plus tard...)
    const nourri = G.chienJour === G.jour;
    const b = this.bouton(c, 230, 436, 260, nourri ? 'Brisquet a eu sa ration aujourd\'hui' : `Donner une ration au chien (${G.stock.ration || 0} en réserve)`, () => {
      if (nourri) return;
      const quoi = nourrirChien(G);
      if (!quoi) return this.message("Tu n'as pas de ration dans ta réserve.", '#a03030');
      Son.jouer('chien');
      this.ouvrirMendiant();
      this.message(quoi);
    }, nourri ? 0x6a5a4a : 0x4f7a3a);
    if (nourri) b.fond.disableInteractive();
  }

  // --- Le Bazar de Rosalie : les cadeaux ---

  ouvrirBazar() {
    const G = this.G;
    if (!lieuOuvert(G, 'bazar')) return this.message(`${NOMS_LIEUX_MARCHE.bazar} ouvre le jour ${OUVERTURE_LIEUX.bazar}.`);
    this.montrer('bazar');
    const c = this.panneau('Le Bazar de Rosalie', 'Un cadeau par client et par jour · chacun ses goûts, à toi de les découvrir');
    c.add(this.add.text(30, 340, "« Un petit cadeau, et la chance leur sourit ! Mais attention : un nain n'aime pas ce qu'aime un elfe. »",
      style(12, '#6b4a2a', { fontStyle: 'italic' })));
    Object.entries(CADEAUX).forEach(([id, cad], i) => {
      const x = 40 + (i % 2) * 460;
      const y = 372 + Math.floor(i / 2) * 26;
      c.add(this.add.image(x, y, iconeObjet(this, id)).setScale(2));
      c.add(this.add.text(x + 20, y, `${cad.nom} · ${cad.prix} p.`, style(13, '#3b2410', { fontStyle: 'bold' })).setOrigin(0, 0.5));
      c.add(this.add.text(x + 280, y, `tu en as ${G.cadeaux[id] || 0}`, style(11, '#6b4a2a')).setOrigin(0, 0.5));
      this.bouton(c, x + 390, y, 70, 'Acheter', () => {
        const erreur = acheterCadeau(G, id);
        if (!erreur) Son.jouer('achat');
        this.ouvrirBazar();
        this.message(erreur || `${cad.nom} : dans ton tiroir à cadeaux, au comptoir.`, erreur ? '#a03030' : '#2f6a2a');
      });
    });
  }

  // --- La brocante : des décorations pour le shop ---

  ouvrirBrocante() {
    const G = this.G;
    if (!lieuOuvert(G, 'brocante')) return this.message(`${NOMS_LIEUX_MARCHE.brocante} ouvre le jour ${OUVERTURE_LIEUX.brocante}.`);
    this.montrer('brocante');
    const c = this.panneau(BROCANTEUR.nom, "Chaque décoration se voit dans ton arrière-boutique, et attire un peuple");
    c.add(this.add.text(30, 340, "« Des merveilles dénichées aux quatre coins des Trois Terres. Ça fera un shop qu'on remarque ! »",
      style(12, '#6b4a2a', { fontStyle: 'italic' })));
    Object.entries(DECOS).forEach(([id, d], i) => {
      // Une ligne par décoration : l'icône, le nom et le prix, l'effet en bref (l'effet complet au survol)
      const x = 40 + (i % 2) * 460;
      const y = 364 + Math.floor(i / 2) * 22;
      c.add(this.add.image(x, y, iconeObjet(this, id)).setScale(1.5));
      const nom = this.add.text(x + 16, y, `${d.nom} · ${d.prix} p.`, style(12, d.camp === 'bien' ? '#8a6a00' : d.camp === 'mal' ? '#5a2a7a' : '#3b2410', { fontStyle: 'bold' })).setOrigin(0, 0.5);
      c.add(nom);
      const effet = this.add.text(x + 22 + nom.width, y + 1, d.court || '', style(10, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0, 0.5).setInteractive();
      effet.on('pointerover', () => this.message(d.effet));
      c.add(effet);
      if (aDeco(G, id)) c.add(this.add.text(x + 405, y, 'Chez toi', style(11, '#2f6a2a', { fontStyle: 'bold italic' })).setOrigin(0.5));
      else this.bouton(c, x + 405, y, 62, 'Acheter', () => {
        const erreur = acheterDeco(G, id);
        if (!erreur) Son.jouer('achat');
        this.ouvrirBrocante();
        this.message(erreur || `${d.nom} : accrochée dans ton arrière-boutique !`, erreur ? '#a03030' : '#2f6a2a');
      });
    });
  }

  // --- La garde-robe : des vêtements et des accessoires pour toi ---

  ouvrirGardeRobe() {
    const G = this.G;
    if (!lieuOuvert(G, 'garderobe')) return this.message(`${NOMS_LIEUX_MARCHE.garderobe} ouvre le jour ${OUVERTURE_LIEUX.garderobe}.`);
    this.montrer('garderobe');
    const c = this.panneau(MARCELLINE.nom, 'Tout ce que tu achètes, tu le portes : on te verra avec, partout');
    c.add(this.add.text(30, 340, "« Un marchand bien mis inspire confiance. Laissez-moi vous arranger ça... »",
      style(12, '#6b4a2a', { fontStyle: 'italic' })));
    // Toi, dans ta tenue du moment
    textureJoueur(this, G);
    c.add(this.add.image(900, 500, textureJoueur(this, G, 'troisQuarts')).setOrigin(0.5, 1).setScale(echelleJoueur(7)).setFlipX(true));   // (tourné vers la marchande)
    Object.entries(GARDE_ROBE).forEach(([id, d], i) => {
      const x = 40 + (i % 2) * 400;
      const y = 370 + Math.floor(i / 2) * 30;
      c.add(this.add.image(x, y, iconeObjet(this, id)).setScale(2));
      c.add(this.add.text(x + 20, y - 7, `${d.nom} · ${d.prix} p.`, style(13, '#3b2410', { fontStyle: 'bold' })).setOrigin(0, 0.5));
      c.add(this.add.text(x + 20, y + 8, d.effet, style(10, '#6b4a2a', { wordWrap: { width: 280 } })).setOrigin(0, 0.5));
      if (porte(G, id)) c.add(this.add.text(x + 340, y, 'Porté', style(12, '#2f6a2a', { fontStyle: 'bold italic' })).setOrigin(0.5));
      else this.bouton(c, x + 340, y, 70, 'Acheter', () => {
        const erreur = acheterTenue(G, id);
        if (!erreur) Son.jouer('achat');
        this.ouvrirGardeRobe();
        this.message(erreur || `${d.nom} : tu le portes dès maintenant !`, erreur ? '#a03030' : '#2f6a2a');
      });
    });
  }

  // --- Le crieur : les nouvelles du jour ---

  ouvrirCrieur() {
    Son.jouer('cloche');
    const G = this.G;
    this.montrer('crieur');
    const c = this.panneau('Le crieur', 'Les nouvelles du jour, vraies ou presque');
    const lignes = G.gazette && G.gazette.jour === G.jour ? G.gazette.lignes : ['Rien de neuf aujourd\'hui. Le crieur s\'ennuie.'];
    const actifs = evenementsActifs(G).map(e => EVENEMENTS[e.id].nouvelle);
    c.add(this.add.text(30, 344, ['📯 Oyez, oyez !', ...lignes.map(l => '• ' + l),
      ...(actifs.length ? ['', 'En ce moment : ' + actifs.join(' · ')] : [])].join('\n'),
      style(13, '#3b2410', { wordWrap: { width: 890 }, lineSpacing: 4 })));
  }

  // --- Le coin des jeux : les dés et le bonneteau ---

  ouvrirJeux() {
    const G = this.G;
    if (!lieuOuvert(G, 'jeux')) return this.message(`${NOMS_LIEUX_MARCHE.jeux} ouvre le jour ${OUVERTURE_LIEUX.jeux}.`);
    this.montrer('jeux');
    const c = this.panneau('Le coin des jeux', 'Tenu par Fil-de-Fer, cousin du vieux Grippesou');
    c.add(this.add.rectangle(480, 395, 2, 120, 0x8a6a3a));
    // Les dés
    c.add(this.add.text(40, 340, `Les dés · le plus gros total gagne (${partiesRestantes(G, 'des')} parties restantes)`, style(13, '#3b2410', { fontStyle: 'bold' })));
    c.add(this.add.text(40, 362, 'Toi', style(12, '#6b4a2a')));
    c.add(this.add.text(250, 362, 'Fil-de-Fer', style(12, '#6b4a2a')));
    this.desToi = [this.creerDe(c, 70, 400), this.creerDe(c, 120, 400)];
    this.desLui = [this.creerDe(c, 280, 400), this.creerDe(c, 330, 400)];
    MISES.forEach((m, i) => this.bouton(c, 400, 365 + i * 30, 80, `Miser ${m}`, () => this.lancerDes(m)));
    // Le bonneteau
    c.add(this.add.text(500, 340, `Le bonneteau · trouve la pièce, gagne le double (${partiesRestantes(G, 'bonneteau')} restantes)`, style(13, '#3b2410', { fontStyle: 'bold' })));
    this.gobelets = [0, 1, 2].map(i => this.creerGobelet(c, 560 + i * 100, 420, i));
    this.piece = this.add.ellipse(0, 428, 18, 10, 0xe8c040).setStrokeStyle(2, 0x9a7a10).setVisible(false);
    c.add(this.piece);
    MISES.forEach((m, i) => this.bouton(c, 880, 365 + i * 30, 80, `Miser ${m}`, () => this.lancerBonneteau(m)));
    this.etatBonneteau = 'attente';
  }

  creerDe(c, x, y) {
    const de = this.add.container(x, y);
    de.add(this.add.rectangle(0, 0, 36, 36, 0xf8f4e8).setStrokeStyle(2, 0x3b2410));
    de.points = this.add.graphics();
    de.add(de.points);
    c.add(de);
    this.dessinerDe(de, 1);
    return de;
  }

  dessinerDe(de, valeur) {
    const pos = { 1: [[0, 0]], 2: [[-8, -8], [8, 8]], 3: [[-9, -9], [0, 0], [9, 9]], 4: [[-8, -8], [8, -8], [-8, 8], [8, 8]],
      5: [[-9, -9], [9, -9], [0, 0], [-9, 9], [9, 9]], 6: [[-8, -10], [8, -10], [-8, 0], [8, 0], [-8, 10], [8, 10]] }[valeur];
    de.points.clear().fillStyle(0x2a1a10);
    for (const [px, py] of pos) de.points.fillCircle(px, py, 3);
  }

  lancerDes(mise) {
    Son.jouer('des');
    const G = this.G;
    if (this.desEnCours) return;
    const r = jouerAuxDes(G, mise);
    if (!r) return this.message(partiesRestantes(G, 'des') <= 0 ? "Plus de parties aujourd'hui. Reviens demain !" : "Pas assez d'argent pour cette mise.", '#a03030');
    this.desEnCours = true;
    const tous = [...this.desToi, ...this.desLui];
    let n = 0;
    this.time.addEvent({
      delay: 70, repeat: 9, callback: () => {
        n++;
        tous.forEach(d => { this.dessinerDe(d, Phaser.Math.Between(1, 6)); d.setAngle(Phaser.Math.Between(-20, 20)); });
        if (n < 10) return;
        tous.forEach(d => d.setAngle(0));
        this.desToi.forEach((d, i) => this.dessinerDe(d, r.toi[i]));
        this.desLui.forEach((d, i) => this.dessinerDe(d, r.lui[i]));
        this.desEnCours = false;
        const total = `${r.toi[0] + r.toi[1]}${r.bonus ? ' +1 (trèfle)' : ''} contre ${r.lui[0] + r.lui[1]}`;
        this.majInfos();
        if (r.resultat === 'gagne') this.message(`${total} : tu gagnes ${mise} pièces !`, '#2f6a2a');
        else if (r.resultat === 'perdu') this.message(`${total} : tu perds ${mise} pièces. « Hé hé, merci ! »`, '#a03030');
        else this.message(`${total} : égalité, tu récupères ta mise.`);
      },
    });
  }

  creerGobelet(c, x, y, i) {
    const g = this.add.container(x, y);
    const forme = this.add.graphics();
    forme.fillStyle(0x7a4a1e).fillTriangle(-24, 18, 24, 18, 0, -26);
    forme.fillStyle(0x7a4a1e).fillRect(-24, 4, 48, 14);
    forme.fillStyle(0x5a3a1a).fillRect(-26, 14, 52, 6);
    g.add(forme);
    g.setSize(56, 50).setInteractive({ useHandCursor: true });
    g.on('pointerdown', () => this.choisirGobelet(g));
    c.add(g);
    this.cibles.push(g);
    return g;
  }

  async lancerBonneteau(mise) {
    const G = this.G;
    if (this.etatBonneteau !== 'attente') return;
    if (!miserAuBonneteau(G, mise)) {
      return this.message(partiesRestantes(G, 'bonneteau') <= 0 ? "Plus de parties aujourd'hui. Reviens demain !" : "Pas assez d'argent pour cette mise.", '#a03030');
    }
    this.majInfos();
    this.mise = mise;
    this.etatBonneteau = 'melange';
    // La pièce se cache sous un gobelet...
    this.gagnant = Phaser.Utils.Array.GetRandom(this.gobelets);
    this.piece.setPosition(this.gagnant.x, 428).setVisible(true);
    await this.animer({ targets: this.gagnant, y: 385, duration: 250, yoyo: true, hold: 500 });
    this.piece.setVisible(false);
    // ... puis Fil-de-Fer mélange.
    // (plus de passes et plus vite à mesure qu'on joue dans la journée : Fil-de-Fer s'échauffe)
    const vitesse = (aDecoration(G, 'trefle') ? 340 : 230) - Math.min(60, (G.jeux.bonneteau || 0) * 15);
    for (let i = 0; i < 8 + Math.min(4, G.jeux.bonneteau || 0); i++) {
      const [a, b] = Phaser.Utils.Array.Shuffle([...this.gobelets]).slice(0, 2);
      const xa = a.x, xb = b.x;
      await Promise.all([
        this.animer({ targets: a, x: xb, duration: vitesse, ease: 'Sine.easeInOut' }),
        this.animer({ targets: b, x: xa, duration: vitesse, ease: 'Sine.easeInOut' }),
      ]);
    }
    this.etatBonneteau = 'choix';
    this.message('Alors, sous quel gobelet est la pièce ?');
  }

  async choisirGobelet(g) {
    if (this.etatBonneteau !== 'choix') return;
    this.etatBonneteau = 'revelation';
    this.piece.setPosition(this.gagnant.x, 428).setVisible(true);
    await Promise.all(this.gobelets.map(x => this.animer({ targets: x, y: 385, duration: 250 })));
    if (g === this.gagnant) {
      gagnerAuBonneteau(this.G, this.mise);
      this.message(`Trouvé ! Tu gagnes ${this.mise * 2} pièces.`, '#2f6a2a');
    } else {
      this.message(`Raté ! « Hé hé, l'œil est plus lent que la main... »`, '#a03030');
    }
    this.majInfos();
    await this.attendre(900);
    await Promise.all(this.gobelets.map(x => this.animer({ targets: x, y: 420, duration: 250 })));
    this.piece.setVisible(false);
    this.etatBonneteau = 'attente';
  }

  animer(config) {
    return new Promise(resoudre => this.tweens.add({ ...config, onComplete: resoudre }));
  }

  attendre(ms) {
    return new Promise(resoudre => this.time.delayedCall(ms, resoudre));
  }

  // Repasser chez soi avant d'ouvrir : réserve, atelier, bureau, banque.
  rentrer() {
    if (enTransition(this)) return;
    Sauvegarde.maintenant(this.G, 'Maison');
    this.cameras.main.fadeOut(300);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Nuit', { matin: true }));
  }

  ouvrir() {
    if (this._transition && performance.now() - this._transition < 1500) return;
    // On sauvegarde avant que la file d'attente du jour se forme.
    Sauvegarde.maintenant(this.G, 'Marche');
    commencerJournee(this);
  }
}
