// (v1.57, planches 75 v2 et 76 v4 validées) Le grand voyage et Pont-Royal, la ville du Royaume des Hommes.
// - Le déclencheur : trois conditions (le Royaume des Hommes libéré ou conquis ; la maison a ses pattes ; la Comté
//   accomplie : le palier « Comptoir renommé », le paon qui ne tient plus boutique à côté, le Moulin si tu as un chat).
//   Alors la lettre du duc arrive au comptoir. Rien ne presse : au bureau, « Fixer le jour du départ » (on paie le lot,
//   trois jours de préparatifs). Rester est toujours possible.
// - La route : cinq étapes fixes (le départ, les vergers, le gué, la Porte des Hommes, Pont-Royal) ; avec des pattes
//   ferrées les vergers et le gué se font d'une traite (4 jours), avec des runiques le gué et la Porte aussi (3 jours).
//   Huit heures de marche par jour (le bois du filet), un imprévu par jour, le soir elle s'accroupit (des fagots).
//   Les missions en cours continuent : les voyageurs rentreront à Pont-Royal.
// - L'arrivée : elle range ses pattes sous elle sur le lot du pont, le duc vient « saluer ». À Pont-Royal, plus de loyer
//   au bourgmastre (le lot est à toi) mais les taxes du duc chaque semaine : le pont (deux pièces par client servi) et les
//   fenêtres (selon le niveau de la façade) ; plus fortes côté ombre. Les clients y sont surtout des Hommes.

const VOYAGE = {
  lot: 10000,                          // (le lot du pont, payé en fixant le départ : environ trois mois de bénéfice)
  preparatifs: 3,                      // jours entre « Fixer le jour du départ » et le départ
  palierRenom: 4,                      // (l'index de « Comptoir renommé » dans PALIERS_CLIENTS)
  etapes: [
    { id: 'depart', nom: 'Le départ', texte: 'Les adieux, les champs de la Comté.' },
    { id: 'vergers', nom: 'Les vergers', texte: 'Des pommiers à perte de vue ; on vend par la fenêtre.' },
    { id: 'gue', nom: 'Le gué', texte: 'Elle traverse la rivière, l\'eau aux genoux.' },
    { id: 'porte', nom: 'La Porte des Hommes', texte: 'La frontière du royaume : la garde arrête la maison.' },
    { id: 'arrivee', nom: 'Pont-Royal', texte: 'À l\'aube, la ville sur le grand pont du fleuve.' },
  ],
  // les étapes faites chaque jour, selon les pattes
  jours: { chene: [[0], [1], [2], [3], [4]], ferree: [[0], [1, 2], [3], [4]], runique: [[0], [1, 2, 3], [4]] },
  fagotsDuSoir: 3,                     // le bois mort ramassé le soir, au bord du chemin (si le filet a de la place)
  taxePorte: 2,                        // par patte, à la Porte des Hommes
  sergent: 25,                         // la pièce glissée au sergent (côté ombre), pour éviter la fouille
  fenetre: { min: 30, parEtoile: 25 }, // la vente par la fenêtre, chaque jour de route
};
// Les taxes du duc, chaque semaine (le jour du loyer) : le pont et les fenêtres
const DUC = {
  nom: 'le duc Aldebert Pansard', titre: 'seigneur du Pont et des Deux Rives',
  pont: 2,                             // deux pièces par client servi dans la semaine
  fenetres: { base: 60, parNiveau: 40 },
  ombre: 1.5,                          // il soupçonne l'ombre : ses taxes sont plus fortes
  humains: 4,                          // à Pont-Royal, un Homme a quatre fois plus de chances de passer la porte
};
if (typeof POSTES !== 'undefined') { POSTES.voyage = 'Le grand voyage'; POSTES.taxeDuc = 'Taxes du duc'; }
// Les gestes de la route, pour la jauge lumière / ombre
if (typeof BAREME_CAMP !== 'undefined') Object.assign(BAREME_CAMP, {
  routeAider: { camp: 'bien', n: 1, texte: 'Aider quelqu\'un sur la route du grand voyage' },
  routeSergent: { camp: 'mal', n: 1, texte: 'Soudoyer le sergent de la Porte des Hommes' },
  routeRancon: { camp: 'mal', n: 1, texte: 'Faire payer un blessé sur la route' },
});

// (les étoiles du comptoir : conseil.js les compte ; sinon, le plus haut palier atteint)
function etoilesVoyage(G) { return typeof etoilesDe === 'function' ? etoilesDe(G) : Math.max(1, ...(G.paliersEtoiles || [1])); }
function etatVoyage(G) { return (G.voyage = G.voyage || { lettre: null, lettreLue: false, depart: null, enRoute: false, jourRoute: 0, imprevus: [], arrive: null, pip: false }); }
function villeActuelle(G) { return G.ville || 'comte'; }
function aPontRoyal(G) { return villeActuelle(G) === 'pontRoyal'; }
function enRoute(G) { return !!(G.voyage && G.voyage.enRoute); }

// --- Le déclencheur ---
function conditionsVoyage(G) {
  const r = G.rival, rivalFini = !r || r.etat !== 'ouvert';
  const histoires = rivalFini && (!chatAdopte(G) || (typeof moulinFait === 'function' && moulinFait(G)));
  const renomme = palierClients(G).index >= VOYAGE.palierRenom;
  const a = avanceeRoyaume(G, 'humains');
  return [
    { nom: 'Un royaume libéré', ok: royaumeLibere(G, 'humains'), detail: `Le Royaume des Hommes entièrement libéré (ou conquis) : ${a.faites}/${a.total} contrées.` },
    { nom: 'La maison a ses pattes', ok: typeof pattesPosees === 'function' && pattesPosees(G), detail: 'Les pattes des Mages-Charpentiers (10 000 p.), et du bois dans le filet.' },
    { nom: 'La Comté est accomplie', ok: renomme && histoires,
      detail: `Le palier « Comptoir renommé »${renomme ? ' ✓' : ''}, ${rivalFini ? 'le paon ne tient plus boutique ✓' : 'le paon ne doit plus tenir boutique à côté'}${chatAdopte(G) ? (moulinFait(G) ? ', le Moulin ✓' : ', et l\'histoire du Moulin') : ''}.` },
  ];
}
function voyagePossible(G) { return conditionsVoyage(G).every(c => c.ok); }
// La lettre du duc, au comptoir, le matin qui suit (une seule fois)
function lettreDucDuJour(G) { const v = G.voyage; return !!(v && v.lettre && v.lettre <= G.jour && !v.lettreLue && !aPontRoyal(G)); }
function lireLettreDuc(G) { etatVoyage(G).lettreLue = true; }

// --- Les préparatifs ---
function joursDeRoute(G) { return VOYAGE.jours[(G.pattes && G.pattes.sorte) || 'chene'].length; }
function heuresDeRoute(G) { return (joursDeRoute(G) - 1) * PATTES.journee; }   // (le dernier jour, on arrive à l'aube)
function fixerDepart(G) {
  const v = etatVoyage(G);
  if (aPontRoyal(G)) return { erreur: 'Tu es déjà installé à Pont-Royal.' };
  if (!voyagePossible(G)) return { erreur: 'Toutes les conditions ne sont pas encore remplies.' };
  if (v.depart) return { erreur: `Le départ est déjà fixé au jour ${v.depart}.` };
  if (!peutPayer(G, VOYAGE.lot)) return { erreur: `Le lot du pont coûte ${VOYAGE.lot} p. : il te manque ${VOYAGE.lot - Math.floor(G.argent)} pièces (la banque fait des prêts).` };
  payer(G, VOYAGE.lot, 'voyage');
  v.depart = G.jour + VOYAGE.preparatifs;
  return { depart: v.depart, texte: `Le lot du pont est payé (${VOYAGE.lot} p.). Départ au jour ${v.depart} : trois jours pour faire le plein de bois et dire au revoir.` };
}
// Changer d'avis : le notaire du duc rend la moitié du lot
function annulerDepart(G) {
  const v = etatVoyage(G);
  if (!v.depart || v.enRoute) return { erreur: 'Aucun départ à annuler.' };
  const rendu = Math.round(VOYAGE.lot / 2);
  encaisser(G, rendu, 'voyage');
  v.depart = null;
  return { texte: `Le notaire du duc garde la moitié du lot « pour le dérangement » et te rend ${rendu} p.` };
}
function joursAvantDepart(G) { const v = G.voyage; return v && v.depart ? v.depart - G.jour : null; }
function departAujourdhui(G) { const v = G.voyage; return !!(v && v.depart && !v.enRoute && !aPontRoyal(G) && G.jour >= v.depart); }
function assezDeBois(G) { return heuresDeBois(G) >= heuresDeRoute(G); }

// La nuit : la lettre, quand tout est prêt
function nuitDuVoyage(G) {
  const v = etatVoyage(G);
  if (!v.lettre && !aPontRoyal(G) && voyagePossible(G)) v.lettre = G.jour + 1;
  if (aPontRoyal(G)) nuitDuDuc(G);
}
// Le matin : le compte à rebours des préparatifs
function matinDuVoyage(G) {
  const v = G.voyage, l = [];
  if (!v || !v.depart || v.enRoute || aPontRoyal(G)) return l;
  const n = v.depart - G.jour;
  if (n > 0) l.push(`Le grand voyage : départ dans ${n} jour${n > 1 ? 's' : ''}. ${assezDeBois(G) ? 'Le filet a assez de bois pour la route.' : `Il faut ${heuresDeRoute(G)} h de bois dans le filet (il y en a ${heuresDeBois(G)}) : chez les Mages-Charpentiers ou chez Thorgal.`}`);
  else if (!assezDeBois(G)) { v.depart = G.jour + 1; l.push(`Le grand jour... mais le filet n'a que ${heuresDeBois(G)} h de bois sur les ${heuresDeRoute(G)} de la route. Le départ est remis à demain : fais le plein !`); }
  return l;
}

// --- La route ---
// Les imprévus : un par jour de route, tirés au sort sans répétition. Chaque choix renvoie ce qui a changé.
const IMPREVUS = {
  orage: { nom: "L'orage", texte: 'Le ciel noircit d\'un coup, la pluie tombe en cordes. Deux voyageurs trempés courent se coller sous l\'avant-toit de ta maison.',
    choix: [
      { nom: 'Leur vendre des capes et des torches', fait: G => { const p = 40 + 10 * etoilesVoyage(G); encaisser(G, p, 'voyage'); return { texte: 'Ils achètent tout ce qui protège de la pluie, ravis.', gains: [`+${p} p.`] }; } },
      { nom: "Les faire entrer au chaud, gratuitement", fait: G => { pencher(G, 'routeAider'); G.reputation += 0.5; return { texte: 'On boit une tisane au comptoir en écoutant la pluie. Ils parleront de toi à Pont-Royal.', gains: ['+0,5 réputation', '☀'] }; } },
    ] },
  clandestin: { nom: 'Le passager clandestin', texte: 'Un ronflement dans le filet à bois : un petit gobelin dort entre deux bûches, une pomme à moitié mangée dans la main.',
    choix: [
      { nom: 'Le gronder et le déposer au bord du chemin', fait: G => ({ texte: 'Il file en grommelant, sa pomme à la main.', gains: [] }) },
      { nom: "L'embaucher pour ramasser le bois", fait: G => { etatVoyage(G).pip = true; return { texte: 'Il s\'appelle Pip. Chaque soir, il rapportera des fagots en plus.', gains: ['+2 fagots chaque soir'] }; } },
    ] },
  maison: { nom: 'Une autre maison qui marche', texte: 'Sur la route, une cabane à pattes de poule vient à ta rencontre : un marchand nomade, qui propose un marché de passage d\'une heure.',
    choix: [
      { nom: 'Lui acheter des provisions (60 p.)', si: G => peutPayer(G, 60), fait: G => { payer(G, 60, 'voyage'); for (const [id, n] of [['ration', 4], ['potion', 2], ['bandage', 3]]) G.stock[id] = (G.stock[id] || 0) + n; return { texte: 'Des rations, des potions, des bandages : de quoi équiper tes premiers clients du pont.', gains: ['−60 p.', '+4 rations', '+2 potions', '+3 bandages'] }; } },
      { nom: 'Le saluer et continuer', fait: G => ({ texte: 'Les deux maisons se saluent d\'un coup de fumée. Les chats, sur les toits, se toisent.', gains: [] }) },
    ] },
  pont: { nom: 'Un pont trop étroit', texte: 'Un petit pont de bois enjambe le ruisseau. Il est deux fois plus étroit que ta maison.',
    choix: [
      { nom: 'Faire le détour par le gué (3 h de bois)', fait: G => { const b = brulerBois(G, 3); return { texte: 'Elle descend la berge à petits pas et remonte de l\'autre côté, trempée jusqu\'aux genoux.', gains: [`−${b.manges.length} bois`] }; } },
      { nom: 'Passer en crabe, pattes serrées', fait: G => { if (Math.random() < 0.5) { payer(G, 50, 'voyage'); return { texte: 'Crac ! Le coin du mur a frotté la rambarde. Il faudra reboucher ça (50 p.).', gains: ['−50 p.'] }; } return { texte: 'Elle passe de profil, une patte après l\'autre, sans toucher la rambarde. Les canards applaudissent.', gains: [] }; } },
    ] },
  troll: { nom: 'Le troll du péage', texte: 'Sous le pont, un troll lève une massue grosse comme un tonneau. « Péage ! Ou je mange une patte. »',
    choix: [
      { nom: 'Payer le péage (40 p.)', fait: G => { payer(G, 40, 'voyage'); return { texte: 'Il mord la pièce, la trouve bonne, et s\'écarte en grognant.', gains: ['−40 p.'] }; } },
      { nom: 'Lui offrir trois rations et une histoire', si: G => (G.stock.ration || 0) >= 3, fait: G => { G.stock.ration -= 3; return { texte: 'Il mange les rations, écoute l\'histoire du dragon jusqu\'au bout, et pleure un peu. « Passe, conteur. »', gains: ['−3 rations'] }; } },
    ] },
  fete: { nom: 'Un village en fête', texte: 'Des lampions, une danse sur la place, des tonneaux en perce : tout un village fête la moisson.',
    choix: [
      { nom: 'S\'arrêter et vendre aux fêtards', fait: G => { const p = 60 + 15 * etoilesVoyage(G); encaisser(G, p, 'voyage'); return { texte: 'On vend des gourdes et des torches jusqu\'au soir, et on danse un peu.', gains: [`+${p} p.`] }; } },
      { nom: 'Leur offrir une tournée', si: G => peutPayer(G, 30), fait: G => { payer(G, 30, 'voyage'); G.reputation += 0.8; return { texte: 'Le village lève son verre « à la maison qui marche ». La nouvelle courra jusqu\'au pont.', gains: ['−30 p.', '+0,8 réputation'] }; } },
    ] },
  blesse: { nom: 'Un héros blessé', texte: 'Au bord du chemin, un aventurier assis contre une borne, le bras en écharpe, son épée cassée à côté de lui.',
    choix: [
      { nom: 'Le soigner (une potion)', si: G => (G.stock.potion || 0) >= 1, fait: G => { G.stock.potion--; pencher(G, 'routeAider'); G.reputation += 0.5; return { texte: 'Il se relève, te serre la main. « Je viendrai te voir à Pont-Royal. »', gains: ['−1 potion', '+0,5 réputation', '☀'] }; } },
      { nom: 'Lui vendre les soins (30 p.)', si: G => (G.stock.bandage || 0) >= 1, fait: G => { G.stock.bandage--; encaisser(G, 30, 'voyage'); pencher(G, 'routeRancon'); return { texte: 'Il paie, sans un mot.' + (chatAdopte(G) ? ' Ton chat détourne les yeux.' : ' Il ne te regarde plus.'), gains: ['−1 bandage', '+30 p.', '☾'] }; } },
      { nom: 'Passer son chemin', fait: G => ({ texte: 'Tu ne t\'arrêtes pas. Par la fenêtre du fond, tu le vois te regarder partir.', gains: [] }) },
    ] },
  brigands: { nom: 'Les brigands', texte: 'Trois brigands barrent la route, l\'arc bandé. « La bourse, ou on met le feu au filet ! »',
    choix: [
      { nom: 'Payer (10 % de ta bourse, 150 p. au plus)', fait: G => { const p = Math.min(150, Math.round(Math.max(0, G.argent) * 0.1)); payer(G, p, 'voyage'); return { texte: 'Ils filent avec la bourse. La maison souffle de la fumée noire, de rage.', gains: [`−${p} p.`] }; } },
      { nom: 'Laisser faire le chat', si: G => chatAdopte(G), fait: G => ({ texte: 'Du haut du toit, ton chat se gonfle, feule... et une ombre immense se dresse dans la fumée de la cheminée. Les brigands s\'enfuient en hurlant.', gains: ['le chat ♥'] }) },
      { nom: 'Faire courir la maison (4 h de bois)', fait: G => { const b = brulerBois(G, 4); return { texte: 'Elle prend ses pattes à son cou. Les carreaux tremblent, les brigands mangent la poussière.', gains: [`−${b.manges.length} bois`] }; } },
    ] },
};
// (v1.58) Ceux qui attendent leur nouveau dessin (planche 79) ne sortent plus sur la route : le gardien du péage
// (qui ne peut pas s'appeler « troll », c'est un peuple du jeu) et les brigands (qui deviennent des pandas renégats)
const IMPREVUS_EN_ATTENTE = ['troll', 'brigands'];
// Le plan de la route, tiré au départ : pour chaque jour, ses étapes et son imprévu (le dernier jour : l'arrivée)
function partirEnVoyage(G) {
  const v = etatVoyage(G), plan = VOYAGE.jours[(G.pattes && G.pattes.sorte) || 'chene'];
  const tires = Object.keys(IMPREVUS).filter(id => !IMPREVUS_EN_ATTENTE.includes(id)).sort(() => Math.random() - 0.5);
  v.enRoute = true; v.jourRoute = 0; v.pip = false; v.depuis = G.jour;
  v.plan = plan.map((etapes, i) => ({ etapes, imprevu: i < plan.length - 1 && !etapes.includes(3) ? tires.pop() : null }));
  v.imprevus = [];
  G.dernierLoyer = 0;
  // les retours de mission, les lettres et les familles attendus pendant la route : ils viendront à Pont-Royal, le jour de l'arrivée
  const arrivee = G.jour + plan.length - 1;
  for (const p of G.partis || []) if (!p.termine && p.retour >= G.jour && p.retour < arrivee) p.retour = arrivee;
  for (const a of G.annonces || []) if (a.jour >= G.jour && a.jour < arrivee) a.jour = arrivee;
  for (const x of G.visites || []) if (x.jour >= G.jour && x.jour < arrivee) x.jour = arrivee;
  return v.plan;
}
function jourDeRoute(G) { const v = G.voyage; return v && v.plan ? v.plan[v.jourRoute] : null; }
function choixPossibles(G, id) { return IMPREVUS[id].choix.map((c, i) => ({ ...c, i, ok: !c.si || c.si(G) })); }
function choisirImprevu(G, id, i) {
  const c = IMPREVUS[id].choix[i];
  if (!c || (c.si && !c.si(G))) return { erreur: 'Impossible.' };
  const r = c.fait(G);
  etatVoyage(G).imprevus.push({ id, choix: i, jour: G.jour });
  return r;
}
// La marche du jour : huit heures de bois (s'il en manque, on ramasse du bois mort, et on arrive quand même)
function marcherLeJour(G) {
  const b = brulerBois(G, PATTES.journee);
  return { manges: b.manges, assez: b.assez };
}
// La vente par la fenêtre : une voyageuse marche à côté et achète ce qu'il lui faut
function venteParLaFenetre(G) {
  const p = VOYAGE.fenetre.min + VOYAGE.fenetre.parEtoile * etoilesVoyage(G) + Math.floor(Math.random() * 20);
  encaisser(G, p, 'voyage');
  return p;
}
// La Porte des Hommes : la taxe de passage, puis la lettre du duc (lumière, neutre) ou la fouille (ombre)
function passerLaPorte(G, choix) {
  const taxe = VOYAGE.taxePorte * 4, ombre = coteCamp(G) === 'mal';
  payer(G, taxe, 'voyage');
  if (!ombre) return { texte: 'Tu montres la lettre du duc. Le sergent la lit deux fois, se redresse : « Le comptoir de la Comté ! Passez, et bienvenue au royaume. » La garde salue ton enseigne.', gains: [`−${taxe} p. (deux pièces par patte)`] };
  if (choix === 'sergent' && peutPayer(G, VOYAGE.sergent)) { payer(G, VOYAGE.sergent, 'voyage'); pencher(G, 'routeSergent'); return { texte: 'Une pièce glissée dans le gant du sergent. Il ne regarde même pas la cave. « Bonne route. »', gains: [`−${taxe} p.`, `−${VOYAGE.sergent} p. (le sergent)`, '☾'] }; }
  return { texte: 'On fouille la maison du grenier à la cave : les gardes retournent les tiroirs, comptent tes fioles, soupèsent tes pièges. Rien de saisi... cette fois. « On a l\'œil sur vous. »', gains: [`−${taxe} p. (deux pièces par patte)`] };
}
// Le soir en route : elle s'accroupit, on ramasse des fagots
function soirEnRoute(G) {
  const e = etatPattes(G), n = VOYAGE.fagotsDuSoir + (G.voyage.pip ? 2 : 0), place = placesFilet(G) - e.bois.length, pris = Math.max(0, Math.min(n, place));
  for (let k = 0; k < pris; k++) e.bois.push('fagot');
  return pris;
}
// La nuit en route : le temps passe comme ailleurs (salaires, missions, bar qui tourne seul...)
function nuitEnRoute(G) {
  G.voyage.jourRoute++;
  nuit(G);
}
// L'arrivée : elle s'installe sur le lot du pont
function arriverAPontRoyal(G) {
  const v = etatVoyage(G);
  v.enRoute = false; v.arrive = G.jour; v.depart = null;
  G.ville = 'pontRoyal';
  G.pontRoyal = G.pontRoyal || { clientsSemaine: 0, taxes: 0, style: null, styles: [] };
  if (typeof debloquerSucces === 'function' && typeof SUCCES !== 'undefined' && SUCCES.grandVoyage) debloquerSucces(G, 'grandVoyage');
}

// --- Pont-Royal ---
function etatPontRoyal(G) { return (G.pontRoyal = G.pontRoyal || { clientsSemaine: 0, taxes: 0, style: null, styles: [] }); }
function taxesDuDuc(G) {
  const P = etatPontRoyal(G), mult = coteCamp(G) === 'mal' ? DUC.ombre : 1;
  const pont = Math.round(P.clientsSemaine * DUC.pont * mult), fenetres = Math.round((DUC.fenetres.base + DUC.fenetres.parNiveau * niveauFacade(G)) * mult);
  return { pont, fenetres, total: pont + fenetres };
}
function nuitDuDuc(G) {
  const P = etatPontRoyal(G);
  P.clientsSemaine += (G.journal && G.journal.servis) || 0;
  if (!jourDeLoyer(G)) return;
  const t = taxesDuDuc(G);
  payer(G, t.total, 'taxeDuc');
  P.taxes += t.total; P.clientsSemaine = 0;
  G.taxesDuc = { jour: G.jour + 1, ...t };
}
function matinDuDuc(G) {
  const t = G.taxesDuc;
  if (!t || t.jour !== G.jour || !aPontRoyal(G)) return [];
  return [`Le percepteur du duc est passé : ${t.pont} p. de taxe du pont (deux pièces par client) et ${t.fenetres} p. de taxe des fenêtres. ${coteCamp(G) === 'mal' ? '« Son Excellence a l\'œil sur les comptoirs de votre espèce. »' : '« Son Excellence vous remercie. »'}`];
}
// L'architecte de Pont-Royal : les quatre styles de maison (on les garde ensuite, et on en change quand on veut)
function acheterStylePR(G, id) {
  const P = etatPontRoyal(G), s = STYLES_PONT_ROYAL[id];
  if (!s) return { erreur: 'Ce style n\'existe pas.' };
  if (P.styles.includes(id)) { P.style = id; return { texte: `${s.nom} : ta maison reprend ce style.` }; }
  if (!peutPayer(G, s.prix)) return { erreur: `Il te manque ${s.prix - Math.floor(G.argent)} pièces.` };
  payer(G, s.prix, 'decoration');
  P.styles.push(id); P.style = id;
  return { texte: `${s.nom} : les maçons du pont ont refait ta façade dans la nuit... ou presque. Elle est superbe.` };
}
function remettreStyleComte(G) { etatPontRoyal(G).style = null; }
function styleDeMaison(G) { return (G.pontRoyal && G.pontRoyal.style) || null; }
// Sur la carte : ton comptoir est là où ta maison s'est posée
const PONT_ROYAL_CARTE = { x: 342, y: 636 };
function positionComptoir(G) { return aPontRoyal(G) ? PONT_ROYAL_CARTE : MONDE_CARTE.comptoir; }
