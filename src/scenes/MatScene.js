// (v1.00, lot B-3a) Le mât de cocagne de la Fête du Solstice, en plein écran : JeuneGoy grimpe de dos,
// main gauche, main droite (Q / D, ← / →, ou un clic sur la moitié gauche / droite de l'écran). Chaque
// prise le hisse, ses bras et ses jambes alternent ; mais la force s'épuise (il faut souffler, et l'on
// glisse un peu pendant ce temps), la même main deux fois de suite fait glisser, et des coulées de
// graisse descendent le long du mât : attraper au moment où l'une passe sous la main, c'est la glissade.
// Trois glissades, c'est la chute. Tout en haut : le jambon fumé, ou le sac mystère.
class MatScene extends Phaser.Scene {
  constructor() { super('Mat'); }

  init(data) {
    this.retour = (data && data.retour) || 'Marche';
    this.hauteur = 0; this.force = 1; this.glissades = 0; this.derniere = null; this.fini = false; this.gouttes = [];
  }

  create() {
    const G = this.G = window.GAME, M = SOLSTICE.mat;
    this.cameras.main.fadeIn(400);
    // Le monde : un mât de 1300 pixels, la place au pied, la roue et les lots tout en haut
    const H = this.H = 1600, sol = this.sol = H - 60, haut = this.haut = 150, mx = this.mx = 480;
    this.cameras.main.setBounds(0, 0, 960, H);
    this.add.image(0, 0, paysageHD(this, 960, 540, 'comte', 0)).setOrigin(0).setDisplaySize(960, 540).setScrollFactor(0);
    this.add.rectangle(480, H - 160, 960, 320, 0x8a8478).setOrigin(0.5, 0);
    this.add.image(0, sol - 60, pavesHD(this, 960, 120)).setOrigin(0).setScale(2);
    const g = this.add.graphics();
    const px = (x, y, w, h, c, a = 1) => g.fillStyle(c, a).fillRect(Math.round(x / 2) * 2, Math.round(y / 2) * 2, Math.max(2, Math.round(w / 2) * 2), Math.max(2, Math.round(h / 2) * 2));
    // le socle de pierres et le mât écorcé, luisant de graisse
    px(mx - 32, sol - 18, 64, 26, 0x6a6a74); px(mx - 28, sol - 22, 56, 6, 0x8a8a94);
    px(mx - 9, haut, 18, sol - haut, 0x8a5a2a); px(mx - 9, haut, 5, sol - haut, 0xa8784a); px(mx + 4, haut, 5, sol - haut, 0x6a4020);
    for (let y = haut + 20; y < sol - 20; y += 26) px(mx - 5, y, 2, 12, 0xfff4dc, 0.55);
    // la roue de charrette et les lots qui pendent
    g.lineStyle(4, 0x5a3a1a).strokeCircle(mx, haut - 4, 50); g.lineStyle(3, 0x6a4a2a);
    for (let a = 0; a < 6; a++) g.lineBetween(mx, haut - 4, mx + Math.cos(a * Math.PI / 3) * 50, haut - 4 + Math.sin(a * Math.PI / 3) * 16);
    for (const [dx, quoi] of [[-42, 'jambon'], [-14, 'saucisses'], [16, 'sac'], [42, 'couronne']]) {
      const x = mx + dx; px(x, haut, 2, 28, 0xe8d8b0);
      if (quoi === 'jambon') { g.fillStyle(0xb85a3a).fillEllipse(x + 1, haut + 42, 20, 28); g.fillStyle(0xe8b090).fillEllipse(x + 1, haut + 50, 12, 10); px(x - 1, haut + 26, 4, 6, 0xf4f0e8); }
      if (quoi === 'saucisses') for (let k = 0; k < 3; k++) g.fillStyle(0x8a3a2a).fillEllipse(x + 1, haut + 34 + k * 10, 8, 10);
      if (quoi === 'sac') { g.fillStyle(0x8a6a3a).fillEllipse(x + 1, haut + 42, 20, 22); px(x - 4, haut + 28, 10, 4, 0x5a3a1a); this.add.text(x + 1, haut + 44, '?', style(13, '#ffe08a', { fontStyle: 'bold', stroke: '#2a1a10', strokeThickness: 3 })).setOrigin(0.5); }
      if (quoi === 'couronne') { g.lineStyle(3, 0xd0a040).strokeCircle(x + 1, haut + 38, 9); for (const [fx, fy, c] of [[-6, -6, 0xf4f0e8], [6, -4, 0xe87aa0], [0, 8, 0xf0c830]]) g.fillStyle(c).fillCircle(x + 1 + fx, haut + 38 + fy, 3); }
    }
    px(mx - 2, haut - 70, 4, 16, 0x4a3018); g.fillStyle(0x2a4a8a).fillTriangle(mx + 2, haut - 70, mx + 30, haut - 64, mx + 2, haut - 58);
    // la foule au pied du mât (elle lève les bras quand ça monte)
    this.foule = [];
    for (let k = 0; k < 8; k++) {
      const x = k < 4 ? 90 + k * 75 : 600 + (k - 4) * 75;
      this.foule.push(imageCorps(this, x, sol + 30, { nom: 'Fêtard ' + k, race: ['humain', 'hobbit', 'nain', 'elfe'][k % 4], feminin: k % 3 === 1, niveau: 1 }, 4.4).setFlipX(k >= 4).setDepth(6));
    }
    // JeuneGoy, de dos, accroché au mât
    this.poses = [textureJoueurPose(this, G, 'dos', 'grimpe1'), textureJoueurPose(this, G, 'dos', 'grimpe2')];
    this.pose = 0;
    this.joueur = this.add.image(mx, this.yJoueur(), this.poses[0]).setOrigin(0.5, 1).setScale(echelleJoueur(10)).setDepth(5);
    this.cameras.main.setScroll(0, Phaser.Math.Clamp(this.joueur.y - 400, 0, H - 540));
    // --- l'interface (fixe à l'écran) ---
    const ui = (o) => o.setScrollFactor(0).setDepth(20);
    const ig = ui(this.add.graphics());
    const planche = (x, y, w, h) => { ig.fillStyle(0x3a2410).fillRect(x - 4, y - 4, w + 8, h + 8); ig.fillStyle(0x8a6a40).fillRect(x, y, w, h); };
    planche(30, 70, 40, 330); planche(890, 70, 40, 330); ig.fillStyle(0x1a0e06, 0.8).fillRect(280, 8, 400, 40);
    this.jauges = ui(this.add.graphics());
    ui(this.add.text(30, 54, 'Hauteur', style(13, '#ffe08a', { fontStyle: 'bold', stroke: '#2a1a10', strokeThickness: 4 })).setOrigin(0, 0.5));
    ui(this.add.text(930, 54, 'Force', style(13, '#ffe08a', { fontStyle: 'bold', stroke: '#2a1a10', strokeThickness: 4 })).setOrigin(1, 0.5));
    this.bandeau = ui(this.add.text(480, 28, '', style(15, '#f3d98a', { fontStyle: 'bold' })).setOrigin(0.5));
    this.tGlisse = ui(this.add.text(480, 66, '', style(15, '#ff9a80', { fontStyle: 'bold', stroke: '#2a1a10', strokeThickness: 4 })).setOrigin(0.5));
    this.indice = ui(this.add.text(480, 512, 'Main gauche, main droite : Q / D, ← / →, ou un clic à gauche / à droite', style(14, '#fff4dc', { fontStyle: 'bold italic', stroke: '#2a1a10', strokeThickness: 4 })).setOrigin(0.5));
    // les deux mains, en bas : celle qu'il faut attraper ensuite s'allume
    this.mainsUI = [ui(this.add.text(330, 470, '◀ main gauche', style(16, '#fff4dc', { fontStyle: 'bold', backgroundColor: '#3b2410', padding: { x: 10, y: 6 } })).setOrigin(0.5)),
      ui(this.add.text(630, 470, 'main droite ▶', style(16, '#fff4dc', { fontStyle: 'bold', backgroundColor: '#3b2410', padding: { x: 10, y: 6 } })).setOrigin(0.5))];
    // les commandes
    this.input.on('pointerdown', p => { if (!this.fini) this.prise(p.x < 480 ? 0 : 1); });
    const kb = this.input.keyboard;
    for (const [touche, m] of [['Q', 0], ['A', 0], ['LEFT', 0], ['D', 1], ['RIGHT', 1]]) kb.on('keydown-' + touche, () => { if (!this.fini) this.prise(m); });
    this.events.once('shutdown', () => kb.removeAllListeners());
    this.debut = null;   // (le chrono part à la première image : time.now n'est pas encore à jour dans create)
    this.majUI();
  }

  yJoueur() { return this.sol - this.hauteur * (this.sol - this.haut - 150); }

  // Une prise : la bonne main, il monte ; la même main, il glisse ; une goutte de graisse sous la main, il glisse
  prise(m) {
    const M = SOLSTICE.mat;
    this.dernierePrise = this.time.now;
    if (this.force < M.effort) { this.secouer(); this.tGlisse.setText('Plus de force ! Souffle un peu...'); return; }
    this.force -= M.effort;
    if (this.derniere === m) return this.glisser(M.mauvaiseMain, 'La même main ? Ça glisse !');
    this.derniere = m;
    const yMain = this.joueur.y - this.joueur.displayHeight * 0.98;
    if (this.gouttes.some(gt => Math.abs(gt.y - yMain) < 26)) return this.glisser(M.gouttes, 'De la graisse sous la main !', true);
    this.pose = 1 - this.pose;
    this.joueur.setTexture(this.poses[this.pose]);
    this.hauteur = Math.min(1, this.hauteur + M.prise);
    this.tweens.add({ targets: this.joueur, y: this.yJoueur(), duration: 160, ease: 'Quad.easeOut' });
    Son.jouer('clic');
    this.tGlisse.setText('');
    if (this.hauteur >= 1) this.gagne();
    else if (Math.random() < 0.25) this.foule.forEach((f, k) => this.tweens.add({ targets: f, y: this.sol + 22, duration: 120, yoyo: true, delay: k * 30 }));
  }

  glisser(de, texte, compte = false) {
    this.hauteur = Math.max(0, this.hauteur - de);
    this.tweens.add({ targets: this.joueur, y: this.yJoueur(), duration: 260, ease: 'Quad.easeIn' });
    this.secouer();
    Son.jouer('glisse');
    if (compte) this.glissades++;
    this.tGlisse.setText(texte + (compte ? `  (${this.glissades} / ${SOLSTICE.mat.glissadesMax})` : ''));
    this.derniere = null;
    if (this.glissades >= SOLSTICE.mat.glissadesMax) this.chute();
  }
  secouer() { this.tweens.add({ targets: this.joueur, x: this.mx + 4, duration: 50, yoyo: true, repeat: 2, onComplete: () => this.joueur.setX(this.mx) }); }

  update(t, dt) {
    if (this.fini) return;
    const M = SOLSTICE.mat, s = Math.min(0.1, dt / 1000);
    // la caméra suit le grimpeur (sans retard : il reste aux deux tiers de l'écran)
    const cam = this.cameras.main, cible = Phaser.Math.Clamp(this.joueur.y - 400, 0, this.H - 540);
    cam.scrollY += Phaser.Math.Clamp(cible - cam.scrollY, -2000 * s, 2000 * s);
    if (this.debut === null) { this.debut = this.time.now; this.prochaineGoutte = this.time.now + 1500; }
    // la force revient quand on souffle ; on glisse doucement pendant ce temps
    const souffle = this.time.now - (this.dernierePrise || 0) > 300;
    this.force = Math.min(1, this.force + M.repos * s);
    if (souffle && this.hauteur > 0) { this.hauteur = Math.max(0, this.hauteur - M.glisseRepos * s); this.joueur.y = this.yJoueur(); }
    // les coulées de graisse qui descendent le mât
    if (this.time.now > this.prochaineGoutte) {
      this.prochaineGoutte = this.time.now + Phaser.Math.Between(1500, 2600);
      const yDepart = this.joueur.y - this.joueur.displayHeight - Phaser.Math.Between(140, 260);
      const gt = this.add.ellipse(this.mx + Phaser.Math.Between(-2, 2), yDepart, 10, 18, 0xfff0b0, 0.95).setDepth(5.5).setStrokeStyle(2, 0xc8a050);
      gt.vitesse = Phaser.Math.Between(90, 150);
      this.gouttes.push(gt);
    }
    for (const gt of this.gouttes) gt.y += gt.vitesse * s;
    this.gouttes = this.gouttes.filter(gt => { if (gt.y > this.joueur.y - 20) { gt.destroy(); return false; } return true; });
    const reste = M.duree - (this.time.now - (this.debut || this.time.now)) / 1000;
    if (reste <= 0) this.rate('Le temps est écoulé ! La foule rit de bon cœur pendant que tu redescends.');
    this.majUI(reste);
  }

  majUI(reste = SOLSTICE.mat.duree) {
    const j = this.jauges.clear();
    j.fillStyle(0x3a2a1a).fillRect(42, 82, 16, 306);
    j.fillStyle(0x6aa242).fillRect(42, 82 + 306 * (1 - this.hauteur), 16, 306 * this.hauteur);
    j.fillStyle(0x3a2a1a).fillRect(902, 82, 16, 306);
    j.fillStyle(this.force < SOLSTICE.mat.effort ? 0xc83a20 : 0xe8c040).fillRect(902, 82 + 306 * (1 - this.force), 16, 306 * this.force);
    this.bandeau.setText(`Le mât de cocagne  ·  ${Math.max(0, Math.ceil(reste))} s  ·  hauteur ${Math.round(this.hauteur * 100)} %`);
    const suivante = this.derniere === null ? -1 : 1 - this.derniere;
    this.mainsUI.forEach((t, i) => t.setBackgroundColor(suivante === i ? '#4a7a2a' : '#3b2410'));
  }

  chute() {
    this.fini = true;
    this.tweens.add({ targets: this.joueur, y: this.sol, angle: 18, duration: 700, ease: 'Bounce.easeOut' });
    Son.jouer('aie');
    this.time.delayedCall(900, () => this.fin("Trois glissades... et c'est la chute ! Tu atterris sur les fesses, la foule applaudit quand même.", false));
  }
  rate(texte) {
    this.fini = true;
    this.tweens.add({ targets: this.joueur, y: this.sol, duration: 1400, ease: 'Quad.easeIn' });
    this.time.delayedCall(1500, () => this.fin(texte, false));
  }
  gagne() {
    this.fini = true;
    Son.jouer('fanfare'); Son.jouer('foule', { duree: 1.6 });
    this.foule.forEach((f, k) => this.tweens.add({ targets: f, y: this.sol + 14, duration: 160, yoyo: true, repeat: 3, delay: k * 40 }));
    this.time.delayedCall(800, () => this.fin('Tu te cramponnes à la roue, la foule hurle ton nom. Quel lot décroches-tu ?', true));
  }

  fin(texte, enHaut) {
    this.majUI(0);
    const c = this.add.container(0, 0).setDepth(30).setScrollFactor(0);
    c.add(this.add.rectangle(480, 270, 960, 540, 0x000000, 0.45));
    c.add(this.add.image(480, 262, panneauHD(this, 640, 290)).setScale(2));
    c.add(this.add.text(480, 160, enHaut ? 'Tout en haut !' : 'Raté...', style(30, '#3b2410', { fontFamily: 'MedievalSharp, serif', fontStyle: 'bold' })).setOrigin(0.5));
    const corps = this.add.text(480, 226, texte, style(14, '#3b2410', { align: 'center', wordWrap: { width: 520 }, lineSpacing: 4 })).setOrigin(0.5);
    c.add(corps);
    const boutons = [];
    const bouton = (x, y, l, t, f) => { const b = creerBouton(this, x, y, l, t, f); for (const o of [b.fond, b.label]) { o.setScrollFactor(0).setDepth(31); c.add(o); } boutons.push(b); return b; };
    const vider = () => boutons.splice(0).forEach(b => { b.fond.destroy(); b.label.destroy(); });
    const suite = () => {
      const reste = partiesMatRestantes(this.G);
      if (reste > 0) bouton(370, 352, 200, `Réessayer (${SOLSTICE.mat.prix} p.)`, () => { const e = commencerMat(this.G); if (e) return corps.setText(e); Son.jouer('pieces'); this.scene.restart({ retour: this.retour }); });
      bouton(reste > 0 ? 590 : 480, 352, 200, 'Retour à la place', () => this.partir());
    };
    if (enHaut) {
      bouton(355, 290, 210, 'Le jambon fumé', () => { vider(); aide.destroy(); corps.setText(decrocherLot(this.G, 'jambon')); Son.jouer('miam'); suite(); });
      bouton(605, 290, 210, 'Le sac mystère', () => { vider(); aide.destroy(); corps.setText(decrocherLot(this.G, 'sac')); Son.jouer('achat'); suite(); });
      const aide = this.add.container(0, 0);
      aide.add([this.add.text(355, 314, '6 rations, à coup sûr', style(11, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5, 0),
        this.add.text(605, 314, 'au hasard : amulettes, potions,\ncapes et antidotes, ou une arme rare', style(11, '#6b4a2a', { fontStyle: 'italic', align: 'center' })).setOrigin(0.5, 0)]);
      c.add(aide);
    } else suite();
  }

  partir() {
    this.cameras.main.fadeOut(400);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(this.retour));
  }
}
