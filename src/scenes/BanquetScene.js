// (v1.05, lot B-3c, planche 35) Le banquet du Long Hiver : le soir du grand jour, avant d'aller dormir, tout le
// village s'attable sous le grand sapin illuminé de la place. Garrick arrive dans la neige et lève sa chope ;
// un voisin glisse un petit cadeau près de ton assiette. Un clic pour chaque moment (pas d'enchaînement
// automatique) ; demain matin, tu te réveilles en pleine forme.
class BanquetScene extends Phaser.Scene {
  constructor() { super('Banquet'); }

  init(data) {
    this.suite = (data && data.suite) || 'Dodo';
    this.donnees = (data && data.donnees) || {};
    this.etape = 0; this.occupe = false; this.fini = false;
  }

  create() {
    const G = this.G = window.GAME;
    creerHalo(this); creerIconesHD(this);
    this.cameras.main.fadeIn(900);
    // la nuit d'hiver sur la Comté, les toits enneigés autour de la place
    this.add.image(0, 0, paysageHD(this, 960, 540, 'comte', 1)).setOrigin(0).setDisplaySize(960, 360);
    const g = this.add.graphics();
    for (const [x, w, h] of [[-20, 170, 120], [130, 130, 96], [640, 150, 104], [790, 190, 128]]) {
      const y = 330 - h;
      g.fillStyle(0x2a2030).fillRect(x, y, w, h); g.fillStyle(0x3a2a2a).fillTriangle(x - 10, y, x + w + 10, y, x + w / 2, y - 46);
      g.fillStyle(0xeef4fa).fillTriangle(x - 10, y + 2, x + w + 10, y + 2, x + w / 2, y - 44).fillStyle(0x3a2a2a).fillTriangle(x + 6, y + 2, x + w - 6, y + 2, x + w / 2, y - 34);
      for (let k = 0; k < Math.floor(w / 50); k++) { const fx = x + 20 + k * 50; g.fillStyle(0xffc860).fillRect(fx, y + 30, 18, 22); const l = this.add.image(fx + 9, y + 41, 'halo').setScale(0.35).setTint(0xffb040).setAlpha(0.4).setBlendMode(Phaser.BlendModes.ADD); this.tweens.add({ targets: l, alpha: 0.25, duration: 1200 + k * 300, yoyo: true, repeat: -1 }); }
    }
    g.fillStyle(0xdfe6f0).fillRect(0, 330, 960, 210);
    for (let k = 0; k < 30; k++) g.fillStyle(0xf8fbff).fillEllipse((k * 137) % 960, 340 + ((k * 53) % 180), 40 + (k % 4) * 12, 6);
    // le grand sapin illuminé, au milieu de la place
    const sapin = grandSapin(this, 480, 340, 300, { nuit: true, u: 3 });
    for (const [x, y, col] of sapin.lueurs) { const l = this.add.image(x, y, 'halo').setScale(0.16).setTint(col).setAlpha(0.7).setBlendMode(Phaser.BlendModes.ADD); this.tweens.add({ targets: l, alpha: 0.25, duration: 500 + Math.random() * 900, yoyo: true, repeat: -1 }); }
    const haloE = this.add.image(480, sapin.haut + 8, 'halo').setScale(1.1).setTint(0xffe080).setAlpha(0.45).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: haloE, alpha: 0.2, scale: 0.9, duration: 900, yoyo: true, repeat: -1 });
    this.tweens.add({ targets: sapin.etoile, scale: 1.2, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    // des guirlandes de lampions, du sapin aux maisons
    for (const [x0, x1] of [[0, 470], [490, 960]]) {
      const fil = this.add.graphics(); fil.lineStyle(1, 0x2a1a10);
      const yy = x => 120 + Math.sin((x - x0) / (x1 - x0) * Math.PI) * 40 + (x0 === 0 ? (470 - x) * 0.12 : (x - 490) * 0.12);
      fil.beginPath(); fil.moveTo(x0, yy(x0)); for (let x = x0; x <= x1; x += 8) fil.lineTo(x, yy(x)); fil.strokePath();
      for (let x = x0 + 30; x < x1; x += 60) { const l = this.add.image(x, yy(x) + 6, 'halo').setScale(0.22).setTint(0xffa040).setAlpha(0.8).setBlendMode(Phaser.BlendModes.ADD); this.add.rectangle(x, yy(x) + 6, 8, 10, 0xf8c070); this.tweens.add({ targets: l, alpha: 0.4, duration: 700 + (x % 5) * 150, yoyo: true, repeat: -1 }); }
    }
    // les voisins attablés (on ne les voit qu'à partir de la taille : la nappe cache le reste)
    const convives = [[150, { nom: 'Rosalie', race: 'hobbit', feminin: true, niveau: 'aguerri' }], [240, { nom: 'Thorgal le Forgeron', race: 'nain', niveau: 'aguerri' }],
      [330, { nom: 'Mère Sauge', race: 'magicienne', feminin: true, niveau: 'aguerri' }], [630, { nom: 'Firmin', race: 'humain', niveau: 'aguerri' }],
      [720, { nom: 'Marcelline', race: 'humain', feminin: true, niveau: 'aguerri' }], [810, 'givrin']];
    this.convives = convives.map(([x, qui], k) => {
      const im = this.add.image(x, 486, corpsHD(this, qui, null, 'face')).setOrigin(0.5, 1).setScale(9 * echelleCorps(corpsHD(this, qui, null, 'face'))).setDepth(2);
      im.qui = qui;
      this.tweens.add({ targets: im, y: 482, duration: 600 + k * 70, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: k * 130 });
      return im;
    });
    // JeuneGoy, attablé au milieu, juste devant le sapin
    this.joueur = this.add.image(470, 486, textureJoueur(this, G, 'face')).setOrigin(0.5, 1).setScale(echelleJoueur(9)).setDepth(2);
    this.tweens.add({ targets: this.joueur, y: 483, duration: 760, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    // la longue table, sa nappe blanche, les plats, les chopes et les bougies
    const t = this.add.graphics().setDepth(3);
    t.fillStyle(0x3a2410).fillRect(90, 436, 780, 10); t.fillStyle(0xf4f0e6).fillRect(84, 430, 792, 12);
    t.fillStyle(0xe8e2d4).fillRect(84, 442, 792, 64); for (let x = 84; x < 876; x += 24) t.fillStyle(0xd8d0c0).fillRect(x, 444, 2, 62);
    t.fillStyle(0xc02a2a).fillRect(84, 448, 792, 6);   // (le chemin de table rouge)
    const plats = this.add.graphics().setDepth(3);
    plats.fillStyle(0xd8d0c0).fillEllipse(552, 432, 90, 14).fillStyle(0xa8642a).fillEllipse(552, 424, 58, 20).fillStyle(0xc88440).fillEllipse(548, 419, 32, 9);   // la volaille rôtie
    for (const x of [200, 390, 760]) { plats.fillStyle(0xc8904a).fillEllipse(x, 426, 40, 14).fillStyle(0xe0b070).fillEllipse(x - 4, 423, 22, 6); }   // le pain
    for (const x of [280, 680]) { plats.fillStyle(0xc88a40).fillEllipse(x, 428, 46, 12).fillStyle(0x8a1e3a).fillEllipse(x, 424, 38, 7); }   // les tartes aux fruits rouges
    for (const x of [150, 240, 330, 470, 630, 720, 810]) { plats.fillStyle(0x8a5a2a).fillRect(x + 14, 414, 12, 16).fillStyle(0xf4f0e6).fillRect(x + 14, 412, 12, 4); }   // les chopes
    for (const x of [110, 410, 600, 850]) {
      plats.fillStyle(0xf4f0e0).fillRect(x, 406, 6, 22); plats.fillStyle(0xffc040).fillTriangle(x - 1, 406, x + 7, 406, x + 3, 396);
      const l = this.add.image(x + 3, 400, 'halo').setScale(0.4).setTint(0xffb040).setAlpha(0.6).setBlendMode(Phaser.BlendModes.ADD).setDepth(3);
      this.tweens.add({ targets: l, alpha: 0.35, scale: 0.34, duration: 300 + x % 4 * 90, yoyo: true, repeat: -1 });
    }
    // le mendiant et Brisquet, au bout de la table : le chien a sa gamelle
    this.add.image(922, 476, corpsHD(this, 'mendiant')).setOrigin(0.5, 1).setScale(8 * echelleCorps(corpsHD(this, 'mendiant'))).setFlipX(true).setDepth(4);
    const chien = this.add.image(884, 476, chienHD(this, 'profil', true)).setOrigin(0.5, 1).setScale(0.8).setDepth(4).setFlipX(true);
    this.tweens.add({ targets: chien, angle: 6, duration: 260, yoyo: true, repeat: -1, repeatDelay: 500 });
    decorSaison(this, { sansSol: true, prof: 6, sol: 540 });
    // le bandeau des paroles, en bas
    this.bandeau = this.add.rectangle(480, 506, 960, 68, 0x0a0610, 0.78).setDepth(20);
    this.indice = this.add.text(950, 534, '', style(11, '#d6bf98', { fontStyle: 'italic' })).setOrigin(1, 1).setDepth(22);
    this.add.text(480, 24, 'Le banquet du Long Hiver', style(24, '#f3d98a', { fontFamily: 'MedievalSharp, serif', stroke: '#1a0e06', strokeThickness: 6 })).setOrigin(0.5).setDepth(20);
    Son.jouer('foule');
    this.input.on('pointerdown', () => this.suivante());
    this.suivante();
  }

  dire(texte) {
    if (this.ligne) this.ligne.destroy();
    this.ligne = texteMixte(this, 480, 506, texte, { taille: 15, largeur: 900, align: 'center', extra: { stroke: '#0a0610', strokeThickness: 4 } }).setOrigin(0.5, 0.5).setDepth(21).setAlpha(0);
    this.tweens.add({ targets: this.ligne, alpha: 1, duration: 600 });
    this.indice.setText('');
    this.time.delayedCall(700, () => { this.occupe = false; if (!this.fini) this.indice.setText('▶ clique pour continuer'); });
  }

  // Tout le monde lève sa chope (les bras en l'air), puis la repose
  trinquer() {
    for (const im of this.convives) { im.setTexture(corpsHD(this, im.qui, 'leves', 'face')); this.time.delayedCall(1300, () => im.active && im.setTexture(corpsHD(this, im.qui, null, 'face'))); }
    this.joueur.setTexture(textureJoueurPose(this, this.G, 'face', 'leves'));
    this.time.delayedCall(1300, () => this.joueur.active && this.joueur.setTexture(textureJoueur(this, this.G, 'face')));
  }

  suivante() {
    if (this.occupe || this.fini) return;
    this.occupe = true;
    this.etape++;
    if (this.etape === 1) this.dire("Sous le grand sapin, tout le village s'est attablé. Les bougies tremblent, la neige tombe sans bruit, et ça sent la volaille rôtie.");
    else if (this.etape === 2) {
      // Garrick arrive dans la neige, par la gauche, et s'arrête au bout de la table
      this.garrick = this.add.image(-60, 474, corpsHD(this, 'mentor')).setOrigin(0.5, 1).setScale(8 * echelleCorps(corpsHD(this, 'mentor'))).setDepth(4);
      pasDeMarche(this, this.garrick, 1900, { poussiere: false });
      this.tweens.add({ targets: this.garrick, x: 52, duration: 1900, onComplete: () => this.dire("Une silhouette sort de la neige, le manteau blanc de flocons : Garrick. « Il reste une place pour un vieux rôdeur ? » On lui tend une chope.") });
    } else if (this.etape === 3) {
      this.trinquer(); Son.jouer('fanfare');
      this.garrick.setTexture(corpsHD(this, 'mentor', 'leves'));
      this.time.delayedCall(1500, () => this.garrick.active && this.garrick.setTexture(corpsHD(this, 'mentor')));
      this.dire(`Garrick lève sa chope : ${TOAST_GARRICK} « Au Long Hiver ! » répond toute la tablée.`);
    } else if (this.etape === 4) {
      const cadeau = finirBanquet(this.G);
      const ic = this.add.image(506, 420, iconeObjet(this, cadeau.id)).setScale(0).setDepth(5);
      this.tweens.add({ targets: ic, scale: 3, y: 412, duration: 500, ease: 'Back.easeOut' });
      Son.jouer('trefle');
      this.dire(`${cadeau.qui} glisse ${cadeau.quoi} près de ton assiette : « Pour un de tes clients. C'est le Long Hiver, ça se partage ! »`);
    } else if (this.etape === 5) this.dire('Le ventre plein et le cœur au chaud, tu rentres te coucher sous la neige. (Demain matin, tu seras en pleine forme : un client de plus.)');
    else {
      this.fini = true; this.indice.setText('');
      this.cameras.main.fadeOut(900);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(this.suite, this.donnees));
    }
  }
}
