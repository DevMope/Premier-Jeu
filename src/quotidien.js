// (v1.54, planche 62 validée) Les petites logiques du quotidien : les provisions qui se périment, le jour de marché,
// l'anniversaire des habitués, et des cadeaux plus clairs (ce que le client en pensera, avant de l'offrir).

// --- Les provisions se périment ---
// Chaque unité a sa date limite (un « lot » = le jour où elle tourne). On ne touche pas aux achats ni aux départs :
// chaque fois qu'on regarde, on remet les lots d'accord avec la réserve (les nouvelles unités sont fraîches du jour, et
// celles qui sont parties étaient les plus vieilles : la plus vieille part en premier).
const FRAICHEUR = {
  ration: { ou: 'stock', jours: 10, nom: 'ration' },
  gateau: { ou: 'cadeaux', jours: 4, nom: 'gâteau aux mûres' },
};
const CELLIER = { prix: 650, facteur: 2 };   // (une amélioration : les provisions s'y gardent deux fois plus)
function aCellier(G) { return typeof niveauAmelioration === 'function' && niveauAmelioration(G, 'cellier') > 0; }
function dureeFraicheur(G, id) { return FRAICHEUR[id].jours * (aCellier(G) ? CELLIER.facteur : 1); }
function lotsFrais(G, id) {
  const F = FRAICHEUR[id], boite = G[F.ou] || {}, n = Math.max(0, boite[id] || 0);
  const lots = (G.fraicheur = G.fraicheur || {})[id] = (G.fraicheur[id] || []).sort((a, b) => a - b);
  while (lots.length > n) lots.shift();
  while (lots.length < n) lots.push(Math.max(G.jour, FRAICHEUR_DES - 1) + dureeFraicheur(G, id));   // (avant le jour 15, le compte part du jour 14)
  return lots;
}
// Combien de jours il reste à la plus vieille (ou null si la réserve est vide)
function fraicheurRestante(G, id) { const l = lotsFrais(G, id); return l.length ? Math.max(0, l[0] - G.jour) : null; }
// La nuit (G.jour vient de passer au lendemain) : la canicule d'hier les a gâtées un peu plus vite, le givre les garde ;
// ce qui a tourné quitte la réserve (le chat renifle, et s'en va)
const FRAICHEUR_DES = 15;   // (rien ne tourne avant le jour 15 : la boutique est encore fragile, d'après la simulation)
function nuitDesProvisions(G) {
  const lignes = [], hier = G.jour - 1;
  if (G.jour < FRAICHEUR_DES) return lignes;
  const chaud = typeof meteoDu === 'function' && meteoDu(G, hier) === 'canicule', froid = typeof saisonDe === 'function' && saisonDe(G, hier) === 'givre';
  for (const id of Object.keys(FRAICHEUR)) {
    const F = FRAICHEUR[id], boite = G[F.ou]; if (!boite) continue;
    G.jour = hier; const lots = lotsFrais(G, id); G.jour = hier + 1;   // (accordés avec la réserve d'hier soir)
    for (let i = 0; i < lots.length; i++) lots[i] += (froid ? 1 : 0) - (chaud ? 1 : 0);
    const tournees = lots.filter(d => d <= G.jour).length;
    if (!tournees) continue;
    G.fraicheur[id] = lots.filter(d => d > G.jour);
    boite[id] = Math.max(0, (boite[id] || 0) - tournees);
    const pl = tournees > 1 ? 's' : '';
    lignes.push(`${tournees} ${F.nom}${pl} ${tournees > 1 ? 'ont' : 'a'} tourné dans la réserve${chaud ? ' (la canicule)' : ''}${typeof chatAdopte === 'function' && chatAdopte(G) ? ' : le chat renifle, et s\'en va.' : ' : à jeter.'}`);
  }
  return lignes;
}

// --- Le jour de marché : chaque semaine, le 6e jour ---
const JOUR_DE_MARCHE = { jour: 6, prix: 0.9, clients: 2 };
function jourDeMarche(G, jour = G.jour) {
  if (!G || jour < 3) return false;
  return ((jour - 1 + (G.decalageJours || 0)) % JOURS_PAR_SEMAINE) + 1 === JOUR_DE_MARCHE.jour;
}
function prixJourDeMarche(G) { return jourDeMarche(G) ? JOUR_DE_MARCHE.prix : 1; }
function clientsJourDeMarche(G, jour) { return jourDeMarche(G, jour) ? JOUR_DE_MARCHE.clients : 0; }
function nouvelleJourDeMarche(G) {
  return jourDeMarche(G) ? "C'est jour de marché ! Des colporteurs de passage, les prix baissent d'un dixième, et du monde de passage viendra jusqu'à ton comptoir." : null;
}

// --- L'anniversaire des habitués ---
// Le jour (dans l'année) et l'âge viennent du nom : toujours les mêmes pour une même personne
function hachageNom(nom, sel = 0) { let h = 2166136261 ^ sel; for (const c of nom) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0); }
function anniversaireDe(nom) { return 1 + hachageNom(nom, 7) % JOURS_PAR_AN; }
function ageDe(G, nom) { return 19 + hachageNom(nom, 11) % 36 + (dateDuJour(G).an - 1); }
function jourDeLAn(G, jour = G.jour) { return (Math.max(0, jour - 1) + (G.decalageJours || 0)) % JOURS_PAR_AN + 1; }
// Les habitués dont c'est l'anniversaire aujourd'hui (vivants, pas en mission)
function anniversairesDuJour(G) {
  if (!G || !G.habitues || G.jour < 3) return [];
  const partis = (G.partis || []).filter(p => !p.termine).map(p => p.voyageur && p.voyageur.nom);
  return G.habitues.filter(h => anniversaireDe(h.nom) === jourDeLAn(G) && !partis.includes(h.nom) && !(G.personnes[h.nom] && (G.personnes[h.nom].mort || G.personnes[h.nom].banni)));
}
function nouvelleAnniversaire(G) {
  const a = anniversairesDuJour(G)[0];
  return a ? `Le registre l'a noté : c'est l'anniversaire de ${a.nom} aujourd'hui (${ageDe(G, a.nom)} ans). ${a.feminin ? 'Elle' : 'Il'} passera sûrement.` : null;
}
// Au matin, l'habitué dont c'est l'anniversaire vient le dire (une seule fois par an)
function clientAnniversaire(G, dejaLa) {
  const a = anniversairesDuJour(G).find(h => !dejaLa.includes(h.nom));
  if (!a) return null;
  const v = creerVoyageur(G, { ...a });
  v.anniversaire = G.jour;
  return v;
}
const EFFET_ANNIVERSAIRE = { cadeau: 2, souhait: 1, oubli: -1 };   // (un cadeau compte double ; le souhaiter : +1 ; l'oublier : −1)
// Ta réponse : 'souhait' ou 'oubli' (le cadeau, lui, passe par offrirCadeau, qui compte double ce jour-là)
function feterAnniversaire(G, v, choix) {
  const p = connaitre(G, v); if (p.anniversaireFete === G.jour) return null;
  p.anniversaireFete = G.jour;
  const m = changerRelation(G, v.nom, EFFET_ANNIVERSAIRE[choix]);
  const e = v.feminin ? 'e' : '';
  const textes = {
    souhait: `« Joyeux anniversaire ! » ${v.feminin ? 'Elle' : 'Il'} rougit jusqu'aux oreilles : « Tu y as pensé... merci. » (+1 relation)`,
    oubli: `${v.feminin ? 'Elle' : 'Il'} attend un instant, puis soupire et passe à ses affaires. Déçu${e}. (−1 relation)`,
  };
  return textes[choix] + (m ? ' ' + m : '');
}

// --- Des cadeaux plus clairs ---
// Ce que le client pense d'un cadeau : 'adore' (le premier de ses goûts), 'aime', 'bof', 'deteste' ; et si tu le sais déjà
// (tu lui en as offert un, ou ton flair le devine)
const AVIS_CADEAU = {
  adore: { signe: '♥ adore', couleur: '#f07a9a', relation: 3, trefle: 1 },
  aime: { signe: '✓ aime', couleur: '#7ad86a', relation: 2, trefle: 1 },
  bof: { signe: '· bof', couleur: '#c8c0a8', relation: 1, trefle: 0 },
  deteste: { signe: '✗ déteste', couleur: '#e06a5a', relation: -2, trefle: 0 },
  inconnu: { signe: '? jamais offert', couleur: '#d8d0a0' },
};
function avisCadeau(v, id) {
  const g = GOUTS[v.race] || { aime: [], deteste: [] };
  if (g.aime[0] === id) return 'adore';
  return g.aime.includes(id) ? 'aime' : g.deteste.includes(id) ? 'deteste' : 'bof';
}
// Ce que tu sais de ses goûts : ce qu'il a déjà reçu, ou, avec du flair, ce qu'on devine (une chance par cadeau)
function avisConnu(G, v, id) {
  const p = (G.personnes || {})[v.nom] || {};
  if (p.gouts && p.gouts[id]) return avisCadeau(v, id);
  const flair = typeof niveauFlair === 'function' ? niveauFlair(G) : 0;
  return flair > 0 && (hachageNom(v.nom + id, 3) % 100) / 100 < flair * 0.8 ? avisCadeau(v, id) : 'inconnu';   // (ton flair devine, toujours les mêmes)
}
function texteEffetCadeau(avis, anniversaire = false) {
  if (avis === 'inconnu') return 'on verra bien...';
  const a = AVIS_CADEAU[avis], k = anniversaire && a.relation > 0 ? 2 : 1, r = a.relation * k;
  return `${r > 0 ? '+' : '−'}${Math.abs(r)} relation${a.trefle ? ` · +${a.trefle} trèfle` : ''}`;
}
// Ce que dit Garrick, croisé sur la place un jour de marché
const PHRASES_GARRICK_MARCHE = [
  "Ah, gamin ! Jour de marché : les colporteurs cassent les prix, alors tout le monde en profite. Remplis ta réserve, ce soir tu me remercieras.",
  "Moi ? Je fais mes courses, comme tout le monde. Un vieux rôdeur, ça mange aussi.",
  "Regarde-moi ce monde... Du monde de passage, ça veut dire du monde à ton comptoir. Ne traîne pas trop ici.",
  "Les rations, prends-les fraîches, et pas plus qu'il n'en faut : au bout de dix jours, ça tourne.",
];
