// Petits dessins en pixel art, décrits ligne par ligne.
// Chaque lettre est une couleur de la palette, un point est transparent.
// Les textures sont créées une fois au démarrage, puis agrandies sans flou.

const ICONES = {
  ration: {
    pal: { a: 0x7a4a1e, b: 0xd9a35b },
    px: ['........', '..aaaa..', '.abbbba.', 'abbbbbba', 'abababba', 'abbbbbba', '.aaaaaa.', '........'],
  },
  gourde: {
    pal: { a: 0x3b2410, b: 0x8a6a3a, c: 0x5c3a1a, d: 0xa8743c },
    px: ['...aa...', '...bb...', '..cccc..', '.cddddc.', '.cddddc.', '.cddddc.', '..cccc..', '........'],
  },
  epee: {
    pal: { a: 0xdfe6ee, b: 0xc9a227, c: 0x6b4423 },
    px: ['.......a', '......aa', '.....aa.', '....aa..', '.b.aa...', '..bb....', '.cbb....', 'c...b...'],
  },
  fleches: {
    pal: { a: 0xb0b8c0, b: 0x8a5a2b, c: 0xe8e0d0 },
    px: ['.a..a..a', '.b..b..b', '.b..b..b', '.b..b..b', '.b..b..b', '.b..b..b', '.c..c..c', '.c..c..c'],
  },
  potion: {
    pal: { a: 0x7a4a1e, b: 0xcfd8dc, c: 0x9fb4c0, d: 0xd8344a, e: 0xff9aa8 },
    px: ['...aa...', '...bb...', '..cddc..', '.cddddc.', '.cdeddc.', '.cddddc.', '..cccc..', '........'],
  },
  bandage: {
    pal: { a: 0xc8bca8, b: 0xf2ece0, c: 0xd8344a },
    px: ['........', '..aaaa..', '.abbbba.', '.abccba.', '.abbbba.', '..aaaa.b', '......bb', '........'],
  },
  torche: {
    pal: { a: 0xf08a24, b: 0xffe066, c: 0x4a3020, d: 0x7a4a1e },
    px: ['...a....', '..aba...', '..aba...', '...c....', '...d....', '...d....', '...d....', '...d....'],
  },
  corde: {
    pal: { a: 0xc9a46a },
    px: ['..aaaa..', '.a....a.', 'a..aa..a', 'a.a..a.a', 'a..aa..a', '.a....a.', '..aaaa.a', '........'],
  },
  fer: {
    pal: { a: 0x50545c, b: 0xa8b0bc },
    px: ['........', '........', '..aaaa..', '.abbbba.', 'abbbbbba', 'aaaaaaaa', '........', '........'],
  },
  cuir: {
    pal: { a: 0x6b4423, b: 0xa8743c },
    px: ['........', '.a....a.', 'aaaaaaaa', '.abbbba.', '.abbbba.', 'aaaaaaaa', '.a....a.', '........'],
  },
  // Décorations du shop
  carte: {
    pal: { a: 0x7a4a1e, b: 0xead9b0, c: 0xc03030 },
    px: ['aaaaaaaa', 'abbbbbba', 'abcbbbba', 'abbcbbba', 'abbbcbba', 'abbbbcba', 'abbbbbba', 'aaaaaaaa'],
  },
  trophee: {
    pal: { a: 0x7a7e86, e: 0xffd040, b: 0x111111, c: 0x6b4423 },
    px: ['..a..a..', '.aaaaaa.', '.aeaaea.', '.aaaaaa.', '..abba..', '..aaaa..', 'cccccccc', '.cccccc.'],
  },
  lanterne: {
    pal: { a: 0x3a3a40, b: 0xffe066, c: 0xf0a030, d: 0xfff4c0 },
    px: ['...aa...', '..a..a..', '.aaaaaa.', '.abccba.', '.acddca.', '.abccba.', '.aaaaaa.', '..a..a..'],
  },
  enclume: {
    pal: { a: 0x5a5e66, b: 0x6b4423 },
    px: ['........', 'aaaaaaa.', 'aaaaaaaa', '.aaaaa..', '..aaa...', '..aaa...', '.bbbbb..', 'bbbbbbb.'],
  },
  // Nouveaux objets
  antidote: {
    pal: { a: 0x7a4a1e, b: 0xcfd8dc, c: 0x9fb4c0, d: 0x40b060, e: 0xb0f0c0 },
    px: ['...aa...', '...bb...', '..cddc..', '.cddddc.', '.cdeddc.', '.cddddc.', '..cccc..', '........'],
  },
  cape: {
    pal: { a: 0x5a3a1a, b: 0x8a5a2a, c: 0xf0e8d8 },
    px: ['.cccccc.', '.abbbba.', 'abbbbbba', 'abbbbbba', 'abbbbbba', 'abbbbbba', 'abbbbbba', 'aaa..aaa'],
  },
  bouclier: {
    pal: { a: 0x6a6f78, b: 0x8a3a2a, c: 0xe8c040 },
    px: ['aaaaaaaa', 'abbbbbba', 'abbccbba', 'abccccba', 'abbccbba', '.abbbba.', '..abba..', '...aa...'],
  },
  amulette: {
    pal: { a: 0xe8c040, b: 0x6a3aa0, c: 0xc8a0f0 },
    px: ['a......a', '.a....a.', '..a..a..', '...aa...', '..abba..', '.abccba.', '..abba..', '...aa...'],
  },
  // Les pièces de l'Armure du Dernier Rempart.
  heaume: { pal: { a: 0x6a6a7a, b: 0xc8ccd8, c: 0xe8c040, d: 0x1a1a24 }, px: ['...cc...', '..bccb..', '.bbbbbb.', '.bdddddb', '.bbbbbb.', '.bbdbbb.', '.bbbbbb.', '..a..a..'].map(l => l.slice(0, 8)) },
  gantelets: { pal: { a: 0x6a6a7a, b: 0xc8ccd8, c: 0xe07020 }, px: ['.b.b.b..', '.b.b.b.b', '.bbbbbbb', '.bbbbbbb', '.bcbbbb.', '.bbbbbb.', '..aaaa..', '..aaaa..'] },
  spalieres: { pal: { a: 0x6a6a7a, b: 0xc8ccd8, c: 0xe8c040 }, px: ['........', '.bbb.bbb', 'bbcbbcbb', 'bbbb.bbb', 'abba.abb', '.aa...aa', '........', '........'] },
  ceinturon: { pal: { a: 0x5a3a1a, b: 0x8a5a2b, c: 0xe8c040 }, px: ['........', '........', 'aaaaaaaa', 'bbbccbbb', 'bbbc.cbb', 'bbbccbbb', 'aaaaaaaa', '........'] },
  jambieres: { pal: { a: 0x6a6a7a, b: 0xc8ccd8, c: 0xe8c040 }, px: ['.bb..bb.', '.bb..bb.', '.cb..bc.', '.bb..bb.', '.bb..bb.', '.bb..bb.', '.ab..ba.', '.aa..aa.'] },
  solerets: { pal: { a: 0x6a6a7a, b: 0xc8ccd8 }, px: ['........', '........', '.bb..bb.', '.bb..bb.', '.bbb.bbb', 'bbbbbbbb', 'aaaaaaaa', '........'] },
  plastron: { pal: { a: 0x6a6a7a, b: 0xc8ccd8, c: 0xe8c040, d: 0x3a3a48 }, px: ['bb....bb', 'bbbbbbbb', 'bbbccbbb', 'bbcdbcbb', 'bbbdbbbb', '.bbbdbb.', '.bbbbbb.', '..aaaa..'] },
  pavois: { pal: { a: 0x8a6a1a, b: 0x3a5a9a, c: 0xe8c040, d: 0xc8ccd8 }, px: ['aaaaaaaa', 'abbcbbba', 'abccccba', 'abbcbbba', 'abbcbbba', '.abcbba.', '..abba..', '...aa...'] },
  lame: { pal: { a: 0x8a6a1a, b: 0xe8f0ff, c: 0xe8c040, d: 0x8ad0f0 }, px: ['.......b', '......bd', '.....bd.', '....bd..', '.c.bd...', '..cc....', '.a.c....', 'a.......'] },
  // Les cadeaux du Bazar de Rosalie.
  miel: { pal: { a: 0x8a5a1a, b: 0xe8a020, c: 0xf8d060, d: 0xf3e6c8 }, px: ['..dddd..', '..aaaa..', '.abbbba.', 'abccbbba', 'abcbbbba', 'abbbbbba', 'abbbbbba', '.aaaaaa.'] },
  tabac: { pal: { a: 0x5a3a1a, b: 0x8a5a2b, c: 0x3a6a2a, d: 0xc9a046 }, px: ['........', '.aaaaaa.', 'abbbbbba', 'abccccba', 'abccccba', 'abbddbba', 'abbbbbba', '.aaaaaa.'] },
  broche: { pal: { a: 0xc9a046, b: 0xe8c040, c: 0x3a8ad0, d: 0x8ad0f0 }, px: ['...aa...', '..abba..', '.abccba.', 'abcddcba', 'abcccdba', '.abccba.', '..abba..', '...aa...'] },
  livre: { pal: { a: 0x5a1a1a, b: 0x8a2a2a, c: 0xf3e6c8, d: 0xc9a046 }, px: ['aaaaaaa.', 'abbbbbac', 'abddbbac', 'abbbbbac', 'abbddbac', 'abbbbbac', 'abbbbbac', 'aaaaaaa.'] },
  ferACheval: { pal: { a: 0x6a6a70, b: 0xa0a0a8, c: 0x3a8a3a }, px: ['.bb..bb.', '.ab..ba.', '.ab..ba.', '.ab..ba.', '.ab..ba.', '..abba..', '...aa...', '..c..c..'] },
  vin: { pal: { a: 0x2a3a1a, b: 0x5a1a3a, c: 0x8a2a5a, d: 0xf3e6c8 }, px: ['...aa...', '...aa...', '...aa...', '..abba..', '.abccba.', '.abddba.', '.abccba.', '.aaaaaa.'] },
  gateau: { pal: { a: 0x8a5a2b, b: 0xe8c890, c: 0x6a2a6a, d: 0xf8f0f0 }, px: ['........', '...cc...', '.dddddd.', '.dcdcdd.', 'abbbbbba', 'acccccca', 'abbbbbba', '.aaaaaa.'] },
  trefleChance: { pal: { a: 0x2f7a2a, b: 0x4fa83a, c: 0x2a4a1a }, px: ['.bb..bb.', 'baab.aab', 'baaabaab', '.bbaabb.', '.bbaabb.', 'baabaaab', 'baab.aab', '.bb.cbb.'] },
  // Les colis : leur forme dépend de ce qu'il y a dedans.
  sac: {
    pal: { a: 0x7a5a2a, b: 0xb8945a, c: 0xe8d8a8 },
    px: ['...cc...', '..acca..', '..abba..', '.abbbba.', 'abbbbbba', 'abbbbbba', 'abbbbbba', '.aaaaaa.'],
  },
  colisArmes: {
    pal: { a: 0x4a2e14, b: 0x8a5a2b, c: 0xc0c8d0 },
    px: ['aaaaaaaaaaaa', 'abbbbbbbbbba', 'abcccbbcccba', 'abbbbbbbbbba', 'aaaaaaaaaaaa'],
  },
  colisSoins: {
    pal: { a: 0xb0a890, b: 0xf4f0e4, r: 0xd8344a },
    px: ['aaaaaaaa', 'abbbbbba', 'abbrrbba', 'abrrrrba', 'abrrrrba', 'abbrrbba', 'abbbbbba', 'aaaaaaaa'],
  },
  // Le colis ficelé qu'on remet à l'aventurier
  colis: {
    pal: { a: 0x6b4423, b: 0xc9a46a, c: 0xf3e6c8 },
    px: ['aaaaaaaa', 'abbbcbba', 'abbbcbba', 'cccccccc', 'abbbcbba', 'abbbcbba', 'abbbcbba', 'aaaaaaaa'],
  },
  colisOuvert: {
    pal: { a: 0x6b4423, b: 0xc9a46a, d: 0x3b2410 },
    px: ['a......a', 'ad....da', 'addddda.', 'abbbbbba', 'abbbbbba', 'abbbbbba', 'abbbbbba', 'aaaaaaaa'],
  },
  caisse: {
    pal: { a: 0x6b4423, b: 0xa8743c },
    px: ['aaaaaaaa', 'abbbbbba', 'aabbbbaa', 'abababba', 'abbabbba', 'aabbbbaa', 'abbbbbba', 'aaaaaaaa'],
  },
  coffre: {
    pal: { a: 0x6b4423, b: 0xa8743c, c: 0xe8c040 },
    px: ['.aaaaaa.', 'abbbbbba', 'abbbbbba', 'cccccccc', 'abbccbba', 'abbbbbba', 'abbbbbba', 'aaaaaaaa'],
  },
  // Objets de valeur, par catégorie
  tr_arme: {
    pal: { a: 0xc0c8d0, b: 0x7a4a1e },
    px: ['..aaa...', '.aaaab..', '..aab...', '...bb...', '...b....', '..b.....', '.b......', 'b.......'],
  },
  tr_armure: {
    pal: { a: 0xa0a8b4, b: 0x3a3a44 },
    px: ['..aaaa..', '.aaaaaa.', 'aaaaaaaa', 'aabbbbaa', 'aab..baa', 'aab..baa', '.a....a.', '........'],
  },
  tr_bijou: {
    pal: { a: 0xe8c040, c: 0x30a060, d: 0xb0f0d0 },
    px: ['...cc...', '..cddc..', '...cc...', '..aaaa..', '.a....a.', '.a....a.', '..aaaa..', '........'],
  },
  tr_artefact: {
    pal: { a: 0x4a2a6a, b: 0x8a5ac0, c: 0xf0e8ff, d: 0xe8c040 },
    px: ['..aaaa..', '.abbbba.', 'abbcbbba', 'abbbbbba', 'abbbbbba', '.abbbba.', '..aaaa..', '.dddddd.'],
  },
  tr_vetement: {
    pal: { a: 0x5a2a1a, b: 0x9a3a2a },
    px: ['..aaaa..', '.abbbba.', '.abbbba.', 'abbbbbba', 'abbbbbba', 'abbbbbba', 'abbbbbba', 'aaaaaaaa'],
  },
  coeur: {
    pal: { a: 0xd8344a },
    px: ['.aa.aa.', 'aaaaaaa', 'aaaaaaa', '.aaaaa.', '..aaa..', '...a...'],
  },
  coeurVide: {
    pal: { a: 0x4a3a3a },
    px: ['.aa.aa.', 'aaaaaaa', 'aaaaaaa', '.aaaaa.', '..aaa..', '...a...'],
  },
  araignee: {
    pal: { a: 0x2a2030, b: 0x3e2f48, r: 0xff3030 },
    px: ['..a......a..', '...a.bb.a...', 'a...bbbb...a', '.aaabbbbaaa.', '...bbrrbb...', '.aaabbbbaaa.', 'a...bbbb...a', '...a....a...'],
  },
  loup: {
    pal: { a: 0x5a5e66, e: 0xffd040, b: 0x111111 },
    px: ['...........a.a', '..........aaaa', '..........aaea', 'a.aaaaaaaaaaaa', '.aaaaaaaaaaab.', '.aaaaaaaaaaa..', '..aa.....aa...', '..a.a....a.a..', '..a.a....a.a..'],
  },
};

// Corps de base d'un personnage (10 x 16).
// h = cheveux, s = peau, e = yeux, c = tunique, d = ceinture, p = pantalon, b = bottes
const CORPS = [
  '...hhhh...',
  '..hhhhhh..',
  '..hssssh..',
  '..sesses..',
  '..ssssss..',
  '...ssss...',
  '..cccccc..',
  '.cccccccc.',
  'sccccccccs',
  's.dddddd.s',
  '..cccccc..',
  '..pppppp..',
  '..pp..pp..',
  '..pp..pp..',
  '..bb..bb..',
  '.bbb..bbb.',
];

// La taille des peuples, des plus petits aux plus grands : les hobbits (13 pixels), les nains
// (14, un poil plus grands), les humains (16), les elfes (17), les magiciennes (18).
// Les lignes sont celles de CORPS.
const TAILLES_PEUPLES = {
  hobbit: { retirer: [7, 10, 13] },
  nain: { retirer: [10, 13] },
  nainBanquier: { retirer: [10, 13] },
  elfe: { doubler: [12] },
  magicienne: { doubler: [8, 12] },
};
// La hauteur des mains au-dessus du sol, en pixels, pour chaque peuple (calculée plus bas).
const MAINS_PEUPLES = {};

const RACES = {
  // Hobbit : cheveux bouclés, pieds nus.
  hobbit: {
    pal: { h: 0x6b3e1e, s: 0xf0c8a0, e: 0x2a1a10, c: 0x4f7a3a, d: 0x7a4a1e, p: 0x8a6a40, b: 0xf0c8a0 },
    lignes: { 1: '.hhhhhhhh.' },
  },
  // Nain : grande barbe rousse, armure.
  nain: {
    pal: { h: 0xb5532a, s: 0xe8b890, e: 0x2a1a10, c: 0x6a6f78, d: 0x7a4a1e, p: 0x4a3a2a, b: 0x2a1a10 },
    lignes: { 4: '..shhhhs..', 5: '..hhhhhh..', 6: '..chhhhc..', 7: '.ccchhccc.' },
  },
  // Humain : cheveux bruns, tunique rouge.
  humain: {
    pal: { h: 0x3a2a1a, s: 0xe8b890, e: 0x2a1a10, c: 0x9a3a2a, d: 0x5a3a1a, p: 0x4a4a5a, b: 0x3a2a1a },
    lignes: {},
  },
  // Le colporteur qui rapporte les carnets : grand chapeau et cape brune.
  colporteur: {
    pal: { h: 0x4a3a2a, s: 0xe0b088, e: 0x2a1a10, c: 0x6a5a40, d: 0x3a2a1a, p: 0x5a4a3a, b: 0x2a1a10 },
    lignes: { 0: '..hhhhhh..', 1: 'hhhhhhhhhh', 7: 'cccccccccc', 8: 'cccccccccc', 9: 'ccddddddcc', 10: '.cccccccc.' },
  },
  // Le banquier : haut-de-forme, costume noir, chaîne en or.
  banquier: {
    pal: { h: 0x1a1a20, s: 0xf0d0b0, e: 0x2a1a10, c: 0x2a2a34, d: 0xe8c040, p: 0x1a1a20, b: 0x101010 },
    lignes: { 0: '..hhhhhh..', 1: '..hhhhhh..', 2: '.hhhhhhhh.', 4: '..sdssss..' },
  },
  // Les gardes : casque et armure.
  garde: {
    pal: { h: 0x8a909a, s: 0xe0b088, e: 0x2a1a10, c: 0x6a7080, d: 0x7a1a1a, p: 0x3a3a44, b: 0x2a2a30 },
    lignes: { 0: '...hhhh...', 1: '..hhhhhh..', 2: '..hhhhhh..', 3: '..hehheh..' },
  },
  // Le mentor : l'aventurier sauvé de la rivière, barbe grise et cape verte.
  mentor: {
    pal: { h: 0x9a9a9a, s: 0xe8b890, e: 0x2a1a10, c: 0x2f5a3a, d: 0x7a4a1e, p: 0x4a3a2a, b: 0x3a2a1a },
    lignes: { 4: '..shhhhs..', 5: '..hhhhhh..', 6: '..chhhhc..' },
  },
  // Toi : le jeune orphelin...
  heros: {
    pal: { h: 0x8a5a2a, s: 0xf0c8a0, e: 0x2a1a10, c: 0x3a5a8a, d: 0x7a4a1e, p: 0x6a5a40, b: 0x4a3020 },
    lignes: {},
  },
  // ... ou la jeune orpheline.
  heroine: {
    pal: { h: 0xb0602a, s: 0xf0c8a0, e: 0x2a1a10, c: 0x8a3a5a, d: 0x7a4a1e, p: 0x6a5a40, b: 0x4a3020 },
    lignes: { 6: '.hcccccch.', 7: '.hcccccch.' },
  },
  // Le vieux Grippesou : gobelin à capuche, grandes oreilles, sourire avide.
  gobelin: {
    pal: { h: 0x5a3a20, s: 0x7aa04a, e: 0xffd040, m: 0xf0f0d0, c: 0x6a5030, d: 0x3a2a1a, p: 0x5a4a30, b: 0x3a2a1a },
    lignes: { 0: '...hhhh...', 1: '..hhhhhh..', 2: 'shhsssshhs', 3: '.ssessess.', 4: '..smmmms..' },
  },
  // Les banquiers nains : haut-de-forme, monocle, barbe blanche, costume noir.
  nainBanquier: {
    pal: { t: 0x1a1a20, h: 0xe0e0e0, s: 0xe8b890, e: 0x2a1a10, y: 0xe8c040, c: 0x2a2a34, d: 0xe8c040, p: 0x1a1a20, b: 0x101010 },
    lignes: { 0: '..tttttt..', 1: '..tttttt..', 2: '.tttttttt.', 3: '..sesyes..', 4: '..shhhhs..', 5: '..hhhhhh..', 6: '..chhhhc..', 7: '.ccchhccc.' },
  },
  // Magicienne humaine : chapeau pointu et longue robe étoilée.
  magicienne: {
    pal: { h: 0x5a3a8a, s: 0xf0c8a0, e: 0x2a1a10, c: 0x6a4aa0, d: 0xe8c040, p: 0x6a4aa0, b: 0x3a2a50 },
    lignes: { 0: '....hh....', 1: '...hhhh...', 2: '.hhhhhhhh.', 11: '..cccdcc..', 12: '..cccccc..', 13: '.cccccccc.' },
  },
  // Elfe : longs cheveux blonds, oreilles pointues.
  elfe: {
    pal: { h: 0xe8d890, s: 0xf5dcc0, e: 0x205a30, c: 0x2f6a5a, d: 0xc9a227, p: 0x3a4a3a, b: 0x5a3a20 },
    lignes: { 2: '.shsssshs.', 6: '.hcccccch.', 7: '.hcccccch.' },
  },
};

function creerTexture(scene, cle, lignes, palette) {
  const g = scene.make.graphics({ add: false });
  lignes.forEach((ligne, y) => {
    [...ligne].forEach((ch, x) => {
      if (ch === '.') return;
      g.fillStyle(palette[ch], 1);
      g.fillRect(x, y, 1, 1);
    });
  });
  g.generateTexture(cle, lignes[0].length, lignes.length);
  g.destroy();
}

// La Faucheuse : grande robe noire en lambeaux, crâne aux yeux rouges, faux à la main.
const FAUCHEUSE = {
  px: [
    '..lllllllllllw..',
    '.ll.....kk..lw..',
    'l.....kkkkk..w..',
    '.....kkkkkkk.w..',
    '....kkoooookkw..',
    '....kxrooxrkkw..',
    '....kkoooookkw..',
    '....kkoxoxokkw..',
    '...kkkkoookkkw..',
    '..kkkgkkkkgkoo..',
    '..kkgkkkkkkgkw..',
    '.kkkgkkkkkkkkw..',
    '.kkgkkkkkkkgkw..',
    '.kkgkkkkkkkgkw..',
    'kkkgkkkkkkkgkw..',
    'kkgkkkkkkkkkgw..',
    'kkgkkkkkkkkkgw..',
    'kkkkkkkkkkkkkw..',
    '.kkkkkkkkkkkkw..',
    'kk.kk.kkk.kk.w..',
    'k...k..k...k.w..',
  ],
  pal: { k: 0x0d0b10, g: 0x2c2836, o: 0xd8d4c4, x: 0x050405, r: 0xff2a1a, w: 0x4a3a2a, l: 0xc8d0dc },
};

// Les baluchons : un tissu noué au bout d'un bâton. Le motif du tissu dépend de ce qu'il
// y a dedans : carreaux rouges (provisions), toile grise (armes), lin blanc à croix rouge
// (soins), toile brune rapiécée (un peu de tout). Chacun existe aussi « étalé » (le tissu
// posé à plat sur le comptoir pendant qu'on y range les objets).
const TISSUS = {
  provisions: { fond: 0xc0302a, motif: 0xf3e6c8, bord: 0x6a1a14 },
  armes: { fond: 0x8a909a, motif: 0x5a606a, bord: 0x2a2e36 },
  soins: { fond: 0xf4f0e4, motif: 0xd8344a, bord: 0x8a8070 },
  divers: { fond: 0xa87a44, motif: 0x6a8a3a, bord: 0x4a2e14 },
};

// Les baluchons, en HD (deux fois plus de pixels qu'avant) : un tissu noué en boule, plein de
// plis et ombré, attaché au bout d'un bâton ; et le même tissu étalé sur le comptoir.
// Le motif du tissu dépend de ce qu'il contient (provisions, armes, soins, divers).
function creerBaluchons(scene) {
  for (const [famille, c] of Object.entries(TISSUS)) {
    if (scene.textures.exists('poche_' + famille)) continue;
    const motif = (x, y) => {
      if (famille === 'provisions') return ((x >> 2) + (y >> 2)) % 2 === 0;           // vichy
      if (famille === 'soins') return (Math.abs(x - 12) < 2 && Math.abs(y - 16) < 6) || (Math.abs(y - 16) < 2 && Math.abs(x - 12) < 6); // croix
      if (famille === 'armes') return (x + y) % 7 === 0;                                 // grosse toile
      return (x * 3 + y * 5) % 11 === 0;                                                 // petites fleurs
    };
    // (v0.68) deux versions : avec son bâton (sur le comptoir), et la poche seule (qui pend au bout du
    // bâton que le client tient sur l'épaule : le bâton fait alors partie de son corps)
    for (const avecBaton of [true, false]) {
      // (v0.58) Le baluchon HD : une poche de tissu froncée, lourde en bas, avec des plis qui
      // partent du nœud ; une cordelette serrée autour du col, deux oreilles de tissu ; le bâton
      // passe dans le nœud, et on le tient par le bout (en bas à droite de l'image).
      const t = new ToileHD(52, 48);
      Object.assign(t.rampes, RAMPES_DECOR);
      t.rampes.tissu = rampe(c.fond); t.rampes.motif = rampe(c.motif); t.rampes.corde = rampe(0xb89a68);
      t.relief = true;
      // le bâton : du nœud (en haut à gauche) jusqu'à la main (en bas à droite)
      if (avecBaton) traitHD(t, 'chene', [[13, 6], [50, 46]], 1.5);
      // la poche : une poire, plus large en bas ; les plis rayonnent depuis le col
      const poche = (x, y) => {
        const cy = 29, haut = y < cy;
        const rx = haut ? 13 - (cy - y) * 0.18 : 14.5, ry = haut ? 14 : 12.5;
        const nx = (x + 0.5 - 15) / rx, ny = (y + 0.5 - cy) / ry;
        const d = nx * nx + ny * ny;
        return d > 1 ? null : [nx, ny, Math.sqrt(1 - d)];
      };
      const pli = (x, y) => { const a = Math.atan2(y - 14, x - 15); return Math.sin(a * 9 + (y - 14) * 0.08) > 0.72 && y > 17 ? -1 : 0; };
      t.forme('tissu', poche, { motif: pli });
      // le motif du tissu, ombré comme la poche
      for (let y = 16; y < 42; y++) for (let x = 1; x < 30; x++) {
        const n = poche(x, y);
        if (!n || !motif(Math.round(x * 0.9), Math.round(y * 0.9)) || t.mat(x, y) !== 'tissu') continue;
        const lum = Math.round(3 - n[0] * 1.4 - n[1] * 1.2 + pli(x, y));
        t.poser(x, y, 'motif', Math.max(1, Math.min(5, lum)));
      }
      // le col froncé, et ses petits plis serrés
      t.forme('tissu', ellipsoide(15.5, 14.5, 5, 3.4), { decalage: 0.2, motif: (x) => (x % 2 ? -0.6 : 0.3) });
      // les deux oreilles de tissu qui dépassent du nœud
      for (const [ox, sens] of [[10.5, -1], [19.5, 1]]) t.forme('tissu', (x, y) => {
        const h = 12.5 - y; if (h < 0 || h > 8) return null;
        const larg = 2.8 - h * 0.28, cx0 = ox + sens * h * 0.45;
        return Math.abs(x + 0.5 - cx0) < larg ? [sens * 0.5, -0.6, 0.6] : null;
      }, { decalage: 0.3 });
      // la cordelette : deux tours autour du col, et une boucle autour du bâton
      for (const yc of [16, 17.6]) traitHD(t, 'corde', [[10.5, yc], [20.5, yc + 0.4]], 0.75, 0.3);
      traitHD(t, 'corde', [[18, 15], [20, 12], [17, 9.5]], 0.7, 0.4);
      t.contour();
      t.texture(scene, (avecBaton ? 'baluchon_' : 'poche_') + famille);
    }
    {
      const t = new ToileHD(32, 10);
      t.rampes.tissu = rampe(c.fond); t.rampes.motif = rampe(c.motif);
      t.forme('tissu', (x, y) => (y >= 1 && y <= 9 && x >= (y < 3 ? 3 - y : 0) && x <= (y < 3 ? 28 + y : 31) ? [0, (y - 5) / 8, 0.9] : null), { motif: (x, y) => (x % 8 === 0 ? -0.6 : 0) });
      for (let y = 2; y < 9; y++) for (let x = 1; x < 31; x++) if (motif(x, y * 3)) t.poser(x, y, 'motif', 3);
      t.contour();
      t.texture(scene, 'tissu_' + famille);
    }
  }
}

// Les couleurs de l'armure claire, et leur version sombre (fer noir, rouge sang, violet).
const TEINTES_SOMBRES = { 0xc8ccd8: 0x3a3a48, 0x6a6a7a: 0x1e1e26, 0xe8c040: 0xa02040, 0x3a5a9a: 0x4a1a5a,
  0xe8f0ff: 0xd04060, 0x8ad0f0: 0xff6080, 0xe07020: 0xc02040, 0x1a1a24: 0xff3030, 0x8a6a1a: 0x3a1a2a, 0x3a3a48: 0xff4060 };

function creerToutesLesTextures(scene) {
  creerBaluchons(scene);
  creerObjetsHD(scene); // toutes les marchandises en HD, dès le départ
  creerIconesHD(scene); // et les autres icônes (décorations, trésors, armure, cœurs...)
  // Les pièces de l'armure sombre : mêmes formes, autres couleurs.
  for (const p of ARMURE) {
    const ic = ICONES[p.id];
    const pal = Object.fromEntries(Object.entries(ic.pal).map(([k, c]) => [k, TEINTES_SOMBRES[c] ?? c]));
    creerTexture(scene, p.id + '_sombre', ic.px, pal);
  }
  creerTexture(scene, 'perso_faucheuse', FAUCHEUSE.px, FAUCHEUSE.pal);
  for (const [cle, ic] of Object.entries(ICONES)) {
    creerTexture(scene, cle, ic.px, ic.pal);
  }
  for (const [race, r] of Object.entries(RACES)) {
    const base = CORPS.map((l, i) => r.lignes[i] || l);
    // Chaque peuple sa taille : on retire ou on double quelques lignes du corps.
    const t = TAILLES_PEUPLES[race] || {};
    const lignes = [];
    base.forEach((l, i) => {
      if ((t.retirer || []).includes(i)) return;
      lignes.push(l);
      if ((t.doubler || []).includes(i)) lignes.push(l);
      if (i === 9) MAINS_PEUPLES[race] = lignes.length; // la ligne des mains (pour porter le baluchon)
    });
    MAINS_PEUPLES[race] = lignes.length - MAINS_PEUPLES[race] + 1;
    creerTexture(scene, 'perso_' + race, lignes, r.pal);
  }
}

// --- Petits outils d'interface partagés par les scènes ---

// Alegreya (Google Fonts) : une police à l'ancienne mais très lisible ; Georgia si elle manque.
const POLICE = '"Alegreya", Georgia, "Times New Roman", serif';

// Le style des textes. Pour qu'on lise sans plisser les yeux, les petits textes sont
// grossis, et la police est plus épaisse : medium (500) au lieu de normale, extra-gras (800)
// au lieu de gras. Les boutons gardent leur style à eux (`brut`).
// (v1.17) Un gain ou une perte, affiché en direct là où ça se passe (« +1 relation », « −60 p. ») : vert si
// c'est un gain, rouge si c'est une perte ; il monte un peu, reste lisible, puis s'efface.
function gainEnDirect(scene, x, y, texte, positif = true, { taille = 15, duree = 1900, profondeur = 120 } = {}) {
  const t = scene.add.text(x, y, texte, style(taille, positif ? '#c8ffb0' : '#ffb4a8', { fontStyle: 'bold', stroke: positif ? '#14240a' : '#2a0a08', strokeThickness: 5, align: 'center' }))
    .setOrigin(0.5).setDepth(profondeur).setScale(0.6).setAlpha(0);
  scene.tweens.add({ targets: t, scale: 1, alpha: 1, duration: 220, ease: 'Back.easeOut' });
  scene.tweens.add({ targets: t, y: y - 22, duration: duree, ease: 'Sine.easeOut' });
  scene.tweens.add({ targets: t, alpha: 0, delay: duree - 500, duration: 500, onComplete: () => t.destroy() });
  return t;
}

function style(taille, couleur = '#f3e6c8', extra = {}) {
  const { brut, ...reste } = extra;
  let fontStyle = reste.fontStyle || '';
  if (!brut) {
    taille = taille <= 12 ? taille + 2 : taille <= 16 ? taille + 1 : taille;
    const italique = /italic/.test(fontStyle);
    const gras = /bold/.test(fontStyle);
    fontStyle = `${italique ? 'italic ' : ''}${gras ? 800 : 500}`;
  }
  return { fontFamily: POLICE, fontSize: taille + 'px', color: couleur, resolution: typeof ZOOM_ECRAN === 'number' ? Math.max(2, ZOOM_ECRAN + 1) : 3, ...reste, fontStyle };
}

// (v1.01) La narration et les paroles, bien distinctes dans un même texte : ce que le jeu raconte est en
// italique, couleur de vieux parchemin ; ce que les personnages disent (entre « ») est droit, plus clair,
// plus appuyé. Le texte va à la ligne tout seul (`largeur`) ; renvoie un conteneur (à détruire comme un texte).
const COULEUR_NARRATION = '#d6bf98', COULEUR_PAROLE = '#fff8e6';
function texteMixte(scene, x, y, texte, { taille = 14, largeur = 880, align = 'left', narration = COULEUR_NARRATION, parole = COULEUR_PAROLE, interligne = 1.32, extra = {} } = {}) {
  const c = scene.add.container(x, y);
  // les morceaux : [texte, dit] (dit = entre guillemets)
  const morceaux = [];
  let dit = false;
  for (const bout of String(texte).split(/(«|»)/)) {
    if (bout === '«') { dit = true; morceaux.push(['«', true]); continue; }
    if (bout === '»') { morceaux.push(['»', true]); dit = false; continue; }
    if (bout) morceaux.push([bout, dit]);
  }
  const styleDe = (d) => style(taille, d ? parole : narration, { ...extra, fontStyle: d ? 'bold' : 'italic' });
  const mesure = scene.add.text(0, 0, '', styleDe(false)).setVisible(false);
  const largeurDe = (t, d) => { mesure.setStyle(styleDe(d)).setText(t); return mesure.width; };
  const lignes = [[]];
  let ligne = lignes[0], xl = 0;
  const pousser = (t, d) => {   // ajoute un mot (ou une espace) à la ligne en cours, en fusionnant les mêmes styles
    const dernier = ligne[ligne.length - 1];
    if (dernier && dernier.d === d) dernier.t += t; else ligne.push({ t, d });
  };
  for (const [bout, d] of morceaux) {
    for (const [i, para] of bout.split('\n').entries()) {
      if (i > 0) { ligne = []; lignes.push(ligne); xl = 0; }
      for (const mot of para.split(/(\s+)/)) {
        if (!mot) continue;
        const w = largeurDe(mot, d);
        if (/^\s+$/.test(mot)) { if (xl > 0) { pousser(' ', d); xl += w; } continue; }
        if (xl > 0 && xl + w > largeur) { const der = ligne[ligne.length - 1]; if (der) der.t = der.t.replace(/\s+$/, ''); ligne = []; lignes.push(ligne); xl = 0; }
        pousser(mot, d); xl += w;
      }
    }
  }
  mesure.destroy();
  const h = Math.round(taille * 1.25 * interligne);
  lignes.forEach((l, j) => {
    const objets = l.map(({ t, d }) => scene.add.text(0, j * h, t, styleDe(d)).setOrigin(0, 0));
    const total = objets.reduce((a, o) => a + o.width, 0);
    let xo = align === 'center' ? -total / 2 : 0;
    for (const o of objets) { o.x = xo; xo += o.width; c.add(o); }
  });
  c.hauteur = lignes.length * h;
  c.largeurTexte = Math.max(0, ...c.list.map(o => o.x + o.width));
  c.list.forEach(o => { o.bx = o.x; o.by = o.y; });
  // comme un texte : setOrigin(0.5) centre le bloc sur (x, y)
  c.setOrigin = (ox = 0.5, oy = ox) => { const w = align === 'center' ? 0 : c.largeurTexte; c.list.forEach(o => { o.x = o.bx - ox * w; o.y = o.by - oy * c.hauteur; }); return c; };
  return c;
}

// Coupe un texte trop long (avec « … »).
// Empêche un double clic de lancer deux fois la même transition (pendant le fondu au noir).
// Renvoie true si une transition est déjà en cours sur cette scène.
function enTransition(scene) {
  const maintenant = performance.now();
  if (scene._transition && maintenant - scene._transition < 1500) return true;
  scene._transition = maintenant;
  return false;
}

// Un bouton qui reconstruit sa liste en cliquant ne doit pas être déclenché deux fois d'un
// double clic (le second clic tomberait sur la ligne suivante). Renvoie true si le clic compte.
function clicUnique(scene, delai = 400) {
  const maintenant = performance.now();
  if (scene._dernierClic && maintenant - scene._dernierClic < delai) return false;
  scene._dernierClic = maintenant;
  return true;
}

function raccourcir(texte, max) {
  return texte.length > max ? texte.slice(0, max - 1).trimEnd() + '…' : texte;
}

// Bouton en bois cliquable. Renvoie un objet avec setActif(bool).
// (v1.43, planche 70) La plaque suit la maison (rangInterface : sapin brut … ébène et or) et, dès la Maison, porte
// la pierre de son sujet (pierreDe : saphir, topaze, émeraude, rubis, améthyste). Un libellé long garde sa taille :
// une seule pierre, à gauche, et le texte se décale un peu à droite.
function creerBouton(scene, x, y, largeur, texte, action) {
  const rang = typeof rangInterface === 'function' ? rangInterface(scene) : 1;
  let cle = plaqueBouton(scene, largeur), gemme = null, une = false, marge = 16, decal = 0;
  const fond = scene.add.image(x, y, cle).setScale(2).setInteractive({ useHandCursor: true });
  const label = scene.add.text(x, y, texte, style(18, '#fff0d0', { fontStyle: 'bold', stroke: '#24140a', strokeThickness: 4, brut: true })).setOrigin(0.5);
  label.setShadow(0, 2, '#120a04', 0, true, true); // comme gravé dans le bois
  const taille = t => Phaser.GameObjects.Text.prototype.setFontSize.call(label, t);
  // la plaque qui va avec le libellé (sa pierre, une ou deux)
  const plaque = (forcerUne = false) => {
    gemme = rang >= 2 && label.text && label.text !== '...' && typeof pierreDe === 'function' ? pierreDe(label.text) : null;
    une = false;
    if (gemme) { taille(16); une = forcerUne || label.width > largeur - (rang >= 3 ? 64 : 52); }
    cle = rang !== 1 || gemme ? plaqueRang(scene, largeur, rang, gemme, une) : plaqueBouton(scene, largeur);
    marge = gemme ? (une ? (rang >= 3 ? 42 : 30) + (forcerUne ? 24 : 0) : (rang >= 3 ? 64 : 52)) : 16;   // (forcerUne : le picto ☀/☾ à droite)
    decal = une ? (rang >= 3 ? 13 : 9) : 0;
  };
  // (v0.60) le texte tient toujours dans sa plaque : trop long, la police rapetisse
  // (audit v0.61) on repart toujours de la taille voulue : sinon, après un long libellé, le bouton
  // gardait sa petite police pour tous les textes suivants
  let base = 18;
  const tenir = () => {
    let t = base;
    taille(t);
    while (label.text && label.width > largeur - marge && t > 10) taille(--t);
  };
  label.setFontSize = function (t) { base = parseInt(t, 10) || base; tenir(); return this; };
  let actif = true, survol = false;
  const repos = () => {
    if (!fond.active) return;
    fond.setTexture(survol && actif ? cle + '_clair' : cle);
    label.setY(y);
  };
  const habiller = (forcerUne = false) => { plaque(forcerUne); tenir(); label.setX(x + decal); repos(); };
  habiller();
  if (rang >= 4) label.setColor('#fff0c8');
  fond.on('pointerover', () => { survol = true; repos(); });
  fond.on('pointerout', () => { survol = false; repos(); });
  fond.on('pointerdown', () => {
    if (!actif) return;
    Son.jouer('clic');
    fond.setTexture(cle + '_enfonce');
    label.setY(y + 2);
    scene.time.delayedCall(110, repos);
    if (window.noterJournal) noterJournal(`[${scene.scene.key}] « ${label.text} »`);   // (v0.95 : le journal de bord)
    action();
  });
  // (Demeure) la pierre scintille de temps en temps
  if (rang >= 4 && typeof etincelle === 'function' && !fond.parentContainer) {
    const e = etincelle(scene, x - largeur / 2 + 20, y - 7, fond.depth + 0.5);
    const suivre = () => { if (!fond.active) return; e.setVisible(!!gemme && fond.visible && !fond.vide && !fond.parentContainer).setDepth(fond.depth + 0.5).setScrollFactor(fond.scrollFactorX, fond.scrollFactorY); };
    scene.events.on('update', suivre);
    fond.once('destroy', () => { scene.events.off('update', suivre); if (e.active) { scene.tweens.killTweensOf(e); e.destroy(); } });
  }
  return {
    fond, label,
    setActif(a) {
      actif = a;
      repos();
      fond.setTint(a ? 0xffffff : 0x8a8a8a);
      label.setAlpha(a ? 1 : 0.5);
    },
    setVisible(v) { fond.setVisible(v); label.setVisible(v); },
    // (v0.57) un bouton sans texte ne montre pas sa plaque vide ; il revient quand on lui redonne un texte
    setTexte(t) { label.setText(t); habiller(); if (!t) { fond.setVisible(false); fond.vide = true; } else if (fond.vide) { fond.setVisible(true); fond.vide = false; } },
    // (v1.43) pour marquerCamp : la place du libellé, et une seule pierre quand un picto prend la droite
    xLabel() { return x + decal; },
    pierre() { return gemme; },
    uneSeulePierre(oui) { habiller(oui); },
  };
}

// (v0.90) Avec assez de flair, un ☀ ou un ☾ en pixel art sur le bouton d'un choix qui fait pencher
// la balance (camp : 'bien', 'mal' ou null pour l'enlever). Le même bouton peut changer de choix :
// un nouveau texte efface le picto, qu'on repose ensuite s'il le faut.
function marquerCamp(scene, b, camp) {
  const G = window.GAME;
  if (!b || !b.fond || !b.fond.active) return;
  const voir = !!camp && !!G && typeof niveauFlair === 'function' && niveauFlair(G) >= FLAIR_PICTOS;
  if (!b.picto && !voir) return;
  if (!b.picto) {
    creerGlyphesHD(scene);
    const ic = scene.add.image(0, 0, 'glyphe_soleil').setScale(1.8);
    if (b.fond.parentContainer) b.fond.parentContainer.add(ic);
    b.picto = ic;
    const texte = b.setTexte, vis = b.setVisible;
    b.setTexte = t => { texte(t); b.picto.setVisible(false); b.label.setX(b.xLabel ? b.xLabel() : b.fond.x); };
    b.setVisible = v => { vis(v); if (!v) b.picto.setVisible(false); };
  }
  const ic = b.picto;
  ic.setVisible(voir && b.fond.visible);
  if (!voir) { if (b.uneSeulePierre && b.pierre()) b.uneSeulePierre(false); b.label.setX(b.xLabel ? b.xLabel() : b.fond.x); return; }
  ic.setTexture('glyphe_' + (camp === 'bien' ? 'soleil' : 'lune'));
  // (v1.43) un bouton à pierre : la pierre reste à gauche (une seule), le picto prend la droite
  const avecPierre = !!(b.pierre && b.pierre());
  if (avecPierre) b.uneSeulePierre(true);
  ic.setPosition(avecPierre ? b.fond.x + b.fond.displayWidth / 2 - 17 : b.fond.x - b.fond.displayWidth / 2 + 17, b.fond.y).setDepth(b.label.depth + 0.01).setScrollFactor(b.fond.scrollFactorX, b.fond.scrollFactorY);
  b.label.setX(avecPierre ? b.fond.x + 1 : b.fond.x + 9);
  // la première fois : le jeu explique ce que veulent dire le soleil et la lune
  G.tutoVu = G.tutoVu || {};
  if (!G.tutoVu.pictosCamp) {
    G.tutoVu.pictosCamp = true;
    const t = scene.add.text(480, 96, "Ton flair s'aiguise : il te souffle quels choix font pencher la balance. Le soleil, vers la lumière ; la lune, vers l'ombre.",
      style(14, '#fff4dc', { fontStyle: 'italic', backgroundColor: '#1e130aee', padding: { x: 12, y: 8 }, wordWrap: { width: 620 }, align: 'center' })).setOrigin(0.5).setDepth(120).setScrollFactor(0);
    scene.tweens.add({ targets: t, alpha: 0, delay: 6000, duration: 800, onComplete: () => t.destroy() });
  }
}

// Paysage paisible façon « Comté » : ciel, collines, chemin.
// `nuit` assombrit le tout (de 0 à 1).
// Les couleurs de chaque paysage (ciel en haut, ciel en bas, collines lointaines, proches, chemin).
const BIOMES = {
  comte: { ciel: 0x8fd0f0, horizon: 0xf0e4b0, loin: 0x7fb069, pres: 0x5f9a48, chemin: 0xc9a46a, soleil: 0xfff2b0, porte: true },
  foret: { ciel: 0x7ab0c8, horizon: 0xd8e0b0, loin: 0x3f6a3a, pres: 0x2f5a2a, chemin: 0x7a5a3a, soleil: 0xfff2b0, arbres: 0x1f4a22 },
  marais: { ciel: 0x8a9a8a, horizon: 0xb0b890, loin: 0x5a6a3a, pres: 0x4a5a30, chemin: 0x4a5a40, soleil: 0xd8e0c0, roseaux: 0x6a7a3a },
  mines: { ciel: 0x9ab0c0, horizon: 0xd0c8b0, loin: 0x7a7a80, pres: 0x5a5a60, chemin: 0x8a7a6a, soleil: 0xfff2b0, pics: 0x6a6a70 },
  desert: { ciel: 0xa0d0f0, horizon: 0xf8e0a0, loin: 0xe0c080, pres: 0xd0a860, chemin: 0xe8d0a0, soleil: 0xfff8d0 },
  neige: { ciel: 0xb0d0f0, horizon: 0xf0f4ff, loin: 0xe0e8f0, pres: 0xf8fbff, chemin: 0xd0d8e0, soleil: 0xffffff, pics: 0xc8d4e4 },
  ruines: { ciel: 0x6a6080, horizon: 0xa090a0, loin: 0x5a5060, pres: 0x4a4050, chemin: 0x6a6070, soleil: 0xd0c8e0, colonnes: 0x8a8090 },
  antre: { ciel: 0x5a2a2a, horizon: 0xc06030, loin: 0x4a2a20, pres: 0x3a1a18, chemin: 0x5a3a30, soleil: 0xff9040, pics: 0x2a1410 },
  // Les terres de lumière...
  monastere: { ciel: 0xa8d8e8, horizon: 0xf8f0c0, loin: 0x8ab868, pres: 0x6a9a48, chemin: 0xd8c08a, soleil: 0xfff2b0, arbres: 0x4a7a2a },
  sanctuaire: { ciel: 0xc0e0f0, horizon: 0xf8f8e0, loin: 0x9ac8a8, pres: 0x7ab08a, chemin: 0xe0d8b0, soleil: 0xffffe0, arbres: 0xb8c8c8 },
  citadelle: { ciel: 0x9ac0e0, horizon: 0xf0e8d0, loin: 0xa0a8b0, pres: 0x8a9098, chemin: 0xc8c0b0, soleil: 0xfff8d0, colonnes: 0xe8e4d8 },
  // ... et les terres d'ombre.
  bourbier: { ciel: 0x6a6a4a, horizon: 0x9a9a60, loin: 0x4a4a28, pres: 0x3a3a1e, chemin: 0x5a4a2a, soleil: 0xc8c870, roseaux: 0x5a5a2a },
  repaire: { ciel: 0x2a1a2a, horizon: 0x7a2a2a, loin: 0x2a2a2a, pres: 0x1a1a18, chemin: 0x3a2a20, soleil: 0xd03020, arbres: 0x101810 },
  tour: { ciel: 0x2a1a3a, horizon: 0x6a3a7a, loin: 0x3a2a4a, pres: 0x2a1a30, chemin: 0x4a3a50, soleil: 0xb080e0, colonnes: 0x4a3a5a },
  // Le grand monde (v0.54)
  cote: { ciel: 0x8ac8e8, horizon: 0xe8f0e0, loin: 0x5a90b0, pres: 0x8aa868, chemin: 0xd0c090, soleil: 0xfff2b0 },
  opale: { ciel: 0xc8c0f0, horizon: 0xf8e8ff, loin: 0xa098d0, pres: 0x7a88b0, chemin: 0xd8d0f0, soleil: 0xffffff, colonnes: 0xe8e0ff },
  badlands: { ciel: 0xd0a080, horizon: 0xf0c890, loin: 0x9a5a3a, pres: 0x7a4a2a, chemin: 0xa07050, soleil: 0xfff0c0, pics: 0x8a4a30 },
  nuitPourpre: { ciel: 0x3a1a3a, horizon: 0x8a3a5a, loin: 0x3a2038, pres: 0x281828, chemin: 0x4a3048, soleil: 0xf0e0f0, colonnes: 0x5a3a5a, arbres: 0x1a1020 },
};

// Un paysage (la Comté par défaut, ou un autre biome). `nuit` assombrit le tout (de 0 à 1).
// `nuit` : de 0 (jour) à 1 (nuit), ou 'aube'.
function dessinerComte(g, x, y, w, h, nuit = 0, biome = 'comte') {
  // Le paysage est peint en HD (voir exterieurHD.js) et glissé juste sous `g`, qui reste
  // disponible pour dessiner par-dessus.
  const scene = g.scene;
  const cle = paysageHD(scene, w, h, biome, nuit);
  const tex = scene.textures.get(cle).getSourceImage();
  const image = scene.add.image(x, y, cle).setOrigin(0).setScale(w / tex.width, h / tex.height).setDepth(g.depth);
  if (g.parentContainer) g.parentContainer.addAt(image, g.parentContainer.getIndex(g));
  else if (scene.children.moveBelow) scene.children.moveBelow(image, g);
  else image.setDepth(g.depth - 0.001);
  if (g.paysage) g.paysage.destroy();
  g.paysage = image;
  return image;
}

// --- Ton personnage, construit à partir de la création ---

// L'apparence par défaut, selon que tu joues un garçon ou une fille.
function apparenceParDefaut(feminin) {
  return { coiffure: feminin ? 1 : 0, cheveux: 0, peau: 0, yeux: 0, bouche: 0, barbe: 0, couleurBarbe: 0, haut: feminin ? 1 : 0, bas: 0, bottes: 0 };
}

// La texture du joueur à son âge actuel (créée si besoin).
// (v1.48) L'apparence du jour (la barbe ou les cheveux poussés, les marques du temps) et sa signature :
// le joueur est redessiné quand sa tenue change, ou quand sa barbe a poussé
function apparenceDuJour(G) { return typeof apparenceJoueur === 'function' ? apparenceJoueur(G) : G.joueur.apparence; }
function signatureJoueur(G) { return (G.tenue || []).join(',') + '|' + Object.values(G.joueur.apparence || {}).join('.') + (typeof signaturePilosite === 'function' ? '|' + signaturePilosite(G) : ''); }   // (v1.49 : la coupe et les couleurs aussi)
function textureJoueur(scene, G, vue = 'face') {
  // (on redessine le joueur quand sa tenue change : ce qu'il achète à la garde-robe, il le porte)
  const tenue = signatureJoueur(G);
  if (!scene.textures.exists('joueur_petit') || scene.textures.get('joueur_petit').tenue !== tenue) creerTexturesJoueur(scene, apparenceDuJour(G), G.joueur.feminin, G.tenue || [], tenue);
  const stade = stadeJoueur(G);
  if (vue === 'face') return 'joueur_' + stade;
  // Sous un autre angle (de trois-quarts, il regarde vers la droite : à retourner pour regarder à gauche)
  const cle = `joueur_${stade}_${vue}`;
  if (!scene.textures.exists(cle) || scene.textures.get(cle).tenue !== tenue) {
    // (v1.05) avec ses deux images de pas, pour qu'il marche vraiment sous cet angle aussi
    for (const [pas, k] of [[0, cle], [-1, cle + '_pas1'], [1, cle + '_pas2']]) {
      if (scene.textures.exists(k)) scene.textures.remove(k);
      dessinerJoueurHD(apparenceDuJour(G), stade, G.joueur.feminin, pas, G.tenue || [], vue).texture(scene, k);
    }
    scene.textures.get(cle).tenue = tenue;
  }
  return cle;
}

// Crée (ou recrée) les trois textures du joueur, en HD : joueur_petit, joueur_adulte, joueur_ancien.
// (v0.68) Le joueur assis (sur un banc) : renvoie la clé de la texture ; ses pieds sont à PIEDS_ASSIS[clé]
function textureJoueurAssis(scene, G) {
  const stade = stadeJoueur(G), tenue = signatureJoueur(G);
  const cle = `joueur_${stade}_assis`;
  if (!scene.textures.exists(cle) || scene.textures.get(cle).tenue !== tenue) {
    if (scene.textures.exists(cle)) scene.textures.remove(cle);
    const t = dessinerJoueurHD(apparenceDuJour(G), stade, G.joueur.feminin, 0, G.tenue || [], 'troisQuarts', 'assis');
    t.texture(scene, cle);
    scene.textures.get(cle).tenue = tenue;
    PIEDS_ASSIS[cle] = t.piedsAssis;
    scene.textures.get(cle).tailleAssis = t.tailleAssis;
  }
  return cle;
}

// (v1.44) Asseoir le joueur sur un lit, un rebord... : sa taille posée à la hauteur `yAssise` (et non ses pieds par terre)
function asseoirJoueurSur(scene, heros, G, x, yAssise) {
  const cle = textureJoueurAssis(scene, G), tex = scene.textures.get(cle), pieds = PIEDS_ASSIS[cle];
  heros.setTexture(cle).setOrigin(0.5, (pieds + 1) / heros.height);
  const taille = tex.tailleAssis !== undefined ? tex.tailleAssis : pieds - 14;
  return heros.setX(x).setY(yAssise + (pieds - taille + 3) * heros.scaleY);
}

// (v1.00) Le joueur dans une pose (grimper, bras levés...) et sous un angle : renvoie la clé de la texture
function textureJoueurPose(scene, G, vue, pose) {
  const stade = stadeJoueur(G), tenue = signatureJoueur(G);
  const cle = `joueur_${stade}_${vue}_${pose}`;
  if (!scene.textures.exists(cle) || scene.textures.get(cle).tenue !== tenue) {
    if (scene.textures.exists(cle)) scene.textures.remove(cle);
    const t = dessinerJoueurHD(apparenceDuJour(G), stade, G.joueur.feminin, 0, G.tenue || [], vue, pose);
    t.texture(scene, cle);
    scene.textures.get(cle).tenue = tenue;
    if (t.mainXY) MAINS_XY[cle] = { x: t.mainXY[0] - t.l / 2, y: t.h - t.mainXY[1] };   // (v1.35 : pour lui mettre un objet en main)
  }
  return cle;
}

function creerTexturesJoueur(scene, ap, feminin = false, tenue = [], signature = tenue.join(',')) {
  for (const stade of ['petit', 'adulte', 'ancien']) {
    dessinerJoueurHD(ap, stade, feminin, 0, tenue).texture(scene, 'joueur_' + stade);
    dessinerJoueurHD(ap, stade, feminin, -1, tenue).texture(scene, 'joueur_' + stade + '_pas1');
    dessinerJoueurHD(ap, stade, feminin, 1, tenue).texture(scene, 'joueur_' + stade + '_pas2');
    scene.textures.get('joueur_' + stade).tenue = signature;
  }
}

// La caravane du vieux Grippesou.
function dessinerCaravane(scene, x, sol) {
  const g = scene.add.graphics();
  // Bâche
  g.fillStyle(0xd8c498).fillEllipse(x, sol - 120, 230, 150);
  g.fillStyle(0x8a5a2b).fillRect(x - 120, sol - 110, 240, 70);
  g.lineStyle(2, 0x6b4423);
  for (let i = -100; i <= 100; i += 40) g.lineBetween(x + i, sol - 110, x + i, sol - 40);
  // Rapiéçages
  g.fillStyle(0xa86a40).fillRect(x - 60, sol - 170, 24, 18).fillRect(x + 30, sol - 150, 18, 14);
  // Roues
  for (const dx of [-80, 80]) {
    g.fillStyle(0x3b2410).fillCircle(x + dx, sol - 30, 30);
    g.fillStyle(0x6b4423).fillCircle(x + dx, sol - 30, 24);
    g.lineStyle(3, 0x3b2410);
    for (let a = 0; a < Math.PI; a += Math.PI / 4) {
      g.lineBetween(x + dx - Math.cos(a) * 24, sol - 30 - Math.sin(a) * 24, x + dx + Math.cos(a) * 24, sol - 30 + Math.sin(a) * 24);
    }
  }
  // Lanterne accrochée
  g.fillStyle(0x3a3a40).fillRect(x + 118, sol - 112, 4, 16);
  g.fillStyle(0xffd060).fillRect(x + 113, sol - 98, 14, 16);
  return g;
}

// Une pastille de couleur avec le nom de l'état d'un objet (rouge = cassé ... or = parfait).
// Renvoie les deux objets créés, pour les ajouter à un conteneur.
function pastilleEtat(scene, x, y, etat, taille = 12) {
  const e = ETATS[etat];
  const fond = scene.add.rectangle(x, y, 74, taille + 8, e.couleur).setStrokeStyle(1, 0x2a1a10).setOrigin(0, 0.5);
  const texte = scene.add.text(x + 37, y, e.nom, style(taille, etat === 2 || etat === 4 ? '#2a1a10' : '#fff4dc', { fontStyle: 'bold' })).setOrigin(0.5);
  return [fond, texte];
}

// Le mannequin de l'Armure du Dernier Rempart, dans ta chambre. Les pièces reçues sont en
// couleur, celles qui manquent ne sont qu'une ombre. `u` : la taille d'un pixel. `cote` : 'clair'
// (Armure du Dernier Rempart) ou 'sombre' (Armure de la Nuit Éternelle).
function dessinerMannequin(scene, x, sol, possedees, u = 4, cote = 'clair') {
  const g = scene.add.graphics();
  const r = (couleur, ux, uy, w, h) => g.fillStyle(couleur).fillRect(x + ux * u, sol - (uy + h) * u, w * u, h * u);
  // Le support en bois : socle, poteau, épaules, et une tête ronde.
  r(0x3a2410, -6, 0, 12, 2); r(0x5a3a1c, -1, 2, 2, 30); r(0x5a3a1c, -7, 25, 14, 1);
  r(0x5a3a1c, -7, 18, 1, 7); r(0x5a3a1c, 6, 18, 1, 7); r(0x7a5230, -2, 31, 4, 5);
  r(0x8a6238, -6, 1.5, 12, 0.5);
  // Les pièces, en HD : en couleur si on les a, sinon une ombre pâle à leur place.
  creerIconesHD(scene);
  const c = scene.add.container(0, 0, [g]);
  const e = u / 4;
  const places = {
    solerets: [0, 3, 2.4, 0], jambieres: [0, 8.5, 2.6, 0], ceinturon: [0, 14, 2.4, 0], plastron: [0, 20, 2.8, 0],
    gantelets: [0, 16, 3.2, 0], spalieres: [0, 25, 3.4, 0], heaume: [0, 33.5, 2.4, 0], pavois: [-12, 7, 3, 0],
  };
  for (const p of ARMURE) {
    const [ux, uy, echelle, angle] = places[p.id] || [0, 0, 2, 0];
    const img = scene.add.image(x + ux * u, sol - uy * u, iconeObjet(scene, p.id + (cote === 'sombre' ? '_sombre' : ''))).setScale(echelle * e).setAngle(angle);
    if (!possedees.includes(p.id)) img.setTintFill(0xe8dcc0).setAlpha(0.14);
    c.add(img);
  }
  return c;
}


// Étape 9a. La jauge lumière ⟷ ombre : une barre violette à gauche, dorée à droite, et un curseur.
// `valeur` de −100 à +100. Renvoie un conteneur centré en (x, y), large de `l`.
// (v0.90) Les teintes de la balance : le blanc du milieu se fond peu à peu dans le violet (l'ombre,
// à gauche) et dans le jaune (la lumière, à droite), par petits paliers comme en pixel art
const TEINTES_JAUGE = [[-100, 0x2a1652], [-75, 0x3e2478], [-55, 0x5a3a9a], [-40, 0x7e62bc], [-30, 0xa490d4], [-20, 0xc8bce4], [-10, 0xe6e0f0], [0, 0xf8f4ea],
  [10, 0xf6eed0], [20, 0xf2e2a0], [30, 0xeed27a], [40, 0xe8c050], [55, 0xe0a828], [75, 0xcc8a16], [100, 0xa86a0e]];
function couleurJauge(v) {
  for (let i = 0; i < TEINTES_JAUGE.length - 1; i++) {
    const [v0, c0] = TEINTES_JAUGE[i], [v1, c1] = TEINTES_JAUGE[i + 1];
    if (v <= v1) return (v - v0) / (v1 - v0) < 0.5 ? c0 : c1;
  }
  return TEINTES_JAUGE[TEINTES_JAUGE.length - 1][1];
}
// Dessine le dégradé de la balance dans un Graphics (de x à x + l), avec la zone neutre en pointillés
function peindreJauge(g, x, y, l, h, { pas = 2, paliers = true } = {}) {
  const n = Math.max(1, Math.floor(l / pas)), w = l / n;
  for (let i = 0; i < n; i++) g.fillStyle(couleurJauge(-100 + 200 * (i + 0.5) / n), 1).fillRect(x + i * w, y, Math.ceil(w), h);
  const r = Math.max(1, Math.round(h / 6));
  g.fillStyle(0xffffff, 0.22).fillRect(x, y, l, r);
  g.fillStyle(0x000000, 0.18).fillRect(x, y + h - r, l, r);
  const X = v => x + l / 2 + v / 100 * (l / 2);
  if (h >= 6) for (const b of [-25, 25]) for (let k = 0; k < h; k += 3) g.fillStyle(0x5a4a3a, 0.8).fillRect(X(b) - 0.5, y + k, 1, Math.min(2, h - k));
  if (paliers) for (const p of [60, 90]) for (const sg of [-1, 1]) g.fillStyle(0x2a1a10, 1).fillRect(X(sg * p) - 1, y - 4, 2, 4);
  return X;
}

function barreJauge(scene, x, y, l, valeur, { h = 10, textes = true } = {}) {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  const X = peindreJauge(g, -l / 2, -h / 2, l, h);
  g.lineStyle(2, 0x2a1a10, 1).strokeRect(-l / 2, -h / 2, l, h);
  const cx = X(Math.max(-100, Math.min(100, valeur)));
  g.fillStyle(0xfff4dc, 1).fillTriangle(cx - 6, -h / 2 - 8, cx + 6, -h / 2 - 8, cx, -h / 2 - 1);
  g.lineStyle(1, 0x2a1a10, 1).strokeTriangle(cx - 6, -h / 2 - 8, cx + 6, -h / 2 - 8, cx, -h / 2 - 1);
  g.fillStyle(0x2a1a10, 1).fillRect(cx - 2, -h / 2, 4, h);
  g.fillStyle(0xfff4dc, 1).fillRect(cx - 1, -h / 2 + 1, 2, h - 2);
  c.add(g);
  if (textes) {
    c.add(scene.add.text(-l / 2, h / 2 + 2, 'Ombre', style(10, '#4a2a7a', { fontStyle: 'bold' })));
    c.add(scene.add.text(0, h / 2 + 2, 'zone neutre', style(10, '#6a5a48', { fontStyle: 'bold italic' })).setOrigin(0.5, 0));
    c.add(scene.add.text(l / 2, h / 2 + 2, 'Lumière', style(10, '#8a6a08', { fontStyle: 'bold' })).setOrigin(1, 0));
  }
  return c;
}

// (v0.68) Changer de scène proprement : toutes les caméras (interface comprise) passent au noir,
// puis la scène suivante démarre. Sinon, pendant qu'elle se prépare (les textures se dessinent),
// l'écran figé gardait la case de dialogue de la scène d'avant pendant une demi-seconde.
function allerA(scene, cle, donnees = {}, duree = 220) {
  if (scene.enPartance) return;
  scene.enPartance = true;
  scene.events.once('shutdown', () => { scene.enPartance = false; });
  for (const cam of scene.cameras.cameras) cam.fadeOut(duree, 0, 0, 0);
  scene.cameras.main.once('camerafadeoutcomplete', () => scene.scene.start(cle, donnees));
}

// (v0.68) Le texte qui s'écrit lettre après lettre, avec un petit bruit, comme dans Pokémon. On
// coupe d'abord le texte complet en lignes (pour qu'un mot ne saute pas à la ligne en cours
// d'écriture), puis on le dévoile. Renvoie { enCours(), finir() } : un clic pendant l'écriture
// affiche tout d'un coup.
function texteQuiDefile(scene, objet, texte, { depuis = 0, vitesse = 24, son = true } = {}) {
  if (objet.defile) objet.defile.remove();
  objet.defile = null;
  objet.setText(texte);
  const lignes = objet.getWrappedText ? objet.getWrappedText(texte).join('\n') : texte;
  const ctl = { enCours: () => !!objet.defile, finir: () => { if (objet.defile) { objet.defile.remove(); objet.defile = null; } if (objet.active) objet.setText(lignes); } };
  if (!texte || depuis >= lignes.length) { objet.setText(lignes); return ctl; }
  let n = depuis;
  objet.setText(lignes.slice(0, n));
  objet.defile = scene.time.addEvent({ delay: vitesse, loop: true, callback: () => {
    if (!objet.active) { ctl.finir(); return; }
    n++;
    while (n < lignes.length && lignes[n - 1] === ' ') n++;
    objet.setText(lignes.slice(0, n));
    if (son && n % 3 === 0 && /\S/.test(lignes[n - 1])) Son.jouer('lettre');
    if (n >= lignes.length) ctl.finir();
  } });
  return ctl;
}

// (v0.68) Des pièces qui volent de ta main jusqu'à quelqu'un (la sébile du mendiant, une main
// tendue...) : chacune décrit un arc en tournant, et tinte en arrivant. `fin` quand la dernière est là.
function voleePieces(scene, x0, y0, x1, y1, n, { conteneur = null, profondeur = 50, fin = null } = {}) {
  creerPiecesHD(scene);
  const total = Math.max(1, Math.min(6, n));
  for (let k = 0; k < total; k++) {
    const p = scene.add.image(x0 + (Math.random() - 0.5) * 20, y0, 'pieceFace').setScale(2.4).setDepth(profondeur);
    if (conteneur) conteneur.add(p);
    const dx = x1 + (Math.random() - 0.5) * 16, duree = 520 + Math.random() * 120, retard = k * 110;
    scene.tweens.add({ targets: p, x: dx, duration: duree, delay: retard, ease: 'Linear' });
    scene.tweens.add({ targets: p, scaleX: { from: 2.4, to: 0.4 }, duration: 120, yoyo: true, repeat: Math.round(duree / 240), delay: retard });   // elle tourne sur elle-même
    scene.tweens.add({ targets: p, y: Math.min(y0, y1) - 70, duration: duree * 0.45, delay: retard, ease: 'Quad.easeOut', onComplete: () => {
      scene.tweens.add({ targets: p, y: y1, duration: duree * 0.55, ease: 'Quad.easeIn', onComplete: () => {
        Son.jouer('piece');
        scene.tweens.add({ targets: p, alpha: 0, duration: 250, delay: 150, onComplete: () => p.destroy() });
        if (k === total - 1 && fin) fin();
      } });
    } });
  }
}

// (v0.68) Une bulle de pensée au-dessus de quelqu'un : trois petites bulles qui montent, puis un
// nuage avec une image dedans (ce qui le rend heureux). Elle s'efface toute seule.
function bullePensee(scene, x, y, image, { conteneur = null, echelle = 2, duree = 2600, cote = 1, profondeur = 60 } = {}) {
  const c = scene.add.container(0, 0).setDepth(profondeur);
  if (conteneur) conteneur.add(c);
  const bx = x + cote * 64, by = y - 76;
  [[x + cote * 6, y - 4, 4], [x + cote * 20, y - 18, 6], [x + cote * 36, y - 34, 8]].forEach(([px, py, r], i) => {
    const b = scene.add.circle(px, py, r, 0xfff8e8).setStrokeStyle(2, 0x3b2410).setScale(0);
    c.add(b);
    scene.tweens.add({ targets: b, scale: 1, duration: 180, delay: i * 130, ease: 'Back.easeOut' });
  });
  const nuage = scene.add.container(bx, by).setScale(0);
  const g = scene.add.graphics();
  const ronds = [[-38, 4, 26], [0, -10, 32], [38, 2, 26], [-16, 18, 24], [18, 18, 24]];
  g.fillStyle(0x3b2410); for (const [dx, dy, r] of ronds) g.fillCircle(dx, dy, r + 2.5);
  g.fillStyle(0xfff8e8); for (const [dx, dy, r] of ronds) g.fillCircle(dx, dy, r);
  const img = scene.add.image(0, 4, image).setScale(echelle);
  nuage.add([g, img]); c.add(nuage);
  scene.tweens.add({ targets: nuage, scale: 1, duration: 300, delay: 400, ease: 'Back.easeOut' });
  scene.tweens.add({ targets: img, y: 0, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 700 });
  scene.tweens.add({ targets: c, alpha: 0, delay: duree, duration: 400, onComplete: () => c.destroy() });
  return c;
}

// (v0.68) Des yeux qui guettent dans le noir : deux yeux en amande qui luisent (pas de simples
// points qu'on prendrait pour des baies), une pupille fendue, un halo de lumière autour, et ils
// clignent de temps en temps. Renvoie un conteneur (on joue sur son alpha pour les faire apparaître).
function yeuxDansLeNoir(scene, x, y, couleur = 0xffd040, { ecart = 13, taille = 1, profondeur = 6.9 } = {}) {
  creerHalo(scene);
  const c = scene.add.container(x, y).setDepth(profondeur).setScale(taille);
  c.add(scene.add.image(0, 0, 'halo').setScale(0.55, 0.32).setTint(couleur).setAlpha(0.5).setBlendMode(Phaser.BlendModes.ADD));
  const yeux = [];
  for (const sens of [-1, 1]) {
    const o = scene.add.container(sens * ecart / 2, 0);
    // l'amande : penchée vers le nez (un regard mauvais), avec un liseré plus sombre
    o.add(scene.add.ellipse(0, 0, 11, 6, 0x3a2400).setAngle(sens * 14));
    o.add(scene.add.ellipse(0, 0, 9, 4.5, couleur).setAngle(sens * 14));
    o.add(scene.add.ellipse(0, -0.6, 5, 1.6, 0xfff8c0, 0.9).setAngle(sens * 14));   // le reflet
    o.add(scene.add.rectangle(0, 0, 1.6, 4.4, 0x140800));                            // la pupille fendue
    c.add(o); yeux.push(o);
  }
  // un clignement, de temps en temps (les deux yeux ensemble)
  const ev = scene.time.addEvent({ delay: 1800 + Math.random() * 1400, loop: true, callback: () => {
    if (!c.active) return;
    scene.tweens.add({ targets: yeux, scaleY: 0.1, duration: 70, yoyo: true });
  } });
  c.once('destroy', () => ev.remove());   // (v0.97)
  return c;
}

// (v0.69) Le joueur change de tenue : on redessine ses textures, puis on rebranche toutes les images
// de la scène qui les montraient (sinon elles pointent vers une texture détruite et le rendu casse).
function rafraichirJoueur(scene, G) {
  creerTexturesJoueur(scene, apparenceDuJour(G), G.joueur.feminin, G.tenue || [], signatureJoueur(G));
  const tous = l => l.flatMap(o => (o.list ? [o, ...tous(o.list)] : [o]));
  for (const o of tous(scene.children.list)) {
    if (o.texture && /^joueur_(petit|adulte|ancien)(_pas[12])?$/.test(o.texture.key)) o.setTexture(o.texture.key);
  }
}

// --- (v0.70) Les effets de fumée et d'eau : des particules CC0 de Kenney (www.kenney.nl),
// ramenées à notre grille de pixels et à notre palette (voir docs/essais-assets), animées ici. ---
const FX_IMAGES = ['fumee0', 'fumee1', 'fumee2', 'fumee3', 'fumee4', 'fumee5', 'fumee6', 'fumee7', 'jet1', 'jet2', 'jet3', 'jet4', 'goutte', 'rond'];
function chargerFx(scene) {
  for (const f of FX_IMAGES) if (!scene.textures.exists('fx_' + f)) scene.load.image('fx_' + f, 'assets/fx/' + f + '.png');
}

// Une bouffée de fumée qui monte, s'élargit, dérive avec le vent et s'efface
function bouffeeFumee(scene, x, y, { echelle = 2, monte = 120, vent = 50, duree = 3400, alpha = 0.85, profondeur = null, conteneur = null, teinte = null } = {}) {
  let s;
  if (scene.textures.exists('fx_fumee0')) s = scene.add.image(x, y, 'fx_fumee' + Math.floor(Math.random() * 8)).setScale(echelle * 0.5).setAlpha(alpha).setAngle(Math.random() * 360);
  else { creerHalo(scene); s = scene.add.image(x, y, 'halo').setScale(0.15).setTint(0xd0d0d0).setAlpha(0.5); }
  if (teinte) s.setTint(teinte);
  if (profondeur !== null) s.setDepth(profondeur);
  if (conteneur) conteneur.add(s);
  const fin = scene.textures.exists('fx_fumee0') ? echelle * (1.4 + Math.random() * 0.5) : 0.45;
  scene.tweens.add({ targets: s, y: y - monte * (0.8 + Math.random() * 0.4), x: x + vent * (0.7 + Math.random() * 0.6), scale: fin, alpha: 0, angle: s.angle + 50, duration: duree * (0.9 + Math.random() * 0.25), ease: 'Sine.easeOut', onComplete: () => s.destroy() });
  return s;
}

// Une éclaboussure à la surface de l'eau : une couronne de jets, des gouttes qui retombent en
// cloche, et des ronds qui s'élargissent. `taille` 1 = une pierre ; 2 = quelqu'un qui tombe.
function eclaboussure(scene, x, y, { taille = 1, profondeur = null, conteneur = null, ronds = true } = {}) {
  const E = 2 * taille, ok = scene.textures.exists('fx_jet1');
  const ajout = o => { if (profondeur !== null) o.setDepth(profondeur); if (conteneur) conteneur.add(o); return o; };
  if (ok) for (let k = 0; k < 9; k++) {
    const a = (k - 4) * 0.22;
    const j = ajout(scene.add.image(x + (k - 4) * 2 * taille, y, 'fx_jet' + (1 + (k % 4))).setOrigin(0.5, 1).setScale(E * 1.1, E * (1.2 + Math.random() * 0.9)).setRotation(a));
    scene.tweens.add({ targets: j, scaleY: 0.2, alpha: 0, duration: 420 + Math.random() * 140, ease: 'Quad.easeOut', onComplete: () => j.destroy() });
  }
  for (let k = 0; k < 10 + 4 * taille; k++) {
    const d = ajout(ok ? scene.add.image(x, y - 4, 'fx_goutte').setScale(E * (0.5 + Math.random() * 0.5)) : scene.add.circle(x, y - 4, 2 + Math.random() * 2, 0xe8fcff, 0.9));
    const vx = (Math.random() - 0.5) * 120 * taille, h = (34 + Math.random() * 50) * taille, t = 560 + Math.random() * 280;
    scene.tweens.add({ targets: d, x: x + vx, duration: t });
    scene.tweens.add({ targets: d, y: y - 4 - h, duration: t / 2, ease: 'Quad.easeOut', yoyo: true, onComplete: () => d.destroy() });
  }
  if (ronds) for (let k = 0; k < 3; k++) {
    const r = ajout(ok ? scene.add.image(x, y + 2, 'fx_rond').setScale(E * 0.4, E * 0.3).setAlpha(0.9) : scene.add.ellipse(x, y + 2, 14, 4).setStrokeStyle(2, 0xe8fcff, 0.8));
    scene.tweens.add({ targets: r, scaleX: ok ? E * 2 : 5, scaleY: ok ? E * 1 : 3, alpha: 0, delay: k * 240, duration: 1200, onComplete: () => r.destroy() });
  }
}

// (v0.96) Les portraits et les corps des clients sont dessinés à la demande, puis gardés : au fil des
// jours, il y en a des centaines. Chaque soir, on oublie ceux qu'aucune image n'affiche (ils seront
// redessinés s'ils reviennent au comptoir).
function oublierPortraits(jeu) {
  if (!jeu || !jeu.textures) return 0;
  const enUsage = new Set();
  const visiter = l => { for (const o of l) { if (o.texture && o.texture.key) enUsage.add(o.texture.key); if (o.list) visiter(o.list); } };
  for (const s of jeu.scene.scenes) if (s.sys && s.sys.displayList && (s.sys.isActive() || s.sys.isPaused() || s.sys.isSleeping())) visiter(s.sys.displayList.list);
  let n = 0;
  for (const cle of Object.keys(jeu.textures.list)) {
    if (!/^(busteHD_|corps_)/.test(cle) || enUsage.has(cle)) continue;
    const src = jeu.textures.get(cle).getSourceImage();
    jeu.textures.remove(cle);
    if (src && src.width) { src.width = 1; src.height = 1; }   // (le canevas rendu à la réserve ne garde pas sa taille)
    if (typeof MAINS_CORPS !== 'undefined') delete MAINS_CORPS[cle];
    n++;
  }
  return n;
}

// (v0.97) Tous les textes affichés passent par l'accord au féminin de « marchand » (voir accordJoueur)
{ const setText = Phaser.GameObjects.Text.prototype.setText;
  Phaser.GameObjects.Text.prototype.setText = function (t) { return setText.call(this, typeof accordJoueur === 'function' ? accordJoueur(t) : t); }; }

// (v0.97) Phaser n'arrête pas une animation quand son objet est détruit : les animations sans fin
// (respiration, scintillement, balancement...) des panneaux refermés tournaient dans le vide jusqu'à
// la fin de la scène. On les arrête avec l'objet (seulement celles qui ne visent plus rien de vivant).
{ const detruire = Phaser.GameObjects.GameObject.prototype.destroy;
  Phaser.GameObjects.GameObject.prototype.destroy = function (fromScene) {
    const tw = !fromScene && this.scene && this.scene.tweens;
    if (tw && tw.getTweensOf) {
      try {
        for (const t of tw.getTweensOf(this)) if (t.isInfinite && t.targets.every(o => o === this || !o.active)) t.stop();
      } catch (e) { /* (rien : l'objet part quand même) */ }
    }
    return detruire.apply(this, arguments);
  }; }
