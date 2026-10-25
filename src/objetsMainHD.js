// (retours sur la planche 86) Les objets tenus en main : de vrais dessins à l'échelle des corps (une ration de 15 cm, une gourde de
// 25 cm, une fiole de 12 cm, une torche de 50 cm...), avec leur prise (le point que la main serre), au lieu d'une petite icône
// posée au hasard. Chacun se dessine dans une toile à l'échelle des textures de corps (FINESSE = 2 pixels par unité), légèrement
// agrandi (×1,3, comme les armes) pour qu'on les voie ; `prise` : le pixel de la toile que la main tient ; `pose` : la pose du
// rig où le bras tend l'objet (tient : devant la poitrine ; tientHaut : levé, pour la torche).

// Un dessin posé pixel par pixel : chaque lettre est un ton d'une matière (a-f : toile écrue, g-l : chanvre, m-r : tissu rouge,
// s-x : métal) ; '.' laisse le fond. Les bandes de corde, la spirale du bandage et ses plis sont dessinés un à un.
const LETTRES_PIXELS = {};
[['ecru', 'abcdef'], ['torons', 'ghijkl'], ['tissuRouge', 'mnopqr'], ['metal', 'stuvwx']].forEach(([mat, lettres]) => [...lettres].forEach((c, ton) => { LETTRES_PIXELS[c] = [mat, ton]; }));
function poserPixels(t, lignes, dx = 1, dy = 1) {
  t.rampes.ecru = [0x4a3a28, 0x7a6644, 0xa89466, 0xcdbb8a, 0xe6d8ae, 0xf8efd0];
  t.rampes.torons = [0x2a1a08, 0x5a4220, 0x846a38, 0xb0904e, 0xd8bc78, 0xf4e4a8];
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
  gourde: { l: 19, h: 28, prise: [8, 20], pose: 'tient', dessin(t) {
    // une gourde de voyage en cuir : une panse ronde de peau claire au pourtour cousu, un goulot court, un bouchon de liège, et la
    // lanière de corde claire qui passe sous le col et forme une boucle de portage
    t.rampes.peau = [0x3a1e0c, 0x6a3c1c, 0x9c6430, 0xc08a4a, 0xdcaa68, 0xf2cc92];
    t.rampes.liege = [0x4a3418, 0x7a5a2c, 0xa88040, 0xc89c58, 0xe0b874, 0xf4d498];
    const cx = 8, cy = 20, rx = 7, ry = 7.4;
    t.forme('peau', (x, y) => { const px = (x + 0.5 - cx) / rx, py = (y + 0.5 - cy) / ry, d = Math.hypot(px, py); if (d > 1) return null;
      const clair = -(px * 0.7 + py * 0.7); return [px * 0.8, py * 0.8, 0.45 + clair * 0.25]; }, { decalage: 0.35 });
    t.forme('peau', ellipsoide(cx - 1.4, cy - 1.8, 3.2, 3.6), { decalage: 0.9, ombre: false, bord: false });                  // la lumière sur la panse
    for (let a = 0.2; a < 6.28; a += 0.5) t.poser(Math.round(cx + Math.cos(a) * 5.7 - 0.5), Math.round(cy + Math.sin(a) * 6.1 - 0.5), 'peau', 1);   // la couture, des points sombres
    t.forme('peau', (x, y) => (y >= 9.5 && y <= 14 && Math.abs(x + 0.5 - 8) < 2.3 ? [(x + 0.5 - 8) / 2.3, 0, 0.9] : null), { decalage: 0.5 });   // le goulot
    t.forme('liege', (x, y) => (y >= 5 && y <= 9.5 && Math.abs(x + 0.5 - 8) < 2.1 ? [(x + 0.5 - 8) / 2.1, 0, 0.9] : null), { decalage: 0.5 });   // le bouchon
    for (let y = 6; y <= 8; y++) t.poser(7, y, 'liege', 5);
    for (let x = 5; x <= 10; x++) { t.poser(x, 12, 'peau', 1); t.poser(x, 13, 'peau', 2); }                                    // le collier de cuir serré
    // la lanière : un cordon clair noué au col (ses deux bouts pendent), et une grande boucle de sangle qui sort du côté de la panse
    for (let x = 5; x <= 10; x++) t.poser(x, 11, 'chanvre', x < 8 ? 4 : 3);
    for (const [x, y, ton] of [[5, 12, 4], [4, 13, 3], [4, 14, 2], [10, 12, 4], [11, 13, 3], [11, 14, 2]]) t.poser(x, y, 'chanvre', ton);
    for (let k = 0; k <= 16; k++) { const u = k / 16, a = -Math.PI / 2 + Math.PI * u, x = 14 + Math.cos(a) * 2.9, y = 20 + Math.sin(a) * 6; t.poser(Math.round(x), Math.round(y), 'chanvre', 4); t.poser(Math.round(x) - 1, Math.round(y), 'chanvre', 2); }
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
  bandage: { l: 21, h: 27, prise: [8.5, 8.5], pose: 'tient', dessin(t) {
    // une bande de toile écrue enroulée en spirale serrée (la face montre le tour qui s'enroule, son flanc fait l'épaisseur), son bout libre
    // qui se déroule en vague vers le bas (la bande se retourne : face claire à trame, dos plus sombre, un pli à chaque retournement,
    // l'ombre du rouleau dessus), un croisillon rouge cousu et une épingle de nourrice qui le tient
    poserPixels(t, [
    '.......c...........',
    '....cccfccc........',
    '...cffccccfcc......',
    '..ceccffefcccc.....',
    '.cfccffffefcccc....',
    '.cfcfeccccefccc....',
    '.cfcfcefffceebc....',
    'cfecfcfabfceebbc...',
    '.cfcffcbefceebcc...',
    '.cfceffffecebbcc...',
    '.cffccffcceebbc....',
    '..cfffcceeebbdd....',
    '...cffeeeebbdd.....',
    '....ccbbbbbddced...',
    '......dbddddeeefc..',
    '..........w.cddcdc.',
    '..........vwwwwwwux',
    '.........ccddcc..uv',
    '.......cdcddc......',
    '......cdcdqc.......',
    '......efffqd.......',
    '.......eqqrpp......',
    '..........peed.....',
    '..........p.eefd...',
    '..............eed..']);
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
