// (v1.05, lot B-3c, planche 35) La grande roue des cadeaux du Long Hiver, en plein écran : la place sous la
// neige, le grand sapin, la roue sur son chevalet et le Père Givrin qui la lance. Un tour par jour : la roue
// ralentit en faisant cliqueter ses clous sous la languette, puis le lot apparaît.
class RoueScene extends Phaser.Scene {
  constructor() { super('Roue'); }

  init(data) {
    this.retour = (data && data.retour) || 'Marche';
    this.tourne = false; this.fini = false; this.parti = false;   // (Phaser garde la même scène d'une visite à l'autre)
  }

  create() {
    const G = this.G = window.GAME;
    creerIconesHD(this); creerPiecesHD(this); creerHalo(this);
    this.cameras.main.fadeIn(400);
    // la place du marché sous la neige, le ciel d'hiver
    this.add.image(0, 0, paysageHD(this, 960, 540, 'comte', 0)).setOrigin(0).setDisplaySize(960, 330);
    const g = this.add.graphics();
    const px = (x, y, w, h, c, a = 1) => g.fillStyle(c, a).fillRect(Math.round(x / 2) * 2, Math.round(y / 2) * 2, Math.max(2, Math.round(w / 2) * 2), Math.max(2, Math.round(h / 2) * 2));
    px(0, 300, 960, 240, 0xdfe6ee);
    for (let y = 304; y < 540; y += 12) for (let x = (y / 12) % 2 ? 0 : 20; x < 960; x += 40) px(x, y, 36, 9, 0xd0d8e2);
    for (let k = 0; k < 40; k++) px((k * 197) % 960, 306 + ((k * 89) % 230), 30 + (k % 3) * 14, 4, 0xf8fbff);
    // au fond, les étals bâchés de blanc et la guirlande de sapin
    for (const x of [60, 210, 760]) { px(x, 236, 110, 64, 0x6a4a2a); px(x - 6, 222, 122, 18, 0xf4f8fc); px(x - 6, 238, 122, 4, 0xc8d0da); }
    const c0 = this.add.container(0, 0); guirlandeSapin(this, c0, 0, 960, 40, 26, 80);
    // le grand sapin, à droite
    const sapin = grandSapin(this, 850, 470, 330, { u: 3 });
    this.tweens.add({ targets: sapin.etoile, scale: 1.2, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const halo = this.add.image(850, sapin.haut + 8, 'halo').setScale(0.9).setTint(0xffe080).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: halo, alpha: 0.12, duration: 800, yoyo: true, repeat: -1 });
    // la roue sur son chevalet
    const cx = this.cxR = 360, cy = this.cyR = 250, E = 2.6, R = 56;
    const pied = this.add.graphics();
    pied.fillStyle(0x4a3018).fillTriangle(cx - 70, 470, cx - 54, 470, cx - 4, cy).fillTriangle(cx + 70, 470, cx + 54, 470, cx + 4, cy);
    pied.fillStyle(0x6a4424).fillTriangle(cx - 66, 470, cx - 60, 470, cx - 4, cy + 8).fillTriangle(cx + 66, 470, cx + 60, 470, cx + 4, cy + 8);
    pied.fillStyle(0x3a2410).fillRect(cx - 50, 400, 100, 8);
    this.roue = this.add.container(cx, cy);
    this.roue.add(this.add.image(0, 0, texRoueHiver(this, R)).setScale(E));
    // l'icône de chaque lot, au milieu de sa part
    HIVER.lots.forEach((l, i) => {
      const a = angleLotRoue(i), r = R * E * 0.62;
      const ic = this.add.image(Math.sin(a) * r, -Math.cos(a) * r, iconeLotRoue(this, l.id)).setScale(l.id === 'pieces' ? 2.6 : 2.2).setAngle(a * 180 / Math.PI);
      this.roue.add(ic);
    });
    // la languette de cuir qui claque sur les clous, en haut
    this.languette = this.add.graphics().setPosition(cx, cy - R * E - 4);
    this.languette.fillStyle(0x2a1a10).fillTriangle(-14, -20, 14, -20, 0, 14).fillStyle(0xc8282a).fillTriangle(-10, -17, 10, -17, 0, 8).fillStyle(0xe8b830).fillCircle(0, -14, 4);
    // le Père Givrin, à côté de sa roue
    this.givrin = imageCorps(this, 640, 500, 'givrin', 10).setFlipX(true);
    this.tweens.add({ targets: this.givrin, y: 496, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    // la neige qui tombe
    decorSaison(this, { sansSol: true, prof: 6, sol: 540 });
    // le titre, la bourse, la bulle du Père Givrin
    this.add.text(480, 30, 'La grande roue du Long Hiver', style(26, '#f3d98a', { fontFamily: 'MedievalSharp, serif', stroke: '#1a0e06', strokeThickness: 6 })).setOrigin(0.5).setDepth(10);
    this.bourse = bourse(this, 40, 530, G.argent, { echelle: 1.4, taille: 14, aDroite: true }); this.bourse.setDepth(10);
    this.bulle = this.add.container(0, 0).setDepth(10);
    this.dire(`« Approche, approche ! ${HIVER.roue.prix} pièces le tour, et la roue décide de ton cadeau. Ho, ho ! »`);
    this.bouton = creerBouton(this, 760, 505, 230, `Tourner la roue (${HIVER.roue.prix} p.)`, () => this.tourner());
    this.bouton.fond.setDepth(10); this.bouton.label.setDepth(10);
  }

  // Une bulle de paroles au-dessus du Père Givrin
  dire(texte) {
    this.bulle.removeAll(true);
    texte = texte.replace(/« /g, '«\u00a0').replace(/ »/g, '\u00a0»').replace(/ !/g, '\u00a0!').replace(/ \?/g, '\u00a0?');   // (pas de guillemet ni de « ! » seul en bout de ligne)
    const t = this.add.text(700, 120, texte, style(14, '#3b2410', { fontStyle: 'italic', wordWrap: { width: 300 }, align: 'center' })).setOrigin(0.5);
    const f = this.add.graphics();
    f.fillStyle(0xfff8e6).fillRoundedRect(700 - t.width / 2 - 12, 120 - t.height / 2 - 8, t.width + 24, t.height + 16, 10).lineStyle(2, 0x6a4a2a).strokeRoundedRect(700 - t.width / 2 - 12, 120 - t.height / 2 - 8, t.width + 24, t.height + 16, 10);
    f.fillStyle(0xfff8e6).fillTriangle(660, 120 + t.height / 2 + 6, 680, 120 + t.height / 2 + 6, 650, 120 + t.height / 2 + 26);
    this.bulle.add([f, t]);
  }

  tourner() {
    if (this.fini) return this.partir();
    if (this.tourne) return;
    const G = this.G, r = tournerRoue(G);
    if (r.erreur) { this.dire(r.erreur); return; }
    this.tourne = true;
    Sauvegarde.maintenant(G, 'Marche');   // (v1.07 : le lot est tiré ; recharger la page ne relance pas la roue)
    Son.jouer('pieces'); this.bourse.maj && this.bourse.maj(G.argent);
    this.bouton.fond.setVisible(false); this.bouton.label.setVisible(false);
    this.dire('« Et hop ! Elle tourne, elle tourne... »');
    // le Père Givrin lance la roue à deux mains
    this.givrin.setTexture(corpsHD(this, 'givrin', 'leves'));
    this.time.delayedCall(500, () => this.givrin.active && this.givrin.setTexture(corpsHD(this, 'givrin')));
    // la roue ralentit et s'arrête sur la part du lot (la languette en haut)
    const depart = this.roue.angle, cible = -angleLotRoue(r.index, Math.random() * 2 - 1) * 180 / Math.PI;
    const fin = depart - (depart % 360) + 360 * 6 + ((cible % 360) + 360) % 360;
    const total = HIVER.lots.reduce((a, l) => a + l.poids, 0), bornes = [];
    let a = 0; for (const l of HIVER.lots) { bornes.push(a / total * 360); a += l.poids; }
    let dernier = depart;
    this.tweens.add({ targets: this.roue, angle: { from: depart, to: fin }, duration: 5200, ease: 'Cubic.easeOut',
      onUpdate: () => {
        // un clic chaque fois qu'un clou passe sous la languette (et la languette qui sursaute)
        const avant = ((-dernier % 360) + 360) % 360, apres = ((-this.roue.angle % 360) + 360) % 360;
        dernier = this.roue.angle;
        if (bornes.some(b => (avant > apres ? b <= avant && b > apres : avant !== apres && (b <= avant || b > apres)))) {
          Son.jouer('clic');
          this.languette.setAngle(-14);
          this.tweens.add({ targets: this.languette, angle: 0, duration: 120 });
        }
      },
      onComplete: () => this.reveler(r) });
  }

  // Le lot : son icône qui jaillit de la roue, des étincelles, et la bourse à jour
  reveler(r) {
    const G = this.G;
    this.fini = true;
    Son.jouer(r.lot.id === 'grosLot' ? 'tresor' : 'fanfare');
    this.bourse.maj && this.bourse.maj(G.argent);
    const lueur = this.add.image(this.cxR, this.cyR, 'halo').setTint(r.lot.couleur).setScale(0.2).setAlpha(0.8).setBlendMode(Phaser.BlendModes.ADD).setDepth(8);
    this.tweens.add({ targets: lueur, scale: 2.4, alpha: 0.35, duration: 700, ease: 'Sine.easeOut' });
    const icone = this.add.image(this.cxR, this.cyR, r.objet === 'pieces' ? 'pieceFace' : iconeObjet(this, r.objet)).setScale(0).setDepth(9);
    this.tweens.add({ targets: icone, scale: r.objet === 'pieces' ? 7 : 6, duration: 600, ease: 'Back.easeOut' });
    this.tweens.add({ targets: icone, y: this.cyR - 8, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 600 });
    for (let k = 0; k < 16; k++) {
      const e = this.add.rectangle(this.cxR, this.cyR, 4, 4, [0xffe080, 0xffffff, r.lot.couleur][k % 3]).setDepth(9);
      const a = k / 16 * Math.PI * 2;
      this.tweens.add({ targets: e, x: this.cxR + Math.cos(a) * 150, y: this.cyR + Math.sin(a) * 150, alpha: 0, duration: 900, ease: 'Quad.easeOut', onComplete: () => e.destroy() });
    }
    const fond = this.add.rectangle(this.cxR, 452, 480, 60, 0x1a0e06, 0.88).setStrokeStyle(2, 0xc8a050).setDepth(9);
    this.add.text(this.cxR, 452, r.texte, style(14, '#fff4dc', { fontStyle: 'bold', wordWrap: { width: 450 }, align: 'center' })).setOrigin(0.5).setDepth(10);
    fond.setScale(1, 0); this.tweens.add({ targets: fond, scaleY: 1, duration: 250 });
    this.givrin.setTexture(corpsHD(this, 'givrin', 'leves'));
    this.dire(r.lot.id === 'grosLot' ? '« LE GROS LOT ! Ho, ho, ho ! Ça n\'arrive pas tous les hivers ! »' : '« Ho, ho ! La roue a parlé ! Joyeux Long Hiver ! »');
    this.time.delayedCall(1400, () => this.givrin.active && this.givrin.setTexture(corpsHD(this, 'givrin')));
    this.bouton.label.setText('Retour au marché');
    this.time.delayedCall(900, () => { this.bouton.fond.setVisible(true); this.bouton.label.setVisible(true); });
  }

  partir() {
    if (this.parti) return;
    this.parti = true;
    this.cameras.main.fadeOut(400);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(this.retour));
  }
}
