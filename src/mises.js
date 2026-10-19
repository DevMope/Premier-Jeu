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

// --- (v1.20, planche 47 v3) La mise noire : au marché noir, chez Grisouille, parier CONTRE un aventurier parti en
// mission. S'il échoue (revenu sans rien, ou mort), ta mise × la cote ; s'il réussit, perdue. Un geste d'ombre ;
// et s'il meurt, la Faucheuse t'aime un peu plus. La cote suit ses vraies chances : bien équipé, elle est haute.
const MISE_NOIRE = { mise: [10, 300], pas: 10, max: 3, coteMin: 1.5, coteMax: 6, marge: 0.85, faveur: 1 };

function coteContre(parti) {
  const p = Phaser.Math.Clamp(parti.chance == null ? 0.7 : parti.chance, 0.05, 0.95);
  return Phaser.Math.Clamp(Math.round(MISE_NOIRE.marge / (1 - p) * 2) / 2, MISE_NOIRE.coteMin, MISE_NOIRE.coteMax);
}
function parisNoirsEnCours(G) { return (G.partis || []).filter(p => !p.termine && p.voyageur.pariNoir).length; }
// Ceux sur qui on peut parier ce soir : partis, pas rentrés, pas déjà « misés » (on ne parie pas pour et contre)
function cibleParisNoirs(G) { return enMission(G).filter(p => p.retour > G.jour && !(p.voyageur.mise > 0) && !p.voyageur.pariNoir); }

function parierContre(G, parti, mise) {
  if (parisNoirsEnCours(G) >= MISE_NOIRE.max) return { erreur: `« Trois paris à la fois, c'est assez. Reviens quand l'un d'eux sera rentré... ou pas. »` };
  if (!peutPayer(G, mise)) return { erreur: manqueArgent(G, mise, "Pas assez d'argent pour cette mise.") };
  const cote = coteContre(parti);
  payer(G, mise, 'parisNoirs');
  parti.voyageur.pariNoir = { mise, cote };
  pencher(G, 'miseNoire', { qui: parti.voyageur.nom });
  return { ok: true, cote };
}

// À son retour : Grisouille paie (ou garde ta mise). Renvoie une petite phrase de narration, ou null.
function pariNoirAuRetour(G, parti) {
  const v = parti.voyageur, r = parti.resultat, pn = v.pariNoir;
  if (!pn || parti.pariNoirRegle) return null;
  parti.pariNoirRegle = true;
  const prenom = v.nom.split(' ')[0];
  if (r.vivant && !r.echec) { G.stats.parisNoirs = (G.stats.parisNoirs || 0) - pn.mise; return `(Au marché noir, ton pari contre ${prenom} est perdu.)`; }
  const gain = Math.round(pn.mise * pn.cote);
  encaisser(G, gain, 'parisNoirs');
  G.stats.parisNoirs = (G.stats.parisNoirs || 0) + gain - pn.mise;
  if (!r.vivant) G.faucheuse.faveur = (G.faucheuse.faveur || 0) + MISE_NOIRE.faveur;
  return `(Grisouille te doit ${gain} p. pour ton pari contre ${prenom} : la bourse est glissée sous ta porte.)`;
}
