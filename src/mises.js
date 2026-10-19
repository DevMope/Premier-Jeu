// (v1.19, lot C-3, planche 47 v3) Les mises : avancer de l'argent à un aventurier qu'on connaît, avant son
// départ, contre plus à son retour. Vainqueur : la mise × 1,6 ; revenu sans rien : la moitié ; mort : perdue.
// Ta confiance l'encourage : +1 de relation, et un peu plus de chances à chaque épreuve (+3 % sur la mission).
const MISE_AVENTURIER = {
  montants: { novice: [20, 40, 60], aguerri: [30, 60, 90], veteran: [40, 80, 120], heros: [60, 120, 180], legende: [80, 160, 240] },
  noms: ['petite', 'moyenne', 'grosse'],
  vainqueur: 1.6, sansRien: 0.5,
  relation: 1, bonusEtape: 0.01,   // (environ +3 % sur une mission de trois épreuves)
  max: 3, relationMin: 4,          // (4 = « Connaissance » dans NIVEAUX_RELATION)
};

function montantsMise(v) { return MISE_AVENTURIER.montants[v.niveau] || MISE_AVENTURIER.montants.novice; }
function misesEnCours(G) { return (G.partis || []).filter(p => !p.termine && p.voyageur.mise > 0).length; }

// Peut-on miser sur lui ? (un aventurier qu'on connaît, qui part en mission, et pas plus de trois mises à la fois)
function peutMiser(G, v) {
  if (!v || !v.queteId || v.mise > 0) return false;
  if (niveauRelation(G, v.nom).index < MISE_AVENTURIER.relationMin) return false;
  return misesEnCours(G) < MISE_AVENTURIER.max;
}

// La mise choisie au comptoir ; elle se paie au départ (rien n'est perdu s'il ne part pas)
function choisirMise(G, v, montant) { v.mise = montant; }

// Au départ : on paie la mise, il en est encouragé (relation)
function miseAuDepart(G, v) {
  if (!(v.mise > 0)) return null;
  if (!peutPayer(G, v.mise)) { const m = v.mise; v.mise = 0; return `Pas assez d'argent pour ta mise de ${m} p. : elle est annulée.`; }
  payer(G, v.mise, 'mises');
  G.journal.mises = (G.journal.mises || 0) + 1;
  return changerRelation(G, v.nom, MISE_AVENTURIER.relation);
}

// Au retour (ou à la mort) : ce que devient la mise. Renvoie { mise, rendu } ou null.
function miseAuRetour(G, parti) {
  const v = parti.voyageur, r = parti.resultat;
  if (!(v.mise > 0) || parti.miseReglee) return null;
  parti.miseReglee = true;
  const rendu = !r.vivant ? 0 : Math.round(v.mise * (r.echec ? MISE_AVENTURIER.sansRien : MISE_AVENTURIER.vainqueur));
  if (rendu > 0) encaisser(G, rendu, 'mises');
  G.stats.mises = (G.stats.mises || 0) + rendu - v.mise;
  return { mise: v.mise, rendu };
}

function texteMise(m, v) {
  if (!m) return null;
  const prenom = v.nom.split(' ')[0];
  if (!m.rendu) return `Ta mise sur ${prenom} (${m.mise} p.) est perdue.`;
  return `Ta mise sur ${prenom} : ${m.mise} p. → ${m.rendu} p.${m.rendu < m.mise ? ' (revenu sans rien, il te rend la moitié)' : ''}`;
}
