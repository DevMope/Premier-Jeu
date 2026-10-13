// La version du jeu (affichée sur l'écran titre) : on l'augmente à chaque mise à jour publiée.
const VERSION_JEU = 'v 0.33';
// Point d'entrée : configuration de Phaser et liste des scènes.

// Le jeu est en pixel art (pixels nets), mais les textes doivent rester lisses et lisibles :
// leurs textures sont lissées, même agrandies sur un grand écran.
const majTexteOrigine = Phaser.GameObjects.Text.prototype.updateText;
Phaser.GameObjects.Text.prototype.updateText = function () {
  const r = majTexteOrigine.apply(this, arguments);
  if (this.texture && this.texture.setFilter) this.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
  return r;
};

// Le jeu est pensé en 960 × 540, mais on le dessine deux fois plus fin (1920 × 1080) :
// sur un iPad ou un grand écran, les textes ne sont plus agrandis (et flous), ils sont nets.
// La caméra principale de chaque scène est zoomée d'autant, depuis le coin en haut à gauche,
// si bien que toutes les coordonnées du jeu restent en 960 × 540.
// (Sur un petit écran sans haute densité, inutile : on reste en 960 × 540, plus léger.)
const ZOOM_ECRAN = Math.min(2, Math.max(1, Math.round((window.devicePixelRatio || 1) * Math.min(window.innerWidth / 960, window.innerHeight / 540))));
const ajouterCameraOrigine = Phaser.Cameras.Scene2D.CameraManager.prototype.add;
Phaser.Cameras.Scene2D.CameraManager.prototype.add = function () {
  const camera = ajouterCameraOrigine.apply(this, arguments);
  if (this.cameras.length === 1) camera.setOrigin(0, 0).setZoom(ZOOM_ECRAN);
  return camera;
};

let jeuLance = false;
function lancerJeu() {
  if (jeuLance) return;
  jeuLance = true;
  window.jeu = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'jeu',
  width: 960 * ZOOM_ECRAN,
  height: 540 * ZOOM_ECRAN,
  pixelArt: true,
  // Même si l'appareil rame, le temps du jeu avance au vrai rythme (sinon les animations
  // semblent figées et la partie ne progresse plus).
  fps: { min: 1, smoothStep: false },
  backgroundColor: '#1a120a',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [TitleScene, IntroScene, IntroHistoireScene, CounterScene, NightScene, StoryScene, FailliteScene, ExpressScene, BanqueScene, MarcheScene, AtelierScene, BureauScene, CarteScene, DodoScene, FacadeScene, ArriereScene, RenovationScene, HudScene],
});
}

// On attend la police (au plus 2,5 secondes), sinon on démarre avec Georgia.
const policePrete = document.fonts && document.fonts.load
  ? Promise.all(['500 16px', '800 16px', 'italic 500 16px', 'italic 800 16px', 'bold 16px'].map(f => document.fonts.load(f + ' "Alegreya"')))
  : Promise.resolve();
Promise.race([policePrete, new Promise(r => setTimeout(r, 2500))]).catch(() => {}).then(lancerJeu);
