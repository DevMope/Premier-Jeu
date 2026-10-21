// (v1.39, planche 66 validée) Le Parrain : ton chat dirige la Main Noire.
// - Après le Moulin, la complicité continue de monter au-delà de 20 : c'est la confiance (jusqu'à 40). Paliers :
//   Complice (20), Confident (30), De la Famille (40). Elle monte avec une nuit où les deux gamelles sont pleines,
//   une caresse, une fumée partagée à la maison, un aménagement du coin.
// - Au palier 40, et au moins vingt jours après le Moulin, il t'invite (différemment selon ton camp) : minuit, la
//   table du fond du marché noir. La robe tombe : c'est lui. Plein aux as, il a toujours vécu en chat de gouttière
//   aux yeux de tous ; personne ne sait qui il est : on ne voit que le gant.
// - Selon ton camp : ombre « Bienvenue dans la Famille » (Consigliere, plus de pizzo, une part de celui de la ville) ;
//   neutre « Les affaires sont les affaires » (un pacte : plus de pizzo, pas de rang) ; lumière « Je sais ce que tu
//   penses » (te taire, le faire changer — une longue quête —, ou le dénoncer : il disparaît avec elle).

const PARRAIN = {
  lienMax: 40, paliers: [[20, 'Complice'], [30, 'Confident'], [40, 'De la Famille']],
  delai: 20,                                   // jours après le Moulin, au moins
  reflexion: 3,                                // côté ombre, « Réfléchir » : il redemande trois jours plus tard
  partSemaine: 80, partParEtoile: 20,          // la part du pizzo de la ville, chaque semaine (côté ombre)
  primeDenonciation: 300,
};
if (typeof POSTES !== 'undefined') POSTES.famille = 'La part de la Famille';

function etatParrain(G) { return (G.parrain = G.parrain || { fait: false, statut: null, camp: null, jour: null, remis: null }); }
function parrainFait(G) { return !!(G.parrain && G.parrain.fait); }
// La confiance : la complicité au-delà de 20 (après le Moulin, la jauge va jusqu'à 40)
function lienMaxDe(G) { return typeof moulinFait === 'function' && moulinFait(G) ? PARRAIN.lienMax : MOULIN.lienMax; }
function palierLien(G) { const l = lienChat(G); let n = ''; for (const [v, nom] of PARRAIN.paliers) if (l >= v) n = nom; return n; }
// Le camp de la révélation : ombre, lumière, ou entre les deux
function campDuParrain(G) { const c = typeof coteCamp === 'function' ? coteCamp(G) : null; return c === 'mal' ? 'ombre' : c === 'bien' ? 'lumiere' : 'neutre'; }

// Ce soir, il t'invite ?
function parrainCeSoir(G) {
  const c = G.chat, p = etatParrain(G), m = G.moulin;
  if (!(c && c.adopte) || !(m && m.fait && m.conversation)) return false;
  if (p.fait || p.remis === G.jour) return false;
  if (lienChat(G) < PARRAIN.lienMax || G.jour < (m.jour || 0) + PARRAIN.delai) return false;
  if (typeof chatBoude === 'function' && (chatBoude(G) || chatParti(G) || chatMefiant(G))) return false;
  if (typeof mafia === 'function' && mafia(G).sorti === 'denonce') return false;   // (sa bande a été démantelée : il se tait)
  return true;
}
function remettreParrain(G) { etatParrain(G).remis = G.jour; }
// Côté ombre, après « Réfléchir » : il redemande quelques jours plus tard
function parrainRedemande(G) { const p = G.parrain; return !!(p && p.statut === 'reflexion' && G.jour >= p.jour + PARRAIN.reflexion && p.remis !== G.jour); }

// Ce que le joueur décide, à la fin de la révélation : renvoie la ligne qui le dit
const CHOIX_PARRAIN = {
  ombre: [['bague', 'Baiser la bague'], ['reflechir', 'Réfléchir']],
  neutre: [['pacte', 'Pacte de neutralité'], ['refuser', 'Refuser poliment']],
  lumiere: [['taire', 'Se taire'], ['changer', 'Le changer'], ['denoncer', 'Le dénoncer']],
};
function choisirParrain(G, choix) {
  const p = etatParrain(G), m = typeof mafia === 'function' ? mafia(G) : null, chat = chatDe(G), nom = nomChatMaj(G);
  p.fait = true; p.jour = G.jour; p.choix = choix; p.camp = p.camp || campDuParrain(G);
  if (choix === 'bague') {
    p.statut = 'famille'; p.borsalino = true;
    if (m) { m.engage = true; m.sorti = null; m.impayes = 0; m.represailles = null; }
    return `Tu baises la bague. ${nom} sourit : « Bienvenue dans la Famille, Consigliere. Plus jamais de pizzo pour toi. Et chaque semaine, ta part. »`;
  }
  if (choix === 'reflechir') { p.statut = 'reflexion'; return `${nom} hoche la tête. « Prends ton temps. Pas trop. »`; }
  if (choix === 'pacte') { p.statut = 'pacte'; if (m) { m.impayes = 0; m.represailles = null; } return `Vous vous serrez la patte. « La Main Noire ne touchera plus à ton comptoir. Et mes oreilles traînent partout : je te dirai ce que j'entends. »`; }
  if (choix === 'refuser') { p.statut = 'refus'; return `${nom} hausse les épaules. « Comme tu veux. Ça ne change rien entre nous. Presque rien. »`; }
  if (choix === 'taire') {
    p.statut = 'secret'; if (m) { m.impayes = 0; m.represailles = null; }
    if (typeof pencherCamp === 'function') pencherCamp(G, 'mal', 1);   // (le prix du silence)
    return `Tu ne diras rien. ${nom} souffle sa fumée : « Merci. Ton comptoir est sous ma patte, maintenant. »`;
  }
  if (choix === 'changer') { p.statut = 'quete'; p.quete = 0; return `« Me changer, moi ? » Il rit, puis se tait longtemps. « ... D'accord. Montre-moi comment. On commence demain. »`; }
  // Le dénoncer : il disparaît avec elle, cette nuit-là ; la bande se venge
  p.statut = 'denonce';
  if (m) { m.sorti = 'denonce'; m.vengeance = true; }
  if (typeof pencherCamp === 'function') pencherCamp(G, 'bien', 2);
  if (typeof encaisser === 'function') encaisser(G, PARRAIN.primeDenonciation, 'denonciations');
  chat.lien = 0; chat.adopte = false; chat.coin = null; chat.parti = null;
  if (G.moulin) G.moulin.partie = true;
  return `Tu cours prévenir la Garde. Quand tu reviens, le panier est vide. Sur le coussin, un gant de cuir noir. Tu ne les reverras jamais.`;
}

// Ce que ça change : pas de pizzo pour la Famille, le pacte ou le silence ; la part de la semaine pour la Famille
function exonereDePizzo(G) { const p = G.parrain; return !!(p && ['famille', 'pacte', 'secret', 'quete'].includes(p.statut)); }
function consigliere(G) { return !!(G.parrain && G.parrain.statut === 'famille'); }
function partDeLaFamille(G) { return PARRAIN.partSemaine + PARRAIN.partParEtoile * Math.max(1, ...(G.paliersEtoiles || [1])); }
// La nuit : le septième jour, la part de la Famille arrive (un sac de cuir, sur le comptoir)
function nuitDuParrain(G) {
  if (!consigliere(G) || (G.jour - G.parrain.jour) % 7 !== 6) return null;
  const x = partDeLaFamille(G);
  encaisser(G, x, 'famille');
  G.parrain.dernierePart = { jour: G.jour + 1, x };
  return x;
}
function matinDuParrain(G) {
  const p = G.parrain;
  if (!(p && p.dernierePart && p.dernierePart.jour === G.jour)) return [];
  return [`Un petit sac de cuir t'attendait sur le comptoir : ta part de la Famille, ${p.dernierePart.x} pièces.`];
}
