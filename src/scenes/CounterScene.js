// Le comptoir : les voyageurs se présentent à la fenêtre,
// le joueur leur prépare un colis avec son stock.
// Les aventuriers de retour (ou le colporteur qui rapporte leur carnet)
// font la queue comme tout le monde.

const FENETRE = { x: 300, y: 20, w: 360, h: 230 };
const SOL_COMPTOIR = FENETRE.y + FENETRE.h - 10;
// La file d'attente : le premier attend juste à gauche du comptoir,
// les suivants s'alignent derrière lui, plus petits car plus loin.
// Le client au comptoir, en buste, à la taille de la fenêtre.
const BUSTE = { echelle: 2.3 };
// Les petits peuples apparaissent plus bas dans la fenêtre ; les grands, un peu plus gros
// (plus proches), dépassent davantage vers le haut.
const TAILLE_BUSTE = { hobbit: { bas: 34 }, nain: { bas: 24 }, elfe: { echelle: 1.05 }, magicienne: { echelle: 1.09 },
  gobelin: { bas: 44 }, momie: { bas: 10 }, vampire: {}, orc: { echelle: 1.04 }, loupgarou: { echelle: 1.08 }, panda: { echelle: 1.1 }, troll: { echelle: 1.12 } };
const tailleBuste = personne => ({ bas: 0, echelle: 1, ...((personne && TAILLE_BUSTE[personne.race]) || {}) });
const FILE = { x: FENETRE.x + 110, ecart: 55, y: SOL_COMPTOIR - 14, echelle: 5 };

class CounterScene extends Phaser.Scene {
  constructor() { super('Comptoir'); }

  create() {
    exclureScenes(this, 'Nuit', 'Dodo');   // (v0.62)
    this.G = window.GAME;
    // (v1.05, planche 25 B) le matin où le chat est parti : un petit mot sur le comptoir, signé d'une patte
    // (v1.10) le 1er du mois, la lettre du percepteur du Conseil (avant le mot du chat, s'il y en a un)
    // (v1.11 : puis la lettre du notaire, le matin où la boutique d'à côté est à vendre)
    const motChat = typeof motDuChatDu === 'function' && motDuChatDu(this.G), suites = [];
    if (typeof lettreImpotDuJour === 'function' && lettreImpotDuJour(this.G)) suites.push(cb => this.montrerLettreImpot(cb));
    if (typeof lettreNotaireDuJour === 'function' && lettreNotaireDuJour(this.G)) suites.push(cb => lettreDuNotaire(this, cb));
    if (typeof lettreDucDuJour === 'function' && lettreDucDuJour(this.G)) suites.push(cb => lettreDuDuc(this, cb));   // (v1.57) la lettre du duc : Pont-Royal t'attend
    if (motChat) suites.push(cb => { montrerMotDuChat(this); cb(); });
    const lancer = i => { if (i < suites.length && this.scene.isActive()) suites[i](() => lancer(i + 1)); };
    if (suites.length) this.time.delayedCall(900, () => lancer(0));
    this.entree = null;   // ce qui est au comptoir : client, retour ou carnet
    this.voyageur = null; // le client à servir, s'il y en a un
    this.enService = false;
    this.colis = {};
    this.pieges = {};
    // (Phaser réutilise la même scène d'un jour à l'autre : on repart de zéro)
    this.enConfirmation = false;
    this.action = this.actionB = null;
    this.minuterieCligne = null;
    this.paroles = null;
    this.enTrainDeParler = false;
    this.aura = this.flottement = this.carnetPose = null;
    this.buste = null;
    // (v0.97) les panneaux de la veille (ou d'avant un chargement) n'existent plus
    this.resumeRetours = this.ratelier = this.panneauCadeaux = this.panneauSecret = this.infoRelique = this.afficheEpinglee = null;
    this.piecesEnVol = 0; this.argentVise = undefined;   // (v1.61) un vol de pièces interrompu (pause, volets) ne fige plus la bourse
    this.panneauRoyal = this.feuilleConseil = this.minuterieGeste = this.tweenGeste = this.pastilleRoyale = null; this.lettreOuverte = false;   // (v1.10)
    this.coursierEnRoute = false; this.fenetreCoursier = null;   // (v1.12)
    this.chatSoleil = null; this.storeEnAttente = false; this.decorMatin = null; this.objetsFenetre = null;   // (v1.63, planche 81 v2)

    this.dessinerPiece();
    this.creerFenetre();
    this.creerPanneauGauche();
    this.boutonCarte = boutonCarteMonde(this, 74, 440, { compact: true, libelle: 'Carte' });   // (v0.93) la carte du monde, à portée de main
    this.creerCommande();
    this.creerDialogue();
    this.creerStock();
    this.creerZones();
    this.creerPierresDesPanneaux();
    this.creerArgent();
    this.creerHorloge();
    if (this.majCommandeRoyale) this.majCommandeRoyale();   // (v1.10) la commande scellée, punaisée sur l'ardoise

    // (v1.12) avec l'orphelinat, Grippesou partage sa ligne avec le coursier
    const coursier = typeof orphelinatOuvert === 'function' && orphelinatOuvert(this.G);
    this.boutonExpress = creerBouton(this, coursier ? 784 : 840, 368, coursier ? 100 : 210, coursier ? 'Grippesou' : 'Marchand express', () => this.ouvrirExpress());
    this.boutonCoursier = null;
    if (coursier && this.creerCoursier) this.creerCoursier();
    this.boutonAttente = creerBouton(this, 840, 404, 210, 'Mettre en attente', () => this.mettreEnAttente());
    this.boutonRefuser = creerBouton(this, 840, 448, 210, 'Refuser ce client', () => (this.actionB ? this.actionB() : this.refuser()));
    // (v1.42, planche 68) pendant le service, « En attente » et « Refuser » en petit côte à côte ;
    // les grands boutons gardent les choix des visites (B au milieu)
    this.petitAttente = creerBouton(this, 790, 426, 110, 'En attente', () => this.mettreEnAttente());
    this.petitRefuser = creerBouton(this, 896, 426, 96, 'Refuser', () => this.refuser());
    for (const b of [this.petitAttente, this.petitRefuser]) { b.label.setFontSize(14); b.setVisible(false); }
    // le bouton de l'action principale luit doucement (la seule chose à faire pour avancer)
    this.boutonAction = creerBouton(this, 840, 496, 210, '', () => this.action && this.action());
    this.boutonAction.setTexte('');   // (pas de plaque vide tant qu'il n'y a rien à faire)
    this.lueurAction = lueurBouton(this, this.boutonAction, 210).setVisible(false);
    this.events.on('update', () => {
      const f = this.boutonAction.fond, luit = f.visible && !f.vide && !!this.action && this.boutonAction.label.text !== '...';
      this.lueurAction.setVisible(luit);
      this.boutonAction.label.setColor(luit ? '#ffe9a0' : '#fff0d0');
    });
    // (v0.86) le petit sablier sur le coin d'un bouton : le temps que prend l'action
    const sablier = (b, y) => this.add.text(944, y - 17, '', style(11, '#fff4dc', { fontStyle: 'bold', backgroundColor: '#1e130a', padding: { x: 4, y: 1 }, brut: true })).setOrigin(1, 0.5).setDepth(5).setVisible(false);
    this.sablierExpress = sablier(this.boutonExpress, 368).setText(`⌛ ${formatDuree(JOURNEE.express)}`);
    if (coursier) this.sablierExpress.setX(832);
    this.sablierAction = sablier(this.boutonAction, 496);
    this.dureeAction = null;
    // (v0.86, lot A-3) inspecter le client : une petite plaque sur le coin de la fenêtre
    this.plaqueInspecter = this.add.text(FENETRE.x + 10, FENETRE.y + FENETRE.h - 28, '🔍 Inspecter', style(13, '#fff4dc', { fontStyle: 'bold', backgroundColor: '#3b2410', padding: { x: 8, y: 4 } }))
      .setDepth(4).setVisible(false).setInteractive({ useHandCursor: true });
    this.plaqueInspecter.on('pointerover', () => this.plaqueInspecter.setColor('#ffe066'));
    this.plaqueInspecter.on('pointerout', () => this.plaqueInspecter.setColor('#fff4dc'));
    this.plaqueInspecter.on('pointerdown', () => this.choixInspection());
    // (v0.86, lot A-4) marchander sa part du butin
    this.plaqueMarchander = this.add.text(FENETRE.x + 134, FENETRE.y + FENETRE.h - 28, 'Marchander', style(13, '#fff4dc', { fontStyle: 'bold', backgroundColor: '#3b2410', padding: { x: 8, y: 4 } }))
      .setDepth(4).setVisible(false).setInteractive({ useHandCursor: true });
    this.plaqueMarchander.on('pointerover', () => this.plaqueMarchander.setColor('#ffe066'));
    this.plaqueMarchander.on('pointerout', () => this.plaqueMarchander.setColor('#fff4dc'));
    this.plaqueMarchander.on('pointerdown', () => this.marchander());
    // (v1.19, planche 47) miser sur un aventurier qu'on connaît
    this.plaqueMiser = this.add.text(FENETRE.x + 240, FENETRE.y + FENETRE.h - 28, 'Miser', style(13, '#ffe066', { fontStyle: 'bold', backgroundColor: '#5a3a08', padding: { x: 8, y: 4 } }))
      .setDepth(4).setVisible(false).setInteractive({ useHandCursor: true });
    this.plaqueMiser.on('pointerover', () => this.plaqueMiser.setColor('#fff4dc'));
    this.plaqueMiser.on('pointerout', () => this.plaqueMiser.setColor('#ffe066'));
    this.plaqueMiser.on('pointerdown', () => this.ouvrirMise());
    this.majBoutonsService();

    // Au retour de chez Grippesou, on remet l'affichage à jour.
    this.events.off('resume', this.auRetourExpress, this);
    this.events.on('resume', this.auRetourExpress, this);

    this.cameras.main.fadeIn(400);
    this.creerStore();
    if (typeof comptoirBeni === 'function' && comptoirBeni(this.G)) this.lumiereBenie();   // (v1.00 : la bénédiction de Frère Anselme)
    if (this.G.comptoirOuvert !== this.G.jour) {
      // 10 h : on lève le store, le comptoir est officiellement ouvert.
      this.G.comptoirOuvert = this.G.jour;
      this.G.heure = this.heureAffichee = heureOuverture(this.G);
      this.majHorloge();
      this.raconter(`${heureQuiSonne(this.G.heure)} au clocher. Clique sur le store pour l'ouvrir et commencer la journée !`);
      this.attendreStore();
    } else {
      this.store.setVisible(false);
      this.montrerCommande(true);
      this.voyageurSuivant();
    }
    if (this.G.banniere !== this.G.jour) this.afficherBanniere();
  }

  // Le premier jour (tutoriel) : les deux premiers clients peuvent être servis entièrement ;
  // pour le dernier, il manque quelque chose en réserve — l'occasion d'apprendre qu'on peut
  // renvoyer un client qu'on ne peut pas bien équiper (contre un peu de réputation).
  preparerTutoriel(v) {
    const G = this.G;
    if (G.jour > 1 || !G.tuto || !v.queteId) return;
    const commande = commandeDe(v);
    const ids = Object.keys(commande);
    if (!ids.length) return;
    const dernier = G.jour === 1 && G.file.filter(e => e.type === 'client').length === 0;   // (v1.40 : le Jour Zéro, tout y est)
    if (!dernier) {
      for (const id of ids) G.stock[id] = Math.max(G.stock[id] || 0, commande[id]);
    } else {
      const manque = ids[0];
      G.stock[manque] = Math.max(0, commande[manque] - 1);
      for (const id of ids.slice(1)) G.stock[id] = Math.max(G.stock[id] || 0, commande[id]);
      this.time.delayedCall(1200, () => conseilGarrick(this, 'refus'));
    }
    this.majStock();
  }

  // (v1.00) Le comptoir béni par le paladin du Solstice : une lumière dorée tombe sur la fenêtre, et de
  // petites étincelles montent du comptoir, le temps de la bénédiction
  lumiereBenie() {
    creerHalo(this);
    const { x, y, w, h } = FENETRE;
    // des rayons dorés qui tombent en biais sur la fenêtre
    const rayons = this.add.graphics().setDepth(4.6).setBlendMode(Phaser.BlendModes.ADD);
    for (const [x0, l] of [[x + 40, 60], [x + 150, 46], [x + 250, 70]]) rayons.fillStyle(0xffe08a, 0.22).fillTriangle(x0, y, x0 + l, y, x0 + l * 0.6 + 70, y + h).fillTriangle(x0, y, x0 + l * 0.6 + 70, y + h, x0 + 50, y + h);
    this.tweens.add({ targets: rayons, alpha: 0.45, duration: 2400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const halo = this.add.image(x + w / 2, y + h * 0.4, 'halo').setScale(w / 90, h / 120).setTint(0xffd060).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD).setDepth(4.6);
    this.tweens.add({ targets: halo, alpha: 0.18, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    // un liseré d'or autour de la fenêtre
    const cadre = this.add.graphics().setDepth(4.65).setBlendMode(Phaser.BlendModes.ADD);
    cadre.lineStyle(4, 0xffd060, 0.5).strokeRect(x - 2, y - 2, w + 4, h + 4);
    this.tweens.add({ targets: cadre, alpha: 0.3, duration: 1600, yoyo: true, repeat: -1 });
    // et des étincelles qui montent
    this.time.addEvent({ delay: 220, loop: true, callback: () => {
      const t = Phaser.Math.Between(2, 3);
      const e = this.add.rectangle(x + Phaser.Math.Between(10, w - 10), y + h - 6, t, t, Phaser.Math.RND.pick([0xfff0a0, 0xffe066, 0xffffff])).setDepth(4.7).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: e, y: e.y - Phaser.Math.Between(60, 150), x: e.x + Phaser.Math.Between(-14, 14), alpha: 0, duration: 2400, onComplete: () => e.destroy() });
    } });
  }

  // (v1.63, planche 81 v2) Le store à lames qui ferme la fenêtre : le jour passe par cinq fentes, coupées par
  // l'ombre de ceux qui attendent dehors ; l'écriteau FERMÉ pend à sa chaîne et se balance ; un cadenas tient la barre.
  creerStore() {
    const { x, y, w, h } = FENETRE, st = this.styleDecor;
    const panneau = this.add.image(0, 0, storeStyle(this, st)).setOrigin(0.5, 1).setScale(2);
    const haut = -panneau.displayHeight;
    this.lueursStore = this.add.graphics();
    this.ombresFile = []; this.decalOmbres = [];
    // l'écriteau, pendu à un clou par sa chaîne : il pivote autour du clou
    const pendu = this.add.container(0, haut + 58);
    const chaine = this.add.graphics();
    chaine.lineStyle(2, 0x2a2420, 1).lineBetween(0, 0, -38, 26).lineBetween(0, 0, 38, 26);
    chaine.fillStyle(0x9aa2ae).fillCircle(0, 0, 2.5);
    for (let k = 1; k < 6; k++) chaine.fillStyle(0x50545e).fillCircle(-38 * k / 6, 26 * k / 6, 1.2).fillCircle(38 * k / 6, 26 * k / 6, 1.2);
    const plaque = this.add.image(0, 44, ecriteauStyle(this, st, false)).setScale(2);
    const mot = this.add.text(0, 44, 'FERMÉ', style(19, '#f8e8c0', { fontStyle: 'bold', stroke: '#3a0e08', strokeThickness: 3, brut: true })).setOrigin(0.5);
    pendu.add([chaine, plaque, mot]);
    cadenasHD(this);
    this.cadenas = this.add.image(0, -5, 'cadenas_0').setOrigin(0.5, 0).setScale(2);
    this.store = this.add.container(x + w / 2, y + h + 6, [panneau, this.lueursStore, pendu, this.cadenas]).setDepth(2.65);   // (v1.61 : devant la pluie et les feuilles du vent)
    this.store.setMask(this.masqueFenetre);
    this.storeHaut = haut;
    this.pancarte = mot; this.ecriteau = { pendu, plaque, mot };
    this.balancerEcriteau(2.5);
    this.dessinerLueursStore();
    // de temps en temps, quelqu'un dehors se dandine : son ombre bouge d'un cran (image par image)
    this.time.addEvent({ delay: 900, loop: true, callback: () => { if (this.store.visible && this.store.y > FENETRE.y + 100 && Math.random() < 0.5) this.dessinerLueursStore(true); } });
  }

  // L'écriteau se balance doucement sur son clou (plus fort quand le store bouge)
  balancerEcriteau(amplitude) {
    const p = this.ecriteau.pendu;
    this.tweens.killTweensOf(p);
    p.setAngle(amplitude);
    this.tweens.add({ targets: p, angle: -amplitude, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  // Les fentes du store : la lumière du dehors, coupée là où quelqu'un attend devant la fenêtre
  dessinerLueursStore(bouger = false) {
    const g = this.lueursStore, { x, w } = FENETRE, cx = x + w / 2;
    if (!g) return;
    g.clear();
    const h = heureDuComptoir(this.G), f = heureFermeture(this.G);
    const jour = Phaser.Math.Clamp(1 - (h - (f - 1.5)) / 2.5, 0.15, 1);   // (le soir, les fentes s'assombrissent)
    const coul = h >= f - 1 ? 0xffb070 : ['floral', 'lumiere'].includes(this.styleDecor) ? 0xffcc58 : 0xfff0b8;
    // les ombres : ceux de la file, tels qu'ils se tiennent derrière le store (l'un d'eux se dandine parfois d'un cran)
    const gens = (this.fileSprites || []).filter(sp => sp.active && !sp.estPigeon);
    this.decalOmbres = this.decalOmbres || [];
    if (bouger && gens.length) { const i = Phaser.Math.Between(0, gens.length - 1); this.decalOmbres[i] = Phaser.Math.Clamp((this.decalOmbres[i] || 0) + Phaser.Math.RND.pick([-2, 2]), -4, 4); }
    this.ombresFile = gens.map((sp, i) => ({ x: sp.x - cx + (this.decalOmbres[i] || 0), bas: sp.y, hauteur: sp.displayHeight * 0.92, large: Math.min(36, sp.displayWidth * 0.5) }));
    for (const fy of FENTES_STORE) {
      const yEcran = this.storeHaut + fy * 2, yMonde = (this.store ? this.store.y : FENETRE.y + FENETRE.h + 6) + yEcran;
      // les morceaux coupés par une ombre : la tête, étroite ; le corps ; les deux jambes
      const coupes = [];
      for (const o of this.ombresFile) {
        const r = (o.bas - yMonde) / o.hauteur;
        if (r < 0 || r > 1) continue;
        if (r > 0.82) coupes.push([o.x - o.large * 0.3, o.x + o.large * 0.3]);
        else if (r > 0.3) coupes.push([o.x - o.large / 2, o.x + o.large / 2]);
        else { coupes.push([o.x - o.large * 0.42, o.x - o.large * 0.08]); coupes.push([o.x + o.large * 0.08, o.x + o.large * 0.42]); }
      }
      coupes.sort((a, b) => a[0] - b[0]);
      let x0 = -w / 2;
      const trait = (a, b) => { if (b - a < 1) return; g.fillStyle(coul, jour).fillRect(a, yEcran, b - a, 2); g.fillStyle(coul, 0.35 * jour).fillRect(a, yEcran - 1, b - a, 1).fillRect(a, yEcran + 2, b - a, 2); };
      for (const [a, b] of coupes) {
        trait(x0, a - 3); if (a - 3 > x0) g.fillStyle(coul, 0.4 * jour).fillRect(a - 3, yEcran, 3, 2);   // (le bord de l'ombre, flou)
        if (b + 3 > x0) g.fillStyle(coul, 0.4 * jour).fillRect(Math.max(x0, b), yEcran, 3, 2);
        x0 = Math.max(x0, b + 3);
      }
      trait(x0, w / 2);
    }
  }

  // Le store attend qu'on clique dessus : une main invite à tirer.
  attendreStore() {
    const { x, y, w, h } = FENETRE;
    this.store.setVisible(true).setY(y + h + 6);
    this.cadenas.setTexture('cadenas_0').setVisible(true);
    this.pancarte.setText('FERMÉ'); this.ecriteau.plaque.setTexture(ecriteauStyle(this, this.styleDecor, false));
    this.montrerCommande(false);
    this.poserChatAuSoleil();
    const zone = this.add.rectangle(x + w / 2, y + h / 2, w, h, 0xffffff, 0).setDepth(2.6).setInteractive({ useHandCursor: true });
    const invite = this.add.text(x + w / 2, y + h - 52, '▲ Ouvrir le store ▲', style(18, '#ffe9a0', { fontStyle: 'bold', stroke: '#2a1a10', strokeThickness: 5 }))
      .setOrigin(0.5).setDepth(2.7);
    this.tweens.add({ targets: invite, y: invite.y - 8, alpha: 0.6, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.storeEnAttente = true;
    zone.once('pointerdown', () => {
      this.storeEnAttente = false;
      zone.destroy(); invite.destroy();
      this.leverStore(() => this.voyageurSuivant());
    });
  }

  leverStore(suite) {
    const { y, h } = FENETRE, E = this.ecriteau;
    this.store.setVisible(true).setY(y + h + 6);
    // le cadenas s'ouvre ; l'écriteau se retourne sur sa chaîne : OUVERT
    this.cadenas.setTexture('cadenas_1'); Son.jouer('clic');
    this.tweens.add({ targets: [E.plaque, E.mot], scaleX: 0, duration: 140, ease: 'Quad.easeIn', onComplete: () => {
      E.plaque.setTexture(ecriteauStyle(this, this.styleDecor, true)); E.mot.setText('OUVERT');
      this.tweens.add({ targets: E.plaque, scaleX: 2, duration: 160, ease: 'Quad.easeOut' });
      this.tweens.add({ targets: E.mot, scaleX: 1, duration: 160, ease: 'Quad.easeOut' });
    } });
    this.reveillerChat();
    this.sonnerClochette();
    this.montrerCommande(true, true);
    this.time.delayedCall(560, () => {
      this.cameras.main.shake(120, 0.003);
      this.balancerEcriteau(9);
      this.tweens.add({ targets: this.store, y: y - 10, duration: 1300, ease: 'Quad.easeIn', onComplete: () => { this.store.setVisible(false); if (suite) suite(); } });
      this.tweens.add({ targets: this.store, x: this.store.x + 2, duration: 60, yoyo: true, repeat: 10 });
    });
  }

  baisserStore(suite) {
    const { y, h } = FENETRE, E = this.ecriteau;
    this.pancarte.setText('FERMÉ'); E.plaque.setTexture(ecriteauStyle(this, this.styleDecor, false));
    this.cadenas.setTexture('cadenas_1');
    this.dessinerLueursStore();
    this.store.setVisible(true).setY(y - 10);
    this.balancerEcriteau(7);
    this.tweens.add({ targets: this.store, y: y + h + 6, duration: 900, ease: 'Bounce.easeOut', onComplete: () => {
      this.balancerEcriteau(2.5); this.cadenas.setTexture('cadenas_0'); Son.jouer('clic');
      this.time.delayedCall(500, suite);
    } });
  }

  // La clochette du comptoir tinte : elle oscille sur sa potence
  sonnerClochette() {
    const c = this.objetsFenetre && this.objetsFenetre.clochette;
    if (!c || this.tweens.isTweening(c)) return;
    Son.jouer('clochette');
    c.setAngle(0);
    this.tweens.add({ targets: c, angle: { from: 16, to: -16 }, duration: 150, yoyo: true, repeat: 2, ease: 'Sine.easeInOut', onComplete: () =>
      this.tweens.add({ targets: c, angle: { from: 6, to: -6 }, duration: 180, yoyo: true, repeat: 1, onComplete: () => c.setAngle(0) }) });
  }

  // (v1.63) Le chat au soleil : s'il est adopté (et qu'il n'est ni parti ni fâché), il dort en boule sur l'appui,
  // dans la lumière des fentes ; il respire. Quand le store se lève, il s'éveille, s'assied et saute de l'appui.
  poserChatAuSoleil() {
    const G = this.G;
    if (this.chatSoleil) { this.chatSoleil.destroy(); this.chatSoleil = null; }
    if (!(typeof chatAdopte === 'function' && chatAdopte(G)) || (typeof chatParti === 'function' && chatParti(G)) || (typeof chatBoude === 'function' && chatBoude(G))) return;
    const k = creerChatHD(this, lookChat(G)), { x, y, h } = FENETRE;
    creerHalo(this);
    const soleil = this.add.image(x + 58, y + h - 16, 'halo').setScale(0.9, 0.42).setTint(0xffd890).setAlpha(0.3).setBlendMode(Phaser.BlendModes.ADD).setDepth(2.88);
    const chat = this.add.image(x + 58, y + h, k + '_dort0').setOrigin(0.5, 1).setScale(2.4).setDepth(2.9);
    this.chatSoleil = this.add.container(0, 0, [soleil, chat]).setDepth(2.9);
    this.chatSoleil.chat = chat; this.chatSoleil.cle = k;
    // il respire, image par image
    this.chatSoleil.souffle = this.time.addEvent({ delay: 950, loop: true, callback: () => { if (chat.active && chat.texture.key.includes('_dort')) chat.setTexture(k + (chat.texture.key.endsWith('0') ? '_dort1' : '_dort0')); } });
    chat.setInteractive({ useHandCursor: true }).on('pointerdown', () => { if (!this.storeEnAttente) return; Son.jouer('miaou'); this.raconter(`${nomChatMaj(G)} dort au soleil, sur l'appui de la fenêtre. Il entrouvre un œil… et se rendort.`, nomChatMaj(G)); });
  }

  reveillerChat() {
    const C = this.chatSoleil;
    if (!C) return;
    const chat = C.chat, k = C.cle, { x, y, h } = FENETRE;
    C.souffle.remove();
    chat.disableInteractive();
    // il s'éveille, s'assied, la queue bat deux fois…
    chat.setTexture(k + '_assis0');
    this.time.delayedCall(260, () => chat.active && chat.setTexture(k + '_assis1'));
    this.time.delayedCall(520, () => chat.active && chat.setTexture(k + '_assis0'));
    // … se tapit, et saute de l'appui (vers la gauche, dans la pièce)
    this.time.delayedCall(800, () => { if (!chat.active) return; chat.setTexture(k + '_tapi').setFlipX(true); });
    this.time.delayedCall(1050, () => {
      if (!chat.active) return;
      chat.setTexture(k + '_bond');
      const forme = this.make.graphics({ add: false }); forme.fillStyle(0xffffff).fillRect(0, 0, 960, y + h + 4);
      chat.setMask(forme.createGeometryMask());
      this.tweens.add({ targets: chat, x: x - 10, duration: 520, ease: 'Linear' });
      this.tweens.add({ targets: chat, y: y + h - 26, duration: 200, ease: 'Quad.easeOut', onComplete: () =>
        this.tweens.add({ targets: chat, y: y + h + 80, duration: 320, ease: 'Quad.easeIn', onComplete: () => { if (this.chatSoleil === C) { C.destroy(); this.chatSoleil = null; } } }) });
      this.tweens.add({ targets: C.list[0], alpha: 0, duration: 400 });
    });
  }

  // « Jour 3 » en grand au réveil.
  afficherBanniere() {
    this.G.banniere = this.G.jour;
    const fond = this.add.rectangle(480, 270, 960, 540, 0x0b0a1a, 0.85).setDepth(10);
    const texte = this.add.text(480, 270, 'Jour ' + this.G.jour, style(56, '#f3d98a', { fontStyle: 'bold' }))
      .setOrigin(0.5).setDepth(10);
    this.tweens.add({ targets: [fond, texte], alpha: 0, delay: 900, duration: 700, onComplete: () => { fond.destroy(); texte.destroy(); } });
  }

  // Les boutons qui n'ont de sens que pendant qu'on sert un client.
  majBoutonsService() {
    const libre = !this.enConfirmation;
    if (this.plaqueInspecter) {
      const e = this.entree, v = this.voyageur;
      this.plaqueInspecter.setVisible(!!(v && e && e.type === 'client' && libre && (this.enService || this.actionB) && !e.inspecte && !v.recherche
        && this.G.jour >= IMPOSTURE.jourMin && !this.ficheInspection));
    }
    if (this.plaqueMarchander) {
      const v = this.voyageur;
      this.plaqueMarchander.setVisible(!!(v && this.enService && libre && v.queteId && !(v.marchandage && v.marchandage.fini)
        && this.G.jour >= MARCHANDAGE.jourMin && !this.ficheMarchandage && !this.ficheInspection));
      // (les deux plaques côte à côte, ou la seule visible dans le coin)
      this.plaqueMarchander.setX(this.plaqueInspecter && this.plaqueInspecter.visible ? FENETRE.x + 134 : FENETRE.x + 10);
    }
    if (this.plaqueMiser) {
      const v = this.voyageur;
      this.plaqueMiser.setVisible(!!(v && this.enService && libre && typeof peutMiser === 'function' && peutMiser(this.G, v)
        && !this.ficheMarchandage && !this.ficheInspection && !this.ficheMise));
      const avant = [this.plaqueInspecter, this.plaqueMarchander].filter(p => p && p.visible).pop();
      this.plaqueMiser.setX(avant ? avant.x + avant.width + 8 : FENETRE.x + 10);
    }
    this.boutonExpress.setVisible(this.enService && libre);
    if (this.sablierExpress) this.sablierExpress.setVisible(this.enService && libre);
    if (this.majCoursier) this.majCoursier(libre);   // (v1.12) le coursier de l'orphelinat
    // (v1.42) en service : les deux petits boutons ; pendant un choix : les grands (B au milieu)
    const petits = this.enService && !this.actionB;
    this.petitAttente.setVisible(petits && !!this.voyageur && libre);
    this.petitRefuser.setVisible(petits);
    this.boutonAttente.setVisible(!petits && !!this.voyageur && !!this.actionB && libre);
    this.boutonRefuser.setVisible(!!this.actionB);
  }

  // Deux choix pour une visite : le bouton du bas (A) et celui du milieu (B).
  // (v0.90) `campA` / `campB` : le côté vers lequel penche ce choix (un ☀ ou un ☾, avec assez de flair)
  choix([texteA, actionA, dureeA = null, campA = null], [texteB, actionB, campB = null]) {
    // (v1.10) une fois le choix fait, le bouton du milieu s'en va (il restait affiché, et un clic dessus refusait... personne)
    this.bouton(texteA, () => { this.actionB = null; this.majBoutonsService(); actionA(); }, dureeA, campA);
    this.actionB = () => { this.actionB = null; this.majBoutonsService(); actionB(); };
    this.boutonRefuser.setTexte(texteB);
    marquerCamp(this, this.boutonRefuser, campB);
    this.majBoutonsService();
  }

  // Le bouton du bureau change selon la situation.
  // `duree` : le temps que prendra l'action (un sablier sur le coin du bouton)
  bouton(texte, action, duree = null, camp = null) {
    this.boutonAction.setTexte(texte);
    marquerCamp(this, this.boutonAction, camp);
    this.boutonAction.setActif(!!action);
    this.action = action;
    this.dureeAction = action ? duree : null;
    if (this.sablierAction) this.sablierAction.setText(this.dureeAction ? `⌛ ${formatDuree(this.dureeAction)}` : '').setVisible(!!this.dureeAction);
  }

  // --- (v0.86, lot A-4) Le marchandage de sa part ---

  marchander() {
    const v = this.voyageur, G = this.G;
    if (!v || this.enConfirmation || !v.queteId) return;
    const m = ouvrirMarchandage(G, v);
    this.dire(texteMarchandage(v, 'offre', { p: m.part }), this.nomAvecRelation(v.nom));
    this.etapeMarchandage();
  }

  // La fiche (sa part, ce qu'elle rapportera, sa patience, ses tics) et les deux boutons
  etapeMarchandage(note = null) {
    const v = this.voyageur, G = this.G, m = ouvrirMarchandage(G, v);
    if (this.ficheMarchandage) this.ficheMarchandage.destroy();
    const c = this.ficheMarchandage = this.add.container(0, 0).setDepth(6);
    const x = 688, y = 22, L = 252, H = 226;
    c.add(this.add.image(x + L / 2, y + H / 2, panneauHD(this, L, H)).setScale(2));
    c.add(this.add.text(x + 14, y + 10, 'Marchandage', style(16, '#3b2410', { fontStyle: 'bold' })));
    c.add(this.add.text(x + 14, y + 31, `${v.nom} · ${(NOMS_RACES[v.race] || v.race).toLowerCase()}`, style(11, '#6a4a2a', { fontStyle: 'italic' })));
    const base = v.butinBase != null ? v.butinBase : v.butin;
    const rouge = m.patience <= 1;
    c.add(this.add.text(x + L / 2, y + 76, `${m.part} %`, style(38, rouge ? '#a02a20' : '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
    c.add(this.add.text(x + L / 2, y + 104, `de son butin pour toi (≈ ${Math.round(base * m.part / MARCHANDAGE.base)} p.)`, style(11, '#6a4a2a', { fontStyle: 'italic' })).setOrigin(0.5));
    c.add(this.add.text(x + 14, y + 122, 'Patience :', style(12, '#3b2410', { fontStyle: 'bold' })));
    const g = this.add.graphics();
    for (let k = 0; k < m.patienceMax; k++) {
      const cx = x + 104 + k * 20, cy = y + 130;
      g.fillStyle(0x3b2410).fillRoundedRect(cx - 8, cy - 6, 16, 12, 3);
      g.fillStyle(k < m.patience ? (m.patience <= 1 ? 0xd03028 : m.patience <= 2 ? 0xe08020 : 0x6aa040) : 0x8a7050).fillRoundedRect(cx - 6, cy - 4, 12, 8, 2);
    }
    c.add(g);
    const tic = ticVisible(G, v);
    const texteNote = note || (tic ? texteMarchandage(v, 'tic') : `Rien ne trahit ce qu'${v.feminin ? 'elle' : 'il'} pense.`);
    c.add(this.add.text(x + 14, y + 146, texteNote, style(11, tic ? '#7a3a10' : '#6a4a2a', { fontStyle: 'italic bold', wordWrap: { width: 224 } })));
    if (tic && !note) {
      creerGlyphesHD(this);
      const goutte = this.add.image(FENETRE.x + FENETRE.w / 2 + 52, FENETRE.y + 70, 'glyphe_larme').setScale(2).setDepth(5);
      this.tweens.add({ targets: goutte, y: goutte.y + 18, alpha: 0, delay: 600, duration: 900, onComplete: () => goutte.destroy() });
    }
    this.enConfirmation = true;
    const fin = () => { this.enConfirmation = false; };
    this.choix([`Demander ${m.part + MARCHANDAGE.pas} %`, () => { fin(); this.demanderPlusUI(); }, JOURNEE.marchander],
      [`Accepter ${m.part} %`, () => { fin(); this.accepterMarchandage(); }]);
    this.majBoutonsService();
  }

  demanderPlusUI() {
    const v = this.voyageur, G = this.G;
    this.avancer(JOURNEE.marchander, 'à marchander');
    const issue = demanderPlus(G, v), m = v.marchandage;
    if (issue === 'part') return this.departFache(texteMarchandage(v, 'part'));
    const ferme = issue === 'refuse' || issue === 'dernierMot';   // (v0.91 : à bout de patience, il s'en tient à son dernier mot)
    this.exprimer(ferme ? 'fache' : 'inquiet');
    this.dire(texteMarchandage(v, ferme ? 'refuse' : 'cede', { p: m.part }), this.nomAvecRelation(v.nom));
    if (m.fini) return this.accepterMarchandage(true);
    this.etapeMarchandage();
  }

  accepterMarchandage(deja = false) {
    const v = this.voyageur, G = this.G;
    if (!deja) conclureMarchandage(G, v);
    if (this.ficheMarchandage) { this.ficheMarchandage.destroy(); this.ficheMarchandage = null; }
    if (!deja) this.raconter(`Marché conclu : ${v.marchandage.part} % de son butin pour toi, à son retour (≈ ${v.butin} pièces).`, 'Marchandage');
    this.restaurerService();
    this.majCommande();
  }

  // --- (v1.19, lot C-3, planche 47) Les mises ---
  ouvrirMise(choisie = 1) {
    const v = this.voyageur, G = this.G;
    if (!v || this.enConfirmation || !peutMiser(G, v)) return;
    if (this.ficheMise) this.ficheMise.destroy();
    creerBoursesHD(this);
    const montants = montantsMise(v), m = montants[choisie];
    const c = this.ficheMise = this.add.container(0, 0).setDepth(6);
    const x = 688, y = 22, L = 252, H = 226;
    c.add(this.add.image(x + L / 2, y + H / 2, panneauHD(this, L, H)).setScale(2));
    c.add(this.add.text(x + 14, y + 10, `Miser sur ${prenomDe(v.nom)}`, style(16, '#5a0e0e', { fontStyle: 'bold' })));
    c.add(this.add.text(x + 14, y + 31, `${NIVEAUX_AVENTURIER[v.niveau].nom} · ${ZONES[v.zone] ? ZONES[v.zone].nom : ''}`, style(11, '#6a4a2a', { fontStyle: 'italic' })));
    montants.forEach((mt, i) => {
      const cx = x + L / 2 + (i - 1) * 80, cy = y + 84, choisi = i === choisie;
      const fond = this.add.rectangle(cx, cy, 72, 74, choisi ? 0xf8e8b8 : 0xf3e6c8).setStrokeStyle(choisi ? 3 : 1, choisi ? 0xc08a10 : 0x8a6a3a).setInteractive({ useHandCursor: true });
      fond.on('pointerdown', () => { Son.jouer('clic'); this.ouvrirMise(i); });
      c.add(fond); c.add(this.add.image(cx, cy - 10, 'bourseHD' + (2 + i)).setScale(1.5));
      c.add(this.add.text(cx, cy + 22, `${mt} p.`, style(14, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
    });
    const ligne = (yy, a, b, coul) => { c.add(this.add.text(x + 14, y + yy, a, style(12, coul, { fontStyle: 'bold' }))); c.add(this.add.text(x + L - 14, y + yy, b, style(12, coul, { fontStyle: 'bold' })).setOrigin(1, 0)); };
    ligne(130, 'Vainqueur', `× 1,6 → ${Math.round(m * MISE_AVENTURIER.vainqueur)} p.`, '#2f5a2a');
    ligne(148, 'Revenu sans rien', `la moitié → ${Math.round(m * MISE_AVENTURIER.sansRien)} p.`, '#8a5a10');
    ligne(166, 'Ne revient pas', 'perdue', '#a01818');
    c.add(this.add.text(x + L / 2, y + 196, 'Ta confiance l’encourage : +1 de relation, +3 % de chances.', style(11, '#3b2410', { fontStyle: 'italic', wordWrap: { width: 230 }, align: 'center' })).setOrigin(0.5));
    this.enConfirmation = true;
    const fin = () => { this.enConfirmation = false; if (this.ficheMise) { this.ficheMise.destroy(); this.ficheMise = null; } };
    this.choix([`Miser ${m} p.`, () => { fin(); this.miser(m); }], ['Pas cette fois', () => { fin(); this.restaurerService(); this.majCommande(); }]);
    this.majBoutonsService();
  }

  miser(montant) {
    const v = this.voyageur, G = this.G;
    const avant = v ? chanceDeRetour(v, this.colis) : 0;
    choisirMise(G, v, montant);
    const apres = chanceDeRetour(v, this.colis);
    this.raconter(`Tu mises ${montant} p. sur ${prenomDe(v.nom)} : la bourse lui sera remise au départ. En cas de victoire : ${Math.round(montant * MISE_AVENTURIER.vainqueur)} p.`, 'Ta mise');
    Son.jouer('pieces', { montant });
    gainEnDirect(this, 815, 186, `+${Math.max(1, Math.round((apres - avant) * 100))} % de chances`, true);
    this.restaurerService();
    this.majCommande();
  }

  // Trop insisté : il reprend ses affaires et s'en va (ce qu'il avait dans son baluchon revient en réserve).
  departFache(texte) {
    const v = this.voyageur, G = this.G;
    if (this.ficheMarchandage) { this.ficheMarchandage.destroy(); this.ficheMarchandage = null; }
    for (const [id, n] of Object.entries(this.colis)) { const p = this.pieges[id] || 0; G.stock[id] += n - p; if (p) G.pieges[id] += p; }
    this.colis = {}; this.pieges = {};
    Son.jouer('refus');
    this.enService = false; this.actionB = null;
    this.majBoutonsService(); this.bouton('...', null); this.majStock();
    this.exprimer('fache');
    this.dire(`${texte} (réputation −${String(REFUS_CLIENT).replace('.', ',')})`, v.nom);
    this.partirPar(FENETRE.x - 80);
  }

  // --- (v0.86, lot A-3) L'inspection ---

  // Revenir là où on en était avec ce client : il connaît sa destination (on le sert), ou pas encore.
  restaurerService() {
    const v = this.voyageur;
    if (!v) return;
    if (v.queteId) this.servir();
    else this.choix(['Choisir sa destination', () => this.ouvrirCarte()], ['Refuser ce client', () => this.refuser()]);
  }

  choixInspection() {
    if (!this.voyageur || this.enConfirmation) return;
    const v = this.voyageur;
    this.enConfirmation = true;
    const fin = () => { this.enConfirmation = false; };
    this.raconter(`Comment t'y prends-tu ? Observer discrètement prend un peu de temps ; fouiller son sac est plus sûr... mais un client honnête n'aimera pas ça.`, 'Inspecter');
    this.choix([`Fouiller son sac`, () => { fin(); this.inspecter(true); }], [`Observer · ⌛ ${formatDuree(JOURNEE.observer)}`, () => { fin(); this.inspecter(false); }]);
    this.majBoutonsService();
  }

  inspecter(fouille) {
    const v = this.voyageur, entree = this.entree, G = this.G;
    entree.inspecte = true;
    if (!fouille) this.avancer(JOURNEE.observer, 'à observer');
    const r = inspecterClient(G, v, fouille);
    if (r.demasque) return this.imposteurDemasque(fouille);
    this.afficherInspection(r);
    if (r.vexe != null) {
      this.exprimer('fache');
      this.dire(auHasard(FOUILLE_VEXE) + (r.vexe ? ' ' + r.vexe : ''), this.nomAvecRelation(v.nom));
    } else this.raconter(fouille ? 'Tu fouilles son sac.' : `Tu fais le tour du comptoir, l'air de rien, et tu regardes ${v.nom} de plus près.`, 'Inspection');
    this.restaurerService();
  }

  // La fiche d'inspection, posée sur le parchemin de la commande (un clic la referme).
  afficherInspection(r) {
    if (this.ficheInspection) this.ficheInspection.destroy();
    const c = this.ficheInspection = this.add.container(0, 0).setDepth(6);
    const x = 688, y = 22, L = 252, H = 226;
    const fond = this.add.image(x + L / 2, y + H / 2, panneauHD(this, L, H)).setScale(2).setInteractive({ useHandCursor: true });
    fond.on('pointerdown', () => { c.destroy(); this.ficheInspection = null; this.majBoutonsService(); });
    c.add(fond);
    c.add(this.add.text(x + 14, y + 10, 'Inspection', style(16, '#3b2410', { fontStyle: 'bold' })));
    c.add(this.add.text(x + L - 12, y + 13, '✕', style(13, '#6a4a2a', { fontStyle: 'bold' })).setOrigin(1, 0));
    c.add(this.add.text(x + 14, y + 31, `Ton flair : ${Math.round(r.flair * 100)} %${r.indices.some(i => !i.vu) ? ' · il te reste des doutes' : ''}`, style(11, '#6a4a2a', { fontStyle: 'italic' })));
    let yy = y + 52;
    for (const i of r.indices) {
      const coul = !i.vu ? '#8a7a60' : i.louche ? '#a03a10' : '#2f6a2a';
      c.add(this.add.text(x + 14, yy, i.vu ? (i.louche ? '✘' : '✔') : '?', style(13, coul, { fontStyle: 'bold' })));
      const t = this.add.text(x + 32, yy, i.vu ? i.t : "Ton flair n'en tire rien de plus.", style(11, coul, { fontStyle: i.vu ? 'bold' : 'italic', wordWrap: { width: 206 }, lineSpacing: -1 }));
      c.add(t); yy += t.height + 6;
    }
    c.add(this.add.text(x + 14, y + H - 38, 'Louche :', style(12, '#3b2410', { fontStyle: 'bold' })));
    const g = this.add.graphics();
    for (let k = 0; k < 5; k++) {
      const cx = x + 100 + k * 20, cy = y + H - 30;
      g.fillStyle(0x3b2410).fillRoundedRect(cx - 8, cy - 6, 16, 12, 3);
      g.fillStyle(k < r.louche ? 0xc04020 : 0x8a7050).fillRoundedRect(cx - 6, cy - 4, 12, 8, 2);
    }
    c.add(g);
    c.add(this.add.text(x + 14, y + H - 20, r.louche >= 4 ? (this.voyageur && this.voyageur.feminin ? 'Sans doute une imposteuse... probablement.' : 'Sans doute un imposteur... probablement.') : r.louche <= 1 ? 'Rien de louche, à première vue.' : 'Difficile à dire.', style(11, '#6a4a2a', { fontStyle: 'italic' })));
    this.majBoutonsService();
  }

  // Démasqué : il bafouille et file sans demander son reste (ce qu'il avait dans son baluchon revient en réserve).
  imposteurDemasque(fouille) {
    const v = this.voyageur, G = this.G;
    for (const [id, n] of Object.entries(this.colis)) { const p = this.pieges[id] || 0; G.stock[id] += n - p; if (p) G.pieges[id] += p; }
    this.colis = {}; this.pieges = {};
    demasquerImposteur(G, v);
    this.enService = false;
    this.actionB = null;
    this.majBoutonsService();
    this.bouton('...', null);
    this.majStock();
    this.exprimer('inquiet');
    this.dire(texteImposture(IMPOSTEURS[v.imposteur.type].fuite, v, v.imposteur.ami), v.nom);
    this.time.delayedCall(1600, () => this.raconter(`${fouille ? `Au fond de son sac, rien de ce qu'${v.feminin ? 'elle' : 'il'} racontait` : `${v.feminin ? 'Elle' : 'Il'} blêmit`} : c'était ${v.feminin ? 'une imposteuse' : 'un imposteur'} ! Bien vu, ton flair grandit.`, 'Démasqué'));
    this.time.delayedCall(2600, () => this.partirPar(FENETRE.x - 80));
  }

  // --- (v0.86, lot A-2) Les recherchés ---

  // L'avis de recherche, épinglé sur l'ardoise de gauche : on compare avec le visage au comptoir.
  epinglerAffiche(avis) {
    const a = this.afficheEpinglee = this.add.container(140, 132).setDepth(6).setAngle(-4);
    const l = 150, h = 214, haut = -h / 2, encre = '#3a2210';
    a.add(this.add.image(0, 0, panneauHD(this, l, h)).setScale(2));
    a.add(this.add.circle(0, haut + 6, 4, 0xa02a20));
    a.add(this.add.text(0, haut + 17, 'AVIS DE', style(10, encre, { fontStyle: 'bold' })).setOrigin(0.5));
    a.add(this.add.text(0, haut + 31, 'RECHERCHE', style(16, encre, { fontStyle: 'bold' })).setOrigin(0.5));
    const pl = 112, ph = 76, py = haut + 44 + ph / 2;
    a.add(this.add.rectangle(0, py, pl + 6, ph + 6, 0x3a2210)); a.add(this.add.rectangle(0, py, pl, ph, 0xcdb98a));
    const pr = this.add.image(0, py + ph / 2, textureBusteHD(this, avis.personne, 'fache')).setOrigin(0.5, 1).setTint(0xd8b888);
    const e = (ph + 16) / pr.height; pr.setScale(e);
    const cw = Math.min(pr.width, pl / e), ch = Math.min(pr.height, ph / e);
    pr.setCrop((pr.width - cw) / 2, pr.height - ch, cw, ch); a.add(pr);
    a.add(this.add.text(0, py + ph / 2 + 12, avis.nom.toUpperCase(), style(avis.nom.length > 16 ? 9 : 11, encre, { fontStyle: 'bold' })).setOrigin(0.5));
    a.add(this.add.text(0, py + ph / 2 + 32, `${avis.prime} p.`, style(20, encre, { fontStyle: 'bold' })).setOrigin(0.5));
    // (un clic la décroche un instant : l'ardoise redevient lisible)
    a.setSize(l, h).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.tweens.add({ targets: a, alpha: a.alpha < 1 ? 1 : 0.25, duration: 200 }));
    if (this.panneauRoyal) this.panneauRoyal.setVisible(false);   // (v1.10 : la commande scellée passe derrière l'affiche)
    return a;
  }

  finRecherche() {
    if (this.timerRecherche) { this.timerRecherche.remove(); this.timerRecherche = null; }
    if (this.afficheEpinglee) { this.afficheEpinglee.destroy(); this.afficheEpinglee = null; }
    if (this.panneauRoyal) this.panneauRoyal.setVisible(true);
    if (this.boutonsRecherche) { this.boutonsRecherche.forEach(b => { b.fond.destroy(); b.label.destroy(); if (b.picto) b.picto.destroy(); }); this.boutonsRecherche = null; }
  }

  // Une tête qui ressemble à l'affiche du tableau... Lui, ou un honnête voyageur qui lui ressemble ?
  accueilRecherche(entree) {
    const v = entree.voyageur, G = this.G;
    const avis = avisDeRecherche(G).find(a => a.nom === v.recherche.avis) || AVIS_RECHERCHE.find(a => a.nom === v.recherche.avis);
    v.recherche.prime = avis.prime;
    this.epinglerAffiche(avis);
    this.majCommande();
    this.titreCommande.setText(v.feminin ? 'Une inconnue' : 'Un inconnu');
    this.sousTitre.setText('');
    this.texteSac.setText(''); this.texteChance.setText('');
    this.bouton('', null);
    this.enService = false;
    this.majBoutonsService();
    const parole = auHasard(PAROLES_RECHERCHE[v.recherche.innocent ? 'innocent' : 'bandit']);
    this.raconter(`Ce visage... Tu as déjà vu ${({ cacheOeil: 'ce cache-œil', balafre: 'cette balafre', cicatrice: 'cette cicatrice', tatouage: 'ce tatouage', monocle: 'ce monocle', bandeau: 'ce bandeau', dentOr: 'cette dent en or', boucle: "cette boucle d'oreille" })[(v.apparence.marques || [])[0]] || 'ce visage'} quelque part. L'avis de recherche du marché ?`);
    this.timerRecherche = this.time.delayedCall(1800, () => this.dire(parole, v.feminin ? 'Une inconnue' : 'Un inconnu', v.nom));
    const choix = [
      ['Appeler la garde', () => this.appelerGarde(entree), 'bien'],
      [`${v.feminin ? 'La' : 'Le'} cacher derrière`, () => this.cacherDerriere(entree), 'mal'],
      [`${v.feminin ? 'La' : 'Le'} servir`, () => { entree.decide = true; this.finRecherche(); this.arrivee(entree); }],
      [`${v.feminin ? 'La' : 'Le'} renvoyer`, () => this.renvoyerRecherche(entree)],
    ];
    this.boutonsRecherche = choix.map(([t, f, camp], i) => {
      const b = creerBouton(this, 840, 360 + i * 44 + (i === 3 ? 4 : 0), 210, t, () => { if (this.boutonsRecherche) f(); });
      b.fond.setDepth(6); b.label.setDepth(6.1);
      marquerCamp(this, b, camp);
      return b;
    });
  }

  appelerGarde(entree) {
    const v = entree.voyageur, G = this.G;
    this.finRecherche();
    const r = denoncerRecherche(G, v);
    Son.jouer('clochette');
    this.raconter('Tu fais signe au gamin qui traîne devant la boutique : il file chercher la garde...');
    this.time.delayedCall(1600, () => {
      this.montrerBuste(GARDE.capitaine, r.juste ? 'content' : 'fache');
      this.avancer(JOURNEE.visite, 'la garde');
      if (r.juste) {
        Son.jouer('caisse');
        this.dire(`Bien vu, ${eJ() ? 'marchande' : 'marchand'} ! ${v.recherche.avis} ne fera plus de mal à personne. Voici ta part de la prime : ${r.prime} pièces. (réputation +${RECHERCHE.reputation})`, GARDE.capitaine.nom);
      } else {
        this.dire(`Ce n'est pas ${v.recherche.avis}, marchand : ${prenomDe(v.nom)} n'a rien à voir avec ce bandit. Tu as fait arrêter ${v.feminin ? 'une honnête voyageuse' : 'un honnête voyageur'} pour rien. (réputation −${RECHERCHE.erreur})`, GARDE.capitaine.nom);
      }
      this.majPanneauGauche(); this.majStock(); this.dessinerPieces();
      this.bouton('Continuer', () => { this.bouton('...', null); this.partirPar(FENETRE.x - 80); });
    });
  }

  cacherDerriere(entree) {
    const v = entree.voyageur, G = this.G;
    this.finRecherche();
    const r = cacherRecherche(G, v);
    this.exprimer(r.objet ? 'content' : 'inquiet');
    this.dire(r.objet ? `Je n'oublierai pas. Quand la garde aura fini de fouiller la rue, regarde sous ton vieux buffet : un petit cadeau pour toi.`
      : "Me cacher ? Mais... je n'ai rien fait ! Enfin... merci, je suppose. On ne sait jamais, avec la garde.", v.nom);
    if (r.garde) this.reconstruireFile();
    this.bouton('Continuer', () => {
      if (r.objet) this.raconter(`Sous le buffet de l'arrière-boutique : ${INTERDITS[r.objet].article}.`, 'Un cadeau');
      this.bouton('...', null); this.partirPar(FENETRE.x - 80);
    });
  }

  renvoyerRecherche(entree) {
    const v = entree.voyageur;
    entree.decide = true;
    this.finRecherche();
    if (v.recherche.innocent) return this.refuser(true);
    this.exprimer('fache');
    this.dire("Pas de questions, pas de client ? Tant pis pour toi, marchand. On se reverra.", v.nom);
    this.bouton('...', null);
    this.partirPar(FENETRE.x - 80);
  }

  // La garde est sur la piste de celui que tu as caché.
  visiteGardeRecherche(entree) {
    const v = entree.voyageur, G = this.G;
    this.titreCommande.setFontSize(17).setText('La garde de la Confrérie');
    this.dire(v.recherche.innocent ? `On nous a signalé un individu louche entré chez toi tout à l'heure. ${v.feminin ? 'Une femme' : 'Un type'} qui ressemble à ${v.recherche.avis}. Tu ne l'aurais pas vu${v.feminin ? 'e' : ''}, par hasard ?`
      : `On recherche ${v.recherche.avis}. Un voisin l'a vu${v.feminin ? 'e' : ''} entrer chez toi. Tu ne l'aurais pas vu${v.feminin ? 'e' : ''}, par hasard ?`, GARDE.capitaine.nom);
    const fin = (texte, fache) => {
      this.actionB = null; this.majBoutonsService();
      this.exprimer(fache ? 'fache' : 'neutre');
      this.dire(texte, GARDE.capitaine.nom);
      this.majPanneauGauche(); this.dessinerPieces();
      this.bouton('...', null);
      this.time.delayedCall(1800, () => this.partirPar(FENETRE.x - 80));
    };
    this.choix(["Je n'ai vu personne", () => {
      const r = repondreGarde(G, v, false);
      fin(r.vu ? `Tu te moques de moi ? On l'a vu${v.feminin ? 'e' : ''} filer par ta porte de derrière ! Je m'en souviendrai, marchand. (réputation −${RECHERCHE.erreur})` : `Bon. Ouvre l'œil, marchand. Et préviens-nous si tu ${v.feminin ? 'la' : 'le'} vois.`, r.vu);
    }], [`${v.feminin ? 'Elle' : 'Il'} est derrière`, () => {
      const r = repondreGarde(G, v, true);
      fin(r.juste ? `Merci de ta coopération. ${v.recherche.avis} ne fera plus de mal à personne. Voici ta part de la prime : ${r.prime} pièces.`
        : `${prenomDe(v.nom)} ? Ce n'est pas ${v.recherche.avis}, voyons ! Tu nous fais perdre notre temps. (réputation −${RECHERCHE.erreur})`, !r.juste);
    }]);
  }

  // La file redessinée (quand quelqu'un s'y glisse en tête, ou que plusieurs s'en vont)
  reconstruireFile() {
    this.fileSprites.forEach(sp => sp.destroy());
    this.fileSprites = this.G.file.map((entree, i) => this.spriteFile(entree, i));
    this.majFileAttente();
  }

  // --- (v0.86, lot A-1) L'horloge du comptoir ---

  // Une plaque en haut à droite de la fenêtre : un petit cadran où le soleil tourne, l'heure, et
  // la course du jour de l'ouverture à la fermeture. Le ciel rougit dans l'heure qui précède.
  creerHorloge() {
    this.plaqueHorloge = this.add.graphics().setDepth(4);
    this.texteHeure = this.add.text(FENETRE.x + 180, FENETRE.y + 22, '', style(14, '#f3d98a', { fontStyle: 'bold', brut: true })).setOrigin(0, 0.5).setDepth(4);
    const zone = this.add.rectangle(FENETRE.x + 250, FENETRE.y + 22, 204, 28, 0xffffff, 0).setDepth(4).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => {
      const G = this.G, f = heureFermeture(G);
      this.raconter(`Il est ${formatHeure(heureDuComptoir(G))}. Le comptoir ferme à ${formatHeure(f)}. Servir un client prend ${formatDuree(dureeService(G))}${dureeService(G) > JOURNEE.service[JOURNEE.service.length - 1] ? " (moins, avec l'expérience)" : ''} ; écouter un récit ${formatDuree(JOURNEE.recit)} ; passer chez Grippesou ${formatDuree(JOURNEE.express)}.${niveauAmelioration(G, 'eclairage') < AMELIORATIONS.eclairage.niveaux.length - 1 ? ' Un meilleur éclairage fait fermer plus tard.' : ''}`, "L'horloge");
    });
    this.heureAffichee = heureDuComptoir(this.G);
    this.majHorloge();
  }

  majHorloge(h = this.heureAffichee) {
    const G = this.G, g = this.plaqueHorloge, f = heureFermeture(G), o = heureOuverture(G);
    if (!g) return;
    const alerte = h >= f - JOURNEE.alerte;
    const x0 = FENETRE.x + 148, y0 = FENETRE.y + 8, L = 204, H = 28;
    g.clear();
    g.fillStyle(0x1e130a, 0.92).fillRoundedRect(x0, y0, L, H, 5);
    g.lineStyle(2, alerte ? 0xff6040 : 0xc9a227, 1).strokeRoundedRect(x0, y0, L, H, 5);
    // le cadran : la moitié haute en ciel, l'astre sur l'aiguille (de l'ouverture à gauche à la fermeture à droite)
    const cx = x0 + 15, cy = y0 + 14, t = Phaser.Math.Clamp((h - o) / (f - o), 0, 1);
    g.fillStyle(0x8a6a20).fillCircle(cx, cy, 11);
    g.fillStyle(alerte ? 0xff9a60 : h >= f ? 0x2a2a5a : 0x8ad0ff).fillCircle(cx, cy, 9);
    g.fillStyle(0x3a6a2a).fillRect(cx - 9, cy + 1, 18, 8);
    const a = Math.PI + t * Math.PI;
    g.fillStyle(alerte ? 0xff6a30 : 0xffe060).fillCircle(cx + Math.cos(a) * 6, cy + Math.sin(a) * 6, 3);
    this.texteHeure.setText(formatHeure(h)).setColor(alerte ? '#ff8a60' : '#f3d98a').setPosition(x0 + 32, cy);
    // la course du jour : une graduation par heure, le soleil qui avance
    const tx = x0 + 92, tl = 100, n = Math.round(f - o);
    g.fillStyle(0x3b2a14).fillRect(tx, cy - 2, tl, 4);
    g.fillStyle(alerte ? 0xff7040 : 0xe0a820).fillRect(tx, cy - 2, tl * t, 4);
    for (let k = 0; k <= n; k++) g.fillStyle(0xc9a227).fillRect(tx + k * tl / n - 0.5, cy + (k % 2 ? 2 : 1), 1, k % 2 ? 2 : 4);
    g.fillStyle(0x1a0e08).fillCircle(tx + tl * t, cy, 5);
    g.fillStyle(alerte ? 0xff7a40 : 0xffe060).fillCircle(tx + tl * t, cy, 4);
    // (v0.91) le ciel suit l'heure, pas le dernier client
    this.ciel(h);
    // (v1.63) et l'horloge régulateur du coin aussi
    if (this.decorMatin) this.decorMatin.dessinerAiguilles(h);
  }

  // (v0.93, planche 18) Le ciel de la fenêtre heure par heure : l'aube pâle et dorée, le plein jour,
  // l'après-midi qui se réchauffe, l'heure dorée, le crépuscule rose et violet, puis la nuit.
  // Les heures du soir suivent la fermeture (plus tard avec l'éclairage).
  ciel(h) {
    if (!this.cielNuit) return;
    const d = heureFermeture(this.G) - JOURNEE.fermeture;
    // [heure, aube, nuit, voile de nuit, teinte du soir (multipliée), son intensité, lumière chaude (ajoutée)]
    const CLES = [[10, 0.35, 0, 0, 0xffffff, 0, 0.18], [11, 0, 0, 0, 0xffffff, 0, 0], [14, 0, 0, 0, 0xffd8a0, 0, 0],
      [15 + d, 0, 0, 0, 0xffd8a0, 0.35, 0], [16.5 + d, 0, 0, 0, 0xff9a50, 0.55, 0.12], [17.5 + d, 0.85, 0, 0, 0x8a5ab0, 0.45, 0],
      [18.5 + d, 0, 1, 0.2, 0x8a5ab0, 0, 0]];
    let k = CLES.findIndex(c => c[0] > h);
    if (k < 0) k = CLES.length - 1;
    const a = CLES[Math.max(0, k - 1)], b = CLES[k];
    const t = b[0] === a[0] ? 1 : Phaser.Math.Clamp((h - a[0]) / (b[0] - a[0]), 0, 1);
    const m = i => a[i] + (b[i] - a[i]) * t;
    const ca = Phaser.Display.Color.IntegerToColor(a[4]), cb = Phaser.Display.Color.IntegerToColor(b[4]);
    const c = Phaser.Display.Color.Interpolate.ColorWithColor(ca, cb, 1, t);
    this.cielAube.setAlpha(m(1));
    this.cielNuit.setAlpha(m(2));
    this.voile.setFillStyle(0x0a0a30, m(3));
    this.voileSoir.setFillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1).setAlpha(m(5));
    this.voileChaud.setAlpha(m(6));
  }

  // Le temps passe : l'heure avance (en glissant), et une petite ligne s'envole de l'horloge.
  avancer(duree, texte = '') {
    if (!duree) return;
    const G = this.G, avant = heureDuComptoir(G), apres = avancerHeure(G, duree);
    const mot = this.add.text(FENETRE.x + 250, FENETRE.y + 50, `+${formatDuree(duree)}${texte ? ' · ' + texte : ''}`,
      style(14, '#a8f088', { fontStyle: 'bold', stroke: '#1e130a', strokeThickness: 4, brut: true })).setOrigin(0.5).setDepth(6);
    this.tweens.add({ targets: mot, y: mot.y - 12, alpha: 0, delay: 1400, duration: 700, onComplete: () => mot.destroy() });
    const suivi = { h: avant };
    this.tweens.add({ targets: suivi, h: apres, duration: 900, ease: 'Sine.easeInOut', onUpdate: () => { this.heureAffichee = suivi.h; this.majHorloge(); },
      onComplete: () => { this.heureAffichee = apres; this.majHorloge(); } });
  }

  // 18 h (ou plus tard, avec l'éclairage) : le comptoir ferme. Une fiche dit qui reviendra demain.
  annoncerFermeture() {
    const G = this.G;
    G.fermeLe = G.jour;
    const { reviennent, repartent } = fermerLeComptoir(G);
    // la file d'attente se vide de ceux qui s'en vont
    this.reconstruireFile();
    Son.jouer('clochette');
    const prenoms = l => { const n = l.map(v => prenomDe(v.nom)); return n.length > 1 ? n.slice(0, -1).join(', ') + ' et ' + n[n.length - 1] : n[0]; };
    const fem = l => l.every(v => v.feminin);
    const c = this.ficheFermeture = this.add.container(0, 0).setDepth(20);
    c.add(this.add.rectangle(480, 270, 960, 540, 0x0a0604, 0.45).setInteractive());
    const x = 250, y = 50, L = 460, H = 300;
    c.add(this.add.image(x + L / 2, y + H / 2, panneauHD(this, L, H)).setScale(2));
    c.add(this.add.text(x + L / 2, y + 28, `${formatHeure(heureFermeture(G))} : le comptoir ferme`, style(22, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
    let yy = y + 58;
    const ligne = (texte, couleur, extra = {}) => { const t = this.add.text(x + 28, yy, texte, style(15, couleur, { fontStyle: 'bold', lineSpacing: 2, wordWrap: { width: L - 56 }, ...extra })); c.add(t); yy += t.height + 12; };
    if (reviennent.length) ligne(`✉  ${prenoms(reviennent)} (${reviennent.length > 1 ? (fem(reviennent) ? 'elles' : 'ils') : reviennent[0].feminin ? 'elle' : 'il'} t'avai${reviennent.length > 1 ? 'en' : ''}t écrit) reviendr${reviennent.length > 1 ? 'ont' : 'a'} demain matin, en tête de file.`, '#2f5a2a');
    if (repartent.length) ligne(`↩  ${prenoms(repartent)} repart${repartent.length > 1 ? 'ent' : ''} : ${repartent.length > 1 ? (fem(repartent) ? 'elles' : 'ils') + ' retenteront leur' : (repartent[0].feminin ? 'elle' : 'il') + ' retentera sa'} chance.`, '#7a3a10');
    if (!reviennent.length && !repartent.length) ligne("Personne n'attendait plus : une journée bien menée.", '#2f5a2a');
    const n = niveauAmelioration(G, 'eclairage');
    if (n < AMELIORATIONS.eclairage.niveaux.length - 1) ligne(`✦  Avec un meilleur éclairage, ton comptoir fermerait plus tard (${formatHeure(heureFermeture(G) + JOURNEE.parEclairage)}).`, '#5a4a2a', { fontStyle: 'italic bold' });
    const suite = creerBouton(this, x + L / 2, y + H - 60, 200, 'Continuer', () => { c.destroy(); this.ficheFermeture = null; this.voyageurSuivant(); });
    c.add([suite.fond, suite.label]);
    c.add(this.add.text(x + L / 2, y + H - 24, `Aujourd'hui : ${pluriel(G.journal.servis, 'client servi', 'clients servis')} · ${pluriel(G.journal.retours, 'retour de mission', 'retours de mission')}`, style(13, '#5a3a1c', { fontStyle: 'italic' })).setOrigin(0.5));
    this.raconter(`Le clocher sonne ${formatHeure(heureFermeture(G))} : tu retournes le petit écriteau, « Fermé ».${G.file.length ? ' Mais on frappe encore au volet...' : ''}`, 'Fermeture');
    this.bouton('...', null);
  }

  // --- Décor ---

  // Le mur (enduit à la chaux entre les colombages de chêne) et le plateau du comptoir.
  dessinerPiece() {
    creerDecorComptoir(this);
    this.dessinerReliques();
    creerObjetsHD(this);
    creerOiseauxMessagers(this);   // (v1.22) le pigeon des messages de détresse
    // (v1.63, planche 81 v2) le décor du comptoir suit le style choisi dans le carnet de la tapissière
    this.styleDecor = typeof styleComptoir === 'function' ? styleComptoir(this.G) : 'champetre';
    this.add.image(0, 0, typeof murComptoirStyle === 'function' ? murComptoirStyle(this, this.styleDecor) : 'murComptoir').setOrigin(0).setScale(2);
    this.add.image(0, 340, plateauComptoir(this, niveauAmelioration(this.G, 'comptoir'))).setOrigin(0).setScale(2);
  }

  // (v0.60) Les souvenirs de la Faucheuse, alignés sur le comptoir : un par âme offerte
  dessinerReliques() {
    const F = this.G.faucheuse;
    if (!F || !F.reliques || !F.reliques.length) return;
    creerReliquesFaucheuseHD(this);
    // (audit v0.61) leur propre plateau de velours noir, à côté de la bourse : sur l'étagère, ils
    // cachaient les décorations et prenaient leurs clics
    const g = this.add.graphics().setDepth(3.9);
    g.fillStyle(0x0c0810, 0.55).fillRoundedRect(97, 447, 50, 46, 4);
    g.fillStyle(0x24141e).fillRoundedRect(95, 444, 50, 46, 4);
    g.lineStyle(1, 0x4a2a3a).strokeRoundedRect(95, 444, 50, 46, 4);
    F.reliques.forEach((id, i) => {
      const r = RELIQUES_FAUCHEUSE.find(x => x.id === id);
      const o = this.add.image(105 + (i % 3) * 15, 466 + Math.floor(i / 3) * 21, 'relique_' + id).setOrigin(0.5, 1).setScale(1.25).setDepth(4).setInteractive({ useHandCursor: true });
      o.on('pointerover', () => { this.infoRelique = this.add.text(Math.max(130, o.x), o.y - 24, `${r.nom}\n${r.texte}`, style(12, '#e8dcff', { fontStyle: 'italic', align: 'center', backgroundColor: '#1a1020e0', padding: { x: 8, y: 5 }, wordWrap: { width: 230 } })).setOrigin(0.5, 1).setDepth(30); });
      o.on('pointerout', () => { if (this.infoRelique) { this.infoRelique.destroy(); this.infoRelique = null; } });
      if (id === 'bougieNoire') { creerHalo(this); const h = this.add.image(o.x, o.y - 23, 'halo').setScale(0.22).setTint(0x60ff90).setAlpha(0.5).setBlendMode(Phaser.BlendModes.ADD).setDepth(4.1); this.tweens.add({ targets: h, alpha: 0.2, duration: 700, yoyo: true, repeat: -1 }); }
    });
  }

  creerFenetre() {
    const { x, y, w, h } = FENETRE;
    this.paysage = this.add.graphics();
    dessinerComte(this.paysage, x, y, w, h, 0);
    // Le ciel suit la journée : on ouvre à midi, en plein jour ; la nuit tombe quand le
    // dernier client est parti.
    const ciel = moment => {
      const cle = paysageHD(this, w, h, 'comte', moment);
      const tex = this.textures.get(cle).getSourceImage();
      return this.add.image(x, y, cle).setOrigin(0).setScale(w / tex.width, h / tex.height);
    };
    this.cielAube = ciel('aube').setAlpha(0);   // (v0.93) l'aube revient au crépuscule, en rose
    this.cielNuit = ciel(0.85).setAlpha(0);
    this.voile = this.add.rectangle(x + w / 2, y + h / 2, w, h, 0x0a0a30, 0);
    // (v0.86) le ciel du soir : une lumière orangée qui teinte le paysage et la file, pas le client au comptoir
    this.voileSoir = this.add.rectangle(x + w / 2, y + h / 2, w, h, 0xff8a50, 1).setBlendMode(Phaser.BlendModes.MULTIPLY).setAlpha(0).setDepth(1.6);
    this.voileChaud = this.add.rectangle(x + w / 2, y + h / 2, w, h, 0xffc070, 1).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0).setDepth(1.6);

    // Tout ce qui est dans la fenêtre est découpé à sa taille.
    const forme = this.make.graphics({ add: false });
    forme.fillStyle(0xffffff).fillRect(x, y, w, h);
    const masque = forme.createGeometryMask();
    this.paysage.setMask(masque);

    this.masqueFenetre = masque;
    this.perso = this.add.image(-100, SOL_COMPTOIR, 'perso_hobbit').setOrigin(0.5, 1).setScale(9).setDepth(2);
    this.perso.setMask(masque);
    // (v0.60) Ton reflet dans la vitre : à peine visible... et de plus en plus sombre à chaque âme offerte
    const ames = this.G.mal || 0;
    if (ames > 0) {
      const C = Phaser.Display.Color;
      const c = C.Interpolate.ColorWithColor(C.ValueToColor(0xd8d8e8), C.ValueToColor(0x2a0a3a), 10, Math.min(10, Math.round(ames * 1.2)));
      const reflet = this.add.image(x + w - 48, y + h + 26, textureJoueur(this, this.G, 'face')).setOrigin(0.5, 1).setScale(echelleJoueur(8))
        .setAlpha(Math.min(0.32, 0.08 + ames * 0.035)).setTint(C.GetColor(c.r, c.g, c.b)).setDepth(2.35);
      reflet.setMask(masque);
      this.reflet = reflet;
    }
    this.creerFileAttente();

    // L'ébrasement, le cadre de chêne et l'appui de pierre de la fenêtre
    this.add.image(x - 16, y - 16, typeof cadreFenetreStyle === 'function' ? cadreFenetreStyle(this, this.styleDecor) : 'cadreFenetre').setOrigin(0).setScale(2).setDepth(3);
    // (v1.63) le pot collé au montant droit, la tisane, le bouquet du montant gauche, les clés, la clochette
    this.objetsFenetre = typeof poserObjetsFenetre === 'function' ? poserObjetsFenetre(this, this.styleDecor) : null;
    if (this.objetsFenetre) {
      const o = this.objetsFenetre;
      this.tweens.add({ targets: o.montant, angle: { from: -1.5, to: 1.5 }, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.vapeurTisane = vapeur(this, o.tisane.x - o.tisane.displayWidth / 2, o.tisane.y - o.tisane.displayHeight - 1, 2.95);
      o.clochette.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.sonnerClochette());
      if (this.styleDecor === 'artisan') { creerHalo(this); const lu = this.add.image(o.montant.x, o.montant.y + 24, 'halo').setScale(0.35).setTint(0xffc060).setAlpha(0.4).setBlendMode(Phaser.BlendModes.ADD).setDepth(3.15); this.tweens.add({ targets: lu, alpha: 0.25, duration: 160, yoyo: true, repeat: -1, repeatDelay: 900, ease: 'Stepped' }); }
    }
    // (v1.53, planche 62) le temps qu'il fait, derrière la vitre
    if (typeof meteoFenetre === 'function') meteoFenetre(this, FENETRE, masque);
  }

  // Les voyageurs qui attendent leur tour, visibles par la fenêtre.
  creerFileAttente() {
    this.fileSprites = this.G.file.map((entree, i) => this.spriteFile(entree, i));

    const fond = this.fondAttente = this.add.rectangle(FENETRE.x + 8, FENETRE.y + 8, 132, 28, 0x2a1a10, 0.8)
      .setOrigin(0, 0).setStrokeStyle(2, 0xc9a227).setDepth(4).setVisible(false);   // (montré quand la file a un compte)
    this.texteAttente = this.add.text(fond.x + 66, fond.y + 14, '', style(14, '#f3d98a', { fontStyle: 'bold' }))
      .setOrigin(0.5).setDepth(4);
  }

  // Un personnage qui attend dans la file, à la place `i`.
  spriteFile(entree, i) {
    if (entree.type === 'detresse') { const p = this.add.image(FILE.x - i * FILE.ecart, FILE.y, 'pigeonPose').setVisible(false); p.estPigeon = true; return p; }
    // (v1.61) un carnet rapporté : son voyageur n'est plus là pour faire la queue
    if (entree.type === 'carnet') { const p = this.add.image(FILE.x - i * FILE.ecart, FILE.y, 'pigeonPose').setVisible(false); p.estPigeon = true; return p; }   // (v1.22 : le pigeon ne fait pas la queue ; v1.31 : et ne s'y montre jamais)
    const cle = this.texturePour(entree);
    const sprite = this.add.image(FILE.x - i * FILE.ecart, FILE.y, cle)
      .setOrigin(0.5, 1).setScale(FILE.echelle * echelleCorps(cle)).setTint(0xd8d0c0).setDepth(1);
    sprite.setMask(this.masqueFenetre);
    // (v1.61) en attendant, de temps en temps : un regard en arrière, ou un petit balancement d'un pied sur l'autre.
    // (avant, tout le monde sautait de 3 px sans s'arrêter : les magiciennes, sans jambes sous la robe, voltigeaient)
    this.time.delayedCall(1500 + Math.random() * 3000, () => this.attendreDansLaFile(sprite));
    return sprite;
  }

  attendreDansLaFile(sprite) {
    if (!sprite.active || !sprite.visible || this.tweens.isTweening(sprite)) { if (sprite.active) this.time.delayedCall(1200, () => this.attendreDansLaFile(sprite)); return; }
    if (Math.random() < 0.35) { sprite.setFlipX(true); this.time.delayedCall(700 + Math.random() * 600, () => sprite.active && sprite.setFlipX(false)); }
    else this.tweens.add({ targets: sprite, angle: { from: 0, to: Math.random() < 0.5 ? -1.5 : 1.5 }, duration: 380, yoyo: true, ease: 'Sine.easeInOut' });
    this.time.delayedCall(2500 + Math.random() * 4000, () => this.attendreDansLaFile(sprite));
  }

  // Le client retourne au bout de la file, avec son colis commencé et sa destination.
  // Une première attente passe bien ; les suivantes l'agacent un peu.
  mettreEnAttente() {
    const entree = this.entree;
    const v = this.voyageur;
    if (!v || !entree || entree.type !== 'client') return;
    if (!this.G.file.length) return this.dire("Personne d'autre n'attend : autant le servir maintenant !", '');
    entree.colis = { ...this.colis };
    entree.pieges = { ...this.pieges };
    entree.attentes = (entree.attentes || 0) + 1;
    let msg = null;
    let phrase = "D'accord, je repasse tout à l'heure. Garde-moi mon baluchon !";
    if (entree.attentes > 1) {
      msg = changerRelation(this.G, v.nom, -1);
      phrase = "Encore attendre ?! Bon... mais je n'ai pas toute la journée.";
    }
    this.enService = false;
    this.actionB = null;
    this.majBoutonsService();
    this.bouton('...', null);
    this.exprimer(entree.attentes > 1 ? 'fache' : 'neutre');
    this.dire(phrase + (msg ? ' ' + msg : ''), v.nom);
    // (v0.93) ... mais devant la Faucheuse, qui reste toujours la dernière
    const iF = this.G.file.findIndex(e => e.type === 'faucheuse' || e.type === 'crieur');   // (housekeep v1.14 : le crieur reste en fin de file)
    const place = iF >= 0 ? iF : this.G.file.length;
    this.G.file.splice(place, 0, entree);
    this.fileSprites.splice(place, 0, this.spriteFile(entree, place).setVisible(false));
    this.majFileAttente();
    this.partirPar(FENETRE.x - 80);
  }

  texturePour(entree, pose = null) {
    if (entree.type === 'faucheuse') return 'perso_faucheuse';
    if (entree.type === 'sage' || entree.type === 'percepteur') return corpsHD(this, entree.type === 'sage' ? 'sage' : personneDuPercepteur(entree), pose);   // (v1.32, planche 58)
    if (entree.type === 'famille') return corpsHD(this, entree.visite.parent, pose);
    if (entree.type === 'notable') { const p = this.personneDe(entree); return corpsHD(this, p.figurant || p, pose); }
    if (entree.type === 'colporteur') return corpsHD(this, 'colporteur', pose);
    if (entree.type === 'garde' || entree.type === 'gardeRecherche') return corpsHD(this, GARDE.capitaine, pose);
    if (entree.type === 'client' && entree.voyageur.apparence) { const a = entree.voyageur.apparence; return corpsHD(this, a.figurant || a, pose); }
    if (entree.type === 'garrick') return corpsHD(this, 'mentor', pose);
    if (entree.type === 'collecteur') return corpsHD(this, collecteurDe(this.G), pose);
    if (entree.type === 'serpent') return corpsHD(this, CHEFS_SERPENT[0], pose);
    if (entree.type === 'aine') return corpsHD(this, personneAine(entree.race), pose);
    if (entree.type === 'collectionneur') return corpsHD(this, COLLECTIONNEUR, pose);   // (v1.23)
    if (entree.type === 'heraut') return corpsHD(this, 'heraut', pose);
    if (entree.type === 'rival') return corpsHD(this, 'rivalA', pose);   // (v1.11)
    if (entree.type === 'crieur') return corpsHD(this, 'crieur', pose);
    const v = entree.type === 'client' ? entree.voyageur : entree.parti.voyageur;
    return corpsHD(this, v, pose);
  }

  majFileAttente() {
    const n = this.G.file.length;
    this.texteAttente.setText(n === 0 ? 'Plus personne' : `En attente : ${n}`);
    this.fondAttente.setVisible(true);
  }

  // À gauche : qui est en mission, et les lettres reçues (cliquables).
  // (v1.42, planche 68) l'ardoise en trois lignes ; un clic sur une ligne ouvre le détail, « ◂ » revient
  creerPanneauGauche() {
    this.add.image(20, 20, typeof ardoiseStyle === 'function' ? ardoiseStyle(this, this.styleDecor) : 'ardoiseComptoir').setOrigin(0).setScale(2); // l'ardoise dans son cadre
    this.texteJour = this.add.text(30, 28, '', style(22, '#f3d98a', { fontStyle: 'bold' }));
    this.texteJoueur = this.add.text(262, 36, '', style(13, '#c9b48a', { fontStyle: 'italic' })).setOrigin(1, 0);
    creerGlyphesHD(this);
    this.modeArdoise = 'resume';
    // (v1.61) plus de lettres reçues : l'ardoise garde deux lignes
    this.lignesResume = [['epees', 'En mission', 'missions'], ['etoile', 'Prochain client', null]].map(([g, libelle, mode], i) => {
      const y = 78 + i * 34;
      const zone = this.add.rectangle(146, y, 236, 30, 0xf3d98a, 0).setInteractive({ useHandCursor: !!mode });
      const ico = this.add.image(44, y, 'glyphe_' + g).setScale(1.8);
      const lib = this.add.text(62, y, libelle, style(15, '#f3e6c8', { fontStyle: 'bold' })).setOrigin(0, 0.5);
      const val = this.add.text(256, y, '', style(15, '#f3d98a', { fontStyle: 'bold' })).setOrigin(1, 0.5);
      if (mode) {
        zone.on('pointerover', () => zone.setFillStyle(0xf3d98a, 0.08));
        zone.on('pointerout', () => zone.setFillStyle(0xf3d98a, 0));
        zone.on('pointerdown', () => { Son.jouer('page'); marquerAide(this.G, 'ardoise'); this.modeArdoise = mode; this.majPanneauGauche(); });
      }
      return { zone, ico, lib, val, objets: [zone, ico, lib, val] };
    });
    this.aideArdoise = this.add.text(146, 224, 'un clic sur une ligne : le détail', style(11, '#a89878', { fontStyle: 'italic' })).setOrigin(0.5);
    // le détail
    this.titreDetail = this.add.text(30, 62, '', style(14, '#c9b48a', { fontStyle: 'bold' }));
    this.retourArdoise = this.add.text(258, 62, '◂ retour', style(13, '#f3d98a', { fontStyle: 'bold' })).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    this.retourArdoise.on('pointerdown', () => { Son.jouer('page'); this.modeArdoise = 'resume'; this.majPanneauGauche(); });
    this.texteMissions = this.add.text(30, 86, '', style(13, '#f3e6c8', { lineSpacing: 3 }));
    this.lignesLettres = [];
    for (let i = 0; i < 6; i++) {
      const t = this.add.text(30, 86 + i * 20, '', style(13, '#f3e6c8')).setInteractive({ useHandCursor: true });
      t.on('pointerover', () => t.setColor('#f3d98a'));
      t.on('pointerout', () => t.setColor('#f3e6c8'));
      t.on('pointerdown', () => this.lireLettre(i));
      this.lignesLettres.push(t);
    }
  }

  // le nom du prochain dans la file (ou ce qui vient : un retour, Garrick, une visite)
  prochainDeLaFile() {
    const f = this.G.file[0];
    if (!f) return 'personne';
    if (f.voyageur) return prenomDe(f.voyageur.nom);
    if (f.type === 'carnet') return 'un carnet';   // (v1.61 : un disparu ne fait pas la queue)
    if (f.parti) return prenomDe(f.parti.voyageur.nom) + ' ↩';
    if (f.type === 'garrick') return 'Garrick';
    return 'une visite';
  }

  lireLettre(i) {
    const a = this.G.annonces[i];
    if (!a) return;
    Son.jouer('page');
    const v = a.voyageur;
    this.dire(`« Je passerai à ton comptoir le jour ${a.jour}. Je pars : ${(t => t.charAt(0).toLowerCase() + t.slice(1))(v.quete)}. ` +
      `Prépare-moi s'il te plaît : ${commandeEnTexte(v)}. » — ${v.nom}` +
      (a.acceptee ? ' (Tu as accepté.)' : ' (Pas encore répondu : accepte ou refuse ce soir.)'), 'Lettre ' + dePersonne(v.nom));
  }

  creerCommande() {
    // (v1.63, planche 81 v2) le mur de droite : l'étagère suspendue (le calendrier du jour), le tableau où s'épingle
    // la commande, l'horloge régulateur dans le coin. La commande a sa place : jamais par-dessus l'horloge.
    const D = DECOR_MATIN;
    this.decorMatin = poserDecorMatin(this, this.styleDecor, { heure: heureDuComptoir(this.G), jour: typeof dateDuJour === 'function' ? dateDuJour(this.G).jourDuMois : this.G.jour });
    this.tweens.add({ targets: this.decorMatin.balancier, angle: { from: -6, to: 6 }, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    for (const f of this.decorMatin.flammes) {
      creerHalo(this);
      this.add.image(f.x, f.y - 4, 'halo').setScale(0.16).setTint(0xffc060).setAlpha(0.45).setBlendMode(Phaser.BlendModes.ADD);
      this.time.addEvent({ delay: 180 + Math.random() * 160, loop: true, callback: () => f.setTexture(f.texture.key.endsWith('0') && Math.random() < 0.7 ? 'flammeBougie_1' : 'flammeBougie_0') });
    }
    // la carte « Ce matin, dehors » (le store baissé) et le parchemin de la commande (le store levé)
    this.carteDehors = this.add.container(D.tableau.x + D.tableau.l, D.tableau.y + 82);
    this.carteDehors.add(this.add.image(0, 0, carteDehorsHD(this)).setScale(2));
    this.carteDehors.add(this.add.text(0, -12, 'Ce matin, dehors :', style(12, '#5a3a1c', { fontStyle: 'italic' })).setOrigin(0.5));
    this.texteDehors = this.add.text(0, 10, '', style(16, '#2a1608', { fontStyle: 'bold' })).setOrigin(0.5);
    this.carteDehors.add(this.texteDehors).setVisible(false);
    this.parcheminCommande = this.add.image(D.parchemin.x, D.parchemin.y, parcheminTableauHD(this)).setOrigin(0).setScale(2);
    const X = D.parchemin.x + 12, LARGE = D.parchemin.l * 2 - 24;   // (le texte tient dans le parchemin : 178 px)
    this.largeurCommande = LARGE;
    // Le nom du client sur une ligne (la police rétrécit si besoin), sa destination en dessous.
    this.titreCommande = this.add.text(X, 64, '', style(17, '#3b2410', { fontStyle: 'bold' }));
    this.sousTitre = this.add.text(X, 86, '', style(12, '#6b4a2a', { fontStyle: 'italic' }));
    this.texteSac = this.add.text(X, 202, '', style(11, '#5a3a20'));
    // (ce qui s'écrit sur le parchemin n'en sort jamais : trop long, la police rapetisse)
    for (const [t, min] of [[this.titreCommande, 11], [this.sousTitre, 9], [this.texteSac, 8]]) {
      const ecrireT = t.setText.bind(t), tailleT = t.setFontSize.bind(t);
      let base = parseInt(t.style.fontSize, 10);
      const tenir = () => {
        let k = base; tailleT(k);
        while (t.text && t.width > LARGE && k > min) tailleT(--k);
        if (t.width > LARGE) { let v = t.text; while (v.length > 2 && t.width > LARGE) { v = v.slice(0, -2) + '…'; ecrireT(v); } }   // (au pire, coupé net)
      };
      t.setFontSize = k => { base = parseInt(k, 10) || base; tenir(); return t; };
      t.setText = v => { ecrireT(v); tenir(); return t; };
    }
    this.lignesCommande = [];
    for (let i = 0; i < 5; i++) {
      const y = 109 + i * 19;
      const icone = this.add.image(X + 8, y, 'ration').setScale(2.2).setVisible(false);
      const txt = this.add.text(X + 24, y, '', style(14, '#3b2410')).setOrigin(0, 0.5);
      const zone = this.add.rectangle(X + LARGE / 2, y, LARGE, 19, 0x000000, 0).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => this.clicLigne(i));
      // Le petit « − » : retirer un objet du colis (il retourne dans ta réserve).
      const moins = this.add.circle(X + LARGE - 6, y, 8, 0x8a3a2a).setStrokeStyle(1, 0x3b2410).setInteractive({ useHandCursor: true }).setVisible(false);
      const moinsTexte = this.add.text(X + LARGE - 6, y - 1, '−', style(13, '#fff4dc', { fontStyle: 'bold' })).setOrigin(0.5).setVisible(false);
      moins.on('pointerover', () => moins.setFillStyle(0xb04a3a));
      moins.on('pointerout', () => moins.setFillStyle(0x8a3a2a));
      moins.on('pointerdown', () => this.retirer(i));
      this.lignesCommande.push({ icone, txt, zone, moins, moinsTexte, id: null });
    }
    // (v1.62) réparer l'équipement d'un client : c'est un employé de l'atelier qui s'en charge ; sans employé, l'option n'existe pas
    this.aideCommande = this.add.text(X, 226, (this.G.employes || []).length ? '− : retirer · clic : faire réparer' : '− : retirer', style(11, '#7a5a3a', { fontStyle: 'italic' }));
    // (v0.95) sous serment de lumière : un paladin de la Confrérie peut escorter une mission par semaine
    this.boutonEscorte = this.add.text(X, 226, '', style(12, '#2a4a8a', { fontStyle: 'bold', backgroundColor: '#e8dcb8', padding: { x: 4, y: 1 } }))
      .setInteractive({ useHandCursor: true }).setVisible(false);
    this.boutonEscorte.on('pointerdown', () => { this.escorteChoisie = !this.escorteChoisie; Son.jouer('clic'); this.majCommande(); });
    {
      const e = this.boutonEscorte, ecrireE = e.setText.bind(e);
      e.setText = v => { ecrireE(v); e.setFontSize(12); for (let k = 11; e.width > LARGE && k >= 9; k--) e.setFontSize(k); return e; };
    }
    // (v1.42, planche 68) les chances dans un encart : un libellé, une jauge de couleur, le chiffre en grand.
    // (les comptoirs à part — rival, Conseil, Sage — vident texteChance : l'encart disparaît avec lui)
    this.boiteFlair = this.add.graphics();
    this.boiteFlair.fillStyle(0x3b2410, 0.16).fillRoundedRect(X - 4, 213, LARGE + 8, 29, 7);
    this.libelleFlair = this.add.text(X + 4, 221, '', style(12, '#5a3a1a', { fontStyle: 'bold' })).setOrigin(0, 0.5);
    this.jaugeFlair = this.add.graphics();
    this.texteChance = this.add.text(X + LARGE, 228, '', style(17, '#3b2410', { fontStyle: 'bold' })).setOrigin(1, 0.5);
    const ecrire = this.texteChance.setText.bind(this.texteChance);
    this.texteChance.setText = t => { ecrire(t); if (!t) { this.boiteFlair.setVisible(false); this.libelleFlair.setText(''); this.jaugeFlair.clear(); } return this.texteChance; };
    this.texteChance.setText('');
    this.objetsCommande = [this.parcheminCommande, this.titreCommande, this.sousTitre, this.texteSac, this.aideCommande, this.boutonEscorte, this.boiteFlair, this.libelleFlair, this.jaugeFlair, this.texteChance];
  }

  // (v1.63) le store baissé : le tableau ne porte que la carte « Ce matin, dehors » ; levé, on y épingle la commande
  montrerCommande(oui, anime = false) {
    const D = DECOR_MATIN, lignes = this.lignesCommande.flatMap(l => [l.icone, l.txt, l.moins, l.moinsTexte]);
    if (!oui) {
      for (const o of [...this.objetsCommande, ...lignes]) o.setAlpha(0);
      const n = this.G.file.filter(e => !['detresse', 'carnet'].includes(e.type)).length;
      this.texteDehors.setText(n ? `${n} personne${n > 1 ? 's' : ''}` : 'personne');
      this.carteDehors.setVisible(true).setAngle(-2).setAlpha(1).setY(D.tableau.y + 82);
      return;
    }
    if (!anime || !this.carteDehors.visible) { this.carteDehors.setVisible(false); for (const o of [...this.objetsCommande, ...lignes]) o.setAlpha(1); return; }
    // la carte se décroche (elle bascule autour de son épingle, puis tombe) ; le parchemin est épinglé à sa place
    const c = this.carteDehors;
    this.tweens.add({ targets: c, angle: 16, duration: 240, ease: 'Quad.easeIn', onComplete: () =>
      this.tweens.add({ targets: c, y: c.y + 160, angle: 38, alpha: 0, duration: 460, ease: 'Quad.easeIn', onComplete: () => c.setVisible(false) }) });
    this.parcheminCommande.setY(D.parchemin.y - 10).setAngle(-3);
    this.tweens.add({ targets: this.parcheminCommande, y: D.parchemin.y, angle: 0, alpha: 1, delay: 420, duration: 280, ease: 'Back.easeOut', onComplete: () => {
      Son.jouer('poser');
      this.tweens.add({ targets: [...this.objetsCommande.filter(o => o !== this.parcheminCommande), ...lignes], alpha: 1, duration: 220 });
    } });
  }

  // l'encart des chances : libellé, jauge (part remplie, couleur), chiffre
  majFlair(libelle, chiffre, part, couleur) {
    this.boiteFlair.setVisible(true);
    this.libelleFlair.setText(libelle).setFontSize(12);
    this.texteChance.setText(chiffre).setColor(couleur);
    for (let k = 11; this.libelleFlair.width > this.largeurCommande - this.texteChance.width - 14 && k >= 9; k--) this.libelleFlair.setFontSize(k);   // (v1.63 : le libellé ne touche pas le chiffre)
    this.jaugeFlair.clear();
    if (part === null) return;
    const c = Phaser.Display.Color.HexStringToColor(couleur).color;
    const x0 = this.libelleFlair.x;   // (v1.63 : la jauge tient dans le parchemin du tableau)
    this.jaugeFlair.fillStyle(0x2a1a10).fillRoundedRect(x0, 231, 112, 8, 4);
    if (part > 0) this.jaugeFlair.fillStyle(c).fillRoundedRect(x0 + 1, 232, Math.max(6, 110 * Math.min(1, part)), 6, 3);
  }

  creerDialogue() {
    // Le panneau des dialogues : à gauche le nom sur sa plaque (et la relation dessous),
    // à droite la parole, à l'encre, centrée dans la hauteur.
    this.fondDialogue = this.add.image(480, 298, 'parcheminDialogue').setScale(2);
    // (v0.68) un clic n'importe où affiche d'un coup la phrase en train de s'écrire
    this.input.on('pointerdown', () => { if (this.defileDialogue) this.defileDialogue.finir(); });
    const pl = plaqueDuRang(this, 196, 'topaze', false);   // (v1.43) la plaque du nom : topaze (le client), une pierre de chaque côté
    this.placeNom = pl.place;
    this.plaqueNom = this.add.image(133, 288, pl.cle).setScale(2);
    this.nomParleur = this.add.text(133, 288, '', style(15, '#f3d98a', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 3 })).setOrigin(0.5);
    this.sousNom = this.add.text(133, 321, '', style(12, '#5a4028', { fontStyle: 'italic bold' })).setOrigin(0.5);
    this.texteDialogue = this.add.text(256, 298, '', style(16, '#2a1a0c', { wordWrap: { width: 660 }, lineSpacing: 1 })).setOrigin(0, 0.5);
    // (v0.86) la narration (le jeu qui raconte, pas un personnage qui parle) : une plume à la place
    // du nom, le titre éventuel en italique, le texte à l'encre violette, le parchemin un peu plus pâle
    this.plumeNarration = this.add.image(133, 298, texturePlume(this)).setScale(2.2).setVisible(false);
    this.titreNarration = this.add.text(150, 298, '', style(13, '#5a3a1c', { fontStyle: 'italic bold', align: 'center', wordWrap: { width: 160 } })).setOrigin(0.5).setVisible(false);
  }

  // (v1.42, planche 68) quatre zones de couleur : de quoi parle chaque panneau, d'un coup d'œil
  // (profondeur 0, posées tôt : les fiches et fenêtres ouvertes plus tard passent par-dessus)
  // Seulement pendant le didacticiel (Jour Zéro et jour 1) : ensuite le comptoir reste sans liserés (demandé par le joueur)
  creerZones() {
    if (!(typeof didacticiel === 'function' && didacticiel(this.G) && this.G.jour <= 1)) return;
    const g = this.add.graphics();
    const zones = [[22, 22, 246, 226, 0x6a9ac9, 145, 248, 'TOI', '#8ab0d0'], [684, 50, 218, 200, 0xd8a838, 793, 250, 'LE CLIENT', '#e8c060'],
      [142, 348, 560, 180, 0x6a9a4a, 422, 346, 'TA RÉSERVE', '#9ac87a'], [732, 344, 216, 182, 0xc04a3a, 840, 342, 'TES ACTIONS', '#e88a7a']];
    for (const [x, y, l, h, coul, ex, ey, texte, fond] of zones) {
      g.lineStyle(3, coul, 0.8).strokeRoundedRect(x, y, l, h, 8);
      this.add.text(ex, ey, texte, style(11, '#14100a', { fontStyle: 'bold', backgroundColor: fond, padding: { x: 7, y: 2 } })).setOrigin(0.5);
    }
  }

  // (v1.43, planche 70) dès la Maison, une pierre aux coins de l'ardoise (saphir : toi) et du parchemin (topaze : le client)
  creerPierresDesPanneaux() {
    const rang = typeof rangInterface === 'function' ? rangInterface(this) : 1;
    if (rang < 2) return;
    for (const [x, y] of [[29, 29], [259, 29], [29, 239], [259, 239]]) coinPierre(this, x, y, 'saphir', rang, 0);
    for (const [x, y] of [[691, 57], [895, 57], [691, 243], [895, 243]]) coinPierre(this, x, y, 'topaze', rang, 0);   // (v1.63 : les coins du tableau de la commande)
    if (rang >= 4) for (const [x, y] of [[255, 25], [891, 53]]) etincelle(this, x, y, 0.5);
  }

  creerStock() {
    // (v1.42, planche 68) un seul chiffre en titre ; l'aide « clic : ajouter » s'efface après le premier objet donné
    this.texteReserve = this.add.text(150, 355, '', style(14, '#f3e6c8', { fontStyle: 'bold', stroke: '#1a100a', strokeThickness: 3 }));
    this.aideStock = this.add.text(0, 358, 'clic : ajouter au baluchon', style(11, '#e8d4a8', { fontStyle: 'italic', stroke: '#1a100a', strokeThickness: 3 }));
    // (v1.61) agrandir la réserve d'ici même (avant : seulement le soir, dans la chambre)
    this.boutonAgrandir = this.add.text(0, 355, '', style(11, '#fff4dc', { fontStyle: 'bold', backgroundColor: '#3f6a2c', padding: { x: 6, y: 2 } })).setInteractive({ useHandCursor: true });
    this.boutonAgrandir.on('pointerover', () => this.boutonAgrandir.setBackgroundColor('#56883c'));
    this.boutonAgrandir.on('pointerout', () => this.boutonAgrandir.setBackgroundColor('#3f6a2c'));
    this.boutonAgrandir.on('pointerdown', () => {
      const a = agrandissementSuivant(this.G), avant = this.G.capacite;
      if (!a) return;
      if (!agrandirReserve(this.G)) { Son.jouer('refus'); return this.raconter(manqueArgent(this.G, a.prix, "Pas assez d'argent pour agrandir la réserve."), 'Ta réserve'); }
      Son.jouer('achat');
      gainEnDirect(this, this.texteReserve.x + this.texteReserve.width / 2, 340, `+${this.G.capacite - avant} places`, true);
      this.majStock(); this.dessinerPieces();
    });
    this.texteMateriaux = this.add.text(660, 358, '', style(11, '#e8d4a8', { stroke: '#1a100a', strokeThickness: 3 })).setOrigin(1, 0);
    this.creerEtagere();
    // Le registre posé sur le bureau : clic pour ouvrir le bureau (fiches, comptes, statistiques)
    // Un gros livre de comptes ouvert ; son titre est écrit à l'encre sur la page de gauche.
    const registre = this.add.image(75, 368, 'registreComptoir').setScale(2).setInteractive({ useHandCursor: true });
    const titre = this.add.text(47, 353, 'Registre', style(12, '#5e1a16', { fontStyle: 'italic bold' })).setOrigin(0.5);
    registre.on('pointerover', () => { registre.setTint(0xfff0d8).setY(365); titre.setY(350); });
    registre.on('pointerout', () => { registre.clearTint().setY(368); titre.setY(353); });
    registre.on('pointerdown', () => {
      this.scene.pause();
      this.scene.launch('Bureau', { retour: 'Comptoir', comptoir: this });
    });
    this.creerVitrine();
    this.cases = {}; this.casesArmes = {};
    // (v0.63) toutes les armes partagent une case : le râtelier, qui s'ouvre sur celles du stock
    const cases = Object.keys(ITEMS).filter(id => !estArme(id) || id === 'epee').map(id => (id === 'epee' ? 'armes' : id));
    const avant = this.children.list.length;
    cases.forEach((id, i) => {
      if (id === 'armes') return this.creerCaseArmes(200 + (i % 5) * 108, 397 + Math.floor(i / 5) * 48);
      this.creerCase(id, 200 + (i % 5) * 108, 397 + Math.floor(i / 5) * 48, this.cases);
    });
    this.pagesStock = [this.children.list.slice(avant)];
    // (v0.68) la page 2 : les autres armes, chacune dans sa case (l'épée reste en page 1, dans le râtelier)
    // (lot 3) 12 cases par page (la troisième rangée n'en a que 2 : le bouton de l'arrière-boutique occupe le reste) ; l'arc, l'arbalète,
    // l'épée courte... s'ajoutent : les armes en trop passent sur une page de plus
    const autres = IDS_ARMES.filter(id => id !== 'epee');
    for (let k = 0; k < autres.length; k += 12) {
      this.pageCase = 1 + k / 12;
      const avant2 = this.children.list.length;
      autres.slice(k, k + 12).forEach((id, i) => this.creerCase(id, 200 + (i % 5) * 108, 397 + Math.floor(i / 5) * 48, this.casesArmes));
      this.pagesStock.push(this.children.list.slice(avant2));
    }
    this.creerOngletPages();
    this.montrerPageStock(0);
    this.creerBoutonRetourner();
  }

  // (v0.68) L'onglet qui tourne les pages de la marchandise (▶ 1/2), comme un intercalaire
  creerOngletPages() {
    const x = 712, y = 421;
    const fond = this.add.image(x, y, panneauHD(this, 18, 46, 'ardoise')).setScale(2).setInteractive({ useHandCursor: true });
    const fleche = this.add.text(x, y - 10, '▶', style(16, '#f3d98a', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 3 })).setOrigin(0.5);
    const num = this.add.text(x, y + 16, '', style(11, '#f3e6c8', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 3 })).setOrigin(0.5);
    fond.on('pointerdown', () => { Son.jouer('page'); this.montrerPageStock((this.pageStock + 1) % this.pagesStock.length); });
    fond.on('pointerover', () => fond.setTint(0xfff0c8)); fond.on('pointerout', () => fond.clearTint());
    this.ongletPages = { fond, fleche, num };
  }

  montrerPageStock(n) {
    this.pageStock = n;
    this.pagesStock.forEach((objets, k) => objets.forEach(o => { o.setVisible(k === n); if (o.input) o.input.enabled = k === n; }));
    if (this.cases && this.texteReserve) this.majStock();   // (v0.91) les piles suivent le stock sur la page affichée
    const o = this.ongletPages;
    if (o) { o.num.setText(`${n + 1}/${this.pagesStock.length}`); o.fleche.setText(n === this.pagesStock.length - 1 ? '◀' : '▶'); }
    if (this.ratelier && n !== 0) { this.ratelier.destroy(); this.ratelier = null; }
    this.majOngletPages();
  }

  // L'onglet s'anime quand l'arme que veut le client est rangée sur l'autre page
  majOngletPages() {
    const o = this.ongletPages;
    if (!o) return;
    const pref = this.voyageur ? armePour(this.voyageur) : null;
    const ailleurs = pref && this.casesArmes[pref] && this.casesArmes[pref].page !== this.pageStock;
    this.tweens.killTweensOf(o.fleche);
    o.fleche.setScale(1);
    if (ailleurs) this.tweens.add({ targets: o.fleche, scale: 1.35, duration: 380, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  // Une case de marchandise posée sur la toile (page 1 : les objets ; page 2 : les armes)
  creerCase(id, x, y, ou) {
    {
      const fond = this.add.rectangle(x, y, 100, 40, 0xfff6d8, 0.001).setInteractive({ useHandCursor: true });
      // La marchandise posée sur la toile : jusqu'à trois exemplaires empilés selon le stock
      const cle = iconeObjet(this, id);
      // (lot 3) une arme par case, seule et nette : un seul dessin (pas de pile qui déborde sur le nom ni sur la case voisine), le nom
      // sur deux lignes au besoin, la quantité sur son étiquette en bas à droite
      const armes = ou === this.casesArmes;
      const pile = armes ? [this.add.image(x - 31, y + 1, cle).setScale(2)].flatMap(i => [i, i, i]) : [2, 1, 0].map(k => this.add.image(x - 28 - k * 3, y + 3 - k * 4, cle).setScale(2));
      const icone = pile[2];
      let nom;
      if (armes) {
        nom = this.add.text(x - 10, y - 16, ITEMS[id].nom.replace(' de guerre', '').replace(' de bambou', ' bambou').replace(' cloutée', ''), style(10, '#3a2410', { fontStyle: 'bold', wordWrap: { width: 56 }, lineSpacing: -2 }));
        for (let taille = 11; (nom.width > 58 || nom.height > 22) && taille >= 8; taille--) nom.setFontSize(taille);
      } else {
        nom = this.add.text(x - 8, y - 18, ITEMS[id].nom, style(10, '#3a2410', { fontStyle: 'bold' }));
        for (let taille = 12; nom.width > 60 && taille >= 9; taille--) nom.setFontSize(taille); // les noms longs rapetissent un peu
      }
      // La quantité, sur une petite étiquette de parchemin
      this.add.image(x + 32, y + 12, 'etiquette').setScale(2);
      const qte = this.add.text(x + 33, y + 12, '', style(12, '#3a2410', { fontStyle: 'bold' })).setOrigin(0.5);
      fond.on('pointerover', () => { fond.setFillStyle(0xfff6d8, 0.22); icone.setScale(2.25); });
      fond.on('pointerout', () => { fond.setFillStyle(0xfff6d8, 0.001); icone.setScale(2); });
      fond.on('pointerdown', () => this.donner(id));
      ou[id] = { fond, qte, pile, icone, seul: armes, page: ou === this.casesArmes ? (this.pageCase || 1) : 0 };
      // (v1.54, planche 62) les provisions qui se périment : une petite barre de fraîcheur (la plus vieille), et au survol, combien de jours
      if (typeof FRAICHEUR !== 'undefined' && FRAICHEUR[id] && FRAICHEUR[id].ou === 'stock') {
        const fondB = this.add.rectangle(x - 9, y + 6, 26, 6, 0x3a2410).setOrigin(0, 0.5), barre = this.add.rectangle(x - 8, y + 6, 24, 4, 0x4a9a3a).setOrigin(0, 0.5);
        const jours = this.add.text(x - 9, y + 15, '', style(9, '#5a3a20', { fontStyle: 'bold italic' })).setOrigin(0, 0.5);
        ou[id].fraiche = { fondB, barre, jours };
      }
    }
  }

  // (v0.63) La case du râtelier : l'arme la plus utile en ce moment (celle du client si on l'a),
  // le total des armes ; un clic ouvre le râtelier pour choisir laquelle donner
  creerCaseArmes(x, y) {
    const fond = this.add.rectangle(x, y, 100, 40, 0xfff6d8, 0.001).setInteractive({ useHandCursor: true });
    const pile = [2, 1, 0].map(k => this.add.image(x - 28 - k * 3, y + 3 - k * 4, iconeObjet(this, 'epee')).setScale(2));
    const icone = pile[2];
    this.add.text(x - 8, y - 18, 'Armes', style(12, '#3a2410', { fontStyle: 'bold' }));
    this.add.text(x - 8, y - 4, '▾ choisir', style(9, '#6b4a2a', { fontStyle: 'italic' }));
    this.add.image(x + 32, y + 12, 'etiquette').setScale(2);
    const qte = this.add.text(x + 33, y + 12, '', style(12, '#3a2410', { fontStyle: 'bold' })).setOrigin(0.5);
    fond.on('pointerover', () => { fond.setFillStyle(0xfff6d8, 0.22); icone.setScale(2.25); });
    fond.on('pointerout', () => { fond.setFillStyle(0xfff6d8, 0.001); icone.setScale(2); });
    fond.on('pointerdown', () => this.ouvrirRatelier());
    this.cases.armes = { fond, qte, pile, icone, armes: true };
  }

  ouvrirRatelier() {
    if (this.ratelier) { this.ratelier.destroy(); this.ratelier = null; return; }
    const G = this.G, v = this.voyageur;
    const pref = v ? armePour(v) : null;
    const ids = IDS_ARMES.filter(id => (G.stock[id] || 0) > 0 || id === pref);
    const c = this.ratelier = this.add.container(0, 0).setDepth(25);
    const n = Math.max(1, ids.length), cols = Math.min(4, n), lignes = Math.ceil(n / cols);
    const l = (ids.length ? cols * 132 : 300) + 20, h = lignes * 40 + 46, x0 = 420 - l / 2, y0 = 352 - h;
    c.add(this.add.rectangle(x0 + l / 2, y0 + h / 2, l, h, 0x2a1a10, 0.94).setStrokeStyle(2, 0xc9a046).setInteractive());
    c.add(this.add.text(x0 + 12, y0 + 8, 'Le râtelier' + (pref ? ` · ${prenomDe(v.nom)} préfère : ${ITEMS[pref].nom.toLowerCase()}` : ''), style(12, '#f3d98a', { fontStyle: 'bold' })));
    c.add(this.add.text(x0 + l - 10, y0 + 6, '✕', style(14, '#c9b48a', { fontStyle: 'bold' })).setOrigin(1, 0).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.ouvrirRatelier()));
    if (!ids.length) c.add(this.add.text(x0 + 12, y0 + 32, "Aucune arme en réserve. Thorgal en vend quelques-unes chaque matin.", style(11, '#e8dcc0', { fontStyle: 'italic', wordWrap: { width: l - 24 } })));
    ids.forEach((id, i) => {
      const x = x0 + 14 + (i % cols) * 132, y = y0 + 48 + Math.floor(i / cols) * 40;
      const nb = G.stock[id] || 0;
      const z = this.add.rectangle(x + 60, y, 126, 34, id === pref ? 0x5a4a14 : 0x3a2a1a, 1).setStrokeStyle(1, id === pref ? 0xf0c840 : 0x6a4a2a).setInteractive({ useHandCursor: nb > 0 });
      c.add(z);
      c.add(this.add.image(x + 14, y, iconeObjet(this, id)).setScale(2).setAlpha(nb > 0 ? 1 : 0.4));
      const t = this.add.text(x + 32, y - 8, (id === pref ? '★ ' : '') + ITEMS[id].nom, style(11, nb > 0 ? '#fff0d0' : '#9a8a70', { fontStyle: 'bold' }));
      for (let s = 11; t.width > 90 && s >= 8; s--) t.setFontSize(s);
      c.add(t);
      c.add(this.add.text(x + 32, y + 6, `x${nb}`, style(10, nb > 0 ? '#c9e0a0' : '#c08070')));
      z.on('pointerdown', () => { if (nb <= 0) return this.dire("Tu n'en as plus en stock...", ''); this.ouvrirRatelier(); this.donner(id); });
    });
  }

  // Se retourner : l'arrière-boutique (étagères, fortune, cadeaux, tiroir secret, chambre).
  creerBoutonRetourner() {
    const b = creerBouton(this, 578, 493, 212, "↻ Arrière-boutique", () => {
      if (this.enConfirmation) return;
      this.scene.pause();
      this.scene.launch('Arriere', { comptoir: this });
    });
    b.label.setFontSize(16);
  }

  // Les cadeaux achetés au Bazar de Rosalie : un par client et par jour, pour sa chance.
  creerTiroirCadeaux() {
    const x = 416, y = 493;
    const fond = this.add.rectangle(x, y, 104, 44, 0x3a5a2a).setStrokeStyle(2, 0x1f3a1a).setInteractive({ useHandCursor: true });
    const texte = this.add.text(x, y, '', style(12, '#e8f0c8', { fontStyle: 'bold', align: 'center' })).setOrigin(0.5);
    fond.on('pointerover', () => fond.setFillStyle(0x4a7a3a));
    fond.on('pointerout', () => fond.setFillStyle(0x3a5a2a));
    fond.on('pointerdown', () => this.ouvrirTiroirCadeaux());
    this.tiroirCadeaux = { fond, texte };
  }

  majTiroirCadeaux() {
    if (!this.tiroirCadeaux) return;
    const n = Object.values(this.G.cadeaux || {}).reduce((a, b) => a + b, 0);
    this.tiroirCadeaux.fond.setVisible(n > 0);
    this.tiroirCadeaux.texte.setVisible(n > 0).setText(`Cadeaux\n(${n})`);
    if (!n && this.panneauCadeaux) { this.panneauCadeaux.destroy(); this.panneauCadeaux = null; }
  }

  ouvrirTiroirCadeaux() {
    if (this.panneauCadeaux) { this.panneauCadeaux.destroy(); this.panneauCadeaux = null; return; }
    const G = this.G, ids = Object.keys(G.cadeaux).filter(id => G.cadeaux[id] > 0);
    if (!ids.length) return;
    // (v1.54, planche 62) pour chaque cadeau : ce que le client en pensera (s'il le sait), et ce que ça rapporte
    const v = this.voyageur && !this.enConfirmation ? this.voyageur : null, anniv = !!(v && v.anniversaire === G.jour);
    const c = this.panneauCadeaux = this.add.container(0, 0).setDepth(80), X = 440, h = 74 + ids.length * 27, haut = 520 - h;
    c.add(this.add.rectangle(X, haut + h / 2, 600, h, 0x1e2a14, 0.97).setStrokeStyle(3, 0x4a7a3a).setInteractive());
    c.add(this.add.text(X, haut + 16, v ? `Offrir à ${v.nom}` : 'Tes cadeaux', style(15, '#e8f0c8', { fontStyle: 'bold' })).setOrigin(0.5));
    c.add(this.add.text(X, haut + 34, v ? (anniv ? "c'est son anniversaire : un cadeau qui plaît compte double" : 'un cadeau par personne et par jour') : "personne au comptoir pour l'instant", style(11, '#a8c890', { fontStyle: 'italic' })).setOrigin(0.5));
    ids.forEach((id, i) => {
      const y = haut + 56 + i * 27, avis = v && typeof avisConnu === 'function' ? avisConnu(G, v, id) : null, A = avis ? AVIS_CADEAU[avis] : null;
      const ligne = this.add.rectangle(X, y, 576, 25, 0x2a3a1e).setInteractive({ useHandCursor: true });
      ligne.on('pointerover', () => ligne.setFillStyle(0x3a5a2a));
      ligne.on('pointerout', () => ligne.setFillStyle(0x2a3a1e));
      ligne.on('pointerdown', () => this.offrir(id));
      c.add([ligne, this.add.image(X - 268, y, iconeObjet(this, id)).setScale(1.4),
        this.add.text(X - 248, y, `${CADEAUX[id].nom}  ×${G.cadeaux[id]}${typeof FRAICHEUR !== 'undefined' && FRAICHEUR[id] ? ` · ${fraicheurRestante(G, id) <= 1 ? 'ce soir' : fraicheurRestante(G, id) + ' j'}` : ''}`, style(13, '#f3f0d0', { fontStyle: 'bold' })).setOrigin(0, 0.5)]);
      if (A) { c.add(this.add.text(X - 40, y, A.signe, style(13, A.couleur, { fontStyle: 'bold' })).setOrigin(0, 0.5));
        c.add(this.add.text(X + 280, y, texteEffetCadeau(avis, anniv), style(12, '#e8f0c8')).setOrigin(1, 0.5)); }
    });
    c.add(this.add.text(X, haut + h - 12, "Ses goûts s'apprennent en offrant (ou avec du flair), et le registre s'en souvient.", style(11, '#a8c890', { fontStyle: 'italic' })).setOrigin(0.5));
    const croix = this.add.text(X + 286, haut + 12, '✕', style(16, '#e8f0c8', { fontStyle: 'bold' })).setOrigin(0.5).setInteractive({ useHandCursor: true });
    croix.on('pointerdown', () => { c.destroy(); this.panneauCadeaux = null; if (this.anniversaireApres) { const e = this.anniversaireApres; this.anniversaireApres = null; this.arrivee(e); } });
    c.add(croix);
  }

  // (v1.54, planche 62 v2) L'anniversaire d'un habitué : le chapeau de fête sur la tête, des confettis, et trois réponses
  feteAnniversaire(v, entree) {
    const G = this.G, age = ageDe(G, v.nom), elle = v.feminin;
    this.exprimer('content');
    // le chapeau, posé sur le haut de sa tête (le premier pixel plein au milieu du buste)
    const cle = this.perso.texture.key, src = this.textures.get(cle).getSourceImage(), w = src.width, h = src.height;
    let top = 0; for (let y = 0; y < h && !top; y++) for (const x of [w * 0.45, w * 0.5, w * 0.55]) if (this.textures.getPixel(Math.floor(x), y, cle) && this.textures.getPixel(Math.floor(x), y, cle).alpha > 0) { top = y; break; }
    const ech = this.perso.scaleX, yTete = this.perso.y - (h - top) * ech;
    this.chapeauFete = this.add.image(this.perso.x - 6, yTete + 10, chapeauFeteHD(this)).setOrigin(0.5, 1).setScale(3.2).setAngle(-14).setDepth(2.1).setMask(this.masqueFenetre);
    const couleurs = [0xe85a8a, 0xf0d040, 0x4a8ad8, 0x5ac85a];
    const pluie = this.time.addEvent({ delay: 60, repeat: 40, callback: () => { const c = this.add.rectangle(FENETRE.x + Math.random() * FENETRE.w, FENETRE.y, 4, 4, couleurs[Math.floor(Math.random() * 4)]).setDepth(2.2).setMask(this.masqueFenetre);
      this.tweens.add({ targets: c, y: FENETRE.y + FENETRE.h, angle: 360, x: c.x + (Math.random() - 0.5) * 40, duration: 1600 + Math.random() * 900, onComplete: () => c.destroy() }); } });
    Son.jouer('fanfare');
    this.dire("« Tu ne devineras jamais quel jour on est ! ... Quoi, tu l'avais noté ? Dans ton registre ? Oh, ça alors. »", this.nomAvecRelation(v.nom), v.nom);
    const c = this.panneauAnniv = this.add.container(0, 0).setDepth(80);
    const fermer = () => { c.destroy(); this.panneauAnniv = null; };
    c.add(this.add.rectangle(440, 438, 560, 168, 0x1e140a, 0.96).setStrokeStyle(3, 0xd8b048).setInteractive());
    c.add(this.add.text(440, 370, `C'est l'anniversaire de ${prenomDe(v.nom)} : ${elle ? 'elle' : 'il'} fête ses ${age} ans (le registre l'avait noté ce matin).`, style(12, '#f3d98a', { fontStyle: 'italic', wordWrap: { width: 540 }, align: 'center' })).setOrigin(0.5));
    const aCadeau = Object.values(G.cadeaux || {}).some(n => n > 0);
    const options = [
      ['Lui offrir un cadeau', aCadeau ? 'le cadeau compte double : +4 relation' : "tu n'as pas de cadeau sous la main", aCadeau ? '#7ad86a' : '#8a8070', () => { if (!aCadeau) return; fermer(); this.anniversaireApres = entree; this.ouvrirTiroirCadeaux(); }],
      ['Lui souhaiter, de tout cœur', '+1 relation', '#c8e0a0', () => { fermer(); this.dire(feterAnniversaire(G, v, 'souhait')); this.time.delayedCall(2600, () => this.arrivee(entree)); }],
      ['Ne rien dire', `−1 relation : ${elle ? 'elle' : 'il'} s'en souviendra`, '#e08a6a', () => { fermer(); this.exprimer('inquiet'); this.dire(feterAnniversaire(G, v, 'oubli')); this.time.delayedCall(2600, () => this.arrivee(entree)); }],
    ];
    options.forEach(([t, e, col, f], i) => { const b = creerBouton(this, 330, 404 + i * 42, 220, t, f); c.add([b.fond, b.label]); if (i === 0 && !aCadeau) b.fond.setAlpha(0.5);
      c.add(this.add.text(450, 404 + i * 42, e, style(12, col, { fontStyle: 'bold' })).setOrigin(0, 0.5)); });
  }

  offrir(id) {
    if (this.panneauCadeaux) { this.panneauCadeaux.destroy(); this.panneauCadeaux = null; }
    if (!this.voyageur || this.enConfirmation) return this.dire("Il n'y a personne à qui l'offrir.", '');
    const r = offrirCadeau(this.G, this.voyageur, id);
    if (r.erreur) return this.dire(r.erreur, '');
    this.exprimer(r.gout === 'aime' ? 'content' : r.gout === 'deteste' ? 'fache' : 'neutre');
    this.dire(r.texte);
    this.tweens.add({ targets: this.perso, y: this.perso.y - 14, duration: 140, yoyo: true });
    this.majStock();
    this.majCommande();
    // (v1.54) le cadeau d'anniversaire offert : la visite reprend son cours
    if (this.anniversaireApres) { const e = this.anniversaireApres; this.anniversaireApres = null; this.time.delayedCall(2600, () => this.arrivee(e)); }
  }

  // Le tiroir secret, sous le comptoir : les objets piégés que la Faucheuse t'a laissés.
  // Il n'apparaît que quand il y a quelque chose dedans.
  creerTiroirSecret() {
    const x = 578, y = 493;
    const fond = this.add.rectangle(x, y, 212, 44, 0x1a0e18).setStrokeStyle(2, 0x5a1a3a).setInteractive({ useHandCursor: true });
    const texte = this.add.text(x, y, '', style(13, '#d08aa8', { fontStyle: 'bold', align: 'center' })).setOrigin(0.5);
    fond.on('pointerover', () => fond.setFillStyle(0x2a1424));
    fond.on('pointerout', () => fond.setFillStyle(0x1a0e18));
    fond.on('pointerdown', () => this.ouvrirTiroirSecret());
    this.tiroirSecret = { fond, texte };
  }

  majTiroirSecret() {
    if (!this.tiroirSecret) return;
    const n = Object.values(this.G.pieges).reduce((a, b) => a + b, 0);
    const visible = n > 0 || Object.values(this.pieges || {}).some(k => k > 0);
    this.tiroirSecret.fond.setVisible(visible);
    this.tiroirSecret.texte.setVisible(visible).setText(`Tiroir secret (${n})`);
    if (!visible && this.panneauSecret) { this.panneauSecret.destroy(); this.panneauSecret = null; }
  }

  // La liste des objets piégés : clic pour en glisser un dans le baluchon du client.
  ouvrirTiroirSecret() {
    if (this.panneauSecret) { this.panneauSecret.destroy(); this.panneauSecret = null; return; }
    const ids = piegesEnStock(this.G);
    if (!ids.length) return;
    const c = this.panneauSecret = this.add.container(0, 0).setDepth(8);
    const h = 34 + ids.length * 30;
    c.add(this.add.rectangle(578, 470 - h / 2, 230, h, 0x1a0e18, 0.97).setStrokeStyle(2, 0x5a1a3a));
    c.add(this.add.text(578, 470 - h + 14, 'Glisser dans le baluchon :', style(12, '#d08aa8', { fontStyle: 'italic' })).setOrigin(0.5));
    ids.forEach((id, i) => {
      const y = 470 - h + 40 + i * 30;
      const ligne = this.add.rectangle(578, y, 216, 26, 0x2a1424).setInteractive({ useHandCursor: true });
      ligne.on('pointerover', () => ligne.setFillStyle(0x4a1a34));
      ligne.on('pointerout', () => ligne.setFillStyle(0x2a1424));
      ligne.on('pointerdown', () => this.glisserPiege(id));
      c.add([ligne, this.add.image(482, y, iconeObjet(this, id)).setScale(2).setTint(0x9a8aa0),
        this.add.text(500, y, `${PIEGES[id].nom} x ${this.G.pieges[id]}`, style(12, '#f0c0d8', { fontStyle: 'bold' })).setOrigin(0, 0.5)]);
    });
  }

  // Glisser un objet piégé dans le baluchon, à la place d'un objet commandé.
  // Le client n'y voit que du feu : il le compte dans sa commande.
  glisserPiege(id) {
    if (this.panneauSecret) { this.panneauSecret.destroy(); this.panneauSecret = null; }
    if (!this.enService || this.enConfirmation) return this.dire("Il n'y a personne à qui le glisser.", '');
    const v = this.voyageur;
    const commande = commandeDe(v);
    // (v0.64) l'épée fêlée passe pour l'arme qu'il a commandée, quelle qu'elle soit
    const besoin = estArme(id) ? Object.keys(commande).find(estArme) : id;
    if (!besoin || !commande[besoin]) return this.dire(`${prenomDe(v.nom)} n'a pas commandé ${estArme(id) ? "d'arme" : deNom(ITEMS[id].nom.toLowerCase())} : ça éveillerait ses soupçons.`, '');
    if (fourni(v, this.colis, besoin) >= commande[besoin]) return this.dire(estArme(id) ? "Son baluchon a déjà son arme. Retires-en une d'abord." : `Son baluchon a déjà son compte ${deNom(ITEMS[id].nom.toLowerCase())}. Retires-en ${accordAdj(besoin, 'un', 'une', 'un', 'une')} d'abord.`, '');
    this.G.pieges[id]--;
    this.colis[id] = (this.colis[id] || 0) + 1;
    this.pieges[id] = (this.pieges[id] || 0) + 1;
    this.dire(`Tu glisses discrètement ${leNom(id, PIEGES[id].nom.toLowerCase())} dans son baluchon. ${v.feminin ? 'Elle' : 'Il'} ne remarque rien.`, '');
    this.majStock();
    this.majCommande();
  }

  // L'étagère des décorations offertes par tes amis. Clic : voir son effet.
  creerEtagere() {
    // La petite étagère des souvenirs, sous le registre
    const g = this.add.graphics();
    g.fillStyle(0x8a5a2b).fillRect(12, 420, 126, 2);
    g.fillStyle(0x5a3a22).fillRect(12, 422, 126, 4);
    g.fillStyle(0x2a1a10).fillRect(12, 426, 126, 1).fillRect(18, 427, 5, 6).fillRect(127, 427, 5, 6);
    this.G.decorations.forEach((id, i) => {
      const icone = this.add.image(24 + i * 25, 408, iconeObjet(this, id === 'trefle' ? 'trefleChance' : id)).setScale(1.6).setInteractive({ useHandCursor: true });
      icone.on('pointerdown', () => this.raconter(DECORATIONS[id].effet, DECORATIONS[id].nom));
    });
  }

  creerArgent() {
    // Ta bourse, posée sur le comptoir : elle gonfle avec tes pièces.
    // (v1.61) plus bas : l’onglet Carte cachait le haut de la besace ; (v1.62, planche 84) la nouvelle besace, ×2,
    // qui verse vers la fenêtre quand tu paies
    this.bourse = bourse(this, 66, 515, this.G.argent, { echelle: 2, taille: 17, gain: [0, -34] });   // (le gain s'affiche sur elle : au-dessus, l'onglet Carte)
    // De temps en temps, une pièce scintille quand la bourse est bien pleine.
    this.time.addEvent({ delay: 1400, loop: true, callback: () => {
      if (this.bourse.niveau < 2 || Math.random() < 0.35) return;
      const eclat = this.add.image(66 + Phaser.Math.Between(-14, 14), 500 - Phaser.Math.Between(20, 50), 'eclat').setScale(0).setDepth(1);
      this.tweens.add({ targets: eclat, scale: 2, angle: 45, duration: 260, yoyo: true, onComplete: () => eclat.destroy() });
    } });
  }

  dessinerPieces() {
    // (v1.61) l'argent reçu au comptoir : les pièces, posées sur le comptoir, volent jusqu'à ta besace, et
    // le compte ne change qu'à leur arrivée (comme les pièces de Garrick)
    const apres = Math.floor(this.G.argent), avant = this.argentVise ?? this.bourse.dernier;
    this.argentVise = apres;
    if (avant === undefined || apres <= avant || !this.bourse.visible || !this.sys.isActive()) {
      if (!this.piecesEnVol) this.bourse.maj(this.G.argent);
      return;
    }
    this.piecesEnVol = (this.piecesEnVol || 0) + 1;
    Son.jouer('pieces');
    // (v1.62) elles tournent en volant, et tombent une à une dans le col de la besace
    const col = this.bourse.col();
    voleePieces(this, FENETRE.x + FENETRE.w / 2, SOL_COMPTOIR + 6, col.x, col.y, Math.ceil(Math.sqrt(apres - avant)), { profondeur: 60, besace: this.bourse, montant: this.piecesEnVol === 1 ? apres - this.bourse.dernier : 0, fin: () => {
      this.piecesEnVol--;
      if (!this.piecesEnVol) this.bourse.maj(this.G.argent);
    } });
  }

  // --- Déroulement ---

  // (v1.63) D'une personne à l'autre, le personnage de la fenêtre repart de zéro. Avant, la marche de celui qui
  // s'en allait continuait sur l'image suivante : son corps en pied revenait, à l'échelle du buste, sur le nouveau venu
  // (« le géant coupé en haut », avec presque tous les personnages).
  remettrePerso() {
    const p = this.perso;
    if (p.marche) { p.marche.remove(); p.marche = null; }
    p.phaseMarche = null;
    this.tweens.killTweensOf(p);
    p.setCrop().setAngle(0).setFlipX(false).setAlpha(1).clearTint().setOrigin(0.5, 1);
  }

  voyageurSuivant() {
    this.buste = null;
    this.remettrePerso();
    this.entree = null;
    this.voyageur = null;
    this.enService = false;
    this.actionB = null;
    this.majBoutonsService();
    if (this.carnetPose) { this.carnetPose.destroy(); this.carnetPose = null; }
    if (this.ficheInspection) { this.ficheInspection.destroy(); this.ficheInspection = null; }
    if (this.ficheMarchandage) { this.ficheMarchandage.destroy(); this.ficheMarchandage = null; }
    if (this.ficheMise) { this.ficheMise.destroy(); this.ficheMise = null; }
    if (this.ficheCollection) { this.ficheCollection.destroy(); this.ficheCollection = null; }
    if (this.feuilleConseil) { this.feuilleConseil.destroy(); this.feuilleConseil = null; }
    this.majPanneauGauche();
    this.majStock();
    this.dessinerPieces();
    // (v0.86) l'heure de fermer : les clients qui attendent s'en vont (ou reviendront demain)
    const G = this.G;
    if (G.fermeLe !== G.jour && G.jour > 1 && heureDuComptoir(G) >= heureFermeture(G) && G.file.some(e => e.type === 'client' || e.type === 'colporteur')) return this.annoncerFermeture();
    if (this.G.file.length === 0) return this.finDeJournee();

    const entree = this.entree = this.G.file.shift();
    if (entree.vole && this.clientVole) return this.clientVole(entree);   // (v1.11) attiré par le paon : il file chez le voisin
    // Un client mis en attente retrouve son colis commencé (et ce que tu y as glissé).
    this.colis = entree.colis || {};
    this.pieges = entree.pieges || {};
    this.bouton('...', null);
    this.majCommande();
    // (v1.22) un pigeon se pose sur le rebord : personne ne s'avance
    if (entree.type === 'detresse') {
      this.perso.setVisible(false);
      const place = this.fileSprites.shift(); if (place) place.destroy();
      // (v1.31) la file avance quand même d'une place
      this.fileSprites.forEach((sprite, i) => {
        sprite.setVisible(!sprite.estPigeon);
        this.tweens.add({ targets: sprite, x: FILE.x - i * FILE.ecart, duration: 900, delay: 300 + i * 150, ease: 'Sine.easeInOut', onStart: () => sprite.estPigeon || pasDeMarche(this, sprite, 900) });
      });
      this.majFileAttente();
      return this.visiteDetresse(entree);
    }
    // Un carnet laissé par la Faucheuse : personne ne s'avance, il est déjà là.
    if (entree.type === 'carnet') {
      this.perso.setVisible(false);
      return this.arrivee(entree);
    }
    const faucheuse = entree.type === 'faucheuse';
    Son.jouer(faucheuse ? 'froid' : 'clochette');
    if (faucheuse) Son.ambiance('faucheuse');
    // (v0.86) une heure avant la fermeture, on prévient (une fois)
    let soir = '';
    if (G.fermeLe !== G.jour && G.alerteSoir !== G.jour && G.jour > 1 && heureDuComptoir(G) >= heureFermeture(G) - JOURNEE.alerte) {
      G.alerteSoir = G.jour;
      soir = `Le soleil décline : le comptoir ferme à ${formatHeure(heureFermeture(G))}. `;
    }
    this.raconter(faucheuse ? "Le froid tombe d'un coup. Les bougies vacillent..." : soir + "Quelqu'un approche du comptoir...");
    this.majFileAttente();
    this.perso.setVisible(true).setAlpha(1);
    if (faucheuse) this.assombrir(entree);

    // Le premier de la file s'avance jusqu'au comptoir...
    const premier = this.fileSprites.shift();
    const departX = premier ? premier.x : FILE.x;
    this.buste = null;
    const cle = this.texturePour(entree);
    this.perso.setTexture(cle).setFlipX(false).setAngle(0)
      .setPosition(departX, FILE.y).setScale(FILE.echelle * echelleCorps(cle));
    if (premier) premier.destroy();
    // ... et les autres avancent d'une place.
    this.fileSprites.forEach((sprite, i) => {
      sprite.setVisible(!sprite.estPigeon);
      this.tweens.add({ targets: sprite, x: FILE.x - i * FILE.ecart, duration: 900, delay: 300 + i * 150, ease: 'Sine.easeInOut',
        onStart: () => sprite.estPigeon || pasDeMarche(this, sprite, 900) });
    });

    if (faucheuse) {
      // La Faucheuse ne marche pas : elle glisse jusqu'à la fenêtre.
      this.tweens.add({
        targets: this.perso, x: FENETRE.x + FENETRE.w / 2, y: SOL_COMPTOIR, duration: 1200, ease: 'Sine.easeOut',
        scale: terreurFaucheuse(this.G, entree.partis.length).echelle,
        onComplete: () => this.arrivee(entree),
      });
      return;
    }
    // Les autres : leur silhouette s'avance vers la fenêtre... puis on le voit de près, en buste.
    // (v1.61) il marche jusqu'au comptoir à sa taille (un peu plus grand en approchant), et s'efface quand le buste
    // monte : avant, la silhouette grossissait huit fois, la tête sortait par le haut et les jambes dépassaient en bas.
    const f = echelleCorps(this.texturePour(entree));
    const marcheur = this.add.image(departX, FILE.y, this.texturePour(entree)).setOrigin(0.5, 1).setScale(FILE.echelle * f).setDepth(1.5);
    marcheur.setMask(this.masqueFenetre);
    pasDeMarche(this, marcheur, 700);
    this.tweens.add({ targets: marcheur, x: FENETRE.x + FENETRE.w / 2, scale: FILE.echelle * f * 1.15, duration: 700, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: marcheur, alpha: 0, delay: 600, duration: 300, onComplete: () => marcheur.destroy() });
    this.montrerBuste(this.personneDe(entree), this.expressionArrivee(entree));
    // Il dit bonjour (ou grogne, si c'est une famille en colère ou la Faucheuse)
    this.time.delayedCall(260, () => { if (this.buste) Son.jouer('voix', { personne: this.buste.personne, ton: this.buste.expression === 'fache' ? 'grogne' : entree.type === 'faucheuse' ? 'grogne' : 'bonjour' }); });
    // (v1.61) le buste monte de derrière le comptoir, à sa taille (pas de zoom)
    const yBuste = this.perso.y;
    this.perso.setAlpha(0).setY(yBuste + 26);
    this.tweens.add({
      targets: this.perso, alpha: 1, y: yBuste, duration: 450, delay: 620, ease: 'Sine.easeOut',
      onComplete: () => this.arrivee(entree),
    });
  }

  // Un visiteur notable vient te féliciter d'avoir franchi un palier de réputation, et t'apporte
  // la récompense : une promesse, une prime, une décoration, ou de nouvelles visites.
  visiteNotable(entree) {
    const G = this.G;
    const p = PALIERS_CLIENTS[entree.palier];
    const qui = { bourgmastre: 'Odilon Bonnefoi, bourgmastre', heraut: 'Le héraut de la Confrérie du Dernier Rempart', colporteur: COLPORTEUR.nom, legende: "Isolde Lame-d'Aurore, légende vivante" }[p.visiteur];
    const bonjour = {
      bourgmastre: `Bonjour, ${nomJoueur(G, 'petit')} ! Tout le bourg parle de « ${G.nomShop} » : on dit maintenant « ${p.nom} » ! Je tenais à te féliciter en personne.`,
      heraut: `Oyez ! La Confrérie du Dernier Rempart salue « ${G.nomShop} », désormais « ${p.nom} ». Ton nom est inscrit dans nos registres.`,
      colporteur: `Alors c'est ici, le fameux comptoir ? On en parle sur tous les chemins ! « ${p.nom} », rien que ça ! Bravo. Je passerai te voir avec ma charrette.`,
      legende: `On m'avait parlé de toi, ${nomJoueur(G, 'petit')}. « ${p.nom} », tenu par quelqu'un de si jeune... J'ai voulu voir ça de mes yeux. Je ne suis pas déçue.`,
    }[p.visiteur];
    this.titreCommande.setFontSize(17).setText('Un visiteur notable');
    Son.jouer('fanfare');
    this.dire(bonjour, qui);
    this.exprimer('content');
    this.bouton('« Merci ! »', () => {
      const apporte = recompensePalier(G, entree.palier);
      this.dire(apporte ? `En l'honneur de ton nouveau palier, voici ${apporte}. Continue comme ça !` : 'Continue comme ça !', qui);
      this.cameras.main.flash(250, 255, 240, 160);
      this.majStock(); this.dessinerPieces();
      this.bouton('Au revoir !', () => { this.bouton('...', null); this.partirPar(FENETRE.x - 80); });
    });
  }

  // --- Étape 9d : Garrick repasse prendre des nouvelles ---
  visiteGarrick(entree) {
    if (entree.sceau) return this.avertissementSceau();
    const G = this.G, visite = GARRICK_VISITES[entree.i];
    G.garrickVu = [...(G.garrickVu || []), entree.i];
    this.titreCommande.setFontSize(17).setText('Une visite');
    this.dire(visite.texte, 'Garrick Cœur-de-Chêne');
    this.bouton('« Merci, Garrick ! »', () => {
      if (visite.cadeau) { encaisser(G, visite.cadeau, 'cadeau'); this.dessinerPieces(); }
      this.dire(visite.cadeau ? `Garrick glisse ${visite.cadeau} pièces sur le comptoir. « Ne dis rien, ha ha ! Allez, au travail, petit${eJ()}. »` : `« Allez, au travail, petit${eJ()}. Je repasserai ! »`, 'Garrick Cœur-de-Chêne');
      this.bouton('Au revoir !', () => { this.bouton('...', null); this.partirPar(FENETRE.x - 80); });
    });
  }

  // (v0.90) Garrick, deux pièces avant la fin de l'armure : la dernière scellera ton camp (la lumière, l'ombre... ou rien)
  avertissementSceau() {
    const G = this.G, serment = sermentDe(G), j = jaugeCamp(G);
    G.garrickSceau = true;
    this.titreCommande.setFontSize(17).setText('Une visite');
    const n = G.armure.length, total = ARMURE.length;
    const lettres = ['Zéro', 'Une', 'Deux', 'Trois', 'Quatre', 'Cinq', 'Six', 'Sept', 'Huit', 'Neuf', 'Dix'], rang = ['', 'première', 'deuxième', 'troisième', 'quatrième', 'cinquième', 'sixième', 'septième', 'huitième', 'neuvième', 'dixième'];
    this.dire(`${lettres[n] || n} pièces de l'armure, déjà... Écoute-moi bien : à la ${rang[total] || total + 'e'}, ton camp sera scellé, pour de bon. La lumière, l'ombre... ou rien du tout. Réfléchis avant de la recevoir.`, 'Garrick Cœur-de-Chêne');
    this.bouton('« Rien du tout ? »', () => {
      this.dire(serment ? `« Tu as juré ${serment === 'bien' ? 'à la Confrérie' : 'aux Bannis'}. Un serment, ça se garde... ou ça se paie. Mais réfléchis bien à qui tu as donné ta parole. »`
        : Math.abs(j) < PALIERS_JAUGE[0] ? "« Si tu restes entre les deux, sans avoir juré à personne, l'armure ira à quelqu'un d'autre. Je ne sais pas si ce serait une bonne chose... ni pour toi, ni pour le monde. »"
          : `« Aujourd'hui, ta balance penche ${j > 0 ? 'vers la lumière' : "vers l'ombre"}. Ce n'est pas encore gravé dans le métal. Après la dernière pièce, ça le sera. »`, 'Garrick Cœur-de-Chêne');
      this.bouton('« Merci, Garrick. »', () => { this.bouton('...', null); this.partirPar(FENETRE.x - 80); });
    });
  }

  // --- (v0.56) Un aîné des Bannis : une phrase, et il repart (on le prend pour un vieux radoteur) ---
  visiteAine(entree) {
    const a = AINES[entree.race];
    this.titreCommande.setFontSize(17).setText('Un vieux voyageur');
    this.dire(a.phrase, a.nom);
    this.bouton('« ... »', () => {
      this.dire(`${a.nom} repart à petits pas, appuyé${a.feminin ? 'e' : ''} sur sa canne. Dans la rue, quelqu'un rit : « Encore ${a.feminin ? 'une vieille' : 'un vieux'} qui radote. »`);
      this.bouton('...', null);
      this.time.delayedCall(2200, () => this.partirPar(FENETRE.x - 80));
    });
  }

  // --- Étape 9d : la garde de la Confrérie ---
  // Le capitaine (et un garde d'un peuple de la lumière, dans la file) : une amende la première
  // fois, une fouille ensuite. On peut payer, ou tenter de soudoyer le garde avec un trésor.
  visiteGarde(entree) {
    const G = this.G, garde = entree.garde || gardeDuJour(G), cap = GARDE.capitaine.nom;
    const v = visiteGarde(G);
    this.titreCommande.setFontSize(17).setText('La garde de la Confrérie');
    const motif = palierCamp(G) <= -1 ? "On dit que ton comptoir fait affaire avec les Bannis." : "On a reçu une plainte contre ton comptoir.";
    const saisie = v.saisis.length ? ` Nous saisissons : ${v.saisis.join(', ')}.` : v.fouille ? ' Mes hommes ont fouillé ta réserve : rien d\'interdit... pour cette fois.' : '';
    const fache = v.colere ? " Et tu croyais qu'on oublierait l'enveloppe ?" : '';
    this.dire(`${motif}${fache} ${v.fouille ? 'Fouille !' : 'Premier avertissement.'}${saisie} L'amende : ${v.amende} pièces${v.caisse ? ', dont une lourde part pour la contrebande' : ''}${v.colere ? ' (doublée)' : ''}. ${garde.nom} est avec moi.`, cap);
    // (v1.29) la cave du repaire : ce que la fouille n'a pas trouvé sous la trappe
    if (v.cave > 0) this.time.delayedCall(900, () => gainEnDirect(this, FENETRE.x + FENETRE.w / 2, FENETRE.y + 60, `Saisie évitée (la cave) : ${v.cave} objet${v.cave > 1 ? 's' : ''} à l'abri`, true));
    const partir = () => { this.actionB = null; this.majBoutonsService(); this.bouton('...', null); this.time.delayedCall(1800, () => this.partirPar(FENETRE.x - 80)); };
    const finir = (texte) => {
      this.actionB = null; this.majBoutonsService(); this.dire(texte, cap); this.majStock(); this.dessinerPieces();
      // (v0.60) si tu es tenu par la Main Noire : le capitaine tend la perche
      if (!enMafia(G)) return partir();
      this.bouton('...', null);
      this.time.delayedCall(1600, () => {
        this.dire(`Le capitaine baisse la voix : « On sait que ${nomBande(G)} te tient. Si tu parles, la Confrérie efface ta dette envers eux... et te protège. Enfin, on essaiera. »`, cap);
        this.choix([`Dénoncer ${nomBande(G)}`, () => {
          denoncerMafia(G); Son.jouer('cloche'); this.dessinerPieces();
          this.dire(`Tu racontes tout. Le capitaine prend des notes, longtemps. « Demain, on frappe. Garde la tête basse quelque temps. » (Dette effacée, +2 de réputation. Mais la bande n'oublie pas...)`, cap);
          partir();
        }], ['Je n\'ai rien à dire', () => { this.dire('« Comme tu voudras. La porte de la Confrérie reste ouverte. »', cap); partir(); }]);
      });
    };
    const payerEtPartir = () => { payerAmende(G, v.amende); Son.jouer('pieces'); finir(`Bien. Que je ne t'y reprenne pas. La Confrérie a l'œil sur toi.`); };
    const tresors = tresorsPourSoudoyer(G, garde);
    if (!tresors.length) { this.bouton(`Payer l'amende (${v.amende} p.)`, payerEtPartir); return; }
    const proposer = (i) => {
      const t = tresors[i];
      const chance = chanceSoudoiement(G, garde, t);
      const mot = chance >= 0.75 ? 'très bonnes' : chance >= 0.55 ? 'bonnes' : 'moyennes';
      this.dire(`(Tu peux glisser un trésor de ton atelier à ${garde.nom}, discrètement. ${t.nom} : chances ${mot}.)`, '');
      this.choix([`Glisser : ${t.nom}`, () => {
        const r = soudoyer(G, garde, t);
        if (r.reussi) { Son.jouer('trefle'); this.exprimer('neutre'); finir(`${garde.nom} se penche à l'oreille du capitaine... « Bon. Une erreur, sans doute. On s'en va. » (Pas d'amende.)`); }
        else { payerAmende(G, v.amende); this.exprimer('fache'); finir(`« Tu crois qu'on s'achète ? » L'amende est payée${r.perdu ? `, et ${garde.nom} garde ${t.nom} « comme preuve »` : ''}.`); }
      }], [i + 1 < tresors.length && i < 2 ? 'Un autre trésor ▸' : 'Finalement, payer', () => (i + 1 < tresors.length && i < 2 ? proposer(i + 1) : payerEtPartir())]);
    };
    this.choix([`Payer l'amende (${v.amende} p.)`, payerEtPartir], ['Soudoyer le garde…', () => proposer(0)]);
  }

  // --- (v0.60) La Main Noire : le collecteur, ses services, la sortie ---
  visiteCollecteur(entree) {
    const G = this.G, bande = NomBande(G);
    // (audit v0.61) dénoncée plus tôt dans la journée : personne ne vient
    if (!enMafia(G)) { this.bouton('...', null); return this.partirPar(FENETRE.x - 80); }
    // (audit v0.61) chez le Serpent, c'est Corvin le Crotale qui passe prendre la part
    const col = collecteurDe(G), qui = col.nom, pre = prenomDe(col.nom);
    const rang = rangMafia(G);
    const partir = () => { this.actionB = null; this.majBoutonsService(); this.dessinerPieces(); this.majStock(); this.bouton('...', null); this.time.delayedCall(1800, () => this.partirPar(FENETRE.x - 80)); };
    this.titreCommande.setFontSize(17).setText(`${bande} · ${nomRangMafia(rang)}`);
    for (let t = 16; this.titreCommande.width > 235 && t >= 11; t--) this.titreCommande.setFontSize(t);
    const sortie = () => {
      const prix = prixLiberte(G);   // (v1.27 : avant, le rachat du paon portait le même nom et coûtait 3000 p. et plus)
      this.dire(`${pre} ne cille pas. « Sortir ? Ça se paie. ${prix} pièces. Et ton nom disparaît de nos registres. »`, qui);
      this.choix([`Racheter ta liberté (${prix} p.)`, () => {
        const err = racheterLiberte(G);
        if (err) { Son.jouer('refus'); this.dire(`« ${err} Reviens quand tu les auras. »`, qui); return partir(); }
        Son.jouer('pieces'); this.dire(`${pre} compte les pièces, une à une, en silence. « Te voilà libre. Nous ne nous sommes jamais vus. » La porte se referme sans un bruit.`, qui); partir();
      }], ['Non, oublie', () => { this.dire('« Alors rien ne change. »', qui); partir(); }]);
    };
    // (v1.22) le corbeau d'un message de détresse : le service dû
    if (entree.du && entree.service) {
      const s = SERVICES_MAFIA[entree.service];
      this.dire(`« Notre corbeau a porté ton paquet. À ton tour. » ${s.demande}`, qui);
      this.choix([`Rendre le service (${s.nom.toLowerCase()})`, () => {
        const msg = rendreService(G, entree.service, true);
        Son.jouer('glisse');
        this.dire(`${pre} hoche à peine la tête. « Nous sommes quittes. »${msg ? ' ' + msg : ''}`, qui);
        partir();
      }, null, 'mal'], ['Refuser', () => { refuserPizzo(G); this.exprimer('fache'); this.dire(`« On ne refuse rien à ${nomBande(G)}. » ${pre} sort sans un mot de plus. Cette nuit, garde un œil sur ta vitrine...`, qui); partir(); }]);
      return;
    }
    if (rang >= 2) {
      const part = partLieutenant(G);
      encaisser(G, part, 'pizzo');
      Son.jouer('pieces');
      this.dire(`« Lieutenant. » ${pre} pose une bourse sur le comptoir : ${part} pièces. « Ta part de la semaine. Pas un mot. »`, qui);
      this.choix(['Prendre la bourse', partir], ['Je veux en sortir…', sortie]);
      return;
    }
    const pizzo = montantPizzo(G);
    if (entree.service) {
      const s = SERVICES_MAFIA[entree.service];
      this.dire(`« ${bande} a besoin de toi. » ${s.demande} « Fais-le, et ta part de la semaine est réglée. »`, qui);
      this.choix([`Rendre le service (${s.nom.toLowerCase()})`, () => {
        const msg = rendreService(G, entree.service);
        Son.jouer('glisse');
        this.dire(`${pre} hoche à peine la tête. « Bien. »${msg ? ' ' + msg : ''} (La balance penche vers l'ombre, et la garde pourrait s'y intéresser.)`, qui);
        partir();
      }, null, 'mal'], [`Payer plutôt (${pizzo} p.)`, () => { payerPizzo(G); Son.jouer('pieces'); this.dire('« L\'argent fera l\'affaire. Cette fois. »', qui); partir(); }]);
      return;
    }
    this.dire(`« ${bande} protège ton comptoir. La protection a un prix : ${pizzo} pièces cette semaine. » ${pre} pose un long regard sur ta vitrine. « Les vitres sont fragiles, par ici. »`, qui);
    this.choix([`Payer (${pizzo} p.)`, () => { payerPizzo(G); Son.jouer('pieces'); this.dire('« Sept jours. »', qui); partir(); }],
      [rang >= 1 ? 'Je veux en sortir…' : 'Refuser de payer', () => {
        if (rang >= 1) return sortie();
        refuserPizzo(G); this.exprimer('fache');
        this.dire(`${pre} ne dit rien. Il remet sa capuche, et sort. Cette nuit, garde un œil sur ta vitrine...`, qui); partir();
      }]);
  }

  // Le Serpent à deux têtes : ses deux chefs veulent te débaucher
  visiteSerpent() {
    const G = this.G, [vesna, corvin] = CHEFS_SERPENT;
    if (!enMafia(G)) { this.bouton('...', null); return this.partirPar(FENETRE.x - 80); }   // (audit v0.61)
    this.titreCommande.setFontSize(17).setText('Le Serpent à deux têtes');
    this.dire(`« On t'a vu${eJ()} travailler pour la Main Noire. » ${vesna.nom} parle bas, sans un sourire ; derrière elle, ${corvin.nom} garde la main sur son arc. « Le Serpent prend moins, et paie mieux. Choisis. On ne posera pas la question deux fois. »`, vesna.nom);
    const partir = () => { this.actionB = null; this.majBoutonsService(); this.bouton('...', null); this.time.delayedCall(1800, () => this.partirPar(FENETRE.x - 80)); };
    this.choix(['Rester fidèle à la Main Noire', () => {
      choisirBande(G, 'main');
      this.dire(`${corvin.nom} se lève. « Le Serpent a deux têtes. Et il n'oublie rien. » (Ils se vengeront cette nuit.)`, corvin.nom); partir();
    }], ['Rejoindre le Serpent', () => {
      choisirBande(G, 'serpent');
      this.dire(`${vesna.nom} te serre la main, longuement ; ${corvin.nom} pose la sienne par-dessus. « Tu es des nôtres. La Main Noire l'apprendra vite. Tiens-toi prêt${eJ()}. » (Elle se vengera cette nuit.)`, vesna.nom); partir();
    }]);
  }

  // Le colporteur passe avec sa hotte : des choses rares, un peu plus cher qu'au marché.
  visiteColporteur(entree) {
    this.titreCommande.setFontSize(17).setText('Le colporteur');
    this.dire("Salut, l'ami ! J'ai de belles choses dans ma hotte aujourd'hui. Un coup d'œil ? C'est un peu plus cher qu'au marché, mais c'est là, sous ton nez.", COLPORTEUR.nom);
    this.choix(['Voir sa marchandise', () => { this.scene.pause(); this.scene.launch('Express', { comptoir: this, vendeur: 'colporteur' }); }],
      ['Pas aujourd\'hui', () => { this.dire('Comme tu veux ! Je repasserai.', COLPORTEUR.nom); this.bouton('...', null); this.partirPar(FENETRE.x - 80); }]);
  }

  // (v1.23, planche 48 v2) Le collectionneur : il veut la pièce qui te manquerait le plus, et la paie très cher
  visiteCollectionneur(entree) {
    const G = this.G, v = entree.voulue, qui = `${COLLECTIONNEUR.nom}`;
    this.titreCommande.setFontSize(17).setText('Le collectionneur');
    if (!v || !aPiece(G, v.serie, v.piece)) {
      this.dire("« Ah... La pièce que je cherchais n'est plus dans votre vitrine. Tant pis. Une autre fois, peut-être. »", qui);
      this.bouton('Au revoir', () => { this.bouton('...', null); this.partirPar(FENETRE.x - 80); });
      return;
    }
    const C = COLLECTIONS[v.serie], n = nbPieces(G, v.serie), total = totalSerie(v.serie);
    creerEmblemesHD(this);
    const f = this.ficheCollection = this.add.container(793, 150).setScale(0.88).setDepth(20);
    f.add(this.add.image(0, 0, panneauHD(this, 236, 214)).setScale(2));
    f.add(this.add.text(0, -84, 'Il veut ta pièce', style(16, '#5a0e0e', { fontStyle: 'bold' })).setOrigin(0.5));
    const o = dessinerPieceCollection(this, v.serie, v.piece, 0, 0, 1.5, true); o.setPosition(0, -40); f.add(o);
    f.add(this.add.text(0, 2, v.nom, style(12, '#3b2410', { fontStyle: 'bold', align: 'center', wordWrap: { width: 210 } })).setOrigin(0.5));
    f.add(this.add.text(0, 30, `Vendre : ${v.prix} p.`, style(17, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
    f.add(this.add.text(0, 56, `${C.nom.replace(/^Les |^La /, m => m.toLowerCase())} ${n === total ? 'ne seront plus complets' : 'repassent'} à ${n - 1} / ${total}`, style(11, '#a03030', { fontStyle: 'italic', align: 'center', wordWrap: { width: 210 } })).setOrigin(0.5));
    f.add(this.add.text(0, 80, n === total ? `(et le titre « ${C.titre} » s'en irait)` : '(il faudra en retrouver une)', style(10, '#6b4a2a', { fontStyle: 'italic', align: 'center', wordWrap: { width: 210 } })).setOrigin(0.5));
    const nomCourt = v.nom.charAt(0).toLowerCase() + v.nom.slice(1);
    this.dire(`« ${nomCourt.replace(/^l'|^le |^la |^les /, m => (m === "l'" ? 'Cet ' : m === 'le ' ? 'Ce ' : m === 'la ' ? 'Cette ' : 'Ces '))}, dans votre vitrine... ${v.prix} pièces, et je l'emporte ce soir. Vous ne me refuserez pas ? »`, qui);
    this.choix([`Vendre (${v.prix} p.)`, () => {
      const msg = vendreAuCollectionneur(G, v);
      Son.jouer('pieces', { montant: v.prix }); this.dessinerPieces();
      this.dire(`« Merveilleux ! Elle sera en de bonnes mains. »${msg ? ' ' + msg : ''}`, qui);
      this.bouton('Au revoir', () => { this.bouton('...', null); this.partirPar(FENETRE.x - 80); });
    }], ['Garder ma pièce', () => {
      this.exprimer('inquiet');
      this.dire("« Dommage... Je repasserai. Les collectionneurs sont patients, vous savez. »", qui);
      this.bouton('Au revoir', () => { this.bouton('...', null); this.partirPar(FENETRE.x - 80); });
    }]);
  }

  // (v1.23, planche 48 v2) La petite vitrine des collections, posée près de la bourse : un clic l'ouvre
  creerVitrine() {
    const x = 124, y = 490, c = this.add.container(x, y).setDepth(2), g = this.add.graphics();
    g.fillStyle(0x1e1208).fillRoundedRect(-17, -30, 34, 58, 4).fillStyle(0x6a3e1a).fillRoundedRect(-15, -28, 30, 54, 3);
    g.fillStyle(0x24324a).fillRect(-11, -24, 22, 44).fillStyle(0x7a4a22).fillRect(-11, -4, 22, 2).fillRect(-11, 10, 22, 2);
    g.fillStyle(0xc9a227).fillCircle(-5, -10, 3).fillStyle(0xa83a2a).fillRoundedRect(1, -16, 7, 9, 2).fillStyle(0xd8c090).fillTriangle(-7, 7, -1, 2, 2, 8).fillStyle(0xb8c0c8).fillRect(4, 0, 2, 9);
    g.fillStyle(0xffffff, 0.12).fillTriangle(4, -24, 10, -24, -6, 20).fillStyle(0xc9a227).fillRect(-15, -28, 30, 2);
    c.add(g);
    const zone = this.add.rectangle(x, y, 38, 62, 0xffffff, 0).setDepth(2.1).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => { c.setY(y - 2); this.raconter(`La vitrine des collections : ${Object.keys(COLLECTIONS).reduce((n, k) => n + nbPieces(this.G, k), 0)} pièces rangées. Clique pour la regarder.`, 'La vitrine'); });
    zone.on('pointerout', () => c.setY(y));
    zone.on('pointerdown', () => { Son.jouer('page'); this.scene.pause(); this.scene.launch('Vitrine', { retour: 'Comptoir' }); });
  }

  // --- (v1.22, planche 49 v2) Un message de détresse : le pigeon, sa lettre, quatre réponses ---
  visiteDetresse(entree) {
    const G = this.G;
    // (la partie a pu être rechargée : on retrouve la mission elle-même, pas sa copie)
    const p = G.partis.find(x => x.voyageur.id === entree.parti.voyageur.id && x.depart === entree.parti.depart) || entree.parti;
    if (!p.detresse) p.detresse = entree.parti.detresse;
    const v = p.voyageur, prenom = prenomDe(v.nom);
    this.titreCommande.setFontSize(17).setText('Un message');
    this.avancer(JOURNEE.visite);
    // il arrive à tire-d'aile par la droite, puis se pose sur le rebord de la fenêtre et picore
    const rebord = { x: FENETRE.x + 318, y: FENETRE.y + FENETRE.h + 3 };
    const pg = this.pigeon = this.add.sprite(FENETRE.x + FENETRE.w + 70, FENETRE.y + 30, 'pigeonVolH').setScale(3.2).setOrigin(0.5, 1).setDepth(12).play('volPigeon');
    Son.jouer('oiseaux');
    this.tweens.add({ targets: pg, x: rebord.x, y: rebord.y, duration: 1300, ease: 'Sine.easeOut', onComplete: () => {
      pg.stop(); pg.setTexture('pigeonPose');
      this.becPigeon = this.tweens.add({ targets: pg, angle: { from: -3, to: 5 }, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    } });
    this.raconter(`Un pigeon se pose sur le rebord de la fenêtre, un petit rouleau attaché à la patte. Il vient ${deLieu(ZONES[v.zone] ? ZONES[v.zone].nom : 'loin')} : là où est parti${v.feminin ? 'e' : ''} ${prenom}.`, 'Un message');
    this.bouton('Lire le message', () => this.lettreDetresse(p));
  }

  lettreDetresse(p) {
    const G = this.G, d = p.detresse, v = p.voyageur, id = objetDetresse(G, p);
    this.bouton('...', null);
    const fermer = () => { voile.destroy(); L.destroy(); };
    const voile = this.add.rectangle(480, 270, 960, 540, 0x0a0604, 0.55).setDepth(40).setInteractive();
    const L = this.add.container(480, 262).setDepth(41);
    L.add(this.add.image(0, 0, panneauHD(this, 860, 440)).setScale(2));
    const lettre = this.add.text(0, -186, lettreDetresse(p), style(15, '#3b2410', { fontStyle: 'italic', align: 'center', wordWrap: { width: 780 } })).setOrigin(0.5);
    L.add(lettre);
    L.add(this.add.text(0, lettre.y + lettre.height / 2 + 2, `— un berger ${deLieu(ZONES[v.zone] ? ZONES[v.zone].nom : 'là-bas')}`, style(12, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5, 0));
    const n = Math.min(d.qte, 4);
    for (let k = 0; k < n; k++) L.add(this.add.image(-60 + k * 30 - (n - 2) * 15, -126, iconeObjet(this, id)).setScale(2));
    L.add(this.add.text(-30 + n * 15, -126, `× ${d.qte} (dans ton stock : ${G.stock[id] || 0})`, style(13, '#3b2410', { fontStyle: 'bold' })).setOrigin(0, 0.5));
    const etoiles = etoilesDetresse(p), objets = d.arme ? 'l\'arme' : `${nomObjet(id).toLowerCase()}${d.qte > 1 && !/[sx]$/.test(nomObjet(id)) ? 's' : ''}`;
    const CARTES = [
      ['aigle', 'aigleVolM', "L'aigle du Conseil", `${prixDetresse(p, 'aigle')} p. + ${objets}`, 'Sûr : il arrive toujours.', `${DETRESSE.aigle.parEtoile} p. × ${etoiles} étoile${etoiles > 1 ? 's' : ''}. Pas pour un Banni.`, 0x2a4a8a],
      ['mercenaire', null, 'Un mercenaire', `${prixDetresse(p, 'mercenaire')} p. + ${objets}`, 'Il arrive 4 fois sur 5. Une heure de ta journée.', `${DETRESSE.mercenaire.parEtoile} p. × ${etoiles} étoile${etoiles > 1 ? 's' : ''}. Pour tout le monde.`, 0x8a6a3a],
      ['corbeau', 'corbeauPose', 'Le corbeau de la Main Noire', `${prixDetresse(p, 'corbeau')} p. + ${objets}`, 'Sûr et pas cher...', 'mais tu leur devras un service. (ombre)', 0x5a2a6a],
      ['rien', null, 'Ne rien faire', '0 p.', `Ses chances baissent de ${Math.round(DETRESSE.malusRien * 100)} % sur cette épreuve.`, 'Le pigeon repart sans réponse.', 0xa01818],
    ];
    CARTES.forEach(([choix, tex, nom, prix, l1, l2, coul], i) => {
      const ok = peutSecourir(G, p, choix);
      const c = this.add.container(-306 + i * 204, 40);
      const fond = this.add.rectangle(0, 0, 196, 250, ok.ok ? 0xf3e6c8 : 0xe0d6c0).setStrokeStyle(3, coul);
      c.add(fond);
      if (tex) c.add(this.add.image(0, -78, tex).setScale(tex === 'aigleVolM' ? 1.6 : 3));
      else if (choix === 'mercenaire') c.add(imageCorps(this, 0, -44, { race: 'humain', nom: 'Mercenaire', niveau: 'veteran' }, 4.4));
      else c.add(this.add.text(0, -78, '✕', style(40, '#a01818', { fontStyle: 'bold' })).setOrigin(0.5));
      c.add(this.add.text(0, -26, nom, style(15, '#3b2410', { fontStyle: 'bold', align: 'center', wordWrap: { width: 180 } })).setOrigin(0.5));
      c.add(this.add.text(0, 6, prix, style(14, '#5a0e0e', { fontStyle: 'bold' })).setOrigin(0.5));
      c.add(this.add.text(0, 42, l1, style(12, '#3b2410', { align: 'center', wordWrap: { width: 180 } })).setOrigin(0.5));
      c.add(this.add.text(0, 92, ok.ok ? l2 : ok.raison, style(11, ok.ok ? '#6b4a2a' : '#8a1a1a', { fontStyle: 'italic', align: 'center', wordWrap: { width: 180 } })).setOrigin(0.5));
      if (!ok.ok) { c.setAlpha(0.6); L.add(c); return; }
      fond.setInteractive({ useHandCursor: true })
        .on('pointerover', () => fond.setFillStyle(0xfff4d8)).on('pointerout', () => fond.setFillStyle(0xf3e6c8))
        .on('pointerdown', () => { fermer(); this.repondreDetresse(p, choix); });
      L.add(c);
    });
    L.add(this.add.text(0, 196, 'Clique sur une réponse. Le corbeau ne vient que si tu as affaire à la Main Noire.', style(11, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5));
  }

  repondreDetresse(p, choix) {
    const G = this.G, avant = chanceDeRetour(p.voyageur, p.colis, p.pieges);
    const texte = repondreDetresse(G, p, choix);
    const apres = chanceDeRetour(p.voyageur, p.colis, p.pieges);
    this.majStock(); this.dessinerPieces(); this.majPanneauGauche();
    if (choix === 'mercenaire') this.avancer(DETRESSE.mercenaire.heure, 'un mercenaire');
    if (choix !== 'mercenaire') {   // (le mercenaire : on ne sait qu'au retour s'il est arrivé)
      const ecart = Math.round((apres - avant) * 100);
      if (ecart) gainEnDirect(this, FENETRE.x + FENETRE.w / 2, FENETRE.y + 120, `${ecart > 0 ? '+' : '−'}${Math.abs(ecart)} % de chances de retour`, ecart > 0);
    }
    if (choix === 'corbeau') pencher(G, 'piege');
    this.raconter(texte, choix === 'rien' ? 'Pas de réponse' : 'Le secours part');
    Son.jouer(choix === 'rien' ? 'froid' : 'glisse');
    // l'oiseau qui part : l'aigle traverse le ciel de gauche à droite, le corbeau s'en va, le pigeon repart
    if (choix === 'aigle' || choix === 'corbeau') {
      const ai = this.add.sprite(FENETRE.x - 60, FENETRE.y + 70, choix === 'aigle' ? 'aigleVolM' : 'corbeauVolH').setScale(choix === 'aigle' ? 2.2 : 2.6).setDepth(1.4)
        .setFlipX(choix === 'corbeau').play(choix === 'aigle' ? 'volAigle' : 'volCorbeau');
      ai.setMask(this.masqueFenetre);
      this.tweens.add({ targets: ai, x: FENETRE.x + FENETRE.w + 80, y: FENETRE.y + 30, duration: 2600, ease: 'Sine.easeIn', onComplete: () => ai.destroy() });
    }
    const pg = this.pigeon;
    this.time.delayedCall(choix === 'rien' ? 1200 : 600, () => {
      if (!pg || !pg.active) return;
      if (this.becPigeon) this.becPigeon.remove();
      this.tweens.killTweensOf(pg);   // (v1.31 : s'il n'avait pas fini de se poser, il ne se fige plus en repartant)
      pg.setAngle(0).play('volPigeon');
      this.tweens.add({ targets: pg, x: FENETRE.x + FENETRE.w + 90, y: FENETRE.y - 30, duration: 1400, ease: 'Sine.easeIn', onComplete: () => pg.destroy() });
    });
    this.bouton('Continuer', () => { this.bouton('...', null); this.voyageurSuivant(); });
  }

  // --- Le client en buste : expressions, clignements, paroles ---

  personneDe(entree) {
    if (entree.type === 'client') return entree.voyageur.apparence || entree.voyageur;   // (v0.86 : un recherché a l'allure de son affiche)
    if (entree.type === 'gardeRecherche') return GARDE.capitaine;
    if (entree.type === 'famille') return entree.visite.parent;
    if (entree.type === 'colporteur') return { nom: COLPORTEUR.nom, race: 'humain', feminin: false, figurant: 'colporteur' };
    if (entree.type === 'garde') return GARDE.capitaine;
    if (entree.type === 'collecteur') return collecteurDe(this.G);
    if (entree.type === 'serpent') return CHEFS_SERPENT[0];
    if (entree.type === 'garrick') return { nom: 'Garrick Cœur-de-Chêne', race: 'humain', feminin: false, figurant: 'mentor' };
    if (entree.type === 'aine') return personneAine(entree.race);
    if (entree.type === 'collectionneur') return COLLECTIONNEUR;
    if (entree.type === 'heraut') return HERAUT_CONSEIL.buste;   // (v1.10) le héraut de la Confrérie, pour le Conseil
    if (entree.type === 'rival') return RIVAL_BUSTE;   // (v1.11) le paon d'à côté
    if (entree.type === 'crieur') return CRIEUR_BUSTE;
    if (entree.type === 'sage') return SAGE_PERSONNE;
    if (entree.type === 'percepteur') return personneDuPercepteur(entree);
    if (entree.type === 'notable') {
      // Le visiteur notable du palier : le bourgmastre, le héraut de la Confrérie, une légende...
      const v = PALIERS_CLIENTS[entree.palier].visiteur;
      if (v === 'legende') return { nom: "Isolde Lame-d'Aurore", race: 'elfe', feminin: true, niveau: 'legende' };
      if (v === 'colporteur') return { nom: COLPORTEUR.nom, race: 'humain', feminin: false, figurant: 'colporteur' };
      return { nom: FIGURANTS[v].nom, race: 'humain', feminin: false, figurant: v }; // (un figurant : bourgmastre, héraut)
    }
    return entree.parti ? entree.parti.voyageur : null;
  }

  // Son humeur en arrivant au comptoir.
  expressionArrivee(entree) {
    if (entree.type === 'retour') return entree.parti.resultat.echec ? 'inquiet' : 'content';
    if (entree.type === 'notable' || entree.type === 'colporteur' || entree.type === 'garrick') return 'content';
    if (entree.type === 'aine') return 'neutre';
    if (entree.type === 'collectionneur') return 'content';
    if (entree.type === 'heraut') return entree.mode === 'livraison' ? 'neutre' : 'content';
    if (entree.type === 'rival' || entree.type === 'crieur' || entree.type === 'sage') return 'content';
    if (entree.type === 'percepteur') return 'neutre';
    if (entree.type === 'collecteur' || entree.type === 'serpent') return 'neutre';
    if (entree.type === 'garde') return (this.G.garde && this.G.garde.visites) ? 'fache' : 'neutre';
    if (entree.type === 'famille') return entree.visite.intention === 'colere' ? 'fache' : entree.visite.intention === 'releve' ? 'neutre' : 'inquiet';
    const v = entree.voyageur;
    if (v.exige) return 'fache';
    if (entree.attentes > 1) return 'fache';
    return niveauRelation(this.G, v.nom).index >= 4 ? 'content' : 'neutre';
  }

  montrerBuste(personne, expression = 'neutre') {
    this.buste = { personne, expression };
    if (this.perso.marche) { this.perso.marche.remove(); this.perso.marche = null; }   // (un buste ne marche pas : voir remettrePerso)
    this.perso.setTexture(textureBusteHD(this, personne, expression)).setOrigin(0.5, 1).setFlipX(false).setAngle(0)
      .setPosition(FENETRE.x + FENETRE.w / 2, FENETRE.y + FENETRE.h + tailleBuste(personne).bas)
      .setScale(BUSTE.echelle * tailleBuste(personne).echelle).setVisible(true);
    if (!this.minuterieCligne) {
      // Il cligne des yeux de temps en temps.
      this.minuterieCligne = this.time.addEvent({ delay: 2600, loop: true, callback: () => {
        if (!this.buste || this.buste.enPied || this.enTrainDeParler || Math.random() < 0.3) return;
        this.perso.setTexture(textureBusteHD(this, this.buste.personne, this.buste.expression, { cligne: true, pose: this.buste.pose }));
        this.time.delayedCall(140, () => this.majVisage());
      } });
    }
  }

  majVisage(parle = false) {
    if (!this.buste || this.buste.enPied) return;   // (le Grand Sage : son vrai dessin, en pied, ne change pas de visage)
    this.perso.setTexture(textureBusteHD(this, this.buste.personne, this.buste.expression, { parle, pose: this.buste.pose }));
  }

  exprimer(expression) {
    if (!this.buste || this.buste.expression === expression) return;
    this.buste.expression = expression;
    this.majVisage();
    // Son humeur s'entend : un petit mot fâché, déçu ou ravi
    const ton = { fache: 'fache', inquiet: 'decu', content: 'content' }[expression];
    if (ton && !this.enTrainDeParler) Son.jouer('voix', { personne: this.buste.personne, ton });
  }

  // La bouche bouge pendant qu'il parle.
  parler(duree) {
    if (!this.buste) return;
    if (this.paroles) this.paroles.remove();
    Son.jouer('voix', { personne: this.buste.personne, duree: duree / 1000 });
    this.enTrainDeParler = true;
    let ouverte = false, temps = 0;
    const paroles = this.paroles = this.time.addEvent({ delay: 110, loop: true, callback: () => {
      if (this.paroles !== paroles) { paroles.remove(); return; } // interrompu (il s'est retourné)
      temps += 110;
      ouverte = temps < duree && !ouverte;
      this.majVisage(ouverte);
      if (temps >= duree) { paroles.remove(); this.paroles = null; this.enTrainDeParler = false; this.majVisage(); }
    } });
  }

  arrivee(entree) {
    Son.jouer('pas');
    // (v0.86) une visite prend un quart d'heure (les clients, eux, comptent au service)
    if (['famille', 'notable', 'colporteur', 'garde', 'gardeRecherche', 'garrick', 'collecteur', 'serpent', 'aine', 'heraut', 'rival', 'crieur', 'collectionneur', 'sage', 'percepteur'].includes(entree.type)) this.avancer(JOURNEE.visite);
    if (entree.type === 'client') {
      // (v1.40) le Jour Zéro : le premier client, pas à pas (sinon le conseil de Garrick, une fois)
      if (jourZero(this.G) && didacticiel(this.G) && this.G.jourZeroEtape === 'client') this.time.delayedCall(1600, () => guideClient(this, 'commande'));
      else conseilGarrick(this, 'comptoir');
      const v = this.voyageur = entree.voyageur;
      if (v.recherche && !entree.decide) return this.accueilRecherche(entree);   // (v0.86) une tête mise à prix ?
      if (v.anniversaire === this.G.jour && !entree.anniversaireVu && !entree.attentes) { entree.anniversaireVu = true; return this.feteAnniversaire(v, entree); }   // (v1.54) son anniversaire
      this.preparerTutoriel(v);
      // Un client prestigieux vérifie d'abord que tu es à la hauteur
      if (v.prestige && !entree.attentes) {
        const refus = refusPrestige(this.G, v);
        this.titreCommande.setFontSize(17).setText('Un client prestigieux');
        if (refus) {
          this.exprimer('fache');
          this.dire(`${refus} (réputation −${String(PERTE_PRESTIGE).replace('.', ',')})`, this.nomAvecRelation(v.nom), v.nom);
          vexerPrestige(this.G, v);
          this.bouton('...', null);
          this.majBoutonsService();
          this.time.delayedCall(2200, () => this.partirPar(FENETRE.x - 80));
          return;
        }
        const e = EXIGENCES[v.prestige.type];
        this.dire(`Hmm. ${e.nom.charAt(0).toUpperCase() + e.nom.slice(1)}... convenable. Voyons si vous êtes à la hauteur de ma commande. Je paie le double, naturellement.`, this.nomAvecRelation(v.nom), v.nom);
        this.choix(['Choisir sa destination', () => this.ouvrirCarte()], ['Refuser ce client', () => this.refuser()]);
        this.majCommande();
        return;
      }
      let bonjour = v.prevu ? "C'est moi qui t'ai écrit, tu te souviens ? " : '';
      if (entree.reporte) bonjour = `Bonjour ! Je suis revenu${v.feminin ? 'e' : ''} dès l'ouverture, comme convenu hier soir. `;
      if (entree.attentes) bonjour = "Me revoilà ! On reprend où on en était ? ";
      if (v.habitue) bonjour = 'Re-bonjour, c\'est encore moi ! ' + (this.aReparer(v).length ? 'Mon matériel a souffert la dernière fois... ' : '');
      if (typeof bonjourDeLAncien === 'function' && !entree.attentes) { const anc = bonjourDeLAncien(this.G, v); if (anc) bonjour = anc + ' '; }   // (v1.12) un ancien de l'orphelinat
      if (v.exige && !entree.attentes) bonjour += "Et après ma dernière mission ratée, tu me dois bien un objet de plus que ma commande ! ";
      // Ce qu'il pense de ton comptoir (ses décorations, ton côté de la jauge)
      const remarque = !entree.attentes && !v.habitue ? remarqueCamp(this.G, v) : null;
      if (remarque) bonjour = remarque + ' ' + bonjour;
      // Un client exigeant prévient après son bonjour : grosse commande, et rien d'usé
      const exigeant = v.exigeant && !entree.attentes && v.queteId ? ` Et je suis exigeant${v.feminin ? 'e' : ''} : une grosse commande, et du matériel neuf, pas de vieilles cordes rafistolées.` : '';
      if (!v.queteId) {
        // Il vient chercher l'aventure : c'est toi qui choisis où l'envoyer.
        this.dire(`${bonjour}${v.accueilImposture && !entree.attentes ? v.accueilImposture : ENVIES[v.envie]} (${nomRang(v.niveau)} : ${EXPLICATION_RANGS[v.niveau]}${v.blessures ? `, encore blessé${v.feminin ? 'e' : ''}` : ''})`, this.nomAvecRelation(v.nom));
        this.choix(['Choisir sa destination', () => this.ouvrirCarte()], ['Refuser ce client', () => this.refuser()]);
        this.majCommande();
        return;
      }
      // Placé sur la carte ce matin : il connaît déjà sa destination.
      const planifie = entree.planifie && !entree.attentes && !(v.accueil || '').includes(ZONES[v.zone].nom) ? `${ZONES[v.zone].nom} ? Va pour ça ! ` : '';
      this.dire(entree.attentes ? bonjour : bonjour + planifie + (v.accueilImposture || accord(v.accueil, v)) + exigeant, this.nomAvecRelation(v.nom));
      this.servir();
    } else if (entree.type === 'retour') {
      const v = entree.parti.voyageur;
      const ancien = typeof retourDeLAncien === 'function' ? retourDeLAncien(this.G, v, entree.parti.resultat.echec) : null;   // (v1.12) un ancien de l'orphelinat
      this.dire(ancien || (entree.parti.resultat.echec ? "Me revoilà... En vie, au moins. Mais ça ne s'est pas passé comme prévu."
        : `Me revoilà, sain${v.feminin ? 'e' : ''} et ${v.feminin ? 'sauve' : 'sauf'} ! Tu ne devineras jamais ce qui m'est arrivé...`), v.nom);
      this.titreCommande.setFontSize(17).setText('Retour de mission');
      // (v0.93, planche 19) plusieurs retours, et l'on connaît déjà les récits : tout résumer d'un coup
      const retours = 1 + this.G.file.filter(e => e.type === 'retour').length;
      if (retours >= 2 && (this.G.recitsVus || 0) > 0) this.choix(['Écouter son récit', () => this.ouvrirRecit(entree.parti), JOURNEE.recit], [`Tout résumer (${retours} retours)`, () => this.resumerRetours()]);
      else this.bouton('Écouter son récit', () => this.ouvrirRecit(entree.parti), JOURNEE.recit);
    } else if (entree.type === 'famille') {
      this.visiteFamille(entree.visite);
    } else if (entree.type === 'notable') {
      this.visiteNotable(entree);
    } else if (entree.type === 'colporteur') {
      this.visiteColporteur(entree);
    } else if (entree.type === 'garde') {
      this.visiteGarde(entree);
    } else if (entree.type === 'gardeRecherche') {
      this.visiteGardeRecherche(entree);
    } else if (entree.type === 'garrick') {
      this.visiteGarrick(entree);
    } else if (entree.type === 'collecteur') {
      this.visiteCollecteur(entree);
    } else if (entree.type === 'serpent') {
      this.visiteSerpent(entree);
    } else if (entree.type === 'aine') {
      this.visiteAine(entree);
    } else if (entree.type === 'heraut') {
      this.visiteHeraut(entree);   // (v1.10) la commande scellée du Conseil
    } else if (entree.type === 'rival') {
      this.visiteRival(entree);   // (v1.11) Lucien Belhomme, le paon d'à côté
    } else if (entree.type === 'sage') {
      this.visiteSage(entree);   // (v1.32, planche 58) le Grand Sage vient remercier son mécène
    } else if (entree.type === 'percepteur') {
      this.visitePercepteur(entree);   // (v1.32) le prix de la neutralité
    } else if (entree.type === 'crieur') {
      this.visiteCrieur(entree);   // (v1.11) le mois des comptoirs
    } else if (entree.type === 'collectionneur') {
      this.visiteCollectionneur(entree);   // (v1.23) il veut une pièce de ta vitrine
    } else if (entree.type === 'faucheuse') {
      this.visiteFaucheuse(entree);
    } else {
      const v = entree.parti.voyageur;
      this.dire(this.G.faucheuse.visites ? `Le carnet de voyage ${dePersonne(v.nom)} est posé sur ton comptoir. Sa couverture est glacée.`
        : `Un berger a rapporté un carnet trouvé sur la route : celui ${dePersonne(v.nom)}... ${v.feminin ? 'Elle' : 'Il'} n'est jamais revenu${v.feminin ? 'e' : ''}.`, '');
      // (v1.62, planche 84) Le carnet de voyage, couché sur le rebord de la fenêtre, vu d'un peu au-dessus :
      // couvert de givre (et d'un halo froid) quand c'est la Faucheuse qui l'a laissé
      creerCarnetsHD(this);
      const givre = !!this.G.faucheuse.visites;
      const cx = FENETRE.x + FENETRE.w / 2, cy = SOL_COMPTOIR + 7;
      const c = this.carnetPose = this.add.container(0, 0).setDepth(3);
      if (givre) { creerHalo(this); c.add(this.add.image(cx, cy - 16, 'halo').setScale(1.1, 0.6).setTint(0x9ad0ff).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD)); }
      c.add(this.add.image(cx, cy, givre ? 'carnetCoucheGivreHD' : 'carnetCoucheHD').setOrigin(0.5, 1).setScale(2));
      this.titreCommande.setFontSize(17).setText('Une mauvaise nouvelle...');
      this.bouton('Lire le carnet', () => this.ouvrirRecit(entree.parti));
    }
  }

  // --- La Faucheuse ---

  // Ce qui reste visible dans l'obscurité : la Faucheuse, ses paroles et tes réponses.
  elementsDansLOmbre() {
    return [this.plumeNarration, this.titreNarration, this.fondDialogue, this.plaqueNom, this.nomParleur, this.sousNom, this.texteDialogue, this.boutonAction.fond, this.boutonAction.label,
      this.boutonRefuser.fond, this.boutonRefuser.label];
  }

  // L'obscurité tombe sur le comptoir. Plus elle a emporté d'âmes, plus c'est terrifiant :
  // nuit plus noire, silhouette plus grande, aura rouge, éclair de sang, battements de cœur.
  assombrir(entree) {
    const t = this.terreur = terreurFaucheuse(this.G, entree.partis.filter(p => !p.recolte).length);
    if (this.ombre) this.ombre.destroy();
    this.ombre = this.add.rectangle(480, 270, 960, 540, 0x05040c, 0).setDepth(4);
    this.tweens.add({ targets: this.ombre, fillAlpha: t.ombre, duration: 1400, ease: 'Sine.easeIn' });
    this.perso.setDepth(5).clearTint();
    for (const o of this.elementsDansLOmbre()) o.setDepth(6);
    this.cameras.main.shake(1400, t.secousse);
    if (t.aura) {
      const x = FENETRE.x + FENETRE.w / 2;
      // Un halo diffus : des cercles de plus en plus grands et de plus en plus pâles.
      this.aura = this.add.container(x, SOL_COMPTOIR - 95).setDepth(4.5);
      for (let k = 0; k < 6; k++) {
        const halo = this.add.ellipse(0, 0, 110 + k * 34, 130 + k * 36, 0xb01010, 0).setBlendMode(Phaser.BlendModes.ADD);
        this.aura.add(halo);
        this.tweens.add({ targets: halo, fillAlpha: t.aura * 0.22, duration: 1400, delay: 600 });
      }
      this.tweens.add({ targets: this.aura, scale: 1.1, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    if (t.index >= 2) this.time.delayedCall(1150, () => this.cameras.main.flash(350, 140, 0, 0));
    if (t.index >= 3) {
      // Un cœur qui bat, lourd, pendant toute sa visite.
      this.battements = this.time.addEvent({ delay: 1300, loop: true, callback: () => {
        this.cameras.main.shake(120, 0.006);
        this.time.delayedCall(220, () => this.cameras.main.shake(120, 0.004));
      } });
    }
  }

  // Elle annonce ceux qui ne reviendront jamais, commente tes choix, paie ou punit,
  // propose parfois un sabotage, laisse leurs carnets, et repart avec l'obscurité.
  visiteFaucheuse(entree) {
    const G = this.G;
    const bilan = recolter(G, entree.partis);
    G.faucheuse.visites++;
    const t = terreurFaucheuse(G);
    const sed = seductionFaucheuse(G);
    const noms = entree.partis.map(p => p.voyageur.nom);
    const enListe = l => l.length > 1 ? l.slice(0, -1).join(', ') + ' et ' + l[l.length - 1] : l[0];
    const plusieurs = noms.length > 1;
    this.titreCommande.setFontSize(17).setText('...');
    this.majStock();
    this.dessinerPieces();
    // Elle flotte, immobile, au-dessus du sol.
    this.flottement = this.tweens.add({ targets: this.perso, y: SOL_COMPTOIR - 8, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const etapes = [];
    const elle = texte => etapes.push({ texte, nom: 'La Faucheuse' });
    const recit = texte => etapes.push({ texte, nom: '' });

    // Son salut : séductrice si tu lui as offert des âmes, sinon de plus en plus terrifiante.
    const saluts = [
      "« Ne tremble pas, marchand. Ce n'est pas pour toi que je viens... pas encore. »",
      '« Encore moi. Tes clients ont la mort facile, marchand. Je connais le chemin, maintenant. »',
      "« L'odeur de la mort colle à ton comptoir. Je la sens depuis l'autre bout du monde. »",
      `« ${G.faucheuse.morts} âmes. ${G.faucheuse.morts} âmes sont passées par tes mains avant les miennes. Ton comptoir est devenu ma porte. »`,
    ];
    const charmes = [null,
      `« Tiens, tiens... Toi. Tu commences à me plaire, ${eJ() ? 'petite marchande' : 'petit marchand'}. »`,
      `« ${eJ() ? 'Ma marchande préférée' : 'Mon marchand préféré'}... Tu m'as manqué. Regarde tout ce que tu m'as apporté. »`,
      "« Mon âme sœur... si j'en avais une. Personne ne me nourrit aussi bien que toi. »"];
    elle(sed.index ? charmes[sed.index] : saluts[t.index]);
    elle(`« ${enListe(noms)} ne reviendr${plusieurs ? 'ont' : 'a'} jamais de voyage. ${plusieurs ? 'Leurs' : 'Son'} nom${plusieurs ? 's sont' : ' est'} à moi, désormais. »`);

    // Ses commentaires sur tes choix.
    if (bilan.voulues.length) {
      const offerts = bilan.voulues.map(p => prenomDe(p.voyageur.nom));
      const seul = bilan.voulues[0].voyageur.feminin ? "celle-là, tu me l'as offerte" : "celui-là, tu me l'as offert";
      elle(`« ${enListe(offerts)}... ${offerts.length > 1 ? 'ceux-là, tu me les as offerts' : seul}. Je n'oublie jamais un cadeau. »`);
    } else {
      const bienPrepare = entree.partis.find(p => p.chance >= 0.7);
      if (bienPrepare) elle(`« Tu avais pourtant tout fait pour ${prenomDe(bienPrepare.voyageur.nom)}. Ça ne suffit jamais. »`);
    }
    for (const p of bilan.demasques) {
      const id = Object.keys(p.pieges).find(k => p.pieges[k] > 0);
      elle(`« Mais on a retrouvé ${PIEGES[id] ? leNom(id, PIEGES[id].nom.toLowerCase()) : 'ton piège'} ${dePersonne(prenomDe(p.voyageur.nom))}... Le village murmure ton nom. »`);
      recit(`Ton piège a été découvert. Réputation −${PERTE_DEMASQUE}.`);
    }
    if (bilan.sabotage) {
      const m = bilan.sabotage.mission;
      if (bilan.sabotage.reussi) {
        elle(`« ${m.cible.nom} est à moi. Comme convenu. »`);
        recit(`Elle pose sur le comptoir une bourse de pièces glacées : +${m.prime} pièces.`);
      } else {
        elle(`« ${m.cible.nom} est reparti${m.cible.feminin ? 'e' : ''} sans mon cadeau. Tu m'as déçue, marchand. »`);
      }
    }
    // Ta réputation et tes choix entre le bien et le mal : elle sait tout.
    if (G.mal >= SEUIL_SABOTAGE && G.reputation >= 5) elle("« On t'aime, au village... S'ils savaient ce que tu fais dès qu'ils ont le dos tourné. »");
    else if (G.mal >= SEUIL_SABOTAGE) elle('« Les gens commencent à chuchoter à ton sujet. Ils ont bien raison. »');
    else if (G.mal >= 1) elle('« Je vois ce que tu fais, tu sais. Je vois tout. Continue... »');
    else if (G.reputation >= 8) elle("« Tout le monde t'aime, marchand. Même moi, je ne t'en veux pas. Mais je finirai par tous les avoir. »");

    // Son premier cadeau, quand tu commences à lui plaire.
    const cadeau = cadeauFaucheuse(G);
    if (cadeau) {
      elle('« Tiens. Un petit cadeau. Glisse-les dans un baluchon... et regarde ce qui arrive. »');
      recit(`Elle dépose sous ton comptoir : ${cadeau.map(id => PIEGES[id].nom).join(' et ')}. (Ton tiroir secret)`);
    }
    // Une mission de sabotage, si ton cœur est assez noir.
    const mission = proposerSabotage(G);
    if (mission) {
      const c = mission.cible;
      if (mission.proche) elle(`« Tu m'aimes, n'est-ce pas ? Alors prouve-le. Demain, ${c.nom} viendra à ton comptoir. Ton ami${c.feminin ? 'e' : ''}... Je veux ${c.feminin ? 'celle-là' : 'celui-là'}. Rien que pour moi. »`);
      else elle(`« J'ai un travail pour toi. Demain, ${c.nom} viendra à ton comptoir. ${NOMS_RACES[c.race] || ''}, un cœur pur... les gentils l'adorent. »`);
      etapes.push({
        texte: `« Glisse-lui ceci dans son baluchon : ${PIEGES[mission.piege].nom.toLowerCase()}. Je te paierai ${mission.prime} pièces. »`,
        nom: 'La Faucheuse',
        choix: [['Accepter', () => {
          accepterSabotage(G); Son.jouer('tampon');
          return '« Je savais que je pouvais compter sur toi. »';
        }], ['Refuser', () => {
          const prix = mission.proche;
          refuserSabotage(G);
          return prix ? '« Tu me refuses ? À moi ? ... Je m\'en souviendrai, marchand. Longtemps. »' : '« Comme tu voudras... Pour l\'instant. »';
        }]],
      });
    }
    elle(sed.index >= 2 ? `« Je te laisse ${plusieurs ? 'leurs carnets' : 'son carnet'}... À très vite, ${eJ() ? 'ma marchande' : 'mon marchand'}. »`
      : `« Je te laisse ${plusieurs ? 'leurs carnets' : 'son carnet'}. Nous nous reverrons... »`);

    const parler = texte => {
      this.dire(texte, `La Faucheuse${sed.index ? ' — ' + sed.nom : ''}`);
      this.nomParleur.setColor(sed.couleur);
    };
    const montrer = i => {
      if (i >= etapes.length) return this.departFaucheuse(entree);
      const e = etapes[i];
      if (e.nom) parler(e.texte);
      else this.dire(e.texte, '');
      if (!e.choix) return this.bouton('...', () => montrer(i + 1));
      const repondre = action => {
        const reponse = action();
        this.boutonRefuser.setVisible(false); this.petitRefuser.setVisible(false);
        parler(reponse);
        this.bouton('...', () => montrer(i + 1));
      };
      this.choix([e.choix[0][0], () => repondre(e.choix[0][1])], [e.choix[1][0], () => repondre(e.choix[1][1])]);
    };
    montrer(0);
  }

  departFaucheuse(entree) {
    this.bouton('...', null);
    this.dire('Elle se dissout dans l\'ombre. Sur le comptoir, ' +
      (entree.partis.length > 1 ? `${entree.partis.length} carnets` : 'un carnet') + ' couvert' + (entree.partis.length > 1 ? 's' : '') + ' de givre.', '');
    if (this.flottement) this.flottement.stop();
    if (this.battements) { this.battements.remove(); this.battements = null; }
    this.majStock();
    this.dessinerPieces();
    const echelle = this.perso.scale;
    this.tweens.add({ targets: this.perso, alpha: 0, scale: echelle + 1, duration: 1600, ease: 'Sine.easeIn' });
    if (this.aura) this.tweens.add({ targets: this.aura, alpha: 0, duration: 1200 });
    this.tweens.add({
      targets: this.ombre, fillAlpha: 0, duration: 1600, ease: 'Sine.easeOut',
      onComplete: () => {
        this.ombre.destroy();
        this.ombre = null;
        if (this.aura) { this.aura.destroy(); this.aura = null; }
        this.perso.setVisible(false).setAlpha(1).setScale(9).setDepth(2);
        for (const o of this.elementsDansLOmbre()) o.setDepth(0);
        // Les carnets passent en tête de file : on les lit un par un.
        this.G.file.unshift(...entree.partis.map(parti => ({ type: 'carnet', parti })));
        this.voyageurSuivant();
      },
    });
  }

  // Le client a sa destination : on peut préparer son colis.
  servir() {
    this.enService = true;
    this.majBoutonsService();
    this.bouton('Remettre le baluchon', () => this.remettreColis(), dureeService(this.G));
    this.majCommande();
  }

  // La carte : une page à part, le comptoir attend en pause.
  ouvrirCarte() {
    this.scene.pause();
    this.scene.launch('Carte', { comptoir: this });
  }

  nomAvecRelation(nom) {
    return `${nom} — ${niveauRelation(this.G, nom).nom}`;
  }

  // --- Les familles des disparus ---

  visiteFamille(visite) {
    const G = this.G;
    const { parent: p, defunt: d } = visite;
    const e = p.feminin ? 'e' : '';
    // Le disparu vu par le proche : « mon père », « ma sœur »...
    const inverse = { fils: ['père', 'mère'], fille: ['père', 'mère'], frère: ['frère', 'sœur'], sœur: ['frère', 'sœur'], père: ['fils', 'fille'], mère: ['fils', 'fille'] };
    const proche = `${d.feminin ? 'ma' : 'mon'} ${inverse[p.lien][d.feminin ? 1 : 0]}`;
    const il = d.feminin ? 'elle' : 'il';
    const prenom = prenomDe(d.nom);
    rencontrer(G, p.nom);
    this.titreCommande.setFontSize(17).setText('Une visite...');
    const parler = texte => this.dire(texte, `${p.nom}, ${p.lien} ${dePersonne(d.nom)}`, p.nom);
    const fin = reponse => { parler(reponse); this.bouton('...', null); this.majBoutonsService(); this.dessinerPieces(); this.majStock(); this.partirPar(FENETRE.x - 80); };

    if (visite.intention === 'colere') {
      parler(`C'est toi qui as équipé ${proche}, ${prenom} ? ${il[0].toUpperCase() + il.slice(1)} est mort${d.feminin ? 'e' : ''} à cause de ton matériel de pacotille !`);
      this.choix(['Dédommager (25 p.)', () => {
        if (!peutPayer(G, 25)) return fin("Tu n'as même pas de quoi payer ? Pathétique.");
        payer(G, 25, 'dedommagements');
        G.reputation += 0.5;
        fin("Hmph... Ça ne ramènera pas " + proche + ", mais c'est honnête de ta part.");
      }], [p.feminin ? 'La renvoyer' : 'Le renvoyer', () => {
        G.reputation -= 1;
        const msg = changerRelation(G, p.nom, -9);
        fin(`Tu le regretteras, marchand !${msg ? ' ' + msg : ''}`);
      }]);
    } else if (visite.intention === 'souvenir') {
      parler(`${prenom} parlait souvent de toi. Aurais-tu un souvenir de ${d.feminin ? 'elle' : 'lui'}... un objet de ta boutique qu'${il} aimait ?`);
      this.choix(['Offrir un objet', () => {
        const dispo = Object.keys(G.stock).filter(id => G.stock[id] > 0);
        if (!dispo.length) return fin("Ta réserve est vide... Ce n'est pas grave. Merci quand même.");
        const id = auHasard(dispo);
        G.stock[id]--;
        G.reputation += 0.5;
        const msg = changerRelation(G, p.nom, 4);
        fin(`${unNom(id)[0].toUpperCase() + unNom(id).slice(1)} ${ITEMS[id].nom.toLowerCase()}... ${prenom} en avait toujours ${genreDe(id).includes('p') ? 'sur' : unNom(id) + ' sur'} ${d.feminin ? 'elle' : 'lui'}. Merci, du fond du cœur.${msg ? ' ' + msg : ''}`);
      }], ["Je n'ai rien", () => {
        changerRelation(G, p.nom, -1);
        fin('Je vois... Au revoir.');
      }]);
    } else if (visite.intention === 'releve') {
      const q = QUETES[d.queteId];
      parler(`Je veux finir ce que ${proche} a commencé : ${(t => t.charAt(0).toLowerCase() + t.slice(1))(q.titre)}. Aide-moi à me préparer, comme tu l'as fait pour ${d.feminin ? 'elle' : 'lui'} !`);
      this.choix([`L'équiper`, () => {
        const v = creerVoyageur(G, { quete: d.queteId, nom: p.nom, race: p.race, feminin: p.feminin });
        v.accueil = `Merci. Je pars ${(t => t.charAt(0).toLowerCase() + t.slice(1))(q.titre)}, pour honorer ${proche}. Prépare-moi bien.`;
        G.relations[p.nom] = Math.floor(d.points / 2);
        this.entree = { type: 'client', voyageur: v }; // désormais, c'est un client comme un autre
        if (this.buste) this.buste.personne = v; // (c'est la même personne : son visage réagira au baluchon)
        this.arrivee(this.entree);
      }], ['Pas aujourd\'hui', () => {
        G.habitues.push({ nom: p.nom, race: p.race, feminin: p.feminin, inventaire: {} });
        fin(`Je comprends. Je reviendrai, prêt${e}.`);
      }]);
    } else {
      parler(`Avant de partir, ${proche} m'a dit : « Si je ne reviens pas, donne ceci au marchand. » ${il[0].toUpperCase() + il.slice(1)} tenait beaucoup à toi.`);
      this.choix(['Accepter son cadeau', () => {
        const msg = offrirDecoration(G);
        changerRelation(G, p.nom, 5);
        fin(`${msg} Prends-en soin.`);
        this.creerEtagere();
      }], ['Le garder pour sa famille', () => {
        G.reputation += 0.5;
        changerRelation(G, p.nom, 3);
        fin('Tu es quelqu\'un de bien. Merci.');
      }]);
    }
  }

  // (v0.93, planche 19) Les retours du jour résumés : chacun est encaissé (sa part, la réputation, son
  // rang), puis un tableau dit tout. Un clic sur une ligne rouvre son récit en entier (avec les soins et
  // les trouvailles qu'il propose) ; « Tout encaisser » passe au suivant.
  resumerRetours() {
    const G = this.G;
    if (this.resumeRetours || this.enPartance || (this._transition && performance.now() - this._transition < 1500)) return;
    const entrees = [this.entree, ...G.file.filter(e => e.type === 'retour')];
    G.file = G.file.filter(e => e.type !== 'retour');
    this.reconstruireFile();
    const repAvant = G.reputation;
    const lignes = entrees.map(e => {
      const parti = e.parti, rep0 = G.reputation;
      if (parti.resultat && parti.resultat.vivant) avancerHeure(G, JOURNEE.recit);   // (comme un récit écouté)
      const { gain } = terminerAventure(G, parti);
      G.recitsVus = (G.recitsVus || 0) + 1;
      return { parti, gain, rep: G.reputation - rep0 };
    });
    this.heureAffichee = heureDuComptoir(G); this.majHorloge();
    const c = this.resumeRetours = this.add.container(0, 0).setDepth(40);
    c.add(this.add.rectangle(480, 270, 960, 540, 0x0a0604, 0.55).setInteractive());
    c.add(this.add.image(480, 270, panneauHD(this, 820, 500)).setScale(2));
    c.add(this.add.text(480, 44, 'Les retours du jour', style(24, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
    c.add(this.add.text(480, 70, `${lignes.length} aventuriers sont rentrés`, style(13, '#6a4a2a', { fontStyle: 'italic' })).setOrigin(0.5));
    [[120, 'Aventurier'], [440, 'Contrée'], [545, 'Issue'], [640, 'Cœurs'], [730, 'Ta part'], [820, 'Réput.']].forEach(([x, t]) =>
      c.add(this.add.text(x, 96, t, style(12, '#6a4a2a', { fontStyle: 'bold' })).setOrigin(x === 120 ? 0 : 0.5, 0.5)));
    c.add(this.add.rectangle(480, 108, 760, 2, 0x8a6a3a));
    const h = Math.min(70, 270 / lignes.length);
    let total = 0, trouv = 0, rangs = [], dimes = 0, nomDime = '';
    lignes.forEach(({ parti, gain, rep }, i) => {
      const v = parti.voyageur, r = parti.resultat, z = ZONES[v.zone], pr = parti.progression;
      const y = 116 + h / 2 + i * h;
      total += gain; dimes += parti.dime || 0; if (parti.dimeNom) nomDime = parti.dimeNom;
      const fond = this.add.rectangle(480, y, 760, h - 6, i % 2 ? 0xe8d4a8 : 0xf0e0b8, 0.85).setStrokeStyle(1, 0xc9a870).setInteractive({ useHandCursor: true });
      fond.on('pointerover', () => fond.setFillStyle(0xd8c498, 1)).on('pointerout', () => fond.setFillStyle(i % 2 ? 0xe8d4a8 : 0xf0e0b8, 0.85));
      fond.on('pointerdown', () => { if (this.enPartance) return; this.ouvrirRecit(parti, true); });
      c.add(fond);
      c.add(this.add.image(130, y + h / 2 - 6, textureBusteHD(this, v, r.echec ? 'fache' : 'content')).setOrigin(0.5, 1).setScale(Math.min(0.5, (h - 8) / 120)));
      const nom = this.add.text(170, y - 12, v.nom, style(14, '#3b2410', { fontStyle: 'bold' })).setOrigin(0, 0.5);
      if (nom.width > 196) nom.setScale(196 / nom.width);
      const monte = pr && pr.apres.niveau !== pr.avant.niveau;
      if (monte) rangs.push(prenomDe(v.nom));
      const sous = [monte ? `${NIVEAUX_AVENTURIER[pr.avant.niveau].nom} → ${NIVEAUX_AVENTURIER[pr.apres.niveau].nom} !` : nomRang(v.niveau, true)];
      if ((parti.trouvailles || []).length) { trouv++; sous.push('+ trouvaille'); }
      if (parti.mise) sous.push(`mise ${parti.mise.mise} → ${parti.mise.rendu} p.`);   // (v1.19)
      if (blessuresDe(this.G, v.nom)) sous.push('à soigner');
      const st = this.add.text(170, y + 9, sous.join(' · '), style(11, monte ? '#b0701a' : '#6a4a2a', { fontStyle: 'italic' })).setOrigin(0, 0.5);
      if (st.width > 190) st.setScale(190 / st.width);
      c.add([nom, st]);
      c.add(this.add.text(442, y, z ? `${z.nom} ${'★'.repeat(z.danger)}` : '', style(11, '#3b2410', { align: 'center', wordWrap: { width: 118 } })).setOrigin(0.5));
      c.add(this.add.text(545, y, r.echec ? '✗ ratée' : '✓ réussie', style(13, r.echec ? '#a03020' : '#2f6a2a', { fontStyle: 'bold' })).setOrigin(0.5));
      // (v1.61) ses cœurs à lui : les cœurs dorés (potion, escorte, tarte) perdus ne sont pas des blessures
      const pv = Math.min(v.pv, r.etapes.length ? r.etapes[r.etapes.length - 1].pvApres : v.pv);
      const coeurs = this.add.text(640, y, '♥'.repeat(Math.max(0, pv)) + '♡'.repeat(Math.max(0, v.pv - pv)), style(14, '#c03030', { fontStyle: 'bold' })).setOrigin(0.5);
      if (coeurs.width > 84) coeurs.setScale(84 / coeurs.width);
      c.add(coeurs);
      c.add(this.add.text(730, y, `+${gain} p.`, style(14, '#7a5a10', { fontStyle: 'bold' })).setOrigin(0.5));
      const rr = Math.round(rep * 10) / 10;
      c.add(this.add.text(820, y, `${rr >= 0 ? '+' : ''}${String(rr).replace('.', ',')}`, style(13, rr >= 0 ? '#2f6a2a' : '#a03020', { fontStyle: 'bold' })).setOrigin(0.5));
    });
    const dRep = Math.round((G.reputation - repAvant) * 10) / 10;
    c.add(this.add.rectangle(480, 396, 760, 2, 0x8a6a3a));
    c.add(this.add.text(480, 414, `En tout : +${total} pièces · réputation ${dRep >= 0 ? '+' : ''}${String(dRep).replace('.', ',')}` + (trouv ? ` · ${trouv} trouvaille${trouv > 1 ? 's' : ''}` : '') + (rangs.length ? ` · ${rangs.join(', ')} monte${rangs.length > 1 ? 'nt' : ''} en rang` : '') + (dimes ? ` · ${nomDime} −${dimes} p.` : ''),
      style(14, '#3b2410', { fontStyle: 'bold', align: 'center', wordWrap: { width: 740 } })).setOrigin(0.5));
    c.add(this.add.text(480, 440, 'Un clic sur une ligne rouvre son récit en entier (la fiche de mission, les soins, les trouvailles).', style(11, '#6a4a2a', { fontStyle: 'italic' })).setOrigin(0.5));
    Son.jouer('pieces', { montant: total });
    const b = creerBouton(this, 480, 482, 250, '✓ Tout encaisser', () => { if (this.enPartance) return; c.list.slice(1).forEach(o => o.disableInteractive && o.disableInteractive()); allerParVolets(this, 'Comptoir'); });
    c.add([b.fond, b.label]);
  }

  // (le paladin choisi compte déjà dans sa mine, avant même le départ)
  avecEscorte(v) { return this.escorteChoisie && escorteDisponible(this.G) ? { ...v, escorte: true } : v; }

  ouvrirRecit(parti, dejaCompte) {
    if (enTransition(this)) return;
    if (!dejaCompte && parti.resultat && parti.resultat.vivant) avancerHeure(this.G, JOURNEE.recit);   // (le temps du récit : l'horloge l'affichera au retour)
    this.bouton('...', null);
    if (this.resumeRetours) this.resumeRetours.list.slice(1).forEach(o => o.disableInteractive && o.disableInteractive());   // (le voile, lui, continue de bloquer les clics)
    allerParVolets(this, 'Recit', { id: parti.voyageur.id });   // (v0.97) une seule transition ; (v1.61) des volets, pas un écran noir
  }

  // Petit dandinement pendant la marche.
  marche(duree) {
    pasDeMarche(this, this.perso, duree);
    this.perso.setAngle(-2);
    this.tweens.add({
      targets: this.perso, angle: 2, duration: 150, yoyo: true, repeat: Math.floor(duree / 300) - 1,
      onComplete: () => this.perso.setAngle(0),
    });
  }

  donner(id) {
    if (!this.enService || this.enConfirmation) return;
    const v = this.voyageur;
    // (retour du joueur) le bâton de mage : seules les magiciennes le prennent
    if (estArme(id) && !armeAutorisee(v, id)) { Son.jouer('refus'); return this.dire("Un bâton de mage ? Seules les magiciennes savent s'en servir. Donne-moi plutôt une vraie arme.", v.nom); }
    this.time.delayedCall(400, () => conseilGarrick(this, 'colis'));
    const commande = commandeDe(v);
    // Au-delà de la commande, c'est du suréquipement : seulement ce qui peut servir (soins,
    // ou un objet qu'une épreuve demande), et pas plus que ce que son sac peut porter.
    // (v0.63) les armes se partagent la commande d'arme : une autre que la sienne fait l'affaire
    const besoinArme = estArme(id) ? (commande[armePour(v)] || 0) : 0;
    const enPlus = estArme(id) ? armesDonnees(this.colis) >= besoinArme : (this.colis[id] || 0) >= (commande[id] || 0);
    if (enPlus) {
      if (!commande[id] && !besoinArme && !OBJETS_DE_SOIN.includes(id)) return this.dire("Hum, ça ne me servira à rien là où je vais.");
      if (totalSurplus(v, this.colis) >= tailleSac(v)) return this.dire(`Mon sac est plein ! Je ne peux porter que ${tailleSac(v)} objets en plus de ma commande.`);
      if (id === 'bandage' && (this.colis.bandage || 0) - (commande.bandage || 0) >= BANDAGES_EN_PLUS_MAX) return this.dire(`${BANDAGES_EN_PLUS_MAX} bandages en plus, ça suffit largement ! Garde le reste pour quelqu'un d'autre.`);
    }
    if (this.G.stock[id] <= 0) {
      return this.dire("Tu n'en as plus en stock...", '');
    }
    // (v0.84) un objet en plus de la commande se donne directement (plus de confirmation, demandé par
    // les testeurs) : le client le dit, et le sac affiche « (en plus) » ; on peut le reprendre d'un clic
    this.G.stock[id]--;
    this.colis[id] = (this.colis[id] || 0) + 1;
    marquerAide(this.G, 'stock');
    Son.jouer('poser');
    if (enPlus) this.dire((id === 'potion' ? "Une potion de plus ? Merci, ça me fera un cœur de réserve !"
      : id === 'bandage' ? "Un bandage de plus ? Si je saigne après un combat, ça m'évitera de perdre un cœur !" : "Un de plus ? Ça peut toujours servir, merci !") +
      ` (offert, en plus de la commande · sac ${totalSurplus(v, this.colis)} / ${tailleSac(v)})`);
    // (v0.63) une autre arme que celle de son peuple : il fait avec, sans enthousiasme
    else if (estArme(id) && id !== armePour(v)) this.dire(`${(unNom(id) + ' ' + ITEMS[id].nom.toLowerCase()).replace(/^./, c => c.toUpperCase())} ? Je préfère ${unNom(armePour(v))} ${ITEMS[armePour(v)].nom.toLowerCase()}... mais je ferai avec.`, v.nom);
    else if (estArme(id)) this.dire(`${(unNom(id) + ' ' + ITEMS[id].nom.toLowerCase()).replace(/^./, c => c.toUpperCase())} ! Exactement ce qu'il me fallait.`, v.nom);
    this.majStock();
    this.majCommande();
    guideApresDon(this);   // (v1.40) le Jour Zéro : tout y est ? on passe au flair
  }

  // (v0.84) un objet du client à réparer : un marteau qui bat à côté de la ligne, pour ne pas le rater
  marquerReparation(ligne, oui) {
    if (!ligne.marteau) {
      ligne.marteau = this.add.text(this.lignesCommande[0].moins.x, ligne.icone.y, '⚒', style(16, '#ff8a20', { fontStyle: 'bold', stroke: '#2a1206', strokeThickness: 4, brut: true })).setOrigin(0.5).setDepth(ligne.txt.depth + 1);
      this.tweens.add({ targets: ligne.marteau, angle: { from: -25, to: 15 }, scale: { from: 1, to: 1.25 }, duration: 380, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    ligne.marteau.setVisible(!!oui);
  }

  // Clic sur une ligne de la commande : reprendre un objet, ou réparer celui du client.
  // Retirer un objet du colis, tant qu'il n'est pas remis : il retourne dans ta réserve.
  retirer(i) {
    const id = this.lignesCommande[i].id;
    if (!this.enService || this.enConfirmation || !id || !this.colis[id]) return;
    this.colis[id]--;
    marquerAide(this.G, 'commande');
    if (this.pieges[id] > 0) {
      this.pieges[id]--;
      this.G.pieges[id]++;
    } else {
      this.G.stock[id]++;
    }
    this.majStock();
    this.majCommande();
  }

  clicLigne(i) {
    const id = this.lignesCommande[i].id;
    if (!this.enService || this.enConfirmation || !id) return;
    if (this.colis[id]) {
      return this.retirer(i);
    } else if (this.aReparer(this.voyageur).includes(id)) {
      this.reparer(id); marquerAide(this.G, 'commande');
    }
    this.majStock();
    this.majCommande();
  }

  // Les objets durables du client qui ont besoin d'une réparation (et qu'il peut encore utiliser).
  aReparer(v) {
    // (v0.63) pour l'arme : celle qu'il a sur lui, quelle qu'elle soit
    const ids = Object.keys(commandeDe(v)).flatMap(id => estArme(id) ? IDS_ARMES.filter(w => w in (v.inventaire || {})) : [id]);
    return ids.filter(id => {
      const etat = etatObjet(v, id);
      return ITEMS[id].durable && etat > 0 && etat < USURE_MAX && !!reparateurComptoir(this.G, id);   // (v1.62 : par un employé)
    });
  }

  // Réparer coûte des matériaux, et c'est le client qui paie la main-d'œuvre.
  reparer(id) {
    const erreur = reparerObjet(this.G, this.voyageur, id);
    if (erreur) { Son.jouer('refus'); return this.dire(erreur, ''); }
    Son.jouer('marteau');
    this.dessinerPieces();
    this.dire(`Merci ! ${prenomDe(EMPLOYES[this.G.dernierReparateurComptoir].nom)} a fait vite : ${monNom(id, ITEMS[id].nom.toLowerCase())} ${ITEMS[id].nom.toLowerCase()} ${genreDe(id).includes('p') ? 'sont' : 'est'} comme ${accordAdj(id, 'neuf', 'neuve', 'neufs', 'neuves')}. Voilà ${PRIX_REPARATION} pièces pour l'atelier.`);
  }

  // Refuser un client : il repart, et la réputation en prend un coup.
  refuser(confirme = false) {
    if (!this.voyageur) return;
    const v = this.voyageur;
    // (v0.84) des objets sont déjà dans son baluchon : on le rappelle avant de le renvoyer
    const dedans = Object.entries(this.colis).filter(([, n]) => n > 0);
    if (!confirme && dedans.length && this.enService && !this.enConfirmation) {
      const liste = dedans.map(([id, n]) => `${n} ${ITEMS[id] ? ITEMS[id].nom.toLowerCase() : id}`).join(', ');
      this.raconter(`Tu as déjà mis dans son baluchon : ${liste}. Si tu ${v.feminin ? 'la' : 'le'} refuses maintenant, ${v.feminin ? 'elle repart fâchée' : 'il repart fâché'} (−${REFUS_CLIENT} de réputation) ; ces objets reviennent dans ta réserve. ${v.feminin ? 'La' : 'Le'} refuser quand même ?`, 'Refuser ce client ?');
      this.enConfirmation = true;
      const fin = () => { this.enConfirmation = false; };
      return this.choix([`Non, je ${v.feminin ? 'la' : 'le'} sers`, () => { fin(); this.servir(); }], [`Oui, ${v.feminin ? 'la' : 'le'} refuser`, () => { fin(); this.refuser(true); }]);
    }
    for (const [id, n] of Object.entries(this.colis)) {
      const pieges = this.pieges[id] || 0;
      this.G.stock[id] += n - pieges;
      if (pieges) this.G.pieges[id] += pieges;
    }
    this.colis = {};
    this.pieges = {};
    // (v0.86) un imposteur refusé : il file, et ton flair grandit
    if (v.imposteur) {
      demasquerImposteur(this.G, v);
      this.enService = false; this.majBoutonsService(); this.bouton('...', null); this.majStock();
      this.exprimer('inquiet');
      this.dire(texteImposture(IMPOSTEURS[v.imposteur.type].fuite, v, v.imposteur.ami), v.nom);
      this.time.delayedCall(1500, () => this.raconter(`${v.feminin ? 'Elle' : 'Il'} ne proteste même pas : c'était ${v.feminin ? 'une imposteuse' : 'un imposteur'}. Bien vu, ton flair grandit.`, 'Démasqué'));
      return this.time.delayedCall(2500, () => this.partirPar(FENETRE.x - 80));
    }
    const msg = refuserClient(this.G, v);
    Son.jouer('refus');
    this.enService = false;
    this.majBoutonsService();
    this.bouton('...', null);
    this.majStock();
    this.exprimer('fache');
    this.dire("Tu refuses de me servir ? Très bien... J'irai voir ailleurs. Et je le dirai à tout le monde." + (msg ? ' ' + msg : ''), v.nom);
    this.partirPar(FENETRE.x - 80);
  }

  // Le client s'en va, vers la droite (vers l'aventure) ou la gauche (refusé).
  // `porte` : le baluchon que le client emporte, sur l'épaule (le bâton devant, le tissu
  // noué dans son dos).
  partirPar(x, porte = null) {
    if (this.chapeauFete) { this.chapeauFete.destroy(); this.chapeauFete = null; }   // (v1.54) le chapeau d'anniversaire part avec lui
    if (this.buste) Son.jouer('voix', { personne: this.buste.personne, ton: this.buste.expression === 'fache' ? 'grogne' : 'auRevoir' });
    this.time.delayedCall(350, () => Son.jouer('porte'));
    if (Son.theme === 'faucheuse') Son.ambiance('comptoir');
    const versDroite = x > this.perso.x;
    const entree = this.entree;
    const corps = () => {
      // Il se retourne : on le voit de nouveau en entier.
      if (!this.buste) return;
      this.buste = null;
      this.perso.setCrop();   // (v1.32 : le Grand Sage était cadré en buste)
      if (this.paroles) { this.paroles.remove(); this.paroles = null; this.enTrainDeParler = false; }
      // (v0.68) avec un baluchon, il le tient par le bâton, sur l'épaule (une pose à part)
      if (entree) this.perso.setTexture(this.texturePour(entree, porte && entree.type !== 'faucheuse' ? 'baluchon' : null));
      const echelle = 9 * echelleCorps(this.perso.texture.key);
      this.perso.setScale(echelle).setY(SOL_COMPTOIR).setFlipX(!versDroite);   // (les corps regardent vers la droite : il fait face à sa route)
      // il se retourne : un demi-tour rapide (l'image s'amincit puis revient)
      this.perso.scaleX = echelle * 0.1;
      this.tweens.add({ targets: this.perso, scaleX: echelle, duration: 140, ease: 'Quad.easeOut' });
      if (porte) {
        // la poche seule pend au bout du bâton, dans son dos (le bâton est dans sa main)
        porte.setTexture(porte.texture.key.replace('baluchon_', 'poche_')).setOrigin(17.5 / 52, 9 / 48).setAngle(0).setFlipX(!versDroite).setDepth(this.perso.depth - 0.05);
        porte.echelleDepart *= 0.82; porte.setScale(porte.echelleDepart);   // (sans le bâton, la poche paraît plus grosse : on la ramène à sa taille)
        if (!versDroite) porte.setOrigin(1 - 17.5 / 52, 9 / 48);
      }
    };
    if (!this.buste) this.perso.setFlipX(!versDroite);
    // (v0.68) La poche pend au bout du bâton que le client tient sur l'épaule : elle suit sa marche
    // (elle rebondit à chaque pas) et se balance comme un pendule, avec un temps de retard.
    const sens = versDroite ? 1 : -1;
    let balance = false, debutMarche = 0;
    const placer = () => {
      if (!porte || !porte.active) return;
      const cle = this.perso.texture.key.replace(/_pas[12]$/, ''), b = BOUTS_CORPS[cle];
      const t = balance ? this.time.now - debutMarche : 0;
      const phase = t / 500 * Math.PI * 2;
      const swing = balance ? Math.sin(phase - 0.9) * 9 * Math.min(1, t / 300) : 0;
      if (!b) {   // (sans bâton dessiné : comme avant, posé sur l'épaule)
        porte.setPosition(this.perso.x - sens * this.perso.displayWidth * 0.15, this.perso.y - hauteurCorps(this.perso) * 0.62).setAngle(swing);
        return;
      }
      const src = this.textures.get(cle).getSourceImage();
      const ax = (b[0] - src.width / 2) * Math.abs(this.perso.scaleX) * sens, ay = (b[1] - src.height) * this.perso.scaleY;
      const a = Phaser.Math.DegToRad(this.perso.angle);
      porte.setPosition(this.perso.x + ax * Math.cos(a) - ay * Math.sin(a), this.perso.y + ax * Math.sin(a) + ay * Math.cos(a)).setAngle(swing * sens);
    };
    // (tant qu'il est en buste, il garde le baluchon dans sa main : on ne le déplace qu'une fois retourné)
    if (porte) porte.setDepth(2.1);
    const partir = () => this.tweens.add({
      targets: this.perso, x, duration: porte ? 1900 : 1400, ease: 'Sine.easeIn',
      onStart: () => { balance = true; debutMarche = this.time.now; this.marche(porte ? 1900 : 1400); },
      onUpdate: (tw) => {
        // Il s'éloigne sur la route : un peu plus petit, un peu plus haut, vers l'horizon.
        if (porte) {
          const echelle = 9 * echelleCorps(this.perso.texture.key) * (1 - 0.18 * tw.progress);
          this.perso.setScale(echelle).setY(SOL_COMPTOIR - 14 * tw.progress);
          porte.setScale(porte.echelleDepart * (1 - 0.18 * tw.progress));
          placer();
        }
      },
      onComplete: () => {
        if (porte) porte.destroy();
        this.voyageurSuivant();
      },
    });
    if (!porte) { this.time.delayedCall(700, () => { corps(); partir(); }); return; }
    // Avec son baluchon : il se retourne, saute de joie, salue de la main, et s'en va.
    porte.echelleDepart = porte.scaleX;
    this.time.delayedCall(500, () => {
      corps();
      placer();
      this.events.on('update', placer);
      this.events.once('shutdown', () => this.events.off('update', placer));
      porte.once('destroy', () => this.events.off('update', placer));
      creerGlyphesHD(this);
      const salut = this.add.image(this.perso.x + (versDroite ? -30 : 30), this.perso.y - hauteurCorps(this.perso) - 6, 'glyphe_main').setScale(2.6).setOrigin(0.5, 1).setDepth(6);
      this.tweens.add({ targets: salut, angle: { from: -25, to: 25 }, duration: 140, yoyo: true, repeat: 3 });
      this.tweens.add({ targets: salut, alpha: 0, y: salut.y - 16, delay: 800, duration: 300, onComplete: () => salut.destroy() });
      this.tweens.add({ targets: this.perso, y: SOL_COMPTOIR - 16, duration: 150, yoyo: true, ease: 'Quad.easeOut', onUpdate: placer, onComplete: () => this.time.delayedCall(450, partir) });
    });
  }

  // L'empaquetage : on étale un tissu, les objets volent de la réserve dessus, on noue le
  // baluchon au bout d'un bâton, puis le client le prend. `suite(baluchon)` est appelée
  // quand il l'a sur l'épaule.
  empaqueter(objets, suite) {
    const bx = FENETRE.x + FENETRE.w / 2 + 80;
    const famille = familleColis(objets);
    const boite = this.add.image(bx, SOL_COMPTOIR, 'tissu_' + famille).setOrigin(0.5, 1).setScale(0).setDepth(2.5);
    boite.setMask(this.masqueFenetre);
    this.tweens.add({ targets: boite, scale: 2.5, duration: 250, ease: 'Back.easeOut' });
    objets.forEach((id, i) => this.time.delayedCall(300 + i * 170, () => {
      const depart = (this.cases[id] || this.cases.armes).icone;   // (v0.63 : les armes partent du râtelier)
      const icone = this.add.image(depart.x, depart.y, iconeObjet(this, id)).setScale(2).setDepth(6);
      this.tweens.add({
        targets: icone, x: bx, y: SOL_COMPTOIR - 30, scale: 2, duration: 450, ease: 'Quad.easeIn',
        onComplete: () => {
          icone.destroy();
          this.tweens.add({ targets: boite, scaleY: 2.25, duration: 70, yoyo: true });
        },
      });
    }));
    // On noue le tissu au bout du bâton...
    this.time.delayedCall(300 + objets.length * 170 + 500, () => {
      // Le motif dépend de ce qu'il contient, la taille du nombre d'objets.
      const taille = (3.4 + Math.min(objets.length, 10) * 0.2) / 2 * 0.8; // (le baluchon HD a deux fois plus de pixels, et il est plus grand en v0.58)
      boite.setTexture('baluchon_' + famille).setScale(taille);
      this.tweens.add({ targets: boite, angle: { from: -8, to: 8 }, duration: 90, yoyo: true, repeat: 2, onComplete: () => boite.setAngle(0) });
      const ficelle = this.add.text(bx, SOL_COMPTOIR - 70, 'Noué !', style(16, '#f3d98a', { fontStyle: 'bold', stroke: '#2a1a10', strokeThickness: 4 }))
        .setOrigin(0.5).setDepth(6);
      this.tweens.add({ targets: ficelle, y: ficelle.y - 20, alpha: 0, delay: 400, duration: 500, onComplete: () => ficelle.destroy() });
      // ... et le client le prend.
      this.time.delayedCall(700, () => {
        // ... et le client le hisse sur son épaule.
        // (v0.68) il le saisit par le bâton et le lève à côté de lui, la poche du côté libre
        boite.setFlipX(true).setOrigin(0.05, 0.95).setPosition(boite.x - boite.displayWidth * 0.45, boite.y);
        this.tweens.add({
          // (v0.68) dans sa main : le bout du bâton vient se loger dans la main du buste, devant lui
          targets: boite, x: this.perso.x + (this.buste ? this.perso.displayWidth * 0.3 : 22), y: this.perso.y - (this.buste ? this.perso.displayHeight * 0.22 : 62), angle: 6, duration: 450, ease: 'Sine.easeInOut',
          onComplete: () => suite(boite),
        });
      });
    });
  }

  // --- Le marchand express : une page à part, le comptoir attend en pause ---

  ouvrirExpress() {
    if (!this.enService) return;
    this.avancer(JOURNEE.express, 'chez Grippesou');
    this.scene.pause();
    this.scene.launch('Express', { comptoir: this });
  }

  // De retour de chez Grippesou : ce qu'on a acheté est déjà là, utilisable tout de suite.
  auRetourExpress(sys, data) {
    this.majStock();
    this.majCommande();
    this.dessinerPieces();
    if (data && data.annule) {
      this.choix(['Choisir sa destination', () => this.ouvrirCarte()], ['Refuser ce client', () => this.refuser()]);
    }
    if (data && data.destination) {
      const v = this.voyageur;
      this.dire(((v.accueil || '').includes(ZONES[data.destination].nom) ? '' : `${ZONES[data.destination].nom} ? Va pour ça ! `) + accord(v.accueil, v), this.nomAvecRelation(v.nom));
      this.servir();
    }
    if (data && data.achats && data.achats.length) {
      this.raconter(data.vendeur === 'colporteur' ? `Barnabé t'a vendu : ${data.achats.join(', ')}. « Merci, l'ami ! À la prochaine ! »`
        : `Grippesou t'a vendu : ${data.achats.join(', ')}. C'est déjà sur ton comptoir, prêt à servir !`, '');
    }
    if (data && data.vendeur === 'colporteur') {
      if (!data.achats || !data.achats.length) this.dire('« Une autre fois, alors ! Bonne journée. »', COLPORTEUR.nom);
      this.bouton('...', null);
      this.partirPar(FENETRE.x - 80);
    }
  }

  // « qui » : la personne dont le nom prend la couleur de votre relation (rouge → vert).
  // Par défaut, le client au comptoir quand c'est lui qui parle.
  // (v0.86) le jeu qui raconte : la même place, mais une autre allure (voir creerDialogue)
  raconter(texte, titre = '') { this.dire(texte, titre, null, true); }

  dire(texte, nom = this.voyageur ? this.voyageur.nom : '', qui = null, narration = nom === '') {
    this.narration = narration;
    this.fondDialogue.setTint(narration ? 0xe6dccb : 0xffffff);
    this.plumeNarration.setVisible(narration).setX(narration && nom ? 70 : 133);
    this.titreNarration.setVisible(narration && !!nom).setText(narration ? nom : '');
    if (narration) {
      this.plaqueNom.setVisible(false); this.nomParleur.setText(''); this.sousNom.setText('');
      this.texteDialogue.setText(texte).setFontSize(16).setFontStyle('italic 500').setColor('#3e2c5a');
      for (let taille = 15; this.texteDialogue.height > 70 && taille >= 12; taille--) this.texteDialogue.setFontSize(taille);
      this.texteDialogue.setOrigin(0, 0).setY(Math.round(298 - this.texteDialogue.height / 2));
      this.defileDialogue = texteQuiDefile(this, this.texteDialogue, texte, { vitesse: 16 });
      return;
    }
    this.texteDialogue.setFontStyle('500').setColor('#2a1a0c');
    if (!qui && this.voyageur && nom && nom.startsWith(this.voyageur.nom)) qui = this.voyageur.nom;
    // « Pippa Boisclair — Inconnu » : le nom sur la plaque, la relation en dessous.
    // (« Dagna, fille de Borin » : pareil, la suite passe sous la plaque.)
    const coupure = nom.includes(' — ') ? ' — ' : ', ';
    const [nomSeul, ...reste] = nom.split(coupure);
    this.plaqueNom.setVisible(!!nomSeul);
    this.nomParleur.setText(nomSeul).setColor(qui ? couleurNom(this.G, qui, true) : '#f3d98a').setFontSize(15);
    for (let taille = 14; this.nomParleur.width > (this.placeNom || 180) - 4 && taille >= 10; taille--) this.nomParleur.setFontSize(taille);
    this.sousNom.setText(reste.join(coupure)).setColor(qui ? couleurNom(this.G, qui) : '#5a4028').setFontSize(12);
    for (let taille = 11; this.sousNom.width > 200 && taille >= 9; taille--) this.sousNom.setFontSize(taille);
    // Le texte rapetisse un peu s'il est long, pour toujours tenir dans le parchemin.
    this.texteDialogue.setText(texte).setFontSize(16);
    for (let taille = 15; this.texteDialogue.height > 70 && taille >= 12; taille--) this.texteDialogue.setFontSize(taille);
    // (v0.68) puis il s'écrit lettre après lettre (un clic sur le parchemin l'affiche d'un coup) ; on
    // le place d'après sa hauteur finale, pour qu'il ne remonte pas à chaque nouvelle ligne
    this.texteDialogue.setOrigin(0, 0).setY(Math.round(298 - this.texteDialogue.height / 2));
    this.defileDialogue = texteQuiDefile(this, this.texteDialogue, texte, { vitesse: 16 });
    if (qui && this.buste && (this.buste.personne.nom === qui || qui.startsWith(this.buste.personne.nom + ' '))) this.parler(Math.min(2400, 400 + texte.length * 22));
  }

  remettreColis(confirme = false) {
    const v = this.voyageur;
    if (this.enConfirmation) return;
    // (v0.84) un baluchon vide : on demande avant de l'envoyer les mains vides
    const cmd0 = commandeDe(v);
    if (!confirme && Object.keys(cmd0).length && !Object.values(this.colis).some(n => n > 0)) {
      this.raconter(`Son baluchon est vide ! ${v.nom} partira sans aucune provision : ses chances de revenir vivant${v.feminin ? 'e' : ''} sont bien minces. L'envoyer quand même ?`, 'Partir sans rien ?');
      this.enConfirmation = true;
      const fin = () => { this.enConfirmation = false; };
      return this.choix([`Oui, ${v.feminin ? 'elle' : 'il'} part comme ça`, () => { fin(); this.remettreColis(true); }], [`Non, je ${v.feminin ? 'la' : 'le'} prépare`, () => { fin(); this.servir(); }]);
    }
    const chance = chanceDeRetour(this.avecEscorte(v), this.colis);
    if (v.imposteur) {
      // (v0.86) servi, l'imposteur ne revient jamais : on apprendra demain ce qu'il a fait du baluchon
      arnaquer(this.G, v, this.colis);
      this.avancer(dureeService(this.G), `${prenomDe(v.nom)} servi${v.feminin ? 'e' : ''}`);
      Son.jouer('caisse');
      this.enService = false; this.majCommande(); this.majBoutonsService(); this.bouton('...', null); this.majPanneauGauche();
      const objets = Object.entries(this.colis).flatMap(([id, n]) => Array(n).fill(id));
      this.colis = {}; this.pieges = {};
      const aller = colis => { this.dire(texteImposture(IMPOSTEURS[v.imposteur.type].merci, v, v.imposteur.ami), v.nom); this.partirPar(FENETRE.x + FENETRE.w + 60, colis); };
      if (!objets.length) return aller(null);
      this.raconter('Tu prépares le baluchon...');
      return this.empaqueter(objets, aller);
    }
    if (this.escorteChoisie && escorteDisponible(this.G)) { v.escorte = true; this.G.escorteSemaine = Math.floor((this.G.jour - 1) / 7); }
    this.escorteChoisie = false;
    const msg = (v.escorte ? `Un paladin de la Confrérie l'accompagnera sur la route. ` : '') + (partir(this.G, v, this.colis, this.pieges) || '');
    this.avancer(dureeService(this.G), `${prenomDe(v.nom)} servi${v.feminin ? 'e' : ''}`);
    Son.jouer('caisse');
    this.enService = false;
    if (!guideClient(this, 'fini')) this.time.delayedCall(2500, () => conseilGarrick(this, 'remis'));   // (v1.40) le Jour Zéro : la première course est partie
    this.majCommande(); // le colis est remis : on ne peut plus rien retirer
    this.majBoutonsService();
    this.bouton('...', null);
    this.majPanneauGauche();

    const jours = v.duree > 1 ? `dans ${v.duree} jours` : 'demain';
    // (v0.60) la phrase dit si la commande est complète ; la chance, elle, dit si le voyage est risqué
    // (une commande complète pour une contrée trop dangereuse n'est pas « pas tout ce que je voulais »)
    const cmd = commandeDe(v);
    const complete = Object.entries(cmd).every(([id, n]) => fourni(v, this.colis, id) >= n || (ITEMS[id] && ITEMS[id].durable && (estArme(id) ? etatArme(v) : etatObjet(v, id)) > 0));
    const phrase = complete ? (chance >= 0.6 ? `Parfait, tout y est ! Je reviendrai ${jours} avec ta part du butin, promis !`
      : `Tout y est, merci. Mais ça va être rude, là-bas... Rendez-vous ${jours}, si tout va bien.`)
      : chance >= 0.4 ? `Ce n'est pas tout ce que je voulais... mais je ferai avec. Rendez-vous ${jours} !`
      : "C'est tout ? Bon... Souhaite-moi bonne chance.";
    const objets = Object.entries(this.colis).flatMap(([id, n]) => Array(n).fill(id));
    // (v1.04) l'arme qu'il vient d'acheter, il la porte sur lui en partant
    const armeNeuve = objets.find(id => estArme(id));
    if (armeNeuve) v.armeEmportee = armeNeuve;
    // (v1.28) la cloche de la chapelle du Rempart sonne pour les départs vers les contrées de la lumière
    const cloche = typeof bonusChapelle === 'function' && bonusChapelle(this.G, v.zone) > 0;
    const sEnAller = colis => {
      this.dire(phrase + (msg ? ' ' + msg : '') + (cloche ? ' Au loin, la cloche de la chapelle sonne pour son départ.' : ''), this.nomAvecRelation(v.nom));
      if (cloche) { Son.jouer('cloche'); gainEnDirect(this, FENETRE.x + FENETRE.w / 2, FENETRE.y + 60, `+${Math.round(CONFRERIE.chapelle * 100)} % à chaque épreuve (chapelle)`, true); }
      this.partirPar(FENETRE.x + FENETRE.w + 60, colis);
    };
    if (!objets.length) return sEnAller(null);
    this.dire('Tu prépares le baluchon...', '');
    this.empaqueter(objets, sEnAller);
  }

  finDeJournee() {
    this.majFileAttente();
    this.majCommande();
    this.bouton('Fermer le comptoir', () => { this.bouton('...', null); this.baisserStore(() => this.scene.start('Nuit', { matin: false })); });
    // (v0.86) ce qu'on dit suit l'horloge : on ferme parfois en plein après-midi
    const h = heureDuComptoir(this.G), f = heureFermeture(this.G);
    this.raconter(h >= f - JOURNEE.alerte ? 'Le soleil se couche sur la Comté. Plus personne ne fait la queue.'
      : `Il n'est que ${formatHeure(h)}, mais plus personne ne fait la queue : tu peux fermer plus tôt aujourd'hui.`, 'Fin de la journée');
    this.ciel(h);   // (v0.91) on ferme tôt ? Il fait encore jour dehors
  }

  // --- Mise à jour de l'affichage ---

  majPanneauGauche() {
    this.texteJour.setText('Jour ' + this.G.jour);
    this.texteJoueur.setText(`${nomJoueur(this.G)}, ${ageJoueur(this.G)} ans`);
    // (v1.42) le résumé en trois lignes, ou le détail d'une ligne
    const mode = this.modeArdoise || 'resume', resume = mode === 'resume';
    const valeurs = [`${enMission(this.G).length}  ▸`, this.prochainDeLaFile()];
    this.lignesResume.forEach((l, i) => { l.objets.forEach(o => o.setVisible(resume)); l.val.setText(valeurs[i]); });
    this.texteJoueur.setVisible(resume);
    this.aideArdoise.setVisible(resume && !aideVue(this.G, 'ardoise'));
    this.titreDetail.setVisible(!resume).setText(mode === 'missions' ? 'En mission' : 'Lettres (clients en plus)');
    this.retourArdoise.setVisible(!resume);
    this.texteMissions.setVisible(mode === 'missions');
    this.lignesLettres.forEach(t => t.setVisible(mode === 'lettres'));
    // (v0.57) chaque ligne tient dans l'ardoise : un nom trop long est raccourci avec « … »
    // (v0.59) on mesure avec le texte de l'ardoise lui-même (même police, même taille)
    const LARGEUR_ARDOISE = 218;
    // (v1.19) un texte à part, invisible : mesurer avec l'ardoise elle-même effaçait la liste « En mission »
    // (elle finissait par montrer la dernière lettre mesurée)
    if (!this.mesureArdoise) this.mesureArdoise = this.add.text(-1000, -1000, '', this.texteMissions.style.toJSON ? this.texteMissions.style.toJSON() : style(13, '#f3e6c8')).setVisible(false);
    const mesure = this.mesureArdoise;
    const tenir = (debut, nom, fin) => {
      let n = nom;
      while (n.length > 3 && mesure.setText(debut + n + fin).width > LARGEUR_ARDOISE) n = n.slice(0, -1);
      return debut + (n === nom ? n : n.trimEnd() + '…') + fin;
    };
    this.texteMissions.setText(listeCourte(enMission(this.G).map(p => tenir('', p.voyageur.nom, ` — retour ${p.retour <= this.G.jour ? "aujourd'hui" : 'jour ' + p.retour}`)), 7, 'Personne pour l\'instant'));
    // (v1.19) une pièce dorée tourne près du nom de ceux sur qui tu as misé
    if (this.piecesMise) this.piecesMise.forEach(o => { this.tweens.killTweensOf(o); o.destroy(); });
    this.piecesMise = [];
    const partis = enMission(this.G), nL = Math.min(partis.length, 7), hL = nL ? this.texteMissions.height / nL : 0;
    if (typeof creerPiecesHD === 'function') creerPiecesHD(this);
    partis.slice(0, partis.length > 7 ? 6 : 7).forEach((p, i) => {
      if (!(p.voyageur.mise > 0) || mode !== 'missions') return;
      const pc = this.add.image(this.texteMissions.x + LARGEUR_ARDOISE + 6, this.texteMissions.y + hL * (i + 0.5), 'pieceFace').setScale(1.2).setDepth(this.texteMissions.depth + 0.1);
      this.tweens.add({ targets: pc, scaleX: 0.25, duration: 700, yoyo: true, repeat: -1, delay: i * 200 });
      this.piecesMise.push(pc);
    });

    this.lignesLettres.forEach((t, i) => {
      const a = this.G.annonces[i];
      t.setText(a ? tenir(`Jour ${a.jour} · `, a.voyageur.nom, a.acceptee ? '' : ' (à répondre)') : (i === 0 ? 'Aucune lettre' : ''));
    });
  }

  majStock() {
    for (const [id, c] of [...Object.entries(this.cases), ...Object.entries(this.casesArmes || {})]) {
      if (c.armes) {
        // le râtelier : l'arme du client si on l'a, sinon la plus nombreuse
        const total = IDS_ARMES.reduce((s, w) => s + (this.G.stock[w] || 0), 0);
        const pref = this.voyageur ? armePour(this.voyageur) : null;
        const montre = pref && this.G.stock[pref] > 0 ? pref : IDS_ARMES.slice().sort((a, b) => (this.G.stock[b] || 0) - (this.G.stock[a] || 0))[0];
        c.pile.forEach(img => img.setTexture(iconeObjet(this, montre)));
        c.qte.setText('x' + total).setColor(total > 0 ? '#3a2410' : '#a03020');
        c.pile.forEach((img, k) => img.setVisible(this.pageStock === 0 && (k === 2 || total > 2 - k)).setAlpha(total > 0 ? 1 : 0.35));
        continue;
      }
      const n = this.G.stock[id];
      // (v0.91) seulement sur la page affichée : sinon les armes de la page 2 restaient en « fantômes » derrière la page 1
      const surPage = (c.page || 0) === (this.pageStock || 0);
      c.qte.setText('x' + n).setColor(n > 0 ? '#3a2410' : '#a03020');
      c.pile.forEach((img, k) => img.setVisible(surPage && (k === 2 || (!c.seul && n > 2 - k))).setAlpha(n > 0 ? 1 : 0.35));
      if (c.fraiche) {   // (v1.54) la fraîcheur de la plus vieille
        const reste = n > 0 ? fraicheurRestante(this.G, id) : null, total = dureeFraicheur(this.G, id), vis = surPage && reste !== null;
        c.fraiche.fondB.setVisible(vis); c.fraiche.barre.setVisible(vis).setFillStyle(couleurFraicheur(reste || 0, total)); c.fraiche.barre.width = 24 * Math.max(0.08, Math.min(1, (reste || 0) / total));
        c.fraiche.jours.setVisible(vis).setText(reste === null ? '' : reste <= 1 ? 'ce soir !' : `${reste} j`).setColor(reste !== null && reste <= 2 ? '#a8401a' : '#5a3a20');
      }
    }
    this.majTiroirSecret();
    this.majTiroirCadeaux();
    this.majOngletPages();
    const m = this.G.materiaux;
    this.texteReserve.setText(`Ta réserve · ${stockTotal(this.G)} / ${this.G.capacite}`);
    const ag = agrandissementSuivant(this.G), place = stockTotal(this.G) >= this.G.capacite - 2;
    this.boutonAgrandir.setText(ag ? `▲ ${ag.capacite} places · ${ag.prix} p.` : '').setVisible(!!ag && (place || aideVue(this.G, 'stock')))
      .setX(this.texteReserve.x + this.texteReserve.width + 8).setAlpha(ag && peutPayer(this.G, ag.prix) ? 1 : 0.55);
    this.aideStock.setX((this.boutonAgrandir.visible ? this.boutonAgrandir.x + this.boutonAgrandir.width : this.texteReserve.x + this.texteReserve.width) + 12).setVisible(!aideVue(this.G, 'stock'));
    this.texteMateriaux.setText(`Fer ${m.fer} · Cuir ${m.cuir} · Bois ${m.bois || 0}`);
    if (this.majCommandeRoyale) this.majCommandeRoyale();   // (v1.10) ce qui manque encore pour le Conseil
  }

  majCommande() {
    const v = this.voyageur;
    // (v0.95) l'escorte du paladin : seulement sous serment de lumière, une fois par semaine
    const escorte = !!(v && v.queteId && this.enService && escorteDisponible(this.G));
    if (!escorte) this.escorteChoisie = false;
    this.boutonEscorte.setVisible(escorte).setText(`⚔ Escorte du paladin : ${this.escorteChoisie ? 'oui, +1 cœur' : 'non (1/sem.)'}`);
    const commande = v ? commandeDe(v) : {};
    const plus = v ? surplus(v, this.colis) : {};
    // La commande, puis les soins donnés en plus.
    const ids = [...Object.keys(commande), ...Object.keys(plus).filter(id => !commande[id])];
    // (v1.42) l'aide et l'escorte se rangent juste sous la dernière ligne ; l'aide s'efface une fois servie
    const nL = Math.min(ids.length, 5), sousLignes = 109 + nL * 19 - 8;   // (v1.63 : les lignes du parchemin du tableau)
    this.boutonEscorte.setY(nL >= 5 ? 199 : sousLignes);
    this.texteSac.setVisible(!(escorte && nL >= 5));
    this.aideCommande.setY(sousLignes).setVisible(!escorte && !!v && this.enService && nL < 5 && !aideVue(this.G, 'commande'));
    const cible = v && estCible(this.G, v) ? '(ta cible) ' : '';
    if (v) {
      this.titreCommande.setText(cible + v.nom).setFontSize(17);
      for (let taille = 16; this.titreCommande.width > 235 && taille >= 12; taille--) this.titreCommande.setFontSize(taille);
    }
    this.sousTitre.setText(v ? (v.queteId ? `→ ${ZONES[v.zone].nom}${v.mise > 0 ? ` · ta mise : ${v.mise} p.` : ''}` : "cherche l'aventure") : '');
    this.texteSac.setText(v ? (v.queteId ? `Sac : ${totalSurplus(v, this.colis)} / ${tailleSac(v)} en plus` +
      (coeursEnPlus(v, this.colis) ? ` · +${coeursEnPlus(v, this.colis)} cœur${coeursEnPlus(v, this.colis) > 1 ? 's' : ''}` : '') +
      (bandagesEnPlus(v, this.colis) ? ` · +${bandagesEnPlus(v, this.colis)} bandage${bandagesEnPlus(v, this.colis) > 1 ? 's' : ''}` : '') + ' · ' : '') +
      `trèfle ${trefleDe(this.G, v.nom)}/${TREFLE_MAX} · ${nomRang(v.niveau, true)}` : '');
    this.lignesCommande.forEach((ligne, i) => {
      let id = ids[i];
      // (v0.63) la ligne de l'arme : n'importe quelle arme la remplit ; on montre celle qu'il emporte
      const prefere = id && estArme(id) && commande[id] ? id : null;
      if (prefere) {
        const donnee = armeEmportee(v, this.colis);   // (rien de donné : la meilleure qu'il a sur lui)
        if (donnee !== id) {
          const n = commande[id], donne = armesDonnees(this.colis);
          ligne.id = donnee; ligne.icone.setVisible(true); iconeLigne(this, ligne.icone, donnee);
          const retirable = !!this.colis[donnee] && this.enService;
          ligne.moins.setVisible(retirable); ligne.moinsTexte.setVisible(retirable);
          if (!donne) {
            const etat = etatObjet(v, donnee);
            const cout = `${materiauxRequis(this.G)} ${MATERIAUX[MATERIAU_DE[donnee]].nom.toLowerCase()}`;
            ligne.txt.setText(etat > 0 ? `${ITEMS[donnee].nom} ${etat}/${USURE_MAX}${etat < USURE_MAX ? (reparateurComptoir(this.G, donnee) ? ` · réparer : ${cout}` : '') : ' ✓'}` : `${ITEMS[donnee].nom} · ${accordAdj(donnee, 'cassé', 'cassée', 'cassés', 'cassées')}`).setFontSize(12).setColor(etat >= USURE_MAX ? '#2f6a2a' : etat > 0 ? '#b04a00' : '#8a5a10');
            this.marquerReparation(ligne, etat > 0 && etat < USURE_MAX && this.enService && !!reparateurComptoir(this.G, donnee));
          } else {
            this.marquerReparation(ligne, false);
            ligne.txt.setText(`${ITEMS[donnee].nom} (préfère ${ITEMS[id].nom.toLowerCase()}) ${Math.min(donne, n)}/${n} ${donne >= n ? '✓' : ''}`).setFontSize(12).setColor(donne >= n ? '#2f6a2a' : '#3b2410');
          }
          for (let t = 12; ligne.txt.width > this.largeurCommande - 44 && t >= 9; t--) ligne.txt.setFontSize(t);
          return;
        }
      }
      ligne.id = id || null;
      ligne.icone.setVisible(!!id);
      this.marquerReparation(ligne, false);
      const retirable = !!id && !!this.colis[id] && this.enService;
      ligne.moins.setVisible(retirable);
      ligne.moinsTexte.setVisible(retirable);
      if (!id) return ligne.txt.setText('');
      iconeLigne(this, ligne.icone, id);
      const donne = this.colis[id] || 0;
      const etat = ITEMS[id].durable ? etatObjet(v, id) : 0;
      if (!donne && id in v.inventaire) {
        // Le client a déjà le sien : on peut le réparer au lieu d'en donner un neuf.
        const cout = `${materiauxRequis(this.G)} ${MATERIAUX[MATERIAU_DE[id]].nom.toLowerCase()}`;
        const texte = etat > 0 ? `${ITEMS[id].nom} ${etat}/${USURE_MAX}${etat < USURE_MAX ? (reparateurComptoir(this.G, id) ? ` · réparer : ${cout}` : '') : ' ✓'}`
          : `${ITEMS[id].nom} · ${accordAdj(id, 'le sien est cassé', 'la sienne est cassée', 'les siens sont cassés', 'les siennes sont cassées')}`;
        ligne.txt.setText(texte).setFontSize(12).setColor(etat >= USURE_MAX ? '#2f6a2a' : etat > 0 ? '#b04a00' : '#8a5a10');
        for (let t = 12; ligne.txt.width > this.largeurCommande - 44 && t >= 9; t--) ligne.txt.setFontSize(t);
        this.marquerReparation(ligne, etat > 0 && etat < USURE_MAX && this.enService && !!reparateurComptoir(this.G, id));
        return;
      }
      if (!commande[id]) {
        ligne.txt.setText(`${ITEMS[id].nom}  +${plus[id] || donne} (en plus)`).setFontSize(13).setColor('#1f5aa0');
        for (let t = 12; ligne.txt.width > this.largeurCommande - 44 && t >= 9; t--) ligne.txt.setFontSize(t);
        return;
      }
      const ok = donne >= commande[id];
      const piege = this.pieges && this.pieges[id] ? `  (piégé${this.pieges[id] > 1 ? ' ×' + this.pieges[id] : ''})` : '';
      // (v0.70) l'arme préférée, pas encore donnée : n'importe quelle arme remplit la ligne (la sienne donne un petit bonus)
      const ouAutre = estArme(id) && !ok && !armesDonnees(this.colis) ? ' (ou une autre arme)' : '';
      ligne.txt.setText(`${ITEMS[id].nom}  ${Math.min(donne, commande[id])} / ${commande[id]}  ${ok ? '✓' : ''}${plus[id] ? ` +${plus[id]}` : ''}${piege}${ouAutre}`)
        .setFontSize(14).setColor(piege ? '#7a1a4a' : ok ? '#2f6a2a' : '#3b2410');
      for (let t = 14; ligne.txt.width > this.largeurCommande - (ligne.moins.visible ? 44 : 26) && t >= 9; t--) ligne.txt.setFontSize(t);
    });
    // Son visage suit son colis : content s'il est bien équipé, inquiet s'il manque des choses.
    if (v && this.enService && v.queteId && this.buste && this.buste.personne === v) {
      const c = chanceDeRetour(this.avecEscorte(v), this.colis);
      const vide = !Object.values(this.colis).some(n => n > 0);
      // (tant que le baluchon est vide, il garde l'humeur de son arrivée : rien ne s'est encore passé)
      this.exprimer(vide ? this.expressionArrivee(this.entree) : v.exige && !totalSurplus(v, this.colis) ? 'fache' : c >= 0.75 ? 'content' : c < 0.4 ? 'inquiet' : 'neutre');
    }
    if (v && !v.queteId) {
      this.majFlair('Choisis sa destination', '?', null, '#8a6a10');
    } else if (v) {
      // Ton flair estime les chances : faussé au début, précis avec l'expérience.
      const c = chanceEstimee(this.G, v, this.colis, this.pieges);
      const couleur = c >= 0.75 ? '#2f6a2a' : c >= 0.4 ? '#8a6a10' : '#a03030';
      const exact = niveauFlair(this.G) >= 1;
      if (piegeFatal(v, this.pieges)) this.majFlair('Ses chances de revenir', 'aucune', 0, '#7a1a4a');
      else this.majFlair(exact ? 'Ses chances de revenir' : 'Ton flair dit', `${exact ? '' : '~'}${Math.round(c * 100)} %`, c, couleur);
    } else {
      this.texteChance.setText('');
    }
  }
}

// Les premières lignes d'une liste, puis « + 2 autres ».
function listeCourte(lignes, max, siVide) {
  if (lignes.length === 0) return siVide;
  if (lignes.length <= max) return lignes.join('\n');
  return lignes.slice(0, max - 1).join('\n') + `\n+ ${lignes.length - max + 1} autres`;
}

// (v0.63) L'icône d'une ligne de l'ardoise : la petite icône d'origine, ou la HD à demi-taille
// pour les objets qui n'en ont pas (les nouvelles armes)
function iconeLigne(scene, img, id) {
  if (scene.textures.exists(id)) img.setTexture(id).setScale(2.5);
  else img.setTexture(iconeObjet(scene, id)).setScale(1.25);
}

// Le tissu du baluchon selon ce qu'il contient le plus : provisions, armes, soins...
// ou « divers » quand c'est un peu de tout.
function familleColis(objets) {
  const familles = { provisions: ['ration', 'gourde'], armes: [...IDS_ARMES, 'fleches', 'bouclier'], soins: ['potion', 'bandage', 'antidote'] };
  for (const [famille, ids] of Object.entries(familles)) {
    if (objets.filter(id => ids.includes(id)).length > objets.length / 2) return famille;
  }
  return 'divers';
}
