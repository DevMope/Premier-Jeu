// (v1.05, lot B-3c, planche 35) Le marché pendant la Fête du Long Hiver : la neige sur la place, le grand
// sapin décoré, les guirlandes de sapin et leurs nœuds rouges, un bonhomme de neige, et la grande roue des
// cadeaux du Père Givrin à la place du coin des jeux.

// La grande roue : une texture peinte pixel par pixel (les parts selon les chances de chaque lot, les
// séparations blanches, la jante d'or et ses clous, le moyeu)
function texRoueHiver(scene, R = 40) {
  const cle = 'roueHiver_' + R;
  if (scene.textures.exists(cle)) return cle;
  const T = 2 * R + 4, c = T / 2, can = scene.textures.createCanvas(cle, T, T), ctx = can.getContext(), img = ctx.createImageData(T, T);
  const total = HIVER.lots.reduce((a, l) => a + l.poids, 0), tour = Math.PI * 2;
  const bornes = []; let a0 = 0;
  for (const l of HIVER.lots) { const a1 = a0 + l.poids / total * tour; bornes.push([a0, a1, l.couleur]); a0 = a1; }
  const nuance = (col, k) => [(col >> 16) & 255, (col >> 8) & 255, col & 255].map(v => Math.max(0, Math.min(255, Math.round(v * k))));
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const dx = x + 0.5 - c, dy = y + 0.5 - c, d = Math.hypot(dx, dy), ang = (Math.atan2(dx, -dy) + tour) % tour;
    let rgb = null;
    if (d > R + 1.5) continue;
    if (d > R) rgb = [42, 26, 16];                                                   // le contour
    else if (d > R - 4) {                                                             // la jante d'or, éclairée en haut à gauche
      const lum = 0.8 + 0.35 * Math.max(0, -(dx + dy) / (d * 1.41));
      rgb = nuance(0xd8a830, d > R - 1 ? lum * 0.75 : lum);
      for (const [b] of bornes) { const px = c + Math.sin(b) * (R - 2), py = c - Math.cos(b) * (R - 2); if (Math.hypot(x + 0.5 - px, y + 0.5 - py) < 1.6) rgb = [255, 248, 220]; }
    } else if (d < R * 0.16) rgb = d < R * 0.07 ? [200, 40, 40] : nuance(0xd8a830, d < R * 0.12 ? 1.1 : 0.7);   // le moyeu
    else {
      const [b0, b1, col] = bornes.find(([b0, b1]) => ang >= b0 && ang < b1) || bornes[0];
      const bord = Math.min(ang - b0, b1 - ang) * d;
      rgb = bord < 1.1 ? [250, 246, 236] : nuance(col, 0.82 + 0.3 * (1 - d / R) + (Math.floor(d / 3) % 2 ? 0.04 : 0));
      if (d > R - 5.5) rgb = nuance(col, 0.62);   // (l'ombre de la jante)
    }
    const i = (y * T + x) * 4; img.data[i] = rgb[0]; img.data[i + 1] = rgb[1]; img.data[i + 2] = rgb[2]; img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0); can.refresh();
  return cle;
}
// L'angle (depuis le haut, sens horaire) du milieu d'une part de la roue, un peu décalé au hasard
function angleLotRoue(index, jeu = 0) {
  const total = HIVER.lots.reduce((a, l) => a + l.poids, 0);
  let a = 0; for (let i = 0; i < index; i++) a += HIVER.lots[i].poids;
  const largeur = HIVER.lots[index].poids / total * Math.PI * 2;
  return a / total * Math.PI * 2 + largeur * (0.5 + jeu * 0.36);
}
// L'icône d'un lot de la roue (les pièces : une pièce d'or)
function iconeLotRoue(scene, id) {
  creerIconesHD(scene); creerPiecesHD(scene);
  return { provisions: iconeObjet(scene, 'ration'), pieces: 'pieceFace', vetement: iconeObjet(scene, 'bonnetHiver'), arme: iconeObjet(scene, 'hache'), deco: iconeObjet(scene, 'carillon'), grosLot: iconeObjet(scene, 'sapinCristal') }[id] || iconeObjet(scene, id);
}

// Le grand sapin de la place, peint en gros pixels : ses étages enneigés, la guirlande rouge, les boules,
// les bougies et l'étoile d'or. Renvoie { g, etoile, lueurs } (la nuit, les bougies et l'étoile brillent).
function grandSapin(scene, x, ySol, h, { nuit = false, u = 2 } = {}) {
  const cont = scene.add.container(0, 0), g = scene.add.graphics();   // (le conteneur prend sa place tout de suite : l'étoile, créée après, passe devant)
  const px = (xx, yy, w, hh, col, a = 1) => g.fillStyle(col, a).fillRect(Math.round(xx / u) * u, Math.round(yy / u) * u, Math.max(u, Math.round(w / u) * u), Math.max(u, Math.round(hh / u) * u));
  const hTronc = h * 0.08, haut = ySol - h, bas = ySol - hTronc;
  // le bac de bois cerclé de fer et son ruban
  px(x - h * 0.11, ySol - hTronc * 1.4, h * 0.22, hTronc * 1.4, 0x6a4020); px(x - h * 0.11, ySol - hTronc * 1.4, h * 0.22, u, 0x3a2410);
  px(x - h * 0.11, ySol - hTronc * 0.8, h * 0.22, u * 2, 0x4a4a52); px(x - u, ySol - hTronc * 1.4, u * 2, hTronc * 1.4, 0xc02a2a);
  // (v1.63) le sapin lui-même : peint comme tous les sapins (arbresHD.js), ses étages et la neige posée dessus ; la
  // toile à demi-résolution, affichée ×2 ; les décorations (graphics) par-dessus, dans le cône de ses branches
  const H = Math.round(h / 2), cle = toileArbreHD(scene, `grandSapinHD_${H}`, 'sapin', 'givre', H, 3, { neige: true, etroit: 1.45, L: Math.round(H * 1.1) + 8 });
  const img = scene.add.image(x, ySol, cle).setOrigin(0.5, origineArbre(scene, cle)).setScale(2);
  const etages = 5, demi = yy => Math.max(0, (yy - haut) / (ySol - 0.1 * h - haut)) * 0.36 * h;   // (la demi-largeur pleine des branches à cette hauteur)
  // la guirlande rouge qui descend en festons
  for (let e = 1; e < etages; e++) { const y0 = haut + e / etages * (bas - haut) - u * 3; const w = demi(y0) * 0.9; for (let k = -w; k <= w; k += u) px(x + k, y0 + Math.sin((k / w + 1) * Math.PI) * h * 0.025 + (k / w) * h * 0.03, u, u, 0xd0302c); }
  // les boules (or, rouge, bleu)
  const lueurs = [];
  let graine = Math.round(x * 7 + h);
  const rnd = () => { graine = (graine * 16807) % 2147483647; return graine / 2147483647; };
  for (let k = 0; k < Math.round(h / 9); k++) {
    const yy = haut + h * 0.14 + rnd() * (bas - haut - h * 0.18), w = demi(yy) * 0.82, xx = x + (rnd() * 2 - 1) * w;
    const col = [0xe8b830, 0xd03030, 0x3a7ad8, 0xf4f0e8][k % 4];
    px(xx - u, yy - u, u * 2.5, u * 2.5, col); px(xx - u, yy - u, u, u, 0xffffff, 0.7);
    if (nuit && k % 2 === 0) lueurs.push([xx, yy, col]);
  }
  // les bougies sur les branches
  for (let k = 0; k < Math.round(h / 22); k++) {
    const yy = haut + h * 0.2 + rnd() * (bas - haut - h * 0.25), w = demi(yy) * 0.75, xx = x + (rnd() * 2 - 1) * w;
    px(xx, yy - u * 3, u, u * 3, 0xf4f0e0); px(xx, yy - u * 5, u, u * 2, 0xffc040);
    lueurs.push([xx + u / 2, yy - u * 4, 0xffb040]);
  }
  // l'étoile d'or, tout en haut
  const etoile = scene.add.graphics(); const r = Math.max(6, h * 0.05);
  const pts = []; for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.45 : r; pts.push({ x: Math.cos(a) * rr, y: Math.sin(a) * rr }); }
  etoile.fillStyle(0x6a4a10).fillPoints(pts.map(p => ({ x: p.x * 1.25, y: p.y * 1.25 })), true).fillStyle(0xf8d040).fillPoints(pts, true).fillStyle(0xfff4b0).fillCircle(-r * 0.15, -r * 0.2, r * 0.25);
  etoile.setPosition(x, haut + r * 0.2);
  cont.add([img, g]);
  return { g: cont, etoile, lueurs, haut };
}

// Une guirlande de sapin entre x0 et x1, qui pend en creux, avec des nœuds rouges et des boules d'or
function guirlandeSapin(scene, c, x0, x1, y, creux, pas = 66) {
  const g = scene.add.graphics();
  const fil = x => y + Math.sin((x - x0) / (x1 - x0) * Math.PI) * creux;
  for (let x = x0; x <= x1; x += 3) { g.fillStyle([0x1e5232, 0x2e7a42, 0x245e36][Math.floor(x / 3) % 3]).fillCircle(x, fil(x) + (Math.floor(x / 3) % 2 ? 1 : -1), 3.4); }
  for (let x = x0 + pas / 2; x < x1; x += pas) {
    const yy = fil(x);
    g.fillStyle(0xc8282a).fillTriangle(x, yy, x - 7, yy - 4, x - 7, yy + 4).fillTriangle(x, yy, x + 7, yy - 4, x + 7, yy + 4).fillRect(x - 2, yy - 2, 4, 4);
    g.fillStyle(0xa01e20).fillTriangle(x, yy + 1, x - 4, yy + 9, x - 1, yy + 9).fillTriangle(x, yy + 1, x + 4, yy + 9, x + 1, yy + 9);
    g.fillStyle(0xe8b830).fillCircle(x + pas / 2, fil(x + pas / 2) + 6, 3).fillStyle(0xfff4c0).fillRect(x + pas / 2 - 1, fil(x + pas / 2) + 4, 1, 1);
  }
  c.add(g);
  return g;
}

Object.assign(MarcheScene.prototype, {
  // La vue d'ensemble en fête : la neige sur la place, les guirlandes de sapin, le grand sapin, le bonhomme
  decorHiverVue() {
    const c = this.vue;
    // la neige tassée sur les pavés (sous tout le reste)
    const neige = this.add.graphics();
    let s = 11; const rnd = (a, b) => { s = (s * 16807) % 2147483647; return a + (s / 2147483647) * (b - a); };
    for (let k = 0; k < 70; k++) { const yy = rnd(276, 482), ww = rnd(30, 90) * (0.5 + (yy - 276) / 206); neige.fillStyle(0xf4f8fc, rnd(0.55, 0.85)).fillEllipse(rnd(0, 960), yy, ww, ww * 0.22); }
    neige.fillStyle(0xf4f8fc, 0.9).fillRect(0, 474, 960, 8);
    c.addAt(neige, 0);
    // les fanions cèdent la place à une guirlande de sapin
    if (this.guirlandeFanions) this.guirlandeFanions.setVisible(false);
    const g = guirlandeSapin(this, c, 40, 920, 132, 30);
    c.moveDown(g);
    // le grand sapin, entre la carte et la fontaine (derrière les étiquettes)
    const sapin = grandSapin(this, 340, 478, 176);
    const rang = c.getIndex(neige) + 1;
    c.addAt([sapin.g, sapin.etoile], rang + 1);
    this.tweens.add({ targets: sapin.etoile, scale: 1.18, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    creerHalo(this);
    const halo = this.add.image(340, sapin.haut + 6, 'halo').setScale(0.5).setTint(0xffe080).setAlpha(0.4).setBlendMode(Phaser.BlendModes.ADD);
    c.addAt(halo, rang + 1);
    this.tweens.add({ targets: halo, alpha: 0.15, duration: 900, yoyo: true, repeat: -1 });
    // le bonhomme de neige, que les enfants ont fait près de la charrette
    const b = this.add.graphics(), bx = 792, by = 474;
    b.fillStyle(0xdde6f0).fillCircle(bx, by - 14, 16).fillStyle(0xf8fbff).fillCircle(bx - 2, by - 16, 13);
    b.fillStyle(0xdde6f0).fillCircle(bx, by - 38, 11).fillStyle(0xf8fbff).fillCircle(bx - 1, by - 39, 9);
    b.fillStyle(0x1a1410).fillCircle(bx - 3, by - 41, 1.4).fillCircle(bx + 3, by - 41, 1.4).fillCircle(bx, by - 26, 1.4).fillCircle(bx, by - 18, 1.4);
    b.fillStyle(0xe87020).fillTriangle(bx, by - 39, bx + 8, by - 38, bx, by - 36);
    b.fillStyle(0xc82a20).fillRect(bx - 9, by - 31, 18, 4).fillRect(bx + 4, by - 31, 4, 11);
    b.fillStyle(0x2a2420).fillRect(bx - 8, by - 50, 16, 3).fillRect(bx - 5, by - 59, 10, 9);
    b.lineStyle(2, 0x5a3a20).lineBetween(bx - 11, by - 22, bx - 26, by - 32).lineBetween(bx + 11, by - 22, bx + 24, by - 31);
    c.addAt(b, rang + 2);
  },

  // La rue en fête : des guirlandes de sapin d'un étal à l'autre
  decorHiverRue() {
    const c = this.add.container(0, 0);
    for (let x = 0; x < LARGEUR_MARCHE; x += 380) guirlandeSapin(this, c, x, x + 380, 26, 20, 76);
    this.monde.add(c);
    this.monde.moveAbove(c, this.paveRue);   // (derrière les étals, devant le ciel)
    this.etiquettesRue.push(c);
  },

  // --- La grande roue des cadeaux du Père Givrin (à la place du coin des jeux) ---
  creerRoue(x0) {
    const avant = this.children.list.length;
    this.add.image(x0, 252, etalHD(this, 0xb0242a)).setOrigin(0.5, 1).setScale(2);
    this.add.text(x0, 92, 'LA GRANDE ROUE', style(12, '#fff4dc', { fontStyle: 'bold', stroke: '#5a0a0a', strokeThickness: 4 })).setOrigin(0.5);
    // la roue sur son poteau, qui tourne doucement
    const g = this.add.graphics();
    g.fillStyle(0x4a3018).fillRect(x0 - 56, 160, 6, 92).fillStyle(0x6a4424).fillRect(x0 - 54, 160, 2, 92);
    g.fillStyle(0x3a2410).fillRect(x0 - 70, 246, 34, 6);
    const roue = this.add.image(x0 - 53, 160, texRoueHiver(this, 30)).setScale(1.5);
    this.tweens.add({ targets: roue, angle: 360, duration: 14000, repeat: -1 });
    const fleche = this.add.graphics(); fleche.fillStyle(0x2a1a10).fillTriangle(x0 - 60, 102, x0 - 46, 102, x0 - 53, 118).fillStyle(0xe8b830).fillTriangle(x0 - 58, 103, x0 - 48, 103, x0 - 53, 114);
    // le Père Givrin derrière sa table, et la pile de paquets
    this.givrin = imageCorps(this, x0 + 40, 226, 'givrin', 4.5).setFlipX(true);
    this.tweens.add({ targets: this.givrin, angle: { from: -2, to: 2 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const p = this.add.graphics();
    for (const [bx, by, w, h, col] of [[x0 - 18, 200, 18, 14, 0x2e7a42], [x0 + 2, 204, 14, 10, 0x3a7ad8], [x0 - 12, 188, 12, 12, 0xd03030]]) {
      p.fillStyle(col).fillRect(bx, by, w, h).fillStyle(0xe8b830).fillRect(bx + w / 2 - 1, by, 2, h).fillRect(bx, by + h / 2 - 1, w, 2);
      p.fillStyle(0xe8b830).fillTriangle(bx + w / 2, by, bx + w / 2 - 4, by - 4, bx + w / 2 - 4, by + 1).fillTriangle(bx + w / 2, by, bx + w / 2 + 4, by - 4, bx + w / 2 + 4, by + 1);
    }
    this.etiquettesRue.push(this.add.text(x0, 262, 'La grande roue', style(13, '#fff4dc', { fontStyle: 'bold', stroke: '#2a1a10', strokeThickness: 4 })).setOrigin(0.5));
    this.add.rectangle(x0 - 10, 180, 190, 150, 0xffffff, 0).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.ouvrirRoue());
    this.grouper(avant, x0);
  },

  ouvrirRoue() {
    const G = this.G;
    this.montrer('jeux');
    const c = this.panneau('La grande roue du Long Hiver', 'Tenue par le Père Givrin, le temps de la fête');
    const R = HIVER.roue, reste = toursRoueRestants(G);
    c.add(this.add.text(40, 340, `« Approche, approche ! Un tour de roue, et le Long Hiver te gâte ! »\n${R.prix} pièces le tour · un tour par jour.`, style(12, '#3b2410', { lineSpacing: 3, wordWrap: { width: 470 } })));
    HIVER.lots.forEach((l, i) => {
      const x = 52 + (i % 3) * 160, y = 396 + Math.floor(i / 3) * 28;
      c.add(this.add.rectangle(x, y, 14, 14, l.couleur).setStrokeStyle(2, 0x2a1a10));
      c.add(this.add.text(x + 12, y, `${l.nom} ${l.poids} %`, style(12, '#3b2410', { fontStyle: l.id === 'grosLot' ? 'bold' : 'normal' })).setOrigin(0, 0.5));
    });
    const gagnes = HABITS_HIVER.filter(h => possede(G, h)).length;
    c.add(this.add.text(40, 446, `Gros lot : le sapin de cristal (+0,4 client/jour) · habits d'hiver gagnés : ${gagnes}/${HABITS_HIVER.length}`, style(11, '#6b4a2a', { fontStyle: 'italic' })));
    c.add(this.add.text(780, 446, reste > 0 ? 'ton tour du jour t\'attend' : 'tu as eu ton tour aujourd\'hui', style(11, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5));
    const b = creerBouton(this, 780, 408, 220, `Tourner la roue (${R.prix} p.)`, () => {
      if (this.jeuLance || this.sortieEnCours()) return;   // (v1.08 : pas deux départs à la fois)
      if (toursRoueRestants(G) <= 0) return this.message("Le Père Givrin arrête la roue : « Un tour par jour, mon petit. Reviens demain ! »", '#a03030');
      if (!peutPayer(G, R.prix)) return this.message(manqueArgent(G, R.prix, "Pas assez d'argent pour un tour."), '#a03030');
      this.jeuLance = true; this._transition = performance.now();
      this.cameras.main.fadeOut(400);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Roue', { retour: 'Marche' }));
    });
    c.add([b.fond, b.label]);
  },
});
