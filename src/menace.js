// (v1.33, planche 39 validée) C-2 La menace qui grandit. Dès ★3, une fois par mois (le 15, la semaine après la commande
// scellée ; jamais pendant la trêve du Long Hiver), une contrée est attaquée. Le crieur dit « des pillards » : c'est la
// version du Conseil. En vrai, c'est l'Engeance qui sort par la Porte entrouverte (les survivants parlent d'yeux violets).
// On a six jours pour y envoyer une escouade (trois places) ; la bataille se joue la nuit du sixième jour.
//   tenue  : une prime, de la réputation, un point de conquête ;
//   perdue : plus de missions là-bas, deux provisions plus chères, son royaume bloqué ; sept jours plus tard, on peut la
//            reprendre (deux retours réussis). Elle revient avec sa conquête d'avant, moins 1, 2 ou 3 points selon
//            l'échec (ceux-là, il faut les regagner en missions), et la reprise est un peu plus dure.
// Les voisines entièrement conquises soutiennent la défense ; une contrée isolée se défend mal, et l'Engeance la vise plus.
const MENACE = {
  etoiles: 3, jourDuMois: 15, delai: 6, places: 3,
  menace: d => 40 + 6 * d,                     // la force de l'assaut (en %), selon les étoiles de la contrée
  porte: 3,                                     // + par palier d'étoiles ouvert au-delà de ★3 (la Porte s'entrouvre)
  prime: { 2: 400, 3: 900, 4: 1500, 5: 2200 }, reputation: 3,
  voisins: { distance: 330, max: 4, bonus: 4, plafond: 12, isolee: -10 },
  perte: { peu: 15, net: 30 },                  // l'écart (force − menace) pour −1 / −2 ; au-delà, −3
  perdues: { max: 2, hausse: 0.3, reprise: 7, retours: 2, malus: 0.015, reputation: 6 },
  confrerie: 0.75,                              // l'escouade de la Confrérie tient une place, avec cette chance
  deuxFronts: 0.35,                             // à ★5 : parfois deux contrées le même mois
};
if (typeof POSTES !== 'undefined') POSTES.defenses = 'Primes de défense';

function etatMenace(G) {
  if (!G.menace) G.menace = { actives: [], perdues: {}, tenues: 0, tombees: 0 };
  return G.menace;
}
function menaceSur(G, zone) { return (etatMenace(G).actives || []).find(m => m.zone === zone) || null; }
function contreePerdue(G, zone) { return (etatMenace(G).perdues || {})[zone] || null; }
function campDeMenace(G) {
  const c = G.camp || (typeof sermentDe === 'function' && sermentDe(G));
  if (c) return c;
  const p = palierCamp(G);
  return p >= 2 ? 'bien' : p <= -2 ? 'mal' : null;
}

// Les voisines : les contrées les plus proches sur la carte
function voisinesDe(zone) {
  const z = ZONES[zone], V = MENACE.voisins;
  return Object.keys(ZONES).filter(c => c !== zone).map(c => [c, Math.hypot(ZONES[c].x - z.x, ZONES[c].y - z.y)])
    .filter(([, d]) => d <= V.distance).sort((a, b) => a[1] - b[1]).slice(0, V.max).map(([c]) => c);
}
const zoneConquise = (G, c) => ((G.conquete || {})[c] || 0) >= conqueteZone(c) && !contreePerdue(G, c);
// Le soutien des voisines (en points de %) : +4 par voisine conquise (+12 au plus) ; isolée, −10
function soutienVoisines(G, zone) {
  const V = MENACE.voisins, vs = voisinesDe(zone);
  const conquises = vs.filter(c => zoneConquise(G, c)), ouvertes = vs.filter(c => zoneOuverte(G, c) && !contreePerdue(G, c));
  if (conquises.length) return { points: Math.min(V.plafond, V.bonus * conquises.length), conquises };
  return { points: ouvertes.length <= 1 ? V.isolee : 0, conquises, isolee: ouvertes.length <= 1 };
}

// La force de l'assaut : selon les étoiles, et la Porte qui s'entrouvre avec les paliers
function forceAssaut(G, zone) {
  const paliers = (G.paliersEtoiles || []).filter(d => d > MENACE.etoiles).length;
  return MENACE.menace(ZONES[zone].danger) + MENACE.porte * paliers;
}

// Qui tient la contrée : les défenseurs partis (leur chance au départ), et l'escouade de la Confrérie
function defenseursDe(G, zone) {
  const m = menaceSur(G, zone);
  if (!m) return [];
  const ds = G.partis.filter(p => p.voyageur.defense === zone && p.depart >= m.annonce).map(p => ({ nom: p.voyageur.nom, chance: p.chance, parti: p }));
  if (typeof confrerieA === 'function' && confrerieA(G, 'escouade') && ZONES[zone].camp === 'bien') ds.unshift({ nom: "L'escouade de la Confrérie", chance: MENACE.confrerie, confrerie: true });
  return ds.slice(0, MENACE.places);
}
// La force de l'escouade (en %) : la moyenne des chances, moins forte s'il manque du monde, et le soutien des voisines
function forceEscouade(G, zone, enPlus = null) {
  const ds = defenseursDe(G, zone).map(d => d.chance);
  if (enPlus !== null && ds.length < MENACE.places) ds.push(enPlus);
  if (!ds.length) return 0;
  const moyenne = ds.reduce((a, b) => a + b, 0) / ds.length;
  return Math.max(0, Math.round(moyenne * 100 * Math.sqrt(ds.length / MENACE.places) + soutienVoisines(G, zone).points));
}
const chanceDeTenir = (force, assaut) => Phaser.Math.Clamp(0.5 + (force - assaut) / 40, 0.05, 0.95);

// Les contrées que l'Engeance peut viser : ouvertes, de ton camp (ou toutes pour un neutre), jamais la Comté
function ciblesDeMenace(G) {
  const camp = campDeMenace(G), M = etatMenace(G), haut = Math.max(1, ...(G.paliersEtoiles || [1]));
  return zonesOuvertes(G).filter(z => {
    const Z = ZONES[z];
    if (Z.danger < 2 || Z.danger > haut || Z.royaume === 'comte' || menaceSur(G, z) || M.perdues[z]) return false;
    if (camp === 'bien') return Z.camp !== 'mal';
    if (camp === 'mal') return Z.camp === 'mal';
    return true;
  });
}
function poidsCible(G, z) {
  const s = soutienVoisines(G, z);
  return 1 + (s.conquises.length ? 0 : 2) + (s.isolee ? 1 : 0) + ZONES[z].x / 900;   // (mal tenue, ou près de la Porte, à l'est)
}
function tirerCible(G) {
  const cs = ciblesDeMenace(G);
  if (!cs.length) return null;
  let r = Math.random() * cs.reduce((s, z) => s + poidsCible(G, z), 0);
  for (const z of cs) { r -= poidsCible(G, z); if (r <= 0) return z; }
  return cs[cs.length - 1];
}

// Envoyer un Ouvre-Route défendre (au lieu d'une mission) : une quête de la contrée, un combat de plus, il revient le soir
// de la bataille ; il rapporte moins (on se bat, on ne fouille pas)
function quetePourMenace(G, v, zone) {
  appliquerQuete(G, v, auHasard(ZONES[zone].quetes));
  const combats = Object.values(QUETES).flatMap(q => q.epreuves).filter(e => EPREUVES_COMBAT.includes(e.type) && e.besoin === 'epee');
  const combat = { ...(combats.find(e => e.type === 'pillards') || auHasard(combats)) };
  combat.qte = (combat.qte || 1) + 1;
  v.epreuves.push(combat);
}
function envoyerDefendre(G, v, zone) {
  const m = menaceSur(G, zone);
  quetePourMenace(G, v, zone);
  v.duree = Math.max(1, m.bataille - G.jour);
  v.butin = Math.round(v.butin * 0.5);
  v.defense = zone;
  v.quete = `Défendre ${ZONES[zone].nom}`;
  v.accueil = `« Des pillards ${aLieu(ZONES[zone].nom).replace(/^à /, 'à ')} ? J'y vais. Équipe-moi pour la bataille. »`;
  return v;
}
// Reprendre une contrée perdue : une quête de la contrée et un combat de plus, plus dure selon les points perdus
function envoyerReprendre(G, v, zone) {
  quetePourMenace(G, v, zone);
  v.reprise = zone;
  v.quete = `Reprendre ${ZONES[zone].nom}`;
  v.accueil = `« Reprendre ${ZONES[zone].nom} aux pillards ? Il faudra du solide. »`;
  return v;
}
// (dans chanceEtapeBase) la reprise est un peu plus dure : −1,5 % par épreuve et par point perdu
function malusDeReprise(voyageur) {
  const G = window.GAME, p = voyageur && voyageur.reprise && G && contreePerdue(G, voyageur.reprise);
  return p ? MENACE.perdues.malus * p.points : 0;
}
function repriseOuverte(G, zone) { const p = contreePerdue(G, zone); return !!p && G.jour >= p.repriseDes; }
// Ce voyageur accepte-t-il d'aller défendre (ou reprendre) cette contrée ? (les mêmes refus qu'une mission)
function refusDefense(G, v, zone) { return refusDeBase(G, v, zone, true); }

// Une contrée perdue : on n'y envoie plus personne (sauf pour la reprendre)
function refusMenace(G, v, zone) {
  if (!contreePerdue(G, zone)) return null;
  return `« ${ZONES[zone].nom} ? Les pillards y campent. Personne n'y va plus, à moins d'aller la reprendre. »`;
}
// Les provisions de la contrée perdue coûtent plus cher au marché
function provisionsDeContree(zone) { return besoinsDeZone(zone).filter(id => !estArme(id) && ITEMS[id]).slice(0, 2); }
function hausseMenace(G, id) {
  let k = 1;
  for (const z of Object.keys((G.menace && G.menace.perdues) || {})) if (provisionsDeContree(z).includes(id)) k += MENACE.perdues.hausse;
  return k;
}

// Après un retour (dans terminerAventure) : une défense ne compte pas pour la conquête (la bataille s'en charge) ;
// une reprise réussie compte pour la reprise
function apresMissionMenace(G, parti) {
  const v = parti.voyageur, r = parti.resultat, z = v.defense || v.reprise;
  if (!z || !r || !r.vivant || r.echec) return null;
  if (v.defense && (G.conquete[z] || 0) > 0) { G.conquete[z]--; parti.conquise = false; }
  const p = v.reprise && contreePerdue(G, z);
  if (!p) return null;
  G.conquete[z] = 0; parti.conquise = false;
  p.reprise = (p.reprise || 0) + 1;
  if (p.reprise < MENACE.perdues.retours) return `⚔ ${ZONES[z].nom} : un pas de plus pour la reprendre (${p.reprise} / ${MENACE.perdues.retours}).`;
  delete G.menace.perdues[z];
  G.conquete[z] = Math.max(0, (p.avant || 0) - p.points);
  G.reputation += MENACE.perdues.reputation;
  G.menace.reprises = (G.menace.reprises || 0) + 1;
  G.annonceMenace = `${ZONES[z].nom.toUpperCase()} : LA CONTRÉE EST REPRISE ! Les pillards ont fui. Il faudra du temps pour tout reconstruire.`;
  return `⚔ ${ZONES[z].nom} : reprise ! La contrée revient (⚑ ${G.conquete[z]} / ${conqueteZone(z)}, ${p.points} point${p.points > 1 ? 's' : ''} de conquête perdu${p.points > 1 ? 's' : ''}) · +${MENACE.perdues.reputation} réputation`;
}

// La nuit : l'annonce (le 15 du mois), la bataille (la nuit du sixième jour)
const INDICES_ENGEANCE = [
  "jure qu'il a vu « des yeux violets dans la brume, plus que d'hommes »",
  "parle de griffes qui fumaient encore dans la boue",
  "dit qu'une voix lui parlait dans la tête pendant la bataille",
  "raconte que les pillards ne saignaient pas comme des hommes",
  "a ramassé une écaille noire, froide comme la pierre",
];
const MURMURES_ENGEANCE = ["qu'il y avait des yeux violets dans la brume", "que leurs griffes fumaient dans la boue", "qu'une voix leur parlait dans la tête", "que les pillards ne saignaient pas comme des hommes"];
function nuitDeLaMenace(G) {
  const M = etatMenace(G), demain = G.jour + 1;
  M.nouvelles = M.nouvelles || [];
  for (const m of M.actives.filter(x => x.bataille === demain)) {
    const z = ZONES[m.zone], ds = defenseursDe(G, m.zone), force = forceEscouade(G, m.zone), assaut = m.assaut;
    const tenue = Math.random() < (ds.length ? chanceDeTenir(force, assaut) : 0);
    M.actives = M.actives.filter(x => x !== m);
    G.conquete = G.conquete || {};
    const indice = auHasard(INDICES_ENGEANCE), temoin = ds.find(d => !d.confrerie);
    if (tenue) {
      const prime = MENACE.prime[z.danger] || 900;
      encaisser(G, prime, 'defenses');
      G.reputation += MENACE.reputation;
      G.conquete = G.conquete || {};
      G.conquete[m.zone] = Math.min(conqueteZone(m.zone), (G.conquete[m.zone] || 0) + 1);
      M.tenues = (M.tenues || 0) + 1;
      M.drapeaux = { ...(M.drapeaux || {}), [m.zone]: demain };   // (la bannière dorée, une semaine sur la carte)
      M.nouvelles.push({ zone: m.zone, tenue: true, gains: `+${prime} p. · +${MENACE.reputation} réputation · +1 ⚑` });
      G.annonceMenace = `${z.nom.toUpperCase()} : LA CONTRÉE TIENT BON ! ${ds.length > 1 ? `${ds.length} défenseurs ont` : 'Un défenseur a'} repoussé les pillards.${temoin ? ` ${prenomDe(temoin.nom)} ${indice}. Le Conseil parle de fièvre.` : ''}`;
    } else {
      const ecart = assaut - force;
      const points = ds.length <= 1 ? 3 : ecart <= MENACE.perte.peu ? 1 : ecart <= MENACE.perte.net ? 2 : 3;
      M.perdues[m.zone] = { depuis: demain, points, sans: !ds.length, avant: (G.conquete || {})[m.zone] || 0, repriseDes: demain + MENACE.perdues.reprise, reprise: 0 };
      G.conquete[m.zone] = 0;
      M.tombees = (M.tombees || 0) + 1;
      M.nouvelles.push({ zone: m.zone, tenue: false, points, sans: !ds.length });
      G.annonceMenace = `${z.nom.toUpperCase()} : LA CONTRÉE EST TOMBÉE. ${ds.length ? "L'escouade a été repoussée" : "Personne ne l'a défendue"} ; les pillards y campent. Les survivants murmurent ${auHasard(MURMURES_ENGEANCE)}.`;
    }
  }
  // l'annonce : le 15 du mois, dès ★3, jamais pendant la trêve du Long Hiver ; deux contrées perdues au plus
  const d = dateDuJour(G, demain);
  if (d.jourDuMois !== MENACE.jourDuMois || M.annonceJour === demain || G.faillite) return;
  if (!(G.paliersEtoiles || []).includes(MENACE.etoiles)) return;
  if (typeof feteDuJour === 'function' && [...Array(MENACE.delai + 1).keys()].some(k => { const f = feteDuJour(G, demain + k); return f && f.id === 'hiver'; })) return;
  if (Object.keys(M.perdues).length >= MENACE.perdues.max) return;
  M.annonceJour = demain;
  const fronts = (G.paliersEtoiles || []).includes(5) && Math.random() < MENACE.deuxFronts ? 2 : 1;
  for (let i = 0; i < fronts; i++) {
    const zone = tirerCible(G);
    if (!zone) break;
    M.actives.push({ zone, annonce: demain, bataille: demain + MENACE.delai, assaut: forceAssaut(G, zone) });
  }
}
// Au matin : le crieur, le lendemain de la bataille
function matinDeLaMenace(G) {
  const M = etatMenace(G), lignes = [];
  for (const m of M.actives.filter(x => x.annonce === G.jour)) {
    const z = ZONES[m.zone];
    const qui = z.camp === 'mal' ? 'Un messager des Bannis frappe à ta porte, tout essoufflé :' : 'Sur la place, le crieur du Conseil agite sa cloche :';
    lignes.push(`${qui} « Des pillards marchent sur ${z.nom.replace(/^L/, 'l')} ! ${z.camp === 'mal' ? 'Nos terres ont besoin' : 'Le Conseil a besoin'} de trois Ouvre-Routes pour les défendre. Bataille dans ${MENACE.delai} jours ! » (Sur la carte : ⚔ ${z.nom}.)`);
    if (!G.annonceMenace) G.annonceMenace = `DES PILLARDS MARCHENT SUR ${z.nom.toUpperCase()} ! ${z.camp === 'mal' ? 'Les Bannis cherchent' : 'Le Conseil cherche'} des défenseurs. Bataille dans ${MENACE.delai} jours.`;
  }
  for (const n of M.nouvelles || []) {
    const z = ZONES[n.zone];
    if (n.tenue) lignes.push(`⚔ ${z.nom} : la contrée a tenu ! Les pillards ont reculé. ${n.gains}`);
    else lignes.push(`⚔ ${z.nom} : ${n.sans ? "personne ne l'a défendue, " : ''}la contrée est tombée. Les pillards y campent : plus de missions là-bas, et ${provisionsDeContree(n.zone).map(id => nomObjet(id).toLowerCase()).join(' et ')} coûtent plus cher au marché. Dans ${MENACE.perdues.reprise} jours, on pourra la reprendre (−${n.points} point${n.points > 1 ? 's' : ''} de conquête, à regagner).`);
  }
  M.vues = M.nouvelles || [];
  M.nouvelles = [];
  for (const [z, p] of Object.entries(M.perdues)) if (p.repriseDes === G.jour) lignes.push(`⚔ On peut tenter de reprendre ${ZONES[z].nom} : deux Ouvre-Routes qui en reviennent vivants, et la contrée est à toi.`);
  return lignes;
}
