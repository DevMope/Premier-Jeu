// (v0.60) La Main Noire façon mafia. Dès qu'on lui a emprunté de l'argent, on lui appartient un
// peu : un collecteur passe chaque semaine prendre « sa part » (le pizzo). On peut payer, refuser
// (et subir des représailles la nuit), ou rendre des services qui effacent la dette mais font
// pencher la jauge vers l'ombre. Les services font monter en grade : débiteur, associé, lieutenant.
// Une bande rivale, le Serpent à deux têtes, voudra te débaucher. Et l'on peut en sortir : racheter
// sa liberté (très cher), ou tout dénoncer à la Confrérie.

const MAFIA = {
  pizzo: 0.1, pizzoSerpent: 0.07, pizzoMin: 15,
  jourCollecte: 3,                 // (le 3e jour de chaque semaine ; le loyer, lui, tombe le 7e)
  rangs: [0, 3, 7],                // services rendus pour devenir associé, puis lieutenant
  partLieutenant: 25, partParService: 4,
  rachat: 250, rachatParRang: 120,
  vengeance: 0.35,                 // après une dénonciation : les restes de la bande se vengent parfois
};
const NOMS_RANGS = ['Débiteur', 'Associé', 'Lieutenant'];
const COLLECTEUR = { nom: 'Silas Doigts-Noirs', race: 'humain', feminin: false, costume: 'mainNoire', niveau: 'aguerri', serieux: true };
const CHEFS_SERPENT = [
  { nom: 'Vesna la Vipère', race: 'humain', feminin: true, costume: 'serpent', niveau: 'veteran', serieux: true },
  { nom: 'Corvin le Crotale', race: 'orc', feminin: false, costume: 'serpent', niveau: 'veteran', serieux: true },
];
const SERVICES_MAFIA = {
  colis: { nom: 'Cacher un colis', demande: "Un colis à garder dans ta réserve jusqu'à demain soir. Tu ne l'ouvres pas. Tu ne poses pas de questions.", efface: 40, risque: 0.3 },
  vole: { nom: 'Écouler du volé', demande: "Des bijoux qui ne sont à personne. Revends-les aux enchères, et on oublie une partie de ce que tu nous dois.", efface: 50, risque: 0.2 },
  aventurier: { nom: 'Prêter un aventurier', demande: "Ton prochain aventurier fera un petit détour pour nous. Il portera un paquet. Il ne saura rien.", efface: 60, risque: 0.15 },
};

function mafia(G) {
  G.mafia = G.mafia || { engage: false, services: 0, bande: 'main', serpentVu: false, sorti: null, represailles: null, impayes: 0, colis: false, detour: false, vengeance: false };
  return G.mafia;
}
function rangMafia(G) {
  const s = mafia(G).services;
  return s >= MAFIA.rangs[2] ? 2 : s >= MAFIA.rangs[1] ? 1 : 0;
}
function nomBande(G) { return mafia(G).bande === 'serpent' ? 'le Serpent à deux têtes' : 'la Main Noire'; }
function NomBande(G) { const n = nomBande(G); return n.charAt(0).toUpperCase() + n.slice(1); }
// Qui passe prendre la part : Silas pour la Main Noire, Corvin le Crotale pour le Serpent
function collecteurDe(G) { return mafia(G).bande === 'serpent' ? CHEFS_SERPENT[1] : COLLECTEUR; }
function enMafia(G) { const m = mafia(G); return m.engage && !m.sorti; }

// Le pizzo de la semaine : un dixième de la bourse (un peu moins chez le Serpent), moitié prix pour un associé
function montantPizzo(G) {
  const m = mafia(G);
  let x = Math.max(MAFIA.pizzoMin, Math.round(Math.max(0, G.argent) * (m.bande === 'serpent' ? MAFIA.pizzoSerpent : MAFIA.pizzo)));
  if (rangMafia(G) === 1) x = Math.round(x / 2);
  return x;
}
function prixRachat(G) { return MAFIA.rachat + MAFIA.rachatParRang * rangMafia(G); }

// Les visites de la bande, à glisser dans la file du jour
function visitesMafia(G) {
  const m = mafia(G);
  if (!enMafia(G)) return [];
  // associé : le Serpent à deux têtes vient te débaucher (une seule fois)
  if (!m.serpentVu && rangMafia(G) >= 1) { m.serpentVu = true; return [{ type: 'serpent' }]; }
  if (G.jour % 7 !== MAFIA.jourCollecte) return [];
  const services = Object.keys(SERVICES_MAFIA).filter(s => (s !== 'colis' || !m.colis) && (s !== 'aventurier' || !m.detour));
  return [{ type: 'collecteur', service: rangMafia(G) < 2 && Math.random() < 0.5 ? auHasard(services) : null }];
}

// Engagé dès le premier prêt de la Main Noire
function engagerMafia(G) { const m = mafia(G); if (!m.sorti) m.engage = true; }

function payerPizzo(G) { const x = montantPizzo(G); payer(G, x, 'pizzo'); return x; }
function refuserPizzo(G) { const m = mafia(G); m.represailles = m.bande; m.impayes++; }

// Un service rendu : la dette fond (ou la bande te paie), la jauge penche vers l'ombre, et l'on monte en grade
function rendreService(G, id) {
  const m = mafia(G), s = SERVICES_MAFIA[id];
  const avant = rangMafia(G);
  m.services++;
  G.reussites.mal = (G.reussites.mal || 0) + 1;
  pencher(G, 'piege');
  let reste = s.efface;
  for (const p of G.prets.filter(x => x.preteur === 'La Main Noire')) { const k = Math.min(reste, p.restant); p.restant -= k; reste -= k; }
  G.prets = G.prets.filter(p => p.restant > 0);
  if (reste > 0) encaisser(G, Math.round(reste / 2), 'pizzo');
  if (id === 'colis') m.colis = G.jour + 1;   // (il repart la nuit d'après : la garde peut le trouver demain)
  if (id === 'vole') G.tresors.push({ nom: 'Bijoux volés', categorie: 'bijou', valeurBase: 55, etat: 2, etatInitial: 2, reparation: null, vole: true });
  if (id === 'aventurier') m.detour = true;
  if (Math.random() < s.risque * (m.bande === 'serpent' ? 1.5 : 1)) G.gardeDemain = true;
  const apres = rangMafia(G);
  return apres > avant ? `Tu montes en grade : te voilà ${NOMS_RANGS[apres].toLowerCase()} de ${nomBande(G)}.` + (apres === 1 ? ' Ta part de la semaine est réduite de moitié.' : ' Plus de part à payer : c\'est toi qu\'on paie, désormais.') : null;
}

// Le lieutenant touche sa part chaque semaine
function partLieutenant(G) { return MAFIA.partLieutenant + MAFIA.partParService * mafia(G).services; }

// Changer de bande (le Serpent à deux têtes) : l'autre se venge la nuit même
function choisirBande(G, bande) {
  const m = mafia(G);
  if (bande !== m.bande) { m.represailles = m.bande; m.bande = bande; }
  else m.represailles = bande === 'main' ? 'serpent' : 'main';
}

// Les représailles de la nuit : la vitrine, un client qui disparaît, ou l'atelier qui brûle
function represaillesDeLaNuit(G) {
  const m = mafia(G);
  const qui = m.represailles;
  if (!qui) return null;
  m.represailles = null;
  const nom = qui === 'serpent' ? 'Le Serpent à deux têtes' : 'La Main Noire';
  const e = qui === 'serpent' ? '' : 'e';
  const sorte = auHasard(['vitrine', 'client', 'atelier']);
  if (sorte === 'vitrine') {
    payer(G, 25, 'reparations');
    G.reputation -= 0.3;
    return `${nom} est passé${e} cette nuit : ta vitrine est en morceaux. 25 pièces de vitrier, et les passants jasent.`;
  }
  if (sorte === 'client' || !G.tresors.length) {
    G.rumeur = { jour: G.jour, texte: 'disparu' };
    return `${nom} a fait passer le mot : un client ne viendra pas aujourd'hui. Il a « changé d'avis ».`;
  }
  const t = auHasard(G.tresors);
  t.etat = Math.max(0, t.etat - 1);
  if (t.reparation) t.reparation = null;
  return `Un incendie, cette nuit, à l'atelier ! Les flammes ont léché ${t.nom.charAt(0).toLowerCase() + t.nom.slice(1)}. Sur la porte, une marque : ${qui === 'serpent' ? 'deux têtes de serpent' : 'une main noire'}.`;
}

// Sortir de la mafia : racheter sa liberté...
function racheterLiberte(G) {
  const prix = prixRachat(G);
  if (G.argent < prix) return `Ta liberté coûte ${prix} pièces. Tu ne les as pas.`;
  payer(G, prix, 'pizzo');
  mafia(G).sorti = 'rachat';
  G.prets = G.prets.filter(p => p.preteur !== 'La Main Noire');   // (le rachat efface aussi la dette)
  return null;
}
// ... ou tout dénoncer à la Confrérie : la dette est effacée, la lumière t'en sait gré, mais les
// restes de la bande n'oublient pas
function denoncerMafia(G) {
  const m = mafia(G);
  m.sorti = 'denonce';
  m.vengeance = true;
  G.prets = G.prets.filter(p => p.preteur !== 'La Main Noire');
  G.reputation += 2;
  G.reussites.bien = (G.reussites.bien || 0) + 3;
  pencher(G, 'denoncerMafia');
  G.decesAnnonces = G.decesAnnonces || [];
  G.annonceMafia = `Coup de filet de la Confrérie : ${nomBande(G)} démantelé${m.bande === 'serpent' ? '' : 'e'} ! Un commerçant courageux aurait parlé.`;
}

// Chaque nuit : la vengeance des restes de la bande, une fois, au hasard
function vengeanceApresDenonciation(G) {
  const m = mafia(G);
  if (!m.vengeance || Math.random() > 0.15) return null;
  m.vengeance = Math.random() < MAFIA.vengeance;   // (parfois, ils remettent ça)
  m.represailles = m.bande;
  return represaillesDeLaNuit(G);
}

// Chaque nuit : le colis caché repart, les représailles éventuelles, la vengeance après une dénonciation
function nuitMafia(G) {
  const m = mafia(G), lignes = [];
  if (m.colis && m.colis < G.jour) { m.colis = false; lignes.push("Cette nuit, on a frappé trois coups à la porte de derrière : le colis est reparti. Personne n'a rien vu."); }
  const r = represaillesDeLaNuit(G);
  if (r) lignes.push(r);
  const v = vengeanceApresDenonciation(G);
  if (v) lignes.push(v);
  return lignes;
}

// Le détour pour la bande : la prochaine mission a une épreuve de plus (un mauvais coin)
function detourMafia(G, v) {
  const m = mafia(G);
  if (!m.detour || !v.queteId) return null;
  m.detour = false;
  const bandits = Object.values(QUETES).flatMap(q => q.epreuves).find(e => e.type === 'bandits');
  // (une épreuve en plus, que le voyageur n'avait pas demandée : elle ne compte pas dans sa commande)
  if (bandits) v.epreuves.push({ ...bandits, detour: true, intro: "Le détour pour le paquet m'a mené dans un coin mal famé..." });
  return `${v.nom.split(' ')[0]} emporte, sans le savoir, un paquet pour ${nomBande(G)}.`;
}
