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
    this.bandeau = this.add.container(0, 0, [plaque, menu, this.texteJour, zone]).setDepth(100);
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
    if (visible) this.texteJour.setText(`Jour ${G.jour}`);
    else if (this.fenetre && !G) this.fermerMenu();
    // Toujours au-dessus des autres pages
    const liste = this.scene.manager.scenes;
    if (liste[liste.length - 1] !== this) this.scene.bringToTop();
  }

  ouvrirMenu() {
    if (this.fenetre) return;
    const c = this.fenetre = this.add.container(0, 0).setDepth(110);
    c.add(this.add.rectangle(480, 270, 960, 540, 0x000000, 0.55).setInteractive());
    c.add(this.add.image(480, 260, panneauHD(this, 480, 200)).setScale(2));
    c.add(this.add.text(480, 196, "Retourner à l'écran titre ?", style(24, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
    c.add(this.add.text(480, 244, 'Ta partie est sauvegardée. En pleine journée,\ntu la reprendras au soir de ce jour-là.', style(16, '#4a2e18', { align: 'center', lineSpacing: 4 })).setOrigin(0.5));
    const oui = creerBouton(this, 385, 312, 170, 'Écran titre', () => this.retourTitre());
    const non = creerBouton(this, 575, 312, 170, 'Continuer', () => this.fermerMenu());
    c.add([oui.fond, oui.label, non.fond, non.label]);
  }

  fermerMenu() {
    if (this.fenetre) this.fenetre.destroy();
    this.fenetre = null;
  }

  retourTitre() {
    this.fermerMenu();
    for (const s of this.scene.manager.getScenes(false)) {
      if (s.scene.key !== 'Hud' && (s.scene.isActive() || s.scene.isPaused() || s.scene.isSleeping())) s.scene.stop();
    }
    this.scene.launch('Titre');
  }
}
