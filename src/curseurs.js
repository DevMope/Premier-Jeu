// (v0.84) Les curseurs de souris, dans le thème du jeu : dessinés en pixels (16 × 16, affichés à 32),
// un pour pointer, un pour cliquer. Trois modèles à choisir (planche « curseurs ») :
// 'epee' (une petite épée à garde d'or), 'plume' (une plume d'oie et son encre), 'fleche' (une flèche
// de bois cerclée d'or). Lettres : n noir (contour), puis les couleurs du modèle ; '.' transparent.
const CURSEURS = {
  epee: {
    couleurs: { n: '#1a0e06', a: '#e8eef4', b: '#9aa8b8', c: '#5a6878', o: '#f0c040', p: '#a87010', m: '#6a3a1a', r: '#c03020' },
    pointe: [1, 1],
    pixels: [
      'nn..............',
      'nann............',
      'nabbn...........',
      '.nabbn..........',
      '..nabbn.........',
      '...nabbn........',
      '....nabbn.......',
      '.....nabbn..n...',
      '......nabbnnon..',
      '.......nabcnon..',
      '........nconn...',
      '.......nopnmn...',
      '......nopn.nmn..',
      '.......nn...nmrn',
      '.............nnn',
      '................',
    ],
  },
  plume: {
    couleurs: { n: '#1a0e06', a: '#fbf6ea', b: '#d8cdb4', c: '#9a8e74', t: '#2a2a4a', o: '#f0c040' },
    pointe: [1, 1],
    pixels: [
      'nn..............',
      'ntn.............',
      '.nan............',
      '.nabn...........',
      '..nabnn.........',
      '..nabbann.......',
      '...nabbaann.....',
      '...nabbbaaan....',
      '....nabbbbaan...',
      '....ncabbbbaan..',
      '.....ncabbbban..',
      '......ncabbbn...',
      '.......nccnn....',
      '........nnn.....',
      '................',
      '................',
    ],
  },
  fleche: {
    couleurs: { n: '#1a0e06', o: '#f6d060', p: '#b88018', b: '#c08a50', c: '#7a4a24', d: '#5a3014' },
    pointe: [1, 1],
    pixels: [
      'nn..............',
      'noon............',
      'nooon...........',
      'noppon..........',
      'nopbbon.........',
      'nopbbbon........',
      'nopbbbbon.......',
      'nopbbbbbon......',
      'nopbbbccnnn.....',
      'nopbcnbcn.......',
      'nopcnnbcn.......',
      'nonn..nbcn......',
      'nn....nbcn......',
      '.......nddn.....',
      '........nn......',
      '................',
    ],
  },
  // La main (gantelet de cuir), commune aux trois : pour tout ce qui se clique
  main: {
    couleurs: { n: '#1a0e06', a: '#d8a070', b: '#a86a3a', c: '#6a3a1a', o: '#f0c040' },
    pointe: [5, 1],
    pixels: [
      '....nn..........',
      '...nabn.........',
      '...nabn.........',
      '...nabn.........',
      '...nabnnn.nn....',
      '...nabnabnabn...',
      '.nnnabnabnabnn..',
      'nabnabnabnabnbn.',
      'nabbabbabbabbbn.',
      '.nabbbbbbbbbbbn.',
      '.nabbbbbbbbbbcn.',
      '..nabbbbbbbbcn..',
      '...nabbbbbbbcn..',
      '...nooooooooon..',
      '...nppppppppn...',
      '....nnnnnnnn....',
    ],
  },
};
CURSEURS.main.couleurs.p = '#a87010';

// Un curseur en image (data URL), à l'échelle voulue
function imageCurseur(modele, echelle = 2) {
  const m = CURSEURS[modele];
  const cv = document.createElement('canvas');
  cv.width = cv.height = 16 * echelle;
  const g = cv.getContext('2d');
  m.pixels.forEach((ligne, y) => [...ligne].forEach((ch, x) => {
    if (ch === '.' || !m.couleurs[ch]) return;
    g.fillStyle = m.couleurs[ch]; g.fillRect(x * echelle, y * echelle, echelle, echelle);
  }));
  return cv.toDataURL('image/png');
}

// La règle CSS d'un curseur : l'image, son point chaud, et le curseur du système en secours
function cssCurseur(modele, secours = 'auto') {
  const m = CURSEURS[modele];
  return `url(${imageCurseur(modele)}) ${m.pointe[0] * 2} ${m.pointe[1] * 2}, ${secours}`;
}

// (v0.86) La plume de la narration : une plume d'oie en diagonale (le tuyau, les barbes claires d'un
// côté et ombrées de l'autre, quelques encoches), sa pointe trempée d'encre, et un petit encrier.
function texturePlume(scene) {
  const cle = 'plumeNarration2';
  if (scene.textures.exists(cle)) return cle;
  const N = 28, tex = scene.textures.createCanvas(cle, N, N), g = tex.getContext();
  const px = new Map(), poser = (x, y, c) => { if (x >= 0 && y >= 0 && x < N && y < N) px.set(x + ',' + y, c); };
  // l'axe : de la pointe (en bas à gauche) au panache (en haut à droite)
  const ax = 7, ay = 20, bx = 26, by = 1, L = Math.hypot(bx - ax, by - ay), ux = (bx - ax) / L, uy = (by - ay) / L;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const dx = x + 0.5 - ax, dy = y + 0.5 - ay, t = (dx * ux + dy * uy) / L, d = dx * -uy + dy * ux;   // d > 0 : côté ombré
    if (t < -0.02 || t > 1.02) continue;
    const large = t < 0.28 ? 0 : t < 0.62 ? (t - 0.28) / 0.34 * 4.6 : 4.6 - (t - 0.62) / 0.4 * 3.6;
    const encoche = (Math.floor(t * 30) % 5 === 0) && Math.abs(d) > large - 1.6 && t > 0.35;   // les barbes qui se séparent
    if (Math.abs(d) < 0.75) poser(x, y, t < 0.1 ? '#1e1a3a' : t < 0.3 ? '#c8a878' : '#e8d8b0');   // le tuyau (la pointe, encrée)
    else if (Math.abs(d) < large && !encoche) poser(x, y, d < 0 ? (Math.abs(d) > large - 1.1 ? '#d8d0bc' : '#fbf8ee') : (Math.abs(d) > large - 1.1 ? '#8a8270' : '#c4bca8'));
  }
  // le contour sombre
  const pleins = [...px.keys()].map(k => k.split(',').map(Number));
  for (const [x, y] of pleins) for (const [i, j] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!px.has((x + i) + ',' + (y + j))) poser(x + i, y + j, '#1a0e06');
  // une goutte d'encre au bout, et l'encrier
  poser(5, 23, '#2a2a5a');
  const encrier = ['..nnnnnn..', '.nooooon..', 'nkkkkkkkn.', 'nkkKkkkkn.', 'nkkKkkkkn.', 'nkkkkkkkn.', '.nnnnnnn..'];
  const coul = { n: '#1a0e06', o: '#c9a227', k: '#2a2a4a', K: '#6a6a9a' };
  encrier.forEach((l, j) => [...l].forEach((c, i) => { if (coul[c]) poser(1 + i, 21 + j, coul[c]); }));
  for (const [k, c] of px) { const [x, y] = k.split(',').map(Number); g.fillStyle = c; g.fillRect(x, y, 1, 1); }
  tex.refresh();
  return cle;
}
