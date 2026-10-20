// (v1.28, planche 52 validée) La chapelle du Rempart et l'hospice de la Confrérie, peints comme les maisons de la
// rue (toile ×2, posée par le bas) ; le terrain vague où ils se bâtissent ; les soldats de l'escouade.
function creerConfrerieHD(s) {
  if (s.textures.exists('rueChapelleHD')) return;
  const toile = (l, h) => { const t = toileDecor(l, h); Object.assign(t.rampes, RAMPES_RUE, {
    vBleu: [0x0a1430, 0x14285a, 0x1e3c8a, 0x3a64c0, 0x6a94e8, 0xb0d0ff], vRouge: [0x300808, 0x601010, 0x9a1c18, 0xd03a28, 0xf07050, 0xffb090],
    vVert: [0x082010, 0x10401c, 0x1c6a30, 0x30984a, 0x60c070, 0xa8e8a8], vOr: [0x3a2408, 0x7a5010, 0xc08a20, 0xf0c040, 0xffe080, 0xfff6d0],
    bronze: [0x2a1608, 0x4e2c10, 0x7a4a1c, 0xa8702c, 0xd09a48, 0xf0cc80], tabardB: [0x0e1a36, 0x1a2c58, 0x2a4a8a, 0x3a62aa, 0x5a82c8, 0x8aaae0],
    blancE: [0x6a6a70, 0x9a9aa0, 0xbcbcc4, 0xd8d8de, 0xececf0, 0xffffff] }); return t; };
  // une ogive (arc brisé) : dedans ou pas, pour une baie de largeur l dont la pointe est en y0
  const ogive = (x0, y0, l, h, x, y) => { const R = l * 0.85, cx = x0 + l / 2, dx = R - l / 2, ys = y0 + Math.sqrt(R * R - dx * dx);
    if (x < x0 || x >= x0 + l || y < y0 || y >= y0 + h) return false; if (y >= ys) return true;
    return Math.hypot(x + 0.5 - (cx - dx), y + 0.5 - ys) <= R && Math.hypot(x + 0.5 - (cx + dx), y + 0.5 - ys) <= R; };
  // un vitrail : des losanges de couleur sertis de plomb
  const vitrail = (t, x0, y0, l, h, graine, lueur = 1) => { const mats = ['vBleu', 'vRouge', 'vBleu', 'vOr', 'vVert', 'vBleu'];
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + l; x++) { if (!ogive(x0, y0, l, h, x, y)) continue;
      const u = (x - x0) + (y - y0), v = (x - x0) - (y - y0), plomb = ((u % 5) + 5) % 5 === 0 || ((v % 5) + 5) % 5 === 0;
      const m = mats[Math.floor(hachage(Math.floor(u / 5), Math.floor(v / 5), graine) * mats.length)];
      t.poser(x, y, plomb ? 'fer' : m, plomb ? 1 : Math.min(5, 2 + lueur + (y < y0 + h * 0.3 ? 1 : 0) - (hachage(x, y, graine) < 0.15 ? 1 : 0))); }
    for (let y = y0; y < y0 + h; y++) for (let x = x0 - 2; x < x0 + l + 2; x++) if (!ogive(x0, y0, l, h, x, y) && (ogive(x0 - 2, y0 - 2, l + 4, h + 2, x, y))) t.poser(x, y, 'taille', 5);
  };
  // la tour de la Confrérie et son soleil, peints sur un fond bleu (bannière, écusson)
  const tourConfrerie = (t, cx, y0, k = 1) => { for (const [dx, dy, w, h] of [[-3, 0, 1, 1], [-1, 0, 1, 1], [1, 0, 1, 1], [3, 0, 1, 1], [-3, 1, 7, 1], [-2, 2, 5, 7]]) for (let y = 0; y < h * k; y++) for (let x = 0; x < w * k; x++) t.poser(cx + dx * k + x, y0 + dy * k + y, 'blancE', x === 0 ? 5 : 3);
    t.poser(cx, y0 + 5 * k, 'tabardB', 1); t.poser(cx, y0 + 6 * k, 'tabardB', 1); };

  // --- La chapelle du Rempart : un pignon de pierre de taille, la rosace, le portail en ogive, le clocher-mur et sa cloche ---
  for (const jour of [false, true]) {
    const L = 150, H = 236, t = toile(L, H), sol = H, base = 104, apex = 46, cx = 75;
    // le pignon : les murs, puis le triangle sous le toit
    for (let y = apex; y < sol; y++) { const v = y < base ? (y - apex) / (base - apex) : 1, xa = Math.round(cx - v * 67), xb = Math.round(cx + v * 67);
      for (let x = xa; x <= xb; x++) { const rang = Math.floor((y - apex) / 8), dec = (rang % 2) * 8, joint = (y - apex) % 8 === 0 || (x + dec) % 16 === 0;
        let i = joint ? 1 : 3 + Math.round((hachage(Math.floor((x + dec) / 16), rang, 900) - 0.5) * 1.6) + ((y - apex) % 8 === 1 ? 1 : 0) - (fbm(x * 0.05, y * 0.04, 902) > 0.62 ? 1 : 0);
        if (y > sol - 16 && hachage(x, y, 901) < 0.3 + (y - sol + 16) * 0.03) i--;   // (la crasse au pied du mur)
        t.poser(x, y, 'taille', Math.max(0, Math.min(5, i))); } }
    // les rampants du toit d'ardoise qui débordent du pignon
    for (let y = apex - 6; y < base + 4; y++) { const v = (y - apex + 6) / (base - apex + 2); for (const sens of [-1, 1]) for (let e = 0; e < 7; e++) { const xx = cx + sens * Math.round(v * 70) + (sens < 0 ? -e + 3 : e - 3);
      t.poser(xx, y, 'ardoiseToit', e === 0 ? 5 : e > 4 ? 0 : 3 - Math.floor(e / 2)); } }
    // les contreforts aux deux coins, à ressauts
    for (const [x0, l] of [[6, 14], [L - 20, 14]]) for (let y = base + 6; y < sol; y++) { const ressaut = y > sol - 50 ? 2 : 0; for (let x = x0 - ressaut; x < x0 + l + ressaut; x++) {
      const joint = (y - base) % 8 === 0; t.poser(x, y, 'taille', joint ? 1 : x <= x0 - ressaut + 1 ? 5 : x >= x0 + l + ressaut - 2 ? 1 : 4); }
      for (let x = x0 - 3; x < x0 + l + 3; x++) { t.poser(x, sol - 51, 'taille', 5); t.poser(x, sol - 50, 'taille', 2); }
      for (let k = 0; k < 6; k++) for (let x = x0 + k; x < x0 + l - k; x++) t.poser(x, base + 6 - k, 'taille', k === 5 ? 5 : 3); }
    // le clocher-mur sur la pointe du pignon : une arcade, la cloche de bronze, le soleil d'or tout en haut
    { const x0 = cx - 17, x1 = cx + 17, y0 = 20;
      for (let y = y0; y < apex + 10; y++) for (let x = x0; x <= x1; x++) { const joint = (y - y0) % 7 === 0 || (x + Math.floor((y - y0) / 7) * 5) % 11 === 0;
        t.poser(x, y, 'taille', joint ? 2 : x <= x0 + 1 ? 5 : x >= x1 - 1 ? 2 : 4); }
      for (let k = 0; k < 6; k++) for (let x = x0 - 3 + k * 2; x <= x1 + 3 - k * 2; x++) t.poser(x, y0 - k, 'taille', k === 0 ? 2 : k === 5 ? 5 : 4);   // (le petit toit à deux pentes)
      for (let y = y0 + 6; y < apex + 4; y++) for (let x = x0 + 6; x <= x1 - 6; x++) if (ogive(x0 + 6, y0 + 6, 23, apex - y0 - 2, x, y)) t.poser(x, y, jour ? 'vitreNoire' : 'vitreNoire', jour ? 3 : 1);
      for (let x = x0 + 5; x <= x1 - 5; x++) t.poser(x, y0 + 10, 'cheneSombre', 3);   // (la poutre du joug)
      t.forme('bronze', (x, y) => { const dy = y + 0.5 - (y0 + 12), larg = 3.5 + dy * 0.45 + (dy > 10 ? 2 : 0); return dy >= 0 && dy <= 13 && Math.abs(x + 0.5 - cx) <= larg ? [(x + 0.5 - cx) / (larg + 1), -0.3 + dy / 30, 0.8] : null; });
      for (let x = cx - 1; x <= cx; x++) t.poser(x, y0 + 26, 'bronze', 1);   // (le battant)
      // le soleil d'or de la Confrérie, au faîte
      t.forme('or', (x, y) => { const r = Math.hypot(x + 0.5 - cx, y + 0.5 - (y0 - 10)); return r <= 3.4 ? [(x + 0.5 - cx) / 3.4, (y + 0.5 - y0 + 10) / 3.4, 0.8] : null; });
      for (let a = 0; a < 8; a++) { const an = a * Math.PI / 4; for (let d = 4.5; d <= 6.5; d++) t.poser(Math.round(cx - 0.5 + Math.cos(an) * d), Math.round(y0 - 10.5 + Math.sin(an) * d), 'or', 4); }
      for (let y = y0 - 5; y < y0 - 1; y++) t.poser(cx, y, 'fer', 2); }
    // la rosace : un rond de vitraux, huit rayons de pierre
    { const rx = cx, ry = 108, R = 19;
      for (let y = ry - R - 4; y <= ry + R + 4; y++) for (let x = rx - R - 4; x <= rx + R + 4; x++) { const d = Math.hypot(x + 0.5 - rx, y + 0.5 - ry), a = Math.atan2(y + 0.5 - ry, x + 0.5 - rx);
        if (d > R + 4) continue; if (d > R) { t.poser(x, y, 'taille', d > R + 3 ? 1 : (y < ry ? 5 : 3)); continue; }
        const rayon = Math.abs(((a / (Math.PI / 4)) % 1 + 1) % 1 - 0.5) > 0.44 && d > 5, anneau = Math.abs(d - 11) < 1;
        if (rayon || anneau || d < 3) { t.poser(x, y, 'taille', d < 3 ? 5 : 4); continue; }
        const sect = ((Math.floor((a + Math.PI) / (Math.PI / 4)) % 8) + 8) % 8, mat = d < 11 ? ['vRouge', 'vOr'][sect % 2] : ['vBleu', 'vVert', 'vBleu', 'vRouge'][sect % 4];
        t.poser(x, y, mat, Math.min(5, (jour ? 2 : 3) + (y < ry - 4 ? 1 : 0) - (Math.abs(d - 7) < 0.6 || Math.abs(d - 16) < 0.6 ? 2 : 0))); } }
    // deux hautes lancettes de vitrail
    for (const lx of [32, L - 44]) vitrail(t, lx, 140, 12, 50, 905 + lx, jour ? 0 : 1);
    // deux bannières bleues de la Confrérie, frangées d'or, la tour blanche et le soleil
    for (const bx of [24, L - 38]) { for (let y = 92; y < 128; y++) for (let x = bx; x < bx + 14; x++) { const pointe = y > 122 && Math.abs(x + 0.5 - bx - 7) > 7 - (y - 122) * 1.2; if (!pointe) t.poser(x, y, 'tabardB', x === bx ? 4 : x === bx + 13 ? 1 : 2 + (hachage(x, Math.floor(y / 3), 906) < 0.2 ? 1 : 0)); }
      for (let x = bx - 2; x < bx + 16; x++) { t.poser(x, 90, 'fer', 3); t.poser(x, 91, 'fer', 1); }
      tourConfrerie(t, bx + 7, 102, 1); t.poser(bx + 7, 98, 'or', 5); t.poser(bx + 6, 98, 'or', 4); t.poser(bx + 8, 98, 'or', 4); t.poser(bx + 7, 97, 'or', 4); }
    // le portail en ogive : l'archivolte à trois rangs de claveaux, la porte cloutée
    { const px = cx - 20, pl = 40, py = 158, ph = sol - py;
      for (let r = 3; r >= 1; r--) for (let y = py - r * 4; y < sol; y++) for (let x = px - r * 4; x < px + pl + r * 4; x++) if (ogive(px - r * 4, py - r * 4, pl + r * 8, ph + r * 4, x, y) && !ogive(px - (r - 1) * 4, py - (r - 1) * 4, pl + (r - 1) * 8, ph + (r - 1) * 4, x, y)) {
        const a = Math.atan2(y - py - 24, x - cx), joint = y < py + 24 ? Math.abs(((a + Math.PI) * 6) % 1) < 0.1 : (y - py) % 8 === 0;
        const bord = !ogive(px - r * 4 + 1, py - r * 4 + 1, pl + r * 8 - 2, ph + r * 4, x, y);
        t.poser(x, y, 'taille', joint ? 1 : bord ? (x < cx ? 5 : 2) : [0, 4, 2, 4][r] - (x > cx + 6 ? 1 : 0)); }
      for (let y = py; y < sol; y++) for (let x = px; x < px + pl; x++) if (ogive(px, py, pl, ph, x, y)) { const lame = Math.floor((x - px) / 7), bord = (x - px) % 7 === 0 || x === cx;
        t.poser(x, y, 'cheneSombre', bord ? 1 : 3 + Math.round((hachage(lame, Math.floor(y / 9), 907) - 0.5) * 1.4)); }
      for (const yy of [py + 22, py + 52]) for (let x = px + 2; x < px + pl - 2; x++) if (ogive(px, py, pl, ph, x, yy)) { t.poser(x, yy, 'fer', 3); t.poser(x, yy + 1, 'fer', 1); }
      for (let y = py + 12; y < sol - 4; y += 8) for (const x of [px + 4, cx - 4, cx + 3, px + pl - 5]) if (ogive(px, py, pl, ph, x, y)) t.poser(x, y, 'fer', 5);
      for (const x of [cx - 4, cx + 3]) { t.forme('fer', (xx, yy) => Math.abs(Math.hypot(xx + 0.5 - x - 0.5, yy + 0.5 - (py + 40)) - 2.5) < 0.8 ? [0, 0, 1] : null); }
      // le tympan : la tour de la Confrérie, sculptée dans la pierre
      for (let y = py + 6; y < py + 20; y++) for (let x = cx - 8; x <= cx + 8; x++) if (ogive(px + 8, py + 4, pl - 16, 20, x, y)) t.poser(x, y, 'taille', 2);
      tourConfrerie(t, cx, py + 9, 1); }
    // les trois marches du parvis
    for (let k = 0; k < 3; k++) for (let x = cx - 34 - k * 5; x < cx + 34 + k * 5; x++) for (let y = sol - 9 + k * 3; y < sol - 6 + k * 3; y++) t.poser(x, y, 'taille', y === sol - 9 + k * 3 ? 5 : 2);
    t.contour(); t.texture(s, 'rueChapelleHD' + (jour ? '_jour' : ''));
  }

  // --- L'hospice de la Confrérie : une longue maison blanchie à la chaux, à colombages, un étage, l'écusson bleu sur la porte ---
  {
    const L = 190, H = 156, t = toile(L, H), rdc = 96;
    moellons(t, 6, rdc, L - 12, H - rdc, 920);
    // l'étage blanchi (un enduit propre : la Confrérie l'entretient)
    for (let y = 48; y < rdc; y++) for (let x = 8; x < L - 8; x++) t.poser(x, y, 'platre', 4 + Math.round((fbm(x * 0.06, y * 0.06, 921) - 0.5) * 1.2) - (y > rdc - 4 ? 1 : 0));
    for (const x of [8, 52, 93, 134, L - 13]) planche(t, x, 48, 5, rdc - 48, 'cheneSombre', { horizontale: false, graine: 922 + x });
    for (const [x0, x1] of [[13, 52], [138, L - 13]]) for (let k = 0; k < 40; k++) { const x = Math.round(x0 + k * (x1 - x0) / 40), y = Math.round(rdc - 4 - k * (rdc - 52) / 40); for (let e = 0; e < 3; e++) t.poser(x + e, y, 'cheneSombre', e === 0 ? 4 : 2); }   // (les écharpes en croix de Saint-André)
    planche(t, 4, rdc - 5, L - 8, 6, 'cheneSombre', { graine: 923, noeuds: 3 });
    planche(t, 4, 44, L - 8, 5, 'cheneSombre', { graine: 924, noeuds: 2 });
    toitRue(t, 0, L - 1, 6, 48, 'tuile', 925);
    // deux lucarnes dans le toit, et la cheminée
    for (const lx of [44, 128]) { for (let y = 14; y < 40; y++) for (let x = lx; x < lx + 20; x++) t.poser(x, y, 'platre', x === lx || x === lx + 19 ? 2 : 4);
      for (let k = 0; k < 8; k++) for (let x = lx - 3 + k; x < lx + 23 - k; x++) t.poser(x, 14 - k, 'tuile', k === 7 ? 5 : 3);
      fenetreRue(t, lx + 4, 20, 12, 14, lx === 44, false); }
    moellons(t, 150, 0, 16, 26, 926, 'pierre', 6);
    // les fenêtres de l'étage : on veille sur les blessés (une ou deux bougies)
    for (const [fx, lum] of [[24, true], [66, false], [108, true], [150, true]]) fenetreRue(t, fx, 56, 16, 22, lum, true);
    // au rez-de-chaussée : la grande porte à deux battants, et quatre fenêtres
    porteRue(t, 80, H - 58, 30, 58, { arc: true, mat: 'chene', graine: 927 });
    for (let y = H - 58; y < H; y++) t.poser(95, y, 'cheneSombre', 1);
    for (const [fx, lum] of [[18, true], [46, false], [124, true], [152, false]]) fenetreRue(t, fx, H - 46, 18, 22, lum, false);
    // l'écusson de la Confrérie au-dessus de la porte, bordé d'argent
    { const ex = 95, ey = H - 82; t.forme('blancE', (x, y) => { const dx = Math.abs(x + 0.5 - ex), dy = y + 0.5 - ey; return dy >= 0 && dy <= 20 && dx <= 10 - Math.max(0, dy - 10) * 0.9 ? [0, 0, 1] : null; });
      t.forme('tabardB', (x, y) => { const dx = Math.abs(x + 0.5 - ex), dy = y + 0.5 - ey - 1.5; return dy >= 0 && dy <= 16.5 && dx <= 8.5 - Math.max(0, dy - 8) * 0.95 ? [0, -0.4, 0.9] : null; });
      tourConfrerie(t, ex, ey + 6, 1); t.poser(ex, ey + 3, 'or', 5); t.poser(ex - 1, ey + 3, 'or', 4); t.poser(ex + 1, ey + 3, 'or', 4); }
    // la lanterne à côté de la porte, sur sa potence
    for (let x = 116; x < 126; x++) t.poser(x, H - 62, 'fer', 2);
    for (let y = H - 58; y < H - 46; y++) for (let x = 120; x < 127; x++) t.poser(x, y, (x === 120 || x === 126 || y === H - 58 || y === H - 47) ? 'fer' : 'vitre', (x === 120 || x === 126 || y === H - 58 || y === H - 47) ? 1 : 4);
    t.contour(); t.texture(s, 'rueHospiceHD');
  }

  // --- Le terrain vague de la Confrérie : une palissade basse, des herbes folles, des pierres, un écriteau ---
  { const L = 300, H = 60, t = toile(L, H);
    for (let x = 0; x < L; x++) for (let y = 44; y < H; y++) t.poser(x, y, 'pierre', 1 + (hachage(x >> 2, y >> 2, 940) > 0.7 ? 1 : 0));   // (la terre battue)
    for (let k = 0; k < 70; k++) { const x = Math.floor(hachage(k, 1, 941) * L), h = 4 + Math.floor(hachage(k, 2, 941) * 12); for (let y = 0; y < h; y++) t.poser(x + (y > h / 2 ? 0 : Math.round((hachage(k, 3, 941) - 0.5) * 2)), 50 - y, 'chene', 1); }   // (les herbes sèches)
    for (const [x, y, r] of [[40, 50, 5], [120, 52, 4], [200, 49, 6], [260, 52, 4]]) t.forme('pierre', ellipsoide(x, y, r + 2, r), { decalage: 0.3 });
    for (let x = 4; x < L - 4; x += 16) planche(t, x, 22 + (x % 32 ? 2 : 0), 6, 26 - (x % 32 ? 2 : 0), 'chene', { horizontale: false, graine: 942 + x, noeuds: 0 });   // (les piquets)
    for (const y of [28, 40]) planche(t, 2, y, L - 4, 4, 'chene', { graine: 943 + y, noeuds: 3 });   // (les deux lisses)
    t.contour(); t.texture(s, 'terrainConfrerie'); }
}

// Les six soldats de l'escouade : tabard bleu au soleil d'or, des peuples de la lumière
const SOLDATS_ESCOUADE = [['humain', 'Sergent Aubin Roncevaux', 0x5a3a1a], ['nain', 'Brokk Ferpoing', 0x8a4a1a], ['elfe', 'Ilwen Clairebrise', 0xe8d890], ['hobbit', 'Pippin Rondelet', 0x6a4a2a], ['panda', 'Wen Bambou-Sage', 0x201c1c], ['humain', 'Odette Vifargent', 0x2a1a10]];
SOLDATS_ESCOUADE.forEach(([race, nom, cheveux], i) => { FIGURANTS['soldat' + i] = { race, nom, costume: 'garde', habit: 0x2a4a8a, cheveux, niveau: 2, feminin: i === 5 || i === 2 }; });
