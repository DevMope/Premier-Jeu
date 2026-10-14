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
    dessinerComte(g, 0, 0, 960, 470, 0); // midi : le soleil est haut, on ouvre le comptoir
    this.add.image(0, 440, pavesHD(this, 960, 100)).setOrigin(0).setScale(2);
    const facade = dessinerFacade(this, 560, 440, G.nomShop);
    this.add.text(480, 34, `Jour ${G.jour} · ${G.nomShop}`, style(26, '#fff4dc', { fontStyle: 'bold', stroke: '#2a1a10', strokeThickness: 6 })).setOrigin(0.5);
    // Une petite foule attend déjà devant la fenêtre, s'il y a du monde aujourd'hui.
    const clients = G.file.filter(e => e.type === 'client').slice(0, 4);
    clients.forEach((e, i) => imageCorps(this, 330 - i * 40, 440, e.voyageur, 5.6).setTint(0xf0dcc8));
    if (clients.length) {
      this.add.text(250, 300, `${G.file.length} visite${G.file.length > 1 ? 's' : ''} aujourd'hui`, style(13, '#fff4dc', { fontStyle: 'italic', stroke: '#2a1a10', strokeThickness: 4 })).setOrigin(0.5);
    }
    this.joueur = this.add.image(-40, 440, textureJoueur(this, G)).setOrigin(0.5, 1).setScale(echelleJoueur(7));
    this.indicePasser = this.add.text(940, 520, '▶ clique pour passer', style(12, '#fff4dc', { fontStyle: 'italic', stroke: '#2a1a10', strokeThickness: 3 })).setOrigin(1, 0.5);
    this.input.once('pointerdown', () => { if (this.indicePasser.visible) this.entrer(); });
    this.facadeVue = facade;
    this.derouler(facade);
  }

  async derouler(facade) {
    await this.marcher(this.joueur, facade.porteX, 3);
    if (this.fini) return;
    this.onomatopee(facade.porteX, 330, 'Clic-clac !');
    await this.animer({ targets: this.joueur, alpha: 0, duration: 400 });
    if (this.fini) return;
    this.indicePasser.setVisible(false);
    await this.attendreSuite('▶ Clique pour ouvrir le comptoir');
    this.entrer();
  }

  entrer() {
    if (this.fini) return;
    this.fini = true;
    // (v0.57) Un cercle qui se referme sur la porte, comme dans les vieux films, puis le comptoir
    const cx = this.facadeVue ? this.facadeVue.porteX : 480, cy = 380;
    // (un anneau noir très épais autour d'un cercle qui rétrécit)
    const anneau = this.add.graphics().setDepth(50);
    const cercle = { r: 760 };
    const dessiner = () => { anneau.clear(); anneau.lineStyle(2000, 0x000000, 1).strokeCircle(cx, cy, Math.max(0, cercle.r) + 1000); };
    dessiner();
    Son.jouer('porte');
    this.tweens.add({ targets: cercle, r: 0, duration: 800, ease: 'Sine.easeIn', onUpdate: dessiner, onComplete: () => {
      this.add.rectangle(480, 270, 960, 540, 0x000000).setDepth(51);
      this.time.delayedCall(150, () => this.scene.start(this.suite, {}));
    } });
  }
}
