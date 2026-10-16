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

// (v0.86) La plume du curseur, en texture du jeu : elle signe la narration au comptoir
function texturePlume(scene) {
  if (scene.textures.exists('plumeNarration')) return 'plumeNarration';
  const m = CURSEURS.plume, tex = scene.textures.createCanvas('plumeNarration', 16, 16), g = tex.getContext();
  m.pixels.forEach((ligne, y) => [...ligne].forEach((ch, x) => {
    if (ch === '.' || !m.couleurs[ch]) return;
    g.fillStyle = m.couleurs[ch]; g.fillRect(x, y, 1, 1);
  }));
  tex.refresh();
  return 'plumeNarration';
}
