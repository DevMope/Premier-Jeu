// (v0.68) De petits pictogrammes en pixel art, à la place des émojis du téléphone (qui faisaient
// « bon marché » et changeaient d'allure d'un appareil à l'autre). Chacun est dessiné pixel par
// pixel sur une grille de 11 × 11 ('.' = transparent), avec un contour sombre.
const PALETTE_GLYPHES = {
  n: 0x1a0e08,   // le contour
  r: 0xd03028, R: 0xff6a50,   // rouge (colère, crâne des pièges)
  b: 0x2a7ac8, B: 0x8ad0ff,   // bleu (larme)
  j: 0xe0a820, J: 0xfff0a0,   // jaune (idée, étincelle, étoile)
  p: 0xf0c8a0, P: 0xffe8cc,   // peau (la main)
  m: 0x8a5a2a, M: 0xc08a50,   // bois (le balai, le manche)
  o: 0xb0a070, O: 0xe8d8a0,   // paille, papier
  a: 0x8a96a4, A: 0xdce4ec,   // acier (épées)
  w: 0xe8e0d0, W: 0xffffff,   // os, blanc
  g: 0x5a4a3a,                // gris-brun (haut-parleur)
  v: 0x5a3a9a, V: 0xb494ff,   // violet (la lune de l'ombre)
};
const GLYPHES = {
  // (v0.90) la lumière et l'ombre : le soleil et la lune des boutons et du livre des deux voies
  soleil: ['.....j.....', '.j..nnn..j.', '...nJJJn...', '..nJJJJJn..', '.nJJJJJJJn.', 'jnJJJJJJJnj', '.nJJJJJJJn.', '..nJJJJJn..', '...nJJJn...', '.j..nnn..j.', '.....j.....'],
  lune: ['...nnnn....', '..nVVVVn...', '.nVVvnn....', 'nVVvn......', 'nVVn.......', 'nVVn.......', 'nVVvn......', '.nVVvn..nn.', '.nnVVvnnVn.', '..nnVVVVn..', '....nnnn...'],
  colere: [
    '...nn.nn...',
    '..nRn.nRn..',
    '.nRrn.nrRn.',
    'nRrrn.nrrRn',
    'nnnn...nnnn',
    '...........',
    'nnnn...nnnn',
    'nRrrn.nrrRn',
    '.nRrn.nrRn.',
    '..nRn.nRn..',
    '...nn.nn...',
  ],
  larme: [
    '.....n.....',
    '....nBn....',
    '....nBn....',
    '...nBbbn...',
    '...nBbbn...',
    '..nBBbbbn..',
    '..nBbbbbn..',
    '.nBBbbbbbn.',
    '.nBbbbbbbn.',
    '..nbbbbbn..',
    '...nnnnn...',
  ],
  idee: [
    '...nnnnn...',
    '..nJJJjjn..',
    '.nJJJjjjjn.',
    '.nJJjjjjjn.',
    '.nJjjjjjjn.',
    '..njjjjjn..',
    '...njjjn...',
    '...nwwwn...',
    '...nnnnn...',
    '...nwwwn...',
    '....nnn....',
  ],
  merci: [
    '.....n.....',
    '....nJn....',
    '....nJn....',
    '...nJjJn...',
    'nnnJJjJJnnn',
    'nJJJjjjJJJn',
    'nnnJJjJJnnn',
    '...nJjJn...',
    '....nJn....',
    '....nJn....',
    '.....n.....',
  ],
  etoile: [
    '.....n.....',
    '....nJn....',
    '....nJn....',
    '...nJjJn...',
    'nnnnJjjJnnn',
    'nJJJjjjjjJn',
    '.nJjjjjjJn.',
    '..nJjjjjn..',
    '.nJjjnjjjn.',
    '.nJjn.njjn.',
    '.nnn...nnn.',
  ],
  main: [
    '...n.n.n...',
    '..nPnPnPn..',
    '..nPnPnPnn.',
    '..nPnPnPnPn',
    '..nPpPpPnPn',
    'nnnPppppnPn',
    'nPnPpppppPn',
    'nPPpppppppn',
    '.nPppppppn.',
    '..nppppppn.',
    '...nnnnnn..',
  ],
  balai: [
    '.........nn',
    '........nMn',
    '.......nMn.',
    '......nMn..',
    '.....nMn...',
    '...nnnmn...',
    '..nOOOon...',
    '.nOoOoOon..',
    'nOoOoOoon..',
    'nooooooon..',
    '.nnnnnnn...',
  ],
  epees: [
    'nn.......nn',
    'nAn.....nAn',
    '.nAn...nAn.',
    '..nAn.nAn..',
    '...nAnAn...',
    '....nAn....',
    '...nAnan...',
    '.nnan.nann.',
    '.nmn...nmn.',
    'nmn.....nmn',
    'nn.......nn',
  ],
  lettre: [
    '...........',
    'nnnnnnnnnnn',
    'nOnOOOOOnOn',
    'nOOnOOOnOOn',
    'nOOOnOnOOOn',
    'nOOOOnOOOOn',
    'nOOOOOOOOOn',
    'nOOOOOOOOOn',
    'nOOOOOOOOOn',
    'nnnnnnnnnnn',
    '...........',
  ],
  crane: [
    '...nnnnn...',
    '..nWWWWwn..',
    '.nWWWWWwwn.',
    '.nWnnWnnwn.',
    '.nWnnWnnwn.',
    '.nWWWnWwwn.',
    '..nWwwwwn..',
    '..nWnwnwn..',
    '...nnnnn...',
    '...........',
    '...........',
  ],
  son: [
    '......n....',
    '.....nn..n.',
    '....ngn...n',
    'nnnnggn.n.n',
    'nwwnggn..nn',
    'nwwnggn..nn',
    'nwwnggn..nn',
    'nnnnggn.n.n',
    '....ngn...n',
    '.....nn..n.',
    '......n....',
  ],
  muet: [
    '......n....',
    '.....nn....',
    '....ngn....',
    'nnnnggnr..r',
    'nwwnggn.rr.',
    'nwwnggn.rr.',
    'nwwnggnr..r',
    'nnnnggn....',
    '....ngn....',
    '.....nn....',
    '......n....',
  ],
};

function creerGlyphesHD(scene) {
  if (scene.textures.exists('glyphe_crane')) return;
  for (const [nom, lignes] of Object.entries(GLYPHES)) {
    const h = lignes.length, l = Math.max(...lignes.map(s => s.length));
    const tex = scene.textures.createCanvas('glyphe_' + nom, l, h), ctx = tex.getContext();
    lignes.forEach((ligne, y) => [...ligne].forEach((ch, x) => {
      const c = PALETTE_GLYPHES[ch];
      if (c === undefined) return;
      ctx.fillStyle = '#' + c.toString(16).padStart(6, '0');
      ctx.fillRect(x, y, 1, 1);
    }));
    tex.refresh();
  }
}
