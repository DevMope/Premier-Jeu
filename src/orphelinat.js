// (v1.12, planche 42 validée) L'orphelinat du Comté : la maison du paon, rachetée et donnée aux enfants.
// Les petits rendent service : (1) la liste des courses, le soir chez toi, qu'ils font au marché à l'aube ;
// (2) un coursier au comptoir, qui court chercher un objet à l'étal, au prix du marché, en un quart d'heure.
// Trois améliorations, chères (un petit axe neuf qui mange de l'argent) : le dortoir, l'école, la grande salle.
// Avec la grande salle, les grands reviennent de temps en temps en novices, amis dès le premier jour.
const ORPHELINAT = {
  enfants: ['Petit Tom', 'Mirabelle', 'Gusse', 'Lili'],
  enfantsDortoir: ['Bastien', 'Nora'],
  filles: ['Mirabelle', 'Lili', 'Nora'],
  liste: [6, 10],            // objets sur la liste des courses (sans, avec le dortoir)
  courses: [1, 2],           // courses du coursier par jour (sans, avec le dortoir)
  dureeCourse: 0.25,         // ¼ h au comptoir (rien avec l'école)
  ameliorations: [
    { id: 'dortoir', nom: 'Le dortoir', prix: 2500, effet: 'Six enfants au lieu de quatre : deux courses par jour, et la liste des courses passe à 10 objets.', decor: 'Des lits, des couvertures, un poêle.' },
    { id: 'ecole', nom: "L'école", prix: 5000, effet: 'Ils apprennent à lire et à compter : les courses ne prennent plus de temps au comptoir, et chaque matin ils rapportent une rumeur du marché.', decor: 'Une maîtresse, des ardoises, des livres.' },
    { id: 'salle', nom: 'La grande salle', prix: 9000, effet: "Les grands prennent la route : de temps en temps, un ancien de l'orphelinat vient chez toi en novice, ami dès le premier jour.", decor: 'Et le soir, une veillée où ils racontent leurs journées.' },
  ],
  reputation: 1,             // chaque amélioration bâtie (tout le Comté en parle)
  anciens: { chance: 0.12, ecart: 6, attente: 3 },   // par jour ; au moins 6 jours entre deux ; 3 jours après la grande salle
  // la maison du paon repeinte (planche 42) : l'étage au vert tendre, le bois à la place des dorures, un paillasson
  facade: { nom: 'orphelinat', enseigne: [0x5a3a1a, 0xe8d8b0, 0x3b2410], rampes: {
    bleu: [0x2a3a1e, 0x3e5a2c, 0x5a7a3c, 0x78964c, 0x96b060, 0xb8cc84],
    or: [0x3a2a10, 0x5a4020, 0x7a5a30, 0x9a7a44, 0xb89a60, 0xd8c090],
    rouge: [0x3a2a1a, 0x5a4428, 0x7a5e38, 0x9a7a4c, 0xb49664, 0xccb080],
  } },
};
POSTES.orphelinat = "L'orphelinat";

// Les grands, quand ils reviennent (l'enfant qu'ils étaient, le nom qu'ils se sont fait)
const ANCIENS_ORPHELINAT = [
  { nom: 'Tom Grandchemin', petit: 'Petit Tom', race: 'humain', feminin: false },
  { nom: 'Mirabelle Vif-Argent', petit: 'Mirabelle', race: 'hobbit', feminin: true },
  { nom: 'Gusse Pied-Léger', petit: 'Gusse', race: 'hobbit', feminin: false },
  { nom: 'Lili Brise-Lame', petit: 'Lili', race: 'humain', feminin: true },
  { nom: 'Bastien Roc', petit: 'Bastien', race: 'nain', feminin: false },
  { nom: 'Nora Plume', petit: 'Nora', race: 'elfe', feminin: true },
];
// Leur petit fil d'histoires : ce qu'ils disent à chaque visite, dans l'ordre (toujours sur l'orphelinat) ;
// une fois le fil fini, une phrase au hasard parmi celles d'après. `p` : le petit qu'il était ; `a`, `b` : deux enfants de l'orphelinat ;
// `e` : « e » si c'est une ancienne (les accords)
const FIL_DES_ANCIENS = [
  (p) => `Tu te souviens de ${p} ? J'ai grandi ! Tu nous as donné un toit ; aujourd'hui, c'est moi qui pars à l'aventure. Pour toi, patron !`,
  (p, a, b, e) => `Encore moi ! Je suis passé${e} à l'orphelinat ce matin : ${a} m'a demandé si j'avais déjà tué un dragon. Je lui ai dit « pas encore ».`,
  (p, a, b) => `À l'orphelinat, les petits jouent au « comptoir » dans la cour, avec des cailloux pour pièces. ${b} fait toujours le patron : c'est fou comme ça te ressemble.`,
  (p) => `La maîtresse dit que j'étais son pire élève et son meilleur souvenir. Je lui rapporterai quelque chose de ma prochaine mission.`,
  (p, a) => `Le soir, à la veillée de la grande salle, je raconte mes missions aux petits. ${a} veut faire comme moi. Je lui ai dit : d'abord, l'école !`,
  (p) => `J'ai vu le monde, patron. Mais il n'y a qu'un endroit où je reviens toujours : la maison verte à côté de la tienne.`,
];
const PHRASES_DES_ANCIENS = [
  (p, a) => `J'ai laissé ma vieille couverture du dortoir à ${a}. Elle est pleine de trous, mais elle porte bonheur.`,
  (p, a, b, e) => `Quand j'étais petit${e}, je regardais les aventuriers sortir de chez toi. Maintenant, c'est moi qu'on regarde !`,
  (p, a, b) => `${a} et ${b} se sont encore battus pour savoir qui ferait tes courses demain. Tu as des petits soldats, patron.`,
  (p) => `Une partie de mon butin ira à l'orphelinat. Il faut bien que quelqu'un paie les ardoises de l'école !`,
  (p) => `On m'appelait ${p}, là-bas. Ici aussi, tu peux. Mais pas devant les autres aventuriers, d'accord ?`,
  (p, a) => `${a} m'a dessiné une carte au trésor à la craie. Elle mène à la cuisine de l'orphelinat. Je la garde quand même.`,
];
// Au retour de mission : ce qu'ils disent en rentrant (réussite ou échec)
const RETOURS_DES_ANCIENS = {
  reussi: [
    (p) => `Me revoilà, patron ! Ce soir, à l'orphelinat, je vais tout raconter aux petits. Ils vont faire des yeux ronds !`,
    (p, a, b, e) => `Rentré${e} vivant${e}, et pas les mains vides ! ${a} va vouloir toucher chaque pièce, tu verras.`,
    (p, a, b, e) => `Tu vois ? ${e ? 'La petite' : 'Le petit'} ${p.replace(/^Petit /, '')} est revenu${e} en ${e ? 'héroïne' : 'héros'}. La maîtresse ne va jamais me croire.`,
  ],
  rate: [
    (p) => `Me revoilà... Ne dis rien aux petits de l'orphelinat, d'accord ? Je ne veux pas qu'ils s'inquiètent pour moi.`,
    (p, a) => `Raté, cette fois. Mais à l'orphelinat, on apprend à se relever : je repartirai. Ne le dis pas à ${a}.`,
  ],
};

function orphelinatDe(G) {
  return (G.orphelinat = G.orphelinat || { bati: {}, chantier: null, liste: null, coursesJour: 0, coursesFaites: 0, anciens: {}, dernierAncien: 0, salleLe: 0 });
}
function orphelinatOuvert(G) { return !!(G.rival && G.rival.etat === 'orphelinat'); }
function orphelinatA(G, id) { return !!(G.orphelinat && G.orphelinat.bati && G.orphelinat.bati[id]); }
function enfantsOrphelinat(G) { return ORPHELINAT.enfants.concat(orphelinatA(G, 'dortoir') ? ORPHELINAT.enfantsDortoir : []); }
function tailleListe(G) { return ORPHELINAT.liste[orphelinatA(G, 'dortoir') ? 1 : 0]; }
function coursesParJour(G) { return ORPHELINAT.courses[orphelinatA(G, 'dortoir') ? 1 : 0]; }
function dureeCourse(G) { return orphelinatA(G, 'ecole') ? 0 : ORPHELINAT.dureeCourse; }
function coursesRestantes(G) {
  if (!orphelinatOuvert(G)) return 0;
  const o = orphelinatDe(G);
  if (o.coursesJour !== G.jour) { o.coursesJour = G.jour; o.coursesFaites = 0; }
  return Math.max(0, coursesParJour(G) - o.coursesFaites);
}
// La prochaine amélioration à bâtir (dans l'ordre : le dortoir, l'école, la grande salle)
function ameliorationOrphelinat(G) { return ORPHELINAT.ameliorations.find(a => !orphelinatA(G, a.id)) || null; }

// Ce que les petits peuvent rapporter : les objets aux étals (pas le fer, le cuir, le bois), au meilleur prix
function articlesDuMarche(G, avecQte = false) {
  const vus = {};
  for (const [cle, etal] of Object.entries(G.etals || {})) for (const [id, offre] of Object.entries(etal)) {
    if (id in MATERIAUX || !ITEMS[id]) continue;
    if (avecQte && offre.qte <= 0) continue;
    const prix = prixMarchand(G, cle, id);
    if (!vus[id] || prix < vus[id].prix) vus[id] = { id, cle, prix, qte: offre.qte };
  }
  return Object.values(vus).sort((a, b) => (ITEMS[a.id].prix - ITEMS[b.id].prix) || a.id.localeCompare(b.id));
}

// Le soir : la liste (objets → nombre), aux prix d'aujourd'hui (jamais plus cher demain)
function fixerListeDesCourses(G, objets) {
  const o = orphelinatDe(G), prix = Object.fromEntries(articlesDuMarche(G).map(a => [a.id, a.prix]));
  const liste = {};
  let total = 0;
  for (const [id, n] of Object.entries(objets || {})) {
    const k = Math.min(n, tailleListe(G) - total);
    if (k > 0 && prix[id]) { liste[id] = { n: k, prix: prix[id] }; total += k; }
  }
  o.liste = total ? { jour: G.jour, objets: liste } : null;
  return total;
}

// À l'aube : les petits font les courses (après la mise en place des étals). Renvoie les lignes du matin.
function coursesDuMatin(G) {
  const o = orphelinatDe(G), L = o.liste, lignes = [];
  o.liste = null;
  if (!L || !orphelinatOuvert(G) || L.jour >= G.jour) return lignes;
  const pris = {}, manques = [], messages = [];
  let depense = 0, plein = false, sansSous = false;
  for (const [id, { n, prix }] of Object.entries(L.objets)) {
    for (let k = 0; k < n; k++) {
      const offres = Object.entries(G.etals || {}).filter(([, e]) => e[id] && e[id].qte > 0).map(([cle]) => ({ cle, p: Math.min(prix, prixMarchand(G, cle, id)) })).sort((a, b) => a.p - b.p);
      if (!offres.length) { manques.push(id); break; }
      if (stockTotal(G) >= G.capacite) { plein = true; break; }
      if (!peutPayer(G, offres[0].p)) { sansSous = true; break; }
      G.etals[offres[0].cle][id].qte--;
      G.stock[id] = (G.stock[id] || 0) + 1;
      const m = depenserChez(G, offres[0].cle, offres[0].p);
      if (m) messages.push(m);
      depense += offres[0].p;
      pris[id] = (pris[id] || 0) + 1;
    }
  }
  const [a, b] = enfantsOrphelinat(G);
  const de = id => (/^[aeéèêiîouyh]/i.test(nomRoyal(id)) ? "d'" : 'de ') + nomRoyal(id);
  if (Object.keys(pris).length) { const t = objetsRoyaux(pris); lignes.push(`${a} et ${b} sont revenus du marché avant le jour : ${t.charAt(0).toLowerCase() + t.slice(1)} (${depense} p.). Tout est sur ton comptoir.`); }
  else lignes.push(`${a} et ${b} sont revenus du marché les mains vides.`);
  if (manques.length) { const m = [...new Set(manques)].map(de); lignes.push(`Pas ${m.join(' ni ')} aux étals ce matin.`); }
  // (housekeep v1.14) ce qui n'a pas pu être pris (réserve pleine, coffre vide) reste sur la liste pour demain
  if (plein || sansSous) {
    const reste = {};
    for (const [id, { n, prix }] of Object.entries(L.objets)) { const k = n - (pris[id] || 0); if (k > 0 && !manques.includes(id)) reste[id] = { n: k, prix }; }
    if (Object.keys(reste).length) o.liste = { jour: G.jour, objets: reste };
  }
  if (plein) lignes.push('Ta réserve était pleine : ils ont gardé le reste de la liste pour demain.');
  if (sansSous) lignes.push("Il n'y avait plus assez de pièces dans le coffre pour tout acheter : le reste attend sur la liste.");
  lignes.push(...messages);
  return lignes;
}

// Avec l'école : une rumeur du marché, chaque matin (une rareté, et la meilleure affaire du jour)
function rumeurDesPetits(G) {
  if (!orphelinatOuvert(G) || !orphelinatA(G, 'ecole')) return null;
  const rares = [], affaires = [];
  for (const [cle, etal] of Object.entries(G.etals || {})) for (const [id, offre] of Object.entries(etal)) {
    if (id in MATERIAUX || !ITEMS[id] || offre.qte <= 0) continue;
    if (!MARCHANDS[cle].toujours.includes(id)) rares.push({ cle, id });
    affaires.push({ cle, id, r: prixMarchand(G, cle, id) / Math.max(1, prixDeBase(id)) });
  }
  const bouts = [];
  if (rares.length) { const r = auHasard(rares); bouts.push(`${MARCHANDS[r.cle].nom} a des ${nomRoyal(r.id, 2)} ce matin`); }
  affaires.sort((x, y) => x.r - y.r);
  if (affaires.length && affaires[0].r < 0.95) bouts.push(`les ${nomRoyal(affaires[0].id, 2)} sont bon marché chez ${MARCHANDS[affaires[0].cle].nom}`);
  if (!bouts.length) return null;
  return `Les petits de l'école ont une rumeur du marché : « ${majuscule(bouts.join(', et '))} ! »`;
}

// Le coursier, au comptoir : ce qu'il peut rapporter tout de suite (une course = un objet)
function offreDuCoursier(G) {
  const offre = {};
  for (const a of articlesDuMarche(G, true)) offre[a.id] = { prix: a.prix, qte: 1, cle: a.cle };
  return offre;
}
function courseDuCoursier(G, id, pourLeClient = false) {
  const offre = (G.etals[(offreDuCoursier(G)[id] || {}).cle] || {})[id];
  if (!offre || offre.qte <= 0) return { erreur: 'Plus rien à l’étal.' };
  if (coursesRestantes(G) <= 0) return { erreur: 'Plus de course aujourd’hui.' };
  if (!pourLeClient && stockTotal(G) >= G.capacite) return { erreur: 'Ta réserve est pleine : il n’y a nulle part où poser ça.' };
  const a = offreDuCoursier(G)[id];
  if (!peutPayer(G, a.prix)) return { erreur: manqueArgent(G, a.prix, 'Pas assez de pièces pour cette course.') };
  offre.qte--;
  orphelinatDe(G).coursesFaites++;
  orphelinatDe(G).coursesTotal = (orphelinatDe(G).coursesTotal || 0) + 1;   // (v1.50) pour le succès « Les petites mains »
  const message = depenserChez(G, a.cle, a.prix);
  return { ok: true, prix: a.prix, message };
}

// Bâtir la prochaine amélioration : payée tout de suite, bâtie dans la nuit
function batirOrphelinat(G) {
  const a = ameliorationOrphelinat(G), o = orphelinatDe(G);
  if (!a || !orphelinatOuvert(G)) return { erreur: 'Rien à bâtir.' };
  if (o.chantier) return { erreur: 'Les ouvriers sont déjà à l’ouvrage.' };
  if (!peutPayer(G, a.prix)) return { erreur: manqueArgent(G, a.prix, `Il te manque ${a.prix - Math.floor(G.argent)} pièces.`) };
  payer(G, a.prix, 'orphelinat');
  o.chantier = a.id;
  return { ok: true, amelioration: a };
}

// La nuit : le chantier se termine
function nuitDeLOrphelinat(G) {
  const o = G.orphelinat;
  if (!o || !o.chantier || !orphelinatOuvert(G)) return;
  const a = ORPHELINAT.ameliorations.find(x => x.id === o.chantier);
  o.bati[o.chantier] = G.jour + 1;
  if (o.chantier === 'salle') o.salleLe = G.jour + 1;
  o.chantier = null;
  G.reputation += ORPHELINAT.reputation;
  o.annonce = a ? a.nom : null;
}
// Au matin : la nouvelle amélioration, les courses, la rumeur
function matinDeLOrphelinat(G) {
  const lignes = [];
  if (!orphelinatOuvert(G)) return lignes;
  const o = orphelinatDe(G);
  if (o.annonce) {
    const a = ORPHELINAT.ameliorations.find(x => x.nom === o.annonce);
    lignes.push(`Des coups de marteau toute la nuit, à côté : ${o.annonce.charAt(0).toLowerCase() + o.annonce.slice(1)} de l'orphelinat est bâti${a && a.id === 'ecole' ? 'e' : a && a.id === 'salle' ? 'e' : ''} (+${ORPHELINAT.reputation} de réputation). ${a ? a.effet : ''}`);
    if (!G.annonceRival) G.annonceRival = `À l'orphelinat de la Comté, ${o.annonce.charAt(0).toLowerCase() + o.annonce.slice(1)} est terminé${a && a.id !== 'dortoir' ? 'e' : ''}, grâce à « ${G.nomShop} ».`;
    o.annonce = null;
  }
  lignes.push(...coursesDuMatin(G));
  const r = rumeurDesPetits(G);
  if (r) lignes.push(r);
  return lignes;
}

// Avec la grande salle : un ancien de l'orphelinat dans la file, de temps en temps
function ancienDuJour(G, file = []) {
  if (!orphelinatOuvert(G) || !orphelinatA(G, 'salle')) return null;
  const o = orphelinatDe(G), A = ORPHELINAT.anciens;
  if (G.jour < (o.salleLe || 0) + A.attente || G.jour - (o.dernierAncien || 0) < A.ecart || Math.random() > A.chance) return null;
  const enfants = enfantsOrphelinat(G);
  const morts = Object.entries(G.personnes || {}).filter(([, p]) => p.mort || p.banni).map(([n]) => n);
  for (const h of G.historique || []) if (h.issue === 'valeureux' || h.issue === 'sans gloire') morts.push(h.nom);
  const pris = [...nomsActifs(G), ...morts, ...file.map(e => e.voyageur && e.voyageur.nom).filter(Boolean)];
  const libres = ANCIENS_ORPHELINAT.filter(a => enfants.includes(a.petit) && !pris.includes(a.nom));
  if (!libres.length) return null;
  const a = auHasard(libres);
  o.dernierAncien = G.jour;
  const v = creerVoyageur(G, { nom: a.nom, race: a.race, feminin: a.feminin, niveau: 'novice' });
  v.ancienOrphelinat = a.petit;
  if (!G.relations) G.relations = {};
  if ((G.relations[a.nom] || 0) < 8) G.relations[a.nom] = 8;   // ami dès le premier jour
  return { type: 'client', voyageur: v };
}
function estAncien(G, nom) { return ANCIENS_ORPHELINAT.find(a => a.nom === nom) || null; }
// Ce qu'il dit en arrivant (son fil d'histoires, puis une phrase sur l'orphelinat au hasard)
function enfantsPourAncien(G, a) { const e = enfantsOrphelinat(G).filter(n => n !== a.petit); return [a.petit, e[0] || 'Mirabelle', e[1] || 'Gusse', a.feminin ? 'e' : '']; }
function bonjourDeLAncien(G, v) {
  const a = estAncien(G, v.nom);
  if (!a || !G.orphelinat) return null;
  const o = G.orphelinat, n = o.anciens[a.nom] || 0;
  if (o.vuLe && o.vuLe[a.nom] === G.jour) return null;
  o.anciens[a.nom] = n + 1;
  o.vuLe = o.vuLe || {}; o.vuLe[a.nom] = G.jour;
  const ligne = n < FIL_DES_ANCIENS.length ? FIL_DES_ANCIENS[n] : auHasard(PHRASES_DES_ANCIENS);
  return ligne(...enfantsPourAncien(G, a));
}
function retourDeLAncien(G, v, echec) {
  const a = estAncien(G, v.nom);
  if (!a || !G.orphelinat) return null;
  return auHasard(RETOURS_DES_ANCIENS[echec ? 'rate' : 'reussi'])(...enfantsPourAncien(G, a));
}
