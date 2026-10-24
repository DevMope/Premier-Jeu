// (v0.78, planche validée) Les récits d'un même royaume ne se ressemblent plus tous : le ciel,
// le sol et les couleurs du royaume restent (on sait toujours où l'on est), mais chaque destination
// a ses arbres, son repère au loin, ses fleurs ou ses cailloux au premier plan, et ses bêtes.
//  - arbres : la forme des arbres posés dans le pré
//  - repere : une silhouette au loin, sur les collines (moulin, clocher, pont, porte naine...)
//  - sol    : les détails au pied du voyageur (fleurs, pommes, champignons, os, cristaux...)
//  - faune  : les bêtes qui passent (papillons, abeilles, moutons, corbeaux, chauves-souris...)
//  - vivant : (v1.62, planche 87 validée) le décor vivant de la contrée, posé au sol, qui bouge en images clés
//
// (v1.62, planche 87) Le monde du récit fait un écran et demi : chaque plan a son facteur de défilement
// (voir StoryScene.creerMonde). Tout ce qui touche le sol est posé dans `planMoyen` (×1, derrière la
// barrière du chemin), le repère dans `planLoin` (×0,55, sur les collines du milieu), ce qui vole dans
// `planCiel` (×0,1), les fleurs du bord dans `premierPlan` (×1,25). Rien ne glisse : on ne déplace
// jamais un plan, c'est la caméra qui suit le voyageur.
const VARIANTES_RECIT = {
  // --- La Comté : collines vertes, ciel bleu ---
  collines: { arbres: 'ronds', repere: 'moulin', sol: { fleurs: [0xf8e060, 0xffffff] }, faune: ['moutons', 'oiseaux'], vivant: 'moisson' },
  vergers: { arbres: 'pommiers', repere: 'moulin', sol: { pommes: true, fleurs: [0xffffff, 0xf8c8d8] }, faune: ['oiseaux'], vivant: 'verger' },
  vallon: { arbres: 'saules', repere: 'chaumiere', sol: { fleurs: [0xb070e0, 0xe84a5a, 0xf8e060, 0x80c0f8], dense: true }, faune: ['papillons'] },
  abbaye: { arbres: 'cypres', repere: 'clocher', sol: { fleurs: [0x9a70d8, 0xb090e8], dense: true }, faune: ['colombes'] },
  // --- La forêt des hommes et celle des Bannis ---
  foret: { arbres: 'chenes', repere: 'vieuxChene', sol: { champignons: true, fougeres: true }, faune: ['oiseaux'], vivant: 'foret' },
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
  pics: { arbres: 'sapinsNeige', repere: 'sommet', sol: { pierres: true }, faune: ['blizzard'], vivant: 'pics' },
  col: { arbres: null, repere: 'colHurlements', sol: { pierres: true, cranes: true }, faune: ['corbeaux', 'vent'], sombre: 0x1a1030 },
};
// la largeur du monde d'un récit (au sol, ×1) : un écran et demi, et une marge pour le dernier cadrage
const LARGEUR_RECIT = 1600;
// où se posent les pieds de ce qui est dans le pré, juste derrière la barrière du chemin (de 342 à 360)
const PRE_RECIT = { loin: 334, pres: 356 };

function varianteRecit(zone) { return zone ? VARIANTES_RECIT[zone] || null : null; }

// Poser un objet dans un plan : il prend le facteur de défilement du plan (Phaser le lit sur chaque enfant)
function dansPlan(plan, o) { if (o.setScrollFactor) o.setScrollFactor(plan.facteur ?? 1, 1); plan.add(o); return o; }

// --- Les arbres (en silhouette, à la couleur du royaume, quand il n'y a pas d'arbre peint) ---
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

// --- Le repère au loin : une silhouette pâle, quand il n'est pas peint (centré sur x = 0) ---
function dessinerRepere(g, quoi, teinte, sol) {
  const c = teinte;
  g.fillStyle(c, 0.92);
  switch (quoi) {
    case 'meules': for (const [x, s] of [[-390, 1], [-330, 0.8], [0, 1.1]]) { g.fillEllipse(x, sol - 14 * s, 44 * s, 34 * s); g.fillRect(x - 22 * s, sol - 14 * s, 44 * s, 14 * s); } break;
    case 'moulin': {
      g.fillTriangle(-50, sol, 10, sol, -20, sol - 120); g.fillRect(-42, sol - 70, 44, 70);
      g.lineStyle(7, c, 0.75);
      for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + 0.4; g.lineBetween(-20, sol - 112, -20 + Math.cos(a) * 62, sol - 112 + Math.sin(a) * 62); }
      g.fillCircle(-20, sol - 112, 7);
      break;
    }
    case 'arches': for (const x of [-130, 10, 150]) { g.lineStyle(9, melangeCouleur(c, 0xffffff, 0.35), 0.7); g.beginPath(); g.arc(x, sol - 60, 40, Math.PI, 0); g.strokePath(); g.fillStyle(melangeCouleur(c, 0xffffff, 0.35), 0.7).fillRect(x - 44, sol - 60, 9, 60).fillRect(x + 35, sol - 60, 9, 60); } break;
    case 'flèches': for (const [x, h] of [[-130, 160], [-60, 230], [10, 190], [100, 140]]) { g.fillRect(x - 12, sol - h, 24, h); g.fillTriangle(x - 16, sol - h, x + 16, sol - h, x, sol - h - 48); g.fillStyle(0xf8f0ff, 0.6).fillCircle(x, sol - h - 50, 4); g.fillStyle(c, 0.75); } break;
    case 'cairn': for (let k = 0; k < 5; k++) g.fillEllipse(0, sol - 10 - k * 18, 60 - k * 9, 20); g.lineStyle(3, c, 0.8).lineBetween(0, sol - 96, 0, sol - 150); g.fillStyle(0xa02a24, 0.7).fillTriangle(0, sol - 150, 40, sol - 142, 0, sol - 130); break;
    default: g.fillTriangle(-160, sol, 160, sol, 0, sol - 140);   // (une colline de plus, faute de mieux)
  }
}

// --- Le premier plan : ce qui pousse (ou traîne) au bord, devant le voyageur ---
function dessinerSolVariante(g, sol, s) {
  const pas = s.dense ? 14 : 30;
  for (let x = -80; x < 2100; x += pas + (x * 7) % 11) {
    const y = sol + 2 - ((x * 3) % 6);
    if (s.fleurs) {
      const c = s.fleurs[Math.abs(x) % s.fleurs.length];
      g.fillStyle(0x2a5a20, 0.9).fillRect(x, y - 8, 1.5, 8);
      g.fillStyle(c, s.luisantes ? 1 : 0.95).fillCircle(x + 0.75, y - 9, 2.6);
      g.fillStyle(0xf8e060, 0.9).fillCircle(x + 0.75, y - 9, 0.9);
      if (s.luisantes) g.fillStyle(c, 0.25).fillCircle(x + 0.75, y - 9, 6);
    }
  }
  for (let x = -40; x < 2100; x += 90 + (x * 13) % 60) {
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

// --- (v1.62, planche 87) Les dessins HD des décors vivants ---
function texRecit(scene, cle, l, h, dessin) {
  if (scene.textures.exists(cle)) return cle;
  const t = toileRepere(l, h);
  const apres = dessin(t);
  t.contour();
  if (typeof apres === 'function') apres(t);
  t.texture(scene, cle);
  return cle;
}
const disqueRecit = (cx, cy, r) => ellipsoide(cx, cy, r, r);

// Le mouton (il regarde à gauche) : debout, broute (2), marche (4), bêle (2), se gratte (2), couché ;
// toile 38 × 28, posé par les pieds (y = 27). Il se gratte contre un piquet qui est posé à part.
function moutonHD(scene, pose = 'debout', agneau = false) {
  const cle = 'moutonHD_' + pose + (agneau ? '_agneau' : '');
  return texRecit(scene, cle, 38, 28, t => {
    t.rampes.laine = [0x6a6056, 0x968c7c, 0xbeb4a0, 0xdad2be, 0xeee8d8, 0xfffcf0];
    t.rampes.tete = agneau ? [0x6a5a4a, 0x948270, 0xbaa894, 0xd4c2ac, 0xe8dcc8, 0xf8f0e0] : [0x0c0a0a, 0x1a1614, 0x2a2420, 0x3c342e, 0x52483f, 0x6c6055];
    t.rampes.patte = [0x0c0a0a, 0x1c1816, 0x2e2824, 0x423a34, 0x5a5048, 0x746a60];
    t.rampes.rose = [0x5a2024, 0x8a3a3e, 0xb85a5a, 0xd87a78, 0xf0a0a0, 0xffc8c8];
    const P = pose, marche = P.startsWith('marche'), k = marche ? +P.slice(-1) : 0;
    const dy = (k === 2 || k === 4) ? -1 : 0, couche = P === 'couche', gratte = P.startsWith('gratte');
    const cy = (couche ? 19 : 12) + dy;
    let pattes = [[13, 13, 0], [15, 15, 1], [25, 25, 1], [27, 27, 0]];
    if (k === 1) pattes = [[13, 10, 0], [15, 17, 1], [25, 23, 1], [27, 29, 0]];
    if (k === 3) pattes = [[13, 16, 0], [15, 12, 1], [25, 28, 1], [27, 24, 0]];
    const leve = gratte && P === 'gratte2';
    if (couche) for (const x of [11, 12, 24, 25]) t.poser(x, 26, 'patte', 1);   // les pattes repliées
    // la laine : un gros nuage bouclé, lumière en haut à gauche
    const boucles = (x, y) => (Math.sin(x * 1.6 + (y % 3) * 1.1) * Math.sin(y * 1.7 + x * 0.3) > 0.5 ? -0.9 : (hachage(x, y, 7) < 0.07 ? 0.6 : 0));
    const corps = (x, y) => {
      const gx = leve ? 1 : 0; const e = ellipsoide(20 + gx, cy, 11.5, 6.4)(x, y); if (e) return e;
      for (const [bx0, by, r] of [[11.5, cy - 2, 3.6], [15.5, cy - 5, 3.6], [20.5, cy - 5.6, 3.8], [26, cy - 4.6, 3.6], [30, cy - 1.5, 3.2], [29.5, cy + 3, 3], [12, cy + 3, 3]]) { const b = disqueRecit(bx0 + gx * (bx0 > 20 ? 1 : 0.5), by, r)(x, y); if (b) return b; }
      return null;
    };
    t.forme('laine', corps, { motif: boucles });
    if (!gratte) t.forme('laine', disqueRecit(32.5, cy - 2, 2), { decalage: 0.2 });   // la queue
    // la tête et le cou
    let hx = 7, hy = cy - 2, cou = [[14, cy - 1], [9, cy - 2]];
    if (P === 'broute1' || P === 'broute2') { hx = 6.5; hy = 21 + (P === 'broute2' ? 1 : 0); cou = [[13, cy + 1], [10, cy + 5], [8, hy - 2]]; }
    if (P === 'bele1' || P === 'bele2') { hx = 6.5; hy = 6; cou = [[12, cy - 2], [8.5, hy + 2]]; }
    if (couche) { hx = 7; hy = 14; cou = [[13, 17], [9, 15]]; }
    if (gratte) { hx = 6.5; hy = cy - 4; cou = [[13, cy - 2], [9, hy + 1]]; }
    traitHD(t, 'laine', cou, 3.3, 0.1);
    const sens = -1;
    t.forme('tete', ellipsoide(hx, hy, 3.4, 2.9), { decalage: 0.25 });
    t.forme('tete', ellipsoide(hx + sens * 3, hy + 1.3, 2.3, 2), { decalage: 0.35 });   // le museau
    t.forme('tete', ellipsoide(hx - sens * 3.6, hy - 1.4, 2.4, 0.9), { decalage: -0.2 });   // l'oreille
    t.forme('laine', ellipsoide(hx - sens * 1.2, hy - 2.8, 2.4, 1.5), { motif: boucles, decalage: 0.2 });   // le toupet
    const oeil = [Math.round(hx + sens * 0.6), Math.round(hy - 0.6)];
    t.poser(oeil[0], oeil[1], 'tete', 0); t.poser(oeil[0] - sens, oeil[1], agneau ? 'tete' : 'laine', agneau ? 1 : 3);
    if (P === 'bele1' || P === 'bele2') {
      const mx = Math.round(hx - 4.2), my = Math.round(hy + 1.5), o = P === 'bele2' ? 2 : 1;
      for (let j = 0; j <= o; j++) { t.poser(mx, my + j, 'rose', j ? 1 : 2); t.poser(mx + 1, my + j, 'rose', 0); }
      t.poser(oeil[0], oeil[1], 'tete', 1); t.poser(oeil[0] - sens, oeil[1], 'tete', 1);   // les yeux plissés
    }
    if (P === 'broute1' || P === 'broute2') {   // la touffe d'herbe qu'il arrache
      const mx = Math.round(hx - 4), n = P === 'broute1' ? 4 : 2;
      for (let j = 0; j < n; j++) { t.poser(mx + (j % 2), 26 - j, 'vert', 4 - (j % 2)); t.poser(mx - 1, 26 - j + 1, 'vert', 2); }
    }
    if (gratte) {
      t.poser(oeil[0], oeil[1], 'tete', 1); t.poser(oeil[0] + 1, oeil[1], 'tete', 1);   // les yeux mi-clos, il est bien
      for (const [x, y] of P === 'gratte1' ? [[34, 4], [33, 1]] : [[34, 2], [33, 5]]) t.poser(x, y, 'laine', 5);   // des brins de laine accrochés au piquet
    }
    return t2 => {   // les pattes, après le contour : fines, sans liseré
      if (couche) return;
      pattes.forEach(([h, p, loin]) => {
        const g = (h + p) / 2 + (p < h ? -0.5 : 0.5) * (h !== p ? 1 : 0);
        const pts = leve && h === 27 ? [[h, 19], [h + 1, 21], [h - 1, 23]] : [[h, 19 + dy], [g, 22], [p, 25]];
        for (let i = 0; i < pts.length - 1; i++) { const [ax, ay] = pts[i], [bx, by] = pts[i + 1], n = Math.max(Math.abs(bx - ax), Math.abs(by - ay)) * 2; for (let j = 0; j <= n; j++) t2.poser(Math.round(ax + (bx - ax) * j / n), Math.round(ay + (by - ay) * j / n), 'patte', loin ? 1 : 3); }
        if (leve && h === 27) { t2.poser(26, 24, 'patte', 1); t2.poser(25, 24, 'patte', 0); return; }
        t2.poser(Math.round(p), 26, 'patte', loin ? 0 : 1); t2.poser(Math.round(p) - 1, 26, 'patte', 0);   // le sabot
      });
    };
  });
}
// le piquet de la clôture du pré, contre lequel les moutons se grattent le dos
function piquetHD(scene) { return texRecit(scene, 'piquetHD', 5, 27, t => { for (let y = 1; y < 27; y++) { t.poser(1, y, 'rondin', 3); t.poser(2, y, 'rondin', 2); t.poser(3, y, 'rondin', 1); } t.poser(2, 0, 'rondin', 4); }); }
// les bottes de foin rondes et la meule de la moisson
function botteHD(scene) {
  return texRecit(scene, 'botteHD', 40, 30, t => {
    t.forme('paille', (x, y) => (x >= 12 && x <= 37 && y >= 3 && y <= 28) ? [0, (y - 15.5) / 13, 0.8] : null,
      { motif: (x, y) => ((y * 5 + (x >> 2)) % 6 === 0 ? -1 : hachage(x, y, 3) < 0.1 ? 0.7 : 0), decalage: -0.2 });
    t.forme('paille', disqueRecit(13, 15.5, 12.5), { motif: (x, y) => { const dx = x + 0.5 - 13, dy = y + 0.5 - 15.5, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx); return ((r + a * 0.55) % 2.6 < 0.8) ? -1.1 : hachage(x, y, 5) < 0.12 ? 0.5 : 0; }, decalage: 0.2 });
    for (let y = 3; y <= 28; y++) t.poser(26, y, 'rondin', 1);   // la ficelle
    for (const [x, y] of [[30, 2], [33, 3], [36, 27], [5, 26]]) t.poser(x, y, 'paille', 5);
  });
}
function meuleHD(scene) {
  return texRecit(scene, 'meuleHD', 38, 46, t => {
    const larg = y => y < 22 ? 15.5 * Math.sqrt(Math.max(0, 1 - ((y - 22) / 18) ** 2)) : 15.5 + (y - 22) * 0.07 - (y > 41 ? (y - 41) * 0.9 : 0);
    t.forme('paille', (x, y) => { const w = larg(y + 0.5), dx = x + 0.5 - 19; return y >= 4 && y <= 45 && Math.abs(dx) <= w ? [dx / 17, (y < 22 ? (y - 22) / 18 : 0.1) * 0.9, 0.7] : null; },
      { motif: (x, y) => ((Math.round(x + Math.sin(y * 0.4) * 1.5) % 3 === 0) ? -0.9 : hachage(x, y, 4) < 0.1 ? 0.7 : 0) });
    for (const yc of [18, 30]) for (let x = 2; x <= 36; x++) { const w = larg(yc); if (Math.abs(x + 0.5 - 19) <= w - 0.5) t.poser(x, yc + Math.round(((x - 19) / w) ** 2 * 2), 'rondin', 1); }   // les cordes
    traitHD(t, 'rondin', [[19, 6], [20, 0]], 0.7, 0.2);   // le piquet au sommet
    for (const [x, y] of [[4, 44], [6, 45], [33, 44], [35, 45], [12, 9], [26, 9]]) t.poser(x, y, 'paille', 5);
  });
}
// l'épouvantail : deux images, les manches au vent
function epouvantailHD(scene, k = 0) {
  return texRecit(scene, 'epouvantailHD_' + k, 44, 62, t => {
    t.rampes.veste = rampe(0x5a4a7a); t.rampes.sac = rampe(0xc8aa78); t.rampes.chapeau = rampe(0x4a3a2a);
    traitHD(t, 'rondin', [[22, 61], [22, 14]], 1.3, 0);   // le piquet
    traitHD(t, 'rondin', [[5, 24], [39, 24]], 1, -0.2);   // la traverse
    const bout = k ? 4 : -3;
    t.forme('veste', polygoneHD([[15, 22], [29, 22], [31, 44], [13, 44]]), { motif: (x, y) => ((x * 7 + y * 3) % 13 === 0 ? -0.8 : 0) });
    t.forme('veste', polygoneHD([[15, 21], [4, 22 + bout * 0.3], [2, 27 + bout], [15, 27]]));
    t.forme('veste', polygoneHD([[29, 21], [40, 22 - bout * 0.3], [42, 27 - bout], [29, 27]]));
    for (const [x, y] of [[2, 28 + bout], [3, 29 + bout], [42, 28 - bout], [41, 29 - bout], [20, 45], [24, 46], [17, 45]]) t.poser(x, y, 'paille', 4);   // la paille qui dépasse
    t.forme('cuir', boite(18, 34, 26, 36, 0.5), { decalage: -0.3 });   // la ceinture de corde
    t.forme('sac', disqueRecit(22, 15, 6), { motif: (x, y) => ((x + y) % 3 === 0 ? -0.6 : 0) });
    t.poser(20, 14, 'encre', 0); t.poser(24, 14, 'encre', 0);   // deux yeux cousus
    for (let x = 19; x <= 25; x++) t.poser(x, 18, 'encre', (x % 2) ? 1 : 0);
    t.forme('chapeau', ellipsoide(22, 9, 10, 2.2), { decalage: 0.1 });
    t.forme('chapeau', boite(17, 2, 27, 9, 1), { decalage: 0.2 });
    t.forme('tissu', boite(17, 6, 27, 8, 0.5), { decalage: 0.3 });
  });
}
function rucheHD(scene) {
  return texRecit(scene, 'rucheHD', 26, 30, t => {
    t.forme('rondin', boite(3, 24, 23, 27, 1), {}); traitHD(t, 'rondin', [[6, 27], [6, 30]], 0.9); traitHD(t, 'rondin', [[20, 27], [20, 30]], 0.9);
    t.forme('paille', (x, y) => { const e = ellipsoide(13, 23, 10, 19)(x, y); return e && y <= 23 ? e : null; }, { motif: (x, y) => (y % 3 === 0 ? -1 : 0) });
    t.forme('encre', ellipsoide(13, 21, 2.2, 1.4), { bord: false, decalage: -2 });
  });
}
function pommeHD(scene) { return texRecit(scene, 'pommeHD', 8, 9, t => { t.forme('pomme', disqueRecit(4, 5, 3.4), { decalage: 0.3 }); t.poser(4, 1, 'rondin', 1); t.poser(5, 1, 'vert', 4); }); }
function panierPommesHD(scene) {
  return texRecit(scene, 'panierPommesHD', 22, 16, t => {
    for (const [x, y] of [[6, 5], [11, 4], [16, 5], [8, 2], [14, 2]]) t.forme('pomme', disqueRecit(x, y + 1, 2.8), { decalage: 0.3 });
    t.forme('paille', boite(2, 7, 20, 15, 2), { motif: (x, y) => ((x + y) % 3 === 0 ? -0.9 : 0) });
    traitHD(t, 'rondin', [[3, 7], [11, 0.5], [19, 7]], 0.6, 0);
  });
}
// le cerf : il broute, il relève la tête
function cerfHD(scene, pose = 'guette') {
  return texRecit(scene, 'cerfHD_' + pose, 50, 56, t => {
    t.rampes.poil = rampe(0x8a5a32); t.rampes.ventreC = rampe(0xd8c0a0); t.rampes.bois = rampe(0xc8b48a);
    const broute = pose === 'broute';
    for (const [h, p, loin] of [[18, 17, 1], [21, 22, 0], [33, 34, 1], [36, 36, 0]]) { traitHD(t, 'poil', [[h, 34], [p, 44], [p, 54]], 1.1, loin ? -0.6 : 0); t.poser(p, 55, 'encre', 0); t.poser(p - 1, 55, 'encre', 0); }
    t.forme('poil', ellipsoide(27, 31, 12, 6.5), { motif: (x, y) => (hachage(x, y, 2) < 0.1 ? -0.6 : 0) });
    t.forme('ventreC', ellipsoide(27, 35, 8, 2.2), { bord: false });
    t.forme('ventreC', disqueRecit(39, 28, 2.4), { decalage: 0.5 });   // la queue blanche
    const [hx, hy] = broute ? [10, 47] : [12, 13];
    traitHD(t, 'poil', [[19, 29], [(19 + hx) / 2 + 1, (29 + hy) / 2], [hx + 2, hy + 1]], 3.4, 0.1);   // le cou
    t.forme('poil', ellipsoide(hx, hy, 4.5, 3.4), { decalage: 0.2 });
    t.forme('poil', ellipsoide(hx - 4, hy + 1.5, 2.6, 2), { decalage: 0.3 });   // le museau
    t.poser(hx - 6, hy + 1, 'encre', 0); t.poser(hx - 1, hy - 1, 'encre', 0);
    t.forme('poil', ellipsoide(hx + 4, hy - 3, 2.4, 1.2), { decalage: -0.1 });   // l'oreille
    const b = broute ? [[[hx + 1, hy - 3], [hx + 4, hy - 9], [hx + 10, hy - 12]], [[hx + 4, hy - 9], [hx + 3, hy - 14]], [[hx + 8, hy - 11], [hx + 9, hy - 16]]]
      : [[[hx + 1, hy - 3], [hx + 2, hy - 10], [hx + 6, hy - 16]], [[hx + 2, hy - 9], [hx - 3, hy - 13]], [[hx + 4, hy - 13], [hx + 1, hy - 18]], [[hx + 6, hy - 16], [hx + 10, hy - 19]]];
    b.forEach(pts => traitHD(t, 'bois', pts, 0.75, 0.3));
  });
}
function corbeauHD(scene, vol = false) {
  return texRecit(scene, 'corbeauHD_' + (vol ? 'vol' : 'pose'), 22, 16, t => {
    t.rampes.plumeN = [0x06060a, 0x101018, 0x1c1c26, 0x2a2a38, 0x3c3c4e, 0x545468];
    t.forme('plumeN', ellipsoide(11, 9, 5, 3.4), {});
    t.forme('plumeN', disqueRecit(6, 6.5, 2.6), { decalage: 0.2 });
    t.poser(3, 7, 'or', 3); t.poser(2, 7, 'or', 2); t.poser(5, 6, 'cire', 5);
    if (vol) { traitHD(t, 'plumeN', [[10, 8], [7, 2], [3, 0]], 1.2, 0.2); traitHD(t, 'plumeN', [[13, 8], [17, 2], [21, 1]], 1.2, -0.2); }
    else { traitHD(t, 'plumeN', [[12, 7], [16, 9], [19, 13]], 1.1, -0.1); t.poser(10, 13, 'or', 1); t.poser(12, 13, 'or', 1); }
    traitHD(t, 'plumeN', [[15, 10], [20, 12]], 1, 0);
  });
}
function aigleHD(scene) {
  return texRecit(scene, 'aigleHD', 44, 18, t => {
    t.rampes.plumeA = rampe(0x5a3a1e);
    traitHD(t, 'plumeA', [[21, 9], [12, 5], [2, 7]], 2, 0.1); traitHD(t, 'plumeA', [[23, 9], [32, 5], [42, 7]], 2, -0.1);
    for (const x of [3, 6, 38, 41]) traitHD(t, 'plumeA', [[x, 7], [x - (x < 22 ? 1 : -1), 11]], 0.7, -0.4);
    t.forme('plumeA', ellipsoide(22, 10, 4, 3), {}); t.forme('neige', disqueRecit(22, 7.5, 2.2), { decalage: 0.4 }); t.poser(22, 5, 'or', 4);
    traitHD(t, 'plumeA', [[22, 12], [22, 16]], 1.6, 0);
  });
}
function feuilleHD(scene, c) { return texRecit(scene, 'feuilleHD_' + c, 9, 7, t => { t.rampes.f = rampe(c); t.forme('f', ellipsoide(4.5, 3.5, 4, 2.4), { decalage: 0.2 }); t.poser(8, 3, 'rondin', 1); }); }
function neigePaquetHD(scene) { return texRecit(scene, 'neigePaquetHD', 18, 10, t => { t.forme('neige', ellipsoide(9, 6, 8, 3.6), { decalage: 0.2 }); t.forme('neige', disqueRecit(5, 4.5, 3), { decalage: 0.4 }); t.forme('neige', disqueRecit(12, 4, 3.4), { decalage: 0.4 }); }); }
function champignonHD(scene) { return texRecit(scene, 'champignonHD', 12, 12, t => { t.forme('os', boite(4, 6, 7, 11, 0.5), {}); t.forme('minerai', ellipsoide(5.5, 5, 5, 3.4, (x, y) => y < 6), { decalage: 0.3 }); t.poser(3, 3, 'cire', 5); t.poser(7, 2, 'cire', 5); t.poser(8, 4, 'cire', 4); }); }
// la colline à la porte ronde, sans ses meules (elles sont devenues de vraies bottes de foin, posées au sol)
function collinePorteHD(scene) {
  if (scene.textures.exists('collinePorteHD')) return 'collinePorteHD';
  const t = toileRepere(220, 80);
  REPERES_HD.meules.dessin(t);
  for (let y = 0; y < 80; y++) for (let x = 0; x < 122; x++) { t.c[y * 220 + x] = null; t.m[y * 220 + x] = null; }
  t.contour();
  t.texture(scene, 'collinePorteHD');
  return 'collinePorteHD';
}

// --- (v1.62, planche 87) Les moutons vivants ---
// Chacun tire au sort ce qu'il fait : brouter (3 à 6 s), marcher (3 à 8 pas, les pattes bougent à chaque
// pas, jamais sans), bêler, se gratter au piquet, se coucher. L'agneau suit sa mère.
const ECHELLE_MOUTON = 1.7;
function moutonVivant(scene, plan, x, y, { agneau = false, mere = null, piquet = null, xMin = x - 120, xMax = x + 120 } = {}) {
  const m = dansPlan(plan, scene.add.image(x, y, moutonHD(scene, 'debout', agneau)).setOrigin(0.5, 1).setScale(ECHELLE_MOUTON * (agneau ? 0.7 : 1)).setFlipX(Math.random() < 0.5));
  const poser = pose => { if (m.active) m.setTexture(moutonHD(scene, pose, agneau)); };
  const apres = (ms, f) => scene.time.delayedCall(ms, () => { if (m.active) f(); });
  // un pas : l'image suivante, et 3 pixels plus loin (vers où il regarde : à gauche, sauf retourné)
  const marcher = (n, ensuite, cible = null) => {
    let i = 0;
    const pas = () => {
      if (!m.active) return;
      if (n <= 0 || (cible !== null && Math.abs(cible - m.x) < 4)) { poser('debout'); return apres(200, ensuite); }
      i = i % 4 + 1; poser('marche' + i);
      const sens = m.flipX ? 1 : -1;
      if ((sens < 0 && m.x - 3 < xMin) || (sens > 0 && m.x + 3 > xMax)) { m.setFlipX(!m.flipX); }   // (le bout du pré : il fait demi-tour)
      m.x += (m.flipX ? 1 : -1) * 3; n--;
      apres(140, pas);
    };
    pas();
  };
  const brouter = (ms, ensuite) => { let k = 0; const fin = scene.time.now + ms; const b = () => { if (scene.time.now > fin) { poser('debout'); return apres(300, ensuite); } poser(k++ % 2 ? 'broute2' : 'broute1'); apres(300, b); }; b(); };
  const beler = ensuite => {
    poser('bele1'); apres(220, () => poser('bele2')); apres(520, () => poser('bele1')); apres(760, () => { poser('debout'); apres(400, ensuite); });
    Son.jouer('mouton');   // (s'il existe)
    const t = dansPlan(plan, scene.add.text(m.x + (m.flipX ? 14 : -14), y - m.displayHeight - 4, 'Bêêê !', style(11, '#3b2410', { fontStyle: 'bold italic', backgroundColor: '#fff8e8', padding: { x: 4, y: 1 } })).setOrigin(0.5, 1));
    scene.tweens.add({ targets: t, alpha: 0, delay: 900, duration: 300, onComplete: () => t.destroy() });
  };
  const gratter = ensuite => {
    // il va jusqu'au piquet, se tourne, et se gratte le dos (le piquet est à sa droite quand il regarde à gauche)
    const place = piquet.x - 28 * ECHELLE_MOUTON / 1.7;
    m.setFlipX(place > m.x);
    marcher(60, () => { m.setFlipX(false); let k = 0; const g = () => { if (k++ > 12) { poser('debout'); return apres(300, ensuite); } poser(k % 2 ? 'gratte1' : 'gratte2'); apres(90, g); }; g(); }, place);
  };
  const coucher = ensuite => { poser('couche'); apres(4000 + Math.random() * 4000, () => { poser('debout'); apres(400, ensuite); }); };
  const choisir = () => {
    if (!m.active) return;
    if (mere) {   // l'agneau : il trotte derrière sa mère, sinon il broute à côté d'elle
      const ecart = mere.x + (mere.flipX ? -26 : 26) - m.x;
      if (Math.abs(ecart) > 18) { m.setFlipX(ecart > 0); return marcher(Math.ceil(Math.abs(ecart) / 3), choisir, mere.x + (mere.flipX ? -26 : 26)); }
      return Math.random() < 0.6 ? brouter(1500 + Math.random() * 1500, choisir) : apres(800, choisir);
    }
    const r = Math.random();
    if (r < 0.42) brouter(3000 + Math.random() * 3000, choisir);
    else if (r < 0.7) { if (Math.random() < 0.5) m.setFlipX(!m.flipX); marcher(3 + Math.floor(Math.random() * 6), choisir); }
    else if (r < 0.8) beler(choisir);
    else if (r < 0.9 && piquet) gratter(choisir);
    else coucher(choisir);
  };
  apres(300 + Math.random() * 2500, choisir);
  return m;
}

// --- La faune : de petites bêtes animées ---
function lancerFaune(scene, quoi) {
  const ciel = (y0, y1) => Phaser.Math.Between(y0, y1);
  const plan = scene.planMoyen, haut = scene.planCiel || plan;
  // dans le pré, là où regarde la caméra (le plan ×1 est placé à l'abscisse du monde)
  const xVu = (a, b) => (scene.xMondeVu ? scene.xMondeVu() : 0) + Phaser.Math.Between(a, b);
  const vol = (forme, couleur, y, duree, taille = 1, sens = 1) => {
    const g = dansPlan(haut, scene.add.graphics());
    const dessiner = (h) => { g.clear(); g.lineStyle(2 * taille, couleur, 0.95); g.lineBetween(-6 * taille, h ? -4 * taille : 2 * taille, 0, 0); g.lineBetween(0, 0, 6 * taille, h ? -4 * taille : 2 * taille); };
    dessiner(true);
    let h = true; const battre = scene.time.addEvent({ delay: forme === 'plane' ? 600 : 180, loop: true, callback: () => { h = !h; dessiner(h); } });
    g.setPosition(sens > 0 ? -40 : 1060, y);
    scene.tweens.add({ targets: g, x: sens > 0 ? 1060 : -40, duration: duree, ease: 'Linear', onComplete: () => { battre.remove(); scene.tweens.killTweensOf(g); g.destroy(); } });   // (v0.96 : son flottement en boucle ne mourait pas avec lui)
    scene.tweens.add({ targets: g, y: y + 14, duration: duree / 6, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  };
  const petit = (couleur, x, y, r, alpha = 1) => dansPlan(plan, scene.add.circle(x, y, r, couleur, alpha));
  switch (quoi) {
    case 'oiseaux': return scene.time.addEvent({ delay: 4200, loop: true, startAt: 3000, callback: () => { const y = ciel(40, 140); for (let k = 0; k < 3; k++) scene.time.delayedCall(k * 260, () => vol('bat', 0x2a2a30, y + k * 10, 9000, 0.8)); } });
    case 'corbeaux': return scene.time.addEvent({ delay: 5200, loop: true, startAt: 3500, callback: () => vol('bat', 0x101014, ciel(60, 160), 7000, 1.1, -1) });
    case 'colombes': return scene.time.addEvent({ delay: 4800, loop: true, startAt: 3000, callback: () => { const y = ciel(60, 150); for (let k = 0; k < 2; k++) scene.time.delayedCall(k * 300, () => vol('bat', 0xf8f8f0, y + k * 12, 8000, 0.9)); } });
    case 'vautours': case 'aigle': {
      // (v0.81) trois vautours qui tournent en rond au-dessus des carcasses (un seul aigle)
      for (let k = 0; k < (quoi === 'aigle' ? 1 : 3); k++) {
        const g = dansPlan(haut, scene.add.graphics());
        g.lineStyle(3, quoi === 'aigle' ? 0x3a2a1a : 0x1a1410, 0.9); g.lineBetween(-12, -3, 0, 0); g.lineBetween(0, 0, 12, -3); g.fillStyle(0x1a1410, 0.9).fillCircle(0, 0, 2.5);
        const cx = quoi === 'aigle' ? 300 : 560 + k * 90, cy = 70 + k * 22, r = 70 + k * 25;
        const t = { a: k * 2 };
        scene.tweens.add({ targets: t, a: k * 2 + Math.PI * 2, duration: 8000 + k * 1700, repeat: -1, onUpdate: () => g.setPosition(cx + Math.cos(t.a) * r, cy + Math.sin(t.a) * 22).setScale(Math.cos(t.a) > 0 ? 1 : -1, 1) });
      }
      return null;
    }
    case 'vent': case 'blizzard': return scene.time.addEvent({ delay: quoi === 'blizzard' ? 30 : 90, loop: true, callback: () => {
      // des traînées de neige et de vent, à l'horizontale, qui hurlent à travers l'écran (fixes : c'est l'air)
      const y = Phaser.Math.Between(10, 350), l = Phaser.Math.Between(20, 70);
      const r = scene.add.rectangle(1000, y, l, quoi === 'blizzard' ? 2 : 1.5, 0xffffff, quoi === 'blizzard' ? 0.75 : 0.45).setDepth(Math.random() < 0.5 ? -0.45 : 6.8).setScrollFactor(0);
      scene.tweens.add({ targets: r, x: -80, y: y + Phaser.Math.Between(10, 50), duration: Phaser.Math.Between(500, 900), ease: 'Linear', onComplete: () => r.destroy() });
    } });
    case 'papillons': case 'abeilles': {
      const couleurs = quoi === 'abeilles' ? [0xf0c020] : [0xf8a0c8, 0xf8e060, 0x80c8f8, 0xffffff];
      for (let k = 0; k < (quoi === 'abeilles' ? 6 : 8); k++) {
        const x0 = 80 + k * (LARGEUR_RECIT - 160) / 8;
        const b = petit(couleurs[k % couleurs.length], x0, Phaser.Math.Between(250, 330), quoi === 'abeilles' ? 1.8 : 2.6);
        const bouger = () => { if (!b.active) return; scene.tweens.add({ targets: b, x: Phaser.Math.Clamp(b.x + Phaser.Math.Between(-90, 90), x0 - 150, x0 + 150), y: Phaser.Math.Between(240, 335), duration: Phaser.Math.Between(900, 1800), ease: 'Sine.easeInOut', onComplete: bouger }); };
        bouger();
        if (quoi === 'papillons') scene.tweens.add({ targets: b, scaleX: 0.3, duration: 120, yoyo: true, repeat: -1 });
      }
      return null;
    }
    case 'lucioles': case 'etincelles': case 'braises': {
      const couleur = quoi === 'lucioles' ? 0xe8ff90 : quoi === 'braises' ? 0xff9030 : 0xd8c0ff;
      return scene.time.addEvent({ delay: quoi === 'braises' ? 260 : 380, loop: true, callback: () => {
        const p = petit(couleur, xVu(20, 940), Phaser.Math.Between(quoi === 'braises' ? 300 : 200, 340), 1.8, 0);
        p.setBlendMode(Phaser.BlendModes.ADD);
        scene.tweens.add({ targets: p, alpha: { from: 0, to: 0.95 }, y: p.y - (quoi === 'braises' ? 90 : 40), x: p.x + Phaser.Math.Between(-30, 30), duration: 1600, yoyo: quoi !== 'braises', onComplete: () => p.destroy() });
      } });
    }
    case 'chauvesSouris': return scene.time.addEvent({ delay: 2600, loop: true, startAt: 1500, callback: () => vol('bat', 0x1a1018, ciel(60, 200), 4200, 0.9, Math.random() < 0.5 ? 1 : -1) });
    case 'livres': return scene.time.addEvent({ delay: 3400, loop: true, startAt: 1500, callback: () => {
      const l = dansPlan(haut, scene.add.container(-30, ciel(70, 200)));
      const g = scene.add.graphics().setScrollFactor(haut.facteur ?? 1, 1); l.add(g);   // (v0.81) un vrai petit livre : la couverture, les pages blanches au milieu
      g.fillStyle(Phaser.Utils.Array.GetRandom([0x8a2a3a, 0x2a4a8a, 0x2a6a3a]), 1).fillRect(-11, -7, 22, 14); g.fillStyle(0xf4ecd4, 1).fillRect(-9, -6, 8, 11).fillRect(1, -6, 8, 11); g.lineStyle(1, 0x5a4a3a, 0.8).lineBetween(-7, -3, -3, -3).lineBetween(3, -3, 7, -3).lineBetween(-7, 0, -3, 0).lineBetween(3, 0, 7, 0);
      scene.tweens.add({ targets: l, x: 1060, duration: 9000, ease: 'Linear', onComplete: () => { scene.tweens.killTweensOf(l); l.destroy(); } });
      scene.tweens.add({ targets: l, scaleY: 0.3, y: l.y - 16, duration: 300, yoyo: true, repeat: -1 });
    } });
    case 'moutons': {
      // un troupeau dans le pré, derrière la barrière : cinq moutons, un agneau qui suit sa mère, un piquet
      const piquet = dansPlan(plan, scene.add.image(1215, PRE_RECIT.pres - 1, piquetHD(scene)).setOrigin(0.5, 1).setScale(ECHELLE_MOUTON));
      const troupeau = [[170, 353], [262, 350], [905, 352], [980, 347], [1150, 355]].map(([x, y]) => moutonVivant(scene, plan, x, y, { piquet: x > 1000 ? piquet : null }));
      moutonVivant(scene, plan, 1020, 356, { agneau: true, mere: troupeau[3], xMin: 820, xMax: 1300 });
      return null;
    }
    case 'poissons': return scene.time.addEvent({ delay: 2800, loop: true, startAt: 1200, callback: () => {
      // (ils sautent dans le lac, au loin : sur le plan des collines, avec le lac)
      const loin = scene.planLoin || plan, x = (scene.lacX || 640) + Phaser.Math.Between(-140, 140), y = scene.lacY || 300;
      const p = dansPlan(loin, scene.add.ellipse(x, y, 8, 3, 0xc8d8f0));
      scene.tweens.add({ targets: p, y: y - 18, x: x + 18, angle: -40, duration: 340, yoyo: true, ease: 'Quad.easeOut', onComplete: () => p.destroy() });
    } });
  }
  return null;
}

// --- (v1.62, planche 87) Chaque contrée, ses décors vivants : de vrais objets posés au sol, et ce qui bouge
// en images clés (jamais un objet qui glisse : la pomme roule en tournant, le corbeau bat des ailes...)
function planterVivant(scene, quoi) {
  const plan = scene.planMoyen;
  const poser = (cle, x, y, e = 2, o = {}) => dansPlan(plan, scene.add.image(x, y, cle).setOrigin(o.ox ?? 0.5, 1).setScale(e).setFlipX(!!o.flip));
  const apres = (ms, f) => scene.time.delayedCall(ms, f);
  if (quoi === 'moisson') {
    // la meule et les bottes de foin, l'épouvantail aux manches qui battent, et son corbeau
    poser(meuleHD(scene), 610, 350); poser(botteHD(scene), 700, 353); poser(botteHD(scene), 800, 348, 1.7, { flip: true });
    poser(collinePorteHD(scene), 1520, 341, 1, { ox: 0.75 });
    const ep = poser(epouvantailHD(scene, 0), 400, 349, 1.8);
    scene.time.addEvent({ delay: 650, loop: true, callback: () => { if (ep.active) ep.setTexture(epouvantailHD(scene, ep.texture.key.endsWith('0') ? 1 : 0)); } });
    const perche = { x: ep.x - 30, y: ep.y - 64 };
    const corbeau = poser(corbeauHD(scene), perche.x, perche.y, 1.6);
    const envol = () => {
      if (!corbeau.active) return;
      // il s'envole en battant des ailes, fait un tour au-dessus du champ, et revient se poser
      let aile = 0; const battre = scene.time.addEvent({ delay: 110, loop: true, callback: () => { if (!corbeau.active) return battre.remove(); corbeau.setTexture(corbeauHD(scene, aile++ % 2 === 0)); } });
      const u = { t: 0 };
      scene.tweens.add({ targets: u, t: 1, duration: 5200, ease: 'Sine.easeInOut', onUpdate: () => {
        if (!corbeau.active) return;
        const a = u.t * Math.PI * 2;
        corbeau.setPosition(perche.x - Math.sin(a) * 160, perche.y - Math.sin(u.t * Math.PI) * 120 - Math.sin(a) * 20).setFlipX(Math.cos(a) < 0);
      }, onComplete: () => { battre.remove(); if (corbeau.active) corbeau.setTexture(corbeauHD(scene)).setFlipX(false).setPosition(perche.x, perche.y); apres(7000 + Math.random() * 6000, envol); } });
    };
    apres(4000 + Math.random() * 4000, envol);
  } else if (quoi === 'verger') {
    // la ruche et ses abeilles, le panier de pommes, et une pomme qui tombe d'un pommier puis roule
    const ruche = poser(rucheHD(scene), 545, 352);
    for (let i = 0; i < 6; i++) {
      const b = dansPlan(plan, scene.add.circle(ruche.x, ruche.y - 44, 1.8, 0xf0c020));
      const t = { a: i * 1.05 }, r = 16 + i * 3;
      scene.tweens.add({ targets: t, a: t.a + Math.PI * 2, duration: 1800 + i * 260, repeat: -1, onUpdate: () => b.setPosition(ruche.x + Math.cos(t.a) * r, ruche.y - 44 + Math.sin(t.a * 2) * 9) });
    }
    poser(panierPommesHD(scene), 395, 355);
    const pommiers = (scene.arbresRecit || []).filter(a => a.active);
    const chute = () => {
      const arbre = pommiers.length ? Phaser.Utils.Array.GetRandom(pommiers) : null;
      if (!arbre || !arbre.active) return;
      const x = arbre.x + Phaser.Math.Between(-18, 18), y0 = arbre.y - arbre.displayHeight * 0.62, sol = PRE_RECIT.pres - 2;
      const p = dansPlan(plan, scene.add.image(x, y0, pommeHD(scene)).setOrigin(0.5, 1).setScale(2));
      // elle tombe, rebondit, et roule dans l'herbe en tournant
      scene.tweens.add({ targets: p, y: sol, duration: 520, ease: 'Quad.easeIn', onComplete: () => {
        scene.tweens.add({ targets: p, y: sol - 8, duration: 140, yoyo: true, ease: 'Quad.easeOut', onComplete: () => {
          const sens = Math.random() < 0.5 ? -1 : 1;
          scene.tweens.add({ targets: p, x: p.x + sens * 26, angle: sens * 260, duration: 900, ease: 'Quad.easeOut', onComplete: () => scene.tweens.add({ targets: p, alpha: 0, delay: 5000, duration: 600, onComplete: () => p.destroy() }) });
        } });
      } });
      apres(6000 + Math.random() * 5000, chute);
    };
    apres(3000, chute);
    moutonVivant(scene, plan, 1240, 354, {});
  } else if (quoi === 'foret') {
    // le cerf qui broute et relève la tête, les champignons, les feuilles qui tombent, les rais de lumière
    const r = scene.raisLumiere = dansPlan(plan, scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD));
    for (const [x, l] of [[330, 26], [620, 40], [760, 20], [1180, 34]]) { r.fillStyle(0xfff0b0, 0.12).fillTriangle(x, 120, x + l, 120, x + l * 2.6 + 40, 352); r.fillTriangle(x, 120, x + l * 2.6 + 40, 352, x + 40, 352); }
    scene.tweens.add({ targets: r, alpha: 0.55, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const cerf = poser(cerfHD(scene, 'broute'), 980, 352);
    const relever = () => { if (!cerf.active) return; cerf.setTexture(cerfHD(scene, 'guette')); apres(1800 + Math.random() * 1500, () => { if (cerf.active) cerf.setTexture(cerfHD(scene, 'broute')); apres(3000 + Math.random() * 3000, relever); }); };
    apres(2500, relever);
    for (const [x, y] of [[330, 350], [342, 352], [470, 351], [1300, 350]]) poser(champignonHD(scene), x, y);
    const arbres = (scene.arbresRecit || []).filter(a => a.active);
    scene.time.addEvent({ delay: 900, loop: true, callback: () => {
      const a = arbres.length ? Phaser.Utils.Array.GetRandom(arbres) : null;
      if (!a || !a.active) return;
      const f = dansPlan(plan, scene.add.image(a.x + Phaser.Math.Between(-30, 30), a.y - a.displayHeight * 0.7, feuilleHD(scene, Phaser.Utils.Array.GetRandom([0xd08a2a, 0xa86a28, 0x8aaa3a]))).setScale(2));
      // elle tombe en se balançant et en tournant, et se pose
      const x0 = f.x, u = { t: 0 };
      scene.tweens.add({ targets: u, t: 1, duration: 3600, ease: 'Linear', onUpdate: () => { if (f.active) f.setPosition(x0 + Math.sin(u.t * 9) * 14 - u.t * 30, f.y + (PRE_RECIT.pres - 4 - f.y) * 0.012).setAngle(Math.sin(u.t * 9) * 40); },
        onComplete: () => scene.tweens.add({ targets: f, alpha: 0, duration: 900, onComplete: () => f.destroy() }) });
    } });
  } else if (quoi === 'pics') {
    // un paquet de neige glisse d'une branche de sapin, tombe en poudre et s'écrase au pied ; l'aigle plane
    const sapins = (scene.arbresRecit || []).filter(a => a.active);
    const glisser = () => {
      const a = sapins.length ? Phaser.Utils.Array.GetRandom(sapins) : null;
      if (!a || !a.active) return;
      const x = a.x + (Math.random() < 0.5 ? -1 : 1) * a.displayWidth * 0.18, y = a.y - a.displayHeight * 0.45;
      const n = dansPlan(plan, scene.add.image(x, y, neigePaquetHD(scene)).setScale(2));
      scene.tweens.add({ targets: n, x: x + (x < a.x ? -6 : 6), duration: 500, ease: 'Sine.easeIn', onComplete: () => {
        scene.tweens.add({ targets: n, y: a.y - 6, scaleX: 2.3, scaleY: 1.5, duration: 600, ease: 'Quad.easeIn', onComplete: () => scene.tweens.add({ targets: n, alpha: 0, delay: 2500, duration: 800, onComplete: () => n.destroy() }) });
        for (let i = 0; i < 10; i++) { const p = dansPlan(plan, scene.add.circle(n.x + Phaser.Math.Between(-10, 10), n.y + 4, 1.2 + (i % 2), 0xffffff, 0.85)); scene.tweens.add({ targets: p, y: a.y - 4 - Math.random() * 10, x: p.x + Phaser.Math.Between(-14, 14), alpha: 0, duration: 700 + i * 50, ease: 'Quad.easeIn', onComplete: () => p.destroy() }); }
      } });
      apres(5000 + Math.random() * 4000, glisser);
    };
    apres(2500, glisser);
    const ciel = scene.planCiel || plan, aigle = dansPlan(ciel, scene.add.image(300, 90, aigleHD(scene)).setScale(2));
    const t = { a: 0 };
    scene.tweens.add({ targets: t, a: Math.PI * 2, duration: 16000, repeat: -1, onUpdate: () => aigle.setPosition(440 + Math.cos(t.a) * 230, 150 + Math.sin(t.a) * 24).setFlipX(Math.sin(t.a) > 0) });
  }
}

// Pose toute la variante d'une destination dans le récit : repère, arbres (à la place des arbres
// génériques), sol, faune, décor vivant.
function planterVarianteRecit(scene, zone, biome) {
  const v = varianteRecit(zone);
  if (!v) return false;
  const b = BIOMES[biome] || BIOMES.comte;
  const loin = melangeCouleur(melangeCouleur(b.loin, b.ciel, 0.25), 0x1a1420, 0.25);
  const planLoin = scene.planLoin || scene.planMoyen;
  if (v.repere) {
    // (v0.80) le repère peint en pixel art, s'il existe ; sinon l'ancienne silhouette. (v1.62) Il est au loin,
    // sur les collines du milieu (elles défilent à ×0,55) : plus petit, les pieds dans l'herbe des collines.
    const cle = typeof textureRepere === 'function' ? textureRepere(scene, v.repere) : null;
    const xR = 700, e = cle ? (scene.textures.get(cle).getSourceImage().width > 330 ? 0.42 : 0.48) : 0.46;
    const pied = Math.min(326, (scene.creteCollines ? scene.creteCollines(xR) : 290) + 14);
    if (cle) {
      const lac = v.repere === 'lac';
      const img = dansPlan(planLoin, scene.add.image(xR, pied + (lac ? 8 : 3), cle).setOrigin(0.5, 1).setScale(e).setTint(0xf0eeea));
      scene.lacX = xR; scene.lacY = pied - 4;
      // (v0.81) au Col des Hurlements, deux loups noirs hurlent à la lune sur l'éperon
      if (v.repere === 'colHurlements' && typeof creerRecitEpreuvesHD === 'function') {
        creerRecitEpreuvesHD(scene);
        [[-28, false], [28, true]].forEach(([dx, flip], i) => {
          const l = dansPlan(planLoin, scene.add.image(xR + dx * e, img.y - 138 * e, 'loupHD_hurle').setOrigin(0.5, 1).setScale(1.05 * e).setFlipX(flip).setTint(0x2a2430));
          scene.tweens.add({ targets: l, scaleY: 1.09 * e, duration: 900 + i * 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        });
      }
    } else { const g = dansPlan(planLoin, scene.add.graphics()); g.setPosition(xR, pied).setScale(e); dessinerRepere(g, v.repere, loin, 0); }
  }
  if (v.arbres) {
    // (v0.81) des arbres peints, posés dans le pré (×1) ; sinon l'ancienne silhouette
    const neige = ['montagne', 'glace', 'neige'].includes(biome);
    const sombre = ['foret', 'marais', 'repaire', 'tour', 'grotte'].includes(biome);
    const teinte = neige ? 0x6a7a74 : melangeCouleur(b.arbres || b.loin, 0x0a0a10, sombre ? 0.45 : 0.3);
    const cleArbre = typeof textureArbre === 'function' ? textureArbre(scene, v.arbres) : null;
    const g = dansPlan(scene.planMoyen, scene.add.graphics());
    scene.arbresRecit = [];
    // (des trouées là où sont posés les décors vivants, pour qu'ils ne se cachent pas derrière un tronc)
    const trous = v.vivant === 'moisson' ? [[350, 860], [1380, 1600]] : v.vivant === 'verger' ? [[370, 600]] : v.vivant === 'foret' ? [[930, 1040]] : [];
    for (let x = -60; x < LARGEUR_RECIT + 60; x += 90 + (Math.abs(x) * 3) % 70) {
      if (trous.some(([a, c]) => x > a && x < c)) continue;
      const pied = PRE_RECIT.loin - ((Math.abs(x) * 7) % 5);
      if (cleArbre) scene.arbresRecit.push(dansPlan(scene.planMoyen, scene.add.image(x, pied, cleArbre).setOrigin(0.5, 1).setScale(0.75 + ((Math.abs(x) * 7) % 40) / 100).setFlipX((Math.abs(x) * 3) % 2 === 0).setTint(sombre ? 0x9a9aa0 : 0xe8e8e0)));
      else dessinerArbreVariante(g, v.arbres, x, pied, 60 + (Math.abs(x) * 7) % 70, 22 + (Math.abs(x) * 5) % 18, teinte);
    }
  }
  if (v.sombre) scene.add.rectangle(480, 185, 960, 370, v.sombre, 0.45).setDepth(-1.95).setScrollFactor(0);   // (un ciel lourd, menaçant)
  if (v.sol) { const g = dansPlan(scene.premierPlan, scene.add.graphics()); dessinerSolVariante(g, 370, v.sol); }
  if (v.vivant) planterVivant(scene, v.vivant);
  scene.fauneRecit = (v.faune || []).map(f => lancerFaune(scene, f)).filter(Boolean);
  // ce qui est posé dans le pré se cache bien derrière ce qui est plus près (rangé par les pieds)
  scene.planMoyen.sort('y');
  return !!v.arbres;
}
