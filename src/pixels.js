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

function motifTissu(famille, x, y, cx, cy) {
  if (famille === 'provisions') return ((x >> 1) + (y >> 1)) % 2 === 0;
  if (famille === 'armes') return (x + y) % 4 === 0;
  if (famille === 'soins') return (Math.abs(x - cx) <= 0.6 && Math.abs(y - cy) <= 2.6) || (Math.abs(y - cy) <= 0.6 && Math.abs(x - cx) <= 2.6);
  return x >= cx + 1 && x <= cx + 3 && y >= cy && y <= cy + 2; // une pièce rapiécée
}

// Les baluchons, en HD (deux fois plus de pixels qu'avant) : un tissu noué en boule, plein de
// plis et ombré, attaché au bout d'un bâton ; et le même tissu étalé sur le comptoir.
// Le motif du tissu dépend de ce qu'il contient (provisions, armes, soins, divers).
function creerBaluchons(scene) {
  for (const [famille, c] of Object.entries(TISSUS)) {
    if (scene.textures.exists('baluchon_' + famille)) continue;
    const motif = (x, y) => {
      if (famille === 'provisions') return ((x >> 2) + (y >> 2)) % 2 === 0;           // vichy
      if (famille === 'soins') return (Math.abs(x - 12) < 2 && Math.abs(y - 16) < 6) || (Math.abs(y - 16) < 2 && Math.abs(x - 12) < 6); // croix
      if (famille === 'armes') return (x + y) % 7 === 0;                                 // grosse toile
      return (x * 3 + y * 5) % 11 === 0;                                                 // petites fleurs
    };
    {
      const t = new ToileHD(40, 36);
      Object.assign(t.rampes, RAMPES_DECOR);
      t.rampes.tissu = rampe(c.fond); t.rampes.motif = rampe(c.motif);
      // Le bâton, en diagonale, qui passe derrière le nœud
      for (let k = 0; k < 28; k++) for (const [dx, dy, i] of [[0, 0, 2], [0, 1, 4], [1, 0, 3]]) t.poser(13 + k + dx, 7 + k * 0.95 + dy | 0, 'chene', i);
      // La boule de tissu, avec ses plis qui convergent vers le nœud
      t.forme('tissu', (x, y) => {
        const n = ellipsoide(12, 17, 11, 10.5)(x, y);
        if (!n) return null;
        return n;
      }, { motif: (x, y) => (motif(x, y) ? 0 : 0) + (Math.sin(Math.atan2(y - 6, x - 12) * 7) > 0.75 ? -0.9 : 0) });
      for (let y = 8; y < 28; y++) for (let x = 2; x < 23; x++) {
        if (!ellipsoide(12, 17, 10, 9.5)(x, y) || !motif(x, y)) continue;
        const n = ellipsoide(12, 17, 11, 10.5)(x, y);
        const lum = n ? Math.round(2.5 - n[0] * 1.2 - n[1] * 1.4) : 2;
        t.poser(x, y, 'motif', Math.max(1, Math.min(5, lum)));
      }
      // Le nœud et ses deux oreilles
      t.forme('tissu', ellipsoide(12, 6.5, 3.4, 2.6), { decalage: 0.2 });
      for (const s of [-1, 1]) t.forme('tissu', (x, y) => (y >= 0 && y <= 5 && Math.abs(x + 0.5 - (12 + s * 5)) < 2.2 - (5 - y) * 0.25 ? [s * 0.6, -0.5, 0.7] : null), { decalage: 0.3 });
      t.contour();
      t.texture(scene, 'baluchon_' + famille);
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
function creerBouton(scene, x, y, largeur, texte, action) {
  // Un panneau de chêne dans un cadre de noyer à coins de laiton : plus clair au survol,
  // il s'enfonce quand on appuie.
  const cle = plaqueBouton(scene, largeur);
  const fond = scene.add.image(x, y, cle).setScale(2).setInteractive({ useHandCursor: true });
  const label = scene.add.text(x, y, texte, style(18, '#fff0d0', { fontStyle: 'bold', stroke: '#24140a', strokeThickness: 4, brut: true })).setOrigin(0.5);
  label.setShadow(0, 2, '#120a04', 0, true, true); // comme gravé dans le bois
  let actif = true, survol = false;
  const repos = () => {
    if (!fond.active) return;
    fond.setTexture(survol && actif ? cle + '_clair' : cle);
    label.setY(y);
  };
  fond.on('pointerover', () => { survol = true; repos(); });
  fond.on('pointerout', () => { survol = false; repos(); });
  fond.on('pointerdown', () => {
    if (!actif) return;
    Son.jouer('clic');
    fond.setTexture(cle + '_enfonce');
    label.setY(y + 2);
    scene.time.delayedCall(110, repos);
    action();
  });
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
    setTexte(t) { label.setText(t); if (!t) { fond.setVisible(false); fond.vide = true; } else if (fond.vide) { fond.setVisible(true); fond.vide = false; } },
  };
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
  return { coiffure: feminin ? 1 : 0, cheveux: 0, peau: 0, yeux: 0, bouche: 0, barbe: 0, haut: feminin ? 1 : 0, bas: 0 };
}

// Les lignes du dessin selon les choix et l'âge (la barbe ne pousse qu'à l'âge adulte).
function lignesJoueur(ap, stade) {
  const l = [...CORPS];
  const coiffures = [
    {},
    { 6: '.hcccccch.', 7: '.hcccccch.' },
    { 0: '..hhhhhh..', 1: '.hhhhhhhh.', 2: '.hhsssshh.' },
    { 0: '..h.hh.h..', 1: '..hhhhhh..' },
    { 0: '..........', 1: '...ssss...', 2: '..ssssss..' },
  ];
  const bouches = [
    { 4: '..ssssss..', 5: '...mmmm...' },
    { 4: '..ssssss..', 5: '...smms...' },
    { 4: '..ssmmss..', 5: '...smms...' },
    { 4: '..ssmmss..', 5: '...mssm...' },
  ];
  const barbes = [
    {},
    { 4: '..sxxxxs..' },
    { 5: '..xxmmxx..', 6: '..cxxxxc..' },
    { 4: '..sxmmxs..', 5: '..xxxxxx..', 6: '..cxxxxc..', 7: '.cccxxccc.', 8: 'scccxxcccs' },
  ];
  const morceaux = [coiffures[ap.coiffure], bouches[ap.bouche], stade === 'petit' ? {} : barbes[ap.barbe]];
  for (const m of morceaux) for (const [i, ligne] of Object.entries(m)) l[i] = ligne;
  return l;
}

function paletteJoueur(ap, stade) {
  const cheveux = stade === 'ancien' ? 0xc0c0c0 : APPARENCE.cheveux[ap.cheveux][1];
  return {
    h: cheveux, x: cheveux,
    s: APPARENCE.peau[ap.peau][1],
    e: APPARENCE.yeux[ap.yeux][1],
    m: 0x6a2020,
    c: APPARENCE.haut[ap.haut][1],
    d: 0x7a4a1e,
    p: APPARENCE.bas[ap.bas][1],
    b: 0x4a3020,
  };
}

// La texture du joueur à son âge actuel (créée si besoin).
function textureJoueur(scene, G, vue = 'face') {
  // (on redessine le joueur quand sa tenue change : ce qu'il achète à la garde-robe, il le porte)
  const tenue = (G.tenue || []).join(',');
  if (!scene.textures.exists('joueur_petit') || scene.textures.get('joueur_petit').tenue !== tenue) creerTexturesJoueur(scene, G.joueur.apparence, G.joueur.feminin, G.tenue || []);
  const stade = stadeJoueur(G);
  if (vue === 'face') return 'joueur_' + stade;
  // Sous un autre angle (de trois-quarts, il regarde vers la droite : à retourner pour regarder à gauche)
  const cle = `joueur_${stade}_${vue}`;
  if (!scene.textures.exists(cle) || scene.textures.get(cle).tenue !== tenue) {
    if (scene.textures.exists(cle)) scene.textures.remove(cle);
    dessinerJoueurHD(G.joueur.apparence, stade, G.joueur.feminin, 0, G.tenue || [], vue).texture(scene, cle);
    scene.textures.get(cle).tenue = tenue;
  }
  return cle;
}

// Crée (ou recrée) les trois textures du joueur, en HD : joueur_petit, joueur_adulte, joueur_ancien.
function creerTexturesJoueur(scene, ap, feminin = false, tenue = []) {
  for (const stade of ['petit', 'adulte', 'ancien']) {
    dessinerJoueurHD(ap, stade, feminin, 0, tenue).texture(scene, 'joueur_' + stade);
    dessinerJoueurHD(ap, stade, feminin, -1, tenue).texture(scene, 'joueur_' + stade + '_pas1');
    dessinerJoueurHD(ap, stade, feminin, 1, tenue).texture(scene, 'joueur_' + stade + '_pas2');
    scene.textures.get('joueur_' + stade).tenue = tenue.join(',');
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
    gantelets: [0, 16, 3.2, 0], spalieres: [0, 25, 3.4, 0], heaume: [0, 33.5, 2.4, 0], pavois: [-12, 7, 3, 0], lame: [11, 14, 3, -45],
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
function barreJauge(scene, x, y, l, valeur, { h = 10 } = {}) {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  const n = 24, pas = l / n;
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);   // 0 = ombre, 1 = lumière
    const teinte = Phaser.Display.Color.Interpolate.ColorWithColor(new Phaser.Display.Color(0x4a, 0x2a, 0x7a), new Phaser.Display.Color(0xf0, 0xc8, 0x40), 100, Math.round(u * 100));
    g.fillStyle(Phaser.Display.Color.GetColor(teinte.r, teinte.g, teinte.b), 1).fillRect(-l / 2 + i * pas, -h / 2, Math.ceil(pas), h);
  }
  g.lineStyle(2, 0x2a1a10, 1).strokeRect(-l / 2, -h / 2, l, h);
  g.fillStyle(0x2a1a10, 1).fillRect(-1, -h / 2 - 2, 2, h + 4);   // le milieu
  const cx = (Math.max(-100, Math.min(100, valeur)) / 100) * (l / 2 - 4);
  g.fillStyle(0xfff4dc, 1).fillTriangle(cx - 6, -h / 2 - 7, cx + 6, -h / 2 - 7, cx, -h / 2 - 1);
  g.lineStyle(1, 0x2a1a10, 1).strokeTriangle(cx - 6, -h / 2 - 7, cx + 6, -h / 2 - 7, cx, -h / 2 - 1);
  g.fillStyle(0xfff4dc, 1).fillRect(cx - 1.5, -h / 2, 3, h);
  c.add(g);
  c.add(scene.add.text(-l / 2, h / 2 + 2, 'Ombre', style(10, '#5a3a8a', { fontStyle: 'bold' })));
  c.add(scene.add.text(l / 2, h / 2 + 2, 'Lumière', style(10, '#9a7a10', { fontStyle: 'bold' })).setOrigin(1, 0));
  return c;
}
