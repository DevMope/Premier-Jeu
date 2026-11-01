// Planche à valider : les auras (idée du joueur, 01/11 ; v2 « en voile », retours du soir). Une aura enveloppe un
// personnage et dit au joueur quel type de pouvoir il a (sa couleur) et à quel point il est puissant (sa taille, en
// cinq paliers), comme dans Hunter x Hunter, One Piece ou Dragon Ball.
// Règle validée : l'aura n'apparaît que quand le personnage s'apprête à se battre ou à se défendre, jamais en temps
// normal ; seulement les personnages doués ; chaque personnage à aura passe par la validation du joueur.
// CE FICHIER N'EST PAS CHARGÉ PAR LE JEU (ni index.html ni web/jeu.html). Il s'appuie sur decorHD.js (fbm, hachage) et
// portraitsHD.js (rampeVive) du jeu.
//
// Le voile : une nappe lumineuse continue qui épouse la silhouette (un contour épais et doux qui suit le corps, dense
// près de lui, qui se dilue vers l'extérieur et monte plus qu'elle ne descend), des volutes lentes comme une fumée, et le
// personnage lui-même teinté et éclairé par sa couleur, ses bords fondus dans le voile, ses cheveux et sa cape soulevés.
// Les éclairs, fins, seulement aux grands paliers ; au dernier, le sol luit et des débris lévitent.
const AURAS_COULEURS = {
  noirRouge: { nom: 'noir et rouge', sens: 'agressif, malsain, un pouvoir qui dévore', ext: 0x1a0a12, int: 0xd82020 },
  or: { nom: 'or', sens: 'noblesse et puissance, le pouvoir légitime', ext: 0xd8a020, int: 0xfff0a0 },
  violet: { nom: 'violet', sens: 'menaçant et puissant, un pouvoir qui domine', ext: 0x6a20b0, int: 0xd090ff },
  bleu: { nom: 'bleu', sens: 'la maîtrise, le calme, la magie des sorts', ext: 0x2050c0, int: 0x90d8ff },
  blanc: { nom: 'blanc', sens: 'pureté, éveil, un pouvoir sacré ou guérisseur', ext: 0xc8d8f0, int: 0xffffff },
  vert: { nom: 'vert', sens: 'la vie, la nature, la terre (sombre : le poison)', ext: 0x2a9a3a, int: 0xc0ffa0 },
  argent: { nom: 'argent', sens: 'ancienneté, protection, un pouvoir hérité', ext: 0x8a92a8, int: 0xf0f4ff },
  rouge: { nom: 'rouge', sens: 'la rage, le combat, la force brute', ext: 0xc02018, int: 0xffb060 },
  noir: { nom: 'noir', sens: 'le néant, la mort, ce qui efface', ext: 0x08060c, int: 0x3a2a4a },
  orange: { nom: 'orange', sens: 'la chaleur, la forge, la passion', ext: 0xe06010, int: 0xffe080 },
  orViolet: { nom: 'or, le violet qui perce', sens: 'une noblesse de façade, une menace dessous', ext: 0xd8a020, int: 0xc070ff, perce: true },
  bleuBlanc: { nom: 'bleu et blanc', sens: 'une magie maîtrisée et pure (la glace, la lumière)', ext: 0x3070d0, int: 0xffffff },
  vertNoir: { nom: 'vert et noir', sens: 'le poison, la corruption de la nature', ext: 0x0c1a10, int: 0x60e040 },
  rougeOr: { nom: 'rouge et or', sens: 'un guerrier noble, la force au service d’un rang', ext: 0xc02018, int: 0xffd060 },
  violetNoir: { nom: 'violet et noir', sens: 'une domination sans retour, la magie interdite', ext: 0x0a0612, int: 0x9a40e0 },
  argentBleu: { nom: 'argent et bleu', sens: 'un don ancien et maîtrisé (une magie spéciale)', ext: 0x8a92a8, int: 0x70c0ff },
  vertMarron: { nom: 'vert sombre et marron foncé', sens: 'la ruse des bas-fonds, l’instinct de l’animal (le chat)', ext: 0x2a1a10, int: 0x2e6a2a },
  noirBlanc: { nom: 'noir et blanc, enroulés', sens: 'la mort, et le passage qu’elle ouvre (la Faucheuse) : le noir domine', ext: 0x1a1426, int: 0xe8e8ff, yinYang: true },
  rougeNoirViolet: { nom: 'rouge, noir et violet', sens: 'l’Affamé : la faim, le néant et la domination (Vorhal’Düm)', ext: 0x0a0410, int: 0xe02020, tiers: 0x8a30e0 },
};
// Les cinq paliers : la portée du voile (en pixels de la texture du personnage, qui fait 160 de haut environ), sa densité,
// ce qui s'y ajoute. Chaque personnage a sa propre texture : la portée se mesure par rapport à sa hauteur.
const AURAS_PALIERS = [
  null,
  { nom: '1. le halo', desc: 'un halo discret qui suit le corps', portee: 0.07, dense: 0.7, teinte: 0.1 },
  { nom: '2. la lueur', desc: 'le voile monte le long du corps, les cheveux se soulèvent', portee: 0.16, dense: 0.85, teinte: 0.18, cheveux: 0.6 },
  { nom: '3. l’aura', desc: 'un voile bien présent qui l’enveloppe, des volutes', portee: 0.28, dense: 1, teinte: 0.26, cheveux: 1 },
  { nom: '4. la tempête', desc: 'le voile double, des volutes qui montent haut, de fins éclairs', portee: 0.45, dense: 1.1, teinte: 0.34, cheveux: 1.4, eclairs: 3 },
  { nom: '5. le déchaînement', desc: 'il remplit l’écran, la foudre, le sol luit, des débris lévitent', portee: 0.7, dense: 1.2, teinte: 0.42, cheveux: 1.8, eclairs: 6, debris: 12, sol: true },
];
const AURA_BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
// Les pixels d'une texture (la silhouette du personnage) : { w, h, data (rgba) }
function auraPixels(scene, cle) {
  const src = scene.textures.get(cle).getSourceImage(), w = src.width, h = src.height;
  const c = document.createElement('canvas'); c.width = w; c.height = h; const ctx = c.getContext('2d'); ctx.drawImage(src, 0, 0);
  return { w, h, data: ctx.getImageData(0, 0, w, h).data };
}
// Une texture avec de la transparence, écrite pixel par pixel ({ r, g, b, a } par pixel, ou null)
function auraTexture(scene, cle, W, H, px) {
  if (scene.textures.exists(cle)) scene.textures.remove(cle);
  const tex = scene.textures.createCanvas(cle, W, H), ctx = tex.getContext(), img = ctx.createImageData(W, H);
  for (let i = 0; i < W * H; i++) { const p = px[i]; if (!p) continue; img.data[i * 4] = p[0]; img.data[i * 4 + 1] = p[1]; img.data[i * 4 + 2] = p[2]; img.data[i * 4 + 3] = p[3]; }
  ctx.putImageData(img, 0, 0); tex.refresh(); return cle;
}
const auraRgb = c => [(c >> 16) & 255, (c >> 8) & 255, c & 255];
const auraMix = (a, b, f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
// Le voile et ses couches, pour une silhouette donnée : rend { arriere, devant, R } (deux clés de textures, la marge R)
// montee : de 0 à 1, l'aura qui apparaît (sa portée et sa densité montent)
function auraVoileHD(scene, cle, couleur, palier, { graine = 3, montee = 1, echelle = 1 } = {}) {
  const C = AURAS_COULEURS[couleur], P = AURAS_PALIERS[palier], S = auraPixels(scene, cle);
  const R = Math.max(2, Math.round(S.h * P.portee * echelle * (0.35 + 0.65 * montee))), dense = P.dense * (0.4 + 0.6 * montee);
  const W = S.w + 2 * R, H = S.h + 2 * R, N = W * H;
  // la silhouette, et la distance au corps (une propagation : monter coûte moins que descendre, le voile s'élève)
  const corps = new Uint8Array(N), d = new Float32Array(N).fill(1e9), file = [];
  for (let y = 0; y < S.h; y++) for (let x = 0; x < S.w; x++) if (S.data[(y * S.w + x) * 4 + 3] > 40) { const i = (y + R) * W + x + R; corps[i] = 1; d[i] = 0; file.push(i); }
  const couts = [[1, 0, 1], [-1, 0, 1], [0, -1, 0.72], [0, 1, 1.5], [1, -1, 1.25], [-1, -1, 1.25], [1, 1, 1.8], [-1, 1, 1.8]];
  for (let k = 0; k < file.length; k++) { const i = file[k], x = i % W, y = (i - x) / W;
    for (const [dx, dy, c] of couts) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const j = ny * W + nx, nd = d[i] + c; if (nd < d[j] && nd <= R + 1) { d[j] = nd; file.push(j); } } }
  const ext = auraRgb(C.ext), int = auraRgb(C.int), blanc = [255, 255, 255];
  const arriere = new Array(N).fill(null), devant = new Array(N).fill(null);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x; if (d[i] > R) continue;
    const u = d[i] / R;   // 0 contre le corps, 1 au bord du voile
    // les volutes : une fumée lente, qui monte (le bruit est étiré en hauteur et décalé par la graine)
    const vol = fbm(x * 0.045, y * 0.025 - graine * 3, graine, 3), vol2 = fbm(x * 0.11, y * 0.07 + graine, graine + 7, 2);
    let I = Math.pow(1 - u, 1.05) * (0.78 + 0.5 * vol) * (0.88 + 0.25 * vol2) * dense;
    if (corps[i]) I = Math.min(1, I + 0.15);
    const perce = C.perce && hachage(Math.floor(x / 4), Math.floor(y / 6), graine + 2) > 0.78;
    const sombre = (ext[0] + ext[1] + ext[2]) < 150;   // (un extérieur sombre : le cœur clair reste large, sinon on ne verrait rien)
    let col = perce ? int : auraMix(int, ext, Math.min(1, u * (sombre ? 0.9 : 1.6)));
    if (C.yinYang) { const ang = Math.atan2(y - H * 0.5, x - W * 0.5), r0 = Math.hypot(x - W * 0.5, (y - H * 0.5) * 0.8); const spir = Math.sin(ang * 2 + r0 * 0.09 - graine) + (vol - 0.5) * 1.2; col = spir > 0.72 ? auraMix(int, ext, 0.1) : spir > 0.55 ? auraMix(ext, int, 0.45) : auraMix(ext, int, 0.1 + u * 0.15); }   // (le noir domine, le blanc s'enroule en un ruban)
    if (C.tiers) { const bande = Math.sin((x + y * 0.6) * 0.07 + vol * 6 + graine); const t3 = auraRgb(C.tiers); col = bande > 0 ? auraMix(col, t3, bande * 0.75) : auraMix(col, ext, -bande * 0.6); }   // (les trois couleurs se fondent en volutes) if (u < 0.08 && !corps[i]) col = auraMix(col, blanc, 0.35);
    // la transparence en quatre crans, tramée : un voile doux qui reste du pixel art
    const a = Math.max(0, Math.min(1, I)), cran = Math.floor(a * 4 + (AURA_BAYER[y % 4][x % 4] + 0.5) / 16) / 4;
    if (cran <= 0) continue;
    const A = Math.round(Math.min(1, cran) * 235);
    if (corps[i]) { if (!perce) devant[i] = [col[0], col[1], col[2], Math.round(A * P.teinte * 0.9)]; continue; }   // (sur le corps : la teinte, douce)
    arriere[i] = [col[0], col[1], col[2], A];
    if (u < 0.22) devant[i] = [col[0], col[1], col[2], Math.round(A * 0.55)];   // (le bord du corps se fond dans le voile)
  }
  // les cheveux, la barbe et la cape soulevés : depuis le haut de la silhouette (et les côtés bas), des mèches de la couleur
  // du pixel qui s'étirent vers le haut en ondulant, et se fondent dans le voile
  if (P.cheveux) { const lg = P.cheveux * S.h * 0.11 * montee;
    for (let x = R; x < W - R; x += 1 + (hachage(x, 1, graine) > 0.5 ? 1 : 0)) {
      let top = -1; for (let y = R; y < H - R; y++) if (corps[y * W + x]) { top = y; break; } if (top < 0) continue;
      const s = S.data[((top - R) * S.w + (x - R)) * 4], g = S.data[((top - R) * S.w + (x - R)) * 4 + 1], b = S.data[((top - R) * S.w + (x - R)) * 4 + 2];
      const l = lg * (0.4 + hachage(x, 2, graine) * 0.9), ond = (hachage(x, 3, graine) - 0.5) * 2;
      for (let k = 1; k <= l; k++) { const f = k / l, xx = Math.round(x + Math.sin(f * 3 + x * 0.3) * ond * 2 * f), yy = top - k; if (xx < 0 || xx >= W || yy < 0) break;
        const mel = auraMix([s, g, b], int, f * 0.8), al = Math.round(220 * (1 - f * f)); devant[yy * W + xx] = [mel[0] | 0, mel[1] | 0, mel[2] | 0, al]; }
    }
    // la cape et la robe, au bas des côtés : les bords s'écartent en lambeaux soulevés
    for (let y = Math.round(H * 0.45); y < H - R; y += 2) { for (const cote of [-1, 1]) { let bord = -1;
      for (let x = cote < 0 ? R : W - R - 1; x >= R && x < W - R; x += cote) if (corps[y * W + x]) { bord = x; break; } if (bord < 0) continue;
      const i0 = ((y - R) * S.w + (bord - R)) * 4, l = lg * 0.6 * (0.3 + hachage(y, 5, graine));
      for (let k = 1; k <= l; k++) { const f = k / l, xx = bord + cote * k, yy = Math.round(y - k * 0.6 - Math.sin(y * 0.4) * 1.5); if (xx < 0 || xx >= W || yy < 0) break;
        const mel = auraMix([S.data[i0], S.data[i0 + 1], S.data[i0 + 2]], int, f * 0.7); devant[yy * W + xx] = [mel[0] | 0, mel[1] | 0, mel[2] | 0, Math.round(200 * (1 - f))]; } } }
  }
  // les éclairs fins, dans le voile, aux grands paliers
  if (P.eclairs) for (let e = 0; e < P.eclairs * montee; e++) {
    let x = R + hachage(e, 21, graine) * S.w, y = R + S.h * (0.05 + hachage(e, 22, graine) * 0.8), a = (hachage(e, 23, graine) - 0.5) * 2.4 - Math.PI / 2;
    for (let j = 0; j < 5 + hachage(e, 24, graine) * 4; j++) { const aa = a + (hachage(e, j + 30, graine) - 0.5) * 2, l = R * (0.12 + hachage(e, j + 50, graine) * 0.25);
      for (let s = 0; s < l; s++) { const px = Math.round(x + Math.cos(aa) * s), py = Math.round(y + Math.sin(aa) * s); if (px < 0 || py < 0 || px >= W || py >= H || corps[py * W + px]) continue; arriere[py * W + px] = [255, 255, 255, 230]; if (px + 1 < W) arriere[py * W + px + 1] = [int[0], int[1], int[2], 160]; }
      x += Math.cos(aa) * l; y += Math.sin(aa) * l; }
  }
  // les débris qui lévitent (de petites pierres, dans le voile)
  if (P.debris) for (let k = 0; k < P.debris; k++) { const cx = hachage(k, 41, graine) * W, cy = R * 0.3 + hachage(k, 42, graine) * (H - R), r = 1 + hachage(k, 43, graine) * 2.5;
    for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r * 1.3); x <= cx + r * 1.3; x++) { if (x < 0 || y < 0 || x >= W || y >= H) continue; const dx = (x - cx) / (r * 1.3), dy = (y - cy) / r; if (dx * dx + dy * dy > 1) continue;
      const t = dy < -0.3 ? 70 : dy > 0.4 ? 28 : 46; arriere[y * W + x] = [t, t - 6, t + 8, 255]; } }
  const base = 'aura_' + cle + '_' + couleur + '_' + palier + '_' + graine + '_' + Math.round(montee * 100) + '_' + Math.round(echelle * 100);
  return { arriere: auraTexture(scene, base + '_a', W, H, arriere), devant: auraTexture(scene, base + '_d', W, H, devant), R, W, H };
}
// Pose l'aura autour d'une image de personnage posée par les pieds (origine 0.5, 1) : le voile derrière, la teinte et les
// bords fondus devant, un halo additif et, au dernier palier, le sol qui luit
function auraHD(s, img, couleur, palier, { graine = 3, montee = 1, echelle = 1 } = {}) {   // (echelle : Vorhal'Düm a la plus grande aura de toutes)
  const C = AURAS_COULEURS[couleur], P = AURAS_PALIERS[palier], V = auraVoileHD(s, img.texture.key, couleur, palier, { graine, montee, echelle });
  const sc = img.scaleX, objets = [], p0 = img.depth;
  const pose = (cle, prof, alpha, blend) => { const o = s.add.image(img.x, img.y + V.R * sc, cle).setOrigin(0.5, 1).setScale(sc).setFlipX(img.flipX).setDepth(prof).setAlpha(alpha); if (blend) o.setBlendMode(blend); objets.push(o); return o; };
  const h = img.displayHeight;
  objets.push(s.add.image(img.x, img.y - h * 0.5, 'halo').setScale(h / 130 * (0.6 + P.portee * 4) * montee, h / 130 * (0.9 + P.portee * 4) * montee).setTint(C.ext).setAlpha(0.3 * montee).setBlendMode(Phaser.BlendModes.ADD).setDepth(p0 - 0.4));
  pose(V.arriere, p0 - 0.3, 0.95, null);
  pose(V.arriere, p0 - 0.29, 0.35 * montee, Phaser.BlendModes.ADD);   // (la lueur du voile)
  pose(V.devant, p0 + 0.1, 0.95, null);
  objets.push(s.add.image(img.x, img.y - h * 0.45, 'halo').setScale(h / 130 * 0.5, h / 130 * 0.8).setTint(C.int).setAlpha(P.teinte * 0.7 * montee).setBlendMode(Phaser.BlendModes.ADD).setDepth(p0 + 0.12));   // (il est éclairé par sa couleur)
  if (P.sol && montee > 0.6) objets.push(s.add.image(img.x, img.y + 2, 'halo').setScale(h / 130 * 1.8, h / 130 * 0.35).setTint(C.int).setAlpha(0.5).setBlendMode(Phaser.BlendModes.ADD).setDepth(p0 - 0.2));
  return objets;
}
