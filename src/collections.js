// (v1.23, C-6, planche 48 v2) Les collections : six séries de pièces rangées dans la vitrine du comptoir.
// Chaque série complète donne un titre (affiché au bureau), un petit bonus, et la gazette en parle.
// Le collectionneur passe parfois racheter une pièce, très cher : vendre défait la série.
const COLLECTIONS = {
  trophees: { nom: 'Les trophées des royaumes', titre: 'Le comptoir des six royaumes', bonus: '+1 client par jour (on ouvre plus tôt)',
    source: 'rapportés par un aventurier vainqueur (plus souvent d\'une contrée ★3 ou plus)',
    pieces: { comte: "L'écu de la Comté", humains: "L'écu des Hommes", nains: "L'écu des Nains", elfes: "L'écu des Elfes", mages: "L'écu des Mages", bambous: "L'écu des Monts de Bambou" } },
  armes: { nom: 'Les armes des peuples', titre: "L'armurerie des six peuples", bonus: '+5 % de « bel ouvrage » à la forge',
    source: 'forgées ou achetées (la première de chaque)',
    pieces: { epee: "L'épée des Hommes", hache: 'La hache des Nains', arc: "L'arc des Elfes", baton: 'Le bâton des Mages', fronde: 'La fronde des Hobbits', bambou: 'Le bambou des Pandas' } },
  nymphe: { nom: 'Les souvenirs de la nymphe', titre: "L'ami de la fontaine", bonus: 'un vœu exaucé par saison',
    source: 'un tous les 10 vœux à la fontaine',
    pieces: { coquillage: 'Le coquillage rose', perle: 'La perle de la fontaine', goutte: "La goutte d'eau figée", nenuphar: 'La fleur de nénuphar', medaille: 'La vieille pièce dorée' } },
  conseil: { nom: 'Les reliques du Conseil', titre: 'Le gardien des reliques', bonus: 'impôt du Conseil −10 %',
    source: 'une à chaque commande royale livrée',
    pieces: { sceau: 'Le sceau de cire du Conseil', cle: 'La clé de la salle des Gardiens', plume: "La plume de l'archiviste", medaille: 'La médaille du Rempart', fiole: 'La fiole de lumière' } },
  bannis: { nom: 'Les curiosités des Bannis', titre: 'Le cabinet des Bannis', bonus: 'recel +5 %',
    source: 'laissées par un Banni vainqueur ; l\'écu, par un contrat de l\'ombre',
    pieces: { dague: 'La dague des Gobelins', rapiere: 'La rapière des Vampires', khopesh: 'Le khopesh des Momies', griffes: 'Les griffes des Loups-garous', massue: 'La massue des Trolls', ecu: "L'écu des Bannis" } },
  carte: { nom: 'La carte ancienne', titre: 'Le cartographe', bonus: 'un lieu caché sur la carte',
    source: 'des fragments, très rares, rapportés des ruines et des lieux anciens',
    pieces: { f1: 'Le fragment du nord-ouest', f2: 'Le fragment du nord', f3: 'Le fragment du nord-est', f4: 'Le fragment du sud-ouest', f5: 'Le fragment du sud', f6: 'Le fragment du sud-est' } },
};
const REGLES_COLLECTIONS = {
  trophee: { loin: 0.2, pres: 0.07 },     // chance qu'un vainqueur rapporte l'écu de son royaume (★3 et plus / sinon)
  banni: 0.25,                            // un Banni vainqueur laisse sa curiosité
  ecuContrat: 0.35,                       // un contrat de l'ombre réussi rapporte l'écu des Bannis
  fragment: 0.03, ecartFragment: 28,      // un vainqueur revenu de ruines ou d'un lieu ancien ; au plus un par mois (très rare)
  voeux: 10,                              // un souvenir de la nymphe tous les 10 vœux
  belOuvrage: 0.05, impot: 0.9, recel: 1.05, clients: 1,
  collectionneur: { jourMin: 20, chance: 0.05, piecesMin: 3, prixBase: 150, parPiece: 50 },
};
// Les lieux anciens (où l'on trouve les fragments de la carte)
const LIEUX_ANCIENS = { biomes: ['ruines', 'opale', 'tour', 'mines'], vignettes: ['tombeaux', 'bibliotheque', 'abbaye'] };

function collections(G) { G.collections = G.collections || {}; for (const s of Object.keys(COLLECTIONS)) G.collections[s] = G.collections[s] || []; return G.collections; }
function aPiece(G, serie, piece) { return collections(G)[serie].includes(piece); }
function nbPieces(G, serie) { return collections(G)[serie].length; }
function totalSerie(serie) { return Object.keys(COLLECTIONS[serie].pieces).length; }
function serieComplete(G, serie) { return !!G && nbPieces(G, serie) >= totalSerie(serie); }
function titresCollections(G) { return Object.keys(COLLECTIONS).filter(s => serieComplete(G, s)).map(s => COLLECTIONS[s].titre); }

// Une pièce de plus : elle est rangée dans la vitrine. Renvoie { serie, piece, nom, n, total, complete } (ou null si déjà là)
function gagnerPiece(G, serie, piece) {
  if (!COLLECTIONS[serie] || !COLLECTIONS[serie].pieces[piece] || aPiece(G, serie, piece)) return null;
  collections(G)[serie].push(piece);
  const n = nbPieces(G, serie), total = totalSerie(serie), complete = n === total;
  const r = { serie, piece, nom: COLLECTIONS[serie].pieces[piece], n, total, complete };
  (G.piecesNouvelles = G.piecesNouvelles || []).push(r);   // (la scène l'annonce : « Nouvelle pièce ! »)
  if (complete) {
    G.annonceCollection = `${COLLECTIONS[serie].nom}, au complet ! On vient de loin admirer la vitrine « ${COLLECTIONS[serie].titre} ».`;
    if (serie === 'carte') { G.carteAncienne = true; if (typeof penserAPartir === 'function') penserAPartir(G, 'carte', { force: true }); }
  }
  return r;
}

// --- Les sources ---
// Au retour d'un vainqueur : un écu de royaume, une curiosité de Banni, un fragment de la carte. Renvoie sa phrase.
function piecesAuRetour(G, v) {
  const z = ZONES[v.zone]; if (!z) return null;
  const R = REGLES_COLLECTIONS, prenom = v.nom.split(' ')[0];
  if (COLLECTIONS.trophees.pieces[z.royaume] && !aPiece(G, 'trophees', z.royaume) && Math.random() < (z.danger >= 3 ? R.trophee.loin : R.trophee.pres)) {
    const p = gagnerPiece(G, 'trophees', z.royaume);
    return `« Au retour, je suis passé${v.feminin ? 'e' : ''} par ${aLieu(z.nom)}. Tiens : ${p.nom.charAt(0).toLowerCase() + p.nom.slice(1)}, pour ta vitrine. » (${p.n}/${p.total})`;
  }
  const arme = ARME_PREFEREE[v.race];
  if (PEUPLES_OMBRE.includes(v.race) && COLLECTIONS.bannis.pieces[arme] && !aPiece(G, 'bannis', arme) && Math.random() < R.banni) {
    const p = gagnerPiece(G, 'bannis', arme);
    return `${prenom} pose sur le comptoir une vieille ${ITEMS[arme] ? nomObjet(arme).toLowerCase() : 'arme'} de son peuple. « Pour ta collection. Chez nous, ça porte bonheur. » (${p.n}/${p.total})`;
  }
  const ancien = LIEUX_ANCIENS.biomes.includes(z.biome) || LIEUX_ANCIENS.vignettes.includes(z.vignette);
  const reste = Object.keys(COLLECTIONS.carte.pieces).filter(f => !aPiece(G, 'carte', f));
  if (ancien && reste.length && G.jour - (G.dernierFragment || -99) >= R.ecartFragment && Math.random() < R.fragment) {
    G.dernierFragment = G.jour;
    const p = gagnerPiece(G, 'carte', auHasard(reste));
    return `« Dans les ruines, j'ai trouvé ça : un morceau de vieille carte. Ça ne ressemble à rien de connu... » (fragment ${p.n}/${p.total})`;
  }
  return null;
}
// (v1.31) une pièce vendue au collectionneur ne revient pas d'un simple achat (une fronde à 6 p., un vœu à 1 p.)
function pieceVendue(G, serie, id) { return !!(G.piecesVendues && (G.piecesVendues[serie] || []).includes(id)); }
// Une arme forgée ou achetée : la première de chaque peuple entre dans la vitrine
function pieceArme(G, id) { return COLLECTIONS.armes.pieces[id] && !pieceVendue(G, 'armes', id) ? gagnerPiece(G, 'armes', id) : null; }
// Un vœu à la fontaine : un souvenir tous les dix
function pieceNymphe(G) {
  if (!G.fontainePieces || G.fontainePieces % REGLES_COLLECTIONS.voeux) return null;
  const reste = Object.keys(COLLECTIONS.nymphe.pieces).filter(p => !aPiece(G, 'nymphe', p) && !pieceVendue(G, 'nymphe', p));
  return reste.length ? gagnerPiece(G, 'nymphe', reste[0]) : null;
}
// Une commande royale livrée : le Conseil te confie une relique
function pieceConseil(G) {
  const reste = Object.keys(COLLECTIONS.conseil.pieces).filter(p => !aPiece(G, 'conseil', p));
  return reste.length ? gagnerPiece(G, 'conseil', reste[0]) : null;
}
// Un contrat de l'ombre réussi : parfois, l'écu des Bannis
function pieceContrat(G) { return !aPiece(G, 'bannis', 'ecu') && Math.random() < REGLES_COLLECTIONS.ecuContrat ? gagnerPiece(G, 'bannis', 'ecu') : null; }

// --- Les bonus des séries complètes ---
function bonusClientsCollection(G) { return serieComplete(G, 'trophees') ? REGLES_COLLECTIONS.clients : 0; }
// (v1.26) les curieux qui viennent voir les trophées arrivent tôt : le comptoir ouvre plus tôt, le temps d'un client de plus
// (sinon, une journée déjà pleine n'aurait pas la place de le servir)
function avanceOuverture(G) { return serieComplete(G, 'trophees') ? dureeService(G) + JOURNEE.recit : 0; }
function bonusBelOuvrage(G) { return serieComplete(G, 'armes') ? REGLES_COLLECTIONS.belOuvrage : 0; }
function multImpotCollection(G) { return serieComplete(G, 'conseil') ? REGLES_COLLECTIONS.impot : 1; }
function multRecel(G) { return serieComplete(G, 'bannis') ? REGLES_COLLECTIONS.recel : 1; }
// Un vœu exaucé par saison : au premier matin de chaque saison, la nymphe bénit le comptoir
function voeuDeSaison(G) {
  if (!serieComplete(G, 'nymphe') || typeof saisonDe !== 'function') return null;
  const cle = saisonDe(G) + ':' + Math.floor((G.jour - 1) / 112);   // (une fois par saison de chaque année)
  if (G.voeuSaison === cle) return null;
  G.voeuSaison = cle;
  G.nymphe = G.nymphe || { visites: 0 };
  G.nymphe.benie = G.jour + NYMPHE.benediction.jours - 1;
  return "Un souffle frais passe sous la porte : la nymphe a exaucé ton vœu de saison. Les rivières te seront douces cette semaine.";
}

// --- Le collectionneur ---
// Il veut la pièce qui te manquerait le plus : celle de ta série la plus avancée (pas encore complète, de préférence)
function pieceVoulue(G) {
  const series = Object.keys(COLLECTIONS).filter(s => s !== 'carte' && nbPieces(G, s) > 0)
    .sort((a, b) => (serieComplete(G, a) - serieComplete(G, b)) || nbPieces(G, b) - nbPieces(G, a));
  if (!series.length) return null;
  const s = series[0], piece = collections(G)[s][collections(G)[s].length - 1];
  return { serie: s, piece, nom: COLLECTIONS[s].pieces[piece], prix: REGLES_COLLECTIONS.collectionneur.prixBase + REGLES_COLLECTIONS.collectionneur.parPiece * nbPieces(G, s) };
}
function collectionneurDuJour(G) {
  const C = REGLES_COLLECTIONS.collectionneur;
  const total = Object.keys(COLLECTIONS).reduce((n, s) => n + nbPieces(G, s), 0);
  if (G.jour < C.jourMin || total < C.piecesMin || G.collectionneurJour === G.jour || Math.random() >= C.chance) return null;
  const v = pieceVoulue(G); if (!v) return null;
  G.collectionneurJour = G.jour;
  return { type: 'collectionneur', voulue: v };
}
function vendreAuCollectionneur(G, v) {
  if (!aPiece(G, v.serie, v.piece)) return null;
  const etaitComplete = serieComplete(G, v.serie);
  G.collections[v.serie] = G.collections[v.serie].filter(p => p !== v.piece);
  if (v.serie === 'carte') G.carteAncienne = false;
  G.piecesVendues = G.piecesVendues || {}; (G.piecesVendues[v.serie] = G.piecesVendues[v.serie] || []).push(v.piece);
  encaisser(G, v.prix, 'collections');
  return etaitComplete ? `La série n'est plus complète : le titre « ${COLLECTIONS[v.serie].titre} » et son bonus s'en vont avec la pièce.` : null;
}
const COLLECTIONNEUR = { nom: 'Sire Baudouin de Montclair', race: 'humain', feminin: false, niveau: 'heros', costume: 'noble' };
