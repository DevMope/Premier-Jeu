// (03/11, refonte Lumière et Ombre, étape 3) Les faits qui manquaient : ceux qui servent un camp, chacun avec son
// jumeau de même poids (docs/histoire/ombre-lumiere-refonte.md, section 2.1) :
//   - les doyens : écouter un vieux Banni jusqu'au bout (et le croire), ou le faire taire ; en Lumière, la garde
//     l'interrompt (L3 de revelations.md) ;
//   - les fissures du Sage : une phrase du Sage qui contredit un indice déjà trouvé (la berceuse, les pommiers de
//     Grand-mère Ortie, la nuit au ciel orange, la médaille). La garder en mémoire, ou la chasser. La Lumière ardente
//     ne les voit plus ;
//   - les églises-relais du chant (Q181) : les protéger (la sœur et sa veille) ou les saboter (la limaille dans la
//     cloche) ;
//   - les convois de la Confrérie (les escarmouches) : les ravitailler, ou dire leur route aux Bannis ; quand une
//     contrée est attaquée, ça pèse sur la bataille (menace.js, forceEscouade) ;
//   - le Drômmath, l'Assemblée de la Nuit : un don pour son trésor de guerre ;
//   - le Parrain dénoncé : ses suites, drôles et dangereuses, nuit après nuit (la sardine, la chorale, la grève des
//     chats, l'avocat, les pattes de velours, la lettre, le chapeau).
// Ici, les règles seules (la simulation s'en sert) ; la mise en scène est dans scenes/ComptoirFaits.js. Les faits
// (FAITS, BAREME_CAMP) sont dans degres.js.

const FAITS_HISTOIRE = {
  doyen: { gardeDes: 2 },                                     // en Lumière (le monde te voit à +2), la garde l'interrompt
  fissure: { jourMin: 45, ecart: 14 },
  eglise: { jourMin: 50, etoiles: 3, jourSans: 80, repos: 30, max: 3, don: { torche: 2, corde: 1 }, garde: 0.3, amende: 40 },
  convoi: { jourMin: 55, repos: 25, max: 4, don: { ration: 3, potion: 1 }, bataille: 8, soupcon: 0.25 },
  drommath: { jourMin: 40, repos: 28, part: 0.04, min: 100, max: 3000 },
  parrain: { rats: 4, vol: 0.08, volMax: 300, avocat: 60, pelote: 17 },
};
if (typeof POSTES !== 'undefined') Object.assign(POSTES, { drommath: 'Le trésor de guerre du Drômmath', faits: 'Les églises, les convois, le Parrain' });

// L'état sauvegardé (complété à chaque lecture : les vieilles parties restent bonnes)
function etatFaits(G) {
  const d = { doyens: { ecoutes: [], tus: [] }, fissures: { vues: {}, gardees: 0, chassees: 0, jour: 0 },
    eglises: { protegees: 0, sabotees: 0, refus: 0, jour: 0, attente: null },
    convois: { escortes: 0, pilles: 0, refus: 0, jour: 0, attente: null },
    drommath: { dons: 0, total: 0, jour: 0 }, parrain: { vu: {}, avocat: null }, retard: 0 };
  if (!G.faitsHistoire || typeof G.faitsHistoire !== 'object') G.faitsHistoire = {};
  const F = G.faitsHistoire;
  for (const [k, v] of Object.entries(d)) if (F[k] === undefined) F[k] = v && typeof v === 'object' ? JSON.parse(JSON.stringify(v)) : v;
  return F;
}
const palierFaits = G => (typeof palierCamp === 'function' ? palierCamp(G) : 0);
// Qui vient : la Confrérie quand le monde te voit de son côté, les Bannis de l'autre ; au milieu, l'un ou l'autre
function quiVientFaits(G) { const p = palierFaits(G); return p >= 1 ? 'confrerie' : p <= -1 ? 'bannis' : (Math.random() < 0.5 ? 'confrerie' : 'bannis'); }
// Ce qu'on donne de sa réserve : ce qui manque, on l'achète au prix du fournisseur
function donnerDeLaReserve(G, don) {
  let paye = 0;
  for (const [id, n] of Object.entries(don)) {
    const pris = typeof retirerDuStock === 'function' ? retirerDuStock(G, id, n) : Math.min(n, G.stock[id] || 0);
    if (typeof retirerDuStock !== 'function') G.stock[id] = (G.stock[id] || 0) - pris;
    paye += (n - pris) * ((ITEMS[id] && ITEMS[id].prix) || 0);
  }
  if (paye > 0) payer(G, Math.min(paye, Math.max(0, Math.floor(G.argent))), 'faits');
  return paye;
}
const texteDon = don => Object.entries(don).map(([id, n]) => `${n} ${(ITEMS[id] ? ITEMS[id].nom : id).toLowerCase()}${n > 1 && !/[sx]$/.test(ITEMS[id] ? ITEMS[id].nom : id) ? 's' : ''}`).join(' et ');

// --- 1. Les doyens ---
// Écouter jusqu'au bout (au comptoir, ou au marché noir) : le fait de l'Ombre, et une lueur (le récit retenu)
function ecouterDoyen(G, race) {
  const D = etatFaits(G).doyens;
  if (!D.ecoutes.includes(race)) { D.ecoutes.push(race); if (typeof pencher === 'function') pencher(G, 'ecouterDoyen'); }
  G.ainesRecits = [...new Set([...(G.ainesRecits || []), race])];
}
function faireTaireDoyen(G, race) {
  const D = etatFaits(G).doyens;
  if (!D.tus.includes(race)) { D.tus.push(race); if (typeof pencher === 'function') pencher(G, 'faireTaireDoyen'); }
}
// En Lumière, la garde vient l'interrompre au milieu de son récit (L3)
function gardeInterromptDoyen(G) { return palierFaits(G) >= FAITS_HISTOIRE.doyen.gardeDes; }

// --- 2. Les fissures du Sage ---
const FISSURES_SAGE = [
  { id: 'berceuse', connu: G => typeof berceuseConnue === 'function' && berceuseConnue(G), fredon: true,
    sage: '« On m’a dit qu’un vieux fou t’avait laissé une chanson. Une berceuse, vraiment ? Il n’y a jamais eu de berceuse, mon enfant. Ces gens-là inventent des chansons pour qu’on les plaigne. »',
    souvenir: 'La page pliée en quatre, l’écriture fine… Et dehors, au même instant, une petite fille fredonne l’air sous ta fenêtre, note pour note.' },
  { id: 'pommiers', connu: G => (G.ainesRecits || []).includes('gobelin') || (G.ainesVus || []).includes('gobelin'),
    sage: '« Les gobelins ? Ils ont toujours vécu sous la terre, dans le noir. Ils ne savent même pas ce qu’est un arbre. »',
    souvenir: 'Grand-mère Ortie : « Nous aussi, on avait des pommiers. Des milliers. Personne ne me croit. »' },
  { id: 'parents', connu: G => typeof etatEvt === 'function' && etatEvt(G).parents >= 3,
    sage: '« La nuit où tes parents sont partis ? Une nuit calme, sans une étoile. Je m’en souviens comme si c’était hier. »',
    souvenir: 'Le vieux voyageur : « Le ciel était orange, cette nuit-là. Quelqu’un m’a mis dans les bras un petit… »' },
  { id: 'medaille', connu: G => !!G.medailleParents,
    sage: '« Tes parents ? De simples colporteurs, qui t’ont laissé un matin sans se retourner. Il faut l’accepter, mon enfant. »',
    souvenir: 'La médaille d’or terni, deux épées croisées sous une étoile. « Ils ne t’ont pas abandonné », a dit le mendiant.' },
];
function fissureDisponible(G) {
  if (typeof degreDe === 'function' && degreDe(G) >= 3) return null;   // (la Lumière ardente ne voit plus les fissures)
  const F = etatFaits(G).fissures;
  return FISSURES_SAGE.find(f => !F.vues[f.id] && (() => { try { return f.connu(G); } catch (e) { return false; } })()) || null;
}
function fissurePossible(G) {
  const C = FAITS_HISTOIRE.fissure, F = etatFaits(G).fissures;
  return G.jour >= C.jourMin && G.jour - (F.jour || -99) >= C.ecart && !!fissureDisponible(G);
}
function evtFissure(G, e, choix) {
  const F = etatFaits(G).fissures, f = FISSURES_SAGE.find(x => x.id === e.fissure);
  if (!f || F.vues[f.id]) return {};
  F.vues[f.id] = G.jour; F.jour = G.jour;
  if (choix === 'garder') { F.gardees++; pencher(G, 'fissureGardee'); } else { F.chassees++; pencher(G, 'fissureChassee'); }
  return { choix };
}

// --- 3. Les églises-relais du chant ---
function eglisePossible(G) {
  const C = FAITS_HISTOIRE.eglise, E = etatFaits(G).eglises;
  if (G.jour < C.jourMin || E.attente || E.protegees + E.sabotees >= C.max || G.jour - (E.jour || -99) < C.repos) return false;
  return (G.paliersEtoiles || []).includes(C.etoiles) || G.jour >= C.jourSans;
}
function evtEglise(G, e, choix) {
  const C = FAITS_HISTOIRE.eglise, E = etatFaits(G).eglises;
  E.jour = G.jour;
  if (choix === 'proteger') { const paye = donnerDeLaReserve(G, C.don); E.protegees++; E.attente = { jour: G.jour + 1, quoi: 'protegee' }; pencher(G, 'protegerEglise'); return { paye }; }
  if (choix === 'saboter') { E.sabotees++; E.attente = { jour: G.jour + 1, quoi: 'sabotee', garde: Math.random() < C.garde }; pencher(G, 'saboterEglise'); return {}; }
  E.refus++;
  if (typeof regarder === 'function') regarder(G, e.qui === 'bannis' ? 'bannis' : 'confrerie', -1);
  return {};
}

// --- 4. Les convois de la Confrérie ---
// La contrée de la Confrérie attaquée en ce moment, si la bataille n'est pas encore jouée (sinon : vers les frontières)
function zoneDuConvoi(G) {
  const M = G.menace;
  if (!M || !M.actives || typeof ZONES === 'undefined') return null;
  const m = M.actives.find(x => ZONES[x.zone] && ZONES[x.zone].camp === 'bien' && x.bataille > G.jour + 1);
  return m ? m.zone : null;
}
function menaceDuConvoi(G) { const z = zoneDuConvoi(G); return (z && G.menace.actives.find(x => x.zone === z)) || {}; }
function convoiPossible(G) {
  const C = FAITS_HISTOIRE.convoi, V = etatFaits(G).convois;
  return G.jour >= C.jourMin && !V.attente && V.escortes + V.pilles < C.max && G.jour - (V.jour || -99) >= C.repos;
}
function evtConvoi(G, e, choix) {
  const C = FAITS_HISTOIRE.convoi, V = etatFaits(G).convois;
  V.jour = G.jour;
  const m = e.zone && G.menace && (G.menace.actives || []).find(x => x.zone === e.zone);
  if (choix === 'ravitailler') {
    const paye = donnerDeLaReserve(G, C.don); V.escortes++;
    if (m) m.convoi = (m.convoi || 0) + C.bataille;
    V.attente = { jour: G.jour + 1, quoi: 'escorte', zone: e.zone || null };
    pencher(G, 'escorterConvoi');
    return { paye };
  }
  if (choix === 'renseigner') {
    V.pilles++;
    if (m) m.convoi = (m.convoi || 0) - C.bataille;
    V.attente = { jour: G.jour + 1, quoi: 'pille', zone: e.zone || null, soupcon: Math.random() < C.soupcon };
    pencher(G, 'pillerConvoi');
    return {};
  }
  V.refus++;
  if (typeof regarder === 'function') regarder(G, e.qui === 'bannis' ? 'bannis' : 'confrerie', -1);
  return {};
}

// --- 5. Le Drômmath ---
function drommathTeConnait(G) {
  if (G.camp === 'mal' || (G.lo && G.lo.serment === 'mal')) return true;
  if (palierFaits(G) <= -2) return true;
  return typeof regardDe === 'function' && regardDe(G).niveauBannis >= 2;
}
function drommathPossible(G) {
  const C = FAITS_HISTOIRE.drommath, D = etatFaits(G).drommath;
  return G.jour >= C.jourMin && G.jour - (D.jour || -99) >= C.repos && G.camp !== 'bien' && drommathTeConnait(G) && G.argent >= C.min * 2;
}
function montantDrommath(G) { const C = FAITS_HISTOIRE.drommath; return Math.max(C.min, Math.min(C.max, Math.round(G.argent * C.part / 50) * 50)); }
function evtDrommath(G, e, choix) {
  const D = etatFaits(G).drommath;
  D.jour = G.jour;
  if (choix !== 'donner' || !peutPayer(G, e.montant)) return {};
  payer(G, e.montant, 'drommath');
  D.dons++; D.total += e.montant;
  pencher(G, 'donDrommath');
  return { donne: e.montant };
}

// --- 6. Le Parrain dénoncé : les suites ---
function parrainDenonce(G) { return !!(G.parrain && G.parrain.statut === 'denonce'); }
function avocatPossible(G) { return parrainDenonce(G) && G.jour >= G.parrain.jour + 12 && !etatFaits(G).parrain.avocat; }
function evtAvocat(G, e, choix) {
  const P = etatFaits(G).parrain, x = Math.min(FAITS_HISTOIRE.parrain.avocat, Math.max(0, Math.floor(G.argent)));
  if (choix === 'payer') { if (x > 0) payer(G, x, 'faits'); P.avocat = { choix, jour: G.jour, x }; return { paye: x }; }
  P.avocat = { choix: 'dehors', jour: G.jour };
  return {};
}
const YEUX_CHAT_FAITS = { vert: 'verts', jaune: 'jaunes', bleu: 'bleus', ambre: 'couleur d’ambre', cuivre: 'cuivrés', vairons: 'vairons' };
// Les lignes du réveil, jour après jour (k : les jours depuis la dénonciation)
const SUITES_PARRAIN = [
  { k: 1, f: (G, nom) => `La gazette, en une : « UN CHAT À LA TÊTE DE LA PÈGRE ? » Le capitaine de la garde : « Nous suivons une piste. À quatre pattes. » Toute la rue ricane. Et sous ta porte, une sardine, roulée dans un gant de cuir noir.` },
  { k: 3, f: G => { etatFaits(G).retard = G.jour; return 'Toute la nuit, une centaine de chats ont miaulé sous ta fenêtre, en chœur, et presque juste. Tu n’as pas fermé l’œil : le comptoir ouvrira une heure plus tard.'; } },
  { k: 6, f: G => {
    const n = typeof retirerDuStock === 'function' ? retirerDuStock(G, 'ration', FAITS_HISTOIRE.parrain.rats) : 0;
    return `Les chats du quartier sont en grève : plus un seul ne chasse dans ta rue. Cette nuit, les rats ont fait la fête dans ta réserve${n ? ` (${n} ration${n > 1 ? 's' : ''} dévorée${n > 1 ? 's' : ''})` : ''}. Sur le rebord, un chat de gouttière les regardait faire, les pattes croisées.`;
  } },
  { k: 9, f: G => `Avis de recherche placardé dans tout le bourg : « Chat. Borsalino. Gant noir. » La garde a arrêté ${FAITS_HISTOIRE.parrain.pelote} chats de gouttière, le vieux matou de la mère Pelote et un raton laveur. Aucun n’est le bon. La mère Pelote a juré qu’elle ne t’adresserait plus la parole.` },
  { k: 16, f: G => {
    if (typeof niveauAmelioration === 'function' && niveauAmelioration(G, 'serrure') > 0) return 'Des griffures toutes fraîches autour de ta serrure de fer, et une arête de poisson sur le seuil : quelqu’un a voulu entrer cette nuit. Ta serrure a tenu.';
    const P = FAITS_HISTOIRE.parrain, x = Math.min(P.volMax, Math.floor(Math.max(0, G.argent) * P.vol));
    if (x > 0) payer(G, x, 'faits');
    return `Des pattes de velours ont forcé ta caisse cette nuit : ${x} pièces envolées. Sur le comptoir, des empreintes toutes petites, et une arête de poisson bien rangée au milieu.`;
  } },
  { k: 21, f: G => { if (typeof mafia === 'function') mafia(G).vengeance = false; return 'Une lettre, cachetée d’une empreinte de patte dans la cire noire : « Je ne t’en veux pas. Je suis déçu. C’est pire. » Depuis, les restes de la bande ne viennent plus rôder.'; } },
  { k: 30, f: G => { const y = YEUX_CHAT_FAITS[(typeof lookChat === 'function' ? lookChat(G).yeux : 'vert')] || 'verts'; return `Au marché, sous un chapeau bien trop grand, deux yeux ${y} t’ont regardé passer. Le temps de te retourner : plus rien. Une plume de borsalino, par terre.`; } },
  { k: 45, f: G => 'Une carte postale, sans adresse d’expéditeur : une plage au soleil, deux transats, deux petits verres. Au dos, deux empreintes de patte. Rien d’autre.' },
];
function matinDuParrainDenonce(G) {
  if (!parrainDenonce(G)) return [];
  const P = etatFaits(G).parrain, k = G.jour - G.parrain.jour, lignes = [];
  for (const s of SUITES_PARRAIN) if (k >= s.k && !P.vu[s.k] && k - s.k <= 3) { P.vu[s.k] = G.jour; lignes.push(s.f(G, typeof nomChatMaj === 'function' ? nomChatMaj(G) : 'Le chat')); break; }
  for (const s of SUITES_PARRAIN) if (k - s.k > 3 && !P.vu[s.k]) P.vu[s.k] = -1;   // (une vieille partie : on ne rattrape pas tout d'un coup)
  // l'avocat mis dehors : le lendemain
  if (P.avocat && P.avocat.choix === 'dehors' && P.avocat.jour === G.jour - 1) {
    G.reputation = Math.max(0, G.reputation - 0.5);
    lignes.push('Le tribunal du bourg a classé l’affaire : le plaignant ne s’est pas présenté (on cherche encore « Monsieur Chat »). Mais ce matin, un poisson pourri était cloué sur ta porte. Toute la rue l’a senti.');
  }
  if (P.avocat && P.avocat.choix === 'payer' && P.avocat.jour === G.jour - 1) lignes.push('Un reçu glissé sous ta porte, pour « l’honneur d’un chat » : signé d’une patte, et parfumé à la sardine.');
  return lignes;
}

// --- Au matin : les suites des églises et des convois, et celles du Parrain ---
function matinDesFaits(G) {
  const F = etatFaits(G), lignes = [], lucide = typeof lueursDe === 'function' && lueursDe(G) >= 15;
  const E = F.eglises.attente;
  if (E && G.jour >= E.jour) {
    F.eglises.attente = null;
    if (E.quoi === 'protegee') lignes.push(`Les sœurs ont veillé toute la nuit au clocher, avec tes torches : deux silhouettes encapuchonnées ont fui par les toits. À matines, la cloche a sonné juste.${lucide ? ' Et pourtant, en l’entendant, tu as oublié un instant le nom de ta propre rue.' : ''}`);
    else if (E.garde) {
      const a = Math.min(FAITS_HISTOIRE.eglise.amende, Math.max(0, Math.floor(G.argent)));
      if (a > 0) payer(G, a, 'faits');
      if (typeof regarder === 'function') regarder(G, 'confrerie', -6);
      lignes.push(`À l’aube, la garde a fouillé sous ton comptoir : le sac de limaille, avant qu’on vienne le chercher. Amende : ${a} p., et la Confrérie a noté ton nom. La cloche de la chapelle, elle, sonne toujours juste.`);
    } else lignes.push('La cloche de la chapelle a sonné faux à matines : une longue fêlure, de haut en bas. Les sœurs pleurent ; le Sage a fait venir un fondeur de Pont-Royal. Sous ton comptoir, le sac a disparu.');
  }
  const V = F.convois.attente;
  if (V && G.jour >= V.jour) {
    F.convois.attente = null;
    const ou = V.zone && typeof ZONES !== 'undefined' && ZONES[V.zone] ? (typeof deLieu === 'function' ? deLieu(ZONES[V.zone].nom) : ZONES[V.zone].nom) : null;
    if (V.quoi === 'escorte') lignes.push(`Le convoi de la Confrérie est parti à l’aube${ou ? ` vers la contrée ${ou}` : ' vers les frontières'}, tes caisses sur la première charrette. Le sergent t’a salué de la main.${ou ? ' L’escouade tiendra mieux.' : ''}`);
    else {
      if (V.soupcon && typeof regarder === 'function') regarder(G, 'confrerie', -6);
      lignes.push(`Le convoi de la Confrérie a été pillé au gué${ou ? `, sur la route de la contrée ${ou}` : ''} : les caisses ont disparu dans la forêt, sans un blessé.${V.soupcon ? ' La garde a interrogé toute la rue : quelqu’un a vu un loup-garou à ta fenêtre, la veille.' : ' La garde cherche un traître ; personne ne pense à toi.'}`);
    }
  }
  lignes.push(...matinDuParrainDenonce(G));
  return lignes;
}
// La nuit blanche de la chorale des chats : le comptoir ouvre une heure plus tard (regles.js, heureOuverture)
function retardDesFaits(G, jour = G.jour) { return G.faitsHistoire && G.faitsHistoire.retard === jour ? 1 : 0; }

// --- Les événements du comptoir (evenementsComptoir.js) ---
if (typeof EVENEMENTS_COMPTOIR !== 'undefined') {
  Object.assign(EVENEMENTS_COMPTOIR, {
    fissure: { histoire: true, eligible: G => fissurePossible(G), creer: G => ({ fissure: fissureDisponible(G).id }) },
    eglise: { eligible: G => eglisePossible(G), creer: G => ({ qui: quiVientFaits(G) }) },
    convoi: { eligible: G => convoiPossible(G), creer: G => ({ qui: quiVientFaits(G), zone: zoneDuConvoi(G) }) },
    // (quand une contrée de la Confrérie est attaquée, le convoi passe en priorité, une fois par attaque)
    convoiGuerre: { suite: true, eligible: G => convoiPossible(G) && !!zoneDuConvoi(G) && !menaceDuConvoi(G).convoiPropose,
      creer: G => { menaceDuConvoi(G).convoiPropose = true; return { qui: quiVientFaits(G), zone: zoneDuConvoi(G) }; } },
    drommath: { eligible: G => drommathPossible(G), creer: G => ({ montant: montantDrommath(G) }) },
    avocat: { histoire: true, suite: true, eligible: G => avocatPossible(G) },
  });
  HISTOIRE_EVT.push('fissure');
  HASARD_EVT.push('eglise', 'convoi', 'drommath');
  SUITES_EVT.push('avocat', 'convoiGuerre');
}
// Qui s'avance au comptoir (personneEvenement le demande d'abord ici)
const PERSONNES_FAITS = {
  sage: { nom: 'Le Grand Sage', race: 'humain', feminin: false, figurant: 'sage', vieux: true },
  soeur: { nom: 'Sœur Clémence', race: 'humain', feminin: true, figurant: 'soeurClemence' },
  ysolde: { nom: 'Ysolde Nuit-Close', race: 'vampire', feminin: true, figurant: 'ysolde' },
  intendant: { nom: 'Sergent Mathis Bourrel', race: 'nain', feminin: false, figurant: 'intendantBourrel' },
  eclaireur: { nom: 'Fenrir Pas-Feutré', race: 'loupgarou', feminin: false, figurant: 'fenrir' },
  nekhet: { nom: 'Nekhet, voix du Drômmath', race: 'momie', feminin: true, figurant: 'nekhet' },
  avocat: { nom: 'Maître Anselme Fouine', race: 'humain', feminin: false, figurant: 'maitreFouine' },
};
function personneDesFaits(e) {
  if (!e || e.type !== 'evenement') return null;
  if (e.id === 'fissure') return PERSONNES_FAITS.sage;
  if (e.id === 'eglise') return e.qui === 'bannis' ? PERSONNES_FAITS.ysolde : PERSONNES_FAITS.soeur;
  if (e.id === 'convoi' || e.id === 'convoiGuerre') return e.qui === 'bannis' ? PERSONNES_FAITS.eclaireur : PERSONNES_FAITS.intendant;
  if (e.id === 'drommath') return PERSONNES_FAITS.nekhet;
  if (e.id === 'avocat') return PERSONNES_FAITS.avocat;
  return null;
}
if (typeof NOMS_EVT !== 'undefined') Object.assign(NOMS_EVT, {
  sage: 'Le Grand Sage', soeur: 'Sœur Clémence — de la chapelle', ysolde: 'Ysolde Nuit-Close — une vampire',
  intendant: 'Sergent Mathis Bourrel — intendant', eclaireur: 'Fenrir Pas-Feutré — éclaireur', nekhet: 'Nekhet — voix du Drômmath',
  avocat: 'Maître Anselme Fouine — avocat',
});

// --- Le banc de la simulation ---
function choixDesFaits(G, e) {
  if (e.id === 'fissure') return ['garder', 'chasser'];
  if (e.id === 'eglise') return e.qui === 'bannis' ? ['saboter', 'refuser'] : ['proteger', 'refuser'];
  if (e.id === 'convoi' || e.id === 'convoiGuerre') return e.qui === 'bannis' ? ['renseigner', 'refuser'] : ['ravitailler', 'refuser'];
  if (e.id === 'drommath') return ['donner', 'refuser'];
  if (e.id === 'avocat') return ['payer', 'dehors'];
  return null;
}
function resoudreFaitSim(G, e, c) {
  if (e.id === 'fissure') return evtFissure(G, e, c);
  if (e.id === 'eglise') return evtEglise(G, e, c);
  if (e.id === 'convoi' || e.id === 'convoiGuerre') return evtConvoi(G, e, c);
  if (e.id === 'drommath') return evtDrommath(G, e, c);
  if (e.id === 'avocat') return evtAvocat(G, e, c);
  return null;
}
