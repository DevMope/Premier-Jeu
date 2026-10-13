// Point d'entrée : configuration de Phaser et liste des scènes.

// Le jeu est en pixel art (pixels nets), mais les textes doivent rester lisses et lisibles :
// leurs textures sont lissées, même agrandies sur un grand écran.
const majTexteOrigine = Phaser.GameObjects.Text.prototype.updateText;
Phaser.GameObjects.Text.prototype.updateText = function () {
  const r = majTexteOrigine.apply(this, arguments);
  if (this.texture && this.texture.setFilter) this.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
  return r;
};

let jeuLance = false;
function lancerJeu() {
  if (jeuLance) return;
  jeuLance = true;
  window.jeu = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'jeu',
  width: 960,
  height: 540,
  pixelArt: true,
  backgroundColor: '#1a120a',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [TitleScene, IntroScene, IntroHistoireScene, CounterScene, NightScene, StoryScene, FailliteScene, ExpressScene, BanqueScene, MarcheScene, AtelierScene, BureauScene, CarteScene, DodoScene, FacadeScene, ArriereScene, RenovationScene],
});
}

// On attend la police (au plus 2,5 secondes), sinon on démarre avec Georgia.
const policePrete = document.fonts && document.fonts.load
  ? Promise.all([document.fonts.load('16px "Alegreya"'), document.fonts.load('bold 16px "Alegreya"'), document.fonts.load('italic 16px "Alegreya"')])
  : Promise.resolve();
Promise.race([policePrete, new Promise(r => setTimeout(r, 2500))]).catch(() => {}).then(lancerJeu);
