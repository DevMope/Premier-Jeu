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
  caisse: {
    pal: { a: 0x6b4423, b: 0xa8743c },
    px: ['aaaaaaaa', 'abbbbbba', 'aabbbbaa', 'abababba', 'abbabbba', 'aabbbbaa', 'abbbbbba', 'aaaaaaaa'],
  },
  coffre: {
    pal: { a: 0x6b4423, b: 0xa8743c, c: 0xe8c040 },
    px: ['.aaaaaa.', 'abbbbbba', 'abbbbbba', 'cccccccc', 'abbccbba', 'abbbbbba', 'abbbbbba', 'aaaaaaaa'],
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

function creerToutesLesTextures(scene) {
  for (const [cle, ic] of Object.entries(ICONES)) {
    creerTexture(scene, cle, ic.px, ic.pal);
  }
  for (const [race, r] of Object.entries(RACES)) {
    const lignes = CORPS.map((l, i) => r.lignes[i] || l);
    creerTexture(scene, 'perso_' + race, lignes, r.pal);
  }
}

// --- Petits outils d'interface partagés par les scènes ---

const POLICE = 'Georgia, "Times New Roman", serif';

function style(taille, couleur = '#f3e6c8', extra = {}) {
  return { fontFamily: POLICE, fontSize: taille + 'px', color: couleur, resolution: 2, ...extra };
}

// Bouton en bois cliquable. Renvoie un objet avec setActif(bool).
function creerBouton(scene, x, y, largeur, texte, action) {
  const fond = scene.add.rectangle(x, y, largeur, 40, 0x8a5a2b)
    .setStrokeStyle(3, 0x3b2410)
    .setInteractive({ useHandCursor: true });
  const label = scene.add.text(x, y, texte, style(18, '#fff4dc', { fontStyle: 'bold' })).setOrigin(0.5);
  let actif = true;
  fond.on('pointerover', () => actif && fond.setFillStyle(0xa8743c));
  fond.on('pointerout', () => fond.setFillStyle(actif ? 0x8a5a2b : 0x5a4030));
  fond.on('pointerdown', () => actif && action());
  return {
    fond, label,
    setActif(a) {
      actif = a;
      fond.setFillStyle(a ? 0x8a5a2b : 0x5a4030);
      label.setAlpha(a ? 1 : 0.5);
    },
    setVisible(v) { fond.setVisible(v); label.setVisible(v); },
    setTexte(t) { label.setText(t); },
  };
}

// Paysage paisible façon « Comté » : ciel, collines, chemin.
// `nuit` assombrit le tout (de 0 à 1).
function dessinerComte(g, x, y, w, h, nuit = 0) {
  const melange = (jour, soir) => Phaser.Display.Color.Interpolate.ColorWithColor(
    Phaser.Display.Color.ValueToColor(jour), Phaser.Display.Color.ValueToColor(soir), 100, nuit * 100);
  const c = (jour, soir) => { const m = melange(jour, soir); return Phaser.Display.Color.GetColor(m.r, m.g, m.b); };

  g.fillGradientStyle(c(0x8fd0f0, 0x1a1840), c(0x8fd0f0, 0x1a1840), c(0xf0e4b0, 0x8a4a50), c(0xf0e4b0, 0x8a4a50), 1);
  g.fillRect(x, y, w, h);
  // Soleil
  g.fillStyle(c(0xfff2b0, 0xf07040), 1);
  g.fillCircle(x + w * 0.78, y + h * (0.22 + nuit * 0.4), 18);
  // Collines lointaines puis proches
  g.fillStyle(c(0x7fb069, 0x2a3a40), 1);
  g.fillEllipse(x + w * 0.2, y + h * 0.75, w * 0.8, h * 0.5);
  g.fillEllipse(x + w * 0.85, y + h * 0.78, w * 0.7, h * 0.45);
  g.fillStyle(c(0x5f9a48, 0x1f2e30), 1);
  g.fillEllipse(x + w * 0.5, y + h * 0.95, w * 1.4, h * 0.5);
  // Petite porte ronde de hobbit dans la colline
  g.fillStyle(c(0x3a6a2a, 0x18242a), 1);
  g.fillCircle(x + w * 0.16, y + h * 0.8, 13);
  g.fillStyle(c(0x2f6a9a, 0x1a2a40), 1);
  g.fillCircle(x + w * 0.16, y + h * 0.8, 10);
  g.fillStyle(c(0xe0c040, 0x806020), 1);
  g.fillCircle(x + w * 0.16, y + h * 0.8, 2);
  // Chemin de terre
  g.fillStyle(c(0xc9a46a, 0x4a3a30), 1);
  g.fillRect(x, y + h - 26, w, 26);
}

// La façade du comptoir, vue de dehors : bois, toit de chaume, fenêtre-comptoir et enseigne.
// `cx` = centre, `sol` = bas des murs. Renvoie la position de la porte.
function dessinerFacade(scene, cx, sol, nomShop = 'Le Comptoir') {
  const g = scene.add.graphics();
  const l = 320, h = 170;
  const x = cx - l / 2, y = sol - h;
  // Murs en planches
  g.fillStyle(0x8a5a2b).fillRect(x, y, l, h);
  g.lineStyle(2, 0x6b4423);
  for (let px = x; px < x + l; px += 20) g.lineBetween(px, y, px, sol);
  // Poutres
  g.fillStyle(0x3b2410).fillRect(x, y, l, 10).fillRect(x, y, 10, h).fillRect(x + l - 10, y, 10, h);
  // Toit de chaume
  g.fillStyle(0xc9a046).fillTriangle(x - 30, y + 4, cx, y - 110, x + l + 30, y + 4);
  g.lineStyle(2, 0xa07a2a);
  for (let i = 1; i < 6; i++) g.lineBetween(x - 30 + i * 18, y + 4 - i * 2, cx, y - 110);
  // Fenêtre-comptoir (le « drive »)
  g.fillStyle(0x2a1a10).fillRect(x + 30, y + 40, 130, 80);
  g.fillStyle(0xf0c060, 0.5).fillRect(x + 36, y + 46, 118, 68);
  g.fillStyle(0x6b4423).fillRect(x + 22, y + 120, 146, 12);
  // Porte ronde
  g.fillStyle(0x3b2410).fillRoundedRect(x + 205, y + 60, 80, h - 60, { tl: 40, tr: 40, bl: 0, br: 0 });
  g.fillStyle(0x2f6a9a).fillRoundedRect(x + 211, y + 66, 68, h - 66, { tl: 34, tr: 34, bl: 0, br: 0 });
  g.fillStyle(0xe0c040).fillCircle(x + 245, y + 120, 4);
  // Enseigne suspendue
  g.fillStyle(0x3b2410).fillRect(x + 40, y - 6, 4, 22).fillRect(x + 150, y - 6, 4, 22);
  g.fillStyle(0xead9b0).fillRect(x + 28, y + 14, 140, 24);
  g.lineStyle(2, 0x6b4423).strokeRect(x + 28, y + 14, 140, 24);
  scene.add.text(x + 98, y + 26, nomShop, style(14, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5);
  return { porteX: x + 245, porteY: sol, g };
}
