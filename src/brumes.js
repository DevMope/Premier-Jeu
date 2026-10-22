// (v1.01, lot B-3b) La Nuit des Brumes : « la nuit des ancêtres », les 26, 27 et 28 des Brumes, au marché
// noir (si on le connaît). La porte dérobée reste ouverte les trois soirs (pas de mot de passe) ; la cave
// est pleine de lanternes rouges pour honorer les ancêtres, un grand feu au milieu. On y trouve : les
// osselets (contre un gobelin qui triche un peu, que le flair peut démasquer), les atours des ancêtres,
// l'hydromel noir et le pain de cendre (le grand soir), les lanternes pour ses morts, l'histoire du
// Passeur et, la première année, le discours de Garrick. Plus on penche vers la lumière, plus l'accueil
// est forcé (et plus le gobelin triche).

const BRUMES = {
  osselets: { mise: 5, relance: 3, parties: 3, triche: 0.25, tricheLumiere: 0.2, flairMin: 0.15 },
  hydromel: { relation: 2, retard: 1 },   // (la boutique ouvre une heure plus tard le lendemain)
  lanternes: {
    basse: { nom: 'une lanterne de papier', prix: 4, convient: 0.15 },
    moyenne: { nom: 'une lanterne de soie', prix: 12, convient: 0.85 },
    belle: { nom: "la grande lanterne d'or et ses feux", prix: 40, convient: 0.5 },
    reputation: 0.5, sansHommage: 0.3,
  },
};

// Les atours des ancêtres : on s'habille « comme eux », pour qu'ils reconnaissent les vivants
const ATOURS_ANCETRES = ['masqueOs', 'chaleBrume', 'lanterneCeinture'];
Object.assign(GARDE_ROBE, {
  masqueOs: { fete: 'brumes', nom: "Masque d'os ancestral", prix: 18, effet: "Pendant la Nuit des Brumes : les clients de l'ombre t'en aiment un peu plus (+1 de relation)." },
  chaleBrume: { fete: 'brumes', nom: 'Châle de brume', prix: 22, effet: "Pendant la Nuit des Brumes : les clients de l'ombre t'en aiment un peu plus (+1 de relation)." },
  lanterneCeinture: { f: true, fete: 'brumes', nom: 'Petite lanterne rouge de ceinture', prix: 12, effet: "Pendant la Nuit des Brumes : les clients de l'ombre t'en aiment un peu plus (+1 de relation)." },
});
// Le pain de cendre, rapporté du grand feu : donné à un aventurier qui part en terre d'ombre, il le
// fait rebrousser chemin au lieu de mourir (une fois)
Object.assign(CADEAUX, { painCendre: { nom: 'Pain de cendre', prix: 0, lot: true } });

// La Nuit des Brumes ce jour-là (et le marché noir connu) ?
function brumesActives(G, jour = G.jour) {
  if (!feteOuverte('brumes') || G.visiteMarcheNoir === undefined) return false;
  const f = feteDuJour(G, jour);
  return !!(f && f.id === 'brumes');
}
function etatBrumes(G) {
  const an = dateDuJour(G).an;
  if (!G.brumes || G.brumes.an !== an) G.brumes = { an, osselets: {}, hydromel: false, pain: false, lanternes: [], hommage: false, garrick: false, passeur: false };
  return G.brumes;
}
// Le grand soir (le 27) : l'hydromel, le pain, Garrick
function grandSoirBrumes(G) { const f = brumesActives(G) ? feteDuJour(G) : null; return !!(f && f.jour === 1); }
// L'accueil : forcé si l'on penche vers la lumière
function accueilBrumes(G) {
  const p = palierCamp(G);
  if (p <= -1) return "Les Bannis t'ouvrent le cercle autour du feu : « Te voilà, l'ami ! Une place pour toi, ce soir. »";
  if (p >= 1) return "Les conversations s'arrêtent quand tu entres. Un orc finit par hocher la tête : « Ce soir, tout le monde est le bienvenu. Même toi. » On te laisse une place... au bord.";
  return "Le Passeur t'accueille d'un signe de tête : « La porte reste ouverte trois soirs. Entre, et honore les tiens. »";
}

// --- Les osselets : cinq osselets chacun, une relance, des mises ; on compare les coups ---
function partiesOsseletsRestantes(G) { return BRUMES.osselets.parties - (etatBrumes(G).osselets[G.jour] || 0); }
function lancerOsselets(n = 5) { return Array.from({ length: n }, () => 1 + Math.floor(Math.random() * 6)); }
// La valeur d'un coup : la somme, plus les paires, brelans, carrés et cinq pareils
function valeurOsselets(des) {
  const c = {}; for (const d of des) c[d] = (c[d] || 0) + 1;
  let bonus = 0; for (const n of Object.values(c)) bonus += n === 2 ? 2 : n === 3 ? 6 : n === 4 ? 12 : n === 5 ? 20 : 0;
  return des.reduce((a, b) => a + b, 0) + bonus;
}
function nomCoup(des) {
  const n = Math.max(...Object.values(des.reduce((c, d) => (c[d] = (c[d] || 0) + 1, c), {})));
  return n === 5 ? 'cinq pareils !' : n === 4 ? 'un carré' : n === 3 ? 'un brelan' : n === 2 ? 'une paire' : 'rien de spécial';
}
function commencerOsselets(G) {
  if (!brumesActives(G)) return "Les osselets ne roulent que pendant la Nuit des Brumes.";
  if (tropJeunePourParier(G)) return "Grik referme sa main griffue : « Les osselets, c'est pour les grands. Reviens à dix-huit ans, l'ami. »";
  if (partiesOsseletsRestantes(G) <= 0) return "Grik range ses osselets : « Trois parties par soir, l'ami. Reviens demain. »";
  if (!peutPayer(G, BRUMES.osselets.mise)) return manqueArgent(G, BRUMES.osselets.mise, "Pas assez d'argent pour la mise.");
  payer(G, BRUMES.osselets.mise, 'fete');
  const s = etatBrumes(G); s.osselets[G.jour] = (s.osselets[G.jour] || 0) + 1;
  const triche = Math.random() < BRUMES.osselets.triche + (palierCamp(G) >= 1 ? BRUMES.osselets.tricheLumiere : 0);
  const flair = triche && Math.random() < Math.max(BRUMES.osselets.flairMin, niveauFlair(G));
  return { joueur: lancerOsselets(), gobelin: lancerOsselets(), mise: BRUMES.osselets.mise, relance: false, triche, flair, finie: false };
}
// Le gobelin joue à son tour : il relance ses plus petits osselets, puis triche s'il en a envie (un osselet
// « sorti de sa manche » remplace le plus petit par un six)
function jeuGobelin(p) {
  const des = [...p.gobelin].sort((a, b) => a - b);
  const valeur = valeurOsselets(des);
  if (valeur < 20) for (let k = 0; k < 2; k++) des[k] = 1 + Math.floor(Math.random() * 6);
  if (p.triche) { des.sort((a, b) => a - b); des[0] = 6; }
  p.gobelin = des;
}
// Fin de la partie : 'montrer' (on compare), 'coucher' (on perd la mise), 'denoncer' (la triche démasquée)
function finirOsselets(G, p, choix) {
  p.finie = true;
  if (choix === 'coucher') return { gain: 0, texte: 'Tu te couches. Grik ramasse la mise en ricanant.' };
  if (choix === 'denoncer') {
    if (!p.triche) { changerRelation(G, 'Grik le Rusé', -1); return { gain: 0, texte: "Tu l'accuses... mais sa manche est vide. Toute la tablée te regarde de travers. Tu perds ta mise." }; }
    const gain = p.mise * 3; encaisser(G, gain, 'fete'); changerRelation(G, 'Grik le Rusé', 1);
    return { gain, texte: `Tu attrapes sa manche : un osselet en tombe ! Les Bannis éclatent de rire. Grik te paie trois fois la mise (${gain} p.) et te tape dans le dos : « Toi, tu as l'œil. »` };
  }
  jeuGobelin(p);
  const a = valeurOsselets(p.joueur), b = valeurOsselets(p.gobelin);
  if (a > b) { const gain = p.mise * 2; encaisser(G, gain, 'fete'); return { gain, gagne: true, texte: `Ton coup (${nomCoup(p.joueur)}, ${a}) bat le sien (${nomCoup(p.gobelin)}, ${b}). Tu remportes ${gain} p. !` }; }
  if (a === b) { encaisser(G, p.mise, 'fete'); return { gain: p.mise, texte: `Égalité (${a} partout) : chacun reprend sa mise.` }; }
  return { gain: 0, texte: `Son coup (${nomCoup(p.gobelin)}, ${b}) bat le tien (${nomCoup(p.joueur)}, ${a}). Grik empoche la mise.` + (p.triche ? " (Il avait l'air bien content de lui...)" : '') };
}
function miserPlus(G, p) {
  if (!peutPayer(G, BRUMES.osselets.mise)) return manqueArgent(G, BRUMES.osselets.mise, "Pas assez d'argent pour miser plus.");
  if (p.mise >= BRUMES.osselets.mise * 3) return 'La mise est déjà au plus haut.';
  payer(G, BRUMES.osselets.mise, 'fete'); p.mise += BRUMES.osselets.mise;
  // devant une grosse mise, le gobelin se couche parfois (s'il ne triche pas)
  if (!p.triche && valeurOsselets(p.gobelin) < 18 && Math.random() < 0.35) { p.finie = true; const gain = p.mise * 2; encaisser(G, gain, 'fete'); return { couche: true, texte: `Grik grimace et se couche ! Tu remportes la mise (${gain} p.).` }; }
  return null;
}

// --- L'hydromel noir et le pain de cendre (le grand soir) ---
function boireHydromel(G) {
  const s = etatBrumes(G);
  if (!grandSoirBrumes(G) || s.hydromel) return null;
  s.hydromel = true;
  for (const nom of ['Le Passeur', 'Mère Nok']) changerRelation(G, nom, BRUMES.hydromel.relation);
  G.reveilDifficile = G.jour + 1;
  G.visions = (G.visions || 0) + 1;
  return s;
}
function refuserHydromel(G) { const s = etatBrumes(G); s.hydromel = 'refuse'; changerRelation(G, 'Le Passeur', -1); }
function prendrePain(G) {
  const s = etatBrumes(G);
  if (!grandSoirBrumes(G) || s.pain) return false;
  s.pain = true; G.cadeaux.painCendre = (G.cadeaux.painCendre || 0) + 1;
  return true;
}
function offrirPain(G, v) {
  v.painCendre = true;
  const ombre = ZONES[v.zone] && ZONES[v.zone].camp === 'mal';
  if (PEUPLES_OMBRE.includes(v.race)) changerRelation(G, v.nom, 2);
  return `« Du pain de cendre... ${PEUPLES_OMBRE.includes(v.race) ? 'des miens ! Merci, vraiment.' : "c'est celui des Bannis, non ?"} » ${ombre ? '(En terre d\'ombre, il le fera rebrousser chemin au lieu de mourir, une fois.)' : "(Il ne protège qu'en terre d'ombre.)"}`;
}
// En terre d'ombre, le pain de cendre fait toujours rebrousser chemin (au lieu de la mort)
function paindeCendreProtege(voyageur) { return !!(voyageur.painCendre && ZONES[voyageur.zone] && ZONES[voyageur.zone].camp === 'mal'); }

// --- Les lanternes pour tes morts ---
function mortsAHonorer(G) {
  const vus = new Set(), morts = [];
  for (const h of G.historique || []) if ((h.issue === 'valeureux' || h.issue === 'sans gloire') && !vus.has(h.nom)) { vus.add(h.nom); morts.push(h); }
  const deja = etatBrumes(G).lanternes.map(l => l.nom);
  return morts.slice(0, 8).filter(m => !deja.includes(m.nom));   // (v1.07 : huit lanternes au plus par Nuit des Brumes, pour tes morts les plus récents)
}
// Allumer une lanterne : la famille réagit selon la qualité
function allumerLanterne(G, nom, qualite) {
  const L = BRUMES.lanternes[qualite];
  if (!peutPayer(G, L.prix)) return { erreur: manqueArgent(G, L.prix, "Pas assez d'argent pour cette lanterne.") };
  payer(G, L.prix, 'fete');
  const s = etatBrumes(G); s.hommage = true;
  const convient = Math.random() < L.convient;
  s.lanternes.push({ nom, qualite, convient });
  if (convient) G.reputation += BRUMES.lanternes.reputation;
  const famille = { basse: convient ? "La famille sourit malgré tout : « C'est le geste qui compte. »" : "La famille regarde la lanterne qui peine à monter... et détourne les yeux.",
    moyenne: convient ? "La famille s'incline : « Merci. C'est exactement ce qu'il fallait. »" : "La famille hoche la tête, poliment, sans un mot.",
    belle: convient ? "La famille en a les larmes aux yeux : « Jamais on ne l'avait honoré ainsi... »" : "La famille est gênée : « C'est... beaucoup. Il n'aimait pas qu'on fasse du bruit pour lui. »" }[qualite];
  return { convient, texte: `Tu allumes ${L.nom} pour ${nom}. ${famille}${convient ? ` (+${String(BRUMES.lanternes.reputation).replace('.', ',')} de réputation)` : ''}` };
}

// --- Les paroles ---
const HISTOIRE_PASSEUR = "« Mon grand-père disait qu'avant, il n'y avait ni lumière ni ombre. Juste des voisins. Une nuit, quelqu'un a chanté sur la ville, une chanson que personne n'a entendue. Au matin, la moitié des gens avaient oublié qu'ils avaient été amis. L'autre moitié, on l'a appelée les Bannis. Bah. Les vieux racontent n'importe quoi. »";
const DISCOURS_GARRICK = "« Je sais ce qu'on dit de vous, là-haut. Je sais ce qu'on vous a pris, et ce qu'on vous a fait oublier. Mais écoutez-moi : la brume finit toujours par se lever. Un jour, vos enfants passeront la Grande Muraille sans baisser les yeux. Gardez vos lanternes allumées : des jours meilleurs viendront. »";
// Garrick parle aux Bannis le grand soir de ta première Nuit des Brumes au marché noir (v1.07 : quelle que soit
// l'année ; les sauts de temps sautaient souvent celle de la première année)
function garrickParleCeSoir(G) { return grandSoirBrumes(G) && !G.garrickBrumes && !etatBrumes(G).garrick; }

// La nuit (G.jour est déjà le lendemain) : sans hommage le dernier soir, la foule le voit d'un mauvais œil ;
// l'hydromel se paie au réveil
function nuitBrumes(G) {
  const lignes = [], hier = G.jour - 1;
  const f = feteOuverte('brumes') && G.visiteMarcheNoir !== undefined ? feteDuJour(G, hier) : null;
  const s = G.brumes;
  if (f && f.id === 'brumes' && f.jour === 2 && s && s.venu && !s.hommage && mortsAHonorer(G).length) {
    G.reputation = Math.max(0, G.reputation - BRUMES.lanternes.sansHommage);
    lignes.push(`Tu n'as allumé aucune lanterne pour tes morts. Au marché noir, on en parle à voix basse... (−${String(BRUMES.lanternes.sansHommage).replace('.', ',')} de réputation)`);
  }
  if (G.reveilDifficile === G.jour) lignes.push("L'hydromel noir des Bannis... Tu te réveilles la tête lourde : la boutique ouvrira une heure plus tard.");
  return lignes;
}

// Les atours des ancêtres : un client de l'ombre qui te voit vêtu comme les anciens (une fois par jour)
function remarqueAtoursAncetres(G, v) {
  if (!feteOuverte('brumes') || !PEUPLES_OMBRE.includes(v.race)) return null;
  const f = feteDuJour(G); if (!f || f.id !== 'brumes') return null;
  const portes = ATOURS_ANCETRES.filter(id => porte(G, id));
  if (!portes.length) return null;
  changerRelation(G, v.nom, 1);
  return { masqueOs: 'Le masque des anciens... Tu honores les nôtres. Merci.', chaleBrume: 'Un châle de brume ! Les ancêtres te reconnaîtront ce soir.', lanterneCeinture: "Une lanterne rouge à ta ceinture : tu guides nos morts, toi aussi ?" }[portes[Math.floor(Math.random() * portes.length)]];
}
