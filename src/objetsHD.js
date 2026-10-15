// Les objets en HD : les marchandises (16 × 16 pixels peints, deux fois plus détaillées que
// les anciennes icônes) et les pièces d'or du comptoir. Même style que les portraits :
// dégradés de 6 teintes, lumière en haut à gauche, contour coloré.

const RAMPES_OBJETS = {
  pain: [0x3a1c0c, 0x6a3414, 0x9a5420, 0xc47a34, 0xe0a050, 0xf4cc84],
  fromage: [0x5a4010, 0x8a6a18, 0xc09a28, 0xe0c048, 0xf0dc78, 0xfaf0b0],
  verreRouge: [0x2a0610, 0x5a0e1e, 0x8e1a2c, 0xc42e3c, 0xe8605a, 0xffb0a0],
  verreVert: [0x0a2414, 0x14402a, 0x226a40, 0x38985a, 0x64c47e, 0xb0f0c0],
  verre: [0x3a4a5a, 0x6a7e90, 0x9ab0c0, 0xc4d4de, 0xe4eef4, 0xffffff],
  flamme: [0x8a1a08, 0xc23a0c, 0xe8640e, 0xf8981a, 0xfcc840, 0xfff4b0],
  gemme: [0x1a0a2a, 0x34145a, 0x5a2a8e, 0x8a4ac4, 0xb87ae8, 0xe8c8ff],
  tissuRouge: [0x1c0c14, 0x441628, 0x6e2234, 0x982e3c, 0xbc4a4a, 0xda7260],
  lin: [0x5a4a38, 0x8a7a60, 0xb0a084, 0xd0c4a6, 0xe8dec4, 0xfaf4e4],
  chanvre: [0x3a2810, 0x5e4420, 0x8a6a34, 0xb08e4e, 0xd0b06c, 0xead09a],
};

function toileObjet(l = 16, h = 16) {
  const t = new ToileHD(l, h);
  Object.assign(t.rampes, RAMPES_DECOR, RAMPES_OBJETS);
  return t;
}

// Un trait épais (pour les lames, les manches, les flèches), éclairé selon son côté.
function trait(t, mat, x0, y0, x1, y1, ep = 1, { decalage = 0, bord = true } = {}) {
  const dx = x1 - x0, dy = y1 - y0, long = Math.hypot(dx, dy) || 1;
  t.forme(mat, (x, y) => {
    const px = x + 0.5 - x0, py = y + 0.5 - y0;
    const u = (px * dx + py * dy) / (long * long);
    if (u < 0 || u > 1) return null;
    const d = (px * dy - py * dx) / long; // distance signée au trait
    return Math.abs(d) <= ep ? [-dy / long * (d / ep), dx / long * (d / ep) * 0.5, 0.8] : null;
  }, { decalage, bord });
}

const DESSINS_OBJETS = {
  // --- Les cadeaux du Bazar ---
  // Un pot de miel en terre, couvercle de tissu noué, une coulure dorée
  miel(t) {
    t.rampes.terre = rampe(0xb06a3a); t.rampes.miel = rampe(0xe8a020);
    t.forme('terre', (x, y) => (y >= 5 && y <= 15 && Math.abs(x + 0.5 - 8) < 5.5 - Math.abs(y - 10) * 0.12 ? [(x + 0.5 - 8) / 6, (y - 10) / 10, 0.85] : null));
    t.forme('tissuRouge', (x, y) => (y >= 2 && y <= 5 && Math.abs(x + 0.5 - 8) < 6 - (y === 2 ? 2 : 0) ? [0, -0.6, 0.8] : null), { decalage: 0.2 });
    t.poser(8, 1, 'chanvre', 4); t.poser(7, 1, 'chanvre', 3);
    for (const [x, y] of [[4, 6], [4, 7], [4, 8], [5, 6]]) t.poser(x, y, 'miel', 5);
    t.forme('parchemin', (x, y) => (y >= 9 && y <= 12 && x >= 5 && x <= 10 ? [0, 0, 1] : null), { decalage: 0.3 }); // l'étiquette
    t.poser(7, 10, 'miel', 2); t.poser(8, 11, 'miel', 2);
  },
  // Une blague à tabac de cuir et une pipe de bois
  tabac(t) {
    t.forme('cuir', ellipsoide(6, 10, 5, 4.5));
    t.forme('cuir', (x, y) => (y >= 4 && y <= 6 && Math.abs(x + 0.5 - 6) < 2 ? [0, -0.5, 0.8] : null), { decalage: 0.3 });
    for (let x = 3; x <= 9; x++) t.poser(x, 7, 'chanvre', 3);
    trait(t, 'chene', 9, 13, 15, 8, 0.6, { decalage: 0.3 });
    t.forme('chene', ellipsoide(14, 7, 1.8, 2.4), { decalage: 0.2 });
    t.poser(14, 5, 'encre', 0);
  },
  // Une broche d'or ciselée, sertie d'une pierre bleue
  broche(t) {
    t.rampes.saphir = rampe(0x2a5ac8);
    t.forme('or', ellipsoide(8, 8, 6, 6));
    for (let a = 0; a < 6.28; a += 0.5) t.poser(Math.round(8 + Math.cos(a) * 5), Math.round(8 + Math.sin(a) * 5), 'or', 5 - (Math.round(a * 2) % 2) * 3);
    t.forme('saphir', ellipsoide(8, 8, 2.8, 2.8), { decalage: 0.4 });
    t.poser(7, 7, 'verre', 5);
  },
  // Un vieux grimoire relié de cuir, fermoir doré, pages jaunies
  livre(t) {
    t.forme('parchemin', (x, y) => (x >= 3 && x <= 13 && y >= 4 && y <= 14 ? [0.4, 0, 0.8] : null), { decalage: -0.3 });
    t.forme('tissuRouge', (x, y) => (x >= 2 && x <= 12 && y >= 3 && y <= 13 ? [(x - 7) / 12, (y - 8) / 12, 0.9] : null));
    for (let y = 3; y <= 13; y++) t.poser(2, y, 'tissuRouge', 1);
    for (let x = 4; x <= 10; x++) { t.poser(x, 5, 'or', 4); t.poser(x, 11, 'or', 3); }
    t.forme('or', ellipsoide(7, 8, 1.6, 1.6), { decalage: 0.4 });
    for (let y = 7; y <= 9; y++) t.poser(13, y, 'or', 4);
  },
  // Un fer à cheval porte-bonheur, et ses clous
  ferACheval(t) {
    t.forme('metal', (x, y) => {
      const dx = x + 0.5 - 8, dy = y + 0.5 - 7, r = Math.hypot(dx, dy);
      return r > 3 && r < 6.2 && (dy < 3 || Math.abs(dx) > 3) && y <= 14 ? [dx / 6, dy / 6, 0.7] : null;
    });
    for (const [x, y] of [[3, 6], [4, 3], [12, 6], [11, 3], [3, 10], [12, 10]]) t.poser(x, y, 'encre', 1);
  },
  // Une bouteille de vin rouge, bouchon de cire, étiquette
  vin(t) {
    t.rampes.bouteille = rampe(0x2a4a2a);
    t.forme('bouteille', (x, y) => {
      const l = y < 6 ? 1.6 : y < 8 ? 1.6 + (y - 6) * 1.2 : 4;
      return y >= 2 && y <= 15 && Math.abs(x + 0.5 - 8) < l ? [(x + 0.5 - 8) / 4, 0, 0.85] : null;
    });
    for (let y = 1; y <= 3; y++) for (let x = 7; x <= 8; x++) t.poser(x, y, 'tissuRouge', 3);
    t.forme('parchemin', (x, y) => (y >= 9 && y <= 12 && Math.abs(x + 0.5 - 8) < 3.3 ? [0, 0, 1] : null), { decalage: 0.2 });
    t.poser(8, 10, 'tissuRouge', 2); t.poser(7, 11, 'tissuRouge', 2);
    for (let y = 8; y <= 13; y++) t.poser(6, y, 'bouteille', 5);
  },
  // Un gâteau aux mûres, avec sa part de crème
  gateau(t) {
    t.rampes.mure = rampe(0x5a1a4a);
    t.forme('pain', (x, y) => (y >= 8 && y <= 14 && x >= 2 && x <= 14 ? [(x - 8) / 12, (y - 11) / 10, 0.9] : null));
    t.forme('lin', (x, y) => (y >= 6 && y <= 8 && x >= 2 && x <= 14 ? [0, -0.6, 0.8] : null), { decalage: 0.5 });
    for (const x of [3, 6, 9, 12]) t.poser(x, 9, 'lin', 5);
    for (const [x, y] of [[4, 5], [8, 4], [11, 5], [6, 5]]) t.forme('mure', ellipsoide(x, y, 1.4, 1.4), { decalage: 0.3 });
    for (let x = 2; x <= 14; x++) t.poser(x, 11, 'mure', 2);
  },
  // --- (v0.63) Les armes de chaque peuple, et le bois ---
  // Trois planches de bois clair empilées, le fil du bois et les cernes au bout
  bois(t) {
    t.rampes.planche = rampe(0xc89058);
    for (const [y, dx] of [[12, 0], [8, 1], [4, -1]]) {
      t.forme('planche', (x, py) => (py >= y - 1 && py <= y + 2 && x >= 1 + dx && x <= 14 + dx ? [0, (py - y) / 3 - 0.3, 0.85] : null), { motif: (x, py) => (py === y && x % 5 !== 0 ? -0.6 : 0) });
      for (let k = 0; k < 4; k++) t.poser(14 + dx, y - 1 + k, 'chene', k === 0 || k === 3 ? 2 : 3);   // le bout, plus sombre
      t.poser(4 + dx, y + 1, 'chene', 1); t.poser(10 + dx, y + 1, 'chene', 1);                     // des nœuds
    }
  },
  // La hache de guerre : manche de bois, large fer en croissant
  hache(t) {
    trait(t, 'chene', 3, 14, 11, 4, 0.8);
    t.forme('metal', (x, y) => { const d = Math.hypot(x + 0.5 - 8, y + 0.5 - 8); return d > 4 && d < 8 && x >= 9 && y <= 8 && y >= 1 ? [(x - 11) / 4, (y - 4) / 5, 0.85] : null; }, { decalage: 0.3 });
    for (let k = 0; k < 6; k++) t.poser(13 + Math.round(Math.sin(k / 5 * Math.PI) * 1), 2 + k, 'metal', 5);
    t.forme('cuir', ellipsoide(4.5, 12.5, 1.3, 1.3));
  },
  // Le marteau de guerre des nains : une lourde tête carrée en travers du manche, ses faces de frappe
  // Le marteau de guerre des nains : un manche droit gainé de cuir, une lourde tête de fer posée en
  // travers (un T), ses deux faces de frappe plus claires et une bague sous la tête
  marteau(t) {
    trait(t, 'chene', 5, 15, 8, 5, 0.9);
    for (const k of [0, 1, 2]) t.poser(5, 14 - k, 'cuir', 3);
    t.forme('metal', (x, y) => (x >= 2 && x <= 13 && y >= 1 && y <= 5 ? [(x - 7.5) / 7, (y - 3) / 4 - 0.2, 0.85] : null), { decalage: 0.2 });
    for (let y = 1; y <= 5; y++) { t.poser(2, y, 'metal', 5); t.poser(13, y, 'metal', 4); }
    for (let x = 3; x <= 12; x++) t.poser(x, 1, 'metal', 5);
    t.forme('metal', ellipsoide(8, 6.5, 1.6, 1), { decalage: -0.3 });
  },
  // L'arc long des elfes, sa corde tendue
  arc(t) {
    t.forme('chene', (x, y) => { const d = Math.hypot(x + 0.5 - 0.5, y + 0.5 - 8); return d > 8.8 && d < 10.4 && x >= 4 ? [(x - 7) / 9, (y - 8) / 9, 0.8] : null; });
    for (let y = 1; y <= 15; y++) t.poser(5, y, 'lin', 5);
    t.forme('cuir', ellipsoide(10, 8, 1, 1.7));
    t.forme('or', ellipsoide(6, 1.5, 0.9, 0.9)); t.forme('or', ellipsoide(6, 14.5, 0.9, 0.9));
  },
  // La lance : longue hampe, pointe de fer en feuille
  lance(t) {
    trait(t, 'chene', 1, 15, 11, 5, 0.6);
    t.forme('metal', (x, y) => { const u = (x + 0.5 - 13) * 0.707 - (y + 0.5 - 3) * 0.707, v = (x + 0.5 - 13) * 0.707 + (y + 0.5 - 3) * 0.707; return Math.abs(u) < 3.2 && Math.abs(v) < 1.6 - Math.abs(u) * 0.35 ? [v / 2, -0.3, 0.85] : null; }, { decalage: 0.4 });
    t.forme('tissuRouge', ellipsoide(10, 7, 1, 1));
  },
  // Le bâton de mage : bois noueux, une pierre bleue au sommet dans une griffe d'or
  baton(t) {
    t.rampes.pierre = rampe(0x4a8ae0);
    trait(t, 'chene', 3, 15, 11, 5, 0.7);
    t.forme('or', ellipsoide(12, 4, 2.6, 2.6), { decalage: -0.2 });
    t.forme('pierre', ellipsoide(12, 4, 1.6, 1.6), { decalage: 0.5 });
    t.poser(11, 3, 'pierre', 5);
  },
  // Le bâton de bambou des pandas, ses nœuds
  bambou(t) {
    t.rampes.bambouV = rampe(0x8ac860); t.rampes.feuille = rampe(0x4a9a3a);
    trait(t, 'bambouV', 2, 14, 14, 2, 0.9);
    for (const k of [0.22, 0.48, 0.74]) { const x = 2 + 12 * k, y = 14 - 12 * k; t.forme('bambouV', (px, py) => (Math.abs((px + 0.5 - x) + (py + 0.5 - y)) < 0.9 && Math.hypot(px + 0.5 - x, py + 0.5 - y) < 1.8 ? [0, 0, 1] : null), { decalage: -0.6, bord: false }); }
    t.forme('feuille', ellipsoide(11, 8, 2.2, 0.9), { decalage: 0.2 });
    t.forme('feuille', ellipsoide(9, 9.5, 0.9, 2), { decalage: 0.1 });
  },
  // La fronde des hobbits : une lanière de cuir, un caillou dans la poche
  fronde(t) {
    trait(t, 'cuir', 3, 3, 7, 11, 0.5);
    trait(t, 'cuir', 13, 3, 9, 11, 0.5);
    t.forme('cuir', ellipsoide(8, 11.5, 2.4, 1.6), { decalage: -0.2 });
    t.forme('metal', ellipsoide(8, 10.5, 1.2, 1.1), { decalage: -0.4 });
    t.forme('chene', ellipsoide(3, 3, 1, 1)); t.forme('chene', ellipsoide(13, 3, 1, 1));
  },
  // La dague crochue des gobelins : une lame qui monte puis se recourbe comme un croc
  dague(t) {
    for (let k = 0; k <= 20; k++) {
      const u = k / 20, x = 5.5 + 8 * u, y = 10 - 9.5 * u + 7.5 * u * u, r = 1.5 * (1 - u) + 0.35;
      t.forme('metal', ellipsoide(x, y, r, r), { decalage: 0.4 });
    }
    for (let k = 0; k <= 14; k++) { const u = k / 20; t.poser(Math.round(5.5 + 8 * u - 0.6), Math.round(10 - 9.5 * u + 7.5 * u * u - 0.6), 'metal', 5); }   // le fil
    trait(t, 'metal', 3, 9, 7, 12, 0.6, { decalage: -0.2 });   // la garde
    trait(t, 'cuir', 2, 14, 5, 11, 0.8);
    t.forme('metal', ellipsoide(1.6, 14.6, 0.9, 0.9), { decalage: 0.3 });
  },
  // La rapière des vampires : lame fine et longue, coquille d'argent, rubis
  rapiere(t) {
    trait(t, 'metal', 4, 12, 15, 1, 0.5, { decalage: 0.7 });
    t.forme('metal', ellipsoide(4.5, 11.5, 2.2, 2.2), { decalage: 0.2 });
    t.forme('tissuRouge', ellipsoide(4.5, 11.5, 0.9, 0.9), { decalage: 0.6 });
    trait(t, 'cuir', 1, 15, 3, 13, 0.6);
  },
  // Le khopesh des momies, l'épée-faucille des pharaons : une poignée droite dorée à bandes, un
  // Le khopesh des momies, l'épée-faucille des pharaons : poignée dorée à bandes de lapis, un col
  // droit, puis une large lame de bronze qui se recourbe vers l'avant (le fil sur le dos de la courbe)
  khopesh(t) {
    t.rampes.bronze = [0x4a3010, 0x7a5420, 0xa8782e, 0xd0a048, 0xe8c470, 0xfaeaa8]; t.rampes.lapis = rampe(0x2a5ac8);
    trait(t, 'or', 1.5, 14.5, 4.5, 11.5, 0.9);
    t.poser(2, 13, 'lapis', 4); t.poser(4, 11, 'lapis', 4);
    trait(t, 'bronze', 4.5, 11.5, 7.5, 8, 0.8, { decalage: 0.2 });   // le col droit
    const pts = [[7.5, 8], [8.2, 5.5], [9.6, 3.4], [11.6, 2.4], [13.4, 3], [14.4, 4.8], [14.4, 7], [13.6, 8.6]];
    for (let i = 0; i < pts.length - 1; i++) { const [a, b] = pts[i], [c, d] = pts[i + 1]; const r = i < 5 ? 1.8 : 1.3 - (i - 5) * 0.35; for (let k = 0; k <= 6; k++) { const u = k / 6; t.forme('bronze', ellipsoide(a + (c - a) * u, b + (d - b) * u, r, r), { decalage: 0.35 }); } }
    for (let i = 1; i < pts.length - 1; i++) t.poser(Math.round(pts[i][0] + (pts[i][0] - 11) * 0.12), Math.round(pts[i][1] - 0.8), 'bronze', 5);   // le fil, sur l'extérieur
  },
  // Les griffes de fer des loups-garous : trois lames courbes sur un gantelet
  griffes(t) {
    t.forme('cuir', ellipsoide(5, 11, 3.6, 3), { decalage: -0.2 });
    for (const d of [-2.5, 0, 2.5]) trait(t, 'metal', 6 + d * 0.5, 9 + d, 13, 3 + d * 1.4, 0.55, { decalage: 0.5 });
  },
  // La massue cloutée des trolls : un gros bois noueux hérissé de clous
  massue(t) {
    trait(t, 'chene', 3, 14, 7, 9, 0.8);
    t.forme('chene', (x, y) => { const u = (x + 0.5 - 10.5) * 0.707 - (y + 0.5 - 5.5) * 0.707, v = (x + 0.5 - 10.5) * 0.707 + (y + 0.5 - 5.5) * 0.707; return Math.abs(u) < 3.6 && Math.abs(v) < 5 - Math.max(0, -v) * 0.3 ? [u / 4, v / 6, 0.85] : null; }, { decalage: 0.1 });
    for (const [x, y] of [[9, 2], [13, 4], [12, 8], [8, 6], [10, 5]]) t.poser(x, y, 'metal', 5);
  },
  // --- Les matériaux de l'atelier ---
  // Un lingot de fer
  fer(t) {
    t.forme('metal', (x, y) => (y >= 7 && y <= 13 && x >= 2 + (13 - y) * 0.3 && x <= 14 - (13 - y) * 0.3 ? [0, (y - 10) / 8, 0.9] : null), { decalage: -0.5 });
    for (let x = 4; x <= 12; x++) t.poser(x, 7, 'metal', 5);
    t.forme('metal', (x, y) => (y >= 4 && y <= 8 && x >= 4 + (8 - y) * 0.3 && x <= 12 - (8 - y) * 0.3 ? [0, -0.6, 0.8] : null), { decalage: -0.2 });
  },
  // Un rouleau de cuir, lié d'une ficelle
  cuir(t) {
    t.forme('cuir', (x, y) => (y >= 5 && y <= 12 && x >= 3 && x <= 13 ? [0, (y - 8.5) / 5, 0.8] : null));
    t.forme('cuir', ellipsoide(13, 8.5, 2, 3.7), { decalage: 0.4 });
    t.poser(13, 8, 'cuir', 1); t.poser(13, 9, 'cuir', 1);
    for (let y = 5; y <= 12; y++) { t.poser(6, y, 'chanvre', 4); t.poser(10, y, 'chanvre', 4); }
  },
  // Une bobine de fil d'or sur son fuseau de bois, un bout de fil qui s'échappe
  filOr(t) {
    t.rampes.filOr = rampe(0xe0b030);
    t.forme('chene', (x, y) => ((y === 3 || y === 13) && x >= 3 && x <= 12 ? [0, y === 3 ? -0.8 : 0.6, 0.6] : null));
    t.forme('filOr', (x, y) => (y >= 4 && y <= 12 && x >= 4 && x <= 11 ? [(x - 7.5) / 5, 0, 0.85] : null), { motif: (x, y) => (y % 2 ? 0.5 : -0.3) });
    for (let y = 4; y <= 12; y += 2) t.poser(5, y, 'filOr', 5);
    for (const [x, y] of [[12, 8], [13, 9], [14, 11], [14, 12], [13, 14]]) t.poser(x, y, 'filOr', 4);
  },

  // Une miche de pain croûtée, et un morceau de fromage
  ration(t) {
    t.forme('fromage', (x, y) => (x >= 8 && x <= 15 && y <= 14 && y >= 14 - (x - 8) * 0.85 ? [0.3, -0.3, 0.8] : null));
    t.poser(13, 12, 'fromage', 1); t.poser(14, 10, 'fromage', 1); t.poser(15, 13, 'fromage', 2); // les trous
    t.forme('pain', ellipsoide(7, 9, 6.5, 4.5));
    for (const x of [4, 7, 10]) { t.poser(x, 7, 'pain', 1); t.poser(x + 1, 8, 'pain', 1); t.poser(x, 6, 'pain', 5); }
  },
  // Une gourde de cuir bouchée, avec sa lanière
  gourde(t) {
    trait(t, 'cuir', 7, 3, 2, 8, 0.5, { bord: false, decalage: -0.6 }); // la lanière
    t.forme('cuir', ellipsoide(8, 10, 5.5, 5));
    t.forme('cuir', (x, y) => (y >= 3 && y <= 5 && x >= 7 && x <= 9 ? [(x - 8) / 2, 0, 0.9] : null));
    t.forme('chene', (x, y) => (y >= 1 && y <= 2 && x >= 7 && x <= 9 ? [(x - 8) / 2, -0.5, 0.8] : null), { decalage: 0.5 });
    for (let x = 4; x <= 12; x++) t.poser(x, 10, 'cuir', 2); // la couture
  },
  // Une épée en diagonale : lame claire, garde dorée, poignée de cuir, pommeau
  epee(t) {
    trait(t, 'metal', 4, 12, 14, 2, 1.1, { decalage: 0.6 });
    for (let k = 0; k < 8; k++) t.poser(6 + k, 10 - k, 'metal', 5); // le fil de la lame
    trait(t, 'or', 2, 9, 7, 14, 0.8);
    trait(t, 'cuir', 2, 14, 4, 12, 0.8);
    t.forme('or', ellipsoide(1.5, 14.5, 1.3, 1.3));
  },
  // Trois flèches : empennage rouge et blanc, pointes de fer
  fleches(t) {
    for (const d of [-3, 0, 3]) {
      trait(t, 'chene', 2 + d, 14, 12 + d, 3, 0.5, { bord: false, decalage: 0.5 });
      t.forme('metal', (x, y) => (Math.abs(x + 0.5 - (12.5 + d)) + Math.abs(y + 0.5 - 2.5) < 1.8 ? [0.3, -0.4, 0.8] : null), { decalage: 0.5 });
      t.poser(1 + d, 14, 'tissuRouge', 4); t.poser(2 + d, 15, 'tissuRouge', 3); t.poser(2 + d, 13, 'parchemin', 5);
    }
  },
  // Une fiole ronde de potion rouge, avec son reflet et son bouchon
  potion(t) {
    t.forme('verreRouge', ellipsoide(8, 10, 5.5, 5.2));
    t.forme('verre', (x, y) => (y >= 3 && y <= 5 && x >= 7 && x <= 9 ? [(x - 8) / 2, 0, 0.9] : null), { decalage: -0.5 });
    t.forme('chene', (x, y) => (y >= 1 && y <= 2 && x >= 6 && x <= 10 ? [(x - 8) / 3, -0.5, 0.8] : null), { decalage: 0.4 });
    t.poser(5, 8, 'verre', 5); t.poser(5, 9, 'verre', 5); t.poser(6, 7, 'verre', 5); // le reflet
    for (let x = 4; x <= 12; x++) t.poser(x, 7, 'verreRouge', 5); // la surface du liquide
  },
  // Un rouleau de bandage, avec sa bande qui pend
  bandage(t) {
    // Le corps du rouleau, couché, puis sa face enroulée en spirale
    t.forme('lin', (x, y) => (x >= 5 && x <= 13 && y >= 4 && y <= 11 ? [0, (y - 7.5) / 4.5, 0.85] : null), { motif: (x) => (x % 3 === 0 ? -0.35 : 0) });
    t.forme('lin', ellipsoide(5, 7.5, 2.6, 4.2), { decalage: 0.3 });
    for (const [x, y] of [[4, 6], [5, 6], [6, 7], [5, 9], [4, 8], [4, 7]]) t.poser(x, y, 'lin', 2);
    t.poser(5, 7, 'lin', 1); t.poser(5, 8, 'lin', 1);
    // La bande qui pend en ondulant
    t.forme('lin', (x, y) => (y >= 11 && y <= 14 && x >= 9 + Math.sin(y) && x <= 13 + Math.sin(y) ? [0.2, 0.3, 0.9] : null), { decalage: -0.2 });
    // La croix rouge
    t.dessin(9, 6, ['.r.', 'rrr', '.r.'], { r: ['tissuRouge', 4] });
  },
  // Une torche : manche de bois, tissu enroulé, flamme vivante
  torche(t) {
    trait(t, 'chene', 6, 15, 9, 6, 0.9);
    t.forme('lin', ellipsoide(9.5, 6, 2.6, 1.8), { decalage: -0.8 });
    // Une flamme en goutte : pointue en haut, ronde en bas, le cœur presque blanc
    const flamme = (k) => (x, y) => {
      const v = (y + 0.5) / 6.5; // 0 en haut, 1 en bas
      const w = 4.4 * k * Math.sqrt(Math.max(0, v)) * (1.15 - v * 0.45);
      const nx = (x + 0.5 - 9.5 - (1 - v) * 0.8) / Math.max(0.5, w);
      return y < 7 && Math.abs(nx) <= 1 ? [nx, -0.3, 0.9] : null;
    };
    t.forme('flamme', flamme(1), { decalage: -0.3, bord: false });
    t.forme('flamme', flamme(0.55), { decalage: 1.2, bord: false });
    t.poser(10, 0, 'flamme', 3); t.poser(8, 5, 'flamme', 5);
  },
  // Une corde lovée en spirale
  corde(t) {
    for (let a = 0; a < 6.28 * 2.2; a += 0.12) {
      const r = 6.5 - a * 0.33;
      const x = 8 + Math.cos(a) * r, y = 8 + Math.sin(a) * r * 0.8;
      t.forme('chanvre', ellipsoide(x, y, 1.3, 1.3), { bord: false, decalage: Math.sin(a * 6) * 0.6 });
    }
  },
  // Une fiole d'antidote, longue et verte, avec une étiquette en forme de feuille
  antidote(t) {
    t.forme('verreVert', (x, y) => (y >= 5 && y <= 14 && Math.abs(x + 0.5 - 8) < 3.2 ? [(x + 0.5 - 8) / 3.2, (y - 9) / 8, 0.8] : null));
    t.forme('verre', (x, y) => (y >= 2 && y <= 4 && Math.abs(x + 0.5 - 8) < 1.6 ? [(x + 0.5 - 8) / 1.6, 0, 0.9] : null), { decalage: -0.5 });
    t.forme('chene', (x, y) => (y >= 0 && y <= 1 && Math.abs(x + 0.5 - 8) < 2.2 ? [0, -0.5, 0.8] : null), { decalage: 0.4 });
    t.dessin(6, 8, ['.pp.', 'pPPp', '.pp.'], { p: ['parchemin', 4], P: ['verreVert', 1] });
    t.poser(6, 6, 'verre', 5); t.poser(6, 7, 'verre', 5);
  },
  // Une cape chaude pliée, avec son fermoir doré et sa fourrure
  cape(t) {
    // Elle s'évase vers le bas, avec de grands plis
    t.forme('tissuRouge', (x, y) => {
      const demi = 3.2 + (y - 4) * 0.45, dx = x + 0.5 - 8;
      return y >= 4 && y <= 15 && Math.abs(dx) < demi ? [dx / (demi + 1), (y - 9) / 12, 0.8] : null;
    }, { motif: (x, y) => (y > 6 && (x === 6 || x === 10) ? -0.9 : y > 8 && (x === 4 || x === 12) ? -0.6 : (x === 7 || x === 11) ? 0.3 : 0) });
    for (let x = 2; x <= 13; x++) t.poser(x, 15, 'tissuRouge', 1); // l'ourlet
    t.forme('lin', ellipsoide(8, 4.2, 5, 2.2), { decalage: 0.2, motif: (x, y) => ((x + y) % 2 ? 0.4 : -0.4) }); // le col de fourrure
    t.forme('or', ellipsoide(8, 6, 1.4, 1.4), { decalage: 0.3 });
  },
  // Un bouclier rond : planches, cerclage de fer, ombon au centre
  bouclier(t) {
    t.forme('metal', ellipsoide(8, 8, 7.2, 7.2), { decalage: -0.4 });
    t.forme('chene', ellipsoide(8, 8, 5.8, 5.8), { motif: (x) => (x % 4 === 0 ? -0.9 : 0) });
    t.forme('metal', ellipsoide(8, 8, 2.2, 2.2), { decalage: 0.6 });
    for (const [x, y] of [[8, 2], [2, 8], [14, 8], [8, 14]]) t.poser(x, y, 'or', 4);
  },
  // Une amulette : chaîne dorée et gemme violette
  amulette(t) {
    // La chaîne, en maillons alternés, qui monte du pendentif
    let m = 0;
    for (let a = Math.PI + 0.25; a < 2 * Math.PI - 0.2; a += 0.16) t.poser(Math.round(8 + Math.cos(a) * 5.5), Math.round(9 + Math.sin(a) * 7.5), 'or', m++ % 2 ? 4 : 1);
    t.forme('or', ellipsoide(8, 11, 3.6, 3.8));
    t.forme('gemme', ellipsoide(8, 11, 2.4, 2.6), { decalage: 0.4 });
    t.poser(7, 10, 'gemme', 5);
  },
};

// Crée les icônes HD des marchandises : « hd_ration », « hd_epee »...
function creerObjetsHD(scene) {
  for (const [id, dessin] of Object.entries(DESSINS_OBJETS)) {
    if (scene.textures.exists('hd_' + id)) continue;
    // (v0.79) les provisions redessinées en 32 × 32 (planche 10, validée le 18/10)
    if (typeof DESSINS_OBJETS_32 !== 'undefined' && DESSINS_OBJETS_32[id]) {
      const t = toileObjet32();
      DESSINS_OBJETS_32[id](t);
      t.contour();
      t.texture(scene, 'hd_' + id);
      afficherEnDemiTaille(scene, 'hd_' + id);
      continue;
    }
    const t = toileObjet();
    dessin(t);
    t.contour();
    t.texture(scene, 'hd_' + id);
  }
  creerPiecesHD(scene);
}

// (v0.79) Une texture de 32 × 32 qui s'affiche à la taille d'une icône de 16 × 16 : partout où le
// jeu pose une icône (à l'échelle 2, 3, 3.6...), elle garde sa taille, mais avec deux fois plus de
// détails. Phaser dessine une image à la taille de sa découpe (16 × 16) en y étirant les
// coordonnées de texture (ici, toute l'image 32 × 32).
function afficherEnDemiTaille(scene, cle) {
  const f = scene.textures.get(cle).get();
  const L = f.source.width, H = f.source.height;
  f.setSize(L / 2, H / 2, 0, 0);
  f.u0 = 0; f.v0 = 0; f.u1 = 1; f.v1 = 1;
  f.canvasData.width = L; f.canvasData.height = H;   // (le rendu en canvas lit la source entière)
}

// L'icône d'un objet : la version HD si elle existe, sinon l'ancienne.
function iconeObjet(scene, id) {
  return scene.textures.exists('hd_' + id) ? 'hd_' + id : id;
}

// --- Les pièces d'or ---

function creerPiecesHD(scene) {
  if (scene.textures.exists('etiquette')) return;
  // Une pièce vue de face : rebord en relief, champ creusé, couronne frappée, reflet
  {
    const t = toileObjet(12, 12);
    t.forme('or', ellipsoide(6, 6, 5.6, 5.6));
    t.forme('or', ellipsoide(6, 6, 4, 4), { decalage: -0.8, bord: false });
    // La couronne, frappée en creux : ombre en haut à gauche, lumière en bas à droite
    const couronne = ['o.o.o', 'ooooo', '.ooo.'];
    couronne.forEach((l, j) => [...l].forEach((c, i) => {
      if (c !== 'o') return;
      t.poser(4 + i, 4 + j, 'or', 2);
      if (!(couronne[j + 1] && couronne[j + 1][i] === 'o')) t.poser(4 + i, 5 + j, 'or', 5);
    }));
    t.poser(2, 3, 'or', 5); t.poser(3, 2, 'or', 5); t.poser(2, 4, 'or', 5);
    t.contour();
    t.texture(scene, 'pieceFace');
  }
  // Une pièce de profil (dans une pile) : tranche cannelée et dessus éclairé
  {
    const t = toileObjet(14, 6);
    t.forme('or', ellipsoide(7, 2.6, 6.6, 2.4), { decalage: 0.3 });
    for (let x = 1; x < 13; x++) for (const y of [3, 4]) t.poser(x, y, 'or', x % 2 ? 2 : 3); // les cannelures
    t.poser(4, 1, 'or', 5); t.poser(5, 1, 'or', 5);
    t.contour();
    t.texture(scene, 'pieceTranche');
  }
  // Le petit éclat qui scintille
  {
    const t = toileObjet(7, 7);
    t.dessin(0, 0, ['...o...', '...o...', '..oOo..', 'ooOOOoo', '..oOo..', '...o...', '...o...'], { o: ['or', 4], O: ['verre', 5] });
    t.texture(scene, 'eclat');
  }
  // La petite étiquette de parchemin des casiers, avec son œillet
  {
    const t = toileObjet(16, 8);
    t.forme('parchemin', (x, y) => (y >= 1 && y <= 6 && x >= 1 && x <= 14 && !(x === 1 && (y === 1 || y === 6)) ? [0, -0.2, 0.9] : null),
      { motif: (x, y) => (hachage(x, y, 7) < 0.15 ? -0.6 : 0) });
    t.poser(2, 3, 'chene', 0); t.poser(2, 4, 'chene', 1);
    t.contour();
    t.texture(scene, 'etiquette');
  }
}
