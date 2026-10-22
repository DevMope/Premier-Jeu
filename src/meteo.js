// (v1.53, planche 62 validée) La météo du jour : un temps par jour, tiré selon la saison, le même pour une partie donnée
// (il dépend de la graine de la partie et du jour : recharger ne change pas le ciel). Madame Ysmée l'annonce chaque
// matin sur son ardoise devant la tente (elle dit juste quatre fois sur cinq), et sa boule de cristal voit le lendemain.
// Le temps change la demande (les prix du marché), le nombre de clients, et durcit certaines épreuves des aventuriers
// partis ce jour-là quand il leur manque le bon objet.

const METEOS = {
  soleil: { nom: 'Beau temps', ardoise: ['BEAU TEMPS'], clients: 0, coul: '#f0c040',
    phrase: 'Grand soleil sur le Comté : une belle journée pour partir à l\'aventure.' },
  pluie: { nom: 'Pluie', ardoise: ['PLUIE', 'dès midi'], clients: -1, coul: '#8ab0d8',
    phrase: 'Il pleut des cordes : on demandera des capes aujourd\'hui, et la rue sera plus calme.' },
  orage: { nom: 'Orage', ardoise: ['ORAGE', 'à l\'abri !'], clients: -2, coul: '#b8a0e8',
    phrase: 'L\'orage gronde : seuls les braves viendront au comptoir, et les cols seront traîtres.' },
  canicule: { nom: 'Canicule', ardoise: ['CANICULE'], clients: 1, patience: -1, coul: '#f08040',
    phrase: 'Canicule ! On viendra tôt, avant la grosse chaleur ; les gourdes vont partir comme des petits pains.' },
  vent: { nom: 'Grand vent', ardoise: ['GRAND VENT'], clients: -1, coul: '#a8d8c8',
    phrase: 'Grand vent : les petits peuples restent chez eux, et les flèches vont dévier.' },
  neige: { nom: 'Neige', ardoise: ['NEIGE', 'tout le jour'], clients: -1, coul: '#e8f0ff',
    phrase: 'Il neige dru : peu de monde dehors, et le froid mangera une ration de plus en route.' },
};
// Le temps de chaque saison (les chances d'un jour) ; la neige n'existe qu'au mois du Givre
const TEMPS_SAISON = {
  semailles: { soleil: 0.56, pluie: 0.28, vent: 0.1, orage: 0.06 },
  moissons: { soleil: 0.52, canicule: 0.25, pluie: 0.13, orage: 0.1 },
  brumes: { soleil: 0.42, pluie: 0.28, vent: 0.2, orage: 0.1 },
  givre: { soleil: 0.37, neige: 0.33, vent: 0.18, pluie: 0.12 },
};
// La demande : les prix du marché (▲ plus cher, ▼ moins cher), multipliés aux prix de saison
const PRIX_METEO = {
  pluie: { cape: 1.1, bandage: 1.1 },
  orage: { cape: 1.1, torche: 1.1 },
  canicule: { gourde: 1.2, potion: 1.2, cape: 0.9 },
  vent: { corde: 1.1, fleches: 0.9 },
  neige: { cape: 1.1, torche: 1.1, ration: 1.1 },
};
// Les épreuves que le temps du départ durcit, si l'aventurier n'a pas le bon objet (×0,9)
const EPREUVES_METEO = {
  pluie: { types: ['route', 'riviere'], besoins: ['bandage', 'corde'] },       // (chemins glissants : une chute = un bandage ; gués gonflés)
  orage: { types: ['froid', 'avalanche', 'gouffre', 'tempete'], besoins: ['cape', 'torche'] },   // (montagnes et cols plus durs)
  canicule: { types: ['soif'], besoins: ['gourde', 'potion'] },                  // (les déserts très durs)
  vent: { types: ['gouffre', 'tempete'], besoins: ['corde', 'fleches'] },       // (ponts et falaises risqués ; les flèches dévient)
  neige: { types: ['froid', 'avalanche'], besoins: ['cape', 'ration'] },        // (cols fermés ; le froid mange une ration)
};
const MALUS_METEO = 0.9;
const METEO_REGLES = { justesse: 0.8 };   // (Ysmée dit juste quatre fois sur cinq)

// Un nombre au hasard, mais fixé pour la partie et le jour (sel : pour tirer plusieurs choses différentes)
function hasardMeteo(G, jour, sel = 0) {
  if (!G.graine) G.graine = Math.floor(Math.random() * 1e9);
  let n = Math.imul((G.graine | 0) ^ 0x5bd1e995, 2654435761) + Math.imul(jour + 7, 374761393) + Math.imul(sel + 3, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177); n = Math.imul(n ^ (n >>> 16), 2246822519);
  return ((n ^ (n >>> 15)) >>> 0) / 4294967296;
}
function tirerTemps(table, u) { let acc = 0; for (const [id, p] of Object.entries(table)) { acc += p; if (u < acc) return id; } return Object.keys(table)[0]; }
// Le temps qu'il fait vraiment ce jour-là (jamais deux orages de suite : le second tourne à la pluie)
function tempsBrut(G, jour) { return tirerTemps(TEMPS_SAISON[saisonDe(G, jour)] || TEMPS_SAISON.semailles, hasardMeteo(G, jour)); }
function meteoDu(G, jour = G.jour) {
  if (!G || jour < 1) return 'soleil';
  if (jour <= 2) return 'soleil';   // (les deux premiers jours : du beau temps, le temps d'apprendre)
  const t = tempsBrut(G, jour);
  return t === 'orage' && tempsBrut(G, jour - 1) === 'orage' ? 'pluie' : t;
}
// Ce qu'annonce Ysmée (son ardoise pour aujourd'hui, sa boule de cristal pour demain) : juste quatre fois sur cinq ;
// quand elle se trompe, elle annonce un autre temps possible de la saison
function meteoAnnoncee(G, jour = G.jour) {
  const vrai = meteoDu(G, jour);
  if (jour <= 2 || hasardMeteo(G, jour, 1) < METEO_REGLES.justesse) return vrai;
  const autres = Object.keys(TEMPS_SAISON[saisonDe(G, jour)] || {}).filter(t => t !== vrai);
  return autres.length ? autres[Math.floor(hasardMeteo(G, jour, 2) * autres.length)] : vrai;
}
function infoMeteo(G, jour = G.jour) { const id = meteoDu(G, jour); return { id, ...METEOS[id] }; }

// Les effets
// (la boutique est encore fragile : les deux premières semaines, le temps ne retire aucun client, la troisième un seul au plus)
function clientsMeteo(G, jour = G.jour) { const n = (METEOS[meteoDu(G, jour)] || {}).clients || 0; return jour <= 14 ? Math.max(0, n) : jour <= 21 ? Math.max(-1, n) : n; }
function patienceMeteo(G) { return (METEOS[meteoDu(G)] || {}).patience || 0; }
function prixMeteo(G, id) { return (PRIX_METEO[meteoDu(G)] || {})[id] || 1; }
function malusMeteo(G, e, niveau, voyageur = null) {
  if (!G || niveau === 'complet') return 1;
  const t = (voyageur && voyageur.meteo) || meteoDu(G), m = EPREUVES_METEO[t];
  return m && (m.types.includes(e.type) || m.besoins.includes(e.besoin)) ? MALUS_METEO : 1;
}
// La nouvelle du matin : le temps qu'il fait, et ce qu'en disait Ysmée quand elle s'est trompée
function nouvelleMeteo(G) {
  if (G.jour <= 2) return null;
  const m = infoMeteo(G), annonce = meteoAnnoncee(G);
  if (typeof ysmeeArrivee === 'function' && ysmeeArrivee(G) && annonce !== m.id)
    return `${m.phrase} (Madame Ysmée avait écrit « ${METEOS[annonce].nom.toLowerCase()} » sur son ardoise : elle se trompe rarement.)`;
  return m.phrase;
}

// La boule de cristal d'Ysmée, après la carte du jour : le temps de demain (juste quatre fois sur cinq, elle aussi)
const BOULE_METEO = { soleil: 'du soleil, du grand soleil.', pluie: 'de la pluie. Prépare des capes.', orage: 'un orage. Gare aux cols, et aux montagnes.',
  canicule: 'une chaleur à cuire un œuf sur les pavés. Des gourdes, des gourdes !', vent: 'un vent à décorner les bœufs.', neige: 'de la neige, beaucoup de neige.' };
function bouleDeCristal(G) { return ` Elle se penche sur sa boule de cristal : « Et demain... ${BOULE_METEO[meteoAnnoncee(G, G.jour + 1)]} »`; }
