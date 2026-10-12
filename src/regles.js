// Règles du jeu : chances de réussite, aventures, journées, prévisions.
// L'état de la partie vit dans window.GAME, partagé entre les scènes.

const hasard = (min, max) => Phaser.Math.Between(min, max);
const auHasard = liste => liste[Math.floor(Math.random() * liste.length)];

// Accorde un texte au genre du voyageur : « blessé{e} » → « blessée ».
function accord(texte, voyageur) {
  return texte.replaceAll('{e}', voyageur.feminin ? 'e' : '');
}

// La commande d'un voyageur : { idObjet: quantité }
function commandeDe(voyageur) {
  const commande = {};
  for (const e of voyageur.epreuves) {
    commande[e.besoin] = (commande[e.besoin] || 0) + e.qte;
  }
  return commande;
}

// « 2 Rations, 1 Corde »
function commandeEnTexte(voyageur) {
  return Object.entries(commandeDe(voyageur)).map(([id, n]) => `${n} ${ITEMS[id].nom}`).join(', ');
}

// Niveau de préparation d'une épreuve selon ce que contient le colis.
function niveauEpreuve(epreuve, colis) {
  const donne = colis[epreuve.besoin] || 0;
  if (donne >= epreuve.qte) return 'complet';
  if (donne > 0) return 'partiel';
  return 'rien';
}

// Probabilité exacte que l'aventurier revienne vivant :
// il meurt s'il échoue autant d'épreuves qu'il a de points de vie.
function chanceDeRetour(voyageur, colis) {
  let proba = [1]; // proba[k] = probabilité d'avoir raté k épreuves
  for (const e of voyageur.epreuves) {
    const p = CHANCE_EPREUVE[niveauEpreuve(e, colis)];
    const suivante = new Array(proba.length + 1).fill(0);
    proba.forEach((pk, k) => {
      suivante[k] += pk * p;
      suivante[k + 1] += pk * (1 - p);
    });
    proba = suivante;
  }
  return proba.slice(0, voyageur.pv).reduce((a, b) => a + b, 0);
}

// Tire au sort le déroulement de l'aventure, épreuve par épreuve.
function simulerAventure(voyageur, colis) {
  let pv = voyageur.pv;
  const etapes = [];
  for (const e of voyageur.epreuves) {
    const niveau = niveauEpreuve(e, colis);
    const reussie = Math.random() < CHANCE_EPREUVE[niveau];
    if (!reussie) pv--;
    etapes.push({ epreuve: e, niveau, reussie, pvApres: pv });
    if (pv <= 0) break;
  }
  const derniere = etapes[etapes.length - 1];
  return {
    etapes,
    vivant: pv > 0,
    valeureux: pv <= 0 && EPREUVES_COMBAT.includes(derniere.epreuve.type),
  };
}

// --- Les voyageurs ---

function creerVoyageur(G, { quete, nom, race, feminin, butin, duree }) {
  const q = QUETES[quete];
  return {
    id: G.prochainId++,
    nom, race, feminin,
    pv: q.pv,
    butin: butin ?? hasard(...q.butin),
    duree: duree ?? hasard(...q.duree),
    quete: q.titre,
    accueil: q.accueil,
    epreuves: q.epreuves,
  };
}

// Les noms des voyageurs annoncés, dans la file ou en mission.
function nomsActifs(G) {
  return [
    ...G.annonces.map(a => a.voyageur.nom),
    ...G.file.filter(e => e.type === 'client').map(e => e.voyageur.nom),
    ...enMission(G).map(p => p.voyageur.nom),
  ];
}

// Un voyageur tiré au hasard, qui ne porte pas le nom d'un voyageur déjà en jeu.
// `aussi` : des voyageurs créés à l'instant, pas encore rangés dans la partie.
function voyageurAuHasard(G, aussi = []) {
  const pris = [...nomsActifs(G), ...aussi.map(v => v.nom)];
  const libres = [];
  for (const [race, noms] of Object.entries(NOMS)) {
    for (const [nom, feminin] of noms) if (!pris.includes(nom)) libres.push({ race, nom, feminin });
  }
  // Une race au hasard d'abord, pour que les races avec beaucoup de noms ne dominent pas.
  const races = [...new Set(libres.map(l => l.race))];
  const race = auHasard(races);
  const choix = races.length ? auHasard(libres.filter(l => l.race === race))
    : { race: 'humain', nom: auHasard(NOMS.humain)[0], feminin: false };
  return creerVoyageur(G, { quete: auHasard(Object.keys(QUETES)), ...choix });
}

// --- La partie ---

function nouvellePartie() {
  const G = {
    jour: 1,
    argent: ARGENT_DEPART,
    argentDebutJour: ARGENT_DEPART,
    stock: { ...STOCK_DEPART },
    reputation: 0,
    experience: 0, // nombre de clients servis depuis le début
    prochainId: 1,
    file: [],      // la queue du jour : { type: 'client' | 'retour' | 'carnet', ... }
    annonces: [],  // voyageurs qui ont écrit pour annoncer leur venue : { voyageur, jour }
    partis: [],    // { voyageur, colis, chance, depart, retour, resultat, termine }
    lettresDuJour: 0,
    journal: { servis: 0, retours: 0, morts: 0 },
  };
  window.GAME = G;
  G.file = JOUR_1.map(v => ({ type: 'client', voyageur: creerVoyageur(G, v) }));
  // Deux lettres déjà sur le bureau le premier matin.
  recevoirLettres(G, 2);
}

function partir(G, voyageur, colis) {
  G.partis.push({
    voyageur,
    colis: { ...colis },
    chance: chanceDeRetour(voyageur, colis),
    depart: G.jour,
    retour: G.jour + voyageur.duree,
    resultat: null,
    termine: false,
  });
  G.experience++;
  G.journal.servis++;
}

// Les lettres annoncent des voyageurs qui viendront dans 2 ou 3 jours.
function recevoirLettres(G, nombre) {
  for (let i = 0; i < nombre; i++) {
    G.annonces.push({ voyageur: voyageurAuHasard(G), jour: G.jour + hasard(2, 3) });
  }
  G.annonces.sort((a, b) => a.jour - b.jour);
}

function lettresDuSoir(G) {
  if (G.lettresDuJour === G.jour) return;
  G.lettresDuJour = G.jour;
  recevoirLettres(G, hasard(0, 2));
}

// Ce qui attire les clients : réputation, expérience, variété du stock.
function attrait(G) {
  const variete = Object.values(G.stock).filter(n => n > 0).length;
  return {
    reputation: G.reputation * 0.4,
    experience: Math.min(G.experience, 40) / 10,
    variete: variete * 0.15,
    total: 1 + G.reputation * 0.4 + Math.min(G.experience, 40) / 10 + variete * 0.15,
  };
}

// La fourchette de clients attendus le lendemain.
function prevision(G) {
  const annonces = G.annonces.filter(a => a.jour === G.jour + 1).length;
  const base = Math.max(1, Math.floor(attrait(G).total));
  const min = Phaser.Math.Clamp(Math.max(base, annonces), 1, 6);
  return { min, max: min + 3, annonces };
}

// On va dormir : la journée suivante se prépare.
function journeeSuivante(G) {
  const { min, max } = prevision(G);
  G.jour++;
  G.argentDebutJour = G.argent;
  G.journal = { servis: 0, retours: 0, morts: 0 };

  // Les clients du jour : ceux qui ont écrit, plus des imprévus.
  const prevus = G.annonces.filter(a => a.jour === G.jour).map(a => a.voyageur);
  G.annonces = G.annonces.filter(a => a.jour !== G.jour);
  const imprevus = Math.max(0, hasard(min, max) - prevus.length);
  const clients = [...prevus.map(v => ({ ...v, prevu: true }))];
  for (let i = 0; i < imprevus; i++) clients.push(voyageurAuHasard(G, clients));
  const file = Phaser.Utils.Array.Shuffle(clients.map(v => ({ type: 'client', voyageur: v })));

  // Les aventuriers dont la quête se termine aujourd'hui reviennent...
  // ... ou c'est un colporteur qui rapporte leur carnet.
  for (const p of G.partis) {
    if (p.termine || p.retour !== G.jour) continue;
    p.resultat = simulerAventure(p.voyageur, p.colis);
    const arrivee = { type: p.resultat.vivant ? 'retour' : 'carnet', parti: p };
    file.splice(hasard(0, file.length), 0, arrivee);
  }
  G.file = file;
}

// Appelé à la fin du récit : on encaisse le butin et la réputation évolue.
function terminerAventure(G, parti) {
  if (parti.termine) return;
  parti.termine = true;
  const r = parti.resultat;
  if (r.vivant) {
    G.argent += parti.voyageur.butin;
    G.reputation++;
    G.journal.retours++;
  } else {
    if (!r.valeureux) G.reputation--;
    G.journal.morts++;
  }
}

function enMission(G) {
  return G.partis.filter(p => !p.termine).sort((a, b) => a.retour - b.retour);
}
