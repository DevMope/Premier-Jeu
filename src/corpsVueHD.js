// Les corps en volume : un même personnage vu de face, de trois-quarts, de profil ou de dos,
// avec une lumière par membre (le bras, l'avant-bras, la cuisse, le mollet ont chacun leur
// cylindre) et des ombres portées (une manche sur le torse, le menton sur le cou, la frange sur
// le front). C'est ce qui donne du relief, façon Terraria : peu de pixels, mais des volumes.
//
// Le corps est pensé en trois dimensions : `u` vers la droite de l'écran (quand il est de face),
// `z` vers le spectateur, `y` vers le bas. On le tourne d'un angle, et chaque point se projette
// à l'écran ; ce qui est derrière se dessine d'abord, ce qui est devant se dessine par-dessus.

const ANGLES_VUE = { face: 0, troisQuarts: Math.PI / 4, profil: Math.PI / 2, dos: Math.PI };
const VUES_CORPS = ['troisQuarts', 'face', 'profil', 'dos'];

// Un cylindre entre deux points de l'écran (le membre), avec sa normale ronde.
function cylindre(t, mat, a, b, rayon, { decalage = 0, ombre = null } = {}) {
  const [ax, ay] = a, [bx, by] = b;
  const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1;
  t.forme(mat, (x, y) => {
    const u = Math.max(0, Math.min(1, ((x + 0.5 - ax) * dx + (y + 0.5 - ay) * dy) / l2));
    const px = x + 0.5 - (ax + u * dx), py = y + 0.5 - (ay + u * dy);
    const d = Math.hypot(px, py);
    if (d >= rayon) return null;
    const n = d / rayon;
    return [px / rayon, py / rayon * 0.5, Math.sqrt(Math.max(0.05, 1 - n * n))];
  }, { decalage, ombre });
}

function dessinerCorpsVue(g, tenue = 1, costume = null, pas = 0, pose = null, vue = 'troisQuarts') {
  const race = PROPORTIONS[g.race] ? g.race : 'humain';
  const P = PROPORTIONS[race];
  const th = ANGLES_VUE[vue] ?? ANGLES_VUE.troisQuarts;
  const c = Math.cos(th), s = Math.sin(th);
  const dos = vue === 'dos';
  const L = 48;
  const coiffe = race === 'magicienne' ? 10 : 0;
  const H = P.H + coiffe;
  const t = new ToileHD(L, H);
  t.relief = true;
  const cx = 24;
  const f = g.feminin;
  t.rampes.peau = RAMPES_PEAU[g.peau ?? 1] || RAMPES_PEAU[1];
  t.rampes.cheveux = rampe(g.cheveux);
  t.rampes.habit = rampe(g.habit);
  t.rampes.cape = rampe(g.cape || 0x4a3a2a);
  t.rampes.iris = rampe(g.yeux || 0x4a3a20);
  t.rampes.lin = rampe(0xd8ccb0);
  t.rampes.bas = rampe(race === 'elfe' ? 0x3a4a3a : race === 'hobbit' ? 0x8a6a40 : 0x5a4a3a);
  t.rampes.levres = levresPour(g.peau ?? 1, f);
  t.rampes.chapeau = rampe(g.habit);
  t.rampes.or = RAMPES.or;

  const cy = coiffe + 1 + P.ry;            // le centre de la tête
  const yT = cy + P.ry - 1;                // le haut du torse
  const yB = yT + P.torse;                 // la taille
  const sol = H - 1;
  const ep = P.ep;                         // la demi-largeur d'épaules
  const prof = ep * 0.55;                  // la demi-épaisseur du torse

  // La projection : un point (u, z) → x à l'écran ; et sa profondeur (devant > 0).
  const X = (u, z) => cx + u * c + z * s;
  const Z = (u, z) => -u * s + z * c;
  // Le côté « proche » du spectateur : u négatif quand il se tourne vers la droite.
  const pres = s > 0.01 ? -1 : 1;
  const loin = -pres;

  // Une ellipse pleine (le torse, une cuisse vue de face…) : à l'écran, la largeur projetée
  // d'une section ronde de demi-axes (ru, rz) ; la normale est celle d'un cylindre vertical.
  const section = (ru, rz) => Math.sqrt((ru * c) ** 2 + (rz * s) ** 2);

  // --- Les membres : chaque segment est un cylindre, l'avant-bras et le mollet un peu plus clairs ---
  const matBras = race === 'nain' ? 'metal' : 'habit';
  const bras = (cote, devant) => {
    // L'épaule, le coude, la main (u, z, y) ; les bras se balancent avec la marche
    const bal = pas ? (cote === pres ? pas : -pas) : 0;
    const epaule = [cote * (ep - 0.8), 0.3, yT + 2];
    const coude = [cote * (ep + 1.2), -0.8 + bal * 1.5, yT + P.torse * 0.5];
    const main = [cote * (ep + 0.6), 1 + bal * 3.5, yB + 1.5 - Math.abs(bal) * 0.5];
    const E = [X(epaule[0], epaule[1]), epaule[2]], C = [X(coude[0], coude[1]), coude[2]], M = [X(main[0], main[1]), main[2]];
    const r = race === 'nain' ? 3 : 2.6;
    const dec = devant ? 0 : -0.5;
    cylindre(t, matBras, E, C, r, { decalage: dec });
    // L'avant-bras : manche retroussée (novice), brassard de cuir (aguerri et plus)
    cylindre(t, tenue >= 2 ? 'cuir' : tenue === 0 ? 'peau' : matBras, C, M, r - 0.3, { decalage: dec + (tenue === 1 ? 0.35 : 0.15) });
    t.forme('peau', ellipsoide(M[0], M[1] + 1, 2.2, 2.1), { decalage: dec + 0.1 });
  };
  const jambe = (cote, devant) => {
    const bal = pas ? (cote === pres ? pas : -pas) : 0;   // la jambe qui avance
    const hanche = [cote * ep * 0.42, 0, yB - 1];
    const genou = [cote * ep * 0.45, bal * 2.2 + (bal > 0 ? 1 : 0), yB + (sol - yB) * 0.5];
    const pied = [cote * ep * 0.48, bal * 3.8, sol - 3 - (bal > 0 ? 1.5 : 0)];
    const Hh = [X(hanche[0], hanche[1]), hanche[2]], G = [X(genou[0], genou[1]), genou[2]], Pd = [X(pied[0], pied[1]), pied[2]];
    const dec = devant ? 0 : -0.5;
    const r = race === 'nain' ? 3.4 : race === 'hobbit' ? 3 : 2.9;
    cylindre(t, 'bas', Hh, G, r, { decalage: dec });
    if (race === 'hobbit') {
      cylindre(t, 'bas', G, Pd, r - 0.4, { decalage: dec + 0.2 });
      // Les grands pieds nus et poilus
      t.forme('peau', ellipsoide(X(pied[0], pied[1] + 2), sol - 1.5, 3.6 + s * 1.2, 2), { decalage: dec });
      for (let k = 0; k < 3; k++) t.poser(Math.round(X(pied[0], pied[1] + 1 + k)), sol - 3, 'cheveux', 2);
    } else {
      // La botte : la tige jusqu'au genou, le pied qui pointe vers l'avant
      cylindre(t, 'cuir', G, Pd, r - 0.2, { decalage: dec + 0.1 });
      const bout = X(pied[0], pied[1] + 3.2);
      t.forme('cuir', (x, y) => (y >= sol - 3 && y <= sol && Math.abs(x + 0.5 - (Pd[0] + bout) / 2) < Math.abs(bout - Pd[0]) / 2 + r - 0.5 ? [(x + 0.5 - Pd[0]) / 4, (y - sol + 1.5) / 2, 0.8] : null), { decalage: dec });
      t.forme('cuir', (x, y) => (y === G[1] + 1 && Math.abs(x + 0.5 - G[0]) < r ? [0, -0.6, 0.7] : null), { decalage: 0.5, bord: false, ombre: false }); // le revers
    }
  };

  // --- 1. Derrière : la cape (sauf de dos), les cheveux longs, le bras et la jambe du côté éloigné ---
  const capee = tenue >= 3;
  const dessinerCape = (devant) => {
    t.forme('cape', (x, y) => {
      if (y < yT + 1 || y > sol - 4) return null;
      const demi = (ep + 1.5 + (y - yT) * 0.12) * (devant ? 1 : Math.max(0.55, c) + 0.1);
      const centre = devant ? cx : X(0, -prof * 0.9) + (y - yT) * 0.04 * -s;
      const nx = (x + 0.5 - centre) / demi;
      return Math.abs(nx) <= 1 ? [nx * 0.6, 0.1, 0.8] : null;
    }, { decalage: -0.9, motif: (x) => (x % 5 === 0 ? -0.5 : 0) });
  };
  if (capee && !dos) dessinerCape(false);
  const longs = ['long', 'queue', 'chignon'].includes(g.coiffure) || race === 'elfe' || race === 'magicienne';
  if (longs && !dos) {
    const bas = g.coiffure === 'chignon' ? cy + 4 : race === 'elfe' || race === 'magicienne' ? yT + 10 : yT + 4;
    t.forme('cheveux', (x, y) => { const cc = X(0, -P.rx * 0.4); return y >= cy - 4 && y <= bas && Math.abs(x + 0.5 - cc) < P.rx + 1.2 - Math.max(0, y - bas + 6) * 0.5 ? [(x + 0.5 - cc) / (P.rx + 2), 0, 0.8] : null; }, { decalage: -0.8, motif: MECHES });
  }
  if (!dos) { bras(loin, false); jambe(loin, false); } else { bras(pres, false); jambe(pres, false); }

  // --- 2. Le torse (un cylindre un peu aplati, les épaules rondes), la ceinture ---
  const torse = (x, y) => {
    if (y < yT || y > yB + 2) return null;
    let ru = y < yT + 4 ? ep - 4 + (y - yT) * 1.1 : ep + 0.2 - Math.max(0, y - yB + 6) * 0.12;
    if (y > yB) ru = ep - 1 + (y - yB) * 0.18;
    if (race === 'nain' || race === 'hobbit') ru += Math.sin(Math.min(1, (y - yT) / P.torse) * Math.PI) * 1.4;
    const rz = prof + (race === 'nain' || race === 'hobbit' ? 1 : 0);
    const w = section(ru, rz);
    const centre = X(0, 0);
    const nx = (x + 0.5 - centre) / w;
    if (Math.abs(nx) > 1) return null;
    return [nx * 0.85, -0.15, Math.sqrt(1 - nx * nx * 0.72)];
  };
  t.forme(race === 'hobbit' ? 'lin' : 'habit', torse, { decalage: -0.1, motif: (x, y) => (!dos && Math.round(x) === Math.round(X(0, prof)) && y > yT + 3 ? -0.5 : 0) });
  if (race === 'hobbit') t.forme('habit', (x, y) => { const n = torse(x, y); return n && y >= yT + 2 && Math.abs(x + 0.5 - X(0, prof * 0.9)) > 2 + Math.max(0, 6 - (y - yT)) * 0.5 ? n : null; }, { decalage: -0.2 });
  if (race === 'nain') t.forme('metal', (x, y) => { const n = torse(x, y); return n && y >= yT + 1 && y <= yB - 2 ? n : null; }, { motif: (x, y) => ((x + y) % 2 ? 0.25 : -0.25) });
  // Les pièces cousues des novices
  if (tenue === 0) for (const [du, dy] of [[-3, 6], [2, 11]]) for (let k = 0; k < 3; k++) for (let j = 0; j < 3; j++) { const x = Math.round(X(du, prof * 0.8)) + k; if (t.mat(x, yT + dy + j) === 'habit') t.poser(x, yT + dy + j, 'habit', k === 1 && j === 1 ? 1 : 2); }
  // La ceinture, la boucle
  t.forme(tenue === 0 ? 'lin' : 'cuir', (x, y) => (y >= yB - 2 && y <= yB - 1 && torse(x, y) ? [0, y === yB - 2 ? -0.6 : 0.4, 0.8] : null), { ombre: false });
  if (tenue >= 1 && !dos && Z(0, prof) > 0) t.forme(tenue >= 4 ? 'or' : 'metal', ellipsoide(X(0, prof), yB - 1.5, 1.6, 1.3), { decalage: 0.4, ombre: false });
  // La bandoulière et la sacoche (aguerri et plus)
  if (tenue >= 1 && !dos) {
    for (let k = 0; k < P.torse - 2; k++) { const x = Math.round(X(-ep + 3 + k * (ep * 2 - 6) / P.torse, prof * 0.95)); if (torse(x, yT + 1 + k)) t.poser(x, yT + 1 + k, 'cuir', 2); }
    const sx = X(ep - 1, 0.5);
    if (Z(ep - 1, 0.5) > -2) t.forme('cuir', (x, y) => (y >= yB - 1 && y <= yB + 4 && Math.abs(x + 0.5 - sx) < 2.6 ? [(x + 0.5 - sx) / 2.6, 0, 0.9] : null));
  }
  // Les épaulières : cuir (vétéran), métal (héros), métal et or (légende)
  if (tenue >= 2) for (const cote of [loin, pres]) {
    const ex = X(cote * (ep - 0.8), 0.3);
    if (Z(cote * (ep - 0.8), 0.3) < -prof * 0.9 && s > 0.5) continue; // cachée derrière le torse de profil
    t.forme(tenue >= 3 ? 'metal' : 'cuir', ellipsoide(ex, yT + 2, 3.4 * Math.max(0.6, Math.abs(c) + 0.3), 2.4), { decalage: 0.3 });
    if (tenue >= 4) for (let k = -2; k <= 2; k++) t.poser(Math.round(ex + k), yT + 4, 'or', 4);
  }

  // --- 3. Devant : le bras et la jambe du côté proche ---
  if (!dos) { jambe(pres, true); bras(pres, true); } else { jambe(loin, true); bras(loin, true); }

  // --- 4. Le cou, la tête, le visage ---
  t.forme('peau', (x, y) => (y >= yT - 3 && y <= yT + 1 && Math.abs(x + 0.5 - X(0, 0.5)) < 2.4 ? [(x + 0.5 - X(0, 0.5)) / 2.4, 0.2, 0.9] : null), { decalage: -0.6 });
  const tete = ellipsoide(cx, cy, P.rx, P.ry);
  // Une oreille n'est visible que si elle n'est pas derrière la tête
  const oreille = (cote) => {
    const u = cote * P.rx, z = -P.rx * 0.1;
    if (Z(u, z) < -P.rx * 0.25 || dos) return;
    const ox = X(u, z);
    if (race === 'elfe') t.forme('peau', (x, y) => { const d = cote * (x + 0.5 - ox) * (s > 0.5 ? 0.6 : 1), h = cy + 2 - y; return h >= 0 && h < 8 && d > -1.4 + h * 0.45 && d < 1.8 + h * 0.35 ? [cote * 0.7, -0.5, 0.6] : null; });
    else t.forme('peau', ellipsoide(ox, cy + 1.5, 1.8, 2.6), { decalage: -0.2 });
  };
  oreille(loin);
  t.forme('peau', tete, { decalage: 0.05 });
  oreille(pres);
  if (race === 'hobbit' && !dos) for (const cote of [-1, 1]) if (Z(cote * 4.5, P.rx * 0.7) > 0) t.forme('peau', ellipsoide(X(cote * 4.5, P.rx * 0.7), cy + 3.5, 2.6, 2), { decalage: 0.3, bord: false, ombre: false });
  const ey = Math.round(cy + 1);
  const by = ey + 5;
  if (!dos) {
    // Le nez : une petite bosse qui dépasse quand il est de profil
    const nz = X(0, P.rx);
    if (race === 'nain') t.forme('peau', ellipsoide(nz - s * 1, ey + 3, 2, 2), { decalage: 0.2, ombre: false });
    else t.forme('peau', (x, y) => (y >= ey + 1 && y <= ey + 3 && x + 0.5 >= nz - 1.5 + s * 0.5 && x + 0.5 <= nz + 0.5 + s * 1.2 ? [0.6, 0.1, 0.7] : null), { decalage: 0.1, bord: false, ombre: false });
    for (let k = 0; k < 2; k++) t.poser(Math.round(nz - 1 + s * 0.8), ey + 2 + k, 'peau', 2);
    // Les yeux et les sourcils (l'œil éloigné est plus étroit)
    const yeux = [];
    for (const cote of [loin, pres]) {
      const u = cote * P.rx * 0.5, z = P.rx * 0.78;
      if (Z(u, z) < 0.6) continue;
      const ox = Math.round(X(u, z) - 0.5);
      const large = cote === pres || s < 0.3;
      yeux.push([ox, large, cote]);
    }
    const poserYeux = () => { for (const [ox, large, cote] of yeux) {
      if (large) { t.poser(ox, ey, 'oeil', 4); t.poser(ox + 1, ey, 'iris', 2); t.poser(ox, ey + 1, 'iris', 1); t.poser(ox + 1, ey + 1, 'iris', 1); t.poser(cote < 0 ? ox + 1 : ox, ey, 'oeil', 5); }
      else { t.poser(ox, ey, 'oeil', 4); t.poser(ox, ey + 1, 'iris', 1); }
    } };
    poserYeux();
    for (const [ox, large] of yeux) { for (let k = -1; k <= (large ? 2 : 0); k++) t.poser(ox + k, ey - 2, 'cheveux', 1); if (f) t.poser(ox + (large ? 2 : 1), ey - 1, 'cheveux', 0); }
    // La bouche
    const bx = X(0, P.rx * 0.85);
    const lb = Math.max(1, Math.round(2.5 * Math.abs(c)));
    for (let i = -lb; i <= lb; i++) t.poser(Math.round(bx + i), by + (Math.abs(i) === lb && lb > 1 ? 0 : 1), 'levres', 1);
    if (Math.abs(c) > 0.9) { t.poser(Math.round(bx - lb - 1), by, 'levres', 4); t.poser(Math.round(bx + lb + 1), by, 'levres', 4); }
    else if (Math.abs(c) > 0.3) t.poser(Math.round(bx - lb - 1), by, 'levres', 4);
    // La barbe : sur la moitié avant du menton et des joues
    const barbe = race === 'nain' ? 'nain' : g.barbe;
    if (barbe) {
      const long = barbe === 'nain' ? yB + 2 : barbe === 'pleine' ? cy + P.ry + 4 : cy + P.ry + 1.5;
      t.forme('cheveux', (x, y) => {
        if (y < ey + 3 || y > long) return null;
        if (y >= by - 1 && y <= by + 1 && Math.abs(x + 0.5 - bx) < 3) return null;
        const demi = P.rx + 0.5 - Math.max(0, y - cy - P.ry) * (barbe === 'nain' ? 0.3 : 0.6);
        const centre = X(0, P.rx * 0.35 + Math.max(0, y - cy - P.ry) * 0.1);
        const nx = (x + 0.5 - centre) / demi;
        if (Math.abs(nx) > 1 || (barbe === 'bouc' && Math.abs(x + 0.5 - bx) > 3)) return null;
        const fz = nx * c * s * -1 + Math.sqrt(Math.max(0, 1 - nx * nx)) * Math.abs(c) + s * 0.3;
        return fz > 0.15 ? [nx * 0.8, (y - ey) / 20, 0.8] : null;
      }, { motif: MECHES });
      if (barbe === 'nain') for (let y = yT + 6; y < yB; y += 3) t.poser(Math.round(bx), y, 'or', 3);
    }
    yeux.length && (t.relief = false, poserYeux(), t.relief = true);
  }

  // --- 5. Les cheveux : une calotte sur la sphère, qui couvre le haut, l'arrière et les tempes ---
  const coupe = race === 'hobbit' ? 'boucles' : g.coiffure;
  if (coupe === 'boucles') {
    for (const [u, dy, z] of [[-6, -5, 2], [-2, -8, 3], [3, -8, 3], [7, -5, 2], [-8, -1, -2], [8, -1, -2], [0, -6, -5], [-5, -3, -6], [5, -3, -6]]) {
      if (Z(u, z) < -3 && !dos) continue;
      t.forme('cheveux', ellipsoide(X(u, z), cy + dy, 3, 3));
    }
  } else if (coupe !== 'chauve') {
    t.forme('cheveux', (x, y) => {
      const nx = (x + 0.5 - cx) / (P.rx + 1), ny = (y + 0.5 - cy) / (P.ry + 1.8);
      const d2 = nx * nx + ny * ny;
      if (d2 > 1) return null;
      const nz = Math.sqrt(1 - d2);
      // La normale dans le repère du personnage : fz vers son visage, fu vers sa droite
      const fz = nx * s + nz * c, fu = nx * c - nz * s;
      const frange = ny < -0.42 + Math.abs(Math.sin((x - cx) * 1.1)) * 0.14;
      const arriere = fz < -0.05;
      const tempe = Math.abs(fu) > 0.86 && ny < 0.25 && fz < 0.6;
      if (!frange && !arriere && !tempe) return null;
      return [nx, ny, nz];
    }, { motif: MECHES });
    if (coupe === 'herisse') for (let k = -6; k <= 6; k += 3) t.forme('cheveux', (x, y) => (y >= cy - P.ry - 3 && y < cy - P.ry + 1 && Math.abs(x + 0.5 - cx - k * 0.9) < (y - cy + P.ry + 4) * 0.5 ? [0, -0.6, 0.7] : null), { ombre: false });
    if (coupe === 'chignon') t.forme('cheveux', ellipsoide(X(0, -P.rx * 0.6), cy - P.ry - 0.5, 3.5, 3), { motif: MECHES });
    if (coupe === 'queue' && (s > 0.3 || dos)) t.forme('cheveux', (x, y) => { const qx = X(0, -P.rx - 1); return y >= cy - 2 && y <= yT + 8 && Math.abs(x + 0.5 - qx) < 2.2 - Math.max(0, y - yT - 2) * 0.15 ? [(x + 0.5 - qx) / 2.2, 0, 0.8] : null; }, { motif: MECHES });
  }
  // Les cheveux longs, de dos : ils tombent sur la cape et les épaules
  if (longs && dos) t.forme('cheveux', (x, y) => (y >= cy && y <= yT + 10 && Math.abs(x + 0.5 - cx) < P.rx + 1 - Math.max(0, y - yT - 4) * 0.4 ? [(x + 0.5 - cx) / (P.rx + 2), 0, 0.8] : null), { decalage: -0.3, motif: MECHES });
  if (tenue >= 4) for (let k = -5; k <= 5; k++) { const x = Math.round(X(k, Math.sqrt(Math.max(0, P.rx * P.rx - k * k)) * 0.9)); t.poser(x, cy - P.ry + 1 + (k % 3 === 0 ? -1 : 0), 'or', k % 3 === 0 ? 5 : 4); } // le diadème
  // Le chapeau pointu de la magicienne
  if (race === 'magicienne') {
    const haut = cy - P.ry;
    t.forme('chapeau', (x, y) => (y >= 0 && y <= haut + 1 && Math.abs(x + 0.5 - X(0, -1) - (haut - y) * (0.1 + s * 0.25)) < (y + 1) * 0.5 ? [(x + 0.5 - cx) / 8, -0.3, 0.8] : null));
    t.forme('chapeau', (x, y) => (y >= haut && y <= haut + 1 && Math.abs(x + 0.5 - cx) < P.rx + 5 ? [0, -0.6, 0.7] : null), { decalage: -0.3 });
    for (let x = cx - 5; x <= cx + 5; x++) t.poser(x, haut - 1, 'or', 4);
  }
  // --- 6. De dos : la cape par-dessus tout ---
  if (capee && dos) dessinerCape(true);

  t.contour();
  return t;
}
