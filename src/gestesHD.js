// (v1.66) Les gestes muets : JeuneGoy ne parle jamais (comme les héros muets des contes), alors il répond avec son
// corps. Chaque geste est une courte suite d'images clés, dessinées par le vrai moteur (dessinerCorpsVue + rig) :
// les bras posés par angles (brasA, posesHD.js), puis le buste et la tête tournés par rigDeformer. Les textures sont
// mises en cache comme les autres poses (une fois par tenue) ; rien n'est sauvegardé.
//  - jouerGeste(scene, img, 'oui', apres) : le personnage visible (JeuneGoy sur la place, dans l'intro ; ou un PNJ
//    avec opts.quoi, un figurant de corpsHD) hoche la tête, s'incline, tend la main...
//  - gesteDuChoix(texte) : le geste que veut dire un choix de dialogue (« Merci ! » → la main sur le cœur).
// (retours du joueur, Q152) Les gestes ne servent que dans les cinématiques et les scènes vues de l'extérieur (la place,
// l'intro) : rien à la première personne (au comptoir, des dizaines de conversations par jour : la vue qui bouge
// donnerait mal à la tête).

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
  // saluer de la main (retours du joueur : le bras sur le côté, nettement à l'écart de la tête, lisible de face, de trois
  // quarts et de dos) : le bras s'écarte du corps (abduction : p = 0, a > π/2), le coude à hauteur d'épaule, l'avant-bras
  // dressé ; la main balaie de l'extérieur vers l'intérieur sans jamais revenir devant la tête
  salut: { duree: 130, suite: [0, 1, 2, 1, 2, 1, 2, 1, 0], vues: ['face', 'troisQuarts', 'dos'], images: [
    { membres: { brasP: { p: 0, f: 0, a: 1.25, a2: 2.15 } }, extra: { margeL: 36 } },
    { membres: { brasP: { p: 0, f: 0, a: 2.0, a2: 2.6 } }, extra: { margeL: 40, margeHaut: 34 } },
    { membres: { brasP: { p: 0, f: 0, a: 2.0, a2: 3.08 } }, extra: { margeL: 40, margeHaut: 34 } },
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
  // (de trois quarts, il se tourne vers celui qu'il salue ; de face et de dos, l'image n'est jamais retournée)
  if (vue === 'face' || vue === 'dos') img.setFlipX(false);
  else if (opts.vers !== undefined && Math.abs(opts.vers - img.x) > 2) img.setFlipX(opts.vers < img.x);
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

// --- La table choix de dialogue → geste (extensible) : ce que « répond » JeuneGoy quand on clique un choix, dans une
// scène où on le voit ---
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
