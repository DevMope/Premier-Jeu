// (v1.55, planche 63 validée) La nuit du cambrioleur, quand ton chat (celui qui parle) est là : trois tableaux, un clic
// pour passer de l'un à l'autre. I. Minuit : il entre, sa lanterne sourde à la main. II. Le film « d'horreur » drôle tiré
// cette nuit (les yeux, l'ombre, la fumée, ou le Parrain). III. La fuite : il détale dans la rue en semant son butin.
// Le décor est celui de la promenade du soir (le shop la nuit) ; seul le voleur voit le chat debout.

const VOLEUR_NUIT = { race: 'humain', nom: 'Le Rat', costume: 'cambrioleur', niveau: 'novice' };

class CambrioleurScene extends PromenadeScene {
  constructor() { super('Cambrioleur'); }

  init(donnees) { this.donnees = donnees || {}; }
  update() {}   // (personne ne marche : c'est un film)

  create() {
    super.create();
    const G = this.G, c = G.cambriolage || { film: 'yeux' };
    this.input.removeAllListeners('pointerdown');
    this.touches = null;
    this.cible = null;
    // tout ce qui fait « promenade » disparaît : les textes, les boutons, le héros, le chat qui suit
    for (const o of this.children.list) {
      if (o.type === 'Text' || o.scrollFactorX === 0) o.setVisible(false);
      if (o.input) o.disableInteractive();
    }
    for (const o of [this.heros, this.compagnon && this.compagnon.img, this.compagnon && this.compagnon.ombre]) if (o && o.setVisible) o.setVisible(false);
    // (le chat ordinaire qui suit le joueur, et celui de gouttière : cette nuit, seul le chat debout se montre, au voleur)
    for (const o of this.children.list) if (o.texture && /chat/i.test(o.texture.key)) o.setVisible(false);
    const hud = this.scene.get('Hud'); if (hud) hud.sys.setVisible(false);
    if (typeof Son !== 'undefined' && Son.ambiance) Son.ambiance('nuit');
    this.boutonPasser(() => this.finir());
    this.derouler(c.film || 'yeux');
  }

  // Le fil des trois tableaux ; chacun efface le précédent
  async derouler(film) {
    const tableaux = [() => this.minuit(), () => this.film(film), () => this.fuite()];
    for (const t of tableaux) {
      if (this.fini) return;
      const avant = new Set(this.children.list);
      t();
      await this.attendreSuite(undefined, { prof: 952 });   // (par-dessus les bandes noires du film)
      for (const o of this.children.list.slice()) if (!avant.has(o) && o.active) o.destroy();
    }
    this.finir();
  }

  finir() {
    if (this.fini) return;
    this.fini = true;
    const hud = this.scene.get('Hud'); if (hud) hud.sys.setVisible(true);
    const { suite = 'Rue', passage = null } = this.donnees;
    this.cameras.main.fadeOut(500);
    this.cameras.main.once('camerafadeoutcomplete', () => (passage ? this.scene.start('Saison', { suite, ...passage }) : this.scene.start(suite)));
  }

  // --- Les outils de la nuit ---
  cadrerNuit(x0) { const cam = this.cameras.main; cam.stopFollow(); cam.setScroll(x0, 0); }
  figVoleur(x, vue = 'profil', pose = null, flip = false, prof = 9) {
    const k = corpsHD(this, VOLEUR_NUIT, pose, vue);
    return this.add.image(x, SOL_PROMENADE, k).setOrigin(0.5, 1).setScale(7.5 * echelleCorps(k)).setFlipX(flip).setDepth(prof);
  }
  voileNuit(a = 0.82, coul = 0x060812, prof = 8) { return this.add.rectangle(480, 270, 960, 540, coul, a).setScrollFactor(0).setDepth(prof); }
  lueurNuit(x, y, r, coul, a, prof = 8.2) { creerHalo(this); return this.add.image(x, y, 'halo').setScale(r).setTint(coul).setAlpha(a).setBlendMode(Phaser.BlendModes.ADD).setDepth(prof).setScrollFactor(0); }
  // le cadre « film d'horreur » : deux bandes noires, un grain qui bouge, un titre rouge
  cadreFilm(titre, sous = '') {
    this.add.rectangle(480, 22, 960, 44, 0x000000).setScrollFactor(0).setDepth(950); this.add.rectangle(480, 518, 960, 44, 0x000000).setScrollFactor(0).setDepth(950);
    const g = this.add.graphics().setScrollFactor(0).setDepth(940);
    const grain = () => { if (!g.active) return; g.clear(); const d = Math.floor(Math.random() * 400); for (let k = 0; k < 900; k++) g.fillStyle(k % 2 ? 0xffffff : 0x000000, 0.06).fillRect((k * 397 + d) % 960, (k * 173 + d * 3) % 540, 2, 2); };
    grain(); this.time.addEvent({ delay: 90, loop: true, callback: grain });
    this.add.text(28, 22, titre, style(16, '#e83a2a', { fontStyle: 'bold', stroke: '#000000', strokeThickness: 3, letterSpacing: 3 })).setOrigin(0, 0.5).setScrollFactor(0).setDepth(951);
    if (sous) this.add.text(28, 518, sous, style(12, '#c8c0b0', { fontStyle: 'italic' })).setOrigin(0, 0.5).setScrollFactor(0).setDepth(951);   // (à gauche : « Clique pour continuer » prend la droite)
  }
  bulleNuit(x, y, texte, { coul = '#f0f0e8', fond = 0x0a0a12, l = 330, prof = 960, retard = 0 } = {}) {
    const t = this.add.text(x, y, texte, style(14, coul, { fontStyle: 'bold', align: 'center', wordWrap: { width: l - 24 } })).setOrigin(0.5).setScrollFactor(0).setDepth(prof + 1);
    const r = this.add.rectangle(x, y, t.width + 26, t.height + 18, fond, 0.92).setStrokeStyle(2, 0x8a8a9a).setScrollFactor(0).setDepth(prof);
    for (const o of [t, r]) { o.setScale(0); this.tweens.add({ targets: o, scale: 1, delay: retard, duration: 220, ease: 'Back.easeOut' }); }
    return t;
  }
  gouttesSueur(x, y, prof = 12) {
    const g = this.add.graphics().setScrollFactor(0).setDepth(prof);
    for (const [dx, dy] of [[-30, -10], [26, -18], [34, 4]]) { g.fillStyle(0x0a1a2a).fillEllipse(x + dx, y + dy + 1, 9, 13); g.fillStyle(0x8ad0ff).fillEllipse(x + dx, y + dy, 7, 11); g.fillStyle(0xffffff).fillRect(x + dx - 2, y + dy - 3, 2, 3); }
    this.tweens.add({ targets: g, y: 6, duration: 500, yoyo: true, repeat: -1 });
    return g;
  }
  trembler(o) { this.tweens.add({ targets: o, x: o.x + 3, duration: 60, yoyo: true, repeat: -1 }); }

  // I. Minuit : il entre par la porte de la rue, sa lanterne sourde à la main
  minuit() {
    // (v1.64 : l'arrière-boutique s'est élargie ; la porte de la rue a reculé d'autant, la caméra aussi)
    const E = ELARGI_ARRIERE;
    this.cadrerNuit(960 + E);
    this.voileNuit(0.62);
    this.lueurNuit(1840 - 960, 390, 1.6, 0x8ab0ff, 0.25, 8.1);
    const v = this.figVoleur(1720 + E, 'profil', null, true);
    this.tweens.add({ targets: v, x: 1600 + E, duration: 2200, ease: 'Sine.easeOut' });
    const l = this.lueurNuit(1680 - 960, 400, 1.1, 0xffc060, 0.55, 8.6);
    this.tweens.add({ targets: l, x: 1560 - 960, duration: 2200, ease: 'Sine.easeOut' });
    this.tweens.add({ targets: l, alpha: 0.4, duration: 300, yoyo: true, repeat: -1 });
    this.cadreFilm('MINUIT', 'Le comptoir dort...');
    this.bulleNuit(560, 250, 'Hé hé... tout ce bel or, et personne pour le garder.', { coul: '#e8e0c8', l: 300, retard: 1600 });
    if (typeof Son !== 'undefined') Son.jouer('porte');
  }

  // II. Le film tiré cette nuit
  film(id) {
    this.cadrerNuit(960);
    const L = lookChat(this.G), F = FILMS_CAMBRIOLEUR[id] || FILMS_CAMBRIOLEUR.yeux;
    if (id === 'yeux') {
      this.voileNuit(0.93, 0x020308);
      const v = this.figVoleur(1450, 'troisQuarts', null, false, 9).setTint(0xd8b890); this.trembler(v);
      this.lueurNuit(1470 - 960, 380, 1.3, 0xffb050, 0.5, 8.6);
      for (const dx of [0, 26]) {
        const e = [this.lueurNuit(1540 + dx - 960, 360, 0.25, 0xd8ff40, 0.9, 9.5), this.add.ellipse(1540 + dx, 360, 14, 9, 0xe8ff60).setDepth(9.6), this.add.ellipse(1540 + dx, 360, 4, 9, 0x101008).setDepth(9.7)];
        for (const o of e) { o.setAlpha(0); this.tweens.add({ targets: o, alpha: o.type === 'Image' ? 0.9 : 1, delay: 700, duration: 500 }); }
        this.tweens.add({ targets: e.slice(1), scaleY: 0.1, delay: 2600, duration: 90, yoyo: true, repeat: -1, repeatDelay: 2400 });   // (il cligne)
      }
      this.gouttesSueur(1450 - 960, 300);
      this.bulleNuit(650, 250, F.replique, { coul: '#e8ff80', l: 300, retard: 1300 });
      this.bulleNuit(330, 150, '(... le buffet vient de parler ?)', { coul: '#c8c0b0', l: 260, retard: 2600 });
    } else if (id === 'ombre') {
      this.voileNuit(0.8, 0x08060a);
      const k = textureChatDebout(this, L, { cigare: true });
      const ombre = this.add.image(1235, 470, k).setOrigin(0.5, 1).setScale(9.5).setTintFill(0x000000).setAlpha(0).setDepth(8.3);
      this.tweens.add({ targets: ombre, alpha: 0.88, duration: 900 });
      this.tweens.add({ targets: ombre, scaleX: 9.8, duration: 260, yoyo: true, repeat: -1 });   // (la flamme vacille, l'ombre aussi)
      this.lueurNuit(1580 - 960, 340, 2.6, 0xffa040, 0.35, 8.2);
      this.add.image(1560, 392, k).setOrigin(0.5, 1).setScale(2.4).setFlipX(true).setDepth(9.4);
      const cg = this.add.graphics().setDepth(9.3); cg.fillStyle(0xf0e8d0).fillRect(1596, 362, 8, 30); cg.fillStyle(0xffc040).fillEllipse(1600, 356, 8, 14); this.lueurNuit(1600 - 960, 356, 0.6, 0xffc060, 0.7, 9.35);
      const v = this.figVoleur(1330, 'profil', 'leves', false, 9); this.trembler(v);
      this.gouttesSueur(1330 - 960, 300);
      this.bulleNuit(640, 110, F.replique, { coul: '#ffd8a0', l: 280, retard: 900 });
      this.bulleNuit(330, 200, 'AAAAH !', { coul: '#ffffff', fond: 0x3a0a0a, l: 160, retard: 2200 });
    } else if (id === 'fumee') {
      this.voileNuit(0.72, 0x0a0812);
      const k = textureChatDebout(this, L, { cigare: true });
      this.add.image(1580, 392, k).setOrigin(0.5, 1).setScale(2.4).setFlipX(true).setDepth(9.4);
      const braise = this.lueurNuit(1560 - 960, 300, 0.4, 0xff7020, 0.8, 9.45); this.tweens.add({ targets: braise, alpha: 0.4, duration: 500, yoyo: true, repeat: -1 });
      this.lueurNuit(1400 - 960, 330, 2.2, 0x9080c0, 0.3, 8.2);
      const v = this.figVoleur(1300, 'profil', 'leves', false, 9); this.trembler(v);
      this.time.delayedCall(600, () => formeDeFumee(this, 'dragon', 1556, 318, 1420, 290, { taille: 62, profondeur: 9.8, tenue: 60000, sens: -1 }));
      this.gouttesSueur(1300 - 960, 300);
      this.bulleNuit(700, 120, F.replique, { coul: '#d8d0ff', l: 140, retard: 2600 });
    } else {
      this.voileNuit(0.9, 0x060406);
      const k = textureChatDebout(this, L, { cigare: true, tenue: 'parrain', assis: true });
      this.add.image(1560, 392, k).setOrigin(0.5, 1).setScale(2.6).setFlipX(true).setDepth(9.4);
      this.lueurNuit(1560 - 960, 410, 1.2, 0xff6020, 0.55, 9.3);
      const braise = this.lueurNuit(1545 - 960, 312, 0.35, 0xff7020, 0.8, 9.45); this.tweens.add({ targets: braise, alpha: 0.35, duration: 700, yoyo: true, repeat: -1 });
      const v = this.figVoleur(1340, 'profil', 'leves', false, 9).setTint(0xc8a890); this.trembler(v);
      this.gouttesSueur(1340 - 960, 300);
      this.bulleNuit(640, 130, F.replique, { coul: '#ffd0a0', l: 420, retard: 900 });
    }
    this.cadreFilm(F.titre, id === 'parrain' ? 'avec la Famille' : 'avec un chat qui parle');
    if (typeof Son !== 'undefined') Son.jouer('miaou');
  }

  // III. La fuite : dans la rue, il détale en hurlant et sème son butin
  fuite() {
    const x0 = PIECES_PROMENADE[P_DEHORS].x + 1650; this.cadrerNuit(x0);
    const x = x0 + 560;
    const v = this.figVoleur(x - 160, 'profil', 'leves', false, 9.6);
    this.tweens.add({ targets: v, x: x + 520, delay: 900, duration: 5200, ease: 'Quad.easeIn' });
    this.tweens.add({ targets: v, y: SOL_PROMENADE - 10, duration: 120, yoyo: true, repeat: -1 });
    const pc = this.add.graphics().setDepth(9.5); for (let k = 0; k < 7; k++) { pc.fillStyle(0x6a4a10).fillEllipse(x - 120 - k * 46, 489 + (k % 2) * 4, 10, 5); pc.fillStyle(0xf0c040).fillEllipse(x - 120 - k * 46, 488 + (k % 2) * 4, 8, 4); }
    if (typeof creerObjetsHD === 'function') { this.add.image(x - 260, 484, iconeObjet(this, 'potion')).setScale(2).setDepth(9.5).setAngle(80); }
    const nu = this.add.graphics().setDepth(9.4); for (let k = 0; k < 5; k++) nu.fillStyle(0xc8b898, 0.45).fillCircle(x - 50 - k * 22, 486 - k * 3, 10 + k * 3);
    this.tweens.add({ targets: nu, alpha: 0, duration: 2400 });
    this.cadreFilm('LA FUITE', 'il ne reviendra jamais');
    this.bulleNuit(560, 150, 'MAMAAAAN ! UN CHAT QUI PARLE !', { coul: '#ffffff', fond: 0x3a0a0a, l: 300, retard: 300 });
  }
}
