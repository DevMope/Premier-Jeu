// (planches 85 et 86) Les poses des voyageurs : des membres posés par angles (le moteur des corps les dessine), puis le
// buste, la tête ou tout le corps tournés par le rig (rigHD.js), rééclairés, recernés. Vue de trois-quarts : il regarde
// vers la droite ; « P » = le bras ou la jambe proche (à gauche à l'écran), « L » = le lointain.
// corpsHD(scene, quoi, 'aGenoux') renvoie la texture d'une pose ; APPUI_POSES[clé] dit où la poser (le point d'appui au sol,
// sous les hanches) et où est sa tête.

// Un bras par angles : p, l'épaule (0 le long du corps, π/2 tendu devant, π en l'air ; négatif : en arrière) ; f, le coude
// (l'avant-bras continue de tourner vers l'avant) ; a, l'écart sur le côté. `ik` : une fonction qui place tout elle-même.
function brasA(ctx, { p = 0, f = 0, a = 0, a2 = null, ik = null } = {}) {
  if (ik) return ik(ctx);
  const { k, ep, yT, yB, cote } = ctx, Lb = (yB + 1.5 * k) - (yT + 2 * k), e = [cote * (ep - 0.8 * k), 0.3 * k, yT + 2 * k];
  const d1 = [cote * Math.sin(a), Math.sin(p) * Math.cos(a), Math.cos(p) * Math.cos(a)];
  const coude = [e[0] + cote * 2 * k + d1[0] * Lb * 0.5, e[1] + d1[1] * Lb * 0.5, e[2] + d1[2] * Lb * 0.5];
  const p2 = p + f, b2 = a2 ?? a * 0.6, d2 = [cote * Math.sin(b2), Math.sin(p2) * Math.cos(b2), Math.cos(p2) * Math.cos(b2)];
  return { coude, main: [coude[0] - cote * 0.6 * k + d2[0] * Lb * 0.52, coude[1] + d2[1] * Lb * 0.52, coude[2] + d2[2] * Lb * 0.52] };
}
// Une jambe par angles : p, la cuisse (0 droite, positif vers l'avant) ; f, le genou (le mollet repart en arrière) ; a,
// l'écart ; bout -1 : le pied pointe en arrière (à genoux) ; genouSol : c'est le genou qui touche terre. Debout, le pied se
// pose au même sol que l'autre appui (le genou se tend ou se plie pour y arriver), sauf avec appui: false.
function geomJambeA(ctx, { p = 0, f = 0, a = 0 }) {
  const { k, ep, yB, sol, cote } = ctx, hy = yB - 1 * k, Lc = (sol - yB) / 2 + k, Ls = (sol - yB) / 2 - 3 * k;
  const g = [cote * ep * 0.45 + cote * Math.sin(a) * Lc, Math.sin(p) * Lc, hy + Math.cos(p) * Lc];
  const q = p - f, pd = [cote * ep * 0.48 + cote * Math.sin(a) * (Lc + Ls * 0.8), g[1] + Math.sin(q) * Ls, g[2] + Math.cos(q) * Ls];
  return { g, pd, hy, Lc, Ls };
}
function jambeA(ctx, sp = {}, autre = null) {
  const contact = (o) => { const G = geomJambeA(ctx, o); return o.genouSol ? G.g[2] + 2.6 * ctx.k * (ctx.P.membre || 1) : G.pd[2] + 3 * ctx.k; };
  const s2 = { ...sp };
  if (autre && sp.appui !== false && !sp.genouSol) {
    const sol0 = Math.max(contact(sp), autre.appui === false ? -1e9 : contact(autre));
    const G = geomJambeA(ctx, sp), v = (sol0 - 3 * ctx.k - G.g[2]) / G.Ls;
    if (Math.abs(v) <= 1) { const q0 = (sp.p || 0) - (sp.f || 0), q = (q0 >= 0 ? 1 : -1) * Math.acos(v); s2.f = (sp.p || 0) - q; }
  }
  const { g, pd } = geomJambeA(ctx, s2);
  return { genou: g, pied: pd, leve: ctx.sol - 3 * ctx.k - pd[2], bout: sp.bout ?? 1 };
}

// --- Les armes en action, dans la main de devant, à leur vraie taille (ARMES_HD, corpsVueHD.js) ---
// La famille d'une arme : chaque pose dit, pour chacune, dans quel sens part le bout qui frappe (une lame pointe, une hache se
// lève tête en haut, une lance se tient à l'horizontale, un bâton debout)
function familleArme(arme) {
  return ['hache', 'marteau', 'massue'].includes(arme) ? 'masse' : arme === 'lance' ? 'hampe' : arme === 'baton' || arme === 'bambou' ? 'baton' : arme === 'arc' ? 'arc' : 'lame';
}
function dirArme(dir, arme) { return Array.isArray(dir) ? dir : dir[familleArme(arme)] || dir.lame; }
// dir : de la main vers le bout qui frappe (ou, par famille : { lame, masse, hampe, baton })
function armeEnMain(dir) {
  return (A) => {
    const { t, k, M, matMain, gm, dessinerArmeAxe, arme } = A;
    if (arme && ARMES_HD[arme]) { const ax = axeArmeHD(arme, [M[0], M[1] + 1 * k], dirArme(dir, arme), k); dessinerArmeAxe(ax.A, ax.B); }
    t.forme(matMain, ellipsoide(M[0], M[1] + 1 * k * gm, 2.2 * k * gm, 2.3 * k * gm), { decalage: 0.95 });   // la main serrée dessus
  };
}
// L'arc long (1,70 m) : le bois dans la main lointaine, la corde tirée jusqu'à la joue par la main proche (tendu), la flèche
function arcEnMain(tendu) {
  return (A) => {
    const { t, k, kA, segBras, matMain, gm } = A, Mb = segBras[0][2], Mc = segBras[1][2], h = ARMES_HD.arc.L / 2 * k, creux = h * (tendu ? 0.2 : 0.14);
    const haut = [Mb[0] - creux * 0.5, Mb[1] - h], bas = [Mb[0] - creux * 0.5, Mb[1] + h];
    let prec = null; for (let i = 0; i <= 20; i++) { const u = i / 20, v = Math.sin(u * Math.PI) * creux, p = [haut[0] + v, haut[1] + (bas[1] - haut[1]) * u]; if (prec) cylindre(t, 'boisA', prec, p, (1.05 - Math.abs(u - 0.5) * 0.5) * kA, { decalage: 0.4 }); prec = p; }
    const main = tendu ? [Mc[0] + 0.6 * k, Mc[1] + 0.6 * k] : [haut[0], Mb[1]];
    cylindre(t, 'cordeA', haut, main, 0.3 * kA, { decalage: 0.3, ombre: false }); cylindre(t, 'cordeA', main, bas, 0.3 * kA, { decalage: 0.3, ombre: false });
    if (tendu) {
      // la flèche (75 cm), encochée à la corde, la pointe qui dépasse de l'arc
      const vx = Mb[0] - main[0], vy = Mb[1] + 0.3 * k - main[1], nv = Math.hypot(vx, vy) || 1, fin = [main[0] + vx / nv * 27 * k, main[1] + vy / nv * 27 * k];
      cylindre(t, 'boisA', main, fin, 0.45 * kA, { decalage: 0.6, ombre: false }); t.forme('lameA', ellipsoide(fin[0] + 0.8 * kA, fin[1], 1.4 * kA, 0.9 * kA), { decalage: 0.7, ombre: false });
      for (const dd of [-1, 1]) cylindre(t, 'plume', [main[0] + 0.6 * kA, main[1]], [main[0] + 2.2 * kA, main[1] + dd * 1 * kA], 0.45 * kA, { decalage: 0.5, ombre: false });
    }
    cylindre(t, 'cuir', [Mb[0] + creux * 0.5, Mb[1] - 2 * k], [Mb[0] + creux * 0.5, Mb[1] + 2 * k], 1.2 * kA, { decalage: 0.6, ombre: false });   // la poignée
    t.forme(matMain, ellipsoide(Mb[0], Mb[1] + 0.6 * k, 1.9 * k * gm, 2 * k * gm), { decalage: 0.9 });
    t.forme(matMain, ellipsoide(Mc[0], Mc[1] + 0.6 * k, 1.9 * k * gm, 2 * k * gm), { decalage: 0.9 });
  };
}
// Le bouclier rond (60 cm : bois cerclé de fer, l'umbo au milieu) au bras lointain, devant le corps ; l'arme dans l'autre main
function bouclierEnMain(dir) {
  return (A) => {
    const { t, k, kA, segBras } = A, Mb = segBras[0][2], Cb = segBras[0][1];
    if (!t.rampes.ferA) rampesArmesHD(t);   // (sans arme, le moteur n'a pas posé les teintes des armes)
    t.rampes.boisB = rampeVive(0x8a5a2a); const cxB = (Mb[0] + Cb[0]) / 2 + 1.5 * k, cyB = (Mb[1] + Cb[1]) / 2, rB = 8.5 * kA;
    const avant = t.partie; t.partie = 'brasL';
    t.forme('ferA', ellipsoide(cxB, cyB, rB * 0.62, rB), { decalage: 0.2 });
    t.forme('boisB', ellipsoide(cxB, cyB, rB * 0.62 - 1.2 * kA, rB - 1.2 * kA), { decalage: 0.1, motif: (x, y) => (Math.floor((y - cyB) / (2.2 * kA)) % 2 ? -0.35 : 0.1) });
    t.forme('ferA', ellipsoide(cxB + 0.4 * kA, cyB, 2 * kA, 2.6 * kA), { decalage: 0.7 });
    t.partie = avant;
    t.bouclierXY = [cxB, cyB];
    armeEnMain(dir)(A);
  };
}

const POSES_HD = {};
(() => {
  const P = POSES_HD;
  // --- Tomber : il perd l'équilibre (en arrière, ou vers l'avant), tombe à genoux, puis il est au sol, sonné ---
  P.desequilibre = { pose: 'stupeur', membres: { jambeP: { p: -0.3, f: 0.35 }, jambeL: { p: 0.85, f: 0.7 }, brasP: { p: 2.3, f: 0.5, a: 0.45 }, brasL: { p: 1.7, f: 0.4, a: 0.7 } },
    rig: (R, k) => ({ buste: { a: -14, px: R.cx, py: R.yB }, tete: { a: 12, px: R.cx, py: R.yT }, global: { a: -9, px: R.cx - 4 * k, py: R.sol } }) };
  P.trebuche = { pose: 'stupeur', membres: { jambeP: { p: -0.75, f: 0.5 }, jambeL: { p: 0.45, f: 0.6 }, brasP: { p: 1.55, f: 0.25, a: 0.2 }, brasL: { p: 1.25, f: 0.4, a: 0.35 } },
    rig: (R, k) => ({ buste: { a: 24, px: R.cx, py: R.yB }, tete: { a: -10, px: R.cx, py: R.yT }, global: { a: 12, px: R.cx + 4 * k, py: R.sol } }) };
  P.aGenoux = { extra: { boucheForcee: 3 }, membres: { jambeP: { p: -0.05, f: 1.55, bout: -1, genouSol: true }, jambeL: { p: 1.5, f: 1.5 }, brasP: { p: 0.2, f: 0.1, a: 0.1 }, brasL: { p: 1.0, f: 0.45 } },
    rig: (R, k) => ({ buste: { a: 12, px: R.cx, py: R.yB }, tete: { a: 20, px: R.cx, py: R.yT } }) };
  P.auSol = { pose: 'stupeur', membres: { jambeP: { p: 1.0, f: 1.7 }, jambeL: { p: 0.25, f: 0.3 }, brasP: { p: 2.85, f: 0.45, a: 0.1 }, brasL: { p: 0.1, f: 0.4 } },
    rig: (R, k) => ({ tete: { a: 10, px: R.cx, py: R.yT }, global: { a: -90, px: R.cx, py: R.yB } }) };
  // face contre terre : vu de profil, couché sur le ventre, la tête du côté où il tombait, les bras qui ont voulu le retenir
  P.auSolVentre = { vue: 'profil', pose: 'stupeur', membres: { jambeP: { p: 0.1, f: 0.15, appui: false }, jambeL: { p: -0.05, f: 0.3, appui: false }, brasP: { p: 2.55, f: 0.5 }, brasL: { p: 1.9, f: 0.7 } },
    rig: (R, k) => ({ tete: { a: -12, px: R.cx, py: R.yT }, global: { a: 90, px: R.cx, py: R.yB } }) };
  // --- Mourir : les genoux lâchent, il s'affaisse, puis il gît (sur le dos, ou face contre terre) ---
  P.effondre1 = { extra: { yeuxFermes: true, boucheForcee: 1 }, membres: { jambeP: { p: 0.75, f: 1.45 }, jambeL: { p: 0.62, f: 1.3 }, brasP: { p: 0.42, f: 0.15 }, brasL: { p: 0.5, f: 0.1 } },
    rig: (R, k) => ({ buste: { a: 24, px: R.cx, py: R.yB }, tete: { a: 26, px: R.cx, py: R.yT } }) };
  P.effondre2 = { extra: { yeuxFermes: true, boucheForcee: 1 }, membres: { jambeP: { p: 0.08, f: 1.66, bout: -1, genouSol: true }, jambeL: { p: 0.16, f: 1.6, bout: -1, genouSol: true }, brasP: { p: 0.8, f: 0.1 }, brasL: { p: 0.72, f: 0.15 } },
    rig: (R, k) => ({ buste: { a: 44, px: R.cx, py: R.yB }, tete: { a: 30, px: R.cx, py: R.yT } }) };
  // (vers le dos : il part en arrière, assis sur les talons, la tête qui tombe)
  P.effondreDos = { extra: { yeuxFermes: true, boucheForcee: 1 }, membres: { jambeP: { p: 0.08, f: 1.66, bout: -1, genouSol: true }, jambeL: { p: 0.9, f: 1.7 }, brasP: { p: -0.35, f: 0.2, a: 0.25 }, brasL: { p: 0.25, f: 0.2 } },
    rig: (R, k) => ({ buste: { a: -30, px: R.cx, py: R.yB }, tete: { a: -18, px: R.cx, py: R.yT }, global: { a: -8, px: R.cx, py: R.sol } }) };
  P.git = { extra: { yeuxFermes: true, boucheForcee: 1 }, membres: { jambeP: { p: 0.55, f: 0.95 }, jambeL: { p: 0.08, f: 0.12 }, brasP: { p: 2.95, f: 0.35, a: 0.05 }, brasL: { p: 0.12, f: 0.2 } },
    rig: (R, k) => ({ tete: { a: -12, px: R.cx, py: R.yT }, global: { a: -90, px: R.cx, py: R.yB } }) };
  P.gitVentre = { vue: 'profil', extra: { yeuxFermes: true, boucheForcee: 1 }, membres: { jambeP: { p: 0.05, f: 0.05, appui: false }, jambeL: { p: -0.06, f: 0.18, appui: false }, brasP: { p: 2.75, f: 0.35 }, brasL: { p: 0.25, f: 0.25 } },
    rig: (R, k) => ({ tete: { a: -4, px: R.cx, py: R.yT }, global: { a: 90, px: R.cx, py: R.yB } }) };
  // --- Se battre (l'arme réelle passe en option : POSES_COMBAT dit quelle paire de poses prend chaque arme) ---
  P.coupArme = { dirArme: [-0.55, -0.85], armeMain: armeEnMain([-0.55, -0.85]), membres: { jambeP: { p: -0.4, f: 0.1 }, jambeL: { p: 0.5, f: 0.55 }, brasP: { p: 2.75, f: 0.95, a: 0.25 }, brasL: { p: 1.15, f: 0.5, a: 0.25 } },
    extra: { fache: true }, rig: (R, k) => ({ buste: { a: -7, px: R.cx, py: R.yB } }) };
  P.coupFrappe = { dirArme: [1, 0.42], armeMain: armeEnMain([1, 0.42]), membres: { jambeP: { p: -0.6, f: 0.1 }, jambeL: { p: 0.75, f: 0.85 }, brasP: { p: 1.35, f: 0.05 }, brasL: { p: -0.55, f: 0.35, a: 0.35 } },
    extra: { fache: true }, rig: (R, k) => ({ buste: { a: 13, px: R.cx, py: R.yB }, tete: { a: -6, px: R.cx, py: R.yT } }) };
  // l'estoc (la lance, la rapière) : ramenée à la hanche, puis la pointe part droit devant
  P.estocArme = { dirArme: [1, -0.18], armeMain: armeEnMain([1, -0.18]), membres: { jambeP: { p: -0.45, f: 0.1 }, jambeL: { p: 0.55, f: 0.6 }, brasP: { p: 0.6, f: 1.35, a: 0.3 }, brasL: { p: 1.1, f: 0.6, a: 0.2 } },
    extra: { fache: true }, rig: (R, k) => ({ buste: { a: -6, px: R.cx, py: R.yB } }) };
  P.estocFrappe = { dirArme: [1, -0.05], armeMain: armeEnMain([1, -0.05]), membres: { jambeP: { p: -0.7, f: 0.1 }, jambeL: { p: 0.8, f: 0.9 }, brasP: { p: 1.55, f: 0.02 }, brasL: { p: -0.5, f: 0.35, a: 0.35 } },
    extra: { fache: true }, rig: (R, k) => ({ buste: { a: 15, px: R.cx, py: R.yB }, tete: { a: -8, px: R.cx, py: R.yT } }) };
  P.arcBande = { arc: true, armeMain: arcEnMain(true), membres: { jambeP: { p: -0.25, f: 0.12 }, jambeL: { p: 0.3, f: 0.12 }, brasL: { p: 1.55, f: 0.05, a: 0.05 },
      brasP: { ik: ({ k, ep, yT, cy, P, cote }) => ({ coude: [cote * (ep + 5 * k), -4 * k, yT + 1.5 * k], main: [cote * 1 * k, P.rx * 0.9, cy + P.ry * 0.75] }) } },
    extra: { fache: true }, rig: (R, k) => ({ buste: { a: -3, px: R.cx, py: R.yB } }) };
  P.arcTire = { arc: true, armeMain: arcEnMain(false), membres: { jambeP: { p: -0.25, f: 0.12 }, jambeL: { p: 0.3, f: 0.12 }, brasL: { p: 1.55, f: 0.05, a: 0.05 }, brasP: { p: -2.0, f: 2.3, a: 0.35 } },
    extra: { fache: true }, rig: (R, k) => ({ buste: { a: -5, px: R.cx, py: R.yB } }) };
  P.batonLeve = { dirArme: [0.12, -1], armeMain: armeEnMain([0.12, -1]), membres: { jambeP: { p: -0.3, f: 0.1 }, jambeL: { p: 0.35, f: 0.2 }, brasP: { p: 2.85, f: 0.25, a: 0.2 }, brasL: { p: 1.4, f: 0.45, a: 0.3 } },
    extra: { fache: true }, rig: (R, k) => ({ buste: { a: -5, px: R.cx, py: R.yB }, tete: { a: -8, px: R.cx, py: R.yT } }) };
  P.batonPointe = { dirArme: [1, -0.12], armeMain: armeEnMain([1, -0.12]), membres: { jambeP: { p: -0.55, f: 0.1 }, jambeL: { p: 0.6, f: 0.7 }, brasP: { p: 1.5, f: 0.05 }, brasL: { p: 1.2, f: 0.3, a: 0.1 } },
    extra: { fache: true }, rig: (R, k) => ({ buste: { a: 10, px: R.cx, py: R.yB } }) };
  // la fronde : elle tourne au-dessus de la tête, puis le bras se détend vers l'avant
  P.frondeTourne = { dirArme: [-0.35, -1], armeMain: armeEnMain([-0.35, -1]), membres: { jambeP: { p: -0.35, f: 0.1 }, jambeL: { p: 0.4, f: 0.3 }, brasP: { p: 2.9, f: 0.2, a: 0.15 }, brasL: { p: 0.9, f: 0.5, a: 0.3 } },
    extra: { fache: true }, rig: (R, k) => ({ buste: { a: -6, px: R.cx, py: R.yB } }) };
  P.frondeLache = { dirArme: [1, 0.6], armeMain: armeEnMain([1, 0.6]), membres: { jambeP: { p: -0.6, f: 0.1 }, jambeL: { p: 0.7, f: 0.8 }, brasP: { p: 1.75, f: 0.1 }, brasL: { p: -0.4, f: 0.3, a: 0.3 } },
    extra: { fache: true }, rig: (R, k) => ({ buste: { a: 12, px: R.cx, py: R.yB } }) };
  // le bouclier : la parade de face, puis la parade haute (le bouclier levé au-dessus de la tête)
  P.bouclierParade = { bouclier: true, dirArme: { lame: [-0.5, -0.86], masse: [-0.5, -0.86], hampe: [0.35, -1], baton: [0.2, -1] }, armeMain: bouclierEnMain({ lame: [-0.5, -0.86], masse: [-0.5, -0.86], hampe: [0.35, -1], baton: [0.2, -1] }), membres: { jambeP: { p: -0.5, f: 0.1 }, jambeL: { p: 0.75, f: 1.0 }, brasL: { p: 1.15, f: 1.05, a: 0.1 }, brasP: { p: 2.5, f: 1.25, a: 0.3 } },
    extra: { fache: true }, rig: (R, k) => ({ buste: { a: 8, px: R.cx, py: R.yB }, tete: { a: 6, px: R.cx, py: R.yT } }) };
  P.bouclierHaute = { bouclier: true, dirArme: { lame: [-0.25, 0.97], masse: [0.2, 0.98], hampe: [1, 0.2], baton: [0.3, 0.95] }, armeMain: bouclierEnMain({ lame: [-0.25, 0.97], masse: [0.2, 0.98], hampe: [1, 0.2], baton: [0.3, 0.95] }), membres: { jambeP: { p: -0.55, f: 0.6 }, jambeL: { p: 0.85, f: 1.25 }, brasL: { p: 2.35, f: 0.75, a: 0.15 }, brasP: { p: -0.35, f: 0.45, a: 0.2 } },
    extra: { fache: true }, rig: (R, k) => ({ buste: { a: 4, px: R.cx, py: R.yB }, tete: { a: 10, px: R.cx, py: R.yT } }) };
  // la riposte : le bouclier en avant, il frappe par-dessous (après une parade de face)
  const RIPOSTE = { lame: [1, 0.3], masse: [1, 0.55], hampe: [1, -0.04], baton: [1, -0.1] };
  P.bouclierRiposte = { bouclier: true, dirArme: RIPOSTE, armeMain: bouclierEnMain(RIPOSTE), membres: { jambeP: { p: -0.65, f: 0.1 }, jambeL: { p: 0.8, f: 0.95 }, brasL: { p: 1.25, f: 0.9, a: 0.1 }, brasP: { p: 1.3, f: 0.05, a: 0.05 } },
    extra: { fache: true }, rig: (R, k) => ({ buste: { a: 14, px: R.cx, py: R.yB }, tete: { a: -6, px: R.cx, py: R.yT } }) };
  // --- (retours sur la planche 86) Les gens des récits (brigands, pillards, gardes...) : de vraies postures, l'arme tenue
  // comme une arme. La garde (le poids sur la jambe arrière, la pointe vers l'adversaire), la garde basse (l'air sûr de lui),
  // la menace (l'arme levée, l'autre main qui désigne), le recul (le buste en arrière, l'arme en travers), et à terre ---
  const GARDE = { lame: [1, -0.75], masse: [0.45, -1], hampe: [1, -0.14], baton: [0.25, -1] };
  P.garde = { dirArme: GARDE, armeMain: armeEnMain(GARDE), membres: { jambeP: { p: -0.4, f: 0.35 }, jambeL: { p: 0.5, f: 0.7 }, brasP: { p: 1.15, f: 0.65, a: 0.22 }, brasL: { p: 0.85, f: 0.95, a: 0.35 } },
    extra: { fache: true }, rig: (R, k) => ({ buste: { a: 6, px: R.cx, py: R.yB }, tete: { a: -3, px: R.cx, py: R.yT } }) };
  const BASSE = { lame: [1, 0.32], masse: [0.85, 0.5], hampe: [1, 0.12], baton: [0.35, -1] };
  P.gardeBasse = { dirArme: BASSE, armeMain: armeEnMain(BASSE), membres: { jambeP: { p: -0.22, f: 0.12 }, jambeL: { p: 0.28, f: 0.3 }, brasP: { p: 0.55, f: 0.45, a: 0.18 }, brasL: { p: 0.15, f: 1.6, a: 0.45 } },
    extra: { fache: true }, rig: (R, k) => ({ buste: { a: -2, px: R.cx, py: R.yB }, tete: { a: -6, px: R.cx, py: R.yT } }) };
  const MENACE = { lame: [-0.45, -0.9], masse: [-0.3, -1], hampe: [1, -0.42], baton: [0.15, -1] };
  P.menace = { dirArme: MENACE, armeMain: armeEnMain(MENACE), membres: { jambeP: { p: -0.45, f: 0.2 }, jambeL: { p: 0.45, f: 0.4 }, brasP: { p: 2.6, f: 0.9, a: 0.25 }, brasL: { p: 1.55, f: 0.08, a: 0.12 } },
    extra: { fache: true, boucheForcee: 2 }, rig: (R, k) => ({ buste: { a: 4, px: R.cx, py: R.yB }, tete: { a: 2, px: R.cx, py: R.yT } }) };
  const RECUL = { lame: [0.5, -1], masse: [0.25, -1], hampe: [0.85, -0.55], baton: [0.6, -0.8] };
  P.recul = { dirArme: RECUL, armeMain: armeEnMain(RECUL), membres: { jambeP: { p: -0.6, f: 0.75 }, jambeL: { p: 0.4, f: 0.1 }, brasP: { p: 1.85, f: 0.95, a: 0.3 }, brasL: { p: 1.35, f: 1.25, a: 0.5 } },
    extra: { boucheForcee: 2 }, rig: (R, k) => ({ buste: { a: -13, px: R.cx, py: R.yB }, tete: { a: 9, px: R.cx, py: R.yT } }) };
  // saisir (le vampire, le loup-garou) : il se jette en avant, les deux mains tendues, la tête en avant
  P.saisir = { extra: { fache: true, boucheForcee: 2 }, membres: { jambeP: { p: -0.7, f: 0.3 }, jambeL: { p: 0.75, f: 0.9 }, brasP: { p: 1.5, f: 0.25, a: 0.12 }, brasL: { p: 1.35, f: 0.35, a: 0.28 } },
    rig: (R, k) => ({ buste: { a: 18, px: R.cx, py: R.yB }, tete: { a: -10, px: R.cx, py: R.yT } }) };
  // tombé sur les fesses : les jambes devant lui, les mains derrière, au sol ; sonné
  P.surLesFesses = { pose: 'stupeur', membres: { jambeP: { p: 1.4, f: 0.25, appui: false }, jambeL: { p: 1.15, f: 0.6, appui: false }, brasP: { p: -0.8, f: 0.15, a: 0.25 }, brasL: { p: -0.6, f: 0.2, a: 0.35 } },
    rig: (R, k) => ({ buste: { a: -16, px: R.cx, py: R.yB }, tete: { a: 10, px: R.cx, py: R.yT } }) };
  // --- Dormir (le bivouac, Pip, le voyageur qui s'endort) : couché sur le dos, relâché ; les genoux un peu fléchis, une
  // jambe plus repliée que l'autre, posée au sol ; une main sur le ventre, l'autre le long du corps ; la tête sur le sac ---
  P.dortBivouac = { extra: { yeuxFermes: true, boucheForcee: 1 },
    membres: { jambeP: { p: 0.3, f: 1.2, appui: false }, jambeL: { p: -0.15, f: 0.25, appui: false }, brasP: { p: 0.75, f: 1.35, a: -0.1 }, brasL: { p: -0.15, f: 0.3 } },
    rig: (R, k) => ({ tete: { a: 14, px: R.cx, py: R.yT }, global: { a: -90, px: R.cx, py: R.yB } }) };
})();

// La paire de poses (armer, frapper) de chaque arme
const POSES_COMBAT = {
  epee: ['coupArme', 'coupFrappe'], hache: ['coupArme', 'coupFrappe'], marteau: ['coupArme', 'coupFrappe'], massue: ['coupArme', 'coupFrappe'], khopesh: ['coupArme', 'coupFrappe'],
  dague: ['coupArme', 'coupFrappe'], griffes: ['coupArme', 'coupFrappe'], rapiere: ['estocArme', 'estocFrappe'], lance: ['estocArme', 'estocFrappe'],
  baton: ['batonLeve', 'batonPointe'], bambou: ['batonLeve', 'batonPointe'], arc: ['arcBande', 'arcTire'], fronde: ['frondeTourne', 'frondeLache'],
};

const POSES_COMBAT_NOMS = new Set([...Object.values(POSES_COMBAT).flat(), 'bouclierParade', 'bouclierHaute', 'bouclierRiposte', 'garde', 'gardeBasse', 'menace', 'recul']);
// Les postures d'un combattant des récits, selon son arme : garder, menacer, frapper, reculer
function posesActeur(arme) {
  const f = familleArme(arme);
  return { garde: f === 'arc' ? 'arcTire' : 'garde', basse: f === 'arc' ? 'arcTire' : 'gardeBasse', menace: f === 'arc' ? 'arcBande' : 'menace', recul: 'recul',
    attaque: f === 'arc' ? 'arcTire' : f === 'hampe' ? 'estocFrappe' : f === 'baton' ? 'batonPointe' : 'coupFrappe', armer: f === 'arc' ? 'arcBande' : f === 'hampe' ? 'estocArme' : f === 'baton' ? 'batonLeve' : 'coupArme' };
}
// Les poses couchées (pour se relever, on passe d'abord à genoux)
const POSES_COUCHEES = ['auSol', 'auSolVentre', 'git', 'gitVentre', 'dortBivouac', 'surLesFesses'];

// Où poser chaque texture de pose : { x, y } le point d'appui (sous les hanches, au ras du sol), { l, h } sa taille, tete :
// le centre de la tête, bouclier : le centre du bouclier (en pixels de la texture, non retournée)
const APPUI_POSES = {};

// La place qu'il faut autour d'une pose pour son arme (la main peut être un peu devant ou derrière le corps, au-dessus de la
// tête) : la marge en haut, de chaque côté, et en plus devant lui
function margesPoseHD(spec, arme, k = FINESSE) {
  const m = { margeHaut: 26, margeL: 26, margeAvant: 0 };
  if (!arme || !ARMES_HD[arme]) return m;
  if (spec.arc || arme === 'arc') { m.margeHaut = Math.max(26, Math.ceil(ARMES_HD.arc.L / 2 * k - 36)); m.margeAvant = 26 * k; return m; }
  if (!spec.dirArme) return m;
  const [A, B] = porteeArmeHD(arme, dirArme(spec.dirArme, arme), k), xs = [A[0], B[0]], ys = [A[1], B[1]];
  m.margeL = Math.max(26, Math.ceil(-Math.min(...xs) + 32 - 26 * k));
  m.margeAvant = Math.max(0, Math.ceil(Math.max(...xs) + 36 - 26 * k - m.margeL));
  m.margeHaut = Math.max(26, Math.ceil(-Math.min(...ys) + 4));
  return m;
}
// Dessiner une pose : { t (la toile déformée), x, y (le point d'appui), tete } — quoi : comme pour corpsHD
function dessinerPoseHD(quoi, nom, { vue = null, arme = undefined } = {}) {
  const spec = POSES_HD[nom], v = spec.vue || vue || 'troisQuarts';
  const base = specCorps(quoi, null, v, arme), membres = {}, M0 = spec.membres || {};
  for (const [part, val] of Object.entries(M0)) membres[part] = typeof val === 'function' ? val : part.startsWith('bras') ? (ctx => brasA(ctx, val)) : (ctx => jambeA(ctx, val, M0[part === 'jambeP' ? 'jambeL' : 'jambeP'] || null));
  const armeReelle = arme !== undefined ? arme : base.options.arme;
  const options = { ...base.options, ...margesPoseHD(spec, spec.armeMain && armeReelle ? armeReelle : null), ...(spec.extra || {}), membres, rig: true };
  // (l'arme : en main dans une pose de combat ; sinon portée sur lui, à sa place, sauf si on la lui a fait lâcher : arme null)
  delete options.arme;
  if (spec.armeMain && (armeReelle || spec.bouclier)) options.armeMain = spec.armeMain;
  if (armeReelle) options.arme = armeReelle;
  const t = dessinerCorpsVue(base.gene, base.tenue, base.costume, 0, spec.pose || null, v, options);
  const R = t.reperes2, t2 = rigDeformer(t, spec.rig ? spec.rig(R, FINESSE) : {});
  let bas = 0; for (let i = 0; i < t2.m.length; i++) if (t2.m[i]) bas = Math.max(bas, Math.floor(i / t2.l));
  const [hx] = t2.vers(R.cx, R.yB, 'corps');
  return { t: t2, x: hx, y: bas + 1, tete: t2.vers(R.cx, R.cy, 'tete'), cou: t2.vers(R.cx, R.yT, 'corps'), main: t.mainXY ? t2.vers(t.mainXY[0], t.mainXY[1], 'mainP') : null,
    bouclier: t.bouclierXY ? t2.vers(t.bouclierXY[0], t.bouclierXY[1], 'brasL') : null, base };
}

// La texture d'une pose (créée une fois) : sa clé ; APPUI_POSES[clé] dit où la poser
function texturePose(scene, quoi, nom, { vue = null, arme = undefined } = {}) {
  const spec = POSES_HD[nom], v = spec.vue || vue || 'troisQuarts';
  const base = specCorps(quoi, null, v, arme), armeR = arme !== undefined ? arme : base.options.arme;
  const cle = base.cle + '_pose_' + nom + (spec.armeMain || arme !== undefined ? '_' + (armeR || 'mainsNues') : '');
  if (!scene.textures.exists(cle) || !APPUI_POSES[cle]) {
    const r = dessinerPoseHD(quoi, nom, { vue: v, arme });
    if (scene.textures.exists(cle)) scene.textures.remove(cle);
    r.t.texture(scene, cle);
    APPUI_POSES[cle] = { x: r.x, y: r.y, l: r.t.l, h: r.t.h, tete: r.tete, cou: r.cou, main: r.main, bouclier: r.bouclier };
  }
  return cle;
}

// Poser une image sur la texture d'une pose (ou d'un corps debout), par son point d'appui, en tenant compte du miroir
function origineCorps(img) {
  const a = APPUI_POSES[img.texture.key];
  if (a) img.setOrigin((img.flipX ? a.l - a.x : a.x) / a.l, a.y / a.h);
  else if (PIEDS_ASSIS[img.texture.key]) img.setOrigin(0.5, (PIEDS_ASSIS[img.texture.key] + 1) / img.height);
  else img.setOrigin(0.5, 1);
  return img;
}
// Un repère d'une image de corps posée ('tete', 'main', 'bouclier'), à l'écran (null si on ne le connaît pas)
function pointCorps(img, nom) {
  const a = img && img.texture && APPUI_POSES[img.texture.key], pt = a && a[nom];
  if (!pt) return null;
  const tx = img.flipX ? a.l - pt[0] : pt[0];
  return { x: img.x + (tx - img.originX * a.l) * img.scaleX, y: img.y + (pt[1] - img.originY * a.h) * img.scaleY };
}
function teteCorps(img) { return pointCorps(img, 'tete'); }
// Le nom de la pose du rig que montre une image (null : debout, ou une pose du moteur)
function poseCorps(img) { const m = img && img.texture && /_pose_([A-Za-z]+)/.exec(img.texture.key); return m ? m[1] : null; }

// Préparer des poses en tâche de fond (une à une, entre deux images) : quand la scène en a besoin, elles sont déjà là.
// liste : [{ quoi, nom, arme, vue }]. Une pose qu'on demande avant reste dessinée sur-le-champ (texturePose).
const FILE_POSES = [];
let POSES_EN_COURS = false;
function prechargerPoses(scene, liste) {
  for (const j of liste) if (POSES_HD[j.nom]) FILE_POSES.push({ scene, ...j });
  if (!POSES_EN_COURS && FILE_POSES.length) { POSES_EN_COURS = true; setTimeout(dessinerPosesEnAttente, 20); }
}
function dessinerPosesEnAttente() {
  const j = FILE_POSES.shift();
  if (!j) { POSES_EN_COURS = false; return; }
  try { if (j.scene.sys && j.scene.textures) texturePose(j.scene, j.quoi, j.nom, { arme: j.arme, vue: j.vue }); } catch (e) { console.warn('pose en attente', e); }
  setTimeout(dessinerPosesEnAttente, 16);
}
