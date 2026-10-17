// (v1.00, lot B-3a, planche 22b v2) Le tir à l'arc de la Confrérie, en plein écran : JeuneGoy de dos,
// l'allée de tir, la cible de paille sur son chevalet, la foule derrière la barrière. Trois flèches ;
// pour chacune, trois jauges : la largeur (la zone rouge décalée par le vent), la hauteur, puis la
// puissance (on maintient, on lâche dans la bande). Le viseur montre où mènent largeur et hauteur.
class TirArcScene extends Phaser.Scene {
  constructor() { super('TirArc'); }

  init(data) {
    this.retour = (data && data.retour) || 'Marche';
    this.points = []; this.fleche = 0; this.etape = null; this.fini = false;
  }

  create() {
    const G = this.G = window.GAME;
    creerEmblemesHD(this); creerIconesHD(this);
    this.cameras.main.fadeIn(400);
    const px = this.px = (g, x, y, w, h, c, a = 1) => g.fillStyle(c, a).fillRect(Math.round(x / 2) * 2, Math.round(y / 2) * 2, Math.max(2, Math.round(w / 2) * 2), Math.max(2, Math.round(h / 2) * 2));
    this.add.image(0, 0, paysageHD(this, 960, 540, 'comte', 0)).setOrigin(0).setDisplaySize(960, 330);
    const g = this.add.graphics();
    // le pré fauché, l'allée de tir qui file vers la cible
    px(g, 0, 300, 960, 240, 0x5e9a3c); for (let y = 300; y < 540; y += 6) px(g, 0, y, 960, 2, 0x568e36);
    g.fillStyle(0x7ab24a).fillTriangle(380, 540, 580, 540, 480, 300); g.fillStyle(0x6aa242).fillTriangle(430, 540, 530, 540, 480, 300);
    // la foule derrière la barrière de bois et ses fanions
    this.badauds = [];
    for (const gx of [160, 800]) for (let k = 0; k < 4; k++) this.badauds.push(imageCorps(this, gx - 90 + k * 60 + (gx > 480 ? 20 : 0), 304, { nom: 'Badaud ' + gx + k, race: ['humain', 'hobbit', 'nain', 'elfe'][k], feminin: k % 2 === 1, niveau: 1 }, 3.2).setFlipX(gx > 480));
    const g2 = this.add.graphics();
    for (const [x1, x2] of [[0, 360], [600, 960]]) {
      px(g2, x1, 300, x2 - x1, 4, 0x6a4a2a); px(g2, x1, 314, x2 - x1, 4, 0x6a4a2a); for (let x = x1; x < x2; x += 40) px(g2, x, 290, 6, 34, 0x5a3a20);
      for (let x = x1; x < x2; x += 20) { const col = [0x2a4a8a, 0xf4f0e8, 0xf0c040][(x / 20) % 3]; g2.fillStyle(col).fillTriangle(x, 292, x + 14, 292, x + 7, 302); }
    }
    // la cible de paille sur son chevalet, au bout de l'allée
    const cx = this.cx = 480, cy = this.cy = 236, R = this.R = 46;
    px(g2, cx - 34, cy + 34, 6, 46, 0x5a3a20); px(g2, cx + 28, cy + 34, 6, 46, 0x5a3a20); px(g2, cx - 4, cy + 40, 6, 40, 0x4a3018);
    px(g2, cx - 52, cy - 52, 104, 104, 0xc8a050); for (let y = cy - 50; y < cy + 52; y += 6) px(g2, cx - 52, y, 104, 2, 0xa88038);
    for (const [r, col] of [[46, 0xf4f0e8], [38, 0xc83a20], [30, 0xf4f0e8], [22, 0x2a4a8a], [14, 0xf0c040], [6, 0xc83a20]]) for (let y = -r; y <= r; y += 2) { const w = Math.round(Math.sqrt(r * r - y * y)); px(g2, cx - w, cy + y, w * 2, 2, col); }
    // le mât du vent, planté au bord de l'allée, et son fanion
    px(g2, 640, 150, 4, 160, 0x4a3018); px(g2, 638, 306, 8, 4, 0x3a2410);
    this.fanion = this.add.graphics();
    // JeuneGoy de dos, au premier plan, l'arc bandé
    this.add.image(250, 580, textureJoueur(this, G, 'dos')).setOrigin(0.5, 1).setScale(echelleJoueur(10));
    const a = this.add.graphics();
    a.lineStyle(6, 0x6a4020); a.beginPath(); a.arc(150, 360, 110, -0.72, 0.72); a.strokePath();
    const ax1 = 150 + 110 * Math.cos(-0.72), ay1 = 360 + 110 * Math.sin(-0.72), ay2 = 360 + 110 * Math.sin(0.72);
    a.lineStyle(2, 0xf4f0e8).lineBetween(ax1, ay1, 226, 392).lineBetween(226, 392, ax1, ay2);
    this.flecheEncochee = this.add.graphics();
    this.flecheEncochee.lineStyle(3, 0x8a6a40).lineBetween(226, 392, 268, 330); this.flecheEncochee.fillStyle(0xc8ccd4).fillTriangle(262, 326, 276, 318, 272, 334);
    this.flecheEncochee.fillStyle(0xf4f0e8).fillTriangle(222, 396, 230, 384, 216, 388);
    // le viseur
    this.viseur = this.add.graphics().setDepth(5);
    // --- les trois jauges, sur des planchettes de bois ---
    const planche = (x, y, w, h) => { px(g2, x - 4, y - 4, w + 8, h + 8, 0x3a2410); px(g2, x, y, w, h, 0x8a6a40); for (let k = y + 6; k < y + h; k += 10) px(g2, x, k, w, 2, 0x7a5a34); };
    planche(500, 470, 400, 40); planche(890, 60, 40, 330); planche(30, 60, 40, 330);
    this.jauges = this.add.graphics().setDepth(3);
    this.reperes = this.add.graphics().setDepth(4);
    const t = (x, y, s, o = 0) => this.add.text(x, y, s, style(13, '#fff4dc', { fontStyle: 'bold', stroke: '#2a1a10', strokeThickness: 4 })).setOrigin(o, 0.5).setDepth(4);
    this.tL = t(520, 462, '1. Largeur'); this.tH = t(910, 44, '2. Hauteur', 1); this.tP = t(30, 44, '3. Puissance');
    this.aide = this.add.text(30, 404, '', style(11, '#fff4dc', { fontStyle: 'italic', stroke: '#2a1a10', strokeThickness: 3, wordWrap: { width: 170 } })).setDepth(4);
    // le bandeau du haut : flèches, score, vent
    px(g2, 300, 8, 360, 40, 0x1a0e06, 0.8);
    this.bandeau = this.add.text(480, 28, '', style(15, '#f3d98a', { fontStyle: 'bold' })).setOrigin(0.5).setDepth(4);
    this.indice = this.add.text(480, 520, '', style(14, '#fff4dc', { fontStyle: 'bold italic', stroke: '#2a1a10', strokeThickness: 4 })).setOrigin(0.5).setDepth(6);
    this.tweens.add({ targets: this.indice, alpha: 0.55, duration: 700, yoyo: true, repeat: -1 });
    this.input.on('pointerdown', () => this.appui());
    this.input.on('pointerup', () => this.relache());
    this.input.keyboard.on('keydown-SPACE', () => this.appui());
    this.input.keyboard.on('keyup-SPACE', () => this.relache());
    this.events.once('shutdown', () => { this.input.keyboard.removeAllListeners(); });
    this.nouvelleFleche();
  }

  // Une nouvelle flèche : le vent tourne, les zones rouges bougent
  nouvelleFleche() {
    this.fleche++;
    const vent = Phaser.Math.FloatBetween(-1, 1);
    this.vent = vent;
    this.zoneL = 0.5 + vent * 0.28;                     // le vent pousse la flèche : il faut viser de l'autre côté
    this.zoneH = 0.5 + Phaser.Math.FloatBetween(-0.12, 0.12);
    this.bandeP = 0.72;
    this.largeur = 0; this.hauteur = 0; this.puissance = 0;
    this.vitesse = 0.9 + this.fleche * 0.08;            // (un peu plus vite à chaque flèche)
    this.t0 = this.time.now;
    this.etape = 'largeur';
    this.flecheEncochee.setVisible(true);
    this.dessinerFanion();
    this.majBandeau();
    this.majTextes();
  }
  majBandeau() {
    const total = this.points.reduce((a, b) => a + b, 0);
    const v = Math.abs(this.vent) < 0.15 ? 'nul' : (this.vent > 0 ? '→' : '←').repeat(Math.abs(this.vent) > 0.6 ? 2 : 1);
    this.bandeau.setText(`Flèche ${Math.min(this.fleche, 3)} / 3  ·  Score : ${total}  ·  Vent ${v}`);
  }
  dessinerFanion() {
    const f = this.fanion.clear(), l = 26 + Math.abs(this.vent) * 34, s = this.vent >= 0 ? 1 : -1;
    f.fillStyle(0xc83a20).fillTriangle(642 + 2 * s, 152, 642 + 2 * s + s * l, 162 - Math.max(0, 0.4 - Math.abs(this.vent)) * 10, 642 + 2 * s, 172);
  }
  majTextes() {
    const e = this.etape;
    this.tL.setText('1. Largeur' + (e !== 'largeur' ? ' ✓' : '')).setColor(e === 'largeur' ? '#ffe08a' : '#fff4dc');
    this.tH.setText('2. Hauteur' + (e === 'puissance' || e === 'vol' ? ' ✓' : '')).setColor(e === 'hauteur' ? '#ffe08a' : '#fff4dc');
    this.tP.setText('3. Puissance' + (e === 'charge' ? '…' : '')).setColor(e === 'puissance' || e === 'charge' ? '#ffe08a' : '#fff4dc');
    this.aide.setText(e === 'puissance' || e === 'charge' ? 'maintiens, puis lâche\ndans la bande rouge' : '');
    this.indice.setText({ largeur: 'Clique quand le repère passe dans la zone rouge', hauteur: 'Clique quand le repère passe dans la zone rouge', puissance: 'Maintiens le clic (ou Espace)...', charge: '... et lâche dans la bande rouge !' }[e] || '');
  }

  // L'aller-retour d'un repère (0 → 1 → 0), selon le temps
  balancier() { const u = ((this.time.now - this.t0) / 1000 * this.vitesse) % 2; return u < 1 ? u : 2 - u; }

  update() {
    if (this.fini) return;
    if (this.etape === 'largeur') this.largeur = this.balancier();
    else if (this.etape === 'hauteur') this.hauteur = this.balancier();
    else if (this.etape === 'charge') this.puissance = Math.min(1, (this.time.now - this.t0) / 1300);
    this.dessinerJauges();
  }

  dessinerJauges() {
    const g = this.jauges.clear(), r = this.reperes.clear(), px = this.px;
    // largeur (en bas), zone rouge décalée par le vent
    const lx = 520, lw = 360, zl = this.zoneL;
    px(g, lx, 482, lw, 16, 0xe8d4a8);
    px(g, lx + lw * (zl - 0.2), 482, lw * 0.4, 16, 0xd8b878); px(g, lx + lw * (zl - 0.1), 482, lw * 0.2, 16, 0xc89a50); px(g, lx + lw * (zl - 0.04), 482, lw * 0.08, 16, 0xc83a20);
    px(r, lx + lw * this.largeur - 2, 476, 4, 28, 0x1a1008);
    // hauteur (à droite)
    const hy = 80, hh = 290, zh = this.zoneH;
    px(g, 902, hy, 16, hh, 0xe8d4a8);
    px(g, 902, hy + hh * (zh - 0.2), 16, hh * 0.4, 0xd8b878); px(g, 902, hy + hh * (zh - 0.1), 16, hh * 0.2, 0xc89a50); px(g, 902, hy + hh * (zh - 0.04), 16, hh * 0.08, 0xc83a20);
    if (this.etape !== 'largeur') px(r, 896, hy + hh * this.hauteur - 2, 28, 4, 0x1a1008);
    // puissance (à gauche) : se remplit du bas vers le haut ; la bonne bande, en rouge
    const py = 80, ph = 290, b = this.bandeP;
    px(g, 42, py, 16, ph, 0x3a2a1a);
    px(g, 42, py + ph * (1 - b - 0.06), 16, ph * 0.12, 0xc83a20, 0.45);
    if (this.puissance > 0) px(g, 42, py + ph * (1 - this.puissance), 16, ph * this.puissance, this.puissance > b + 0.06 ? 0xe86a3a : this.puissance > b - 0.06 ? 0xe8c040 : 0x6aa242);
    g.lineStyle(2, 0xfff4dc).strokeRect(42, py + ph * (1 - b - 0.06), 16, ph * 0.12);
    // le viseur : là où mènent la largeur (et la hauteur, une fois choisie)
    const [vx, vy] = this.impact(false);
    const v = this.viseur.clear(); v.lineStyle(2, 0x1a1008); v.strokeCircle(vx, vy, 10); v.lineBetween(vx - 16, vy, vx + 16, vy); v.lineBetween(vx, vy - 16, vx, vy + 10);
  }

  // Où arrive la flèche : l'écart à la zone rouge de chaque jauge, et l'erreur de puissance
  impact(avecPuissance = true) {
    const K = 115;
    const dx = (this.largeur - this.zoneL) * K;
    const dy = (this.etape === 'largeur' ? 0 : (this.hauteur - this.zoneH) * K) + (avecPuissance ? -(this.puissance - this.bandeP) * 120 : 0);
    return [this.cx + dx, this.cy + dy];
  }

  appui() {
    if (this.fini) return;
    if (this.etape === 'largeur') { Son.jouer('clic'); this.etape = 'hauteur'; this.t0 = this.time.now; }
    else if (this.etape === 'hauteur') { Son.jouer('clic'); this.etape = 'puissance'; }
    else if (this.etape === 'puissance') { this.etape = 'charge'; this.t0 = this.time.now; this.puissance = 0; }
    this.majTextes();
  }
  relache() {
    if (this.etape !== 'charge') return;
    this.etape = 'vol';
    this.majTextes();
    this.tirer();
  }

  // La flèche part, file vers la cible et se plante (ou se perd dans la paille, ou dans le pré)
  tirer() {
    const [ix, iy] = this.impact(true);
    const ecart = Math.hypot(ix - this.cx, iy - this.cy) / this.R;
    const pts = pointsFleche(ecart);
    this.flecheEncochee.setVisible(false);
    Son.jouer('siffle');
    const f = this.add.container(268, 330).setDepth(7);
    const fg = this.add.graphics(); fg.lineStyle(3, 0x8a6a40).lineBetween(0, 0, -20, 30); fg.fillStyle(0xc8ccd4).fillTriangle(-6, -4, 8, -12, 4, 4); fg.fillStyle(0xf4f0e8).fillTriangle(-24, 34, -16, 22, -30, 26);
    f.add(fg);
    this.tweens.add({ targets: f, x: ix, y: iy, scale: 0.35, duration: 420, ease: 'Quad.easeOut', onComplete: () => {
      f.destroy();
      // la flèche plantée, vue de face : l'empennage blanc
      const p = this.add.graphics().setDepth(5); this.px(p, ix - 2, iy - 2, 4, 4, 0x3a2410); this.px(p, ix - 4, iy - 8, 8, 6, 0xf4f0e8);
      Son.jouer(pts ? 'impact' : 'clic');
      this.cameras.main.shake(90, 0.003);
      const txt = pts ? `+${pts}` : 'Raté !';
      const t = this.add.text(ix, iy - 20, txt, style(pts >= 9 ? 30 : 22, pts >= 9 ? '#ffe08a' : pts ? '#fff4dc' : '#ff9a80', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 5 })).setOrigin(0.5).setDepth(8);
      this.tweens.add({ targets: t, y: iy - 60, alpha: 0, duration: 1300, delay: 300, onComplete: () => t.destroy() });
      if (pts >= 8) { Son.jouer('foule', { duree: 1.2 }); this.badauds.forEach((b, k) => this.tweens.add({ targets: b, y: b.y - 10, duration: 140, yoyo: true, repeat: 1, delay: k * 40 })); }
      this.points.push(pts);
      this.majBandeau();
      this.time.delayedCall(1200, () => (this.points.length >= SOLSTICE.tir.fleches ? this.resultat() : this.nouvelleFleche()));
    } });
  }

  // Les trois flèches tirées : les lots
  resultat() {
    this.fini = true; this.indice.setText('');
    const r = finirTir(this.G, this.points);
    if (r.titre || r.argent) Son.jouer('fanfare'); else Son.jouer('page');
    const c = this.add.container(0, 0).setDepth(20);
    c.add(this.add.rectangle(480, 270, 960, 540, 0x000000, 0.45));
    c.add(this.add.image(480, 262, panneauHD(this, 640, 290)).setScale(2));
    c.add(this.add.text(480, 160, r.titre ? '« Œil du Rempart » !' : `${r.total} points`, style(30, '#3b2410', { fontFamily: 'MedievalSharp, serif', fontStyle: 'bold' })).setOrigin(0.5));
    c.add(this.add.text(480, 198, `Tes flèches : ${this.points.join(' · ')}  —  total ${r.total} / 30`, style(14, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5));
    c.add(this.add.text(480, 258, r.texte, style(14, '#3b2410', { align: 'center', wordWrap: { width: 440 }, lineSpacing: 4 })).setOrigin(0.5));
    if (r.trefle) c.add(this.add.image(222, 258, iconeObjet(this, 'trefleSolstice')).setScale(3));
    if (r.argent) c.add(this.add.image(738, 258, 'pieceFace').setScale(3));
    const reste = partiesTirRestantes(this.G);
    if (reste > 0) { const b = creerBouton(this, 370, 352, 200, `Rejouer (${SOLSTICE.tir.prix} p.)`, () => {
      const erreur = commencerTir(this.G);
      if (erreur) return this.indice.setText(erreur);
      Son.jouer('pieces'); this.scene.restart({ retour: this.retour });
    }); c.add([b.fond, b.label]); b.fond.setDepth(21); b.label.setDepth(21); }
    const q = creerBouton(this, reste > 0 ? 590 : 480, 352, 200, 'Retour au marché', () => this.partir());
    c.add([q.fond, q.label]); q.fond.setDepth(21); q.label.setDepth(21);
  }

  partir() {
    this.cameras.main.fadeOut(400);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(this.retour));
  }
}
