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
    if (!tex && window.diag && !(window.jeu && window.jeu.diagStable)) diag('texture ' + cle);
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
  // Les peuples de l'ombre et le panda (la peau est fixée par TRAITS_PEUPLES, dans corpsVueHD)
  gobelin: { peaux: [1], cheveux: [0x3a2a1a, 0x5a3a20], habits: [0x6a5030, 0x4a3a5a, 0x5a4a2a] },
  orc: { peaux: [1], cheveux: [0x1a1a1a, 0x3a2a1a, 0x6a1a1a], habits: [0x4a3a2a, 0x3a3a3a, 0x5a2a2a] },
  loupgarou: { peaux: [1], cheveux: [0x4a3a28], habits: [0x3a3030, 0x4a3a2a, 0x2a2a3a] },
  vampire: { peaux: [1], cheveux: [0x101014, 0x1a1a22], habits: [0x1a1a22, 0x2a1020, 0x101828] },
  momie: { peaux: [1], cheveux: [0x3a3a3a], habits: [0x6a5a40, 0x5a4a3a] },
  troll: { peaux: [1], cheveux: [0x3a3a3a], habits: [0x4a4a3a, 0x5a4a30] },
  panda: { peaux: [1], cheveux: [0x201c1c], habits: [0x8a3a20, 0xa85a20, 0x6a3a2a, 0x3a4a6a] },
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
    garde: !!p.garde,
    mentor: p.figurant === 'mentor',
    vieux: !!p.vieux,
    colporteur: p.figurant === 'colporteur',
    mendiant: p.figurant === 'mendiant',
    bande: p.costume === 'mainNoire' ? 'main' : p.costume === 'serpent' ? 'serpent' : null,   // (v0.61) les deux bandes, encapuchonnées
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
const LEGENDE_BOUCHE = { d: ['levres', 1], L: ['levres', 3], D: ['bouche', 0], w: ['bouche', 5], r: ['bouche', 3], p: ['peau', 2] };
const BOUCHES = {
  neutre: ['..........', '..pppppp..', '.dddddddd.', '..LLLLLL..'],
  content: ['.d......d.', '..dwwwwd..', '...dddd...', '...LLLL...'],
  inquiet: ['..........', '..dddddd..', '.dLLLLLLd.', 'd........d'],
  fache: ['..........', '..dddddd..', '.ddwwwwdd.', 'd..LLLL..d'],
  parle: ['..dddddd..', '.dDDDDDDd.', '.dDrrrrDd.', '..dddddd..'],
};

// Les proportions du visage, par peuple.
const VISAGES = {
  humain: { cy: 43, rx: 15.5, ry: 18.5, menton: 0.1, yeux: 41, nez: [2.8, 3.8], bouche: 56, cou: 6, torse: 66, sourcil: 2 },
  hobbit: { cy: 46, rx: 16.5, ry: 17, menton: 0, joues: 0.1, yeux: 45, nez: [3.6, 3.2], bouche: 59, cou: 6, torse: 68, sourcil: 2 },
  nain: { cy: 43, rx: 17, ry: 19, menton: 0, yeux: 43, nez: [5, 4.6], bouche: 60, cou: 0, torse: 66, sourcil: 3 },
  elfe: { cy: 42, rx: 14, ry: 19, menton: 0.22, yeux: 44, nez: [2.2, 3.8], bouche: 56, cou: 5, torse: 66, sourcil: 1, front: 3 },   // (front : la frange et le diadème restent haut, le front se voit)
  magicienne: { cy: 46, rx: 15, ry: 18, menton: 0.12, yeux: 45, nez: [2.6, 3.6], bouche: 59, cou: 5, torse: 68, sourcil: 1 },
  // (les peuples de l'ombre et le panda : en attendant leurs bustes propres)
  gobelin: { cy: 45, rx: 15, ry: 17, menton: 0.2, yeux: 44, nez: [2.6, 4], bouche: 58, cou: 5, torse: 67, sourcil: 2 },
  orc: { cy: 43, rx: 17, ry: 19, menton: 0, carre: true, yeux: 42, nez: [3.2, 3.8], bouche: 58, cou: 10, torse: 66, sourcil: 3 },
  loupgarou: { cy: 43, rx: 16.5, ry: 18.5, menton: 0.15, yeux: 40, nez: [2.8, 3.8], bouche: 58, cou: 6, torse: 66, sourcil: 2 },
  vampire: { cy: 43, rx: 14.5, ry: 19, menton: 0.18, yeux: 42, nez: [2.4, 3.8], bouche: 56, cou: 7, torse: 66, sourcil: 1 },
  momie: { cy: 44, rx: 15, ry: 18.5, menton: 0.1, yeux: 42, nez: [2.4, 3.4], bouche: 57, cou: 5, torse: 66, sourcil: 1 },
  troll: { cy: 40, rx: 21, ry: 22, menton: 0.05, yeux: 36, nez: [7, 7.5], bouche: 58, cou: 8, torse: 66, sourcil: 3 },
  panda: { cy: 44, rx: 20.5, ry: 18.5, menton: -0.05, yeux: 43, nez: [3, 3], bouche: 59, cou: 7, torse: 67, sourcil: 2 },
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
  let g = gene.colporteur ? { ...gene, habit: 0x6a5a40, cheveux: 0x4a3a2a, armure: false, barbe: 'courte', coiffure: 'court' } : gene;
  // Garrick : sa tignasse grise, sa barbe, sa cape verte
  // Garrick, le rôdeur : cheveux bruns, longs et ondulés, barbe de quelques jours, long manteau de cuir olive (voir torseHD)
  // (v0.58) le mendiant : cheveux et barbe gris en broussaille, vieux manteau rapiécé
  if (gene.mendiant) g = { ...g, race: 'humain', habit: 0x6a6252, cape: 0x4a4236, cheveux: 0x9a9a90, barbe: 'pleine', coiffure: 'long', armure: false, noble: false, peau: 1, vieux: true };
  if (gene.bande === 'main') g = { ...g, habit: 0x24222a, cape: 0x1a181e, coiffure: 'court', armure: false, noble: false };
  if (gene.bande === 'serpent') g = { ...g, habit: 0x4a6428, cape: 0x34501e, coiffure: 'court', armure: false, noble: false };
  if (gene.mentor) g = { ...g, race: 'humain', habit: 0x3e4a2a, cape: 0x3e4a2a, cheveux: 0x3a281a, barbe: 'courte', coiffure: 'long', armure: false, peau: 1, mentor: true };
  // Les peuples de l'ombre et le panda : leurs traits (peau, oreilles, museau, crocs...) sont dans
  // TRAITS_PEUPLES (corpsVueHD.js), les mêmes que pour les corps en pied
  let TR = (typeof TRAITS_PEUPLES !== 'undefined' && TRAITS_PEUPLES[g.race]) || {};
  if (TR.cheveux !== undefined) g = { ...g, coiffure: TR.cheveux === 'plaque' ? 'court' : 'chauve', armure: false, barbe: null };
  if (TR.poils) g = { ...g, cheveux: TR.poils };
  // Les aînés : les cheveux (ou les poils) gris, la fourrure qui blanchit
  if (g.vieux) { g = { ...g, cheveux: grisonner(g.cheveux) }; if (TR.fourrure || TR.poils) TR = { ...TR, peau: grisonner(TR.peau, 0.35) }; if (TR.bandelettes) TR = { ...TR, bandelettes: 0xb0a070 }; }
  const cx = 40;
  const v = g.race === 'elfe' && !g.feminin ? { ...VISAGES.elfe, menton: 0, carre: true } : VISAGES[g.race];
  // Un trois-quarts léger : le visage est tourné de quelques pixels vers la droite (l'oreille
  // gauche se dégage, la droite se cache derrière la joue), et chaque forme porte son ombre.
  const T = 3;
  t.relief = true;
  t.rampes.peau = TR.peau ? rampeVive(TR.peau) : PEAUX_VIVES[g.peau];
  t.rampes.cheveux = rampeVive(g.cheveux);
  t.rampes.habit = rampeVive(g.habit);
  t.rampes.cape = rampeVive(TR.cape || g.cape);
  t.rampes.iris = rampeVive(TR.yeux || g.yeux);
  // (les yeux de bête : le blanc prend la couleur de l'œil, l'iris devient une fente sombre)
  if (TR.fente) { t.rampes.oeil = rampeVive(TR.yeux); t.rampes.iris = rampe(0x140c08); }
  t.rampes.ivoire = rampe(0xe8dcb4); t.rampes.mousse = rampeVive(TR.mousse || 0x5a6a2a); t.rampes.griffe = rampe(0x2a2420);
  t.rampes.museau = rampeVive(TR.museau || 0x5a4030); t.rampes.noir = rampeVive(TR.taches || 0x201c1c); t.rampes.bande = rampe(TR.bandelettes || 0xd8cfae); t.rampes.truffe = rampe(0x1a1410);
  if (!t.rampes.blanc) t.rampes.blanc = rampeVive(0xf4f0ea);
  t.rampes.cuir = rampeVive(0x6a3f22); t.rampes.metal = rampeVive(0x7a8498); t.rampes.lin = rampeVive(0xd8ccb0);
  t.rampes.velours = rampe(0x4a1a3a); t.rampes.plume = rampe(0xf0e8d0); t.rampes.fourrure = rampe(0xe8e0d0);
  t.rampes.lin = rampe(0xd8ccb0);
  t.rampes.levres = TR.levres ? rampeVive(TR.levres) : levresPour(g.peau, g.feminin);
  t.rampes.barbe = t.rampes.cheveux;
  // Garrick : le cuir terne et usé de son long manteau olive, et le bois sombre de sa pipe
  if (g.mentor) { t.rampes.habit = rampe(0x4e5636); t.rampes.cape = rampe(0x4e5636); t.rampes.pipe = rampe(0x5a3a22); t.rampes.fumee = rampe(0xc8c8cc); }
  const oreilles = TR.oreilles !== undefined ? TR.oreilles : g.race === 'elfe' ? 'elfe' : 'rondes-humaines';

  // 1. Les cheveux longs, derrière tout le reste (la tignasse hirsute du troll aussi)
  if (TR.cheveux === 'hirsute') t.forme('cheveux', (x, y) => {
    const nx = (x + 0.5 - cx) / (v.rx + 7), ny = (y + 0.5 - v.cy) / (v.ry + 5);
    if (Math.abs(nx) > 1 || y < v.cy - v.ry - 5) return null;
    if (y < v.cy && nx * nx + ny * ny > 1) return null;
    return y < v.torse + 12 - hachage(x, 0, 61) * 9 ? [nx, Math.min(0.9, ny), Math.sqrt(Math.max(0.05, 1 - nx * nx))] : null;
  }, { decalage: -0.6, motif: MECHES });
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

  // (v0.61) La cape de la Main Noire, derrière le dos : on la devine de chaque côté du corps
  if (g.bande === 'main') capeDosBuste(t, g, v, cx);

  // 2. Le torse, selon le peuple
  torseHD(t, g, v, cx);

  // 3. Le cou, les oreilles, la tête
  // (v0.57) le cou s'évase vers le bas pour entrer dans le col (trapèze des muscles), plus sombre
  // sous le menton et au ras du vêtement
  if (v.cou) t.forme('peau', (x, y) => {
    if (y < v.cy + v.ry - 6 || y > v.torse + 2) return null;
    const evase = Math.max(0, y - (v.torse - 7)) * 0.7, demi = v.cou + evase;
    const nx = (x + 0.5 - cx) / demi;
    return Math.abs(nx) < 1 ? [nx * 0.8, 0.3 + (y > v.torse - 4 ? 0.3 : 0), 0.6] : null;
  }, { decalage: -0.7 });
  if (oreilles === 'grandes') {
    // Les grandes oreilles des gobelins : longues, pointues, à l'horizontale
    for (const sens of [-1, 1]) t.forme('peau', (x, y) => { const u = (x + 0.5 - cx + sens * T * 0.8) * sens - v.rx + 2, w = y + 0.5 - (v.yeux + 4); return u > 0 && u < 14 && Math.abs(w + u * 0.15) < 4.2 - u * 0.28 ? [sens * 0.7, -0.3, 0.6] : null; });
  } else if (oreilles === 'rondes-humaines') {
    const o = g.race === 'hobbit' ? [4, 5.6] : [3.2, 5.2];
    t.forme('peau', ellipsoide(cx - (v.rx + 0.5) - T * 0.7, v.yeux + 6, o[0], o[1]));          // l'oreille dégagée, derrière
    t.forme('peau', ellipsoide(cx + (v.rx + 0.5) - T * 1.6, v.yeux + 6, o[0] * 0.8, o[1] * 0.9)); // l'autre, presque cachée par la joue
  }
  t.forme('peau', tete(cx, v));

  // 4. Le visage : sourcils, yeux, nez, joues, bouche
  const ey = v.yeux;
  const fx = cx + T;   // le milieu du visage, tourné
  t.relief = false;    // (les traits du visage sont des dessins à plat : pas d'ombre portée)
  if (TR.taches) { t.relief = true; t.forme('noir', ellipsoide(fx - 9, ey + 1, 8.5, 6.5), { decalage: 0.1, bord: false }); t.forme('noir', ellipsoide(fx + 8, ey + 1, 7.5, 6.5), { decalage: 0.1, bord: false }); t.relief = false; }
  if (TR.verrues) { t.relief = true; for (const [i, j] of [[-11, 9], [10, -2], [6, 12], [-6, -8]]) t.forme('peau', ellipsoide(fx + i, ey + j, 1.6, 1.4), { decalage: -0.6, bord: false }); t.relief = false; }
  if (g.vieux && !TR.bandelettes) {
    // Les rides : le front plissé, les pattes d'oie, les cernes, les plis du nez à la bouche
    const ride = (x, y) => { if (t.mat(x, y) === 'peau' || t.mat(x, y) === 'museau') t.poser(x, y, t.mat(x, y), 1); };
    for (const dy of [-8, -11]) for (let i = -7; i <= 7; i++) if ((i + dy) % 5) ride(fx + i, ey + dy + (Math.abs(i) > 4 ? 1 : 0));
    for (const [sx, sens] of [[fx - 16, -1], [fx + 15, 1]]) for (const j of [-1, 1, 3]) { ride(sx, ey + j); ride(sx + sens, ey + j + (j < 1 ? -1 : j > 1 ? 1 : 0)); }
    for (let i = -11; i <= -6; i++) ride(fx + i, ey + 4);
    for (let i = 5; i <= 10; i++) ride(fx + i, ey + 4);
    if (!TR.museau) for (let j = 0; j < 7; j++) { ride(fx - 5 - Math.round(j * 0.35), ey + 8 + j); ride(fx + 5 + Math.round(j * 0.35), ey + 8 + j); }
  }
  const oeil = YEUX[cligne ? 'cligne' : expression];
  t.dessin(fx - 14, ey - 3, oeil, LEGENDE_OEIL);
  t.dessin(fx + 3, ey - 3, oeil, LEGENDE_OEIL, true);
  if (g.feminin && !cligne) {
    // Les cils, au coin extérieur
    const ligne = oeil.findIndex(l => l.includes('l'));
    t.poser(fx - 14, ey - 3 + ligne, 'cheveux', 0); t.poser(fx - 15, ey - 4 + ligne, 'cheveux', 0);
    t.poser(fx + 13, ey - 3 + ligne, 'cheveux', 0); t.poser(fx + 14, ey - 4 + ligne, 'cheveux', 0);
  }
  if (TR.museau) {
    // Le museau : une bosse large qui avance sous les yeux, la truffe sombre au bout
    t.relief = true;
    const my = ey + (g.race === 'panda' ? 9 : 11), mr = g.race === 'panda' ? [9, 6] : [9, 8];
    t.forme('museau', ellipsoide(fx, my, mr[0], mr[1]), { decalage: 0.15 });
    t.forme('truffe', ellipsoide(fx + 0.5, my - 2.5, 3.2, 2.2), { ombre: false, bord: false }); t.poser(fx - 1, my - 4, 'blanc', 3);
    t.relief = false;
  } else if (TR.nez === 0) { /* (pas de nez) */ }
  else if (TR.nezBas) {
    // Le nez du troll : immense, qui pend jusqu'au-dessus de la bouche, avec ses narines
    t.relief = true;
    t.forme('peau', (x, y) => { const u = (y + 0.5 - ey - 1.5) / 18; if (u < 0 || u > 1) return null; const demi = 4 + u * u * 6; const nx = (x + 0.5 - fx - u * 2.5) / demi; return Math.abs(nx) <= 1 ? [0, 0, 1] : null; }, { decalage: -1, bord: false, ombre: false });   // (l'ombre du nez)
    t.forme('peau', (x, y) => { const u = (y + 0.5 - ey) / 18; if (u < 0 || u > 1) return null; const demi = 3 + u * u * 5.5; const nx = (x + 0.5 - fx - u * 1.5) / demi; return Math.abs(nx) <= 1 ? [nx * 0.8, u - 0.3, Math.sqrt(1 - nx * nx)] : null; }, { decalage: 0.55 });
    t.relief = false;
    for (const sx of [fx - 4, fx + 5]) { t.poser(sx, ey + 17, 'peau', 0); t.poser(sx + 1, ey + 17, 'peau', 1); }
  }
  else if (g.race === 'nain' || TR.nez >= 2) t.forme('peau', ellipsoide(fx - 0.5, ey + 6 + v.nez[1] * 0.6, v.nez[0], v.nez[1]), { decalage: 0.3 });
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
  const bouche = BOUCHES[parle ? 'parle' : expression];
  // (les elfes femmes gardent une bouche discrète : pas de lèvre du bas)
  if (g.race === 'troll' && g.vieux) {
    // Le vieux troll : une bouche fermée, un long trait un peu tombant sous le nez, les lèvres usées
    for (let i = -8; i <= 8; i++) { const y = v.bouche + 2 + Math.round((i * i) / 64 * 1.5); t.poser(fx + 2 + i, y, 'peau', 0); if (Math.abs(i) < 7) t.poser(fx + 2 + i, y + 1, 'peau', 3); }
  } else t.dessin(fx - 5, v.bouche, g.race === 'elfe' && g.feminin ? bouche.map(l => l.replace(/L/g, '.')) : bouche, LEGENDE_BOUCHE);
  if (g.race === 'troll' && !g.vieux) for (let i = -10; i <= 10; i++) { const y = v.bouche + 1 + Math.round((1 - (i * i) / 100) * (expression === 'fache' ? -2 : 3)); t.poser(fx + i, y, 'levres', 0); if (Math.abs(i) < 9 && expression !== 'fache') t.poser(fx + i, y - 1, 'blanc', Math.abs(i) % 3 ? 4 : 2); }
  // Les défenses (orcs, trolls), les canines (vampires), les crocs (loups-garous), les dents (gobelins)
  if (TR.dents === 'defenses') for (const sens of [-1, 1]) { const x0 = fx + sens * 7 - (sens > 0 ? 0 : 1), y0 = v.bouche + 5; for (let j = 0; j < 6; j++) { const dx = Math.round(sens * j * j / 14); t.poser(x0 + dx, y0 - j, 'ivoire', j > 3 ? 5 : 3); if (j < 4) t.poser(x0 + dx + sens, y0 - j, 'ivoire', 2); } }
  else if (TR.dents === 'canines') {
    // De longues canines qui dépassent de la lèvre, larges à la racine, pointues au bout ; chez
    // certains vampires (toujours les mêmes), une goutte de sang perle au bout d'une canine
    let h = 0;
    for (const ch of g.nom || '') h = (h * 31 + ch.charCodeAt(0)) % 9973;
    const sang = h % 5 < 2, laquelle = h % 2;
    t.rampes.sang = rampeVive(0xb81818);
    [fx - 4, fx + 3].forEach((sx, i) => {
      const large = j => j < 3;
      // (un liseré sombre autour : sinon le blanc se perd sur la peau pâle)
      for (let j = 0; j < 8; j++) for (const dx of [-2, -1, 1, 2]) {
        const x = sx + dx, dedans = dx === 0 || (large(j) && dx === (i ? 1 : -1));
        const bord = j === 7 ? Math.abs(dx) <= 1 && !(large(j) && dx === (i ? 1 : -1)) : (large(j) ? dx === (i ? 2 : -2) || dx === (i ? -1 : 1) : Math.abs(dx) === 1);
        if (!dedans && bord && t.mat(x, v.bouche + 1 + j) === 'peau') t.poser(x, v.bouche + 1 + j, 'levres', 0);
      }
      for (let j = 0; j < 7; j++) { t.poser(sx, v.bouche + 1 + j, 'blanc', j > 4 ? 5 : j > 1 ? 4 : 3); if (large(j)) t.poser(sx + (i ? 1 : -1), v.bouche + 1 + j, 'blanc', 2); }
      if (sang && i === laquelle) { t.poser(sx, v.bouche + 6, 'sang', 3); t.poser(sx, v.bouche + 7, 'sang', 4); t.poser(sx, v.bouche + 9, 'sang', 3); t.poser(sx, v.bouche + 10, 'sang', 2); }
    });
  }
  else if (TR.dents === 'crocs') for (const sx of [fx - 6, fx + 5]) for (let j = 0; j < 5; j++) t.poser(sx, ey + 13 + j, 'blanc', j > 2 ? 5 : 3);
  else if (TR.dents === 'gobelin') for (let j = -3; j <= 3; j++) { t.poser(fx + j * 2, v.bouche + 3, 'blanc', j % 2 ? 4 : 2); t.poser(fx + j * 2, v.bouche + 4, 'blanc', j % 2 ? 3 : 1); }
  t.relief = true;

  // 5. La barbe
  if (g.barbe) barbeHD(t, g, v, fx);
  if (g.mentor) {
    // La pipe au coin de la bouche : le tuyau qui descend en biais, le gros fourneau qui remonte,
    // la braise, et un filet de fumée qui monte en ondulant (bois clair et liseré sombre : elle se
    // détache de la barbe)
    t.rampes.pipe = rampe(0x8a5a32);
    const px = fx + 3, py = v.bouche + 2;
    const tuyau = (x, y) => { const u = x + 0.5 - px; return u >= 0 && u <= 8 && Math.abs(y + 0.5 - (py + u * 0.5)) < 1.1; };
    const fourneau = (x, y) => x >= px + 7 && x <= px + 12 && y >= py + 1 && y <= py + 8 && !(y >= py + 6 && (x === px + 7 || x === px + 12));
    for (let y = py - 3; y < py + 12; y++) for (let x = px - 1; x < px + 14; x++) {
      const dedans = tuyau(x, y) || fourneau(x, y);
      if (dedans) t.poser(x, y, 'pipe', fourneau(x, y) ? (x < px + 9 ? 4 : x > px + 10 ? 2 : 3) : 3);
      else if (tuyau(x - 1, y) || tuyau(x + 1, y) || tuyau(x, y - 1) || tuyau(x, y + 1) || fourneau(x - 1, y) || fourneau(x + 1, y) || fourneau(x, y + 1) || fourneau(x, y - 1)) t.poser(x, y, 'pipe', 0);
    }
    for (let x = px + 8; x <= px + 11; x++) t.poser(x, py + 1, x % 2 ? 'levres' : 'pipe', x % 2 ? 5 : 1);   // la braise
    for (let j = 0; j < 11; j++) { const x = px + 10 + Math.round(Math.sin(j * 0.7) * 1.8), y = py - 1 - j; if (j % 4 !== 3) t.poser(x, y, 'fumee', 5 - Math.floor(j / 4)); }
  }

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
  if (TR.cheveux === 'crete') t.forme('cheveux', (x, y) => { const h = v.cy - v.ry + 2 - y; return h >= -2 && h < 12 && Math.abs(x + 0.5 - cx - 1) < 4 - h * 0.15 ? [(x + 0.5 - cx) / 4, -0.5, 0.7] : null; }, { motif: (x, y) => (x % 2 ? 0.5 : -0.6) });
  // Les oreilles des elfes percent à travers les cheveux, et montent en pointe
  if (oreilles === 'elfe') oreillesElfe(t, v, cx, T);
  else if (oreilles === 'pointues') oreillesElfe(t, { ...v, yeux: v.yeux + 1 }, cx, T, 0.75);
  else if (oreilles === 'loup') for (const sens of [-1, 1]) { const ox = cx + sens * (v.rx - 4) - T * 0.5, oy = v.cy - v.ry + 3; t.forme('peau', (x, y) => { const h = (oy - y); return h >= -4 && h < 13 && Math.abs(x + 0.5 - ox - sens * h * 0.25) < 6 - h * 0.42 ? [sens * 0.5, -0.4, 0.7] : null; }, { decalage: 0.1, motif: MECHES }); t.forme('museau', (x, y) => { const h = (oy - y); return h >= -1 && h < 7 && Math.abs(x + 0.5 - ox - sens * h * 0.25) < 2.6 - h * 0.3 ? [0, 0, 1] : null; }, { bord: false, ombre: false, decalage: -0.3 }); }
  else if (oreilles === 'rondes') for (const sens of [-1, 1]) t.forme('noir', ellipsoide(cx + sens * (v.rx - 2) - T * 0.5, v.cy - v.ry + 2, 6.5, 6), { decalage: 0.1 });
  if (TR.touffes) for (const sens of [-1, 1]) t.forme('peau', (x, y) => { const d = sens * (x + 0.5 - cx + T * 0.5) - v.rx + 3, h = y + 0.5 - (ey + 9); return d > -3 && d < 8 && Math.abs(h - d * 0.35) < 5 - d * 0.6 ? [sens, 0.2, 0.6] : null; }, { motif: MECHES });
  if (TR.collerette) t.forme('peau', (x, y) => { const nx = (x + 0.5 - cx) / 26, ny = (y + 0.5 - v.torse - 3) / 8; return nx * nx + ny * ny <= 1 && y > v.bouche + 4 - hachage(x, 3, 11) * 3 ? [nx * 0.6, ny * 0.4, 0.8] : null; }, { decalage: -0.1, motif: MECHES });
  if (TR.mousse) { t.relief = true; for (const [i, j, r] of [[-14, -16, 3.5], [11, -18, 3], [-22, 8, 3], [20, 26, 4], [-18, 30, 3.5]]) t.forme('mousse', ellipsoide(cx + i, v.cy + j, r, r * 0.7), { motif: (x, y) => (hachage(x, y, 5) > 0.6 ? 0.6 : 0) }); }

  // 7. Les sourcils, par-dessus tout (ils débordent du casque des nains)
  const sourcil = SOURCILS[expression];
  // (v0.57) des cheveux très clairs (blancs, blonds platine) donnent des sourcils presque invisibles,
  // qui ressemblaient à des mèches en travers du visage : on les fonce de deux tons
  const lum = c => ((c >> 16 & 255) * 0.3 + (c >> 8 & 255) * 0.59 + (c & 255) * 0.11) / 255;
  const sourcilClair = lum(g.cheveux) > 0.68 && !g.vieux ? 2 : 0;
  for (const sens of [-1, 1]) for (let k = 0; k < 11; k++) {
    const x = sens < 0 ? fx - 14 + k : fx + 13 - k;
    const y = ey - 6 + sourcil[k];
    for (let e = 0; e < v.sourcil; e++) t.poser(x, y + e, 'cheveux', Math.max(0, (e === 0 ? 4 : e === v.sourcil - 1 ? 1 : 3) - sourcilClair));
  }

  // (v0.61) La capuche des deux bandes, par-dessus les cheveux et les sourcils
  if (g.bande) capucheBuste(t, g, v, fx, ey);

  // 8. Les bras et les mains : la pose, selon l'humeur et le peuple
  brasBuste(t, g, v, cx, pose || poseBuste(g, expression));
  if (g.bande) plisBuste(t, g, v, cx);
  if (g.bande === 'main') epaulettesBuste(t, g, v, cx);

  // 9. Les peaux particulières : la fourrure (poils en hachures), les bandelettes de la momie
  if (TR.fourrure) for (let y = 0; y < HD_H; y++) for (let x = 0; x < HD_L; x++) if (t.mat(x, y) === 'peau' || t.mat(x, y) === 'noir') {
    if (g.race === 'troll' && y < v.bouche + 6 && Math.abs(x + 0.5 - fx) < v.rx * 0.85) continue;   // (le visage du troll reste lisible)
    const h = hachage(x, y, TR.fourrure);
    if (h > 0.8) t.poser(x, y, t.mat(x, y), Math.max(0, t.k[y * t.l + x] - 1)); else if (h < 0.08) t.poser(x, y, t.mat(x, y), Math.min(5, t.k[y * t.l + x] + 1));
  }
  if (TR.bandelettes) {
    // La momie : tout est enroulé de bandelettes (vêtements compris), sauf une fente sombre sur les yeux
    const enveloppe = ['peau', 'habit', 'cuir', 'lin', 'metal', 'levres', 'cape', 'cheveux', 'bouche', 'oeil', 'iris'];
    for (let y = 0; y < HD_H; y++) for (let x = 0; x < HD_L; x++) {
      const m = t.mat(x, y);
      if (!enveloppe.includes(m)) continue;
      if ([fx - 8.5, fx + 8.5].some(ox => ((x + 0.5 - ox) / 4.5) ** 2 + ((y + 0.5 - ey) / 2.8) ** 2 <= 1)) { t.poser(x, y, 'noir', 0); continue; }   // (des orbites noires et profondes)
      const pente = y < v.torse ? -0.3 : 0.42;
      const b = ((y + x * pente) % 4 + 4) % 4;
      const ton = t.k[y * t.l + x];
      t.poser(x, y, 'bande', b < 0.7 ? 0 : b > 3.3 ? Math.max(1, ton - 1) : Math.min(5, Math.max(2, ton)));
    }
    // les pupilles jaunâtres, qui luisent au fond des orbites
    for (const ox of [fx - 9, fx + 8]) { t.poser(ox, ey, 'iris', 5); t.poser(ox + 1, ey, 'iris', 4); t.poser(ox, ey - 1, 'iris', 4); t.poser(ox + 1, ey - 1, 'iris', 3); t.poser(ox, ey + 1, 'iris', 2); t.poser(ox + 1, ey + 1, 'iris', 1); }
  }
  if (TR.touffu) {
    const ajouts = [];
    for (let y = 1; y < HD_H - 1; y++) for (let x = 1; x < HD_L - 1; x++) {
      const m = t.mat(x, y);
      if (m !== 'peau' && m !== 'noir' && m !== 'cheveux') continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, -1]]) if (!t.mat(x + dx, y + dy) && hachage(x, y, 71) > 0.5) for (let j = 1; j <= Math.round(TR.touffu * 1.5 * hachage(y, x, 13)); j++) ajouts.push([x + dx * j, y + dy * j, m, t.k[y * t.l + x]]);
    }
    for (const [x, y, m, ton] of ajouts) if (t.dans(x, y) && !t.mat(x, y)) t.poser(x, y, m, ton);
  }
  if (g.vieux && TR.bandelettes) moisirBandelettes(t);

  t.contour();
  // (la vieille momie : une toile d'araignée tendue entre la tête et l'épaule)
  if (g.vieux && TR.bandelettes) toileAraignee(t, cx - v.rx + 3, v.torse + 1, 17, 182, 266);
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
  const largeur = LARGEURS_BUSTE[g.race] || 20;
  const manche = g.race === 'nain' ? 'metal' : g.race === 'hobbit' ? 'lin' : g.race === 'humain' && g.armure ? 'cuir' : 'habit';
  const ep = g.race === 'nain' || g.race === 'troll' || g.race === 'orc' ? 5.2 : 4.4;
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

const LARGEURS_BUSTE = { nain: 24, hobbit: 21, humain: 20, elfe: 18, magicienne: 19, gobelin: 18, orc: 25, loupgarou: 23, vampire: 19, momie: 20, troll: 28, panda: 30 };
function torseHD(t, g, v, cx) {
  const largeur = LARGEURS_BUSTE[g.race] || 20;
  const corps = corpsRond(cx, v.torse, largeur);
  if (g.garde) {
    // Le garde de la Confrérie : la cotte de mailles, le tabard bleu, le soleil d'or
    t.rampes.tabard = rampeVive(0x2a4a8a);
    t.forme('metal', corps, { decalage: -0.6, motif: (x, y) => ((x + y) % 2 ? 0.4 : -0.4) });
    t.forme('tabard', (x, y) => (corps(x, y) && y >= v.torse + 4 && Math.abs(x + 0.5 - cx) < 13 ? corps(x, y) : null), { decalage: 0.1 });
    t.forme('or', ellipsoide(cx, v.torse + 18, 4, 4), { decalage: 0.3 });
    for (const [dx, dy] of [[0, -7], [0, 7], [-7, 0], [7, 0], [-5, -5], [5, -5], [-5, 5], [5, 5]]) { t.poser(cx + dx, v.torse + 18 + dy, 'or', 4); t.poser(cx + Math.round(dx * 0.8), v.torse + 18 + Math.round(dy * 0.8), 'or', 3); }
    for (let x = cx - 12; x <= cx + 12; x++) t.poser(x, v.torse + 4, 'or', 3);
    epaulieres(t, cx, largeur - 6, v.torse + 8);
    return;
  }
  if (g.bande === 'main') {
    // La Main Noire : la robe noire, ses plis, une chaîne de fer en travers
    t.forme('habit', corps, { decalage: -0.6, motif: (x, y) => ((x * 5 + Math.floor(y / 3)) % 9 === 0 ? -0.8 : hachage(x, y, 37) > 0.92 ? -0.5 : 0) });
    for (let k = 0; k < 40; k++) { const x = cx - 20 + k, y = v.torse + 26 - Math.round(k * 0.35); if (corps(x, y)) { t.poser(x, y, 'metal', k % 2 ? 4 : 2); t.poser(x, y + 1, 'metal', 1); } }
    return;
  }
  if (g.bande === 'serpent') {
    // Le Serpent : la tunique verte, le gilet de cuir brun ouvert, les sangles bouclées d'argent, le baudrier
    t.rampes.gilet = rampeVive(0x6a4426); t.rampes.argent = rampeVive(0xc8ccd4); t.rampes.noirCuir = rampe(0x26222a);
    t.forme('habit', corps, { decalage: -0.3 });
    const ouvert = y => Math.max(3, 9 - (y - v.torse) * 0.25);
    t.forme('gilet', (x, y) => { const n = corps(x, y); return n && y >= v.torse + 3 && Math.abs(x + 0.5 - cx) >= ouvert(y) ? n : null; }, { decalage: -0.2, motif: (x, y) => (hachage(x, y, 61) > 0.85 ? -0.6 : 0) });
    for (const dy of [12, 19, 26]) { const y = v.torse + dy, o = ouvert(y) + 2; for (let x = Math.round(cx - o); x <= cx + o; x++) { t.poser(x, y, 'noirCuir', 2); t.poser(x, y + 1, 'noirCuir', 1); } t.dessin(cx + 1, y - 1, ['oo', 'oo'], { o: ['argent', 4] }); }
    t.forme('noirCuir', (x, y) => (y >= v.torse + 2 && Math.abs((x + 0.5 - cx - 14) + (y - v.torse - 2) * 0.95) < 2.2 && corps(x, y) ? [0.2, 0.1, 0.95] : null), { decalage: -0.2 });
    t.dessin(cx - 8, v.torse + 23, ['ooo', 'o.o', 'ooo'], { o: ['argent', 4] });
    return;
  }
  if (g.mentor) {
    // Garrick, le rôdeur : la chemise bordeaux au col ouvert, le justaucorps de cuir sombre lacé,
    // le long manteau de cuir olive aux grands revers, le baudrier de l'épée, et au cou un petit
    // pendentif d'argent en fleur de pommier (l'emblème des Bannis... que personne ne remarque)
    t.rampes.chemise = rampeVive(0x5a1a20); t.rampes.justau = rampeVive(0x2e2420);
    t.forme('chemise', corps, { decalage: -0.3 });
    const ouvert = (y, o) => Math.max(0, o - (y - v.torse) * 0.22);
    t.forme('justau', (x, y) => { const n = corps(x, y); return n && y >= v.torse + 2 && Math.abs(x + 0.5 - cx) >= ouvert(y, 6) ? n : null; }, { decalage: -0.4, motif: (x, y) => (hachage(x, y, 41) > 0.9 ? -0.8 : 0) });
    for (let y = v.torse + 4; y < v.torse + 22; y += 3) { const o = ouvert(y, 6) + 1; t.poser(Math.round(cx - o), y, 'lin', 3); t.poser(Math.round(cx + o), y, 'lin', 3); t.poser(Math.round(cx - o) + 1, y + 1, 'lin', 2); t.poser(Math.round(cx + o) - 1, y + 1, 'lin', 2); }
    // le manteau : deux pans de chaque côté, les revers relevés autour du cou
    t.forme('habit', (x, y) => { const n = corps(x, y); if (!n || y < v.torse - 2) return null; const d = Math.abs(x + 0.5 - cx); return d > 13 + (y - v.torse) * 0.05 ? n : null; }, { decalage: -0.2, motif: (x, y) => ((x * 3 + y * 7) % 17 === 0 ? -0.7 : (x + y) % 11 === 0 ? 0.4 : 0) });
    for (const sens of [-1, 1]) t.forme('habit', (x, y) => { const u = (x + 0.5 - cx) * sens, w = y + 0.5 - v.torse; return w > -6 && w < 16 && u > 9 + w * 0.15 && u < 16 + w * 0.05 - Math.max(0, -w) * 0.6 ? [sens * 0.7, -0.4, 0.6] : null; }, { decalage: 0.5 });
    // le baudrier, de l'épaule droite à la hanche gauche, et sa boucle
    t.forme('cuir', (x, y) => (y >= v.torse + 2 && Math.abs((x + 0.5 - cx - 14) + (y - v.torse - 2) * 0.95) < 2.2 && corps(x, y) ? [0.2, 0.1, 0.95] : null), { decalage: -0.6 });
    t.dessin(cx - 6, v.torse + 19, ['ooo', 'o.o', 'ooo'], { o: ['metal', 4] });
    // le pendentif en fleur de pommier, sur un cordon de cuir
    for (let k = -3; k <= 3; k++) t.poser(cx + k, v.torse + 1 + Math.round(k * k * 0.25), 'cuir', 1);
    t.dessin(cx - 1, v.torse + 4, ['.o.', 'oCo', '.o.'], { o: ['metal', 5], C: ['levres', 4] });
  } else if (g.race === 'nain') {
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
    // (v0.57) Les orcs et les trolls : un épais col de fourrure autour du cou (plus de col lacé, qui
    // leur faisait un cou trop fin) ; les vampires : un haut col dressé et un jabot de dentelle
    if (g.race === 'orc' || g.race === 'troll') {
      t.rampes.colFourrure = rampe(g.race === 'troll' ? 0x5a5248 : 0x5a4636);
      t.forme('colFourrure', ellipsoide(cx, v.torse, g.race === 'troll' ? 21 : 18, 9), { decalage: -0.2, motif: (x, y) => ((x * 3 + y * 5) % 7 === 0 ? -0.9 : (x + y) % 5 === 0 ? 0.6 : 0) });
      for (let x = Math.round(cx - 19); x <= cx + 19; x += 2) if (hachage(x, 1, 77) > 0.4 && t.mat(x, v.torse - 2) === 'colFourrure') t.poser(x, v.torse - 6 + Math.round(hachage(x, 2, 78) * 2), 'colFourrure', 3);
    } else if (g.race === 'vampire') {
      for (const sens of [-1, 1]) t.forme('cape', (x, y) => {
        const u = (x + 0.5 - cx) * sens;
        if (y < v.torse - 14 || y > v.torse + 6) return null;
        const interieur = 5 + (v.torse + 6 - y) * 0.15, exterieur = 13 + (v.torse + 6 - y) * 0.45;
        return u >= interieur && u <= exterieur ? [sens * 0.7, -0.3, 0.6] : null;
      }, { decalage: -0.2 });
      for (const sens of [-1, 1]) for (let y = v.torse - 12; y < v.torse + 5; y++) t.poser(Math.round(cx + sens * (5.5 + (v.torse + 6 - y) * 0.15)), y, 'levres', 1);   // la doublure rouge sang
      t.forme('lin', (x, y) => (y >= v.torse - 1 && y <= v.torse + 12 && Math.abs(x + 0.5 - cx) < 4.5 - (y - v.torse) * 0.25 ? [0, 0.1, 0.9] : null), { decalage: 0.3, motif: (x, y) => (y % 3 === 0 ? -0.8 : 0) });
    } else
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
  const haut = v.cy - v.ry - 4, frange = v.yeux - 8 - (v.front || 0);
  t.forme('cheveux', (x, y) => {
    // Le volume des cheveux dépasse du crâne, avec un bord en mèches
    const gonfle = 3 + Math.sin(x * 1.3) * 0.8;
    const nx = (x + 0.5 - cx) / (v.rx + 1.8), ny = (y + 0.5 - v.cy) / (v.ry + (y < v.cy ? gonfle : 1.5));
    if (nx * nx + ny * ny > 1 || y < haut) return null;
    // La frange descend en pointes sur le front ; les côtés couvrent les tempes
    const pointe = frange - 2 + Math.abs(Math.sin((x - cx) * 0.9)) * 3;
    // (le visage est tourné vers la droite : la tempe de ce côté recule, pour ne pas couvrir l'œil)
    const dx = x + 0.5 - cx;
    const tempe = (dx < -(v.rx - 3.5) || dx > v.rx - 0.5) && y < v.yeux + 2;
    if (y > pointe && !tempe) return null;
    return [nx, ny, Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny))];
  }, { motif: MECHES });
  if (g.coiffure === 'herisse') for (let k = -10; k <= 10; k += 4) t.forme('cheveux', (x, y) => (y >= haut - 4 && y < haut + 2 && Math.abs(x + 0.5 - cx - k) < (y - haut + 4) * 0.4 ? [0, -0.6, 0.7] : null));
  if (g.coiffure === 'chignon') t.forme('cheveux', ellipsoide(cx, haut - 1, 6, 4.5));
  if (g.coiffure === 'queue') t.forme('cheveux', ellipsoide(cx + v.rx + 2, v.cy + 4, 3, 9), { motif: MECHES });
}

function coiffeHD(t, g, v, cx) {
  if (g.garde && g.race !== 'magicienne' && g.race !== 'nain') {
    // Le casque de la garde : une calotte de fer, un nasal (sauf le panda), un cimier bleu pour l'elfe
    const haut = v.cy - v.ry - 2, bas = v.yeux - 7;
    t.forme('metal', (x, y) => (y >= haut && y <= bas && ((x + 0.5 - cx) / (v.rx + 2)) ** 2 + ((y + 0.5 - bas) / (bas - haut + 1)) ** 2 <= 1 ? [(x + 0.5 - cx) / (v.rx + 2), -0.5, 0.8] : null), { decalage: 0.3 });
    for (let x = Math.round(cx - v.rx - 2); x <= cx + v.rx + 2; x++) { t.poser(x, bas, 'metal', 1); t.poser(x, bas - 1, 'metal', 4); }
    if (g.race !== 'panda') for (let y = bas; y <= v.yeux + 5; y++) { t.poser(cx + 3, y, 'metal', 4); t.poser(cx + 4, y, 'metal', 2); }
    if (g.race === 'elfe') { t.rampes.cimier = rampeVive(0x3a6ad8); for (let k = 0; k < 16; k++) { t.poser(cx - 6 + k, haut - 2 - Math.round(Math.sin(k / 15 * Math.PI) * 6), 'cimier', 4); t.poser(cx - 6 + k, haut - 1 - Math.round(Math.sin(k / 15 * Math.PI) * 6), 'cimier', 2); } }
    return;
  }
  if (g.race === 'elfe') {
    // Le diadème d'argent avec sa pierre
    const y = v.yeux - 9 - (v.front || 0);
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

// (v0.61) La capuche des deux bandes. La Main Noire : profonde et pointue, le visage dans l'ombre
// (seuls les yeux luisent). Le Serpent : la capuche verte des archers, au bord replié, fermée par
// une émeraude.
function capucheBuste(t, g, v, cx, ey) {
  const main = g.bande === 'main';
  // (des teintes sourdes : pas de vert pomme ni de violet, des étoffes sérieuses)
  if (main) { t.rampes.cape = rampe(0x2c2b30); t.rampes.habit = rampe(0x262629); } else { t.rampes.cape = rampe(0x3a5620); t.rampes.habit = rampe(0x4a6428); }
  // L'ouverture : un ovale un peu plus petit que le visage (le bord de la capuche le recouvre), qui
  // s'arrête au front (au ras des sourcils pour la Main Noire) et sous le menton
  const ox = cx + 1, oy = v.cy + 4, orx = v.rx - 2.5, ory = v.ry - 0.5;
  const haut = ey - (main ? 5 : 8), bas = v.bouche + 7;
  const arche = x => haut + ((x + 0.5 - ox) / orx) ** 2 * 5;   // (le bord du front s'arrondit vers les tempes)
  const dans = (x, y) => y > arche(x) && y < bas && ((x + 0.5 - ox) / orx) ** 2 + ((y + 0.5 - oy) / ory) ** 2 <= 1;
  const anneau = (x, y) => (Math.sqrt(((x + 0.5 - ox) / orx) ** 2 + ((y + 0.5 - oy) / ory) ** 2) - 1) * orx;   // (la distance au bord, en pixels)
  const hc = v.cy - 3, hrx = v.rx + 6.5, hry = v.ry + 5.5;
  // Le camail épouse les épaules : il part du cou, s'élargit en arrondi jusqu'au bord des épaules
  // (sans déborder dans le vide), et son ourlet descend en arc, plus bas au milieu de la poitrine
  // qu'au-dessus des bras
  const epaule = (LARGEURS_BUSTE[g.race] || 20) + 2.5;
  const largeurCamail = y => { const u = Math.min(1, Math.max(0, (y - v.cy) / (v.torse + 8 - v.cy))); const lisse = u * u * (3 - 2 * u); return hrx - 1 + (epaule - hrx + 1) * lisse; };
  const finCamail = x => { const d = Math.min(1, Math.abs(x + 0.5 - cx) / epaule); return v.torse + 13 - d * d * 9 + (main ? Math.round(hachage(x, 0, 43) * 3) : (Math.floor(x / 3) % 2 ? 2 : 0)); };
  const forme = (x, y) => {
    if (dans(x, y)) return null;
    const dx = x + 0.5 - cx;
    const tete = (dx / hrx) ** 2 + ((y + 0.5 - hc) / hry) ** 2 <= 1;
    const h = hc - hry + 3 - y;   // (au-dessus du sommet de la tête)
    const pointe = h > 0 && (main ? h < 16 && Math.abs(dx + 2 + h * 0.55) < 11 - h * 0.7 : h < 4 && Math.abs(dx + 3 + h * 0.8) < 7 - h * 1.6);
    const camail = y >= v.cy && y <= finCamail(x) && Math.abs(dx) < largeurCamail(y);
    if (!(tete || pointe || camail)) return null;
    // un volume : la tête ronde, le camail qui s'évase sur les épaules
    const nx = dx / (y > v.cy ? largeurCamail(y) : hrx);
    // sur les épaules, l'étoffe s'arrondit et tourne vers le bas : plus sombre vers l'ourlet et les côtés
    const ny = y < v.cy ? (y - hc) / hry * 0.8 : 0.15 + Math.max(0, y - v.torse) / 14 * 0.6 + Math.abs(nx) * 0.2;
    return [nx * 0.95, ny, Math.sqrt(Math.max(0.1, 1 - nx * nx * 0.85 - ny * ny * 0.3))];
  };
  // Les plis : autour du visage, le bord replié (clair), l'ombre derrière lui, puis des plis en
  // anneaux sur le crâne ; sur le camail, des plis qui tombent vers les épaules
  const plis = (x, y) => {
    const r = anneau(x, y);
    if (y < v.cy + 10 && r < 2.2) return 0.9;
    if (y < v.cy + 10 && r < 3.4) return -1;
    if (y < v.cy + 4) return r % 6 < 1 ? -0.6 : r % 6 < 2 ? 0.35 : 0;
    // les plis partent du cou et s'ouvrent en éventail vers l'ourlet, en suivant la pente des épaules
    const a = Math.atan2(x + 0.5 - cx, y + 0.5 - (v.cy + 2));
    const f = Math.sin(a * 11 + Math.sin(y * 0.25) * 0.4);
    const pres = finCamail(x) - y;   // (l'ourlet se retourne un peu : un liseré clair, puis l'ombre dessous)
    return pres < 1 ? -0.8 : pres < 2 ? 0.6 : f > 0.8 ? 0.55 : f < -0.85 ? -0.9 : hachage(x, y, main ? 37 : 19) > 0.93 ? -0.5 : 0;
  };
  t.forme('cape', forme, { decalage: main ? -0.5 : -0.25, motif: plis });
  // L'ombre que la capuche jette sur le visage : le haut du visage s'assombrit sous le bord
  for (let y = 0; y < v.torse; y++) for (let x = 0; x < HD_L; x++) {
    const m = t.mat(x, y);
    if (!['peau', 'cheveux', 'levres', 'bouche', 'iris'].includes(m) || !dans(x, y)) continue;
    const sous = y - arche(x), k = t.k[y * t.l + x];
    if (main) { if (sous < 9 && m !== 'iris') t.poser(x, y, m, sous < 6 ? 0 : Math.min(k, 1)); else if (sous < 13) t.poser(x, y, m, Math.max(0, k - 1)); }
    else if (sous < 3 || -anneau(x, y) < 1.5) t.poser(x, y, m, Math.max(0, k - 2));
  }
  // (rien ne dépasse : une oreille ou une mèche hors de l'ouverture passe sous l'étoffe)
  for (let y = 0; y < v.torse; y++) for (let x = 0; x < HD_L; x++) if (['peau', 'cheveux'].includes(t.mat(x, y)) && !dans(x, y)) t.poser(x, y, 'cape', 2);
  if (!main) {
    t.rampes.emeraude = rampeVive(0x2ec860); t.rampes.argent = rampeVive(0xc8ccd4);
    t.forme('argent', ellipsoide(cx, v.torse + 1, 3, 3), { decalage: 0.3 });
    t.forme('emeraude', ellipsoide(cx, v.torse + 1, 2, 2), { decalage: 0.6 });
  }
}

// (v0.61) La cape de la Main Noire : elle tombe des épaules derrière le dos, s'évase un peu, et on
// n'en voit que les bords de chaque côté du corps (plus sombre que la robe, avec ses grands plis)
function capeDosBuste(t, g, v, cx) {
  t.rampes.capeDos = rampe(0x1c1b21);
  const epaule = (LARGEURS_BUSTE[g.race] || 20) + 2.5;
  const haut = v.torse + 2;
  t.forme('capeDos', (x, y) => {
    if (y < haut) return null;
    const demi = epaule + 2.5 + (y - haut) * 0.5;
    const nx = (x + 0.5 - cx) / demi;
    return Math.abs(nx) <= 1 ? [nx * 0.7, 0.2, 0.7] : null;
  }, { decalage: -1, motif: (x, y) => { const f = Math.sin((x - cx) * 0.7 + Math.sin(y * 0.2) * 0.8); return f > 0.85 ? 0.6 : f < -0.85 ? -0.8 : 0; } });
}

// Les épaulettes de la Main Noire : deux petites plaques de fer sombre posées sur le camail, au bord
// des épaules, et l'agrafe d'où part la cape (un anneau et un bout de chaîne)
function epaulettesBuste(t, g, v, cx) {
  // (les bras se détachent de la cape : elle prend l'ombre du bras le long de la manche, et son
  // bord extérieur accroche un peu la lumière pour qu'on la devine quand même)
  const ombres = [], bords = [];
  for (let y = v.torse; y < HD_H; y++) for (let x = 0; x < HD_L; x++) {
    if (t.mat(x, y) !== 'capeDos') continue;
    if ([[1, 0], [-1, 0], [0, -1], [2, 0], [-2, 0]].some(([a, b]) => ['habit', 'gantelet', 'peau'].includes(t.mat(x + a, y + b)))) ombres.push([x, y]);
    else if (!t.mat(x - 1, y) || !t.mat(x + 1, y)) bords.push([x, y]);
  }
  for (const [x, y] of ombres) t.poser(x, y, 'capeDos', 0);
  for (const [x, y] of bords) t.poser(x, y, 'capeDos', 4);
  t.rampes.gantelet = t.rampes.gantelet || rampe(0x5c606c);
  const epaule = (LARGEURS_BUSTE[g.race] || 20) + 2.5;
  for (const sens of [-1, 1]) {
    const ex = cx + sens * (epaule - 5.5), ey = v.torse + 3;
    // la plaque : un arc bombé, et une seconde lame en dessous, plus étroite
    t.forme('gantelet', (x, y) => { const nx = (x + 0.5 - ex) / 5.2, ny = (y + 0.5 - ey) / 2.6; return nx * nx + ny * ny <= 1 && y <= ey + 1 ? [nx * 0.8, -0.5, 0.7] : null; }, { decalage: -0.2 });
    t.forme('gantelet', (x, y) => { const nx = (x + 0.5 - ex - sens * 0.8) / 4.2, ny = (y + 0.5 - ey - 2.6) / 1.6; return nx * nx + ny * ny <= 1 && y > ey + 1 ? [nx * 0.8, 0.2, 0.8] : null; }, { decalage: -0.4 });
    // l'agrafe de la cape, côté cou : un anneau de fer, et deux maillons qui filent vers le dos
    const ax = Math.round(ex - sens * 4), ay = ey - 1;
    t.dessin(ax - 1, ay - 1, ['.o.', 'o.o', '.o.'], { o: ['gantelet', 5] });
    t.poser(ax - sens * 2, ay + 1, 'gantelet', 3); t.poser(ax - sens * 3, ay + 2, 'gantelet', 2);
  }
}

// (v0.61) Les plis des étoffes des deux bandes : la robe, les manches, la tunique et le gilet
// prennent des faux plis, des coutures et de l'usure (sinon, de grands aplats sans vie)
function plisBuste(t, g, v, cx) {
  const main = g.bande === 'main';
  // (une main portée au menton est gantée elle aussi)
  if (main) for (let y = Math.round(v.cy + v.ry - 1); y < v.torse - 2; y++) for (let x = 0; x < HD_L; x++) if (t.mat(x, y) === 'peau') { t.rampes.gantelet = rampe(0x5c606c); t.poser(x, y, 'gantelet', t.k[y * t.l + x]); }
  for (let y = v.torse - 2; y < HD_H; y++) for (let x = 0; x < HD_L; x++) {
    const m = t.mat(x, y), k = t.k[y * t.l + x];
    if (m === 'habit') {
      const f = Math.sin((x - cx) * 0.55 + y * 0.18 + Math.sin(y * 0.21 + x * 0.1) * 1.4);
      if (f > 0.86) t.poser(x, y, m, Math.min(5, k + 1)); else if (f < -0.9) t.poser(x, y, m, Math.max(0, k - 1));
      if (main && hachage(x, y, 71) > 0.95) t.poser(x, y, m, Math.max(0, k - 1));
    } else if (m === 'peau' && main) {
      // les gantelets de fer sombre de la Main Noire, avec leurs articulations
      t.rampes.gantelet = rampe(0x5c606c);
      t.poser(x, y, 'gantelet', (x + y) % 3 === 0 ? Math.max(0, k - 2) : k);
    } else if (m === 'gilet') {
      if (hachage(x, y, 83) > 0.9) t.poser(x, y, m, Math.max(0, k - 1));
      // une couture claire le long de l'ouverture du gilet
      if (t.mat(x - 1, y) === 'habit' || t.mat(x + 1, y) === 'habit') { if (y % 2) t.poser(x, y, m, Math.min(5, k + 2)); }
    }
  }
}

// La texture d'un portrait HD (créée à la demande, puis gardée).
function textureBusteHD(scene, personne, expression = 'neutre', etat = {}) {
  // (les Bannis ont l'air fâché tant qu'ils ne te connaissent pas : leur humeur « neutre » est fâchée)
  if (expression === 'neutre' && typeof banniFache === 'function' && banniFache(personne)) expression = 'fache';
  const cle = `busteHD_${personne.race}_${personne.nom}${personne.prestige ? "_noble" : ""}${personne.figurant ? '_' + personne.figurant : ''}${personne.vieux ? '_vieux' : ''}${personne.costume ? '_' + personne.costume : ''}_${expression}${etat.pose ? '_' + etat.pose : ''}${etat.cligne ? '_c' : ''}${etat.parle ? '_p' : ''}`;
  if (!scene.textures.exists(cle)) dessinerBusteHD(geneHD(personne), expression, etat).texture(scene, cle);
  return cle;
}

function oreillesElfe(t, v, cx, T = 0, taille = 1) {
  for (const sens of [-1, 1]) t.forme('peau', (x, y) => {
    const u = ((x + 0.5 - cx + sens * T * 0.8) * sens - v.rx + 1.5) / taille; // vers l'extérieur (l'oreille du côté tourné se cache un peu)
    const w = (y + 0.5 - (v.yeux + 5)) / taille;             // vers le bas
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
