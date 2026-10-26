// (v1.05, lot B-3c) La Fête du Long Hiver : la fête de tout le village, les 20, 21 et 22 du Givre.
// La neige sur la place, le grand sapin et ses rubans ; la grande roue des cadeaux du Père Givrin
// (un tour par jour) ; le banquet du grand soir sous le sapin, où Garrick vient trinquer ; et l'esprit
// du Long Hiver : pendant la fête, un cadeau offert au comptoir touche davantage.

FETES.hiver = { nom: 'la Fête du Long Hiver', titre: 'La Fête du Long Hiver', saison: 'givre', jours: [20, 21, 22], camp: 'tous' };
FETES_OUVERTES.hiver = true;   // (planche 35 validée le 18/10)

const HIVER = {
  roue: { prix: 8, tours: 1 },
  // Les lots de la roue (validés le 18/10) : le poids de chaque part, en pour cent
  lots: [
    { id: 'provisions', poids: 30, nom: 'Provisions', couleur: 0x4e8a3a },
    { id: 'pieces', poids: 20, nom: 'Pièces', couleur: 0xd8a830 },
    { id: 'vetement', poids: 15, nom: "Habit d'hiver", couleur: 0xc0302c },
    { id: 'arme', poids: 15, nom: 'Une arme', couleur: 0x5a6a8a },
    { id: 'deco', poids: 15, nom: 'Décoration', couleur: 0x8a4ab0 },
    { id: 'grosLot', poids: 5, nom: 'Gros lot', couleur: 0x38b8d8 },
  ],
  pieces: [10, 40],
  grosLotDeja: 50,   // (le sapin de cristal déjà gagné : un sac de pièces à la place)
};

// Les habits d'hiver : on ne les trouve qu'à la roue ; rangés ensuite dans la malle
const HABITS_HIVER = ['bonnetHiver', 'mouflesHiver', 'echarpeHiver'];
Object.assign(GARDE_ROBE, {
  bonnetHiver: { fete: 'hiver', lot: true, nom: 'Bonnet à pompon', prix: 10, effet: "Pendant le Long Hiver : tous tes clients t'en aiment un peu plus (+1 de relation)." },
  mouflesHiver: { f: true, fete: 'hiver', lot: true, nom: 'Moufles fourrées', prix: 10, effet: "Pendant le Long Hiver : tous tes clients t'en aiment un peu plus (+1 de relation)." },
  echarpeHiver: { f: true, fete: 'hiver', lot: true, nom: 'Écharpe du Long Hiver', prix: 12, effet: "Pendant le Long Hiver : tous tes clients t'en aiment un peu plus (+1 de relation)." },
});
// Le gros lot : le sapin de cristal, une décoration qu'on ne trouve nulle part ailleurs
DECOS.sapinCristal = { court: 'gros lot du Long Hiver · +0,4 client/jour', nom: 'Sapin de cristal', prix: 0, cadeau: true, attire: null, attrait: 0.4,
  effet: "Le gros lot de la roue du Long Hiver : un petit sapin de verre filé où dansent des lueurs bleues. Les passants s'arrêtent pour le regarder (+0,4 client par jour)." };

// La fête de ce jour est-elle le Long Hiver (et ouverte) ?
function hiverActif(G, jour = G.jour) {
  if (!feteOuverte('hiver')) return false;
  const f = feteDuJour(G, jour);
  return !!(f && f.id === 'hiver');
}
// L'état de la fête de cette année (remis à zéro chaque année)
function etatHiver(G) {
  const an = dateDuJour(G).an;
  if (!G.hiver || G.hiver.an !== an) G.hiver = { an, roue: {}, banquet: false };
  return G.hiver;
}

// --- La grande roue des cadeaux ---
function toursRoueRestants(G) { return HIVER.roue.tours - (etatHiver(G).roue[G.jour] || 0); }
// Payer le tour et tirer le lot. Renvoie { erreur } ou { index, lot, texte, objet } (index : la part de la roue)
function tournerRoue(G) {
  if (!hiverActif(G)) return { erreur: "La grande roue ne tourne que pendant la Fête du Long Hiver." };
  if (toursRoueRestants(G) <= 0) return { erreur: "Le Père Givrin arrête la roue : « Un tour par jour, mon petit. Reviens demain ! »" };
  if (!peutPayer(G, HIVER.roue.prix)) return { erreur: manqueArgent(G, HIVER.roue.prix, "Pas assez d'argent pour un tour.") };
  payer(G, HIVER.roue.prix, 'fete');
  const s = etatHiver(G); s.roue[G.jour] = (s.roue[G.jour] || 0) + 1;
  let r = Math.random() * HIVER.lots.reduce((a, l) => a + l.poids, 0), index = 0;
  for (const [i, l] of HIVER.lots.entries()) { if ((r -= l.poids) < 0) { index = i; break; } }
  return { index, lot: HIVER.lots[index], ...donnerLotRoue(G, HIVER.lots[index].id) };
}
// Le lot gagné, rangé où il faut. Renvoie { texte, objet } (objet : l'icône à montrer)
function donnerLotRoue(G, id) {
  const ajouter = (o, n) => { G.stock[o] = (G.stock[o] || 0) + n; };
  const entre = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pieces = n => { encaisser(G, n, 'fete'); return { texte: `${n} pièces sonnantes, tout droit dans ta bourse !`, objet: 'pieces' }; };
  if (id === 'provisions') {
    const choix = [() => { const n = entre(3, 6); ajouter('ration', n); return { texte: `${n} rations pour l'hiver : un panier de pain, de lard et de fromage.`, objet: 'ration' }; },
      () => { const n = entre(3, 5); ajouter('torche', n); return { texte: `${n} torches, de quoi éclairer les longues nuits.`, objet: 'torche' }; },
      () => { ajouter('cape', 2); return { texte: 'Deux capes chaudes, doublées de laine.', objet: 'cape' }; }];
    const r = choix[Math.floor(Math.random() * choix.length)]();
    return { ...r, texte: r.texte + ' Tout file dans ta réserve.' };
  }
  if (id === 'pieces') return pieces(entre(...HIVER.pieces));
  if (id === 'vetement') {
    const restants = HABITS_HIVER.filter(h => !possede(G, h));
    if (!restants.length) return pieces(entre(20, 40));
    const h = restants[Math.floor(Math.random() * restants.length)];
    G.garderobe = [...(G.garderobe || G.tenue || []), h];
    G.tenue = [...(G.tenue || []), h];
    const textes = { bonnetHiver: 'Le bonnet à pompon ! Tu le mets aussitôt (il ira ensuite dans ton armoire).', mouflesHiver: 'Les moufles fourrées ! Tu les enfiles aussitôt (elles iront ensuite dans ton armoire).', echarpeHiver: "L'écharpe du Long Hiver ! Tu la noues aussitôt (elle ira ensuite dans ton armoire)." };
    return { texte: textes[h], objet: h };
  }
  if (id === 'arme') {
    const ombre = G.visiteMarcheNoir !== undefined;   // (les armes des peuples de l'ombre, seulement si on les connaît)
    const armes = Object.keys(ITEMS).filter(o => ITEMS[o].arme && (ombre || !ITEMS[o].ombre));
    const a = armes[Math.floor(Math.random() * armes.length)];
    ajouter(a, 1);
    const ap = genreDe(a), f = ap.includes('f'), pl = ap.includes('p');   // (v1.07 : le genre de l'objet, pas l'apparence)
    return { texte: `${nomObjet(a)} ! ${pl ? (f ? 'Elles rejoignent' : 'Ils rejoignent') : (f ? 'Elle rejoint' : 'Il rejoint')} ta réserve.`, objet: a };
  }
  if (id === 'deco') {
    // (seulement les décorations sans camp : la roue ne fait pencher personne)
    const restantes = Object.keys(DECOS).filter(d => !DECOS[d].cadeau && !DECOS[d].camp && !aDeco(G, d));
    if (!restantes.length) return pieces(entre(25, 40));
    const d = restantes[Math.floor(Math.random() * restantes.length)];
    G.decos = [...(G.decos || []), d];
    return { texte: `${DECOS[d].nom}, de la brocante de Firmin ! ${DECOS[d].f ? 'Accrochée' : 'Accroché'} dans ton arrière-boutique.`, objet: d };
  }
  // le gros lot
  if (typeof debloquerSucces === 'function') debloquerSucces(G, 'roue', 'à la fête du Long Hiver');   // (v1.50)
  if (aDeco(G, 'sapinCristal')) return { ...pieces(HIVER.grosLotDeja), texte: `Le gros lot, encore ! Tu as déjà ton sapin de cristal : le Père Givrin te donne ${HIVER.grosLotDeja} pièces à la place.` };
  G.decos = [...(G.decos || []), 'sapinCristal'];
  return { texte: "LE GROS LOT ! Le sapin de cristal : il brillera dans ton arrière-boutique (+0,4 client par jour).", objet: 'sapinCristal' };
}

// --- Les habits d'hiver : un client, quel que soit son camp, qui te voit bien emmitouflé (une fois par jour) ---
function remarqueHabitsHiver(G, v) {
  if (!hiverActif(G)) return null;
  const portes = HABITS_HIVER.filter(id => porte(G, id));
  if (!portes.length) return null;
  changerRelation(G, v.nom, 1);
  return { bonnetHiver: 'Oh, le joli bonnet à pompon ! Joyeux Long Hiver !', mouflesHiver: "Des moufles fourrées ! Toi, au moins, tu n'as pas froid aux mains. Joyeux Long Hiver !", echarpeHiver: "L'écharpe du Long Hiver ! Ça me rappelle mon enfance. Bonne fête !" }[portes[Math.floor(Math.random() * portes.length)]];
}

// --- L'esprit du Long Hiver : pendant la fête, un cadeau offert au comptoir donne +1 de relation en plus ---
function espritHiver(G, v) {
  if (!hiverActif(G)) return null;
  const m = changerRelation(G, v.nom, 1);
  return `(L'esprit du Long Hiver : +1 de relation${m ? ' · ' + m : ''})`;
}

// --- Le banquet : le soir du grand jour, sous le sapin de la place (une fois par an, avant d'aller dormir) ---
const TOAST_GARRICK = "« Au Long Hiver ! Que vos foyers restent chauds... et vos portes ouvertes, même à ceux qu'on n'attend pas. »";
// Ce que les voisins glissent dans ton assiette (un cadeau à offrir ensuite)
const CADEAUX_BANQUET = [['gateau', 'Rosalie', 'un gâteau aux mûres'], ['miel', 'Mère Sauge', 'un pot de miel'], ['vin', 'Thorgal', 'une bouteille de vin de la Comté'], ['ferACheval', 'Firmin', 'un fer à cheval porte-bonheur']];
function banquetDu(G) {
  const f = hiverActif(G) ? feteDuJour(G) : null;
  return !!(f && f.jour === 1 && !etatHiver(G).banquet);
}
// Le banquet a eu lieu : le cadeau d'un voisin, et le ventre plein (en forme demain matin)
function finirBanquet(G) {
  const s = etatHiver(G); s.banquet = true;
  G.banquetHiver = G.jour + 1;   // (le réveil de demain : en pleine forme)
  const [id, qui, quoi] = CADEAUX_BANQUET[Math.floor(Math.random() * CADEAUX_BANQUET.length)];
  G.cadeaux[id] = (G.cadeaux[id] || 0) + 1;
  return { id, qui, quoi };
}
// Au réveil, après le banquet : en pleine forme (un client de plus)
function reveilApresBanquet(G, r) {
  if (G.banquetHiver !== G.jour) return;
  r.lignes = r.lignes.filter(l => !l.includes('en pleine forme'));   // (une seule « pleine forme » au réveil)
  r.forme = 'client';
  r.lignes.push(`Le ventre plein et le cœur au chaud : après le banquet du Long Hiver, tu te réveilles en pleine forme. Tu serviras un client de plus aujourd'hui !`);
}
