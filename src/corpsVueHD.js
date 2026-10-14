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

// Les traits des peuples de l'ombre et du panda : une peau fixe, des oreilles, un museau, des
// crocs, des bandelettes, de la fourrure... (tout ce qui change par rapport aux cinq peuples)
const TRAITS_PEUPLES = {
  // Le gobelin : petit, vicieux, des yeux jaunes fendus, un nez crochu, un sourire plein de dents pointues
  gobelin: { peau: 0x6a9a3a, yeux: 0xe8c020, fente: true, oreilles: 'grandes', dents: 'gobelin', nez: 1.7, cheveux: false, sourire: true },
  // L'orc : mâchoire carrée, de petites défenses d'ivoire qui sortent du fond des mâchoires, une crête
  orc: { peau: 0x5a7a3a, yeux: 0xd84020, oreilles: 'pointues', dents: 'defenses', nez: 1.4, carre: true, sourcil: 1.4, cheveux: 'crete' },
  // Le loup-garou : gris, un long museau clair, des oreilles de loup, des touffes aux joues, une collerette de poils
  loupgarou: { peau: 0x7c7c84, yeux: 0xf0c020, fente: true, oreilles: 'loup', museau: 0xb4b4b8, truffe: true, dents: 'crocs', fourrure: 31, queue: true, cheveux: false, griffes: true, jambes: 'peau', pattes: 'peau', touffes: true, collerette: true, touffu: 1 },
  // Le vampire : pâle, yeux rouges, canines, cape sombre, cheveux plaqués
  vampire: { peau: 0xe0d8e8, yeux: 0xc02020, fente: true, oreilles: 'pointues', dents: 'canines', nez: 0.9, cape: 0x3a0a14, cheveux: 'plaque', levres: 0x6a2030 },
  // La momie : enroulée de bandelettes de la tête aux pieds, deux lueurs dans la fente des yeux
  momie: { peau: 0x5a4a3a, yeux: 0xd8f070, oreilles: null, bandelettes: 0xcfc6a6, cheveux: false, nez: 0.8 },
  // Le troll des montagnes : une énorme tête, un nez immense qui pend, des cheveux hirsutes et de la
  // mousse, de longs bras d'orang-outan, de grands pieds nus griffus (pas de défenses)
  troll: { peau: 0x8a8274, yeux: 0x6a4a20, oreilles: 'pointues', nez: 3.2, nezBas: true, sourcil: 1.8, cheveux: 'hirsute', poils: 0x5a5248, mousse: 0x5a6a2a, fourrure: 47, brasLongs: true, grandesMains: true, griffes: true, jambes: 'peau', pattes: 'peau', touffu: 1, sourire: true },
  // Le panda : gros et touffu, des pattes noires, les taches autour des yeux
  panda: { peau: 0xf0ece4, yeux: 0x2a1a10, oreilles: 'rondes', museau: 0xf0ece4, truffe: true, taches: 0x201c1c, fourrure: 53, cheveux: false, nez: 0, bas: 0x24201e, jambes: 'noir', pattes: 'noir', mains: 'noir', touffu: 2 },
};
// Les Bannis ont l'air fâché tant qu'ils ne te connaissent pas (le joueur est du côté de la lumière
// au départ) ; une fois amis, ou quand ton comptoir penche franchement vers l'ombre, leur visage s'adoucit.
function banniFache(personne) {
  if (!personne || typeof PEUPLES_OMBRE === 'undefined' || !PEUPLES_OMBRE.includes(personne.race)) return false;
  const G = typeof window !== 'undefined' && window.GAME;
  if (!G || !personne.nom) return true;
  const ami = ((G.relations || {})[personne.nom] || 0) >= 8;
  return !(ami || (typeof palierCamp === 'function' && palierCamp(G) <= -2));
}

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

// `options.tenue` : les accessoires portés par le joueur (garde-robe) ; `options.bouche` : sa bouche de création.
function dessinerCorpsVue(g, tenue = 1, costume = null, pas = 0, pose = null, vue = 'troisQuarts', options = {}) {
  const k = FINESSE;
  g = { ...g };
  const race = PROPORTIONS[g.race] ? g.race : 'humain';
  const P0 = PROPORTIONS[race];
  const P = { H: P0.H * k, ep: P0.ep * k, torse: P0.torse * k, rx: P0.rx * k, ry: P0.ry * k, membre: P0.membre || 1 };
  const th = ANGLES_VUE[vue] ?? ANGLES_VUE.troisQuarts;
  const c = Math.cos(th), s = Math.sin(th);
  const dos = vue === 'dos';
  const L = 52 * k;
  const coiffe = (race === 'magicienne' ? 14 : race === 'nain' ? 4 : costume === 'banquier' ? 10 : costume === 'noble' || costume === 'colporteur' ? 8 : costume === 'garde' ? 2 : costume === 'joueur' && (options.tenue || []).includes('chapeau') ? 7 : 0) * k + (pose === 'leves' ? 12 * k : 0);
  const H = P.H + coiffe;
  const t = new ToileHD(L, H);
  t.relief = true;
  t.cel = true;
  const cx = L / 2;
  const f = g.feminin;
  const T = TRAITS_PEUPLES[race] || {};
  if (T.cheveux !== undefined) g = { ...g, coiffure: T.cheveux === 'plaque' ? 'court' : 'chauve', barbe: T.barbe || null };   // (pas de cheveux longs derrière)
  const gobelin = costume === 'gobelin' || race === 'gobelin';
  const leves = pose === 'leves';
  const joueur = costume === 'joueur';
  const porte = id => joueur && (options.tenue || []).includes(id);
  t.rampes.peau = T.peau ? rampeVive(T.peau) : gobelin ? rampeVive(0x6a9a3a) : PEAUX_VIVES[g.peau ?? 1] || PEAUX_VIVES[1];
  t.rampes.ivoire = rampe(0xe8dcb4); t.rampes.mousse = rampeVive(T.mousse || 0x5a6a2a); t.rampes.griffe = rampe(0x2a2420);
  if (T.poils) t.rampes.cheveux = rampeVive(T.poils);
  const fache = !!options.fache;
  t.rampes.museau = rampeVive(T.museau || 0x5a4030); t.rampes.noir = rampeVive(T.taches || 0x201c1c); t.rampes.bande = rampe(T.bandelettes || 0xd8cfae); t.rampes.truffe = rampe(0x1a1410);
  t.rampes.cheveux = rampeVive(g.cheveux);
  t.rampes.habit = rampeVive(g.habit);
  t.rampes.cape = rampeVive(T.cape || (race === 'elfe' ? 0x8aa0b8 : g.cape || 0x4a3a2a));
  t.rampes.iris = rampeVive(T.yeux || g.yeux || 0x4a3a20);
  t.rampes.lin = rampeVive(0xd8ccb0);
  t.rampes.bas = rampeVive(T.bas || g.bas || (race === 'elfe' ? 0x3a4a3a : race === 'hobbit' ? 0x8a6a40 : 0x5a4a3a));
  t.rampes.cuir = rampeVive(0x6a3f22);
  t.rampes.metal = rampeVive(0x7a8498);
  t.rampes.levres = levresPour(g.peau ?? 1, f);
  t.rampes.chapeau = rampeVive(race === 'magicienne' ? 0x3a2a8a : costume === 'banquier' ? 0x1a1a22 : costume === 'colporteur' ? 0x5a4630 : costume === 'noble' ? 0x4a1a3a : g.habit);
  t.rampes.plume = rampeVive(0xf0e8d0); t.rampes.fourrure = rampeVive(0xe8e0d0); t.rampes.osier = rampeVive(0xb08a48); t.rampes.foulard = rampeVive(0xc03a30); t.rampes.laine = rampeVive(0x8a3030);
  t.rampes.levres = T.levres ? rampeVive(T.levres) : gobelin ? rampeVive(f ? 0xb84a5a : 0x8a3a34) : t.rampes.levres;
  t.rampes.feutre = rampeVive(0x4a3a2a); t.rampes.capeV = rampeVive(0x5a2a2a); t.rampes.bruyere = rampeVive(0x6a3a22); t.rampes.ruban = rampeVive(0x9a2a3a); t.rampes.echarpe = rampeVive(0xc04040);
  t.rampes.blanc = rampeVive(0xf4f0ea);
  t.rampes.pupille = [0x060608, 0x0c0c12, 0x14141c, 0x1c1c26, 0x2a2a36, 0x3a3a48];

  const cy = Math.round(coiffe + 1 + P.ry);   // le centre de la tête (entier : les détails se posent pixel par pixel)
  const yT = Math.round(cy + P.ry - 1);       // le haut du torse
  const yB = Math.round(yT + P.torse);        // la taille
  const sol = H - 1;
  const ep = P.ep;                         // la demi-largeur d'épaules
  const prof = ep * 0.55;                  // la demi-épaisseur du torse
  const longue = race === 'magicienne';    // la robe descend jusqu'aux pieds
  const manteau = race === 'elfe' || costume === 'colporteur' || costume === 'mentor';   // la tunique descend à mi-cuisse
  const capee = (tenue >= 3 && !joueur) || ['mentor', 'colporteur', 'mendiant', 'noble', 'passeur'].includes(costume) || porte('cape') || !!T.cape;
  const aventurier = !costume || ['colporteur', 'mentor', 'mendiant'].includes(costume);
  if (joueur) tenue = 1;   // (le joueur a sa tenue à lui : manches simples, pas d'épaulières)

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
    // (les longs bras du troll, comme un orang-outan : les mains pendent presque aux genoux)
    const long = T.brasLongs && !leves;
    const coude = leves ? [cote * (ep + 2.5 * k), 1 * k, yT - 5 * k] : [cote * (ep + (long ? 2.2 : 1.2) * k), (-0.8 + bal * 1.5) * k, long ? yT + P.torse * 0.68 : yT + P.torse * 0.5];
    const main = leves ? [cote * 6.5 * k, 2 * k, cy - P.ry - 7 * k] : [cote * (ep + (long ? 2.2 : 0.6) * k), (1 + bal * 3.5) * k, long ? yB + (sol - yB) * 0.48 : yB + (1.5 - Math.abs(bal) * 0.5) * k];
    const E = [X(epaule[0], epaule[1]), epaule[2]], C = [X(coude[0], coude[1]), coude[2]], M = [X(main[0], main[1]), main[2]];
    const r = 2.6 * k * P.membre;
    const dec = devant ? 0 : -0.5;
    cylindre(t, matBras, E, C, r, { decalage: dec });
    // L'avant-bras : manche retroussée (novice), manche plus claire (aguerri), brassard de cuir (vétéran et plus)
    const matAvant = matBras === 'metal' ? 'metal' : tenue >= 2 && aventurier && race !== 'hobbit' && race !== 'elfe' ? 'cuir' : (tenue === 0 || race === 'hobbit') && aventurier ? 'peau' : matBras;
    cylindre(t, matAvant, C, M, r - 0.3 * k, { decalage: dec + (matAvant === matBras ? 0.4 : 0.15) });
    if (tenue >= 2 && aventurier && race !== 'hobbit' && race !== 'elfe') for (let j = 0; j < 2; j++) t.forme('cuir', (x, y) => (Math.abs(y - (C[1] + (M[1] - C[1]) * (0.35 + j * 0.3))) < 0.6 * k && Math.abs(x + 0.5 - (C[0] + (M[0] - C[0]) * (0.35 + j * 0.3))) < r ? [0, 0, 1] : null), { decalage: -0.9, bord: false, ombre: false }); // les lanières
    // La main : la paume et un pouce
    const matMain = T.mains || 'peau', gm = T.grandesMains ? 1.55 : 1;
    t.forme(matMain, ellipsoide(M[0], M[1] + 1 * k * gm, 2.2 * k * gm, 2.3 * k * gm), { decalage: dec + 0.1 });
    t.forme(matMain, ellipsoide(M[0] + cote * c * 1.6 * k * gm + s * 1.2 * k, M[1] + 0.6 * k, 0.9 * k * gm, 1.2 * k * gm), { decalage: dec + 0.3, ombre: false });
    if (T.griffes) for (const d of [-1, 0, 1]) for (let j = 0; j < Math.round(0.9 * k * gm); j++) t.poser(Math.round(M[0] + d * 1.1 * k * gm), Math.round(M[1] + 3.2 * k * gm) + j, 'griffe', j ? 2 : 4);
  };
  // Où passe la cuisse proche à l'écran, à une hauteur donnée (pour dessiner le pli du tissu dessus)
  const rCuisse = 2.9 * k * P.membre;
  const cuisseX = (y) => { const bal = pas ? pas : 0; const v = Math.min(1, Math.max(0, (y - (yB - 1 * k)) / ((sol - yB) * 0.5))); return X(pres * ep * (0.42 + 0.03 * v), (bal * 2.2 + (bal > 0 ? 1 : 0)) * k * v); };
  const motifCuisse = (x, y) => { const d = Math.abs(x + 0.5 - cuisseX(y)); return d < rCuisse * 0.75 ? 0.35 : d < rCuisse * 0.75 + 0.7 * k ? -0.9 : 0; };
  const jambe = (cote, devant) => {
    const bal = pas ? (cote === pres ? pas : -pas) : 0;   // la jambe qui avance
    const hanche = [cote * ep * 0.42, 0, yB - 1 * k];
    const genou = [cote * ep * 0.45, (bal * 2.2 + (bal > 0 ? 1 : 0)) * k, yB + (sol - yB) * 0.5];
    // Le pas : le pied avant reste posé au sol, c'est le talon arrière qui se décolle (à peine de
    // face, où l'on ne voit pas le pied partir en arrière)
    const leve = bal < 0 ? (Math.abs(s) < 0.3 ? 0.6 : 1.2) * k : 0;
    const pied = [cote * ep * 0.48, bal * 3.8 * k, sol - 3 * k - leve];
    const Hh = [X(hanche[0], hanche[1]), hanche[2]], G = [X(genou[0], genou[1]), genou[2]], Pd = [X(pied[0], pied[1]), pied[2]];
    const dec = devant ? 0 : -0.5;
    const r = 2.9 * k * P.membre;
    const matJambe = T.jambes || 'bas';
    cylindre(t, matJambe, Hh, G, r, { decalage: dec });
    const solPied = sol - leve;
    if (T.pattes) {
      // Des pattes : la jambe velue jusqu'au sol, un large pied nu (griffu chez le troll et le loup-garou)
      cylindre(t, matJambe, G, Pd, r - 0.2 * k, { decalage: dec + 0.2 });
      t.forme(T.pattes, ellipsoide(X(pied[0], pied[1] + 2 * k), solPied - 1.6 * k, (3.8 + Math.abs(s) * 1.6) * k * (T.grandesMains ? 1.2 : 1), 2.1 * k), { decalage: dec });
      if (T.griffes) for (const d of (Math.abs(s) > 0.5 ? [0, 1, 2] : [-1, 0, 1])) for (let e = 0; e < Math.max(1, Math.round(0.6 * k)); e++) t.poser(Math.round(X(pied[0] + (Math.abs(s) > 0.5 ? 0 : d * 1.3 * k), pied[1] + (Math.abs(s) > 0.5 ? (3.5 + d * 0.8) * k : 4 * k))) + e, Math.round(solPied - 1), 'griffe', 3);
    } else if (race === 'hobbit' || costume === 'mendiant') {
      cylindre(t, 'bas', G, Pd, r - 0.4 * k, { decalage: dec + 0.2, motif: costume === 'mendiant' ? (x, y) => (hachage(Math.floor(x / k), Math.floor(y / k), 77) > 0.85 ? -1.2 : 0) : null });
      // Les grands pieds nus et poilus
      t.forme('peau', ellipsoide(X(pied[0], pied[1] + 2 * k), solPied - 1.5 * k, (3.6 + Math.abs(s) * 1.2) * k, 2 * k), { decalage: dec });
      if (race === 'hobbit') for (let j = 0; j < 4; j++) t.poser(Math.round(X(pied[0], pied[1] + (1 + j * 0.7) * k)), Math.round(solPied - 3 * k - (j % 2)), 'cheveux', 2);
    } else {
      // La botte : la tige jusqu'au genou, le revers, le pied qui pointe vers l'avant. De face, le
      // bout de la botte vient vers nous : un peu plus large et plus clair (on le voit de dessus).
      cylindre(t, 'cuir', G, Pd, r - 0.2 * k, { decalage: dec + 0.1 });
      const bout = X(pied[0], pied[1] + 3.4 * k);
      const face = Math.max(0, 1 - Math.abs(s) / 0.7);   // (1 de face, 0 dès le trois-quarts)
      t.forme('cuir', (x, y) => {
        if (y < solPied - 3 * k || y > solPied) return null;
        const bas = (y - (solPied - 3 * k)) / (3 * k);   // 0 en haut du pied, 1 à la semelle
        const elargi = face * bas * 0.9 * k;
        if (Math.abs(x + 0.5 - (Pd[0] + bout) / 2) >= Math.abs(bout - Pd[0]) / 2 + r - 0.5 * k + elargi) return null;
        return [(x + 0.5 - Pd[0]) / (4 * k), face ? -0.5 + bas * 0.9 : (y - solPied + 1.5 * k) / (2 * k), 0.8];
      }, { decalage: dec + face * 0.3 });
      t.forme('cuir', (x, y) => (y >= G[1] + 1 && y <= G[1] + 1.5 * k && Math.abs(x + 0.5 - G[0]) < r + 0.3 * k ? [0, -0.6, 0.7] : null), { decalage: 0.6, bord: false, ombre: false });
    }
  };

  // --- 1. Derrière : la cape (sauf de dos), les cheveux longs, le bras et la jambe du côté éloigné ---
  const dessinerCape = (devant) => {
    t.forme(porte('cape') ? 'capeV' : 'cape', (x, y) => {
      if (y < yT + 1 * k || y > sol - 4 * k) return null;
      if (costume === 'mendiant' && y > sol - 12 * k && hachage(Math.floor(x / k), 0, 77) * 10 * k > sol - y) return null; // le bas en lambeaux
      const demi = (ep + 1.5 * k + (y - yT) * 0.12) * (devant ? 1 : Math.max(0.55, c) + 0.1);
      const centre = devant ? cx : X(0, -prof * 0.9);
      const nx = (x + 0.5 - centre) / demi;
      return Math.abs(nx) <= 1 ? [nx * 0.6, 0.1, 0.8] : null;
    }, { decalage: -0.9, motif: (x) => (Math.floor(x / k) % 5 === 0 ? -0.5 : 0) });
    // Le liséré d'or de la cape des elfes et des légendes
    if (race === 'elfe' || (tenue >= 4 && race !== 'hobbit')) {
      const bord = [];
      for (let y = yT + 1 * k; y <= sol - 4 * k; y++) for (let x = 0; x < L; x++) if (t.mat(x, y) === 'cape' && (t.mat(x - 1, y) !== 'cape' || t.mat(x + 1, y) !== 'cape' || y === sol - 4 * k)) bord.push([x, y]);
      for (const [x, y] of bord) t.poser(x, y, 'or', 3);
    }
  };
  // La hotte d'osier du colporteur, derrière tout : plus large que lui, une couverture roulée dessus
  if (costume === 'colporteur' && !dos) {
    const hx = X(0, -prof * 1.3);
    t.forme('osier', (x, y) => (y >= yT - 12 * k && y <= yB + 7 * k && Math.abs(x + 0.5 - hx) < section(ep + 7 * k, prof * 0.9) - Math.max(0, yT - 8 * k - y) * 0.8 ? [(x + 0.5 - hx) / (ep + 7 * k) * 0.8, 0, 0.7] : null),
      { motif: (x, y) => ((Math.floor(x / k) + Math.floor(y / k)) % 3 === 0 ? -0.7 : (Math.floor(x / k) - Math.floor(y / k)) % 3 === 0 ? 0.5 : 0) });
    t.forme('laine', ellipsoide(hx, yT - 13 * k, section(ep + 5 * k, prof), 3 * k), { motif: (x) => (Math.floor(x / k) % 4 === 0 ? -0.6 : 0) });
  }
  // La queue touffue du loup-garou, qui part des reins et retombe derrière la jambe éloignée
  if (T.queue && (s > 0.3 || dos)) {
    const qx0 = dos ? cx : X(0, -prof * 0.9);
    t.forme('peau', (x, y) => { if (y < yB - 1 * k || y > sol - 6 * k) return null; const u = (y - yB) / (sol - 6 * k - yB); const qx = qx0 + (dos ? 0 : -s * (2 + u * 8) * k) + Math.sin(u * 3) * 1.5 * k; const demi = (1.6 + Math.sin(u * Math.PI) * 1.6) * k; const nx = (x + 0.5 - qx) / demi; return Math.abs(nx) <= 1 ? [nx * 0.7, 0.1, 0.8] : null; }, { decalage: -0.5, motif: MECHES });
  }
  if (capee && !dos) dessinerCape(false);
  // Le bâton noueux du mendiant, dans son dos
  if (costume === 'mendiant' && !dos) { const bx0 = X(ep + 3 * k, -1 * k); for (let y = yT - 6 * k; y < sol; y++) for (let e = 0; e < k; e++) t.poser(Math.round(bx0 + Math.sin(y / (6 * k)) * 0.6 * k) + e, y, 'cuir', Math.floor(y / k) % 6 === 0 ? 1 : 3); }
  const longs = ['long', 'queue', 'chignon'].includes(g.coiffure) || race === 'elfe' || race === 'magicienne';
  if (longs && !dos) {
    const bas = g.coiffure === 'chignon' ? cy + 4 * k : race === 'elfe' || race === 'magicienne' ? yT + 10 * k : yT + 4 * k;
    const larg = P.rx + 1.2 * k - s * 2.5 * k;   // (de profil, la masse des cheveux tombe dans le dos, plus étroite)
    t.forme('cheveux', (x, y) => { const cc = X(0, -P.rx * (0.4 + s * 0.25)); return y >= cy - 4 * k && y <= bas && Math.abs(x + 0.5 - cc) < larg - Math.max(0, y - bas + 6 * k) * 0.5 ? [(x + 0.5 - cc) / (P.rx + 2 * k), 0, 0.8] : null; }, { decalage: -0.8, motif: MECHES });
  }
  const deFace = Math.abs(c) > 0.9;   // (de face, les deux côtés sont éclairés pareil)
  if (!dos) { bras(loin, deFace); if (!longue) { jambe(loin, deFace); jambe(pres, true); } } else { bras(pres, deFace); if (!longue) { jambe(pres, deFace); jambe(loin, true); } }

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
  if (costume === 'garde' && !dos) {
    // Le tabard bleu de la Confrérie, son soleil d'or, et le pan qui tombe devant les cuisses
    const larg = ep * 0.62 * Math.max(0.55, Math.abs(c));
    t.forme('habit', (x, y) => { const n = torse(x, y); return (n || (y > yB - 2 * k && y < yB + 6 * k)) && y >= yT + 2 * k && Math.abs(x + 0.5 - X(0, prof)) < larg ? (n || [0, 0.2, 0.9]) : null; }, { decalage: 0.05 });
    const sx = X(0, prof), sy = yT + P.torse * 0.42;
    t.forme('or', ellipsoide(sx, sy, 1.6 * k * Math.max(0.6, Math.abs(c)), 1.6 * k), { decalage: 0.3, ombre: false });
    for (const [dx, dy] of [[0, -2.8], [0, 2.8], [-2.6, 0], [2.6, 0], [-2, -2], [2, -2], [-2, 2], [2, 2]]) t.poser(Math.round(sx + dx * k * Math.max(0.6, Math.abs(c))), Math.round(sy + dy * k), 'or', 4);
    for (let x = Math.round(X(0, prof) - larg); x <= X(0, prof) + larg; x++) t.poser(x, Math.round(yB + 6 * k) - 1, 'or', 3);
  }
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
  // Le tablier de marchand du joueur : la bavette, la poche et son crayon, les bretelles, le cordon noué
  if (joueur && !dos) {
    const tab = (x, y) => { if (y < yT + 7 * k || y > yB + 6 * k) return null; const cxx = X(0, prof * 0.7); const demi = section((6.5 + (y - yT - 7 * k) / k * 0.12) * k, prof * 0.95) * 0.95; const nx = (x + 0.5 - cxx) / demi; return Math.abs(nx) > 1 || !torse(x, y) && y <= yB + 2 * k ? null : [nx * 0.7, 0, 0.9]; };
    t.forme('lin', tab, { decalage: -0.1, motif: (x, y) => (y === yT + 7 * k || y === yB + 5 * k ? -0.8 : 0) });
    const px = X(-2 * k, prof);
    t.forme('lin', (x, y) => (y >= yB - 4 * k && y <= yB && Math.abs(x + 0.5 - px) < 2.5 * k * Math.max(0.4, Math.abs(c)) ? [0, 0.3, 0.9] : null), { decalage: -0.9 });
    for (let e = 0; e < k; e++) { t.poser(Math.round(px) + e, yB - 4 * k - 1, 'or', 4); t.poser(Math.round(px) + e, yB - 4 * k - 2, 'or', 3); }
    for (const cote of [-1, 1]) for (let y = yT; y < yT + 8 * k; y++) for (let e = 0; e < k; e++) { const x = Math.round(X(cote * (4 * k + (y - yT) * 0.3), prof * 0.9)) + e; if (t.mat(x, y)) t.poser(x, y, 'lin', 3); }
    t.forme('lin', (x, y) => (y >= yB - 2 * k && y <= yB - 1 && torse(x, y) ? [0, 0.2, 0.9] : null), { decalage: -0.6, ombre: false });
    const nx0 = Math.round(X(5 * k, prof * 0.9));
    for (const [i, j] of [[0, 0], [1, 0], [2, 1], [3, 1], [1, 2], [3, 2]]) for (let e = 0; e < k; e++) t.poser(nx0 + i * k + e, yB - 2 * k + j * k, 'lin', 2);
    // Le pan du tablier retombe par-dessus les cuisses : on le redessine après la jambe proche,
    // avec le tissu soulevé par la cuisse (plus clair) et un pli sombre le long de la jambe
    t.forme('lin', (x, y) => (y > yB + 1 * k && y <= yB + 6 * k ? tab(x, y) : null), { decalage: -0.1, motif: (x, y) => (y === yB + 5 * k ? -0.8 : motifCuisse(x, y)) });
  }
  // L'ourlet de la tunique retombe sur les cuisses : le tissu est tendu sur la cuisse proche (plus
  // clair), et fait un pli de chaque côté
  if (!dos && !longue && !joueur) t.forme('habit', (x, y) => (y > yB && t.mat(x, y) === 'habit' ? torse(x, y) : null), { bord: false, ombre: false, motif: motifCuisse });
  // L'écharpe de laine, la chaîne de montre, la bague
  if (porte('echarpe') && !dos) {
    t.forme('echarpe', (x, y) => (y >= yT - 2 * k && y <= yT + 2 * k && Math.abs(x + 0.5 - X(0, prof * 0.6)) < 5 * k * Math.max(0.4, Math.abs(c)) ? [(x + 0.5 - cx) / (5 * k) * 0.5, 0, 0.9] : null), { motif: (x, y) => (Math.floor(y / k) % 2 ? 0.5 : -0.2) });
    t.forme('echarpe', (x, y) => (y >= yT + 2 * k && y <= yT + 10 * k && Math.abs(x + 0.5 - X(3 * k, prof)) < 1.3 * k ? [0.3, 0, 0.9] : null), { motif: (x, y) => (Math.floor(y / k) % 3 === 0 ? 0.6 : 0) });
  }
  if (porte('montre') && !dos) { for (let j = 0; j < 7 * k; j++) t.poser(Math.round(X(-4 * k + j, prof)), yB - 2 * k + Math.round(j / (3 * k)), 'or', j % 2 ? 4 : 3); t.forme('or', ellipsoide(X(4 * k, prof), yB + 1 * k, 1.6 * k, 1.6 * k), { decalage: 0.5, ombre: false }); }
  // La capuche et le col de fourrure du noble
  if (costume === 'noble') t.forme('fourrure', (x, y) => (y >= yT - 1 * k && y <= yT + 4 * k && torse(x, y) ? [(x + 0.5 - cx) / ep, -0.3, 0.8] : null), { motif: (x, y) => ((Math.floor(x / k) + Math.floor(y / k)) % 2 ? 0.5 : -0.3) });
  if (longue) for (let y = yB + 4 * k; y < sol; y += 5 * k) for (let x = cx - 8 * k; x < cx + 9 * k; x += 6 * k) if (t.mat(x + (y % 2), y) === 'habit') { t.poser(x + (y % 2), y, 'or', 4); t.poser(x + (y % 2) + 1, y, 'or', 5); } // les étoiles
  // --- Les habits des aventuriers, selon le niveau ---
  // Le gilet de cuir lacé de l'aguerri ; le gilet clouté du vétéran ; la cotte de mailles du héros ;
  // le plastron liséré d'or de la légende ; une épée au côté à partir du héros
  const devantTorse = (x, y) => torse(x, y) && !dos && y >= yT + 2 * k && y <= yB - 2 * k && Math.abs(x + 0.5 - X(0, prof)) < section(ep - 1.6 * k, prof) * 0.9;
  if (aventurier && !longue && race !== 'nain' && race !== 'hobbit' && race !== 'elfe') {
    // L'humain : simple au début (tunique, puis sacoche), le gilet lacé au vétéran, la cotte de
    // mailles au héros, le plastron liséré d'or à la légende
    if (tenue === 2) {
      t.forme('cuir', (x, y) => (devantTorse(x, y) ? [(x + 0.5 - X(0, prof)) / ep, -0.1, 0.9] : null), { decalage: -0.1 });
      for (let y = yT + 4 * k; y < yB - 3 * k; y += 2 * k) for (const d of [-1, 1]) { const x = Math.round(X(d * 1.2 * k, prof)); if (t.mat(x, y) === 'cuir') { t.poser(x, y, 'lin', 4); t.poser(x, y + 1, 'lin', 3); } }
    } else if (tenue === 3) {
      t.forme('metal', (x, y) => (devantTorse(x, y) ? [(x + 0.5 - X(0, prof)) / ep, -0.1, 0.9] : null), { decalage: -0.3, motif: (x, y) => ((Math.floor(x / k) + Math.floor(y / k)) % 2 ? 0.35 : -0.35) });
    } else if (tenue === 4) {
      t.forme('metal', (x, y) => (devantTorse(x, y) ? [(x + 0.5 - X(0, prof)) / ep, -0.1, 0.9] : null), { decalage: 0.1 });
      const bords = []; for (let y = yT + 2 * k; y <= yB - 2 * k; y++) for (let x = 0; x < L; x++) if (t.mat(x, y) === 'metal' && devantTorse(x, y) && (!devantTorse(x - 1, y) || !devantTorse(x + 1, y) || !devantTorse(x, y - 1) || !devantTorse(x, y + 1))) bords.push([x, y]);
      for (const [x, y] of bords) t.poser(x, y, 'or', 4); // le liséré d'or
      t.forme('or', ellipsoide(X(0, prof), yT + 7 * k, 1.6 * k, 1.6 * k), { decalage: 0.5, ombre: false });
    }
  }
  if (aventurier && race === 'elfe') {
    // L'elfe : une tunique ajustée aux filigranes d'or (jamais de cuir grossier), puis une cuirasse
    // légère d'argent gravée d'or au héros, blanche et or à la légende ; une longue cape claire
    if (tenue >= 3) {
      t.rampes.argent = rampeVive(tenue >= 4 ? 0xe8e4d8 : 0xb8c4d4);
      t.forme('argent', (x, y) => (devantTorse(x, y) ? [(x + 0.5 - X(0, prof)) / ep, -0.1, 0.9] : null), { decalage: 0.1 });
    }
    if (!dos) for (let y = yT + 3 * k; y < yB - 2 * k; y++) {
      // Les filigranes : deux volutes d'or qui ondulent de part et d'autre du col
      const onde = Math.sin((y - yT) / (3 * k)) * 1.3 * k;
      for (const d of [-1, 1]) { const x = Math.round(X(d * (2.2 * k + onde), prof * 0.98)); if (t.mat(x, y) === 'habit' || t.mat(x, y) === 'argent') t.poser(x, y, 'or', (Math.floor(y / k) % 3 === 0) ? 5 : 4); }
      if (tenue >= 1 && Math.floor(y / k) % 4 === 0) for (const d of [-1, 1]) { const x = Math.round(X(d * (4.5 * k + onde * 0.5), prof * 0.95)); if (t.mat(x, y) === 'habit' || t.mat(x, y) === 'argent') t.poser(x, y, 'or', 3); }
    }
    t.forme('or', (x, y) => (y >= yB - 2 * k && y <= yB - 1 && torse(x, y) ? [0, 0, 0.9] : null), { decalage: 0.1, ombre: false }); // une fine ceinture d'or
    if (!dos) {
      // Une vigne d'or qui monte au milieu de la tunique, avec ses feuilles ; une broche-feuille à
      // pierre au col ; des galons d'or à l'ourlet et aux poignets
      const vx = y => Math.round(X(Math.sin((y - yT) / (2.5 * k)) * 0.8 * k, prof));
      for (let y = yT + 4 * k; y < yB - 3 * k; y++) for (let e = 0; e < k; e++) { const x = vx(y) + e; if (t.mat(x, y) && t.mat(x, y) !== 'peau') t.poser(x, y, 'or', e ? 3 : 5); }
      for (let y = yT + 5 * k; y < yB - 4 * k; y += 3 * k) for (const d of [-1, 1]) for (let j = 1; j <= 2.5 * k; j++) for (let e = 0; e < k; e++) { const x = vx(y) + d * j + (d > 0 ? k - 1 : 0), yy = y - Math.round(j * 0.6) + e; if (t.mat(x, yy) && t.mat(x, yy) !== 'peau') t.poser(x, yy, 'or', j > k ? 3 : 5); }
      t.forme('or', ellipsoide(X(0, prof), yT + 2.2 * k, 2.2 * k, 1.5 * k), { decalage: 0.4, ombre: false });
      t.forme('iris', ellipsoide(X(0, prof), yT + 2.2 * k, 0.9 * k, 0.9 * k), { decalage: 0.6, ombre: false, bord: false });
      const bas = yB + Math.round((sol - yB) * 0.55);
      for (let y = bas - 1 * k; y <= bas; y++) for (let x = 0; x < L; x++) if (t.mat(x, y) === 'habit') t.poser(x, y, 'or', 3 + (y === bas ? 0 : 1));
    }
  }
  if (aventurier && race === 'hobbit') {
    // Le hobbit : du lin et de la laine, un ourlet effiloché, des pièces cousues ; jamais de métal.
    // Avec le niveau : une sacoche, une écharpe de laine, une cape de laine à capuche, un gilet brodé
    for (let y = yB; y <= yB + 2 * k; y++) for (let x = 0; x < L; x++) if ((t.mat(x, y) === 'lin' || t.mat(x, y) === 'habit') && hachage(Math.floor(x / k), Math.floor(y / k), 23) > 0.55 + (y - yB) * 0.1) t.poser(x, y, t.mat(x, y), 1);
    for (let y = yB + 1 * k; y <= yB + 2 * k; y++) for (let x = 0; x < L; x++) if ((t.mat(x, y) === 'lin' || t.mat(x, y) === 'habit') && hachage(Math.floor(x / k), 0, 29) > 0.7) { t.c[y * L + x] = null; t.m[y * L + x] = null; }
    if (tenue <= 1) for (const [du, dy] of [[-3, 7], [2, 12]]) for (let i = 0; i < 3 * k; i++) for (let j = 0; j < 2 * k; j++) { const x = Math.round(X(du * k, prof * 0.8)) + i, y = yT + dy * k + j; if (t.mat(x, y) === 'habit' || t.mat(x, y) === 'lin') t.poser(x, y, 'habit', (i === 0 || j === 0 || i === 3 * k - 1) ? 1 : 2); }
    if (tenue >= 2 && !dos) t.forme('laine', (x, y) => (y >= yT - 1 * k && y <= yT + 2 * k && torse(x, y) ? [0, 0, 0.9] : null), { decalage: -0.1, motif: (x, y) => (Math.floor(y / k) % 2 ? 0.5 : -0.3) });
    if (tenue >= 4 && !dos) for (let y = yT + 3 * k; y < yB - 3 * k; y += 2 * k) for (const d of [-2.5, 2.5]) { const x = Math.round(X(d * k, prof)); if (t.mat(x, y) === 'habit') { t.poser(x, y, 'or', 4); t.poser(x + 1, y + 1, 'or', 3); } }
  }
  if (longue && !dos) {
    // La robe de la magicienne : des plis qui tombent, et une légère tache près de l'ourlet
    for (const d of [-5, -2, 2, 5]) for (let y = yB + 2 * k; y < sol - 1 * k; y++) { const x = Math.round(X(d * k + Math.sin((y - yB) / (9 * k)) * 0.8 * k * Math.sign(d), prof * 0.9 + (y - yB) * 0.1)); if (t.mat(x, y) === 'habit' && t.teinte(x, y) >= 3) t.poser(x, y, 'habit', 1); }
    for (let y = sol - 6 * k; y < sol - 1 * k; y++) for (let x = 0; x < L; x++) if (t.mat(x, y) === 'habit' && hachage(Math.floor(x / k), Math.floor(y / k), 53) > 0.82 && Math.abs(x + 0.5 - X(3 * k, prof)) < 3 * k) t.poser(x, y, 'habit', 2);
  }
  // L'épée au côté (héros et légende) : le fourreau pend à la hanche gauche
  if (aventurier && tenue >= 3 && !longue) {
    const ex = X(-ep * 0.9, 0.2 * k);
    if (Z(-ep * 0.9, 0.2 * k) > -prof) {
      for (let j = 0; j < 14 * k; j++) for (let e = 0; e < Math.round(1.4 * k); e++) t.poser(Math.round(ex - j * 0.08 * k) + e, yB + j, 'cuir', j % (3 * k) === 0 ? 1 : 3);
      t.forme(tenue >= 4 ? 'or' : 'metal', ellipsoide(ex + 0.7 * k, yB - 1 * k, 2.2 * k, 0.9 * k), { decalage: 0.4, ombre: false });   // la garde
      for (let j = 0; j < 3 * k; j++) t.poser(Math.round(ex + 0.5 * k), yB - 1.5 * k - j, 'cuir', 2); t.poser(Math.round(ex + 0.5 * k), yB - 1.5 * k - 3 * k, tenue >= 4 ? 'or' : 'metal', 5); // la poignée et le pommeau
    }
  }
  // La grosse boucle de ceinture du nain, les bretelles du hobbit
  if (race === 'nain' && !dos && Z(0, prof) > 0) t.forme('or', (x, y) => (y >= yB - 3 * k && y <= yB && Math.abs(x + 0.5 - X(0, prof)) < 2.4 * k ? [(x + 0.5 - X(0, prof)) / (2.4 * k), 0, 0.9] : null), { decalage: 0.3, ombre: false });
  if (race === 'hobbit' && !dos) for (const d of [-1, 1]) for (let y = yT + 1 * k; y < yB - 2 * k; y++) for (let e = 0; e < k; e++) { const x = Math.round(X(d * (3 + (y - yT) / P.torse * 1.5) * k, prof)) + e; if (t.mat(x, y) === 'lin') t.poser(x, y, 'cuir', 3); }
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
  if (tenue >= 2 && race !== 'hobbit' && !(race === 'elfe' && tenue < 3) && (aventurier || costume === 'noble')) for (const cote of [loin, pres]) {
    const ex = X(cote * (ep - 0.8 * k), 0.3 * k);
    if (Z(cote * (ep - 0.8 * k), 0.3 * k) < -prof * 0.9 && s > 0.5) continue;
    t.forme(tenue >= 3 ? 'metal' : 'cuir', ellipsoide(ex, yT + 2 * k, 3.4 * k * Math.max(0.6, Math.abs(c) + 0.3), 2.4 * k), { decalage: 0.3 });
    if (tenue >= 4) for (let j = -2 * k; j <= 2 * k; j++) t.poser(Math.round(ex + j), yT + 4 * k, 'or', 4);
  }

  // --- 3. Devant : le bras et la jambe du côté proche ---
  if (!dos) bras(pres, true); else bras(loin, true);

  if (porte('bague') && !dos) { const hx = X(pres * (ep + 0.6 * k), 1 * k); t.poser(Math.round(hx), Math.round(yB + 2.5 * k), 'or', 5); t.poser(Math.round(hx) + 1, Math.round(yB + 2.5 * k), 'or', 3); }
  // --- 4. Le cou, la tête, le visage ---
  t.forme('peau', (x, y) => (y >= yT - 3 * k && y <= yT + 1 * k && Math.abs(x + 0.5 - X(0, 0.5 * k)) < 2.4 * k ? [(x + 0.5 - X(0, 0.5 * k)) / (2.4 * k), 0.2, 0.9] : null), { decalage: -0.6 });
  // La forme de la tête : ronde (hobbit), large et basse avec une mâchoire lourde (nain),
  // étroite avec un menton fin (elfe) ou une mâchoire carrée (elfe homme), ovale (humain)
  const menton = race === 'elfe' && f ? 0.3 : race === 'humain' || race === 'magicienne' || race === 'vampire' ? 0.12 : race === 'nain' ? -0.05 : 0;
  const carre = (race === 'elfe' && !f) || !!T.carre;
  const profil = s > 0.9;
  // De profil : le crâne, puis le contour du visage qui avance (front, arcade, nez, lèvres, menton),
  // différent selon le peuple (nez rond du hobbit, gros nez du nain, nez droit et menton fin de l'elfe)
  const ey0 = Math.round(cy + 1 * k), by0 = ey0 + 5 * k;
  const bordProfil = (y) => {
    const u = y - ey0;                                   // par rapport aux yeux
    const nezH = (race === 'nain' ? 2.6 : race === 'hobbit' ? 1.5 : race === 'elfe' ? (f ? 1.4 : 2) : f ? 1.2 : 1.8) * k;   // (nez plus petit pour les femmes)
    const base = P.rx * 0.92;
    if (y < cy - P.ry) return null;
    if (u < -2.5 * k) return base * Math.sqrt(Math.max(0, 1 - ((y + 0.5 - cy) / P.ry) ** 2)) + 0.3 * k; // le front
    if (u < 0.5 * k) return base + 0.3 * k - (u + 2.5 * k) * 0.08;                    // l'arcade, le creux du nez
    if (u < 3.6 * k) { const v = (u - 0.5 * k) / (3.1 * k); return base + (race === 'hobbit' ? Math.sin(v * Math.PI) : race === 'elfe' ? v : Math.sin(v * Math.PI * 0.75)) * nezH; } // le nez
    const fin = f && race !== 'hobbit' ? 2.4 * k : 0;                                 // une mâchoire bien plus fine pour les femmes
    if (u < 4.2 * k) return base - 0.6 * k - fin * 0.6;                               // sous le nez
    if (u < by0 - ey0 + 1.6 * k) { const v = (y - by0 + 0.5 * k) / (2.1 * k); return base - 0.5 * k - fin + (v > 0 && v < 1 ? Math.sin(v * Math.PI) * 0.6 * k : 0); } // les lèvres
    if (f && race !== 'hobbit') return null;                                          // (pas de mâchoire sous les lèvres pour les femmes : le visage finit aux lèvres)
    const bas = cy + P.ry;
    if (y <= bas) { const v = (y - by0 - 1.6 * k) / Math.max(1, bas - by0 - 1.6 * k); return (base - 0.8 * k - fin) * (1 - v * v * (race === 'elfe' && f ? 0.85 : f && race !== 'hobbit' ? 0.85 : carre ? 0.35 : 0.55)); } // le menton
    return null;
  };
  const tete = (x, y) => {
    if (profil && !dos) {
      const dx = x + 0.5 - cx;
      const bord = bordProfil(y);
      const ny = (y + 0.5 - cy) / P.ry;
      if (f && race !== 'hobbit' && y > by0 + 1.6 * k) return null;   // (le visage s'arrête juste sous les lèvres)
      const rxP = P.rx * 0.95 * (f && race !== 'hobbit' && ny > 0.1 ? 1 - (ny - 0.1) * 0.45 : 1);   // (la mâchoire des femmes s'affine et recule)
      const nx0 = dx / rxP;
      const d = nx0 * nx0 + ny * ny;
      if (d <= 1) return [nx0 * 0.6, ny * 0.3, Math.sqrt(1 - d) * 0.8 + 0.3];
      if (bord !== null && dx >= 0 && dx < bord && Math.abs(ny) <= 1.05) return [0.5, ny * 0.2, 0.8];
      return null;
    }
    const ny = (y + 0.5 - cy) / P.ry;
    let w = ny > 0 ? 1 - menton * ny * ny : 1;
    if (carre && ny > 0.1) {
      // La mâchoire carrée : les côtés restent droits jusqu'aux angles de la mâchoire, puis
      // filent en biais vers un menton large et plat
      if (ny > 1) return null;
      const larg = ny < 0.68 ? 0.95 : 0.95 - (ny - 0.68) / 0.32 * 0.5;
      const nx = (x + 0.5 - cx) / (P.rx * larg);
      if (Math.abs(nx) > 1) return null;
      return [nx * 0.6, ny * 0.25, Math.sqrt(Math.max(0.1, 1 - nx * nx * 0.5)) * 0.8 + 0.3];
    }
    if (race === 'hobbit' && ny > -0.1 && ny < 0.75) w *= 1 + Math.sin((ny + 0.1) / 0.85 * Math.PI) * 0.08;
    const nx = (x + 0.5 - cx) / (P.rx * w);
    const d = nx * nx + ny * ny;
    if (d > 1) return null;
    // Un visage reste clair presque partout : la normale est aplatie, l'ombre franche vient des
    // formes dessinées exprès (côté tourné, dessous du menton, nez)
    return [nx * 0.6, ny * 0.3, Math.sqrt(1 - d) * 0.8 + 0.3];
  };
  const oreille = (cote) => {
    const u = cote * P.rx, z = -P.rx * 0.3;
    if (Z(u, z) < -P.rx * 0.35 || dos) return;
    const ox = X(u, z);
    const genre = T.oreilles !== undefined ? T.oreilles : gobelin ? 'grandes' : race === 'elfe' ? 'elfe' : 'rondes-humaines';
    if (genre === null) return;
    if (genre === 'grandes') { t.forme('peau', (x, y) => { const d = cote * (x + 0.5 - ox) / k; return d > -1 && d < 7 && Math.abs(y + 0.5 - cy + 1 * k) < (2.6 - d * 0.3) * k ? [cote, -0.3, 0.6] : null; }); return; }
    if (genre === 'pointues') { t.forme('peau', (x, y) => { const d = cote * (x + 0.5 - ox) * (s > 0.5 ? 0.6 : 1) / k, h = (cy + 1.5 * k - y) / k; return h >= -1 && h < 5 && d > -1.2 + h * 0.5 && d < 1.6 + h * 0.3 ? [cote * 0.7, -0.5, 0.6] : null; }); return; }
    if (genre === 'loup') { const tx = X(cote * P.rx * 0.62, -P.rx * 0.15), ty0 = cy - P.ry + 2 * k; t.forme('peau', (x, y) => { const h = (ty0 - y) / k; return h >= -2.5 && h < 7.5 && Math.abs(x + 0.5 - tx - cote * c * h * 0.3 * k) < (3.2 - h * 0.4) * k ? [cote * 0.5, -0.4, 0.7] : null; }, { decalage: 0.1, motif: MECHES }); t.forme('museau', (x, y) => { const h = (ty0 - y) / k; return h >= -1 && h < 4 && Math.abs(x + 0.5 - tx - cote * c * h * 0.3 * k) < (1.5 - h * 0.3) * k ? [0, 0, 1] : null; }, { bord: false, ombre: false, decalage: -0.3 }); return; }
    if (genre === 'rondes') { t.forme('noir', ellipsoide(X(cote * P.rx * 0.78, -P.rx * 0.2), cy - P.ry + 1 * k, 3 * k, 2.8 * k), { decalage: 0.1 }); return; }
    if (genre === 'elfe') t.forme('peau', (x, y) => { const d = cote * (x + 0.5 - ox) * (s > 0.5 ? 0.6 : 1) / k, h = (cy + 2 * k - y) / k; return h >= 0 && h < 8 && d > -1.4 + h * 0.45 && d < 1.8 + h * 0.35 ? [cote * 0.7, -0.5, 0.6] : null; });
    else { t.forme('peau', ellipsoide(ox, cy + 1.5 * k, 1.8 * k, 2.6 * k), { decalage: -0.2 }); t.forme('peau', ellipsoide(ox, cy + 1.8 * k, 0.9 * k, 1.4 * k), { decalage: -0.8, bord: false, ombre: false }); }
  };
  oreille(loin);
  t.forme('peau', tete, { decalage: 0.05 });
  oreille(pres);
  if (race === 'hobbit' && !dos) for (const cote of [-1, 1]) if (Z(cote * 4.5 * k, P.rx * 0.7) > 0) t.forme('peau', ellipsoide(X(cote * 4.5 * k, P.rx * 0.7), cy + 3.5 * k, 2.6 * k, 2 * k), { decalage: 0.35, bord: false, ombre: false });
  const ey = Math.round(cy + 1 * k);
  const by = ey + (T.nezBas ? 7.5 : 5) * k;
  // Le museau du loup-garou et du panda : une bosse qui avance sous les yeux, la truffe au bout
  if (T.museau && !dos) {
    const avance = race === 'panda' ? 1.5 : 4.2;
    const mx = profil ? cx + P.rx * 0.9 + avance * k : X(0, P.rx * 0.85) + s * avance * k;
    const rx = (race === 'panda' ? 3.6 : 3.4) * k * (profil ? 1.4 : Math.max(0.55, Math.abs(c) + 0.25)), ry = (race === 'panda' ? 2.6 : 3.4) * k;
    if (T.touffes) for (const cote of [-1, 1]) if (Z(cote * P.rx, P.rx * 0.2) > -1 * k) { const tx = X(cote * P.rx * 0.95, P.rx * 0.2); t.forme('peau', (x, y) => { const d = cote * (x + 0.5 - tx) / k, h = (y + 0.5 - cy - 2.5 * k) / k; return d > -2 && d < 4 && Math.abs(h - d * 0.25) < 2.6 - d * 0.55 ? [cote, 0.2, 0.6] : null; }, { motif: MECHES }); }
    t.forme('museau', ellipsoide(mx, ey + (race === 'panda' ? 3.2 : 3.6) * k, rx, ry), { decalage: 0.15 });
    const nx = profil ? mx + rx - 0.8 * k : mx + s * (rx - 0.8 * k);
    t.forme('truffe', ellipsoide(nx, ey + (race === 'panda' ? 2.2 : 1.6) * k, (race === 'panda' ? 1.1 : 1.5) * k, (race === 'panda' ? 0.9 : 1.1) * k), { ombre: false, bord: false }); t.poser(Math.round(nx - 0.4 * k), Math.round(ey + 1.8 * k), 'blanc', 3);
  }
  if (T.verrues && !dos) for (const [u, z, dy] of [[-3.5, 0.8, 2.5], [4, 0.75, -1], [2, 0.6, 6], [-5, 0.5, -3]]) if (Z(u * k, P.rx * z) > 0) t.forme('peau', ellipsoide(X(u * k, P.rx * z), cy + dy * k, 0.9 * k, 0.8 * k), { decalage: -0.6, bord: false });
  let yeux = [];
  const poserYeux = () => { for (const [ox, large, cote] of yeux) {
    // Un œil simple et posé : un petit blanc, la pupille sombre, un reflet d'un pixel, la paupière
    const w = large ? 1.3 * k : 0.8 * k, h = 1.4 * k;
    // (les yeux de bête : tout l'œil de la couleur de l'iris, une pupille en fente)
    t.forme(T.fente ? 'iris' : 'blanc', ellipsoide(ox, ey, w, h), { decalage: T.fente ? 0.4 : 0.2, ombre: false, bord: false });
    const ix = ox + (large ? 0 : cote * 0.15 * k);
    t.forme('pupille', ellipsoide(ix, ey + 0.15 * k, T.fente ? 0.3 * k : large ? 0.75 * k : 0.5 * k, 1.05 * k), { ombre: false, bord: false });
    t.poser(Math.round(ix - 0.4 * k), Math.round(ey - 0.4 * k), 'blanc', 5);
    for (let i = -Math.round(w); i <= Math.round(w); i++) t.poser(Math.round(ox + i), Math.round(ey - h), 'pupille', 2);
    if (fache) {
      // Fâché : la paupière du haut descend en biais, plus bas du côté du nez
      const versNez = Math.sign(X(0, P.rx) - ox) || 1;
      for (let i = -Math.round(w); i <= Math.round(w); i++) {
        const cache = Math.max(0, Math.round((0.35 + 0.45 * (i * versNez) / Math.max(1, w)) * h * 1.1));
        for (let y = Math.round(ey - h); y < Math.round(ey - h) + cache; y++) t.poser(Math.round(ox + i), y, 'peau', 2);
        t.poser(Math.round(ox + i), Math.round(ey - h) + cache, 'pupille', 1);
      }
    }
    if (costume === 'mendiant') {
      // Des yeux fatigués mais doux : la paupière retombe sur le haut de l'œil, un cerne dessous,
      // et le sourcil s'incline vers l'extérieur (la vie n'a pas été facile, mais il sourit)
      for (let i = -Math.round(w); i <= Math.round(w); i++) {
        for (let y = Math.round(ey - h) + 1; y <= Math.round(ey - 0.3 * k); y++) t.poser(Math.round(ox + i), y, 'peau', 2);
        t.poser(Math.round(ox + i), Math.round(ey + h) + 1, 'peau', 1);                 // le cerne
      }
      t.poser(Math.round(ox - cote * (w + 0.5 * k)), Math.round(ey + 0.5 * k), 'peau', 2);   // le petit pli au coin
    }
  } };
  if (!dos) {
    // Les joues : une ombre sur la joue qui s'éloigne, une lumière (et un peu de rose) sur celle
    // qui s'approche ; le menton, un peu plus sombre sous la bouche
    const joueR = (race === 'hobbit' ? 3.4 : 2.2) * k, joueY = ey + 3.6 * k;
    const joufflu = race === 'hobbit' || race === 'humain' || race === 'magicienne';
    if (profil) {
      // De profil : l'ombre sous le nez, la narine, la bouche sur le bord, le menton
      const nb = bordProfil(ey + 3.6 * k) || P.rx;
      for (let i = 0; i < Math.round(nb - P.rx * 0.78); i++) t.poser(Math.round(cx + P.rx * 0.78 + i), Math.round(ey + 3.6 * k) + 1, 'peau', 2); // l'ombre sous le nez
      t.poser(Math.round(cx + P.rx * 0.9), Math.round(ey + 3.3 * k), 'peau', 1); t.poser(Math.round(cx + P.rx * 0.9) + 1, Math.round(ey + 3.3 * k), 'peau', 2); // la narine
      if (!(f && race !== 'hobbit')) t.forme('peau', ellipsoide(cx + P.rx * 0.6, cy + P.ry - 1.5 * k, 2 * k, 1 * k), { decalage: -0.5, bord: false, ombre: false });   // (le menton : pas chez les femmes, dont le visage finit aux lèvres)
    } else if (Math.abs(c) > 0.2) {
      // De face comme de trois-quarts : une ombre nette sur le côté du visage opposé à la lumière
      // (à droite), et sous le menton
      const seuil = Math.abs(c) > 0.9 ? 0.72 : 0.35;
      t.forme('peau', (x, y) => { const n = tete(x, y); if (!n || y < ey - 2 * k || y > cy + P.ry) return null; const fz = Math.abs(c) > 0.9 ? 1 - n[0] : n[0] * s + n[2] * c; return (Math.abs(c) > 0.9 ? n[0] > seuil : fz < seuil && n[0] < 0) ? n : null; }, { decalage: -0.8, bord: false, ombre: false });
      t.forme('peau', (x, y) => { const n = tete(x, y); return n && n[1] > 0.84 && y > by + 2 * k ? n : null; }, { decalage: -0.8, bord: false, ombre: false });   // (juste le dessous du menton)
    }
    // Les joues pleines du hobbit : juste un peu de rose
    if (race === 'hobbit') for (const cote of (Math.abs(c) > 0.9 ? [-1, 1] : profil ? [1] : [pres])) t.forme('levres', ellipsoide(profil ? cx + P.rx * 0.45 : X(cote * P.rx * 0.5, P.rx * 0.62), joueY + 0.4 * k, 1.3 * k, 0.8 * k), { decalage: 1.2, bord: false, ombre: false });
    if (!carre && !(profil && f && race !== 'hobbit')) t.forme('peau', ellipsoide(X(0, P.rx * 0.7), cy + P.ry - 1.2 * k, 2.6 * k, 1.1 * k), { decalage: -0.5, bord: false, ombre: false });   // (le menton ; pas de profil chez les femmes)
    else if (!profil) {
      // La mâchoire carrée se lit par ses ombres : les angles de la mâchoire et le dessous du menton
      t.forme('peau', (x, y) => { const n = tete(x, y); if (!n) return null; const ny = (y + 0.5 - cy) / P.ry; return ny > 0.62 && (Math.abs(n[0]) > 0.42 || ny > 0.86) ? n : null; }, { decalage: -0.8, bord: false, ombre: false });
    }
    // Le nez : une vraie bosse, éclairée en haut à gauche, ombrée dessous et du côté éloigné
    const nz = X(0, P.rx * (s > 0.5 ? 1 : 0.8));
    if (profil || T.nez === 0) { /* (le nez fait partie du contour, ou c'est un museau) */ } else {
    const nr = (race === 'nain' ? 1.7 : race === 'hobbit' ? 1.4 : 1.1) * (T.nez || 1) * k;
    const ny0 = ey + (T.nezBas ? 4 : 2.9) * k;
    if (T.nezBas) t.forme('peau', ellipsoide(nz + s * 1.8 * k + 0.4 * k, ny0 + 0.8 * k, nr * (s > 0.5 ? 1.2 : 0.95), nr * 1.45), { decalage: -0.9, ombre: false, bord: false });
    t.forme('peau', ellipsoide(nz + s * (T.nezBas ? 1.5 : 0.5) * k, ny0, nr * (s > 0.5 ? 1.1 : 0.85), nr * (T.nezBas ? 1.35 : 1.15)), { decalage: T.nezBas ? 0.45 : 0.15, ombre: false });
    for (let i = -Math.round(nr * 0.6); i <= Math.round(nr * 0.6); i++) t.poser(Math.round(nz + s * 0.5 * k + i), Math.round(ny0 + nr * (T.nezBas ? 1.35 : 1.15)), 'peau', 1); // l'ombre dessous
    for (let j = 0; j < Math.round(nr * 1.5); j++) t.poser(Math.round(nz + s * 0.5 * k - nr * (s > 0.5 ? 1 : 0.85)), Math.round(ey + 1.8 * k + j), 'peau', 2); // l'arête
    if (Math.abs(c) > 0.9) for (let j = 0; j < Math.round(nr * 1.6); j++) for (let e = 0; e < Math.max(1, Math.round(0.6 * k)); e++) t.poser(Math.round(nz + nr * 0.85) + e, Math.round(ey + 1.6 * k + j), 'peau', 1); // l'ombre à droite du nez
    }
    // Les yeux, symétriques autour du nez
    if (profil) yeux.push([cx + P.rx * 0.5, false, pres]);
    else for (const cote of [loin, pres]) {
      const u = cote * P.rx * 0.46, z = P.rx * 0.78;
      if (Z(u, z) < 0.6 * k) continue;
      yeux.push([X(u, z), cote === pres || s < 0.3, cote]);
    }
    if (T.taches) for (const [ox, large] of yeux) t.forme('noir', ellipsoide(ox, ey + 0.4 * k, (large ? 2.6 : 1.8) * k, 2.3 * k), { decalage: 0.1, bord: false });
    poserYeux();
    // Les sourcils : un arc au-dessus de chaque œil
    const epSourcil = T.sourcil ? Math.round(T.sourcil * 0.9 * k) : race === 'nain' ? Math.round(1.2 * k) : race === 'elfe' ? Math.max(1, Math.round(0.45 * k)) : Math.round(0.7 * k);
    for (const [ox, large] of yeux) {
      const w = large ? 2 * k : 1.1 * k, versNez = Math.sign(X(0, P.rx) - ox) || 1;
      for (let i = -Math.round(w); i <= Math.round(w); i++) for (let e = 0; e < epSourcil + (fache ? 1 : 0); e++) {
        // (fâché : le sourcil plonge vers le nez)
        const dy = fache ? -2.6 * k + (i * versNez) / w * 1.3 * k : -3.2 * k + (i * i) / (w * w) * (race === 'elfe' ? 1.6 : 1) * k;
        t.poser(Math.round(ox + i), Math.round(ey + dy) + e, 'cheveux', e ? 2 : 1);
      }
    }
    if (fache && !profil && Math.abs(c) > 0.3) for (let j = 0; j < 1.4 * k; j++) t.poser(Math.round(X(0, P.rx)), Math.round(ey - 2.8 * k) + j, 'peau', 1);   // (le pli du front)
    // La bouche : une forme par peuple. Large et à deux lèvres pour l'humain, petit sourire bien
    // marqué pour le hobbit, trait net et long pour l'elfe homme, discrète pour l'elfe femme,
    // bouche visible au creux de la barbe pour le nain
    const bx = profil ? cx + (bordProfil(by) || P.rx) - 2.2 * k : X(0, P.rx * 0.85);
    const elfeF = race === 'elfe' && f;
    // Sur les peaux sombres, les lèvres rouges tranchent trop : on les dessine dans les tons de la peau
    const sombre = (g.peau ?? 1) >= 3 && !gobelin;
    const matLevre = sombre ? 'peau' : 'levres';
    const tonFente = sombre ? 0 : 1, tonBas = sombre ? 4 : (race === 'nain' ? 3 : 4), tonHaut = sombre ? 1 : 2;
    const largeur = profil ? 1.2 : race === 'troll' ? 4.6 : race === 'hobbit' ? 2.1 : race === 'nain' ? 3 : race === 'elfe' ? (f ? 1.9 : 2.8) : race === 'magicienne' ? 2.3 : 2.8;
    const lb = Math.max(1, Math.round(largeur * k * (profil ? 1 : Math.abs(c))));
    const bouche = options.bouche ?? 0;   // 0 souriante, 1 neutre, 2 étonnée, 3 grognon
    const courbe = (T.sourire ? 1.4 : bouche === 1 ? 0 : bouche === 3 ? -0.8 : race === 'hobbit' ? 1.2 : race === 'elfe' ? 0.3 : 0.8) * (profil ? 0.5 : 1);
    const epaisseur = elfeF ? 1 : Math.max(1, Math.round((profil ? 0.9 : 0.65) * k));
    if (bouche === 2) t.forme('bouche', ellipsoide(bx, by + 0.5 * k, 1.2 * k, 1.5 * k), { decalage: -0.5, ombre: false });
    else for (let i = -lb; i <= lb; i++) {
      const yy = by + Math.round((1 - (i * i) / (lb * lb)) * courbe * k);
      for (let e = 0; e < epaisseur; e++) t.poser(Math.round(bx + i), yy + e, matLevre, tonFente);               // la fente
      if (!elfeF && !profil && Math.abs(i) < lb && (Math.abs(c) > 0.9 || i <= 0)) t.poser(Math.round(bx + i), yy + epaisseur, matLevre, tonBas); // la lèvre du bas, en lumière
      if (!elfeF && !profil && Math.abs(i) < lb - 1 && race !== 'nain') t.poser(Math.round(bx + i), yy - 1, matLevre, tonHaut);   // la lèvre du haut
    }
    if (bouche === 0 && options.bouche !== undefined) for (let i = -Math.round(lb * 0.5); i <= Math.round(lb * 0.5); i++) t.poser(Math.round(bx + i), by + Math.round(0.8 * k) - 1, 'blanc', 4);
    if (!elfeF && Math.abs(c) > 0.3) t.poser(Math.round(bx - lb - 1), by, matLevre, tonFente);
    if (!elfeF && Math.abs(c) > 0.9) t.poser(Math.round(bx + lb + 1), by, matLevre, tonFente);
    // La barbe : sur la moitié avant du menton et des joues
    const barbe = race === 'nain' ? 'nain' : g.barbe;
    if (barbe === 'moustache') { for (let i = -lb - 1; i <= lb + 1; i++) for (let e = 0; e < k; e++) t.poser(Math.round(bx + i), by - 1.6 * k + e + (Math.abs(i) > lb - 1 ? 1 : 0), 'cheveux', 3); }
    else if (barbe) {
      const long = barbe === 'nain' ? yB - 2 * k : barbe === 'pleine' ? cy + P.ry + 4 * k : cy + P.ry + 1.5 * k;
      t.forme('cheveux', (x, y) => {
        if (y < ey + 3 * k || y > long) return null;
        if (y >= by - 1 * k && y <= by + 1.8 * k && Math.abs(x + 0.5 - bx) < (barbe === 'nain' ? 3.6 : 3) * k) return null;
        const demi = (barbe === 'nain' ? P.rx - 0.8 * k : P.rx + 0.5 * k) - Math.max(0, y - cy - P.ry) * (barbe === 'nain' ? 0.25 : 0.6);
        const centre = X(0, P.rx * 0.35 + Math.max(0, y - cy - P.ry) * 0.1);
        const nx = (x + 0.5 - centre) / demi;
        if (Math.abs(nx) > 1 || (barbe === 'bouc' && Math.abs(x + 0.5 - bx) > 3 * k)) return null;
        const fz = -nx * c * s + Math.sqrt(Math.max(0, 1 - nx * nx)) * Math.abs(c) + s * 0.3;
        return fz > 0.2 ? [nx * 0.8, (y - ey) / (20 * k), 0.8] : null;
      }, { motif: MECHES });
      if (barbe === 'nain') for (let y = yT + 6 * k; y < yB; y += 3 * k) { t.poser(Math.round(bx), y, 'or', 3); t.poser(Math.round(bx) + 1, y, 'or', 5); }
    }
    // Les grandes dents de Grippesou (et des gobelins), les défenses des orcs et des trolls, les
    // canines des vampires, les crocs du loup-garou
    const dents = T.dents || (gobelin ? 'gobelin' : null);
    if (dents === 'gobelin') for (let j = -2; j <= 2; j++) { const x = Math.round(bx + j * 1.1 * k); for (let e = 0; e < Math.round(1.2 * k) - (j % 2 ? 1 : 0); e++) t.poser(x, by + 1 + e, 'blanc', e ? 3 : 5); }   // (des dents pointues, une sur deux plus courte)
    else if (dents === 'defenses') for (const cote of (profil ? [1] : [-1, 1])) {
      // Deux petites défenses d'ivoire qui sortent du fond de la mâchoire et se recourbent vers le haut
      const x0 = bx + cote * (lb + 0.6 * k), y0 = by + 1.4 * k;
      for (let j = 0; j < 3 * k; j++) { const u = j / (3 * k), epd = Math.max(1, Math.round((1.3 - u * 0.9) * k)); for (let e = 0; e < epd; e++) t.poser(Math.round(x0 + cote * u * u * 1.4 * k) + e * cote - (epd > 1 ? cote : 0), Math.round(y0 - j), 'ivoire', u > 0.7 ? 5 : e ? 2 : 4); }
    }
    else if (dents === 'canines') for (const cote of (profil ? [1] : [-1, 1])) { const x = Math.round(bx + cote * 1.3 * k); for (let j = 0; j < 1.8 * k; j++) t.poser(x, by + epaisseur + j, 'blanc', 4); }
    else if (dents === 'crocs') for (const cote of (profil ? [1] : [-1, 1])) { const x = Math.round((profil ? cx + P.rx * 0.9 + 3 * k : X(0, P.rx * 0.85) + s * 3 * k) + cote * 1.8 * k); for (let j = 0; j < 2.2 * k; j++) t.poser(x, Math.round(ey + 5 * k) + j, 'blanc', j > k ? 5 : 3); }
  }

  // --- 5. Les cheveux : une calotte sur la sphère, qui couvre le haut, l'arrière et les tempes ---
  const coupe = T.cheveux === false ? 'chauve' : T.cheveux === 'crete' ? 'crete' : T.cheveux === 'plaque' ? 'court' : T.cheveux === 'rare' ? 'chauve' : race === 'hobbit' ? 'boucles' : g.coiffure;
  if (T.cheveux === 'hirsute') {
    // Une tignasse grise et hirsute qui encadre l'énorme visage et retombe en mèches sur les épaules
    t.forme('cheveux', (x, y) => {
      const nx = (x + 0.5 - X(0, -P.rx * 0.3)) / (P.rx + 3 * k), ny = (y + 0.5 - cy + 1 * k) / (P.ry + 2.5 * k);
      if (nx * nx + ny * ny > 1 && !(Math.abs(nx) < 1.05 && y > cy && y < yT + 10 * k - hachage(Math.floor(x / k), 0, 61) * 5 * k)) return null;
      // (le visage reste libre : sur la tête, seulement une frange en haut, et les côtés vers l'arrière)
      if (tete(x, y) && !dos && (y + 0.5 - cy) / P.ry > -0.6 && Math.abs(x + 0.5 - X(0, P.rx * 0.6)) < P.rx * 0.95) return null;
      if (!dos && t.mat(x, y) && t.mat(x, y) !== 'cheveux' && (y + 0.5 - cy) / P.ry > -0.6) return null;   // (ni le nez, ni les yeux, ni la bouche)
      return [nx, ny * 0.5, 0.7];
    }, { decalage: -0.2, motif: MECHES });
    for (const [u, z, dy, r] of [[-7, -4, -11, 2], [9, -7, 4, 1.8], [-11, -6, 7, 2]]) if (Z(u * k, z * k) > -4 * k || dos) t.forme('mousse', ellipsoide(X(u * k, z * k), cy + dy * k, r * k, r * 0.7 * k), { motif: (x, y) => (hachage(x, y, 5) > 0.6 ? 0.6 : 0) });
  } else if (coupe === 'crete') {
    // La crête des orcs : une bande de cheveux hérissés au sommet du crâne, d'avant en arrière
    t.forme('cheveux', (x, y) => { const h = (cy - P.ry + 1 * k - y) / k; const demi = (1.6 * Math.max(0.3, Math.abs(c)) + 2.5 * Math.abs(s)) * k; return h >= -1.5 && h < 4.5 && Math.abs(x + 0.5 - X(0, -1.5 * k)) < demi + Math.abs(s) * 2 * k ? [(x + 0.5 - cx) / (3 * k), -0.5, 0.7] : null; }, { motif: (x, y) => (Math.floor(x / k) % 2 ? 0.5 : -0.6) });
  } else if (coupe === 'boucles') {
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
      // (les elfes ont le front dégagé : la frange s'arrête bien au-dessus des yeux, et une seule
      // mèche fine retombe sur le coin d'un œil)
      const elfe = race === 'elfe';
      const frange = ny < (elfe ? -0.64 : -0.42) + Math.abs(Math.sin((x - cx) / k * 1.1)) * (elfe ? 0.07 : 0.14);
      const meche = elfe && !dos && fz > 0.3 && ny > -0.7 && ny < -0.08 && Math.abs(x + 0.5 - X(-2.4 * k, P.rx * 0.9)) < 0.8 * k;
      const arriere = fz < -0.05;
      const tempe = Math.abs(fu) > (elfe ? 0.94 : 0.9) && ny < 0.25 && fz < 0.5;
      if (!frange && !arriere && !tempe && !meche) return null;
      return [nx, ny, nz];
    }, { motif: MECHES });
    if (coupe === 'herisse') for (let j = -6; j <= 6; j += 3) t.forme('cheveux', (x, y) => (y >= cy - P.ry - 3 * k && y < cy - P.ry + 1 * k && Math.abs(x + 0.5 - cx - j * 0.9 * k) < (y - cy + P.ry + 4 * k) * 0.5 ? [0, -0.6, 0.7] : null), { ombre: false });
    if (coupe === 'chignon') t.forme('cheveux', ellipsoide(X(0, -P.rx * 0.6), cy - P.ry - 0.5 * k, 3.5 * k, 3 * k), { motif: MECHES });
    if (coupe === 'queue' && (s > 0.3 || dos)) t.forme('cheveux', (x, y) => { const qx = X(0, -P.rx - 1 * k); return y >= cy - 2 * k && y <= yT + 8 * k && Math.abs(x + 0.5 - qx) < 2.2 * k - Math.max(0, y - yT - 2 * k) * 0.15 ? [(x + 0.5 - qx) / (2.2 * k), 0, 0.8] : null; }, { motif: MECHES });
  }
  if (!dos) { t.relief = false; poserYeux(); t.relief = true; }
  if (porte('monocle') && !dos && yeux.length) { const [ox] = yeux[yeux.length - 1]; for (let a = 0; a < 6.3; a += 0.25) t.poser(Math.round(ox + Math.cos(a) * 2.6 * k), Math.round(ey + 0.3 * k + Math.sin(a) * 2.8 * k), 'or', a < 3 ? 4 : 2); for (let j = 0; j < 5 * k; j++) t.poser(Math.round(ox + 2.6 * k + (j % 2 ? 1 : 0)), Math.round(ey + 3 * k + j), 'or', 3); }
  if (porte('pipe') && !dos) { const bx = X(0, P.rx * 0.85); const px = Math.round(bx + s * 2 * k - 2 * k); for (let j = 0; j < 5 * k; j++) for (let e = 0; e < k; e++) t.poser(px - j, by + Math.floor(j / (2 * k)) * k + e, 'bruyere', 3); t.forme('bruyere', ellipsoide(px - 5 * k, by + 2.5 * k, 1.4 * k, 1.6 * k), { decalage: 0.1, ombre: false }); for (let j = 0; j < 3; j++) t.poser(px - 5 * k - j, by - 1 * k - j * 2 * k, 'blanc', 4 + (j % 2)); }
  if (longs && dos) t.forme('cheveux', (x, y) => (y >= cy && y <= yT + 10 * k && Math.abs(x + 0.5 - cx) < P.rx + 1 * k - Math.max(0, y - yT - 4 * k) * 0.4 ? [(x + 0.5 - cx) / (P.rx + 2 * k), 0, 0.8] : null), { decalage: -0.3, motif: MECHES });
  if (tenue >= 4 && race !== 'nain' && race !== 'magicienne') for (let j = -5; j <= 5; j++) { const x = Math.round(X(j * k, Math.sqrt(Math.max(0, P.rx * P.rx - (j * k) ** 2)) * 0.9)); for (let e = 0; e < k; e++) t.poser(x + e, cy - P.ry + 1 * k + (j % 3 === 0 ? -1 * k : 0), 'or', j % 3 === 0 ? 5 : 4); } // le diadème

  // --- Les couvre-chefs des peuples ---
  if (race === 'nain' && costume !== 'banquier') {
    // Le casque à cornes : une calotte de métal, un nasal, deux cornes d'ivoire qui s'écartent
    t.forme('metal', (x, y) => { const n = ellipsoide(cx, cy - 2 * k, P.rx + 0.8 * k, P.ry)(x, y); return n && y <= cy - 4 * k ? n : null; }, { decalage: 0.2, motif: (x, y) => (y === Math.round(cy - 4 * k) ? -0.9 : 0) });
    if (!dos) for (let y = cy - 2 * k; y <= cy + 3 * k; y++) for (let e = 0; e < k; e++) t.poser(Math.round(X(0, P.rx)) - (k - 1) + e - Math.round(s * k), y, 'metal', 4);
    for (const cote of [loin, pres]) {
      // Deux cornes d'ivoire, serties dans une bague de fer sur le côté du casque : épaisses à la
      // base, elles se courbent vers le haut et l'extérieur
      const u = cote * (P.rx + 0.3 * k), z = -P.rx * 0.15;
      if (Z(u, z) < -P.rx * 0.5) continue;
      const bx0 = X(u, z), by0 = cy - 3.5 * k;
      const dir = cote * Math.max(0.35, Math.abs(c)) + (cote === pres ? -s * 0.4 : s * 0.4);
      t.forme('metal', ellipsoide(bx0, by0, 2.2 * k, 2.2 * k), { decalage: -0.2 });
      for (let j = 0; j < 7 * k; j++) {
        const r = (1.6 - j / (7 * k) * 1.25) * k;
        const px = bx0 + dir * j * 0.55 + dir * (j * j) / (14 * k), py = by0 - j * 0.85 + (j * j) / (30 * k);
        t.forme('lin', ellipsoide(px, py, r, r), { decalage: 0.3 - j / (7 * k) * 0.4, ombre: false, bord: j === 0 });
      }
    }
  } else if (race === 'magicienne') {
    // Le chapeau de mage : une grande calotte souple qui se plie et retombe, un large bord
    // ondulé, un ruban de cuir à boucle
    const haut = cy - P.ry + 2.5 * k;   // (le bord repose sur la tête, pas au-dessus)
    const sommet = [X(0, -2 * k) + 7 * k * (c > 0 ? 1 : 0.4) + s * 5 * k, 1 * k];
    t.forme('chapeau', (x, y) => {
      if (y < 0 || y > haut + 1 * k) return null;
      const u = (haut + 1 * k - y) / (haut + 1 * k);                   // 0 en bas, 1 au sommet
      const courbe = cx + Math.pow(u, 2.2) * (sommet[0] - cx);          // l'axe se plie vers le sommet
      const demi = (P.rx + 2 * k) * (1 - u) * (1 - u * 0.2) + 1.2 * k;
      const nx = (x + 0.5 - courbe) / demi;
      return Math.abs(nx) <= 1 ? [nx * 0.9, -0.25, Math.sqrt(1 - nx * nx * 0.8)] : null;
    }, { decalage: 0.05, ombre: false, motif: (x, y) => ((Math.floor(x / k) * 5 + Math.floor(y / k) * 7) % 29 === 0 ? 0.8 : 0) });
    t.forme('chapeau', (x, y) => { const d = Math.abs(x + 0.5 - cx); const onde = Math.round(Math.sin(d / (2.2 * k)) * 0.8 * k); return y >= haut - 0.5 * k + onde && y <= haut + 1.5 * k + onde && d < P.rx + 7 * k - Math.max(0, d - P.rx) * 0.1 ? [0, -0.6, 0.7] : null; }, { decalage: -0.2, ombre: false });
    for (let x = Math.round(cx - P.rx - 1 * k); x <= cx + P.rx + 1 * k; x++) for (let e = 0; e < k; e++) t.poser(x, haut - 2 * k + e, 'cuir', 2 + e);
    t.forme('or', ellipsoide(X(0, P.rx), haut - 1.5 * k, 1.4 * k, 1.4 * k), { decalage: 0.5, ombre: false });
  }
  if (porte('chapeau')) {
    // Le chapeau de cow-boy : calotte pincée, large bord relevé sur les côtés
    const haut = cy - P.ry;
    t.forme('feutre', (x, y) => (y >= haut - 7 * k && y <= haut + 1 * k && Math.abs(x + 0.5 - X(0, -0.5 * k)) < 6 * k - Math.max(0, haut - 5 * k - y) * 0.5 ? [(x + 0.5 - cx) / (6 * k), -0.2, 0.8] : null), { motif: (x, y) => (y < haut - 3 * k && Math.abs(x + 0.5 - X(0, -0.5 * k)) < 1.5 * k ? -0.9 : 0) });
    t.forme('feutre', (x, y) => { const d = Math.abs(x + 0.5 - cx); const rel = d > 8 * k ? Math.round((d - 8 * k) * 0.7) : 0; return y >= haut + 1 * k - rel - 0.5 * k && y <= haut + 2 * k - rel && d < 12 * k * Math.max(0.6, Math.abs(c) + 0.2) ? [0, (y - haut - 1.5 * k) * 0.8 / k, 0.8] : null; }, { decalage: -0.1 });
    for (let x = Math.round(cx - 5 * k); x <= cx + 5 * k; x++) for (let e = 0; e < k; e++) t.poser(x, haut - 1 * k + e, 'cuir', 2);
  }
  // Le bandana rouge à pois, noué autour du cou (un accessoire de la garde-robe)
  if (porte('bandana') && !dos) {
    t.forme('ruban', (x, y) => (y >= yT - 2 * k && y <= yT + 4 * k && Math.abs(x + 0.5 - X(0, prof * 0.7)) < (6.5 * k - (y - yT + 2 * k) * 0.9) * Math.max(0.4, Math.abs(c)) ? [(x + 0.5 - cx) / (6 * k) * 0.5, 0.2, 0.9] : null), { motif: (x, y) => ((Math.floor(x / k) * 3 + Math.floor(y / k) * 5) % 7 === 0 ? 1.4 : 0) });
    for (let j = 0; j < 4 * k; j++) t.poser(Math.round(X(5 * k, prof * 0.5)) + (Math.floor(j / k) % 2), yT - 3 * k + j, 'ruban', 2 + (Math.floor(j / k) % 2));
  }
  if (costume === 'garde' && race !== 'magicienne' && race !== 'nain') {
    // Le casque à nasal (le panda n'a pas de nasal : son museau ; le hobbit a un casque rond à bord ;
    // l'elfe un cimier bleu)
    t.forme('metal', (x, y) => { const n = ellipsoide(cx, cy - 1 * k, P.rx + 1 * k, P.ry + 1 * k)(x, y); return n && y <= cy - 2 * k ? n : null; }, { decalage: 0.2 });
    if (race === 'hobbit') t.forme('metal', (x, y) => (Math.abs(y + 0.5 - (cy - 2 * k)) < 0.8 * k && Math.abs(x + 0.5 - cx) < P.rx + 3 * k ? [0, -0.5, 0.8] : null), { decalage: 0.1 });
    else t.forme('metal', ellipsoide(cx, cy - P.ry - 1 * k, 1.5 * k, 2.5 * k), { decalage: 0.1 });
    if (race === 'elfe') { t.rampes.cimier = rampeVive(0x3a6ad8); for (let j = 0; j < 7 * k; j++) for (let e = 0; e < k; e++) t.poser(Math.round(X(-j * 0.35, -j * 0.6)) + e, Math.round(cy - P.ry - 2 * k - Math.sin(j / (7 * k) * Math.PI) * 2 * k), 'cimier', 3 + (j % 2)); }
    if (!dos && race !== 'panda' && race !== 'hobbit') for (let y = cy - 2 * k; y <= cy + 3 * k; y++) for (let e = 0; e < k; e++) t.poser(Math.round(X(0, P.rx)) - (k - 1) + e - Math.round(s * k), y, 'metal', 4);
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
  } else if (costume === 'mendiant' || costume === 'gobelin' || costume === 'passeur') {
    // Une capuche râpée, qui encadre le visage
    t.forme('cape', (x, y) => { const n = ellipsoide(X(0, -0.5 * k), cy - 1 * k, P.rx + 1.5 * k, P.ry + 1.8 * k)(x, y); if (!n) return null; const fz = n[0] * s + n[2] * c; return (y < cy - 3 * k || fz < (gobelin ? 0.25 : 0.4)) && y < yT + 3 * k ? n : null; }, { decalage: -0.3, motif: costume === 'mendiant' ? (x, y) => (hachage(Math.floor(x / k), Math.floor(y / k), 31) > 0.9 ? -1 : 0) : null });
  } else if (costume === 'mentor') {
    // Rien sur la tête : Garrick a sa tignasse grise
  }
  // L'écuelle tendue du mendiant
  if (costume === 'mendiant' && !dos) { const mx = X(pres * (ep + 0.6 * k), 2.5 * k); t.forme('metal', ellipsoide(mx, yB + 0.5 * k, 3.2 * k, 1.6 * k), { decalage: -0.2 }); t.poser(Math.round(mx), Math.round(yB - 0.5 * k), 'or', 4); t.poser(Math.round(mx) + 1, Math.round(yB - 0.5 * k), 'or', 5); }
  // --- 6. De dos : la cape par-dessus tout ---
  if (capee && dos) dessinerCape(true);

  // La collerette de poils du loup-garou, sur les épaules ; la mousse sur les épaules du troll
  if (T.collerette) t.forme('peau', (x, y) => { const nx = (x + 0.5 - cx) / (ep + 2 * k), ny = (y + 0.5 - yT - 2 * k) / (4 * k); return nx * nx + ny * ny <= 1 && y > cy + P.ry * 0.6 - hachage(Math.floor(x / k), 3, 11) * 2 * k ? [nx * 0.6, ny * 0.4, 0.8] : null; }, { decalage: -0.1, motif: MECHES });
  if (T.mousse) for (const cote of [-1, 1]) t.forme('mousse', ellipsoide(X(cote * (ep - 1 * k), 0), yT + 1.5 * k, 3.2 * k, 2 * k), { decalage: -0.2, motif: (x, y) => (hachage(x, y, 9) > 0.55 ? 0.7 : 0) });
  // --- 7. Les peaux particulières : la fourrure (poils en hachures), les bandelettes de la momie ---
  if (T.fourrure) for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) if (t.mat(x, y) === 'peau' || t.mat(x, y) === 'noir') {
    if (race === 'troll' && y < yT && !dos) continue;
    const h = hachage(Math.floor(x / k), Math.floor(y / k), T.fourrure);
    if (h > 0.8) t.poser(x, y, t.mat(x, y), Math.max(0, t.k[y * t.l + x] - 1)); else if (h < 0.08) t.poser(x, y, t.mat(x, y), Math.min(5, t.k[y * t.l + x] + 1));
  }
  if (T.bandelettes) {
    // La momie : bandée de la tête aux pieds (vêtements compris), une fente sombre sur les yeux
    const enveloppe = ['peau', 'habit', 'bas', 'cuir', 'lin', 'metal', 'levres', 'cape', 'cheveux'];
    for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) {
      const m = t.mat(x, y);
      if (!enveloppe.includes(m)) continue;
      const fente = !dos && yeux.some(([ox, large]) => ((x + 0.5 - ox) / ((large ? 1.8 : 1.2) * k)) ** 2 + ((y + 0.5 - ey) / (1.2 * k)) ** 2 <= 1);
      if (fente) { t.poser(x, y, 'noir', 1); continue; }
      // Des bandes de 3 pixels HD, en biais (dans un sens sur la tête et les jambes, dans l'autre sur le torse)
      const pente = y < yT ? -0.3 : y > yB ? 0.22 : 0.42;
      const b = (((y + x * pente) / k) % 3 + 3) % 3;
      const ton = t.k[y * t.l + x];
      t.poser(x, y, 'bande', b < 0.45 ? 0 : b > 2.5 ? Math.max(1, ton - 1) : Math.min(5, Math.max(2, ton)));
    }
    // Les yeux : deux lueurs dans la fente
    if (!dos) for (const [ox] of yeux) { t.poser(Math.round(ox), Math.round(ey), 'iris', 5); t.poser(Math.round(ox) + 1, Math.round(ey), 'iris', 4); t.poser(Math.round(ox), Math.round(ey) - 1, 'iris', 3); }
    // Un bout de bandelette qui pend du poignet
    const bx0 = X(pres * (ep + 1 * k), 1 * k);
    for (let j = 0; j < 7 * k; j++) for (let e = 0; e < k; e++) t.poser(Math.round(bx0 + Math.sin(j / (2 * k)) * 0.8 * k) + e, Math.round(yB + 3 * k + j), 'bande', j % (3 * k) === 0 ? 1 : 3);
  }

  if (T.touffu) {
    // Une silhouette touffue : des mèches de poils qui dépassent du contour
    const ajouts = [];
    for (let y = 1; y < H - 3; y++) for (let x = 1; x < L - 1; x++) {
      const m = t.mat(x, y);
      if (m !== 'peau' && m !== 'noir' && m !== 'cheveux') continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, -1]]) if (!t.mat(x + dx, y + dy) && hachage(x, y, 71) > 0.55) for (let j = 1; j <= Math.round(T.touffu * k * hachage(y, x, 13)); j++) ajouts.push([x + dx * j, y + dy * j, m, t.k[y * t.l + x]]);
    }
    for (const [x, y, m, ton] of ajouts) if (t.dans(x, y) && !t.mat(x, y)) t.poser(x, y, m, ton);
  }
  contourEpais(t, k - 1);
  // Où sont les mains (depuis le sol), pour y accrocher le baluchon
  t.mains = H - (leves ? cy - P.ry - 7 * k : T.brasLongs ? yB + (sol - yB) * 0.48 + 2 * k : yB + 2.5 * k);
  return t;
}


// --- Brisquet, le gros chien du mendiant : debout ou couché, sous les mêmes angles que les gens ---
// Le chien a ses propres axes : L le long du corps (vers la tête), W de côté. Pour une vue, on
// projette comme pour les personnages (face = la tête vers nous, profil = le corps en long).
function dessinerChienVue(vue = 'profil', couche = false) {
  const k = FINESSE, L = 72 * k, H = 40 * k;
  const t = new ToileHD(L, H);
  // Un bouvier bernois : robe noire, poitrail, liste, museau et bout des pattes blancs, taches feu
  // (sourcils, joues, bas des pattes). Une grosse tête large, des oreilles tombantes.
  t.rampes.poil = rampeVive(0x2a2420); t.rampes.poilClair = rampeVive(0xece6da); t.rampes.feu = rampeVive(0xb06a30); t.rampes.collier = rampeVive(0xa83a2a);
  t.rampes.truffe = rampe(0x1a1410); t.rampes.langue = rampe(0xc85a50); t.rampes.or = rampeVive(0xe8c040);
  if (!t.rampes.blanc) t.rampes.blanc = rampe(0xf0ece0);
  if (!t.rampes.pupille) t.rampes.pupille = rampe(0x2a1e14);
  t.relief = true; t.cel = true;
  const th = ANGLES_VUE[vue] ?? Math.PI / 2;
  const c = Math.cos(th), s = Math.sin(th);
  const cx = L / 2 - 5 * k * s, sol = H - 2;          // (de profil, la tête dépasse à droite : on décale)
  const X = (l, w) => cx + w * c + l * s;              // l le long du corps, w de côté
  const prof = (l, w) => l * c - w * s;                 // vers le spectateur (plus grand = devant)
  const largeur = (rl, rw) => Math.sqrt((rl * s) ** 2 + (rw * c) ** 2);
  const haut = couche ? 7.5 * k : 15 * k;               // la hauteur du dos (un grand chien)
  const parts = [];
  const part = (l, w, dessin) => parts.push([prof(l, w), dessin]);
  // une patte : noire en haut, feu au-dessus du pied, pied blanc
  const patte = (px, y0, y1, devant) => {
    const dec = devant ? 0 : -0.5;
    cylindre(t, 'poil', [px, y0], [px, y1 - 3.5 * k], 2.4 * k, { decalage: dec });
    cylindre(t, 'feu', [px, y1 - 3.5 * k], [px, y1 - 1 * k], 2.1 * k, { decalage: dec });
    t.forme('poilClair', ellipsoide(px + s * 1 * k, y1 - 1 * k, 2.8 * k, 1.4 * k), { decalage: 0.1 });
  };
  // la queue, en panache, le bout blanc
  part(-18 * k, 0, () => {
    const qx = X(-15 * k, 0), qy = sol - haut - 1 * k;
    t.forme('poil', (x, y) => { const u = (y - qy) / (8 * k); return y >= qy - 1 * k && y <= qy + 8 * k && Math.abs(x + 0.5 - qx - u * 4 * k * s) < 1.8 * k - u * 0.6 * k ? [0.2, 0, 0.8] : null; }, { motif: MECHES });
    t.forme('poilClair', ellipsoide(qx + 4 * k * s, qy + 8 * k, 1.4 * k, 1.2 * k), { decalage: 0.1, bord: false });
  });
  // les pattes arrière (debout) ou repliées (couché)
  for (const w of [-4 * k, 4 * k]) part(-8 * k, w, () => {
    const px = X(-8 * k, w), devant = prof(-8 * k, w) >= 0;
    if (couche) t.forme('poil', ellipsoide(px + s * 3 * k, sol - 2 * k, 4 * k * Math.max(0.5, Math.abs(s)) + 1.5 * k, 2.2 * k), { decalage: devant ? 0 : -0.4 });
    else patte(px, sol - haut + 3 * k, sol, devant);
  });
  // le corps (un ellipsoïde allongé, le dos un peu plus haut aux épaules), le poitrail blanc
  part(0, 0, () => {
    t.forme('poil', ellipsoide(X(0, 0), sol - haut + 1.5 * k, largeur(16 * k, 8 * k), (couche ? 6.5 : 7.5) * k), { motif: MECHES });
    t.forme('poilClair', ellipsoide(X(9 * k, 0), sol - haut + 4.5 * k, largeur(4.5 * k, 5 * k), 3.4 * k), { decalage: 0.2, bord: false, ombre: false });
  });
  // les pattes avant : tendues devant (couché) ou droites (debout)
  for (const w of [-4 * k, 4 * k]) part(9 * k, w, () => {
    const px = X(9 * k, w), devant = prof(9 * k, w) >= 0;
    if (couche) { cylindre(t, 'poil', [px, sol - 5 * k], [X(14 * k, w), sol - 3 * k], 2.2 * k, { decalage: devant ? 0 : -0.4 }); cylindre(t, 'feu', [X(14 * k, w), sol - 3 * k], [X(17 * k, w), sol - 2 * k], 2 * k, { decalage: devant ? 0 : -0.4 }); t.forme('poilClair', ellipsoide(X(18 * k, w), sol - 1.5 * k, 2.8 * k, 1.4 * k), { decalage: 0.1 }); }
    else patte(px, sol - haut + 3 * k, sol, devant);
  });
  // le cou, épais, puis la tête : large, les oreilles tombantes, le museau blanc, les joues feu
  const ty = couche ? sol - 16 * k : sol - haut - 5 * k;
  part(14 * k, 0, () => {
    cylindre(t, 'poil', [X(9 * k, 0), sol - haut + 1 * k], [X(15 * k, 0), ty + 3 * k], 4 * k);
    const cy = sol - haut + 0.5 * k + (couche ? -3 * k : 0);
    t.forme('collier', (x, y) => { const n = ellipsoide(X(12 * k, 0), cy, largeur(3 * k, 4.2 * k), 4 * k)(x, y); return n && Math.abs(y + 0.5 - cy) < 0.9 * k ? n : null; }, { decalage: 0.2, ombre: false });
    t.poser(Math.round(X(12 * k, 0) + s * 2 * k), Math.round(cy + 1.4 * k), 'or', 5);
  });
  part(18 * k, 0, () => {
    const hx = X(17 * k, 0);
    // les oreilles, derrière la tête, qui tombent de chaque côté (larges et arrondies)
    for (const w of [-5 * k, 5 * k]) { const ox = X(16 * k, w), devant = prof(16 * k, w) > 0; t.forme('poil', (x, y) => (y >= ty - 3 * k && y <= ty + 5 * k && Math.abs(x + 0.5 - ox) < 2.2 * k - Math.max(0, y - ty - 2 * k) * 0.35 - Math.max(0, ty - 2 * k - y) * 0.6 ? [Math.sign(w) * c * 0.6, 0, 0.7] : null), { decalage: devant ? -0.3 : -0.7, motif: MECHES }); }
    // la tête, large et ronde
    t.forme('poil', ellipsoide(hx, ty, largeur(6.5 * k, 6.5 * k) + 0.5 * k, 6 * k), { motif: MECHES });
    // les joues feu, de chaque côté du museau
    for (const w of [-3.6 * k, 3.6 * k]) { if (prof(19 * k, w) < -2.5 * k) continue; t.forme('feu', ellipsoide(X(20 * k, w), ty + 1.8 * k, 1.6 * k, 1.5 * k), { bord: false, ombre: false, decalage: 0.1 }); }
    // la liste blanche qui descend du front au museau (visible de face et de biais)
    if (c > 0.3) t.forme('poilClair', (x, y) => (y >= ty - 5 * k && y <= ty + 2 * k && Math.abs(x + 0.5 - X(21 * k, 0)) < 1.1 * k + Math.max(0, y - ty) * 0.35 ? [0, 0, 0.9] : null), { bord: false, ombre: false, decalage: 0.2 });
    // le museau, qui avance vers la tête du chien (+L), blanc dessous, et la truffe au bout
    const mx = X(22.5 * k, 0);
    t.forme('poil', ellipsoide(mx, ty + 2 * k, largeur(4 * k, 3.2 * k) + 0.4 * k, 2.6 * k), { decalage: 0.1 });
    t.forme('poilClair', ellipsoide(mx + s * 0.5 * k, ty + 3 * k, largeur(3.5 * k, 2.6 * k), 1.4 * k), { decalage: 0.3, bord: false, ombre: false });
    const nx = X(26 * k, 0);
    t.forme('truffe', ellipsoide(nx, ty + 0.8 * k, 1.5 * k, 1.2 * k), { ombre: false }); t.poser(Math.round(nx - 0.5 * k), Math.round(ty + 0.2 * k), 'truffe', 5);
    // la langue qui pend un peu
    for (let j = 0; j < 2 * k; j++) t.poser(Math.round(X(24 * k, 0.5 * k)), Math.round(ty + 3.8 * k) + j, 'langue', 3);
    // les yeux (sourcils feu au-dessus) : de chaque côté de la tête, visibles selon l'angle
    for (const w of [-3.4 * k, 3.4 * k]) { if (prof(17 * k, w) < -2 * k) continue; const ex = X(19 * k, w); t.forme('feu', ellipsoide(ex, ty - 3.2 * k, 1.3 * k, 0.8 * k), { bord: false, ombre: false }); t.forme('blanc', ellipsoide(ex, ty - 1.5 * k, 1 * k, 1.1 * k), { ombre: false, bord: false }); t.forme('pupille', ellipsoide(ex + s * 0.2 * k, ty - 1.4 * k, 0.6 * k, 0.85 * k), { ombre: false, bord: false }); t.poser(Math.round(ex - 0.3 * k), Math.round(ty - 1.9 * k), 'blanc', 5); }
  });
  parts.sort((a, b) => a[0] - b[0]);
  for (const [, dessin] of parts) dessin();
  t.contour();
  return t;
}

function chienHD(scene, vue = 'profil', couche = false) {
  const cle = `chien_${couche ? 'couche_' : ''}${vue}`;
  if (!scene.textures.exists(cle)) dessinerChienVue(vue, couche).texture(scene, cle);
  return cle;
}
