// (v0.98, planches 27 et 28) Le marché noir toute l'année : la caisse du Passeur (contrebande à
// revendre, saisie et amende sévère si la garde passe), les paris de la fosse, le bras de fer de
// Mog, le coin bar de Mère Nok « Au Gobelet Fêlé » et les contrats de l'ombre.

const OMBRE_ANNEE = {
  caisse: { remise: 0.62, objets: [9, 14], risque: 0.08, amende: 2.5 },   // ~40 % moins cher ; l'amende : 2,5 fois son prix
  fosse: { mise: [5, 30], risque: 0.03 },
  verre: 3,
  contrat: { chance: 0.55, debut: 10, risqueEchec: 0.5, mort: 0.4 },
};

// Ce que contient une caisse « tombée d'une charrette » : des provisions ordinaires, parfois une arme
const CONTENU_CAISSE = ['ration', 'ration', 'ration', 'corde', 'gourde', 'torche', 'torche', 'bandage', 'potion', 'cape', 'epee', 'antidote'];

// Les deux combattants de la fosse, ce soir (des Bannis costauds)
const COMBATTANTS_FOSSE = [
  ['Mog Poing-de-Fer', 'orc'], ['Krug Briseur', 'orc'], ['Bourk', 'troll'], ['Grôm Pied-de-Roc', 'troll'],
  ['Varek Croc-Gris', 'loupgarou'], ['Ugra la Rouge', 'orc', true], ['Sauvagine', 'loupgarou', true], ['Bruma Mâche-Pierre', 'troll', true],
];
// Ce que le flair laisse deviner d'un combattant (vrai ou trompeur, selon ton expérience)
const INDICES_FOSSE = {
  faible: ['boite un peu en entrant dans la fosse', 'cache mal un bandage sous son bras', 'a le regard qui fuit', 'respire trop vite avant même le premier coup'],
  fort: ['fait craquer ses épaules sans quitter l\'autre des yeux', 'a les poings encore rouges du combat d\'hier... qu\'il a gagné', 'sourit, et ce n\'est pas bon signe pour l\'autre', 'n\'a pas une égratignure'],
};

// Les contrats de l'ombre : un Banni s'accoude au bar et pose un pli scellé
const CONTRATS_OMBRE = [
  { titre: 'La cargaison de sel noir', texte: "Trois charrettes de sel noir passent le Col des Pendus. La garde les escorte. J'ai besoin de quelqu'un qui ne pose pas de questions.", kit: ['corde', 'epee', 'ration'], danger: 4, paie: [200, 240] },
  { titre: 'Le registre du percepteur', texte: "Le percepteur garde un registre de toutes les familles bannies. Je veux qu'il brûle. Le registre, hein. Pas le percepteur.", kit: ['torche', 'corde', 'ration'], danger: 3, paie: [150, 190] },
  { titre: 'Le passage du gué', texte: "Une famille doit traverser le gué avant l'aube, sans que les patrouilles la voient. Il faut un guide qui sait se taire.", kit: ['gourde', 'torche', 'ration'], danger: 2, paie: [110, 140] },
  { titre: 'La relique de la crypte', texte: "Dans la crypte des Gardiens dort une relique qui appartenait à mon peuple. On va la reprendre.", kit: ['torche', 'antidote', 'epee'], danger: 5, paie: [240, 280] },
  { titre: 'Le chariot de la Confrérie', texte: "Un chariot de la Confrérie transporte des armes vers la frontière. Il serait dommage qu'il arrive.", kit: ['epee', 'bandage', 'ration'], danger: 4, paie: [190, 230] },
  { titre: 'Le message pour la colline', texte: "Un pli doit atteindre les loups de la colline. Les routes sont surveillées. Prends les chemins de traverse.", kit: ['cape', 'gourde', 'ration'], danger: 2, paie: [100, 130] },
];

// Les rumeurs de Mère Nok (contre un verre)
const RUMEURS_BAR = [
  "Le Passeur ? Il n'a jamais dit son vrai nom. Même pas à moi. Et pourtant je lui sers à boire depuis vingt ans.",
  "Mog n'a perdu qu'une fois au bras de fer. Contre une vieille naine. Il ne veut pas qu'on en parle.",
  "Dans la fosse, regarde les pieds, pas les poings. Celui qui recule le premier finit par terre.",
  "La Main Noire paie bien. Elle fait payer encore mieux.",
  "Les gardes boivent ici aussi, parfois. Sans leur tabard. Je les sers quand même : l'argent n'a pas de camp.",
  "Il paraît que le Grand Sage avait un chat. Un chat qui fumait. Bah, les ivrognes racontent n'importe quoi.",
];

// La soirée du marché noir : la caisse, le combat de la fosse, le contrat (tirés une fois par soir)
function soireeAnnee(G) {
  const s = soireeMarcheNoir(G);
  if (s.annee) return s.annee;
  const n = hasard(...OMBRE_ANNEE.caisse.objets), contenu = {};
  for (let i = 0; i < n; i++) { const id = auHasard(CONTENU_CAISSE); contenu[id] = (contenu[id] || 0) + 1; }
  const valeur = Object.entries(contenu).reduce((t, [id, q]) => t + prixDeBase(id) * q, 0);
  const caisse = { contenu, valeur, prix: Math.max(8, Math.round(valeur * OMBRE_ANNEE.caisse.remise)), achetee: false };
  // le combat : deux combattants, une force cachée, des cotes qui en dépendent
  const [a, b] = Phaser.Utils.Array.Shuffle([...COMBATTANTS_FOSSE]).slice(0, 2).map(([nom, race, feminin]) => ({ nom, race, feminin: !!feminin, force: hasard(4, 9) }));
  const pa = a.force / (a.force + b.force);
  const cote = p => Math.max(1.5, Math.round(0.9 / p * 2) / 2);
  const combat = { a, b, cotes: [cote(pa), cote(1 - pa)], pari: null, fini: false };
  // le contrat : certains soirs seulement, à partir du jour 10
  let contrat = null;
  if (G.jour >= OMBRE_ANNEE.contrat.debut && Math.random() < OMBRE_ANNEE.contrat.chance) {
    const c = auHasard(CONTRATS_OMBRE), race = auHasard(PEUPLES_OMBRE), [nom, feminin] = auHasard(NOMS[race]);
    contrat = { ...c, banni: { nom, race, feminin, niveau: 'veteran' }, paie: hasard(...c.paie), niveauMin: c.danger >= 4 ? 'veteran' : 'aguerri', duree: 2, pris: false };
  }
  s.annee = { caisse, combat, contrat, brasDeFer: {}, verres: 0 };
  return s.annee;
}

// --- La caisse du Passeur ---
function acheterCaisse(G) {
  const c = soireeAnnee(G).caisse;
  if (c.achetee) return 'Le Passeur n\'a qu\'une caisse par soir.';
  if (G.caisse) return 'Tu as déjà une caisse cachée chez toi.';
  if (!peutPayer(G, c.prix)) return manqueArgent(G, c.prix, "Pas assez d'argent.");
  payer(G, c.prix, 'marcheNoir');
  c.achetee = true;
  G.caisse = { jour: G.jour, contenu: { ...c.contenu }, prix: c.prix };
  soireeMarcheNoir(G).risque += OMBRE_ANNEE.caisse.risque;
  return null;
}
function texteContenu(contenu) {
  return Object.entries(contenu).map(([id, n]) => { if (typeof NOMS_ROYAUX !== 'undefined' && NOMS_ROYAUX[id]) return `${n} ${NOMS_ROYAUX[id][n > 1 ? 1 : 0]}`; const nom = nomObjet(id).toLowerCase(); return `${n} ${n > 1 ? nom.split(' ').map(w => /^(de|du|des)$/.test(w) || /[sx]$/.test(w) ? w : w + 's').join(' ') : nom}`; }).join(', ');
}

// La nuit : si la garde vient demain, la caisse reste cachée (et sera trouvée) ; sinon, on la déballe
// dans la réserve, prête à être revendue au comptoir.
function deballerCaisse(G) {
  const c = G.caisse;
  if (!c) return null;
  G.caisse = null;
  let places = Math.max(0, G.capacite - stockTotal(G)), perdus = 0;
  for (const [id, n] of Object.entries(c.contenu)) for (let i = 0; i < n; i++) { if (places > 0) { G.stock[id] = (G.stock[id] || 0) + 1; places--; } else perdus++; }
  // (ce qui ne rentre pas, le Passeur le reprend au prix payé)
  const total = Object.values(c.contenu).reduce((a, n) => a + n, 0), rendu = perdus ? Math.round(c.prix * perdus / total) : 0;
  if (rendu) encaisser(G, rendu, 'marcheNoir');
  return `Tu déballes la caisse du Passeur dans ta réserve : ${texteContenu(c.contenu)}.${perdus ? ` (Ta réserve est pleine : ${perdus} objet${perdus > 1 ? 's' : ''} retourne${perdus > 1 ? 'nt' : ''} au Passeur, qui te rend ${rendu} p.)` : ''}`;
}

// --- Les paris de la fosse ---
// L'indice du flair : plus tu as d'expérience, plus il dit vrai
function indiceFosse(G) {
  const cb = soireeAnnee(G).combat;
  if (cb.indice) return cb.indice;
  const fort = cb.a.force >= cb.b.force ? cb.a : cb.b, faible = fort === cb.a ? cb.b : cb.a;
  const juste = Math.random() < 0.55 + niveauFlair(G) * 0.35;
  const [vise, sens] = Math.random() < 0.5 ? [juste ? faible : fort, 'faible'] : [juste ? fort : faible, 'fort'];
  cb.indice = `${prenomDe(vise.nom)} ${auHasard(INDICES_FOSSE[sens])}.`;
  return cb.indice;
}

// Parier : la mise est payée, le combat est tiré tout de suite (la scène le joue ensuite).
// Renvoie { erreur } ou { gagnant, fin, gain, coups }.
function parierFosse(G, cote, mise) {
  const cb = soireeAnnee(G).combat;
  if (cb.pari) return { erreur: 'Tu as déjà parié ce soir.' };
  if (tropJeunePourParier(G)) return { erreur: "Le bookmaker te toise : « Les paris, c'est à dix-huit ans. Regarde le combat si tu veux, mais garde tes sous. »" };
  if (!peutPayer(G, mise)) return { erreur: manqueArgent(G, mise, "Pas assez d'argent.") };
  payer(G, mise, 'jeux');
  const pa = cb.a.force / (cb.a.force + cb.b.force);
  let gagnant = Math.random() < pa ? 0 : 1;
  // la fin du combat : le K.O. n'est pas systématique
  const r = Math.random();
  const fin = r < 0.42 ? 'ko' : r < 0.67 ? 'points' : r < 0.82 ? 'abandon' : r < 0.94 ? 'arbitre' : 'coupBas';
  // (le coup bas : celui qui frappe sous la ceinture est disqualifié, l'autre gagne)
  const tricheur = fin === 'coupBas' ? 1 - gagnant : null;
  // les échanges : qui touche, qui esquive (le gagnant touche un peu plus souvent)
  const n = fin === 'ko' ? hasard(4, 6) : hasard(5, 7);
  const coups = [];
  for (let i = 0; i < n; i++) coups.push({ qui: Math.random() < 0.58 ? gagnant : 1 - gagnant, touche: Math.random() < 0.7 });
  cb.pari = { cote, mise };
  cb.resultat = { gagnant, fin, tricheur, coups };
  const gain = gagnant === cote ? Math.round(mise * cb.cotes[cote]) : 0;
  if (gain) encaisser(G, gain, 'jeux');
  cb.resultat.gain = gain;
  soireeMarcheNoir(G).risque += OMBRE_ANNEE.fosse.risque;
  return cb.resultat;
}

// --- Le bras de fer (toute l'année) : trois adversaires de plus en plus forts ---
// On débloque le suivant en battant le précédent. `pousse` : la force avec laquelle il ramène ton
// bras (par seconde) ; `vert` : la zone où il faut cliquer ; `balayage` : le temps d'un aller du repère.
const ADVERSAIRES_BRAS = [
  { id: 'grisk', nom: 'Grisk Mâche-Clou', race: 'gobelin', titre: 'le gobelin', mise: 5, pousse: 0.06, vert: [0.34, 0.66], balayage: 0.7, niveau: 'aguerri',
    defi: "Grisk grimpe sur un tonneau pour être à ta hauteur : « Moi, petit, mais moi nerveux ! Cinq pièces que je te plie le bras ! »",
    victoire: "Le bras de Grisk claque sur la table. Il secoue sa main en couinant : « Triché ! Tu as triché ! » Toute la cave rit... de lui.",
    defaite: "Grisk te plaque le bras avec un cri de victoire et danse sur son tonneau. « Personne ne bat Grisk ! Personne ! »" },
  { id: 'mog', nom: 'Mog Poing-de-Fer', race: 'orc', titre: "l'orc", mise: 10, pousse: 0.09, vert: [0.38, 0.62], balayage: 0.6, niveau: 'veteran',
    defi: "Mog fait craquer ses doigts : « Assieds-toi, marchand. Clique en rythme quand le repère passe dans le vert. Chaque coup manqué, je reprends l'avantage. »",
    victoire: "BAM ! Le poing de Mog touche la table. La cave explose de rire et d'applaudissements. Mog te tend la main : « Pas mal, pour un marchand. »",
    defaite: "Mog plaque ton bras sur la table sans forcer. Quelques rires... Il te tape sur l'épaule : « Reviens quand tu auras mangé ta soupe. »" },
  { id: 'bourk', nom: 'Bourk', race: 'troll', titre: 'le troll', mise: 20, pousse: 0.12, vert: [0.42, 0.58], balayage: 0.5, niveau: 'veteran',
    defi: "La table craque quand Bourk y pose le coude. Sa main avale la tienne jusqu'au poignet. « Bourk pas méchant. Bourk juste... fort. »",
    victoire: "Impossible... et pourtant : le bras de Bourk touche la table, qui se fend en deux ! Silence. Puis Bourk éclate d'un rire énorme : « Toi, ami de Bourk ! »",
    defaite: "Bourk pose ton bras sur la table aussi doucement qu'une feuille morte. « Bourk a gagné. Toi pas pleurer. »" },
];
function adversaireBras(id) { return ADVERSAIRES_BRAS.find(a => a.id === id) || ADVERSAIRES_BRAS[1]; }
function brasDeFerDe(G) {
  const b = G.brasDeFer = G.brasDeFer || { victoires: {}, defaites: 0 };
  if (typeof b.victoires === 'number') b.victoires = { mog: b.victoires };   // (les parties de la v0.98 : Mog seul)
  return b;
}
// Battre le précédent ouvre le suivant
function brasDebloque(G, id) {
  const i = ADVERSAIRES_BRAS.findIndex(a => a.id === id);
  return i <= 0 || (brasDeFerDe(G).victoires[ADVERSAIRES_BRAS[i - 1].id] || 0) > 0;
}
// Chacun pousse un peu plus fort à chaque fois que tu l'as battu
function forceAdversaire(G, id) { const a = adversaireBras(id); return a.pousse + Math.min(0.04, (brasDeFerDe(G).victoires[id] || 0) * 0.01); }
function commencerBrasDeFer(G, id = 'mog') {
  const s = soireeAnnee(G), a = adversaireBras(id);
  if (typeof s.brasDeFer !== 'object' || !s.brasDeFer) s.brasDeFer = {};
  if (!brasDebloque(G, id)) return `${prenomDe(a.nom)} ne s'assoit qu'en face de ceux qui ont battu ${prenomDe(ADVERSAIRES_BRAS[ADVERSAIRES_BRAS.indexOf(a) - 1].nom)}.`;
  if (s.brasDeFer[id]) return `${prenomDe(a.nom)} se masse le bras : « Une fois par soir, l'ami. Reviens une autre fois. »`;
  if (!peutPayer(G, a.mise)) return manqueArgent(G, a.mise, "Pas assez d'argent.");
  payer(G, a.mise, 'jeux');
  s.brasDeFer[id] = true;
  return null;
}
function finirBrasDeFer(G, gagne, id = 'mog') {
  const b = brasDeFerDe(G), a = adversaireBras(id);
  if (gagne) { b.victoires[id] = (b.victoires[id] || 0) + 1; encaisser(G, a.mise * 2, 'jeux'); changerRelation(G, a.nom, 2); G.respectBannis = (G.respectBannis || 0) + 1; }
  else { b.defaites++; changerRelation(G, a.nom, 1); }
}

// --- Le coin bar de Mère Nok ---
function boireUnVerre(G) {
  const s = soireeAnnee(G);
  if (!peutPayer(G, OMBRE_ANNEE.verre)) return { erreur: manqueArgent(G, OMBRE_ANNEE.verre, "Pas assez d'argent.") };
  payer(G, OMBRE_ANNEE.verre, 'marcheNoir');
  s.verres++;
  changerRelation(G, 'Mère Nok', 1);
  if (s.verres > 2) return { texte: typeof ageJoueur === 'function' && ageJoueur(G) < 18 ? "« Encore un jus ? Tu vas finir avec les dents violettes, mon petit. » Elle te ressert quand même." : "« Encore un ? Tu vas finir sous le comptoir, mon petit. » Elle te ressert quand même." };
  // le premier verre : un bon tuyau, parfois (la garde qui viendra demain, la caisse du soir...)
  if (s.verres === 1 && G.gardeDemain) return { texte: "Mère Nok se penche : « Un conseil gratuit avec ton verre : la garde a reçu une plainte. Ils passeront chez toi demain. Range tes affaires. »" };
  if (s.verres === 1 && Math.random() < 0.4) return { texte: `Mère Nok essuie un verre : « Ce soir, dans la fosse... ${indiceFosse(G)} Moi, je dis ça... »` };
  return { texte: `Mère Nok : « ${auHasard(RUMEURS_BAR)} »` };
}

// --- Les contrats de l'ombre ---
// Ceux qui peuvent partir : les habitués libres, du niveau demandé
function candidatsContrat(G, c) {
  const min = ORDRE_NIVEAUX.indexOf(c.niveauMin);
  const occupes = new Set(nomsActifs(G));   // (v1.07 : pas ceux qui sont déjà en mission, dans la file ou attendus)
  return (G.habitues || []).filter(h => ORDRE_NIVEAUX.indexOf(h.niveau || 'novice') >= min && !(h.convalescence > G.jour && h.blessures > 0) && !occupes.has(h.nom) && !(G.personnes[h.nom] || {}).mort);
}
function kitManquant(G, c) { return c.kit.filter(id => !(G.stock[id] > 0)); }
function chanceContrat(c, h) {
  return Math.max(0.25, Math.min(0.9, 0.62 + 0.08 * ORDRE_NIVEAUX.indexOf(h.niveau || 'novice') - 0.07 * c.danger));
}
function accepterContrat(G, nom) {
  const c = soireeAnnee(G).contrat;
  if (!c || c.pris) return 'Plus de contrat ce soir.';
  const h = candidatsContrat(G, c).find(x => x.nom === nom);
  if (!h) return 'Cet aventurier ne peut pas partir.';
  const manque = kitManquant(G, c);
  if (manque.length) return `Il te manque : ${manque.map(id => nomObjet(id).toLowerCase()).join(', ')}.`;
  for (const id of c.kit) G.stock[id]--;
  G.habitues = G.habitues.filter(x => x !== h);   // (parti pour deux jours : il ne vient pas au comptoir)
  G.contrats = [...(G.contrats || []), { titre: c.titre, banni: c.banni, paie: c.paie, danger: c.danger, h, depart: G.jour, retour: G.jour + c.duree, chance: chanceContrat(c, h) }];
  c.pris = true;
  return null;
}

// Les nouvelles de la nuit : la caisse, les contrats qui rentrent. Appelé juste après G.jour++.
function nuitOmbreAnnee(G) {
  const lignes = [];
  if (G.caisse && !G.gardeDemain) { const l = deballerCaisse(G); if (l) lignes.push(l); }
  for (const k of (G.contrats || []).filter(x => x.retour <= G.jour)) {
    const prenom = prenomDe(k.h.nom);
    if (Math.random() < k.chance) {
      encaisser(G, k.paie, 'contrats');
      if (typeof pieceContrat === 'function' && pieceContrat(G)) lignes.push(`${prenom} rapporte aussi un vieil écu cabossé, aux armes des Bannis : il ira dans ta vitrine.`);
      pencher(G, 'missionO', { qui: k.h.nom });
      changerRelation(G, k.banni.nom, 3); changerRelation(G, k.h.nom, 1);
      G.habitues.push(k.h);
      lignes.push(`Contrat de l'ombre : ${prenom} est rentré${k.h.feminin ? 'e' : ''} de « ${k.titre} ». ${k.banni.nom} a laissé ${k.paie} pièces sous ta porte.`);
    } else if (Math.random() < OMBRE_ANNEE.contrat.mort) {
      G.reputation -= PERTE_MORT.sansGloire * 0.5;
      // (v1.07) mort pour de bon : son nom ne reviendra plus, et on pourra lui allumer une lanterne aux Brumes
      connaitre(G, k.h).mort = true;
      G.historique.unshift({ nom: k.h.nom, race: k.h.race, feminin: !!k.h.feminin, quete: `Contrat de l'ombre : ${k.titre}`, zone: null, depart: k.depart || k.retour - 2, retour: G.jour, issue: 'sans gloire', gain: 0, chance: k.chance });
      G.historique = G.historique.slice(0, TAILLE_HISTORIQUE);
      lignes.push(`Contrat de l'ombre : ${prenom} n'est pas revenu${k.h.feminin ? 'e' : ''} de « ${k.titre} ». Personne ne parlera ${k.h.feminin ? 'd\'elle' : 'de lui'}. Pas même ${k.banni.nom}.`);
    } else {
      k.h.blessures = Math.max(1, k.h.blessures || 0); k.h.convalescence = G.jour + CONVALESCENCE_PAR_COEUR;
      G.habitues.push(k.h);
      lignes.push(`Contrat de l'ombre : « ${k.titre} » a mal tourné. ${prenom} est rentré${k.h.feminin ? 'e' : ''} blessé${k.h.feminin ? 'e' : ''}, les mains vides.`);
      if (Math.random() < OMBRE_ANNEE.contrat.risqueEchec) { G.gardeDemain = true; lignes.push('Et la garde se souvient des visages : elle passera sans doute bientôt.'); }
    }
  }
  G.contrats = (G.contrats || []).filter(x => x.retour > G.jour);
  return lignes;
}
