// (v0.78, planche à valider) Les récits d'un même royaume ne se ressemblent plus tous : le ciel,
// le sol et les couleurs du royaume restent (on sait toujours où l'on est), mais chaque destination
// a ses arbres, son repère au loin, ses fleurs ou ses cailloux au premier plan, et ses bêtes.
//  - arbres : la forme des arbres du plan moyen
//  - repere : une silhouette au loin, derrière les arbres (moulin, clocher, pont, porte naine...)
//  - sol    : les détails au pied du voyageur (fleurs, pommes, champignons, os, cristaux...)
//  - faune  : les bêtes qui passent (papillons, abeilles, moutons, corbeaux, chauves-souris...)
const VARIANTES_RECIT = {
  // --- La Comté : collines vertes, ciel bleu ---
  collines: { arbres: 'ronds', repere: 'meules', sol: { fleurs: [0xf8e060, 0xffffff] }, faune: ['moutons', 'oiseaux'] },
  vergers: { arbres: 'pommiers', repere: 'moulin', sol: { pommes: true, fleurs: [0xffffff, 0xf8c8d8] }, faune: ['abeilles', 'oiseaux'] },
  vallon: { arbres: 'saules', repere: 'chaumiere', sol: { fleurs: [0xb070e0, 0xe84a5a, 0xf8e060, 0x80c0f8], dense: true }, faune: ['papillons'] },
  abbaye: { arbres: 'cypres', repere: 'clocher', sol: { fleurs: [0x9a70d8, 0xb090e8], dense: true }, faune: ['colombes'] },
  // --- La forêt des hommes et celle des Bannis ---
  foret: { arbres: 'chenes', repere: 'vieuxChene', sol: { champignons: true, fougeres: true }, faune: ['cerf', 'oiseaux'] },
  pont: { arbres: 'sapins', repere: 'pont', sol: { pierres: true, fougeres: true }, faune: ['corbeaux'] },
  chamans: { arbres: 'sapins', repere: 'totems', sol: { cranes: true, plumes: true }, faune: ['lucioles'] },
  // --- Les nains ---
  mines: { arbres: null, repere: 'chevalement', sol: { pierres: true }, faune: ['chauvesSouris'] },
  forge: { arbres: null, repere: 'porteNaine', sol: { pierres: true }, faune: ['braises'] },
  // --- Les elfes ---
  sanctuaire: { arbres: 'mallorns', repere: 'lothlorien', sol: { fleurs: [0xffffff, 0xd8f0ff], luisantes: true }, faune: ['lucioles'] },
  lac: { arbres: 'automne', repere: 'fondcombe', sol: { roseaux: true, fleurs: [0xffffff] }, faune: ['lucioles', 'poissons'] },
  // --- Les mages ---
  opale: { arbres: null, repere: 'opaleCite', sol: { cristaux: true }, faune: ['etincelles'] },
  bibliotheque: { arbres: null, repere: 'bibliothequeHD', sol: { pages: true }, faune: ['livres'] },
  // --- Les sables ---
  desert: { arbres: 'cactus', repere: 'cotesHD', sol: { os: true }, faune: ['vautours'] },
  tombeaux: { arbres: 'colonnes', repere: 'pyramide', sol: { poteries: true }, faune: ['vautours'] },
  // --- Les terres brûlées des orcs ---
  fort: { arbres: 'pieux', repere: 'palissade', sol: { pierres: true, cranes: true }, faune: ['corbeaux'] },
  minesRouges: { arbres: null, repere: 'echafaudage', sol: { pierres: true, rouge: true }, faune: ['braises'] },
  // --- La neige ---
  pics: { arbres: 'sapinsNeige', repere: 'sommet', sol: { pierres: true }, faune: ['aigle', 'blizzard'] },
  col: { arbres: null, repere: 'colHurlements', sol: { pierres: true, cranes: true }, faune: ['corbeaux', 'vent'], sombre: 0x1a1030 },
};

function varianteRecit(zone) { return zone ? VARIANTES_RECIT[zone] || null : null; }

// --- Les arbres du plan moyen (en silhouette, à la couleur du royaume) ---
function dessinerArbreVariante(g, forme, x, sol, h, r, teinte) {
  const clair = melangeCouleur(teinte, 0xffffff, 0.12);
  g.fillStyle(teinte, 0.82);
  switch (forme) {
    case 'pommiers': {
      g.fillRect(x - 3, sol - h * 0.45, 6, h * 0.45);
      g.fillEllipse(x, sol - h * 0.45 - r * 0.5, r * 2.3, r * 1.7);
      for (let k = 0; k < 7; k++) g.fillStyle(0xc83226, 0.85).fillCircle(x - r * 0.8 + ((k * 37) % (r * 1.6)), sol - h * 0.45 - r * 0.9 + ((k * 23) % (r * 1.1)), 2.4);
      break;
    }
    case 'saules': {
      g.fillRect(x - 3, sol - h * 0.55, 6, h * 0.55);
      g.fillEllipse(x, sol - h * 0.6, r * 2.2, r * 1.1);
      for (let k = -4; k <= 4; k++) g.fillRect(x + k * r * 0.25 - 1.5, sol - h * 0.6, 3, h * 0.42 - Math.abs(k) * 4);   // les branches qui pleurent
      break;
    }
    case 'cypres': g.fillEllipse(x, sol - h * 0.55, r * 0.8, h * 1.1); break;
    case 'chenes': {
      g.fillRect(x - 5, sol - h * 0.5, 10, h * 0.5);
      for (const [dx, dy, k] of [[0, -0.75, 1.1], [-0.9, -0.45, 0.9], [0.9, -0.45, 0.9], [-0.45, -0.95, 0.8], [0.5, -0.95, 0.8]]) g.fillCircle(x + dx * r, sol - h * 0.5 + dy * r, r * k);
      break;
    }
    case 'sapins': for (let k = 0; k < 3; k++) g.fillTriangle(x - r * (1.2 - k * 0.3), sol - h * (0.15 + k * 0.28), x, sol - h * (0.55 + k * 0.3), x + r * (1.2 - k * 0.3), sol - h * (0.15 + k * 0.28)); g.fillRect(x - 3, sol - h * 0.15, 6, h * 0.15); break;
    case 'bouleaux': {
      g.fillStyle(0xe8e8e0, 0.85).fillRect(x - 2.5, sol - h * 0.75, 5, h * 0.75);
      for (let k = 0; k < 5; k++) g.fillStyle(0x2a2a2a, 0.6).fillRect(x - 2.5, sol - h * (0.15 + k * 0.12), 3, 2);
      g.fillStyle(teinte, 0.7).fillEllipse(x, sol - h * 0.8, r * 1.6, r * 1.8);
      break;
    }
    case 'cactus': {
      g.fillRoundedRect(x - 5, sol - h * 0.7, 10, h * 0.7, 5);
      g.fillRoundedRect(x - 16, sol - h * 0.5, 7, h * 0.22, 3); g.fillRect(x - 16, sol - h * 0.32, 14, 6);
      g.fillRoundedRect(x + 9, sol - h * 0.62, 7, h * 0.24, 3); g.fillRect(x + 3, sol - h * 0.42, 13, 6);
      break;
    }
    case 'colonnes': {
      const hh = h * (0.4 + ((x * 7) % 5) / 10);
      g.fillRect(x - 7, sol - hh, 14, hh); g.fillRect(x - 10, sol - 6, 20, 6);
      g.fillStyle(clair, 0.8).fillTriangle(x - 7, sol - hh, x + 7, sol - hh, x + 2, sol - hh - 8);   // la cassure
      break;
    }
    case 'pieux': for (let k = -1; k <= 1; k++) { g.fillRect(x + k * 9 - 3, sol - h * 0.5, 6, h * 0.5); g.fillTriangle(x + k * 9 - 3, sol - h * 0.5, x + k * 9 + 3, sol - h * 0.5, x + k * 9, sol - h * 0.5 - 9); } break;
    default: {   // 'ronds' : les arbres ronds de la Comté
      g.fillRect(x - 3, sol - h * 0.5, 6, h * 0.5);
      g.fillCircle(x, sol - h * 0.5 - r * 0.6, r); g.fillCircle(x - r * 0.7, sol - h * 0.5 - r * 0.2, r * 0.8); g.fillCircle(x + r * 0.7, sol - h * 0.5 - r * 0.2, r * 0.8);
    }
  }
}

// --- Le repère au loin : une silhouette pâle, derrière les arbres ---
function dessinerRepere(g, quoi, teinte, sol) {
  const c = teinte;
  g.fillStyle(c, 0.92);
  switch (quoi) {
    case 'meules': for (const [x, s] of [[300, 1], [360, 0.8], [690, 1.1]]) { g.fillEllipse(x, sol - 14 * s, 44 * s, 34 * s); g.fillRect(x - 22 * s, sol - 14 * s, 44 * s, 14 * s); } break;
    case 'moulin': {
      g.fillTriangle(640, sol, 700, sol, 670, sol - 120); g.fillRect(648, sol - 70, 44, 70);
      g.lineStyle(7, c, 0.75);
      for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + 0.4; g.lineBetween(670, sol - 112, 670 + Math.cos(a) * 62, sol - 112 + Math.sin(a) * 62); }
      g.fillCircle(670, sol - 112, 7);
      break;
    }
    case 'chaumiere': {
      g.fillRect(620, sol - 48, 90, 48); g.fillTriangle(606, sol - 46, 724, sol - 46, 665, sol - 96);
      g.fillRect(690, sol - 104, 12, 30);
      break;
    }
    case 'clocher': {
      g.fillRect(560, sol - 70, 180, 70); g.fillTriangle(550, sol - 68, 750, sol - 68, 650, sol - 110);
      g.fillRect(700, sol - 170, 40, 170); g.fillTriangle(694, sol - 168, 746, sol - 168, 720, sol - 222);
      g.fillStyle(melangeCouleur(c, 0x000000, 0.4), 0.7).fillRect(712, sol - 150, 16, 18);
      break;
    }
    case 'pont': {
      g.fillRect(480, sol - 92, 420, 16);
      for (const x of [540, 690, 840]) { g.fillRect(x - 14, sol - 80, 28, 80); }
      g.fillStyle(melangeCouleur(c, 0x000000, 0.35), 0.6);
      for (const x of [615, 765]) g.fillEllipse(x, sol - 30, 120, 90);
      break;
    }
    case 'totems': for (const [x, h] of [[600, 120], [690, 90], [780, 140]]) { g.fillRect(x - 10, sol - h, 20, h); g.fillTriangle(x - 26, sol - h + 26, x + 26, sol - h + 26, x, sol - h + 6); g.fillStyle(melangeCouleur(c, 0x000000, 0.45), 0.7).fillRect(x - 6, sol - h + 34, 4, 4).fillRect(x + 2, sol - h + 34, 4, 4); g.fillStyle(c, 0.75); } break;
    case 'chevalement': {
      g.lineStyle(6, c, 0.8);
      g.lineBetween(600, sol, 650, sol - 150); g.lineBetween(700, sol, 650, sol - 150); g.lineBetween(615, sol - 50, 685, sol - 50); g.lineBetween(630, sol - 100, 672, sol - 100);
      g.strokeCircle(650, sol - 150, 16);
      g.fillRect(720, sol - 22, 50, 22); g.fillCircle(728, sol, 6); g.fillCircle(762, sol, 6);   // un wagonnet
      break;
    }
    case 'porteNaine': {
      g.fillTriangle(420, sol, 900, sol, 660, sol - 230);
      g.fillStyle(melangeCouleur(c, 0x000000, 0.45), 0.85).fillRect(610, sol - 120, 100, 120); g.fillEllipse(660, sol - 120, 100, 60);
      g.fillStyle(melangeCouleur(c, 0xffd080, 0.35), 0.7).fillRect(586, sol - 130, 14, 130).fillRect(720, sol - 130, 14, 130);   // les deux statues-piliers
      break;
    }
    case 'arches': for (const x of [560, 700, 840]) { g.lineStyle(9, melangeCouleur(c, 0xffffff, 0.35), 0.7); g.beginPath(); g.arc(x, sol - 60, 40, Math.PI, 0); g.strokePath(); g.fillStyle(melangeCouleur(c, 0xffffff, 0.35), 0.7).fillRect(x - 44, sol - 60, 9, 60).fillRect(x + 35, sol - 60, 9, 60); } break;
    case 'lac': {
      g.fillStyle(0x6a8ac8, 0.55).fillEllipse(640, sol - 6, 620, 46);
      g.fillStyle(0xf8f8ff, 0.5).fillEllipse(700, sol - 8, 70, 6).fillEllipse(690, sol - 2, 40, 4);   // le reflet de la lune
      g.fillStyle(0xf8f8ff, 0.8).fillCircle(700, sol - 210, 18);
      break;
    }
    case 'flèches': for (const [x, h] of [[560, 160], [630, 230], [700, 190], [790, 140]]) { g.fillRect(x - 12, sol - h, 24, h); g.fillTriangle(x - 16, sol - h, x + 16, sol - h, x, sol - h - 48); g.fillStyle(0xf8f0ff, 0.6).fillCircle(x, sol - h - 50, 4); g.fillStyle(c, 0.75); } break;
    case 'tourLivres': {
      g.fillRect(620, sol - 210, 90, 210); g.fillTriangle(610, sol - 208, 720, sol - 208, 665, sol - 260);
      for (let k = 0; k < 4; k++) g.fillStyle(0xf8e8a0, 0.55).fillRect(645, sol - 190 + k * 44, 12, 18).fillRect(675, sol - 190 + k * 44, 12, 18);
      break;
    }
    case 'cotes': for (let k = 0; k < 6; k++) { g.lineStyle(7, 0xf0e8d8, 0.7); g.beginPath(); g.arc(560 + k * 34, sol, 46 - Math.abs(k - 2.5) * 6, Math.PI, Math.PI * 1.55); g.strokePath(); } g.fillStyle(0xf0e8d8, 0.7).fillRect(540, sol - 6, 210, 6); break;
    case 'pyramide': g.fillTriangle(520, sol, 860, sol, 690, sol - 170); g.fillStyle(melangeCouleur(c, 0x000000, 0.4), 0.7).fillRect(676, sol - 34, 28, 34); break;
    case 'palissade': for (let x = 480; x < 920; x += 22) { g.fillRect(x, sol - 70, 18, 70); g.fillTriangle(x, sol - 70, x + 18, sol - 70, x + 9, sol - 86); } g.fillRect(660, sol - 130, 70, 130); g.fillTriangle(650, sol - 130, 740, sol - 130, 695, sol - 160); break;
    case 'echafaudage': {
      g.lineStyle(5, c, 0.8);
      for (const x of [580, 640, 700, 760]) g.lineBetween(x, sol, x, sol - 140);
      for (const y of [40, 90, 140]) g.lineBetween(570, sol - y, 770, sol - y);
      g.lineBetween(580, sol - 40, 640, sol - 90); g.lineBetween(700, sol - 90, 760, sol - 140);
      break;
    }
    case 'cairn': for (let k = 0; k < 5; k++) g.fillEllipse(690, sol - 10 - k * 18, 60 - k * 9, 20); g.lineStyle(3, c, 0.8).lineBetween(690, sol - 96, 690, sol - 150); g.fillStyle(0xa02a24, 0.7).fillTriangle(690, sol - 150, 730, sol - 142, 690, sol - 130); break;
  }
}

// --- Le premier plan : ce qui pousse (ou traîne) au pied du voyageur ---
function dessinerSolVariante(g, sol, s) {
  const pas = s.dense ? 14 : 30;
  for (let x = -80; x < 1280; x += pas + (x * 7) % 11) {
    const y = sol + 2 - ((x * 3) % 6);
    if (s.fleurs) {
      const c = s.fleurs[Math.abs(x) % s.fleurs.length];
      g.fillStyle(0x2a5a20, 0.9).fillRect(x, y - 8, 1.5, 8);
      g.fillStyle(c, s.luisantes ? 1 : 0.95).fillCircle(x + 0.75, y - 9, 2.6);
      g.fillStyle(0xf8e060, 0.9).fillCircle(x + 0.75, y - 9, 0.9);
      if (s.luisantes) g.fillStyle(c, 0.25).fillCircle(x + 0.75, y - 9, 6);
    }
  }
  for (let x = -40; x < 1280; x += 90 + (x * 13) % 60) {
    const y = sol + 3;
    if (s.pommes) g.fillStyle(0xc83226, 1).fillCircle(x, y - 3, 4).fillStyle(0xf08060, 1).fillCircle(x - 1.5, y - 4.5, 1.2);
    if (s.champignons) { g.fillStyle(0xe8dcc0, 1).fillRect(x - 1.5, y - 8, 3, 8); g.fillStyle(0xc02a20, 1).fillEllipse(x, y - 9, 13, 7); g.fillStyle(0xffffff, 1).fillCircle(x - 2, y - 10, 1.2).fillCircle(x + 3, y - 9, 1); }
    if (s.fougeres) for (let k = -2; k <= 2; k++) { g.lineStyle(2, 0x2f6a2a, 0.95); g.lineBetween(x + 30, y, x + 30 + k * 7, y - 16 + Math.abs(k) * 3); }
    if (s.pierres) g.fillStyle(s.rouge ? 0x8a3a24 : 0x6a6a70, 1).fillEllipse(x + 50, y - 3, 16, 9).fillStyle(s.rouge ? 0xb05a3a : 0x9a9aa4, 1).fillEllipse(x + 47, y - 5, 7, 3);
    if (s.cranes) { g.fillStyle(0xe8e0c8, 1).fillEllipse(x + 15, y - 5, 12, 10); g.fillStyle(0x2a1a10, 1).fillCircle(x + 12, y - 6, 1.6).fillCircle(x + 18, y - 6, 1.6); }
    if (s.plumes) { g.fillStyle(0xd84a2a, 1).fillEllipse(x + 62, y - 6, 4, 14); g.lineStyle(1, 0x3a2a1a, 1).lineBetween(x + 62, y + 1, x + 62, y - 12); }
    if (s.os) { g.fillStyle(0xf0e8d8, 1).fillRect(x, y - 4, 20, 3); g.fillCircle(x, y - 2.5, 2.6).fillCircle(x + 20, y - 2.5, 2.6); }
    if (s.poteries) { g.fillStyle(0xb06a3a, 1).fillEllipse(x + 20, y - 7, 14, 14); g.fillStyle(0x8a4a24, 1).fillRect(x + 16, y - 16, 8, 4); }
    if (s.cristaux) for (let k = -1; k <= 1; k++) { g.fillStyle(0xc8b0f8, 0.95).fillTriangle(x + k * 6 - 3, y, x + k * 6 + 3, y, x + k * 6, y - 14 + Math.abs(k) * 5); g.fillStyle(0xffffff, 0.6).fillTriangle(x + k * 6 - 1, y, x + k * 6, y, x + k * 6, y - 12 + Math.abs(k) * 5); }
    if (s.pages) g.fillStyle(0xf0e8d0, 1).fillRect(x + 30, y - 4, 12, 8).lineStyle(1, 0x5a4a3a, 0.8).lineBetween(x + 32, y - 2, x + 40, y - 2);
    if (s.roseaux) for (let k = 0; k < 4; k++) { g.lineStyle(2, 0x4a6a2a, 1).lineBetween(x + k * 4, y, x + k * 4 + 2, y - 22 - k * 3); g.fillStyle(0x6a4a2a, 1).fillEllipse(x + k * 4 + 2, y - 22 - k * 3, 3, 8); }
  }
}

// --- La faune : de petites bêtes animées ---
function lancerFaune(scene, quoi, plan) {
  const ciel = (y0, y1) => Phaser.Math.Between(y0, y1);
  const vol = (forme, couleur, y, duree, taille = 1, sens = 1) => {
    const g = scene.add.graphics(); plan.add(g);
    const dessiner = (haut) => { g.clear(); g.lineStyle(2 * taille, couleur, 0.95); g.lineBetween(-6 * taille, haut ? -4 * taille : 2 * taille, 0, 0); g.lineBetween(0, 0, 6 * taille, haut ? -4 * taille : 2 * taille); };
    dessiner(true);
    let h = true; const battre = scene.time.addEvent({ delay: forme === 'plane' ? 600 : 180, loop: true, callback: () => { h = !h; dessiner(h); } });
    g.setPosition(sens > 0 ? -40 : 1000, y);
    scene.tweens.add({ targets: g, x: sens > 0 ? 1000 : -40, duration: duree, ease: 'Linear', onComplete: () => { battre.remove(); g.destroy(); } });
    scene.tweens.add({ targets: g, y: y + 14, duration: duree / 6, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  };
  const petit = (couleur, x, y, r, alpha = 1) => { const c = scene.add.circle(x, y, r, couleur, alpha); plan.add(c); return c; };
  switch (quoi) {
    case 'oiseaux': return scene.time.addEvent({ delay: 4200, loop: true, startAt: 3000, callback: () => { const y = ciel(40, 140); for (let k = 0; k < 3; k++) scene.time.delayedCall(k * 260, () => vol('bat', 0x2a2a30, y + k * 10, 9000, 0.8)); } });
    case 'corbeaux': return scene.time.addEvent({ delay: 5200, loop: true, startAt: 3500, callback: () => vol('bat', 0x101014, ciel(60, 160), 7000, 1.1, -1) });
    case 'colombes': return scene.time.addEvent({ delay: 4800, loop: true, startAt: 3000, callback: () => { const y = ciel(60, 150); for (let k = 0; k < 2; k++) scene.time.delayedCall(k * 300, () => vol('bat', 0xf8f8f0, y + k * 12, 8000, 0.9)); } });
    case 'vautours': case 'aigle': {
      // (v0.81) trois vautours qui tournent en rond au-dessus des carcasses (un seul aigle)
      for (let k = 0; k < (quoi === 'aigle' ? 1 : 3); k++) {
        const g = scene.add.graphics(); plan.add(g);
        g.lineStyle(3, quoi === 'aigle' ? 0x3a2a1a : 0x1a1410, 0.9); g.lineBetween(-12, -3, 0, 0); g.lineBetween(0, 0, 12, -3); g.fillStyle(0x1a1410, 0.9).fillCircle(0, 0, 2.5);
        const cx = quoi === 'aigle' ? 300 : 560 + k * 90, cy = 70 + k * 22, r = 70 + k * 25;
        const t = { a: k * 2 };
        scene.tweens.add({ targets: t, a: k * 2 + Math.PI * 2, duration: 8000 + k * 1700, repeat: -1, onUpdate: () => g.setPosition(cx + Math.cos(t.a) * r, cy + Math.sin(t.a) * 22).setScale(Math.cos(t.a) > 0 ? 1 : -1, 1) });
      }
      return null;
    }
    case 'vent': case 'blizzard': return scene.time.addEvent({ delay: quoi === 'blizzard' ? 30 : 90, loop: true, callback: () => {
      // des traînées de neige et de vent, à l'horizontale, qui hurlent à travers le paysage
      const y = Phaser.Math.Between(10, 350), l = Phaser.Math.Between(20, 70);
      const r = scene.add.rectangle(1000, y, l, quoi === 'blizzard' ? 2 : 1.5, 0xffffff, quoi === 'blizzard' ? 0.75 : 0.45).setDepth(Math.random() < 0.5 ? -0.45 : 6.8);
      scene.tweens.add({ targets: r, x: -80, y: y + Phaser.Math.Between(10, 50), duration: Phaser.Math.Between(500, 900), ease: 'Linear', onComplete: () => r.destroy() });
    } });
    case 'papillons': case 'abeilles': {
      const couleurs = quoi === 'abeilles' ? [0xf0c020] : [0xf8a0c8, 0xf8e060, 0x80c8f8, 0xffffff];
      for (let k = 0; k < (quoi === 'abeilles' ? 6 : 5); k++) {
        const b = petit(couleurs[k % couleurs.length], Phaser.Math.Between(60, 900), Phaser.Math.Between(250, 330), quoi === 'abeilles' ? 1.8 : 2.6);
        const bouger = () => { if (!b.active) return; scene.tweens.add({ targets: b, x: Phaser.Math.Clamp(b.x + Phaser.Math.Between(-90, 90), 20, 940), y: Phaser.Math.Between(240, 335), duration: Phaser.Math.Between(900, 1800), ease: 'Sine.easeInOut', onComplete: bouger }); };
        bouger();
        if (quoi === 'papillons') scene.tweens.add({ targets: b, scaleX: 0.3, duration: 120, yoyo: true, repeat: -1 });
      }
      return null;
    }
    case 'lucioles': case 'etincelles': case 'braises': {
      const couleur = quoi === 'lucioles' ? 0xe8ff90 : quoi === 'braises' ? 0xff9030 : 0xd8c0ff;
      return scene.time.addEvent({ delay: quoi === 'braises' ? 260 : 380, loop: true, callback: () => {
        const p = petit(couleur, Phaser.Math.Between(20, 940), Phaser.Math.Between(quoi === 'braises' ? 300 : 200, 340), 1.8, 0);
        p.setBlendMode(Phaser.BlendModes.ADD);
        scene.tweens.add({ targets: p, alpha: { from: 0, to: 0.95 }, y: p.y - (quoi === 'braises' ? 90 : 40), x: p.x + Phaser.Math.Between(-30, 30), duration: 1600, yoyo: quoi !== 'braises', onComplete: () => p.destroy() });
      } });
    }
    case 'chauvesSouris': return scene.time.addEvent({ delay: 2600, loop: true, startAt: 1500, callback: () => vol('bat', 0x1a1018, ciel(60, 200), 4200, 0.9, Math.random() < 0.5 ? 1 : -1) });
    case 'livres': return scene.time.addEvent({ delay: 3400, loop: true, startAt: 1500, callback: () => {
      const l = scene.add.container(-30, ciel(70, 200)); plan.add(l);
      const g = scene.add.graphics(); l.add(g);   // (v0.81) un vrai petit livre : la couverture, les pages blanches au milieu
      g.fillStyle(Phaser.Utils.Array.GetRandom([0x8a2a3a, 0x2a4a8a, 0x2a6a3a]), 1).fillRect(-11, -7, 22, 14); g.fillStyle(0xf4ecd4, 1).fillRect(-9, -6, 8, 11).fillRect(1, -6, 8, 11); g.lineStyle(1, 0x5a4a3a, 0.8).lineBetween(-7, -3, -3, -3).lineBetween(3, -3, 7, -3).lineBetween(-7, 0, -3, 0).lineBetween(3, 0, 7, 0);
      scene.tweens.add({ targets: l, x: 1000, duration: 9000, ease: 'Linear', onComplete: () => l.destroy() });
      scene.tweens.add({ targets: l, scaleY: 0.3, y: l.y - 16, duration: 300, yoyo: true, repeat: -1 });
    } });
    case 'moutons': {
      for (const [x, s] of [[230, 1], [270, 0.85], [760, 0.95]]) {
        const m = scene.add.container(x, 330); plan.add(m);
        const g = scene.add.graphics(); m.add(g);
        g.fillStyle(0xf4f0e4, 1).fillEllipse(0, -9 * s, 26 * s, 16 * s); g.fillStyle(0x2a2420, 1).fillEllipse(13 * s, -11 * s, 8 * s, 7 * s).fillRect(-8 * s, -3 * s, 3 * s, 6 * s).fillRect(6 * s, -3 * s, 3 * s, 6 * s);
        scene.tweens.add({ targets: m, angle: 4, duration: 700, yoyo: true, repeat: -1, repeatDelay: Phaser.Math.Between(1500, 3500) });   // il broute
      }
      return null;
    }
    case 'cerf': {
      const c = scene.add.graphics(); plan.add(c);
      c.fillStyle(0x3a2a1a, 0.85).fillEllipse(0, -24, 40, 18).fillRect(-16, -18, 4, 18).fillRect(12, -18, 4, 18).fillRect(16, -44, 6, 22).fillEllipse(22, -46, 12, 8);
      c.lineStyle(2, 0x3a2a1a, 0.85).lineBetween(20, -50, 14, -64).lineBetween(24, -50, 30, -64).lineBetween(16, -58, 10, -60).lineBetween(28, -58, 34, -60);
      c.setPosition(780, 332);
      scene.tweens.add({ targets: c, scaleY: 0.96, duration: 1400, yoyo: true, repeat: -1 });
      return null;
    }
    case 'poissons': return scene.time.addEvent({ delay: 2800, loop: true, startAt: 1200, callback: () => {
      const x = Phaser.Math.Between(420, 900), p = scene.add.ellipse(x, 328, 12, 5, 0xc8d8f0); plan.add(p);
      scene.tweens.add({ targets: p, y: 300, x: x + 26, angle: -40, duration: 340, yoyo: true, ease: 'Quad.easeOut', onComplete: () => p.destroy() });
    } });
  }
  return null;
}

// Pose toute la variante d'une destination dans le récit : repère, arbres (à la place des arbres
// génériques), sol, faune.
function planterVarianteRecit(scene, zone, biome) {
  const v = varianteRecit(zone);
  if (!v) return false;
  const b = BIOMES[biome] || BIOMES.comte;
  const sol = 332;
  const loin = melangeCouleur(melangeCouleur(b.loin, b.ciel, 0.25), 0x1a1420, 0.25);
  if (v.repere) {
    // (v0.80) le repère peint en pixel art, s'il existe ; sinon l'ancienne silhouette
    const cle = typeof textureRepere === 'function' ? textureRepere(scene, v.repere) : null;
    if (cle) {
      const lac = v.repere === 'lac';
      const img = scene.add.image(lac ? 640 : 690, sol + (lac ? 8 : 3), cle).setOrigin(0.5, 1).setTint(0xf0eeea);
      scene.planMoyen.addAt(img, 0);
      // (v0.81) au Col des Hurlements, deux loups noirs hurlent à la lune sur l'éperon
      if (v.repere === 'colHurlements' && typeof creerRecitEpreuvesHD === 'function') {
        creerRecitEpreuvesHD(scene);
        [[662, false], [718, true]].forEach(([x, flip], i) => {
          const l = scene.add.image(x, img.y - 138, 'loupHD_hurle').setOrigin(0.5, 1).setScale(1.05).setFlipX(flip).setTint(0x2a2430);
          scene.planMoyen.addAt(l, 1);
          scene.tweens.add({ targets: l, scaleY: 1.09, duration: 900 + i * 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        });
      }
    } else { const g = scene.add.graphics(); dessinerRepere(g, v.repere, loin, sol); scene.planMoyen.addAt(g, 0); }
  }
  if (v.arbres) {
    const neige = ['montagne', 'glace', 'neige'].includes(biome);
    const sombre = ['foret', 'marais', 'repaire', 'tour', 'grotte'].includes(biome);
    const teinte = neige ? 0x6a7a74 : melangeCouleur(b.arbres || b.loin, 0x0a0a10, sombre ? 0.45 : 0.3);
    const cleArbre = typeof textureArbre === 'function' ? textureArbre(scene, v.arbres) : null;
    const g = scene.add.graphics();
    for (let x = -60; x < 1100; x += 80 + (x * 3) % 50) {
      if (v.repere && x > 500 && x < 880) continue;   // (on laisse voir le repère)
      // (v0.81) des arbres peints, un peu voilés par la distance ; sinon l'ancienne silhouette
      if (cleArbre) scene.planMoyen.add(scene.add.image(x, sol + 2, cleArbre).setOrigin(0.5, 1).setScale(0.75 + ((x * 7) % 40) / 100).setFlipX((x * 3) % 2 === 0).setTint(sombre ? 0x9a9aa0 : 0xd8d8d0));
      else dessinerArbreVariante(g, v.arbres, x, sol, 60 + (x * 7) % 70, 22 + (x * 5) % 18, teinte);
    }
    scene.planMoyen.add(g);
  }
  if (v.sombre) scene.add.rectangle(480, 185, 960, 370, v.sombre, 0.45).setDepth(-1.5);   // (un ciel lourd, menaçant)
  if (v.sol) { const g = scene.add.graphics(); dessinerSolVariante(g, 370, v.sol); scene.premierPlan.add(g); }
  scene.fauneRecit = (v.faune || []).map(f => lancerFaune(scene, f, scene.planMoyen)).filter(Boolean);
  return !!v.arbres;
}
