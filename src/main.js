// La version du jeu (affichée sur l'écran titre) : on l'augmente à chaque mise à jour publiée.
const VERSION_JEU = 'v 0.99';
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

// (v0.84) Dans Phaser, une page relancée SANS données garde celles de son lancement précédent :
// la banque ouverte le soir croyait encore venir de la rue (« Quitter » rouvrait la rue et le soir
// restait en pause : le jeu semblait figé). Chaque lancement repart de ses propres données.
const demarrerSysteme = Phaser.Scenes.Systems.prototype.start;
Phaser.Scenes.Systems.prototype.start = function (data) {
  if (data === undefined || data === null) this.settings.data = {};
  return demarrerSysteme.call(this, data);
};

// (v0.86) Une page qu'on « reprend » doit avoir été mise en pause. Sinon (elle s'est arrêtée entre-
// temps : par ex. « Dormir », puis la banque ouverte pendant le fondu), Phaser la relançait à moitié :
// une page fantôme, sans caméra, par-dessus la suivante. On ignore donc ces reprises-là.
const reprendreSysteme = Phaser.Scenes.Systems.prototype.resume;
Phaser.Scenes.Systems.prototype.resume = function (data) {
  if (this.settings.status !== Phaser.Scenes.PAUSED) return this;
  return reprendreSysteme.call(this, data);
};

// (v0.58) Le grand gel : dans Phaser, si une erreur survient pendant une image (une animation,
// un minuteur, un clic...), la boucle du jeu ne demande plus l'image suivante et tout se fige
// jusqu'au rafraîchissement de la page. On protège chaque image : l'erreur est notée (console et
// carnet de bord), et le jeu continue à l'image suivante.
// (v0.95) Le journal de bord : les dernières pages ouvertes, les boutons touchés et les erreurs, gardés
// dans le navigateur (même après un rechargement). Après un gel, on le lit dans le menu (☰ > Journal de
// bord) pour savoir où le jeu s'est arrêté.
const CLE_JOURNAL = 'passage_journal';
let journalJeu = [], journalPrecedent = [];
try { const j = JSON.parse(localStorage.getItem(CLE_JOURNAL) || 'null'); if (j && j.lignes) journalPrecedent = j.lignes; } catch (e) { /* rien */ }
let minuterieJournal = null;
function noterJournal(texte) {
  const G = window.GAME, h = G && typeof G.heure === 'number' ? `${Math.floor(G.heure)}h${String(Math.floor((G.heure % 1) * 60)).padStart(2, '0')}` : '';
  journalJeu.push(`${new Date().toLocaleTimeString('fr-FR')} · ${G ? 'jour ' + G.jour + (h ? ' ' + h : '') + ' · ' : ''}${texte}`);
  if (journalJeu.length > 60) journalJeu = journalJeu.slice(-40);
  const ecrire = () => { try { localStorage.setItem(CLE_JOURNAL, JSON.stringify({ lignes: journalJeu.slice(-40), version: VERSION_JEU })); } catch (e) { /* rien */ } };
  clearTimeout(minuterieJournal);
  // (v0.97) une erreur ou un changement de page s'écrit tout de suite : c'est ce qu'on veut lire après un gel
  if (/^ERREUR|→/.test(texte)) ecrire(); else minuterieJournal = setTimeout(ecrire, 400);
}
window.noterJournal = noterJournal;
window.addEventListener('error', e => noterJournal('ERREUR : ' + (e.message || e) + ' (' + String(e.filename || '').split('/').pop() + ':' + (e.lineno || 0) + ')'));
window.addEventListener('unhandledrejection', e => noterJournal('ERREUR : ' + ((e.reason && e.reason.message) || e.reason)));

// (v0.97) Chaque scène est protégée à part : une erreur qui revient à chaque image dans une scène ne
// bloque plus les autres scènes ni le dessin de l'image (avant, tout l'écran se figeait).
{ const etapeScene = Phaser.Scenes.Systems.prototype.step, dessinScene = Phaser.Scenes.Systems.prototype.render;
  let n = 0, dernier = '';
  const noter = (sys, e) => { n++; const msg = (e && e.message) || String(e); if (msg !== dernier || n % 300 === 1) { console.error('[jeu] erreur dans ' + sys.settings.key + ' :', e); noterJournal('ERREUR (' + sys.settings.key + ') : ' + msg + ' · ' + String((e && e.stack) || '').split('\n').slice(1, 3).map(l => l.trim().split('/').pop()).join(' < ')); } dernier = msg; };
  Phaser.Scenes.Systems.prototype.step = function (t, d) { try { return etapeScene.call(this, t, d); } catch (e) { noter(this, e); } };
  Phaser.Scenes.Systems.prototype.render = function (r) { try { return dessinScene.call(this, r); } catch (e) { noter(this, e); } }; }

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
      noterJournal('ERREUR : ' + msg + ' · ' + String((e && e.stack) || '').split('\n').slice(1, 3).map(l => l.trim().split('/').pop()).join(' < '));
      if (window.diag) diag('erreur rattrapée : ' + msg);
    }
    derniereErreurJeu = msg;
    // (le rendu de cette image a pu être interrompu au milieu : on le termine proprement)
    try { if (this.renderer && this.renderer.postRender) this.renderer.postRender(); } catch (e2) { /* rien */ }
    // (audit v0.59) une scène qui a planté dans son create() reste « en création » et Phaser
    // refuse ensuite de la relancer : on l'arrête, et l'on retombe sur l'écran titre
    try {
      const S = Phaser.Scenes;
      // (v0.97) la file des démarrages n'est vidée par Phaser qu'une fois tout lancé : sans ça, la scène
      // fautive était relancée à chaque image, sans fin
      const sm = this.scene;
      if (sm._queue) sm._queue.length = 0; if (sm._pending) sm._pending.length = 0; if (sm._start) sm._start.length = 0; sm.isProcessing = false;
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
  scene: [TitleScene, IntroScene, IntroHistoireScene, CounterScene, NightScene, StoryScene, FailliteScene, ExpressScene, BanqueScene, MarcheScene, AtelierScene, BureauScene, CarteScene, DodoScene, FacadeScene, ArriereScene, RenovationScene, PromenadeScene, MarcheNoirScene, RueScene, NympheScene, ForgeScene, CarrefourScene, SaisonScene, TirArcScene, HudScene],
});
  // La musique et les sons : le son démarre au premier clic (les navigateurs l'exigent), et
  // chaque scène qui s'ouvre lance son ambiance.
  window.jeu.events.once('ready', () => {
    // (v0.84) les curseurs du jeu (planche validée : la flèche de bois et d'or, et la main gantée)
    // à la place de la flèche et de la main du système, partout
    try {
      const fleche = cssCurseur('fleche'), main = cssCurseur('main', 'pointer');
      const im = window.jeu.input;
      im.setDefaultCursor(fleche);
      const poserCurseur = im.setCursor;
      im.setCursor = function (objet) {
        if (objet && objet.cursor === 'pointer') { objet.cursor = main; }
        return poserCurseur.call(this, objet);
      };
    } catch (e) { console.warn('curseurs', e); }
    if (window.diag) {
      diag('prêt');
      // chaque écran ouvert est noté ; après 20 secondes sans plantage, le lancement est réussi
      for (const s of window.jeu.scene.scenes) s.events.on('create', () => diag('écran ' + s.scene.key));
      setTimeout(() => { window.jeu.diagStable = true; if (window.diagFini) diagFini(); }, 20000);
    }
    for (const s of window.jeu.scene.scenes) {
      const theme = THEME_PAR_SCENE[s.scene.key];
      if (!theme) continue;
      // (v0.84) une page peut choisir sa musique elle-même (le récit d'un héros mort : la musique
      // triste) : `s.musiqueVoulue` passe avant celle de la page
      s.events.on('create', () => Son.ambiance(s.musiqueVoulue || theme));
      // (v0.84) une page qui s'ouvre par-dessus (banque, Express, forge...) change la musique : en la
      // refermant, la page d'en dessous reprend la sienne
      s.events.on('resume', () => Son.ambiance(s.musiqueVoulue || theme));
      s.events.on('wake', () => Son.ambiance(s.musiqueVoulue || theme));
      if (s.scene.isActive()) Son.ambiance(theme);   // (l'écran titre est déjà ouvert)
    }
    // Un petit son de passage quand on change de lieu (façon Pokémon) : une porte qui s'ouvre
    // à l'intérieur, l'air du dehors quand on sort
    const DEHORS = new Set(['Marche', 'Facade', 'Carte', 'Rue', 'Nymphe']);
    const SANS_PASSAGE = new Set(['Titre', 'Intro', 'IntroHistoire', 'Recit', 'Faillite', 'Renovation', 'Hud']);
    // (v0.95) le journal de bord : chaque page ouverte, mise en pause, reprise, fermée
    for (const s of window.jeu.scene.scenes) {
      if (s.scene.key === 'Hud') continue;
      s.events.on('create', () => noterJournal('→ ' + s.scene.key));
      s.events.on('pause', () => noterJournal('⏸ ' + s.scene.key));
      s.events.on('resume', () => noterJournal('▶ ' + s.scene.key));
      s.events.on('shutdown', () => noterJournal('✕ ' + s.scene.key));
    }
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
    // (v0.95) Le temps de jeu, écrit sur les sauvegardes : il ne compte que la page visible, hors écran
    // titre, et pas quand personne n'a touché au jeu depuis cinq minutes
    let dernierGeste = Date.now();
    for (const ev of ['pointerdown', 'keydown', 'touchstart']) document.addEventListener(ev, () => { dernierGeste = Date.now(); }, true);
    setInterval(() => {
      const G = window.GAME;
      if (!G || document.hidden || Date.now() - dernierGeste > 5 * 60 * 1000) return;
      if (window.jeu.scene.isActive('Titre')) return;
      G.tempsJeu = (G.tempsJeu || 0) + 5;
    }, 5000);
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
