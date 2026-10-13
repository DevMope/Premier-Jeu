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

// Un objet piégé du colis sert-il à une de ses épreuves ? (Il le tuera en arrivant.)
function piegeFatal(voyageur, pieges) {
  return !!pieges && voyageur.epreuves.some(e => pieges[e.besoin] > 0);
}

// Probabilité exacte que l'aventurier revienne vivant :
// il meurt s'il échoue autant d'épreuves qu'il a de points de vie.
// Avec un objet piégé qui lui servira, il n'a aucune chance.
// Un combat raté peut faire saigner : un cœur de plus perdu, sauf s'il lui reste un bandage en plus.
function chanceDeRetour(voyageur, colis, pieges = null) {
  if (piegeFatal(voyageur, pieges)) return 0;
  const pv = pvAuDepart(voyageur, colis);
  // états : « cœurs perdus, bandages en plus restants » → probabilité
  let etats = new Map([[`0,${bandagesEnPlus(voyageur, colis)}`, 1]]);
  for (const e of voyageur.epreuves) {
    const p = chanceEtape(e, colis, voyageur);
    const combat = EPREUVES_COMBAT.includes(e.type);
    const suite = new Map();
    const ajouter = (perdu, b, q) => { if (perdu < pv && q > 0) suite.set(`${perdu},${b}`, (suite.get(`${perdu},${b}`) || 0) + q); };
    for (const [cle, pk] of etats) {
      const [perdu, b] = cle.split(',').map(Number);
      ajouter(perdu, b, pk * p);
      const rate = pk * (1 - p);
      if (!combat) { ajouter(perdu + 1, b, rate); continue; }
      ajouter(perdu + 1, b, rate * (1 - CHANCE_SAIGNEMENT));
      if (b > 0) ajouter(perdu + 1, b - 1, rate * CHANCE_SAIGNEMENT);
      else ajouter(perdu + 2, b, rate * CHANCE_SAIGNEMENT);
    }
    etats = suite;
  }
  let total = 0;
  for (const q of etats.values()) total += q;
  return total;
}

// --- Le suréquipement ---

// Les objets donnés en plus de la commande : { idObjet: quantité en plus }
function surplus(voyageur, colis) {
  const commande = commandeDe(voyageur);
  const plus = {};
  for (const [id, n] of Object.entries(colis)) {
    const enPlus = n - (commande[id] || 0);
    if (enPlus > 0) plus[id] = enPlus;
  }
  return plus;
}

function totalSurplus(voyageur, colis) {
  return Object.values(surplus(voyageur, colis)).reduce((a, b) => a + b, 0);
}

function tailleSac(voyageur) {
  return SAC[voyageur.race] ?? 3;
}

// Une potion en plus donne un cœur de réserve pendant le voyage (un seul, quel que soit leur nombre).
function coeursEnPlus(voyageur, colis) {
  return Math.min(1, surplus(voyageur, colis).potion || 0);
}

// Les bandages en plus de la commande : chacun arrête un saignement.
function bandagesEnPlus(voyageur, colis) {
  return surplus(voyageur, colis).bandage || 0;
}

function pvAuDepart(voyageur, colis) {
  return voyageur.pv + coeursEnPlus(voyageur, colis);
}

// La chance de réussir une épreuve, avec le bonus des objets en plus qu'elle demande.
// Sans la chance : l'objet donné, les objets en plus, le niveau de l'aventurier, et parfois un
// événement dans sa zone (tempête, brume...).
function chanceEtapeBase(e, colis, voyageur) {
  const enPlus = surplus(voyageur, colis)[e.besoin] || 0;
  const niv = NIVEAUX_AVENTURIER[voyageur.niveau] || NIVEAUX_AVENTURIER.novice;
  const evenement = modifEvenement(window.GAME, 'danger', voyageur.zone);
  return Phaser.Math.Clamp(chanceEpreuve(niveauEpreuve(e, colis, voyageur)) + enPlus * BONUS_SURPLUS + niv.bonus + evenement, 0.05, 0.97);
}

// Avec la chance : une épreuve ratée peut être rattrapée de justesse par son trèfle.
function chanceEtape(e, colis, voyageur) {
  const p = chanceEtapeBase(e, colis, voyageur);
  return Math.min(0.98, p + (1 - p) * trefleDe(window.GAME, voyageur.nom) * SAUVETAGE_PAR_TREFLE);
}

// La chance de rebrousser chemin au lieu de mourir.
function chanceRepli(voyageur) {
  return trefleDe(window.GAME, voyageur.nom) * REPLI_PAR_TREFLE;
}

// La chance qu'il revienne vivant (mission réussie ou ratée). Un objet piégé ne pardonne pas.
function chanceVivant(voyageur, colis, pieges = null) {
  if (piegeFatal(voyageur, pieges)) return 0;
  const r = chanceDeRetour(voyageur, colis);
  return r + (1 - r) * chanceRepli(voyageur);
}

// Tire au sort le déroulement de l'aventure, épreuve par épreuve.
// Un objet piégé lâche à l'épreuve qui en a besoin : elle est fatale.
function simulerAventure(voyageur, colis, pieges = null) {
  const pvDepart = pvAuDepart(voyageur, colis);
  let pv = pvDepart;
  let bandages = bandagesEnPlus(voyageur, colis);
  const etapes = [];
  for (const e of voyageur.epreuves) {
    const niveau = niveauEpreuve(e, colis, voyageur);
    if (pieges && pieges[e.besoin] > 0) {
      const avant = pv;
      pv = 0;
      etapes.push({ epreuve: e, niveau, reussie: false, pvApres: 0, piege: e.besoin, pvAvant: avant });
      break;
    }
    const tirage = Math.random();
    const reussie = tirage < chanceEtape(e, colis, voyageur);
    const sauvee = reussie && tirage >= chanceEtapeBase(e, colis, voyageur);
    if (!reussie && pv === 1 && Math.random() < chanceRepli(voyageur)) {
      // Sa bonne étoile : il sent que la prochaine fois sera la dernière, et rebrousse chemin.
      etapes.push({ epreuve: e, niveau, reussie: false, pvApres: 1, repli: true });
      return { etapes, pvDepart, vivant: true, echec: true, valeureux: false };
    }
    // Un combat raté peut faire saigner : un bandage en plus arrête le sang, sinon un cœur de plus s'en va.
    let saignement = null;
    if (!reussie) {
      pv--;
      if (EPREUVES_COMBAT.includes(e.type) && Math.random() < CHANCE_SAIGNEMENT) {
        if (bandages > 0) { bandages--; saignement = 'bande'; } else if (pv > 0) { pv--; saignement = 'perte'; }
      }
    }
    etapes.push({ epreuve: e, niveau, reussie, sauvee, pvApres: pv, saignement });
    if (pv <= 0) break;
  }
  const derniere = etapes[etapes.length - 1];
  return {
    etapes,
    pvDepart,
    vivant: pv > 0,
    echec: false,
    valeureux: pv <= 0 && EPREUVES_COMBAT.includes(derniere.epreuve.type),
  };
}

// --- Les voyageurs ---

// Un aventurier. Sans `quete`, il vient chercher l'aventure : c'est toi qui choisiras la zone.
// Le niveau d'un nouveau voyageur : surtout des novices au début ; des aguerris, des vétérans
// puis des héros arrivent à mesure que ta réputation grandit et que les jours passent.
// (Les légendes, elles, se forgent : un voyageur progresse par ses succès.)
function niveauAuHasard(G) {
  const r = Math.max(0, G.reputation || 0), j = G.jour || 1;
  const poids = {
    novice: 6,
    aguerri: 0.5 + r * 0.6 + j * 0.12,
    veteran: Math.max(0, r - 3) * 0.45 + Math.max(0, j - 10) * 0.06,
    heros: Math.max(0, r - 8) * 0.3,
  };
  const total = Object.values(poids).reduce((a, b) => a + b, 0);
  let x = Math.random() * total;
  for (const [n, p] of Object.entries(poids)) { x -= p; if (x <= 0) return n; }
  return 'novice';
}

function creerVoyageur(G, { quete = null, nom, race, feminin, butin, duree, inventaire, blessures = 0, niveau, envie, exige = false }) {
  const v = {
    id: G.prochainId++,
    nom, race, feminin,
    niveau: meilleurNiveau(niveau || niveauAuHasard(G), succesDe(G, nom)),
    envie: envie || auHasard(Object.keys(ENVIES)),
    blessures,
    pv: 0, butin: 0, duree: 0,
    queteId: null, zone: null, quete: '', epreuves: [],
    biais: Phaser.Math.FloatBetween(-1, 1), // l'erreur de ton flair sur ce client
    inventaire: { ...(inventaire || {}) },
    habitue: !!inventaire,
    exige, // après une mission ratée, il exige un objet en plus de sa commande
  };
  v.accueil = ENVIES[v.envie];
  if (quete) appliquerQuete(G, v, quete, { butin, duree });
  return v;
}

// La zone d'une quête.
function zoneDeQuete(queteId) {
  return Object.keys(ZONES).find(z => ZONES[z].quetes.includes(queteId)) || 'collines';
}

// Donne une quête à un aventurier : ses épreuves, sa durée, son butin.
function appliquerQuete(G, v, queteId, { butin, duree } = {}) {
  const q = QUETES[queteId];
  const zone = zoneDeQuete(queteId);
  const d = duree ?? hasard(...q.duree);
  // Plus la quête dure, plus il faut de rations... et plus elle rapporte.
  const enPlus = d - q.duree[0];
  const epreuves = q.epreuves.map(e => ({ ...e }));
  if (enPlus > 0) {
    const vivres = epreuves.find(e => e.besoin === 'ration');
    if (vivres) vivres.qte += enPlus;
    else epreuves.unshift({ ...ETAPE_VIVRES, qte: enPlus });
  }
  const niv = NIVEAUX_AVENTURIER[v.niveau];
  // Un habitué revenu blessé et jamais soigné repart avec moins de cœurs.
  v.pv = Math.max(1, q.pv + niv.pv - v.blessures);
  const camp = ZONES[zone].camp ? EFFETS_CAMP[ZONES[zone].camp].butin : 1;
  const evenement = modifEvenement(G, 'butin', zone) || 1;
  v.butin = butin ?? Math.round(hasard(...q.butin) * (1 + 0.3 * enPlus) * BUTIN_PAR_DANGER[ZONES[zone].danger] / BUTIN_PAR_DANGER[1] * niv.butin * camp * evenement);
  v.duree = d;
  v.queteId = queteId;
  v.zone = zone;
  v.quete = q.titre;
  v.accueil = q.accueil;
  v.epreuves = epreuves;
  return v;
}

// Envoyer un aventurier dans une zone : une des quêtes de la zone, au hasard.
function envoyerDans(G, v, zone) {
  return appliquerQuete(G, v, auHasard(ZONES[zone].quetes));
}

// Les zones où l'on peut envoyer quelqu'un : ouvertes par la réputation, ou découvertes.
// Au-delà de 2 étoiles, il faut aussi des retours réussis dans l'étoile d'avant.
// Une zone découverte dans un récit n'a plus besoin de la réputation, mais toujours des retours.
function conditionsZone(G, zone) {
  const z = ZONES[zone];
  // Les contrées de départ restent toujours ouvertes, même si la réputation tombe sous zéro
  const reputation = z.reputation <= 0 || G.reputation >= z.reputation || G.zonesDecouvertes.includes(zone);
  const besoin = RETOURS_POUR_ETOILE[z.danger] || 0;
  const faits = (G.succes && G.succes[z.danger - 1]) || 0;
  return { reputation, besoin, faits, ouverte: reputation && faits >= besoin };
}

function zoneOuverte(G, zone) {
  return conditionsZone(G, zone).ouverte;
}

// Ce voyageur accepte-t-il d'aller là ? Renvoie la raison de son refus, ou null.
function refusZone(G, v, zone) {
  const z = ZONES[zone];
  if (z.camp === 'mal' && v.envie !== 'or') return '« Servir le mal ? Jamais ! Trouve-moi une quête honnête. »';
  if (z.danger >= 5 && ORDRE_NIVEAUX.indexOf(v.niveau) < ORDRE_NIVEAUX.indexOf('heros')) return "« Là-bas ? Il faut être un héros pour s'y risquer. Pas moi, pas encore. »";
  return null;
}

// Les zones ouvertes où ce voyageur accepte d'aller.
function zonesPour(G, v) {
  return zonesOuvertes(G).filter(z => !refusZone(G, v, z));
}

function zonesOuvertes(G) {
  return Object.keys(ZONES).filter(z => zoneOuverte(G, z));
}

// Ce qu'il faut souvent dans une zone (toutes ses quêtes confondues).
function besoinsDeZone(zone) {
  const ids = new Set();
  ZONES[zone].quetes.forEach(q => QUETES[q].epreuves.forEach(e => ids.add(e.besoin)));
  return [...ids];
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
    ...(G.faucheuse && G.faucheuse.mission ? [G.faucheuse.mission.cible.nom] : []),
  ];
}

// Les aventuriers revenus vivants peuvent revenir comme clients, avec leur matériel usé.
function habitueAuHasard(G, pris) {
  // Un blessé en convalescence (mission ratée, pas soigné) ne repart pas tout de suite.
  const libres = G.habitues.filter(h => !pris.includes(h.nom) && !(h.convalescence > G.jour && h.blessures > 0));
  if (!libres.length || Math.random() > 0.35) return null;
  const h = auHasard(libres);
  return creerVoyageur(G, { ...h });
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
  return creerVoyageur(G, { ...choix });
}

// --- La partie ---

function nouvellePartie({ feminin = false, apparence = null, nomShop = NOM_SHOP_DEFAUT } = {}) {
  const G = {
    nomShop,
    joueur: { feminin, apparence: apparence || apparenceParDefaut(feminin) },
    relations: {},     // nom → points
    paliers: {},       // nom → niveaux déjà atteints (pour ne donner chaque cadeau qu'une fois)
    materiaux: { ...MATERIAUX_DEPART },
    reparations: 0,
    decorations: [],
    depenses: {},      // marchand → total dépensé chez lui
    etals: {},         // ce que vend chaque marchand ce matin : { marchand: { id: { prix, qte } } }
    jeux: { des: 0, bonneteau: 0 },
    mendiant: 0,       // total donné au mendiant
    tresors: [],       // objets de valeur à l'atelier : { id, nom, categorie, valeurBase, etat, reparation }
    compta: {},        // jour → { r: recettes, d: dépenses, pret: prêts reçus } par poste
    comptaTotal: { r: {}, d: {}, pret: {} },
    historique: [],    // aventures terminées : { nom, race, quete, depart, retour, issue, gain, chance }
    personnes: {},     // nom → { race, feminin } de tous ceux qu'on a croisés
    zonesDecouvertes: [], // zones révélées par les récits des aventuriers
    employes: [],      // employés de l'atelier (ids de EMPLOYES)
    stats: { refus: 0, lettresAcceptees: 0, lettresRefusees: 0, objets: {}, ventes: 0 },
    nouvellesAtelier: [],
    encheresJour: 0,   // le jour de la dernière vente aux enchères
    visites: [],       // familles qui viendront au comptoir : { jour, defunt, parent }
    jour: 1,
    argent: ARGENT_DEPART,
    argentDebutJour: ARGENT_DEPART,
    // Tous les objets du jeu, à 0 sauf le stock de départ.
    stock: Object.fromEntries(Object.keys(ITEMS).map(id => [id, STOCK_DEPART[id] || 0])),
    reputation: 0,
    succes: {},        // retours réussis par nombre d'étoiles (pour ouvrir les zones suivantes)
    cadeaux: {},       // les cadeaux achetés au Bazar, pas encore offerts
    evenements: [],    // { id, debut, fin }
    courrier: [],      // les lettres d'information (événements) : { jour, texte }
    gazette: null,     // les nouvelles du jour, criées au marché
    rumeur: null,      // { jour } : moins de clients ce jour-là
    armure: [],        // les pièces de l'Armure du Dernier Rempart déjà reçues
    nouvellesPieces: [], // celles que le messager apporte ce matin : { piece, zone }
    mal: 0,            // la jauge du mal : les âmes que tu as offertes exprès
    pieges: {},        // les objets piégés cachés sous le comptoir
    faucheuse: { faveur: 0, morts: 0, visites: 0, cadeau: false, mission: null, sabotages: 0 },
    experience: 0, // nombre de clients servis depuis le début
    capacite: RESERVE_DEPART,
    ameliorations: { comptoir: 0, coffre: 0, chambre: 0, eclairage: 0, atelier: 0 },
    travaux: [],
    travauxFinis: [],
    prets: [],     // { id, preteur, nom, restant, parJour }
    habitues: [],  // aventuriers revenus : { nom, race, feminin, inventaire }
    offre: {},     // ce que vend le fournisseur ce soir : { id: { prix, qte } }
    express: {},   // ce que vend le marchand express aujourd'hui
    faillite: false,
    prochainId: 1,
    file: [],      // la queue du jour : { type: 'client' | 'retour' | 'famille' | 'faucheuse' | 'carnet', ... }
    annonces: [],  // lettres : { voyageur, jour, acceptee }
    partis: [],    // { voyageur, colis, chance, depart, retour, resultat, termine }
    lettresDuJour: 0,
    journal: { servis: 0, retours: 0, morts: 0, echecs: 0 },
  };
  window.GAME = G;
  G.file = JOUR_1.map(v => ({ type: 'client', voyageur: creerVoyageur(G, v) }));
  // Deux lettres déjà sur le bureau le premier matin, à accepter ou refuser le soir.
  recevoirLettres(G, 2);
  G.express = offreDuJour(MARCHAND_EXPRESS.multiplicateur, 3, 1, 2);
  G.expressMateriaux = materiauxExpress();
  G.zonesConnues = zonesOuvertes(G); // les zones ouvertes au départ ne donnent pas de pièce
}

// `pieges` : les objets piégés glissés dans le colis (ils comptent aussi dans `colis`).
// L'aventurier, lui, ne voit que le colis : sa réaction et votre relation n'en tiennent pas compte.
function partir(G, voyageur, colis, pieges = {}) {
  const chance = chanceDeRetour(voyageur, colis);
  const reelle = chanceDeRetour(voyageur, colis, pieges);
  const relationDepart = niveauRelation(G, voyageur.nom).index;
  let message = null;
  if (chance >= 0.75) message = changerRelation(G, voyageur.nom, POINTS_RELATION.colisComplet);
  else if (chance < 0.4) message = changerRelation(G, voyageur.nom, POINTS_RELATION.colisPauvre);
  else rencontrer(G, voyageur.nom);
  const mission = G.faucheuse.mission;
  if (mission && mission.cible.id === voyageur.id) mission.etat = pieges[mission.piege] > 0 ? 'posee' : 'ratee';
  // Il demandait des comptes : sans objet en plus, il le prend très mal.
  if (voyageur.exige) {
    const h = G.habitues.find(x => x.nom === voyageur.nom);
    if (h) h.exige = false;
    if (totalSurplus(voyageur, colis) === 0) {
      const m = changerRelation(G, voyageur.nom, -3);
      message = `« Pas le moindre geste, après ce que j'ai vécu ? Je m'en souviendrai. »${m ? ' ' + m : ''}`;
    }
  }
  G.partis.push({
    voyageur,
    colis: { ...colis },
    pieges: { ...pieges },
    voulu: mortVoulue(G, voyageur, colis, pieges, chanceVivant(voyageur, colis, pieges)),
    chance: reelle,
    relationDepart,
    depart: G.jour,
    retour: G.jour + voyageur.duree,
    resultat: null,
    termine: false,
  });
  G.experience++;
  G.journal.servis++;
  connaitre(G, voyageur);
  for (const [id, n] of Object.entries(colis)) G.stats.objets[id] = (G.stats.objets[id] || 0) + n;
  return message;
}

// Les lettres annoncent des voyageurs qui viendront dans 2 ou 3 jours.
function recevoirLettres(G, nombre) {
  for (let i = 0; i < nombre; i++) {
    // Celui qui écrit sait déjà où il veut aller (une zone ouverte).
    const voyageur = voyageurAuHasard(G);
    envoyerDans(G, voyageur, auHasard(zonesPour(G, voyageur).filter(z => ZONES[z].camp !== 'mal')));
    rendreExigeant(voyageur);
    G.annonces.push({ voyageur, jour: G.jour + hasard(2, 3), acceptee: false });
  }
  G.annonces.sort((a, b) => a.jour - b.jour);
}

// Le soir : nouvelles lettres et nouvel assortiment chez le fournisseur.
function preparerSoir(G) {
  if (G.lettresDuJour === G.jour) return;
  G.lettresDuJour = G.jour;
  // Les lettres de commande sont rares.
  recevoirLettres(G, Math.random() < CHANCE_LETTRE ? 1 : 0);
}

// Ce qu'il faudrait pour satisfaire toutes les commandes acceptées, à partir d'un jour donné
// (et jusqu'à un jour donné si on veut). Renvoie { idObjet: quantité }.
function totalCommandes(G, depuis = G.jour, jusqua = Infinity) {
  const total = {};
  for (const a of G.annonces) {
    if (!a.acceptee || a.jour < depuis || a.jour > jusqua) continue;
    for (const [id, n] of Object.entries(commandeDe(a.voyageur))) total[id] = (total[id] || 0) + n;
  }
  return total;
}

// --- Le Marché des Mastres ---

function prixDeBase(id) {
  return (ITEMS[id] || MATERIAUX[id]).prix;
}

function nomObjet(id) {
  return (ITEMS[id] || MATERIAUX[id]).nom;
}

// Ce que vend chaque marchand ce matin. Les prix varient d'un étal à l'autre :
// ça vaut le coup de comparer. Les amis d'un marchand ont droit à plus de quantité.
// Une marchandise ne peut pas manquer deux jours de suite : ce qui était absent ou épuisé
// hier chez un marchand revient forcément aujourd'hui.
function etalsDuJour(G) {
  const etals = {};
  const hier = G.etals || {};
  for (const [cle, m] of Object.entries(MARCHANDS)) {
    const amis = niveauRelation(G, m.nom).index >= 5 ? 2 : 0;
    const rares = m.objets.filter(id => !m.toujours.includes(id));
    const manquaient = rares.filter(id => !hier[cle] || !hier[cle][id] || hier[cle][id].qte <= 0);
    const presents = rares.filter(id => manquaient.includes(id) || Math.random() < 0.6);
    if (rares.length && !presents.length) presents.push(auHasard(rares));
    etals[cle] = {};
    for (const id of m.objets) {
      const toujours = m.toujours.includes(id);
      if (!toujours && !presents.includes(id)) continue;
      etals[cle][id] = {
        prix: Math.max(1, Math.round(prixDeBase(id) * Phaser.Math.FloatBetween(0.8, 1.25))),
        qte: (toujours ? hasard(4, 9) : hasard(1, 4)) + amis + (manquaient.includes(id) ? 1 : 0),
      };
    }
  }
  return etals;
}

function remiseMarchand(G, cle) {
  return REMISES[niveauRelation(G, MARCHANDS[cle].nom).nom] || 0;
}

function prixMarchand(G, cle, id) {
  const offre = G.etals[cle][id];
  const evenement = modifEvenement(G, 'prix', id) || 1;
  return Math.max(1, Math.round(offre.prix * evenement * (1 - remiseMarchand(G, cle))));
}

// Acheter un objet à un étal. Renvoie { erreur } ou { message } (palier de relation franchi).
function acheterAuMarche(G, cle, id) {
  const offre = G.etals[cle][id];
  if (!offre || offre.qte <= 0) return { erreur: 'Plus en stock.' };
  const prix = prixMarchand(G, cle, id);
  if (!peutPayer(G, prix)) return { erreur: "Pas assez d'argent ! Passe à la banque pour un prêt." };
  const materiau = id in MATERIAUX;
  if (!materiau && stockTotal(G) >= G.capacite) return { erreur: 'Ta réserve est pleine.' };
  offre.qte--;
  if (materiau) G.materiaux[id] = (G.materiaux[id] || 0) + 1;
  else G.stock[id]++;
  return { message: depenserChez(G, cle, prix) };
}

// Chaque achat chez un marchand compte pour votre relation (et donc ses remises).
function depenserChez(G, cle, montant) {
  payer(G, montant, 'marche');
  const nom = MARCHANDS[cle].nom;
  const total = G.depenses[cle] || 0;
  const avant = Math.floor(total / DEPENSE_PAR_POINT);
  G.depenses[cle] = total + montant;
  const apres = Math.floor(G.depenses[cle] / DEPENSE_PAR_POINT);
  rencontrer(G, nom);
  return apres > avant ? changerRelation(G, nom, apres - avant) : null;
}

// --- Les jeux d'argent ---

function partiesRestantes(G, jeu) {
  return PARTIES_PAR_JOUR - G.jeux[jeu];
}

// Les dés : deux dés chacun, le plus gros total gagne (égalité : on récupère sa mise).
function jouerAuxDes(G, mise) {
  if (partiesRestantes(G, 'des') <= 0 || !peutPayer(G, mise)) return null;
  G.jeux.des++;
  const de = () => hasard(1, 6);
  const toi = [de(), de()];
  const lui = [de(), de()];
  const bonus = aDecoration(G, 'trefle') ? 1 : 0;
  const a = toi[0] + toi[1] + bonus;
  const b = lui[0] + lui[1];
  const resultat = a > b ? 'gagne' : a < b ? 'perdu' : 'egalite';
  if (resultat === 'gagne') encaisser(G, mise, 'jeux');
  if (resultat === 'perdu') payer(G, mise, 'jeux');
  return { toi, lui, bonus, resultat };
}

// Le bonneteau : on paie la mise, et on récupère le double si on trouve la pièce.
function miserAuBonneteau(G, mise) {
  if (partiesRestantes(G, 'bonneteau') <= 0 || !peutPayer(G, mise)) return false;
  G.jeux.bonneteau++;
  payer(G, mise, 'jeux');
  return true;
}

function gagnerAuBonneteau(G, mise) {
  encaisser(G, mise * 2, 'jeux');
}

// --- Le mendiant ---

// Donner au mendiant. Renvoie un message de remerciement (un cadeau la première fois qu'on dépasse le seuil).
function donnerAuMendiant(G, montant) {
  if (!peutPayer(G, montant)) return null;
  const avant = G.mendiant;
  payer(G, montant, 'dons');
  G.mendiant += montant;
  if (avant < MENDIANT_SEUIL && G.mendiant >= MENDIANT_SEUIL && !G.decorations.includes('trefle')) {
    G.decorations.push('trefle');
    return "« Tu as un grand cœur, petit marchand. Prends ce trèfle, il m'a porté chance autrefois... » Tu reçois le Trèfle du mendiant !";
  }
  return auHasard([
    '« Merci... Que les étoiles veillent sur toi. »',
    "« Une pièce pour un vieil homme... Je n'oublierai pas ton visage. »",
    "« Tu es bon. C'est rare, par ici. »",
  ]);
}

function refuserLettre(G, annonce) {
  G.annonces = G.annonces.filter(a => a !== annonce);
  G.reputation -= REFUS_LETTRE;
  G.stats.lettresRefusees++;
  changerRelation(G, annonce.voyageur.nom, POINTS_RELATION.refusLettre);
}

function accepterLettre(G, annonce) {
  annonce.acceptee = true;
  G.stats.lettresAcceptees++;
}

function refuserClient(G, voyageur) {
  const mission = G.faucheuse.mission;
  if (mission && mission.cible.id === voyageur.id) mission.etat = 'ratee';
  G.reputation -= REFUS_CLIENT;
  G.stats.refus++;
  connaitre(G, voyageur);
  return changerRelation(G, voyageur.nom, POINTS_RELATION.refusClient);
}

// --- Relations ---

// La couleur d'un nom de PNJ selon ta relation avec lui (sombre = sur fond sombre).
function couleurNom(G, nom, sombre = false) {
  const n = niveauRelation(G, nom);
  return sombre ? n.vive : n.couleur;
}

function rencontrer(G, nom) {
  if (!(nom in G.relations)) G.relations[nom] = 0;
}

function niveauRelation(G, nom) {
  if (!(nom in G.relations)) return { nom: 'Inconnu', couleur: '#6b5a40', vive: '#e8dcc0', butin: 1, index: 3 };
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
  const feminin = !!(G.personnes && G.personnes[nom] && G.personnes[nom].feminin);
  const deja = G.paliers[nom] = G.paliers[nom] || [];
  if (deja.includes(apres.nom)) return null;
  deja.push(apres.nom);

  if (apres.nom === 'Amis') {
    G.materiaux.fer += 2;
    G.materiaux.cuir += 2;
    return `${nom} te considère comme un ami ! En cadeau : 2 fer et 2 cuir.`;
  }
  if (apres.nom === 'Frères de sang') return `${nom} et toi êtes maintenant ${feminin ? 'sœurs' : 'frères'} de sang ! ` + offrirDecoration(G, feminin);
  if (apres.nom === 'Pires ennemis') {
    const perdus = [];
    for (let i = 0; i < 3; i++) {
      const dispo = Object.keys(G.stock).filter(id => G.stock[id] > 0);
      if (!dispo.length) break;
      const id = auHasard(dispo);
      G.stock[id]--;
      perdus.push(ITEMS[id].nom);
    }
    return `${nom} est devenu${feminin ? 'e ta pire ennemie' : ' ton pire ennemi'}... Cette nuit, ta réserve a été saccagée` +
      (perdus.length ? ` (${perdus.join(', ')} perdus).` : '.');
  }
  return null;
}

function offrirDecoration(G, feminin = false) {
  const il = feminin ? 'Elle' : 'Il';
  // Le trèfle ne s'obtient que par le mendiant.
  const libres = Object.keys(DECORATIONS).filter(id => id !== 'trefle' && !G.decorations.includes(id));
  if (!libres.length) {
    encaisser(G, 50, 'cadeaux');
    return `${il} t'offre une bourse de 50 pièces.`;
  }
  const id = auHasard(libres);
  G.decorations.push(id);
  return `${il} t'offre une décoration pour ton comptoir : ${DECORATIONS[id].nom}.`;
}

// --- Compétences du joueur ---

// Le flair : au début, tes estimations sont faussées. Elles s'affinent avec l'expérience.
function niveauFlair(G) {
  return Math.min(1, G.experience / 40);
}

// Ce que ton flair te dit d'une trouvaille : son prix de revente une fois restaurée, plus ou moins
// précis selon ton expérience, et si le prix demandé est une bonne affaire.
function estimationFlair(G, t) {
  const flair = niveauFlair(G);
  const vraie = valeurTresor(t.tresor, ETATS.length - 1);
  const centre = vraie * (1 + (t.biais || 0) * 0.45 * (1 - flair));
  const ecart = vraie * 0.35 * (1 - flair) + 2;
  const min = Math.max(1, Math.round(centre - ecart)), max = Math.round(centre + ecart);
  const rapport = t.prix / centre;
  const verdict = rapport < 0.45 ? { texte: 'Une affaire en or !', couleur: '#2f7a2a' }
    : rapport < 0.7 ? { texte: 'Bon prix', couleur: '#2f6a2a' }
    : rapport < 0.95 ? { texte: 'Prix correct, sans plus', couleur: '#8a6a10' }
    : { texte: 'Trop cher, à mon avis…', couleur: '#a03030' };
  return { min, max, verdict, flair };
}

function chanceEstimee(G, voyageur, colis, pieges = null) {
  // Toi, tu sais ce que tu as glissé dans le colis.
  if (piegeFatal(voyageur, pieges)) return 0;
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
  encaisser(G, PRIX_REPARATION, 'reparations');
  G.reparations++;
  changerRelation(G, voyageur.nom, POINTS_RELATION.reparation);
  return null;
}

// Le marchandage : la remise de Maître Gédéon dépend de votre relation.


// --- Les familles ---

// Les montants proposés à la famille d'un aventurier mort.
function montantsDedommagement(voyageur) {
  const m = {};
  for (const [cle, d] of Object.entries(DEDOMMAGEMENTS)) m[cle] = Math.max(5, Math.round(voyageur.butin * d.part));
  return m;
}

// Le dédommagement est obligatoire. Il peut faire passer à découvert (et jusqu'à la faillite).
// Selon sa générosité, la réputation remonte un peu, et un proche viendra peut-être reprendre la quête.
// Renvoie la somme versée.
function dedommager(G, parti, niveau) {
  if (parti.dedommage) return 0;
  const v = parti.voyageur;
  const d = DEDOMMAGEMENTS[niveau];
  parti.dedommage = niveau;
  const verse = montantsDedommagement(v)[niveau];
  payer(G, verse, 'dedommagements');
  G.reputation += d.reputation;
  if (Math.random() < d.releve) { ajouterVisite(G, v, parti.resultat.valeureux, 'releve'); return verse; }
  const pts = G.relations[v.nom] || 0;
  if (Math.random() < (Math.abs(pts) >= 3 ? 0.6 : 0.3)) {
    ajouterVisite(G, v, parti.resultat.valeureux, intentionFamille(pts, parti.resultat.valeureux, niveau));
  }
  return verse;
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

// Le fer et le cuir de Grippesou : pas tous les jours, et hors de prix.
function materiauxExpress() {
  const offre = {};
  for (const [id, m] of Object.entries(MATERIAUX)) {
    if (Math.random() >= EXPRESS_MATERIAUX.chance) continue;
    offre[id] = { prix: Math.round(m.prix * EXPRESS_MATERIAUX.multiplicateur * Phaser.Math.FloatBetween(0.9, 1.3)), qte: hasard(1, 3) };
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
  payer(G, a.prix, 'reserve');
  G.capacite = a.capacite;
  G.reputation += REPUTATION_AMELIORATION;
  return true;
}

// --- Les améliorations du shop ---

// Le niveau de luxe d'un meuble (0 à 3). L'étagère suit les agrandissements de la réserve.
function niveauAmelioration(G, cle) {
  if (cle === 'reserve') return AGRANDISSEMENTS.filter(a => a.capacite <= G.capacite).length;
  return (G.ameliorations && G.ameliorations[cle]) || 0;
}

// Le prochain niveau d'un meuble : { niveau, nom, prix }, ou null s'il est au maximum.
function ameliorationSuivante(G, cle) {
  const n = niveauAmelioration(G, cle);
  const a = AMELIORATIONS[cle];
  if (n >= a.niveaux.length - 1) return null;
  const prix = cle === 'reserve' ? AGRANDISSEMENTS[n].prix : a.prix[n];
  return { niveau: n + 1, nom: a.niveaux[n + 1], prix };
}

// Commander une amélioration (les ouvriers passent la nuit). L'étagère s'agrandit tout de suite.
// Renvoie un message d'erreur, ou null si c'est commandé.
function commanderAmelioration(G, cle) {
  const s = ameliorationSuivante(G, cle);
  if (!s) return 'Déjà au plus haut niveau.';
  if ((G.travaux || []).includes(cle)) return 'Les ouvriers viennent déjà cette nuit.';
  if (!peutPayer(G, s.prix)) return "Pas assez d'argent.";
  if (cle === 'reserve') { agrandirReserve(G); return null; }
  payer(G, s.prix, 'ameliorations');
  G.travaux = [...(G.travaux || []), cle];
  return null;
}

// Le niveau de la façade (0 : humble chaumière … 3 : belle maison à colombages), qui suit
// l'ensemble des améliorations du shop.
function niveauFacade(G) {
  const total = Object.keys(AMELIORATIONS).filter(c => c !== 'atelier').reduce((somme, cle) => somme + niveauAmelioration(G, cle), 0);
  return Math.min(3, Math.floor(total / 4));
}

// La nuit : les ouvriers installent ce qui a été commandé, le coffre rapporte, on se repose.
function nuitDuShop(G) {
  G.travauxFinis = [];
  for (const cle of G.travaux || []) {
    G.ameliorations[cle] = Math.min(AMELIORATIONS[cle].niveaux.length - 1, (G.ameliorations[cle] || 0) + 1);
    G.reputation += REPUTATION_AMELIORATION;
    G.travauxFinis.push(cle);
  }
  G.travaux = [];
  const coffre = niveauAmelioration(G, 'coffre');
  if (coffre && G.argent > 0) encaisser(G, Math.min(15 * coffre, Math.floor(G.argent * 0.01 * coffre)), 'interets');
  G.experience += niveauAmelioration(G, 'chambre');
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
  // Un prêt n'est pas une recette : il est compté à part.
  G.argent += pret.somme;
  compter(G, 'pret', 'prets', pret.somme);
  G.prets.push({ id: pret.id, preteur: pret.preteur, nom: pret.nom, restant: du, parJour: Math.ceil(du / pret.jours) });
}

// Chaque nuit, les échéances des prêts sont prélevées.
// Les échéances sont prélevées chaque nuit, même si la bourse est vide : on passe alors
// à découvert (et, en dessous de SEUIL_FAILLITE, c'est la faillite).
function payerEcheances(G) {
  for (const p of G.prets) {
    const montant = Math.min(p.parJour, p.restant);
    payer(G, montant, 'remboursements');
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
    variete: variete * CLIENTS_PAR_OBJET,
    decoration: aDecoration(G, 'trophee') ? 0.7 : 0,
    eclairage: niveauAmelioration(G, 'eclairage') * 0.3,
    total: 1 + G.reputation * 0.4 + Math.min(G.experience, 40) / 10 + variete * CLIENTS_PAR_OBJET + (aDecoration(G, 'trophee') ? 0.7 : 0)
      + niveauAmelioration(G, 'eclairage') * 0.3,
  };
}

// La fourchette de clients attendus un jour donné (par défaut : demain).
// Le vrai nombre est tiré à l'ouverture du comptoir : un stock varié acheté le matin attire encore du monde.
function prevision(G, jour = G.jour + 1) {
  const annonces = G.annonces.filter(a => a.jour === jour && a.acceptee).length;
  const base = Math.max(1, Math.floor(attrait(G).total));
  const evenements = modifEvenement(G, 'clients', null, jour);
  const rumeur = G.rumeur && G.rumeur.jour === jour ? -RUMEUR_CLIENTS : 0;
  // Les clients « de passage » ; ceux des lettres viennent en plus.
  let min = Phaser.Math.Clamp(base + evenements + rumeur, 1, 7);
  let max = Math.max(min, min + 3 + Math.min(0, evenements + rumeur));
  if (jour <= CLIENTS_DEBUT.jours) { min = Math.min(min, CLIENTS_DEBUT.max); max = Math.min(max, CLIENTS_DEBUT.max); }
  // Le plafond du palier de réputation
  const palier = palierClients(G);
  min = Math.min(min, palier.max); max = Math.min(max, palier.max);
  return { min, max, annonces, palier };
}

// Le palier de réputation atteint, et le suivant (ou null).
function palierClients(G) {
  let i = 0;
  PALIERS_CLIENTS.forEach((p, k) => { if (G.reputation >= p.reputation) i = k; });
  return { ...PALIERS_CLIENTS[i], index: i, suivant: PALIERS_CLIENTS[i + 1] || null };
}

// La part d'une commande par lettre vraiment remplie (de 0 à 1).
function partCommandeRemplie(v, colis) {
  const commande = commandeDe(v);
  let voulu = 0, donne = 0;
  for (const [id, n] of Object.entries(commande)) { voulu += n; donne += Math.min(n, (colis && colis[id]) || 0); }
  return voulu ? donne / voulu : 1;
}

// On va dormir puis on ouvre le comptoir (utile pour les tests).
function journeeSuivante(G) {
  nuit(G);
  if (!G.faillite) ouvrirComptoir(G);
}

// La nuit : échéances des prêts, puis le matin d'un nouveau jour (le marché).
function nuit(G) {
  payerEcheances(G);
  // Les employés sont payés chaque nuit.
  for (const id of G.employes) payer(G, EMPLOYES[id].salaire, 'salaires');
  if (G.argent <= SEUIL_FAILLITE) {
    G.faillite = true;
    return;
  }
  nuitDuShop(G);
  G.express = offreDuJour(MARCHAND_EXPRESS.multiplicateur, 3, 1, 2);
  G.expressMateriaux = materiauxExpress();
  G.jour++;
  G.argentDebutJour = G.argent;
  G.journal = { servis: 0, retours: 0, morts: 0, echecs: 0 };
  G.etals = etalsDuJour(G);
  G.etalsJour = G.jour;
  G.jeux = { des: 0, bonneteau: 0 };
  avancerAtelier(G);
  avancerEvenements(G);
  recompenserZones(G);
  // On oublie les aventures terminées depuis un moment (la sauvegarde reste légère) :
  // le registre (historique) en garde le résumé.
  G.partis = G.partis.filter(p => !p.termine || p.retour >= G.jour - 2);
  for (const j of Object.keys(G.compta)) if (j < G.jour - JOURS_DE_COMPTES) delete G.compta[j];
}

// On ouvre le comptoir : la file d'attente du jour se forme.
function ouvrirComptoir(G) {
  const { min, max } = prevision(G, G.jour);
  // Les clients du jour : ceux qui ont écrit, plus des imprévus.
  // Une lettre restée sans réponse le jour venu : l'aventurier est allé ailleurs, et il s'en souviendra.
  for (const a of G.annonces.filter(x => x.jour === G.jour && !x.acceptee)) refuserLettre(G, a);
  const prevus = G.annonces.filter(a => a.jour === G.jour).map(a => a.voyageur);
  G.annonces = G.annonces.filter(a => a.jour !== G.jour);
  const imprevus = hasard(min, max); // (les clients des lettres viennent en plus)
  const clients = [...prevus.map(v => ({ ...v, prevu: true }))];
  for (let i = 0; i < imprevus; i++) clients.push(voyageurAuHasard(G, clients));
  const file = Phaser.Utils.Array.Shuffle(clients.map(v => ({ type: 'client', voyageur: v })));

  // Les aventuriers dont la quête se termine aujourd'hui reviennent...
  // ... les autres, c'est la Faucheuse qui vient les annoncer, tout au bout de la file.
  // Ceux qui reviennent de mission passent en premier : tu touches leur part tout de suite.
  const morts = [], retours = [];
  for (const p of G.partis) {
    if (p.termine || p.retour !== G.jour) continue;
    p.resultat = simulerAventure(p.voyageur, p.colis, p.pieges);
    if (p.resultat.vivant) retours.push({ type: 'retour', parti: p });
    else morts.push(p);
  }
  // Les familles des disparus.
  for (const visite of G.visites.filter(v => v.jour === G.jour)) {
    file.splice(hasard(0, file.length), 0, { type: 'famille', visite });
  }
  G.visites = G.visites.filter(v => v.jour > G.jour);
  // La cible d'une mission de sabotage acceptée vient se faire servir.
  const mission = G.faucheuse.mission;
  if (mission && mission.etat === 'acceptee' && mission.jour === G.jour) {
    mission.etat = 'en cours';
    file.splice(hasard(0, file.length), 0, { type: 'client', voyageur: mission.cible });
  }
  // La Faucheuse ne se montre qu'à partir du 5e jour ; avant, c'est un passant qui rapporte
  // le carnet du disparu.
  if (morts.length && G.jour >= JOUR_FAUCHEUSE) file.push({ type: 'faucheuse', partis: morts });
  else if (morts.length) file.push(...morts.map(parti => ({ type: 'carnet', parti })));
  G.file = [...retours, ...file];
}

// Ce que l'aventurier te reverse vraiment, selon votre relation et la lanterne.
function partDuButin(G, voyageur) {
  const lanterne = aDecoration(G, 'lanterne') ? 1.1 : 1;
  const comptoir = 1 + 0.04 * niveauAmelioration(G, 'comptoir');
  return Math.round(voyageur.butin * niveauRelation(G, voyageur.nom).butin * lanterne * comptoir);
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
  const camp = ZONES[v.zone] && ZONES[v.zone].camp;
  if (r.vivant && r.echec) {
    // La mission est ratée : il revient vivant, mais sans rien.
    G.reputation -= PERTE_ECHEC;
    G.journal.echecs = (G.journal.echecs || 0) + 1;
    const blessures = Math.max(0, Math.min(v.pv, (r.pvDepart || v.pv) - 1));
    const h = { nom: v.nom, race: v.race, feminin: v.feminin, inventaire: inventaireApres(parti), blessures, niveau: v.niveau };
    parti.malus = appliquerMalusEchec(G, parti, h);
    G.habitues.push(h);
  } else if (r.vivant) {
    gain = partDuButin(G, v);
    encaisser(G, gain, 'butins');
    // Une commande par lettre remplie à moitié ne rapporte que la moitié de la réputation.
    const part = v.prevu ? partCommandeRemplie(v, parti.colis) : 1;
    G.reputation += GAIN_REPUTATION_SUCCES * (camp ? EFFETS_CAMP[camp].reputation : 1) * part;
    if (camp) G.mal += EFFETS_CAMP[camp].mal;
    G.journal.retours++;
    // Un succès de plus : il progresse, et la carte aussi (déblocage des étoiles).
    const danger = ZONES[v.zone] ? ZONES[v.zone].danger : 1;
    G.succes[danger] = (G.succes[danger] || 0) + 1;
    // La conquête de la contrée avance
    G.conquete = G.conquete || {};
    if (ZONES[v.zone]) {
      G.conquete[v.zone] = (G.conquete[v.zone] || 0) + 1;
      if (G.conquete[v.zone] === CONQUETE_ZONE) parti.conquise = true;
    }
    connaitre(G, v).succes = succesDe(G, v.nom) + 1;
    message = changerRelation(G, v.nom, POINTS_RELATION.retourVivant);
    if (parti.conquise) message = (message ? message + ' ' : '') + `⚑ ${ZONES[v.zone].nom} : contrée conquise ! Son drapeau flotte sur ta carte.`;
    if (part < 1) message = (message ? message + ' ' : '') + `Sa commande n'était remplie qu'à ${Math.round(part * 100)} % : ta réputation en profite moins.`;
    const derniere = r.etapes[r.etapes.length - 1];
    // Les cœurs perdus (au-delà des cœurs gagnés grâce aux soins en plus) restent des blessures.
    const blessures = Math.max(0, Math.min(v.pv, (r.pvDepart || v.pv) - derniere.pvApres));
    // Chaque succès le fait progresser : novice, aguerri, vétéran, héros, légende.
    const niveau = meilleurNiveau(v.niveau, succesDe(G, v.nom));
    if (niveau !== v.niveau) message = (message ? message + ' ' : '') + `${v.nom.split(' ')[0]} devient ${NIVEAUX_AVENTURIER[niveau].nom.toLowerCase()} !`;
    G.habitues.push({ nom: v.nom, race: v.race, feminin: v.feminin, inventaire: inventaireApres(parti), blessures, niveau });
    parti.trouvailles = trouvailles(G, v);
    // Il a peut-être aperçu une zone plus dangereuse, encore inconnue.
    const d = ZONES[v.zone] ? ZONES[v.zone].danger : 1;
    const inconnues = Object.keys(ZONES).filter(z => !zoneOuverte(G, z) && ZONES[z].danger <= d + 1);
    if (inconnues.length && Math.random() < CHANCE_DECOUVERTE) {
      const z = auHasard(inconnues);
      G.zonesDecouvertes.push(z);
      parti.decouverte = z;
      message = (message ? message + ' ' : '') + `« Au fait... J'ai aperçu au loin ${ZONES[z].nom.charAt(0).toLowerCase() + ZONES[z].nom.slice(1)}. » Nouvelle zone sur ta carte !`;
    }
  } else {
    if (!r.valeureux) G.reputation--;
    G.journal.morts++;
    recolter(G, [parti]); // si la Faucheuse ne l'a pas déjà emporté
    // La famille attend un dédommagement : il est choisi à la fin du carnet.
  }
  parti.bilan = { gain, message };
  connaitre(G, v);
  G.historique.unshift({
    nom: v.nom, race: v.race, quete: v.quete, zone: v.zone, depart: parti.depart, retour: parti.retour,
    issue: r.echec ? 'echec' : r.vivant ? 'vivant' : r.valeureux ? 'valeureux' : 'sans gloire', gain, chance: parti.chance,
    voulu: !r.vivant ? parti.voulu || null : null,
  });
  G.historique = G.historique.slice(0, TAILLE_HISTORIQUE);
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
  encaisser(G, PRIX_SOIN, 'soins');
  h.blessures--;
  if (!h.blessures) h.convalescence = 0;
  changerRelation(G, nom, 1);
  return null;
}

function blessuresDe(G, nom) {
  const h = G.habitues.find(x => x.nom === nom);
  return h ? h.blessures || 0 : 0;
}

// Les prêts proposés : la Main Noire seulement pour le camp du mal.
function pretsProposes(G) {
  return PRETS.filter(p => !p.mal || G.camp === 'mal' || G.mal >= SEUIL_MAIN_NOIRE);
}

// --- La comptabilité ---

function compter(G, type, poste, montant) {
  if (!montant) return;
  const jour = G.compta[G.jour] = G.compta[G.jour] || { r: {}, d: {}, pret: {} };
  jour[type][poste] = (jour[type][poste] || 0) + montant;
  G.comptaTotal[type][poste] = (G.comptaTotal[type][poste] || 0) + montant;
}

// Une recette (l'argent qui rentre)...
function encaisser(G, montant, poste) {
  G.argent += montant;
  compter(G, 'r', poste, montant);
}

// ... et une dépense.
function payer(G, montant, poste) {
  G.argent -= montant;
  compter(G, 'd', poste, montant);
}

// Recettes, dépenses et bénéfice entre deux jours (inclus).
function bilanPeriode(G, du, au) {
  let recettes = 0, depenses = 0;
  for (let j = du; j <= au; j++) {
    const c = G.compta[j];
    if (!c) continue;
    recettes += Object.values(c.r).reduce((a, b) => a + b, 0);
    depenses += Object.values(c.d).reduce((a, b) => a + b, 0);
  }
  return { recettes, depenses, benefice: recettes - depenses };
}

// --- Le calendrier ---

function dateDuJour(G, jour = G.jour) {
  const j = jour - 1;
  return {
    an: Math.floor(j / JOURS_PAR_AN) + 1,
    mois: Math.floor((j % JOURS_PAR_AN) / JOURS_PAR_MOIS),
    semaine: Math.floor((j % JOURS_PAR_MOIS) / JOURS_PAR_SEMAINE) + 1,
    jourDuMois: (j % JOURS_PAR_MOIS) + 1,
  };
}

// Le premier jour de la semaine, du mois et de l'année en cours.
function debutsDePeriodes(G) {
  const j = G.jour - 1;
  return {
    semaine: j - (j % JOURS_PAR_SEMAINE) + 1,
    mois: j - (j % JOURS_PAR_MOIS) + 1,
    an: j - (j % JOURS_PAR_AN) + 1,
  };
}

function dateEnTexte(G, jour = G.jour) {
  const d = dateDuJour(G, jour);
  return `${d.jourDuMois} ${MOIS[d.mois]}, an ${d.an}`;
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

// --- Achat-revente ---

function estRestaure(t) {
  return t.etat === ETATS.length - 1 && t.etatInitial in BONUS_RESTAURE;
}

// La valeur d'un objet (à l'état « etat », par défaut son état actuel).
function valeurTresor(t, etat = t.etat) {
  const bonus = etat === ETATS.length - 1 && t.etatInitial in BONUS_RESTAURE ? BONUS_RESTAURE[t.etatInitial] : 1;
  return Math.round(t.valeurBase * ETATS[etat].valeur * bonus);
}

function creerTresor(G) {
  const modele = auHasard(TRESORS);
  const r = Math.random();
  const etat = r < 0.25 ? 0 : r < 0.6 ? 1 : r < 0.85 ? 2 : 3;
  return {
    id: G.prochainId++,
    nom: modele.nom,
    categorie: modele.categorie,
    valeurBase: Math.round(modele.valeur * Phaser.Math.FloatBetween(0.85, 1.15)),
    etat,
    etatInitial: etat,
    reparation: null,
  };
}

// Ce qu'un aventurier revenu rapporte et te propose : souvent rien, parfois un ou deux objets.
// Il les vend en dessous de leur valeur (moins cher encore à un ami).
function trouvailles(G, voyageur) {
  const r = Math.random();
  const n = r < 0.4 ? 0 : r < 0.85 ? 1 : 2;
  const ami = niveauRelation(G, voyageur.nom).index >= 5 ? 0.85 : 1;
  const liste = [];
  for (let i = 0; i < n; i++) {
    const tresor = creerTresor(G);
    // Le prix varie : parfois une affaire, parfois une arnaque. C'est le flair qui t'aide à trier.
    liste.push({ tresor, prix: Math.max(3, Math.round(valeurTresor(tresor) * Phaser.Math.FloatBetween(0.45, 1.1) * ami)), vendu: false,
      biais: Phaser.Math.FloatBetween(-1, 1) });
  }
  return liste;
}

function acheterTrouvaille(G, t) {
  if (t.vendu) return 'Déjà acheté.';
  if (G.tresors.length >= PLACES_ATELIER) return `Ton atelier est plein (${PLACES_ATELIER} objets).`;
  if (!peutPayer(G, t.prix)) return "Pas assez d'argent.";
  payer(G, t.prix, 'trouvailles');
  t.vendu = true;
  t.tresor.prixAchat = t.prix;   // pour savoir à tout moment combien il t'a coûté
  t.tresor.jourAchat = G.jour;
  G.tresors.push(t.tresor);
  return null;
}

// Plus ton artisanat est haut, plus les réparations vont vite.
// La durée d'une étape (un état de plus) : la catégorie, l'état de départ (un objet cassé
// demande plus de travail), moins ton artisanat... et un jour de moins avec une experte.
// Les étapes suivantes vont deux fois plus vite : l'objet est déjà sur l'établi.
function dureeEtape(G, t, etat, ouvrier, suite = false) {
  const r = ouvrier && EMPLOYES[ouvrier] && EMPLOYES[ouvrier].rapide;
  const experte = r === true || (Array.isArray(r) && r.includes(t.categorie)) ? 1 : 0;
  const base = suite ? Math.ceil(CATEGORIES[t.categorie].duree / 2) : CATEGORIES[t.categorie].duree;
  return Math.max(1, base + ETATS[etat].reparation - niveauArtisanat(G) - experte);
}

// La durée pour amener l'objet jusqu'à l'état « cible » : la somme des étapes.
function dureeReparation(G, t, ouvrier = ouvrierLibre(G), cible = t.etat + 1) {
  let jours = 0;
  for (let e = t.etat; e < cible; e++) jours += dureeEtape(G, t, e, ouvrier, e > t.etat);
  return jours;
}

// Les matériaux pour aller jusqu'à « cible » : un par étape.
function materiauxReparation(t, cible = t.etat + 1) {
  const c = CATEGORIES[t.categorie];
  return !c.materiau ? 0 : c.unSeul ? 1 : cible - t.etat;
}

function enReparation(G) {
  return G.tresors.filter(t => t.reparation);
}

// Qui peut travailler à l'atelier : toi, puis tes employés.
function ouvriers(G) {
  return ['toi', ...G.employes];
}

// Le premier ouvrier libre (les employés d'abord, pour que tu restes disponible), ou null.
function ouvrierLibre(G) {
  const occupes = enReparation(G).map(t => t.reparation.ouvrier);
  return [...G.employes, 'toi'].find(o => !occupes.includes(o)) || null;
}

function nomOuvrier(o) {
  return o === 'toi' ? 'toi' : EMPLOYES[o].nom;
}

// Lancer la réparation d'un objet jusqu'à l'état « cible » : un ouvrier libre, et un
// matériau par étape. Renvoie une erreur, ou null.
function reparerTresor(G, t, cible = t.etat + 1) {
  if (t.etat >= ETATS.length - 1) return 'Il est déjà en parfait état.';
  cible = Math.min(ETATS.length - 1, Math.max(t.etat + 1, cible));
  const ouvrier = ouvrierLibre(G);
  if (!ouvrier) return "Tout le monde est déjà occupé. Embauche quelqu'un pour réparer plus d'objets à la fois.";
  const mat = CATEGORIES[t.categorie].materiau;
  const n = materiauxReparation(t, cible);
  if (mat && (G.materiaux[mat] || 0) < n) return `Il te faut ${n} ${MATERIAUX[mat].nom.toLowerCase()} (tu en as ${G.materiaux[mat] || 0}).`;
  if (mat) G.materiaux[mat] -= n;
  t.reparation = { jours: dureeReparation(G, t, ouvrier, cible), ouvrier, cible };
  return null;
}

// --- Les employés ---

function placesEmployes(G) {
  return EMPLOYES_DE_BASE + niveauAmelioration(G, 'atelier');
}

function embaucher(G, id) {
  if (G.employes.includes(id)) return 'Déjà embauché.';
  if (G.employes.length >= placesEmployes(G)) return `Pas d'établi libre : améliore l'atelier (bureau → améliorations) pour embaucher plus.`;
  G.employes.push(id);
  return null;
}

// Renvoyer un employé : la réparation qu'il faisait s'arrête (l'objet reste dans son état).
function renvoyer(G, id) {
  G.employes = G.employes.filter(e => e !== id);
  for (const t of G.tresors) if (t.reparation && t.reparation.ouvrier === id) t.reparation = null;
}

function salaires(G) {
  return G.employes.reduce((s, id) => s + EMPLOYES[id].salaire, 0);
}

// Chaque nuit, les réparations en cours avancent d'un jour.
function avancerAtelier(G) {
  G.nouvellesAtelier = [];
  for (const t of enReparation(G)) {
    t.reparation.jours--;
    if (t.reparation.jours > 0) continue;
    const cible = t.reparation.cible || t.etat + 1;
    t.reparation = null;
    t.etat = cible;
    G.reparations++;
    G.nouvellesAtelier.push(`L'atelier a fini : ${t.nom} est maintenant « ${ETATS[t.etat].nom} »${estRestaure(t) ? ' — restauré ★' : ''} (~${valeurTresor(t)} p.).`);
  }
}

// Les enchères : chaque enchérisseur estime le lot selon ses goûts. Un lot de la même
// catégorie plaît encore plus aux collectionneurs. Renvoie le déroulé de la vente.
function vendreAuxEncheres(G, lot) {
  const estimation = lot.reduce((s, t) => s + valeurTresor(t), 0);
  const parCategorie = {};
  lot.forEach(t => { parCategorie[t.categorie] = (parCategorie[t.categorie] || 0) + 1; });
  const acheteurs = ENCHERISSEURS.map(e => {
    let max = lot.reduce((s, t) => s + valeurTresor(t) *
      (e.aime.includes(t.categorie) ? Phaser.Math.FloatBetween(1.05, 1.45) : Phaser.Math.FloatBetween(0.6, 1.0)), 0);
    if (Object.entries(parCategorie).some(([cat, n]) => n >= 2 && e.aime.includes(cat))) max *= 1.15;
    return { ...e, max: Math.round(max) };
  });
  const pas = Math.max(2, Math.round(estimation * 0.06));
  let prix = Math.round(estimation * 0.4);
  let gagnant = null;
  const deroule = [];
  let encore = true;
  while (encore) {
    encore = false;
    for (const a of Phaser.Utils.Array.Shuffle([...acheteurs])) {
      if (a === gagnant || a.max < prix + pas) continue;
      prix += pas;
      gagnant = a;
      deroule.push({ nom: a.nom, montant: prix });
      encore = true;
    }
  }
  G.encheresJour = G.jour;
  if (!gagnant) return { deroule, gagnant: null, prix: 0, estimation };
  G.tresors = G.tresors.filter(t => !lot.includes(t));
  encaisser(G, prix, 'encheres');
  G.stats.ventes += lot.length;
  return { deroule, gagnant, prix, estimation };
}

function enMission(G) {
  return G.partis.filter(p => !p.termine).sort((a, b) => a.retour - b.retour);
}

// --- Le mal et la Faucheuse ---

// Pourquoi cette mort serait voulue (la raison la plus grave), ou null.
// - un objet piégé dans le colis ;
// - un colis volontairement vide : des objets commandés pas donnés alors que tu les avais ;
// - aucune chance de revenir, et tu l'as quand même laissé partir.
function mortVoulue(G, voyageur, colis, pieges, chance) {
  if (Object.values(pieges || {}).some(n => n > 0)) return 'piege';
  let manquants = 0;
  for (const [id, n] of Object.entries(commandeDe(voyageur))) {
    if (ITEMS[id].durable && etatObjet(voyageur, id) >= 2) continue; // il a déjà le sien
    manquants += Math.min(Math.max(0, n - (colis[id] || 0)), G.stock[id] || 0);
  }
  if (manquants >= MANQUANTS_VOLONTAIRES) return 'colisVide';
  if (chance < SEUIL_SANS_CHANCE) return 'sansChance';
  return null;
}

// `enPlus` : des morts pas encore récoltées (celles qu'elle vient annoncer).
function terreurFaucheuse(G, enPlus = 0) {
  let n = 0;
  TERREUR_FAUCHEUSE.forEach((t, i) => { if (G.faucheuse.morts + enPlus >= t.morts) n = i; });
  return { ...TERREUR_FAUCHEUSE[n], index: n };
}

function seductionFaucheuse(G) {
  let n = 0;
  SEDUCTION_FAUCHEUSE.forEach((t, i) => { if (G.faucheuse.faveur >= t.faveur) n = i; });
  return { ...SEDUCTION_FAUCHEUSE[n], index: n };
}

// La Faucheuse emporte les âmes : on compte les morts, les morts voulues (jauge du mal et
// faveur), les pièges découverts et les sabotages. Chaque mort n'est récoltée qu'une fois.
// Renvoie ce qu'il s'est passé : { voulues, demasques, sabotage }.
function recolter(G, partis) {
  const bilan = { voulues: [], demasques: [], sabotage: null };
  const F = G.faucheuse;
  for (const p of partis) {
    if (p.recolte) continue;
    p.recolte = true;
    F.morts++;
    if (p.voulu) {
      const poids = MORTS_VOULUES[p.voulu].poids;
      G.mal += poids;
      F.faveur += poids;
      bilan.voulues.push(p);
      if (p.voulu === 'piege' && Math.random() < CHANCE_DEMASQUE) {
        G.reputation -= PERTE_DEMASQUE;
        p.demasque = true;
        bilan.demasques.push(p);
      }
    }
    const m = F.mission;
    if (m && m.etat === 'posee' && m.cible.id === p.voyageur.id) {
      encaisser(G, m.prime, 'sabotages');
      F.faveur += 2;
      F.sabotages++;
      bilan.sabotage = { reussi: true, mission: m };
      F.mission = null;
    }
  }
  const m = F.mission;
  if (m && m.etat === 'ratee') {
    F.faveur -= 1;
    bilan.sabotage = { reussi: false, mission: m };
    F.mission = null;
  }
  return bilan;
}

// Les objets piégés qu'on peut glisser dans un colis.
function piegesEnStock(G) {
  return Object.entries(G.pieges).filter(([, n]) => n > 0).map(([id]) => id);
}

// Son premier cadeau, quand elle commence à s'intéresser à toi : deux objets piégés.
function cadeauFaucheuse(G) {
  if (G.faucheuse.cadeau || G.faucheuse.faveur < SEDUCTION_FAUCHEUSE[1].faveur) return null;
  G.faucheuse.cadeau = true;
  const ids = Phaser.Utils.Array.Shuffle(Object.keys(PIEGES)).slice(0, 2);
  for (const id of ids) G.pieges[id] = (G.pieges[id] || 0) + 1;
  return ids;
}

// Une mission de sabotage : une âme pure, qui viendra demain, et l'objet piégé pour elle.
function proposerSabotage(G) {
  const F = G.faucheuse;
  if (F.mission || G.mal < SEUIL_SABOTAGE) return null;
  for (let essai = 0; essai < 20; essai++) {
    const cible = voyageurAuHasard(G);
    if (cible.habitue) continue;
    const zones = zonesPour(G, cible).filter(z => ZONES[z].camp !== 'mal');
    if (!zones.length) continue;
    const zone = auHasard(zones);
    envoyerDans(G, cible, zone);
    const possibles = Object.keys(commandeDe(cible)).filter(id => id in PIEGES);
    if (!possibles.length) continue;
    const danger = ZONES[zone].danger;
    const prime = Math.round(PRIME_SABOTAGE[0] + (PRIME_SABOTAGE[1] - PRIME_SABOTAGE[0]) * (danger - 1) / 4);
    F.mission = { cible, piege: auHasard(possibles), jour: G.jour + 1, prime, etat: 'proposee' };
    return F.mission;
  }
  return null;
}

function accepterSabotage(G) {
  const m = G.faucheuse.mission;
  m.etat = 'acceptee';
  G.pieges[m.piege] = (G.pieges[m.piege] || 0) + 1;
}

function refuserSabotage(G) {
  G.faucheuse.mission = null;
  G.faucheuse.faveur -= 1;
}

// Est-ce la cible d'une mission en cours ?
function estCible(G, voyageur) {
  const m = G.faucheuse.mission;
  return !!m && m.etat === 'en cours' && m.cible.id === voyageur.id;
}

// --- Les personnes : succès, chance, cadeaux ---

// La fiche d'une personne (créée si besoin), en gardant ce qu'on savait déjà.
function connaitre(G, v) {
  const p = G.personnes[v.nom] = G.personnes[v.nom] || {};
  p.race = v.race;
  p.feminin = v.feminin;
  return p;
}

function succesDe(G, nom) {
  return (G && G.personnes[nom] && G.personnes[nom].succes) || 0;
}

// Le meilleur niveau entre celui qu'il a et celui que ses succès lui valent.
function meilleurNiveau(niveau, succes) {
  let n = ORDRE_NIVEAUX.indexOf(niveau);
  ORDRE_NIVEAUX.forEach((cle, i) => { if (succes >= NIVEAUX_AVENTURIER[cle].succes && i > n) n = i; });
  return ORDRE_NIVEAUX[Math.max(0, n)];
}

// Son trèfle : un peu de chance au départ, plus avec la relation et les cadeaux (0 à 10).
function trefleDe(G, nom) {
  if (!G) return TREFLE_BASE;
  const relation = TREFLE_RELATION[niveauRelation(G, nom).index] || 0;
  const cadeaux = (G.personnes[nom] && G.personnes[nom].trefle) || 0;
  return Phaser.Math.Clamp(TREFLE_BASE + relation + cadeaux, 0, TREFLE_MAX);
}

// Offrir un cadeau : selon ses goûts, beaucoup de chance, un peu, ou rien (et il le prend mal).
// Un cadeau par personne et par jour. Renvoie { erreur } ou { gout, texte }.
function offrirCadeau(G, v, id) {
  if (!G.cadeaux[id]) return { erreur: "Tu n'as plus ce cadeau." };
  const p = connaitre(G, v);
  if (p.cadeauJour === G.jour) return { erreur: `${v.nom.split(' ')[0]} a déjà reçu un cadeau aujourd'hui.` };
  G.cadeaux[id]--;
  p.cadeauJour = G.jour;
  const gouts = GOUTS[v.race] || { aime: [], deteste: [] };
  const gout = gouts.aime.includes(id) ? 'aime' : gouts.deteste.includes(id) ? 'deteste' : 'neutre';
  const effet = EFFET_CADEAU[gout];
  p.trefle = Math.min(TREFLE_MAX, (p.trefle || 0) + effet.trefle);
  p.gouts = p.gouts || {};
  p.gouts[id] = gout;
  rencontrer(G, v.nom);
  const message = effet.relation ? changerRelation(G, v.nom, effet.relation) : null;
  const e = v.feminin ? 'e' : '';
  const textes = {
    aime: `« Pour moi ? ${CADEAUX[id].nom} ! C'est exactement ce que j'adore ! » (chance +${effet.trefle})`,
    neutre: `« Oh... merci, c'est gentil. » ${v.feminin ? 'Elle' : 'Il'} range le cadeau poliment. (chance +${effet.trefle})`,
    deteste: `« ${CADEAUX[id].nom} ? Tu te moques de moi ? » ${v.feminin ? 'Elle' : 'Il'} est vexé${e}.`,
  };
  return { gout, texte: textes[gout] + (message ? ' ' + message : '') };
}

function acheterCadeau(G, id) {
  const prix = CADEAUX[id].prix;
  if (!peutPayer(G, prix)) return "Pas assez d'argent !";
  payer(G, prix, 'bazar');
  G.cadeaux[id] = (G.cadeaux[id] || 0) + 1;
  return null;
}

// --- La mission ratée ---

// Les ennuis d'une mission ratée : plus votre relation était mauvaise au départ, plus il y en a.
// `h` : sa fiche d'habitué, qu'on complète. Renvoie les textes des malus.
function appliquerMalusEchec(G, parti, h) {
  const v = parti.voyageur;
  const n = NB_MALUS_ECHEC[parti.relationDepart ?? 3] || 2;
  const choisis = Phaser.Utils.Array.Shuffle(Object.keys(MALUS_ECHEC)).slice(0, n);
  const textes = [`Ta mise est perdue, et ta réputation baisse (−${String(PERTE_ECHEC).replace('.', ',')}).`];
  for (const m of choisis) {
    if (m === 'rumine') changerRelation(G, v.nom, -2);
    if (m === 'blesse') h.convalescence = G.jour + CONVALESCENCE;
    if (m === 'rumeur') G.rumeur = { jour: G.jour + 1 };
    if (m === 'comptes') h.exige = true;
    textes.push(MALUS_ECHEC[m].replace('{nom}', v.nom.split(' ')[0]).replace('{e}', v.feminin ? 'e' : '')
      .replace('{le}', v.feminin ? 'la' : 'le').replace('{il}', v.feminin ? 'elle' : 'il'));
  }
  return textes;
}

// --- Les événements et la gazette ---

function evenementsActifs(G, jour = G.jour) {
  return (G.evenements || []).filter(e => e.debut <= jour && jour <= e.fin);
}

// L'effet des événements en cours : `type` 'prix' (cle = objet), 'danger' ou 'butin' (cle = zone),
// 'clients'. Renvoie un multiplicateur (prix, butin), un bonus (danger) ou un nombre (clients).
function modifEvenement(G, type, cle, jour) {
  if (!G || !G.evenements) return type === 'prix' || type === 'butin' ? 1 : 0;
  let effet = type === 'prix' || type === 'butin' ? 1 : 0;
  for (const e of evenementsActifs(G, jour ?? G.jour)) {
    const d = EVENEMENTS[e.id];
    if (d.type !== type) continue;
    if (type === 'prix' && d.objets.includes(cle)) effet *= d.mult;
    if (type === 'butin' && d.zone === cle) effet *= d.mult;
    if (type === 'danger' && d.zone === cle) effet += d.mult;
    if (type === 'clients') effet += d.clients;
  }
  return effet;
}

// Chaque nuit : les événements finis s'oublient ; parfois, un nouveau se prépare (annoncé par
// lettre quelques jours avant), éclate (le crieur l'annonce) ou s'est déjà produit (une lettre
// le raconte). Puis le crieur prépare les nouvelles du jour.
function avancerEvenements(G) {
  G.evenements = (G.evenements || []).filter(e => e.fin >= G.jour);
  G.courrier = (G.courrier || []).filter(c => c.jour >= G.jour - 1);
  const lignes = [];
  if (Math.random() < CHANCE_EVENEMENT) {
    const libres = Object.keys(EVENEMENTS).filter(id => !G.evenements.some(e => e.id === id)
      && (!EVENEMENTS[id].zone || zoneOuverte(G, EVENEMENTS[id].zone)));
    if (libres.length) {
      const id = auHasard(libres);
      const d = EVENEMENTS[id];
      const mode = auHasard(['planifie', 'planifie', 'immediat', 'passe']);
      const debut = mode === 'planifie' ? G.jour + hasard(2, 4) : G.jour;
      G.evenements.push({ id, debut, fin: debut + hasard(2, 4) - 1 });
      if (mode === 'planifie') G.courrier.push({ jour: G.jour, texte: `${d.annonce} (dans ${debut - G.jour} jours)` });
      else if (mode === 'passe') G.courrier.push({ jour: G.jour, texte: `${d.annonce} C'est arrivé cette nuit.` });
    }
  }
  for (const e of G.evenements) {
    const d = EVENEMENTS[e.id];
    if (e.debut === G.jour) lignes.push('📢 ' + d.nouvelle);
    else if (e.fin === G.jour) lignes.push(`📢 Dernier jour : ${d.nouvelle.charAt(0).toLowerCase() + d.nouvelle.slice(1)}`);
  }
  // Une nouvelle absurde, sans répéter les dernières.
  G.nouvellesLues = (G.nouvellesLues || []).slice(-15);
  const restantes = NOUVELLES.map((_, i) => i).filter(i => !G.nouvellesLues.includes(i));
  const i = auHasard(restantes.length ? restantes : NOUVELLES.map((_, k) => k));
  G.nouvellesLues.push(i);
  lignes.push(NOUVELLES[i]);
  G.gazette = { jour: G.jour, lignes };
}

// --- L'Armure du Dernier Rempart ---

// Chaque zone qui s'ouvre (réputation, missions réussies, découverte) vaut une pièce de
// l'armure, apportée par un messager au réveil.
function recompenserZones(G) {
  G.nouvellesPieces = [];
  G.zonesConnues = G.zonesConnues || [];
  G.piecesAVenir = G.piecesAVenir || [];
  // Chaque zone qui s'ouvre promet une pièce... mais le messager n'en apporte qu'une par matin :
  // les autres attendent leur tour, pour que chacune soit un vrai événement.
  for (const z of zonesOuvertes(G)) {
    if (G.zonesConnues.includes(z)) continue;
    G.zonesConnues.push(z);
    if (G.armure.length + G.piecesAVenir.length < ARMURE.length) G.piecesAVenir.push(z);
  }
  if (G.piecesAVenir.length && G.armure.length < ARMURE.length) {
    const z = G.piecesAVenir.shift();
    const piece = ARMURE[G.armure.length];
    G.armure.push(piece.id);
    G.nouvellesPieces.push({ piece: piece.id, zone: z, cote: coteArmure(G) });
    // L'armure est complète : ton camp est scellé pour de bon.
    if (G.armure.length === ARMURE.length && !G.camp) {
      G.camp = coteArmure(G) === 'sombre' ? 'mal' : 'bien';
      G.nouvellesPieces[G.nouvellesPieces.length - 1].scelle = G.camp;
    }
  }
}

// Le côté de l'armure : scellé avec le camp, sinon la jauge du mal contre la réputation.
function coteArmure(G) {
  if (G.camp) return G.camp === 'mal' ? 'sombre' : 'clair';
  return G.mal > G.reputation ? 'sombre' : 'clair';
}

// Le nom et le texte d'une pièce, selon le côté.
function pieceArmure(id, cote) {
  const p = ARMURE.find(a => a.id === id);
  return cote === 'sombre' ? { id, ...ARMURE_SOMBRE[id] } : p;
}

// --- Les petits mots qui s'accordent avec une marchandise ---
const voyelle = mot => /^[aeiouyéèêàâîôûh]/i.test(mot);
function genreDe(id) { return GENRE_OBJETS[id] || 'f'; }
// « la torche », « l'épée », « le bouclier », « les bandages »
function leNom(id, nom) {
  const g = genreDe(id);
  return g.includes('p') ? 'les ' + nom : voyelle(nom) ? "l'" + nom : (g === 'm' ? 'le ' : 'la ') + nom;
}
// « de torche », « d'épée »
function deNom(nom) { return (voyelle(nom) ? "d'" : 'de ') + nom; }
// « une torche », « un bouclier », « des flèches »
function unNom(id) { const g = genreDe(id); return g.includes('p') ? 'des' : g === 'm' ? 'un' : 'une'; }
// « ma torche », « mon épée », « mon bouclier », « mes bandages »
function monNom(id, nom) { const g = genreDe(id); return g.includes('p') ? 'mes' : g === 'm' || voyelle(nom) ? 'mon' : 'ma'; }
// l'accord d'un adjectif : neuf / neuve / neufs / neuves
function accordAdj(id, m, f, mp, fp) { const g = genreDe(id); return g === 'm' ? m : g === 'f' ? f : g === 'mp' ? mp : fp; }
