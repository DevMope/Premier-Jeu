// Les corps en volume : un même personnage vu de face, de trois-quarts, de profil ou de dos,
// avec une lumière par membre (le bras, l'avant-bras, la cuisse, le mollet ont chacun leur
// cylindre), des ombres portées (une manche sur le torse, le menton sur le cou, la frange sur
// le front), des contours épais et des couleurs vives. C'est ce qui donne du relief, façon
// Terraria : des volumes simples, mais lisibles.
//
// Ces corps sont deux fois plus fins que les anciens (FINESSE = 2) : même taille à l'écran,
// mais quatre fois plus de pixels, ce que les écrans 1080p et 4K montrent vraiment.
//
// Le corps est pensé en trois dimensions : `u` vers la droite de l'écran (quand il est de face),
// `z` vers le spectateur, `y` vers le bas. On le tourne d'un angle, et chaque point se projette
// à l'écran ; ce qui est derrière se dessine d'abord, ce qui est devant se dessine par-dessus.

const FINESSE = 2;
const ANGLES_VUE = { face: 0, troisQuarts: Math.PI / 4, profil: Math.PI / 2, dos: Math.PI };
const VUES_CORPS = ['troisQuarts', 'face', 'profil', 'dos'];

// Des dégradés plus vifs que `rampe` : plus saturés, des ombres plus profondes, des lumières
// plus franches (les ombres tirent vers le violet, les lumières vers le jaune, comme avant).
function rampeVive(base) {
  const [h, s, l] = versHsl(base);
  const pas = [-0.38, -0.25, -0.12, 0, 0.12, 0.24];
  return pas.map((d, i) => {
    const ombre = i < 3 ? (3 - i) / 3 : 0, lumiere = i > 3 ? (i - 3) / 2 : 0;
    const hh = versTeinte(versTeinte(h, 255, ombre * 0.25), 50, lumiere * 0.2);
    const ss = Math.min(1, s * 1.3 * (1 + ombre * 0.2) * (1 - lumiere * 0.1) + 0.04);
    return depuisHsl(hh, ss, Math.max(0.05, Math.min(0.97, l + d)));
  });
}
// Les peaux vives : les mêmes teintes que les portraits, un peu plus de contraste.
const PEAUX_VIVES = RAMPES_PEAU.map(r => r.map((c, i) => { const [h, s, l] = versHsl(c); return depuisHsl(h, Math.min(1, s * 1.15), Math.max(0.04, Math.min(0.97, l + (i - 3) * 0.03))); }));

// Un cylindre entre deux points de l'écran (un membre), avec sa normale ronde.
function cylindre(t, mat, a, b, rayon, { decalage = 0, ombre = null, motif = null } = {}) {
  const [ax, ay] = a, [bx, by] = b;
  const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1;
  t.forme(mat, (x, y) => {
    const u = Math.max(0, Math.min(1, ((x + 0.5 - ax) * dx + (y + 0.5 - ay) * dy) / l2));
    const px = x + 0.5 - (ax + u * dx), py = y + 0.5 - (ay + u * dy);
    const d = Math.hypot(px, py);
    if (d >= rayon) return null;
    const n = d / rayon;
    return [px / rayon, py / rayon * 0.5, Math.sqrt(Math.max(0.05, 1 - n * n))];
  }, { decalage, ombre, motif });
}

// Un contour plus épais : un deuxième anneau sombre autour du premier.
function contourEpais(t, tours = 1) {
  t.contour();
  for (let n = 0; n < tours; n++) {
    const ajouts = [];
    for (let y = 0; y < t.h; y++) for (let x = 0; x < t.l; x++) {
      if (t.c[y * t.l + x] !== null) continue;
      if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => t.dans(x + dx, y + dy) && t.c[(y + dy) * t.l + x + dx] !== null)) ajouts.push(y * t.l + x);
    }
    for (const i of ajouts) t.c[i] = NOIR_CONTOUR;
  }
}

function dessinerCorpsVue(g, tenue = 1, costume = null, pas = 0, pose = null, vue = 'troisQuarts') {
  const k = FINESSE;
  const race = PROPORTIONS[g.race] ? g.race : 'humain';
  const P0 = PROPORTIONS[race];
  const P = { H: P0.H * k, ep: P0.ep * k, torse: P0.torse * k, rx: P0.rx * k, ry: P0.ry * k };
  const th = ANGLES_VUE[vue] ?? ANGLES_VUE.troisQuarts;
  const c = Math.cos(th), s = Math.sin(th);
  const dos = vue === 'dos';
  const L = 52 * k;
  const coiffe = (race === 'magicienne' ? 14 : race === 'nain' ? 4 : costume === 'banquier' ? 10 : costume === 'noble' || costume === 'colporteur' ? 8 : costume === 'garde' ? 2 : 0) * k + (pose === 'leves' ? 12 * k : 0);
  const H = P.H + coiffe;
  const t = new ToileHD(L, H);
  t.relief = true;
  const cx = L / 2;
  const f = g.feminin;
  const gobelin = costume === 'gobelin';
  const leves = pose === 'leves';
  t.rampes.peau = gobelin ? rampeVive(0x6a9a3a) : PEAUX_VIVES[g.peau ?? 1] || PEAUX_VIVES[1];
  t.rampes.cheveux = rampeVive(g.cheveux);
  t.rampes.habit = rampeVive(g.habit);
  t.rampes.cape = rampeVive(g.cape || 0x4a3a2a);
  t.rampes.iris = rampeVive(g.yeux || 0x4a3a20);
  t.rampes.lin = rampeVive(0xd8ccb0);
  t.rampes.bas = rampeVive(race === 'elfe' ? 0x3a4a3a : race === 'hobbit' ? 0x8a6a40 : 0x5a4a3a);
  t.rampes.cuir = rampeVive(0x6a3f22);
  t.rampes.metal = rampeVive(0x7a8498);
  t.rampes.levres = levresPour(g.peau ?? 1, f);
  t.rampes.chapeau = rampeVive(race === 'magicienne' ? 0x3a2a8a : costume === 'banquier' ? 0x1a1a22 : costume === 'colporteur' ? 0x5a4630 : costume === 'noble' ? 0x4a1a3a : g.habit);
  t.rampes.plume = rampeVive(0xf0e8d0); t.rampes.fourrure = rampeVive(0xe8e0d0); t.rampes.osier = rampeVive(0xb08a48); t.rampes.foulard = rampeVive(0xc03a30); t.rampes.laine = rampeVive(0x8a3030);
  t.rampes.levres = gobelin ? rampeVive(f ? 0xb84a5a : 0x8a3a34) : t.rampes.levres;
  t.rampes.blanc = rampeVive(0xf4f0ea);
  t.rampes.pupille = [0x060608, 0x0c0c12, 0x14141c, 0x1c1c26, 0x2a2a36, 0x3a3a48];

  const cy = coiffe + 1 + P.ry;            // le centre de la tête
  const yT = cy + P.ry - 1;                // le haut du torse
  const yB = yT + P.torse;                 // la taille
  const sol = H - 1;
  const ep = P.ep;                         // la demi-largeur d'épaules
  const prof = ep * 0.55;                  // la demi-épaisseur du torse
  const longue = race === 'magicienne';    // la robe descend jusqu'aux pieds
  const manteau = race === 'elfe' || costume === 'colporteur' || costume === 'mentor';   // la tunique descend à mi-cuisse
  const capee = tenue >= 3 || ['mentor', 'colporteur', 'mendiant', 'noble'].includes(costume);
  const aventurier = !costume || ['colporteur', 'mentor', 'mendiant'].includes(costume);

  // La projection : un point (u, z) → x à l'écran ; et sa profondeur (devant > 0).
  const X = (u, z) => cx + u * c + z * s;
  const Z = (u, z) => -u * s + z * c;
  // Le côté « proche » du spectateur : u négatif quand il se tourne vers la droite.
  const pres = s > 0.01 ? -1 : 1;
  const loin = -pres;
  // La demi-largeur à l'écran d'une section ronde de demi-axes (ru, rz).
  const section = (ru, rz) => Math.sqrt((ru * c) ** 2 + (rz * s) ** 2);

  // --- Les membres ---
  const matBras = (race === 'nain' && costume !== 'banquier') || costume === 'garde' ? 'metal' : 'habit';
  const bras = (cote, devant) => {
    const bal = pas ? (cote === pres ? pas : -pas) : 0;   // les bras se balancent avec la marche
    const epaule = [cote * (ep - 0.8 * k), 0.3 * k, yT + 2 * k];
    // Les bras levés : du coude écarté, les mains montent au-dessus de la tête (pour porter quelque chose)
    const coude = leves ? [cote * (ep + 2.5 * k), 1 * k, yT - 5 * k] : [cote * (ep + 1.2 * k), (-0.8 + bal * 1.5) * k, yT + P.torse * 0.5];
    const main = leves ? [cote * 6.5 * k, 2 * k, cy - P.ry - 7 * k] : [cote * (ep + 0.6 * k), (1 + bal * 3.5) * k, yB + (1.5 - Math.abs(bal) * 0.5) * k];
    const E = [X(epaule[0], epaule[1]), epaule[2]], C = [X(coude[0], coude[1]), coude[2]], M = [X(main[0], main[1]), main[2]];
    const r = (race === 'nain' ? 3 : 2.6) * k;
    const dec = devant ? 0 : -0.5;
    cylindre(t, matBras, E, C, r, { decalage: dec });
    // L'avant-bras : manche retroussée (novice), manche plus claire (aguerri), brassard de cuir (vétéran et plus)
    const matAvant = matBras === 'metal' ? 'metal' : tenue >= 2 && aventurier ? 'cuir' : tenue === 0 && aventurier ? 'peau' : matBras;
    cylindre(t, matAvant, C, M, r - 0.3 * k, { decalage: dec + (matAvant === matBras ? 0.4 : 0.15) });
    if (tenue >= 2 && aventurier) for (let j = 0; j < 2; j++) t.forme('cuir', (x, y) => (Math.abs(y - (C[1] + (M[1] - C[1]) * (0.35 + j * 0.3))) < 0.6 * k && Math.abs(x + 0.5 - (C[0] + (M[0] - C[0]) * (0.35 + j * 0.3))) < r ? [0, 0, 1] : null), { decalage: -0.9, bord: false, ombre: false }); // les lanières
    // La main : la paume et un pouce
    t.forme('peau', ellipsoide(M[0], M[1] + 1 * k, 2.2 * k, 2.3 * k), { decalage: dec + 0.1 });
    t.forme('peau', ellipsoide(M[0] + cote * c * 1.6 * k + s * 1.2 * k, M[1] + 0.6 * k, 0.9 * k, 1.2 * k), { decalage: dec + 0.3, ombre: false });
  };
  const jambe = (cote, devant) => {
    const bal = pas ? (cote === pres ? pas : -pas) : 0;   // la jambe qui avance
    const hanche = [cote * ep * 0.42, 0, yB - 1 * k];
    const genou = [cote * ep * 0.45, (bal * 2.2 + (bal > 0 ? 1 : 0)) * k, yB + (sol - yB) * 0.5];
    const pied = [cote * ep * 0.48, bal * 3.8 * k, sol - 3 * k - (bal > 0 ? 1.5 * k : 0)];
    const Hh = [X(hanche[0], hanche[1]), hanche[2]], G = [X(genou[0], genou[1]), genou[2]], Pd = [X(pied[0], pied[1]), pied[2]];
    const dec = devant ? 0 : -0.5;
    const r = (race === 'nain' ? 3.4 : race === 'hobbit' ? 3 : 2.9) * k;
    cylindre(t, 'bas', Hh, G, r, { decalage: dec });
    if (race === 'hobbit' || costume === 'mendiant') {
      cylindre(t, 'bas', G, Pd, r - 0.4 * k, { decalage: dec + 0.2, motif: costume === 'mendiant' ? (x, y) => (hachage(Math.floor(x / k), Math.floor(y / k), 77) > 0.85 ? -1.2 : 0) : null });
      // Les grands pieds nus et poilus
      t.forme('peau', ellipsoide(X(pied[0], pied[1] + 2 * k), sol - 1.5 * k, (3.6 + s * 1.2) * k, 2 * k), { decalage: dec });
      if (race === 'hobbit') for (let j = 0; j < 4; j++) t.poser(Math.round(X(pied[0], pied[1] + (1 + j * 0.7) * k)), sol - 3 * k - (j % 2), 'cheveux', 2);
    } else {
      // La botte : la tige jusqu'au genou, le revers, le pied qui pointe vers l'avant
      cylindre(t, 'cuir', G, Pd, r - 0.2 * k, { decalage: dec + 0.1 });
      const bout = X(pied[0], pied[1] + 3.4 * k);
      t.forme('cuir', (x, y) => (y >= sol - 3 * k && y <= sol && Math.abs(x + 0.5 - (Pd[0] + bout) / 2) < Math.abs(bout - Pd[0]) / 2 + r - 0.5 * k ? [(x + 0.5 - Pd[0]) / (4 * k), (y - sol + 1.5 * k) / (2 * k), 0.8] : null), { decalage: dec });
      t.forme('cuir', (x, y) => (y >= G[1] + 1 && y <= G[1] + 1.5 * k && Math.abs(x + 0.5 - G[0]) < r + 0.3 * k ? [0, -0.6, 0.7] : null), { decalage: 0.6, bord: false, ombre: false });
    }
  };

  // --- 1. Derrière : la cape (sauf de dos), les cheveux longs, le bras et la jambe du côté éloigné ---
  const dessinerCape = (devant) => {
    t.forme('cape', (x, y) => {
      if (y < yT + 1 * k || y > sol - 4 * k) return null;
      if (costume === 'mendiant' && y > sol - 12 * k && hachage(Math.floor(x / k), 0, 77) * 10 * k > sol - y) return null; // le bas en lambeaux
      const demi = (ep + 1.5 * k + (y - yT) * 0.12) * (devant ? 1 : Math.max(0.55, c) + 0.1);
      const centre = devant ? cx : X(0, -prof * 0.9);
      const nx = (x + 0.5 - centre) / demi;
      return Math.abs(nx) <= 1 ? [nx * 0.6, 0.1, 0.8] : null;
    }, { decalage: -0.9, motif: (x) => (Math.floor(x / k) % 5 === 0 ? -0.5 : 0) });
  };
  // La hotte d'osier du colporteur, derrière tout : plus large que lui, une couverture roulée dessus
  if (costume === 'colporteur' && !dos) {
    const hx = X(0, -prof * 1.3);
    t.forme('osier', (x, y) => (y >= yT - 12 * k && y <= yB + 7 * k && Math.abs(x + 0.5 - hx) < section(ep + 7 * k, prof * 0.9) - Math.max(0, yT - 8 * k - y) * 0.8 ? [(x + 0.5 - hx) / (ep + 7 * k) * 0.8, 0, 0.7] : null),
      { motif: (x, y) => ((Math.floor(x / k) + Math.floor(y / k)) % 3 === 0 ? -0.7 : (Math.floor(x / k) - Math.floor(y / k)) % 3 === 0 ? 0.5 : 0) });
    t.forme('laine', ellipsoide(hx, yT - 13 * k, section(ep + 5 * k, prof), 3 * k), { motif: (x) => (Math.floor(x / k) % 4 === 0 ? -0.6 : 0) });
  }
  if (capee && !dos) dessinerCape(false);
  // Le bâton noueux du mendiant, dans son dos
  if (costume === 'mendiant' && !dos) { const bx0 = X(ep + 3 * k, -1 * k); for (let y = yT - 6 * k; y < sol; y++) for (let e = 0; e < k; e++) t.poser(Math.round(bx0 + Math.sin(y / (6 * k)) * 0.6 * k) + e, y, 'cuir', Math.floor(y / k) % 6 === 0 ? 1 : 3); }
  const longs = ['long', 'queue', 'chignon'].includes(g.coiffure) || race === 'elfe' || race === 'magicienne';
  if (longs && !dos) {
    const bas = g.coiffure === 'chignon' ? cy + 4 * k : race === 'elfe' || race === 'magicienne' ? yT + 10 * k : yT + 4 * k;
    t.forme('cheveux', (x, y) => { const cc = X(0, -P.rx * 0.4); return y >= cy - 4 * k && y <= bas && Math.abs(x + 0.5 - cc) < P.rx + 1.2 * k - Math.max(0, y - bas + 6 * k) * 0.5 ? [(x + 0.5 - cc) / (P.rx + 2 * k), 0, 0.8] : null; }, { decalage: -0.8, motif: MECHES });
  }
  if (!dos) { bras(loin, false); if (!longue) jambe(loin, false); } else { bras(pres, false); if (!longue) jambe(pres, false); }

  // --- 2. Le torse (un cylindre un peu aplati, les épaules rondes), la ceinture ---
  const torse = (x, y) => {
    const bas = longue ? sol : manteau ? yB + Math.round((sol - yB) * 0.55) : yB + 2 * k;
    if (y < yT || y > bas) return null;
    let ru = y < yT + 4 * k ? ep - 4 * k + (y - yT) * 1.1 : ep + 0.2 * k - Math.max(0, y - yB + 6 * k) * 0.12;
    if (y > yB) ru = ep - 1 * k + (y - yB) * (longue ? 0.28 : 0.18);
    if (race === 'nain' || race === 'hobbit') ru += Math.sin(Math.min(1, (y - yT) / P.torse) * Math.PI) * 1.4 * k;
    const rz = prof + (race === 'nain' || race === 'hobbit' ? 1 * k : 0) + (y > yB ? (y - yB) * 0.15 : 0);
    const w = section(ru, rz);
    const nx = (x + 0.5 - cx) / w;
    if (Math.abs(nx) > 1) return null;
    return [nx * 0.85, -0.15, Math.sqrt(1 - nx * nx * 0.72)];
  };
  t.forme(race === 'hobbit' ? 'lin' : 'habit', torse, { decalage: -0.1, motif: (x, y) => (!dos && Math.abs(x + 0.5 - X(0, prof)) < 0.6 * k && y > yT + 3 * k ? -0.6 : longue && (Math.floor(x / k) * 7 + Math.floor(y / k) * 3) % 23 === 0 ? 0.9 : 0) });
  if (race === 'hobbit') t.forme('habit', (x, y) => { const n = torse(x, y); return n && y >= yT + 2 * k && Math.abs(x + 0.5 - X(0, prof * 0.9)) > 2 * k + Math.max(0, 6 * k - (y - yT)) * 0.5 ? n : null; }, { decalage: -0.2 });
  if ((race === 'nain' && costume !== 'banquier') || costume === 'garde') t.forme('metal', (x, y) => { const n = torse(x, y); return n && y >= yT + 1 * k && y <= yB - 2 * k ? n : null; }, { motif: (x, y) => ((Math.floor(x / k) + Math.floor(y / k)) % 2 ? 0.3 : -0.3) });
  // Le tabard du garde, le plastron blanc et la chaîne d'or du banquier
  if (costume === 'garde') t.forme('habit', (x, y) => (y >= yT + 3 * k && y <= yB + 4 * k && Math.abs(x + 0.5 - X(0, prof)) < 4 * k * Math.max(0.3, Math.abs(c)) && Z(0, prof) > 0 ? [0, 0, 1] : null), { decalage: 0.1 });
  if (costume === 'banquier' && !dos) {
    t.forme('lin', (x, y) => (y >= yT && y <= yT + 8 * k && Math.abs(x + 0.5 - X(0, prof)) < (3 * k - (y - yT) * 0.25) * Math.max(0.3, Math.abs(c)) ? [0, 0, 1] : null), { decalage: 0.2 });
    for (let j = -5; j <= 5; j++) { const x = Math.round(X(j * k, prof + 0.5 * k)); t.poser(x, yT + 7 * k + Math.round(Math.abs(j) * -0.4 * k + 3 * k), 'or', j % 2 ? 3 : 5); t.poser(x + 1, yT + 7 * k + Math.round(Math.abs(j) * -0.4 * k + 3 * k), 'or', 4); }
  }
  // Le foulard rouge et les poches rapiécées du colporteur
  if (costume === 'colporteur' && !dos) {
    t.forme('foulard', (x, y) => (y >= yT - 1 * k && y <= yT + 3 * k && Math.abs(x + 0.5 - X(0, prof * 0.8)) < (5.5 * k - (y - yT) * 0.8) * Math.max(0.4, Math.abs(c)) ? [(x + 0.5 - cx) / (5 * k) * 0.5, 0.2, 0.9] : null), { decalage: 0.1 });
    for (let j = 0; j < 4 * k; j++) for (let e = 0; e < k; e++) t.poser(Math.round(X(4 * k, prof * 0.8)) + e + (j > 2 * k ? 1 : 0), yT + 2 * k + j, 'foulard', 3 - (Math.floor(j / k) % 2));
    for (const cote of [-1, 1]) for (let y = yB - 3 * k; y <= yB + 1 * k; y++) for (let x = Math.round(X(cote * 5 * k, prof)) - 2 * k; x <= Math.round(X(cote * 5 * k, prof)) + 1 * k; x++) if (t.mat(x, y) === 'habit') t.poser(x, y, 'cuir', y < yB - 3 * k + k ? 4 : 2 + ((Math.floor(x / k) + Math.floor(y / k)) % 2));
  }
  // La capuche et le col de fourrure du noble
  if (costume === 'noble') t.forme('fourrure', (x, y) => (y >= yT - 1 * k && y <= yT + 4 * k && torse(x, y) ? [(x + 0.5 - cx) / ep, -0.3, 0.8] : null), { motif: (x, y) => ((Math.floor(x / k) + Math.floor(y / k)) % 2 ? 0.5 : -0.3) });
  if (longue) for (let y = yB + 4 * k; y < sol; y += 5 * k) for (let x = cx - 8 * k; x < cx + 9 * k; x += 6 * k) if (t.mat(x + (y % 2), y) === 'habit') { t.poser(x + (y % 2), y, 'or', 4); t.poser(x + (y % 2) + 1, y, 'or', 5); } // les étoiles
  // Les pièces cousues des novices
  if (tenue === 0 && !longue && aventurier) for (const [du, dy] of [[-3, 6], [2, 11]]) for (let i = 0; i < 3 * k; i++) for (let j = 0; j < 3 * k; j++) { const x = Math.round(X(du * k, prof * 0.8)) + i, y = yT + dy * k + j; if (t.mat(x, y) === 'habit') t.poser(x, y, 'habit', (i === 0 || j === 0 || i === 3 * k - 1 || j === 3 * k - 1) ? 1 : 2); }
  // La ceinture, la boucle
  t.forme(tenue === 0 ? 'lin' : 'cuir', (x, y) => (y >= yB - 2 * k && y <= yB - 1 && torse(x, y) ? [0, y < yB - 1 * k ? -0.6 : 0.4, 0.8] : null), { ombre: false });
  if (tenue >= 1 && !dos && Z(0, prof) > 0) t.forme(tenue >= 4 ? 'or' : 'metal', ellipsoide(X(0, prof), yB - 1.5 * k, 1.6 * k, 1.3 * k), { decalage: 0.4, ombre: false });
  // La bandoulière et la sacoche (aguerri et plus)
  if (tenue >= 1 && !dos && !longue && aventurier) {
    for (let j = 0; j < P.torse - 2 * k; j++) for (let e = 0; e < k; e++) { const x = Math.round(X(-ep + 3 * k + j * (ep * 2 - 6 * k) / P.torse, prof * 0.95)) + e; if (torse(x, yT + 1 * k + j)) t.poser(x, yT + 1 * k + j, 'cuir', 2); }
    const sx = X(ep - 1 * k, 0.5 * k);
    if (Z(ep - 1 * k, 0.5 * k) > -2 * k) t.forme('cuir', (x, y) => (y >= yB - 1 * k && y <= yB + 4 * k && Math.abs(x + 0.5 - sx) < 2.6 * k ? [(x + 0.5 - sx) / (2.6 * k), 0, 0.9] : null));
  }
  // Les épaulières : cuir (vétéran), métal (héros), métal et or (légende)
  if (tenue >= 2 && (aventurier || costume === 'noble')) for (const cote of [loin, pres]) {
    const ex = X(cote * (ep - 0.8 * k), 0.3 * k);
    if (Z(cote * (ep - 0.8 * k), 0.3 * k) < -prof * 0.9 && s > 0.5) continue;
    t.forme(tenue >= 3 ? 'metal' : 'cuir', ellipsoide(ex, yT + 2 * k, 3.4 * k * Math.max(0.6, Math.abs(c) + 0.3), 2.4 * k), { decalage: 0.3 });
    if (tenue >= 4) for (let j = -2 * k; j <= 2 * k; j++) t.poser(Math.round(ex + j), yT + 4 * k, 'or', 4);
  }

  // --- 3. Devant : le bras et la jambe du côté proche ---
  if (!dos) { if (!longue) jambe(pres, true); bras(pres, true); } else { if (!longue) jambe(loin, true); bras(loin, true); }

  // --- 4. Le cou, la tête, le visage ---
  t.forme('peau', (x, y) => (y >= yT - 3 * k && y <= yT + 1 * k && Math.abs(x + 0.5 - X(0, 0.5 * k)) < 2.4 * k ? [(x + 0.5 - X(0, 0.5 * k)) / (2.4 * k), 0.2, 0.9] : null), { decalage: -0.6 });
  const tete = ellipsoide(cx, cy, P.rx, P.ry);
  const oreille = (cote) => {
    const u = cote * P.rx, z = -P.rx * 0.1;
    if (Z(u, z) < -P.rx * 0.25 || dos) return;
    const ox = X(u, z);
    if (gobelin) { t.forme('peau', (x, y) => { const d = cote * (x + 0.5 - ox) / k; return d > -1 && d < 7 && Math.abs(y + 0.5 - cy + 1 * k) < (2.6 - d * 0.3) * k ? [cote, -0.3, 0.6] : null; }); return; }
    if (race === 'elfe') t.forme('peau', (x, y) => { const d = cote * (x + 0.5 - ox) * (s > 0.5 ? 0.6 : 1) / k, h = (cy + 2 * k - y) / k; return h >= 0 && h < 8 && d > -1.4 + h * 0.45 && d < 1.8 + h * 0.35 ? [cote * 0.7, -0.5, 0.6] : null; });
    else { t.forme('peau', ellipsoide(ox, cy + 1.5 * k, 1.8 * k, 2.6 * k), { decalage: -0.2 }); t.forme('peau', ellipsoide(ox, cy + 1.8 * k, 0.9 * k, 1.4 * k), { decalage: -0.8, bord: false, ombre: false }); }
  };
  oreille(loin);
  t.forme('peau', tete, { decalage: 0.05 });
  oreille(pres);
  if (race === 'hobbit' && !dos) for (const cote of [-1, 1]) if (Z(cote * 4.5 * k, P.rx * 0.7) > 0) t.forme('peau', ellipsoide(X(cote * 4.5 * k, P.rx * 0.7), cy + 3.5 * k, 2.6 * k, 2 * k), { decalage: 0.35, bord: false, ombre: false });
  const ey = Math.round(cy + 1 * k);
  const by = ey + 5 * k;
  let yeux = [];
  const poserYeux = () => { for (const [ox, large, cote] of yeux) {
    // Un œil de dessin animé, mais posé : le blanc en amande, l'iris, la pupille, un reflet,
    // et une paupière lourde qui coupe le haut de l'œil
    const w = large ? 1.7 * k : 1 * k, h = 1.9 * k;
    t.forme('blanc', ellipsoide(ox, ey, w, h), { decalage: 0.4, ombre: false, bord: false });
    const ix = ox + (large ? 0 : cote * 0.2 * k);
    t.forme('iris', ellipsoide(ix, ey + 0.2 * k, large ? 1 * k : 0.7 * k, 1.3 * k), { decalage: 0.2, ombre: false, bord: false });
    t.forme('pupille', ellipsoide(ix, ey + 0.3 * k, large ? 0.55 * k : 0.4 * k, 0.8 * k), { ombre: false, bord: false });
    t.poser(Math.round(ix - 0.5 * k), Math.round(ey - 0.5 * k), 'blanc', 5);
    for (let i = -Math.round(w); i <= Math.round(w); i++) { const yy = Math.round(ey - h + Math.round(Math.abs(i) * Math.abs(i) / (w * w) * 1.1 * k)); for (let e = 0; e < Math.max(1, Math.round(0.6 * k)); e++) t.poser(Math.round(ox + i), yy + e, 'pupille', 2); }
  } };
  if (!dos) {
    // Le nez : une petite bosse qui dépasse quand il est de profil
    const nz = X(0, P.rx);
    if (race === 'nain') t.forme('peau', ellipsoide(nz - s * 1 * k, ey + 3 * k, 2 * k, 2 * k), { decalage: 0.25, ombre: false });
    else { t.forme('peau', ellipsoide(nz - 0.6 * k + s * 0.8 * k, ey + 2.6 * k, 1.1 * k, 1.5 * k), { decalage: 0.35, ombre: false, bord: false }); for (let j = 0; j < 2 * k; j++) t.poser(Math.round(nz - 1.4 * k + s * 0.8 * k), ey + 1.5 * k + j, 'peau', 2); }
    // Les yeux, symétriques autour du nez
    for (const cote of [loin, pres]) {
      const u = cote * P.rx * 0.46, z = P.rx * 0.78;
      if (Z(u, z) < 0.6 * k) continue;
      yeux.push([X(u, z), cote === pres || s < 0.3, cote]);
    }
    poserYeux();
    // Les sourcils : un arc au-dessus de chaque œil
    for (const [ox, large] of yeux) { const w = large ? 2 * k : 1.1 * k; for (let i = -Math.round(w); i <= Math.round(w); i++) for (let e = 0; e < Math.round(0.7 * k); e++) t.poser(Math.round(ox + i), Math.round(ey - 3.2 * k + (i * i) / (w * w) * 1 * k) + e, 'cheveux', e ? 2 : 1); }
    // La bouche : un petit sourire
    const bx = X(0, P.rx * 0.85);
    const lb = Math.max(1, Math.round(2.4 * k * Math.abs(c)));
    for (let i = -lb; i <= lb; i++) for (let e = 0; e < Math.max(1, Math.round(0.6 * k)); e++) t.poser(Math.round(bx + i), by + Math.round((1 - (i * i) / (lb * lb)) * 0.8 * k) + e, 'levres', 1);
    if (Math.abs(c) > 0.3) t.poser(Math.round(bx - lb - 1), by, 'levres', 4);
    if (Math.abs(c) > 0.9) t.poser(Math.round(bx + lb + 1), by, 'levres', 4);
    // La barbe : sur la moitié avant du menton et des joues
    const barbe = race === 'nain' ? 'nain' : g.barbe;
    if (barbe) {
      const long = barbe === 'nain' ? yB - 2 * k : barbe === 'pleine' ? cy + P.ry + 4 * k : cy + P.ry + 1.5 * k;
      t.forme('cheveux', (x, y) => {
        if (y < ey + 3 * k || y > long) return null;
        if (y >= by - 1 * k && y <= by + 1.5 * k && Math.abs(x + 0.5 - bx) < 3 * k) return null;
        const demi = (barbe === 'nain' ? P.rx - 0.8 * k : P.rx + 0.5 * k) - Math.max(0, y - cy - P.ry) * (barbe === 'nain' ? 0.25 : 0.6);
        const centre = X(0, P.rx * 0.35 + Math.max(0, y - cy - P.ry) * 0.1);
        const nx = (x + 0.5 - centre) / demi;
        if (Math.abs(nx) > 1 || (barbe === 'bouc' && Math.abs(x + 0.5 - bx) > 3 * k)) return null;
        const fz = -nx * c * s + Math.sqrt(Math.max(0, 1 - nx * nx)) * Math.abs(c) + s * 0.3;
        return fz > 0.2 ? [nx * 0.8, (y - ey) / (20 * k), 0.8] : null;
      }, { motif: MECHES });
      if (barbe === 'nain') for (let y = yT + 6 * k; y < yB; y += 3 * k) { t.poser(Math.round(bx), y, 'or', 3); t.poser(Math.round(bx) + 1, y, 'or', 5); }
    }
    // Les grandes dents de Grippesou
    if (gobelin) for (let j = -2; j <= 2; j++) { const x = Math.round(bx + j * 1.2 * k); for (let e = 0; e < k; e++) t.poser(x, by + 1 * k + e, 'blanc', j % 2 ? 4 : 2); }
  }

  // --- 5. Les cheveux : une calotte sur la sphère, qui couvre le haut, l'arrière et les tempes ---
  const coupe = race === 'hobbit' ? 'boucles' : g.coiffure;
  if (coupe === 'boucles') {
    for (const [u, dy, z] of [[-6, -5, 2], [-2, -8, 3], [3, -8, 3], [7, -5, 2], [-8, -1, -2], [8, -1, -2], [0, -6, -5], [-5, -3, -6], [5, -3, -6]]) {
      if (Z(u * k, z * k) < -3 * k && !dos) continue;
      t.forme('cheveux', ellipsoide(X(u * k, z * k), cy + dy * k, 3 * k, 3 * k));
    }
  } else if (coupe !== 'chauve') {
    t.forme('cheveux', (x, y) => {
      const nx = (x + 0.5 - cx) / (P.rx + 1 * k), ny = (y + 0.5 - cy) / (P.ry + 1.8 * k);
      const d2 = nx * nx + ny * ny;
      if (d2 > 1) return null;
      const nz = Math.sqrt(1 - d2);
      const fz = nx * s + nz * c, fu = nx * c - nz * s;   // la normale dans le repère du personnage
      const frange = ny < -0.42 + Math.abs(Math.sin((x - cx) / k * 1.1)) * 0.14;
      const arriere = fz < -0.05;
      const tempe = Math.abs(fu) > 0.86 && ny < 0.25 && fz < 0.6;
      if (!frange && !arriere && !tempe) return null;
      return [nx, ny, nz];
    }, { motif: MECHES });
    if (coupe === 'herisse') for (let j = -6; j <= 6; j += 3) t.forme('cheveux', (x, y) => (y >= cy - P.ry - 3 * k && y < cy - P.ry + 1 * k && Math.abs(x + 0.5 - cx - j * 0.9 * k) < (y - cy + P.ry + 4 * k) * 0.5 ? [0, -0.6, 0.7] : null), { ombre: false });
    if (coupe === 'chignon') t.forme('cheveux', ellipsoide(X(0, -P.rx * 0.6), cy - P.ry - 0.5 * k, 3.5 * k, 3 * k), { motif: MECHES });
    if (coupe === 'queue' && (s > 0.3 || dos)) t.forme('cheveux', (x, y) => { const qx = X(0, -P.rx - 1 * k); return y >= cy - 2 * k && y <= yT + 8 * k && Math.abs(x + 0.5 - qx) < 2.2 * k - Math.max(0, y - yT - 2 * k) * 0.15 ? [(x + 0.5 - qx) / (2.2 * k), 0, 0.8] : null; }, { motif: MECHES });
  }
  if (!dos) { t.relief = false; poserYeux(); t.relief = true; }
  if (longs && dos) t.forme('cheveux', (x, y) => (y >= cy && y <= yT + 10 * k && Math.abs(x + 0.5 - cx) < P.rx + 1 * k - Math.max(0, y - yT - 4 * k) * 0.4 ? [(x + 0.5 - cx) / (P.rx + 2 * k), 0, 0.8] : null), { decalage: -0.3, motif: MECHES });
  if (tenue >= 4 && race !== 'nain' && race !== 'magicienne') for (let j = -5; j <= 5; j++) { const x = Math.round(X(j * k, Math.sqrt(Math.max(0, P.rx * P.rx - (j * k) ** 2)) * 0.9)); for (let e = 0; e < k; e++) t.poser(x + e, cy - P.ry + 1 * k + (j % 3 === 0 ? -1 * k : 0), 'or', j % 3 === 0 ? 5 : 4); } // le diadème

  // --- Les couvre-chefs des peuples ---
  if (race === 'nain' && costume !== 'banquier') {
    // Le casque à cornes : une calotte de métal, un nasal, deux cornes d'ivoire qui s'écartent
    t.forme('metal', (x, y) => { const n = ellipsoide(cx, cy - 2 * k, P.rx + 0.8 * k, P.ry)(x, y); return n && y <= cy - 4 * k ? n : null; }, { decalage: 0.2, motif: (x, y) => (y === Math.round(cy - 4 * k) ? -0.9 : 0) });
    if (!dos) for (let y = cy - 2 * k; y <= cy + 3 * k; y++) for (let e = 0; e < k; e++) t.poser(Math.round(X(0, P.rx)) - (k - 1) + e - Math.round(s * k), y, 'metal', 4);
    for (const cote of [loin, pres]) {
      const u = cote * (P.rx + 0.5 * k), z = -P.rx * 0.2;
      if (Z(u, z) < -P.rx * 0.6 && s > 0.5) continue;
      const bx0 = X(u, z);
      for (let j = 0; j < 5 * k; j++) { const r = (1.3 - j / (5 * k) * 0.9) * k; t.forme('lin', ellipsoide(bx0 + cote * c * j * 0.7 + s * j * 0.2 * (cote === pres ? -0.3 : 0.3), cy - 5 * k - j * 0.9, r, r), { decalage: 0.3, ombre: false, bord: j === 0 }); }
    }
  } else if (race === 'magicienne') {
    // Le chapeau de mage : une grande calotte souple qui se plie et retombe, un large bord
    // ondulé, un ruban de cuir à boucle
    const haut = cy - P.ry;
    const sommet = [X(0, -2 * k) + 7 * k * (c > 0 ? 1 : 0.4) + s * 5 * k, 1 * k];
    t.forme('chapeau', (x, y) => {
      if (y < 0 || y > haut + 1 * k) return null;
      const u = (haut + 1 * k - y) / (haut + 1 * k);                   // 0 en bas, 1 au sommet
      const courbe = cx + Math.pow(u, 2.2) * (sommet[0] - cx);          // l'axe se plie vers le sommet
      const demi = (P.rx + 2 * k) * (1 - u) * (1 - u * 0.2) + 1.2 * k;
      const nx = (x + 0.5 - courbe) / demi;
      return Math.abs(nx) <= 1 ? [nx * 0.9, -0.25, Math.sqrt(1 - nx * nx * 0.8)] : null;
    }, { decalage: 0.05, motif: (x, y) => ((Math.floor(x / k) * 5 + Math.floor(y / k) * 7) % 29 === 0 ? 0.8 : 0) });
    t.forme('chapeau', (x, y) => { const d = Math.abs(x + 0.5 - cx); const onde = Math.round(Math.sin(d / (2.2 * k)) * 0.8 * k); return y >= haut - 0.5 * k + onde && y <= haut + 1.5 * k + onde && d < P.rx + 7 * k - Math.max(0, d - P.rx) * 0.1 ? [0, -0.6, 0.7] : null; }, { decalage: -0.2 });
    for (let x = Math.round(cx - P.rx - 1 * k); x <= cx + P.rx + 1 * k; x++) for (let e = 0; e < k; e++) t.poser(x, haut - 2 * k + e, 'cuir', 2 + e);
    t.forme('or', ellipsoide(X(0, P.rx), haut - 1.5 * k, 1.4 * k, 1.4 * k), { decalage: 0.5, ombre: false });
  }
  if (costume === 'garde') {
    // Le casque conique à nasal
    t.forme('metal', (x, y) => { const n = ellipsoide(cx, cy - 1 * k, P.rx + 1 * k, P.ry + 1 * k)(x, y); return n && y <= cy - 2 * k ? n : null; }, { decalage: 0.2 });
    t.forme('metal', ellipsoide(cx, cy - P.ry - 1 * k, 1.5 * k, 2.5 * k), { decalage: 0.1 });
    if (!dos) for (let y = cy - 2 * k; y <= cy + 3 * k; y++) for (let e = 0; e < k; e++) t.poser(Math.round(X(0, P.rx)) - (k - 1) + e - Math.round(s * k), y, 'metal', 4);
  } else if (costume === 'banquier') {
    // Le haut-de-forme, et son ruban d'or
    const haut = cy - P.ry;
    t.forme('chapeau', (x, y) => (y >= haut - 10 * k && y <= haut + 1 * k && Math.abs(x + 0.5 - X(0, -1 * k)) < 6 * k ? [(x + 0.5 - cx) / (7 * k), -0.2, 0.8] : null));
    t.forme('chapeau', (x, y) => (y >= haut && y <= haut + 1.5 * k && Math.abs(x + 0.5 - cx) < P.rx + 2 * k ? [0, -0.5, 0.8] : null), { decalage: -0.2 });
    for (let x = Math.round(cx - 6 * k); x <= cx + 6 * k; x++) for (let e = 0; e < k; e++) t.poser(x, haut - 2 * k + e, 'or', 3 + e);
    if (race === 'nain' && !dos) for (let a = 0; a < 6.3; a += 0.2) t.poser(Math.round(X(P.rx * 0.46, P.rx * 0.78) + Math.cos(a) * 2.8 * k), Math.round(ey + 0.3 * k + Math.sin(a) * 3 * k), 'or', 4); // le monocle
  } else if (costume === 'noble') {
    // Le chapeau de velours à large bord, sa broche d'or, sa longue plume blanche
    const haut = cy - P.ry;
    t.forme('chapeau', (x, y) => (y >= haut - 7 * k && y <= haut + 1 * k && Math.abs(x + 0.5 - X(0, -1 * k)) < 7 * k - (haut - y) * 0.15 ? [(x + 0.5 - cx) / (8 * k), -0.3, 0.8] : null));
    t.forme('chapeau', (x, y) => (y >= haut - 1 * k && y <= haut + 1.5 * k && Math.abs(x + 0.5 - cx) < P.rx + 3 * k ? [0, (y - haut) * 0.3, 0.8] : null), { decalage: -0.1 });
    for (let j = 0; j < 11 * k; j++) { const px = Math.round(X(4 * k, P.rx * 0.5)) + j, py = haut - 3 * k - Math.round(Math.sin(j / (11 * k)) * 4 * k) - Math.floor(j / (3 * k)); t.poser(px, py, 'plume', 4 + (j % 2)); t.poser(px, py + 1, 'plume', 3); }
    t.forme('or', ellipsoide(X(3 * k, P.rx * 0.6), haut - 1 * k, 1.2 * k, 1.2 * k), { decalage: 0.5, ombre: false });
  } else if (costume === 'colporteur') {
    // Le chapeau mou à large bord, et sa plume
    const haut = cy - P.ry;
    t.forme('chapeau', (x, y) => (y >= haut - 6 * k && y <= haut + 1 * k && Math.abs(x + 0.5 - X(0, -0.5 * k) - (haut - y) * 0.15) < 6 * k - (haut - y) * 0.3 ? [(x + 0.5 - cx) / (7 * k), -0.2, 0.8] : null), { motif: (x, y) => (y === Math.round(haut - 2 * k) ? -0.9 : 0) });
    t.forme('chapeau', (x, y) => { const d = Math.abs(x + 0.5 - cx); return y >= haut - 0.5 * k + Math.round(d / (6 * k)) * 0 && y <= haut + 1.5 * k + Math.round(Math.max(0, d - P.rx) * 0.3) && d < P.rx + 5 * k ? [0, (y - haut) * 0.3, 0.8] : null; }, { decalage: -0.1 });
    for (let j = 0; j < 7 * k; j++) { const px = Math.round(X(4 * k, P.rx * 0.4)) + j, py = haut - 3 * k - Math.round(j * 0.6); t.poser(px, py, 'plume', 4 + (j % 2)); t.poser(px, py + 1, 'plume', 3); }
  } else if (costume === 'mendiant' || gobelin) {
    // Une capuche râpée, qui encadre le visage
    t.forme('cape', (x, y) => { const n = ellipsoide(X(0, -0.5 * k), cy - 1 * k, P.rx + 1.5 * k, P.ry + 1.8 * k)(x, y); if (!n) return null; const fz = n[0] * s + n[2] * c; return (y < cy - 3 * k || fz < (gobelin ? 0.25 : 0.4)) && y < yT + 3 * k ? n : null; }, { decalage: -0.3, motif: costume === 'mendiant' ? (x, y) => (hachage(Math.floor(x / k), Math.floor(y / k), 31) > 0.9 ? -1 : 0) : null });
  } else if (costume === 'mentor') {
    // Rien sur la tête : Garrick a sa tignasse grise
  }
  // L'écuelle tendue du mendiant
  if (costume === 'mendiant' && !dos) { const mx = X(pres * (ep + 0.6 * k), 2.5 * k); t.forme('metal', ellipsoide(mx, yB + 0.5 * k, 3.2 * k, 1.6 * k), { decalage: -0.2 }); t.poser(Math.round(mx), Math.round(yB - 0.5 * k), 'or', 4); t.poser(Math.round(mx) + 1, Math.round(yB - 0.5 * k), 'or', 5); }
  // --- 6. De dos : la cape par-dessus tout ---
  if (capee && dos) dessinerCape(true);

  contourEpais(t, k - 1);
  // Où sont les mains (depuis le sol), pour y accrocher le baluchon
  t.mains = H - (leves ? cy - P.ry - 7 * k : yB + 2.5 * k);
  return t;
}
