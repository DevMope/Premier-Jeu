// (v1.32, planche 56 v2 validée) La fête des 18 ans : la veille au soir, à l'arrière-boutique. Les fanions sous les poutres,
// la table à hauteur de hanche (pieds tournés, nappe brodée), le gâteau aux dix-huit bougies, les cadeaux, et les invités
// selon ta vie : Garrick, tes frères de sang, tes amis, le mendiant si votre amitié est au plus haut. Puis, au matin, le
// miroir (Miroir.js).
const FETE18 = { invitesMax: 4 };

// La veille : demain, le joueur aura 18 ans
function feteAFaire(G) {
  if (!G || !G.joueur || G.feteFaite) return false;
  const demain = AGE_DEPART + Math.floor((G.jour + (G.decalageJours || 0)) / JOURS_PAR_AN);
  return ageJoueur(G) === 17 && demain >= 18;
}

// Les invités : Garrick, puis les plus proches (frères de sang d'abord), puis le mendiant
function invitesDeLaFete(G) {
  const proches = (G.habitues || []).map(h => ({ h, i: niveauRelation(G, h.nom).index, pts: G.relations[h.nom] || 0 }))
    .filter(o => o.i >= 5 && !((G.personnes || {})[o.h.nom] || {}).mort).sort((a, b) => b.pts - a.pts).slice(0, FETE18.invitesMax - 1);
  const liste = [{ quoi: 'mentor', nom: 'Garrick' }, ...proches.map(o => ({ quoi: { race: o.h.race, nom: o.h.nom, feminin: o.h.feminin, niveau: 'veteran' }, nom: o.h.nom, frere: o.i >= 6 }))];
  if ((G.mendiant || 0) >= MENDIANT_PALIERS.medaille) liste.push({ quoi: 'mendiant', nom: 'le mendiant' });
  return liste.slice(0, FETE18.invitesMax + 1);
}

function feteDes18Ans(scene, suite) {
  const G = window.GAME, objets = [], P = 70;
  G.feteFaite = G.jour;
  creerInterieurHD(scene);
  const ajout = o => { objets.push(o); return o; };
  // la pièce, à la lueur des chandelles
  ajout(scene.add.rectangle(480, 270, 960, 540, 0x0a0604).setDepth(P).setInteractive());
  ajout(scene.add.image(0, 0, murInterieur(scene, 'murArriere', { poteaux: [272, 412], graine: 310 })).setOrigin(0).setScale(2).setTint(0xa07a58).setDepth(P));
  ajout(scene.add.image(0, 440, plancher(scene, 'plancherArriere', { graine: 410 })).setOrigin(0).setScale(2).setTint(0xb0906c).setDepth(P));
  const g = ajout(scene.add.graphics().setDepth(P + 1));
  // les fanions tendus d'une poutre à l'autre (ils se balancent un peu)
  g.lineStyle(2, 0x3a2410).beginPath().moveTo(20, 40); for (let x = 20; x <= 940; x += 20) g.lineTo(x, 40 + Math.sin((x - 20) / 920 * Math.PI) * 70); g.strokePath();
  for (let x = 40, k = 0; x < 930; x += 40, k++) {
    const y = 40 + Math.sin((x - 20) / 920 * Math.PI) * 70, f = ajout(scene.add.triangle(x, y, -12, 0, 12, 0, 0, 26, [0xc03030, 0xe0b030, 0x2a6ab0, 0x3a8a3a][k % 4]).setOrigin(0.5, 0).setDepth(P + 1));
    scene.tweens.add({ targets: f, angle: 6, duration: 1400 + k * 70, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
  // la table à hauteur de hanche, ses pieds tournés, la nappe brodée
  const t = ajout(scene.add.graphics().setDepth(P + 3)), SOLT = 512, yT = SOLT - 56;
  const pied = (x, ombre) => { const c1 = ombre ? 0x3a200e : 0x5a3418, c2 = ombre ? 0x4a2a14 : 0x8a5428, c3 = ombre ? 0x5a3418 : 0xb07a3c;
    t.fillStyle(c1).fillRect(x - 6, yT + 6, 12, 9).fillStyle(c2).fillRect(x - 5, yT + 6, 4, 9);
    t.fillStyle(c1).fillEllipse(x, yT + 17, 14, 5).fillStyle(c2).fillEllipse(x, yT + 26, 13, 14).fillStyle(c3).fillEllipse(x - 3, yT + 24, 4, 8);
    t.fillStyle(c1).fillRect(x - 3, yT + 32, 6, 5).fillStyle(c2).fillEllipse(x, yT + 38, 10, 4).fillStyle(c1).fillRect(x - 2.5, yT + 39, 5, 8);
    t.fillStyle(c2).fillEllipse(x, SOLT - 4, 11, 7).fillStyle(c3).fillEllipse(x - 2, SOLT - 5, 3, 3).fillStyle(0x000000, 0.25).fillEllipse(x + 2, SOLT, 14, 3); };
  pied(392, true); pied(568, true); pied(372, false); pied(588, false);
  t.fillStyle(0x4a2a14).fillRect(360, yT + 2, 240, 6).fillStyle(0x6a4020).fillRect(360, yT + 2, 240, 2);
  t.fillStyle(0xf0e8d8).fillRect(352, yT - 4, 256, 8).fillStyle(0xe4dac6).fillRect(352, yT + 4, 256, 14);
  for (let x = 352; x < 608; x += 8) t.fillStyle(0xc03030).fillRect(x + 2, yT + 8, 4, 3);
  for (let x = 352; x < 608; x += 12) t.fillStyle(0xf0e8d8).fillTriangle(x, yT + 18, x + 12, yT + 18, x + 6, yT + 24).fillStyle(0xd8ccb4).fillCircle(x + 6, yT + 20, 1.5);
  // le gâteau et ses dix-huit bougies
  const yG = yT - 4;
  t.fillStyle(0xc8c0b0).fillEllipse(480, yG, 104, 10).fillStyle(0xe8e4dc).fillEllipse(480, yG - 1, 96, 7);
  t.fillStyle(0x7a3e22).fillRect(442, yG - 26, 76, 24).fillStyle(0x8a4a2a).fillRect(442, yG - 26, 18, 24).fillStyle(0xf4e8d8).fillEllipse(480, yG - 26, 76, 10);
  for (let x = 444; x < 516; x += 8) t.fillStyle(0xf4e8d8).fillTriangle(x, yG - 24, x + 8, yG - 24, x + 4, yG - 17 - (x % 16 ? 0 : 3));
  t.fillStyle(0xc03040).fillCircle(462, yG - 14, 2.5).fillCircle(480, yG - 12, 2.5).fillCircle(498, yG - 14, 2.5);
  const flammes = [];
  for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2, x = 480 + Math.cos(a) * 30, y = yG - 26 + Math.sin(a) * 3.5;
    t.fillStyle(i % 2 ? 0x8ab0e0 : 0xf0c0d0).fillRect(x - 1, y - 9, 2, 9);
    flammes.push(ajout(scene.add.sprite(x, y - 9, 'flammeBougie0').setOrigin(0.5, 1).setDepth(P + 4).play({ key: 'flammeBougie', startFrame: i % 3 }))); }
  const halo = ajout(scene.add.image(480, yG - 40, 'halo').setScale(1.6).setTint(0xffc070).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD).setDepth(P + 4));
  [[380, 0xc03030, 16], [404, 0x2a6ab0, 12], [570, 0x3a8a3a, 14]].forEach(([x, c, h]) => t.fillStyle(c).fillRect(x - 9, yT - 4 - h, 18, h).fillStyle(0xf0d060).fillRect(x - 1.5, yT - 4 - h, 3, h).fillRect(x - 9, yT - 4 - h * 0.6, 18, 3).fillTriangle(x - 5, yT - 4 - h - 4, x, yT - 4 - h, x - 1, yT - 4 - h - 1));
  // JeuneGoy derrière le gâteau, et les invités à la même échelle
  const joueur = ajout(scene.add.image(426, 498, textureJoueur(scene, G)).setOrigin(0.5, 1).setScale(echelleJoueur(7.5)).setDepth(P + 2));
  scene.tweens.add({ targets: joueur, y: 496, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  const invites = invitesDeLaFete(G), places = [230, 306, 690, 772, 150];
  const corps = invites.map((v, i) => { const x = places[i], im = ajout(imageCorps(scene, x, SOLT, v.quoi, 7.5).setDepth(P + 5)); if (x > 480) im.setFlipX(true);
    scene.tweens.add({ targets: im, y: SOLT - 3, duration: 900 + i * 130, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }); return im; });
  // la narration (en italique, sur fond sombre) et la parole (dans une bulle) restent bien distinctes
  const narr = ajout(scene.add.container(480, 186).setDepth(P + 10)), gn = scene.add.graphics();
  gn.fillStyle(0x1a0e06, 0.88).fillRoundedRect(-330, -26, 660, 52, 10).lineStyle(2, 0xc9a227).strokeRoundedRect(-330, -26, 660, 52, 10); narr.add(gn);
  const texteNarr = scene.add.text(0, 0, '', style(14, '#e8dcc0', { fontStyle: 'italic', wordWrap: { width: 630 }, align: 'center' })).setOrigin(0.5); narr.add(texteNarr);
  const noms = invites.slice(1).map(v => v.nom);
  texteNarr.setText(`La veille de tes 18 ans, l'arrière-boutique s'est faite belle. ${noms.length ? `Garrick, ${noms.join(', ')} : ils sont tous là.` : 'Garrick est venu, un gâteau sous le bras.'}`);
  const bulle = (x, y, qui, texte) => { const c = ajout(scene.add.container(x, y).setDepth(P + 11)), gb = scene.add.graphics();
    gb.fillStyle(0xfff8e8).fillRoundedRect(-120, -40, 240, 74, 12).lineStyle(3, 0x8a6a3a).strokeRoundedRect(-120, -40, 240, 74, 12).fillStyle(0xfff8e8).fillTriangle(-60, 34, -30, 34, -40, 64); c.add(gb);
    c.add(scene.add.text(-108, -32, qui, style(11, '#6b4a2a', { fontStyle: 'bold italic' }))); c.add(scene.add.text(-108, -14, texte, style(12, '#2a1608', { wordWrap: { width: 216 } }))); return c; };
  let b1 = bulle(262, 300, 'Garrick', `« Dix-huit bougies, ${G.joueur.feminin ? 'petite' : 'petit'} ! Souffle, et fais un vœu... »`);
  const fermer = () => { for (const o of objets) { if (o.fond) { o.fond.destroy(); o.label.destroy(); } else if (o.active) o.destroy(); } if (suite) suite(); };
  const souffler = creerBouton(scene, 790, 300, 230, 'Souffler les bougies', () => {
    souffler.fond.destroy(); souffler.label.destroy();
    Son.jouer('vent');
    flammes.forEach((f, i) => scene.time.delayedCall(i * 30, () => { const fum = scene.add.circle(f.x, f.y - 6, 2, 0xd8d0c8, 0.7).setDepth(P + 4); objets.push(fum);
      scene.tweens.add({ targets: fum, y: f.y - 30, alpha: 0, scale: 3, duration: 1200 }); f.setVisible(false); }));
    scene.tweens.add({ targets: halo, alpha: 0.12, duration: 600 });
    b1.destroy();
    scene.time.delayedCall(700, () => {
      Son.jouer('fanfare');
      corps.forEach((c, i) => scene.tweens.add({ targets: c, y: c.y - 14, duration: 220, yoyo: true, repeat: 2, delay: i * 90 }));
      for (let i = 0; i < 40; i++) { const p = scene.add.rectangle(480 + (Math.random() - 0.5) * 500, 120, 4, 4, [0xc03030, 0xe0b030, 0x2a6ab0, 0x3a8a3a][i % 4]).setDepth(P + 9); objets.push(p);
        scene.tweens.add({ targets: p, y: 420 + Math.random() * 60, x: p.x + (Math.random() - 0.5) * 120, angle: 360, duration: 1600 + Math.random() * 900 }); }
      b1 = bulle(262, 300, 'Garrick', `« Joyeux anniversaire ! Demain, tu te réveilles ${G.joueur.feminin ? 'une femme' : 'un homme'}. »`);
      texteNarr.setText("Les invités chantent, trinquent, et repartent tard dans la nuit. Demain, tu auras 18 ans.");
      for (const v of invites) if (v.nom !== 'Garrick' && v.nom !== 'le mendiant' && typeof changerRelation === 'function') changerRelation(G, v.nom, 1);
      const fin = creerBouton(scene, 790, 300, 230, 'Belle soirée', () => { fin.fond.destroy(); fin.label.destroy(); fermer(); });
      fin.fond.setDepth(P + 12); fin.label.setDepth(P + 12.1);
    });
  });
  souffler.fond.setDepth(P + 12); souffler.label.setDepth(P + 12.1);
  if (typeof noterJournal === 'function') noterJournal(`fête des 18 ans (${invites.length} invités)`);
}
