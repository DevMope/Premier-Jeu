// (v1.29, planche 53 validée) Le repaire sous le comptoir : la cave de contrebande (une voûte de pierre sous
// l'arrière-boutique, peinte comme la cave du marché noir), la trappe ouverte dans le plancher, le tapis roulé ;
// et Fil-de-Fer, le gamin des rues qui glisse les billets.
function creerRepaireHD(s) {
  if (s.textures.exists('caveRepaire')) return;
  creerCaveHD(s);
  const R = { roche: [0x120c10, 0x21181c, 0x31252a, 0x433636, 0x584844, 0x6e5c52], tailleC: [0x1a1416, 0x2c2426, 0x40363a, 0x564a4a, 0x6c5e5a, 0x86766c],
    terreCave: [0x140e0c, 0x221812, 0x32241a, 0x443222, 0x56402c, 0x6a5038], lueur: [0x5a3010, 0x8a5018, 0xb87820, 0xe0a030, 0xf4c860, 0xfff0b0] };
  const toile = (l, h) => { const t = toileDecor(l, h); Object.assign(t.rampes, R); return t; };
  { const L = 480, H = 270, t = toile(L, H), sol = 204, cx = 240;
    const dansArc = (x, y) => ((x + 0.5 - cx) / 226) ** 2 + ((y + 0.5 - sol) / 186) ** 2 <= 1;
    for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) {
      if (y >= sol) {   // le sol de terre battue, en fuite, des traces de caisses traînées
        const u = (y - sol) / (H - sol), rang = Math.floor(Math.pow(u, 0.7) * 7);
        t.poser(x, y, 'terreCave', 2 + (u > 0.5 ? 1 : 0) + (hachage(Math.floor(x / (4 + u * 10)), rang, 950) > 0.8 ? 1 : 0) - (hachage(x, y, 951) < 0.1 ? 1 : 0) - (Math.abs(x - 110 - (y - sol) * 0.3) < 1 ? 1 : 0)); continue; }
      if (dansArc(x, y)) {   // le mur du fond : de gros moellons, humides en bas
        const rang = Math.floor((y - 20) / 9), dec = (rang % 2) * 9, joint = (y - 20) % 9 === 0 || (x + dec) % 18 === 0;
        let i = joint ? 0 : 2 + Math.round((hachage(Math.floor((x + dec) / 18), rang, 952) - 0.5) * 1.6) + ((y - 20) % 9 === 1 ? 1 : 0);
        if (y > sol - 30 && fbm(x * 0.06, y * 0.1, 953) > 0.55) i--;
        t.poser(x, y, 'tailleC', Math.max(0, Math.min(5, i))); continue; }
      // la voûte en berceau, vue de face : des rangs de claveaux qui fuient vers le mur du fond
      const d = Math.sqrt(((x + 0.5 - cx) / 226) ** 2 + ((y + 0.5 - sol) / 186) ** 2), a = Math.atan2(y + 0.5 - sol, (x + 0.5 - cx) * 186 / 226);
      const anneau = Math.floor((d - 1) * 14), joint = Math.abs(((a + Math.PI) * 9) % 1) < 0.07 + (d - 1) * 0.2 || Math.abs(((d - 1) * 14) % 1) < 0.12;
      t.poser(x, y, 'roche', joint ? 0 : Math.max(1, 3 - Math.floor((d - 1) * 4) + (hachage(Math.floor((a + Math.PI) * 9), anneau, 954) > 0.7 ? 1 : 0))); }
    // la trappe, là-haut, dans la voûte : un carré de lumière chaude, le bord des planches
    const tx = 64, ty = 6, tl = 44, th = 14;
    for (let y = ty - 3; y < ty + th + 3; y++) for (let x = tx - 3; x < tx + tl + 3; x++) { const bord = y < ty || y >= ty + th || x < tx || x >= tx + tl;
      t.poser(x, y, bord ? 'cheneSombre' : 'lueur', bord ? (y < ty ? 3 : 1) : 3 + (y < ty + 4 ? 1 : 0) + (hachage(x, 0, 955) > 0.85 ? 1 : 0)); }
    for (let x = tx; x < tx + tl; x += 9) for (let y = ty; y < ty + th; y++) t.poser(x, y, 'cheneSombre', 2);   // (les solives du plancher, au-dessus)
    // l'échelle, de la trappe jusqu'au sol, un peu penchée
    const echelle = (k, y) => tx + 6 + k * 26 + (y - ty) * 0.12;
    for (let y = ty + 2; y < sol + 22; y++) for (const k of [0, 1]) { const x = Math.round(echelle(k, y)); for (let e = 0; e < 3; e++) t.poser(x + e, y, 'chene', e === 0 ? 4 : e === 1 ? 3 : 1); }
    for (let y = ty + 14; y < sol + 18; y += 13) for (let x = Math.round(echelle(0, y)) + 3; x < Math.round(echelle(1, y)); x++) { t.poser(x, y, 'chene', 4); t.poser(x, y + 1, 'chene', 1); }
    // une niche voûtée dans le mur du fond (la lanterne rouge y pendra), et deux étagères à droite
    for (let y = 70; y < 150; y++) for (let x = 200; x < 280; x++) { const dn = y < 110 ? Math.hypot(x + 0.5 - 240, y + 0.5 - 110) : Math.abs(x + 0.5 - 240); if (dn < 40) t.poser(x, y, 'roche', dn > 37 ? 4 : y > 140 ? 1 : 0); }
    for (const ey of [104, 144]) { planche(t, 316, ey, 120, 5, 'cheneSombre', { graine: 956 + ey, noeuds: 2 }); for (const ex of [322, 428]) for (let y = ey + 5; y < ey + 12; y++) { t.poser(ex, y, 'fer', 2); t.poser(ex + 1, y, 'fer', 1); } }
    // des chaînes et un anneau scellés dans le mur, à gauche
    for (let y = 60; y < 100; y += 2) t.poser(170 + Math.round(Math.sin(y / 6) * 1), y, 'fer', y % 4 ? 2 : 4);
    t.forme('fer', (x, y) => Math.abs(Math.hypot(x + 0.5 - 170, y + 0.5 - 104) - 4) < 1 ? [0, 0, 1] : null);
    t.texture(s, 'caveRepaire'); }
  // --- la trappe ouverte dans le plancher de l'arrière-boutique : le trou, le haut de l'échelle, l'abattant relevé ---
  { const t = toile(100, 54);
    // le trou, découpé net dans le plancher, vu de biais : le bord du fond (y 30) plus étroit que celui de devant (y 47)
    const yF = 30, yD = 47, bord = y => { const v = (y - yF) / (yD - yF); return [16 - v * 8, 84 + v * 8]; };
    const dedans = (x, y) => { if (y < yF || y > yD) return false; const [a, b] = bord(y); return x >= a && x <= b; };
    // l'encadrement de la trappe : quatre planches de chêne posées à plat autour du trou
    for (let y = yF - 3; y <= yD + 2; y++) { const [a, b] = bord(Math.min(yD, Math.max(yF, y))); for (let x = Math.floor(a) - 3; x <= Math.ceil(b) + 3; x++) if (!dedans(x, y)) t.poser(x, y, 'chene', y < yF ? 4 : y > yD ? 2 : 3); }
    // dans le trou : le mur du fond du puits, sombre en haut, éclairé en bas par la lanterne de la cave
    for (let y = yF; y <= yD; y++) for (let x = 0; x < 100; x++) if (dedans(x, y)) { const v = (y - yF) / (yD - yF), joint = (y - yF) % 5 === 0 || (x + Math.floor((y - yF) / 5) * 4) % 9 === 0;
      t.poser(x, y, joint ? 'roche' : 'lueur', joint ? 1 + Math.round(v * 2) : Math.max(0, Math.round(v * 4) - (x < bord(y)[0] + 3 || x > bord(y)[1] - 3 ? 1 : 0))); }
    // l'échelle appuyée contre le mur du fond : seulement dans le trou (le bord de devant la cache en bas)
    for (const ex of [40, 58]) for (let y = yF + 1; y <= yD; y++) for (let e = 0; e < 3; e++) if (dedans(ex + e, y)) t.poser(ex + e, y, 'chene', e === 0 ? 5 : e === 1 ? 3 : 1);
    for (let y = yF + 4; y <= yD - 1; y += 5) for (let x = 42; x < 58; x++) if (dedans(x, y)) { t.poser(x, y, 'chene', 4); if (dedans(x, y + 1)) t.poser(x, y + 1, 'chene', 1); }
    // la tranche du plancher, au bord de devant (l'épaisseur des lattes, dans l'ombre)
    for (let x = 6; x <= 94; x++) { t.poser(x, yD + 1, 'cheneSombre', 1); t.poser(x, yD + 2, 'cheneSombre', 0); }
    // l'abattant, ouvert sur ses charnières et penché vers l'arrière : on voit son dessous, ses deux traverses, l'anneau
    const yH = 3, abat = y => { const v = (y - yH) / (yF - 3 - yH); return [22 - v * 5, 78 + v * 5]; };
    for (let y = yH; y < yF - 3; y++) { const [a, b] = abat(y); for (let x = Math.ceil(a); x <= Math.floor(b); x++) { const lame = Math.floor((x - a) / 8), joint = Math.abs(((x - a) % 8)) < 0.9;
      t.poser(x, y, 'chene', joint ? 1 : 2 + Math.round((hachage(lame, Math.floor(y / 6), 961) - 0.5) * 1.4) + (y < yH + 2 ? 2 : 0)); } }
    for (const ty of [9, 21]) { const [a, b] = abat(ty); for (let x = Math.ceil(a) + 2; x <= Math.floor(b) - 2; x++) { t.poser(x, ty, 'chene', 4); t.poser(x, ty + 1, 'chene', 4); t.poser(x, ty + 2, 'cheneSombre', 1); } }
    t.forme('fer', (x, y) => Math.abs(Math.hypot(x + 0.5 - 50, (y + 0.5 - 15) * 1.3) - 3) < 0.9 ? [0, 0, 1] : null);
    for (const hx of [30, 66]) for (let y = yF - 4; y < yF; y++) for (let x = hx; x < hx + 5; x++) t.poser(x, y, 'fer', y === yF - 4 ? 4 : 2);   // (les charnières, au bord du fond)
    t.contour(); t.texture(s, 'trappeOuverte'); }
  // --- le tapis roulé, poussé à côté de la trappe ---
  { const t = toile(56, 14); t.rampes.laineT = rampe(0x8a2a3a); t.rampes.laineO = rampe(0xc8a040);
    t.forme('laineT', (x, y) => (x >= 4 && x <= 50 && y >= 2 && y <= 12 ? [0, (y - 7) / 6, 0.8] : null), { motif: (x) => (x % 9 < 2 ? 0.8 : 0) });
    for (let x = 4; x <= 50; x++) if (x % 9 < 2) for (let y = 3; y < 12; y++) t.poser(x, y, 'laineO', 3);
    t.forme('laineT', (x, y) => { const r = Math.hypot(x + 0.5 - 51, y + 0.5 - 7); return r <= 5.4 ? [0.6, 0, 0.8] : null; }, { decalage: 0.3 });
    for (let a = 0; a < 14; a++) { const r = 1 + a * 0.3, an = a * 0.9; t.poser(Math.round(51 + Math.cos(an) * r), Math.round(7 + Math.sin(an) * r), 'laineO', 2); }
    t.contour(); t.texture(s, 'tapisRoule'); }
}


// Fil-de-Fer : un petit, coiffure en bataille, peau mate (le moteur du joueur, au stade « petit »)
function textureGamin(s) {
  if (!s.textures.exists('gamin')) dessinerJoueurHD({ coiffure: 2, cheveux: 3, peau: 3, yeux: 1, bouche: 1, barbe: 0, haut: 2, bas: 1, bottes: 1 }, 'petit', false, 0, [], 'troisQuarts').texture(s, 'gamin');
  return 'gamin';
}
