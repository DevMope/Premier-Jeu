// Planche 78 : Vorhal'Düm l'Affamé, le nouveau design (le trône à l'échelle, les détails, derrière le Voile)
const { ouvrir } = require('../s164/base2');
const V = require('./vorhal78');
const D = __dirname + '/';
const OUTILS = V + `
  // une petite étiquette lisible sur fond sombre
  const tag = (s, x, y, txt, coul = '#fff4dc', o = 0.5, taille = 12) => s.add.text(x, y, txt, style(taille, coul, { fontStyle: 'bold', brut: true, backgroundColor: '#0a0e12dd', padding: { x: 6, y: 3 } })).setOrigin(o, 0.5).setDepth(80);
  // la salle d'Outre-Porte : du noir froid, des tentures et des piliers qui montent dans le noir, la brume au sol
  const salleOutrePorte = s => { creerHalo(s); const g = s.add.graphics().setDepth(0);
    for (let y = 0; y < 540; y += 4) { const f = y / 540; g.fillStyle(Phaser.Display.Color.GetColor(8 + f * 10 | 0, 13 + f * 12 | 0, 17 + f * 12 | 0)).fillRect(0, y, 960, 4); }
    for (let i = 0; i < 4; i++) for (const sg of [-1, 1]) { const x = 480 + sg * (390 + i * 40), w = 50 - i * 8, c = 22 + i * 5;
      g.fillStyle(Phaser.Display.Color.GetColor(c - 6, c, c + 4)).fillRect(x - w / 2, 0, w, 540);
      for (let k = 0; k < 4; k++) g.fillStyle(Phaser.Display.Color.GetColor(c + 8, c + 14, c + 18), 0.5).fillRect(x - w / 2 + 4 + k * w / 4, 0, 2, 540); }
    g.fillStyle(0x0a0e12).fillRect(0, 500, 960, 40); for (let y = 504; y < 540; y += 7) g.fillStyle(0x1a2428, 0.6).fillRect(0, y, 960, 1);
    const rai = s.add.image(480, 160, 'halo').setScale(3, 8).setTint(0x9ad8e0).setAlpha(0.08).setBlendMode(Phaser.BlendModes.ADD).setDepth(0.2); };
  // la lueur qui tourne derrière sa tête : des arcs froids, en tourbillon
  const tourbillon = (s, x, y, e = 1) => { const c = s.add.container(x, y).setDepth(1); const g = s.add.graphics(); c.add(g);
    for (let k = 0; k < 9; k++) { const r = (26 + k * 13) * e, a0 = k * 0.9; g.lineStyle(Math.max(1, (4 - k * 0.35) * e), k < 4 ? 0xe8f8ff : 0x9ad0e0, 0.55 - k * 0.05).beginPath().arc(0, 0, r, a0, a0 + 1.9 + (k % 3) * 0.4).strokePath();
      g.lineStyle(Math.max(1, (2.6 - k * 0.2) * e), 0x7ab8c8, 0.35 - k * 0.03).beginPath().arc(0, 0, r + 5 * e, a0 + 3.1, a0 + 4.6).strokePath(); }
    s.tweens.add({ targets: c, angle: 360, duration: 60000, repeat: -1 });
    for (const [sc, al] of [[3.4, 0.35], [1.6, 0.55], [0.7, 0.7]]) s.add.image(x, y, 'halo').setScale(sc * e).setTint(0xc8f0ff).setAlpha(al).setBlendMode(Phaser.BlendModes.ADD).setDepth(0.9);
    return c; };
  // Vorhal'Düm posé par le bas, et les points de lumière qui vont avec (la flamme de la main, l'étoile de l'agrafe)
  const poserVorhal = (s, x, y, e, cle = 'vorhal_trone', teinte = 0xb0e4ff, prof = 2) => { const im = s.add.image(x, y, cle).setOrigin(0.5, 1).setScale(e).setDepth(prof);
    const P = (tx, ty) => [x + (tx - 150) * e, y - (344 - ty) * e];
    const [fx, fy] = P(243, 82); const f = s.add.image(fx, fy, 'halo').setScale(0.55 * e).setTint(teinte).setAlpha(0.8).setBlendMode(Phaser.BlendModes.ADD).setDepth(prof + 0.1);
    s.tweens.add({ targets: f, alpha: 0.5, scale: 0.45 * e, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const [ax, ay] = P(150, 96); s.add.image(ax, ay, 'halo').setScale(0.14 * e).setTint(0xe8f8ff).setAlpha(0.9).setBlendMode(Phaser.BlendModes.ADD).setDepth(prof + 0.1);
    return { im, P }; };
`;
const NOM = process.env.NOM || 'Bastien Roche';
const PANNEAUX = [
  // 1. le trône, à l'échelle : un homme à ses pieds
  { nom: 'p78_1', code: `
    salleOutrePorte(s); vorhalTroneHD(s);
    const { P } = poserVorhal(s, 480, 532, 1.5);
    const [hx, hy] = P(150, 46); tourbillon(s, hx, hy, 1.1);
    // la brume au ras du sol, et la lumière pâle derrière l'homme (sa silhouette se détache)
    for (let k = 0; k < 6; k++) { const b = s.add.image(220 + k * 104, 528, 'halo').setScale(2.8, 0.45).setTint(0xb8d8e0).setAlpha(0.13).setDepth(3); s.tweens.add({ targets: b, x: b.x + 40, duration: 4000 + k * 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }); }
    s.add.image(480, 512, 'halo').setScale(1.1, 0.9).setTint(0xd8f0f8).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD).setDepth(3.1);
    const cle = corpsHD(s, { race: 'humain', nom: '${NOM}', niveau: 'aguerri' }, null, 'dos');
    s.add.image(480, 536, cle).setOrigin(0.5, 1).setScale(3 * 0.125).setDepth(3.2);
    // la toise : du plateau du trône au sommet de la capuche, dix hommes
    const [, yPlat] = P(150, 318), [, yHaut] = P(150, 2); const g = s.add.graphics().setDepth(70);
    g.lineStyle(2, 0xd8c8a0, 0.85).lineBetween(900, yPlat, 900, yHaut); for (let k = 0; k <= 10; k++) { const y = yPlat + (yHaut - yPlat) * k / 10; g.lineBetween(k % 5 ? 894 : 888, y, k % 5 ? 906 : 912, y); }
    g.lineStyle(1, 0xd8c8a0, 0.4).lineBetween(560, yHaut, 888, yHaut).lineBetween(690, yPlat, 888, yPlat);
    tag(s, 880, (yPlat + yHaut) / 2, 'assis :\\ndix hommes\\nde haut', '#ffe8b0', 1, 12).setAlign('right');
    tag(s, 540, 514, 'un Ouvre-Route (1,75 m)', '#fff4dc', 0, 11);
` },
  // 2. les détails : la capuche vide, le crâne du bâton, la main ; la couleur de sa magie (A bleu-blanc, B violet)
  { nom: 'p78_2', code: `
    const g0 = s.add.graphics().setDepth(0); for (let y = 0; y < 540; y += 4) g0.fillStyle(Phaser.Display.Color.GetColor(10 + y / 60 | 0, 14 + y / 50 | 0, 18 + y / 45 | 0)).fillRect(0, y, 960, 4);
    creerHalo(s); vorhalTroneHD(s); vorhalTroneHD(s, { cle: 'vorhal_trone_v', magie: MAGIE_VIOLETTE });
    const zoom = (cle, cx0, cy0, cw, ch, x, y, e, prof = 2) => s.add.image(x - cx0 * e, y - cy0 * e, cle).setOrigin(0, 0).setScale(e).setCrop(cx0, cy0, cw, ch).setDepth(prof);
    const cadre = (x, y, w, h, coul = 0x6a8a9a) => s.add.rectangle(x + w / 2, y + h / 2, w + 6, h + 6, 0x06080a, 0.7).setStrokeStyle(2, coul).setDepth(1);
    // la capuche et le col
    s.add.image(232, 130, 'halo').setScale(3.4).setTint(0xc8f0ff).setAlpha(0.22).setBlendMode(Phaser.BlendModes.ADD).setDepth(1.5);
    cadre(22, 44, 420, 385); zoom('vorhal_trone', 90, 0, 120, 110, 22, 44, 3.5);
    tag(s, 232, 452, 'sous la capuche : le néant (personne n’a jamais vu son visage)', '#c8f0ff', 0.5, 12);
    tag(s, 232, 478, 'pas de bouche : il parle directement dans la tête', '#e8d8ff', 0.5, 12);
    // le crâne de bête au sommet du bâton
    cadre(470, 44, 280, 200, 0xb0a898); zoom('vorhal_trone', 40, 0, 70, 50, 470, 44, 4);
    tag(s, 610, 262, 'le bâton noueux et son crâne de bête', '#f0e0c0', 0.5, 12);
    // la main levée : la couleur de sa magie, deux propositions
    for (const [i, cle, coul, txt] of [[0, 'vorhal_trone', 0xb0e4ff, 'A · bleu-blanc (ton image)'], [1, 'vorhal_trone_v', 0xc070ff, 'B · violet (l’Engeance)']]) { const X = 470 + i * 178, Y = 290;
      cadre(X, Y, 150, 192, coul); s.add.image(X + 75, Y + 60, 'halo').setScale(1.2).setTint(coul).setAlpha(0.3).setBlendMode(Phaser.BlendModes.ADD).setDepth(2.1);
      zoom(cle, 213, 34, 62, 80, X, Y, 2.4); tag(s, X + 75, Y + 212, txt, i ? '#e0b0ff' : '#c8f0ff', 0.5, 11); }
    tag(s, 880, 386, 'sa magie :\\nA ou B ?', '#ffe8b0', 0.5, 14).setAlign('center');
    tag(s, 18, 22, 'Les détails', '#c8f0ff', 0, 15);` },
  // 3. dans le jeu : derrière le Voile de la Porte (la salle validée en planche 44 v3), on le devine, immense, sur son trône
  { nom: 'p78_3', code: `
    vorhalTroneHD(s); creerHalo(s);
    const g0 = s.add.graphics().setDepth(0); for (let y = 0; y < 540; y += 4) g0.fillStyle(Phaser.Display.Color.GetColor(12 + y / 50, 18 + y / 40, 20 + y / 36)).fillRect(0, y, 960, 4);
    g0.fillStyle(0x161e20).fillPoints([{ x: 300, y: 300 }, { x: 330, y: 60 }, { x: 480, y: 0 }, { x: 630, y: 60 }, { x: 660, y: 300 }], true);
    for (const x of [380, 430, 530, 580]) g0.fillStyle(0x3a5a58, 0.5).fillRect(x, 70, 4, 200);
    g0.fillStyle(0x0a0e10).fillRect(0, 300, 960, 240); for (let y = 300; y < 540; y += 14) g0.fillStyle(0x1a2426, 0.5).fillRect(0, y, 960, 1);
    for (let i = 0; i < 5; i++) { const f = 1 - i * 0.16, xb = 30 + i * 62, hb = 540 - i * 34;
      for (const sg of [-1, 1]) { const x = sg < 0 ? xb : 960 - xb, w = 46 * f;
        g0.fillStyle(Phaser.Display.Color.GetColor(22 + i * 4, 30 + i * 4, 32 + i * 4)).fillPoints([{ x: x - w / 2, y: hb }, { x: x - w / 3, y: 20 + i * 18 }, { x: x, y: i * 18 }, { x: x + w / 3, y: 20 + i * 18 }, { x: x + w / 2, y: hb }], true);
        g0.fillStyle(0x6ac8c0, 0.25).fillRect(x - 1, 40 + i * 18, 2, hb - 60 - i * 18); } }
    const rai = s.add.image(480, 200, 'halo').setScale(2.6, 7).setTint(0xb8e8e0).setAlpha(0.18).setBlendMode(Phaser.BlendModes.ADD).setDepth(0.3);
    const R = s.add.graphics().setDepth(0.4); const anneaux = [[330, 78], [250, 58], [170, 40], [96, 24]];
    anneaux.forEach(([rx, ry], i) => { R.lineStyle(i % 2 ? 2 : 3, i % 2 ? 0x9a3ad8 : 0xd8a830, 0.55).strokeEllipse(480, 462, rx * 2, ry * 2); });
    const RUNES = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ';
    anneaux.slice(0, 3).forEach(([rx, ry], i) => { const n = 22 - i * 5; for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2, x = 480 + Math.cos(a) * (rx - 14), y = 462 + Math.sin(a) * (ry - 6);
      s.add.text(x, y, RUNES[(k * 7 + i * 3) % RUNES.length], style(12 - i, i % 2 ? '#c070ff' : '#ffd858', { brut: true })).setOrigin(0.5).setDepth(0.45).setScale(1, 0.6).setAlpha(0.35 + (k % 3) * 0.15); } });
    const P = s.add.container(480 - 480 * 0.64, 462 - 470 * 0.64).setScale(0.64).setDepth(2);
    P.add(s.add.rectangle(482, 285, 184, 375, 0x06080c, 0.96));
    // au fond, de l'autre côté : lui, immense, assis ; la lueur qui tourne derrière sa tête
    const fond = s.add.image(480, 470 - 300 * 0.86, 'halo').setScale(2).setTint(0xc8f0ff).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD); P.add(fond);
    const v = s.add.image(480, 470, 'vorhal_trone').setOrigin(0.5, 1).setScale(0.86).setAlpha(0.62).setCrop(46, 0, 208, 344); P.add(v);
    s.tweens.add({ targets: v, alpha: 0.45, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const fl = s.add.image(480 + 93 * 0.86, 470 - 262 * 0.86, 'halo').setScale(0.5).setTint(0xb0e4ff).setAlpha(0.7).setBlendMode(Phaser.BlendModes.ADD); P.add(fl);
    for (let k = 0; k < 15; k++) { const x = 394 + k * 12.5, l = 290 + (k * 53) % 90, w = 14 + (k * 7) % 9;
      const b = s.add.rectangle(x, 100, w, l, k % 2 ? 0xc8d0e0 : 0xe8ecf4, 0.08 + (k % 3) * 0.04).setOrigin(0.5, 0); P.add(b);
      s.tweens.add({ targets: b, x: x + 7, scaleX: 0.75, duration: 1600 + (k % 5) * 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: k * 140 }); }
    const a = s.add.graphics(); P.add(a);
    const pierre = pts => { a.fillStyle(0x4a4a56).fillPoints(pts, true); a.lineStyle(3, 0x1a1a22).strokePoints(pts, true); };
    a.fillStyle(0x2a2a34).fillRect(300, 470, 360, 40).fillStyle(0x3a3a46).fillRect(290, 462, 380, 12);
    pierre([{ x: 344, y: 470 }, { x: 352, y: 150 }, { x: 372, y: 96 }, { x: 392, y: 104 }, { x: 392, y: 470 }]);
    pierre([{ x: 572, y: 470 }, { x: 572, y: 100 }, { x: 594, y: 92 }, { x: 612, y: 160 }, { x: 618, y: 470 }]);
    pierre([{ x: 366, y: 112 }, { x: 420, y: 66 }, { x: 480, y: 50 }, { x: 540, y: 66 }, { x: 600, y: 108 }, { x: 572, y: 104 }, { x: 480, y: 80 }, { x: 392, y: 110 }]);
    a.fillStyle(0x6a4a10).fillCircle(480, 74, 18).fillStyle(0xd8a830).fillCircle(480, 74, 15).lineStyle(2, 0x6a4a10).strokeCircle(480, 74, 9).lineStyle(2, 0xc070ff).lineBetween(472, 62, 482, 74).lineBetween(482, 74, 476, 88);
    for (const [x, y, t] of [[430, 210, '...viens...'], [540, 300, '...la surface...']]) { const m = s.add.text(x, y, t, style(20, '#e8f4ff', { fontStyle: 'italic bold', brut: true })).setOrigin(0.5).setAlpha(0.8); P.add(m); }
    for (let k = 0; k < 5; k++) s.add.image(300 + k * 90, 470, 'halo').setScale(2.6, 0.5).setTint(0xb8d8d8).setAlpha(0.14).setDepth(2.5);
    const L = s.add.container(132, 262).setDepth(60); L.add(s.add.rectangle(0, 0, 240, 270, 0x0c1012, 0.92).setStrokeStyle(2, 0x9ad0e0));
    L.add(s.add.text(0, -110, 'Vorhal’Düm', style(20, '#c8f0ff', { fontStyle: 'bold', brut: true })).setOrigin(0.5)); L.add(s.add.text(0, -86, 'l’Affamé', style(16, '#9ad0e0', { fontStyle: 'bold italic', brut: true })).setOrigin(0.5));
    L.add(s.add.text(0, -62, 'le Roi d’Outre-Porte, le chef de l’Engeance, le père de Vhaldrak. Un géant encapuchonné, assis sur un trône de pierre : personne n’a jamais vu son visage, si tant est qu’il en ait un. Pas de bouche : il parle directement dans la tête.', style(12, '#fff4dc', { brut: true, wordWrap: { width: 216 }, align: 'center', lineSpacing: 2 })).setOrigin(0.5, 0));
    const D2 = s.add.container(828, 262).setDepth(60); D2.add(s.add.rectangle(0, 0, 250, 270, 0x0c1012, 0.92).setStrokeStyle(2, 0xd8a830));
    D2.add(s.add.text(0, -112, 'Derrière le Voile', style(15, '#ffd858', { fontStyle: 'bold', brut: true })).setOrigin(0.5));
    D2.add(s.add.text(-112, -90, ['• la salle et la Porte ne changent pas (planche 44 v3 validée)', '• à travers le voile, on le devine, assis, de l’autre côté : sa capuche, son col hérissé, la lueur de sa main', '• il est si grand que l’arche ne montre que lui', '• sa voix arrive dans la tête, pas par les oreilles'].join('\\n'), style(12, '#fff4dc', { brut: true, wordWrap: { width: 226 }, lineSpacing: 4 })).setOrigin(0, 0));
    tag(s, 480, 22, 'Dans le jeu : derrière le Voile de la Porte', '#c8f0ff', 0.5, 15);` },
];
(async () => {
  const seul = process.argv[2];
  const { b, p, errs, libre } = await ouvrir();
  for (const P of PANNEAUX) { if (seul && P.nom !== seul) continue; await libre(P.code, { outils: OUTILS, attente: 1800 }); await p.screenshot({ path: `${D}${P.nom}.png` }); }
  console.log('erreurs', errs.slice(0, 5)); await b.close();
})();
