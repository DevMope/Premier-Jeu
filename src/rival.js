// (v1.11, lot C-5, planches 40 v2 et 41 validées) Lucien Belhomme, le paon du Conseil : l'ancien apprenti de Garrick,
// devenu fournisseur « agréé ». Le 1er du mois qui suit ta première commande scellée, il ouvre « Au Comptoir Agréé »
// juste à côté de chez toi. Chaque jour, il attire des clients de ta file (selon sa « pression », de 1 à 3) ; chaque
// mois, le crieur compare vos deux comptoirs en aventuriers revenus vainqueurs. Tu gagnes : sa pression baisse ; il
// gagne : elle monte, et il vient se pavaner. Battu à pression 1, il ferme : sa boutique est à vendre.
const RIVAL = {
  nom: 'Lucien Belhomme', boutique: 'Au Comptoir Agréé', sous: 'Le comptoir d’à côté',
  pression: { depart: 2, max: 3, relache: 3 },   // il arrive sûr de lui (2) ; trop longtemps au maximum, il se relâche
  vols: { 1: 0.5, 2: 1, 3: 2 },          // clients de passage attirés par jour (jamais les lettres, les retours, les visites)
  taux: { 1: 0.55, 2: 0.65, 3: 0.75 },   // il sert autant de clients que toi ; la part qu'il ramène vivants, selon sa pression
  rachat: { parEtoile: 1500 },           // 3 000 p. à ★2, 7 500 p. à ★5
  orphelinat: { reputation: 3 },
};
POSTES.rachat = "Rachat de la boutique d'à côté";

// Ses répliques (planches 40 et 41) : vaniteux et moqueur, avec le fond du va-t-en-guerre
const REPLIQUES_RIVAL = {
  ouverture: [
    "« Oh ! Le petit protégé du vieux Garrick. Il te raconte encore ses histoires de doyens ? Lucien Belhomme, fournisseur agréé par le Conseil. J'ouvre juste à côté : dix pour cent de moins qu'ici. Sans rancune ! »",
    "« Chez moi, c'est agréé par le Conseil. Chez toi... c'est agréé par qui, au juste ? Enfin. Bonne chance, voisin. Tu vas en avoir besoin. »",
  ],
  pavane: [
    "« Encore un mois pour moi ! Le Conseil m'a reçu à sa table. Toi, tu as reçu... des clients fatigués ? »",
    "« Garrick voulait faire de moi un conteur. Moi, je voulais la guerre. Devine qui le Conseil a décoré ? »",
    "« Mes aventuriers reviennent vivants, les tiens reviennent... quand ils reviennent. Le crieur a compté, pas moi ! »",
  ],
  pavaneOmbre: "« Un Banni rôde près de ta porte, à ce qu'on dit ? Préviens-moi. J'ai des amis à la caserne. »",
  moquerie: "« Alors, on a fait faux bond au Conseil ? Chez moi, les commandes scellées arrivent à l'heure. Garrick t'a appris à rater, aussi ? »",
  depart: "« Ce n'est qu'un repli. Le Conseil se souviendra de moi... et de toi. »",
};

function rivalDe(G) { return (G.rival = G.rival || { etat: 'absent', pression: RIVAL.pression.depart, vols: 0, mois: null, moisGagnes: 0, moisPerdus: 0 }); }
function rivalOuvert(G) { return !!(G.rival && G.rival.etat === 'ouvert'); }
function rivalVisible(G) { return !!(G.rival && G.rival.etat !== 'absent'); }   // (sa maison est là : ouverte, à vendre, ou rachetée)
function prixRachat(G) { return RIVAL.rachat.parEtoile * Math.min(5, etoilesDe(G)); }
function joursAvantLePremier(G) { const d = dateDuJour(G); return d.jourDuMois === 1 ? 0 : JOURS_PAR_MOIS - d.jourDuMois + 1; }

// Le score du mois en cours : tes aventuriers revenus vainqueurs, les siens (arrondis), les jours qui restent
function scoreDuMois(G) {
  const r = rivalDe(G), m = r.mois || { toi: 0, lui: 0 };
  const j = joursAvantLePremier(G), bilanAujourdhui = r.dernierMois && r.dernierMois.jour === G.jour;
  return { toi: m.toi, lui: Math.floor(m.lui), joursRestants: j === 0 && !bilanAujourdhui ? JOURS_PAR_MOIS : j, pression: r.pression, etat: r.etat };
}

// La nuit, avant le changement de jour : les comptes du jour (tes retours vainqueurs, ses clients), et la moquerie
// qui se prépare après une commande scellée manquée
function nuitDuRival(G) {
  const r = rivalDe(G);
  if (r.etat !== 'ouvert') return;
  const m = r.mois || (r.mois = { debut: G.jour, toi: 0, lui: 0 });
  m.toi += G.journal.retours || 0;
  m.lui += (G.journal.servis || 0) * RIVAL.taux[r.pression];
  r.volesAujourdhui = 0;
  const ratees = (G.conseil && G.conseil.ratees) || 0;
  if (ratees > (r.rateesVues || 0)) {
    r.rateesVues = ratees;
    r.moquerieJour = G.jour + 1;
    if (G.annonceConseil) G.annonceConseil += ' « Au Comptoir Agréé », lui, a livré à temps.';
  }
}

// Au matin : l'ouverture (le 1er du mois après ta première commande scellée), puis chaque 1er du mois le bilan
function matinDuRival(G) {
  const r = rivalDe(G), lignes = [], d = dateDuJour(G);
  if (r.etat === 'absent') {
    if (!r.ouvreLe && G.commandeRoyale) r.ouvreLe = G.jour + joursAvantLePremier(G) || G.jour + JOURS_PAR_MOIS;
    if (r.ouvreLe && G.jour >= r.ouvreLe) {
      r.etat = 'ouvert'; r.pression = RIVAL.pression.depart; r.mois = { debut: G.jour, toi: 0, lui: 0 }; r.ouvertLe = G.jour; r.ouvertureJour = G.jour;
      G.annonceRival = `Grande ouverture à côté de « ${G.nomShop} » : « Au Comptoir Agréé », fournisseur agréé par le Conseil, dix pour cent de moins que le voisin !`;
      lignes.push("Des coups de marteau toute la nuit, de l'autre côté du mur : une boutique ouvre juste à côté de la tienne. Une enseigne dorée, un tapis rouge... et une tête que Garrick n'aimerait pas revoir.");
    }
    return lignes;
  }
  if (r.etat !== 'ouvert') return lignes;
  if (d.jourDuMois === 1 && r.mois && r.mois.debut < G.jour) {
    const toi = r.mois.toi, lui = Math.floor(r.mois.lui);
    const bilan = { jour: G.jour, toi, lui, gagne: toi > lui ? 'toi' : lui > toi ? 'lui' : null, pressionAvant: r.pression, ferme: false };
    if (bilan.gagne === 'toi') {
      r.moisGagnes++; r.serie = 0;
      if (r.pression <= 1) { r.etat = 'aVendre'; r.aVendreDepuis = G.jour; bilan.ferme = true; G.annonceRival = `« Au Comptoir Agréé » ferme boutique ! Lucien Belhomme plie bagage, battu par « ${G.nomShop} ». Sa maison est à vendre chez le notaire du Conseil.`; }
      else r.pression--;
    } else if (bilan.gagne === 'lui') {
      r.moisPerdus++;
      r.serie = r.pression >= RIVAL.pression.max ? (r.serie || 0) + 1 : 0;
      // (trop sûr de lui après plusieurs mois au maximum, il se relâche : une chance de revenir)
      if (r.serie >= RIVAL.pression.relache) { r.pression = 1; r.serie = 0; bilan.relache = true; }
      else r.pression = Math.min(RIVAL.pression.max, r.pression + 1);
      r.pavaneJour = G.jour + 1;   // (housekeep v1.14 : le lendemain du crieur)
    } else r.serie = 0;
    bilan.pression = r.pression;
    r.dernierMois = bilan;
    r.mois = { debut: G.jour, toi: 0, lui: 0 };
  }
  return lignes;
}

// Dans la file du jour : les clients de passage qu'il attire (ils quitteront la file sous tes yeux)
function volerClients(G, file) {
  const r = rivalDe(G);
  r.volesAujourdhui = 0;
  if (r.etat !== 'ouvert') return;
  r.vols = (r.vols || 0) + RIVAL.vols[r.pression];
  let n = Math.floor(r.vols);
  r.vols -= n;
  for (let i = file.length - 1; i >= 0 && n > 0; i--) {
    const e = file[i];
    const v = e.voyageur;
    if (e.type !== 'client' || v.prevu || v.prestige || v.recherche || v.ancienOrphelinat || v.genereux || v.exige || v.imposteur) continue;   // (housekeep v1.14 : ni les présages de la diseuse, ni ceux qui reviennent fâchés)
    e.vole = true; n--; r.volesAujourdhui++;
  }
}

// Ses visites au comptoir : l'ouverture, la pavane après un mois gagné, la moquerie après une commande manquée
function visitesDuRival(G) {
  const r = G.rival;
  if (!r || r.etat !== 'ouvert') return [];
  if (r.ouvertureJour === G.jour) return [{ type: 'rival', mode: 'ouverture' }];
  if (r.pavaneJour === G.jour) return [{ type: 'rival', mode: 'pavane' }];
  if (r.moquerieJour === G.jour) return [{ type: 'rival', mode: 'moquerie' }];
  return [];
}
// Le crieur, en fin de file (avant la Faucheuse), le jour du bilan
function crieurDuJour(G) {
  const r = G.rival;
  return r && r.dernierMois && r.dernierMois.jour === G.jour ? [{ type: 'crieur' }] : [];
}
// Ce que crie le crieur
function texteDuCrieur(G) {
  const b = rivalDe(G).dernierMois;
  if (!b) return '';
  const compte = `Oyez, oyez ! Le mois des comptoirs ! « ${G.nomShop} » : ${pluriel(b.toi, 'aventurier revenu vainqueur', 'aventuriers revenus vainqueurs')}. « Au Comptoir Agréé » : ${b.lui} !`;
  if (b.ferme) return `${compte} Lucien Belhomme ferme boutique ! Sa maison est à vendre chez le notaire du Conseil.`;
  if (b.gagne === 'toi') return `${compte} Le paon perd de sa superbe : il attirera moins de monde ce mois-ci.`;
  if (b.gagne === 'lui' && b.relache) return `${compte} Lucien Belhomme pavoise... et se relâche : trop sûr de lui, il attirera bien moins de monde ce mois-ci.`;
  if (b.gagne === 'lui' && b.pression >= RIVAL.pression.max && b.pressionAvant >= RIVAL.pression.max) return `${compte} Lucien Belhomme pavoise : il attirera toujours autant de tes clients ce mois-ci.`;
  if (b.gagne === 'lui') return `${compte} Lucien Belhomme pavoise : il attirera encore plus de tes clients ce mois-ci.`;
  return `${compte} Égalité : rien ne bouge.`;
}

// La boutique à vendre : la lettre du notaire (une fois, le matin), puis le rachat quand tu veux
function lettreNotaireDuJour(G) { const r = G.rival; return !!(r && r.etat === 'aVendre' && !r.notaireVu); }
function racheterBoutique(G, choix) {
  const r = rivalDe(G), prix = prixRachat(G);
  if (r.etat !== 'aVendre' || !['orphelinat', 'bar'].includes(choix)) return { erreur: 'Rien à racheter' };
  if (!peutPayer(G, prix)) return { erreur: manqueArgent(G, prix, `Il te manque ${prix - Math.floor(G.argent)} pièces pour racheter la boutique.`) };
  payer(G, prix, 'rachat');
  r.etat = choix; r.racheteLe = G.jour; r.prixPaye = prix;
  if (choix === 'orphelinat') G.reputation += RIVAL.orphelinat.reputation;
  G.annonceRival = choix === 'orphelinat' ? `« ${G.nomShop} » a racheté la boutique du paon pour en faire un orphelinat ! Tout le Comté en parle.`
    : `« ${G.nomShop} » a racheté la boutique d'à côté pour en faire un petit bar. Le Comté a hâte d'y trinquer !`;
  return { ok: true, prix };
}
