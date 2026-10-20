// (v1.29, planche 53 validée) Le repaire sous le comptoir : trois projets côté ombre, l'un après l'autre, chacun
// installé en une nuit. La cave de contrebande (une trappe sous le tapis de l'arrière-boutique : dix objets
// interdits y sont toujours à l'abri, et la fouille ne trouve le reste qu'une fois sur deux), les informateurs
// (Fil-de-Fer et deux autres gamins des rues : la veille, un billet prévient de la garde ; chaque matin, un tuyau ;
// parfois, un secret pour le carnet), la garde achetée (le capitaine Brisefer ne vient plus, ni descente ni amende,
// tant que l'enveloppe arrive chaque semaine ; si elle manque, la garde revient, plus sévère).
const REPAIRE = {
  projets: [
    { id: 'cave', nom: 'La cave', prix: 3000, effet: 'Dix objets interdits toujours à l’abri ; la fouille ne trouve le reste qu’une fois sur deux.', decor: 'Une trappe sous le tapis, une échelle, une voûte.' },
    { id: 'informateurs', nom: 'Les informateurs', prix: 7000, effet: 'La veille, un billet te prévient de la garde. Chaque matin, un tuyau ; parfois, un secret.', decor: 'Trois gamins des rues qui voient tout.' },
    { id: 'garde', nom: 'La garde achetée', prix: 12000, effet: 'Plus de descentes ni d’amendes, tant que l’enveloppe arrive (100 p. par semaine).', decor: 'Le capitaine Brisefer ferme les yeux.' },
  ],
  abri: 10,                  // les interdits rangés dans la cave, que la fouille ne trouve jamais
  trouve: 0.5,               // la chance que la fouille trouve chacun des autres (et la caisse, et les bijoux volés)
  enveloppe: 100,            // chaque semaine, pour le capitaine
  colere: 2,                 // l'amende, quand l'enveloppe a manqué
  secret: { chance: 0.15, ecart: 10 },
};
POSTES.repaire = 'Le repaire';
const SECRETS_INFORMATEURS = [
  'Fil-de-Fer a vu des caisses marquées du sceau du Conseil partir, la nuit, vers les terres des Bannis.',
  "Une vieille du port le jure à Fil-de-Fer : les loups n'attaquaient jamais, avant.",
  'Au marché noir, on a vendu une carte à demi effacée. Fil-de-Fer a eu le temps de voir un chemin, à l’ouest.',
];

function repaireDe(G) { G.repaire = G.repaire || { bati: {}, chantier: null }; return G.repaire; }
// Le livre noir ne s'ouvre qu'à ceux qui marchent du côté de l'ombre (la jauge, ou le serment)
function repaireOuvert(G) { return coteCamp(G) === 'mal' || (typeof sermentDe === 'function' && sermentDe(G) === 'mal'); }
function repaireA(G, id) { return !!(G.repaire && G.repaire.bati && G.repaire.bati[id] && G.repaire.bati[id] <= G.jour); }
function projetRepaire(G) { return REPAIRE.projets.find(p => !(G.repaire && G.repaire.bati && G.repaire.bati[p.id])) || null; }
function payeRepaire(G) { return REPAIRE.projets.filter(p => G.repaire && G.repaire.bati && G.repaire.bati[p.id]).reduce((s, p) => s + p.prix, 0); }
function totalRepaire() { return REPAIRE.projets.reduce((s, p) => s + p.prix, 0); }

function installerRepaire(G) {
  const p = projetRepaire(G), r = repaireDe(G);
  if (!p || !repaireOuvert(G)) return { erreur: 'Rien à installer.' };
  if (r.chantier) return { erreur: 'Les ouvriers de la nuit sont déjà à l’ouvrage.' };
  if (!peutPayer(G, p.prix)) return { erreur: manqueArgent(G, p.prix, `Il te manque ${p.prix - Math.floor(G.argent)} pièces.`) };
  payer(G, p.prix, 'repaire');
  r.chantier = p.id;
  return { ok: true, projet: p };
}

// --- La garde achetée : tant que l'enveloppe arrive, le capitaine ferme les yeux ---
function gardeAchetee(G) { return repaireA(G, 'garde') && !(G.repaire.manquee > 0); }
// (appelé à la place d'une visite) la garde passe son chemin
function gardeDetournee(G) { return gardeAchetee(G); }

// --- La cave : ce que la fouille trouve quand même ---
// Renvoie la liste des interdits saisis {id: n}, en laissant les autres à leur place
function saisieAvecCave(G) {
  const saisis = {};
  let abri = REPAIRE.abri;
  for (const [id, n] of Object.entries(G.interdits || {})) {
    let pris = 0;
    for (let k = 0; k < n; k++) { if (abri > 0) { abri--; continue; } if (Math.random() < REPAIRE.trouve) pris++; }
    if (pris) saisis[id] = pris;
  }
  return saisis;
}
function interditsTotal(G) { return Object.values(G.interdits || {}).reduce((s, n) => s + (n || 0), 0); }

// --- Les informateurs ---
// La veille au soir : le billet qui prévient de la garde (comme le chat, mais à coup sûr)
function alerteInformateurs(G) { return repaireA(G, 'informateurs') && !gardeAchetee(G) && !!G.gardeDemain && G.garde && G.garde.visites > 0; }
// Le tuyau du matin (et, parfois, un secret de plus pour le carnet)
function tuyauDuMatin(G) {
  if (!repaireA(G, 'informateurs')) return [];
  const lignes = [], tuyaux = [];
  if (G.gardeDemain && !gardeAchetee(G)) tuyaux.push("des tabards bleus se rassemblent près de la fontaine : la garde passera chez toi aujourd'hui");
  if (typeof marcheNoirCeSoir === 'function' && marcheNoirCeSoir(G)) tuyaux.push("la porte dérobée de l'impasse s'ouvrira ce soir");
  if (gardeAchetee(G)) tuyaux.push('le capitaine a encore ton enveloppe en poche : la garde te laisse tranquille');
  if (!tuyaux.length) tuyaux.push(auHasard(['Thorgal attend un chargement de fer : ses prix baisseront dans quelques jours', 'la vieille Berthe Pommeroy compte ses sous sous son matelas', 'un cavalier du Conseil est passé à l’aube, pressé, sans s’arrêter', 'rien à signaler, la rue est calme']));
  lignes.push(`Un billet glissé sous la porte, signé Fil-de-Fer : ${auHasard(tuyaux)}.`);
  const r = repaireDe(G);
  const neufs = SECRETS_INFORMATEURS.filter(t => !(G.etrangetes || []).some(e => e.texte === t));
  if (neufs.length && G.jour - (r.secret || -99) >= REPAIRE.secret.ecart && Math.random() < REPAIRE.secret.chance) {
    const texte = auHasard(neufs);
    r.secret = G.jour;
    G.etrangetes = G.etrangetes || [];
    G.etrangetes.push({ jour: G.jour, nom: 'Fil-de-Fer', texte });
    if (typeof penserAPartir === 'function') penserAPartir(G, 'secret');
    lignes.push(`Au dos du billet, en tout petit : « ${texte} » (le carnet des choses étranges : +1)`);
  }
  return lignes;
}

// La nuit : le chantier ; le dernier jour de la semaine, l'enveloppe du capitaine
function nuitDuRepaire(G) {
  const r = G.repaire;
  if (!r) return;
  if (r.chantier) { r.bati[r.chantier] = G.jour + 1; r.annonce = r.chantier; r.chantier = null; }
  if (repaireA(G, 'garde') && G.jour % 7 === 0) {
    if (peutPayer(G, REPAIRE.enveloppe)) { payer(G, REPAIRE.enveloppe, 'repaire'); r.enveloppe = G.jour; r.manquee = 0; }
    else { r.manquee = (r.manquee || 0) + 1; G.gardeDemain = true; }   // (pas d'enveloppe : la garde revient dès demain, et elle est fâchée)
  }
}
function matinDuRepaire(G) {
  const lignes = [], r = G.repaire;
  if (!r) return lignes;
  if (r.annonce) {
    lignes.push({ cave: "Cette nuit, des ouvriers sans nom ont creusé sous l'arrière-boutique : la cave est prête, la trappe cachée sous le tapis.",
      informateurs: 'Fil-de-Fer et deux autres gamins des rues travaillent pour toi désormais. Ils voient tout, ils entendent tout.',
      garde: "Minuit. Le capitaine Brisefer a pris la première enveloppe sans un mot. La garde fermera les yeux, tant qu'elle arrive chaque semaine." }[r.annonce] + ' ' + (REPAIRE.projets.find(p => p.id === r.annonce) || {}).effet);
    r.annonce = null;
  }
  if (r.enveloppe === G.jour - 1) lignes.push(`Minuit : le capitaine Brisefer est passé prendre l'enveloppe de la semaine (−${REPAIRE.enveloppe} p.).`);
  if (r.manquee > 0 && G.gardeDemain) lignes.push("L'enveloppe n'est pas arrivée cette semaine. Le capitaine n'aime pas attendre : la garde vient aujourd'hui, et elle est fâchée.");
  lignes.push(...tuyauDuMatin(G));
  return lignes;
}
