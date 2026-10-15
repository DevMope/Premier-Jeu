// La version du jeu (affichée sur l'écran titre) : on l'augmente à chaque mise à jour publiée.
const VERSION_JEU = 'v 0.69';
// Point d'entrée : configuration de Phaser et liste des scènes.

// Le jeu est en pixel art (pixels nets), mais les textes doivent rester lisses et lisibles :
// leurs textures sont lissées, même agrandies sur un grand écran.
const majTexteOrigine = Phaser.GameObjects.Text.prototype.updateText;
Phaser.GameObjects.Text.prototype.updateText = function () {
  // (v0.58) un texte déjà détruit (son écran fermé entre-temps) : on ne fait rien, au lieu de planter
  if (!this.frame || !this.scene) return this;
  const r = majTexteOrigine.apply(this, arguments);
  if (this.texture && this.texture.setFilter) this.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
  return r;
};

// Le jeu est pensé en 960 × 540, mais on le dessine deux fois plus fin (1920 × 1080) :
// sur un iPad ou un grand écran, les textes ne sont plus agrandis (et flous), ils sont nets.
// La caméra principale de chaque scène est zoomée d'autant, depuis le coin en haut à gauche,
// si bien que toutes les coordonnées du jeu restent en 960 × 540.
// On vise la taille maximale à laquelle le jeu pourra être affiché sur cet écran (plein écran
// compris), en pixels réels : 1 sur un petit écran, 2 en 1080p, 3 sur iPad/iPhone, 4 en 4K.
// (Réglage validé à la v0.34 : un rendu à la taille « exacte » de l'écran rendait les textes flous.)
const ZOOM_ECRAN = (() => {
  const dpr = window.devicePixelRatio || 1;
  const l = Math.max(window.innerWidth, (window.screen && window.screen.width) || 0);
  const h = Math.max(window.innerHeight, (window.screen && window.screen.height) || 0);
  const ideal = dpr * Math.min(Math.max(l, h) / 960, Math.min(l, h) / 540);
  // (sur un téléphone, au plus 2 : l'écran est petit, et sa mémoire aussi)
  const telephone = Math.min((window.screen && window.screen.width) || 9999, (window.screen && window.screen.height) || 9999) < 500;
  return Math.min(telephone ? 2 : 4, Math.max(1, Math.ceil(ideal - 0.15)));
})();
const ajouterCameraOrigine = Phaser.Cameras.Scene2D.CameraManager.prototype.add;
Phaser.Cameras.Scene2D.CameraManager.prototype.add = function () {
  const camera = ajouterCameraOrigine.apply(this, arguments);
  if (this.cameras.length === 1) camera.setOrigin(0, 0).setZoom(ZOOM_ECRAN);
  return camera;
};

// (v0.58) De même pour une image ou un sprite déjà détruits dont on change la texture
for (const Classe of [Phaser.GameObjects.Image, Phaser.GameObjects.Sprite]) {
  const changerOrigine = Classe.prototype.setTexture;
  Classe.prototype.setTexture = function () { return this.scene ? changerOrigine.apply(this, arguments) : this; };
}

// (v0.58) Le grand gel : dans Phaser, si une erreur survient pendant une image (une animation,
// un minuteur, un clic...), la boucle du jeu ne demande plus l'image suivante et tout se fige
// jusqu'au rafraîchissement de la page. On protège chaque image : l'erreur est notée (console et
// carnet de bord), et le jeu continue à l'image suivante.
const etapeJeuOrigine = Phaser.Game.prototype.step;
let erreursJeu = 0, derniereErreurJeu = '';
Phaser.Game.prototype.step = function (temps, delta) {
  try {
    etapeJeuOrigine.call(this, temps, delta);
  } catch (e) {
    erreursJeu++;
    const msg = (e && e.message) || String(e);
    if (msg !== derniereErreurJeu || erreursJeu % 300 === 1) {
      console.error('[jeu] erreur rattrapée :', e);
      if (window.diag) diag('erreur rattrapée : ' + msg);
    }
    derniereErreurJeu = msg;
    // (le rendu de cette image a pu être interrompu au milieu : on le termine proprement)
    try { if (this.renderer && this.renderer.postRender) this.renderer.postRender(); } catch (e2) { /* rien */ }
    // (audit v0.59) une scène qui a planté dans son create() reste « en création » et Phaser
    // refuse ensuite de la relancer : on l'arrête, et l'on retombe sur l'écran titre
    try {
      const S = Phaser.Scenes;
      for (const sc of this.scene.scenes) {
        if (sc.sys.settings.status === S.CREATING) {
          this.scene.stop(sc.sys.settings.key);
          if (window.diag) diag('scène arrêtée après une erreur : ' + sc.sys.settings.key);
          if (sc.sys.settings.key !== 'Titre') this.scene.start('Titre');
        }
      }
    } catch (e3) { /* rien */ }
  }
};

let jeuLance = false;
function lancerJeu() {
  if (jeuLance) return;
  jeuLance = true;
  if (window.diag) diag('phaser (zoom ' + ZOOM_ECRAN + ')');
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
  scene: [TitleScene, IntroScene, IntroHistoireScene, CounterScene, NightScene, StoryScene, FailliteScene, ExpressScene, BanqueScene, MarcheScene, AtelierScene, BureauScene, CarteScene, DodoScene, FacadeScene, ArriereScene, RenovationScene, PromenadeScene, MarcheNoirScene, RueScene, NympheScene, HudScene],
});
  // La musique et les sons : le son démarre au premier clic (les navigateurs l'exigent), et
  // chaque scène qui s'ouvre lance son ambiance.
  window.jeu.events.once('ready', () => {
    if (window.diag) {
      diag('prêt');
      // chaque écran ouvert est noté ; après 20 secondes sans plantage, le lancement est réussi
      for (const s of window.jeu.scene.scenes) s.events.on('create', () => diag('écran ' + s.scene.key));
      setTimeout(() => { window.jeu.diagStable = true; if (window.diagFini) diagFini(); }, 20000);
    }
    for (const s of window.jeu.scene.scenes) {
      const theme = THEME_PAR_SCENE[s.scene.key];
      if (!theme) continue;
      s.events.on('create', () => Son.ambiance(theme));
      if (s.scene.isActive()) Son.ambiance(theme);   // (l'écran titre est déjà ouvert)
    }
    // Un petit son de passage quand on change de lieu (façon Pokémon) : une porte qui s'ouvre
    // à l'intérieur, l'air du dehors quand on sort
    const DEHORS = new Set(['Marche', 'Facade', 'Carte', 'Rue', 'Nymphe']);
    const SANS_PASSAGE = new Set(['Titre', 'Intro', 'IntroHistoire', 'Recit', 'Faillite', 'Renovation', 'Hud']);
    for (const s of window.jeu.scene.scenes) {
      if (SANS_PASSAGE.has(s.scene.key)) continue;
      s.events.on('create', () => Son.jouer(DEHORS.has(s.scene.key) ? 'passageDehors' : 'passage'));
    }
    const reveil = () => { Son.demarrer(); Son.reprendre(); };
    // (Safari sur iPad n'accepte de lancer le son que sur la fin d'un toucher ou un clic, pas sur
    // son début : on écoute tout, sur toute la page, et à chaque fois tant qu'il n'est pas lancé)
    for (const ev of ['pointerdown', 'pointerup', 'touchstart', 'touchend', 'mousedown', 'click', 'keydown']) document.addEventListener(ev, reveil, true);
    // Revenu sur le jeu après une mise en veille ou un autre onglet : le son repart au prochain geste
    document.addEventListener('visibilitychange', () => { if (!document.hidden) Son.reprendre(); });
  });
}

// On attend la police (au plus 2,5 secondes), sinon on démarre avec Georgia.
const policePrete = document.fonts && document.fonts.load
  ? Promise.all(['500 16px', '800 16px', 'italic 500 16px', 'italic 800 16px', 'bold 16px'].map(f => document.fonts.load(f + ' "Alegreya"')))
  : Promise.resolve();
Promise.race([policePrete, new Promise(r => setTimeout(r, 2500))]).catch(() => {}).then(lancerJeu);

// (v0.62) Garde-fou : certaines scènes ne vivent jamais ensemble (la nuit d'un côté ; la carte et le
// comptoir de l'autre ; le dodo seul). Si l'une démarre alors qu'une autre est restée coincée
// derrière (active ou en pause), on arrête la coincée tout de suite : sinon, deux journées se
// mélangent et le jeu peut se figer.
function exclureScenes(scene, ...cles) {
  const gestion = scene.scene.manager;
  for (const cle of cles) {
    if (cle === scene.scene.key) continue;
    const s = gestion.getScene(cle);
    if (s && (s.scene.isActive() || s.scene.isPaused())) gestion.stop(cle);
  }
}
