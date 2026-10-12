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

// État d'un objet durable que l'aventurier possède déjà (0 = cassé ou absent).
function etatObjet(voyageur, id) {
  return (voyageur.inventaire && voyageur.inventaire[id]) || 0;
}

// Niveau de préparation d'une épreuve selon le colis...
// ... et les objets que l'aventurier a déjà sur lui.
function niveauEpreuve(epreuve, colis, voyageur) {
  const donne = colis[epreuve.besoin] || 0;
  if (donne >= epreuve.qte) return 'complet';
  if (donne > 0) return 'partiel';
  const etat = etatObjet(voyageur, epreuve.besoin);
  if (etat >= 2) return 'complet';
  if (etat === 1) return 'partiel';
  return 'rien';
}

// Probabilité exacte que l'aventurier revienne vivant :
// il meurt s'il échoue autant d'épreuves qu'il a de points de vie.
function chanceDeRetour(voyageur, colis) {
  let proba = [1]; // proba[k] = probabilité d'avoir raté k épreuves
  for (const e of voyageur.epreuves) {
    const p = CHANCE_EPREUVE[niveauEpreuve(e, colis, voyageur)];
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
    const niveau = niveauEpreuve(e, colis, voyageur);
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

function creerVoyageur(G, { quete, nom, race, feminin, butin, duree, inventaire }) {
  const q = QUETES[quete];
  const d = duree ?? hasard(...q.duree);
  // Plus la quête dure, plus il faut de rations... et plus elle rapporte.
  const enPlus = d - q.duree[0];
  const epreuves = q.epreuves.map(e => ({ ...e }));
  if (enPlus > 0) {
    const vivres = epreuves.find(e => e.besoin === 'ration');
    if (vivres) vivres.qte += enPlus;
    else epreuves.unshift({ ...ETAPE_VIVRES, qte: enPlus });
  }
  return {
    id: G.prochainId++,
    nom, race, feminin,
    pv: q.pv,
    butin: butin ?? Math.round(hasard(...q.butin) * (1 + 0.3 * enPlus)),
    duree: d,
    quete: q.titre,
    accueil: q.accueil,
    epreuves,
    inventaire: { ...(inventaire || {}) },
    habitue: !!inventaire,
  };
}

// Une commande par lettre est plus exigeante : une ou deux épreuves
// demandent un objet de plus. Elle rapporte un peu plus en échange.
function rendreExigeant(v) {
  const consommables = Phaser.Utils.Array.Shuffle(v.epreuves.filter(e => !ITEMS[e.besoin].durable));
  consommables.slice(0, hasard(1, 2)).forEach(e => e.qte++);
  v.butin = Math.round(v.butin * 1.25);
  return v;
}

// Les noms des voyageurs annoncés, dans la file ou en mission.
function nomsActifs(G) {
  return [
    ...G.annonces.map(a => a.voyageur.nom),
    ...G.file.filter(e => e.type === 'client').map(e => e.voyageur.nom),
    ...enMission(G).map(p => p.voyageur.nom),
  ];
}

// Les aventuriers revenus vivants peuvent revenir comme clients, avec leur matériel usé.
function habitueAuHasard(G, pris) {
  const libres = G.habitues.filter(h => !pris.includes(h.nom));
  if (!libres.length || Math.random() > 0.35) return null;
  const h = auHasard(libres);
  return creerVoyageur(G, { quete: auHasard(Object.keys(QUETES)), ...h });
}

// Un voyageur tiré au hasard, qui ne porte pas le nom d'un voyageur déjà en jeu.
// `aussi` : des voyageurs créés à l'instant, pas encore rangés dans la partie.
function voyageurAuHasard(G, aussi = []) {
  const pris = [...nomsActifs(G), ...aussi.map(v => v.nom)];
  const habitue = habitueAuHasard(G, pris);
  if (habitue) return habitue;
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
    capacite: RESERVE_DEPART,
    prets: [],     // { id, preteur, nom, restant, parJour }
    habitues: [],  // aventuriers revenus : { nom, race, feminin, inventaire }
    offre: {},     // ce que vend le fournisseur ce soir : { id: { prix, qte } }
    express: {},   // ce que vend le marchand express aujourd'hui
    faillite: false,
    prochainId: 1,
    file: [],      // la queue du jour : { type: 'client' | 'retour' | 'carnet', ... }
    annonces: [],  // lettres : { voyageur, jour, acceptee }
    partis: [],    // { voyageur, colis, chance, depart, retour, resultat, termine }
    lettresDuJour: 0,
    journal: { servis: 0, retours: 0, morts: 0 },
  };
  window.GAME = G;
  G.file = JOUR_1.map(v => ({ type: 'client', voyageur: creerVoyageur(G, v) }));
  // Deux lettres déjà acceptées sur le bureau le premier matin.
  recevoirLettres(G, 2);
  G.annonces.forEach(a => { a.acceptee = true; });
  G.express = offreDuJour(MARCHAND_EXPRESS.multiplicateur, 3, 1, 2);
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
    const voyageur = rendreExigeant(voyageurAuHasard(G));
    G.annonces.push({ voyageur, jour: G.jour + hasard(2, 3), acceptee: false });
  }
  G.annonces.sort((a, b) => a.jour - b.jour);
}

// Le soir : nouvelles lettres et nouvel assortiment chez le fournisseur.
function preparerSoir(G) {
  if (G.lettresDuJour === G.jour) return;
  G.lettresDuJour = G.jour;
  recevoirLettres(G, hasard(0, 2));
  G.offre = offreDuJour(1, 3, 2, 5);
}

function refuserLettre(G, annonce) {
  G.annonces = G.annonces.filter(a => a !== annonce);
  G.reputation -= REFUS_LETTRE;
}

function refuserClient(G) {
  G.reputation -= REFUS_CLIENT;
}

// Un assortiment : les objets de base toujours là, plus quelques autres au hasard.
// Les prix bougent un peu d'un jour à l'autre.
function offreDuJour(multiplicateur, nbAutres, qteMin, qteMax) {
  const autres = Phaser.Utils.Array.Shuffle(Object.keys(ITEMS).filter(id => !ITEMS[id].base));
  const ids = multiplicateur > 1
    ? Phaser.Utils.Array.Shuffle(Object.keys(ITEMS)).slice(0, hasard(3, 4))
    : [...Object.keys(ITEMS).filter(id => ITEMS[id].base), ...autres.slice(0, hasard(1, nbAutres))];
  const offre = {};
  for (const id of Object.keys(ITEMS)) {
    if (!ids.includes(id)) continue;
    const variation = Phaser.Math.FloatBetween(0.8, 1.25);
    offre[id] = {
      prix: Math.max(1, Math.round(ITEMS[id].prix * multiplicateur * variation)),
      qte: ITEMS[id].base && multiplicateur === 1 ? hasard(6, 10) : hasard(qteMin, qteMax),
    };
  }
  return offre;
}

// --- Argent, réserve, banque ---

function stockTotal(G) {
  return Object.values(G.stock).reduce((a, b) => a + b, 0);
}

// On peut être à découvert, mais pas au-delà du seuil de faillite.
function peutPayer(G, montant) {
  return G.argent - montant > SEUIL_FAILLITE;
}

function agrandissementSuivant(G) {
  return AGRANDISSEMENTS.find(a => a.capacite > G.capacite) || null;
}

function agrandirReserve(G) {
  const a = agrandissementSuivant(G);
  if (!a || !peutPayer(G, a.prix)) return false;
  G.argent -= a.prix;
  G.capacite = a.capacite;
  return true;
}

// Peut-on contracter ce prêt ? Renvoie la raison sinon.
function refusPret(G, pret) {
  if (G.prets.some(p => p.id === pret.id)) return 'Déjà en cours';
  if (G.reputation < pret.reputation) return `Réputation ${pret.reputation} requise`;
  return null;
}

function emprunter(G, pret) {
  if (refusPret(G, pret)) return;
  const du = Math.round(pret.somme * (1 + pret.taux));
  G.argent += pret.somme;
  G.prets.push({ id: pret.id, preteur: pret.preteur, nom: pret.nom, restant: du, parJour: Math.ceil(du / pret.jours) });
}

// Chaque nuit, les échéances des prêts sont prélevées.
function payerEcheances(G) {
  for (const p of G.prets) {
    const montant = Math.min(p.parJour, p.restant);
    G.argent -= montant;
    p.restant -= montant;
  }
  G.prets = G.prets.filter(p => p.restant > 0);
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
  // Les lettres laissées sans réponse sont acceptées.
  G.annonces.forEach(a => { a.acceptee = true; });
  payerEcheances(G);
  if (G.argent <= SEUIL_FAILLITE) {
    G.faillite = true;
    return;
  }
  G.express = offreDuJour(MARCHAND_EXPRESS.multiplicateur, 3, 1, 2);
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
  const v = parti.voyageur;
  G.habitues = G.habitues.filter(h => h.nom !== v.nom);
  if (r.vivant) {
    G.argent += v.butin;
    G.reputation++;
    G.journal.retours++;
    G.habitues.push({ nom: v.nom, race: v.race, feminin: v.feminin, inventaire: inventaireApres(parti) });
  } else {
    if (!r.valeureux) G.reputation--;
    G.journal.morts++;
  }
}

// Après la quête : les objets durables reçus sont neufs, puis chaque épreuve
// où l'objet a servi l'use d'un cran.
function inventaireApres(parti) {
  const inv = { ...parti.voyageur.inventaire };
  for (const [id, n] of Object.entries(parti.colis)) {
    if (ITEMS[id].durable && n > 0) inv[id] = USURE_MAX;
  }
  for (const { epreuve } of parti.resultat.etapes) {
    if (inv[epreuve.besoin] > 0) inv[epreuve.besoin]--;
  }
  return inv;
}

function enMission(G) {
  return G.partis.filter(p => !p.termine).sort((a, b) => a.retour - b.retour);
}
