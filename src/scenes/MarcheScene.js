// Le Marché des Mastres, chaque matin avant d'ouvrir le comptoir :
// quatre étals (épicerie, forge, apothicaire, tailleuse), le Bazar de Rosalie (les cadeaux), les enchères,
// le coin des jeux, le mendiant, et le crieur qui annonce les nouvelles du jour.
// La rue est plus large que l'écran : on la parcourt avec les flèches ◀ ▶.
const LARGEUR_MARCHE = 2150;
const DEPLACEMENT_RUE = 360;
// La vue d'ensemble : la rue entière, réduite, posée sur la grand-place.
const VUE_MARCHE = { echelle: 0.44, x: 12, y: 170 };
// On clique sur un lieu pour l'ouvrir dans le panneau du bas.
class MarcheScene extends Phaser.Scene {
  constructor() { super('Marche'); }

  create() {
    const G = this.G = window.GAME;
    this.pieceEnVol = false; this.chienMange = false;   // (audit v0.59 : sinon la fontaine et Brisquet restaient bloqués)
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
    this.positions = { mendiant: [70, 'lieu'], bazar: [1030, 'lieu'], encheres: [1220, 'lieu'], jeux: [1410, 'lieu'], crieur: [1595, 'lieu'], tableau: [1705, 'lieu'], brocante: [1850, 'lieu'], garderobe: [2045, 'lieu'] };
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
    if (lieuOuvert(G, 'brocante')) this.creerEchoppe(1850, 0x8a5a2a, { nom: 'Firmin', race: 'humain', feminin: false, niveau: 'aguerri' },
      ['tropheeCerf', 'horloge', 'globe', 'carillon'], 'La brocante de Firmin', 'Décorations', () => this.ouvrirBrocante(), 'firmin');
    else this.creerChantier(1850, 'brocante');
    if (lieuOuvert(G, 'garderobe')) this.creerEchoppe(2045, 0x7a3a6a, { nom: 'Marcelline', race: 'humain', feminin: true, niveau: 'aguerri' },
      ['chapeau', 'bandana', 'montre', 'pipe'], 'La garde-robe de Marcelline', 'Vêtements et accessoires', () => this.ouvrirGardeRobe(), 'marcelline');
    else this.creerChantier(2045, 'garderobe');
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
      this.add.text(1410, 82, 'JEUX', style(13, '#ffe9a0', { fontStyle: 'bold', stroke: '#2a1040', strokeThickness: 4 })).setOrigin(0.5);
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
      creerDecorComptoir(this);   // (v0.58 : le parchemin manquait si on arrivait au marché avant le comptoir)
      this.add.image(1572, 170, 'parcheminComptoir').setDisplaySize(16, 22);
      this.add.text(1604, 230, 'NOUVELLES\nDU JOUR', style(11, '#ffe9a0', { fontStyle: 'bold', stroke: '#2a1a10', strokeThickness: 3, align: 'center', lineSpacing: -2 })).setOrigin(0.5);
      this.etiquettesRue.push(this.add.text(1600, 262, 'Le crieur', style(13, '#fff4dc', { fontStyle: 'bold', stroke: '#2a1a10', strokeThickness: 4 })).setOrigin(0.5));
      this.add.rectangle(1600, 200, 110, 120, 0xffffff, 0).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.ouvrirCrieur());
      this.grouper(avant, 1600);
      this.tweens.add({ targets: this.crieur, angle: { from: -3, to: 3 }, duration: 600, yoyo: true, repeat: -1 });
    }

    // (v0.74) Le tableau d'affichage, à côté du crieur : nouvelles, avis de recherche, événements
    {
      const avant = this.children.list.length;
      this.add.image(1705, 252, texturePanneauAffichage(this)).setOrigin(0.5, 1).setScale(2);
      this.etiquettesRue.push(this.add.text(1705, 262, 'Le tableau', style(13, '#fff4dc', { fontStyle: 'bold', stroke: '#2a1a10', strokeThickness: 4 })).setOrigin(0.5));
      this.add.rectangle(1705, 200, 84, 110, 0xffffff, 0).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.ouvrirTableau());
      // un « ! » quand il y a du neuf
      // (v0.91) une pastille rouge, comme une notification, tant que les nouvelles du jour ne sont pas lues
      const nouv = Math.max(1, ((G.gazette && G.gazette.lignes) || []).length);
      this.exclamTableau = this.add.container(1705, 120).setVisible(tableauANouveau(G));
      this.exclamTableau.add([this.add.circle(0, 0, 17, 0xc82a20).setStrokeStyle(3, 0xfff4dc), this.add.text(0, 1, String(nouv), style(18, '#ffffff', { fontStyle: 'bold' })).setOrigin(0.5)]);
      this.grouper(avant, 1705);
      this.tweens.add({ targets: this.exclamTableau, y: '-=10', duration: 420, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });   // (après le regroupement : ses coordonnées ont changé)
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
      const texte = this.add.text(cx - 24, cy - 34, '« Oyez, oyez ! ' + G.gazette.lignes[0] + ' »', style(13, '#3b2410', {
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

  // (v0.58) La fontaine vue de près : le grand bassin, l'eau qui bouge, la vasque qui déborde, le
  // jet du sommet, et les pièces des vœux d'avant qui dorment au fond. On y jette sa pièce : elle
  // vole en tournant, touche l'eau (gerbe, ronds), puis coule doucement en se balançant.
  vueFontaine() {
    const G = this.G, F = FONTAINE_PROCHE, E = 2;
    if (this.vitrineOuverte) this.vitrineOuverte.destroy();
    const c = this.vitrineOuverte = this.add.container(0, 0).setDepth(40);
    const panneau = this.contenu;
    if (panneau) panneau.setVisible(false);
    const fermer = () => { Son.jouer('glisse'); c.destroy(); this.vitrineOuverte = null; if (panneau && panneau.active) panneau.setVisible(true); };
    c.add(this.add.rectangle(480, 270, 960, 540, 0x0e1410, 0.9).setInteractive());
    // la place autour : le ciel du matin, les façades au loin, les pavés
    const fond = this.add.graphics(); dessinerComte(fond, 0, 0, 960, 300, 'aube'); c.add(fond); if (fond.paysage) c.add(fond.paysage);
    c.add(this.add.image(0, 300, pavesHD(this, 960, 240)).setOrigin(0).setScale(2));
    c.add(this.add.rectangle(480, 270, 960, 540, 0x000000, 0.25));
    const ox = 480 - F.L, oy = 500 - F.H * E;   // (le coin haut-gauche de la fontaine, à l'écran)
    const X = x => ox + x * E, Y = y => oy + y * E;
    c.add(this.add.ellipse(480, 500, F.L * 1.9, 46, 0x000000, 0.35));
    c.add(this.add.image(480, 500, fontaineProcheHD(this)).setOrigin(0.5, 1).setScale(E));
    for (const [x, flip] of [[175, false], [785, true]]) { c.add(this.add.ellipse(x, 506, 60, 12, 0x000000, 0.3)); c.add(this.add.image(x, 508, potFleursHD(this)).setOrigin(0.5, 1).setScale(2.6).setFlipX(flip)); }
    const cx = X(F.cx), ey = Y(F.eauY), rx = F.eauRx * E, ry = F.eauRy * E;
    // les pièces au fond (sous l'eau), à des places fixes pour chaque vœu
    const fondPieces = this.add.container(0, 0);
    const placer = k => { const a = hachage(k, 3, 911) * Math.PI * 2, r = Math.sqrt(hachage(k, 4, 912)) * 0.85; return [cx + Math.cos(a) * r * rx, ey + Math.sin(a) * r * ry * 0.9]; };
    const piecesAuFond = Math.min(40, G.fontainePieces || 0);
    // l'eau : une nappe translucide, une bande de lumière, et des reflets qui dansent
    const eau = this.add.ellipse(cx, ey, rx * 2, ry * 2, 0x4aa0c8, 0.55); c.add(eau);
    c.add(fondPieces);
    const piece = (x, y) => { const o = this.add.ellipse(x, y, 10, 5, 0xf0d060, 0.85).setStrokeStyle(1, 0x9a7010, 0.9); fondPieces.add(o); if (Math.random() < 0.5) this.tweens.add({ targets: o, fillAlpha: 0.5, duration: 600 + Math.random() * 900, yoyo: true, repeat: -1 }); return o; };
    for (let k = 0; k < piecesAuFond; k++) piece(...placer(k));
    const lumiere = this.add.ellipse(cx - rx * 0.25, ey - ry * 0.35, rx * 1.1, ry * 0.5, 0xd8f4ff, 0.22).setBlendMode(Phaser.BlendModes.ADD); c.add(lumiere);
    this.tweens.add({ targets: lumiere, x: cx + rx * 0.2, duration: 3200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    for (let k = 0; k < 7; k++) {
      const r = this.add.ellipse(cx + (hachage(k, 1, 913) - 0.5) * rx * 1.4, ey + (hachage(k, 2, 914) - 0.5) * ry, 26, 3, 0xffffff, 0.5); c.add(r);
      this.tweens.add({ targets: r, alpha: 0.05, scaleX: 1.6, duration: 900 + k * 170, yoyo: true, repeat: -1, delay: k * 140 });
    }
    // la vasque qui déborde en rideau de gouttes, et le jet du sommet
    const tomber = (x, y0, y1, couleur = 0xc8f0ff) => {
      const g = this.add.circle(x, y0, 1.8, couleur, 0.9); c.add(g);
      this.tweens.add({ targets: g, y: y1, x: x + (x - cx) * 0.08, duration: Phaser.Math.Between(420, 560), ease: 'Quad.easeIn', onComplete: () => {
        g.destroy();
        if (Math.random() < 0.3) { const o = this.add.ellipse(x, y1, 8, 2).setStrokeStyle(1, 0xe8fcff, 0.7); c.add(o); this.tweens.add({ targets: o, scaleX: 3, scaleY: 2, alpha: 0, duration: 500, onComplete: () => o.destroy() }); }
      } });
    };
    const pluie = this.time.addEvent({ delay: 45, loop: true, callback: () => {
      if (!c.active) { pluie.remove(); return; }
      const cote = Math.random() < 0.5 ? -1 : 1, x = cx + cote * (F.vasqueRx - 2 - Math.random() * 3) * E;
      tomber(x, Y(F.vasqueY + 2), ey + (Math.random() - 0.3) * ry * 0.6);
      for (const sens of [-1, 1]) {
        const g = this.add.circle(X(F.cx + sens * 14), Y(94), 2, 0xd8f4ff, 0.95); c.add(g);
        const portee = 70 + Math.random() * 14;
        this.tweens.add({ targets: g, x: g.x + sens * portee, duration: 520, ease: 'Linear' });
        this.tweens.add({ targets: g, y: { from: Y(94), to: ey - 4 }, duration: 520, ease: 'Quad.easeIn', onComplete: () => g.destroy() });
      }
      if (Math.random() < 0.6) {
        const j = this.add.circle(cx, Y(F.sommetY - 6), 1.6, 0xe8fcff, 0.95); c.add(j);
        const dx = (Math.random() - 0.5) * 60;
        this.tweens.add({ targets: j, x: cx + dx, duration: 700, ease: 'Linear' });
        this.tweens.add({ targets: j, y: Y(F.sommetY - 22), duration: 320, ease: 'Quad.easeOut', yoyo: true, onComplete: () => { j.destroy(); } });
      }
    } });
    // les titres et les boutons
    c.add(this.add.text(480, 32, 'La fontaine de la grand-place', style(22, '#f3d98a', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 5 })).setOrigin(0.5));
    const n = G.fontainePieces || 0;
    const sous = this.add.text(480, 60, n ? `${n} pièce${n > 1 ? 's' : ''} brille${n > 1 ? 'nt' : ''} au fond de l'eau.` : `Personne ne t'a encore vu${eJ(G)} y jeter une pièce.`, style(14, '#e8d4a8', { fontStyle: 'italic', stroke: '#1a0e06', strokeThickness: 3 })).setOrigin(0.5);
    c.add(sous);
    const deja = G.fontaineJour === G.jour;
    const jeter = creerBouton(this, 480, 516, 260, deja ? 'Vœu fait pour aujourd\'hui' : 'Jeter une pièce (1 p.)', () => {
      if (this.pieceEnVol) return;
      const erreur = jeterPieceFontaine(G);
      if (erreur) return this.message(erreur, '#a03030');
      this.majInfos();
      jeter.label.setText('Vœu fait pour aujourd\'hui'); jeter.fond.setAlpha(0.6);
      this.pieceEnVol = true;
      const [tx, ty] = placer(G.fontainePieces - 1);
      this.lancerPieceFontaine(c, tx, ty, ey, () => {
        this.pieceEnVol = false;
        piece(tx, ty);
        const k = G.fontainePieces;
        sous.setText(`${k} pièce${k > 1 ? 's' : ''} brille${k > 1 ? 'nt' : ''} au fond de l'eau.`);
        this.message(`Plouf ! Tu fermes les yeux et tu fais un vœu... ${k === 1 ? 'Ta première pièce dort au fond de la fontaine.' : `${k} pièces dorment au fond de la fontaine.`}`);
      });
    });
    if (deja) jeter.fond.setAlpha(0.6);
    const reculer = creerBouton(this, 836, 46, 200, '◀ Reculer', () => { if (!this.pieceEnVol) fermer(); });
    c.add([jeter.fond, jeter.label, reculer.fond, reculer.label]);
    // (v0.92) très rarement, Grippesou vient pêcher les vœux des autres au fond du bassin
    if ((window.__grippesouFontaine || Math.random() < GRIPPESOU_FONTAINE.chance) && n >= GRIPPESOU_FONTAINE.pieces && G.grippesouFontaine !== G.jour) {
      G.grippesouFontaine = G.jour;
      this.time.delayedCall(1200, () => { if (c.active) this.grippesouPeche(c, cx, ey, rx, placer(0)); });
    }
  }

  // Grippesou se glisse jusqu'au bassin, fouille l'eau, remonte une pièce... et se voit pris sur le fait
  async grippesouPeche(c, cx, ey, rx, [px, py]) {
    const attendre = ms => new Promise(r => this.time.delayedCall(ms, r));
    const tween = cfg => new Promise(r => this.tweens.add({ ...cfg, onComplete: r }));
    const sol = 506, bord = cx + rx * 0.82, poste = cx + rx + 34;
    const g = imageCorps(this, 1010, sol, 'gobelin', 8).setFlipX(true); c.add(g);
    const ombre = this.add.ellipse(1010, sol, 46, 10, 0x000000, 0.3); c.add(ombre); c.bringToTop(g);
    const suivre = () => ombre.setX(g.x);
    pasDeMarche(this, g, 1600, { poussiere: false });
    this.message('Psst... Une petite silhouette verte se faufile entre les passants.');
    await tween({ targets: g, x: poste, duration: 1600, ease: 'Sine.easeInOut', onUpdate: suivre });
    if (!c.active) return;
    // il se penche au-dessus de l'eau, regarde à droite, à gauche...
    await tween({ targets: g, angle: -24, x: poste - 14, y: sol - 4, duration: 350 });
    for (const flip of [false, true]) { g.setFlipX(flip); await attendre(350); }
    // ... et plonge la main : des ronds dans l'eau
    for (let k = 0; k < 3; k++) {
      const o = this.add.ellipse(bord - 16 + k * 6, ey + 10, 10, 3).setStrokeStyle(1, 0xe8fcff, 0.8); c.add(o);
      this.tweens.add({ targets: o, scaleX: 3, scaleY: 2, alpha: 0, duration: 600, onComplete: () => o.destroy() });
      await attendre(200);
    }
    if (!c.active) return;
    // une pièce remonte jusqu'à sa main
    const piece = this.add.image(bord - 12, ey + 8, 'pieceFace').setScale(1.6); c.add(piece);
    await tween({ targets: piece, x: poste - 40, y: sol - 96, duration: 500, ease: 'Back.easeOut' });
    const hehe = this.add.text(g.x, sol - 190, 'Hé hé...', style(16, '#3b2410', { fontStyle: 'bold italic', backgroundColor: '#fff4dc', padding: { x: 8, y: 4 } })).setOrigin(0.5); c.add(hehe);
    await attendre(900);
    if (!c.active) return;
    // il te voit ! La pièce retombe, et il détale
    hehe.setText('!').setFontSize(28).setColor('#c82a20');
    g.setAngle(0).setY(sol); g.setFlipX(false);
    await attendre(500);
    this.tweens.add({ targets: piece, x: bord - 20, y: ey + 6, duration: 420, ease: 'Quad.easeIn', onComplete: () => {
      piece.destroy();
      const o = this.add.ellipse(bord - 20, ey + 6, 10, 3).setStrokeStyle(1, 0xe8fcff, 0.9); c.add(o);
      this.tweens.add({ targets: o, scaleX: 3, scaleY: 2, alpha: 0, duration: 600, onComplete: () => o.destroy() });
      Son.jouer('piece');
    } });
    hehe.destroy();
    const cri = this.add.text(g.x - 60, sol - 190, "C'est pas c'que tu crois !", style(15, '#3b2410', { fontStyle: 'bold italic', backgroundColor: '#fff4dc', padding: { x: 8, y: 4 } })).setOrigin(0.5); c.add(cri);
    this.message("Grippesou, pris la main dans la fontaine, laisse retomber ta pièce et détale sans demander son reste. Toutes les pièces sont encore au fond.");
    g.setFlipX(true);
    pasDeMarche(this, g, 900, { poussiere: false });
    this.tweens.add({ targets: cri, alpha: 0, delay: 1400, duration: 400, onComplete: () => cri.destroy() });
    await tween({ targets: g, x: 1040, duration: 900, ease: 'Quad.easeIn', onUpdate: suivre });
    g.destroy(); ombre.destroy();
  }

  // La pièce du vœu : elle part de ta main (en bas), tourne sur elle-même en volant, touche l'eau
  // dans une gerbe de gouttes et des ronds, puis coule en se balançant jusqu'au fond.
  lancerPieceFontaine(c, tx, ty, surface, fin) {
    Son.jouer('piece');
    const p = this.add.image(820, 560, 'pieceFace').setScale(2.4); c.add(p);
    const surfaceY = surface + (ty - surface) * 0.15;
    const vol = { t: 0 };
    this.tweens.add({ targets: vol, t: 1, duration: 900, ease: 'Linear',
      onUpdate: () => {
        const u = vol.t;
        p.x = 820 + (tx - 820) * u;
        p.y = 560 + (surfaceY - 560) * u - Math.sin(u * Math.PI) * 240;
        p.scaleX = 2.4 * Math.cos(u * Math.PI * 7);   // elle tourne sur elle-même
        p.scaleY = 2.4 - u * 0.6;
      },
      onComplete: () => {
        // le contact avec l'eau : une gerbe, des ronds, plouf
        Son.jouer('plouf');
        eclaboussure(this, tx, surfaceY, { taille: 1.3, conteneur: c });   // (v0.70)
        // elle coule, à plat, en se balançant, et l'eau la bleuit
        p.setScale(1.5, 0.7).setTint(0xb8d8e8).setAlpha(0.9);
        const coule = { t: 0 };
        this.tweens.add({ targets: coule, t: 1, duration: 1600, ease: 'Sine.easeOut',
          onUpdate: () => { p.y = surfaceY + (ty - surfaceY) * coule.t; p.x = tx + Math.sin(coule.t * Math.PI * 4) * 6 * (1 - coule.t); p.setAngle(Math.sin(coule.t * Math.PI * 4) * 25 * (1 - coule.t)); p.setAlpha(0.9 - coule.t * 0.25); },
          onComplete: () => {
            p.destroy();
            // le vœu : quelques étincelles qui montent de l'eau
            for (let k = 0; k < 8; k++) {
              const e = this.add.image(tx + (Math.random() - 0.5) * 40, ty, 'eclat').setScale(1.4).setTint(0xffe080).setBlendMode(Phaser.BlendModes.ADD); c.add(e);
              this.tweens.add({ targets: e, y: ty - 60 - Math.random() * 40, alpha: 0, duration: 1100, delay: k * 90, onComplete: () => e.destroy() });
            }
            Son.jouer('trefle');
            fin();
          } });
      } });
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
    fontaine.on('pointerdown', () => this.vueFontaine());   // (v0.58 : on s'approche de la fontaine, comme d'un étal)
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
    const noms = { mendiant: 'Le mendiant', bazar: 'Le Bazar de Rosalie', encheres: 'Les enchères', jeux: 'Le coin des jeux', crieur: 'Le crieur', tableau: "Le tableau d'affichage", brocante: 'La brocante', garderobe: 'La garde-robe' };
    const ouvrir = { mendiant: () => this.ouvrirMendiant(), bazar: () => this.ouvrirBazar(), encheres: () => this.ouvrirEncheres(), jeux: () => this.ouvrirJeux(), crieur: () => this.ouvrirCrieur(), tableau: () => this.ouvrirTableau(),
      brocante: () => this.ouvrirBrocante(), garderobe: () => this.ouvrirGardeRobe() };
    // (v0.57) les étiquettes voisines se décalent une sur deux en hauteur : elles ne se chevauchent plus
    const ordre = Object.entries(this.positions).sort((a, b) => a[1][0] - b[1][0]);
    for (const [rang, [cle, [x, type]]] of ordre.entries()) {
      const ferme = type !== 'etal' && !lieuOuvert(this.G, cle);
      const nom = type === 'etal' ? MARCHANDS[cle].nom : ferme ? 'En travaux' : noms[cle];   // (v0.68 : pas de nom avant l'ouverture)
      const t = this.add.text(ox + x * echelle, oy + (250 + this.arcVue(x).dy) * echelle + 6 + (rang % 2) * 34, nom, style(12, ferme ? '#c9b48a' : '#fff4dc', { fontStyle: ferme ? 'italic' : 'bold', stroke: '#1a0e06', strokeThickness: 4, align: 'center', wordWrap: { width: 92 }, lineSpacing: -2 }))
        .setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
      t.on('pointerdown', ferme ? () => this.message(`${noms[cle]} ${ouvrePluriel(cle)} le jour ${OUVERTURE_LIEUX[cle]}.`) : type === 'etal' ? () => this.ouvrirEtal(cle) : ouvrir[cle]);
      // (le métier du marchand se lit en s'approchant de son étal : ici, il chevauchait les voisins)
      c.add(t);
    }
    // Quelques passants flânent sur la grand-place
    const peuples = ['humain', 'nain', 'elfe', 'hobbit', 'humain', 'nain'];
    for (let i = 0; i < 4; i++) {
      const versDroite = i % 2 === 0, y = 434 + i * 13;
      const p = imageCorps(this, 0, y, { nom: 'Passant ' + i, race: peuples[(this.G.jour + i) % peuples.length], feminin: i % 2 === 1, niveau: 'novice' }, 2.8).setFlipX(!versDroite);
      c.add(p);
      pasDeMarche(this, p, 0, { poussiere: false });
      // (v0.58) on clique sur un passant : il s'arrête et lâche une petite phrase
      p.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.passantParle(p, i));
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

  // (v0.58) Ce que disent les passants : leur journée, les nouvelles du crieur, les événements
  // du moment, les gens du marché... avec un peu d'humour.
  passantParle(p, i) {
    const G = this.G;
    if (p.bulle && p.bulle.active) return;
    const gazette = G.gazette && G.gazette.jour === G.jour ? G.gazette.lignes : [];
    const actifs = evenementsActifs(G).map(e => EVENEMENTS[e.id].nouvelle);
    const phrases = [
      "Trois heures que j'attends ma femme devant la tailleuse. Trois heures !",
      "Thorgal a encore martelé toute la nuit. Mes poules ne pondent plus.",
      "Mère Sauge m'a vendu une potion contre la toux. Maintenant je tousse en chantant.",
      "Paraît que Maître Gédéon compte ses pommes deux fois. Et qu'il en trouve une de moins à chaque fois.",
      "Le mendiant ? Brave homme. Son chien, par contre, m'a volé un saucisson. Le saucisson ne m'a jamais été rendu.",
      "J'ai fait un vœu à la fontaine. J'attends toujours mon dragon apprivoisé.",
      "Des aventuriers, partout, tout le temps. On ne peut plus traverser la place sans se prendre une épée dans l'œil.",
      "Hier j'ai perdu aux dés. Aujourd'hui je reviens me refaire. Demain je reviendrai me refaire de m'être refait.",
      `Ton comptoir ? « ${G.nomShop} » ? ... Ah oui ! Celui où il y a toujours la queue.`,
      "Je cherche un cadeau pour ma belle-mère. Rosalie m'a conseillé un pot de miel. Ou un pot de cornichons, je n'ai pas bien entendu.",
    ];
    if (gazette.length) phrases.push(`Le crieur a dit : « ${gazette[0]} » Moi, je n'y crois qu'à moitié.`, 'Le crieur crie de plus en plus fort, tu trouves pas ? Bientôt, on l\'entendra depuis les Terres sauvages.');
    for (const a of actifs) phrases.push(`Tu as entendu ? ${a} On ne parle que de ça !`);
    if (G.argent > 400) phrases.push("On dit que tu roules sur l'or, toi. Tu ne voudrais pas m'acheter un âne ?");
    if ((G.prets || []).length) phrases.push("Les banquiers nains t'ont dans le collimateur, à ce qu'on raconte. Fais attention à tes poches.");
    // (v0.68) de temps en temps, une rumeur sur un chantier de la place (un indice, jamais le nom)
    const chantiers = Object.keys(RUMEURS_CHANTIER).filter(k => !lieuOuvert(G, k));
    const texte = chantiers.length && Math.random() < 0.25 ? Phaser.Utils.Array.GetRandom(RUMEURS_CHANTIER[Phaser.Utils.Array.GetRandom(chantiers)]) : Phaser.Utils.Array.GetRandom(phrases);
    // il s'arrête, se tourne vers toi, parle, puis reprend sa route
    const tw = this.tweens.getTweensOf(p); tw.forEach(t => t.pause());
    if (p.marche) p.marche.paused = true;
    Son.jouer('voix', { personne: { nom: 'Passant ' + i, race: 'humain', feminin: i % 2 === 1 }, ton: Phaser.Utils.Array.GetRandom(['content', 'rire', 'etonne', 'neutre']) });
    const c = this.vue;
    const bulle = p.bulle = this.add.text(Phaser.Math.Clamp(p.x, 130, 830), p.y - p.displayHeight - 10, texte, style(12, '#3b2410', { fontStyle: 'italic', backgroundColor: '#f3e6c8', padding: { x: 8, y: 5 }, wordWrap: { width: 240 }, align: 'center' })).setOrigin(0.5, 1).setDepth(8).setScale(0);
    c.add(bulle);
    this.tweens.add({ targets: bulle, scale: 1, duration: 180, ease: 'Back.easeOut' });
    this.time.delayedCall(Math.max(2600, texte.length * 55), () => {
      this.tweens.add({ targets: bulle, alpha: 0, duration: 300, onComplete: () => bulle.destroy() });
      if (p.active) { tw.forEach(t => t.resume()); if (p.marche) p.marche.paused = false; }
    });
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
    const jour = OUVERTURE_LIEUX[cle];
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
    // (v0.68) pas de nom avant l'ouverture : la surprise reste entière
    this.add.text(x, 184, `Ouverture le jour ${jour}`, style(10, '#e8d4a8', { align: 'center' })).setOrigin(0.5).setAngle(-4);
    this.etiquettesRue.push(this.add.text(x, 262, 'En travaux', style(13, '#c9b48a', { fontStyle: 'bold italic', stroke: '#2a1a10', strokeThickness: 4 })).setOrigin(0.5));
    const zone = this.add.rectangle(x, 170, 160, 160, 0xffffff, 0).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => { Son.jouer('marteau'); this.message(`Des ouvriers s'activent derrière les planches. Qu'est-ce qui ouvrira ici ? Personne ne le sait vraiment... Ouverture le jour ${jour}. ${jour - this.G.jour === 1 ? "C'est pour demain !" : `Encore ${jour - this.G.jour} jours de patience.`}`); });
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

  bouton(c, x, y, l, texte, action, couleur = 0x8a5a2b, haut = 26) {
    const fond = this.add.rectangle(x, y, l, haut, couleur).setStrokeStyle(2, 0x3b2410).setInteractive({ useHandCursor: true });
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
    this.texteInfos.setText(`Réserve : ${stockTotal(G)}/${G.capacite} · Fer ${G.materiaux.fer} · Cuir ${G.materiaux.cuir} · Bois ${G.materiaux.bois || 0} · Fil d'or ${G.materiaux.filOr || 0}\n` +
      `Aujourd'hui : ${p.min === p.max ? p.min : p.min + ' à ' + p.max} clients${p.annonces ? ` (+ ${p.annonces} par lettre)` : ''} · un stock varié en attire plus`);
  }

  message(texte, couleur = '#3b2410') {
    if (couleur === '#a03030') Son.jouer('refus');
    if (this.texteMessage) this.texteMessage.destroy();
    if (this.contenu && !this.modeVue) {
      this.texteMessage = this.add.text(480, 460, texte, style(13, couleur, { fontStyle: 'bold' })).setOrigin(0.5);
      this.contenu.add(this.texteMessage);
    } else {
      // Dans la vue d'ensemble (ou de tout près) : une bulle sur la place, qui s'efface d'elle-même
      this.texteMessage = this.add.text(480, 452, texte, style(14, couleur === '#a03030' ? '#ffb0a0' : '#fff4dc', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 4, align: 'center', wordWrap: { width: 760 } })).setOrigin(0.5).setDepth(45);
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
    // (v0.58) Un vrai étal, rangé : deux poteaux, l'auvent rayé, le mur de planches du fond avec
    // ses deux étagères, une tringle où pend la marchandise, le marchand debout derrière son
    // comptoir, le comptoir drapé à ses couleurs, et ce qu'on garde au sol de chaque côté.
    propsVitrineHD(this); decorsEtalsHD(this); creerDecorPlaceHD(this); creerHalo(this);
    c.add(this.add.image(480, 270, fondVitrineHD(this)).setScale(2));
    for (const [x, l] of [[50, 100], [910, 100]]) c.add(this.add.rectangle(x, 230, l, 470, 0x0a0604, 0.45));
    const etal = etalHD(this, m.couleur);
    c.add(this.add.image(480, 66, etal).setOrigin(0.5, 0).setScale(8.4, 3.2).setCrop(0, 0, 88, 22));
    // ce qu'on met en avant, selon le métier : [suspendu à la tringle, étagère du haut, étagère du bas, au sol à gauche, au sol à droite]
    const deco = {
      gedeon: { pendu: 'painsHD', haut: ['panierPommesHD', 'sacsHD'], bas: ['cagetteHD', 'panierPommesHD'], solG: 'sacsHD', solD: 'panierPommesHD' },
      forge: { pendu: 'outilsForgeHD', haut: ['outilsForgeHD'], bas: ['tonneauxHD', 'cagetteHD'], solG: 'tonneauxHD', solD: 'enclumeHD' },
      apothicaire: { pendu: 'herbesHD', haut: ['bocauxHD'], bas: ['bocauxHD', 'cagetteHD'], solG: 'bocauxHD', solD: 'chaudronHD' },
      tailleuse: { pendu: 'fourruresHD', haut: ['rouleauxHD'], bas: ['rouleauxHD', 'cagetteHD'], solG: 'rouleauxHD', solD: 'mannequinHD' },
    }[cle] || { pendu: null, haut: ['cagetteHD'], bas: ['cagetteHD'], solG: 'tonneauxHD', solD: 'sacsHD' };
    // une image posée par le bas, à la hauteur voulue (proportions gardées)
    const poser = (tex, x, yBas, h, flip = false) => {
      if (!tex || !this.textures.exists(tex)) return null;
      const src = this.textures.get(tex).get();   // (la découpe, pas la source : les icônes 32 px s'affichent en 16)
      const img = this.add.image(x, yBas, tex).setOrigin(0.5, 1).setScale(h / src.height).setFlipX(flip);
      c.add(img); return img;
    };
    // la tringle et ce qui y pend, régulièrement espacé, en laissant le milieu au marchand
    for (const x of [205, 300, 660, 755]) poser(deco.pendu, x, 168, 46);
    // les deux étagères (le marchand cache le milieu) : même rangement à gauche et à droite
    [[deco.haut, 214, 40], [deco.bas, 290, 44]].forEach(([liste, y, h]) => {
      [190, 270, 350, 610, 690, 770].forEach((x, i) => poser(liste[i % liste.length], x, y, h, x > 480));
    });
    // (v0.68) le fond s'assombrit un peu : la marchandise ressort mieux
    c.add(this.add.rectangle(480, 190, 960, 300, 0x120a04, 0.28));
    // le marchand, debout derrière son comptoir
    const personne = { nom: m.nom, race: m.race, feminin: /Mère|Hilda|Rosalie/.test(m.nom) };
    c.add(this.add.image(480, 334, textureBusteHD(this, personne, 'content')).setOrigin(0.5, 1).setScale(1.9));
    // le comptoir : le plateau, puis le drapé à ses couleurs, avec sa frange
    c.add(this.add.image(480, 352, nappeVitrineHD(this, m.couleur)).setOrigin(0.5, 0).setScale(2));
    // au sol, de chaque côté
    poser(deco.solG, 56, 530, 66); poser(deco.solD, 904, 530, 74, true);
    const offre = G.etals[cle], ids = m.objets.filter(id => offre[id] && offre[id].qte > 0);
    const phrases = ids.length ? [`Approche, approche ! Regarde-moi ${ids.length > 1 ? 'ces merveilles' : 'cette merveille'}...`, 'Tout est frais de ce matin. Tu ne trouveras pas mieux sur la place !', `Un œil de connaisseur, je vois. Fais ton choix !`, ...(cle === 'forge' ? ["Mes armes changent chaque matin, l'ami. Ce qui n'est pas là aujourd'hui sortira peut-être de la forge demain !"] : ["Reviens demain : mon étal ne sera pas le même !"])] : ['Tout est parti ! Reviens demain, de bonne heure.'];
    Son.jouer('voix', { personne, ton: 'bonjour' });
    const dit = this.add.text(600, 196, `« ${Phaser.Utils.Array.GetRandom(phrases)} »`, style(14, '#3b2410', { fontStyle: 'italic', backgroundColor: '#f3e6c8', padding: { x: 10, y: 6 }, wordWrap: { width: 250 } })).setOrigin(0, 1);
    c.add(this.add.triangle(0, 0, 600, 190, 618, 190, 572, 214, 0xf3e6c8).setOrigin(0));
    c.add(dit);
    c.add(this.add.text(480, 32, `${m.nom} · ${m.metier}`, style(22, '#f3d98a', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 5 })).setOrigin(0.5));
    // La marchandise, bien alignée sur la nappe : l'objet en grand, sa pile, son étiquette
    const pas = Math.min(130, 700 / Math.max(1, ids.length));
    const prevus = totalCommandes(G);
    ids.forEach((id, i) => {
      const x = 480 + (i - (ids.length - 1) / 2) * pas, o = offre[id], prix = prixMarchand(G, cle, id);
      const groupe = [];
      // (v0.68) une lueur chaude derrière chaque article, et son ombre sous la cagette : il se détache du décor
      c.add(this.add.ellipse(x, 348, pas * 0.7, 12, 0x000000, 0.35));
      c.add(this.add.image(x, 312, 'halo').setScale(1.15).setTint(0xfff0c0).setAlpha(0.5).setBlendMode(Phaser.BlendModes.ADD));
      c.add(this.add.image(x, 346, 'cagetteHD').setOrigin(0.5, 1).setScale(2.6));
      for (let k = 0; k < Math.min(3, Math.ceil(o.qte / 2)); k++) groupe.push(this.add.image(x - 10 + k * 10, 334 - k * 5, iconeObjet(this, id)).setOrigin(0.5, 1).setScale(3.6).setAngle((k - 1) * 6));
      // l'étiquette pend du plateau, au bout d'une ficelle
      c.add(this.add.rectangle(x, 360, 2, 22, 0x3b2410));
      const etiquette = this.add.image(x, 384, panneauHD(this, 64, 30)).setScale(1.5).setAngle(3);
      const texte = this.add.text(x, 384, `${prix} p.`, style(14, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5).setAngle(3);
      const serre = pas < 95;
      const nom = this.add.text(x, 418, serre ? nomObjet(id) : `${nomObjet(id)} × ${o.qte}`, style(serre ? 11 : 12, '#fff4dc', { align: 'center', stroke: '#1a0e06', strokeThickness: 3, wordWrap: { width: pas - 4 } })).setOrigin(0.5, 0);
      // (v0.68) ce que tu en as déjà, juste dessous
      const aDeja = id in MATERIAUX ? G.materiaux[id] || 0 : G.stock[id] || 0;
      // (v0.84) ce que les lettres acceptées demandent (de tout près aussi), rouge s'il en manque
      const prevu = id in MATERIAUX ? 0 : (prevus[id] || 0);
      // (v0.73) sur une plaque sombre : lisible quelle que soit la toile de l'étal (verte, rouge...)
      const aToi = this.add.text(x, 421 + nom.height, (serre ? `× ${o.qte}\nà toi : ${aDeja}` : `tu en as ${aDeja}`) + (prevu ? `\nprévu : ${prevu}` : ''), style(11, prevu > aDeja ? '#ff9a80' : aDeja ? '#f3d98a' : '#d8c8a8', { fontStyle: 'italic', stroke: '#1a0e06', strokeThickness: 3, align: 'center' })).setOrigin(0.5, 0);
      const larg = Math.min(pas - 4, Math.max(nom.width, aToi.width) + 14);
      c.add(this.add.rectangle(x, 414, larg, nom.height + aToi.height + 12, 0x1a0e06, 0.72).setOrigin(0.5, 0).setStrokeStyle(1, 0x8a6a3a, 0.8));
      c.add(nom); c.add(aToi);
      const zone = this.add.rectangle(x, 360, pas - 8, 170, 0xffffff, 0).setInteractive({ useHandCursor: true });
      zone.on('pointerover', () => groupe.forEach(g => g.setScale(4))); zone.on('pointerout', () => groupe.forEach(g => g.setScale(3.6)));
      zone.on('pointerdown', () => {
        const r = acheterAuMarche(G, cle, id);
        if (r.erreur) return this.message(r.erreur, '#a03030');
        Son.jouer('achat');
        this.message(r.message || `Acheté : ${nomObjet(id)}.`);
        this.majInfos();
        if (this.commandesOuvertes) { this.panneauCommandes.destroy(); this.creerPanneauCommandes(); }
        this.vitrine(cle);
        if (this.panneauCommandes) this.panneauCommandes.setDepth(45);
      });
      c.add([...groupe, etiquette, texte, zone]);
    });
    if (!ids.length) c.add(this.add.text(480, 390, 'Les cagettes sont vides...', style(16, '#c9b48a', { fontStyle: 'italic', stroke: '#1a0e06', strokeThickness: 3 })).setOrigin(0.5));
    const b = creerBouton(this, 836, 46, 200, '◀ Reculer', fermer);
    c.add([b.fond, b.label]);
    // (v0.68) ta bourse, en haut à gauche
    c.add(bourse(this, 44, 96, G.argent, { echelle: 1.6, taille: 16, aDroite: true }));
    // (v0.84) les commandes prévues par lettre, consultables de tout près aussi
    const nLettres = G.annonces.filter(a => a.acceptee && a.jour >= G.jour).length;
    const bc = creerBouton(this, 124, 42, 220, `Commandes prévues (${nLettres}) ${this.commandesOuvertes ? '▲' : '▼'}`, () => {
      this.basculerCommandes();
      if (this.panneauCommandes) this.panneauCommandes.setDepth(45);
      bc.setTexte(`Commandes prévues (${nLettres}) ${this.commandesOuvertes ? '▲' : '▼'}`);
    });
    bc.label.setFontSize(13);
    c.add([bc.fond, bc.label]);
    if (this.panneauCommandes) this.panneauCommandes.setDepth(45);
    c.once('destroy', () => { if (this.panneauCommandes) this.panneauCommandes.setDepth(20); });
    // (v0.68) des flèches pour passer d'un étal à l'autre sans reculer (et ◀ ▶ au clavier)
    const cles = Object.keys(MARCHANDS), i0 = cles.indexOf(cle);
    const aller = sens => { const suivant = cles[(i0 + sens + cles.length) % cles.length]; Son.jouer('glisse'); this.ouvrirEtal(suivant); this.vitrine(suivant); };
    for (const sens of [-1, 1]) {
      const voisin = MARCHANDS[cles[(i0 + sens + cles.length) % cles.length]];
      const f = creerBouton(this, sens < 0 ? 44 : 916, 250, 64, sens < 0 ? '◀' : '▶', () => aller(sens));
      const nomVoisin = this.add.text(sens < 0 ? 44 : 916, 284, voisin.metier, style(11, '#e8d4a8', { fontStyle: 'italic', stroke: '#1a0e06', strokeThickness: 3, align: 'center', wordWrap: { width: 90 } })).setOrigin(0.5, 0);
      c.add([f.fond, f.label, nomVoisin]);
    }
    if (this.input.keyboard) {
      const touche = e => { if (!c.active) return; if (e.key === 'ArrowLeft') aller(-1); else if (e.key === 'ArrowRight') aller(1); };
      this.input.keyboard.on('keydown', touche);
      c.once('destroy', () => this.input.keyboard && this.input.keyboard.off('keydown', touche));
    }
    // (v0.76) on rappelle que les étals tournent : ce qui manque aujourd'hui reviendra peut-être demain
    // (v0.82, étape 10b) pour qui a une forge : les lots en gros de Thorgal (5 d'un coup, −30 %)
    if (cle === 'forge' && forgeConstruite(G)) {
      c.add(this.add.text(82, 96, 'En gros pour\nta forge', style(12, '#f3d98a', { fontStyle: 'bold', align: 'center', stroke: '#1a0e06', strokeThickness: 3, lineSpacing: -2 })).setOrigin(0.5));
      ['fer', 'cuir', 'bois'].forEach((m, i) => {
        const b = creerBouton(this, 82, 130 + i * 34, 140, `${FORGE.lot} ${MATERIAUX[m].nom.toLowerCase()} · ${prixLotGros(G, m)} p.`, () => {
          const r = acheterLotGros(G, m);
          if (typeof r === 'string') return this.message(r, '#a03030');
          Son.jouer('achat'); this.message(r.message || `${FORGE.lot} ${MATERIAUX[m].nom.toLowerCase()} pour ta forge.`); this.majInfos(); this.vitrine(cle);
        });
        b.label.setFontSize(11); c.add([b.fond, b.label]);
      });
    }
    c.add(this.add.text(480, 505, cle === 'forge' ? 'Clique sur un article pour l\'acheter · Thorgal ne sort que quelques armes chaque matin : elles changent d\'un jour à l\'autre' : 'Clique sur un article pour l\'acheter · Les étals changent chaque matin', style(12, '#e8d4a8', { fontStyle: 'italic', stroke: '#1a0e06', strokeThickness: 3 })).setOrigin(0.5));
  }

  ouvrirEtal(cle) {
    const G = this.G;
    this.montrer(cle);
    const m = MARCHANDS[cle];
    const rel = niveauRelation(G, m.nom);
    const remise = remiseMarchand(G, cle);
    const c = this.panneau(`${m.nom} · ${m.metier}`, `Relation : ${rel.nom}${remise ? ` · remise ${Math.round(remise * 100)} %` : ''} · clique sur une ligne pour acheter`);
    const offre = G.etals[cle];
    const ids = m.objets.filter(id => offre[id]);
    // (v0.63) les armes absentes ne prennent pas de ligne : il y en a trop
    m.objets.filter(id => !offre[id] && !estArme(id)).forEach(id => ids.push(id));
    const cols = ids.length > 6 ? 3 : 2, lx = cols === 3 ? 300 : 460;
    ids.forEach((id, i) => {
      const x = 30 + (i % cols) * lx;
      const y = 352 + Math.floor(i / cols) * 30;
      const o = offre[id];
      c.add(this.add.image(x + 12, y, iconeObjet(this, id)).setScale(2.4));
      const k3 = cols === 3;
      const nomT = this.add.text(x + 34, y, nomObjet(id), style(k3 ? 12 : 14, '#3b2410')).setOrigin(0, 0.5);
      for (let t = k3 ? 12 : 14; nomT.width > (k3 ? 86 : 112) && t >= 9; t--) nomT.setFontSize(t);
      c.add(nomT);
      const enStock = id in MATERIAUX ? G.materiaux[id] : G.stock[id];
      // (v0.69) sur trois colonnes aussi, les mêmes mots que chez les autres : « tu as N », « N en vente »
      const ajuster = (t, max) => { for (let f = parseInt(t.style.fontSize, 10); t.width > max && f >= 8; f--) t.setFontSize(f); return t; };
      c.add(ajuster(this.add.text(x + (k3 ? 124 : 150), y, `tu as ${enStock}`, style(k3 ? 11 : 12, '#6b4a2a')).setOrigin(0, 0.5), k3 ? 46 : 70));
      if (!o) {
        c.add(this.add.text(x + (k3 ? 174 : 260), y, "Pas aujourd'hui", style(k3 ? 11 : 12, '#8a6a4a', { fontStyle: 'italic' })).setOrigin(0, 0.5));
        return;
      }
      c.add(this.add.text(x + (k3 ? 174 : 230), y, `${prixMarchand(G, cle, id)} p.`, style(k3 ? 12 : 14, '#3b2410', { fontStyle: 'bold' })).setOrigin(0, 0.5));
      c.add(ajuster(this.add.text(x + (k3 ? 210 : 300), y, o.qte > 0 ? `${o.qte} en vente` : 'Épuisé', style(k3 ? 11 : 12, o.qte > 0 ? '#4a6a2a' : '#8a6a4a', { fontStyle: 'italic' })).setOrigin(0, 0.5), k3 ? 82 : 120));
      // (v0.84) on achète de nouveau d'ici : un clic sur la ligne en achète un (de près, ça marche aussi)
      if (o.qte > 0) {
        const surbrillance = this.add.rectangle(x - 4, y, lx - 12, 26, 0xfff2c0, 0).setOrigin(0, 0.5);
        const zone = this.add.rectangle(x - 4, y, lx - 12, 26, 0xffffff, 0).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
        zone.on('pointerover', () => surbrillance.setFillStyle(0xfff2c0, 0.55));
        zone.on('pointerout', () => surbrillance.setFillStyle(0xfff2c0, 0));
        zone.on('pointerdown', () => {
          if (this.verrouAchat > this.time.now) return;
          this.verrouAchat = this.time.now + 250;
          const r = acheterAuMarche(G, cle, id);
          if (r.erreur) return this.message(r.erreur, '#a03030');
          Son.jouer('achat');
          this.majInfos();
          if (this.commandesOuvertes) { this.panneauCommandes.destroy(); this.creerPanneauCommandes(); }
          this.ouvrirEtal(cle);
          this.message(r.message || `Acheté : ${nomObjet(id)}.`);
        });
        c.addAt(surbrillance, 0);
        c.add(zone);
      }
    });
    // (v0.68) une vraie plaque de bois, comme les autres boutons du jeu
    const pres = creerBouton(this, 800, 446, 240, "Voir l'étal de près ▸", () => this.vitrine(cle));
    c.add([pres.fond, pres.label]);
  }

  // --- Les enchères : on choisit jusqu'à 3 objets, qui forment un lot ---

  ouvrirEncheres() {
    const G = this.G;
    if (!lieuOuvert(G, 'encheres')) return this.message(`${NOMS_LIEUX_MARCHE.encheres} ${ouvrePluriel('encheres')} le jour ${OUVERTURE_LIEUX.encheres}.`);
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
      if (!merci) return this.message(manqueArgent(G, n, "Tu n'as pas assez d'argent."), '#a03030');
      Son.jouer('pieces', { montant: n });
      this.ouvrirMendiant();
      this.message(texteMendiant(merci));
    }));
    // Une ration par jour pour le chien (ça compte, pour plus tard...) : on s'approche pour la lui donner
    const nourri = G.chienJour === G.jour;
    const b = this.bouton(c, 230, 436, 260, nourri ? 'Brisquet a eu sa ration aujourd\'hui' : `Donner une ration au chien (${G.stock.ration || 0} en réserve)`, () => {
      if (nourri) return;
      this.vueMendiant(true);
    }, nourri ? 0x6a5a4a : 0x4f7a3a);
    if (nourri) b.fond.disableInteractive();
    this.bouton(c, 620, 436, 200, "S'approcher et parler", () => this.vueMendiant());
  }

  // (v0.58) Le mendiant de près : son visage, son chien, ce qu'il raconte (un peu plus, à mesure
  // que tu l'aides) ; on peut lui donner quelques pièces, ou une ration à Brisquet, qui la dévore.
  vueMendiant(nourrir = false) {
    const G = this.G;
    if (this.vitrineOuverte) this.vitrineOuverte.destroy();
    const c = this.vitrineOuverte = this.add.container(0, 0).setDepth(40);
    const panneau = this.contenu;
    if (panneau) panneau.setVisible(false);
    const fermer = () => { Son.jouer('glisse'); c.destroy(); this.vitrineOuverte = null; if (panneau && panneau.active) panneau.setVisible(true); this.ouvrirMendiant(); };
    c.add(this.add.rectangle(480, 270, 960, 540, 0x0e0a06, 0.92).setInteractive());
    // son coin de la place : le mur, le tonneau, les pavés, un rayon de soleil
    c.add(this.add.image(480, 270, murRuelleHD(this)).setScale(2));
    c.add(this.add.rectangle(480, 200, 960, 400, 0x0a0604, 0.2));
    const rayon = this.add.triangle(0, 0, 300, 0, 420, 0, 640, 540, 0xfff0c0, 0.08).setOrigin(0).setBlendMode(Phaser.BlendModes.ADD); c.add(rayon);
    c.add(this.add.image(250, 500, 'tonneauxHD').setOrigin(0.5, 1).setScale(3.4).setTint(0xb0a090));
    creerIconesHD(this);
    const personne = { nom: 'Le mendiant', race: 'humain', figurant: 'mendiant', vieux: true };
    // (v0.68) de près, on le voit en entier, debout contre son tonneau et appuyé sur son bâton
    // (son buste seul avait l'air de flotter)
    const corps = imageCorps(this, 400, 506, 'mendiant', 1);
    const echelle = 360 / corps.height;
    corps.setScale(echelle); c.add(corps);
    c.add(this.add.ellipse(400, 506, corps.displayWidth * 0.8, 14, 0x000000, 0.35));
    c.bringToTop(corps);
    this.tweens.add({ targets: corps, scaleY: echelle * 1.01, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });   // il respire
    const buste = corps;
    // sa sébile ébréchée, et les quelques pièces dedans
    c.add(this.add.ellipse(520, 478, 54, 16, 0x5a4a3a).setStrokeStyle(2, 0x2a1a10));
    for (let k = 0; k < Math.min(6, Math.ceil((G.mendiant || 0) / 5)); k++) c.add(this.add.ellipse(506 + k * 6, 475 - (k % 2) * 2, 8, 4, 0xe8c040));
    const chien = this.add.image(660, 486, chienHD(this, 'profil', true)).setOrigin(0.5, 1).setScale(2.2).setFlipX(true); c.add(chien);
    this.tweens.add({ targets: chien, scaleY: 2.24, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    c.add(this.add.text(480, 32, 'Le mendiant et Brisquet', style(22, '#f3d98a', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 5 })).setOrigin(0.5));
    // ce qu'il raconte : un peu plus de son histoire à mesure que tu l'aides
    const paroles = G.mendiant >= 40 ? ["J'ai été aventurier, tu sais. Comme ceux que tu équipes. Un jour, je suis rentré... sans mes amis.", "Brisquet m'a tiré d'un torrent, cette fois-là. Depuis, on ne se quitte plus."]
      : G.mendiant >= 10 ? ["Tu reviens souvent, toi. C'est rare, les gens qui reviennent.", "Le crieur raconte n'importe quoi, mais il crie bien. Ça me tient compagnie."]
      : ["Une petite pièce, pour un vieil homme et son chien ?", "Ne fais pas attention à Brisquet. Il grogne, mais il n'a plus de dents... presque plus."];
    const bulle = this.add.text(560, 150, `« ${Phaser.Utils.Array.GetRandom(paroles)} »`, style(15, '#3b2410', { fontStyle: 'italic', backgroundColor: '#f3e6c8', padding: { x: 12, y: 8 }, wordWrap: { width: 330 } })).setOrigin(0, 0);
    c.add(this.add.triangle(0, 0, 560, 190, 560, 214, 520, 230, 0xf3e6c8).setOrigin(0)); c.add(bulle);
    // (v0.73) ce qui se passe est raconté à part, dans un bandeau sombre façon narrateur :
    // la bulle ne garde que ce que dit le mendiant
    const recit = this.add.text(480, 66, '', style(15, '#f3e6c8', { fontStyle: 'italic', align: 'center', backgroundColor: '#1a0e06cc', padding: { x: 14, y: 7 }, wordWrap: { width: 720 } })).setOrigin(0.5, 0).setVisible(false);
    c.add(recit);
    const raconter = (r) => {
      bulle.setText(`« ${r.parole} »`);
      recit.setText(r.recit || '').setVisible(!!r.recit);
    };
    Son.jouer('voix', { personne, ton: G.mendiant >= 10 ? 'content' : 'triste' });
    // les dons et la ration
    [1, 5, 10].forEach((n, i) => {
      const b = creerBouton(this, 150 + i * 170, 516, 150, `Donner ${n} p.`, () => {
        const merci = donnerAuMendiant(G, n);
        if (!merci) return this.message(manqueArgent(G, n, "Tu n'as pas assez d'argent."), '#a03030');
        this.majInfos();
        // (v0.68) les pièces volent jusqu'à sa sébile, puis il pense à ce qu'il va en faire
        voleePieces(this, 150 + i * 170, 500, 520, 474, n, { conteneur: c, fin: () => {
          if (!c.active) return;
          raconter(merci);
          const image = n >= 10 ? chienHD(this, 'profil', true) : n >= 5 ? 'hd_coeur' : iconeObjet(this, 'ration');
          bullePensee(this, 430, buste.y - buste.displayHeight + 10, image, { conteneur: c, echelle: n >= 10 ? 0.9 : 2.6 });
        } });
      });
      c.add([b.fond, b.label]);
      // (v0.90) un geste de lumière, une fois par jour
      if (G.mendiantLumiere !== G.jour) marquerCamp(this, b, 'bien');
    });
    const deja = G.chienJour === G.jour;
    const ration = creerBouton(this, 690, 516, 220, deja ? 'Brisquet a mangé' : 'Une ration au chien', () => this.nourrirBrisquet(c, chien, raconter, ration));
    if (deja) ration.fond.setAlpha(0.6);
    const reculer = creerBouton(this, 836, 46, 200, '◀ Reculer', fermer);
    c.add([ration.fond, ration.label, reculer.fond, reculer.label]);
    if (nourrir && !deja) this.time.delayedCall(500, () => this.nourrirBrisquet(c, chien, raconter, ration));
  }

  // Brisquet mange : la ration vole jusqu'à lui, il se dresse, la croque (sa tête qui plonge,
  // des miettes, « Crunch ! »), puis remue de tout son corps et pose sur toi un regard de bonheur.
  nourrirBrisquet(c, chien, raconter, bouton) {
    const G = this.G;
    if (this.chienMange || G.chienJour === G.jour) return;
    const quoi = nourrirChien(G);
    if (!quoi) return this.message("Tu n'as pas de ration dans ta réserve.", '#a03030');
    this.chienMange = true;
    bouton.label.setText('Brisquet a mangé'); bouton.fond.setAlpha(0.6);
    const r = this.add.image(880, 540, iconeObjet(this, 'ration')).setScale(3); c.add(r);
    const yBouche = chien.y - chien.displayHeight * 0.45, xBouche = chien.x - chien.displayWidth * 0.32;
    this.tweens.add({ targets: r, x: xBouche, duration: 600, ease: 'Linear' });
    this.tweens.add({ targets: r, y: yBouche - 70, duration: 300, ease: 'Quad.easeOut', yoyo: true, onComplete: () => {
      r.destroy();
      Son.jouer('chien');
      this.tweens.killTweensOf(chien);
      // il croque : la tête plonge et remonte, quatre fois, avec des miettes
      let n = 0;
      const croc = () => {
        if (!chien.active) return;
        if (n++ >= 4) {
          // la fête : il frétille de tout son corps
          this.tweens.add({ targets: chien, angle: { from: -4, to: 4 }, duration: 90, yoyo: true, repeat: 7, onComplete: () => {
            chien.setAngle(0);
            creerIconesHD(this);
            bullePensee(this, chien.x - 20, chien.y - chien.displayHeight - 4, iconeObjet(this, 'ration'), { conteneur: c, echelle: 2.6, cote: -1 });   // (v0.68) il rêve déjà de la prochaine
            this.chienMange = false;
            raconter(quoi);
          } });
          return;
        }
        Son.jouer('miam');
        this.tweens.add({ targets: chien, scaleY: 2.0, scaleX: 2.3, y: chien.y + 4, duration: 110, yoyo: true, onComplete: () => this.time.delayedCall(90, croc) });
        for (let k = 0; k < 4; k++) {
          const m = this.add.rectangle(xBouche + (Math.random() - 0.5) * 20, yBouche + 10, 4, 4, 0xc89a5a); c.add(m);
          this.tweens.add({ targets: m, x: m.x + (Math.random() - 0.5) * 50, y: chien.y - 4, angle: 180, duration: 400 + Math.random() * 200, ease: 'Quad.easeIn', onComplete: () => this.tweens.add({ targets: m, alpha: 0, duration: 400, onComplete: () => m.destroy() }) });
        }
        if (n === 2) { const t = this.add.text(xBouche - 10, yBouche - 40, 'Crunch !', style(22, '#fff4dc', { fontStyle: 'bold', stroke: '#2a1a10', strokeThickness: 5 })).setOrigin(0.5).setAngle(-8); c.add(t); this.tweens.add({ targets: t, y: t.y - 24, alpha: 0, delay: 500, duration: 500, onComplete: () => t.destroy() }); }
      };
      croc();
    } });
  }

  // Un petit cœur (ou autre) qui monte et s'efface, au-dessus d'une vue rapprochée
  emotionSimple(x, y, glyphe) {
    const t = this.add.text(x, y, glyphe, style(30, '#e04060', { fontStyle: 'bold', stroke: '#fff4dc', strokeThickness: 4 })).setOrigin(0.5).setDepth(45).setScale(0);
    this.tweens.add({ targets: t, scale: 1, duration: 200, ease: 'Back.easeOut' });
    this.tweens.add({ targets: t, y: y - 40, alpha: 0, delay: 700, duration: 600, onComplete: () => t.destroy() });
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
    c.add(this.add.text(30, 334, "« Des merveilles dénichées aux quatre coins des Trois Terres. Ça fera un comptoir qu'on remarque ! »",
      style(11, '#6b4a2a', { fontStyle: 'italic' })));
    Object.entries(DECOS).filter(([, d]) => !d.cadeau).forEach(([id, d], i) => {   // (les souvenirs ne se vendent pas)
      // Une ligne par décoration : l'icône, le nom et le prix, l'effet en bref (l'effet complet au survol)
      // (v0.84) des lignes qui ne se chevauchent plus : sous la phrase de Firmin, et des boutons plus fins
      const x = 40 + (i % 2) * 460;
      const y = 361 + Math.floor(i / 2) * 21;
      c.add(this.add.image(x, y, iconeObjet(this, id)).setScale(1.5));
      const nom = this.add.text(x + 16, y, `${d.nom} · ${d.prix} p.`, style(12, d.camp === 'bien' ? '#8a6a00' : d.camp === 'mal' ? '#5a2a7a' : '#3b2410', { fontStyle: 'bold' })).setOrigin(0, 0.5);
      c.add(nom);
      const effet = this.add.text(x + 22 + nom.width, y + 1, d.court || '', style(10, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0, 0.5).setInteractive();
      effet.on('pointerover', () => this.message(d.effet));
      c.add(effet);
      if (aDeco(G, id)) c.add(this.add.text(x + 405, y, 'Chez toi', style(11, '#2f6a2a', { fontStyle: 'bold italic' })).setOrigin(0.5));
      else this.bouton(c, x + 405, y, 62, 'Acheter', () => {
        if (this.verrouBrocante > this.time.now) return;
        this.verrouBrocante = this.time.now + 400;
        const erreur = acheterDeco(G, id);
        if (!erreur) Son.jouer('achat');
        this.ouvrirBrocante();
        this.message(erreur || `${d.nom} : ${d.f ? 'accrochée' : 'accroché'} dans ton arrière-boutique !`, erreur ? '#a03030' : '#2f6a2a');
      }, undefined, 19);
    });
  }

  // --- La garde-robe : des vêtements et des accessoires pour toi ---

  ouvrirGardeRobe() {
    const G = this.G;
    if (!lieuOuvert(G, 'garderobe')) return this.message(`${NOMS_LIEUX_MARCHE.garderobe} ouvre le jour ${OUVERTURE_LIEUX.garderobe}.`);
    this.montrer('garderobe');
    const c = this.panneau(MARCELLINE.nom, 'Ce que tu achètes, tu le portes ; ta malle, au pied du lit, garde le reste');
    c.add(this.add.text(30, 334, "« Un commerce bien tenu commence par une tenue soignée. Laisse-moi t'arranger ça... »",
      style(11, '#6b4a2a', { fontStyle: 'italic' })));
    // Toi, dans ta tenue du moment
    textureJoueur(this, G);
    c.add(this.add.image(900, 500, textureJoueur(this, G, 'troisQuarts')).setOrigin(0.5, 1).setScale(echelleJoueur(7)).setFlipX(true));   // (tourné vers la marchande)
    Object.entries(GARDE_ROBE).forEach(([id, d], i) => {
      const x = 40 + (i % 2) * 400;
      const y = 364 + Math.floor(i / 2) * 25;   // (audit v0.61 : la dernière rangée passait sous le message)
      c.add(this.add.image(x, y, iconeObjet(this, id)).setScale(1.6));
      c.add(this.add.text(x + 18, y - 6, `${d.nom} · ${d.prix} p.`, style(12, '#3b2410', { fontStyle: 'bold' })).setOrigin(0, 0.5));
      // (v0.84) l'effet tient sur une ligne (il débordait sur la rangée suivante) ; en entier au survol
      const effet = this.add.text(x + 18, y + 7, d.effet, style(10, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0, 0.5);
      if (effet.width > 290) {
        let t = d.effet;
        while (t.length > 4 && effet.setText(t + '…').width > 290) t = t.slice(0, -1);
        effet.setInteractive().on('pointerover', () => this.message(d.effet));
      }
      c.add(effet);
      // (audit v0.61) un double clic retombait sur le bouton reconstruit : acheter puis revendre aussitôt
      const verrou = () => { if (this.verrouGR > this.time.now) return true; this.verrouGR = this.time.now + 400; return false; };
      if (possede(G, id)) this.bouton(c, x + 340, y, 70, `Revendre`, () => {
        if (verrou()) return;
        const erreur = revendreTenue(G, id);
        if (!erreur) Son.jouer('pieces');
        this.ouvrirGardeRobe();
        this.message(erreur || `${d.nom} ${d.f ? 'revendue' : 'revendu'} à Marcelline : +${Math.floor(d.prix / 2)} p.`, erreur ? '#a03030' : '#2f6a2a');
      }, undefined, 21);
      else this.bouton(c, x + 340, y, 70, 'Acheter', () => {
        if (verrou()) return;
        const erreur = acheterTenue(G, id);
        if (!erreur) Son.jouer('achat');
        this.ouvrirGardeRobe();
        this.message(erreur || `${d.nom} : tu ${d.f ? 'la' : 'le'} portes dès maintenant !`, erreur ? '#a03030' : '#2f6a2a');
      }, undefined, 21);
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
    c.add(this.add.text(30, 344, ['Oyez, oyez !', ...lignes.map(l => '• ' + l),
      ...(actifs.length ? ['', 'En ce moment : ' + actifs.join(' · ')] : [])].join('\n'),
      style(13, '#3b2410', { wordWrap: { width: 890 }, lineSpacing: 4 })));
  }

  // --- (v0.74) Le tableau d'affichage ---

  ouvrirTableau() {
    const G = this.G;
    this.montrer('tableau');
    const c = this.panneau("Le tableau d'affichage", 'Nouvelles, avis de recherche et annonces du Conseil');
    const avis = avisDeRecherche(G);
    c.add(this.add.text(30, 344, `Trois têtes mises à prix cette semaine : ${avis.map(a => a.nom).join(', ')}.\nLes nouvelles du jour et les annonces du Conseil sont punaisées à côté.`, style(14, '#3b2410', { lineSpacing: 4, wordWrap: { width: 890 } })));
    this.bouton(c, 480, 430, 300, 'Lire les affiches de près', () => this.vueTableau());
    this.vueTableau();
  }

  // Le tableau de près : un grand panneau de bois sous un petit toit, les affiches punaisées.
  // Un clic sur une affiche la décroche pour la lire en grand ; un autre clic la remet en place.
  vueTableau() {
    const G = this.G;
    G.tableauLu = G.jour;
    if (this.exclamTableau) this.exclamTableau.setVisible(false);
    if (this.vitrineOuverte) this.vitrineOuverte.destroy();
    const c = this.vitrineOuverte = this.add.container(0, 0).setDepth(40);
    const panneau = this.contenu;
    if (panneau) panneau.setVisible(false);
    const fermer = () => { Son.jouer('glisse'); c.destroy(); this.vitrineOuverte = null; if (panneau && panneau.active) panneau.setVisible(true); };
    c.add(this.add.rectangle(480, 270, 960, 540, 0x0e0a06, 0.92).setInteractive());
    c.add(this.add.image(480, 270, murRuelleHD(this)).setScale(2));
    c.add(this.add.rectangle(480, 270, 960, 540, 0x0a0604, 0.3));
    // le panneau : deux poteaux, un cadre, des planches, un petit toit de bardeaux
    const g = this.add.graphics(); c.add(g);
    const x0 = 70, y0 = 78, L = 820, H = 418;
    g.fillStyle(0x3b2410).fillRect(x0 + 30, y0, 26, H + 60).fillRect(x0 + L - 56, y0, 26, H + 60);
    g.fillStyle(0x2a1608).fillRect(x0 - 8, y0 - 8, L + 16, H + 16);
    for (let k = 0; k < 7; k++) {
      const y = y0 + k * (H / 7);
      g.fillStyle(k % 2 ? 0x7a5432 : 0x6e4a2a).fillRect(x0, y, L, H / 7 - 2);
      g.fillStyle(0x8a6440, 0.5).fillRect(x0, y, L, 3);
      for (let n = 0; n < 6; n++) g.fillStyle(0x4a2e18, 0.5).fillRect(x0 + 40 + ((n * 137 + k * 61) % (L - 80)), y + 8 + (n % 3) * 10, 18, 2);   // (le grain du bois)
    }
    g.lineStyle(6, 0x4a2e18).strokeRect(x0 - 3, y0 - 3, L + 6, H + 6);
    // le toit
    g.fillStyle(0x4a2a1a).fillTriangle(x0 - 40, y0 - 4, x0 + L + 40, y0 - 4, 480, y0 - 58);
    for (let k = 0; k < 4; k++) { g.lineStyle(2, 0x2a160c, 0.8); const yy = y0 - 4 - k * 13; const dx = (L / 2 + 40) * (1 - k * 13 / 54); g.lineBetween(480 - dx, yy, 480 + dx, yy); }
    g.lineStyle(3, 0x1a0e06).strokeTriangle(x0 - 40, y0 - 4, x0 + L + 40, y0 - 4, 480, y0 - 58);
    c.add(this.add.text(480, y0 - 24, "TABLEAU D'AFFICHAGE", style(15, '#f3d98a', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 4 })).setOrigin(0.5));
    // de vieux bouts d'affiches arrachées, pour faire vrai
    [[x0 + 18, y0 + 300, 0xd8c8a0], [x0 + L - 80, y0 + 20, 0xcab890], [x0 + 410, y0 + 370, 0xd0c098]].forEach(([x, y, col]) => {
      const lam = this.add.polygon(x, y, [0, 0, 46, 4, 40, 22, 52, 34, 12, 40, 4, 24], col, 0.55).setOrigin(0); c.add(lam);
    });
    // les affiches
    const avis = avisDeRecherche(G);
    const affiches = [
      this.afficheGazette(212, 250, -2),
      this.afficheRecherche(avis[0], 422, 276, 2),
      this.afficheRecherche(avis[1], 598, 286, -1.5),
      this.afficheRecherche(avis[2], 774, 272, 2.5),
    ];
    // l'affiche des événements, plus petite, en bas à gauche (on la décale si le tableau est plein)
    affiches.push(this.afficheEvenements(212, 436, 1));
    affiches.forEach(a => c.add(a));
    let grande = null;
    const voile = this.add.rectangle(480, 270, 960, 540, 0x000000, 0.6).setVisible(false).setInteractive(); c.add(voile);
    const reposer = () => {
      if (!grande) return;
      const a = grande; grande = null;
      Son.jouer('page');
      voile.setVisible(false);
      this.tweens.add({ targets: a, x: a.place.x, y: a.place.y, scale: 1, angle: a.place.angle, duration: 260, ease: 'Quad.easeOut', onComplete: () => c.moveBelow(a, voile) });
    };
    voile.on('pointerdown', reposer);
    affiches.forEach(a => {
      a.place = { x: a.x, y: a.y, angle: a.angle };
      a.zone.on('pointerover', () => { if (!grande) a.setScale(1.04); });
      a.zone.on('pointerout', () => { if (grande !== a) a.setScale(1); });
      a.zone.on('pointerdown', () => {
        if (grande === a) return reposer();
        if (grande) return;
        grande = a;
        Son.jouer('page');
        voile.setVisible(true); c.bringToTop(voile); c.bringToTop(a);
        const e = Math.min(1.9, 470 / a.hauteur);
        this.tweens.add({ targets: a, x: 480, y: 270, scale: e, angle: 0, duration: 300, ease: 'Back.easeOut' });
      });
    });
    c.add(this.add.text(480, 522, 'Clique sur une affiche pour la lire en grand', style(13, '#f3e6c8', { fontStyle: 'italic', stroke: '#1a0e06', strokeThickness: 3 })).setOrigin(0.5));
    const reculer = creerBouton(this, 836, 32, 200, '◀ Reculer', fermer);
    c.add([reculer.fond, reculer.label]);
    c.bringToTop(reculer.fond); c.bringToTop(reculer.label);
  }

  // Une feuille d'affiche : le papier jauni, les bords brûlés et cornés, la punaise en haut.
  feuilleAffiche(x, y, l, h, angle, couleur = 0xe8d6a4) {
    const a = this.add.container(x, y).setAngle(angle);
    a.hauteur = h;
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.35).fillRect(-l / 2 + 5, -h / 2 + 6, l, h);   // l'ombre sur le bois
    g.fillStyle(0x8a6a3a).fillRect(-l / 2, -h / 2, l, h);                  // le bord bruni
    g.fillStyle(couleur).fillRect(-l / 2 + 4, -h / 2 + 4, l - 8, h - 8);
    g.fillStyle(0xf3e6c0, 0.5).fillRect(-l / 2 + 4, -h / 2 + 4, l - 8, 6);
    // des taches et des déchirures sur le bord
    for (let k = 0; k < 7; k++) g.fillStyle(0xb89a64, 0.45).fillRect(-l / 2 + 10 + ((k * 53) % (l - 26)), -h / 2 + 14 + ((k * 89) % (h - 30)), 6 + (k % 3) * 3, 3);
    g.fillStyle(0x6e4a2a).fillTriangle(l / 2, h / 2, l / 2 - 16, h / 2, l / 2, h / 2 - 16);   // un coin corné
    g.fillStyle(0xcab284).fillTriangle(l / 2 - 16, h / 2, l / 2, h / 2 - 16, l / 2 - 16, h / 2 - 16);
    a.add(g);
    // la punaise
    a.add(this.add.circle(0, -h / 2 + 8, 5, 0xa02a20).setStrokeStyle(1, 0x3b0a08));
    a.add(this.add.circle(-1.5, -h / 2 + 6.5, 1.6, 0xf0a090));
    a.zone = this.add.rectangle(0, 0, l, h, 0xffffff, 0).setInteractive({ useHandCursor: true });
    a.add(a.zone);
    return a;
  }

  // L'avis de recherche, façon primes de pirates : « AVIS DE RECHERCHE », le portrait, « MORT OU
  // VIF », le nom en grand et la prime en gros chiffres.
  afficheRecherche(avis, x, y, angle) {
    const l = 164, h = 284, haut = -h / 2;
    const a = this.feuilleAffiche(x, y, l, h, angle);
    const encre = '#3a2210';
    a.add(this.add.text(0, haut + 22, 'AVIS DE', style(13, encre, { fontStyle: 'bold' })).setOrigin(0.5));
    a.add(this.add.text(0, haut + 41, 'RECHERCHE', style(22, encre, { fontStyle: 'bold' })).setOrigin(0.5));
    // le portrait, imprimé à l'encre sépia, dans son cadre
    const pl = 128, ph = 96, py = haut + 62 + ph / 2;
    a.add(this.add.rectangle(0, py, pl + 6, ph + 6, 0x3a2210));
    a.add(this.add.rectangle(0, py, pl, ph, 0xcdb98a));
    const portrait = this.add.image(0, py + ph / 2, textureBusteHD(this, avis.personne, 'fache')).setOrigin(0.5, 1).setTint(0xd8b888);
    const e = (ph + 18) / portrait.height;
    portrait.setScale(e);
    // (le buste dépasse du cadre : on le rogne)
    const cw = Math.min(portrait.width, pl / e), ch = Math.min(portrait.height, ph / e);
    portrait.setCrop((portrait.width - cw) / 2, portrait.height - ch, cw, ch);
    a.add(portrait);
    let yy = py + ph / 2 + 6;
    const ligne = (texte, taille, extra = {}, ecart = 2) => {
      const t = this.add.text(0, yy, texte, style(taille, extra.couleur || encre, { fontStyle: 'bold', align: 'center', wordWrap: { width: l - 18 }, lineSpacing: -2, ...extra })).setOrigin(0.5, 0);
      a.add(t); yy += t.height + ecart; return t;
    };
    ligne('MORT OU VIF', 14, {}, 0);
    ligne(avis.nom.toUpperCase(), avis.nom.length > 14 ? 11 : 13, {}, 0);
    // la prime, en gros chiffres
    const prime = avis.prime.toLocaleString('fr-FR').replace(/ | /g, ' ');
    ligne(`${prime} p.`, 24, {}, 1);
    ligne(avis.crime, 9, { fontStyle: 'italic', couleur: '#5a3a1c', lineSpacing: 0 });
    // (v0.86) un bandit arrêté grâce à toi : le tampon rouge de la garde
    if ((this.G.captures || []).includes(avis.nom)) a.add(this.add.text(0, py, 'CAPTURÉ', style(26, '#b02018', { fontStyle: 'bold', stroke: '#f3e6c8', strokeThickness: 3 })).setOrigin(0.5).setAngle(-18).setAlpha(0.88));
    if (avis.nouveau) a.add(this.add.text(l / 2 - 8, haut + 12, 'NOUVEAU', style(9, '#fff4dc', { fontStyle: 'bold', backgroundColor: '#a02a20', padding: { x: 4, y: 1 } })).setOrigin(1, 0.5).setAngle(8));
    a.bringToTop(a.zone);
    return a;
  }

  // La gazette du jour : ce que le crieur annonce, imprimé
  afficheGazette(x, y, angle) {
    const G = this.G, l = 236, h = 240;
    const a = this.feuilleAffiche(x, y, l, h, angle, 0xeee2c0);
    const encre = '#2a1a10';
    a.add(this.add.text(0, -h / 2 + 24, 'LA GAZETTE', style(19, encre, { fontStyle: 'bold' })).setOrigin(0.5));
    a.add(this.add.text(0, -h / 2 + 42, `des Mastres · jour ${G.jour}`, style(10, '#5a3a1c', { fontStyle: 'italic' })).setOrigin(0.5));
    a.add(this.add.rectangle(0, -h / 2 + 54, l - 30, 2, 0x2a1a10));
    // (le papier du marché noir glissé sous ta porte, lui, ne s'affiche pas sur la place !)
    const publiques = G.gazette && G.gazette.jour === G.jour ? G.gazette.lignes.filter(l => !l.startsWith('Un papier glissé')) : [];
    const lignes = publiques.length ? publiques : ["Rien de neuf aujourd'hui. Même le crieur bâille."];
    let yy = -h / 2 + 62;
    for (const ligne of lignes) {
      const t = this.add.text(-l / 2 + 16, yy, '• ' + ligne, style(10, encre, { wordWrap: { width: l - 32 }, lineSpacing: 1 }));
      if (yy + t.height > h / 2 - 12) { t.destroy(); a.add(this.add.text(0, h / 2 - 16, '(la suite chez le crieur)', style(9, '#5a3a1c', { fontStyle: 'italic' })).setOrigin(0.5)); break; }
      a.add(t); yy += t.height + 5;
    }
    a.bringToTop(a.zone);
    return a;
  }

  // Les annonces du Conseil : les événements en cours et ceux qu'on sait venir
  afficheEvenements(x, y, angle) {
    const G = this.G, l = 236, h = 116;
    const a = this.feuilleAffiche(x, y, l, h, angle, 0xe0d4b0);
    const encre = '#2a1a10';
    a.add(this.add.circle(-l / 2 + 22, -h / 2 + 22, 11, 0xa02a20).setStrokeStyle(2, 0x5a0e08));   // le sceau
    a.add(this.add.text(-l / 2 + 22, -h / 2 + 22, 'C', style(11, '#f3d98a', { fontStyle: 'bold' })).setOrigin(0.5));
    a.add(this.add.text(10, -h / 2 + 20, 'AVIS À LA POPULATION', style(12, encre, { fontStyle: 'bold' })).setOrigin(0.5));
    const lignes = [];
    for (const e of (G.evenements || [])) {
      const d = EVENEMENTS[e.id]; if (!d) continue;
      if (e.debut <= G.jour) lignes.push(`En ce moment (encore ${e.fin - G.jour + 1} j) : ${d.nouvelle}`);
      else lignes.push(`Dans ${e.debut - G.jour} j : ${d.nouvelle}`);
    }
    if (!lignes.length) lignes.push('Rien à signaler. Le Conseil veille sur la Comté.');
    let yy = -h / 2 + 36;
    for (const texte of lignes) {
      const t = this.add.text(-l / 2 + 14, yy, '• ' + texte, style(9, encre, { wordWrap: { width: l - 28 }, lineSpacing: 0 }));
      if (yy + t.height > h / 2 - 6) { t.destroy(); break; }
      a.add(t); yy += t.height + 3;
    }
    a.bringToTop(a.zone);
    return a;
  }

  // --- Le coin des jeux : les dés et le bonneteau ---

  ouvrirJeux() {
    const G = this.G;
    if (!lieuOuvert(G, 'jeux')) return this.message(`${NOMS_LIEUX_MARCHE.jeux} ouvre le jour ${OUVERTURE_LIEUX.jeux}.`);
    this.montrer('jeux');
    const c = this.panneau('Le coin des jeux', 'Tenu par Fil-de-Fer, cousin du vieux Grippesou');
    c.add(this.add.rectangle(480, 395, 2, 120, 0x8a6a3a));
    // Les dés
    c.add(this.add.text(40, 340, `Les dés · le plus gros total gagne (${pluriel(partiesRestantes(G, 'des'), 'partie restante', 'parties restantes')})`, style(13, '#3b2410', { fontStyle: 'bold' })));
    c.add(this.add.text(40, 362, 'Toi', style(12, '#6b4a2a')));
    c.add(this.add.text(250, 362, 'Fil-de-Fer', style(12, '#6b4a2a')));
    this.desToi = [this.creerDe(c, 70, 400), this.creerDe(c, 120, 400)];
    this.desLui = [this.creerDe(c, 280, 400), this.creerDe(c, 330, 400)];
    MISES.forEach((m, i) => this.bouton(c, 400, 365 + i * 30, 80, `Miser ${m}`, () => this.lancerDes(m)));
    // Le bonneteau
    c.add(this.add.text(500, 340, `Le bonneteau · trouve la pièce, gagne le double (${pluriel(partiesRestantes(G, 'bonneteau'), 'restante', 'restantes')})`, style(13, '#3b2410', { fontStyle: 'bold' })));
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
    if (!r) return this.message(partiesRestantes(G, 'des') <= 0 ? "Plus de parties aujourd'hui. Reviens demain !" : manqueArgent(G, mise, "Pas assez d'argent pour cette mise."), '#a03030');
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
      return this.message(partiesRestantes(G, 'bonneteau') <= 0 ? "Plus de parties aujourd'hui. Reviens demain !" : manqueArgent(G, mise, "Pas assez d'argent pour cette mise."), '#a03030');
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
    // (v0.60) Fil-de-Fer est un vrai bonneteur : dès la 2e partie, il lui arrive d'escamoter la
    // pièce au dernier moment (moins souvent avec le trèfle du mendiant). Suivre le gobelet ne suffit plus.
    const triche = g === this.gagnant && (this.G.jeux.bonneteau || 0) >= 2 && Math.random() < (aDecoration(this.G, 'trefle') ? 0.15 : 0.35);
    if (triche) this.gagnant = Phaser.Utils.Array.GetRandom(this.gobelets.filter(x => x !== g));
    this.piece.setPosition(this.gagnant.x, 428).setVisible(true);
    await Promise.all(this.gobelets.map(x => this.animer({ targets: x, y: 385, duration: 250 })));
    if (g === this.gagnant) {
      gagnerAuBonneteau(this.G, this.mise);
      this.message(`Trouvé ! Tu gagnes ${this.mise * 2} pièces.`, '#2f6a2a');
    } else {
      this.message(triche ? `Raté ?! Tu l'avais pourtant bien suivie... « Hé hé, la main est plus rapide que l'œil ! »` : `Raté ! « Hé hé, l'œil est plus lent que la main... »`, '#a03030');
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
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Rue', { depuis: 'marche' }));   // (v0.65 : on rentre à pied, par la rue)
  }

  ouvrir() {
    if (this._transition && performance.now() - this._transition < 1500) return;
    // On sauvegarde avant que la file d'attente du jour se forme.
    Sauvegarde.maintenant(this.G, 'Marche');
    commencerJournee(this);
  }
}
