// (v1.23, C-6, planche 48 v2) La vitrine des collections : six séries, une étagère chacune. Les pièces qui
// manquent restent en ombre. Un clic sur la carte ancienne l'ouvre sur le bureau, à la bougie.

// Une pièce de collection, dessinée (x, y : son centre ; e : l'échelle ; la : possédée, sinon en ombre)
function dessinerPieceCollection(s, serie, piece, x, y, e = 1, la = true) {
  const ombre = o => { if (!la) { (o.list || [o]).forEach(k => k.setTint && k.setTint(0x000000)); o.setAlpha(0.22); } return o; };
  // un écu de bois verni, l'emblème dessus (les trophées, l'écu des Bannis, et pour l'instant les reliques du Conseil)
  const ecu = cle => { const c = s.add.container(x, y), g = s.add.graphics();
    g.fillStyle(0x3a2210).fillRoundedRect(-17 * e, -20 * e, 34 * e, 40 * e, 6 * e).fillStyle(0x7a4a22).fillRoundedRect(-15 * e, -18 * e, 30 * e, 36 * e, 5 * e).fillStyle(0xc9a227).fillRect(-15 * e, 14 * e, 30 * e, 3 * e);
    c.add(g); const em = s.add.image(0, -2 * e, 'embleme_' + cle); em.setScale(28 * e / em.width); c.add(em); return ombre(c); };
  if (serie === 'trophees') return ecu(EMBLEME_ROYAUME[piece] || piece);
  if (serie === 'conseil') return ecu('conseil');
  if (serie === 'bannis' && piece === 'ecu') return ecu('bannis');
  if (serie === 'armes' || serie === 'bannis') return ombre(s.add.image(x, y, iconeObjet(s, piece)).setScale(2 * e).setAngle(-30));
  const g = s.add.graphics({ x, y });
  if (serie === 'nymphe') {
    const k = Object.keys(COLLECTIONS.nymphe.pieces).indexOf(piece);
    if (k === 0) { g.fillStyle(0xf0c8b0); for (let i = -3; i <= 3; i++) g.fillTriangle(0, 10 * e, i * 4 * e - 3 * e, -9 * e, i * 4 * e + 3 * e, -9 * e); g.fillStyle(0xd09a80).fillRect(-3 * e, 8 * e, 6 * e, 4 * e); }
    if (k === 1) g.fillStyle(0x6a8aa0).fillCircle(0, 2 * e, 10 * e).fillStyle(0xf8f4ec).fillCircle(0, 2 * e, 7 * e).fillStyle(0xffffff).fillCircle(-2 * e, 0, 2.5 * e);
    if (k === 2) g.fillStyle(0x4ab0a0).fillEllipse(0, 0, 14 * e, 22 * e).fillStyle(0x8ae0d0).fillEllipse(-2 * e, -3 * e, 5 * e, 10 * e);
    if (k === 3) { g.fillStyle(0x3a8a3a).fillEllipse(0, 6 * e, 26 * e, 8 * e); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; g.fillStyle(0xf8d0e8).fillEllipse(Math.cos(a) * 5 * e, -2 * e + Math.sin(a) * 4 * e, 9 * e, 6 * e); } g.fillStyle(0xf8e070).fillCircle(0, -2 * e, 3 * e); }
    if (k === 4) g.fillStyle(0x8a6a2a).fillCircle(0, 0, 10 * e).fillStyle(0xc0a040).fillCircle(0, 0, 8 * e).lineStyle(1.5 * e, 0x6a4a1a).strokeCircle(0, 0, 5 * e);
  } else {   // un fragment de la carte ancienne
    const k = Object.keys(COLLECTIONS.carte.pieces).indexOf(piece);
    const pts = [[-14, -12], [10, -15], [15, 3], [6, 14], [-12, 12], [-16, 0]].map(([a, b]) => ({ x: (a + (k % 3) * 1.5) * e, y: (b - (k % 2) * 2) * e }));
    g.fillStyle(0xd8c090).fillPoints(pts, true).lineStyle(1.2 * e, 0x7a5a2a).strokePoints(pts, true);
    g.lineStyle(1.5 * e, 0x8a2a1a, 0.8).beginPath().moveTo(-10 * e, (k % 2 ? 6 : -4) * e).lineTo(0, 2 * e).lineTo(10 * e, (k % 2 ? -6 : 5) * e).strokePath();
    g.fillStyle(0x5a4a2a).fillCircle(-4 * e, -6 * e, 1.5 * e).fillCircle(5 * e, 7 * e, 1.5 * e);
  }
  if (!la) g.setAlpha(0.18);
  return g;
}

class VitrineScene extends Phaser.Scene {
  constructor() { super('Vitrine'); }
  init(data) { this.retour = data.retour || 'Comptoir'; this.vue = data.vue || 'vitrine'; }

  create() {
    const G = this.G = window.GAME;
    creerInterieurHD(this); creerBureauHD(this); creerEmblemesHD(this); creerObjetsHD(this); creerIconesHD(this); creerPiecesHD(this); creerCarteHD(this);
    collections(G);
    if (this.vue === 'carte') this.carteAncienne(); else this.vitrine();
  }

  // (v1.31) les masques (make.graphics) ne sont pas dans la scène : on les détruit à la main
  vider() { this.children.removeAll(true); this.tweens.killAll(); (this.masques || []).forEach(m => m.destroy()); this.masques = []; }
  masque(g) { (this.masques = this.masques || []).push(g); return g; }

  vitrine() {
    this.vider(); this.vue = 'vitrine';
    const G = this.G;
    this.add.image(0, 0, 'bureauBois').setOrigin(0).setScale(2).setTint(0x8a6a4a);
    vignette(this, 0.75, 0);
    const x0 = 132, y0 = 66, L = 696, Hc = 132, g = this.add.graphics();
    g.fillStyle(0x2a160a).fillRoundedRect(x0 - 14, y0 - 40, L + 28, Hc * 3 + 70, 10).fillStyle(0x5a3418).fillRoundedRect(x0 - 8, y0 - 34, L + 16, Hc * 3 + 58, 8);
    g.fillStyle(0xc9a227).fillRect(x0 - 8, y0 - 34, L + 16, 4);
    this.add.text(x0 + L / 2, y0 - 18, 'LA VITRINE DES COLLECTIONS', style(15, '#f3d98a', { fontStyle: 'bold' })).setOrigin(0.5);
    this.info = this.add.text(480, 500, 'Passe sur une pièce pour la voir ; la carte ancienne s\'ouvre d\'un clic.', style(13, '#f3e6c8', { fontStyle: 'italic', align: 'center', wordWrap: { width: 600 } })).setOrigin(0.5);
    Object.keys(COLLECTIONS).forEach((serie, k) => {
      const C = COLLECTIONS[serie], col = k % 2, row = Math.floor(k / 2), cx = x0 + col * (L / 2), cy = y0 + row * Hc, l = L / 2 - 6;
      const complete = serieComplete(G, serie), n = nbPieces(G, serie), total = totalSerie(serie);
      g.fillStyle(0x1e140c).fillRect(cx + 3, cy + 3, l, Hc - 6).fillStyle(complete ? 0x4a3420 : 0x3a2a1e).fillRect(cx + 6, cy + 6, l - 6, Hc - 12);
      g.fillStyle(0x6a4422).fillRect(cx + 6, cy + Hc - 30, l - 6, 5);   // la planche de l'étagère
      if (complete) g.lineStyle(2, 0xc9a227).strokeRect(cx + 6, cy + 6, l - 6, Hc - 12);
      // le reflet de la vitre
      g.fillStyle(0xffffff, 0.04).fillTriangle(cx + l - 80, cy + 6, cx + l - 40, cy + 6, cx + l - 110, cy + Hc - 8);
      this.add.text(cx + 14, cy + 12, C.nom, style(13, '#f3e6c8', { fontStyle: 'bold' }));
      this.add.text(cx + l - 8, cy + 12, `${n} / ${total}`, style(13, complete ? '#ffe066' : '#d8c8a8', { fontStyle: 'bold' })).setOrigin(1, 0);
      // (v1.31) la ligne du bas tient dans l'étagère : plus petite s'il le faut, puis le bonus seul
      const bas = this.add.text(cx + 14, cy + Hc - 22, complete ? `« ${C.titre} » · ${C.bonus}` : `complète : ${C.bonus}`, style(11, complete ? '#c8f0a0' : '#c8b898', { fontStyle: 'italic' }));
      for (let t = 12; bas.width > l - 22 && t >= 10; t--) bas.setFontSize(t);
      if (bas.width > l - 22) bas.setText(complete ? C.bonus : `complète : ${C.bonus}`);
      for (let t = 10; bas.width > l - 22 && t >= 8; t--) bas.setFontSize(t);
      const pieces = Object.keys(C.pieces), pas = Math.min(54, (l - 30) / pieces.length);
      pieces.forEach((piece, i) => {
        const px = cx + 34 + i * pas, py = cy + 64, la = aPiece(G, serie, piece);
        const o = dessinerPieceCollection(this, serie, piece, px, py, 1, la);
        if (la) this.tweens.add({ targets: o, y: (o.y || py) - 2, duration: 1400 + i * 120, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });   // (un petit reflet de vie)
        const zone = this.add.rectangle(px, py, pas - 4, 52, 0xffffff, 0).setInteractive({ useHandCursor: serie === 'carte' });
        zone.on('pointerover', () => this.info.setText(la ? `${C.pieces[piece]} — ${C.nom.toLowerCase()}` : `Il te manque une pièce : ${C.source}.`));
        zone.on('pointerout', () => this.info.setText('Passe sur une pièce pour la voir ; la carte ancienne s\'ouvre d\'un clic.'));
        if (serie === 'carte') zone.on('pointerdown', () => { Son.jouer('page'); this.carteAncienne(); });
      });
    });
    const titres = titresCollections(G);
    if (titres.length) this.add.text(480, 470, `Tes titres : ${titres.map(t => `« ${t} »`).join(' · ')}`, style(13, '#ffe066', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 3, align: 'center', wordWrap: { width: 800 } })).setOrigin(0.5);
    creerBouton(this, 850, 515, 160, 'Fermer', () => this.fermer());
  }

  // La carte ancienne : la vraie carte du monde, vieillie et déchirée en six morceaux, sur le bureau à la bougie
  carteAncienne() {
    this.vider(); this.vue = 'carte';
    const G = this.G, s = this;
    s.add.image(0, 0, 'bureauBois').setOrigin(0).setScale(2);
    s.add.rectangle(480, 270, 960, 540, 0x1a0e04, 0.35);
    lumiere(s, 820, 120, 520, 0xffb050, 0.5);
    const S = 0.8, X0 = 46, Y0 = 70, W = 932, H = 400, P = (x, y) => ({ x: X0 + x * S, y: Y0 + y * S });
    const decoupe = [
      [[0, 0], [300, 0], [306, 60], [296, 130], [303, 196], [220, 190], [150, 200], [70, 192], [0, 198]],
      [[300, 0], [612, 0], [606, 70], [614, 120], [604, 184], [520, 178], [440, 188], [360, 180], [303, 196], [296, 130], [306, 60]],
      [[612, 0], [W, 0], [W, 204], [840, 198], [740, 206], [660, 196], [604, 184], [614, 120], [606, 70]],
      [[0, 198], [70, 192], [150, 200], [220, 190], [303, 196], [310, 280], [296, 340], [318, H], [0, H]],
      [[303, 196], [360, 180], [440, 188], [520, 178], [604, 184], [598, 260], [610, 330], [596, H], [318, H], [296, 340], [310, 280]],
      [[604, 184], [660, 196], [740, 206], [840, 198], [W, 204], [W, H], [596, H], [610, 330], [598, 260]],
    ];
    const ids = Object.keys(COLLECTIONS.carte.pieces), n = nbPieces(G, 'carte');
    const masqueTrace = this.masque(s.make.graphics());
    decoupe.forEach((poly, i) => {
      const dx = [0, 6, 0, 0, 4, 10][i], dy = [0, 3, 0, 0, 8, 5][i];
      const pts = poly.map(([x, y]) => { const q = P(x, y); return { x: q.x + dx, y: q.y + dy }; });
      if (!aPiece(G, 'carte', ids[i])) { s.add.graphics().lineStyle(2, 0xd8c090, 0.25).strokePoints(pts, true); return; }
      s.add.graphics().fillStyle(0x0a0602, 0.45).fillPoints(pts.map(q => ({ x: q.x + 5, y: q.y + 6 })), true);
      const im = s.add.image(X0 + dx, Y0 + dy, 'carteHD').setOrigin(0).setScale(S).setTint(0xd8b48a);
      const m = this.masque(s.make.graphics()); m.fillStyle(0xffffff).fillPoints(pts, true); im.setMask(m.createGeometryMask());
      masqueTrace.fillStyle(0xffffff).fillPoints(pts, true);
      const taches = s.add.graphics(); taches.setMask(m.createGeometryMask());
      for (let k = 0; k < 6; k++) taches.fillStyle(0x5a3a14, 0.08 + (k % 3) * 0.03).fillCircle(pts[0].x + 40 + ((k * 97 + i * 53) % 200), pts[0].y + 30 + ((k * 61 + i * 37) % 120), 18 + (k * 7) % 22);
      s.add.graphics().lineStyle(3, 0xf0e2b8, 0.9).strokePoints(pts, true).lineStyle(1, 0x6a4a20, 0.6).strokePoints(pts.map(q => ({ x: q.x + 1, y: q.y + 1 })), true);
    });
    // le tracé très ancien, à l'encre rouge, bien à l'ouest de la Grande Muraille (seulement sur les morceaux qu'on a)
    if (n) {
      const tr = s.add.graphics(); tr.setMask(masqueTrace.createGeometryMask());
      for (let y = 8; y < 392; y += 9) { const x = 452 + Math.sin(y / 40) * 12, q = P(x, y), q2 = P(452 + Math.sin((y + 5) / 40) * 12, y + 5); tr.lineStyle(3, 0x9a1a10, 0.9).lineBetween(q.x + 6, q.y + 3, q2.x + 6, q2.y + 3); }
      s.tweens.add({ targets: tr, alpha: 0.55, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      if (aPiece(G, 'carte', 'f2')) { const lm = P(470, 40); s.add.text(lm.x + 10, lm.y, 'un tracé ancien...', style(13, '#7a1a10', { fontStyle: 'bold italic', stroke: '#f0e2b8', strokeThickness: 3 })); }
      if (aPiece(G, 'carte', 'f3') || aPiece(G, 'carte', 'f6')) { const mu = P(690, 120); s.add.text(mu.x + 44, mu.y + 40, 'la Grande Muraille', style(12, '#3a2410', { fontStyle: 'italic', stroke: '#f0e2b8', strokeThickness: 3 })).setAngle(88); }
    }
    // la bougie dans sa coupelle de laiton, vue de dessus, et quelques pièces
    const bx = 880, by = 96, g = s.add.graphics();
    g.fillStyle(0x1a0e04, 0.4).fillCircle(bx + 4, by + 5, 30).fillStyle(0x8a6a2a).fillCircle(bx, by, 28).fillStyle(0xc9a227).fillCircle(bx, by, 24).fillStyle(0xe8c860).fillCircle(bx - 6, by - 6, 6);
    g.fillStyle(0xf0e8d0).fillCircle(bx, by, 11).fillStyle(0xd8ccb0).fillCircle(bx + 2, by + 2, 8).fillStyle(0x2a1a0a).fillCircle(bx, by, 2);
    const fl = s.add.ellipse(bx, by - 3, 9, 14, 0xffd060).setDepth(2); s.add.ellipse(bx, by - 2, 4, 7, 0xfff4c0).setDepth(2.1);
    s.tweens.add({ targets: fl, scaleX: 0.8, scaleY: 1.15, duration: 300, yoyo: true, repeat: -1 });
    for (const [x, y] of [[872, 470], [890, 478], [860, 482]]) s.add.image(x, y, 'pieceFace').setScale(2.2);
    // JeuneGoy en médaillon, qui rêve devant la carte, et ce qu'il pense
    const mx = 880, my = 300, md = s.add.container(mx, my).setDepth(10);
    md.add(s.add.circle(0, 0, 48, 0x2a1a10)); md.add(s.add.circle(0, 0, 45, 0xc9a227)); md.add(s.add.circle(0, 0, 41, 0x3a4a6a));
    const j = s.add.image(mx, my + 132, textureJoueur(s, G)).setOrigin(0.5, 1).setScale(echelleJoueur(11)).setDepth(10.1);
    const mk = this.masque(s.make.graphics()).fillCircle(mx, my, 41); j.setMask(mk.createGeometryMask());
    s.tweens.add({ targets: j, y: j.y - 2, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const manque = totalSerie('carte') - n;
    const pense = !n ? '« Rien qu\'un vieux coin de table... Un jour, peut-être, j\'aurai un morceau de cette carte dont parlent les anciens. »'
      : manque ? `« Ce chemin passe à l'ouest de la Muraille... Personne n'en parle jamais. Où mène-t-il ? Il me manque ${manque > 1 ? manque + ' morceaux' : 'un morceau'}. »`
      : '« La carte est entière. Le chemin passe à l\'ouest de la Muraille, là où personne ne va... Je l\'ai reporté sur ma carte. Un jour, j\'irai voir. »';
    const t = s.add.text(690, 452, pense, style(13, '#3b2410', { fontStyle: 'italic', align: 'center', wordWrap: { width: 270 } })).setOrigin(0.5).setDepth(11);
    const h = t.height + 18, gb = s.add.graphics().setDepth(10.9);
    gb.fillStyle(0x2a1a10).fillRoundedRect(690 - 147, 452 - h / 2 - 2, 294, h + 4, 16).fillStyle(0xfff8e8).fillRoundedRect(690 - 145, 452 - h / 2, 290, h, 15);
    for (const [x, y, r] of [[810, 452 - h / 2 - 12, 8], [840, 452 - h / 2 - 32, 5]]) gb.fillStyle(0x2a1a10).fillCircle(x, y, r + 2).fillStyle(0xfff8e8).fillCircle(x, y, r);
    s.add.text(460, 40, `La carte ancienne · ${n} / ${totalSerie('carte')}`, style(16, '#f3d98a', { fontStyle: 'bold', stroke: '#1a0e04', strokeThickness: 5 })).setOrigin(0.5);
    creerBouton(this, 110, 515, 170, '◂ La vitrine', () => { Son.jouer('page'); this.vitrine(); });
  }

  fermer() { this.scene.stop(); this.scene.resume(this.retour); }
}
