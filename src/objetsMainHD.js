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
  bandage: { l: 17, h: 20, prise: [8, 7], pose: 'tient', dessin(t) {
    // un rouleau de toile blanche posé de côté : le rond de la face avec ses tours, le corps strié des tours de bande, un long bout qui pend
    const cy = 7;
    for (let y = 2; y <= 12; y++) { const h = (y - cy) / 5; const ton = h < -0.6 ? 5 : h < -0.1 ? 5 : h < 0.45 ? 4 : 3;      // le corps du rouleau, éclairé par le haut
      for (let x = 5; x <= 14; x++) { if (x === 14 && (y === 2 || y === 12)) continue; const bande = (x - 5) % 3 === 2 ? 1 : 0; t.poser(x, y, 'lin', Math.max(1, ton - bande)); } }
    t.forme('lin', (x, y) => { const px = (x + 0.5 - 4.5) / 3.3, py = (y + 0.5 - cy) / 5.5; return Math.hypot(px, py) <= 1 ? [px * 0.3, py * 0.3, 0.9] : null; }, { decalage: 0.9, ombre: false });   // la face
    for (const [rx, ry, ton] of [[2.4, 4, 3], [1.5, 2.5, 2]]) for (let a = 0; a < 6.28; a += 0.2) t.poser(Math.round(4.5 + Math.cos(a) * rx - 0.5), Math.round(cy + Math.sin(a) * ry - 0.5), 'lin', ton);
    t.poser(4, 6, 'lin', 0); t.poser(4, 7, 'lin', 0); t.poser(5, 7, 'lin', 1);
    // le long bout qui pend du dessous du rouleau, ondulé, avec un liseré brun et un bout en biais
    for (let y = 12; y <= 19; y++) { const o = Math.round(Math.sin((y - 12) * 0.7) * 1.1), fin = y >= 18 ? y - 17 : 0;
      for (let x = 9 + o + fin; x <= 13 + o; x++) t.poser(x, y, 'lin', x === 9 + o + fin ? 3 : x === 13 + o ? 2 : y < 15 ? 5 : 4);
      t.poser(10 + o + fin, y, 'chanvre', 4); }
  } },
  amulette: { l: 11, h: 16, prise: [5.5, 1.5], pose: 'tient', dessin(t) {
    // un pendentif d'or serti d'une gemme, au bout de sa chaîne que les doigts pincent
    for (let y = 0; y <= 6; y++) t.poser(5 + (y % 2 ? 1 : 0), y, 'or', y % 2 ? 4 : 3);
    t.forme('or', ellipsoide(5.5, 10, 4.2, 4.6), { decalage: 0.1 });
    t.forme('gemme', ellipsoide(5.5, 10, 2.1, 2.3), { decalage: 0.6, ombre: false });
    t.poser(4, 9, 'gemme', 5);
  } },
  corde: { l: 20, h: 18, prise: [8.5, 8.5], pose: 'tient', dessin(t) {
    // un cordage de chanvre enroulé en quatre spires régulières (le tors visible, un creux sombre entre les tours), son nœud et son bout libre
    t.rampes.torons = [0x2a1a08, 0x5a4220, 0x846a38, 0xb0904e, 0xd8bc78, 0xf4e4a8];
    const cx = 8.5, cy = 8.6, kx = 0.98, ky = 0.9, R = [7.4, 5.2, 3.0];
    for (let y = 0; y < 18; y++) for (let x = 0; x < 20; x++) {
      const px = (x + 0.5 - cx) / kx, py = (y + 0.5 - cy) / ky, d = Math.hypot(px, py); if (d > 8.2 || d < 2.4) continue;
      const n = R.reduce((m, r, i) => (Math.abs(d - r) < Math.abs(d - R[m]) ? i : m), 0), f = (d - R[n]) / 1.0;
      if (Math.abs(f) > 0.75) { t.poser(x, y, 'torons', 0); continue; }   // le creux entre deux tours
      const a = Math.atan2(py, px), lum = -Math.cos(a - 0.78) * 0.5 + 0.5;     // éclairé en haut à gauche
      let ton = 3 + Math.round(lum * 1.6) - (Math.abs(f) > 0.5 ? 1 : 0) + (Math.abs(f) < 0.2 ? 1 : 0);
      if (Math.floor(a * 6 + 60 + n * 0.5) % 2) ton -= 1;                      // le tors des brins
      t.poser(x, y, 'torons', Math.max(1, Math.min(5, ton)));
    }
    for (let y = 6; y <= 11; y++) for (let x = 6; x <= 11; x++) if (Math.hypot((x + 0.5 - cx) / kx, (y + 0.5 - cy) / ky) < 2.4) t.poser(x, y, 'torons', 0);   // le vide du centre
    // le nœud sur les spires, en haut à droite, puis le bout libre qui descend à droite
    t.forme('torons', ellipsoide(14, 3.6, 2.5, 2.1), { decalage: 0.8 });
    for (const [x, y] of [[12, 3], [13, 5], [15, 2], [16, 4]]) t.poser(x, y, 'torons', 1);
    t.poser(13, 3, 'torons', 5); t.poser(14, 2, 'torons', 4);
    const bout = [[15, 4.6], [17, 6.4], [17.8, 9], [17.4, 12], [16.2, 14.4]];
    for (let i = 0; i < bout.length - 1; i++) { const [a, b] = bout[i], [c, d] = bout[i + 1]; for (let k = 0; k <= 4; k++) { const u = k / 4; t.forme('torons', ellipsoide(a + (c - a) * u, b + (d - b) * u, 1.2, 1.2), { decalage: 0.5 }); } }
    for (const [x, y] of [[15, 15], [16, 15.6], [17, 15]]) t.poser(Math.round(x), Math.round(y), 'torons', 4);   // les brins effilochés
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
