// (v1.16, planche 43 v5 validée) Le petit bar : la maison du paon rachetée pour en faire un bar (à la place de
// l'orphelinat). Le soir, le joueur peut JOUER une soirée (19 h – minuit, façon Dave the Diver : servir avant que la
// patience tombe, calmer les bagarres, rattraper les filous), ou laisser l'équipe la faire TOUTE SEULE (une fois
// l'équipe au complet depuis quelques soirs : de quoi payer les paies et gagner un peu, sans aucun bonus), ou
// FERMER (pas de paie ce soir-là). Les installations sont chères, et les paies viennent en plus, chaque soir ouvert.
const BAR = {
  // L'équipe : une paie chaque soir où le bar ouvre
  equipe: {
    barman: { nom: 'Durk', titre: 'barman', race: 'nain', paie: 10, role: 'les chopes', quoi: { race: 'nain', nom: 'Durk', costume: 'forgeron', habit: 0x7a2a2a, cheveux: 0x8a3a1a, barbe: 'pleine' } },
    cuisinier: { nom: 'Grumm', titre: 'cuisinier', race: 'orc', paie: 12, role: 'les plats (il faut la cuisine)', installation: 'cuisine', quoi: { race: 'orc', nom: 'Grumm', costume: 'forgeron', habit: 0xece6d8, cheveux: 0x1a1410 } },
    serveur: { nom: 'Milo', titre: 'serveur', race: 'hobbit', paie: 6, role: 'porte aux tables', quoi: { race: 'hobbit', nom: 'Milo', costume: 'colporteur', habit: 0xe8e0d0, cheveux: 0x6a3a1a } },
    serveuse: { nom: 'Rosa', titre: 'serveuse', race: 'hobbit', feminin: true, paie: 6, role: 'la deuxième, dès 12 clients', quoi: { race: 'hobbit', nom: 'Rosa', feminin: true, costume: 'colporteur', habit: 0xe8e0d0, cheveux: 0xc8a050 } },
    videur: { nom: 'Brok', titre: 'videur', race: 'troll', paie: null, role: 'les bagarres et les filous (il faut son poste)', installation: 'videur', quoi: { race: 'troll', nom: 'Brok', costume: 'forgeron', habit: 0x1a1a1a, cheveux: 0x2a2a2a } },
  },
  // Les installations, dans l'ordre (le prix est celui de l'installation seule : les paies viennent en plus)
  installations: [
    { id: 'cuisine', nom: 'La cuisine', prix: 3000, effet: 'Des plats en plus des chopes : la salle rapporte bien plus (il faut un cuisinier).' },
    { id: 'scene', nom: 'La scène', prix: 6000, effet: 'Une bande de musiciens (au choix) et le conteur du jour : plus de monde chaque soir.' },
    { id: 'terrasse', nom: 'La terrasse', prix: 12000, effet: 'Le bar ouvre aussi à midi, pendant que tu es au comptoir : il tourne tout seul (équipe au complet, et de quoi payer).' },
    { id: 'videur', nom: 'Le poste du videur', prix: 15000, effet: 'Le dernier : on peut embaucher un videur, qui calme les bagarres et rattrape les filous à ta place.' },
  ],
  // Les trois bandes (une à la fois, sur la scène) ; leur paie chaque soir ouvert
  bandes: {
    gobelets: { nom: 'Les Trois Gobelets', qui: 'hobbits et gobelins', paie: 10, clients: 2, effet: 'pas chers · un peu plus de monde' },
    cornes: { nom: 'Les Cornes de Brume', qui: 'orcs et trolls', paie: 18, clients: 3, chopes: 1.15, bagarres: 2, effet: 'plus de boissons fortes · plus de bagarres' },
    ombres: { nom: 'Les Ombres Douces', qui: 'elfes et vampires, masqués', paie: 30, clients: 3, prix: 1.25, effet: 'chères · les nobles viennent, les prix montent' },
  },
  // Le conteur du jour : le joueur ne le choisit pas ; plus il est connu, plus il coûte et plus il attire de monde
  conteurs: ['Vieux Bran', 'Maître Pell', 'Sœur Aube', 'Garance la Voix', 'Old Tobin', 'Mélisse Plume', 'Barde Orvin'],
  conteur: { paieParEtoile: 6 },
  // Ce que paie un client : une chope, et un plat s'il y a la cuisine et le cuisinier
  prix: { chope: 4, plat: 7, partPlat: 0.6 },
  clients: { base: 4, parRenommee: 2, max: 20, serveuse: 12 },
  renommee: { depart: 1, max: 5, gain: 0.25, perte: 0.15, bon: 0.8 },   // gagnée en jouant (≥ 80 % servis), perdue sinon
  // tout seul : au complet depuis 5 soirs joués ; 65 % de ce que rapporte une salle jouée, sans conteur (il ne vient
  // que quand tu es là) ; ce que le videur rate coûte moins cher (une ardoise, un peu de casse)
  seul: { soirsComplets: 5, rendement: 0.65, perte: [4, 10] },
  midi: { rendement: 0.55, clients: 0.7 },       // à midi (la terrasse) : moins de monde qu'un soir, pas de bande, pas d'imprévu
  // Les imprévus d'une soirée (par soirée : la chance d'en avoir un de chaque)
  imprevus: { bagarre: 0.35, filou: 0.3, pourboire: 0.6, rumeur: 0.5, perteFilou: [8, 18], garde: 1 },
  // Le videur : chaque soir, selon son niveau (planche 43 v4) ; il monte d'un niveau toutes les 15 soirées
  videur: { niveaux: [
    { nom: 'novice', paie: 8, rien: 0.3, moitie: 0.5 },
    { nom: 'aguerri', paie: 14, rien: 0.15, moitie: 0.45 },
    { nom: 'vétéran', paie: 22, rien: 0.05, moitie: 0.3 },
  ], soirsParNiveau: 15 },
  // Embellir, pièce par pièce (esthétique seulement) : l'auberge, puis la grande brasserie
  pieces: [
    { id: 'sol', nom: 'Le sol', prix: [500, 2000] },
    { id: 'murs', nom: 'Les murs', prix: [700, 2200] },
    { id: 'tables', nom: 'Les tables', prix: [600, 2000] },
    { id: 'chaises', nom: 'Les chaises', prix: [400, 1500] },
    { id: 'comptoir', nom: 'Le comptoir', prix: [700, 3000] },
    { id: 'lumieres', nom: 'Les lumières', prix: [300, 1300] },
    { id: 'facade', nom: 'La façade', prix: [800, 3000] },
  ],
  styles: ['La taverne de quartier', "L'auberge", 'La grande brasserie'],
};
POSTES.bar = 'Le petit bar';

function barDe(G) {
  return (G.bar = G.bar || { equipe: {}, installations: {}, chantier: null, bande: null, renommee: BAR.renommee.depart, pieces: {},
    soireesJouees: 0, soirsComplets: 0, videurSoirs: 0, ce: null, rumeur: null, habitues: 0, dernier: null });
}
function barOuvert(G) { return !!(G.rival && G.rival.etat === 'bar'); }
function barA(G, id) { return !!(G.bar && G.bar.installations && G.bar.installations[id]); }
function aEmbauche(G, qui) { return !!(G.bar && G.bar.equipe && G.bar.equipe[qui]); }
function installationBar(G) { return BAR.installations.find(i => !barA(G, i.id)) || null; }

// Le niveau du videur (0, 1, 2), et sa paie
function niveauVideur(G) { const b = barDe(G); return Math.min(BAR.videur.niveaux.length - 1, Math.floor((b.videurSoirs || 0) / BAR.videur.soirsParNiveau)); }
function paieDe(G, qui) { return qui === 'videur' ? BAR.videur.niveaux[niveauVideur(G)].paie : BAR.equipe[qui].paie; }

// Qui peut-on embaucher ? (le cuisinier : quand la cuisine est faite ; le videur : quand son poste est bâti)
function peutEmbaucher(G, qui) {
  const e = BAR.equipe[qui];
  if (!e || aEmbauche(G, qui)) return false;
  return !e.installation || barA(G, e.installation);
}
function embaucherAuBar(G, qui) {
  if (!barOuvert(G)) return { erreur: 'Pas de bar.' };
  if (!peutEmbaucher(G, qui)) return { erreur: 'Impossible pour l’instant.' };
  barDe(G).equipe[qui] = G.jour;
  return { ok: true };
}
function renvoyerDuBar(G, qui) { const b = barDe(G); if (!b.equipe[qui]) return { erreur: 'Pas embauché.' }; delete b.equipe[qui]; if (qui !== 'videur') b.soirsComplets = 0; return { ok: true }; }

// L'équipe est « au complet » quand chaque poste possible est pris (le barman, un serveur, le cuisinier si la cuisine
// est faite ; la serveuse et le videur ne sont pas obligatoires)
function equipeComplete(G) {
  return aEmbauche(G, 'barman') && aEmbauche(G, 'serveur') && (!barA(G, 'cuisine') || aEmbauche(G, 'cuisinier'));
}
function peutTournerSeul(G) { return equipeComplete(G) && (barDe(G).soirsComplets || 0) >= BAR.seul.soirsComplets; }

// Bâtir la prochaine installation : payée tout de suite, bâtie dans la nuit
function batirAuBar(G) {
  const i = installationBar(G), b = barDe(G);
  if (!i || !barOuvert(G)) return { erreur: 'Rien à bâtir.' };
  if (b.chantier) return { erreur: 'Les ouvriers sont déjà à l’ouvrage.' };
  if (!peutPayer(G, i.prix)) return { erreur: manqueArgent(G, i.prix, `Il te manque ${i.prix - Math.floor(G.argent)} pièces.`) };
  payer(G, i.prix, 'bar');
  b.chantier = i.id;
  return { ok: true, installation: i };
}
function choisirBande(G, cle) {
  if (!barA(G, 'scene')) return { erreur: 'Il faut la scène.' };
  if (cle && !BAR.bandes[cle]) return { erreur: 'Inconnue.' };
  barDe(G).bande = cle || null;
  return { ok: true };
}

// Embellir : la pièce passe au style suivant (l'auberge, puis la brasserie, quand toute l'auberge est faite)
function stylePiece(G, id) { return (barDe(G).pieces[id] || 0); }
function aubergeComplete(G) { return BAR.pieces.every(p => stylePiece(G, p.id) >= 1); }
function prochainePiece(G, id) {
  const p = BAR.pieces.find(x => x.id === id), n = stylePiece(G, id);
  if (!p || n >= 2) return null;
  if (n === 1 && !aubergeComplete(G)) return { bloque: true, style: 2, prix: p.prix[1] };
  return { style: n + 1, prix: p.prix[n] };
}
function embellirBar(G, id) {
  const s = prochainePiece(G, id);
  if (!barOuvert(G) || !s) return { erreur: 'Rien à embellir.' };
  if (s.bloque) return { erreur: 'La grande brasserie s’ouvre quand toute l’auberge est faite.' };
  if (!peutPayer(G, s.prix)) return { erreur: manqueArgent(G, s.prix, `Il te manque ${s.prix - Math.floor(G.argent)} pièces.`) };
  payer(G, s.prix, 'bar');
  barDe(G).pieces[id] = s.style;
  return { ok: true, style: s.style };
}
// Le style de la façade (et de la salle, pièce par pièce) : 0 taverne, 1 auberge, 2 brasserie
function styleDuBar(G, id = 'facade') { return ['taverne', 'auberge', 'brasserie'][stylePiece(G, id)]; }

// Le conteur du jour : tiré une fois par jour (s'il y a la scène)
function conteurDuJour(G) {
  if (!barA(G, 'scene')) return null;
  const b = barDe(G);
  if (!b.conteur || b.conteur.jour !== G.jour) {
    const etoiles = hasard(1, 5);
    b.conteur = { jour: G.jour, nom: auHasard(BAR.conteurs), etoiles, paie: etoiles * BAR.conteur.paieParEtoile, clients: etoiles };
  }
  return b.conteur;
}

// Le monde attendu ce soir : la renommée, la bande, le conteur, les habitués
function clientsDuSoir(G, sansConteur = false) {
  const b = barDe(G), bande = b.bande && BAR.bandes[b.bande], ct = !sansConteur && conteurDuJour(G);
  const n = BAR.clients.base + Math.round(b.renommee * BAR.clients.parRenommee) + (bande ? bande.clients : 0) + (ct ? ct.clients : 0) + (b.habitues || 0);
  return Math.max(2, Math.min(BAR.clients.max, n));
}
// Ce que rapporte un client servi (une chope, et un plat la plupart du temps s'il y a la cuisine et le cuisinier)
function recetteParClient(G) {
  const b = barDe(G), bande = b.bande && BAR.bandes[b.bande];
  const plats = barA(G, 'cuisine') && aEmbauche(G, 'cuisinier');
  let r = BAR.prix.chope * (bande && bande.chopes || 1) + (plats ? BAR.prix.plat * BAR.prix.partPlat : 0);
  if (bande && bande.prix) r *= bande.prix;
  return r;
}
// Les paies d'un soir ouvert : l'équipe, la bande, le conteur (à midi : l'équipe seulement)
function paiesDuSoir(G, midi = false, sansConteur = midi) {
  const b = barDe(G), lignes = [];
  for (const qui of Object.keys(BAR.equipe)) if (aEmbauche(G, qui)) lignes.push([`${BAR.equipe[qui].nom} (${BAR.equipe[qui].titre})`, paieDe(G, qui)]);
  if (!midi && b.bande) lignes.push([BAR.bandes[b.bande].nom, BAR.bandes[b.bande].paie]);
  const ct = !sansConteur && conteurDuJour(G);
  if (ct) lignes.push([`${ct.nom}, le conteur`, ct.paie]);
  return { lignes, total: lignes.reduce((s, [, p]) => s + p, 0) };
}

// Les imprévus de la soirée, tirés au début (la scène les fait vivre ; le bar seul les règle tout seul)
function imprevusDuSoir(G) {
  const b = barDe(G), bande = b.bande && BAR.bandes[b.bande], I = BAR.imprevus;
  return {
    bagarre: Math.random() < Math.min(0.9, I.bagarre * (bande && bande.bagarres || 1)),
    filou: Math.random() < I.filou,
    pourboire: Math.random() < I.pourboire,
    rumeur: Math.random() < I.rumeur,
  };
}
// Ce que fait le videur des problèmes du soir : { geres, rates } (selon son niveau : rien, un sur deux, tout)
function videurDuSoir(G, problemes) {
  if (!problemes || !aEmbauche(G, 'videur')) return { geres: 0, rates: problemes || 0 };
  const N = BAR.videur.niveaux[niveauVideur(G)], t = Math.random();
  // il ne gère rien, il en gère un sur deux (pour un seul problème : une chance sur deux), ou il gère tout
  const geres = t < N.rien ? 0 : t < N.rien + N.moitie ? (problemes === 1 ? (Math.random() < 0.5 ? 1 : 0) : Math.floor(problemes / 2)) : problemes;
  return { geres, rates: problemes - geres };
}

// La rumeur entendue au bar : vraie sur demain (une affaire au marché : un objet moins cher à un étal)
function rumeurDuBar(G) {
  const cles = Object.keys(MARCHANDS), cle = auHasard(cles), m = MARCHANDS[cle], id = auHasard(m.toujours.length ? m.toujours : m.objets);
  return { jour: G.jour + 1, cle, id, texte: `« On dit que ${m.nom} bradera ${nomRoyal(id, 2)} demain matin... »` };
}
// Au matin (après la mise en place des étals) : la rumeur se réalise
function rumeurDuBarAuMatin(G) {
  const b = G.bar;
  if (!b || !b.rumeur || b.rumeur.jour !== G.jour) return null;
  const r = b.rumeur; b.rumeur = null;
  const offre = G.etals && G.etals[r.cle] && G.etals[r.cle][r.id];
  if (!offre) return null;
  offre.prix = Math.max(1, Math.round(offre.prix * 0.65)); offre.qte += 2;
  return `La rumeur du bar était vraie : ${MARCHANDS[r.cle].nom} brade ${nomRoyal(r.id, 2)} ce matin.`;
}

// Le bilan d'une soirée JOUÉE (la scène donne ce qui s'est passé) : l'argent, la renommée, les habitués, la rumeur.
// `r` : { servis, attendus, pourboires, recette, bagarresRatees, filousRates, rumeur }
function finirSoireeJouee(G, r) {
  const b = barDe(G), paies = paiesDuSoir(G);
  const recette = Math.round(r.recette != null ? r.recette : r.servis * recetteParClient(G));
  encaisser(G, recette + (r.pourboires || 0), 'bar');
  payer(G, Math.min(paies.total, Math.max(0, G.argent)), 'salaires');
  let perte = 0;
  for (let k = 0; k < (r.filousRates || 0); k++) perte += hasard(...BAR.imprevus.perteFilou);
  if (perte) payer(G, Math.min(perte, Math.max(0, G.argent)), 'bar');
  if (r.bagarresRatees) { G.reputation -= BAR.imprevus.garde * 0.5; b.garde = G.jour + 1; }
  const part = r.attendus ? r.servis / r.attendus : 0, avant = b.renommee;
  b.renommee = Math.max(0.5, Math.min(BAR.renommee.max, b.renommee + (part >= BAR.renommee.bon ? BAR.renommee.gain : -BAR.renommee.perte)));
  b.habitues = part >= BAR.renommee.bon ? Math.min(4, (b.habitues || 0) + 1) : Math.max(0, (b.habitues || 0) - 1);
  b.soireesJouees++;
  b.soirsComplets = equipeComplete(G) ? (b.soirsComplets || 0) + 1 : 0;
  if (aEmbauche(G, 'videur')) b.videurSoirs = (b.videurSoirs || 0) + 1;
  if (r.rumeur) b.rumeur = r.rumeur;
  b.ce = { jour: G.jour, mode: 'joue' };
  b.dernier = { jour: G.jour, mode: 'joue', recette, pourboires: r.pourboires || 0, paies: paies.total, perte, renommee: b.renommee - avant, habitues: b.habitues, servis: r.servis, attendus: r.attendus, rumeur: r.rumeur ? r.rumeur.texte : null };
  b.dernier.gain = recette + (r.pourboires || 0) - paies.total - perte;
  return b.dernier;
}

// Le bar TOUT SEUL (le soir, ou à midi avec la terrasse) : de quoi payer l'équipe et gagner un peu, sans bonus.
function soireeSeule(G, midi = false) {
  const b = barDe(G), paies = paiesDuSoir(G, midi, true);
  if (!peutTournerSeul(G)) return { erreur: 'L’équipe n’est pas encore prête à tourner seule.' };
  if (!peutPayer(G, paies.total)) return { erreur: `Pas de quoi payer l'équipe (${paies.total} p.).` };
  const clients = Math.round(clientsDuSoir(G, true) * (midi ? BAR.midi.clients : 1));
  const rendement = midi ? BAR.midi.rendement : BAR.seul.rendement;
  const recette = Math.round(clients * recetteParClient(G) * rendement);
  const imp = midi ? {} : imprevusDuSoir(G), v = videurDuSoir(G, (imp.bagarre ? 1 : 0) + (imp.filou ? 1 : 0));
  let perte = 0;
  // ce que le videur rate (ou tout, sans videur) : une ardoise perdue, un peu de casse
  for (let k = 0; k < v.rates; k++) perte += hasard(...BAR.seul.perte);
  encaisser(G, recette, 'bar');
  payer(G, paies.total, 'salaires');
  if (perte) payer(G, Math.min(perte, Math.max(0, G.argent)), 'bar');
  if (aEmbauche(G, 'videur') && !midi) b.videurSoirs = (b.videurSoirs || 0) + 1;
  const res = { jour: G.jour, mode: midi ? 'midi' : 'seul', recette, paies: paies.total, perte, gain: recette - paies.total - perte, clients, videur: v };
  if (midi) b.midi = res; else { b.ce = { jour: G.jour, mode: 'seul' }; b.dernier = res; }
  return res;
}
function fermerLeBarCeSoir(G) { barDe(G).ce = { jour: G.jour, mode: 'ferme' }; return { ok: true }; }
function soireeDecidee(G) { const b = G.bar; return !!(b && b.ce && b.ce.jour === G.jour); }

// À midi (avec la terrasse) : le bar tourne seul pendant que tu es au comptoir (appelé à l'ouverture du comptoir)
function midiDuBar(G) {
  if (!barOuvert(G) || !barA(G, 'terrasse') || !peutTournerSeul(G)) return null;
  const b = barDe(G);
  if (b.midi && b.midi.jour === G.jour) return null;
  const res = soireeSeule(G, true);
  if (res.erreur) { b.midi = { jour: G.jour, mode: 'midi', ferme: true }; return `La terrasse est restée fermée à midi : ${res.erreur.charAt(0).toLowerCase() + res.erreur.slice(1)}`; }
  return `À midi, la terrasse du petit bar a tourné toute seule : ${res.clients} clients, ${res.gain >= 0 ? '+' : ''}${res.gain} p. une fois l'équipe payée.`;
}

// La nuit : le chantier se termine ; un soir où l'on n'a rien décidé, le bar reste fermé (pas de paie)
function nuitDuBar(G) {
  const b = G.bar;
  if (!b || !barOuvert(G)) return;
  if (b.chantier) { b.installations[b.chantier] = G.jour + 1; b.annonce = b.chantier; b.chantier = null; }
}
// Au matin : la nouvelle installation, la rumeur qui se réalise, la garde
function matinDuBar(G) {
  const lignes = [];
  if (!barOuvert(G)) return lignes;
  const b = barDe(G);
  if (b.annonce) {
    const i = BAR.installations.find(x => x.id === b.annonce);
    if (i) lignes.push(`Des coups de marteau toute la nuit, à côté : ${i.nom.charAt(0).toLowerCase() + i.nom.slice(1)} du petit bar est prête. ${i.effet}`);
    b.annonce = null;
  }
  const r = rumeurDuBarAuMatin(G);
  if (r) lignes.push(r);
  if (b.garde === G.jour) lignes.push('La garde est passée au bar ce matin, à cause de la bagarre d’hier soir : un petit savon, et un peu moins de réputation.');
  return lignes;
}
