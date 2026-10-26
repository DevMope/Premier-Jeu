// (planche 91, validée) Les deux grandes figures du val d'Ardévanne, et les apprentis du seigneur :
//  - Dame Ardéline, la Dame aux Lanternes : la robe lie-de-vin, le manteau de feuilles d'automne cousues comme des
//    écailles, le diadème de feuilles d'or à la goutte d'ambre, des feuilles d'or dans ses cheveux roux ; son bâton de
//    bois pâle se termine en crosse, et une lanterne-feuille y pend (costume « dameLanternes ») ;
//  - le seigneur Évrandel, maître des Terrasses : la robe couleur de mousse brodée de cuivre, le manteau roux bordé d'une
//    tresse de racines, une couronne de racines tressées où poussent trois feuilles rouges, la serpette à la ceinture, une
//    canne de racine vivante qui bourgeonne (costume « maitreTerrasses ») ;
//  - Ruvel et Vélanne, ses apprentis jardiniers, qui viennent acheter ses outils au comptoir.
// Les corps passent par dessinerCorpsVue (corpsVueHD.js), les bustes par dessinerBusteHD (portraitsHD.js) : ces deux
// moteurs appellent les fonctions d'ici (rampesCostumeElfe, batonCostumeElfe, detailsCostumeElfe, detailsBusteElfe).
const COSTUMES_ELFES = ['dameLanternes', 'maitreTerrasses'];

Object.assign(FIGURANTS, {
  ardeline: { race: 'elfe', feminin: true, nom: 'Dame Ardéline', costume: 'dameLanternes', habit: 0x7a1e26, cape: 0xa8481c, cheveux: 0x9a3a1c, coiffure: 'long', peau: 0, niveau: 2, bouche: 1, buste: true, atours: { metal: 'or', coiffe: 'feuilles' } },
  evrandel: { race: 'elfe', nom: 'Le seigneur Évrandel', costume: 'maitreTerrasses', habit: 0x4a5a2c, cape: 0x6e3418, cheveux: 0xd6d2c8, coiffure: 'long', peau: 1, niveau: 2, bouche: 0, buste: true },
  // ses deux apprentis, qui viennent au comptoir à sa place : le tablier de cuir des jardiniers, les manches retroussées
  ruvel: { race: 'elfe', nom: 'Ruvel', costume: 'forgeron', habit: 0x5a6a2e, cheveux: 0xa8401c, coiffure: 'court', peau: 0, niveau: 0, bouche: 3, buste: true },
  velanne: { race: 'elfe', feminin: true, nom: 'Vélanne', costume: 'forgeron', habit: 0x7a4a22, cheveux: 0x3a2418, coiffure: 'queue', peau: 2, niveau: 0, bouche: 1, buste: true },
});

function rampesCostumeElfe(t, costume, g) {
  if (!COSTUMES_ELFES.includes(costume)) return;
  t.rampes.feuilleR = rampeVive(0xc23c1a); t.rampes.feuilleO = rampeVive(0xd8761e); t.rampes.feuilleJ = rampeVive(0xd8a42a);
  t.rampes.lanterneF = [0x7a3a08, 0xb06010, 0xe0901c, 0xf8b838, 0xffd870, 0xfff4c0];
  t.rampes.racineS = rampeVive(0x5e3e24); t.rampes.cuivre = rampeVive(0xb8662e); t.rampes.mousseS = rampeVive(0x4e7a30);
  t.rampes.cape = rampeVive(g.cape || 0x6e3418);
  if (costume === 'dameLanternes') { t.rampes.habit = rampe(0x6a1622); t.rampes.cristal = rampeVive(0xe8901c); t.rampes.batonS = rampeVive(0xcab48e); t.rampes.lin = rampeVive(0xe8c070); }
  else { t.rampes.batonS = rampeVive(0x6a4628); t.rampes.lin = rampeVive(0xc8b890); }
}

// des feuilles cousues en écailles, sur les pixels d'une matière (le manteau) : rangées décalées, chaque feuille son ton
function manteauDeFeuilles(t, mat, k, g = 3, mats = ['feuilleR', 'feuilleO', 'feuilleJ', 'feuilleO', 'feuilleR']) {
  const w = 2 * k + 2, h = 3 * k;
  for (let y = 0; y < t.h; y++) for (let x = 0; x < t.l; x++) {
    if (t.mat(x, y) !== mat) continue;
    // la feuille la plus haute qui couvre ce pixel : chacune est un ovale pointu vers le bas, décalé d'un rang à l'autre
    const r0 = Math.floor(y / h); let vu = null;
    for (let r = r0 - 1; r <= r0 && !vu; r++) { const dec = (r % 2) * (w / 2) + hachage(r, 2, g) * 2; const col0 = Math.floor((x - dec) / w);
      for (let col = col0; col <= col0 + 1; col++) { const xc = col * w + dec + w / 2 + (hachage(col, r, g + 4) - 0.5) * 1.6 * k, yc = r * h + h * 0.35 + (hachage(col, r, g + 5) - 0.5) * 1.2 * k; const ex = (x + 0.5 - xc) / (w * 0.62), ey = (y + 0.5 - yc) / (h * 0.75);
        if (ey > -1 && Math.abs(ex) < (ey < 0 ? Math.sqrt(1 - ey * ey) : 1 - ey) ) { vu = { ex, ey, col, r }; break; } } }
    const ton = t.teinte(x, y);
    if (!vu) { t.poser(x, y, mats[0], ton - 2); continue; }
    const m = mats[Math.floor(hachage(vu.col, vu.r, g) * mats.length)];
    let d = ton + (vu.ey < -0.3 ? 1 : 0) - (vu.ey > 0.55 ? 1 : 0) - (Math.abs(vu.ex) > 0.7 ? 1 : 0);
    if (Math.abs(vu.ex) < 0.12 && vu.ey > -0.6 && vu.ey < 0.7) d -= 1;   // (la nervure)
    t.poser(x, y, m, d);
  }
}

function batonCostumeElfe({ t, k, M, matMain, gm, cx, cy, P, sol, costume }) {
  const dehors = M[0] < cx ? -1 : 1;
  const bas = [M[0] + dehors * 1.5 * k, sol], haut = [M[0] + dehors * 0.6 * k, cy - P.ry - 4 * k];
  if (costume === 'dameLanternes') {
    cylindre(t, 'batonS', haut, bas, 1.15 * k, { decalage: 0.5, motif: (x, y) => (Math.floor(y / k) % 7 === 0 ? -0.6 : 0) });
    // la crosse : le bois qui s'enroule vers le dehors, et la lanterne-feuille qui y pend
    const R = 3.2 * k, ox = haut[0] + dehors * R, oy = haut[1];
    for (let a = 0; a <= Math.PI * 1.15; a += 0.04) { const x = ox - dehors * Math.cos(a) * R, y = oy - Math.sin(a) * R; t.forme('batonS', ellipsoide(x, y, 1.05 * k, 1.05 * k), { decalage: 0.5 - a * 0.15, ombre: false }); }
    const lx = ox + dehors * R * 0.95, ly = oy + 1 * k;
    for (let y = Math.round(ly); y < ly + 2.5 * k; y++) t.poser(Math.round(lx), y, 'racineS', 2);
    const yl = ly + 2.5 * k, hl = 7 * k, wl = 2.8 * k;
    t.forme('lanterneF', (x, y) => { const v = (y + 0.5 - yl) / hl; if (v < 0 || v > 1) return null; const demi = wl * Math.sin(v * Math.PI) * (v < 0.5 ? 1 : 1 - (v - 0.5) * 0.4); const dx = x + 0.5 - lx; return Math.abs(dx) < demi ? [dx / wl * 0.6, (v - 0.5) * 0.6, 0.9] : null; }, { decalage: 1.4, ombre: false });
    for (let y = Math.round(yl + 1); y < yl + hl - 1; y++) t.poser(Math.round(lx), y, 'lanterneF', 3);   // (la nervure de la feuille)
    t.poser(Math.round(lx) - 1, Math.round(yl + hl * 0.4), 'lanterneF', 5);
  } else {
    // la canne de racine vivante : noueuse, un peu tordue ; en haut, un bourgeon et deux feuilles rouges
    const n = 6; let px = bas[0], py = bas[1];
    for (let i = 1; i <= n; i++) { const u = i / n, x = bas[0] + (haut[0] - bas[0]) * u + Math.sin(u * 7) * 0.8 * k, y = bas[1] + (haut[1] - bas[1]) * u; cylindre(t, 'batonS', [px, py], [x, y], (1.4 - u * 0.25) * k, { decalage: 0.4, motif: (xx, yy) => (hachage(Math.floor(xx / k), Math.floor(yy / k), 9) > 0.8 ? -0.8 : 0) }); if (i % 2 === 0) t.forme('batonS', ellipsoide(x, y, 1.8 * k, 1.2 * k), { decalage: 0.2, ombre: false }); px = x; py = y; }
    for (const [dx, dy, m] of [[-2.2, -2.4, 'feuilleR'], [2, -1.6, 'feuilleR'], [0.3, -3.4, 'mousseS']]) t.forme(m, (x, y) => { const ex = (x + 0.5 - (haut[0] + dx * k)) / (1.5 * k), ey = (y + 0.5 - (haut[1] + dy * k)) / (1 * k); return ex * ex + ey * ey <= 1 ? [ex * 0.6, -0.3, 0.8] : null; }, { decalage: 0.5, ombre: false });
  }
  t.forme(matMain, ellipsoide(M[0], M[1] + 1 * k * gm, 2.2 * k * gm, 2.3 * k * gm), { decalage: 0.6 });   // la main serrée dessus
}

function detailsCostumeElfe(t, o) {
  const { costume, dos, X, Z, cx, cy, yT, yB, sol, ep, prof, P, k, c, s } = o;
  if (costume === 'dameLanternes') {
    manteauDeFeuilles(t, 'cape', k, 3);
    // l'ourlet de la robe brodé de feuilles d'or, et une ceinture de feuilles d'or
    for (let y = sol - 4 * k; y < sol - 1 * k; y++) for (let x = 0; x < t.l; x++) if (t.mat(x, y) === 'habit' && ((x + Math.floor(y / k) * 2) % (4 * k) < k)) t.poser(x, y, 'or', 4);
    for (let y = sol - 1 * k; y < sol; y++) for (let x = 0; x < t.l; x++) if (t.mat(x, y) === 'habit') t.poser(x, y, 'or', 3);
    for (let y = yB - 1 * k; y <= yB; y++) for (let x = 0; x < t.l; x++) if (t.mat(x, y) === 'habit') t.poser(x, y, (x % (3 * k)) < k ? 'feuilleJ' : 'or', 4);
    // des feuilles d'or glissées dans les cheveux
    let n = 0; for (let y = cy - P.ry; y < yB && n < 9; y += 3 * k) for (let x = 0; x < t.l && n < 9; x++) if (t.mat(x, y) === 'cheveux' && hachage(x, y, 7) > 0.93) { t.poser(x, y, 'or', 5); t.poser(x + 1, y, 'or', 3); t.poser(x, y + 1, 'or', 3); n++; }
    // la pierre du diadème, une goutte d'ambre
    if (!dos) t.forme('cristal', ellipsoide(X(0, P.rx * 0.82), cy - P.ry + 2.5 * k, 0.9 * k, 1.1 * k), { decalage: 0.6, ombre: false });
  } else if (costume === 'maitreTerrasses') {
    // le manteau roux bordé d'une tresse de racines
    const bordCape = (x, y) => t.mat(x, y) === 'cape' && [[2, 0], [-2, 0], [0, 2], [0, -2]].some(([dx, dy]) => { const m = t.mat(x + dx, y + dy); return m && m !== 'cape'; });
    const bord = []; for (let y = yT; y < sol; y++) for (let x = 0; x < t.l; x++) if (bordCape(x, y)) bord.push([x, y]);
    for (const [x, y] of bord) t.poser(x, y, 'racineS', ((x + y) % 4 < 2 ? 4 : 2));
    // la robe brodée de cuivre (une bande au milieu, des feuilles de chaque côté) et la ceinture de cuir, la serpette
    if (!dos) {
      for (let y = yB + 2 * k; y < sol - 1 * k; y++) { const x = Math.round(X(0, prof)); if (t.mat(x, y) === 'habit') { t.poser(x, y, 'cuivre', 4); if (Math.floor(y / k) % 6 === 0) { t.poser(x - k, y - 1, 'cuivre', 3); t.poser(x + k, y - 1, 'cuivre', 3); } } }
      for (let y = yB - 1 * k; y <= yB; y++) for (let x = 0; x < t.l; x++) if (t.mat(x, y) === 'habit') t.poser(x, y, 'cuir', 3);
      const hx = X(o.pres * ep * 0.5, prof * 0.95), hy = yB + 1 * k;
      for (let j = 0; j < 5 * k; j++) { const a = j / (5 * k); t.poser(Math.round(hx + Math.sin(a * 2.4) * 2 * k), Math.round(hy + a * 4 * k), 'metal', 4); t.poser(Math.round(hx + Math.sin(a * 2.4) * 2 * k) + 1, Math.round(hy + a * 4 * k), 'metal', 2); }
      t.forme('racineS', ellipsoide(hx, hy, 0.9 * k, 1.2 * k), { decalage: 0.3, ombre: false });
    }
    for (let y = sol - 1 * k; y < sol; y++) for (let x = 0; x < t.l; x++) if (t.mat(x, y) === 'habit') t.poser(x, y, 'cuivre', 3);
    // la couronne de racines tressées, et ses trois feuilles rouges
    const yc = cy - P.ry + 2.5 * k;
    for (let x = 0; x < t.l; x++) for (let y = Math.round(yc - 1 * k); y <= yc + 1 * k; y++) {
      const dx = x + 0.5 - X(0, -0.5 * k); if (Math.abs(dx) > P.rx + 0.7 * k) continue;
      if (!t.mat(x, y) || t.mat(x, y) === 'cheveux' || t.mat(x, y) === 'peau') t.poser(x, y, 'racineS', ((x + Math.round(y * 1.5)) % (3 * k) < k ? 4 : 2));
    }
    for (const u of [-0.55, 0.05, 0.6]) { const z = Math.sqrt(Math.max(0, 1 - u * u)) * P.rx; if (!dos && Z(u * P.rx, z) < -0.2 * P.rx) continue; const x = X(u * P.rx, dos ? -z : z); t.forme('feuilleR', (px, py) => { const ex = (px + 0.5 - x) / (1.1 * k), ey = (py + 0.5 - (yc - 2.2 * k)) / (1.8 * k); return ex * ex + ey * ey <= 1 ? [ex * 0.6, -0.4, 0.8] : null; }, { decalage: 0.5, ombre: false }); }
  }
}

function detailsBusteElfe(t, g, v, cx, { fx, ey, T }) {
  const c = g.costumeFig;
  if (!COSTUMES_ELFES.includes(c)) return;
  rampesCostumeElfe(t, c, g);
  for (let y = 0; y < t.h; y++) for (let x = 0; x < t.l; x++) { const m = t.mat(x, y); if (m === 'habit' || m === 'cape') t.poser(x, y, m, t.teinte(x, y)); }   // (les nouvelles couleurs de la robe et du manteau)
  const yd = v.yeux - 9 - (v.front || 0);
  if (c === 'dameLanternes') {
    for (let y = ey - 9; y <= ey - 3; y++) for (let x = Math.round(fx - 16); x <= fx + 16; x++) if (t.mat(x, y) === 'cheveux') t.poser(x, y, 'cheveux', Math.min(1, t.teinte(x, y)));   // (des sourcils plus sombres que la chevelure)
    manteauDeFeuilles(t, 'cape', 1, 3);
    for (let y = 0; y < t.h; y++) for (let x = 0; x < t.l; x++) if (t.mat(x, y) === 'metal' && y > v.torse - 4) t.poser(x, y, 'or', t.teinte(x, y));   // (le liseré d'or)
    // le diadème : une couronne de petites feuilles d'or, une goutte d'ambre au milieu
    for (let x = Math.round(cx - v.rx + 1); x <= cx + v.rx - 1; x++) { t.poser(x, yd, 'or', 3); t.poser(x, yd + 1, 'or', 2); }
    for (let i = -3; i <= 3; i++) { const x = Math.round(cx + T * 0.5 + i * 3.6), h = 4 - Math.abs(i) * 0.6; for (let j = 0; j < h; j++) { t.poser(x, yd - 1 - j, 'or', j === 0 ? 3 : 5 - (j > 2 ? 1 : 0)); if (j < h - 1.5) { t.poser(x - 1, yd - 1 - j, 'or', 3); t.poser(x + 1, yd - 1 - j, 'or', 4); } } }
    t.dessin(Math.round(cx + T * 0.5) - 1, yd - 1, ['.o.', 'oAo', 'oAo', '.o.'], { o: ['or', 4], A: ['cristal', 4] });
    // des feuilles d'or glissées dans les cheveux
    for (const [x, y] of [[cx - v.rx - 2, v.cy + 6], [cx + v.rx + 1, v.cy + 12], [cx - v.rx - 1, v.cy + 22], [cx + v.rx + 2, v.cy + 26]]) if (t.mat(x, y) === 'cheveux') { t.poser(x, y, 'or', 5); t.poser(x + 1, y, 'or', 3); t.poser(x, y + 1, 'or', 3); t.poser(x - 1, y - 1, 'or', 4); }
    // la broche : une petite lanterne-feuille à la gorge, qui luit
    t.dessin(cx - 2, v.torse + 1, ['..o..', '.oLo.', 'oLLLo', '.oLo.', '..o..'], { o: ['or', 3], L: ['lanterneF', 5] });
  } else {
    for (let y = 0; y < t.h; y++) for (let x = 0; x < t.l; x++) if (t.mat(x, y) === 'metal' && y > v.torse - 4) t.poser(x, y, 'racineS', (x + y) % 3 ? 4 : 2);   // (la tresse de racines au bord du manteau)
    // la couronne de racines tressées, trois feuilles rouges
    for (let x = Math.round(cx - v.rx); x <= cx + v.rx; x++) for (let j = 0; j < 3; j++) t.poser(x, yd - 1 + j, 'racineS', (x + j * 2) % 4 < 2 ? 4 : j === 2 ? 1 : 2);
    for (const i of [-8, 0, 8]) { const x = Math.round(cx + T * 0.5 + i); t.dessin(x - 2, yd - 5, ['.rr..', 'rRRr.', '.rRRr', '..rr.'], { r: ['feuilleR', 2], R: ['feuilleR', 4] }); }
    // la broche-feuille de cuivre
    for (let y = 0; y < t.h; y++) for (let x = 0; x < t.l; x++) if (t.mat(x, y) === 'or' && y > v.torse - 2 && y < v.torse + 8) t.poser(x, y, 'cuivre', t.teinte(x, y));
  }
}
