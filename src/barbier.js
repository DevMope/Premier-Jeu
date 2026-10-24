// (v1.48, planches 72 et 72 v2 validées) Le barbier de la rue : « Le Fil d'Argent », la boutique d'Orvin
// Tresse-d'Argent, nain des Monts. Volets cloués avant tes 18 ans ; le matin de tes 18 ans, il ouvre (premier
// rasage offert). Dès 18 ans, la barbe d'un garçon (ou les cheveux d'une fille) pousse d'elle-même si on ne
// l'entretient pas, jusqu'au plus gros modèle ; gardé trop longtemps, il se néglige (en bataille, sale, à
// l'abandon). Chez Orvin : laver et peigner, tailler, raser, changer de coupe ou de barbe, et les anneaux de fête.

const BARBIER = {
  age: 18,
  pas: 12,             // un cran de barbe tous les 12 jours sans entretien
  pasCheveux: 18,      // les cheveux poussent un peu moins vite (un cran tous les 18 jours)
  negligence: [20, 40, 60],   // jours au plus gros modèle : en bataille, sale, à l'abandon
  prix: { laver: 10, tailler: 15, raser: 10, barbe: 15, coupe: 20, couleur: 15, anneau: 25 },
};
const FIGURANT_BARBIER = 'barbier';
// La barbe qui pousse : du rasé au plus gros modèle (les autres formes la rejoignent à leur longueur)
const CHAINE_BARBE = [null, 'troisJours', 'troisJoursLongue', 'courteNette', 'complete', 'pleine', 'garibaldi', 'bandholz'];
const LONGUEUR_BARBE = { rase: 1, troisJours: 1, troisJoursLongue: 2, courte: 3, courteNette: 3, collier: 3, complete: 4, pleine: 5, ducktail: 5, fourchette: 6, garibaldi: 6, bandholz: 7 };
// Les cheveux d'une fille : lisses (court, carré, long, très long) ou bouclés (boucles courtes, boucles, grand afro)
const CHAINE_CHEVEUX = { lisses: ['court', 'carre', 'long', 'longLisse'], boucles: ['afroDegrade', 'boucles', 'afro'] };
const CHEVEUX_BOUCLES = ['afroDegrade', 'boucles', 'afro', 'couettes'];
const LONGUEUR_CHEVEUX = { court: 0, militaire: 0, degrade: 0, bol: 0, herisse: 0, pointes: 0, iroquoise: 0, degarni: 0, afroDegrade: 0,
  carre: 1, frange: 1, boucles: 1, long: 2, tresses: 2, nattes: 2, couettes: 2, chignonHaut: 2, chignonHomme: 2, viking: 2, afro: 2, longLisse: 3 };
const NOMS_NEGLIGENCE = ['bien peignée', 'en bataille', 'sale', 'à l’abandon'];
// Les anneaux de fête (planche 72, image 7) : un par fête passée avec les siens, portés pendant leur fête
const ANNEAUX_FETE = { anneauArgent: 'solstice', anneauOr: 'hiver', anneauFer: 'brumes' };
Object.assign(GARDE_ROBE, {
  anneauArgent: { fete: 'solstice', barbier: true, nom: "Anneau d'argent du Solstice", prix: 25, effet: 'Pendant le Solstice : les nains et tes habitués t’en aiment un peu plus (+1 de relation).' },
  anneauOr: { fete: 'hiver', barbier: true, nom: "Anneau d'or du Long Hiver", prix: 25, effet: 'Pendant le Long Hiver : les nains et tes habitués t’en aiment un peu plus (+1 de relation).' },
  anneauFer: { fete: 'brumes', barbier: true, nom: 'Anneau de fer noir des Brumes', prix: 25, effet: 'Pendant la Nuit des Brumes : les nains et tes habitués t’en aiment un peu plus (+1 de relation).' },
});

function barbierOuvert(G) { return !!G && !!G.joueur && ageJoueur(G) >= BARBIER.age; }
function etatBarbier(G) { G.barbier = G.barbier || { vu: false, premierRasage: false, ouvertureVue: false }; return G.barbier; }

// Où en est la pousse : { cible: 'barbe'|'cheveux', base, longueur, max, id, negligence, prochain } (ou null avant 18 ans)
function etatPilosite(G) {
  if (!barbierOuvert(G)) return null;
  const ap = G.joueur.apparence, f = G.joueur.feminin;
  const p = G.pilosite = G.pilosite || { entretien: G.jour, lave: G.jour };
  if (!f) {
    const choisi = BARBES_IDS[ap.barbe] || null, base = choisi ? (LONGUEUR_BARBE[choisi] ?? 2) : 0, max = CHAINE_BARBE.length - 1;
    return pousse(G, p, 'barbe', choisi, base, max, BARBIER.pas, l => CHAINE_BARBE[l]);
  }
  const choisi = COIFFURES_IDS[ap.coiffure] || 'court';
  if (choisi === 'chauve') return { cible: 'cheveux', base: 0, longueur: 0, max: 0, id: choisi, negligence: 0, prochain: null };   // (une tête rasée reste rasée)
  const chaine = CHEVEUX_BOUCLES.includes(choisi) ? CHAINE_CHEVEUX.boucles : CHAINE_CHEVEUX.lisses;
  const base = Math.min(LONGUEUR_CHEVEUX[choisi] ?? 1, chaine.length - 1);
  return pousse(G, p, 'cheveux', choisi, base, chaine.length - 1, BARBIER.pasCheveux, l => chaine[l]);
}
function pousse(G, p, cible, choisi, base, max, pas, forme) {
  const jours = Math.max(0, G.jour - p.entretien), crans = Math.floor(jours / pas);
  const longueur = Math.min(max, base + crans);
  const id = longueur > base ? forme(longueur) : choisi;   // (en poussant, une forme taillée se perd)
  const jourMax = p.entretien + Math.max(0, max - base) * pas;
  const auMax = longueur >= max ? G.jour - Math.max(jourMax, p.lave) : -1;
  const negligence = auMax < 0 ? 0 : BARBIER.negligence.filter(n => auMax >= n).length;
  const prochain = longueur < max ? pas - (jours % pas) : null;
  return { cible, base, longueur, max, id, negligence, prochain };
}
// L'apparence telle qu'on la voit aujourd'hui (la barbe ou les cheveux poussés, les marques du temps)
function apparenceJoueur(G) {
  const ap = G.joueur.apparence, e = etatPilosite(G);
  if (!e) return ap;
  const r = { ...ap, negligence: e.negligence, cibleNegligence: e.cible };
  if (e.cible === 'barbe') r.barbe = Math.max(0, BARBES_IDS.indexOf(e.id));
  else r.coiffure = Math.max(0, COIFFURES_IDS.indexOf(e.id));
  return r;
}
// (pour redessiner le joueur quand sa barbe change)
function signaturePilosite(G) { const e = etatPilosite(G); return e ? `${e.id}:${e.negligence}` : ''; }
function nomPousse(e) {
  if (e.cible === 'barbe') return e.id ? (APPARENCE.barbe[BARBES_IDS.indexOf(e.id)] || e.id) : 'rasée';
  return APPARENCE.coiffure[COIFFURES_IDS.indexOf(e.id)] || e.id;
}

// --- Chez Orvin ---
function payerBarbier(G, cle, gratuit = false) {
  const prix = gratuit ? 0 : BARBIER.prix[cle];
  if (prix && !peutPayer(G, prix)) return manqueArgent(G, prix, "Pas assez d'argent.");
  if (prix) payer(G, prix, 'barbier');
  return null;
}
function laverBarbe(G) { const r = payerBarbier(G, 'laver'); if (r) return r; G.pilosite.lave = G.jour; noterPilositeVue(G); return null; }
// Tailler : la barbe (ou la coupe) reprend la forme choisie, la pousse repart de zéro
function taillerBarbe(G, gratuit = false) { const r = payerBarbier(G, 'tailler', gratuit); if (r) return r; G.pilosite.entretien = G.pilosite.lave = G.jour; noterPilositeVue(G); return null; }
function raserBarbe(G, gratuit = false) { const r = payerBarbier(G, 'raser', gratuit); if (r) return r; G.joueur.apparence.barbe = 0; G.pilosite.entretien = G.pilosite.lave = G.jour; noterPilositeVue(G); return null; }
// Un nouveau reflet choisi dans le fauteuil : coiffure, couleur, barbe (chacun se paie à part)
function prixChangement(G, avant, apres, premierGratuit = false) {
  let p = 0;
  if (apres.coiffure !== avant.coiffure) p += BARBIER.prix.coupe;
  if (apres.cheveux !== avant.cheveux || (apres.couleurBarbe || 0) !== (avant.couleurBarbe || 0)) p += BARBIER.prix.couleur;
  if (apres.barbe !== avant.barbe && !premierGratuit) p += BARBIER.prix.barbe;
  return p;
}
function changerApparenceBarbier(G, apres, prix) {
  if (prix && !peutPayer(G, prix)) return manqueArgent(G, prix, "Pas assez d'argent.");
  if (prix) payer(G, prix, 'barbier');
  const avant = G.joueur.apparence;
  G.joueur.apparence = { ...avant, ...apres };
  // (v1.49) une nouvelle coupe ou une nouvelle barbe repart de zéro ; une couleur seule ne lave ni ne taille rien
  if (apres.coiffure !== avant.coiffure || apres.barbe !== avant.barbe) G.pilosite.entretien = G.pilosite.lave = G.jour;
  noterPilositeVue(G);
  return null;
}
// (v1.49) Après un service, le réveil ne doit pas croire que « ça a poussé » : on note ce qu'on voit maintenant
function noterPilositeVue(G) { const e = etatPilosite(G); if (e && G.pilosite) G.pilosite.vu = { id: e.id, negligence: e.negligence }; }
function acheterAnneau(G, id) {
  if (possede(G, id)) return 'Tu l’as déjà.';
  const r = payerBarbier(G, 'anneau'); if (r) return r;
  G.garderobe = [...(G.garderobe || G.tenue || []), id];
  G.tenue = [...(G.tenue || []), id];
  return null;
}

// --- Le matin : la barbe a poussé, elle se néglige ; le jour des 18 ans, Orvin ouvre ---
function matinPilosite(G) {
  const l = [];
  if (!barbierOuvert(G)) return l;
  const b = etatBarbier(G);
  if (!b.ouvertureVue && !b.vu) {
    b.ouvertureVue = G.jour;
    // (v1.49) une vieille partie déjà adulte : Orvin vient de s'installer, ce n'est pas l'anniversaire
    b.anniversaire = 15 + Math.floor((G.jour - 2 + (G.decalageJours || 0)) / 112) < BARBIER.age;
    l.push(b.anniversaire ? "Dans ta rue, les volets cloués du « Fil d'Argent » sont tombés : Orvin, le barbier nain, ouvre aujourd'hui. Le premier rasage est offert." : "Dans ta rue, un barbier nain vient de s'installer : Orvin, au « Fil d'Argent ». Le premier rasage est offert.");
  }
  const e = etatPilosite(G); if (!e) return l;
  const p = G.pilosite, avant = p.vu || { id: e.id, negligence: e.negligence };
  const quoi = e.cible === 'barbe' ? 'Ta barbe' : 'Tes cheveux';
  if (e.id !== avant.id) l.push(`${quoi} ${e.cible === 'barbe' ? 'a' : 'ont'} poussé : ${e.cible === 'barbe' ? 'la voici' : 'les voici'} « ${nomPousse(e)} ».${e.longueur >= e.max ? ' C’est le plus gros modèle.' : ''} (Chez Orvin : tailler, ${BARBIER.prix.tailler} p.)`);
  else if (e.negligence > avant.negligence) l.push(`${quoi} ${['', e.cible === 'barbe' ? 'est en bataille : des mèches rebiquent partout' : 'sont en bataille : des mèches rebiquent partout', e.cible === 'barbe' ? 'est sale : des miettes, une brindille...' : 'sont sales : des brindilles, des nœuds...', e.cible === 'barbe' ? 'est à l’abandon : une mouche y a élu domicile' : 'sont à l’abandon : une mouche y a élu domicile'][e.negligence]}. (Chez Orvin : laver et peigner, ${BARBIER.prix.laver} p.)`);
  p.vu = { id: e.id, negligence: e.negligence };
  return l;
}

// --- Les clients le remarquent (une fois par jour et par client, via remarqueCamp) ---
function remarqueBarbe(G, v) {
  // les anneaux de fête, portés pendant leur fête : les nains et les habitués aiment
  const f = typeof feteDuJour === 'function' ? feteDuJour(G) : null;
  if (f) { const anneau = Object.keys(ANNEAUX_FETE).find(id => ANNEAUX_FETE[id] === f.id && porte(G, id));
    if (anneau && (v.race === 'nain' || niveauRelation(G, v.nom).index >= 4)) { changerRelation(G, v.nom, 1); return v.race === 'nain' ? 'Un anneau de fête ! Tu connais nos coutumes, toi. Bonne fête, l’ami.' : 'Joli, cet anneau de fête. Ça te va bien.'; } }
  const e = etatPilosite(G); if (!e) return null;
  if (e.negligence >= 2 && (v.prestige || v.costume === 'noble' || v.costume === 'gardien') && Math.random() < 0.6) { changerRelation(G, v.nom, -1); return e.cible === 'barbe' ? 'Hum... Il y a des miettes dans votre barbe. Je ne dis rien, je constate.' : 'Hum... Un coup de peigne ne vous ferait pas de mal.'; }
  if (e.cible === 'barbe' && v.race === 'nain' && e.longueur >= 5 && Math.random() < 0.4) { changerRelation(G, v.nom, 1); return e.negligence >= 2 ? 'Belle barbe ! Un peu sauvage, mais belle.' : 'Par ma barbe, quelle barbe ! On te prendrait pour un des nôtres.'; }
  if (e.negligence >= 3 && Math.random() < 0.3) return 'Euh... il y a une mouche qui tourne autour de toi. Non, ne bouge pas, elle va partir.';
  return null;
}

// --- Les marques du temps, peintes sur le dessin du joueur (barbe ou cheveux), sous tous les angles ---
function negligerToile(t, niveau, cible) {
  if (!niveau) return;
  const pts = [];
  for (let y = 0; y < t.h; y++) for (let x = 0; x < t.l; x++) if (t.m[y * t.l + x] === cible) pts.push([x, y]);
  if (!pts.length) return;
  t.rampes.miette = rampe(0xd8b878); t.rampes.feuilleN = rampe(0x5a8a3a); t.rampes.grisN = rampe(0x9a9890); t.rampes.moucheN = rampe(0x202024); t.rampes.blancN = rampe(0xf0f0f4);
  let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1; for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, k = Math.max(1, Math.round((typeof FINESSE !== 'undefined' ? FINESSE : 2) / 2));
  const vide = (x, y) => t.dans(x, y) && t.c[y * t.l + x] === null;
  const bord = pts.filter(([x, y]) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => vide(x + dx, y + dy)));
  // des mèches qui rebiquent, vers l'extérieur
  const nb = [0, 12, 18, 24][niveau];
  for (let i = 0; i < nb && bord.length; i++) {
    const [x, y] = bord[Math.floor(hachage(i, 1, 7601) * bord.length)];
    const dx = Math.sign(x - cx) || 1, dy = y > cy ? 1 : (hachage(i, 2, 7601) > 0.5 ? -1 : 0), len = (2 + Math.floor(hachage(i, 3, 7601) * (2 + niveau))) * k;
    for (let s = 1; s <= len; s++) { const px = x + dx * s, py = y + Math.round(dy * s * 0.6); if (vide(px, py)) t.poser(px, py, cible, s % 2 ? 4 : 1); }
  }
  const dedans = (i, g) => pts[Math.floor(hachage(i, g, 7602) * pts.length)];
  if (niveau >= 2) {
    for (let i = 0; i < 10; i++) { const [x, y] = dedans(i, 4); for (let a = 0; a < k; a++) for (let b = 0; b < k; b++) t.poser(x + a, y + b, 'miette', 5 - ((a + b) % 2)); }
    for (let i = 0; i < 14; i++) { const [x, y] = dedans(i, 5); t.poser(x, y, cible, 0); }
    const [bx, by] = dedans(1, 6); for (let s = 0; s < 4 * k; s++) t.poser(bx + s, by - Math.round(s * 0.5), 'cheneSombre' in t.rampes ? 'cheneSombre' : cible, 1);
    const [fx, fy] = dedans(2, 7); for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1], [2, 1]]) t.poser(fx + a * k, fy + b * k, 'feuilleN', 3);
  }
  if (niveau >= 3) {
    for (let i = 0; i < 3; i++) { const [nx, ny] = dedans(i, 8); for (let a = 0; a < 10; a++) t.poser(Math.round(nx + Math.cos(a / 10 * 6.283) * 1.6 * k), Math.round(ny + Math.sin(a / 10 * 6.283) * 1.6 * k), cible, 0); }
    for (let i = 0; i < 30; i++) { const [x, y] = dedans(i, 9); t.poser(x, y, 'grisN', 3); }
    // une mouche qui tourne autour (sur le vide, en haut à droite de la barbe ou des cheveux)
    const mx = Math.min(t.l - 3, x1 + 3 * k), my = Math.max(2, y0 + (cible === 'barbe' ? 2 * k : 0));
    for (const [a, b, m, n] of [[0, 0, 'moucheN', 2], [1, 0, 'moucheN', 2], [0, 1, 'moucheN', 1], [1, 1, 'moucheN', 1], [-1, -1, 'blancN', 5], [2, -1, 'blancN', 5]]) if (vide(mx + a, my + b)) t.poser(mx + a, my + b, m, n);
  }
}
// L'anneau de fête porté au bas de la barbe (ou au bout d'une mèche)
function anneauSurToile(t, tenue, cible) {
  const id = Object.keys(ANNEAUX_FETE).find(a => tenue.includes(a)); if (!id) return;
  const pts = []; for (let y = 0; y < t.h; y++) for (let x = 0; x < t.l; x++) if (t.m[y * t.l + x] === cible) pts.push([x, y]);
  if (!pts.length) return;
  const ybas = Math.max(...pts.map(p => p[1])), bas = pts.filter(p => p[1] >= ybas - 2), [x, y] = bas[Math.floor(bas.length / 2)];
  t.rampes.anneauM = rampe({ anneauArgent: 0xc8ccd4, anneauOr: 0xe0b030, anneauFer: 0x3a3a44 }[id]);
  for (const [a, b] of [[-1, -2], [0, -2], [1, -2], [-1, -1], [1, -1], [-1, 0], [0, 0], [1, 0]]) t.poser(x + a, y + b, 'anneauM', b === -2 ? 5 : 3);
}
