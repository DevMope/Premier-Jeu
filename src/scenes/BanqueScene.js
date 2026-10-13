// La Banque Centrale Goyenne : des banquiers nains te regardent de haut,
// perchés derrière leur immense bureau, en se demandant si tu mérites un prêt.
// La scène s'ouvre par-dessus le soir, qui reste en pause.
class BanqueScene extends Phaser.Scene {
  constructor() { super('Banque'); }

  create() {
    const G = this.G = window.GAME;
    this.cameras.main.setBackgroundColor('#2a2a30');

    // Murs de pierre
    const g = this.add.graphics();
    g.fillStyle(0x4a4a52).fillRect(0, 0, 960, 540);
    g.lineStyle(2, 0x3a3a42);
    for (let y = 0; y < 540; y += 30) {
      g.lineBetween(0, y, 960, y);
      for (let x = (y / 30) % 2 ? 0 : 40; x < 960; x += 80) g.lineBetween(x, y, x, y + 30);
    }
    // Bannières dorées
    for (const x of [90, 870]) {
      g.fillStyle(0x7a1a1a).fillRect(x - 30, 20, 60, 140);
      g.fillStyle(0xe8c040).fillCircle(x, 80, 16);
    }

    // Les banquiers nains, perchés très haut
    this.banquiers = [[330, 252, 7], [480, 240, 8], [630, 252, 7]].map(([x, y, e], i) => {
      const b = this.add.image(x, y, 'perso_nainBanquier').setOrigin(0.5, 1).setScale(e);
      // Ils te toisent : petits mouvements de tête, l'un après l'autre
      this.tweens.add({ targets: b, angle: i === 1 ? 4 : -4, duration: 900 + i * 300, yoyo: true, repeat: -1, delay: i * 400, ease: 'Sine.easeInOut' });
      return b;
    });
    // L'immense bureau, devant eux : on ne voit que leurs têtes qui dépassent
    const bureau = this.add.graphics();
    bureau.fillStyle(0x5a3a22).fillRect(200, 190, 560, 110);
    bureau.fillStyle(0x3b2410).fillRect(190, 180, 580, 14);
    bureau.lineStyle(3, 0x3b2410);
    for (let x = 260; x < 760; x += 100) bureau.strokeRect(x - 30, 210, 60, 70);
    this.add.text(480, 245, 'BANQUE CENTRALE GOYENNE', style(18, '#e8c040', { fontStyle: 'bold' })).setOrigin(0.5);

    // Toi, tout petit, tout en bas
    this.add.image(70, 535, textureJoueur(this, G)).setOrigin(0.5, 1).setScale(echelleJoueur(5));

    // Ce que dit Thorgrim Coffrefort
    this.add.rectangle(480, 330, 760, 50, 0x1e130a, 0.92).setStrokeStyle(2, 0xc9a227);
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
    c.add(this.add.rectangle(470, 435, 640, 140, 0xead9b0).setStrokeStyle(3, 0x8a6a3a));
    pretsProposes(G).forEach((p, i) => {
      const y = 385 + i * 34;
      const du = Math.round(p.somme * (1 + p.taux));
      c.add(this.add.text(165, y, `${p.nom} : reçois ${p.somme} p., rends ${du} p. en ${p.jours} nuits (${Math.round(p.taux * 100)} %)`,
        style(13, '#3b2410')).setOrigin(0, 0.5));
      const refus = refusPret(G, p);
      if (refus) {
        c.add(this.add.text(785, y, refus, style(12, '#8a3a1a', { fontStyle: 'italic' })).setOrigin(1, 0.5));
      } else {
        const btn = this.add.rectangle(735, y, 100, 26, 0x8a5a2b).setStrokeStyle(2, 0x3b2410).setInteractive({ useHandCursor: true });
        btn.on('pointerdown', () => this.emprunter(p));
        c.add([btn, this.add.text(735, y, 'Emprunter', style(12, '#fff4dc', { fontStyle: 'bold' })).setOrigin(0.5)]);
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
