// Point d'entrée : configuration de Phaser et liste des scènes.
window.jeu = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'jeu',
  width: 960,
  height: 540,
  pixelArt: true,
  backgroundColor: '#1a120a',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [TitleScene, IntroScene, IntroHistoireScene, CounterScene, NightScene, StoryScene, FailliteScene],
});
