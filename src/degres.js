// (feuille de route, point 4 ; Q113, « les degrés restent cachés ») Les degrés cachés d'Ombre et de Lumière.
// Voir docs/histoire/degres-ombre-lumiere.md.
//
// La jauge lumière ⟷ ombre (G.lo.points, regles.js) dit ce que LE MONDE pense de toi : elle est freinée
// quand on s'éloigne du centre, et revenir compte en entier. Les degrés disent à quel point TOI, tu as
// choisi ton camp : c'est l'inverse, s'engager compte en entier, et revenir est de plus en plus dur
// (l'inertie). Ils ne s'affichent jamais. Pour le moment, ils se calculent seulement : ils ne changent
// encore aucun choix offert (ce sera la suite, après validation du joueur).
//
// G.degres = {
//   e      : l'engagement, de −100 (l'ombre) à +100 (la lumière) ;
//   d      : le degré, de −3 (Ombre profonde) à +3 (Lumière ardente), 0 neutre (avec hystérésis) ;
//   tiedeur: ce que coûte de ne jamais choisir (le neutre a lui aussi son point de non-retour) ;
//   graves : les actes graves de chaque côté { bien, mal } ;
//   verrous: les points de non-retour franchis { ancreBien, ancreMal, gravesBien, gravesMal, neutre } (le jour) ;
//   ancre  : les nuits de suite passées au degré ±3 ;
//   vu     : ce qu'on a déjà compté de l'état de la partie (serment, Parrain, Main Noire…) ;
//   histo  : les derniers changements de degré (pour le mode de débogage) ;
//   jourGestes : { jour, bien, mal } les gestes du jour (pour la tiédeur) }

const DEGRES = {
  '-3': { id: 'ombreProfonde', nom: 'Ombre profonde' },
  '-2': { id: 'ombre', nom: 'Ombre' },
  '-1': { id: 'ombreTiede', nom: 'Ombre tiède' },
  0: { id: 'neutre', nom: 'Neutre' },
  1: { id: 'lumiereTiede', nom: 'Lumière tiède' },
  2: { id: 'lumiere', nom: 'Lumière' },
  3: { id: 'lumiereArdente', nom: 'Lumière ardente' },
};

const REGLES_DEGRES = {
  seuils: [12, 35, 65],        // |engagement| pour ENTRER dans le degré 1, 2, 3 de son côté
  hysteresis: 6,               // pour en SORTIR, il faut redescendre de 6 sous le seuil d'entrée
  // l'élan : s'enfoncer dans son camp (plus on est loin, moins chaque geste compte : on ne devient pas
  // ardent en vendant des cordes)
  elan: [[12, 1], [35, 0.6], [65, 0.3], [Infinity, 0.15]],
  // l'inertie : revenir vers le centre (ou passer de l'autre côté), de plus en plus dur
  inertie: [[15, 1], [40, 0.75], [70, 0.5], [Infinity, 0.35]],
  // le dernier degré (Lumière ardente, Ombre profonde) ne s'atteint pas par le seul volume : il faut avoir
  // juré à ce camp, ou y avoir commis assez d'actes graves de plus que de l'autre côté (le zèle est constant :
  // celui qui dénonce un jour et cache le lendemain n'est pas ardent). Sinon l'engagement plafonne juste en dessous.
  extreme: { graves: 4 },
  // le centre attire ceux qui ne font rien : une nuit sans geste, sous ce seuil, l'engagement s'effrite
  attraitCentre: { sous: 18, garde: 0.96 },
  // les gestes du barème (BAREME_CAMP), pesés selon ce qu'ils engagent, pas selon ce qu'en dit le monde
  poids: {
    mendiant: 0.5, soigner: 1, dedommager: 0.5, decoClaire: 1, missionL: 1, denoncer: 5, denoncerMafia: 8, routeAider: 1,
    ame: 1.5, piege: 3, miseNoire: 2, commande: 2, decoSombre: 1, missionO: 1.5, cacher: 5, routeSergent: 1, routeRancon: 2,
  },
  // les gestes graves (ceux qu'on ne défait pas) : le compte mène à un point de non-retour. (Une âme
  // « offerte » n'en est pas un : la plupart sont des envois sans chance, presque des accidents ; le sabotage
  // de la Faucheuse, lui, en est un, voir `etat`.)
  graves: { denoncer: 1, denoncerMafia: 2, cacher: 1 },
  // ce qui se lit chaque nuit dans l'état de la partie (des choix qui ne passent pas par le barème)
  etat: {
    serment: 10,                                  // prêter serment au Carrefour (de son côté)
    parjure: 0.5,                                 // rompre son serment : l'engagement est coupé de moitié
    parrain: { bague: -10, taire: -4, changer: 3, denoncer: 10 },   // la révélation du Parrain
    rangMafia: -4,                                // chaque grade gagné dans la Main Noire (ou le Serpent)
    liberteMafia: 3,                              // se racheter auprès d'elle
    eprise: -5,                                   // la Faucheuse éprise de toi
    sabotage: -6,                                 // une âme pure piégée pour la Faucheuse (un acte grave, ×2)
    mecenat: 3,                                   // un palier du mécénat du Grand Sage
    projet: 3,                                    // un chantier de la Confrérie (+) ou du repaire (−)
  },
  // la tiédeur : ne pas choisir finit, lui aussi, par compter
  tiedeur: {
    epoque: { jour: 30, pieces: 3 },              // on ne compte qu'à partir de là (le Carrefour approche)
    nuitNeutre: 1,                                // chaque nuit au degré neutre
    nuitDeuxCamps: 0.5,                           // une journée à donner aux deux camps
    carrefourLibre: 12,                           // « rester libre » au Carrefour
    pacteParrain: 10,                             // le pacte de neutralité avec le Parrain
    mecenatNeutre: 6,                             // un palier du prix de la neutralité
    erosion: 0.5,                                 // chaque point d'engagement gagné ronge la tiédeur d'autant ×0,5
  },
  // les points de non-retour
  nonRetour: {
    ancre: 21,                                    // 21 nuits de suite au degré ±3 : on ne redevient plus neutre (±1 au moins)
    graves: 8,                                    // 8 actes graves d'un côté (et l'âme de ce côté) : de même
                                                  // (les deux verrous du même côté : on ne redescend plus sous ±2)
    neutre: { tiedeur: 45, pieces: 6 },           // tiédeur 45 et 6 pièces : le neutre ne peut plus que rester neutre
  },
};

function etatDegres(G) {
  if (!G.degres) G.degres = degresDepuisLaPartie(G);
  return G.degres;
}

// Une partie qui n'a pas encore de degrés (une vieille sauvegarde, ou une partie neuve) : on les déduit de
// ce qu'elle a déjà vécu, sans rien lui faire perdre. La jauge donne le sens, le serment et le camp scellé
// donnent la profondeur.
function degresDepuisLaPartie(G) {
  const R = REGLES_DEGRES, j = (G.lo && G.lo.points) || 0, serment = G.lo && G.lo.serment;
  let e = j * 0.7;
  if (serment) e += (serment === 'bien' ? 1 : -1) * R.etat.serment;
  const D = { e: 0, d: 0, tiedeur: 0, graves: { bien: 0, mal: 0 }, verrous: {}, ancre: 0, vu: {}, histo: [], jourGestes: null, v: 1 };
  D.e = Math.max(-100, Math.min(100, e));
  // la tiédeur d'un neutre déjà avancé : les nuits passées depuis l'époque du Carrefour, sans les connaître une à une
  const T = R.tiedeur;
  if (Math.abs(D.e) < R.seuils[0] && G.jour > T.epoque.jour) D.tiedeur = Math.min(R.nonRetour.neutre.tiedeur - 1, (G.jour - T.epoque.jour) * T.nuitNeutre);
  if (G.lo && G.lo.offres) for (const o of Object.values(G.lo.offres)) if (o === 'refusee' || o === 'refuseeDef') D.tiedeur += T.carrefourLibre;
  // les actes graves d'avant : les recherchés livrés (on ne sait pas combien on en a caché)
  D.graves.bien = (G.captures || []).length;
  // ce qui est déjà compté dans l'engagement de départ ne se recompte pas la première nuit
  D.vu = etatVuDegres(G);
  D.d = degreBrut(D.e);
  appliquerVerrousDegres(G, D);
  return D;
}

// Ce que la nuit compare à la veille : un instantané des choix lisibles dans la partie
function etatVuDegres(G) {
  const lo = G.lo || {}, m = G.mafia || {}, mec = G.mecenat || { paliers: [] };
  const projets = x => x ? Object.keys(x.bati || {}).length + (x.chantier ? 1 : 0) : 0;
  return {
    serment: lo.serment || null, parjures: lo.parjures || 0,
    refus: Object.values(lo.offres || {}).filter(o => o === 'refusee' || o === 'refuseeDef').length,
    parrain: (G.parrain && G.parrain.choix) || null,
    rangMafia: typeof rangMafia === 'function' && G.mafia ? rangMafia(G) : 0, sortiMafia: m.sorti || null,
    eprise: !!(G.faucheuse && typeof seductionFaucheuse === 'function' && seductionFaucheuse(G).proches),
    sabotages: (G.faucheuse && G.faucheuse.sabotages) || 0,
    mecenat: (mec.paliers || []).length, confrerie: projets(G.confrerie), repaire: projets(G.repaire),
  };
}

// Le degré « brut » d'un engagement, sans hystérésis
function degreBrut(e) {
  const n = REGLES_DEGRES.seuils.filter(s => Math.abs(e) >= s).length;
  return Math.sign(e) * n;
}

// Le degré, avec l'hystérésis : on entre au seuil, on ne sort qu'un peu en dessous
function degreAvecHysteresis(d, e) {
  const R = REGLES_DEGRES, brut = degreBrut(e);
  if (d === 0 || Math.sign(brut) === Math.sign(d) && Math.abs(brut) >= Math.abs(d)) return brut;
  let x = d;
  while (x !== 0 && Math.sign(x) * e < R.seuils[Math.abs(x) - 1] - R.hysteresis) x -= Math.sign(x);
  return x === 0 ? brut : x;
}

// Les planchers et plafonds des points de non-retour : renvoie [min, max] du degré
function bornesDegres(G, D) {
  let min = -3, max = 3;
  const v = D.verrous;
  if (G.sceauNeutre || v.neutre) return [0, 0];
  if (G.camp === 'bien') min = Math.max(min, 1);
  if (G.camp === 'mal') max = Math.min(max, -1);
  const nb = (v.ancreBien ? 1 : 0) + (v.gravesBien ? 1 : 0), nm = (v.ancreMal ? 1 : 0) + (v.gravesMal ? 1 : 0);
  if (nb) min = Math.max(min, nb);
  if (nm) max = Math.min(max, -nm);
  const s = G.lo && G.lo.serment;
  if (s === 'bien') min = Math.max(min, 1);
  if (s === 'mal') max = Math.min(max, -1);
  // (deux verrous opposés, par exemple un ancrage d'un côté puis un serment de l'autre : le camp scellé
  // l'emporte, puis le serment, puis le sens de l'engagement)
  if (min > max) {
    const cote = G.camp ? (G.camp === 'bien' ? 1 : -1) : s ? (s === 'bien' ? 1 : -1) : (D.e >= 0 ? 1 : -1);
    return cote > 0 ? [min, 3] : [-3, max];
  }
  return [min, max];
}

// Ramène l'engagement et le degré dans les bornes (un verrou tient l'engagement au seuil de son plancher)
function appliquerVerrousDegres(G, D) {
  const R = REGLES_DEGRES, [min, max] = bornesDegres(G, D);
  // (le plafond du dernier degré, tant qu'on n'a ni juré ni commis assez d'actes graves de ce côté)
  const s = G.lo && G.lo.serment, haut = R.seuils[2] - 1;
  const net = (D.graves.bien || 0) - (D.graves.mal || 0);
  if (D.e > haut && s !== 'bien' && net < R.extreme.graves) D.e = haut;
  if (D.e < -haut && s !== 'mal' && -net < R.extreme.graves) D.e = -haut;
  if (min === 0 && max === 0) D.e = Math.max(-(R.seuils[0] - 1), Math.min(R.seuils[0] - 1, D.e));
  if (min > 0) D.e = Math.max(D.e, R.seuils[min - 1]);
  if (max < 0) D.e = Math.min(D.e, -R.seuils[-max - 1]);
  D.d = Math.max(min, Math.min(max, D.d));
}

// L'engagement bouge de `delta` (signé, + lumière), avec l'élan ou l'inertie selon le sens
function engagerDegres(G, delta, pourquoi) {
  if (!delta) return 0;
  const R = REGLES_DEGRES, D = etatDegres(G), avant = D.e;
  const facteur = table => table.find(([s]) => Math.abs(D.e) < s)[1];
  const versLeCentre = D.e !== 0 && Math.sign(delta) !== Math.sign(D.e);
  D.e = Math.max(-100, Math.min(100, D.e + delta * facteur(versLeCentre ? R.inertie : R.elan)));
  const gagne = Math.abs(D.e) - Math.abs(avant);
  if (gagne > 0) D.tiedeur = Math.max(0, D.tiedeur - gagne * R.tiedeur.erosion);
  majDegre(G, D, pourquoi);
  return D.e - avant;
}

function majDegre(G, D, pourquoi) {
  const avant = D.d;
  D.d = degreAvecHysteresis(D.d, D.e);
  appliquerVerrousDegres(G, D);
  if (D.d !== avant) {
    D.histo.unshift({ jour: G.jour, de: avant, a: D.d, pourquoi: pourquoi || '' });
    if (D.histo.length > 30) D.histo.length = 30;
  }
}

// Assez d'actes graves d'un côté, ET l'âme de ce côté-là : on ne redescendra plus sous ±1. (Des actes graves
// commis de l'autre côté de son degré attendent : le verrou se ferme le jour où l'on y passe.)
function verrousDesGraves(G, D) {
  const n = REGLES_DEGRES.nonRetour.graves;
  if (!D.verrous.gravesBien && D.graves.bien >= n && D.d >= 1) { D.verrous.gravesBien = G.jour; majDegre(G, D, 'non-retour : actes graves'); }
  if (!D.verrous.gravesMal && D.graves.mal >= n && D.d <= -1) { D.verrous.gravesMal = G.jour; majDegre(G, D, 'non-retour : actes graves'); }
}

// (appelé par pencher, regles.js) un geste du barème
function noterDegre(G, cle, fois = 1) {
  const R = REGLES_DEGRES, b = typeof BAREME_CAMP !== 'undefined' && BAREME_CAMP[cle];
  if (!b || fois <= 0) return;
  const D = etatDegres(G), sg = b.camp === 'bien' ? 1 : -1;
  const w = R.poids[cle] != null ? R.poids[cle] : b.n;
  for (let k = 0; k < fois; k++) engagerDegres(G, sg * w, cle);
  if (R.graves[cle]) { D.graves[b.camp] = (D.graves[b.camp] || 0) + R.graves[cle] * fois; verrousDesGraves(G, D); }
  if (!D.jourGestes || D.jourGestes.jour !== G.jour) D.jourGestes = { jour: G.jour, bien: 0, mal: 0 };
  D.jourGestes[b.camp] += fois;
}

// Chaque nuit (regles.js, nuit) : les choix lus dans l'état de la partie, la tiédeur, l'attrait du centre,
// les points de non-retour
function nuitDesDegres(G) {
  const R = REGLES_DEGRES, E = R.etat, T = R.tiedeur, D = etatDegres(G), vu = D.vu || {}, now = etatVuDegres(G);
  // le serment, le parjure
  if (now.serment && now.serment !== vu.serment) engagerDegres(G, (now.serment === 'bien' ? 1 : -1) * E.serment, 'serment');
  if (now.parjures > (vu.parjures || 0)) { D.e *= E.parjure; majDegre(G, D, 'parjure'); }
  // le Carrefour refusé, le Parrain
  if (now.refus > (vu.refus || 0)) D.tiedeur += T.carrefourLibre * (now.refus - (vu.refus || 0));
  if (now.parrain && now.parrain !== vu.parrain) {
    if (now.parrain === 'pacte') D.tiedeur += T.pacteParrain;
    else if (E.parrain[now.parrain]) engagerDegres(G, E.parrain[now.parrain], 'Parrain : ' + now.parrain);
    if (now.parrain === 'denoncer') D.graves.bien += 2;
    if (now.parrain === 'bague') D.graves.mal += 2;
  }
  // la Main Noire, la Faucheuse
  if (now.rangMafia > (vu.rangMafia || 0)) engagerDegres(G, E.rangMafia * (now.rangMafia - (vu.rangMafia || 0)), 'Main Noire : grade');
  if (now.sortiMafia === 'rachete' && vu.sortiMafia !== 'rachete') engagerDegres(G, E.liberteMafia, 'Main Noire : rachat');
  if (now.eprise && !vu.eprise) engagerDegres(G, E.eprise, 'la Faucheuse, éprise');
  if (now.sabotages > (vu.sabotages || 0)) { const n = now.sabotages - (vu.sabotages || 0); engagerDegres(G, E.sabotage * n, 'sabotage'); D.graves.mal += 2 * n; }
  // ce qu'on donne : le mécénat (le Grand Sage, ou la neutralité), les chantiers de la Confrérie et du repaire
  if (now.mecenat > (vu.mecenat || 0)) {
    const n = now.mecenat - (vu.mecenat || 0), neutre = typeof regimeDesRiches === 'function' && regimeDesRiches(G) === 'neutre';
    if (neutre) D.tiedeur += T.mecenatNeutre * n; else engagerDegres(G, E.mecenat * n, 'mécénat');
  }
  if (now.confrerie > (vu.confrerie || 0)) engagerDegres(G, E.projet * (now.confrerie - (vu.confrerie || 0)), 'chantier de la Confrérie');
  if (now.repaire > (vu.repaire || 0)) engagerDegres(G, -E.projet * (now.repaire - (vu.repaire || 0)), 'chantier du repaire');
  D.vu = now;
  // la journée : rien fait (le centre attire), ou les deux camps servis (la tiédeur)
  const g = D.jourGestes && D.jourGestes.jour === G.jour ? D.jourGestes : { bien: 0, mal: 0 };
  if (!g.bien && !g.mal && Math.abs(D.e) < R.attraitCentre.sous) D.e *= R.attraitCentre.garde;
  const pieces = (G.armure || []).length;
  const epoque = G.jour >= T.epoque.jour || pieces >= T.epoque.pieces;
  if (epoque && !G.camp) {
    if (g.bien && g.mal) D.tiedeur += T.nuitDeuxCamps;
    majDegre(G, D, 'nuit');
    if (D.d === 0) D.tiedeur += T.nuitNeutre;
  } else majDegre(G, D, 'nuit');
  // les points de non-retour
  const NR = R.nonRetour;
  verrousDesGraves(G, D);
  if (Math.abs(D.d) === 3) D.ancre++; else D.ancre = 0;
  if (D.ancre >= NR.ancre) { const k = D.d > 0 ? 'ancreBien' : 'ancreMal'; if (!D.verrous[k]) D.verrous[k] = G.jour; }
  if (!D.verrous.neutre && !G.camp && D.d === 0 && D.tiedeur >= NR.neutre.tiedeur && pieces >= NR.neutre.pieces && !(G.lo && G.lo.serment)) D.verrous.neutre = G.jour;
  majDegre(G, D, 'nuit');
}

function degreDe(G) { return etatDegres(G).d; }
function nomDegre(G) { return DEGRES[degreDe(G)].nom; }

// Les fins qui restent possibles depuis ce degré (proposition, docs/histoire/degres-ombre-lumiere.md :
// une lecture pour le débogage, rien dans le jeu ne s'en sert encore)
const FINS_PAR_DEGRE = {
  '-3': ['O1', 'O2', 'O3', 'R', 'E'],
  '-2': ['O1', 'O2', 'O3', 'R', 'E'],
  '-1': ['O1', 'O2', 'O3', 'N1', 'N2', 'N3', 'R', 'E'],
  0: ['N1', 'N2', 'N3'],
  1: ['L1', 'L2', 'L3', 'N1', 'N2', 'N3', 'R', 'E'],
  2: ['L1', 'L2', 'L3', 'R', 'E'],
  3: ['L1', 'L4'],
};
function finsPossiblesDegres(G) { return FINS_PAR_DEGRE[degreDe(G)]; }

// --- Le mode de débogage (jamais visible en jeu normal) ---
// Dans la console : lireDegres(). Ou, pour un petit cadre qui reste à l'écran : ajouter « ?degres » à
// l'adresse de la page (ou localStorage « debug.degres » = « 1 »).
function lireDegres(G = typeof window !== 'undefined' ? window.GAME : null) {
  if (!G) return null;
  const D = etatDegres(G);
  return {
    degre: D.d, nom: DEGRES[D.d].nom, engagement: Math.round(D.e * 10) / 10, jauge: G.lo ? Math.round(G.lo.points) : 0,
    tiedeur: Math.round(D.tiedeur * 10) / 10, graves: { ...D.graves }, ancre: D.ancre,
    verrous: Object.keys(D.verrous).filter(k => D.verrous[k]).map(k => `${k} (jour ${D.verrous[k]})`),
    bornes: bornesDegres(G, D), fins: finsPossiblesDegres(G), derniers: D.histo.slice(0, 5),
  };
}
function debogageDegresDemande() {
  try {
    if (typeof location !== 'undefined' && /[?&]degres\b/.test(location.search)) return true;
    return typeof localStorage !== 'undefined' && localStorage.getItem('debug.degres') === '1';
  } catch (e) { return false; }
}
function afficherDebogageDegres() {
  if (typeof document === 'undefined' || document.getElementById('debogage-degres')) return;
  const el = document.createElement('div');
  el.id = 'debogage-degres';
  el.style.cssText = 'position:fixed;left:6px;bottom:6px;z-index:9999;max-width:330px;padding:6px 8px;border-radius:4px;' +
    'background:rgba(10,8,14,.82);color:#e8e0cc;font:11px/1.35 monospace;white-space:pre-wrap;pointer-events:none';
  document.body.appendChild(el);
  setInterval(() => {
    const G = window.GAME;
    if (!G || !G.lo) { el.textContent = 'degrés : pas de partie'; return; }
    try {
      const L = lireDegres(G);
      el.textContent = `DEGRÉ ${L.degre > 0 ? '+' : ''}${L.degre} · ${L.nom}\nengagement ${L.engagement} · jauge ${L.jauge}\n` +
        `tiédeur ${L.tiedeur} · graves ☀${L.graves.bien} ☾${L.graves.mal} · ancre ${L.ancre}\n` +
        `bornes [${L.bornes.join(', ')}]${L.verrous.length ? ' · ' + L.verrous.join(', ') : ''}\nfins ${L.fins.join(' ')}` +
        (L.derniers.length ? `\n${L.derniers.slice(0, 3).map(h => `j${h.jour} ${h.de}→${h.a} ${h.pourquoi}`).join('\n')}` : '');
    } catch (e) { el.textContent = 'degrés : ' + e.message; }
  }, 500);
}
if (typeof window !== 'undefined' && typeof document !== 'undefined' && debogageDegresDemande()) {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', afficherDebogageDegres);
  else afficherDebogageDegres();
}
