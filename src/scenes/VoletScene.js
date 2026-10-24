// (v1.61) Les volets, façon Pokémon DS : entre le comptoir et les récits, des bandes de bois glissent de
// gauche et de droite, se referment, puis se rouvrent sur la scène suivante (avant : un écran noir).
// La scène reste au-dessus de toutes les autres le temps du passage, puis s'arrête.
const VOLETS = { bandes: 9, fermer: 300, ouvrir: 320, decalage: 28 };

class VoletScene extends Phaser.Scene {
  constructor() { super('Volet'); }

  init(data) { this.depuis = data.depuis; this.cle = data.cle; this.donnees = data.donnees || {}; }

  create() {
    const N = VOLETS.bandes, h = 540 / N;
    this.bandes = [];
    this.add.rectangle(480, 270, 960, 540, 0x000000, 0).setInteractive();   // (les clics s'arrêtent là pendant le passage)
    for (let i = 0; i < N; i++) {
      const gauche = i % 2 === 0, y = i * h + h / 2;
      const c = this.add.container(gauche ? -490 : 1450, y);
      c.add(this.add.rectangle(0, 0, 980, h + 1, i % 2 ? 0x3b2414 : 0x4a2e1a));
      c.add(this.add.rectangle(0, -h / 2 + 2, 980, 3, 0x6a4628));             // le chant de la planche
      c.add(this.add.rectangle(gauche ? 488 : -488, 0, 6, h + 1, 0xc9a227));  // le liseré doré, du côté qui avance
      c.depart = c.x;
      this.bandes.push(c);
    }
    Son.jouer('glisse');
    this.bandes.forEach((c, i) => this.tweens.add({
      targets: c, x: 480, duration: VOLETS.fermer, delay: i * VOLETS.decalage, ease: 'Quad.easeIn',
      onComplete: () => { if (i === this.bandes.length - 1) this.passer(); },
    }));
  }

  // Les volets sont fermés : on change de scène dessous, puis on rouvre quand elle est prête
  passer() {
    const depuis = this.scene.get(this.depuis);
    const cible = this.scene.get(this.cle);
    let rouvert = false;
    const rouvrir = () => {
      if (rouvert || !this.sys.isActive()) return; rouvert = true;
      this.scene.bringToTop();
      this.time.delayedCall(60, () => this.ouvrir());
    };
    if (cible) cible.events.once('create', rouvrir);
    this.time.delayedCall(1500, rouvrir);   // (au cas où la scène suivante ne dirait rien)
    // (la scène de départ a pu être mise en pause entre-temps : on l'arrête, et on lance la suivante à côté)
    if (depuis && depuis.sys.isActive()) depuis.scene.start(this.cle, this.donnees);
    else { if (depuis && depuis.sys.isPaused()) this.scene.stop(this.depuis); this.scene.launch(this.cle, this.donnees); }
  }

  ouvrir() {
    Son.jouer('glisse');
    this.bandes.forEach((c, i) => this.tweens.add({
      targets: c, x: 960 - c.depart, duration: VOLETS.ouvrir, delay: i * VOLETS.decalage, ease: 'Quad.easeOut',
      onComplete: () => { if (i === this.bandes.length - 1) this.scene.stop(); },
    }));
  }
}

// Changer de scène derrière les volets (comme allerA, qui fond au noir)
function allerParVolets(scene, cle, donnees = {}) {
  if (scene.enPartance) return;
  if (!scene.scene.manager.getScene('Volet')) return allerA(scene, cle, donnees);
  scene.enPartance = true;
  scene.events.once('shutdown', () => { scene.enPartance = false; });
  scene.scene.launch('Volet', { depuis: scene.scene.key, cle, donnees });
  scene.scene.bringToTop('Volet');
}
