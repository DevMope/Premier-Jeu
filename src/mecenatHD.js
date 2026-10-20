// (v1.32, planche 58 validée) Ce que le monde montre de tes dons : dans la rue du marché, les fanions bleu et or du Rempart
// (2 000 p.), ses bannières aux façades (6 000 p.), le vitrail de la chapelle (15 000 p.), les fleurs aux fenêtres et les
// pétales (30 000 p.) ; la plaque des mécènes près de la fontaine, qu'on peut lire de près. Pour le neutre : la double
// bannière du Conseil et des Bannis à la porte du shop (sauf-conduit), et des patrouilles mêlées dans la rue.
function palierDuMecenat(G, id) { const m = G.mecenat; return !!m && (m.paliers || []).includes(id); }

function rueDuMecenat(scene, o, sol, G = window.GAME) {
  if (!G.mecenat) return;
  const P = PLACES_RUE, prof = 8.2;
  if (palierDuMecenat(G, 'plaque')) {
    // les fanions, tendus d'une maison à l'autre
    const g = scene.add.graphics().setDepth(prof);
    const points = [P.maison0, P.forge, P.shop - 120, P.shop + 160, P.maison1, P.fontaine, P.banque, P.arche - 80].map(x => o + x);
    for (let k = 0; k < points.length - 1; k++) {
      const a = points[k], b = points[k + 1], n = Math.max(6, Math.round((b - a) / 34)); let pr = null;
      g.lineStyle(2, 0x3a2a1a);
      for (let i = 0; i <= n; i++) { const t = i / n, x = a + (b - a) * t, y = sol - 236 + Math.sin(t * Math.PI) * 30;
        if (pr) g.lineBetween(pr[0], pr[1], x, y);
        if (i < n) g.fillStyle(i % 2 ? 0xc9a227 : 0x2a5aa8).fillTriangle(x, y, x + 20, y + 2, x + 9, y + 20);
        pr = [x, y]; }
    }
    // la plaque des mécènes, scellée près de la fontaine (on la lit de près)
    const px = o + P.fontaine + 96, py = sol - 34;
    const pl = scene.add.graphics().setDepth(8.35);
    pl.fillStyle(0x3a3a40).fillRect(px - 20, py - 26, 40, 30).fillStyle(0xb8b4a8).fillRect(px - 18, py - 24, 36, 26);
    for (let i = 0; i < 4; i++) pl.fillStyle(0x6a665a).fillRect(px - 13, py - 19 + i * 6, 26, 2);
    pl.fillStyle(0xc9a227).fillRect(px - 13, py - 7, 26, 2);
    const z = scene.add.rectangle(px, py - 12, 44, 34, 0xffffff, 0).setDepth(8.66).setInteractive({ useHandCursor: true });
    z.on('pointerdown', () => plaqueDesMecenes(scene));
  }
  if (palierDuMecenat(G, 'visite')) {
    // les bannières du Rempart, aux façades
    for (const x of [P.shop - 150, P.shop + 150, P.fontaine - 90, P.banque + 80]) {
      const b = scene.add.container(o + x, sol - 300).setDepth(prof), g = scene.add.graphics(); b.add(g);
      g.fillStyle(0x6a4a22).fillRect(-18, -4, 36, 4);
      g.fillStyle(0x2a5aa8).fillRect(-14, 0, 28, 54).fillTriangle(-14, 54, 14, 54, 0, 66).fillStyle(0xc9a227).fillRect(-14, 0, 28, 4).fillCircle(0, 22, 7).fillStyle(0xfff0a0).fillCircle(0, 22, 3);
      scene.tweens.add({ targets: b, angle: 2, duration: 2200 + x % 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }
  if (palierDuMecenat(G, 'vitrail') && typeof confrerieA === 'function' && confrerieA(G, 'chapelle')) {
    // le vitrail de la chapelle, qui s'allume de couleurs ; on le regarde de près
    const vx = o + P.chapelle, vy = sol - 232;
    for (const [dx, c] of [[-8, 0x2a5aa8], [8, 0xc9a227], [0, 0x8a2a3a]]) scene.add.image(vx + dx, vy, 'halo').setScale(0.35).setTint(c).setAlpha(0.45).setBlendMode(Phaser.BlendModes.ADD).setDepth(9.6);
    const z = scene.add.rectangle(vx, vy, 60, 70, 0xffffff, 0).setDepth(8.66).setInteractive({ useHandCursor: true });
    z.on('pointerdown', () => vitrailDuMecene(scene));
  }
  if (palierDuMecenat(G, 'titre')) {
    // des fleurs aux fenêtres, et des pétales qui volent
    const g = scene.add.graphics().setDepth(prof);
    for (const x of [P.maison1 - 24, P.maison1 + 36]) for (let i = 0; i < 7; i++) g.fillStyle([0xd84a6a, 0xf0d040, 0xf4f4f0][i % 3]).fillCircle(o + x - 24 + i * 8, sol - 150 - (i % 2) * 3, 4).fillStyle(0x3a7a3a).fillCircle(o + x - 20 + i * 8, sol - 147, 3);
    scene.time.addEvent({ delay: 420, loop: true, callback: () => { const cam = scene.cameras.main.scrollX, pe = scene.add.rectangle(cam + Math.random() * 960, -10, 3, 3, Math.random() < 0.5 ? 0xf4c0d0 : 0xfff0a0).setDepth(9);
      scene.tweens.add({ targets: pe, y: sol + 10, x: pe.x + 80, angle: 360, duration: 6000 + Math.random() * 3000, onComplete: () => pe.destroy() }); } });
  }
  if (palierDuMecenat(G, 'saufConduit')) {
    // le sauf-conduit des deux camps, à la porte du shop
    if (!scene.textures.exists('embleme_conseil')) creerEmblemesHD(scene);
    for (const [dx, cle] of [[-58, 'embleme_conseil'], [58, 'embleme_bannis']]) scene.add.image(o + P.shop + dx, sol - 128, cle).setScale(0.42).setDepth(8.36);
  }
}

// Des patrouilles mêlées (le neutre qui a payé le Passeur) : un garde et un Banni qui marchent ensemble
function patrouilleMelee(G) { return palierDuMecenat(G, 'passeur') && Math.random() < 0.18; }

function fermerFenetreMecene(scene, c) { Son.jouer('glisse'); c.destroy(); }

// La plaque des mécènes, de près
function plaqueDesMecenes(scene) {
  const G = window.GAME, c = scene.add.container(0, 0).setDepth(60);
  if (c.setScrollFactor) c.setScrollFactor(0);
  c.add(scene.add.rectangle(480, 270, 960, 540, 0x0a0806, 0.82).setInteractive());
  const g = scene.add.graphics(); c.add(g);
  g.fillStyle(0x3a3a40).fillRoundedRect(290, 80, 380, 330, 8).fillStyle(0xb8b4a8).fillRoundedRect(296, 86, 368, 318, 6).fillStyle(0xa8a498).fillRoundedRect(308, 98, 344, 294, 4);
  for (const [x, y] of [[314, 104], [646, 104], [314, 386], [646, 386]]) g.fillStyle(0x6a5a3a).fillCircle(x, y, 5).fillStyle(0xc9a227).fillCircle(x - 1, y - 1, 3);
  c.add(scene.add.text(480, 114, 'MÉCÈNES DU REMPART', style(18, '#4a4438', { fontStyle: 'bold' })).setOrigin(0.5, 0));
  c.add(scene.add.text(480, 138, 'Par décret du Grand Sage', style(11, '#5a5448', { fontStyle: 'italic' })).setOrigin(0.5, 0));
  const autres = ['Dame Hélis de Hautval', 'Maître Odon Pierrefort', 'La guilde des tisserands', 'Ser Aldric le Vieux'];
  const titre = palierDuMecenat(G, 'titre') ? ', Bienfaiteur du Rempart' : ', marchand';
  [...autres.slice(0, 3), nomJoueur(G) + titre, autres[3]].forEach((n, i) => { const moi = i === 3;
    c.add(scene.add.text(480, 172 + i * 38, n.toUpperCase(), style(moi ? 15 : 14, moi ? '#8a6410' : '#3e3a30', { fontStyle: 'bold' })).setOrigin(0.5, 0)); });
  c.add(scene.add.text(480, 420, `Tu as donné ${(G.mecenat.donne || 0).toLocaleString('fr-FR')} pièces au Rempart.`, style(13, '#e8dcc0', { fontStyle: 'italic' })).setOrigin(0.5, 0));
  const b = creerBouton(scene, 480, 482, 180, '◀ Reculer', () => { b.fond.destroy(); b.label.destroy(); fermerFenetreMecene(scene, c); });
  for (const o of [b.fond, b.label]) { o.setDepth(61); if (o.setScrollFactor) o.setScrollFactor(0); }
  Son.jouer('page');
}

// Ton vitrail, à la chapelle du Rempart
function vitrailDuMecene(scene) {
  const G = window.GAME, c = scene.add.container(0, 0).setDepth(60).setScrollFactor(0);
  c.add(scene.add.rectangle(480, 270, 960, 540, 0x0e0a10, 0.92).setInteractive());
  const g = scene.add.graphics(); c.add(g);
  const cx = 480, top = 50, w = 210, h = 380;
  g.fillStyle(0x4a4448).fillRoundedRect(cx - w / 2 - 14, top - 14, w + 28, h + 28, { tl: 120, tr: 120, bl: 6, br: 6 });
  const couleurs = [0x2a5aa8, 0xc9a227, 0x8a2a3a, 0x3a7a4a, 0x6a9ad8, 0xe0c060];
  for (let y = top; y < top + h; y += 18) for (let x = cx - w / 2; x < cx + w / 2; x += 18) {
    const dx = x + 9 - cx, dy = y + 9 - (top + w / 2); if (y + 9 < top + w / 2 && dx * dx + dy * dy > (w / 2) ** 2) continue;
    g.fillStyle(couleurs[(Math.floor(x / 18) * 7 + Math.floor(y / 18) * 3) % couleurs.length], 0.9).fillRect(x + 1, y + 1, 16, 16); }
  c.add(scene.add.image(cx, top + h - 20, textureJoueur(scene, G)).setOrigin(0.5, 1).setScale(echelleJoueur(16)).setTint(0xf0e0b0));
  const gl = scene.add.graphics(); c.add(gl); gl.lineStyle(2, 0x1a1418, 0.9);
  for (let y = top; y < top + h; y += 18) gl.lineBetween(cx - w / 2, y, cx + w / 2, y);
  for (let x = cx - w / 2; x <= cx + w / 2; x += 18) gl.lineBetween(x, top + 30, x, top + h);
  gl.lineStyle(5, 0x2a2428).strokeRoundedRect(cx - w / 2, top, w, h, { tl: 105, tr: 105, bl: 2, br: 2 });
  c.add(scene.add.text(cx, top + h + 18, `« ${nomJoueur(G)}, qui donna au Rempart »`, style(13, '#e8dcc0', { fontStyle: 'italic' })).setOrigin(0.5, 0));
  const b = creerBouton(scene, 820, 46, 180, '◀ Reculer', () => { b.fond.destroy(); b.label.destroy(); fermerFenetreMecene(scene, c); });
  for (const o of [b.fond, b.label]) o.setDepth(61).setScrollFactor(0);
  Son.jouer('cloche');
}
