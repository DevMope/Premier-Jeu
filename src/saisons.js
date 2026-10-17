// (v0.99, lot B-1) Les saisons qui comptent : chaque mois du calendrier est une saison (Semailles,
// Moissons, Brumes, Givre). Elles changent le décor (voir saisonsHD.js), les prix du marché, et
// rendent certaines épreuves plus dures quand l'aventurier n'a pas le bon objet.

const SAISONS = {
  semailles: { nom: 'Semailles', mois: 0, sous: 'Le printemps est là', effet: 'Le printemps : les rivières en crue, plus de novices au comptoir', icone: 'fleur' },
  moissons: { nom: 'Moissons', mois: 1, sous: 'Le temps des récoltes', effet: "L'été : la soif sur les routes", icone: 'epi' },
  brumes: { nom: 'Brumes', mois: 2, sous: 'Les jours raccourcissent', effet: "L'automne : la brume, on se perd plus souvent", icone: 'feuille' },
  givre: { nom: 'Givre', mois: 3, sous: "L'hiver tombe sur le Comté", effet: "L'hiver : le froid, un client de moins par jour", icone: 'flocon' },
};
const ORDRE_SAISONS = ['semailles', 'moissons', 'brumes', 'givre'];

// Les prix de saison au marché (validés par le joueur) : ce qui manque coûte plus cher
const PRIX_SAISON = {
  semailles: { corde: 1.1, potion: 0.9 },
  moissons: { gourde: 1.1, ration: 0.9 },
  brumes: { potion: 1.1 },
  givre: { cape: 1.1 },
};
// Les épreuves que la saison durcit, si l'aventurier n'est pas bien équipé (×0,85)
const EPREUVES_SAISON = {
  semailles: { types: ['riviere', 'gouffre'], besoins: ['corde'] },      // les crues
  moissons: { types: ['soif', 'route'], besoins: ['gourde', 'ration'] }, // la soif, la chaleur
  brumes: { types: ['nuit', 'grotte'], besoins: ['torche'] },            // la brume, on se perd
  givre: { types: ['froid', 'avalanche'], besoins: ['cape'] },           // le froid
};
const MALUS_SAISON = 0.85;
const SAISON_REGLES = { novicesPrintemps: 0.35, retardBrume: 0.1, clientsHiver: -1 };

// La saison d'un jour de jeu (avec les sauts de temps, voir dateDuJour)
function saisonDe(G, jour = G.jour) { return ORDRE_SAISONS[dateDuJour(G, jour).mois] || 'semailles'; }

// L'épreuve est-elle durcie par la saison ? (seulement si l'objet manque ou est insuffisant)
function malusSaison(G, e, niveau) {
  if (!G || niveau === 'complet') return 1;
  const s = EPREUVES_SAISON[saisonDe(G)];
  return s && (s.types.includes(e.type) || s.besoins.includes(e.besoin)) ? MALUS_SAISON : 1;
}
function prixSaison(G, id) { return (PRIX_SAISON[saisonDe(G)] || {})[id] || 1; }

// Les fêtes : trois jours chacune (la veille, le grand jour, le lendemain)
const FETES = {
  solstice: { nom: 'la Fête du Solstice', titre: 'La Fête du Solstice', saison: 'moissons', jours: [13, 14, 15], camp: 'bien' },
  brumes: { nom: 'la Nuit des Brumes', titre: 'La Nuit des Brumes', saison: 'brumes', jours: [26, 27, 28], camp: 'mal' },
};
// La fête de ce jour (ou null) : { id, jour: 0 la veille / 1 le grand jour / 2 le lendemain }
function feteDuJour(G, jour = G.jour) {
  const d = dateDuJour(G, jour), s = ORDRE_SAISONS[d.mois];
  for (const [id, f] of Object.entries(FETES)) { const i = f.jours.indexOf(d.jourDuMois); if (f.saison === s && i >= 0) return { id, jour: i, ...f }; }
  return null;
}
// La prochaine fête (dans combien de jours), pour le calendrier et le crieur
function prochaineFete(G) {
  for (let k = 0; k <= JOURS_PAR_AN; k++) { const f = feteDuJour(G, G.jour + k); if (f && f.jour === 0) return { ...f, dans: k }; }
  return null;
}

// Les fêtes ne s'annoncent (et n'ont lieu) qu'une fois construites : d'ici là, le calendrier les montre seulement
const FETES_OUVERTES = { solstice: true, brumes: false };   // (v1.00 : le Solstice ; la Nuit des Brumes en B-3b)
function feteOuverte(id) { return !!FETES_OUVERTES[id]; }
// (v0.99) Prévenir le joueur : la veille du premier jour, puis chaque jour de la fête (au réveil, quand rien
// d'autre ne se passe : dans les nouvelles du matin)
function annonceFete(G) {
  const f0 = feteDuJour(G), d0 = prochaineFete(G);
  const f = f0 && feteOuverte(f0.id) ? f0 : null, d = d0 && feteOuverte(d0.id) ? d0 : null;
  if (f) return [`Aujourd'hui commence ${f.nom} ! Trois jours de fête au marché.`, `C'est le grand jour : ${f.nom} bat son plein !`, `Dernier jour de ${f.nom} : profites-en, ça ne reviendra que l'an prochain.`][f.jour];
  if (d && d.dans === 1) return `Demain commence ${d.nom} ! Le village s'y prépare déjà.`;
  return null;
}

// « 3 mois », « 1 an », « 1 an et 2 mois », « 2 ans » (un an = quatre mois, un par saison)
function dureeEnMois(m) {
  const ans = Math.floor(m / 4), reste = m % 4;
  if (!ans) return `${m} mois`;
  return `${ans} an${ans > 1 ? 's' : ''}${reste ? ` et ${reste} mois` : ''}`;
}
