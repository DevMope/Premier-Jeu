// La faillite : le banquier arrive avec ses gardes pour tout saisir.
// Une scène menaçante... mais qui ne se prend pas trop au sérieux.
class FailliteScene extends Cinematique {
  constructor() { super('Faillite'); }

  create() {
    const G = this.G = window.GAME;
    this.cameras.main.fadeIn(600);
    const g = this.add.graphics();
    dessinerComte(g, 0, 0, 960, 370, 0.45);
    this.facade = dessinerFacade(this, 560, 350);

    this.joueur = this.add.image(300, 350, textureJoueur(this, G)).setOrigin(0.5, 1).setScale(6).setDepth(3);
    this.piece = this.add.ellipse(322, 290, 12, 12, 0xe8c040).setStrokeStyle(2, 0x9a7a10).setDepth(4);
    this.banquier = this.add.image(1040, 350, 'perso_banquier').setOrigin(0.5, 1).setScale(6).setDepth(3);
    this.gardes = [0, 1].map(i => this.creerGarde(1110 + i * 70));

    this.creerBoiteTexte();
    this.boutonPasser(() => this.finir());
    this.raconter();
  }

  // Un garde : son corps et sa lance, qui bougent ensemble.
  creerGarde(x) {
    const c = this.add.container(x, 350).setDepth(3);
    const lance = this.add.graphics();
    lance.fillStyle(0x6b4423).fillRect(26, -140, 4, 140);
    lance.fillStyle(0xc0c8d0).fillTriangle(22, -140, 28, -160, 34, -140);
    c.add([lance, this.add.image(0, 0, 'perso_garde').setOrigin(0.5, 1).setScale(6)]);
    return c;
  }

  // Les gardes marchent au pas, parfaitement synchronisés.
  async defiler(cibles, xs, duree) {
    cibles.forEach(c => this.tweens.add({ targets: c, y: 344, duration: 150, yoyo: true, repeat: Math.floor(duree / 300) }));
    await Promise.all(cibles.map((c, i) => this.animer({ targets: c, x: xs[i], duration: duree, ease: 'Linear' })));
    cibles.forEach(c => { c.y = 350; });
  }

  async raconter() {
    const G = this.G;
    const banquier = 'Le banquier';
    this.ecrire('', 'Au matin, on frappa à la porte. Très fort.');
    this.onomatopee(this.facade.porteX, 220, 'TOC TOC TOC !');
    this.cameras.main.shake(300, 0.006);
    await this.attendreClic();

    this.ecrire('', 'Le banquier de la Comté était venu en personne. Avec des amis.');
    this.banquier.setFlipX(true);
    this.gardes.forEach(c => c.setScale(-1, 1));
    await this.defiler([this.banquier, ...this.gardes], [470, 560, 630], 2200);
    await this.attendreClic();

    // Le parchemin des dettes, beaucoup trop long.
    this.ecrire(banquier, `« Par ordre de la Banque Centrale Goyenne, vos dettes s'élèvent à... »`);
    const parchemin = this.add.rectangle(440, 260, 34, 90, 0xead9b0).setStrokeStyle(2, 0x8a6a3a).setOrigin(0.5, 0).setDepth(5).setScale(1, 0.1);
    await this.animer({ targets: parchemin, scaleY: 1, duration: 700 });
    const rouleau = this.add.ellipse(440, 350, 34, 14, 0xead9b0).setStrokeStyle(2, 0x8a6a3a).setDepth(5);
    this.animer({ targets: rouleau, x: -60, angle: -720, duration: 2200, ease: 'Quad.easeIn' });
    await this.attendre(1600);
    this.ecrire(banquier, '« ...beaucoup. »');
    await this.attendreClic();
    parchemin.destroy();

    // Les gardes vident la réserve. Méthodiquement. Enfin, presque.
    this.ecrire('', 'Les gardes vidèrent ta réserve. Méthodiquement. Enfin, presque.');
    const porte = this.facade.porteX;
    for (let tour = 0; tour < 2; tour++) {
      const garde = this.gardes[tour];
      garde.setScale(1, 1);
      await this.defiler([garde], [porte], 500);
      await this.animer({ targets: garde, alpha: 0, duration: 200 });
      const caisse = this.add.image(0, -110, 'caisse').setScale(5);
      garde.add(caisse);
      await this.attendre(300);
      await this.animer({ targets: garde, alpha: 1, duration: 200 });
      garde.setScale(-1, 1);
      if (tour === 1) {
        // Le deuxième garde trébuche.
        await this.defiler([garde], [porte + 60], 300);
        this.onomatopee(garde.x + 30, 240, 'OUPS !');
        await this.animer({ targets: garde, angle: -85, duration: 250, ease: 'Quad.easeIn' });
        this.cameras.main.shake(200, 0.01);
        garde.remove(caisse);
        caisse.setPosition(garde.x - 60, 260).setDepth(4);
        await this.animer({ targets: caisse, x: caisse.x - 80, y: 335, angle: -180, duration: 500, ease: 'Bounce.easeOut' });
        await this.animer({ targets: garde, angle: 0, duration: 300 });
        caisse.destroy();
        await this.attendre(200);
      } else {
        await this.defiler([garde], [1020], 900);
      }
    }
    await this.attendreClic();

    // La dernière pièce.
    this.ecrire(banquier, '« Et ceci aussi. »');
    this.banquier.setFlipX(true);
    await this.defiler([this.banquier], [350], 500);
    await this.animer({ targets: this.piece, x: 360, y: 260, duration: 400 });
    this.onomatopee(330, 220, 'CLIC');
    this.piece.setPosition(this.banquier.x - 18, 290);
    await this.attendreClic();

    // Les planches sur la porte.
    this.ecrire('', 'Pour finir, ils clouèrent des planches sur la porte.');
    await this.defiler([this.gardes[1]], [porte - 50], 400);
    for (let i = 0; i < 2; i++) {
      const planche = this.add.rectangle(porte, 240 + i * 50, 100, 14, 0x6b4423).setAngle(i ? -12 : 12).setDepth(4);
      planche.setStrokeStyle(2, 0x3b2410);
      this.onomatopee(porte + 20, 220 + i * 50, 'BAM !', '#f3d98a');
      this.cameras.main.shake(150, 0.008);
      await this.attendre(500);
    }
    const ferme = this.add.text(porte, 300, 'FERMÉ', style(20, '#a02020', { fontStyle: 'bold', backgroundColor: '#ead9b0', padding: { x: 6, y: 2 } }))
      .setOrigin(0.5).setAngle(-8).setDepth(5);
    await this.animer({ targets: ferme, scale: { from: 2, to: 1 }, duration: 250 });
    await this.attendreClic();

    // Ils repartent. Toi, tu restes là.
    this.ecrire('', 'Puis ils repartirent, au pas, en sifflotant.');
    this.banquier.setFlipX(false);
    this.gardes.forEach(c => c.setScale(1, 1));
    this.tweens.add({ targets: this.piece, x: 1100, duration: 1800 });
    await this.defiler([this.banquier, ...this.gardes], [1080, 1150, 1080], 1800);
    const feuille = this.add.ellipse(300, 0, 10, 6, 0xb5532a).setDepth(6);
    this.tweens.add({ targets: feuille, x: 330, duration: 600, yoyo: true, repeat: 3, ease: 'Sine.easeInOut' });
    await this.animer({ targets: feuille, y: 270, duration: 2600 });
    this.finir();
  }

  finir() {
    if (this.fini) return;
    this.fini = true;
    const G = this.G;
    this.tweens.killAll();
    this.time.removeAllEvents();
    this.add.rectangle(480, 270, 960, 540, 0x140c08, 0.92).setDepth(30);
    this.add.text(480, 150, 'Faillite', style(56, '#d8604a', { fontStyle: 'bold' })).setOrigin(0.5).setDepth(31);
    this.add.text(480, 230,
      `Au matin du jour ${G.jour + 1}, la banque a tout saisi.\nTes dettes ont atteint ${-SEUIL_FAILLITE} pièces.`,
      style(18, '#f3e6c8', { align: 'center', lineSpacing: 8 })).setOrigin(0.5).setDepth(31);
    this.add.text(480, 310,
      `${G.jour} jours tenus · ${G.experience} aventuriers servis · réputation ${arrondi(G.reputation)}`,
      style(15, '#c9b48a')).setOrigin(0.5).setDepth(31);
    const b = creerBouton(this, 480, 420, 260, 'Recommencer', () => this.scene.start('Titre'));
    b.fond.setDepth(31);
    b.label.setDepth(31);
  }
}
