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
    if (e.detour) continue;   // (le détour imposé par la Main Noire n'était pas dans sa commande)
    // (v0.63) un combat demande « une arme » : il commande celle de son peuple
    const id = estArme(e.besoin) ? armePour(voyageur) : e.besoin;
    commande[id] = (commande[id] || 0) + e.qte;
  }
  return commande;
}

// --- (v0.63, étape 10a) Les armes ---
function estArme(id) { return !!(ITEMS[id] && ITEMS[id].arme); }
const IDS_ARMES = Object.keys(ITEMS).filter(estArme);
// L'arme de son peuple (les nains vétérans et plus préfèrent le marteau)
function armePour(v) {
  if (v.race === 'nain' && ['veteran', 'heros', 'legende'].includes(v.niveau)) return 'marteau';
  return ARME_PREFEREE[v.race] || 'epee';
}
// Toutes les armes du colis, quelles qu'elles soient
function armesDonnees(colis) { return IDS_ARMES.reduce((s, id) => s + (colis[id] || 0), 0); }
// Ce que le colis fournit pour un objet de la commande : pour l'arme, n'importe laquelle compte
function fourni(v, colis, id) { return estArme(id) ? armesDonnees(colis) : (colis[id] || 0); }
// Le meilleur état parmi les armes qu'il a déjà sur lui
function etatArme(v) { return Math.max(0, ...IDS_ARMES.map(id => etatObjet(v, id))); }
// L'arme qu'il emportera vraiment au combat : la sienne si on la lui donne, sinon une autre du colis,
// sinon celle qu'il a sur lui (ou la sienne, à défaut)
function armeEmportee(v, colis) {
  const pref = armePour(v);
  if ((colis[pref] || 0) > 0) return pref;
  const autre = IDS_ARMES.find(id => (colis[id] || 0) > 0);
  if (autre) return autre;
  const surLui = IDS_ARMES.filter(id => etatObjet(v, id) > 0).sort((a, b) => etatObjet(v, b) - etatObjet(v, a))[0];
  return surLui || pref;
}

// « Ration ×2, Corde ×1 » (v0.58 : plus de « 2 Ration » sans pluriel)
function commandeEnTexte(voyageur) {
  return Object.entries(commandeDe(voyageur)).map(([id, n]) => `${ITEMS[id].nom} ×${n}`).join(', ');
}

// État d'un objet durable que l'aventurier possède déjà (0 = cassé ou absent).
function etatObjet(voyageur, id) {
  return (voyageur.inventaire && voyageur.inventaire[id]) || 0;
}

// Niveau de préparation d'une épreuve selon le colis...
// ... et les objets que l'aventurier a déjà sur lui.
function niveauEpreuve(epreuve, colis, voyageur) {
  const arme = estArme(epreuve.besoin);
  const donne = arme ? armesDonnees(colis) : (colis[epreuve.besoin] || 0);
  if (donne >= epreuve.qte) return 'complet';
  if (donne > 0) return 'partiel';
  // Ce qu'il a déjà sur lui : un client exigeant ne compte que le matériel neuf
  const etat = (arme ? etatArme(voyageur) : etatObjet(voyageur, epreuve.besoin)) - (voyageur.exigeant ? 1 : 0);
  if (etat >= 2) return 'complet';
  if (etat === 1) return 'partiel';
  return 'rien';
}

// Les épreuves rares (amulette, antidote, cape, bouclier), piochées dans toutes les quêtes.
let EPREUVES_RARES_CACHE = null;
function epreuvesRares() {
  if (!EPREUVES_RARES_CACHE) {
    const vues = {};
    for (const q of Object.values(QUETES)) for (const e of q.epreuves) if (OBJETS_EXIGES.includes(e.besoin) && !vues[e.type]) vues[e.type] = e;
    EPREUVES_RARES_CACHE = Object.values(vues);
  }
  return EPREUVES_RARES_CACHE;
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
  // (v0.63) les armes se partagent la commande d'arme : la sienne d'abord, puis les autres
  const pref = armePour(voyageur);
  let resteArme = commande[pref] || 0;
  // (dans le même ordre que armeEmportee : la sienne, puis l'ordre des armes)
  const rang = id => (id === pref ? -1 : estArme(id) ? IDS_ARMES.indexOf(id) : 99);
  const ordre = Object.keys(colis).sort((a, b) => rang(a) - rang(b));
  for (const id of ordre) {
    const n = colis[id];
    let utilise;
    if (estArme(id)) { utilise = Math.min(n, resteArme); resteArme -= utilise; }
    else utilise = Math.min(n, commande[id] || 0);
    const enPlus = n - utilise;
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
  const sp = surplus(voyageur, colis);
  const enPlus = estArme(e.besoin) ? IDS_ARMES.reduce((s, id) => s + (sp[id] || 0), 0) : (sp[e.besoin] || 0);
  // (v0.63) son arme à lui : un vrai bonus ; une autre : un tout petit
  const bonusArme = !estArme(e.besoin) ? 0 : (colis[armePour(voyageur)] || 0) > 0 ? BONUS_ARME_PREFEREE : armesDonnees(colis) > 0 ? BONUS_AUTRE_ARME : 0;
  const niv = NIVEAUX_AVENTURIER[voyageur.niveau] || NIVEAUX_AVENTURIER.novice;
  const evenement = modifEvenement(window.GAME, 'danger', voyageur.zone);
  const etoiles = ZONES[voyageur.zone] ? ZONES[voyageur.zone].danger : 1;
  const danger = Math.max(0, MALUS_DANGER * (etoiles - 1) - niv.bonus);
  // (v0.67) la bénédiction de la nymphe : les épreuves d'eau réussissent mieux pendant quelques jours
  const B = NYMPHE.benediction, beni = window.GAME && window.GAME.nymphe && window.GAME.nymphe.benie >= window.GAME.jour && (B.types.includes(e.type) || B.besoins.includes(e.besoin)) ? B.bonus : 0;
  return Phaser.Math.Clamp(chanceEpreuve(niveauEpreuve(e, colis, voyageur)) + enPlus * BONUS_SURPLUS + bonusArme + niv.bonus + evenement - danger + beni, 0.05, 0.97);
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
// La chance vient de servir : la part donnée par les cadeaux se fane (la chance de base et celle
// de votre relation restent). Renvoie true s'il y avait un trèfle de cadeau à faner.
function fanerTrefle(voyageur) {
  const p = window.GAME && window.GAME.personnes && window.GAME.personnes[voyageur.nom];
  if (!p || !p.trefle) return false;
  p.trefle = Math.max(0, p.trefle - TREFLE_CONSOMME);
  return true;
}

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
      etapes.push({ epreuve: e, niveau, reussie: false, pvApres: 1, repli: true, fane: fanerTrefle(voyageur) });
      return { etapes, pvDepart, vivant: true, echec: true, valeureux: false };
    }
    // Un combat raté peut faire saigner : un bandage en plus arrête le sang, sinon un cœur de plus s'en va.
    let saignement = null;
    if (!reussie) {
      pv--;
      if (EPREUVES_COMBAT.includes(e.type) && Math.random() < CHANCE_SAIGNEMENT) {
        if (bandages > 0) { bandages--; saignement = 'bande'; } else if (pv > 0) {
          // Le saignement va l'achever : sa bonne étoile peut encore le faire rebrousser chemin.
          if (pv === 1 && Math.random() < chanceRepli(voyageur)) {
            etapes.push({ epreuve: e, niveau, reussie: false, pvApres: 1, repli: true, fane: fanerTrefle(voyageur) });
            return { etapes, pvDepart, vivant: true, echec: true, valeureux: false };
          }
          pv--; saignement = 'perte';
        }
      }
    }
    etapes.push({ epreuve: e, niveau, reussie, sauvee, pvApres: pv, saignement, fane: sauvee ? fanerTrefle(voyageur) : false });
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
    heros: Math.max(0, r - 8) * 0.3 + (G.legendes ? 1.5 : 0),
  };
  const total = Object.values(poids).reduce((a, b) => a + b, 0);
  let x = Math.random() * total;
  for (const [n, p] of Object.entries(poids)) { x -= p; if (x <= 0) return n; }
  return 'novice';
}

function creerVoyageur(G, { quete = null, nom, race, feminin, butin, duree, inventaire, blessures = 0, niveau, envie, exige = false, prestige = null }) {
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
    prestige, // un noble ou un collectionneur : paie le double, mais a une exigence
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
  // Les clients exigeants des hauts paliers : une commande plus grosse, parfois un objet rare en
  // plus, et du matériel neuf (voir niveauEpreuve). Les nobles le sont toujours.
  const palier = palierClients(G).index;
  if (v.prestige || (palier >= PALIER_EXIGEANT && Math.random() < (CHANCE_EXIGEANT[palier] ?? 0.9))) {
    v.exigeant = true;
    const e = auHasard(epreuves);
    e.qte += 1;
    if (Math.random() < 0.5) {
      const rare = auHasard(epreuvesRares().filter(r => !epreuves.some(x => x.type === r.type)));
      if (rare) epreuves.splice(hasard(0, epreuves.length), 0, { ...rare });
    }
  }
  const niv = NIVEAUX_AVENTURIER[v.niveau];
  // Un habitué revenu blessé et jamais soigné repart avec moins de cœurs.
  v.pv = Math.max(1, q.pv + niv.pv - v.blessures);
  const camp = multButinCamp(G, ZONES[zone].camp);
  const evenement = modifEvenement(G, 'butin', zone) || 1;
  const prestige = v.prestige ? PRESTIGE_BUTIN : 1; // les nobles paient le double
  v.butin = butin ?? Math.round(hasard(...q.butin) * (1 + 0.3 * enPlus) * BUTIN_PAR_DANGER[ZONES[zone].danger] / BUTIN_PAR_DANGER[1] * niv.butin * camp * evenement * prestige);
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
  appliquerQuete(G, v, auHasard(ZONES[zone].quetes));
  if (aSaMesure(v, zone)) { v.butin = Math.round(v.butin * BONUS_A_SA_MESURE); v.aSaMesure = true; }
  return v;
}

// (v0.60) La quête personnelle d'un grand aventurier : venger un compagnon, reprendre une relique,
// tenir un serment. Une contrée à sa mesure, une épreuve de plus (un combat), un butin bien plus gros.
const QUETES_PERSONNELLES = [
  { id: 'vengeance', titre: n => `Venger ${n}`, accueil: (n, z) => `Je ne viens pas pour une mission ordinaire. ${n} est tombé{e2} ${z}. J'y retourne, et je ne reviendrai pas sans l'avoir vengé{e2}.`, fin: n => `Je l'ai fait. ${n} peut reposer en paix.` },
  { id: 'relique', titre: () => 'Reprendre la relique', accueil: (n, z) => `On a volé l'épée de mon maître. Elle est quelque part ${z}. Je la veux de retour, quoi qu'il en coûte.`, fin: () => "L'épée de mon maître est de nouveau entre mes mains." },
  { id: 'serment', titre: () => 'Tenir un serment', accueil: (n, z) => `J'ai juré de ramener la bannière de ma compagnie, perdue ${z}. Un serment, ça se tient.`, fin: () => 'La bannière flotte de nouveau. Mon serment est tenu.' },
];
const CHANCE_QUETE_PERSONNELLE = 0.3;
// « à la Forêt », « au Lac des Lunes », « aux Pics », « à l'Antre »
// « du Lac des Lunes », « de la Cité d'Opale », « des Vergers », « de l'Abbaye de Clairval »
function deLieu(nom) {
  if (/^Le /.test(nom)) return 'du ' + nom.slice(3);
  if (/^Les /.test(nom)) return 'des ' + nom.slice(4);
  if (/^La /.test(nom)) return 'de la ' + nom.slice(3);
  if (/^L'/.test(nom)) return "de l'" + nom.slice(2);
  return (/^[AEIOUYÉÈH]/i.test(nom) ? "d'" : 'de ') + nom;
}
function aLieu(nom) {
  if (/^Le /.test(nom)) return 'au ' + nom.slice(3);
  if (/^Les /.test(nom)) return 'aux ' + nom.slice(4);
  if (/^La /.test(nom)) return 'à la ' + nom.slice(3);
  if (/^L'/.test(nom)) return "à l'" + nom.slice(2);
  return 'à ' + nom;
}
const BONUS_QUETE_PERSONNELLE = 1.6;
function donnerQuetePersonnelle(G, v) {
  const min = dangerMinimum(v);
  const zones = zonesPour(G, v);
  if (!zones.length) return false;
  const top = Math.max(...zones.map(z => ZONES[z].danger));
  const choix = zones.filter(z => ZONES[z].danger >= Math.min(min, top));
  const zone = auHasard(choix);
  const p = auHasard(QUETES_PERSONNELLES);
  // le compagnon tombé : un disparu de ton registre, sinon un nom de son peuple
  const disparus = (G.historique || []).filter(h => (h.issue === 'valeureux' || h.issue === 'sans gloire') && h.nom !== v.nom);
  let compagnon = disparus.length ? auHasard(disparus) : null;
  if (!compagnon) { const [nom, f] = auHasard(NOMS[v.race] || NOMS.humain); compagnon = { nom, feminin: f }; }
  else compagnon = { nom: compagnon.nom, feminin: !!(G.personnes && G.personnes[compagnon.nom] && G.personnes[compagnon.nom].feminin) };
  appliquerQuete(G, v, auHasard(ZONES[zone].quetes));
  // une épreuve de plus : un combat de la contrée (ou des brigands)
  const combats = ZONES[zone].quetes.flatMap(q => QUETES[q].epreuves).filter(e => EPREUVES_COMBAT.includes(e.type));
  // (une contrée sans combat : on prend un combat d'ailleurs, le face-à-face final)
  const tous = combats.length ? combats : Object.values(QUETES).flatMap(q => q.epreuves).filter(e => EPREUVES_COMBAT.includes(e.type) && e.besoin === 'epee');
  if (tous.length) { const combat = { ...auHasard(tous) }; combat.qte = (combat.qte || 1) + 1; v.epreuves.push(combat); }
  v.butin = Math.round(v.butin * BONUS_QUETE_PERSONNELLE);
  const e2 = compagnon.feminin ? 'e' : '';
  v.quetePerso = { id: p.id, compagnon: compagnon.nom, fin: p.fin(compagnon.nom) };
  v.quete = p.titre(compagnon.nom);
  v.accueil = p.accueil(compagnon.nom, aLieu(ZONES[zone].nom)).replace(/\{e2\}/g, e2);
  return true;
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
  // (v0.55) les contrées à 2 étoiles attendent le deuxième jour : le premier déblocage se voit
  const jourOk = z.danger < 2 || G.jour >= JOUR_DEUX_ETOILES || (G.jour === undefined);
  // (v0.58) Les contrées des Bannis restent cachées tant qu'on n'est jamais descendu au marché
  // noir : on les découvre le lendemain de la première visite (on y a entendu parler d'elles).
  const bannisOk = z.camp !== 'mal' || (G.visiteMarcheNoir !== undefined && G.jour > G.visiteMarcheNoir) || G.zonesDecouvertes.includes(zone);
  return { reputation, besoin, faits, bannis: bannisOk, ouverte: reputation && faits >= besoin && jourOk && bannisOk };
}

function zoneOuverte(G, zone) {
  return conditionsZone(G, zone).ouverte;
}

// Ce peuple vient-il à ton comptoir ? Les Bannis n'osent qu'une fois la jauge passée côté ombre,
// les pandas du Monastère ne descendent que vers un comptoir qui penche côté lumière.
function peupleAccueilli(G, race) {
  if (PEUPLES_OMBRE.includes(race)) return coteCamp(G) === 'mal';
  if (PEUPLES_LUMIERE_TARD.includes(race)) return coteCamp(G) === 'bien';
  return true;
}

// Ce voyageur accepte-t-il d'aller là ? Renvoie la raison de son refus, ou null.
// (v0.60) Les grands aventuriers ont leur fierté : à partir de vétéran, une contrée trop facile
// les vexe (sauf, de temps en temps, un jour de bonne humeur), et une contrée à leur mesure paie mieux.
const DANGER_MINIMUM = { veteran: 2, heros: 3, legende: 4 };
const BONUS_A_SA_MESURE = 1.15;
function dangerMinimum(v) { return DANGER_MINIMUM[v.niveau] || 1; }
function bonneHumeur(G, v) {
  let h = 7;
  for (const c of v.nom + ':' + G.jour) h = (h * 31 + c.charCodeAt(0)) % 1000;
  return h < 120;   // (environ un jour sur huit, il accepte quand même)
}
function aSaMesure(v, zone) { return dangerMinimum(v) > 1 && ZONES[zone].danger >= dangerMinimum(v); }

function refusZone(G, v, zone) {
  const r = refusDeBase(G, v, zone);
  if (r) return r;
  const z = ZONES[zone], min = dangerMinimum(v);
  if (z.danger < min && !bonneHumeur(G, v) && zonesOuvertes(G).some(c => ZONES[c].danger >= min && !refusDeBase(G, v, c))) {
    return `« ${z.nom} ? Pour quelqu'un de mon rang ? Trouve-moi une contrée à ma mesure : ${'★'.repeat(min)} au moins. »`;
  }
  return null;
}

function refusDeBase(G, v, zone) {
  const z = ZONES[zone];
  const banni = PEUPLES_OMBRE.includes(v.race);
  if (z.camp === 'bien' && banni) return "« Les terres de la Confrérie ? Ils me pendraient à l'entrée. Trouve-moi autre chose. »";
  if (z.camp === 'mal' && v.envie !== 'or' && !banni) return "« Les terres d'ombre ? Jamais ! Le Conseil des Gardiens dit que c'est le repaire du mal. Trouve-moi une quête honnête. »";
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
    ...(G.reportes || []).map(v => v.nom),   // (v0.86 : ceux qui reviennent demain matin)
  ];
}

// Les aventuriers revenus vivants peuvent revenir comme clients, avec leur matériel usé.
function habitueAuHasard(G, pris) {
  // Un blessé en convalescence (mission ratée, pas soigné) ne repart pas tout de suite.
  const libres = G.habitues.filter(h => !pris.includes(h.nom) && !(h.convalescence > G.jour && h.blessures > 0));
  if (!libres.length || Math.random() > 0.35) return null;
  const h = auHasard(libres);
  const v = creerVoyageur(G, { ...h });
  // (v0.60) un grand aventurier revient parfois avec une quête bien à lui
  if (dangerMinimum(v) > 1 && Math.random() < CHANCE_QUETE_PERSONNELLE) donnerQuetePersonnelle(G, v);
  return v;
}

// Un voyageur tiré au hasard, qui ne porte pas le nom d'un voyageur déjà en jeu.
// `aussi` : des voyageurs créés à l'instant, pas encore rangés dans la partie.
function voyageurAuHasard(G, aussi = []) {
  // Les disparus ne reviennent pas (leur nom n'est jamais redonné à un nouveau venu).
  const morts = Object.entries(G.personnes || {}).filter(([, p]) => p.mort || p.banni).map(([n]) => n);   // (v0.86 : ni ceux que tu as fait arrêter à tort)
  for (const h of G.historique || []) if (h.issue === 'valeureux' || h.issue === 'sans gloire') morts.push(h.nom);
  const pris = [...nomsActifs(G), ...aussi.map(v => v.nom), ...morts];
  const habitue = habitueAuHasard(G, pris);
  if (habitue) return habitue;
  const libres = [];
  for (const [race, noms] of Object.entries(NOMS)) {
    if (!peupleAccueilli(G, race)) continue;
    for (const [nom, feminin] of noms) if (!pris.includes(nom)) libres.push({ race, nom, feminin });
  }
  // Plus assez de noms connus : on en compose de nouveaux (prénom + nom de famille du même peuple).
  if (libres.length < 6) {
    for (const [race, n] of Object.entries(NOMS_COMPOSES)) {
      if (!peupleAccueilli(G, race)) continue;
      for (const [prenoms, feminin] of [[n.m, false], [n.f, true]]) for (const p of prenoms) for (const f of n.familles) {
        const nom = `${p} ${f}`;
        if (!pris.includes(nom)) libres.push({ race, nom, feminin });
      }
    }
  }
  // Une race au hasard d'abord, pour que les races avec beaucoup de noms ne dominent pas...
  // ... sauf que tes décorations attirent certains peuples plus que d'autres.
  const races = [...new Set(libres.map(l => l.race))];
  const poids = races.map(r => 1 + (G.decos || []).filter(d => DECOS[d].attire === r || (DECOS[d].attire === 'ombre' && PEUPLES_OMBRE.includes(r))).length * (ATTIRANCE_DECO - 1));
  let tirage = Math.random() * poids.reduce((a, b) => a + b, 0);
  let race = races[0];
  for (let k = 0; k < races.length; k++) { tirage -= poids[k]; if (tirage <= 0) { race = races[k]; break; } }
  const choix = races.length ? auHasard(libres.filter(l => l.race === race))
    : { race: 'humain', nom: auHasard(NOMS.humain)[0], feminin: false };
  return creerVoyageur(G, { ...choix });
}

// --- La partie ---

function nouvellePartie({ feminin = false, apparence = null, nomShop = NOM_SHOP_DEFAUT } = {}) {
  const G = {
    nomShop,
    revueV089: true,   // (v0.89) partie neuve : rien à revoir (voir revoirVieillePartie)
    graine: Math.floor(Math.random() * 1e9),   // (v0.60) le hasard de la partie (voir avecGraine)
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
    chienNourri: 0,    // rations données au chien du mendiant (une par jour) : une aventure annexe s'y cache
    chienJour: 0,      // le jour de la dernière ration
    fontaineJour: 0,   // le jour de la dernière pièce jetée dans la fontaine
    fontainePieces: 0, // combien de pièces dorment au fond (ça servira, plus tard...)
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
    decos: [],         // les décorations achetées à la brocante (visibles dans l'arrière-boutique)
    tenue: [],         // ce que tu portes (acheté à la garde-robe)
    garderobe: [],     // (v0.69) tout ce que tu possèdes : ce que tu ne portes pas dort dans la malle, au pied du lit
    palierVu: 0,       // le plus haut palier de réputation déjà fêté
    palierNouveau: null, // un palier franchi cette nuit : le visiteur notable vient ce matin
    rumeur: null,      // { jour } : moins de clients ce jour-là
    armure: [],        // les pièces de l'Armure du Dernier Rempart déjà reçues
    armesLegendaires: [], // (v0.61) les armes légendaires, une par royaume libéré
    royaumesRecompenses: [], // (v0.61) les royaumes libérés dont la pièce est promise ou livrée
    nouvellesPieces: [], // celles que le messager apporte ce matin : { piece, zone }
    mal: 0,            // la jauge du mal : les âmes que tu as offertes exprès
    reussites: { bien: 0, mal: 0 }, // missions réussies pour chaque camp (la jauge lumière ⟷ ombre)
    lo: { points: 0, journal: [], serment: null, offres: {}, parjures: 0, carrefour: null, parjure: null },   // (v0.90) la balance lumière ⟷ ombre
    objetsCamp: { bien: 0, mal: 0 }, // objets marqués achetés au marché (étape 9c)
    palierJaugeVu: 0,  // le dernier palier de la jauge annoncé par la gazette
    decalageJours: 0,  // (v0.55) les jours de calendrier sautés aux paliers d'étoiles (le joueur grandit)
    paliersEtoiles: [1], // les paliers d'étoiles déjà ouverts
    garde: { visites: 0, dernier: 0, saisies: 0 },   // les visites de la garde de la Confrérie
    interdits: {},     // les objets interdits achetés au marché noir (étape 9e)
    forge: null,       // (v0.82, étape 10b) la forge chez soi : voir etatForge
    belOuvrage: {},    // les armes « bel ouvrage » de la réserve (une partie de G.stock)
    garrickVu: [],     // les visites de Garrick déjà faites
    trophees: [],      // (v0.57) les trophées offerts par les habitués devenus frères de sang
    ainesVus: [],      // (v0.56) les aînés des Bannis passés au comptoir
    ainesRecits: [],   // et ceux dont on a écouté le récit au marché noir
    malCorrige: true,  // (migration de l'audit v0.53 déjà faite)
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
  // (v0.63) son arme à lui : un peu plus d'amitié
  if ((colis[armePour(voyageur)] || 0) > 0 && commandeDe(voyageur)[armePour(voyageur)]) { const m = changerRelation(G, voyageur.nom, RELATION_ARME_PREFEREE); if (m && !message) message = m; }
  // (v0.82) une arme « bel ouvrage » : il l'apprécie, et elle s'usera moins vite
  const belOuvrage = belOuvrageAuDepart(G, voyageur, colis);
  if (belOuvrage.length) { const m = changerRelation(G, voyageur.nom, FORGE.belOuvrage.relation); if (m && !message) message = m; }
  // (la mort voulue se juge sur ce que tu savais : avant le détour imposé par la bande)
  const voulu = mortVoulue(G, voyageur, colis, pieges, chanceVivant(voyageur, colis, pieges));
  // (v0.60) le détour pour la Main Noire (un service rendu)
  const detour = detourMafia(G, voyageur);
  if (detour) message = (message ? message + ' ' : '') + detour;
  const mission = G.faucheuse.mission;
  if (mission && mission.cible.id === voyageur.id) mission.etat = pieges[mission.piege] > 0 ? 'posee' : 'ratee';
  // (v0.90) un piège glissé dans le baluchon : un geste d'ombre
  if (Object.values(pieges).some(n => n > 0)) pencher(G, 'piege', { qui: voyageur.nom });
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
    belOuvrage,
    voulu,
    chance: reelle,
    relationDepart,
    depart: G.jour,
    retour: G.jour + voyageur.duree,
    resultat: null,
    termine: false,
  });
  G.experience++;
  G.journal.servis++;
  G.stats.servis = (G.stats.servis || 0) + 1;   // (v0.85) les vrais clients servis : l'expérience monte aussi la nuit
  connaitre(G, voyageur);
  for (const [id, n] of Object.entries(colis)) G.stats.objets[id] = (G.stats.objets[id] || 0) + n;
  return message;
}

// Les lettres annoncent des voyageurs qui viendront dans 2 ou 3 jours.
function recevoirLettres(G, nombre) {
  for (let i = 0; i < nombre; i++) {
    // Celui qui écrit sait déjà où il veut aller (une zone ouverte).
    const voyageur = voyageurAuHasard(G);
    delete voyageur.quetePerso;   // (sa lettre annonce une autre quête : l'ancienne quête personnelle tombe)
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
    // (v0.63) chez Thorgal : quelques armes chaque matin seulement, et celles des peuples de l'ombre
    // une fois les Bannis venus au comptoir
    const ombreOuverte = G.visiteMarcheNoir !== undefined || (G.zonesConnues || []).some(z => ZONES[z] && ZONES[z].camp === 'mal') || PEUPLES_OMBRE.some(r => peupleAccueilli(G, r));
    const armesDispo = m.objets.filter(id => estArme(id) && !m.toujours.includes(id) && (!ITEMS[id].ombre || ombreOuverte));
    const armesDuJour = Phaser.Utils.Array.Shuffle(armesDispo.slice()).slice(0, ARMES_PAR_ETAL);
    // (celle qu'un client attendu commande est souvent là)
    const attendue = Object.keys(totalCommandes(G)).find(id => estArme(id) && armesDispo.includes(id) && !armesDuJour.includes(id));
    if (attendue && Math.random() < 0.7) armesDuJour[armesDuJour.length - 1] = attendue;
    const rares = m.objets.filter(id => !m.toujours.includes(id) && !estArme(id));
    const manquaient = rares.filter(id => !hier[cle] || !hier[cle][id] || hier[cle][id].qte <= 0);
    // (avec la promesse des marchands, obtenue au premier palier, les raretés sont là chaque jour)
    const presents = rares.filter(id => manquaient.includes(id) || G.bonusEtals || Math.random() < 0.6);
    if (rares.length && !presents.length) presents.push(auHasard(rares));
    presents.push(...armesDuJour);
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
  const forme = reveilDuJour(G).forme === 'remise' ? CHAMBRE.remise : 0;
  const blason = aDecoration(G, 'blason') ? 0.05 : 0;
  const pipe = porte(G, 'pipe') ? 0.02 : 0;
  return (REMISES[niveauRelation(G, MARCHANDS[cle].nom).nom] || 0) + forme + blason + pipe;
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
  if (!peutPayer(G, prix)) return { erreur: manqueArgent(G, prix, "Pas assez d'argent ! Passe à la banque pour un prêt.") };
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
  // Le trèfle du mendiant fait pencher les égalités de ton côté (sans fausser tous les lancers).
  const a = toi[0] + toi[1];
  const b = lui[0] + lui[1];
  const bonus = a === b && aDecoration(G, 'trefle') ? 1 : 0;
  const resultat = a + bonus > b ? 'gagne' : a < b ? 'perdu' : 'egalite';
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
// Une pièce dans la fontaine, une fois par jour : on fait un vœu. Renvoie un message d'erreur, ou null.
function jeterPieceFontaine(G) {
  if (G.fontaineJour === G.jour) return "Tu as déjà fait ton vœu aujourd'hui. La fontaine n'en exauce qu'un par jour.";
  if (!peutPayer(G, 1)) return "Pas une seule pièce à jeter...";
  payer(G, 1, 'fontaine');
  G.fontaineJour = G.jour;
  G.fontainePieces = (G.fontainePieces || 0) + 1;
  return null;
}

// Les lieux du marché ouvrent un par un, les premiers jours : au début, seuls les étals de
// provisions sont là, les autres sont en travaux.
function lieuOuvert(G, cle) {
  const jour = OUVERTURE_LIEUX[cle];
  return !jour || G.jour >= jour;
}

function donnerAuMendiant(G, montant) {
  if (!peutPayer(G, montant)) return null;
  const avant = G.mendiant;
  payer(G, montant, 'dons');
  G.mendiant += montant;
  if (G.mendiantLumiere !== G.jour) { G.mendiantLumiere = G.jour; pencher(G, 'mendiant'); }
  if (avant < MENDIANT_SEUIL && G.mendiant >= MENDIANT_SEUIL && !G.decorations.includes('trefle')) {
    G.decorations.push('trefle');
    return { recit: 'Il fouille dans sa besace et te tend un trèfle séché. Tu reçois le Trèfle du mendiant !', parole: `Tu as un grand cœur, ${eJ(G) ? 'petite marchande' : 'petit marchand'}. Prends ce trèfle, il m'a porté chance autrefois...` };
  }
  return { parole: auHasard([
    'Merci... Que les étoiles veillent sur toi.',
    "Une pièce pour un vieil homme... Je n'oublierai pas ton visage.",
    "Tu es bon. C'est rare, par ici.",
  ]) };
}

// (v0.73) Ce que dit le mendiant et ce qui se passe, séparés : { recit, parole } -> une seule ligne
function texteMendiant(r) {
  return [r.recit, r.parole && `« ${r.parole} »`].filter(Boolean).join(' ');
}

// Donner une ration au chien du mendiant, une fois par jour. Renvoie ce qui se passe, ou null.
function nourrirChien(G) {
  if (G.chienJour === G.jour || !(G.stock.ration > 0)) return null;
  G.stock.ration--;
  G.chienNourri = (G.chienNourri || 0) + 1;
  G.chienJour = G.jour;
  return auHasard([
    { recit: 'Le chien engloutit la ration et pose sa grosse tête sur ton genou.', parole: "Il t'aime bien, lui. Il n'aime personne, d'habitude." },
    { recit: "Le chien remue la queue à s'en décrocher l'échine. Le mendiant sourit dans sa barbe.", parole: 'Doucement, Brisquet !' },
    { recit: 'Brisquet renifle la ration, te regarde longuement, puis la dévore.', parole: 'Il se souviendra de toi. Il se souvient de tout.' },
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
  // Ta bague de marchand inspire confiance dès la première rencontre
  if (!(nom in G.relations)) G.relations[nom] = porte(G, 'bague') ? 1 : 0;
}

// --- La brocante et la garde-robe ---

function porte(G, id) {
  return !!(G.tenue && G.tenue.includes(id));
}

function aDeco(G, id) {
  return !!(G.decos && G.decos.includes(id));
}

function acheterDeco(G, id) {
  if (aDeco(G, id)) return 'Tu l\'as déjà.';
  if (!peutPayer(G, DECOS[id].prix)) return manqueArgent(G, DECOS[id].prix, "Pas assez d'argent.");
  payer(G, DECOS[id].prix, 'decoration');
  G.decos = [...(G.decos || []), id];
  // (une décoration de camp fait pencher la jauge)
  if (DECOS[id].camp) { G.objetsCamp = G.objetsCamp || { bien: 0, mal: 0 }; G.objetsCamp[DECOS[id].camp]++; pencher(G, DECOS[id].camp === 'bien' ? 'decoClaire' : 'decoSombre'); }
  return null;
}

// --- Étape 9c/9d : ce que les clients disent de ton comptoir, selon leur camp et le tien ---
// Renvoie une phrase (dite avant le bonjour) ou null ; peut changer un peu la relation. Une fois
// par jour et par client.
function remarqueCamp(G, v) {
  if (!v || v.remarqueJour === G.jour) return null;
  v.remarqueJour = G.jour;
  const banni = PEUPLES_OMBRE.includes(v.race);
  const decos = (G.decos || []).filter(d => DECOS[d].camp);
  const clair = decos.filter(d => DECOS[d].camp === 'bien'), sombre = decos.filter(d => DECOS[d].camp === 'mal');
  const p = palierCamp(G);
  if (banni && sombre.length && Math.random() < 0.7) { changerRelation(G, v.nom, 1); return `${auHasard(["Ah, ", "Tiens, ", ""])}${auHasard(sombre).startsWith('crane') ? "un crâne de wyverne au mur... Voilà un comptoir qui n'a pas peur des ombres" : "une lanterne-crâne... Enfin un comptoir où l'on respire"} !`; }
  if (banni && clair.length && Math.random() < 0.7) { changerRelation(G, v.nom, -1); return `${auHasard(clair) === 'banniere' ? 'Une bannière de la Confrérie' : "Un chandelier d'argent, comme chez les Gardiens"} ? Ici ? Je surveille mes arrières.`; }
  if (!banni && sombre.length && Math.random() < 0.6) { changerRelation(G, v.nom, -1); return `Brr... ${auHasard(sombre) === 'craneTroll' ? 'ce crâne de wyverne' : 'cette lanterne-crâne'} me donne froid dans le dos.`; }
  if (!banni && clair.length && Math.random() < 0.4) { changerRelation(G, v.nom, 1); return auHasard(["La bannière de la Confrérie ! On est entre gens bien, ici.", "Quelle belle lumière dans ce comptoir."]).replace('La bannière de la Confrérie', clair.includes('banniere') ? 'La bannière de la Confrérie' : "Un chandelier d'argent"); }
  if (!banni && p <= -1 && Math.random() < 0.6) return auHasard(["On raconte des choses sur ton comptoir... J'espère que c'est faux.", "Des Bannis sortaient d'ici hier soir, paraît-il. Ça ne me regarde pas."]);
  if (!banni && p >= 2 && Math.random() < 0.4) return "Ton comptoir a bonne réputation chez la Confrérie !";
  return null;
}

// (v0.69) Ce que tu possèdes (porté ou rangé dans la malle)
function possede(G, id) {
  return (G.garderobe || G.tenue || []).includes(id) || porte(G, id);
}

function acheterTenue(G, id) {
  if (possede(G, id)) return 'Tu l\'as déjà.';
  if (!peutPayer(G, GARDE_ROBE[id].prix)) return manqueArgent(G, GARDE_ROBE[id].prix, "Pas assez d'argent.");
  payer(G, GARDE_ROBE[id].prix, 'garderobe');
  G.garderobe = [...(G.garderobe || G.tenue || []), id];
  G.tenue = [...(G.tenue || []), id];
  return null;
}

// (v0.69) La malle au pied du lit : mettre un vêtement, ou le ranger
function basculerTenue(G, id) {
  if (!possede(G, id)) return "Tu ne l'as pas.";
  G.tenue = porte(G, id) ? G.tenue.filter(x => x !== id) : [...(G.tenue || []), id];
  return null;
}

// (v0.60) Revendre un vêtement ou un accessoire à Marcelline : la moitié de son prix.
function revendreTenue(G, id) {
  if (!possede(G, id)) return "Tu ne l'as pas.";
  const prix = Math.floor(GARDE_ROBE[id].prix / 2);
  G.tenue = (G.tenue || []).filter(x => x !== id);
  G.garderobe = (G.garderobe || []).filter(x => x !== id);
  encaisser(G, prix, 'revente');
  return null;
}

// L'attrait de ce que tu portes et de tes décorations (en clients par jour).
function attraitTenue(G) {
  let a = 0;
  for (const id of G.decos || []) a += DECOS[id].attrait || 0;
  if (porte(G, 'chapeau')) a += 0.2;
  if (porte(G, 'bandana')) a += 0.1;
  if (porte(G, 'cape')) a += 0.2;
  return a;
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
    return `${nom} te considère comme ${feminin ? 'une amie' : 'un ami'} ! En cadeau : 2 fer et 2 cuir.`;
  }
  if (apres.nom === 'Frères de sang') {
    // (v0.57) et un trophée de ses aventures, pour l'étagère de la chambre
    const libres = Object.keys(TROPHEES).filter(id => !(G.trophees || []).some(t => t.id === id));
    const trophee = libres.length ? auHasard(libres) : null;
    if (trophee) G.trophees = [...(G.trophees || []), { id: trophee, de: nom, jour: G.jour }];
    return `${nom} et toi êtes maintenant ${feminin && G.joueur.feminin ? 'sœurs' : feminin || G.joueur.feminin ? 'frère et sœur' : 'frères'} de sang ! ` + offrirDecoration(G, feminin) +
      (trophee ? ` Et pour ta chambre, un trophée de ses aventures : ${TROPHEES[trophee].nom.toLowerCase()}.` : '');
  }
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
  return Math.min(1, G.experience / EXPERIENCE_MAX + (porte(G, 'monocle') ? 0.1 : 0));
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
  const verdict = rapport < 0.35 ? { texte: 'Une affaire en or !', couleur: '#2f7a2a' }
    : rapport < 0.5 ? { texte: 'Bon prix', couleur: '#2f6a2a' }
    : rapport < 0.68 ? { texte: 'Prix correct, sans plus', couleur: '#8a6a10' }
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
  G.dernierDedommagement = { jour: G.jour, nom: v.nom, race: v.race, feminin: !!v.feminin, verse };   // (v0.57 : pour la fin « vengeance »)
  G.reputation += d.reputation;
  if (niveau === 'maximum') pencher(G, 'dedommager', { qui: v.nom });
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
  // (v0.63) des armes, seulement l'épée : les autres, c'est chez Thorgal
  const courants = Object.keys(ITEMS).filter(id => !estArme(id) || id === 'epee');
  const autres = Phaser.Utils.Array.Shuffle(courants.filter(id => !ITEMS[id].base));
  const ids = multiplicateur > 1
    ? Phaser.Utils.Array.Shuffle(courants.slice()).slice(0, hasard(3, 4))
    : [...courants.filter(id => ITEMS[id].base), ...autres.slice(0, hasard(1, nbAutres))];
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

// (v0.84) Pas assez d'argent : en plus du message de la page, une grande alerte bien visible dans
// le bandeau (combien il manque), pour ne plus passer à côté
function manqueArgent(G, prix, texte) {
  const manque = Math.max(1, Math.ceil(prix - G.argent));
  if (typeof window !== 'undefined' && window.jeu && window.jeu.events) window.jeu.events.emit('manqueArgent', manque);
  return texte;
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
  if (!peutPayer(G, s.prix)) return manqueArgent(G, s.prix, "Pas assez d'argent.");
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
  // Les intérêts ne portent que sur ta vraie fortune : l'argent emprunté (encore dû) ne rapporte rien.
  const dette = G.prets.reduce((s, p) => s + p.restant, 0);
  const fortune = G.argent - dette;
  if (coffre && fortune > 0) encaisser(G, Math.min(15 * coffre, Math.floor(fortune * 0.01 * coffre)), 'interets');
  G.experience += niveauAmelioration(G, 'chambre') + (porte(G, 'montre') ? 1 : 0);
}

// Peut-on contracter ce prêt ? Renvoie la raison sinon.
function refusPret(G, pret) {
  if (G.prets.some(p => p.id === pret.id)) return 'Déjà en cours';
  if (G.reputation < pret.reputation) return `Réputation ${pret.reputation} requise`;
  return null;
}

function emprunter(G, pret) {
  if (refusPret(G, pret)) return;
  const du = Math.round(pret.somme * (1 + tauxPret(G, pret)));
  // Un prêt n'est pas une recette : il est compté à part.
  G.argent += pret.somme;
  compter(G, 'pret', 'prets', pret.somme);
  G.prets.push({ id: pret.id, preteur: pret.preteur, nom: pret.nom, restant: du, parJour: Math.ceil(du / pret.jours) });
  if (pret.preteur === 'La Main Noire') engagerMafia(G);   // (v0.60) on lui appartient un peu, désormais
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
  // (v0.64) les armes, rangées ensemble au râtelier, ne comptent que pour une sorte
  const variete = Object.entries(G.stock).filter(([id, n]) => n > 0 && !estArme(id)).length + (IDS_ARMES.some(id => G.stock[id] > 0) ? 1 : 0);
  return {
    reputation: G.reputation * 0.4,
    experience: Math.min(G.experience, EXPERIENCE_MAX) / 20,
    variete: variete * CLIENTS_PAR_OBJET,
    decoration: aDecoration(G, 'trophee') ? 0.7 : 0,
    armes: (G.armesLegendaires || []).length * ATTRAIT_ARME_LEGENDAIRE,
    eclairage: niveauAmelioration(G, 'eclairage') * 0.3,
    // la base (réputation, expérience) est plafonnée par le palier ; les bonus passent par-dessus
    base: 1 + G.reputation * 0.4 + Math.min(G.experience, EXPERIENCE_MAX) / 20,
    bonus: variete * CLIENTS_PAR_OBJET + (aDecoration(G, 'trophee') ? 0.7 : 0) + niveauAmelioration(G, 'eclairage') * 0.3 + attraitTenue(G)
      + (G.armesLegendaires || []).length * ATTRAIT_ARME_LEGENDAIRE,
    total: 1 + G.reputation * 0.4 + Math.min(G.experience, EXPERIENCE_MAX) / 20 + variete * CLIENTS_PAR_OBJET + (aDecoration(G, 'trophee') ? 0.7 : 0)
      + niveauAmelioration(G, 'eclairage') * 0.3 + (G.armesLegendaires || []).length * ATTRAIT_ARME_LEGENDAIRE,
  };
}

// La fourchette de clients attendus un jour donné (par défaut : demain).
// Le vrai nombre est tiré à l'ouverture du comptoir : un stock varié acheté le matin attire encore du monde.
function prevision(G, jour = G.jour + 1) {
  const annonces = G.annonces.filter(a => a.jour === jour && a.acceptee).length;
  const a = attrait(G);
  const evenements = modifEvenement(G, 'clients', null, jour);
  const rumeur = G.rumeur && G.rumeur.jour === jour ? -RUMEUR_CLIENTS : 0;
  // Les clients « de passage » ; ceux des lettres viennent en plus.
  // La base (réputation et expérience) est plafonnée par le palier de réputation...
  const palier = palierClients(G);
  let min = Phaser.Math.Clamp(Math.floor(a.base), 1, palier.max);
  let max = Math.min(palier.max, min + 2);
  // ... et les bonus (stock varié, trophée, éclairage) passent par-dessus, jusqu'à +2,
  // comme les événements et la rumeur (qui peuvent aussi en retirer).
  const bonus = Math.min(BONUS_CLIENTS_MAX, Math.floor(a.bonus)) + evenements + rumeur;
  // Réveillé en forme ce matin : un client de plus
  const forme = G.reveil && G.reveil.jour === jour && G.reveil.forme === 'client' ? 1 : 0;
  min = Math.max(1, min + bonus + forme);
  max = Math.max(min, max + bonus + forme);
  // (v0.60) les premiers jours : pas trop de monde, mais au moins deux clients (le rythme des débuts)
  if (jour <= CLIENTS_DEBUT.jours) { min = Math.max(2, Math.min(min, CLIENTS_DEBUT.max)); max = Math.max(min, Math.min(max, CLIENTS_DEBUT.max)); }
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
  for (const [id, n] of Object.entries(commande)) {
    voulu += n;
    // Un objet durable qu'il a déjà, en bon état, compte comme fourni.
    const dejaLa = ITEMS[id] && ITEMS[id].durable && (estArme(id) ? etatArme(v) : etatObjet(v, id)) >= 2 ? n : 0;
    donne += Math.min(n, (colis ? fourni(v, colis, id) : 0) + dejaLa);
  }
  return voulu ? donne / voulu : 1;
}

// (v0.57) Pourquoi la faillite ? La cause la plus grave du moment décide de la fin :
// une dette à la Main Noire, sinon une dette à la banque, sinon un dédommagement trop lourd payé
// ces trois derniers jours (la famille vient se venger), sinon la simple mauvaise gestion.
function causeFaillite(G) {
  if ((G.prets || []).some(p => p.preteur === 'La Main Noire')) return { type: 'mainNoire' };
  if ((G.prets || []).length) return { type: 'banque' };
  const d = G.dernierDedommagement;
  if (d && G.jour - d.jour <= 3) return { type: 'vengeance', nom: d.nom, race: d.race, feminin: !!d.feminin };
  return { type: 'gestion' };
}

// La nuit : échéances des prêts, puis le matin d'un nouveau jour (le marché).
// (v0.60) Le loyer du comptoir : le bourgmastre loue les murs, et réévalue le bail à mesure que
// le comptoir prospère (un palier de réputation de plus, et le loyer monte). Payé en fin de semaine.
// (v0.60) Une seule règle pour la Main Noire : assez d'âmes offertes, la jauge bien à l'Ombre,
// ou le camp scellé du côté de l'ombre
function mainNoireOuverte(G) {
  if (typeof mafia === 'function' && mafia(G).sorti) return false;   // (dénoncée ou quittée : elle ne te prête plus)
  return G.camp === 'mal' || G.mal >= SEUIL_MAIN_NOIRE || palierCamp(G) <= -2;
}
const LOYER = { base: 20, parPalier: 15 };
const CONVALESCENCE_PAR_COEUR = 2;
const CHANCE_GRATITUDE = 0.4, CHANCE_INTERDIT_OMBRE = 0.35, CHANCE_GARDE_OMBRE = 0.25;
const CADEAUX_VILLAGES = [['ration', 2], ['potion', 1], ['bandage', 2], ['gourde', 1], ['torche', 2], ['antidote', 1]];   // (v0.60) jours de repos par cœur perdu, pour un blessé revenu de mission
function loyerSemaine(G) {
  return LOYER.base + LOYER.parPalier * palierClients(G).index;
}
function jourDeLoyer(G, jour = G.jour) { return jour % 7 === 0; }

// Ce qui sera prélevé cette nuit (prêts, salaires, loyer), pour prévenir le joueur le soir.
function depensesDeLaNuit(G) {
  const prets = G.prets.reduce((s, p) => s + Math.min(p.parJour, p.restant), 0);
  return prets + salaires(G) + (jourDeLoyer(G) ? loyerSemaine(G) : 0);
}

function nuit(G) {
  payerEcheances(G);
  // Les employés sont payés chaque nuit.
  for (const id of G.employes) { payer(G, EMPLOYES[id].salaire, 'salaires'); G.salairesPar = G.salairesPar || {}; G.salairesPar[id] = (G.salairesPar[id] || 0) + EMPLOYES[id].salaire; }
  // Le loyer, en fin de semaine
  let loyer = 0;
  if (jourDeLoyer(G)) { loyer = loyerSemaine(G); payer(G, loyer, 'loyer'); }
  if (G.argent <= SEUIL_FAILLITE) {
    G.faillite = true;
    G.causeFaillite = causeFaillite(G);
    return;
  }
  nuitDuShop(G);
  nuitDeLaForge(G);
  // Une mission de sabotage manquée (cible servie sans le piège, refusée, ou jamais venue) :
  // la Faucheuse reprend son objet piégé et sa faveur baisse, sans attendre le prochain mort.
  const mission = G.faucheuse && G.faucheuse.mission;
  if (mission && mission.etat !== 'proposee' && mission.etat !== 'posee' && mission.jour <= G.jour) {
    G.faucheuse.faveur -= 1;
    if (G.pieges[mission.piege] > 0) G.pieges[mission.piege]--;
    G.faucheuse.mission = null;
  }
  G.express = offreDuJour(MARCHAND_EXPRESS.multiplicateur, 3, 1, 2);
  G.expressMateriaux = materiauxExpress();
  const mauvaisJour = G.journal.morts > 0 || G.argent <= SEUIL_FAILLITE + 30;
  // La taxe de la Confrérie, en fin de semaine
  let taxe = 0;
  if (G.jour % 7 === 0) {
    const p = palierCamp(G);
    const dette = G.prets.reduce((s, x) => s + x.restant, 0);   // (audit v0.54 : l'argent emprunté n'est pas taxé)
    taxe = Math.round(Math.max(0, G.argent - dette - TAXE_CONFRERIE.franchise) * TAXE_CONFRERIE.taux[p > 0 ? 'lumiere' : p < 0 ? 'ombre' : 'neutre']);
    if (taxe > 0) payer(G, taxe, 'taxe');
  }
  if (G.feu === G.jour) G.nuitAuChaud = G.jour + 1;   // (v0.66 : la nuit au chaud, pour le réveil)
  G.jour++;
  G.argentDebutJour = G.argent;
  G.journal = { servis: 0, retours: 0, morts: 0, echecs: 0 };
  G.etals = etalsDuJour(G);
  G.etalsJour = G.jour;
  G.jeux = { des: 0, bonneteau: 0 };
  avancerAtelier(G);
  // Un palier de réputation franchi : la gazette en parlera, et un visiteur notable viendra.
  const palier = palierClients(G).index;
  if (palier > (G.palierVu || 0)) { G.palierVu = palier; G.palierNouveau = palier; }
  avancerEvenements(G);
  // Le sort de ceux qui rentrent aujourd'hui est tiré pendant la nuit (et donc sauvegardé).
  for (const p of G.partis) if (!p.termine && p.retour === G.jour && !p.resultat) p.resultat = simulerAventure(p.voyageur, p.colis, p.pieges);
  reveilDuMatin(G, mauvaisJour);
  // (v0.60) la gratitude des villages de lumière : un panier devant la porte
  for (const c of G.cadeauxVillages || []) {
    const [id, n] = auHasard(CADEAUX_VILLAGES);
    G.stock[id] = (G.stock[id] || 0) + n;
    const nom = ITEMS[id].nom.toLowerCase();
    G.reveil.lignes.push(`Un panier devant la porte, de la part ${ZONES[c.zone] ? 'des gens ' + deLieu(ZONES[c.zone].nom) : 'd\'un village'} : ${n} ${nom}${n > 1 && !/[sx]$/.test(nom) ? 's' : ''}, pour te remercier d'avoir aidé ${c.nom.split(' ')[0]}.`);
  }
  G.cadeauxVillages = [];
  for (const l of nuitMafia(G)) G.reveil.lignes.push(l);
  // (v0.86) les imposteurs servis hier : on apprend ce qu'est devenu ton baluchon
  for (const a of (G.arnaques || []).filter(a => !a.dit)) { G.reveil.lignes.push(a.texte); a.dit = true; }
  G.arnaques = (G.arnaques || []).filter(a => a.jour >= G.jour - 7);
  for (const l of nuitDuChat(G)) G.reveil.lignes.unshift(l);   // (v0.65) les rats, ou le cadeau du chat (v0.84 : en premier, pour ne pas le rater)
  if (G.forge && G.forge.construite && G.forge.nouvelle) { G.reveil.lignes.push("Les ouvriers ont monté ta forge dans l'arrière-boutique : le foyer, le soufflet, l'enclume. Il ne manque plus qu'un forgeron !"); G.forge.nouvelle = false; }
  if (nouvellesDeLaForge(G)) G.reveil.lignes.push(nouvellesDeLaForge(G));   // (v0.82) les armes sorties de la forge
  if (loyer > 0) G.reveil.lignes.push(`Le bourgmastre a encaissé le loyer de la semaine : ${loyer} pièces.` + (loyer > (G.dernierLoyer || loyer) ? ' Le bail a augmenté : ton comptoir a pris de la valeur.' : ''));
  if (loyer > 0) G.dernierLoyer = loyer;
  if (taxe > 0) G.reveil.lignes.push(`Un percepteur de la Confrérie est passé : ${taxe} pièces de taxe « pour la défense contre le dragon ».`);
  // Plus d'argent ni de provisions : Garrick laisse de quoi repartir (pas trop souvent)
  const stock = Object.values(G.stock || {}).reduce((a, n) => a + n, 0);
  if (G.argent < COUP_DE_POUCE.argent && stock < COUP_DE_POUCE.stock && G.jour - (G.coupDePouce || -99) >= COUP_DE_POUCE.delai) {
    G.coupDePouce = G.jour;
    for (const [id, n] of Object.entries(COUP_DE_POUCE.cadeau)) G.stock[id] = (G.stock[id] || 0) + n;
    G.reveil.lignes.push("Au réveil, des provisions sur le pas de la porte : deux rations, une gourde, une torche. Un mot : « Tiens bon, petit. — G. »");
  }
  recompenserZones(G);
  // (v0.55) Un nouveau palier d'étoiles vient de s'ouvrir : le temps passe, le joueur grandit
  G.paliersEtoiles = G.paliersEtoiles || [1];
  for (const z of zonesOuvertes(G)) {
    const d = ZONES[z].danger;
    if (G.paliersEtoiles.includes(d) || !SAUTS_TEMPS[d]) continue;
    G.paliersEtoiles.push(d);
    const avant = ageJoueur(G);
    G.decalageJours = (G.decalageJours || 0) + SAUTS_TEMPS[d];
    const mois = Math.round(SAUTS_TEMPS[d] / JOURS_PAR_MOIS);
    G.sautTemps = { danger: d, mois, ageAvant: avant, ageApres: ageJoueur(G) };
    if (d === FORGE.etoiles && !(G.forge && G.forge.construite)) G.reveil.lignes.push("Garrick passe en coup de vent : « Tu as grandi, et ton comptoir aussi. Il y a de la place dans l'arrière-boutique pour une forge : avec un forgeron, tu aurais toutes les armes que tu veux, quand tu veux. Penses-y ! »");
    if (d === FORGE.forgerons.baba.etoiles && G.forge && G.forge.construite && !G.forge.baba) G.reveil.lignes.push("Une naine aux tresses noires frappe à la porte de ta forge : Baba Marteau-d'Or cherche du travail. Elle t'attend dans l'arrière-boutique.");
    G.reveil.lignes.push(`Les saisons ont passé : ${mois >= 4 ? `${Math.round(mois / 4)} an${mois >= 8 ? 's' : ''}` : `${mois} mois`} plus tard, les contrées à ${d} étoiles s'ouvrent à tes aventuriers.` + (ageJoueur(G) > avant ? ` Tu as maintenant ${ageJoueur(G)} ans.` : ''));
  }
  // On oublie les aventures terminées depuis un moment (la sauvegarde reste légère) :
  // le registre (historique) en garde le résumé.
  G.partis = G.partis.filter(p => !p.termine || p.retour >= G.jour - 2);
  for (const j of Object.keys(G.compta)) if (j < G.jour - JOURS_DE_COMPTES) delete G.compta[j];
  surveillerLO(G);   // (v0.90) le Carrefour ou le parjure, s'il le faut
}

// Le réveil : ce que la chambre t'apporte ce matin (voir CHAMBRE dans data.js).
function reveilDuMatin(G, mauvaisJour) {
  const n = niveauAmelioration(G, 'chambre');
  const r = G.reveil = { jour: G.jour, forme: null, reve: null, encheres: null, reconfort: 0, lignes: [] };
  // En forme : un client de plus, ou une remise au marché
  const auChaud = G.nuitAuChaud === G.jour;   // (v0.66 : le feu de cheminée a brûlé cette nuit)
  if (auChaud) r.lignes.push(chatAdopte(G) ? `Le feu a crépité toute la nuit ; ${nomChat(G)} a dormi devant les braises. Tu te réveilles bien reposé${eJ(G)}.` : `Le feu a crépité toute la nuit : tu te réveilles bien reposé${eJ(G)}.`);
  const chanceForme = CHAMBRE.forme * n + (auChaud ? CHEMINEE.forme : 0);
  if (chanceForme && Math.random() < chanceForme) {
    r.forme = Math.random() < 0.5 ? 'client' : 'remise';
    r.lignes.push(r.forme === 'client' ? `Tu t'es réveillé${eJ(G)} en pleine forme : tu serviras un client de plus aujourd'hui !`
      : `Tu t'es réveillé${eJ(G)} en pleine forme : les marchands te feront ${Math.round(CHAMBRE.remise * 100)} % de remise aujourd'hui !`);
  }
  // Un rêve qui révèle quelque chose
  if (n >= 2 && Math.random() < CHAMBRE.reve * (n - 1)) {
    const reves = [];
    const rentre = G.partis.find(p => !p.termine && p.retour === G.jour && p.resultat);
    if (rentre) reves.push(() => `Tu as rêvé ${dePersonne(rentre.voyageur.nom)}... ${rentre.resultat.vivant ? (rentre.resultat.echec ? `Tu l'as vu${rentre.voyageur.feminin ? 'e' : ''} revenir les mains vides, mais vivant${rentre.voyageur.feminin ? 'e' : ''}.` : `Tu l'as vu${rentre.voyageur.feminin ? 'e' : ''} revenir, les bras chargés !`) : 'Tu as vu la Faucheuse marcher à ses côtés...'}`);
    const avenir = (G.evenements || []).find(e => e.debut > G.jour && EVENEMENTS[e.id]);
    if (avenir) reves.push(() => `Un rêve étrange : « ${EVENEMENTS[avenir.id].nouvelle} » Ça arrivera dans ${avenir.debut - G.jour} jour${avenir.debut - G.jour > 1 ? 's' : ''}.`);
    reves.push(() => { r.encheres = auHasard(Object.keys(CATEGORIES)); const pluriel = { arme: 'armes', armure: 'armures', bijou: 'bijoux', artefact: 'artefacts', vetement: 'vêtements' }[r.encheres]; return `Tu as rêvé d'enchérisseurs qui se disputaient... Les ${pluriel} se vendront cher aux enchères aujourd'hui !`; });
    r.reve = auHasard(reves)();
    r.lignes.push(r.reve);
  }
  // Après un mauvais jour, une bonne nuit console
  if (mauvaisJour && (n || porte(G, 'echarpe'))) {
    r.reconfort = Math.round((CHAMBRE.reconfort * n + (porte(G, 'echarpe') ? 0.1 : 0)) * 100) / 100;
    G.reputation += r.reconfort;
    r.lignes.push(`Une bonne nuit de sommeil t'a aidé${eJ(G)} à encaisser la mauvaise journée d'hier : réputation +${String(r.reconfort).replace('.', ',')}.`);
  }
}

// Le réveil de ce matin (vide si on n'en a pas eu).
function reveilDuJour(G) {
  return G.reveil && G.reveil.jour === G.jour ? G.reveil : { lignes: [] };
}

// Les nouvelles du matin : l'atelier, et ce que la nuit t'a apporté.
function nouvellesDuMatin(G) {
  return [...(G.nouvellesAtelier || []), ...reveilDuJour(G).lignes];
}

// (v0.60) Le hasard d'une journée est fixé par une graine propre à la partie : recharger la
// sauvegarde du matin redonne exactement les mêmes clients (on ne peut plus « retirer » sa journée).
function aleaGraine(n) {
  return () => { n = (n + 0x6D2B79F5) | 0; let t = Math.imul(n ^ (n >>> 15), 1 | n); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function avecGraine(G, sel, fn) {
  if (!G.graine) G.graine = Math.floor(Math.random() * 1e9);
  let h = G.graine | 0;
  for (const ch of String(sel)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const avant = Math.random;
  Math.random = aleaGraine(h);
  try { return fn(); } finally { Math.random = avant; }
}

// --- (v0.86, lot A-1) La journée au comptoir ---
function heureFermeture(G) { return JOURNEE.fermeture + JOURNEE.parEclairage * niveauAmelioration(G, 'eclairage'); }
function dureeService(G) {
  const k = JOURNEE.seuilsService.filter(s => (G.experience || 0) >= s).length;
  return JOURNEE.service[k];
}
// « 9 h », « 9 h 15 », et les durées « ¼ h », « ½ h », « ¾ h », « 1 h »...
function formatHeure(h) {
  const hh = Math.floor(h + 1e-6), mm = Math.round((h - hh) * 60);
  return `${hh} h${mm ? ' ' + String(mm).padStart(2, '0') : ''}`;
}
function formatDuree(d) {
  const entier = Math.floor(d + 1e-6), reste = Math.round((d - entier) * 4);
  const frac = ['', '¼', '½', '¾'][reste] || '';
  return entier ? `${entier}${frac ? ' ' + frac : ''} h` : `${frac} h`;
}
function heureDuComptoir(G) { if (typeof G.heure !== 'number') G.heure = JOURNEE.ouverture; return G.heure; }
function avancerHeure(G, d) { G.heure = heureDuComptoir(G) + d; return G.heure; }
// À la fermeture : ceux qui avaient écrit reviendront demain matin, en tête de file ; les imprévus
// repartent (ils retenteront leur chance un autre jour). Le colporteur remballe. Ce qu'un client
// mis en attente avait déjà dans son baluchon revient dans ta réserve. Les retours de mission, les
// visites et les carnets passent quand même : on frappe au volet.
function fermerLeComptoir(G) {
  const reviennent = [], repartent = [];
  const cible = G.faucheuse && G.faucheuse.mission ? G.faucheuse.mission.cible : null;
  G.file = G.file.filter(e => {
    if (e.type === 'colporteur') return false;
    if (e.type !== 'client') return true;
    if (cible && e.voyageur === cible) return true;   // (la cible de la Faucheuse ne rate pas son rendez-vous)
    for (const [id, n] of Object.entries(e.colis || {})) {
      const p = (e.pieges || {})[id] || 0;
      G.stock[id] = (G.stock[id] || 0) + n - p;
      if (p) G.pieges[id] = (G.pieges[id] || 0) + p;
    }
    delete e.colis; delete e.pieges;
    if (e.voyageur.prevu && !e.voyageur.recherche) reviennent.push(e.voyageur);
    else repartent.push(e.voyageur);
    return false;
  });
  G.reportes = [...(G.reportes || []), ...reviennent];
  return { reviennent, repartent };
}

// On ouvre le comptoir : la file d'attente du jour se forme.
function ouvrirComptoir(G) {
  // (une seule fois par jour : un double clic ne doit pas refaire la file)
  if (G.fileDuJour === G.jour) return;
  return avecGraine(G, 'comptoir' + G.jour, () => formerFileDuJour(G));
}
function formerFileDuJour(G) {
  G.fileDuJour = G.jour;
  const { min, max } = prevision(G, G.jour);
  // Les clients du jour : ceux qui ont écrit, plus des imprévus.
  // Une lettre restée sans réponse le jour venu : l'aventurier est allé ailleurs, et il s'en souviendra.
  for (const a of G.annonces.filter(x => x.jour === G.jour && !x.acceptee)) refuserLettre(G, a);
  const prevus = G.annonces.filter(a => a.jour === G.jour).map(a => a.voyageur);
  G.annonces = G.annonces.filter(a => a.jour !== G.jour);
  const imprevus = hasard(min, max); // (les clients des lettres viennent en plus)
  const clients = [...prevus.map(v => ({ ...v, prevu: true }))];
  for (let i = 0; i < imprevus; i++) clients.push(voyageurAuHasard(G, [...clients, ...(G.reportes || [])]));
  deguiserClients(G, clients, prevus.length);   // (v0.86) parmi les imprévus, un menteur... ou un honnête qui en a l'air
  const file = Phaser.Utils.Array.Shuffle(clients.map(v => ({ type: 'client', voyageur: v })));

  // Les aventuriers dont la quête se termine aujourd'hui reviennent...
  // ... les autres, c'est la Faucheuse qui vient les annoncer, tout au bout de la file.
  // Ceux qui reviennent de mission passent en premier : tu touches leur part tout de suite.
  const morts = [], retours = [];
  for (const p of G.partis) {
    if (p.termine || p.retour !== G.jour) continue;
    // (le sort est tiré dès la nuit, et sauvegardé : recharger la partie ne le change pas)
    if (!p.resultat) p.resultat = simulerAventure(p.voyageur, p.colis, p.pieges);
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
  // Un client prestigieux, certains jours (dès que les nobles s'intéressent à toi).
  if (G.prestige && Math.random() < CHANCE_PRESTIGE) {
    const pris = [...nomsActifs(G), ...clients.map(v => v.nom)];
    const libres = PRESTIGIEUX.filter(p => !pris.includes(p.nom) && !(G.personnes[p.nom] && G.personnes[p.nom].mort));
    if (libres.length) {
      const p = auHasard(libres);
      const type = auHasard(Object.keys(EXIGENCES));
      const v = creerVoyageur(G, { ...p, niveau: auHasard(['veteran', 'veteran', 'heros']), envie: auHasard(['gloire', 'or']) });
      v.prestige = { type, objet: type === 'objet' ? auHasard(OBJETS_EXIGES) : null };
      file.splice(hasard(0, file.length), 0, { type: 'client', voyageur: v });
    }
  }
  // Un palier franchi cette nuit : le visiteur notable passe juste après les retours de mission.
  const notables = G.palierNouveau ? [{ type: 'notable', palier: G.palierNouveau }] : [];
  // Le colporteur, certains jours, se glisse dans la file avec sa hotte.
  if (G.colporteur && Math.random() < CHANCE_COLPORTEUR) {
    G.colporteurOffre = offreDuJour(COLPORTEUR.multiplicateur, 3, 1, 2);
    file.splice(hasard(0, file.length), 0, { type: 'colporteur' });
  }
  // Garrick repasse certains jours prendre des nouvelles ; la garde vient quand le comptoir a mauvaise réputation
  const visites = [];
  const g = GARRICK_VISITES.findIndex(x => x.jour === G.jour);
  if (g >= 0 && !(G.garrickVu || []).includes(g)) visites.push({ type: 'garrick', i: g });
  // (v0.90) deux pièces avant la fin de l'armure, Garrick vient prévenir : à la dernière, le camp sera scellé
  else if (G.armure.length === ARMURE.length - 2 && !G.garrickSceau && !G.camp) visites.push({ type: 'garrick', sceau: true });
  if (doitVenirGarde(G)) visites.push({ type: 'garde', garde: gardeDuJour(G) });
  visites.push(...visitesMafia(G));   // (v0.60) le collecteur de la Main Noire, le Serpent à deux têtes
  // (v0.56) Très rarement, à partir du milieu du jeu, un aîné des Bannis passe et laisse une phrase
  const aine = aineDuJour(G, 'comptoir');
  if (aine) { G.ainesVus = [...(G.ainesVus || []), aine]; file.splice(hasard(0, file.length), 0, { type: 'aine', race: aine }); }
  // (v0.86) une tête mise à prix (ou son sosie), environ une fois par semaine
  const recherche = rechercheDuJour(G, file.filter(e => e.type === 'client').map(e => e.voyageur.nom));
  if (recherche) file.splice(hasard(0, file.length), 0, { type: 'client', voyageur: recherche });
  // (v0.86) ceux qui t'avaient écrit et n'ont pas pu passer hier avant la fermeture : en tête de file
  const reportes = (G.reportes || []).map(v => ({ type: 'client', voyageur: v, reporte: true }));
  G.reportes = [];
  G.file = [...retours, ...reportes, ...notables, ...visites, ...file];
}

// --- Étape 9e : le marché noir ---

// Un aîné des Bannis aujourd'hui ? `ou` : 'comptoir' (une phrase, chacun une seule fois) ou
// 'marcheNoir' (son récit, chacun une seule fois). Rien avant le milieu du jeu.
function aineDuJour(G, ou) {
  if (G.jour < AINES_JOUR || Math.random() >= AINES_CHANCE[ou]) return null;
  const deja = ou === 'comptoir' ? (G.ainesVus || []) : (G.ainesRecits || []);
  const restants = Object.keys(AINES).filter(r => !deja.includes(r));
  return restants.length ? auHasard(restants) : null;
}

// La personne d'un aîné (pour son corps et son buste de vieillard)
function personneAine(race) {
  const a = AINES[race];
  return { nom: a.nom, race, feminin: a.feminin, vieux: true, niveau: 'aguerri' };
}

function marcheNoirCeSoir(G) { return !!(G.marcheNoir && G.marcheNoir.jour === G.jour); }

// Les affaires de la soirée : deux Bannis, chacun commande un objet interdit
function soireeMarcheNoir(G) {
  if (G.marcheNoir.soiree) return G.marcheNoir.soiree;
  const races = Phaser.Utils.Array.Shuffle([...PEUPLES_OMBRE]).slice(0, 2);
  const bannis = races.map(race => { const [nom, feminin] = auHasard(NOMS[race]); return { nom, race, feminin, niveau: 'aguerri' }; });
  const commandes = bannis.map(b => { const id = auHasard(interditsCommandables(G)); return { banni: b, objet: id, prix: hasard(...INTERDITS[id].vente), faite: false }; });
  // (v0.56) parfois, un aîné est là ce soir, et raconte
  const aine = aineDuJour(G, 'marcheNoir');
  G.marcheNoir.soiree = { bannis, commandes, risque: 0, murmure: auHasard(MURMURES), aine };
  for (const b of bannis) G.personnes = { ...(G.personnes || {}), [b.nom]: { race: b.race, feminin: b.feminin } };
  return G.marcheNoir.soiree;
}

function acheterInterdit(G, id) {
  const o = INTERDITS[id];
  if (!peutPayer(G, o.prix)) return manqueArgent(G, o.prix, "Pas assez d'argent.");
  payer(G, o.prix, 'marcheNoir');
  G.interdits[id] = (G.interdits[id] || 0) + 1;
  soireeMarcheNoir(G).risque += MARCHE_NOIR.risqueAchat;
  return null;
}

function honorerCommande(G, c) {
  if (c.faite) return 'Déjà fait.';
  if (!(G.interdits[c.objet] > 0)) return `Il te faut : ${INTERDITS[c.objet].nom.toLowerCase()} (le Passeur en vend).`;
  G.interdits[c.objet]--;
  c.faite = true;
  encaisser(G, c.prix, 'marcheNoir');
  changerRelation(G, c.banni.nom, 2);
  G.objetsCamp.mal = (G.objetsCamp.mal || 0) + MARCHE_NOIR.ombreAffaire;
  pencher(G, 'commande', { qui: c.banni.nom });
  soireeMarcheNoir(G).risque += MARCHE_NOIR.risqueCommande;
  return null;
}

function prixTresorMarcheNoir(t) { return Math.round(valeurTresor(t) * MARCHE_NOIR.venteTresor); }

function vendreTresorMarcheNoir(G, t) {
  const prix = prixTresorMarcheNoir(t);
  G.tresors = G.tresors.filter(x => x !== t);
  encaisser(G, prix, 'marcheNoir');
  soireeMarcheNoir(G).risque += MARCHE_NOIR.risqueVente;
  return prix;
}

// En remontant : quelqu'un a-t-il vu la lanterne ? (la garde viendra demain)
function quitterMarcheNoir(G) {
  const s = soireeMarcheNoir(G);
  G.marcheNoirVisites = (G.marcheNoirVisites || 0) + 1;
  const plainte = Math.random() < s.risque;
  if (plainte) G.gardeDemain = true;
  s.risque = 0;
  return plainte;
}

// --- Étape 9d : la garde ---

// La garde vient-elle ce matin ? Après une plainte (le marché noir), ou par surprise quand ton
// comptoir penche vers l'ombre (et plus souvent avec des décorations sombres au mur).
function doitVenirGarde(G) {
  G.garde = G.garde || { visites: 0, dernier: 0, saisies: 0 };
  if (G.gardeDemain) { G.gardeDemain = false; return true; }
  if (G.gardeTiree === G.jour) return false;   // (v0.65 : déjà tirée la veille au soir, pour le chat)
  return gardeAuHasard(G);
}
function gardeAuHasard(G) {
  if (G.jour < 8 || G.jour - (G.garde.dernier || 0) < GARDE.delai) return false;
  const p = palierCamp(G);
  if (p >= 0) return false;
  const sombres = (G.decos || []).filter(d => DECOS[d].camp === 'mal').length;
  // (v0.90) un serment aux Bannis : la Confrérie te surveille de près
  return Math.random() < GARDE.chance + GARDE.parPalier * (-p - 1) + GARDE.parDeco * sombres + (sermentDe(G) === 'mal' ? SERMENT.surveillance : 0);
}

// Le garde qui accompagne le capitaine aujourd'hui (un peuple de la lumière)
function gardeDuJour(G) {
  const race = auHasard(GARDE.peuples);
  const nom = auHasard(GARDE.noms[race]);
  return { nom, race, feminin: /Odette|Hilde|Ilwen|Marguerite|Lan /.test(nom), garde: true, costume: 'garde', niveau: 'aguerri' };
}

// L'amende : un pourcentage de la bourse, au moins le minimum
function amendeGarde(G) {
  return Math.max(GARDE.amendeMin, Math.round(Math.max(0, G.argent) * GARDE.amendePart));
}

// --- (v0.65, étape 10c) Le chat de gouttière ---
function chatDe(G) { return (G.chat = G.chat || { soirs: [], adopte: false, nom: '', look: null, vu: 0, present: false }); }
function chatAdopte(G) { return !!(G.chat && G.chat.adopte); }
// Rôde-t-il devant le shop ce soir ? (tiré une fois par soir : recharger ne change rien)
function chatCeSoir(G) {
  const c = chatDe(G);
  if (c.adopte) return false;
  if (c.vu !== G.jour) { c.vu = G.jour; c.present = G.jour >= CHAT.jourMin && Math.random() < (c.soirs.length ? CHAT.chanceRevient : CHAT.chanceSoir); }
  return c.present;
}
// Lui donner une ration. Renvoie { erreur } ou { soirs, adopte }.
function nourrirChat(G) {
  const c = chatDe(G);
  if (!chatCeSoir(G)) return { erreur: "Il n'y a pas de chat ce soir." };
  if (c.soirs.includes(G.jour)) return { erreur: 'Il a déjà eu sa ration ce soir. Il te regarde, repu.' };
  if ((G.stock.ration || 0) <= 0) return { erreur: "Tu n'as plus une seule ration à lui donner." };
  G.stock.ration--;
  c.soirs.push(G.jour);
  if (c.soirs.length >= CHAT.soirsPourAdopter) {
    c.adopte = true; c.present = false; c.adopteJour = G.jour;
    c.look = c.look || { pelage: 'gris', yeux: 'vert', collier: 'aucun' };
  }
  return { soirs: c.soirs.length, adopte: c.adopte };
}
function lookChat(G) { const c = chatDe(G); return c.look || { pelage: 'gris', yeux: 'vert', collier: 'aucun' }; }
function nomChat(G) { return (G.chat && G.chat.nom) || 'ton chat'; }
// La nuit : sans chat, des rats grignotent parfois les provisions ; avec lui, plus de rats (et parfois un cadeau)
function nuitDuChat(G) {
  const c = chatDe(G), lignes = [];
  if (c.adopte) {
    if (Math.random() < CHAT.cadeau) lignes.push(`Une souris morte sur ton oreiller : un cadeau de ${nomChat(G)}, qui ronronne, très fier.`);
    return lignes;
  }
  const r = CHAT.rats;
  if (G.jour < r.jourMin || Math.random() >= r.chance) return lignes;
  const manges = {};
  for (let i = 0; i < hasard(1, r.max); i++) {
    const id = auHasard(r.objets.filter(o => (G.stock[o] || 0) > 0));
    if (!id) break;
    G.stock[id]--; manges[id] = (manges[id] || 0) + 1;
  }
  const liste = Object.entries(manges).map(([id, n]) => `${n === 1 ? (genreDe(id).startsWith('f') ? 'une' : 'un') : n} ${ITEMS[id].nom.toLowerCase()}${n > 1 ? 's' : ''}`);
  // (v0.84) un réveil qu'on ne rate pas : une petite phrase, puis ce qui a disparu
  if (liste.length) {
    const entree = auHasard([
      "Cette nuit, tu as entendu de petits êtres grignoter dans la réserve...",
      "Quand le chat n'est pas là, les souris dansent : elles ont fait la fête dans ta réserve !",
      "Crrr, crrr, crrr... Toute la nuit. Au matin, des miettes et des petites crottes partout.",
      "Des petites traces de pattes dans la farine, jusqu'à tes étagères. Les rats sont passés.",
      `Un festin cette nuit dans ta réserve. Tu n'étais pas invité${eJ(G)}.`,
      "Au petit matin, un rat te fixe du haut de l'étagère, la panse ronde. Il ne s'excuse même pas.",
      "Tu as rêvé d'une fanfare de souris... Ce n'était pas un rêve : ta réserve a servi de salle de bal.",
    ]);
    lignes.push(`🐭 ${entree} Disparue${liste.length > 1 || /^[2-9]/.test(liste[0]) ? 's' : ''} : ${liste.join(' et ')}.${c.soirs.length ? '' : ' Un chat, peut-être, les tiendrait à distance...'}`);
  }
  return lignes;
}
// (appelé le soir) la garde viendra-t-elle demain ? On le tire dès ce soir : ton chat le sent parfois.
function tirerGardeDuLendemain(G) {
  if (G.gardeTiree === G.jour + 1) return !!G.gardeDemain;
  G.gardeTiree = G.jour + 1;
  if (!G.gardeDemain) { G.garde = G.garde || { visites: 0, dernier: 0, saisies: 0 }; G.jour++; const vient = gardeAuHasard(G); G.jour--; if (vient) G.gardeDemain = true; }
  const c = chatDe(G);
  if (c.adopte && G.gardeDemain && G.garde && G.garde.visites > 0 && Math.random() < CHAT.alerte) c.alerte = G.jour + 1;
  return !!G.gardeDemain;
}
function alerteChat(G) { return !!(G.chat && G.chat.alerte === G.jour + 1); }
// Ce que la garde pourrait saisir chez toi (pour savoir s'il y a quelque chose à cacher)
function aCacher(G) {
  const m = mafia(G);
  return Object.values(G.interdits || {}).some(n => n > 0) || !!m.colis || G.tresors.some(t => t.vole && !t.reparation);
}
function cacherMarchandise(G) { G.cachette = G.jour + 1; }

// --- (v0.67) La nymphe des fontaines ---
// Ce soir, la place du marché l'attend-elle ? (5 vœux, puis tous les 10 de plus)
// (v0.68) Un soir sur quatre environ, le mendiant descend au marché noir (toujours les mêmes soirs)
function mendiantAuMarcheNoir(G) { return hachage(G.jour, 5, 707) < 0.25; }

function nympheAttend(G) {
  const n = G.nymphe || { visites: 0 };
  return (G.fontainePieces || 0) >= NYMPHE.voeux + n.visites * NYMPHE.ensuite;
}
// La rencontre : la bénédiction (et le souvenir, la première fois). Renvoie ce qu'elle laisse.
function rencontrerNymphe(G) {
  const n = G.nymphe = G.nymphe || { visites: 0 };
  n.visites++;
  n.benie = G.jour + NYMPHE.benediction.jours;
  const souvenir = n.visites === 1 && !(G.decos || []).includes(NYMPHE.souvenir);
  if (souvenir) G.decos = [...(G.decos || []), NYMPHE.souvenir];
  return { visite: n.visites, souvenir, jusqua: n.benie };
}

// --- (v0.66) La cheminée : une planche de bois, et le feu brûle toute la nuit ---
function feuAllume(G, aussiHier = false) { return G.feu === G.jour || (aussiHier && G.feu === G.jour - 1); }
function allumerFeu(G) {
  if (G.feu === G.jour) return 'Le feu brûle déjà.';
  if ((G.materiaux.bois || 0) < CHEMINEE.bois) return "Plus une planche de bois : Thorgal en vend à la forge.";
  G.materiaux.bois -= CHEMINEE.bois;
  G.feu = G.jour;
  return null;
}

// La visite : le capitaine annonce une amende (la première fois) ou une fouille (les suivantes).
// Renvoie { fouille, amende, saisis } ; la fouille saisit les objets interdits.
function visiteGarde(G) {
  G.garde = G.garde || { visites: 0, dernier: 0, saisies: 0 };
  const fouille = G.garde.visites > 0;
  G.garde.visites++;
  G.garde.dernier = G.jour;
  const saisis = [];
  // (v0.65) prévenu par le chat, tu as tout caché sous le plancher : la fouille ne trouve rien
  if (fouille && G.cachette === G.jour) return { fouille, amende: amendeGarde(G), saisis, cache: true };
  if (fouille) for (const [id, n] of Object.entries(G.interdits || {})) if (n > 0) { saisis.push(`${n} × ${INTERDITS[id].nom.toLowerCase()}`); G.garde.saisies += n; G.interdits[id] = 0; }
  // (v0.60) ce que cache la Main Noire chez toi : le colis, les bijoux volés (l'amende double)
  let double = false;
  const m = mafia(G);
  if (fouille && m.colis) { saisis.push('un colis scellé de cire noire'); m.colis = false; m.represailles = m.bande; double = true; }
  const voles = G.tresors.filter(t => t.vole && !t.reparation);
  if (fouille && voles.length) { saisis.push(`${voles.length} lot${voles.length > 1 ? 's' : ''} de bijoux volés`); G.tresors = G.tresors.filter(t => !voles.includes(t)); double = true; }
  return { fouille, amende: amendeGarde(G) * (double ? 2 : 1), saisis };
}

function payerAmende(G, montant) {
  payer(G, Math.min(montant, Math.max(0, G.argent)), 'amende');
  G.reputation -= 0.3;
}

// Les chances de soudoyer un garde avec ce trésor (selon ses goûts et la valeur de l'objet)
function chanceSoudoiement(G, garde, t) {
  const aime = (GOUTS_TRESORS[garde.race] || []).includes(t.categorie);
  // (audit v0.54) la valeur compte par rapport à l'amende : un rebut à 5 p. n'achète plus un garde
  return Math.min(0.92, GARDE.soudoiement + (aime ? GARDE.bonusGout : 0) + Math.min(GARDE.bonusValeur, valeurTresor(t) / Math.max(1, amendeGarde(G))));
}

// Tenter de soudoyer : réussi, le trésor change de main et la garde s'en va. Raté : rarement, le
// garde garde quand même l'objet. Renvoie { reussi, perdu }.
function soudoyer(G, garde, t) {
  const reussi = Math.random() < chanceSoudoiement(G, garde, t);
  const perdu = reussi || Math.random() < GARDE.gardeObjet;
  if (perdu) G.tresors = G.tresors.filter(x => x !== t);
  if (reussi) changerRelation(G, garde.nom, 2);
  return { reussi, perdu };
}

// Le meilleur trésor à offrir à ce garde, puis les suivants (pour choisir)
function tresorsPourSoudoyer(G, garde) {
  return (G.tresors || []).filter(t => !t.reparation).sort((a, b) => chanceSoudoiement(G, garde, b) - chanceSoudoiement(G, garde, a));
}

// Ce que l'aventurier te reverse vraiment, selon votre relation et la lanterne.
function partDuButin(G, voyageur) {
  const lanterne = aDecoration(G, 'lanterne') ? 1.1 : 1;
  const comptoir = 1 + 0.04 * niveauAmelioration(G, 'comptoir');
  // (le camp qui ne t'aime pas paie moins : un Banni chez un comptoir de la lumière, et l'inverse)
  const cote = coteCamp(G), banni = PEUPLES_OMBRE.includes(voyageur.race);
  const froid = banni && cote === 'bien' ? 0.85 : 1;
  return Math.round(voyageur.butin * niveauRelation(G, voyageur.nom).butin * lanterne * comptoir * froid);
}

// Appelé à la fin du récit : on encaisse le butin, la réputation et la relation évoluent.
// Renvoie { gain, message }.
function terminerAventure(G, parti) {
  if (parti.termine) return parti.bilan;
  parti.termine = true;
  const r = parti.resultat;
  const v = parti.voyageur;
  // (v0.84) ce qu'il était avant de revenir : pour la carte de progression façon RPG
  const avant = { niveau: v.niveau, succes: succesDe(G, v.nom), relation: niveauRelation(G, v.nom).nom, reputation: G.reputation };
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
    const part0 = v.prevu ? partCommandeRemplie(v, parti.colis) : 1;
    // (v0.60) Revenu, mais blessé : la mission compte moins (un quart de réputation en moins par cœur
    // perdu, jamais moins de la moitié), et il lui faudra du repos s'il n'est pas soigné.
    const derniere0 = r.etapes[r.etapes.length - 1];
    const blesse = Math.max(0, Math.min(v.pv, (r.pvDepart || v.pv) - derniere0.pvApres));
    const part = part0 * Math.max(0.5, 1 - 0.25 * blesse);
    // (audit v0.54) Au-delà de 12, la réputation monte de moins en moins vite : elle garde un sens
    // en fin de partie (refus, échecs et pièges continuent de coûter quelque chose).
    G.reputation += GAIN_REPUTATION_SUCCES * multReputationCamp(G, camp) * part / (1 + Math.max(0, G.reputation - 12) / 20);
    if (camp) {
      pencher(G, camp === 'bien' ? 'missionL' : 'missionO', { qui: v.nom });
      G.reussites[camp] = (G.reussites[camp] || 0) + 1;   // (audit v0.53 : plus de G.mal ici, il ne compte que les âmes offertes)
      // (audit v0.54) l'écart est borné ici, pas seulement dans le calcul : la jauge peut toujours revenir
      const autre = camp === 'bien' ? 'mal' : 'bien';
      if (G.reussites[camp] - (G.reussites[autre] || 0) > JAUGE_CAMP.ecartMax) G.reussites[camp] = (G.reussites[autre] || 0) + JAUGE_CAMP.ecartMax;
    }
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
    // (v0.60) Lumière : les villages remercient (un cadeau en nature demain matin).
    // Ombre : plus d'or, un objet interdit glissé sous le manteau... et la garde qui rôde.
    if (camp === 'bien' && Math.random() < CHANCE_GRATITUDE) G.cadeauxVillages = [...(G.cadeauxVillages || []), { zone: v.zone, nom: v.nom }];
    if (camp === 'mal') {
      if (Math.random() < CHANCE_INTERDIT_OMBRE) {
        const id = auHasard(interditsDuPasseur());
        G.interdits[id] = (G.interdits[id] || 0) + 1;
        message = (message ? message + ' ' : '') + `${v.nom.split(' ')[0]} te glisse ${INTERDITS[id].article} : « Un souvenir. Cache-le bien. »`;
      }
      if (Math.random() < CHANCE_GARDE_OMBRE) { G.gardeDemain = true; message = (message ? message + ' ' : '') + `Des silhouettes en tabard bleu l'ont suivi${v.feminin ? 'e' : ''} jusqu'à ta porte...`; }
    }
    if (part0 < 1) message = (message ? message + ' ' : '') + `Sa commande n'était remplie qu'à ${Math.round(part0 * 100)} % : ta réputation en profite moins.`;
    if (blesse) message = (message ? message + ' ' : '') + `Revenu${v.feminin ? 'e' : ''} blessé${v.feminin ? 'e' : ''} : la mission compte un peu moins pour ta réputation, et sans soins il lui faudra ${CONVALESCENCE_PAR_COEUR * blesse} jours de repos.`;
    const derniere = r.etapes[r.etapes.length - 1];
    // Les cœurs perdus (au-delà des cœurs gagnés grâce aux soins en plus) restent des blessures.
    const blessures = Math.max(0, Math.min(v.pv, (r.pvDepart || v.pv) - derniere.pvApres));
    // Chaque succès le fait progresser : novice, aguerri, vétéran, héros, légende.
    const niveau = meilleurNiveau(v.niveau, succesDe(G, v.nom));
    if (niveau !== v.niveau) message = (message ? message + ' ' : '') + `${v.nom.split(' ')[0]} devient ${NIVEAUX_AVENTURIER[niveau].nom.toLowerCase()} !`;
    G.habitues.push({ nom: v.nom, race: v.race, feminin: v.feminin, inventaire: inventaireApres(parti), blessures, niveau, prestige: v.prestige || null, convalescence: blessures ? G.jour + CONVALESCENCE_PAR_COEUR * blessures : 0 });
    parti.trouvailles = trouvailles(G, v);
    // Il a peut-être aperçu une zone plus dangereuse, encore inconnue.
    const d = ZONES[v.zone] ? ZONES[v.zone].danger : 1;
    // (une zone déjà découverte, ou que la réputation suffit déjà à ouvrir, ne compte pas)
    const inconnues = Object.keys(ZONES).filter(z => !zoneOuverte(G, z) && ZONES[z].danger <= d + 1
      && !G.zonesDecouvertes.includes(z) && !conditionsZone(G, z).reputation
      && (ZONES[z].camp !== 'mal' || G.visiteMarcheNoir !== undefined));   // (v0.58 : les terres des Bannis, seulement après le marché noir)
    if (inconnues.length && Math.random() < CHANCE_DECOUVERTE) {
      const z = auHasard(inconnues);
      G.zonesDecouvertes.push(z);
      parti.decouverte = z;
      message = (message ? message + ' ' : '') + `« Au fait... J'ai aperçu au loin ${ZONES[z].nom.replace(/^(Le|La|Les|L') /, m => m.toLowerCase()).replace(/^L'/, "l'")}. » Nouvelle zone sur ta carte !`;
    }
  } else {
    if (!r.valeureux) G.reputation--;
    connaitre(G, v).mort = true;
    G.journal.morts++;
    recolter(G, [parti]); // si la Faucheuse ne l'a pas déjà emporté
    // La famille attend un dédommagement : il est choisi à la fin du carnet.
  }
  parti.bilan = { gain, message };
  const h = G.habitues.find(x => x.nom === v.nom);
  parti.progression = { avant, apres: { niveau: (h && h.niveau) || v.niveau, succes: succesDe(G, v.nom), relation: niveauRelation(G, v.nom).nom, reputation: G.reputation }, gain };
  connaitre(G, v);
  G.historique.unshift({
    nom: v.nom, race: v.race, feminin: !!v.feminin, quete: v.quete, zone: v.zone, depart: parti.depart, retour: parti.retour,
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
    if (ITEMS[id].durable && n > 0) inv[id] = USURE_MAX + ((parti.belOuvrage || []).includes(id) ? FORGE.belOuvrage.usure : 0);
  }
  // (v0.64) au combat, c'est l'arme qu'il a vraiment emportée qui s'use (pas toujours l'épée)
  const arme = armeEmportee(parti.voyageur, parti.colis);
  for (const { epreuve } of parti.resultat.etapes) {
    const id = estArme(epreuve.besoin) ? arme : epreuve.besoin;
    if (inv[id] > 0) inv[id]--;
  }
  return inv;
}

// Soigner un cœur d'un aventurier revenu blessé : une potion, et il te paie.
// Renvoie un message d'erreur, ou null.
function soigner(G, nom, { gratuit = false } = {}) {
  const h = G.habitues.find(x => x.nom === nom);
  if (!h || !h.blessures) return `${nom} n'a plus de blessure à soigner.`;
  if (G.stock.potion <= 0) return "Tu n'as plus de potion.";
  G.stock.potion--;
  // (v0.90) soigner sans faire payer : un geste de lumière
  if (gratuit) { pencher(G, 'soigner', { qui: nom }); changerRelation(G, nom, 1); }
  else encaisser(G, PRIX_SOIN, 'soins');
  h.blessures--;
  if (!h.blessures) h.convalescence = 0;
  else if (h.convalescence) h.convalescence -= CONVALESCENCE_PAR_COEUR;   // (v0.60) chaque cœur soigné raccourcit le repos
  changerRelation(G, nom, 1);
  return null;
}

function blessuresDe(G, nom) {
  const h = G.habitues.find(x => x.nom === nom);
  return h ? h.blessures || 0 : 0;
}

// Les prêts proposés : la Main Noire seulement pour le camp du mal.
function pretsProposes(G) {
  return PRETS.filter(p => !p.mal || mainNoireOuverte(G));
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
  const j = jour - 1 + (G.decalageJours || 0);   // (les sauts de temps des paliers d'étoiles)
  return {
    an: Math.floor(j / JOURS_PAR_AN) + 1,
    mois: Math.floor((j % JOURS_PAR_AN) / JOURS_PAR_MOIS),
    semaine: Math.floor((j % JOURS_PAR_MOIS) / JOURS_PAR_SEMAINE) + 1,
    jourDuMois: (j % JOURS_PAR_MOIS) + 1,
  };
}

// Le premier jour de la semaine, du mois et de l'année en cours.
function debutsDePeriodes(G) {
  // (v0.59) le calcul se fait en jours de calendrier (avec les sauts de temps), mais on rend des
  // numéros de jour du jeu (les clés de la comptabilité) : sans ça, dès le premier saut, la semaine
  // et le mois commençaient après aujourd'hui et le bureau affichait 0
  const d = G.decalageJours || 0, j = G.jour - 1 + d;
  const enJeu = c => Math.max(1, Math.min(G.jour, c - d));
  return {
    semaine: enJeu(j - (j % JOURS_PAR_SEMAINE) + 1),
    mois: enJeu(j - (j % JOURS_PAR_MOIS) + 1),
    an: enJeu(j - (j % JOURS_PAR_AN) + 1),
  };
}

function dateEnTexte(G, jour = G.jour) {
  const d = dateDuJour(G, jour);
  return `${d.jourDuMois} ${MOIS[d.mois]}, an ${d.an}`;
}

// --- Ton personnage ---

function ageJoueur(G) {
  return AGE_DEPART + Math.floor((G.jour - 1 + (G.decalageJours || 0)) / JOURS_PAR_AN);
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
    // Le prix suit ce que l'objet vaudra une fois restauré (c'est ce que le voyageur imagine) :
    // tantôt une affaire, tantôt trop cher pour le travail qu'il demandera.
    liste.push({ tresor, prix: Math.max(3, Math.round(valeurTresor(tresor, ETATS.length - 1) * Phaser.Math.FloatBetween(0.35, 1.2) * ami)), vendu: false,
      biais: Phaser.Math.FloatBetween(-1, 1) });
  }
  return liste;
}

function acheterTrouvaille(G, t) {
  if (t.vendu) return 'Déjà acheté.';
  if (t.retire) return "L'objet est remballé.";
  if (G.tresors.length >= placesAtelier(G)) return `Ton atelier est plein (${placesAtelier(G)} objets). Un établi de plus (améliorations) donne plus de place.`;
  if (!peutPayer(G, t.prix)) return manqueArgent(G, t.prix, "Pas assez d'argent.");
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
  // (l'apprenti devient rapide après quelques réparations)
  const forme = ouvrier && EMPLOYES[ouvrier] && EMPLOYES[ouvrier].apprenti && ((G.reparationsPar || {})[ouvrier] || 0) >= EMPLOYES[ouvrier].apprenti;
  const experte = r === true || forme || (Array.isArray(r) && r.includes(t.categorie)) ? 1 : 0;
  const base = suite ? Math.ceil(CATEGORIES[t.categorie].duree / 2) : CATEGORIES[t.categorie].duree;
  return Math.max(1, base + ETATS[etat].reparation - niveauArtisanat(G) - experte);
}

// La durée pour amener l'objet jusqu'à l'état « cible » : la somme des étapes.
function dureeReparation(G, t, ouvrier = ouvrierLibre(G, t), cible = t.etat + 1) {
  let jours = 0;
  for (let e = t.etat; e < cible; e++) jours += dureeEtape(G, t, e, ouvrier, e > t.etat);
  return jours;
}

// Les matériaux pour aller jusqu'à « cible » : un par étape.
function materiauxReparation(t, cible = t.etat + 1) {
  const c = CATEGORIES[t.categorie];
  return !c.materiau ? 0 : c.unSeul ? 1 : cible - t.etat;
}

// (v0.60) Les fournitures de l'atelier (colle, rivets, vernis, outils usés) : un cinquième de ce
// que la réparation fait gagner en valeur. Restaurer un objet rare coûte donc bien plus cher.
const PART_FOURNITURES = 0.2;
function prixReparation(t, cible = t.etat + 1) {
  const gain = Math.max(0, valeurTresor(t, cible) - valeurTresor(t, t.etat));
  return Math.max(2, Math.round(gain * PART_FOURNITURES));
}

function enReparation(G) {
  return G.tresors.filter(t => t.reparation);
}

// Qui peut travailler à l'atelier : toi, puis tes employés.
function ouvriers(G) {
  return ['toi', ...G.employes];
}

// Le premier ouvrier libre, ou null : d'abord un employé spécialiste de l'objet (s'il y en a un),
// puis les autres employés, et toi en dernier (pour que tu restes disponible).
function ouvrierLibre(G, t = null) {
  const occupes = enReparation(G).map(x => x.reparation.ouvrier);
  const libres = [...G.employes, 'toi'].filter(o => !occupes.includes(o));
  const expert = t && libres.find(o => EMPLOYES[o] && (EMPLOYES[o].rapide === true || (Array.isArray(EMPLOYES[o].rapide) && EMPLOYES[o].rapide.includes(t.categorie))));
  return expert || libres[0] || null;
}

function nomOuvrier(o) {
  return o === 'toi' ? 'toi' : EMPLOYES[o].nom;
}

// Lancer la réparation d'un objet jusqu'à l'état « cible » : un ouvrier libre, et un
// matériau par étape. Renvoie une erreur, ou null.
function reparerTresor(G, t, cible = t.etat + 1) {
  if (t.etat >= ETATS.length - 1) return `${t.nom} : déjà en parfait état.`;
  cible = Math.min(ETATS.length - 1, Math.max(t.etat + 1, cible));
  const ouvrier = ouvrierLibre(G, t);
  if (!ouvrier) return "Tout le monde est déjà occupé. Embauche quelqu'un pour réparer plus d'objets à la fois.";
  const mat = CATEGORIES[t.categorie].materiau;
  const n = materiauxReparation(t, cible);
  if (mat && (G.materiaux[mat] || 0) < n) return `Il te faut ${n} ${MATERIAUX[mat].nom.toLowerCase()} (tu en as ${G.materiaux[mat] || 0}).`;
  const prix = prixReparation(t, cible);
  if (G.argent < prix) return `Les fournitures coûtent ${prix} pièces : tu n'as pas assez.`;
  if (mat) G.materiaux[mat] -= n;
  payer(G, prix, 'atelier');
  t.reparation = { jours: dureeReparation(G, t, ouvrier, cible), ouvrier, cible };
  return null;
}

// --- Les employés ---

function placesAtelier(G) {
  return PLACES_ATELIER + PLACES_PAR_ETABLI * niveauAmelioration(G, 'atelier');
}

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
  // Sa réparation s'arrête ; les matériaux pas encore travaillés te sont rendus.
  for (const t of G.tresors) if (t.reparation && t.reparation.ouvrier === id) {
    const mat = CATEGORIES[t.categorie].materiau;
    if (mat) G.materiaux[mat] = (G.materiaux[mat] || 0) + materiauxReparation(t, t.reparation.cible || t.etat + 1);
    t.reparation = null;
  }
}

// (v0.60) Le bilan d'un employé : ce qu'il a coûté, ce qu'il a fait gagner en valeur à l'atelier.
function bilanEmploye(G, id) {
  const cout = (G.salairesPar || {})[id] || 0, valeur = (G.valeurPar || {})[id] || 0;
  return { cout, valeur, reparations: (G.reparationsPar || {})[id] || 0, solde: valeur - cout };
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
    G.reparationsPar = G.reparationsPar || {};
    const o = t.reparation.ouvrier;
    G.reparationsPar[o] = (G.reparationsPar[o] || 0) + 1;
    if (EMPLOYES[o] && EMPLOYES[o].apprenti && G.reparationsPar[o] === EMPLOYES[o].apprenti) {
      G.nouvellesAtelier.push(`${EMPLOYES[o].nom} a bien appris : ses réparations prennent maintenant un jour de moins !`);
    }
    t.reparation = null;
    // (v0.60) ce que chaque ouvrier a fait gagner en valeur (pour son bilan au bureau)
    const avant = valeurTresor(t);
    t.etat = cible;
    G.valeurPar = G.valeurPar || {};
    G.valeurPar[o] = (G.valeurPar[o] || 0) + Math.max(0, valeurTresor(t) - avant);
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
    let max = lot.reduce((s, t) => s + valeurTresor(t) * (reveilDuJour(G).encheres === t.categorie ? CHAMBRE.encheres : 1) *
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
    if (ITEMS[id].durable && (estArme(id) ? etatArme(voyageur) : etatObjet(voyageur, id)) >= 2) continue; // il a déjà le sien
    const enStock = estArme(id) ? IDS_ARMES.reduce((s, w) => s + (G.stock[w] || 0), 0) : (G.stock[id] || 0);
    manquants += Math.min(Math.max(0, n - fourni(voyageur, colis, id)), enStock);
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
    connaitre(G, p.voyageur).mort = true;
    G.habitues = G.habitues.filter(h => h.nom !== p.voyageur.nom);
    // (v0.60) la gazette de demain en parlera
    G.decesAnnonces = [...(G.decesAnnonces || []), { nom: p.voyageur.nom, feminin: !!p.voyageur.feminin, zone: p.voyageur.zone, voulu: !!p.voulu }];
    if (p.voulu) {
      // (v0.60) et la Faucheuse laisse un souvenir sur le comptoir, un par âme offerte
      F.reliques = F.reliques || [];
      if (F.reliques.length < RELIQUES_FAUCHEUSE.length) F.reliques.push(RELIQUES_FAUCHEUSE[F.reliques.length].id);
      const poids = MORTS_VOULUES[p.voulu].poids;
      G.mal += poids * (seductionFaucheuse(G).mal || 1);   // (plus elle t'aime, plus chaque âme pèse)
      pencher(G, 'ame', { qui: p.voyageur.nom });   // (v0.90 : une âme ne pèse plus que +1 ☾ sur la balance)
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
  // Éprise, elle a un prix : une âme qui t'est chère (un habitué, ton ami)
  const proches = seductionFaucheuse(G).proches ? G.habitues.filter(h => (G.relations[h.nom] || 0) >= PRIX_FAUCHEUSE.relation && !nomsActifs(G).includes(h.nom)) : [];
  for (let essai = 0; essai < 20; essai++) {
    const proche = proches.length ? auHasard(proches) : null;
    const cible = proche ? creerVoyageur(G, { ...proche }) : voyageurAuHasard(G);
    if (cible.habitue && !proche) continue;
    const zones = zonesPour(G, cible).filter(z => ZONES[z].camp !== 'mal');
    if (!zones.length) continue;
    const zone = auHasard(zones);
    envoyerDans(G, cible, zone);
    const possibles = Object.keys(commandeDe(cible)).map(id => (estArme(id) ? 'epee' : id)).filter(id => id in PIEGES);   // (l'épée fêlée remplace n'importe quelle arme)
    if (!possibles.length) continue;
    const danger = ZONES[zone].danger;
    const prime = Math.round((PRIME_SABOTAGE[0] + (PRIME_SABOTAGE[1] - PRIME_SABOTAGE[0]) * (danger - 1) / 4) * (proche ? PRIX_FAUCHEUSE.prime : 1));
    F.mission = { cible, piege: auHasard(possibles), jour: G.jour + 1, prime, etat: 'proposee', proche: !!proche };
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
  const prix = G.faucheuse.mission && G.faucheuse.mission.proche;
  G.faucheuse.mission = null;
  G.faucheuse.faveur -= prix ? PRIX_FAUCHEUSE.refus : 1;   // (on ne refuse pas impunément son prix)
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
  const sceau = aDecoration(G, 'sceau') ? 1 : 0;
  return Phaser.Math.Clamp(TREFLE_BASE + relation + cadeaux + sceau, 0, TREFLE_MAX);
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
  if (!peutPayer(G, prix)) return manqueArgent(G, prix, "Pas assez d'argent !");
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
    if (e.debut === G.jour) lignes.push(d.nouvelle);
    else if (e.fin === G.jour) lignes.push(`Dernier jour : ${d.nouvelle.charAt(0).toLowerCase() + d.nouvelle.slice(1)}`);
  }
  // Une nouvelle absurde, sans répéter les dernières.
  G.nouvellesLues = (G.nouvellesLues || []).slice(-15);
  const permise = i => Object.entries(NOUVELLES_JOUR).every(([mot, jour]) => !NOUVELLES[i].includes(mot) || G.jour >= jour);
  const restantes = NOUVELLES.map((_, i) => i).filter(i => !G.nouvellesLues.includes(i) && permise(i));
  const i = auHasard(restantes.length ? restantes : NOUVELLES.map((_, k) => k).filter(permise));
  G.nouvellesLues.push(i);
  lignes.push(NOUVELLES[i]);
  // Un soir de marché noir : un papier glissé sous la porte, avec le mot de passe
  if (G.jour >= MARCHE_NOIR.debut && Math.random() < (palierCamp(G) <= -1 ? MARCHE_NOIR.chanceOmbre : MARCHE_NOIR.chance)) {
    G.marcheNoir = { jour: G.jour, mot: auHasard(MARCHE_NOIR.mots) };
    lignes.push(`Un papier glissé sous ta porte : « Ce soir. Derrière le tonneau. Mot : ${G.marcheNoir.mot}. »`);
  }
  if (G.palierNouveau && PALIERS_CLIENTS[G.palierNouveau].gazette) lignes.unshift(PALIERS_CLIENTS[G.palierNouveau].gazette);
  // La jauge lumière ⟷ ombre a franchi un palier
  const palier = nouvellePalierCamp(G);
  if (palier) lignes.unshift(palier);
  // Un nouveau lieu ouvre sur le marché (annoncé la veille, puis le jour même)
  for (const [cle, jour] of Object.entries(OUVERTURE_LIEUX)) {
    if (jour === G.jour) lignes.unshift(`${NOMS_LIEUX_MARCHE[cle]} ${ouvrePluriel(cle)} aujourd'hui sur le marché !`);
    // (v0.68) la veille, on ne dit pas encore quoi : la surprise reste entière jusqu'à l'ouverture
    else if (jour === G.jour + 1) lignes.push("Les travaux s'achèvent sur la place du marché : on ne sait toujours pas ce qui ouvre demain...");
  }
  // (v0.60) les disparus d'hier : un drame sur la route (et des murmures, si la mort n'était pas un hasard)
  for (const d of (G.decesAnnonces || []).slice(0, 3)) {
    const z = ZONES[d.zone] ? ZONES[d.zone].nom : 'la route';
    lignes.unshift(`Drame ${aLieu(z).replace(/^à /, 'à ')} : ${d.nom} n'est jamais revenu${d.feminin ? 'e' : ''}.` + (d.voulu ? ' On murmure que son baluchon était bien léger...' : ' Que la terre lui soit légère.'));
  }
  G.decesAnnonces = [];
  if (G.annonceMafia) { lignes.unshift(G.annonceMafia); G.annonceMafia = null; }
  G.gazette = { jour: G.jour, lignes };
}

// L'exigence d'un client prestigieux est-elle remplie ? Renvoie null, ou ce qu'il dit en repartant.
function refusPrestige(G, v) {
  if (!v.prestige) return null;
  const e = EXIGENCES[v.prestige.type];
  if (e.verifier(G, v.prestige.objet)) return null;
  const o = v.prestige.objet;
  return e.texte.replace('{la moindre}', o ? accordAdj(o, 'le moindre', 'la moindre', 'les moindres', 'les moindres') : 'la moindre').replace('{objet}', o ? ITEMS[o].nom.toLowerCase() : '');
}

// Il repart vexé : ta réputation en souffre, et il s'en souviendra.
function vexerPrestige(G, v) {
  G.reputation -= PERTE_PRESTIGE;
  connaitre(G, v);
  return changerRelation(G, v.nom, -2);
}

// La récompense d'un palier, remis par le visiteur notable. Renvoie ce qu'il a apporté (texte).
function recompensePalier(G, index) {
  const p = PALIERS_CLIENTS[index];
  const r = p && p.recompense;
  if (G.palierNouveau === index) G.palierNouveau = null;
  if (!r) return '';
  const textes = [];
  if (r.prime) { encaisser(G, r.prime, 'primes'); textes.push(`une prime de ${r.prime} pièces`); }
  if (r.type === 'etals') { G.bonusEtals = true; textes.push('la promesse des marchands : leurs raretés seront sur leurs étals chaque jour'); }
  if (r.type === 'colporteur') { G.colporteur = true; textes.push(`la visite de ${COLPORTEUR.nom}, certains jours, avec sa hotte pleine de choses rares`); }
  if (r.type === 'prestige') { G.prestige = true; textes.push('la curiosité des nobles et des collectionneurs : ils viendront bientôt te voir'); }
  if (r.type === 'legendes') { G.legendes = true; textes.push('la bienveillance des héros et des légendes : ils passeront plus souvent'); }
  if (r.type === 'decoration' && !G.decorations.includes(r.id)) { G.decorations.push(r.id); textes.push(`${DECORATIONS[r.id].nom} (${DECORATIONS[r.id].effet.charAt(0).toLowerCase() + DECORATIONS[r.id].effet.slice(1)})`); }
  return textes.join(', et ');
}

// --- L'Armure du Dernier Rempart ---

// (v0.61) Chaque royaume LIBÉRÉ (toutes ses contrées conquises : CONQUETE_ZONE missions réussies
// dans chacune) vaut une pièce de l'armure et l'arme légendaire du royaume, apportées par un
// messager au réveil. (La Citadelle et Hautgarde, forts de la Confrérie, ne sont d'aucun royaume.)
function contreesDuRoyaume(r) { return Object.keys(ZONES).filter(z => ZONES[z].royaume === r); }
function royaumeLibere(G, r) {
  const zs = contreesDuRoyaume(r);
  return zs.length > 0 && zs.every(z => ((G.conquete || {})[z] || 0) >= CONQUETE_ZONE);
}
// Pour la carte : où en est la libération d'un royaume (contrées conquises / contrées)
function avanceeRoyaume(G, r) {
  const zs = contreesDuRoyaume(r);
  return { faites: zs.filter(z => ((G.conquete || {})[z] || 0) >= CONQUETE_ZONE).length, total: zs.length };
}
function recompenserZones(G) {
  G.nouvellesPieces = [];
  G.armesLegendaires = G.armesLegendaires || [];
  // (une partie d'avant la v0.61 : ses pièces restent, mais les promesses par contrée sont oubliées,
  // et les royaumes déjà libérés donnent leur arme sans cérémonie)
  if (!G.royaumesRecompenses) {
    G.royaumesRecompenses = Object.keys(ROYAUMES).filter(r => royaumeLibere(G, r));
    G.piecesAVenir = [];
    for (const r of G.royaumesRecompenses) if (!G.armesLegendaires.includes(ARMES_LEGENDAIRES[r].id)) G.armesLegendaires.push(ARMES_LEGENDAIRES[r].id);
  }
  G.piecesAVenir = (G.piecesAVenir || []).filter(r => ROYAUMES[r]);
  // Chaque royaume libéré promet sa pièce... mais le messager ne passe qu'une fois par matin :
  // les autres attendent leur tour, pour que chacune soit un vrai événement.
  for (const r of Object.keys(ROYAUMES)) {
    if (G.royaumesRecompenses.includes(r) || !royaumeLibere(G, r)) continue;
    G.royaumesRecompenses.push(r);
    G.piecesAVenir.push(r);
  }
  if (!G.piecesAVenir.length) return;
  const resteArmure = G.armure.length < ARMURE.length;
  // (le sceau est un moment de l'histoire : la dernière pièce n'arrive pas avant le jour JOUR_SCEAU)
  // (audit v0.54) ... ni tant que tu n'as penché d'aucun côté : on ne te scelle pas sans que tu aies choisi
  // (v0.90) ... mais plus en zone neutre : rester entre les deux est désormais un vrai choix (la fin neutre)
  const derniereRetenue = resteArmure && G.armure.length === ARMURE.length - 1 && G.jour < JOUR_SCEAU;
  if (derniereRetenue) return;
  const r = G.piecesAVenir.shift();
  const arme = ARMES_LEGENDAIRES[r];
  if (!G.armesLegendaires.includes(arme.id)) G.armesLegendaires.push(arme.id);
  const n = { piece: null, arme: arme.id, royaume: r, cote: coteArmure(G) };
  if (resteArmure) {
    const piece = ARMURE[G.armure.length];
    G.armure.push(piece.id);
    n.piece = piece.id;
    n.avertit = G.armure.length === ARMURE.length - 1;
    // L'armure est complète : ton camp est scellé pour de bon.
    if (G.armure.length === ARMURE.length && !G.camp) {
      // (v0.90) le serment l'emporte ; sans serment, dans la zone neutre, c'est la fin neutre
      const serment = sermentDe(G);
      if (serment) G.camp = serment;
      else if (palierCamp(G) === 0) G.sceauNeutre = G.jour;
      else G.camp = coteArmure(G) === 'sombre' ? 'mal' : 'bien';
      n.scelle = G.camp || 'neutre';
      if (G.lo) G.lo.carrefour = null;
    }
  }
  G.nouvellesPieces.push(n);
}

function armeLegendaire(id) { return Object.values(ARMES_LEGENDAIRES).find(a => a.id === id); }

// Le côté de l'armure : scellé avec le camp, sinon la jauge du mal contre la réputation.
function coteArmure(G) {
  if (G.camp) return G.camp === 'mal' ? 'sombre' : 'clair';
  return palierCamp(G) <= -1 ? 'sombre' : 'clair';   // (audit v0.53 : une seule mort ne suffit plus à basculer)
}

// --- Étape 9a : la jauge lumière ⟷ ombre ---

// De −100 (l'ombre) à +100 (la lumière) : les missions réussies pour chaque camp, les âmes offertes,
// les objets marqués achetés.
function jaugeCamp(G) {
  return Math.round(etatLO(G).points);
}
// (avant la v0.90) la jauge se calculait d'après les réussites, les âmes et les objets : on s'en sert
// une fois, pour reprendre une vieille partie là où elle en était
function jaugeAncienne(G) {
  const r = G.reussites || { bien: 0, mal: 0 }, o = G.objetsCamp || { bien: 0, mal: 0 };
  const ecart = Math.max(-JAUGE_CAMP.ecartMax, Math.min(JAUGE_CAMP.ecartMax, r.bien - r.mal));
  const j = ecart * JAUGE_CAMP.reussite - (G.mal || 0) * JAUGE_CAMP.mal + (o.bien - o.mal) * JAUGE_CAMP.objet;
  return Math.max(-JAUGE_CAMP.max, Math.min(JAUGE_CAMP.max, Math.round(j)));
}

// --- (v0.90) Lumière et ombre : les points, le frein, le serment, le Carrefour, le parjure ---

function etatLO(G) {
  if (!G.lo) G.lo = { points: 0, journal: [], serment: null, offres: {}, parjures: 0, carrefour: null, parjure: null };
  return G.lo;
}

// Un geste du barème fait pencher la balance (`fois` gestes d'un coup). Renvoie les points gagnés.
function pencher(G, cle, { fois = 1, qui = null } = {}) {
  const b = BAREME_CAMP[cle];
  if (!b || fois <= 0) return 0;
  const lo = etatLO(G), sg = b.camp === 'bien' ? 1 : -1;
  const avant = lo.points;
  for (let k = 0; k < fois; k++) {
    let v = b.n * (lo.serment === b.camp ? SERMENT.mult : 1);
    // (le frein : plus on s'éloigne du centre, plus chaque geste compte peu ; revenir compte en entier)
    if (lo.points === 0 || Math.sign(lo.points) === sg) v *= FREIN_CAMP.find(([seuil]) => Math.abs(lo.points) < seuil)[1];
    lo.points = Math.max(-JAUGE_CAMP.max, Math.min(JAUGE_CAMP.max, lo.points + sg * v));
  }
  lo.journal.unshift({ jour: G.jour, cle, n: b.n * fois, qui });
  if (lo.journal.length > 40) lo.journal.length = 40;
  surveillerLO(G);
  return lo.points - avant;
}

// Un geste repris (le recherché caché qu'on finit par livrer) : ses points s'effacent, sans frein.
function reprendreGeste(G, cle) {
  const b = BAREME_CAMP[cle], lo = etatLO(G);
  if (!b) return;
  const i = lo.journal.findIndex(e => e.cle === cle && e.jour === G.jour);
  if (i < 0) return;
  lo.journal.splice(i, 1);
  const sg = b.camp === 'bien' ? 1 : -1;
  lo.points = sg > 0 ? Math.max(Math.min(0, lo.points), lo.points - b.n) : Math.min(Math.max(0, lo.points), lo.points + b.n);
}

// Après chaque geste (et chaque nuit) : le Carrefour qui s'ouvre, ou le serment rompu.
function surveillerLO(G) {
  const lo = etatLO(G), j = lo.points;
  if (G.camp || G.sceauNeutre) return;
  // le parjure : on a juré à un camp, et l'on a passé le 1er palier de l'autre côté
  if (lo.serment && (lo.serment === 'bien' ? j <= -SERMENT.parjure : j >= SERMENT.parjure)) {
    const c = lo.serment;
    lo.serment = null; lo.offres[c] = 'parjure'; lo.parjures++; lo.carrefour = null;
    lo.parjure = { camp: c, jour: G.jour };
    G.reputation -= SERMENT.reputationParjure;
    return;
  }
  if (lo.serment || lo.carrefour) return;
  const camp = j >= SERMENT.palier ? 'bien' : j <= -SERMENT.palier ? 'mal' : null;
  if (!camp) return;
  const o = lo.offres[camp];
  if (!o) lo.carrefour = { camp, derniere: false };
  else if (o === 'refusee' && Math.abs(j) >= SERMENT.derniere) lo.carrefour = { camp, derniere: true };
}

// Au Carrefour : prêter serment au côté où penche la balance...
function preterSerment(G) {
  const lo = etatLO(G), c = lo.carrefour && lo.carrefour.camp;
  if (!c) return;
  lo.serment = c; lo.offres[c] = 'juree'; lo.carrefour = null; lo.jourSerment = G.jour;
  // (la Confrérie t'offre sa bannière pour le comptoir)
  if (c === 'bien' && DECOS.banniere && !aDeco(G, 'banniere')) G.decos = [...(G.decos || []), 'banniere'];
}
// ... ou rester libre (le camp refusé fera une dernière offre au 3e palier)
function resterLibre(G) {
  const lo = etatLO(G), cf = lo.carrefour;
  if (!cf) return;
  lo.offres[cf.camp] = cf.derniere ? 'refuseeDef' : 'refusee';
  lo.carrefour = null;
}
function sermentDe(G) { return (G.lo && G.lo.serment) || null; }

// (v0.90) Ce qu'un palier de la balance t'apporte (le livre des deux voies ne montre que le prochain)
const OFFRES_PALIERS = {
  1: "Les gens te saluent dans la rue, et la Banque Centrale baisse ses taux.",
  2: "Le Carrefour : la Confrérie t'offrira un serment (tes gains de lumière ×1,5, sa bannière, des taux d'ami à la Banque).",
  3: "Le Conseil des Gardiens lui-même connaîtra ton nom.",
  '-1': "Les Bannis viendront te voir au comptoir, et le marché noir te fera ses prix d'ami.",
  '-2': "Le Carrefour : les Bannis t'offriront un serment (tes gains d'ombre ×1,5, la Main Noire qui prête sans intérêts).",
  '-3': "Les Bannis te traiteront comme l'un des leurs.",
};
// Le prochain palier de chaque côté, depuis où tu es : { bien: { palier, seuil }, mal: { ... } }
function prochainsPaliers(G) {
  const j = jaugeCamp(G), out = {};
  const b = PALIERS_JAUGE.findIndex(s => s > j);
  if (b >= 0) out.bien = { palier: b + 1, seuil: PALIERS_JAUGE[b] };
  const m = PALIERS_JAUGE.findIndex(s => -s < j);
  if (m >= 0) out.mal = { palier: -(m + 1), seuil: -PALIERS_JAUGE[m] };
  return out;
}
// Une ligne du journal de la balance, pour le livre des deux voies
function texteGeste(e) {
  const q = e.qui ? prenomDe(e.qui) : null;
  const t = {
    mendiant: 'une pièce au mendiant', soigner: q ? `${q}, soigné sans payer` : 'un soin offert', dedommager: q ? `la famille ${dePersonne(e.qui)} dédommagée` : 'une famille dédommagée',
    decoClaire: 'une décoration de lumière', missionL: q ? `${q}, retour de mission` : 'une mission de lumière', denoncer: q ? `${e.qui} dénoncé` : 'un recherché dénoncé',
    denoncerMafia: 'la Main Noire livrée à la Confrérie', ame: q ? `l'âme ${dePersonne(e.qui)}, offerte` : 'une âme offerte', piege: q ? `un piège glissé à ${q}` : 'un service de la Main Noire',
    commande: q ? `une commande pour ${q}` : 'une commande des Bannis', decoSombre: "une décoration d'ombre", missionO: q ? `${q}, mission pour les Bannis` : 'une mission pour les Bannis', cacher: q ? `${e.qui} caché` : 'un recherché caché',
  }[e.cle] || e.cle;
  return t;
}

// Le palier : de −3 (ombre épaisse) à +3 (lumière éclatante), 0 entre les deux.
function palierCamp(G) {
  const j = jaugeCamp(G);
  const p = Math.sign(j) * PALIERS_JAUGE.filter(p => Math.abs(j) >= p).length;
  // (audit v0.54) une fois le camp scellé, on ne repasse plus de l'autre côté
  if (G.camp === 'bien') return Math.max(1, p);
  if (G.camp === 'mal') return Math.min(-1, p);
  return p;
}

// De quel côté es-tu ? 'bien', 'mal' ou null tant qu'aucun palier n'est franchi.
function coteCamp(G) {
  if (G.camp) return G.camp;   // (audit v0.53 : une fois scellé, le camp ne bouge plus)
  const p = palierCamp(G);
  return p > 0 ? 'bien' : p < 0 ? 'mal' : null;
}

function nomPalierCamp(G) { return NOMS_PALIERS_JAUGE[palierCamp(G)]; }

// La réputation gagnée en terres de lumière : plus si tu es de leur côté.
function multReputationCamp(G, camp) {
  if (!camp) return 1;
  const e = EFFETS_CAMP[camp];
  return camp === 'bien' && coteCamp(G) === 'bien' ? e.reputationAllie : e.reputation;
}

// Le butin des terres d'ombre : plus si tu es de leur côté.
function multButinCamp(G, camp) {
  if (!camp) return 1;
  const e = EFFETS_CAMP[camp];
  return camp === 'mal' && coteCamp(G) === 'mal' ? e.butinAllie : e.butin;
}

// Le taux d'un prêt : la Banque Centrale fait de meilleurs prix du côté de la lumière.
function tauxPret(G, pret) {
  // (v0.90) un serment aux Bannis : la Main Noire te prête sans intérêts ; à la Confrérie : la Banque fait un geste de plus
  if (pret.mal) return sermentDe(G) === 'mal' ? 0 : pret.taux;
  if (sermentDe(G) === 'bien') return Math.max(0.02, pret.taux - (Math.max(0, palierCamp(G)) + 1) * REMISE_BANQUE_LUMIERE);
  return Math.max(0.02, pret.taux - Math.max(0, palierCamp(G)) * REMISE_BANQUE_LUMIERE);
}

// Un palier franchi (dans un sens ou dans l'autre) : une ligne pour la gazette du matin, une fois.
function nouvellePalierCamp(G) {
  const p = palierCamp(G);
  if (p === (G.palierJaugeVu || 0)) return null;
  G.palierJaugeVu = p;
  return p ? GAZETTE_PALIERS_JAUGE[p] : null;
}

// Le nom et le texte d'une pièce, selon le côté.
function pieceArmure(id, cote) {
  const p = ARMURE.find(a => a.id === id);
  return cote === 'sombre' ? { id, ...ARMURE_SOMBRE[id] } : p;
}

// --- Les petits mots qui s'accordent avec une marchandise ---
// (« la hache » : le h est aspiré ; « l'herbe », « l'huile » : il est muet)
const voyelle = mot => /^[aeiouyéèêàâîôû]/i.test(mot) || (/^h/i.test(mot) && !/^(hache|haut|hibou|héros|hall|hamac|hotte|houx|hutte)/i.test(mot));
function genreDe(id) { return GENRE_OBJETS[id] || 'f'; }
// « la torche », « l'épée », « le bouclier », « les bandages »
function leNom(id, nom) {
  const g = genreDe(id);
  return g.includes('p') ? 'les ' + nom : voyelle(nom) ? "l'" + nom : (g === 'm' ? 'le ' : 'la ') + nom;
}
// « de torche », « d'épée »
function deNom(nom) { return (voyelle(nom) ? "d'" : 'de ') + nom; }
// « le récit d'Aldric », « la lettre de Hilda » (les prénoms : pas de h muet)
function dePersonne(nom) { return (/^[aeiouyéèêàâîôû]/i.test(nom) ? "d'" : 'de ') + nom; }
// « une torche », « un bouclier », « des flèches »
function unNom(id) { const g = genreDe(id); return g.includes('p') ? 'des' : g === 'm' ? 'un' : 'une'; }
// « ma torche », « mon épée », « mon bouclier », « mes bandages »
function monNom(id, nom) { const g = genreDe(id); return g.includes('p') ? 'mes' : g === 'm' || voyelle(nom) ? 'mon' : 'ma'; }
// l'accord d'un adjectif : neuf / neuve / neufs / neuves
// (v0.58) « ouvre » ou « ouvrent » selon le nom du lieu (Les enchères ouvrent...)
function ouvrePluriel(cle) { return /^Les /.test(NOMS_LIEUX_MARCHE[cle] || '') ? 'ouvrent' : 'ouvre'; }
function pluriel(n, un, plusieurs) { return `${n} ${n > 1 ? plusieurs : un}`; }   // « 1 partie restante », « 3 parties restantes »
// Le genre du joueur : « réveillé(e) », « petit(e) »...
function eJ(G = window.GAME) { return G && G.joueur && G.joueur.feminin ? 'e' : ''; }
function accordAdj(id, m, f, mp, fp) { const g = genreDe(id); return g === 'm' ? m : g === 'f' ? f : g === 'mp' ? mp : fp; }

// (v0.60) Le nombre de cœurs au départ d'un récit
function pvDepartRecit(parti) { return (parti.resultat && parti.resultat.pvDepart) || parti.voyageur.pv; }

// (v0.60) Le carnet des choses étranges : les indices glissés dans les récits (le Conseil, les
// galeries creusées par d'autres mains, le Sage qui ne vieillit pas...), rangés au bureau.
const INDICES_ETRANGES = /d'autres mains|pour ne pas oublier|n'a pas changé d'un cheveu|effacées|dessins d'enfants|empêcher de revenir|à demi effacée|très vieux, qui chantaient|avec un portrait\. Son mari|outils de nains|Ça pleurait, dedans|personne d'autre ne se souvient, si loin|sceau du Conseil|n'attaquaient jamais, avant/;
function noterEtrangete(G, texte, v) {
  if (!texte || !INDICES_ETRANGES.test(texte)) return;
  G.etrangetes = G.etrangetes || [];
  const t = accord(texte, v);   // (on compare le texte accordé : sinon « payé{e} » ≠ « payée » et l'indice revient sans fin)
  if (G.etrangetes.some(e => e.texte === t || e.texte === texte)) return;
  G.etrangetes.push({ jour: G.jour, nom: v.nom, texte: t });
}

// (v0.74) Les avis de recherche de la semaine : trois têtes, et des primes qui grimpent tant
// que les bandits courent (chaque semaine où l'un reste affiché, sa prime prend 20 %).
function avisDeRecherche(G) {
  const semaine = Math.floor((G.jour - 1) / 7), n = AVIS_RECHERCHE.length;
  return [0, 1, 2].map(k => {
    const i = (semaine * 2 + k * 3) % n;
    // depuis combien de semaines est-il affiché ?
    let anciennete = 0;
    for (let s = semaine - 1; s >= 0 && [0, 1, 2].some(j => (s * 2 + j * 3) % n === i); s--) anciennete++;
    const a = AVIS_RECHERCHE[i];
    return { ...a, prime: Math.round(a.prime * (1 + 0.2 * anciennete) / 10) * 10, nouveau: anciennete === 0 };
  });
}

// --- (v0.86, lot A-3) Les imposteurs et l'inspection ---

// Les textes d'imposture : {nom}, {prenom}, {ami}, {Il}/{il} et {e} s'accordent à la personne.
// Le prénom d'un nom (« Sire Aldric le Hardi » → « Aldric », « Sœur Edwige » → « Edwige »)
function prenomDe(nom) { const m = nom.split(' '); return m[1] && /^(Sire|Sœur|Dame|Maître|Mère|Capitaine|Sergent|Garde|Grand-mère|Aïeule|Le|La)$/.test(m[0]) ? m[1] : m[0]; }
function texteImposture(t, v, ami = '') {
  return t.replaceAll('{nom}', v.nom).replaceAll('{prenom}', prenomDe(v.nom)).replaceAll('{ami}', ami)
    .replaceAll('{Il}', v.feminin ? 'Elle' : 'Il').replaceAll('{il}', v.feminin ? 'elle' : 'il').replaceAll('{e}', v.feminin ? 'e' : '').replaceAll('{J}', eJ());
}

// Parmi les clients imprévus du jour : un imposteur (environ un sur douze, un peu plus quand ta
// réputation grandit), et un honnête client qui a l'air louche (aussi souvent).
function deguiserClients(G, clients, debut) {
  if (G.jour < IMPOSTURE.jourMin) return;
  const chance = Math.min(IMPOSTURE.chanceMax, IMPOSTURE.chance + Math.max(0, G.reputation) / 400);
  for (let i = debut; i < clients.length; i++) {
    const v = clients[i];
    if (v.habitue || v.prestige || v.exige || v.recherche) continue;
    const de = Math.random();
    if (de < chance) {
      const type = auHasard(Object.keys(IMPOSTEURS)), I = IMPOSTEURS[type];
      let w = v;
      if (I.race) {
        // il se fait passer pour un autre : un nom d'emprunt, une allure de circonstance
        const pris = [...nomsActifs(G), ...clients.map(c => c.nom), ...Object.keys(G.personnes || {})];
        const prenoms = NOMS.humain.filter(([n, f]) => f === I.feminin && !pris.includes(I.nom(n.split(' ')[0])));
        if (!prenoms.length) continue;
        const prenom = auHasard(prenoms)[0].split(' ')[0];
        w = clients[i] = creerVoyageur(G, { nom: I.nom(prenom), race: I.race, feminin: I.feminin, niveau: 'aguerri' });
      }
      const connus = Object.keys(G.personnes || {}).filter(n => n !== w.nom && !G.personnes[n].mort && !G.personnes[n].banni && !G.personnes[n].feminin);   // (un « oncle »)
      const ami = connus.length ? auHasard(connus) : 'Garrick Cœur-de-Chêne';
      w.imposteur = { type, ami };
      w.accueilImposture = texteImposture(auHasard(I.accueil), w, ami);
    } else if (de < chance + IMPOSTURE.louche) {
      const type = auHasard(Object.keys(LOUCHES));
      v.louche = { type };
      v.accueilImposture = texteImposture(auHasard(LOUCHES[type].accueil), v);
    }
  }
}

// Les indices qu'un client laisse voir (trois, du plus visible au plus discret).
function indicesDe(v) {
  const ami = v.imposteur ? v.imposteur.ami : '';
  const liste = v.imposteur ? IMPOSTEURS[v.imposteur.type].indices : v.louche ? LOUCHES[v.louche.type].indices
    : [0, 1, 2].map(k => INDICES_HONNETES[(v.id * 7 + k * 2) % INDICES_HONNETES.length]);
  return liste.map(i => ({ ...i, t: texteImposture(i.t, v, ami) })).sort((a, b) => a.d - b.d);
}

// Inspecter : observer (ton flair décide de ce que tu remarques) ou fouiller son sac (tu vois tout,
// mais un client honnête est vexé... et un imposteur démasqué s'enfuit).
function inspecterClient(G, v, fouille) {
  const flair = niveauFlair(G);
  const indices = indicesDe(v).map(i => ({ ...i, vu: fouille || i.d <= flair * 0.8 + 0.2 }));
  const vus = indices.filter(i => i.vu);
  const louche = Math.max(0, Math.min(5, Math.round(2 + vus.filter(i => i.louche).length * 1.5 - vus.filter(i => !i.louche).length * 1.5)));
  const r = { indices, louche, flair };
  if (fouille && v.imposteur) r.demasque = true;
  else if (fouille) r.vexe = changerRelation(G, v.nom, -2) || '';
  return r;
}

// Un imposteur démasqué (refusé ou fouillé) : ton flair grandit.
function demasquerImposteur(G, v) {
  G.experience = Math.min(EXPERIENCE_MAX, (G.experience || 0) + IMPOSTURE.flairRefus);
  G.stats.imposteurs = (G.stats.imposteurs || 0) + 1;
  connaitre(G, v);
}

// Un imposteur servi : le baluchon est perdu ; on apprendra demain matin ce qu'il en a fait.
function arnaquer(G, v, colis) {
  const n = Object.values(colis).reduce((a, b) => a + b, 0);
  G.arnaques = [...(G.arnaques || []), { jour: G.jour, nom: v.nom, objets: n, texte: texteImposture(IMPOSTEURS[v.imposteur.type].arnaque, v, v.imposteur.ami) }];
  G.stats.arnaques = (G.stats.arnaques || 0) + 1;
}

// --- (v0.86, lot A-4) Le marchandage ---

function styleMarchandage(v) { return { ...STYLES_MARCHANDAGE.defaut, ...(STYLES_MARCHANDAGE[v.race] || {}) }; }
// Un nombre fixe par client (sa limite cachée ne change pas si on recharge la partie)
function aleaClient(v, sel) { let h = (v.id || 1) * 2654435761; for (const ch of sel) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return ((h >>> 0) % 1000) / 1000; }

// Le marchandage de sa part du butin : on l'ouvre (il annonce sa part), on demande plus, on accepte.
function ouvrirMarchandage(G, v) {
  if (!v.marchandage) {
    const st = styleMarchandage(v);
    const marge = st.marge[0] + Math.round(aleaClient(v, 'marge') * (st.marge[1] - st.marge[0]) / MARCHANDAGE.pas) * MARCHANDAGE.pas;
    v.marchandage = { part: MARCHANDAGE.base, max: MARCHANDAGE.base + marge, patience: st.patience, patienceMax: st.patience, fini: false };
  }
  return v.marchandage;
}
// Demander 5 % de plus : 'cede' (il accepte), 'refuse' (au-dessus de sa limite), 'part' (plus de patience)
function demanderPlus(G, v) {
  const m = ouvrirMarchandage(G, v), demande = m.part + MARCHANDAGE.pas;
  m.patience--;
  if (demande <= m.max) { m.part = demande; return m.patience <= 0 ? conclureMarchandage(G, v, 'cede') : 'cede'; }
  if (m.patience <= 0) {
    m.fini = true;
    changerRelation(G, v.nom, -2);
    G.reputation -= REFUS_CLIENT;
    return 'part';
  }
  return 'refuse';
}
// Il a encore de la marge ? Ses tics le trahissent (ton flair les voit mieux) ; le gobelin bluffe toujours.
function ticVisible(G, v) {
  const m = ouvrirMarchandage(G, v), st = styleMarchandage(v);
  if (st.bluffeur) return true;
  return m.part < m.max && aleaClient(v, 'tic' + m.part) < 0.45 + niveauFlair(G) * 0.55;
}
function conclureMarchandage(G, v, issue = 'accepte') {
  const m = ouvrirMarchandage(G, v);
  m.fini = true;
  if (v.butinBase == null) v.butinBase = v.butin;
  v.butin = Math.round(v.butinBase * m.part / MARCHANDAGE.base);
  // le nain respecte qui tient bon jusqu'au bout de sa limite
  if (styleMarchandage(v).respect && m.part >= m.max) changerRelation(G, v.nom, 1);
  return issue;
}
function texteMarchandage(v, cle, valeurs = {}) {
  let t = texteImposture(styleMarchandage(v)[cle], v);
  for (const [k, x] of Object.entries(valeurs)) t = t.replaceAll(`{${k}}`, x);
  return t;
}

// Les trouvailles : proposer 10 % de moins, jusqu'à son plancher (caché) ; sans patience, il remballe.
function marchanderTrouvaille(G, v, t) {
  const st = styleMarchandage(v);
  if (t.prixDepart == null) { t.prixDepart = t.prix; t.patience = st.patience; }
  const plancher = Math.round(t.prixDepart * (st.plancher + (aleaClient(v, 't' + t.tresor.nom) - 0.5) * 0.1));
  const propose = Math.max(1, Math.round(t.prix * (1 - MARCHANDAGE.pasTrouvaille)));
  t.patience--;
  if (propose >= plancher) { t.prix = propose; return { issue: 'cede', texte: auHasard(PAROLES_TROUVAILLE.cede).replaceAll('{prix}', propose).replaceAll('{J}', eJ(G)) }; }
  if (t.patience <= 0) { t.retire = true; return { issue: 'part', texte: auHasard(PAROLES_TROUVAILLE.part) }; }
  return { issue: 'refuse', texte: auHasard(PAROLES_TROUVAILLE.refuse).replaceAll('{prix}', t.prix) };
}

// --- (v0.86, lot A-2) Les recherchés au comptoir ---

// La lumière ou l'ombre penche d'un acte (comme une mission réussie dans une contrée de ce camp).
function pencherCamp(G, camp, n = 1) {
  G.reussites = G.reussites || { bien: 0, mal: 0 };
  const autre = camp === 'bien' ? 'mal' : 'bien';
  G.reussites[camp] = (G.reussites[camp] || 0) + n;
  if (G.reussites[camp] - (G.reussites[autre] || 0) > JAUGE_CAMP.ecartMax) G.reussites[camp] = (G.reussites[autre] || 0) + JAUGE_CAMP.ecartMax;
}

// Le jour du recherché de la semaine (tiré une fois par semaine, au hasard), et lui (ou son sosie).
function rechercheDuJour(G, duJour = []) {
  if (G.jour < RECHERCHE.jourMin) return null;
  const semaine = Math.floor((G.jour - 1) / 7);
  G.joursRecherche = G.joursRecherche || {};
  if (G.joursRecherche[semaine] == null) G.joursRecherche[semaine] = Math.max(G.jour, semaine * 7 + 1 + hasard(0, 6));
  if (G.joursRecherche[semaine] !== G.jour) return null;
  // (ni un bandit déjà arrêté, ni un qui est en mission ou dans la file, ni un mort)
  const pris = [...nomsActifs(G), ...duJour, ...Object.keys(G.personnes || {}).filter(n => G.personnes[n].mort || G.personnes[n].banni)];
  const avis = avisDeRecherche(G).filter(a => !(G.captures || []).includes(a.nom) && !pris.includes(a.nom));
  if (!avis.length) return null;
  const a = auHasard(avis);
  if (Math.random() < RECHERCHE.innocent) {
    // un honnête voyageur qui partage un signe distinctif avec le bandit (du même peuple)
    const race = NOMS[a.personne.race] ? a.personne.race : 'humain';
    const libres = NOMS[race].filter(([nom]) => !pris.includes(nom) && !(G.personnes || {})[nom]);
    if (!libres.length) return null;
    const [nom, feminin] = auHasard(libres);
    const v = creerVoyageur(G, { nom, race, feminin });
    v.apparence = { nom, race, feminin, marques: [a.personne.marques[0]] };
    v.recherche = { avis: a.nom, innocent: true, prime: a.prime };
    return v;
  }
  const v = creerVoyageur(G, { nom: a.nom, race: a.personne.race, feminin: !!a.personne.feminin, niveau: a.personne.niveau || 'aguerri' });
  v.apparence = a.personne;
  v.recherche = { avis: a.nom, innocent: false, prime: a.prime };
  return v;
}

// Appeler la garde. Un vrai bandit : la prime, de la réputation, un peu de lumière. Un innocent :
// la réputation en prend un coup, et il ne remettra plus les pieds chez toi.
function denoncerRecherche(G, v) {
  connaitre(G, v);
  if (!v.recherche.innocent) {
    G.captures = [...(G.captures || []), v.recherche.avis];
    const part = Math.round(v.recherche.prime * RECHERCHE.part / 5) * 5;
    encaisser(G, part, 'primes');
    G.reputation += RECHERCHE.reputation;
    pencherCamp(G, 'bien');
    pencher(G, 'denoncer', { qui: v.nom });
    return { juste: true, prime: part };
  }
  G.reputation -= RECHERCHE.erreur;
  G.personnes[v.nom] = { ...(G.personnes[v.nom] || {}), banni: true };
  changerRelation(G, v.nom, -5);
  return { juste: false };
}

// Le cacher dans l'arrière-boutique. Un vrai bandit : un peu d'ombre, et un objet interdit glissé
// sous ton buffet. Un innocent : il ne comprend pas bien, mais il te remercie. La garde passe
// souvent juste après poser des questions.
function cacherRecherche(G, v) {
  connaitre(G, v);
  let objet = null;
  if (!v.recherche.innocent) {
    pencherCamp(G, 'mal');
    pencher(G, 'cacher', { qui: v.nom });
    objet = auHasard(interditsDuPasseur());
    G.interdits[objet] = (G.interdits[objet] || 0) + 1;
  } else changerRelation(G, v.nom, 1);
  const garde = Math.random() < RECHERCHE.garde;
  if (garde) G.file.unshift({ type: 'gardeRecherche', voyageur: v });
  return { objet, garde };
}

// La garde demande : mentir (elle ne s'en rend compte qu'une fois sur quatre) ou livrer.
function repondreGarde(G, v, livrer) {
  if (livrer) {
    if (v.recherche.innocent) return denoncerRecherche(G, v);
    G.reussites.mal = Math.max(0, (G.reussites.mal || 0) - 1);   // (l'ombre gagnée en le cachant s'efface ; la lumière vient de la dénonciation)
    reprendreGeste(G, 'cacher');
    return denoncerRecherche(G, v);
  }
  const vu = Math.random() < RECHERCHE.mensongeVu && !v.recherche.innocent;
  if (vu) G.reputation -= RECHERCHE.erreur;
  return { vu };
}

// (v0.84) Ce que disent les passants dans la rue : des nouvelles du jeu (événements, gazette, têtes
// mises à prix, ton camp, tes dettes, tes héros...), ou des petites phrases pour rire.
const PHRASES_RUE = [
  "Ma voisine dit qu'un dragon a volé ses chaussettes. Moi je dis que c'est son mari.",
  "J'ai acheté une épée chez Thorgal. Elle coupe très bien. Mon pain, surtout.",
  "Les nains de la banque m'ont souri ce matin. Je vérifie mes poches depuis.",
  "On dit que les elfes ne dorment jamais. Moi, je ne dors plus depuis qu'ils chantent la nuit.",
  "Trois aventuriers m'ont demandé le chemin du donjon. Il n'y a pas de donjon. Ils sont partis quand même.",
  "Mon âne refuse d'avancer s'il ne voit pas la fontaine. Il a ses habitudes.",
  "Le crieur s'est enroué. Le silence, c'est merveilleux.",
  "J'ai fait un vœu à la fontaine : que le prix du pain baisse. Il a monté. Elle m'a puni.",
  "Paraît qu'un gobelin vend des choses « presque pas volées ». Presque.",
  "Mon fils veut devenir aventurier. Je lui ai offert une corde. Il s'est attaché au lit.",
  "Ils ont repeint la banque. Elle a l'air encore plus chère.",
  "Hier j'ai croisé un orc très poli. Il m'a dit pardon en me marchant sur le pied. Deux fois.",
  "Si tu vois un chat roux, ce n'est pas le mien. Le mien est roux aussi, mais lui, il est gentil.",
  "On m'a dit d'acheter des bandages « au cas où ». J'en ai cent. Il ne m'arrive jamais rien.",
  "Le hobbit d'à côté prend six repas par jour. Je l'ai suivi : il en prend sept.",
];
function phrasePassant(G, { nuit = false } = {}) {
  const prendre = l => l[Math.floor(Math.random() * l.length)];
  const nouvelles = [];
  for (const e of evenementsActifs(G)) if (EVENEMENTS[e.id] && EVENEMENTS[e.id].nouvelle) nouvelles.push(`Tu as entendu ? ${EVENEMENTS[e.id].nouvelle}`);
  const gaz = G.gazette && G.gazette.jour === G.jour ? G.gazette.lignes : [];
  if (gaz.length) nouvelles.push(`La gazette dit : « ${prendre(gaz)} » Ça alors !`);
  const avis = avisDeRecherche(G);
  if (avis.length) {
    const a = prendre(avis);
    nouvelles.push(prendre([
      `${a.nom}, ${a.prime} pièces la tête ! Si je le croise, je fais semblant de ne pas le voir. Ou pas.`,
      `Tu as vu l'affiche de ${a.nom} au tableau ? ${a.prime} pièces ! Avec ça, je m'achète une vache. Deux, même.`,
      `Ma tante jure avoir vu ${a.nom} acheter des navets. Elle voit des bandits partout, ma tante.`,
    ]));
  }
  const p = palierCamp(G);
  if (p >= 2) nouvelles.push(`Ton comptoir, c'est celui de la Confrérie, non ? Les gens disent que tu es quelqu'un de bien.`);
  if (p <= -2) nouvelles.push(`On raconte que des Bannis entrent chez toi à la nuit tombée... Je n'ai rien dit, hein.`);
  if ((G.prets || []).length) nouvelles.push(`Les banquiers nains parlent de toi. Rarement en bien.`);
  if (G.argent > 600) nouvelles.push(`Il paraît que tu dors sur un tas d'or. Il n'est pas trop dur, le tas ?`);
  const dernier = (G.historique || [])[0];
  if (dernier && dernier.retour >= G.jour - 2) {
    if (dernier.issue === 'vivant') nouvelles.push(`${dernier.nom.split(' ')[0]} est rentré${dernier.feminin ? 'e' : ''} les poches pleines, à ce qu'on dit ! Grâce à toi ?`);
    else if (dernier.issue !== 'echec') nouvelles.push(`Pauvre ${dernier.nom.split(' ')[0]}... On dit qu'${dernier.feminin ? 'elle' : 'il'} n'est jamais revenu${dernier.feminin ? 'e' : ''}. Les temps sont durs.`);
  }
  if (typeof forgeConstruite === 'function' && forgeConstruite(G)) nouvelles.push(`Ça martèle fort chez toi, la nuit ! Ta forge réveille tout le quartier.`);
  if (typeof chatAdopte === 'function' && chatAdopte(G)) nouvelles.push(`C'est ton chat, le matou qui dort sur ta fenêtre ? Il a l'air plus riche que moi.`);
  if (G.mafia && G.mafia.engage && !G.mafia.sorti) nouvelles.push(`Des types en capuche noire traînent près de ta porte. Des amis à toi ?`);
  if (nuit) nouvelles.push('Tu ne dors pas, toi non plus ? Les lanternes de la rue, ça me donne des idées.', 'Chut... la garde fait sa ronde.');
  // une fois sur deux, une nouvelle du jeu ; sinon, une phrase pour rire
  const part = Math.min(0.6, 0.25 + nouvelles.length * 0.08);   // (peu de nouvelles : surtout des phrases pour rire)
  return nouvelles.length && Math.random() < part ? prendre(nouvelles) : prendre(PHRASES_RUE);
}

// Y a-t-il du neuf sur le tableau (un « ! » au-dessus) : un événement qui commence ou finit
// aujourd'hui, ou de nouvelles têtes mises à prix ; jusqu'à ce que tu viennes lire.
function tableauANouveau(G) {
  if (G.tableauLu === G.jour) return false;
  const evts = (G.evenements || []).some(e => e.debut === G.jour || e.fin === G.jour);
  return evts || (G.jour - 1) % 7 === 0;
}

// --- (v0.82, étape 10b) La forge chez soi ---

function interditsDuPasseur() { return Object.keys(INTERDITS).filter(id => !INTERDITS[id].forge); }
// Ce que les Bannis peuvent commander : les armes forgées aussi, une fois ta forge construite
function interditsCommandables(G) { return Object.keys(INTERDITS).filter(id => !INTERDITS[id].forge || forgeConstruite(G)); }

function etatForge(G) {
  if (!G.forge) G.forge = { construite: false, achat: null, aldo: false, baba: false, file: [], progresAldo: 0, armesAldo: 0, nuit: [] };
  return G.forge;
}
function forgeConstruite(G) { return !!(G.forge && G.forge.construite); }
// La forge peut être proposée à partir du saut d'un an (★3)
function forgeProposee(G) { return (G.paliersEtoiles || []).includes(FORGE.etoiles); }
function babaDisponible(G) { return (G.paliersEtoiles || []).includes(FORGE.forgerons.baba.etoiles); }

// Construire la forge : payée tout de suite, montée la nuit par les ouvriers
function acheterForge(G) {
  const f = etatForge(G);
  if (f.construite || f.achat) return 'La forge est déjà commandée.';
  if (!forgeProposee(G)) return `La forge s'ouvre avec les contrées à ${FORGE.etoiles} étoiles.`;
  if (!peutPayer(G, FORGE.prix)) return manqueArgent(G, FORGE.prix, `Il te faut ${FORGE.prix} pièces.`);
  payer(G, FORGE.prix, 'ameliorations');
  f.achat = G.jour;
  return null;
}

function engagerForgeron(G, id) {
  const f = etatForge(G), d = FORGE.forgerons[id];
  if (!f.construite) return "Il faut d'abord une forge.";
  if (f[id]) return `${d.nom} travaille déjà pour toi.`;
  if (id === 'baba' && !babaDisponible(G)) return `${d.nom} n'arrivera qu'avec les contrées à ${d.etoiles} étoiles.`;
  f[id] = true;
  return null;
}

function rangAldo(G) {
  const n = etatForge(G).armesAldo;
  return [...FORGE.rangsAldo].reverse().find(r => n >= r.armes);
}

// Ce qu'il faut pour forger une arme (armes interdites comprises), et peut-on le faire ?
function recetteDe(id) { return RECETTES[id] || RECETTES_OMBRE[id] || null; }
function enStockPourForge(G, mat) {
  if (MATERIAUX[mat]) return G.materiaux[mat] || 0;
  if (INTERDITS[mat]) return G.interdits[mat] || 0;
  return G.stock[mat] || 0;
}
function peutForger(G, id) {
  const f = etatForge(G);
  if (!f.construite) return "Il faut d'abord une forge.";
  if (!f.aldo && !f.baba) return "Personne ne travaille à la forge : engage un forgeron.";
  if (RECETTES_OMBRE[id] && coteCamp(G) !== 'mal') return 'Les armes interdites ne se forgent que du côté de l\'ombre.';
  const r = recetteDe(id);
  if (!r) return 'Pas de recette.';
  for (const [mat, n] of Object.entries(r)) if (enStockPourForge(G, mat) < n) return `Il manque : ${nomForge(mat).toLowerCase()} (${n} pour la recette).`;
  return null;
}
function nomForge(id) { return INTERDITS[id] ? INTERDITS[id].nom : nomObjet(id); }

// Mettre une arme en commande pour cette nuit : les matériaux sont pris tout de suite
function commanderArme(G, id) {
  const e = peutForger(G, id);
  if (e) return e;
  for (const [mat, n] of Object.entries(recetteDe(id))) {
    if (MATERIAUX[mat]) G.materiaux[mat] -= n;
    else if (INTERDITS[mat]) G.interdits[mat] -= n;
    else { G.stock[mat] -= n; if (G.belOuvrage[mat] > G.stock[mat]) G.belOuvrage[mat] = G.stock[mat]; }
  }
  etatForge(G).file.push(id);
  return null;
}
// Annuler une commande : les matériaux reviennent
function annulerArme(G, index) {
  const f = etatForge(G), id = f.file[index];
  if (!id) return;
  f.file.splice(index, 1);
  for (const [mat, n] of Object.entries(recetteDe(id))) {
    if (MATERIAUX[mat]) G.materiaux[mat] += n;
    else if (INTERDITS[mat]) G.interdits[mat] = (G.interdits[mat] || 0) + n;
    else G.stock[mat] = (G.stock[mat] || 0) + n;
  }
}

// Combien d'armes sortiront cette nuit (pour l'affichage)
function capaciteForge(G) {
  const f = etatForge(G);
  return (f.baba ? FORGE.forgerons.baba.vitesse : 0) + (f.aldo ? rangAldo(G).vitesse : 0);
}

// La nuit à la forge : les salaires, puis les armes qui sortent (Baba d'abord, puis Aldo)
function nuitDeLaForge(G) {
  const f = G.forge;
  if (!f) return;
  f.nuit = [];
  if (f.achat && !f.construite) { f.construite = true; f.achat = null; f.nouvelle = true; }
  if (!f.construite) return;
  if (f.aldo) payer(G, FORGE.forgerons.aldo.salaire, 'salaires');
  if (f.baba) payer(G, FORGE.forgerons.baba.salaire, 'salaires');
  const sortir = (id, qui, bel) => {
    if (INTERDITS[id]) G.interdits[id] = (G.interdits[id] || 0) + 1;
    else { G.stock[id] = (G.stock[id] || 0) + 1; if (bel) G.belOuvrage[id] = (G.belOuvrage[id] || 0) + 1; }
    f.nuit.push({ id, qui, bel: !!bel && !INTERDITS[id] });
  };
  if (f.baba) for (let k = 0; k < FORGE.forgerons.baba.vitesse && f.file.length; k++) sortir(f.file.shift(), 'baba', Math.random() < FORGE.forgerons.baba.belOuvrage);
  if (f.aldo && f.file.length) {
    const r = rangAldo(G);
    f.progresAldo += r.vitesse;
    while (f.progresAldo >= 1 && f.file.length) {
      f.progresAldo -= 1;
      f.armesAldo++;
      sortir(f.file.shift(), 'aldo', Math.random() < r.belOuvrage);
      const nouveau = rangAldo(G);
      if (nouveau !== r) f.nuit.push({ rang: nouveau.nom });
    }
  } else if (!f.file.length) f.progresAldo = 0;
  // (le bel ouvrage ne dépasse jamais ce qu'il reste en réserve)
  for (const id of Object.keys(G.belOuvrage)) if (G.belOuvrage[id] > (G.stock[id] || 0)) G.belOuvrage[id] = G.stock[id] || 0;
}

// Ce que la forge a sorti cette nuit, en une phrase (pour le réveil et la forge)
function nouvellesDeLaForge(G) {
  const f = G.forge;
  if (!f || !f.nuit || !f.nuit.length) return null;
  const armes = f.nuit.filter(e => e.id).map(e => nomForge(e.id).toLowerCase() + (e.bel ? ' (bel ouvrage !)' : ''));
  const rang = f.nuit.find(e => e.rang);
  return (armes.length ? `La forge a tourné toute la nuit : ${armes.join(', ')}.` : '') + (rang ? ` Aldo est passé ${rang.rang} !` : '');
}

// (option A, validée le 18/10) Les lots en gros chez Thorgal, pour qui a une forge
function prixLotGros(G, mat) {
  const offre = G.etals && G.etals.forge && G.etals.forge[mat];
  const unite = offre ? prixMarchand(G, 'forge', mat) : prixDeBase(mat);
  return Math.round(unite * FORGE.lot * (1 - FORGE.remiseGros));
}
function acheterLotGros(G, mat) {
  if (!forgeConstruite(G)) return 'Thorgal ne vend en gros qu\'aux forgerons.';
  const prix = prixLotGros(G, mat);
  if (!peutPayer(G, prix)) return manqueArgent(G, prix, "Pas assez d'argent ! Passe à la banque pour un prêt.");
  G.materiaux[mat] = (G.materiaux[mat] || 0) + FORGE.lot;
  return { message: depenserChez(G, 'forge', prix) };
}

// Au départ d'un aventurier : les armes « bel ouvrage » de son baluchon (prises en premier)
function belOuvrageAuDepart(G, voyageur, colis) {
  const bel = [];
  for (const [id, n] of Object.entries(colis)) {
    const k = Math.min(n, (G.belOuvrage && G.belOuvrage[id]) || 0);
    if (k > 0) { G.belOuvrage[id] -= k; bel.push(id); }
  }
  return bel;
}
