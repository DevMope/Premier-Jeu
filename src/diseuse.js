// (v1.06, lot B-4, planche 23) Madame Ysmée, la diseuse : sa tente violette se dresse dans la rue au jour 10.
// Chaque matin, avant l'ouverture du comptoir, elle retourne une carte pour 2 pièces : un présage pour la
// journée. Elle dit vrai le plus souvent, pas toujours ; jamais un mot ne la trahit, mais avec du flair on
// remarque de tout petits détails sous la tente (la flamme qui vacille, une carte à l'envers, son chat qui
// détourne la tête). Personne ne sait son âge, d'où elle vient, ni si elle a vraiment des pouvoirs.

const DISEUSE = { jour: 10, prix: 2, trompe: 0.25, tente: 1610, pourboire: [8, 18], gardeDans: [1, 5] };
POSTES.diseuse = 'Madame Ysmée'; POSTES.pourboires = 'Pourboires';
const PRESAGES = {
  corbeau: { nom: 'Le Corbeau', dit: "« Le Corbeau... Quelqu'un te mentira aujourd'hui. Méfie-toi des visages trop aimables. »", bref: "quelqu'un te mentira aujourd'hui" },
  roue: { nom: 'La Roue', dit: "« La Roue tourne... Un retour inattendu : quelqu'un rentrera plus tôt que prévu. »", bref: 'un retour inattendu' },
  tour: { nom: 'La Tour', dit: "« La Tour... La garde passera cette semaine. Range bien ce qui doit l'être. »", bref: 'la garde passera cette semaine' },
  etoile: { nom: "L'Étoile", dit: "« L'Étoile brille sur ton comptoir : un client généreux passera aujourd'hui. »", bref: 'un client généreux' },
  soleil: { nom: 'Le Soleil', dit: "« Le Soleil... Une belle journée : tes clients auront le cœur léger, et la bourse moins serrée. »", bref: 'des clients au cœur léger' },
};
const INDICES_PRESAGE = ['flamme', 'carte', 'chat'];

function ysmeeArrivee(G) { return G.jour >= DISEUSE.jour; }
function presageDuJour(G) { return G.presage && G.presage.jour === G.jour ? G.presage : null; }
// Les missions en cours dont l'aventurier reviendra vivant (pour la Roue)
function retoursPossibles(G) {
  return (G.partis || []).filter(p => !p.termine && p.retour > G.jour).filter(p => {
    if (!p.resultat) p.resultat = simulerAventure(p.voyageur, p.colis, p.pieges);   // (le sort est tiré une fois, et gardé)
    return p.resultat.vivant;
  });
}
// Peut-on tirer une carte ce matin ? null si oui, sinon la raison
function refusPresage(G) {
  if (!ysmeeArrivee(G)) return "La tente est fermée.";
  if (presageDuJour(G)) return "« Les cartes ont déjà parlé pour aujourd'hui, petit marchand. Reviens demain. »";
  if (G.fileDuJour === G.jour) return "« Les cartes ne parlent qu'au matin, avant que ta porte s'ouvre. Reviens demain. »";
  return null;
}
// Payer et tirer la carte du jour. Renvoie { erreur } ou le présage { id, vrai, indices }
function tirerPresage(G) {
  const refus = refusPresage(G);
  if (refus) return { erreur: refus };
  if (!peutPayer(G, DISEUSE.prix)) return { erreur: manqueArgent(G, DISEUSE.prix, "Pas assez d'argent pour le présage.") };
  payer(G, DISEUSE.prix, 'diseuse');
  // (la Roue, s'il y a quelqu'un en mission ; la Tour, seulement si la garde te surveille déjà : elle prévient d'une
  // visite qui pouvait venir, elle ne l'invente pas)
  const possibles = Object.keys(PRESAGES).filter(id => (id !== 'roue' || retoursPossibles(G).length) && (id !== 'tour' || palierCamp(G) < 0));
  const id = auHasard(possibles), vrai = Math.random() >= DISEUSE.trompe;
  // un présage trompeur se trahit par de petits détails, d'autant plus visibles que ton flair est grand
  const indices = vrai ? [] : INDICES_PRESAGE.filter(() => Math.random() < niveauFlair(G));
  const p = G.presage = { jour: G.jour, id, vrai, indices };
  G.stats.presages = (G.stats.presages || 0) + 1;
  if (vrai && id === 'roue') { const r = auHasard(retoursPossibles(G)); if (r) r.retour = G.jour; }
  if (vrai && id === 'tour') G.gardePresage = G.jour + hasard(...DISEUSE.gardeDans);
  return p;
}
function presageVrai(G, id) { const p = presageDuJour(G); return !!(p && p.vrai && p.id === id); }

// Quand la file du jour se forme : le Corbeau (un imposteur parmi les imprévus), l'Étoile (un client généreux)
function presageSurLaFile(G, clients, debut) {
  if (presageVrai(G, 'corbeau') && !clients.slice(debut).some(v => v.imposteur)) {
    const libres = []; for (let i = debut; i < clients.length; i++) { const v = clients[i]; if (!v.habitue && !v.prestige && !v.exige && !v.recherche) libres.push(i); }
    if (libres.length) {
      const i = auHasard(libres), un = [clients[i]], avant = [IMPOSTURE.chance, IMPOSTURE.chanceMax];
      IMPOSTURE.chance = IMPOSTURE.chanceMax = 1;
      try { deguiserClients(G, un, 0); } finally { [IMPOSTURE.chance, IMPOSTURE.chanceMax] = avant; }
      clients[i] = un[0];
    }
  }
  if (presageVrai(G, 'etoile')) {
    const honnetes = clients.filter(v => !v.imposteur);
    if (honnetes.length) auHasard(honnetes).genereux = hasard(...DISEUSE.pourboire);
  }
}
// Le client généreux, à son départ : un pourboire
function pourboireAuDepart(G, v) {
  if (!v.genereux) return null;
  const n = v.genereux; delete v.genereux;
  encaisser(G, n, 'pourboires');
  return `${v.feminin ? 'Elle' : 'Il'} glisse ${n} pièces sur le comptoir : « Pour ta peine, et merci ! » (+${n} p.)`;
}
// Le Soleil : un peu plus de patience au marchandage
function patiencePresage(G) { return presageVrai(G, 'soleil') ? 1 : 0; }
// La Tour : la garde vient le jour dit
function gardePresageDuJour(G) {
  if (!G.gardePresage || G.gardePresage > G.jour) return false;
  delete G.gardePresage;
  return true;
}

// Le jour de son arrivée, une ligne dans les nouvelles du matin
function nouvelleYsmee(G) {
  return G.jour === DISEUSE.jour ? "Pendant la nuit, une tente violette s'est dressée dans la rue, entre ton comptoir et la maison des Brindeloup. On dit qu'une diseuse y lit l'avenir pour deux pièces..." : null;
}
