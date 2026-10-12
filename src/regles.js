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

// La carte des contrées améliore chaque épreuve.
function chanceEpreuve(niveau) {
  const bonus = aDecoration(window.GAME, 'carte') ? 0.04 : 0;
  return Math.min(0.97, CHANCE_EPREUVE[niveau] + bonus);
}

function aDecoration(G, id) {
  return !!G && G.decorations.includes(id);
}

// Probabilité exacte que l'aventurier revienne vivant :
// il meurt s'il échoue autant d'épreuves qu'il a de points de vie.
function chanceDeRetour(voyageur, colis) {
  let proba = [1]; // proba[k] = probabilité d'avoir raté k épreuves
  for (const e of voyageur.epreuves) {
    const p = chanceEpreuve(niveauEpreuve(e, colis, voyageur));
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
    const reussie = Math.random() < chanceEpreuve(niveau);
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

function creerVoyageur(G, { quete, nom, race, feminin, butin, duree, inventaire, blessures = 0 }) {
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
    // Un habitué revenu blessé et jamais soigné repart avec moins de cœurs.
    pv: Math.max(1, q.pv - blessures),
    blessures,
    butin: butin ?? Math.round(hasard(...q.butin) * (1 + 0.3 * enPlus)),
    duree: d,
    queteId: quete,
    quete: q.titre,
    accueil: q.accueil,
    biais: Phaser.Math.FloatBetween(-1, 1), // l'erreur de ton flair sur ce client
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

function nouvellePartie({ feminin = false, apparence = null } = {}) {
  const G = {
    joueur: { feminin, apparence: apparence || apparenceParDefaut(feminin) },
    relations: {},     // nom → points
    paliers: {},       // nom → niveaux déjà atteints (pour ne donner chaque cadeau qu'une fois)
    materiaux: { ...MATERIAUX_DEPART },
    reparations: 0,
    decorations: [],
    depensesFournisseur: 0,
    visites: [],       // familles qui viendront au comptoir : { jour, defunt, parent }
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
  // Deux lettres déjà sur le bureau le premier matin, à accepter ou refuser le soir.
  recevoirLettres(G, 2);
  G.express = offreDuJour(MARCHAND_EXPRESS.multiplicateur, 3, 1, 2);
}

function partir(G, voyageur, colis) {
  const chance = chanceDeRetour(voyageur, colis);
  let message = null;
  if (chance >= 0.75) message = changerRelation(G, voyageur.nom, POINTS_RELATION.colisComplet);
  else if (chance < 0.4) message = changerRelation(G, voyageur.nom, POINTS_RELATION.colisPauvre);
  else rencontrer(G, voyageur.nom);
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
  return message;
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
  // Les amis de Maître Gédéon ont droit à plus d'objets rares.
  const amis = niveauRelation(G, FOURNISSEUR.nom).index >= 5;
  G.offre = offreDuJour(1, amis ? 4 : 3, 2, 5);
  G.offre.fer = { prix: MATERIAUX.fer.prix, qte: hasard(3, 6) };
  G.offre.cuir = { prix: MATERIAUX.cuir.prix, qte: hasard(3, 6) };
}

function refuserLettre(G, annonce) {
  G.annonces = G.annonces.filter(a => a !== annonce);
  G.reputation -= REFUS_LETTRE;
  changerRelation(G, annonce.voyageur.nom, POINTS_RELATION.refusLettre);
}

function refuserClient(G, voyageur) {
  G.reputation -= REFUS_CLIENT;
  return changerRelation(G, voyageur.nom, POINTS_RELATION.refusClient);
}

// --- Relations ---

function rencontrer(G, nom) {
  if (!(nom in G.relations)) G.relations[nom] = 0;
}

function niveauRelation(G, nom) {
  if (!(nom in G.relations)) return { nom: 'Inconnu', couleur: '#6b5a40', butin: 1, index: 3 };
  const pts = G.relations[nom];
  let index = 0;
  NIVEAUX_RELATION.forEach((n, i) => { if (pts >= n.min) index = i; });
  return { ...NIVEAUX_RELATION[index], index };
}

// Change une relation. Renvoie un message si un palier important est franchi
// pour la première fois : un cadeau, ou une vengeance.
function changerRelation(G, nom, delta) {
  rencontrer(G, nom);
  const avant = niveauRelation(G, nom).index;
  G.relations[nom] += delta;
  const apres = niveauRelation(G, nom);
  if (apres.index === avant) return null;
  const deja = G.paliers[nom] = G.paliers[nom] || [];
  if (deja.includes(apres.nom)) return null;
  deja.push(apres.nom);

  if (apres.nom === 'Amis') {
    G.materiaux.fer += 2;
    G.materiaux.cuir += 2;
    return `${nom} te considère comme un ami ! En cadeau : 2 fer et 2 cuir.`;
  }
  if (apres.nom === 'Frères de sang') return `${nom} et toi êtes maintenant frères de sang ! ` + offrirDecoration(G);
  if (apres.nom === 'Pires ennemis') {
    const perdus = [];
    for (let i = 0; i < 3; i++) {
      const dispo = Object.keys(G.stock).filter(id => G.stock[id] > 0);
      if (!dispo.length) break;
      const id = auHasard(dispo);
      G.stock[id]--;
      perdus.push(ITEMS[id].nom);
    }
    return `${nom} est devenu ton pire ennemi... Cette nuit, ta réserve a été saccagée` +
      (perdus.length ? ` (${perdus.join(', ')} perdus).` : '.');
  }
  return null;
}

function offrirDecoration(G) {
  const libres = Object.keys(DECORATIONS).filter(id => !G.decorations.includes(id));
  if (!libres.length) {
    G.argent += 50;
    return 'Il t\'offre une bourse de 50 pièces.';
  }
  const id = auHasard(libres);
  G.decorations.push(id);
  return `Il t'offre une décoration pour ton comptoir : ${DECORATIONS[id].nom}.`;
}

// --- Compétences du joueur ---

// Le flair : au début, tes estimations sont faussées. Elles s'affinent avec l'expérience.
function niveauFlair(G) {
  return Math.min(1, G.experience / 40);
}

function chanceEstimee(G, voyageur, colis) {
  const vraie = chanceDeRetour(voyageur, colis);
  const erreur = voyageur.biais * 0.35 * (1 - niveauFlair(G));
  const estimee = Phaser.Math.Clamp(vraie + erreur, 0.02, 0.98);
  // Tant que le flair n'est pas parfait, l'estimation est arrondie à 10 % près.
  return niveauFlair(G) < 1 ? Math.round(estimee * 10) / 10 : estimee;
}

// L'artisanat : plus tu répares, moins il faut de matériaux.
function niveauArtisanat(G) {
  return Math.floor(G.reparations / 4);
}

function materiauxRequis(G) {
  const enclume = aDecoration(G, 'enclume') ? 1 : 0;
  return Math.max(1, MATERIAUX_PAR_REPARATION - niveauArtisanat(G) - enclume);
}

// Répare l'objet d'un client : coûte des matériaux, le client paie.
// Renvoie un message d'erreur, ou null si tout s'est bien passé.
function reparerObjet(G, voyageur, id) {
  const mat = MATERIAU_DE[id];
  const besoin = materiauxRequis(G);
  if (G.materiaux[mat] < besoin) return `Il te faut ${besoin} ${MATERIAUX[mat].nom.toLowerCase()} pour réparer ça.`;
  G.materiaux[mat] -= besoin;
  voyageur.inventaire[id] = USURE_MAX;
  G.argent += PRIX_REPARATION;
  G.reparations++;
  changerRelation(G, voyageur.nom, POINTS_RELATION.reparation);
  return null;
}

// Le marchandage : la remise de Maître Gédéon dépend de votre relation.
function remiseFournisseur(G) {
  return REMISES[niveauRelation(G, FOURNISSEUR.nom).nom] || 0;
}

function prixFournisseur(G, prix) {
  return Math.max(1, Math.round(prix * (1 - remiseFournisseur(G))));
}

// Chaque achat chez le fournisseur compte pour votre relation.
function depenserChezFournisseur(G, montant) {
  G.argent -= montant;
  const avant = Math.floor(G.depensesFournisseur / DEPENSE_PAR_POINT);
  G.depensesFournisseur += montant;
  const apres = Math.floor(G.depensesFournisseur / DEPENSE_PAR_POINT);
  return apres > avant ? changerRelation(G, FOURNISSEUR.nom, apres - avant) : null;
}

// --- Les familles ---

// Les montants proposés à la famille d'un aventurier mort.
function montantsDedommagement(voyageur) {
  const m = {};
  for (const [cle, d] of Object.entries(DEDOMMAGEMENTS)) m[cle] = Math.max(5, Math.round(voyageur.butin * d.part));
  return m;
}

// Le dédommagement est obligatoire. Il peut faire passer à découvert (et jusqu'à la faillite).
// Selon sa générosité, la réputation remonte un peu, et un proche viendra peut-être reprendre la quête.
function dedommager(G, parti, niveau) {
  if (parti.dedommage) return;
  const v = parti.voyageur;
  const d = DEDOMMAGEMENTS[niveau];
  parti.dedommage = niveau;
  G.argent -= montantsDedommagement(v)[niveau];
  G.reputation += d.reputation;
  if (Math.random() < d.releve) return ajouterVisite(G, v, parti.resultat.valeureux, 'releve');
  const pts = G.relations[v.nom] || 0;
  if (Math.random() < (Math.abs(pts) >= 3 ? 0.6 : 0.3)) {
    ajouterVisite(G, v, parti.resultat.valeureux, intentionFamille(pts, parti.resultat.valeureux, niveau));
  }
}

function ajouterVisite(G, voyageur, valeureux, intention) {
  const pts = G.relations[voyageur.nom] || 0;
  // Un proche du disparu viendra au comptoir dans 1 à 3 jours.
  const prenoms = PRENOMS[voyageur.race];
  const liens = LIENS.filter(l => (l.feminin ? prenoms.f : prenoms.m).length);
  const lien = auHasard(liens);
  const race = voyageur.race === 'magicienne' && !lien.feminin ? 'humain' : voyageur.race;
  const prenom = auHasard(lien.feminin ? PRENOMS[race].f : PRENOMS[race].m);
  const famille = voyageur.nom.split(' ').slice(1).join(' ') || voyageur.nom;
  G.visites.push({
    jour: G.jour + hasard(1, 3),
    defunt: { nom: voyageur.nom, feminin: voyageur.feminin, queteId: voyageur.queteId, points: pts, valeureux },
    parent: { nom: `${prenom} ${famille}`, race, feminin: lien.feminin, lien: lien.nom },
    intention,
  });
}

// Ce que veut le proche (s'il ne vient pas reprendre la quête) : dépend de la relation
// avec le disparu, du dédommagement versé, et d'un peu de hasard.
function intentionFamille(pts, valeureux, niveau) {
  if (pts <= -4) return 'colere';
  if (pts >= 16) return 'hommage';
  const colere = niveau === 'maximum' ? 0 : (valeureux ? 0.25 : 0.45) * (niveau === 'moyen' ? 0.5 : 1);
  return Math.random() < colere ? 'colere' : 'souvenir';
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

// On n'achète qu'avec l'argent qu'on a. Pour plus, il faut passer par la banque.
function peutPayer(G, montant) {
  return G.argent >= montant;
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
    decoration: aDecoration(G, 'trophee') ? 0.7 : 0,
    total: 1 + G.reputation * 0.4 + Math.min(G.experience, 40) / 10 + variete * 0.15 + (aDecoration(G, 'trophee') ? 0.7 : 0),
  };
}

// La fourchette de clients attendus le lendemain.
function prevision(G) {
  const annonces = G.annonces.filter(a => a.jour === G.jour + 1 && a.acceptee).length;
  const base = Math.max(1, Math.floor(attrait(G).total));
  const min = Phaser.Math.Clamp(Math.max(base, annonces), 1, 6);
  return { min, max: min + 3, annonces };
}

// On va dormir : la journée suivante se prépare.
function journeeSuivante(G) {
  const { min, max } = prevision(G);
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
  // Une lettre restée sans réponse le jour venu : l'aventurier est allé ailleurs, et il s'en souviendra.
  for (const a of G.annonces.filter(x => x.jour === G.jour && !x.acceptee)) refuserLettre(G, a);
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
  // Les familles des disparus.
  for (const visite of G.visites.filter(v => v.jour === G.jour)) {
    file.splice(hasard(0, file.length), 0, { type: 'famille', visite });
  }
  G.visites = G.visites.filter(v => v.jour > G.jour);
  G.file = file;
}

// Ce que l'aventurier te reverse vraiment, selon votre relation et la lanterne.
function partDuButin(G, voyageur) {
  const lanterne = aDecoration(G, 'lanterne') ? 1.1 : 1;
  return Math.round(voyageur.butin * niveauRelation(G, voyageur.nom).butin * lanterne);
}

// Appelé à la fin du récit : on encaisse le butin, la réputation et la relation évoluent.
// Renvoie { gain, message }.
function terminerAventure(G, parti) {
  if (parti.termine) return parti.bilan;
  parti.termine = true;
  const r = parti.resultat;
  const v = parti.voyageur;
  let gain = 0;
  let message = null;
  G.habitues = G.habitues.filter(h => h.nom !== v.nom);
  if (r.vivant) {
    gain = partDuButin(G, v);
    G.argent += gain;
    G.reputation++;
    G.journal.retours++;
    message = changerRelation(G, v.nom, POINTS_RELATION.retourVivant);
    const derniere = r.etapes[r.etapes.length - 1];
    G.habitues.push({ nom: v.nom, race: v.race, feminin: v.feminin, inventaire: inventaireApres(parti), blessures: v.pv - derniere.pvApres });
  } else {
    if (!r.valeureux) G.reputation--;
    G.journal.morts++;
    // La famille attend un dédommagement : il est choisi à la fin du carnet.
  }
  parti.bilan = { gain, message };
  return parti.bilan;
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

// Soigner un cœur d'un aventurier revenu blessé : une potion, et il te paie.
// Renvoie un message d'erreur, ou null.
function soigner(G, nom) {
  const h = G.habitues.find(x => x.nom === nom);
  if (!h || !h.blessures) return "Il n'a plus de blessure à soigner.";
  if (G.stock.potion <= 0) return "Tu n'as plus de potion.";
  G.stock.potion--;
  G.argent += PRIX_SOIN;
  h.blessures--;
  changerRelation(G, nom, 1);
  return null;
}

function blessuresDe(G, nom) {
  const h = G.habitues.find(x => x.nom === nom);
  return h ? h.blessures || 0 : 0;
}

// Les prêts proposés : la Main Noire seulement pour le camp du mal.
function pretsProposes(G) {
  return PRETS.filter(p => !p.mal || G.camp === 'mal');
}

// --- Ton personnage ---

function ageJoueur(G) {
  return AGE_DEPART + Math.floor((G.jour - 1) / JOURS_PAR_AN);
}

function stadeJoueur(G) {
  const age = ageJoueur(G);
  return age < 18 ? 'petit' : age < 60 ? 'adulte' : 'ancien';
}

function nomJoueur(G, stade = stadeJoueur(G)) {
  return NOMS_JOUEUR[G.joueur.feminin ? 'fille' : 'garcon'][stade];
}

function enMission(G) {
  return G.partis.filter(p => !p.termine).sort((a, b) => a.retour - b.retour);
}
