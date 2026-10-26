// (planche 85 v2, validée) Le dessin des pyjamas, par le moteur des corps en volume (dessinerCorpsVue, corpsVueHD.js) :
// options.pyjama = DESSIN_PYJAMAS[id]. Le haut et le bas (ou une chemise longue), le motif qui suit le tissu (des raies
// le long des membres, des carreaux, des étoiles), le col, les poignets, l'ourlet, les pieds (nus, chaussons, pantoufles,
// chaussettes de laine) et le bonnet de nuit. Le moteur appelle pyjamaRampes, pyjamaPied, pyjamaJupeAuxJambes et pyjamaApres.
//   haut, bas : les couleurs ; raie : le motif ; lisere : le col, les poignets, les boutons ; robe : la longueur d'une
//   chemise ou d'une robe (0 la taille, 1 le sol) ; mollet : où finit le bas sous la robe ; terne : une étoffe moins vive.

const DESSIN_PYJAMAS = {
  lin: { haut: 0xd8ccae, bas: 0xc8bc9c, terne: true, robe: 0.42, col: 'lacet', pieds: 'nus' },
  raye: { haut: 0x34548e, raie: 0xeae6dc, lisere: 0xeae6dc, motif: 'raies', col: 'rabattu', pieds: 'chaussons', chausson: 0x6a3a2a },
  nuit: { haut: 0xf0ece2, terne: true, robe: 0.8, mollet: 0.62, col: 'volant', ourlet: 'volant', pieds: 'nus',
    bonnet: { couleur: 0xf0ece2, pompon: 0xc83a3a, revers: 0xe4dccc } },
  laine: { haut: 0x7a2432, bas: 0x3a4466, lisere: 0xd8b060, dessous: 0x3a4466, robe: 0.6, col: 'chale', ceinture: true, pieds: 'pantoufles', chausson: 0x7a2432 },
  flanelle: { haut: 0xa8362e, raie: 0x24402e, lisere: 0xe8d8b0, motif: 'carreaux', col: 'rond', pieds: 'laine', chausson: 0xe0d4b8 },
  etoile: { haut: 0x1e2a5e, raie: 0xf0c840, lisere: 0xf0c840, motif: 'etoiles', col: 'rabattu', pieds: 'chaussons', chausson: 0x1e2a5e,
    bonnet: { couleur: 0x1e2a5e, pompon: 0xf0c840, revers: 0xf0c840, etoiles: true } },
};
// Les couleurs principales d'un pyjama (le tourbillon, la pile pliée sur l'étagère, le vêtement jeté)
function couleursPyjama(id) { const d = DESSIN_PYJAMAS[id] || DESSIN_PYJAMAS.raye; return { fond: d.haut, motif: d.raie ?? d.lisere ?? d.haut, bas: d.bas ?? d.haut, motifNom: d.motif || null }; }

// --- Les crochets du moteur ---
function pyjamaRampes(t, pyj) {
  t.rampes.habit = (pyj.terne ? rampe : rampeVive)(pyj.haut);
  t.rampes.bas = (pyj.terne ? rampe : rampeVive)(pyj.bas ?? pyj.haut);
  t.rampes.pyjB = rampeVive(pyj.raie ?? 0xf0ece0);
  t.rampes.pyjC = rampeVive(pyj.lisere ?? pyj.raie ?? 0xf0ece0);
  t.rampes.pyjD = rampeVive(pyj.dessous ?? 0xe8e0d0);
  t.rampes.chausson = rampeVive(pyj.chausson ?? 0x6a4a3a);
  t.rampes.bonnetN = (pyj.terne ? rampe : rampeVive)((pyj.bonnet && pyj.bonnet.couleur) ?? pyj.haut);
  t.rampes.pompon = rampeVive((pyj.bonnet && pyj.bonnet.pompon) ?? 0xf0ece0);
  t.rampes.reversB = rampeVive((pyj.bonnet && pyj.bonnet.revers) ?? 0xf0ece0);
  t.rampes.dentelle = rampe(0xfaf8f2);
  t.rampes.lacet = rampeVive(0x7a5232);
}

// Le bas d'une chemise longue appartient aux cuisses : assis dans son lit, il les suit (au lieu de pendre dans le matelas)
function pyjamaJupeAuxJambes(t, y0) {
  if (!t.rig) return;
  const id = t.rig.formes;
  for (let y = Math.ceil(y0); y < t.h; y++) for (let x = 0; x < t.l; x++) {
    const pile = t.rig.px[y * t.l + x]; if (!pile) continue;
    for (const r of pile) if (r.id === id) r.part = 'jambeP';
  }
}

// Le bas de la jambe et le pied
function pyjamaPied({ t, k, G, Pd, r, dec, pied, solPied, s, X, race, boutJ, pyj }) {
  const lerp = (A, B, u) => [A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u];
  // le mollet : le bas du pyjama jusqu'à la cheville (ou la jambe nue sous une chemise courte)
  if (pyj.mollet) { cylindre(t, 'bas', G, lerp(G, Pd, pyj.mollet), r - 0.4 * k, { decalage: dec + 0.2 }); cylindre(t, 'peau', lerp(G, Pd, pyj.mollet - 0.05), Pd, r - 0.9 * k, { decalage: dec + 0.2 }); }
  else if (pyj.robe && pyj.robe < 0.5) cylindre(t, 'peau', G, Pd, r - 0.8 * k, { decalage: dec + 0.2 });
  else cylindre(t, 'bas', G, Pd, r - 0.4 * k, { decalage: dec + 0.2 });
  const hobbit = race === 'hobbit', nus = pyj.pieds === 'nus' || hobbit;
  const px = X(pied[0], pied[1] + 2 * k * boutJ), rl = (hobbit ? 3.6 : 3.1) + Math.abs(s) * 1.2;
  if (nus) {
    t.forme('peau', ellipsoide(px, solPied - 1.5 * k, rl * k, (hobbit ? 2 : 1.7) * k), { decalage: dec });
    if (hobbit) for (let j = 0; j < 4; j++) t.poser(Math.round(X(pied[0], pied[1] + (1 + j * 0.7) * k)), Math.round(solPied - 3 * k - (j % 2)), 'cheveux', 2);
    // les orteils : deux petites ombres au bout du pied
    const bout = X(pied[0], pied[1] + (2 + rl * 0.8) * k * boutJ);
    if (Math.abs(s) > 0.3) for (let j = 0; j < 2; j++) t.poser(Math.round(bout - j * k), Math.round(solPied - 1 * k), 'peau', 1);
    return;
  }
  // chaussons de feutre, pantoufles (un revers de laine), chaussettes de laine côtelées
  const haut = pyj.pieds === 'laine' ? 3.4 : 2.3;
  t.forme('chausson', ellipsoide(px, solPied - 1.7 * k, (rl + 0.5) * k, haut * k), { decalage: dec + 0.1, motif: pyj.pieds === 'laine' ? (x, y) => (Math.floor(y / k) % 2 ? 0.4 : -0.2) : null });
  if (pyj.pieds === 'pantoufles') t.forme('pyjC', (x, y) => { const n = ellipsoide(px, solPied - 1.7 * k, (rl + 0.7) * k, haut * k + 0.6)(x, y); return n && y <= solPied - 2.6 * k ? n : null; }, { decalage: dec + 0.3, ombre: false });
  if (pyj.pieds === 'chaussons') t.forme('pompon', ellipsoide(X(pied[0], pied[1] + (2 + rl * 0.6) * k * boutJ), solPied - 3.3 * k, 1.1 * k, 1 * k), { decalage: dec + 0.4, ombre: false });
}

// Après le corps : le motif du tissu, le col, l'ourlet, les poignets, le bonnet de nuit
function hachePyj(a, b, g) { let h = (a * 374761393 + b * 668265263 + g * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function pyjamaApres(C) {
  const { t, k, cx, cy, yT, yB, sol, X, c, dos, segBras, segJambes, L, pyj, f, P, prof } = C;
  const ox = X(0, prof);
  // où l'on est sur le tissu : en travers et le long du membre (pour les bras et les jambes), ou du torse
  const segments = liste => liste.flatMap(S => [[S[0], S[1], 0], [S[1], S[2], Math.hypot(S[1][0] - S[0][0], S[1][1] - S[0][1])]]);
  const SB = segments(segBras), SJ = segments(segJambes);
  const surSeg = (x, y, segs) => {
    let best = null, bd = 1e9;
    for (const [A, B, debut] of segs) {
      const dx = B[0] - A[0], dy = B[1] - A[1], l2 = dx * dx + dy * dy || 1, u = Math.max(0, Math.min(1, ((x - A[0]) * dx + (y - A[1]) * dy) / l2));
      const ex = x - A[0] - u * dx, ey = y - A[1] - u * dy, d = ex * ex + ey * ey;
      if (d < bd) { bd = d; const l = Math.sqrt(l2); best = [((x - A[0]) * dy - (y - A[1]) * dx) / l, u * l + debut]; }
    }
    return best;
  };
  const groupe = (part, y) => (part && (part.startsWith('bras') || part.startsWith('main') || part.startsWith('avant')) ? 1 : part && part.startsWith('jambe') && y > yB + 2 * k && !pyj.robe ? 2 : 0);
  const coord = (x, y, g) => (g === 1 ? surSeg(x + 0.5, y + 0.5, SB) : g === 2 ? surSeg(x + 0.5, y + 0.5, SJ) : null) || [x + 0.5 - ox, y - yT];
  const motif = (u, v) => {
    if (pyj.motif === 'raies') return ((Math.floor((u + 40) / (1.5 * k)) % 3) + 3) % 3 === 0 ? 'pyjB' : null;
    if (pyj.motif === 'carreaux') {
      const a = ((Math.floor((u + 40) / (2.5 * k)) % 3) + 3) % 3 === 0, b = ((Math.floor((v + 40) / (2.5 * k)) % 3) + 3) % 3 === 0;
      if (a && b) return 'pyjB';
      if (a || b) return ((Math.floor(u) + Math.floor(v)) % 2) ? 'pyjB' : null;
      if (((Math.floor((u + 40) / k) % 7) + 7) % 7 === 3 || ((Math.floor((v + 40) / k) % 7) + 7) % 7 === 3) return 'pyjC';
    }
    return null;
  };
  const R = t.rig ? t.rig.px : null;
  if (pyj.motif === 'raies' || pyj.motif === 'carreaux') for (let y = 0; y < t.h; y++) for (let x = 0; x < L; x++) {
    const i = y * L + x, m = t.m[i], pile = R && R[i];
    let concerne = m === 'habit' || m === 'bas';
    if (!concerne && pile) for (const r of pile) if (r.mat === 'habit' || r.mat === 'bas') { concerne = true; break; }
    if (!concerne) continue;
    const memo = [null, null, null], co = g => memo[g] || (memo[g] = coord(x, y, g));
    if (pile) for (const r of pile) { if (r.mat !== 'habit' && r.mat !== 'bas') continue; const [u, v] = co(groupe(r.part, y)); const nm = motif(u, v); if (nm) r.mat = nm; }
    if (m === 'habit' || m === 'bas') { const top = pile && pile[pile.length - 1]; const [u, v] = co(groupe(top ? top.part : 'corps', y)); const nm = motif(u, v); if (nm) { t.m[i] = nm; t.c[i] = t.rampes[nm][t.k[i]]; } }
  }
  // les étoiles brodées : semées sur une grille, des grandes et des petites
  if (pyj.motif === 'etoiles') for (let y = 0; y < t.h; y++) for (let x = 0; x < L; x++) {
    const cu = Math.floor(x / (5 * k)), cv = Math.floor(y / (5 * k)); if (hachePyj(cu, cv, 11) > 0.6) continue;
    const sx = Math.floor((cu + 0.25 + hachePyj(cu, cv, 3) * 0.5) * 5 * k), sy = Math.floor((cv + 0.25 + hachePyj(cu, cv, 4) * 0.5) * 5 * k);
    if (x !== sx || y !== sy) continue;
    const ok = (a, b) => ['habit', 'bas'].includes(t.mat(a, b));
    if (!ok(sx, sy)) continue;
    const grande = hachePyj(cu, cv, 5) < 0.3;
    for (const [dx, dy, i] of grande ? [[0, 0, 5], [1, 0, 5], [0, 1, 5], [1, 1, 5], [-1, 0, 3], [2, 0, 3], [0, -1, 3], [1, -1, 3], [0, 2, 3], [1, 2, 3]] : [[0, 0, 5], [1, 0, 4], [-1, 0, 2], [0, 1, 4], [0, -1, 2]])
      if (ok(sx + dx, sy + dy)) t.poser(sx + dx, sy + dy, 'pyjB', i);
  }
  const surTissu = (x, y) => { const m = t.mat(x, y); return m === 'habit' || m === 'pyjB' || m === 'pyjC'; };
  const devant = (x, y) => { if (!R) return true; const p = R[y * L + x]; return !p || !p.length || p[p.length - 1].part === 'corps'; };
  const peindre = (x, y, mat, i) => { x = Math.round(x); y = Math.round(y); if (t.mat(x, y) && devant(x, y)) t.poser(x, y, mat, i); };
  const lc = Math.max(0.45, Math.abs(c));
  if (!dos) {
    if (pyj.col === 'rabattu') {
      // deux pointes de col liserées, le V de la poitrine ; trois boutons, une poche
      for (const d of [-1, 1]) for (let j = 0; j <= 4 * k; j++) for (let e = 0; e <= (4 * k - j) * 0.55; e++) peindre(ox + d * (1.2 * k + e) * lc, yT + j, 'pyjC', j === 0 || e > (4 * k - j) * 0.55 - 1 ? 2 : 4);
      for (let j = 0; j < 3 * k; j++) for (let e = -0.6 * k; e <= 0.6 * k; e++) if (Math.abs(e) <= (3 * k - j) * 0.3) peindre(ox + e * lc, yT + j, 'peau', 3);
      for (let b = 0; b < 3; b++) { const by = yT + 6 * k + b * 4 * k; if (by > yB - 1 * k) break; peindre(ox + 0.6 * k, by, 'pyjC', 5); peindre(ox + 0.6 * k + 1, by, 'pyjC', 4); peindre(ox + 0.6 * k, by + 1, 'pyjC', 2); peindre(ox + 0.6 * k + 1, by + 1, 'pyjC', 2); }
      for (let y = yB - 1 * k; y <= yB; y++) for (let x = 0; x < L; x++) if ((t.mat(x, y) === 'habit' || t.mat(x, y) === 'pyjB') && devant(x, y)) t.poser(x, y, t.mat(x, y), Math.max(0, t.teinte(x, y) - 1));   // (la taille, froncée)
      const pxk = X(-4 * k, prof);
      for (let y = yT + 5 * k; y < yT + 8.5 * k; y++) for (let x = Math.round(pxk - 1.8 * k * lc); x <= pxk + 1.8 * k * lc; x++) if (y === Math.round(yT + 5 * k) || Math.abs(x - pxk) > 1.8 * k * lc - 1) peindre(x, y, 'pyjC', 3);
    } else if (pyj.col === 'rond') {
      for (let x = 0; x < L; x++) for (let y = yT; y < yT + 4 * k; y++) { const d = (x + 0.5 - ox) / (4 * k * lc), lim = yT + (1 - d * d) * 2.6 * k; if (Math.abs(d) < 1 && y >= lim && y < lim + 1.2 * k && surTissu(x, y)) peindre(x, y, 'pyjC', y < lim + 0.6 * k ? 4 : 2); }
      for (let b = 0; b < 2; b++) peindre(ox, yT + 4.5 * k + b * 3 * k, 'pyjC', 5);
    } else if (pyj.col === 'volant') {
      // un col rond à volant de dentelle, une petite rangée de boutons de nacre
      for (let x = 0; x < L; x++) for (let y = yT - 1 * k; y < yT + 5 * k; y++) {
        const d = (x + 0.5 - ox) / (5 * k * lc), lim = yT + (1 - d * d) * 3 * k, fes = Math.sin((x - ox) / (1.1 * k)) * 0.6 * k;
        if (Math.abs(d) < 1 && y >= lim - 0.5 * k && y < lim + 1.6 * k + fes && t.mat(x, y)) peindre(x, y, 'dentelle', y > lim + 1 * k + fes ? 2 : (Math.floor(x / k) % 2 ? 5 : 4));
      }
      for (let b = 0; b < 3; b++) peindre(ox, yT + 5 * k + b * 2.6 * k, 'dentelle', 5);
      if (f) for (let x = 0; x < L; x++) { const y = Math.round(yT + 9 * k); if (surTissu(x, y) && devant(x, y)) t.poser(x, y, 'reversB', 3); }   // (un ruban sous la poitrine)
    } else if (pyj.col === 'lacet') {
      // l'encolure en V, la peau dedans, le lacet croisé
      const vh = 7 * k;
      for (let y = yT; y < yT + vh; y++) { const demi = (1 - (y - yT) / vh) * 2.4 * k * lc; for (let x = Math.round(ox - demi); x <= ox + demi; x++) peindre(x, y, 'peau', x < ox ? 2 : 3); }
      for (let j = 0; j < 3; j++) { const y = yT + 1.5 * k + j * 1.8 * k, demi = (1 - (y - yT) / vh) * 2.4 * k * lc; for (let e = -demi; e <= demi; e++) peindre(ox + e, y + e * 0.5 * (j % 2 ? 1 : -1), 'lacet', 2); }
      for (let y = yT; y < yT + vh; y++) { const demi = (1 - (y - yT) / vh) * 2.4 * k * lc; peindre(ox - demi - 1, y, 'habit', 1); }
    } else if (pyj.col === 'chale') {
      // le col châle : deux revers qui croisent jusqu'à la ceinture, le pyjama dessous dans le V ; la cordelière nouée
      const croise = yB - 2 * k;
      for (let y = yT; y < croise; y++) {
        const u = (y - yT) / (croise - yT), demi = (1 - u) * 3.4 * k * lc + 0.4 * k;
        for (let x = Math.round(ox - demi); x <= ox + demi; x++) peindre(x, y, 'pyjD', 2 + (x > ox ? 1 : 0));
        for (const d of [-1, 1]) for (let e = 0; e < 1.6 * k; e++) peindre(ox + d * (demi + e), y, 'pyjC', e < 0.6 * k ? 4 : 3);
      }
      for (let x = 0; x < L; x++) for (let y = yB - 1.5 * k; y <= yB - 0.5 * k; y++) if (surTissu(x, y) && devant(x, y)) t.poser(x, y, 'pyjC', y < yB - 1 * k ? 4 : 2);
      const nx = X(-2.5 * k, prof);
      t.forme('pyjC', ellipsoide(nx, yB - 1 * k, 1.3 * k, 1.1 * k), { decalage: 0.4, ombre: false });
      for (const [d, l] of [[-0.6, 7], [0.8, 9]]) { for (let j = 0; j < l * k; j++) peindre(nx + d * k + j * 0.05 * d, yB + j, 'pyjC', 3); t.forme('pyjC', ellipsoide(nx + d * k + l * k * 0.05 * d, yB + l * k + 0.6 * k, 0.9 * k, 1.3 * k), { decalage: 0.2, ombre: false }); }
    }
  }
  // l'ourlet de la chemise de nuit : un volant de dentelle festonné ; la robe de chambre : un liseré
  if (pyj.robe) {
    const bas = yB + Math.round((sol - yB) * pyj.robe);
    const jupe = i => !R || !R[i] || !R[i].length || ['corps', 'jambeP'].includes(R[i][R[i].length - 1].part);
    for (let x = 0; x < L; x++) for (let y = bas - 3 * k; y <= bas + 1; y++) {
      if (!surTissu(x, y)) continue; const i = y * L + x; if (!jupe(i)) continue;
      if (pyj.ourlet === 'volant') { const fes = (1 - Math.abs(Math.sin((x + 0.5) / (1.3 * k)))) * 1 * k; if (y > bas - 2.2 * k) t.poser(x, y, 'dentelle', y > bas - fes ? 2 : (x % 3 ? 4 : 5)); }
      else if (pyj.col === 'chale' && y > bas - 1.2 * k) t.poser(x, y, 'pyjC', 3);
    }
    if (pyj.ourlet === 'volant') for (let x = 0; x < L; x++) for (let y = bas - 1 * k; y <= bas + 1; y++) { const i = y * L + x; if (t.m[i] === 'dentelle' && (1 - Math.abs(Math.sin((x + 0.5) / (1.3 * k)))) * 1.2 * k > bas + 1 - y) { t.c[i] = null; t.m[i] = null; if (R) R[i] = []; } }
  }
  // les poignets : un liseré (ou un volant de dentelle pour la chemise de nuit)
  for (const S of segBras) {
    const [, C0, M0, r] = S, px = C0[0] + (M0[0] - C0[0]) * 0.78, py = C0[1] + (M0[1] - C0[1]) * 0.78;
    for (let y = Math.round(py - r - 1); y <= py + r + 1; y++) for (let x = Math.round(px - r - 1); x <= px + r + 1; x++) {
      const dx = M0[0] - C0[0], dy = M0[1] - C0[1], l = Math.hypot(dx, dy) || 1, u = ((x + 0.5 - px) * dx + (y + 0.5 - py) * dy) / l;
      if (Math.abs(u) < 0.6 * k && ['habit', 'pyjB', 'pyjC'].includes(t.mat(x, y))) t.poser(x, y, pyj.col === 'volant' ? 'dentelle' : 'pyjC', 3);
    }
  }
  // le bonnet de nuit : la calotte, le revers, la longue pointe molle qui retombe derrière, le pompon
  if (pyj.bonnet) {
    const avant = t.partie; t.partie = 'tete';
    const dir = dos ? 1 : (X(0, -1 * k) < cx - 0.1 ? -1 : 1);   // (la pointe tombe derrière la tête)
    const bord = Math.round(cy - P.ry * 0.5);
    t.forme('bonnetN', (x, y) => { const n = ellipsoide(cx + dir * 0.3 * k, cy - 0.3 * k, P.rx + 0.9 * k, P.ry + 1.2 * k)(x, y); return n && y <= bord ? n : null; }, { decalage: 0.1 });
    const x0 = cx + dir * 1.5 * k, y0 = cy - P.ry - 0.2 * k;
    const point = u => [x0 + dir * Math.sin(u * Math.PI * 0.5) * (P.rx + 2.5 * k), y0 - Math.sin(Math.min(1, u * 1.6) * Math.PI) * 2.4 * k + Math.max(0, u - 0.4) ** 1.6 * (P.ry * 2.3)];
    for (let j = 0; j <= 30; j++) { const u = j / 30, [px, py] = point(u); t.forme('bonnetN', ellipsoide(px, py, (3.3 - 2.3 * u) * k, (3.3 - 2.3 * u) * k), { decalage: 0.05 - u * 0.6, ombre: false }); }
    t.forme('reversB', (x, y) => { const n = ellipsoide(cx + dir * 0.3 * k, cy - 0.3 * k, P.rx + 1.5 * k, P.ry + 1.8 * k)(x, y); return n && y >= bord - 2 * k && y <= bord + 0.4 * k ? [n[0], -0.1, n[2]] : null; }, { decalage: 0.2, motif: (x) => (Math.floor(x / k) % 2 ? 0.3 : -0.2) });
    const [qx, qy] = point(1);
    t.forme('pompon', ellipsoide(qx, qy + 1.2 * k, 2.1 * k, 2 * k), { decalage: 0.35, motif: (x, y) => ((Math.floor(x / k) + Math.floor(y / k)) % 2 ? 0.35 : -0.15) });
    if (pyj.bonnet.etoiles) for (const u of [0.35, 0.62]) { const [px, py] = point(u); peindre(px, py, 'pompon', 5); peindre(px + 1, py, 'pompon', 4); peindre(px, py + 1, 'pompon', 4); }
    t.partie = avant;
  }
}

// --- Le joueur en pyjama ---
// La signature de son corps (son apparence, sa barbe) : on le redessine quand elle change
function signatureCorpsJoueur(G) { return Object.values(G.joueur.apparence || {}).join('.') + '|' + (typeof signaturePilosite === 'function' ? signaturePilosite(G) : '') + '|' + stadeJoueur(G) + (G.joueur.feminin ? 'f' : 'g'); }
// Les options du moteur pour ce pyjama (le bonnet a besoin d'un peu de place au-dessus de la tête)
function optionsPyjama(id, plus = {}) {
  const d = DESSIN_PYJAMAS[id] || DESSIN_PYJAMAS.raye;
  return { pyjama: d, ...plus, margeHaut: Math.max(plus.margeHaut || 0, d.bonnet ? 9 : 0) };
}
// Un dessin du joueur en pyjama (id) ou dans ses habits du jour (id null), dans une pose du moteur
function dessinerJoueurNuit(G, id, { vue = 'troisQuarts', pas = 0, pose = null, options = {} } = {}) {
  const opts = id ? optionsPyjama(id, options) : options;
  return avecOptionsCorps(opts, () => dessinerJoueurHD(apparenceDuJour(G), stadeJoueur(G), G.joueur.feminin, pas, id ? [] : (G.tenue || []), vue, pose));
}
// La texture du joueur en pyjama, debout (de trois-quarts, ou sous une autre vue), avec ses images de marche : `_pas1`,
// `_pas2` tout de suite, et les huit images du vrai pas (`_m0` à `_m7`) dessinées en tâche de fond
function textureJoueurPyjama(scene, G, id, vue = 'troisQuarts') {
  const sig = id + '|' + signatureCorpsJoueur(G), cle = `joueurPyj_${id}_${stadeJoueur(G)}_${vue}`;
  if (!scene.textures.exists(cle) || scene.textures.get(cle).tenue !== sig) {
    for (const [pas, k] of [[0, cle], [-1, cle + '_pas1'], [1, cle + '_pas2']]) {
      if (scene.textures.exists(k)) scene.textures.remove(k);
      dessinerJoueurNuit(G, id, { vue, pas }).texture(scene, k);
    }
    scene.textures.get(cle).tenue = sig;
  }
  if (typeof FILE_MARCHE_JOUEUR !== 'undefined' && typeof optsMarche === 'function' && !marcheJoueurPrete(scene, cle) && !FILE_MARCHE_JOUEUR.some(j => j.cle === cle && j.tenue === sig)) {
    const textures = scene.textures;
    for (let i = 0; i < MARCHE_HD.images; i++) FILE_MARCHE_JOUEUR.push({ cle, tenue: sig, i, dessin: () => {
      if (!textures.exists(cle) || textures.get(cle).tenue !== sig) return;
      const t = dessinerJoueurNuit(G, id, { vue, options: optsMarche(i / MARCHE_HD.images, vue) });
      t.texture(scene, cle + '_m' + i);
      textures.get(cle + '_m' + i).tenue = sig;
    } });
    if (!MARCHE_JOUEUR_EN_COURS) { MARCHE_JOUEUR_EN_COURS = true; setTimeout(dessinerMarcheJoueur, 30); }
  }
  return cle;
}
