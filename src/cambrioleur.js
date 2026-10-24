// (v1.55, planche 63 validée) Le cambrioleur, et le chat qui lui fait peur.
// - Rare : une nuit tous les 40 à 60 jours (dès le jour 25), plus souvent quand ta fortune dort à la maison (plus de 3 000 p.).
// - Ce qui le décourage : la garde achetée du repaire (il n'ose pas venir), une serrure de fer (une fois sur deux, il
//   abandonne), le coffre-fort de nain (il ne trouve que la moitié de l'or), et ton chat s'il t'a déjà parlé : toujours.
// - Sans chat qui parle : il prend un peu d'or (jamais tout), une potion, parfois une pièce d'une série pas encore complète
//   de la vitrine ; au matin, la porte entrouverte, des traces de bottes, la liste de ce qui manque. Il reviendra.
// - Avec le chat qui parle : une des mini-cinématiques « d'horreur » drôles (les yeux, l'ombre, la fumée, et le Parrain si
//   ton chat dirige la Main Noire), il détale en semant son butin (on retrouve tout), se rend à la garde en pleurant (la
//   gazette en parle) et ne revient jamais. La première fois : le succès secret « Bouh. ».
// Devant les autres, le chat reste un chat ordinaire : il ne se montre debout qu'au voleur, la nuit.

const CAMBRIOLEUR = {
  jourMin: 25, ecart: [40, 60], ecartRiche: [28, 40], riche: 3000,
  part: 0.12, partMax: 400, partMin: 15,      // (un peu d'or, jamais tout)
  serrure: 0.5,                               // (la serrure de fer : une fois sur deux, il renonce)
  coffreFort: 2, moitie: 0.5,                 // (le coffre-fort de nain, dès le niveau 2 : il ne trouve que la moitié)
  vitrine: 0.35,                              // (parfois, une pièce d'une série pas encore complète)
};
const FILMS_CAMBRIOLEUR = {
  yeux: { titre: 'I.  LES YEUX', replique: '« Tu cherches quelque chose... l\'ami ? »' },
  ombre: { titre: 'II.  L\'OMBRE', replique: '« Je compte jusqu\'à trois. »' },
  fumee: { titre: 'III.  LA FUMÉE', replique: '« Bouh. »' },
  parrain: { titre: 'IV.  LE PARRAIN', replique: '« On ne vole pas chez la Famille. Tu vas dire bonsoir... et oublier cette adresse. »' },
};

function etatCambrioleur(G) { return (G.cambrioleur = G.cambrioleur || { prochain: null, fois: 0, fini: false }); }
function hasardCambrioleur(G, sel) { return typeof hasardMeteo === 'function' ? hasardMeteo(G, G.jour, 40 + sel) : Math.random(); }
function planifierCambrioleur(G) {
  const c = etatCambrioleur(G), [a, b] = G.argent > CAMBRIOLEUR.riche ? CAMBRIOLEUR.ecartRiche : CAMBRIOLEUR.ecart;
  c.prochain = Math.max(CAMBRIOLEUR.jourMin, G.jour + a + Math.floor(hasardCambrioleur(G, 1) * (b - a + 1)));
}
function chatChasseVoleur(G) { return typeof chatParle === 'function' && chatParle(G) && typeof chatAdopte === 'function' && chatAdopte(G) && !(typeof chatParti === 'function' && chatParti(G)); }
function filmsPossibles(G) { return ['yeux', 'ombre', 'fumee', ...(G.parrain && G.parrain.fait ? ['parrain'] : [])]; }

// La nuit (G.jour est déjà le nouveau jour) : vient-il ? Renvoie les lignes du réveil ; G.cambriolage décrit la nuit
// pour la petite cinématique (seulement quand le chat lui fait peur).
function nuitDuCambrioleur(G) {
  const c = etatCambrioleur(G);
  if (c.fini) return [];
  if (!c.prochain) { planifierCambrioleur(G); return []; }
  // (une fortune qui dort à la maison le fait venir plus tôt)
  if (G.argent > CAMBRIOLEUR.riche && c.prochain - G.jour > CAMBRIOLEUR.ecartRiche[1]) planifierCambrioleur(G);
  if (G.jour < c.prochain) return [];
  planifierCambrioleur(G);
  if (typeof gardeAchetee === 'function' && gardeAchetee(G)) return [];   // (la garde du repaire veille : il n'ose pas)
  // Le chat qui parle : il lui fait peur, toujours
  if (chatChasseVoleur(G)) {
    const films = filmsPossibles(G), film = films[Math.floor(hasardCambrioleur(G, 2) * films.length)];
    c.fini = true; c.chasse = G.jour;
    G.cambriolage = { jour: G.jour, film, chat: true };
    const annonce = "Un cambrioleur se rend à la garde en pleurant ! « Un chat ! Un chat qui parle ! Il fume, il compte jusqu'à trois ! » Le capitaine a pris sa déposition « avec le plus grand sérieux », avant d'éclater de rire.";
    // (la gazette du matin est déjà écrite quand il détale : le crieur l'ajoute en tête ; sinon, demain)
    if (G.gazette && G.gazette.jour === G.jour) G.gazette.lignes.unshift(annonce); else G.annonceCambrioleur = annonce;
    if (typeof debloquerSucces === 'function') debloquerSucces(G, 'bouh');
    const n = typeof nomChat === 'function' ? nomChat(G) : 'ton chat';
    return [`Cette nuit, des cris dans la rue : quelqu'un s'est enfui en hurlant, et a semé de l'or et une potion sur les pavés (tout est rentré). ${n[0].toUpperCase() + n.slice(1)} dort dans son panier, l'air de rien.`];
  }
  // La serrure de fer : une fois sur deux, il renonce
  if (niveauAmelioration(G, 'serrure') > 0 && hasardCambrioleur(G, 3) < CAMBRIOLEUR.serrure)
    return ['Des rayures toutes fraîches autour de ta serrure de fer : quelqu\'un a essayé d\'entrer cette nuit, sans y arriver.'];
  // Il vole
  c.fois++;
  const coffre = niveauAmelioration(G, 'coffre') >= CAMBRIOLEUR.coffreFort ? CAMBRIOLEUR.moitie : 1;
  const or = G.argent > CAMBRIOLEUR.partMin * 2 ? Math.min(CAMBRIOLEUR.partMax, Math.max(CAMBRIOLEUR.partMin, Math.round(G.argent * CAMBRIOLEUR.part * coffre))) : 0;
  if (or > 0) payer(G, or, 'vol');
  const manque = [];
  if (or > 0) manque.push(`${or} pièces${coffre < 1 ? ' (le coffre-fort a gardé le reste)' : ''}`);
  if ((G.stock.potion || 0) > 0) { G.stock.potion--; manque.push('une potion'); }
  if (typeof collections === 'function' && hasardCambrioleur(G, 4) < CAMBRIOLEUR.vitrine) {
    const cols = collections(G), series = Object.keys(cols).filter(s => cols[s].length && !serieComplete(G, s));
    if (series.length) { const s = series[Math.floor(hasardCambrioleur(G, 5) * series.length)], p = cols[s].pop(); manque.push(`${COLLECTIONS[s].pieces[p].replace(/^(Le|La|L')\s?/, m => m.toLowerCase())} (dans la vitrine)`); }
  }
  G.cambriolage = { jour: G.jour, chat: false, manque };
  if (!manque.length) return ['La porte de la rue entrouverte au matin, des traces de bottes... mais il n\'y avait rien à prendre : un cambrioleur est reparti bredouille.'];
  return [`La porte de la rue est entrouverte, des traces de bottes sur le plancher : un cambrioleur est passé cette nuit. Il manque : ${manque.join(', ')}.` + (chatAdopte(G) ? ' (Ton chat, lui, a dormi comme un loir.)' : '')];
}
