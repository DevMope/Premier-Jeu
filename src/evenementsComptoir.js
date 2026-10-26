// (v1.63) Les événements du comptoir (GDD : « Idées d'événements au comptoir », retenus par le joueur le 24/10 et le
// 26/10, troisième vague). Dix-sept petites scènes, au hasard ou liées à ton histoire, qui se glissent dans la file du
// jour : le vieux voyageur qui a connu tes parents, le souci de Garrick, l'anniversaire du comptoir, la chanson du barde,
// le revenant des Brumes, l'enfant perdu (qui deviendra l'apprenti de l'atelier), l'averse, le pickpocket, le troc, le
// vantard, l'espion du paon, le pigeon blessé, les enfants qui jouent aux aventuriers, les amoureux, l'inspecteur des
// poids et mesures, le chat, le coup de vent.
// Les règles (validées) : environ un événement tous les trois jours, jamais deux le même jour ; ceux de l'histoire sont
// rares, espacés, et ne se rejouent pas ; un événement au hasard ne revient pas avant longtemps ; rien ne bloque la file
// ni les commandes ; tout est sauvegardé (G.evtComptoir, complété à chaque lecture : les vieilles parties restent bonnes).
// Ici, les règles seules (sans dessin) : la simulation s'en sert aussi. La mise en scène est dans
// scenes/ComptoirEvenements.js, les dessins dans evenementsComptoirHD.js.

const EVT_COMPTOIR = {
  jourMin: 6,            // (pas pendant les premiers jours : le temps d'apprendre le métier)
  ecart: 2,              // jamais deux le même jour, ni deux jours de suite
  chance: 0.5,           // un jour libre sur deux : en moyenne, un événement tous les trois jours
  argentPertes: 80,      // (ceux qui peuvent coûter quelques pièces attendent que la bourse puisse les perdre)
  repos: 45,             // un événement au hasard ne revient pas avant 45 jours
  ecartHistoire: 10,     // deux événements de l'histoire sont toujours séparés d'au moins 10 jours
  chanceHistoire: 0.5,   // (même quand elle peut avancer, l'histoire ne vient pas à jour fixe)
  parents: { jourMin: 22, ecart: 16 },
  garrick: { jourMin: 60, ecart: 20, pret: 30, rembourse: 36, delai: 7, paquet: 25 },
  anniversaire: { jourMin: 8, reputation: 0.5,
    cadeaux: [{ rep: 25, id: 'plaque', pieces: 60 }, { rep: 12, id: 'enseigne', pieces: 35 }, { rep: 5, id: 'panier', pieces: 20 }, { rep: -99, id: 'bouquet', pieces: 10 }] },
  barde: { jourMin: 28, repos: 60, prix: 8, reputation: 0.4, moquerie: 0.2, auMarche: 21 },
  revenant: { piece: 12 },
  enfant: { jourMin: 12, retour: [21, 30] },
  pickpocket: { jourMin: 12, perte: [6, 12], delai: 2800 },
  troc: { valeur: [14, 70] },
  vantard: { retour: [6, 10], vivant: 0.65, jours: 4, clients: 1, perte: 0.4 },
  pigeon: { retour: [8, 14], pieces: [10, 16] },
  enfants: { reputation: 0.3 },
  amoureux: { reputation: 0.2, majoration: 1.25 },
  inspecteur: { jourMin: 15, certifie: 0.3, amende: 20, amendeCachee: 30, pot: 15, reussite: 0.55, recalcitrant: 0.2 },
  chat: { trouvaille: 4 },
  vent: { papiers: 7, parPapier: 2, duree: 9000, bravo: 0.1 },
};

// L'état sauvegardé : chaque champ a sa valeur par défaut (une vieille partie se complète toute seule)
function etatEvt(G) {
  const d = { dernier: 0, derniereHistoire: 0, vus: {}, compte: 0, journal: [],
    parents: 0, parentsJour: 0, parentsFini: false,
    garrick: 0, garrickJour: 0, garrickPret: null, garrickPaquet: null,
    anniversaire: false, revenant: false, barde: null,
    enfant: null, apprenti: false,
    vantard: null, publicite: null, pigeon: null, rumeur: null };
  if (!G.evtComptoir || typeof G.evtComptoir !== 'object') G.evtComptoir = {};
  const E = G.evtComptoir;
  for (const [k, v] of Object.entries(d)) if (E[k] === undefined) E[k] = v && typeof v === 'object' ? JSON.parse(JSON.stringify(v)) : v;
  return E;
}
if (typeof POSTES !== 'undefined') POSTES.evenements = 'Les petits événements du comptoir';
const majEvt = t => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);
const accordEvt = (G, m, f) => (eJ(G) ? f : m);
function retirerDuStock(G, id, n = 1) { const k = Math.min(n, G.stock[id] || 0); if (k > 0) G.stock[id] -= k; return k; }
// Le calendrier : un an (JOURS_PAR_AN jours de calendrier, sauts de temps compris) depuis l'ouverture ?
function joursDepuisOuverture(G) { return Math.max(0, G.jour - 1) + (G.decalageJours || 0); }

// --- Les personnes des événements (le buste au comptoir et le corps dans la file) ---
// Les figurants (couleurs, costume, carrure) sont dans evenementsComptoirHD.js ; ici, qui ils sont.
const PERSONNES_EVT = {
  parents: { nom: 'Le vieux voyageur', race: 'humain', feminin: false, figurant: 'vieuxVoyageur', vieux: true },
  barde: { nom: "Aëlis Corde-d'Or", race: 'elfe', feminin: true, figurant: 'barde' },
  enfant: { nom: 'Célestin', race: 'hobbit', feminin: false, figurant: 'celestinPetit', tailleBuste: { bas: 46, echelle: 0.82 } },
  enfantGrand: { nom: 'Célestin Petit-Pont', race: 'hobbit', feminin: false, figurant: 'celestin', tailleBuste: { bas: 40 } },
  averse: { nom: 'Mathurin Lavandier', race: 'humain', feminin: false, figurant: 'passantTrempe' },
  troc: { nom: 'Durli Poche-Vide', race: 'nain', feminin: false, figurant: 'troqueur' },
  vantard: { nom: 'Gonzague le Sans-Pareil', race: 'humain', feminin: false, figurant: 'vantard', costume: 'noble' },
  espion: { nom: 'Un client discret', race: 'humain', feminin: false, figurant: 'espion' },
  enfants: { nom: 'Pimprenelle', race: 'hobbit', feminin: true, figurant: 'pimprenelle', tailleBuste: { bas: 46, echelle: 0.84 } },
  amoureux: { nom: 'Brunhilde Fer-Doux', race: 'nain', feminin: true, figurant: 'brunhilde' },
  inspecteur: { nom: 'Maître Ambroise Trébuchet', race: 'humain', feminin: false, figurant: 'inspecteur' },
};
// Ceux qui l'accompagnent, dans la fenêtre (l'amoureux qui attend, les petits camarades, les habitués de la fête)
const COMPAGNONS_EVT = {
  amoureux: [{ nom: 'Elrian', race: 'elfe', feminin: false, figurant: 'elrian' }],
  enfants: [{ nom: 'Toinou', race: 'humain', feminin: false, figurant: 'toinou' }, { nom: 'Gaspard', race: 'hobbit', feminin: false, figurant: 'gaspard' }],
};
const NOMS_EVT = {
  parents: 'Le vieux voyageur', barde: "Aëlis Corde-d'Or — barde de passage", enfant: 'Célestin — un petit hobbit', enfantSoir: 'Célestin — un petit hobbit',
  enfantGrand: 'Célestin Petit-Pont', averse: 'Mathurin Lavandier — trempé jusqu’aux os', troc: 'Durli Poche-Vide — sans le sou',
  vantard: 'Gonzague le Sans-Pareil — « héros »', espion: 'Un client discret', espionDemasque: 'Ursin Plumet — commis du Comptoir Agréé',
  enfants: 'Pimprenelle — dite « la Terrible »', amoureux: 'Brunhilde Fer-Doux', inspecteur: 'Maître Ambroise Trébuchet — poids et mesures',
  garrick: 'Garrick Cœur-de-Chêne',
};
// La personne d'une entrée de la file (pour le buste, la file, la feuille du bureau). null : personne ne s'avance.
function personneEvenement(e, G = window.GAME) {
  if (!e || e.type !== 'evenement') return null;
  if (e.id === 'garrick') return { nom: 'Garrick Cœur-de-Chêne', race: 'humain', feminin: false, figurant: 'mentor' };
  if (e.id === 'anniversaire') return e.hote || { nom: 'Garrick Cœur-de-Chêne', race: 'humain', feminin: false, figurant: 'mentor' };
  if (e.id === 'revenant') return e.defunt || null;
  if (e.id === 'enfantSoir') return PERSONNES_EVT.enfant;
  return PERSONNES_EVT[e.id] || null;
}
// Ce qui dessine son corps en pied (le figurant, s'il en a un)
function corpsEvenement(e, G = window.GAME) {
  const p = personneEvenement(e, G);
  if (!p) return 'humain';
  if (p.figurant && typeof FIGURANTS !== 'undefined' && FIGURANTS[p.figurant]) return p.figurant;
  return p;
}
function expressionEvenement(e) {
  return { parents: 'neutre', garrick: e.etape === 1 ? 'inquiet' : 'neutre', anniversaire: 'content', barde: 'content', revenant: e.reproche ? 'fache' : 'neutre',
    enfant: 'inquiet', enfantSoir: 'inquiet', enfantGrand: 'content', averse: 'inquiet', troc: 'neutre', vantard: 'content', espion: 'neutre',
    enfants: 'content', amoureux: 'content', inspecteur: 'neutre', pigeonRetour: 'neutre' }[e.id] || 'neutre';
}
// Les entrées où personne ne s'avance au comptoir (un pigeon, le vent, une ombre qui sort de la brume)
function evenementSansFile(e) { return !!(e && e.type === 'evenement' && ['pigeon', 'pigeonRetour', 'vent', 'revenant', 'enfantSoir'].includes(e.id)); }
// Les événements gardés secrets sur la feuille du jour (au bureau) : la surprise reste entière
function evenementSecret(e) { return !!(e && (e.type === 'evenement' || e.incident)); }

// --- Les dix-sept événements : quand ils peuvent venir ---
// `histoire` : rare, espacé, ne se rejoue pas ; `incident` : il arrive pendant la visite d'un client (pas une entrée
// à lui) ; `suite` : la suite d'un événement d'avant (elle passe avant le hasard, le jour venu).
const EVENEMENTS_COMPTOIR = {
  // 1. Les yeux de ta mère : trois visites espacées
  parents: { histoire: true, eligible: G => { const E = etatEvt(G); return !E.parentsFini && E.parents < 3 && G.jour >= EVT_COMPTOIR.parents.jourMin && G.jour - (E.parentsJour || -99) >= EVT_COMPTOIR.parents.ecart; },
    creer: G => ({ etape: etatEvt(G).parents + 1 }) },
  // 2. Garrick a un souci : son genou, une vieille dette, une lettre de son passé (selon ton camp)
  garrick: { histoire: true, eligible: G => { const E = etatEvt(G); return E.garrick < 3 && G.jour >= EVT_COMPTOIR.garrick.jourMin && G.jour - (E.garrickJour || -99) >= EVT_COMPTOIR.garrick.ecart && !E.garrickPret; },
    creer: G => ({ etape: etatEvt(G).garrick + 1, camp: coteCamp(G) || null }) },
  // 3. L'anniversaire du comptoir : un an de calendrier après l'ouverture
  anniversaire: { histoire: true, fixe: true, eligible: G => !etatEvt(G).anniversaire && G.jour >= EVT_COMPTOIR.anniversaire.jourMin && joursDepuisOuverture(G) >= JOURS_PAR_AN,
    creer: G => ({ hote: hoteAnniversaire(G), invites: invitesAnniversaire(G) }) },
  // 4. La chanson du barde : tes succès et tes disparus
  barde: { eligible: G => { const E = etatEvt(G), h = G.historique || []; return G.jour >= EVT_COMPTOIR.barde.jourMin && h.length >= 4 && h.some(x => x.issue === 'vivant') && (!E.barde || G.jour - E.barde.jour >= EVT_COMPTOIR.barde.repos); },
    creer: G => ({ couplets: coupletsDuBarde(G) }) },
  // 5. Le revenant des Brumes : pendant la Nuit des Brumes, une fois
  revenant: { histoire: true, fixe: true, eligible: G => { const f = typeof feteDuJour === 'function' && feteDuJour(G); return !!(f && f.id === 'brumes' && (typeof feteOuverte !== 'function' || feteOuverte('brumes')) && !etatEvt(G).revenant && revenantPossible(G)); },
    creer: G => revenantPossible(G) },
  // 6. L'enfant perdu, qui deviendra l'apprenti : il cherche sa mère (au hasard, une fois), puis il revient, plus grand
  enfant: { eligible: G => !etatEvt(G).enfant && G.jour >= EVT_COMPTOIR.enfant.jourMin },
  enfantGrand: { histoire: true, suite: true, eligible: G => { const e = etatEvt(G).enfant; return !!(e && e.etat === 'recueilli' && G.jour >= e.retour); } },
  // 7. L'averse : il pleut, un passant s'abrite sous l'auvent
  averse: { eligible: G => typeof meteoDu !== 'function' || ['pluie', 'orage'].includes(meteoDu(G)) },
  // 8. Le pickpocket : pendant qu'un client parle
  pickpocket: { incident: true, eligible: (G, c) => G.jour >= EVT_COMPTOIR.pickpocket.jourMin && G.argent >= EVT_COMPTOIR.argentPertes && clientsPourIncident(c.file).length > 0 },
  // 9. Le troc
  troc: { eligible: G => G.tresors.length < placesAtelier(G) },
  // 10. Le vantard
  vantard: { eligible: G => { const v = etatEvt(G).vantard; return G.jour >= 10 && (!v || (v.fini && G.jour - v.jour >= 60)); } },
  // 11. L'espion du paon (le comptoir d'à côté doit être ouvert)
  espion: { eligible: G => typeof rivalOuvert === 'function' && rivalOuvert(G) },
  // 12. Le pigeon blessé, et son retour
  pigeon: { eligible: G => { const p = etatEvt(G).pigeon; return !p || (p.revenu && G.jour - p.jour >= 60); } },
  pigeonRetour: { suite: true, eligible: G => { const p = etatEvt(G).pigeon; return !!(p && p.soigne && !p.revenu && G.jour >= p.retour); } },
  // 13. Les enfants qui jouent aux aventuriers
  enfants: { eligible: () => true },
  // 14. Les amoureux
  amoureux: { eligible: () => true },
  // 15. L'inspecteur des poids et mesures
  inspecteur: { eligible: G => G.jour >= EVT_COMPTOIR.inspecteur.jourMin && G.argent >= EVT_COMPTOIR.argentPertes },
  // 16. Le chat (s'il est adopté) : il pose quelque chose devant un client
  chat: { incident: true, eligible: (G, c) => typeof chatAdopte === 'function' && chatAdopte(G) && clientsPourIncident(c.file).length > 0 },
  // 17. Le coup de vent
  vent: { eligible: G => G.jour >= 10 && G.argent >= EVT_COMPTOIR.argentPertes },
};
const SUITES_EVT = ['enfantGrand', 'pigeonRetour'];
const HISTOIRE_EVT = ['garrick', 'parents'];
const HASARD_EVT = ['barde', 'enfant', 'averse', 'pickpocket', 'troc', 'vantard', 'espion', 'pigeon', 'enfants', 'amoureux', 'inspecteur', 'chat', 'vent'];

function clientsPourIncident(file = []) {
  return file.filter(e => e && e.type === 'client' && !e.incident && !e.vole && e.voyageur && !e.voyageur.recherche && !e.voyageur.prestige && !e.reporte);
}

// Le tirage du matin, à l'ouverture (sous la graine du jour : recharger ne le change pas). Appelé à la fin de
// formerFileDuJour. `forcer` : un id (le banc d'essai, pour capturer un événement précis).
function evenementDuJour(G, file = G.file, forcer = null) {
  const E = etatEvt(G);
  if (!forcer) {
    if (G.jour < EVT_COMPTOIR.jourMin || G.tuto || (typeof jourZero === 'function' && jourZero(G))) return null;
    if (E.dernier && G.jour - E.dernier < EVT_COMPTOIR.ecart) return null;
  }
  const ctx = { file };
  const ok = id => { try { return !!EVENEMENTS_COMPTOIR[id].eligible(G, ctx); } catch (e) { return false; } };
  let id = forcer;
  if (!id) id = ['anniversaire', 'revenant'].find(ok);
  if (!id) id = SUITES_EVT.find(i => ok(i) && (!EVENEMENTS_COMPTOIR[i].histoire || G.jour - (E.derniereHistoire || -99) >= EVT_COMPTOIR.ecartHistoire));
  if (!id && G.jour - (E.derniereHistoire || -99) >= EVT_COMPTOIR.ecartHistoire && Math.random() < EVT_COMPTOIR.chanceHistoire) id = HISTOIRE_EVT.find(ok);
  if (!id && Math.random() < EVT_COMPTOIR.chance) {
    const libres = HASARD_EVT.filter(i => ok(i) && (E.vus[i] === undefined || G.jour - E.vus[i] >= EVT_COMPTOIR.repos));
    // (ceux qu'on n'a jamais vus passent un peu plus souvent ; le vent, plus souvent les jours de grand vent)
    const poids = libres.map(i => (E.vus[i] === undefined ? 2 : 1) * (i === 'vent' && typeof meteoDu === 'function' && meteoDu(G) === 'vent' ? 3 : 1));
    let r = Math.random() * poids.reduce((a, b) => a + b, 0);
    for (let k = 0; k < libres.length && !id; k++) { r -= poids[k]; if (r <= 0) id = libres[k]; }
  }
  if (!id || !EVENEMENTS_COMPTOIR[id]) return null;
  return placerEvenement(G, id, file);
}
// L'entrée se glisse dans la file : après les retours de mission, avant la Faucheuse et le crieur.
// Un incident se colle à un client (jamais le tout premier, s'il y en a d'autres).
function placerEvenement(G, id, file) {
  const d = EVENEMENTS_COMPTOIR[id], E = etatEvt(G);
  let infos = {};
  try { infos = d.creer ? d.creer(G) || {} : {}; } catch (err) { return null; }
  const entree = { type: 'evenement', id, jour: G.jour, ...infos };
  if (d.incident) {
    const clients = clientsPourIncident(file);
    if (!clients.length) return null;
    const c = clients[clients.length > 1 ? 1 + Math.floor(Math.random() * (clients.length - 1)) : 0];
    c.incident = { id, jour: G.jour, ...infos };
  } else {
    const fin = file.findIndex(e => e.type === 'faucheuse' || e.type === 'crieur'), max = fin >= 0 ? fin : file.length;
    let min = 0; while (min < max && file[min].type === 'retour') min++;
    // (pas en tout premier quand des clients attendent : on ouvre d'abord le comptoir)
    if (min === 0 && max > 1) min = 1;
    file.splice(Math.min(max, min + Math.floor(Math.random() * (max - min + 1))), 0, entree);
  }
  E.dernier = G.jour; E.vus[id] = G.jour; E.compte = (E.compte || 0) + 1;
  if (d.histoire) E.derniereHistoire = G.jour;
  E.journal = [...(E.journal || []), { jour: G.jour, id }].slice(-40);
  return entree;
}

// --- 1. Les yeux de ta mère ---
function evtParents(G, e) {
  const E = etatEvt(G);
  E.parents = Math.max(E.parents, e.etape || 1); E.parentsJour = G.jour;
  if (E.parents >= 3) { E.parentsFini = G.jour; E.berceuse = true; }   // (la berceuse de ta mère, qu'il te laisse)
  return { etape: E.parents, mendiantLaDit: (G.mendiant || 0) >= (typeof MENDIANT_PALIERS !== 'undefined' ? MENDIANT_PALIERS.yeux : 60), medaille: !!G.medailleParents };
}

// --- 2. Garrick a un souci ---
// étape 1, le genou : soigner (un bandage, ou une potion, ou une compresse) ou l'envoyer chez l'apothicaire
// étape 2, la dette : (lumière, entre-deux) lui prêter de quoi payer l'usurier ; (ombre) garder un paquet des Bannis
// étape 3, la lettre : (lumière) la brûler sans la lire, ou la lire ; (ombre, entre-deux) la lire avec lui
function choixGarrick(G, e) {
  if (e.etape === 1) return ['soigner', 'apothicaire'];
  if (e.etape === 2) return e.camp === 'mal' ? ['paquet', 'refuser'] : ['preter', 'refuser'];
  return e.camp === 'bien' ? ['bruler', 'lire'] : ['lire', 'garder'];
}
function evtGarrick(G, e, choix) {
  const E = etatEvt(G), C = EVT_COMPTOIR.garrick, r = { choix };
  E.garrick = Math.max(E.garrick, e.etape); E.garrickJour = G.jour;
  if (choix === 'soigner') r.soin = retirerDuStock(G, 'bandage') ? 'bandage' : retirerDuStock(G, 'potion') ? 'potion' : 'compresse';
  if (choix === 'preter') {
    if (!peutPayer(G, C.pret)) { r.pasAssez = true; return r; }
    payer(G, C.pret, 'evenements'); E.garrickPret = { jour: G.jour + C.delai, montant: C.rembourse };
  }
  if (choix === 'paquet') { E.garrickPaquet = { jour: G.jour + 1, montant: C.paquet }; pencher(G, 'commande', { qui: 'Garrick Cœur-de-Chêne' }); }
  return r;
}

// --- 3. L'anniversaire du comptoir ---
// L'hôte de la fête : ton meilleur habitué encore en vie (sinon Garrick), et deux ou trois autres dans la fenêtre
function habituesVivants(G) {
  const vus = new Set();
  return (G.habitues || []).filter(h => h && h.nom && !(G.personnes[h.nom] && G.personnes[h.nom].mort) && !vus.has(h.nom) && vus.add(h.nom))
    .sort((a, b) => (G.relations[b.nom] || 0) - (G.relations[a.nom] || 0));
}
function hoteAnniversaire(G) {
  const h = habituesVivants(G)[0];
  return h ? { nom: h.nom, race: h.race, feminin: !!h.feminin, niveau: h.niveau } : { nom: 'Garrick Cœur-de-Chêne', race: 'humain', feminin: false, figurant: 'mentor' };
}
function invitesAnniversaire(G) {
  return habituesVivants(G).slice(1, 4).map(h => ({ nom: h.nom, race: h.race, feminin: !!h.feminin, niveau: h.niveau }));
}
function cadeauAnniversaire(G) { return EVT_COMPTOIR.anniversaire.cadeaux.find(c => G.reputation >= c.rep); }
function evtAnniversaire(G) {
  const E = etatEvt(G), c = cadeauAnniversaire(G);
  if (E.anniversaire) return { ...c, deja: true };
  E.anniversaire = G.jour;
  encaisser(G, c.pieces, 'evenements');
  G.reputation += EVT_COMPTOIR.anniversaire.reputation;
  return { ...c };
}

// --- 4. La chanson du barde : quatre vers, tirés de tes succès et de tes disparus ---
function coupletsDuBarde(G) {
  const h = G.historique || [], vivants = h.filter(x => x.issue === 'vivant'), morts = h.filter(x => x.issue === 'valeureux' || x.issue === 'sans gloire');
  const shop = G.nomShop || 'ton comptoir', nom = n => prenomDe(n);
  const heros = vivants.slice().sort((a, b) => (b.gain || 0) - (a.gain || 0))[0];
  const zoneDe = x => (x && ZONES[x.zone] ? deLieu(ZONES[x.zone].nom) : 'des terres lointaines');
  const vers = [`Chez « ${shop} », on part le cœur léger,`];
  vers.push(heros ? `${nom(heros.nom)} revint ${zoneDe(heros)}, le baluchon chargé ;` : 'Les baluchons sont lourds et les routes sont longues ;');
  vers.push(vivants.length >= 10 ? `${vivants.length} retours vainqueurs, et la rue qui les fête,` : `Ils reviennent en riant, la boue jusqu'à la tête,`);
  vers.push(morts.length ? `Mais ${nom(morts[0].nom)} dort là-bas : qu'on lui garde sa fête.` : `Et personne, jamais, n'est resté sur la route.`);
  return vers;
}
function evtBarde(G, e, choix) {
  const E = etatEvt(G), C = EVT_COMPTOIR.barde;
  const paye = choix === 'payer' && peutPayer(G, C.prix);
  if (paye) { payer(G, C.prix, 'evenements'); G.reputation += C.reputation; }
  else G.reputation = Math.max(0, G.reputation - C.moquerie);
  E.barde = { jour: G.jour, couplets: e.couplets || coupletsDuBarde(G), flatteuse: paye };
  return { paye };
}
// Au marché, pendant trois semaines : deux passants qui se croisent la fredonnent (MarchePlace, causeries)
function causerieChanson(G) {
  const b = G && G.evtComptoir && G.evtComptoir.barde;
  if (!b || G.jour - b.jour > EVT_COMPTOIR.barde.auMarche || G.jour === b.jour || Math.random() > 0.4) return null;
  const vers = b.couplets[1 + Math.floor(Math.random() * (b.couplets.length - 1))];
  return [`♪ « ${vers} » ♪`, b.flatteuse ? 'La chanson de la barde ! Tout le marché la fredonne.' : 'Cette chanson se moque un peu du comptoir, non ?'];
}

// --- 5. Le revenant des Brumes ---
// Un mort par ta faute (piégé, envoyé exprès, ou parti avec un baluchon trop maigre) revient en ombre ; sinon un mort
// valeureux bien équipé (il te dit que ce n'était pas ta faute) ; sinon un voyageur que tu as sauvé, enveloppé de brume.
function revenantPossible(G) {
  const h = (G.historique || []).slice(0, 80), mort = x => x.issue === 'valeureux' || x.issue === 'sans gloire';
  const faute = h.find(x => mort(x) && (x.voulu || (x.chance !== undefined && x.chance < 0.45)));
  const brave = h.find(x => mort(x) && !x.voulu && x.chance >= 0.45);
  const sauve = h.find(x => x.issue === 'vivant' && x.chance >= 0.8 && !(G.personnes[x.nom] && G.personnes[x.nom].mort));
  const x = faute || brave || sauve;
  if (!x) return null;
  return { defunt: { nom: x.nom, race: x.race, feminin: !!x.feminin }, reproche: !!faute, vivant: !faute && !brave, voulu: !!(faute && faute.voulu), zone: x.zone };
}
function evtRevenant(G, e, choix) {
  const E = etatEvt(G);
  E.revenant = G.jour;
  const r = { choix };
  if (choix === 'pardon') { G.reputation += 0.2; r.apaise = true; }
  if (choix === 'merci' && !e.reproche) { encaisser(G, EVT_COMPTOIR.revenant.piece, 'evenements'); r.piece = EVT_COMPTOIR.revenant.piece; }
  return r;
}

// --- 6. L'enfant perdu, puis l'apprenti ---
function evtEnfant(G, e, choix) {
  const E = etatEvt(G);
  if (choix === 'garder') E.enfant = { jour: G.jour, etat: 'garde' };
  else E.enfant = { jour: G.jour, etat: 'garde_confie' };   // (confié à la garde : on ne le reverra pas)
  return { choix };
}
// Le soir, personne n'est venu : c'est un enfant des rues, comme tu l'étais. `recueillir` : un repas (une ration) et un coin.
function evtEnfantSoir(G, e, choix) {
  const E = etatEvt(G), C = EVT_COMPTOIR.enfant;
  if (!E.enfant) E.enfant = { jour: G.jour };
  if (choix === 'recueillir') {
    const ration = retirerDuStock(G, 'ration') > 0;
    E.enfant = { ...E.enfant, etat: 'recueilli', retour: G.jour + hasard(C.retour[0], C.retour[1]), ration, orphelinat: typeof orphelinatOuvert === 'function' && orphelinatOuvert(G) };
    return { ration, orphelinat: E.enfant.orphelinat };
  }
  E.enfant = { ...E.enfant, etat: 'parti' };
  return {};
}
function evtEnfantGrand(G) {
  const E = etatEvt(G);
  E.enfant = { ...(E.enfant || {}), etat: 'apprenti', apprentiJour: G.jour };
  E.apprenti = true;
  return {};
}
// L'employé de l'atelier qu'il devient (EMPLOYES, data.js) : on ne peut l'embaucher qu'une fois revenu
Object.assign(EMPLOYES, {
  celestin: { nom: 'Célestin Petit-Pont', race: 'hobbit', salaire: 3, rapide: ['vetement'], evenement: true,
    description: "Un ancien gamin des rues : il a appris à repriser ses propres guenilles sous le pont. Un jour de moins sur les vêtements.",
    atout: 'Un jour de moins : vêtements · le moins cher' },
});
function employeDisponible(G, id) { return !EMPLOYES[id] || !EMPLOYES[id].evenement || (G.employes || []).includes(id) || !!(G.evtComptoir && G.evtComptoir.apprenti); }

// --- 7. L'averse : une tisane, et une rumeur (une contrée, un prix, un danger) ---
function rumeurAverse(G) {
  const E = etatEvt(G);
  // ce qui se prépare dans les contrées (les événements du calendrier), sinon une affaire au marché demain
  const avenir = (G.evenements || []).find(x => x.debut > G.jour && typeof EVENEMENTS !== 'undefined' && EVENEMENTS[x.id]) || evenementsActifs(G).find(x => typeof EVENEMENTS !== 'undefined' && EVENEMENTS[x.id] && EVENEMENTS[x.id].type !== 'prix');
  if (avenir) {
    const d = EVENEMENTS[avenir.id], dans = avenir.debut - G.jour;
    return { genre: d.type === 'danger' ? 'danger' : d.type === 'butin' ? 'contree' : 'prix', texte: dans > 0 ? `${d.nouvelle.replace(/ !$/, '.')} D'ici ${dans} jour${dans > 1 ? 's' : ''}, à ce qu'on dit.` : d.nouvelle };
  }
  const cles = Object.keys(MARCHANDS).filter(k => MARCHANDS[k].toujours && MARCHANDS[k].toujours.length), cle = auHasard(cles), m = MARCHANDS[cle];
  const id = auHasard(m.toujours);
  E.rumeur = { jour: G.jour + 1, cle, id };
  const nom = typeof nomRoyal === 'function' ? nomRoyal(id, 2) : nomObjet(id).toLowerCase() + 's';
  return { genre: 'prix', texte: `demain matin, ${m.nom} bradera des ${nom} : on lui en a trop livré.` };
}
function evtAverse(G, e, choix) {
  if (choix !== 'tisane') return {};
  return { rumeur: rumeurAverse(G) };
}

// --- 8. Le pickpocket ---
function evtPickpocket(G, attrape) {
  if (attrape) return { perte: 0 };
  const C = EVT_COMPTOIR.pickpocket, perte = Math.min(Math.floor(G.argent), hasard(C.perte[0], C.perte[1]));
  if (perte > 0) payer(G, perte, 'evenements');
  return { perte };
}

// --- 9. Le troc : un objet étrange contre un baluchon de route ---
const OBJETS_TROC = [
  { nom: 'Boussole qui hésite', categorie: 'artefact', valeur: 46, dit: "Elle montre le nord. Enfin, presque. Elle réfléchit d'abord." },
  { nom: 'Œuf de pierre tiède', categorie: 'artefact', valeur: 38, dit: "Il est toujours tiède. Même en hiver. Je n'ai jamais osé le casser." },
  { nom: 'Clé sans serrure', categorie: 'bijou', valeur: 30, dit: "Elle ouvre quelque chose, c'est sûr. Mais quoi ? Ça, la clé ne le dit pas." },
  { nom: 'Fiole de lumière du soir', categorie: 'artefact', valeur: 52, dit: "J'ai mis un coucher de soleil dedans. Il luit encore un peu, la nuit." },
  { nom: 'Chope naine à double fond', categorie: 'arme', valeur: 24, dit: "Une chope de mon grand-père. Le fond se dévisse. Je ne dirai pas pourquoi." },
];
const BALUCHON_TROC = ['ration', 'ration', 'gourde', 'torche'];
function objetDuTroc(G, e) { return OBJETS_TROC[(e && e.objet !== undefined ? e.objet : 0) % OBJETS_TROC.length]; }
EVENEMENTS_COMPTOIR.troc.creer = () => ({ objet: Math.floor(Math.random() * OBJETS_TROC.length), etat: Math.random() < 0.5 ? 1 : 2 });
function peutTroquer(G) { return G.tresors.length < placesAtelier(G) && BALUCHON_TROC.some(id => (G.stock[id] || 0) > 0); }
function evtTroc(G, e, choix) {
  if (choix !== 'accepter') return {};
  if (!peutTroquer(G)) return { impossible: true };
  const donnes = {};
  for (const id of BALUCHON_TROC) if (retirerDuStock(G, id)) donnes[id] = (donnes[id] || 0) + 1;
  const o = objetDuTroc(G, e), C = EVT_COMPTOIR.troc;
  const t = { id: G.prochainId++, nom: o.nom, categorie: o.categorie, valeurBase: Math.max(C.valeur[0], Math.min(C.valeur[1], Math.round(o.valeur * (0.85 + Math.random() * 0.3)))), etat: e.etat || 1, etatInitial: e.etat || 1, reparation: null, prixAchat: 0, jourAchat: G.jour, troc: true };
  G.tresors.push(t);
  return { donnes, tresor: t };
}

// --- 10. Le vantard : un baluchon gratuit « pour la gloire » ---
const BALUCHON_VANTARD = ['ration', 'gourde', 'torche'];
function evtVantard(G, e, choix) {
  const E = etatEvt(G), C = EVT_COMPTOIR.vantard;
  if (choix !== 'donner') { E.vantard = { jour: G.jour, donne: false, fini: true }; return {}; }
  const donnes = {};
  for (const id of BALUCHON_VANTARD) if (retirerDuStock(G, id)) donnes[id] = 1;
  E.vantard = { jour: G.jour, donne: true, retour: G.jour + hasard(C.retour[0], C.retour[1]), vivant: Math.random() < C.vivant, fini: false };
  return { donnes };
}
// Le bonus de clients de sa publicité (prevision, regles.js)
function clientsEvenementsComptoir(G, jour = G.jour) {
  const p = G.evtComptoir && G.evtComptoir.publicite;
  return p && jour >= p.debut && jour <= p.fin ? EVT_COMPTOIR.vantard.clients : 0;
}

// --- 11. L'espion du paon ---
function evtEspion(G, e, choix) {
  const r = typeof rivalDe === 'function' ? rivalDe(G) : null;
  if (!r) return {};
  if (choix === 'demasquer') { r.vols = (r.vols || 0) - 1; return { demasque: true }; }
  r.vols = (r.vols || 0) + 1;
  return {};
}

// --- 12. Le pigeon blessé ---
function evtPigeon(G, e, choix) {
  const E = etatEvt(G), C = EVT_COMPTOIR.pigeon;
  if (choix !== 'soigner') { E.pigeon = { jour: G.jour, soigne: false, revenu: true }; return {}; }
  const soin = retirerDuStock(G, 'bandage') ? 'bandage' : 'chiffon';
  E.pigeon = { jour: G.jour, soigne: true, soin, retour: G.jour + hasard(C.retour[0], C.retour[1]), revenu: false };
  return { soin };
}
function evtPigeonRetour(G) {
  const E = etatEvt(G), C = EVT_COMPTOIR.pigeon;
  if (!E.pigeon || E.pigeon.revenu) return {};
  E.pigeon.revenu = G.jour;
  // une pièce d'argent ramassée on ne sait où, ou un fil d'or arraché à une tapisserie
  if (Math.random() < 0.4) { G.materiaux.filOr = (G.materiaux.filOr || 0) + 1; return { cadeau: 'filOr' }; }
  const n = hasard(C.pieces[0], C.pieces[1]); encaisser(G, n, 'evenements');
  return { cadeau: 'pieces', pieces: n };
}

// --- 13. Les enfants qui jouent aux aventuriers ---
function evtEnfants(G, e, choix) {
  if (choix !== 'donner') return {};
  const ration = retirerDuStock(G, 'ration') > 0;
  G.reputation += EVT_COMPTOIR.enfants.reputation;
  return { ration };
}

// --- 14. Les amoureux : un cadeau en secret pour l'autre ---
function cadeauPourAmoureux(G) { return Object.keys(G.cadeaux || {}).find(id => G.cadeaux[id] > 0 && CADEAUX[id] && !CADEAUX[id].lot) || null; }
function evtAmoureux(G, e, choix) {
  if (choix === 'cadeau') {
    const id = cadeauPourAmoureux(G);
    if (!id) return { impossible: true };
    G.cadeaux[id]--;
    const prix = Math.round(CADEAUX[id].prix * EVT_COMPTOIR.amoureux.majoration);
    encaisser(G, prix, 'evenements');
    return { cadeau: id, prix };
  }
  if (choix === 'fleur') { G.reputation += EVT_COMPTOIR.amoureux.reputation; return { fleur: true }; }
  return {};
}

// --- 15. L'inspecteur des poids et mesures (gare aux objets du Passeur) ---
function interditsEnReserve(G) { return Object.keys(G.interdits || {}).filter(id => G.interdits[id] > 0 && INTERDITS[id]); }
function choixInspecteur(G) { return interditsEnReserve(G).length ? ['ouvrir', 'cacher', 'soudoyer'] : ['ouvrir', 'refuser']; }
function confisquer(G) { const id = interditsEnReserve(G)[0]; if (id) G.interdits[id]--; return id; }
function evtInspecteur(G, e, choix) {
  const C = EVT_COMPTOIR.inspecteur, caches = interditsEnReserve(G).length > 0;
  if (!caches) {
    if (choix === 'ouvrir') { G.reputation += C.certifie; return { certifie: true }; }
    G.reputation = Math.max(0, G.reputation - C.recalcitrant); return { recalcitrant: true };
  }
  if (choix === 'soudoyer') {
    if (!peutPayer(G, C.pot)) return evtInspecteur(G, e, 'ouvrir');
    payer(G, C.pot, 'evenements'); pencher(G, 'piege'); return { soudoye: true };
  }
  if (choix === 'cacher' && Math.random() < C.reussite) return { cache: true };
  const amende = Math.min(Math.floor(G.argent), choix === 'cacher' ? C.amendeCachee : C.amende);
  if (amende > 0) payer(G, amende, 'evenements');
  return { trouve: true, amende, confisque: confisquer(G), surpris: choix === 'cacher' };
}

// --- 16. Le chat pose quelque chose devant un client ---
EVENEMENTS_COMPTOIR.chat.creer = () => ({ trouvaille: Math.random() < 0.35 ? 'bouton' : Math.random() < 0.5 ? 'plume' : 'souris' });
// Ce qu'en pense le client (selon son peuple) : il rit, il est touché, ou ça le dégoûte
function reactionAuChat(v, trouvaille) {
  const race = v ? v.race : 'humain';
  if (trouvaille === 'souris') return ['elfe', 'vampire', 'magicienne'].includes(race) ? 'degoute' : ['nain', 'orc', 'troll', 'gobelin', 'loupgarou'].includes(race) ? 'rit' : 'touche';
  return race === 'elfe' ? 'touche' : 'rit';
}
function evtChat(G, inc, choix, v) {
  const r = { reaction: reactionAuChat(v, inc.trouvaille) };
  if (typeof changerLien === 'function') changerLien(G, choix === 'feliciter' ? 1 : -1);
  if (v && v.nom && G.relations && r.reaction !== 'degoute' && choix === 'feliciter') r.message = changerRelation(G, v.nom, 1);
  if (inc.trouvaille === 'bouton') { encaisser(G, EVT_COMPTOIR.chat.trouvaille, 'evenements'); r.pieces = EVT_COMPTOIR.chat.trouvaille; }
  return r;
}

// --- 17. Le coup de vent : les papiers rattrapés (ou pas) ---
function evtVent(G, rates) {
  const C = EVT_COMPTOIR.vent, perte = Math.min(Math.floor(G.argent), Math.max(0, rates) * C.parPapier);
  if (perte > 0) payer(G, perte, 'evenements');
  if (rates === 0) G.reputation += C.bravo;
  return { perte };
}

// --- Le matin : ce que les événements d'hier ont laissé (appelé depuis nuit(), regles.js) ---
function matinEvenementsComptoir(G) {
  const E = etatEvt(G), lignes = [];
  if (E.garrickPret && G.jour >= E.garrickPret.jour) {
    encaisser(G, E.garrickPret.montant, 'evenements');
    lignes.push(`Une bourse glissée sous la porte, et un mot : « Avec les intérêts, ha ha ! Merci, petit${eJ(G)}. — G. » (+${E.garrickPret.montant} p.)`);
    E.garrickPret = null;
  }
  if (E.garrickPaquet && G.jour >= E.garrickPaquet.jour) {
    encaisser(G, E.garrickPaquet.montant, 'evenements');
    lignes.push(`Le paquet de Garrick a disparu de sous ton comptoir, sans un bruit. À sa place : ${E.garrickPaquet.montant} pièces et une feuille de chêne.`);
    E.garrickPaquet = null;
  }
  const v = E.vantard;
  if (v && v.donne && !v.fini && G.jour >= v.retour) {
    v.fini = true;
    if (v.vivant) {
      E.publicite = { debut: G.jour, fin: G.jour + EVT_COMPTOIR.vantard.jours - 1 };
      lignes.push("Gonzague le Sans-Pareil est rentré vivant, et il le crie sur tous les toits : « Mon baluchon venait de chez toi ! » On viendra un peu plus au comptoir ces jours-ci.");
    } else {
      G.reputation = Math.max(0, G.reputation - EVT_COMPTOIR.vantard.perte);
      lignes.push("Gonzague le Sans-Pareil n'est jamais revenu. Au marché, on rit de toi : « Un baluchon offert à ce fanfaron ! » Un peu de réputation s'envole.");
    }
  }
  if (E.rumeur && E.rumeur.jour === G.jour) {
    const r = E.rumeur, offre = G.etals && G.etals[r.cle] && G.etals[r.cle][r.id];
    E.rumeur = null;
    if (offre) { offre.prix = Math.max(1, Math.round(offre.prix * 0.65)); offre.qte += 2; lignes.push(`Le passant de l'averse avait raison : ${MARCHANDS[r.cle].nom} brade des ${typeof nomRoyal === 'function' ? nomRoyal(r.id, 2) : nomObjet(r.id).toLowerCase() + 's'} ce matin.`); }
  }
  // (l'enfant gardé au comptoir, et la journée interrompue avant le soir : il a dormi dans l'arrière-boutique)
  if (E.enfant && E.enfant.etat === 'garde' && G.jour > E.enfant.jour) { E.enfant = { ...E.enfant, etat: 'recueilli', retour: E.enfant.jour + EVT_COMPTOIR.enfant.retour[0] }; }
  if (E.parentsFini && E.parentsFini === G.jour - 1) lignes.push("Tu as demandé dans la rue si quelqu'un avait revu le vieux voyageur. Personne ne se souvient de lui. Personne. Comme s'il n'était jamais venu.");
  if (E.pigeon && E.pigeon.soigne && E.pigeon.jour === G.jour - 1) lignes.push("Le pigeon blessé a passé la nuit dans sa caisse, près du poêle. Au matin, il s'est envolé par la fenêtre entrouverte, en tournant deux fois au-dessus de la rue.");
  if (E.enfant && E.enfant.etat === 'recueilli' && E.enfant.jour === G.jour - 1) lignes.push(E.enfant.orphelinat ? "Célestin a dormi à l'orphelinat, avec les autres petits. Ce matin, il t'a fait un signe de la main, de l'autre côté de la rue." : "Célestin a dormi dans l'arrière-boutique, roulé dans une couverture. Au matin, il était parti, mais la vaisselle était faite.");
  return lignes;
}

// --- Le banc de la simulation (sim_coh) : un choix au hasard parmi ceux qui sont possibles ---
function choixPossiblesEvt(G, e) {
  switch (e.id) {
    case 'garrick': return choixGarrick(G, e);
    case 'barde': return ['payer', 'refuser'];
    case 'revenant': return e.reproche ? ['pardon', 'silence'] : ['merci'];
    case 'enfant': return ['garder', 'garde'];
    case 'averse': return ['tisane', 'rien'];
    case 'troc': return ['accepter', 'refuser'];
    case 'vantard': return ['donner', 'refuser'];
    case 'espion': return ['demasquer', 'laisser'];
    case 'pigeon': return ['soigner', 'laisser'];
    case 'enfants': return ['donner', 'refuser'];
    case 'amoureux': return cadeauPourAmoureux(G) ? ['cadeau', 'fleur', 'rien'] : ['fleur', 'rien'];
    case 'inspecteur': return choixInspecteur(G);
    default: return ['ok'];
  }
}
function resoudreEvenementSim(G, e) {
  const c = auHasard(choixPossiblesEvt(G, e));
  switch (e.id) {
    case 'parents': return evtParents(G, e);
    case 'garrick': return evtGarrick(G, e, c);
    case 'anniversaire': return evtAnniversaire(G);
    case 'barde': return evtBarde(G, e, c);
    case 'revenant': return evtRevenant(G, e, c);
    case 'enfant': { const r = evtEnfant(G, e, c); if (c === 'garder') evtEnfantSoir(G, e, Math.random() < 0.8 ? 'recueillir' : 'laisser'); return r; }
    case 'enfantGrand': return evtEnfantGrand(G);
    case 'averse': return evtAverse(G, e, c);
    case 'troc': return evtTroc(G, e, c);
    case 'vantard': return evtVantard(G, e, c);
    case 'espion': return evtEspion(G, e, c);
    case 'pigeon': return evtPigeon(G, e, c);
    case 'pigeonRetour': return evtPigeonRetour(G);
    case 'enfants': return evtEnfants(G, e, c);
    case 'amoureux': return evtAmoureux(G, e, c);
    case 'inspecteur': return evtInspecteur(G, e, c);
    case 'vent': return evtVent(G, Math.floor(Math.random() * 4));
    default: return {};
  }
}
function resoudreIncidentSim(G, entree) {
  const inc = entree.incident; if (!inc || inc.vu) return {};
  inc.vu = true;
  if (inc.id === 'pickpocket') return evtPickpocket(G, Math.random() < 0.6);
  if (inc.id === 'chat') return evtChat(G, inc, Math.random() < 0.7 ? 'feliciter' : 'gronder', entree.voyageur);
  return {};
}

// La balance : deux gestes de plus dans le livre des deux voies
const texteGesteAvantEvt = typeof texteGeste === 'function' ? texteGeste : null;
if (texteGesteAvantEvt) texteGeste = function (e) { if (e && e.cle === 'commande' && e.qui === 'Garrick Cœur-de-Chêne') return 'un paquet gardé pour Garrick'; return texteGesteAvantEvt(e); };
