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
  vampire: { peau: 0xf2f0f6, yeux: 0xc02020, fente: true, oreilles: 'pointues', dents: 'canines', nez: 0.9, cape: 0x3a0a14, cheveux: 'plaque', levres: 0x6a2030 },
  // La momie : enroulée de bandelettes de la tête aux pieds, deux lueurs dans la fente des yeux
  momie: { peau: 0x5a4a3a, yeux: 0xe8b830, oreilles: null, bandelettes: 0xcfc6a6, cheveux: false, nez: 0.8 },
  // Le troll des montagnes : une énorme tête, un nez immense qui pend, des cheveux hirsutes et de la
  // mousse, de longs bras d'orang-outan, de grands pieds nus griffus (pas de défenses)
  troll: { peau: 0x8a8274, yeux: 0x6a4a20, oreilles: 'pointues', nez: 3.2, nezBas: true, sourcil: 1.8, cheveux: 'hirsute', poils: 0x5a5248, mousse: 0x5a6a2a, fourrure: 47, brasLongs: true, grandesMains: true, griffes: true, jambes: 'peau', pattes: 'peau', touffu: 1, sourire: true },
  // Le panda : gros et touffu, des pattes noires, les taches autour des yeux
  panda: { peau: 0xf0ece4, yeux: 0x2a1a10, oreilles: 'rondes', museau: 0xf0ece4, truffe: true, taches: 0x201c1c, fourrure: 53, cheveux: false, nez: 0, bas: 0x24201e, jambes: 'noir', pattes: 'noir', mains: 'noir', touffu: 2 },
};
// (v0.98) Les femmes des peuples de l'ombre : des cheveux à elles (la queue de cheval de la gobeline et
// de l'orc, la longue chevelure de la vampire, la crinière de la louve), des cils, des boucles
// d'oreilles ; la trollesse garde sa tignasse, la momie porte un diadème d'or
const FEMININ_OMBRE = {
  gobelin: { cheveux: undefined, coiffure: 'queue', teinte: 0x2a1622, sourire: false },
  orc: { cheveux: undefined, coiffure: 'queue', teinte: 0x1a1210, carre: false, sourcil: 1 },
  vampire: { cheveux: undefined, coiffure: 'long', teinte: 0x16101c, meches: true, levres: 0xa01830 },
  loupgarou: { cheveux: undefined, coiffure: 'long', teinte: 0xd8d8e2, fleurs: 0x8a6ae8 },
  troll: { sourcil: 1.2, nez: 2.5, fleurs: 0xf07aa8, peau: 0xbcb8ae },
  momie: { diademe: true, rose: true },
};

// Les Bannis ont l'air fâché tant qu'ils ne te connaissent pas (le joueur est du côté de la lumière
// au départ) ; une fois amis, ou quand ton comptoir penche franchement vers l'ombre, leur visage s'adoucit.
function banniFache(personne) {
  if (!personne || typeof PEUPLES_OMBRE === 'undefined' || !PEUPLES_OMBRE.includes(personne.race)) return false;
  const G = typeof window !== 'undefined' && window.GAME;
  if (personne.vieux) return false;   // (les aînés ont le regard calme de ceux qui ont tout vu)
  if (!G || !personne.nom) return true;
  const ami = ((G.relations || {})[personne.nom] || 0) >= 8;
  return !(ami || (typeof palierCamp === 'function' && palierCamp(G) <= -2));
}

// Une couleur qui grisonne (les aînés) : on la mêle à un gris clair.
function grisonner(c, f = 0.7) {
  const m = (a, b) => Math.round(a + (b - a) * f);
  return (m(c >> 16 & 255, 0xd2) << 16) | (m(c >> 8 & 255, 0xd2) << 8) | m(c & 255, 0xd6);
}

// La momie très vieille : des taches de moisissure sur ses bandelettes (k : la taille d'un pixel).
function moisirBandelettes(t, k = 1) {
  t.rampes.moisi = rampe(0x6a6a34);
  for (let y = 0; y < t.h; y++) for (let x = 0; x < t.l; x++) {
    if (t.mat(x, y) !== 'bande') continue;
    const n = fbm(x * 0.16 / k, y * 0.16 / k, 91);
    if (n > 0.66 && hachage(x, y, 3) > 0.25) t.poser(x, y, 'moisi', n > 0.74 ? 2 : n > 0.7 ? 3 : 4);
    else if (n > 0.62 && hachage(x, y, 5) > 0.55) t.poser(x, y, 'moisi', 4);   // (le bord de la tache, piqueté)   // (le bord de la tache, qui jaunit)
  }
}
// ... et une toile d'araignée : des fils en éventail depuis un coin (angles en degrés, à l'écran),
// reliés par des fils qui pendent un peu. Dessinée par-dessus le contour, fine comme un vrai fil.
function toileAraignee(t, ax, ay, r, de, a, k = 1) {
  t.rampes.toile = rampe(0xd8d8e2);
  const fils = 4, rad = d => d * Math.PI / 180;
  const pt = (i, u) => { const ang = rad(de + (a - de) * i / (fils - 1)); return [ax + Math.cos(ang) * r * u, ay + Math.sin(ang) * r * u]; };
  const trait = ([x0, y0], [x1, y1], creux = 0) => {
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 1.5);
    for (let j = 0; j <= n; j++) { const u = j / n, x = Math.round(x0 + (x1 - x0) * u), y = Math.round(y0 + (y1 - y0) * u + Math.sin(u * Math.PI) * creux); if (t.dans(x, y)) t.poser(x, y, 'toile', t.mat(x, y) ? 5 : 3); }
  };
  for (let i = 0; i < fils; i++) trait([ax, ay], pt(i, 1));
  for (const u of [0.45, 0.9]) for (let i = 0; i < fils - 1; i++) trait(pt(i, u), pt(i + 1, u), 0.12 * r * u);
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
// (v0.58) Le réglage du contour des personnages : nombre de tours de noir autour de la silhouette,
// et nettoyage des pixels isolés qui dépassent (avant de cerner).
const CONTOUR_CORPS = { tours: 2, nettoyer: false };   // (v0.58 : le joueur a choisi B, un contour plus épais)
function nettoyerSilhouette(t) {
  for (let passe = 0; passe < 2; passe++) {
    const vides = [];
    for (let y = 0; y < t.h; y++) for (let x = 0; x < t.l; x++) {
      if (t.c[y * t.l + x] === null) continue;
      const voisins = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => t.dans(x + dx, y + dy) && t.c[(y + dy) * t.l + x + dx] !== null).length;
      if (voisins <= 1) vides.push(y * t.l + x);
    }
    for (const i of vides) { t.c[i] = null; t.m[i] = null; }
  }
}
function contourEpais(t, tours = 1) {
  if (CONTOUR_CORPS.nettoyer) nettoyerSilhouette(t);
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
const BARBES_VOLUME = ['sage'];
const TAILLE_ARMES_PORTEES = 1.3;   // (v1.04 : la taille des armes que portent les voyageurs, par rapport au corps)   // (les barbes qu'on dessine avec leur profondeur : voir le visage)
// (planches 85 et 86) Des options en plus pour un seul dessin, qu'on ne peut pas passer par l'appelant (le joueur passe par
// dessinerJoueurHD) : voir avecOptionsCorps (rigHD.js). null le reste du temps.
let OPTIONS_CORPS_EN_PLUS = null;
function dessinerCorpsVue(g, tenue = 1, costume = null, pas = 0, pose = null, vue = 'troisQuarts', options = {}) {
  const k = FINESSE;
  // --- (planches 85 et 86) Le corps posé : des options, toutes facultatives (sans elles, le dessin ne change pas) ---
  //   membres : { brasP, brasL, jambeP, jambeL } (P le côté proche, L le lointain) : un objet, ou une fonction(ctx), qui place
  //     l'épaule, le coude et la main ({ epaule, coude, main }), ou la hanche, le genou et le pied ({ hanche, genou, pied,
  //     leve, bout (-1 : le pied pointe en arrière, à genoux), semelle (de dos : la semelle du talon qui se lève) }) ;
  //   bob : le corps qui descend (la marche) ; yeuxFermes ; boucheForcee (0 à 3), souffle, baille : la bouche ;
  //   armeMain(ctx) : l'arme en action, dessinée dans la main de devant (ctx.segBras pour l'autre main : l'arc, le bouclier) ;
  //   margeHaut, margeL : la place d'une arme levée ou d'un bras tendu ;
  //   ordreBras : { P, L } = 'devant' ou 'derriere' : de face ou de dos, le bras qui vient vers nous passe devant le torse ;
  //   rig : la toile garde ses couches (ToileRig, rigHD.js), pour tourner ensuite le buste, la tête ou tout le corps.
  if (OPTIONS_CORPS_EN_PLUS) options = { ...options, ...OPTIONS_CORPS_EN_PLUS };
  const MEMBRES = options.membres || null, BOB = options.bob || 0, MARGE_H = Math.round(options.margeHaut || 0), MARGE_L = Math.round(options.margeL || 0);
  const ORDRE_BRAS = options.ordreBras || null;
  const atours = options.atours || {};   // (v1.02 : le métal et la coiffe d'un Gardien du Conseil)
  g = { ...g };
  const race = PROPORTIONS[g.race] ? g.race : 'humain';
  const P0 = options.proportions || PROPORTIONS[race];   // (v1.32 : le joueur adulte a les siennes)
  const P = { H: P0.H * k, ep: P0.ep * k, torse: P0.torse * k, rx: P0.rx * k, ry: P0.ry * k, membre: P0.membre || 1 };
  const th = ANGLES_VUE[vue] ?? ANGLES_VUE.troisQuarts;
  const c = Math.cos(th), s = Math.sin(th);
  const dos = vue === 'dos';
  const L = 52 * k + 2 * MARGE_L;
  // (v0.58) + une marge en haut : sans elle, le sommet du crâne (cheveux, contour) touchait le bord
  // de l'image et paraissait coupé à plat
  const coiffe = (race === 'magicienne' || costume === 'sage' ? 14 : race === 'nain' ? 4 : costume === 'banquier' ? 10 : costume === 'noble' || costume === 'colporteur' || costume === 'pirate' ? 8 : costume === 'garde' ? 2 : costume === 'gardeRoyal' ? 14 : costume === 'mainNoire' ? 10 : costume === 'serpent' ? 3 : costume === 'cambrioleur' ? 4 : costume === 'joueur' && (options.tenue || []).includes('chapeau') ? 7 : costume === 'joueur' && typeof COIFFURES_HD !== 'undefined' && COIFFURES_HD[g.coiffure] ? (COIFFURES_HD[g.coiffure].marge || 0) : 0) * k + (pose === 'leves' || pose === 'epaules' || pose === 'grimpe1' || pose === 'grimpe2' ? 12 * k : 0) + 3 * k;
  const H = P.H + coiffe + MARGE_H;
  const t = options.rig && typeof ToileRig !== 'undefined' ? new ToileRig(L, H) : new ToileHD(L, H);
  t.partie = 'corps';   // (la partie du corps qu'on dessine : le rig la fait tourner autour de son articulation)
  t.relief = true;
  t.cel = true;
  const cx = L / 2;
  const f = g.feminin;
  const ombreF = f ? FEMININ_OMBRE[race] : null;
  const T = ombreF ? { ...TRAITS_PEUPLES[race], ...ombreF } : TRAITS_PEUPLES[race] || {};
  if (ombreF && ombreF.coiffure) g = { ...g, coiffure: ombreF.coiffure, cheveux: ombreF.teinte };
  if (costume === 'mainNoire' || costume === 'serpent' || costume === 'cambrioleur') g = { ...g, coiffure: 'court', ...(costume === 'cambrioleur' ? { cheveux: 0x2a2018 } : {}) };   // (sous la capuche, sous le bonnet)
  if (T.cheveux !== undefined) g = { ...g, coiffure: T.cheveux === 'plaque' ? 'court' : 'chauve', barbe: T.barbe || null };   // (pas de cheveux longs derrière)
  const gobelin = costume === 'gobelin' || race === 'gobelin';
  const leves = pose === 'leves' || pose === 'epaules', grimpe = pose === 'grimpe1' || pose === 'grimpe2';
  const joueur = costume === 'joueur';
  const porte = id => joueur && (options.tenue || []).includes(id);
  // (v1.61) Un voyageur (ou un noble) porte en pied la tenue de son buste (torseHD, portraitsHD.js) : les mêmes pièces,
  // tirées de son gène ; le niveau n'y ajoute que des accessoires (sacoche, brassards, épaulières, cape, épée, dorures)
  const voyageurBuste = !costume || costume === 'noble';
  const armure = voyageurBuste && !!g.armure && T.cheveux === undefined && !['nain', 'hobbit', 'magicienne', 'elfe'].includes(race);   // (la brigandine)
  const tuniqueBuste = voyageurBuste && !armure && !['nain', 'hobbit', 'magicienne', 'elfe'].includes(race);   // (le gambeson, la capuche, la bandoulière)
  t.rampes.peau = T.peau ? rampeVive(T.peau) : gobelin ? rampeVive(0x6a9a3a) : PEAUX_VIVES[g.peau ?? 1] || PEAUX_VIVES[1];
  t.rampes.ivoire = rampe(0xe8dcb4); t.rampes.mousse = rampeVive(T.mousse || 0x5a6a2a); t.rampes.griffe = rampe(0x2a2420);
  if (T.poils) t.rampes.cheveux = rampeVive(T.poils);
  const fache = !!options.fache;
  const pensif = pose === 'pense';   // (v1.18) il pense : la main au menton, le regard qui monte
  // (v1.34, planche 59) les gestes du bivouac : manger (debout ou assis), boire à la gourde, se réchauffer les mains
  // au feu (assis, les deux mains tendues devant lui), dormir (les yeux fermés : la scène le couche)
  const mange = pose === 'mange' || pose === 'mangeAssis', boit = pose === 'boit', chauffe = pose === 'chauffe', dort = pose === 'dort';
  const assise = pose === 'assis' || pose === 'mangeAssis' || chauffe;
  // (v1.35, planche 60 v3) la stupeur : les yeux ronds, la pupille rétrécie, les sourcils tout en haut du front, la
  // bouche en O, les deux mains levées devant lui, paumes en avant (« Quoi ?! »)
  const stupeur = pose === 'stupeur';
  t.rampes.museau = rampeVive(T.museau || 0x5a4030); t.rampes.noir = rampeVive(T.taches || 0x201c1c); t.rampes.bande = rampe(T.bandelettes || 0xd8cfae); t.rampes.truffe = rampe(0x1a1410);
  t.rampes.cheveux = rampeVive(g.cheveux);
  // Les aînés : cheveux et poils gris, et la fourrure des bêtes qui blanchit un peu
  if (g.vieux) { t.rampes.cheveux = rampeVive(grisonner(T.poils || g.cheveux)); if (T.fourrure) t.rampes.peau = rampeVive(grisonner(T.peau, 0.35)); if (T.bandelettes) t.rampes.bande = rampe(0xb0a070); }
  // (v1.32, planche 57) la barbe peut avoir sa propre couleur (sinon, celle des cheveux)
  t.rampes.barbe = g.couleurBarbe ? rampeVive(g.vieux ? grisonner(g.couleurBarbe) : g.couleurBarbe) : t.rampes.cheveux;
  t.rampes.habit = rampeVive(g.habit);
  t.rampes.cape = rampeVive(T.cape || (race === 'elfe' && !voyageurBuste ? 0x8aa0b8 : g.cape || 0x4a3a2a));   // (v1.61 : l'elfe voyageur, la cape de son buste)
  t.rampes.iris = rampeVive(T.yeux || g.yeux || 0x4a3a20);
  t.rampes.lin = rampeVive(0xd8ccb0);
  t.rampes.bas = rampeVive(T.bas || g.bas || (race === 'elfe' ? 0x3a4a3a : race === 'hobbit' ? 0x8a6a40 : 0x5a4a3a));
  t.rampes.cuir = costume === 'mentor' ? rampe(0x4a3426) : rampeVive(0x6a3f22);   // (le cuir usé et sombre du rôdeur)
  t.rampes.metal = rampeVive(0x7a8498);
  t.rampes.tabard = rampeVive(g.garde ? 0x2a4a8a : g.habit);   // (v1.61) le tabard bleu des gardes de la Confrérie, comme en buste
  t.rampes.levres = levresPour(g.peau ?? 1, f);
  // (v1.61) le chapeau de la magicienne est de l'étoffe de sa robe, comme en buste
  t.rampes.chapeau = rampeVive(race === 'magicienne' ? g.habit : costume === 'banquier' ? 0x1a1a22 : costume === 'colporteur' ? 0x5a4630 : costume === 'noble' ? 0x4a1a3a : costume === 'pirate' ? 0x1c1a22 : g.habit);
  t.rampes.plume = rampeVive(0xf0e8d0); t.rampes.fourrure = rampeVive(0xe8e0d0); t.rampes.osier = rampeVive(0xb08a48); t.rampes.foulard = rampeVive(0xc03a30); t.rampes.laine = rampeVive(0x8a3030);
  t.rampes.levres = T.levres ? rampeVive(T.levres) : gobelin ? rampeVive(f ? 0xb84a5a : 0x8a3a34) : t.rampes.levres;
  t.rampes.feutre = rampeVive(0x4a3a2a); t.rampes.capeV = rampeVive(0x5a2a2a); t.rampes.bruyere = rampeVive(0x6a3a22); t.rampes.ruban = rampeVive(0x9a2a3a); t.rampes.echarpe = rampeVive(0xc04040);
  t.rampes.osM = rampeVive(0xe8dcc0); t.rampes.brumeC = rampeVive(0x8a8a9a); t.rampes.lanterneR = rampeVive(0xc81e18); t.rampes.capeU = rampeVive(0xe4e4ee); t.rampes.echarpeU = rampeVive(0x2a4a9a); t.rampes.paille = rampeVive(0xd0a040); t.rampes.fleurB = rampeVive(0xf4f0e8); t.rampes.fleurJ = rampeVive(0xf0c830); t.rampes.fleurR = rampeVive(0xe87aa0);   // (v1.00 : les atours de l'Union)
  t.rampes.bonnetH = rampeVive(0xc0302c); t.rampes.moufle = rampeVive(0x2e6a3a); t.rampes.echarpeH = rampeVive(0xc8302c);   // (v1.05 : les habits du Long Hiver)
  t.rampes.blanc = rampeVive(0xf4f0ea);
  t.rampes.pupille = [0x060608, 0x0c0c12, 0x14141c, 0x1c1c26, 0x2a2a36, 0x3a3a48];
  // (v0.61) Les deux bandes : la Main Noire en robe noire à capuche profonde, comme des spectres
  // (gantelets de fer sombre) ; le Serpent à deux têtes en archers des bois (capuche verte, gilet
  // de cuir sanglé, carquois, hautes bottes noires)
  if (costume === 'mainNoire') {
    t.rampes.habit = rampe(0x24222a); t.rampes.cape = rampe(0x1a181e); t.rampes.metal = rampeVive(0x5c606c); t.rampes.cuir = rampe(0x2a282e);
  } else if (costume === 'pirate') {
    // (v0.97, planche) le Passeur en capitaine pirate : long manteau bleu nuit à galons d'or, grande cape
    // rouge en lambeaux (à la Albator), écharpe rouge à la taille, bottes hautes
    t.rampes.habit = rampe(0x1e2236); t.rampes.cape = rampe(0x8a1616); t.rampes.cuir = rampe(0x2a1c14); t.rampes.bas = rampe(0x3a3440);
  } else if (costume === 'sage') {
    // (v1.02, dessin du joueur) le Grand Sage : la robe violette brodée d'or sur une robe d'ivoire, la grande
    // cape d'écailles de dragon rouges, la couronne d'or aux pierres bleues, le bâton torsadé au cristal
    t.rampes.cape = rampeVive(0xa02a22); t.rampes.lin = rampeVive(0xe8dcc0); t.rampes.cristal = rampeVive(0x70e8f8); t.rampes.batonS = rampeVive(0x6a4626);
    t.rampes.argent = rampeVive(0xc8ccd4); t.rampes.livre = rampeVive(0x5a3418); t.rampes.cuir = rampeVive(0x5a3420);
  } else if (costume === 'gardien') {
    // (v1.02) les Gardiens du Conseil : la robe aux couleurs de leur royaume, l'étole blanche du Conseil
    t.rampes.lin = rampeVive(0xece4d0); t.rampes.argent = rampeVive(0xc8ccd4); t.rampes.ecaille = rampeVive(0xb02a22); t.rampes.cristal = rampeVive(0x70c8f8);
  } else if (costume === 'champion') {
    // (v1.02) le Champion du Rempart, bras droit du Grand Sage : l'acier noirci, l'or, la cape d'écailles
    t.rampes.metal = rampeVive(0x3e3e4c); t.rampes.ecaille = rampeVive(0xb02a22); t.rampes.cuir = rampeVive(0x2a1c18);
  } else if (costume === 'givrin') {
    // (v1.05, planche 35) le Père Givrin, à la roue du Long Hiver : le manteau rouge bordé de fourrure blanche,
    // le large ceinturon noir à boucle d'or, le long bonnet à pompon
    t.rampes.fourrure = rampeVive(0xf4f2ee); t.rampes.cuir = rampeVive(0x24201e); t.rampes.bonnetH = rampeVive(0xb0242a);
  } else if (costume === 'gardeRoyal') {
    // (planche 75 v2, à valider) la garde de Pont-Royal : acier poli, surcot noir à l'emblème d'argent, casque haut à ailes
    t.rampes.metal = rampe(0x9298a6); t.rampes.habit = rampe(0x1c1c24); t.rampes.argent = rampeVive(0xdadee6); t.rampes.bas = rampe(0x26262e); t.rampes.cuir = rampe(0x2e2420); t.rampes.plume = rampeVive(0xf4f2ec); t.rampes.ecaille = rampeVive(0x9a2424);
  } else if (costume === 'duc') {
    // (planche 75 v2, à valider) le duc de Pont-Royal : robe de brocart lie-de-vin, grand manteau de fourrure grise, jabot cuivre, bagues
    t.rampes.habit = rampe(0x5a1a2a); t.rampes.cape = rampe(0x3e1e30); t.rampes.bas = rampe(0x2a1a14); t.rampes.fourrure = rampe(0x8e887c); t.rampes.lin = rampe(0xa85a3a); t.rampes.or = rampeVive(0xd8a838); t.rampes.rubis = rampeVive(0xc81828);
  } else if (costume === 'cambrioleur') {
    // (planche 63) le cambrioleur : bonnet noir, loup noir sur les yeux, pull rayé, pantalon sombre
    t.rampes.habit = rampe(0x2a2c36); t.rampes.lin = rampeVive(0xd8d4c8); t.rampes.bas = rampe(0x22242c); t.rampes.cuir = rampe(0x1e1a18);
    t.rampes.bonnetH = rampe(0x26282e); t.rampes.masque = rampe(0x0e0e12);
  } else if (costume === 'renegat') {
    // (planche 79, à valider) les pandas renégats, déserteurs de la Confrérie : son bleu passé, une cape grise, un foulard rouge sombre
    t.rampes.habit = rampe(0x3a5276); t.rampes.cape = rampe(0x3e4452); t.rampes.bas = rampe(0x2a2a32); t.rampes.foulard = rampe(0x7a2a26); t.rampes.or = rampeVive(0xd8a838); t.rampes.entaille = rampe(0x2a1a10);
  } else if (costume === 'serpent') {
    t.rampes.habit = rampe(0x4a6428); t.rampes.cape = rampe(0x34501e); t.rampes.cuir = rampe(0x26222a); t.rampes.bas = rampe(0x2a2630);
    t.rampes.gilet = rampeVive(0x6a4426); t.rampes.argent = rampeVive(0xc8ccd4); t.rampes.emeraude = rampeVive(0x2ec860); t.rampes.fleche = rampeVive(0xe8b020);
  }

  const cy = Math.round(coiffe + 1 + P.ry + BOB + MARGE_H);   // le centre de la tête (entier : les détails se posent pixel par pixel)
  const yT = Math.round(cy + P.ry - 1);       // le haut du torse
  const yB = Math.round(yT + P.torse);        // la taille
  const sol = H - 1;
  const solDebout = sol, solAssis = Math.round(yB + (sol - yB) * 0.52);   // (v0.68 : la hauteur du banc, pour la pose assise)
  const ep = P.ep;                         // la demi-largeur d'épaules
  const prof = ep * 0.55;                  // la demi-épaisseur du torse
  const longue = race === 'magicienne' || costume === 'mainNoire' || costume === 'sage' || costume === 'gardien' || costume === 'duc';    // la robe descend jusqu'aux pieds
  const manteau = race === 'elfe' || costume === 'colporteur' || costume === 'mentor' || costume === 'pirate' || costume === 'givrin';   // la tunique descend à mi-cuisse
  const capee = (tenue >= 3 && !joueur) || ['mentor', 'colporteur', 'mendiant', 'noble', 'passeur', 'renegat', 'mainNoire', 'pirate', 'sage', 'gardien'].includes(costume) || porte('cape') || porte('capeUnion') || !!T.cape
    || (race === 'elfe' && voyageurBuste);   // (v1.61) l'elfe a toujours sa cape drapée, comme en buste
  const aventurier = !costume || ['colporteur', 'mentor', 'mendiant', 'champion'].includes(costume);
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
  const forgeron = costume === 'forgeron' || costume === 'barbier';   // (v0.82) Aldo et Baba : tablier de cuir, manches retroussées (v1.48 : le barbier, tablier de lin blanc)
  // (v1.61) les manches du buste (brasBuste) : de mailles pour le nain, de lin pour le hobbit (sa chemise), d'étoffe pour le garde
  const matBras = (race === 'nain' && costume !== 'banquier' && costume !== 'gardien' && costume !== 'givrin' && !forgeron) || costume === 'gardeRoyal' ? 'metal'
    : race === 'hobbit' && (voyageurBuste || costume === 'garde') ? 'lin' : 'habit';
  const bras = (cote, devant) => {
    t.partie = cote === pres ? 'brasP' : 'brasL';
    const bal = pas ? (cote === pres ? pas : -pas) : 0;   // les bras se balancent avec la marche
    const epaule = [cote * (ep - 0.8 * k), 0.3 * k, yT + 2 * k];
    // Les bras levés : du coude écarté, les mains montent au-dessus de la tête (pour porter quelque chose)
    // (les longs bras du troll, comme un orang-outan : les mains pendent presque aux genoux)
    const long = T.brasLongs && !leves;
    const coude = leves ? [cote * Math.max(ep + 2.5 * k, P.rx * 1.15), 1 * k, yT - 5 * k] : [cote * (ep + (long ? 2.2 : 1.2) * k), (-0.8 + bal * 1.5) * k, long ? yT + P.torse * 0.68 : yT + P.torse * 0.5];
    const main = leves ? [cote * Math.max(6.5 * k, P.rx * 1.05), 2 * k, cy - P.ry - 7 * k]   /* (v0.94 : au-dessus d'une grosse tête, les mains s'écartent) */ : [cote * (ep + (long ? 2.2 : 0.6) * k), (1 + bal * 3.5) * k, long ? yB + (sol - yB) * 0.48 : yB + (1.5 - Math.abs(bal) * 0.5) * k];
    // Les aînés : le bras de la canne bien plié, le coude écarté en arrière, la main en avant qui
    // appuie de tout son poids sur le pommeau
    if (g.vieux && devant && !leves && pose !== 'baluchon') {
      coude.splice(0, 3, cote * (ep + 2.6 * k), -1.8 * k, yT + P.torse * (long ? 0.6 : 0.42));
      main.splice(0, 3, cote * (ep + 1.4 * k), 4 * k, long ? yB + (sol - yB) * 0.28 : yB - 1.5 * k);
    }
    // (v0.68) Le baluchon sur l'épaule : le bras proche se plie, la main tient le bâton devant la
    // poitrine (elle ne se balance plus avec la marche) ; l'autre bras, lui, continue de balancer
    if (costume === 'sage' && devant && !leves && !pose) {
      // (de profil, le bâton est tenu devant lui : il ne passe plus devant son visage)
      const avant = Math.abs(s) > 0.9 ? P.rx + 4 * k : 0;
      coude.splice(0, 3, cote * (ep + 4.5 * k), 1 * k + avant * 0.5, yT + P.torse * 0.5); main.splice(0, 3, cote * (ep + 7 * k), 2 * k + avant, yT + 3 * k);
    }
    if (pose === 'accueil') {   // (v0.71) les bras grands ouverts, paumes vers le ciel : « Bienvenue, l'ami ! »
      coude.splice(0, 3, cote * (ep + 7.5 * k), 0.8 * k, yT + 0.5 * k);   // (v0.72) levés en V, comme on salue
      main.splice(0, 3, cote * Math.min(ep + 16 * k, L / 2 - 2.5 * k), 1.6 * k, yT - 7 * k);   // un vieil ami
    }
    if (assise) {   // (v0.68) assis : les mains posées sur les cuisses
      coude.splice(0, 3, cote * (ep + 0.8 * k), 1 * k, yT + P.torse * 0.62);
      main.splice(0, 3, cote * ep * 0.55, (solAssis - yB) * 0.55, yB);
    }
    if (pose === 'baluchon' && devant) {
      coude.splice(0, 3, cote * (ep + 0.8 * k), 1.2 * k, yT + P.torse * 0.62);
      main.splice(0, 3, cote * ep * 0.55, 5.2 * k, yT + 4 * k);
    }
    // (v1.00) grimper (au mât de cocagne, à une corde...) : une main tout en haut, au-dessus de la tête,
    // l'autre plus bas, à hauteur du visage ; « grimpe1 » et « grimpe2 » échangent les deux mains
    if (grimpe) {
      const hautMain = (cote === pres) === (pose === 'grimpe1');
      if (hautMain) { coude.splice(0, 3, cote * (ep + 0.8 * k), 1.5 * k, cy - P.ry - 1 * k); main.splice(0, 3, cote * 0.8 * k, 2.5 * k, cy - P.ry - 11 * k); }
      else { coude.splice(0, 3, cote * (ep + 3.5 * k), 1 * k, yT + 5 * k); main.splice(0, 3, cote * 1.4 * k, 2.5 * k, yT + 1 * k); }
    }
    // (v1.01) le porteur (un père, son enfant sur les épaules) : les coudes écartés, les avant-bras qui
    // remontent, les mains posées en haut des épaules, sur les jambes de l'enfant
    if (pose === 'porteur') { coude.splice(0, 3, cote * (ep + 3.2 * k), -0.5 * k, yT + 6 * k); main.splice(0, 3, cote * (ep + 0.6 * k), 1 * k, yT - 1 * k); }
    // (v1.15) empoigner (le videur qui tient un filou par le col) : le bras du côté où il regarde, tendu devant
    // lui, la main à hauteur d'épaule ; l'autre bras reste le long du corps
    if (pose === 'empoigne' && cote === loin) {
      const u = Math.min(ep + 9 * k, L / 2 - 4 * k);
      coude.splice(0, 3, cote * (ep + 4 * k), 2 * k, yT + 3 * k); main.splice(0, 3, cote * u, 3 * k, yT - 1 * k);
    }
    // (v1.15) le plateau (au bar) : le bras du côté où il regarde, plié, la main ouverte à hauteur d'épaule,
    // écartée de la tête, sous le plateau ; l'autre bras reste le long du corps
    // (v1.18) il pense : le bras proche plié, le poing sous le menton (redessiné par-dessus la tête plus bas)
    if (pensif && cote === pres) { coude.splice(0, 3, cote * (ep + 1 * k), 2 * k, yT + P.torse * 0.55); main.splice(0, 3, cote * 1.2 * k, P.rx * 0.95, cy + P.ry + 1.9 * k); }
    // (v1.34) manger, boire : le bras proche plié, la main (et ce qu'elle tient) à la bouche ; pour boire, le coude
    // monte plus haut (la gourde se lève) ; se réchauffer : les deux avant-bras tendus devant, paumes vers le feu
    if ((mange || boit) && cote === pres) { coude.splice(0, 3, cote * (ep + (boit ? 2.4 : 1.2) * k), (boit ? 3.2 : 2.6) * k, boit ? yT + 0.5 * k : yT + P.torse * 0.45); main.splice(0, 3, cote * 0.6 * k, P.rx * 1.05, cy + P.ry * (boit ? 0.3 : 0.55)); }
    if (stupeur) { coude.splice(0, 3, cote * (ep + 4.5 * k), 1.5 * k, yT + P.torse * 0.4); main.splice(0, 3, cote * Math.min(ep + 8 * k, L / 2 - 3 * k), 2.5 * k, yT - 2.5 * k); }
    if (chauffe) { coude.splice(0, 3, cote * ep * 0.95, P.rx * 0.7, yT + P.torse * 0.6); main.splice(0, 3, cote * ep * 0.5, P.rx * 1.35 + 4 * k, yT + P.torse * 0.38); }
    if (pose === 'plateau' && cote === loin) { coude.splice(0, 3, cote * (ep + 5 * k), 1 * k, yT + 5 * k); main.splice(0, 3, cote * Math.min(ep + 9 * k, L / 2 - 4 * k), 1 * k, yT - 2 * k); }
    // (planches 85 et 86) le bras posé à la main : options.membres.brasP / brasL
    const mb = MEMBRES && MEMBRES[cote === pres ? 'brasP' : 'brasL'];
    if (mb) {
      const r0 = typeof mb === 'function' ? mb({ k, ep, yT, yB, sol, cy, P, cote, s, c, L, pres, loin, epaule, coude, main }) : mb;
      if (r0) { if (r0.epaule) epaule.splice(0, 3, ...r0.epaule); if (r0.coude) coude.splice(0, 3, ...r0.coude); if (r0.main) main.splice(0, 3, ...r0.main); }
    }
    const E = [X(epaule[0], epaule[1]), epaule[2]], C = [X(coude[0], coude[1]), coude[2]], M = [X(main[0], main[1]), main[2]];
    const r = 2.6 * k * P.membre;
    const dec = devant ? 0 : -0.5;
    segBras.push([E, C, M, r]);
    cylindre(t, matBras, E, C, r, { decalage: dec });
    // L'avant-bras : manche retroussée (novice), manche plus claire (aguerri), brassard de cuir (vétéran et plus)
    const matAvant = costume === 'sage' ? 'argent' : forgeron ? 'peau' : costume === 'serpent' ? 'gilet' : matBras === 'metal' ? 'metal' : tenue >= 2 && aventurier && race !== 'hobbit' && race !== 'elfe' ? 'cuir' : (tenue === 0 || race === 'hobbit') && aventurier ? 'peau' : matBras;
    cylindre(t, matAvant, C, M, r - 0.3 * k, { decalage: dec + (matAvant === matBras ? 0.4 : 0.15) });
    if (tenue >= 2 && aventurier && race !== 'hobbit' && race !== 'elfe') for (let j = 0; j < 2; j++) t.forme('cuir', (x, y) => (Math.abs(y - (C[1] + (M[1] - C[1]) * (0.35 + j * 0.3))) < 0.6 * k && Math.abs(x + 0.5 - (C[0] + (M[0] - C[0]) * (0.35 + j * 0.3))) < r ? [0, 0, 1] : null), { decalage: -0.9, bord: false, ombre: false }); // les lanières
    if (costume === 'sage') for (let j = 1; j < 4; j++) { const px = C[0] + (M[0] - C[0]) * j / 4, py = C[1] + (M[1] - C[1]) * j / 4; t.poser(Math.round(px), Math.round(py), 'cristal', 5); t.poser(Math.round(px) + 1, Math.round(py) + 1, 'cristal', 3); }   // (les runes qui luisent)
    // La main : la paume et un pouce
    t.partie = cote === pres ? 'mainP' : 'mainL';
    const matMain = T.mains || (costume === 'mainNoire' ? 'metal' : costume === 'givrin' ? 'cuir' : porte('mouflesHiver') ? 'moufle' : 'peau'), gm = T.grandesMains ? 1.55 : 1;
    // (v1.05) le revers de fourrure au poignet : le manteau du Père Givrin, les moufles du Long Hiver
    if (costume === 'givrin' || porte('mouflesHiver')) { const px = C[0] + (M[0] - C[0]) * 0.82, py = C[1] + (M[1] - C[1]) * 0.82; t.forme('fourrure', ellipsoide(px, py, r + 0.5 * k, 1.5 * k), { decalage: dec + 0.2, motif: (x, y) => ((Math.floor(x / k) + Math.floor(y / k)) % 2 ? 0.35 : -0.15) }); }
    t.forme(matMain, ellipsoide(M[0], M[1] + 1 * k * gm, 2.2 * k * gm, 2.3 * k * gm), { decalage: dec + 0.1 });
    t.forme(matMain, ellipsoide(M[0] + cote * c * 1.6 * k * gm + s * 1.2 * k, M[1] + 0.6 * k, 0.9 * k * gm, 1.2 * k * gm), { decalage: dec + 0.3, ombre: false });
    if (T.griffes) for (const d of [-1, 0, 1]) for (let j = 0; j < Math.round(0.9 * k * gm); j++) t.poser(Math.round(M[0] + d * 1.1 * k * gm), Math.round(M[1] + 3.2 * k * gm) + j, 'griffe', j ? 2 : 4);
    if (devant) mainDevant = { M, C, r, matMain, matAvant, gm, cote };
    t.partie = 'corps';
  };
  let mainDevant = null;
  const segBras = [], segJambes = [];   // (v0.64) pour les plis des manches et des jambes
  // Où passe la cuisse proche à l'écran, à une hauteur donnée (pour dessiner le pli du tissu dessus)
  const rCuisse = 2.9 * k * P.membre;
  const cuisseX = (y) => { const bal = pas ? pas : 0; const v = Math.min(1, Math.max(0, (y - (yB - 1 * k)) / ((sol - yB) * 0.5))); return X(pres * ep * (0.42 + 0.03 * v), (bal * 2.2 + (bal > 0 ? 1 : 0)) * k * v); };
  const motifCuisse = (x, y) => { const d = Math.abs(x + 0.5 - cuisseX(y)); return d < rCuisse * 0.75 ? 0.35 : d < rCuisse * 0.75 + 0.7 * k ? -0.9 : 0; };
  const jambe = (cote, devant) => {
    t.partie = cote === pres ? 'jambeP' : 'jambeL';
    const bal = pas ? (cote === pres ? pas : -pas) : 0;   // la jambe qui avance
    const hanche = [cote * ep * 0.42, 0, yB - 1 * k];
    // (v0.68) assis : la cuisse à l'horizontale vers l'avant, le mollet qui descend jusqu'au sol (le
    // sol est alors à mi-hauteur de la jambe debout : c'est la hauteur du banc)
    const assis = assise, sol = assis ? solAssis : solDebout;
    const genou = assis ? [cote * ep * 0.45, (sol - yB) * 0.95, yB + 1 * k] : [cote * ep * 0.45, (bal * 2.2 + (bal > 0 ? 1 : 0)) * k, yB + (sol - yB) * 0.5];
    // Le pas : le pied avant reste posé au sol, c'est le talon arrière qui se décolle (à peine de
    // face, où l'on ne voit pas le pied partir en arrière)
    let leve = bal < 0 ? (Math.abs(s) < 0.3 ? 0.6 : 1.2) * k : 0;
    // (v1.00) grimper : le genou du côté de la main basse remonte (le pied cherche une prise), l'autre jambe pousse
    if (grimpe && !assis) {
      const plie = (cote === pres) !== (pose === 'grimpe1');
      if (plie) { genou.splice(0, 3, cote * ep * 0.8, 2.5 * k, yB + (sol - yB) * 0.22); }
      else genou.splice(0, 3, cote * ep * 0.36, 0.5 * k, yB + (sol - yB) * 0.5);
    }
    if (pose === 'epaules') genou.splice(0, 3, cote * (ep + 2.4 * k), 2 * k, yB + 2 * k);
    const piedGrimpe = grimpe && !assis ? ((cote === pres) !== (pose === 'grimpe1') ? [cote * ep * 0.3, 2 * k, yB + (sol - yB) * 0.55] : [cote * ep * 0.22, 1 * k, sol - 3 * k]) : null;
    const pied = pose === 'epaules' ? [cote * (ep + 2.4 * k), 3 * k, yB + 9 * k] : piedGrimpe || (assis ? [cote * ep * 0.48, (sol - yB) * 1.05, sol - 3 * k] : pose === 'accueil' ? [cote * ep * 0.85, 0.5 * k, sol - 3 * k] : [cote * ep * 0.48, bal * 3.8 * k, sol - 3 * k - leve]);   // (accueil : les jambes un peu écartées, bien campé)
    // (planches 85 et 86) la jambe posée à la main : options.membres.jambeP / jambeL
    let boutJ = 1, semelle = 0;
    const mj = MEMBRES && MEMBRES[cote === pres ? 'jambeP' : 'jambeL'];
    if (mj) {
      const r0 = typeof mj === 'function' ? mj({ k, ep, yT, yB, sol, P, cote, s, c, pres, loin, hanche, genou, pied }) : mj;
      if (r0) {
        if (r0.hanche) hanche.splice(0, 3, ...r0.hanche);
        if (r0.genou) genou.splice(0, 3, ...r0.genou);
        if (r0.leve !== undefined) { leve = r0.leve; pied[2] = sol - 3 * k - leve; }
        if (r0.pied) pied.splice(0, 3, ...r0.pied);
        if (r0.bout !== undefined) boutJ = r0.bout;
        if (r0.semelle) semelle = r0.semelle;
      }
    }
    const Hh = [X(hanche[0], hanche[1]), hanche[2]], G = [X(genou[0], genou[1]), genou[2]], Pd = [X(pied[0], pied[1]), pied[2]];
    const dec = devant ? 0 : -0.5;
    const r = 2.9 * k * P.membre;
    const matJambe = T.jambes || 'bas';
    segJambes.push([Hh, G, Pd, r]);
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
      t.forme('peau', ellipsoide(X(pied[0], pied[1] + 2 * k * boutJ), solPied - 1.5 * k, (3.6 + Math.abs(s) * 1.2) * k, 2 * k), { decalage: dec });
      if (race === 'hobbit') for (let j = 0; j < 4; j++) t.poser(Math.round(X(pied[0], pied[1] + (1 + j * 0.7) * k)), Math.round(solPied - 3 * k - (j % 2)), 'cheveux', 2);
    } else {
      // La botte : la tige jusqu'au genou, le revers, le pied qui pointe vers l'avant. De face, le
      // bout de la botte vient vers nous : un peu plus large et plus clair (on le voit de dessus).
      const botte = g.bottes ? 'bottes' : 'cuir';   // (v0.68 : le joueur choisit la couleur de ses bottes)
      if (g.bottes) t.rampes.bottes = rampeVive(g.bottes);
      cylindre(t, botte, G, Pd, r - 0.2 * k, { decalage: dec + 0.1 });
      const bout = X(pied[0], pied[1] + 3.4 * k * boutJ);
      const face = Math.max(0, 1 - Math.abs(s) / 0.7);   // (1 de face, 0 dès le trois-quarts)
      t.forme(botte, (x, y) => {
        if (y < solPied - 3 * k || y > solPied) return null;
        const bas = (y - (solPied - 3 * k)) / (3 * k);   // 0 en haut du pied, 1 à la semelle
        const elargi = face * bas * 0.9 * k;
        if (Math.abs(x + 0.5 - (Pd[0] + bout) / 2) >= Math.abs(bout - Pd[0]) / 2 + r - 0.5 * k + elargi) return null;
        return [(x + 0.5 - Pd[0]) / (4 * k), face ? -0.5 + bas * 0.9 : (y - solPied + 1.5 * k) / (2 * k), 0.8];
      }, { decalage: dec + face * 0.3 });
      t.forme(botte, (x, y) => (y >= G[1] + 1 && y <= G[1] + 1.5 * k && Math.abs(x + 0.5 - G[0]) < r + 0.3 * k ? [0, -0.6, 0.7] : null), { decalage: 0.6, bord: false, ombre: false });
      // (planche 85) de dos, le talon qui se lève montre sa semelle : le bas de la botte plus sombre
      if (semelle) for (let y = Math.round(solPied - semelle * k); y <= solPied; y++) for (let x = Math.round(Pd[0] - r - 1.5 * k); x <= Math.round(Pd[0] + r + 1.5 * k); x++) if (t.mat(x, y) === botte) t.poser(x, y, botte, y >= solPied - 0.6 * k ? 0 : 1);
    }
    t.partie = 'corps';
  };

  // Les pans du long manteau ouvert de Garrick, entre deux hauteurs (le haut avec le torse, le bas
  // par-dessus les jambes : il tombe jusqu'aux mollets)
  const pansManteau = (yMin, yMax) => {
    for (const cote of [-1, 1]) {
      if (Z(cote * ep, prof * 0.3) < -1 * k) continue;
      t.forme('cape', (x, y) => {
        if (y < yMin || y > yMax) return null;
        const u = cote * ep * (0.62 + Math.min(1, (y - yT) / (yB - yT)) * 0.2), bord = X(u, prof * 0.9);
        const ext = X(cote * (ep + 1 * k + Math.max(0, y - yB) * 0.15), prof * 0.2);
        const a = Math.min(bord, ext), b = Math.max(bord, ext);
        return x + 0.5 >= a && x + 0.5 <= b ? [cote * 0.5, 0, 0.85] : null;
      }, { decalage: -0.3, motif: (x, y) => (hachage(Math.floor(x / k), Math.floor(y / k), 53) > 0.88 ? -0.8 : 0) });
    }
  };
  // (v1.02) des écailles de dragon, en quinconce : le bord bas de chaque écaille sombre, son haut qui brille
  const ecailles = (x, y) => { const rang = Math.floor(y / (2.5 * k)), dx = x + 0.5 + (rang % 2) * 1.5 * k; const u = (dx % (3 * k)) / (3 * k) - 0.5, v = (y % (2.5 * k)) / (2.5 * k); return v > 0.74 - Math.abs(u) * 0.9 ? -1.2 : v < 0.35 && Math.abs(u) < 0.25 ? 0.8 : 0; };
  // --- 1. Derrière : la cape (sauf de dos), les cheveux longs, le bras et la jambe du côté éloigné ---
  const dessinerCape = (devant) => {
    t.forme(porte('capeUnion') ? 'capeU' : porte('cape') ? 'capeV' : 'cape', (x, y) => {
      if (y < yT + 1 * k || y > sol - 4 * k) return null;
      if ((costume === 'mendiant' || costume === 'mainNoire' || costume === 'pirate') && y > sol - (costume === 'pirate' ? 20 : 12) * k && hachage(Math.floor(x / k), 0, 77) * 10 * k > sol - y) return null; // le bas en lambeaux
      if ((costume === 'sage' || costume === 'champion') && y > sol - 6 * k && Math.abs(((x + 0.5) % (3 * k)) - 1.5 * k) * 2 > (sol - y)) return null;   // le bas en pointes d'écailles
      const demi = (ep + 1.5 * k + (y - yT) * 0.12) * (devant ? 1 : Math.max(0.55, c) + 0.1);
      const centre = devant ? cx : X(0, -prof * 0.9);
      const nx = (x + 0.5 - centre) / demi;
      return Math.abs(nx) <= 1 ? [nx * 0.6, 0.1, 0.8] : null;
    }, { decalage: -0.9, motif: costume === 'sage' || costume === 'champion' ? ecailles : (x) => (Math.floor(x / k) % 5 === 0 ? -0.5 : 0) });
    // Le liséré d'or de la cape des elfes et des légendes
    // (v1.61) ... d'argent chez l'elfe voyageur, comme sur son buste (l'or reste la dorure des légendes)
    if (race === 'elfe' || (tenue >= 4 && race !== 'hobbit')) {
      const bord = [];
      for (let y = yT + 1 * k; y <= sol - 4 * k; y++) for (let x = 0; x < L; x++) if (t.mat(x, y) === 'cape' && (t.mat(x - 1, y) !== 'cape' || t.mat(x + 1, y) !== 'cape' || y === sol - 4 * k)) bord.push([x, y]);
      const liser = race === 'elfe' && voyageurBuste && tenue < 4 ? 'metal' : 'or';
      for (const [x, y] of bord) t.poser(x, y, liser, liser === 'metal' ? 4 : 3);
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
  // (v1.04, idée du joueur) l'arme du voyageur, portée sur lui : dans le dos, à la main ou à la taille selon l'arme
  const arme = options.arme || null;
  const enMain = !pose && !leves && !grimpe;   // (avec le baluchon, assis, les bras levés : la lance et le bâton passent dans le dos)
  const placeArme = options.armeMain ? 'action' : !arme ? null : ['dague', 'rapiere', 'khopesh', 'fronde'].includes(arme) ? 'taille' : arme === 'griffes' ? 'mains'
    : (arme === 'lance' || arme === 'baton' || arme === 'massue') && enMain ? 'main' : arme === 'massue' ? 'taille' : 'dos';
  if (arme) { t.rampes.lameA = rampeVive(0xdce6f0); t.rampes.boisA = rampeVive(0x7a4a24); t.rampes.ferA = rampeVive(0x6a6e78); t.rampes.cordeA = rampeVive(0xe0d4b0); t.rampes.laitonA = rampeVive(0xd8a838); t.rampes.bambouA = rampeVive(0x8aa84a); t.rampes.gemmeA = rampeVive(0x70c8f8); }
  // Une arme le long d'un axe : `A` le bout du haut (la tête, la poignée), `B` le bout du bas
  const dessinerArmeAxe = (A, B) => {
    const kA = k * TAILLE_ARMES_PORTEES;   // (v1.04 : un peu plus grosses, pour qu'on les voie sur les petites silhouettes de la file)
    const dx = B[0] - A[0], dy = B[1] - A[1], l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l, nx = -uy, ny = ux;
    const P = (u, v) => [A[0] + ux * u + nx * v, A[1] + uy * u + ny * v];   // u : le long de l'arme depuis le haut, v : de côté
    if (arme === 'epee') {
      cylindre(t, 'lameA', P(6 * kA, 0), B, 1.1 * kA, { decalage: 0.3 });
      cylindre(t, 'ferA', P(5.2 * kA, -2.6 * kA), P(5.2 * kA, 2.6 * kA), 0.8 * kA, { decalage: 0.5 });   // la garde
      cylindre(t, 'boisA', P(1 * kA, 0), P(5 * kA, 0), 0.8 * kA, { decalage: 0.4 });                   // la poignée
      t.forme('ferA', ellipsoide(...P(0.4 * kA, 0), 1.1 * kA, 1.1 * kA), { decalage: 0.6 });            // le pommeau
    } else if (arme === 'hache' || arme === 'marteau' || arme === 'massue') {
      cylindre(t, 'boisA', P(2 * kA, 0), B, 0.8 * kA, { decalage: 0.3 });
      if (arme === 'hache') t.forme('lameA', (x, y) => { const rx = (x + 0.5 - A[0]) * ux + (y + 0.5 - A[1]) * uy, ry = (x + 0.5 - A[0]) * nx + (y + 0.5 - A[1]) * ny; return rx > 0.5 * kA && rx < 7 * kA && ry > 0 && ry < 4.5 * kA - Math.abs(rx - 3.8 * kA) * 0.35 ? [0.3, -0.3, 0.8] : null; }, { decalage: 0.5 });
      else if (arme === 'marteau') t.forme('ferA', (x, y) => { const rx = (x + 0.5 - A[0]) * ux + (y + 0.5 - A[1]) * uy, ry = (x + 0.5 - A[0]) * nx + (y + 0.5 - A[1]) * ny; return rx > 0.5 * kA && rx < 4.5 * kA && Math.abs(ry) < 3.4 * kA ? [ry / (3.4 * kA) * 0.6, -0.2, 0.8] : null; }, { decalage: 0.5 });
      else { t.forme('boisA', (x, y) => { const rx = (x + 0.5 - A[0]) * ux + (y + 0.5 - A[1]) * uy, ry = (x + 0.5 - A[0]) * nx + (y + 0.5 - A[1]) * ny; return rx > 0 && rx < 8 * kA && Math.abs(ry) < 1.2 * kA + (8 * kA - rx) * 0.22 ? [ry / (3 * kA), 0, 0.8] : null; }, { decalage: 0.5 }); for (const [u, v] of [[2, -1.6], [4, 1.4], [5.5, -1], [1.5, 1.2]]) t.forme('ferA', ellipsoide(...P(u * kA, v * kA), 0.6 * kA, 0.6 * kA), { decalage: 0.8, ombre: false }); }
    } else if (arme === 'arc') {
      // le bois de l'arc en arc de cercle, la corde tendue
      const n = 14; let prec = null;
      for (let i = 0; i <= n; i++) { const u = l * i / n, v = Math.sin(i / n * Math.PI) * 4 * kA, p = P(u, v); if (prec) cylindre(t, 'boisA', prec, p, 1.05 * kA, { decalage: 0.4 }); prec = p; }
      cylindre(t, 'cordeA', A, B, 0.3 * kA, { decalage: 0.2 });
      cylindre(t, 'cuir', P(l * 0.45, 4 * kA), P(l * 0.55, 4 * kA), 1.2 * kA, { decalage: 0.6 });   // la poignée
    } else if (arme === 'lance') {
      cylindre(t, 'boisA', P(5 * kA, 0), B, 0.7 * kA, { decalage: 0.3 });
      t.forme('lameA', (x, y) => { const rx = (x + 0.5 - A[0]) * ux + (y + 0.5 - A[1]) * uy, ry = (x + 0.5 - A[0]) * nx + (y + 0.5 - A[1]) * ny; return rx > 0 && rx < 6 * kA && Math.abs(ry) < Math.sin(rx / (6 * kA) * Math.PI) * 1.6 * kA + 0.2 ? [ry / (1.6 * kA) * 0.6, -0.3, 0.8] : null; }, { decalage: 0.6 });
    } else if (arme === 'baton' || arme === 'bambou') {
      cylindre(t, arme === 'bambou' ? 'bambouA' : 'boisA', P(1 * kA, 0), B, 0.9 * kA, { decalage: 0.3, motif: arme === 'bambou' ? (x, y) => (Math.floor(((x + 0.5 - A[0]) * ux + (y + 0.5 - A[1]) * uy) / k) % 6 === 0 ? -0.9 : 0) : null });
      if (arme === 'baton') { t.forme('boisA', ellipsoide(...P(1.2 * kA, 0), 1.8 * kA, 1.8 * kA), { decalage: 0.5 }); t.forme('gemmeA', ellipsoide(...P(1.2 * kA, 0), 1 * kA, 1 * kA), { decalage: 0.8, ombre: false }); }
    }
  };
  // Dans le dos : en travers, le haut au-dessus de l'épaule, le bas vers la hanche opposée (derrière lui)
  const armeDansLeDos = () => {
    const haut = Math.abs(s) > 0.3 && !dos ? pres : loin, basC = -haut;
    const long = arme === 'arc' || arme === 'lance' || arme === 'baton' || arme === 'bambou';
    const A = [X(haut * (ep + 3.5 * k), -prof * 1.5), Math.max(2, yT - (long ? 12 : 7) * k)];   // (bien en dehors de la tête et de l'épaule)
    const B = [X(basC * ep * 0.6, -prof * 1.5), Math.min(sol - 2, yB + (long ? 14 : 9) * k)];
    dessinerArmeAxe(A, B);
  };
  if (placeArme === 'dos' && !dos) armeDansLeDos();
  // Le carquois du Serpent, en travers du dos : on voit dépasser les empennages au-dessus de l'épaule
  if (costume === 'serpent' && !dos) {
    const A = [X(loin * ep * 0.6, -prof * 1.1), yT - 5 * k], B = [X(pres * ep * 0.5, -prof * 1.1), yB + 2 * k];
    cylindre(t, 'gilet', A, B, 2.2 * k, { decalage: -0.6 });
    for (const [d, h] of [[-1.4, 3], [0, 5], [1.4, 3.5]]) {
      const fx = A[0] + d * k, fy = A[1] - h * k;
      for (let j = 0; j < h * k; j++) for (let e = 0; e < Math.max(1, Math.round(0.6 * k)); e++) t.poser(Math.round(fx + e), Math.round(fy + j), 'cuir', 3);
      t.forme('fleche', ellipsoide(fx, fy + 1 * k, 1.1 * k, 1.8 * k), { decalage: 0.2 });
    }
  }
  // Le bâton noueux du mendiant, dans son dos
  if (costume === 'mendiant' && !dos) { const bx0 = X(ep + 3 * k, -1 * k); for (let y = yT - 6 * k; y < sol; y++) for (let e = 0; e < k; e++) t.poser(Math.round(bx0 + Math.sin(y / (6 * k)) * 0.6 * k) + e, y, 'cuir', Math.floor(y / k) % 6 === 0 ? 1 : 3); }
  // (v1.32, planche 57) les coupes de la création élargie : leur contexte de tête, et ce qui tombe dans le dos
  const coupeHD = typeof COIFFURES_HD !== 'undefined' && T.cheveux === undefined ? COIFFURES_HD[g.coiffure] : null;
  const apresCoiffure = [];   // (des détails à poser par-dessus la coiffure : les petites mèches du duc)
  const ctxTete = (extra = {}) => ({ t, k, cx, cy, P, s, c, X, Z, dos, yT, yB, loin, pres, race, f, ...extra });
  if (coupeHD && coupeHD.derriere && !dos) coupeHD.derriere(ctxTete());
  const longs = ['long', 'queue', 'chignon'].includes(g.coiffure) || race === 'elfe' || race === 'magicienne';
  if (longs && !dos) {
    const bas = g.coiffure === 'chignon' ? cy + 4 * k : race === 'elfe' || race === 'magicienne' ? yT + 10 * k : yT + 4 * k;
    const larg = P.rx + 1.2 * k - s * 2.5 * k;   // (de profil, la masse des cheveux tombe dans le dos, plus étroite)
    t.forme('cheveux', (x, y) => { const cc = X(0, -P.rx * (0.4 + s * 0.25)); return y >= cy - 4 * k && y <= bas && Math.abs(x + 0.5 - cc) < larg - Math.max(0, y - bas + 6 * k) * 0.5 ? [(x + 0.5 - cc) / (P.rx + 2 * k), 0, 0.8] : null; }, { decalage: -0.8, motif: MECHES });
  }
  const deFace = Math.abs(c) > 0.9;   // (de face, les deux côtés sont éclairés pareil)
  // (planche 85) options.ordreBras : de face ou de dos, un bras qui se balance vers nous passe devant le torse (dessiné avec
  // le bras de devant), celui qui s'en va passe derrière
  const brasArriere = dos ? pres : loin, brasAvant = dos ? loin : pres;
  const placeBras = (cote) => { const o = ORDRE_BRAS && ORDRE_BRAS[cote === pres ? 'P' : 'L']; return o === 'devant' ? 1 : o === 'derriere' ? 0 : cote === brasAvant ? 1 : 0; };
  const brasTardifs = [brasArriere, brasAvant].filter(cote => placeBras(cote) === 1);
  for (const cote of [brasArriere, brasAvant]) if (placeBras(cote) === 0) bras(cote, cote === brasAvant ? true : deFace);
  if (!dos) { if (!longue) { jambe(loin, deFace); jambe(pres, true); } } else { if (!longue) { jambe(pres, deFace); jambe(loin, true); } }

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
  t.forme(race === 'hobbit' ? 'lin' : 'habit', torse, { decalage: -0.1, motif: (x, y) => (!dos && Math.abs(x + 0.5 - X(0, prof)) < 0.6 * k && y > yT + 3 * k ? -0.6 : race === 'magicienne' && (Math.floor(x / k) * 7 + Math.floor(y / k) * 3) % 23 === 0 ? 0.9 : 0) });
  if (race === 'hobbit') t.forme('habit', (x, y) => { const n = torse(x, y); return n && y >= yT + 2 * k && Math.abs(x + 0.5 - X(0, prof * 0.9)) > 2 * k + Math.max(0, 6 * k - (y - yT)) * 0.5 ? n : null; }, { decalage: -0.2 });
  if ((race === 'nain' && costume !== 'banquier' && costume !== 'gardien' && costume !== 'givrin' && !forgeron) || costume === 'garde' || costume === 'gardeRoyal') t.forme('metal', (x, y) => { const n = torse(x, y); return n && y >= yT + 1 * k && y <= yB - 2 * k ? n : null; }, { motif: (x, y) => ((Math.floor(x / k) + Math.floor(y / k)) % 2 ? 0.3 : -0.3) });
  // (v1.61) Les pièces du buste. La brigandine (le voyageur en armure) : du cuir riveté en quinconce sur la tunique, qui
  // dépasse un peu sous l'ourlet, et le col de mailles
  const maille = (x, y) => ((Math.floor(x / k) + Math.floor(y / k)) % 2 ? 0.5 : -0.5);
  if (armure) {
    t.forme('cuir', (x, y) => { const n = torse(x, y); return n && y <= yB + 0.5 * k ? n : null; }, { decalage: -0.5 });
    if (!dos) for (let y = Math.round(yT + 4 * k), r = 0; y < yB - 3 * k; y += Math.round(2.5 * k), r++) for (let x = (r % 2) * Math.round(1.25 * k); x < L; x += Math.round(2.5 * k)) {
      if (t.mat(x, y) !== 'cuir' || t.mat(x + 1, y + 1) !== 'cuir' || t.mat(x - 1, y) !== 'cuir' || !torse(x, y)) continue;
      t.poser(x, y, 'metal', 5); t.poser(x + 1, y + 1, 'metal', 1);
    }
    t.forme('metal', (x, y) => (y >= yT && y <= yT + 2.5 * k && torse(x, y) && Math.abs(x + 0.5 - X(0, prof * 0.4)) < section(4.5 * k, prof * 0.8) ? [(x + 0.5 - cx) / (5 * k), -0.2, 0.8] : null), { decalage: -0.3, motif: maille });
  }
  // Le gambeson du voyageur : matelassé de coutures droites, la capuche rabattue sur les épaules (couleur de la cape) ;
  // l'orc et le troll ont à la place un épais col de fourrure
  if (tuniqueBuste) {
    if (!dos) for (let y = Math.round(yT + 5 * k); y < yB - 2 * k; y++) for (const d of [-4, -1.5, 1.5, 4]) { const x = Math.round(X(d * k, prof)); if (t.mat(x, y) === 'habit' && Math.abs(x + 0.5 - X(0, prof)) > 0.8 * k) t.poser(x, y, 'habit', Math.max(0, t.teinte(x, y) - 1)); }
    const col = (h) => (x, y) => { const n = torse(x, y); return n && y <= yT + h * k - Math.abs(x + 0.5 - X(0, prof * 0.3)) / ep * 1.4 * k ? [n[0], -0.3, 0.8] : null; };
    if ((race === 'orc' || race === 'troll') && !f) {
      t.rampes.colFourrure = rampeVive(race === 'troll' ? 0x5a5248 : 0x5a4636);
      t.forme('colFourrure', col(4), { decalage: -0.2, motif: (x, y) => ((Math.floor(x / k) * 3 + Math.floor(y / k) * 5) % 7 === 0 ? -0.9 : (Math.floor(x / k) + Math.floor(y / k)) % 5 === 0 ? 0.6 : 0) });
    } else t.forme('cape', col(3.4), { decalage: -0.3 });
  }
  if (costume === 'garde' && !dos) {
    // Le tabard bleu de la Confrérie, son soleil d'or, et le pan qui tombe devant les cuisses
    const larg = ep * 0.62 * Math.max(0.55, Math.abs(c));
    t.forme('tabard', (x, y) => { const n = torse(x, y); return (n || (y > yB - 2 * k && y < yB + 6 * k)) && y >= yT + 2 * k && Math.abs(x + 0.5 - X(0, prof)) < larg ? (n || [0, 0.2, 0.9]) : null; }, { decalage: 0.05 });   // (v1.61 : son étoffe à lui, voir t.rampes.tabard)
    const sx = X(0, prof), sy = yT + P.torse * 0.42;
    t.forme('or', ellipsoide(sx, sy, 1.6 * k * Math.max(0.6, Math.abs(c)), 1.6 * k), { decalage: 0.3, ombre: false });
    for (const [dx, dy] of [[0, -2.8], [0, 2.8], [-2.6, 0], [2.6, 0], [-2, -2], [2, -2], [-2, 2], [2, 2]]) t.poser(Math.round(sx + dx * k * Math.max(0.6, Math.abs(c))), Math.round(sy + dy * k), 'or', 4);
    for (let x = Math.round(X(0, prof) - larg); x <= X(0, prof) + larg; x++) t.poser(x, Math.round(yB + 6 * k) - 1, 'or', 3);
  }
  // (planche 63) le pull rayé du cambrioleur : une bande claire sur deux, sur le torse et les bras
  if (costume === 'cambrioleur') for (let y = yT; y < yB + 3 * k; y++) if (Math.floor((y - yT) / (2 * k)) % 2 === 1) for (let x = 0; x < L; x++) if (t.mat(x, y) === 'habit') t.poser(x, y, 'lin', t.teinte(x, y));
  // La Main Noire : la robe en lambeaux jusqu'au sol, ses plis, une chaîne de fer pour ceinture
  if (costume === 'mainNoire') {
    for (let y = sol - 8 * k; y <= sol; y++) for (let x = 0; x < L; x++) if (t.mat(x, y) === 'habit' && hachage(Math.floor(x / k), 0, 41) * 8 * k > sol - y + 1) { t.c[y * L + x] = null; t.m[y * L + x] = null; }
    if (!dos) for (const d of [-6, -3, 0, 3, 6]) for (let y = yB + 2 * k; y < sol - 2 * k; y++) { const x = Math.round(X(d * k + Math.sin((y - yB) / (7 * k) + d) * 0.7 * k, prof * 0.9 + (y - yB) * 0.1)); if (t.mat(x, y) === 'habit') t.poser(x, y, 'habit', 0); }
    if (!dos) for (let x = 0; x < L; x++) { const y = Math.round(yB - 1 * k + Math.sin(x / (1.5 * k)) * 0.5 * k); if (t.mat(x, y) === 'habit' && torse(x, y)) { t.poser(x, y, 'metal', Math.floor(x / k) % 2 ? 4 : 2); t.poser(x, y + 1, 'metal', 1); } }
  }
  // Le Serpent : le gilet de cuir brun ouvert sur la tunique verte, l'ourlet découpé en dents,
  // trois sangles noires bouclées d'argent, le baudrier en travers, le large ceinturon et sa bourse
  if (costume === 'serpent' && !dos) {
    const ouvert = y => (1.1 + Math.max(0, (yT + 6 * k - y)) * 0.25) * k;
    t.forme('gilet', (x, y) => { if (y > yB + 4 * k) return null; const n = torse(x, y) || (y > yB - 2 * k && t.mat(x, y) === 'habit' ? [0, 0.2, 0.9] : null); if (!n || y < yT + 1 * k) return null;
      if (Math.abs(x + 0.5 - X(0, prof)) < ouvert(y) * Math.max(0.5, Math.abs(c))) return null;
      if (y > yB + 1 * k && (Math.floor(x / k) % 3) === 0) return null;   // les dents de l'ourlet
      return n; }, { decalage: -0.1, motif: (x, y) => (hachage(Math.floor(x / k), Math.floor(y / k), 61) > 0.8 ? -0.6 : 0) });
    for (const dy of [5, 9, 13]) { const y = yT + dy * k; for (let x = Math.round(X(-3 * k, prof)); x <= X(3 * k, prof); x++) for (let e = 0; e < k; e++) if (t.mat(x, y + e)) t.poser(x, y + e, 'cuir', 2); t.poser(Math.round(X(1.5 * k, prof)), y, 'argent', 5); t.poser(Math.round(X(1.5 * k, prof)) + 1, y, 'argent', 3); }
    for (let j = 0; j <= (yB - yT) * 1.2; j++) { const u = j / ((yB - yT) * 1.2); const x = Math.round(X((0.8 - u * 1.6) * ep * 0.75, prof)), y = Math.round(yT + 1 * k + u * (yB - yT - 3 * k)); for (let e = 0; e < Math.max(1, Math.round(1.6 * k)); e++) if (t.mat(x + e, y)) t.poser(x + e, y, 'cuir', e ? 1 : 3); }
    t.forme('argent', ellipsoide(X(0.4 * ep * 0.75, prof), yT + 0.35 * (yB - yT), 1.4 * k, 1.1 * k), { decalage: 0.3, ombre: false });
    t.forme('cuir', (x, y) => { const n = torse(x, y); return n && y >= yB - 3 * k && y <= yB ? n : null; }, { decalage: -0.3, ombre: false });
    const bx = X(-3 * k, prof);
    t.forme('cuir', (x, y) => (y >= yB - 1 * k && y <= yB + 4 * k && Math.abs(x + 0.5 - bx) < 2.4 * k * Math.max(0.5, Math.abs(c)) ? [0, 0.2, 0.9] : null), { decalage: -0.1 });
  }
  // Le tabard du garde, le plastron blanc et la chaîne d'or du banquier
  // (v1.61) ... sans recouvrir le soleil d'or, qu'on voit sur son buste
  if (costume === 'garde') t.forme('tabard', (x, y) => (y >= yT + 3 * k && y <= yB + 4 * k && Math.abs(x + 0.5 - X(0, prof)) < 4 * k * Math.max(0.3, Math.abs(c)) && Z(0, prof) > 0 && t.mat(x, y) !== 'or' ? [0, 0, 1] : null), { decalage: 0.1 });
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
  if ((joueur || forgeron) && !dos) {
    const matTab = costume === 'forgeron' ? 'cuir' : 'lin';   // (le tablier de cuir épais du forgeron)
    const tab = (x, y) => { if (y < yT + 7 * k || y > yB + 6 * k) return null; const cxx = X(0, prof * 0.7); const demi = section((6.5 + (y - yT - 7 * k) / k * 0.12) * k, prof * 0.95) * 0.95; const nx = (x + 0.5 - cxx) / demi; return Math.abs(nx) > 1 || !torse(x, y) && y <= yB + 2 * k ? null : [nx * 0.7, 0, 0.9]; };
    t.forme(matTab, tab, { decalage: -0.1, motif: (x, y) => (y === yT + 7 * k || y === yB + 5 * k ? -0.8 : 0) });
    const px = X(-2 * k, prof);
    t.forme(matTab, (x, y) => (y >= yB - 4 * k && y <= yB && Math.abs(x + 0.5 - px) < 2.5 * k * Math.max(0.4, Math.abs(c)) ? [0, 0.3, 0.9] : null), { decalage: -0.9 });
    for (let e = 0; e < k; e++) { t.poser(Math.round(px) + e, yB - 4 * k - 1, 'or', 4); t.poser(Math.round(px) + e, yB - 4 * k - 2, 'or', 3); }
    for (const cote of [-1, 1]) for (let y = yT; y < yT + 8 * k; y++) for (let e = 0; e < k; e++) { const x = Math.round(X(cote * (4 * k + (y - yT) * 0.3), prof * 0.9)) + e; if (t.mat(x, y)) t.poser(x, y, matTab, 3); }
    t.forme(matTab, (x, y) => (y >= yB - 2 * k && y <= yB - 1 && torse(x, y) ? [0, 0.2, 0.9] : null), { decalage: -0.6, ombre: false });
    const nx0 = Math.round(X(5 * k, prof * 0.9));
    for (const [i, j] of [[0, 0], [1, 0], [2, 1], [3, 1], [1, 2], [3, 2]]) for (let e = 0; e < k; e++) t.poser(nx0 + i * k + e, yB - 2 * k + j * k, matTab, 2);
    // Le pan du tablier retombe par-dessus les cuisses : on le redessine après la jambe proche,
    // avec le tissu soulevé par la cuisse (plus clair) et un pli sombre le long de la jambe
    t.forme(matTab, (x, y) => (y > yB + 1 * k && y <= yB + 6 * k ? tab(x, y) : null), { decalage: -0.1, motif: (x, y) => (y === yB + 5 * k ? -0.8 : motifCuisse(x, y)) });
  }
  // L'ourlet de la tunique retombe sur les cuisses : le tissu est tendu sur la cuisse proche (plus
  // clair), et fait un pli de chaque côté
  if (!dos && !longue && !joueur && !forgeron) t.forme('habit', (x, y) => (y > yB && t.mat(x, y) === 'habit' ? torse(x, y) : null), { bord: false, ombre: false, motif: motifCuisse });
  if (costume === 'pirate' && !dos) {
    // les revers et le bord du manteau galonnés d'or, deux rangées de boutons dorés
    const galon = [];
    for (let y = yT + 1 * k; y < yB + Math.round((sol - yB) * 0.55); y++) for (let x = 0; x < L; x++) if (t.mat(x, y) === 'habit' && (t.mat(x - 1, y) !== 'habit' || t.mat(x + 1, y) !== 'habit')) galon.push([x, y]);
    for (const [x, y] of galon) t.poser(x, y, 'or', 3);
    // le devant ouvert du manteau : la chemise claire entre les revers
    t.forme('lin', (x, y) => (y >= yT + 1 * k && y <= yB - 3 * k && Math.abs(x + 0.5 - X(0, prof)) < Math.max(0.6 * k, 2.4 * k - (y - yT) * 0.12) && t.mat(x, y) === 'habit' ? [0, 0, 1] : null), { ombre: false });
    for (let j = 0; j < 4; j++) for (const du of [-2.2, 2.2]) t.forme('or', ellipsoide(X(du * k, prof), yT + (4 + j * 3.2) * k, 0.8 * k, 0.8 * k), { decalage: 0.6, ombre: false });
    // l'écharpe rouge nouée à la taille, et son pan qui tombe sur la hanche
    t.forme('echarpe', (x, y) => { const n = torse(x, y); return n && y >= yB - 2 * k && y <= yB + 1.5 * k ? n : null; }, { motif: (x, y) => (Math.floor(y / k) % 2 ? 0.4 : -0.2) });
    t.forme('echarpe', (x, y) => (y >= yB && y <= yB + 9 * k && Math.abs(x + 0.5 - X(-3 * k - (y - yB) * 0.08, prof)) < 1.4 * k ? [0.2, 0, 0.9] : null), { motif: (x, y) => (Math.floor(y / k) % 3 === 0 ? 0.5 : 0) });
    // le sabre au côté : la garde dorée et la lame courbe le long de la jambe
    t.forme('or', ellipsoide(X(5 * k, prof * 0.7), yB + 1 * k, 1.6 * k, 1.2 * k), { decalage: 0.4 });
    for (let j = 0; j < 14 * k; j++) { const x = Math.round(X(5.5 * k + j * 0.12 + Math.sin(j / (14 * k) * 1.4) * 1.5 * k, prof * 0.7)), y = yB + 2 * k + j; t.poser(x, y, 'metal', 4); t.poser(x + 1, y, 'metal', 2); }
  }
  // (v1.05, planche 35) le manteau du Père Givrin : bordé de fourrure blanche (le col, le devant, l'ourlet), le
  // large ceinturon noir et sa boucle d'or
  if (costume === 'givrin') {
    const basM = yB + Math.round((sol - yB) * 0.55), poil = (x, y) => ((Math.floor(x / k) + Math.floor(y / k)) % 2 ? 0.35 : -0.15);
    t.forme('fourrure', (x, y) => { const n = torse(x, y); if (!n) return null; const devant = !dos && Math.abs(x + 0.5 - X(0, prof)) < 1.6 * k * Math.max(0.5, Math.abs(c)); return y >= basM - 2.5 * k || y <= yT + 2 * k || (devant && y > yT) ? n : null; }, { decalage: 0.15, motif: poil });
    t.forme('cuir', (x, y) => { const n = torse(x, y); return n && y >= yB - 2 * k && y <= yB + 0.5 * k ? n : null; }, { decalage: 0.1 });
    if (!dos) { const bx = X(0, prof), lb = Math.max(0.5, Math.abs(c)); t.forme('or', (x, y) => (Math.abs(x + 0.5 - bx) < 1.9 * k * lb && y >= yB - 2.6 * k && y <= yB + 1 * k ? [0, 0, 1] : null), { decalage: 0.4 }); t.forme('cuir', (x, y) => (Math.abs(x + 0.5 - bx) < 0.8 * k * lb && y >= yB - 1.6 * k && y <= yB ? [0, 0, 1] : null), { ombre: false }); }
  }
  // (planche 75 v2) le surcot noir de la garde de Pont-Royal : un pan devant jusqu'aux genoux, bordé d'argent, la couronne
  // et les deux épées croisées du royaume brodées d'argent sur la poitrine, la ceinture de cuir
  if (costume === 'gardeRoyal' && !dos) {
    const larg = ep * 0.7 * Math.max(0.55, Math.abs(c)), bas = yB + 10 * k;
    t.forme('habit', (x, y) => { const n = torse(x, y); return (n || (y > yB - 2 * k && y < bas)) && y >= yT + 1 * k && Math.abs(x + 0.5 - X(0, prof)) < larg ? (n || [0, 0.2, 0.9]) : null; }, { decalage: 0.05 });
    for (let y = yT + 1 * k; y < bas; y++) for (const sx of [-1, 1]) { const x = Math.round(X(0, prof) + sx * (larg - 0.5)); if (t.mat(x, y) === 'habit') t.poser(x, y, 'argent', 3); }
    for (let x = Math.round(X(0, prof) - larg); x <= X(0, prof) + larg; x++) t.poser(x, bas - 1, 'argent', 4);
    const sx = X(0, prof), sy = yT + P.torse * 0.38, lc = Math.max(0.6, Math.abs(c));
    for (let j = -3; j <= 3; j++) { t.poser(Math.round(sx + j * k * lc), Math.round(sy + 2 * k + j * k), 'argent', 4); t.poser(Math.round(sx - j * k * lc), Math.round(sy + 2 * k + j * k), 'argent', 4); }
    for (let x = Math.round(sx - 2.5 * k * lc); x <= sx + 2.5 * k * lc; x++) t.poser(x, Math.round(sy - 2 * k), 'argent', 5);
    for (const d of [-2, 0, 2]) t.poser(Math.round(sx + d * k * lc), Math.round(sy - 3 * k), 'argent', 5);
    t.forme('cuir', (x, y) => { const n = torse(x, y); return n && y >= yB - 1.5 * k && y <= yB + 0.5 * k ? n : null; }, { decalage: 0.1, ombre: false });
  }
  // (planche 75 v2) l'acier de la garde en plaques : un joint sombre tous les trois pixels, un reflet sur l'arête
  if (costume === 'gardeRoyal') for (let y = yT; y < sol; y++) for (let x = 0; x < L; x++) if (t.mat(x, y) === 'metal') {
    if ((y - yT) % (3 * k) === 0) t.poser(x, y, 'metal', t.teinte(x, y) - 1);
    else if ((y - yT) % (3 * k) === 1 && t.mat(x - 1, y) === 'metal' && t.mat(x + 1, y) === 'metal') t.poser(x, y, 'metal', t.teinte(x, y) + 1);
  }
  // (planche 75 v2) le duc : le grand manteau de fourrure grise (le col haut, deux larges revers qui descendent jusqu'au
  // sol), le brocart de la robe, le jabot cuivré sous le menton, une chaîne d'or
  if (costume === 'duc') {
    const poil = (x, y) => (hachage(Math.floor(x / k), Math.floor(y / k), 77) > 0.5 ? 0.45 : -0.25) + ((Math.floor(x / k) + Math.floor(y / (2 * k))) % 3 === 0 ? -0.35 : 0);
    if (!dos) for (let y = yT; y <= sol - 1 * k; y++) for (let x = 0; x < L; x++) if (t.mat(x, y) === 'habit' && (Math.floor(x / k) * 5 + Math.floor(y / k) * 3) % 11 === 0) t.poser(x, y, 'habit', t.teinte(x, y) + 1);
    // (de profil et de biais) le manteau s'évase depuis les épaules au lieu de tomber comme une planche
    if (!dos && Math.abs(s) > 0.3) for (let y = yT - 2 * k; y < sol; y++) {
      let xb = -1; for (let x = 0; x < L; x++) { const m = t.mat(x, y); if (m && m !== 'cape') { xb = x; break; } }
      if (xb < 0) continue; const permis = 1.5 * k + Math.max(0, y - yT) / (sol - yT) * 7 * k * Math.abs(s);
      for (let x = 0; x < xb - permis; x++) if (t.mat(x, y) === 'cape') { t.c[y * L + x] = null; t.m[y * L + x] = null; }
    }
    // le bord du manteau (la cape) : une épaisse bande de fourrure, des touffes qui dépassent
    const bordCape = [];
    for (let y = yT; y < sol; y++) for (let x = 0; x < L; x++) if (t.mat(x, y) === 'cape') { const pres2 = [-2, -1, 1, 2].some(d => !t.mat(x + d * k, y)); if (pres2) bordCape.push([x, y]); }
    for (const [x, y] of bordCape) t.poser(x, y, 'fourrure', 2 + Math.round(hachage(Math.floor(x / k), Math.floor(y / k), 79) * 2.4));
    for (const [x, y] of bordCape) if (hachage(x, y, 83) > 0.86) { const d = t.mat(x - 1, y) ? 1 : -1; for (let j = 1; j <= 1 + Math.floor(hachage(x, y, 84) * 2 * k); j++) if (!t.mat(x + d * j, y)) t.poser(x + d * j, y, 'fourrure', 3); }
    // le col, haut et ébouriffé, et les deux revers qui descendent jusqu'au sol
    t.forme('fourrure', (x, y) => { if (y < yT - 3 * k || y > sol - 1 * k) return null; const d = x + 0.5 - X(0, prof);
      const col = ((x + 0.5 - X(0, prof * 0.3)) / (ep * Math.abs(c) + prof * Math.abs(s) + 4 * k)) ** 2 + ((y - yT - 1.5 * k) / (6.5 * k)) ** 2 < 1 + (hachage(Math.floor(x / k), Math.floor(y / k), 81) - 0.5) * 0.35 && y >= yT - 3 * k;
      const ragged = (hachage(Math.floor(y / k), d > 0 ? 3 : 4, 82) - 0.5) * 1.6 * k;
      const revers = !dos && y > yT && t.mat(x, y) && Math.abs(Math.abs(d) - 4.8 * k * Math.max(0.3, Math.abs(c))) < 3.4 * k * Math.max(0.45, Math.abs(c)) + ragged * Math.max(0.5, Math.abs(c));
      const tient = t.mat(x, y) || t.mat(x - 2 * k, y) || t.mat(x + 2 * k, y) || t.mat(x, y + 2 * k);
      return (col && tient) || revers ? [d / (ep * 2), -0.2, 0.85] : null; }, { decalage: 0.15, motif: poil });
    if (!dos) { const jx = X(0, prof * 0.4), jy = yT + 0.5 * k; t.forme('lin', (x, y) => (Math.abs(x + 0.5 - jx) < (1.9 * k - Math.abs(y - jy - 1.5 * k) * 0.3) * Math.max(0.6, Math.abs(c)) && y >= jy && y <= jy + 4 * k ? [0, 0, 1] : null), { decalage: 0.2, motif: (x, y) => (Math.floor((y - jy) / k) % 2 ? 0.4 : -0.2) });
      for (let j = 0; j <= 10; j++) { const u = j / 10, x = Math.round(jx + (u - 0.5) * 6.5 * k * Math.max(0.6, Math.abs(c))), y = Math.round(jy + 6 * k + Math.sin(u * Math.PI) * 3 * k); t.poser(x, y, 'or', j % 2 ? 3 : 5); } }
  }
  // L'écharpe de laine, la chaîne de montre, la bague
  if (porte('echarpe') && !dos) {
    t.forme('echarpe', (x, y) => (y >= yT - 2 * k && y <= yT + 2 * k && Math.abs(x + 0.5 - X(0, prof * 0.6)) < 5 * k * Math.max(0.4, Math.abs(c)) ? [(x + 0.5 - cx) / (5 * k) * 0.5, 0, 0.9] : null), { motif: (x, y) => (Math.floor(y / k) % 2 ? 0.5 : -0.2) });
    t.forme('echarpe', (x, y) => (y >= yT + 2 * k && y <= yT + 10 * k && Math.abs(x + 0.5 - X(3 * k, prof)) < 1.3 * k ? [0.3, 0, 0.9] : null), { motif: (x, y) => (Math.floor(y / k) % 3 === 0 ? 0.6 : 0) });
  }
  // (v1.00) l'écharpe bleu et or de la Confrérie, bordée d'or, un pan qui tombe sur la poitrine
  if (porte('echarpeUnion') && !dos) {
    t.forme('echarpeU', (x, y) => (y >= yT - 2 * k && y <= yT + 2 * k && Math.abs(x + 0.5 - X(0, prof * 0.6)) < 5 * k * Math.max(0.4, Math.abs(c)) ? [(x + 0.5 - cx) / (5 * k) * 0.5, 0, 0.9] : null), { motif: (x, y) => (y === yT - 2 * k || y === yT + 2 * k ? 0 : 0) });
    for (let x = Math.round(cx - 5 * k); x <= cx + 5 * k; x++) if (t.mat(x, yT + 2 * k) === 'echarpeU') t.poser(x, yT + 2 * k, 'or', 4);
    t.forme('echarpeU', (x, y) => (y >= yT + 2 * k && y <= yT + 11 * k && Math.abs(x + 0.5 - X(-3 * k, prof)) < 1.4 * k ? [-0.3, 0, 0.9] : null));
    for (let y = yT + 2 * k; y <= yT + 11 * k; y++) { const x0 = Math.round(X(-3 * k, prof) - 1.4 * k), x1 = Math.round(X(-3 * k, prof) + 1.4 * k) - 1; if (t.mat(x0, y) === 'echarpeU') t.poser(x0, y, 'or', 3); if (t.mat(x1, y) === 'echarpeU') t.poser(x1, y, 'or', 4); }
    for (let x = Math.round(X(-3 * k, prof) - 1.4 * k); x < X(-3 * k, prof) + 1.4 * k; x++) t.poser(x, yT + 11 * k, 'or', 4);
  }
  // (v1.05) l'écharpe du Long Hiver, rayée rouge et blanc : un tour autour du cou, deux pans à franges sur la poitrine
  if (porte('echarpeHiver') && !dos) {
    t.forme('echarpeH', (x, y) => (y >= yT - 2.5 * k && y <= yT + 2 * k && Math.abs(x + 0.5 - X(0, prof * 0.6)) < 5.4 * k * Math.max(0.4, Math.abs(c)) ? [(x + 0.5 - cx) / (5 * k) * 0.5, 0, 0.9] : null), { motif: (x, y) => (Math.floor(y / k) % 2 ? 0.4 : -0.2) });
    for (const [du, lg] of [[2.6, 11], [-1.2, 8.5]]) {
      const pan = y => X(du * k, prof) + (y - yT) * 0.06;
      t.forme('echarpeH', (x, y) => (y >= yT + 1 * k && y <= yT + lg * k && Math.abs(x + 0.5 - pan(y)) < 1.5 * k ? [du > 0 ? 0.3 : -0.2, 0, 0.9] : null), { decalage: du > 0 ? 0.2 : 0 });
      for (let y = Math.round(yT + 3 * k); y <= yT + lg * k; y += 3 * k) for (let e = 0; e < k; e++) for (let x = Math.round(pan(y) - 1.5 * k); x < pan(y) + 1.5 * k; x++) if (t.mat(x, y + e) === 'echarpeH') t.poser(x, y + e, 'blanc', 4);   // (les rayures blanches)
      const yf = Math.round(yT + lg * k);
      for (let x = Math.round(pan(yf) - 1.4 * k); x < pan(yf) + 1.4 * k; x += 2) for (let e = 1; e <= 1.5 * k; e++) t.poser(x, yf + e, 'echarpeH', 2);   // (les franges)
    }
  }
  // (v1.01) la petite lanterne rouge, pendue à la ceinture
  if (porte('lanterneCeinture') && !dos) {
    const lx = X(pres * (ep - 0.5 * k), prof * 0.8), ly = yB + 3.5 * k;
    for (let j = 0; j < 2 * k; j++) t.poser(Math.round(lx), Math.round(yB + j), 'cuir', 2);
    t.forme('lanterneR', ellipsoide(lx, ly, 2.2 * k, 2 * k), { decalage: 0.4, ombre: false });
    t.poser(Math.round(lx), Math.round(ly), 'or', 5);
  }
  if (porte('montre') && !dos) { for (let j = 0; j < 7 * k; j++) t.poser(Math.round(X(-4 * k + j, prof)), yB - 2 * k + Math.round(j / (3 * k)), 'or', j % 2 ? 4 : 3); t.forme('or', ellipsoide(X(4 * k, prof), yB + 1 * k, 1.6 * k, 1.6 * k), { decalage: 0.5, ombre: false }); }
  // La capuche et le col de fourrure du noble
  if (costume === 'noble') t.forme('fourrure', (x, y) => (y >= yT - 1 * k && y <= yT + 4 * k && torse(x, y) ? [(x + 0.5 - cx) / ep, -0.3, 0.8] : null), { motif: (x, y) => ((Math.floor(x / k) + Math.floor(y / k)) % 2 ? 0.5 : -0.3) });
  if (race === 'magicienne') for (let y = yB + 4 * k; y < sol; y += 5 * k) for (let x = cx - 8 * k; x < cx + 9 * k; x += 6 * k) if (t.mat(x + (y % 2), y) === 'habit') { t.poser(x + (y % 2), y, 'or', 4); t.poser(x + (y % 2) + 1, y, 'or', 5); } // les étoiles
  // --- Les habits des aventuriers, selon le niveau ---
  // Le gilet de cuir lacé de l'aguerri ; le gilet clouté du vétéran ; la cotte de mailles du héros ;
  // le plastron liséré d'or de la légende ; une épée au côté à partir du héros
  const devantTorse = (x, y) => torse(x, y) && !dos && y >= yT + 2 * k && y <= yB - 2 * k && Math.abs(x + 0.5 - X(0, prof)) < section(ep - 1.6 * k, prof) * 0.9;
  // (v1.61) ... sauf pour les voyageurs, qui gardent la tunique ou la brigandine de leur buste (le niveau se voit à
  // leurs accessoires : sacoche, brassards, épaulières, cape, épée, dorures)
  if (aventurier && !voyageurBuste && !longue && race !== 'nain' && race !== 'hobbit' && race !== 'elfe') {
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
    if (tenue >= 3 && !voyageurBuste) {   // (v1.61 : le voyageur garde la tunique de son buste)
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
  if (aventurier && tenue >= 3 && !longue && !arme) {
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
  // (v1.02 : les Gardiens n'ont qu'une fine cordelière de métal sur leur robe, pas de ceinture de cuir)
  if (costume === 'gardien') t.forme(atours.metal || 'or', (x, y) => (y >= yB - 1.5 * k && y <= yB - 0.5 * k && torse(x, y) ? [0, 0, 0.9] : null), { ombre: false });
  else t.forme(tenue === 0 ? 'lin' : 'cuir', (x, y) => (y >= yB - 2 * k && y <= yB - 1 && torse(x, y) ? [0, y < yB - 1 * k ? -0.6 : 0.4, 0.8] : null), { ombre: false });
  if (tenue >= 1 && !dos && Z(0, prof) > 0) t.forme(tenue >= 4 ? 'or' : 'metal', ellipsoide(X(0, prof), yB - 1.5 * k, 1.6 * k, 1.3 * k), { decalage: 0.4, ombre: false });
  // La bandoulière et la sacoche (aguerri et plus)
  // (v1.61) la bandoulière du buste dès le novice (le gambeson, le nain) ; la brigandine, l'elfe et le hobbit n'en ont pas
  // en buste : leur sacoche pend alors à la ceinture
  const bandouliere = voyageurBuste ? tuniqueBuste || race === 'nain' : tenue >= 1;
  if ((tenue >= 1 || bandouliere) && !dos && !longue && aventurier) {
    if (bandouliere) for (let j = 0; j < P.torse - 2 * k; j++) for (let e = 0; e < k; e++) { const x = Math.round(X(-ep + 3 * k + j * (ep * 2 - 6 * k) / P.torse, prof * 0.95)) + e; if (torse(x, yT + 1 * k + j)) t.poser(x, yT + 1 * k + j, 'cuir', 2); }
    const sx = X(ep - 1 * k, 0.5 * k);
    if (tenue >= 1 && Z(ep - 1 * k, 0.5 * k) > -2 * k) t.forme('cuir', (x, y) => (y >= yB - 1 * k && y <= yB + 4 * k && Math.abs(x + 0.5 - sx) < 2.6 * k ? [(x + 0.5 - sx) / (2.6 * k), 0, 0.9] : null));
  }
  // Les épaulières : cuir (vétéran), métal (héros), métal et or (légende)
  // (v1.61) ... sauf là où le buste a déjà les siennes, d'acier liserées d'or : aux deux épaules du nain
  // et du garde, à l'épaule droite du voyageur en brigandine (plus grandes que celles du niveau, comme en buste)
  const epauliere = (cote, mat, liser, taille = 1) => {
    const ex = X(cote * (ep - 0.8 * k), 0.3 * k);
    if (Z(cote * (ep - 0.8 * k), 0.3 * k) < -prof * 0.9 && s > 0.5) return;
    t.forme(mat, ellipsoide(ex, yT + 2 * k, 3.4 * k * taille * Math.max(0.6, Math.abs(c) + 0.3), 2.4 * k * taille), { decalage: 0.3 });
    if (liser) for (let j = -2 * k * taille; j <= 2 * k * taille; j++) t.poser(Math.round(ex + j), Math.round(yT + (2 + 2 * taille) * k), 'or', 4);
  };
  const epaulieresBuste = (race === 'nain' && voyageurBuste) || costume === 'garde' ? [loin, pres] : armure ? [-1] : [];
  if (!epaulieresBuste.length && tenue >= 2 && race !== 'hobbit' && !(race === 'elfe' && tenue < 3) && (aventurier || costume === 'noble')) for (const cote of [loin, pres]) epauliere(cote, tenue >= 3 ? 'metal' : 'cuir', tenue >= 4);

  // Garrick, le rôdeur : les pans du long manteau olive ouvert sur le devant (jusqu'aux mollets), la
  // chemise bordeaux au col, le baudrier en travers, le ceinturon et le pommeau de l'épée à la hanche
  if (costume === 'mentor' && !dos) {
    t.rampes.chemise = rampeVive(0x5a1a20);
    t.forme('chemise', (x, y) => (y >= yT && y <= yT + 5 * k && Math.abs(x + 0.5 - X(0, prof)) < (3.2 * k - (y - yT) * 0.5) * Math.max(0.4, Math.abs(c)) ? [0, -0.2, 0.9] : null), { decalage: 0.1 });
    pansManteau(yT, yB + 2 * k);
    // les revers du col, relevés
    for (const cote of [-1, 1]) t.forme('cape', (x, y) => { const bx = X(cote * 2.5 * k, prof); return y >= yT - 2 * k && y <= yT + 4 * k && Math.abs(x + 0.5 - bx - cote * (y - yT + 2 * k) * 0.35) < 1.3 * k && Z(cote * 2.5 * k, prof) > 0 ? [cote * 0.6, -0.4, 0.7] : null; }, { decalage: 0.4 });
    // le baudrier et le ceinturon
    for (let j = 0; j <= (yB - yT) * 1.2; j++) { const u = j / ((yB - yT) * 1.2); const x = Math.round(X((0.7 - u * 1.4) * ep * 0.6, prof)), y = Math.round(yT + 2 * k + u * (yB - yT - 4 * k)); for (let e = 0; e < Math.max(1, Math.round(1.2 * k)); e++) if (t.mat(x + e, y)) t.poser(x + e, y, 'cuir', e ? 1 : 2); }
    t.forme('cuir', (x, y) => { const n = torse(x, y); return n && y >= yB - 2.5 * k && y <= yB - 0.5 * k ? n : null; }, { decalage: -0.6, ombre: false });
    t.forme('metal', ellipsoide(X(0, prof), yB - 1.5 * k, 1.2 * k * Math.max(0.5, Math.abs(c)), 1 * k), { decalage: 0.4, ombre: false });
    // l'épée : la garde et le pommeau qui dépassent à la hanche, le fourreau qui descend en biais
    const hx = X(loin * ep * 0.9, prof * 0.4), hy = yB - 1 * k;
    for (let j = 0; j < 14 * k; j++) { const x = Math.round(hx - loin * j * 0.18), y = hy + j; for (let e = 0; e < Math.max(1, Math.round(0.9 * k)); e++) if (!t.mat(x + e, y) || t.mat(x + e, y) === 'cape' || t.mat(x + e, y) === 'bas') t.poser(x + e, y, 'cuir', 1); }
    for (let j = -2 * k; j <= 2 * k; j++) t.poser(Math.round(hx + j), hy - 1, 'metal', 4);
    for (let j = 0; j < 3 * k; j++) t.poser(Math.round(hx + loin * j * 0.18), hy - 2 - j, 'cuir', 2);
    t.forme('metal', ellipsoide(hx + loin * 0.7 * k, hy - 3.5 * k, 0.9 * k, 0.9 * k), { decalage: 0.5, ombre: false });
  }
  // --- 3. Devant : le bras et la jambe du côté proche ---
  // (v1.04) l'arme à la taille : par-dessus les habits, sous le bras de devant
  if (placeArme === 'taille' && !dos) {
    const hx = X(pres * ep * 0.55, prof * 0.95), hy = yB - 0.5 * k, kA = k * TAILLE_ARMES_PORTEES;   // (sur le devant de la hanche : le bras ne la cache pas)
    if (arme === 'dague') { cylindre(t, 'cuir', [hx, hy + 1 * kA], [hx - pres * 0.6 * kA, hy + 7 * kA], 1 * kA, { decalage: 0.2 }); cylindre(t, 'ferA', [hx - 1.8 * kA, hy + 0.5 * kA], [hx + 1.8 * kA, hy + 0.5 * kA], 0.6 * kA, { decalage: 0.5 }); cylindre(t, 'boisA', [hx, hy - 2.5 * kA], [hx, hy], 0.6 * kA, { decalage: 0.4 }); }
    else if (arme === 'rapiere') { cylindre(t, 'cuir', [hx, hy + 1 * kA], [hx - pres * 2.5 * kA, sol - 10 * kA], 0.8 * kA, { decalage: 0.2 }); t.forme('laitonA', ellipsoide(hx, hy, 2 * kA, 1.5 * kA), { decalage: 0.5 }); cylindre(t, 'laitonA', [hx, hy - 1 * kA], [hx + pres * 1 * kA, hy - 3 * kA], 0.4 * kA, { decalage: 0.6 }); cylindre(t, 'boisA', [hx, hy - 3 * kA], [hx, hy - 1 * kA], 0.5 * kA, { decalage: 0.6 }); }
    else if (arme === 'khopesh') { const n = 10; let prec = null; for (let i = 0; i <= n; i++) { const a = i / n, p = [hx - pres * (Math.sin(a * 2.4) * 3 * kA), hy + 1 * kA + a * 10 * kA]; if (prec) cylindre(t, 'lameA', prec, p, 0.9 * kA, { decalage: 0.4 }); prec = p; } cylindre(t, 'boisA', [hx, hy - 2.5 * kA], [hx, hy + 1 * kA], 0.6 * kA, { decalage: 0.5 }); }
    else if (arme === 'fronde') { for (let a = 0; a < 6.3; a += 0.15) for (let e = 0; e < k; e++) t.poser(Math.round(hx + Math.cos(a) * 2.2 * kA) + e, Math.round(hy + 3.5 * kA + Math.sin(a) * 3 * kA), 'cordeA', 3); t.forme('cuir', ellipsoide(hx, hy + 6.5 * kA, 1.9 * kA, 1.4 * kA), { decalage: 0.4 }); }
    else if (arme === 'massue') { cylindre(t, 'boisA', [hx, hy - 1 * kA], [hx - pres * 1 * kA, hy + 4 * kA], 0.7 * kA, { decalage: 0.3 }); t.forme('boisA', ellipsoide(hx - pres * 1.8 * kA, hy + 8 * kA, 2.4 * kA, 3.6 * kA), { decalage: 0.4 }); for (const [u, v] of [[-1, 6.5], [1, 8], [-0.6, 10]]) t.forme('ferA', ellipsoide(hx - pres * 1.8 * kA + u * kA, hy + v * kA, 0.6 * kA, 0.6 * kA), { decalage: 0.8, ombre: false }); }
  }
  for (const cote of brasTardifs) bras(cote, cote === brasAvant ? true : deFace);
  // (v1.61) les épaulières du buste, par-dessus le haut du bras de devant (dessous, il les cachait)
  for (const cote of epaulieresBuste) epauliere(cote, 'metal', true, race === 'nain' ? 1.5 : 1.3);
  if (costume === 'gardien') {
    const metal = atours.metal || 'or';
    if (!dos) {
      // l'étole blanche du Conseil : deux bandes qui tombent du col jusque sous la taille, frangées de métal
      for (const d of [-1, 1]) {
        t.forme('lin', (x, y) => (y >= yT && y <= yB + 9 * k && Math.abs(x + 0.5 - X(d * 2.6 * k, prof * 1.02)) < 1.3 * k * Math.max(0.5, Math.abs(c) + 0.1) && (t.mat(x, y) === 'habit' || t.mat(x, y) === 'cape') ? [d * 0.2, 0, 1] : null), { decalage: 0.3, ombre: false });
        for (let y = yB + 7 * k; y <= yB + 9 * k; y++) for (let x = 0; x < L; x++) if (t.mat(x, y) === 'lin' && Math.abs(x + 0.5 - X(d * 2.6 * k, prof)) < 1.4 * k) t.poser(x, y, metal, y > yB + 8 * k && x % 2 ? 2 : 4);
        t.forme(metal, ellipsoide(X(d * 2.6 * k, prof * 1.02), yB + 3 * k, 0.7 * k, 0.7 * k), { decalage: 0.6, ombre: false });   // le petit sceau brodé
      }
      // l'ourlet et le devant de la robe, galonnés de métal
      for (let y = sol - 2 * k; y < sol; y++) for (let x = 0; x < L; x++) if (t.mat(x, y) === 'habit') t.poser(x, y, metal, 3);
      for (let y = yB + 9 * k; y < sol - 2 * k; y++) { const x = Math.round(X(0, prof)); if (t.mat(x, y) === 'habit') t.poser(x, y, metal, 3); }
      // la broche d'écaille rouge, au col (tous les Gardiens la portent)
      t.forme(metal, (x, y) => { const dx = Math.abs(x + 0.5 - X(0, prof)), dy = y + 0.5 - (yT + 3.2 * k); return dx / (1.9 * k) + Math.abs(dy) / (2.4 * k) <= 1 ? [0, dy / (2.4 * k), 0.9] : null; }, { decalage: 0.6, ombre: false });   // (sa monture de métal : elle se voit même sur une robe rouge)
      t.forme('ecaille', (x, y) => { const dx = Math.abs(x + 0.5 - X(0, prof)), dy = y + 0.5 - (yT + 3.2 * k); return dx / (1.3 * k) + Math.abs(dy) / (1.7 * k) <= 1 ? [0, dy / (1.6 * k), 0.9] : null; }, { decalage: 0.7, ombre: false });
      // la chaîne d'office du Gardien du Comté
      if (atours.coiffe === 'chaine') { for (let j = -5 * k; j <= 5 * k; j++) { const y = Math.round(yT + 1 * k + (1 - (j / (5 * k)) ** 2) * 5 * k); t.poser(Math.round(X(j * 0.9, prof)), y, metal, j % 2 ? 3 : 5); } t.forme(metal, ellipsoide(X(0, prof), yT + 7 * k, 1.8 * k, 1.8 * k), { decalage: 0.6 }); t.poser(Math.round(X(0, prof)), yT + 7 * k, 'ecaille', 4); }
    } else for (let y = yT - 1 * k; y < yT + 3 * k; y++) for (let x = 0; x < L; x++) if ((t.mat(x, y) === 'habit' || t.mat(x, y) === 'cape') && Math.abs(Math.abs(x + 0.5 - cx) - 2.6 * k) < 1.3 * k) t.poser(x, y, 'lin', 4);   // (de dos : l'étole sur les épaules)
  }
  if (costume === 'champion' && !dos) {
    // la grande épée dans son dos : la poignée et la garde d'or dépassent au-dessus de l'épaule, le pommeau d'écaille
    const ex = X(loin * (ep + 1.5 * k), -prof * 0.5), ey0 = yT - 10 * k;
    {
      for (let j = 0; j < 6 * k; j++) for (let e = 0; e < Math.round(1.4 * k); e++) { const x = Math.round(ex + loin * j * 0.25) + e, y = ey0 + j; if (!t.mat(x, y) || t.mat(x, y) === 'cape') t.poser(x, y, j % (2 * k) < k ? 'or' : 'cuir', j % (2 * k) < k ? 3 : 4); }   // (la poignée gainée de cuir, cerclée d'or)
      for (let e = -2.5 * k; e <= 2.5 * k; e++) { const x = Math.round(ex + loin * 6 * k * 0.25 + e), y = Math.round(ey0 + 6 * k + e * loin * 0.25); if (!t.mat(x, y) || t.mat(x, y) === 'cape') { t.poser(x, y, 'or', 4); t.poser(x, y + 1, 'or', 2); } }
      t.forme('ecaille', ellipsoide(ex - loin * 0.2 * k, ey0 - 0.8 * k, 1.5 * k, 1.5 * k), { decalage: 0.6, ombre: false });
    }
    // de larges spalières d'acier noirci bordées d'or
    for (const cote of [-1, 1]) {
      const px = X(cote * (ep + 0.2 * k), 0.5 * k);
      if (Z(cote * ep, 0) < -3 * k) continue;
      t.forme('metal', ellipsoide(px, yT + 1.5 * k, 3.6 * k * Math.max(0.6, Math.abs(c) + 0.2), 2.6 * k, (x, y) => y <= yT + 3.6 * k), { decalage: 0.5 });
      for (let x = Math.round(px - 3.6 * k); x <= px + 3.6 * k; x++) { const y = Math.round(yT + 3.6 * k); if (t.mat(x, y) === 'metal') t.poser(x, y, 'or', 4); }
    }
    // la gemme d'écaille rouge au cœur de sa cuirasse
    t.forme('ecaille', (x, y) => { const dx = Math.abs(x + 0.5 - X(0, prof)), dy = y + 0.5 - (yT + 7 * k); return dx / (1.4 * k) + Math.abs(dy) / (1.9 * k) <= 1 ? [0, dy / (1.9 * k), 0.9] : null; }, { decalage: 0.9, ombre: false });
    // la broche d'écaille rouge qui ferme sa cape, sur l'épaule
    t.forme('ecaille', (x, y) => { const dx = Math.abs(x + 0.5 - X(pres * (ep - 1 * k), prof * 0.6)), dy = y + 0.5 - (yT + 1 * k); return dx / (1.4 * k) + Math.abs(dy) / (1.9 * k) <= 1 ? [0, dy / (1.9 * k), 0.9] : null; }, { decalage: 0.8, ombre: false });
  }
  if (costume === 'sage') {
    if (!dos) {
      // la robe d'ivoire qui s'ouvre sous la robe violette, son arbre brodé d'or
      const xc = X(0, prof);
      t.forme('lin', (x, y) => { if (y < yT + 2 * k || t.mat(x, y) !== 'habit') return null; const demi = (1.5 * k + (y - yT) * 0.09) * Math.max(0.5, Math.abs(c) + 0.15); return Math.abs(x + 0.5 - xc - s * (y - yT) * 0.04) < demi ? [0, 0, 1] : null; }, { ombre: false });
      const axe = (y) => xc + s * (y - yT) * 0.04, surLin = (x, y) => t.mat(x, y) === 'lin';
      for (let y = yB + 3 * k; y < sol - 1 * k; y++) for (let e = 0; e < Math.max(1, Math.round(0.6 * k)); e++) if (surLin(Math.round(axe(y)) + e, y)) t.poser(Math.round(axe(y)) + e, y, 'or', 3);   // le tronc
      for (let yb = yB + 7 * k, n = 0; yb < sol - 2 * k; yb += 4 * k, n++) for (const sens of [-1, 1]) {   // les branches
        const long = (2 + n * 0.9) * k;
        for (let j = 0; j < long; j++) { const x = Math.round(axe(yb) + sens * j * Math.max(0.5, Math.abs(c))), y = Math.round(yb - j * 0.7); if (surLin(x, y)) t.poser(x, y, 'or', j % 3 ? 3 : 4); }
        const fx = Math.round(axe(yb) + sens * long * Math.max(0.5, Math.abs(c))), fy = Math.round(yb - long * 0.7);
        if (surLin(fx, fy)) { t.poser(fx, fy, 'or', 5); t.poser(fx, fy - 1, 'or', 4); }   // une feuille au bout
      }
      // les bords de la robe violette et l'ourlet, galonnés d'or
      const galon = [];
      for (let y = yT + 2 * k; y < sol; y++) for (let x = 0; x < L; x++) if (t.mat(x, y) === 'habit' && (t.mat(x - 1, y) === 'lin' || t.mat(x + 1, y) === 'lin' || (y > sol - 2 * k))) galon.push([x, y]);
      for (const [x, y] of galon) t.poser(x, y, 'or', 3);
      for (let y = yB + 4 * k; y < sol - 3 * k; y += 3 * k) for (let x = 0; x < L; x++) if (t.mat(x, y) === 'habit' && hachage(Math.floor(x / k), Math.floor(y / k), 29) > 0.8) t.poser(x, y, 'or', 2);   // les broderies semées
      // la ceinture de cuir et sa boucle d'or
      t.forme('cuir', (x, y) => { const n = torse(x, y); return n && y >= yB - 2 * k && y <= yB ? n : null; }, { decalage: 0.2, ombre: false });
      t.forme('or', ellipsoide(xc, yB - 1 * k, 1.4 * k * Math.max(0.5, Math.abs(c)), 1.3 * k), { decalage: 0.5, ombre: false });
      // les fioles de lumière bleue pendues à la ceinture
      for (let j = 0; j < 3; j++) { const fx = X(pres * (2 + j * 1.6) * k, prof * 0.95), fy = yB + (2 + (j % 2) * 2) * k; for (let e = 0; e < 1.5 * k; e++) t.poser(Math.round(fx), yB + e, 'or', 2); t.forme('cristal', ellipsoide(fx, fy + 1.5 * k, 0.9 * k, 1.9 * k), { decalage: 0.5, ombre: false }); t.poser(Math.round(fx), Math.round(fy), 'cuir', 1); }
      // le grimoire pendu à sa chaîne, sur l'autre hanche
      const lx = X(loin * (ep - 1 * k), prof * 0.8);
      if (Z(loin * (ep - 1 * k), prof * 0.8) > -2 * k) {
        for (let e = 0; e < 3 * k; e++) t.poser(Math.round(lx + loin * e * 0.2), yB + e, 'or', 3);
        t.forme('livre', (x, y) => (Math.abs(x + 0.5 - lx) < 2.6 * k * Math.max(0.6, Math.abs(c)) && y >= yB + 3 * k && y <= yB + 9 * k ? [0, 0, 1] : null), { decalage: 0.4 });
        t.forme('or', ellipsoide(lx, yB + 6 * k, 1 * k, 1 * k), { decalage: 0.6, ombre: false });
      }
      // l'amulette d'or à l'étoile, sur la poitrine
      for (let e = 0; e < 4 * k; e++) { t.poser(Math.round(X(-2 * k + e * 0.5, prof)), yT + Math.round(e * 0.6), 'or', 3); t.poser(Math.round(X(2 * k - e * 0.5, prof)), yT + Math.round(e * 0.6), 'or', 3); }
      t.forme('or', ellipsoide(X(0, prof), yT + 4 * k, 1.6 * k, 1.6 * k), { decalage: 0.6 });
      t.poser(Math.round(X(0, prof)), yT + 4 * k, 'cristal', 5);
    }
    // le haut manteau d'écailles sur les épaules (par-dessus les bras)
    t.forme('cape', (x, y) => { const d = Math.abs(x + 0.5 - cx); const W = ep + 4.5 * k; if (d >= W) return null; const haut = yT - 3 * k + Math.max(0, d - ep * 0.5) * 0.35, bas = yT + 7 * k - (d / W) * 1 * k + (Math.abs(((x + 0.5) % (3 * k)) - 1.5 * k) < 0.8 * k ? 1 * k : 0);
      if (y < haut || y > bas) return null; if (!dos && d < 3 * k * Math.max(0.5, Math.abs(c)) && y > yT - 1 * k && Math.abs(x + 0.5 - X(0, prof)) < 3 * k) return null; return [(x + 0.5 - cx) / W * 0.8, y < haut + 2 * k ? -0.6 : 0.1, 0.8]; }, { decalage: 0.3, motif: ecailles });
  }
  // (v1.01) le châle de brume des ancêtres, gris et effiloché : posé par-dessus les deux bras, il couvre les
  // épaules et le haut des bras (rien ne dépasse), descend en pointe dans le dos et sur la poitrine
  if (porte('chaleBrume')) {
    const xc = X(0, dos ? 0 : prof * 0.3), W = section(ep + 4 * k, prof + 1.5 * k);
    const bas = (x) => { const d = Math.abs(x + 0.5 - xc) / W; return yT + 12 * k - d * d * 6 * k + (hachage(Math.floor(x / k), 3, 31) > 0.5 ? 1 * k : 0); };
    t.forme('brumeC', (x, y) => { const d = Math.abs(x + 0.5 - xc); if (d >= W) return null; const haut = yT - 2.5 * k + Math.max(0, d - W * 0.3) * 0.5; if (y < haut || y > bas(x)) return null; if (y > bas(x) - 2 * k && hachage(Math.floor(x / k), Math.floor(y / k), 17) < 0.25) return null; return [(x + 0.5 - xc) / W * 0.8, y < haut + 2 * k ? -0.6 : 0.1, 0.8]; }, { decalage: 0.2, motif: (x, y) => ((Math.floor(x / k) + Math.floor(y / k)) % 4 === 0 ? 0.45 : y > bas(x) - 2 * k ? -0.4 : 0) });
  }

  if (porte('bague') && !dos) { const hx = X(pres * (ep + 0.6 * k), 1 * k); t.poser(Math.round(hx), Math.round(yB + 2.5 * k), 'or', 5); t.poser(Math.round(hx) + 1, Math.round(yB + 2.5 * k), 'or', 3); }
  if (costume === 'mentor' && !dos) pansManteau(yB + 2 * k, sol - 6 * k);
  // La pipe de Garrick, au coin de la bouche (voir après le visage)
  t.partie = 'tete';
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
      const bord = T.museau && race === 'loupgarou' ? null : bordProfil(y);   // (le loup n'a pas de nez humain : son museau est dessiné à part)
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
  // (v0.98) les boucles d'oreilles des femmes de l'ombre : un petit anneau d'or sous l'oreille
  if (ombreF && !dos && !['loupgarou', 'momie'].includes(race)) for (const cote of [loin, pres]) {
    const u = cote * P.rx * 1.02, z = -P.rx * 0.25; if (Z(u, z) < -P.rx * 0.3) continue;
    const bx = X(u, z) + cote * (T.oreilles === 'grandes' ? 1.5 : 0.5) * k, byo = cy + (T.oreilles === 'grandes' ? 3.2 : 4) * k;
    for (let a = 0; a < 6.3; a += 0.3) t.poser(Math.round(bx + Math.cos(a) * 1.1 * k), Math.round(byo + Math.sin(a) * 1.3 * k), 'or', a < 3 ? 5 : 3);
  }
  if (race === 'hobbit' && !dos) for (const cote of [-1, 1]) if (Z(cote * 4.5 * k, P.rx * 0.7) > 0) t.forme('peau', ellipsoide(X(cote * 4.5 * k, P.rx * 0.7), cy + 3.5 * k, 2.6 * k, 2 * k), { decalage: 0.35, bord: false, ombre: false });
  const ey = Math.round(cy + 1 * k);
  const by = ey + (T.nezBas ? 7.5 : 5) * k;
  // Le museau du loup-garou et du panda : une bosse qui avance sous les yeux, la truffe au bout.
  // (de biais et de profil, le loup a un vrai long museau, dessiné après les yeux : plus bas)
  const museauLoup = race === 'loupgarou' && T.museau && !dos && Math.abs(c) <= 0.9;
  if (T.museau && !dos) {
    const avance = race === 'panda' ? 1.5 : 4.2;
    const mx = profil ? cx + P.rx * 0.9 + avance * k : X(0, P.rx * 0.85) + s * avance * k;
    const rx = (race === 'panda' ? 3.6 : 3.4) * k * (profil ? 1.4 : Math.max(0.55, Math.abs(c) + 0.25)), ry = (race === 'panda' ? 2.6 : 3.4) * k;
    if (T.touffes) for (const cote of [-1, 1]) if (Z(cote * P.rx, P.rx * 0.2) > -1 * k) { const tx = X(cote * P.rx * 0.95, P.rx * 0.2); t.forme('peau', (x, y) => { const d = cote * (x + 0.5 - tx) / k, h = (y + 0.5 - cy - 2.5 * k) / k; return d > -2 && d < 4 && Math.abs(h - d * 0.25) < 2.6 - d * 0.55 ? [cote, 0.2, 0.6] : null; }, { motif: MECHES }); }
    if (!museauLoup) {
    t.forme('museau', ellipsoide(mx, ey + (race === 'panda' ? 3.2 : 3.6) * k, rx, ry), { decalage: 0.15 });
    const nx = profil ? mx + rx - 0.8 * k : mx + s * (rx - 0.8 * k);
    t.forme('truffe', ellipsoide(nx, ey + (race === 'panda' ? 2.2 : 1.6) * k, (race === 'panda' ? 1.1 : 1.5) * k, (race === 'panda' ? 0.9 : 1.1) * k), { ombre: false, bord: false }); t.poser(Math.round(nx - 0.4 * k), Math.round(ey + 1.8 * k), 'blanc', 3);
    }
  }
  if (T.verrues && !dos) for (const [u, z, dy] of [[-3.5, 0.8, 2.5], [4, 0.75, -1], [2, 0.6, 6], [-5, 0.5, -3]]) if (Z(u * k, P.rx * z) > 0) t.forme('peau', ellipsoide(X(u * k, P.rx * z), cy + dy * k, 0.9 * k, 0.8 * k), { decalage: -0.6, bord: false });
  let yeux = [];
  const poserYeux = () => { for (const [ox, large, cote] of yeux) {
    // (v1.34) il dort : les yeux fermés, une paupière en arc
    if (dort || options.yeuxFermes) { const w = large ? 1.3 * k : 0.8 * k; for (let i = -Math.round(w); i <= Math.round(w); i++) t.poser(Math.round(ox + i), Math.round(ey + 0.6 * k * (1 - (i / Math.max(1, w)) ** 2)), 'pupille', 1); continue; }
    // Un œil simple et posé : un petit blanc, la pupille sombre, un reflet d'un pixel, la paupière
    const w = (large ? 1.3 * k : 0.8 * k) * (stupeur ? 1.15 : 1), h = (pensif ? 1.75 : stupeur ? 1.95 : 1.4) * k;   // (il pense : les yeux grands ouverts vers le haut)
    // (les yeux de bête : tout l'œil de la couleur de l'iris, une pupille en fente)
    t.forme(T.fente ? 'iris' : 'blanc', ellipsoide(ox, ey, w, h), { decalage: T.fente ? 0.4 : 0.2, ombre: false, bord: false });
    const ix = ox + (large ? 0 : cote * 0.15 * k);
    // (v0.68) le joueur : l'iris prend la couleur choisie à la création, la pupille au milieu
    const irisJoueur = costume === 'joueur' && !T.fente;
    const iy = pensif ? ey - 0.55 * k : ey + 0.15 * k, ix2 = pensif ? ix + (Math.abs(s) > 0.05 ? s : 1) * 0.35 * k : ix;   // (il pense : le regard part en l'air, sur le côté)
    t.forme(irisJoueur ? 'iris' : 'pupille', ellipsoide(ix2, iy, T.fente ? 0.3 * k : (large ? 0.75 * k : 0.5 * k) * (stupeur ? 0.7 : 1), (pensif ? 0.85 : stupeur ? 0.75 : 1.05) * k), { ombre: false, bord: false });
    if (irisJoueur) t.poser(Math.round(ix2), Math.round(iy + 0.15 * k), 'pupille', 1);
    t.poser(Math.round(ix2 - 0.4 * k), Math.round(iy - 0.55 * k), 'blanc', 5);
    for (let i = -Math.round(w); i <= Math.round(w); i++) t.poser(Math.round(ox + i), Math.round(ey - h), 'pupille', 2);
    if (ombreF) for (let j = 1; j <= k; j++) t.poser(Math.round(ox + cote * (w + j * 0.6)), Math.round(ey - h - j * 0.7), 'pupille', 1);   // (les cils)
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
    if (profil || T.nez === 0 || museauLoup) { /* (le nez fait partie du contour, ou c'est un museau) */ } else {
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
        // (il pense : les sourcils montent, l'un un peu plus que l'autre)
        const dy = fache ? -2.6 * k + (i * versNez) / w * 1.3 * k : -3.2 * k + (i * i) / (w * w) * (race === 'elfe' ? 1.6 : 1) * k - (pensif ? (large ? 0.9 : 0.4) * k : 0) - (stupeur ? 1.3 * k : 0);
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
    const matLevre = sombre || (g.vieux && race === 'troll') ? 'peau' : 'levres';
    const tonFente = sombre ? 0 : 1, tonBas = sombre ? 4 : (race === 'nain' ? 3 : 4), tonHaut = sombre ? 1 : 2;
    const largeur = profil ? 1.2 : race === 'troll' ? 4.6 : race === 'hobbit' ? 2.1 : race === 'nain' ? 3 : race === 'elfe' ? (f ? 1.9 : 2.8) : race === 'magicienne' ? 2.3 : 2.8;
    const lb = Math.max(1, Math.round(largeur * k * (profil ? 1 : Math.abs(c))));
    const bouche = options.boucheForcee ?? (stupeur ? 2 : options.bouche ?? 0);   // 0 souriante, 1 neutre, 2 étonnée, 3 grognon (boucheForcee : une pose)
    const rond = stupeur || options.baille ? 'grand' : options.souffle ? 'petit' : null;   // (la bouche en O : stupeur, bâillement, souffle)
    const courbe = (g.vieux && race === 'troll' ? -0.4 : T.sourire ? 1.4 : bouche === 1 ? 0 : bouche === 3 ? -0.8 : race === 'hobbit' ? 1.2 : race === 'elfe' ? 0.3 : 0.8) * (profil ? 0.5 : 1);
    const epaisseur = elfeF ? 1 : Math.max(1, Math.round((profil ? 0.9 : 0.65) * k));
    // (v0.73) Grippesou qui t'accueille : le sourire du Grinch, un croissant immense qui remonte
    // jusqu'aux joues, rempli de dents serrées
    const grinch = pose === 'accueil' && gobelin && !profil, by0 = by;
    if (grinch) {
      const lg = Math.round(Math.min(5.4 * k, P.rx * 0.9) * Math.abs(c)), by = by0 - Math.round(1.4 * k);   // (plus haut : il mange les joues)
      for (let i = -lg; i <= lg; i++) {
        const u = i / lg, coin = Math.round(u * u * u * u * 1.8 * k);
        const haut = by + Math.round((1 - u * u) * 0.6 * k) - coin, bas = by + Math.round((1 - u * u) * 2.8 * k) - coin;
        const x = Math.round(bx + i);
        t.poser(x, haut, matLevre, tonFente);
        for (let y = haut + 1; y < bas; y++) t.poser(x, y, 'blanc', (Math.abs(i) % 3 === 1) ? 2 : y === haut + 1 || y === bas - 1 ? 3 : 5);   // (des dents serrées, l'ombre entre elles)
        t.poser(x, bas, matLevre, tonFente);
        if (Math.abs(u) < 0.85) t.poser(x, bas + 1, matLevre, tonBas);   // (la lèvre du bas, en lumière)
      }
      for (const cote of [-1, 1]) {   // les fossettes : les joues remontées par le sourire
        t.poser(Math.round(bx + cote * (lg + 1)), by - Math.round(1.6 * k), 'peau', 1);
        t.poser(Math.round(bx + cote * (lg + 1)), by - Math.round(1.6 * k) - 1, 'peau', 1);
      }
    }
    else if (museauLoup) { /* (la gueule est dessinée avec le museau) */ }
    else if (bouche === 2) t.forme('bouche', ellipsoide(bx, by + (rond === 'grand' ? (options.baille ? 1.1 : 0.9) : 0.5) * k, (rond === 'grand' ? 1.5 : rond === 'petit' ? 0.75 : 1.2) * k, (rond === 'grand' ? (options.baille ? 2.3 : 2.1) : rond === 'petit' ? 0.95 : 1.5) * k), { decalage: -0.5, ombre: false });
    else for (let i = -lb; i <= lb; i++) {
      const yy = by + Math.round((1 - (i * i) / (lb * lb)) * courbe * k);
      for (let e = 0; e < epaisseur; e++) t.poser(Math.round(bx + i), yy + e, matLevre, tonFente);               // la fente
      if (!elfeF && !profil && Math.abs(i) < lb && (Math.abs(c) > 0.9 || i <= 0)) t.poser(Math.round(bx + i), yy + epaisseur, matLevre, tonBas); // la lèvre du bas, en lumière
      if (!elfeF && !profil && Math.abs(i) < lb - 1 && race !== 'nain') t.poser(Math.round(bx + i), yy - 1, matLevre, tonHaut);   // la lèvre du haut
    }
    if (bouche === 0 && options.bouche !== undefined) for (let i = -Math.round(lb * 0.5); i <= Math.round(lb * 0.5); i++) t.poser(Math.round(bx + i), by + Math.round(0.8 * k) - 1, 'blanc', 4);
    if (!grinch && !elfeF && !museauLoup && Math.abs(c) > 0.3) t.poser(Math.round(bx - lb - 1), by, matLevre, tonFente);
    if (!grinch && !elfeF && Math.abs(c) > 0.9) t.poser(Math.round(bx + lb + 1), by, matLevre, tonFente);
    // La barbe : sur la moitié avant du menton et des joues
    const barbe = race === 'nain' && !(forgeron && f) ? 'nain' : g.barbe;   // (v0.82 : Baba n'a pas de barbe)
    if (typeof BARBES_HD !== 'undefined' && BARBES_HD[barbe]) BARBES_HD[barbe].dessin(ctxTete({ tete, bx, by, lb, ey }));   // (v1.32, planche 57)
    else if (barbe === 'rase') {
      // Une barbe courte et nette : un aplat sombre qui suit la mâchoire et le menton, une
      // moustache fine au-dessus de la bouche (lisible même de loin)
      t.forme('barbe', (x, y) => {
        if (y < by - 1.6 * k || y > cy + P.ry + 0.6 * k) return null;
        if (y >= by - 0.4 * k && y <= by + 0.9 * k && Math.abs(x + 0.5 - bx) < lb + 0.6 * k) return null;   // (la bouche)
        const n = tete(x, y); if (!n) return null;
        const fz = n[0] * s + n[2] * c;
        if (fz < 0.2) return null;
        const joue = y < by - 0.4 * k && Math.abs(x + 0.5 - bx) > lb + 1.2 * k;   // (pas de barbe sur les joues, au-dessus de la bouche)
        return joue ? null : n;
      }, { decalage: -0.9, bord: false, ombre: false });
    } else if (barbe === 'moustache') { for (let i = -lb - 1; i <= lb + 1; i++) for (let e = 0; e < k; e++) t.poser(Math.round(bx + i), by - 1.6 * k + e + (Math.abs(i) > lb - 1 ? 1 : 0), 'barbe', 3);
      if (costume === 'duc') {
        // (planche 75 v2) le duc : la moustache cirée, longue, aux pointes recourbées vers le haut, et une petite mouche
        const colle = (x, y, tol) => { for (let d = 0; d <= tol; d++) if (tete(x - d, y) || tete(x + d, y)) return true; return false; };
        const profilDuc = Math.abs(s) > 0.85, arriere = s > 0 ? -1 : 1;   // (de profil, on ne voit que le côté qui file vers la joue)
        for (const cote of [-1, 1]) { if (profilDuc && cote !== arriere) continue;
          const long = profilDuc ? lb + 1.2 * k : lb + 2.2 * k;
          for (let j = 0; j <= long; j++) { const x = Math.round(bx + cote * j), y = Math.round(by - 1.5 * k + j * 0.1); for (let e = 0; e < 2 * k - Math.floor(j / long * k); e++) if (colle(x, y + e, k)) t.poser(x, y + e, 'barbe', e < k * 0.6 ? 3 : 2); }
          const cxT = bx + cote * long, cyT = by - 2.6 * k, r = 1.3 * k;
          for (let a = 0; a <= Math.PI * 1.35; a += 0.12) { const x = Math.round(cxT + cote * Math.sin(a) * r), y = Math.round(cyT + Math.cos(a) * r); if (colle(x, y, k)) { t.poser(x, y, 'barbe', 3); t.poser(x, y + 1, 'barbe', 2); } }
        }
        for (let y = by + 1.6 * k; y < by + 4 * k; y++) for (let e = -k; e <= k; e++) if (Math.abs(e) < k * (1 - (y - by - 1.6 * k) / (3 * k))) { const gx = Math.round(bx + e), gy = Math.round(y); if (tete(gx, gy)) t.poser(gx, gy, 'barbe', 3); }
        // les paupières lourdes (l'air satisfait de lui-même), les sourcils hauts, et le pli des bajoues
        const yeux = []; for (let y = ey - 4 * k; y <= ey + 3 * k; y++) for (let x = 0; x < L; x++) { const m = t.mat(x, y); if (m && m !== 'peau' && m !== 'cheveux' && m !== 'barbe' && m !== 'metal' && tete(x, y)) yeux.push([x, y]); }
        if (yeux.length) { const y0 = Math.min(...yeux.map(p => p[1])), y1 = Math.max(...yeux.map(p => p[1])), lid = Math.round(y0 + (y1 - y0) * 0.5);
          for (const [x, y] of yeux) { if (y < lid) t.poser(x, y, 'peau', 3); else if (y === lid) t.poser(x, y, 'peau', 1); } }
        for (const cote of [-1, 1]) for (let j = 0; j < 3 * k; j++) { const x = Math.round(bx + cote * (lb + 3.2 * k + j * 0.25)), y = Math.round(by - 1 * k + j); if (t.mat(x, y) === 'peau') t.poser(x, y, 'peau', 2); }
        // les longues mèches fines, rejetées en arrière, qui tombent sur la fourrure (le front est dégarni)
        if (!dos && Math.abs(s) >= 0.2) {
          // la chevelure tombe sur le côté de la tête qui nous fait face : elle part du haut du crâne, couvre l'oreille, et
          // descend tout droit jusque sur l'épaule de notre côté (le front reste dégarni)
          const av = s > 0 ? 1 : -1, xe = X(pres * P.rx * 0.95, -0.1 * P.rx), basM = yT + 12 * k;
          const dansTete = (x, y) => { const nx = (x + 0.5 - cx) / (P.rx + 0.7 * k), ny = (y + 0.5 - cy) / (P.ry + 0.7 * k); return nx * nx + ny * ny <= 1; };
          const pts = [];
          for (let y = Math.round(cy - P.ry - 2 * k); y <= basM; y++) for (let x = 0; x < L; x++) {
            const m = t.mat(x, y); if (m === 'blanc' || m === 'pupille' || m === 'iris') continue;
            const f = (x + 0.5 - xe) * av;   // (en avant de l'oreille si > 0)
            let dedans = false;
            if (dansTete(x, y) && y < cy + P.ry * 0.55) {
              // sur le crâne : tout ce qui est derrière une ligne qui passe juste devant l'oreille et recule vers le haut (le front dégarni)
              const recul = Math.max(0, (cy - P.ry * 0.2) - y) * 0.55;
              // (de profil : le côté de la tête est dégarni ; la limite recule doucement vers l'arrière en descendant, l'oreille reste nue)
              dedans = profilDuc ? f < P.rx * 0.15 - recul - Math.max(0, y - (cy - P.ry * 0.45)) * 1.3 : f < P.rx * 0.32 - recul;
            }
            if (!dedans) continue;
            if (y > basM - hachage(Math.floor(x / k), 3, 71) * 4 * k) continue;   // (les pointes effilées)
            pts.push([x, y, f]); }
          for (const [x, y, f] of pts) {
            // les mèches : en arc sur le crâne, puis tout droit
            const surCrane = y < cy - P.ry * 0.1;
            const fil = surCrane ? Math.floor(Math.hypot(x + 0.5 - xe, y + 0.5 - (cy + P.ry * 0.3)) / (1.1 * k)) : Math.floor((f + P.rx + Math.sin(y / (4 * k)) * 0.7 * k) / (1.1 * k));
            const lum = (y < cy - P.ry * 0.5 ? 1 : 0) - (y > yT + 8 * k ? 1 : 0) - (f > P.rx * 0.2 && !surCrane ? 1 : 0);
            const motif = [3, 2, 3, 1, 2, 3, 0][((fil % 7) + 7) % 7];   // (des mèches nettes : une raie sombre de temps en temps)
            t.poser(x, y, 'cheveux', Math.max(0, Math.min(5, motif + lum)));
          }
        }
        // les longues mèches fines et détachées, des deux côtés, sous tous les angles : elles partent du côté du crâne, à
        // mi-hauteur de la tête (aux tempes), et tombent librement jusque sur les épaules, en ondulant un peu
        if (!dos) {
          const basM = yT + 12 * k, xe0 = X(pres * P.rx * 0.95, -0.1 * P.rx), av0 = s > 0 ? 1 : -1;
          const surVisage = (x, y) => { if (y > cy + P.ry * 0.95) return false; if (Math.abs(s) < 0.2) return Math.abs(x + 0.5 - cx) < P.rx * 0.74; return (x + 0.5 - xe0) * av0 > P.rx * 0.28; };
          const N = 11, biais = Math.abs(s) >= 0.2;
          for (const cote of [-1, 1]) {
            if (biais && cote !== pres) continue;   // (de biais et de profil : seulement le côté qui nous fait face)
            const u0 = cote * P.rx * 0.93;
            for (let i = 0; i < N; i++) {
              const ta = i / (N - 1);
              // de profil, la chevelure tombe de l'arrière du crâne, derrière la nuque (jamais sur la joue ni sur l'oreille)
              const z0 = profilDuc ? -P.rx * (0.6 + 0.55 * ta) : -P.rx * (0.02 + 0.62 * ta);
              if (!profilDuc && Z(u0, z0) < -P.rx * 0.72) continue;   // (de l'autre côté de la tête : on ne la voit pas)
              const zn = Math.min(1, -z0 / P.rx);
              const y0 = Math.round(profilDuc ? cy - P.ry * Math.sqrt(Math.max(0.01, 1 - zn * zn)) * 0.95 : cy - P.ry * (0.72 - 0.5 * ta * ta));
              const y1 = Math.round(basM + (profilDuc ? 5 * k : 0) - hachage(i, cote + 2, 73) * 5 * k);
              const ton = [3, 2, 3, 2, 4, 2, 3, 1, 3, 2, 3][i];
              for (let y = y0; y <= y1; y++) {
                const dy = y - y0, u = u0 + cote * (dy * 0.06 + (i % 3) * 0.55 * k * Math.abs(c)), z = z0 - dy * 0.03 - (i % 2) * 0.4 * k * Math.abs(s);
                const x = Math.round(X(u, z) + Math.sin(y / (3.6 * k) + i * 1.7) * 0.55 * k);
                for (let e = 0; e < k; e++) { const xx = x + e * cote; const m = t.mat(xx, y);
                  if (m === 'blanc' || m === 'pupille' || m === 'iris' || (m === 'peau' && surVisage(xx, y))) continue;
                  t.poser(xx, y, 'cheveux', Math.max(0, Math.min(5, ton + (dy < 2 * k ? 1 : 0) - (y > y1 - 2 * k ? 1 : 0) - (e === k - 1 ? 1 : 0)))); }
              }
            }
          }
          // de profil : de petites mèches fines et séparées (comme celles de face) qui partent de la lisière des cheveux, en haut
          // du crâne ; les unes filent vers la nuque et le dos, les autres passent derrière l'oreille et tombent devant l'épaule
          if (profilDuc) apresCoiffure.push(() => {
            const avP = s > 0 ? 1 : -1, PX = (f, v) => [cx + avP * f * P.rx, cy + v * P.ry];
            const meches = [   // [départ (f, v), passage, arrivée (f, y sous basM en k)]
              [[-0.12, -0.9], [-0.7, 0.2], [-1.05, 5]], [[-0.2, -0.75], [-0.6, 0.5], [-0.85, 6]], [[-0.3, -0.6], [-0.5, 0.7], [-0.62, 4]],
              [[-0.08, -0.85], [-0.25, 0.45], [0.05, 5]], [[-0.18, -0.65], [-0.15, 0.7], [0.35, 3]], [[-0.02, -0.95], [-0.05, 0.6], [0.65, 2]],
              [[-0.38, -0.45], [-0.3, 0.9], [0.9, 1]],
              // (et quelques-unes qui passent par-dessus les cheveux près du cuir chevelu, au-dessus et en arrière de l'oreille)
              [[-0.22, -0.45], [-0.3, 0.35], [-0.5, 3]], [[-0.4, -0.5], [-0.45, 0.3], [-0.72, 4]], [[-0.56, -0.42], [-0.62, 0.25], [-0.9, 5]],
              [[-0.7, -0.3], [-0.78, 0.3], [-1.02, 4]], [[-0.84, -0.15], [-0.92, 0.35], [-1.12, 6]] ];
            // (cinq de moins, réparties de l'arrière vers l'avant, pour le dégarnir un peu)
            [10, 9, 6, 3, 1].forEach(i => meches.splice(i, 1));
            meches.forEach(([a, m, b], i) => {
              const [x0, y0] = PX(a[0], a[1]), [x1, y1] = PX(m[0], m[1]), x2 = cx + avP * b[0] * P.rx, y2 = basM + b[1] * k;
              let dernier = null;
              for (let j = 0; j <= 600; j++) { const q = j / 600, w = 1 - q;
                const x = Math.round(w * w * x0 + 2 * w * q * x1 + q * q * x2 + Math.sin(q * 9 + i * 1.3) * 0.5 * k), y = Math.round(w * w * y0 + 2 * w * q * y1 + q * q * y2);
                const cle = x + ',' + y; if (cle === dernier) continue; dernier = cle;
                for (let e = 0; e < k; e++) { const xx = x - e * avP, mm = t.mat(xx, y);
                  if (mm === 'blanc' || mm === 'pupille' || mm === 'iris' || (mm === 'peau' && surVisage(xx, y))) continue;
                  t.poser(xx, y, 'cheveux', e === k - 1 ? 1 : (q > 0.93 ? 2 : (Math.floor(y / k) + i) % 3 === 0 ? 2 : 4)); }
              }
            });
          });
          // de biais : trois petites mèches fines et bien séparées, posées par-dessus, qui partent à hauteur des yeux et
          // descendent un peu plus bas que la chevelure (comme les petits cheveux de face)
          // (et deux autres, plus en avant, qui partent plus haut, devant la chevelure)
          if (biais && !profilDuc) apresCoiffure.push(() => { for (const [zz, hv] of [[0.15, 0.42], [0.28, 0.36]]) {
            const u0 = pres * P.rx * 1.0, z0 = P.rx * zz, y0 = Math.round(cy - P.ry * hv), y1 = Math.round(basM + 1 * k);
            for (let y = y0; y <= y1; y++) {
              const dy = y - y0, x = Math.round(X(u0 + pres * dy * 0.04, -z0 - dy * 0.015) + Math.sin(y / (3.4 * k) + zz * 9) * 0.6 * k);
              for (let e = 0; e < k; e++) { const xx = x + e * pres, m = t.mat(xx, y);
                if (m === 'blanc' || m === 'pupille' || m === 'iris' || (m === 'peau' && surVisage(xx, y))) continue;
                t.poser(xx, y, 'cheveux', e === k - 1 ? 0 : (y > y1 - 2 * k ? 2 : (Math.floor(y / k) % 3 === 0 ? 2 : 4))); }
              t.poser(x - pres, y, 'cheveux', 1);
            }
          } });
          if (biais && !profilDuc) for (let i = 0; i < 3; i++) {
            const u0 = pres * P.rx * 0.98, z0 = -P.rx * [0.42, 0.6, 0.78][i];
            const y0 = Math.round(cy - P.ry * 0.12 + i * 0.6 * k), y1 = Math.round(basM + (3 + i * 1.5) * k);
            for (let y = y0; y <= y1; y++) {
              const dy = y - y0, x = Math.round(X(u0 + pres * dy * 0.05, z0 - dy * 0.02) + Math.sin(y / (3.2 * k) + i * 2.1) * 0.7 * k);
              for (let e = 0; e < k; e++) { const xx = x + e * pres, m = t.mat(xx, y);
                if (m === 'blanc' || m === 'pupille' || m === 'iris' || (m === 'peau' && surVisage(xx, y))) continue;
                t.poser(xx, y, 'cheveux', e === k - 1 ? 0 : (y > y1 - 2 * k ? 2 : 4)); }
              t.poser(x - pres, y, 'cheveux', 1);   // (un fil sombre qui la détache de la masse)
            }
          }
        }
      } }
    else if (barbe) {
      const long = barbe === 'sage' ? yT + 11 * k : barbe === 'nain' ? yB - 2 * k : barbe === 'pleine' ? cy + P.ry + 4 * k : cy + P.ry + 1.5 * k;
      t.forme('barbe', (x, y) => {
        if (y < ey + 3 * k || y > long) return null;
        if (barbe !== 'sage' && y >= by - 1 * k && y <= by + 1.8 * k && Math.abs(x + 0.5 - bx) < (barbe === 'nain' ? 3.6 : 3) * k) return null;
        let demi = (barbe === 'nain' ? P.rx - 0.8 * k : P.rx + 0.5 * k) - Math.max(0, y - cy - P.ry) * (barbe === 'nain' ? 0.25 : barbe === 'sage' ? 0.3 : 0.6);
        // (v1.02) une longue barbe a un volume : de profil, elle tombe sous le menton (sa profondeur), au lieu de
        // déborder devant le visage et sur les cheveux de la nuque
        if (BARBES_VOLUME.includes(barbe)) demi = section(demi, P.rx * 0.55 - Math.max(0, y - cy - P.ry) * 0.12);
        const centre = X(0, P.rx * 0.35 + Math.max(0, y - cy - P.ry) * 0.1);
        const nx = (x + 0.5 - centre) / demi;
        if (Math.abs(nx) > 1 || (barbe === 'bouc' && Math.abs(x + 0.5 - bx) > 3 * k)) return null;
        const fz = -nx * c * s + Math.sqrt(Math.max(0, 1 - nx * nx)) * Math.abs(c) + s * 0.3;
        return fz > 0.2 ? [nx * 0.8, (y - ey) / (20 * k), 0.8] : null;
      }, { motif: MECHES });
      // (v1.02) le Grand Sage : la longue barbe couvre la bouche, dont on ne voit qu'un trait d'ombre sous la moustache
      if (barbe === 'sage') for (let i = -Math.round(1.8 * k); i <= Math.round(1.8 * k); i++) { const x = Math.round(bx + i), y = by - (Math.abs(i) > 1.2 * k ? 1 : 0); if (t.mat(x, y) === 'barbe') t.poser(x, y, 'barbe', 0); }
      if (barbe === 'nain') for (let y = yT + 6 * k; y < yB; y += 3 * k) { t.poser(Math.round(bx), y, 'or', 3); t.poser(Math.round(bx) + 1, y, 'or', 5); }
    }
    // Les grandes dents de Grippesou (et des gobelins), les défenses des orcs et des trolls, les
    // canines des vampires, les crocs du loup-garou
    const dents = T.dents || (gobelin ? 'gobelin' : null);
    if (grinch) { /* (ses dents sont déjà dans le sourire) */ }
    else if (dents === 'gobelin') for (let j = -2; j <= 2; j++) { const x = Math.round(bx + j * 1.1 * k); for (let e = 0; e < Math.round(1.2 * k) - (j % 2 ? 1 : 0); e++) t.poser(x, by + 1 + e, 'blanc', e ? 3 : 5); }   // (des dents pointues, une sur deux plus courte)
    else if (dents === 'defenses') for (const cote of (profil ? [1] : [-1, 1])) {
      // Deux petites défenses d'ivoire qui sortent du fond de la mâchoire et se recourbent vers le haut
      const x0 = bx + cote * (lb + 0.6 * k), y0 = by + 1.4 * k;
      for (let j = 0; j < 3 * k; j++) { const u = j / (3 * k), epd = Math.max(1, Math.round((1.3 - u * 0.9) * k)); for (let e = 0; e < epd; e++) t.poser(Math.round(x0 + cote * u * u * 1.4 * k) + e * cote - (epd > 1 ? cote : 0), Math.round(y0 - j), 'ivoire', u > 0.7 ? 5 : e ? 2 : 4); }
    }
    else if (dents === 'canines') for (const cote of (profil ? [1] : [-1, 1])) { const x = Math.round(bx + cote * 1.3 * k); for (let j = 0; j < 2.6 * k; j++) t.poser(x, by + epaisseur + j, 'blanc', j > 1.6 * k ? 5 : 4); }   // (des canines qui dépassent bien de la lèvre)
    else if (dents === 'crocs' && !museauLoup) for (const cote of (profil ? [1] : [-1, 1])) { const x = Math.round((profil ? cx + P.rx * 0.9 + 3 * k : X(0, P.rx * 0.85) + s * 3 * k) + cote * 1.8 * k); for (let j = 0; j < 2.2 * k; j++) t.poser(x, Math.round(ey + 5 * k) + j, 'blanc', j > k ? 5 : 3); }
    if (museauLoup) {
      // Le long museau du loup : un fuseau qui part du front et s'affine vers la truffe, gris dessus,
      // clair dessous ; la gueule en trait sombre et deux crocs qui dépassent
      const d = profil ? 1 : (Math.sign(s) || 1);
      const x0 = profil ? cx + P.rx * 0.45 : X(0, P.rx * 0.75) - d * 2.5 * k;
      const L = (profil ? 13 : 11) * k;
      const haut = u => ey - 0.4 * k + u * 1.3 * k, bas = u => ey + 7.4 * k - u * 2.3 * k;
      const fuseau = (x, y) => {
        const u = d * (x + 0.5 - x0) / L;
        if (u < 0 || u > 1 || y + 0.5 < haut(u) || y + 0.5 > bas(u)) return null;
        const v = (y + 0.5 - haut(u)) / (bas(u) - haut(u));
        return [d * 0.4, (v - 0.5) * 0.8, 0.7];
      };
      t.forme('peau', fuseau, { decalage: 0.1, motif: MECHES });
      t.forme('museau', (x, y) => { const u = d * (x + 0.5 - x0) / L; return fuseau(x, y) && y + 0.5 > haut(u) + (bas(u) - haut(u)) * 0.42 ? fuseau(x, y) : null; }, { decalage: 0.2, bord: false });
      // la cassure du front (le « stop ») et l'ombre sous la mâchoire, là où le museau sort de la tête
      for (let j = 0; j < Math.round(0.45 * L); j++) { const u = j / L; t.poser(Math.round(x0 + d * j), Math.round(haut(u)), 'peau', 1); t.poser(Math.round(x0 + d * j), Math.round(bas(u)), 'peau', 1); }
      const tx = x0 + d * (L - 0.6 * k);
      t.forme('truffe', ellipsoide(tx, haut(1) + 1 * k, 1.8 * k, 1.3 * k), { ombre: false, bord: false });
      t.poser(Math.round(tx - 0.4 * k), Math.round(haut(1) + 0.6 * k), 'blanc', 3);
      for (let j = Math.round(0.25 * L); j < Math.round(0.95 * L); j++) t.poser(Math.round(x0 + d * j), Math.round(bas(j / L) - 1.2 * k), 'truffe', 1);
      for (const cu of profil ? [0.72] : [0.62, 0.86]) {
        const xc = Math.round(x0 + d * cu * L), yc = Math.round(bas(cu) - 1.2 * k) + 1;
        for (let j = 0; j < 1.8 * k; j++) t.poser(xc, yc + j, 'blanc', j > k ? 5 : 3);
      }
    }
  }

  if (costume === 'mentor' && !dos) {
    // La pipe de Garrick : le tuyau au coin de la bouche, le fourneau qui remonte, la braise et la fumée
    t.rampes.pipe = rampe(0x8a5a32); t.rampes.fumee = rampe(0xc8c8cc);   // (bois clair : elle se détache de la barbe)
    const d = profil ? 1 : (Math.sign(s) || 1);
    const mx = (profil ? cx + P.rx * 0.8 : X(0, P.rx * 0.85)) + d * 1.2 * k, my = by + 0.5 * k;
    for (let j = 0; j <= 4 * k; j++) for (let e = 0; e < Math.max(1, Math.round(0.7 * k)); e++) t.poser(Math.round(mx + d * j), Math.round(my + j * 0.3) + e, 'pipe', e ? 1 : 3);
    const fx2 = mx + d * 4.5 * k, fy2 = my + 1.2 * k;
    t.forme('pipe', (x, y) => (Math.abs(x + 0.5 - fx2) < 1.3 * k && y >= fy2 - 2.6 * k && y <= fy2 + 0.4 * k ? [(x + 0.5 - fx2) / (1.3 * k), -0.2, 0.8] : null), { decalage: 0.2, ombre: false });
    t.poser(Math.round(fx2), Math.round(fy2 - 2.6 * k), 'levres', 5);
    for (let j = 0; j < 3; j++) t.poser(Math.round(fx2 + Math.sin(j * 1.4) * k), Math.round(fy2 - 3.5 * k - j * 1.6 * k), 'fumee', 5 - j);
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
    // (v1.61) des mèches dressées qui suivent la courbe du crâne, du front à la nuque, comme sur son buste (le bloc
    // posé à plat sur la tête ressemblait à un petit chapeau)
    // (une mèche du côté caché du crâne ne se voit que là où elle dépasse de la tête : de face, rien sur le visage)
    for (let i = 0; i <= 8; i++) {
      const a = Math.PI * (0.36 + i * 0.075), du = Math.cos(a) * P.rx, dy = -Math.sin(a) * P.ry;   // (le long de l'axe du crâne)
      const nx = s * Math.cos(a), ny = -Math.sin(a), nn = Math.hypot(nx, ny) || 1;
      const A = [X(0, du * 0.92), cy + dy * 0.92], lg = (i % 2 ? 2.4 : 3.4) * k * (1 - Math.abs(i - 4) * 0.05);
      const ux = nx / nn * lg, uy = ny / nn * lg, r = (i % 2 ? 0.9 : 1.15) * k, cachee = Z(0, du) < 0;
      t.forme('cheveux', (x, y) => {
        if (cachee && t.mat(x, y) && t.mat(x, y) !== 'cheveux') return null;
        const u = Math.max(0, Math.min(1, ((x + 0.5 - A[0]) * ux + (y + 0.5 - A[1]) * uy) / (lg * lg)));
        const px = x + 0.5 - (A[0] + u * ux), py = y + 0.5 - (A[1] + u * uy), rr = r * (1 - u * 0.55), d = Math.hypot(px, py);
        return d < rr ? [px / rr, py / rr * 0.5 - 0.3, Math.sqrt(Math.max(0.05, 1 - (d / rr) ** 2))] : null;
      }, { decalage: i % 2 ? -0.3 : 0.2 });
    }
  } else if (coupe === 'boucles') {
    for (const [u, dy, z] of [[-6, -5, 2], [-2, -8, 3], [3, -8, 3], [7, -5, 2], [-8, -1, -2], [8, -1, -2], [0, -6, -5], [-5, -3, -6], [5, -3, -6]]) {
      if (Z(u * k, z * k) < -3 * k && !dos) continue;
      t.forme('cheveux', ellipsoide(X(u * k, z * k), cy + dy * k, 3 * k, 3 * k));
    }
  } else if (coupeHD) {
    coupeHD.dessus(ctxTete({ tete }));
    for (const f of apresCoiffure) f();
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
  // (v0.98) les mèches qui encadrent le visage de la vampire, les fleurs piquées dans les cheveux
  if (T.meches && !dos) for (const cote of [loin, pres]) { const u = cote * P.rx * 0.92; if (Z(u, P.rx * 0.35) < 0) continue; const mx = X(u, P.rx * 0.35); t.forme('cheveux', (x, y) => (y >= cy - P.ry * 0.5 && y <= cy + P.ry + 3 * k && Math.abs(x + 0.5 - mx) < 1.3 * k ? [cote * 0.5, 0, 0.8] : null), { decalage: 0.2, motif: MECHES }); }
  if (T.fleurs && !dos) for (const [u, dy, r] of [[-0.8, -0.7, 2.4], [0.5, -0.95, 2.1], [-0.25, -1.05, 1.7]]) fleurHD(t, X(u * P.rx, P.rx * 0.45), cy + dy * P.ry, r * k, T.fleurs);
  if (!dos) { t.relief = false; poserYeux(); t.relief = true; }
  // (v1.01) le masque d'os des anciens, sur le visage : deux orbites sombres
  if (porte('masqueOs') && !dos) {
    t.forme('osM', (x, y) => { const n = ellipsoide(X(0, P.rx * 0.6), cy + 0.5 * k, P.rx * 0.78, P.ry * 0.78)(x, y); return n && y > cy - P.ry * 0.55 ? n : null; }, { decalage: 0.5, ombre: false, motif: (x, y) => (hachage(Math.floor(x / k), Math.floor(y / k), 47) > 0.9 ? -0.8 : 0) });
    for (const [ox] of yeux) for (let dy = -k; dy <= k; dy++) for (let dx = -k; dx <= k; dx++) t.poser(Math.round(ox + dx), Math.round(ey + 0.3 * k + dy), 'cuir', 0);
  }
  if (porte('monocle') && !dos && yeux.length) { const [ox] = yeux[yeux.length - 1]; for (let a = 0; a < 6.3; a += 0.25) t.poser(Math.round(ox + Math.cos(a) * 2.6 * k), Math.round(ey + 0.3 * k + Math.sin(a) * 2.8 * k), 'or', a < 3 ? 4 : 2); for (let j = 0; j < 5 * k; j++) t.poser(Math.round(ox + 2.6 * k + (j % 2 ? 1 : 0)), Math.round(ey + 3 * k + j), 'or', 3); }
  if (porte('pipe') && !dos) { const bx = X(0, P.rx * 0.85); const px = Math.round(bx + s * 2 * k - 2 * k); for (let j = 0; j < 5 * k; j++) for (let e = 0; e < k; e++) t.poser(px - j, by + Math.floor(j / (2 * k)) * k + e, 'bruyere', 3); t.forme('bruyere', ellipsoide(px - 5 * k, by + 2.5 * k, 1.4 * k, 1.6 * k), { decalage: 0.1, ombre: false }); for (let j = 0; j < 3; j++) t.poser(px - 5 * k - j, by - 1 * k - j * 2 * k, 'blanc', 4 + (j % 2)); }
  if (coupeHD && coupeHD.derriere && dos) coupeHD.derriere(ctxTete());
  if (longs && dos) t.forme('cheveux', (x, y) => (y >= cy && y <= yT + 10 * k && Math.abs(x + 0.5 - cx) < P.rx + 1 * k - Math.max(0, y - yT - 4 * k) * 0.4 ? [(x + 0.5 - cx) / (P.rx + 2 * k), 0, 0.8] : null), { decalage: -0.3, motif: MECHES });
  // le diadème (v1.61 : d'argent et sa pierre chez l'elfe voyageur, qui le porte toujours en buste ; d'or à la légende)
  const diademe = tenue >= 4 && race !== 'nain' && race !== 'magicienne' ? 'or' : race === 'elfe' && voyageurBuste ? 'metal' : null;
  if (diademe) for (let j = -5; j <= 5; j++) { const x = Math.round(X(j * k, Math.sqrt(Math.max(0, P.rx * P.rx - (j * k) ** 2)) * 0.9)); for (let e = 0; e < k; e++) t.poser(x + e, Math.round(cy - P.ry + 1 * k + (j % 3 === 0 ? -1 * k : 0)), diademe === 'metal' && j === 0 ? 'iris' : diademe, j % 3 === 0 ? 5 : 4); }   // (v1.61 : arrondi ; une tête de hauteur impaire, l'elfe, l'orc, le perdait)

  // --- Les couvre-chefs des peuples ---
  // (v1.61) Le casque du nain, comme sur son buste : seulement s'il le porte (le gène `armure`, sinon ses cheveux), une
  // calotte de métal à arête, un bandeau d'or clouté au bord, un nasal ; plus de cornes (son buste n'en a pas)
  if (race === 'nain' && g.armure && costume !== 'banquier' && costume !== 'gardien' && costume !== 'givrin' && !forgeron) {
    const calotte = ellipsoide(cx, cy - 2 * k, P.rx + 0.8 * k, P.ry), bord = Math.round(cy - 4 * k);
    t.forme('metal', (x, y) => { const n = calotte(x, y); return n && y <= bord ? n : null; }, { decalage: 0.2 });
    if (!dos) t.forme('metal', (x, y) => (y < bord - 2 * k && calotte(x, y) && Math.abs(x + 0.5 - X(0, P.rx * 0.95 * Math.sqrt(Math.max(0, 1 - ((y + 0.5 - cy + 2 * k) / P.ry) ** 2)))) < 0.8 * k ? [0, -0.5, 0.8] : null), { decalage: 0.9, ombre: false, bord: false });   // l'arête
    t.forme('or', (x, y) => { const n = calotte(x, y); return n && y > bord - 2 * k && y <= bord ? [n[0], 0, n[2]] : null; }, { decalage: 0.2, ombre: false });
    for (let j = -3; j <= 3; j++) { const u = j * P.rx * 0.3, z = Math.sqrt(Math.max(0, P.rx * P.rx - u * u)); if (Z(u, z) > 0 || dos) for (let e = 0; e < k; e++) t.poser(Math.round(X(u, z * (dos ? -1 : 1))) + e, bord - k, 'or', 5); }
    if (!dos) for (let y = cy - 2 * k; y <= cy + 3 * k; y++) for (let e = 0; e < k; e++) t.poser(Math.round(X(0, P.rx)) - (k - 1) + e - Math.round(s * k), y, 'metal', 4);
  }
  if (race === 'magicienne') {
    // Le chapeau de mage : une grande calotte souple qui se plie et retombe, un large bord
    // ondulé, un ruban à boucle (v1.61 : d'or, comme sur son buste)
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
    for (let x = Math.round(cx - P.rx - 1 * k); x <= cx + P.rx + 1 * k; x++) for (let e = 0; e < k; e++) t.poser(x, haut - 2 * k + e, 'or', 3 + e);
    t.forme('or', ellipsoide(X(0, P.rx), haut - 1.5 * k, 1.4 * k, 1.4 * k), { decalage: 0.5, ombre: false });
  }
  if (porte('chapeau')) {
    // Le chapeau de cow-boy : calotte pincée, large bord relevé sur les côtés
    const haut = cy - P.ry;
    t.forme('feutre', (x, y) => (y >= haut - 7 * k && y <= haut + 1 * k && Math.abs(x + 0.5 - X(0, -0.5 * k)) < 6 * k - Math.max(0, haut - 5 * k - y) * 0.5 ? [(x + 0.5 - cx) / (6 * k), -0.2, 0.8] : null), { motif: (x, y) => (y < haut - 3 * k && Math.abs(x + 0.5 - X(0, -0.5 * k)) < 1.5 * k ? -0.9 : 0) });
    t.forme('feutre', (x, y) => { const d = Math.abs(x + 0.5 - cx); const rel = d > 8 * k ? Math.round((d - 8 * k) * 0.7) : 0; return y >= haut + 1 * k - rel - 0.5 * k && y <= haut + 2 * k - rel && d < 12 * k * Math.max(0.6, Math.abs(c) + 0.2) ? [0, (y - haut - 1.5 * k) * 0.8 / k, 0.8] : null; }, { decalage: -0.1 });
    for (let x = Math.round(cx - 5 * k); x <= cx + 5 * k; x++) for (let e = 0; e < k; e++) t.poser(x, haut - 1 * k + e, 'cuir', 2);
  }
  // (v1.05) le bonnet de laine du Long Hiver (et le long bonnet du Père Givrin) : la calotte côtelée qui coiffe le
  // crâne jusqu'au-dessus des sourcils, le revers de laine blanche, le pompon (au bout de la pointe qui retombe, pour
  // le Père Givrin)
  if (porte('bonnetHiver') || costume === 'givrin') {
    const bord = Math.round(cy - P.ry * 0.3), poil = (x, y) => ((Math.floor(x / k) + Math.floor(y / k)) % 2 ? 0.35 : -0.15);
    t.forme('bonnetH', (x, y) => { const n = ellipsoide(cx, cy - 0.5 * k, P.rx + 1 * k, P.ry + 1.8 * k)(x, y); return n && y <= bord ? n : null; }, { decalage: 0.05, motif: (x) => (Math.floor((x - cx) / k) % 3 === 0 ? -0.3 : 0) });
    let pom = [X(0, -0.5 * k), cy - P.ry - 3.4 * k];
    if (costume === 'givrin') {
      const dir = X(0, -1 * k) < cx - 0.1 ? -1 : 1, x0 = X(0, -0.5 * k), y0 = cy - P.ry - 1 * k;
      // (la pointe monte, puis retombe derrière l'oreille : elle reste dans le dessin)
      const point = u => [x0 + dir * Math.sin(u * Math.PI * 0.55) * Math.min(7 * k, P.rx + 1 * k), y0 - Math.sin(u * Math.PI * 0.9) * 4.5 * k + u * u * 9 * k];
      for (let j = 0; j <= 24; j++) { const u = j / 24, [px, py] = point(u); t.forme('bonnetH', ellipsoide(px, py, (3.8 - 2.6 * u) * k, (3.8 - 2.6 * u) * k), { decalage: 0.1 - u * 0.4, ombre: false }); }
      const [px, py] = point(1); pom = [px, py + 1.5 * k];
    }
    t.forme('fourrure', (x, y) => { const n = ellipsoide(cx, cy - 0.5 * k, P.rx + 1.7 * k, P.ry + 2.4 * k)(x, y); return n && y >= bord - 2.6 * k && y <= bord + 0.5 * k ? [n[0], -0.1, n[2]] : null; }, { decalage: 0.2, motif: poil });
    t.forme('fourrure', ellipsoide(pom[0], pom[1], 2.5 * k, 2.4 * k), { decalage: 0.35, motif: poil });
  }
  // (v1.00) la couronne de fleurs du Solstice : une tresse de paille autour du crâne, des fleurs piquées dedans
  if (porte('couronneFleurs')) {
    const yc = cy - P.ry + (porte('chapeau') ? -1 : 2) * k;
    const larg = (P.rx + 1 * k) * Math.max(0.75, Math.abs(c) * 0.3 + 0.75);
    for (let x = Math.round(cx - larg); x <= cx + larg; x++) for (let e = 0; e < 1.5 * k; e++) t.poser(x, Math.round(yc + e + Math.abs(x - cx) / larg * 1.2 * k), 'paille', 2 + ((x + e) % 3 === 0 ? 2 : 1));
    const fleurs = ['fleurB', 'fleurJ', 'fleurR', 'fleurB', 'fleurR', 'fleurJ', 'fleurB'];
    fleurs.forEach((m, i) => {
      const u = -1 + (2 * i) / (fleurs.length - 1), fx = cx + u * larg * 0.9, fy = yc + Math.abs(u) * 1.2 * k + 0.5 * k;
      if (dos && Math.abs(u) < 0.2) return;
      t.forme(m, ellipsoide(fx, fy, 1.3 * k, 1.2 * k), { decalage: 0.5, ombre: false });
      t.poser(Math.round(fx), Math.round(fy), 'fleurJ', 2);
    });
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
  } else if (costume === 'gardeRoyal') {
    // (planche 75 v2) le casque haut de la garde de Pont-Royal : une ogive d'acier poli qui monte en pointe, les
    // joues fermées, un nasal ; de chaque côté, une aile blanche d'oiseau de mer, les plumes vers le haut
    const sommet = cy - P.ry - 12 * k;
    t.forme('metal', (x, y) => { if (y < sommet || y > cy + 3.5 * k) return null; const dx = x + 0.5 - cx;
      const demi = y <= cy - 2 * k ? (P.rx + 1.2 * k) * Math.pow(Math.max(0, (y - sommet) / (cy - 2 * k - sommet)), 0.85) : P.rx + 1.2 * k;
      if (Math.abs(dx) > demi) return null;
      if (y > cy - 3.2 * k && !dos && Math.abs(x + 0.5 - X(0, P.rx * 0.9)) < P.rx * 0.8 * Math.max(0.6, Math.abs(c)) + 0.5 * k) return null;   // (le visage reste à l'air)
      return [dx / (P.rx + 1.5 * k), (y - cy) / (P.ry + 12 * k), 0.75]; }, { decalage: 0.25, motif: (x, y) => (Math.floor((x + 0.5 - cx) / k) % 3 === 0 && y < cy - 3 * k ? 0.4 : 0) });
    if (!dos) for (let y = cy - 3 * k; y <= cy + 2 * k; y++) for (let e = 0; e < k; e++) t.poser(Math.round(X(0, P.rx)) - (k - 1) + e - Math.round(s * k), y, 'metal', 5);
    for (let y = sommet + 2 * k; y < cy - 3 * k; y++) for (let e = 0; e < k; e++) { const x = Math.round(X(0, P.rx * Math.min(1, (y - sommet) / (P.ry + 8 * k)))) + e; if (t.mat(x, y) === 'metal') t.poser(x, y, 'argent', 5); }
    for (let y = cy - 3 * k; y < cy - 2 * k; y++) for (let x = 0; x < L; x++) if (t.mat(x, y) === 'metal') t.poser(x, y, 'argent', 4);
    for (const cote of [-1, 1]) { const bx = X(cote * (P.rx + 0.4 * k), 0), by = cy - 2 * k;
      for (let f = 0; f < 7; f++) { const a = -Math.PI / 2 + cote * (0.15 + f * 0.13), lg = (9 - Math.abs(f - 2) * 0.8) * k;
        for (let j = 0; j < lg; j++) { const x = Math.round(bx + Math.cos(a) * j + cote * j * 0.08), y = Math.round(by + Math.sin(a) * j); for (let e = 0; e < Math.max(1, k * 0.8); e++) t.poser(x + e * cote, y, 'plume', j > lg - 2 * k ? 5 : f % 2 ? 3 : 4); } } }
  } else if (costume === 'banquier') {
    // Le haut-de-forme, et son ruban d'or
    const haut = cy - P.ry;
    t.forme('chapeau', (x, y) => (y >= haut - 10 * k && y <= haut + 1 * k && Math.abs(x + 0.5 - X(0, -1 * k)) < 6 * k ? [(x + 0.5 - cx) / (7 * k), -0.2, 0.8] : null));
    t.forme('chapeau', (x, y) => (y >= haut && y <= haut + 1.5 * k && Math.abs(x + 0.5 - cx) < P.rx + 2 * k ? [0, -0.5, 0.8] : null), { decalage: -0.2 });
    for (let x = Math.round(cx - 6 * k); x <= cx + 6 * k; x++) for (let e = 0; e < k; e++) t.poser(x, haut - 2 * k + e, 'or', 3 + e);
    if (race === 'nain' && !dos) for (let a = 0; a < 6.3; a += 0.2) t.poser(Math.round(X(P.rx * 0.46, P.rx * 0.78) + Math.cos(a) * 2.8 * k), Math.round(ey + 0.3 * k + Math.sin(a) * 3 * k), 'or', 4); // le monocle
  } else if (costume === 'pirate') {
    // Le tricorne : une calotte basse, un large bord relevé en trois cornes, bordé d'or
    const haut = cy - P.ry;
    t.forme('chapeau', (x, y) => (y >= haut - 5 * k && y <= haut + 1 * k && Math.abs(x + 0.5 - X(0, -0.5 * k)) < 5.5 * k - (haut - y) * 0.2 ? [(x + 0.5 - cx) / (7 * k), -0.3, 0.8] : null));
    t.forme('chapeau', (x, y) => { const d = x + 0.5 - cx, ad = Math.abs(d); const releve = ad > P.rx * 0.5 ? (ad - P.rx * 0.5) * 0.45 : 0;
      return y >= haut - 1.2 * k - releve && y <= haut + 1.2 * k - releve * 0.5 && ad < P.rx + 4 * k ? [d / (P.rx + 6 * k), -0.4, 0.8] : null; }, { decalage: -0.1 });
    const bord = [];
    for (let y = haut - 12 * k; y <= haut + 2 * k; y++) for (let x = 0; x < L; x++) if (t.mat(x, y) === 'chapeau' && t.mat(x, y - 1) !== 'chapeau' && y > haut - 2.5 * k - Math.abs(x + 0.5 - cx) * 0.5) bord.push([x, y]);
    for (const [x, y] of bord) t.poser(x, y, 'or', 3);
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
  } else if (costume === 'mendiant' || costume === 'gobelin' || costume === 'passeur' || costume === 'renegat') {
    // Une capuche râpée, qui encadre le visage
    t.forme('cape', (x, y) => { const n = ellipsoide(X(0, -0.5 * k), cy - 1 * k, P.rx + 1.5 * k, P.ry + 1.8 * k)(x, y); if (!n) return null; const fz = n[0] * s + n[2] * c; return (y < cy - 3 * k || fz < (gobelin ? 0.25 : 0.4)) && y < yT + 3 * k ? n : null; }, { decalage: -0.3, motif: costume === 'mendiant' ? (x, y) => (hachage(Math.floor(x / k), Math.floor(y / k), 31) > 0.9 ? -1 : 0) : null });
    if (costume === 'renegat') {
      // (planche 79) le foulard remonté sur le museau, et l'insigne de la Confrérie rayé d'un coup de couteau
      // (les oreilles rondes passent par deux fentes de la capuche : on les reconnaît de loin)
      if (T.oreilles === 'rondes') { oreille(-1); oreille(1); }
      if (!dos) for (let y = Math.round(ey + 3 * k); y <= yT + 1 * k; y++) for (let x = 0; x < L; x++) { const m = t.mat(x, y); if (m && m !== 'cape' && Math.abs(x + 0.5 - cx) < P.rx + 1.5 * k) t.poser(x, y, 'foulard', y < ey + 4 * k ? 4 : hachage(Math.floor(x / k), Math.floor(y / k), 7) > 0.8 ? 2 : 3); }
      if (!dos) { const bx = X(-2 * k, prof), by = yT + 7 * k; t.forme('or', ellipsoide(bx, by, 2.5 * k, 2.5 * k), { decalage: 0.3, ombre: false }); t.forme('habit', ellipsoide(bx, by, 1.3 * k, 1.3 * k), { decalage: 0.6, ombre: false, bord: false });
        for (let j = -3 * k; j <= 3 * k; j++) { t.poser(Math.round(bx + j), Math.round(by - j * 0.8), 'entaille', 0); t.poser(Math.round(bx + j + 1), Math.round(by - j * 0.8), 'entaille', 1); } }
    }
  } else if (costume === 'mainNoire') {
    // La capuche profonde, pointue, qui avance sur le front et tombe sur les épaules : le visage
    // reste dans l'ombre jusqu'aux yeux
    const hx = X(0, 0.2 * k);
    t.forme('cape', (x, y) => { if (y > yT + 6 * k) return null;
      const n = ellipsoide(hx, cy - 1 * k, P.rx + 2.6 * k, P.ry + 3 * k)(x, y);
      const pointe = y < cy - P.ry + 2 * k && y > cy - P.ry - 10 * k && Math.abs(x + 0.5 - X(0, -2.5 * k) + (cy - P.ry + 2 * k - y) * 0.45) < (y - (cy - P.ry - 10 * k)) * 0.62 ? [-0.3, -0.6, 0.7] : null;
      const epaules = y >= yT - 1 * k && Math.abs(x + 0.5 - cx) < ep + 2.5 * k - Math.max(0, yT + 2 * k - y) * 0.6 ? [(x + 0.5 - cx) / (ep + 3 * k), 0, 0.8] : null;
      if (n) { const fz = n[0] * s + n[2] * c; if (!(y < ey - 1.5 * k || fz < 0.5)) return null; return n; }
      return pointe || epaules; }, { decalage: -0.4, motif: (x, y) => (hachage(Math.floor(x / k), Math.floor(y / k), 37) > 0.9 ? -0.8 : 0) });
    // tout le visage dans l'ombre de la capuche : seuls les yeux luisent
    for (let y = 0; y < yT; y++) for (let x = 0; x < L; x++) if (t.mat(x, y) === 'peau' || t.mat(x, y) === 'cheveux' || t.mat(x, y) === 'levres') { if (y < ey + 1.5 * k) t.poser(x, y, t.mat(x, y), 0); else if (y < ey + 3 * k) t.poser(x, y, t.mat(x, y), Math.max(0, t.teinte(x, y) - 1)); }
    for (let y = yT + 6 * k - 2 * k; y <= yT + 6 * k; y++) for (let x = 0; x < L; x++) if (t.mat(x, y) === 'cape' && hachage(Math.floor(x / k), 0, 43) > 0.5) { t.c[y * L + x] = null; t.m[y * L + x] = null; }
  } else if (costume === 'serpent') {
    // La capuche verte des archers, à longue pointe qui retombe dans le dos, et le camail à dents
    // sur les épaules, fermé par une émeraude
    t.forme('cape', (x, y) => { const n = ellipsoide(X(0, -0.6 * k), cy - 1.5 * k, P.rx + 1.1 * k, P.ry + 1.4 * k)(x, y);
      const bec = y < cy - P.ry + 1 * k && y > cy - P.ry - 3 * k && Math.abs(x + 0.5 - X(0, -1.5 * k) + (cy - P.ry + 1 * k - y) * 0.6) < (y - (cy - P.ry - 3 * k)) * 0.9 ? [0, -0.6, 0.7] : null;
      if (!n) return bec; const fz = n[0] * s + n[2] * c; return (y < cy - 3.2 * k || fz < 0.42) && y < yT + 3 * k ? n : null; }, { decalage: -0.2, motif: (x, y) => (hachage(Math.floor(x / k), Math.floor(y / k), 19) > 0.88 ? -0.7 : 0) });
    // le bord replié autour du visage, plus clair
    const bordC = []; for (let y = 0; y < yT; y++) for (let x = 0; x < L; x++) if (t.mat(x, y) === 'cape' && ['peau', 'cheveux', 'blanc', 'pupille', 'iris'].some(m => t.mat(x - 1, y) === m || t.mat(x + 1, y) === m || t.mat(x, y + 1) === m)) bordC.push([x, y]);
    for (const [x, y] of bordC) for (let e = 0; e < k; e++) if (t.mat(x - (s > 0 ? e : -e), y) === 'cape') t.poser(x - (s > 0 ? e : -e), y, 'cape', 5);
    // la longue pointe de la capuche, qui retombe dans le dos jusqu'aux omoplates
    if (!dos && Math.abs(s) > 0.3) for (let j = 0; j < 16 * k; j++) { const u = j / (16 * k); const px = X(0, -P.rx * (0.9 + u * 0.6)) - Math.sin(u * 2.2) * 2 * k * (s > 0 ? 1 : -1), py = cy - P.ry * 0.7 + j * 0.95; t.forme('cape', ellipsoide(px, py, Math.max(0.6 * k, 2.4 * k * (1 - u * 0.8)), 1.1 * k), { decalage: -0.5 }); }
    t.forme('cape', (x, y) => (y >= yT - 1 * k && y <= yT + 6 * k && Math.abs(x + 0.5 - cx) < ep + 2 * k - Math.max(0, yT + 1 * k - y) * 0.8 && !(y > yT + 4 * k && Math.floor(x / k) % 3 === 1) ? [(x + 0.5 - cx) / (ep + 3 * k), 0, 0.8] : null), { decalage: -0.2 });
    if (!dos) t.forme('emeraude', ellipsoide(X(0, prof * 1.05), yT + 1 * k, 1.1 * k, 1.1 * k), { decalage: 0.5, ombre: false });
  } else if (costume === 'cambrioleur') {
    // Le bonnet serré, roulé au bord ; puis le loup noir en travers des yeux (les yeux restent visibles)
    const bh = cy - 1.2 * k;
    t.forme('bonnetH', (x, y) => { const n = ellipsoide(X(0, -0.3 * k), cy - 0.6 * k, P.rx + 0.8 * k, P.ry + 1.2 * k)(x, y); return n && y < bh ? n : null; }, { decalage: -0.2, motif: (x, y) => (Math.floor(x / k) % 2 ? -0.4 : 0) });
    t.forme('bonnetH', (x, y) => (y >= bh - 1.4 * k && y < bh + 0.4 * k && Math.abs(x + 0.5 - X(0, -0.3 * k)) < P.rx + 1.2 * k ? [(x + 0.5 - cx) / (P.rx + 2 * k), 0.2, 0.8] : null), { decalage: 0.1 });
    for (let y = Math.round(ey - 1.8 * k); y <= Math.round(ey + 1.3 * k); y++) for (let x = 0; x < L; x++) if (t.mat(x, y) === 'peau' || t.mat(x, y) === 'cheveux') t.poser(x, y, 'masque', y < ey - 1 * k ? 3 : 2);
  } else if (costume === 'mentor') {
    // Rien sur la tête : Garrick a ses cheveux bruns, longs et ondulés
  }
  // (v1.02) les coiffes des Gardiens : le cercle d'argent, la petite couronne des nains, le diadème de feuilles
  if (costume === 'gardien' && ['cercle', 'couronne', 'feuilles'].includes(atours.coiffe)) {
    const metal = atours.metal || 'or', yc = cy - P.ry + 2.5 * k, haut = atours.coiffe === 'couronne' ? 2.4 : atours.coiffe === 'feuilles' ? 2 : 0;
    t.forme(metal, (x, y) => { const d = Math.abs(x + 0.5 - X(0, -0.5 * k)); if (d > P.rx + 0.6 * k) return null; const pointe = Math.abs(((x + 0.5 - cx) % (2.6 * k) + 2.6 * k) % (2.6 * k) - 1.3 * k); return y >= yc - 0.8 * k - Math.max(0, 1.3 * k - pointe) * haut * 0.8 && y <= yc + 0.6 * k ? [(x + 0.5 - cx) / (P.rx + 1 * k), -0.2, 0.8] : null; }, { decalage: 0.3 });
    if (Z(0, P.rx * 0.8) > 0) t.forme(atours.coiffe === 'couronne' ? 'ecaille' : 'cristal', ellipsoide(X(0, P.rx * 0.8), yc - 0.1 * k, 0.8 * k, 0.8 * k), { decalage: 0.6, ombre: false });
  }
  // (v1.02) la couronne d'or du Grand Sage : un bandeau, des pointes, des pierres bleues
  if (costume === 'sage') {
    const yc = cy - P.ry + 2 * k;
    t.forme('or', (x, y) => { const d = Math.abs(x + 0.5 - X(0, -0.5 * k)); if (d > P.rx + 0.8 * k) return null; const pointe = Math.abs(((x + 0.5 - cx) % (3 * k) + 3 * k) % (3 * k) - 1.5 * k); return y >= yc - 1.5 * k - Math.max(0, 1.4 * k - pointe) * 1.6 && y <= yc + 1 * k ? [(x + 0.5 - cx) / (P.rx + 1 * k), -0.2, 0.8] : null; }, { decalage: 0.3 });
    for (const u of [-0.55, 0, 0.55]) if (Z(u * P.rx, P.rx * 0.8) > 0) t.forme('cristal', ellipsoide(X(u * P.rx, P.rx * 0.8), yc - 0.2 * k, 0.8 * k, 0.8 * k), { decalage: 0.6, ombre: false });
  }
  // L'écuelle tendue du mendiant
  if (costume === 'mendiant' && !dos) { const mx = X(pres * (ep + 0.6 * k), 2.5 * k); t.forme('metal', ellipsoide(mx, yB + 0.5 * k, 3.2 * k, 1.6 * k), { decalage: -0.2 }); t.poser(Math.round(mx), Math.round(yB - 0.5 * k), 'or', 4); t.poser(Math.round(mx) + 1, Math.round(yB - 0.5 * k), 'or', 5); }
  t.partie = 'corps';
  // --- 6. De dos : la cape par-dessus tout ---
  if (capee && dos) dessinerCape(true);
  if (placeArme === 'dos' && dos) armeDansLeDos();

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
      if (fente) { t.poser(x, y, 'noir', 0); continue; }
      // Des bandes de 3 pixels HD, en biais (dans un sens sur la tête et les jambes, dans l'autre sur le torse)
      const pente = y < yT ? -0.3 : y > yB ? 0.22 : 0.42;
      const b = (((y + x * pente) / k) % 3 + 3) % 3;
      const ton = t.k[y * t.l + x];
      t.poser(x, y, 'bande', b < 0.45 ? 0 : b > 2.5 ? Math.max(1, ton - 1) : Math.min(5, Math.max(2, ton)));
    }
    // Les yeux : deux lueurs dans la fente
    if (!dos) for (const [ox] of yeux) { t.poser(Math.round(ox), Math.round(ey), 'iris', 5); t.poser(Math.round(ox) + 1, Math.round(ey), 'iris', 4); t.poser(Math.round(ox), Math.round(ey) - 1, 'iris', 3); }
    // (v0.98) la momie : quelques bandelettes roses parmi les blanches, et un diadème d'or au rubis
    if (T.rose) { t.rampes.bandeRose = rampe(0xe8a0b8); for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) if (t.mat(x, y) === 'bande' && (((Math.floor((y + x * (y < yT ? -0.3 : y > yB ? 0.22 : 0.42)) / k / 3)) % 6) + 6) % 6 === 2) t.poser(x, y, 'bandeRose', t.k[y * t.l + x]); }
    if (T.diademe && !dos) {
      t.rampes.rubis = rampeVive(0xd02040);
      const dy = cy - P.ry * 0.5;
      t.forme('or', (x, y) => { const nx = (x + 0.5 - cx) / (P.rx + 0.6 * k); return Math.abs(nx) <= 1 && Math.abs(y + 0.5 - dy - nx * nx * 1.5 * k) < 0.9 * k ? [nx, 0, 0.8] : null; }, { decalage: 0.4 });
      const front = X(0, P.rx);
      for (const [du, h] of [[0, 3.8], [-2.6, 2.4], [2.6, 2.4]]) { const px = front + du * k * Math.max(0.5, c); t.forme('or', (x, y) => { const d = Math.abs(x + 0.5 - px); return y <= dy && y >= dy - h * k + d * h / 1.3 ? [0, -0.4, 0.8] : null; }, { decalage: 0.4 }); }
      t.forme('rubis', ellipsoide(front, dy + 0.2 * k, 1.2 * k, 1.3 * k), { decalage: 0.6, ombre: false });
    }
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
  // Les aînés s'appuient sur une canne noueuse, tenue dans la main de devant
  if ((pensif || mange || boit) && mainDevant && !dos) {
    const { M, C, r: rb, matMain, matAvant: mA, gm } = mainDevant;
    const mi = [C[0] + (M[0] - C[0]) * 0.55, C[1] + (M[1] - C[1]) * 0.55];
    cylindre(t, mA, mi, M, rb - 0.3 * k, { decalage: 0.5 });
    t.forme(matMain, ellipsoide(M[0], M[1] + 0.4 * k * gm, 2.3 * k * gm, 2 * k * gm), { decalage: 0.6 });
    for (const d of [-1, 0, 1]) t.poser(Math.round(M[0] + d * 0.9 * k), Math.round(M[1] - 1 * k), matMain, 1);   // (les doigts repliés)
  }
  if (costume === 'sage' && mainDevant && !leves && !pose) {
    const { M, matMain, gm } = mainDevant;
    const dehors = M[0] < cx ? -1 : 1;
    const bas = [M[0] + dehors * 1.5 * k, sol], haut = [M[0] + dehors * 0.4 * k, cy - P.ry - 8 * k];
    cylindre(t, 'batonS', haut, bas, 1.3 * k, { decalage: 0.5, motif: (x, y) => ((Math.floor((y + x * 1.6) / k) % 4) === 0 ? -0.8 : 0) });   // (le bois torsadé)
    // en haut, les branches qui s'enroulent autour du cristal
    for (const sens of [-1, 1]) for (let j = 0; j < 7 * k; j++) { const a = j / (7 * k); t.poser(Math.round(haut[0] + sens * Math.sin(a * Math.PI) * 2.6 * k), Math.round(haut[1] - a * 7 * k), 'batonS', 2); t.poser(Math.round(haut[0] + sens * Math.sin(a * Math.PI) * 2.6 * k) + 1, Math.round(haut[1] - a * 7 * k), 'batonS', 3); }
    t.forme('cristal', (x, y) => { const dx = Math.abs(x + 0.5 - haut[0]), dy = y + 0.5 - (haut[1] - 3.5 * k); return dx / (1.6 * k) + Math.abs(dy) / (3.2 * k) <= 1 ? [(x + 0.5 - haut[0]) / (1.6 * k), dy / (3.2 * k), 0.8] : null; }, { decalage: 0.8, ombre: false });
    t.poser(Math.round(haut[0] - 0.5 * k), Math.round(haut[1] - 4.5 * k), 'blanc', 5);
    t.forme(matMain, ellipsoide(M[0], M[1] + 1 * k * gm, 2.2 * k * gm, 2.3 * k * gm), { decalage: 0.6 });   // la main serrée dessus
    t.bout = null; t.batonSage = [haut[0], haut[1] - 3.5 * k];   // (le cœur du cristal : pour sa lueur)
  } else if (options.armeMain && mainDevant) {
    // (planche 86) l'arme en action (posesHD.js), dans la main de devant
    const avant = t.partie; t.partie = 'brasP';
    options.armeMain({ t, k, kA: k * TAILLE_ARMES_PORTEES, M: mainDevant.M, C: mainDevant.C, matMain: mainDevant.matMain, gm: mainDevant.gm, segBras, dessinerArmeAxe, cx, cy, P, sol, yT, yB, ep, X, s, c, pres, loin, dos, arme });
    t.partie = avant;
  } else if ((placeArme === 'main' || placeArme === 'mains') && mainDevant) {
    const { M, matMain, gm } = mainDevant;
    const dehors = M[0] < cx ? -1 : 1, kA = k * TAILLE_ARMES_PORTEES;
    if (arme === 'griffes') { t.forme('cuir', ellipsoide(M[0], M[1] + 0.5 * kA, 2.6 * kA, 1.4 * kA), { decalage: 0.7 }); for (const d of [-1, 0, 1]) cylindre(t, 'lameA', [M[0] + d * 1.1 * kA, M[1] + 2 * kA], [M[0] + d * 1.6 * kA + dehors * 1.2 * kA, M[1] + 7.5 * kA], 0.55 * kA, { decalage: 0.9 }); }
    else if (arme === 'massue') { cylindre(t, 'boisA', [M[0], M[1] - 1 * kA], [M[0] + dehors * 2 * kA, M[1] + 6 * kA], 0.8 * kA, { decalage: 0.5 }); t.forme('boisA', ellipsoide(M[0] + dehors * 3 * kA, M[1] + 10 * kA, 2.6 * kA, 4 * kA), { decalage: 0.5 }); for (const [u, v] of [[-1, 8.5], [1.2, 10], [-0.4, 12.5], [0.8, 7.5]]) t.forme('ferA', ellipsoide(M[0] + dehors * 3 * kA + u * kA, M[1] + v * kA, 0.6 * kA, 0.6 * kA), { decalage: 0.9, ombre: false }); }
    else dessinerArmeAxe([M[0] + dehors * 0.3 * k, Math.max(2, cy - P.ry - (arme === 'lance' ? 8 : 4) * k)], [M[0] + dehors * 1.2 * k, sol]);   // (la lance, le bâton : debout, tenus à la main)
    t.forme(matMain, ellipsoide(M[0], M[1] + 1 * k * gm, 2.2 * k * gm, 2.3 * k * gm), { decalage: 0.95 });   // la main serrée dessus
  } else if (g.vieux && !leves && mainDevant && pose !== 'baluchon') {
    const { M, matMain, gm } = mainDevant;
    t.rampes.canne = rampe(0xa0703c);
    const dehors = M[0] < cx ? -1 : 1;   // (la canne s'écarte de la jambe, vers l'extérieur)
    const bas = [M[0] + dehors * 2.5 * k, sol], haut = [M[0], M[1] - 1.5 * k];
    cylindre(t, 'canne', haut, bas, 1.5 * k, { decalage: 0.5 });
    t.forme('canne', ellipsoide(haut[0] - dehors * 0.8 * k, haut[1] - 0.4 * k, 2.2 * k, 1.6 * k), { decalage: 0.5 });   // le pommeau
    t.forme(matMain, ellipsoide(M[0], M[1] + 1 * k * gm, 2.2 * k * gm, 2.3 * k * gm), { decalage: 0.4 });   // la main serrée dessus
  }
  if (g.vieux && T.bandelettes) moisirBandelettes(t, k);
  // (v0.64) Les plis de tous les vêtements (les deux bandes ont déjà les leurs) : au coude et au genou,
  // le tissu se fronce en anneaux ; sur la poitrine, il se tend en plis qui convergent vers la
  // ceinture ; plus bas (tuniques, robes, capes), il retombe en plis droits qui ondulent.
  if (costume !== 'mainNoire' && costume !== 'serpent' && !T.bandelettes) {
    const h = hachage((g.nom || '').length, 7, 97) * 6;
    const etoffes = joueur ? ['habit', 'cape', 'bas', 'gilet'] : ['habit', 'cape', 'lin', 'bas', 'gilet'];   // (le tablier du marchand est une toile raide)
    const proche = (x, y, A, B) => { const dx = B[0] - A[0], dy = B[1] - A[1], l2 = dx * dx + dy * dy || 1, u = Math.max(0, Math.min(1, ((x - A[0]) * dx + (y - A[1]) * dy) / l2)); return [Math.hypot(x - A[0] - u * dx, y - A[1] - u * dy), u * Math.sqrt(l2)]; };
    const fronces = (x, y, segs) => {
      for (const [A, B, , r] of segs) {
        const [d1, l1] = proche(x, y, A, B);
        if (d1 > r + 0.5) continue;
        const reste = Math.hypot(B[0] - A[0], B[1] - A[1]) - l1;   // (la distance au coude ou au genou)
        if (reste > 4 * k) return 0;
        return Math.sin(reste / (0.8 * k) + h) * (1 - reste / (5 * k));
      }
      for (const [, B, C, r] of segs) { const [d2, l2] = proche(x, y, B, C); if (d2 <= r + 0.5) return l2 < 3 * k ? Math.sin(l2 / (0.8 * k) + h + 1) * (1 - l2 / (4 * k)) : 0; }
      return null;
    };
    const ox = X(0, prof);
    for (let y = yT; y <= sol; y++) for (let x = 0; x < L; x++) {
      const i = y * L + x, m = t.m[i];
      if (!etoffes.includes(m)) continue;
      let f = (m === 'bas' ? fronces(x, y, segJambes) : null) ?? fronces(x, y, segBras);
      if (f !== null && f !== undefined) { if (f > 0.55) t.poser(x, y, m, Math.min(5, t.k[i] + 1)); else if (f < -0.5) t.poser(x, y, m, Math.max(0, t.k[i] - 1)); continue; }
      if (m === 'bas') continue;
      if (y < yB - 1 * k && m !== 'cape') {
        const y0 = yT + Math.max(3 * k, P.torse * 0.3);
        if (y < y0) continue;
        // (des plis espacés selon la carrure : pas de soleil de rayons sur les grands torses)
        const a = Math.atan2(x + 0.5 - ox, yB + 5 * k - y) * ep / (5 * k);
        f = Math.sin(a * 2.6 + Math.sin(y / (2.5 * k) + x / (4 * k)) * 0.7 + h) * Math.min(1, (y - y0) / (3 * k)) * (Math.abs(x + 0.5 - ox) < 1.5 * k ? 0.5 : 1);
        if (f > 0.93) t.poser(x, y, m, Math.min(5, t.k[i] + 1)); else if (f < -0.9) t.poser(x, y, m, Math.max(0, t.k[i] - 1));
        continue;
      }
      f = Math.sin((x - cx) / (1.4 * k) + Math.sin(y / (5 * k) + h) * 0.9 + h);
      if (f > 0.88) t.poser(x, y, m, Math.min(5, t.k[i] + 1)); else if (f < -0.84) t.poser(x, y, m, Math.max(0, t.k[i] - 1));
    }
  }
  // (v0.58) Blessé : un bandage autour du front, un autre au poignet, des accrocs dans le manteau
  // et des taches de sang (Garrick, quand on le repêche dans la rivière)
  if (options.blesse && !dos) {
    t.rampes.sang = rampe(0x9a1c1c);
    const y0 = Math.round(cy - P.ry * 0.6), y1 = Math.round(cy - P.ry * 0.28);
    for (let y = y0; y <= y1; y++) for (let x = Math.round(cx - P.rx - k); x <= cx + P.rx + k; x++) { const m = t.mat(x, y); if (m === 'peau' || m === 'cheveux') t.poser(x, y, 'lin', y === y0 ? 4 : y === y1 ? 1 : 3); }
    for (let x = Math.round(cx - P.rx * 0.9); x < cx + P.rx; x += 3 * k) for (let e = 0; e < k; e++) if (t.mat(x + e, y0 + k) === 'lin') t.poser(x + e, y0 + k, 'lin', 2);   // (les tours de bande)
    t.forme('sang', ellipsoide(cx + P.rx * 0.3 * (c >= 0 ? 1 : -1), (y0 + y1) / 2, 1.4 * k, 1.1 * k), { bord: false, decalage: 0.2 });
    // les accrocs : une déchirure en zigzag, sombre, avec un bord effiloché plus clair au-dessus
    for (const [dx, dy, lg] of [[-0.6, 1.5, 5], [0.45, 0.35, 4], [0.2, 1.9, 4], [-0.15, 0.9, 3]]) {
      const x0 = Math.round(cx + dx * ep), y0d = Math.round(yT + dy * (yB - yT));
      for (let j = 0; j < lg * k; j++) {
        const x = x0 + j - Math.round(lg * k / 2), y = y0d + ((j >> 1) % 2 ? 1 : 0) * k;
        for (let e = 0; e < k; e++) { const m = t.mat(x, y + e); if (m === 'cape' || m === 'habit' || m === 'bas') { t.poser(x, y + e, m, 0); if (t.mat(x, y - 1) === m) t.poser(x, y - 1, m, 4); } }
      }
    }
    for (const [dx, dy, r] of [[-0.35, 0.45, 2.6], [0.3, 0.8, 2], [0.1, 1.3, 1.6]]) {
      const px = cx + dx * ep, py = yT + dy * (yB - yT);
      t.forme('sang', (x, y) => { const m = t.mat(x, y); return (m === 'habit' || m === 'cape' || m === 'bas') && Math.hypot(x + 0.5 - px, y + 0.5 - py) < r * k * (0.75 + 0.5 * hachage(x, y, 5)) ? [0, 0, 1] : null; }, { bord: false });
    }
    if (mainDevant) { const { M } = mainDevant; for (let y = Math.round(M[1] - 6 * k); y <= Math.round(M[1] - 3.5 * k); y++) for (let x = Math.round(M[0] - 3 * k); x <= Math.round(M[0] + 3 * k); x++) { const m = t.mat(x, y); if (m && m !== 'lin' && m !== 'sang') t.poser(x, y, 'lin', y % 2 ? 3 : 4); } }
  }
  // (v0.68) Le bâton du baluchon : de la main, il passe sur l'épaule proche et part en arrière ; la
  // poche (une image à part) pend à son bout, dans le dos. Les doigts se referment par-dessus.
  if (pose === 'baluchon' && mainDevant && !dos) {
    const { M, matMain, gm, cote } = mainDevant;
    const E2 = [X(cote * (ep - 1.2 * k), -0.8 * k), yT - 1.6 * k];
    const d = [E2[0] - M[0], E2[1] - M[1]];
    const debut = [M[0] - d[0] * 0.18, M[1] - d[1] * 0.18], bout = [M[0] + d[0] * 1.95, M[1] + d[1] * 1.95];
    t.rampes.baton = rampe(0x7a5228);
    traitHD(t, 'baton', [debut, bout], 0.75 * k, 0.2);
    t.forme(matMain, ellipsoide(M[0], M[1] + 0.3 * k, 1.9 * k * gm, 1.6 * k * gm), { decalage: 0.3 });   // les doigts autour du bâton
    t.bout = [Math.round(bout[0]), Math.round(bout[1])];
  }
  if (assise) {
    // sous les pieds, plus rien : la cape et la robe se posent sur le banc au lieu de descendre au sol
    for (let y = solAssis + 1; y < t.h; y++) for (let x = 0; x < t.l; x++) { const i = y * t.l + x; t.c[i] = null; t.m[i] = null; t.k[i] = 0; }
    t.piedsAssis = solAssis;
    t.tailleAssis = yB;   // (v1.44) la taille : là où il s'assoit, pour le poser sur un lit ou un rebord
  }
  if (pose === 'epaules') {
    const coupe = Math.round(yB + 6 * k);
    for (let y = coupe + 1; y < t.h; y++) for (let x = 0; x < t.l; x++) { const i = y * t.l + x; t.c[i] = null; t.m[i] = null; t.k[i] = 0; }
    t.assise = yB + 1 * k;   // (la hauteur des fesses : à poser sur la nuque du porteur)
  }
  t.mainXY = mainDevant ? [mainDevant.M[0], mainDevant.M[1]] : null;   // (v1.34 : où est la main, pour y tenir un objet)
  t.reperes = { cy, yT, yB, H, ...(t.batonSage ? { cristal: t.batonSage } : {}) };   // (v1.01 : pour poser un enfant sur des épaules, etc.)
  t.reperes2 = { cx, cy, yT, yB, sol, ep, H, L };   // (planches 85 et 86 : les articulations, pour le rig et les poses)
  contourEpais(t, CONTOUR_CORPS.tours);
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
