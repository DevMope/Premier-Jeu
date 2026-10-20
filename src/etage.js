// (v1.30, planche 54 validée) L'étage au-dessus du shop, pour tous (lumière, ombre ou neutre), en trois chantiers
// d'une nuit, l'un après l'autre, dès que la façade est la plus belle du village : le grenier aménagé (+20 places de
// réserve), le salon (on y reçoit les clients prestigieux : un de plus par semaine, et ils paient mieux),
// l'appartement (JeuneGoy dort mieux : plus souvent « en forme » au réveil ; la façade gagne un étage et un balcon).
const ETAGE = {
  projets: [
    { id: 'grenier', nom: 'Le grenier', prix: 8000, effet: '+20 places de réserve.', decor: 'Des étagères neuves sous les chevrons.' },
    { id: 'salon', nom: 'Le salon', prix: 12000, effet: 'Un client prestigieux de plus chaque semaine ; ils paient mieux.', decor: 'Fauteuils de velours, cheminée, lustre.' },
    { id: 'appartement', nom: "L'appartement", prix: 18000, effet: 'Plus souvent « en forme » le matin. La façade gagne un étage.', decor: 'Un balcon de fer forgé et ses fleurs.' },
  ],
  grenier: 20,               // places de réserve en plus
  salon: { prestige: 1 / 7, paie: 1.15 },   // une chance de plus par jour (≈ un noble de plus par semaine), et leur butin
  appartement: 0.15,         // la chance de se réveiller en forme, en plus
  reputation: 1,
};
POSTES.etage = "L'étage";

function etageDe(G) { G.etage = G.etage || { bati: {}, chantier: null }; return G.etage; }
// On ne surélève qu'une belle maison : la façade doit être au plus beau
function etageOuvert(G) { return niveauFacade(G) >= 3; }
function etageA(G, id) { return !!(G.etage && G.etage.bati && G.etage.bati[id] && G.etage.bati[id] <= G.jour); }
function projetEtage(G) { return ETAGE.projets.find(p => !(G.etage && G.etage.bati && G.etage.bati[p.id])) || null; }

function batirEtage(G) {
  const p = projetEtage(G), e = etageDe(G);
  if (!p || !etageOuvert(G)) return { erreur: 'Rien à bâtir.' };
  if (e.chantier) return { erreur: 'Les ouvriers sont déjà à l’ouvrage.' };
  if (!peutPayer(G, p.prix)) return { erreur: manqueArgent(G, p.prix, `Il te manque ${p.prix - Math.floor(G.argent)} pièces.`) };
  payer(G, p.prix, 'etage');
  e.chantier = p.id;
  return { ok: true, projet: p };
}

// --- Les effets ---
function bonusPrestigeSalon(G) { return etageA(G, 'salon') ? ETAGE.salon.prestige : 0; }
function paieSalon(G) { return G && etageA(G, 'salon') ? ETAGE.salon.paie : 1; }
function formeAppartement(G) { return etageA(G, 'appartement') ? ETAGE.appartement : 0; }

function nuitDeLEtage(G) {
  const e = G.etage;
  if (!e || !e.chantier) return;
  e.bati[e.chantier] = G.jour + 1;
  if (e.chantier === 'grenier') { G.capaciteBonus = (G.capaciteBonus || 0) + ETAGE.grenier; G.capacite += ETAGE.grenier; }
  G.reputation += ETAGE.reputation;
  e.annonce = e.chantier;
  e.chantier = null;
}
function matinDeLEtage(G) {
  const e = G.etage;
  if (!e || !e.annonce) return [];
  const quoi = { grenier: 'le grenier est aménagé : des étagères neuves sous les chevrons, et 20 places de plus dans ta réserve',
    salon: 'le salon est prêt : fauteuils de velours, cheminée, lustre. Les nobles y seront reçus comme il se doit',
    appartement: "l'appartement est fini : le toit a monté d'un étage, et un balcon fleuri donne sur la rue" }[e.annonce];
  e.annonce = null;
  return [`Toute la nuit, des coups de marteau au-dessus de ta tête : ${quoi} (+${ETAGE.reputation} de réputation).`];
}
