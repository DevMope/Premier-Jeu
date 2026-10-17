// (v1.00, lot B-3a) La Fête du Solstice : « l'Union de la Confrérie », les 13, 14 et 15 des Moissons.
// Trois jours de fête au marché : le tir à l'arc de la Confrérie (planche 22b), le mât de cocagne,
// les atours de l'Union (portés : les clients de la lumière t'en aiment davantage ce jour-là), la
// tarte du Solstice (un cœur de plus au départ), la bénédiction du comptoir et, le dernier soir,
// les lanternes célestes.

const SOLSTICE = {
  tir: {
    prix: 10, parties: 3, fleches: 3,
    // les lots, du meilleur au plus petit (sur 30 points)
    lots: [{ score: 24, argent: 35, trefle: 1 }, { score: 18, argent: 20 }, { score: 12, argent: 8 }],
    record: [22, 27],          // le meilleur score du sergent Aubrin, chaque jour de la fête
    reputationTitre: 1,        // battre le record : le titre « Œil du Rempart » (une fois par an)
  },
  // le mât de cocagne : main gauche, main droite, sans lâcher ; la graisse coule, la force s'épuise
  mat: { prix: 5, parties: 3, duree: 25, prise: 0.04, mauvaiseMain: 0.03, gouttes: 0.08, glissadesMax: 3, effort: 0.08, repos: 0.3, glisseRepos: 0.025 },
  tarte: { prix: 6 },
  benediction: { prix: 15, reputation: 0.5, jours: 3 },
};

// Les atours de l'Union : rangés dans la garde-robe (on les garde d'une année sur l'autre), vendus
// seulement pendant la fête.
const ATOURS_UNION = ['couronneFleurs', 'echarpeUnion', 'capeUnion'];
Object.assign(GARDE_ROBE, {
  couronneFleurs: { f: true, fete: 'solstice', nom: 'Couronne de fleurs du Solstice', prix: 15, effet: "Pendant le Solstice : les clients de la lumière t'en aiment un peu plus (+1 de relation)." },
  echarpeUnion: { f: true, fete: 'solstice', nom: 'Écharpe bleu et or de la Confrérie', prix: 20, effet: "Pendant le Solstice : les clients de la lumière t'en aiment un peu plus (+1 de relation)." },
  capeUnion: { f: true, fete: 'solstice', nom: "Cape blanche de l'Union", prix: 40, effet: "Pendant le Solstice : les clients de la lumière t'en aiment un peu plus (+1 de relation)." },
});
// La tarte (au Bazar de Rosalie, pendant la fête) et le trèfle du Solstice (un lot du tir à l'arc) :
// des cadeaux à offrir au comptoir, mais qui ne se vendent pas toute l'année.
Object.assign(CADEAUX, {
  tarte: { nom: 'Tarte du Solstice', prix: SOLSTICE.tarte.prix, fete: 'solstice' },
  trefleSolstice: { nom: 'Trèfle du Solstice', prix: 0, lot: true },
});

// La fête de ce jour est-elle le Solstice (et ouverte) ?
function solsticeActif(G, jour = G.jour) {
  if (!feteOuverte('solstice')) return false;
  const f = feteDuJour(G, jour);
  return !!(f && f.id === 'solstice');
}
// L'état de la fête de cette année (remis à zéro chaque année)
function etatSolstice(G) {
  const an = dateDuJour(G).an;
  if (!G.solstice || G.solstice.an !== an) G.solstice = { an, tir: {}, mat: {}, record: {}, meilleur: 0, benit: false };
  return G.solstice;
}

// --- Le tir à l'arc ---
// Le record du jour du sergent Aubrin (le même toute la journée)
function recordTir(G) {
  const s = etatSolstice(G);
  if (!s.record[G.jour]) { const [a, b] = SOLSTICE.tir.record; s.record[G.jour] = a + ((G.jour * 7 + s.an * 3) % (b - a + 1)); }
  return s.record[G.jour];
}
function partiesTirRestantes(G) { return SOLSTICE.tir.parties - (etatSolstice(G).tir[G.jour] || 0); }
// Payer une partie : null si c'est bon, sinon le message
function commencerTir(G) {
  if (!solsticeActif(G)) return "Le tir à l'arc n'a lieu que pendant la Fête du Solstice.";
  if (partiesTirRestantes(G) <= 0) return "Le sergent range les arcs : trois parties par jour, pas plus. Reviens demain !";
  if (!peutPayer(G, SOLSTICE.tir.prix)) return manqueArgent(G, SOLSTICE.tir.prix, "Pas assez d'argent pour une partie.");
  payer(G, SOLSTICE.tir.prix, 'fete');
  const s = etatSolstice(G);
  s.tir[G.jour] = (s.tir[G.jour] || 0) + 1;
  return null;
}
// Les points d'une flèche, selon son écart au centre (0 au centre, 1 au bord de la cible)
function pointsFleche(ecart) { return ecart >= 1 ? 0 : Math.max(1, 10 - Math.floor(ecart * 10)); }
// La partie finie : les lots. Renvoie { total, argent, trefle, titre, texte }
function finirTir(G, points) {
  const s = etatSolstice(G);
  const total = points.reduce((a, b) => a + b, 0);
  const lot = SOLSTICE.tir.lots.find(l => total >= l.score);
  const r = { total, argent: lot ? lot.argent : 0, trefle: lot && lot.trefle ? 1 : 0, titre: false };
  if (r.argent) encaisser(G, r.argent, 'fete');
  if (r.trefle) G.cadeaux.trefleSolstice = (G.cadeaux.trefleSolstice || 0) + 1;
  s.meilleur = Math.max(s.meilleur || 0, total);
  if (total > recordTir(G) && G.titreRempart !== s.an) {
    G.titreRempart = s.an;
    G.reputation += SOLSTICE.tir.reputationTitre;
    r.titre = true;
  }
  r.texte = !lot ? "Pas de lot cette fois... Le sergent te tape sur l'épaule : « La prochaine sera la bonne ! »"
    : `Bravo ! ${r.argent} pièces${r.trefle ? ' et un trèfle du Solstice (à offrir au comptoir)' : ''}.`;
  if (r.titre) r.texte += ` Tu bats le record du sergent Aubrin (${recordTir(G)}) : le titre « Œil du Rempart » est à toi ! (+${SOLSTICE.tir.reputationTitre} de réputation)`;
  return r;
}

// --- La tarte du Solstice : chez Rosalie, pendant la fête ; elle ne se garde pas (périmée la nuit) ---
function acheterTarte(G) {
  if (!solsticeActif(G)) return "Les tartes du Solstice ne se font que pendant la fête.";
  return acheterCadeau(G, 'tarte');
}
// Offerte au comptoir : un cœur de plus au départ (pour ce voyage-là), et le client est touché
function offrirTarte(G, v) {
  v.tarte = true;   // (pour ce voyage-là : comme l'escorte du paladin)
  return `« Une tarte du Solstice ! Elle sent encore le four... » ${v.feminin ? 'Elle' : 'Il'} la range précieusement pour la route. (+1 cœur au départ)`;
}
function coeurTarte(voyageur) { return voyageur.tarte ? 1 : 0; }

// --- La bénédiction du comptoir : une offrande au paladin, une fois par fête ---
function benirComptoir(G) {
  const s = etatSolstice(G);
  if (!solsticeActif(G)) return "Le paladin ne bénit les comptoirs que pendant la Fête du Solstice.";
  if (s.benit) return 'Ton comptoir a déjà reçu sa bénédiction cette année.';
  if (!peutPayer(G, SOLSTICE.benediction.prix)) return manqueArgent(G, SOLSTICE.benediction.prix, "Pas assez d'argent pour l'offrande.");
  payer(G, SOLSTICE.benediction.prix, 'fete');
  s.benit = true;
  G.reputation += SOLSTICE.benediction.reputation;
  G.comptoirBeni = G.jour + SOLSTICE.benediction.jours - 1;
  return null;
}
function comptoirBeni(G) { return !!(G.comptoirBeni && G.comptoirBeni >= G.jour); }

// --- Les atours : un client de la lumière qui te voit en habit de fête (une fois par jour) ---
function remarqueAtours(G, v) {
  if (!solsticeActif(G) || PEUPLES_OMBRE.includes(v.race)) return null;
  const portes = ATOURS_UNION.filter(id => porte(G, id));
  if (!portes.length) return null;
  changerRelation(G, v.nom, 1);
  const id = portes[Math.floor(Math.random() * portes.length)];
  return { couronneFleurs: 'Quelle jolie couronne de fleurs ! Joyeux Solstice !', echarpeUnion: "L'écharpe de la Confrérie ! Vive l'Union !", capeUnion: "Une cape blanche de l'Union, rien que ça ! Joyeux Solstice !" }[id];
}

// --- Le mât de cocagne ---
function partiesMatRestantes(G) { return SOLSTICE.mat.parties - (etatSolstice(G).mat[G.jour] || 0); }
function commencerMat(G) {
  if (!solsticeActif(G)) return "Le mât de cocagne n'est dressé que pendant la Fête du Solstice.";
  if (partiesMatRestantes(G) <= 0) return 'On regraisse le mât pour demain : trois essais par jour, pas plus.';
  if (!peutPayer(G, SOLSTICE.mat.prix)) return manqueArgent(G, SOLSTICE.mat.prix, "Pas assez d'argent pour un essai.");
  payer(G, SOLSTICE.mat.prix, 'fete');
  const s = etatSolstice(G);
  s.mat[G.jour] = (s.mat[G.jour] || 0) + 1;
  return null;
}
// Les lots tout en haut : le jambon fumé (6 rations), ou le sac mystère (tiré au sort)
const SAC_MYSTERE = [
  { poids: 30, objets: { amulette: 2 }, texte: 'deux amulettes' },
  { poids: 25, objets: { potion: 3 }, texte: 'trois potions' },
  { poids: 25, objets: { cape: 2, antidote: 2 }, texte: 'deux capes chaudes et deux antidotes' },
  { poids: 20, objets: { bouclier: 1 }, arme: true, texte: 'un bouclier et une arme rare' },
];
function decrocherLot(G, choix) {
  const ajouter = (id, n) => { G.stock[id] = (G.stock[id] || 0) + n; };
  if (choix === 'jambon') { ajouter('ration', 6); return 'Le jambon fumé du Solstice ! Découpé en tranches : 6 rations dans ta réserve.'; }
  let r = Math.random() * SAC_MYSTERE.reduce((a, l) => a + l.poids, 0), lot = SAC_MYSTERE[0];
  for (const l of SAC_MYSTERE) { if ((r -= l.poids) < 0) { lot = l; break; } }
  for (const [id, n] of Object.entries(lot.objets)) ajouter(id, n);
  let texte = lot.texte;
  if (lot.arme) { const arme = ['rapiere', 'khopesh', 'marteau'][Math.floor(Math.random() * 3)]; ajouter(arme, 1); texte = `un bouclier et ${nomObjet(arme).toLowerCase() === 'marteau de guerre' ? 'un marteau de guerre' : nomObjet(arme) === 'Rapière' ? 'une rapière' : 'un khopesh'}`; }
  return `Le sac mystère ! Dedans : ${texte}. Tout file dans ta réserve.`;
}

// Les lanternes célestes : le soir du dernier jour du Solstice (une fois par an)
function lanternesCelestesDues(G) {
  const f = solsticeActif(G) ? feteDuJour(G) : null;
  return !!(f && f.jour === 2 && G.lanternesVues !== dateDuJour(G).an);
}

// La nuit : la tarte ne se garde pas
function nuitSolstice(G) {
  if (G.cadeaux && G.cadeaux.tarte) G.cadeaux.tarte = 0;
}
