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
const TAILLE_BUSTE = { hobbit: { bas: 34 }, nain: { bas: 24 }, elfe: { echelle: 1.05 }, magicienne: { echelle: 1.09 } };
const tailleBuste = personne => ({ bas: 0, echelle: 1, ...((personne && TAILLE_BUSTE[personne.race]) || {}) });
const FILE = { x: FENETRE.x + 110, ecart: 55, y: SOL_COMPTOIR - 14, echelle: 5 };

class CounterScene extends Phaser.Scene {
  constructor() { super('Comptoir'); }

  create() {
    this.G = window.GAME;
    this.entree = null;   // ce qui est au comptoir : client, retour ou carnet
    this.voyageur = null; // le client à servir, s'il y en a un
    this.enService = false;
    this.colis = {};
    this.pieges = {};

    this.dessinerPiece();
    this.creerFenetre();
    this.creerPanneauGauche();
    this.creerCommande();
    this.creerDialogue();
    this.creerStock();
    this.creerArgent();

    this.boutonExpress = creerBouton(this, 840, 360, 210, 'Marchand express', () => this.ouvrirExpress());
    this.boutonAttente = creerBouton(this, 840, 404, 210, 'Mettre en attente', () => this.mettreEnAttente());
    this.boutonRefuser = creerBouton(this, 840, 448, 210, 'Refuser ce client', () => (this.actionB ? this.actionB() : this.refuser()));
    this.boutonAction = creerBouton(this, 840, 496, 210, '', () => this.action && this.action());
    this.majBoutonsService();

    // Au retour de chez Grippesou, on remet l'affichage à jour.
    this.events.off('resume', this.auRetourExpress, this);
    this.events.on('resume', this.auRetourExpress, this);

    this.cameras.main.fadeIn(400);
    this.creerStore();
    if (this.G.comptoirOuvert !== this.G.jour) {
      // Midi : on lève le store, le comptoir est officiellement ouvert.
      this.G.comptoirOuvert = this.G.jour;
      this.dire('Midi sonne au clocher. Tu lèves le store : le comptoir est ouvert !', '');
      this.time.delayedCall(this.G.banniere !== this.G.jour ? 1700 : 500, () => this.leverStore(() => this.voyageurSuivant()));
    } else {
      this.store.setVisible(false);
      this.voyageurSuivant();
    }
    if (this.G.banniere !== this.G.jour) this.afficherBanniere();
  }

  // Le premier jour (tutoriel) : les deux premiers clients peuvent être servis entièrement ;
  // pour le dernier, il manque quelque chose en réserve — l'occasion d'apprendre qu'on peut
  // renvoyer un client qu'on ne peut pas bien équiper (contre un peu de réputation).
  preparerTutoriel(v) {
    const G = this.G;
    if (G.jour !== 1 || !G.tuto || !v.queteId) return;
    const commande = commandeDe(v);
    const ids = Object.keys(commande);
    if (!ids.length) return;
    const dernier = G.file.filter(e => e.type === 'client').length === 0;
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

  // Le store de bois qui ferme la fenêtre du comptoir (et sa pancarte).
  creerStore() {
    const { x, y, w, h } = FENETRE;
    if (!this.textures.exists('storeHD')) {
      const t = toileDecor(w / 2, h / 2 + 6);
      for (let yy = 0; yy < h / 2 + 6; yy += 6) {
        planche(t, 0, yy, w / 2, 5, 'chene', { graine: 980 + yy, noeuds: 1 });
        for (let xx = 0; xx < w / 2; xx++) { t.poser(xx, yy + 5, 'cheneSombre', 0); t.poser(xx, yy, 'chene', 4); }
      }
      for (let xx = 0; xx < w / 2; xx++) for (let k = 0; k < 4; k++) t.poser(xx, h / 2 + 2 + k, 'fer', 3 - (k === 3 ? 2 : 0)); // la barre du bas
      for (const xx of [w / 4 - 8, w / 4 + 8]) for (let k = 0; k < 3; k++) t.poser(xx, h / 2 - 1 + k, 'laiton', 4);       // la poignée
      t.texture(this, 'storeHD');
    }
    const panneau = this.add.image(0, 0, 'storeHD').setOrigin(0.5, 1).setScale(2);
    const pancarte = this.add.text(0, -h / 2 - 6, 'FERMÉ', style(20, '#f3d98a', { fontStyle: 'bold', backgroundColor: '#5a1a12', padding: { x: 12, y: 4 }, brut: true })).setOrigin(0.5);
    this.store = this.add.container(x + w / 2, y + h + 6, [panneau, pancarte]).setDepth(2.4);
    this.store.setMask(this.masqueFenetre);
    this.pancarte = pancarte;
  }

  leverStore(suite) {
    const { y, h } = FENETRE;
    this.store.setVisible(true).setY(y + h + 6);
    this.pancarte.setText('OUVERT !').setBackgroundColor('#2a5a1a');
    this.tweens.add({ targets: this.pancarte, scale: { from: 1.4, to: 1 }, duration: 250, ease: 'Back.easeOut' });
    this.time.delayedCall(500, () => {
      this.cameras.main.shake(120, 0.003);
      this.tweens.add({ targets: this.store, y: y - 10, duration: 1300, ease: 'Quad.easeIn', onComplete: () => { this.store.setVisible(false); if (suite) suite(); } });
      this.tweens.add({ targets: this.store, x: this.store.x + 2, duration: 60, yoyo: true, repeat: 10 });
    });
  }

  baisserStore(suite) {
    const { y, h } = FENETRE;
    this.pancarte.setText('FERMÉ').setBackgroundColor('#5a1a12');
    this.store.setVisible(true).setY(y - 10);
    this.tweens.add({ targets: this.store, y: y + h + 6, duration: 900, ease: 'Bounce.easeOut', onComplete: () => this.time.delayedCall(500, suite) });
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
    this.boutonExpress.setVisible(this.enService && libre);
    this.boutonAttente.setVisible(!!this.voyageur && (this.enService || !!this.actionB) && libre);
    this.boutonRefuser.setVisible(this.enService || !!this.actionB);
    if (this.enService && !this.actionB) this.boutonRefuser.setTexte('Refuser ce client');
  }

  // Deux choix pour une visite : le bouton du bas (A) et celui du milieu (B).
  choix([texteA, actionA], [texteB, actionB]) {
    this.bouton(texteA, () => { this.actionB = null; actionA(); });
    this.actionB = () => { this.actionB = null; actionB(); };
    this.boutonRefuser.setTexte(texteB);
    this.majBoutonsService();
  }

  // Le bouton du bureau change selon la situation.
  bouton(texte, action) {
    this.boutonAction.setTexte(texte);
    this.boutonAction.setActif(!!action);
    this.action = action;
  }

  // --- Décor ---

  // Le mur (enduit à la chaux entre les colombages de chêne) et le plateau du comptoir.
  dessinerPiece() {
    creerDecorComptoir(this);
    creerObjetsHD(this);
    this.add.image(0, 0, 'murComptoir').setOrigin(0).setScale(2);
    this.add.image(0, 340, plateauComptoir(this, niveauAmelioration(this.G, 'comptoir'))).setOrigin(0).setScale(2);
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
    this.cielNuit = ciel(0.85).setAlpha(0);
    this.voile = this.add.rectangle(x + w / 2, y + h / 2, w, h, 0x0a0a30, 0);

    // Tout ce qui est dans la fenêtre est découpé à sa taille.
    const forme = this.make.graphics({ add: false });
    forme.fillStyle(0xffffff).fillRect(x, y, w, h);
    const masque = forme.createGeometryMask();
    this.paysage.setMask(masque);

    this.masqueFenetre = masque;
    this.perso = this.add.image(-100, SOL_COMPTOIR, 'perso_hobbit').setOrigin(0.5, 1).setScale(9).setDepth(2);
    this.perso.setMask(masque);
    this.creerFileAttente();

    // L'ébrasement, le cadre de chêne et l'appui de pierre de la fenêtre
    this.add.image(x - 16, y - 16, 'cadreFenetre').setOrigin(0).setScale(2).setDepth(3);
  }

  // Les voyageurs qui attendent leur tour, visibles par la fenêtre.
  creerFileAttente() {
    this.fileSprites = this.G.file.map((entree, i) => this.spriteFile(entree, i));

    const fond = this.add.rectangle(FENETRE.x + 8, FENETRE.y + 8, 132, 28, 0x2a1a10, 0.8)
      .setOrigin(0, 0).setStrokeStyle(2, 0xc9a227).setDepth(4);
    this.texteAttente = this.add.text(fond.x + 66, fond.y + 14, '', style(14, '#f3d98a', { fontStyle: 'bold' }))
      .setOrigin(0.5).setDepth(4);
  }

  // Un personnage qui attend dans la file, à la place `i`.
  spriteFile(entree, i) {
    const cle = this.texturePour(entree);
    const sprite = this.add.image(FILE.x - i * FILE.ecart, FILE.y, cle)
      .setOrigin(0.5, 1).setScale(FILE.echelle * echelleCorps(cle)).setTint(0xd8d0c0).setDepth(1);
    sprite.setMask(this.masqueFenetre);
    // Ils piétinent un peu en attendant.
    this.tweens.add({ targets: sprite, y: FILE.y - 3, duration: 500 + (i % 5) * 90, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return sprite;
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
    let phrase = "D'accord, je repasse tout à l'heure. Garde-moi mon colis !";
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
    this.G.file.push(entree);
    this.fileSprites.push(this.spriteFile(entree, this.G.file.length - 1).setVisible(false));
    this.majFileAttente();
    this.partirPar(FENETRE.x - 80);
  }

  texturePour(entree) {
    if (entree.type === 'faucheuse') return 'perso_faucheuse';
    if (entree.type === 'famille') return corpsHD(this, entree.visite.parent);
    const v = entree.type === 'client' ? entree.voyageur : entree.parti.voyageur;
    return corpsHD(this, v);
  }

  majFileAttente() {
    const n = this.G.file.length;
    this.texteAttente.setText(n === 0 ? 'Plus personne' : `En attente : ${n}`);
  }

  // À gauche : qui est en mission, et les lettres reçues (cliquables).
  creerPanneauGauche() {
    this.add.image(20, 20, 'ardoiseComptoir').setOrigin(0).setScale(2); // l'ardoise dans son cadre
    this.texteJour = this.add.text(30, 28, '', style(22, '#f3d98a', { fontStyle: 'bold' }));
    this.texteJoueur = this.add.text(262, 36, '', style(13, '#c9b48a', { fontStyle: 'italic' })).setOrigin(1, 0);
    this.add.text(30, 62, 'En mission', style(14, '#c9b48a', { fontStyle: 'bold' }));
    this.texteMissions = this.add.text(30, 82, '', style(13, '#f3e6c8', { lineSpacing: 3 }));
    this.add.text(30, 160, 'Lettres (clients en plus) — clique', style(14, '#c9b48a', { fontStyle: 'bold' }));
    this.lignesLettres = [];
    for (let i = 0; i < 4; i++) {
      const t = this.add.text(30, 180 + i * 17, '', style(13, '#f3e6c8')).setInteractive({ useHandCursor: true });
      t.on('pointerover', () => t.setColor('#f3d98a'));
      t.on('pointerout', () => t.setColor('#f3e6c8'));
      t.on('pointerdown', () => this.lireLettre(i));
      this.lignesLettres.push(t);
    }
  }

  lireLettre(i) {
    const a = this.G.annonces[i];
    if (!a) return;
    const v = a.voyageur;
    this.dire(`« Je passerai à ton comptoir le jour ${a.jour}. Je pars : ${v.quete.toLowerCase()}. ` +
      `Prépare-moi s'il te plaît : ${commandeEnTexte(v)}. » — ${v.nom}` +
      (a.acceptee ? ' (Tu as accepté.)' : ' (Pas encore répondu : accepte ou refuse ce soir.)'), '✉ Lettre de ' + v.nom);
  }

  creerCommande() {
    // Parchemin de la commande
    this.add.image(685, 20, 'parcheminComptoir').setOrigin(0).setScale(2); // le parchemin punaisé
    // Le nom du client sur une ligne (la police rétrécit si besoin), sa destination en dessous.
    this.titreCommande = this.add.text(700, 26, '', style(17, '#3b2410', { fontStyle: 'bold' }));
    this.sousTitre = this.add.text(700, 49, '', style(12, '#6b4a2a', { fontStyle: 'italic' }));
    this.lignesCommande = [];
    for (let i = 0; i < 5; i++) {
      const y = 76 + i * 22;
      const icone = this.add.image(712, y, 'ration').setScale(2.5).setVisible(false);
      const txt = this.add.text(732, y, '', style(14, '#3b2410')).setOrigin(0, 0.5);
      const zone = this.add.rectangle(800, y, 210, 22, 0x000000, 0).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => this.clicLigne(i));
      // Le petit « − » : retirer un objet du colis (il retourne dans ta réserve).
      const moins = this.add.circle(925, y, 9, 0x8a3a2a).setStrokeStyle(1, 0x3b2410).setInteractive({ useHandCursor: true }).setVisible(false);
      const moinsTexte = this.add.text(925, y - 1, '−', style(14, '#fff4dc', { fontStyle: 'bold' })).setOrigin(0.5).setVisible(false);
      moins.on('pointerover', () => moins.setFillStyle(0xb04a3a));
      moins.on('pointerout', () => moins.setFillStyle(0x8a3a2a));
      moins.on('pointerdown', () => this.retirer(i));
      this.lignesCommande.push({ icone, txt, zone, moins, moinsTexte, id: null });
    }
    this.texteSac = this.add.text(700, 184, '', style(11, '#5a3a20'));
    this.add.text(700, 226, '− : retirer du colis · clic sur une ligne : réparer', style(11, '#7a5a3a', { fontStyle: 'italic' }));
    this.texteChance = this.add.text(815, 208, '', style(16, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5);
  }

  creerDialogue() {
    // Le panneau des dialogues : à gauche le nom sur sa plaque (et la relation dessous),
    // à droite la parole, à l'encre, centrée dans la hauteur.
    this.fondDialogue = this.add.image(480, 298, 'parcheminDialogue').setScale(2);
    this.plaqueNom = this.add.image(133, 288, plaqueBouton(this, 196)).setScale(2);
    this.nomParleur = this.add.text(133, 288, '', style(15, '#f3d98a', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 3 })).setOrigin(0.5);
    this.sousNom = this.add.text(133, 321, '', style(12, '#5a4028', { fontStyle: 'italic bold' })).setOrigin(0.5);
    this.texteDialogue = this.add.text(256, 298, '', style(16, '#2a1a0c', { wordWrap: { width: 660 }, lineSpacing: 1 })).setOrigin(0, 0.5);
  }

  creerStock() {
    this.add.text(150, 357, 'Ton stock — clic : ajouter au colis', style(12, '#f3e6c8', { fontStyle: 'italic', stroke: '#1a100a', strokeThickness: 3 }));
    this.texteReserve = this.add.text(660, 357, '', style(12, '#f3d98a', { fontStyle: 'bold', stroke: '#1a100a', strokeThickness: 3 })).setOrigin(1, 0);
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
    this.cases = {};
    Object.keys(ITEMS).forEach((id, i) => {
      const x = 200 + (i % 5) * 108;
      const y = 397 + Math.floor(i / 5) * 48;
      const fond = this.add.rectangle(x, y, 100, 40, 0xfff6d8, 0.001).setInteractive({ useHandCursor: true });
      // La marchandise posée sur la toile : jusqu'à trois exemplaires empilés selon le stock
      const cle = iconeObjet(this, id);
      const pile = [2, 1, 0].map(k => this.add.image(x - 28 - k * 3, y + 3 - k * 4, cle).setScale(2));
      const icone = pile[2];
      const nom = this.add.text(x - 8, y - 18, ITEMS[id].nom, style(10, '#3a2410', { fontStyle: 'bold' }));
      for (let taille = 12; nom.width > 60 && taille >= 9; taille--) nom.setFontSize(taille); // les noms longs rapetissent un peu
      // La quantité, sur une petite étiquette de parchemin
      this.add.image(x + 32, y + 12, 'etiquette').setScale(2);
      const qte = this.add.text(x + 33, y + 12, '', style(12, '#3a2410', { fontStyle: 'bold' })).setOrigin(0.5);
      fond.on('pointerover', () => { fond.setFillStyle(0xfff6d8, 0.22); icone.setScale(2.25); });
      fond.on('pointerout', () => { fond.setFillStyle(0xfff6d8, 0.001); icone.setScale(2); });
      fond.on('pointerdown', () => this.donner(id));
      this.cases[id] = { fond, qte, pile, icone };
    });
    this.creerBoutonRetourner();
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
    this.tiroirCadeaux.texte.setVisible(n > 0).setText(`🎁 Cadeaux\n(${n})`);
    if (!n && this.panneauCadeaux) { this.panneauCadeaux.destroy(); this.panneauCadeaux = null; }
  }

  ouvrirTiroirCadeaux() {
    if (this.panneauCadeaux) { this.panneauCadeaux.destroy(); this.panneauCadeaux = null; return; }
    const ids = Object.keys(this.G.cadeaux).filter(id => this.G.cadeaux[id] > 0);
    if (!ids.length) return;
    const c = this.panneauCadeaux = this.add.container(0, 0).setDepth(8);
    const h = 34 + ids.length * 30;
    c.add(this.add.rectangle(416, 470 - h / 2, 240, h, 0x1e2a14, 0.97).setStrokeStyle(2, 0x4a7a3a));
    c.add(this.add.text(416, 470 - h + 14, 'Offrir au client :', style(12, '#c8e0a0', { fontStyle: 'italic' })).setOrigin(0.5));
    ids.forEach((id, i) => {
      const y = 470 - h + 40 + i * 30;
      const ligne = this.add.rectangle(416, y, 226, 26, 0x2a3a1e).setInteractive({ useHandCursor: true });
      ligne.on('pointerover', () => ligne.setFillStyle(0x3a5a2a));
      ligne.on('pointerout', () => ligne.setFillStyle(0x2a3a1e));
      ligne.on('pointerdown', () => this.offrir(id));
      c.add([ligne, this.add.image(316, y, id).setScale(2.5),
        this.add.text(334, y, `${CADEAUX[id].nom} x ${this.G.cadeaux[id]}`, style(12, '#f3f0d0', { fontStyle: 'bold' })).setOrigin(0, 0.5)]);
    });
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
    this.tiroirSecret.texte.setVisible(visible).setText(`☠ Tiroir secret (${n})`);
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
      c.add([ligne, this.add.image(482, y, id).setScale(2.5).setTint(0x9a8aa0),
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
    if (!commande[id]) return this.dire(`${v.nom.split(' ')[0]} n'a pas commandé de ${ITEMS[id].nom.toLowerCase()} : ça éveillerait ses soupçons.`, '');
    if ((this.colis[id] || 0) >= commande[id]) return this.dire(`Son baluchon a déjà son compte de ${ITEMS[id].nom.toLowerCase()}. Retires-en un d'abord.`, '');
    this.G.pieges[id]--;
    this.colis[id] = (this.colis[id] || 0) + 1;
    this.pieges[id] = (this.pieges[id] || 0) + 1;
    this.dire(`Tu glisses discrètement la ${PIEGES[id].nom.toLowerCase()} dans son baluchon. ${v.feminin ? 'Elle' : 'Il'} ne remarque rien.`, '');
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
      const icone = this.add.image(24 + i * 25, 408, id === 'trefle' ? 'trefleChance' : id).setScale(3).setInteractive({ useHandCursor: true });
      icone.on('pointerdown', () => this.dire(DECORATIONS[id].effet, DECORATIONS[id].nom));
    });
  }

  creerArgent() {
    this.pieces = this.add.container(0, 0);
    this.texteArgent = this.add.text(70, 512, '', style(18, '#f3d98a', { fontStyle: 'bold', stroke: '#1a100a', strokeThickness: 4 })).setOrigin(0.5);
    this.nbPieces = -1;
    this.dessinerPieces();
    // De temps en temps, une pièce scintille au sommet d'une pile.
    this.time.addEvent({ delay: 1400, loop: true, callback: () => {
      const sommets = this.pieces.list.filter(o => o.sommet);
      if (!sommets.length || Math.random() < 0.35) return;
      const p = Phaser.Utils.Array.GetRandom(sommets);
      const eclat = this.add.image(p.x + Phaser.Math.Between(-8, 8), p.y - 3, 'eclat').setScale(0).setDepth(1);
      this.tweens.add({ targets: eclat, scale: 2, angle: 45, duration: 260, yoyo: true, onComplete: () => eclat.destroy() });
    } });
  }

  // Des piles de pièces d'or qui grandissent avec l'argent, et quelques pièces éparpillées.
  dessinerPieces() {
    const n = Phaser.Math.Clamp(Math.ceil(this.G.argent / 4), 0, 27);
    this.texteArgent.setText(this.G.argent + ' pièces');
    if (n === this.nbPieces) return;
    this.nbPieces = n;
    this.pieces.removeAll(true);
    const piles = [[40, 488], [100, 488], [70, 478]]; // celle du fond est dessinée en premier
    const ordre = [2, 0, 1];
    const hauteurs = [0, 0, 0];
    const empilees = Math.max(0, n - 3);
    for (let i = 0; i < empilees; i++) hauteurs[[0, 1, 2][i % 3]]++;
    for (const c of ordre) {
      const [px, py] = piles[c];
      for (let k = 0; k < hauteurs[c]; k++) {
        const piece = this.add.image(px + ((k * 7) % 3) - 1, py - k * 6, 'pieceTranche').setScale(2);
        piece.sommet = k === hauteurs[c] - 1;
        this.pieces.add(piece);
      }
    }
    // Les pièces éparpillées devant les piles
    const eparses = [[18, 498], [122, 500], [100, 508]];
    for (let k = 0; k < Math.min(3, n); k++) this.pieces.add(this.add.image(eparses[k][0], eparses[k][1], 'pieceFace').setScale(2));
  }

  // --- Déroulement ---

  voyageurSuivant() {
    this.buste = null;
    this.entree = null;
    this.voyageur = null;
    this.enService = false;
    this.actionB = null;
    this.majBoutonsService();
    if (this.carnetPose) { this.carnetPose.destroy(); this.carnetPose = null; }
    this.majPanneauGauche();
    this.majStock();
    this.dessinerPieces();
    if (this.G.file.length === 0) return this.finDeJournee();

    const entree = this.entree = this.G.file.shift();
    // Un client mis en attente retrouve son colis commencé (et ce que tu y as glissé).
    this.colis = entree.colis || {};
    this.pieges = entree.pieges || {};
    this.bouton('...', null);
    this.majCommande();
    // Un carnet laissé par la Faucheuse : personne ne s'avance, il est déjà là.
    if (entree.type === 'carnet') {
      this.perso.setVisible(false);
      return this.arrivee(entree);
    }
    const faucheuse = entree.type === 'faucheuse';
    this.dire(faucheuse ? "Le froid tombe d'un coup. Les bougies vacillent..." : "Quelqu'un approche du comptoir...", '');
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
      sprite.setVisible(true);
      this.tweens.add({ targets: sprite, x: FILE.x - i * FILE.ecart, duration: 900, delay: 300 + i * 150, ease: 'Sine.easeInOut',
        onStart: () => pasDeMarche(this, sprite, 900) });
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
    const f = echelleCorps(this.texturePour(entree));
    const marcheur = this.add.image(departX, FILE.y, this.texturePour(entree)).setOrigin(0.5, 1).setScale(FILE.echelle * f).setDepth(1.5);
    marcheur.setMask(this.masqueFenetre);
    this.tweens.add({ targets: marcheur, angle: { from: -3, to: 3 }, duration: 150, yoyo: true, repeat: 3 });
    pasDeMarche(this, marcheur, 1000);
    this.tweens.add({
      targets: marcheur, x: FENETRE.x + FENETRE.w / 2, y: SOL_COMPTOIR + 40, scale: 8 * f, alpha: 0, duration: 1000, ease: 'Sine.easeIn',
      onComplete: () => marcheur.destroy(),
    });
    this.montrerBuste(this.personneDe(entree), this.expressionArrivee(entree));
    const echelle = BUSTE.echelle * tailleBuste(this.personneDe(entree)).echelle;
    this.perso.setAlpha(0).setScale(echelle * 0.85);
    this.tweens.add({
      targets: this.perso, alpha: 1, scale: echelle, duration: 600, delay: 600, ease: 'Back.easeOut',
      onComplete: () => this.arrivee(entree),
    });
  }

  // --- Le client en buste : expressions, clignements, paroles ---

  personneDe(entree) {
    if (entree.type === 'client') return entree.voyageur;
    if (entree.type === 'famille') return entree.visite.parent;
    return entree.parti ? entree.parti.voyageur : null;
  }

  // Son humeur en arrivant au comptoir.
  expressionArrivee(entree) {
    if (entree.type === 'retour') return entree.parti.resultat.echec ? 'inquiet' : 'content';
    if (entree.type === 'famille') return entree.visite.intention === 'colere' ? 'fache' : entree.visite.intention === 'releve' ? 'neutre' : 'inquiet';
    const v = entree.voyageur;
    if (v.exige) return 'fache';
    if (entree.attentes > 1) return 'fache';
    return niveauRelation(this.G, v.nom).index >= 4 ? 'content' : 'neutre';
  }

  montrerBuste(personne, expression = 'neutre') {
    this.buste = { personne, expression };
    this.perso.setTexture(textureBusteHD(this, personne, expression)).setOrigin(0.5, 1).setFlipX(false).setAngle(0)
      .setPosition(FENETRE.x + FENETRE.w / 2, FENETRE.y + FENETRE.h + tailleBuste(personne).bas)
      .setScale(BUSTE.echelle * tailleBuste(personne).echelle).setVisible(true);
    if (!this.minuterieCligne) {
      // Il cligne des yeux de temps en temps.
      this.minuterieCligne = this.time.addEvent({ delay: 2600, loop: true, callback: () => {
        if (!this.buste || this.enTrainDeParler || Math.random() < 0.3) return;
        this.perso.setTexture(textureBusteHD(this, this.buste.personne, this.buste.expression, { cligne: true }));
        this.time.delayedCall(140, () => this.majVisage());
      } });
    }
  }

  majVisage(parle = false) {
    if (!this.buste) return;
    this.perso.setTexture(textureBusteHD(this, this.buste.personne, this.buste.expression, { parle }));
  }

  exprimer(expression) {
    if (!this.buste || this.buste.expression === expression) return;
    this.buste.expression = expression;
    this.majVisage();
  }

  // La bouche bouge pendant qu'il parle.
  parler(duree) {
    if (!this.buste) return;
    if (this.paroles) this.paroles.remove();
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
    if (entree.type === 'client') {
      conseilGarrick(this, 'comptoir');
      const v = this.voyageur = entree.voyageur;
      this.preparerTutoriel(v);
      let bonjour = v.prevu ? "C'est moi qui t'ai écrit, tu te souviens ? " : '';
      if (entree.attentes) bonjour = "Me revoilà ! On reprend où on en était ? ";
      if (v.habitue) bonjour = 'Re-bonjour, c\'est encore moi ! ' + (this.aReparer(v).length ? 'Mon matériel a souffert la dernière fois... ' : '');
      if (v.exige && !entree.attentes) bonjour += "Et après ma dernière mission ratée, tu me dois bien un objet de plus que ma commande ! ";
      if (!v.queteId) {
        // Il vient chercher l'aventure : c'est toi qui choisis où l'envoyer.
        this.dire(`${bonjour}${ENVIES[v.envie]} (${NIVEAUX_AVENTURIER[v.niveau].nom}${v.blessures ? `, encore blessé${v.feminin ? 'e' : ''}` : ''})`, this.nomAvecRelation(v.nom));
        this.choix(['Choisir sa destination', () => this.ouvrirCarte()], ['Refuser ce client', () => this.refuser()]);
        this.majCommande();
        return;
      }
      // Placé sur la carte ce matin : il connaît déjà sa destination.
      const planifie = entree.planifie && !entree.attentes ? `${ZONES[v.zone].nom} ? Va pour ça ! ` : '';
      this.dire(entree.attentes ? bonjour : bonjour + planifie + accord(v.accueil, v), this.nomAvecRelation(v.nom));
      this.servir();
    } else if (entree.type === 'retour') {
      const v = entree.parti.voyageur;
      this.dire(entree.parti.resultat.echec ? "Me revoilà... Vivant, au moins. Mais ça ne s'est pas passé comme prévu."
        : `Me revoilà, sain${v.feminin ? 'e' : ''} et sauf${v.feminin ? 've' : ''} ! Tu ne devineras jamais ce qui m'est arrivé...`, v.nom);
      this.titreCommande.setFontSize(17).setText('Retour de mission');
      this.bouton('Écouter son récit', () => this.ouvrirRecit(entree.parti));
    } else if (entree.type === 'famille') {
      this.visiteFamille(entree.visite);
    } else if (entree.type === 'faucheuse') {
      this.visiteFaucheuse(entree);
    } else {
      const v = entree.parti.voyageur;
      this.dire(this.G.faucheuse.visites ? `Le carnet de voyage de ${v.nom} est posé sur ton comptoir. Sa couverture est glacée.`
        : `Un berger a rapporté un carnet trouvé sur la route : celui de ${v.nom}... Il n'est jamais revenu${v.feminin ? 'e' : ''}.`, '');
      // Le carnet, couvert de givre, sur le rebord de la fenêtre.
      const g = this.carnetPose = this.add.graphics().setDepth(3);
      const cx = FENETRE.x + FENETRE.w / 2, cy = SOL_COMPTOIR + 2;
      g.fillStyle(0x3a2a1a).fillRect(cx - 30, cy - 22, 60, 22);
      g.fillStyle(0x5a3a22).fillRect(cx - 27, cy - 20, 54, 17);
      g.fillStyle(0xd8e8f0, 0.8).fillRect(cx - 30, cy - 22, 60, 3).fillRect(cx - 30, cy - 22, 4, 22).fillRect(cx + 14, cy - 19, 9, 2);
      g.fillStyle(0xe8c040).fillRect(cx - 4, cy - 14, 8, 6);
      this.titreCommande.setFontSize(17).setText('Une mauvaise nouvelle...');
      this.bouton('Lire le carnet', () => this.ouvrirRecit(entree.parti));
    }
  }

  // --- La Faucheuse ---

  // Ce qui reste visible dans l'obscurité : la Faucheuse, ses paroles et tes réponses.
  elementsDansLOmbre() {
    return [this.fondDialogue, this.plaqueNom, this.nomParleur, this.sousNom, this.texteDialogue, this.boutonAction.fond, this.boutonAction.label,
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
      '« Tiens, tiens... Toi. Tu commences à me plaire, petit marchand. »',
      "« Mon marchand préféré... Tu m'as manqué. Regarde tout ce que tu m'as apporté. »",
      "« Mon âme sœur... si j'en avais une. Personne ne me nourrit aussi bien que toi. »"];
    elle(sed.index ? charmes[sed.index] : saluts[t.index]);
    elle(`« ${enListe(noms)} ne reviendr${plusieurs ? 'ont' : 'a'} jamais de voyage. ${plusieurs ? 'Leurs' : 'Son'} nom${plusieurs ? 's sont' : ' est'} à moi, désormais. »`);

    // Ses commentaires sur tes choix.
    if (bilan.voulues.length) {
      const offerts = bilan.voulues.map(p => p.voyageur.nom.split(' ')[0]);
      const seul = bilan.voulues[0].voyageur.feminin ? "celle-là, tu me l'as offerte" : "celui-là, tu me l'as offert";
      elle(`« ${enListe(offerts)}... ${offerts.length > 1 ? 'ceux-là, tu me les as offerts' : seul}. Je n'oublie jamais un cadeau. »`);
    } else {
      const bienPrepare = entree.partis.find(p => p.chance >= 0.7);
      if (bienPrepare) elle(`« Tu avais pourtant tout fait pour ${bienPrepare.voyageur.nom.split(' ')[0]}. Ça ne suffit jamais. »`);
    }
    for (const p of bilan.demasques) {
      const id = Object.keys(p.pieges).find(k => p.pieges[k] > 0);
      elle(`« Mais on a retrouvé ${PIEGES[id] ? 'la ' + PIEGES[id].nom.toLowerCase() : 'ton piège'} de ${p.voyageur.nom.split(' ')[0]}... Le village murmure ton nom. »`);
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
    else if (G.mal >= SEUIL_SABOTAGE) elle('« Les gens commencent à chuchoter sur toi. Ils ont bien raison. »');
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
      elle(`« J'ai un travail pour toi. Demain, ${c.nom} viendra à ton comptoir. ${NOMS_RACES[c.race] || ''}, un cœur pur... les gentils l'adorent. »`);
      etapes.push({
        texte: `« Glisse-lui ceci dans son baluchon : ${PIEGES[mission.piege].nom.toLowerCase()}. Je te paierai ${mission.prime} pièces. »`,
        nom: 'La Faucheuse',
        choix: [['Accepter', () => {
          accepterSabotage(G);
          return '« Je savais que je pouvais compter sur toi. »';
        }], ['Refuser', () => {
          refuserSabotage(G);
          return '« Comme tu voudras... Pour l\'instant. »';
        }]],
      });
    }
    elle(sed.index >= 2 ? `« Je te laisse ${plusieurs ? 'leurs carnets' : 'son carnet'}... À très vite, mon marchand. »`
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
        this.boutonRefuser.setVisible(false);
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
    this.bouton('Remettre le colis', () => this.remettreColis());
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
    const prenom = d.nom.split(' ')[0];
    rencontrer(G, p.nom);
    this.titreCommande.setFontSize(17).setText('Une visite...');
    const parler = texte => this.dire(texte, `${p.nom}, ${p.lien} de ${d.nom}`, p.nom);
    const fin = reponse => { parler(reponse); this.bouton('...', null); this.majBoutonsService(); this.dessinerPieces(); this.majStock(); this.partirPar(FENETRE.x - 80); };

    if (visite.intention === 'colere') {
      parler(`C'est toi qui as équipé ${proche}, ${prenom} ? ${il[0].toUpperCase() + il.slice(1)} est mort${d.feminin ? 'e' : ''} à cause de ton matériel de pacotille !`);
      this.choix(['Dédommager (25 p.)', () => {
        if (!peutPayer(G, 25)) return fin("Tu n'as même pas de quoi payer ? Pathétique.");
        payer(G, 25, 'dedommagements');
        G.reputation += 0.5;
        fin("Hmph... Ça ne ramènera pas " + proche + ", mais c'est honnête de ta part.");
      }], ['Le renvoyer', () => {
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
        fin(`Une ${ITEMS[id].nom.toLowerCase()}... ${prenom} en avait toujours une sur ${d.feminin ? 'elle' : 'lui'}. Merci, du fond du cœur.${msg ? ' ' + msg : ''}`);
      }], ["Je n'ai rien", () => {
        changerRelation(G, p.nom, -1);
        fin('Je vois... Au revoir.');
      }]);
    } else if (visite.intention === 'releve') {
      const q = QUETES[d.queteId];
      parler(`Je veux finir ce que ${proche} a commencé : ${q.titre.toLowerCase()}. Aide-moi à me préparer, comme tu l'as fait pour ${d.feminin ? 'elle' : 'lui'} !`);
      this.choix([`L'équiper`, () => {
        const v = creerVoyageur(G, { quete: d.queteId, nom: p.nom, race: p.race, feminin: p.feminin });
        v.accueil = `Merci. Je pars ${q.titre.toLowerCase()}, pour honorer ${proche}. Prépare-moi bien.`;
        G.relations[p.nom] = Math.floor(d.points / 2);
        this.arrivee({ type: 'client', voyageur: v });
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

  ouvrirRecit(parti) {
    this.bouton('...', null);
    this.cameras.main.fadeOut(400);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Recit', { id: parti.voyageur.id }));
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

  // `confirme` : le joueur a déjà confirmé que c'est bien un objet en plus de la commande.
  donner(id, confirme = false) {
    if (!this.enService || this.enConfirmation) return;
    this.time.delayedCall(400, () => conseilGarrick(this, 'colis'));
    const v = this.voyageur;
    const commande = commandeDe(v);
    // Au-delà de la commande, c'est du suréquipement : seulement ce qui peut servir (soins,
    // ou un objet qu'une épreuve demande), et pas plus que ce que son sac peut porter.
    const enPlus = (this.colis[id] || 0) >= (commande[id] || 0);
    if (enPlus) {
      if (!commande[id] && !OBJETS_DE_SOIN.includes(id)) return this.dire("Hum, ça ne me servira à rien là où je vais.");
      if (totalSurplus(v, this.colis) >= tailleSac(v)) return this.dire(`Mon sac est plein ! Je ne peux porter que ${tailleSac(v)} objets en plus de ma commande.`);
    }
    if (this.G.stock[id] <= 0) {
      return this.dire("Tu n'en as plus en stock...", '');
    }
    // Un objet en plus de la commande : on demande confirmation, pour éviter les erreurs.
    if (enPlus && !confirme) return this.demanderSurplus(id);
    this.G.stock[id]--;
    this.colis[id] = (this.colis[id] || 0) + 1;
    if (enPlus) this.dire(OBJETS_DE_SOIN.includes(id) ? "Un soin de plus ? Merci, ça me fera un cœur de réserve !" : "Un de plus ? Ça peut toujours servir, merci !");
    this.majStock();
    this.majCommande();
  }

  demanderSurplus(id) {
    const v = this.voyageur;
    const effet = OBJETS_DE_SOIN.includes(id) ? 'des soins en plus lui donnent un cœur de réserve'
      : '+5 % sur l\'épreuve qui en a besoin';
    this.dire(`Tu veux vraiment donner 1 ${ITEMS[id].nom} EN PLUS de sa commande ? (${effet} · sac : ${totalSurplus(v, this.colis)} / ${tailleSac(v)} · ` +
      'le surplus n\'est pas payé)', 'Objet en plus');
    this.enConfirmation = true;
    const fin = () => { this.enConfirmation = false; this.servir(); };
    this.choix([`Oui, en plus`, () => { fin(); this.donner(id, true); }],
      ['Non', () => { fin(); this.dire("D'accord, je garde juste ma commande.", v.nom); }]);
  }

  // Clic sur une ligne de la commande : reprendre un objet, ou réparer celui du client.
  // Retirer un objet du colis, tant qu'il n'est pas remis : il retourne dans ta réserve.
  retirer(i) {
    const id = this.lignesCommande[i].id;
    if (!this.enService || this.enConfirmation || !id || !this.colis[id]) return;
    this.colis[id]--;
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
      this.reparer(id);
    }
    this.majStock();
    this.majCommande();
  }

  // Les objets durables du client qui ont besoin d'une réparation (et qu'il peut encore utiliser).
  aReparer(v) {
    return Object.keys(commandeDe(v)).filter(id => {
      const etat = etatObjet(v, id);
      return ITEMS[id].durable && etat > 0 && etat < USURE_MAX;
    });
  }

  // Réparer coûte des matériaux, et c'est le client qui paie la main-d'œuvre.
  reparer(id) {
    const erreur = reparerObjet(this.G, this.voyageur, id);
    if (erreur) return this.dire(erreur, '');
    this.dessinerPieces();
    this.dire(`Merci ! Ma ${ITEMS[id].nom.toLowerCase()} est comme neuve. Voilà ${PRIX_REPARATION} pièces pour ta peine.`);
  }

  // Refuser un client : il repart, et la réputation en prend un coup.
  refuser() {
    if (!this.voyageur) return;
    const v = this.voyageur;
    for (const [id, n] of Object.entries(this.colis)) {
      const pieges = this.pieges[id] || 0;
      this.G.stock[id] += n - pieges;
      if (pieges) this.G.pieges[id] += pieges;
    }
    this.colis = {};
    this.pieges = {};
    const msg = refuserClient(this.G, v);
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
    const versDroite = x > this.perso.x;
    const entree = this.entree;
    const corps = () => {
      // Il se retourne : on le voit de nouveau en entier.
      if (!this.buste) return;
      this.buste = null;
      if (this.paroles) { this.paroles.remove(); this.paroles = null; this.enTrainDeParler = false; }
      if (entree) this.perso.setTexture(this.texturePour(entree));
      this.perso.setScale(9 * echelleCorps(this.perso.texture.key)).setY(SOL_COMPTOIR).setFlipX(versDroite);
    };
    if (!this.buste) this.perso.setFlipX(versDroite);
    const decalage = versDroite ? 22 : -22;
    const inclinaison = versDroite ? -22 : 22;
    // Le baluchon est porté à hauteur des mains, qui dépend de la taille de son peuple.
    // En marchant, le baluchon se balance au bout du bâton et rebondit à chaque pas.
    let balance = false;
    const placer = () => {
      const cle = this.perso.texture.key;
      const mains = cle.startsWith('corps_') ? (MAINS_CORPS[cle] || 28) * this.perso.scaleY : 62;
      const t = this.time.now;
      const swing = balance ? Math.sin(t / 130) * 9 : 0;
      const rebond = balance ? Math.abs(Math.sin(t / 125)) * 5 : 0;
      porte.setPosition(this.perso.x + decalage * this.perso.scaleY / (9 * echelleCorps(cle)), this.perso.y - mains - rebond)
        .setAngle(inclinaison + this.perso.angle + swing);
    };
    if (porte) {
      porte.setFlipX(!versDroite).setOrigin(versDroite ? 0.95 : 0.05, 0.95).setDepth(2.1);
      placer();
    }
    const partir = () => this.tweens.add({
      targets: this.perso, x, duration: porte ? 1900 : 1400, ease: 'Sine.easeIn',
      onStart: () => { balance = true; this.marche(porte ? 1900 : 1400); },
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
      const salut = this.add.text(this.perso.x + (versDroite ? -30 : 30), this.perso.y - this.perso.displayHeight - 6, '👋', style(26, '#ffffff')).setOrigin(0.5).setDepth(6);
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
    this.tweens.add({ targets: boite, scale: 5, duration: 250, ease: 'Back.easeOut' });
    objets.forEach((id, i) => this.time.delayedCall(300 + i * 170, () => {
      const depart = this.cases[id].icone;
      const icone = this.add.image(depart.x, depart.y, iconeObjet(this, id)).setScale(2).setDepth(6);
      this.tweens.add({
        targets: icone, x: bx, y: SOL_COMPTOIR - 30, scale: 2, duration: 450, ease: 'Quad.easeIn',
        onComplete: () => {
          icone.destroy();
          this.tweens.add({ targets: boite, scaleY: 4.5, duration: 70, yoyo: true });
        },
      });
    }));
    // On noue le tissu au bout du bâton...
    this.time.delayedCall(300 + objets.length * 170 + 500, () => {
      // Le motif dépend de ce qu'il contient, la taille du nombre d'objets.
      const taille = 3.4 + Math.min(objets.length, 10) * 0.2;
      boite.setTexture('baluchon_' + famille).setScale(taille);
      this.tweens.add({ targets: boite, angle: { from: -8, to: 8 }, duration: 90, yoyo: true, repeat: 2, onComplete: () => boite.setAngle(0) });
      const ficelle = this.add.text(bx, SOL_COMPTOIR - 70, 'Noué !', style(16, '#f3d98a', { fontStyle: 'bold', stroke: '#2a1a10', strokeThickness: 4 }))
        .setOrigin(0.5).setDepth(6);
      this.tweens.add({ targets: ficelle, y: ficelle.y - 20, alpha: 0, delay: 400, duration: 500, onComplete: () => ficelle.destroy() });
      // ... et le client le prend.
      this.time.delayedCall(700, () => {
        // ... et le client le hisse sur son épaule.
        boite.setOrigin(0.95, 0.95).setPosition(boite.x + boite.displayWidth * 0.45, boite.y);
        this.tweens.add({
          // Sur l'épaule (en buste, l'épaule est plus bas et plus à droite)
          targets: boite, x: this.perso.x + (this.buste ? 78 : 22), y: this.perso.y - (this.buste ? 34 : 62), angle: -22, duration: 400, ease: 'Back.easeOut',
          onComplete: () => suite(boite),
        });
      });
    });
  }

  // --- Le marchand express : une page à part, le comptoir attend en pause ---

  ouvrirExpress() {
    if (!this.enService) return;
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
      this.dire(`${ZONES[data.destination].nom} ? Va pour ça ! ` + accord(v.accueil, v), this.nomAvecRelation(v.nom));
      this.servir();
    }
    if (data && data.achats && data.achats.length) {
      this.dire(`Grippesou t'a vendu : ${data.achats.join(', ')}. C'est déjà sur ton comptoir, prêt à servir !`, '');
    }
  }

  // « qui » : la personne dont le nom prend la couleur de votre relation (rouge → vert).
  // Par défaut, le client au comptoir quand c'est lui qui parle.
  dire(texte, nom = this.voyageur ? this.voyageur.nom : '', qui = null) {
    if (!qui && this.voyageur && nom && nom.startsWith(this.voyageur.nom)) qui = this.voyageur.nom;
    // « Pippa Boisclair — Inconnu » : le nom sur la plaque, la relation en dessous.
    // (« Dagna, fille de Borin » : pareil, la suite passe sous la plaque.)
    const coupure = nom.includes(' — ') ? ' — ' : ', ';
    const [nomSeul, ...reste] = nom.split(coupure);
    this.plaqueNom.setVisible(!!nomSeul);
    this.nomParleur.setText(nomSeul).setColor(qui ? couleurNom(this.G, qui, true) : '#f3d98a').setFontSize(15);
    for (let taille = 14; this.nomParleur.width > 176 && taille >= 10; taille--) this.nomParleur.setFontSize(taille);
    this.sousNom.setText(reste.join(coupure)).setColor(qui ? couleurNom(this.G, qui) : '#5a4028').setFontSize(12);
    for (let taille = 11; this.sousNom.width > 200 && taille >= 9; taille--) this.sousNom.setFontSize(taille);
    // Le texte rapetisse un peu s'il est long, pour toujours tenir dans le parchemin.
    this.texteDialogue.setText(texte).setFontSize(16);
    for (let taille = 15; this.texteDialogue.height > 70 && taille >= 12; taille--) this.texteDialogue.setFontSize(taille);
    if (qui && this.buste && this.buste.personne.nom === qui) this.parler(Math.min(2400, 400 + texte.length * 22));
  }

  remettreColis() {
    const v = this.voyageur;
    const chance = chanceDeRetour(v, this.colis);
    const msg = partir(this.G, v, this.colis, this.pieges);
    this.enService = false;
    this.time.delayedCall(2500, () => conseilGarrick(this, 'remis'));
    this.majCommande(); // le colis est remis : on ne peut plus rien retirer
    this.majBoutonsService();
    this.bouton('...', null);
    this.majPanneauGauche();

    const jours = v.duree > 1 ? `dans ${v.duree} jours` : 'demain';
    const phrase = chance >= 0.75 ? `Parfait ! Je reviendrai ${jours} avec ta part du butin, promis !`
      : chance >= 0.4 ? `Ce n'est pas tout ce que je voulais... mais je ferai avec. Rendez-vous ${jours} !`
      : "C'est tout ? Bon... Souhaite-moi bonne chance.";
    const objets = Object.entries(this.colis).flatMap(([id, n]) => Array(n).fill(id));
    const sEnAller = colis => {
      this.dire(phrase + (msg ? ' ' + msg : ''), this.nomAvecRelation(v.nom));
      this.partirPar(FENETRE.x + FENETRE.w + 60, colis);
    };
    if (!objets.length) return sEnAller(null);
    this.dire('Tu prépares le colis...', '');
    this.empaqueter(objets, sEnAller);
  }

  finDeJournee() {
    this.majFileAttente();
    this.majCommande();
    this.bouton('Fermer le comptoir', () => { this.bouton('...', null); this.baisserStore(() => this.scene.start('Nuit')); });
    this.dire('Le soleil se couche sur la Comté. Plus personne ne fait la queue.', 'Fin de la journée');
    this.tweens.add({ targets: this.cielNuit, alpha: 1, duration: 3000 });
    this.tweens.add({ targets: this.voile, fillAlpha: 0.25, duration: 3000 });
  }

  // --- Mise à jour de l'affichage ---

  majPanneauGauche() {
    this.texteJour.setText('Jour ' + this.G.jour);
    this.texteJoueur.setText(`${nomJoueur(this.G)}, ${ageJoueur(this.G)} ans`);

    const missions = enMission(this.G).map(p => {
      const quand = p.retour <= this.G.jour ? "aujourd'hui" : 'jour ' + p.retour;
      return `${p.voyageur.nom} — retour ${quand}`;
    });
    this.texteMissions.setText(listeCourte(missions, 4, 'Personne pour l\'instant'));

    this.lignesLettres.forEach((t, i) => {
      const a = this.G.annonces[i];
      t.setText(a ? `✉ Jour ${a.jour} · ${a.voyageur.nom}${a.acceptee ? '' : ' (à répondre)'}` : (i === 0 ? 'Aucune lettre' : ''));
    });
  }

  majStock() {
    for (const [id, c] of Object.entries(this.cases)) {
      const n = this.G.stock[id];
      c.qte.setText('x' + n).setColor(n > 0 ? '#3a2410' : '#a03020');
      c.pile.forEach((img, k) => img.setVisible(k === 2 || n > 2 - k).setAlpha(n > 0 ? 1 : 0.35));
    }
    this.majTiroirSecret();
    this.majTiroirCadeaux();
    const m = this.G.materiaux;
    this.texteReserve.setText(`Réserve ${stockTotal(this.G)}/${this.G.capacite} · Fer ${m.fer} · Cuir ${m.cuir}`);
  }

  majCommande() {
    const v = this.voyageur;
    const commande = v ? commandeDe(v) : {};
    const plus = v ? surplus(v, this.colis) : {};
    // La commande, puis les soins donnés en plus.
    const ids = [...Object.keys(commande), ...Object.keys(plus).filter(id => !commande[id])];
    const cible = v && estCible(this.G, v) ? '☠ ' : '';
    if (v) {
      this.titreCommande.setText(cible + v.nom).setFontSize(17);
      for (let taille = 16; this.titreCommande.width > 235 && taille >= 12; taille--) this.titreCommande.setFontSize(taille);
    }
    this.sousTitre.setText(v ? (v.queteId ? `→ ${ZONES[v.zone].nom}` : "cherche l'aventure") : '');
    this.texteSac.setText(v ? (v.queteId ? `Sac : ${totalSurplus(v, this.colis)} / ${tailleSac(v)} en plus` +
      (coeursEnPlus(v, this.colis) ? ` · +${coeursEnPlus(v, this.colis)} cœur${coeursEnPlus(v, this.colis) > 1 ? 's' : ''}` : '') + ' · ' : '') +
      `🍀 ${trefleDe(this.G, v.nom)}/${TREFLE_MAX} · ${NIVEAUX_AVENTURIER[v.niveau].nom}` : '');
    this.lignesCommande.forEach((ligne, i) => {
      const id = ids[i];
      ligne.id = id || null;
      ligne.icone.setVisible(!!id);
      const retirable = !!id && !!this.colis[id] && this.enService;
      ligne.moins.setVisible(retirable);
      ligne.moinsTexte.setVisible(retirable);
      if (!id) return ligne.txt.setText('');
      ligne.icone.setTexture(id);
      const donne = this.colis[id] || 0;
      const etat = ITEMS[id].durable ? etatObjet(v, id) : 0;
      if (!donne && id in v.inventaire) {
        // Le client a déjà le sien : on peut le réparer au lieu d'en donner un neuf.
        const cout = `${materiauxRequis(this.G)} ${MATERIAUX[MATERIAU_DE[id]].nom.toLowerCase()}`;
        const texte = etat > 0 ? `${ITEMS[id].nom} · sienne ${etat}/${USURE_MAX}${etat < USURE_MAX ? ` (réparer : ${cout})` : ' ✓'}`
          : `${ITEMS[id].nom} · la sienne est cassée`;
        ligne.txt.setText(texte).setFontSize(12).setColor(etat >= 2 ? '#2f6a2a' : '#8a5a10');
        return;
      }
      if (!commande[id]) {
        ligne.txt.setText(`${ITEMS[id].nom}  +${donne} (en plus)`).setFontSize(13).setColor('#1f5aa0');
        return;
      }
      const ok = donne >= commande[id];
      const piege = this.pieges && this.pieges[id] ? `  ☠${this.pieges[id] > 1 ? this.pieges[id] : ''}` : '';
      ligne.txt.setText(`${ITEMS[id].nom}  ${Math.min(donne, commande[id])} / ${commande[id]}  ${ok ? '✓' : ''}${plus[id] ? ` +${plus[id]}` : ''}${piege}`)
        .setFontSize(14).setColor(piege ? '#7a1a4a' : ok ? '#2f6a2a' : '#3b2410');
    });
    // Son visage suit son colis : content s'il est bien équipé, inquiet s'il manque des choses.
    if (v && this.enService && v.queteId && this.buste && this.buste.personne === v) {
      const c = chanceDeRetour(v, this.colis);
      this.exprimer(v.exige && !totalSurplus(v, this.colis) ? 'fache' : c >= 0.75 ? 'content' : c < 0.4 ? 'inquiet' : 'neutre');
    }
    if (v && !v.queteId) {
      this.texteChance.setText('Choisis sa destination').setColor('#8a6a10');
    } else if (v) {
      // Ton flair estime les chances : faussé au début, précis avec l'expérience.
      const c = chanceEstimee(this.G, v, this.colis, this.pieges);
      const couleur = c >= 0.75 ? '#2f6a2a' : c >= 0.4 ? '#8a6a10' : '#a03030';
      const exact = niveauFlair(this.G) >= 1;
      if (piegeFatal(v, this.pieges)) this.texteChance.setText('Chances de retour : aucune ☠').setColor('#7a1a4a');
      else this.texteChance.setText(`${exact ? 'Chances de retour' : 'Ton flair dit'} : ${exact ? '' : '~'}${Math.round(c * 100)} %`).setColor(couleur);
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

// Le tissu du baluchon selon ce qu'il contient le plus : provisions, armes, soins...
// ou « divers » quand c'est un peu de tout.
function familleColis(objets) {
  const familles = { provisions: ['ration', 'gourde'], armes: ['epee', 'fleches', 'bouclier'], soins: ['potion', 'bandage', 'antidote'] };
  for (const [famille, ids] of Object.entries(familles)) {
    if (objets.filter(id => ids.includes(id)).length > objets.length / 2) return famille;
  }
  return 'divers';
}
