// (v1.40, planche 67 validée) Le Jour Zéro et le didacticiel de Garrick.
// - Une option claire, à la création du personnage et dans le menu ☰ : « Didacticiel de Garrick ».
//   Activé : le Jour Zéro (la rénovation commentée, la visite du monde, le premier client pas à pas, la veillée
//   au coin du feu), les lieux qui s'ouvrent petit à petit, les conseils de Garrick.
//   Désactivé : pas de Jour Zéro ni de conseils, tout est ouvert dès le jour 1.
// - Le Jour Zéro ne compte pas : ni loyer, ni pizzo, ni impôt ; le lendemain, c'est le jour 1.
// - Le carnet des objectifs : deux ou trois buts courts à la fois, avec leur récompense (dans les deux cas).

const CLE_DIDACTICIEL = 'passage_didacticiel';
function didacticielPrefere() { try { return localStorage.getItem(CLE_DIDACTICIEL) !== 'non'; } catch (e) { return true; } }
// Le joueur change l'option : pour cette partie, et pour les suivantes
function reglerDidacticiel(oui, G = typeof window !== 'undefined' ? window.GAME : null) {
  try { localStorage.setItem(CLE_DIDACTICIEL, oui ? 'oui' : 'non'); } catch (e) {}
  if (G) { G.didacticiel = !!oui; if (!oui) G.tuto = false; }
}
function didacticiel(G) { return !!G && G.didacticiel !== false; }
function jourZero(G) { return !!G && G.jour === 0; }

// --- Les lieux qui s'ouvrent petit à petit ---
const DEBLOCAGES = {
  bureau: { jour: 1, nom: 'Le bureau', quand: 'demain soir', texte: "Le soir, améliore ton comptoir : les ouvriers viennent pendant que tu dors." },
  atelier: { jour: 5, nom: "L'atelier", quand: 'ta 1re trouvaille', si: G => (G.tresors || []).length > 0, texte: "Les trouvailles que tes clients rapportent : embauche un ouvrier pour les réparer, et revends-les plus cher aux enchères." },
  banque: { jour: 4, nom: 'La banque', quand: 'au jour 4', texte: "Un prêt pour te dépanner. Mais la banque prélève chaque nuit : ne prends que ce que tu peux rendre." },
};
function lieuDebloque(G, cle) {
  const d = DEBLOCAGES[cle];
  if (!d || !didacticiel(G)) return true;
  return G.jour >= d.jour || !!(d.si && d.si(G));
}
// (v1.61) un lieu est « vu » quand on y entre : son « NOUVEAU » disparaît alors (avant : dès le premier soir)
function lieuVu(cle) { const G = window.GAME; if (G) (G.nouveautesVues = G.nouveautesVues || {})[cle] = true; }
// Ce qui s'est ouvert et où l'on n'est pas encore entré (annoncé une seule fois chacun : G.nouveautesAnnoncees)
function nouveautes(G) {
  if (!didacticiel(G)) return [];
  G.nouveautesVues = G.nouveautesVues || {};
  return Object.keys(DEBLOCAGES).filter(c => lieuDebloque(G, c) && !G.nouveautesVues[c]);
}

// --- Le carnet des objectifs ---
const OBJECTIFS = [
  { id: 'premierClient', groupe: 'jour', texte: 'Équipe ton premier client', prog: G => [G.experience || 0, 1], argent: 20,
    aide: "Au comptoir : lis sa commande, glisse les marchandises dans son baluchon, puis remets-le-lui." },
  { id: 'marche', groupe: 'jour', des: G => G.jour >= 1, texte: 'Achète des provisions au Marché des Mastres', prog: G => [Object.values(G.depenses || {}).some(x => x > 0) ? 1 : 0, 1], argent: 15,
    aide: "Le matin, avant d'ouvrir : « Le marché ». Approche-toi d'un étal et achète ce qui manque à ta réserve." },
  { id: 'bureau', groupe: 'jour', des: G => lieuDebloque(G, 'bureau') && G.jour >= 1, texte: 'Améliore une chose au bureau', prog: G => [(G.travaux || []).length + Object.values(G.ameliorations || {}).reduce((a, b) => a + b, 0) > 0 ? 1 : 0, 1], argent: 25,
    aide: "Le soir, « Le bureau », la tuile « Améliorer le comptoir » : les ouvriers viennent pendant la nuit." },
  { id: 'vivants3', groupe: 'semaine', texte: 'Fais revenir 3 aventuriers vivants', prog: G => [Object.values(G.succes || {}).reduce((a, b) => a + b, 0), 3], argent: 40,
    aide: "Un baluchon complet, une contrée à leur mesure : regarde ce que dit ton flair avant de les laisser partir." },
  { id: 'deuxEtoiles', groupe: 'semaine', des: G => G.jour >= (typeof JOUR_DEUX_ETOILES === 'number' ? JOUR_DEUX_ETOILES : 2), texte: 'Envoie quelqu’un dans une contrée à 2 étoiles',
    prog: G => [(G.succes && G.succes[2]) || (G.partis || []).some(p => p.voyageur && ZONES[p.voyageur.zone] && ZONES[p.voyageur.zone].danger >= 2) ? 1 : 0, 1], argent: 30,
    aide: "Sur la carte, le matin : les contrées à deux étoiles rapportent plus... pour un aventurier qui a déjà fait ses preuves." },
  { id: 'trouvaille', groupe: 'semaine', des: G => lieuDebloque(G, 'atelier'), texte: 'Revends une trouvaille', prog: G => [Math.min(1, (G.stats && G.stats.ventes) || 0), 1], argent: 30,
    aide: "Le soir, l'atelier : un ouvrier répare la trouvaille, puis mets-la aux enchères au marché, le matin." },
  { id: 'marchandage', groupe: 'semaine', des: G => G.jour >= 3, texte: 'Réussis un marchandage', prog: G => [Math.min(1, G.persuasion || 0), 1], argent: 20,
    aide: "Quand un client discute sa part du butin ou le prix d'une trouvaille : propose, et ne cède pas trop vite." },
  { id: 'clients10', groupe: 'semaine', des: G => G.jour >= 2, texte: 'Sers 10 clients', prog: G => [G.experience || 0, 10], argent: 50,
    aide: "Plus tu sers, plus tu as d'expérience : les clients reviennent, et ta réputation grandit." },
  { id: 'etoile2', groupe: 'but', texte: 'Gagne ta 2e étoile : de nouvelles terres', prog: G => [(G.paliersEtoiles || [1]).includes(2) ? 1 : 0, 1], argent: 100,
    aide: "Les aventuriers qui reviennent vainqueurs font connaître ton comptoir : la réputation ouvre les étoiles suivantes." },
  { id: 'argent1000', groupe: 'but', des: G => (G.paliersEtoiles || [1]).includes(2), texte: 'Amasse 1 000 pièces', prog: G => [Math.min(1000, Math.floor(G.argent)), 1000], reputation: 1,
    aide: "Le butin des aventuriers, les trouvailles revendues, un comptoir amélioré : tout compte." },
  { id: 'etoile3', groupe: 'but', des: G => (G.paliersEtoiles || [1]).includes(2), texte: 'Gagne ta 3e étoile', prog: G => [(G.paliersEtoiles || [1]).includes(3) ? 1 : 0, 1], argent: 200,
    aide: "Des contrées plus dangereuses, des clients plus exigeants... et des parts de butin plus grosses." },
];
const GROUPES_OBJECTIFS = [['jour', "Aujourd'hui", 2], ['semaine', 'Cette semaine', 2], ['but', 'Le grand but', 1]];

function etatObjectifs(G) {
  if (!G.objectifs) {
    // (une vieille partie : ce qui est déjà fait est coché sans récompense)
    G.objectifs = { faits: {} };
    if (G.jour > 1) for (const o of OBJECTIFS) { const [n, m] = o.prog(G); if (n >= m) G.objectifs.faits[o.id] = -1; }
  }
  return G.objectifs;
}
// Les objectifs à montrer : par groupe, les premiers pas encore faits (et ceux faits aujourd'hui, cochés)
function objectifsVisibles(G) {
  const e = etatObjectifs(G), r = [];
  for (const [g, , max] of GROUPES_OBJECTIFS) {
    const liste = OBJECTIFS.filter(o => o.groupe === g && (!o.des || o.des(G) || e.faits[o.id] !== undefined));
    const faitsDuJour = liste.filter(o => e.faits[o.id] === G.jour);
    const restants = liste.filter(o => e.faits[o.id] === undefined).slice(0, max);
    r.push(...faitsDuJour, ...restants);
  }
  return r;
}
function objectifsEnCours(G) { const e = etatObjectifs(G); return objectifsVisibles(G).filter(o => e.faits[o.id] === undefined); }
// Vérifie les objectifs : ceux qui viennent d'être atteints sont récompensés (renvoie la liste)
function verifierObjectifs(G) {
  if (!G || G.faillite) return [];
  const e = etatObjectifs(G), neufs = [];
  for (const o of objectifsVisibles(G)) {
    if (e.faits[o.id] !== undefined) continue;
    const [n, m] = o.prog(G);
    if (n < m) continue;
    e.faits[o.id] = G.jour;
    if (o.argent) encaisser(G, o.argent, 'objectifs');
    if (o.reputation) G.reputation += o.reputation;
    neufs.push(o);
  }
  return neufs;
}
function recompenseObjectif(o) { return o.argent ? `+${o.argent} p.` : o.reputation ? `+${o.reputation} réputation` : ''; }
if (typeof POSTES !== 'undefined') POSTES.objectifs = 'Objectifs atteints';

// --- Les dessins du guide (le projecteur, la flèche, la bulle de Garrick, les étapes, la vignette) ---

// La pénombre partout, sauf une zone (un trou dans le voile), avec un liseré doré qui pulse
function projecteurGuide(s, [x, y, l, h], prof = 140, alpha = 0.62) {
  const objets = [[0, 0, 960, y], [0, y + h, 960, 540 - y - h], [0, y, x, h], [x + l, y, 960 - x - l, h]]
    .map(([a, b, c, d]) => s.add.rectangle(a, b, Math.max(0, c), Math.max(0, d), 0x0a0604, alpha).setOrigin(0).setDepth(prof).setScrollFactor(0));
  const c = s.add.graphics().setDepth(prof + 1).setScrollFactor(0);
  c.lineStyle(6, 0x1a0e06, 0.7).strokeRoundedRect(x - 3, y - 3, l + 6, h + 6, 10); c.lineStyle(3, 0xffd860, 1).strokeRoundedRect(x - 3, y - 3, l + 6, h + 6, 10);
  s.tweens.add({ targets: c, alpha: 0.45, duration: 650, yoyo: true, repeat: -1 });
  return [...objets, c];
}
function flecheGuide(s, x, y, angle = 0, prof = 150) {
  const g = s.add.graphics().setDepth(prof).setScrollFactor(0).setPosition(x, y).setAngle(angle);
  g.fillStyle(0x1a0e06).fillTriangle(-4, -18, -4, 18, 30, 0).fillRect(-34, -9, 32, 18);
  g.fillStyle(0xffd860).fillTriangle(0, -13, 0, 13, 24, 0).fillRect(-30, -5, 32, 10);
  const r = Phaser.Math.DegToRad(angle);
  s.tweens.add({ targets: g, x: x + Math.cos(r) * 8, y: y + Math.sin(r) * 8, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  return g;
}
// Garrick parle : une bulle de parole (avec son nom), la pointe vers lui ; un bouton dedans si besoin
function bulleGarrick(s, x, y, texte, { l = 420, pointe = 0, prof = 150, bouton = null, action = null } = {}) {
  const t = s.add.text(0, 0, texte, style(14, '#2a1a0c', { wordWrap: { width: l - 24 }, align: 'center' })).setOrigin(0.5, 0);
  const hb = bouton ? 34 : 0, h = t.height + 18 + hb;
  t.setY(-h / 2 + 9);
  const g = s.add.graphics();
  g.fillStyle(0x2a1a10).fillRoundedRect(-l / 2 - 2, -h / 2 - 2, l + 4, h + 4, 12).fillStyle(0xfff8e8).fillRoundedRect(-l / 2, -h / 2, l, h, 11);
  if (pointe !== null) g.fillStyle(0x2a1a10).fillTriangle(pointe - 10, h / 2, pointe + 10, h / 2, pointe, h / 2 + 16).fillStyle(0xfff8e8).fillTriangle(pointe - 7, h / 2 - 1, pointe + 7, h / 2 - 1, pointe, h / 2 + 11);
  const nom = s.add.text(-l / 2 + 10, -h / 2 - 12, 'Garrick', style(12, '#f3d98a', { fontStyle: 'bold', backgroundColor: '#2a1a10', padding: { x: 6, y: 2 } }));
  const c = s.add.container(x, y, [g, t, nom]).setDepth(prof).setScrollFactor(0);
  if (bouton) {
    const b = s.add.text(l / 2 - 14, h / 2 - 8, bouton, style(14, '#fff4dc', { fontStyle: 'bold', backgroundColor: '#4f7a3a', padding: { x: 10, y: 4 } })).setOrigin(1, 1).setInteractive({ useHandCursor: true });
    b.on('pointerover', () => b.setBackgroundColor('#6a9a4a')); b.on('pointerout', () => b.setBackgroundColor('#4f7a3a'));
    b.on('pointerdown', (p, lx, ly, ev) => { if (ev) ev.stopPropagation(); Son.jouer('clic'); if (action) action(); });
    c.add(b);
  }
  c.setAlpha(0); s.tweens.add({ targets: c, alpha: 1, duration: 220 });
  return c;
}
// Une rangée d'étapes : faites (✓), en cours (dorée), à venir (sombres)
function etapesGuide(s, y, liste, enCours, titre = '', prof = 150) {
  const c = s.add.container(0, 0).setDepth(prof).setScrollFactor(0);
  const ts = liste.map((t, i) => s.add.text(0, 0, (i < enCours ? '✓ ' : (i + 1) + ' · ') + t, style(12, i === enCours ? '#2a1608' : i < enCours ? '#b8e0a0' : '#c9b48a', { fontStyle: 'bold', backgroundColor: i === enCours ? '#f3d98a' : '#2a1a10', padding: { x: 7, y: 3 } })).setOrigin(0, 0.5));
  const tt = titre ? s.add.text(0, 0, titre, style(12, '#f3d98a', { fontStyle: 'bold italic' })).setOrigin(0, 0.5) : null;
  const L = ts.reduce((a, t) => a + t.width + 6, 0) + (tt ? tt.width + 10 : 0);
  let x = 480 - L / 2;
  c.add(s.add.rectangle(480, y, L + 14, 30, 0x140c08, 0.92).setStrokeStyle(2, 0xc9a227));
  if (tt) { tt.setPosition(x, y); c.add(tt); x += tt.width + 10; }
  for (const t of ts) { t.setPosition(x, y); c.add(t); x += t.width + 6; }
  return c;
}
// La vignette en haut à droite : NOUVEAU, OBJECTIF ATTEINT...
// (v1.42, planche 68) le bouton de l'action principale luit : une lueur dorée et un liseré d'or qui respirent.
// Renvoie le conteneur (à montrer / cacher selon que l'action est possible).
function lueurBouton(s, b, largeur) {
  creerHalo(s);
  const x = b.fond.x, y = b.fond.y;
  const lueur = s.add.image(x, y, 'halo').setScale(largeur / 88, 0.8).setTint(0xffc040).setBlendMode(Phaser.BlendModes.ADD);
  const lisere = s.add.graphics(); lisere.lineStyle(3, 0xffd34a, 1).strokeRoundedRect(x - largeur / 2 - 6, y - 23, largeur + 12, 46, 8);
  s.tweens.add({ targets: lueur, alpha: { from: 0.5, to: 0.15 }, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  s.tweens.add({ targets: lisere, alpha: { from: 1, to: 0.45 }, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  return s.add.container(0, 0, [lueur, lisere]);
}
// (v1.42, planche 68) les aides en petit texte (« clic : ... ») disparaissent une fois l'action faite
function aideVue(G, cle) { return !!(G && G.aidesVues && G.aidesVues[cle]); }
function marquerAide(G, cle) { if (!G) return; G.aidesVues = G.aidesVues || {}; G.aidesVues[cle] = true; }
// (planche 68 : une seule à la fois ; les suivantes attendent leur tour)
function vignetteGuide(s, entete, titre, texte, options = {}) {
  s._fileVignettes = s._fileVignettes || [];
  if (s._vignette && s._vignette.active) { s._fileVignettes.push([entete, titre, texte, options]); return null; }
  const { x = 760, y = 92, prof = 160, duree = 4200 } = options;
  const c = s.add.container(x, y).setDepth(prof).setScrollFactor(0);
  s._vignette = c;
  c.once('destroy', () => { s._vignette = null; const suite = s._fileVignettes.shift();
    if (!s.sys.isActive()) s._fileVignettes = []; else if (suite) s.time.delayedCall(200, () => vignetteGuide(s, ...suite)); });
  const t1 = s.add.text(-176, -26, entete, style(11, '#8ab0d0', { fontStyle: 'bold' }));
  const t2 = s.add.text(-176, -10, titre, style(15, '#fff4dc', { fontStyle: 'bold' }));
  const t3 = s.add.text(-176, 12, texte, style(12, '#c9d4dc', { wordWrap: { width: 350 } }));
  const h = 46 + t3.height;
  c.add(s.add.rectangle(0, -34 + h / 2, 372, h, 0x14181e, 0.96).setStrokeStyle(2, 0x5a6a7a)); c.add([t1, t2, t3]);
  c.setAlpha(0).setX(x + 30);
  s.tweens.add({ targets: c, alpha: 1, x, duration: 260, ease: 'Sine.easeOut' });
  if (duree) s.tweens.add({ targets: c, alpha: 0, delay: duree, duration: 400, onComplete: () => c.destroy() });
  const zone = s.add.rectangle(0, -34 + h / 2, 372, h, 0xffffff, 0).setInteractive({ useHandCursor: true });
  zone.on('pointerdown', () => { s.tweens.killTweensOf(c); c.destroy(); });
  c.add(zone);
  return c;
}
// un petit cadenas (glyphe pixel, comme les autres pictos de l'interface)
function texCadenas(s) {
  if (!s.textures.exists('glyphe_cadenas')) {
    const L = ['...nnnnn...', '..nAAAAAn..', '..nAn.nAn..', '..nAn.nAn..', '.nnnnnnnnn.', '.nJJJJJJJn.', '.nJjjnjjJn.', '.nJjjnjjJn.', '.nJjjjjjJn.', '.nJJJJJJJn.', '.nnnnnnnnn.'];
    const P = { n: '#1a0e06', A: '#a8a8b0', J: '#d8a838', j: '#b88820' };
    const t = s.textures.createCanvas('glyphe_cadenas', 11, 11), c = t.getContext();
    L.forEach((l, y) => [...l].forEach((ch, x) => { if (P[ch]) { c.fillStyle = P[ch]; c.fillRect(x, y, 1, 1); } })); t.refresh();
  }
  return 'glyphe_cadenas';
}

// --- Un pas du guide : la pénombre, Garrick et sa bulle, (une flèche), (les étapes) ---
// Dessiné dans le bandeau (au-dessus de tout) quand il est là. Renvoie { fermer() }.
function pasDuGuide(scene, { zone, texte, bulle = {}, fleche = null, etapes = null, bouton = null, action = null, garrick = true, assombrirTextes = false }) {
  const hud = scene.scene.get('Hud');
  const h = hud && hud.sys.isActive() && hud.sys.isVisible() ? hud : scene;
  if (h === hud) h.scene.bringToTop();
  const objets = [];
  if (zone) objets.push(...projecteurGuide(h, zone));
  if (fleche) objets.push(flecheGuide(h, fleche[0], fleche[1], fleche[2] || 0));
  if (garrick) { const g = imageCorps(h, 110, 566, 'mentor', 9).setScrollFactor(0).setDepth(145); h.tweens.add({ targets: g, scaleY: g.scaleY * 1.015, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }); objets.push(g); }
  objets.push(bulleGarrick(h, bulle.x || 420, bulle.y || 400, texte, { l: bulle.l || 440, pointe: bulle.pointe === undefined ? -200 : bulle.pointe, bouton, action }));
  if (etapes) objets.push(etapesGuide(h, etapes.y || 518, etapes.liste, etapes.enCours, etapes.titre || ''));
  // (les textes de certaines pages passent au-dessus du voile : on les atténue le temps du pas)
  const atenues = [];
  if (assombrirTextes && zone) {
    const [x, y, l, hh] = zone;
    for (const o of scene.children.list) if ((o.type === 'Text' || o.type === 'Container') && o.visible && o.alpha > 0.3 && !(o.x >= x - 4 && o.x <= x + l + 4 && o.y >= y - 4 && o.y <= y + hh + 4)) { atenues.push([o, o.alpha]); o.setAlpha(0.3); }
  }
  if (h === scene && scene.dessus && scene.camDessus) for (const o of objets) scene.dessus.add(o);
  let ferme = false;
  const fermer = () => { if (ferme) return; ferme = true; for (const o of objets) if (o && o.active) o.destroy(); for (const [o, a] of atenues) if (o.active) o.setAlpha(a); };
  scene.events.once('shutdown', fermer);
  return { fermer };
}

// --- Le Jour Zéro ---

// Après la rénovation (le didacticiel activé) : le jour 0, un seul client (Pippa, sa lettre à porter), la visite du monde
function lancerJourZero(scene) {
  const G = window.GAME;
  G.jour = 0; G.tuto = true; G.didacticiel = true;
  G.argentDebutJour = G.argent;
  const pippa = JOUR_1.find(v => v.quete === 'lettre');
  G.file = [{ type: 'client', voyageur: creerVoyageur(G, pippa) }];
  G.jourZeroEtape = 'visite';
  for (const cam of scene.cameras.cameras) cam.fadeOut(400);
  scene.cameras.main.once('camerafadeoutcomplete', () => scene.scene.start('Carte'));
}

// La visite du monde, sur la carte : quatre pas, puis « Ouvrir le comptoir »
function visiteDuMonde(carte) {
  const G = carte.G;
  if (!(jourZero(G) && didacticiel(G) && G.jourZeroEtape === 'visite')) return false;
  if (carte.boutonFin) { carte.boutonFin.fond.setVisible(false); carte.boutonFin.label.setVisible(false); }
  const ETAPES = ['Ta maison', 'Le monde', 'La lumière et l’ombre', 'Le marché', 'Ton premier client'];
  const PAS = [
    { zone: [255, 140, 480, 200], texte: "« Ici, c'est la Comté : chez nous. Chaque matin, des aventuriers cherchent où aller, et c'est toi qui choisis. Les étoiles, c'est le danger... et le butin. Sous les nuages, le reste du monde : il s'ouvrira à mesure que ton nom circulera. »" },
    { zone: null, texte: "« Le monde aime ranger les gens : la lumière d'un côté, l'ombre de l'autre. Ce que tu vends, à qui tu le vends, et ce sur quoi tu fermes les yeux : tout se sait. La jauge, sous ta réputation, te dira de quel côté tu penches. Personne ne choisira pour toi. »", fleche: [120, 54, -90] },
    { zone: null, texte: "« Demain matin, avant d'ouvrir, je t'emmène au Marché des Mastres : c'est là que tu rachètes de quoi remplir ta réserve. Chaque marchand a ses prix du jour. Ce qui manque sur tes étagères manquera au comptoir. »" },
    { zone: null, texte: "« Assez parlé ! Une cliente t'attend déjà : Pippa, une hobbite qui doit porter une lettre de l'autre côté de la rivière. Une course facile, pour commencer. Je reste à côté de toi. »", bouton: 'Ouvrir le comptoir ▶' },
  ];
  let k = 0, pas = null;
  const suivant = () => {
    if (pas) pas.fermer();
    if (k >= PAS.length) { G.jourZeroEtape = 'client'; carte.terminer(); return; }
    const p = PAS[k];
    pas = pasDuGuide(carte, { zone: p.zone, texte: p.texte, fleche: p.fleche, bulle: { x: 470, y: 400, l: 560, pointe: -300 }, etapes: { y: 64, liste: ETAPES, enCours: k + 1, titre: 'La visite de Garrick :' }, bouton: p.bouton || 'Suivant ▶', action: () => { k++; suivant(); } });
  };
  carte.time.delayedCall(600, suivant);
  return true;
}

// Le premier client, pas à pas (au comptoir, le jour 0)
const ETAPES_CLIENT = ['Lis sa commande', 'Glisse les marchandises', 'Regarde ton flair', 'Remets le baluchon'];
function guideClient(comptoir, etape) {
  const G = comptoir.G;
  if (!(jourZero(G) && didacticiel(G) && G.jourZeroEtape === 'client')) return false;
  if (comptoir.pasGuide) { comptoir.pasGuide.fermer(); comptoir.pasGuide = null; }
  G.tutoVu = G.tutoVu || {};
  for (const k of ['comptoir', 'colis', 'remis', 'refus', 'carte']) G.tutoVu[k] = true;   // (le guide remplace ces conseils-là)
  const et = n => ({ y: 338, liste: ETAPES_CLIENT, enCours: n, titre: 'Ton premier client :' });
  const PAS = {
    commande: { zone: [683, 16, 262, 236], fleche: [640, 130, 0], texte: "« D'abord, lis sa commande, là, sur le parchemin. Chaque ligne, c'est ce qu'il lui faut pour revenir vivante. »", bouton: 'Compris ▶', suite: 'marchandises', n: 0 },
    marchandises: { zone: [142, 352, 556, 172], fleche: [420, 330, 90], texte: "« Clique sur tes marchandises, en bas, pour les glisser dans son baluchon. Tout ce qui est sur le parchemin. »", n: 1, bulle: { x: 470, y: 200, pointe: null } },
    flair: { zone: [683, 192, 262, 54], fleche: [640, 219, 0], texte: "« Tout y est ! Sous la commande, la jauge de ton flair : ses chances de revenir vivante. Plus le baluchon est complet, plus elle monte. »", bouton: 'Compris ▶', suite: 'remettre', n: 2 },
    remettre: { zone: [732, 476, 216, 40], fleche: [690, 496, 0], texte: "« Il ne reste qu'à lui remettre son baluchon. Clique sur « Remettre le baluchon ». »", n: 3, bulle: { x: 470, y: 420, pointe: null } },
  };
  if (etape === 'fini') {
    G.jourZeroEtape = 'soir';
    comptoir.time.delayedCall(2200, () => { if (comptoir.scene.isActive()) comptoir.pasGuide = pasDuGuide(comptoir, { texte: "« Et voilà ta première course ! Elle reviendra demain te raconter son voyage, avec ta part. C'est tout pour aujourd'hui : ferme boutique, et viens te reposer. »", bouton: 'Compris ▶', action: () => { comptoir.pasGuide && comptoir.pasGuide.fermer(); comptoir.pasGuide = null; }, bulle: { x: 470, y: 400, pointe: -210 } }); });
    return true;
  }
  const p = PAS[etape];
  if (!p) return false;
  comptoir.etapeGuide = etape;
  comptoir.pasGuide = pasDuGuide(comptoir, { zone: p.zone, fleche: p.fleche, texte: p.texte, etapes: et(p.n), bulle: p.bulle || { x: 420, y: 400, l: 440, pointe: -210 }, bouton: p.bouton || null, garrick: !p.bulle || p.bulle.pointe !== null,
    assombrirTextes: true, action: p.suite ? () => guideClient(comptoir, p.suite) : null });
  return true;
}
// Après chaque objet glissé : la commande est-elle complète ?
function guideApresDon(comptoir) {
  if (comptoir.etapeGuide !== 'marchandises' || !comptoir.voyageur) return;
  const v = comptoir.voyageur, commande = commandeDe(v);
  if (Object.entries(commande).every(([id, n]) => fourni(v, comptoir.colis, id) >= n)) guideClient(comptoir, 'flair');
}

// La veillée du Jour Zéro, au coin du feu (dans la chambre, avant de dormir) : le but
function veilleeDuJourZero(dodo, fin) {
  const G = dodo.G || window.GAME;
  if (!(jourZero(G) && didacticiel(G)) || G.veilleeFaite) return false;
  G.veilleeFaite = true;
  const s = dodo;
  const c = s.add.container(0, 0).setDepth(200);
  c.add(s.add.rectangle(480, 270, 960, 540, 0x000000, 0.01).setInteractive());   // (rien d'autre ne se clique pendant la veillée)
  const g = imageCorps(s, 300, typeof SOL_CHAMBRE === 'number' ? SOL_CHAMBRE : 470, 'mentor', 7.5).setDepth(3);
  s.tweens.add({ targets: g, scaleY: g.scaleY * 1.015, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });   // (il respire)
  c.add(g);
  const n = s.add.text(40, 22, "Le soir du Jour Zéro. Garrick a allumé le premier feu de la maison. Il repartira demain, après t'avoir montré le marché.", style(13, '#c9b48a', { fontStyle: 'italic', wordWrap: { width: 880 } }));
  n.setY(58);
  c.add(s.add.rectangle(480, 48, 920, 20 + n.height, 0x2a1a10, 0.94).setStrokeStyle(2, 0xc9a227).setOrigin(0.5, 0)); c.add(n);
  const b = bulleGarrick(s, 330, 200, "« Tu sais ce qu'on fait, nous, les marchands d'aventure ? On fait revenir les gens vivants. Fais de ce comptoir le plus réputé de la Comté... puis du royaume. Chaque étoile gagnée t'ouvrira de nouvelles terres. Et on dit qu'au loin, quelque chose se réveille : un jour, le monde aura besoin de tes baluchons. »", { l: 500, pointe: -30, prof: 202 });
  c.add(b);
  const p = s.add.container(760, 250).setDepth(203);
  p.add(s.add.image(0, 0, panneauHD(s, 340, 290)).setScale(2));
  p.add(s.add.text(0, -122, 'Tes buts', style(19, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
  let y = -92;
  for (const [t, d] of [['Demain', 'Remplir ta réserve au marché, servir tes premiers clients.'], ['Cette saison', 'Gagner ta 2e étoile : de nouvelles contrées.'], ['Toute une vie', 'Le comptoir le plus réputé du royaume... et ce qui se réveille au loin.']]) {
    p.add(s.add.text(-150, y, t, style(14, '#7a2a10', { fontStyle: 'bold' })));
    const dd = s.add.text(-150, y + 20, d, style(13, '#3b2410', { wordWrap: { width: 300 } })); p.add(dd); y += 32 + dd.height;
  }
  p.add(s.add.text(0, 118, 'Le carnet des objectifs te les rappellera.', style(12, '#6a4a2a', { fontStyle: 'italic' })).setOrigin(0.5));
  c.add(p);
  const note = s.add.text(480, 500, 'Le Jour Zéro ne compte pas : ni loyer, ni pizzo, ni impôt. Demain : Jour 1.', style(14, '#fff4dc', { fontStyle: 'bold italic', stroke: '#1a0e06', strokeThickness: 4 })).setOrigin(0.5);
  c.add(note);
  const bt = creerBouton(s, 820, 450, 190, 'Bonne nuit ▶', () => { Son.jouer('clic'); s.tweens.add({ targets: c, alpha: 0, duration: 300, onComplete: () => { c.destroy(); fin(); } }); });
  bt.fond.setDepth(204); bt.label.setDepth(205); c.add([bt.fond, bt.label]);
  c.setAlpha(0); s.tweens.add({ targets: c, alpha: 1, duration: 400 });
  Son.jouer('voix', { personne: { nom: 'Garrick', race: 'humain' }, ton: 'content', duree: 1.6 });
  return true;
}

// --- Le carnet des objectifs (s'ouvre depuis la pastille du bandeau) ---
function ouvrirCarnetObjectifs(hud) {
  const G = window.GAME;
  if (!G || hud.carnetObjectifs) return;
  const c = hud.carnetObjectifs = hud.add.container(480, 285).setDepth(118);
  const voile = hud.add.rectangle(0, -15, 960, 540, 0x000000, 0.5).setInteractive();
  c.add(voile);
  c.add(hud.add.image(0, 0, panneauHD(hud, 620, 410)).setScale(2));
  c.add(hud.add.text(0, -180, 'Le carnet des objectifs', style(21, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
  c.add(hud.add.text(0, -154, didacticiel(G) ? 'Garrick les a notés pour toi.' : 'Quelques buts pour avancer.', style(12, '#6a4a2a', { fontStyle: 'italic' })).setOrigin(0.5));
  const e = etatObjectifs(G), vis = objectifsVisibles(G);
  const aide = hud.add.text(0, 140, '', style(13, '#3b2410', { fontStyle: 'italic', wordWrap: { width: 540 }, align: 'center' })).setOrigin(0.5, 0);
  let y = -122;
  if (!vis.length) c.add(hud.add.text(0, -40, "Garrick n'a plus rien à t'apprendre : la suite, c'est ton histoire.", style(15, '#3b2410', { fontStyle: 'italic', wordWrap: { width: 520 }, align: 'center' })).setOrigin(0.5));
  for (const [g, titre] of GROUPES_OBJECTIFS) {
    const liste = vis.filter(o => o.groupe === g);
    if (!liste.length) continue;
    c.add(hud.add.text(-280, y, titre, style(15, '#7a2a10', { fontStyle: 'bold' }))); y += 24;
    for (const o of liste) {
      const ok = e.faits[o.id] !== undefined, [n, m] = o.prog(G);
      const gr = hud.add.graphics(); gr.lineStyle(2, 0x3b2410).strokeRect(-276, y + 2, 14, 14);
      if (ok) gr.lineStyle(3, 0x3a7a2a).beginPath().moveTo(-273, y + 9).lineTo(-269, y + 14).lineTo(-260, y).strokePath();
      c.add(gr);
      const t = hud.add.text(-252, y, o.texte + (!ok && m > 1 ? ` (${Math.min(n, m)} / ${m})` : ''), style(14, ok ? '#5a7a4a' : '#3b2410', { fontStyle: ok ? 'italic' : 'normal' })).setInteractive({ useHandCursor: true });
      t.on('pointerdown', () => { Son.jouer('plume'); aide.setText(`Garrick : « ${o.aide} »`); });
      t.on('pointerover', () => t.setColor('#8a4a10')); t.on('pointerout', () => t.setColor(ok ? '#5a7a4a' : '#3b2410'));
      c.add(t);
      c.add(hud.add.text(280, y, recompenseObjectif(o), style(12, ok ? '#3a7a2a' : '#8a5a20', { fontStyle: 'bold' })).setOrigin(1, 0));
      y += 24;
    }
    y += 8;
  }
  c.add(aide);
  aide.setY(Math.max(y + 4, 60));
  if (vis.length) c.add(hud.add.text(0, 176, 'Clique sur un objectif : Garrick te rappelle comment faire.', style(12, '#6a4a2a', { fontStyle: 'italic' })).setOrigin(0.5));
  const fermer = () => { if (!hud.carnetObjectifs) return; hud.carnetObjectifs.destroy(); hud.carnetObjectifs = null; if (hud.scenePauseeCarnet) { hud.scenePauseeCarnet.scene.resume(); hud.scenePauseeCarnet = null; } };
  voile.on('pointerdown', fermer);
  const b = creerBouton(hud, 0, 214, 150, 'Fermer', fermer);
  c.add([b.fond, b.label]);
  const s = hud.scenePrincipale && hud.scenePrincipale();
  if (s && s.scene.isActive() && s !== hud) { hud.scenePauseeCarnet = s; s.scene.pause(); }
}
