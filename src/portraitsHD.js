// Portraits en haute définition (essai) : un nain, dessiné pixel par pixel avec une palette
// élargie. Chaque matière a un dégradé de 6 teintes (ombres froides, lumières chaudes), la
// lumière vient d'en haut à gauche, les contours sont colorés (plus clairs côté lumière),
// et les yeux, sourcils et bouches sont dessinés à la main pour chaque expression.

const HD_L = 80;
const HD_H = 100;

// Les dégradés, du plus sombre au plus clair.
const RAMPES = {
  peau: [0x3b1f1a, 0x6e3a2c, 0x9c5a40, 0xc47e5a, 0xe2a67c, 0xf4cba2],
  barbe: [0x2a1210, 0x5a2216, 0x8c381c, 0xba5826, 0xda803a, 0xf0ac5c],
  metal: [0x15161f, 0x30364a, 0x566176, 0x8590a4, 0xb6c0cc, 0xe8eef2],
  cuir: [0x1e120e, 0x3e2418, 0x5e3a22, 0x82552e, 0xa8763e, 0xc89a58],
  tissu: [0x1c0c14, 0x441628, 0x6e2234, 0x982e3c, 0xbc4a4a, 0xda7260],
  or: [0x3a2410, 0x7a4a14, 0xb07a1e, 0xd8a634, 0xf0cf5a, 0xfff0a8],
  oeil: [0x0e1424, 0x1e3a66, 0x3a6aa8, 0x6aa0d8, 0xe6dece, 0xffffff],
  bouche: [0x1a0606, 0x3a0e0e, 0x6a1c1c, 0xa83a3a, 0xc85a50, 0xe8d8c8],
};
const NOIR_CONTOUR = 0x120806;
const LUMIERE = (() => { const v = [-0.5, -0.62, 0.6]; const n = Math.hypot(...v); return v.map(x => x / n); })();
const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];

class ToileHD {
  constructor(l, h) {
    this.l = l; this.h = h;
    this.c = new Array(l * h).fill(null);   // couleur
    this.m = new Array(l * h).fill(null);   // matière (pour les contours)
    this.rampes = { ...RAMPES };            // + les dégradés propres à ce personnage
  }
  dans(x, y) { return x >= 0 && y >= 0 && x < this.l && y < this.h; }
  poser(x, y, mat, i) {
    if (!this.dans(x, y)) return;
    i = Math.max(0, Math.min(5, i));
    this.c[y * this.l + x] = this.rampes[mat][i];
    this.m[y * this.l + x] = mat;
  }
  mat(x, y) { return this.dans(x, y) ? this.m[y * this.l + x] : null; }

  // Une forme (fonction dedans(x, y) → normale ou null) éclairée, avec son bord intérieur
  // plus sombre côté ombre et plus clair côté lumière.
  forme(mat, dedans, { decalage = 0, tramage = false, bord = true, motif = null } = {}) {
    const pts = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.l; x++) {
      const n = dedans(x, y);
      if (n) pts.push([x, y, n]);
    }
    const ens = new Set(pts.map(([x, y]) => y * this.l + x));
    const dans = (x, y) => this.dans(x, y) && ens.has(y * this.l + x);
    for (const [x, y, n] of pts) {
      const lum = n[0] * LUMIERE[0] + n[1] * LUMIERE[1] + n[2] * LUMIERE[2];
      let f = 1.2 + (lum + 0.15) * 3.6 + decalage;
      if (motif) f += motif(x, y);
      let i = Math.floor(f);
      if (tramage && f - i > (BAYER[y % 4][x % 4] + 0.5) / 16) i++;
      else if (!tramage && f - i > 0.5) i++;
      if (bord) {
        if (!dans(x + 1, y) || !dans(x, y + 1)) i = Math.min(i, 1);
        else if (!dans(x - 1, y) || !dans(x, y - 1)) i = Math.max(Math.min(i, 3), i - 1);
      }
      this.poser(x, y, mat, i);
    }
  }

  // Un petit dessin fait main : chaque lettre désigne [matière, teinte].
  dessin(x0, y0, lignes, legende, miroir = false) {
    lignes.forEach((ligne, j) => [...ligne].forEach((ch, i) => {
      if (ch === '.' || !legende[ch]) return;
      const [mat, t] = legende[ch];
      this.poser(miroir ? x0 + ligne.length - 1 - i : x0 + i, y0 + j, mat, t);
    }));
  }

  // Le contour extérieur, coloré selon la matière voisine (plus clair côté lumière).
  contour() {
    const ajouts = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.l; x++) {
      if (this.c[y * this.l + x] !== null) continue;
      const droite = this.mat(x + 1, y), bas = this.mat(x, y + 1), gauche = this.mat(x - 1, y), haut = this.mat(x, y - 1);
      if (droite || bas) ajouts.push([x, y, this.rampes[droite || bas][1]]);  // côté lumière
      else if (gauche || haut) ajouts.push([x, y, NOIR_CONTOUR]);             // côté ombre
    }
    for (const [x, y, c] of ajouts) this.c[y * this.l + x] = c;
  }

  texture(scene, cle) {
    if (scene.textures.exists(cle)) scene.textures.remove(cle);
    const g = scene.make.graphics({ add: false });
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.l; x++) {
      const c = this.c[y * this.l + x];
      if (c !== null) g.fillStyle(c, 1).fillRect(x, y, 1, 1);
    }
    g.generateTexture(cle, this.l, this.h);
    g.destroy();
  }
}

// Une ellipse (avec sa normale de sphère) ; `garder(x, y)` peut la découper.
function ellipsoide(cx, cy, rx, ry, garder = null) {
  return (x, y) => {
    const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry;
    const d = nx * nx + ny * ny;
    if (d > 1 || (garder && !garder(x, y))) return null;
    return [nx, ny, Math.sqrt(1 - d)];
  };
}

// --- Les dégradés générés : ombres qui tirent vers le bleu-violet, lumières vers le jaune ---

function versHsl(c) {
  const r = ((c >> 16) & 255) / 255, g = ((c >> 8) & 255) / 255, b = (c & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, l];
}

function depuisHsl(h, s, l) {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return (Math.round((r + m) * 255) << 16) | (Math.round((g + m) * 255) << 8) | Math.round((b + m) * 255);
}

// Rapproche une teinte d'une autre (sur le cercle des couleurs).
function versTeinte(h, cible, f) {
  const d = ((cible - h + 540) % 360) - 180;
  return h + d * f;
}

// Un dégradé de 6 teintes autour d'une couleur de base (qui devient la 4e teinte).
function rampe(base) {
  const [h, s, l] = versHsl(base);
  const pas = [-0.34, -0.23, -0.12, 0, 0.1, 0.19];
  return pas.map((d, i) => {
    const ombre = i < 3 ? (3 - i) / 3 : 0, lumiere = i > 3 ? (i - 3) / 2 : 0;
    const hh = versTeinte(versTeinte(h, 255, ombre * 0.22), 50, lumiere * 0.18);
    const ss = Math.min(1, s * (1 + ombre * 0.15) * (1 - lumiere * 0.1));
    return depuisHsl(hh, ss, Math.max(0.04, Math.min(0.96, l + d)));
  });
}

// --- Le « gène » d'un personnage : tiré de son nom et de son peuple ---

// Les peaux, réglées à la main (comme celle du nain) : du plus clair au plus foncé.
const RAMPES_PEAU = [
  [0x5a2e2a, 0x9a5a4a, 0xc88a6e, 0xe8b28e, 0xf6d0ae, 0xfde6cc],
  [0x3b1f1a, 0x6e3a2c, 0x9c5a40, 0xc47e5a, 0xe2a67c, 0xf4cba2],
  [0x3a1c14, 0x643222, 0x8e4e32, 0xb26c46, 0xcc8c5e, 0xe2ac7c],
  [0x26120e, 0x45221a, 0x6a3826, 0x8c5034, 0xaa6a46, 0xc4885e],
  [0x180a08, 0x2e1610, 0x4a2618, 0x643a24, 0x7e5034, 0x9a6a48],
];
const BASES_PEAU = [0, 1, 2, 3, 4];
const PEUPLES_HD = {
  humain: { peaux: [0, 1, 2, 3, 4], cheveux: [0x4a3220, 0x7a4a26, 0xb5532a, 0xd8c070, 0x24222a, 0x8a8a90],
    habits: [0x8a3030, 0x34507a, 0x4a6a34, 0x6a4a2a, 0x6a2a50, 0x3a5a5a] },
  hobbit: { peaux: [0, 1, 2], cheveux: [0x6b3e1e, 0x8a5a2a, 0xa8602a, 0x4a3020], habits: [0x4a6a30, 0x8a6a2a, 0x9a5a2a, 0x5a7a4a, 0x7a3a2a] },
  nain: { peaux: [1, 2, 3], cheveux: [0xba5826, 0x7a3a1a, 0x3a2a1a, 0x9a9aa0, 0xd8a040], habits: [0x8a2a34, 0x34465a, 0x5a3a24] },
  elfe: { peaux: [0, 1], cheveux: [0xe8dca8, 0xd4d4e0, 0x2a2a34, 0xc8944a], habits: [0x2f6a4a, 0x4a7a6a, 0x6a7a8a, 0x3a5a3a] },
  magicienne: { peaux: [0, 1, 2, 3], cheveux: [0xb0602a, 0x2a1a30, 0xd8c070, 0xa0a0b0, 0x8a2a5a], habits: [0x5a3a8a, 0x2a4a8a, 0x6a2a5a, 0x3a3a6a] },
};

function geneHD(p) {
  const r = hasardDuNom(p.nom || 'Inconnu');
  const choix = liste => liste[Math.floor(r() * liste.length)];
  const race = PEUPLES_HD[p.race] ? p.race : 'humain';
  const pp = PEUPLES_HD[race];
  const f = !!p.feminin;
  return {
    race, feminin: f,
    peau: BASES_PEAU[choix(pp.peaux)],
    cheveux: choix(pp.cheveux),
    habit: choix(pp.habits),
    cape: choix([0x4a3a2a, 0x2a4a3a, 0x3a3048, 0x5a2a2a]),
    coiffure: race === 'hobbit' ? 'boucles' : f ? choix(['long', 'long', 'queue', 'chignon']) : choix(['court', 'court', 'long', 'chauve', 'herisse', 'queue']),
    barbe: race === 'nain' ? 'nain' : (!f && race === 'humain' ? choix([null, null, 'courte', 'bouc', 'pleine']) : null),
    yeux: choix([0x2a5a8a, 0x3a6a3a, 0x5a3a1a, 0x4a4a5a, 0x2a2a20]),
    armure: r() < 0.4,
    taches: r() < 0.25,
  };
}

// --- Les yeux (plus grands), sourcils et bouches, dessinés à la main ---
// l : paupière, s : creux de l'œil, w : blanc, i : iris sombre, I : iris clair, h : reflet
const LEGENDE_OEIL = { l: ['peau', 0], s: ['peau', 2], w: ['oeil', 4], i: ['iris', 1], I: ['iris', 3], h: ['oeil', 5] };
const YEUX = {
  neutre: ['...........', '..lllllll..', '.lwwIIiwwl.', '.swwIhiwws.', '..swiiiws..', '...sssss...'],
  content: ['...........', '...........', '..lllllll..', '.lwwIhiwwl.', '..lllllll..', '...........'],
  inquiet: ['..lllllll..', '.lwwwwwwwl.', '.lwwIIiwwl.', '.swwIhiwws.', '..swiiiws..', '...sssss...'],
  fache: ['...........', '...........', '.lllllllll.', '.lwwIhiwwl.', '..swiiiws..', '...sssss...'],
  cligne: ['...........', '...........', '...........', '.lllllllll.', '..sssssss..', '...........'],
};
// La hauteur de chaque colonne du sourcil (de l'extérieur vers le nez).
const SOURCILS = {
  neutre: [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
  content: [1, 0, -1, -1, -1, -1, -1, 0, 0, 1, 1],
  inquiet: [3, 2, 2, 1, 1, 0, 0, -1, -1, -2, -2],
  fache: [-2, -2, -1, -1, 0, 0, 1, 1, 2, 2, 3],
};
// d : lèvre, D : fond de la bouche, w : dents, r : langue, p : ombre sous le nez
const LEGENDE_BOUCHE = { d: ['levres', 1], D: ['bouche', 0], w: ['bouche', 5], r: ['bouche', 3], p: ['peau', 2] };
const BOUCHES = {
  neutre: ['..........', '..pppppp..', '.dddddddd.', '..........'],
  content: ['.d......d.', '..dwwwwd..', '...dddd...', '..........'],
  inquiet: ['..........', '...dddd...', '..d....d..', '.d......d.'],
  fache: ['..........', '...dddd...', '..dwwwwd..', '.d......d.'],
  parle: ['..dddddd..', '.dDDDDDDd.', '.dDrrrrDd.', '..dddddd..'],
};

// Les proportions du visage, par peuple.
const VISAGES = {
  humain: { cy: 43, rx: 15.5, ry: 18.5, menton: 0.1, yeux: 41, nez: [2.8, 3.8], bouche: 56, cou: 6, torse: 66, sourcil: 2 },
  hobbit: { cy: 46, rx: 16.5, ry: 17, menton: 0, joues: 0.1, yeux: 45, nez: [3.6, 3.2], bouche: 59, cou: 6, torse: 68, sourcil: 2 },
  nain: { cy: 43, rx: 17, ry: 19, menton: 0, yeux: 43, nez: [5, 4.6], bouche: 60, cou: 0, torse: 66, sourcil: 3 },
  elfe: { cy: 42, rx: 14, ry: 19, menton: 0.22, yeux: 41, nez: [2.2, 3.8], bouche: 55, cou: 5, torse: 66, sourcil: 1 },
  magicienne: { cy: 46, rx: 15, ry: 18, menton: 0.12, yeux: 45, nez: [2.6, 3.6], bouche: 59, cou: 5, torse: 68, sourcil: 1 },
};

// La tête (ellipse dont le menton peut s'affiner).
function tete(cx, v) {
  return (x, y) => {
    const ny = (y + 0.5 - v.cy) / v.ry;
    // Des joues pleines (la tête s'élargit un peu sous les yeux), puis le menton s'affine
    const joues = v.joues && ny > -0.1 && ny < 0.7 ? 1 + Math.sin((ny + 0.1) / 0.8 * Math.PI) * v.joues : 1;
    const rx = v.rx * joues * (ny > 0.35 ? 1 - (ny - 0.35) * v.menton * 1.6 : 1);
    const nx = (x + 0.5 - cx) / rx;
    const d = nx * nx + ny * ny;
    return d > 1 ? null : [nx, ny, Math.sqrt(1 - d)];
  };
}

// Les mèches des cheveux et des barbes.
const MECHES = (x, y) => { const m = (x * 3 + Math.round(Math.sin(y / 3.5) * 1.5)) % 7; return m === 0 ? 0.8 : m === 4 ? -0.7 : 0; };

// --- Le portrait complet ---

function dessinerBusteHD(gene, expression = 'neutre', { cligne = false, parle = false } = {}) {
  const t = new ToileHD(HD_L, HD_H);
  const g = gene;
  const cx = 40;
  const v = VISAGES[g.race];
  t.rampes.peau = RAMPES_PEAU[g.peau];
  t.rampes.cheveux = rampe(g.cheveux);
  t.rampes.habit = rampe(g.habit);
  t.rampes.cape = rampe(g.cape);
  t.rampes.iris = rampe(g.yeux);
  t.rampes.lin = rampe(0xd8ccb0);
  t.rampes.levres = g.feminin ? rampe(0xb84a5a) : rampe(0x8a3a34);
  t.rampes.barbe = t.rampes.cheveux;

  // 1. Les cheveux longs, derrière tout le reste
  if (['long', 'queue', 'chignon'].includes(g.coiffure) || g.race === 'elfe' || g.race === 'magicienne') {
    const long = g.coiffure === 'long' || g.race === 'elfe' || g.race === 'magicienne';
    t.forme('cheveux', (x, y) => {
      const nx = (x + 0.5 - cx) / (v.rx + 3);
      if (Math.abs(nx) > 1) return null;
      if (y < v.cy - v.ry - 2 || y > (long ? v.cy + v.ry + 14 : v.cy + 4)) return null;
      const ny = (y + 0.5 - v.cy) / (v.ry + 3);
      if (y < v.cy && nx * nx + ny * ny > 1) return null;
      return [nx, Math.min(0.9, ny), Math.sqrt(Math.max(0.05, 1 - nx * nx))];
    }, { decalage: -0.8, motif: MECHES });
  }

  // 2. Le torse, selon le peuple
  torseHD(t, g, v, cx);

  // 3. Le cou, les oreilles, la tête
  if (v.cou) t.forme('peau', (x, y) => (y >= v.cy + v.ry - 6 && y <= v.torse + 2 && Math.abs(x + 0.5 - cx) < v.cou ? [(x + 0.5 - cx) / v.cou * 0.8, 0.3, 0.6] : null), { decalage: -0.7 });
  if (g.race !== 'elfe') {
    const o = g.race === 'hobbit' ? [4, 5.6] : [3.2, 5.2];
    for (const sens of [-1, 1]) t.forme('peau', ellipsoide(cx + sens * (v.rx + 0.5), v.yeux + 6, o[0], o[1]));
  }
  t.forme('peau', tete(cx, v));

  // 4. Le visage : sourcils, yeux, nez, joues, bouche
  const ey = v.yeux;
  const oeil = YEUX[cligne ? 'cligne' : expression];
  t.dessin(cx - 14, ey - 3, oeil, LEGENDE_OEIL);
  t.dessin(cx + 3, ey - 3, oeil, LEGENDE_OEIL, true);
  if (g.feminin && !cligne) {
    // Les cils, au coin extérieur
    const ligne = oeil.findIndex(l => l.includes('l'));
    t.poser(cx - 14, ey - 3 + ligne, 'cheveux', 0); t.poser(cx - 15, ey - 4 + ligne, 'cheveux', 0);
    t.poser(cx + 13, ey - 3 + ligne, 'cheveux', 0); t.poser(cx + 14, ey - 4 + ligne, 'cheveux', 0);
  }
  if (g.race === 'nain') t.forme('peau', ellipsoide(cx - 0.5, ey + 6 + v.nez[1] * 0.6, v.nez[0], v.nez[1]), { decalage: 0.3 });
  else if (g.race === 'hobbit') t.forme('peau', ellipsoide(cx - 0.5, ey + 7, 3.2, 2.8), { decalage: 0.1, bord: false });
  else {
    // L'arête du nez (ombre à droite), le bout éclairé, les narines
    for (let k = 1; k <= 6; k++) t.poser(cx + 1, ey + k, 'peau', 2);
    t.poser(cx, ey + 6, 'peau', 4); t.poser(cx - 1, ey + 6, 'peau', 5);
    t.poser(cx - 2, ey + 8, 'peau', 1); t.poser(cx + 2, ey + 8, 'peau', 1);
    t.poser(cx - 1, ey + 8, 'peau', 2); t.poser(cx, ey + 8, 'peau', 2); t.poser(cx + 1, ey + 8, 'peau', 2);
  }
  if (expression === 'content' || expression === 'fache') {
    for (const x of [cx - 11, cx - 10, cx + 9, cx + 10]) t.poser(x, ey + 7, 'levres', 4);
  }
  if (g.taches) for (const [i, j] of [[-9, 6], [-7, 7], [7, 6], [9, 7], [-8, 8], [8, 8]]) t.poser(cx + i, ey + j, 'peau', 2);
  t.dessin(cx - 5, v.bouche, BOUCHES[parle ? 'parle' : expression], LEGENDE_BOUCHE);

  // 5. La barbe
  if (g.barbe) barbeHD(t, g, v, cx);

  // 6. Les cheveux du dessus et les coiffes
  cheveuxHD(t, g, v, cx);
  coiffeHD(t, g, v, cx);
  // Les oreilles des elfes percent à travers les cheveux, et montent en pointe
  if (g.race === 'elfe') oreillesElfe(t, v, cx);

  // 7. Les sourcils, par-dessus tout (ils débordent du casque des nains)
  const sourcil = SOURCILS[expression];
  for (const sens of [-1, 1]) for (let k = 0; k < 11; k++) {
    const x = sens < 0 ? cx - 14 + k : cx + 13 - k;
    const y = ey - 6 + sourcil[k];
    for (let e = 0; e < v.sourcil; e++) t.poser(x, y + e, 'cheveux', e === 0 ? 4 : e === v.sourcil - 1 ? 1 : 3);
  }

  t.contour();
  return t;
}

// Un corps arrondi : la poitrine et deux épaules en volume (la normale vient du volume le plus en avant).
function corpsRond(cx, haut, largeur) {
  const volumes = [
    ellipsoide(cx, haut + 38, largeur + 4, 37, (x, y) => y >= haut + 1),
    ellipsoide(cx - largeur + 9, haut + 11, 12.5, 10.5),
    ellipsoide(cx + largeur - 9, haut + 11, 12.5, 10.5),
  ];
  // La poitrine d'abord ; les épaules seulement là où elles dépassent (pas de bosses devant).
  return (x, y) => volumes[0](x, y) || volumes[1](x, y) || volumes[2](x, y);
}

function torseHD(t, g, v, cx) {
  const largeur = { nain: 24, hobbit: 21, humain: 20, elfe: 18, magicienne: 19 }[g.race];
  const corps = corpsRond(cx, v.torse, largeur);
  if (g.race === 'nain') {
    t.forme('habit', corps, { decalage: -0.7 });
    t.forme('metal', ellipsoide(cx, 92, 22, 26, (x, y) => y >= 66), {
      decalage: -0.9,
      motif: (x, y) => { const u = (x + (Math.floor(y / 3) % 2) * 1.5) % 3, w = y % 3; return u < 1 && w < 1 ? 0.9 : u >= 2 || w >= 2 ? -0.5 : 0.2; },
    });
    t.forme('cuir', (x, y) => (y >= 68 && Math.abs((x - 18) - (y - 68) * 0.9) < 3 ? [0.2, 0.1, 0.97] : null));
    t.dessin(52, 90, ['.ooo.', 'o...o', 'o...o', '.ooo.'], { o: ['or', 3] });
    epaulieres(t, cx, 25, 74);
  } else if (g.race === 'hobbit') {
    t.forme('lin', corps, { decalage: -0.2 });
    // Le gilet, ouvert en V, avec ses revers plus sombres
    const gilet = (x, y) => {
      const n = corps(x, y);
      if (!n || y < v.torse + 3) return null;
      const ouverture = Math.max(0, 8 - (y - v.torse) * 0.18);
      return Math.abs(x + 0.5 - cx) < ouverture ? null : n;
    };
    t.forme('habit', gilet, { decalage: -0.1 });
    t.forme('habit', (x, y) => {
      const ouverture = Math.max(0, 8 - (y - v.torse) * 0.18);
      const d = Math.abs(x + 0.5 - cx) - ouverture;
      return gilet(x, y) && d < 2.5 && y < v.torse + 22 ? [Math.sign(x - cx) * 0.3, 0, 0.9] : null;
    }, { decalage: -1.2, bord: false });
    // Les boutons de cuivre, la poche et la chaîne de montre
    for (const y of [82, 88, 94]) { t.poser(cx + 9, y, 'or', 5); t.poser(cx + 9, y + 1, 'or', 2); }
    t.forme('habit', (x, y) => (y >= 84 && y <= 86 && x >= cx - 17 && x <= cx - 11 ? [0, -0.5, 0.8] : null), { decalage: -1, bord: false });
    for (let k = 0; k <= 8; k++) t.poser(cx - 11 + k, 85 + Math.round(Math.sin(k / 8 * Math.PI) * 3), 'or', k % 2 ? 4 : 3);
    // Le col froncé de la chemise
    t.dessin(cx - 7, v.torse - 2, ['ll.lll.lll.ll', '.lllllllllll.', '..ll.....ll..'], { l: ['lin', 4] });
  } else if (g.race === 'magicienne') {
    t.forme('habit', corps, { decalage: -0.4 });
    t.forme('habit', (x, y) => (y >= v.torse - 3 && y <= v.torse + 3 && Math.abs(x + 0.5 - cx) < 9 ? [(x + 0.5 - cx) / 9, -0.4, 0.8] : null), { decalage: 0.4 });
    for (const [x, y] of [[cx - 15, 82], [cx + 12, 88], [cx - 6, 95], [cx + 4, 78], [cx - 18, 96], [cx + 18, 80]]) {
      t.poser(x, y, 'or', 5); t.poser(x - 1, y, 'or', 3); t.poser(x + 1, y, 'or', 3); t.poser(x, y - 1, 'or', 3); t.poser(x, y + 1, 'or', 3);
    }
    t.dessin(cx - 2, v.torse + 6, ['.o.', 'oCo', '.o.'], { o: ['or', 3], C: ['iris', 4] }); // l'amulette
  } else if (g.race === 'elfe') {
    t.forme('habit', corps, { decalage: -0.2 });
    // Des feuilles brodées sur la tunique
    for (let y = v.torse + 12; y < 100; y += 7) for (let x = cx - 14 + ((y / 7) % 2) * 4; x < cx + 16; x += 8) {
      if (!corps(x, y)) continue;
      t.poser(x, y, 'habit', 5); t.poser(x + 1, y - 1, 'habit', 5); t.poser(x - 1, y + 1, 'habit', 4); t.poser(x + 1, y, 'habit', 4);
    }
    // La cape drapée sur les épaules, liserée d'argent
    t.forme('cape', (x, y) => {
      const n = corps(x, y);
      if (!n || y < v.torse - 1) return null;
      const ouverture = 11 + (y - v.torse) * 0.15;
      return Math.abs(x + 0.5 - cx) < ouverture ? null : n;
    }, { decalage: -0.4, motif: (x, y) => ((x * 2 + y) % 9 === 0 ? -0.6 : 0) });
    t.forme('metal', (x, y) => {
      const ouverture = 11 + (y - v.torse) * 0.15;
      return corps(x, y) && y >= v.torse && Math.abs(Math.abs(x + 0.5 - cx) - ouverture) < 0.8 ? [0, -0.3, 0.9] : null;
    }, { decalage: -0.4, bord: false });
    // Le col haut, et la broche-feuille à la gorge
    t.forme('habit', (x, y) => (y >= v.torse - 4 && y <= v.torse + 2 && Math.abs(x + 0.5 - cx) < 7 ? [(x + 0.5 - cx) / 7, -0.3, 0.85] : null), { decalage: 0.3 });
    t.dessin(cx - 2, v.torse + 1, ['..g..', '.gGg.', 'gGLGg', '.gGg.', '..g..'], { g: ['or', 2], G: ['or', 4], L: ['habit', 5] });
  } else if (g.armure) {
    // Humain en armure : brigandine de cuir rivetée, col de mailles, épaulière
    t.forme('cuir', corps, { decalage: -0.9 });
    // Les rivets de la brigandine, en quinconce
    for (let y = v.torse + 9; y < 100; y += 5) for (let x = cx - 20; x <= cx + 20; x += 5) {
      const rx = x + (Math.floor(y / 5) % 2) * 2;
      if (!corps(rx, y) || !corps(rx + 1, y + 1)) continue;
      t.poser(rx, y, 'metal', 5); t.poser(rx + 1, y + 1, 'metal', 1);
    }
    t.forme('metal', (x, y) => (y >= v.torse - 3 && y <= v.torse + 4 && Math.abs(x + 0.5 - cx) < 10 ? [(x + 0.5 - cx) / 10, -0.2, 0.8] : null), {
      decalage: -0.6, motif: (x, y) => ((x + y) % 2 ? 0.5 : -0.5),
    });
    epaulieres(t, cx, 16, v.torse + 8, [-1]);
  } else {
    // Humain voyageur : gambeson matelassé, capuche sur les épaules, col lacé, bandoulière
    t.forme('habit', corps, { decalage: -0.3, motif: (x, y) => ((x - cx + 40) % 5 === 0 && y > v.torse + 10 ? -0.9 : 0) });
    t.forme('cape', ellipsoide(cx, v.torse + 3, 17, 7.5), { decalage: -0.3 });
    t.forme('cape', ellipsoide(cx, v.torse + 1, 10, 4), { decalage: -1.4, bord: false });
    // Le col lacé : la peau dans l'ouverture, et les lacets en croix
    for (let y = v.torse + 3; y < v.torse + 13; y++) {
      const o = Math.max(0, 3 - (y - v.torse - 3) * 0.3);
      for (let x = Math.round(cx - o); x <= Math.round(cx + o); x++) t.poser(x, y, 'peau', 2);
      if (y % 3 === 0) { t.poser(cx - 2, y, 'lin', 4); t.poser(cx - 1, y + 1, 'lin', 3); t.poser(cx + 1, y + 1, 'lin', 3); t.poser(cx + 2, y, 'lin', 4); }
    }
    // La bandoulière et sa boucle
    t.forme('cuir', (x, y) => (y >= v.torse + 6 && corps(x, y) && Math.abs((x - (cx - 17)) - (y - v.torse - 6) * 0.95) < 2.4 ? [0.2, 0.1, 0.97] : null));
    t.dessin(cx - 5, v.torse + 18, ['ooo', 'o.o', 'ooo'], { o: ['metal', 4] });
  }
}

function epaulieres(t, cx, ecart, y, cotes = [-1, 1]) {
  for (const sens of cotes) {
    const ex = cx + sens * ecart;
    t.forme('metal', ellipsoide(ex, y, 14, 10, (x, yy) => yy <= y + 6), { decalage: -0.8 });
    t.forme('metal', ellipsoide(ex, y - 2, 9, 6, (x, yy) => yy <= y + 2), { decalage: -0.3, bord: false });
    t.forme('or', (x, yy) => (yy >= y + 4 && yy <= y + 7 && Math.abs(x + 0.5 - ex) < 13.5 - (yy - y - 4) * 0.8 ? [0, (yy - y - 5.5) / 2, 0.9] : null));
    for (const k of [-7, 0, 7]) t.poser(ex + k, y + 2 - Math.abs(k) * 0.2, 'or', 5);
  }
}

function barbeHD(t, g, v, cx) {
  const bouche = { x: cx - 5, y: v.bouche, l: 10, h: 4 };
  const dansBouche = (x, y) => x >= bouche.x && x < bouche.x + bouche.l && y >= bouche.y && y < bouche.y + bouche.h;
  if (g.barbe === 'nain') {
    const demi = y => (y < v.yeux + 9 ? 0 : y < 66 ? 15 + (y - v.yeux - 9) * 0.45 : Math.max(0, 21.3 - (y - 66) * 0.55));
    t.forme('barbe', (x, y) => {
      if (y < v.yeux + 9 || y > 86) return null;
      const d = demi(y), nx = (x + 0.5 - cx) / d;
      if (Math.abs(nx) > 1 || dansBouche(x, y)) return null;
      if (y < v.yeux + 12 && Math.abs(x + 0.5 - cx) < 6) return null;
      return [nx, (y - 66) / 30, Math.sqrt(Math.max(0, 1 - nx * nx))];
    }, { motif: (x, y) => MECHES(x, y) + (y > 80 ? -0.4 : 0) });
    for (const bx of [cx - 6, cx + 6]) {
      t.forme('barbe', (x, y) => (y >= 84 && y <= 97 && Math.abs(x + 0.5 - bx) < 3.2 - (y - 84) * 0.1 ? [(x + 0.5 - bx) / 3, 0.1, 0.9] : null), { motif: (x, y) => (y % 3 === 0 ? -0.8 : 0.2) });
      t.forme('or', (x, y) => (y >= 89 && y <= 91 && Math.abs(x + 0.5 - bx) < 3.4 ? [(x + 0.5 - bx) / 3.4, (y - 90) / 2, 0.8] : null));
    }
  } else if (g.barbe === 'pleine' || g.barbe === 'courte') {
    const bas = g.barbe === 'pleine' ? v.cy + v.ry + 5 : v.cy + v.ry + 1;
    t.forme('barbe', (x, y) => {
      const f = tete(cx, { ...v, rx: v.rx + 0.8, ry: v.ry + (g.barbe === 'pleine' ? 5 : 1.5) })(x, y);
      if (!f || y < v.yeux + 7 || y > bas || dansBouche(x, y)) return null;
      if (y < v.bouche - 1 && Math.abs(x + 0.5 - cx) < 7) return null;
      return f;
    }, { motif: MECHES, decalage: -0.2 });
  } else if (g.barbe === 'bouc') {
    t.forme('barbe', (x, y) => (y >= v.bouche + 4 && y <= v.bouche + 10 && Math.abs(x + 0.5 - cx) < 4 - (y - v.bouche - 4) * 0.4 ? [(x + 0.5 - cx) / 4, 0.3, 0.8] : null), { motif: MECHES });
  }
  // La moustache
  if (g.barbe) {
    const largeurM = g.barbe === 'nain' ? 14 : 9;
    for (const sens of [-1, 1]) t.forme('barbe', (x, y) => {
      const u = (x + 0.5 - cx) * sens;
      if (u < 0 || u > largeurM) return null;
      const centre = v.bouche - 4 + u * 0.15 + (u > largeurM * 0.45 ? (u - largeurM * 0.45) * 0.55 : 0);
      const ep = u < largeurM / 2 ? 2 + u * 0.25 : Math.max(0.8, 2 + largeurM * 0.12 - (u - largeurM / 2) * 0.45);
      return Math.abs(y + 0.5 - centre) < ep ? [sens * u / largeurM * 0.7, (y + 0.5 - centre) / ep * 0.7, 0.75] : null;
    }, { decalage: 0.5, motif: (x, y) => ((x + y) % 4 === 0 ? 0.6 : 0) });
  }
}

function cheveuxHD(t, g, v, cx) {
  if (g.race === 'nain' && g.armure) return; // le casque
  if (g.race === 'magicienne') return;       // le chapeau
  if (g.coiffure === 'chauve') {
    t.poser(cx - 6, v.cy - v.ry + 4, 'peau', 5); t.poser(cx - 5, v.cy - v.ry + 4, 'peau', 5); // le reflet sur le crâne
    return;
  }
  if (g.coiffure === 'boucles') {
    // Des grappes de boucles, chacune éclairée
    for (const [i, j] of [[-12, -9], [-7, -13], [-1, -15], [5, -14], [11, -11], [15, -5], [-16, -3], [16, 3], [-16, 4], [-5, -11], [3, -10], [9, -9]]) {
      t.forme('cheveux', ellipsoide(cx + i, v.cy + j, 4.2, 4.2));
    }
    return;
  }
  // Le dessus de la tête, avec une frange
  const haut = v.cy - v.ry - 4, frange = v.yeux - 8;
  t.forme('cheveux', (x, y) => {
    // Le volume des cheveux dépasse du crâne, avec un bord en mèches
    const gonfle = 3 + Math.sin(x * 1.3) * 0.8;
    const nx = (x + 0.5 - cx) / (v.rx + 1.8), ny = (y + 0.5 - v.cy) / (v.ry + (y < v.cy ? gonfle : 1.5));
    if (nx * nx + ny * ny > 1 || y < haut) return null;
    // La frange descend en pointes sur le front ; les côtés couvrent les tempes
    const pointe = frange - 2 + Math.abs(Math.sin((x - cx) * 0.9)) * 3;
    const tempe = Math.abs(x + 0.5 - cx) > v.rx - 3.5 && y < v.yeux + 2;
    if (y > pointe && !tempe) return null;
    return [nx, ny, Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny))];
  }, { motif: MECHES });
  if (g.coiffure === 'herisse') for (let k = -10; k <= 10; k += 4) t.forme('cheveux', (x, y) => (y >= haut - 4 && y < haut + 2 && Math.abs(x + 0.5 - cx - k) < (y - haut + 4) * 0.4 ? [0, -0.6, 0.7] : null));
  if (g.coiffure === 'chignon') t.forme('cheveux', ellipsoide(cx, haut - 1, 6, 4.5));
  if (g.coiffure === 'queue') t.forme('cheveux', ellipsoide(cx + v.rx + 2, v.cy + 4, 3, 9), { motif: MECHES });
}

function coiffeHD(t, g, v, cx) {
  if (g.race === 'elfe') {
    // Le diadème d'argent avec sa pierre
    const y = v.yeux - 9;
    t.forme('metal', (x, yy) => (yy === y && Math.abs(x + 0.5 - cx) < v.rx - 0.5 ? [(x + 0.5 - cx) / v.rx, 0, 0.9] : null), { decalage: 0.6, bord: false });
    t.dessin(cx - 1, y - 1, ['.o.', 'oCo', '.o.'], { o: ['metal', 4], C: ['iris', 4] });
  } else if (g.race === 'magicienne') {
    // Le grand chapeau pointu, un peu de travers, avec son ruban d'or
    t.forme('habit', (x, y) => {
      if (y > v.cy - v.ry + 6) return null;
      const h = (v.cy - v.ry + 6) - y; // hauteur au-dessus du bord
      const axe = cx + 3 - h * 0.18;
      const demi = Math.max(0, 15 - h * 0.62);
      const nx = (x + 0.5 - axe) / Math.max(1, demi);
      return Math.abs(nx) > 1 ? null : [nx, -0.3, Math.sqrt(1 - nx * nx)];
    }, { decalage: -0.2 });
    t.forme('habit', (x, y) => (Math.abs(y + 0.5 - (v.cy - v.ry + 7)) < 2.2 && Math.abs(x + 0.5 - cx) < 27 ? [(x + 0.5 - cx) / 27, (y - v.cy + v.ry - 7) / 2, 0.7] : null), { decalage: -0.4 });
    t.forme('or', (x, y) => (y >= v.cy - v.ry + 2 && y <= v.cy - v.ry + 4 && Math.abs(x + 0.5 - cx - 1) < 12.5 ? [0, (y - v.cy + v.ry - 3), 0.8] : null));
  } else if (g.race === 'nain' && g.armure) {
    t.forme('metal', ellipsoide(cx, v.cy - 6, 19.5, 17, (x, y) => y <= v.cy - 6), { decalage: -0.8 });
    t.forme('metal', (x, y) => (y >= v.cy - 22 && y <= v.cy - 10 && Math.abs(x + 0.5 - cx) < 1.6 ? [(x + 0.5 - cx) / 2, -0.5, 0.7] : null), { decalage: 0.2 });
    t.forme('or', (x, y) => {
      if (y < v.cy - 10 || y > v.cy - 6) return null;
      const demi = 19.5 * Math.sqrt(Math.max(0, 1 - ((y + 0.5 - v.cy + 6) / 17) ** 2)) + 0.5;
      return Math.abs(x + 0.5 - cx) <= demi ? [(x + 0.5 - cx) / demi, (y - v.cy + 8) / 3, 0.8] : null;
    });
    for (let k = -16; k <= 16; k += 6) t.poser(cx + k, v.cy - 8, 'or', 5);
    t.forme('metal', (x, y) => (y >= v.cy - 6 && y <= v.yeux + 5 && x >= cx - 1 && x <= cx + 1 ? [(x - cx) * 0.6, 0, 0.8] : null), { decalage: -0.6 });
  }
}

// La texture d'un portrait HD (créée à la demande, puis gardée).
function textureBusteHD(scene, personne, expression = 'neutre', etat = {}) {
  const cle = `busteHD_${personne.race}_${personne.nom}_${expression}${etat.cligne ? '_c' : ''}${etat.parle ? '_p' : ''}`;
  if (!scene.textures.exists(cle)) dessinerBusteHD(geneHD(personne), expression, etat).texture(scene, cle);
  return cle;
}

function oreillesElfe(t, v, cx) {
  for (const sens of [-1, 1]) t.forme('peau', (x, y) => {
    const u = (x + 0.5 - cx) * sens - v.rx + 1.5; // vers l'extérieur
    const w = y + 0.5 - (v.yeux + 5);             // vers le bas
    // Collée à la tête au niveau des yeux, elle monte en pointe jusqu'au-dessus des sourcils
    return u > 0 && u < 7.5 && w > -2 - u * 1.7 && w < 4 - u * 1.9 ? [sens * 0.6, -0.45, 0.65] : null;
  });
}
