// Lumière et Ombre : les trois mesures (refonte validée le 02/11, Q296 à Q335 ; docs/histoire/ombre-lumiere-refonte.md).
//
// 1. L'ALLÉGEANCE (cachée) : pour qui JeuneGoy travaille vraiment. Sept degrés, de l'Ombre profonde à la Lumière
//    ardente. Seuls les faits qui servent un camp comptent, avec le même poids des deux côtés. S'enfoncer est de
//    plus en plus lent (l'élan), revenir de plus en plus dur (l'inertie) ; le dernier degré atteint, plus de retour,
//    sauf par un récit (recitDeRetour).                                                         → G.degres
// 2. LE CŒUR (caché) : la bonté et la cruauté, qui ne sont d'aucun camp.                       → G.coeur
// 3. LE REGARD DU MONDE (visible, sans chiffre) : ce que la Confrérie et les Bannis croient de toi, deux renoms
//    séparés, nourris seulement par ce qui se voit ou se sait. Au bureau : le blason et la fleur de pommier. → G.regard
// Et LA CLAIRVOYANCE (Q321, Q322) : elle se gagne en ouvrant les yeux, se voit à la lampe de chevet, et montre les
// ☀ ☾ des boutons à 8 lueurs (le flair reste pour le commerce).                                → G.clairvoyance
//
// La jauge d'avant (G.lo.points, regles.js) reste en dessous, adoucie (jaugeFloue : sans chiffre, mise à jour une
// fois par jour) : tous les effets du monde (taxes, banque, garde, Carrefour, sceau…) la lisent encore. Les étapes
// suivantes les brancheront sur la bonne mesure (le plan : scratchpad/lot3/a_valider/ombre-lumiere/plan/).

// --- Les sept degrés de l'allégeance ---
const DEGRES = {
  '-3': { id: 'ombreProfonde', nom: 'Ombre profonde' },
  '-2': { id: 'ombre', nom: 'Ombre' },
  '-1': { id: 'ombreNaissante', nom: 'Ombre naissante', effleure: 'effleuré par l’Ombre', penchant: 'un penchant pour l’Ombre' },
  0: { id: 'neutre', nom: 'Neutre' },
  1: { id: 'lumiereNaissante', nom: 'Lumière naissante', effleure: 'effleuré par la Lumière', penchant: 'un penchant pour la Lumière' },
  2: { id: 'lumiere', nom: 'Lumière' },
  3: { id: 'lumiereArdente', nom: 'Lumière ardente' },
};

const REGLES_DEGRES = {
  seuils: [12, 35, 65],        // l'engagement pour ENTRER dans le degré 1, 2, 3 de son côté
  hysteresis: 6,               // pour en SORTIR, redescendre de 6 sous le seuil d'entrée
  elan: [[12, 1], [35, 0.6], [65, 0.3], [Infinity, 0.15]],      // s'enfoncer : on ne devient pas ardent en vendant des cordes
  inertie: [[15, 1], [40, 0.75], [70, 0.5], [Infinity, 0.35]],  // revenir : de plus en plus dur
  extreme: { graves: 4 },      // le dernier degré : le serment, ou 4 actes graves de plus que de l'autre côté
  attraitCentre: { sous: 18, garde: 0.96 },   // une nuit sans geste, près du centre, l'engagement s'effrite
  tiedeur: { epoque: { jour: 30, pieces: 3 }, nuitNeutre: 1, nuitDeuxCamps: 0.5, carrefourLibre: 12, pacteParrain: 10, mecenatNeutre: 6, erosion: 0.5 },
  nonRetour: {
    graves: 8,                 // 8 actes graves d'un côté, et l'âme de ce côté : on ne redevient plus neutre
    spectateur: 7,             // (Q317) le soir de la 7e pièce, le neutre qui ne répond à personne devient le spectateur
  },
  etat: { serment: 10, parjure: 0.5, rangMafia: -8, liberteMafia: 3, mecenat: 3, projet: 3 },
};

// --- Les faits : ce que chaque geste pèse dans chaque mesure ---
// a : l'allégeance (+ Lumière, − Ombre) ; c : le cœur (+ bonté, − cruauté) ; conf / ban : le regard de la Confrérie
// et des Bannis ; grave : un acte grave d'allégeance ; cruel : un acte grave de cruauté.
// Les clés sont celles du barème (BAREME_CAMP : elles font aussi bouger la jauge), plus quelques faits qui n'y sont pas.
const FAITS = {
  // le commerce de tous les jours
  missionL: { a: 1, conf: 1 },
  missionO: { a: -1, ban: 1, conf: -0.3 },
  decoClaire: { a: 1, conf: 2, ban: -1 },
  decoSombre: { a: -1, ban: 2, conf: -2 },
  aigle: { a: 1, conf: 0.5 },
  corbeau: { a: -1, ban: 0.5 },
  // on choisit son camp
  commande: { a: -3, ban: 2 },
  soudoyer: { a: -1 },
  routeSergent: { a: -1 },
  serviceMafia: { a: -2, ban: 0.5 },
  // on livre, on protège
  denoncer: { a: 5, conf: 3, ban: -3, grave: 1 },
  cacher: { a: -5, ban: 3, grave: 1 },
  denoncerMafia: { a: 8, conf: 4, ban: -1, grave: 2 },
  parrainDenoncer: { a: 10, conf: 3, grave: 2 },
  parrainBague: { a: -10, ban: 2, grave: 2 },
  parrainTaire: { a: -2 },
  parrainChanger: { a: 2, c: 1 },
  // la bonté : le monde l'appelle « Lumière », l'âme ne bouge pas de camp
  mendiant: { c: 1, conf: 0.5 },
  soigner: { c: 1, conf: 0.5 },
  dedommager: { c: 1, conf: 0.5 },
  routeAider: { c: 1, conf: 0.5 },
  // la cruauté
  routeRancon: { c: -1, conf: -0.5 },
  miseNoire: { c: -2, ban: 0.3 },
  ame: { c: -2 },
  piege: { c: -3, cruel: 1 },
  denoncerInnocent: { c: -5, conf: 1, ban: -2, cruel: 1 },
  // (03/11, étape 3) les faits qui manquaient (faitsHistoire.js), chacun avec son jumeau de même poids
  ecouterDoyen: { a: -3, ban: 1 },
  faireTaireDoyen: { a: 3, conf: 1, ban: -2 },
  fissureGardee: { a: -3 },                      // (secret : personne ne le sait, que l'âme)
  fissureChassee: { a: 3 },
  protegerEglise: { a: 5, conf: 3, ban: -1 },
  saboterEglise: { a: -5, ban: 3 },
  escorterConvoi: { a: 5, conf: 3, ban: -1 },
  pillerConvoi: { a: -5, ban: 3 },
  donDrommath: { a: -3, ban: 3 },
};
// Les nouveaux gestes du barème (la jauge, en dessous) : on distingue enfin ce qui était mêlé sous « piège »
if (typeof BAREME_CAMP !== 'undefined') Object.assign(BAREME_CAMP, {
  serviceMafia: { camp: 'mal', n: 2, texte: 'Rendre un service à la Main Noire' },
  corbeau: { camp: 'mal', n: 2, texte: 'Le corbeau de la Main Noire, en secours' },
  soudoyer: { camp: 'mal', n: 2, texte: 'Soudoyer l’inspecteur' },
  aigle: { camp: 'bien', n: 1, texte: 'L’aigle du Conseil, en secours' },
  parrainTaire: { camp: 'mal', n: 1, texte: 'Taire le secret du Parrain' },
  parrainDenoncer: { camp: 'bien', n: 2, texte: 'Dénoncer le Parrain' },
  parrainBague: { camp: 'mal', n: 2, texte: 'Baiser la bague du Parrain' },
  ecouterDoyen: { camp: 'mal', n: 1, texte: 'Écouter un doyen jusqu’au bout' },
  faireTaireDoyen: { camp: 'bien', n: 1, texte: 'Faire taire un doyen' },
  fissureGardee: { camp: 'mal', n: 1, texte: 'Garder une fissure du Sage en mémoire' },
  fissureChassee: { camp: 'bien', n: 1, texte: 'Chasser une fissure du Sage' },
  protegerEglise: { camp: 'bien', n: 2, texte: 'Protéger une église-relais du chant' },
  saboterEglise: { camp: 'mal', n: 2, texte: 'Saboter une église-relais du chant' },
  escorterConvoi: { camp: 'bien', n: 2, texte: 'Ravitailler un convoi de la Confrérie' },
  pillerConvoi: { camp: 'mal', n: 2, texte: 'Donner la route d’un convoi aux Bannis' },
  donDrommath: { camp: 'mal', n: 2, texte: 'Un don au trésor de guerre du Drômmath' },
});

// --- L'allégeance ---
function etatDegres(G) {
  if (!G.degres) G.degres = degresDepuisLaPartie(G);
  const D = G.degres;
  D.graves = D.graves || { bien: 0, mal: 0 }; D.verrous = D.verrous || {}; D.histo = D.histo || []; D.vu = D.vu || {};
  return D;
}

// Une partie qui n'a pas encore de degrés (une vieille sauvegarde, ou une partie neuve) : on les déduit de ce qu'elle
// a vécu. La jauge donne le sens, le serment et le camp scellé la profondeur.
function degresDepuisLaPartie(G) {
  const R = REGLES_DEGRES, j = (G.lo && G.lo.points) || 0, serment = G.lo && G.lo.serment;
  let e = j * 0.7;
  if (serment) e += (serment === 'bien' ? 1 : -1) * R.etat.serment;
  const D = { e: Math.max(-100, Math.min(100, e)), d: 0, tiedeur: 0, graves: { bien: (G.captures || []).length, mal: 0 }, verrous: {}, vu: {}, histo: [], jourGestes: null, v: 2 };
  const T = R.tiedeur;
  if (Math.abs(D.e) < R.seuils[0] && G.jour > T.epoque.jour) D.tiedeur = (G.jour - T.epoque.jour) * T.nuitNeutre;
  if (G.lo && G.lo.offres) for (const o of Object.values(G.lo.offres)) if (o === 'refusee' || o === 'refuseeDef') D.tiedeur += T.carrefourLibre;
  D.vu = etatVuDegres(G);
  D.d = degreBrut(D.e);
  if (Math.abs(D.d) === 3) D.verrous[D.d > 0 ? 'extremeBien' : 'extremeMal'] = G.jour || 1;
  appliquerVerrousDegres(G, D);
  return D;
}

// Ce que la nuit compare à la veille : un instantané des choix lisibles dans la partie
function etatVuDegres(G) {
  const lo = G.lo || {}, m = G.mafia || {}, mec = G.mecenat || { paliers: [] };
  const projets = x => x ? Object.keys(x.bati || {}).length + (x.chantier ? 1 : 0) : 0;
  return {
    serment: lo.serment || null, parjures: lo.parjures || 0,
    refus: Object.values(lo.offres || {}).filter(o => o === 'refusee' || o === 'refuseeDef').length,
    pacte: !!(G.parrain && G.parrain.choix === 'pacte'),
    rangMafia: typeof rangMafia === 'function' && G.mafia ? rangMafia(G) : 0, sortiMafia: m.sorti || null,
    sabotages: (G.faucheuse && G.faucheuse.sabotages) || 0,
    mecenat: (mec.paliers || []).length, confrerie: projets(G.confrerie), repaire: projets(G.repaire),
    saisies: (G.garde && G.garde.saisies) || 0,
  };
}

function degreBrut(e) {
  const n = REGLES_DEGRES.seuils.filter(s => Math.abs(e) >= s).length;
  return Math.sign(e) * n;
}
// Le degré, avec l'hystérésis : on entre au seuil, on ne sort qu'un peu en dessous
function degreAvecHysteresis(d, e) {
  const R = REGLES_DEGRES, brut = degreBrut(e);
  if (d === 0 || Math.sign(brut) === Math.sign(d) && Math.abs(brut) >= Math.abs(d)) return brut;
  let x = d;
  while (x !== 0 && Math.sign(x) * e < R.seuils[Math.abs(x) - 1] - R.hysteresis) x -= Math.sign(x);
  return x === 0 ? brut : x;
}

// Les planchers et plafonds des points de non-retour : [min, max] du degré
function bornesDegres(G, D) {
  let min = -3, max = 3;
  const v = D.verrous, s = G.lo && G.lo.serment;
  if (G.sceauNeutre || v.neutre) return [0, 0];
  if (G.camp === 'bien') min = Math.max(min, 1);
  if (G.camp === 'mal') max = Math.min(max, -1);
  if (v.gravesBien) min = Math.max(min, 1);
  if (v.gravesMal) max = Math.min(max, -1);
  if (v.extremeBien) min = Math.max(min, 3);     // (Q301) le dernier degré atteint : plus de retour, sauf par un récit
  if (v.extremeMal) max = Math.min(max, -3);
  if (s === 'bien') min = Math.max(min, 1);
  if (s === 'mal') max = Math.min(max, -1);
  if (min > max) {   // (deux verrous opposés : le camp scellé l'emporte, puis le serment, puis l'engagement)
    const cote = G.camp ? (G.camp === 'bien' ? 1 : -1) : s ? (s === 'bien' ? 1 : -1) : (D.e >= 0 ? 1 : -1);
    return cote > 0 ? [min, 3] : [-3, max];
  }
  return [min, max];
}

function appliquerVerrousDegres(G, D) {
  const R = REGLES_DEGRES, [min, max] = bornesDegres(G, D);
  const s = G.lo && G.lo.serment, haut = R.seuils[2] - 1, net = (D.graves.bien || 0) - (D.graves.mal || 0);
  if (D.e > haut && s !== 'bien' && net < R.extreme.graves && !D.verrous.extremeBien) D.e = haut;
  if (D.e < -haut && s !== 'mal' && -net < R.extreme.graves && !D.verrous.extremeMal) D.e = -haut;
  if (min === 0 && max === 0) D.e = Math.max(-(R.seuils[0] - 1), Math.min(R.seuils[0] - 1, D.e));
  if (min > 0) D.e = Math.max(D.e, R.seuils[min - 1]);
  if (max < 0) D.e = Math.min(D.e, -R.seuils[-max - 1]);
  D.d = Math.max(min, Math.min(max, D.d));
}

function engagerDegres(G, delta, pourquoi) {
  if (!delta) return 0;
  const R = REGLES_DEGRES, D = etatDegres(G), avant = D.e;
  const facteur = table => table.find(([s]) => Math.abs(D.e) < s)[1];
  const versLeCentre = D.e !== 0 && Math.sign(delta) !== Math.sign(D.e);
  D.e = Math.max(-100, Math.min(100, D.e + delta * facteur(versLeCentre ? R.inertie : R.elan)));
  const gagne = Math.abs(D.e) - Math.abs(avant);
  if (gagne > 0) D.tiedeur = Math.max(0, D.tiedeur - gagne * R.tiedeur.erosion);
  majDegre(G, D, pourquoi);
  return D.e - avant;
}

function majDegre(G, D, pourquoi) {
  const avant = D.d;
  D.d = degreAvecHysteresis(D.d, D.e);
  appliquerVerrousDegres(G, D);
  // (Q301) le dernier degré, une fois atteint, se verrouille
  if (D.d === 3 && !D.verrous.extremeBien) D.verrous.extremeBien = G.jour || 1;
  if (D.d === -3 && !D.verrous.extremeMal) D.verrous.extremeMal = G.jour || 1;
  if (D.d !== avant) {
    D.histo.unshift({ jour: G.jour, de: avant, a: D.d, pourquoi: pourquoi || '' });
    if (D.histo.length > 30) D.histo.length = 30;
  }
}

// Assez d'actes graves d'un côté, ET l'âme de ce côté : on ne redeviendra plus neutre
function verrousDesGraves(G, D) {
  const n = REGLES_DEGRES.nonRetour.graves;
  if (!D.verrous.gravesBien && D.graves.bien >= n && D.d >= 1) { D.verrous.gravesBien = G.jour; majDegre(G, D, 'non-retour : actes graves'); }
  if (!D.verrous.gravesMal && D.graves.mal >= n && D.d <= -1) { D.verrous.gravesMal = G.jour; majDegre(G, D, 'non-retour : actes graves'); }
}

// (Q301, Q314) Un récit de retour (le doute, la retenue) : une fois chacun, il fait redescendre le dernier degré
// d'un cran, sans changer de camp. Renvoie vrai s'il a servi. (Les récits eux-mêmes viendront avec l'histoire.)
function recitDeRetour(G, id) {
  const D = etatDegres(G), R = REGLES_DEGRES;
  D.recits = D.recits || [];
  if (D.recits.includes(id) || Math.abs(D.d) !== 3) return false;
  const sg = Math.sign(D.d);
  D.recits.push(id);
  delete D.verrous[sg > 0 ? 'extremeBien' : 'extremeMal'];
  D.e = sg * (R.seuils[2] - R.hysteresis - 1);
  majDegre(G, D, 'récit : ' + id);
  return true;
}

// --- Le cœur ---
function etatCoeur(G) {
  if (!G.coeur) G.coeur = coeurDepuisLaPartie(G);
  return G.coeur;
}
// Une vieille partie : les dons au mendiant et les âmes offertes donnent une première idée de son cœur
function coeurDepuisLaPartie(G) {
  const C = { v: 0, bonte: 0, cruaute: 0, cruels: 0, journal: [], v2: true };
  const dons = Math.min(30, Math.floor((G.mendiant || 0) / 5)), ames = Math.min(30, Math.round(G.mal || 0));
  for (let k = 0; k < dons; k++) bougerCoeur(C, 1);
  for (let k = 0; k < ames; k++) bougerCoeur(C, -2);
  return C;
}
function bougerCoeur(C, w) {
  if (!w) return;
  if (w > 0) C.bonte += w; else C.cruaute -= w;
  C.v = Math.max(-100, Math.min(100, C.v + w * (1 - Math.abs(C.v) / 120)));
}
function coeurDe(G) { return etatCoeur(G).v; }

// --- Le regard du monde ---
const NIVEAUX_REGARD = [[-25, -2], [-8, -1], [8, 0], [25, 1], [50, 2], [80, 3], [Infinity, 4]];
const PHRASES_REGARD = {
  confrerie: {
    '-2': 'La Confrérie te tient pour suspect.', '-1': 'La garde a l’œil sur ton comptoir.', 0: 'La Confrérie ne sait pas grand-chose de toi.',
    1: 'On te salue dans la rue.', 2: 'La Confrérie te cite en exemple.', 3: 'Les Gardiens connaissent ton nom.', 4: 'À la Confrérie, on te dit des leurs.',
  },
  bannis: {
    '-2': 'Les Bannis maudissent ton nom.', '-1': 'Les Bannis se méfient de toi.', 0: 'Les Bannis ne savent rien de toi.',
    1: 'À la cave, on a entendu ton nom.', 2: 'Les Bannis te font confiance.', 3: 'Les Bannis parlent de toi comme d’un ami.', 4: 'Pour les Bannis, tu es des leurs.',
  },
};
function etatRegard(G) {
  if (!G.regard) {
    // (migration) une vieille partie : la jauge d'avant dit d'un côté ce que pense le monde
    const j = (G.lo && G.lo.points) || 0, s = G.lo && G.lo.serment;
    G.regard = { confrerie: Math.max(-20, j * 0.8) + (s === 'bien' ? 15 : 0), bannis: Math.max(-20, -j * 0.8) + (s === 'mal' ? 15 : 0) };
  }
  return G.regard;
}
function regarder(G, camp, x) {
  if (!x) return;
  const R = etatRegard(G);
  R[camp] = x > 0 ? Math.min(100, R[camp] + x * (1 - Math.max(0, R[camp]) / 110)) : Math.max(-50, R[camp] + x);
}
function niveauRegard(v) { return NIVEAUX_REGARD.find(([s]) => v < s)[1]; }
function regardDe(G) {
  const R = etatRegard(G), nc = niveauRegard(R.confrerie), nb = niveauRegard(R.bannis);
  return { confrerie: R.confrerie, bannis: R.bannis, niveauConfrerie: nc, niveauBannis: nb, phraseConfrerie: PHRASES_REGARD.confrerie[nc], phraseBannis: PHRASES_REGARD.bannis[nb] };
}
// (étape 2) Le « palier » que voit le monde, de −3 à +3, d'après le regard des deux camps : la Lumière quand la
// Confrérie t'estime ou que les Bannis te maudissent, l'Ombre dans l'autre cas ; 0 quand les deux se valent (le neutre
// au sauf-conduit, bien vu des deux, reste entre les deux). C'est ce que lisent la garde, la banque, la taxe, les
// clients, le Carrefour… (palierCamp, regles.js).
function palierDuRegard(G) {
  const r = regardDe(G), lum = Math.max(r.niveauConfrerie, -r.niveauBannis), omb = Math.max(r.niveauBannis, -r.niveauConfrerie);
  if (lum === omb || Math.max(lum, omb) <= 0) return 0;
  // (bien vu des deux : l'estime de l'un retranche celle de l'autre)
  return lum > omb ? Math.min(3, lum - Math.max(0, omb)) : -Math.min(3, omb - Math.max(0, lum));
}

// Un mot pour le bilan du soir (court) : le regard le plus fort
function motDuMonde(G) {
  const r = regardDe(G);
  if (r.niveauConfrerie <= 0 && r.niveauBannis <= 0) return r.niveauConfrerie < 0 ? 'on se méfie' : r.niveauBannis < 0 ? 'les Bannis se méfient' : 'on ne te connaît guère';
  if (r.niveauConfrerie >= r.niveauBannis) return ['', 'on te salue', 'on te cite en exemple', 'les Gardiens te connaissent', 'des leurs, dit la Confrérie'][r.niveauConfrerie];
  return ['', 'on t’a vu à la cave', 'les Bannis te font confiance', 'un ami des Bannis', 'des leurs, disent les Bannis'][r.niveauBannis];
}

// --- La jauge du bandeau, adoucie (Q296) : plus de chiffre, et elle ne bouge qu'une fois par jour, par grands pas ---
function jaugeFloue(G) {
  if (!G || !G.lo) return 0;
  const v = G.jaugeVue;
  // (étape 2) elle montre ce que voit le monde (le palier du regard), et non plus l'ancienne jauge
  if (!v || v.jour !== G.jour) G.jaugeVue = { jour: G.jour, j: palierDuRegard(G) * 30 };
  return G.jaugeVue.j;
}

// --- La Clairvoyance (Q321, Q322) ---
const CLAIRVOYANCE = {
  paliers: { liseré: 3, camps: 8, coeur: 15, presage: 25 },   // ce qu'elle montre (seuls les ☀ ☾ sont branchés à l'étape 1)
  chevet: { rayon: [170, 210, 260, 320, 380], pale: 0.14 },   // la lampe de chevet : plus de lueurs, plus de lumière
  maxNuit: 2,                                                 // au plus deux lueurs par nuit
};
function etatClairvoyance(G) {
  if (!G.clairvoyance) {
    // (migration) celui qui voyait déjà les ☀ ☾ avec son flair les garde : on ne retire pas ce qu'on avait
    const flair = typeof niveauFlair === 'function' && G.experience !== undefined ? niveauFlair(G) : 0;
    G.clairvoyance = { lueurs: flair >= (typeof FLAIR_PICTOS !== 'undefined' ? FLAIR_PICTOS : 0.4) ? CLAIRVOYANCE.paliers.camps : 0, vu: null, journal: [] };
  }
  const C = G.clairvoyance;
  if (!C.vu) C.vu = etatVuClairvoyance(G);
  return C;
}
// Les yeux qui s'ouvrent, lus chaque nuit dans la partie : un imposteur démasqué, la vérité sur un baluchon donné à
// un menteur, le récit d'un doyen écouté jusqu'au bout, la berceuse lue, un faux présage de la diseuse qui s'est trahi.
function etatVuClairvoyance(G) {
  const st = G.stats || {}, p = G.presage;
  return {
    imposteurs: st.imposteurs || 0, arnaques: st.arnaques || 0, aines: (G.ainesRecits || []).length,
    berceuse: !!(G.evtComptoir && G.evtComptoir.berceuseLue), presage: p && !p.vrai && (p.indices || []).length ? p.jour : null,
    fissures: (G.faitsHistoire && G.faitsHistoire.fissures && G.faitsHistoire.fissures.gardees) || 0,   // (étape 3)
  };
}
function lueursDe(G) { return etatClairvoyance(G).lueurs; }
// Le Sage aveugle (Q322) : en sa présence, tout s'éteint (G.sageIci, posé par les scènes où il paraît)
function voitLesCamps(G) { return !!G && !(G.sageIci === G.jour) && lueursDe(G) >= CLAIRVOYANCE.paliers.camps; }
function niveauChevet(G) { const n = lueursDe(G); return n >= 25 ? 4 : n >= 15 ? 3 : n >= 8 ? 2 : n >= 3 ? 1 : 0; }
function rayonChevet(G) { return CLAIRVOYANCE.chevet.rayon[niveauChevet(G)]; }
// Le halo pâle de la clairvoyance, autour de la flamme (à partir de 8 lueurs)
function eclairerChevet(scene, x, y, G) {
  const n = niveauChevet(G);
  if (n < 2 || typeof lumiere !== 'function') return null;
  return lumiere(scene, x, y, 70 + 40 * n, 0xe8f0ff, CLAIRVOYANCE.chevet.pale * (n - 1)).setDepth(5.1);
}
function nuitDeLaClairvoyance(G) {
  const C = etatClairvoyance(G), vu = C.vu, now = etatVuClairvoyance(G);
  // (les yeux s'ouvrent peu à peu : au plus deux lueurs par nuit, le reste attend les nuits suivantes)
  C.attente = C.attente || [];
  const gagner = (k, pourquoi) => { for (let i = 0; i < k; i++) C.attente.push(pourquoi); };
  if (now.imposteurs > vu.imposteurs) gagner(now.imposteurs - vu.imposteurs, 'un imposteur démasqué');
  if (now.arnaques > vu.arnaques) gagner(now.arnaques - vu.arnaques, 'la vérité sur un baluchon donné à un menteur');
  if (now.aines > vu.aines) gagner(now.aines - vu.aines, 'le récit d’un doyen, écouté jusqu’au bout');
  if (now.berceuse && !vu.berceuse) gagner(1, 'la berceuse, lue');
  if (now.presage && now.presage !== vu.presage) gagner(1, 'un faux présage qui s’est trahi');
  if (now.fissures > (vu.fissures || 0)) gagner(now.fissures - (vu.fissures || 0), 'une fissure du Sage, gardée en mémoire');
  const avant = C.lueurs, lues = C.attente.splice(0, CLAIRVOYANCE.maxNuit);
  for (const pourquoi of lues) C.journal.unshift({ jour: G.jour, pourquoi });
  if (C.attente.length > 30) C.attente.length = 30;
  C.lueurs += lues.length; C.vu = now;
  if (C.journal.length > 20) C.journal.length = 20;
  // le réveil le dit, sans chiffre, quand la lampe change d'éclat
  const pal = Object.values(CLAIRVOYANCE.paliers).find(s => avant < s && C.lueurs >= s);
  if (pal && G.reveil && G.reveil.lignes) G.reveil.lignes.push('Cette nuit, la bougie de ta table de chevet a brûlé plus clair que d’habitude. Tu as l’impression de mieux voir.');
}

// Les ☀ ☾ des boutons (pixels.js, marquerCamp) : ils suivent la Clairvoyance et non plus le flair. On enveloppe la
// fonction d'origine une fois tout chargé (sans toucher à pixels.js) : pendant son appel, le « flair » qu'elle
// consulte répond selon la Clairvoyance ; et la première fois, c'est la Clairvoyance qui s'explique.
function brancherClairvoyance() {
  if (typeof window === 'undefined' || typeof window.marquerCamp !== 'function' || window.marquerCamp.clairvoyance) return;
  const origine = window.marquerCamp;
  const nouveau = function (scene, b, camp) {
    const G = window.GAME, flair = window.niveauFlair;
    const voit = !!camp && voitLesCamps(G);
    if (voit && G && b && b.fond && b.fond.active) {
      G.tutoVu = G.tutoVu || {};
      if (!G.tutoVu.pictosCamp) {
        G.tutoVu.pictosCamp = true;
        const t = scene.add.text(480, 96, 'Ta clairvoyance s’éveille : tu sens quels choix servent un camp. Le soleil, la Confrérie ; la lune, les Bannis.',
          style(14, '#fff4dc', { fontStyle: 'italic', backgroundColor: '#1e130aee', padding: { x: 12, y: 8 }, wordWrap: { width: 620 }, align: 'center' })).setOrigin(0.5).setDepth(120).setScrollFactor(0);
        scene.tweens.add({ targets: t, alpha: 0, delay: 6000, duration: 800, onComplete: () => t.destroy() });
      }
    }
    window.niveauFlair = () => (voit ? 1 : 0);
    try { return origine(scene, b, camp); } finally { window.niveauFlair = flair; }
  };
  nouveau.clairvoyance = true;
  window.marquerCamp = nouveau;
}
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'complete') brancherClairvoyance(); else window.addEventListener('load', brancherClairvoyance);
}

// --- Les faits, un par un ---
// (appelé par pencher, regles.js, pour chaque geste du barème ; et directement pour les faits hors barème)
function noterFait(G, cle, fois = 1) {
  const f = FAITS[cle];
  if (!f || fois <= 0) return;
  const D = etatDegres(G), C = etatCoeur(G);
  for (let k = 0; k < fois; k++) {
    if (f.a) engagerDegres(G, f.a, cle);
    if (f.c) bougerCoeur(C, f.c);
    if (f.conf) regarder(G, 'confrerie', f.conf);
    if (f.ban) regarder(G, 'bannis', f.ban);
  }
  if (f.grave) { D.graves[f.a > 0 ? 'bien' : 'mal'] += f.grave * fois; verrousDesGraves(G, D); }
  if (f.cruel) C.cruels = (C.cruels || 0) + f.cruel * fois;
  if (f.c) { C.journal.unshift({ jour: G.jour, cle }); if (C.journal.length > 20) C.journal.length = 20; }
  if (f.a) {
    if (!D.jourGestes || D.jourGestes.jour !== G.jour) D.jourGestes = { jour: G.jour, bien: 0, mal: 0 };
    D.jourGestes[f.a > 0 ? 'bien' : 'mal'] += fois;
  }
}
function noterDegre(G, cle, fois = 1) { noterFait(G, cle, fois); }   // (le nom du premier prototype, appelé par pencher)

// Chaque nuit (regles.js, nuit) : les choix lus dans l'état de la partie, la tiédeur, les points de non-retour,
// le regard qui s'efface un peu, la Clairvoyance
function nuitDesDegres(G) {
  const R = REGLES_DEGRES, E = R.etat, T = R.tiedeur, D = etatDegres(G), vu = D.vu || {}, now = etatVuDegres(G);
  // le serment, le parjure, le Carrefour refusé, le pacte du Parrain
  if (now.serment && now.serment !== vu.serment) { engagerDegres(G, (now.serment === 'bien' ? 1 : -1) * E.serment, 'serment'); regarder(G, now.serment === 'bien' ? 'confrerie' : 'bannis', 15); }
  if (now.parjures > (vu.parjures || 0)) { D.e *= E.parjure; majDegre(G, D, 'parjure'); const trahi = G.lo && G.lo.parjure && G.lo.parjure.camp; if (trahi) regarder(G, trahi === 'bien' ? 'confrerie' : 'bannis', -20); }
  if (now.refus > (vu.refus || 0)) D.tiedeur += T.carrefourLibre * (now.refus - (vu.refus || 0));
  if (now.pacte && !vu.pacte) D.tiedeur += T.pacteParrain;
  // la Main Noire, la Faucheuse
  if (now.rangMafia > (vu.rangMafia || 0)) engagerDegres(G, E.rangMafia * (now.rangMafia - (vu.rangMafia || 0)), 'Main Noire : grade');
  if (now.sortiMafia === 'rachete' && vu.sortiMafia !== 'rachete') engagerDegres(G, E.liberteMafia, 'Main Noire : rachat');
  if (now.sabotages > (vu.sabotages || 0)) { const C = etatCoeur(G), n = now.sabotages - (vu.sabotages || 0); for (let k = 0; k < n; k++) bougerCoeur(C, -8); C.cruels = (C.cruels || 0) + 2 * n; }
  // ce qu'on donne : le mécénat (du Sage, ou de la neutralité), les chantiers de la Confrérie et du repaire
  if (now.mecenat > (vu.mecenat || 0)) {
    const n = now.mecenat - (vu.mecenat || 0), neutre = typeof regimeDesRiches === 'function' && regimeDesRiches(G) === 'neutre';
    if (neutre) D.tiedeur += T.mecenatNeutre * n; else { engagerDegres(G, E.mecenat * n, 'mécénat'); regarder(G, 'confrerie', 3 * n); }
  }
  if (now.confrerie > (vu.confrerie || 0)) { engagerDegres(G, E.projet * (now.confrerie - (vu.confrerie || 0)), 'chantier de la Confrérie'); regarder(G, 'confrerie', 3); }
  if (now.repaire > (vu.repaire || 0)) { engagerDegres(G, -E.projet * (now.repaire - (vu.repaire || 0)), 'chantier du repaire'); regarder(G, 'bannis', 3); }
  // la garde qui trouve ce qu'on cachait : la Confrérie le sait
  if (now.saisies > (vu.saisies || 0)) regarder(G, 'confrerie', -3 * (now.saisies - (vu.saisies || 0)));
  D.vu = now;
  // la journée : rien fait (le centre attire), ou les deux camps servis (la tiédeur)
  const g = D.jourGestes && D.jourGestes.jour === G.jour ? D.jourGestes : { bien: 0, mal: 0 };
  if (!g.bien && !g.mal && Math.abs(D.e) < R.attraitCentre.sous) D.e *= R.attraitCentre.garde;
  const pieces = (G.armure || []).length;
  majDegre(G, D, 'nuit');
  if ((G.jour >= T.epoque.jour || pieces >= T.epoque.pieces) && !G.camp) {
    if (g.bien && g.mal) D.tiedeur += T.nuitDeuxCamps;
    if (D.d === 0) D.tiedeur += T.nuitNeutre;
  }
  // les points de non-retour : les actes graves ; (Q317) le soir de la 7e pièce, le neutre qui n'a répondu à
  // personne devient le spectateur (la scène du dernier appel viendra à une étape suivante)
  verrousDesGraves(G, D);
  if (!D.verrous.neutre && !G.camp && D.d === 0 && pieces >= R.nonRetour.spectateur && !(G.lo && G.lo.serment)) D.verrous.neutre = G.jour;
  majDegre(G, D, 'nuit');
  // le monde oublie, doucement
  const Rg = etatRegard(G);
  Rg.confrerie *= 0.996; Rg.bannis *= 0.996;
  etatCoeur(G);
  nuitDeLaClairvoyance(G);
}

function degreDe(G) { return etatDegres(G).d; }
function nomDegre(G) { return DEGRES[degreDe(G)].nom; }

// Les fins qui restent possibles depuis ce degré (pour le débogage ; rien dans le jeu ne s'en sert encore).
// (Q312) La fin du duel avec Garrick : le dernier degré de la Lumière et beaucoup de cruauté.
const FINS_PAR_DEGRE = {
  '-3': ['O1', 'O2', 'O3', 'R', 'E'], '-2': ['O1', 'O2', 'O3', 'R', 'E'], '-1': ['O1', 'O2', 'O3', 'N2', 'N3', 'R', 'E'],
  0: ['N1', 'N2', 'N3'], 1: ['L1', 'L2', 'L3', 'N1', 'N3', 'R', 'E'], 2: ['L1', 'L2', 'L3', 'R', 'E'], 3: ['L1'],
};
function finsPossiblesDegres(G) {
  const f = FINS_PAR_DEGRE[degreDe(G)].slice();
  if (degreDe(G) === 3 && (etatCoeur(G).cruels || 0) >= 4) f.push('L4');
  return f;
}

// --- Le mode de débogage (jamais visible en jeu normal) ---
// Dans la console : lireDegres(). Ou un petit cadre à l'écran : « ?degres » dans l'adresse (ou localStorage
// « debug.degres » = « 1 »).
function lireDegres(G = typeof window !== 'undefined' ? window.GAME : null) {
  if (!G) return null;
  const D = etatDegres(G), C = etatCoeur(G), r = regardDe(G);
  return {
    degre: D.d, nom: DEGRES[D.d].nom, engagement: Math.round(D.e * 10) / 10, jauge: G.lo ? Math.round(G.lo.points) : 0,
    tiedeur: Math.round(D.tiedeur * 10) / 10, graves: { ...D.graves }, verrous: Object.keys(D.verrous).filter(k => D.verrous[k]).map(k => `${k} (jour ${D.verrous[k]})`),
    bornes: bornesDegres(G, D), fins: finsPossiblesDegres(G), derniers: D.histo.slice(0, 5),
    coeur: Math.round(C.v), bonte: C.bonte, cruaute: C.cruaute, cruels: C.cruels || 0,
    regard: { confrerie: Math.round(r.confrerie), bannis: Math.round(r.bannis), niveauConfrerie: r.niveauConfrerie, niveauBannis: r.niveauBannis },
    lueurs: lueursDe(G), voitLesCamps: voitLesCamps(G),
  };
}
function debogageDegresDemande() {
  try {
    if (typeof location !== 'undefined' && /[?&]degres\b/.test(location.search)) return true;
    return typeof localStorage !== 'undefined' && localStorage.getItem('debug.degres') === '1';
  } catch (e) { return false; }
}
function afficherDebogageDegres() {
  if (typeof document === 'undefined' || document.getElementById('debogage-degres')) return;
  const el = document.createElement('div');
  el.id = 'debogage-degres';
  el.style.cssText = 'position:fixed;left:6px;bottom:6px;z-index:9999;max-width:340px;padding:6px 8px;border-radius:4px;' +
    'background:rgba(10,8,14,.82);color:#e8e0cc;font:11px/1.35 monospace;white-space:pre-wrap;pointer-events:none';
  document.body.appendChild(el);
  setInterval(() => {
    const G = window.GAME;
    if (!G || !G.lo) { el.textContent = 'degrés : pas de partie'; return; }
    try {
      const L = lireDegres(G);
      el.textContent = `ALLÉGEANCE ${L.degre > 0 ? '+' : ''}${L.degre} · ${L.nom} · engagement ${L.engagement}\n` +
        `CŒUR ${L.coeur} (bonté ${L.bonte} · cruauté ${L.cruaute})\nREGARD Confrérie ${L.regard.confrerie} (${L.regard.niveauConfrerie}) · Bannis ${L.regard.bannis} (${L.regard.niveauBannis})\n` +
        `jauge ${L.jauge} · tiédeur ${L.tiedeur} · graves ☀${L.graves.bien} ☾${L.graves.mal} · lueurs ${L.lueurs}${L.voitLesCamps ? ' (☀☾)' : ''}\n` +
        `bornes [${L.bornes.join(', ')}]${L.verrous.length ? ' · ' + L.verrous.join(', ') : ''}\nfins ${L.fins.join(' ')}` +
        (L.derniers.length ? `\n${L.derniers.slice(0, 3).map(h => `j${h.jour} ${h.de}→${h.a} ${h.pourquoi}`).join('\n')}` : '');
    } catch (e) { el.textContent = 'degrés : ' + e.message; }
  }, 500);
}
if (typeof window !== 'undefined' && typeof document !== 'undefined' && debogageDegresDemande()) {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', afficherDebogageDegres);
  else afficherDebogageDegres();
}
