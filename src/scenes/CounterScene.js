// Le comptoir : les voyageurs se présentent à la fenêtre,
// le joueur leur prépare un colis avec son stock.
// Les aventuriers de retour (ou le colporteur qui rapporte leur carnet)
// font la queue comme tout le monde.

const FENETRE = { x: 300, y: 20, w: 360, h: 230 };
const SOL_COMPTOIR = FENETRE.y + FENETRE.h - 10;
// La file d'attente : le premier attend juste à gauche du comptoir,
// les suivants s'alignent derrière lui, plus petits car plus loin.
const FILE = { x: FENETRE.x + 110, ecart: 55, y: SOL_COMPTOIR - 14, echelle: 5 };

class CounterScene extends Phaser.Scene {
  constructor() { super('Comptoir'); }

  create() {
    this.G = window.GAME;
    this.entree = null;   // ce qui est au comptoir : client, retour ou carnet
    this.voyageur = null; // le client à servir, s'il y en a un
    this.enService = false;
    this.colis = {};

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
    this.voyageurSuivant();
    if (this.G.banniere !== this.G.jour) this.afficherBanniere();
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

    this.masqueFenetre = masque;
    this.perso = this.add.image(-100, SOL_COMPTOIR, 'perso_hobbit').setOrigin(0.5, 1).setScale(9).setDepth(2);
    this.perso.setMask(masque);
    this.creerFileAttente();

    // Cadre et rebord de la fenêtre
    const cadre = this.add.graphics().setDepth(3);
    cadre.lineStyle(10, 0x3b2410, 1);
    cadre.strokeRect(x - 5, y - 5, w + 10, h + 10);
    cadre.fillStyle(0x6b4423, 1);
    cadre.fillRect(x - 14, y + h, w + 28, 14);
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
    const sprite = this.add.image(FILE.x - i * FILE.ecart, FILE.y, this.texturePour(entree))
      .setOrigin(0.5, 1).setScale(FILE.echelle).setTint(0xd8d0c0).setDepth(1);
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
    this.dire(phrase + (msg ? ' ' + msg : ''), v.nom);
    this.G.file.push(entree);
    this.fileSprites.push(this.spriteFile(entree, this.G.file.length - 1).setVisible(false));
    this.majFileAttente();
    this.partirPar(FENETRE.x - 80);
  }

  texturePour(entree) {
    if (entree.type === 'faucheuse') return 'perso_faucheuse';
    if (entree.type === 'famille') return 'perso_' + entree.visite.parent.race;
    const v = entree.type === 'client' ? entree.voyageur : entree.parti.voyageur;
    return 'perso_' + v.race;
  }

  majFileAttente() {
    const n = this.G.file.length;
    this.texteAttente.setText(n === 0 ? 'Plus personne' : `En attente : ${n}`);
  }

  // À gauche : qui est en mission, et les lettres reçues (cliquables).
  creerPanneauGauche() {
    this.add.rectangle(145, 135, 250, 230, 0x2a1a10, 0.55).setStrokeStyle(2, 0x3b2410);
    this.texteJour = this.add.text(30, 28, '', style(22, '#f3d98a', { fontStyle: 'bold' }));
    this.texteJoueur = this.add.text(262, 36, '', style(13, '#c9b48a', { fontStyle: 'italic' })).setOrigin(1, 0);
    this.add.text(30, 62, 'En mission', style(14, '#c9b48a', { fontStyle: 'bold' }));
    this.texteMissions = this.add.text(30, 82, '', style(13, '#f3e6c8', { lineSpacing: 3 }));
    this.add.text(30, 160, 'Lettres reçues — clique pour lire', style(14, '#c9b48a', { fontStyle: 'bold' }));
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
    this.add.rectangle(815, 135, 260, 230, 0xead9b0).setStrokeStyle(3, 0x8a6a3a);
    this.titreCommande = this.add.text(700, 30, '', style(17, '#3b2410', { fontStyle: 'bold', wordWrap: { width: 235 } }));
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
    this.fondDialogue = this.add.rectangle(480, 296, 920, 70, 0x1e130a, 0.85).setStrokeStyle(2, 0xc9a227);
    this.nomParleur = this.add.text(32, 266, '', style(15, '#f3d98a', { fontStyle: 'bold' }));
    this.texteDialogue = this.add.text(32, 286, '', style(15, '#f3e6c8', { wordWrap: { width: 900 } }));
  }

  creerStock() {
    this.add.text(150, 360, 'Ton stock — clic : ajouter au colis', style(14, '#2a1a10', { fontStyle: 'italic' }));
    this.texteReserve = this.add.text(660, 360, '', style(14, '#2a1a10', { fontStyle: 'bold' })).setOrigin(1, 0);
    this.creerEtagere();
    // Le registre posé sur le bureau : clic pour ouvrir le bureau (fiches, comptes, statistiques)
    const registre = this.add.rectangle(75, 362, 120, 24, 0x6b2a1a).setStrokeStyle(2, 0x3b2410).setInteractive({ useHandCursor: true });
    this.add.text(75, 362, 'Le registre', style(13, '#f3d98a', { fontStyle: 'bold' })).setOrigin(0.5);
    registre.on('pointerover', () => registre.setFillStyle(0x8a3a2a));
    registre.on('pointerout', () => registre.setFillStyle(0x6b2a1a));
    registre.on('pointerdown', () => {
      this.scene.pause();
      this.scene.launch('Bureau', { retour: 'Comptoir', comptoir: this });
    });
    this.cases = {};
    Object.keys(ITEMS).forEach((id, i) => {
      const x = 200 + (i % 5) * 108;
      const y = 397 + Math.floor(i / 5) * 48;
      const fond = this.add.rectangle(x, y, 104, 44, 0x6b4423).setStrokeStyle(2, 0x3b2410)
        .setInteractive({ useHandCursor: true });
      this.add.image(x - 36, y, id).setScale(3);
      this.add.text(x - 18, y - 16, ITEMS[id].nom, style(11, '#f3e6c8', { wordWrap: { width: 70 } }));
      const qte = this.add.text(x - 18, y + 4, '', style(13, '#f3d98a', { fontStyle: 'bold' }));
      fond.on('pointerover', () => fond.setFillStyle(0x7a5030));
      fond.on('pointerout', () => fond.setFillStyle(0x6b4423));
      fond.on('pointerdown', () => this.donner(id));
      this.cases[id] = { fond, qte };
    });
  }

  // L'étagère des décorations offertes par tes amis. Clic : voir son effet.
  creerEtagere() {
    const g = this.add.graphics();
    g.fillStyle(0x5a3a22).fillRect(12, 396, 126, 6);
    g.fillStyle(0x3b2410).fillRect(18, 402, 6, 8).fillRect(126, 402, 6, 8);
    this.G.decorations.forEach((id, i) => {
      const icone = this.add.image(32 + i * 30, 384, id).setScale(3).setInteractive({ useHandCursor: true });
      icone.on('pointerdown', () => this.dire(DECORATIONS[id].effet, DECORATIONS[id].nom));
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
    // Un client mis en attente retrouve son colis commencé.
    this.colis = entree.colis || {};
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
    if (faucheuse) this.assombrir();

    // Le premier de la file s'avance jusqu'au comptoir...
    const premier = this.fileSprites.shift();
    this.perso.setTexture(this.texturePour(entree)).setFlipX(false)
      .setPosition(premier ? premier.x : FILE.x, FILE.y).setScale(FILE.echelle);
    if (premier) premier.destroy();
    // ... et les autres avancent d'une place.
    this.fileSprites.forEach((sprite, i) => {
      sprite.setVisible(true);
      this.tweens.add({ targets: sprite, x: FILE.x - i * FILE.ecart, duration: 900, delay: 300 + i * 150, ease: 'Sine.easeInOut' });
    });

    this.tweens.add({
      targets: this.perso, x: FENETRE.x + FENETRE.w / 2, y: SOL_COMPTOIR, scale: 9, duration: 1200, ease: 'Sine.easeOut',
      onComplete: () => this.arrivee(entree),
    });
    // La Faucheuse ne marche pas : elle glisse.
    if (!faucheuse) this.marche(1200);
  }

  arrivee(entree) {
    if (entree.type === 'client') {
      const v = this.voyageur = entree.voyageur;
      let bonjour = v.prevu ? "C'est moi qui t'ai écrit, tu te souviens ? " : '';
      if (entree.attentes) bonjour = "Me revoilà ! On reprend où on en était ? ";
      if (v.habitue) bonjour = 'Re-bonjour, c\'est encore moi ! ' + (this.aReparer(v).length ? 'Mon matériel a souffert la dernière fois... ' : '');
      if (!v.queteId) {
        // Il vient chercher l'aventure : c'est toi qui choisis où l'envoyer.
        this.dire(`${bonjour}${ENVIES[v.envie]} (${NIVEAUX_AVENTURIER[v.niveau].nom}${v.blessures ? `, encore blessé${v.feminin ? 'e' : ''}` : ''})`, this.nomAvecRelation(v.nom));
        this.choix(['Choisir sa destination', () => this.ouvrirCarte()], ['Refuser ce client', () => this.refuser()]);
        this.majCommande();
        return;
      }
      this.dire(entree.attentes ? bonjour : bonjour + accord(v.accueil, v), this.nomAvecRelation(v.nom));
      this.servir();
    } else if (entree.type === 'retour') {
      const v = entree.parti.voyageur;
      this.dire(`Me revoilà, sain${v.feminin ? 'e' : ''} et sauf${v.feminin ? 've' : ''} ! Tu ne devineras jamais ce qui m'est arrivé...`, v.nom);
      this.titreCommande.setText('Retour de mission');
      this.bouton('Écouter son récit', () => this.ouvrirRecit(entree.parti));
    } else if (entree.type === 'famille') {
      this.visiteFamille(entree.visite);
    } else if (entree.type === 'faucheuse') {
      this.visiteFaucheuse(entree);
    } else {
      const v = entree.parti.voyageur;
      this.dire(`Le carnet de voyage de ${v.nom} est posé sur ton comptoir. Sa couverture est glacée.`, '');
      // Le carnet, couvert de givre, sur le rebord de la fenêtre.
      const g = this.carnetPose = this.add.graphics().setDepth(3);
      const cx = FENETRE.x + FENETRE.w / 2, cy = SOL_COMPTOIR + 2;
      g.fillStyle(0x3a2a1a).fillRect(cx - 30, cy - 22, 60, 22);
      g.fillStyle(0x5a3a22).fillRect(cx - 27, cy - 20, 54, 17);
      g.fillStyle(0xd8e8f0, 0.8).fillRect(cx - 30, cy - 22, 60, 3).fillRect(cx - 30, cy - 22, 4, 22).fillRect(cx + 14, cy - 19, 9, 2);
      g.fillStyle(0xe8c040).fillRect(cx - 4, cy - 14, 8, 6);
      this.titreCommande.setText('Une mauvaise nouvelle...');
      this.bouton('Lire le carnet', () => this.ouvrirRecit(entree.parti));
    }
  }

  // --- La Faucheuse ---

  // L'obscurité tombe sur le comptoir : seuls la Faucheuse et ses paroles restent visibles.
  assombrir() {
    if (this.ombre) this.ombre.destroy();
    this.ombre = this.add.rectangle(480, 270, 960, 540, 0x05040c, 0).setDepth(4);
    this.tweens.add({ targets: this.ombre, fillAlpha: 0.78, duration: 1400, ease: 'Sine.easeIn' });
    this.perso.setDepth(5);
    for (const o of [this.fondDialogue, this.nomParleur, this.texteDialogue, this.boutonAction.fond, this.boutonAction.label]) o.setDepth(6);
    this.cameras.main.shake(1400, 0.002);
  }

  // Elle annonce ceux qui ne reviendront jamais, laisse leurs carnets, et repart avec l'obscurité.
  visiteFaucheuse(entree) {
    const noms = entree.partis.map(p => p.voyageur.nom);
    const liste = noms.length > 1 ? noms.slice(0, -1).join(', ') + ' et ' + noms[noms.length - 1] : noms[0];
    const plusieurs = noms.length > 1;
    this.titreCommande.setText('...');
    // Elle flotte, immobile, au-dessus du sol.
    this.flottement = this.tweens.add({ targets: this.perso, y: SOL_COMPTOIR - 8, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const parler = texte => {
      this.dire(texte, 'La Faucheuse');
      this.nomParleur.setColor('#ff3a2a');
    };
    parler(`« Ne tremble pas, marchand. Ce n'est pas pour toi que je viens... pas encore. »`);
    this.bouton('...', () => {
      parler(`« ${liste} ne reviendr${plusieurs ? 'ont' : 'a'} jamais de voyage. ${plusieurs ? 'Leurs' : 'Son'} nom${plusieurs ? 's sont' : ' est'} à moi, désormais. »`);
      this.bouton('...', () => {
        parler(`« Je te laisse ${plusieurs ? 'leurs carnets' : 'son carnet'}. Nous nous reverrons... »`);
        this.bouton('...', () => this.departFaucheuse(entree));
      });
    });
  }

  departFaucheuse(entree) {
    this.bouton('...', null);
    this.dire('Elle se dissout dans l\'ombre. Sur le comptoir, ' +
      (entree.partis.length > 1 ? `${entree.partis.length} carnets` : 'un carnet') + ' couvert' + (entree.partis.length > 1 ? 's' : '') + ' de givre.', '');
    if (this.flottement) this.flottement.stop();
    this.tweens.add({ targets: this.perso, alpha: 0, scale: 10, duration: 1600, ease: 'Sine.easeIn' });
    this.tweens.add({
      targets: this.ombre, fillAlpha: 0, duration: 1600, ease: 'Sine.easeOut',
      onComplete: () => {
        this.ombre.destroy();
        this.ombre = null;
        this.perso.setVisible(false).setAlpha(1).setScale(9).setDepth(2);
        for (const o of [this.fondDialogue, this.nomParleur, this.texteDialogue, this.boutonAction.fond, this.boutonAction.label]) o.setDepth(0);
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
    this.titreCommande.setText('Une visite...');
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
    // Le registre posé sur le bureau : clic pour ouvrir le bureau (fiches, comptes, statistiques)
    const registre = this.add.rectangle(75, 362, 120, 24, 0x6b2a1a).setStrokeStyle(2, 0x3b2410).setInteractive({ useHandCursor: true });
    this.add.text(75, 362, 'Le registre', style(13, '#f3d98a', { fontStyle: 'bold' })).setOrigin(0.5);
    registre.on('pointerover', () => registre.setFillStyle(0x8a3a2a));
    registre.on('pointerout', () => registre.setFillStyle(0x6b2a1a));
    registre.on('pointerdown', () => {
      this.scene.pause();
      this.scene.launch('Bureau', { retour: 'Comptoir', comptoir: this });
    });
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
    this.perso.setAngle(-4);
    this.tweens.add({
      targets: this.perso, angle: 4, duration: 150, yoyo: true, repeat: Math.floor(duree / 300) - 1,
      onComplete: () => this.perso.setAngle(0),
    });
  }

  // `confirme` : le joueur a déjà confirmé que c'est bien un objet en plus de la commande.
  donner(id, confirme = false) {
    if (!this.enService || this.enConfirmation) return;
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
    this.G.stock[id]++;
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
    for (const [id, n] of Object.entries(this.colis)) this.G.stock[id] += n;
    this.colis = {};
    const msg = refuserClient(this.G, v);
    this.enService = false;
    this.majBoutonsService();
    this.bouton('...', null);
    this.majStock();
    this.dire("Tu refuses de me servir ? Très bien... J'irai voir ailleurs. Et je le dirai à tout le monde." + (msg ? ' ' + msg : ''), v.nom);
    this.partirPar(FENETRE.x - 80);
  }

  // Le client s'en va, vers la droite (vers l'aventure) ou la gauche (refusé).
  // `porte` : le colis que le client emporte avec lui.
  partirPar(x, porte = null) {
    this.perso.setFlipX(x > this.perso.x);
    const decalage = x > this.perso.x ? 26 : -26;
    this.tweens.add({
      targets: this.perso, x, duration: 1400, delay: 700, ease: 'Sine.easeIn',
      onStart: () => this.marche(1400),
      onUpdate: () => { if (porte) porte.x = this.perso.x + decalage; },
      onComplete: () => {
        if (porte) porte.destroy();
        this.voyageurSuivant();
      },
    });
  }

  // L'empaquetage : les objets volent de la réserve dans le carton, on le ficelle,
  // puis le client le prend. `suite(colis)` est appelée quand il l'a dans les mains.
  empaqueter(objets, suite) {
    const bx = FENETRE.x + FENETRE.w / 2 + 80;
    const boite = this.add.image(bx, SOL_COMPTOIR, 'colisOuvert').setOrigin(0.5, 1).setScale(0).setDepth(2.5);
    boite.setMask(this.masqueFenetre);
    this.tweens.add({ targets: boite, scale: 5, duration: 250, ease: 'Back.easeOut' });
    objets.forEach((id, i) => this.time.delayedCall(300 + i * 170, () => {
      const depart = this.cases[id].fond;
      const icone = this.add.image(depart.x - 36, depart.y, id).setScale(3).setDepth(6);
      this.tweens.add({
        targets: icone, x: bx, y: SOL_COMPTOIR - 30, scale: 2, duration: 450, ease: 'Quad.easeIn',
        onComplete: () => {
          icone.destroy();
          this.tweens.add({ targets: boite, scaleY: 4.5, duration: 70, yoyo: true });
        },
      });
    }));
    // On ferme le carton et on le ficelle...
    this.time.delayedCall(300 + objets.length * 170 + 500, () => {
      // La forme du colis dépend de ce qu'il contient, sa taille du nombre d'objets.
      boite.setTexture(formeColis(objets)).setScale(3.5 + Math.min(objets.length, 10) * 0.3);
      this.tweens.add({ targets: boite, angle: { from: -8, to: 8 }, duration: 90, yoyo: true, repeat: 2, onComplete: () => boite.setAngle(0) });
      const ficelle = this.add.text(bx, SOL_COMPTOIR - 60, 'Ficelé !', style(16, '#f3d98a', { fontStyle: 'bold', stroke: '#2a1a10', strokeThickness: 4 }))
        .setOrigin(0.5).setDepth(6);
      this.tweens.add({ targets: ficelle, y: ficelle.y - 20, alpha: 0, delay: 400, duration: 500, onComplete: () => ficelle.destroy() });
      // ... et le client le prend.
      this.time.delayedCall(700, () => {
        this.tweens.add({
          targets: boite, x: this.perso.x + 26, y: this.perso.y - 36, scale: 4, duration: 350, ease: 'Sine.easeOut',
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
    this.nomParleur.setText(nom).setColor(qui ? couleurNom(this.G, qui, true) : '#f3d98a');
    this.texteDialogue.setText(texte);
  }

  remettreColis() {
    const v = this.voyageur;
    const chance = chanceDeRetour(v, this.colis);
    const msg = partir(this.G, v, this.colis);
    this.enService = false;
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
    this.bouton('Fermer le comptoir', () => this.scene.start('Nuit'));
    this.dire('Le soleil se couche sur la Comté. Plus personne ne fait la queue.', 'Fin de la journée');
    this.tweens.add({ targets: this.voile, fillAlpha: 0.55, duration: 2000 });
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
      c.qte.setText('x ' + n).setColor(n > 0 ? '#f3d98a' : '#a05040');
    }
    const m = this.G.materiaux;
    this.texteReserve.setText(`Réserve ${stockTotal(this.G)}/${this.G.capacite} · Fer ${m.fer} · Cuir ${m.cuir}`);
  }

  majCommande() {
    const v = this.voyageur;
    const commande = v ? commandeDe(v) : {};
    const plus = v ? surplus(v, this.colis) : {};
    // La commande, puis les soins donnés en plus.
    const ids = [...Object.keys(commande), ...Object.keys(plus).filter(id => !commande[id])];
    this.titreCommande.setText(v ? (v.queteId ? `${v.nom} · ${ZONES[v.zone].nom}` : `${v.nom} cherche l'aventure`) : '');
    this.texteSac.setText(v && v.queteId ? `Sac : ${totalSurplus(v, this.colis)} / ${tailleSac(v)} en plus` +
      (coeursEnPlus(v, this.colis) ? ` · +${coeursEnPlus(v, this.colis)} cœur${coeursEnPlus(v, this.colis) > 1 ? 's' : ''}` : '') : '');
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
      ligne.txt.setText(`${ITEMS[id].nom}  ${Math.min(donne, commande[id])} / ${commande[id]}  ${ok ? '✓' : ''}${plus[id] ? ` +${plus[id]}` : ''}`)
        .setFontSize(14).setColor(ok ? '#2f6a2a' : '#3b2410');
    });
    if (v && !v.queteId) {
      this.texteChance.setText('Choisis sa destination').setColor('#8a6a10');
    } else if (v) {
      // Ton flair estime les chances : faussé au début, précis avec l'expérience.
      const c = chanceEstimee(this.G, v, this.colis);
      const couleur = c >= 0.75 ? '#2f6a2a' : c >= 0.4 ? '#8a6a10' : '#a03030';
      const exact = niveauFlair(this.G) >= 1;
      this.texteChance.setText(`${exact ? 'Chances de retour' : 'Ton flair dit'} : ${exact ? '' : '~'}${Math.round(c * 100)} %`).setColor(couleur);
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

// La forme d'un colis selon ce qu'il contient le plus : un sac de provisions, une longue
// caisse d'armes, une boîte de soins... ou un paquet ficelé quand c'est un peu de tout.
function formeColis(objets) {
  const familles = { provisions: ['ration', 'gourde'], armes: ['epee', 'fleches', 'bouclier'], soins: ['potion', 'bandage', 'antidote'] };
  const textures = { provisions: 'sac', armes: 'colisArmes', soins: 'colisSoins' };
  for (const [famille, ids] of Object.entries(familles)) {
    if (objets.filter(id => ids.includes(id)).length > objets.length / 2) return textures[famille];
  }
  return 'colis';
}
