// (v1.53, planche 62 validée) Ce qu'on voit du temps qu'il fait : les icônes HD (bandeau, ardoise), l'ardoise de Madame
// Ysmée dans la rue, et l'ambiance d'une scène dehors (le ciel couvert, la pluie qui tombe vraiment, les flaques et leurs
// reflets, l'éclair et le tonnerre, l'air qui tremble à la canicule, les feuilles au vent, la neige qui tombe dru).
// Tout reste sous l'interface des scènes (profondeur 12 à 14 ; l'interface est à 30).

// Les icônes du temps, en pixels : relief, contour, comme les objets du jeu
function iconeMeteoHD(scene, type) {
  const cle = 'meteoHD_' + type; if (scene.textures.exists(cle)) return cle;
  const L = 28, H = 28, t = toileDecor(L, H), R = t.rampes;
  R.soleil = rampe(0xf2b228); R.rayon = rampe(0xf8d040); R.nuage = rampe(0xdfe6f0); R.nuageS = rampe(0x6a7490); R.goutte = rampe(0x3a86e0);
  R.eclair = rampe(0xffd23a); R.flocon = rampe(0xeaf4ff); R.vent = rampe(0xb8e0dc); R.feuille = rampe(0xd06a28); R.chaud = rampe(0xe8502a); R.braise = rampe(0xff8a3a);
  const disque = (cx, cy, r, mat, lum = true) => { for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) { const dx = x + 0.5 - cx, dy = y + 0.5 - cy, d = Math.hypot(dx, dy); if (d > r) continue;
    const l = lum ? (-dx - dy) / (r * 1.4) : 0; t.poser(x, y, mat, Math.max(0, Math.min(5, Math.round(3 + l * 2 - (d > r - 1 ? 1 : 0))))); } };
  const nuage = (oy, mat) => { const bulles = [[9, 14 + oy, 5.5], [15, 10.5 + oy, 6.5], [20.5, 14 + oy, 5]];
    for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) { let dans = bulles.some(([cx, cy, r]) => Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= r) || (x >= 5 && x <= 24 && y >= 14 + oy && y <= 18 + oy);
      if (!dans) continue; const haut = y < 12 + oy, bas = y >= 17 + oy; t.poser(x, y, mat, bas ? 1 : haut ? 4 : 3); }
    for (const [cx, cy, r] of bulles) for (let a = -2.4; a < -0.7; a += 0.15) t.poser(Math.round(cx + Math.cos(a) * (r - 1.5)), Math.round(cy + Math.sin(a) * (r - 1.5)), mat, 5); };
  const rayons = (cx, cy, r1, r2, mat, n = 8) => { for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2, long = k % 2 === 0 ? r2 : r2 - 2;
    for (let r = r1; r <= long; r += 0.5) { const x = Math.round(cx + Math.cos(a) * r - 0.5), y = Math.round(cy + Math.sin(a) * r - 0.5); t.poser(x, y, mat, 4); if (k % 2 === 0) t.poser(x + (Math.abs(Math.sin(a)) > 0.5 ? 1 : 0), y + (Math.abs(Math.sin(a)) > 0.5 ? 0 : 1), mat, 2); } } };
  const goutte = (x, y) => { t.poser(x, y, 'goutte', 4); t.poser(x, y + 1, 'goutte', 3); t.poser(x - 1, y + 2, 'goutte', 3); t.poser(x, y + 2, 'goutte', 2); t.poser(x - 1, y + 3, 'goutte', 1); };
  const flocon = (cx, cy) => { for (let k = -2; k <= 2; k++) { t.poser(cx + k, cy, 'flocon', 4); t.poser(cx, cy + k, 'flocon', 4); } t.poser(cx, cy, 'flocon', 5); };
  if (type === 'soleil') { rayons(14, 14, 8, 12, 'rayon'); disque(14, 14, 7, 'soleil'); }
  if (type === 'canicule') { rayons(14, 10, 7, 10, 'braise'); disque(14, 10, 6, 'chaud');
    for (let k = 0; k < 2; k++) for (let x = 6 + k * 2; x < 23 - k * 2; x++) if ((x + k * 3) % 7 < 5) t.poser(x, Math.round(21 + k * 4 + Math.sin(x / 1.6 + k * 2) * 1.2), 'braise', 4 - k); }
  if (type === 'pluie') { nuage(-2, 'nuage'); for (const [x, y] of [[8, 19], [13, 21], [18, 19], [11, 24], [21, 23]]) goutte(x, y); }
  if (type === 'orage') { nuage(-3, 'nuageS');
    const eclair = [[16, 12], [11, 20], [14, 20], [10, 27], [19, 17], [15, 17], [18, 12]];
    for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) { let c = false; for (let i = 0, j = eclair.length - 1; i < eclair.length; j = i++) { const [xi, yi] = eclair[i], [xj, yj] = eclair[j]; if ((yi > y + 0.5) !== (yj > y + 0.5) && x + 0.5 < (xj - xi) * (y + 0.5 - yi) / (yj - yi) + xi) c = !c; } if (c) t.poser(x, y, 'eclair', x < 14 ? 5 : 3); }
    goutte(7, 18); goutte(22, 19); }
  if (type === 'vent') { for (const [y, l, r] of [[8, 17, 3], [14, 22, 3.2], [20, 14, 2.6]]) { for (let x = 2; x < l; x++) { t.poser(x, y, 'vent', 4); t.poser(x, y + 1, 'vent', 2); }
      for (let a = Math.PI / 2; a > -Math.PI * 1.05; a -= 0.1) t.poser(Math.round(l - 1 + Math.cos(a) * r), Math.round(y - r + 0.5 + Math.sin(a) * r), 'vent', a > 0 ? 3 : 4); }
    for (const [x, y] of [[20, 22], [21, 22], [22, 23], [20, 23], [21, 23], [21, 24]]) t.poser(x, y, 'feuille', 3); t.poser(22, 22, 'feuille', 5); t.poser(19, 24, 'feuille', 1); }
  if (type === 'neige') { nuage(-3, 'nuage'); flocon(8, 21); flocon(15, 25); flocon(22, 21); }
  t.contour(); t.texture(scene, cle); return cle;
}
// Le chapeau pointu d'anniversaire : carton bleu à bandes jaunes en spirale, pois blancs, galon doré, pompon rose
function chapeauFeteHD(scene) {
  const cle = 'chapeauFeteHD'; if (scene.textures.exists(cle)) return cle;
  const L = 22, H = 30, t = toileDecor(L, H), R = t.rampes;
  R.carton = rampe(0x3a7ad8); R.bande = rampe(0xf0c838); R.pois = rampe(0xf4f0e8); R.galon = rampe(0xd8a830); R.pompon = rampe(0xe8508a);
  const cx = 11, haut = 7, bas = 26, demi = 9;
  for (let y = haut; y <= bas; y++) { const w = (y - haut) / (bas - haut) * demi + 0.6;
    for (let x = Math.floor(cx - w); x <= Math.ceil(cx + w); x++) { const u = (x + 0.5 - cx) / w; if (Math.abs(u) > 1) continue;
      const ton = 3 + (u < -0.45 ? 1 : u > 0.5 ? -1 : 0) + (u < -0.75 ? 1 : 0);
      const spirale = Math.floor((y - haut) * 0.55 + u * 2.2 + 20) % 3 === 0;
      t.poser(x, y, spirale ? 'bande' : 'carton', Math.max(0, Math.min(5, ton))); } }
  for (const [x, y] of [[9, 16], [14, 20], [8, 22], [12, 12], [15, 24], [6, 25]]) { t.poser(x, y, 'pois', 5); t.poser(x + 1, y, 'pois', 3); }
  for (let x = cx - demi - 1; x <= cx + demi + 1; x++) for (let y = bas; y <= bas + 2; y++) t.poser(x, y, 'galon', y === bas ? 5 : x < cx ? 3 : 2);
  for (let y = 0; y < 9; y++) for (let x = 6; x < 17; x++) { const d = Math.hypot(x + 0.5 - cx, y + 0.5 - 4.5); if (d > 4 + (hachage(x, y, 31) > 0.6 ? 0.6 : 0)) continue; t.poser(x, y, 'pompon', d < 2 && x < cx ? 5 : d > 3 ? 2 : 3 + (hachage(x, y, 7) > 0.7 ? 1 : 0)); }
  t.contour(); t.texture(scene, cle); return cle;
}

// L'ardoise du temps, devant la tente d'Ysmée : ce qu'elle a écrit ce matin (juste quatre fois sur cinq).
// Posée derrière les passants (ils marchent devant, les pieds sur les pavés).
function ardoiseMeteo(scene, x, sol, G = window.GAME, prof = 8.2) {
  const type = meteoAnnoncee(G), g = scene.add.graphics().setDepth(prof);
  g.fillStyle(0x3a2616).fillRect(x - 30, sol - 74, 5, 74).fillRect(x + 25, sol - 74, 5, 74).fillRect(x - 3, sol - 60, 5, 60);
  g.fillStyle(0x1a0e06).fillRect(x - 43, sol - 119, 86, 72); g.fillStyle(0x5a3a20).fillRect(x - 42, sol - 118, 84, 70); g.fillStyle(0x24302c).fillRect(x - 38, sol - 114, 76, 62);
  g.fillStyle(0xffffff, 0.05).fillRect(x - 38, sol - 114, 76, 8);
  scene.add.image(x, sol - 92, iconeMeteoHD(scene, type)).setScale(1.3).setDepth(prof + 0.01);
  scene.add.text(x, sol - 63, METEOS[type].ardoise, style(10, '#f0ead8', { fontStyle: 'bold', align: 'center' })).setOrigin(0.5).setDepth(prof + 0.01);
  return g;
}

// Les textures animées : un pan de pluie (des traits en biais) et un pan de neige, qui défilent en boucle
function creerTexturesMeteo(scene) {
  if (scene.textures.exists('meteoPluie')) return;
  const p = scene.make.graphics({}, false);
  for (let k = 0; k < 70; k++) { const x = Math.random() * 256, y = Math.random() * 256, L = 14 + Math.random() * 12;
    for (const dx of [0, 256, -256]) p.lineStyle(k % 4 ? 1 : 2, 0xc8dcf0, 0.4 + Math.random() * 0.4).lineBetween(x + dx, y, x + dx - L * 0.22, y + L); }
  p.generateTexture('meteoPluie', 256, 256); p.destroy();
  const n = scene.make.graphics({}, false);
  for (let k = 0; k < 46; k++) { const x = 4 + Math.random() * 248, y = 4 + Math.random() * 248, r = k % 5 ? 1.6 : 2.6; n.fillStyle(0xffffff, k % 5 ? 0.7 : 0.95).fillCircle(x, y, r); }
  n.generateTexture('meteoNeige', 256, 256); n.destroy();
  // des feuilles en pointe (une nervure, une queue), dans les couleurs de l'automne et du printemps
  const f = scene.make.graphics({}, false), forme = [[2, 0, 3], [1, 1, 6], [0, 2, 8], [1, 3, 6], [2, 4, 3]];
  [0xd0702a, 0xe0a030, 0xa04a18, 0x7a9a3a].forEach((c, k) => { const x0 = k * 12;
    for (const [dx, y, l] of forme) { f.fillStyle(0x2a1a0a).fillRect(x0 + dx, y, l + 1, 1); f.fillStyle(c).fillRect(x0 + dx + 1, y, l - 1, 1); }
    f.fillStyle(0xfff0c0, 0.45).fillRect(x0 + 2, 1, 3, 1); f.fillStyle(0x3a2410).fillRect(x0 + 1, 2, 7, 1).fillRect(x0 + 9, 2, 2, 1); });
  f.generateTexture('meteoFeuilles', 48, 5); f.destroy();
  for (let k = 0; k < 4; k++) scene.textures.get('meteoFeuilles').add('f' + k, 0, k * 12, 0, 11, 5);
}

// Un pan animé, fixé à l'écran : il défile (vx, vy en pixels par seconde)
function panMeteo(scene, cle, { prof = 13, alpha = 1, vx = 0, vy = 0, echelle = 1 } = {}) {
  const t = scene.add.tileSprite(480, 270, 960, 540, cle).setScrollFactor(0).setDepth(prof).setAlpha(alpha).setTileScale(echelle);
  const maj = (temps, dt) => { if (!t.active) return; t.tilePositionX -= vx * dt / 1000 / echelle; t.tilePositionY -= vy * dt / 1000 / echelle; };
  scene.events.on('update', maj); scene.events.once('shutdown', () => scene.events.off('update', maj));
  return t;
}
function voileMeteo(scene, coul, alpha, mode = 'MULTIPLY', prof = 12) {
  return scene.add.rectangle(480, 270, 960, 540, coul, alpha).setScrollFactor(0).setDepth(prof).setBlendMode(Phaser.BlendModes[mode]);
}

// Les flaques : chacune garde le vrai reflet de ce qui est juste au-dessus d'elle (le décor retourné autour de la ligne du
// sol), tremblé de rides. Les passants ne s'y reflètent pas (ils bougent) : seulement les façades, la tente, les arbres.
// apres : dans une scène où tout est à la même profondeur, les flaques se glissent juste après le sol (sous les gens)
function flaquesMeteo(scene, flaques, axe, { teinte = 0xb4c4e0, alpha = 0.95, prof = 0.6, apres = null } = {}) {
  const poser = (o, dp = 0) => { if (apres) { o.setDepth(apres.depth); scene.children.moveAbove(o, apres); } else o.setDepth(prof + dp); return o; };
  const decor = scene.children.list.filter(o => o.visible && o.depth < 8.4 && o.type !== 'Text' && !o.blendMode && o.scrollFactorX === 1 && !(o.type === 'Image' && o.originY === 1 && o.y > axe + 8));
  for (const [x, y, w, h] of flaques) {
    const fond = scene.add.graphics();
    fond.fillStyle(0x2a3a50, 0.85).fillEllipse(x, y, w + 6, h + 4); fond.fillStyle(0x1a2a3a, 1).fillEllipse(x, y + 1, w, h);
    const rt = scene.add.renderTexture(x, y, w, h).setFlipY(true).setAlpha(alpha).setTint(teinte);
    rt.camera.setScroll(x - w / 2, 2 * axe - y - h / 2);
    rt.draw(decor); if (rt.render) rt.render();
    const masque = scene.make.graphics({}, false); masque.fillStyle(0xffffff).fillEllipse(x, y, w, h); rt.setMask(masque.createGeometryMask());
    // les rides : de petits cercles qui s'ouvrent quand une goutte tombe
    poser(fond, -0.05); poser(rt); if (apres) scene.children.moveAbove(rt, fond);
    const rides = scene.add.graphics();
    scene.time.addEvent({ delay: 260, loop: true, callback: () => {
      if (!rides.active) return;
      const rx = x + (Math.random() - 0.5) * w * 0.7, ry = y + (Math.random() - 0.5) * h * 0.5, c = poser(scene.add.ellipse(rx, ry, 4, 2).setStrokeStyle(1, 0xd8e8ff, 0.6), 0.05); if (apres) scene.children.moveAbove(c, rt);
      scene.tweens.add({ targets: c, scaleX: 4, scaleY: 3, alpha: 0, duration: 700, onComplete: () => c.destroy() }); } });
  }
}

// L'éclair : une ligne brisée, son halo, l'écran qui blanchit un instant ; le tonnerre suit
function eclairMeteo(scene, prof = 13.5) {
  const x0 = 120 + Math.random() * 720, g = scene.add.graphics().setDepth(prof).setScrollFactor(0);
  const pts = [[x0, 0]]; let x = x0; for (let y = 0; y < 300; y += 14 + Math.random() * 12) { x += (Math.random() - 0.5) * 32; pts.push([x, y]); }
  const branche = pts.slice(2, 5).map(([a, b]) => [[a, b], [a + 18 + Math.random() * 16, b + 20 + Math.random() * 14]]);
  for (const [w, c, a] of [[9, 0xb0a0ff, 0.25], [5, 0xe0d8ff, 0.6], [2, 0xffffff, 1]]) { g.lineStyle(w, c, a); for (let i = 1; i < pts.length; i++) g.lineBetween(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]); for (const [[a1, b1], [a2, b2]] of branche) g.lineBetween(a1, b1, a2, b2); }
  const flash = scene.add.rectangle(480, 270, 960, 540, 0xf0f0ff, 0.45).setScrollFactor(0).setDepth(prof - 0.2);
  scene.tweens.add({ targets: [g, flash], alpha: 0, duration: 380, delay: 90, onComplete: () => { g.destroy(); flash.destroy(); } });
  if (typeof Son !== 'undefined' && Son.tonnerre) Son.tonnerre(0.4 + Math.random() * 1.2);
}

// L'ambiance d'une scène dehors. sol : la ligne du sol ; flaques : [[x, y, l, h]] dans le monde (les reflets) ;
// ciel : glisser un ciel couvert derrière les maisons (sinon seulement un voile) ; fenetre : un éclair ne se voit
// qu'à travers une fenêtre (dedans)
// prof : la profondeur du voile (la pluie et le reste juste au-dessus) ; à régler sous l'interface de la scène
function ambianceMeteo(scene, { G = window.GAME, sol = 470, flaques = [], ciel = true, dedans = false, apres = null, prof = 12 } = {}) {
  const p = prof;
  if (!G || typeof meteoDu !== 'function') return null;
  const type = meteoDu(G); if (type === 'soleil') return type;
  creerTexturesMeteo(scene);
  const nuit = typeof soirDuJour === 'function' && soirDuJour(G);
  if (ciel && !dedans && ['pluie', 'orage', 'neige'].includes(type)) cielMeteo(scene, { pluie: 0x8a92a0, orage: 0x5a5a72, neige: 0xc8ccd8 }[type], 0.85);
  if (type === 'pluie' || type === 'orage') {
    if (!dedans) { voileMeteo(scene, type === 'orage' ? 0x7078a0 : 0x8898b8, 1, 'MULTIPLY', p); if (flaques.length) flaquesMeteo(scene, flaques, sol, { apres }); }
    panMeteo(scene, 'meteoPluie', { prof: p + 1, alpha: dedans ? 0.35 : 0.8, vx: -260, vy: 1100 });
    panMeteo(scene, 'meteoPluie', { prof: p + 1, alpha: dedans ? 0.2 : 0.45, vx: -200, vy: 800, echelle: 0.7 });
    if (type === 'orage') scene.time.addEvent({ delay: 6000, startAt: 2500, loop: true, callback: () => { if (Math.random() < 0.7) eclairMeteo(scene, p + 1.5); } });
  }
  if (type === 'neige') { if (!dedans) voileMeteo(scene, 0xd0dcf0, 1, 'MULTIPLY', p); panMeteo(scene, 'meteoNeige', { prof: p + 1, alpha: 0.9, vx: -18, vy: 70, echelle: 1.3 }); panMeteo(scene, 'meteoNeige', { prof: p + 1, alpha: 0.7, vx: 12, vy: 45 }); }
  if (type === 'canicule' && !nuit) {
    voileMeteo(scene, 0xffe0b0, 1, 'MULTIPLY', p); voileMeteo(scene, 0xffb060, 0.14, 'ADD', p);
    const g = scene.add.graphics().setDepth(p + 0.5).setScrollFactor(0);
    for (let k = 0; k < 6; k++) { const y = sol - 30 - k * 24; for (let x = 0; x < 960; x += 6) g.fillStyle(0xfff0d0, 0.08 + 0.04 * (k % 2)).fillRect(x, y + Math.sin(x / 22 + k) * 3, 6, 2); }
    scene.tweens.add({ targets: g, y: 3, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });   // (l'air qui tremble)
  }
  if (type === 'vent') {
    const traines = scene.add.graphics().setDepth(p + 0.5).setScrollFactor(0);
    for (let k = 0; k < 10; k++) { const x = Math.random() * 900, y = 60 + Math.random() * 360, l = 60 + Math.random() * 100; traines.lineStyle(2, 0xffffff, 0.22).beginPath().moveTo(x, y); for (let i = 1; i <= 12; i++) traines.lineTo(x + l * i / 12, y + Math.sin(i / 2) * 4); traines.strokePath(); }
    scene.tweens.add({ targets: traines, x: -120, duration: 2400, repeat: -1 });
    scene.time.addEvent({ delay: 180, loop: true, callback: () => {   // (des feuilles qui filent à l'horizontale)
      const f = scene.add.image(980, 40 + Math.random() * 440, 'meteoFeuilles', 'f' + Math.floor(Math.random() * 4)).setScrollFactor(0).setDepth(p + 0.6).setScale(1.8);
      scene.tweens.add({ targets: f, x: -30, y: f.y + (Math.random() - 0.3) * 80, angle: 360 * (Math.random() < 0.5 ? 1 : -1), duration: 1600 + Math.random() * 1400, onComplete: () => f.destroy() }); } });
  }
  return type;
}
// Le ciel couvert derrière les maisons : un voile et des bandes de nuages, glissés juste après le paysage
function cielMeteo(scene, coul, alpha) {
  const i = scene.children.list.findIndex(o => o.texture && /^paves/.test(o.texture.key));
  if (i < 0) return;
  const r = scene.add.rectangle(480, 235, 960, 470, coul, alpha).setScrollFactor(0); scene.children.moveTo(r, i);
  const g = scene.add.graphics().setScrollFactor(0); scene.children.moveTo(g, i + 1);
  const C = Phaser.Display.Color.ValueToColor(coul);
  [[30, -16, 46], [90, -8, 40], [150, 0, 34], [205, 8, 28]].forEach(([y, d, rr]) => { const c = (d < 0 ? C.clone().darken(-d) : C.clone().lighten(d)).color;
    for (let x = -30; x < 1000; x += rr * 1.1) g.fillStyle(c, 1).fillCircle(x + (Math.random() - 0.5) * 16, y + (Math.random() - 0.6) * 16, rr * (0.8 + Math.random() * 0.35));
    g.fillStyle(c, 1).fillRect(0, 0, 960, y); });
}

// Le temps vu par une fenêtre (le comptoir) : le ciel couvert, la pluie ou la neige derrière la vitre, l'éclair qui
// illumine le dehors, les feuilles qui passent. Tout est découpé par le masque de la fenêtre.
function meteoFenetre(scene, { x, y, w, h }, masque, { G = window.GAME, prof = 2.4 } = {}) {
  if (!G || typeof meteoDu !== 'function') return null;
  const type = meteoDu(G); if (type === 'soleil') return type;
  creerTexturesMeteo(scene);
  const cadre = o => { o.setMask(masque); return o; };
  const teinte = { pluie: [0x8a98b8, 1], orage: [0x6a6a90, 1], neige: [0xd0dcf0, 1], canicule: [0xffe0b0, 1], vent: [0xe8e8f0, 1] }[type];
  if (teinte) cadre(scene.add.rectangle(x + w / 2, y + h / 2, w, h, teinte[0], teinte[1]).setBlendMode(Phaser.BlendModes.MULTIPLY).setDepth(1.55));
  const pan = (cle, vx, vy, alpha, ech = 1) => { const t = cadre(scene.add.tileSprite(x + w / 2, y + h / 2, w, h, cle).setDepth(prof).setAlpha(alpha).setTileScale(ech));
    const maj = (temps, dt) => { if (!t.active) return; t.tilePositionX -= vx * dt / 1000 / ech; t.tilePositionY -= vy * dt / 1000 / ech; };
    scene.events.on('update', maj); scene.events.once('shutdown', () => scene.events.off('update', maj)); return t; };
  if (type === 'pluie' || type === 'orage') { pan('meteoPluie', -260, 1100, 0.75); pan('meteoPluie', -200, 800, 0.4, 0.7);
    // des gouttes qui coulent sur la vitre
    scene.time.addEvent({ delay: 700, loop: true, callback: () => { const gx = x + 10 + Math.random() * (w - 20), d = cadre(scene.add.rectangle(gx, y + Math.random() * h * 0.5, 2, 4, 0xd8e8ff, 0.7).setDepth(prof + 0.1));
      scene.tweens.add({ targets: d, y: y + h - 4, x: gx + (Math.random() - 0.5) * 6, duration: 1800 + Math.random() * 1600, ease: 'Quad.easeIn', onComplete: () => d.destroy() }); } }); }
  if (type === 'orage') scene.time.addEvent({ delay: 7000, startAt: 3000, loop: true, callback: () => { if (Math.random() < 0.65) {
    const f = cadre(scene.add.rectangle(x + w / 2, y + h / 2, w, h, 0xf0f0ff, 0.7).setDepth(prof + 0.2)); scene.tweens.add({ targets: f, alpha: 0, duration: 420, delay: 80, onComplete: () => f.destroy() });
    if (typeof Son !== 'undefined' && Son.tonnerre) Son.tonnerre(0.6 + Math.random() * 1.2, 0.7); } } });
  if (type === 'neige') { pan('meteoNeige', -18, 70, 0.9, 1.3); pan('meteoNeige', 12, 45, 0.7); }
  if (type === 'vent') scene.time.addEvent({ delay: 420, loop: true, callback: () => { const f = cadre(scene.add.image(x + w + 10, y + 10 + Math.random() * (h - 20), 'meteoFeuilles', 'f' + Math.floor(Math.random() * 4)).setDepth(prof).setScale(1.8));
    scene.tweens.add({ targets: f, x: x - 20, y: f.y + (Math.random() - 0.3) * 50, angle: 360, duration: 1400 + Math.random() * 900, onComplete: () => f.destroy() }); } });
  return type;
}
