// (planche 85 v2, validée) Les poses du coucher et du lever, pour le joueur (en pyjama, ou dans ses habits du jour) :
// des membres posés par angles (brasA, jambeA : posesHD.js), puis le buste, la tête, les jambes tournés par le rig
// (rigHD.js). Toutes les transitions sont de vraies images intermédiaires : melangerPoses(A, B, u) mêle deux poses (les
// angles, les coudes et les mains, les rotations), et le moteur redessine le corps entier, éclairé et cerné, à chaque image.
// Vue de trois-quarts, tourné vers la droite (P : le bras ou la jambe proche, L : le lointain).
//   imagePoseJoueur(scene, G, pyj, nom | spec, cle) → { cle, l, h, pied, hanche, tete, main } (les repères dans la texture)
//   avec { parties } : seulement ces parties (le corps sous la couverture, les avant-bras et les mains posés dessus)
// Les images se peignent une fois (elles restent d'un soir à l'autre) ; la file prechargerCoucher les prépare en tâche
// de fond pendant que la scène joue autre chose.

// --- Les poses ---
const R_COUCHE = (R, a = -90) => ({ buste: { a, px: R.cx, py: R.yB }, jambeP: { a: -90, px: R.cx, py: R.yB }, jambeL: { a: -90, px: R.cx, py: R.yB } });
// au lit : une main posée sur la poitrine (ou le ventre), à plat (le coude replié contre le flanc)
const mainSurCorps = (h, dz = 0.6) => ({ ik: ({ k, ep, yT, yB, cote }) => ({ coude: [cote * ep * (cote > 0 ? 0.55 : 0.92), ep * 0.5, yT + (yB - yT) * 0.66], main: [cote * 1.4 * k, ep * 0.55 + dz * k, yT + (yB - yT) * h] }) });   // (l'avant-bras à plat sur le ventre, la main sur la poitrine : couché, ils reposent sur la couverture)
const BRAS_REPOS = { ik: ({ k, ep, yT, yB, cote, P }) => ({ coude: [cote * (ep + 1.2 * k), -0.8 * k, yT + P.torse * 0.5], main: [cote * (ep + 0.6 * k), 1 * k, yB + 1.5 * k] }) };
const JAMBES_LIT = { jambeP: { p: 0.06, f: 0.12, appui: false }, jambeL: { p: 0.02, f: 0.08, appui: false } };
const JAMBES_BORD = { jambeP: { p: 1.45, f: 1.5, appui: false }, jambeL: { p: 1.32, f: 1.38, appui: false } };
const POSES_COUCHER = {
  // debout : exactement la pose du moteur (les bras le long du corps), pour passer sans à-coup de l'image debout aux poses
  debout: { membres: { brasP: BRAS_REPOS, brasL: BRAS_REPOS, jambeP: { p: 0, f: 0 }, jambeL: { p: 0, f: 0 } } },
  // à l'armoire : le bras levé vers l'étagère, puis le pyjama plié tenu contre la poitrine
  attrape: { membres: { brasL: { p: 2.75, f: 0.06, a: 0.12 }, brasP: { p: 0.12, f: 0.25 }, jambeP: { p: 0, f: 0 }, jambeL: { p: 0, f: 0 } }, rig: R => ({ tete: { a: -7, px: R.cx, py: R.yT } }) },
  tientPli: { membres: { brasP: { p: 0.95, f: 1.15, a: 0.02 }, brasL: { p: 0.85, f: 1.25, a: 0.04 }, jambeP: { p: 0, f: 0 }, jambeL: { p: 0, f: 0 } } },
  // il tire sur la feuille du paravent pour le déplier
  tire: { membres: { brasL: { p: 1.35, f: 0.2, a: 0.25 }, brasP: { p: 0.9, f: 0.4, a: 0.02 }, jambeP: { p: -0.12, f: 0.05 }, jambeL: { p: 0.22, f: 0.25 } }, rig: R => ({ buste: { a: 6, px: R.cx, py: R.yB } }) },
  // souffler la bougie : à peine penché, le menton tendu, une main levée devant la poitrine pour abriter la flamme
  souffle: { extra: { souffle: true, boucheForcee: 2 }, membres: { jambeP: { p: -0.12, f: 0.05 }, jambeL: { p: 0.2, f: 0.2 }, brasP: { p: 0.15, f: 0.2 }, brasL: { p: 0.55, f: 1.25, a: 0.05 } },
    rig: R => ({ buste: { a: 7, px: R.cx, py: R.yB }, tete: { a: -5, px: R.cx, py: R.yT } }) },
  // s'asseoir au bord du lit : les mains posées derrière lui sur le matelas, il se hisse ; puis assis, les jambes qui pendent
  appuie: { membres: { brasP: { p: -0.55, f: 0.25, a: 0.22 }, brasL: { p: -0.45, f: 0.2, a: 0.18 }, jambeP: { p: 0.5, f: 0.75, appui: false }, jambeL: { p: 0.4, f: 0.7, appui: false } }, rig: R => ({ buste: { a: 8, px: R.cx, py: R.yB } }) },
  assisBord: { membres: { brasP: { p: -0.28, f: 0.35, a: 0.25 }, brasL: { p: -0.22, f: 0.3, a: 0.2 }, ...JAMBES_BORD }, rig: R => ({ buste: { a: 2, px: R.cx, py: R.yB } }) },
  // il attrape le haut de la couverture et la rabat vers le pied du lit
  ouvre: { membres: { brasL: { p: 1.15, f: 0.15, a: 0.32 }, brasP: { p: -0.28, f: 0.35, a: 0.25 }, ...JAMBES_BORD }, rig: R => ({ buste: { a: 14, px: R.cx, py: R.yB } }) },
  // les jambes qui passent dans le lit (elles tournent à la hanche), puis assis dans son lit, le dos droit
  assisLit: { extra: { avantBras: true }, membres: { brasP: { p: 0.7, f: 0.45, a: 0.05 }, brasL: { p: 0.62, f: 0.5, a: 0.05 }, ...JAMBES_LIT }, rig: R => R_COUCHE(R, -4) },
  // (le soir : il prend la couverture des deux mains pour la remonter sur ses jambes)
  tireCouv: { extra: { avantBras: true }, membres: { brasL: { p: 1.25, f: 0.15, a: 0.25 }, brasP: { p: 1.0, f: 0.4, a: 0.02 }, ...JAMBES_LIT }, rig: R => R_COUCHE(R, 18) },
  // couché : les bras le long du corps ; les mains posées sur la couverture ; endormi (la tête qui roule un peu sur l'oreiller)
  litBras: { extra: { avantBras: true }, membres: { brasP: { p: 0.04, f: 0.12 }, brasL: { p: 0.03, f: 0.1 }, ...JAMBES_LIT }, rig: R => R_COUCHE(R) },
  litMains: { extra: { avantBras: true }, membres: { brasP: mainSurCorps(0.2), brasL: mainSurCorps(0.27), ...JAMBES_LIT }, rig: R => R_COUCHE(R) },
  litDort: { extra: { avantBras: true, yeuxFermes: true, boucheForcee: 1 }, membres: { brasP: mainSurCorps(0.22), brasL: mainSurCorps(0.29), ...JAMBES_LIT }, rig: R => ({ ...R_COUCHE(R), tete: { a: 8, px: R.cx, py: R.yT } }) },
  litReveil: { extra: { avantBras: true }, membres: { brasP: mainSurCorps(0.2), brasL: mainSurCorps(0.27), ...JAMBES_LIT }, rig: R => ({ ...R_COUCHE(R), tete: { a: -6, px: R.cx, py: R.yT } }) },
  // le matin : assis, il s'étire en bâillant ; au bord du lit, il se frotte les yeux
  etire: { extra: { avantBras: true, yeuxFermes: true, baille: true, boucheForcee: 2 }, membres: { brasP: { p: 2.95, f: 0.2, a: 0.42 }, brasL: { p: 2.95, f: 0.2, a: 0.42 }, ...JAMBES_LIT },
    rig: R => ({ ...R_COUCHE(R, -6), tete: { a: -9, px: R.cx, py: R.yT } }) },
  frotte: { extra: { yeuxFermes: true, boucheForcee: 1 }, membres: { brasP: { p: 0.95, f: 2.25, a: 0.05 }, brasL: { p: -0.22, f: 0.3, a: 0.2 }, ...JAMBES_BORD }, rig: R => ({ buste: { a: 6, px: R.cx, py: R.yB }, tete: { a: 6, px: R.cx, py: R.yT } }) },
  // se lever du bord du lit : penché en avant, les pieds qui touchent le sol
  releve: { membres: { brasP: { p: 0.5, f: 0.5, a: 0.1 }, brasL: { p: 0.35, f: 0.4, a: 0.1 }, jambeP: { p: 0.75, f: 0.95, appui: false }, jambeL: { p: 0.62, f: 0.85, appui: false } }, rig: R => ({ buste: { a: 18, px: R.cx, py: R.yB } }) },
};

// Les membres d'une pose, en fonctions (comme dessinerPoseHD)
function membresPose(spec) {
  const M0 = spec.membres || {}, membres = {};
  for (const [part, v] of Object.entries(M0)) membres[part] = typeof v === 'function' ? v : part.startsWith('bras') ? (ctx => brasA(ctx, v)) : (ctx => jambeA(ctx, v, M0[part === 'jambeP' ? 'jambeL' : 'jambeP'] || null));
  return membres;
}
// Mêler deux poses (u de 0 à 1) : les coudes et les mains, les genoux et les pieds, les rotations du rig ; le reste (les yeux,
// la bouche) change à mi-chemin
function melangerPoses(A, B, u) {
  if (typeof A === 'string') A = POSES_COUCHER[A];
  if (typeof B === 'string') B = POSES_COUCHER[B];
  const mA = membresPose(A), mB = membresPose(B), membres = {};
  const lerp = (a, b) => (Array.isArray(a) && Array.isArray(b) ? a.map((v, i) => v + (b[i] - v) * u) : typeof a === 'number' && typeof b === 'number' ? a + (b - a) * u : u < 0.5 ? a : b);
  for (const part of new Set([...Object.keys(mA), ...Object.keys(mB)])) {
    const fa = mA[part] || mB[part], fb = mB[part] || mA[part];
    membres[part] = ctx => { const a = fa(ctx) || {}, b = fb(ctx) || {}, r = {}; for (const cle of new Set([...Object.keys(a), ...Object.keys(b)])) r[cle] = lerp(a[cle] ?? b[cle], b[cle] ?? a[cle]); return r; };
  }
  const rig = (R, k) => {
    const a = A.rig ? A.rig(R, k) : {}, b = B.rig ? B.rig(R, k) : {}, r = {};
    for (const part of new Set([...Object.keys(a), ...Object.keys(b)])) {
      const pa = a[part] || { a: 0, px: (b[part] || {}).px, py: (b[part] || {}).py }, pb = b[part] || { a: 0, px: pa.px, py: pa.py };
      r[part] = { a: (pa.a || 0) + ((pb.a || 0) - (pa.a || 0)) * u, px: pa.px, py: pa.py, tx: (pa.tx || 0) + ((pb.tx || 0) - (pa.tx || 0)) * u, ty: (pa.ty || 0) + ((pb.ty || 0) - (pa.ty || 0)) * u };
    }
    return r;
  };
  const ea = A.extra || {}, eb = B.extra || {};
  const extra = { ...(u < 0.5 ? ea : eb) };
  if (ea.avantBras || eb.avantBras) extra.avantBras = true;   // (les avant-bras restent à part pendant tout le mouvement)
  return { membres, rig, extra, _melange: true };
}

// Dessiner une pose du joueur (pyj : l'id du pyjama, ou null pour ses habits du jour), en deux temps : le corps (le moteur),
// puis chaque couche rendue par le rig (toutes les parties, ou PARTIES_LIT : le corps sous la couverture et le dessus)
function corpsPoseJoueur(G, pyj, spec) {
  if (typeof spec === 'string') spec = POSES_COUCHER[spec];
  const membres = spec._melange ? spec.membres : membresPose(spec);
  const extra = { margeHaut: 26, margeL: 26, ...(spec.extra || {}), membres, rig: true };
  const t = dessinerJoueurNuit(G, pyj, { vue: spec.vue || 'troisQuarts', options: extra });
  const R = t.reperes2;
  return { t, R, rp: spec.rig ? spec.rig(R, FINESSE) : {} };
}
function coucheDePose({ t, R, rp }, liste = null) {
  const t2 = rigDeformer(t, rp, { parties: liste });
  return { t: t2, pied: t2.vers(R.cx, R.H, 'jambeP'), hanche: t2.vers(R.cx, R.yB, 'jambeP'), tete: t2.vers(R.cx, R.cy, 'tete'),
    main: t.mainXY ? t2.vers(t.mainXY[0], t.mainXY[1], 'mainP') : null, mainL: t.mainsCote && t.mainsCote.L ? t2.vers(t.mainsCote.L[0], t.mainsCote.L[1], 'mainL') : null };
}
// Les parties du corps sous la couverture, et ce qui se pose dessus (les avant-bras, les mains)
// (l'avant-bras lointain passe de l'autre côté du corps : on ne voit que sa main, posée sur la poitrine)
const PARTIES_LIT = { corps: ['corps', 'tete', 'jambeP', 'jambeL', 'brasP', 'brasL', 'avantL'], dessus: ['avantP', 'mainP', 'mainL'] };

// La texture d'une pose (créée une fois, gardée d'un soir à l'autre) : ses repères dans REPERES_COUCHER[clé]
const REPERES_COUCHER = {};
function signaturePose(G, pyj) { return (pyj || 'jour') + '|' + signatureCorpsJoueur(G) + (pyj ? '' : '|' + (G.tenue || []).join(',')); }
function clesPose(cle, parties) { return parties ? Object.keys(parties).map(n => cle + '_' + n) : [cle]; }
function posePrete(scene, G, pyj, cle, parties = null) {
  const sig = signaturePose(G, pyj);
  return clesPose(cle, parties).every(c => scene.textures.exists(c) && scene.textures.get(c).tenue === sig && REPERES_COUCHER[c]);
}
function enregistrerCouche(scene, c, x, sig) {
  if (scene.textures.exists(c)) scene.textures.remove(c);
  x.t.texture(scene, c);
  scene.textures.get(c).tenue = sig;
  // (la boîte de ce qui est peint : le bas du corps couché se pose sur le matelas, le nez se règle sur la flamme)
  let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1;
  for (let i = 0; i < x.t.m.length; i++) if (x.t.m[i]) { const px = i % x.t.l, py = (i / x.t.l) | 0; if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py; }
  REPERES_COUCHER[c] = { l: x.t.l, h: x.t.h, pied: x.pied, hanche: x.hanche, tete: x.tete, main: x.main, mainL: x.mainL, t: x.t, boite: [x0, y0, x1, y1] };
}
function lirePose(cle, parties) { return parties ? Object.fromEntries(Object.keys(parties).map(n => [n, { cle: cle + '_' + n, ...REPERES_COUCHER[cle + '_' + n] }])) : { cle, ...REPERES_COUCHER[cle] }; }
function imagePoseJoueur(scene, G, pyj, spec, cle, { parties = null } = {}) {
  if (!posePrete(scene, G, pyj, cle, parties)) {
    const sig = signaturePose(G, pyj), corps = corpsPoseJoueur(G, pyj, spec);
    if (parties) for (const [n, liste] of Object.entries(parties)) enregistrerCouche(scene, cle + '_' + n, coucheDePose(corps, liste), sig);
    else enregistrerCouche(scene, cle, coucheDePose(corps), sig);
  }
  return lirePose(cle, parties);
}
// Poser une image sur sa texture de pose, par un de ses repères ('pied' ou 'hanche'), au point (x, y) de la scène
function poserSurRepere(img, info, repere, x, y) {
  const p = info[repere], fx = img.flipX;
  img.setTexture(info.cle).setOrigin((fx ? info.l - p[0] : p[0]) / info.l, p[1] / info.h).setPosition(x, y);
  return img;
}

// --- Les transitions : une suite d'images, chacune mêlée entre deux poses (nommées) ---
// etapes : [{ pose, n }] (n : le nombre d'images pour aller de la précédente à celle-ci) → la liste des [clé, spec, bout]
// (bout : la première ou la dernière image d'une étape, une vraie pose). Les clés ne dépendent que des poses : deux gestes
// qui passent par les mêmes images (et le même geste joué à l'envers) les partagent.
function imagesTransition(etapes, prefixe = 'cch_') {
  const out = [], pose = p => POSES_COUCHER[p];
  for (let i = 0; i < etapes.length; i++) {
    const e = etapes[i];
    if (!i) { out.push([prefixe + e.pose, pose(e.pose), true]); continue; }
    const a = etapes[i - 1].pose, b = e.pose, n = e.n || 3, [p, q, sens] = a < b ? [a, b, 1] : [b, a, -1];
    for (let j = 1; j <= n; j++) {
      if (j === n) { out.push([prefixe + b, pose(b), true]); continue; }
      const u = sens > 0 ? j / n : 1 - j / n;   // (le même mélange, qu'on aille de a vers b ou de b vers a)
      out.push([`${prefixe}${p}~${q}_${Math.round(u * 100)}`, melangerPoses(p, q, u), false]);
    }
  }
  return out;
}

// La file des poses à peindre en tâche de fond, par petits morceaux (le corps, puis chaque couche) pour ne pas figer l'image
const FILE_COUCHER = [];
let COUCHER_EN_COURS = false;
function prechargerCoucher(scene, G, pyj, liste, parties = null) {
  for (const [cle, spec] of liste) if (!FILE_COUCHER.some(j => j.cle === cle && j.pyj === pyj)) FILE_COUCHER.push({ scene, G, pyj, cle, spec, parties });
  if (!COUCHER_EN_COURS && FILE_COUCHER.length) { COUCHER_EN_COURS = true; setTimeout(peindreCoucher, 20); }
}
function peindreCoucher() {
  const j = FILE_COUCHER[0];
  if (!j) { COUCHER_EN_COURS = false; return; }
  try {
    if (!(j.scene.sys && j.scene.textures && j.scene.sys.isActive()) || posePrete(j.scene, j.G, j.pyj, j.cle, j.parties)) FILE_COUCHER.shift();
    else if (!j.corps) j.corps = corpsPoseJoueur(j.G, j.pyj, j.spec);
    else {
      const sig = signaturePose(j.G, j.pyj), reste = j.parties ? Object.entries(j.parties).filter(([n]) => !(j.faites || []).includes(n)) : null;
      if (!j.parties) { enregistrerCouche(j.scene, j.cle, coucheDePose(j.corps), sig); FILE_COUCHER.shift(); }
      else { const [n, liste] = reste[0]; enregistrerCouche(j.scene, j.cle + '_' + n, coucheDePose(j.corps, liste), sig); (j.faites = j.faites || []).push(n); if (reste.length === 1) FILE_COUCHER.shift(); }
    }
  } catch (e) { console.warn('pose du coucher', e); FILE_COUCHER.shift(); }
  setTimeout(peindreCoucher, 10);
}
function viderFileCoucher() { FILE_COUCHER.length = 0; }
