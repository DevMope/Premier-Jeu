// (v1.56, planches 64 v5 et 74 v3 validées) La maison sur pattes, et les Mages-Charpentiers. Première étape :
// - Le chantier des Mages-Charpentiers s'installe dans la rue, après la fontaine, quand un royaume est aux trois
//   cinquièmes libéré (ou conquis) ; l'atelier ouvre quand il l'est entièrement.
// - Chez eux : trois sortes de pattes (chêne, ferrées, runiques), le filet à bois et ses agrandissements, et le bois
//   que la maison mange (planches et bûches de Thorgal, charbon des nains, bûches runiques des Mages).
// - Une fois les pattes posées, elles restent repliées au coin des murs ; une marche d'essai dans la rue (une fois par
//   jour, elle mange du bois). Le grand voyage vers un autre royaume viendra avec la planche de la première ville.

const PATTES = {
  sortes: {
    chene: { nom: 'Pattes de chêne', prix: 10000, vitesse: 1, texte: 'La première paire, pour quitter la Comté. Elle marche, prudemment.' },
    ferree: { nom: 'Pattes ferrées', prix: 6000, vitesse: 1.33, texte: 'Cerclées de fer, genoux de laiton : un tiers plus vite, et elles passent la neige et les cailloux.' },
    runique: { nom: 'Pattes runiques', prix: 14000, vitesse: 2, texte: 'Gravées de runes bleues : deux fois plus vite. Elles nagent, et grimpent les cols.' },
  },
  ordre: ['chene', 'ferree', 'runique'],
  chantier: 0.6,                          // (la part d'un royaume libérée pour que le chantier s'installe)
  filets: [{ nom: 'Le filet de chanvre', places: 12, prix: 0 }, { nom: 'Le grand filet', places: 20, prix: 800 }, { nom: 'Le coffre à bois', places: 30, prix: 2000 }],
  journee: 8,                             // (une journée de route : 8 heures de marche)
  essai: 1,                               // (la marche d'essai, dans la rue : une heure de marche)
};
if (typeof POSTES !== 'undefined') POSTES.pattes = 'Les Mages-Charpentiers';   // (v1.57 : les comptes du bureau affichaient « pattes »)
// Le bois qu'elle mange : une place du filet chacun ; les heures de marche ; d'où il vient
const COMBUSTIBLES = {
  fagot: { nom: 'Fagot de bois mort', heures: 1, prix: 0, ou: 'ramassé en route', fumee: 'claire' },
  planche: { nom: 'Planche', heures: 2, prix: 2, ou: 'chez Thorgal (le bois de la forge)', fumee: 'grise', bois: true },
  buche: { nom: 'Bûche de chêne', heures: 5, prix: 8, ou: 'chez Thorgal', fumee: 'épaisse' },
  charbon: { nom: 'Sac de charbon des nains', heures: 10, prix: 40, ou: 'en terre naine, ou chez Grippesou', fumee: 'noire', royaume: 'nains' },
  runique: { nom: 'Bûche runique', heures: 20, prix: 150, ou: 'chez les Mages-Charpentiers', fumee: 'bleue' },
};
const ORDRE_COMBUSTIBLES = ['planche', 'buche', 'charbon', 'runique'];

function etatPattes(G) { return (G.pattes = G.pattes || { sorte: null, filet: 0, bois: [], essais: 0, essaiJour: null }); }
function royaumesLiberes(G) { return Object.keys(ROYAUMES).filter(r => royaumeLibere(G, r)); }
// Le chantier : un royaume aux trois cinquièmes (ou plus) ; l'atelier : un royaume entier
function chantierMages(G) {
  if (atelierMagesOuvert(G)) return false;
  return Object.keys(ROYAUMES).some(r => { const a = avanceeRoyaume(G, r); return a.total && a.faites / a.total >= PATTES.chantier; });
}
function atelierMagesOuvert(G) { return royaumesLiberes(G).length > 0; }
function pattesPosees(G) { return !!etatPattes(G).sorte; }
function sorteSuivante(G) { const s = etatPattes(G).sorte; return s ? PATTES.ordre[PATTES.ordre.indexOf(s) + 1] || null : 'chene'; }
function placesFilet(G) { return PATTES.filets[etatPattes(G).filet].places; }
function heuresDeBois(G) { const e = etatPattes(G); return e.bois.reduce((h, id) => h + COMBUSTIBLES[id].heures, 0) + (e.entame || 0); }   // (avec ce qui reste de la bûche entamée)
function combustibleEnVente(G, id) { const c = COMBUSTIBLES[id]; return !c.royaume || royaumeLibere(G, c.royaume); }

// Acheter (ou améliorer) les pattes : on paie, les Mages les posent cette nuit... ou tout de suite (elles sont prêtes)
function acheterPattes(G) {
  const s = sorteSuivante(G);
  if (!atelierMagesOuvert(G)) return { erreur: "L'atelier n'est pas encore ouvert." };
  if (!s) return { erreur: 'Ta maison a déjà les plus belles pattes du monde.' };
  const prix = PATTES.sortes[s].prix;
  if (!peutPayer(G, prix)) return { erreur: `Il te manque ${prix - G.argent} pièces.` };
  payer(G, prix, 'pattes');
  etatPattes(G).sorte = s;
  if (typeof debloquerSucces === 'function' && SUCCES.pattes) debloquerSucces(G, 'pattes');
  return { sorte: s, texte: s === 'chene' ? "Les Mages-Charpentiers ont posé les pattes : elles dorment repliées au coin des murs. Ta maison peut marcher !" : `${PATTES.sortes[s].nom} : les Mages ont changé les pattes. Elles brillent !` };
}
function acheterFilet(G) {
  const e = etatPattes(G), suivant = PATTES.filets[e.filet + 1];
  if (!suivant) return { erreur: 'Tu as déjà le coffre à bois.' };
  if (!peutPayer(G, suivant.prix)) return { erreur: `Il te manque ${suivant.prix - G.argent} pièces.` };
  payer(G, suivant.prix, 'pattes');
  e.filet++;
  return { texte: `${suivant.nom} : ${suivant.places} places pour le bois.` };
}
// Remplir une place du filet (les planches de Thorgal viennent de ta réserve de bois s'il y en a)
function acheterCombustible(G, id, n = 1) {
  const e = etatPattes(G), c = COMBUSTIBLES[id];
  if (!c || !combustibleEnVente(G, id)) return { erreur: 'On n\'en trouve pas ici.' };
  const place = placesFilet(G) - e.bois.length;
  if (place <= 0) return { erreur: 'Le filet est plein.' };
  n = Math.min(n, place);
  let deReserve = 0;
  if (c.bois) { deReserve = Math.min(n, G.materiaux.bois || 0); G.materiaux.bois -= deReserve; }
  const prix = (n - deReserve) * c.prix;
  if (prix && !peutPayer(G, prix)) { if (deReserve) G.materiaux.bois += deReserve;   // (les planches de ta réserve, elles, sont gratuites)
    return { erreur: `Il te manque ${prix - G.argent} pièces.` }; }
  if (prix) payer(G, prix, 'pattes');
  for (let k = 0; k < n; k++) e.bois.push(id);
  return { n, prix, deReserve };
}
// Brûler du bois pour marcher h heures ; renvoie ce qui a été mangé (le plus petit bois d'abord)
function brulerBois(G, h) {
  const e = etatPattes(G);
  e.bois.sort((a, b) => COMBUSTIBLES[a].heures - COMBUSTIBLES[b].heures);
  const manges = [];
  let reste = h;
  const dEntame = Math.min(reste, e.entame || 0); e.entame = (e.entame || 0) - dEntame; reste -= dEntame;   // (d'abord la bûche qui brûle déjà)
  while (reste > 0 && e.bois.length) { const id = e.bois.shift(); manges.push(id); reste -= COMBUSTIBLES[id].heures; }
  if (reste < 0) { e.entame = -reste; reste = 0; }   // (le reste de la dernière bûche couve et servira demain : rien ne se perd)
  return { manges, assez: reste <= 0 };
}
// La marche d'essai dans la rue : une fois par jour, une heure de bois
function peutEssayer(G) { const e = etatPattes(G); return pattesPosees(G) && e.essaiJour !== G.jour; }
function marcheDEssai(G) {
  const e = etatPattes(G);
  if (!pattesPosees(G)) return { erreur: 'Il faut d\'abord des pattes !' };
  if (e.essaiJour === G.jour) return { erreur: 'Elle a déjà marché aujourd\'hui : laisse-la souffler.' };
  if (!e.bois.length) return { erreur: 'Le filet est vide : sans bois, elle ne se lèvera pas.' };
  const b = brulerBois(G, PATTES.essai);
  e.essaiJour = G.jour; e.essais++;
  return { manges: b.manges, sorte: e.sorte };
}

// Les Mages-Charpentiers (leurs noms viendront avec la banque de noms)
const MAITRESSE_MAGES = { race: 'magicienne', nom: 'La maîtresse-charpentière', feminin: true, niveau: 'veteran' };
const CHARPENTIER_NAIN = { race: 'nain', nom: 'Le charpentier', niveau: 'aguerri' };

// La nuit : le chantier s'installe, puis l'atelier ouvre (le crieur l'annonce, une fois chacun)
function nuitDesMages(G) {
  const e = etatPattes(G);
  if (!e.chantierAnnonce && chantierMages(G)) { e.chantierAnnonce = G.jour; G.annonceMages = "Un chantier s'est ouvert près de la fontaine : les poutres montent toutes seules, dans une lueur bleue ! Ce sont les Mages-Charpentiers, qui posent des pattes sous les maisons."; }
  else if (!e.atelierAnnonce && atelierMagesOuvert(G)) { e.atelierAnnonce = G.jour; e.chantierAnnonce = e.chantierAnnonce || G.jour; G.annonceMages = "L'atelier des Mages-Charpentiers ouvre ses grandes portes, à côté de la fontaine. « Ta maison s'ennuie ? On lui pose des jambes. »"; }
}
