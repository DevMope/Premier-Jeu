// (v1.54, planche 62 validée) Ce qu'on voit du quotidien : le cellier (l'amélioration), la fraîcheur des provisions,
// le panneau des cadeaux (ce que le client en pensera), l'anniversaire d'un habitué.

// Le cellier, vu de face : fermé (une trappe dans le plancher), puis ouvert sur une petite cave voûtée (bocaux, jambon
// et saucissons qui pendent, une meule, deux tonnelets)
function cellierHD(scene, n = 1) {
  const cle = 'cellierHD_' + n; if (scene.textures.exists(cle)) return cle;
  const L = 64, H = 56, t = toileDecor(L, H);
  t.rampes.terre = rampe(0x5a4030); t.rampes.jambon = rampe(0xb05a4a); t.rampes.fromage = rampe(0xe0b050); t.rampes.bocal = rampe(0x8ab0a0); t.rampes.confiture = rampe(0xa03a4a); t.rampes.corde = rampe(0xc8a868);
  if (!n) {   // la trappe, dans le plancher
    for (let y = 30; y < 54; y++) for (let x = 6; x < 58; x++) t.poser(x, y, 'chene', (x - 6) % 13 === 0 ? 1 : 2 + (y === 30 ? 1 : 0));
    for (let y = 36; y < 50; y++) for (let x = 18; x < 46; x++) t.poser(x, y, 'cheneSombre', x === 18 || y === 36 ? 3 : x === 45 || y === 49 ? 1 : 2);
    for (let x = 26; x < 38; x++) t.poser(x, 42, 'fer', 3); t.poser(25, 42, 'fer', 2); t.poser(38, 42, 'fer', 2);
    t.contour(); t.texture(scene, cle); return cle;
  }
  // la voûte de pierre et le fond sombre
  for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) {
    const dx = (x + 0.5 - 32) / 30, arc = y - (14 - Math.sqrt(Math.max(0, 1 - dx * dx)) * 12);
    if (arc < 0) continue;
    const bord = Math.abs(dx) > 0.86 || arc < 3;
    t.poser(x, y, bord ? 'pierre' : 'terre', bord ? 2 + ((x + y) % 5 === 0 ? 1 : 0) : 1);
  }
  // l'étagère et ses bocaux
  for (let x = 8; x < 56; x++) { t.poser(x, 30, 'chene', 3); t.poser(x, 31, 'chene', 1); }
  [[11, 'confiture'], [17, 'bocal'], [23, 'confiture'], [41, 'bocal'], [47, 'confiture'], [52, 'bocal']].forEach(([x, m]) => { for (let y = 22; y < 30; y++) for (let k = 0; k < 5; k++) t.poser(x + k, y, y === 22 ? 'toile' : m, y === 22 ? 3 : k === 0 ? 4 : 2); });
  // le jambon et les saucissons qui pendent de la voûte
  for (let y = 6; y < 9; y++) t.poser(30, y, 'corde', 3);
  for (let y = 9; y < 20; y++) for (let x = 27 - Math.floor((y - 9) / 3); x <= 33 + Math.floor((y - 9) / 4); x++) t.poser(x, y, 'jambon', x < 30 ? 4 : 2);
  for (const sx of [14, 19, 44, 49]) { for (let y = 8; y < 11; y++) t.poser(sx, y, 'corde', 3); for (let y = 11; y < 19; y++) { t.poser(sx, y, 'jambon', 3); t.poser(sx + 1, y, 'jambon', 1); } }
  // la meule et deux tonnelets, au sol
  for (let y = 44; y < 52; y++) for (let x = 8; x < 22; x++) t.poser(x, y, 'fromage', y === 44 ? 4 : y > 49 ? 1 : 3);
  for (const bx of [36, 48]) for (let y = 38; y < 54; y++) for (let x = bx; x < bx + 10; x++) t.poser(x, y, (y - 38) % 7 === 1 ? 'fer' : 'chene', x === bx ? 4 : x === bx + 9 ? 1 : 2);
  t.contour(); t.texture(scene, cle); return cle;
}

// La couleur d'une barre de fraîcheur (verte, puis orange, puis rouge)
function couleurFraicheur(reste, total) { const f = total ? reste / total : 0; return f > 0.5 ? 0x4a9a3a : f > 0.25 ? 0xe0a030 : 0xc84a2a; }

// Le jour de marché : une guirlande de fanions de toile tendue au-dessus de la place (ils se balancent un peu au vent)
// (v1.63) Une guirlande de fanions nouée entre deux points (a, b : [x, y]), qui pend d'un vrai arrondi de corde (creux : de
// combien elle descend au milieu) ; un nœud à chaque bout, des petits fanions qui bougent au vent
function guirlandeEntre(scene, c, a, b, creux = 10, pas = 20, echelle = 0.75) {
  const [xa, ya] = a, [xb, yb] = b, fil = t => [xa + (xb - xa) * t, ya + (yb - ya) * t + creux * 4 * t * (1 - t)];
  const g = scene.add.graphics(); g.lineStyle(1.4, 0x3b2410, 0.95);
  g.beginPath(); g.moveTo(xa, ya); for (let k = 1; k <= 24; k++) { const [x, y] = fil(k / 24); g.lineTo(x, y); } g.strokePath();
  g.fillStyle(0x3b2410).fillCircle(xa, ya, 2).fillCircle(xb, yb, 2);   // (les nœuds, aux coins des auvents)
  c.add(g);
  const couleurs = [0xc8443a, 0xe8c050, 0x3a7ab0, 0x5a9a4a, 0xe8e0c8], n = Math.max(1, Math.floor(Math.hypot(xb - xa, yb - ya) / pas));
  for (let k = 0; k < n; k++) {
    const [x, y] = fil((k + 0.5) / n), coul = couleurs[k % couleurs.length], l = 9 * echelle, h = 16 * echelle;
    const f = scene.add.graphics({ x, y });
    f.fillStyle(0x2a1a0c).fillTriangle(-l - 1, -1, l + 1, -1, 0, h + 2);
    f.fillStyle(coul).fillTriangle(-l, 0, l, 0, 0, h);
    f.fillStyle(0xffffff, 0.25).fillTriangle(-l, 0, -l + 4 * echelle, 0, 0, h);
    c.add(f);
    scene.tweens.add({ targets: f, angle: { from: -5, to: 5 }, duration: 1300 + (k % 4) * 260, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
}
function guirlandeFanions(scene, c, x0, x1, y, creux, pas = 40, echelle = 1) {
  const g = scene.add.graphics(); g.lineStyle(1.4, 0x3b2410, 0.9);
  const fil = x => y + Math.sin((x - x0) / (x1 - x0) * Math.PI) * creux;
  g.beginPath(); g.moveTo(x0, fil(x0)); for (let x = x0; x <= x1; x += 8) g.lineTo(x, fil(x)); g.strokePath();
  c.add(g);
  const couleurs = [0xc8443a, 0xe8c050, 0x3a7ab0, 0x5a9a4a, 0xe8e0c8];
  for (let x = x0 + pas / 2, k = 0; x < x1; x += pas, k++) {
    const f = scene.add.graphics({ x, y: fil(x) }), coul = couleurs[k % couleurs.length], l = 9 * echelle, h = 16 * echelle;
    f.fillStyle(0x2a1a0c).fillTriangle(-l - 1, -1, l + 1, -1, 0, h + 2);   // (le contour)
    f.fillStyle(coul).fillTriangle(-l, 0, l, 0, 0, h);
    f.fillStyle(0xffffff, 0.25).fillTriangle(-l, 0, -l + 4 * echelle, 0, 0, h);   // (le pli éclairé)
    c.add(f);
    scene.tweens.add({ targets: f, angle: { from: -5, to: 5 }, duration: 1300 + (k % 4) * 260, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
}
