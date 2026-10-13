// Les personnages en pied, en HD (même style que les portraits et que JeuneGoy) :
// chaque peuple a sa taille et sa silhouette, chaque voyageur ses couleurs (tirées de son nom),
// et sa tenue s'enrichit avec son niveau (novice → légende). Les figurants (garde, banquier,
// colporteur, gobelin...) ont leur costume.
// Les anciens personnages faisaient 16 pixels de haut pour un humain ; ceux-ci en font 64 :
// on les affiche à l'échelle d'avant × ECHELLE_CORPS.

const ECHELLE_CORPS = 0.25;

// Taille (H), largeur d'épaules (ep), hauteur du torse, et tête de chaque peuple.
const PROPORTIONS = {
  hobbit: { H: 52, ep: 8.5, torse: 15, rx: 8.8, ry: 9 },
  nain: { H: 56, ep: 10.5, torse: 18, rx: 9, ry: 8.6 },
  humain: { H: 64, ep: 9, torse: 22, rx: 8.4, ry: 9 },
  elfe: { H: 68, ep: 8.4, torse: 23, rx: 8, ry: 9 },
  magicienne: { H: 72, ep: 8.6, torse: 22, rx: 8.4, ry: 9 },
  gobelin: { H: 50, ep: 8, torse: 14, rx: 8.6, ry: 8 },
};

// Les figurants : un peuple, des couleurs fixes, un costume.
const FIGURANTS = {
  garde: { race: 'humain', nom: 'Garde', costume: 'garde', habit: 0x8a2a2a, cheveux: 0x3a2a1a },
  banquier: { race: 'humain', nom: 'Banquier', costume: 'banquier', habit: 0x26262e, cheveux: 0x1a1a20 },
  nainBanquier: { race: 'nain', nom: 'Thorgrim', costume: 'banquier', habit: 0x26262e, cheveux: 0xe0e0e0 },
  colporteur: { race: 'humain', nom: 'Colporteur', costume: 'colporteur', habit: 0x6a5a40, cheveux: 0x4a3a2a, cape: 0x4a3a2a },
  mentor: { race: 'humain', nom: 'Garrick', costume: 'mentor', habit: 0x2f5a3a, cheveux: 0x9a9aa0, cape: 0x2f5a3a, barbe: 'pleine', niveau: 3 },
  gobelin: { race: 'gobelin', nom: 'Grippesou', costume: 'gobelin', habit: 0x6a5030, cheveux: 0x5a3a20 },
};

// Les mains de chaque texture (en pixels HD depuis le sol), pour porter le baluchon.
const MAINS_CORPS = {};

function dessinerCorpsHD(g, tenue = 1, costume = null, pas = 0) {
  const race = PROPORTIONS[g.race] ? g.race : 'humain';
  const P = PROPORTIONS[race];
  const L = 44;
  const chapeau = costume === 'banquier' ? 9 : (race === 'magicienne' || costume === 'colporteur') ? 9 : 0;
  const H = P.H + chapeau;
  const t = new ToileHD(L, H);
  const cx = L / 2;
  const f = g.feminin;
  t.rampes.peau = costume === 'gobelin' ? rampe(0x7aa04a) : RAMPES_PEAU[g.peau ?? 1] || RAMPES_PEAU[1];
  t.rampes.cheveux = rampe(g.cheveux);
  t.rampes.habit = rampe(g.habit);
  t.rampes.cape = rampe(g.cape || 0x4a3a2a);
  t.rampes.iris = rampe(g.yeux || 0x4a3a20);
  t.rampes.lin = rampe(0xd8ccb0);
  t.rampes.bas = rampe(race === 'elfe' ? 0x3a4a3a : race === 'hobbit' ? 0x8a6a40 : 0x5a4a3a);
  t.rampes.levres = rampe(f ? 0xb84a5a : 0x8a3a34);
  t.rampes.chapeau = rampe(costume === 'banquier' ? 0x1a1a22 : costume === 'colporteur' ? 0x5a4630 : g.habit);
  const cy = chapeau + 1 + P.ry;                       // le centre de la tête
  const yT = cy + P.ry - 1;                            // le haut du torse
  const yB = yT + P.torse;                             // la taille
  const sol = H - 1;
  const longue = race === 'magicienne';                // la robe descend jusqu'aux pieds
  const manteau = race === 'elfe' || costume === 'colporteur' || costume === 'mentor';

  // La cape, derrière (héros et légendes, le mentor, le colporteur)
  if (tenue >= 3 || costume === 'mentor' || costume === 'colporteur') {
    t.forme('cape', (x, y) => {
      if (y < yT + 1 || y > sol - 3) return null;
      const demi = P.ep + 1.5 + (y - yT) * 0.12;
      const nx = (x + 0.5 - cx) / demi;
      return Math.abs(nx) <= 1 ? [nx * 0.6, 0.1, 0.8] : null;
    }, { decalage: -0.9, motif: (x) => (x % 5 === 0 ? -0.5 : 0) });
    if (tenue >= 4) for (let y = yT + 2; y < sol - 3; y++) { t.poser(Math.round(cx - P.ep - 2 - (y - yT) * 0.12), y, 'or', 4); t.poser(Math.round(cx + P.ep + 2 + (y - yT) * 0.12), y, 'or', 3); }
  }
  // Les cheveux longs, derrière
  if (['long', 'queue', 'chignon'].includes(g.coiffure) || race === 'elfe' || race === 'magicienne') {
    const bas = g.coiffure === 'chignon' ? cy + 4 : race === 'elfe' || race === 'magicienne' ? yT + 10 : yT + 4;
    t.forme('cheveux', (x, y) => (y >= cy - 4 && y <= bas && Math.abs(x + 0.5 - cx) < P.rx + 1.5 - Math.max(0, y - bas + 6) * 0.5 ? [(x + 0.5 - cx) / (P.rx + 2), 0, 0.8] : null), { decalage: -0.8, motif: MECHES });
  }

  // Les jambes, les bottes (ou les pieds nus et poilus des hobbits)
  if (!longue) {
    for (const sens of [-1, 1]) {
      const lx = cx + sens * (P.ep * 0.36) - (pas && sens === pas ? sens * 0.6 : 0);
      const sol = H - 1 - (pas && sens === pas ? 2 : 0);   // la jambe qui avance se lève
      const pied = sol - 4;
      t.forme(race === 'hobbit' ? 'bas' : 'bas', (x, y) => (y >= yB - 2 && y <= pied && Math.abs(x + 0.5 - lx) < (race === 'nain' ? 3.2 : 2.7) ? [(x + 0.5 - lx) / 3, 0, 0.9] : null));
      if (race === 'hobbit') {
        t.forme('peau', (x, y) => (y >= pied - 1 && y <= sol && (Math.abs(x + 0.5 - lx) < 2.6 || (y >= sol - 2 && sens * (x + 0.5 - lx) > 0 && sens * (x + 0.5 - lx) < 6)) ? [(x + 0.5 - lx) / 5, (y - sol + 1) / 3, 0.8] : null));
        for (let k = 0; k < 4; k++) t.poser(Math.round(lx + sens * k), sol - 2 - (k % 2), 'cheveux', 2); // les poils
      } else {
        t.forme('cuir', (x, y) => {
          if (y < pied - 3 || y > sol) return null;
          const avant = sens * (x + 0.5 - lx);
          return (Math.abs(x + 0.5 - lx) < 3 || (y >= sol - 2 && avant > 0 && avant < 5)) ? [(x + 0.5 - lx) / 4, (y - sol + 2) / 4, 0.8] : null;
        });
        t.forme('cuir', (x, y) => (y === pied - 3 && Math.abs(x + 0.5 - lx) < 3.3 ? [0, -0.6, 0.7] : null), { decalage: 0.6, bord: false });
      }
    }
  }
  // Les bras, puis les mains
  const mainY = yB - 1;
  for (const sens of [-1, 1]) {
    const bx = cx + sens * (P.ep - 0.5);
    const mainY = yB - 1 + (pas ? (sens === pas ? -1 : 1) : 0);   // les bras se balancent
    t.forme(costume === 'garde' || (race === 'nain' && costume !== 'banquier') ? 'metal' : 'habit',
      (x, y) => (y >= yT + 2 && y <= mainY - 2 && Math.abs(x + 0.5 - bx - sens * (y - yT) * 0.06) < 2.6 ? [sens * 0.6, 0, 0.8] : null), { decalage: -0.3 });
    if (tenue >= 2) t.forme('cuir', (x, y) => (y >= mainY - 6 && y <= mainY - 3 && Math.abs(x + 0.5 - bx - sens * (y - yT) * 0.06) < 2.9 ? [sens * 0.6, 0, 0.8] : null)); // les brassards
    t.forme('peau', ellipsoide(bx + sens * 0.8, mainY, 2.3, 2.2));
  }
  MAINS_CORPS[race + (costume || '')] = H - mainY;

  // Le torse (et la robe longue de la magicienne, le manteau de l'elfe)
  const bas = longue ? sol : manteau ? yB + Math.round((sol - yB) * 0.55) : yB + 2;
  t.forme('habit', (x, y) => {
    if (y < yT || y > bas) return null;
    let demi = y < yT + 4 ? P.ep - 4 + (y - yT) * 1.1 : P.ep + 0.2 - Math.max(0, y - yB + 6) * 0.12;
    if (y > yB) demi = P.ep - 1 + (y - yB) * (longue ? 0.28 : 0.18);
    if (race === 'nain' || race === 'hobbit') demi += Math.sin(Math.min(1, (y - yT) / P.torse) * Math.PI) * 1.4; // une bonne bedaine
    const nx = (x + 0.5 - cx) / demi;
    return Math.abs(nx) > 1 ? null : [nx * 0.85, -0.2, Math.sqrt(1 - nx * nx * 0.72)];
  }, { motif: longue ? (x, y) => ((x * 7 + y * 3) % 23 === 0 ? 0.9 : 0) : manteau ? (x) => (x === cx ? -0.7 : 0) : null });
  if (longue) for (let y = yB + 4; y < sol; y += 5) for (let x = cx - 8; x < cx + 9; x += 6) if (t.mat(x + (y % 2), y) === 'habit') t.poser(x + (y % 2), y, 'or', 4); // les étoiles
  if (manteau || longue) for (let y = yT + 3; y <= bas; y++) if (t.mat(cx, y)) t.poser(cx, y, race === 'elfe' || tenue >= 4 ? 'or' : 'habit', race === 'elfe' || tenue >= 4 ? 4 : 1);
  // Le gilet du hobbit, sur sa chemise claire
  if (race === 'hobbit') {
    t.forme('lin', (x, y) => (y >= yT && y <= yB && Math.abs(x + 0.5 - cx) < 2.2 + (y - yT) * 0.05 ? [0, 0, 1] : null), { decalage: -0.2 });
    for (let y = yT + 4; y < yB; y += 3) t.poser(cx + 2, y, 'or', 4);
  }
  // L'armure des nains et des gardes : une cotte, des plaques
  if ((race === 'nain' && costume !== 'banquier') || costume === 'garde') {
    t.forme('metal', (x, y) => (y >= yT + 1 && y <= yB - 2 && Math.abs(x + 0.5 - cx) < P.ep - 1.5 ? [(x + 0.5 - cx) / P.ep, -0.1, 0.9] : null),
      { motif: (x, y) => ((x + y) % 2 ? 0.25 : -0.25) });
    if (costume === 'garde') t.forme('habit', (x, y) => (y >= yT + 3 && y <= yB + 4 && Math.abs(x + 0.5 - cx) < 4 ? [0, 0, 1] : null)); // le tabard
  }
  // Le costume du banquier : plastron blanc, chaîne d'or
  if (costume === 'banquier') {
    t.forme('lin', (x, y) => (y >= yT && y <= yT + 8 && Math.abs(x + 0.5 - cx) < 3 - (y - yT) * 0.25 ? [0, 0, 1] : null));
    for (let k = -5; k <= 5; k++) t.poser(cx + k, yT + 7 + Math.round(Math.abs(k) * -0.4 + 3), 'or', k % 2 ? 3 : 5);
  }
  // La ceinture : une corde (novice), du cuir à boucle (aguerri et plus), de l'or (légende)
  const ceinture = tenue === 0 ? 'lin' : 'cuir';
  if (!longue || tenue >= 1) {
    t.forme(ceinture, (x, y) => (y >= yB - 2 && y <= yB - 1 && t.mat(x, y) && t.mat(x, y) !== 'peau' ? [0, y === yB - 2 ? -0.6 : 0.4, 0.8] : null));
    if (tenue >= 1) t.forme(tenue >= 4 ? 'or' : 'metal', ellipsoide(cx, yB - 1.5, 1.6, 1.3), { decalage: 0.4 });
  }
  // Les pièces cousues des novices, la sacoche des aguerris
  const aventurier = !costume || costume === 'colporteur' || costume === 'mentor';
  if (tenue === 0 && aventurier) for (const [dx, dy] of [[-4, 6], [3, 11]]) for (let k = 0; k < 3; k++) for (let j = 0; j < 3; j++) if (t.mat(cx + dx + k, yT + dy + j) === 'habit') t.poser(cx + dx + k, yT + dy + j, 'habit', k === 1 && j === 1 ? 1 : 2);
  if (tenue >= 1 && aventurier) {
    for (let k = 0; k < P.torse - 2; k++) t.poser(Math.round(cx - P.ep + 3 + k * (P.ep * 2 - 6) / P.torse), yT + 1 + k, 'cuir', 2); // la bandoulière
    t.forme('cuir', (x, y) => (y >= yB - 1 && y <= yB + 4 && x >= cx + P.ep - 4 && x <= cx + P.ep + 1 ? [0.4, 0, 0.9] : null));
  }
  // Les épaulières : cuir (vétéran), métal (héros), métal et or (légende)
  if (tenue >= 2) for (const sens of [-1, 1]) {
    t.forme(tenue >= 3 ? 'metal' : 'cuir', ellipsoide(cx + sens * (P.ep - 1), yT + 2, 3.4, 2.4), { decalage: 0.3 });
    if (tenue >= 4) for (let k = -3; k <= 3; k++) t.poser(Math.round(cx + sens * (P.ep - 1) + k), yT + 4, 'or', 4);
  }

  // Le cou, les oreilles, la tête
  t.forme('peau', (x, y) => (y >= yT - 2 && y <= yT + 1 && Math.abs(x + 0.5 - cx) < 2.5 ? [0, 0.2, 0.9] : null), { decalage: -0.7 });
  if (costume === 'gobelin') for (const sens of [-1, 1]) t.forme('peau', (x, y) => { const d = sens * (x + 0.5 - cx) - P.rx; return d > -1 && d < 7 && Math.abs(y + 0.5 - cy + 1) < 2.6 - d * 0.3 ? [sens, -0.3, 0.6] : null; });
  else if (race !== 'elfe') for (const sens of [-1, 1]) t.forme('peau', ellipsoide(cx + sens * P.rx, cy + 1.5, 1.8, 2.6));
  t.forme('peau', ellipsoide(cx, cy, P.rx, P.ry));
  if (race === 'hobbit') for (const sens of [-1, 1]) t.forme('peau', ellipsoide(cx + sens * 4.5, cy + 3.5, 2.6, 2), { decalage: 0.3, bord: false });

  // Le visage
  const ey = cy + 1;
  for (const sens of [-1, 1]) {
    const ox = sens < 0 ? cx - 5 : cx + 3;
    t.poser(ox, ey, 'oeil', 4); t.poser(ox + 1, ey, 'iris', 2);
    t.poser(ox, ey + 1, 'iris', 1); t.poser(ox + 1, ey + 1, 'iris', 1);
    t.poser(sens < 0 ? ox + 1 : ox, ey, 'oeil', 5);
    for (let k = -1; k <= 2; k++) t.poser(ox + k, ey - 2 + (costume === 'gobelin' ? (sens < 0 ? (k < 1 ? 1 : 0) : (k > 0 ? 1 : 0)) : 0), 'cheveux', 1);
    if (f) t.poser(sens < 0 ? ox - 1 : ox + 2, ey - 1, 'cheveux', 0);
  }
  if (costume === 'banquier' && race === 'nain') { for (let a = 0; a < 6.28; a += 0.5) t.poser(Math.round(cx + 3.5 + Math.cos(a) * 2), Math.round(ey + 0.5 + Math.sin(a) * 2), 'or', 4); } // le monocle
  if (race === 'nain') t.forme('peau', ellipsoide(cx, ey + 3, 2, 2), { decalage: 0.2 }); // le gros nez
  else { t.poser(cx, ey + 2, 'peau', 2); t.poser(cx, ey + 3, 'peau', 2); }
  t.poser(cx - 6, ey + 3, 'levres', 4); t.poser(cx + 5, ey + 3, 'levres', 4);
  const by = ey + 5;
  if (costume === 'gobelin') { for (let k = -3; k <= 3; k++) t.poser(cx + k, by + (Math.abs(k) === 3 ? -1 : 0), 'bouche', k % 2 ? 5 : 0); }
  else for (const [i, j] of [[-2, 0], [-1, 1], [0, 1], [1, 1], [2, 0]]) t.poser(cx + i, by + j, 'levres', 1);

  // La barbe
  const barbe = race === 'nain' ? 'nain' : g.barbe;
  if (barbe === 'nain') {
    t.forme('cheveux', (x, y) => {
      if (y < ey + 2 || y > yB + 2) return null;
      const demi = P.rx + 0.5 - Math.max(0, y - yT - 4) * 0.35;
      const nx = (x + 0.5 - cx) / demi;
      if (Math.abs(nx) > 1) return null;
      if (y >= by - 1 && y <= by + 1 && Math.abs(x + 0.5 - cx) < 3) return null;
      return [nx * 0.8, (y - yT) / 20, 0.8];
    }, { motif: MECHES });
    for (let y = yT + 6; y < yB; y += 3) t.poser(cx, y, 'or', 3); // des perles dans la barbe
  } else if (barbe) {
    t.forme('cheveux', (x, y) => {
      const n = ellipsoide(cx, cy, P.rx + 0.5, P.ry + (barbe === 'pleine' ? 4 : 1.5))(x, y);
      if (barbe === 'bouc' && Math.abs(x + 0.5 - cx) > 3) return null;
      return n && y >= ey + 3 && !(y >= by - 1 && y <= by + 1 && Math.abs(x + 0.5 - cx) < 3) ? n : null;
    }, { motif: MECHES });
  }

  // Les cheveux
  const coupe = race === 'hobbit' ? 'boucles' : g.coiffure;
  if (coupe === 'boucles') {
    for (const [i, j] of [[-6, -5], [-2, -8], [3, -8], [7, -5], [-8, -1], [8, -1], [0, -6]]) t.forme('cheveux', ellipsoide(cx + i, cy + j, 3, 3));
  } else if (coupe !== 'chauve' && !(costume === 'garde')) {
    t.forme('cheveux', (x, y) => {
      const nx = (x + 0.5 - cx) / (P.rx + 1), ny = (y + 0.5 - cy) / (P.ry + 1.8);
      if (nx * nx + ny * ny > 1) return null;
      const frange = cy - 4 + Math.abs(Math.sin((x - cx) * 1.1)) * 2;
      const tempe = Math.abs(x + 0.5 - cx) > P.rx - 2 && y < cy + 2;
      if (y > frange && !tempe) return null;
      return [nx, ny, Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny))];
    }, { motif: MECHES });
    if (coupe === 'herisse') for (let k = -6; k <= 6; k += 3) t.forme('cheveux', (x, y) => (y >= cy - P.ry - 3 && y < cy - P.ry + 1 && Math.abs(x + 0.5 - cx - k) < (y - cy + P.ry + 4) * 0.5 ? [0, -0.6, 0.7] : null));
    if (coupe === 'chignon') t.forme('cheveux', ellipsoide(cx, cy - P.ry - 1, 3.5, 3), { motif: MECHES });
  }
  // Les oreilles pointues des elfes, par-dessus les cheveux, vers le haut
  if (race === 'elfe') for (const sens of [-1, 1]) t.forme('peau', (x, y) => {
    const d = sens * (x + 0.5 - cx) - P.rx + 1.5, h = cy + 2 - y;
    return h >= 0 && h < 8 && d > -1 + h * 0.45 && d < 2.2 + h * 0.35 ? [sens * 0.7, -0.5, 0.6] : null;
  });
  // Les couvre-chefs
  if (race === 'magicienne') {
    t.forme('chapeau', (x, y) => (y >= 0 && y < cy - 4 && Math.abs(x + 0.5 - cx - (cy - 4 - y) * 0.15) < (y + 1) * 0.55 ? [(x + 0.5 - cx) / 8, -0.3, 0.8] : null));
    t.forme('chapeau', (x, y) => (y >= cy - 5 && y <= cy - 4 && Math.abs(x + 0.5 - cx) < P.rx + 5 ? [0, -0.6, 0.7] : null), { decalage: -0.3 });
    for (let x = cx - 5; x <= cx + 5; x++) t.poser(x, cy - 6, 'or', 4);
  } else if (costume === 'banquier') {
    t.forme('chapeau', (x, y) => (y >= 0 && y <= cy - 5 && Math.abs(x + 0.5 - cx) < 6 ? [(x + 0.5 - cx) / 7, -0.2, 0.8] : null));
    t.forme('chapeau', (x, y) => (y >= cy - 6 && y <= cy - 5 && Math.abs(x + 0.5 - cx) < 9.5 ? [0, -0.5, 0.8] : null));
    for (let x = cx - 5; x <= cx + 5; x++) t.poser(x, cy - 8, 'or', 3);
  } else if (costume === 'colporteur') {
    t.forme('chapeau', (x, y) => (y >= 2 && y <= cy - 5 && Math.abs(x + 0.5 - cx) < 6 - (cy - 5 - y) * 0.3 ? [(x + 0.5 - cx) / 7, -0.2, 0.8] : null));
    t.forme('chapeau', (x, y) => (y >= cy - 6 && y <= cy - 4 && Math.abs(x + 0.5 - cx) < 13 ? [0, (y - cy + 5) * 0.6, 0.8] : null));
  } else if (costume === 'garde') {
    t.forme('metal', (x, y) => { const n = ellipsoide(cx, cy - 1, P.rx + 1, P.ry + 1)(x, y); return n && y <= cy - 2 ? n : null; }, { decalage: 0.2 });
    for (let y = cy - 2; y <= cy + 3; y++) t.poser(cx, y, 'metal', 4); // le nasal
    t.forme('cuirRouge' in t.rampes ? 'cuirRouge' : 'habit', ellipsoide(cx, cy - P.ry - 1, 1.5, 2));
  } else if (costume === 'gobelin') {
    t.forme('cape', (x, y) => { const n = ellipsoide(cx, cy - 1, P.rx + 1.5, P.ry + 1.5)(x, y); return n && (y < cy - 3 || Math.abs(x + 0.5 - cx) > P.rx - 1) && y < yT + 2 ? n : null; }, { decalage: -0.2 });
  } else if (tenue >= 4 && race !== 'nain') {
    for (let k = -5; k <= 5; k++) t.poser(cx + k, cy - P.ry + 1 + (k % 3 === 0 ? -1 : 0), 'or', k % 3 === 0 ? 5 : 4); // un diadème
  } else if (race === 'nain' && costume !== 'banquier') {
    // Le casque à cornes des nains
    t.forme('metal', (x, y) => { const n = ellipsoide(cx, cy - 2, P.rx + 0.8, P.ry)(x, y); return n && y <= cy - 4 ? n : null; }, { decalage: 0.2 });
    for (const sens of [-1, 1]) for (let k = 0; k < 4; k++) t.poser(Math.round(cx + sens * (P.rx + k)), Math.round(cy - 5 - k * 0.8), 'lin', 4 - (k > 2 ? 1 : 0));
  }

  t.contour();
  return t;
}

// L'ordre des tenues : novice 0 … légende 4.
function tenueDe(niveau) {
  const i = ORDRE_NIVEAUX.indexOf(niveau);
  return i < 0 ? 1 : i;
}

// La clé de la texture en pied : un peuple (couleurs par défaut), un figurant, ou une personne
// (avec ses couleurs à elle et la tenue de son niveau).
function corpsHD(scene, quoi) {
  if (quoi === 'faucheuse') return 'perso_faucheuse';
  if (typeof quoi === 'string' && !FIGURANTS[quoi] && !PROPORTIONS[quoi]) return 'perso_' + quoi;   // (le joueur, etc.)
  let gene, tenue, costume = null, cle;
  if (typeof quoi === 'string' && FIGURANTS[quoi]) {
    const fig = FIGURANTS[quoi];
    gene = { ...geneHD({ nom: fig.nom, race: fig.race === 'gobelin' ? 'humain' : fig.race }), race: fig.race, habit: fig.habit, cheveux: fig.cheveux, cape: fig.cape, barbe: fig.barbe ?? null, coiffure: 'court' };
    tenue = fig.niveau ?? 1;
    costume = fig.costume;
    cle = 'corps_' + quoi;
  } else if (typeof quoi === 'string') {
    gene = geneHD({ nom: 'Un ' + quoi, race: quoi, feminin: quoi === 'magicienne' });
    tenue = 1;
    cle = 'corps_' + quoi;
  } else {
    gene = geneHD(quoi);
    tenue = tenueDe(quoi.niveau);
    cle = `corps_${quoi.race}_${quoi.nom}_${tenue}`;
  }
  if (!scene.textures.exists(cle)) {
    dessinerCorpsHD(gene, tenue, costume).texture(scene, cle);
    dessinerCorpsHD(gene, tenue, costume, -1).texture(scene, cle + '_pas1');
    dessinerCorpsHD(gene, tenue, costume, 1).texture(scene, cle + '_pas2');
  }
  MAINS_CORPS[cle] = MAINS_CORPS[gene.race + (costume || '')];
  return cle;
}

// Fait marcher un personnage pendant `duree` ms : ses jambes alternent, ses bras se balancent,
// un peu de poussière se soulève à chaque pas. (Pour toute image qui a ses textures « _pas1/2 ».)
function pasDeMarche(scene, sprite, duree, { poussiere = true } = {}) {
  const base = sprite.texture.key.replace(/_pas[12]$/, '');
  if (!scene.textures.exists(base + '_pas1')) return;
  const images = [base, base + '_pas1', base, base + '_pas2'];
  let k = 0;
  if (sprite.marche) sprite.marche.remove();
  creerHalo(scene);
  sprite.marche = scene.time.addEvent({ delay: 125, loop: true, callback: () => {
    if (!sprite.active) { sprite.marche.remove(); return; }
    k = (k + 1) % 4;
    sprite.setTexture(images[k]);
    if (poussiere && k % 2 === 1 && sprite.visible && sprite.alpha > 0.5 && !sprite.mask && !sprite.parentContainer) {
      const p = scene.add.image(sprite.x + (k === 1 ? -6 : 6), sprite.y - 2, 'halo').setScale(0.12).setTint(0xc8b090).setAlpha(0.45).setDepth(sprite.depth - 0.01);
      scene.tweens.add({ targets: p, scale: 0.32, alpha: 0, y: p.y - 8, duration: 420, onComplete: () => p.destroy() });
    }
  } });
  scene.time.delayedCall(duree, () => {
    if (sprite.marche) { sprite.marche.remove(); sprite.marche = null; }
    if (sprite.active) sprite.setTexture(base);
  });
}

// L'échelle à appliquer à une texture de personnage (les anciennes gardent leur taille).
function echelleCorps(cle) {
  return cle.startsWith('corps_') ? ECHELLE_CORPS : 1;
}

// Un personnage en pied, posé par les pieds : `quoi` = un peuple, un figurant ou une personne.
// `echelle` est l'échelle d'avant (celle des personnages de 16 pixels).
function imageCorps(scene, x, y, quoi, echelle) {
  const cle = corpsHD(scene, quoi);
  return scene.add.image(x, y, cle).setOrigin(0.5, 1).setScale(echelle * echelleCorps(cle));
}
