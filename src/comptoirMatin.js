// (v1.63, planche 81 v2 validée) Le comptoir du matin et ses styles.
// Autour du comptoir, qui ne change pas : le store à lames, l'écriteau FERMÉ, l'horloge régulateur qui suit
// l'heure du jeu, l'étagère suspendue, le tableau de liège où l'on épingle la commande, le pot de plante collé
// au montant droit de la fenêtre, la tisane, et le chat au soleil (s'il est adopté).
// Le décor se choisit dans le carnet de la tapissière, à la page « Le comptoir » : Ysaline Bellecroix passe dès
// que le comptoir est en chêne verni ; les styles viennent peu à peu (la forge construite, le comptoir en noyer,
// le camp choisi). Le champêtre est offert ; un style acheté se remet quand on veut, sans repayer.

const STYLES_COMPTOIR = {
  champetre: { nom: 'Champêtre', resume: 'enduit et chêne · basilic, lavande, tisane', prix: 0,
    nuancier: [0xd2c2a0, 0x4e321c, 0xb06a3a] },
  floral: { nom: 'Floral', resume: 'rose poudré, bois peint · géraniums, roses', prix: 400,
    condition: G => niveauAmelioration(G, 'comptoir') >= 1, verrou: 'le comptoir en chêne verni',
    nuancier: [0xe8c4c0, 0x8ab0a0, 0xd8607a] },
  montagnard: { nom: 'Montagnard', resume: 'granit et fer · edelweiss, chope d’étain', prix: 750,
    condition: G => typeof forgeConstruite === 'function' && forgeConstruite(G), verrou: 'la forge construite',
    nuancier: [0x8a8a8e, 0x3a3636, 0x8a62c8] },
  artisan: { nom: 'Artisan raffiné', resume: 'noyer, laiton et verre · fougère sous cloche', prix: 1100,
    condition: G => niveauAmelioration(G, 'comptoir') >= 2, verrou: 'le comptoir en noyer et laiton',
    nuancier: [0x2e5a4e, 0x6e3820, 0xdcb85a] },
  lumiere: { nom: 'Lumière', resume: 'pierre blanche et azur · lys, cierges', prix: 1000,
    condition: G => typeof coteCamp === 'function' && coteCamp(G) === 'bien', verrou: 'si tu suis la Lumière',
    nuancier: [0xf0ece0, 0x4a7ab8, 0xe8c040] },
  ombre: { nom: 'Ombre', resume: 'velours noir, fer · roses noires, chandelles', prix: 1000,
    condition: G => typeof mainNoireOuverte === 'function' && mainNoireOuverte(G), verrou: 'si tu suis la Main Noire',
    nuancier: [0x3a2e44, 0x1a1418, 0xc02a2a] },
};
const ORDRE_STYLES_COMPTOIR = ['champetre', 'floral', 'montagnard', 'artisan', 'lumiere', 'ombre'];

// L'état, dans la sauvegarde : { pose, achetes } (une ancienne partie n'a rien : le champêtre, comme avant)
function etatStyleComptoir(G) {
  const s = G.styleComptoir && typeof G.styleComptoir === 'object' ? G.styleComptoir : null;
  if (!s) return { pose: 'champetre', achetes: ['champetre'] };
  if (!STYLES_COMPTOIR[s.pose]) s.pose = 'champetre';
  if (!Array.isArray(s.achetes)) s.achetes = ['champetre'];
  return s;
}
function styleComptoir(G) { return G ? etatStyleComptoir(G).pose : 'champetre'; }
// La tapissière passe dès le comptoir en chêne verni (et l'ancien carnet des pièces reste où il était)
function tapissiereComptoir(G) { return niveauAmelioration(G, 'comptoir') >= 1 || (typeof decoProposee === 'function' && decoProposee(G)); }
function styleComptoirAchete(G, id) { return id === 'champetre' || etatStyleComptoir(G).achetes.includes(id); }
function styleComptoirOuvert(G, id) { const S = STYLES_COMPTOIR[id]; return !!S && (styleComptoirAchete(G, id) || !S.condition || S.condition(G)); }
// Poser un style (l'acheter d'abord). Renvoie le prix payé, ou -1 (fermé, ou l'argent manque)
function poserStyleComptoir(G, id) {
  const S = STYLES_COMPTOIR[id];
  if (!S || !styleComptoirOuvert(G, id)) return -1;
  const s = G.styleComptoir = etatStyleComptoir(G);
  let paye = 0;
  if (!styleComptoirAchete(G, id)) {
    if (G.argent < S.prix) return -1;
    paye = S.prix; payer(G, paye, 'decoration');
    s.achetes.push(id);
  }
  s.pose = id;
  return paye;
}
