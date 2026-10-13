// Le matin, en arrivant au travail : la façade du shop avec son enseigne. Ton personnage
// traverse la Comté, ouvre la porte... et la journée commence. Un clic pour passer.
class FacadeScene extends Cinematique {
  constructor() { super('Facade'); }

  init(data) {
    this.suite = data.suite || 'Comptoir';
    this.fini = false;
  }

  create() {
    const G = this.G = window.GAME;
    this.cameras.main.fadeIn(400);
    const g = this.add.graphics();
    dessinerComte(g, 0, 0, 960, 470, 0.1);
    this.add.image(0, 440, pavesHD(this, 960, 100)).setOrigin(0).setScale(2);
    const facade = dessinerFacade(this, 560, 440, G.nomShop);
    this.add.text(480, 34, `Jour ${G.jour} · ${G.nomShop}`, style(26, '#fff4dc', { fontStyle: 'bold', stroke: '#2a1a10', strokeThickness: 6 })).setOrigin(0.5);
    // Une petite foule attend déjà devant la fenêtre, s'il y a du monde aujourd'hui.
    const clients = G.file.filter(e => e.type === 'client').slice(0, 4);
    clients.forEach((e, i) => imageCorps(this, 330 - i * 34, 440, e.voyageur, 3.2).setTint(0xe8e0d0));
    if (clients.length) {
      this.add.text(250, 300, `${G.file.length} visite${G.file.length > 1 ? 's' : ''} aujourd'hui`, style(13, '#fff4dc', { fontStyle: 'italic', stroke: '#2a1a10', strokeThickness: 4 })).setOrigin(0.5);
    }
    this.joueur = this.add.image(-40, 440, textureJoueur(this, G)).setOrigin(0.5, 1).setScale(echelleJoueur(5));
    this.add.text(940, 520, '▶ clique pour passer', style(12, '#fff4dc', { fontStyle: 'italic', stroke: '#2a1a10', strokeThickness: 3 })).setOrigin(1, 0.5);
    this.input.once('pointerdown', () => this.entrer());
    this.derouler(facade);
  }

  async derouler(facade) {
    await this.marcher(this.joueur, facade.porteX, 3);
    if (this.fini) return;
    this.onomatopee(facade.porteX, 330, 'Clic-clac !');
    await this.animer({ targets: this.joueur, alpha: 0, duration: 400 });
    this.entrer();
  }

  entrer() {
    if (this.fini) return;
    this.fini = true;
    this.cameras.main.fadeOut(400);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(this.suite, {}));
  }
}
