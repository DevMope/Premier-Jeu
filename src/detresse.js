// (v1.22, C-7, planche 49 v2) Les messages de détresse : pendant une mission de 2 jours ou plus, un pigeon
// se pose sur le rebord de la fenêtre du comptoir. L'aventurier manque de quelque chose pour une épreuve
// qui l'attend ; tu peux lui envoyer l'aigle du Conseil, un mercenaire, le corbeau de la Main Noire... ou rien.
const DETRESSE = {
  dureeMin: 2,          // une mission d'au moins deux jours
  ecart: 7,             // au plus un pigeon par semaine
  chance: 0.4,          // chaque jour où une mission s'y prête
  jourMin: 5,           // pas pendant les tout premiers jours
  aigle: { parEtoile: 15 },
  mercenaire: { parEtoile: 8, heure: 1, arrive: 0.8 },
  corbeau: { prix: 5 },
  malusRien: 0.15,      // ses chances baissent sur cette épreuve-là
  relation: 2,          // « il ne l'oubliera pas »
};
// Ce qui lui arrive, selon l'objet qui manque (le {e} s'accorde)
const RAISONS_DETRESSE = {
  torche: 'la nuit est tombée et ses torches se sont éteintes',
  corde: 'un ravin lui barre la route, et il n\'a plus de corde',
  antidote: 'une bête venimeuse rôde, et il n\'a pas d\'antidote',
  potion: 'il est mal en point, et il n\'a plus de potion',
  bandage: 'il saigne, et il n\'a plus de bandage',
  gourde: 'il n\'a plus une goutte d\'eau',
  ration: 'il n\'a plus rien à manger',
  cape: 'le froid le transperce',
  bouclier: 'les coups pleuvent, et il n\'a pas de bouclier',
  amulette: 'une ombre le hante la nuit',
  fleches: 'il n\'a plus de flèches',
  arme: 'son arme s\'est brisée',
};

// L'épreuve qui va lui manquer : la première pour laquelle son baluchon n'est pas complet
function besoinDetresse(p) {
  const v = p.voyageur;
  for (let i = 0; i < v.epreuves.length; i++) {
    const e = v.epreuves[i];
    if (e.detour || niveauEpreuve(e, p.colis, v) === 'complet') continue;
    const arme = estArme(e.besoin), id = arme ? armePour(v) : e.besoin;
    const donne = arme ? armesDonnees(p.colis) : (p.colis[e.besoin] || 0);
    return { i, id, qte: Math.max(1, e.qte - donne), arme };
  }
  return null;
}

// Le pigeon du jour (ou rien) : il entre dans la file comme une visite
function detresseDuJour(G) {
  if (G.jour < DETRESSE.jourMin || (G.detresseJour && G.jour - G.detresseJour < DETRESSE.ecart)) return null;
  const candidats = G.partis.filter(p => !p.termine && !p.resultat && !p.detresse && p.retour - p.depart >= DETRESSE.dureeMin
    && p.depart < G.jour && p.retour > G.jour && !Object.values(p.pieges || {}).some(n => n > 0) && besoinDetresse(p));
  if (!candidats.length || Math.random() >= DETRESSE.chance) return null;
  const p = auHasard(candidats);
  p.detresse = { ...besoinDetresse(p), jour: G.jour };
  G.detresseJour = G.jour;
  return { type: 'detresse', parti: p };
}

function etoilesDetresse(p) { return ZONES[p.voyageur.zone] ? ZONES[p.voyageur.zone].danger : 1; }
function prixDetresse(p, choix) {
  if (choix === 'aigle') return DETRESSE.aigle.parEtoile * etoilesDetresse(p);
  if (choix === 'mercenaire') return DETRESSE.mercenaire.parEtoile * etoilesDetresse(p);
  if (choix === 'corbeau') return DETRESSE.corbeau.prix;
  return 0;
}
// L'objet à envoyer : celui de son peuple pour une arme, sinon n'importe quelle arme du stock
function objetDetresse(G, p) {
  const d = p.detresse;
  if (!d.arme || (G.stock[d.id] || 0) >= d.qte) return d.id;
  return IDS_ARMES.find(id => (G.stock[id] || 0) >= d.qte && armeAutorisee(p.voyageur, id)) || d.id;   // (le bâton : aux magiciennes seulement)
}
// Peut-on répondre ainsi ? { ok, raison }
function peutSecourir(G, p, choix) {
  if (choix === 'rien') return { ok: true };
  const d = p.detresse, id = objetDetresse(G, p);
  if (choix === 'aigle' && PEUPLES_OMBRE.includes(p.voyageur.race)) return { ok: false, raison: 'Le Conseil ne vole pas pour un Banni.' };
  if (choix === 'corbeau' && !(typeof enMafia === 'function' && enMafia(G))) return { ok: false, raison: 'Seulement si tu as affaire à la Main Noire.' };
  if ((G.stock[id] || 0) < d.qte) return { ok: false, raison: `Pas assez dans ton stock (${G.stock[id] || 0} / ${d.qte}).` };
  if (!peutPayer(G, prixDetresse(p, choix))) return { ok: false, raison: 'Pas assez d\'argent.' };
  return { ok: true };
}

// La réponse : les objets partent de ton stock, et arrivent (ou non) dans son baluchon
function repondreDetresse(G, p, choix) {
  const d = p.detresse, v = p.voyageur, prenom = prenomDe(v.nom);
  d.choix = choix;
  if (choix === 'rien') {
    v.epreuves[d.i].malusDetresse = DETRESSE.malusRien;
    return `Le pigeon attend un peu, puis repart sans réponse. ${prenom} devra faire sans : ses chances baissent sur cette épreuve.`;
  }
  const id = d.objet = objetDetresse(G, p);
  payer(G, prixDetresse(p, choix), 'secours');
  G.stock[id] -= d.qte;
  d.arrive = choix !== 'mercenaire' || Math.random() < DETRESSE.mercenaire.arrive;
  if (d.arrive) p.colis[id] = (p.colis[id] || 0) + d.qte;
  if (choix === 'corbeau') mafia(G).serviceDu = true;
  if (choix === 'aigle') return `Le fauconnier du Conseil emporte le paquet : l'aigle sera là-bas avant la nuit.`;
  if (choix === 'mercenaire') return `Un mercenaire part au pas de course avec le paquet. Il arrive en général... presque toujours.`;
  return `Un corbeau noir se pose, prend le paquet dans ses serres et repart. La Main Noire n'oublie jamais un service.`;
}

// Le texte de la lettre
function lettreDetresse(p) {
  const d = p.detresse, v = p.voyageur, prenom = prenomDe(v.nom);
  let raison = RAISONS_DETRESSE[d.arme ? 'arme' : d.id] || 'il lui manque quelque chose';
  if (v.feminin) raison = raison.replace(/\bil\b/g, 'elle').replace(/\ble (transperce|hante)/, 'la $1');
  const lieu = ZONES[v.zone] ? ZONES[v.zone].nom : 'là-bas';
  const objet = d.arme ? (d.qte > 1 ? `${d.qte} armes` : 'une arme') : `${d.qte} ${nomObjet(d.id).toLowerCase()}${d.qte > 1 && !/[sx]$/.test(nomObjet(d.id)) ? 's' : ''}`;
  return `« Au comptoir. ${prenom} est coincé${v.feminin ? 'e' : ''} ${aLieu(lieu)} : ${raison}. Il lui faut ${objet}, vite. »`;
}

// Au retour : il s'en souvient
function detresseAuRetour(G, p) {
  const d = p.detresse;
  if (!d || !d.choix || d.choix === 'rien' || !d.arrive || d.compte) return null;
  d.compte = true;
  changerRelation(G, p.voyageur.nom, DETRESSE.relation);
  const par = { aigle: 'ton aigle', mercenaire: 'ton mercenaire', corbeau: 'ce corbeau' }[d.choix];
  return `« Sans ${par}, je n'en serais pas revenu${p.voyageur.feminin ? 'e' : ''}. Je ne l'oublierai jamais. »`;
}
