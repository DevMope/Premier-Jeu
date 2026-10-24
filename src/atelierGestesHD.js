// (v1.62, planche 83, validée) L'atelier : la pièce, un poste par réparateur (son meuble, ses outils) et ses gestes.
// Chaque image clé est une seule toile de 184 × 176 : le meuble peint en demi-finesse puis agrandi ×2 (comme le décor),
// le corps et les outils à la finesse des personnages. Les bras sont posés image par image (dessinerCorpsVue,
// `options.bras`). Une minuterie change d'image selon la table des durées : rien ne tourne ni ne glisse.

const RAMPE_CHAUD_ATELIER = [0x5a1a08, 0x9a2a08, 0xd84a10, 0xf88a20, 0xfcc850, 0xfff4c0];
const RAMPE_VAPEUR_ATELIER = [0x8a8a90, 0xa8a8b0, 0xc4c4cc, 0xdcdce2, 0xececf0, 0xfafafc];
const POSTE_L = 184, POSTE_H = 176, POSTE_SOL = 172;

// --- Les outils de dessin ---
function toileAtelier(l, h) { const t = new ToileHD(l, h); Object.assign(t.rampes, RAMPES_DECOR, RAMPES_OBJETS); return t; }
function collerToile(dst, src, ox = 0, oy = 0) {
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.l; x++) {
    const i = y * src.l + x; if (src.c[i] === null) continue;
    const X = x + ox, Y = y + oy; if (!dst.dans(X, Y)) continue;
    const j = Y * dst.l + X; dst.c[j] = src.c[i]; dst.m[j] = src.m[i]; dst.k[j] = src.k[i];
  }
  for (const [m, r] of Object.entries(src.rampes)) if (!dst.rampes[m]) dst.rampes[m] = r;
}
// ×2 : une toile de meubles peinte en demi-finesse, agrandie comme le décor
function agrandirAtelier(t) {
  const g = toileAtelier(t.l * 2, t.h * 2);
  for (let y = 0; y < t.h; y++) for (let x = 0; x < t.l; x++) { const i = y * t.l + x; if (t.c[i] === null) continue;
    for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const j = (y * 2 + dy) * g.l + x * 2 + dx; g.c[j] = t.c[i]; g.m[j] = t.m[i]; g.k[j] = t.k[i]; } }
  Object.assign(g.rampes, t.rampes); return g;
}
// la main qui se referme sur un manche : le poing redessiné par-dessus l'outil
function poingAtelier(t, corps, M, r = 2.2) { t.rampes.peauO = corps.rampes.peau; t.forme('peauO', ellipsoide(M[0], M[1] + 1, r * 1.05, r), { decalage: 0.3, ombre: false }); }
// les calques, du fond vers l'avant : [toile, ox, oy]
function fusionAtelier(calques) { const f = toileAtelier(POSTE_L, POSTE_H); for (const [c, ox = 0, oy = 0] of calques) collerToile(f, c, ox, oy); return f; }
function etincellesAtelier(t, x, y, n, graine, portee = 14, chute = 0) {
  t.rampes.chaud = RAMPE_CHAUD_ATELIER;
  for (let i = 0; i < n; i++) { const a = -Math.PI * (0.1 + 0.8 * hachage(i, 1, graine)), d = 4 + hachage(i, 2, graine) * portee;
    const x1 = x + Math.cos(a) * d, y1 = y + Math.sin(a) * d + chute * (d / portee) * (d / portee) * 10;
    const lg = 1 + Math.round(hachage(i, 3, graine) * 2);
    for (let j = 0; j <= lg; j++) t.poser(Math.round(x1 - Math.cos(a) * j), Math.round(y1 - Math.sin(a) * j + (chute ? -j * 0.6 : 0)), 'chaud', 5 - j); }
}
function vapeurAtelier(t, x, y, n, graine, r = 6) {
  t.rampes.vapeur = RAMPE_VAPEUR_ATELIER;
  for (let i = 0; i < n; i++) { const cx = x + (hachage(i, 1, graine) - 0.5) * r * 2.4, cy = y - i * r * 0.9 - hachage(i, 2, graine) * 3, rr = r * (0.6 + 0.5 * hachage(i, 3, graine) + i * 0.12);
    t.forme('vapeur', ellipsoide(cx, cy, rr, rr * 0.8), { decalage: 0.6 - i * 0.25, bord: false, ombre: false }); }
}

// --- Les bras de chaque geste ---
// Pour chaque bras (proche / loin) : [[u, z, y] du coude, [u, z, y] de la main]. u : en largeurs d'épaule ; z : en pixels
// de finesse ; y : un entier = k·n sous le haut du torse, sinon une fraction du torse. (Un 4e nombre : la main monte de n px.)
const BRAS_ATELIER = {
  marta: {
    lever:     { loin: [[1.1, 4, -6], [1.0, 10, -16]], pres: [[0.95, 9, 0.45], [0.25, 20, 0.86]] },
    frapper:   { loin: [[1.05, 8, 2], [0.55, 21, 5]], pres: [[0.95, 9, 0.45], [0.25, 20, 0.86]] },
    rebond:    { loin: [[1.05, 6, 0], [0.7, 15, -6]], pres: [[0.95, 9, 0.45], [0.25, 20, 0.86]] },
    retourner: { loin: [[1.05, 7, 0.2], [0.55, 17, 0.42]], pres: [[0.9, 10, 0.4], [0.25, 19, 0.7]] },
    tremper:   { loin: [[1.05, 4, 0.5], [0.85, 7, 0.95]], pres: [[0.9, 12, 0.6], [0.3, 26, 0.99]] },
  },
  tobin: {
    pousser:  { pres: [[0.9, 5, 0.5], [0.4, 15, 0]], loin: [[1.0, 8, 0.4], [0.5, 24, 0]] },
    tirer:    { pres: [[1.0, 2, 0.55], [0.6, 9, 0]], loin: [[1.0, 5, 0.45], [0.5, 17, 0]] },
    souffler: { pres: [[0.95, 3, 0.55], [0.7, 9, 0.95]], loin: [[1.0, 5, 0.5], [0.55, 18, 0.85]] },
    verifier: { pres: [[1.0, 1, 0.6], [0.9, 4, 0.99]], loin: [[1.05, 7, 0.3], [0.45, 22, -1]] },
    front:    { pres: [[1.1, 5, 0.15], [0.05, 10, -9]], loin: [[1.0, 5, 0.5], [0.55, 18, 0.85]] },
  },
  pip: {
    saisir:  { loin: [[1.0, 6, 0.4], [0.5, 22, 0.42]], pres: [[0.9, 6, 0.55], [0.3, 15, 0.42]] },
    poser:   { loin: [[1.0, 5, 0.2], [0.45, 15, 0.15]], pres: [[0.9, 6, 0.55], [0.3, 15, 0.42]] },
    sertir:  { loin: [[1.0, 5, 0.25], [0.4, 13, 0.25]], pres: [[0.9, 6, 0.55], [0.3, 15, 0.42]] },
    sertir2: { loin: [[1.0, 5, 0.25], [0.4, 13, 0.25, 2]], pres: [[0.9, 6, 0.55], [0.3, 15, 0.42]] },
    polir:   { loin: [[1.0, 6, 0.3], [0.5, 17, 0.36]], pres: [[0.9, 6, 0.55], [0.3, 15, 0.42]] },
    admirer: { loin: [[1.0, 5, 0.5], [0.6, 14, 0.62]], pres: [[1.0, 6, 0.15], [0.15, 12, -6]] },
    repos:   { loin: [[1.0, 5, 0.45], [0.5, 15, 0.5]], pres: [[0.9, 6, 0.55], [0.3, 15, 0.5]] },
  },
  brann: {
    percer: { pres: [[0.9, 8, 0.45], [0.3, 17, 2]], loin: [[1.0, 6, 0.35], [0.5, 19, 0.2]] },
    passer: { pres: [[0.9, 8, 0.45], [0.3, 15, 2]], loin: [[1.0, 7, 0.3], [0.5, 21, 1]] },
    tirer:  { pres: [[1.3, 0, 0.4], [1.25, -2, 0.3]], loin: [[1.0, 10, 0.25], [0.6, 27, 0]] },
    serrer: { pres: [[1.35, 0, 0.3], [1.45, -3, 0.12]], loin: [[1.0, 10, 0.05], [0.6, 28, -5]] },
    couper: { pres: [[0.9, 3, 0.6], [0.5, 9, 0.99]], loin: [[1.0, 7, 0.3], [0.5, 20, 0.1]] },
  },
};
// Qui est assis à son poste (Pip à son établi, Brann à califourchon sur son cheval de bourrelier)
const ASSIS_ATELIER = { pip: true, brann: true };

// Le corps d'un réparateur, dans un geste (null : au repos, les bras le long du corps), avec ses mains (t.mainsBras)
function corpsReparateur(id, geste = null) {
  const fig = FIGURANTS[id];
  const gene = { ...geneHD({ nom: fig.nom, race: fig.race, feminin: !!fig.feminin }), race: fig.race, habit: fig.habit, cheveux: fig.cheveux, barbe: fig.barbe ?? null,
    coiffure: fig.coiffure || 'court', ...(fig.peau !== undefined ? { peau: fig.peau } : {}), armure: false };
  const b = geste && BRAS_ATELIER[id][geste];
  const yPose = (a, v) => (Number.isInteger(v) ? a.yT + v * a.k : a.yT + a.P.torse * v);
  const poser = b ? (proche, a) => { const p = b[proche ? 'pres' : 'loin'];
    return [[a.ep * p[0][0], p[0][1] * a.k, yPose(a, p[0][2])], [a.ep * p[1][0], p[1][1] * a.k, yPose(a, p[1][2]) - (p[1][3] || 0)]]; } : null;
  return dessinerCorpsVue(gene, fig.niveau ?? 1, fig.costume || null, 0, null, 'troisQuarts', { fache: false, blesse: false, bras: { assis: !!ASSIS_ATELIER[id], poser } });
}
// où sont ses deux mains, dans la toile du poste
const mainsPoste = (corps, ox, oy) => {
  const m = corps.mainsBras || {}, d = (q, w) => (m[q] ? [m[q][w][0] + ox, m[q][w][1] + oy] : [ox + 26, oy + corps.h - 40]);
  return { ML: d('loin', 'M'), MP: d('pres', 'M'), CL: d('loin', 'C') };
};

// ===== MARTA : l'enclume sur sa souche, le bac de trempe, la pince et le marteau =====
function meubleMarta() {
  const t = toileAtelier(100, 88);
  t.rampes.souche = rampe(0x6a4a2a); t.rampes.eau = rampe(0x3a5a6a);
  t.forme('chene', (x, y) => (x >= 67 && x <= 86 && y >= 70 && y <= 86 ? [(x - 76) / 11, 0.1, 0.9] : null), { motif: (x) => ((x - 67) % 5 === 0 ? -0.8 : 0) });
  for (const y of [73, 83]) for (let x = 67; x <= 86; x++) t.poser(x, y, 'fer', 3);
  for (let x = 68; x <= 85; x++) { t.poser(x, 70, 'eau', 4); t.poser(x, 71, 'eau', 2); }
  t.forme('souche', (x, y) => (x >= 52 && x <= 66 && y >= 64 && y <= 86 ? [(x - 59) / 9, 0.05, 0.9] : null), { motif: (x, y) => (hachage(x, Math.floor(y / 3), 41) > 0.8 ? -0.9 : 0) });
  for (let x = 52; x <= 66; x++) t.poser(x, 64, 'souche', 4);
  t.forme('fer', (x, y) => {
    if (y >= 58 && y <= 61 && x >= 46 && x <= 69) return [0, -0.8, 0.6];                              // la table
    if (y >= 58 && y <= 60 && x > 69 && x <= 77 && y - 58 <= (77 - x) * 0.35) return [0.4, -0.6, 0.7];  // la corne
    if (y > 61 && y <= 63 && x >= 52 && x <= 64) return [0, 0.2, 0.95];                                // la taille
    if (y > 63 && y <= 65 && x >= 50 - (y - 63) && x <= 66 + (y - 63)) return [0, 0.5, 0.85];          // le pied
    return null; }, { decalage: 0.2 });
  for (let x = 46; x <= 69; x++) t.poser(x, 58, 'fer', 5);
  t.contour();
  return t;
}
function posteMarta(etape) {
  const fond = agrandirAtelier(meubleMarta());
  if (etape === 'vide') return fusionAtelier([[fond]]);
  const corps = corpsReparateur('marta', etape === 'repos' ? null : etape);
  const oxC = 6, oyC = POSTE_SOL - corps.h + 1;
  const outils = toileAtelier(POSTE_L, POSTE_H); outils.rampes.chaud = RAMPE_CHAUD_ATELIER;
  const { ML, MP, CL } = mainsPoste(corps, oxC, oyC);
  const dessus = 116;   // le dessus de l'enclume (×2)
  const chaud = { lever: 4, frapper: 5, rebond: 4, retourner: 3, tremper: 1 }[etape];
  if (etape === 'tremper') {
    // la lame plongée dans le bac : la pince descend jusqu'à l'eau
    trait(outils, 'fer', MP[0], MP[1], 150, 150, 0.9); trait(outils, 'fer', MP[0] + 2, MP[1], 152, 150, 0.8);
  } else if (etape !== 'repos') {
    const lx0 = 100, lx1 = 134, ly = dessus - 1;
    outils.forme('chaud', (x, y) => (y >= ly - (etape === 'retourner' ? 3 : 1) && y <= ly && x >= lx0 && x <= lx1 - (y < ly ? 4 : 0) ? [0, -0.5, 0.8] : null), { decalage: chaud - 3 });
    if (etape === 'retourner') for (let x = lx0; x <= lx1 - 4; x++) outils.poser(x, ly - 3, 'chaud', chaud + 1);
    // les mâchoires de la pince, du poing jusqu'au talon de la lame
    trait(outils, 'fer', MP[0], MP[1], lx0 + 2, ly - 2, 0.8); trait(outils, 'fer', MP[0] + 1, MP[1] + 2, lx0 + 2, ly, 0.8);
  }
  // le marteau : le manche suit l'avant-bras, la tête au bout (au repos : il pend au bout du bras, tête en bas)
  const dx = ML[0] - CL[0], dy = ML[1] - CL[1], n = Math.hypot(dx, dy) || 1;
  let ux = dx / n, uy = dy / n;
  if (etape === 'frapper') { ux = 0.97; uy = 0.25; }        // le manche presque à plat : la tête tombe d'aplomb sur la lame
  if (etape === 'retourner') { ux = 0.95; uy = 0.3; }        // posé sur l'enclume
  if (etape === 'repos') { ux = 0.12; uy = 0.99; }
  const tete = [ML[0] + ux * 20, ML[1] + uy * 20];
  trait(outils, 'chene', ML[0] - ux * 4, ML[1] - uy * 4, tete[0], tete[1], 1.2);
  const nx = -uy, ny = ux;
  outils.forme('fer', (x, y) => { const px = x + 0.5 - tete[0], py = y + 0.5 - tete[1]; const a = px * ux + py * uy, b = px * nx + py * ny;
    return Math.abs(a) <= 3.4 && Math.abs(b) <= 6.2 ? [b / 7, a / 5 - 0.3, 0.8] : null; }, { decalage: 0.3 });
  outils.contour();
  const avant = toileAtelier(POSTE_L, POSTE_H);
  poingAtelier(avant, corps, ML); if (etape !== 'repos') poingAtelier(avant, corps, MP, 2);
  avant.contour();
  const fx = toileAtelier(POSTE_L, POSTE_H);
  if (etape === 'frapper') { etincellesAtelier(fx, tete[0] - 1, dessus - 3, 14, 7, 22); for (let a = 0; a < 6.28; a += 0.785) for (let d = 3; d < 7; d++) fx.poser(Math.round(tete[0] - 1 + Math.cos(a) * d * 1.3), Math.round(dessus - 3 + Math.sin(a) * d * 0.6), 'chaud', 5); }
  if (etape === 'rebond') etincellesAtelier(fx, 116, dessus - 6, 9, 11, 26, 1);
  if (etape === 'tremper') vapeurAtelier(fx, 154, 132, 4, 5, 7);
  return fusionAtelier([[fond], [corps, oxC, oyC], [outils], [avant], [fx]]);
}

// ===== TOBIN : l'établi, l'étau et la lime =====
function meubleTobin() {
  const t = toileAtelier(92, 88);
  planche(t, 38, 68, 54, 4, 'chene', { graine: 351, noeuds: 1 });
  for (const x of [42, 86]) for (let y = 72; y < 87; y++) for (let k2 = 0; k2 < 3; k2++) t.poser(x + k2, y, 'cheneSombre', k2 === 0 ? 4 : k2 === 2 ? 1 : 2);
  planche(t, 42, 80, 47, 2, 'cheneSombre', { graine: 352, noeuds: 0 });
  // l'étau, vissé au bout : le corps, les deux mors, la vis et son levier en T
  t.forme('fer', (x, y) => ((x >= 43 && x <= 51 && y >= 64 && y <= 67) || ((x === 44 || x === 45 || x === 49 || x === 50) && y >= 60 && y < 64) ? [(x - 47) / 6, -0.3, 0.8] : null), { decalage: -0.4 });
  for (let x = 37; x <= 43; x++) t.poser(x, 65, 'fer', 3);
  for (let y = 62; y <= 68; y++) t.poser(37, y, 'fer', 4);
  t.rampes.pot = rampe(0x7a5a3a);
  t.forme('pot', (x, y) => (x >= 76 && x <= 82 && y >= 61 && y < 68 ? [(x - 79) / 4, 0, 0.9] : null));
  for (const [x0, y0] of [[77, 56], [79, 55], [81, 57]]) for (let y = y0; y < 61; y++) t.poser(x0, y, 'fer', 3);
  t.contour();
  return t;
}
// la tête de la hache runique, serrée dans l'étau : le fil ébréché avant la lime, net et brillant ensuite
function hacheEtau(t, etape) {
  t.rampes.acier = RAMPES.metal; t.rampes.rune = rampe(0x4a8ad8);
  const cx = 95, y0 = 106;
  const demi = y => (y < y0 + 4 ? 11 : y < y0 + 11 ? 11 - (y - y0 - 4) : 5);
  t.forme('acier', (x, y) => { const u = x + 0.5 - cx; const haut = y0 + 3 * (u / 11) ** 2; return y >= haut && y <= y0 + 17 && Math.abs(u) <= demi(y) ? [u / 13, -0.4, 0.85] : null; }, { decalage: 0.1 });
  t.forme('fer', ellipsoide(cx, y0 + 14, 2.2, 1.8), { decalage: -1.2, bord: false });
  for (const [x, y] of [[90, 109], [91, 110], [90, 111], [100, 109], [99, 110], [100, 111]]) t.poser(x, y, 'rune', 4);
  for (let x = cx - 11; x <= cx + 11; x++) { const u = x + 0.5 - cx; t.poser(x, Math.round(y0 + 3 * (u / 11) ** 2), 'acier', etape === 'verifier' ? 5 : 4); }
  if (etape === 'pousser') for (const x of [89, 98]) t.poser(x, Math.round(y0 + 3 * ((x + 0.5 - cx) / 11) ** 2), 'acier', 1);
}
function posteTobin(etape) {
  const meuble = agrandirAtelier(meubleTobin());
  const outils = toileAtelier(POSTE_L, POSTE_H);
  const posee = () => { trait(outils, 'chene', 116, 134, 124, 134, 1.4); trait(outils, 'fer', 124, 134, 146, 134, 1); };   // la lime posée sur l'établi
  if (etape === 'vide') { posee(); outils.contour(); return fusionAtelier([[meuble], [outils]]); }
  const corps = corpsReparateur('tobin', etape === 'repos' ? null : etape);
  const oxC = 10, oyC = POSTE_SOL - corps.h + 1;
  const piece = toileAtelier(POSTE_L, POSTE_H); if (etape !== 'repos') hacheEtau(piece, etape); piece.contour();
  const { ML, MP } = mainsPoste(corps, oxC, oyC);
  if (etape === 'pousser' || etape === 'tirer') {
    trait(outils, 'chene', MP[0] - 7, MP[1] + 1, MP[0] + 2, MP[1], 1.6);
    trait(outils, 'fer', MP[0] + 2, MP[1], ML[0] + 5, ML[1], 1.1);
  } else if (etape === 'verifier') {
    trait(outils, 'chene', MP[0] - 2, MP[1] - 7, MP[0], MP[1] + 1, 1.5); trait(outils, 'fer', MP[0], MP[1] + 1, MP[0] + 2, MP[1] + 18, 1);   // la lime tenue pointe en bas
  } else posee();
  outils.contour();
  const avant = toileAtelier(POSTE_L, POSTE_H);
  if (etape !== 'repos') poingAtelier(avant, corps, MP, 1.9);
  if (etape !== 'repos' && etape !== 'souffler' && etape !== 'front') poingAtelier(avant, corps, ML, 1.7);
  avant.contour();
  const fx = toileAtelier(POSTE_L, POSTE_H); fx.rampes.limaille = rampe(0xb6c0cc); fx.rampes.goutte = rampe(0x6aa8e0);
  if (etape === 'pousser') for (let i = 0; i < 8; i++) fx.poser(Math.round(100 + hachage(i, 1, 3) * 10), Math.round(104 + hachage(i, 2, 3) * 26), 'limaille', 4 + (i % 2));
  if (etape === 'tirer') for (let i = 0; i < 6; i++) fx.poser(Math.round(86 + hachage(i, 1, 4) * 10), Math.round(110 + hachage(i, 2, 4) * 22), 'limaille', 4);
  if (etape === 'souffler') vapeurAtelier(fx, 92, 96, 3, 9, 3.5);
  if (etape === 'front') fx.forme('goutte', ellipsoide(oxC + 36, oyC + corps.reperes.cy - 12, 1.6, 2.4), { decalage: 0.8, ombre: false });
  return fusionAtelier([[corps, oxC, oyC], [meuble], [piece], [outils], [avant], [fx]]);
}

// ===== PIP : l'établi de joaillier, la cheville, la loupe sur pied, la pince =====
function meublePip() {
  const t = toileAtelier(92, 88);
  t.rampes.velours = rampe(0x8a1a2a);
  planche(t, 18, 76, 16, 2, 'chene', { graine: 361, noeuds: 0 });   // le tabouret, sous Pip
  for (const x of [19, 32]) for (let y = 78; y < 87; y++) t.poser(x, y, 'cheneSombre', 2);
  planche(t, 46, 67, 46, 3, 'chene', { graine: 362, noeuds: 1 });
  for (let x = 42; x < 47; x++) for (let y = 67; y < 69; y++) t.poser(x, y, 'cheneSombre', y === 67 ? 4 : 2);   // la cheville
  for (const x of [50, 88]) for (let y = 70; y < 87; y++) for (let k2 = 0; k2 < 3; k2++) t.poser(x + k2, y, 'cheneSombre', k2 === 0 ? 4 : k2 === 2 ? 1 : 2);
  for (let x = 52; x < 88; x++) { const y = 72 + Math.round(Math.sin((x - 52) / 36 * Math.PI) * 3); t.poser(x, y, 'cuir', 3); t.poser(x, y + 1, 'cuir', 2); }   // la peau qui récupère la limaille d'or
  for (let y = 65; y < 67; y++) for (let x = 54; x < 68; x++) t.poser(x, y, 'velours', y === 65 ? 4 : 2);
  // la loupe sur pied : un pied de laiton, un bras coudé, la lentille au-dessus de la cheville
  for (let y = 52; y < 67; y++) t.poser(80, y, 'laiton', 3);
  for (let x = 52; x <= 80; x++) t.poser(x, 52, 'laiton', 4);
  for (let a = 0; a < 6.28; a += 0.1) t.poser(Math.round(47 + Math.cos(a) * 4.6), Math.round(57 + Math.sin(a) * 4.6), 'laiton', a > 3.4 && a < 5.6 ? 5 : 3);
  for (const [x, y] of [[45, 55], [46, 54], [44, 56]]) t.poser(x, y, 'verre', 5);
  t.contour();
  return t;
}
function postePip(etape) {
  const meuble = agrandirAtelier(meublePip());
  const outils = toileAtelier(POSTE_L, POSTE_H); outils.rampes.gemme = rampe(0x2a9a6a); outils.rampes.rubis = rampe(0xc0203a);
  const pierres = (sans) => { for (const [x, g] of [[112, 'rubis'], [120, 'gemme'], [128, 'rubis']]) if (!(sans && x === 120)) outils.forme(g, ellipsoide(x, 128, 1.8, 1.6), { decalage: 0.8 }); };
  if (etape === 'vide') { pierres(false); outils.contour(); return fusionAtelier([[meuble], [outils]]); }
  const corps = corpsReparateur('pip', etape);
  const oxC = 10, oyC = POSTE_SOL - (corps.piedsAssis ?? corps.h - 1) - 1;
  const { ML, MP } = mainsPoste(corps, oxC, oyC);
  pierres(etape !== 'saisir' && etape !== 'repos');
  // l'amulette : sur la cheville, puis levée à la lumière
  const anneau = etape === 'admirer' ? [MP[0] + 3, MP[1] - 3] : [90, 132];
  if (etape !== 'repos') {
    outils.forme('or', (x, y) => { const d = Math.hypot(x + 0.5 - anneau[0], (y + 0.5 - anneau[1]) * 1.2); return d >= 2.6 && d <= 4.2 ? [(x - anneau[0]) / 5, (y - anneau[1]) / 5, 0.7] : null; });
    if (etape !== 'saisir') outils.forme('gemme', ellipsoide(anneau[0], anneau[1] - 4, 2, 1.8), { decalage: 0.8 });
  }
  // la pince (brucelles) dans la main loin ; le poussoir pour sertir ; le chiffon pour polir
  const pinceVers = { saisir: [120, 127], poser: [91, 128] }[etape];
  if (pinceVers) { trait(outils, 'metal', ML[0], ML[1], pinceVers[0], pinceVers[1], 0.6); trait(outils, 'metal', ML[0] + 1, ML[1] + 1, pinceVers[0] + 1, pinceVers[1], 0.6);
    outils.forme('gemme', ellipsoide(pinceVers[0], pinceVers[1] + 1, 1.8, 1.6), { decalage: 0.8 }); }
  if (etape === 'sertir' || etape === 'sertir2') { trait(outils, 'chene', ML[0] + 3, ML[1] - 3, ML[0] - 1, ML[1] + 1, 1.3); trait(outils, 'metal', ML[0] - 1, ML[1] + 1, anneau[0] + 1, anneau[1] - 5, 0.7); }
  if (etape === 'polir') outils.forme('lin', ellipsoide(ML[0] - 1, ML[1] + 2, 4, 2.6), { decalage: 0.4 });
  outils.contour();
  const avant = toileAtelier(POSTE_L, POSTE_H);
  if (etape !== 'repos') { poingAtelier(avant, corps, ML, 1.7); poingAtelier(avant, corps, MP, 1.7); }
  avant.contour();
  const fx = toileAtelier(POSTE_L, POSTE_H); fx.rampes.eclat = rampe(0xfff0a0);
  const etoile = (x, y, r) => { for (let d = -r; d <= r; d++) { fx.poser(x + d, y, 'eclat', 5 - Math.abs(d) * 0.6); fx.poser(x, y + d, 'eclat', 5 - Math.abs(d) * 0.6); } };
  if (etape === 'sertir') etoile(anneau[0] + 3, anneau[1] - 6, 2);
  if (etape === 'polir') for (const dx of [-7, 6]) { fx.poser(ML[0] + dx, ML[1] + 2, 'eclat', 3); fx.poser(ML[0] + dx + Math.sign(dx), ML[1] + 2, 'eclat', 2); }
  if (etape === 'admirer') { etoile(anneau[0] + 1, anneau[1] - 5, 4); etoile(anneau[0] + 7, anneau[1] - 10, 2); }
  return fusionAtelier([[corps, oxC, oyC], [meuble], [outils], [avant], [fx]]);
}

// ===== BRANN : le cheval de bourrelier, l'alène, les deux aiguilles et le fil =====
function meubleBrann() {
  const t = toileAtelier(92, 88);
  planche(t, 10, 75, 70, 3, 'chene', { graine: 371, noeuds: 1 });
  for (const x of [14, 72]) for (let y = 78; y < 87; y++) for (let k2 = 0; k2 < 3; k2++) t.poser(x + k2, y, 'cheneSombre', k2 === 0 ? 4 : k2 === 2 ? 1 : 2);
  for (const x0 of [44, 48]) for (let y = 50; y < 76; y++) for (let k2 = 0; k2 < 3; k2++) t.poser(x0 + k2, y, 'cheneSombre', k2 === 0 ? 4 : k2 === 2 ? 1 : 3);
  for (let x = 43; x <= 51; x++) t.poser(x, 62, 'fer', 3);   // la bride de fer qui serre les mâchoires
  t.forme('cuir', ellipsoide(66, 71, 6, 3.6), { decalage: 0.2 });   // un rouleau de cuir
  t.rampes.pot = rampe(0x5a6a7a); t.forme('pot', (x, y) => (x >= 58 && x <= 62 && y >= 70 && y < 75 ? [(x - 60) / 3, 0, 0.9] : null));   // le pot de graisse
  t.contour();
  return t;
}
function posteBrann(etape) {
  const meuble = agrandirAtelier(meubleBrann());
  const outils = toileAtelier(POSTE_L, POSTE_H); outils.rampes.fil = rampe(0xe8dcb4); outils.rampes.peauT = rampe(0x6a3e1e);
  // la pièce de cuir serrée entre les mâchoires, et ses points déjà cousus (un de plus à chaque tour)
  const cuir = (pt) => { outils.forme('peauT', (x, y) => { const u = x + 0.5 - 95; return x >= 85 && x <= 105 && y >= 92 + Math.round(Math.abs(u) * 0.25) - 2 && y <= 110 ? [u / 12, -0.2, 0.9] : null; }, { decalage: -0.5, motif: (x, y) => (hachage(x, y, 77) > 0.85 ? -0.7 : 0) });
    for (let i = 0; i < pt; i++) outils.poser(88 + i * 3, 95, 'fil', 4); };
  if (etape === 'vide') { outils.contour(); return fusionAtelier([[meuble], [outils]]); }
  const corps = corpsReparateur('brann', etape === 'repos' ? null : etape);
  const oxC = 6, oyC = POSTE_SOL - (corps.piedsAssis ?? corps.h - 1) - 1;
  const { ML, MP } = mainsPoste(corps, oxC, oyC);
  const pt = { percer: 3, passer: 3, tirer: 4, serrer: 4, couper: 5 }[etape] ?? 0;
  if (etape !== 'repos') cuir(pt);
  const trou = [88 + pt * 3, 95];
  const fil = (a, b) => { const n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]))); for (let i = 0; i <= n; i++) outils.poser(Math.round(a[0] + (b[0] - a[0]) * i / n), Math.round(a[1] + (b[1] - a[1]) * i / n), 'fil', 4); };
  if (etape === 'percer') { trait(outils, 'chene', MP[0] - 5, MP[1], MP[0] + 2, MP[1], 1.6); trait(outils, 'metal', MP[0] + 2, MP[1], trou[0], trou[1], 0.6); }
  if (etape === 'passer') { fil(trou, ML); trait(outils, 'metal', ML[0] - 3, ML[1], ML[0] + 3, ML[1] - 1, 0.5); fil(trou, MP); trait(outils, 'metal', MP[0], MP[1], MP[0] + 5, MP[1], 0.5); }
  if (etape === 'tirer' || etape === 'serrer') { fil(trou, ML); fil(trou, MP); }
  if (etape === 'couper') { trait(outils, 'chene', ML[0] + 4, ML[1] - 4, ML[0], ML[1], 1.3); trait(outils, 'metal', ML[0], ML[1], trou[0] + 1, trou[1] + 1, 0.9); }
  outils.contour();
  const avant = toileAtelier(POSTE_L, POSTE_H);
  if (etape !== 'repos') { poingAtelier(avant, corps, ML, 2.1); poingAtelier(avant, corps, MP, 2.1); }
  avant.contour();
  return fusionAtelier([[meuble], [corps, oxC, oyC], [outils], [avant]]);
}

// --- Les gestes : les images clés, leurs durées (ms) et l'ordre où elles se suivent ---
// `boucle(tour, forme)` : la suite d'images d'un tour (`tour` compte depuis 0 ; `forme` : Tobin a fini d'apprendre).
const GESTES_ATELIER = {
  marta: { dessin: posteMarta, images: ['lever', 'frapper', 'rebond', 'retourner', 'tremper'], durees: { lever: 180, frapper: 70, rebond: 120, retourner: 300, tremper: 600 },
    boucle: tour => [...Array(3)].flatMap(() => ['lever', 'frapper', 'rebond']).concat(tour % 3 === 2 ? ['retourner', 'tremper'] : ['retourner']) },
  tobin: { dessin: posteTobin, images: ['pousser', 'tirer', 'souffler', 'verifier', 'front'], durees: { pousser: 220, tirer: 220, souffler: 400, verifier: 500, front: 600 },
    boucle: (tour, forme) => [...Array(6)].flatMap(() => ['pousser', 'tirer']).concat(['souffler', 'verifier'], !forme && tour % 4 === 3 ? ['front'] : []) },
  pip: { dessin: postePip, images: ['saisir', 'poser', 'sertir', 'sertir2', 'polir', 'admirer'], durees: { saisir: 300, poser: 300, sertir: 90, sertir2: 90, polir: 200, admirer: 700 },
    boucle: () => ['saisir', 'poser', 'sertir', 'sertir2', 'sertir', 'sertir2', 'sertir', 'sertir2', 'sertir', 'polir', 'sertir2', 'polir', 'admirer'] },
  brann: { dessin: posteBrann, images: ['percer', 'passer', 'tirer', 'serrer', 'couper'], durees: { percer: 220, passer: 220, tirer: 260, serrer: 160, couper: 500 },
    boucle: () => [...Array(3)].flatMap(() => ['percer', 'passer', 'tirer', 'serrer']).concat(['couper']) },
};
const REPARATEURS_ATELIER = ['tobin', 'marta', 'brann', 'pip'];   // l'ordre des postes, de gauche à droite

// La texture d'un poste : une image clé, 'repos' (libre) ou 'vide' (personne à ce poste). Dessinée une fois par partie.
function texturePosteAtelier(scene, id, etape) {
  const cle = `posteHD_${id}_${etape}`;
  if (!scene.textures.exists(cle)) GESTES_ATELIER[id].dessin(etape).texture(scene, cle);
  return cle;
}

// Fait travailler un réparateur à son poste : une minuterie qui passe d'une image clé à la suivante.
// Renvoie un objet { arreter() }. `forme` : pour Tobin, qui ne s'essuie plus le front une fois formé.
function animerPosteAtelier(scene, img, id, { forme = false } = {}) {
  const g = GESTES_ATELIER[id];
  for (const e of g.images) texturePosteAtelier(scene, id, e);
  let tour = 0, suite = g.boucle(0, forme), i = 0, minuterie = null, fini = false;
  const pas = () => {
    if (fini || !img.active) return;
    if (i >= suite.length) { tour++; suite = g.boucle(tour, forme); i = 0; }
    const e = suite[i++];
    img.setTexture(`posteHD_${id}_${e}`);
    minuterie = scene.time.delayedCall(g.durees[e], pas);
  };
  pas();
  return { arreter() { fini = true; if (minuterie) minuterie.remove(); } };
}

// La pièce de l'atelier : le mur, le lambris, le plancher, le râtelier (armes et armures), le panneau d'outils, la hotte du
// foyer de Marta, la peau tendue derrière Brann, la lampe de Pip, et l'étagère de velours à deux rayons (les objets qui attendent).
function creerPieceAtelierHD(scene) {
  if (scene.textures.exists('atelierPieceHD')) return;
  const L = 480, H = 90, t = toileDecor(L, H);
  t.rampes.velours = rampe(0x8a1a2a); t.rampes.brique = rampe(0x8a4a32); t.rampes.braise = RAMPE_CHAUD_ATELIER; t.rampes.peauT = rampe(0x9a6a3a);
  for (let y = 0; y < 46; y++) for (let x = 0; x < L; x++) t.poser(x, y, 'platre', 3 + Math.round((fbm(x * 0.06, y * 0.08, 301) - 0.5) * 2) - (y < 3 ? 1 : 0));
  for (let x = 0; x < L; x += 12) planche(t, x, 46, 12, 18, 'cheneSombre', { horizontale: false, graine: 310 + x, noeuds: 0 });
  for (let x = 0; x < L; x++) { t.poser(x, 46, 'chene', 4); t.poser(x, 47, 'chene', 2); }
  for (let y = 64; y < H; y += 6) planche(t, 0, y, L, 6, 'chene', { graine: 320 + y, noeuds: 2 });
  // le râtelier : deux montants, deux barres et leurs chevilles
  for (const x of [4, 64]) for (let y = 10; y < 76; y++) { t.poser(x, y, 'cheneSombre', 4); t.poser(x + 1, y, 'cheneSombre', 3); t.poser(x + 2, y, 'cheneSombre', 1); }
  for (const y of [17, 40]) { planche(t, 2, y, 66, 3, 'cheneSombre', { graine: 330 + y, noeuds: 0 }); for (let x = 14; x < 64; x += 22) { t.poser(x, y + 3, 'chene', 4); t.poser(x, y + 4, 'chene', 2); } }
  // le panneau d'outils, au-dessus de l'établi de Tobin
  planche(t, 84, 8, 70, 24, 'chene', { graine: 340, noeuds: 1 }); for (const [x, y] of [[86, 10], [150, 10], [86, 28], [150, 28]]) clou(t, x, y);
  trait(t, 'fer', 92, 13, 112, 19, 2); trait(t, 'cheneSombre', 110, 19, 116, 22, 1.6); trait(t, 'cheneSombre', 124, 12, 124, 28, 1); trait(t, 'fer', 120, 13, 128, 13, 1.6);
  for (const x of [136, 142, 148]) trait(t, 'fer', x, 12, x, 28, 0.7);
  // la hotte de briques du foyer de Marta, et ses braises, au mur derrière l'enclume
  for (let y = 4; y < 62; y++) for (let x = 214; x < 240; x++) { const rang = Math.floor(y / 4), joint = y % 4 === 0 || (x + (rang % 2) * 3) % 6 === 0; if (y < 34 && x > 236) continue; t.poser(x, y, 'brique', joint ? 1 : 3 + (hachage(Math.floor(x / 6), rang, 9) > 0.7 ? 1 : 0)); }
  for (let y = 46; y < 56; y++) for (let x = 219; x < 235; x++) t.poser(x, y, 'braise', y < 49 ? 1 : 2 + Math.round(hachage(x, y, 12) * 3));
  // la peau tendue sur son cadre, derrière Brann
  for (let y = 8; y < 40; y++) for (let x = 262; x < 296; x++) { const b = x === 262 || x === 295 || y === 8 || y === 39; if (b) t.poser(x, y, 'cheneSombre', 3); else if (Math.abs(x - 279) < 14 - Math.abs(y - 24) * 0.25) t.poser(x, y, 'peauT', 3 + Math.round((fbm(x * 0.2, y * 0.2, 5) - 0.5) * 2)); }
  // la lampe de Pip, pendue au plafond
  for (let y = 0; y < 14; y++) t.poser(392, y, 'fer', 2);
  t.forme('laiton', (x, y) => (y >= 14 && y <= 19 && Math.abs(x + 0.5 - 392.5) <= 6 - (y - 14) * 0.2 ? [(x - 392) / 7, -0.4, 0.8] : null));
  // l'étagère de velours à deux rayons, et ses deux consoles
  for (const y of [30, 52]) { planche(t, 436, y, 42, 3, 'cheneSombre', { graine: 980 + y, noeuds: 0 }); for (let x = 437; x < 477; x++) t.poser(x, y - 1, 'velours', 3); for (const x of [440, 472]) for (let d = 3; d < 7; d++) t.poser(x, y + d, 'cheneSombre', 2); }
  t.contour();
  t.texture(scene, 'atelierPieceHD');
}
