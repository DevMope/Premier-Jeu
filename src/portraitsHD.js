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
  }
  dans(x, y) { return x >= 0 && y >= 0 && x < this.l && y < this.h; }
  poser(x, y, mat, i) {
    if (!this.dans(x, y)) return;
    i = Math.max(0, Math.min(5, i));
    this.c[y * this.l + x] = RAMPES[mat][i];
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
      if (droite || bas) ajouts.push([x, y, RAMPES[droite || bas][1]]);       // côté lumière
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

// --- Les yeux, sourcils et bouches, dessinés à la main ---
// l : paupière, s : creux de l'œil, w : blanc, i : iris sombre, I : iris clair, h : reflet
const LEGENDE_OEIL = { l: ['peau', 0], s: ['peau', 2], w: ['oeil', 4], i: ['oeil', 1], I: ['oeil', 3], h: ['oeil', 5], k: ['oeil', 0] };
const YEUX = {
  neutre: ['.........', '..lllll..', '.lwIIiwl.', '.swhiiws.', '..sssss..'],
  content: ['.........', '..lllll..', '.lwIhiwl.', '..llsll..', '.........'],
  inquiet: ['..lllll..', '.lwwwwwl.', '.lwIIiwl.', '.swhiiws.', '..sssss..'],
  fache: ['.........', '.........', '.lllllll.', '.lwhIiwl.', '..sssss..'],
  cligne: ['.........', '.........', '.........', '.lllllll.', '..sssss..'],
};
// La hauteur de chaque colonne du sourcil (9 colonnes, de l'extérieur vers le nez).
const SOURCILS = {
  neutre: [1, 0, 0, 0, 0, 0, 0, 1, 1],
  content: [1, 0, -1, -1, -1, -1, 0, 0, 1],
  inquiet: [2, 2, 1, 1, 0, 0, -1, -1, -2],
  fache: [-2, -1, -1, 0, 0, 1, 1, 2, 3],
};
// d : lèvre sombre, D : fond de la bouche, w : dents, r : langue
const LEGENDE_BOUCHE = { d: ['bouche', 1], D: ['bouche', 0], w: ['bouche', 5], r: ['bouche', 3], p: ['peau', 1] };
const BOUCHES = {
  neutre: ['..........', '..pppppp..', '.dddddddd.', '..........'],
  content: ['.d......d.', '..dwwwwd..', '...dddd...', '..........'],
  inquiet: ['..........', '...dddd...', '..d....d..', '.d......d.'],
  fache: ['..........', '...dddd...', '..dwwwwd..', '.d......d.'],
  parle: ['..dddddd..', '.dDDDDDDd.', '.dDrrrrDd.', '..dddddd..'],
};

// Le nain d'essai, dans une expression donnée.
function dessinerNainHD(expression = 'neutre', { cligne = false, parle = false } = {}) {
  const t = new ToileHD(HD_L, HD_H);
  const cx = 40;

  // Le torse : une tunique rouge sous une cotte de mailles.
  t.forme('tissu', (x, y) => {
    if (y < 66) return null;
    const demi = Math.min(40, 24 + (y - 66) * 0.55);
    const nx = (x + 0.5 - cx) / demi;
    if (Math.abs(nx) > 1) return null;
    return [nx * 0.8, -0.25, Math.sqrt(1 - nx * nx * 0.64)];
  }, { decalage: -0.7 });
  t.forme('metal', ellipsoide(cx, 92, 22, 26, (x, y) => y >= 66), {
    decalage: -0.9,
    // Les anneaux de mailles : un petit anneau clair tous les 3 pixels, en quinconce
    motif: (x, y) => { const u = (x + (Math.floor(y / 3) % 2) * 1.5) % 3, v = y % 3; return u < 1 && v < 1 ? 0.9 : u >= 2 || v >= 2 ? -0.5 : 0.2; },
  });
  // La sangle de cuir en travers, et sa boucle
  t.forme('cuir', (x, y) => (y >= 68 && Math.abs((x - 18) - (y - 68) * 0.9) < 3 ? [0.2, 0.1, 0.97] : null));
  t.dessin(52, 90, ['.ooo.', 'o...o', 'o...o', '.ooo.'], { o: ['or', 3] });
  // Les épaulières
  for (const sens of [-1, 1]) {
    const ex = cx + sens * 25;
    t.forme('metal', ellipsoide(ex, 74, 14, 10, (x, y) => y <= 80), { decalage: -0.8 });
    t.forme('metal', ellipsoide(ex, 72, 9, 6, (x, y) => y <= 76), { decalage: -0.3, bord: false });
    t.forme('or', (x, y) => (y >= 78 && y <= 81 && Math.abs(x + 0.5 - ex) < 13.5 - (y - 78) * 0.8 ? [0, (y - 79.5) / 2, 0.9] : null));
    for (const k of [-7, 0, 7]) t.poser(ex + k, 76 - Math.abs(k) * 0.2, 'or', 5);
  }

  // Les oreilles, puis la tête
  for (const sens of [-1, 1]) t.forme('peau', ellipsoide(cx + sens * 17.5, 47, 3.2, 5.2));
  t.forme('peau', ellipsoide(cx, 43, 17, 19));

  // Le casque : un dôme de métal avec un bandeau d'or et un nasal
  t.forme('metal', ellipsoide(cx, 37, 19.5, 17, (x, y) => y <= 37), { decalage: -0.8 });
  // L'arête du casque
  t.forme('metal', (x, y) => (y >= 21 && y <= 33 && Math.abs(x + 0.5 - cx) < 1.6 ? [(x + 0.5 - cx) / 2, -0.5, 0.7] : null), { decalage: 0.2 });
  t.forme('or', (x, y) => {
    if (y < 33 || y > 37) return null;
    const demi = 19.5 * Math.sqrt(Math.max(0, 1 - ((y + 0.5 - 37) / 17) ** 2)) + 0.5;
    return Math.abs(x + 0.5 - cx) <= demi ? [(x + 0.5 - cx) / demi, (y - 35) / 3, 0.8] : null;
  });
  for (let k = -16; k <= 16; k += 6) t.poser(cx + k, 35, 'or', 5);
  t.forme('metal', (x, y) => (y >= 37 && y <= 48 && x >= 39 && x <= 41 ? [(x - 40) * 0.6, 0, 0.8] : null), { decalage: -0.6 });

  // Les sourcils broussailleux (par-dessus le bord du casque)
  const sourcil = SOURCILS[expression];
  for (const sens of [-1, 1]) {
    for (let k = 0; k < 9; k++) {
      const x = sens < 0 ? 28 + k : 52 - k;
      const y = 38 + sourcil[k];
      t.poser(x, y, 'barbe', 4); t.poser(x, y + 1, 'barbe', 3); t.poser(x, y + 2, 'barbe', k % 2 ? 1 : 2);
    }
  }
  // Les yeux
  const yeux = YEUX[cligne ? 'cligne' : expression];
  t.dessin(28, 41, yeux, LEGENDE_OEIL);
  t.dessin(43, 41, yeux, LEGENDE_OEIL, true);

  // Le gros nez de nain, plus rouge quand il est content ou fâché
  t.forme('peau', ellipsoide(cx, 50.5, 5, 4.6), { decalage: 0.3 });
  if (expression === 'content' || expression === 'fache') { t.poser(cx + 1, 52, 'tissu', 4); t.poser(cx + 2, 51, 'tissu', 4); }
  // Les joues
  if (expression === 'content') for (const x of [29, 30, 49, 50]) t.poser(x, 50, 'tissu', 5);

  // La barbe, mèche par mèche, avec un trou pour la bouche
  const bouche = { x: 35, y: 60, l: 10, h: 4 };
  const dansBouche = (x, y) => x >= bouche.x && x < bouche.x + bouche.l && y >= bouche.y && y < bouche.y + bouche.h;
  const demiBarbe = y => (y < 52 ? 0 : y < 66 ? 15 + (y - 52) * 0.45 : Math.max(0, 21.3 - (y - 66) * 0.55));
  t.forme('barbe', (x, y) => {
    if (y < 52 || y > 86) return null;
    const demi = demiBarbe(y);
    const nx = (x + 0.5 - cx) / demi;
    if (Math.abs(nx) > 1 || dansBouche(x, y)) return null;
    if (y < 55 && Math.abs(x + 0.5 - cx) < 6) return null; // sous le nez
    return [nx, (y - 66) / 30, Math.sqrt(Math.max(0, 1 - nx * nx))];
  }, { motif: (x, y) => { const m = (x * 3 + Math.round(Math.sin(y / 3.5) * 1.5)) % 7; return (m === 0 ? 0.9 : m === 4 ? -0.8 : 0) + (y > 80 ? -0.4 : 0); } });
  // La bouche (dans la barbe)
  t.dessin(bouche.x, bouche.y, BOUCHES[parle ? 'parle' : expression], LEGENDE_BOUCHE);
  // La moustache, par-dessus
  for (const sens of [-1, 1]) {
    t.forme('barbe', (x, y) => {
      const u = (x + 0.5 - cx) * sens; // de 0 (nez) vers l'extérieur
      if (u < 0 || u > 14) return null;
      // Elle part du nez, s'épaissit, puis retombe en pointe de chaque côté de la bouche
      const centre = 56 + u * 0.15 + (u > 6 ? (u - 6) * 0.55 : 0);
      const ep = u < 7 ? 2.4 + u * 0.25 : Math.max(0.8, 4.1 - (u - 7) * 0.45);
      return Math.abs(y + 0.5 - centre) < ep ? [sens * u / 14 * 0.7, (y + 0.5 - centre) / ep * 0.7, 0.75] : null;
    }, { decalage: 0.5, motif: (x, y) => ((x + y) % 4 === 0 ? 0.6 : 0) });
  }
  // Les deux tresses, avec leurs anneaux d'or
  for (const bx of [34, 46]) {
    t.forme('barbe', (x, y) => (y >= 84 && y <= 97 && Math.abs(x + 0.5 - bx) < 3.2 - (y - 84) * 0.1 ? [(x + 0.5 - bx) / 3, 0.1, 0.9] : null),
      { motif: (x, y) => (y % 3 === 0 ? -0.8 : 0.2) });
    t.forme('or', (x, y) => (y >= 89 && y <= 91 && Math.abs(x + 0.5 - bx) < 3.4 ? [(x + 0.5 - bx) / 3.4, (y - 90) / 2, 0.8] : null));
  }

  t.contour();
  return t;
}

function textureNainHD(scene, expression = 'neutre', etat = {}) {
  const cle = `nainHD_${expression}${etat.cligne ? '_c' : ''}${etat.parle ? '_p' : ''}`;
  if (!scene.textures.exists(cle)) dessinerNainHD(expression, etat).texture(scene, cle);
  return cle;
}
