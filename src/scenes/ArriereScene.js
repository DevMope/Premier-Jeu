// L'arrière-boutique : quand on se retourne derrière le comptoir. On y voit son stock en vrai
// sur les étagères, le coin où s'entasse sa fortune, le panier des cadeaux, le vieux buffet
// (et son tiroir secret), et la porte de la chambre. Le comptoir attend en pause.
const SOL_ARRIERE = 440;

class ArriereScene extends Phaser.Scene {
  constructor() { super('Arriere'); }

  init(data) {
    // (v0.92) on peut aussi y passer le matin, depuis la maison : pas de comptoir derrière
    this.comptoir = (data && data.comptoir) || null;
    this.retour = (data && data.retour) || 'Comptoir';
    this.messageInitial = (data && data.message) || null;
    this.sys.settings.data = {};
  }

  create() {
    const G = this.G = window.GAME;
    this.cameras.main.fadeIn(250);
    this.dessinerPiece();
    this.add.text(340, 30, "L'arrière-boutique", style(24, '#f3d98a', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 5 })).setOrigin(0.5);
    this.texteInfo = this.add.text(340, 54, this.comptoir && this.comptoir.voyageur ? `${this.comptoir.voyageur.nom} attend au comptoir...` : '',
      style(13, '#e8d4a8', { fontStyle: 'italic bold', stroke: '#1a0e06', strokeThickness: 3 })).setOrigin(0.5);
    if (this.messageInitial) this.message(this.messageInitial);
    this.dessinerEtageres();
    this.dessinerFortune();
    this.dessinerPanier();
    this.dessinerBuffet();
    this.dessinerPorte();
    this.dessinerPorteRue();
    this.dessinerDecos();
    creerBouton(this, 840, 505, 220, this.comptoir ? '↻ Retour au comptoir' : '◀ Retour', () => this.fermer());
    boutonCarteMonde(this, 884, 112);   // (v0.93) la carte du monde
    // (v0.82, étape 10b) le coin de la forge, à partir du saut d'un an
    if (forgeProposee(G)) creerBouton(this, 600, 505, 220, forgeConstruite(G) ? '⚒ La forge' : '⚒ Le coin de la forge', () => { this.scene.pause(); this.scene.launch('Forge', { appelant: 'Arriere' }); });
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
    // (v0.84) un peu plus haut : la porte de la rue passe dessous
    const ye = 236;
    g.fillStyle(0x5a3a22).fillRect(590, ye, 200, 8).fillStyle(0x7a5232).fillRect(590, ye, 200, 3);
    g.fillStyle(0x4a2e1a).fillTriangle(600, ye + 8, 616, ye + 8, 600, ye + 24).fillTriangle(780, ye + 8, 764, ye + 8, 780, ye + 24);
    this.add.image(640, ye + 1, 'livresHD').setOrigin(0.5, 1).setScale(2);
    this.add.image(730, ye + 1, 'planteHD').setOrigin(0.5, 1).setScale(2);
    bougie(this, 768, ye, { rayon: 70 });
    // Le tapis, et le chat
    // (v1.29) avec la cave du repaire, le tapis est roulé de côté : la trappe s'ouvre dans le plancher
    if (typeof repaireA === 'function' && repaireA(this.G, 'cave')) this.dessinerTrappe();
    else this.add.image(430, SOL_ARRIERE + 64, tapisHD(this, niveauAmelioration(this.G, 'chambre'))).setScale(2.2);
    // (le coussin attend un familier : le chat de gouttière, une fois adopté, y dort en boule)
    this.add.image(196, SOL_ARRIERE + 86, 'coussinHD').setOrigin(0.5, 1).setScale(2.4);
    // (v1.05, planche 25) sa gamelle, à son nom : pleine, ou vide quand la réserve n'a plus de ration
    if (chatAdopte(this.G) && typeof gamellePleine === 'function') {
      const g = this.add.graphics(), gx = 284, gy = SOL_ARRIERE + 84;
      g.fillStyle(0x5a3418).fillEllipse(gx, gy, 52, 18).fillStyle(0x8a5a2a).fillEllipse(gx, gy - 3, 48, 13).fillStyle(0x3a2010).fillEllipse(gx, gy - 4, 38, 8);
      if (gamellePleine(this.G)) for (let k = 0; k < 9; k++) g.fillStyle(k % 2 ? 0xa86a30 : 0xc88a48).fillCircle(gx - 14 + (k % 5) * 7, gy - 5 - Math.floor(k / 5) * 2, 2.5);
      this.add.text(gx, gy + 3, nomChat(this.G).toUpperCase().slice(0, 8), style(8, '#f3e6c8', { fontStyle: 'bold' })).setOrigin(0.5);
    }
    if (chatAdopte(this.G) && this.scene.key !== 'Promenade' && typeof chatParti === 'function' && chatParti(this.G)) {
      // (v1.05) parti voir ailleurs (ou se réchauffer chez les voisins) : le coussin est vide
      this.add.text(200, SOL_ARRIERE + 30, 'Coussin vide', style(11, '#d0a890', { fontStyle: 'bold italic', stroke: '#140c06', strokeThickness: 3 })).setOrigin(0.5, 0);
    } else if (chatAdopte(this.G) && this.scene.key !== 'Promenade' && typeof chatBoude === 'function' && chatBoude(this.G)) {
      // (v1.05) il boude : assis, il te tourne le dos (la queue bat), et grogne si on l'approche
      const k = creerChatHD(this, lookChat(this.G));
      const chat = this.add.image(200, SOL_ARRIERE + 76, k + '_assis0').setOrigin(0.5, 1).setScale(2.4).setFlipX(true).setInteractive({ useHandCursor: true });
      this.time.addEvent({ delay: 700, loop: true, callback: () => { if (chat.active) chat.setTexture(k + (chat.texture.key.endsWith('0') ? '_assis1' : '_assis0')); } });
      chat.on('pointerdown', () => { Son.jouer('grogne'); this.message(`${nomChatMaj(this.G)} te tourne le dos. « Rrrr. » (Il boude : sa gamelle est vide depuis trois jours.)`); });
      this.add.text(200, SOL_ARRIERE + 2, nomChat(this.G), style(11, '#f3e6c8', { fontStyle: 'bold italic', stroke: '#140c06', strokeThickness: 3 })).setOrigin(0.5, 0);
    } else if (chatAdopte(this.G) && this.scene.key !== 'Promenade') {   // (en promenade, il te suit)
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
      // (v0.92) un clic sur la planche : jeter ce dont on ne veut plus
      if (n) {
        const z = this.add.rectangle(x + 54, y - 22, 112, 70, 0xffffff, 0).setInteractive({ useHandCursor: true });
        z.on('pointerover', () => z.setFillStyle(0xfff4dc, 0.12)); z.on('pointerout', () => z.setFillStyle(0xffffff, 0));
        z.on('pointerdown', () => this.ouvrirJeter(id));
      }
    });
    this.add.text(276, 412, 'Un clic sur une planche : jeter ce dont tu ne veux plus', style(11, '#e8d4a8', { fontStyle: 'italic', stroke: '#140c06', strokeThickness: 3 })).setOrigin(0.5);
    this.add.image(276, 78, plaqueBouton(this, 200)).setScale(2);
    this.add.text(276, 78, `Ta réserve : ${stockTotal(G)} / ${G.capacite}`, style(14, '#f3d98a', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 3 })).setOrigin(0.5);
  }

  // Le coin de la fortune : des piles de pièces autour du coffre, des sacs quand on est riche,
  // des lingots quand on l'est vraiment. Et des reconnaissances de dettes quand ça va mal.
  dessinerFortune() {
    const G = this.G;
    const cx = 790;   // (v0.66 : le coffre-fort contre le mur, entre le buffet et la porte de la chambre ; v0.84 : un peu à droite, pour la porte de la rue)
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
    this.add.image(cx, SOL_ARRIERE + 6, coffreHD(this, niveauAmelioration(G, 'coffre'))).setOrigin(0.5, 1).setScale(2.35);
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
    const places = [[640, 66], [692, 66], [744, 66], [556, 206], [812, 196], [556, 338], [812, 300], [588, 66], [796, 66], [812, 248]];
    (G.decos || []).filter(id => id !== 'sapinCristal').slice(0, places.length).forEach((id, i) => {
      const [x, y] = places[i];
      this.add.rectangle(x, y - 24, 3, 3, 0x2a1a10); // le clou
      const img = this.add.image(x, y, iconeObjet(this, id)).setScale(3).setInteractive({ useHandCursor: true });
      if (id === 'carillon') this.tweens.add({ targets: img, angle: { from: -3, to: 3 }, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      // La lanterne-crâne luit en vert, le chandelier d'argent en doré
      if (id === 'lanterneCrane' || id === 'chandelier') { const halo = this.add.circle(x, y, 26, id === 'chandelier' ? 0xffd870 : 0x80ff60, 0.16).setBlendMode(Phaser.BlendModes.ADD); this.tweens.add({ targets: halo, alpha: 0.32, scale: 1.15, duration: 900 + Math.random() * 500, yoyo: true, repeat: -1 }); }
      img.on('pointerdown', () => this.message(`${DECOS[id].nom} : ${DECOS[id].effet}`));
    });
    // (v1.05) le sapin de cristal, gros lot du Long Hiver : posé sur le plancher, il luit en bleu et scintille
    if (aDeco(G, 'sapinCristal')) {
      const x = 292, y = SOL_ARRIERE + 56;
      creerHalo(this);
      const lueur = this.add.image(x, y - 34, 'halo').setScale(0.9).setTint(0x60d8ff).setAlpha(0.3).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: lueur, alpha: 0.12, scale: 0.8, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      const sapin = this.add.image(x, y, iconeObjet(this, 'sapinCristal')).setOrigin(0.5, 1).setScale(4.4).setInteractive({ useHandCursor: true });
      sapin.on('pointerdown', () => this.message(`${DECOS.sapinCristal.nom} : ${DECOS.sapinCristal.effet}`));
      this.time.addEvent({ delay: 420, loop: true, callback: () => {
        const e = this.add.rectangle(x + Phaser.Math.Between(-24, 24), y - Phaser.Math.Between(10, 64), 3, 3, 0xe8fbff);
        this.tweens.add({ targets: e, alpha: 0, scale: 0.2, duration: 700, onComplete: () => e.destroy() });
      } });
    }
  }

  // Le panier des cadeaux (du Bazar de Rosalie)
  dessinerPanier() {
    const G = this.G;
    // (v0.66) posé sur le vieux buffet, contre le mur
    const x = 562, y = SOL_ARRIERE - 62;
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
    const x = 584, y = SOL_ARRIERE + 20;
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
    const x = 688;   // (v0.84 : la porte de la rue a pris sa place au bord, plus grande)
    this.add.image(x, SOL_ARRIERE, 'porteHD').setOrigin(0.5, 1).setScale(2);
    // Une bougie sur le petit appui à côté de la porte
    this.add.text(x, SOL_ARRIERE - 182, 'La chambre', style(12, '#3a2410', { fontStyle: 'bold italic' })).setOrigin(0.5);
    const zone = this.add.rectangle(x, SOL_ARRIERE - 84, 92, 168, 0xffffff, 0).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => this.porte());
  }

  // (v0.84) la porte de derrière, qui donne sur la ruelle et la rue (demandée par les testeurs)
  dessinerPorteRue() {
    const x = 898;
    this.add.image(x, SOL_ARRIERE + 4, 'porteRueHD_' + niveauFacade(this.G)).setOrigin(0.5, 1).setScale(1.9);
    // l'écriteau peint au-dessus
    this.add.text(x, SOL_ARRIERE - 198, 'La rue', style(13, '#f3e6c8', { fontStyle: 'bold italic', stroke: '#2a1408', strokeThickness: 4 })).setOrigin(0.5);
    const zone = this.add.rectangle(x, SOL_ARRIERE - 90, 108, 180, 0xffffff, 0).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => { if (this.porteRue) this.porteRue(); });
  }

  porteRue() {
    if (this.comptoir && (this.comptoir.voyageur || this.comptoir.entree || this.G.file.length)) return this.message("Pas maintenant : quelqu'un t'attend au comptoir !");
    this.message('La porte de derrière donne sur la ruelle. Le soir, en te promenant, tu pourras sortir par là.');
  }

  porte() {
    const c = this.comptoir;
    if (!c) return this.message('La chambre attendra ce soir : ta journée commence !');
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

  // --- (v0.92) Jeter des provisions ou des armes ---
  ouvrirJeter(id) {
    const G = this.G;
    if (this.liste) { this.liste.destroy(); this.liste = null; }
    const ids = id === 'armes' ? IDS_ARMES.filter(w => (G.stock[w] || 0) > 0) : [id];
    if (!ids.length) return;
    const c = this.liste = this.add.container(0, 0).setDepth(10);
    const h = 84 + ids.length * 34;
    c.add(this.add.rectangle(480, 270, 960, 540, 0x000000, 0.45).setInteractive());
    c.add(this.add.rectangle(480, 270, 460, h, 0xead9b0).setStrokeStyle(3, 0x8a6a3a));
    const haut = 270 - h / 2;
    c.add(this.add.text(480, haut + 18, 'Jeter des objets de ta réserve', style(15, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
    c.add(this.add.text(480, haut + 38, "(ils partent au rebut : pas d'argent en retour)", style(11, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5));
    ids.forEach((w, i) => {
      const y = haut + 66 + i * 34;
      c.add(this.add.image(290, y, iconeObjet(this, w)).setScale(2));
      const t = this.add.text(310, y, `${ITEMS[w].nom} × ${G.stock[w]}`, style(13, '#3b2410', { fontStyle: 'bold' })).setOrigin(0, 0.5);
      c.add(t);
      const bouton = (bx, texte, combien) => {
        const b = this.add.text(bx, y, texte, style(12, '#fff4dc', { fontStyle: 'bold', backgroundColor: '#8a3a2a', padding: { x: 6, y: 3 } })).setOrigin(0.5).setInteractive({ useHandCursor: true });
        b.on('pointerdown', () => {
          const n = Math.min(G.stock[w] || 0, combien === 'tout' ? Infinity : combien);
          if (!n) return;
          G.stock[w] -= n;
          Son.jouer('glisse');
          this.scene.restart({ comptoir: this.comptoir, retour: this.retour, message: `Au rebut : ${n} × ${ITEMS[w].nom.toLowerCase()}.` });
        });
        c.add(b);
      };
      bouton(600, 'Jeter 1', 1);
      bouton(675, 'Tout', 'tout');
    });
    const fermer = this.add.text(480, haut + h - 14, 'Fermer', style(12, '#8a3a2a', { fontStyle: 'bold' })).setOrigin(0.5).setInteractive({ useHandCursor: true });
    fermer.on('pointerdown', () => { this.liste.destroy(); this.liste = null; });
    c.add(fermer);
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
    const v = this.comptoir && this.comptoir.enService ? this.comptoir.voyageur : null;
    c.add(this.add.text(480, haut + 18, v ? (sombre ? `Glisser dans le baluchon ${dePersonne(v.nom.split(' ')[0])} :` : `Offrir à ${v.nom.split(' ')[0]} :`) : "Personne à servir pour l'instant",
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
    if (!c || !c.enService || !c.voyageur) return this.message("Il n'y a personne à servir pour l'instant.");
    this.fermer(() => (type === 'cadeaux' ? c.offrir(id) : c.glisserPiege(id)));
  }

  // (v1.29, planche 53) La trappe de la cave, ouverte : la lueur de la lanterne monte du trou
  dessinerTrappe() {
    creerRepaireHD(this); creerHalo(this);
    this.add.image(330, SOL_ARRIERE + 90, 'trappeOuverte').setOrigin(0.5, 1).setScale(2);
    this.add.image(500, SOL_ARRIERE + 40, 'tapisRoule').setOrigin(0.5, 1).setScale(2);
    const h = this.add.image(330, SOL_ARRIERE + 68, 'halo').setScale(1.1).setTint(0xff9a40).setAlpha(0.5).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: h, alpha: 0.3, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.add.text(330, SOL_ARRIERE + 22, 'La cave', style(12, '#ffcfa0', { fontStyle: 'bold', stroke: '#140c06', strokeThickness: 3 })).setOrigin(0.5);
    this.add.zone(330, SOL_ARRIERE + 60, 190, 80).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.ouvrirCave());
  }
  // On descend l'échelle : la voûte, les caisses, ce qui dort à l'abri
  ouvrirCave() {
    if (this.cave && this.cave.active) return;   // (v1.31 : une cave quittée par le menu ne bloque plus la trappe)
    const G = this.G, c = this.cave = this.add.container(0, 0).setDepth(50);
    Son.jouer('porte');
    c.add(this.add.image(0, 0, 'caveRepaire').setOrigin(0).setScale(2).setInteractive());
    const g = this.add.graphics().setBlendMode(Phaser.BlendModes.ADD); g.fillStyle(0xffc070, 0.12).fillPoints([{ x: 128, y: 40 }, { x: 216, y: 40 }, { x: 300, y: 420 }, { x: 100, y: 420 }], true); c.add(g);
    c.add([this.add.rectangle(480, 140, 2, 40, 0x202020), this.add.rectangle(480, 168, 16, 22, 0x3a0a0a).setStrokeStyle(2, 0x1a1a1a), this.add.rectangle(480, 168, 10, 14, 0xff4a2a)]);
    const l = this.add.image(480, 168, 'halo').setScale(2.6).setTint(0xff3020).setAlpha(0.45).setBlendMode(Phaser.BlendModes.ADD); c.add(l);
    this.tweens.add({ targets: l, alpha: 0.28, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    creerAccessoiresFacade(this); creerIconesHD(this);
    c.add([this.add.image(580, 480, 'caissesContrebande').setOrigin(0.5, 1).setScale(4), this.add.image(760, 490, 'caissesContrebande').setOrigin(0.5, 1).setScale(4.6).setFlipX(true), this.add.image(380, 486, 'tonneauxHD').setOrigin(0.5, 1).setScale(3)]);
    // les interdits rangés sur les deux étagères (un de chaque, tant qu'il y en a)
    const ids = Object.entries(G.interdits || {}).filter(([, n]) => n > 0).flatMap(([id, n]) => Array(Math.min(n, 4)).fill(id)).slice(0, 8);
    ids.forEach((id, i) => c.add(this.add.image(652 + (i % 4) * 56, (i < 4 ? 208 : 288) - 2, iconeObjet(this, id)).setOrigin(0.5, 1).setScale(2.3)));
    const n = interditsTotal(G), abri = Math.min(n, REPAIRE.abri);
    c.add(this.add.text(480, 34, 'La cave de contrebande', style(22, '#f3d98a', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 5 })).setOrigin(0.5));
    c.add(this.add.text(480, 64, n ? `${n} objet${n > 1 ? 's' : ''} interdit${n > 1 ? 's' : ''} ici · ${abri} toujours à l'abri de la garde${n > abri ? `, ${n - abri} trouvé${n - abri > 1 ? 's' : ''} une fois sur deux` : ''}` : 'Les étagères sont vides. Le Passeur a de quoi les remplir...', style(13, '#ffd8c8', { fontStyle: 'italic bold', stroke: '#1a0e06', strokeThickness: 3 })).setOrigin(0.5));
    const b = creerBouton(this, 840, 505, 220, '▲ Remonter', () => { b.fond.destroy(); b.label.destroy(); c.destroy(); this.cave = null; Son.jouer('porte'); });
    b.fond.setDepth(51); b.label.setDepth(51.1);
  }

  message(texte) {
    this.texteInfo.setText(texte).setColor('#f3d98a');
  }

  fermer(ensuite) {
    if (this.comptoir) this.comptoir.majStock && this.comptoir.majStock();   // (ce qu'on a jeté disparaît du comptoir)
    this.scene.stop();
    this.scene.resume(this.retour);
    if (ensuite) ensuite();
  }
}
