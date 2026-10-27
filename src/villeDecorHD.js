// (v1.65, la ville des Hobbits en quartiers, chantier 2 : le socle) Les dessins des rues de la ville, repris tels qu'ils
// ont été validés sur les planches 89 v2 à v7 (et la fontaine de la planche 81) : ils servent au tronçon de démonstration
// du socle (quartierSoucolline.js) et serviront aux quartiers suivants. Chaque texture est peinte une fois et gardée.
//   - les maisons du centre (maison5 : toits de tuiles, d'ardoises ou de chaume, pierre de taille, colombages, fenêtres à
//     volets, portes, gouttières, cheminées, lierre, jardinières) et du bas-quartier (vieilleMaison5), le banc (banc5) ;
//   - le parapet, les longs murets, le poteau et ses flèches, la fumée, la haie, les bacs à fleurs, le puits, le mur du
//     jardin ; la descente des Marches et ses piliers (le grès de la rue, GRES6) ;
//   - la tente de Madame Ysmée ;
//   - la fontaine de la placette (le bassin de la planche 81, sa grenouille de bronze sur un rocher moussu), les petits
//     objets de la rue et les bêtes (pigeons, papillons, libellule, poissons, moineau).

const RAMPES_V2 = {
  enduitC: rampe(0xe4d4b0), enduitO: rampe(0xd8b884), enduitR: rampe(0xd8a890), enduitB: rampe(0xc8ccc4), enduitV: rampe(0xc8d0a8),
  boisV: rampe(0x5a3a22), boisR: rampe(0x6a2a1e), voletV: rampe(0x3e6a48), voletB: rampe(0x3a5a8a), voletR: rampe(0x8a3a2a), voletJ: rampe(0xc0902e),
  storeR: rampeVive(0xb83a2a), storeB: rampe(0xece4d0), storeV: rampeVive(0x3a7a4a), storeJ: rampeVive(0xd8a838),
  feuilleV2: rampe(0x3e7a30), feuilleC2: rampe(0x5a9a3a), fleurR2: rampeVive(0xd8323e), fleurP2: rampeVive(0xe86a9a), fleurJ2: rampeVive(0xf0c020), fleurB2: rampeVive(0x7a8ae8),
  terreCuite: rampe(0xb8603a), chaume: rampe(0xc8a050), chaumeS: rampe(0x9a7a3a), herbeB: rampe(0x6a9a44), herbeB2: rampe(0x5a8a3a), mousseT: rampe(0x6a7a3a),
  porteVerte: rampe(0x2e6e3a), porteRouge: rampe(0x9a3226), porteJaune: rampe(0xc89a2e), porteBleue: rampe(0x2e548e),
  vitreJ: [0x16202c, 0x22303e, 0x34485a, 0x4a6478, 0x7a98ac, 0xc8dce4], fumeeV: [0x6a6a70, 0x8a8a90, 0xa8a8ae, 0xc4c4c8, 0xdcdce0, 0xf0f0f2],
  tenteV: rampeVive(0x5a3482), tenteV2: rampeVive(0x3e2060), tenteOr: rampeVive(0xd8b048), lanterneV: rampeVive(0xc890f0),
  brique: rampe(0xa8543a), linB: rampe(0xe8e4d8), linR: rampeVive(0xb83a2a), linBl: rampeVive(0x3a6ab0), liege: rampe(0xc8a060), briqueS: rampe(0x8a4430), mortier: rampe(0x9a8c78), suie: rampe(0x4a4440),
};
const toileV2 = (l, h) => { const t = toileDecor(l, h); Object.assign(t.rampes, RAMPES_RUE, RAMPES_V2); return t; };
// La tente de Madame Ysmée : toile violette à larges bandes, l'entrée aux rideaux noués d'or, le fanion, la lanterne violette
function tenteYsmee89(s, cle = 'tenteYsmee89') {
  if (s.textures.exists(cle)) return cle;
  const L = 150, H = 150, t = toileV2(L, H), cx = 75, base = H - 4, sommet = 30;
  t.forme('tenteV', (x, y) => { if (y < sommet || y > base) return null; const v = (y - sommet) / (base - sommet), w = 8 + v * 62 + Math.sin(v * 3) * 2; const dx = x + 0.5 - cx; if (Math.abs(dx) > w) return null; return [dx / w * 0.9, -0.3, 0.7]; },
    { motif: (x, y) => { const v = (y - sommet) / (base - sommet), w = 8 + v * 62, u = (x + 0.5 - cx) / w; return Math.floor((u + 1) * 3.5) % 2 ? -0.9 : 0.2; } });
  // le bas de la toile, festonné, et son ombre
  for (let x = cx - 72; x <= cx + 72; x++) { const f = Math.floor((x + 200) / 6) % 2; for (let y = base - 3; y <= base - 1 + f; y++) t.poser(x, y, 'tenteOr', y === base - 3 ? 4 : 2); }
  // l'entrée : un triangle sombre, les rideaux noués de cordons d'or
  for (let y = 78; y < base - 3; y++) { const v = (y - 78) / (base - 81), w = 4 + v * 22; for (let x = Math.round(cx - w); x <= cx + w; x++) t.poser(x, y, 'tenteV2', Math.abs(x - cx) < w - 5 ? 0 : 2); }
  for (const s0 of [-1, 1]) { for (let y = 92; y < base - 3; y++) { const v = (y - 92) / (base - 95), w = 6 + v * 6; for (let k = 0; k < w; k++) t.poser(Math.round(cx + s0 * (24 + v * 2 - k)), y, 'tenteOr', k === 0 ? 4 : 2 + (k % 3 === 0 ? 1 : 0)); } for (let k = -2; k <= 2; k++) t.poser(cx + s0 * 22 + k, 104, 'or', 5); }
  // une table ronde et une boule de cristal qu'on devine au fond
  t.forme('lanterneV', ellipsoide(cx, 118, 4, 4), { decalage: 1, ombre: false });
  for (let x = cx - 9; x <= cx + 9; x++) t.poser(x, 123, 'cuirRouge', 3);
  // le mât et le fanion d'or, les étoiles cousues
  for (let y = 2; y < sommet + 2; y++) { t.poser(cx, y, 'chene', 3); t.poser(cx + 1, y, 'chene', 1); }
  for (let y = 3; y < 15; y++) for (let x = cx + 2; x < cx + 2 + Math.round((15 - y) * 1.6); x++) t.poser(x, y, 'tenteOr', 3 + (y < 6 ? 1 : 0));
  for (const [sx, sy] of [[cx - 40, 112], [cx + 38, 96], [cx - 16, 62], [cx + 50, 130], [cx - 56, 136], [cx + 18, 50]]) { t.poser(sx, sy, 'or', 5); t.poser(sx - 1, sy, 'or', 3); t.poser(sx + 1, sy, 'or', 3); t.poser(sx, sy - 1, 'or', 3); t.poser(sx, sy + 1, 'or', 3); }
  // la lanterne violette pendue à un crochet
  const lx = cx - 46, ly = 80; for (let y = ly - 8; y < ly; y++) t.poser(lx + 3, y, 'fer', 2); for (let y = ly; y < ly + 9; y++) for (let x = lx; x < lx + 7; x++) t.poser(x, y, (x === lx || x === lx + 6 || y === ly || y === ly + 8) ? 'fer' : 'lanterneV', (x === lx || x === lx + 6 || y === ly || y === ly + 8) ? 2 : 4);
  t.contour(); t.texture(s, cle); return cle;
}
Object.assign(RAMPES_V2, { plomb: rampe(0x7a8088), moussT: rampe(0x62803a), chaumeA: rampe(0xcaa44c), chaumeB: rampe(0xa88438), taille2: rampe(0xb4aa98), taille3: rampe(0xa09a8c), moellon: rampe(0x8a8070), suieX: rampe(0x3a3632),
  brique2: rampe(0xb85a3c), voletG: rampe(0x5a7a52), voletN: rampe(0x2e4a6a), voletO: rampe(0xa0642a), bancB: rampe(0x9a6a3c), bancS: rampe(0x6a4a2a), fer2: rampe(0x3a3c44) });
const toileM5 = (l, h) => { const t = toileDecor(l, h); Object.assign(t.rampes, RAMPES_RUE, RAMPES_V2); return t; };
// ---- les toits ----
function toitGeom5(L, x0, x1) { const g0 = x0 + (x1 - x0) * 0.24, d0 = x1 - (x1 - x0) * 0.24; return { g0, d0, bornes: v => [Math.round(g0 - v * (g0 - x0)), Math.round(d0 + v * (x1 - d0))] }; }
function toitTuiles5(t, x0, x1, haut, bas, mat = 'tuile', g = 1) {
  const G = toitGeom5(0, x0, x1);
  for (let y = haut; y <= bas; y++) { const v = (y - haut) / Math.max(1, bas - haut), [xa, xb] = G.bornes(v); for (let x = xa; x <= xb; x++) t.poser(x, y, mat, 0); }   // le fond sombre, sous les tuiles
  for (let y = haut; y <= bas; y++) {
    const v = (y - haut) / Math.max(1, bas - haut), [xa, xb] = G.bornes(v), r = Math.floor((y - haut) / 4), ty = (y - haut) % 4, dec = (r % 2) * 3;
    for (let x = xa; x <= xb; x++) {
      const tx = ((x + dec) % 6 + 6) % 6, a = Math.floor((x + dec) / 6), h = hachage(a, r, g);
      if (ty === 3 && (tx === 0 || tx === 5)) continue;   // le bas arrondi de la tuile : on voit le dessous
      let k = 3 + (h > 0.86 ? 1 : h < 0.12 ? -1 : 0);
      if (ty === 0) k += 1; else if (ty === 3) k -= 1; if (tx === 0 && ty < 3) k += 1; else if (tx === 5) k -= 1;
      if (x > (xa + xb) / 2 + (xb - xa) * 0.22) k -= 1;   // le versant à l'ombre
      if (x < xa + 2) k += 1; else if (x > xb - 2) k -= 1;
      let m = mat; if (h > 0.955 && ty < 3 && tx > 0 && tx < 5) m = 'moussT';
      t.poser(x, y, m, Math.max(0, Math.min(5, k)));
    }
  }
  // l'égout : une ligne de tuiles d'arrêt, et l'ombre portée sur le mur
  const [xa, xb] = G.bornes(1); for (let x = xa; x <= xb; x++) { t.poser(x, bas + 1, mat, 0); t.poser(x, bas + 2, 'cheneSombre', 0); }
  // le faîtage : des faîtières demi-rondes, chacune son joint
  for (let x = Math.round(G.g0) - 2; x <= Math.round(G.d0) + 2; x++) { const u = (x - Math.round(G.g0) + 2) % 5; for (let k = 1; k <= 3; k++) { const yy = haut - k; if (k === 3 && (x < Math.round(G.g0) - 1 || x > Math.round(G.d0) + 1)) continue; t.poser(x, yy, mat, u === 4 ? 1 : k === 3 ? 5 : k === 2 ? 4 : 2); } if (u === 4) t.poser(x, haut - 3, mat, 2); }
  for (const x of [Math.round(G.g0) - 3, Math.round(G.d0) + 3]) for (let k = 1; k <= 3; k++) t.poser(x, haut - k, mat, k === 3 ? 3 : 1);   // les about
}
function toitArdoises5(t, x0, x1, haut, bas, g = 1) {
  const G = toitGeom5(0, x0, x1), mat = 'ardoiseToit';
  for (let y = haut; y <= bas; y++) { const v = (y - haut) / Math.max(1, bas - haut), [xa, xb] = G.bornes(v); for (let x = xa; x <= xb; x++) t.poser(x, y, mat, 0); }
  for (let y = haut; y <= bas; y++) {
    const v = (y - haut) / Math.max(1, bas - haut), [xa, xb] = G.bornes(v), r = Math.floor((y - haut) / 4), ty = (y - haut) % 4, dec = (r % 2) * 4;
    for (let x = xa; x <= xb; x++) { const tx = ((x + dec) % 8 + 8) % 8, a = Math.floor((x + dec) / 8), h = hachage(a, r, g);
      if (tx === 7) { t.poser(x, y, mat, 0); continue; }
      let k = 3 + (h > 0.8 ? 1 : h < 0.15 ? -1 : 0);
      if (ty === 3) k = 1; else if (ty === 2) k -= 1; else if (ty === 0) k += 1; if (tx === 0) k += 1;
      if (x > (xa + xb) / 2 + (xb - xa) * 0.22) k -= 1; if (x < xa + 2) k += 1; else if (x > xb - 2) k -= 1;
      t.poser(x, y, mat, Math.max(0, Math.min(5, k))); }
  }
  const [xa, xb] = G.bornes(1); for (let x = xa; x <= xb; x++) { t.poser(x, bas + 1, mat, 1); t.poser(x, bas + 2, 'cheneSombre', 0); }
  for (let x = Math.round(G.g0) - 2; x <= Math.round(G.d0) + 2; x++) for (let k = 1; k <= 3; k++) t.poser(x, haut - k, mat, k === 3 ? 5 : k === 2 ? 3 : 1);   // la crête de plomb
  for (let x = Math.round(G.g0) - 2; x <= Math.round(G.d0) + 2; x += 7) t.poser(x, haut - 2, 'plomb', 4);
}
function toitChaume5(t, x0, x1, haut, bas, g = 1) {
  const G = toitGeom5(0, x0, x1);
  for (let y = haut; y <= bas + 3; y++) {
    const v = Math.min(1, (y - haut) / Math.max(1, bas - haut)), [xa, xb] = G.bornes(v);
    for (let x = xa; x <= xb; x++) {
      const fr = y > bas ? Math.floor(hachage(x, 1, g) * 4) : 99; if (y > bas && y - bas > fr) continue;   // la frange irrégulière du bas
      const brin = hachage(x >> 0, 3, g) * 0.96, bande = Math.floor((y - haut) / 7), bd = (y - haut) % 7, sens = fbm(x * 0.9, y * 0.12, g) ;
      let k = 3 + (sens > 0.58 ? 1 : sens < 0.38 ? -1 : 0) + (brin > 0.9 ? 1 : 0) - (bd === 6 ? 1 : 0) + (bd === 0 ? 1 : 0);
      if (bd === 3 && (x + bande) % 3 === 0) k -= 1;   // les liens de roseau
      if (x > (xa + xb) / 2 + (xb - xa) * 0.22) k -= 1; if (x < xa + 2) k += 1; else if (x > xb - 2) k -= 1;
      if (y > bas) k -= 1 + (y - bas > 1 ? 1 : 0);
      t.poser(x, y, hachage(bande, x >> 3, g + 1) > 0.5 ? 'chaumeA' : 'chaumeB', Math.max(0, Math.min(5, k)));
    }
  }
  // le faîtage : un boudin de chaume piqué de croix de bois
  for (let x = Math.round(G.g0) - 3; x <= Math.round(G.d0) + 3; x++) for (let k = 1; k <= 4; k++) { const edge = k === 4 && (x < Math.round(G.g0) - 1 || x > Math.round(G.d0) + 1); if (edge) continue; t.poser(x, haut - k, 'chaumeA', k === 4 ? 5 : k === 3 ? 4 : k === 1 ? 2 : 3 + ((x + k) % 4 === 0 ? -1 : 0)); }
  for (let x = Math.round(G.g0) - 2; x <= Math.round(G.d0) + 2; x += 5) { t.poser(x, haut - 3, 'chaumeB', 1); t.poser(x + 1, haut - 2, 'chaumeB', 1); t.poser(x + 2, haut - 3, 'chaumeB', 1); }
}
// ---- les murs ----
// de la pierre de taille appareillée : des assises régulières (hauteurs 7), des blocs inégaux qui se chevauchent, des arêtes, des joints
function murPierre5(t, x0, y0, l, h, { g = 1, mat = 'taille', hAss = 7, quoins = true, tons = 1 } = {}) {
  const rangs = Math.ceil(h / hAss);
  for (let r = 0; r < rangs; r++) {
    const ya = y0 + r * hAss, hb = Math.min(hAss, y0 + h - ya); let x = x0 - Math.floor(hachage(r, 3, g) * 10);
    while (x < x0 + l) {
      const lb = 12 + Math.floor(hachage(x, r, g + 1) * 12), xa = Math.max(x0, x), xb = Math.min(x0 + l, x + lb), tone = hachage(x, r, g + 2);
      for (let yy = ya; yy < ya + hb; yy++) for (let xx = xa; xx < xb; xx++) {
        const u = xx - x, v = yy - ya; let k = 3 + (tone > 0.8 ? tons : tone < 0.12 ? -tons : 0);
        if (v === hAss - 1 || xx === x + lb - 1) k = 1;   // les joints
        else { if (v === 0) k += 1; else if (v === hAss - 2) k -= 1; if (u === 0) k += 1; else if (xx === x + lb - 2) k -= 1;
          if (hachage(xx, yy, g + 3) > 0.985) k -= 1; }
        t.poser(xx, yy, mat, Math.max(0, Math.min(5, k)));
      }
      x += lb;
    }
  }
  if (quoins) for (const [xa, sens] of [[x0, 1], [x0 + l - 8, -1]]) for (let r = 0; r < rangs; r++) { const ya = y0 + r * hAss, hb = Math.min(hAss, y0 + h - ya), long = r % 2 ? 8 : 5;
    for (let yy = ya; yy < ya + hb; yy++) for (let k = 0; k < long; k++) { const xx = sens > 0 ? xa + k : xa + 8 - 1 - k + (8 - long) * 0 + (8 - 8); const px = sens > 0 ? xa + k : xa + 7 - k;
      const v = yy - ya; let kk = 4 + (v === 0 ? 1 : v === hAss - 2 ? -1 : 0) - (sens < 0 ? 1 : 0); if (v === hAss - 1 || k === long - 1) kk = 1; t.poser(px, yy, 'taille2', Math.max(0, Math.min(5, kk))); } }
}
// des moellons : pierres brutes de tailles inégales, arrondies, chacune sa lumière (le bas-quartier)
function moellons5(t, x0, y0, l, h, g = 1, mat = 'moellon') {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + l; x++) t.poser(x, y, 'suieX', 1);   // le mortier, sombre
  let y = y0, r = 0;
  while (y < y0 + h) {
    const hb = 5 + Math.floor(hachage(r, 1, g) * 3); let x = x0 - Math.floor(hachage(r, 2, g) * 9);
    while (x < x0 + l) {
      const lb = 8 + Math.floor(hachage(x, r, g + 1) * 8), tone = hachage(x, r, g + 2);
      for (let yy = y; yy < Math.min(y + hb, y0 + h); yy++) for (let xx = Math.max(x0, x); xx < Math.min(x0 + l, x + lb); xx++) {
        const u = xx - x, v = yy - y; if ((u === 0 || u === lb - 2) && (v === 0 || v === hb - 2)) continue; if (u >= lb - 1 || v >= hb - 1) continue;
        let k = 3 + (tone > 0.78 ? 1 : tone < 0.18 ? -1 : 0); if (v === 0) k += 1; else if (u === 0) k += 1; if (v === hb - 2) k -= 1; else if (u === lb - 2) k -= 1;
        if (hachage(xx, yy, g + 3) > 0.97) k -= 1; t.poser(xx, yy, mat, Math.max(0, Math.min(5, k)));
      }
      x += lb;
    }
    y += hb; r++;
  }
}
// un enduit à la chaux : un ton franc, des fissures nettes, des écailles, le bas sali
function enduit5(t, x0, y0, l, h, mat, g = 1) {
  t.rampes.platre = t.rampes[mat];
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + l; x++) { let k = 3 + (fbm(x * 0.06, y * 0.05, g) > 0.62 ? 1 : fbm(x * 0.06, y * 0.05, g) < 0.3 ? -1 : 0);
    if (y > y0 + h - 8 && hachage(x, y, g) < 0.18 + (y - (y0 + h - 8)) * 0.05) k--; if (hachage(x, y, g + 9) > 0.992) k--; t.poser(x, y, 'platre', Math.max(0, Math.min(5, k))); }
  for (let n = 0; n < 2; n++) { let x = x0 + 8 + hachage(n, 7, g) * (l - 16), y = y0 + 6 + hachage(n, 8, g) * 8; for (let s = 0; s < 14; s++) { t.poser(Math.round(x), y, 'platre', 1); x += (hachage(n, s, g + 2) - 0.5) * 2; y += 1; } }
}
// des colombages : poteaux, sablières, écharpes (croix de Saint-André), chevilles de bois
function colombages5(t, x0, y0, l, h, { bois = 'cheneSombre', pas = 22, trous = [], g = 1 } = {}) {
  const libre = (x, y) => !trous.some(([a, b, c, d]) => x >= a - 3 && x < a + c + 3 && y >= b - 3 && y < b + d + 5);
  const poutre = (x, y, k = 2) => { if (libre(x, y)) t.poser(x, y, bois, k + (hachage(x >> 1, y >> 2, g) > 0.75 ? 1 : 0)); };
  for (let x = x0; x < x0 + l; x++) for (let k = 0; k < 4; k++) { t.poser(x, y0 + k, bois, k === 0 ? 4 : k === 3 ? 1 : 2); t.poser(x, y0 + h - 1 - k, bois, k === 0 ? 1 : k === 3 ? 4 : 2); }
  const posts = []; for (let x = x0; x <= x0 + l - 5; x += pas) posts.push(x); if (posts[posts.length - 1] < x0 + l - 5) posts.push(x0 + l - 5);
  for (const px of posts) for (let y = y0 + 3; y < y0 + h - 3; y++) for (let k = 0; k < 5; k++) if (libre(px + k, y) || k === 0) t.poser(px + k, y, bois, k === 0 ? 4 : k === 4 ? 1 : 2 + (hachage(px, y >> 3, g) > 0.7 ? 1 : 0));
  for (let i = 0; i < posts.length - 1; i++) { const a = posts[i] + 5, b = posts[i + 1]; if (!libre((a + b) >> 1, y0 + h / 2)) continue;
    for (let y = y0 + 4; y < y0 + h - 4; y++) { const v = (y - y0 - 4) / (h - 8), xa = Math.round(a + v * (b - a - 4)), xb = Math.round(b - 4 - v * (b - a - 4)); for (let k = 0; k < 4; k++) { poutre(xa + k, y, k === 0 ? 3 : 2); poutre(xb + k, y, k === 0 ? 3 : 2); } } }
  for (const px of posts) for (const yy of [y0 + 6, y0 + h - 8]) if (libre(px + 2, yy)) t.poser(px + 2, yy, 'fer', 4);   // les chevilles
}
// ---- fenêtre : jambages, linteau, appui, vitres, volets ----
function fenetre5(t, x0, y0, l, h, { volet = 'voletV', jour = true, rideau = false, ouverte = true, g = 1, pierre = true, arc = false } = {}) {
  const dx = l / 2;
  // l'encadrement : jambages de pierre, linteau saillant (avec son claveau), appui saillant
  if (pierre) {
    for (let y = y0 - 5; y < y0 + h + 3; y++) for (let x = x0 - 3; x < x0 + l + 3; x++) { const lin = y < y0, bord = x < x0 || x >= x0 + l;
      if (lin && y < y0 - 5 + 5) { const ex = x >= x0 - 3 && x < x0 + l + 3, v = y - (y0 - 5); const joint = (x - (x0 - 3)) % 7 === 0 || (x === x0 + Math.floor(l / 2));
        t.poser(x, y, 'taille', joint ? 1 : v === 0 ? 5 : v === 4 ? 2 : 3 + (x < x0 + l / 2 ? 1 : 0)); }
      else if (bord && y >= y0 && y < y0 + h) t.poser(x, y, 'taille', (y - y0) % 7 === 6 ? 1 : x < x0 ? 4 : 2); }
    for (let x = x0 - 4; x < x0 + l + 4; x++) { t.poser(x, y0 + h + 1, 'taille', 5); t.poser(x, y0 + h + 2, 'taille', 3); t.poser(x, y0 + h + 3, 'taille', 1); }   // l'appui
    t.poser(x0 + Math.floor(l / 2), y0 - 3, 'taille', 5); t.poser(x0 + Math.floor(l / 2) - 1, y0 - 2, 'taille', 4);   // la clef
  }
  // les vitres : petits carreaux sertis de plomb, reflets en diagonale, le haut plus clair
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + l; x++) {
    const cadre = x === x0 || x === x0 + l - 1 || y === y0 || y === y0 + h - 1, mont = (x - x0) === Math.floor(l / 2), trav = (y - y0) % Math.floor(h / 3) === 0 && y > y0;
    const diag = ((x - x0) + (y - y0)) % 9, ref = diag === 0 || diag === 1;
    if (cadre) t.poser(x, y, 'cheneSombre', 3); else if (mont || trav) t.poser(x, y, 'fer', 2);
    else if (rideau && (x < x0 + 3 || x >= x0 + l - 3)) t.poser(x, y, 'cuirRouge', 3 + ((x + y) % 3 === 0 ? 1 : 0));
    else t.poser(x, y, jour ? 'vitreJ' : 'vitre', 2 + (ref ? 2 : 0) + (y < y0 + 4 ? 1 : 0) - (y > y0 + h - 5 ? 1 : 0));
  }
  // les volets battants : lames verticales, deux barres et une écharpe, deux gonds, un arrêt
  if (volet && ouverte) for (const [vx, sens] of [[x0 - 4 - Math.ceil(l / 2), -1], [x0 + l + 4, 1]]) {
    const w = Math.ceil(l / 2), top = y0 - 4, bas = y0 + h + 3;
    for (let y = top; y < bas; y++) for (let x = vx; x < vx + w; x++) { const u = x - vx, lame = u % 3 === 0, barre = Math.abs(y - (top + 6)) < 1.5 || Math.abs(y - (bas - 7)) < 1.5;
      const ecp = Math.abs((y - top) - (sens > 0 ? (w - u) * (bas - top - 14) / w : u * (bas - top - 14) / w) - 6) < 1.2 && !barre;
      let k = 3 + (barre ? 1 : ecp ? 1 : 0) - (lame ? 1 : 0) + (hachage(x, y >> 3, g) > 0.9 ? 1 : 0); if (x === vx + (sens < 0 ? w - 1 : 0)) k += 0;
      if (y === top || x === (sens < 0 ? vx : vx + w - 1)) k -= 1; t.poser(x, y, volet, Math.max(0, Math.min(5, k))); }
    const gx = sens < 0 ? vx + w - 2 : vx + 1; for (const gy of [top + 5, bas - 8]) { t.poser(gx, gy, 'fer', 4); t.poser(gx + sens * -1, gy, 'fer', 2); }
  }
}
// porte : encadrement de pierre (en plein cintre à claveaux), vantail à planches cloutées, ferrures, anneau, seuil à deux marches
function porte5(t, x0, y0, l, h, { peinte = null, arc = true, g = 3, imposte = true, marches = true, anneau = true } = {}) {
  const r = l / 2, m = peinte || 'cheneSombre';
  for (let y = y0 - 5; y < y0 + h; y++) for (let x = x0 - 4; x < x0 + l + 4; x++) {
    const dx = x + 0.5 - (x0 + r), dy = y + 0.5 - (y0 + r);
    if (arc && y < y0 + r && Math.hypot(dx, dy) > r + 4) continue;
    if (!arc && y < y0 - 5) continue;
    if (arc && y < y0 + r) { const a = Math.atan2(dy, dx), cl = Math.floor((a + Math.PI) * 9 / Math.PI), joint = ((a + Math.PI) * 9 / Math.PI) % 1 < 0.14; t.poser(x, y, 'taille', joint ? 1 : cl % 2 ? 4 : 3); }
    else if (!arc && y < y0) { const joint = (x - x0 + 4) % 8 === 0 || y === y0 - 1; t.poser(x, y, 'taille', joint ? 1 : y === y0 - 5 ? 5 : 3); }
    else { const bloc = Math.floor((y - y0) / 7), joint = (y - y0) % 7 === 6 || (x < x0 ? (x - x0 + 4 + (bloc % 2) * 2) % 4 === 0 : false); t.poser(x, y, 'taille', joint ? 1 : x < x0 + r ? 4 : 2); }
  }
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + l; x++) {
    const dx = x + 0.5 - (x0 + r), dy = y + 0.5 - (y0 + r); if (arc && y < y0 + r && Math.hypot(dx, dy) > r) continue;
    if (imposte && arc && y < y0 + r * 0.9) { const ray = Math.abs(dx) < 0.7 || Math.round((Math.atan2(dy, dx) + Math.PI) * 3 / Math.PI) !== (Math.atan2(dy, dx) + Math.PI) * 3 / Math.PI && false; t.poser(x, y, Math.abs(dx) < 0.8 ? 'cheneSombre' : 'vitreJ', Math.abs(dx) < 0.8 ? 2 : 3 + (dx < 0 ? 1 : 0)); continue; }
    const lame = (x - x0) % 5 === 0; let k = lame ? 1 : 3 + (hachage(Math.floor((x - x0) / 5), Math.floor(y / 12), g) > 0.75 ? 1 : 0); if (x === x0 + 1) k++; else if (x === x0 + l - 2) k--; t.poser(x, y, m, Math.max(0, Math.min(5, k)));
  }
  for (const py of [y0 + Math.round(h * 0.28), y0 + Math.round(h * 0.76)]) { for (let x = x0 + 1; x < x0 + l - 1; x++) { t.poser(x, py, 'fer', 3); t.poser(x, py + 1, 'fer', 1); } for (const sx of [x0 + 1, x0 + l - 3]) { t.poser(sx, py - 1, 'fer', 4); t.poser(sx + 1, py - 1, 'fer', 3); } }   // les ferrures, leurs gonds
  for (let yy = y0 + 6; yy < y0 + h - 3; yy += 6) for (let xx = x0 + 3; xx < x0 + l - 2; xx += 5) t.poser(xx, yy, 'fer', 5);   // les clous
  if (anneau) { const hx = x0 + l - 7, hy = y0 + Math.round(h * 0.55); for (const [a, b, k] of [[0, 0, 5], [-1, 1, 4], [1, 1, 4], [-1, 2, 3], [1, 2, 3], [0, 3, 2]]) t.poser(hx + a, hy + b, 'laiton', k); t.poser(hx, hy - 1, 'laiton', 3); }
  if (marches) for (let k = 0; k < 2; k++) for (let x = x0 - 5 - k * 2; x < x0 + l + 5 + k * 2; x++) { t.poser(x, y0 + h + k * 2, 'taille', 5); t.poser(x, y0 + h + k * 2 + 1, 'taille', 3); }
}
// une gouttière de plomb sous l'égout, et sa descente collée au mur (colliers tous les 14 pixels, coude au pied)
function gouttiere5(t, x0, x1, y, descente = null, bas = 0) {
  for (let x = x0; x < x1; x++) { t.poser(x, y, 'plomb', 4); t.poser(x, y + 1, 'plomb', 2); t.poser(x, y + 2, 'plomb', 0); }
  if (descente !== null) { for (let yy = y + 3; yy < bas - 3; yy++) { t.poser(descente, yy, 'plomb', 4); t.poser(descente + 1, yy, 'plomb', 2); t.poser(descente + 2, yy, 'plomb', 1); }
    for (let yy = y + 8; yy < bas - 6; yy += 14) for (let k = -1; k < 4; k++) t.poser(descente + k, yy, 'fer', 3);
    for (let k = 0; k < 4; k++) { t.poser(descente - k, bas - 3 + (k > 1 ? 1 : 0), 'plomb', 3); t.poser(descente - k, bas - 2, 'plomb', 1); } }
}
// la cheminée : fût de briques (assises, joints), corbeaux, couronnement, deux mitres
function cheminee5(t, cx, haut, hauteur, g = 1, pierreC = false) {
  const l = 14, x0 = cx - 7;
  for (let y = haut; y < haut + hauteur; y++) for (let x = x0; x < x0 + l; x++) { const row = Math.floor((y - haut) / 4), dec = (row % 2) * 3, u = (x - x0 + dec) % 6, v = (y - haut) % 4;
    let k = u === 5 || v === 3 ? 1 : 3 + (x < x0 + 3 ? 1 : x > x0 + l - 4 ? -1 : 0) + (v === 0 ? 1 : 0) + (hachage(Math.floor((x - x0 + dec) / 6), row, g) > 0.8 ? 1 : 0);
    t.poser(x, y, pierreC ? 'taille' : 'brique2', Math.max(0, Math.min(5, k))); }
  for (let k = 0; k < 3; k++) for (let x = x0 - 2 + k; x < x0 + l + 2 - k; x++) t.poser(x, haut - 1 - k + (k === 0 ? 0 : 0), 'taille', k === 2 ? 5 : k === 1 ? 4 : 2);   // le couronnement
  for (const mx of [cx - 4, cx + 1]) for (let y = haut - 8; y < haut - 3; y++) for (let x = mx; x < mx + 3; x++) t.poser(x, y, 'terreCuite', x === mx ? 4 : 2);   // les mitres
  for (const mx of [cx - 4, cx + 1]) for (let x = mx - 1; x < mx + 4; x++) { t.poser(x, haut - 9, 'terreCuite', 5); t.poser(x, haut - 10 + 1, 'suieX', 0); }
}
// du lierre : des tiges et des feuilles en cœur, une à une, deux verts, plus dense en bas ; des vrilles qui pendent
function lierre5(t, x0, ytop, ybot, largeur, g = 1) {
  for (let n = 0; n < 260; n++) { const v = Math.pow(hachage(n, 1, g), 0.75), y = Math.round(ybot - v * (ybot - ytop)), w = largeur * (0.35 + 0.65 * (1 - v)), x = Math.round(x0 + (hachage(n, 2, g) * w) + Math.sin(y / 9 + n * 0.2) * 1.5);
    const m = hachage(n, 3, g) > 0.5 ? 'feuilleV2' : 'feuilleC2', k = 3 + (hachage(n, 4, g) > 0.7 ? 1 : 0);
    for (const [a, b, kk] of [[0, 0, k], [1, 0, k - 1], [-1, 0, k + 1], [0, 1, k - 1], [0, -1, k + 1]]) t.poser(x + a, y + b, m, kk); t.poser(x - 1, y - 1, m, 5); }
  for (let n = 0; n < 5; n++) { const x = x0 + Math.floor(hachage(n, 5, g) * largeur); for (let y = ytop + 6; y < ytop + 6 + 10 + n * 3; y++) t.poser(x, y, 'cheneSombre', 2); }
}
function lanterne5(t, x, y) { for (let k = 0; k < 4; k++) t.poser(x + k, y, 'fer', 3); for (let k = 1; k < 5; k++) t.poser(x + 3, y + k, 'fer', 3);
  for (let yy = y + 5; yy < y + 14; yy++) for (let xx = x - 1; xx < x + 6; xx++) { const bord = xx === x - 1 || xx === x + 5 || yy === y + 5 || yy === y + 13; t.poser(xx, yy, bord ? 'fer' : 'vitre', bord ? 2 : 4 + (yy < y + 8 ? 1 : 0)); } t.poser(x + 2, y + 15, 'fer', 2); }
function enseigne5(t, x, y, dessin = 'cle') {
  for (let k = 0; k < 20; k++) t.poser(x + k, y, 'fer', 3); for (let k = 0; k < 8; k++) t.poser(x + 17 - k, y + 1 + k, 'fer', 2); for (const dx of [3, 15]) for (let yy = y + 1; yy < y + 6; yy++) t.poser(x + dx, yy, 'chanvre', 2);
  planche(t, x + 1, y + 6, 18, 12, 'chene', { graine: 50 + x }); for (let k = 0; k < 18; k++) { t.poser(x + 1 + k, y + 6, 'cheneSombre', 4); t.poser(x + 1 + k, y + 17, 'cheneSombre', 1); }
  if (dessin === 'cle') { for (let k = 0; k < 8; k++) t.poser(x + 5 + k, y + 12, 'or', 4); t.poser(x + 4, y + 11, 'or', 5); t.poser(x + 4, y + 13, 'or', 3); t.poser(x + 12, y + 13, 'or', 4); t.poser(x + 10, y + 13, 'or', 4); }
  else { t.poser(x + 8, y + 9, 'or', 5); t.poser(x + 9, y + 9, 'or', 5); for (let k = 10; k < 16; k++) t.poser(x + 8, y + k, 'or', 3); t.poser(x + 6, y + 11, 'or', 4); t.poser(x + 11, y + 11, 'or', 4); } }
// la jardinière : planches, équerres, terre, fleurs et feuilles une à une
function jardiniere5(t, x0, y0, l, fleur = 'fleurR2', g = 1) {
  for (let y = y0; y < y0 + 5; y++) for (let x = x0; x < x0 + l; x++) t.poser(x, y, 'chene', y === y0 ? 5 : y === y0 + 4 ? 1 : (x - x0) % 8 === 0 ? 1 : 3);
  for (const x of [x0 + 2, x0 + l - 3]) for (let y = y0 + 5; y < y0 + 9; y++) t.poser(x, y, 'fer', 3);
  for (let x = x0 + 1; x < x0 + l - 1; x++) { t.poser(x, y0 - 1, 'terreCuite', 2); }
  for (let x = x0 + 1; x < x0 + l - 1; x += 2) { const h = 3 + Math.floor(hachage(x, 1, g) * 4); for (let k = 1; k <= h; k++) t.poser(x + (k % 2), y0 - 1 - k, hachage(x, k, g) > 0.5 ? 'feuilleV2' : 'feuilleC2', 2 + (k === h ? 2 : 0)); }
  for (let k = 0; k < l / 3; k++) { const x = x0 + 2 + Math.floor(hachage(k, 2, g) * (l - 4)), y = y0 - 4 - Math.floor(hachage(k, 3, g) * 4); for (const [a, b, kk] of [[0, 0, 5], [1, 0, 3], [-1, 0, 3], [0, -1, 4], [0, 1, 3]]) t.poser(x + a, y + b, fleur, kk); t.poser(x, y, 'fleurJ2', 5); }
  for (let k = 0; k < 3; k++) { const x = x0 + 3 + k * Math.floor(l / 3); for (let yy = y0 + 5; yy < y0 + 8 + k; yy++) t.poser(x, yy, 'feuilleV2', 2 + (yy % 2)); }
}
// ---- la maison de ville (rez-de-chaussée en pierre de taille, étages à colombages, vrai toit) ----
function maison5(s, cle, o = {}) {
  if (s.textures.exists(cle)) return cle;
  const { L = 136, rdc = 68, etages = [54], toit = 56, toitMat = 'tuile', crepi = 'enduitC', bois = 'cheneSombre', volet = 'voletV', enc = 4, lucarne = null, cheminee = 0.72,
    porte = { x: 0.62, l: 24, h: 50 }, vitrine = null, porche = null, fenetresRdc = [], fenetres = null, jardinieres = true, fleur = 'fleurR2', graine = 1, lierre = false, store = 'storeR', enseigne = null, lanterne = false, gouttiere = true, descente = 'g' } = o;
  const M = 18, H = toit + etages.reduce((a, b) => a + b, 0) + rdc + 14 + M, t = toileM5(L, H), bas = H - 5, yR = bas - rdc, x0 = enc, x1 = L - enc;
  // 1. le rez-de-chaussée : pierre de taille appareillée, chaînes d'angle, soubassement
  murPierre5(t, x0, yR, x1 - x0, rdc, { g: graine + 1 });
  for (let x = x0; x < x1; x++) { for (let k = 0; k < 4; k++) t.poser(x, bas - k, 'taille3', k === 0 ? 1 : k === 1 ? 2 : 3 + (hachage(x >> 3, 1, graine) > 0.6 ? 1 : 0)); }   // le soubassement, plus sombre
  if (vitrine) {
    const vx = Math.round(L * vitrine.x - vitrine.l / 2), vy = yR + 18, vl = vitrine.l, vh = rdc - 28;
    for (let y = vy - 4; y < vy + vh + 4; y++) for (let x = vx - 3; x < vx + vl + 3; x++) { const dans = x >= vx && x < vx + vl && y >= vy && y < vy + vh; if (!dans) t.poser(x, y, 'cheneSombre', y < vy ? 4 : x < vx ? 3 : 2); }
    for (let y = vy; y < vy + vh; y++) for (let x = vx; x < vx + vl; x++) { const mont = (x - vx) % 13 === 12, trav = (y - vy) === 8, tab = y >= vy + vh - 9; const diag = ((x - vx) + (y - vy)) % 14; if (tab) t.poser(x, y, 'chene', y === vy + vh - 9 ? 5 : (x - vx) % 9 === 0 ? 1 : 3); else if (mont || trav) t.poser(x, y, 'cheneSombre', 2); else t.poser(x, y, 'vitreJ', 2 + (diag < 2 ? 2 : 0) + (y < vy + 4 ? 1 : 0)); }
    for (const it of vitrine.objets || []) it(t, vx, vy, vl, vh);
    for (let y = vy - 14; y < vy - 4; y++) { const v = (y - vy + 14) / 10; for (let x = vx - 5 - Math.round(v * 3); x < vx + vl + 5 + Math.round(v * 3); x++) { const ray = Math.floor((x - vx + 60) / 6) % 2; t.poser(x, y, ray ? store : 'storeB', 2 + Math.round((1 - v) * 2) + (x % 6 === 0 ? -1 : 0)); } }
    for (let x = vx - 8; x < vx + vl + 8; x++) { const ray = Math.floor((x - vx + 60) / 6) % 2, f = (x - vx + 60) % 6; for (let k = 0; k < (f === 2 || f === 3 ? 4 : 2); k++) t.poser(x, vy - 4 + k, ray ? store : 'storeB', k === 3 ? 1 : 3); }
  }
  if (porche) {
    const px = Math.round(L * porche.x - porche.l / 2), pl = porche.l, r = pl / 2, cy = yR + 8 + r;
    for (let y = yR + 3; y < bas; y++) for (let x = px - 6; x < px + pl + 6; x++) { const dx = x + 0.5 - (px + r), dy = y + 0.5 - cy, d = Math.hypot(dx, dy), dedans = y >= cy ? Math.abs(dx) < r : d < r, cadre = y >= cy ? Math.abs(dx) < r + 6 : d < r + 6;
      if (dedans) { const ex = Math.abs(dx) / r, ey = (y - (yR + 8)) / (bas - yR - 8), fond = Math.abs(dx) < r * 0.34 && y > cy - r * 0.2 && y < bas - 4;
        if (fond) { t.poser(x, y, y > bas - 12 ? 'herbeB' : 'vitreJ', y > bas - 12 ? 3 : 5 - Math.round(ey * 1.5)); continue; } const vo = Math.floor(ex * 4); t.poser(x, y, 'pierre', Math.max(0, 1 + (vo % 2) - (y > bas - 8 ? 0 : 0) + (ex < 0.4 ? 1 : 0))); }
      else if (cadre) { const a = Math.atan2(dy, dx), cl = Math.floor((a + Math.PI) * 11 / Math.PI), joint = y < cy ? ((a + Math.PI) * 11 / Math.PI) % 1 < 0.13 : (y - yR) % 7 === 0; t.poser(x, y, 'taille', joint ? 1 : y < cy ? (cl % 2 ? 5 : 3) : dx < 0 ? 4 : 2); } }
    t.poser(px + Math.floor(r), yR + 4, 'taille', 5); t.poser(px + Math.floor(r) - 1, yR + 5, 'taille', 4); t.poser(px + Math.floor(r) + 1, yR + 5, 'taille', 4);
    for (let x = px + Math.round(r * 0.66); x < px + pl - Math.round(r * 0.66); x++) for (let y = bas - 4; y < bas; y++) t.poser(x, y, 'pierre', 3);
  }
  if (porte) porte5(t, Math.round(L * porte.x - porte.l / 2), bas - porte.h, porte.l, porte.h, { peinte: porte.peinte || null, g: graine + 3, arc: porte.arc !== false });
  for (const fx of fenetresRdc) fenetre5(t, Math.round(L * fx - 8), yR + 18, 16, 22, { volet, g: graine + 5 });
  if (lanterne && porte) lanterne5(t, Math.round(L * porte.x - porte.l / 2) - 12, yR + 20);
  // 2. les étages : l'encorbellement (corbeaux sculptés), l'enduit, les colombages, les fenêtres
  let y = yR;
  etages.forEach((h, i) => {
    const yE = y - h; enduit5(t, 0, yE, L, h, crepi, graine + 10 + i);
    const nf = fenetres ? fenetres[i] : [0.25, 0.75], trous = nf.map(fx => [Math.round(L * fx - 8), yE + 13, 16, 24]);
    colombages5(t, 0, yE, L, h, { bois, trous, g: graine + 20 + i });
    for (const [fx, fy] of trous.map(z => [z[0], z[1]])) { fenetre5(t, fx, fy, 16, 24, { volet, rideau: hachage(fx, i, graine) > 0.5, g: graine + fx, pierre: false }); if (jardinieres) jardiniere5(t, fx - 3, fy + 29, 22, fleur, graine + fx); }
    if (i === 0 && enc) for (let cx = 7; cx < L - 8; cx += 17) for (let k = 0; k < 6; k++) for (let j = 0; j <= 5 - k; j++) { t.poser(cx + j, y + k, bois, k === 0 ? 4 : j === 0 ? 3 : 1); }   // les corbeaux
    for (let x = 0; x < L; x++) for (let k = 4; k < 8; k++) if (t.mat(x, yE + k) === 'platre') t.poser(x, yE + k, 'platre', t.teinte(x, yE + k) - (k < 6 ? 2 : 1));
    y = yE;
  });
  // 3. le toit
  const yT = y;
  if (toitMat === 'chaume') toitChaume5(t, -2, L + 1, M + 5, yT + 2, graine + 31);
  else if (toitMat === 'ardoiseToit') toitArdoises5(t, -2, L + 1, M + 5, yT + 2, graine + 31);
  else toitTuiles5(t, -2, L + 1, M + 5, yT + 2, toitMat, graine + 31);
  for (let x = -2; x < L + 2; x++) { t.poser(x, yT + 4, 'cheneSombre', 2); t.poser(x, yT + 5, 'cheneSombre', 0); }   // la sablière
  if (gouttiere && toitMat !== 'chaume') gouttiere5(t, -1, L + 1, yT + 6, descente === 'g' ? 3 : L - 6, bas);
  if (lucarne !== null) {
    const lx = Math.round(L * lucarne) - 12, ly = M + Math.round((yT - M) * 0.34) + 6;
    for (let yy = ly; yy < yT - 3; yy++) for (let x = lx; x < lx + 24; x++) { const joint = (yy - ly) % 6 === 5; t.poser(x, yy, 'platre', 3 + (x < lx + 3 ? 1 : 0) - (x > lx + 20 ? 1 : 0) - (joint ? 1 : 0)); }
    for (let yy = ly; yy < yT - 3; yy += 1) { t.poser(lx, yy, bois, 3); t.poser(lx + 23, yy, bois, 2); }
    fenetre5(t, lx + 6, ly + 7, 12, Math.max(8, yT - ly - 15), { volet: null, pierre: false, g: graine + 41 });
    const ctoit = toitMat === 'ardoiseToit' ? 'ardoiseToit' : toitMat === 'chaume' ? 'chaumeA' : toitMat;
    for (let yy = ly - 11; yy < ly + 1; yy++) { const v = (yy - ly + 11) / 11; for (let x = Math.round(lx + 12 - v * 15); x <= Math.round(lx + 12 + v * 15); x++) { const row = Math.floor((yy - ly + 11) / 3), tx = (x + (row % 2) * 3) % 6; t.poser(x, yy, ctoit, 2 + Math.round((1 - v) * 2) - (tx === 5 ? 1 : 0) + ((yy - ly + 11) % 3 === 0 ? 1 : 0)); } }
    for (let x = lx + 8; x < lx + 17; x++) t.poser(x, ly - 12, ctoit, 5);
  }
  if (cheminee !== null) { const cx = Math.round(L * cheminee); cheminee5(t, cx, M + 7, Math.round((yT - M) * 0.4), graine + 7); t.cheminee = [cx, M - 4]; }
  // 4. les accessoires : le lierre, l'enseigne en potence
  if (lierre) lierre5(t, 0, yT + 8, bas - 2, 18, graine + 40);
  if (enseigne) enseigne5(t, Math.round(L * enseigne.x), yR + 6, enseigne.dessin || 'cle');
  t.contour(); t.texture(s, cle);
  const tex = s.textures.get(cle); tex.cheminee = t.cheminee || null; tex.info89 = { L, H, yR, yT, bas };
  // (le toit, pour la neige du Givre : neigeToitHD) son faîte, son égout, la cheminée et la lucarne qui ne se couvrent pas
  tex.toit89 = { haut: M + 5, bas: yT + 2, chem: cheminee !== null ? { cx: Math.round(L * cheminee), haut: M + 7, h: Math.round((yT - M) * 0.4) } : null, lucarne: lucarne !== null ? { lx: Math.round(L * lucarne) - 12, ly: M + Math.round((yT - M) * 0.34) + 6, bas: yT - 3 } : null };
  return cle;
}
// ---- la vieille maison du bas-quartier : moellons bruts, étage de planches qui penche, toit rapiécé ----
function vieilleMaison5(s, cle, o = {}) {
  if (s.textures.exists(cle)) return cle;
  const { L = 120, rdc = 62, etage = 48, toit = 44, toitMat = 'tuile', graine = 5, porte = 0.3, fenetres = [0.7], penche = 3, volet = 'voletR', linge = false, pots = false } = o;
  const M = 16, H = toit + etage + rdc + 16 + M, t = toileM5(L + penche + 6, H), bas = H - 5, yR = bas - rdc, yE = yR - etage;
  moellons5(t, 2, yR, L - 4, rdc, graine);
  for (let x = 2; x < L - 2; x++) for (let k = 0; k < 4; k++) t.poser(x, bas - k, 'taille3', k === 0 ? 0 : 2 + (hachage(x >> 2, 1, graine) > 0.5 ? 1 : 0));   // le soubassement
  for (let y = yR; y < bas; y++) for (let x = 2; x < L - 2; x++) if (fbm(x * 0.05, y * 0.08, graine + 2) > 0.66 && t.mat(x, y) === 'moellon') t.poser(x, y, 'moellon', Math.max(0, t.teinte(x, y) - 1));   // l'humidité
  // l'étage de planches : chaque planche son fil, ses clous
  for (let y = yE; y < yR; y++) { const dec = Math.round((yR - y) / etage * penche); for (let x = dec; x < L + dec; x++) { const pl = Math.floor((x - dec) / 7), u = (x - dec) % 7, h = hachage(pl, 1, graine + 3);
    let k = u === 0 ? 1 : 3 + (h > 0.7 ? 1 : h < 0.2 ? -1 : 0) + (u === 1 ? 1 : 0) - (u === 6 ? 1 : 0); if (fbm(x * 0.7, y * 0.05, graine + h * 9) > 0.62 && u > 1 && u < 6) k -= 1;   // le fil du bois
    if (y < yE + 3) k -= 1; if (u === 3 && (y - yE) % 14 === 6) k = 5;   // un clou
    t.poser(x, y, 'chene', Math.max(0, Math.min(5, k))); } }
  for (let x = 0; x < L + penche + 2; x++) { t.poser(x, yR, 'cheneSombre', 4); t.poser(x, yR + 1, 'cheneSombre', 2); t.poser(x, yR + 2, 'suieX', 0); }   // la sablière de l'étage
  for (let cx = 6; cx < L - 6; cx += 20) for (let k = 0; k < 5; k++) for (let j = 0; j <= 4 - k; j++) t.poser(cx + j + penche, yR + 3 + k, 'cheneSombre', k === 0 ? 4 : 1 + (j === 0 ? 1 : 0));   // les corbeaux
  for (const fx of fenetres) { const x = Math.round(L * fx) - 7 + Math.round(penche / 2); fenetre5(t, x, yE + 13, 14, 18, { volet, g: graine + Math.round(fx * 9), pierre: false }); if (hachage(fx * 10, 1, graine) > 0.4) { for (let y = yE + 12; y < yE + 31; y++) t.poser(x + 17 + Math.round((y - yE - 12) * 0.28), y, volet, 2); } }
  const px = Math.round(L * porte) - 11; porte5(t, px, bas - 44, 22, 44, { arc: false, g: graine + 7, imposte: false, marches: true });
  fenetre5(t, Math.round(L * (porte < 0.5 ? 0.7 : 0.26)) - 8, yR + 14, 16, 18, { volet: null, g: graine + 8, pierre: true });
  // le toit : tuiles une à une, des tuiles neuves d'un autre ton, une planche clouée, de la mousse
  if (toitMat === 'chaume') toitChaume5(t, -1, L + penche + 3, M + 5, yE + 1, graine + 9); else if (toitMat === 'ardoiseToit') toitArdoises5(t, -1, L + penche + 3, M + 5, yE + 1, graine + 9); else toitTuiles5(t, -1, L + penche + 3, M + 5, yE + 1, toitMat, graine + 9);
  for (let n = 0; n < 7; n++) { const x = Math.floor(hachage(n, 1, graine + 10) * (L - 12)) + 6, y = M + 14 + Math.floor(hachage(n, 2, graine + 10) * (yE - M - 22)); if (!t.mat(x, y) || !t.mat(x + 6, y)) continue; for (let k = 0; k < 7; k++) for (let j = 0; j < 2; j++) t.poser(x + k, y + j, 'chene', j ? 1 : 4); t.poser(x + 1, y, 'fer', 5); t.poser(x + 5, y, 'fer', 5); }
  for (let x = -1; x < L + penche + 3; x++) { t.poser(x, yE + 3, 'cheneSombre', 2); t.poser(x, yE + 4, 'cheneSombre', 0); }
  gouttiere5(t, 0, L + penche, yE + 5, L + penche - 3, bas);
  const cx = Math.round(L * 0.74); cheminee5(t, cx, M + 7, 20, graine + 11, true); t.cheminee = [cx, M - 4];
  if (linge) { const y0 = yE + 22; for (let x = L - 30; x < L - 4; x++) { const y = y0 + Math.round(Math.sin((x - L + 30) / 26 * Math.PI) * 3); t.poser(x, y, 'chanvre', 2); if ((x - L + 30) % 9 < 6 && x < L - 8) for (let k = 1; k < 9; k++) t.poser(x, y + k, ['linB', 'linR', 'linBl'][Math.floor((x - L + 30) / 9) % 3], 3 - (k === 8 ? 1 : 0)); } }
  if (pots) { for (let n = 0; n < 3; n++) { const x = 6 + n * 7; for (let y = bas - 14; y < bas - 8; y++) for (let k = 0; k < 5; k++) t.poser(x + k, y, 'terreCuite', k === 0 ? 4 : k === 4 ? 1 : 3); t.poser(x + 2, bas - 15, 'feuilleV2', 4); t.poser(x + 1, bas - 16, 'fleurR2', 4); t.poser(x + 3, bas - 16, 'fleurJ2', 4); } }
  t.contour(); t.texture(s, cle); const tex = s.textures.get(cle); tex.cheminee = t.cheminee;
  tex.toit89 = { haut: M + 5, bas: yE + 1, chem: { cx, haut: M + 7, h: 20 }, lucarne: null };   // (pour la neige du Givre)
  return cle;
}
// ---- un banc public, à l'échelle d'une personne : 40 pixels de large (64 unités), assise à 11 de haut, dossier à 21 ----
// Vu de trois quarts d'en haut : le dossier (deux lames, contre le mur), le dessus de l'assise (clair, deux lames), la tranche
// avant (sombre), deux flancs de fonte à volutes avec accoudoirs, les pieds, l'ombre portée au sol.
function banc5(s, cle = 'banc5') {
  if (s.textures.exists(cle)) return cle;
  const L = 44, H = 28, t = toileM5(L, H), x0 = 2, x1 = L - 2;
  t.rampes.ombreSol = [0x1a1410, 0x241c14, 0x2e241a, 0x3a2e22, 0x463828, 0x524230];
  for (let x = x0 + 2; x < x1 + 2; x++) for (let k = 0; k < 3; k++) t.poser(x, H - 3 + k, 'ombreSol', 1);   // l'ombre au sol
  // le dossier : deux lames posées sur champ, entre deux montants ; on voit leur face et leur chant éclairé
  for (const [ya, hh] of [[0, 6], [8, 6]]) for (let y = ya; y < ya + hh; y++) for (let x = x0 + 2; x < x1 - 1; x++) t.poser(x, y, 'bancB', y === ya ? 5 : y === ya + hh - 1 ? 1 : (x - x0) % 13 === 0 ? 2 : 3 + (y === ya + 1 ? 1 : 0) + (hachage(x >> 3, y, 91) > 0.85 ? -1 : 0));
  for (let y = 14; y < 15; y++) for (let x = x0 + 2; x < x1 - 1; x++) t.poser(x, y, 'bancS', 1);
  // le dessus de l'assise : deux lames en perspective, la plus proche plus claire
  for (const [ya, hh, ton] of [[15, 4, 4], [19, 4, 5]]) for (let y = ya; y < ya + hh; y++) for (let x = x0; x < x1; x++) t.poser(x, y, 'bancB', y === ya + hh - 1 ? 2 : (x - x0) % 17 === 0 ? 2 : ton - (hachage(x >> 2, y, 92) > 0.9 ? 1 : 0));
  // la tranche avant de l'assise, dans l'ombre
  for (let x = x0; x < x1; x++) { t.poser(x, 23, 'bancS', 3); t.poser(x, 24, 'bancS', 1); }
  // les flancs : fonte, accoudoir en volute, pied qui s'évase
  for (const px of [x0 + 1, x1 - 4]) { for (let y = 12; y < 26; y++) for (let x = px; x < px + 3; x++) t.poser(x, y, 'fer2', x === px ? 4 : x === px + 2 ? 1 : 2);
    for (let x = px - 1; x < px + 4; x++) { t.poser(x, 12, 'fer2', 5); t.poser(x, 13, 'fer2', 2); }   // l'accoudoir
    for (let k = 0; k < 3; k++) t.poser(px + (px < L / 2 ? -1 - k : 3 + k), 25 + (k > 0 ? 0 : 0), 'fer2', 3);   // le pied évasé
    t.poser(px + 1, 22, 'fer', 5); }
  for (const x of [x0 + 12, L / 2, x1 - 12]) { t.poser(x, 3, 'fer', 5); t.poser(x, 11, 'fer', 5); }   // les boulons du dossier
  t.contour(); t.texture(s, cle); return cle;
}
// le parapet du sud : un garde-corps de pierre de taille, son chaperon éclairé, de la mousse et des herbes au pied
function parapet89(s, cle, L, { graine = 61 } = {}) {
  if (s.textures.exists(cle)) return cle;
  const H = 28, t = toileV2(L, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) {
    let mat = 'taille', k;
    if (y < 6) { k = y === 0 ? 5 : y === 1 ? 4 : y < 5 ? 3 : 1; if (x % 31 === 0) k = 1; }   // le chaperon (et ses joints)
    else if (y < 8) k = 0;   // l'ombre sous le chaperon
    else { const row = Math.floor((y - 8) / 7), dec = (row % 2) * 9, bx = (x + dec) % 18, by = (y - 8) % 7; k = bx === 0 || by === 0 ? 1 : 3 + (by === 1 ? 1 : 0) - (by === 6 ? 1 : 0) + Math.round((hachage(Math.floor((x + dec) / 18), row, graine) - 0.5) * 1.2); if (y > H - 5 && hachage(x, y, graine + 1) < 0.45) { mat = 'mousseT'; k = 2 + (hachage(x, 2, graine) > 0.5 ? 1 : 0); } }
    t.poser(x, y, mat, k);
  }
  for (let n = 0; n < L / 9; n++) { const x = Math.floor(hachage(n, 3, graine) * L); for (let k = 0; k < 3; k++) t.poser(x + k - 1, H - 2 - (k === 1 ? 2 : 1), 'herbeB', k === 1 ? 4 : 3); if (n % 4 === 0) { t.poser(x, H - 5, 'fleurJ2', 4); } }
  t.contour(); t.texture(s, cle); return cle;
}
// un mur qui court vers le nord (on ne voit que son chaperon et un peu de sa face ouest, dans l'ombre)
function murLong89(s, cle, H, { graine = 62, mat = 'taille' } = {}) {
  if (s.textures.exists(cle)) return cle;
  const L = 12, t = toileV2(L, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) {
    if (x < 6) t.poser(x, y, mat, (y % 14 === 0 ? 2 : x === 0 ? 5 : 4));
    else { const by = (y + (x > 8 ? 3 : 0)) % 7; t.poser(x, y, mat, by === 0 ? 0 : x === 6 ? 1 : 2); }
  }
  t.contour(); t.texture(s, cle); return cle;
}
// un poteau indicateur (les planchettes en flèche sont posées par la scène, avec leur texte)
function poteau89(s, cle = 'poteau89', h = 70) {
  if (s.textures.exists(cle)) return cle;
  const t = toileV2(10, h);
  for (let y = 0; y < h; y++) for (let x = 2; x < 8; x++) t.poser(x, y, 'chene', x === 2 ? 4 : x === 7 ? 1 : 2 + (hachage(x, y >> 2, 64) > 0.8 ? 1 : 0));
  for (let x = 1; x < 9; x++) { t.poser(x, 0, 'chene', 5); t.poser(x, h - 1, 'chene', 1); }
  t.contour(); t.texture(s, cle); return cle;
}
// une planchette en flèche
function fleche89(s, l, sens) {
  const cle = 'fleche89_' + l + '_' + sens; if (s.textures.exists(cle)) return cle;
  const h = 12, t = toileV2(l, h);
  planche(t, 0, 0, l, h, 'chene', { graine: 65 + l });
  for (let y = 0; y < h; y++) { const c = Math.abs(y + 0.5 - h / 2); for (let k = 0; k < 6; k++) { const x = sens > 0 ? l - 1 - k : k; if (k < 6 - Math.round(c * 1.1)) continue; t.c[y * l + x] = null; t.m[y * l + x] = null; } }
  for (let x = 0; x < l; x++) { if (t.mat(x, 0)) t.poser(x, 0, 'chene', 5); if (t.mat(x, h - 1)) t.poser(x, h - 1, 'chene', 1); }
  t.contour(); t.texture(s, cle); return cle;
}
// des bouffées de fumée, de plus en plus pâles en montant (une image, pour une planche ; dans le jeu, bouffeeFumee)
function fumee89(s) {
  const cle = 'fumee89v2'; if (s.textures.exists(cle)) return cle;
  const t = toileV2(30, 46);
  for (const [cx, cy, r] of [[14, 41, 4], [17, 33, 5.5], [13, 22, 7], [19, 10, 7.5]]) t.forme('fumeeV', ellipsoide(cx, cy, r, r * 0.85), { decalage: 0.6, bord: false });
  t.texture(s, cle); return cle;
}
// une haie taillée (vue de face), pour fermer les jardins
function haie89(s, cle, L, { graine = 66 } = {}) {
  if (s.textures.exists(cle)) return cle;
  const H = 22, t = toileV2(L, H);
  t.forme('feuilleV2', (x, y) => (y >= 3 + Math.round(Math.sin(x / 5) * 1.2) && y < H ? [-(x / L - 0.5) * 0.4, (y < 7 ? -0.6 : 0.2), 0.7] : null), { motif: (x, y) => (fbm(x * 0.3, y * 0.3, graine) - 0.5) * 1.6 });
  t.contour(); t.texture(s, cle); return cle;
}
// un bac de pierre plein de fleurs (pour les trottoirs et la placette)
function bacFleurs89(s, cle = 'bacFleurs89', fleur = 'fleurR2') {
  if (s.textures.exists(cle)) return cle;
  const t = toileV2(30, 20);
  for (let y = 9; y < 20; y++) for (let x = 1; x < 29; x++) t.poser(x, y, 'taille', y === 9 ? 5 : y === 19 ? 1 : x < 4 ? 4 : x > 25 ? 2 : 3);
  for (let n = 0; n < 40; n++) { const x = 2 + Math.floor(hachage(n, 1, 67) * 26), y = 2 + Math.floor(hachage(n, 2, 67) * 8); t.forme(n % 3 ? 'feuilleV2' : 'feuilleC2', ellipsoide(x, y, 2, 1.6), { ombre: false }); }
  for (let n = 0; n < 12; n++) { const x = 3 + Math.floor(hachage(n, 3, 67) * 24), y = 1 + Math.floor(hachage(n, 4, 67) * 7); t.poser(x, y, fleur, 4); t.poser(x + 1, y, fleur, 3); t.poser(x, y - 1, fleur, 5); }
  t.contour(); t.texture(s, cle); return cle;
}
// le puits de la cour : la margelle ronde de pierre, deux montants, un petit toit de tuiles, le treuil, le seau
function puits89(s, cle = 'puits89') {
  if (s.textures.exists(cle)) return cle;
  const L = 44, H = 64, t = toileV2(L, H), cx = 22;
  // la margelle : un cylindre de pierres, le haut en ellipse
  for (let y = 40; y < 62; y++) for (let x = 4; x < 40; x++) { const nx = (x + 0.5 - cx) / 18; if (Math.abs(nx) > 1) continue; const yb = 58 + Math.round(Math.sqrt(1 - nx * nx) * 3); if (y > yb) continue;
    const row = Math.floor((y - 40) / 5), bx = (x + row * 4) % 9; t.poser(x, y, 'taille', bx === 0 || (y - 40) % 5 === 0 ? 1 : Math.round(3.4 - nx * 1.4)); }
  t.forme('taille', ellipsoide(cx, 41, 18, 5), { decalage: 0.8, ombre: false });
  t.rampes.eauFond = [0x0a1a24, 0x10283a, 0x16364c, 0x1e4660, 0x285a78, 0x346e90]; t.forme('eauFond', ellipsoide(cx, 41, 14, 3), { decalage: -1, bord: false, ombre: false });
  // les montants, la traverse et le treuil, le toit
  for (const px of [7, 35]) for (let y = 12; y < 44; y++) for (let x = px; x < px + 3; x++) t.poser(x, y, 'chene', x === px ? 4 : 2);
  for (let x = 8; x < 37; x++) { t.poser(x, 24, 'chene', 4); t.poser(x, 25, 'chene', 2); t.poser(x, 26, 'cheneSombre', 1); }
  for (let y = 22; y < 29; y++) t.poser(39, y, 'fer', 2); for (let x = 37; x < 41; x++) t.poser(x, 28, 'fer', 3);
  for (let y = 27; y < 36; y++) t.poser(cx, y, 'chanvre', 3);
  for (let y = 36; y < 42; y++) for (let x = cx - 3; x <= cx + 3; x++) t.poser(x, y, 'chene', y === 36 ? 4 : x < cx ? 3 : 2); for (let x = cx - 3; x <= cx + 3; x++) t.poser(x, 38, 'fer', 2);
  toitRue(t, 2, 42, 3, 14, 'tuile', 68);
  t.contour(); t.texture(s, cle); return cle;
}
// le muret d'un jardin, vu de face, et sa petite grille de fer au milieu
function murJardin89(s, cle, L) {
  if (s.textures.exists(cle)) return cle;
  const H = 26, t = toileV2(L, H), gx = Math.round(L / 2) - 10;
  for (let y = 6; y < H; y++) for (let x = 0; x < L; x++) {
    if (x >= gx && x < gx + 20) continue;
    if (y < 10) { t.poser(x, y, 'taille', y === 6 ? 5 : y === 9 ? 1 : 3); continue; }
    const row = Math.floor((y - 10) / 5), bx = (x + (row % 2) * 6) % 12; t.poser(x, y, 'pierre', bx === 0 || (y - 10) % 5 === 0 ? 1 : 3 + (hachage(Math.floor((x + (row % 2) * 6) / 12), row, 69) > 0.7 ? 1 : 0) - (y > H - 3 ? 1 : 0));
  }
  for (const px of [gx - 3, gx + 20]) for (let y = 2; y < H; y++) for (let x = px; x < px + 3; x++) t.poser(x, y, 'taille', y === 2 ? 5 : x === px ? 4 : 2);
  for (let x = gx; x < gx + 20; x += 3) for (let y = 4; y < H - 1; y++) t.poser(x, y, 'fer', 2 + (y === 4 ? 2 : 0));
  for (const yy of [6, 14, H - 3]) for (let x = gx; x < gx + 20; x++) t.poser(x, yy, 'fer', 3);
  for (let x = gx; x < gx + 20; x++) { const y = 3 + Math.round(Math.abs(x - gx - 10) * 0.15); t.poser(x, y, 'fer', 4); }
  // le lierre et les roses qui débordent du muret
  for (let n = 0; n < L / 4; n++) { const x = Math.floor(hachage(n, 1, 70) * L); if (x >= gx - 4 && x < gx + 24) continue; t.forme(n % 2 ? 'feuilleV2' : 'feuilleC2', ellipsoide(x, 5 + hachage(n, 2, 70) * 4, 2.6, 2), { ombre: false }); if (n % 3 === 0) { t.poser(x, 4, 'fleurP2', 4); t.poser(x + 1, 4, 'fleurP2', 3); } }
  t.contour(); t.texture(s, cle); return cle;
}
const GRES6 = 0xc0b298;
function descente6(s, cle, l, h) {
  if (s.textures.exists(cle)) return cle;
  const t = toileM5(l, h + 12); t.rampes.gres6 = rampe(GRES6); t.rampes.moel6 = rampe(0x8e8270);
  for (const c0 of [0, l - 9]) {
    for (let y = 0; y < h; y++) for (let x = c0; x < c0 + 9; x++) {   // la couvertine : de longues pierres, une arête éclairée, un joint tous les 14
      const j = y % 14 === 13, u = x - c0; let k = u === 0 ? 5 : u === 8 ? 1 : u === 1 ? 4 : 3; if (j) k = 1; else if (y % 14 === 0) k = Math.min(5, k + 1);
      if (hachage(Math.floor(y / 14), c0, 9601) > 0.8 && !j && u > 0 && u < 8) k -= 1; t.poser(x, y, 'gres6', k); }
    for (let y = h; y < h + 12; y++) for (let x = c0; x < c0 + 9; x++) {   // le bout du muret, en bas : sa face de moellons
      const row = Math.floor((y - h) / 4), u = (x - c0 + row * 3) % 6; t.poser(x, y, 'moel6', y === h ? 4 : (y - h) % 4 === 3 || u === 5 ? 1 : 3 - (y > h + 8 ? 1 : 0)); }
    // le garde-corps : la main courante de fer, ses poteaux à boule tous les 10 pixels
    const xr = c0 + 4;
    for (let y = 0; y < h - 1; y++) { t.poser(xr, y, 'fer', 4); t.poser(xr + 1, y, 'fer', 1); }
    for (let y = 2; y < h - 2; y += 10) { for (const [a, b, k] of [[-1, 0, 3], [0, 0, 5], [1, 0, 3], [2, 0, 1], [-1, 1, 2], [0, 1, 4], [1, 1, 2], [2, 1, 0], [0, -1, 4], [1, -1, 2]]) t.poser(xr + a, y + b, 'fer', k); }
  }
  t.contour(); t.texture(s, cle); return cle;
}
function pilier6(s, cle = 'pilier6') {
  if (s.textures.exists(cle)) return cle;
  const L = 12, H = 36, t = toileM5(L, H); t.rampes.gres6 = rampe(GRES6);
  for (let y = 8; y < H; y++) for (let x = 1; x < L - 1; x++) t.poser(x, y, 'gres6', x === 1 ? 5 : x === L - 2 ? 1 : y % 9 === 8 ? 2 : 3);
  for (let y = 5; y < 8; y++) for (let x = 0; x < L; x++) t.poser(x, y, 'gres6', y === 5 ? 5 : y === 7 ? 1 : 4);   // le chapeau
  t.forme('gres6', ellipsoide(6, 3, 3.2, 2.6), { decalage: 0.6 });   // la boule
  t.contour(); t.texture(s, cle); return cle;
}
const FONT81 = { L: 128, H: 100, cx: 64, rebordY: 62, rx: 58, ry: 10, eauRx: 51, eauRy: 7, paroi: 22, vasqueY: 27, vasqueRx: 17, lionY: 45, boule: 15 };
function fontaineRue81(s) {
  if (s.textures.exists('fontaineRue81_bas')) return;
  const F = FONT81;
  const rampesF = t => {
    t.rampes.pierre = rampe(0xb8a07a); t.rampes.mousse = rampe(0x5a7a3a); t.rampes.bronze = rampe(0x4a8a78);
    t.rampes.lierre = rampe(0x2e6a26); t.rampes.lierreC = rampe(0x4a8a30); t.rampes.fougere = rampe(0x4a8a34);
    t.rampes.iris = rampeVive(0x6a4ac8); t.rampes.tige = rampe(0x3a6a2a); t.rampes.galet = rampe(0x5a6a6a); t.rampes.feuilleMorte = rampe(0xa8783a);
    t.rampes.eauFond = [0x0a1a24, 0x10283a, 0x16364c, 0x1e4660, 0x285a78, 0x346e90];
    t.rampes.paquerette = [0x8a8a7a, 0xb8b8a8, 0xdadacc, 0xf0f0e4, 0xffffff, 0xffffff];
  };
  const dans = (x, y, cx, cy, rx, ry) => ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1;
  // ---------- le bas : bassin, margelle, paroi, marche ----------
  {
    const t = toileDecor(F.L, F.H); rampesF(t);
    const cx = F.cx, cy = F.rebordY;
    // la marche (le socle), un peu plus large que le bassin
    const rs = F.rx + 4;
    for (let x = cx - rs; x <= cx + rs; x++) {
      const nx = (x + 0.5 - cx) / rs; if (Math.abs(nx) > 1) continue;
      const haut = Math.round(cy + F.paroi + (F.ry + 1.5) * Math.sqrt(1 - nx * nx)) - 2, bas = haut + 5;
      for (let y = haut; y <= bas; y++) t.poser(x, y, 'pierre', y === haut ? 5 : y === bas ? 1 : Math.round(3 - nx * 1.2) - (y > haut + 2 ? 1 : 0));
      if ((x - cx + 200) % 21 === 0) for (let y = haut + 1; y < bas; y++) t.poser(x, y, 'pierre', 1);   // (les joints des dalles)
    }
    // la paroi du bassin : des blocs taillés, une frise sous la margelle, une coquille sculptée au milieu
    for (let x = cx - F.rx; x <= cx + F.rx; x++) {
      const nx = (x + 0.5 - cx) / F.rx; if (Math.abs(nx) > 1) continue;
      const haut = cy + F.ry * Math.sqrt(1 - nx * nx), bas = haut + F.paroi;
      for (let y = Math.floor(haut); y <= bas; y++) {
        const joint = Math.round(x - cx) % 16 === 0 && y > haut + 10 || Math.abs(y - (haut + 15)) < 0.6;
        let ton = Math.round(3.2 - nx * 1.5 - Math.abs(nx) * 0.9) + (joint ? -2 : 0);
        if (fbm(x * 0.5, y * 0.09, 8101) > 0.66 && y > haut + 4) ton -= 1;                    // les coulures d'humidité
        if (y > bas - 4 && hachage(x, y, 8102) > 0.42) { t.poser(x, y, 'mousse', 2 + Math.round(hachage(x, 1, 8103) * 2)); continue; }
        t.poser(x, y, 'pierre', ton);
      }
      // la frise : deux sillons, et des oves en relief entre eux
      const h0 = Math.round(haut) + 2, sh = Math.round(-nx * 1.5);
      t.poser(x, h0, 'pierre', 1 + sh); t.poser(x, h0 + 7, 'pierre', 1 + sh);
      const m = ((x - cx) % 8 + 8) % 8;
      for (let j = 1; j < 7; j++) { const d = Math.hypot((m - 3.5) / 3.2, (j - 3.5) / 2.8); if (d < 1) t.poser(x, h0 + j, 'pierre', (d < 0.5 ? 5 : 4) + sh - (m > 4 && j > 3 ? 1 : 0)); else if (d < 1.25) t.poser(x, h0 + j, 'pierre', 1 + sh); }
    }
    // la coquille sculptée, au milieu de la paroi
    { const sx = cx, sy = cy + F.ry + 17;
      for (let y = sy - 6; y <= sy; y++) for (let x = sx - 7; x <= sx + 7; x++) {
        const dx = x + 0.5 - sx, dy = y + 0.5 - sy, r = Math.hypot(dx, dy * 1.15); if (r > 7 || dy > 0) continue;
        const a = Math.atan2(-dy, dx), cote = Math.floor(a / Math.PI * 9);
        t.poser(x, y, 'pierre', r > 6.2 ? 1 : (cote % 2 ? 4 : 2) + (dx < 0 ? 1 : 0));
      }
      for (let x = sx - 2; x <= sx + 2; x++) t.poser(x, sy + 1, 'pierre', 2);
    }
    // la margelle : un anneau de pierre claire, épais ; le fond d'eau sombre au milieu (un peu plus bas que le bord)
    for (let y = cy - F.ry - 1; y <= cy + F.ry + 1; y++) for (let x = cx - F.rx - 1; x <= cx + F.rx + 1; x++) {
      if (!dans(x, y, cx, cy, F.rx, F.ry)) continue;
      if (dans(x, y, cx, cy, F.eauRx, F.eauRy)) {
        if (dans(x, y, cx, cy + 1.2, F.eauRx - 0.5, F.eauRy - 0.6)) t.poser(x, y, 'eauFond', 1 + Math.round((y - cy + F.eauRy) / (2 * F.eauRy) * 2.2));
        else t.poser(x, y, 'pierre', y < cy ? 2 : 3);   // (la paroi intérieure, au-dessus de l'eau)
        continue;
      }
      const devant = y > cy, bordExt = !dans(x, y + 1, cx, cy, F.rx, F.ry);
      t.poser(x, y, 'pierre', bordExt && devant ? 5 : devant ? 4 : 5 - (hachage(x >> 2, y, 8104) > 0.8 ? 1 : 0));
    }
    // au fond de l'eau : des galets, une feuille tombée
    for (let k = 0; k < 26; k++) { const x = Math.round(cx + (hachage(k, 1, 8105) - 0.5) * 2 * (F.eauRx - 6)), y = Math.round(cy + 1 + hachage(k, 2, 8105) * (F.eauRy - 2));
      if (t.mat(x, y) === 'eauFond') { t.poser(x, y, 'galet', 2 + Math.round(hachage(k, 3, 8105) * 2)); if (hachage(k, 4, 8105) > 0.5) t.poser(x + 1, y, 'galet', 2); } }
    for (const [x, y] of [[cx - 30, cy + 3], [cx + 22, cy + 4]]) { t.poser(x, y, 'feuilleMorte', 3); t.poser(x + 1, y, 'feuilleMorte', 4); t.poser(x + 2, y + 1, 'feuilleMorte', 2); }
    // le lierre qui grimpe sur la paroi, à gauche, et retombe par-dessus la margelle
    for (const [x0, k0, n] of [[cx - F.rx + 5, 0, 30], [cx - F.rx + 14, 7, 20]]) {
      let x = x0, y = F.H - 4;
      for (let k = 0; k < n; k++) {
        x += Math.round(Math.sin((k + k0) * 0.9) * 1.2); y -= 1.1;
        if (y < cy - 1) break;
        t.poser(x, Math.round(y), 'tige', 2);
        if (k % 2 === 0) { const sx = k % 4 === 0 ? -2 : 2; t.forme(k % 3 ? 'lierre' : 'lierreC', ellipsoide(x + sx, Math.round(y), 2.2, 1.6), { decalage: 0.2 + (k % 3) * 0.25, bord: false, ombre: false });
          t.poser(x + sx + (sx < 0 ? -1 : 1), Math.round(y) - 1, k % 3 ? 'lierre' : 'lierreC', 4); }
      }
    }
    // des fougères dans un joint, à droite
    for (const [fx, fy] of [[cx + 38, cy + F.ry + 14], [cx + 46, cy + F.ry + 10]]) for (const [a, l] of [[-2.4, 5], [-1.9, 6], [-1.3, 6], [-0.8, 5]]) {
      for (let k = 1; k <= l; k++) { const x = Math.round(fx + Math.cos(a) * k), y = Math.round(fy + Math.sin(a) * k + k * k * 0.06); t.poser(x, y, 'fougere', 3 - (k > l - 2 ? 1 : 0)); if (k % 2 === 0) t.poser(x + 1, y, 'fougere', 4); }
    }
    // des iris au pied, à droite : de longues feuilles en lame, trois fleurs violettes
    { const ix = cx + F.rx - 2, sol = F.H - 1;
      for (const [dx, h, pente] of [[-4, 20, -0.25], [-2, 25, -0.1], [0, 28, 0.05], [2, 23, 0.18], [4, 17, 0.32], [6, 12, 0.45]]) for (let k = 0; k < h; k++) { const x = Math.round(ix + dx + pente * k + (k * k * pente * 0.012)), y = sol - k; t.poser(x, y, 'tige', 2 + (k > h * 0.6 ? 1 : 0) + (dx < 1 ? 1 : 0)); }
      for (const [fx, fy] of [[ix - 1, sol - 31], [ix + 6, sol - 25], [ix - 6, sol - 24]]) {
        for (let k = 0; k < 7; k++) t.poser(Math.round(fx + (k > 3 ? 0 : 0)), fy + k + 3, 'tige', 3);
        t.forme('iris', ellipsoide(fx, fy, 2.2, 2.6), { decalage: 0.5, ombre: false });
        t.forme('iris', ellipsoide(fx - 2.2, fy + 2.4, 1.8, 1.3), { decalage: -0.2, ombre: false }); t.forme('iris', ellipsoide(fx + 2.4, fy + 2.4, 1.8, 1.3), { decalage: -0.2, ombre: false });
        t.poser(fx, fy + 1, 'or', 5); t.poser(fx, fy + 2, 'or', 4);
      }
    }
    // des pâquerettes et de la mousse au pied de la marche, à gauche
    for (let k = 0; k < 7; k++) { const x = 6 + Math.round(hachage(k, 1, 8107) * 22), y = F.H - 2 - Math.round(hachage(k, 2, 8107) * 2); t.poser(x, y, 'tige', 3); t.poser(x, y - 1, 'paquerette', 4); t.poser(x - 1, y - 1, 'paquerette', 3); t.poser(x + 1, y - 1, 'paquerette', 3); t.poser(x, y - 2, 'paquerette', 4); t.poser(x, y - 1, 'or', 5); }
    // l'anneau de fer scellé dans la margelle, la chaîne et le gobelet d'étain (on boit à la fontaine)
    { const ax = cx + 30, ay = cy + 8;
      t.poser(ax, ay, 'fer', 4); t.poser(ax + 1, ay, 'fer', 2); t.poser(ax, ay + 1, 'fer', 2);
      for (let k = 1; k < 9; k++) t.poser(ax + Math.round(k * 0.6), ay + k, 'fer', k % 2 ? 4 : 2);
      t.forme('fer', (x, y) => (x >= ax + 3 && x <= ax + 7 && y >= ay + 9 && y <= ay + 14 && Math.abs(x + 0.5 - (ax + 5)) <= 2 + (y - ay - 9) * 0.1 ? [(x + 0.5 - ax - 5) / 3, 0, 0.8] : null), { decalage: 0.9 });
      t.poser(ax + 4, ay + 9, 'fer', 1); t.poser(ax + 5, ay + 9, 'fer', 1); t.poser(ax + 6, ay + 9, 'fer', 1);
    }
    t.contour(); t.texture(s, 'fontaineRue81_bas');
  }
  // ---------- le haut : la colonne, les mufles, la vasque, la boule ----------
  {
    const t = toileDecor(F.L, F.H); rampesF(t);
    const cx = F.cx;
    for (let y = F.vasqueY + 6; y <= F.rebordY; y++) for (let x = cx - 5; x <= cx + 5; x++) {
      const n = (x + 0.5 - cx) / 5.5;
      t.poser(x, y, 'pierre', Math.round(3.4 - n * 1.6 - Math.abs(n) * 0.8 + ((x - cx + 5) % 3 === 0 ? -1 : 0)) - (y > F.rebordY - 3 ? 1 : 0));
    }
    for (const yb of [F.lionY + 8, F.vasqueY + 9]) t.forme('pierre', ellipsoide(cx, yb, 7, 2), { decalage: 0.6 });
    t.forme('pierre', ellipsoide(cx, F.rebordY - 1, 7.5, 2.2, (x, y) => y <= F.rebordY), { decalage: 0.2 });   // (la base, qui sort de l'eau)
    // les deux mufles de lion en bronze vert-de-gris : l'eau sort de leur gueule
    for (const sens of [-1, 1]) {
      const lx = cx + sens * 6, ly = F.lionY;
      t.forme('bronze', ellipsoide(lx, ly, 4.2, 4.6), { decalage: -0.5, motif: (x, y) => ((Math.round(Math.atan2(y + 0.5 - ly, x + 0.5 - lx) * 2.6) % 2) ? -0.7 : 0.2) });   // (la crinière)
      t.forme('bronze', ellipsoide(lx + sens * 1.2, ly + 0.2, 2.6, 2.8), { decalage: 0.7 });                                                                            // (la face)
      t.forme('bronze', ellipsoide(lx + sens * 3, ly + 1.4, 1.8, 1.5), { decalage: 1.1 });                                                                              // (le museau)
      t.poser(Math.round(lx + sens * 1.2), ly - 1, 'encre', 1);                                                                                                         // (l'œil)
      t.poser(Math.round(lx + sens * 4.4), ly + 2, 'encre', 0); t.poser(Math.round(lx + sens * 3.6), ly + 2, 'eauFond', 1);                                              // (la gueule ouverte)
    }
    // la vasque haute : le dessous en coupe, le rebord, son eau ; deux becs où l'eau déborde
    t.forme('pierre', (x, y) => (y >= F.vasqueY && y <= F.vasqueY + 7 && Math.abs(x + 0.5 - cx) <= F.vasqueRx - (y - F.vasqueY) * 1.6 ? [(x + 0.5 - cx) / F.vasqueRx, 0.5, 0.7] : null), { decalage: -0.3, motif: (x, y) => ((x - cx + 40) % 4 === 0 ? -0.6 : 0) });
    t.forme('pierre', ellipsoide(cx, F.vasqueY, F.vasqueRx, 4), { decalage: 0.9 });
    t.forme('eauFond', ellipsoide(cx, F.vasqueY - 0.5, F.vasqueRx - 3, 2.2), { decalage: 2.4, bord: false, ombre: false });
    for (const sens of [-1, 1]) t.forme('pierre', ellipsoide(cx + sens * (F.vasqueRx + 0.5), F.vasqueY + 0.5, 2, 1.4), { decalage: 0.6 });
    // le petit pied, la boule
    for (let y = F.boule + 4; y < F.vasqueY - 2; y++) for (let x = cx - 2; x <= cx + 2; x++) t.poser(x, y, 'pierre', x < cx ? 4 : 2);
    t.forme('pierre', ellipsoide(cx, F.boule, 4.5, 4.5), { decalage: 0.5 });
    t.forme('mousse', ellipsoide(cx + 2, F.boule + 3.5, 2.4, 1), { decalage: 0.2, bord: false, ombre: false });   // (de la mousse, là où l'eau ruisselle)
    t.contour(); t.texture(s, 'fontaineRue81_haut');
  }
}
// ---------- les objets de la rue (×2, comme les façades) ----------
function objetsRue81(s) {
  if (s.textures.exists('seau81')) return;
  const T = (l, h) => { const t = toileDecor(l, h); Object.assign(t.rampes, { terre: rampe(0xb8603a), feuille: rampe(0x3e7a30), feuilleC: rampe(0x5a9a3a), fleurR: rampeVive(0xd8323e), fleurP: rampeVive(0xe86a9a), fleurB: rampeVive(0xf0eee0),
    pomme: rampeVive(0xc8382a), pommeV: rampeVive(0x8ab030), osier: rampe(0xb08a4a), lait: rampe(0x9aa0a8), buche: rampe(0x8a6a44), aubier: rampe(0xd8b07a), herbe: rampe(0x4a8a34), jaune: rampeVive(0xf0c020),
    paille: rampe(0xd8b048), linB: rampe(0xe8e4d8), linR: rampeVive(0xb83a2a), linBl: rampeVive(0x3a6ab0), romarin: rampe(0x4a6a4a), nenu: rampe(0x3a7a3a), rose: rampeVive(0xf0a0c0), tige: rampe(0x3a6a2a) }); return t; };
  // le seau de bois cerclé de fer, son anse de corde
  { const t = T(12, 13);
    t.forme('chene', (x, y) => (y >= 4 && y <= 12 && Math.abs(x + 0.5 - 6) <= 5 - (12 - y) * 0.08 ? [(x + 0.5 - 6) / 5.5, 0, 0.8] : null), { motif: (x, y) => (x % 2 ? -0.5 : 0) });
    for (const y of [5, 10]) for (let x = 1; x <= 10; x++) t.poser(x, y, 'fer', x < 4 ? 4 : 2);
    t.rampes.eauFond = [0x10283a, 0x16364c, 0x1e4660, 0x285a78, 0x346e90, 0x5a9ac0]; t.forme('eauFond', ellipsoide(6, 4, 4.5, 1.2), { bord: false, ombre: false });
    for (let a = 0; a <= Math.PI; a += 0.2) t.poser(Math.round(6 - Math.cos(a) * 5), Math.round(4 - Math.sin(a) * 3.5), 'chanvre', 3);
    t.contour(); t.texture(s, 'seau81'); }
  // le pot de terre cuite et ses géraniums rouges (sur la margelle)
  { const t = T(14, 15);
    t.forme('terre', (x, y) => (y >= 8 && y <= 14 && Math.abs(x + 0.5 - 7) <= 4.5 - (y - 8) * 0.15 ? [(x + 0.5 - 7) / 5, 0, 0.8] : null));
    t.forme('terre', ellipsoide(7, 8, 5.2, 1.4), { decalage: 0.6 });
    for (const [x, y] of [[3, 6], [6, 5], [10, 6], [8, 7], [4, 8], [11, 8], [2, 9]]) t.forme(x % 2 ? 'feuille' : 'feuilleC', ellipsoide(x, y, 2.2, 1.6), { decalage: 0.2, ombre: false });
    for (const [x, y] of [[4, 2], [8, 1], [11, 3]]) { t.forme('fleurR', ellipsoide(x, y, 2, 1.8), { decalage: 0.4, ombre: false }); t.poser(x, y, 'fleurR', 5); t.poser(x, y + 2, 'tige', 2); }
    t.contour(); t.texture(s, 'potGeranium81'); }
  // les feuilles de nénuphar (deux tailles) et une fleur rose
  for (const [cle, rx, ry] of [['nenuphar81a', 4.6, 1.6], ['nenuphar81b', 3.4, 1.2]]) { const t = T(11, 5);
    t.forme('nenu', ellipsoide(5.5, 2.5, rx, ry, (x, y) => !(x >= 5 && x <= 7 && y <= 2)), { decalage: 0.4 });
    t.poser(5, 2, 'nenu', 1); t.contour(); t.texture(s, cle); }
  { const t = T(7, 5); for (const [x, y, i] of [[1, 3, 3], [2, 2, 4], [3, 1, 5], [4, 2, 4], [5, 3, 3], [2, 3, 4], [3, 3, 5], [4, 3, 4], [3, 2, 5]]) t.poser(x, y, 'rose', i); t.poser(3, 3, 'jaune', 5); t.poser(2, 4, 'nenu', 3); t.poser(3, 4, 'nenu', 3); t.poser(4, 4, 'nenu', 3); t.contour(); t.texture(s, 'fleurNenuphar81'); }
  // une jardinière de bois sous une fenêtre, débordante de géraniums (rouges ou roses), qui retombent
  for (const [cle, fl, l] of [['jardiniere81r', 'fleurR', 24], ['jardiniere81p', 'fleurP', 24]]) { const t = T(l + 2, 16);
    for (let k = 0; k < 2; k++) planche(t, 1, 9 + k * 3, l, 3, 'chene', { graine: 8150 + k + l, noeuds: 0 });
    for (const x of [1, l]) for (let y = 9; y < 15; y++) t.poser(x, y, 'fer', y === 9 ? 4 : 2);
    for (let x = 1; x <= l; x++) t.poser(x, 15, 'cheneSombre', 1);
    for (let k = 0; k < 13; k++) { const x = 2 + Math.round(hachage(k, 1, 8160 + l) * (l - 3)), y = 6 + Math.round(hachage(k, 2, 8160 + l) * 3); t.forme(k % 2 ? 'feuille' : 'feuilleC', ellipsoide(x, y, 2.2, 1.7), { decalage: 0.1, ombre: false }); }
    for (const [x0, n] of [[4, 5], [l - 5, 4], [l / 2, 3]]) for (let k = 0; k < n; k++) { t.poser(Math.round(x0 + Math.sin(k) * 0.6), 10 + k, 'feuille', 2 + (k % 2)); if (k % 2) t.poser(Math.round(x0 + 1), 10 + k, 'feuilleC', 3); }   // (les tiges qui retombent devant)
    for (const [x, y] of [[3, 3], [7, 2], [11, 4], [15, 2], [19, 3], [22, 4], [5, 6], [17, 6]]) if (x < l) { t.forme(fl, ellipsoide(x, y, 1.9, 1.7), { decalage: 0.5, ombre: false }); t.poser(x, y, fl, 5); }
    for (const [x, y] of [[4, 14], [l - 4, 13]]) { t.forme(fl, ellipsoide(x, y, 1.4, 1.2), { decalage: 0.3, ombre: false }); }
    t.contour(); t.texture(s, cle); }
  // le lierre qui grimpe au coin d'une maison (de la rue jusqu'à l'étage)
  { const L = 18, H = 112, t = T(L, H); t.rampes.lierre = rampe(0x2e6a26); t.rampes.lierreC = rampe(0x4a8a30); t.rampes.tigeL = rampe(0x5a4a30);
    const brins = [[6, H - 1, 0], [11, H - 1, 3], [8, H - 40, 5]];
    for (const [x0, y0, g] of brins) { let x = x0, y = y0;
      for (let k = 0; k < 140; k++) { x += Math.sin(k * 0.21 + g) * 0.45; x = Math.max(3, Math.min(L - 4, x)); y -= 0.8; if (y < 2) break;
        t.poser(Math.round(x), Math.round(y), 'tigeL', 2);
        const dens = y > H * 0.5 ? 0.62 : 0.42;
        if (hachage(k, g, 8170) < dens) { const sx = hachage(k, g + 1, 8170) < 0.5 ? -2 : 2, m = hachage(k, g + 2, 8170) < 0.4 ? 'lierreC' : 'lierre';
          t.forme(m, ellipsoide(x + sx, y, 2.3, 1.7), { decalage: 0.1 + hachage(k, g + 3, 8170) * 0.7, bord: false, ombre: false });
          t.poser(Math.round(x + sx * 1.6), Math.round(y) - 1, m, 4); } } }
    t.contour(); t.texture(s, 'lierreMur81'); }
  // le balai de bruyère, appuyé au mur
  { const t = T(10, 46);
    for (let y = 0; y < 32; y++) { t.poser(5, y, 'chene', 4); t.poser(6, y, 'chene', 2); }
    for (const y of [31, 33]) for (let x = 3; x <= 7; x++) t.poser(x, y, 'chanvre', 3);
    t.forme('paille', (x, y) => (y >= 32 && y <= 45 && Math.abs(x + 0.5 - 5.5) <= 2 + (y - 32) * 0.22 ? [(x - 5) / 5, 0.2, 0.8] : null), { motif: (x, y) => (x % 2 ? -0.7 : 0) });
    t.contour(); t.texture(s, 'balai81'); }
  // une paire de sabots sur le pas de la porte
  { const t = T(16, 6);
    for (const x0 of [1, 8]) { t.forme('chene', ellipsoide(x0 + 3.5, 3.4, 3.6, 2.4, (x, y) => y >= 1), { decalage: 0.3 }); t.forme('cheneSombre', ellipsoide(x0 + 4.5, 2, 1.6, 0.8), { bord: false, ombre: false }); }
    t.contour(); t.texture(s, 'sabots81'); }
  // le bidon de lait (le laitier est passé)
  { const t = T(10, 15);
    t.forme('lait', (x, y) => (y >= 5 && y <= 14 && Math.abs(x + 0.5 - 5) <= 4 ? [(x + 0.5 - 5) / 4.5, 0, 0.8] : null), { decalage: 0.4 });
    t.forme('lait', (x, y) => (y >= 2 && y <= 5 && Math.abs(x + 0.5 - 5) <= 2.4 ? [(x + 0.5 - 5) / 3, 0, 0.8] : null), { decalage: 0.6 });
    t.forme('lait', ellipsoide(5, 2, 3, 1.2), { decalage: 0.8 });
    for (let x = 1; x <= 8; x++) t.poser(x, 9, 'lait', 1);
    t.contour(); t.texture(s, 'bidon81'); }
  // un tas de bûches, sous la fenêtre
  { const t = T(36, 18);
    for (let r = 0; r < 3; r++) for (let k = 0; k < 6 - r; k++) { const x = 4 + k * 5.4 + r * 2.7, y = 15 - r * 4.4;
      t.forme('buche', ellipsoide(x, y, 2.8, 2.4), { decalage: 0.1 }); t.forme('aubier', ellipsoide(x - 0.3, y - 0.2, 1.8, 1.5), { decalage: 0.6, bord: false, ombre: false }); t.poser(Math.round(x - 0.3), Math.round(y - 0.2), 'buche', 2); }
    t.contour(); t.texture(s, 'buches81'); }
  // un panier d'osier plein de pommes
  { const t = T(16, 12);
    for (const [x, y, m] of [[4, 4, 'pomme'], [7, 3, 'pommeV'], [10, 4, 'pomme'], [12, 5, 'pomme'], [6, 5, 'pomme']]) t.forme(m, ellipsoide(x, y, 2.2, 2), { decalage: 0.3 });
    t.forme('osier', (x, y) => (y >= 5 && y <= 11 && Math.abs(x + 0.5 - 8) <= 7 - (y - 5) * 0.3 ? [(x + 0.5 - 8) / 7, 0.2, 0.8] : null), { motif: (x, y) => ((x + y) % 2 ? -0.6 : 0) });
    for (let x = 1; x <= 14; x++) t.poser(x, 5, 'osier', 4);
    t.contour(); t.texture(s, 'panier81'); }
  // un baquet de romarin, à côté de la porte
  { const t = T(16, 20);
    t.forme('chene', (x, y) => (y >= 12 && y <= 19 && Math.abs(x + 0.5 - 8) <= 6 - (y - 12) * 0.2 ? [(x + 0.5 - 8) / 6, 0, 0.8] : null), { motif: (x, y) => (x % 3 === 0 ? -0.6 : 0) });
    for (const y of [13, 18]) for (let x = 2; x <= 14; x++) t.poser(x, y, 'fer', 2);
    for (let k = 0; k < 16; k++) { const x0 = 3 + k * 0.65, a = -Math.PI / 2 + (k - 7.5) * 0.09; for (let j = 0; j < 9 + (k % 3) * 2; j++) t.poser(Math.round(x0 + Math.cos(a) * j), Math.round(12 + Math.sin(a) * j), 'romarin', 2 + ((j + k) % 3 === 0 ? 2 : 1)); }
    for (const [x, y] of [[5, 4], [9, 2], [12, 5]]) t.poser(x, y, 'fleurB', 3);
    t.contour(); t.texture(s, 'romarin81'); }
  // des touffes d'herbe et des pissenlits, entre les pavés et au pied des murs
  { const t = T(9, 7); for (const [a, l] of [[-2.2, 5], [-1.8, 6], [-1.5, 6], [-1.2, 5], [-0.9, 4]]) for (let k = 0; k < l; k++) t.poser(Math.round(4 + Math.cos(a) * k), Math.round(6 + Math.sin(a) * k), 'herbe', 2 + (k > 2 ? 1 : 0)); t.contour(); t.texture(s, 'touffe81'); }
  { const t = T(7, 9); for (let y = 3; y < 9; y++) t.poser(3, y, 'herbe', 2); for (const [x, y] of [[1, 8], [5, 8], [0, 7], [6, 7]]) t.poser(x, y, 'herbe', 3); t.forme('jaune', ellipsoide(3.5, 2, 2.2, 1.8), { decalage: 0.4, ombre: false }); t.contour(); t.texture(s, 'pissenlit81'); }
  // la corde à linge, deux images (le linge se balance au vent)
  for (let f = 0; f < 2; f++) { const L = 62, H = 30, t = T(L, H);
    const corde = x => 3 + Math.round(Math.sin(x / (L - 1) * Math.PI) * 5);
    for (let x = 0; x < L; x++) t.poser(x, corde(x), 'chanvre', 2);
    const v = f ? 1 : -1;   // (le vent : le bas des linges part d'un côté, puis de l'autre)
    const linge = (x0, l, h, mat, motif) => { const y0 = corde(x0 + l / 2) + 1;
      for (let y = 0; y < h; y++) { const dec = Math.round(v * y / h * 1.6); for (let x = 0; x < l; x++) { let i = 3 + (x === 0 ? 1 : x === l - 1 ? -1 : 0) + (y === h - 1 ? -1 : 0); if (motif) i += motif(x, y); t.poser(x0 + x + dec, y0 + y, mat, i); } }
      t.poser(x0 + 1, y0 - 1, 'cheneSombre', 2); t.poser(x0 + l - 2, y0 - 1, 'cheneSombre', 2); };   // (les pinces)
    // une chemise blanche (le col, les manches qui pendent), un torchon rayé, deux chaussettes, un tablier bleu
    const dec = y => Math.round(v * y / 13 * 1.6);
    { const x0 = 5, y0 = corde(11) + 1;
      for (let y = 0; y < 13; y++) for (let x = 0; x < 12; x++) { if (y < 2 && x > 4 && x < 7) continue; t.poser(x0 + x + dec(y), y0 + y, 'linB', 3 + (x === 0 ? 1 : x === 11 ? -1 : 0) + (y === 12 ? -1 : 0) + (x === 6 && y > 2 && y % 3 === 0 ? -2 : 0)); }
      for (const sx of [-3, 12]) for (let y = 1; y < 9; y++) for (let x = 0; x < 3; x++) t.poser(x0 + sx + x + dec(y), y0 + y, 'linB', 2 + (x === 0 ? 1 : 0) - (y === 8 ? 1 : 0));
      t.poser(x0 + 1, y0 - 1, 'cheneSombre', 2); t.poser(x0 + 10, y0 - 1, 'cheneSombre', 2); }
    linge(24, 10, 9, 'linR', (x, y) => (Math.floor(x / 2) % 2 ? 1 : -1));
    for (const [x0, mat] of [[37, 'linBl'], [43, 'linR']]) { const y0 = corde(x0) + 1;
      for (let y = 0; y < 7; y++) for (let x = 0; x < 3; x++) t.poser(x0 + x + dec(y), y0 + y, mat, 3 + (x === 0 ? 1 : 0) - (y === 0 ? 1 : 0));
      for (let x = 3; x < 5; x++) for (let y = 5; y < 7; y++) t.poser(x0 + x + dec(y), y0 + y, mat, 2);
      t.poser(x0 + 1, y0 - 1, 'cheneSombre', 2); }
    { const x0 = 49, y0 = corde(54) + 1;
      for (let y = 0; y < 15; y++) { const l = y < 4 ? 6 : 10, ox = y < 4 ? 2 : 0; for (let x = 0; x < l; x++) t.poser(x0 + ox + x + dec(y), y0 + y, 'linBl', 3 + (x === 0 ? 1 : x === l - 1 ? -1 : 0) + (y === 14 ? -1 : 0) + (y === 4 ? -1 : 0)); }
      for (let y = 8; y < 11; y++) for (let x = 3; x < 7; x++) t.poser(x0 + x + dec(y), y0 + y, 'linBl', x === 3 || y === 10 ? 2 : 4);   // (la poche)
      for (const sx of [0, 9]) for (let y = 4; y < 9; y++) t.poser(x0 + sx + dec(y), y0 + y + 1, 'lin', 4);                       // (les cordons qui pendent)
      t.poser(x0 + 3, y0 - 1, 'cheneSombre', 2); t.poser(x0 + 6, y0 - 1, 'cheneSombre', 2); }
    t.contour(); t.texture(s, 'linge81_' + f); }
}
// ---------- les petites bêtes, à la finesse des personnages (×1) ----------
function betes81(s) {
  if (s.textures.exists('pigeon81_debout')) return;
  const T = (l, h) => { const t = toileObjet(l, h); Object.assign(t.rampes, { plume: rampe(0x8a8aa0), plumeF: rampe(0x6a6a80), cou: rampe(0x5a8a7a), bec: rampe(0x2a2a30), patte: rampe(0xd0705a), oeilP: rampeVive(0xe8801a) }); return t; };
  // le pigeon, tourné vers la gauche : debout, boit (la tête baissée vers l'eau), picore, ailes levées (il s'ébroue), gonflé (il roucoule)
  const pigeon = pose => { const t = T(24, 19), cx = 12, sol = 18, b = pose === 'boit' || pose === 'picore' ? 1 : 0;
    const cy = 11 + b;
    // la queue, le corps
    t.forme('plumeF', polygoneHD([[cx + 3, cy - 1], [cx + 11, cy + (b ? -3 : 1)], [cx + 11, cy + (b ? 0 : 4)], [cx + 3, cy + 3]]), { motif: (x, y) => (x % 2 ? -0.4 : 0) });
    if (pose === 'ailes') { t.forme('plumeF', polygoneHD([[cx - 1, cy - 2], [cx + 5, cy - 2], [cx + 9, cy - 10], [cx + 3, cy - 9]]), { decalage: -0.6 }); }
    t.forme('plume', ellipsoide(cx, cy, pose === 'gonfle' ? 6.6 : 6, pose === 'gonfle' ? 5.2 : 4.4));
    // le cou irisé, la tête
    const tete = pose === 'boit' ? [cx - 8, cy + 2] : pose === 'picore' ? [cx - 8, sol - 3] : pose === 'gonfle' ? [cx - 4, cy - 8] : [cx - 5, cy - 7];
    traitHD(t, 'cou', [[cx - 3, cy - 1], [(cx - 3 + tete[0]) / 2, (cy - 1 + tete[1]) / 2 - (b ? 1 : 0)], [tete[0] + 1, tete[1] + 1]], pose === 'gonfle' ? 3.4 : 2.6, 0.3);
    t.forme('plume', ellipsoide(tete[0], tete[1], 2.6, 2.3), { decalage: 0.5 });
    t.poser(tete[0] - 3, tete[1] + 0, 'bec', 3); t.poser(tete[0] - 4, tete[1] + (b ? 1 : 0), 'bec', 2); t.poser(tete[0] - 2, tete[1] - 1, 'lin', 5);
    t.poser(tete[0] - 1, tete[1] - 1, 'oeilP', 4); t.poser(tete[0] - 1, tete[1], 'encre', 0);
    // l'aile près de nous : repliée (deux barres noires) ou levée
    if (pose === 'ailes') { t.forme('plume', polygoneHD([[cx - 3, cy - 1], [cx + 4, cy - 1], [cx + 10, cy - 12], [cx + 5, cy - 13], [cx, cy - 9]]), { motif: (x, y) => ((x + y) % 3 === 0 ? -0.5 : 0) });
      for (const [x, y] of [[cx + 6, cy - 10], [cx + 7, cy - 9], [cx + 8, cy - 11]]) t.poser(x, y, 'encre', 1); }
    else { t.forme('plume', polygoneHD([[cx - 3, cy - 2], [cx + 5, cy - 2], [cx + 9, cy + 2], [cx, cy + 3]]), { decalage: -0.2 });
      for (const [x, y] of [[cx + 2, cy], [cx + 3, cy], [cx + 4, cy + 1], [cx + 3, cy + 2], [cx + 4, cy + 2], [cx + 5, cy + 2]]) t.poser(x, y, 'encre', 1); }
    for (const dx of [-1, 2]) { for (let y = cy + 4; y < sol; y++) t.poser(cx + dx, y, 'patte', 3); t.poser(cx + dx - 1, sol, 'patte', 2); t.poser(cx + dx, sol, 'patte', 3); t.poser(cx + dx + 1, sol, 'patte', 2); }
    t.contour(); t.texture(s, 'pigeon81_' + pose); };
  ['debout', 'boit', 'picore', 'ailes', 'gonfle'].forEach(pigeon);
  // le papillon : ailes ouvertes, ailes levées (deux images), en trois robes : le citron, la piéride, le paon du jour
  const papillon = (nom, base, motif) => [0, 1].forEach(f => { const t = toileObjet(11, 9); t.rampes.aile = rampeVive(base);
    if (!f) { for (const sx of [-1, 1]) { t.forme('aile', ellipsoide(5.5 + sx * 2.8, 3.2, 2.6, 2.8), { decalage: 0.5, ombre: false }); t.forme('aile', ellipsoide(5.5 + sx * 2.2, 6.4, 1.8, 1.8), { decalage: 0.1, ombre: false }); }
      if (motif) motif(t); }
    else { t.forme('aile', ellipsoide(5.5, 2.4, 1.8, 3.2, (x, y) => y < 5), { decalage: 0.1, ombre: false }); t.forme('aile', ellipsoide(5, 2.2, 0.9, 2.4, (x, y) => y < 5), { decalage: 0.9, ombre: false, bord: false }); }
    for (let y = f ? 4 : 2; y < 8; y++) t.poser(5, y, 'encre', y < 4 ? 1 : 2);
    if (!f) { t.poser(4, 0, 'encre', 2); t.poser(6, 0, 'encre', 2); } else { t.poser(3, 3, 'encre', 2); t.poser(2, 2, 'encre', 2); }
    t.contour(); t.texture(s, 'papillon81_' + nom + f); });
  papillon('citron', 0xf0d838, null);
  papillon('pieride', 0xf2f0e6, t => { for (const [x, y] of [[1, 2], [2, 1], [9, 2], [8, 1], [3, 3], [7, 3]]) t.poser(x, y, 'encre', x === 3 || x === 7 ? 3 : 1); });
  papillon('paon', 0xc0482e, t => { t.rampes.oeilA = rampeVive(0x3a6ad8); for (const x of [2, 8]) { t.poser(x, 2, 'oeilA', 4); t.poser(x, 3, 'or', 5); t.poser(x + (x < 5 ? 1 : -1), 2, 'encre', 1); } for (const x of [3, 7]) t.poser(x, 6, 'encre', 1); });
  // l'abeille : ailes hautes, ailes basses
  [0, 1].forEach(f => { const t = toileObjet(7, 6); t.rampes.miel = rampeVive(0xe8b020);
    t.forme('miel', ellipsoide(3.5, 3.6, 2.6, 1.6), { decalage: 0.4, ombre: false });
    t.poser(3, 3, 'encre', 1); t.poser(3, 4, 'encre', 1); t.poser(5, 3, 'encre', 1); t.poser(5, 4, 'encre', 1); t.poser(1, 3, 'encre', 0);
    for (const [x, y] of f ? [[3, 0], [4, 0], [4, 1], [2, 1]] : [[4, 1], [5, 1], [5, 2], [3, 2]]) t.poser(x, y, 'verre', 5);
    t.contour(); t.texture(s, 'abeille81_' + f); });
  // la libellule bleue : ailes en avant, ailes en arrière
  [0, 1].forEach(f => { const t = toileObjet(17, 9); t.rampes.libel = rampeVive(0x2a7ac8);
    for (let x = 5; x < 16; x++) t.poser(x, 4, 'libel', x % 2 ? 4 : 3);
    t.forme('libel', ellipsoide(4, 4, 1.8, 1.4), { decalage: 0.4, ombre: false });
    t.forme('libel', ellipsoide(1.8, 3.8, 1.4, 1.4), { decalage: 0.8, ombre: false }); t.poser(1, 3, 'encre', 1);
    for (const [ax, ay, bx, by] of f ? [[4, 3, 1, 0], [5, 3, 8, 0], [4, 5, 1, 8], [5, 5, 8, 8]] : [[4, 3, 2, 0], [5, 3, 9, 1], [4, 5, 2, 8], [5, 5, 9, 7]])
      for (let k = 0; k <= 5; k++) { const x = Math.round(ax + (bx - ax) * k / 5), y = Math.round(ay + (by - ay) * k / 5); t.poser(x, y, 'verre', k % 2 ? 5 : 4); }
    t.contour(); t.texture(s, 'libellule81_' + f); });
  // le poisson rouge : la queue d'un côté, puis de l'autre
  [0, 1].forEach(f => { const t = toileObjet(10, 6); t.rampes.poisson = rampeVive(0xf0701a);
    t.forme('poisson', ellipsoide(3.6, 3, 3.2, 1.8), { decalage: 0.5, ombre: false });
    t.forme('poisson', polygoneHD(f ? [[6, 3], [9.5, 0.6], [9.5, 3.4]] : [[6, 3], [9.5, 2.6], [9.5, 5.4]]), { decalage: 0.2, ombre: false });
    t.poser(1, 2, 'encre', 0);
    t.texture(s, 'poisson81_' + f); });
  // le moineau sur le réverbère : posé, picore
  ['pose', 'picore'].forEach(pose => { const t = toileObjet(12, 10); t.rampes.brun = rampe(0x8a6038); t.rampes.gris = rampe(0x9a948a);
    const b = pose === 'picore';
    t.forme('brun', polygoneHD([[7, 5], [11, b ? 2 : 4], [11, b ? 4 : 6], [7, 7]]));
    t.forme('gris', ellipsoide(6, 6, 3.6, 2.6)); t.forme('brun', ellipsoide(6.5, 5.2, 3, 1.8), { motif: (x, y) => (x % 2 ? -0.6 : 0) });
    t.forme('brun', ellipsoide(b ? 2.4 : 3, b ? 6.6 : 3, 2, 1.8), { decalage: 0.3 }); t.poser(b ? 0 : 1, b ? 7 : 3, 'chanvre', 4); t.poser(b ? 2 : 2, b ? 6 : 2, 'encre', 0);
    for (const x of [5, 7]) t.poser(x, 9, 'cheneSombre', 2);
    t.contour(); t.texture(s, 'moineau81_' + pose); });
}
// (v3) la fontaine de la placette : sa vasque, et au milieu, sur un rocher moussu, une grenouille de bronze qui crache
// en arc (la fontaine aux vœux du marché reste la seule à colonne et à mufles)
function grenouille3(s) {
  const cle = 'grenouille3'; if (s.textures.exists(cle)) return cle;
  const t = toileV2(40, 34); t.rampes.bronze = rampe(0x4a8a6a); t.rampes.roc = rampe(0x7a7262); t.rampes.mousse3 = rampe(0x5a8a3a);
  t.forme('roc', (x, y) => { const nx = (x + 0.5 - 20) / 15, ny = (y + 0.5 - 30) / 8; return y <= 33 && nx * nx + ny * ny < 1 ? [nx, ny - 0.4, 0.8] : null; }, { decalage: 0.2, motif: (x, y) => (hachage(x >> 1, y >> 1, 9201) - 0.5) * 0.8 });
  for (let x = 7; x < 33; x++) { const y = 23 + Math.round(Math.abs(x - 20) * 0.25); if (hachage(x, 1, 9202) > 0.35) { t.poser(x, y, 'mousse3', 3); t.poser(x, y + 1, 'mousse3', 2); } }
  t.forme('bronze', ellipsoide(18, 18, 9, 6), { decalage: 0.3 });                 // le corps
  t.forme('bronze', ellipsoide(25, 13, 6.5, 4.5), { decalage: 0.5 });             // la tête, tournée vers la droite
  for (const [x, y] of [[23, 8.5], [28, 9]]) { t.forme('bronze', ellipsoide(x, y, 2.4, 2.2), { decalage: 0.8 }); t.poser(Math.round(x), Math.round(y), 'or', 5); t.poser(Math.round(x), Math.round(y) + 1, 'fer', 1); }
  t.forme('bronze', ellipsoide(12, 22, 4.5, 2.4), { decalage: 0.1 }); t.forme('bronze', ellipsoide(24, 23, 3.5, 2), { decalage: 0.1 });   // les pattes
  for (let x = 26; x < 32; x++) t.poser(x, 15, 'fer', 1);   // la bouche
  for (const [x, y] of [[14, 14], [17, 13], [21, 17], [11, 18]]) t.poser(x, y, 'bronze', 5);   // les reflets, le vert-de-gris
  for (const [x, y] of [[16, 20], [19, 21], [27, 12]]) t.poser(x, y, 'mousse3', 4);
  t.contour(); t.texture(s, cle); return cle;
}

// ---- (retours du joueur sur le socle) la neige sur les toits, au Givre ----
// Une couche de neige posée sur le toit d'un bâtiment : une texture de plus, posée par-dessus l'image, à l'identique.
//  - les maisons du quartier (maison5, vieilleMaison5) : tout le toit, du faîte à l'égout, d'après sa géométrie (toit89) ;
//    la cheminée et la face de la lucarne restent nues (leur couronnement a son chapeau de neige), quelques tuiles percent
//    la neige vers le bas, et de petits glaçons pendent sous l'égout ;
//  - les autres façades (ton comptoir, la boutique du paon, la forge, le barbier) : la bande de leur toit (TOITS_NEIGE :
//    ses rangées, et ce qui n'est pas du toit, comme le fronton du paon, dont seule l'arête prend la neige).
// Le trait sombre du contour est gardé (bleui) : la neige épouse la forme du toit, sans coupure nette.
const TOITS_NEIGE = { facadeHD_0: [40, 112, (x, y) => x >= 149 && x < 163 && y >= 37 && y < 61], facadeHD_1: [40, 112, (x, y) => x >= 149 && x < 163 && y >= 37 && y < 61], facadeHD: [0, 58, (x, y) => x >= 149 && x < 165 && y >= 3 && y < 35], rueForgeHD: [4, 43], facadeRivalHD: [12, 52, (x, y) => Math.abs(x - 100) < (y - 2) * 0.95 - 2], boutiqueBarbierHD: [3, 26] };
function neigeToitHD(s, cle) {
  if (/_neige$/.test(cle) || !s.textures.exists(cle)) return null;
  const k = cle + '_neige'; if (s.textures.exists(k)) return k;
  const tex = s.textures.get(cle), T = tex.toit89, base = Object.keys(TOITS_NEIGE).find(b => cle.startsWith(b));
  if (!T && !base) return null;
  const src = tex.getSourceImage(), L = src.width, H = src.height;
  if (!L || !H) return null;
  const lu = document.createElement('canvas'); lu.width = L; lu.height = H;
  const cl = lu.getContext('2d'); cl.drawImage(src, 0, 0);
  const d = cl.getImageData(0, 0, L, H).data;
  const C = T ? T.chem : null, Lu = T ? T.lucarne : null;
  const [haut, bas, nu] = T ? [T.haut - 4, T.bas, (x, y) => (C && x >= C.cx - 7 && x < C.cx + 7 && y >= C.haut && y < C.haut + C.h) || (C && y < C.haut - 3 && Math.abs(x - C.cx) < 9) || (Lu && x >= Lu.lx && x < Lu.lx + 24 && y >= Lu.ly && y < Lu.bas)] : TOITS_NEIGE[base];
  const out = s.textures.createCanvas(k, L, H), o = out.getContext(), img = o.createImageData(L, H), q = img.data;
  const vide = (x, y) => x < 0 || y < 0 || x >= L || y >= H || d[(y * L + x) * 4 + 3] < 128;
  const mettre = (x, y, c) => { const i = (y * L + x) * 4; q[i] = c >> 16; q[i + 1] = (c >> 8) & 255; q[i + 2] = c & 255; q[i + 3] = 255; };
  for (let x = 0; x < L; x++) {
    const bord = bas + (hachage(x >> 1, 7, 9411) > 0.7 ? 1 : 0), glacon = hachage(x, 5, 9413) > 0.8 ? 1 + Math.floor(hachage(x, 3, 9412) * 3) : 0;
    for (let y = Math.max(0, haut); y <= Math.min(H - 1, bord + glacon); y++) {
      const i = (y * L + x) * 4; if (d[i + 3] < 128 || (nu && nu(x, y))) continue;
      const lum = 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2];
      if (y > bord) { mettre(x, y, y === bord + glacon ? 0xb8cadc : 0xdfe9f4); continue; }   // un glaçon sous l'égout
      if (lum < 48 && (vide(x - 1, y) || vide(x + 1, y) || vide(x, y - 1) || vide(x, y + 1))) { mettre(x, y, 0x3c4658); continue; }   // le contour
      const v = (y - haut) / Math.max(1, bas - haut);
      if (v > 0.7 && fbm(x * 0.15, y * 0.3, 9414) > 0.6 - (v - 0.7) * 0.4) continue;   // une tuile qui perce la neige, vers le bas
      const ombre = x > L / 2 + L * 0.22, h = hachage(x, y, 9415);
      mettre(x, y, y >= bord - 1 ? (ombre ? 0xc8d4e4 : 0xe4ecf6) : ombre ? (h > 0.9 ? 0xccd8e6 : 0xd9e3ef) : h > 0.92 ? 0xe6edf5 : h < 0.04 ? 0xffffff : 0xf4f8fc);
    }
  }
  o.putImageData(img, 0, 0); out.refresh();
  return k;
}
// Toute la neige des toits d'un quartier (les images du monde, et celles des groupes posés « à l'ancienne »)
function neigeToitsQuartier(s, monde) {
  const poser = (im, parent) => {
    const k = neigeToitHD(s, im.texture.key); if (!k) return;
    const n = s.add.image(im.x, im.y, k).setOrigin(im.originX, im.originY).setScale(im.scaleX, im.scaleY).setFlipX(im.flipX).setAlpha(im.alpha);
    if (parent === monde) { n.yTri = (im.yTri !== undefined ? im.yTri : im.y) + 0.01; monde.add(n); }
    else parent.addAt(n, parent.getIndex(im) + 1);
  };
  const voir = c => { for (const o of [...c.list]) { if (o.type === 'Container') voir(o); else if (o.type === 'Image' && o.texture && o.visible) poser(o, c); } };
  voir(monde);
}

// ---- (retours du joueur sur le socle) une grille d'égout, à l'échelle des pavés ----
// Petite (14 × 6 pixels, la largeur de deux pavés), posée à plat dans le caniveau et vue de trois quarts (le haut écrasé) :
// un cadre de fonte (éclairé en haut, sombre en bas), six barreaux fins sur le noir de l'égout, un peu de mousse dans les
// coins, et son ombre portée sur la pierre. Posée par ici.grille (QuartierScene.js), qui choisit sa place.
function grilleEgoutHD(s) {
  const cle = 'grilleEgout89'; if (s.textures.exists(cle)) return cle;
  const L = 14, H = 7, t = s.textures.createCanvas(cle, L, H), c = t.getContext();
  const px = (x, y, coul, a = 1) => { c.fillStyle = `rgba(${coul >> 16},${(coul >> 8) & 255},${coul & 255},${a})`; c.fillRect(x, y, 1, 1); };
  for (let y = 0; y < 6; y++) for (let x = 0; x < L; x++) {
    const bord = x === 0 || x === L - 1 || y === 0 || y === 5, anneau = x === 1 || x === L - 2 || y === 1 || y === 4;
    if (bord) px(x, y, y === 0 ? 0x80808a : y === 5 ? 0x1c1c22 : x === 0 ? 0x4a4a54 : 0x2a2a32);   // le cadre de fonte
    else if (anneau) px(x, y, y === 1 ? 0x4e4e58 : 0x34343c);
    else px(x, y, x % 2 === 0 ? (y === 2 ? 0x9a9aa4 : 0x7a7a84) : 0x060608);   // les barreaux (éclairés en haut), le noir de l'égout entre eux
  }
  for (const [x, y, k] of [[0, 4, 0x4a6a32], [0, 5, 0x5a7a3a], [1, 5, 0x4a6a32], [13, 0, 0x5a7a3a], [12, 5, 0x4a6a32]]) px(x, y, k);   // la mousse
  for (let x = 1; x < L; x++) px(x, 6, 0x000000, 0.32);   // l'ombre sur la pierre
  t.refresh();
  return cle;
}

// ---- (retours du joueur) un panneau de rue : une planche étroite taillée en flèche, clouée sur un poteau ----
// Le bois clair des planches gravées (le creux sombre des lettres s'y lit de loin), le fil du bois, deux colliers de fer
// qui la tiennent au poteau (à gauche), la pointe à droite. l × h : la planche, en pixels de la toile (×2 à l'écran).
function panneauFlecheHD(s, l = 32, h = 15) {
  const cle = `panneauFleche_${l}x${h}`; if (s.textures.exists(cle)) return cle;
  const t = toileDecor(l, h), pointe = Math.round(h * 0.36), corps = l - pointe, mi = (h - 1) / 2;
  t.rampes.pin = rampe(BOIS_CLAIR_NOM);
  planche(t, 0, 1, corps, h - 2, 'pin', { graine: 7461, noeuds: 1 });
  for (let x = corps; x < l; x++) { const demi = (l - x) / pointe * (mi - 1); for (let y = Math.round(mi - demi); y <= Math.round(mi + demi); y++) t.poser(x, y, 'pin', y === Math.round(mi - demi) ? 5 : y === Math.round(mi + demi) ? 1 : 3); }   // la pointe
  for (let x = 0; x < corps; x++) { t.poser(x, 1, 'pin', 5); t.poser(x, h - 2, 'chene', 1); }   // l'arête éclairée, le dessous dans l'ombre
  for (const y of [3, h - 4]) for (let x = 0; x < 5; x++) t.poser(x, y, 'fer', x === 0 ? 1 : 3);   // les colliers de fer, autour du poteau
  for (const y of [3, h - 4]) t.poser(3, y, 'fer', 5);   // leurs rivets
  t.contour(); t.texture(s, cle); return cle;
}
