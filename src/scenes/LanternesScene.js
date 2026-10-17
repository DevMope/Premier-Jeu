// (v1.00, lot B-3a, planche 30 D validée) Le dernier soir du Solstice : tout le village lâche ses lanternes
// célestes, dans la rue, devant le comptoir. JeuneGoy tient la sienne à bout de bras, la lâche, et la
// regarde monter avec les autres. Un clic pour continuer (pas d'enchaînement automatique).
class LanternesScene extends Phaser.Scene {
  constructor() { super('Lanternes'); }

  init(data) {
    this.suite = (data && data.suite) || 'Dodo';
    this.donnees = (data && data.donnees) || {};
    this.fini = false; this.attenteClic = false;
  }

  create() {
    const G = this.G = window.GAME;
    this.cameras.main.fadeIn(900);
    construireRue(this, -600, { jour: false, ici: { regarder: () => {}, porte: () => {} } });
    this.add.rectangle(480, 270, 960, 540, 0x0a0820, 0.25).setDepth(9);
    creerHalo(this);
    // les voisins, de dos, qui regardent le ciel (certains lèvent les bras pour lâcher la leur)
    this.voisins = [];
    [[160, 'humain', true], [250, 'hobbit', false], [720, 'nain', false], [810, 'humain', true]].forEach(([x, race, f], k) => {
      const qui = { nom: 'Voisin ' + k, race, feminin: f, niveau: 1 };
      const v = imageCorps(this, x, 520, qui, 4.6).setDepth(11).setTint(0x8a7a9a);
      v.qui = qui;
      this.voisins.push(v);
    });
    // JeuneGoy de dos, sa lanterne à bout de bras
    this.joueur = this.add.image(560, 560, textureJoueurPose(this, G, 'dos', 'leves')).setOrigin(0.5, 1).setScale(echelleJoueur(9)).setDepth(11);
    this.sienne = this.lanterne(560, this.joueur.y - this.joueur.displayHeight + 14, 2.4, 11.5);   // (tenue à bout de bras, entre ses mains)
    // les premières lanternes du village montent déjà
    let s = 7;
    const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    for (let k = 0; k < 26; k++) { const y = 30 + rnd() * 300; this.monter(this.lanterne(40 + rnd() * 880, y, 0.5 + (y / 330) * 1.1, 10), 14000 + rnd() * 6000); }
    this.time.addEvent({ delay: 450, loop: true, callback: () => { if (!this.fini) this.monter(this.lanterne(40 + Math.random() * 880, 470, 1.4, 10), 11000 + Math.random() * 5000); } });
    Son.jouer('nymphe');
    this.indice = this.add.text(940, 525, '', style(12, '#fff4dc', { fontStyle: 'italic', stroke: '#1a0e06', strokeThickness: 3 })).setOrigin(1, 0.5).setDepth(13);
    this.input.on('pointerdown', () => this.continuer());
    this.derouler();
  }

  // Une lanterne de papier huilé, sa flamme et sa lueur (un conteneur qu'on fait monter)
  lanterne(x, y, e, prof) {
    const c = this.add.container(x, y).setDepth(prof);
    const halo = this.add.image(0, 0, 'halo').setScale(0.35 * e).setTint(0xffa040).setAlpha(0.55).setBlendMode(Phaser.BlendModes.ADD);
    const g = this.add.graphics();
    g.fillStyle(0xf8c070).fillRoundedRect(-6 * e, -8 * e, 12 * e, 14 * e, 3 * e);
    g.fillStyle(0xfff0c0).fillRect(-3 * e, -2 * e, 6 * e, 6 * e);
    g.fillStyle(0xd08040).fillRect(-6 * e, 6 * e, 12 * e, 1.5 * e);
    c.add([halo, g]);
    this.tweens.add({ targets: halo, alpha: 0.35, duration: 500 + Math.random() * 400, yoyo: true, repeat: -1 });
    return c;
  }
  // Elle monte en se balançant doucement, et rapetisse au loin
  monter(c, duree) {
    this.tweens.add({ targets: c, y: c.y - 600, scale: 0.4, duration: duree, ease: 'Sine.easeIn', onComplete: () => c.destroy() });
    this.tweens.add({ targets: c, x: c.x + Phaser.Math.Between(-40, 40), duration: duree / 3, yoyo: true, repeat: 1, ease: 'Sine.easeInOut' });
  }
  attendre(ms) { return new Promise(r => this.time.delayedCall(ms, r)); }

  async derouler() {
    const titre = this.add.text(480, 40, 'Le dernier soir du Solstice', style(26, '#f3d98a', { fontFamily: 'MedievalSharp, serif', stroke: '#1a0e06', strokeThickness: 6 })).setOrigin(0.5).setDepth(12).setAlpha(0);
    const sous = this.add.text(480, 76, 'Tout le village lâche ses lanternes ensemble : elles vont dire bonjour aux étoiles.', style(14, '#fff4dc', { fontStyle: 'italic', stroke: '#1a0e06', strokeThickness: 4 })).setOrigin(0.5).setDepth(12).setAlpha(0);
    this.tweens.add({ targets: [titre, sous], alpha: 1, duration: 1200 });
    // les voisins lèvent les bras chacun leur tour, comme pour pousser leur lanterne vers le ciel
    this.voisins.forEach((v, k) => this.time.delayedCall(900 + k * 700, () => {
      if (!v.active) return;
      v.setTexture(corpsHD(this, v.qui, 'leves'));
      this.monter(this.lanterne(v.x, v.y - v.displayHeight - 10, 1.6, 10.5), 12000);
      this.time.delayedCall(1200, () => v.active && v.setTexture(corpsHD(this, v.qui)));
    }));
    await this.attendre(3200);
    if (this.fini) return;
    // JeuneGoy lâche la sienne : ses bras redescendent, elle monte toute seule
    this.monter(this.sienne, 15000);
    Son.jouer('ting');
    this.joueur.setTexture(textureJoueur(this, this.G, 'dos'));
    this.tweens.add({ targets: this.joueur, y: 556, duration: 300, yoyo: true });
    await this.attendre(2600);
    if (this.fini) return;
    this.indice.setText('▶ clique pour continuer');
    this.attenteClic = true;
  }

  continuer() {
    if (!this.attenteClic || this.fini) return;
    this.fini = true;
    this.cameras.main.fadeOut(900);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(this.suite, this.donnees));
  }
}
