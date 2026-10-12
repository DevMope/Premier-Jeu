// La faillite : l'argent est descendu trop bas, le comptoir ferme.
class FailliteScene extends Phaser.Scene {
  constructor() { super('Faillite'); }

  create() {
    const G = window.GAME;
    this.cameras.main.setBackgroundColor('#140c08');
    this.cameras.main.fadeIn(800);

    this.add.text(480, 150, 'Faillite', style(56, '#d8604a', { fontStyle: 'bold' })).setOrigin(0.5);
    this.add.text(480, 230,
      `Au matin du jour ${G.jour + 1}, les huissiers ont posé des scellés sur ton comptoir.\n` +
      `Tes dettes ont dépassé ${-SEUIL_FAILLITE} pièces.`,
      style(18, '#f3e6c8', { align: 'center', lineSpacing: 8 })).setOrigin(0.5);
    this.add.text(480, 310,
      `${G.jour} jours tenus · ${G.experience} aventuriers servis · réputation ${arrondi(G.reputation)}`,
      style(15, '#c9b48a')).setOrigin(0.5);

    creerBouton(this, 480, 420, 260, 'Recommencer', () => {
      nouvellePartie();
      this.scene.start('Comptoir');
    });
  }
}
