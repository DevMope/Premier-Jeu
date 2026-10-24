// (retours sur la planche 86) Les objets tenus en main : de vrais dessins à l'échelle des corps (une ration de 15 cm, une gourde de
// 25 cm, une fiole de 12 cm, une torche de 50 cm...), avec leur prise (le point que la main serre), au lieu d'une petite icône
// posée au hasard. Chacun se dessine dans une toile à l'échelle des textures de corps (FINESSE = 2 pixels par unité), légèrement
// agrandi (×1,3, comme les armes) pour qu'on les voie ; `prise` : le pixel de la toile que la main tient ; `pose` : la pose du
// rig où le bras tend l'objet (tient : devant la poitrine ; tientHaut : levé, pour la torche).

const OBJETS_MAIN = {
  ration: { l: 16, h: 12, prise: [8, 6], pose: 'tient', dessin(t) {
    // un petit pain bis, noué dans un linge
    t.forme('pain', ellipsoide(8, 6.5, 7, 4.4), { decalage: 0.1 });
    for (const x of [4, 8, 12]) t.poser(x, 4, 'pain', 5);
    t.forme('lin', (x, y) => (Math.abs(x + 0.5 - 8) < 2.4 && y >= 2 && y <= 10 ? [0, -0.2, 0.9] : null), { decalage: 0.2 });
    t.forme('lin', ellipsoide(8, 2.2, 2.4, 1.5), { decalage: 0.4 }); t.poser(6, 1, 'lin', 4); t.poser(10, 1, 'lin', 3);
  } },
  gourde: { l: 14, h: 24, prise: [7, 16], pose: 'tient', dessin(t) {
    // une gourde de cuir en poire, son bouchon de liège, sa lanière
    t.forme('cuir', ellipsoide(7, 16, 5.6, 7.2), { decalage: 0.1 });
    t.forme('cuir', (x, y) => (y >= 5 && y <= 11 && Math.abs(x + 0.5 - 7) < 2 - (y - 5) * -0.05 ? [(x + 0.5 - 7) / 2, 0, 0.9] : null), { decalage: 0.2 });
    t.forme('chanvre', ellipsoide(7, 3.8, 1.9, 2.2), { decalage: 0.3 });
    for (let y = 8; y <= 17; y++) { t.poser(2 + Math.round((y - 8) * 0.15), y, 'chanvre', 3); }   // la lanière cousue
    t.forme('cuir', ellipsoide(5, 14, 1.8, 2.6), { decalage: 0.9, ombre: false, bord: false });
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
  bandage: { l: 12, h: 10, prise: [6, 5], pose: 'tient', dessin(t) {
    // un rouleau de linge blanc, le bout qui pend
    t.forme('lin', ellipsoide(6, 5, 5, 3.8), { decalage: 0.2 });
    for (const x of [3, 5, 7, 9]) t.poser(x, 5, 'lin', 2);
    t.forme('lin', (x, y) => (x >= 8 && x <= 10 && y >= 6 && y <= 9 ? [0, -0.3, 0.8] : null), { decalage: 0.3 });
  } },
  amulette: { l: 11, h: 16, prise: [5.5, 1.5], pose: 'tient', dessin(t) {
    // un pendentif d'or serti d'une gemme, au bout de sa chaîne que les doigts pincent
    for (let y = 0; y <= 6; y++) t.poser(5 + (y % 2 ? 1 : 0), y, 'or', y % 2 ? 4 : 3);
    t.forme('or', ellipsoide(5.5, 10, 4.2, 4.6), { decalage: 0.1 });
    t.forme('gemme', ellipsoide(5.5, 10, 2.1, 2.3), { decalage: 0.6, ombre: false });
    t.poser(4, 9, 'gemme', 5);
  } },
  corde: { l: 18, h: 16, prise: [9, 8], pose: 'tient', dessin(t) {
    // un rouleau de corde : des tours de chanvre, le bout qui sort
    t.forme('chanvre', ellipsoide(9, 8, 7.6, 6.4), { decalage: 0 });
    t.forme('chanvre', ellipsoide(9, 8, 3.2, 2.6), { decalage: -0.9, bord: false, ombre: false });
    for (let a = 0; a < 6.3; a += 0.5) { const x = Math.round(9 + Math.cos(a) * 5.4), y = Math.round(8 + Math.sin(a) * 4.4); t.poser(x, y, 'chanvre', 1 + (Math.floor(a * 2) % 2)); }
    t.forme('chanvre', (x, y) => (x >= 14 && x <= 17 && y >= 10 && y <= 12 ? [0, -0.3, 0.8] : null), { decalage: 0.2 });
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
