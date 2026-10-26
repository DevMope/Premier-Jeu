// (retours sur la planche 86) Les objets tenus en main : de vrais dessins à l'échelle des corps (une ration de 15 cm, une gourde de
// 25 cm, une fiole de 12 cm, une torche de 50 cm...), avec leur prise (le point que la main serre), au lieu d'une petite icône
// posée au hasard. Chacun se dessine dans une toile à l'échelle des textures de corps (FINESSE = 2 pixels par unité), légèrement
// agrandi (×1,3, comme les armes) pour qu'on les voie ; `prise` : le pixel de la toile que la main tient ; `pose` : la pose du
// rig où le bras tend l'objet (tient : devant la poitrine ; tientHaut : levé, pour la torche).

// Un dessin posé pixel par pixel : chaque lettre est un ton d'une matière (a-f : toile écrue, g-l : chanvre, m-r : vert des herbes,
// s-x : terre cuite, A-F : cuir de la gourde, G-L : liège) ; '.' laisse le fond. Les bandes de corde, la spirale du bandage et ses plis sont dessinés un à un.
const LETTRES_PIXELS = {};
[['ecru', 'abcdef'], ['torons', 'ghijkl'], ['vertSoin', 'mnopqr'], ['terreCuite', 'stuvwx'], ['cuirGourde', 'ABCDEF'], ['liege', 'GHIJKL']].forEach(([mat, lettres]) => [...lettres].forEach((c, ton) => { LETTRES_PIXELS[c] = [mat, ton]; }));
function poserPixels(t, lignes, dx = 1, dy = 1) {
  t.rampes.ecru = [0x4a3a28, 0x7a6644, 0xa89466, 0xcdbb8a, 0xe6d8ae, 0xf8efd0];
  t.rampes.torons = [0x2a1a08, 0x5a4220, 0x846a38, 0xb0904e, 0xd8bc78, 0xf4e4a8];
  t.rampes.vertSoin = [0x14301a, 0x22502a, 0x347434, 0x4e9640, 0x78b85a, 0xaee08a];
  t.rampes.terreCuite = [0x3a1a0c, 0x6a2e16, 0x9a4a24, 0xc06a36, 0xdc9252, 0xf2c088];
  t.rampes.cuirGourde = [0x2e180a, 0x5a3218, 0x8a5428, 0xb07a3e, 0xd0a05c, 0xecc888];
  t.rampes.liege = [0x3a2810, 0x6a4c24, 0x9a7438, 0xc09a52, 0xdcbc74, 0xf2dc9c];
  lignes.forEach((ligne, y) => [...ligne].forEach((c, x) => { const d = LETTRES_PIXELS[c]; if (d) t.poser(x + dx, y + dy, d[0], d[1]); }));
}

const OBJETS_MAIN = {
  ration: { l: 16, h: 12, prise: [8, 6], pose: 'tient', dessin(t) {
    // un petit pain bis, noué dans un linge
    t.forme('pain', ellipsoide(8, 6.5, 7, 4.4), { decalage: 0.1 });
    for (const x of [4, 8, 12]) t.poser(x, 4, 'pain', 5);
    t.forme('lin', (x, y) => (Math.abs(x + 0.5 - 8) < 2.4 && y >= 2 && y <= 10 ? [0, -0.2, 0.9] : null), { decalage: 0.2 });
    t.forme('lin', ellipsoide(8, 2.2, 2.4, 1.5), { decalage: 0.4 }); t.poser(6, 1, 'lin', 4); t.poser(10, 1, 'lin', 3);
  } },
  gourde: { l: 16, h: 24, prise: [8, 16], pose: 'tient', dessin(t) {
    // une gourde de voyage : une panse ronde et plate de cuir cousu (le bourrelet et ses points de couture), un col court et
    // sa bague, un bouchon de liège, le cordon noué au col qui fait une boucle de portage au-dessus
    poserPixels(t, [
    '.....ikiki....',
    '...ki.....ik..',
    '..ki.......ik.',
    '..i..KLKJJ..i.',
    '..k..KLKJJ..k.',
    '..i..KLKJJ..i.',
    '...i.EEDDC.i..',
    '...kiDDCCCCk..',
    '....BBBBBBB...',
    '..LDFFFEEECL..',
    '.DDFFFEEEEDCC.',
    '.DFFEEEEEDDDC.',
    'LFFEEEEEDDDDDL',
    'DFEEEEEDDDDDCC',
    'DEEEEDDDDDDCCC',
    'DEEEDDDDDDCCCC',
    'DEEDDDDDDCCCCC',
    'LEDDDDDCCCCBBL',
    '.CDDDDCCCCBBC.',
    '.CCDDCCCCBBCC.',
    '..LCCCCCBBCL..',
    '....CCCLCC....']);
  } },
  potion: { l: 11, h: 16, prise: [5.5, 11], pose: 'tient', dessin(t) {
    // une fiole ronde de verre, du liquide rouge, un bouchon
    t.forme('verre', ellipsoide(5.5, 11, 4.4, 4.8), { decalage: 0.3 });
    t.forme('verreRouge', ellipsoide(5.5, 12, 3.6, 3.6), { decalage: 0.2, ombre: false, bord: false });
    t.forme('verre', (x, y) => (y >= 3 && y <= 7 && Math.abs(x + 0.5 - 5.5) < 1.6 ? [(x + 0.5 - 5.5) / 1.6, 0, 0.9] : null), { decalage: 0.3 });
    t.forme('chanvre', ellipsoide(5.5, 2.4, 1.9, 1.6), { decalage: 0.3 });
    t.poser(3, 10, 'verre', 5); t.poser(3, 9, 'verre', 5);
  } },
  torche: { l: 12, h: 52, prise: [6, 40], pose: 'tientHaut', dessin(t) {
    // un manche de bois, la poix enroulée, la flamme
    t.forme('chene', (x, y) => (y >= 12 && y <= 50 && Math.abs(x + 0.5 - 6) < 1.5 ? [(x + 0.5 - 6) / 1.5, 0, 0.9] : null), { decalage: 0.1 });
    t.forme('chanvre', ellipsoide(6, 13, 3, 4.4), { decalage: -0.3 });
    for (const y of [11, 14]) for (let x = 4; x <= 8; x++) t.poser(x, y, 'chanvre', 1);
    t.forme('flamme', (x, y) => { const d = Math.abs(x + 0.5 - 6) / (3.4 - (11 - y) * 0.22); return y >= 0 && y <= 11 && d < 1 ? [(x + 0.5 - 6) / 3, 0, 0.9] : null; }, { decalage: 0.6, ombre: false });
    t.forme('flamme', ellipsoide(6, 7.5, 1.4, 2.8), { decalage: 1.4, ombre: false, bord: false });
  } },
  bandageA: { l: 25, h: 18, prise: [8, 8], pose: 'tient', dessin(t) {
    // A : une bande de lin pliée en accordéon, posée en biais, nouée d'une ficelle ; un petit pot d'onguent en terre à côté
    // (son couvercle de toile, l'onguent vert)
    poserPixels(t, [
    '.......k.k.............',
    '......k...k............',
    'ffe....iji.............',
    'fee....ih..............',
    'ffecdcjki.j............',
    'ffdcdifih..i...........',
    'ffecdcekicdcfee........',
    'ffecdcfihcdcffe........',
    'efecdcfeecdcffd...ffee.',
    'ffecdcfkicdcffe..eeeddd',
    'eddbcbfihcdcffe..jffeei',
    'bbbbbbfkicdcefe..wwvvuu',
    '......eihbcbffe..wxvvqu',
    '......bkibbbfee..wvvvpu',
    '............eed..vvvuut',
    '............bbb...vuut.']);
  } },
  bandageB: { l: 17, h: 13, prise: [8, 5], pose: 'tient', dessin(t) {
    // B : une compresse de lin pliée en carré (trois épaisseurs sur la tranche), un cataplasme de feuilles vertes dessus, une
    // ficelle nouée en croix
    poserPixels(t, [
    'fefffffiefeeed.',
    'ffffqqfkeeeeddc',
    'ffqqqppiqqpeedc',
    'fqqpppkkkpppedc',
    'ffqrrkriqkrqedc',
    'deeeooijioooedc',
    'kikikikikikikik',
    'dddddjdkdjddddc',
    '.dddiddiddidddc',
    '.cccccckccccccb',
    '.ddddddiddddddb']);
  } },
  bandageC: { l: 19, h: 22, prise: [8, 6], pose: 'tient', dessin(t) {
    // C : une bande pliée en zigzag (quatre épaisseurs, les plis arrondis), le bout libre qui pend en vague, un brin d'herbe
    // glissé dans le pli
    poserPixels(t, [
    '.fffffeffffff..pq',
    'eeedeeeeeedeed.r.',
    '.dddddddddddd.qpp',
    '.fffeffffffef.p..',
    'ddeeeeeedeeeee...',
    '.dddddddddddd....',
    '.feffffffefff....',
    'eeeeeedeeeeeed...',
    '.dddddddddddd....',
    '.ffffffefffff....',
    'deeedeeeeeedee...',
    '.dddddddddddd....',
    '.cccccccffedc....',
    '........fffe.....',
    '.........ffed....',
    '.........eedc....',
    '........ffed.....',
    '.......fffe......',
    '......fffe.......',
    '......eeed.......']);
  } },
  amulette: { l: 11, h: 16, prise: [5.5, 1.5], pose: 'tient', dessin(t) {
    // un pendentif d'or serti d'une gemme, au bout de sa chaîne que les doigts pincent
    for (let y = 0; y <= 6; y++) t.poser(5 + (y % 2 ? 1 : 0), y, 'or', y % 2 ? 4 : 3);
    t.forme('or', ellipsoide(5.5, 10, 4.2, 4.6), { decalage: 0.1 });
    t.forme('gemme', ellipsoide(5.5, 10, 2.1, 2.3), { decalage: 0.6, ombre: false });
    t.poser(4, 9, 'gemme', 5);
  } },
  corde: { l: 25, h: 30, prise: [9, 14.5], pose: 'tient', dessin(t) {
    // un écheveau de corde de chanvre torsadée (les brins en damier clair et mi-ton, une ombre sous chaque tour) : deux boucles liées
    // au milieu par trois spires serrées, un bout qui pendouille sur le côté, effiloché
    poserPixels(t, [
    '......jkjk.............',
    '....kjjijiji...........',
    '...kijijijiji..........',
    '..kijghghgjiji.........',
    '.kijgh....ijiji........',
    '.jjgh......ijij........',
    '.kih........ijg........',
    '.iji........kij........',
    '.jiji......kjjg........',
    '.lkiji....kjjlk........',
    '.jkjkkikjklkkjk........',
    'ggjkjkjkjkjkhigg.......',
    '.jkgghijihigkjkjkjj....',
    '.kjkjlklklkljjijijij...',
    'gggjkjkjkjkjjghgjijij..',
    '.jkjgggihggglkk..jijij.',
    'gkjkjkjkkkjkjihg...iji.',
    '.ggjkjkjkjkhigg....kijg',
    'kiggggggggggggji....jih',
    'jjih...gg...jjih....ijg',
    'kijg........kijg....kih',
    'jjih........jjih....jjg',
    'kiji........kijg....jih',
    '.jiji......kjjg....kijg',
    '.ijiji....kjjih.....jg.',
    '..ijijijikijih......jkj',
    '...ijijijijgh......i..i',
    '.....hgjghg..........j.']);
  } },
};
// (retours du joueur) le bandage : trois propositions ; celle que le joueur choisira devient le bandage du jeu
const VARIANTE_BANDAGE = 'A';
OBJETS_MAIN.bandage = OBJETS_MAIN['bandage' + VARIANTE_BANDAGE];
OBJETS_MAIN.antidote = { ...OBJETS_MAIN.potion, dessin(t) {
  t.forme('verre', ellipsoide(5.5, 11, 4.4, 4.8), { decalage: 0.3 });
  t.forme('verreVert', ellipsoide(5.5, 12, 3.6, 3.6), { decalage: 0.2, ombre: false, bord: false });
  t.forme('verre', (x, y) => (y >= 3 && y <= 7 && Math.abs(x + 0.5 - 5.5) < 1.6 ? [(x + 0.5 - 5.5) / 1.6, 0, 0.9] : null), { decalage: 0.3 });
  t.forme('chanvre', ellipsoide(5.5, 2.4, 1.9, 1.6), { decalage: 0.3 });
  t.poser(3, 10, 'verre', 5); t.poser(3, 9, 'verre', 5);
} };

// La texture de l'objet tenu (créée une fois) : sa clé ; PRISES_OBJETS[clé] = { x, y, l, h } (la prise, en pixels de la texture)
const PRISES_OBJETS = {};
function textureObjetMainHD(scene, id) {
  const def = OBJETS_MAIN[id]; if (!def) return null;
  const cle = 'objMain_' + id;
  if (!scene.textures.exists(cle)) {
    const t = toileObjet(def.l, def.h); t.relief = true; t.cel = true;
    def.dessin(t);
    contourEpais(t, 1);
    t.texture(scene, cle);
    PRISES_OBJETS[cle] = { x: def.prise[0], y: def.prise[1], l: def.l, h: def.h };
  }
  return cle;
}
// Un objet tenu dans la main d'un personnage : l'image (posée par sa prise, à l'échelle du personnage), qui suit sa vraie main.
// pos : () => { x, y } la main à l'écran. Renvoie l'image ; elle a dx, dy (un décalage), angle, et se fane/se détruit comme une icône.
function imageObjetMain(scene, id, qui, pos, { dx = 0, dy = 0, angle = 0 } = {}) {
  const cle = textureObjetMainHD(scene, id); if (!cle) return null;
  const pr = PRISES_OBJETS[cle], o = scene.add.image(0, 0, cle).setOrigin(pr.x / pr.l, pr.y / pr.h).setAngle(angle);
  o.objetMain = id; o.dx = dx; o.dy = dy;
  const suivre = () => {
    if (!o.active || !qui.active || o.libre) return;
    const m = pos(), s = qui.flipX ? -1 : 1, e = Math.abs(qui.scaleX);
    o.setPosition(m.x + o.dx * s, m.y + o.dy + 0.8 * FINESSE * e).setScale(e * (o.reduit || 1)).setFlipX(qui.flipX).setDepth(qui.depth + 0.05);
  };
  suivre();
  return { o, suivre };
}
