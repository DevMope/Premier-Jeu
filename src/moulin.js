// (v1.35, planches 60 validées) Le chat amoureux : l'aventure du Vieux Moulin.
// - La complicité avec ton chat (0 à 20) : elle monte chaque nuit où sa gamelle est pleine et quand tu le caresses
//   (une fois par jour, à la promenade) ; elle baisse quand il a faim (−2 la nuit) et quand il part (−6). Il faut
//   l'avoir au plus haut, et l'y garder, pour qu'il te fasse confiance.
// - Le soir où elle est au maximum (au moins 8 jours après l'avoir adopté, pas avant le jour 12), ton chat ne touche
//   plus à sa gamelle : il gratte à la porte et te regarde. Tu peux le suivre (l'aventure du Moulin, toute la nuit),
//   ou remettre à un autre soir.
// - Au bout : sa compagne sauvée (tu lui donnes un nom), le succès « Cœur de chat », et le secret : il parle. Fumer
//   avec lui ou non (+1 complicité s'il trouve un compagnon de pipe), et les formes de fumée déjà vues (les autres se
//   découvrent plus tard, à la maison).

const MOULIN = {
  lienMax: 20, jourMin: 12, adopteDepuis: 8,
  gainNuit: 1, gainCaresse: 1, perteFaim: 2, pertePartie: 6,
  formesDuMoulin: ['navire', 'coeur', 'poisson'],   // (les formes soufflées ce soir-là)
};

function lienChat(G) { const c = chatDe(G); return c.lien || 0; }
function changerLien(G, d) {
  const c = chatDe(G), avant = c.lien || 0;
  c.lien = Math.max(0, Math.min(typeof lienMaxDe === 'function' ? lienMaxDe(G) : MOULIN.lienMax, avant + d));   // (v1.39 : jusqu'à 40 après le Moulin, la confiance)
  return c.lien - avant;
}
function etatMoulin(G) { return (G.moulin = G.moulin || { fait: false, refus: null, compagne: null, fume: null, jour: null }); }
function moulinFait(G) { return !!(G.moulin && G.moulin.fait); }
function chatParle(G) { return moulinFait(G); }

// Le caresser (une fois par jour) : renvoie le gain (0 s'il a déjà eu sa caresse, ou s'il boude)
function caresserChat(G) {
  const c = chatDe(G);
  if (!c.adopte || c.caresse === G.jour || (typeof chatBoude === 'function' && chatBoude(G))) return 0;
  c.caresse = G.jour;
  return changerLien(G, MOULIN.gainCaresse);
}

// La nuit (avant que le jour ne change) : la complicité suit la gamelle. Renvoie la variation, pour le réveil.
function nuitDuLien(G) {
  const c = G.chat;
  if (!(c && c.adopte)) return 0;
  let d;
  if (c.parti === G.jour + 1) d = -MOULIN.pertePartie;            // (il part demain matin : il t'en veut)
  else if (c.parti === G.jour) d = 0;                               // (revenu ce soir, il se méfie : rien ne bouge)
  else if ((c.faim || 0) > 0) d = -MOULIN.perteFaim;
  else if (G.moulin && G.moulin.fait && (G.moulin.faimElle || 0) > 0) d = 0;   // (v1.39 : au-delà, les deux gamelles doivent être pleines)
  else d = MOULIN.gainNuit;
  const reel = changerLien(G, d);
  c.lienNuit = { jour: G.jour + 1, d: reel };
  return reel;
}
function matinDuLien(G) {
  const c = G.chat;
  const l = [];
  if (c && c.lienNuit && c.lienNuit.jour === G.jour && c.lienNuit.d < 0) l.push(`${nomChatMaj(G)} t'en veut un peu (complicité ${c.lienNuit.d}).`);
  // (v1.38) deux chats à nourrir : on prévient quand la réserve ne suffit plus pour les deux
  if (c && c.adopte && moulinFait(G) && (G.stock.ration || 0) < 2) l.push(`Plus que ${G.stock.ration || 0} ration${(G.stock.ration || 0) > 1 ? 's' : ''} dans la réserve : il en faut pour ${nomChatMaj(G)} et pour ${nomCompagne(G)}.`);
  return l;
}

// Ce soir, ton chat boude sa gamelle et gratte à la porte ?
function moulinCeSoir(G) {
  const c = G.chat, m = etatMoulin(G);
  if (!(c && c.adopte) || m.fait || m.refus === G.jour) return false;
  if (G.jour < MOULIN.jourMin || G.jour - (c.adopteJour ?? G.jour) < MOULIN.adopteDepuis) return false;
  if ((c.lien || 0) < MOULIN.lienMax) return false;
  if (typeof chatBoude === 'function' && (chatBoude(G) || chatParti(G) || chatMefiant(G))) return false;
  return true;
}
function remettreMoulin(G) { etatMoulin(G).refus = G.jour; }

// La compagne : un pelage qui tranche avec le sien
function lookCompagne(G) {
  const moi = lookChat(G).pelage;
  return { pelage: moi === 'ecaille' ? 'blanc' : 'ecaille', yeux: moi === 'ecaille' ? 'bleu' : 'vert', collier: 'aucun' };
}

// Le bout de l'aventure : { nom, fume, chances } (chances : combien d'essais pour chasser le renard)
function finirMoulin(G, { nom, fume = false, chances = 1 } = {}) {
  const m = etatMoulin(G), c = chatDe(G);
  m.fait = true; m.jour = G.jour; m.fume = !!fume; m.chances = chances;
  m.compagne = { nom: (nom || '').trim() || 'Minette', look: lookCompagne(G) };
  c.formesVues = Array.from(new Set([...(c.formesVues || []), ...MOULIN.formesDuMoulin]));
  if (typeof debloquerSucces === 'function') debloquerSucces(G, 'coeurDeChat');
  return m;
}
function nomCompagne(G) { return (G.moulin && G.moulin.compagne && G.moulin.compagne.nom) || 'sa compagne'; }

// Le lendemain matin : on rentre à l'aube, deux chats sur les talons
function matinDuMoulin(G) {
  const m = G.moulin;
  if (!(m && m.fait && m.jour === G.jour - 1 && !m.reveilVu)) return [];
  m.reveilVu = true;
  return [`Vous êtes rentrés à l'aube. ${nomChatMaj(G)} et ${nomCompagne(G)} dorment en boule dans le même panier. Ce soir, il a promis de tout t'expliquer.`];
}

// (planche 60, formes de fumée) Les formes que tu as vues : les autres restent cachées dans le carnet
function formesVues(G) { return (G.chat && G.chat.formesVues) || []; }
function voirForme(G, forme) {
  const c = chatDe(G); c.formesVues = c.formesVues || [];
  if (c.formesVues.includes(forme)) return false;
  c.formesVues.push(forme);
  if (typeof FORMES_FUMEE !== 'undefined' && Object.keys(FORMES_FUMEE).every(f => c.formesVues.includes(f)) && typeof debloquerSucces === 'function') debloquerSucces(G, 'repertoireComplet');
  return true;
}

// --- (v1.37, planche 60 suite validée) De retour à la maison ---
// La conversation au coin du feu : le premier soir après le Moulin (il a promis de tout t'expliquer)
function conversationAFaire(G) { const m = G.moulin; return !!(m && m.fait && !m.conversation && G.jour > m.jour); }
// Le coin des chats : où il est (ta chambre ou l'arrière-boutique), et ce qu'on y a mis
function coinDesChats(G) { return (G.chat && G.chat.coin) || null; }
function installerCoin(G, lieu) {
  const c = chatDe(G);
  c.coin = { lieu: lieu === 'chambre' ? 'chambre' : 'arriere', elements: (c.coin && c.coin.elements) || ['panier', 'gamelles'], jour: G.jour };   // (ce qui était déjà acheté reste)
  if (G.moulin) G.moulin.conversation = G.jour;
  return c.coin;
}
// Aménager le coin : renvoie { erreur } ou { gain } (la complicité gagnée : ils ronronnent)
function acheterCoin(G, cle) {
  const coin = coinDesChats(G), e = typeof COIN_CHATS !== 'undefined' ? COIN_CHATS[cle] : null;
  if (!coin || !e) return { erreur: "Il n'y a pas encore de coin des chats." };
  if (coin.elements.includes(cle)) return { erreur: 'Ils l’ont déjà.' };
  if (G.argent < e.prix) return { erreur: `Il te manque ${Math.ceil(e.prix - G.argent)} pièces.` };
  if (e.prix) payer(G, e.prix, 'coinChats');
  coin.elements.push(cle);
  return { gain: changerLien(G, 1) };
}
// La gamelle de la compagne : une ration tous les trois jours, elle aussi (prise dans ta réserve s'il en reste)
function nuitDeLaCompagne(G) {
  const m = G.moulin;
  if (!(m && m.fait)) return;
  if (m.repasElle === undefined) m.repasElle = G.jour;
  if (G.jour - m.repasElle < (typeof FOYER !== 'undefined' ? FOYER.gamelle : 3)) return;
  // (elle laisse toujours la dernière ration à ton chat)
  if ((G.stock.ration || 0) > 1) { G.stock.ration--; m.repasElle = G.jour; m.faimElle = 0; } else m.faimElle = (m.faimElle || 0) + 1;
}
// Le soir, il fume parfois quelque part dans la maison (à ta fenêtre, au coin du feu, dans l'arrière-boutique) ; il
// souffle alors une forme — de temps en temps une forme que tu n'as jamais vue. Tiré une fois par soir.
if (typeof POSTES !== 'undefined') POSTES.coinChats = 'Le coin des chats';
const FUMEE_MAISON = { chance: 0.4, neuve: 0.5, lieux: ['fenetre', 'feu', 'arriere'] };
function fumeeDuSoir(G) {
  const c = G.chat;
  if (!(c && c.adopte && moulinFait(G)) || (typeof chatParti === 'function' && chatParti(G))) return null;
  if (!c.fumee || c.fumee.jour !== G.jour) {
    const fume = Math.random() < FUMEE_MAISON.chance;
    const vues = formesVues(G), toutes = typeof FORMES_FUMEE !== 'undefined' ? Object.keys(FORMES_FUMEE) : vues;
    const neuves = toutes.filter(f => !vues.includes(f));
    const neuve = neuves.length > 0 && Math.random() < FUMEE_MAISON.neuve;
    const forme = neuve ? Phaser.Utils.Array.GetRandom(neuves) : (vues.length ? Phaser.Utils.Array.GetRandom(vues) : null);
    c.fumee = { jour: G.jour, lieu: fume && forme ? Phaser.Utils.Array.GetRandom(FUMEE_MAISON.lieux) : null, forme, neuve, vue: false };
  }
  return c.fumee.lieu ? c.fumee : null;
}
