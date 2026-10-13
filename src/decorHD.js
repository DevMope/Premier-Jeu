// Le décor en HD : chaque matière du shop est peinte pixel par pixel, pour qu'on comprenne de
// quoi il est fait. Chêne veiné avec ses nœuds, enduit à la chaux taché et fissuré, pierres,
// ferrures, ardoise, parchemin... Les textures sont peintes en demi-résolution (1 pixel peint =
// 2 pixels à l'écran), comme les portraits.

const RAMPES_DECOR = {
  chene: [0x2a1a10, 0x4a2e18, 0x6b4423, 0x8a5a2b, 0xa8743c, 0xc89a5a],
  cheneSombre: [0x140c08, 0x26180e, 0x3a2414, 0x4e321c, 0x664226, 0x82583a],
  platre: [0x5a4a3a, 0x8a7a62, 0xb4a484, 0xd2c2a0, 0xe4d6b6, 0xf2e8cc],
  pierre: [0x2a2624, 0x46403c, 0x645c54, 0x857a6e, 0xa4988a, 0xc4b8a8],
  fer: [0x0e0e12, 0x202228, 0x363840, 0x50545e, 0x747a86, 0x9aa2ae],
  ardoise: [0x101418, 0x1a2026, 0x242c34, 0x2e3842, 0x3e4a56, 0x8a96a0],
  parchemin: [0x5a4024, 0x8a6a40, 0xb8965e, 0xd8bc84, 0xead4a4, 0xf6e8c4],
  cire: [0x8a6a40, 0xc8a870, 0xe4cc98, 0xf0dcae, 0xf8ecc8, 0xfff8e4],
  cuirRouge: [0x1e0808, 0x3e1010, 0x5e1a16, 0x7e2a20, 0x9e4030, 0xbe5c44],
  encre: [0x0a0c14, 0x141a2a, 0x1e2840, 0x2a3656, 0x3a4a70, 0x4a5e8a],
  laiton: [0x2e1c06, 0x5a3c10, 0x8a6420, 0xb88e34, 0xdcb85a, 0xfbe8a0],
  toile: [0x6a5a44, 0x9a8a6c, 0xbcae8e, 0xd6caa8, 0xe8dec0, 0xf6f0dc],
};

// --- Le bruit, pour les veines, les taches et l'usure ---

function hachage(i, j, graine) {
  let n = Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(graine, 144665);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function bruit(x, y, graine = 0) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const lisse = t => t * t * (3 - 2 * t);
  const a = hachage(xi, yi, graine), b = hachage(xi + 1, yi, graine), c = hachage(xi, yi + 1, graine), d = hachage(xi + 1, yi + 1, graine);
  const u = lisse(xf), v = lisse(yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function fbm(x, y, graine = 0, octaves = 3) {
  let v = 0, amp = 0.5, f = 1, total = 0;
  for (let o = 0; o < octaves; o++) { v += amp * bruit(x * f, y * f, graine + o * 17); total += amp; f *= 2; amp *= 0.5; }
  return v / total;
}

// Une toile de décor : la toile HD des portraits, avec les dégradés du décor en plus.
function toileDecor(l, h) {
  const t = new ToileHD(l, h);
  Object.assign(t.rampes, RAMPES_DECOR);
  return t;
}

// --- Les matières ---

// Une planche de bois veinée : veines qui ondulent, nœuds, bords usés (clair en haut, sombre en bas).
function planche(t, x0, y0, l, h, mat = 'chene', { horizontale = true, graine = 1, noeuds = 1, usure = true } = {}) {
  const centres = [];
  for (let k = 0; k < noeuds; k++) centres.push([x0 + hachage(k, 1, graine) * l, y0 + hachage(k, 2, graine) * h, 1.5 + hachage(k, 3, graine) * 2]);
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + l; x++) {
    const long = horizontale ? x : y, travers = horizontale ? y - y0 : x - x0;
    const ep = horizontale ? h : l;
    let veine = fbm(long * 0.03, travers * 0.22, graine) * 5 + travers * 0.55;
    // Les nœuds font tourner les veines autour d'eux
    let noeud = false;
    for (const [nx, ny, r] of centres) {
      const dx = (x - nx) * (horizontale ? 0.45 : 1), dy = (y - ny) * (horizontale ? 1 : 0.45);
      const d = Math.hypot(dx, dy);
      if (d < r) noeud = true;
      if (d < r * 3) veine += (r * 3 - d) * 0.5;
    }
    const bande = veine - Math.floor(veine);
    let i = 3 + (bande < 0.18 ? -1 : bande > 0.82 ? 1 : 0) + Math.round((fbm(long * 0.08, travers * 0.08, graine + 9) - 0.5) * 1.6);
    if (noeud) i = 1;
    if (usure) {
      if (travers === 0) i = Math.max(i, 4);         // le bord éclairé
      if (travers === ep - 1) i = 1;                 // le joint dans l'ombre
    }
    t.poser(x, y, mat, i);
  }
}

// Un clou ou un rivet de fer.
function clou(t, x, y) {
  t.poser(x, y, 'fer', 4); t.poser(x + 1, y, 'fer', 2); t.poser(x, y + 1, 'fer', 2); t.poser(x + 1, y + 1, 'fer', 1);
}

// De l'enduit à la chaux : taches, salissures vers le bas, fissures.
function enduit(t, x0, y0, l, h, graine = 3) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + l; x++) {
    let i = 3 + Math.round((fbm(x * 0.05, y * 0.05, graine) - 0.5) * 1.3);
    if (fbm(x * 0.015, y * 0.02, graine + 4) > 0.74) i--;  // de grandes taches d'humidité
    if (y > y0 + h - 14 && hachage(x, y, graine) < 0.25 + (y - (y0 + h - 14)) * 0.04) i--; // la crasse en bas
    t.poser(x, y, 'platre', i);
  }
  // Quelques fissures
  for (let k = 0; k < 3; k++) {
    let x = x0 + hachage(k, 7, graine) * l, y = y0 + hachage(k, 8, graine) * h * 0.5;
    for (let s = 0; s < 18; s++) {
      t.poser(x, y, 'platre', 1);
      x += (hachage(k, s, graine + 2) - 0.5) * 2; y += 1;
      if (x < x0 || x >= x0 + l || y >= y0 + h) break;
    }
  }
}

// Des pierres apparentes, là où l'enduit est tombé.
function pierres(t, x0, y0, l, h, graine = 5) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + l; x++) {
    const rangee = Math.floor((y - y0) / 6), dec = rangee % 2 ? 5 : 0;
    const bx = (x - x0 + dec) % 10, by = (y - y0) % 6;
    const joint = bx === 0 || by === 0;
    const i = joint ? 1 : 2 + Math.round(fbm(x * 0.2, y * 0.2, graine + rangee) * 2) + (by === 1 ? 1 : 0) - (bx === 9 || by === 5 ? 1 : 0);
    t.poser(x, y, 'pierre', i);
  }
}

// --- Les éléments du comptoir ---

function creerDecorComptoir(scene) {
  if (scene.textures.exists('ardoiseComptoir')) return;

  // L'ardoise du tableau de gauche, dans son cadre de chêne cloué
  {
    const t = toileDecor(125, 115);
    for (let y = 0; y < 115; y++) for (let x = 0; x < 125; x++) {
      const i = 2 + Math.round((fbm(x * 0.15, y * 0.15, 21) - 0.5) * 1.6) + (hachage(x, y, 22) < 0.04 ? 1 : 0);
      t.poser(x, y, 'ardoise', i);
    }
    // Des traces de craie effacée
    for (let k = 0; k < 6; k++) {
      const yy = 20 + hachage(k, 1, 23) * 80, xx = 10 + hachage(k, 2, 23) * 70;
      for (let s = 0; s < 30; s++) if (hachage(k, s, 24) < 0.6) t.poser(xx + s, yy + Math.sin(s / 4) * 2, 'ardoise', 4);
    }
    planche(t, 0, 0, 125, 5, 'chene', { graine: 25 });
    planche(t, 0, 110, 125, 5, 'chene', { graine: 26 });
    planche(t, 0, 0, 5, 115, 'chene', { horizontale: false, graine: 27 });
    planche(t, 120, 0, 5, 115, 'chene', { horizontale: false, graine: 28 });
    for (const [x, y] of [[1, 1], [122, 1], [1, 112], [122, 112]]) clou(t, x, y);
    t.contour();
    t.texture(scene, 'ardoiseComptoir');
  }

  // Le parchemin de la commande, punaisé, aux bords irréguliers et un peu brûlés
  {
    const t = toileDecor(130, 115);
    for (let y = 0; y < 115; y++) for (let x = 0; x < 130; x++) {
      const bord = Math.min(x, y, 129 - x, 114 - y);
      const dechire = fbm(x * 0.3, y * 0.3, 31) * 3;
      if (bord < dechire - 0.5) continue;
      let i = 4 + Math.round((fbm(x * 0.07, y * 0.07, 32) - 0.55) * 2.2);
      if (bord < dechire + 2) i -= 2;                              // les bords roussis
      if (x < 6 || x > 123) i -= 1;                                // il gondole un peu
      if (fbm(x * 0.04, y * 0.05, 33) > 0.72) i--;                 // une tache
      t.poser(x, y, 'parchemin', i);
    }
    for (const x of [6, 121]) { t.forme('fer', ellipsoide(x + 1, 5, 2.4, 2.4)); }
    t.texture(scene, 'parcheminComptoir');
  }

  // La planche de la bande de dialogue, cerclée de fer
  {
    const t = toileDecor(462, 36);
    planche(t, 0, 0, 462, 18, 'cheneSombre', { graine: 41, noeuds: 3 });
    planche(t, 0, 18, 462, 18, 'cheneSombre', { graine: 42, noeuds: 3 });
    for (const x0 of [6, 446]) {
      for (let y = 0; y < 36; y++) for (let x = x0; x < x0 + 10; x++) t.poser(x, y, 'fer', y === 0 || x === x0 ? 4 : 2 + Math.round(fbm(x * 0.5, y * 0.5, 43)));
      for (const y of [5, 17, 29]) clou(t, x0 + 4, y);
    }
    t.contour();
    t.texture(scene, 'planchesDialogue');
  }

  // Le cadre de la fenêtre : un ébrasement profond dans le mur épais, un cadre biseauté,
  // un appui de pierre. Le centre reste vide (on y voit le paysage).
  {
    const L = 196, H = 128, ox = 8, oy = 8, w = 180, h = 115; // l'ouverture : 360 × 230 à l'écran
    const t = toileDecor(L, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) {
      const dedans = x >= ox && x < ox + w && y >= oy && y < oy + h;
      if (dedans) continue;
      // Le cadre de chêne (4 pixels), puis l'enduit de l'ébrasement autour
      const d = Math.min(Math.abs(x - ox + 0.5), Math.abs(x - (ox + w) + 0.5), Math.abs(y - oy + 0.5), Math.abs(y - (oy + h) + 0.5));
      if (d < 4.5) t.poser(x, y, 'chene', (x < ox || y < oy) ? 4 - Math.floor(d / 2) : 1 + Math.floor(d / 2));
      else t.poser(x, y, 'cheneSombre', 2 + Math.round(fbm(x * 0.1, y * 0.4, 51) * 2));
    }
    // L'appui de pierre, en bas
    pierres(t, 0, H - 5, L, 5, 52);
    for (let x = 0; x < L; x++) t.poser(x, H - 5, 'pierre', 5);
    for (const [x, y] of [[2, 2], [L - 4, 2], [2, H - 13], [L - 4, H - 13]]) clou(t, x, y);
    t.texture(scene, 'cadreFenetre');
  }

  // Le plateau du comptoir : chêne épais, planches veinées, casiers du stock creusés dedans,
  // têtes de clous, rayures, une tache d'encre, des traces de chopes.
  {
    const t = toileDecor(480, 100);
    // La tranche avant du plateau (épaisse, usée, éclairée)
    planche(t, 0, 0, 480, 8, 'chene', { graine: 61, noeuds: 4 });
    for (let x = 0; x < 480; x++) { t.poser(x, 0, 'chene', 5); t.poser(x, 8, 'chene', 0); }
    // Les planches du bureau
    for (let k = 0; k < 4; k++) planche(t, 0, 9 + k * 23, 480, 23, 'chene', { graine: 62 + k, noeuds: 3 });
    for (let k = 0; k < 4; k++) for (let x = 6; x < 480; x += 118) { clou(t, x + k * 7, 13 + k * 23); clou(t, x + k * 7, 27 + k * 23); }
    // Rayures, tache d'encre, traces de chopes
    for (let k = 0; k < 14; k++) {
      const x = hachage(k, 1, 80) * 480, y = 10 + hachage(k, 2, 80) * 86, l = 4 + hachage(k, 3, 80) * 10;
      for (let s = 0; s < l; s++) t.poser(x + s, y + s * 0.2, 'chene', 4);
    }
    t.forme('encre', ellipsoide(30, 70, 4, 2.4), { decalage: -0.6 });
    t.poser(36, 71, 'encre', 2); t.poser(38, 72, 'encre', 2);
    for (const [x, y] of [[440, 30], [452, 64]]) for (let a = 0; a < 40; a++) t.poser(x + Math.cos(a / 40 * 6.28) * 6, y + Math.sin(a / 40 * 6.28) * 3, 'chene', 1);
    // Les casiers du stock, creusés dans le plateau : un rebord de chêne biseauté et, au fond,
    // un lit de toile claire où les marchandises ressortent bien.
    for (let i = 0; i < 12; i++) {
      const x0 = 74 + (i % 5) * 54, y0 = 17 + Math.floor(i / 5) * 24;
      for (let y = y0; y < y0 + 22; y++) for (let x = x0; x < x0 + 52; x++) {
        const dx = Math.min(x - x0, x0 + 51 - x), dy = Math.min(y - y0, y0 + 21 - y), d = Math.min(dx, dy);
        if (d < 2) {
          // Le rebord : sombre en haut et à gauche (dans l'ombre), éclairé en bas et à droite
          const haut = (y - y0 < 2 && dy <= dx) || (x - x0 < 2 && dx <= dy);
          t.poser(x, y, 'chene', haut ? d : 4 + (d === 0 ? 1 : 0));
          continue;
        }
        // La toile : un tissage serré, plus sombre près du bord haut (l'ombre du rebord)
        let ind = 4 + ((x + y) % 2 ? 0 : -1) + Math.round((fbm(x * 0.2, y * 0.2, 90 + i) - 0.5) * 1.2);
        if (y - y0 < 4 || x - x0 < 3) ind -= 1;
        if (y - y0 < 3) ind -= 1;
        if (x % 7 === 0 && hachage(x, y, i) < 0.5) ind--; // les fils plus épais de la trame
        t.poser(x, y, 'toile', ind);
      }
    }
    t.texture(scene, 'plateauComptoir');
  }

  // Le mur : enduit à la chaux entre les colombages de chêne, pierres apparentes en bas
  {
    const t = toileDecor(480, 170);
    enduit(t, 0, 0, 480, 170, 91);
    pierres(t, 0, 152, 72, 18, 92);
    pierres(t, 400, 148, 80, 22, 93);
    // Les poteaux et la sablière haute, avec leurs chevilles
    planche(t, 0, 0, 480, 8, 'cheneSombre', { graine: 94, noeuds: 4 });
    for (const x of [140, 334]) {
      planche(t, x, 8, 8, 162, 'cheneSombre', { horizontale: false, graine: 95 + x, noeuds: 2 });
      for (const y of [14, 160]) clou(t, x + 3, y);
    }
    planche(t, 0, 162, 480, 8, 'cheneSombre', { graine: 97, noeuds: 4 });
    t.texture(scene, 'murComptoir');
  }

  // Le registre : un gros livre relié de cuir rouge, coins de laiton, tranche des pages
  {
    const t = toileDecor(62, 14);
    for (let y = 0; y < 14; y++) for (let x = 0; x < 62; x++) {
      if (y >= 11 && x > 2 && x < 59) { t.poser(x, y, 'parchemin', y === 11 ? 5 : 4 - (x % 3 === 0 ? 1 : 0)); continue; } // la tranche
      let i = 3 + Math.round((fbm(x * 0.2, y * 0.3, 101) - 0.5) * 1.5);
      if (y === 0) i = 5; if (y === 10) i = 1; if (x === 5) i = 1; if (x === 6) i = 4; // le dos et le nerf
      t.poser(x, y, 'cuirRouge', i);
    }
    for (const [x, y] of [[0, 0], [59, 0], [0, 8], [59, 8]]) t.dessin(x, y, ['ooo', 'oo.', 'o..'].map((l, k) => (y ? ['o..', 'oo.', 'ooo'][k] : l)).map(l => (x ? [...l].reverse().join('') : l)), { o: ['or', 4] });
    t.contour();
    t.texture(scene, 'registreComptoir');
  }

  // Les plaques de bois des boutons, aux bords biseautés et clouées
  // (créées à la demande, selon leur largeur : voir plaqueBouton)
}

// Une plaque de bois pour un bouton de la largeur donnée (à l'écran), et sa version éclairée
// (pour le survol). Renvoie la clé de la texture normale ; la claire finit par « _clair ».
function plaqueBouton(scene, largeur) {
  const cle = 'plaque_' + Math.round(largeur);
  if (scene.textures.exists(cle)) return cle;
  const l = Math.max(14, Math.round(largeur / 2)), h = 20;
  // Trois états : au repos, au survol (plus clair, le laiton brille), enfoncé (biseaux inversés)
  for (const etat of ['', '_clair', '_enfonce']) {
    const t = toileDecor(l, h);
    const clair = etat === '_clair', enfonce = etat === '_enfonce';
    if (clair) {
      t.rampes.chene = RAMPES_DECOR.chene.map((c, i, r) => r[Math.min(5, i + 1)]);
      t.rampes.laiton = RAMPES_DECOR.laiton.map((c, i, r) => r[Math.min(5, i + 1)]);
    }
    // Le panneau de chêne en creux, veiné
    planche(t, 4, 4, l - 8, h - 8, 'chene', { graine: l + 7, noeuds: 0 });
    for (let y = 0; y < h; y++) for (let x = 0; x < l; x++) {
      const d = Math.min(x, y, l - 1 - x, h - 1 - y);
      const lumiere = (d === y || d === x) !== enfonce; // le haut et la gauche prennent la lumière
      if (d === 0) t.poser(x, y, 'cheneSombre', 0);
      // Le cadre de noyer, biseauté
      else if (d <= 2) t.poser(x, y, 'cheneSombre', lumiere ? 6 - d : 1 + d);
      // Un filet de laiton entre le cadre et le panneau
      else if (d === 3) t.poser(x, y, 'laiton', lumiere ? 2 : 4);
      // L'ombre du cadre sur le panneau (plus profonde quand on appuie)
      else if (d === 4 && (d === y || d === x)) t.poser(x, y, 'chene', enfonce ? 0 : 1);
      else if (enfonce && d === 5 && d === y) t.poser(x, y, 'chene', 1);
    }
    // Les coins de laiton, en équerre, rivetés
    const coins = [[0, 0, 1, 1], [l - 1, 0, -1, 1], [0, h - 1, 1, -1], [l - 1, h - 1, -1, -1]];
    for (const [cx, cy, sx, sy] of coins) {
      for (let j = 0; j < 6; j++) for (let k = 0; j + k < 6; k++) {
        const bord = j + k === 5 || j === 0 || k === 0;
        t.poser(cx + sx * k, cy + sy * j, 'laiton', bord ? (sy > 0 && j === 0 || sx > 0 && k === 0 ? 4 : 1) : 3);
      }
      t.poser(cx + sx * 2, cy + sy * 2, 'laiton', 5); // le rivet
      t.poser(cx + sx * 3, cy + sy * 2, 'laiton', 1);
      t.poser(cx + sx * 2, cy + sy * 3, 'laiton', 1);
    }
    t.texture(scene, cle + etat);
  }
  return cle;
}
