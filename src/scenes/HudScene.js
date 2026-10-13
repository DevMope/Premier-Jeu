// Le bandeau toujours visible, par-dessus toutes les pages du jeu : le jour en cours, et le
// menu « ☰ » pour retourner à l'écran titre quand on veut.
// Cette scène tourne en permanence, au-dessus des autres (elle s'y remet à chaque image).
const SCENES_SANS_BANDEAU = ['Titre', 'Intro', 'IntroHistoire', 'Renovation', 'Faillite', 'Hud'];

class HudScene extends Phaser.Scene {
  constructor() { super({ key: 'Hud', active: false }); }

  create() {
    // La plaque : du bois sombre à liseré doré, en haut à gauche
    const plaque = this.add.graphics();
    plaque.fillStyle(0x1e130a, 0.92).fillRoundedRect(-8, -8, 118, 26, 7);
    plaque.lineStyle(2, 0xc9a227, 1).strokeRoundedRect(-8, -8, 118, 26, 7);
    this.texteJour = this.add.text(36, 9, '', style(15, '#f3d98a', { fontStyle: 'bold', brut: true })).setOrigin(0, 0.5);
    const menu = this.add.text(16, 9, '☰', style(17, '#fff4dc', { fontStyle: 'bold', brut: true })).setOrigin(0.5);
    const zone = this.add.rectangle(55, 9, 110, 20, 0xffffff, 0).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => this.ouvrirMenu());
    zone.on('pointerover', () => menu.setColor('#ffe066'));
    zone.on('pointerout', () => menu.setColor('#fff4dc'));
    // La réputation, en direct : elle s'anime quand elle bouge.
    plaque.fillStyle(0x1e130a, 0.92).fillRoundedRect(114, -8, 104, 26, 7);
    plaque.lineStyle(2, 0xc9a227, 1).strokeRoundedRect(114, -8, 104, 26, 7);
    // Une étoile et une jauge dorée qui se remplit vers le prochain palier, le chiffre par-dessus.
    this.etoileReput = this.add.text(126, 9, '⭐', style(13, '#f3d98a', { brut: true })).setOrigin(0, 0.5);
    this.jaugeReput = this.add.graphics();
    this.remplissage = 0;
    this.texteReput = this.add.text(178, 9, '', style(11, '#fff4dc', { fontStyle: 'bold', stroke: '#1e130a', strokeThickness: 4, brut: true })).setOrigin(0.5);
    const zoneReput = this.add.rectangle(166, 9, 104, 20, 0xffffff, 0).setInteractive({ useHandCursor: true });
    zoneReput.on('pointerover', () => this.infoReput(true));
    zoneReput.on('pointerout', () => this.infoReput(false));
    zoneReput.on('pointerdown', () => this.infoReput(!this.bulleReput));
    this.reputAffichee = null;
    this.bandeau = this.add.container(0, 0, [plaque, menu, this.texteJour, zone, this.etoileReput, this.jaugeReput, this.texteReput, zoneReput]).setDepth(100);
  }

  dessinerJauge() {
    const g = this.jaugeReput, x0 = 146, l = 64, y0 = 3, h = 12, part = this.remplissage;
    g.clear();
    g.fillStyle(0x0e0904).fillRoundedRect(x0, y0, l, h, 4);
    g.fillStyle(0xb8860b).fillRoundedRect(x0 + 1, y0 + 1, Math.max(4, (l - 2) * part), h - 2, 3);
    g.fillStyle(0xf3d98a, 0.9).fillRect(x0 + 2, y0 + 2, Math.max(2, (l - 4) * part), 3);
    g.lineStyle(1, 0xc9a227).strokeRoundedRect(x0, y0, l, h, 4);
    g.lineStyle(1, 0x0e0904, 0.5);
    for (let k = 1; k < 5; k++) g.lineBetween(x0 + l * k / 5, y0 + 2, x0 + l * k / 5, y0 + h - 2);
  }

  // Le détail de la réputation : son palier (le plafond de clients) et le suivant.
  infoReput(montrer) {
    if (this.bulleReput) { this.bulleReput.destroy(); this.bulleReput = null; }
    const G = window.GAME;
    if (!montrer || !G) return;
    const p = palierClients(G);
    const texte = `Réputation : ${arrondi(G.reputation)}\n${p.nom} : jusqu'à ${p.max} clients de passage par jour\n(+${BONUS_CLIENTS_MAX} au plus grâce au stock varié, à l'éclairage, au trophée)` +
      (p.suivant ? `\nProchain palier à ${p.suivant.reputation} : ${p.suivant.nom} (${p.suivant.max} clients)` : '\nPalier maximum atteint !');
    this.bulleReput = this.add.text(116, 24, texte, style(12, '#fff4dc', { backgroundColor: '#1e130a', padding: { x: 8, y: 6 }, lineSpacing: 3 })).setDepth(105);
  }

  // La scène du jeu qu'on regarde (la plus haute, hors bandeau).
  scenePrincipale() {
    const actives = this.scene.manager.getScenes(true).filter(s => s.scene.key !== 'Hud');
    return actives[actives.length - 1];
  }

  update() {
    const G = window.GAME;
    const s = this.scenePrincipale();
    const visible = !!(G && s && !SCENES_SANS_BANDEAU.includes(s.scene.key));
    this.bandeau.setVisible(visible && !this.fenetre);
    if (visible) {
      this.texteJour.setText(`Jour ${G.jour}`);
      const r = Math.round(G.reputation * 10) / 10;
      if (r !== this.reputAffichee) {
        if (this.reputAffichee !== null) {
          const d = Math.round((r - this.reputAffichee) * 10) / 10;
          // (à droite de la plaque, pour ne rien cacher en dessous)
          const t = this.add.text(226, 9, `${d > 0 ? '+' : ''}${String(d).replace('.', ',')}`, style(15, d > 0 ? '#a8f088' : '#ff8070', { fontStyle: 'bold', stroke: '#1e130a', strokeThickness: 4, brut: true })).setOrigin(0, 0.5).setDepth(101);
          this.tweens.add({ targets: t, x: 250, alpha: 0, duration: 1600, delay: 300, onComplete: () => t.destroy() });
          this.tweens.add({ targets: this.texteReput, scale: 1.25, duration: 150, yoyo: true });
        }
        this.reputAffichee = r;
        this.texteReput.setText(String(r).replace('.', ','));
        // La jauge glisse jusqu'à sa nouvelle place dans le palier
        const pal = palierClients(G);
        const debut = pal.reputation === -Infinity ? 0 : pal.reputation, fin = pal.suivant ? pal.suivant.reputation : debut + 10;
        const cible = Phaser.Math.Clamp((G.reputation - debut) / (fin - debut), 0, 1);
        this.tweens.killTweensOf(this);
        this.tweens.add({ targets: this, remplissage: cible, duration: 600, ease: 'Sine.easeOut', onUpdate: () => this.dessinerJauge() });
        this.dessinerJauge();
      }
    } else if (this.bulleReput) this.infoReput(false);
    else if (this.fenetre && !G) this.fermerMenu();
    // Toujours au-dessus des autres pages
    const liste = this.scene.manager.scenes;
    if (liste[liste.length - 1] !== this) this.scene.bringToTop();
  }

  ouvrirMenu() {
    if (this.fenetre) return;
    // Le jeu s'arrête derrière la question (timers, animations, clients).
    const s = this.scenePrincipale();
    this.scenePausee = s && s.scene.isActive() ? s : null;
    if (this.scenePausee) this.scenePausee.scene.pause();
    const c = this.fenetre = this.add.container(0, 0).setDepth(110);
    c.add(this.add.rectangle(480, 270, 960, 540, 0x000000, 0.55).setInteractive());
    c.add(this.add.image(480, 260, panneauHD(this, 480, 200)).setScale(2));
    c.add(this.add.text(480, 196, "Retourner à l'écran titre ?", style(24, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
    c.add(this.add.text(480, 244, 'Ta partie est sauvegardée. En pleine journée,\ntu la reprendras au matin de ce jour-là.', style(16, '#4a2e18', { align: 'center', lineSpacing: 4 })).setOrigin(0.5));
    const oui = creerBouton(this, 385, 312, 170, 'Écran titre', () => this.retourTitre());
    const non = creerBouton(this, 575, 312, 170, 'Continuer', () => this.fermerMenu());
    c.add([oui.fond, oui.label, non.fond, non.label]);
  }

  fermerMenu() {
    if (this.fenetre) this.fenetre.destroy();
    this.fenetre = null;
    if (this.scenePausee && this.scenePausee.scene.isPaused()) this.scenePausee.scene.resume();
    this.scenePausee = null;
  }

  retourTitre() {
    this.fermerMenu();
    for (const s of this.scene.manager.getScenes(false)) {
      if (s.scene.key !== 'Hud' && (s.scene.isActive() || s.scene.isPaused() || s.scene.isSleeping())) s.scene.stop();
    }
    this.scene.launch('Titre');
  }
}
