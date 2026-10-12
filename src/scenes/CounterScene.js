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

    this.boutonAction = creerBouton(this, 840, 470, 210, '', () => this.action && this.action());

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
      zone.on('pointerdown', () => this.reprendre(i));
      this.lignesCommande.push({ icone, txt, zone, id: null });
    }
    this.add.text(700, 226, 'Cliquer une ligne pour reprendre', style(11, '#7a5a3a', { fontStyle: 'italic' }));
    this.texteChance = this.add.text(815, 206, '', style(17, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5);
  }

  creerDialogue() {
    this.add.rectangle(480, 296, 920, 70, 0x1e130a, 0.85).setStrokeStyle(2, 0xc9a227);
    this.nomParleur = this.add.text(32, 266, '', style(15, '#f3d98a', { fontStyle: 'bold' }));
    this.texteDialogue = this.add.text(32, 286, '', style(15, '#f3e6c8', { wordWrap: { width: 900 } }));
  }

  creerStock() {
    this.add.text(170, 360, 'Ton stock — clique sur un objet pour l\'ajouter au colis', style(14, '#2a1a10', { fontStyle: 'italic' }));
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
      .setPosition(premier.x, premier.y).setScale(FILE.echelle);
    premier.destroy();
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
      const bonjour = v.prevu ? "C'est moi qui t'ai écrit, tu te souviens ? " : '';
      this.dire(bonjour + accord(v.accueil, v), v.nom);
      this.enService = true;
      this.bouton('Remettre le colis', () => this.remettreColis());
      this.majCommande();
    } else if (entree.type === 'retour') {
      const v = entree.parti.voyageur;
      this.dire(`Me revoilà, sain${v.feminin ? 'e' : ''} et sauf${v.feminin ? 've' : ''} ! Tu ne devineras jamais ce qui m'est arrivé...`, v.nom);
      this.titreCommande.setText('Retour de mission');
      this.bouton('Écouter son récit', () => this.ouvrirRecit(entree.parti));
    } else {
      const v = entree.parti.voyageur;
      this.dire(`Bonjour... J'ai trouvé ce carnet sur la route. Il appartenait à ${v.nom}, je crois. Je suis désolé.`, 'Un colporteur');
      this.titreCommande.setText('Une mauvaise nouvelle...');
      this.bouton('Lire le carnet', () => this.ouvrirRecit(entree.parti));
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

  reprendre(i) {
    const id = this.lignesCommande[i].id;
    if (!this.enService || !id || !this.colis[id]) return;
    this.colis[id]--;
    this.G.stock[id]++;
    this.majStock();
    this.majCommande();
  }

  dire(texte, nom = this.voyageur ? this.voyageur.nom : '') {
    this.nomParleur.setText(nom);
    this.texteDialogue.setText(texte);
  }

  remettreColis() {
    const v = this.voyageur;
    const chance = chanceDeRetour(v, this.colis);
    partir(this.G, v, this.colis);
    this.enService = false;
    this.bouton('...', null);
    this.majPanneauGauche();

    const jours = v.duree > 1 ? `dans ${v.duree} jours` : 'demain';
    const phrase = chance >= 0.75 ? `Parfait ! Je reviendrai ${jours} avec ta part du butin, promis !`
      : chance >= 0.4 ? `Ce n'est pas tout ce que je voulais... mais je ferai avec. Rendez-vous ${jours} !`
      : "C'est tout ? Bon... Souhaite-moi bonne chance.";
    this.dire(phrase, v.nom);

    this.perso.setFlipX(true);
    this.tweens.add({
      targets: this.perso, x: FENETRE.x + FENETRE.w + 60, duration: 1400, delay: 600, ease: 'Sine.easeIn',
      onStart: () => this.marche(1400),
      onComplete: () => this.voyageurSuivant(),
    });
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
      const ok = donne >= commande[id];
      ligne.txt.setText(`${ITEMS[id].nom}  ${donne} / ${commande[id]}  ${ok ? '✓' : ''}`)
        .setColor(ok ? '#2f6a2a' : '#3b2410');
    });
    if (v) {
      const c = chanceDeRetour(v, this.colis);
      const couleur = c >= 0.75 ? '#2f6a2a' : c >= 0.4 ? '#8a6a10' : '#a03030';
      this.texteChance.setText(`Chances de retour : ${Math.round(c * 100)} %`).setColor(couleur);
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
