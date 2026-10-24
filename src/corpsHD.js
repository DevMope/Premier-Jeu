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
  // (planche 75 v2, validée) Pont-Royal : son duc, gras et arrogant, et la garde du pont
  duc: { race: 'humain', nom: 'Le duc Aldebert Pansard', costume: 'duc', habit: 0x5a1a26, cheveux: 0xc0662a, barbe: 'moustache', coiffure: 'degarniDuc', peau: 0, niveau: 3, proportions: { H: 70, ep: 15.2, torse: 26, rx: 8.6, ry: 9.4, membre: 1.25 }, cape: 0x3e1e30 },
  gardeRoyal: { race: 'humain', nom: 'Garde du pont', costume: 'gardeRoyal', habit: 0x1c1c24, cheveux: 0x1a1612, coiffure: 'long', niveau: 2, fache: true },
  banquier: { race: 'humain', nom: 'Banquier', costume: 'banquier', habit: 0x26262e, cheveux: 0x1a1a20 },
  nainBanquier: { race: 'nain', nom: 'Thorgrim', costume: 'banquier', habit: 0x26262e, cheveux: 0xe0e0e0 },
  colporteur: { race: 'humain', nom: 'Colporteur', costume: 'colporteur', habit: 0x6a5a40, cheveux: 0x4a3a2a, cape: 0x4a3a2a, barbe: 'courte' },   // (v1.61 : la barbe courte de son buste)
  mentor: { race: 'humain', nom: 'Garrick', costume: 'mentor', habit: 0x2e2420, cheveux: 0x3a281a, cape: 0x3e4a2a, barbe: 'rase', coiffure: 'long', peau: 1, niveau: 2 },   // (peau : la même teinte que son buste)
  mentorBlesse: { race: 'humain', nom: 'Garrick', costume: 'mentor', habit: 0x2e2420, cheveux: 0x3a281a, cape: 0x3e4a2a, barbe: 'rase', coiffure: 'long', peau: 1, niveau: 2, blesse: true },   // (v0.58 : repêché dans la rivière)
  gobelin: { race: 'gobelin', nom: 'Grippesou', costume: 'gobelin', habit: 0x6a5030, cheveux: 0x5a3a20 },
  // (v1.61) le bourgmastre, le héraut et le crieur passent au comptoir : avec `buste`, leur buste prend leurs couleurs (et
  // la tenue de la garde pour le héraut et le crieur) ; `peau` : celle que leur nom leur donnait déjà en pied
  bourgmastre: { race: 'humain', nom: 'Odilon Bonnefoi', costume: 'banquier', habit: 0x4a2a5a, cheveux: 0xb0b0b8, barbe: 'moustache', niveau: 3, peau: 2, buste: true },
  heraut: { race: 'humain', nom: 'Le héraut', costume: 'garde', habit: 0x2a4a8a, cheveux: 0x5a3a1a, peau: 4, buste: true },
  crieur: { race: 'humain', nom: 'Le crieur', costume: 'garde', habit: 0x7a4a1a, cheveux: 0x2a1a10, barbe: 'moustache', niveau: 2, peau: 4, buste: true },   // (v1.11) le crieur du marché, quand il vient au comptoir
  rivalA: { race: 'humain', nom: 'Lucien Belhomme', costume: 'noble', habit: 0x2a4a8a, cape: 0xece6d8, cheveux: 0xd8b048, barbe: 'moustache', coiffure: 'court', peau: 0, niveau: 3, buste: true },   // (v1.11, planche 40 v2) le paon du Conseil
  passeur: { race: 'humain', nom: 'Le Passeur', costume: 'pirate', coiffure: 'long', habit: 0x1e2236, cheveux: 0x1a1418, cape: 0x8a1616, barbe: 'courte', niveau: 2 },
  silhouette: { race: 'humain', nom: 'Silhouette encapuchonnée', costume: 'passeur', habit: 0x2a2430, cheveux: 0x1a1418, cape: 0x1a1620, barbe: 'courte', niveau: 1 },
  // (v0.59) les brigands et les pillards des récits, capuche sur la tête, l'air mauvais
  brigand: { race: 'humain', nom: 'Brigand', costume: 'passeur', habit: 0x4a2e2a, cheveux: 0x2a1a12, cape: 0x2e2622, barbe: 'courte', niveau: 1, fache: true },
  brigande: { race: 'humain', nom: 'Brigande', feminin: true, costume: 'passeur', habit: 0x34402a, cheveux: 0x6a2a1a, cape: 0x26301e, niveau: 1, fache: true },
  pillard: { race: 'humain', nom: 'Pillard', costume: 'passeur', habit: 0x9a7a4a, cheveux: 0x1a1410, cape: 0x7a5a36, barbe: 'pleine', peau: 4, niveau: 1, fache: true },
  pillarde: { race: 'humain', nom: 'Pillarde', feminin: true, costume: 'passeur', habit: 0x8a4a2a, cheveux: 0x1a1410, cape: 0x6a4a30, peau: 3, niveau: 1, fache: true },
  // (v1.59, planche 79) les pandas renégats : des déserteurs de la Confrérie, condamnés pour « propagation de complots sur le passé »
  renegatWen: { race: 'panda', nom: 'Wen Ombre-de-Bambou', costume: 'renegat', habit: 0x3a5276, cheveux: 0x201c1c, cape: 0x3e4452, niveau: 2, fache: true },
  renegateLin: { race: 'panda', nom: 'Lin Patte-Grise', feminin: true, costume: 'renegat', habit: 0x3a5276, cheveux: 0x201c1c, cape: 0x3e4452, niveau: 1, fache: true },
  renegatHao: { race: 'panda', nom: 'Hao Sans-Serment', costume: 'renegat', habit: 0x3a5276, cheveux: 0x201c1c, cape: 0x3e4452, niveau: 1, fache: true },
  // (v0.82, étape 10b) les forgerons du comptoir
  aldo: { race: 'humain', nom: "Aldo l'apprenti", costume: 'forgeron', habit: 0x8a6a4a, cheveux: 0xa86a2a, coiffure: 'court', peau: 1, niveau: 0, buste: true },
  baba: { race: 'nain', nom: "Baba Marteau-d'Or", feminin: true, costume: 'forgeron', habit: 0x8a2a2a, cheveux: 0x141010, coiffure: 'court', peau: 3, niveau: 1, buste: true, marques: ['khol', 'anneauNez'] },
  // (v1.02, dessin du joueur) le Grand Sage : il apparaît au deuxième Solstice
  sage: { race: 'humain', nom: 'Le Grand Sage', costume: 'sage', habit: 0x4a2466, cheveux: 0xe8e8ec, cape: 0xa02a22, barbe: 'sage', coiffure: 'long', peau: 1, niveau: 2, vieux: true, bouche: 1 },
  // (v1.02, planche 33) le Conseil des Gardiens, que préside le Grand Sage : un Gardien par royaume, en robe aux
  // couleurs de son royaume, l'étole blanche du Conseil, et la broche d'écaille rouge (un indice : le dragon)
  gardienComte: { race: 'hobbit', nom: 'Maître Bertolin Pommeval', costume: 'gardien', habit: 0x4a8a3a, cape: 0x2e5a24, cheveux: 0x6a4424, coiffure: 'court', barbe: 'moustache', peau: 1, niveau: 2, bouche: 0, atours: { metal: 'or', coiffe: 'chaine' } },
  gardienneHommes: { race: 'humain', feminin: true, nom: 'Dame Aliénor de Hautval', costume: 'gardien', habit: 0x9a2424, cape: 0x5a1414, cheveux: 0x3a2418, coiffure: 'long', peau: 2, niveau: 2, bouche: 1, atours: { metal: 'argent', coiffe: 'cercle' } },
  gardienNains: { race: 'nain', nom: 'Durgan Barbe-de-Fer', costume: 'gardien', habit: 0x3a3a44, cape: 0x26262e, cheveux: 0x9a9aa0, barbe: 'nain', peau: 3, niveau: 2, vieux: true, bouche: 1, atours: { metal: 'or', coiffe: 'couronne' } },
  gardienneElfes: { race: 'elfe', feminin: true, nom: 'Dame Ilyriel', costume: 'gardien', habit: 0x1f6a62, cape: 0x14443e, cheveux: 0xe8dca0, coiffure: 'long', peau: 0, niveau: 2, bouche: 1, atours: { metal: 'argent', coiffe: 'feuilles' } },
  gardienneMages: { race: 'magicienne', feminin: true, nom: "L'Archimage Séraphine", costume: 'gardien', habit: 0x4a2a8a, cape: 0x2a1a5a, cheveux: 0xc8c8d0, coiffure: 'long', peau: 1, niveau: 2, vieux: true, bouche: 1, atours: { metal: 'or' } },
  // le bras droit du Grand Sage : le Champion du Rempart, qui a « dompté » le dragon
  champion: { race: 'humain', nom: 'Sire Valdric', costume: 'champion', habit: 0x2a1a1a, cape: 0xa02a22, cheveux: 0x1a1414, barbe: 'courte', coiffure: 'court', peau: 1, niveau: 4, bouche: 3 },
  // (v1.05, planche 35) le Père Givrin, qui fait tourner la grande roue des cadeaux du Long Hiver
  givrin: { race: 'nain', nom: 'Le Père Givrin', costume: 'givrin', habit: 0xb0242a, cheveux: 0xf0f0f4, barbe: 'nain', peau: 1, niveau: 2, bouche: 3 },
  barbier: { race: 'nain', nom: "Orvin Tresse-d'Argent", costume: 'barbier', habit: 0x2a4a6e, cheveux: 0xb4b4bc, barbe: 'nain', coiffure: 'court', peau: 1, niveau: 1, bouche: 3 },   // (v1.48, planche 72) le barbier de la rue
  mendiant: { race: 'humain', nom: 'Le mendiant', costume: 'mendiant', habit: 0x6a6252, cheveux: 0x8a8a80, cape: 0x4a4236, barbe: 'pleine', niveau: 0 },
};

// Les mains de chaque texture (en pixels HD depuis le sol), pour porter le baluchon.
const MAINS_CORPS = {};
const MAINS_XY = {};   // (v1.34) la main de devant, depuis le milieu des pieds (pour les gestes du bivouac)
const BOUTS_CORPS = {};
const PIEDS_ASSIS = {};   // (v0.68) la hauteur des pieds d'un personnage assis, en pixels de la texture   // (v0.68) le bout du bâton du baluchon, en pixels de la texture
const REPERES_CORPS = {};   // (v1.01) le centre de la tête, le haut du torse, la taille, la hauteur : en pixels de la texture

// (v1.04) L'arme qu'un voyageur porte sur lui : celle qu'il vient d'acheter (elle part avec lui), sinon celle de son
// inventaire (même abîmée : il vient justement la faire réparer).
function armePortee(p) {
  if (!p || typeof ITEMS === 'undefined') return null;
  if (p.armeEmportee && ITEMS[p.armeEmportee]) return p.armeEmportee;
  return Object.keys(p.inventaire || {}).find(id => ITEMS[id] && ITEMS[id].arme) || null;
}

// L'ordre des tenues : novice 0 … légende 4.
function tenueDe(niveau) {
  const i = ORDRE_NIVEAUX.indexOf(niveau);
  return i < 0 ? 1 : i;
}

// (planches 85 et 86) Ce qu'il faut pour dessiner quelqu'un : son gène, sa tenue, son costume, la clé de sa texture et les
// options du moteur (corpsHD, et les poses du rig, posesHD.js)
function specCorps(quoi, pose = null, vue = 'troisQuarts') {
  let gene, tenue, costume = null, cle, bouche, atours, proportions;
  if (typeof quoi === 'string' && FIGURANTS[quoi]) {
    const fig = FIGURANTS[quoi];
    gene = { ...geneHD({ nom: fig.nom, race: fig.race === 'gobelin' ? 'humain' : fig.race, feminin: !!fig.feminin }), race: fig.race, habit: fig.habit, cheveux: fig.cheveux, cape: fig.cape, barbe: fig.barbe ?? null, coiffure: fig.coiffure || 'court', ...(fig.peau !== undefined ? { peau: fig.peau } : {}), ...(fig.vieux ? { vieux: true } : {}),
      ...(fig.buste ? { armure: false } : {}) };   // (v1.61) comme son buste (FIGURANTS_BUSTE) : pas de brigandine tirée de son nom
    tenue = fig.niveau ?? 1;
    costume = fig.costume;
    bouche = fig.bouche; atours = fig.atours; proportions = fig.proportions;
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
    // (v1.61) dans les couleurs de leur gène, comme leur buste (et le collectionneur en costume de noble)
    if (quoi.prestige) { costume = 'noble'; cle += '_noble'; }
    if (quoi.costume) { costume = quoi.costume; cle += '_' + quoi.costume; }
    if (quoi.vieux) cle += '_vieux';
    if (quoi.proportions) { proportions = quoi.proportions; cle += '_carrure'; }
    if (quoi.figurant === 'mentor') { gene = { ...gene, habit: 0x2e2420, cheveux: 0x3a281a, cape: 0x3e4a2a, barbe: 'rase', coiffure: 'long', peau: 1 }; costume = 'mentor'; tenue = 2; }
  }
  // (v1.04) l'arme qu'il porte sur lui (celle de son inventaire, ou celle qu'il vient d'acheter)
  const arme = typeof quoi === 'object' ? armePortee(quoi) : null;
  if (arme) cle += '_arme_' + arme;
  if (pose) cle += '_' + pose;
  if (vue && vue !== 'troisQuarts') cle += '_' + vue;
  // Les Bannis ont l'air fâché tant qu'ils ne te connaissent pas
  // (v0.61) ... et les gens des deux bandes ont toujours la mine grave
  // (v0.71) on n'accueille pas les bras ouverts en fronçant les sourcils
  const fache = pose === 'accueil' ? false : typeof quoi === 'string' ? ((typeof PEUPLES_OMBRE !== 'undefined' && PEUPLES_OMBRE.includes(quoi)) || !!(FIGURANTS[quoi] && FIGURANTS[quoi].fache)) : (!!quoi.serieux || banniFache(quoi));
  if (fache) cle += '_fache';
  // (v0.59) blessé : un figurant (Garrick repêché), ou un voyageur bandé dans son récit
  const blesse = typeof quoi === 'string' ? !!(FIGURANTS[quoi] && FIGURANTS[quoi].blesse) : !!quoi.blesse;
  if (blesse && typeof quoi !== 'string') cle += '_blesse';
  return { gene, tenue, costume, cle, options: { fache, blesse, ...(bouche !== undefined ? { bouche } : {}), ...(atours ? { atours } : {}), ...(arme ? { arme } : {}), ...(proportions ? { proportions } : {}) } };
}

// La clé de la texture en pied : un peuple (couleurs par défaut), un figurant, ou une personne
// (avec ses couleurs à elle et la tenue de son niveau).
// `vue` : 'troisQuarts' (par défaut, il regarde vers la droite), 'face', 'profil' ou 'dos'.
function corpsHD(scene, quoi, pose = null, vue = 'troisQuarts') {
  if (quoi === 'faucheuse') return 'perso_faucheuse';
  if (typeof quoi === 'string' && !FIGURANTS[quoi] && !PROPORTIONS[quoi]) return 'perso_' + quoi;   // (le joueur, etc.)
  // (planches 85 et 86) une pose du rig (posesHD.js : à genoux, au sol, il gît, il frappe...) : sa texture à elle
  if (pose && typeof POSES_HD !== 'undefined' && POSES_HD[pose]) return texturePose(scene, quoi, pose, { vue });
  const { gene, tenue, costume, cle, options } = specCorps(quoi, pose, vue);
  if (!scene.textures.exists(cle)) {
    const toile = dessinerCorpsVue(gene, tenue, costume, 0, pose, vue, options);
    toile.texture(scene, cle);
    MAINS_CORPS[cle] = toile.mains;
    if (toile.mainXY) MAINS_XY[cle] = { x: toile.mainXY[0] - toile.l / 2, y: toile.h - toile.mainXY[1] };   // (v1.34)
    if (toile.bout) BOUTS_CORPS[cle] = toile.bout;
    if (toile.piedsAssis) PIEDS_ASSIS[cle] = toile.piedsAssis;
    REPERES_CORPS[cle] = toile.reperes;
    dessinerCorpsVue(gene, tenue, costume, -1, pose, vue, options).texture(scene, cle + '_pas1');
    dessinerCorpsVue(gene, tenue, costume, 1, pose, vue, options).texture(scene, cle + '_pas2');
  }
  return cle;
}

// Fait marcher un personnage pendant `duree` ms : ses jambes alternent, ses bras se balancent,
// un peu de poussière se soulève à chaque pas. (Pour toute image qui a ses textures « _pas1/2 ».)
// (planche 85) Le joueur a huit images de marche (_m0 à _m7, 70 ms chacune) : on s'en sert dès qu'elles sont prêtes.
function pasDeMarche(scene, sprite, duree, { poussiere = true } = {}) {
  const base = sprite.texture.key.replace(/_(pas[12]|m\d)$/, '');
  const huit = typeof marcheJoueurPrete === 'function' && marcheJoueurPrete(scene, base);
  if (!huit && !scene.textures.exists(base + '_pas1')) return;
  const images = huit ? Array.from({ length: MARCHE_HD.images }, (_, i) => base + '_m' + i) : [base, base + '_pas1', base, base + '_pas2'];
  const n = images.length;
  // (une scène qui relance la marche à chaque pas, comme la rue : le cycle reprend où il en était, les jambes alternent)
  const ph = sprite.phaseMarche;
  let k = ph && ph.base === base && ph.n === n && scene.time.now - ph.t < 300 ? ph.k : 0;
  if (sprite.marche) sprite.marche.remove();
  creerHalo(scene);
  if (huit) sprite.setTexture(images[k]);
  const marche = sprite.marche = scene.time.addEvent({ delay: huit ? MARCHE_HD.duree : 125, loop: true, callback: () => {
    if (!sprite.active) { marche.remove(); if (sprite.marche === marche) sprite.marche = null; return; }
    k = (k + 1) % n;
    sprite.setTexture(images[k]);
    sprite.phaseMarche = { base, n, k, t: scene.time.now };
    const contact = huit ? k % 4 === 0 : k % 2 === 1;   // (le talon qui se pose)
    if (poussiere && contact && sprite.visible && sprite.alpha > 0.5 && !sprite.mask && !sprite.parentContainer) {
      const p = scene.add.image(sprite.x + ((huit ? k === 0 : k === 1) ? -6 : 6), sprite.y - 2, 'halo').setScale(0.12).setTint(0xc8b090).setAlpha(0.45).setDepth(sprite.depth - 0.01);
      scene.tweens.add({ targets: p, scale: 0.32, alpha: 0, y: p.y - 8, duration: 420, onComplete: () => p.destroy() });
    }
  } });
  if (!(duree > 0)) return;   // (0 : il marche sans s'arrêter, comme les passants)
  // (v1.05) Il s'arrête de marcher quand il s'arrête d'avancer : au début d'une scène chargée, l'horloge
  // prend de l'avance sur les déplacements, et il finissait le trajet en glissant, les jambes immobiles.
  let sursis = Math.ceil((duree / 2 + 1000) / 60);
  const arreter = () => {
    if (sprite.marche !== marche) return;   // (une autre marche a pris la suite)
    const avance = sprite.active && scene.tweens.getTweensOf(sprite).some(t => t.isPlaying() && (t.data || []).some(d => d && d.key === 'x'));
    if (avance && sursis-- > 0) { scene.time.delayedCall(60, arreter); return; }
    marche.remove(); sprite.marche = null;
    // (planche 85) l'image debout revient un peu plus tard : si la scène relance aussitôt la marche (la rue, à chaque
    // pas), il ne se fige pas une image entre deux pas
    scene.time.delayedCall(40, () => { if (sprite.active && !sprite.marche && images.includes(sprite.texture.key)) sprite.setTexture(base); });
  };
  scene.time.delayedCall(duree, arreter);
}

// L'échelle à appliquer à une texture de personnage (les anciennes gardent leur taille).
function echelleCorps(cle) {
  return cle.startsWith('corps_') ? ECHELLE_CORPS : 1;
}

// Un personnage en pied, posé par les pieds : `quoi` = un peuple, un figurant ou une personne.
// `echelle` est l'échelle d'avant (celle des personnages de 16 pixels).
function imageCorps(scene, x, y, quoi, echelle, pose = null) {
  const cle = corpsHD(scene, quoi, pose);
  const img = scene.add.image(x, y, cle).setOrigin(0.5, 1).setScale(echelle * echelleCorps(cle));
  if (PIEDS_ASSIS[cle]) img.setOrigin(0.5, (PIEDS_ASSIS[cle] + 1) / img.height);   // (assis : posé par les pieds, devant le banc)
  if (typeof APPUI_POSES !== 'undefined' && APPUI_POSES[cle]) origineCorps(img);   // (planches 85 et 86 : une pose du rig, posée par son point d'appui)
  return img;
}
