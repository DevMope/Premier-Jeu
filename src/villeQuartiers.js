// (v1.65, la ville des Hobbits en quartiers, chantier 2 : le socle) Ce que tous les quartiers ont en commun, hors de la
// scène elle-même (QuartierScene.js) :
//   - QUARTIERS_VILLE : les six quartiers de la planche 89, leur nom, leur pierre, la scène qui les montre, s'ils sont
//     ouverts (sinon : « bientôt ») ; PASSAGES_VILLE : les sept passages qui les relient, en médaillons d'or sur le plan ;
//   - le plan de la ville (touche M) : ouvrirPlanVille(scene, options), basculerVersPlanVille(scene) (pour la carte M de
//     la place : voir plus bas), « tu es ici », un clic sur un quartier ouvert y emmène ;
//   - aller d'un lieu à un autre sans saut sec : allerDansLaVille(scene, cible) ferme en fondu et ouvre la scène voulue,
//     et ARRIVEES_VILLE y place JeuneGoy au bon endroit, qui entre en marchant (place des Mastres, rue, quartier) ;
//   - les enseignes : la plaque de rue clouée au mur (poserPlaqueRue, son nom en lettrage gravé comme les noms des étals),
//     et le nom du quartier qui s'affiche à l'entrée (banniereQuartier).
// Rien de tout cela n'est sauvegardé : les vieilles parties ne voient aucune différence.

// Les six quartiers (planche 89 v7, dans l'ordre des chantiers). scene : la scène qui le montre ; pret : on peut y aller ;
// etiquette : où poser son nom sur le plan [x, y] et le point qu'il désigne [x, y] (en pixels du plan)
const QUARTIERS_VILLE = {
  place: { nom: 'La place des Mastres', sous: 'le marché du matin', scene: 'Marche', pret: true, chantier: 1, etiquette: [394, 100], point: [327, 108] },
  soucolline: { nom: 'La rue Soucolline', sous: 'le quartier du Comptoir', scene: 'Quartier', pret: true, chantier: 3, pierre: 'soucolline', etiquette: [306, 186], point: [290, 177] },
  basQuartier: { nom: 'Le bas-quartier', sous: 'le quai et le lavoir', scene: 'Quartier', pret: false, chantier: 4, pierre: 'basQuartier', etiquette: [364, 205], point: [318, 210] },
  coteaux: { nom: 'Les Coteaux', sous: 'les portes rondes', scene: 'Quartier', pret: false, chantier: 5, pierre: 'coteaux', etiquette: [236, 21], point: [222, 30] },
  rempart: { nom: 'Le Rempart', sous: 'la Grand-Porte, la chapelle', scene: 'Quartier', pret: false, chantier: 6, pierre: 'rempart', etiquette: [30, 90], point: [61, 104] },
  riviere: { nom: 'La rivière aux Trois Pommes', sous: 'le Vieux Moulin, le pont du Sud', scene: 'Quartier', pret: false, chantier: 6, pierre: 'riviere', etiquette: [300, 247], point: [300, 236] },
};
// Les sept passages : entre deux quartiers, un passage visible ; sur le plan, un médaillon d'or numéroté
const PASSAGES_VILLE = [
  { n: 1, nom: 'l’arche des Mastres', entre: ['soucolline', 'place'], type: 'arche', plan: [MX_PLAN(3640) - 7, 143] },
  { n: 2, nom: 'la descente des Marches', entre: ['soucolline', 'basQuartier'], type: 'escalier', plan: [MX_PLAN(1510) + 6, 194] },
  { n: 3, nom: 'l’escalier des Coteaux', entre: ['soucolline', 'coteaux'], type: 'escalier', plan: [MX_PLAN(1615) + 7, 140] },
  { n: 4, nom: 'le chemin creux', entre: ['place', 'coteaux'], type: 'chemin', plan: [312, 78] },
  { n: 5, nom: 'la Grand-Porte', entre: ['soucolline', 'rempart'], type: 'porche', plan: [72, 171] },
  { n: 6, nom: 'le pont du Sud', entre: ['basQuartier', 'riviere'], type: 'pont', plan: [212, 236] },
  { n: 7, nom: 'le sentier du Vieux Moulin', entre: ['place', 'riviere'], type: 'chemin', plan: [424, 113] },
];
function quartierPret(id) { const q = QUARTIERS_VILLE[id]; return !!(q && q.pret && (q.scene !== 'Quartier' || (typeof DECORS_QUARTIERS !== 'undefined' && DECORS_QUARTIERS[id]))); }
// Des coordonnées des rues (la rue Soucolline et la rue Haute, planche 89 v7) à celles du plan
function MX_PLAN(X) { return 70 + X * 0.065; }
function MY_PLAN(Y) { return 152 + (Y - 1130) * 0.057; }
// Le plan à l'écran : ×2, sous le bandeau du titre (qui laisse la place, en haut à gauche, aux jours et à la réputation)
// (on n'en voit que les rangs 12 à 253 : le haut, des collines et des bois, passe sous le bandeau du titre ; le bas, des champs)
const PLAN_ECRAN = { ox: 3, oy: 32, k: 2, haut: 12, rangs: 254, bandeau: 56 };
if (typeof THEME_PAR_SCENE !== 'undefined' && !THEME_PAR_SCENE.Quartier) THEME_PAR_SCENE.Quartier = THEME_PAR_SCENE.Rue || 'marche';

// Où est-on sur le plan ? [x, y] en pixels du plan, d'après la scène et la position de JeuneGoy
function ouEsTuSurLePlan(scene) {
  const k = scene && scene.scene && scene.scene.key, h = scene && scene.heros;
  if (k === 'Quartier' && scene.def && scene.def.surLePlan && h) return scene.def.surLePlan(h.x, h.y);
  if (k === 'Marche' && h && scene.place && typeof PLACE_MARCHE !== 'undefined') return [307 + (h.x / PLACE_MARCHE.L - 0.5) * 90, 104 + (h.y / PLACE_MARCHE.H - 0.5) * 56];
  if (k === 'Rue' && h && typeof PLACES_RUE !== 'undefined') { const P = PLACES_RUE, X = h.x < P.shop ? 1324 - (P.shop - h.x) * 0.5 : 1324 + (h.x - P.shop) / (P.arche - P.shop) * (3640 - 1324); return [MX_PLAN(X), MY_PLAN(1640)]; }
  return [MX_PLAN(1324), MY_PLAN(1600)];
}
// Le quartier où l'on est (pour le plan)
function quartierDeLaScene(scene) {
  const k = scene && scene.scene && scene.scene.key;
  return k === 'Quartier' ? scene.idQuartier : k === 'Marche' ? 'place' : k === 'Rue' ? 'soucolline' : null;
}

// Le quartier sous un point du plan (pour griser ceux qui ne sont pas prêts, et pour le clic)
function quartierSurLePlan(x, y) {
  const I = typeof PLAN_VILLE_INFO !== 'undefined' ? PLAN_VILLE_INFO : {}, dr = I.distRiv && (x > 400 || y > 200) ? I.distRiv(x, y) : 99;   // (la rivière ne passe qu'à l'est et au sud)
  const dansE = (cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 1;
  if (dansE(307, 104, 60, 40) || dansE(394, 156, 30, 16) || (x > 372 && x < 430 && y > 112 && y < 150)) return 'place';
  if (dr < 5 || (x > 428 && x < 468 && y > 76 && y < 114) || (x > 392 && x < 426 && y > 162 && y < 202) || (x > 186 && x < 214 && y > 224 && y < 250)) return 'riviere';
  if (x < 74 || (x < 118 && y >= 96 && y < 140) || (x >= 72 && x < 100 && y >= 202 && y < 218)) return 'rempart';
  if (y < 137 && x < 438) return 'coteaux';
  if (x < 346 && y >= 137 && y < 193) return 'soucolline';
  if (x < 346 && y >= 193 && y < 233) return 'basQuartier';
  return null;
}
// Le plan, les quartiers pas encore prêts grisés (une texture par ensemble de quartiers fermés, gardée)
function planVilleGrise(s) {
  const base = planVilleHD(s), fermes = Object.keys(QUARTIERS_VILLE).filter(id => !quartierPret(id));
  const cle = base + '_gris_' + fermes.join('_'); if (s.textures.exists(cle)) return cle;
  const src = s.textures.get(base).getSourceImage(), L = src.width, H = src.height;
  const tex = s.textures.createCanvas(cle, L, H), c = tex.getContext(); c.drawImage(src, 0, 0);
  const img = c.getImageData(0, 0, L, H), d = img.data, ferme = new Set(fermes);
  for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) {
    const q = quartierSurLePlan(x, y); if (!q || !ferme.has(q)) continue;
    const i = (y * L + x) * 4, g = 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2];
    for (let k = 0; k < 3; k++) d[i + k] = Math.round(d[i + k] * 0.32 + (g * 0.82 + 30) * 0.68);   // (le pastel d'une vieille carte, sans couleur)
  }
  c.putImageData(img, 0, 0); tex.refresh();
  return cle;
}

// --- Le plan de la ville (M) ---
// options : surFermer() ; commeCarte (la scène le range dans this.carteC : sa touche M et Échap le referment, et tout ce
// qui est bloqué quand sa carte est ouverte l'est aussi). Renvoie le conteneur (detruit : le plan se referme).
function ouvrirPlanVille(scene, { surFermer = null, commeCarte = false, profondeur = 60 } = {}) {
  if (scene.planVille && scene.planVille.active) return scene.planVille;
  Son.jouer('page');
  const E = PLAN_ECRAN, X = x => E.ox + x * E.k, Y = y => E.oy + y * E.k;
  const c = scene.add.container(0, 0).setDepth(profondeur).setAlpha(0);
  scene.planVille = c;
  if (commeCarte) scene.carteC = c;
  scene.tweens.add({ targets: c, alpha: 1, duration: 220 });   // (le plan se déplie en fondu, jamais d'un coup)
  // le fond (il arrête les clics), le plan, son cadre
  c.add(scene.add.rectangle(480, 270, 960, 540, 0x140c06, 1).setInteractive());
  const im = scene.add.image(E.ox, E.oy, planVilleGrise(scene)).setOrigin(0).setScale(E.k).setCrop(0, E.haut, PLAN_VILLE.L, E.rangs - E.haut);
  c.add(im);
  { const g = scene.add.graphics(); g.lineStyle(2, 0x4a3420, 1).strokeRect(E.ox - 1, Y(E.haut) - 1, PLAN_VILLE.L * E.k + 2, (E.rangs - E.haut) * E.k + 2); c.add(g); }
  // le bandeau du titre (sous la ligne des jours, de la réputation et des objectifs, qui restent au-dessus)
  c.add(scene.add.rectangle(480, E.bandeau / 2, 960, E.bandeau, 0x1a120a, 1));
  const titre = scene.add.text(480, 42, 'Le plan de la ville · clique sur un quartier pour y aller · M ou Échap : refermer', style(14, '#f3d98a', { fontStyle: 'bold' })).setOrigin(0.5);
  c.add(titre);
  const ici = quartierDeLaScene(scene), [hx, hy] = ouEsTuSurLePlan(scene);
  // les noms des lieux, en italique, à côté de leur dessin (ceux de la planche 89 v7)
  const nom = (x, y, txt, ax = 0.5) => { const t = scene.add.text(X(x), Y(y), txt, style(10, '#2a1a0c', { fontStyle: 'italic bold', brut: true, stroke: '#f4ecd4', strokeThickness: 3 })).setOrigin(ax, 0.5); c.add(t); return t; };
  [[94, 111, 'la chapelle', 0], [113, 133, 'la Confrérie', 0], [86, 220.5, 'l’hospice', 0.5], [56, 194, 'la Grand-Porte', 1], [318, 157.5, 'l’arche des Mastres', 0.5], [MX_PLAN(2780) + 4, 152, 'la rue Haute', 0],
    [MX_PLAN(1615) + 4, 162.5, 'la ruelle du Pommier', 0], [MX_PLAN(1510) - 3, 193.5, 'la descente des Marches', 1], [203, 193.5, 'l’impasse du Corbeau', 0], [341, 221.5, 'le lavoir', 0], [454, 74, 'le Vieux Moulin', 0.5],
    [394, 172, 'l’étang', 0.5], [391, 124, 'la cabane de Barnabé', 0.5], [303, 24, 'le chemin creux', 0], [192, 247, 'le pont du Sud', 1], [MX_PLAN(594) - 2, 163.5, 'la montée du Four', 1]].forEach(([x, y, t, a]) => nom(x, y, t, a));
  { const P3 = (typeof PLAN_VILLE_INFO !== 'undefined' && PLAN_VILLE_INFO.pommiers) || []; if (P3.length) nom(Math.min(...P3.map(p => p[0])) - 6, 184, 'les trois pommiers', 1); }
  // les quartiers : une étiquette de parchemin et un fil qui pointe leur cœur ; grisée, avec « bientôt », s'il n'est pas prêt
  const g = scene.add.graphics(); c.add(g);
  // (ce qu'on survole s'écrit dans le bandeau, à la place du titre : jamais par-dessus le plan)
  const bulleInfo = scene.add.text(480, 42, '', style(14, '#fff4dc', { fontStyle: 'bold' })).setOrigin(0.5).setVisible(false);
  const info = (t) => { bulleInfo.setVisible(!!t); titre.setVisible(!t); if (t) { bulleInfo.setText(t); let f = 14; while (bulleInfo.width > 940 && f > 10) bulleInfo.setFontSize(--f); } };
  const cartouches = {};
  for (const [id, q] of Object.entries(QUARTIERS_VILLE)) {
    const pret = quartierPret(id), [tx, ty] = q.etiquette, [cx, cy] = q.point;
    const t = scene.add.text(X(tx), Y(ty), q.nom, style(12, pret ? '#3a2410' : '#6e665c', { fontStyle: 'bold', brut: true })).setOrigin(0.5);
    const bt = pret ? null : scene.add.text(0, 0, 'bientôt', style(10, '#f6ead0', { fontStyle: 'italic bold', brut: true })).setOrigin(0.5);
    const l = t.width + 12 + (bt ? bt.width + 12 : 0), h = 18;
    let x0 = Phaser.Math.Clamp(X(tx) - l / 2, 8, 952 - l); const y0 = Phaser.Math.Clamp(Y(ty) - h / 2, E.bandeau + 4, 538 - h);
    t.setPosition(x0 + 6 + t.width / 2, y0 + h / 2);
    if (bt) bt.setPosition(x0 + l - 6 - bt.width / 2, y0 + h / 2);
    const bx = Math.max(x0, Math.min(x0 + l, X(cx))), by = Math.max(y0, Math.min(y0 + h, Y(cy)));
    g.lineStyle(3, 0xf4e6c0, 0.9).lineBetween(bx, by, X(cx), Y(cy)).lineStyle(1.4, pret ? 0x3a2410 : 0x6e665c, 1).lineBetween(bx, by, X(cx), Y(cy));
    g.fillStyle(pret ? 0x3a2410 : 0x6e665c).fillCircle(X(cx), Y(cy), 3.2).fillStyle(0xf4e6c0).fillCircle(X(cx), Y(cy), 1.6);
    g.fillStyle(pret ? 0x3a2410 : 0x5a544c, 0.9).fillRoundedRect(x0 - 1, y0 - 1, l + 2, h + 2, 4).fillStyle(pret ? 0xf6ead0 : 0xd6d0c4).fillRoundedRect(x0, y0, l, h, 3).lineStyle(1, pret ? 0xb08a4a : 0x8a8478).strokeRoundedRect(x0 + 2, y0 + 2, l - 4, h - 4, 2);
    if (bt) g.fillStyle(0x7a6a58).fillRoundedRect(x0 + l - bt.width - 10, y0 + 3, bt.width + 6, h - 6, 3);
    const zone = scene.add.rectangle(x0 + l / 2, y0 + h / 2, l, h, 0xffffff, 0.001).setInteractive({ useHandCursor: pret });
    zone.on('pointerover', () => { if (pret) t.setColor('#8a2a10'); info(pret ? `${q.nom} · ${q.sous}${id === ici ? ' · tu y es' : ' · clique pour y aller'}` : `${q.nom} · ${q.sous} : bientôt (chantier ${q.chantier} de la ville)`); });
    zone.on('pointerout', () => { t.setColor(pret ? '#3a2410' : '#6e665c'); info(null); });
    zone.on('pointerdown', () => choisir(id));
    c.add([zone, t]); if (bt) c.add(bt);
    cartouches[id] = { t, x0, y0, l, h };
  }
  // les passages : des médaillons d'or numérotés ; ceux qui mènent à un quartier pas prêt sont ternis
  for (const p of PASSAGES_VILLE) {
    const [px, py] = p.plan, x = X(px), y = Y(py), ouvert = p.entre.every(quartierPret);
    const m = scene.add.graphics();
    m.fillStyle(0x1a0e06).fillCircle(x, y, 8.5).fillStyle(ouvert ? 0xb8862a : 0x8a8478).fillCircle(x, y, 7.2).fillStyle(ouvert ? 0xf0cf5a : 0xc4beb2).fillCircle(x - 0.8, y - 0.8, 5.4).fillStyle(ouvert ? 0xfff0b0 : 0xe0dcd4).fillCircle(x - 2.4, y - 2.6, 1.6);
    const n = scene.add.text(x, y + 0.5, String(p.n), style(10, ouvert ? '#3a1e06' : '#4a463e', { fontStyle: 'bold', brut: true })).setOrigin(0.5);
    const z = scene.add.circle(x, y, 10, 0xffffff, 0.001).setInteractive();
    const [a, b] = p.entre.map(id => QUARTIERS_VILLE[id].nom);
    z.on('pointerover', () => info(`${p.n} · ${p.nom[0].toUpperCase() + p.nom.slice(1)} : ${a} ⇄ ${b}${ouvert ? '' : ' (bientôt)'}`));
    z.on('pointerout', () => info(null));
    c.add([m, n, z]);
  }
  // tu es ici : l'épingle rouge, qui palpite doucement
  { const px = X(hx), py = Y(hy), gp = scene.add.graphics();
    gp.fillStyle(0x2a0a08).fillCircle(px, py - 15, 8).fillTriangle(px - 6, py - 11, px + 6, py - 11, px, py + 1).fillStyle(0xd8281e).fillCircle(px, py - 15, 6).fillTriangle(px - 4, py - 12, px + 4, py - 12, px, py - 1).fillStyle(0xffe0d0).fillCircle(px - 2, py - 17, 2);
    const ti = scene.add.text(0, 0, 'tu es ici', style(11, '#b81810', { fontStyle: 'bold', brut: true, stroke: '#f4ecd4', strokeThickness: 4 }));
    // (là où il ne couvre aucun autre nom : en haut à gauche de l'épingle, sinon à droite, sinon en dessous)
    const autres = []; const voir = l => { for (const o of l) { if (o.list) voir(o.list); else if (o.type === 'Text' && o !== ti && o.text) autres.push(o.getBounds()); } }; voir(c.list);
    for (const [x, y, ox] of [[px - 9, py - 30, 1], [px + 9, py - 30, 0], [px - 9, py + 10, 1], [px + 9, py + 10, 0], [px - 12, py - 15, 1], [px + 12, py - 15, 0]]) {
      ti.setOrigin(ox, 0.5).setPosition(x, y); const b = ti.getBounds();
      if (b.x > 6 && b.right < 954 && b.y > E.bandeau && !autres.some(a => a.x < b.right && b.x < a.right && a.y < b.bottom && b.y < a.bottom)) break; }
    c.add([gp, ti]);
    scene.tweens.add({ targets: gp, y: -3, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
  c.add(bulleInfo);
  // un clic sur le plan lui-même : le quartier qui est là
  im.setInteractive().on('pointerdown', (p) => { const q = quartierSurLePlan((p.worldX - E.ox) / E.k, (p.worldY - E.oy) / E.k); if (q) choisir(q); });
  const fermer = () => { if (!c.active) return; scene.tweens.add({ targets: c, alpha: 0, duration: 180, onComplete: () => c.destroy() }); };
  function choisir(id) {
    const q = QUARTIERS_VILLE[id];
    if (!quartierPret(id)) { Son.jouer('refus'); info(`${q.nom} : bientôt. On y travaille (chantier ${q.chantier} de la ville).`); return; }
    if (id === ici) { info(`Tu es déjà ${id === 'place' ? 'sur la place des Mastres' : 'dans ' + q.nom[0].toLowerCase() + q.nom.slice(1)}.`); return; }
    Son.jouer('clic');
    c.destroy();
    allerDansLaVille(scene, { quartier: id, depuis: ici });
  }
  c.fermer = fermer;
  c.once('destroy', () => { if (scene.planVille === c) scene.planVille = null; if (commeCarte && scene.carteC === c) scene.carteC = null; if (surFermer) surFermer(); });
  return c;
}
function fermerPlanVille(scene) { if (scene.planVille && scene.planVille.active) { scene.planVille.destroy(); return true; } return false; }
// (pour la carte M de la place des Mastres, sans toucher à sa scène) : sa carte ouverte se referme et le plan de la ville
// prend sa place, rangé comme elle dans this.carteC (M ou Échap le referment ; la place se recadre sur JeuneGoy). Il suffit,
// dans la carte de la place, d'un bouton : creerBouton(this, x, y, l, 'Le plan de la ville', () => basculerVersPlanVille(this)).
function basculerVersPlanVille(scene) {
  if (scene.carteC && scene.carteC !== scene.planVille && scene.carteC.active) { scene.carteC.destroy(); scene.carteC = null; }
  if (scene.planVille && scene.planVille.active) { scene.planVille.destroy(); return null; }
  return ouvrirPlanVille(scene, { commeCarte: scene.scene.key === 'Marche', surFermer: () => { if (scene.cadrerPlace && scene.place) scene.cadrerPlace(true); } });
}

// --- Aller d'un lieu à un autre ---
// cible : { quartier, arrivee, depuis } (un quartier de QUARTIERS_VILLE : sa scène, et l'endroit où l'on arrive) ou
// { scene, arrivee, donnees } (une scène). Fondu au noir (toutes les caméras), sauvegarde comme les autres lieux, puis
// la scène suivante, où ARRIVEES_VILLE pose JeuneGoy qui entre en marchant.
function allerDansLaVille(scene, cible) {
  const G = window.GAME;
  let cle = cible.scene, arrivee = cible.arrivee, donnees = cible.donnees || {};
  if (cible.quartier) {
    const q = QUARTIERS_VILLE[cible.quartier]; cle = q.scene;
    if (!arrivee) arrivee = entreeVers(cible.quartier, cible.depuis);
    if (cle === 'Quartier') donnees = { ...donnees, quartier: cible.quartier, arrivee };
  }
  if (!cle || scene.allerEnCours) return;
  scene.allerEnCours = true;
  if (G && typeof Sauvegarde !== 'undefined') Sauvegarde.maintenant(G, cle === 'Nuit' ? 'Maison' : 'Marche');
  const suite = () => {
    const s = scene.scene.get(cle);
    if (ARRIVEES_VILLE[cle] && arrivee && s) s.events.once('create', () => { try { ARRIVEES_VILLE[cle](s, arrivee); } catch (e) { console.warn('arrivée', e); } });
    scene.scene.start(cle, donnees);
  };
  if (cible.fonduFait) return suite();
  for (const cam of scene.cameras.cameras) cam.fadeOut(450, 0, 0, 0);
  scene.cameras.main.once('camerafadeoutcomplete', suite);
}
// L'arrivée dans un quartier qu'on rejoint par le plan, selon le quartier d'où l'on vient (par le passage qui les relie)
function entreeVers(quartier, depuis) {
  const def = typeof DECORS_QUARTIERS !== 'undefined' && DECORS_QUARTIERS[quartier];
  if (quartier === 'place') return 'arche';
  if (def && def.entrees) return def.entrees[depuis] || def.entrees.defaut;
  return null;
}
// Ce qui place JeuneGoy dans la scène d'arrivée : il entre par le passage, à pied (jamais posé d'un coup au milieu)
const ARRIVEES_VILLE = {
  // la place des Mastres : sous l'arche, il monte vers la fontaine
  Marche(s, arrivee) {
    if (!s.place || !s.heros || !s.heros.active) return;
    if (arrivee === 'arche') {
      const [x, y] = LIEUX_PLACE.arche;
      s.heros.setPosition(x, y - 10); s.vueHeros = 'dos'; s.poserHeros(0);
      if (s.ombreHeros) s.ombreHeros.setPosition(x + 2, y - 12);
      s.cadrerPlace(true);
      s.time.delayedCall(60, () => { if (s.heros && s.heros.active && !s.bloquePlace()) s.partirVers(x, y - 280); });   // (jusqu'au-delà du toit du porche : on le voit sortir de dessous)
    }
  },
  // la rue (de côté, d'avant les quartiers) : il y revient par où il est parti, et fait quelques pas
  Rue(s, arrivee) {
    if (!s.heros || s.pont) return;
    const P = PLACES_RUE;
    const [x, vers] = arrivee === 'ouest' ? [P.shop + 120, P.shop - 60] : arrivee === 'placette' ? [P.fontaine + 120, P.fontaine + 40] : [s.heros.x, null];
    s.heros.x = x; s.heros.setFlipX(vers !== null && vers < x);
    s.cameras.main.scrollX = Phaser.Math.Clamp(x - 480, 0, (s.largeur || LARGEUR_RUE) - 960);
    if (vers !== null) s.cible = vers;
  },
};

// --- (dans la rue d'avant) le chemin de la placette : une pancarte près de la fontaine ---
// Le tronçon de démonstration du socle (la placette de la Fontaine, dessinée avec le moteur des quartiers) : on y entre
// depuis la rue en passant derrière la fontaine. JeuneGoy va jusqu'à la pancarte, se tourne vers la placette, fondu.
function brancherQuartiersRue(rue) {
  if (rue.pont || !quartierPret('soucolline')) return;
  const P = PLACES_RUE, x = P.fontaine + 120;
  if (typeof prechaufferQuartier === 'function') prechaufferQuartier(rue, 'soucolline');   // (son sol se prépare en tâche de fond, pendant qu'on est dans la rue)
  if (typeof prechaufferPlanVille === 'function') prechaufferPlanVille(rue, 7000);
  const t = ecriteauRue(rue, x, 404, '▲ La placette de la Fontaine', { taille: 12, profondeur: 8.62 }).setInteractive({ useHandCursor: true });
  const poteau = rue.add.rectangle(x, 440, 5, 62, 0x5a3a20).setDepth(8.61).setStrokeStyle(1, 0x2a1a0c);
  t.on('pointerdown', () => {
    if (rue.transition || rue.fini) return;
    rue.transition = true; rue.allerVers(x);
    const attendre = () => {
      if (!rue.sys.isActive()) return;
      if (rue.cible !== null) return rue.time.delayedCall(60, attendre);
      // il se tourne vers la placette (de dos : il entre dans la profondeur), fait deux pas, et la vue change en fondu
      rue.fini = true;
      if (rue.heros && rue.heros.active) { rue.heros.setTexture(textureJoueur(rue, rue.G, 'dos')).setFlipX(false); rue.tweens.add({ targets: rue.heros, y: rue.heros.y - 6, scale: rue.heros.scale * 0.97, duration: 450 }); }
      allerDansLaVille(rue, { quartier: 'soucolline', arrivee: 'rue', depuis: 'rue' });
    };
    attendre();
  });
  return { t, poteau };
}

// --- Les enseignes ---
// Une plaque de rue, clouée à l'angle d'une maison : une pierre de grès taillée (ou une planche, ou de l'émail bleu), son
// biseau éclairé en haut à gauche, deux clous, le nom gravé (le même lettrage que les noms des étals). Le nom tient
// toujours dans la plaque : elle s'allonge pour lui, au besoin les lettres se serrent (lettrageHD).
function plaqueRueHD(s, l, h, matiere = 'gres') {
  const cle = `plaqueRue_${matiere}_${l}x${h}`; if (s.textures.exists(cle)) return cle;
  const t = toileDecor(l, h), base = { gres: 0xd2c4a4, bois: 0xa87a48, email: 0x2e4e86 }[matiere] || 0xd2c4a4;
  t.rampes.plaque = rampe(base); t.rampes.clou = rampe(0x6a6a70);
  for (let y = 0; y < h; y++) for (let x = 0; x < l; x++) {
    let k = 3;
    if (y === 0 || x === 0) k = 5; else if (y === 1 || x === 1) k = 4; else if (y === h - 1 || x === l - 1) k = 1; else if (y === h - 2 || x === l - 2) k = 2;
    if (matiere === 'bois' && y > 1 && y < h - 2 && (y % 4 === 0)) k = Math.min(k, 2);   // (les veines de la planche)
    if (matiere !== 'email' && hachage(x >> 1, y >> 1, 9301) > 0.93 && k === 3) k = 2;   // (la pierre un peu piquée)
    if ((x === 0 || x === l - 1) && (y === 0 || y === h - 1)) continue;   // les coins arrondis
    t.poser(x, y, 'plaque', k);
  }
  if (matiere === 'email') for (let x = 3; x < l - 3; x++) { t.poser(x, 3, 'plaque', 5); t.poser(x, h - 4, 'plaque', 5); }   // le filet blanc de l'émail
  for (const x of [3, l - 4]) { t.poser(x, Math.floor(h / 2), 'clou', 4); t.poser(x, Math.floor(h / 2) + 1, 'clou', 1); }
  t.contour(); t.texture(s, cle); return cle;
}
// La plaque posée dans un conteneur du monde, son bas en (x, y) ; yTri : sa profondeur. Renvoie [la plaque, le nom].
//   entre : [xa, xb], le mur où elle est clouée (elle y tient en entier, à 8 du bord) ; cote : 'gauche' ou 'droite' (contre ce bord)
function poserPlaqueRue(s, conteneur, x, y, texte, { matiere = 'gres', taille = 11, yTri = y, echelle = 2, entre = null, cote = null } = {}) {
  const couleur = matiere === 'email' ? '#f4f0e4' : '#2a1608', fond = { gres: 0xd2c4a4, bois: 0xa87a48, email: 0x2e4e86 }[matiere] || 0xd2c4a4;
  const L = lettrageHD(s, texte, { police: 'Alegreya', graisse: 900, taille, couleur, fond, genre: matiere === 'email' ? 'peint' : 'grave', largeur: 400, hauteur: 18, lignesMax: 1 });
  const l = Math.ceil((L.l + 12) / echelle), h = Math.ceil((L.h + 6) / echelle);
  if (entre) { const [xa, xb] = entre, m = l * echelle / 2 + 8; x = cote === 'gauche' ? xa + m : cote === 'droite' ? xb - m : Phaser.Math.Clamp(x, xa + m, xb - m); }
  const p = s.add.image(x, y, plaqueRueHD(s, l, Math.max(9, h), matiere)).setOrigin(0.5, 1).setScale(echelle);
  p.yTri = yTri; conteneur.add(p);
  const n = poserLettrage(s, conteneur, x, y - Math.max(9, h) * echelle / 2, texte, { police: 'Alegreya', graisse: 900, taille, couleur, fond, genre: matiere === 'email' ? 'peint' : 'grave', largeur: 400, hauteur: 18, lignesMax: 1 });
  n.yTri = yTri + 0.01;
  return [p, n];
}
// Le nom du quartier, à l'entrée : un ruban de parchemin qui se déroule sous le bandeau du haut (fondu et léger agrandissement),
// reste deux secondes et demie, puis s'efface. Le texte tient toujours dans le ruban (il s'allonge pour lui).
function banniereQuartier(scene, nom, sous = '', { y = 104, profondeur = 45, duree = 2600 } = {}) {
  if (scene.banniereQ && scene.banniereQ.active) scene.banniereQ.destroy();
  const c = scene.add.container(480, y).setDepth(profondeur).setAlpha(0).setScale(0.92);
  const t1 = scene.add.text(0, sous ? -9 : 0, nom, style(26, '#3a2410', { fontStyle: 'bold' })).setOrigin(0.5);
  const t2 = sous ? scene.add.text(0, 17, sous, style(13, '#6a4a28', { fontStyle: 'italic' })).setOrigin(0.5) : null;
  const l = Math.min(900, Math.max(t1.width, t2 ? t2.width : 0) + 90), h = sous ? 66 : 48;
  const r = scene.add.image(0, 0, rubanQuartierHD(scene, Math.ceil(l / 2), Math.ceil(h / 2))).setScale(2);
  c.add([r, t1]); if (t2) c.add(t2);
  scene.banniereQ = c;
  scene.tweens.add({ targets: c, alpha: 1, scale: 1, duration: 420, ease: 'Back.easeOut' });
  scene.tweens.add({ targets: c, alpha: 0, delay: duree, duration: 650, onComplete: () => c.destroy() });
  return c;
}
// Le ruban : un parchemin aux bouts roulés, son ombre, un filet d'or
function rubanQuartierHD(s, l, h) {
  const cle = `rubanQuartier_${l}x${h}`; if (s.textures.exists(cle)) return cle;
  const t = toileDecor(l, h); t.rampes.parch = rampe(0xeedcb4); t.rampes.filet = rampe(0xb8862a); t.rampes.rouleau = rampe(0xd8c090);
  for (let y = 1; y < h - 1; y++) for (let x = 6; x < l - 6; x++) { const bord = y === 1 ? 5 : y === h - 2 ? 1 : y === 2 ? 4 : 3; t.poser(x, y, 'parch', hachage(x, y, 9310) > 0.95 ? bord - 1 : bord); }
  for (let x = 8; x < l - 8; x++) { t.poser(x, 4, 'filet', 4); t.poser(x, h - 5, 'filet', 2); }
  for (const [x0, sens] of [[0, 1], [l - 6, -1]]) for (let y = 0; y < h; y++) for (let a = 0; a < 6; a++) {   // les bouts roulés
    const u = sens > 0 ? a : 5 - a, k = u === 0 ? 1 : u === 5 ? 2 : u < 3 ? 4 : 3; t.poser(x0 + a, y, 'rouleau', y === 0 || y === h - 1 ? k - 1 : k); }
  t.contour(); t.texture(s, cle); return cle;
}
