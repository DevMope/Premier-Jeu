// (v1.01, lot B-3b, vision validée par le joueur) L'hydromel noir de la Nuit des Brumes : JeuneGoy, ivre, revoit
// des bribes de son enfance. Une cuisine qui sent la cannelle, sa mère aux mains pleines de farine ; son père qui
// le hisse sur ses épaules pour voir les lanternes ; la médaille qu'on lui passe autour du cou ; puis le ciel
// devient orange, une ombre immense passe, et le feu du dragon dévore tout. Il rouvre les yeux près du grand feu.
// Les visages des parents restent noyés de lumière : le souvenir ne les rend pas (le sort d'oubli).
// Un clic à chaque image (pas d'enchaînement automatique). Le joueur ne parle jamais.
class VisionScene extends Phaser.Scene {
  constructor() { super('Vision'); }
  init(data) { this.retour = (data && data.retour) || 'MarcheNoir'; this.etape = 0; this.objets = []; this.occupe = false; }

  create() {
    const G = this.G = window.GAME;
    creerHalo(this); creerIconesHD(this);
    this.cameras.main.setBackgroundColor('#140a06');
    // JeuneGoy enfant (le stade « petit » de son apparence)
    this.enfant = 'joueur_vision_enfant';
    if (!this.textures.exists(this.enfant)) dessinerJoueurHD(G.joueur.apparence, 'petit', G.joueur.feminin, 0, [], 'troisQuarts').texture(this, this.enfant);
    this.enfantDos = 'joueur_vision_enfant_dos';   // (de dos, les bras levés vers les lanternes)
    if (!this.textures.exists(this.enfantDos)) dessinerJoueurHD(G.joueur.apparence, 'petit', G.joueur.feminin, 0, [], 'dos', 'leves').texture(this, this.enfantDos);
    // le voile du rêve : des bords dorés qui respirent
    this.voile = this.add.graphics().setDepth(50);
    for (let k = 0; k < 10; k++) this.voile.lineStyle(26, 0xffe0a0, 0.05 + k * 0.012).strokeRect(-k * 13, -k * 13, 960 + k * 26, 540 + k * 26);
    this.voile.setAlpha(0.9);
    this.tweens.add({ targets: this.voile, alpha: 0.5, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.ligne = this.add.text(480, 62, '', style(18, '#fff4dc', { fontStyle: 'italic', align: 'center', stroke: '#1a0e06', strokeThickness: 5, wordWrap: { width: 820 } })).setOrigin(0.5).setDepth(60);
    this.indice = this.add.text(940, 525, '', style(12, '#fff4dc', { fontStyle: 'italic', stroke: '#1a0e06', strokeThickness: 3 })).setOrigin(1, 0.5).setDepth(60);
    this.input.on('pointerdown', () => { if (!this.occupe) this.suivante(); });
    this.cameras.main.fadeIn(1600, 255, 220, 160);
    this.suivante();
  }

  vider() { this.objets.forEach(o => { this.tweens.killTweensOf(o); o.destroy(); }); this.objets = []; }
  o(x) { this.objets.push(x); return x; }
  // un parent : un corps chaud, le visage perdu dans une lumière
  parent(x, y, feminin, echelle, flip = false, vue = 'troisQuarts') {
    const qui = { nom: feminin ? 'Ta mère' : 'Ton père', race: 'humain', feminin, niveau: 'novice', peau: 1 };
    const cle = corpsHD(this, qui, null, vue);
    const p = this.o(this.add.image(x, y, cle).setOrigin(0.5, 1).setScale(echelle * echelleCorps(cle)).setFlipX(flip).setTint(0xffe0c0));
    const tete = this.o(this.add.image(x, y - p.displayHeight * 0.86, 'halo').setScale(echelle * 0.11).setTint(0xfff4d0).setAlpha(vue === 'dos' ? 0.35 : 0.95).setBlendMode(Phaser.BlendModes.ADD));
    this.tweens.add({ targets: tete, alpha: 0.75, duration: 900, yoyo: true, repeat: -1 });
    this.tweens.add({ targets: p, y: y - 3, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return p;
  }
  dire(t) { this.ligne.setText(t).setAlpha(0); this.tweens.add({ targets: this.ligne, alpha: 1, duration: 900 }); }

  suivante() {
    this.etape++;
    this.vider();
    this.indice.setText('▶ clique pour continuer');
    const g = this.o(this.add.graphics());
    if (this.etape === 1) {
      // la cuisine qui sent la cannelle : le mur chaud, les poutres, le four, la table des gâteaux
      g.fillStyle(0xa8643a).fillRect(0, 0, 960, 540); g.fillStyle(0x8a4a24).fillRect(0, 470, 960, 70);
      for (const x of [0, 240, 480, 720]) g.fillStyle(0x5a3018).fillRect(x, 0, 240, 18).fillStyle(0x6a3a1c).fillRect(x + 110, 18, 18, 452);
      g.fillStyle(0x4a2814).fillRect(620, 150, 260, 320); g.fillStyle(0x2a1408).fillRoundedRect(660, 290, 180, 120, { tl: 60, tr: 60, bl: 0, br: 0 }); g.fillStyle(0xff8a30).fillRoundedRect(676, 306, 148, 104, { tl: 50, tr: 50, bl: 0, br: 0 });   // le four
      const four = this.o(this.add.image(750, 360, 'halo').setScale(3.4).setTint(0xff9a40).setAlpha(0.55).setBlendMode(Phaser.BlendModes.ADD));
      this.tweens.add({ targets: four, alpha: 0.35, duration: 700, yoyo: true, repeat: -1 });
      g.fillStyle(0x3a2010).fillRect(120, 352, 440, 16).fillStyle(0x5a3418).fillRect(120, 346, 440, 10).fillStyle(0x3a2010).fillRect(140, 368, 18, 102).fillRect(522, 368, 18, 102);   // la table
      for (const x of [220, 330, 440]) { g.fillStyle(0xc88a40).fillEllipse(x, 340, 84, 24); g.fillStyle(0xe8b060).fillEllipse(x, 333, 72, 15); g.fillStyle(0xa0281e); for (let k = 0; k < 5; k++) g.fillCircle(x - 24 + k * 12, 332, 3); }
      for (const [x, y] of [[180, 230], [250, 210], [320, 236]]) { g.fillStyle(0x6a8a3a).fillCircle(x, y, 7); g.lineStyle(2, 0x5a3018).lineBetween(x, y - 7, x, y - 30); }   // des herbes qui sèchent
      for (let k = 0; k < 22; k++) { const f = this.o(this.add.rectangle(380 + Math.random() * 180, 230 + Math.random() * 100, 2, 2, 0xffffff, 0.85)); this.tweens.add({ targets: f, y: f.y - 40, alpha: 0, duration: 1600 + Math.random() * 1200, repeat: -1 }); }   // la farine qui vole
      this.parent(470, 470, true, 11, true);
      const e = this.o(this.add.image(250, 470, this.enfant).setOrigin(0.5, 1).setScale(echelleJoueur(8)));
      this.tweens.add({ targets: e, x: 222, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });   // il chipe un gâteau et recule
      this.dire("Une cuisine qui sent la cannelle. Une femme aux mains pleines de farine éclate de rire :\n« Doucement, petit voleur, ce sont les gâteaux du Solstice ! »");
    } else if (this.etape === 2) {
      // sur les épaules de son père, les lanternes au-dessus des toits
      g.fillStyle(0x141a3a).fillRect(0, 0, 960, 540);
      for (let k = 0; k < 60; k++) g.fillStyle(0xfff4d0, Math.random() * 0.8).fillRect(Math.random() * 960, Math.random() * 300, 2, 2);
      g.fillStyle(0x1a1420); for (const [x, w, h] of [[0, 220, 170], [200, 180, 210], [360, 240, 150], [580, 200, 200], [760, 200, 170]]) { g.fillRect(x, 540 - h - 110, w, h + 110); g.fillTriangle(x - 10, 540 - h - 110, x + w + 10, 540 - h - 110, x + w / 2, 540 - h - 190); }
      for (let k = 0; k < 24; k++) {
        const l = this.o(this.add.container(60 + Math.random() * 840, 330 + Math.random() * 120));
        l.add([this.add.image(0, 0, 'halo').setScale(0.4).setTint(0xffa040).setAlpha(0.6).setBlendMode(Phaser.BlendModes.ADD), this.add.rectangle(0, 0, 10, 12, 0xf8c070)]);
        this.tweens.add({ targets: l, y: l.y - 360, duration: 9000 + Math.random() * 5000, ease: 'Sine.easeIn' });
      }
      const pere = this.parent(480, 600, false, 13, false, 'dos');
      const e = this.o(this.add.image(480, 600 - pere.displayHeight * 0.8, this.enfantDos).setOrigin(0.5, 1).setScale(echelleJoueur(8)));
      this.tweens.add({ targets: e, y: e.y - 4, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.dire("Un homme te hisse sur ses épaules. Au loin, des lanternes montent au-dessus des toits :\n« Regarde, elles vont dire bonjour aux étoiles. »");
    } else if (this.etape === 3) {
      // la médaille
      g.fillStyle(0x3a2014).fillRect(0, 0, 960, 540);
      this.o(this.add.image(480, 230, 'halo').setScale(4).setTint(0xffd080).setAlpha(0.4).setBlendMode(Phaser.BlendModes.ADD));
      const m = this.o(this.add.image(480, 230, texMedailleParents(this)).setScale(6));
      this.tweens.add({ targets: m, angle: { from: -5, to: 5 }, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      for (const sens of [-1, 1]) { const main = this.o(this.add.graphics()); main.fillStyle(0xe8b890).fillEllipse(480 + sens * 90, 150, 50, 34).fillRect(480 + sens * 90 - (sens > 0 ? 0 : 60), 140, 60, 20); this.tweens.add({ targets: main, y: 6, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }); }
      this.dire("Ta mère te passe une médaille autour du cou :\n« Elle te gardera, quand nous ne serons pas là. »");
    } else if (this.etape === 4) {
      // le ciel devient orange, l'ombre passe, le feu dévore tout
      this.occupe = true; this.indice.setText('');
      g.fillStyle(0x8a4a24).fillRect(0, 0, 960, 540);
      this.parent(580, 500, true, 10, true); this.parent(380, 500, false, 10.5);
      const ciel = this.o(this.add.rectangle(480, 270, 960, 540, 0xff7a20, 0).setDepth(5));
      this.tweens.add({ targets: ciel, fillAlpha: 0.55, duration: 1400 });
      // l'ombre immense des ailes
      const ombre = this.o(this.add.graphics().setDepth(6));
      ombre.fillStyle(0x0a0404, 0.85).fillTriangle(0, 0, 420, 40, 200, 160).fillTriangle(420, 40, 840, 0, 640, 160).fillEllipse(420, 60, 220, 70).fillTriangle(560, 40, 760, 20, 700, 80);
      ombre.setPosition(-900, -40);
      this.tweens.add({ targets: ombre, x: 1100, duration: 2600, delay: 900, ease: 'Sine.easeInOut' });
      Son.jouer('vent', { duree: 3 });
      this.time.delayedCall(2600, () => {
        this.cameras.main.shake(1400, 0.012); Son.jouer('feu');
        for (let k = 0; k < 40; k++) { const f = this.o(this.add.image(Math.random() * 960, 560, 'halo').setScale(1 + Math.random() * 2).setTint(Phaser.Utils.Array.GetRandom([0xff4010, 0xff8a20, 0xffc040])).setAlpha(0.8).setBlendMode(Phaser.BlendModes.ADD).setDepth(7)); this.tweens.add({ targets: f, y: -80 - Math.random() * 200, duration: 1400 + Math.random() * 900, delay: Math.random() * 600 }); }
        this.time.delayedCall(1600, () => { const blanc = this.o(this.add.rectangle(480, 270, 960, 540, 0xfff0d0, 0).setDepth(8)); this.tweens.add({ targets: blanc, fillAlpha: 1, duration: 900, onComplete: () => { this.occupe = false; this.indice.setText('▶ clique pour continuer'); } }); });
      });
      this.dire("Le ciel devient orange. Une ombre immense passe sur le village...\net le feu du dragon dévore la cuisine, les rires, les visages.");
    } else if (this.etape === 5) {
      // il rouvre les yeux, près du grand feu
      g.fillStyle(0x1a0c08).fillRect(0, 0, 960, 540);
      this.o(this.add.image(480, 540, 'halo').setScale(7, 4).setTint(0xff7a20).setAlpha(0.45).setBlendMode(Phaser.BlendModes.ADD));
      for (let k = 0; k < 8; k++) { const l = this.o(this.add.graphics()); l.fillStyle(0xc81e18).fillEllipse(60 + k * 120, 14 + (k % 2) * 8, 30, 26); }
      const orc = this.o(this.add.image(330, 540, textureBusteHD(this, { nom: 'Vieux Grôm', race: 'orc', vieux: true }, 'content')).setOrigin(0.5, 1).setScale(2.2).setAngle(5));
      const gob = this.o(this.add.image(640, 540, textureBusteHD(this, { nom: 'Mémé Pikka', race: 'gobelin', feminin: true, vieux: true }, 'content')).setOrigin(0.5, 1).setScale(2.2).setAngle(-5).setFlipX(true));
      this.tweens.add({ targets: orc, y: 532, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: gob, y: 534, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 300 });
      this.cameras.main.fadeIn(1200, 255, 240, 210);
      this.dire("Tu rouvres les yeux près du grand feu. Un vieil orc et une vieille gobeline sont penchés sur toi.\n« Ça va, petit ? » · « Encore une coupe ? Cette boisson-là, c'est que pour les vrais ! »");
    } else {
      this.occupe = true;
      this.cameras.main.fadeOut(900);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(this.retour));
    }
  }
}
