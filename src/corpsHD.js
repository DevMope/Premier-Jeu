// Les personnages en pied, en HD (même style que les portraits et que JeuneGoy) :
// chaque peuple a sa taille et sa silhouette, chaque voyageur ses couleurs (tirées de son nom),
// et sa tenue s'enrichit avec son niveau (novice → légende). Les figurants (garde, banquier,
// colporteur, gobelin...) ont leur costume.
// Les anciens personnages faisaient 16 pixels de haut pour un humain ; ceux-ci en font 64 :
// on les affiche à l'échelle d'avant × ECHELLE_CORPS.

const ECHELLE_CORPS = 0.25 / 2;   // (les corps en volume sont deux fois plus fins : voir corpsVueHD.js)

// Taille (H), largeur d'épaules (ep), hauteur du torse, et tête de chaque peuple.
// Chaque peuple a sa morphologie : le hobbit rond et joufflu, le nain trapu et large (tête
// large, membres épais), l'elfe fin et élancé (tête étroite et longue, membres fins), l'humain
// entre les deux. `membre` : l'épaisseur des bras et des jambes par rapport à l'humain.
const PROPORTIONS = {
  hobbit: { H: 52, ep: 8.8, torse: 15, rx: 9, ry: 9, membre: 1.1 },
  nain: { H: 56, ep: 12.2, torse: 18, rx: 10.2, ry: 8.2, membre: 1.35 },
  humain: { H: 64, ep: 9, torse: 22, rx: 8.4, ry: 9, membre: 1 },
  elfe: { H: 68, ep: 7.6, torse: 24, rx: 7.2, ry: 9.6, membre: 0.82 },
  magicienne: { H: 72, ep: 8.2, torse: 22, rx: 8, ry: 9.2, membre: 0.9 },
  gobelin: { H: 50, ep: 8, torse: 14, rx: 8.6, ry: 8, membre: 0.9 },
  // Les peuples de l'ombre (tailles données par le joueur : gobelin 11, momie 15, vampire 16,
  // orc 17, loup-garou 20, troll 24) et le panda (21), à 4 pixels HD par unité.
  momie: { H: 60, ep: 8.6, torse: 21, rx: 8.2, ry: 9, membre: 1 },
  vampire: { H: 64, ep: 8.2, torse: 23, rx: 7.6, ry: 9.6, membre: 0.9 },
  orc: { H: 68, ep: 12.5, torse: 24, rx: 9.4, ry: 9.2, membre: 1.35 },
  loupgarou: { H: 80, ep: 12, torse: 28, rx: 9.8, ry: 9.4, membre: 1.3 },
  panda: { H: 84, ep: 16.5, torse: 30, rx: 12.5, ry: 11, membre: 1.7 },
  troll: { H: 96, ep: 15, torse: 30, rx: 14.5, ry: 13.5, membre: 1.5 },
};

// Les figurants : un peuple, des couleurs fixes, un costume.
const FIGURANTS = {
  garde: { race: 'humain', nom: 'Garde', costume: 'garde', habit: 0x8a2a2a, cheveux: 0x3a2a1a },
  banquier: { race: 'humain', nom: 'Banquier', costume: 'banquier', habit: 0x26262e, cheveux: 0x1a1a20 },
  nainBanquier: { race: 'nain', nom: 'Thorgrim', costume: 'banquier', habit: 0x26262e, cheveux: 0xe0e0e0 },
  colporteur: { race: 'humain', nom: 'Colporteur', costume: 'colporteur', habit: 0x6a5a40, cheveux: 0x4a3a2a, cape: 0x4a3a2a },
  mentor: { race: 'humain', nom: 'Garrick', costume: 'mentor', habit: 0x2e2420, cheveux: 0x3a281a, cape: 0x3e4a2a, barbe: 'rase', coiffure: 'long', peau: 1, niveau: 2 },   // (peau : la même teinte que son buste)
  mentorBlesse: { race: 'humain', nom: 'Garrick', costume: 'mentor', habit: 0x2e2420, cheveux: 0x3a281a, cape: 0x3e4a2a, barbe: 'rase', coiffure: 'long', peau: 1, niveau: 2, blesse: true },   // (v0.58 : repêché dans la rivière)
  gobelin: { race: 'gobelin', nom: 'Grippesou', costume: 'gobelin', habit: 0x6a5030, cheveux: 0x5a3a20 },
  bourgmestre: { race: 'humain', nom: 'Odilon Bonnefoi', costume: 'banquier', habit: 0x4a2a5a, cheveux: 0xb0b0b8, barbe: 'moustache', niveau: 3 },
  heraut: { race: 'humain', nom: 'Le héraut', costume: 'garde', habit: 0x2a4a8a, cheveux: 0x5a3a1a },
  passeur: { race: 'humain', nom: 'Le Passeur', costume: 'passeur', habit: 0x2a2430, cheveux: 0x1a1418, cape: 0x1a1620, barbe: 'courte', niveau: 1 },
  mendiant: { race: 'humain', nom: 'Le mendiant', costume: 'mendiant', habit: 0x6a6252, cheveux: 0x8a8a80, cape: 0x4a4236, barbe: 'pleine', niveau: 0 },
};

// Les mains de chaque texture (en pixels HD depuis le sol), pour porter le baluchon.
const MAINS_CORPS = {};

// `pose` : null (bras le long du corps) ou 'leves' (les deux bras levés au-dessus de la tête,
// pour porter quelque chose, ou crier victoire).
function dessinerCorpsHD(g, tenue = 1, costume = null, pas = 0, pose = null) {
  const race = PROPORTIONS[g.race] ? g.race : 'humain';
  const P = PROPORTIONS[race];
  const L = 44;
  const coiffe = costume === 'banquier' ? 9 : (race === 'magicienne' || costume === 'colporteur' || costume === 'noble') ? 9 : 0;
  const leves = pose === 'leves';
  const chapeau = coiffe + (leves ? 12 : 0);           // (de la place au-dessus de la tête pour les mains)
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
  t.rampes.levres = costume === 'gobelin' ? rampe(f ? 0xb84a5a : 0x8a3a34) : levresPour(g.peau ?? 1, f);
  t.rampes.chapeau = rampe(costume === 'banquier' ? 0x1a1a22 : costume === 'colporteur' ? 0x5a4630 : costume === 'noble' ? 0x4a1a3a : g.habit);
  t.rampes.plume = rampe(0xf0e8d0); t.rampes.velours = rampe(0x6a1a3a); t.rampes.fourrure = rampe(0xe8e0d0);
  const cy = chapeau + 1 + P.ry;                       // le centre de la tête
  const yT = cy + P.ry - 1;                            // le haut du torse
  const yB = yT + P.torse;                             // la taille
  const sol = H - 1;
  const longue = race === 'magicienne';                // la robe descend jusqu'aux pieds
  const manteau = race === 'elfe' || costume === 'colporteur' || costume === 'mentor';

  // La hotte d'osier du colporteur, derrière tout : plus large que lui, une couverture roulée dessus,
  // une marmite qui pend sur le côté
  if (costume === 'colporteur') {
    t.rampes.osier = rampe(0xb08a48); t.rampes.laine = rampe(0x8a3030);
    t.forme('osier', (x, y) => (y >= yT - 12 && y <= yB + 7 && Math.abs(x + 0.5 - cx) < P.ep + 7 - Math.max(0, yT - 8 - y) * 0.8 ? [(x + 0.5 - cx) / (P.ep + 7) * 0.8, 0, 0.7] : null),
      { motif: (x, y) => ((x + y) % 3 === 0 ? -0.7 : (x - y) % 3 === 0 ? 0.5 : 0) });
    t.forme('laine', ellipsoide(cx, yT - 13, P.ep + 5, 3), { motif: (x) => (x % 4 === 0 ? -0.6 : 0) });
    t.forme('metal', ellipsoide(cx + P.ep + 8, yB - 2, 3, 2.6), { decalage: 0.2 });
    t.poser(Math.round(cx + P.ep + 8), yB - 5, 'metal', 1); t.poser(Math.round(cx + P.ep + 8), yB - 6, 'metal', 2);
  }
  // La cape, derrière (héros et légendes, le mentor, le colporteur)
  if (tenue >= 3 || costume === 'mentor' || costume === 'colporteur' || costume === 'mendiant' || costume === 'noble') {
    t.forme('cape', (x, y) => {
      if (y < yT + 1 || y > sol - 3) return null;
      const demi = P.ep + 1.5 + (y - yT) * 0.12;
      const nx = (x + 0.5 - cx) / demi;
      if (costume === 'mendiant' && y > sol - 10 && hachage(x, 0, 77) * 10 > sol - y) return null; // le bas en lambeaux
      return Math.abs(nx) <= 1 ? [nx * 0.6, 0.1, 0.8] : null;
    }, { decalage: -0.9, motif: (x) => (x % 5 === 0 ? -0.5 : 0) });
    if (tenue >= 4) for (let y = yT + 2; y < sol - 3; y++) { t.poser(Math.round(cx - P.ep - 2 - (y - yT) * 0.12), y, 'or', 4); t.poser(Math.round(cx + P.ep + 2 + (y - yT) * 0.12), y, 'or', 3); }
    // Le noble : un col de fourrure blanche sur sa cape de velours
    if (costume === 'noble') for (let y = yT + 1; y < yT + 5; y++) for (let x = Math.round(cx - P.ep - 2); x <= cx + P.ep + 2; x++) t.poser(x, y, 'fourrure', 3 + ((x + y) % 2));
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
      if (race === 'hobbit' || costume === 'mendiant') {
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
  if (!leves) for (const sens of [-1, 1]) {
    const bx = cx + sens * (P.ep - 0.5);
    const mainY = yB - 1 + (pas ? (sens === pas ? -1 : 1) : 0);   // les bras se balancent
    t.forme(costume === 'garde' || (race === 'nain' && costume !== 'banquier') ? 'metal' : 'habit',
      (x, y) => (y >= yT + 2 && y <= mainY - 2 && Math.abs(x + 0.5 - bx - sens * (y - yT) * 0.06) < 2.6 ? [sens * 0.6, 0, 0.8] : null), { decalage: -0.3 });
    if (tenue >= 2) t.forme('cuir', (x, y) => (y >= mainY - 6 && y <= mainY - 3 && Math.abs(x + 0.5 - bx - sens * (y - yT) * 0.06) < 2.9 ? [sens * 0.6, 0, 0.8] : null)); // les brassards
    t.forme('peau', ellipsoide(bx + sens * 0.8, mainY, 2.3, 2.2));
  }
  if (!leves) MAINS_CORPS[race + (costume || '')] = H - mainY;

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
  const aventurier = !costume || costume === 'colporteur' || costume === 'mentor' || costume === 'mendiant';
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
  const ey = Math.round(cy + 1); // arrondi : les nains (tête de 8,6) n'avaient pas d'yeux du tout
  // Les yeux (reposés à la fin, pour que ni casque, ni cheveux, ni barbe ne les cachent)
  const yeux = () => { for (const sens of [-1, 1]) {
    const ox = sens < 0 ? cx - 5 : cx + 3;
    t.poser(ox, ey, 'oeil', 4); t.poser(ox + 1, ey, 'iris', 2);
    t.poser(ox, ey + 1, 'iris', 1); t.poser(ox + 1, ey + 1, 'iris', 1);
    t.poser(sens < 0 ? ox + 1 : ox, ey, 'oeil', 5);
  } };
  yeux();
  for (const sens of [-1, 1]) {
    const ox = sens < 0 ? cx - 5 : cx + 3;
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
  } else if (costume === 'noble') {
    // Un chapeau de velours à large bord, orné d'une longue plume blanche et d'une broche d'or
    t.forme('chapeau', (x, y) => (y >= 2 && y <= cy - 6 && Math.abs(x + 0.5 - cx) < 7 - (cy - 6 - y) * 0.15 ? [(x + 0.5 - cx) / 8, -0.3, 0.8] : null));
    t.forme('chapeau', (x, y) => (y >= cy - 7 && y <= cy - 5 && Math.abs(x + 0.5 - cx) < 11 ? [0, (y - cy + 6) * 0.6, 0.8] : null));
    for (let k = 0; k < 11; k++) { t.poser(cx + 4 + k, Math.max(0, cy - 9 - Math.round(Math.sin(k / 3) * 4) - Math.floor(k / 3)), 'plume', 4 + (k % 2)); t.poser(cx + 4 + k, Math.max(0, cy - 8 - Math.round(Math.sin(k / 3) * 4) - Math.floor(k / 3)), 'plume', 3); }
    t.poser(cx + 3, cy - 7, 'or', 5); t.poser(cx + 4, cy - 7, 'or', 4);
  } else if (costume === 'banquier') {
    t.forme('chapeau', (x, y) => (y >= 0 && y <= cy - 5 && Math.abs(x + 0.5 - cx) < 6 ? [(x + 0.5 - cx) / 7, -0.2, 0.8] : null));
    t.forme('chapeau', (x, y) => (y >= cy - 6 && y <= cy - 5 && Math.abs(x + 0.5 - cx) < 9.5 ? [0, -0.5, 0.8] : null));
    for (let x = cx - 5; x <= cx + 5; x++) t.poser(x, cy - 8, 'or', 3);
  } else if (costume === 'colporteur') {
    // Le chapeau mou à large bord, sa plume ; le foulard rouge ; les poches rapiécées du manteau
    t.forme('chapeau', (x, y) => (y >= 2 && y <= cy - 5 && Math.abs(x + 0.5 - cx) < 6 - (cy - 5 - y) * 0.3 ? [(x + 0.5 - cx) / 7, -0.2, 0.8] : null));
    t.forme('chapeau', (x, y) => (y >= cy - 6 && y <= cy - 4 && Math.abs(x + 0.5 - cx) < 13 ? [0, (y - cy + 5) * 0.6, 0.8] : null));
    for (let k = 0; k < 7; k++) { t.poser(cx + 4 + k, cy - 8 - Math.round(k * 0.6), 'plume', 4 + (k % 2)); t.poser(cx + 4 + k, cy - 7 - Math.round(k * 0.6), 'plume', 3); }
    t.rampes.foulard = rampe(0xa83a30);
    t.forme('foulard', (x, y) => (y >= yT && y <= yT + 3 && Math.abs(x + 0.5 - cx) < 5.5 - (y - yT) * 0.8 ? [(x + 0.5 - cx) / 5 * 0.5, 0.2, 0.9] : null));
    for (let k = 0; k < 4; k++) t.poser(cx + 4 + (k > 1 ? 1 : 0), yT + k, 'foulard', 3 - (k % 2));
    for (const s of [-1, 1]) for (let y = yB - 3; y <= yB + 1; y++) for (let x = Math.round(cx + s * 5) - 2; x <= Math.round(cx + s * 5) + 1; x++) if (t.mat(x, y) === 'habit') t.poser(x, y, 'cuir', y === yB - 3 ? 4 : 2 + ((x + y) % 2));
  } else if (costume === 'garde') {
    t.forme('metal', (x, y) => { const n = ellipsoide(cx, cy - 1, P.rx + 1, P.ry + 1)(x, y); return n && y <= cy - 2 ? n : null; }, { decalage: 0.2 });
    for (let y = cy - 2; y <= cy + 3; y++) t.poser(cx, y, 'metal', 4); // le nasal
    t.forme('cuirRouge' in t.rampes ? 'cuirRouge' : 'habit', ellipsoide(cx, cy - P.ry - 1, 1.5, 2));
  } else if (costume === 'mendiant') {
    // Une capuche râpée, un bâton noueux, une écuelle tendue
    t.forme('cape', (x, y) => { const n = ellipsoide(cx, cy - 1, P.rx + 1.5, P.ry + 1.8)(x, y); return n && (y < cy - 3 || Math.abs(x + 0.5 - cx) > P.rx - 1.5) && y < yT + 3 ? n : null; }, { decalage: -0.3 });
    for (let y = yT - 4; y < sol; y++) { t.poser(cx + P.ep + 3, y, 'cuir', y % 6 === 0 ? 1 : 3); t.poser(cx + P.ep + 4, y, 'cuir', 2); }
    t.forme('metal', ellipsoide(cx - P.ep, yB - 3, 3.2, 1.6), { decalage: -0.2 });
    t.poser(Math.round(cx - P.ep), yB - 4, 'or', 4);
  } else if (costume === 'gobelin') {
    t.forme('cape', (x, y) => { const n = ellipsoide(cx, cy - 1, P.rx + 1.5, P.ry + 1.5)(x, y); return n && (y < cy - 3 || Math.abs(x + 0.5 - cx) > P.rx - 1) && y < yT + 2 ? n : null; }, { decalage: -0.2 });
  } else if (tenue >= 4 && race !== 'nain') {
    for (let k = -5; k <= 5; k++) t.poser(cx + k, cy - P.ry + 1 + (k % 3 === 0 ? -1 : 0), 'or', k % 3 === 0 ? 5 : 4); // un diadème
  } else if (race === 'nain' && costume !== 'banquier') {
    // Le casque à cornes des nains
    t.forme('metal', (x, y) => { const n = ellipsoide(cx, cy - 2, P.rx + 0.8, P.ry)(x, y); return n && y <= cy - 4 ? n : null; }, { decalage: 0.2 });
    for (const sens of [-1, 1]) for (let k = 0; k < 4; k++) t.poser(Math.round(cx + sens * (P.rx + k)), Math.round(cy - 5 - k * 0.8), 'lin', 4 - (k > 2 ? 1 : 0));
  }
  if (costume !== 'mendiant') yeux();

  // Les bras levés : de l'épaule, le coude un peu écarté, les mains au-dessus de la tête
  if (leves) {
    const matBras = costume === 'garde' || (race === 'nain' && costume !== 'banquier') ? 'metal' : 'habit';
    const hautTete = cy - P.ry;
    for (const sens of [-1, 1]) {
      const epaule = [cx + sens * (P.ep - 1), yT + 2], coude = [cx + sens * (P.ep + 2.5), yT - 5], main = [cx + sens * 6.5, hautTete - 7];
      traitHD(t, matBras, [epaule, coude, main], 2.4, -0.2);
      t.forme('peau', ellipsoide(main[0], main[1], 2.3, 2.2));
    }
    MAINS_CORPS[race + (costume || '') + '_leves'] = H - (hautTete - 7);
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
// `vue` : 'troisQuarts' (par défaut, il regarde vers la droite), 'face', 'profil' ou 'dos'.
function corpsHD(scene, quoi, pose = null, vue = 'troisQuarts') {
  if (quoi === 'faucheuse') return 'perso_faucheuse';
  if (typeof quoi === 'string' && !FIGURANTS[quoi] && !PROPORTIONS[quoi]) return 'perso_' + quoi;   // (le joueur, etc.)
  let gene, tenue, costume = null, cle;
  if (typeof quoi === 'string' && FIGURANTS[quoi]) {
    const fig = FIGURANTS[quoi];
    gene = { ...geneHD({ nom: fig.nom, race: fig.race === 'gobelin' ? 'humain' : fig.race }), race: fig.race, habit: fig.habit, cheveux: fig.cheveux, cape: fig.cape, barbe: fig.barbe ?? null, coiffure: fig.coiffure || 'court', ...(fig.peau !== undefined ? { peau: fig.peau } : {}) };
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
    // Les nobles et les collectionneurs : velours, fourrure et chapeau à plume
    if (quoi.prestige) { costume = 'noble'; gene.habit = gene.habitNoble; gene.cape = 0x5a1a3a; cle += '_noble'; }
    if (quoi.costume) { costume = quoi.costume; cle += '_' + quoi.costume; }
    if (quoi.vieux) cle += '_vieux';
    if (quoi.figurant === 'mentor') { gene = { ...gene, habit: 0x2e2420, cheveux: 0x3a281a, cape: 0x3e4a2a, barbe: 'rase', coiffure: 'long', peau: 1 }; costume = 'mentor'; tenue = 2; }
  }
  if (pose) cle += '_' + pose;
  if (vue && vue !== 'troisQuarts') cle += '_' + vue;
  // Les Bannis ont l'air fâché tant qu'ils ne te connaissent pas
  const fache = typeof quoi === 'string' ? (typeof PEUPLES_OMBRE !== 'undefined' && PEUPLES_OMBRE.includes(quoi)) : banniFache(quoi);
  if (fache) cle += '_fache';
  const blesse = typeof quoi === 'string' && FIGURANTS[quoi] && !!FIGURANTS[quoi].blesse;
  if (!scene.textures.exists(cle)) {
    const toile = dessinerCorpsVue(gene, tenue, costume, 0, pose, vue, { fache, blesse });
    toile.texture(scene, cle);
    MAINS_CORPS[cle] = toile.mains;
    dessinerCorpsVue(gene, tenue, costume, -1, pose, vue, { fache, blesse }).texture(scene, cle + '_pas1');
    dessinerCorpsVue(gene, tenue, costume, 1, pose, vue, { fache, blesse }).texture(scene, cle + '_pas2');
  }
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
function imageCorps(scene, x, y, quoi, echelle, pose = null) {
  const cle = corpsHD(scene, quoi, pose);
  return scene.add.image(x, y, cle).setOrigin(0.5, 1).setScale(echelle * echelleCorps(cle));
}
