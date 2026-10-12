// Le bilan de la journée : qui est revenu, qui est mort, combien on a gagné.
class BilanScene extends Phaser.Scene {
  constructor() { super('Bilan'); }

  create() {
    const G = window.GAME;
    this.cameras.main.setBackgroundColor('#2a1a10');
    this.cameras.main.fadeIn(500);

    this.add.rectangle(480, 260, 760, 440, 0xead9b0).setStrokeStyle(4, 0x8a6a3a);
    this.add.text(480, 70, `Bilan du jour ${G.jour}`, style(30, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5);

    G.partis.forEach((p, i) => {
      const y = 140 + i * 70;
      const v = p.voyageur;
      const r = p.resultat;
      const e = v.feminin ? 'e' : '';
      this.add.image(150, y + 20, 'perso_' + v.race).setOrigin(0.5, 1).setScale(3)
        .setTint(r.vivant ? 0xffffff : 0x777777);
      this.add.text(185, y - 22, v.nom, style(18, '#3b2410', { fontStyle: 'bold' }));
      this.add.text(185, y + 2, `${v.quete} — préparé${e} à ${Math.round(p.chance * 100)} %`, style(14, '#6b4a2a'));
      const verdict = r.vivant ? `Revenu${e} : + ${v.butin} pièces`
        : r.valeureux ? `Mort${e} au combat` : `Mort${e} sans gloire`;
      this.add.text(820, y - 10, verdict, style(17, r.vivant ? '#2f6a2a' : '#a03030', { fontStyle: 'bold' })).setOrigin(1, 0.5);
    });

    const gain = G.argent - ARGENT_DEPART;
    this.add.text(480, 370, `Argent : ${ARGENT_DEPART} → ${G.argent} pièces  (${gain >= 0 ? '+' : ''}${gain})`,
      style(22, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5);
    this.add.text(480, 405, 'Fin du prototype — la suite (marché, plusieurs jours...) arrive aux prochaines étapes !',
      style(14, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5);

    creerBouton(this, 480, 460, 260, 'Rejouer la journée', () => {
      nouvellePartie();
      this.scene.start('Comptoir');
    });
  }
}
