// L'arrière-boutique : quand on se retourne derrière le comptoir. On y voit son stock en vrai
// sur les étagères, le coin où s'entasse sa fortune, le panier des cadeaux, le vieux buffet
// (et son tiroir secret), et la porte de la chambre. Le comptoir attend en pause.
const SOL_ARRIERE = 440;

class ArriereScene extends Phaser.Scene {
  constructor() { super('Arriere'); }

  init(data) {
    this.comptoir = data.comptoir;
  }

  create() {
    const G = this.G = window.GAME;
    this.cameras.main.fadeIn(250);
    this.dessinerPiece();
    this.add.text(276, 26, "L'arrière-boutique", style(24, '#f3d98a', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 5 })).setOrigin(0.5);
    this.texteInfo = this.add.text(276, 50, this.comptoir.voyageur ? `${this.comptoir.voyageur.nom} attend au comptoir...` : '',
      style(13, '#e8d4a8', { fontStyle: 'italic bold', stroke: '#1a0e06', strokeThickness: 3 })).setOrigin(0.5);
    this.dessinerEtageres();
    this.dessinerFortune();
    this.dessinerPanier();
    this.dessinerBuffet();
    this.dessinerPorte();
    this.dessinerDecos();
    creerBouton(this, 840, 505, 220, '↻ Retour au comptoir', () => this.fermer());
    this.time.delayedCall(400, () => conseilGarrick(this, 'arriere'));
  }

  // --- Le décor ---

  dessinerPiece() {
    creerInterieurHD(this);
    this.add.image(0, 0, murInterieur(this, 'murArriere', { poteaux: [272, 412], graine: 310 })).setOrigin(0).setScale(2).setTint(0xc8a47c);
    this.add.image(0, SOL_ARRIERE, plancher(this, 'plancherArriere', { graine: 410 })).setOrigin(0).setScale(2).setTint(0xd8bc98);
    vignette(this, 0.75, 0); // (sous les objets : seuls les murs et le sol s'assombrissent)
    // La lanterne qui pend de la poutre, et sa lumière chaude
    poserLuminaire(this, 640, 18, niveauAmelioration(this.G, 'eclairage'));
    this.dessinerCoinDouillet();
  }

  // Le coin douillet : des herbes qui sèchent sous la poutre, une petite étagère murale avec
  // des livres et une plante, un tapis, et le chat de la maison qui dort sur son coussin.
  dessinerCoinDouillet() {
    creerDouilletHD(this);
    for (const [x, a] of [[566, -3], [596, 4], [800, -2]]) {
      const h = this.add.image(x, 0, 'herbesHD').setOrigin(0.5, 0).setScale(2.4).setAngle(a);
      this.tweens.add({ targets: h, angle: a + 2, duration: 2400 + x, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    // L'étagère murale
    const g = this.add.graphics();
    g.fillStyle(0x5a3a22).fillRect(590, 290, 200, 8).fillStyle(0x7a5232).fillRect(590, 290, 200, 3);
    g.fillStyle(0x4a2e1a).fillTriangle(600, 298, 616, 298, 600, 314).fillTriangle(780, 298, 764, 298, 780, 314);
    this.add.image(640, 291, 'livresHD').setOrigin(0.5, 1).setScale(2);
    this.add.image(730, 291, 'planteHD').setOrigin(0.5, 1).setScale(2);
    bougie(this, 768, 290, { rayon: 70 });
    // Le tapis, et le chat
    this.add.image(430, SOL_ARRIERE + 64, tapisHD(this, niveauAmelioration(this.G, 'chambre'))).setScale(2.2);
    // (le coussin attend un familier : le chat de gouttière, une fois adopté, y dort en boule)
    this.add.image(196, SOL_ARRIERE + 86, 'coussinHD').setOrigin(0.5, 1).setScale(2.4);
    if (chatAdopte(this.G) && this.scene.key !== 'Promenade') {   // (en promenade, il te suit)
      const k = creerChatHD(this, lookChat(this.G));
      const chat = this.add.image(200, SOL_ARRIERE + 76, k + '_dort0').setOrigin(0.5, 1).setScale(2.4).setInteractive({ useHandCursor: true });
      let souffle = 0;
      this.time.addEvent({ delay: 1100, loop: true, callback: () => { if (chat.active) chat.setTexture(creerChatHD(this, lookChat(this.G)) + '_dort' + (++souffle % 2)); } });
      chat.on('pointerdown', () => { Son.jouer('miaou'); ouvrirPanneauChat(this); });
      this.add.text(200, SOL_ARRIERE + 30, nomChat(this.G), style(11, '#f3e6c8', { fontStyle: 'bold italic', stroke: '#140c06', strokeThickness: 3 })).setOrigin(0.5, 0);
    }
  }

  // Les étagères : chaque objet de ta réserve, en vrai. Plus il y en a, plus ça déborde.
  dessinerEtageres() {
    const G = this.G;
    this.add.image(20, 76, etagereHD(this, niveauAmelioration(G, 'reserve'))).setOrigin(0).setScale(2);
    // (v0.63) toutes les armes rangées ensemble, sur la même planche
    const ids = Object.keys(ITEMS).filter(id => !estArme(id) || id === 'epee').map(id => (id === 'epee' ? 'armes' : id));
    const rangees = [150, 256, 360];
    ids.forEach((id, i) => {
      const x = 44 + (i % 4) * 120;
      const y = rangees[Math.floor(i / 4)];
      const armes = id === 'armes' ? IDS_ARMES.flatMap(w => Array(G.stock[w] || 0).fill(w)) : null;
      const n = armes ? armes.length : G.stock[id] || 0;
      for (let k = 0; k < Math.min(n, 8); k++) {
        this.add.image(x + 18 + (k % 4) * 24, y - Math.floor(k / 4) * 26, iconeObjet(this, armes ? armes[k] : id)).setOrigin(0.5, 1).setScale(2);
      }
      this.add.text(x + 4, y + 13, `${armes ? 'Armes' : ITEMS[id].nom} ${n ? '× ' + n : '— vide'}`,
        style(11, n ? '#f3e6c8' : '#d0a890', { fontStyle: n ? 'bold' : 'bold italic', stroke: '#140c06', strokeThickness: 3 }));
    });
    this.add.image(276, 78, plaqueBouton(this, 200)).setScale(2);
    this.add.text(276, 78, `Ta réserve : ${stockTotal(G)} / ${G.capacite}`, style(14, '#f3d98a', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 3 })).setOrigin(0.5);
  }

  // Le coin de la fortune : des piles de pièces autour du coffre, des sacs quand on est riche,
  // des lingots quand on l'est vraiment. Et des reconnaissances de dettes quand ça va mal.
  dessinerFortune() {
    const G = this.G;
    const cx = 760;   // (v0.66 : le coffre-fort contre le mur, entre le buffet et la porte de la chambre)
    const argent = Math.max(0, G.argent);
    // Des lingots, au-delà de 500 pièces
    const lingots = Math.min(6, Math.floor(argent / 500));
    for (let i = 0; i < lingots; i++) {
      this.add.image(cx - 96 + (i % 3) * 30 + Math.floor(i / 3) * 14, SOL_ARRIERE + 4 - Math.floor(i / 3) * 12, 'lingotHD').setOrigin(0.5, 1).setScale(2);
    }
    // Des piles de pièces, derrière et autour du coffre
    // (sur le couvercle du coffre d'abord, puis par terre autour)
    const places = [[-6, 350], [-34, 362], [26, 360], [-66, 456], [66, 458], [-40, 470], [44, 472], [-84, 474], [86, 476], [0, 482]];
    const piles = Math.min(10, Math.ceil(argent / 15));
    const tas = [];
    for (let i = 0; i < piles; i++) {
      const [dx, base] = places[i];
      const hauteur = 2 + ((i * 7) % 5);
      for (let k = 0; k < hauteur; k++) tas.push(this.add.image(cx + dx, base - k * 6, 'pieceTranche').setScale(2).setDepth(1));
    }
    // Le coffre
    this.add.image(cx, SOL_ARRIERE + 6, coffreHD(this, niveauAmelioration(G, 'coffre'))).setOrigin(0.5, 1).setScale(3);
    // Des sacs de pièces, au-delà de 150
    const sacs = Math.min(4, Math.floor(argent / 150));
    for (let i = 0; i < sacs; i++) this.add.image(cx - 92 + i * 20, SOL_ARRIERE + 26 + (i % 2) * 4, 'sacHD').setOrigin(0.5, 1).setScale(2.5).setDepth(2);
    if (G.argent <= 0) {
      this.add.text(cx, SOL_ARRIERE - 120, 'Le coffre sonne creux...', style(12, '#3a2410', { fontStyle: 'italic bold' })).setOrigin(0.5);
    }
    // Les dettes, clouées au mur
    // Les dettes, clouées au mur, bien en vue : une lueur rouge qui pulse derrière chaque affiche
    G.prets.slice(0, 3).forEach((p, i) => {
      const n = Math.min(3, G.prets.length);
      const x = cx + (i - (n - 1) / 2) * 120, y = 112, angle = i % 2 ? 4 : -5;
      creerHalo(this);
      const lueur = this.add.image(x, y, 'halo').setTint(0xff3020).setScale(1.3).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: lueur, alpha: 0.1, scale: 1.1, duration: 900, yoyo: true, repeat: -1 });
      const note = this.add.image(x, y, 'noteDette').setScale(4).setAngle(angle);
      this.tweens.add({ targets: note, angle: angle + (i % 2 ? -2 : 2), duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.add.text(x - 8, y - 2, `DETTE\n${p.restant} p.\n−${Math.min(p.parJour, p.restant)}/nuit`, style(13, '#8a1a1a', { fontStyle: 'bold', align: 'center', lineSpacing: -2 })).setOrigin(0.5).setAngle(angle);
    });
    // (v0.66) Ta fortune, peinte sur une plaque de laiton vissée au coffre (plus de bourse au mur)
    const plaque = this.add.text(cx, SOL_ARRIERE - 26, `${G.argent} p.`, style(14, '#fff2b0', { fontStyle: 'bold', stroke: '#3a2408', strokeThickness: 4, backgroundColor: '#8a6420', padding: { x: 6, y: 1 } })).setOrigin(0.5).setDepth(1.5);
    this.add.text(cx, SOL_ARRIERE - 48, 'Ta fortune', style(11, '#f3d98a', { fontStyle: 'bold italic', stroke: '#1a0e06', strokeThickness: 3 })).setOrigin(0.5).setDepth(1.5);
    this.plaqueFortune = plaque;
  }

  // Les décorations achetées à la brocante, accrochées aux murs. Clic : leur effet.
  dessinerDecos() {
    const G = this.G;
    const places = [[640, 66], [692, 66], [744, 66], [556, 206], [826, 206], [556, 338], [826, 338], [588, 66], [796, 66], [826, 272]];
    (G.decos || []).slice(0, places.length).forEach((id, i) => {
      const [x, y] = places[i];
      this.add.rectangle(x, y - 24, 3, 3, 0x2a1a10); // le clou
      const img = this.add.image(x, y, iconeObjet(this, id)).setScale(3).setInteractive({ useHandCursor: true });
      if (id === 'carillon') this.tweens.add({ targets: img, angle: { from: -3, to: 3 }, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      // La lanterne-crâne luit en vert, le chandelier d'argent en doré
      if (id === 'lanterneCrane' || id === 'chandelier') { const halo = this.add.circle(x, y, 26, id === 'chandelier' ? 0xffd870 : 0x80ff60, 0.16).setBlendMode(Phaser.BlendModes.ADD); this.tweens.add({ targets: halo, alpha: 0.32, scale: 1.15, duration: 900 + Math.random() * 500, yoyo: true, repeat: -1 }); }
      img.on('pointerdown', () => this.message(`${DECOS[id].nom} : ${DECOS[id].effet}`));
    });
  }

  // Le panier des cadeaux (du Bazar de Rosalie)
  dessinerPanier() {
    const G = this.G;
    // (v0.66) posé sur le vieux buffet, contre le mur
    const x = 580, y = SOL_ARRIERE - 62;
    const n = Object.values(G.cadeaux || {}).reduce((a, b) => a + b, 0);
    Object.keys(G.cadeaux || {}).filter(id => G.cadeaux[id] > 0).slice(0, 4).forEach((id, i) => this.add.image(x - 20 + i * 13, y - 28 - (i % 2) * 4, iconeObjet(this, id)).setScale(1.5).setDepth(1.2));
    this.add.image(x, y + 4, 'panierHD').setOrigin(0.5, 1).setScale(1.4).setDepth(1.3);
    const zone = this.add.rectangle(x, y - 12, 70, 44, 0xffffff, 0).setInteractive({ useHandCursor: true });
    this.add.text(x, y - 56, n ? `Les cadeaux (${n})` : 'Panier vide', style(11, '#f3e6c8', { fontStyle: 'bold', stroke: '#140c06', strokeThickness: 3 })).setOrigin(0.5).setDepth(1.4);
    zone.on('pointerdown', () => this.ouvrirListe('cadeaux'));
  }

  // Le vieux buffet. Son tiroir du bas ne s'ouvre que si la Faucheuse y a laissé quelque chose.
  dessinerBuffet() {
    const G = this.G;
    // (v0.66) contre le mur, à droite des étagères (et plus au milieu de la pièce)
    const x = 600, y = SOL_ARRIERE + 20;
    const n = Object.values(G.pieges || {}).reduce((a, b) => a + b, 0);
    this.add.image(x, y + 2, 'buffetHD').setOrigin(0.5, 1).setScale(2);
    bougie(this, x + 40, y - 80, { rayon: 120 }); // une bougie posée sur le buffet, à côté du panier
    if (n) {
      // Une lueur violette sous le tiroir du bas...
      const lueur = this.add.rectangle(x, y - 26, 80, 3, 0xc040ff, 0.8);
      this.tweens.add({ targets: lueur, alpha: 0.2, duration: 700, yoyo: true, repeat: -1 });
    }
    const zone = this.add.rectangle(x, y - 30, 100, 64, 0xffffff, 0).setInteractive({ useHandCursor: true });
    this.add.text(x, y + 14, n ? `Le tiroir secret (${n})` : 'Le vieux buffet', style(12, n ? '#d08aa8' : '#f3e6c8', { fontStyle: 'bold', stroke: '#140c06', strokeThickness: 3 })).setOrigin(0.5);
    zone.on('pointerdown', () => n ? this.ouvrirListe('pieges') : this.message("Des torchons, de la ficelle, un vieux bouton. Rien d'intéressant."));
  }

  // La porte de la chambre
  dessinerPorte() {
    const x = 900;
    this.add.image(x, SOL_ARRIERE, 'porteHD').setOrigin(0.5, 1).setScale(2);
    // Une bougie sur le petit appui à côté de la porte
    this.add.text(x, SOL_ARRIERE - 182, 'La chambre', style(12, '#3a2410', { fontStyle: 'bold italic' })).setOrigin(0.5);
    const zone = this.add.rectangle(x, SOL_ARRIERE - 84, 92, 168, 0xffffff, 0).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => this.porte());
  }

  porte() {
    const c = this.comptoir;
    // (quelqu'un au comptoir : un client, un retour de mission, une famille, un carnet, la Faucheuse...)
    if (c.voyageur || c.entree || this.G.file.length) return this.message("Pas le temps de dormir : quelqu'un t'attend au comptoir !");
    // La journée est finie : on ferme le comptoir et on rentre se reposer.
    if (enTransition(this)) return;
    this.cameras.main.fadeOut(400);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop('Comptoir');
      this.scene.start('Nuit', { matin: false });
    });
  }

  // --- Les listes : cadeaux et objets piégés ---

  ouvrirListe(type) {
    const G = this.G;
    if (this.liste) { this.liste.destroy(); this.liste = null; }
    const stock = type === 'cadeaux' ? G.cadeaux : G.pieges;
    const ids = Object.keys(stock || {}).filter(id => stock[id] > 0);
    if (!ids.length) return this.message(type === 'cadeaux' ? 'Pas de cadeau : passe au Bazar de Rosalie, au marché.' : 'Le tiroir est vide.');
    const c = this.liste = this.add.container(0, 0).setDepth(10);
    const h = 70 + ids.length * 34;
    const sombre = type === 'pieges';
    c.add(this.add.rectangle(480, 270, 960, 540, 0x000000, 0.45).setInteractive());
    c.add(this.add.rectangle(480, 270, 420, h, sombre ? 0x1a0e18 : 0xead9b0).setStrokeStyle(3, sombre ? 0x5a1a3a : 0x8a6a3a));
    const haut = 270 - h / 2;
    const v = this.comptoir.enService ? this.comptoir.voyageur : null;
    c.add(this.add.text(480, haut + 18, v ? (sombre ? `Glisser dans le baluchon de ${v.nom.split(' ')[0]} :` : `Offrir à ${v.nom.split(' ')[0]} :`) : "Personne à servir pour l'instant",
      style(14, sombre ? '#d08aa8' : '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
    ids.forEach((id, i) => {
      const y = haut + 50 + i * 34;
      const ligne = this.add.rectangle(480, y, 380, 30, sombre ? 0x2a1424 : 0xf6ead0).setInteractive({ useHandCursor: true });
      ligne.on('pointerover', () => ligne.setFillStyle(sombre ? 0x4a1a34 : 0xfff4dc));
      ligne.on('pointerout', () => ligne.setFillStyle(sombre ? 0x2a1424 : 0xf6ead0));
      ligne.on('pointerdown', () => this.utiliser(type, id));
      const nom = sombre ? PIEGES[id].nom : CADEAUX[id].nom;
      c.add([ligne, this.add.image(310, y, iconeObjet(this, id)).setScale(2).setTint(sombre ? 0x9a8aa0 : 0xffffff),
        this.add.text(330, y, `${nom} × ${stock[id]}`, style(13, sombre ? '#f0c0d8' : '#3b2410', { fontStyle: 'bold' })).setOrigin(0, 0.5)]);
    });
    const fermer = this.add.text(480, haut + h - 14, 'Fermer', style(12, sombre ? '#d08aa8' : '#8a3a2a', { fontStyle: 'bold' })).setOrigin(0.5).setInteractive({ useHandCursor: true });
    fermer.on('pointerdown', () => { this.liste.destroy(); this.liste = null; });
    c.add(fermer);
  }

  // On revient au comptoir avec l'objet : le comptoir s'occupe du reste.
  utiliser(type, id) {
    const c = this.comptoir;
    if (!c.enService || !c.voyageur) return this.message("Il n'y a personne à servir pour l'instant.");
    this.fermer(() => (type === 'cadeaux' ? c.offrir(id) : c.glisserPiege(id)));
  }

  message(texte) {
    this.texteInfo.setText(texte).setColor('#f3d98a');
  }

  fermer(ensuite) {
    this.scene.stop();
    this.scene.resume('Comptoir');
    if (ensuite) ensuite();
  }
}
