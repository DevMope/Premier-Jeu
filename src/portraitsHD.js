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
    this.k = new Array(l * h).fill(0);      // la teinte posée (0 sombre … 5 clair), pour les ombres portées
    this.rampes = { ...RAMPES };            // + les dégradés propres à ce personnage
    this.relief = false;                    // true : chaque forme projette une ombre sur ce qu'elle recouvre
    this.cel = false;                       // true : trois tons francs (ombre, teinte, lumière) au lieu d'un dégradé
  }
  dans(x, y) { return x >= 0 && y >= 0 && x < this.l && y < this.h; }
  poser(x, y, mat, i) {
    if (!this.dans(x, y)) return;
    i = Math.max(0, Math.min(5, i));
    this.c[y * this.l + x] = this.rampes[mat][i];
    this.m[y * this.l + x] = mat;
    this.k[y * this.l + x] = i;
  }
  teinte(x, y) { return this.dans(x, y) ? this.k[y * this.l + x] : 0; }

  // L'ombre portée d'une forme : ce qui dépasse en dessous et à droite d'elle (la lumière vient
  // d'en haut à gauche) s'assombrit d'un ton. C'est ce qui décolle une manche du torse, un menton
  // du cou, une mèche du front.
  ombrer(ens, pts, portee = 2) {
    const faits = new Set();
    for (const [x, y] of pts) for (let dy = 0; dy <= portee; dy++) for (let dx = 0; dx <= Math.min(1, portee - dy); dx++) {
      if (!dx && !dy) continue;
      const nx = x + dx, ny = y + dy, idx = ny * this.l + nx;
      if (!this.dans(nx, ny) || ens.has(idx) || this.c[idx] === null || faits.has(idx)) continue;
      faits.add(idx);
      this.poser(nx, ny, this.m[idx], this.k[idx] - 1);
    }
  }
  mat(x, y) { return this.dans(x, y) ? this.m[y * this.l + x] : null; }

  // Une forme (fonction dedans(x, y) → normale ou null) éclairée, avec son bord intérieur
  // plus sombre côté ombre et plus clair côté lumière.
  forme(mat, dedans, { decalage = 0, tramage = false, bord = true, motif = null, ombre = null, portee = 2 } = {}) {
    const pts = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.l; x++) {
      const n = dedans(x, y);
      if (n) pts.push([x, y, n]);
    }
    const ens = new Set(pts.map(([x, y]) => y * this.l + x));
    const dans = (x, y) => this.dans(x, y) && ens.has(y * this.l + x);
    if (ombre ?? (this.relief && bord)) this.ombrer(ens, pts, portee);   // (un simple reflet ne porte pas d'ombre)
    for (const [x, y, n] of pts) {
      const lum = n[0] * LUMIERE[0] + n[1] * LUMIERE[1] + n[2] * LUMIERE[2];
      let f = 1.2 + (lum + 0.15) * 3.6 + decalage;
      if (motif) f += motif(x, y);
      let i = Math.floor(f);
      if (tramage && f - i > (BAYER[y % 4][x % 4] + 0.5) / 16) i++;
      else if (!tramage && f - i > 0.5) i++;
      if (this.cel) i = f < 2.3 ? 1 : f < 3.7 ? 3 : 4;   // trois tons, limite nette
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

  // La texture : on écrit tous les pixels d'un coup dans un canvas (bien plus rapide).
  texture(scene, cle) {
    // Une texture déjà affichée quelque part (le joueur qui change de tenue) : on la repeint sur
    // place, sans la détruire sous les pieds des images qui s'en servent.
    let tex = scene.textures.exists(cle) ? scene.textures.get(cle) : null;
    if (tex && !(tex.getSourceImage && tex.getSourceImage().width === this.l && tex.getSourceImage().height === this.h && tex.getContext)) {
      scene.textures.remove(cle);
      tex = null;
    }
    if (!tex) tex = scene.textures.createCanvas(cle, this.l, this.h);
    const ctx = tex.getContext();
    const img = ctx.createImageData(this.l, this.h);
    for (let k = 0; k < this.c.length; k++) {
      const c = this.c[k];
      if (c === null) continue;
      img.data[k * 4] = (c >> 16) & 255; img.data[k * 4 + 1] = (c >> 8) & 255; img.data[k * 4 + 2] = c & 255; img.data[k * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    tex.refresh();
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

// La couleur des lèvres selon la peau : sur une peau foncée, des lèvres sombres disparaissent
// (et avec elles, l'expression du visage) ; on les éclaircit pour qu'elles ressortent.
function levresPour(peau, feminin) {
  if (peau >= 4) return rampe(feminin ? 0xffb0b8 : 0xf0a898);
  if (peau >= 3) return rampe(feminin ? 0xf09aa4 : 0xd8907e);
  if (peau >= 2) return rampe(feminin ? 0xd06a78 : 0xb05a4c);
  return rampe(feminin ? 0xb84a5a : 0x8a3a34);
}
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
    // Les nobles et les collectionneurs (clients prestigieux) : des étoffes riches, et un chapeau à plume
    noble: !!p.prestige,
    colporteur: p.figurant === 'colporteur',
    nom: p.nom,
    habitNoble: choix([0x6a1a3a, 0x1a2a6a, 0x3a1a5a, 0x7a4a10]),
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
    if (v.carre) {
      // Une mâchoire carrée : la tête garde sa largeur jusqu'en bas, et finit à plat
      if (ny > 0.9) return null;
      const rx = v.rx * (ny > 0.2 ? Math.max(0.86, 1 - 0.1 * (ny - 0.2)) : 1);
      const nx = (x + 0.5 - cx) / rx;
      const d = nx * nx + ny * ny;
      return d > 1 ? null : [nx, ny, Math.sqrt(1 - d)];
    }
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

function dessinerBusteHD(gene, expression = 'neutre', { cligne = false, parle = false, pose = null } = {}) {
  const t = new ToileHD(HD_L, HD_H);
  const g = gene.colporteur ? { ...gene, habit: 0x6a5a40, cheveux: 0x4a3a2a, armure: false, barbe: 'courte', coiffure: 'court' } : gene;
  const cx = 40;
  const v = g.race === 'elfe' && !g.feminin ? { ...VISAGES.elfe, menton: 0, carre: true } : VISAGES[g.race];
  // Un trois-quarts léger : le visage est tourné de quelques pixels vers la droite (l'oreille
  // gauche se dégage, la droite se cache derrière la joue), et chaque forme porte son ombre.
  const T = 3;
  t.relief = true;
  t.rampes.peau = PEAUX_VIVES[g.peau];
  t.rampes.cheveux = rampeVive(g.cheveux);
  t.rampes.habit = rampeVive(g.habit);
  t.rampes.cape = rampeVive(g.cape);
  t.rampes.iris = rampeVive(g.yeux);
  t.rampes.cuir = rampeVive(0x6a3f22); t.rampes.metal = rampeVive(0x7a8498); t.rampes.lin = rampeVive(0xd8ccb0);
  t.rampes.velours = rampe(0x4a1a3a); t.rampes.plume = rampe(0xf0e8d0); t.rampes.fourrure = rampe(0xe8e0d0);
  t.rampes.lin = rampe(0xd8ccb0);
  t.rampes.levres = levresPour(g.peau, g.feminin);
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
    t.forme('peau', ellipsoide(cx - (v.rx + 0.5) - T * 0.7, v.yeux + 6, o[0], o[1]));          // l'oreille dégagée, derrière
    t.forme('peau', ellipsoide(cx + (v.rx + 0.5) - T * 1.6, v.yeux + 6, o[0] * 0.8, o[1] * 0.9)); // l'autre, presque cachée par la joue
  }
  t.forme('peau', tete(cx, v));

  // 4. Le visage : sourcils, yeux, nez, joues, bouche
  const ey = v.yeux;
  const fx = cx + T;   // le milieu du visage, tourné
  t.relief = false;    // (les traits du visage sont des dessins à plat : pas d'ombre portée)
  const oeil = YEUX[cligne ? 'cligne' : expression];
  t.dessin(fx - 14, ey - 3, oeil, LEGENDE_OEIL);
  t.dessin(fx + 3, ey - 3, oeil, LEGENDE_OEIL, true);
  if (g.feminin && !cligne) {
    // Les cils, au coin extérieur
    const ligne = oeil.findIndex(l => l.includes('l'));
    t.poser(fx - 14, ey - 3 + ligne, 'cheveux', 0); t.poser(fx - 15, ey - 4 + ligne, 'cheveux', 0);
    t.poser(fx + 13, ey - 3 + ligne, 'cheveux', 0); t.poser(fx + 14, ey - 4 + ligne, 'cheveux', 0);
  }
  if (g.race === 'nain') t.forme('peau', ellipsoide(fx - 0.5, ey + 6 + v.nez[1] * 0.6, v.nez[0], v.nez[1]), { decalage: 0.3 });
  else if (g.race === 'hobbit') t.forme('peau', ellipsoide(fx - 0.5, ey + 7, 3.2, 2.8), { decalage: 0.1, bord: false });
  else {
    // L'arête du nez (ombre à droite), le bout éclairé, les narines
    for (let k = 1; k <= 6; k++) t.poser(fx + 1, ey + k, 'peau', 2);
    t.poser(fx, ey + 6, 'peau', 4); t.poser(fx - 1, ey + 6, 'peau', 5);
    t.poser(fx - 2, ey + 8, 'peau', 1); t.poser(fx + 2, ey + 8, 'peau', 1);
    t.poser(fx - 1, ey + 8, 'peau', 2); t.poser(fx, ey + 8, 'peau', 2); t.poser(fx + 1, ey + 8, 'peau', 2);
  }
  if (expression === 'content' || expression === 'fache') {
    for (const x of [fx - 11, fx - 10, fx + 9, fx + 10]) t.poser(x, ey + 7, 'levres', 4);
  }
  if (g.taches) for (const [i, j] of [[-9, 6], [-7, 7], [7, 6], [9, 7], [-8, 8], [8, 8]]) t.poser(fx + i, ey + j, 'peau', 2);
  t.dessin(fx - 5, v.bouche, BOUCHES[parle ? 'parle' : expression], LEGENDE_BOUCHE);
  t.relief = true;

  // 5. La barbe
  if (g.barbe) barbeHD(t, g, v, fx);

  // 6. Les cheveux du dessus et les coiffes (la masse des cheveux reste un peu en arrière)
  cheveuxHD(t, g, v, cx - 1);
  coiffeHD(t, g, v, cx);
  if (g.noble) {
    // Le col de fourrure blanche, et le chapeau de velours à large bord orné d'une plume
    const haut = v.torse - 2;
    t.forme('fourrure', (x, y) => (y >= haut && y <= haut + 6 && Math.abs(x + 0.5 - cx) < 20 && Math.abs(x + 0.5 - cx) > v.cou - 1 ? [(x + 0.5 - cx) / 20, -0.3, 0.8] : null), { motif: (x, y) => ((x + y) % 2 ? 0.5 : -0.3) });
    const sommet = Math.round(v.cy - v.ry);
    t.forme('velours', (x, y) => (y >= sommet - 14 && y <= sommet + 1 && Math.abs(x + 0.5 - cx) < v.rx - 2 - (sommet + 1 - y) * 0.25 ? [(x + 0.5 - cx) / v.rx, -0.3, 0.8] : null));
    t.forme('velours', (x, y) => (y >= sommet && y <= sommet + 3 && Math.abs(x + 0.5 - cx) < v.rx + 7 ? [0, (y - sommet - 1) * 0.5, 0.8] : null));
    // La plume : elle part de la broche, monte en arc et retombe derrière le chapeau
    for (let k = 0; k < 20; k++) { const px = cx + 3 + k, py = sommet - 1 - Math.round(Math.sin(k / 19 * Math.PI) * 9) - Math.floor(k / 5); t.poser(px, py, 'plume', 4 + (k % 2)); t.poser(px, py + 1, 'plume', 3); if (k % 3 === 1) t.poser(px, py - 1, 'plume', 5); }
    t.poser(cx + 4, sommet + 1, 'or', 5); t.poser(cx + 5, sommet + 1, 'or', 4); t.poser(cx + 4, sommet + 2, 'or', 3);
  }
  if (g.colporteur) colporteurBuste(t, g, v, cx);
  // Les oreilles des elfes percent à travers les cheveux, et montent en pointe
  if (g.race === 'elfe') oreillesElfe(t, v, cx, T);

  // 7. Les sourcils, par-dessus tout (ils débordent du casque des nains)
  const sourcil = SOURCILS[expression];
  for (const sens of [-1, 1]) for (let k = 0; k < 11; k++) {
    const x = sens < 0 ? fx - 14 + k : fx + 13 - k;
    const y = ey - 6 + sourcil[k];
    for (let e = 0; e < v.sourcil; e++) t.poser(x, y + e, 'cheveux', e === 0 ? 4 : e === v.sourcil - 1 ? 1 : 3);
  }

  // 8. Les bras et les mains : la pose, selon l'humeur et le peuple
  brasBuste(t, g, v, cx, pose || poseBuste(g, expression));

  t.contour();
  return t;
}

// --- Les poses des bustes ---
// Chaque peuple a ses poses par humeur ; plusieurs sont communes. La pose d'une personne pour une
// humeur donnée est toujours la même (tirée de son nom), et change avec son humeur.
const POSES_BUSTE = {
  humain: { neutre: ['croises', 'hanche', 'menton'], content: ['salut', 'pouce', 'coeur'], inquiet: ['tete', 'coeur', 'mains'], fache: ['croises', 'poing'] },
  hobbit: { neutre: ['ventre', 'hanche', 'menton'], content: ['ventre', 'salut', 'pouce'], inquiet: ['coeur', 'tete'], fache: ['poing', 'croises'] },
  nain: { neutre: ['croises', 'hanche'], content: ['pouce', 'croises', 'salut'], inquiet: ['tete', 'croises'], fache: ['poing', 'croises'] },
  elfe: { neutre: ['menton', 'croises', 'hanche'], content: ['salut', 'coeur'], inquiet: ['coeur', 'mains'], fache: ['croises', 'hanche'] },
  magicienne: { neutre: ['baton', 'menton'], content: ['baton', 'salut'], inquiet: ['coeur', 'baton'], fache: ['baton', 'poing'] },
};
function poseBuste(g, expression) {
  const race = POSES_BUSTE[g.race] ? g.race : 'humain';
  const liste = POSES_BUSTE[race][expression] || POSES_BUSTE[race].neutre;
  const r = hasardDuNom((g.nom || '') + '|' + expression);
  return liste[Math.floor(r() * liste.length)];
}

// Les bras partent des épaules (sous les épaulières), les manches sont de la matière du torse.
function brasBuste(t, g, v, cx, pose) {
  const largeur = { nain: 24, hobbit: 21, humain: 20, elfe: 18, magicienne: 19 }[g.race];
  const manche = g.race === 'nain' ? 'metal' : g.race === 'hobbit' ? 'lin' : g.race === 'humain' && g.armure ? 'cuir' : 'habit';
  const ep = g.race === 'nain' ? 5.2 : 4.4;
  const sx = largeur + 2, sy = v.torse + 12;
  const epaule = s => [cx + s * sx, sy];
  const bras = (pts) => traitHD(t, manche, pts, ep, -0.2);
  const main = (x, y, rx = 5.8, ry = 5) => t.forme('peau', ellipsoide(x, y, rx, ry), { decalage: 0.1 });
  // Une main ouverte : la paume, quatre doigts séparés, le pouce sur le côté
  const ouverte = (x, y, s = 1) => {
    main(x, y, 6, 4.8);
    for (const k of [-5, -1.7, 1.7, 5]) t.forme('peau', ellipsoide(x + k, y - 7, 1.8, 4.6), { decalage: 0.1 });
    t.forme('peau', ellipsoide(x - s * 7.5, y - 1, 1.9, 3.4), { decalage: 0.1 });
    for (const k of [-3.4, 0, 3.4]) for (let j = -10; j <= -4; j++) t.poser(Math.round(x + k), y + j, 'peau', 1);
  };
  // Un poing : les phalanges en relief, le pouce replié devant
  const poing = (x, y) => {
    main(x, y, 6.4, 5.4);
    for (const k of [-4.2, -1.4, 1.4, 4.2]) { t.poser(Math.round(x + k), y - 4, 'peau', 5); t.poser(Math.round(x + k), y - 3, 'peau', 1); }
    t.forme('peau', ellipsoide(x - 1, y + 2, 4, 1.8), { decalage: 0.3 });
  };
  if (pose === 'croises') {
    // Les bras croisés : chaque avant-bras passe devant la poitrine, la main se glisse sous l'autre bras
    for (const s of [-1, 1]) { bras([epaule(s), [cx + s * (sx + 5), sy + 15], [cx - s * 11, sy + 9]]); main(cx - s * 13, sy + 9, 4.2, 3.6); }
  } else if (pose === 'hanche') {
    // Le poing sur la hanche : le coude pointe sur le côté
    bras([epaule(-1), [cx - sx - 13, sy + 15], [cx - sx - 6, sy + 30]]);
  } else if (pose === 'menton') {
    // La main au menton, pensif
    bras([epaule(1), [cx + sx + 8, sy + 19], [cx + 9, v.bouche + 9]]); main(cx + 8, v.bouche + 9, 4.6, 3.6);
  } else if (pose === 'salut') {
    // La main levée, paume ouverte
    bras([epaule(1), [cx + sx + 12, sy - 7], [cx + sx + 8, sy - 24]]); ouverte(cx + sx + 8, sy - 28);
  } else if (pose === 'pouce') {
    // Le pouce levé
    bras([epaule(1), [cx + sx + 12, sy - 3], [cx + sx + 7, sy - 17]]); poing(cx + sx + 7, sy - 18);
    t.forme('peau', ellipsoide(cx + sx + 3, sy - 27, 2.2, 5), { decalage: 0.2 });
  } else if (pose === 'poing') {
    // Le poing brandi
    bras([epaule(1), [cx + sx + 12, sy + 2], [cx + sx + 4, sy - 9]]); poing(cx + sx + 4, sy - 10);
  } else if (pose === 'tete') {
    // La main qui se gratte la tempe, embarrassée
    bras([epaule(1), [cx + sx + 15, sy - 6], [cx + v.rx + 6, v.yeux - 2]]); main(cx + v.rx + 4, v.yeux - 4, 4.4, 5);
  } else if (pose === 'mains') {
    // Les deux mains levées, surpris ou désolé
    for (const s of [-1, 1]) { bras([epaule(s), [cx + s * (sx + 14), sy - 2], [cx + s * (v.rx + 10), v.yeux + 10]]); ouverte(cx + s * (v.rx + 10), v.yeux + 8, s); }
  } else if (pose === 'coeur') {
    // La main sur le cœur, sincère
    bras([epaule(-1), [cx - sx - 9, sy + 17], [cx - 4, sy + 11]]); main(cx - 5, sy + 10, 5, 4);
  } else if (pose === 'ventre') {
    // Les mains jointes sur le ventre, satisfait
    for (const s of [-1, 1]) { bras([epaule(s), [cx + s * (sx + 9), sy + 18], [cx + s * 6, sy + 21]]); main(cx + s * 6, sy + 20, 4.6, 3.6); }
  } else if (pose === 'baton') {
    // Le bâton de la magicienne, tenu droit, son orbe au sommet
    t.rampes.chene = rampe(0x6b4423);
    const bx = cx + sx + 7;
    t.forme('chene', (x, y) => (y >= 12 && Math.abs(x + 0.5 - bx) < 2.2 ? [(x + 0.5 - bx) / 2.2, 0, 0.9] : null), { motif: (x, y) => (y % 9 === 0 ? -0.6 : 0) });
    t.forme('or', ellipsoide(bx, 11, 4.2, 3), { decalage: 0.2 });
    t.forme('iris', ellipsoide(bx, 8, 3.6, 3.6), { decalage: 0.8 });
    t.poser(bx - 1, 6, 'oeil', 5);
    bras([epaule(1), [cx + sx + 11, sy + 6], [bx, sy - 4]]); main(bx, sy - 5, 4.6, 4);
  }
}

// Le colporteur en buste : son grand chapeau mou, son foulard rouge, les bretelles de sa hotte.
function colporteurBuste(t, g, v, cx) {
  t.rampes.feutre = rampe(0x5a4630); t.rampes.foulard = rampe(0xa83a30);
  for (let y = v.torse - 1; y <= v.torse + 6; y++) for (let x = cx - 12 + (y - v.torse); x <= cx + 12 - (y - v.torse); x++) t.poser(x, y, 'foulard', 3 + ((x + y) % 3 === 0 ? 1 : 0) - (y > v.torse + 4 ? 1 : 0));
  for (let k = 0; k < 9; k++) { t.poser(cx + 10 + Math.floor(k / 3), v.torse + 6 + k, 'foulard', 3 - (k % 3 === 2 ? 1 : 0)); t.poser(cx + 11 + Math.floor(k / 3), v.torse + 6 + k, 'foulard', 2); }
  for (const s of [-1, 1]) for (let y = v.torse + 8; y < HD_H; y++) { const x = Math.round(cx + s * (15 + (y - v.torse - 8) * 0.12)); t.poser(x, y, 'cuir', y % 5 === 0 ? 1 : 3); t.poser(x + 1, y, 'cuir', 2); }
  const sommet = Math.round(v.cy - v.ry);
  t.forme('feutre', (x, y) => (y >= sommet - 11 && y <= sommet + 1 && Math.abs(x + 0.5 - cx + (sommet - y) * 0.2) < v.rx - 1 - (sommet + 1 - y) * 0.2 ? [(x + 0.5 - cx) / v.rx, -0.3, 0.8] : null), { motif: (x, y) => (y === sommet - 6 ? -0.9 : 0) });
  t.forme('feutre', (x, y) => (y >= sommet - 1 && y <= sommet + 3 && Math.abs(x + 0.5 - cx) < v.rx + 9 - Math.abs(y - sommet - 1) ? [0, (y - sommet - 1) * 0.5, 0.8] : null));
  // Une plume piquée dans le ruban, qui dépasse sur le côté
  for (let k = 0; k < 11; k++) { const px = cx + 5 + k, py = sommet - 4 - Math.round(k * 0.7); t.poser(px, py, 'plume', 4 + (k % 2)); t.poser(px, py + 1, 'plume', 3); if (k % 3 === 0) t.poser(px, py - 1, 'plume', 5); }
  for (let x = cx - v.rx + 1; x <= cx + 6; x++) t.poser(x, sommet - 3, 'cuir', 2);
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
  const cle = `busteHD_${personne.race}_${personne.nom}${personne.prestige ? "_noble" : ""}${personne.figurant ? '_' + personne.figurant : ''}_${expression}${etat.pose ? '_' + etat.pose : ''}${etat.cligne ? '_c' : ''}${etat.parle ? '_p' : ''}`;
  if (!scene.textures.exists(cle)) dessinerBusteHD(geneHD(personne), expression, etat).texture(scene, cle);
  return cle;
}

function oreillesElfe(t, v, cx, T = 0) {
  for (const sens of [-1, 1]) t.forme('peau', (x, y) => {
    const u = (x + 0.5 - cx + sens * T * 0.8) * sens - v.rx + 1.5; // vers l'extérieur (l'oreille du côté tourné se cache un peu)
    const w = y + 0.5 - (v.yeux + 5);             // vers le bas
    // Collée à la tête au niveau des yeux, elle monte en pointe jusqu'au-dessus des sourcils
    return u > 0 && u < 7.5 && w > -2 - u * 1.7 && w < 4 - u * 1.9 ? [sens * 0.6, -0.45, 0.65] : null;
  });
}

// --- Le joueur en pied (JeuneGoy), en HD ---
// Un jeune marchand : tunique, tablier de commerçant avec sa poche, ceinture, bottes.
// Il reprend les choix de la création (coiffure, couleurs, bouche, barbe à l'âge adulte).

const JOUEUR_L = 52 * 2;
const JOUEUR_H = 64 * 2;   // (le joueur est un corps en volume : voir corpsVueHD.js)

// La peau de la création, ramenée à la rampe réglée à la main la plus proche.
const PEAU_DE_CREATION = [0, 1, 3, 4];

function dessinerJoueurHD(ap, stade = 'petit', feminin = false, pas = 0, tenue = [], vue = 'troisQuarts') {
  // Le joueur passe par le moteur des corps en volume, avec son costume de marchand et ses
  // choix de création : coiffure, couleurs, bouche ; barbe à l'âge adulte, cheveux gris à l'ancien.
  const ancien = stade === 'ancien';
  const gene = {
    race: 'humain', feminin,
    peau: PEAU_DE_CREATION[ap.peau] ?? 1,
    cheveux: ancien ? 0xb8b8c0 : APPARENCE.cheveux[ap.cheveux][1],
    habit: APPARENCE.haut[ap.haut][1],
    bas: APPARENCE.bas[ap.bas][1],
    cape: 0x5a2a2a,
    yeux: APPARENCE.yeux[ap.yeux][1],
    coiffure: ['court', 'long', 'boucles', 'herisse', 'chauve'][ap.coiffure] || 'court',
    barbe: stade !== 'petit' && ap.barbe ? ['moustache', 'moustache', 'courte', 'pleine'][ap.barbe] : null,
    nom: 'JeuneGoy',
  };
  return dessinerCorpsVue(gene, 1, 'joueur', pas, null, vue, { tenue, bouche: ap.bouche ?? 0 });
}

// L'échelle d'affichage du joueur : ses anciens sprites faisaient 16 pixels de haut.
// Le joueur a 15 ans au début : un peu plus petit que les adultes (qui sont les plus grands),
// puis il grandit, et se tasse un peu avec l'âge.
const TAILLE_SELON_AGE = { petit: 0.86, adulte: 1, ancien: 0.95 };
function echelleJoueur(ancienneEchelle) {
  const stade = window.GAME && GAME.joueur ? stadeJoueur(GAME) : 'petit';
  return ancienneEchelle * 16 / JOUEUR_H * (TAILLE_SELON_AGE[stade] || 1);
}
