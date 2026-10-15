// (v0.65, étape 10c) La rue du shop, le soir : on la parcourt à pied pendant la promenade.
// De gauche à droite : une maison du voisinage, l'impasse du marché noir (sa lanterne rouge ne
// brûle que certains soirs), la forge de Thorgal (les braises rougeoient derrière les vantaux),
// ton shop, une autre maison, la fontaine, la Banque Centrale Goyenne, et l'arche qui ouvre sur
// le Marché des Mastres. Chaque façade est peinte comme celle du shop (toile ×2, posée par le bas).

const RAMPES_RUE = {
  tuile: [0x3a140c, 0x5e2214, 0x86341e, 0xa8482a, 0xc8663e, 0xe08a5a],
  ardoiseToit: [0x161820, 0x252a36, 0x363e4e, 0x4a5466, 0x626e82, 0x8a96aa],
  taille: [0x3a3a40, 0x5a5a62, 0x7a7a84, 0x9a9aa4, 0xbababf, 0xdcdce0],   // la pierre de taille, grise et fine
  braise: [0x3a0800, 0x7a1800, 0xc03a08, 0xf06a10, 0xffa830, 0xffe090],
  vitre: [0x5a3a10, 0x8a5a18, 0xc08a30, 0xf0c060, 0xf8dc90, 0xfff4d0],
  vitreNoire: [0x06080e, 0x0e121c, 0x161c2a, 0x202a3c, 0x2e3a50, 0x46566e],
  or: [0x3a2410, 0x7a4a14, 0xb07a1e, 0xd8a634, 0xf0cf5a, 0xfff0a8],
  toileRouge: [0x2a0808, 0x4e1010, 0x7a1a18, 0xa02a22, 0xc44434, 0xe06a54],
};

// Un toit à deux pans (tuiles ou ardoises), de x0 à x1, du faîte `haut` à l'égout `bas`
function toitRue(t, x0, x1, haut, bas, mat = 'tuile', graine = 1) {
  const L = x1 - x0, g0 = x0 + L * 0.24, d0 = x1 - L * 0.24;
  for (let y = haut; y <= bas; y++) {
    const v = (y - haut) / Math.max(1, bas - haut);
    const xa = Math.round(g0 - v * (g0 - x0)), xb = Math.round(d0 + v * (x1 - d0));
    const rangee = Math.floor((y - haut) / 4), decal = (rangee % 2) * 3, w = mat === 'tuile' ? 6 : 5;
    for (let x = xa; x <= xb; x++) {
      const ligne = (y - haut) % 4;
      let i = 3 + Math.round((hachage(Math.floor((x + decal) / w), rangee, graine) - 0.5) * 1.4);
      if (ligne === 3) i = 1; else if (ligne === 0) i += 1;
      if ((x + decal) % w === 0) i -= 1;
      if (x < xa + 3) i += 1;
      if (x > xb - 3) i -= 1;
      if (y > bas - 2) i = 0;
      t.poser(x, y, mat, Math.max(0, Math.min(5, i)));
    }
  }
  for (let x = Math.round(g0) - 1; x <= Math.round(d0) + 1; x++) for (let y = haut - 3; y < haut; y++) t.poser(x, y, mat, y === haut - 3 ? 5 : 2);   // le faîtage
}

// De gros moellons
function moellons(t, x0, y0, l, h, graine = 1, mat = 'pierre', bloc = 12) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + l; x++) {
    const rangee = Math.floor((y - y0) / 7), dec = (rangee % 2) * (bloc / 2);
    const bx = (x - x0 + dec) % bloc, by = (y - y0) % 7;
    const joint = bx === 0 || by === 0;
    let i = joint ? 1 : 3 + (by === 1 ? 1 : 0) - (bx === bloc - 1 || by === 6 ? 1 : 0) + Math.round((hachage(Math.floor((x + dec) / bloc), rangee, graine) - 0.5) * 1.6);
    t.poser(x, y, mat, Math.max(0, Math.min(5, i)));
  }
}

// Une fenêtre à petits carreaux : éclairée (une bougie veille) ou noire (on dort)
function fenetreRue(t, x0, y0, l, h, eclairee, volets = true) {
  const mat = eclairee ? 'vitre' : 'vitreNoire';
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + l; x++) {
    const cadre = x === x0 || x === x0 + l - 1 || y === y0 || y === y0 + h - 1;
    const plomb = (x - x0) % 6 === 0 || (y - y0) % 6 === 0;
    t.poser(x, y, cadre ? 'cheneSombre' : plomb ? 'fer' : mat, cadre ? 2 : plomb ? 1 : 2 + ((x + y) % 5 === 0 ? 1 : 0) + (y < y0 + 5 ? 1 : 0));
  }
  for (let x = x0 - 2; x < x0 + l + 2; x++) { t.poser(x, y0 + h, 'chene', 4); t.poser(x, y0 + h + 1, 'chene', 1); }
  if (volets) for (const vx of [x0 - 7, x0 + l + 1]) planche(t, vx, y0, 6, h, 'cheneSombre', { horizontale: false, graine: vx + y0 });
}

// Une porte de planches, à pentures de fer (arrondie en haut si `arc`)
function porteRue(t, x0, y0, l, h, { arc = false, mat = 'cheneSombre', graine = 3 } = {}) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + l; x++) {
    if (arc) { const r = l / 2, cy = y0 + r; if (y < cy && Math.hypot(x + 0.5 - (x0 + r), y + 0.5 - cy) > r) continue; }
    const lame = Math.floor((x - x0) / 6), bord = (x - x0) % 6 === 0;
    t.poser(x, y, mat, bord ? 1 : 3 + Math.round((hachage(lame, Math.floor(y / 9), graine) - 0.5) * 1.4));
  }
  for (const py of [y0 + Math.round(h * 0.25), y0 + Math.round(h * 0.7)]) for (let x = x0 + 2; x < x0 + l - 2; x++) { t.poser(x, py, 'fer', 3); t.poser(x, py + 1, 'fer', 1); }
  t.poser(x0 + l - 6, y0 + Math.round(h * 0.5), 'laiton', 5); t.poser(x0 + l - 5, y0 + Math.round(h * 0.5), 'laiton', 3);   // la poignée
}

function creerRueHD(scene) {
  if (scene.textures.exists('rueForgeHD')) return;
  const toile = (l, h) => { const t = toileDecor(l, h); Object.assign(t.rampes, RAMPES_RUE); return t; };

  // --- Deux maisons du voisinage (colombages, torchis, tuiles) ---
  for (const [k, l] of [[0, 150], [1, 136]]) {
    const H = 160, t = toile(l, H), rdc = 96;
    moellons(t, 8, rdc, l - 16, H - rdc, 810 + k);
    enduit(t, 10, 50, l - 20, rdc - 50, 812 + k, false);
    for (const x of [10, Math.round(l / 2) - 2, l - 15]) planche(t, x, 50, 5, rdc - 50, 'cheneSombre', { horizontale: false, graine: 813 + x });
    planche(t, 6, rdc - 5, l - 12, 6, 'cheneSombre', { graine: 814 + k, noeuds: 2 });
    toitRue(t, 0, l - 1, 6, 52, k ? 'ardoiseToit' : 'tuile', 815 + k);
    fenetreRue(t, 24, 60, 18, 22, k === 0);
    fenetreRue(t, l - 44, 60, 18, 22, false);
    porteRue(t, Math.round(l / 2) - 12 + (k ? 18 : -10), H - 52, 24, 52, { arc: !!k, graine: 816 + k });
    fenetreRue(t, k ? 18 : l - 42, H - 46, 18, 20, k === 1, false);
    t.contour(); t.texture(scene, 'rueMaisonHD_' + k);
  }

  // --- L'impasse : une ruelle étroite entre la maison et la forge, vue en perspective. Pas de toit à
  // elle : ce sont les murs des deux voisins qui s'enfoncent dans l'ombre jusqu'à une porte basse.
  {
    const L = 95, H = 112, t = toile(L, H);
    const fx0 = 34, fx1 = 61, fy0 = 46, fy1 = H - 26;   // le mur du fond, tout petit, au bout
    for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) {
      const u = y < fy1 ? 0 : (y - fy1) / (H - 1 - fy1);            // 0 au fond … 1 devant (le sol)
      const gauche = fx0 * (y >= fy1 ? 1 - u : 1), droite = fx1 + (L - 1 - fx1) * (y >= fy1 ? u : 0);
      if (y >= fy1 && x >= gauche && x <= droite) {
        // le sol : des pavés qui rapetissent vers le fond, de plus en plus sombres
        const rang = Math.floor(Math.pow(u, 0.6) * 8), bx = Math.floor((x - L / 2) / (3 + u * 9) + rang * 0.5);
        t.poser(x, y, 'pierre', ((x - L / 2) / (3 + u * 9) + rang * 0.5) % 1 < 0.12 ? 0 : 1 + (u > 0.6 ? 1 : 0) + (hachage(bx, rang, 829) > 0.7 ? 1 : 0));
        continue;
      }
      if (x >= fx0 && x <= fx1 && y >= fy0 && y < fy1) { t.poser(x, y, 'pierre', (y - fy0) % 5 === 0 || (x + Math.floor((y - fy0) / 5) * 3) % 7 === 0 ? 0 : 1); continue; }
      // les deux murs latéraux, en fuite vers le fond (les rangs de pierre convergent)
      const cote = x < fx0 ? -1 : x > fx1 ? 1 : 0;
      if (!cote) continue;
      const d = cote < 0 ? (fx0 - x) / fx0 : (x - fx1) / (L - 1 - fx1);   // 0 au fond … 1 au bord
      const haut = fy0 - d * fy0, bas = fy1 + d * (H - 1 - fy1);
      if (y < haut || y > bas) continue;
      const v = (y - haut) / Math.max(1, bas - haut);
      const rangs = Math.floor(v * 9), joint = Math.abs(v * 9 - Math.round(v * 9)) < 0.08 + d * 0.02;
      const i = joint ? 0 : (cote < 0 ? 2 : 1) + (d > 0.7 ? 1 : 0) + (hachage(Math.floor(d * 6), rangs, 830 + cote) > 0.7 ? 1 : 0) - (d < 0.25 ? 1 : 0);
      t.poser(x, y, 'pierre', Math.max(0, i));
    }
    // la porte basse au fond, son judas grillé
    porteRue(t, 41, fy1 - 22, 13, 22, { arc: true, graine: 831 });
    for (let x = 45; x < 51; x += 2) for (let y = fy1 - 18; y < fy1 - 14; y++) t.poser(x, y, 'fer', 2);
    // l'écriteau de l'impasse, cloué de travers sur le mur de gauche
    planche(t, 6, 30, 22, 8, 'chene', { graine: 834 });
    t.contour(); t.texture(scene, 'rueImpasseHD');
  }

  // --- La forge de Thorgal : pierre en bas, la grande arche fermée de vantaux, la cheminée ---
  {
    const L = 180, H = 170, t = toile(L, H), rdc = 74;
    moellons(t, 6, rdc, L - 12, H - rdc, 840);
    enduit(t, 12, 40, L - 24, rdc - 40, 841, false);
    for (const x of [12, 60, 110, L - 17]) planche(t, x, 40, 5, rdc - 40, 'cheneSombre', { horizontale: false, graine: 842 + x });
    planche(t, 8, rdc - 5, L - 16, 6, 'cheneSombre', { graine: 843, noeuds: 3 });
    toitRue(t, 0, L - 1, 6, 42, 'ardoiseToit', 844);
    // la cheminée de la forge, large, en briques sombres
    moellons(t, 132, 0, 22, 44, 845, 'pierre', 6);
    // la grande arche, et ses vantaux fermés ; un filet de braise sous la porte
    const ax = 30, al = 80, ay = H - 70, r = al / 2;
    for (let y = ay - 4; y < H; y++) for (let x = ax - 4; x < ax + al + 4; x++) {
      const dans = y >= ay + r || Math.hypot(x + 0.5 - (ax + r), y + 0.5 - (ay + r)) <= r;
      const bord = y >= ay + r ? (x < ax || x >= ax + al) : Math.hypot(x + 0.5 - (ax + r), y + 0.5 - (ay + r)) <= r + 4 && !dans;
      if (bord) t.poser(x, y, 'pierre', (Math.floor(Math.atan2(y - ay - r, x - ax - r) * 6) % 2 ? 4 : 3));
    }
    porteRue(t, ax, ay, al, 70, { arc: true, graine: 846 });
    for (let x = ax + 1; x < ax + al - 1; x++) t.poser(x, H - 1, 'braise', 3 + (hachage(x, 1, 847) > 0.6 ? 1 : 0));
    for (let x = ax + 38; x < ax + 42; x++) for (let y = ay + 24; y < H - 2; y++) t.poser(x, y, 'braise', y % 4 ? 2 : 3);   // la fente entre les deux vantaux
    // une petite fenêtre rougeoyante à droite
    fenetreRue(t, 130, H - 58, 16, 18, true, false);
    for (let y = H - 57; y < H - 41; y++) for (let x = 131; x < 145; x++) if (t.mat(x, y) === 'vitre') t.poser(x, y, 'braise', 2 + ((x + y) % 3 === 0 ? 1 : 0));
    // l'enseigne : une potence de fer et l'enclume découpée dans une planche
    for (let x = 8; x < 40; x++) { t.poser(x, 46, 'fer', 3); t.poser(x, 47, 'fer', 1); }
    for (let k = 0; k < 12; k++) t.poser(8 + k, 46 + k, 'fer', 2);
    planche(t, 16, 52, 22, 14, 'chene', { graine: 848 });
    for (const [x, y, l] of [[20, 55, 14], [24, 57, 6], [23, 59, 8], [21, 61, 12]]) for (let k = 0; k < l; k++) t.poser(x + k, y, 'fer', 1);
    t.contour(); t.texture(scene, 'rueForgeHD');
    // Le jour, les vantaux sont ouverts : on voit le foyer, l'enclume et la lueur du feu
    const j = toile(L, H);
    for (let i = 0; i < t.c.length; i++) { j.c[i] = t.c[i]; j.m[i] = t.m[i]; j.k[i] = t.k[i]; }
    for (let y = ay; y < H; y++) for (let x = ax; x < ax + al; x++) {
      if (y < ay + r && Math.hypot(x + 0.5 - (ax + r), y + 0.5 - (ay + r)) > r) continue;
      const feu = Math.hypot(x + 0.5 - (ax + 22), (y + 0.5 - (H - 16)) * 1.4);
      j.poser(x, y, feu < 10 ? 'braise' : 'pierre', feu < 10 ? 5 - Math.floor(feu / 2.5) : y > H - 6 ? 1 : feu < 22 ? 1 : 0);
    }
    for (let x = ax + 44; x < ax + 64; x++) { j.poser(x, H - 18, 'fer', 4); j.poser(x, H - 17, 'fer', 2); }   // l'enclume
    for (let y = H - 16; y < H - 4; y++) for (let x = ax + 51; x < ax + 57; x++) j.poser(x, y, 'fer', 1);
    for (const vx of [ax - 14, ax + al + 2]) planche(j, vx, ay + 6, 12, 64, 'cheneSombre', { horizontale: false, graine: vx });   // les vantaux rabattus
    j.contour(); j.texture(scene, 'rueForgeHD_jour');
  }

  // --- La Banque Centrale Goyenne : pierre de taille, deux colonnes, fronton à la pièce d'or ---
  {
    const L = 200, H = 176, t = toile(L, H);
    moellons(t, 10, 50, L - 20, H - 50, 850, 'taille', 16);
    // le fronton triangulaire et son médaillon d'or
    for (let y = 18; y < 50; y++) { const v = (y - 18) / 32, xa = Math.round(100 - v * 96), xb = Math.round(100 + v * 96); for (let x = xa; x <= xb; x++) t.poser(x, y, 'taille', x < xa + 2 ? 5 : y > 46 ? 1 : 3); }
    t.forme('or', ellipsoide(100, 36, 8, 8), { decalage: 0.3 });
    for (let x = 97; x <= 103; x++) t.poser(x, 36, 'or', 1);
    for (let y = 33; y <= 39; y++) t.poser(100, y, 'or', 1);
    for (let x = 2; x < L - 2; x++) { t.poser(x, 50, 'taille', 5); t.poser(x, 51, 'taille', 2); t.poser(x, 52, 'taille', 1); }   // la corniche
    // deux colonnes cannelées, leurs chapiteaux
    for (const cx of [52, 148]) {
      for (let y = 56; y < H - 10; y++) for (let x = cx - 7; x <= cx + 7; x++) t.poser(x, y, 'taille', (x - cx + 7) % 4 === 0 ? 2 : x < cx - 3 ? 5 : x > cx + 3 ? 2 : 4);
      for (let x = cx - 10; x <= cx + 10; x++) for (const y of [54, 55]) t.poser(x, y, 'taille', y === 54 ? 5 : 2);
    }
    // les hautes fenêtres grillagées, et la lourde porte cloutée d'or
    for (const fx of [20, 162]) { fenetreRue(t, fx, 70, 18, 46, true, false); for (let y = 70; y < 116; y += 6) for (let x = fx; x < fx + 18; x++) t.poser(x, y, 'fer', 2); }
    porteRue(t, 80, H - 62, 40, 52, { arc: true, mat: 'cheneSombre', graine: 851 });
    for (let y = H - 50; y < H - 12; y += 7) for (const x of [84, 96, 103, 115]) t.poser(x, y, 'or', 5);
    // les trois marches
    for (let k = 0; k < 3; k++) for (let x = 64 - k * 6; x < 136 + k * 6; x++) for (let y = H - 10 + k * 3; y < H - 7 + k * 3; y++) t.poser(x, y, 'taille', y === H - 10 + k * 3 ? 5 : 2);
    t.contour(); t.texture(scene, 'rueBanqueHD');
  }

  // --- L'arche du Marché des Mastres : deux piliers coiffés de pierre, un arc au faîte arrondi, une
  // bannière sous la clé ; la place se devine derrière (endormie la nuit, colorée le jour)
  for (const jour of [false, true]) {
    const L = 150, H = 176, t = toile(L, H);
    const r = 44, cx = 75, cy = 76, haut = y => 22 + Math.pow((y - cx) / 75, 2) * 14;   // le dessus, en douce courbe
    t.rampes.toileVive = rampe(jour ? 0xc84a3a : 0x6a2a24); t.rampes.toileVive2 = rampe(jour ? 0x3a6ac0 : 0x24305a); t.rampes.ciel = rampe(jour ? 0x9ac4e8 : 0x141a2a);
    for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) {
      const pilier = x < 22 || x >= L - 22;
      // les chapeaux des piliers : une petite pyramide de pierre et sa boule
      if (pilier && y < 30) {
        const px = x < 22 ? 11 : L - 12, dy = 30 - y;
        if (Math.abs(x + 0.5 - px) <= 12 - dy * 0.55 && y >= 12) t.poser(x, y, 'pierre', x + 0.5 < px ? 4 : 2);
        else if (Math.hypot(x + 0.5 - px, y + 0.5 - 9) < 3.6) t.poser(x, y, 'pierre', x + 0.5 < px ? 5 : 3);
        continue;
      }
      if (!pilier && y < haut(x)) continue;
      const vide = !pilier && ((y >= cy && Math.abs(x + 0.5 - cx) < r) || Math.hypot(x + 0.5 - cx, y + 0.5 - cy) < r);
      if (vide) {
        // derrière l'arche : la place du marché, ses étals rayés
        const etal = y > H - 44 && y < H - 22 && Math.floor((x - 30) / 22) % 2 === 0 && y > H - 44 + Math.abs(((x - 30) % 22) - 11) * 0.45;
        const rayure = Math.floor((x - 30) / 4) % 2;
        t.poser(x, y, etal ? (rayure ? 'toileVive' : 'toileVive2') : y > H - 22 ? 'pierre' : 'ciel', etal ? 3 : y > H - 22 ? (jour ? 3 : 1) : jour ? 3 + (y < 60 ? 1 : 0) : 1);
        continue;
      }
      const ang = Math.atan2(y + 0.5 - cy, x + 0.5 - cx), d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      const claveau = !pilier && y < cy + 2 && d < r + 12 ? (ang + Math.PI) * 6 : -1;
      const joint = claveau >= 0 ? (claveau % 1) < 0.12 || Math.abs(d - r - 12) < 0.8 : (y % 8 === 0 || (x + Math.floor(y / 8) * 7) % 14 === 0);
      let i = joint ? 1 : (claveau >= 0 ? 4 : 3) + Math.round((hachage(Math.floor(x / 7), Math.floor(y / 8), 860) - 0.5) * 1.2);
      if (pilier && (x === 0 || x === L - 22)) i = 5;                              // l'arête éclairée des piliers
      if (pilier && (x === 21 || x === L - 1)) i = 1;
      if (!pilier && y < haut(x) + 2) i = 5;                                         // le bord du faîte arrondi
      if (y > H - 8 && pilier) i = (y === H - 8 ? 5 : 2);                            // le socle
      t.poser(x, y, 'pierre', Math.max(0, Math.min(5, i)));
    }
    for (let y = cy - r - 12; y < cy - r + 2; y++) for (let x = cx - 6; x <= cx + 6; x++) t.poser(x, y, 'pierre', x < cx - 3 ? 5 : 3);   // la clé de voûte
    // la bannière frangée d'or (le nom du marché s'y écrit par-dessus)
    for (let y = cy - r + 4; y < cy - r + 26; y++) for (let x = cx - 30; x <= cx + 30; x++) {
      const pointe = y > cy - r + 20 && Math.abs((x - cx + 60) % 15 - 7) > 7 - (y - (cy - r + 20));
      if (!pointe) t.poser(x, y, 'toileRouge', 3 + (y === cy - r + 4 ? 1 : 0) - (x === cx - 30 || x === cx + 30 ? 1 : 0));
    }
    for (let x = cx - 30; x <= cx + 30; x += 2) t.poser(x, cy - r + 25, 'or', 4);
    t.contour(); t.texture(scene, 'rueArcheHD' + (jour ? '_jour' : ''));
  }

  // --- Le réverbère : un poteau de fer, une lanterne à quatre vitres ---
  {
    const t = toile(24, 90);
    for (let y = 18; y < 90; y++) for (let x = 10; x < 14; x++) t.poser(x, y, 'fer', x === 10 ? 3 : 1);
    for (let x = 4; x < 20; x++) t.poser(x, 88, 'fer', 2);
    for (let y = 2; y < 18; y++) for (let x = 5; x < 19; x++) t.poser(x, y, (x - 5) % 5 === 0 || y === 2 || y === 17 ? 'fer' : 'vitre', (x - 5) % 5 === 0 || y === 2 || y === 17 ? 2 : 4);
    for (let x = 7; x < 17; x++) t.poser(x, 1, 'fer', 3);
    t.contour(); t.texture(scene, 'reverbereHD');
  }
}

// Un petit écriteau de bois peint (ou des lettres gravées), pour qu'on reconnaisse chaque bâtiment
function ecriteauRue(scene, x, y, texte, { taille = 12, couleur = '#2a1608', fond = '#d8bc84', grave = false, angle = 0, profondeur = 8.3 } = {}) {
  const t = scene.add.text(x, y, texte, style(taille, grave ? '#f0cf5a' : couleur, grave ? { fontStyle: 'bold', stroke: '#2a1a08', strokeThickness: 3 } : { fontStyle: 'bold', backgroundColor: fond, padding: { x: 5, y: 2 } })).setOrigin(0.5).setAngle(angle).setDepth(profondeur);
  if (!grave) t.setShadow(1, 1, '#1a0e06', 0, false, true);
  return t;
}

// (v0.65, étape 10c) Toute la rue, posée à partir de x = o, le soir ou le jour. `ici` reçoit les
// choses à regarder et les portes : { regarder(x, y, l, h, texte), porte(x, sol, etiquette, action) }.
// Renvoie la porte du shop et les lumières (fenêtres, réverbères, braises) pour la nuit.
const LARGEUR_RUE = 2960;
const PLACES_RUE = { maison0: 160, impasse: 405, forge: 680, shop: 1320, maison1: 1820, fontaine: 2090, banque: 2360, arche: 2780 };
function construireRue(scene, o, { jour = false, sol = 470, ici }) {
  const G = window.GAME, P = PLACES_RUE, lumieres = [];
  creerRueHD(scene);
  creerDecorPlaceHD(scene);   // (avant la façade : il redessine aussi les tonneaux, qu'elle utilise)
  creerChatRueHD(scene);      // (le banc de la rue)
  for (let k = 0; k < Math.ceil(LARGEUR_RUE / 960); k++) dessinerComte(scene.add.graphics(), o + k * 960, 0, 960, sol, jour ? 0 : 1);
  for (let k = 0; k < Math.ceil(LARGEUR_RUE / 960); k++) scene.add.image(o + k * 960, sol, pavesHD(scene, 960, 70)).setOrigin(0).setScale(2);
  if (!jour) for (let i = 0; i < 70; i++) {
    const e = scene.add.image(o + Math.random() * LARGEUR_RUE, 10 + Math.random() * 150, 'eclat').setScale(0.6 + Math.random() * 0.5);
    scene.tweens.add({ targets: e, alpha: 0.15, duration: 700 + Math.random() * 1200, yoyo: true, repeat: -1 });
  }
  const poser = (cle, cx) => scene.add.image(o + cx, sol + 2, cle).setOrigin(0.5, 1).setScale(2);
  const ouvert = !jour && marcheNoirCeSoir(G);
  poser('rueMaisonHD_0', P.maison0);
  poser('rueImpasseHD', P.impasse);
  poser(jour ? 'rueForgeHD_jour' : 'rueForgeHD', P.forge);
  scene.add.image(o + 990, sol + 30, 'bancRue').setOrigin(0.5, 1).setScale(2.6);
  const f = dessinerFacade(scene, o + P.shop, sol, G.nomShop);
  poser('rueMaisonHD_1', P.maison1);
  scene.add.image(o + P.fontaine, sol + 30, 'fontaineHD').setOrigin(0.5, 1).setScale(2.4);
  poser('rueBanqueHD', P.banque);
  poser(jour ? 'rueArcheHD_jour' : 'rueArcheHD', P.arche);
  for (const x of [560, 1060, 1640, 2200, 2585]) { scene.add.image(o + x, sol + 6, 'reverbereHD').setOrigin(0.5, 1).setScale(2); lumieres.push([o + x, sol - 166, 1.6]); }
  lumieres.push([f.porteX, 400, 2.4], [o + P.forge, sol - 10, 1.8], [o + P.banque, sol - 150, 1.4]);
  // les noms : écriteaux peints, lettres gravées, bannière
  ecriteauRue(scene, o + P.maison0 + 4, sol - 112, 'Les Pommeroy', { taille: 10 });
  ecriteauRue(scene, o + P.impasse - 46, sol - 150, 'Impasse du Corbeau', { taille: 9, angle: -6, fond: '#a88a5a' });
  ecriteauRue(scene, o + P.forge - 128, sol - 186, 'Forge de Thorgal', { taille: 10 });
  ecriteauRue(scene, o + P.maison1 + 26, sol - 112, 'Les Brindeloup', { taille: 10 });
  ecriteauRue(scene, o + P.banque, sol - 254, 'BANQUE CENTRALE GOYENNE', { taille: 12, grave: true });
  ecriteauRue(scene, o + P.arche, sol - 250, 'Marché des Mastres', { taille: 13, grave: true });
  // les flammes de la forge, le jour : des étincelles qui jaillissent
  if (jour) scene.time.addEvent({ delay: 260, loop: true, callback: () => {
    const e = scene.add.rectangle(o + P.forge - 40 + Math.random() * 30, sol - 30, 2, 2, Math.random() < 0.5 ? 0xffd060 : 0xff8020).setDepth(8.2);
    scene.tweens.add({ targets: e, y: e.y - 20 - Math.random() * 30, x: e.x + (Math.random() - 0.5) * 30, alpha: 0, duration: 500 + Math.random() * 400, onComplete: () => e.destroy() });
  } });
  // la lanterne rouge de l'impasse, seulement les soirs où la porte dérobée s'ouvre
  if (ouvert) {
    const l = scene.add.image(o + P.impasse, sol - 66, 'halo').setScale(1).setTint(0xff3020).setAlpha(0.6).setBlendMode(Phaser.BlendModes.ADD).setDepth(9.5);
    scene.tweens.add({ targets: l, alpha: 0.35, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    scene.add.rectangle(o + P.impasse, sol - 66, 6, 9, 0xff4a2a).setDepth(9.6);
    ici.porte(o + P.impasse, sol, '🏮 La porte dérobée', 'MarcheNoir');
  }
  // ce qu'on regarde
  ici.regarder(o + 10, 160, 300, 310, jour ? 'Madame Pommeroy bat ses tapis à la fenêtre. Elle te salue d\'un hochement de tête.' : Phaser.Utils.Array.GetRandom(['La maison des Pommeroy. Leur chien ronfle derrière la porte.', 'Une bougie veille chez la vieille Berthe Pommeroy. Elle tricote, comme chaque soir.']));
  ici.regarder(o + P.impasse - 90, 240, 180, 230, ouvert ? "Une lanterne rouge brûle au fond de l'impasse du Corbeau. La porte dérobée est ouverte ce soir..." : jour ? "L'impasse du Corbeau. Même en plein jour, le fond reste dans l'ombre." : G.visiteMarcheNoir !== undefined ? "L'impasse est noire. La lanterne rouge est éteinte ce soir." : "Une impasse si sombre qu'on n'en voit pas le fond. On dit qu'une porte basse s'y ouvre, certains soirs.");
  ici.regarder(o + P.forge - 180, 160, 360, 310, jour ? 'Le marteau de Thorgal sonne sur l\'enclume. Pour lui acheter quelque chose, c\'est à son étal, au marché.' : "La forge de Thorgal. Les braises rougeoient encore derrière les vantaux ; on l'entend ronfler à l'étage.");
  ici.regarder(o + P.shop - 220, 200, 440, 270, `${G.nomShop}, ton shop. ${['Une humble chaumière', 'Une jolie maison', 'Une belle maison', 'La plus belle maison du village'][niveauFacade(G)]}.`);
  ici.regarder(o + P.maison1 - 130, 160, 260, 310, jour ? 'Le petit Brindeloup te regarde passer : il rêve de partir à l\'aventure.' : Phaser.Utils.Array.GetRandom(["Chez les Brindeloup. On s'y dispute à voix basse : l'aîné veut partir à l'aventure.", 'Les volets sont clos chez les Brindeloup. Tout le monde dort.']));
  ici.regarder(o + P.fontaine - 80, 360, 160, 110, jour ? 'La fontaine chante. Pour y jeter une pièce, c\'est celle de la place du marché.' : 'La fontaine murmure dans la nuit. Au fond du bassin, des pièces luisent sous la lune.');
  ici.regarder(o + P.banque - 200, 120, 400, 350, jour ? 'La Banque Centrale Goyenne. Des nains en redingote montent les marches, un registre sous le bras.' : 'La Banque Centrale Goyenne. Une lumière brûle encore : les nains comptent, même la nuit.');
  ici.porte(o + P.banque, sol, 'Entrer', 'Banque');
  ici.regarder(o + P.arche - 150, 120, 300, 350, jour ? "L'arche du Marché des Mastres. On entend déjà les marchands crier leurs prix." : "L'arche du Marché des Mastres. La place dort ; les étals rouvriront à l'aube.");
  if (jour) ici.porte(o + P.arche, sol, 'Le marché ▶', 'Marche');
  return { porteShop: { x: f.porteX, y: f.porteY }, lumieres };
}
