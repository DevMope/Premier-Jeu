// (v1.45, planche 71 v2 validée) La pêche à l'étang du Vieux Moulin.
// - Barnabé Goujon, vieux pêcheur hobbit, ouvre sa cabane au bout de la rue du marché au jour 6 : il vend la canne de
//   roseau (20 p.) et le noisetier à moulinet (180 p.), rachète tes poissons (6 par jour au plus) et t'explique la pêche.
//   Si l'histoire du Moulin a eu lieu, ton chat t'offre en plus la canne de son grand-père.
// - On pêche à l'aube (le matin, avant d'ouvrir), le jour (le soir, si le comptoir a fermé tôt) ou la nuit (le soir).
//   Pêcher ne prend pas de temps, mais l'étang se méfie : plus on prend de poissons d'affilée dans la même plage, plus la
//   touche tarde et plus la zone verte rétrécit (au bout de 6, plus rien ne mord).
// - L'expérience de pêcheur (niveaux 1 à 10) : les poissons coriaces cassent la ligne tant qu'on n'a pas leur niveau.
// - Une prise : la garder (fumée, +1 ration), la vendre, la donner au chat (+1 ♥ une fois par jour ; il danse), la relâcher.
//   Le chat, s'il pêche avec toi, file parfois avec une prise (jamais une espèce nouvelle, ni une légende).
// - La légende de l'étang, Grand-Mère Écaille, ne se prend qu'une fois et ne se relâche pas.

const PECHE = {
  ouverture: 6,                 // (le jour où la cabane de Barnabé ouvre)
  venteParJour: 6,              // (Barnabé ne rachète que 6 poissons par jour : « mon étal est petit ! »)
  mefianceMax: 6,               // (au-delà, plus rien ne mord dans cette plage)
  seuils: [0, 10, 30, 60, 100, 160, 240, 340, 460, 600],   // (l'expérience qu'il faut pour chaque niveau, du 1 au 10)
  vol: 0.14,                    // (la chance que le chat file avec une prise, quand il pêche avec toi)
  heureJour: 17,                // (le soir, si le comptoir a fermé avant cette heure, il fait encore jour à l'étang)
  legende: { niveau: 7, chance: 0.06, hiver: 2, prix: 750, rations: 8, lien: 8, xp: 40 },
};

// Les poissons de l'étang du Moulin : taille (cm), plages où ils mordent (et leur poids), niveau conseillé, expérience, prix
const POISSONS = {
  gardon: { nom: 'Gardon', taille: [12, 25], plages: { aube: 4, jour: 4, nuit: 1 }, niveau: 1, xp: 2, prix: 2, note: 'Commun, partout, tout le temps. Les enfants de la Comté apprennent avec lui.' },
  perche: { nom: 'Perche', taille: [15, 35], plages: { aube: 2, jour: 4, nuit: 0 }, niveau: 1, xp: 3, prix: 3, note: 'Le jour, en lisière des roseaux. Les épines de son dos piquent : prends-la par le ventre.' },
  tanche: { nom: 'Tanche', taille: [20, 45], plages: { aube: 4, jour: 1, nuit: 1 }, niveau: 2, xp: 5, prix: 5, note: 'À l’aube, dans la vase tiède. Son mucus soigne les autres poissons, disent les anciens.' },
  carpe: { nom: 'Carpe', taille: [30, 70], plages: { aube: 3, jour: 1, nuit: 1 }, niveau: 3, xp: 6, prix: 7, note: 'Méfiante et forte. Elle fouille le fond en soufflant des bulles.' },
  anguille: { nom: 'Anguille', taille: [40, 80], plages: { aube: 0, jour: 0, nuit: 4 }, niveau: 3, xp: 6, prix: 8, note: 'La nuit seulement. Elle se tortille jusque sur le ponton : tiens bon !' },
  brochet: { nom: 'Brochet', taille: [40, 90], plages: { aube: 0, jour: 3, nuit: 0 }, niveau: 4, xp: 8, prix: 12, note: 'Le loup de l’étang. Il attend sous les nénuphars et casse les lignes des débutants.' },
  carpeDoree: { nom: 'Carpe dorée', taille: [30, 60], plages: { aube: 0.3, jour: 0.2, nuit: 0 }, niveau: 5, xp: 15, prix: 40, note: 'Rare. Barnabé dit qu’elle porte chance à qui la relâche... ou à qui la vend bien.' },
};
const LEGENDE_ETANG = { id: 'legende', nom: 'Grand-Mère Écaille', taille: [92, 104], note: 'Cent ans au moins, l’œil laiteux, du lichen sur le dos ; l’anneau d’or du meunier pris dans la lèvre.', indice: '« Une très vieille carpe vit sous la roue du moulin. On la voit à l’aube, l’hiver surtout. » (Barnabé)' };
// Les prises étranges du Comté
const PRISES_ETRANGES = {
  botte: { nom: 'Une vieille botte', texte: 'Pleine de vase. Elle sèche sur le ponton... Personne n’en veut.', poids: 3 },
  bouteille: { nom: 'Une bouteille à message', texte: 'Un vieux papier roulé, ficelé : « Sous le troisième saule, trois pas vers l’eau. » Tu y trouves 25 pièces !', poids: 1.5, pieces: 25 },
  piece: { nom: 'Une pièce ancienne', texte: 'Un profil de roi effacé, du vert-de-gris : la vieille pièce dorée des souvenirs de l’eau rejoint ta vitrine.', poids: 1 },
};
const CHANCE_ETRANGE = 0.07;

// Les cannes du début (les autres viendront avec les pêcheurs des nouvelles contrées)
// portee : jusqu'où on lance ; zone : la largeur de la zone verte ; moulinet : la vitesse de remontée
const CANNES_PECHE = {
  roseau: { nom: 'Canne de roseau', prix: 20, portee: 0.8, zone: 1, moulinet: 1, texte: 'Une tige, une ficelle nouée au bout, un bouchon : la canne des enfants de la Comté.' },
  grandPere: { nom: 'Canne du grand-père', prix: 0, portee: 0.95, zone: 1.1, moulinet: 1.05, texte: 'Trois brins de roseau emmanchés de laiton, une plume rouge porte-bonheur. Elle lance un peu plus loin ; ton chat viendra pêcher avec toi.' },
  noisetier: { nom: 'Noisetier à moulinet', prix: 180, portee: 1, zone: 1.15, moulinet: 1.35, texte: 'Courbé à la vapeur, un moulinet de bois à manivelle : on remonte plus vite.' },
};
const ORDRE_CANNES = ['roseau', 'grandPere', 'noisetier'];

if (typeof POSTES !== 'undefined') { POSTES.peche = 'La pêche'; POSTES.cannes = 'Les cannes à pêche'; }
if (typeof OUVERTURE_LIEUX !== 'undefined') OUVERTURE_LIEUX.peche = PECHE.ouverture;
if (typeof NOMS_LIEUX_MARCHE !== 'undefined') NOMS_LIEUX_MARCHE.peche = 'La cabane de Barnabé';
if (typeof RUMEURS_CHANTIER !== 'undefined') RUMEURS_CHANTIER.peche = ["Un vieux hobbit traîne des cannes, des filets et une odeur de vase derrière les planches. Il sifflote en ficelant des bouchons.", "On a vu passer un tonneau qui frétillait. Vous trouvez ça normal, vous, un tonneau qui frétille ?"];
if (typeof SUCCES !== 'undefined') Object.assign(SUCCES, {
  premierePrise: { nom: 'Ça mord !', texte: 'Pêcher ton premier poisson à l’étang du Moulin', icone: '🎣' },
  grandMere: { nom: 'Cinquante ans qu’il la guettait', texte: 'Prendre Grand-Mère Écaille, la légende de l’étang', icone: '🐟★' },
  carnetEtang: { nom: 'L’étang n’a plus de secrets', texte: 'Prendre toutes les espèces de l’étang du Moulin', icone: '📖', cache: true },
});

function etatPeche(G) {
  return (G.peche = G.peche || { cannes: [], canne: null, xp: 0, carnet: {}, etranges: [], plage: null, vendus: null, barnabe: false, tuto: false, legende: null, dons: null, grandPere: false });
}
function pecheOuverte(G) { return G.jour >= PECHE.ouverture; }
function aUneCanne(G) { return etatPeche(G).cannes.length > 0; }
function canneDe(G) { const p = etatPeche(G); return CANNES_PECHE[p.canne] || CANNES_PECHE[p.cannes[p.cannes.length - 1]] || CANNES_PECHE.roseau; }
function donnerCanne(G, id) {
  const p = etatPeche(G);
  if (!p.cannes.includes(id)) p.cannes.push(id);
  // (on prend toujours la meilleure qu'on a)
  p.canne = ORDRE_CANNES.filter(c => p.cannes.includes(c)).pop();
  if (id === 'grandPere') p.grandPere = true;
  return CANNES_PECHE[id];
}
function acheterCanne(G, id) {
  const c = CANNES_PECHE[id];
  if (!c || !c.prix) return { erreur: 'Elle ne se vend pas.' };
  if (etatPeche(G).cannes.includes(id)) return { erreur: 'Tu l’as déjà.' };
  if (G.argent < c.prix) return { erreur: `Il te manque ${Math.ceil(c.prix - G.argent)} pièces.` };
  payer(G, c.prix, 'cannes');
  donnerCanne(G, id);
  return { canne: c };
}

// L'expérience de pêcheur
function niveauPeche(G) { const xp = etatPeche(G).xp; let n = 1; PECHE.seuils.forEach((s, i) => { if (xp >= s) n = i + 1; }); return n; }
function progresPeche(G) {
  const xp = etatPeche(G).xp, n = niveauPeche(G), bas = PECHE.seuils[n - 1], haut = PECHE.seuils[n] ?? null;
  return { niveau: n, xp, bas, haut };
}
function gagnerXpPeche(G, xp) { const p = etatPeche(G), avant = niveauPeche(G); p.xp += xp; return { gain: xp, niveau: niveauPeche(G), monte: niveauPeche(G) > avant }; }

// La plage horaire : 'aube' le matin ; le soir, 'jour' si le comptoir a fermé tôt, sinon 'nuit'
function plageDePeche(G, matin) {
  if (matin) return 'aube';
  const h = typeof G.heure === 'number' ? G.heure : 18;
  return h < PECHE.heureJour ? 'jour' : 'nuit';
}
// La méfiance de l'étang : combien de poissons pris d'affilée dans cette plage, aujourd'hui
function mefiancePeche(G, plage) { const p = etatPeche(G); return p.plage && p.plage.jour === G.jour && p.plage.cle === plage ? p.plage.n : 0; }
function noterPrisePlage(G, plage) { const p = etatPeche(G); if (!(p.plage && p.plage.jour === G.jour && p.plage.cle === plage)) p.plage = { jour: G.jour, cle: plage, n: 0 }; p.plage.n++; }
// Les réglages du mini-jeu pour une touche : délai avant la touche, largeur de la zone verte, force du poisson
function reglagesTouche(G, plage, prise) {
  const m = mefiancePeche(G, plage), c = canneDe(G);
  const poisson = prise.legende ? { niveau: PECHE.legende.niveau } : POISSONS[prise.id] || { niveau: 1 };
  const ecart = Math.max(0, poisson.niveau - niveauPeche(G));   // (trop coriace : zone minuscule, la ligne casse vite)
  const zone = Math.max(0.1, 0.24 * c.zone * (1 - 0.1 * m) * (ecart ? Math.pow(0.55, ecart) : 1) * (prise.legende ? 0.8 : 1));
  const force = Math.min(1, 0.35 + poisson.niveau * 0.09 + (prise.legende ? 0.25 : 0));
  const delai = (1500 + Math.random() * 2500) * (1 + 0.55 * m) * (0.7 + 0.5 * (prise.distance || 0.5));
  return { zone, force, delai, ecart, casse: ecart ? 2600 / ecart : 9e9, fenetre: Math.max(380, 750 - m * 50) };
}
function plusRienNeMord(G, plage) { return mefiancePeche(G, plage) >= PECHE.mefianceMax; }

// Ce qui mord : un poisson de la plage (plus gros si on a lancé loin), une prise étrange, ou la légende
function tirerPrise(G, plage, distance = 0.5) {
  const p = etatPeche(G);
  const hiver = typeof saisonDe === 'function' && /hiver|givre|neige/i.test(String(saisonDe(G)));
  if (plage === 'aube' && !p.legende && niveauPeche(G) >= PECHE.legende.niveau && Math.random() < PECHE.legende.chance * (hiver ? PECHE.legende.hiver : 1) * (0.6 + distance * 0.8)) {
    const [a, b] = LEGENDE_ETANG.taille;
    return { id: 'legende', legende: true, taille: Math.round(a + Math.random() * (b - a)), distance };
  }
  if (Math.random() < CHANCE_ETRANGE) {
    const ids = Object.keys(PRISES_ETRANGES).filter(k => k !== 'piece' || !p.etranges.includes('piece'));
    const tot = ids.reduce((s, k) => s + PRISES_ETRANGES[k].poids, 0); let r = Math.random() * tot;
    for (const k of ids) { r -= PRISES_ETRANGES[k].poids; if (r <= 0) return { id: k, etrange: true, distance }; }
  }
  const ids = Object.keys(POISSONS).filter(k => POISSONS[k].plages[plage] > 0);
  // (lancer loin : les gros poissons mordent un peu plus)
  const poids = ids.map(k => POISSONS[k].plages[plage] * (1 + (POISSONS[k].niveau - 2) * 0.25 * (distance - 0.5)));
  const tot = poids.reduce((a, b) => a + Math.max(0.05, b), 0); let r = Math.random() * tot, id = ids[0];
  for (let i = 0; i < ids.length; i++) { r -= Math.max(0.05, poids[i]); if (r <= 0) { id = ids[i]; break; } }
  const [a, b] = POISSONS[id].taille, u = Math.min(1, Math.max(0, Math.random() * 0.75 + distance * 0.3));
  return { id, taille: Math.round(a + u * (b - a)), distance };
}

// Une prise remontée : le carnet, le record, l'expérience. Renvoie { nouveau, record, xp, niveau, monte }
function enregistrerPrise(G, prise, plage) {
  const p = etatPeche(G);
  noterPrisePlage(G, plage);
  if (prise.etrange) {
    const nouveau = !p.etranges.includes(prise.id);
    if (nouveau) p.etranges.push(prise.id);
    const e = PRISES_ETRANGES[prise.id];
    if (e.pieces) encaisser(G, e.pieces, 'peche');
    // (la pièce ancienne : « la vieille pièce dorée » des souvenirs de l'eau, si elle manque à la vitrine)
    if (prise.id === 'piece' && typeof gagnerPiece === 'function') gagnerPiece(G, 'nymphe', 'medaille');
    return { nouveau, record: false, ...gagnerXpPeche(G, 5) };
  }
  if (prise.legende) {
    p.legende = { jour: G.jour, taille: prise.taille, choix: null };
    if (typeof debloquerSucces === 'function') debloquerSucces(G, 'grandMere');
    return { nouveau: true, record: true, ...gagnerXpPeche(G, PECHE.legende.xp) };
  }
  const f = p.carnet[prise.id] = p.carnet[prise.id] || { n: 0, record: 0, plages: [] };
  const nouveau = f.n === 0, record = prise.taille > f.record;
  f.n++; if (record) f.record = prise.taille; if (!f.plages.includes(plage)) f.plages.push(plage);
  if (typeof debloquerSucces === 'function') {
    debloquerSucces(G, 'premierePrise');
    if (Object.keys(POISSONS).every(k => p.carnet[k] && p.carnet[k].n)) debloquerSucces(G, 'carnetEtang');
  }
  return { nouveau, record: record && !nouveau, ...gagnerXpPeche(G, POISSONS[prise.id].xp) };
}

// Le chat file avec la prise ? (il pêche avec toi ; jamais une espèce nouvelle, ni la légende, ni une prise étrange)
function chatPecheAvecToi(G) {
  const c = G.chat;
  return !!(c && c.adopte && typeof moulinFait === 'function' && moulinFait(G) && !(typeof chatParti === 'function' && chatParti(G)));
}
function chatVoleLaPrise(G, prise, bilan) {
  if (!chatPecheAvecToi(G) || prise.legende || prise.etrange || bilan.nouveau) return false;
  return Math.random() < PECHE.vol;
}

// Les choix de la fiche
function ventesDuJour(G) { const p = etatPeche(G); return p.vendus && p.vendus.jour === G.jour ? p.vendus.n : 0; }
function prixPoisson(prise) { if (prise.legende) return PECHE.legende.prix; const f = POISSONS[prise.id]; return f ? Math.max(1, Math.round(f.prix * (0.8 + 0.4 * (prise.taille - f.taille[0]) / (f.taille[1] - f.taille[0])))) : 0; }
function vendrePoisson(G, prise) {
  if (!prise.legende && ventesDuJour(G) >= PECHE.venteParJour) return { erreur: `Barnabé n’en rachète que ${PECHE.venteParJour} par jour : « Mon étal est petit ! »` };
  const p = etatPeche(G), x = prixPoisson(prise);
  if (!prise.legende) p.vendus = { jour: G.jour, n: ventesDuJour(G) + 1 };
  else p.legende.choix = 'vendue';
  encaisser(G, x, 'peche');
  return { gain: x };
}
function garderPoisson(G, prise) {
  const n = prise.legende ? PECHE.legende.rations : 1;
  const place = G.capacite - stockTotal(G);
  if (place <= 0) return { erreur: 'Ta réserve est pleine : pas de place pour le fumer.' };
  const mis = Math.min(n, place);
  G.stock.ration = (G.stock.ration || 0) + mis;
  if (prise.legende) etatPeche(G).legende.choix = 'fumee';
  return { rations: mis };
}
// Au chat : +1 ♥ une fois par jour (il danse quand même) ; la légende : +8 ♥
function donnerAuChat(G, prise) {
  const p = etatPeche(G);
  if (prise.legende) { p.legende.choix = 'chat'; return { gain: typeof changerLien === 'function' ? changerLien(G, PECHE.legende.lien) : 0 }; }
  if (p.dons === G.jour) return { gain: 0 };
  p.dons = G.jour;
  return { gain: typeof changerLien === 'function' ? changerLien(G, 1) : 0 };
}
function naturaliserLegende(G) { const p = etatPeche(G); p.legende.choix = 'mur'; p.trophee = true; return true; }
