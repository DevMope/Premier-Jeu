// (v1.66) Les gestes muets : JeuneGoy ne parle jamais (comme les héros muets des contes), alors il répond avec son
// corps. Chaque geste est une courte suite d'images clés, dessinées par le vrai moteur (dessinerCorpsVue + rig) :
// les bras posés par angles (brasA, posesHD.js), puis le buste et la tête tournés par rigDeformer. Les textures sont
// mises en cache comme les autres poses (une fois par tenue) ; rien n'est sauvegardé.
//  - jouerGeste(scene, img, 'oui', apres) : le personnage visible (JeuneGoy sur la place, dans l'intro ; ou un PNJ
//    avec opts.quoi, un figurant de corpsHD) hoche la tête, s'incline, tend la main...
//  - jouerGestePremierePersonne(scene, 'coeur', apres) : au comptoir (et devant le mendiant), on voit par les yeux de
//    JeuneGoy : sa tête bouge (la caméra), sa main entre dans le champ (sa manche, sa peau).
//  - gesteDuChoix(texte) : le geste que veut dire un bouton de dialogue (« Merci ! » → la main sur le cœur).

// --- Les images clés de chaque geste ---
// membres : les bras/jambes par angles (comme POSES_HD) ; rig(R, k) : les rotations (buste, tête) ; extra : options du
// moteur (fache : les sourcils froncés). `suite` : l'ordre des images (défaut : aller-retour) ; `duree` : ms par image ;
// `tenir` : ms de plus sur la dernière image de la suite montante.
const GESTES_HD = {
  // hocher la tête (oui) : elle plonge et remonte, deux fois
  oui: { duree: 150, suite: [1, 0, 1], images: [
    { rig: (R) => ({ tete: { a: -5, px: R.cx, py: R.yT } }) },
    { rig: (R) => ({ tete: { a: 18, px: R.cx, py: R.yT }, buste: { a: 2, px: R.cx, py: R.yB } }) },
  ] },
  // secouer la tête (non) : elle bascule d'un côté, de l'autre
  non: { duree: 160, suite: [0, 1, 0, 1], images: [
    { rig: (R, k) => ({ tete: { a: -9, px: R.cx, py: R.yT, tx: -1.5 * k } }) },
    { rig: (R, k) => ({ tete: { a: 9, px: R.cx, py: R.yT, tx: 1.5 * k } }) },
  ] },
  // hausser les épaules : les coudes s'écartent, les paumes s'ouvrent, la tête part de côté
  epaules: { duree: 170, tenir: 450, suite: [0, 1, 1, 0], images: [
    { membres: { brasP: { p: 0.2, f: 0.5, a: 0.3 }, brasL: { p: 0.2, f: 0.5, a: 0.3 } } },
    { membres: { brasP: { p: 0.35, f: 0.95, a: 0.55 }, brasL: { p: 0.35, f: 0.95, a: 0.55 } },
      rig: (R) => ({ buste: { a: -3, px: R.cx, py: R.yB }, tete: { a: -6, px: R.cx, py: R.yT } }) },
  ] },
  // tendre la main (donner, offrir)
  tendreMain: { duree: 160, tenir: 520, suite: [0, 1, 1, 0], images: [
    { membres: { brasP: { p: 0.7, f: 0.3, a: 0.05 } } },
    { membres: { brasP: { p: 1.25, f: 0.12, a: 0.3 } }, rig: (R) => ({ buste: { a: 4, px: R.cx, py: R.yB } }) },
  ] },
  // montrer du doigt : le bras tendu, droit devant, la tête qui suit
  montrer: { duree: 160, tenir: 520, suite: [0, 1, 1, 0], images: [
    { membres: { brasP: { p: 0.8, f: 0.2, a: 0.05 } } },
    { membres: { brasP: { p: 1.48, f: 0, a: 0.03 } }, rig: (R) => ({ buste: { a: 2, px: R.cx, py: R.yB }, tete: { a: -3, px: R.cx, py: R.yT } }) },
  ] },
  // saluer de la main : le bras se lève bien au-dessus de la tête, la main balaie d'un côté à l'autre
  salut: { duree: 140, suite: [0, 1, 2, 1, 2, 1, 0], images: [
    { membres: { brasP: { p: 1.7, f: 0.5, a: 0.35 } } },
    { membres: { brasP: { p: 2.95, f: 0.15, a: 0.42, a2: -0.55 } }, extra: { margeHaut: 44 } },
    { membres: { brasP: { p: 2.95, f: 0.15, a: 0.42, a2: 0.3 } }, extra: { margeHaut: 44 } },
  ] },
  // s'incliner légèrement : le buste plonge, les bras suivent, en arrière
  incliner: { duree: 190, tenir: 420, suite: [0, 1, 1, 0], images: [
    { membres: { brasP: { p: -0.1, f: 0.1 }, brasL: { p: -0.1, f: 0.1 } }, rig: (R) => ({ buste: { a: 7, px: R.cx, py: R.yB }, tete: { a: 5, px: R.cx, py: R.yT } }) },
    { membres: { brasP: { p: -0.25, f: 0.1 }, brasL: { p: -0.25, f: 0.1 } }, rig: (R) => ({ buste: { a: 15, px: R.cx, py: R.yB }, tete: { a: 11, px: R.cx, py: R.yT } }) },
  ] },
  // croiser les bras : les avant-bras se replient l'un sur l'autre, à la poitrine
  brasCroises: { duree: 170, tenir: 700, suite: [0, 1, 1, 0], images: [
    { membres: { brasP: { p: 0.35, f: 0.9, a: 0.1 }, brasL: { p: 0.35, f: 0.9, a: 0.1 } } },
    { membres: { brasP: { p: 0.55, f: 1.75, a: 0.15 }, brasL: { p: 0.6, f: 1.7, a: 0.1 } }, rig: (R) => ({ buste: { a: -2, px: R.cx, py: R.yB } }) },
  ] },
  // se frotter la nuque (la gêne) : la main derrière la tête, le regard qui fuit vers le sol
  nuque: { duree: 150, suite: [0, 1, 2, 1, 2, 1, 0], images: [
    { membres: { brasP: { p: 1.5, f: 1.1, a: 0.2 } }, rig: (R) => ({ tete: { a: 5, px: R.cx, py: R.yT } }) },
    { membres: { brasP: { p: 2.3, f: 2.15, a: 0.2 } }, extra: { margeHaut: 30 }, rig: (R) => ({ tete: { a: 11, px: R.cx, py: R.yT }, buste: { a: -2, px: R.cx, py: R.yB } }) },
    { membres: { brasP: { p: 2.45, f: 2.3, a: 0.22 } }, extra: { margeHaut: 30 }, rig: (R) => ({ tete: { a: 13, px: R.cx, py: R.yT }, buste: { a: -2, px: R.cx, py: R.yB } }) },
  ] },
  // la main sur le cœur (merci), avec une petite inclinaison
  coeur: { duree: 180, tenir: 560, suite: [0, 1, 1, 0], images: [
    { membres: { brasP: { p: 0.7, f: 1.1, a: 0.05 } } },
    { membres: { brasP: { p: 0.95, f: 1.8, a: 0.05 } }, rig: (R) => ({ buste: { a: 8, px: R.cx, py: R.yB }, tete: { a: 7, px: R.cx, py: R.yT } }) },
  ] },
  // la tête penchée + la main ouverte (une question)
  penche: { duree: 170, tenir: 600, suite: [0, 1, 1, 0], images: [
    { membres: { brasP: { p: 0.5, f: 0.4, a: 0.2 } }, rig: (R, k) => ({ tete: { a: -6, px: R.cx, py: R.yT, tx: 1 * k } }) },
    { membres: { brasP: { p: 0.9, f: 0.6, a: 0.4 } }, rig: (R, k) => ({ tete: { a: -13, px: R.cx, py: R.yT, tx: 2 * k } }) },
  ] },
  // regarder vers le bas (le coffre à ses pieds ; Garrick qui suit ton regard)
  regardeBas: { duree: 220, suite: [0, 1, 1, 0], tenir: 600, images: [
    { rig: (R) => ({ tete: { a: 8, px: R.cx, py: R.yT } }) },
    { rig: (R) => ({ tete: { a: 17, px: R.cx, py: R.yT }, buste: { a: 3, px: R.cx, py: R.yB } }) },
  ] },
  // regarder ses mains ouvertes, paumes vers le ciel (le souvenir des soins)
  mainsOuvertes: { duree: 220, tenir: 900, suite: [0, 1, 1, 0], images: [
    { membres: { brasP: { p: 0.55, f: 0.45, a: 0.12 }, brasL: { p: 0.5, f: 0.5, a: 0.16 } }, rig: (R) => ({ tete: { a: 8, px: R.cx, py: R.yT } }) },
    { membres: { brasP: { p: 0.85, f: 0.6, a: 0.12 }, brasL: { p: 0.8, f: 0.65, a: 0.16 } },
      rig: (R) => ({ tete: { a: 19, px: R.cx, py: R.yT }, buste: { a: 5, px: R.cx, py: R.yB } }) },
  ] },
  // --- L'intro : serrer les mains de Garrick (JeuneGoy), et les mains offertes de Garrick ---
  // JeuneGoy tend les deux bras, puis serre (les sourcils froncés : il promet sans un mot)
  serre: { duree: 190, images: [
    { membres: { brasP: { p: 0.55, f: 0.25, a: 0.05 }, brasL: { p: 0.5, f: 0.3, a: 0.08 } }, rig: (R) => ({ buste: { a: 3, px: R.cx, py: R.yB } }) },
    { membres: { brasP: { p: 1.05, f: 0.12, a: 0.05 }, brasL: { p: 1.0, f: 0.15, a: 0.08 } },
      rig: (R) => ({ buste: { a: 7, px: R.cx, py: R.yB }, tete: { a: -7, px: R.cx, py: R.yT } }) },
    { extra: { fache: true }, membres: { brasP: { p: 1.22, f: 0.1, a: -0.04 }, brasL: { p: 1.26, f: 0.06, a: 0 } },
      rig: (R) => ({ buste: { a: 10, px: R.cx, py: R.yB }, tete: { a: -8, px: R.cx, py: R.yT } }) },
  ] },
  // Garrick se penche vers le petit et offre ses mains, plus bas que les siennes
  offreMains: { duree: 190, images: [
    { membres: { brasP: { p: 0.75, f: 0.35 }, brasL: { p: 0.7, f: 0.4 } }, rig: (R) => ({ buste: { a: 6, px: R.cx, py: R.yB }, tete: { a: 9, px: R.cx, py: R.yT } }) },
    { membres: { brasP: { p: 0.95, f: 0.3 }, brasL: { p: 0.9, f: 0.35 } }, rig: (R) => ({ buste: { a: 9, px: R.cx, py: R.yB }, tete: { a: 10, px: R.cx, py: R.yT } }) },
  ] },
  // ... puis il pose sa main libre par-dessus les mains serrées
  mainDessus: { duree: 190, images: [
    { membres: { brasP: { p: 1.18, f: 0.38, a: 0.06 }, brasL: { p: 0.9, f: 0.35 } },
      rig: (R) => ({ buste: { a: 10, px: R.cx, py: R.yB }, tete: { a: 12, px: R.cx, py: R.yT } }) },
  ] },
};

// --- Dessiner une image clé (le même chemin que dessinerPoseHD, pour un joueur ou un figurant) ---
function membresGeste(M0 = {}) {
  const membres = {};
  for (const [part, val] of Object.entries(M0)) membres[part] = typeof val === 'function' ? val
    : part.startsWith('bras') ? (ctx => brasA(ctx, val)) : (ctx => jambeA(ctx, val, M0[part === 'jambeP' ? 'jambeL' : 'jambeP'] || null));
  return membres;
}
function dessinerGesteHD(spec, dessiner) {
  const options = { margeHaut: 26, margeL: 30, ...(spec.extra || {}), membres: membresGeste(spec.membres), rig: true };
  const t = avecOptionsCorps(options, dessiner);
  const R = t.reperes2, t2 = rigDeformer(t, spec.rig ? spec.rig(R, FINESSE) : {});
  let bas = 0;
  for (let i = 0; i < t2.m.length; i++) if (t2.m[i]) bas = Math.max(bas, Math.floor(i / t2.l));
  const [hx] = t2.vers(R.cx, R.yB, 'corps');
  return { t: t2, x: hx, y: bas + 1, tete: t2.vers(R.cx, R.cy, 'tete'),
    main: t.mainsCote && t.mainsCote.P ? t2.vers(t.mainsCote.P[0], t.mainsCote.P[1], 'mainP') : null,
    mainL: t.mainsCote && t.mainsCote.L ? t2.vers(t.mainsCote.L[0], t.mainsCote.L[1], 'mainL') : null };
}
function enregistrerGeste(scene, cle, r, tenue = null) {
  if (scene.textures.exists(cle)) scene.textures.remove(cle);
  r.t.texture(scene, cle);
  if (tenue !== null) scene.textures.get(cle).tenue = tenue;
  APPUI_POSES[cle] = { x: r.x, y: r.y, l: r.t.l, h: r.t.h, tete: r.tete, main: r.main, mainL: r.mainL };
}
// L'image i du geste pour le joueur (en cache, redessinée quand sa tenue change)
function textureGesteJoueur(scene, G, nom, i, vue = 'troisQuarts') {
  const spec = GESTES_HD[nom].images[i], stade = stadeJoueur(G), tenue = signatureJoueur(G);
  const cle = `joueur_${stade}_geste_${nom}_${i}_${vue}`;
  if (!scene.textures.exists(cle) || scene.textures.get(cle).tenue !== tenue || !APPUI_POSES[cle]) {
    const r = dessinerGesteHD(spec, () => dessinerJoueurHD(apparenceDuJour(G), stade, G.joueur.feminin, 0, G.tenue || [], vue));
    enregistrerGeste(scene, cle, r, tenue);
  }
  return cle;
}
// L'image i du geste pour un figurant ou un voyageur (quoi : comme corpsHD)
function textureGestePerso(scene, quoi, nom, i, vue = 'troisQuarts') {
  const spec = GESTES_HD[nom].images[i], base = specCorps(quoi, null, vue, null);
  const cle = `${base.cle}_geste_${nom}_${i}`;
  if (!scene.textures.exists(cle) || !APPUI_POSES[cle]) {
    const options = { ...base.options };
    delete options.arme;   // (pas d'arme en main pendant un geste ; celle qu'il porte reste rangée sur lui)
    const r = dessinerGesteHD({ ...spec, extra: { ...options, ...(spec.extra || {}) } },
      () => dessinerCorpsVue(base.gene, base.tenue, base.costume, 0, null, vue, {}));
    enregistrerGeste(scene, cle, r);
  }
  return cle;
}

// --- Jouer un geste sur un personnage visible ---
// img : l'image Phaser (posée par les pieds) ; opts : { quoi (un PNJ de corpsHD), vue, vers (x : il se tourne vers là),
// G }. Rend une promesse (finie quand il a repris sa posture). Un seul geste à la fois ; img.gesteFin() l'interrompt
// proprement (quand le personnage se remet à marcher).
function jouerGeste(scene, img, nom, apres = null, opts = {}) {
  const spec = GESTES_HD[nom];
  if (!spec || !img || !img.active || img.gesteEnCours) { if (apres) apres(); return Promise.resolve(); }
  const G = opts.G || (typeof GAME !== 'undefined' ? GAME : (window.GAME || null));
  const vue = opts.vue || 'troisQuarts';
  let cles;
  try {
    cles = spec.images.map((f, i) => opts.quoi ? textureGestePerso(scene, opts.quoi, nom, i, vue) : textureGesteJoueur(scene, G, nom, i, vue));
  } catch (e) { console.warn('geste', nom, e); if (apres) apres(); return Promise.resolve(); }
  const ordre = spec.suite || [...spec.images.keys(), ...[...spec.images.keys()].reverse().slice(1)];
  const dernierHaut = ordre.lastIndexOf(Math.max(...ordre));
  const avant = { cle: img.texture.key, ox: img.originX, oy: img.originY, flip: img.flipX };
  img.gesteEnCours = true;
  if (opts.vers !== undefined && Math.abs(opts.vers - img.x) > 2) img.setFlipX(opts.vers < img.x);
  return new Promise(res => {
    let k = 0, fini = false;
    const fin = () => {
      if (fini) return;
      fini = true;
      img.gesteEnCours = false; img.gesteFin = null;
      if (img.active && scene.textures.exists(avant.cle)) { img.setTexture(avant.cle); img.setOrigin(avant.ox, avant.oy); img.setFlipX(avant.flip); }
      if (apres) apres();
      res();
    };
    img.gesteFin = fin;
    const pas = () => {
      if (fini) return;
      if (!img.active || !scene.sys.isActive()) return fin();
      if (k >= ordre.length) return fin();
      img.setTexture(cles[ordre[k]]);
      origineCorps(img);
      const duree = (spec.duree || 150) + (spec.tenir && k === dernierHaut ? spec.tenir : 0);
      k++;
      scene.time.delayedCall(duree, pas);
    };
    pas();
  });
}

// --- Les gestes à la première personne (le comptoir, le mendiant de près) ---
// On voit par les yeux de JeuneGoy : hocher la tête fait bouger la vue (la caméra plonge et remonte, doucement),
// et sa main entre dans le champ (sa vraie manche, sa vraie peau) pour saluer, donner, la poser sur son cœur.

// La main de JeuneGoy vue de dos (la sienne : sa peau, la manche de son haut), dessinée une fois par tenue
function textureMainJoueurPP(scene, G) {
  const tenue = signatureJoueur(G), cle = 'joueur_mainPP';
  if (scene.textures.exists(cle) && scene.textures.get(cle).tenue === tenue) return cle;
  if (scene.textures.exists(cle)) scene.textures.remove(cle);
  const ap = apparenceDuJour(G);
  const t = new ToileHD(120, 190);
  t.relief = true; t.cel = true;
  t.rampes.peau = PEAUX_VIVES[PEAU_DE_CREATION[ap.peau] ?? 1] || PEAUX_VIVES[1];
  t.rampes.manche = rampeVive(APPARENCE.haut[ap.haut] ? APPARENCE.haut[ap.haut][1] : 0x4f7a3a);
  // l'avant-bras et sa manche, qui montent du bas du champ
  cylindre(t, 'manche', [60, 196], [60, 102], 21, { decalage: 0.1 });
  t.forme('manche', ellipsoide(60, 102, 22, 8), { decalage: -0.4 });   // l'ourlet de la manche
  // le poignet, le dos de la main
  cylindre(t, 'peau', [60, 106], [60, 82], 12, { decalage: 0.2 });
  t.forme('peau', ellipsoide(60, 60, 19, 26), { decalage: 0.25 });
  // quatre doigts (le majeur plus long), et le pouce sur le côté
  const doigts = [[44, 40, 24], [55, 36, 28], [66, 37, 27], [76, 43, 22]];
  for (const [x, y, lg] of doigts) cylindre(t, 'peau', [x, y + 10], [x, y - lg + 10], 4.6, { decalage: 0.3 });
  cylindre(t, 'peau', [43, 74], [30, 52], 5.4, { decalage: 0.35 });
  // les plis des phalanges
  for (const [x, y] of [[44, 38], [55, 33], [66, 34], [76, 40]]) t.poser(x, y, 'peau', 1);
  contourEpais(t, CONTOUR_CORPS.tours);
  t.texture(scene, cle);
  scene.textures.get(cle).tenue = tenue;
  return cle;
}

// La caméra qui « hoche la tête » : un petit mouvement doux, puis tout revient exactement en place
function mouvementTetePP(scene, points, duree, apres) {
  const cam = scene.cameras.main, sx = cam.scrollX, sy = cam.scrollY, rot = cam.rotation;
  const o = { u: 0 };
  scene.tweens.add({ targets: o, u: 1, duration: duree, ease: 'Sine.easeInOut',
    onUpdate: () => {
      const f = o.u * (points.length - 1), i = Math.min(points.length - 2, Math.floor(f)), v = f - i;
      const li = (a, b) => a + (b - a) * (0.5 - Math.cos(Math.PI * v) / 2);
      const [ax, ay, ar = 0] = points[i], [bx, by, br = 0] = points[i + 1];
      cam.setScroll(sx + li(ax, bx), sy + li(ay, by));
      cam.setRotation(rot + li(ar, br));
    },
    onComplete: () => { cam.setScroll(sx, sy); cam.setRotation(rot); if (apres) apres(); } });
}
// La main qui entre dans le champ : x à l'écran, hauteur de montée, balancement (vague), tenue, angle au repos
function mainDansLeChamp(scene, G, { x = 650, monte = 128, vague = 0, tenir = 420, angle = 0, duree = 260, echelle = 1.45 }, apres) {
  const cle = textureMainJoueurPP(scene, G);
  const y0 = 560 + Math.ceil(190 * echelle);
  const img = scene.add.image(x, y0, cle).setOrigin(0.5, 1).setScale(echelle).setDepth(400).setScrollFactor(0).setAngle(angle);
  const sortir = () => scene.tweens.add({ targets: img, y: y0, angle, duration: duree, ease: 'Sine.easeIn', onComplete: () => { img.destroy(); if (apres) apres(); } });
  scene.tweens.add({ targets: img, y: y0 - monte, duration: duree, ease: 'Sine.easeOut', onComplete: () => {
    if (!vague) { scene.time.delayedCall(tenir, sortir); return; }
    scene.tweens.add({ targets: img, angle: { from: angle - 16, to: angle + 16 }, duration: 150, yoyo: true, repeat: vague, ease: 'Sine.easeInOut',
      onComplete: () => scene.time.delayedCall(Math.max(0, tenir - vague * 300), sortir) });
  } });
  return img;
}
function jouerGestePremierePersonne(scene, nom, apres = null) {
  const G = typeof GAME !== 'undefined' ? GAME : window.GAME;
  if (!G || !scene.sys.isActive() || scene._gestePP) { if (apres) apres(); return; }
  scene._gestePP = true;
  const fin = () => { scene._gestePP = false; if (apres) apres(); };
  try {
    if (nom === 'oui') return mouvementTetePP(scene, [[0, 0], [0, 6], [0, -1], [0, 5], [0, 0]], 560, fin);
    if (nom === 'non') return mouvementTetePP(scene, [[0, 0], [-7, 0], [7, 0], [-5, 0], [0, 0]], 620, fin);
    if (nom === 'incliner') return mouvementTetePP(scene, [[0, 0], [0, 11], [0, 11], [0, 0]], 900, fin);
    if (nom === 'penche') return mouvementTetePP(scene, [[0, 0], [0, 2, 0.05], [0, 2, 0.05], [0, 0]], 950, fin);
    if (nom === 'salut') return void mainDansLeChamp(scene, G, { x: 690, monte: 230, vague: 3, tenir: 950, angle: -4 }, fin);
    if (nom === 'tendreMain') return void mainDansLeChamp(scene, G, { x: 580, monte: 185, tenir: 520, angle: -8, echelle: 1.35 }, fin);
    if (nom === 'coeur') { mouvementTetePP(scene, [[0, 0], [0, 8], [0, 8], [0, 0]], 820, null); return void mainDansLeChamp(scene, G, { x: 480, monte: 130, tenir: 620, angle: 16, echelle: 1.4 }, fin); }
  } catch (e) { console.warn('geste PP', nom, e); return fin(); }
  fin();
}

// --- La table choix de dialogue → geste (extensible) : ce que « répond » JeuneGoy quand on clique un bouton ---
const GESTES_CHOIX = [
  [/merci/i, 'coeur'],
  [/au revoir|à bientôt|a bientot|adieu|bonne route|bon voyage/i, 'salut'],
  [/\?\s*»?\s*$/, 'penche'],
  [/^«?\s*\.\.\.|^«?\s*…/, 'penche'],
  [/^«?\s*(oui|d['’]accord|entendu|reprendre|allons-y|je veux bien)/i, 'oui'],
  [/^«?\s*(non|ignorer|rien|pas question|plus tard)/i, 'non'],
  [/^«?\s*(donner|offrir|tiens|voilà|voici)/i, 'tendreMain'],
  [/^«?\s*(bonjour|bienvenue|salut)/i, 'incliner'],
];
function gesteDuChoix(texte) {
  for (const [re, g] of GESTES_CHOIX) if (re.test(texte || '')) return g;
  return null;
}
// Au comptoir (ou devant le mendiant) : le geste que veut dire ce bouton, à la première personne
function gesteChoixComptoir(scene, texte) {
  const g = gesteDuChoix(texte);
  if (g) jouerGestePremierePersonne(scene, g);
}
