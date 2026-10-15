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
    this.mesureArdoise = null;   // (audit v0.59 : le texte de mesure de la veille est détruit)
    this.G = window.GAME;
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
    this.boutonAction.setTexte('');   // (pas de plaque vide tant qu'il n'y a rien à faire)
    this.majBoutonsService();

    // Au retour de chez Grippesou, on remet l'affichage à jour.
    this.events.off('resume', this.auRetourExpress, this);
    this.events.on('resume', this.auRetourExpress, this);

    this.cameras.main.fadeIn(400);
    this.creerStore();
    if (this.G.comptoirOuvert !== this.G.jour) {
      // Midi : on lève le store, le comptoir est officiellement ouvert.
      this.G.comptoirOuvert = this.G.jour;
      this.dire('Midi sonne au clocher. Clique sur le store pour l\'ouvrir et commencer la journée !', '');
      this.attendreStore();
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

  // Le store attend qu'on clique dessus : il luit doucement, une main invite à tirer.
  attendreStore() {
    const { x, y, w, h } = FENETRE;
    this.store.setVisible(true).setY(y + h + 6);
    const zone = this.add.rectangle(x + w / 2, y + h / 2, w, h, 0xffffff, 0).setDepth(2.6).setInteractive({ useHandCursor: true });
    const invite = this.add.text(x + w / 2, y + h - 30, '▲ Ouvrir le store ▲', style(18, '#ffe9a0', { fontStyle: 'bold', stroke: '#2a1a10', strokeThickness: 5 }))
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
    this.dessinerReliques();
    creerObjetsHD(this);
    this.add.image(0, 0, 'murComptoir').setOrigin(0).setScale(2);
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
    this.add.image(x - 16, y - 16, 'cadreFenetre').setOrigin(0).setScale(2).setDepth(3);
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
    this.G.file.push(entree);
    this.fileSprites.push(this.spriteFile(entree, this.G.file.length - 1).setVisible(false));
    this.majFileAttente();
    this.partirPar(FENETRE.x - 80);
  }

  texturePour(entree) {
    if (entree.type === 'faucheuse') return 'perso_faucheuse';
    if (entree.type === 'famille') return corpsHD(this, entree.visite.parent);
    if (entree.type === 'notable') { const p = this.personneDe(entree); return corpsHD(this, p.figurant || p); }
    if (entree.type === 'colporteur') return corpsHD(this, 'colporteur');
    if (entree.type === 'garde') return corpsHD(this, GARDE.capitaine);
    if (entree.type === 'garrick') return corpsHD(this, 'mentor');
    if (entree.type === 'collecteur') return corpsHD(this, collecteurDe(this.G));
    if (entree.type === 'serpent') return corpsHD(this, CHEFS_SERPENT[0]);
    if (entree.type === 'aine') return corpsHD(this, personneAine(entree.race));
    const v = entree.type === 'client' ? entree.voyageur : entree.parti.voyageur;
    return corpsHD(this, v);
  }

  majFileAttente() {
    const n = this.G.file.length;
    this.texteAttente.setText(n === 0 ? 'Plus personne' : `En attente : ${n}`);
    this.fondAttente.setVisible(true);
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
    Son.jouer('page');
    const v = a.voyageur;
    this.dire(`« Je passerai à ton comptoir le jour ${a.jour}. Je pars : ${(t => t.charAt(0).toLowerCase() + t.slice(1))(v.quete)}. ` +
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
    this.add.text(700, 226, '− : retirer · clic sur une ligne : réparer', style(11, '#7a5a3a', { fontStyle: 'italic' }));
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
    this.add.text(150, 357, 'Ton stock — clic : ajouter au baluchon', style(12, '#f3e6c8', { fontStyle: 'italic', stroke: '#1a100a', strokeThickness: 3 }));
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
      c.add([ligne, this.add.image(316, y, iconeObjet(this, id)).setScale(2),
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
    if (!commande[id]) return this.dire(`${v.nom.split(' ')[0]} n'a pas commandé ${deNom(ITEMS[id].nom.toLowerCase())} : ça éveillerait ses soupçons.`, '');
    if ((this.colis[id] || 0) >= commande[id]) return this.dire(`Son baluchon a déjà son compte ${deNom(ITEMS[id].nom.toLowerCase())}. Retires-en un d'abord.`, '');
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
      icone.on('pointerdown', () => this.dire(DECORATIONS[id].effet, DECORATIONS[id].nom));
    });
  }

  creerArgent() {
    // Ta bourse, posée sur le comptoir : elle gonfle avec tes pièces.
    this.bourse = bourse(this, 66, 500, this.G.argent, { echelle: 2.2, taille: 17 });
    // De temps en temps, une pièce scintille quand la bourse est bien pleine.
    this.time.addEvent({ delay: 1400, loop: true, callback: () => {
      if (this.bourse.niveau < 2 || Math.random() < 0.35) return;
      const eclat = this.add.image(66 + Phaser.Math.Between(-14, 14), 500 - Phaser.Math.Between(20, 50), 'eclat').setScale(0).setDepth(1);
      this.tweens.add({ targets: eclat, scale: 2, angle: 45, duration: 260, yoyo: true, onComplete: () => eclat.destroy() });
    } });
  }

  dessinerPieces() {
    this.bourse.maj(this.G.argent);
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
    Son.jouer(faucheuse ? 'froid' : 'clochette');
    if (faucheuse) Son.ambiance('faucheuse');
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
    // Il dit bonjour (ou grogne, si c'est une famille en colère ou la Faucheuse)
    this.time.delayedCall(260, () => { if (this.buste) Son.jouer('voix', { personne: this.buste.personne, ton: this.buste.expression === 'fache' ? 'grogne' : entree.type === 'faucheuse' ? 'grogne' : 'bonjour' }); });
    const echelle = BUSTE.echelle * tailleBuste(this.personneDe(entree)).echelle;
    this.perso.setAlpha(0).setScale(echelle * 0.85);
    this.tweens.add({
      targets: this.perso, alpha: 1, scale: echelle, duration: 600, delay: 600, ease: 'Back.easeOut',
      onComplete: () => this.arrivee(entree),
    });
  }

  // Un visiteur notable vient te féliciter d'avoir franchi un palier de réputation, et t'apporte
  // la récompense : une promesse, une prime, une décoration, ou de nouvelles visites.
  visiteNotable(entree) {
    const G = this.G;
    const p = PALIERS_CLIENTS[entree.palier];
    const qui = { bourgmestre: 'Odilon Bonnefoi, bourgmestre', heraut: 'Le héraut de la Confrérie du Dernier Rempart', colporteur: COLPORTEUR.nom, legende: "Isolde Lame-d'Aurore, légende vivante" }[p.visiteur];
    const bonjour = {
      bourgmestre: `Bonjour, ${nomJoueur(G, 'petit')} ! Tout le bourg parle de « ${G.nomShop} » : on dit maintenant « ${p.nom} » ! Je tenais à te féliciter en personne.`,
      heraut: `Oyez ! La Confrérie du Dernier Rempart salue « ${G.nomShop} », désormais « ${p.nom} ». Ton nom est inscrit dans nos registres.`,
      colporteur: `Alors c'est ici, le fameux comptoir ? On en parle sur tous les chemins ! « ${p.nom} », rien que ça ! Bravo. Je passerai te voir avec ma charrette.`,
      legende: `On m'avait parlé de toi, ${nomJoueur(G, 'petit')}. « ${p.nom} », tenu par quelqu'un de si jeune... J'ai voulu voir ça de mes yeux. Je ne suis pas déçue.`,
    }[p.visiteur];
    this.titreCommande.setFontSize(17).setText('⭐ Un visiteur notable');
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
    const G = this.G, visite = GARRICK_VISITES[entree.i];
    G.garrickVu = [...(G.garrickVu || []), entree.i];
    this.titreCommande.setFontSize(17).setText('Une visite');
    this.dire(visite.texte, 'Garrick Cœur-de-Chêne');
    this.bouton('« Merci, Garrick ! »', () => {
      if (visite.cadeau) { encaisser(G, visite.cadeau, 'cadeau'); this.dessinerPieces(); Son.jouer('pieces'); }
      this.dire(visite.cadeau ? `Garrick glisse ${visite.cadeau} pièces sur le comptoir. « Ne dis rien, ha ha ! Allez, au travail, petit. »` : "« Allez, au travail, petit. Je repasserai ! »", 'Garrick Cœur-de-Chêne');
      this.bouton('Au revoir !', () => { this.bouton('...', null); this.partirPar(FENETRE.x - 80); });
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
    this.dire(`${motif} ${v.fouille ? 'Fouille !' : 'Premier avertissement.'}${saisie} L'amende : ${v.amende} pièces. ${garde.nom} est avec moi.`, cap);
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
    const col = collecteurDe(G), qui = col.nom, pre = col.nom.split(' ')[0];
    const rang = rangMafia(G);
    const partir = () => { this.actionB = null; this.majBoutonsService(); this.dessinerPieces(); this.majStock(); this.bouton('...', null); this.time.delayedCall(1800, () => this.partirPar(FENETRE.x - 80)); };
    this.titreCommande.setFontSize(17).setText(`${bande} · ${NOMS_RANGS[rang]}`);
    for (let t = 16; this.titreCommande.width > 235 && t >= 11; t--) this.titreCommande.setFontSize(t);
    const sortie = () => {
      const prix = prixRachat(G);
      this.dire(`${pre} ne cille pas. « Sortir ? Ça se paie. ${prix} pièces. Et ton nom disparaît de nos registres. »`, qui);
      this.choix([`Racheter ta liberté (${prix} p.)`, () => {
        const err = racheterLiberte(G);
        if (err) { Son.jouer('refus'); this.dire(`« ${err} Reviens quand tu les auras. »`, qui); return partir(); }
        Son.jouer('pieces'); this.dire(`${pre} compte les pièces, une à une, en silence. « Te voilà libre. Nous ne nous sommes jamais vus. » La porte se referme sans un bruit.`, qui); partir();
      }], ['Non, oublie', () => { this.dire('« Alors rien ne change. »', qui); partir(); }]);
    };
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
        this.dire(`${pre} hoche à peine la tête. « Bien. »${msg ? ' ' + msg : ''} (La jauge penche vers l'ombre, et la garde pourrait s'y intéresser.)`, qui);
        partir();
      }], [`Payer plutôt (${pizzo} p.)`, () => { payerPizzo(G); Son.jouer('pieces'); this.dire('« L\'argent fera l\'affaire. Cette fois. »', qui); partir(); }]);
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
    this.dire(`« On t'a vu travailler pour la Main Noire. » ${vesna.nom} parle bas, sans un sourire ; derrière elle, ${corvin.nom} garde la main sur son arc. « Le Serpent prend moins, et paie mieux. Choisis. On ne posera pas la question deux fois. »`, vesna.nom);
    const partir = () => { this.actionB = null; this.majBoutonsService(); this.bouton('...', null); this.time.delayedCall(1800, () => this.partirPar(FENETRE.x - 80)); };
    this.choix(['Rester fidèle à la Main Noire', () => {
      choisirBande(G, 'main');
      this.dire(`${corvin.nom} se lève. « Le Serpent a deux têtes. Et il n'oublie rien. » (Ils se vengeront cette nuit.)`, corvin.nom); partir();
    }], ['Rejoindre le Serpent', () => {
      choisirBande(G, 'serpent');
      this.dire(`${vesna.nom} te serre la main, longuement ; ${corvin.nom} pose la sienne par-dessus. « Tu es des nôtres. La Main Noire l'apprendra vite. Tiens-toi prêt. » (Elle se vengera cette nuit.)`, vesna.nom); partir();
    }]);
  }

  // Le colporteur passe avec sa hotte : des choses rares, un peu plus cher qu'au marché.
  visiteColporteur(entree) {
    this.titreCommande.setFontSize(17).setText('Le colporteur');
    this.dire("Salut, l'ami ! J'ai de belles choses dans ma hotte aujourd'hui. Un coup d'œil ? C'est un peu plus cher qu'au marché, mais c'est là, sous ton nez.", COLPORTEUR.nom);
    this.choix(['Voir sa marchandise', () => { this.scene.pause(); this.scene.launch('Express', { comptoir: this, vendeur: 'colporteur' }); }],
      ['Pas aujourd\'hui', () => { this.dire('Comme tu veux ! Je repasserai.', COLPORTEUR.nom); this.bouton('...', null); this.partirPar(FENETRE.x - 80); }]);
  }

  // --- Le client en buste : expressions, clignements, paroles ---

  personneDe(entree) {
    if (entree.type === 'client') return entree.voyageur;
    if (entree.type === 'famille') return entree.visite.parent;
    if (entree.type === 'colporteur') return { nom: COLPORTEUR.nom, race: 'humain', feminin: false, figurant: 'colporteur' };
    if (entree.type === 'garde') return GARDE.capitaine;
    if (entree.type === 'collecteur') return collecteurDe(this.G);
    if (entree.type === 'serpent') return CHEFS_SERPENT[0];
    if (entree.type === 'garrick') return { nom: 'Garrick Cœur-de-Chêne', race: 'humain', feminin: false, figurant: 'mentor' };
    if (entree.type === 'aine') return personneAine(entree.race);
    if (entree.type === 'notable') {
      // Le visiteur notable du palier : le bourgmestre, le héraut de la Confrérie, une légende...
      const v = PALIERS_CLIENTS[entree.palier].visiteur;
      if (v === 'legende') return { nom: "Isolde Lame-d'Aurore", race: 'elfe', feminin: true, niveau: 'legende' };
      if (v === 'colporteur') return { nom: COLPORTEUR.nom, race: 'humain', feminin: false, figurant: 'colporteur' };
      return { nom: FIGURANTS[v].nom, race: 'humain', feminin: false, figurant: v }; // (un figurant : bourgmestre, héraut)
    }
    return entree.parti ? entree.parti.voyageur : null;
  }

  // Son humeur en arrivant au comptoir.
  expressionArrivee(entree) {
    if (entree.type === 'retour') return entree.parti.resultat.echec ? 'inquiet' : 'content';
    if (entree.type === 'notable' || entree.type === 'colporteur' || entree.type === 'garrick') return 'content';
    if (entree.type === 'aine') return 'neutre';
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
    if (entree.type === 'client') {
      conseilGarrick(this, 'comptoir');
      const v = this.voyageur = entree.voyageur;
      this.preparerTutoriel(v);
      // Un client prestigieux vérifie d'abord que tu es à la hauteur
      if (v.prestige && !entree.attentes) {
        const refus = refusPrestige(this.G, v);
        this.titreCommande.setFontSize(17).setText('👑 Un client prestigieux');
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
      if (entree.attentes) bonjour = "Me revoilà ! On reprend où on en était ? ";
      if (v.habitue) bonjour = 'Re-bonjour, c\'est encore moi ! ' + (this.aReparer(v).length ? 'Mon matériel a souffert la dernière fois... ' : '');
      if (v.exige && !entree.attentes) bonjour += "Et après ma dernière mission ratée, tu me dois bien un objet de plus que ma commande ! ";
      // Ce qu'il pense de ton comptoir (ses décorations, ton côté de la jauge)
      const remarque = !entree.attentes && !v.habitue ? remarqueCamp(this.G, v) : null;
      if (remarque) bonjour = remarque + ' ' + bonjour;
      // Un client exigeant prévient après son bonjour : grosse commande, et rien d'usé
      const exigeant = v.exigeant && !entree.attentes && v.queteId ? ` Et je suis exigeant${v.feminin ? 'e' : ''} : une grosse commande, et du matériel neuf, pas de vieilles cordes rafistolées.` : '';
      if (!v.queteId) {
        // Il vient chercher l'aventure : c'est toi qui choisis où l'envoyer.
        this.dire(`${bonjour}${ENVIES[v.envie]} (${NIVEAUX_AVENTURIER[v.niveau].nom}${v.blessures ? `, encore blessé${v.feminin ? 'e' : ''}` : ''})`, this.nomAvecRelation(v.nom));
        this.choix(['Choisir sa destination', () => this.ouvrirCarte()], ['Refuser ce client', () => this.refuser()]);
        this.majCommande();
        return;
      }
      // Placé sur la carte ce matin : il connaît déjà sa destination.
      const planifie = entree.planifie && !entree.attentes && !(v.accueil || '').includes(ZONES[v.zone].nom) ? `${ZONES[v.zone].nom} ? Va pour ça ! ` : '';
      this.dire(entree.attentes ? bonjour : bonjour + planifie + accord(v.accueil, v) + exigeant, this.nomAvecRelation(v.nom));
      this.servir();
    } else if (entree.type === 'retour') {
      const v = entree.parti.voyageur;
      this.dire(entree.parti.resultat.echec ? "Me revoilà... Vivant, au moins. Mais ça ne s'est pas passé comme prévu."
        : `Me revoilà, sain${v.feminin ? 'e' : ''} et sauf${v.feminin ? 've' : ''} ! Tu ne devineras jamais ce qui m'est arrivé...`, v.nom);
      this.titreCommande.setFontSize(17).setText('Retour de mission');
      this.bouton('Écouter son récit', () => this.ouvrirRecit(entree.parti));
    } else if (entree.type === 'famille') {
      this.visiteFamille(entree.visite);
    } else if (entree.type === 'notable') {
      this.visiteNotable(entree);
    } else if (entree.type === 'colporteur') {
      this.visiteColporteur(entree);
    } else if (entree.type === 'garde') {
      this.visiteGarde(entree);
    } else if (entree.type === 'garrick') {
      this.visiteGarrick(entree);
    } else if (entree.type === 'collecteur') {
      this.visiteCollecteur(entree);
    } else if (entree.type === 'serpent') {
      this.visiteSerpent(entree);
    } else if (entree.type === 'aine') {
      this.visiteAine(entree);
    } else if (entree.type === 'faucheuse') {
      this.visiteFaucheuse(entree);
    } else {
      const v = entree.parti.voyageur;
      this.dire(this.G.faucheuse.visites ? `Le carnet de voyage de ${v.nom} est posé sur ton comptoir. Sa couverture est glacée.`
        : `Un berger a rapporté un carnet trouvé sur la route : celui de ${v.nom}... ${v.feminin ? 'Elle' : 'Il'} n'est jamais revenu${v.feminin ? 'e' : ''}.`, '');
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
      `« Tiens, tiens... Toi. Tu commences à me plaire, ${eJ() ? 'petite marchande' : 'petit marchand'}. »`,
      `« ${eJ() ? 'Ma marchande préférée' : 'Mon marchand préféré'}... Tu m'as manqué. Regarde tout ce que tu m'as apporté. »`,
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
      elle(`« Mais on a retrouvé ${PIEGES[id] ? leNom(id, PIEGES[id].nom.toLowerCase()) : 'ton piège'} de ${p.voyageur.nom.split(' ')[0]}... Le village murmure ton nom. »`);
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
    this.bouton('Remettre le baluchon', () => this.remettreColis());
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

  ouvrirRecit(parti) {
    if (enTransition(this)) return;
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
      if (id === 'bandage' && (this.colis.bandage || 0) - (commande.bandage || 0) >= BANDAGES_EN_PLUS_MAX) return this.dire(`${BANDAGES_EN_PLUS_MAX} bandages en plus, ça suffit largement ! Garde les autres pour quelqu'un d'autre.`);
    }
    if (this.G.stock[id] <= 0) {
      return this.dire("Tu n'en as plus en stock...", '');
    }
    // Un objet en plus de la commande : on demande confirmation, pour éviter les erreurs.
    if (enPlus && !confirme) return this.demanderSurplus(id);
    this.G.stock[id]--;
    this.colis[id] = (this.colis[id] || 0) + 1;
    Son.jouer('poser');
    if (enPlus) this.dire(id === 'potion' ? "Une potion de plus ? Merci, ça me fera un cœur de réserve !"
      : id === 'bandage' ? "Un bandage de plus ? Si je saigne après un combat, ça m'évitera de perdre un cœur !" : "Un de plus ? Ça peut toujours servir, merci !");
    this.majStock();
    this.majCommande();
  }

  demanderSurplus(id) {
    const v = this.voyageur;
    const effet = id === 'potion' ? 'une potion en plus = un cœur de réserve (un seul)'
      : id === 'bandage' ? 'un bandage en plus arrête un saignement après un combat raté'
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
    if (erreur) { Son.jouer('refus'); return this.dire(erreur, ''); }
    Son.jouer('marteau');
    this.dessinerPieces();
    this.dire(`Merci ! ${monNom(id, ITEMS[id].nom.toLowerCase())[0].toUpperCase() + monNom(id, ITEMS[id].nom.toLowerCase()).slice(1)} ${ITEMS[id].nom.toLowerCase()} ${genreDe(id).includes('p') ? 'sont' : 'est'} comme ${accordAdj(id, 'neuf', 'neuve', 'neufs', 'neuves')}. Voilà ${PRIX_REPARATION} pièces pour ta peine.`);
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
    if (this.buste) Son.jouer('voix', { personne: this.buste.personne, ton: this.buste.expression === 'fache' ? 'grogne' : 'auRevoir' });
    this.time.delayedCall(350, () => Son.jouer('porte'));
    if (Son.theme === 'faucheuse') Son.ambiance('comptoir');
    const versDroite = x > this.perso.x;
    const entree = this.entree;
    const corps = () => {
      // Il se retourne : on le voit de nouveau en entier.
      if (!this.buste) return;
      this.buste = null;
      if (this.paroles) { this.paroles.remove(); this.paroles = null; this.enTrainDeParler = false; }
      if (entree) this.perso.setTexture(this.texturePour(entree));
      this.perso.setScale(9 * echelleCorps(this.perso.texture.key)).setY(SOL_COMPTOIR).setFlipX(!versDroite);   // (les corps regardent vers la droite : il fait face à sa route)
    };
    if (!this.buste) this.perso.setFlipX(!versDroite);
    // (v0.58) Le bâton sur l'épaule : on tient le bout devant soi, à hauteur de poitrine, le
    // bâton repose sur l'épaule et la poche pend dans le dos. (Le bâton du dessin monte à 47° ;
    // on le couche un peu, vers 30°.)
    const sens = versDroite ? 1 : -1;
    const inclinaison = versDroite ? -17 : 17;
    let balance = false, debutMarche = 0;
    const placer = () => {
      const h = this.perso.displayHeight, l = this.perso.displayWidth;
      const t = balance ? this.time.now - debutMarche : 0;
      // calé sur les pas (un pas toutes les 250 ms) : il rebondit à chaque pas, et balance comme
      // un pendule, avec un temps de retard sur la marche
      const phase = t / 500 * Math.PI * 2;
      const swing = balance ? Math.sin(phase - 0.9) * 6 * Math.min(1, t / 300) : 0;
      const rebond = balance ? Math.abs(Math.sin(phase)) * 3 : 0;
      porte.setPosition(this.perso.x + sens * l * 0.2, this.perso.y - h * 0.6 - rebond)
        .setAngle(inclinaison + this.perso.angle + sens * swing);
    };
    if (porte) {
      porte.setFlipX(!versDroite).setOrigin(versDroite ? 0.96 : 0.04, 0.96).setDepth(2.1);
      placer();
    }
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
    this.tweens.add({ targets: boite, scale: 2.5, duration: 250, ease: 'Back.easeOut' });
    objets.forEach((id, i) => this.time.delayedCall(300 + i * 170, () => {
      const depart = this.cases[id].icone;
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
      this.dire(((v.accueil || '').includes(ZONES[data.destination].nom) ? '' : `${ZONES[data.destination].nom} ? Va pour ça ! `) + accord(v.accueil, v), this.nomAvecRelation(v.nom));
      this.servir();
    }
    if (data && data.achats && data.achats.length) {
      this.dire(data.vendeur === 'colporteur' ? `Barnabé t'a vendu : ${data.achats.join(', ')}. « Merci, l'ami ! À la prochaine ! »`
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
    Son.jouer('caisse');
    this.enService = false;
    this.time.delayedCall(2500, () => conseilGarrick(this, 'remis'));
    this.majCommande(); // le colis est remis : on ne peut plus rien retirer
    this.majBoutonsService();
    this.bouton('...', null);
    this.majPanneauGauche();

    const jours = v.duree > 1 ? `dans ${v.duree} jours` : 'demain';
    // (v0.60) la phrase dit si la commande est complète ; la chance, elle, dit si le voyage est risqué
    // (une commande complète pour une contrée trop dangereuse n'est pas « pas tout ce que je voulais »)
    const cmd = commandeDe(v);
    const complete = Object.entries(cmd).every(([id, n]) => (this.colis[id] || 0) >= n || (ITEMS[id] && ITEMS[id].durable && etatObjet(v, id) > 0));
    const phrase = complete ? (chance >= 0.6 ? `Parfait, tout y est ! Je reviendrai ${jours} avec ta part du butin, promis !`
      : `Tout y est, merci. Mais ça va être rude, là-bas... Rendez-vous ${jours}, si tout va bien.`)
      : chance >= 0.4 ? `Ce n'est pas tout ce que je voulais... mais je ferai avec. Rendez-vous ${jours} !`
      : "C'est tout ? Bon... Souhaite-moi bonne chance.";
    const objets = Object.entries(this.colis).flatMap(([id, n]) => Array(n).fill(id));
    const sEnAller = colis => {
      this.dire(phrase + (msg ? ' ' + msg : ''), this.nomAvecRelation(v.nom));
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
    this.dire('Le soleil se couche sur la Comté. Plus personne ne fait la queue.', 'Fin de la journée');
    this.tweens.add({ targets: this.cielNuit, alpha: 1, duration: 3000 });
    this.tweens.add({ targets: this.voile, fillAlpha: 0.25, duration: 3000 });
  }

  // --- Mise à jour de l'affichage ---

  majPanneauGauche() {
    this.texteJour.setText('Jour ' + this.G.jour);
    this.texteJoueur.setText(`${nomJoueur(this.G)}, ${ageJoueur(this.G)} ans`);

    // (v0.57) chaque ligne tient dans l'ardoise : un nom trop long est raccourci avec « … »
    // (v0.59) on mesure avec le texte de l'ardoise lui-même (même police, même taille)
    const LARGEUR_ARDOISE = 218;
    const mesure = this.texteMissions;
    const tenir = (debut, nom, fin) => {
      let n = nom;
      while (n.length > 3 && mesure.setText(debut + n + fin).width > LARGEUR_ARDOISE) n = n.slice(0, -1);
      return debut + (n === nom ? n : n.trimEnd() + '…') + fin;
    };
    this.texteMissions.setText(listeCourte(enMission(this.G).map(p => tenir('', p.voyageur.nom, ` — retour ${p.retour <= this.G.jour ? "aujourd'hui" : 'jour ' + p.retour}`)), 4, 'Personne pour l\'instant'));

    this.lignesLettres.forEach((t, i) => {
      const a = this.G.annonces[i];
      t.setText(a ? tenir(`✉ Jour ${a.jour} · `, a.voyageur.nom, a.acceptee ? '' : ' (à répondre)') : (i === 0 ? 'Aucune lettre' : ''));
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
      (coeursEnPlus(v, this.colis) ? ` · +${coeursEnPlus(v, this.colis)} cœur${coeursEnPlus(v, this.colis) > 1 ? 's' : ''}` : '') +
      (bandagesEnPlus(v, this.colis) ? ` · 🩹${bandagesEnPlus(v, this.colis)}` : '') + ' · ' : '') +
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
      const vide = !Object.values(this.colis).some(n => n > 0);
      // (tant que le baluchon est vide, il garde l'humeur de son arrivée : rien ne s'est encore passé)
      this.exprimer(vide ? this.expressionArrivee(this.entree) : v.exige && !totalSurplus(v, this.colis) ? 'fache' : c >= 0.75 ? 'content' : c < 0.4 ? 'inquiet' : 'neutre');
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
