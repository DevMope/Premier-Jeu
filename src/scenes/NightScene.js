// Transition de nuit : le temps passe pendant que les aventuriers sont en route.
class NightScene extends Phaser.Scene {
  constructor() { super('Nuit'); }

  create() {
    this.cameras.main.setBackgroundColor('#0b0a1a');
    this.cameras.main.fadeIn(800);

    // Quelques étoiles
    const g = this.add.graphics();
    for (let i = 0; i < 80; i++) {
      g.fillStyle(0xfff4dc, Phaser.Math.FloatBetween(0.2, 0.9));
      g.fillRect(Phaser.Math.Between(0, 960), Phaser.Math.Between(0, 540), 2, 2);
    }

    this.add.text(480, 200, 'Les jours passent...', style(36, '#f3d98a', { fontStyle: 'italic' })).setOrigin(0.5);
    this.add.text(480, 260, 'Tes aventuriers sont en route.\nPeu à peu, les nouvelles reviennent jusqu\'à ton comptoir.',
      style(18, '#c9b48a', { align: 'center', lineSpacing: 8 })).setOrigin(0.5);

    creerBouton(this, 480, 400, 300, 'Écouter leurs récits', () => {
      this.scene.start('Recit', { index: 0 });
    });
  }
}
