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
    this.add.text(480, 26, "L'arrière-boutique", style(24, '#f3d98a', { fontStyle: 'bold', stroke: '#2a1a10', strokeThickness: 5 })).setOrigin(0.5);
    this.texteInfo = this.add.text(480, 56, this.comptoir.voyageur ? `${this.comptoir.voyageur.nom} attend au comptoir...` : '',
      style(13, '#c9b48a', { fontStyle: 'italic' })).setOrigin(0.5);
    this.dessinerEtageres();
    this.dessinerFortune();
    this.dessinerPanier();
    this.dessinerBuffet();
    this.dessinerPorte();
    creerBouton(this, 840, 505, 220, '↻ Retour au comptoir', () => this.fermer());
  }

  // --- Le décor ---

  dessinerPiece() {
    const g = this.add.graphics();
    g.fillStyle(0x4a2e18).fillRect(0, 0, 960, SOL_ARRIERE);
    g.lineStyle(2, 0x3b2410);
    for (let y = 30; y < SOL_ARRIERE; y += 30) g.lineBetween(0, y, 960, y);
    g.fillStyle(0x6b4423).fillRect(0, SOL_ARRIERE, 960, 100);
    g.lineStyle(2, 0x4a2e18);
    for (let x = 0; x < 960; x += 80) g.lineBetween(x, SOL_ARRIERE, x, 540);
    // Une lanterne au plafond, pour la lumière
    g.fillStyle(0x3b2410).fillRect(479, 0, 2, 70);
    g.fillStyle(0xf0c060).fillRect(470, 70, 20, 24);
    for (let k = 0; k < 8; k++) this.add.circle(480, 82, 20 + k * 18, 0xffc060, 0.025).setBlendMode(Phaser.BlendModes.ADD);
  }

  // Les étagères : chaque objet de ta réserve, en vrai. Plus il y en a, plus ça déborde.
  dessinerEtageres() {
    const G = this.G;
    const g = this.add.graphics();
    const ids = Object.keys(ITEMS);
    const rangees = [150, 255, 360];
    for (const y of rangees) {
      g.fillStyle(0x8a5a2b).fillRect(24, y, 500, 10);
      g.fillStyle(0x5a3a1a).fillRect(24, y + 10, 500, 4);
    }
    g.fillStyle(0x5a3a1a).fillRect(20, 80, 8, SOL_ARRIERE - 80).fillRect(520, 80, 8, SOL_ARRIERE - 80);
    ids.forEach((id, i) => {
      const x = 44 + (i % 4) * 120;
      const y = rangees[Math.floor(i / 4)];
      const n = G.stock[id] || 0;
      for (let k = 0; k < Math.min(n, 8); k++) {
        this.add.image(x + 12 + (k % 4) * 16, y - 8 - Math.floor(k / 4) * 22, id).setOrigin(0.5, 1).setScale(3);
      }
      this.add.text(x + 4, y + 16, `${ITEMS[id].nom} ${n ? '× ' + n : '— vide'}`, style(11, n ? '#f3e6c8' : '#a07060', { fontStyle: n ? 'bold' : 'italic' }));
    });
    this.add.text(274, 76, `Ta réserve : ${stockTotal(G)} / ${G.capacite}`, style(14, '#f3d98a', { fontStyle: 'bold' })).setOrigin(0.5);
  }

  // Le coin de la fortune : des piles de pièces autour du coffre, des sacs quand on est riche,
  // des lingots quand on l'est vraiment. Et des reconnaissances de dettes quand ça va mal.
  dessinerFortune() {
    const G = this.G;
    const cx = 680;
    const g = this.add.graphics();
    const argent = Math.max(0, G.argent);
    // Des lingots, au-delà de 1000 pièces
    const lingots = Math.min(6, Math.floor(argent / 500));
    for (let i = 0; i < lingots; i++) {
      const x = cx - 70 + (i % 3) * 26, y = SOL_ARRIERE - 6 - Math.floor(i / 3) * 10;
      g.fillStyle(0xb88a10).fillRect(x, y, 22, 8);
      g.fillStyle(0xf0d060).fillRect(x + 3, y + 1, 16, 3);
    }
    // Des sacs de pièces, au-delà de 300
    const sacs = Math.min(4, Math.floor(argent / 150));
    for (let i = 0; i < sacs; i++) {
      const x = cx + 50 + i * 26;
      g.fillStyle(0x8a6a3a).fillEllipse(x, SOL_ARRIERE - 14, 24, 28);
      g.fillStyle(0x6b4423).fillRect(x - 4, SOL_ARRIERE - 32, 8, 6);
      this.add.text(x, SOL_ARRIERE - 14, '¤', style(12, '#f0d060', { fontStyle: 'bold' })).setOrigin(0.5);
    }
    // Des piles de pièces
    const piles = Math.min(10, Math.ceil(argent / 15));
    for (let i = 0; i < piles; i++) {
      const x = cx - 60 + (i % 5) * 24, base = SOL_ARRIERE - 60 - Math.floor(i / 5) * 4;
      const hauteur = 2 + ((i * 7) % 5);
      for (let k = 0; k < hauteur; k++) {
        g.fillStyle(0x9a7a10).fillEllipse(x, base - k * 5 + 2, 20, 8);
        g.fillStyle(0xe8c040).fillEllipse(x, base - k * 5, 20, 8);
      }
    }
    // Le coffre
    this.add.image(cx, SOL_ARRIERE - 36, 'coffre').setOrigin(0.5, 1).setScale(5);
    if (G.argent <= 0) {
      this.add.text(cx, SOL_ARRIERE - 120, 'Le coffre sonne creux...', style(12, '#c9b48a', { fontStyle: 'italic' })).setOrigin(0.5);
    }
    // Les dettes, épinglées au mur
    G.prets.slice(0, 3).forEach((p, i) => {
      const x = cx - 70 + i * 70, y = 140;
      this.add.rectangle(x, y, 60, 46, 0xf3e6c8).setAngle(i % 2 ? 4 : -5).setStrokeStyle(1, 0x8a6a3a);
      this.add.text(x, y, `Dette\n${p.restant} p.`, style(11, '#a03030', { fontStyle: 'bold', align: 'center' })).setOrigin(0.5).setAngle(i % 2 ? 4 : -5);
    });
    this.add.text(cx, 200, `Ta fortune : ${G.argent} pièces`, style(15, G.argent >= 0 ? '#f3d98a' : '#f0a8a0', { fontStyle: 'bold' })).setOrigin(0.5);
  }

  // Le panier des cadeaux (du Bazar de Rosalie)
  dessinerPanier() {
    const G = this.G;
    const x = 330, y = SOL_ARRIERE + 50;
    const n = Object.values(G.cadeaux || {}).reduce((a, b) => a + b, 0);
    const g = this.add.graphics();
    g.fillStyle(0xa87a44).fillRoundedRect(x - 40, y - 26, 80, 34, 6);
    g.lineStyle(2, 0x6b4423);
    for (let i = -30; i <= 30; i += 12) g.lineBetween(x + i, y - 24, x + i, y + 6);
    Object.keys(G.cadeaux || {}).filter(id => G.cadeaux[id] > 0).slice(0, 4).forEach((id, i) => this.add.image(x - 24 + i * 16, y - 26, id).setScale(2.4));
    const zone = this.add.rectangle(x, y - 14, 100, 60, 0xffffff, 0).setInteractive({ useHandCursor: true });
    this.add.text(x, y + 22, n ? `🎁 Les cadeaux (${n})` : '🎁 Panier vide', style(12, '#f3e6c8', { fontStyle: 'bold' })).setOrigin(0.5);
    zone.on('pointerdown', () => this.ouvrirListe('cadeaux'));
  }

  // Le vieux buffet. Son tiroir du bas ne s'ouvre que si la Faucheuse y a laissé quelque chose.
  dessinerBuffet() {
    const G = this.G;
    const x = 540, y = SOL_ARRIERE + 56;
    const n = Object.values(G.pieges || {}).reduce((a, b) => a + b, 0);
    const g = this.add.graphics();
    g.fillStyle(0x3b2410).fillRect(x - 46, y - 60, 92, 60);
    g.fillStyle(0x5a3a1a).fillRect(x - 40, y - 54, 80, 22).fillRect(x - 40, y - 28, 80, 22);
    g.fillStyle(0xc9a046).fillRect(x - 3, y - 45, 6, 4).fillRect(x - 3, y - 19, 6, 4);
    if (n) {
      // Une lueur violette sous le tiroir du bas...
      const lueur = this.add.rectangle(x, y - 6, 80, 3, 0xc040ff, 0.8);
      this.tweens.add({ targets: lueur, alpha: 0.2, duration: 700, yoyo: true, repeat: -1 });
    }
    const zone = this.add.rectangle(x, y - 30, 100, 64, 0xffffff, 0).setInteractive({ useHandCursor: true });
    this.add.text(x, y + 10, n ? `☠ Le tiroir secret (${n})` : 'Le vieux buffet', style(12, n ? '#d08aa8' : '#f3e6c8', { fontStyle: 'bold' })).setOrigin(0.5);
    zone.on('pointerdown', () => n ? this.ouvrirListe('pieges') : this.message("Des torchons, de la ficelle, un vieux bouton. Rien d'intéressant."));
  }

  // La porte de la chambre
  dessinerPorte() {
    const x = 900;
    const g = this.add.graphics();
    g.fillStyle(0x2a1a10).fillRoundedRect(x - 36, SOL_ARRIERE - 150, 72, 150, { tl: 36, tr: 36, bl: 0, br: 0 });
    g.fillStyle(0x6b4423).fillRoundedRect(x - 30, SOL_ARRIERE - 144, 60, 144, { tl: 30, tr: 30, bl: 0, br: 0 });
    g.fillStyle(0xe0c040).fillCircle(x + 18, SOL_ARRIERE - 70, 4);
    this.add.text(x, SOL_ARRIERE - 164, 'La chambre', style(12, '#f3e6c8', { fontStyle: 'bold' })).setOrigin(0.5);
    const zone = this.add.rectangle(x, SOL_ARRIERE - 75, 72, 150, 0xffffff, 0).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => this.porte());
  }

  porte() {
    const c = this.comptoir;
    if (c.voyageur || this.G.file.length) return this.message('Pas le temps de dormir : des clients attendent !');
    // La journée est finie : on ferme le comptoir et on rentre se reposer.
    this.cameras.main.fadeOut(400);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop('Comptoir');
      this.scene.start('Nuit');
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
      c.add([ligne, this.add.image(310, y, id).setScale(2.5).setTint(sombre ? 0x9a8aa0 : 0xffffff),
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
