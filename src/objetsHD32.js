// (v0.78, planche à valider) Les provisions redessinées en 32 × 32 : deux fois plus fines que les
// anciennes icônes, à la finesse des personnages, et fidèles à leur nom (la cape chaude est
// une épaisse cape de laine fourrée, la ration un vrai repas de voyage noué dans un torchon...).
// Même moteur que les objets HD : dégradés de 6 teintes, lumière en haut à gauche, contour coloré.

const RAMPES_OBJETS_32 = {
  laine: [0x2a1a10, 0x4a2e1a, 0x6a4426, 0x8a5c34, 0xa87848, 0xc89a66],
  fourrure: [0x5a4a3a, 0x8a7a64, 0xb0a088, 0xcfc2a8, 0xe6dcc6, 0xf8f2e4],
  saucisson: [0x2a0a08, 0x4e1610, 0x74241a, 0x96362a, 0xb85444, 0xd88070],
  pomme: [0x3a0808, 0x6a1010, 0x9a1c18, 0xc83226, 0xe85a40, 0xffa080],
  feuille: [0x0e2a10, 0x1a4a1c, 0x2a6a2a, 0x40903a, 0x64b452, 0xa0dc80],
  fil: [0x5a4428, 0x7e6238, 0xa2824c, 0xc4a466, 0xdcc28a, 0xf0e0b4],
  braise: [0x3a0a04, 0x6a1a08, 0x9a2e0c, 0xc84a10, 0xf07a20, 0xffc060],
  bronze: [0x2e1a08, 0x4e3010, 0x76481a, 0x9a6428, 0xc08a40, 0xe8b868],
  bleuNuit: [0x0a0c24, 0x161c44, 0x242e6a, 0x34449a, 0x5068c4, 0x90a8f0],
};

function toileObjet32() {
  const t = new ToileHD(32, 32);
  Object.assign(t.rampes, RAMPES_DECOR, RAMPES_OBJETS, RAMPES_OBJETS_32);
  return t;
}

// Une forme « boîte » éclairée (rectangle aux bords arrondis)
function boite(x0, y0, x1, y1, r = 1.5) {
  return (x, y) => {
    if (x < x0 || x > x1 || y < y0 || y > y1) return null;
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, lx = (x1 - x0) / 2, ly = (y1 - y0) / 2;
    const dx = Math.max(0, Math.abs(x - cx) - (lx - r)), dy = Math.max(0, Math.abs(y - cy) - (ly - r));
    if (dx * dx + dy * dy > r * r) return null;
    return [(x - cx) / (lx + 1), (y - cy) / (ly + 1), 0.85];
  };
}

const DESSINS_OBJETS_32 = {
  // La ration de voyage : un torchon à carreaux ouvert, une miche croûtée entaillée, un coin de
  // fromage à trous et un saucisson sec ficelé
  ration(t) {
    t.forme('lin', (x, y) => {   // le torchon, en losange aplati
      const u = Math.abs(x + 0.5 - 16) / 15.5 + Math.abs(y + 0.5 - 22) / 10;
      return u <= 1 ? [0, -0.4, 0.8] : null;
    }, { motif: (x, y) => ((x >> 2) + (y >> 2)) % 2 ? -0.5 : 0.2, decalage: 0.2 });
    t.rampes.carreau = rampe(0xb83a30);
    for (let x = 3; x <= 29; x++) for (let y = 14; y <= 30; y++) if (t.mat(x, y) === 'lin' && (x % 6 === 1 || y % 6 === 2)) t.poser(x, y, 'carreau', 3);
    t.forme('saucisson', (x, y) => {   // le saucisson, couché en biais derrière
      const u = (x + 0.5 - 21) * 0.92 + (y + 0.5 - 12) * 0.4, v = -(x + 0.5 - 21) * 0.4 + (y + 0.5 - 12) * 0.92;
      return Math.abs(u) < 8 && Math.abs(v) < 2.6 - Math.max(0, Math.abs(u) - 6) ? [u / 10, v / 3, 0.8] : null;
    }, { motif: (x, y) => ((x * 7 + y * 13) % 9 === 0 ? 0.9 : 0) });
    for (const [x, y] of [[16, 9], [17, 9], [25, 13], [26, 14]]) t.poser(x, y, 'chanvre', 4);
    t.forme('pain', ellipsoide(12, 16, 10.5, 7.5));   // la miche
    for (const x of [5, 10, 15]) for (let k = 0; k < 5; k++) { t.poser(x + k, 11 + k, 'pain', 1); t.poser(x + k + 1, 11 + k, 'pain', 5); }   // les entailles
    t.forme('fromage', (x, y) => (x >= 17 && x <= 30 && y <= 27 && y >= 27 - (x - 17) * 0.85 ? [0.2, -0.4, 0.85] : null), { decalage: 0.2 });
    for (const [x, y, r] of [[25, 23, 1.3], [28, 25, 0.9], [22, 25, 1]]) t.forme('fromage', ellipsoide(x, y, r, r), { decalage: -1.2, bord: false });
  },
  // La gourde : une outre de cuir cousue, le goulot cerclé de laiton, le bouchon de liège, la lanière
  gourde(t) {
    // la lanière : une boucle de cuir qui part du goulot et retombe sur le côté
    for (let a = -0.4; a < 3.6; a += 0.05) { const x = 9 + Math.cos(a) * 7.5, y = 13 - Math.sin(a) * 9; t.forme('cuirRouge', ellipsoide(x, y, 1.1, 1.1), { bord: false }); }
    t.forme('cuir', (x, y) => {
      const dx = x + 0.5 - 17, dy = y + 0.5 - 20;
      return (dx * dx) / 121 + (dy * dy) / 100 <= 1 && y >= 10 ? [dx / 12, dy / 11, Math.sqrt(Math.max(0, 1 - (dx * dx + dy * dy) / 170))] : null;
    });
    for (let y = 11; y <= 29; y++) if (t.mat(17, y) === 'cuir') { t.poser(17, y, 'cuir', 1); if (y % 2) t.poser(18, y, 'fil', 4); }   // la couture
    t.forme('cuir', boite(14, 6, 20, 11, 1), { decalage: -0.3 });   // le goulot
    t.forme('laiton', boite(13, 8, 21, 10, 1), { decalage: 0.3 });
    t.forme('chene', boite(14, 2, 20, 6, 1.5), { decalage: 0.6 });   // le bouchon
    for (const [x, y] of [[10, 16], [10, 17], [11, 15], [10, 18]]) t.poser(x, y, 'cuir', 5);   // un reflet
  },
  // Les flèches : une botte de trois flèches liée d'une ficelle, empennes rouges et blanches, pointes de fer
  fleches(t) {
    // trois flèches en éventail : la hampe de bois, la pointe de fer, l'empenne de plumes rouges et blanches
    for (const [x0, y0, x1, y1] of [[4, 27, 23, 4], [8, 29, 28, 9], [3, 22, 18, 3]]) {
      const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
      trait(t, 'chene', x0 + ux * 3, y0 + uy * 3, x1 - ux * 3, y1 - uy * 3, 0.7, { decalage: 0.4 });
      // la pointe, un losange de fer
      t.forme('metal', (x, y) => { const px = x + 0.5 - (x1 - ux * 1.5), py = y + 0.5 - (y1 - uy * 1.5); const u = px * ux + py * uy, v = -px * uy + py * ux; return Math.abs(u) / 3.4 + Math.abs(v) / 1.9 <= 1 ? [u / 4, v / 2, 0.8] : null; }, { decalage: 0.5 });
      // l'empenne : deux plumes de chaque côté de la hampe
      for (let k = 0; k < 6; k++) {
        const bx = x0 + ux * (1 + k), by = y0 + uy * (1 + k);
        t.poser(Math.round(bx - uy * 1.6), Math.round(by + ux * 1.6), 'tissuRouge', 4 - (k % 2));
        t.poser(Math.round(bx + uy * 1.6), Math.round(by - ux * 1.6), 'parchemin', 5 - (k % 2));
        if (k < 4) { t.poser(Math.round(bx - uy * 2.6), Math.round(by + ux * 2.6), 'tissuRouge', 3); t.poser(Math.round(bx + uy * 2.6), Math.round(by - ux * 2.6), 'parchemin', 4); }
      }
    }
  },
  // La potion : une fiole ronde au liquide rouge, un cœur sur l'étiquette (elle rend un cœur),
  // le bouchon scellé de cire
  potion(t) {
    t.forme('verreRouge', ellipsoide(16, 20, 10.5, 10));
    t.forme('verre', (x, y) => (y >= 3 && y <= 11 && Math.abs(x + 0.5 - 16) < 3.4 ? [(x + 0.5 - 16) / 3.4, 0, 0.9] : null), { decalage: -0.4 });
    t.forme('chene', boite(12, 1, 20, 5, 1.5), { decalage: 0.4 });
    t.forme('cire', boite(11, 4, 21, 6, 1), { decalage: 0.2 });
    for (let x = 7; x <= 25; x++) if (t.mat(x, 15)) t.poser(x, 15, 'verreRouge', 5);   // la surface du liquide
    for (let y = 11; y <= 14; y++) for (let x = 8; x <= 24; x++) if (t.mat(x, y) === 'verreRouge') t.poser(x, y, 'verre', 3);   // le vide en haut de la fiole
    t.forme('parchemin', boite(11, 18, 21, 26, 1.5), { decalage: 0.3 });   // l'étiquette
    t.dessin(13, 19, ['.rr.rr.', 'rrrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...'], { r: ['verreRouge', 3] });
    for (const [x, y] of [[9, 14], [9, 15], [10, 13], [8, 17], [8, 18]]) t.poser(x, y, 'verre', 5);   // le reflet
  },
  // Les bandages : deux rouleaux de lin, une bande déroulée qui ondule, la croix rouge des soigneurs
  bandage(t) {
    // un gros rouleau de lin couché, sa face enroulée en spirale, la bande qui se déroule en ondulant
    t.forme('lin', (x, y) => (y >= 15 && y <= 30 && x >= 18 + Math.sin(y * 0.7) * 1.6 && x <= 27 + Math.sin(y * 0.7) * 1.6 ? [0.2, 0.3, 0.9] : null), { decalage: -0.3 });
    t.forme('lin', (x, y) => (x >= 9 && x <= 26 && Math.abs(y + 0.5 - 14) < 8.5 ? [0, (y + 0.5 - 14) / 9, 0.85] : null), { motif: (x) => (x % 3 === 0 ? -0.3 : 0) });
    t.forme('lin', ellipsoide(9, 14, 5, 8.5), { decalage: 0.3 });
    for (let a = 0; a < 15; a += 0.25) { const r = 0.6 + a * 0.5; t.poser(Math.round(9 + Math.cos(a) * r * 0.55), Math.round(14 + Math.sin(a) * r), 'lin', 2); }   // la spirale
    t.dessin(15, 9, ['...rr...', '...rr...', '..rrrr..', 'rrrrrrrr', 'rrrrrrrr', '..rrrr..', '...rr...', '...rr...'].map(l => l.replace(/^\.\.rrrr\.\.$/, '...rr...')), { r: ['tissuRouge', 4] });
  },
  // La torche : un manche de bois, le tissu imbibé de poix enroulé et ficelé, une belle flamme
  torche(t) {
    trait(t, 'chene', 12, 31, 18, 18, 1.6);
    t.forme('lin', (x, y) => { const u = (x + 0.5 - 18.5), v = (y + 0.5 - 18); return Math.abs(u) < 4.6 && Math.abs(v) < 3.6 ? [u / 5, v / 4, 0.8] : null; }, { decalage: -0.9, motif: (x, y) => ((x + y) % 3 === 0 ? -0.6 : 0) });
    for (let x = 14; x <= 23; x++) t.poser(x, 19, 'chanvre', 3);
    t.rampes.flamme2 = RAMPES_OBJETS.flamme;
    const flamme = (k, dx = 0) => (x, y) => {
      const v = (y + 0.5 - 2) / 14;   // (la pointe à 2 pixels du bord : elle n'est plus coupée)
      if (v < 0) return null;
      const w = 7 * k * Math.sqrt(v) * (1.15 - v * 0.45);
      const nx = (x + 0.5 - 18.5 - dx - (1 - v) * 1.5 * Math.sin(v * 6)) / Math.max(0.5, w);
      return y < 16 && Math.abs(nx) <= 1 ? [nx, -0.3, 0.9] : null;
    };
    t.forme('braise', flamme(1), { decalage: -0.3, bord: false });
    t.forme('flamme', flamme(0.72), { decalage: 0.3, bord: false });
    t.forme('flamme', flamme(0.38), { decalage: 1.4, bord: false });
    for (const [x, y] of [[12, 6], [25, 4], [24, 9]]) t.poser(x, y, 'flamme', 4);   // des étincelles
  },
  // La corde : une corde de chanvre lovée, ses torons torsadés bien visibles, un bout qui dépasse
  corde(t) {
    for (const [cy, r] of [[19, 12], [17, 9.5], [15, 7]]) {
      for (let a = 0; a < 6.3; a += 0.06) {
        const x = 16 + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.55;
        t.forme('chanvre', ellipsoide(x, y, 1.9, 1.9), { bord: false, decalage: Math.sin(a * 14 + r) * 0.8 });
      }
    }
    for (let k = 0; k < 9; k++) t.forme('chanvre', ellipsoide(20 + k * 1.1, 21 + k * 1.05, 1.7, 1.7), { bord: false, decalage: Math.sin(k * 2) * 0.8 });   // le bout qui pend
    t.forme('fil', ellipsoide(29.5, 30, 1.8, 1.4), { decalage: 0.4 });   // l'extrémité effilochée
  },
  // L'antidote : une fiole longue au liquide vert, un serpent sur l'étiquette (contre les morsures
  // et les poisons), le bouchon ficelé
  antidote(t) {
    t.forme('verreVert', (x, y) => (y >= 10 && y <= 30 && Math.abs(x + 0.5 - 16) < 6.5 - (y > 27 ? (y - 27) * 0.8 : 0) ? [(x + 0.5 - 16) / 6.5, (y - 20) / 16, 0.8] : null));
    t.forme('verre', (x, y) => (y >= 4 && y <= 10 && Math.abs(x + 0.5 - 16) < 3 + (y > 8 ? (y - 8) * 1.4 : 0) ? [(x + 0.5 - 16) / 4, 0, 0.9] : null), { decalage: -0.4 });
    t.forme('chene', boite(13, 0, 19, 4, 1.2), { decalage: 0.4 });
    for (let x = 12; x <= 20; x++) t.poser(x, 4, 'chanvre', 4);
    t.forme('parchemin', boite(11, 15, 21, 25, 1.5), { decalage: 0.3 });
    t.dessin(12, 16, ['....ss..', '...s..s.', '....s...', '...s....', '..s.....', '...ss...', '.....s..', '...ss...'], { s: ['verreVert', 1] });   // le serpent
    for (let y = 11; y <= 22; y++) t.poser(11, y, 'verre', 5);   // le reflet
  },
  // La cape chaude : une épaisse cape de laine brune pliée, doublée de fourrure, un col de
  // fourrure bien gonflé et une broche de bronze
  cape(t) {
    t.forme('laine', (x, y) => {
      const demi = 7 + (y - 8) * 0.48, dx = x + 0.5 - 16;
      return y >= 8 && y <= 30 && Math.abs(dx) < demi ? [dx / (demi + 2), (y - 18) / 22, 0.8] : null;
    }, { motif: (x, y) => (y > 12 && (x === 12 || x === 20) ? -0.9 : y > 16 && (x === 7 || x === 25) ? -0.7 : (x === 14 || x === 22) ? 0.35 : ((x + y * 3) % 7 === 0 ? -0.25 : 0)) });
    for (let x = 0; x < 32; x++) for (let y = 27; y <= 30; y++) if (t.mat(x, y) === 'laine') t.poser(x, y, 'fourrure', y === 27 ? 2 : 4 - ((x + y) % 2));   // la doublure de fourrure qui dépasse
    t.forme('fourrure', ellipsoide(16, 8.5, 10, 4.5), { decalage: 0.3, motif: (x, y) => ((x * 3 + y * 5) % 4 === 0 ? -0.6 : (x + y) % 3 === 0 ? 0.4 : 0) });   // le col
    t.forme('bronze', ellipsoide(16, 12, 2.6, 2.6), { decalage: 0.4 });   // la broche
    t.poser(15, 11, 'bronze', 5);
  },
  // Le bouclier : un rond de planches cerclé de fer, l'ombon bombé, les rivets, un blason
  bouclier(t) {
    t.forme('metal', ellipsoide(16, 16, 14.5, 14.5), { decalage: -0.3 });
    t.forme('chene', ellipsoide(16, 16, 12, 12), { motif: (x) => (x % 6 === 0 ? -0.9 : x % 6 === 1 ? 0.3 : 0) });
    t.forme('tissuRouge', (x, y) => (Math.abs(x + 0.5 - 16) < 2.4 || Math.abs(y + 0.5 - 16) < 2.4) && Math.hypot(x + 0.5 - 16, y + 0.5 - 16) < 11.5 ? [0, 0, 1] : null, { decalage: 0.1, bord: false });
    t.forme('metal', ellipsoide(16, 16, 4.6, 4.6), { decalage: 0.5 });
    t.poser(14, 14, 'metal', 5); t.poser(15, 14, 'metal', 5);
    for (let a = 0; a < 6.28; a += 0.785) t.poser(Math.round(16 + Math.cos(a) * 13.2), Math.round(16 + Math.sin(a) * 13.2), 'or', 4);
  },
  // L'amulette : une chaîne d'or, un médaillon ciselé serti d'une gemme violette, une rune gravée
  amulette(t) {
    let m = 0;
    for (let a = Math.PI + 0.2; a < 2 * Math.PI - 0.2; a += 0.09) t.poser(Math.round(16 + Math.cos(a) * 11), Math.round(17 + Math.sin(a) * 15), 'or', m++ % 2 ? 4 : 1);
    t.forme('or', ellipsoide(16, 22, 8, 8.4));
    for (let a = 0; a < 6.28; a += 0.4) t.poser(Math.round(16 + Math.cos(a) * 7), Math.round(22 + Math.sin(a) * 7.3), 'or', Math.round(a * 2.5) % 2 ? 5 : 2);   // le bord ciselé
    t.forme('gemme', ellipsoide(16, 22, 4.6, 5), { decalage: 0.4 });
    t.poser(14, 20, 'gemme', 5); t.poser(15, 19, 'gemme', 5);
    t.forme('or', boite(14, 11, 18, 14, 1), { decalage: 0.2 });   // la bélière
  },
  // Le fer : deux lingots empilés, l'estampille du forgeron sur la face
  fer(t) {
    const lingot = (x0, y0) => {
      t.forme('metal', (x, y) => (y >= y0 && y <= y0 + 7 && x >= x0 + (y0 + 7 - y) * 0.5 && x <= x0 + 18 - (y0 + 7 - y) * 0.5 ? [0, (y - y0 - 3.5) / 6, 0.9] : null), { decalage: -0.4 });
      for (let x = x0 + 4; x <= x0 + 14; x++) t.poser(x, y0, 'metal', 5);
      t.dessin(x0 + 7, y0 + 3, ['m.m', '.m.'], { m: ['metal', 1] });   // l'estampille
    };
    lingot(2, 21); lingot(12, 21); lingot(7, 13);
  },
  // Le cuir : une peau tannée roulée, liée de deux cordelettes, le bord découpé
  cuir(t) {
    t.forme('cuir', (x, y) => (y >= 10 && y <= 23 && x >= 4 && x <= 25 ? [0, (y - 16.5) / 8, 0.8] : null), { motif: (x, y) => ((x * 5 + y * 3) % 11 === 0 ? -0.4 : 0) });
    t.forme('cuir', ellipsoide(25, 16.5, 4, 7), { decalage: 0.4 });
    for (let a = 0; a < 12; a += 0.4) { const r = 0.4 + a * 0.28; t.poser(Math.round(25 + Math.cos(a) * r * 0.55), Math.round(16.5 + Math.sin(a) * r), 'cuir', 1); }   // l'enroulement
    for (const x of [10, 19]) for (let y = 9; y <= 24; y++) t.poser(x, y, 'chanvre', y % 3 ? 4 : 2);
    t.forme('cuir', (x, y) => (y >= 22 && y <= 28 && x >= 4 && x <= 14 && y - 22 <= (x - 4) * 0.7 + (x % 3) ? [0, 0.5, 0.8] : null), { decalage: -0.3 });   // la peau qui pend
  },
  // Le bois : trois belles planches empilées, le fil du bois, les nœuds et les cernes au bout
  bois(t) {
    // une pile de longues planches de pin, vue de trois quarts comme au dépôt du scieur : le dessus
    // de la planche du haut, veiné et noueux ; en dessous, les chants des planches empilées ; à
    // droite, les bouts sciés avec leurs cernes
    t.rampes.pin = [0x5a3416, 0x8a5428, 0xb8783c, 0xd49a58, 0xe8b878, 0xf6d8a8];
    const pente = 0.32;   // (les planches fuient un peu vers le fond, à gauche)
    // le dessus : deux larges planches côte à côte, le fil du bois qui ondule autour des nœuds
    const noeuds = [[9, 8.5], [19, 6], [24, 10.5]];
    for (let y = 3; y <= 13; y++) for (let x = Math.round(1 + (13 - y) * pente * 3); x <= 26; x++) {
      let f = Math.sin(y * 1.9 + Math.sin(x * 0.22) * 2.2);
      for (const [nx, ny] of noeuds) { const d = Math.hypot(x - nx, (y - ny) * 2); if (d < 4) f = Math.sin(d * 2.2); }
      t.poser(x, y, 'pin', y === 3 ? 5 : y === 8 ? 2 : f > 0.75 ? 5 : f < -0.6 ? 3 : 4);
    }
    for (const [nx, ny] of noeuds) { t.poser(nx, Math.round(ny), 'pin', 0); t.poser(nx + 1, Math.round(ny), 'pin', 1); }
    // les chants : quatre planches empilées, chacune avec sa lumière en haut et son ombre en bas
    for (let r = 0; r < 4; r++) {
      const y0 = 14 + r * 4;
      for (let x = 1; x <= 26; x++) for (let k = 0; k < 4; k++) t.poser(x, y0 + k, 'pin', k === 0 ? 4 : k === 3 ? 1 : ((x * 3 + r * 5) % 11 === 0 ? 2 : 3));
    }
    // les bouts sciés, à droite : un peu plus sombres, avec les arcs des cernes
    for (let r = 0; r < 5; r++) {
      const y0 = r === 0 ? 3 : 10 + r * 4, h = r === 0 ? 11 : 4;
      for (let y = y0; y < y0 + h; y++) for (let x = 27; x <= 30; x++) {
        const cerne = Math.hypot(x - 33, (y - (y0 + h + 2)) * 1.3);
        t.poser(x, y, 'pin', y === y0 + h - 1 ? 0 : Math.floor(cerne) % 2 ? 3 : 2);
      }
    }
    // le feuillard qui tient la pile, et sa boucle
    for (let y = 3; y <= 29; y++) t.poser(y <= 13 ? 15 - Math.round((13 - y) * pente * 3) + 3 : 18, y, 'metal', y <= 13 ? 5 : 3);
  },
  // Le fil d'or : une bobine de fil d'or sur son fuseau de bois tourné, un bout qui s'échappe
  filOr(t) {
    t.rampes.filOr = rampe(0xe0b030);
    t.forme('chene', boite(6, 4, 24, 7, 2), { decalage: 0.3 });
    t.forme('chene', boite(6, 25, 24, 28, 2), { decalage: 0.1 });
    t.forme('filOr', (x, y) => (y >= 8 && y <= 24 && x >= 8 && x <= 22 ? [(x - 15) / 9, 0, 0.85] : null), { motif: (x, y) => (y % 2 ? 0.5 : -0.35) });
    for (let y = 8; y <= 24; y += 2) t.poser(10, y, 'filOr', 5);
    for (const [x, y] of [[23, 16], [25, 17], [26, 19], [27, 21], [28, 24], [27, 27], [26, 29], [28, 30]]) t.poser(x, y, 'filOr', 4);
  },
};

// Crée les icônes 32 × 32 : « hd32_ration »... (pour la planche, avant de les brancher dans le jeu)
function creerObjetsHD32(scene) {
  for (const [id, dessin] of Object.entries(DESSINS_OBJETS_32)) {
    if (scene.textures.exists('hd32_' + id)) continue;
    const t = toileObjet32();
    dessin(t);
    t.contour();
    t.texture(scene, 'hd32_' + id);
  }
}
