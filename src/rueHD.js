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

  // --- L'impasse : deux murs qui se resserrent, l'ombre, une porte basse tout au fond ---
  {
    const L = 120, H = 176, t = toile(L, H);
    for (let y = 30; y < H; y++) for (let x = 0; x < L; x++) {
      const fond = x > 30 && x < 90;
      if (fond) {
        // le fond de l'impasse : des pierres noyées dans l'ombre, plus sombres vers le haut
        const i = (y % 7 === 0 || (x + Math.floor(y / 7) * 5) % 11 === 0) ? 0 : 1 + (y > H - 60 ? 1 : 0);
        t.poser(x, y, 'pierre', i);
      } else {
        const rangee = Math.floor(y / 8), bx = (x + (rangee % 2) * 6) % 13;
        t.poser(x, y, 'pierre', bx === 0 || y % 8 === 0 ? 0 : 2 + (hachage(Math.floor(x / 13), rangee, 830) > 0.7 ? 1 : 0) - (x > 24 && x < 96 ? 1 : 0));
      }
    }
    // les arêtes des deux murs qui reçoivent un peu de lune
    for (let y = 30; y < H; y++) { t.poser(30, y, 'pierre', 4); t.poser(31, y, 'pierre', 3); t.poser(89, y, 'pierre', 1); }
    // la porte basse au fond, et sa grille
    porteRue(t, 48, H - 44, 24, 44, { arc: true, graine: 831 });
    for (let x = 54; x < 66; x += 3) for (let y = H - 36; y < H - 28; y++) t.poser(x, y, 'fer', 2);
    // un bout de toit de chaque côté, en haut
    toitRue(t, -40, 40, 8, 34, 'tuile', 832); toitRue(t, 80, 160, 12, 34, 'ardoiseToit', 833);
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

  // --- L'arche du Marché des Mastres : la place dort derrière, une bannière pend sous la clé ---
  {
    const L = 160, H = 176, t = toile(L, H);
    const r = 46, cx = 80, cy = 72;
    for (let y = 10; y < H; y++) for (let x = 0; x < L; x++) {
      const vide = (y >= cy && Math.abs(x + 0.5 - cx) < r) || Math.hypot(x + 0.5 - cx, y + 0.5 - cy) < r;
      if (vide) {
        // derrière l'arche : la place endormie, la silhouette des étals sous la lune
        const etal = y > H - 40 && y < H - 22 && Math.floor((x - 40) / 26) % 2 === 0 && y > H - 40 + Math.abs(((x - 40) % 26) - 13) * 0.4;
        t.poser(x, y, etal ? 'toileRouge' : 'vitreNoire', etal ? 1 : y > H - 22 ? 2 : 1);
        continue;
      }
      const ang = Math.atan2(y + 0.5 - cy, x + 0.5 - cx), d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      const claveau = y < cy + 2 && d < r + 14 ? Math.floor((ang + Math.PI) * 5) : -1;
      const joint = claveau >= 0 ? Math.abs(((ang + Math.PI) * 5) % 1) < 0.1 : (y % 8 === 0 || (x + Math.floor(y / 8) * 7) % 14 === 0);
      t.poser(x, y, 'pierre', joint ? 1 : (claveau >= 0 ? 4 : 3) + Math.round((hachage(Math.floor(x / 7), Math.floor(y / 8), 860) - 0.5) * 1.2));
    }
    // la clé de voûte, et la corniche en haut
    for (let y = cy - r - 14; y < cy - r + 2; y++) for (let x = cx - 6; x <= cx + 6; x++) t.poser(x, y, 'pierre', x < cx - 3 ? 5 : 3);
    for (let x = 0; x < L; x++) { t.poser(x, 10, 'pierre', 5); t.poser(x, 11, 'pierre', 2); }
    // la bannière rouge frangée d'or
    for (let y = cy - r + 4; y < cy - r + 26; y++) for (let x = cx - 26; x <= cx + 26; x++) {
      const pointe = y > cy - r + 20 && Math.abs((x - cx) % 13) > 6 - (y - (cy - r + 20));
      if (!pointe) t.poser(x, y, 'toileRouge', 3 + (y === cy - r + 4 ? 1 : 0) - (x === cx - 26 || x === cx + 26 ? 1 : 0));
    }
    for (let x = cx - 26; x <= cx + 26; x += 2) t.poser(x, cy - r + 25, 'or', 4);
    t.contour(); t.texture(scene, 'rueArcheHD');
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
