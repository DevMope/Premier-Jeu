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

    this.boutonExpress = creerBouton(this, 840, 392, 210, 'Marchand express', () => this.ouvrirExpress());
    this.boutonRefuser = creerBouton(this, 840, 440, 210, 'Refuser ce client', () => (this.actionB ? this.actionB() : this.refuser()));
    this.boutonAction = creerBouton(this, 840, 492, 210, '', () => this.action && this.action());
    this.majBoutonsService();

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
    this.boutonExpress.setVisible(this.enService);
    this.boutonRefuser.setVisible(this.enService || !!this.actionB);
    if (this.enService) this.boutonRefuser.setTexte('Refuser ce client');
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
    this.fileSprites = this.G.file.map((entree, i) => {
      const sprite = this.add.image(FILE.x - i * FILE.ecart, FILE.y, this.texturePour(entree))
        .setOrigin(0.5, 1).setScale(FILE.echelle).setTint(0xd8d0c0).setDepth(1);
      sprite.setMask(this.masqueFenetre);
      // Ils piétinent un peu en attendant.
      this.tweens.add({ targets: sprite, y: FILE.y - 3, duration: 500 + i * 90, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      return sprite;
    });

    const fond = this.add.rectangle(FENETRE.x + 8, FENETRE.y + 8, 132, 28, 0x2a1a10, 0.8)
      .setOrigin(0, 0).setStrokeStyle(2, 0xc9a227).setDepth(4);
    this.texteAttente = this.add.text(fond.x + 66, fond.y + 14, '', style(14, '#f3d98a', { fontStyle: 'bold' }))
      .setOrigin(0.5).setDepth(4);
  }

  texturePour(entree) {
    if (entree.type === 'carnet') return 'perso_colporteur';
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
      `Prépare-moi s'il te plaît : ${commandeEnTexte(v)}. » — ${v.nom}`, '✉ Lettre de ' + v.nom);
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
      zone.on('pointerdown', () => this.clicLigne(i));
      this.lignesCommande.push({ icone, txt, zone, id: null });
    }
    this.add.text(700, 226, 'Clic sur une ligne : reprendre ou réparer', style(11, '#7a5a3a', { fontStyle: 'italic' }));
    this.texteChance = this.add.text(815, 206, '', style(17, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5);
  }

  creerDialogue() {
    this.add.rectangle(480, 296, 920, 70, 0x1e130a, 0.85).setStrokeStyle(2, 0xc9a227);
    this.nomParleur = this.add.text(32, 266, '', style(15, '#f3d98a', { fontStyle: 'bold' }));
    this.texteDialogue = this.add.text(32, 286, '', style(15, '#f3e6c8', { wordWrap: { width: 900 } }));
  }

  creerStock() {
    this.add.text(150, 360, 'Ton stock — clic : ajouter au colis', style(14, '#2a1a10', { fontStyle: 'italic' }));
    this.texteReserve = this.add.text(660, 360, '', style(14, '#2a1a10', { fontStyle: 'bold' })).setOrigin(1, 0);
    this.creerEtagere();
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
    this.majPanneauGauche();
    this.majStock();
    this.dessinerPieces();
    if (this.G.file.length === 0) return this.finDeJournee();

    const entree = this.entree = this.G.file.shift();
    this.colis = {};
    this.bouton('...', null);
    this.dire("Quelqu'un approche du comptoir...", '');
    this.majCommande();
    this.majFileAttente();

    // Le premier de la file s'avance jusqu'au comptoir...
    const premier = this.fileSprites.shift();
    this.perso.setTexture(this.texturePour(entree)).setFlipX(false)
      .setPosition(premier ? premier.x : FILE.x, FILE.y).setScale(FILE.echelle);
    if (premier) premier.destroy();
    // ... et les autres avancent d'une place.
    this.fileSprites.forEach((sprite, i) => {
      this.tweens.add({ targets: sprite, x: FILE.x - i * FILE.ecart, duration: 900, delay: 300 + i * 150, ease: 'Sine.easeInOut' });
    });

    this.tweens.add({
      targets: this.perso, x: FENETRE.x + FENETRE.w / 2, y: SOL_COMPTOIR, scale: 9, duration: 1200, ease: 'Sine.easeOut',
      onComplete: () => this.arrivee(entree),
    });
    this.marche(1200);
  }

  arrivee(entree) {
    if (entree.type === 'client') {
      const v = this.voyageur = entree.voyageur;
      let bonjour = v.prevu ? "C'est moi qui t'ai écrit, tu te souviens ? " : '';
      if (v.habitue) bonjour = 'Re-bonjour, c\'est encore moi ! ' + (this.aReparer(v).length ? 'Mon matériel a souffert la dernière fois... ' : '');
      this.dire(bonjour + accord(v.accueil, v), this.nomAvecRelation(v.nom));
      this.enService = true;
      this.majBoutonsService();
      this.bouton('Remettre le colis', () => this.remettreColis());
      this.majCommande();
    } else if (entree.type === 'retour') {
      const v = entree.parti.voyageur;
      this.dire(`Me revoilà, sain${v.feminin ? 'e' : ''} et sauf${v.feminin ? 've' : ''} ! Tu ne devineras jamais ce qui m'est arrivé...`, v.nom);
      this.titreCommande.setText('Retour de mission');
      this.bouton('Écouter son récit', () => this.ouvrirRecit(entree.parti));
    } else if (entree.type === 'famille') {
      this.visiteFamille(entree.visite);
    } else {
      const v = entree.parti.voyageur;
      this.dire(`Bonjour... J'ai trouvé ce carnet sur la route. Il appartenait à ${v.nom}, je crois. Je suis désolé.`, 'Un colporteur');
      this.titreCommande.setText('Une mauvaise nouvelle...');
      this.bouton('Lire le carnet', () => this.ouvrirRecit(entree.parti));
    }
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
    const parler = texte => this.dire(texte, `${p.nom}, ${p.lien} de ${d.nom}`);
    const fin = reponse => { parler(reponse); this.bouton('...', null); this.majBoutonsService(); this.dessinerPieces(); this.majStock(); this.partirPar(FENETRE.x - 80); };

    if (visite.intention === 'colere') {
      parler(`C'est toi qui as équipé ${proche}, ${prenom} ? ${il[0].toUpperCase() + il.slice(1)} est mort${d.feminin ? 'e' : ''} à cause de ton matériel de pacotille !`);
      this.choix(['Dédommager (25 p.)', () => {
        if (!peutPayer(G, 25)) return fin("Tu n'as même pas de quoi payer ? Pathétique.");
        G.argent -= 25;
        G.reputation += 0.5;
        fin("Hmph... Ça ne ramènera pas " + proche + ", mais c'est honnête de ta part.");
      }], ['Le renvoyer', () => {
        G.reputation -= 1;
        const msg = changerRelation(G, p.nom, -6);
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
    this.perso.setAngle(-4);
    this.tweens.add({
      targets: this.perso, angle: 4, duration: 150, yoyo: true, repeat: Math.floor(duree / 300) - 1,
      onComplete: () => this.perso.setAngle(0),
    });
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

  // Clic sur une ligne de la commande : reprendre un objet, ou réparer celui du client.
  clicLigne(i) {
    const id = this.lignesCommande[i].id;
    if (!this.enService || !id) return;
    if (this.colis[id]) {
      this.colis[id]--;
      this.G.stock[id]++;
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
    if (!this.enService) return;
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
  partirPar(x) {
    this.perso.setFlipX(x > this.perso.x);
    this.tweens.add({
      targets: this.perso, x, duration: 1400, delay: 700, ease: 'Sine.easeIn',
      onStart: () => this.marche(1400),
      onComplete: () => this.voyageurSuivant(),
    });
  }

  // --- Le marchand express ---

  ouvrirExpress() {
    if (!this.enService || this.fenetreExpress) return;
    const c = this.fenetreExpress = this.add.container(0, 0).setDepth(20);
    c.add(this.add.rectangle(480, 270, 960, 540, 0x000000, 0.5).setInteractive());
    c.add(this.add.rectangle(480, 250, 560, 330, 0xead9b0).setStrokeStyle(4, 0x8a6a3a));
    c.add(this.add.text(480, 110, MARCHAND_EXPRESS.nom + ' — livraison express', style(20, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
    c.add(this.add.text(480, 136, 'Bien plus cher que le fournisseur. Livré directement dans le colis.',
      style(13, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5));
    this.lignesExpress = [];
    const ids = Object.keys(this.G.express);
    if (!ids.length) c.add(this.add.text(480, 240, "Fennick n'a plus rien à vendre aujourd'hui.", style(15, '#3b2410')).setOrigin(0.5));
    ids.forEach((id, i) => {
      const y = 175 + i * 40;
      c.add(this.add.image(230, y, id).setScale(3));
      c.add(this.add.text(255, y, ITEMS[id].nom, style(15, '#3b2410')).setOrigin(0, 0.5));
      c.add(this.add.text(370, y, `${this.G.express[id].prix} p.`, style(15, '#a03030', { fontStyle: 'bold' })).setOrigin(0, 0.5));
      c.add(this.add.text(430, y, `(fournisseur : ~${ITEMS[id].prix} p.)`, style(12, '#6b4a2a')).setOrigin(0, 0.5));
      const reste = this.add.text(600, y, '', style(14, '#3b2410')).setOrigin(0, 0.5);
      const btn = this.add.rectangle(700, y, 80, 28, 0x8a5a2b).setStrokeStyle(2, 0x3b2410).setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => this.acheterExpress(id));
      c.add([reste, btn, this.add.text(700, y, 'Acheter', style(13, '#fff4dc', { fontStyle: 'bold' })).setOrigin(0.5)]);
      this.lignesExpress.push({ id, reste });
    });
    this.texteExpress = this.add.text(480, 360, '', style(14, '#a03030', { fontStyle: 'bold' })).setOrigin(0.5);
    c.add(this.texteExpress);
    const fermer = this.add.rectangle(480, 395, 160, 34, 0x6b4423).setStrokeStyle(2, 0x3b2410).setInteractive({ useHandCursor: true });
    fermer.on('pointerdown', () => { c.destroy(); this.fenetreExpress = null; });
    c.add([fermer, this.add.text(480, 395, 'Fermer', style(15, '#fff4dc', { fontStyle: 'bold' })).setOrigin(0.5)]);
    this.majExpress();
  }

  acheterExpress(id) {
    const offre = this.G.express[id];
    const commande = commandeDe(this.voyageur);
    let probleme = null;
    if (!commande[id]) probleme = `${this.voyageur.nom} n'en a pas besoin.`;
    else if ((this.colis[id] || 0) >= commande[id]) probleme = 'Le colis en contient déjà assez.';
    else if (offre.qte <= 0) probleme = "Fennick n'en a plus.";
    else if (!peutPayer(this.G, offre.prix)) probleme = "Tu n'as pas assez d'argent, même à découvert.";
    if (probleme) return this.texteExpress.setText(probleme);
    this.G.argent -= offre.prix;
    offre.qte--;
    this.colis[id] = (this.colis[id] || 0) + 1;
    this.texteExpress.setText(`${ITEMS[id].nom} ajouté au colis.`);
    this.dessinerPieces();
    this.majExpress();
    this.majCommande();
  }

  majExpress() {
    for (const l of this.lignesExpress) l.reste.setText('reste ' + this.G.express[l.id].qte);
  }

  dire(texte, nom = this.voyageur ? this.voyageur.nom : '') {
    this.nomParleur.setText(nom);
    this.texteDialogue.setText(texte);
  }

  remettreColis() {
    const v = this.voyageur;
    const chance = chanceDeRetour(v, this.colis);
    const msg = partir(this.G, v, this.colis);
    this.enService = false;
    this.majBoutonsService();
    this.bouton('...', null);
    this.majPanneauGauche();

    const jours = v.duree > 1 ? `dans ${v.duree} jours` : 'demain';
    const phrase = chance >= 0.75 ? `Parfait ! Je reviendrai ${jours} avec ta part du butin, promis !`
      : chance >= 0.4 ? `Ce n'est pas tout ce que je voulais... mais je ferai avec. Rendez-vous ${jours} !`
      : "C'est tout ? Bon... Souhaite-moi bonne chance.";
    this.dire(phrase + (msg ? ' ' + msg : ''), this.nomAvecRelation(v.nom));
    this.partirPar(FENETRE.x + FENETRE.w + 60);
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

    const missions = enMission(this.G).map(p => {
      const quand = p.retour <= this.G.jour ? "aujourd'hui" : 'jour ' + p.retour;
      return `${p.voyageur.nom} — retour ${quand}`;
    });
    this.texteMissions.setText(listeCourte(missions, 4, 'Personne pour l\'instant'));

    this.lignesLettres.forEach((t, i) => {
      const a = this.G.annonces[i];
      t.setText(a ? `✉ Jour ${a.jour} · ${a.voyageur.nom}` : (i === 0 ? 'Aucune lettre' : ''));
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
    const ids = Object.keys(commande);
    this.titreCommande.setText(v ? 'Commande de ' + v.nom : '');
    this.lignesCommande.forEach((ligne, i) => {
      const id = ids[i];
      ligne.id = id || null;
      ligne.icone.setVisible(!!id);
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
      const ok = donne >= commande[id];
      ligne.txt.setText(`${ITEMS[id].nom}  ${donne} / ${commande[id]}  ${ok ? '✓' : ''}`)
        .setFontSize(16).setColor(ok ? '#2f6a2a' : '#3b2410');
    });
    if (v) {
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
