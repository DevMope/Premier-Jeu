// (planche 85 v2, validée) Les pyjamas : six tenues de nuit, qu'on ne porte que pour dormir. Le joueur en a deux dès le
// début (la chemise de lin et le pyjama rayé) ; Marcelline, la couturière du marché, vend les quatre autres. On choisit
// celui de la nuit à l'armoire de la chambre (onglet « Mes pyjamas ») ; on le met derrière le paravent après « Aller
// dormir », et on reprend ses habits du jour au réveil.
// La laine et la flanelle adoucissent un peu les nuits d'hiver : sans feu, il faut une nuit froide de plus pour
// attraper un rhume (le premier matin, on se réveille quand même fatigué).
//   G.pyjamas : ceux qu'on a achetés (les deux du départ n'y sont pas : ils sont toujours là) ;
//   G.pyjama : celui de cette nuit (le pyjama rayé tant qu'on n'a rien choisi).
// Le dessin de chaque pyjama (couleurs, motif, col, pieds, bonnet) : voir pyjamasHD.js.

const PYJAMAS = {
  lin: { nom: 'Chemise de lin', f: true, prix: 0, effet: 'Légère et fraîche : pour les nuits douces.' },
  raye: { nom: 'Pyjama rayé', prix: 0, effet: 'Le grand classique, à raies bleues et blanches.' },
  nuit: { nom: 'Chemise de nuit et bonnet', f: true, prix: 12, effet: 'Le bonnet à pompon garde la tête au chaud.' },
  laine: { nom: 'Robe de chambre de laine', f: true, prix: 30, chaud: true, effet: "Chaude : l'hiver, sans feu, une nuit de plus avant le rhume." },
  flanelle: { nom: 'Pyjama de flanelle à carreaux', prix: 20, chaud: true, effet: "Chaud : l'hiver, sans feu, une nuit de plus avant le rhume." },
  etoile: { nom: 'Pyjama étoilé', prix: 24, effet: "Brodé d'étoiles d'or, avec son bonnet à pompon.", cadeau: 'Le cadeau du Père Givrin, au Long Hiver.' },
};
// (validé) Quand Marcelline les vend : la chemise de nuit et la robe de chambre toute l'année ; la flanelle aux Brumes et au
// Givre. Le pyjama étoilé est le cadeau du Père Givrin au Long Hiver (au réveil, au pied du lit) ; qui ne l'a pas reçu le
// trouve ensuite chez Marcelline, pendant le Givre, une fois la fête passée.
const VENTE_PYJAMAS = { flanelle: ['brumes', 'givre'], etoile: ['givre'] };
const PYJAMAS_DEPART = ['lin', 'raye'];
const PYJAMA_PAR_DEFAUT = 'raye';
// Les nuits froides sans feu qu'il faut pour s'enrhumer (voir foyer.js) : deux, ou trois dans un pyjama chaud
const RHUME_NUITS = { normal: 2, chaud: 3 };

// Les pyjamas qu'on a, dans l'ordre de l'armoire
function pyjamasDe(G) {
  const a = (G && G.pyjamas) || [];
  return Object.keys(PYJAMAS).filter(id => PYJAMAS_DEPART.includes(id) || a.includes(id));
}
function aPyjama(G, id) { return !!PYJAMAS[id] && pyjamasDe(G).includes(id); }
// Le pyjama de cette nuit (celui qu'on a choisi, s'il est encore là)
function pyjamaDeCetteNuit(G) { return G && aPyjama(G, G.pyjama) ? G.pyjama : PYJAMA_PAR_DEFAUT; }
function choisirPyjama(G, id) {
  if (!aPyjama(G, id)) return "Tu ne l'as pas.";
  G.pyjama = id;
  return null;
}
// Marcelline l'a-t-elle aujourd'hui ? { enVente, quand } (quand : ce qu'on écrit sur un pyjama hors saison)
function ventePyjama(G, id) {
  const saisons = VENTE_PYJAMAS[id];
  if (!saisons || typeof saisonDe !== 'function') return { enVente: true, quand: null };
  const s = saisonDe(G);
  if (id === 'etoile') {
    // (au Givre, seulement après le Long Hiver : pendant la fête, c'est le Père Givrin qui l'apporte)
    const fin = typeof FETES !== 'undefined' && FETES.hiver ? Math.max(...FETES.hiver.jours) : 0;
    if (s === 'givre' && dateDuJour(G).jourDuMois > fin) return { enVente: true, quand: null };
    return { enVente: false, quand: s === 'givre' ? 'après le Long Hiver' : 'revient au Givre' };
  }
  if (saisons.includes(s)) return { enVente: true, quand: null };
  return { enVente: false, quand: 'revient aux Brumes' };
}
// Chez Marcelline : acheter un pyjama (on le met dès ce soir)
function acheterPyjama(G, id) {
  const p = PYJAMAS[id];
  if (!p) return 'Ce pyjama-là n’existe pas.';
  if (aPyjama(G, id)) return "Tu l'as déjà.";
  const v = ventePyjama(G, id);
  if (!v.enVente) return `Marcelline n'en a pas en ce moment (${v.quand}).`;
  if (!peutPayer(G, p.prix)) return manqueArgent(G, p.prix, "Pas assez d'argent.");
  payer(G, p.prix, 'garderobe');
  G.pyjamas = [...((G.pyjamas) || []), id];
  G.pyjama = id;
  return null;
}
// La laine et la flanelle : une nuit froide de plus avant le rhume
function pyjamaChaud(G) { return !!(PYJAMAS[pyjamaDeCetteNuit(G)] || {}).chaud; }
function nuitsAvantRhume(G) { return pyjamaChaud(G) ? RHUME_NUITS.chaud : RHUME_NUITS.normal; }
// Le Long Hiver : au réveil, le cadeau du Père Givrin au pied du lit (une fois : on le garde ensuite dans l'armoire)
function matinPyjamaGivrin(G) {
  if (typeof hiverActif !== 'function' || !hiverActif(G) || aPyjama(G, 'etoile')) return [];
  G.pyjamas = [...(G.pyjamas || []), 'etoile'];
  G.pyjama = 'etoile';
  return ["Au pied de ton lit, un paquet noué d'un ruban rouge : le Père Givrin t'a laissé un pyjama étoilé, avec son bonnet à pompon. Il t'attend dans ton armoire : tu le mettras ce soir !"];
}
