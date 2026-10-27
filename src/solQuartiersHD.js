// (v1.65, la ville des Hobbits en quartiers, chantier 2 : le socle) Le sol des rues, un moteur pour tous les quartiers.
// Repris de la planche 89 v7 (validée le 26/10) : une seule pierre par quartier, taillée en deux tailles au plus.
//   - les pavés (une rampe) : les chaussées, en rangs réguliers décalés d'un demi-pavé ;
//   - la même pierre taillée en dalles (une rampe voisine, un peu plus claire) : trottoirs, placettes, bordures, marches,
//     caniveaux, quais ;
//   - là où un sol dur rencontre l'herbe ou la terre, le bord est naturel, comme les berges d'une rivière : la limite
//     ondule, des pierres manquent ou sont usées, l'herbe pousse dans les joints et mord sur la pierre, des pierres
//     détachées traînent dans l'herbe ;
//   - là où deux tailles de pierre se rencontrent, une vraie jonction, jamais une ligne droite : une rangée de pierres
//     posées en boutisse, de longueurs inégales, un fil de mousse et de terre, quelques rangs de pavés usés aux joints
//     moussus ; côté dalles, des dalles de lisière recoupées ou fendues. Au pied d'une bordure de trottoir, la même
//     rangée en boutisse et la mousse dans le joint. Entre une placette et un palier, un seuil de longues pierres usées.
//   - le caniveau et ses grilles, les marches, le quai, l'eau, la boue, les flaques après la pluie ;
//   - l'hiver (le Givre) : de la neige dans les joints et en plaques sur la pierre, sauf là où l'on passe.
// Le plan du sol est une fonction code(x, y) → un code de SOL_VILLE, lue à la résolution de la texture (un pixel de
// texture = deux unités du monde). La texture est peinte une seule fois par quartier et par saison, puis gardée
// (les quartiers la retrouvent d'une visite à l'autre) ; ses codes restent attachés à la texture : solSous() dit sur quoi
// l'on marche, et le pas sonne comme ce sol dans la banque de pas du jeu (jouerPas).

// Les codes du plan (les mêmes que sur la planche 89 v7)
const SOL_VILLE = {
  PAVE: 1,        // la chaussée : pavés en rangs
  DALLE: 4,       // le trottoir : dalles
  BORDURE: 5,     // la bordure du trottoir
  CANIVEAU: 6,    // le caniveau (de l'eau au fond, entre deux lèvres de pierre)
  MARCHES: 7,     // des marches (vues d'en haut, une marche tous les marcheP pixels)
  HERBE: 8,
  TERRE: 9,       // la terre battue
  VIEUX: 11,      // les vieux pavés plus sombres (la ruelle du bas-quartier)
  QUAI: 12,       // les pierres de taille d'un quai
  EAU: 13,
  BOUE: 14,
  PAVE_HAUT: 16,  // une autre chaussée du même quartier (mêmes pavés)
  RUELLE: 17,     // une ruelle (mêmes pavés)
  CARREFOUR: 19,  // un carrefour (mêmes pavés)
  PLACETTE: 20,   // une placette, un palier : les dalles du trottoir (21, 22 : les mêmes)
  SEUIL: 23,      // le seuil entre une placette et un palier
};
// Une pierre par quartier (deux tailles : pavé et dalle ; vieux : les pavés usés d'une ruelle à part ; marche : les marches)
const PIERRES_QUARTIERS = {
  soucolline: { nom: 'le grès', pave: 0xa89c86, dalle: 0xc0b298, vieux: 0x857c72 },
  basQuartier: { nom: 'le vieux grès noirci', pave: 0x857c72, dalle: 0xa89c86, vieux: 0x857c72 },
  coteaux: { nom: 'la pierre sèche', pave: 0x9a9480, dalle: 0xb4ae98 },
  rempart: { nom: 'le granit gris', pave: 0x8e8e8a, dalle: 0xa8a8a2 },
  riviere: { nom: 'la pierre de rivière', pave: 0x9a9284, dalle: 0xb2aa98 },
};
// Ce qu'on entend sous ses pas, selon le code du sol : un des dix sols de la banque de pas (sonsRecits.js, jouerPas) —
// les pavés de la chaussée, la pierre de taille des dalles, des bordures et des marches, la terre, l'herbe, la boue
const SOL_PAS = { 1: 'paves', 16: 'paves', 17: 'paves', 19: 'paves', 11: 'paves', 4: 'pierre', 5: 'pierre', 20: 'pierre', 21: 'pierre', 22: 'pierre', 23: 'pierre', 12: 'pierre', 6: 'pierre', 7: 'pierre', 8: 'herbe', 9: 'terre', 14: 'boue', 13: 'boue' };

// Le sol d'un quartier : une texture de L × H pixels (×2 dans le monde). Options :
//   pierre (une entrée de PIERRES_QUARTIERS, ou ses couleurs), saison, graine, flaques [[x, y, rx, ry]] (en pixels de
//   texture), herbeJoints(x, y) → la part de joints où pousse l'herbe, marcheP (la hauteur d'une marche), module et dalleM
//   (la taille des pavés et des dalles), naturel (l'amplitude des bords naturels), manque (la part de pierres du bord qui
//   manquent), sauf(x, y) (là où le bord reste net : une marche, un seuil), passage(x, y) → vrai là où l'on marche le
//   plus (l'hiver, la neige y est tassée et repoussée sur les côtés).
function* solQuartierEtapes(s, cle, L, H, code, { flaques = [], graine = 8900, saison = 'semailles', herbeJoints = null, marcheP = 7,
  pierre = PIERRES_QUARTIERS.soucolline, module = [8, 5], dalleM = [16, 8], naturel = 3, manque = 0.22, sauf = null, passage = null } = {}) {
  if (s.textures.exists(cle)) return cle;
  const t0 = performance.now();
  const pal = paletteSaisonComte(saison), t = toileDecor(L, H), R = t.rampes, hiver = saison === 'givre';
  Object.assign(R, {
    bord7: rampe(pierre.bord || 0xb4a688), pave: rampe(pierre.pave), dalle: rampe(pierre.dalle), vieux: rampe(pierre.vieux || pierre.pave), marche: rampe(pierre.marche || pierre.dalle), joint: [0x1a1612, 0x2a241c, 0x3a3228, 0x4a4034, 0x5c5242, 0x6e6250],
    eauC: [0x24384a, 0x2e4a60, 0x3e6078, 0x5a7c94, 0x88a8bc, 0xc8dce8],
    herbeS: rampe(pal.sol.herbe), terreS: rampe(pal.sol.terre), feuilleS: rampe(pal.sol.feuille), fleurS: rampe(pal.sol.fleur), fleur2S: rampe(pal.sol.fleur2), boue: rampe(0x6e5a40),
    neigeS: [0x8a96a8, 0xa8b4c4, 0xc4ced8, 0xdce4ec, 0xeef2f6, 0xffffff], glaceS: [0x5a7088, 0x7890a8, 0x98b0c4, 0xb8cede, 0xd8e6f0, 0xf4faff],
  });
  if (hiver) R.herbeS = R.neigeS;   // (l'herbe du Givre est sous la neige : une seule rampe, celle de la neige)
  const N = L * H, C0 = new Uint8Array(N), C = new Uint8Array(N);
  for (let y = 0; y < H; y++) { if (!(y & 15)) yield; for (let x = 0; x < L; x++) C0[y * L + x] = code(x, y) || 8; }
  const MOU = c => c === 8 || c === 9 || c === 14, DUR = c => c === 23 || c === 1 || c === 4 || c === 5 || c === 6 || c === 7 || c === 11 || c === 12 || c === 16 || c === 17 || c === 19 || c === 20 || c === 21 || c === 22;
  const H1 = (a, b, g) => hachage(a, b, graine + g);
  // 1. les bords naturels : on lit le plan un peu « à côté », de quelques pixels, là seulement où un sol dur touche un sol meuble
  for (let y = 0; y < H; y++) { if (!(y & 15)) yield; for (let x = 0; x < L; x++) {
    const i = y * L + x, c0 = C0[i];
    if (sauf && sauf(x, y)) { C[i] = c0; continue; }
    // (on ne calcule le décalage que près d'une limite : le reste du plan est recopié tel quel)
    let pres = false; for (let b = -4; b <= 4 && !pres; b += 4) for (let a = -4; a <= 4; a += 4) { const xx = x + a, yy = y + b; if (xx >= 0 && yy >= 0 && xx < L && yy < H && C0[yy * L + xx] !== c0) { pres = true; break; } }
    if (!pres) { C[i] = c0; continue; }
    const dx = (fbm(x * 0.09, y * 0.09, graine + 31) - 0.5) * 2 * naturel + (H1(x >> 1, y >> 1, 32) - 0.5) * 1.6;
    const dy = (fbm(x * 0.09, y * 0.09, graine + 33) - 0.5) * 2 * naturel + (H1(x >> 1, y >> 1, 34) - 0.5) * 1.6;
    const wx = Math.max(0, Math.min(L - 1, Math.round(x + dx))), wy = Math.max(0, Math.min(H - 1, Math.round(y + dy))), cw = C0[wy * L + wx];
    C[i] = (cw !== c0 && ((MOU(c0) && DUR(cw)) || (DUR(c0) && MOU(cw)) || (MOU(c0) && MOU(cw)))) ? cw : c0;
  } }
  const T = (x, y) => (x < 0 || y < 0 || x >= L || y >= H) ? 0 : C[y * L + x];
  // 2. le dessin de chaque pierre : [matière, ton, n° de pierre] ou un joint (n° 0)
  const pierre1 = (u, v, lu, lv, k0, arrondi = true) => {
    if (u >= lu - 1 || v >= lv - 1) return null;
    if (arrondi && lu > 5 && (u === 0 || u === lu - 2) && (v === 0 || v === lv - 2)) return null;
    let k = k0; if (v === 0) k += 1; else if (u === 0) k += 1; if (v === lv - 2 && lv > 3) k -= 1; else if (u === lu - 2) k -= 1;
    return k;
  };
  const rangs = (x, y, lu, lv, g, k0) => {
    const row = Math.floor(y / lv), v = y % lv, dec = (row % 2) * Math.floor(lu / 2), a = Math.floor((x + dec) / lu), u = (x + dec) % lu;
    const h = H1(a, row, g), dk = h > 0.9 ? 1 : h < 0.08 ? -1 : 0;
    const k = pierre1(u, v, lu, lv, k0 + dk); return k === null ? null : [k, 1 + ((g * 512 + row) * 4096 + a)];
  };
  const cid = x => Math.floor((x + 3 + Math.floor(H1(Math.floor((x + 3) / 17), 0, 74) * 5)) / 17);   // les pierres de bordure, de longueurs inégales
  const MAT = new Array(N), K = new Int8Array(N), SID = new Int32Array(N);
  for (let y = 0; y < H; y++) { if (!(y & 15)) yield; for (let x = 0; x < L; x++) {
    const i = y * L + x, c = C[i]; let r = null, sid = 0;
    if (c === 11 && pierre.vieux) { const q = rangs(x, y, 10, 6, 5, 4); if (q) { r = ['vieux', q[0]]; sid = q[1]; } else r = ['joint', 3]; }
    else if (c === 1 || c === 11 || c === 16 || c === 17 || c === 19) { const q = rangs(x, y, module[0], module[1], 1, 4); if (q) { r = ['pave', q[0]]; sid = q[1]; } else r = ['joint', 3]; }
    else if (c === 4 || c === 20 || c === 21 || c === 22) { const q = rangs(x, y, dalleM[0], dalleM[1], 2, 3); if (q) { r = ['dalle', q[0]]; sid = q[1]; } else r = ['joint', 3]; }
    else if (c === 5) { const up = !(T(x, y - 1) === 5), dn = !(T(x, y + 1) === 5), id = cid(x), j = id !== cid(x - 1), af = H1(id, y >> 3, 75) > 0.7, ext = j || id !== cid(x + 1);
      r = j ? ['joint', 1] : up ? (af ? ['joint', 2] : ext && H1(id, 2, 76) > 0.5 ? ['dalle', 3] : ['dalle', 5]) : dn ? ['dalle', 1] : ['dalle', 3 - (H1(id, 3, 77) > 0.75 ? 1 : 0)];
      if (up && !j && H1(x, y, 78) < 0.06) r = ['dalle', 2];   // une arête ébréchée
      sid = 0; }
    else if (c === 23) {   // le seuil : de longues pierres, usées au milieu par les pas
      let v = 0; while (v < 8 && T(x, y - v - 1) === 23) v++;
      const id = Math.floor((x + 9) / 23), u = (x + 9 + Math.floor(H1(id, 0, 79) * 3)) % 23, j = u === 22 || v >= 6, us = fbm(x * 0.12, 3, graine + 79);
      r = j ? ['joint', 1] : ['bord7', v === 0 ? 5 : v === 5 ? 1 : v === 4 ? 2 : 3 + (u === 0 ? 1 : 0) - (v > 0 && v < 4 && us > 0.55 ? 1 : 0)];
      if (!j && (u === 0 || u === 21) && (v === 0 || v === 5) && H1(id, v, 78) < 0.6) r = ['joint', 2]; }   // les bouts ébréchés
    else if (c === 6) { const up = T(x, y - 1) !== 6, dn = T(x, y + 1) !== 6;
      r = (x + (Math.floor(y / 3) % 2) * 5) % 11 === 0 ? ['joint', 1] : up ? ['dalle', 2] : dn ? ['dalle', 1] : [hiver ? 'glaceS' : 'eauC', (x + y) % 9 === 0 ? 4 : 2]; }
    else if (c === 7) { const P = marcheP, v = ((y % P) + P) % P, row = Math.floor(y / P), u = (x + row * 6) % 15;
      if (v === 0) r = ['marche', 5]; else if (v < P - 3) r = u === 14 ? ['joint', 2] : ['marche', v === 1 ? 4 : 3]; else if (v < P - 1) r = ['marche', u === 14 ? 0 : v === P - 2 ? 1 : 2]; else r = ['joint', 1];
      sid = 1 + ((4 * 512 + row) * 4096 + Math.floor((x + row * 6) / 15)); }
    else if (c === 12) { const row = Math.floor(y / 7), off = (row % 2) * 8, u = (x + off) % 16, v = y % 7; r = u === 15 || v === 6 ? ['joint', 2] : ['dalle', 2 + (v === 0 ? 1 : 0) - (v === 5 ? 1 : 0)]; }
    MAT[i] = r ? r[0] : null; K[i] = r ? r[1] : 0; SID[i] = sid;
  } }
  // 3. les pierres du bord : quelques-unes manquent (l'herbe ou la terre a pris leur place), d'autres sont usées
  { const bordP = new Map(), PX = new Map(), V8 = [2, 0, -2, 0, 0, 2, 0, -2, 1, 1, -1, -1, 1, -1, -1, 1], V4 = [1, -1, L, -L];
    for (let y = 2; y < H - 2; y++) { if (!(y & 15)) yield; for (let x = 2; x < L - 2; x++) { const i = y * L + x, sid = SID[i]; if (!sid || bordP.has(sid)) continue;
      for (let v = 0; v < 16; v += 2) { const c = C[(y + V8[v + 1]) * L + x + V8[v]]; if (MOU(c)) { bordP.set(sid, c); PX.set(sid, [x, y]); break; } } } }
    const perdu = new Set(), use = new Set();
    for (const [sid, c] of bordP) { const h = hachage(sid % 100003, Math.floor(sid / 100003), graine + 41); if (h < manque && !(sauf && sauf(...PX.get(sid)))) perdu.add(sid); else if (h < manque + 0.3) use.add(sid); }
    for (let i = 0; i < N; i++) { const sid = SID[i]; if (!sid) continue; if (perdu.has(sid)) { C[i] = bordP.get(sid); MAT[i] = null; SID[i] = 0; } else if (use.has(sid)) K[i] = Math.max(0, K[i] - 1); }
    // les joints restés seuls au milieu de l'herbe y retournent
    for (let pass = 0; pass < 2; pass++) for (let y = 1; y < H - 1; y++) { if (!(y & 15)) yield; for (let x = 1; x < L - 1; x++) { const i = y * L + x; if (MAT[i] !== 'joint' || !DUR(C[i])) continue;
      let m = 0, cm = 8; for (let v = 0; v < 4; v++) { const c = C[i + V4[v]]; if (MOU(c)) { m++; cm = c; } } if (m >= 2) { C[i] = cm; MAT[i] = null; } } }
  }
  // 3b. les jonctions entre deux tailles de pierre
  { const GP = c => c === 1 || c === 11 || c === 16 || c === 17 || c === 19, GD = c => c === 4 || c === 12 || c === 20 || c === 21 || c === 22;
    const grp = new Int8Array(N); for (let i = 0; i < N; i++) grp[i] = GP(C[i]) ? 1 : GD(C[i]) ? 2 : C[i] === 5 ? 3 : 0;
    const DM = 12;
    // (pour aller vite) dans chaque sens, la distance au premier pixel d'un autre groupe, et ce groupe (-1 : le bord)
    const RL = [0, 1, 2, 3].map(() => new Int16Array(N)), RQ = [0, 1, 2, 3].map(() => new Int8Array(N));
    for (let y = 0; y < H; y++) {
      for (let x = L - 1; x >= 0; x--) { const i = y * L + x; if (x === L - 1) { RL[0][i] = 1; RQ[0][i] = -1; } else if (grp[i + 1] !== grp[i]) { RL[0][i] = 1; RQ[0][i] = grp[i + 1]; } else { RL[0][i] = RL[0][i + 1] + 1; RQ[0][i] = RQ[0][i + 1]; } }
      for (let x = 0; x < L; x++) { const i = y * L + x; if (x === 0) { RL[1][i] = 1; RQ[1][i] = -1; } else if (grp[i - 1] !== grp[i]) { RL[1][i] = 1; RQ[1][i] = grp[i - 1]; } else { RL[1][i] = RL[1][i - 1] + 1; RQ[1][i] = RQ[1][i - 1]; } }
    }
    for (let x = 0; x < L; x++) {
      for (let y = H - 1; y >= 0; y--) { const i = y * L + x; if (y === H - 1) { RL[2][i] = 1; RQ[2][i] = -1; } else if (grp[i + L] !== grp[i]) { RL[2][i] = 1; RQ[2][i] = grp[i + L]; } else { RL[2][i] = RL[2][i + L] + 1; RQ[2][i] = RQ[2][i + L]; } }
      for (let y = 0; y < H; y++) { const i = y * L + x; if (y === 0) { RL[3][i] = 1; RQ[3][i] = -1; } else if (grp[i - L] !== grp[i]) { RL[3][i] = 1; RQ[3][i] = grp[i - L]; } else { RL[3][i] = RL[3][i - L] + 1; RQ[3][i] = RQ[3][i - L]; } }
    }
    for (let y = 0; y < H; y++) { if (!(y & 15)) yield; for (let x = 0; x < L; x++) { const i = y * L + x, g = grp[i]; if (g !== 1 && g !== 2) continue;
      // la plus proche pierre de l'autre taille, en ligne droite, sans rien entre les deux ; et la bordure, pour les pavés
      let d = 99, o = 0, dc = 99;
      for (let s4 = 0; s4 < 4; s4++) { const k = RL[s4][i], q = RQ[s4][i], oo = s4 < 2 ? 1 : 2; if (k > DM || q < 0) continue;
        if (q === 3 - g && k < d) { d = k; o = oo; } if (q === 3 && g === 1 && oo === 2 && k < dc) dc = k; }
      if (g === 1 && dc < d) { d = dc; o = 2; }   // la bordure du trottoir compte comme une dalle : la même rangée en boutisse à son pied
      if (d > DM && dc > 5) continue;   // (loin de toute jonction : rien à faire)
      const al = o === 1 ? y : x, seg = Math.floor((al + 2) / 6), u = (al + 2) % 6, cl = o === 1 ? Math.round(x / 40) : Math.round(y / 40), h = H1(seg, o * 31 + cl, 71);
      if (g === 1 && d <= DM) {   // côté pavés : la rangée en boutisse (des pierres de 6 de large, de 5 à 7 de long), le fil de mousse, les pavés usés
        const w = 5 + (h > 0.6 ? 1 : 0) + (h > 0.88 ? 1 : 0) - (h < 0.15 ? 1 : 0);
        if (d <= w) { let k = 3 + (h > 0.8 ? 1 : h < 0.12 ? -1 : 0), m = 'bord7';
          if (o === 1) { if (u === 0) k = 5; else if (u === 4) k = 1; if (d === w) k = Math.min(k, 2); }
          else { if (u === 0) k = Math.max(k, 4); else if (u === 4) k = Math.min(k, 2); if (d === w) k = y > 0 && grp[i - L] === 2 ? 1 : 5; }
          if (u === 5) { m = H1(x, y, 72) < 0.25 ? 'herbeS' : 'joint'; k = 2; } else if ((u === 0 || u === 4) && d === w && H1(seg, d, 73) < 0.5) { m = 'joint'; k = 2; }   // les angles ébréchés
          MAT[i] = m; K[i] = Math.max(0, Math.min(5, k)); SID[i] = 0; continue; }
        if (d === w + 1) { const q = H1(x, y, 74); MAT[i] = q < 0.4 ? 'herbeS' : 'joint'; K[i] = q < 0.4 ? 2 + (q < 0.12 ? 1 : 0) : 1; SID[i] = 0; continue; }
        if (d <= w + 8) { if (MAT[i] === 'joint') { const q = H1(x, y, 75); if (q < 0.4) { MAT[i] = 'herbeS'; K[i] = 2; } } else if (MAT[i] && SID[i] && H1(SID[i] % 9973, 1, 76) < 0.7 - (d - w) * 0.07) K[i] = Math.max(0, K[i] - 1); continue; }
      }
      if (g === 1 && dc <= 5) {   // au pied de la bordure : la mousse dans le joint, les pavés usés et un peu enfoncés
        if (dc === 1) { const q = H1(x, y, 77); if (MAT[i] === 'joint' || q < 0.5) { MAT[i] = q < 0.3 ? 'herbeS' : 'joint'; K[i] = q < 0.3 ? 2 + (q < 0.1 ? 1 : 0) : 1; } }
        else if (MAT[i] === 'joint') { const q = H1(x, y, 78); if (q < 0.3) { MAT[i] = 'herbeS'; K[i] = 2; } }
        else if (MAT[i] && SID[i] && H1(SID[i] % 9973, 2, 79) < 0.5) K[i] = Math.max(0, K[i] - 1);
      }
      if (g === 2 && d <= DM) {   // côté dalles : certaines boutisses débordent d'un pixel (la ligne n'est pas droite), le joint d'assise,
        // et çà et là une dalle de lisière recoupée plus petite, ou fendue
        const ext = h > 0.82 ? 2 : h > 0.45 ? 1 : 0;
        if (d <= ext) { MAT[i] = u === 5 ? 'joint' : 'bord7'; K[i] = u === 0 && o === 1 ? 5 : u === 4 && o === 1 ? 1 : 3; SID[i] = 0; continue; }
        if (d === ext + 1) { MAT[i] = 'joint'; K[i] = H1(x, y, 81) < 0.3 ? 3 : 2; SID[i] = 0; continue; }
        if (MAT[i] === 'dalle' && SID[i] && d <= (o === 1 ? dalleM[0] : dalleM[1])) { const row = Math.floor(y / dalleM[1]), v = y % dalleM[1], u2 = (x + (row % 2) * Math.floor(dalleM[0] / 2)) % dalleM[0], hs = H1(SID[i] % 9973, 3, 80), cut = 4 + Math.floor(H1(SID[i] % 9973, 4, 80) * 7);
          if (hs < 0.32 && u2 === cut) { MAT[i] = 'joint'; K[i] = 3; }
          else if (hs < 0.32 && u2 === cut + 1) K[i] = Math.min(5, K[i] + 1);
          else if (hs > 0.82 && u2 === Math.round(2 + v * 1.4)) { MAT[i] = 'joint'; K[i] = 2; }   // une dalle fendue
          else if (hs > 0.6 && hs < 0.75) K[i] = Math.max(0, K[i] - 1); }
      }
    } }
  }
  // 4. on peint
  // (pour aller vite) le grand bruit doux de l'herbe et de la terre, calculé sur une grille de 4 pixels et interpolé
  const bruitDoux = (f, gr, pas = 4) => { const W = Math.ceil(L / pas) + 2, Hh = Math.ceil(H / pas) + 2, G = new Float32Array(W * Hh);
    for (let j = 0; j < Hh; j++) for (let i = 0; i < W; i++) G[j * W + i] = fbm(i * pas * f, j * pas * f, gr);
    return (x, y) => { const u = x / pas, v = y / pas, i = Math.floor(u), j = Math.floor(v), a = u - i, b = v - j, k = j * W + i; return G[k] * (1 - a) * (1 - b) + G[k + 1] * a * (1 - b) + G[k + W] * (1 - a) * b + G[k + W + 1] * a * b; }; };
  const bruitHerbe = bruitDoux(0.025, graine + 21), bruitTerre = bruitDoux(0.05, graine + 20, 2);
  // (pour aller vite) la distance de chaque pixel au sol meuble le plus proche, en carrés (Tchebychev) : pres(x, y, r) dit
  // s'il y a de l'herbe, de la terre ou de la boue dans le carré de côté 2r + 1 autour de lui
  const DMOU = new Uint8Array(N);
  for (let i = 0; i < N; i++) DMOU[i] = MOU(C[i]) ? 0 : 255;
  for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) { const i = y * L + x; let v = DMOU[i]; if (!v) continue;
    if (x > 0) v = Math.min(v, DMOU[i - 1] + 1); if (y > 0) { v = Math.min(v, DMOU[i - L] + 1); if (x > 0) v = Math.min(v, DMOU[i - L - 1] + 1); if (x < L - 1) v = Math.min(v, DMOU[i - L + 1] + 1); } DMOU[i] = v; }
  for (let y = H - 1; y >= 0; y--) for (let x = L - 1; x >= 0; x--) { const i = y * L + x; let v = DMOU[i]; if (!v) continue;
    if (x < L - 1) v = Math.min(v, DMOU[i + 1] + 1); if (y < H - 1) { v = Math.min(v, DMOU[i + L] + 1); if (x < L - 1) v = Math.min(v, DMOU[i + L + 1] + 1); if (x > 0) v = Math.min(v, DMOU[i + L - 1] + 1); } DMOU[i] = v; }
  const pres = (x, y, r) => { if (x >= 0 && y >= 0 && x < L && y < H) return DMOU[y * L + x] <= r; for (let b = -r; b <= r; b++) for (let a = -r; a <= r; a++) if (MOU(T(x + a, y + b))) return true; return false; };
  for (let y = 0; y < H; y++) { if (!(y & 15)) yield; for (let x = 0; x < L; x++) {
    const i = y * L + x, c = C[i]; let r = null;
    if (MAT[i]) {
      r = [MAT[i], K[i]];
      if (r[0] === 'joint') { const pr = pres(x, y, 3); if ((pr && H1(x, y, 5) < 0.7) || (herbeJoints && H1(x >> 1, y >> 1, 5) < herbeJoints(x, y))) r = ['herbeS', 2 + (H1(x, y, 6) > 0.6 ? 1 : 0)]; }
      // le relief : sous une bordure, la chaussée plus basse reçoit une ombre
      const bas = c === 1 || c === 16 || c === 11 || c === 6 || c === 19 || c === 17;
      if (bas && T(x, y - 1) === 5) r = [r[0], Math.max(0, r[1] - 2)]; else if (bas && T(x, y - 2) === 5) r = [r[0], Math.max(0, r[1] - 1)];
      if ((c === 20 || c === 21 || c === 22) && T(x, y - 1) === 5) r = [r[0], Math.max(0, r[1] - 1)];
    }
    else if (c === 13) { const n = fbm(x * 0.05, y * 0.2, graine + 18); r = [hiver ? 'glaceS' : 'eauC', n > 0.66 ? 4 : n > 0.5 ? 3 : 2]; if ((x * 3 + y * 7) % 23 === 0 && n > 0.45) r = [hiver ? 'glaceS' : 'eauC', 5]; }
    else if (c === 14) r = ['boue', 2 + Math.round(fbm(x * 0.1, y * 0.1, graine + 19) * 2)];
    else if (c === 9) { const p = bruitTerre(x, y); let k = p > 0.6 ? 4 : p < 0.24 ? 2 : 3; if (T(x, y - 1) === 8) k = 1; else if (T(x, y - 2) === 8) k = Math.min(k, 2); if (DUR(T(x, y - 1))) k = Math.min(k, 2); r = ['terreS', k]; }
    else { const p = bruitHerbe(x, y), q = hachage(x, y, graine + 22); let k = p > 0.6 ? 4 : 3; if (q > 0.97) k += 1; else if (q < 0.025) k -= 1;
      const b1 = T(x, y + 1), b2 = T(x, y + 2); if (b1 !== 8 && b1) k = 5; else if (b2 !== 8 && b2) k = 4; if (DUR(T(x, y - 1))) k = 2; r = ['herbeS', k]; }
    t.poser(x, y, r[0], r[1]);
  } }
  // 5. l'herbe mord sur la pierre : des brins qui débordent, des touffes dans les angles ; des pierres détachées dans l'herbe
  for (let y = 2; y < H - 2; y++) { if (!(y & 15)) yield; for (let x = 2; x < L - 2; x++) { const c = C[y * L + x]; if (c !== 8) continue;
    for (const [a, b] of [[0, -1], [0, 1], [1, 0], [-1, 0]]) { const d = C[(y + b) * L + x + a]; if (!DUR(d) || d === 7 && b !== 0) continue;
      const h = H1(x, y, 51 + a * 3 + b); if (h < 0.42) { t.poser(x + a, y + b, 'herbeS', h < 0.2 ? 4 : 3); if (h < 0.1) t.poser(x + 2 * a, y + 2 * b, 'herbeS', 5); } break; } } }
  for (let n = 0; n < N / 90; n++) { const x = 2 + Math.floor(H1(n, 1, 61) * (L - 4)), y = 2 + Math.floor(H1(n, 2, 61) * (H - 4)), c = T(x, y); if (!MOU(c) || c === 14) continue;
    let pres2 = false; for (let b = -6; b <= 6 && !pres2; b += 2) for (let a = -6; a <= 6; a += 2) if (DUR(T(x + a, y + b)) && T(x + a, y + b) !== 6) { pres2 = true; break; } if (!pres2) continue;
    if (pres(x, y, 0) && T(x + 2, y) === c && T(x, y + 1) === c && T(x + 2, y + 1) === c) { const m = H1(n, 3, 61) < 0.6 ? 'pave' : 'dalle';
      t.poser(x, y, m, 4); t.poser(x + 1, y, m, 3); t.poser(x + 2, y, m, 3); t.poser(x, y + 1, m, 2); t.poser(x + 1, y + 1, m, 2); t.poser(x + 2, y + 1, m, 1); t.poser(x + 1, y + 2, c === 8 ? 'herbeS' : 'terreS', 1); t.poser(x + 2, y + 2, c === 8 ? 'herbeS' : 'terreS', 1); } }
  // les flaques (après la pluie de la nuit), bien rondes, bordées d'une ligne plus sombre ; gelées l'hiver
  for (const [fx, fy, rx, ry] of flaques) for (let y = Math.floor(fy - ry - 2); y <= fy + ry + 2; y++) for (let x = Math.floor(fx - rx - 3); x <= fx + rx + 3; x++) { if (!t.dans(x, y)) continue;
    const d = Math.hypot((x + 0.5 - fx) / rx, (y + 0.5 - fy) / ry); if (d < 1) t.poser(x, y, hiver ? 'glaceS' : 'eauC', d < 0.45 && (x + y) % 5 === 0 ? 5 : y < fy - ry * 0.3 ? 4 : 3); else if (d < 1.25 && t.mat(x, y) !== 'joint') t.poser(x, y, t.mat(x, y), t.teinte(x, y) - 1); }
  // de l'herbe et des fleurs là où il en pousse vraiment (pas l'hiver : la neige les couvre)
  if (!hiver) for (let n = 0; n < N / 260; n++) { const x = Math.floor(H1(n, 1, 24) * L), y = Math.floor(H1(n, 2, 24) * H), c = T(x, y), r = H1(n, 3, 24);
    if (c === 8 && T(x, y + 3) === 8 && T(x, y - 2) === 8) { if (r < 0.08) { const m = r < 0.05 ? 'fleurS' : 'fleur2S'; for (const [a, b] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) t.poser(x + a, y + b, m, 4); t.poser(x, y, 'fleur2S', 5); t.poser(x, y + 2, 'feuilleS', 2); }
      else { t.poser(x - 1, y - 1, 'herbeS', 5); t.poser(x, y, 'herbeS', 4); t.poser(x + 1, y - 1, 'herbeS', 5); t.poser(x, y + 1, 'herbeS', 1); } } }
  // 6. (l'hiver) la neige : dans tous les joints, en plaques sur la pierre (plus épaisse contre les bords et les murs), tassée
  //    et grise là où l'on passe, repoussée en bourrelet sur les côtés du passage ; les marches gardent leur nez dégagé
  if (hiver) {
    // l'épaisseur de neige : de grandes congères douces qui débordent des pelouses enneigées et s'amincissent vers le
    // milieu de la rue ; de la neige dans tous les joints ; tassée, grise et mince là où l'on passe
    const bruitNeige = bruitDoux(0.035, graine + 91);
    const ep = new Float32Array(N);
    for (let y = 0; y < H; y++) { if (!(y & 15)) yield; for (let x = 0; x < L; x++) { const i = y * L + x; if (!DUR(C[i])) continue;
      const pas = passage ? passage(x, y) : 0;
      ep[i] = bruitNeige(x, y) * 0.55 + Math.max(0, 0.5 - DMOU[i] * 0.045) - pas * 0.5 + (H1(x, y, 94) - 0.5) * 0.06; } }
    for (let y = 0; y < H; y++) { if (!(y & 15)) yield; for (let x = 0; x < L; x++) {
      const i = y * L + x, c = C[i], m = t.mat(x, y); if (!DUR(c) || c === 6 || m === 'eauC' || m === 'glaceS') continue;
      const e = ep[i], pas = passage ? passage(x, y) : 0;
      if (m === 'joint') { t.poser(x, y, 'neigeS', pas > 0.5 ? 2 : 3); continue; }
      if (c === 7 && ((y % marcheP) + marcheP) % marcheP < 2 && e < 0.62) continue;   // (le nez des marches, balayé)
      if (e > 0.5) { const bas = y + 1 < H && ep[i + L] <= 0.5;   // la congère : blanche dessus, son bord du bas dans l'ombre
        t.poser(x, y, 'neigeS', bas ? 3 : e > 0.6 ? 5 : 4); }
      else if (e > 0.44 && H1(x, y, 92) < 0.45) t.poser(x, y, 'neigeS', 3);   // (le bord poudré)
    } }
  }
  t.texture(s, cle);
  const tex = s.textures.get(cle); tex.codes = C; tex.solL = L; tex.solH = H;
  if (window.diag && !(window.jeu && window.jeu.diagStable)) diag(`sol ${cle} : ${Math.round(performance.now() - t0)} ms`);
  return cle;
}

// Le sol d'un seul coup (dans la scène qui en a besoin tout de suite)
function solQuartierHD(s, cle, L, H, code, o = {}) {
  const g = solQuartierEtapes(s, cle, L, H, code, o); let r = g.next();
  while (!r.done) r = g.next();
  return cle;
}
// (v1.65) Le sol préparé par petits morceaux, quelques millisecondes à chaque image, pendant qu'on est ailleurs : quand on
// arrive dans le quartier, il est déjà prêt. Renvoie le minuteur (il s'arrête tout seul, ou avec la scène).
function prechaufferSolQuartier(s, cle, L, H, code, o = {}, { budget = 6, delai = 0 } = {}) {
  if (s.textures.exists(cle)) return null;
  let g = null;
  const debut = s.time.now + delai;
  const ev = s.time.addEvent({ delay: 16, loop: true, callback: () => {
    if (s.time.now < debut) return;
    if (s.textures.exists(cle)) { ev.remove(); return; }   // (déjà fait ailleurs entre-temps)
    if (!g) g = solQuartierEtapes(s, cle, L, H, code, o);
    const t = performance.now();
    while (performance.now() - t < budget) { if (g.next().done) { ev.remove(); return; } }
  } });
  return ev;
}

// Sur quoi marche-t-on, au point (x, y) du monde (le sol posé en (ox, oy), ×2) ? 'paves', 'pierre', 'terre', 'herbe', 'boue'
function solSous(s, cle, x, y, ox = 0, oy = 0) {
  const tex = s.textures.exists(cle) && s.textures.get(cle); if (!tex || !tex.codes) return 'paves';
  const px = Math.floor((x - ox) / 2), py = Math.floor((y - oy) / 2);
  if (px < 0 || py < 0 || px >= tex.solL || py >= tex.solH) return 'paves';
  return SOL_PAS[tex.codes[py * tex.solL + px]] || 'paves';
}
// Le code du plan (SOL_VILLE) au point (x, y) du monde
function solCode(s, cle, x, y, ox = 0, oy = 0) {
  const tex = s.textures.exists(cle) && s.textures.get(cle); if (!tex || !tex.codes) return 0;
  const px = Math.floor((x - ox) / 2), py = Math.floor((y - oy) / 2);
  return px < 0 || py < 0 || px >= tex.solL || py >= tex.solH ? 0 : tex.codes[py * tex.solL + px];
}
