// Écran titre.
class TitleScene extends Phaser.Scene {
  constructor() { super('Titre'); }

  create() {
    creerToutesLesTextures(this);

    const g = this.add.graphics();
    dessinerComte(g, 0, 0, 960, 540, 0.35);
    this.add.rectangle(480, 220, 640, 200, 0x2a1a10, 0.75).setStrokeStyle(4, 0xc9a227);

    this.add.text(480, 170, 'Le Comptoir des Aventuriers', style(40, '#f3d98a', { fontStyle: 'bold' })).setOrigin(0.5);
    this.add.text(480, 225, 'Prépare leurs provisions. Parie sur leur retour.', style(20, '#f3e6c8', { fontStyle: 'italic' })).setOrigin(0.5);
    this.add.text(480, 275, 'Prototype — étape 2++', style(16, '#c9b48a')).setOrigin(0.5);

    creerBouton(this, 480, 400, 260, 'Nouvelle partie', () => this.scene.start('Intro'));
  }
}
