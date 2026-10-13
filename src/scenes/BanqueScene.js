// La Banque Centrale Goyenne : des banquiers nains te regardent de haut,
// perchés derrière leur immense bureau, en se demandant si tu mérites un prêt.
// La scène s'ouvre par-dessus le soir, qui reste en pause.
class BanqueScene extends Phaser.Scene {
  constructor() { super('Banque'); }

  create() {
    const G = this.G = window.GAME;
    this.cameras.main.setBackgroundColor('#2a2a30');

    // Murs de pierre
    creerInterieurHD(this);
    creerBanqueHD(this);
    this.add.image(0, 0, 'murBanque').setOrigin(0).setScale(2).setTint(0xb8b0c0);
    vignette(this, 0.8, 0);
    // Bannières de velours, et deux chandeliers dorés
    for (const x of [90, 870]) this.add.image(x, 20, 'banniereHD').setOrigin(0.5, 0).setScale(2);
    for (const x of [230, 730]) poserLuminaire(this, x, -30, 3, 0);

    // Les banquiers nains, perchés très haut
    this.banquiers = [[330, 238, 7], [480, 226, 8], [630, 238, 7]].map(([x, y, e], i) => {
      const b = this.add.image(x, y, 'perso_nainBanquier').setOrigin(0.5, 1).setScale(e);
      // Ils te toisent : petits mouvements de tête, l'un après l'autre
      this.tweens.add({ targets: b, angle: i === 1 ? 4 : -4, duration: 900 + i * 300, yoyo: true, repeat: -1, delay: i * 400, ease: 'Sine.easeInOut' });
      return b;
    });
    // L'immense bureau, devant eux : on ne voit que leurs têtes qui dépassent
    this.add.image(480, 180, 'bureauBanque').setOrigin(0.5, 0).setScale(2);
    this.add.text(480, 242, 'BANQUE CENTRALE GOYENNE', style(17, '#3a2408', { fontStyle: 'bold' })).setOrigin(0.5);

    // Toi, tout petit, tout en bas
    this.add.image(70, 535, textureJoueur(this, G)).setOrigin(0.5, 1).setScale(echelleJoueur(5));

    // Ce que dit Thorgrim Coffrefort
    this.add.rectangle(480, 330, 760, 50, 0x1e130a, 0.92).setStrokeStyle(2, 0xc9a227).setY(334);
    this.texteNain = this.add.text(110, 314, '', style(14, '#f3e6c8', { wordWrap: { width: 740 } }));
    this.parler(this.accueil());

    this.creerPrets();
    creerBouton(this, 875, 505, 150, 'Quitter', () => this.fermer());
  }

  parler(texte) {
    this.texteNain.setText(`Thorgrim Coffrefort : « ${texte} »`);
  }

  accueil() {
    const r = this.G.reputation;
    if (r < 0) return 'Hmpf. Ta réputation sent le moisi. Estime-toi heureux qu\'on te reçoive.';
    if (r < 4) return 'Un petit marchand de rien du tout... On peut te prêter un peu. Un tout petit peu.';
    if (r < 10) return 'Ta réputation grandit, marchand. La Banque Centrale Goyenne... t\'écoute. Pour l\'instant.';
    return 'Ah, un client respectable ! Asseyez-vous. Ah non, nous n\'avons pas de chaises à votre taille.';
  }

  creerPrets() {
    if (this.panneau) this.panneau.destroy();
    const G = this.G;
    const c = this.panneau = this.add.container(0, 0);
    c.add(this.add.image(470, 435, panneauHD(this, 660, 150)).setScale(2));
    pretsProposes(G).forEach((p, i) => {
      const y = 385 + i * 34;
      const du = Math.round(p.somme * (1 + p.taux));
      c.add(this.add.text(165, y, `${p.nom} : reçois ${p.somme} p., rends ${du} p. en ${p.jours} nuits (${Math.round(p.taux * 100)} %)`,
        style(13, '#3b2410')).setOrigin(0, 0.5));
      const refus = refusPret(G, p);
      if (refus) {
        c.add(this.add.text(785, y, refus, style(12, '#8a3a1a', { fontStyle: 'italic' })).setOrigin(1, 0.5));
      } else {
        const btn = creerBouton(this, 735, y, 104, 'Emprunter', () => this.emprunter(p));
        btn.label.setFontSize(13);
        btn.fond.setScale(2, 1.5);
        c.add([btn.fond, btn.label]);
      }
    });
    const dettes = G.prets.map(p => `${p.nom} : reste ${p.restant} (−${p.parJour}/nuit)`).join(' · ');
    c.add(this.add.text(165, 486, dettes ? 'En cours : ' + dettes : 'Aucun prêt en cours.', style(12, '#5a3a20', { wordWrap: { width: 610 } })).setOrigin(0, 0.5));
  }

  emprunter(pret) {
    emprunter(this.G, pret);
    this.parler('Signé. Et n\'oublie pas : un nain n\'oublie jamais une dette.');
    this.tweens.add({ targets: this.banquiers, y: '-=8', duration: 120, yoyo: true });
    this.creerPrets();
  }

  fermer() {
    this.scene.stop();
    this.scene.resume('Nuit');
  }
}
