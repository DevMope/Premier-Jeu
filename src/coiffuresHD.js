// (v1.32, planche 57 — proposition) Les nouvelles coiffures et barbes de la création, d'après les références du joueur.
// Chaque coupe se dessine sur la tête en volume du moteur des corps (corpsVueHD.js), sous les quatre angles : C est le
// « contexte » de la tête (la toile, son centre, ses rayons, l'angle de vue, la projection X/Z...).

// La part de pixels laissée vide sur un crâne rasé (le duvet qui laisse voir la peau)
const RAS_VIDE = 0.5;

// Une calotte de cheveux sur la sphère de la tête (la coupe « courte » du jeu, réglable)
function calotteHD(C, { frange = -0.42, ondes = 0.14, tempes = 0.9, tempeBas = 0.25, arriere = -0.05, gonfle = 1, hauteur = 1.8, ras = false, limite = null, motif = null } = {}) {
  const { t, k, cx, cy, P, s, c } = C;
  t.forme('cheveux', (x, y) => {
    const nx = (x + 0.5 - cx) / (P.rx + gonfle * k), ny = (y + 0.5 - cy) / (P.ry + hauteur * k);
    const d2 = nx * nx + ny * ny;
    if (d2 > 1) return null;
    const nz = Math.sqrt(1 - d2), fz = nx * s + nz * c, fu = nx * c - nz * s;
    if (limite && !limite(nx, ny, fz, fu, x, y)) return null;
    const front = ny < frange + Math.abs(Math.sin((x - cx) / k * 1.1)) * ondes;
    const derriere = fz < arriere, tempe = Math.abs(fu) > tempes && ny < tempeBas && fz < 0.5;
    if (!front && !derriere && !tempe) return null;
    if (ras && hachage(x, y, 77) < RAS_VIDE) return null;
    return [nx, ny, nz];
  }, { motif: motif || (ras ? (x, y) => (hachage(x, y, 78) > 0.6 ? -0.5 : -0.9) : MECHES), decalage: ras ? -0.7 : 0, bord: !ras, ombre: !ras });
}
// Les côtés et la nuque rasés (le dessus est dessiné à part)
const cotesRases = C => calotteHD(C, { ras: true, gonfle: 0.2, hauteur: 0.5, frange: -0.6 });
// Une masse de cheveux qui tombe derrière la tête jusqu'à `bas` (dessinée sous le corps : elle passe dans le dos)
function chuteHD(C, bas, { largeur = 1.2, rentre = 0.5 } = {}) {
  const { t, k, cy, P, s, X } = C;
  const larg = P.rx + largeur * k - s * 2.5 * k;
  t.forme('cheveux', (x, y) => { const cc = X(0, -P.rx * (0.4 + s * 0.25)); return y >= cy - 4 * k && y <= bas && Math.abs(x + 0.5 - cc) < larg - Math.max(0, y - bas + 6 * k) * rentre ? [(x + 0.5 - cc) / (P.rx + 2 * k), 0, 0.8] : null; }, { decalage: -0.8, motif: MECHES });
}
// Deux mèches qui encadrent le visage et tombent devant les épaules
function rideauxHD(C, bas, largeur = 1.6) {
  const { t, k, cy, P, X, Z, dos, loin, pres } = C;
  if (dos) return;
  for (const cote of [loin, pres]) { const u = cote * (P.rx + 0.6 * k), z = P.rx * 0.1; if (Z(u, z) < -1 * k) continue; const mx = X(u, z);
    t.forme('cheveux', (x, y) => { if (y < cy - P.ry * 0.7 || y > bas) return null; const a = (y - cy) / Math.max(1, bas - cy), l = largeur * k * (a > 0.75 ? 1 - (a - 0.75) * 2.4 : 1); const centre = mx + cote * Math.max(0, y - cy - P.ry * 0.5) * 0.18; return Math.abs(x + 0.5 - centre) < l ? [cote * 0.6 + (x + 0.5 - centre) / (3 * l), 0, 0.8] : null; }, { decalage: 0.15, motif: MECHES }); }
}
// (v1.32, planche 57 v2) Les cheveux longs, d'un seul tenant : une calotte lisse qui épouse le crâne (sans les ondes de la
// coupe courte), une raie, puis deux longueurs qui partent des tempes, couvrent les oreilles et le bord des joues,
// encadrent le visage et tombent jusqu'à `bas`. raie : 'milieu' ou 'cote' ; frange : la hauteur (ny) d'une frange droite
// à la place de la raie ; evase : l'ouverture des longueurs vers le bas (en k) ; rentre : le bas qui rentre (le carré)
function longsHD(C, { bas, gonfle = 1.1, hauteur = 1.5, evase = 1.6, raie = 'milieu', frange = null, rentre = 0, interieur = 0.72, pointes = true, lumiere = 0.5 } = {}) {
  const { t, k, cx, cy, P, s, c, X, dos, tete } = C;
  const R = P.rx + gonfle * k, Ry = P.ry + hauteur * k;
  const decal = raie === 'cote' ? 0.28 : 0;
  const ligne = fu => frange !== null ? frange + Math.abs(fu) * 0.12 : -0.46 + 1.1 * (fu - decal) * (fu - decal);   // le bord du front
  const geo = (x, y) => { const nx = (x + 0.5 - cx) / R, ny = (y + 0.5 - cy) / Ry, d2 = nx * nx + ny * ny; if (d2 > 1) return null; const nz = Math.sqrt(1 - d2); return { nx, ny, nz, fz: nx * s + nz * c, fu: nx * c - nz * s }; };
  const y0 = cy - P.ry * 0.25, menton = cy + P.ry;
  // jusqu'où descendent les longueurs, et leur bord extérieur, à la hauteur y (des deux côtés)
  const bords = y => { const a = Math.max(0, (y - y0) / Math.max(1, bas - y0)); let ext = R + evase * k * a; if (rentre && a > 0.8) ext -= (a - 0.8) / 0.2 * rentre * k; return ext; };
  // le visage reste découvert : la face (|fu| petit), ou tout ce qui regarde vers l'avant (de biais et de profil, l'œil
  // et la joue regardent vers nous mais restent devant l'oreille)
  const devant = (fz, fu) => (fz > 0.15 && Math.abs(fu) < 0.64) || fz > 0.42;
  const visage = (x, y) => { if (y >= menton || !tete(x, y)) return false;   // (la position sur la sphère de la tête, pas sa normale dessinée)
    const nx = Math.max(-1, Math.min(1, (x + 0.5 - cx) / P.rx)), ny = Math.max(-1, Math.min(1, (y + 0.5 - cy) / P.ry)), nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny * 0.6));
    return devant(nx * s + nz * c, nx * c - nz * s); };
  // une seule forme (pas de couture entre la calotte et les longueurs)
  t.forme('cheveux', (x, y) => {
    const g = geo(x, y);
    if (g && g.ny <= 0.32) {   // la calotte
      if (!dos && devant(g.fz, g.fu) && g.ny > ligne(Math.min(Math.abs(g.fu), 0.62))) return null;
      return [g.nx, g.ny, g.nz];
    }
    if (y < y0 || y > bas + 1 * k) return null;
    const fin = bas - (pointes ? Math.floor(hachage(Math.floor(x / k), 3, 61) * 3) * k : 0);
    if (y > fin) return null;
    const ext = bords(y), px = x + 0.5;
    // (la masse, de la nuque jusqu'à l'arrière des oreilles : de face, sa largeur ; de profil, sa profondeur)
    const coins = [X(-ext, -R * 0.95), X(ext, -R * 0.95), X(-ext, P.rx * 0.05), X(ext, P.rx * 0.05)];
    const xa = Math.min(...coins), xb = Math.max(...coins);
    if (px < xa || px > xb) return null;
    // (le relief continue celui du crâne, sans couture : même centre, même rayon, la pente qui s'adoucit vers le bas)
    const nxL = Math.max(-0.98, Math.min(0.98, (px - cx) / (R + 0.5 * evase * k))), nyL = Math.max(0.05, 0.32 - (y - (cy + Ry * 0.32)) / (4 * Ry) ), nzL = Math.sqrt(Math.max(0.05, 1 - nxL * nxL - nyL * nyL));
    if (dos) return [nxL, nyL, nzL];
    if (visage(x, y)) return null;
    // sous le menton, le cou et la poitrine restent visibles au milieu
    if (y >= menton - 1 * k || !tete(x, y)) { const xi1 = X(-P.rx * interieur, P.rx * 0.35), xi2 = X(P.rx * interieur, P.rx * 0.35); if (px > Math.min(xi1, xi2) && px < Math.max(xi1, xi2) && (y >= menton - 1 * k)) return null; }
    return [nxL, nyL, nzL];
  }, { motif: (x, y) => { const g = geo(x, y);
      if (g && g.ny <= 0.32) {
        if (frange === null && !dos && g.fz > 0 && Math.abs(g.fu - decal) < 0.035 && g.ny < ligne(g.fu)) return -1.4;   // la raie
        // les mèches partent de la raie en haut du crâne, puis deviennent les mêmes mèches que les longueurs
        if (g.ny < -0.25) return (Math.floor((g.fu - decal) * 16 + 40) % 3 === 0 ? -0.45 : 0) + (Math.abs(g.ny + 0.55) < 0.07 ? lumiere : 0);
      }
      return (Math.floor((x - cx) / k * 1.4 + 40) % 4 === 0 ? -0.45 : 0) + (Math.abs(y - (cy + P.ry * 0.2)) < 1.2 * k ? lumiere * 0.5 : 0);
    } });
}
// Une tresse : un seul cordon d'un point à un autre, qui s'affine, tressé en chevrons (les mèches croisées)
function tresseHD(C, x0, y0, x1, y1, r = 1.6) {
  const { t, k } = C, dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
  t.forme('cheveux', (x, y) => {
    const px = x + 0.5 - x0, py = y + 0.5 - y0, le = px * ux + py * uy, tr = -px * uy + py * ux;
    if (le < -r * k * 0.6 || le > L) return null;
    const a = Math.max(0, le) / L, rr = r * k * (1 - a * 0.4) * (0.88 + 0.12 * Math.cos(le / k * 2.6));   // (un maillon tous les 2,4 k)
    return Math.abs(tr) < rr ? [tr / rr * 0.7, -0.2, 0.7] : null;
  }, { motif: (x, y) => { const px = x + 0.5 - x0, py = y + 0.5 - y0, le = px * ux + py * uy, tr = -px * uy + py * ux; const m = ((le + Math.abs(tr) * (tr > 0 ? 1 : -1) * 0.9) / k / 2.4 % 1 + 1) % 1; return m < 0.25 ? -1.3 : m > 0.6 ? 0.5 : 0; } });
  t.forme('cheveux', ellipsoide(x1, y1 + 1 * k, 0.8 * r * k, 1.5 * k), { motif: MECHES });   // (le bout libre)
  t.forme('cuir', ellipsoide(x1, y1 - 0.2 * k, 0.75 * r * k, 0.5 * k), { decalage: -0.3, ombre: false });   // (le lien)
}
// Des boucles serrées, en petites boules, dans une zone de la tête
function bouclesHD(C, dans, rayon = 1.6, pas = 2.4, decalage = 0) {
  const { t, k, cx, cy, P, X, Z, dos } = C;
  for (let v = -P.ry - 6 * k; v <= P.ry; v += pas * k) for (let u = -P.rx - 6 * k; u <= P.rx + 6 * k; u += pas * k) for (const z of (Math.abs(C.s) > 0.5 ? [-0.7, -0.35, 0, 0.3, 0.6] : [-0.65, 0, 0.6]).map(f => f * P.rx)) {
    if (!dans(u, v, z)) continue;
    if (Z(u, z) < -2 * k && !dos) continue;
    const jit = (hachage(Math.round(u), Math.round(v), 91) - 0.5) * k;
    t.forme('cheveux', ellipsoide(X(u + jit, z), cy + v + jit, rayon * k, rayon * k), { decalage, motif: (x, y) => (hachage(x, y, 92) > 0.7 ? 0.5 : 0) });
  }
}

// (planche 57 v4) Le crâne des couettes, à lui : une raie au milieu, les cheveux tirés de chaque côté vers les couettes (les
// mèches filent en biais vers les oreilles), le front dégagé en arc, la même teinte claire et le même frisé que les couettes
function calotteCouettes(C) {
  const { t, k, cx, cy, P, s, c, dos } = C, R = P.rx + 0.9 * k, Ry = P.ry + 1.8 * k;
  const geo = (x, y) => { const nx = (x + 0.5 - cx) / R, ny = (y + 0.5 - cy) / Ry, d2 = nx * nx + ny * ny; if (d2 > 1) return null; const nz = Math.sqrt(1 - d2); return { nx, ny, nz, fz: nx * s + nz * c, fu: nx * c - nz * s }; };
  const ligne = fu => -0.5 + 0.9 * fu * fu;   // le bord du front, en arc (plus bas sur les tempes)
  const devant = (fz, fu) => (fz > 0.15 && Math.abs(fu) < 0.66) || fz > 0.42;
  t.forme('cheveux', (x, y) => {
    const g = geo(x, y); if (!g || (!dos && g.fz >= -0.1 && g.ny > 0.28)) return null;   // (derrière, les cheveux descendent jusqu'au col)
    if (!dos && devant(g.fz, g.fu) && g.ny > ligne(Math.min(Math.abs(g.fu), 0.62))) return null;
    return [g.nx, g.ny, g.nz];
  }, { decalage: 0.45, motif: (x, y) => { const g = geo(x, y); if (!g) return 0;
      if (!dos && g.fz > 0 && Math.abs(g.fu) < 0.035 && g.ny < ligne(g.fu)) return -1.5;   // la raie
      const biais = Math.floor((Math.abs(g.fu) * 14 - g.ny * 6) + 40) % 3 === 0 ? -0.8 : 0;   // les mèches tirées vers les côtés
      const h = hachage(Math.floor(x / k), Math.floor(y / k), 95), frise = Math.abs(g.fu) > 0.45 ? (h > 0.7 ? 0.6 : h < 0.15 ? -0.6 : 0) : 0;   // le frisé, près des couettes
      return biais + frise; } });
}
// (v1.32, planche 57 v3) Les deux couettes bouclées, en miroir : les mêmes boucles, à la même place, de chaque côté.
// Elles partent de l'arrière des oreilles (un peu en retrait) : de profil, on les voit pendre sur l'épaule.
function couettesHD(C, cotes) {
  const { t, k, cy, P, X, Z, dos, s } = C, retrait = Math.abs(s) > 0.2 ? -P.rx * 0.35 : 0;
  for (const cote of cotes) for (let j = 0; j * 1.6 * k < P.ry + 11 * k; j++) {
    const v = -1 * k + j * 1.6 * k, larg = 1.9 - Math.max(0, v - P.ry) / (12 * k) * 0.6;
    for (const i of [-1, 0, 1]) { if (Math.abs(i) * 1.25 > larg) continue;
      const h = hachage(i + 4, j, 91) - 0.5, u = cote * (P.rx + 2.2 * k + i * 1.25 * k + h * 0.4 * k);
      t.forme('cheveux', ellipsoide(X(u, retrait + i * 0.6 * k * Math.abs(s)), cy + v + h * 0.5 * k, 1.25 * k, 1.25 * k), { decalage: 0.45, motif: (x, y) => (hachage(Math.abs(x - X(0, 0)), y, 92) > 0.7 ? 0.5 : 0) }); }
  }
}

const COIFFURES_HD = {
  // (la coupe militaire : un duvet ras partout)
  militaire: { nom: 'Militaire', dessus: C => calotteHD(C, { ras: true, gonfle: 0.4, hauteur: 0.7, frange: -0.52, ondes: 0.04 }) },
  degrade: { nom: 'Dégradé court', dessus: C => { cotesRases(C); calotteHD(C, { gonfle: 0.9, hauteur: 1.6, frange: -0.5, ondes: 0.05, limite: (nx, ny) => ny < -0.45 }); } },
  // (planche 75 v2) le duc : la même coupe, mais de profil le côté de la tête est dégarni (l'oreille reste nue) et la limite
  // des cheveux recule doucement vers l'arrière du crâne en descendant
  degarniDuc: { nom: 'Dégarni (duc)', dessus: C => { const lim = (nx, ny, fz) => Math.abs(C.s) <= 0.85 || fz < 0.05 - Math.max(0, ny + 0.5) * 1.1;
    calotteHD(C, { gonfle: 0.6, hauteur: 1.1, frange: -0.8, ondes: 0.02, limite: lim }); calotteHD(C, { gonfle: 0.7, hauteur: 1.2, frange: -0.72, ondes: 0, limite: (nx, ny, fz, fu) => Math.abs(fu) < 0.12 && lim(nx, ny, fz) }); } },
  degarni: { nom: 'Dégarni', dessus: C => { calotteHD(C, { gonfle: 0.6, hauteur: 1.1, frange: -0.8, ondes: 0.02 }); calotteHD(C, { gonfle: 0.7, hauteur: 1.2, frange: -0.72, ondes: 0, limite: (nx, ny, fz, fu) => Math.abs(fu) < 0.12 }); } },
  iroquoise: { nom: 'Iroquoise', marge: 7, dessus: C => { cotesRases(C); const { t, k, cy, P, s, c, X } = C;
    for (let i = -4; i <= 5; i++) { const z = i * P.rx * 0.2, ux = X(0, z), base = cy - Math.sqrt(Math.max(0, 1 - (z / P.rx) ** 2)) * P.ry - 0.5 * k, h = (6 + (i % 2) * 1.5 - Math.abs(i - 0.5) * 0.4) * k;
      t.forme('cheveux', (x, y) => { const v = (base - y) / h; const dent = (Math.floor((x - ux) / k) % 2 ? 0.12 : 0); return v >= 0 && v <= 1 - dent && Math.abs(x + 0.5 - ux) < (2.4 * Math.max(0.35, Math.abs(c)) + 1.5 * Math.abs(s)) * k * (1 - v * 0.6) + 0.6 * k ? [(x + 0.5 - ux) / (2.5 * k), -0.6, 0.6] : null; }, { motif: (x, y) => (Math.floor(x / k) % 2 ? 0.4 : -0.3) }); } } },
  pointes: { nom: 'Crête à pointes', marge: 9, dessus: C => { cotesRases(C); const { t, k, cx, cy, P, X, s } = C;
    for (let i = -3; i <= 3; i++) { const a = -Math.PI / 2 + i * 0.32, ux = X(Math.cos(a) * P.rx * 0.3 * (1 - Math.abs(s)), Math.sin(i * 0.5) * P.rx * 0.4 * Math.abs(s)), base = cy - P.ry * 0.85, L = (8.5 - Math.abs(i) * 0.6) * k, ang = i * 0.28;
      t.forme('cheveux', (x, y) => { const dx = x + 0.5 - ux, dy = base - y, along = dy * Math.cos(ang) + dx * Math.sin(ang), across = dx * Math.cos(ang) - dy * Math.sin(ang); return along >= 0 && along <= L && Math.abs(across) < 1.8 * k * (1 - along / L) + 0.3 * k ? [across / (2 * k), -0.5, 0.6] : null; }, { motif: (x, y) => (hachage(x, y, 5) > 0.75 ? 0.6 : 0) }); } } },
  chignonHomme: { nom: 'Chignon', marge: 2, dessus: C => calotteHD(C, { gonfle: 0.6, hauteur: 1.2, frange: -0.62, ondes: 0.02, motif: (x, y) => (Math.floor((x - C.cx) / C.k * 0.8 + 40) % 3 === 0 ? -0.4 : 0) }),
    // (le chignon est noué derrière, en haut du crâne : de face, il dépasse à peine au-dessus de la tête)
    derriere: C => { const { t, k, cy, P, X } = C; const bx = X(0, -P.rx * 0.85), by = cy - P.ry * 0.85;
      t.forme('cheveux', ellipsoide(bx, by, 3.6 * k, 3.2 * k), { motif: (x, y) => (Math.floor((x + y) / k) % 3 === 0 ? -0.5 : MECHES(x, y)) });
      t.forme('cuir', ellipsoide(X(0, -P.rx * 0.6), by + 2.6 * k, 1.8 * k, 0.8 * k), { decalage: 0.2, ombre: false }); } },
  longLisse: { nom: 'Longs et lisses', derriere: C => { if (!C.dos) chuteHD(C, C.yT + 16 * C.k, { largeur: 1.4, rentre: 0.3 }); }, dessus: C => longsHD(C, { bas: C.yT + 15 * C.k }) },
  afroDegrade: { nom: 'Boucles dégradées', marge: 3, dessus: C => { cotesRases(C); bouclesHD(C, (u, v, z) => v < -C.P.ry * 0.42 && u * u / (C.P.rx + 0.8 * C.k) ** 2 + (v + C.P.ry * 0.1) ** 2 / (C.P.ry + 2.6 * C.k) ** 2 < 1, 1.9, 2.6); } },
  afro: { nom: 'Grand afro', marge: 6, dessus: C => {
    // (une seule masse de boucles qui remplace la coupe : posée sur la tête, plus large que le crâne, le visage dégagé)
    const { t, k, cx, cy, P, s, c, dos, tete } = C, ax = cx, ay = cy - 2.6 * k, rx = P.rx + 5.6 * k, ry = P.ry + 5.4 * k;
    const ligne = cy - P.ry * 0.7, bas = cy + P.ry * 0.38;
    t.forme('cheveux', (x, y) => {
      const dx = x + 0.5 - ax, dy = y + 0.5 - ay, a = Math.atan2(dy, dx), bosse = 1 + 0.045 * Math.sin(a * 17) + 0.03 * Math.sin(a * 7 + 1);
      const nx = dx / (rx * bosse), ny = dy / (ry * bosse), d2 = nx * nx + ny * ny; if (d2 > 1) return null;
      if (!dos) { if (y > bas) return null;
        if (((x + 0.5 - cx) / P.rx) ** 2 + ((y + 0.5 - cy) / P.ry) ** 2 < 1) { const hx = Math.max(-1, Math.min(1, (x + 0.5 - cx) / P.rx)), hz = Math.sqrt(Math.max(0, 1 - hx * hx)), fz = hx * s + hz * c, fu = hx * c - hz * s;
          // (le front dégagé en arc : la ligne des cheveux descend sur les tempes)
          if (fz > 0.1 && Math.abs(fu) < 0.82 && y > ligne + fu * fu * P.ry * 1.1) return null; } }
      return [nx, ny, Math.sqrt(1 - d2)];
    }, { motif: (x, y) => { const i = Math.floor(x / (1.5 * k)), j = Math.floor(y / (1.5 * k)), h = hachage(i, j, 93); return h > 0.72 ? 0.7 : h < 0.2 ? -0.8 : (hachage(x, y, 94) < 0.12 ? -0.5 : 0); } });
  } },
  bol: { nom: 'Au bol', dessus: C => calotteHD(C, { gonfle: 1.6, hauteur: 2, frange: -0.22, ondes: 0, tempes: 0.6, tempeBas: 0.32, motif: (x, y) => (Math.floor(x / 2) % 3 === 0 ? 0.5 : 0) }) },
  tresses: { nom: 'Deux tresses', derriere: C => { const { k, cy, P, X, Z, yT, dos } = C; for (const cote of [-1, 1]) if (dos || Z(cote * P.rx, 0) < -1 * k) tresseHD(C, X(cote * P.rx * 0.8, -P.rx * 0.4), cy + 2 * k, X(cote * P.rx * 0.95, -P.rx * 0.2), yT + 12 * k, 1.8); },
    dessus: C => { const { k, cy, P, X, Z, yT, dos } = C; calotteHD(C, { gonfle: 0.6, hauteur: 1.2, frange: -0.55, ondes: 0.04, motif: (x, y) => (Math.abs(((x - C.cx) / C.k) % 5) < 1 ? -0.6 : 0.2) });
      if (!dos) for (const cote of [-1, 1]) if (Z(cote * P.rx, 0) >= -1 * k) tresseHD(C, X(cote * (P.rx + 0.8 * k), 0), cy + 1 * k, X(cote * (P.rx + 1.5 * k), P.rx * 0.3), yT + 12 * k, 1.8); } },
  chignonHaut: { nom: 'Chignon haut', marge: 5, dessus: C => { const { t, k, cy, P, X } = C; calotteHD(C, { gonfle: 0.8, hauteur: 1.4, frange: -0.55 }); t.forme('cheveux', ellipsoide(X(0, -P.rx * 0.1), cy - P.ry - 2.5 * k, 3.6 * k, 3 * k), { motif: MECHES }); rideauxHD(C, cy + P.ry * 0.6, 0.7); } },
  couettes: { nom: 'Couettes bouclées',
    // de face et de dos, les deux couettes pendent derrière ; de biais et de profil, celle de ton côté passe devant
    derriere: C => couettesHD(C, Math.abs(C.s) > 0.2 && !C.dos ? [C.loin] : [-1, 1]),
    dessus: C => { const { t, k, cy, P, X, Z } = C; calotteCouettes(C); if (Math.abs(C.s) > 0.2 && !C.dos) couettesHD(C, [C.pres]); for (const cote of [-1, 1]) if (Z(cote * P.rx, 0) > -2 * k) t.forme('or', ellipsoide(X(cote * (P.rx + 1.2 * k), 0), cy - 1 * k, 1.3 * k, 1.3 * k), { decalage: 0.4, ombre: false }); } },
  frange: { nom: 'Frange et longueurs', derriere: C => { if (!C.dos) chuteHD(C, C.yT + 12 * C.k, { largeur: 1.8, rentre: 0.4 }); }, dessus: C => longsHD(C, { bas: C.yT + 11 * C.k, frange: -0.12, gonfle: 1.3, hauteur: 1.7, evase: 2 }) },
  carre: { nom: 'Carré', dessus: C => longsHD(C, { bas: C.cy + C.P.ry + 2 * C.k, raie: 'cote', gonfle: 1.8, hauteur: 2, evase: 1.2, rentre: 1.4, pointes: false, interieur: 0.78 }), derriere: C => { if (!C.dos) chuteHD(C, C.cy + C.P.ry + 2 * C.k, { largeur: 2.6, rentre: 0 }); } },
  viking: { nom: 'Viking', derriere: C => { const { k, cy, P, X, yT } = C; tresseHD(C, X(0, -P.rx * 0.9), cy - 1 * k, X(0, -P.rx * 1.05), yT + 9 * k, 1.9); },
    dessus: C => { cotesRases(C); calotteHD(C, { gonfle: 1, hauteur: 1.5, frange: -0.58, limite: (nx, ny, fz, fu) => Math.abs(fu) < 0.42, motif: (x, y) => (Math.floor((x - C.cx) / C.k) % 3 === 0 ? 0.6 : 0) }); } },
  nattes: { nom: 'Nattes plaquées', derriere: C => { const { k, cy, P, X, yT } = C; for (const u of [-0.5, -0.17, 0.17, 0.5]) tresseHD(C, X(u * P.rx, -P.rx * 0.8), cy + 3 * k, X(u * P.rx * 1.2, -P.rx * 0.7), yT + 5 * k, 0.9); },
    dessus: C => calotteHD(C, { gonfle: 0.4, hauteur: 0.9, frange: -0.5, ondes: 0.02, motif: (x, y) => { const r = (((x + 0.5 - C.cx) / C.k + 40) % 3.2 + 3.2) % 3.2; return r < 1 ? -2.6 : r < 1.8 ? 1 : (y % 3 === 0 ? 0.6 : 0.2); } }) },
};

// --- Les barbes et moustaches ---
// Une zone du visage, repérée depuis la bouche : u en largeur (comprimée de biais), v en hauteur, en unités k
function poilsHD(C, dans, { clairseme = 0, motif = MECHES, longueSous = false, decalage = null, face = 0.15, mat = 'barbe' } = {}) {
  const { t, k, s, c, bx, by, tete, cy, P } = C, lc = Math.max(0.55, Math.abs(c));
  t.forme(mat, (x, y) => {
    const u = (x + 0.5 - bx) / (k * lc), v = (y + 0.5 - by) / k;
    if (!dans(u, v)) return null;
    const n = tete(x, y);
    if (!n && !(longueSous && y > cy + P.ry - 1 * k)) return null;
    if (n && n[0] * s + n[2] * c < face) return null;
    if (clairseme && hachage(x, y, 81) < clairseme) return null;
    return n || [u * 0.1, 0.4, 0.8];
  }, { motif, decalage: decalage ?? (longueSous ? 0.2 : -0.6), bord: longueSous, ombre: false });
}
// Une longue barbe qui descend sous le menton, de largeur w(v) (demi-largeur en k)
function barbeLongueHD(C, bas, demi) {
  const { t, k, c, bx, by, cy, P } = C, lc = Math.max(0.55, Math.abs(c));
  t.forme('barbe', (x, y) => { const v = (y + 0.5 - by) / k, u = (x + 0.5 - bx) / (k * lc); if (y < by - 0.5 * k || y > bas) return null; if (v > -0.5 && v < 1.8 && Math.abs(u) < 2.8) return null; const w = demi(v, (y - (cy + P.ry)) / k); return w > 0 && Math.abs(u) < w ? [u / (w + 1) * 0.8, 0.3, 0.8] : null; }, { motif: MECHES });
}
const MOUSTACHE = (u, v, l = 4.2, haut = -2, bas = -0.6) => v >= haut + Math.abs(u) * 0.08 && v <= bas + (Math.abs(u) > l - 1 ? 0.6 : 0) && Math.abs(u) < l;
const JOUES = (u, v, menton) => v > -3.5 && v < menton && Math.abs(u) < 5.6 - Math.max(0, v - 2) * 0.35 && !(v > -0.8 && v < 1.4 && Math.abs(u) < 2.6);
const BARBES_HD = {
  // (le visage, en unités k depuis la bouche : les yeux à v −5, le nez à −2.5, le menton à +3, les joues à |u| ≈ 6)
  // La barbe de 3 jours : la peau assombrie, piquée de poils
  troisJours: { nom: 'Barbe de 3 jours', dessin: C => { poilsHD(C, (u, v) => JOUES(u, v, 6) || MOUSTACHE(u, v), { mat: 'peau', decalage: -0.5, motif: (x, y) => (hachage(x, y, 83) < 0.3 ? -0.5 : 0) }); poilsHD(C, (u, v) => JOUES(u, v, 6) || MOUSTACHE(u, v), { clairseme: 0.82, decalage: -0.3, motif: () => 0 }); } },
  troisJoursLongue: { nom: 'Barbe de 3 jours (longue)', dessin: C => { poilsHD(C, (u, v) => JOUES(u, v, 6.4) || MOUSTACHE(u, v), { mat: 'peau', decalage: -0.8, motif: () => 0 }); poilsHD(C, (u, v) => JOUES(u, v, 6.4) || MOUSTACHE(u, v), { clairseme: 0.55, decalage: -0.4, motif: () => 0 }); } },
  courteNette: { nom: 'Barbe courte', dessin: C => poilsHD(C, (u, v) => JOUES(u, v, 5.5) || MOUSTACHE(u, v)) },
  complete: { nom: 'Barbe complète', dessin: C => { poilsHD(C, (u, v) => JOUES(u, v, 7) || MOUSTACHE(u, v)); barbeLongueHD(C, C.cy + C.P.ry + 3 * C.k, v => 5.2 - Math.max(0, v - 5) * 0.4); } },
  fourchette: { nom: 'Fourchette', dessin: C => { poilsHD(C, (u, v) => JOUES(u, v, 7) || MOUSTACHE(u, v)); barbeLongueHD(C, C.cy + C.P.ry + 9 * C.k, (v, w) => (w > 4 && Math.abs(0) < 1 ? 4.6 - w * 0.12 : 5 - Math.max(0, v - 5) * 0.25)); fendreHD(C, C.cy + C.P.ry + 4 * C.k, C.cy + C.P.ry + 9 * C.k); } },
  garibaldi: { nom: 'Garibaldi', dessin: C => { poilsHD(C, (u, v) => JOUES(u, v, 7) || MOUSTACHE(u, v, 4.6, -2.2)); barbeLongueHD(C, C.cy + C.P.ry + 6 * C.k, (v, w) => 5.6 + Math.min(0.8, w * 0.15) - Math.max(0, w - 3) * 0.9); } },
  bandholz: { nom: 'Bandholz (très longue)', dessin: C => { poilsHD(C, (u, v) => JOUES(u, v, 7) || MOUSTACHE(u, v, 4.8, -2.3, -0.2)); barbeLongueHD(C, C.yT + 9 * C.k, (v, w) => 5.6 - Math.max(0, w) * 0.18); } },
  ducktail: { nom: 'Queue de canard', dessin: C => { poilsHD(C, (u, v) => JOUES(u, v, 7) || MOUSTACHE(u, v)); barbeLongueHD(C, C.cy + C.P.ry + 6 * C.k, (v, w) => 5 - Math.max(0, w) * 0.8); } },
  collier: { nom: 'Collier', dessin: C => poilsHD(C, (u, v) => v > -3.5 && v < 6 && Math.abs(u) < 7 && (Math.abs(u) > 4.2 - Math.max(0, v) * 0.9 || v > 2), { face: -0.1, decalage: -0.8 }) },
  bouc: { nom: 'Bouc', dessin: C => poilsHD(C, (u, v) => (v > 1.4 && v < 6.2 && Math.abs(u) < 2.6 - Math.max(0, v - 4.5) * 0.4)) },
  grandBouc: { nom: 'Grand bouc', dessin: C => poilsHD(C, (u, v) => MOUSTACHE(u, v) || (v > -0.8 && v < 6.4 && Math.abs(u) < 3.2 && Math.abs(u) > (v < 1.4 ? 2.6 : -1))) },
  mouche: { nom: 'Mouche', dessin: C => poilsHD(C, (u, v) => v > 1.6 && v < 3.4 && Math.abs(u) < 0.9) },
  barbiche: { nom: 'Barbiche', dessin: C => { poilsHD(C, (u, v) => v > 1.8 && v < 6 && Math.abs(u) < 1.6); barbeLongueHD(C, C.cy + C.P.ry + 3 * C.k, (v, w) => 1.5 - w * 0.3); } },
  ancre: { nom: 'Ancre', dessin: C => poilsHD(C, (u, v) => MOUSTACHE(u, v, 3.6, -1.6, -0.9) || (v > 1.6 && v < 6.6 && Math.abs(u) < (v > 4.8 ? 3.8 - (v - 4.8) * 2 : 0.9))) },
  vanDyke: { nom: 'Van Dyke', dessin: C => { poilsHD(C, (u, v) => MOUSTACHE(u, v, 4.4, -1.8, -0.8) || (v > 1.8 && v < 6 && Math.abs(u) < 2.2)); barbeLongueHD(C, C.cy + C.P.ry + 3.5 * C.k, (v, w) => 2.2 - w * 0.6); } },
  imperiale: { nom: 'Impériale', dessin: C => { poilsHD(C, (u, v) => (v >= -2 && v <= -0.8 && Math.abs(u) < 5 && !(Math.abs(u) > 3.6 && v > -1.4)) || (Math.abs(u) > 3.6 && Math.abs(u) < 5.4 && v > -3.4 - (Math.abs(u) - 3.6) && v < -1.6) || (v > 1.8 && v < 5 && Math.abs(u) < 1)); barbeLongueHD(C, C.cy + C.P.ry + 3 * C.k, (v, w) => 1.1 - w * 0.3); } },
  favoris: { nom: 'Favoris', dessin: C => poilsHD(C, (u, v) => Math.abs(u) > 3.8 + Math.max(0, v + 2) * 0.2 && Math.abs(u) < 7 && v > -7 && v < 0.6, { face: -0.1, decalage: -0.8 }) },
  cotelettes: { nom: 'Côtelettes', dessin: C => poilsHD(C, (u, v) => (Math.abs(u) > 2.8 && Math.abs(u) < 7 && v > -7 && v < 2.4) || MOUSTACHE(u, v, 4.8), { face: -0.1 }) },
  ferACheval: { nom: 'Fer à cheval', dessin: C => poilsHD(C, (u, v) => MOUSTACHE(u, v, 4) || (Math.abs(u) > 2.8 && Math.abs(u) < 4 && v > -1.4 && v < 5.6)) },
  guidon: { nom: 'Guidon de vélo', dessin: C => poilsHD(C, (u, v) => MOUSTACHE(u, v, 4.6, -1.9, -0.9) || (Math.abs(u) >= 4.2 && Math.abs(u) < 6.4 && v > -3.4 + (6.4 - Math.abs(u)) * 0.2 - (Math.abs(u) > 5.6 ? 1.2 : 0) && v < -1.4 + (Math.abs(u) > 5.6 ? -0.8 : 0))) },
  fuManchu: { nom: 'Fu Manchu', dessin: C => poilsHD(C, (u, v) => MOUSTACHE(u, v, 3.4, -1.8, -1) || (Math.abs(u) > 2.8 && Math.abs(u) < 3.8 && v > -1.4 && v < 9), { longueSous: true }) },
  morse: { nom: 'Morse', dessin: C => poilsHD(C, (u, v) => v >= -2.4 && v <= 0.8 + (Math.abs(u) > 3 ? 0.8 : 0) && Math.abs(u) < 4.8 - Math.max(0, v) * 0.3) },
  brosse: { nom: 'Brosse', dessin: C => poilsHD(C, (u, v) => v >= -2.4 && v <= -0.6 && Math.abs(u) < 4) },
  chevron: { nom: 'Chevron', dessin: C => poilsHD(C, (u, v) => v >= -2.4 + Math.abs(u) * 0.12 && v <= -0.3 && Math.abs(u) < 4.4) },
  crayon: { nom: 'Fine (crayon)', dessin: C => poilsHD(C, (u, v) => v >= -1.6 && v <= -1 && Math.abs(u) < 3.6 && Math.abs(u) > 0.4) },
  dali: { nom: 'Dalí', dessin: C => poilsHD(C, (u, v) => (v >= -1.6 && v <= -1 && Math.abs(u) < 3.4) || (Math.abs(u) >= 3 && Math.abs(u) < 3.8 && v > -6.5 && v < -1), { decalage: -1 }) },
};
// La fourche d'une longue barbe : une fente au milieu, du menton jusqu'au bout
function fendreHD(C, y0, y1) {
  const { t, k, c, bx } = C, lc = Math.max(0.55, Math.abs(c));
  for (let y = Math.round(y0); y <= y1; y++) { const w = Math.round((y - y0) / (y1 - y0) * 1.6 * k * lc); for (let x = Math.round(bx - w); x <= bx + w; x++) if (t.mat(x, y) === 'barbe') { t.c[y * t.l + x] = null; t.m[y * t.l + x] = null; } }
}

// (v1.32) Les coupes et barbes validées entrent dans la création, au bout des listes (les vieilles sauvegardes gardent leurs
// numéros). Une coupe pas encore validée attend dans COIFFURES_EN_ATTENTE (les couettes, validées en planche 57 v5).
const COIFFURES_EN_ATTENTE = [];
// (l'ordre est fixé une fois pour toutes : une coupe validée plus tard s'ajoute toujours au bout)
const COIFFURES_ORDRE = ['militaire', 'degrade', 'degarni', 'iroquoise', 'pointes', 'afroDegrade', 'bol', 'tresses', 'chignonHaut', 'viking', 'nattes',
  'chignonHomme', 'afro', 'longLisse', 'frange', 'carre', 'couettes'];
for (const id of COIFFURES_ORDRE) if (COIFFURES_HD[id] && !COIFFURES_EN_ATTENTE.includes(id)) { COIFFURES_IDS.push(id); APPARENCE.coiffure.push(COIFFURES_HD[id].nom); }
for (const [id, b] of Object.entries(BARBES_HD)) { BARBES_IDS.push(id); APPARENCE.barbe.push(b.nom); }
