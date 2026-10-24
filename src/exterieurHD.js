// L'extérieur en HD : les paysages peints de chaque contrée (ciel tramé, nuages, montagnes,
// collines, arbres, chemin), la façade du shop, les étals du Marché des Mastres et les pavés.
// Peint à demi-résolution et affiché en ×2, comme le reste.

// --- Les couleurs ---

function melangeCouleur(a, b, t) {
  t = Math.max(0, Math.min(1, t));
  const r = ((a >> 16) & 255) + (((b >> 16) & 255) - ((a >> 16) & 255)) * t;
  const g = ((a >> 8) & 255) + (((b >> 8) & 255) - ((a >> 8) & 255)) * t;
  const bl = (a & 255) + ((b & 255) - (a & 255)) * t;
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(bl);
}

// Plus sombre en tirant vers le bleu-violet (les ombres), plus clair en tirant vers le jaune.
function teinte(c, f) {
  if (f < 1) return melangeCouleur(melangeCouleur(c, 0x000000, 1 - f), 0x2a2050, (1 - f) * 0.35);
  return melangeCouleur(c, 0xfff4c8, Math.min(1, f - 1));
}

// La trame de Bayer 4×4 : des dégradés en pixels, sans bavure.
const TRAME_BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
function tramer(x, y, v, paliers) {
  const s = v * (paliers - 1);
  const base = Math.floor(s);
  return Math.min(paliers - 1, base + (s - base > (TRAME_BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16 ? 1 : 0));
}

// --- Les paysages ---

// Les arbres, montagnes et autres détails de chaque contrée.
const RELIEFS = {
  comte: { arbres: 'ronds', fleurs: 0xf0d060 },
  foret: { arbres: 'sapins', densite: 2 },
  marais: { roseaux: true, brume: 0.35 },
  mines: { pics: 0.55, neige: false, rochers: true },
  desert: { dunes: true },
  neige: { pics: 0.6, neige: true },
  ruines: { colonnes: true, brume: 0.15 },
  antre: { pics: 0.65, lave: true },
  monastere: { arbres: 'ronds', temple: true, fleurs: 0xf8f0f8 },
  sanctuaire: { arbres: 'ronds', colonnes: true, fleurs: 0xffffff, brume: 0.2 },
  citadelle: { pics: 0.4, neige: true, tours: true },
  bourbier: { roseaux: true, brume: 0.5, arbresMorts: true },
  repaire: { arbres: 'sapins', densite: 2, arbresMorts: true },
  tour: { tourNoire: true, pics: 0.35, brume: 0.2 },
  cote: { arbres: 'ronds', fleurs: 0xf8f0d0 },
  opale: { colonnes: true, tours: true, brume: 0.15 },
  badlands: { pics: 0.45, rochers: true },
  nuitPourpre: { tourNoire: true, arbresMorts: true, brume: 0.25 },
};

// Peint un paysage à la taille demandée (à l'écran). Renvoie la clé de la texture.
// `nuit` : de 0 (plein jour) à 1 (nuit noire), ou 'aube' pour le lever du soleil.
// `sansAstre` : sans soleil ni lune (quand on les dessine à part, plus détaillés).
function paysageHD(scene, largeur, hauteur, biome = 'comte', nuit = 0, { sansAstre = false } = {}) {
  const L = Math.round(largeur / 2), H = Math.round(hauteur / 2);
  const aube = nuit === 'aube';
  if (aube) nuit = 0;
  // (v0.99) la Comté change avec la saison : ses couleurs, ses arbres, ses fleurs (voir saisonsHD.js)
  const saison = biome === 'comte' && typeof saisonActuelle === 'function' ? saisonActuelle() : null;
  const cle = `paysage_${biome}${saison ? '_' + saison : ''}_${L}x${H}_${aube ? 'aube' : Math.round(nuit * 10)}${sansAstre ? '_sans' : ''}`;
  if (scene.textures.exists(cle)) return cle;
  const b = (saison && BIOMES_SAISON[saison]) || BIOMES[biome] || BIOMES.comte, r = saison ? { ...(RELIEFS[biome] || {}), ...RELIEFS_SAISON[saison] } : RELIEFS[biome] || {};
  const graine = biome.length * 31;
  // À l'aube, tout prend une lumière rose orangée, rasante ; la nuit, tout bleuit et s'assombrit.
  const soir = aube ? (c => melangeCouleur(c, melangeCouleur(teinte(c, 0.85), 0xff9a60, 0.55), 0.32))
    : (c => melangeCouleur(c, melangeCouleur(teinte(c, 0.45), 0x1a1840, 0.5), nuit));
  const px = new Uint32Array(L * H);
  const poser = (x, y, c) => { if (x >= 0 && y >= 0 && x < L && y < H) px[y * L + Math.floor(x)] = c; };

  // Le ciel : un dégradé tramé du zénith à l'horizon, puis les nuages
  const zenith = aube ? melangeCouleur(teinte(b.ciel, 0.7), 0x8a5aa8, 0.6) : soir(teinte(b.ciel, 0.85));
  const horizon = aube ? 0xffa0a8 : soir(b.horizon);
  const nuages = aube ? 0xffb0c0 : nuit > 0.6 ? 0x3a3a5a : soir(0xfff8f0);
  for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) {
    const v = tramer(x, y, y / (H * 0.8), 7) / 6;
    let c = melangeCouleur(zenith, horizon, v);
    const n = fbm(x * 0.018 + 3, y * 0.07, graine) + (y < H * 0.45 ? 0 : -1);
    if (n > 0.6) c = melangeCouleur(nuages, teinte(nuages, 0.82), fbm(x * 0.05, y * 0.12 + 5, graine + 1) > 0.55 || n < 0.63 ? 1 : 0);
    px[y * L + x] = c;
  }
  // Les étoiles, la nuit
  if (nuit > 0.5) for (let k = 0; k < L * H / 90; k++) poser(Math.floor(hachage(k, 1, graine) * L), Math.floor(hachage(k, 2, graine) * H * 0.5), 0xf3f0d0);
  // Le soleil (ou la lune), avec son halo
  // (à l'aube, un gros soleil rouge orangé qui se lève à l'est, juste au-dessus des collines)
  const sx = aube ? L * 0.22 : L * 0.78, sy = aube ? H * 0.5 : H * (0.2 + nuit * 0.3), sr = Math.max(6, H * (aube ? 0.08 : 0.06));
  const halo = aube ? 3.6 : 2.2, astre = aube ? 0xffc870 : nuit > 0.6 ? 0xf3ecc8 : soir(b.soleil);
  if (!sansAstre) for (let y = Math.floor(sy - sr * 4); y < sy + sr * 4; y++) for (let x = Math.floor(sx - sr * 4); x < sx + sr * 4; x++) {
    const d = Math.hypot(x - sx, y - sy);
    if (d < sr) poser(x, y, astre);
    else if (d < sr * halo && tramer(x, y, 1 - (d - sr) / (sr * (halo - 1)), 3) > 0 && y >= 0 && y < H) px[y * L + x] = melangeCouleur(px[y * L + x], aube ? 0xffd890 : soir(b.soleil), 0.35);
  }

  // Une ligne de crête : y(x) = base + bruit
  const crete = (x, base, ampl, freq, g) => H * base + (fbm(x * freq, 0.5, g) - 0.5) * H * ampl;
  // Les montagnes, éclairées à gauche, enneigées en haut si besoin
  if (r.pics) {
    // Des sommets de tailles et de largeurs variées ; le versant gauche prend la lumière
    const sommets = [];
    for (let k = 0; k < Math.ceil(L / 45) + 2; k++) {
      sommets.push({ cx: (k - 0.5) * 45 + hachage(k, 1, graine) * 30, h: H * r.pics * (0.55 + hachage(k, 2, graine) * 0.45), pente: 0.8 + hachage(k, 3, graine) * 0.9 });
    }
    for (let x = 0; x < L; x++) {
      let haut = H, s0 = null;
      for (const p of sommets) {
        const y = H * 0.72 - p.h + Math.abs(x - p.cx) * p.pente + (fbm(x * 0.15, p.cx, graine) - 0.5) * 3;
        if (y < haut) { haut = y; s0 = p; }
      }
      const lumineux = x < s0.cx;
      for (let y = Math.floor(haut); y < H * 0.75; y++) {
        let c = soir(teinte(b.pics || b.loin, (lumineux ? 1.08 : 0.78) - (y - haut) / H * 0.35 + (hachage(x, y, graine + 30) < 0.06 ? -0.06 : 0)));
        if (r.neige && y < haut + s0.h * 0.28 + (fbm(x * 0.2, y * 0.2, graine) - 0.5) * 4) c = soir(lumineux ? 0xf8fbff : 0xb8c8dc);
        if (r.lave && y > H * 0.6 && hachage(x, y, graine) < 0.04) c = 0xff7030;
        poser(x, y, c);
      }
    }
  }
  // Les dunes du désert
  if (r.dunes) for (let x = 0; x < L; x++) {
    const h0 = H * 0.55 + Math.sin(x * 0.03) * H * 0.06 + Math.sin(x * 0.011 + 1) * H * 0.05;
    for (let y = Math.floor(h0); y < H; y++) poser(x, y, soir(teinte(b.loin, Math.cos(x * 0.03) > 0 ? 1.1 : 0.85)));
  }
  // Les collines lointaines (un peu bleutées par la distance)
  for (let x = 0; x < L; x++) {
    const h0 = crete(x, 0.6, 0.25, 0.012, graine + 2);
    for (let y = Math.floor(h0); y < H; y++) {
      const v = tramer(x, y, (y - h0) / (H * 0.25), 4) / 3;
      poser(x, y, soir(melangeCouleur(teinte(b.loin, 1.05 - v * 0.2), b.horizon, 0.25)));
    }
    if (r.arbres && hachage(x, 7, graine) < 0.08 * (r.densite || 1)) arbre(x, h0 + 2, 0.55, melangeCouleur(teinte(b.arbres || b.loin, 0.8), b.horizon, 0.3));
    if (r.fleurs && hachage(x, 8, graine) < 0.006) maison(x, h0 + 3);   // des fermes au loin
  }
  // Les collines du milieu, avec leurs bosquets
  for (let x = 0; x < L; x++) {
    const h0 = crete(x, 0.68, 0.2, 0.016, graine + 3);
    for (let y = Math.floor(h0); y < H; y++) {
      const v = tramer(x, y, (y - h0) / (H * 0.2), 4) / 3;
      poser(x, y, soir(melangeCouleur(teinte(b.pres, 1.08 - v * 0.22), b.loin, 0.35)));
    }
    if (y0Herbe(x, h0) && r.arbres && hachage(x, 17, graine) < 0.05 * (r.densite || 1)) arbre(x, h0 + 2, 0.8, melangeCouleur(teinte(b.arbres || b.pres, 0.78), b.loin, 0.15));
  }
  // Les colonnes, les temples et les tours
  const fond = (x0, larg, haut, c) => { for (let y = Math.floor(haut); y < H * 0.78; y++) for (let x = x0; x < x0 + larg; x++) poser(x, y, soir(teinte(c, x < x0 + larg / 2 ? 1.05 : 0.8))); };
  if (r.colonnes) for (const k of [0.1, 0.27, 0.6, 0.86]) {
    const x0 = Math.floor(L * k), haut = H * (0.42 + hachage(Math.floor(k * 10), 3, graine) * 0.15);
    fond(x0, 6, haut, b.colonnes || 0xe8e4d8);
    for (let x = x0 - 1; x < x0 + 7; x++) poser(x, Math.floor(haut), soir(b.colonnes || 0xe8e4d8));
  }
  if (r.temple) { const x0 = Math.floor(L * 0.3); fond(x0, 40, H * 0.5, 0xd8c8a0); for (let k = 0; k < 24; k++) for (let x = x0 - 4 + k; x < x0 + 44 - k; x++) poser(x, Math.floor(H * 0.5) - k / 2, soir(0x9a3a2a)); }
  if (r.tours) for (const k of [0.15, 0.32]) { const x0 = Math.floor(L * k); fond(x0, 14, H * 0.32, 0xc8c0b0); for (let x = x0; x < x0 + 14; x += 4) fond(x, 2, H * 0.29, 0xc8c0b0); }
  if (r.tourNoire) { const x0 = Math.floor(L * 0.3); fond(x0, 18, H * 0.12, 0x2a1a30); for (let y = 0; y < 6; y++) poser(x0 + 9, Math.floor(H * 0.12) + 8 + y, 0xd080ff); }

  // Les collines proches, herbues, avec des fleurs
  const herbe = b.pres;
  for (let x = 0; x < L; x++) {
    const h0 = crete(x, 0.76, 0.18, 0.02, graine + 5);
    for (let y = Math.floor(h0); y < H; y++) {
      const v = (y - h0) / (H * 0.3);
      let c = teinte(herbe, 1.12 - v * 0.35 + (hachage(x, y, graine + 6) < 0.18 ? -0.08 : 0));
      if (y === Math.floor(h0)) c = teinte(herbe, 1.25);
      if (r.fleurs && hachage(x, y, graine + 8) < 0.012) c = r.fleurs;
      poser(x, y, soir(c));
    }
    if (r.arbres && hachage(x, 9, graine) < 0.03 * (r.densite || 1)) arbre(x, h0 + 3, 1.15, teinte(b.arbres || herbe, 0.7));
    if (!r.dunes && hachage(x, 19, graine) < 0.035) buisson(x, h0 + 4 + hachage(x, 20, graine) * 10, 2.5 + hachage(x, 21, graine) * 2.5, teinte(b.arbres || herbe, 0.82));
    if (!r.dunes && hachage(x, 22, graine) < 0.25) touffe(x, Math.floor(h0 + 3 + hachage(x, 23, graine) * (H - h0 - 16)));
    if (r.arbresMorts && hachage(x, 11, graine) < 0.02) arbreMort(x, h0 + 2);
    if (r.roseaux && hachage(x, 12, graine) < 0.35) for (let y = 0; y < 5 + hachage(x, 13, graine) * 8; y++) poser(x, Math.floor(h0 + H * 0.06 - y), soir(teinte(b.roseaux || herbe, 0.8 + y * 0.03)));
    if (r.rochers && hachage(x, 14, graine) < 0.02) for (let k = 0; k < 5; k++) for (let j = 0; j < 4 - Math.abs(k - 2); j++) poser(x + k, Math.floor(h0 + 4 - j), soir(teinte(0x8a8070, j > 1 ? 1.1 : 0.85)));
  }
  // La petite porte ronde de hobbit dans la colline
  if (r.porte) {
    const cx = L * 0.16, cy = crete(L * 0.16, 0.76, 0.18, 0.02, graine + 5) + H * 0.07, rr = Math.max(3, H * 0.03);
    for (let y = Math.floor(cy - rr - 2); y < cy + rr; y++) for (let x = Math.floor(cx - rr - 2); x < cx + rr + 2; x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d < rr + 1.5 && y <= cy + rr) poser(x, y, d > rr ? soir(0x8a8070) : soir(teinte(0x2f6a9a, x < cx ? 1.05 : 0.8)));
    }
    poser(Math.round(cx), Math.round(cy), soir(0xe0c040));
  }
  // La brume du marais, du bourbier...
  if (r.brume) for (let y = Math.floor(H * 0.6); y < H; y++) for (let x = 0; x < L; x++) {
    if (fbm(x * 0.03, y * 0.15, graine + 15) > 0.55 && tramer(x, y, r.brume, 3) > 0) px[y * L + x] = melangeCouleur(px[y * L + x], soir(0xd8e0d0), 0.4);
  }
  // Le chemin, au premier plan : terre tassée, cailloux, touffes d'herbe au bord
  const chemin = Math.round(H - 13);
  for (let y = chemin; y < H; y++) for (let x = 0; x < L; x++) {
    let c = teinte(b.chemin, 1 - (y - chemin) / 40 + (hachage(x, y, graine + 20) < 0.1 ? -0.1 : 0));
    if (hachage(x >> 1, y >> 1, graine + 21) < 0.04) c = teinte(b.chemin, 1.18);
    if (y === chemin) c = teinte(herbe, 0.8);
    if (y === chemin + 1 && hachage(x, 0, graine + 22) < 0.4) c = teinte(herbe, 0.9);
    poser(x, y, soir(c));
  }
  for (let x = 0; x < L; x += 1) if (hachage(x, 1, graine + 23) < 0.12) { poser(x, chemin - 1, soir(teinte(herbe, 1.1))); poser(x, chemin - 2, soir(teinte(herbe, 1.2))); }
  // Des cailloux sur le chemin
  for (let k = 0; k < L / 14; k++) {
    const x = Math.floor(hachage(k, 30, graine) * L), y = chemin + 3 + Math.floor(hachage(k, 31, graine) * 8);
    poser(x, y, soir(teinte(0x9a9080, 1.2))); poser(x + 1, y, soir(teinte(0x9a9080, 1))); poser(x, y + 1, soir(teinte(0x9a9080, 0.75))); poser(x + 1, y + 1, soir(teinte(0x9a9080, 0.6)));
  }
  // Une barrière de bois le long du chemin (dans la Comté et les terres paisibles)
  if (r.fleurs) for (let x = 2; x < L; x += 11) {
    if (hachage(Math.floor(x / 44), 32, graine) < 0.45) continue;
    for (let y = chemin - 9; y < chemin; y++) { poser(x, y, soir(teinte(0x7a5a30, 1.1))); poser(x + 1, y, soir(teinte(0x7a5a30, 0.75))); }
    for (let k = 0; k < 11; k++) { poser(x + k, chemin - 7, soir(teinte(0x8a6a38, 1.05))); poser(x + k, chemin - 4, soir(teinte(0x8a6a38, 0.9))); }
  }

  // Les arbres, les buissons, les touffes d'herbe et les fermes (fonctions hissées)
  function y0Herbe() { return true; }
  // Une boule de feuillage éclairée en haut à gauche, avec ses reflets et son ombre
  function boule(cx, cy, rx, ry, couleur) {
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry;
      const d = nx * nx + ny * ny + (hachage(x, y, graine + 40) - 0.5) * 0.25;
      if (d > 1) continue;
      const lum = 1 - (nx * 0.45 + ny * 0.6) * 0.45 - d * 0.12;
      let f = lum > 1.12 ? 1.28 : lum > 0.98 ? 1.08 : lum > 0.84 ? 0.9 : 0.72;
      if (hachage(x, y, graine + 41) < 0.08) f += 0.12;
      poser(x, y, soir(teinte(couleur, f)));
    }
  }
  function arbre(x, sol, taille, couleur) {
    const forme = r.arbres;
    const h = Math.round((forme === 'sapins' ? 18 : 12) * taille * (0.8 + hachage(x, 3, graine) * 0.5));
    // (v1.63) la Comté, de saison en saison : de vrais arbres (chêne, pommier, bouleau), peints par arbresHD.js, à la couleur de la distance
    if (saison && forme !== 'sapins' && typeof peindreArbre === 'function') {
      const esp = ['chene', 'chene', 'pommier', 'bouleau'][Math.floor(hachage(Math.round(x), 4, graine) * 4)], brume = taille < 0.7 ? 0.3 : taille < 1 ? 0.15 : 0;
      const rp = rampesArbre(saison, esp, couleur);
      peindreArbre((X, Y, m, i) => poser(X, Y, soir(melangeCouleur(rp[m][i], b.horizon, brume))), { cx: x, base: sol, H: Math.max(9, Math.round(h + 4 * taille)), espece: esp, saison, graine: Math.round(x) });
      return;
    }
    // Le tronc, éclairé à gauche
    for (let y = 0; y < 4 * taille; y++) { poser(x, Math.floor(sol - y), soir(0x6a4a2a)); poser(x + 1, Math.floor(sol - y), soir(0x3a2414)); }
    if (forme === 'sapins') {
      for (let etage = 0; etage < 3; etage++) {
        const hh = h * (0.5 - etage * 0.08), base = sol - 3 * taille - etage * h * 0.28;
        for (let y = 0; y < hh; y++) {
          const w = (y / hh) * hh * 0.55;
          for (let k = -Math.ceil(w); k <= Math.ceil(w); k++) {
            const bord = y > hh - 2;
            const f = bord ? 0.65 : (k < 0 ? 1.06 : 0.8) + (hachage(x + k, y + etage * 9, graine) < 0.12 ? 0.15 : 0);
            poser(x + k, Math.floor(base - hh + y), soir((r.neige && y < 2) ? 0xf0f4ff : teinte(couleur, f)));
          }
        }
      }
      return;
    }
    // Un feuillage rond, fait de plusieurs boules
    const R = h * 0.42, cy = sol - 3 * taille - R;
    boule(x - R * 0.45, cy + R * 0.25, R * 0.75, R * 0.65, couleur);
    boule(x + R * 0.5, cy + R * 0.3, R * 0.7, R * 0.6, teinte(couleur, 0.92));
    boule(x, cy - R * 0.2, R * 0.85, R * 0.75, couleur);
  }
  function buisson(x, sol, taille, couleur) {
    boule(x - taille * 0.6, sol - taille * 0.6, taille, taille * 0.75, teinte(couleur, 0.95));
    boule(x + taille * 0.5, sol - taille * 0.7, taille * 0.9, taille * 0.7, couleur);
    if (r.fleurs && hachage(x, 50, graine) < 0.5) for (let k = 0; k < 3; k++) poser(Math.round(x - taille + hachage(x, 51 + k, graine) * taille * 2), Math.round(sol - taille * (0.4 + hachage(x, 54 + k, graine))), r.fleurs);
  }
  function touffe(x, y) {
    const c = teinte(b.pres, 1.25), c2 = teinte(b.pres, 0.7);
    poser(x, y, soir(c2)); poser(x - 1, y - 1, soir(c)); poser(x + 1, y - 1, soir(c)); poser(x, y - 2, soir(c));
    if (r.fleurs && hachage(x, y, graine + 60) < 0.15) { poser(x, y - 3, r.fleurs); poser(x + 1, y - 3, teinte(r.fleurs, 1.2)); }
  }
  // Une petite ferme au loin : murs blancs, toit d'ardoises ou de tuiles
  function maison(x, sol) {
    const toit = hachage(x, 70, graine) < 0.5 ? 0x8a3a2a : 0x4a5466;
    for (let y = 0; y < 4; y++) for (let k = 0; k < 7; k++) poser(x + k, Math.floor(sol - y), soir(melangeCouleur(k < 2 ? 0xf0e8d8 : 0xc8c0b0, b.horizon, 0.25)));
    for (let y = 0; y < 4; y++) for (let k = -1 + y; k < 8 - y; k++) poser(x + k, Math.floor(sol - 4 - y), soir(melangeCouleur(toit, b.horizon, 0.25)));
    poser(x + 3, Math.floor(sol - 1), soir(0x3a2a20));
  }
  function arbreMort(x, sol) {
    for (let y = 0; y < 16; y++) poser(x, Math.floor(sol - y), soir(0x2a2420));
    for (let k = 1; k < 5; k++) { poser(x - k, Math.floor(sol - 10 - k), soir(0x2a2420)); poser(x + k, Math.floor(sol - 13 - k * 0.6), soir(0x2a2420)); }
  }

  // Sur une toile
  const tex = scene.textures.createCanvas(cle, L, H);
  const ctx = tex.getContext();
  const img = ctx.createImageData(L, H);
  for (let k = 0; k < px.length; k++) {
    const c = px[k];
    img.data[k * 4] = (c >> 16) & 255; img.data[k * 4 + 1] = (c >> 8) & 255; img.data[k * 4 + 2] = c & 255; img.data[k * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  tex.refresh();
  return cle;
}

// --- La façade du shop ---

const RAMPES_EXTERIEUR = {
  chaume: [0x4a3410, 0x7a5a1c, 0xa8822c, 0xc9a046, 0xe0c068, 0xf4e0a0],
  porteVerte: [0x0e2414, 0x1a3a22, 0x285a32, 0x3a7a44, 0x5a9a5a, 0x8ac080],
  vitre: [0x5a3a10, 0x8a5a18, 0xc08a30, 0xf0c060, 0xf8dc90, 0xfff4d0],
};

// La géométrie de la façade (en pixels de la toile ; affichée en ×2, posée par le bas, centrée).
const FACADE = {
  L: 200, H: 176,
  toit: [0, 0, 200, 58],          // x, y, l, h
  etage: [12, 58, 176, 50],
  rdc: [18, 108, 164, 68],
  fenetre: [28, 120, 64, 38],     // la fenêtre-comptoir
  porte: [124, 120, 34, 56],
  cheminee: [150, 0, 14, 34],
  enseigne: [8, 104],             // l'accroche du support
};

// Où est la cheminée selon le niveau de la façade (pour la fumée).
function chemineeFacade(n) { return n >= 2 ? FACADE.cheminee : [150, 34, 12, 26]; }

// La façade à son niveau `n` (0 : humble chaumière … 3 : belle maison à colombages).
function creerFacadeHD(scene, n = 3) {
  creerAccessoiresFacade(scene);
  if (scene.textures.exists('facadeHD_' + n)) return;
  const { L, H } = FACADE;
  const t = toileDecor(L, H);
  Object.assign(t.rampes, RAMPES_EXTERIEUR);
  t.rampes.tuile = [0x3a140c, 0x5e2214, 0x86341e, 0xa8482a, 0xc8663e, 0xe08a5a];
  t.rampes.brique = [0x3a1410, 0x5e2018, 0x823024, 0xa04030, 0xbc5844, 0xd8806a];
  t.rampes.torchis = [0x4a3a24, 0x7a6440, 0xa08a5e, 0xbca878, 0xd0be90, 0xe2d4ac];

  if (n === 0) {
    // La chaumière : des murs de torchis fissurés, des poteaux de bois brut, des pierres qui percent
    const [x0, y0, l, h] = FACADE.rdc;
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + l; x++) {
      let i = 3 + Math.round((fbm(x * 0.08, y * 0.08, 690) - 0.5) * 1.6) + (y > y0 + h - 8 ? -1 : 0);
      if (fbm(x * 0.05, y * 0.07, 691) > 0.72) i -= 1;
      t.poser(x, y, 'torchis', i);
    }
    pierres(t, x0 + 100, y0 + 8, 16, 10, 692); pierres(t, x0 + 4, y0 + h - 16, 14, 8, 693);
    for (let k = 0; k < 3; k++) { let x = x0 + 20 + k * 50, y = y0 + 4; for (let j = 0; j < 14; j++) { t.poser(Math.round(x), y, 'torchis', 0); x += hachage(k, j, 694) - 0.5; y++; } }
    t.rampes.chene = BOIS_LUXE[0].bois;
    for (const x of [x0, x0 + 58, x0 + 112, x0 + l - 5]) planche(t, x, y0, 5, h, 'chene', { horizontale: false, graine: 695 + x, noeuds: 2 });
    planche(t, x0, y0, l, 5, 'chene', { graine: 696, noeuds: 3 });
  } else {
  // Le rez-de-chaussée : de gros moellons de pierre
  {
    const [x0, y0, l, h] = FACADE.rdc;
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + l; x++) {
      const rangee = Math.floor((y - y0) / 7), dec = (rangee % 2) * 6;
      const bx = (x - x0 + dec) % 12, by = (y - y0) % 7;
      const joint = bx === 0 || by === 0;
      let i = joint ? 1 : 3 + (by === 1 ? 1 : 0) - (bx === 11 || by === 6 ? 1 : 0) + Math.round((hachage(Math.floor((x + dec) / 12), rangee, 700) - 0.5) * 1.6);
      if (x < x0 + 3) i += 1;
      t.poser(x, y, 'pierre', i);
    }
    for (const x of [x0, x0 + l - 4]) for (let y = y0; y < y0 + h; y++) for (let k = 0; k < 4; k++) t.poser(x + k, y, 'pierre', (Math.floor((y - y0) / 7) % 2 ? 4 : 3) + (k === 0 ? 1 : 0)); // les chaînes d'angle
  }
  }
  // L'étage, en saillie : enduit blanc, colombages sombres, croix de Saint-André
  if (n >= 2) {
    const [x0, y0, l, h] = FACADE.etage;
    enduit(t, x0, y0, l, h, 701, false);
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + l; x++) t.poser(x, y, 'platre', 4 + (hachage(x, y, 702) < 0.05 ? -1 : 0));
    const poteaux = [x0, x0 + 30, x0 + 58, x0 + 88, x0 + 118, x0 + 146, x0 + l - 5];
    for (const x of poteaux) planche(t, x, y0, 5, h, 'cheneSombre', { horizontale: false, graine: 703 + x });
    planche(t, x0, y0, l, 5, 'cheneSombre', { graine: 704 });
    planche(t, x0 - 4, y0 + h - 6, l + 8, 6, 'cheneSombre', { graine: 705, noeuds: 3 }); // la sablière, qui déborde
    for (let x = x0 - 4; x < x0 + l + 4; x++) t.poser(x, y0 + h, 'cheneSombre', 0);
    // Des croix dans les panneaux sans fenêtre
    const croix = (xa, xb) => { for (let k = 0; k <= 1; k += 0.02) for (const [ax, bx] of [[xa, xb], [xb, xa]]) { const x = Math.round(ax + (bx - ax) * k), y = Math.round(y0 + 5 + (h - 11) * k); t.poser(x, y, 'cheneSombre', 2); t.poser(x + 1, y, 'cheneSombre', 3); t.poser(x + 2, y, 'cheneSombre', 2); } };
    if (n === 3) { croix(x0 + 5, x0 + 28); croix(x0 + 63, x0 + 86); croix(x0 + 123, x0 + 144); }
    // Deux fenêtres à petits carreaux, éclairées, avec leurs volets
    for (const fx0 of [x0 + 35, x0 + 93, x0 + 151]) {
      const fy0 = y0 + 12, fl = 18, fh = 24;
      for (let y = fy0; y < fy0 + fh; y++) for (let x = fx0; x < fx0 + fl; x++) {
        const cadre = x === fx0 || x === fx0 + fl - 1 || y === fy0 || y === fy0 + fh - 1;
        const plomb = (x - fx0) % 6 === 0 || (y - fy0) % 6 === 0;
        t.poser(x, y, cadre ? 'chene' : plomb ? 'fer' : 'vitre', cadre ? 2 : plomb ? 2 : 3 + ((x + y) % 5 === 0 ? 1 : 0) + (y < fy0 + 6 ? 1 : 0));
      }
      for (let x = fx0 - 2; x < fx0 + fl + 2; x++) t.poser(x, fy0 + fh, 'chene', 4);
      // Une jardinière de fleurs sous chaque fenêtre
      if (n === 3) for (let x = fx0; x < fx0 + fl; x++) { t.poser(x, fy0 + fh + 1, 'chene', 1); if (hachage(x, 3, 706) < 0.6) t.poser(x, fy0 + fh, hachage(x, 4, 706) < 0.5 ? 'cuirRouge' : 'laiton', 5); }
    }
    // Les consoles de bois sous la saillie
    for (const x of poteaux) for (let k = 0; k < 5; k++) for (let j = 0; j < 5 - k; j++) t.poser(x + 1 + j, y0 + h + 1 + k, 'cheneSombre', j === 0 ? 3 : 1);
  }
  // Le toit : chaume (0), ardoises (1), bardeaux de bois (2), tuiles et lucarne (3)
  if (n < 3) {
    const haut = n === 2 ? 10 : 46, bas = n === 2 ? FACADE.toit[3] : 112;
    const g0 = n === 2 ? 46 : 58, d0 = L - g0;
    const mat = n === 0 ? 'chaume' : n === 1 ? 'ardoiseToit' : 'bardeau';
    t.rampes.ardoiseToit = [0x161820, 0x252a36, 0x363e4e, 0x4a5466, 0x626e82, 0x8a96aa];
    t.rampes.bardeau = [0x2a1a0e, 0x4a3018, 0x6a4626, 0x8a6036, 0xa87a4a, 0xc49a68];
    for (let y = haut - (n === 0 ? 4 : 0); y <= bas + (n === 0 ? 3 : 0); y++) {
      const v = Math.max(0, (y - haut) / (bas - haut));
      let xa = Math.round(g0 - v * (g0 - 2)), xb = Math.round(d0 + v * (L - 3 - d0));
      if (n === 0) { const arrondi = Math.max(0, y - bas) * 2.5 + Math.max(0, haut - y) * 3; xa += arrondi; xb -= arrondi; } // le chaume, bombé
      for (let x = xa; x <= xb; x++) {
        let i;
        if (n === 0) {
          const brin = (x * 3 + Math.floor(y * 0.6)) % 5;
          i = 3 + (brin === 0 ? -1 : brin === 3 ? 1 : 0) + Math.round((fbm(x * 0.1, y * 0.2, 697) - 0.5) * 1.5) + (hachage(x, y, 698) < 0.04 ? -2 : 0);
          if (y > bas - 1) i -= 1;
        } else {
          const rangee = Math.floor((y - haut) / 4), decal = (rangee % 2) * 3, ligne = (y - haut) % 4;
          i = 3 + Math.round((hachage(Math.floor((x + decal) / (n === 2 ? 4 : 6)), rangee, 699) - 0.5) * 1.6);
          if (ligne === 3) i = 1; else if (ligne === 0) i += 1;
          if ((x + decal) % (n === 2 ? 4 : 6) === 0) i -= 1;
          if (y > bas - 2) i = 0;
        }
        if (x < xa + 3) i += 1;
        if (x > xb - 3) i -= 1;
        t.poser(x, y, mat, i);
      }
    }
    if (n > 0) for (let x = g0 - 1; x <= d0 + 1; x++) for (let y = haut - 3; y < haut; y++) t.poser(x, y, mat, y === haut - 3 ? 5 : 2);
  } else {
    const [, , , hToit] = FACADE.toit;
    const haut = 10, bas = hToit, g0 = 46, d0 = L - 46;
    for (let y = haut; y <= bas; y++) {
      const v = (y - haut) / (bas - haut);
      const xa = Math.round(g0 - v * (g0 - 2)), xb = Math.round(d0 + v * (L - 3 - d0));
      const rangee = Math.floor((y - haut) / 4), decal = (rangee % 2) * 3;
      for (let x = xa; x <= xb; x++) {
        const tuile = (x + decal) % 6, ligne = (y - haut) % 4;
        let i = 3 + Math.round((hachage(Math.floor((x + decal) / 6), rangee, 707) - 0.5) * 1.4);
        if (ligne === 3) i = 1;                                    // l'ombre sous chaque rang
        else if (ligne === 0) i += 1;
        if (tuile === 0) i -= 1;
        if (tuile === 1 && ligne < 2) i += 1;                      // le galbe de la tuile
        if (x < xa + 3) i += 1;
        if (x > xb - 3) i -= 1;
        if (y > bas - 2) i = 0;
        t.poser(x, y, 'tuile', i);
      }
    }
    for (let x = g0 - 1; x <= d0 + 1; x++) for (let y = haut - 3; y < haut; y++) t.poser(x, y, 'tuile', y === haut - 3 ? 5 : 2); // le faîtage
    // La lucarne
    const lx = 86, ly = 22, ll = 28, lh = 24;
    for (let y = ly; y < ly + lh; y++) for (let x = lx; x < lx + ll; x++) t.poser(x, y, 'platre', 4);
    for (let y = ly + 6; y < ly + lh - 3; y++) for (let x = lx + 8; x < lx + ll - 8; x++) t.poser(x, y, 'vitre', (x - lx) % 6 === 2 || (y - ly) % 6 === 0 ? 2 : 4);
    for (let y = ly; y < ly + lh; y++) { t.poser(lx, y, 'cheneSombre', 3); t.poser(lx + 1, y, 'cheneSombre', 2); t.poser(lx + ll - 1, y, 'cheneSombre', 1); }
    for (let k = 0; k < 18; k++) for (let j = -k; j <= k; j++) {
      const x = lx + ll / 2 + j, y = ly - 15 + k;
      t.poser(x, y, 'tuile', Math.abs(j) > k - 2 ? (j < 0 ? 4 : 1) : (k % 4 === 3 ? 1 : 3));
    }
  }
  // La cheminée : de brique pour la belle maison, de pierre sinon
  {
    const [x0, y0, l, h] = chemineeFacade(n);
    if (n === 3) for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + l; x++) {
      const rangee = Math.floor(y / 3), joint = y % 3 === 0 || (x + (rangee % 2) * 3) % 6 === 0;
      t.poser(x, y, 'brique', joint ? 1 : (x < x0 + 3 ? 4 : 3));
    }
    else if (n >= 2) pierres(t, x0, y0, l, h, 712);
    else {
      // (v0.66) sur la chaumière et l'ardoise, la souche descend jusqu'au pan du toit (elle ne flotte
      // plus à droite) : chaque colonne s'arrête là où le toit la reçoit, avec un bourrelet de toit
      const mat = n === 0 ? 'chaume' : 'ardoiseToit', g0 = 58, d0 = FACADE.L - g0;
      const surface = x => 46 + Math.max(0, (x - d0) / (FACADE.L - 3 - d0)) * (112 - 46);
      for (let x = x0; x < x0 + l; x++) {
        const bas = Math.round(surface(x)) + 2;
        for (let y = y0; y < bas; y++) {
          const rangee = Math.floor((y - y0) / 6), dec = rangee % 2 ? 5 : 0, bx = (x - x0 + dec) % 10, by = (y - y0) % 6;
          t.poser(x, y, 'pierre', bx === 0 || by === 0 ? 1 : 2 + Math.round(fbm(x * 0.2, y * 0.2, 712 + rangee) * 2) + (by === 1 ? 1 : 0) - (bx === 9 || by === 5 ? 1 : 0) - (x === x0 + l - 1 ? 1 : 0));
        }
        for (let k = 0; k < 3; k++) t.poser(x, bas + k, mat, k === 0 ? 4 : 2);
      }
    }
    for (let x = x0 - 2; x < x0 + l + 2; x++) { t.poser(x, y0, 'pierre', 5); t.poser(x, y0 + 1, 'pierre', 3); }
  }
  // La fenêtre-comptoir : volets ouverts, vitre éclairée, appui de comptoir
  {
    const [fx, fy, fl, fh] = FACADE.fenetre;
    if (n > 0) for (let y = fy - 4; y < fy + fh; y++) for (let x = fx - 4; x < fx + fl + 4; x++) {
      if (y >= fy && x >= fx && x < fx + fl) continue;
      const d = Math.min(x - fx + 4, fx + fl + 3 - x, y - fy + 4);
      t.poser(x, y, 'pierre', d < 2 ? 5 : 4); // un encadrement de pierre de taille
    }
    for (let y = fy; y < fy + fh; y++) for (let x = fx; x < fx + fl; x++) {
      const cadre = x < fx + 3 || x >= fx + fl - 3 || y < fy + 3;
      if (cadre) { t.poser(x, y, 'chene', x < fx + 3 || y < fy + 3 ? 4 : 2); continue; }
      t.poser(x, y, 'vitre', 3 + Math.round((fbm(x * 0.1, y * 0.1, 708) - 0.5) * 2) + (y < fy + 10 ? 1 : 0) - (n === 0 ? 1 : 0));
    }
    for (const [x0] of [[fx - 16], [fx + fl + 4]]) {
      for (let x = x0; x < x0 + 12; x++) for (let y = fy - 2; y < fy + fh; y++) t.poser(x, y, n === 0 ? 'chene' : 'porteVerte', (x - x0) % 4 === 0 ? 1 : 3);
      for (const y of [fy + 6, fy + fh - 8]) for (let x = x0 + 2; x < x0 + 10; x++) t.poser(x, y, 'fer', 3);
    }
    planche(t, fx - 6, fy + fh, fl + 12, 6, 'chene', { graine: 709, noeuds: 2 });
    for (let x = fx - 6; x < fx + fl + 6; x++) t.poser(x, fy + fh + 6, 'cheneSombre', 0);
    for (const x of [fx, fx + fl - 4]) for (let y = fy + fh + 6; y < fy + fh + 13; y++) for (let k = 0; k < 3; k++) t.poser(x + k + (y - fy - fh - 6) * 0.3 * (x === fx ? 1 : -1), y, 'chene', 2);
  }
  // La porte d'entrée : (v0.84) la même que celle qu'on voit de l'arrière-boutique, selon le niveau
  {
    const [px0, py0, pl, ph] = FACADE.porte;
    porteEntree(t, px0 - 4, py0 - 6, pl + 8, ph + 6, n, { marche: false });
  }
  // Le support de fer de l'enseigne
  {
    const [ex, ey] = FACADE.enseigne;
    for (let x = ex - 6; x < ex + 26; x++) t.poser(x, ey, 'fer', x % 3 ? 3 : 1);
    for (let k = 0; k < 10; k++) t.poser(ex + 18 - k, ey + k, 'fer', 2);
  }
  t.contour();
  t.texture(scene, 'facadeHD_' + n);
}

// Les tonneaux et l'enseigne (communs à toutes les façades).
function creerAccessoiresFacade(scene) {
  // (v0.58 : le marché dessine aussi des « tonneauxHD » ; on vérifie chaque dessin à part, sinon
  // après un passage au marché, l'enseigne de la façade manquait)
  if (scene.textures.exists('tonneauxHD') && scene.textures.exists('enseigneHD_3')) return;
  // Les tonneaux et la caisse, devant la maison
  if (!scene.textures.exists('tonneauxHD')) {
    const b = toileDecor(36, 22);
    for (const [cx, cy] of [[7, 13], [18, 13]]) {
      b.forme('chene', (x, y) => { const nx = (x + 0.5 - cx) / 6.5; return Math.abs(nx) < 1 && y >= cy - 9 && y <= cy + 8 ? [nx, 0, Math.sqrt(1 - nx * nx * 0.8) - Math.abs(y - cy) * 0.02] : null; },
        { motif: (x) => ((x - cx + 10) % 3 === 0 ? -0.5 : 0) });
      for (const y of [cy - 6, cy + 5]) for (let x = cx - 6; x <= cx + 6; x++) b.poser(x, y, 'fer', 3);
      b.forme('chene', ellipsoide(cx, cy - 9, 6, 1.6), { decalage: 0.5 });
    }
    planche(b, 25, 9, 11, 13, 'chene', { graine: 711, noeuds: 1 });
    for (let x = 25; x < 36; x++) { b.poser(x, 9, 'chene', 5); b.poser(x, 15, 'chene', 1); }
    b.contour();
    b.texture(scene, 'tonneauxHD');
  }
  // L'enseigne en bois suspendue
  for (let n = 0; n < 4; n++) {
    const e = toileLuxe(80, 24, n);
    for (let x = 0; x < 80; x++) for (let y = 0; y < 24; y++) {
      const bord = Math.min(x, y, 79 - x, 23 - y);
      e.poser(x, y, bord < 2 ? (n >= 2 ? 'laiton' : 'chene') : 'parchemin', bord < 2 ? (bord ? 4 : 2) : 4 + Math.round((fbm(x * 0.2, y * 0.2, 711) - 0.5)));
    }
    e.contour();
    e.texture(scene, 'enseigneHD_' + n);
  }
}

// La façade du comptoir, vue de dehors. `cx` = centre, `sol` = bas des murs.
// Renvoie la porte, l'image, l'enseigne et les zones de la façade (à l'écran).
// (v1.31) l'appartement bâti : la façade est plus haute de tout un étage (les scènes en plan serré reculent la vue d'autant)
function facadeAvecEtage(G) { return !!G && niveauFacade(G) === 3 && typeof etageA === 'function' && etageA(G, 'appartement') && !(typeof styleDeMaison === 'function' && styleDeMaison(G)); }
const RECUL_ETAGE = 56;
function dessinerFacade(scene, cx, sol, nomShop = (window.GAME && window.GAME.nomShop) || NOM_SHOP_DEFAUT, n = window.GAME ? niveauFacade(window.GAME) : 3, { fumee = true, etage: avecEtage = true, vent = 40 } = {}) {
  creerFacadeHD(scene, n);
  // (v1.30, planche 54) l'appartement : la belle maison gagne un étage et un balcon (le toit et la cheminée montent d'autant)
  // (v1.57) un style de maison acheté chez l'architecte de Pont-Royal remplace la façade (la porte, la vitrine et l'enseigne restent à leur place)
  const stylePR = window.GAME && typeof styleDeMaison === 'function' ? styleDeMaison(window.GAME) : null;
  const etage = avecEtage && n === 3 && facadeAvecEtage(window.GAME);   // (v1.31 : jamais dans le passé, ni dans la faillite)
  if (etage) creerEtageHD(scene);
  const monte = etage ? FACADE.etage[3] * 2 : 0;
  if (stylePR) fumee = false;   // (leurs cheminées ne sont pas au même endroit)
  const image = scene.add.image(cx, sol + 2, stylePR ? maisonStylePR(scene, stylePR) : etage ? 'facadeHD_4' : 'facadeHD_' + n).setOrigin(0.5, 1).setScale(2);
  const gauche = cx - FACADE.L, haut = sol + 2 - FACADE.H * 2;
  const ecran = ([x, y, l, h]) => [gauche + x * 2, haut + y * 2, l * 2, h * 2];
  const tonneaux = scene.add.image(gauche + FACADE.L * 2 - 26, sol + 4, 'tonneauxHD').setOrigin(0, 1).setScale(2);
  // L'enseigne pend à son support, et se balance un peu
  // (v0.93) elle s'améliore avec la maison entière ; l'écriture et la couleur du fond se choisissent au bureau
  const ex = gauche + (FACADE.enseigne[0] + 6) * 2, ey = haut + FACADE.enseigne[1] * 2;
  const enseigne = poserEnseigne(scene, ex, ey - (n === 3 ? 8 : 0), n, nomShop);
  scene.tweens.add({ targets: enseigne, angle: { from: -2.5, to: 2.5 }, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  // Un filet de fumée qui monte de la cheminée
  creerHalo(scene);
  const [chx, chy0, chl] = ecran(chemineeFacade(n)), chy = chy0 - monte;
  if (fumee) scene.time.addEvent({ delay: 420, loop: true, callback: () => {
    if (!image.active) return;
    bouffeeFumee(scene, chx + chl / 2, chy, { echelle: 2.2, monte: 110, vent, duree: 3200, alpha: 0.95, profondeur: image.depth + 0.01 });   // (v0.70 : la vraie fumée ; vent < 0 : elle part à gauche, quand la maison sur pattes marche vers la droite)
  } });
  const [px, , pl] = ecran(FACADE.porte);
  return {
    porteX: px + pl / 2, porteY: sol, image, enseigne, tonneaux,
    zones: { toit: ((z) => [z[0], z[1] - monte, z[2], z[3]])(ecran(n >= 2 ? FACADE.toit : [0, 42, 200, 72])), etage: n >= 2 ? ecran(FACADE.etage) : null, fenetre: ecran(FACADE.fenetre), porte: ecran(FACADE.porte),
      // (v0.57) le cadre de l'enseigne s'arrête avant la fenêtre : les deux cadres ne se chevauchent plus
      enseigne: [ex - 80, ey + 18, Math.max(70, Math.min(160, ecran(FACADE.fenetre)[0] - 6 - (ex - 80))), Math.min(56, ecran(FACADE.fenetre)[1] - 2 - (ey + 18) > 30 ? 56 : 56)] },
  };
}

// --- Le Marché des Mastres ---

// Un étal : deux poteaux, un auvent rayé à festons (de la couleur du marchand), une table.
function etalHD(scene, couleur) {
  const cle = 'etalHD_' + couleur.toString(16);
  if (scene.textures.exists(cle)) return cle;
  const L = 88, H = 82;
  const t = toileDecor(L, H);
  t.rampes.auvent = rampe(couleur);
  t.rampes.lin = RAMPES_OBJETS.lin;
  for (const x of [2, L - 6]) planche(t, x, 10, 4, H - 10, 'chene', { horizontale: false, graine: 720 + x });
  // L'auvent : bandes alternées, pente vers l'avant, festons en bas
  for (let y = 0; y < 18; y++) for (let x = 0; x < L; x++) {
    const bande = Math.floor(x / 11) % 2;
    const feston = y >= 15 && Math.abs(((x % 11) - 5)) > (18 - y) * 2;
    if (feston) continue;
    const i = 3 + (y < 2 ? 1 : 0) - (y > 12 ? 1 : 0) + ((x % 11) === 0 ? -1 : 0);
    t.poser(x, y, bande ? 'lin' : 'auvent', i);
  }
  // La table de l'étal
  planche(t, 0, 56, L, 5, 'chene', { graine: 721, noeuds: 2 });
  planche(t, 2, 61, L - 4, 18, 'cheneSombre', { graine: 722, noeuds: 1 });
  for (let x = 0; x < L; x++) { t.poser(x, 56, 'chene', 5); t.poser(x, 61, 'cheneSombre', 0); }
  // Une nappe qui retombe sur le devant
  for (let y = 61; y < 70; y++) for (let x = 6; x < L - 6; x++) t.poser(x, y, 'auvent', 2 + ((x >> 2) % 2) + (y === 69 ? -1 : 0));
  t.contour();
  t.texture(scene, cle);
  return cle;
}

// Les pavés de la rue, sur toute la largeur.
function pavesHD(scene, largeur, hauteur = 50) {
  // (v0.57) Des pavés de ville : des rangées qui grandissent vers le bas (la perspective), des pierres
  // de largeurs et de teintes variées, bombées (le haut éclairé, le bas dans l'ombre), coins écornés,
  // joints sombres où poussent un peu de mousse et de terre, quelques pierres fendues.
  const cle = `paves2_${largeur}x${hauteur}`;
  if (scene.textures.exists(cle)) return cle;
  const L = Math.round(largeur / 2), H = Math.round(hauteur / 2);
  const t = toileDecor(L, H);
  t.rampes.paveA = rampe(0x8a8478); t.rampes.paveB = rampe(0x7c7a76); t.rampes.paveC = rampe(0x948a7a);
  t.rampes.joint = rampe(0x4a3e34); t.rampes.mousseJ = rampe(0x5a6a34); t.rampes.terreJ = rampe(0x6a5640);
  // Les rangées : de 3 pixels au loin à 6 au premier plan
  const rangees = []; let y0 = 0, r = 0;
  while (y0 < H) { const h = Math.round(5 + 5 * Math.min(1, y0 / Math.max(8, H - 4))); rangees.push([y0, h, r++]); y0 += h; }
  for (const [ry, rh, ri] of rangees) {
    let x = -Math.floor(hachage(ri, 3, 811) * 6);
    let k = 0;
    while (x < L) {
      const w = Math.round(rh * (0.95 + hachage(ri, k, 812) * 0.9));
      const mat = ['paveA', 'paveB', 'paveC'][Math.floor(hachage(ri, k, 813) * 3)];
      const fendu = hachage(ri, k, 814) > 0.93;
      for (let yy = ry; yy < ry + rh && yy < H; yy++) for (let xx = x; xx < x + w && xx < L; xx++) {
        if (xx < 0) continue;
        // chaque pavé est une pierre arrondie (un « coussin ») posée dans la terre des joints
        const nx = (xx + 0.5 - x - w / 2) / (w / 2 - 0.4), ny = (yy + 0.5 - ry - rh / 2) / (rh / 2 - 0.3);
        const forme = Math.pow(Math.abs(nx), 2.6) + Math.pow(Math.abs(ny), 2.6) + (hachage(xx, yy, 815) - 0.5) * 0.25;
        if (forme > 1) {
          const n = hachage(xx, yy, 816);
          t.poser(xx, yy, n > 0.88 ? 'mousseJ' : n > 0.55 ? 'terreJ' : 'joint', n > 0.88 ? 2 : 2 + (n > 0.7 ? 1 : 0));
          continue;
        }
        const nz = Math.sqrt(Math.max(0, 1 - Math.min(1, forme)));
        let ton = Math.round(2.6 + (-ny * 0.9 - nx * 0.4) * (1 - nz) * 2 + nz * 0.8);
        ton += Math.round((fbm(xx * 0.4, yy * 0.4, 817 + k) - 0.5) * 1.4);
        if (fendu && Math.abs(nx - ny * 0.7) < 0.12) ton = 1;
        t.poser(xx, yy, mat, Math.max(0, Math.min(5, ton)));
      }
      x += w; k++;
    }
  }
  for (let x = 0; x < L; x++) t.poser(x, 0, 'joint', 0);
  t.texture(scene, cle);
  return cle;
}

// --- La Banque Centrale Goyenne ---

function creerBanqueHD(scene) {
  if (scene.textures.exists('murBanque')) return;
  // Le mur : de grands blocs de pierre taillée, des pilastres, une frise dorée
  {
    const L = 480, H = 270;
    const t = toileDecor(L, H);
    // (v0.57) En haut, de grandes plaques de marbre veiné ; en bas, un lambris de bois sombre
    t.rampes.marbre = [0x3a3640, 0x5a5660, 0x7a7680, 0x9894a0, 0xb4b0b8, 0xccc8cc];
    const lambris = 176;
    for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) {
      if (y >= lambris) continue;
      const rangee = Math.floor(y / 34), dec = (rangee % 2) * 24;
      const bx = (x + dec) % 48, by = y % 34;
      if (bx === 0 || by === 0) { t.poser(x, y, 'marbre', 1); continue; }
      const veine = Math.abs(Math.sin(x * 0.045 + y * 0.02 + fbm(x * 0.03, y * 0.03, 741) * 9));
      let i = 3 + (by === 1 || bx === 1 ? 1 : 0) - (bx === 47 || by === 33 ? 1 : 0) + Math.round((fbm(x * 0.05, y * 0.05, 740) - 0.5) * 1.4);
      if (veine < 0.035) i -= 1;
      t.poser(x, y, 'marbre', i);
    }
    for (let x = 0; x < L; x++) { t.poser(x, lambris, 'laiton', 4); t.poser(x, lambris + 1, 'laiton', 2); t.poser(x, lambris + 2, 'cheneSombre', 0); }
    planche(t, 0, lambris + 3, L, H - lambris - 3, 'cheneSombre', { graine: 742, noeuds: 3 });
    for (let k = 0; k < 8; k++) {
      const x0 = 8 + k * 60;
      for (let y = lambris + 12; y < H - 8; y++) for (let x = x0; x < x0 + 46; x++) {
        const bord = Math.min(x - x0, y - lambris - 12, x0 + 45 - x, H - 9 - y);
        if (bord === 0) t.poser(x, y, 'cheneSombre', (x === x0 || y === lambris + 12) ? 0 : 4);
        else if (bord === 1) t.poser(x, y, 'cheneSombre', (x === x0 + 1 || y === lambris + 13) ? 4 : 1);
      }
    }
    for (const x0 of [12, 90, 380, 458]) for (let y = 0; y < lambris; y++) for (let x = x0; x < x0 + 10; x++) {
      t.poser(x, y, 'marbre', x === x0 ? 5 : x === x0 + 9 ? 1 : x === x0 + 4 ? 2 : 4);
    }
    for (let x = 0; x < L; x++) { t.poser(x, 6, 'laiton', 4); t.poser(x, 7, 'laiton', 2); if (x % 6 < 3) t.poser(x, 9, 'laiton', 3); }
    t.texture(scene, 'murBanque');
  }
  // Une bannière de velours rouge, frangée d'or, frappée d'une pièce
  {
    const t = toileDecor(32, 74);
    for (let y = 0; y < 70; y++) for (let x = 0; x < 32; x++) {
      if (y > 62 && Math.abs(x - 16) > (70 - y) * 2.2) continue;
      t.poser(x, y, 'cuirRouge', 3 + (x < 3 ? 1 : 0) - (x > 28 ? 1 : 0) + ((x % 8) === 0 ? -1 : 0));
    }
    for (let x = 0; x < 32; x++) { t.poser(x, 0, 'laiton', 4); t.poser(x, 1, 'laiton', 2); }
    for (let y = 63; y < 74; y++) for (let x = 0; x < 32; x++) if (Math.abs(x - 16) <= (70 - y) * 2.2 + 1 && Math.abs(x - 16) > (70 - y) * 2.2 - 1 && x % 2 === 0) t.poser(x, y, 'laiton', 4);
    t.forme('laiton', ellipsoide(16, 26, 8, 8), { decalage: 0.4 });
    t.forme('laiton', ellipsoide(16, 26, 5.5, 5.5), { decalage: -0.3, bord: false });
    t.dessin(14, 23, ['ooo', 'o..', 'ooo', '..o', 'ooo'].map(l => l), { o: ['laiton', 5] });
    t.contour();
    t.texture(scene, 'banniereHD');
  }
  // L'immense bureau des banquiers : bois sombre verni, panneaux moulurés, filets d'or
  {
    const L = 290, H = 60;
    const t = toileLuxe(L, H, 2);
    t.rampes.laiton = [0x5a3a08, 0x8a6010, 0xc09020, 0xe8c040, 0xf8e070, 0xfffcd0];
    planche(t, 0, 0, L, 7, 'chene', { graine: 750, noeuds: 2 });
    for (let x = 0; x < L; x++) { t.poser(x, 0, 'laiton', 5); t.poser(x, 6, 'laiton', 3); t.poser(x, 7, 'cheneSombre', 0); }
    planche(t, 5, 8, L - 10, H - 8, 'cheneSombre', { graine: 751, noeuds: 2 });
    for (let k = 0; k < 5; k++) {
      const x0 = 30 + k * 50;
      for (let y = 16; y < 50; y++) for (let x = x0; x < x0 + 32; x++) {
        const bord = Math.min(x - x0, y - 16, x0 + 31 - x, 49 - y);
        if (bord === 0) t.poser(x, y, 'laiton', (x === x0 || y === 16) ? 4 : 2);
        else if (bord === 1) t.poser(x, y, 'chene', (x === x0 + 1 || y === 17) ? 1 : 4);
        else {
          const d = Math.abs(x + 0.5 - (x0 + 16)) / 12 + Math.abs(y + 0.5 - 33) / 13;
          t.poser(x, y, 'chene', (d > 0.93 && d < 1.05 ? (y < 33 ? 1 : 5) : d < 0.93 ? 4 : 3) + Math.round((fbm(x * 0.1, y * 0.1, 752 + k) - 0.5)));
        }
      }
    }
    // La plaque de laiton au centre, pour le nom de la banque
    // (v0.57) une plaque biseautée, un filet gravé, quatre rivets
    for (let y = 20; y < 42; y++) for (let x = 66; x < 224; x++) {
      const bord = Math.min(x - 66, y - 20, 223 - x, 41 - y);
      let ton = bord === 0 ? 1 : bord === 1 ? ((x === 67 || y === 21) ? 5 : 2) : bord === 2 ? ((x === 68 || y === 22) ? 4 : 2) : 3 + Math.round((fbm(x * 0.08, y * 0.3, 753) - 0.5) * 1.2);
      if (bord === 4) ton = 2;
      t.poser(x, y, 'laiton', ton);
    }
    for (const [rx, ry] of [[70, 24], [219, 24], [70, 37], [219, 37]]) { t.poser(rx, ry, 'laiton', 5); t.poser(rx + 1, ry + 1, 'laiton', 1); }
    t.contour();
    t.texture(scene, 'bureauBanque');
  }
}

// --- La carte des contrées ---

// Le parchemin du monde, avec les royaumes lavés d'aquarelle, leurs frontières à l'encre, la mer
// à l'ouest, la Grande Muraille à l'est, les fleuves, les routes et les reliefs de chaque contrée.
// Peint à demi-taille du monde (MONDE_CARTE) : on l'affiche en ×2.
// Les limites du monde, en pixels du parchemin : la côte à l'ouest, la Grande Muraille à l'est.
function coteCarte(y) { return 46 + (fbm(0.5, y * 0.03, 771) - 0.5) * 34 + Math.sin(y / 40) * 6; }
function murailleCarte(y) { return 712 + (fbm(y * 0.02, 0.5, 772) - 0.5) * 30 + Math.sin(y / 55) * 8; }
// Le royaume d'un point du parchemin (null : la mer)
function royaumeCarte(x, y) {
  if (x < coteCarte(y)) {
    // quelques îles au large des Mages
    for (const [ix, iy, r] of [[22, 96, 9], [16, 236, 7], [28, 300, 6]]) if (Math.hypot(x - ix, (y - iy) * 1.2) < r + fbm(x * 0.2, y * 0.2, 773) * 4) return 'mages';
    return null;
  }
  if (x > murailleCarte(y)) return 'bannis';
  let meilleur = null, dmin = Infinity;
  for (const [cle, z] of Object.entries(ZONES)) {
    if (!z.royaume || z.royaume === 'bannis') continue;
    const d = Math.hypot(x - z.x / 2, (y - z.y / 2) * 1.15);
    if (d < dmin) { dmin = d; meilleur = z.royaume; }
  }
  for (const [cle, r] of Object.entries(ROYAUMES)) {
    if (cle === 'bannis') continue;
    const d = Math.hypot(x - r.x / 2, (y - r.y / 2) * 1.15) + 20;
    if (d < dmin) { dmin = d; meilleur = cle; }
  }
  return meilleur;
}
function creerCarteHD(scene) {
  if (scene.textures.exists('carteHD')) return;
  const L = MONDE_CARTE.L / 2, H = MONDE_CARTE.H / 2;
  const t = toileDecor(L, H);
  t.rampes.sepia = [0x2a1808, 0x4a2c12, 0x6a421e, 0x8a5a2c, 0xa8764a, 0xc8a070];
  t.rampes.mer = rampe(melangeCouleur(0x4a88b8, 0xe8d4a4, 0.5));
  t.rampes.fleuve = rampe(melangeCouleur(0x3a78b0, 0xe8d4a4, 0.3));
  for (const [cle, r] of Object.entries(ROYAUMES)) t.rampes['roy_' + cle] = rampe(melangeCouleur(r.couleur, 0xe8d4a4, cle === 'bannis' ? 0.4 : 0.55));
  // Le royaume de chaque point, un peu bruité pour que les frontières serpentent
  const carte = [];
  for (let y = 0; y < H; y++) {
    carte.push([]);
    for (let x = 0; x < L; x++) {
      const bx = x + (fbm(x * 0.05, y * 0.05, 774) - 0.5) * 22, by = y + (fbm(x * 0.05, y * 0.05, 775) - 0.5) * 22;
      carte[y].push(royaumeCarte(bx, by));
    }
  }
  // Le parchemin vieilli, les bords roussis, la mer, et le lavis de chaque royaume
  for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) {
    const bord = Math.min(x, y, L - 1 - x, H - 1 - y);
    const dechire = fbm(x * 0.2, y * 0.2, 760) * 3;
    let i = 4 + Math.round((fbm(x * 0.03, y * 0.05, 761) - 0.5) * 1.6);
    if (fbm(x * 0.02, y * 0.03, 762) > 0.7) i -= 1;      // des taches
    const r = carte[y][x];
    let mat = 'parchemin';
    if (r === null) { mat = 'mer'; i = 3 + ((x * 7 + y * 3) % 23 === 0 ? 1 : 0) + (fbm(x * 0.08, y * 0.08, 776) > 0.6 ? 1 : 0); }
    else if (fbm(x * 0.04, y * 0.04, 777) < 0.82) { mat = 'roy_' + r; i = 4 + (fbm(x * 0.09, y * 0.09, 778) > 0.62 ? -1 : 0); }
    if (bord < dechire + 2) i -= 2;
    else if (bord < dechire + 5) i -= 1;
    t.poser(x, y, mat, Math.max(0, Math.min(5, i)));
  }
  const encre = (x, y, i = 1) => { x = Math.round(x); y = Math.round(y); if (t.dans(x, y)) t.poser(x, y, 'sepia', i); };
  // La côte à l'encre, avec des vaguelettes au large
  for (let y = 0; y < H; y++) for (let x = 1; x < L; x++) if ((carte[y][x] === null) !== (carte[y][x - 1] === null)) { encre(x, y, 1); encre(x - 1, y, 3); }
  for (let k = 0; k < 40; k++) {
    const vx = 6 + hachage(k, 1, 779) * 40, vy = 6 + hachage(k, 2, 779) * (H - 12);
    if (carte[Math.round(vy)] && carte[Math.round(vy)][Math.round(vx)] === null) for (let j = -2; j <= 2; j++) encre(vx + j, vy - (Math.abs(j) === 1 ? 1 : 0), 3);
  }
  // Les frontières des royaumes, en pointillé
  for (let y = 1; y < H; y++) for (let x = 1; x < L; x++) {
    const r = carte[y][x];
    if (r === null || (x + y) % 3 === 0) continue;
    if ((carte[y][x - 1] !== r && carte[y][x - 1] !== null) || (carte[y - 1][x] !== r && carte[y - 1][x] !== null)) encre(x, y, 2);
  }
  // (un tracé très ancien, presque effacé, qui passe bien plus à l'ouest que la Muraille... Personne ne sait ce qu'il borde.)
  for (let y = 4; y < H - 4; y += 5) encre(452 + (fbm(y * 0.03, 2.5, 780) - 0.5) * 60, y, 5);
  // Les fleuves : le Grand Fleuve descend des montagnes des Nains jusqu'à la mer, près de Port-Brisant ;
  // un ruisseau traverse la Comté.
  const fleuve = (points, larg) => {
    for (let k = 0; k < points.length - 1; k++) {
      const [x0, y0] = points[k], [x1, y1] = points[k + 1], n = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
      for (let j = 0; j <= n; j++) {
        const x = x0 + (x1 - x0) * j / n + Math.sin((k * 40 + j) / 6) * 1.5, y = y0 + (y1 - y0) * j / n;
        for (let dx = 0; dx < larg; dx++) if (t.dans(Math.round(x + dx), Math.round(y))) t.poser(Math.round(x + dx), Math.round(y), 'fleuve', dx === 0 ? 2 : 4);
        encre(x - 1, y, 3); encre(x + larg, y, 3);
      }
    }
  };
  // (v1.15) Les eaux du monde : des lacs (dont l'étang où l'on pêche, près de ton comptoir), une baie au sud-ouest,
  // le lac gelé des Nains, le Fleuve des Cendres chez les Bannis, et des affluents. Une forme d'eau, bruitée sur ses
  // bords, cernée d'encre ; les fleuves sont tracés par-dessus.
  t.rampes.glace = rampe(melangeCouleur(0xa8d0e8, 0xe8d4a4, 0.35));
  t.rampes.cendres = rampe(melangeCouleur(0x4a4a6a, 0xe8d4a4, 0.35));
  const eau = (cx, cy, rx, ry, mat, graine) => {
    const dedans = (x, y) => { const nx = (x - cx) / rx, ny = (y - cy) / ry; return nx * nx + ny * ny + (fbm(x * 0.09, y * 0.09, graine) - 0.5) * 0.7 < 1; };
    for (let y = Math.floor(cy - ry - 4); y <= cy + ry + 4; y++) for (let x = Math.floor(cx - rx - 4); x <= cx + rx + 4; x++) {
      if (!t.dans(x, y) || !dedans(x, y)) continue;
      t.poser(x, y, mat, 3 + (fbm(x * 0.1, y * 0.1, graine + 1) > 0.6 ? 1 : 0) + ((x * 7 + y * 3) % 29 === 0 ? 1 : 0));
      if (!dedans(x - 1, y) || !dedans(x + 1, y) || !dedans(x, y - 1)) encre(x, y, 1); else if (!dedans(x, y + 1)) encre(x, y, 2);
    }
  };
  eau(323, 118, 58, 24, 'mer', 791);      // le lac de Lune, chez les Elfes (la contrée « le lac » est en son milieu)
  eau(436, 362, 15, 8, 'fleuve', 792);    // l'étang du Moulin, près de ton comptoir : on y pêche
  eau(120, 402, 130, 34, 'mer', 793);     // la baie des Brisants, au sud-ouest
  eau(468, 34, 20, 8, 'glace', 794);      // le lac gelé, entre les Pics et la Forge des Nains
  fleuve([[440, 58], [400, 110], [350, 160], [300, 215], [250, 270], [215, 300], [175, 320], [120, 330], [70, 336], [40, 338]], 4);
  fleuve([[300, 138], [292, 172], [298, 210]], 2);                                   // l'affluent qui descend du lac de Lune
  fleuve([[520, 225], [490, 260], [470, 300], [455, 340], [442, 358]], 2);           // le ruisseau de la Comté, jusqu'à l'étang
  fleuve([[560, 120], [528, 150], [500, 172], [470, 180], [430, 168], [398, 128]], 3); // le torrent des Nains, qui rejoint le Grand Fleuve
  { // le Fleuve des Cendres, chez les Bannis : il passe sous le pont, une eau grise et lente
    const sauve = t.rampes.fleuve; t.rampes.fleuve = t.rampes.cendres;
    fleuve([[902, 8], [896, 80], [906, 150], [890, 220], [873, 270], [862, 312], [880, 368], [888, 398]], 3);
    t.rampes.fleuve = sauve;
  }
  // une barque sur le Grand Fleuve, une tortue géante qui nage dans la mer d'Opale (on voit sa carapace et ses nageoires)
  for (let k = -4; k <= 4; k++) encre(262 + k, 262 + Math.abs(k) * 0.3, 0); encre(262, 258, 1); encre(262, 259, 1); encre(263, 257, 2);
  { const tx = 26, ty = 250; for (let a = 0; a < Math.PI; a += 0.08) encre(tx + Math.cos(a) * 9, ty - Math.sin(a) * 5, 1);
    for (let k = -9; k <= 9; k++) encre(tx + k, ty, 1); for (const [dx, dy] of [[-10, 1], [-11, 2], [10, 1], [11, 2], [12, -1], [13, -1]]) encre(tx + dx, ty + dy, 2);
    for (let k = -5; k <= 5; k += 5) encre(tx + k, ty - 3, 3); }
  // Les routes : depuis ton comptoir, chaque contrée se relie à la plus proche déjà reliée (en pointillé)
  const noeuds = [[MONDE_CARTE.comptoir.x / 2, MONDE_CARTE.comptoir.y / 2]];
  const reste = Object.values(ZONES).filter(z => z.camp !== 'mal').map(z => [z.x / 2, z.y / 2]);
  while (reste.length) {
    let best = null;
    for (let a = 0; a < reste.length; a++) for (const n of noeuds) {
      const d = Math.hypot(reste[a][0] - n[0], reste[a][1] - n[1]);
      if (!best || d < best.d) best = { d, a, n };
    }
    const [x1, y1] = reste.splice(best.a, 1)[0], [x0, y0] = best.n;
    noeuds.push([x1, y1]);
    const n = Math.ceil(best.d);
    for (let j = 0; j < n; j++) if (j % 4 < 2) encre(x0 + (x1 - x0) * j / n + Math.sin(j / 9) * 2, y0 + (y1 - y0) * j / n, 2);
  }
  // La Grande Muraille : un rempart crénelé du nord au sud, entre les terres sauvages et celles des Bannis
  for (let y = 0; y < H; y++) {
    const x = murailleCarte(y);
    for (let dx = -1; dx <= 1; dx++) encre(x + dx, y, dx === 1 ? 2 : 0);
    if (y % 6 < 3) { encre(x - 2, y, 1); encre(x - 3, y, 1); }
    if (y % 30 === 15) for (let dy = -3; dy <= 3; dy++) for (let dx = -4; dx <= 3; dx++) if (Math.abs(dy) === 3 || Math.abs(dx) >= 3) encre(x + dx, y + dy, 1);
  }
  // Les reliefs à l'encre autour de chaque contrée : collines, arbres, montagnes, roseaux, colonnes, dunes
  const glyphes = {
    colline: (x, y) => { for (let k = -4; k <= 4; k++) encre(x + k, y - Math.round(Math.sqrt(16 - k * k) * 0.7)); },
    arbre: (x, y) => { for (let k = -2; k <= 2; k++) encre(x + k, y - 3 - Math.round(Math.sqrt(4 - k * k))); encre(x - 2, y - 3); encre(x + 2, y - 3); encre(x, y - 1); encre(x, y); },
    sapin: (x, y) => { for (let k = 0; k < 6; k++) { encre(x - Math.floor(k / 2), y - 6 + k); encre(x + Math.floor(k / 2), y - 6 + k); } encre(x, y + 1); },
    montagne: (x, y) => { for (let k = 0; k < 7; k++) { encre(x - k, y - 7 + k); encre(x + k, y - 7 + k, 2); } for (let k = 1; k < 4; k++) encre(x + k * 0.6 + 1, y - 7 + k * 1.6, 3); },
    roseau: (x, y) => { for (let k = 0; k < 4; k++) { encre(x - 2, y - k); encre(x, y - k - 1); encre(x + 2, y - k); } },
    colonne: (x, y) => { for (let k = 0; k < 6; k++) { encre(x - 1, y - k); encre(x + 1, y - k); } encre(x - 2, y - 6); encre(x + 2, y - 6); encre(x, y - 6); },
    dune: (x, y) => { for (let k = -5; k <= 5; k++) encre(x + k, y - Math.round(Math.cos(k / 3) * 2)); },
  };
  const parBiome = { comte: ['colline', 'arbre'], foret: ['sapin', 'sapin', 'arbre'], marais: ['roseau'], mines: ['montagne'], desert: ['dune'], neige: ['montagne'],
    ruines: ['colonne', 'colline'], antre: ['montagne'], monastere: ['colline', 'arbre'], sanctuaire: ['colonne', 'arbre'], citadelle: ['montagne', 'colonne'],
    bourbier: ['roseau'], repaire: ['sapin'], tour: ['colonne', 'montagne'], cote: ['colline'], opale: ['colonne', 'colline'], badlands: ['montagne', 'dune'], nuitPourpre: ['sapin', 'colonne'] };
  for (const [cle, z] of Object.entries(ZONES)) {
    const zx = z.x / 2, zy = z.y / 2, formes = parBiome[z.biome] || ['colline'];
    for (let k = 0; k < 8; k++) {
      const a = hachage(k, 1, cle.length * 7 + cle.charCodeAt(0)) * Math.PI * 2, rr = 34 + hachage(k, 2, cle.length * 7) * 16;
      glyphes[formes[k % formes.length]](zx + Math.cos(a) * rr * 1.3, zy + Math.sin(a) * rr * 0.8);
    }
  }
  // La chaîne de montagnes des Nains, au nord
  for (let k = 0; k < 18; k++) glyphes.montagne(390 + k * 9 + hachage(k, 3, 781) * 4, 22 + hachage(k, 4, 781) * 14 + (k % 2) * 6);
  // Une rose des vents dans la mer, et un serpent de mer
  const rx = 26, ry = H - 34;
  for (let k = -12; k <= 12; k++) { encre(rx + k, ry, Math.abs(k) < 3 ? 0 : 2); encre(rx, ry + k * 0.8, Math.abs(k) < 3 ? 0 : 2); }
  for (let k = -6; k <= 6; k++) { encre(rx + k, ry + k * 0.8, 3); encre(rx + k, ry - k * 0.8, 3); }
  for (let a = 0; a < 6.28; a += 0.12) encre(rx + Math.cos(a) * 7, ry + Math.sin(a) * 6, 2);
  for (let k = 0; k < 18; k++) encre(14 + k, 170 + Math.sin(k / 2.2) * 3, k < 3 ? 0 : 1);
  encre(13, 169, 0); encre(12, 170, 0);
  t.texture(scene, 'carteHD');
}

// Les gros nuages qui couvrent les contrées pas encore ouvertes : des cumulus pixelisés, blancs
// dessus, gris-bleu dessous, avec un liseré sombre. Trois formes, pour varier les amas.
function creerNuagesCarteHD(scene) {
  if (scene.textures.exists('nuageCarte_0')) return;
  for (let v = 0; v < 3; v++) {
    const L = 64, H = 36, t = toileDecor(L, H);
    t.rampes.nuage = [0x3e434e, 0x5c626e, 0x7a808c, 0x989ea8, 0xb4b8c0, 0xcdd0d6];   // (des nuages gris et lourds)
    const boules = [[18, 22, 12], [32, 16, 14], [46, 22, 11], [26, 26, 10], [40, 27, 10], [10, 27, 7], [54, 28, 7]]
      .map(([x, y, r], i) => [x + (hachage(i, v, 31) - 0.5) * 6, y + (hachage(i, v, 37) - 0.5) * 4, r * (0.85 + hachage(i, v, 41) * 0.3)]);
    t.forme('nuage', (x, y) => {
      if (y > 31) return null;   // (le dessous est plat)
      for (const [bx, by, r] of boules) { const dx = (x + 0.5 - bx) / r, dy = (y + 0.5 - by) / r; if (dx * dx + dy * dy <= 1) return [dx * 0.5, dy * 0.9 - 0.3, Math.sqrt(Math.max(0.1, 1 - dx * dx - dy * dy))]; }
      return null;
    }, { decalage: 0.6, tramage: true });
    t.contour();
    t.texture(scene, 'nuageCarte_' + v);
  }
}

// --- L'eau ---

// Une rivière qui se répète à l'horizontale (pour un tileSprite qu'on fait couler).
function riviereHD(scene) {
  if (scene.textures.exists('riviereHD')) return 'riviereHD';
  const L = 120, H = 25;
  const t = toileDecor(L, H);
  t.rampes.eau = [0x0e2a44, 0x174066, 0x22588a, 0x2f72a8, 0x5a9ac8, 0xbfe4f4];
  for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) {
    // Un bruit qui boucle horizontalement (pour que les tuiles se raccordent)
    const a = (x / L) * Math.PI * 2;
    const n = fbm(Math.cos(a) * 3 + 10, Math.sin(a) * 3 + y * 0.35, 790);
    let i = 3 - Math.floor(y / 9) + (n > 0.62 ? 1 : n < 0.38 ? -1 : 0);
    if (n > 0.7 && (x + y) % 3 === 0) i = 5;           // les reflets
    if (y < 2) i = y ? 4 : 5;                          // la berge éclairée
    t.poser(x, y, 'eau', i);
  }
  t.texture(scene, 'riviereHD');
  return 'riviereHD';
}

// --- Les lieux du marché : l'estrade des enchères, la table des jeux, l'estrade du crieur ---

function creerLieuxMarcheHD(scene) {
  if (scene.textures.exists('estradeEncheres')) return;
  // Une cagette de bois, pour présenter la marchandise sur les étals
  {
    const t = toileDecor(20, 9);
    planche(t, 0, 0, 20, 4, 'chene', { graine: 960, noeuds: 1 });
    planche(t, 0, 4, 20, 5, 'chene', { graine: 961, noeuds: 1 });
    for (let x = 0; x < 20; x++) { t.poser(x, 0, 'chene', 5); t.poser(x, 4, 'cheneSombre', 1); }
    for (const x of [0, 19]) for (let y = 0; y < 9; y++) t.poser(x, y, 'cheneSombre', 2);
    t.contour(); t.texture(scene, 'cagetteHD');
  }
  // L'estrade des enchères : plancher, jupe de velours rouge frangée d'or, marches, portique à bannière
  {
    // Le portique est haut : la bannière flotte au-dessus de la tête du commissaire
    const D = 26, t = toileDecor(70, 46 + D);
    for (const x of [6, 60]) planche(t, x, 0, 4, 28 + D, 'cheneSombre', { horizontale: false, graine: 800 + x });
    planche(t, 4, 0, 62, 3, 'cheneSombre', { graine: 802 });
    for (let y = 3; y < 15; y++) for (let x = 12; x < 58; x++) {
      if (y > 12 && Math.abs(((x - 12) % 9) - 4) > (15 - y) * 2) continue;
      t.poser(x, y, 'cuirRouge', 3 + (x < 14 ? 1 : 0) - (x > 55 ? 1 : 0) + ((x - 12) % 9 === 0 ? -1 : 0));
    }
    for (let x = 12; x < 58; x++) t.poser(x, 3, 'laiton', 4);
    planche(t, 4, 28 + D, 62, 4, 'chene', { graine: 803, noeuds: 2 });
    for (let x = 4; x < 66; x++) t.poser(x, 28 + D, 'chene', 5);
    for (let y = 32 + D; y < 44 + D; y++) for (let x = 6; x < 64; x++) t.poser(x, y, 'cuirRouge', 2 + ((x >> 2) % 2) - (y > 41 + D ? 1 : 0));
    for (let x = 6; x < 64; x++) { t.poser(x, 32 + D, 'laiton', 4); if (x % 2 === 0) t.poser(x, 44 + D, 'laiton', 3); }
    for (let k = 0; k < 3; k++) planche(t, 0, 34 + D + k * 4, 6 - k, 4, 'chene', { graine: 804 + k }); // les marches
    t.contour();
    t.texture(scene, 'estradeEncheres');
  }
  // Le pupitre du commissaire-priseur, et son marteau
  {
    const t = toileDecor(16, 20);
    planche(t, 4, 6, 8, 14, 'chene', { horizontale: false, graine: 810 });
    planche(t, 0, 2, 16, 4, 'chene', { graine: 811 });
    for (let x = 0; x < 16; x++) t.poser(x, 2, 'chene', 5);
    for (let x = 9; x < 14; x++) t.poser(x, 0, 'chene', 2);
    t.poser(13, 0, 'chene', 4); t.poser(13, 1, 'chene', 3);
    t.contour();
    t.texture(scene, 'pupitreHD');
  }
  // La table des jeux : un tapis vert, trois gobelets (le bonneteau), deux dés, deux tabourets
  {
    const t = toileDecor(48, 26);
    t.rampes.feutre = [0x0e2a18, 0x1a4428, 0x245a36, 0x2f7244, 0x48905a, 0x70b07a];
    for (const x of [6, 42]) { t.forme('chene', ellipsoide(x, 19, 4.5, 1.8), { decalage: 0.4 }); planche(t, x - 1, 20, 3, 6, 'chene', { horizontale: false, graine: 812 + x }); }
    planche(t, 22, 14, 4, 12, 'cheneSombre', { horizontale: false, graine: 814 });
    t.forme('chene', ellipsoide(24, 13, 16, 4), { decalage: -0.2 });
    t.forme('feutre', ellipsoide(24, 12, 14.5, 3.2), { bord: false });
    for (const x of [16, 23, 30]) t.forme('cuir', (xx, y) => (y >= 5 && y <= 11 && Math.abs(xx + 0.5 - x) <= 1.6 + (y - 5) * 0.25 ? [(xx + 0.5 - x) / 3, 0, 0.9] : null));
    for (const [x, y] of [[35, 11], [12, 12]]) { for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) t.poser(x + a, y + b - 2, 'lin', 5 - (a === 2 || b === 2 ? 1 : 0)); t.poser(x + 1, y - 1, 'encre', 0); }
    t.contour();
    t.texture(scene, 'tableJeux');
  }
  // L'auvent du coin des jeux : toile violette à franges, poteaux jusqu'au sol, une lanterne
  {
    const L = 96, H = 92, t = toileDecor(L, H);
    t.rampes.auvent = rampe(0x5a3a8a);
    for (const x of [3, L - 7]) planche(t, x, 12, 4, H - 12, 'chene', { horizontale: false, graine: 830 + x });
    for (let y = 0; y < 20; y++) for (let x = 0; x < L; x++) {
      const bande = Math.floor(x / 12) % 2;
      if (y >= 16 && Math.abs((x % 12) - 6) > (20 - y) * 2) continue;
      t.poser(x, y, bande ? 'laiton' : 'auvent', bande ? 2 + (y < 2 ? 1 : 0) : 3 + (y < 2 ? 1 : 0) - (y > 13 ? 1 : 0));
    }
    // La lanterne accrochée sous l'auvent
    for (let y = 20; y < 25; y++) t.poser(16, y, 'fer', 1);
    t.forme('laiton', ellipsoide(16, 28, 2.6, 3.4), { decalage: 0.6 });
    t.contour();
    t.texture(scene, 'auventJeux');
  }
  // L'estrade du crieur : marches, rambarde, et la cloche qu'il fait sonner
  {
    const t = toileDecor(52, 52);
    planche(t, 6, 30, 44, 4, 'chene', { graine: 820, noeuds: 1 });
    for (let x = 6; x < 50; x++) t.poser(x, 30, 'chene', 5);
    planche(t, 8, 34, 40, 18, 'cheneSombre', { graine: 821, noeuds: 2 });
    for (let k = 0; k < 3; k++) planche(t, k * 2, 38 + k * 4, 8 - k * 2, 4, 'chene', { graine: 822 + k });
    for (const x of [8, 26, 46]) planche(t, x, 18, 3, 12, 'chene', { horizontale: false, graine: 825 + x });
    planche(t, 8, 18, 41, 3, 'chene', { graine: 828 });
    // Le poteau et la cloche
    planche(t, 46, 0, 4, 30, 'cheneSombre', { horizontale: false, graine: 829 });
    for (let x = 38; x < 50; x++) t.poser(x, 2, 'cheneSombre', 3);
    t.forme('laiton', (x, y) => (y >= 4 && y <= 12 && Math.abs(x + 0.5 - 40) <= 1.5 + (y - 4) * 0.45 ? [(x + 0.5 - 40) / 5, (y - 8) / 8, 0.8] : null), { decalage: 0.3 });
    t.poser(40, 13, 'fer', 2);
    t.contour();
    t.texture(scene, 'estradeCrieur');
  }
}

// --- L'eau façon « Dave the Diver » : une rivière turquoise, lumineuse, vivante ---
// Trois textures qui se superposent : le dégradé de profondeur, le réseau de caustiques
// (la lumière qui danse sous la surface) et la crête d'écume de la surface.
function creerEauHD(scene) {
  if (scene.textures.exists('eauFondHD')) return;
  const L = 240, H = 32;
  // Le fond : du turquoise lumineux sous la surface au bleu profond, tramé
  {
    const t = toileDecor(L, H);
    t.rampes.eau = [0x0a2a5a, 0x0f3d78, 0x16609a, 0x1f8ab8, 0x34b4d0, 0x62d8e0];
    for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) {
      const v = 5 - (y / H) * 5.2 + (BAYER[y % 4][x % 4] / 16 - 0.5) * 0.9;
      t.poser(x, y, 'eau', Math.max(0, Math.min(5, Math.round(v))));
    }
    t.texture(scene, 'eauFondHD');
  }
  // Les caustiques : un filet de lignes claires et ondulantes (le reste est transparent)
  for (const [cle, graine] of [['caustiquesHD', 1301], ['caustiques2HD', 1302]]) {
    const t = new ToileHD(L, H);
    t.rampes.lumiere = [0x40c0e0, 0x60d0e8, 0x80e0f0, 0xa0f0f8, 0xd0fcff, 0xffffff];
    for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) {
      const a = (x / L) * Math.PI * 2;
      const n = fbm(Math.cos(a) * 4 + 7, Math.sin(a) * 4 + y * 0.28, graine);
      const ligne = Math.abs(((n * 9) % 1) - 0.5);
      if (ligne < 0.07 && y < H - 4) t.poser(x, y, 'lumiere', y < H * 0.4 ? 4 : 2);
    }
    t.texture(scene, cle);
  }
  // La surface : une crête d'écume ondulante, des reflets de ciel
  {
    const t = new ToileHD(L, 8);
    t.rampes.ecume = [0x7ad8e8, 0x9ae4f0, 0xbaeef6, 0xd6f6fa, 0xeefcff, 0xffffff];
    for (let x = 0; x < L; x++) {
      const a = (x / L) * Math.PI * 2;
      const crete = 2.5 + Math.sin(a * 6) * 1.2 + Math.sin(a * 13 + 1) * 0.6;
      for (let y = 0; y < 8; y++) {
        if (y < crete - 0.5) continue;
        if (y < crete + 1) t.poser(x, y, 'ecume', 5);
        else if (y < crete + 2.5 && hachage(x, y, 1303) < 0.5) t.poser(x, y, 'ecume', 3);
      }
    }
    t.texture(scene, 'surfaceHD');
  }
}

// Pose la rivière animée : renvoie un conteneur (pour pouvoir la faire disparaître d'un coup).
function poserRiviereHD(scene, y, hauteur = 60) {
  creerEauHD(scene);
  creerHalo(scene);
  const c = scene.add.container(0, 0);
  const fond = scene.add.tileSprite(0, y, 960, hauteur, 'eauFondHD').setOrigin(0).setTileScale(2, hauteur / 32);
  const caus1 = scene.add.tileSprite(0, y, 960, hauteur, 'caustiquesHD').setOrigin(0).setTileScale(2, hauteur / 32).setAlpha(0.55).setBlendMode(Phaser.BlendModes.ADD);
  const caus2 = scene.add.tileSprite(0, y, 960, hauteur, 'caustiques2HD').setOrigin(0).setTileScale(2, hauteur / 32).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD);
  const surface = scene.add.tileSprite(0, y - 6, 960, 16, 'surfaceHD').setOrigin(0).setTileScale(2);
  c.add([fond, caus1, caus2, surface]);
  // Des rayons de lumière qui plongent dans l'eau, en biais
  for (let i = 0; i < 6; i++) {
    const rx = 80 + i * 160 + Math.random() * 40;
    const rayon = scene.add.triangle(0, 0, rx, y, rx + 34, y, rx + 70, y + hauteur, 0xc8f4ff, 0.12).setOrigin(0).setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({ targets: rayon, alpha: 0.25, duration: 1800 + i * 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    c.add(rayon);
  }
  // Le courant : les couches glissent à des vitesses différentes, la lumière ondule
  scene.tweens.add({ targets: fond, tilePositionX: -480, duration: 16000, repeat: -1 });
  scene.tweens.add({ targets: caus1, tilePositionX: -480, duration: 9000, repeat: -1 });
  scene.tweens.add({ targets: caus2, tilePositionX: 480, duration: 13000, repeat: -1 });
  scene.tweens.add({ targets: surface, tilePositionX: -480, duration: 6000, repeat: -1 });
  scene.tweens.add({ targets: [caus1, caus2], alpha: '-=0.2', duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  // Des scintillements à la surface, et quelques bulles qui remontent
  scene.time.addEvent({ delay: 260, loop: true, callback: () => {
    if (!c.active || !c.visible || c.alpha < 0.1) return;
    const s = scene.add.image(Math.random() * 960, y - 2 + Math.random() * 6, 'halo').setScale(0.08).setTint(0xffffff).setBlendMode(Phaser.BlendModes.ADD);
    c.add(s);
    scene.tweens.add({ targets: s, scale: 0.18, alpha: 0, x: s.x - 30, duration: 700, onComplete: () => s.destroy() });
    if (Math.random() < 0.4) {
      const b = scene.add.circle(Math.random() * 960, y + hauteur - 4, 2, 0xd8f8ff, 0.7);
      c.add(b);
      scene.tweens.add({ targets: b, y: y + 4, x: b.x - 20, alpha: 0.2, duration: 1600, onComplete: () => b.destroy() });
    }
  } });
  return c;
}

// --- Les vignettes des contrées sur la carte ---

// Pour chaque contrée, un petit tableau peint dans un médaillon ovale à liseré d'or :
// des collines et des pommiers pour la Comté, une pagode pour les pandas, une tour pour le nécromancien...
const VIGNETTE_L = 52, VIGNETTE_H = 36;
function creerVignettesZonesHD(scene) {
  for (const [cle, z] of Object.entries(ZONES)) {
    if (!scene.textures.exists('vignetteZone_' + cle)) peindreVignetteZone(scene, cle, z.biome, z.vignette);
  }
  // La version brumeuse des contrées inconnues : un médaillon de parchemin et un point d'interrogation.
  if (!scene.textures.exists('vignetteZone_inconnue')) {
    const t = toileDecor(VIGNETTE_L, VIGNETTE_H);
    const cx = VIGNETTE_L / 2, cy = VIGNETTE_H / 2;
    for (let y = 0; y < VIGNETTE_H; y++) for (let x = 0; x < VIGNETTE_L; x++) {
      const d = Math.hypot((x + 0.5 - cx) / 24.5, (y + 0.5 - cy) / 16.5);
      if (d < 1) t.poser(x, y, 'parchemin', 3 + Math.round(fbm(x * 0.15, y * 0.15, 77) * 2 - (d > 0.8 ? 1 : 0)));
      else if (d < 1.13) t.poser(x, y, 'pierre', d < 1.06 ? 2 : 1);
    }
    t.contour();
    t.texture(scene, 'vignetteZone_inconnue');
  }
}

function peindreVignetteZone(scene, cle, biome, motif = biome) {
  const L = VIGNETTE_L, H = VIGNETTE_H, cx = L / 2, cy = H / 2, RX = 24.5, RY = 16.5;
  const b = BIOMES[biome] || BIOMES.comte;
  const t = toileDecor(L, H);
  const R = t.rampes;
  R.vCiel = rampe(b.ciel); R.vHorizon = rampe(b.horizon); R.vLoin = rampe(b.loin); R.vPres = rampe(b.pres);
  R.vChemin = rampe(b.chemin); R.vSoleil = rampe(b.soleil);
  R.vFeuille = rampe(b.arbres || melangeCouleur(b.pres, 0x1a3a10, 0.35));
  R.vTronc = rampe(0x6a4424); R.vPomme = rampe(0xd83a2a); R.vNeige = rampe(0xf4f8ff); R.vRoche = rampe(b.pics || 0x7a7880);
  R.vEau = rampe(melangeCouleur(b.ciel, 0x2a6a8a, 0.4)); R.vToit = rampe(0xb83a2a); R.vMur = rampe(0xe8dcc0);
  R.vSombre = rampe(b.colonnes || 0x4a4050); R.vFeu = rampe(0xff8a20); R.vOr = rampe(0xd8a838);
  const dansMedaillon = (x, y) => Math.hypot((x + 0.5 - cx) / RX, (y + 0.5 - cy) / RY) < 1;
  const P = (x, y, mat, i) => { x = Math.round(x); y = Math.round(y); if (dansMedaillon(x, y)) t.poser(x, y, mat, i); };
  const forme = (mat, f, opts) => t.forme(mat, (x, y) => dansMedaillon(x, y) ? f(x, y) : null, opts);
  const horizon = 20;

  // Le ciel (dégradé tramé) et le sol
  for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) {
    if (!dansMedaillon(x, y)) continue;
    if (y < horizon) {
      const f = y / horizon * 3 + (BAYER[y % 4][x % 4] + 0.5) / 16 - 0.5;
      if (f > 2.2) t.poser(x, y, 'vHorizon', 3); else t.poser(x, y, 'vCiel', 4 - Math.floor(f / 1.4));
    } else t.poser(x, y, 'vPres', 3 - Math.floor((y - horizon) / 6) + (fbm(x * 0.3, y * 0.3, 5) > 0.6 ? 1 : 0));
  }
  // Collines (une ellipse éclairée), montagnes (un triangle éclairé, neige au sommet)
  const colline = (x0, y0, rx, ry, mat = 'vLoin', dec = 0) => forme(mat, ellipsoide(x0, y0, rx, ry, (x, y) => y < y0 + 0.5), { decalage: dec, bord: false });
  const montagne = (x0, base, w, h, mat = 'vRoche', neige = false) => {
    for (let y = base - h; y <= base; y++) {
      const demi = (y - (base - h)) / h * w;
      for (let x = Math.ceil(x0 - demi); x <= x0 + demi; x++) {
        const cote = x < x0 ? 4 : 2, haut = y < base - h * 0.62;
        P(x, y, neige && haut ? 'vNeige' : mat, neige && haut ? cote + 1 : cote - (y > base - 3 ? 1 : 0));
      }
    }
  };
  const soleil = (x0, y0, r = 3) => forme('vSoleil', ellipsoide(x0, y0, r, r), { decalage: 1.5, bord: false });
  const lune = (x0, y0, r, mat) => { forme(mat, ellipsoide(x0, y0, r, r), { decalage: 1, bord: false }); };
  const pommier = (x0, y0, pommes = true) => {
    for (let k = 0; k < 4; k++) P(x0, y0 - k, 'vTronc', k ? 2 : 1);
    forme('vFeuille', ellipsoide(x0, y0 - 6, 4, 3.5), { decalage: 0.4, motif: (x, y) => (hachage(x, y, 9) - 0.5) * 1.2 });
    if (pommes) for (const [dx, dy] of [[-2, -6], [2, -5], [0, -8], [3, -8]]) P(x0 + dx, y0 + dy, 'vPomme', 3);
  };
  const sapin = (x0, y0, h = 9, mat = 'vFeuille') => {
    P(x0, y0, 'vTronc', 1); P(x0, y0 - 1, 'vTronc', 2);
    for (let k = 0; k < h; k++) {
      const demi = Math.floor(((k % 4) + 1 + (h - k) / 3) * 0.6);
      for (let dx = -demi; dx <= demi; dx++) P(x0 + dx, y0 - h + k, mat, dx < 0 ? 3 : dx > 0 ? 1 : 2);
    }
  };
  const roseau = (x0, y0, h = 5) => { for (let k = 0; k < h; k++) P(x0, y0 - k, 'vFeuille', 3); P(x0, y0 - h, 'vTronc', 3); P(x0, y0 - h - 1, 'vTronc', 2); };
  const rect = (x0, y0, w, h, mat, i) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) P(x, y, mat, typeof i === 'function' ? i(x, y) : i); };
  const colonne = (x0, y0, h, mat = 'vSombre', cassee = false) => {
    rect(x0 - 1, y0 - h, 3, h, mat, (x) => x === x0 - 1 ? 4 : x === x0 ? 3 : 1);
    if (!cassee) rect(x0 - 2, y0 - h - 1, 5, 1, mat, 4);
    rect(x0 - 2, y0 - 1, 5, 1, mat, 2);
  };
  const eau = (y0, y1) => { for (let y = y0; y < y1; y++) for (let x = 0; x < L; x++) P(x, y, 'vEau', 2 + ((x + y * 3) % 7 === 0 ? 2 : (y - y0) % 2)); };

  switch (motif) {
    case 'comte': // des collines verdoyantes, des pommiers et un trou de hobbit
      soleil(40, 7);
      colline(14, horizon + 2, 18, 8); colline(40, horizon + 3, 16, 7, 'vLoin', -0.3);
      colline(26, H, 30, 12, 'vPres', 0.3);
      rect(23, 24, 5, 4, 'vChemin', 3); forme('vOr', ellipsoide(25.5, 26, 2, 2), { bord: true });
      P(25, 26, 'vTronc', 1);
      pommier(11, 27); pommier(39, 28); pommier(33, 22, true);
      break;
    case 'foret': // une forêt profonde de sapins, des rayons de soleil
      for (let k = 0; k < 9; k++) sapin(3 + k * 6, horizon + 2 + (k % 2), 10 + (k % 3), 'vLoin');
      for (let k = 0; k < 6; k++) sapin(5 + k * 9, H - 4 + (k % 2) * 2, 13 + (k % 2) * 3);
      for (let k = 0; k < 14; k++) P(26 + k * 0.5, 4 + k, 'vSoleil', 4);
      break;
    case 'marais': // eaux stagnantes, roseaux, un arbre mort et des feux follets
      colline(26, horizon + 1, 30, 4, 'vLoin', -0.5); eau(horizon + 1, H);
      for (let k = 0; k < 10; k++) roseau(4 + k * 5 + (k % 3), H - 4 - (k % 2) * 3, 4 + (k % 3));
      for (let k = 0; k < 8; k++) P(36 + (k > 4 ? k - 4 : 0), 21 - k, 'vTronc', 1);
      P(35, 15, 'vTronc', 1); P(38, 16, 'vTronc', 1);
      P(16, 14, 'vSoleil', 5); P(30, 11, 'vSoleil', 5); P(20, 17, 'vSoleil', 4);
      break;
    case 'mines': // la montagne, l'entrée étayée, des rails et un wagonnet
      montagne(18, horizon + 4, 16, 16); montagne(38, horizon + 4, 14, 12);
      rect(22, 17, 9, 9, 'vTronc', (x) => x === 22 || x === 30 ? 3 : 0); rect(22, 16, 9, 1, 'vTronc', 4);
      for (let x = 14; x < 40; x++) { P(x, 30, 'vRoche', 4); if (x % 3 === 0) P(x, 31, 'vTronc', 2); }
      rect(33, 26, 6, 4, 'fer', 3); P(34, 25, 'vOr', 5); P(36, 25, 'vOr', 4); P(37, 25, 'vOr', 5);
      break;
    case 'desert': // des dunes, un soleil écrasant, un crâne et un cactus
      soleil(36, 7, 4);
      for (let x = 0; x < L; x++) for (let y = 0; y < H; y++) {
        const d1 = horizon + Math.sin(x / 7) * 2, d2 = 27 + Math.sin(x / 5 + 2) * 2;
        if (y > d2) P(x, y, 'vPres', y < d2 + 1.5 ? 4 : 3); else if (y > d1) P(x, y, 'vLoin', y < d1 + 1.5 ? 4 : 2);
      }
      for (let k = 0; k < 7; k++) P(14, 29 - k, 'vFeuille', 3); P(13, 25, 'vFeuille', 3); P(12, 24, 'vFeuille', 3); P(15, 26, 'vFeuille', 3); P(16, 25, 'vFeuille', 3);
      rect(32, 29, 3, 2, 'vMur', 5); P(32, 30, 'encre', 0); P(34, 30, 'encre', 0);
      break;
    case 'neige': // des pics gelés et des flocons
      montagne(14, H - 2, 15, 24, 'vRoche', true); montagne(36, H - 2, 16, 28, 'vRoche', true);
      for (let x = 0; x < L; x++) for (let y = 30; y < H; y++) P(x, y, 'vNeige', 4);
      for (let k = 0; k < 12; k++) P(hachage(k, 1, 31) * L, hachage(k, 2, 31) * 22, 'vNeige', 5);
      break;
    case 'ruines': // colonnes brisées sous un ciel violet, une couronne oubliée
      lune(40, 7, 3, 'vSoleil');
      colonne(10, 30, 14); colonne(18, 29, 9, 'vSombre', true); colonne(34, 30, 16); colonne(42, 29, 7, 'vSombre', true);
      rect(8, 14, 29, 2, 'vSombre', 4);
      rect(24, 27, 5, 2, 'vOr', 4); P(24, 26, 'vOr', 5); P(26, 26, 'vOr', 5); P(28, 26, 'vOr', 5);
      break;
    case 'antre': // un volcan, une caverne et deux yeux qui brillent
      montagne(26, H, 24, 30, 'vRoche');
      for (let k = 0; k < 6; k++) P(26 + (k % 2), 6 + k, 'vFeu', 5 - (k >> 1));
      forme('encre', ellipsoide(26, H - 1, 8, 9, (x, y) => y < H - 1), { bord: false });
      P(23, 29, 'vFeu', 5); P(29, 29, 'vFeu', 5); P(24, 29, 'vFeu', 3); P(28, 29, 'vFeu', 3);
      break;
    case 'monastere': // une pagode aux toits rouges sur une colline, des bambous
      soleil(10, 7);
      colline(26, H, 30, 14, 'vLoin');
      rect(22, 17, 9, 9, 'vMur', (x) => x === 22 ? 4 : x === 30 ? 2 : 3); rect(25, 21, 3, 5, 'vTronc', 1);
      for (const [y0, w] of [[16, 8], [11, 6]]) for (let k = 0; k < 3; k++) rect(26 - w - k + 1, y0 - k, (w - k) * 2 + 2 * k - 1, 1, 'vToit', 4 - k);
      rect(23, 12, 7, 2, 'vMur', 3); P(26, 7, 'vOr', 5);
      for (const bx of [6, 9, 44, 47]) for (let k = 0; k < 14; k++) P(bx, 31 - k, 'vFeuille', k % 4 === 0 ? 1 : 4);
      break;
    case 'sanctuaire': // de grands arbres argentés, un temple blanc et des lucioles
      for (const [x0, h] of [[8, 16], [44, 18]]) { for (let k = 0; k < h; k++) P(x0, H - 4 - k, 'vMur', 2); forme('vFeuille', ellipsoide(x0, H - 6 - h, 7, 6), { decalage: 0.8 }); }
      colonne(20, 28, 11, 'vMur'); colonne(32, 28, 11, 'vMur');
      for (let k = 0; k < 7; k++) rect(18 + k, 16 - (k < 4 ? k : 6 - k), 1, 1, 'vMur', 5); rect(18, 16, 17, 1, 'vMur', 4);
      for (let k = 0; k < 9; k++) P(hachage(k, 3, 41) * L, 8 + hachage(k, 4, 41) * 18, 'vSoleil', 5);
      break;
    case 'citadelle': // une citadelle blanche à bannières d'or sur son rocher
      soleil(42, 6);
      montagne(26, H, 26, 10, 'vRoche');
      rect(14, 14, 24, 13, 'vSombre', (x, y) => (y === 14 && x % 3 === 0) ? 5 : x < 18 ? 4 : 3);
      rect(12, 9, 6, 18, 'vSombre', (x) => x === 12 ? 5 : 3); rect(34, 9, 6, 18, 'vSombre', (x) => x === 34 ? 5 : 2);
      rect(23, 19, 6, 8, 'vTronc', 1);
      for (const fx of [15, 37]) { for (let k = 0; k < 4; k++) P(fx, 8 - k, 'vTronc', 1); rect(fx + 1, 4, 3, 2, 'vOr', 4); }
      break;
    case 'bourbier': // une mare de boue, des huttes de gobelins, une fumée
      eau(26, H); for (let y = 26; y < H; y++) for (let x = 0; x < L; x++) if (hachage(x, y, 3) > 0.7) P(x, y, 'vChemin', 2);
      for (const hx of [14, 34]) {
        for (let k = 0; k < 7; k++) rect(hx - k, 18 + k, k * 2 + 1, 1, 'vTronc', 2 + (k % 2));
        rect(hx - 1, 23, 3, 2, 'encre', 0);
      }
      for (let k = 0; k < 6; k++) P(34 + Math.sin(k) * 1.5, 16 - k * 1.6, 'vRoche', 4);
      for (let k = 0; k < 7; k++) roseau(3 + k * 7, 33 - (k % 2) * 2, 3);
      break;
    case 'repaire': // une lune rouge, des arbres noirs et des yeux dans la nuit
      lune(26, 9, 5, 'vSoleil');
      for (let k = 0; k < 7; k++) sapin(2 + k * 8, H - 2 - (k % 2) * 3, 14 + (k % 3) * 2, 'vFeuille');
      for (const [ex, ey] of [[13, 26], [37, 24], [25, 29]]) { P(ex, ey, 'vFeu', 5); P(ex + 2, ey, 'vFeu', 5); }
      break;
    case 'tour': // une tour noire au sommet violet, des tombes et des éclairs
      lune(9, 7, 3, 'vSoleil');
      colline(26, H, 30, 8, 'vLoin');
      rect(22, 7, 8, 24, 'vSombre', (x) => x === 22 ? 4 : x < 26 ? 3 : 1);
      for (let k = 0; k < 4; k++) rect(21 + k, 6 - k, 10 - 2 * k, 1, 'vSombre', 3);
      P(26, 2, 'vSoleil', 5); P(25, 12, 'vSoleil', 5); P(27, 18, 'vSoleil', 5);
      for (const gx of [8, 14, 38, 44]) { rect(gx, 28, 3, 4, 'pierre', 3); P(gx + 1, 27, 'pierre', 4); }
      for (let k = 0; k < 5; k++) P(40 + (k % 2), 4 + k * 2, 'vSoleil', 5);
      break    // --- Le grand monde (v0.54) ---
    case 'vergers': // des rangées de pommiers chargés, un moulin et une charrette de pommes
      soleil(9, 6);
      colline(30, horizon + 3, 26, 7);
      rect(38, 9, 5, 9, 'vMur', (x) => x === 38 ? 4 : 2); for (let k = 0; k < 3; k++) rect(38 - k + 1, 8 - k, 5 + 2 * k - 2, 1, 'vToit', 3);
      for (let k = 0; k < 5; k++) { P(40 - k, 11 - k, 'vTronc', 2); P(40 + k, 11 - k, 'vTronc', 2); P(40 - k, 11 + k, 'vTronc', 2); P(40 + k, 11 + k, 'vTronc', 2); }
      for (const [x0, y0] of [[8, 24], [17, 25], [26, 24], [12, 31], [22, 32], [32, 31]]) pommier(x0, y0);
      rect(37, 27, 7, 3, 'vTronc', 3); P(38, 30, 'encre', 0); P(42, 30, 'encre', 0);
      for (let x = 38; x < 43; x++) P(x, 26, 'vPomme', 3 + (x % 2));
      break;
    case 'cote': // la mer, un phare, un quai et un navire aux voiles blanches
      soleil(10, 6);
      eau(18, H);
      rect(34, 6, 4, 13, 'vMur', (x) => x === 34 ? 4 : 2);
      for (let y = 6; y < 19; y++) if (y % 4 >= 2) for (let x = 34; x < 38; x++) P(x, y, 'vToit', x === 34 ? 4 : 2);
      rect(33, 4, 6, 2, 'vSombre', 3); P(35, 3, 'vSoleil', 5); P(36, 3, 'vSoleil', 5);
      colline(40, 22, 12, 4, 'vPres');
      rect(4, 22, 20, 2, 'vTronc', (x) => x % 4 === 0 ? 1 : 3);
      rect(12, 26, 14, 3, 'vTronc', (x) => x === 12 ? 4 : 2); for (let k = 0; k < 3; k++) rect(11 - k + 1, 26 + k, 1, 1, 'vTronc', 2);
      for (let k = 0; k < 11; k++) P(19, 25 - k, 'vTronc', 1);
      for (let k = 0; k < 7; k++) rect(13 + Math.floor(k / 2), 15 + k, 6 - Math.floor(k / 2), 1, 'vMur', 5 - (k % 2));
      for (let k = 0; k < 7; k++) rect(20, 16 + k, 3 + Math.floor(k / 2), 1, 'vMur', 4);
      rect(20, 13, 3, 1, 'vToit', 4);
      break;
    case 'forge': // une porte colossale taillée dans la montagne, deux statues, une forge rougeoyante
      montagne(26, H, 28, 30, 'vRoche'); montagne(8, H, 10, 14, 'vRoche'); montagne(46, H, 10, 15, 'vRoche');
      rect(19, 14, 14, 18, 'vSombre', (x) => x === 19 ? 4 : x > 30 ? 1 : 2);
      for (let k = 0; k < 4; k++) rect(19 + k, 14 - k, 14 - 2 * k, 1, 'vSombre', 3);
      rect(23, 20, 6, 12, 'encre', 0);
      for (let y = 22; y < 32; y++) for (let x = 24; x < 28; x++) if (hachage(x, y, 61) > 0.55) P(x, y, 'vFeu', 3 + (y > 28 ? 1 : 0));
      for (const sx of [15, 37]) { rect(sx, 20, 3, 12, 'vRoche', 4); rect(sx - 1, 18, 5, 2, 'vRoche', 5); P(sx + 1, 17, 'vOr', 4); }
      for (let k = 0; k < 4; k++) P(26 + Math.sin(k) * 2, 8 - k * 1.5, 'vRoche', 4);
      break;
    case 'lac': // un lac d'argent sous deux lunes, des arbres d'argent et des lucioles
      lune(16, 6, 3, 'vSoleil'); lune(36, 8, 2, 'vSoleil');
      for (let y = 21; y < H; y++) for (let x = 0; x < L; x++) P(x, y, 'vEau', 3 + (((x * 3 + y * 7) % 11) === 0 ? 2 : 0));
      for (let k = -2; k <= 2; k++) { P(16 + k, 25, 'vSoleil', 4); P(36 + k * 0.6, 27, 'vSoleil', 4); }
      for (const [x0, h] of [[6, 13], [46, 15]]) { for (let k = 0; k < h; k++) P(x0, 22 - k, 'vMur', 3); forme('vFeuille', ellipsoide(x0, 22 - h, 6, 5), { decalage: 0.8 }); }
      colline(26, 21, 16, 4, 'vLoin');
      for (let k = 0; k < 8; k++) P(hachage(k, 5, 43) * L, 10 + hachage(k, 6, 43) * 20, 'vSoleil', 5);
      break;
    case 'opale': // une cité de tours de cristal sur une falaise, au bord de la mer
      soleil(41, 6, 2);
      eau(26, H);
      montagne(22, 27, 20, 7, 'vLoin');
      for (const [tx, h, w] of [[12, 15, 3], [18, 20, 4], [25, 24, 4], [32, 18, 3], [37, 13, 3]]) {
        rect(tx, 26 - h, w, h, 'vSombre', (x) => x === tx ? 5 : x === tx + w - 1 ? 2 : 4);
        for (let k = 0; k < 4; k++) rect(tx + Math.floor(k / 2), 26 - h - k - 1, Math.max(1, w - k), 1, 'vSombre', 5);
        P(tx + 1, 26 - h + 3, 'vSoleil', 5);
      }
      for (let k = 0; k < 6; k++) P(hachage(k, 7, 47) * L, 4 + hachage(k, 8, 47) * 12, 'vSoleil', 5);
      break;
    case 'bibliotheque': // un dôme fermé de lourdes chaînes, des livres qui volent autour
      soleil(42, 6, 2);
      colline(26, H, 30, 9, 'vLoin');
      rect(14, 15, 24, 13, 'vMur', (x) => x < 18 ? 4 : x > 34 ? 2 : 3);
      forme('vSombre', ellipsoide(26, 15, 10, 7, (x, y) => y < 15), { decalage: 0.6, bord: false });
      for (const cx2 of [17, 22, 30, 35]) colonne(cx2, 28, 12, 'vMur');
      rect(23, 21, 6, 7, 'vTronc', 1);
      for (let k = 0; k < 7; k++) { P(22 + k, 23 + (k % 2), 'fer', 4); }
      for (const [bx, by] of [[8, 9], [44, 12], [10, 20]]) { rect(bx, by, 3, 2, 'vToit', 3); P(bx - 1, by - 1, 'vMur', 5); P(bx + 3, by - 1, 'vMur', 5); }
      break;
    case 'pont': // un vieux pont de pierre moussu sur un torrent, un troll assis dessous
      for (let k = 0; k < 8; k++) sapin(2 + k * 7, horizon + 1 + (k % 2), 9 + (k % 3), 'vLoin');
      eau(26, H);
      for (let x = 6; x < 46; x++) { const y0 = 17 + Math.round(Math.pow((x - 26) / 20, 2) * 4); for (let y = y0; y < y0 + 3; y++) P(x, y, 'vRoche', y === y0 ? 4 : 2); if (hachage(x, 1, 71) > 0.6) P(x, y0 - 1, 'vFeuille', 4); }
      for (const px of [10, 42]) rect(px, 20, 4, 8, 'vRoche', (x) => x === px ? 4 : 2);
      forme('encre', ellipsoide(26, 27, 7, 6, (x, y) => y < 27), { bord: false });
      forme('vLoin', ellipsoide(26, 25, 3, 3), { decalage: 0.5 }); P(25, 24, 'vFeu', 5); P(27, 24, 'vFeu', 5);
      break;
    case 'badlands': // une forteresse de pierre rouge, des pics et des bannières en lambeaux
      soleil(40, 6, 3);
      montagne(10, horizon + 6, 12, 14, 'vRoche'); montagne(44, horizon + 6, 10, 12, 'vRoche');
      rect(13, 14, 26, 14, 'vRoche', (x, y) => (y === 14 && x % 3 === 0) ? 5 : x < 17 ? 4 : 2);
      rect(11, 9, 6, 19, 'vRoche', (x) => x === 11 ? 5 : 3); rect(35, 9, 6, 19, 'vRoche', (x) => x === 35 ? 5 : 2);
      for (let k = 0; k < 4; k++) rect(22 + k, 20 - k, 8 - 2 * k, 1, 'encre', 0); rect(22, 20, 8, 8, 'encre', 0);
      for (const fx of [14, 38]) { for (let k = 0; k < 5; k++) P(fx, 8 - k, 'vTronc', 1); rect(fx + 1, 4, 3, 3, 'vToit', 2); P(fx + 3, 6, 'vToit', 1); }
      break;
    case 'tombeaux': // des pyramides à demi enfouies sous la lune, des obélisques
      lune(40, 7, 4, 'vMur');
      for (let x = 0; x < L; x++) for (let y = 0; y < H; y++) { const d = 26 + Math.sin(x / 6) * 2; if (y > d) P(x, y, 'vPres', y < d + 1.5 ? 4 : 2); }
      for (const [px, base, h] of [[16, 27, 13], [33, 28, 9]]) for (let k = 0; k < h; k++) rect(px - k, base - h + k, 2 * k + 1, 1, 'vLoin', (x) => x < px ? 4 : 2);
      rect(15, 23, 3, 4, 'encre', 0);
      for (const ox of [6, 44]) { rect(ox, 16, 2, 11, 'vLoin', (x) => x === ox ? 4 : 2); P(ox, 15, 'vOr', 5); }
      break;
    case 'vallon': // un vallon fleuri, une cabane de guérisseuse, des herbes qui sèchent et une marmite
      soleil(40, 7);
      colline(12, horizon + 3, 16, 7); colline(40, horizon + 2, 18, 8, 'vLoin', -0.3);
      colline(26, H, 30, 12, 'vPres', 0.3);
      rect(9, 20, 11, 9, 'vMur', (x) => x === 9 ? 4 : 2); for (let k = 0; k < 4; k++) rect(8 + k, 19 - k, 13 - 2 * k, 1, 'vToit', 3 - (k % 2));
      rect(13, 24, 3, 5, 'vTronc', 1);
      for (let k = 0; k < 5; k++) { P(24 + k * 2, 22, 'vFeuille', 4); P(24 + k * 2, 23, 'vFeuille', 3); P(24 + k * 2, 21, 'vTronc', 2); }
      for (let x = 23; x < 34; x++) P(x, 20, 'vTronc', 2);
      forme('vSombre', ellipsoide(40, 29, 3.5, 2.5), { decalage: -0.2 }); P(39, 26, 'vFeu', 5); P(41, 25, 'vFeu', 4); P(40, 24, 'vSoleil', 4);
      for (const [px, py, m] of [[6, 31, 'vPomme'], [18, 33, 'vSoleil'], [30, 32, 'vPomme'], [46, 30, 'vSoleil'], [12, 34, 'vSoleil']]) P(px, py, m, 5);
      break;
    case 'abbaye': // une abbaye de pierre claire, son clocher et sa grande cloche
      soleil(8, 7);
      colline(26, H, 30, 10, 'vLoin');
      rect(14, 18, 24, 12, 'vMur', (x) => x < 18 ? 4 : x > 33 ? 2 : 3);
      for (let k = 0; k < 4; k++) rect(14 - k + 1, 18 - k, 24 + 2 * k - 2, 1, 'vToit', 3);
      rect(30, 6, 7, 24, 'vMur', (x) => x === 30 ? 4 : x > 34 ? 2 : 3); for (let k = 0; k < 4; k++) rect(29 + k, 6 - k, 9 - 2 * k, 1, 'vToit', 3);
      rect(32, 9, 3, 5, 'encre', 0); P(33, 10, 'vOr', 4); P(33, 11, 'vOr', 5); P(33, 12, 'vOr', 3);
      for (const wx of [17, 22, 27]) { rect(wx, 21, 2, 4, 'vSoleil', 4); P(wx, 20, 'vSoleil', 5); P(wx + 1, 20, 'vSoleil', 5); }
      rect(21, 25, 4, 5, 'vTronc', 1);
      P(33, 2, 'vOr', 5); P(33, 3, 'vOr', 4); P(32, 3, 'vOr', 4); P(34, 3, 'vOr', 4);
      break;
    case 'hautgarde': // un fort de pierre grise sur la passe, une bannière bleue, la Muraille au loin
      montagne(10, horizon + 6, 13, 16); montagne(42, horizon + 6, 12, 14);
      for (let x = 0; x < L; x++) if (x % 5 < 3) P(x, 9, 'vRoche', 2);   // (la Muraille, au loin)
      rect(15, 16, 22, 13, 'vRoche', (x, y) => (y === 16 && x % 3 === 0) ? 5 : x < 19 ? 4 : 2);
      rect(13, 11, 6, 18, 'vRoche', (x) => x === 13 ? 5 : 3); rect(33, 11, 6, 18, 'vRoche', (x) => x === 33 ? 5 : 2);
      rect(23, 22, 6, 7, 'encre', 0); for (let k = 0; k < 3; k++) rect(23 + k, 22 - k, 6 - 2 * k, 1, 'encre', 0);
      for (let k = 0; k < 5; k++) P(16, 10 - k, 'vTronc', 1); rect(17, 6, 4, 3, 'vEau', 3); P(18, 7, 'vOr', 5);
      break;
    case 'chamans': // une clairière dans la forêt, un totem, un feu et de la fumée verte
      for (let k = 0; k < 9; k++) sapin(3 + k * 6, horizon + 2 + (k % 2), 10 + (k % 3), 'vLoin');
      for (let k = 0; k < 3; k++) sapin(4 + k * 5, H - 4 + (k % 2) * 2, 13); for (let k = 0; k < 3; k++) sapin(39 + k * 5, H - 4 + (k % 2) * 2, 13);
      forme('vSombre', ellipsoide(26, 30, 10, 3), { decalage: -0.3, bord: false });
      rect(32, 14, 4, 15, 'vTronc', (x) => x === 32 ? 3 : 1); P(33, 16, 'vOr', 4); P(34, 16, 'vOr', 4); P(33, 20, 'vFeu', 4); P(34, 20, 'vFeu', 4); rect(31, 13, 6, 1, 'vTronc', 3);
      for (let k = 0; k < 4; k++) P(20 + (k % 2), 28 - k, 'vFeu', 5 - (k >> 1)); P(19, 29, 'vTronc', 2); P(22, 29, 'vTronc', 2);
      for (let k = 0; k < 6; k++) P(20 + Math.sin(k) * 1.5, 23 - k * 1.8, 'vFeuille', 4);
      break;
    case 'minesRouges': // des falaises de terre rouge, l'entrée d'une mine, un wagonnet et des pépites
      soleil(40, 6, 3);
      montagne(14, horizon + 5, 15, 15, 'vRoche'); montagne(38, horizon + 5, 14, 13, 'vRoche');
      rect(21, 18, 10, 11, 'vTronc', (x) => x === 21 || x === 30 ? 3 : 0); rect(21, 17, 10, 1, 'vTronc', 4);
      for (let x = 10; x < 44; x++) { P(x, 30, 'vRoche', 4); if (x % 3 === 0) P(x, 31, 'vTronc', 2); }
      rect(34, 26, 6, 4, 'fer', 3); P(35, 25, 'vOr', 5); P(37, 25, 'vOr', 4); P(38, 25, 'vOr', 5);
      for (let y = 20; y < 28; y++) for (let x = 23; x < 29; x++) if (hachage(x, y, 63) > 0.6) P(x, y, 'vFeu', 3);
      break;
    case 'col': // un col gelé entre deux pics, une grotte, et des yeux dans la nuit
      lune(26, 7, 4, 'vSoleil');
      montagne(10, H - 2, 15, 26, 'vRoche', true); montagne(42, H - 2, 15, 26, 'vRoche', true);
      for (let x = 0; x < L; x++) for (let y = 29; y < H; y++) P(x, y, 'vNeige', 4);
      forme('encre', ellipsoide(26, 30, 6, 6, (x, y) => y < 30), { bord: false });
      for (const [ex, ey] of [[23, 27], [28, 26], [8, 24], [44, 25]]) { P(ex, ey, 'vSoleil', 5); P(ex + 2, ey, 'vSoleil', 5); }
      for (let k = 0; k < 10; k++) P(hachage(k, 1, 37) * L, hachage(k, 2, 37) * 22, 'vNeige', 5);
      break;
    case 'nuitPourpre': // un château gothique aux fenêtres rouges sous une lune pâle, des chauves-souris
      lune(12, 8, 4, 'vSoleil');
      colline(26, H, 30, 10, 'vLoin');
      rect(18, 12, 16, 17, 'vSombre', (x) => x === 18 ? 4 : x > 31 ? 1 : 2);
      for (const [tx, h] of [[15, 22], [33, 24], [24, 26]]) {
        rect(tx, 29 - h, 4, h, 'vSombre', (x) => x === tx ? 4 : 2);
        for (let k = 0; k < 5; k++) rect(tx + Math.floor(k / 2.5), 29 - h - k - 1, Math.max(1, 4 - Math.floor(k * 0.8)), 1, 'vSombre', 3);
      }
      for (const [wx, wy] of [[16, 12], [26, 9], [34, 11], [21, 18], [29, 18]]) { P(wx, wy, 'vFeu', 4); P(wx, wy + 1, 'vFeu', 3); }
      for (const [cx2, cy2] of [[38, 6], [43, 9], [8, 16]]) { P(cx2, cy2, 'encre', 0); P(cx2 - 1, cy2 - 1, 'encre', 0); P(cx2 + 1, cy2 - 1, 'encre', 0); }
      for (let k = 0; k < 6; k++) { P(4 + k * 1.5, 30 - k * 2, 'vSombre', 2); P(48 - k * 1.5, 30 - k * 2, 'vSombre', 2); }
      break;
  }

  // Le cadre du médaillon : un liseré d'or et un fil d'encre
  for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) {
    const d = Math.hypot((x + 0.5 - cx) / RX, (y + 0.5 - cy) / RY);
    if (d >= 1 && d < 1.1) t.poser(x, y, 'laiton', y < cy - 4 ? 4 : y > cy + 4 ? 1 : 3);
    else if (d >= 0.96 && d < 1) t.poser(x, y, 'laiton', 0);
  }
  t.contour();
  t.texture(scene, 'vignetteZone_' + cle);
}

// Le comptoir sur la carte : une petite échoppe à colombages, son toit de chaume et son enseigne.
function creerComptoirCarteHD(scene) {
  if (scene.textures.exists('comptoirCarteHD')) return;
  const t = toileDecor(30, 28);
  t.rampes.chaume = rampe(0xc89a48); t.rampes.mur = rampe(0xf0e2c0);
  // Le mur crépi et ses colombages
  for (let y = 12; y < 26; y++) for (let x = 4; x < 26; x++) t.poser(x, y, 'mur', x === 4 ? 4 : x > 23 ? 2 : 3);
  for (let y = 12; y < 26; y++) { t.poser(4, y, 'chene', 2); t.poser(15, y, 'chene', 2); t.poser(25, y, 'chene', 1); }
  for (let x = 4; x < 26; x++) { t.poser(x, 12, 'chene', 2); t.poser(x, 18, 'chene', 2); }
  // La porte, la vitrine éclairée et sa marquise rayée
  for (let y = 19; y < 26; y++) for (let x = 7; x < 12; x++) t.poser(x, y, 'cheneSombre', x === 7 ? 3 : 1);
  t.poser(10, 22, 'laiton', 5);
  for (let y = 20; y < 25; y++) for (let x = 17; x < 24; x++) t.poser(x, y, 'flamme', y === 20 ? 4 : 3);
  for (let x = 16; x < 25; x++) t.poser(x, 19, x % 2 ? 'tissuRouge' : 'lin', 3);
  // Le toit de chaume, une cheminée qui fume
  for (let k = 0; k < 11; k++) for (let x = 2 + k; x < 28 - k; x++) t.poser(x, 11 - k, 'chaume', k === 0 ? 1 : (x + k) % 3 === 0 ? 2 : 4 - (x > 15 ? 1 : 0));
  for (let y = 1; y < 6; y++) { t.poser(21, y, 'pierre', 3); t.poser(22, y, 'pierre', 2); }
  // L'enseigne qui pend
  for (let y = 13; y < 16; y++) for (let x = 16; x < 22; x++) t.poser(x, y, 'laiton', y === 13 ? 5 : 3);
  for (let y = 26; y < 28; y++) for (let x = 1; x < 29; x++) t.poser(x, y, 'pierre', 2);
  t.contour();
  t.texture(scene, 'comptoirCarteHD');
}

// --- Le décor de la grand-place du marché ---

// Une fontaine de pierre à deux vasques, des sacs de grain, une charrette à foin, des tonneaux.
function creerDecorPlaceHD(scene) {
  if (scene.textures.exists('fontaineHD')) return;
  // La fontaine (60×44) : un bassin octogonal, une colonne, une vasque haute
  {
    const t = toileDecor(60, 44);
    t.rampes.eauF = rampe(0x4aa8c8);
    t.forme('pierre', (x, y) => (y >= 30 && y <= 41 && x >= 2 && x <= 57 ? [(x - 30) / 40, (y - 35) / 14, 0.85] : null), { motif: (x, y) => ((x + (y % 2) * 3) % 7 === 0 ? -0.8 : 0) });
    t.forme('eauF', ellipsoide(30, 30, 26, 3.5), { decalage: 0.6 });
    for (let x = 6; x < 54; x += 5) t.poser(x, 30, 'eauF', 5);
    t.forme('pierre', (x, y) => (y >= 14 && y <= 30 && Math.abs(x + 0.5 - 30) <= 3 ? [(x - 30) / 4, 0, 0.9] : null));
    t.forme('pierre', ellipsoide(30, 14, 12, 3.5, (x, y) => y >= 12), { decalage: 0.3 });
    t.forme('eauF', ellipsoide(30, 12.5, 10, 2), { decalage: 0.8 });
    t.forme('pierre', (x, y) => (y >= 4 && y <= 12 && Math.abs(x + 0.5 - 30) <= 1.5 ? [0.2, 0, 0.9] : null));
    t.forme('pierre', ellipsoide(30, 4, 3, 2), { decalage: 0.5 });
    t.contour(); t.texture(scene, 'fontaineHD');
  }
  // La charrette (64×38) : un plateau, deux grandes roues, des ridelles, chargée de foin et d'un tonneau
  {
    const t = toileDecor(64, 38);
    t.rampes.foin = rampe(0xd8b048);
    t.forme('foin', ellipsoide(30, 14, 22, 10, (x, y) => y <= 18), { motif: (x, y) => (hachage(x, y, 61) - 0.5) * 1.6 });
    for (let k = 0; k < 18; k++) { const x = 10 + hachage(k, 1, 62) * 40, y = 6 + hachage(k, 2, 62) * 10; t.poser(Math.round(x), Math.round(y), 'foin', 5); t.poser(Math.round(x) + 1, Math.round(y) - 1, 'foin', 4); }
    planche(t, 4, 18, 52, 5, 'chene', { graine: 63, noeuds: 1 });
    for (const x of [6, 18, 30, 42, 54]) for (let y = 12; y < 18; y++) t.poser(x, y, 'cheneSombre', 3);
    trait(t, 'chene', 56, 21, 63, 26, 1);
    for (const cx of [16, 44]) {
      for (let a = 0; a < 6.28; a += 0.05) { t.poser(Math.round(cx + Math.cos(a) * 9), Math.round(28 + Math.sin(a) * 9), 'cheneSombre', a > 3.14 ? 3 : 1); t.poser(Math.round(cx + Math.cos(a) * 8), Math.round(28 + Math.sin(a) * 8), 'chene', 2); }
      for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; trait(t, 'chene', cx, 28, cx + Math.cos(a) * 8, 28 + Math.sin(a) * 8, 0.5); }
      t.forme('fer', ellipsoide(cx, 28, 1.6, 1.6), { decalage: 0.5 });
    }
    t.contour(); t.texture(scene, 'charretteHD');
  }
  // Des sacs de grain (40×24) : trois sacs ventrus, noués, l'un ouvert sur le blé
  {
    const t = toileDecor(40, 24);
    t.rampes.jute = rampe(0xc0a070); t.rampes.ble = rampe(0xe8c050);
    for (const [cx, cy, rx, ry] of [[10, 15, 8, 8], [29, 15, 9, 8.5], [20, 11, 7, 7]]) {
      t.forme('jute', ellipsoide(cx, cy, rx, ry, (x, y) => y <= 23), { motif: (x, y) => ((x + y) % 3 === 0 ? -0.4 : 0) });
      t.poser(cx, Math.round(cy - ry), 'chanvre', 2); t.poser(cx - 1, Math.round(cy - ry) - 1, 'jute', 3); t.poser(cx + 1, Math.round(cy - ry) - 1, 'jute', 3);
    }
    t.forme('ble', ellipsoide(20, 5, 4, 1.6), { decalage: 0.6 });
    t.contour(); t.texture(scene, 'sacsHD');
  }
  // Des tonneaux (34×22) : deux couchés, un debout
  {
    const t = toileDecor(34, 22);
    for (const cx of [8, 24]) {
      t.forme('chene', ellipsoide(cx, 15, 7.5, 6.5, (x, y) => true), { motif: (x, y) => (x % 3 === 0 ? -0.6 : 0) });
      for (const dx of [-4, 4]) for (let y = 9; y <= 21; y++) t.poser(cx + dx, y, 'fer', 2);
    }
    t.forme('chene', (x, y) => (y >= 1 && y <= 12 && x >= 12 && x <= 21 ? [(x - 16.5) / 7, 0, 0.8] : null), { motif: (x, y) => (x % 3 === 0 ? -0.6 : 0) });
    for (const y of [3, 10]) for (let x = 12; x <= 21; x++) t.poser(x, y, 'fer', 3);
    t.contour(); t.texture(scene, 'tonneauxHD');
  }
  // Un pigeon (8×6)
  {
    const t = toileDecor(8, 6);
    t.rampes.plume = rampe(0x8a8a98);
    t.forme('plume', ellipsoide(4, 3.5, 3.5, 2.2));
    t.forme('plume', ellipsoide(6.5, 2, 1.4, 1.4), { decalage: 0.4 });
    t.poser(7, 2, 'flamme', 3); t.poser(3, 5, 'flamme', 2); t.poser(5, 5, 'flamme', 2);
    t.contour(); t.texture(scene, 'pigeonHD');
  }
}

// --- Le sol de la grand-place ---

// La grand-place du marché (480×130, affichée en ×2) : des pavés de teintes variées, une rosace
// de pierres claires autour de la fontaine, des chemins de terre battue (avec leurs ornières)
// qui mènent aux étals et vers les rues, des touffes d'herbe entre les joints, des flaques,
// de la paille tombée des charrettes.
function placeMarcheHD(scene) {
  if (scene.textures.exists('placeMarcheHD')) return 'placeMarcheHD';
  const L = 480, H = 130;
  const t = toileDecor(L, H);
  const R = t.rampes;
  R.pierreChaude = rampe(0xa89478); R.pierreFroide = rampe(0x8a8a8e); R.terre = rampe(0xae9064);
  R.herbe = rampe(0x5f9a48); R.flaque = rampe(0x7ab0d0); R.paille = rampe(0xd8b048);
  const cx = 240, cy = 86; // la fontaine
  // Les chemins : des lignes brisées, du centre vers les étals et vers le bas de la place
  const chemins = [
    [[cx, cy], [170, 52], [80, 22], [30, 6]], [[cx, cy], [236, 30], [250, 0]],
    [[cx, cy], [320, 50], [410, 18], [470, 6]], [[cx, cy], [150, 112], [90, 130]], [[cx, cy], [330, 112], [390, 130]],
  ];
  const distSegment = (x, y, [ax, ay], [bx, by]) => {
    const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
    const u = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l2));
    const px = ax + u * dx - x, py = ay + u * dy - y;
    return { d: Math.hypot(px, py), u, nx: -dy / Math.sqrt(l2), ny: dx / Math.sqrt(l2), ax, ay };
  };
  const surChemin = (x, y) => {
    let meilleur = null;
    for (const c of chemins) for (let k = 0; k < c.length - 1; k++) {
      const r = distSegment(x, y, c[k], c[k + 1]);
      if (!meilleur || r.d < meilleur.d) meilleur = { ...r, signe: (x - r.ax) * r.nx + (y - r.ay) * r.ny };
    }
    return meilleur;
  };
  for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) {
    // La rosace (un ovale, à cause de la perspective)
    const dr = Math.hypot(x + 0.5 - cx, (y + 0.5 - cy) * 1.7);
    const bord = (fbm(x * 0.15, y * 0.15, 771) - 0.5) * 3;
    const c = surChemin(x, y);
    const largeur = 7 + (y / H) * 6 + bord * 1.4;
    if (dr < 30) {
      const anneau = Math.floor(dr / 4.5), a = Math.atan2((y + 0.5 - cy) * 1.7, x + 0.5 - cx);
      const secteurs = 6 + anneau * 5, s = (a + Math.PI) / (2 * Math.PI) * secteurs;
      const joint = dr % 4.5 < 0.9 || s % 1 < 0.12 * (anneau + 1) / 2;
      const motif = anneau % 2 ? 'pierreChaude' : 'pierre';
      t.poser(x, y, motif, joint ? 1 : 3 + (hachage(Math.floor(s), anneau, 772) > 0.6 ? 1 : 0) + (dr > 27 ? -1 : 0));
      if (dr > 28.5) t.poser(x, y, 'pierreFroide', 1);
      continue;
    }
    if (c.d < largeur) {
      // La terre battue, deux ornières, des cailloux
      let i = 3 + Math.round((fbm(x * 0.2, y * 0.2, 773) - 0.5) * 1.6);
      if (Math.abs(Math.abs(c.signe) - largeur * 0.4) < 0.7) i = 2;
      if (c.d > largeur - 1.2) { t.poser(x, y, hachage(x, y, 779) > 0.5 ? 'herbe' : 'terre', 2); continue; }
      if (hachage(x, y, 774) > 0.97) { t.poser(x, y, 'pierre', 4); continue; }
      t.poser(x, y, 'terre', i);
      continue;
    }
    // Les pavés, de trois teintes, posés en rangées décalées
    const rangee = Math.floor(y / 4), dec = (rangee % 2) * 3;
    const bx = (x + dec) % 6, by = y % 4;
    const joint = bx === 0 || by === 0;
    const id = hachage(Math.floor((x + dec) / 6), rangee, 730);
    const mat = id < 0.2 ? 'pierreChaude' : id > 0.85 ? 'pierreFroide' : 'pierre';
    let i = joint ? 1 : 3 + (by === 1 ? 1 : 0) - (bx === 5 ? 1 : 0) + Math.round((id - 0.5) * 1.5);
    if (fbm(x * 0.05, y * 0.08, 775) > 0.68 && !joint) i -= 1; // les zones usées, plus sombres
    if (joint && hachage(x, y, 776) > 0.9) { t.poser(x, y, 'herbe', 2 + Math.round(hachage(y, x, 777) * 2)); continue; }
    t.poser(x, y, mat, i);
  }
  // Des touffes d'herbe dans les coins et le long des bords
  for (let k = 0; k < 60; k++) {
    const x = Math.floor(hachage(k, 1, 778) * L), y = Math.floor(5 + hachage(k, 2, 778) * (H - 8));
    if (Math.hypot(x - cx, (y - cy) * 1.7) < 34) continue;
    const c = surChemin(x, y);
    if (c.d < 9) continue;
    for (const [dx, dy, i] of [[0, 0, 3], [-1, 0, 2], [1, -1, 4], [0, -1, 4], [-1, -1, 3], [2, 0, 2]]) t.poser(x + dx, y + dy, 'herbe', i);
  }
  // Deux flaques qui reflètent le ciel
  for (const [fx, fy, rx, ry] of [[110, 75, 9, 2.6], [372, 98, 11, 3]]) {
    for (let y = Math.floor(fy - ry); y <= fy + ry; y++) for (let x = Math.floor(fx - rx); x <= fx + rx; x++) {
      const d = Math.hypot((x + 0.5 - fx) / rx, (y + 0.5 - fy) / ry);
      if (d < 1) t.poser(x, y, 'flaque', d > 0.8 ? 2 : (x + y) % 5 === 0 ? 5 : 3);
    }
  }
  // De la paille tombée près des charrettes
  for (const [px, py] of [[46, 92], [436, 94]]) for (let k = 0; k < 26; k++) {
    const x = Math.round(px + (hachage(k, 3, px) - 0.5) * 40), y = Math.round(py + (hachage(k, 4, px) - 0.5) * 14);
    t.poser(x, y, 'paille', 3 + (k % 3)); t.poser(x + 1, y + (k % 2 ? 1 : -1), 'paille', 3);
  }
  // Le bord de la place, sous les étals : une bordure de pierres taillées
  for (let x = 0; x < L; x++) { t.poser(x, 0, 'pierre', 0); t.poser(x, 1, 'pierre', x % 8 === 0 ? 1 : 4); t.poser(x, 2, 'pierre', 2); }
  t.texture(scene, 'placeMarcheHD');
  return 'placeMarcheHD';
}

// --- La forêt au premier plan (cinématique d'introduction) ---

// De grands sapins sombres tout près de l'œil, et la voûte des branches en haut de l'écran :
// façon Terraria, quelques silhouettes en couches suffisent à faire sentir la forêt.
function creerForetPremierPlanHD(scene) {
  if (scene.textures.exists('sapinPremierPlanHD')) return;
  // Un sapin (56×190) : tronc épais, branches en étages qui retombent, un peu de mousse
  {
    const t = toileDecor(56, 190);
    t.rampes.sombre = rampe(0x14301a); t.rampes.tronc = rampe(0x2a1a10); t.rampes.mousse = rampe(0x3a6a2a);
    for (let y = 60; y < 190; y++) for (let x = 23; x < 33; x++) t.poser(x, y, 'tronc', x < 25 ? 3 : x > 30 ? 0 : 1 + (hachage(x, y, 91) > 0.7 ? 1 : 0));
    for (let k = 0; k < 9; k++) {
      const y0 = 18 + k * 17, demi = 8 + k * 2.6;
      for (let y = 0; y < 22; y++) for (let x = 0; x < 56; x++) {
        const dx = Math.abs(x + 0.5 - 28), l = demi * (y / 22) + 3 + (fbm(x * 0.3, (y0 + y) * 0.3, 92 + k) - 0.5) * 4;
        if (dx < l && y0 + y < 190) t.poser(x, y0 + y, 'sombre', dx > l - 2 ? 1 : (y < 4 ? 3 : 2) - (hachage(x, y0 + y, 93) > 0.85 ? 1 : 0));
      }
    }
    for (let k = 0; k < 14; k++) { const x = 23 + Math.floor(hachage(k, 1, 94) * 10), y = 120 + Math.floor(hachage(k, 2, 94) * 60); t.poser(x, y, 'mousse', 3); t.poser(x + 1, y, 'mousse', 2); }
    t.contour(); t.texture(scene, 'sapinPremierPlanHD');
  }
  // La voûte (240×44, se répète) : des branches qui pendent, des trouées de ciel
  {
    const t = toileDecor(240, 44);
    t.rampes.sombre = rampe(0x14301a);
    for (let y = 0; y < 44; y++) for (let x = 0; x < 240; x++) {
      const bas = 18 + Math.sin(x / 11) * 7 + Math.sin(x / 3.7) * 4 + (fbm(x * 0.08, y * 0.2, 95) - 0.5) * 10;
      if (y < bas) t.poser(x, y, 'sombre', y > bas - 3 ? 1 : y < 6 ? 0 : 2 - (hachage(x, y, 96) > 0.9 ? 1 : 0));
    }
    for (let k = 0; k < 10; k++) { const x = Math.floor(hachage(k, 3, 97) * 240), h = 22 + Math.floor(hachage(k, 4, 97) * 16); for (let y = 10; y < h; y++) t.poser(x, y, 'sombre', 1); t.poser(x + 1, h - 3, 'sombre', 2); }
    t.texture(scene, 'vouteForetHD');
  }
  // La berge (240×14, se répète) : de l'herbe, puis la terre et des galets qui descendent vers l'eau
  {
    const t = toileDecor(240, 14);
    t.rampes.herbe = rampe(0x3f7a3a); t.rampes.terre = rampe(0x5a4230); t.rampes.galet = rampe(0x8a8a80);
    for (let y = 0; y < 14; y++) for (let x = 0; x < 240; x++) {
      if (y < 3 + (hachage(x, 0, 98) > 0.6 ? 1 : 0)) t.poser(x, y, 'herbe', y === 0 ? 4 : 3);
      else t.poser(x, y, 'terre', y > 11 ? 1 : 2 + (fbm(x * 0.2, y * 0.3, 99) > 0.6 ? 1 : 0));
    }
    for (let k = 0; k < 26; k++) { const x = Math.floor(hachage(k, 5, 100) * 238), y = 6 + Math.floor(hachage(k, 6, 100) * 6); t.poser(x, y, 'galet', 3); t.poser(x + 1, y, 'galet', 2); }
    t.texture(scene, 'bergeHD');
  }
}

// --- La charrette du colporteur : un âne attelé à une charrette à deux roues, chargée de tout ---
function charretteColporteurHD(scene) {
  if (scene.textures.exists('charretteColporteurHD')) return 'charretteColporteurHD';
  const L = 124, H = 66, t = toileDecor(L, H);
  t.rampes.ane = rampe(0x8a7a6a); t.rampes.crin = rampe(0x3a3028); t.rampes.bache = rampe(0x8a7a58); t.rampes.jute = rampe(0xc0a070);
  const sol = H - 2;
  // La charrette, derrière l'âne : les brancards, le plateau, les ridelles, la grande roue
  trait(t, 'chene', 34, 40, 62, 42, 1.4);
  for (const x of [58, 70, 82, 94, 106]) for (let y = 22; y < 40; y++) t.poser(x, y, 'cheneSombre', 3);
  planche(t, 56, 22, 60, 3, 'chene', { graine: 901 });
  planche(t, 56, 39, 62, 5, 'chene', { graine: 902, noeuds: 1 });
  for (let x = 56; x < 118; x++) t.poser(x, 39, 'chene', 5);
  // Le chargement : des sacs ventrus, un tonneau, une marmite de cuivre, le tout sous un coin de bâche
  for (const [cx, cy, rx, ry] of [[66, 32, 7, 7], [80, 33, 8, 6.5]]) {
    t.forme('jute', ellipsoide(cx, cy, rx, ry, (x, y) => y <= 39), { motif: (x, y) => ((x + y) % 3 === 0 ? -0.4 : 0) });
    t.poser(cx, Math.round(cy - ry), 'chanvre', 2);
  }
  t.forme('chene', (x, y) => (y >= 12 && y <= 38 && x >= 94 && x <= 108 ? [(x - 101) / 9, 0, 0.8] : null), { motif: (x, y) => (x % 3 === 0 ? -0.6 : 0) });
  for (const y of [15, 25, 35]) for (let x = 94; x <= 108; x++) t.poser(x, y, 'fer', 3);
  t.forme('laiton', ellipsoide(88, 22, 5.5, 4.5), { decalage: 0.2 }); for (let x = 83; x <= 93; x++) t.poser(x, 18, 'laiton', 1);
  t.forme('bache', (x, y) => (y >= 8 && y <= 24 && x >= 60 && x <= 80 && y >= 8 + Math.abs(x - 70) * 0.5 ? [(x - 70) / 12, -0.3, 0.8] : null), { motif: (x, y) => (y % 5 === 0 ? -0.5 : 0) });
  // La lanterne au bout de sa perche
  for (let y = 4; y < 22; y++) t.poser(112, y, 'cheneSombre', 3);
  for (let y = 4; y < 8; y++) t.poser(113, y, 'fer', 2);
  t.forme('laiton', ellipsoide(116, 11, 3, 4), { decalage: 0.6 }); t.poser(116, 11, 'flamme', 4); t.poser(116, 10, 'flamme', 5);
  // La grande roue cerclée de fer
  for (let a = 0; a < 6.3; a += 0.04) { t.poser(Math.round(86 + Math.cos(a) * 15), Math.round(49 + Math.sin(a) * 15), 'fer', a > 3.14 ? 3 : 1); t.poser(Math.round(86 + Math.cos(a) * 13.5), Math.round(49 + Math.sin(a) * 13.5), 'chene', 2); }
  for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; trait(t, 'chene', 86, 49, 86 + Math.cos(a) * 13, 49 + Math.sin(a) * 13, 0.7); }
  t.forme('fer', ellipsoide(86, 49, 2.4, 2.4), { decalage: 0.5 });
  // L'âne : pattes, corps, queue, encolure, tête aux longues oreilles, crinière, harnais
  for (const [x, dy] of [[14, 0], [20, 1], [32, 0], [38, 1]]) { t.forme('ane', (xx, y) => (y >= 44 && y <= sol - dy && Math.abs(xx + 0.5 - x) < 2.3 ? [(xx + 0.5 - x) / 2.3, 0, 0.9] : null)); t.poser(x - 1, sol - dy, 'crin', 1); t.poser(x, sol - dy, 'crin', 1); t.poser(x + 1, sol - dy, 'crin', 1); }
  t.forme('ane', ellipsoide(26, 37, 17, 10), { motif: (x, y) => (hachage(x, y, 71) > 0.85 ? -0.4 : 0) });
  trait(t, 'crin', 42, 32, 47, 46, 1.2); t.forme('crin', ellipsoide(47, 48, 2, 3));
  t.forme('ane', (x, y) => { const u = (y - 18) / 14; const ax = 14 - u * 2; return y >= 16 && y <= 34 && Math.abs(x + 0.5 - ax) < 4.5 + u * 3 ? [(x + 0.5 - ax) / 6, 0, 0.85] : null; });
  t.forme('ane', ellipsoide(7, 20, 7, 5), { decalage: 0.1 });
  t.forme('ane', ellipsoide(3, 22, 3, 2.4), { decalage: -0.6 });
  for (const [ex, ey, a] of [[9, 11, -0.3], [14, 12, 0.25]]) t.forme('ane', (x, y) => { const dx = x + 0.5 - ex - (y - ey) * a, dy = y + 0.5 - ey; return dx * dx / 2.6 + dy * dy / 22 <= 1 ? [dx / 1.6, dy / 4.7, 0.7] : null; }, { decalage: -0.2 });
  for (let k = 0; k < 10; k++) t.poser(14 + Math.round(k * 0.3), 13 + k * 2, 'crin', 2 + (k % 2));
  t.poser(5, 18, 'encre', 0); t.poser(6, 18, 'encre', 1); t.poser(1, 23, 'crin', 0);
  trait(t, 'cuir', 4, 24, 12, 22, 0.6); trait(t, 'cuir', 12, 30, 40, 36, 0.8); trait(t, 'cuir', 24, 28, 28, 46, 0.7);
  t.poser(26, 30, 'laiton', 5); t.poser(26, 31, 'laiton', 4);
  t.contour();
  t.texture(scene, 'charretteColporteurHD');
  return 'charretteColporteurHD';
}

// --- Le mendiant, assis contre un tonneau, son gros chien couché contre lui ---
// --- Les vitrines : le matériel de chaque métier, posé autour de la table ---
function propsVitrineHD(scene) {
  if (scene.textures.exists('outilsForgeHD')) return;
  const base = (l, h) => { const t = toileDecor(l, h); t.rampes.verre = rampe(0xa8d8e0); t.rampes.baie = rampe(0xb03040); t.rampes.herbe = rampe(0x4a7a3a); t.rampes.miel = rampe(0xe0a030); t.rampes.croute = rampe(0xb87838); t.rampes.mie = rampe(0xf0d8a8); t.rampes.fromage = rampe(0xe8c860); t.rampes.saucisson = rampe(0x8a3a2a); t.rampes.fourrure = rampe(0xd8cfc0); t.rampes.fourrureSombre = rampe(0x6a4a30); t.rampes.chapeau = rampe(0xc8b090); return t; };
  // Le panneau d'outils du forgeron : un marteau, des pinces, trois fers à cheval accrochés
  {
    const t = base(64, 44);
    planche(t, 0, 0, 64, 44, 'cheneSombre', { graine: 501, noeuds: 2 });
    for (const [x, y] of [[4, 4], [59, 4], [4, 39], [59, 39]]) t.poser(x, y, 'fer', 1);
    // le marteau : manche en bois, tête de fer carrée
    t.forme('chene', (x, y) => (x >= 11 && x <= 15 && y >= 10 && y <= 38 ? [(x - 13) / 2.5, 0, 0.85] : null), { decalage: 0.2 });
    t.forme('fer', (x, y) => (x >= 6 && x <= 20 && y >= 5 && y <= 13 ? [(x - 13) / 8, (y - 9) / 4, 0.8] : null), { decalage: 0.3 });
    // les pinces : deux branches qui se croisent, les mâchoires en haut
    for (const d of [-1, 1]) { trait(t, 'fer', 30 + d * 2, 6, 30 + d * 6, 38, 2.2, { decalage: 0.1 }); t.forme('fer', ellipsoide(30 + d * 1.5, 7, 2.2, 3.5), { decalage: 0.2 }); }
    t.poser(30, 22, 'laiton', 4);
    // trois fers à cheval sur des clous
    for (const [hx, hy] of [[48, 10], [55, 24], [46, 34]]) { t.poser(hx, hy - 6, 'fer', 1); t.forme('fer', (x, y) => { const d = Math.hypot(x + 0.5 - hx, y + 0.5 - hy); return d >= 3.6 && d <= 5.6 && y <= hy + 4.2 ? [(x - hx) / 5, (y - hy) / 5, 0.8] : null; }, { decalage: 0.2 }); }
    t.contour(); t.texture(scene, 'outilsForgeHD');
  }
  // Les bocaux de l'apothicaire : baies rouges, herbes, miel ; et un panier de champignons
  {
    const t = base(64, 36);
    const bocal = (x, mat) => {
      t.forme('verre', (x2, y) => (y >= 10 && y <= 33 && Math.abs(x2 + 0.5 - x) < 6 ? [(x2 + 0.5 - x) / 6, 0, 0.9] : null), { decalage: 0.3, motif: (x2, y) => (x2 === x - 4 ? 0.8 : 0) });
      t.forme(mat, (x2, y) => (y >= 16 && y <= 32 && Math.abs(x2 + 0.5 - x) < 5 ? [(x2 + 0.5 - x) / 5, 0, 0.8] : null), { decalage: -0.1, bord: false, motif: (x2, y) => (hachage(x2, y, 61) > 0.8 ? -0.6 : hachage(x2, y, 62) > 0.85 ? 0.5 : 0) });
      t.forme('chene', (x2, y) => (y >= 7 && y <= 10 && Math.abs(x2 + 0.5 - x) < 5.5 ? [0, -0.4, 0.8] : null), { decalage: 0.1 });   // le bouchon
      for (let y = 7; y <= 10; y++) t.poser(x - 6, y, 'parchemin', 3);
    };
    bocal(8, 'baie'); bocal(22, 'herbe'); bocal(36, 'miel');
    // le panier de champignons
    t.forme('chene', (x, y) => (y >= 24 && y <= 34 && Math.abs(x + 0.5 - 53) < 9 - (y - 24) * 0.2 ? [(x + 0.5 - 53) / 9, 0, 0.8] : null), { motif: (x, y) => ((x + y) % 3 === 0 ? -0.6 : 0.2) });
    for (const [mx, my, r, mat] of [[48, 22, 4, 'croute'], [55, 20, 4.5, 'baie'], [60, 23, 3, 'croute']]) { t.forme(mat, (x, y) => (y >= my - r && y <= my + 1 && Math.abs(x + 0.5 - mx) < r * (1 - Math.max(0, my - r - y) / r) ? [(x + 0.5 - mx) / r, -0.3, 0.8] : null), { decalage: 0.2 }); if (mat === 'baie') for (const [px, py] of [[mx - 2, my - 2], [mx + 1, my - 3], [mx + 2, my]]) t.poser(px, py, 'parchemin', 5); for (let y = my + 1; y <= my + 4; y++) t.poser(mx, y, 'mie', 3); }
    t.contour(); t.texture(scene, 'bocauxHD');
  }
  // Les pains et le fromage de l'épicier, les saucissons pendus
  {
    const t = base(64, 40);
    // deux miches, une entière, une entamée
    t.forme('croute', ellipsoide(14, 31, 12, 7), { motif: (x, y) => ((x * 2 + y) % 9 === 0 ? -0.7 : 0) });
    for (const [gx, gy] of [[8, 26], [14, 24], [20, 26]]) t.poser(gx, gy, 'mie', 4);
    t.forme('croute', ellipsoide(38, 33, 10, 5), { motif: (x, y) => ((x + y * 2) % 7 === 0 ? -0.6 : 0) });
    t.forme('mie', (x, y) => (x >= 46 && x <= 48 && y >= 29 && y <= 37 ? [0.8, 0, 0.6] : null), { bord: false });
    // la meule de fromage, une part coupée
    t.forme('fromage', (x, y) => { const d = Math.hypot(x + 0.5 - 54, y + 0.5 - 29); const a = Math.atan2(y + 0.5 - 29, x + 0.5 - 54); return d <= 8 && !(a > -2.3 && a < -1.2) ? [(x - 54) / 8, (y - 29) / 8, 0.8] : null; }, { motif: (x, y) => (hachage(x, y, 71) > 0.88 ? -0.5 : 0) });
    // trois saucissons pendus à une ficelle
    for (const [sx, h] of [[6, 18], [28, 20], [50, 16]]) { for (let y = 0; y < 5; y++) t.poser(sx, y, 'parchemin', 2); t.forme('saucisson', (x, y) => (y >= 5 && y <= h && Math.abs(x + 0.5 - sx - 0.5) < 2.6 ? [(x + 0.5 - sx - 0.5) / 2.6, 0, 0.85] : null), { motif: (x, y) => (y % 4 === 0 ? -0.5 : 0) }); }
    t.contour(); t.texture(scene, 'painsHD');
  }
  // Les fourrures de la tailleuse, pendues à une tringle, et quelques bobines
  {
    const t = base(64, 44);
    for (let x = 0; x < 64; x++) t.poser(x, 2, 'chene', 2 + (x % 7 === 0 ? 1 : 0));
    for (const [fx, mat, l] of [[12, 'fourrure', 10], [34, 'fourrureSombre', 9]]) {
      t.forme(mat, (x, y) => { const demi = l - Math.max(0, y - 28) * 0.6 + Math.sin(x * 1.7) * 0.6; return y >= 3 && y <= 40 && Math.abs(x + 0.5 - fx) < demi ? [(x + 0.5 - fx) / l, 0, 0.8] : null; }, { motif: (x, y) => (hachage(x, y, 81) > 0.8 ? -0.6 : hachage(x, y, 82) > 0.88 ? 0.5 : 0) });
    }
    // les bobines de fil, en bas à droite
    for (const [bx, by, mat] of [[52, 30, 'cuirRouge'], [59, 32, 'laiton'], [55, 39, 'encre']]) { t.forme('chene', ellipsoide(bx, by, 2.2, 4.5), { decalage: 0.1 }); t.forme(mat, (x, y) => (Math.abs(y + 0.5 - by) < 3 && Math.abs(x + 0.5 - bx) < 3.2 ? [(x + 0.5 - bx) / 3.2, 0, 0.9] : null), { decalage: 0.2, motif: (x, y) => (y % 2 ? -0.3 : 0.2) }); }
    t.contour(); t.texture(scene, 'fourruresHD');
  }
}

// Un bouton rond en bois cerclé de laiton, avec une flèche de laiton (vers la droite ; on le
// retourne pour la gauche). Remplace les flèches en caractères du téléphone.
function boutonFlecheHD(scene) {
  if (scene.textures.exists('flecheHD')) return 'flecheHD';
  const L = 26, H = 26, t = toileDecor(L, H);
  t.forme('laiton', ellipsoide(13, 13, 12.5, 12.5), { decalage: 0.2 });
  t.forme('chene', ellipsoide(13, 13, 10.5, 10.5), { decalage: -0.1, motif: (x, y) => (Math.floor(y / 3) % 2 ? -0.35 : 0.1) });
  // la flèche : un fût et une pointe
  t.forme('laiton', (x, y) => (y >= 11 && y <= 14 && x >= 6 && x <= 14 ? [0, (y - 12.5) / 2, 0.9] : null), { decalage: 0.5 });
  t.forme('laiton', (x, y) => (x >= 12 && x <= 20 && Math.abs(y + 0.5 - 13) <= (20 - x) * 0.8 + 0.5 ? [(x - 16) / 4, (y - 13) / 5, 0.9] : null), { decalage: 0.5 });
  t.contour();
  t.texture(scene, 'flecheHD');
  return 'flecheHD';
}

// Une eau de récit : les mêmes couches que la rivière de l'ouverture (fond turquoise, caustiques,
// surface qui scintille), sur une bande de la largeur du gué ou de la rivière à traverser
function eauRecitHD(scene, x, y, l, h) {
  creerEauHD(scene); creerHalo(scene);
  const c = scene.add.container(0, 0);
  const fond = scene.add.tileSprite(x, y, l, h, 'eauFondHD').setOrigin(0.5, 1).setTileScale(2, h / 32);
  const caus1 = scene.add.tileSprite(x, y, l, h, 'caustiquesHD').setOrigin(0.5, 1).setTileScale(2, h / 32).setAlpha(0.5).setBlendMode(Phaser.BlendModes.ADD);
  const caus2 = scene.add.tileSprite(x, y, l, h, 'caustiques2HD').setOrigin(0.5, 1).setTileScale(2, h / 32).setAlpha(0.3).setBlendMode(Phaser.BlendModes.ADD);
  const surface = scene.add.tileSprite(x, y - h + 4, l, 14, 'surfaceHD').setOrigin(0.5, 0.5).setTileScale(2);
  c.add([fond, caus1, caus2, surface]);
  scene.tweens.add({ targets: fond, tilePositionX: -240, duration: 9000, repeat: -1 });
  scene.tweens.add({ targets: caus1, tilePositionX: -240, duration: 5000, repeat: -1 });
  scene.tweens.add({ targets: caus2, tilePositionX: 240, duration: 7000, repeat: -1 });
  scene.tweens.add({ targets: surface, tilePositionX: -240, duration: 3500, repeat: -1 });
  scene.tweens.add({ targets: [caus1, caus2], alpha: '-=0.15', duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  const scintille = scene.time.addEvent({ delay: 220, loop: true, callback: () => {
    if (!c.active) { scintille.remove(); return; }
    if (!c.visible) return;
    const e = scene.add.image(x - l / 2 + Math.random() * l, y - h + 2 + Math.random() * 6, 'halo').setScale(0.07).setTint(0xffffff).setBlendMode(Phaser.BlendModes.ADD);
    c.add(e);
    scene.tweens.add({ targets: e, scale: 0.16, alpha: 0, x: e.x - 20, duration: 600, onComplete: () => e.destroy() });
  } });
  return c;
}

// --- Devant chaque étal : un tapis aux couleurs du marchand, et une petite décoration qui parle de lui ---
function tapisEtalHD(scene, couleur) {
  const cle = 'tapisEtalHD_' + couleur.toString(16);
  if (scene.textures.exists(cle)) return cle;
  const L = 100, H = 16, t = toileDecor(L, H);
  t.rampes.auvent = rampe(couleur);
  for (let y = 1; y < H - 1; y++) for (let x = 4; x < L - 4; x++) {
    const bordure = y <= 2 || y >= H - 3 || x < 8 || x >= L - 8;
    const losange = !bordure && ((x + y) % 8 === 0 || (x - y) % 8 === 0);
    t.poser(x, y, bordure ? 'lin' : 'auvent', (bordure ? 3 : 3) + (losange ? 2 : 0) - (y === H - 2 ? 1 : 0) + ((x * 7 + y * 3) % 13 === 0 ? -1 : 0));
  }
  for (const x of [1, 3, L - 4, L - 2]) for (let y = 2; y < H - 2; y += 2) t.poser(x, y, 'lin', 2); // les franges
  t.contour();
  t.texture(scene, cle);
  return cle;
}

function decorsEtalsHD(scene) {
  if (scene.textures.exists('enclumeHD')) return;
  const base = (l, h) => { const t = toileDecor(l, h); t.rampes.pomme = rampe(0xc83030); t.rampes.drap = rampe(0x2f5a8a); t.rampes.fourrure = rampe(0xe8e0d0); t.rampes.herbe = rampe(0x4a7a3a); t.rampes.lavande = rampe(0x7a5aa8); t.rampes.papier = rampe(0xd8c0a0); t.rampes.ruban = rampe(0xc04060); return t; };
  // L'enclume sur sa souche, le marteau appuyé contre
  {
    const t = base(30, 26);
    t.forme('chene', (x, y) => (y >= 15 && y <= 25 && x >= 7 && x <= 23 ? [(x - 15) / 9, 0, 0.8] : null), { motif: (x, y) => (x % 3 === 0 ? -0.5 : 0) });
    t.forme('fer', (x, y) => (y >= 10 && y <= 15 && x >= 10 && x <= 20 ? [(x - 15) / 6, 0, 0.8] : null), { decalage: -0.2 });
    t.forme('fer', (x, y) => (y >= 6 && y <= 10 && x >= 4 && x <= 27 && !(x < 8 && y > 6 + (x - 4) * 0.8) ? [(x - 15) / 12, -0.4, 0.8] : null));
    for (let x = 8; x <= 27; x++) t.poser(x, 6, 'fer', 5);
    trait(t, 'chene', 27, 24, 29, 8, 0.9); t.forme('fer', (x, y) => (y >= 2 && y <= 8 && x >= 25 && x <= 30 ? [(x - 27) / 3, 0, 0.8] : null), { decalage: 0.2 });
    t.contour(); t.texture(scene, 'enclumeHD');
  }
  // Le chaudron de l'apothicaire, qui bouillonne vert
  {
    const t = base(28, 26);
    t.forme('fer', ellipsoide(14, 15, 11, 9, (x, y) => y >= 7), { decalage: -0.3, motif: (x, y) => (hachage(x, y, 41) > 0.9 ? 0.5 : 0) });
    for (let x = 3; x <= 25; x++) { t.poser(x, 7, 'fer', 4); t.poser(x, 8, 'fer', 2); }
    for (const x of [6, 14, 22]) for (let y = 22; y <= 25; y++) t.poser(x, y, 'fer', 1);
    t.forme('verreVert', ellipsoide(14, 7, 9, 2), { decalage: 0.5 });
    for (const [x, y] of [[9, 4], [16, 3], [20, 5], [12, 1]]) t.forme('verreVert', ellipsoide(x, y, 1.6, 1.6), { decalage: 0.8 });
    trait(t, 'chene', 20, 2, 24, 12, 0.8);
    t.contour(); t.texture(scene, 'chaudronHD');
  }
  // Les bouquets d'herbes séchées pendus à une tringle
  {
    const t = base(40, 22);
    for (let x = 0; x < 40; x++) t.poser(x, 0, 'cheneSombre', 3);
    for (const [x, mat] of [[7, 'herbe'], [20, 'lavande'], [33, 'chanvre']]) {
      t.poser(x, 1, 'chanvre', 2); t.poser(x, 2, 'chanvre', 2);
      t.forme(mat, (xx, y) => (y >= 3 && y <= 19 && Math.abs(xx + 0.5 - x) < 1.5 + (y - 3) * 0.3 ? [(xx + 0.5 - x) / 6, 0, 0.8] : null), { motif: (xx, y) => ((xx * 5 + y * 3) % 7 === 0 ? -0.9 : (xx + y) % 5 === 0 ? 0.6 : 0) });
      t.poser(x - 1, 4, 'lin', 4); t.poser(x, 4, 'lin', 4); t.poser(x + 1, 4, 'lin', 4);
    }
    t.contour(); t.texture(scene, 'herbesHD');
  }
  // Le mannequin de la tailleuse : un buste de toile sur son pied, une fourrure sur l'épaule, une cape bleue
  {
    const t = base(26, 40);
    for (let y = 28; y < 40; y++) t.poser(13, y, 'cheneSombre', 3);
    t.forme('chene', ellipsoide(13, 38, 7, 1.8), { decalage: 0.2 });
    t.forme('toile', (x, y) => (y >= 6 && y <= 28 && Math.abs(x + 0.5 - 13) < 6 + Math.sin((y - 6) / 22 * Math.PI) * 2.5 ? [(x + 0.5 - 13) / 8, 0, 0.85] : null), { motif: (x, y) => (x === 13 ? -0.6 : 0) });
    t.forme('drap', (x, y) => (y >= 8 && y <= 30 && x + 0.5 - 13 > 1 - (y - 8) * 0.1 && x <= 24 ? [(x - 18) / 7, 0, 0.8] : null), { motif: (x, y) => (x % 5 === 0 ? -0.5 : 0) });
    t.forme('fourrure', (x, y) => (y >= 5 && y <= 16 && x >= 3 && x <= 14 && y <= 5 + (x - 3) * 0.3 + 8 ? [(x - 8) / 6, -0.3, 0.8] : null), { motif: (x, y) => ((x + y) % 2 ? 0.5 : -0.3) });
    t.poser(13, 5, 'cheneSombre', 3); t.poser(13, 4, 'cheneSombre', 4);
    t.contour(); t.texture(scene, 'mannequinHD');
  }
  // Les rouleaux d'étoffe appuyés les uns sur les autres
  {
    const t = base(30, 24);
    for (const [x, mat, a] of [[7, 'drap', 0.15], [15, 'tissuRouge', 0], [23, 'verreVert', -0.15]]) {
      t.forme(mat, (xx, y) => { const cx = x + (23 - y) * a; return y >= 2 && y <= 23 && Math.abs(xx + 0.5 - cx) < 3.8 ? [(xx + 0.5 - cx) / 3.8, 0, 0.85] : null; }, { motif: (xx, y) => (y % 6 === 0 ? -0.5 : 0) });
      t.forme('chene', ellipsoide(x + 21 * a, 1.5, 3.2, 1.6), { decalage: 0.2 });
    }
    t.contour(); t.texture(scene, 'rouleauxHD');
  }
  // Le panier de pommes de l'épicier
  {
    const t = base(26, 20);
    t.forme('chanvre', (x, y) => (y >= 8 && y <= 19 && Math.abs(x + 0.5 - 13) < 11 - (y - 8) * 0.35 ? [(x + 0.5 - 13) / 11, 0, 0.85] : null), { motif: (x, y) => ((x + y) % 3 === 0 ? -0.6 : (x - y) % 3 === 0 ? 0.4 : 0) });
    for (const [x, y] of [[5, 7], [10, 5], [16, 5], [21, 7], [13, 8], [8, 9], [18, 9]]) { t.forme('pomme', ellipsoide(x, y, 2.8, 2.6), { decalage: 0.2 }); t.poser(x, y - 3, 'herbe', 2); }
    for (let x = 3; x <= 23; x++) t.poser(x, 9, 'chanvre', 4);
    for (let k = 0; k < 11; k++) t.poser(8 + k, 3 - Math.round(Math.sin(k / 10 * Math.PI) * 3), 'chanvre', 3);
    t.contour(); t.texture(scene, 'panierPommesHD');
  }
  // La pile de paquets-cadeaux de Rosalie
  {
    const t = base(28, 26);
    for (const [x, y, l, h, mat] of [[2, 14, 14, 11, 'tissuRouge'], [15, 16, 12, 9, 'drap'], [6, 4, 13, 10, 'verreVert']]) {
      t.forme(mat, (xx, yy) => (xx >= x && xx < x + l && yy >= y && yy < y + h ? [(xx - x - l / 2) / l, -0.2, 0.85] : null));
      for (let yy = y; yy < y + h; yy++) t.poser(Math.round(x + l / 2), yy, 'ruban', 4);
      for (let xx = x; xx < x + l; xx++) t.poser(xx, Math.round(y + h / 2), 'ruban', 4);
      t.poser(Math.round(x + l / 2) - 1, y - 1, 'ruban', 5); t.poser(Math.round(x + l / 2) + 1, y - 1, 'ruban', 5);
    }
    t.contour(); t.texture(scene, 'paquetsHD');
  }
  // La caisse de bric-à-brac de Firmin : un chandelier, un vase, un cadre
  {
    const t = base(30, 26);
    planche(t, 2, 12, 26, 14, 'chene', { graine: 950, noeuds: 2 });
    for (let x = 2; x < 28; x++) { t.poser(x, 12, 'chene', 5); t.poser(x, 19, 'cheneSombre', 1); }
    for (let y = 2; y <= 12; y++) t.poser(8, y, 'laiton', 3); for (let x = 5; x <= 11; x++) t.poser(x, 11, 'laiton', 4); t.poser(8, 1, 'flamme', 4); t.poser(8, 0, 'flamme', 5);
    t.forme('verreRouge', (x, y) => (y >= 3 && y <= 12 && Math.abs(x + 0.5 - 16) < 2 + Math.sin((y - 3) / 9 * Math.PI) * 2.5 ? [(x + 0.5 - 16) / 4, 0, 0.8] : null));
    for (let y = 4; y <= 12; y++) for (let x = 20; x <= 27; x++) t.poser(x, y, (y === 4 || y === 12 || x === 20 || x === 27) ? 'laiton' : 'encre', (y === 4 || y === 12 || x === 20 || x === 27) ? 4 : 3);
    t.contour(); t.texture(scene, 'bricabracHD');
  }
  // Le porte-chapeaux de Marcelline : un pied de bois, des patères, un chapeau et une écharpe pendus
  {
    const t = base(26, 44);
    for (let y = 4; y < 42; y++) t.poser(12, y, 'cheneSombre', 3);
    t.forme('chene', ellipsoide(12, 42, 8, 1.8), { decalage: 0.2 });
    for (const [x0, x1, y] of [[12, 4, 10], [12, 21, 14], [12, 5, 22]]) trait(t, 'chene', x0, y, x1, y - 3, 0.8);
    t.rampes.feutre = rampe(0x4a3a2a);
    t.forme('feutre', (x, y) => (y >= 1 && y <= 6 && Math.abs(x + 0.5 - 6) < 4 ? [(x + 0.5 - 6) / 4, -0.2, 0.8] : null));
    for (let x = 0; x <= 12; x++) t.poser(x, 7, 'feutre', 3);
    t.forme('tissuRouge', (x, y) => (y >= 11 && y <= 34 && Math.abs(x + 0.5 - 21 - Math.sin(y / 5) * 1.2) < 1.8 ? [0.2, 0, 0.9] : null), { motif: (x, y) => (y % 3 === 0 ? 0.5 : 0) });
    for (let k = 0; k < 4; k++) t.poser(19 + k, 35, 'tissuRouge', 2);
    t.contour(); t.texture(scene, 'porteChapeauxHD');
  }
}

// --- (v0.57) La roulotte de Grippesou ---
// Une roulotte de bric et de broc : caisse de planches peinte de travers, toit bombé couvert d'une
// bâche rapiécée, grosses roues cerclées de fer, lanterne, fenêtre à rideau, marchepied, et tout un
// fatras sur le toit (sacs, une cage, une épée qui dépasse, une casserole qui pend).
function roulotteGrippesouHD(scene) {
  if (scene.textures.exists('roulotteGrippesouHD')) return 'roulotteGrippesouHD';
  const L = 150, H = 104, t = toileDecor(L, H);
  t.rampes.bache = rampe(0xb8a27a); t.rampes.rapiece = rampe(0x7a5a8a); t.rampes.rapiece2 = rampe(0x5a7a5a);
  t.rampes.peint = rampe(0x8a3a2a); t.rampes.jute = rampe(0xb08a58); t.rampes.lueur = [0x5a3010, 0x8a5018, 0xb87820, 0xe0a030, 0xf4c860, 0xfff0b0];
  const sol = H - 2;
  // la caisse de planches, peinte en rouge passé
  planche(t, 22, 46, 104, 36, 'chene', { graine: 951, noeuds: 2 });
  for (let y = 46; y < 82; y++) for (let x = 22; x < 126; x++) {
    if ((x - 22) % 9 === 0) t.poser(x, y, 'chene', 0);
    else if (fbm(x * 0.04, y * 0.07, 953) > 0.4) t.poser(x, y, 'peint', 3 + ((x - 22) % 9 === 1 ? 1 : (x - 22) % 9 === 8 ? -1 : 0) + Math.round((fbm(x * 0.15, y * 0.15, 954) - 0.5) * 1.2));
  }
  for (let x = 20; x < 128; x++) { t.poser(x, 46, 'chene', 5); t.poser(x, 47, 'chene', 4); t.poser(x, 81, 'cheneSombre', 1); t.poser(x, 82, 'cheneSombre', 0); }
  // le toit bombé et sa bâche rapiécée
  t.forme('bache', (x, y) => { const nx = (x + 0.5 - 74) / 60, ny = (y + 0.5 - 50) / 34; return y <= 48 && nx * nx + ny * ny <= 1 ? [nx * 0.7, -0.6, Math.sqrt(Math.max(0.05, 1 - nx * nx))] : null; }, { decalage: 0.3, motif: (x) => ((x - 14) % 12 === 0 ? -0.6 : 0) });
  for (const [x0, y0, l, h, mat] of [[40, 24, 14, 10, 'rapiece'], [92, 30, 12, 9, 'rapiece2'], [66, 18, 10, 7, 'jute']]) {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + l; x++) if (t.mat(x, y) === 'bache') t.poser(x, y, mat, (x === x0 || y === y0) ? 4 : 3);
    for (let x = x0; x < x0 + l; x += 2) { t.poser(x, y0 - 1, 'cheneSombre', 2); t.poser(x, y0 + h, 'cheneSombre', 2); }   // les points de couture
  }
  // le fatras sur le toit : deux sacs, une cage, une épée qui dépasse
  t.forme('jute', ellipsoide(36, 16, 9, 7), { decalage: 0.2 });
  t.forme('jute', ellipsoide(52, 12, 7, 6), { decalage: 0.2 });
  for (let y = 4; y < 18; y++) for (let x = 100; x < 114; x++) if ((x - 100) % 3 === 0 || y === 4 || y === 17) t.poser(x, y, 'laiton', y === 4 ? 5 : 3);
  trait(t, 'fer', 80, 2, 86, 18, 1);
  for (let x = 77; x < 89; x++) t.poser(x, 6, 'laiton', 4);
  // la fenêtre à rideau, éclairée, et l'enseigne peinte de travers
  for (let y = 54; y < 68; y++) for (let x = 90; x < 112; x++) {
    const bord = x === 90 || x === 111 || y === 54 || y === 67;
    t.poser(x, y, bord ? 'cheneSombre' : (x < 96 || x > 105) ? 'rapiece' : 'lueur', bord ? 1 : (x < 96 || x > 105) ? 3 : 4 + (x === 100 ? -1 : 0));
  }
  for (let i = 0; i < 46; i++) for (let j = 0; j < 11; j++) {
    const x = 32 + i, y = 56 + j + Math.round(i * 0.12);
    t.poser(x, y, 'parchemin', j === 0 || j === 10 || i === 0 || i === 45 ? 1 : 4);
  }
  // les lettres : des traits sombres qui imitent « GRIPPESOU »
  for (let i = 0; i < 9; i++) for (let j = 0; j < 5; j++) if (hachage(i, j, 955) > 0.35) t.poser(36 + i * 4 + (j % 2), 59 + j + Math.round((36 + i * 4) * 0.12 - 32 * 0.12), 'cuirRouge', 1);
  // la porte à l'arrière, et son marchepied
  for (let y = 50; y < 81; y++) for (let x = 126; x < 140; x++) t.poser(x, y, 'chene', x === 126 || x === 139 ? 1 : 3 - ((x - 126) % 5 === 0 ? 1 : 0));
  t.poser(136, 66, 'laiton', 5);
  for (const [y0, x0] of [[84, 128], [90, 132]]) for (let x = x0; x < x0 + 12; x++) { t.poser(x, y0, 'chene', 4); t.poser(x, y0 + 1, 'chene', 2); }
  // la lanterne qui pend à l'avant, la casserole accrochée
  for (let y = 40; y < 50; y++) t.poser(16, y, 'fer', 2);
  for (let y = 50; y < 60; y++) for (let x = 12; x < 21; x++) t.poser(x, y, (x === 12 || x === 20 || y === 50 || y === 59) ? 'fer' : 'lueur', (x === 12 || x === 20 || y === 50 || y === 59) ? 2 : 5 - Math.abs(x - 16) * 0.5);
  // (la casserole de cuivre, pendue au crochet sous l'avant-toit)
  for (let y = 46; y < 50; y++) t.poser(26, y, 'fer', 2);
  t.forme('laiton', (x, y) => (y >= 50 && y <= 56 && Math.abs(x + 0.5 - 27) < 5 - (y > 54 ? 1 : 0) ? [(x + 0.5 - 27) / 5, 0, 0.8] : null), { decalage: 0.2 });
  for (let x = 32; x < 36; x++) t.poser(x, 51, 'fer', 2);
  // le dessous et les grosses roues cerclées de fer
  for (let x = 26; x < 122; x++) for (let y = 83; y < 86; y++) t.poser(x, y, 'cheneSombre', 1);
  for (const cx of [44, 104]) {
    const cy = sol - 16, r = 16;
    for (let y = cy - r - 1; y <= cy + r + 1; y++) for (let x = cx - r - 1; x <= cx + r + 1; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy), a = Math.atan2(y + 0.5 - cy, x + 0.5 - cx);
      if (d > r + 0.5) continue;
      if (d > r - 2) t.poser(x, y, 'fer', d > r - 1 ? 2 : 4 - (y > cy ? 1 : 0));
      else if (d > r - 4.5) t.poser(x, y, 'chene', 3 - (y > cy ? 1 : 0));
      else if (d < 3.5) t.poser(x, y, 'chene', d < 1.5 ? 1 : 4);
      else if (Math.abs(((a / (Math.PI / 5)) % 1 + 1) % 1 - 0.5) > 0.38) t.poser(x, y, 'chene', 3);
    }
  }
  t.contour();
  t.texture(scene, 'roulotteGrippesouHD');
  return 'roulotteGrippesouHD';
}

// Un chemin de terre battue : ornières, cailloux, touffes d'herbe au bord (en haut).
function cheminTerreHD(scene, largeur = 960, hauteur = 110) {
  const cle = `cheminTerre_${largeur}x${hauteur}`;
  if (scene.textures.exists(cle)) return cle;
  const L = Math.round(largeur / 2), H = Math.round(hauteur / 2), t = toileDecor(L, H);
  t.rampes.terreC = rampe(0x9a7a50); t.rampes.herbeC = rampe(0x5a8a3a);
  for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) {
    const p = y / H;
    let ton = 3 + Math.round((fbm(x * 0.05, y * 0.25, 961) - 0.5) * 2.2) - (p < 0.08 ? 1 : 0);
    if (Math.abs(y - H * 0.45 - Math.sin(x * 0.01) * 2) < 1.6 || Math.abs(y - H * 0.75 - Math.sin(x * 0.012 + 1) * 2) < 1.8) ton -= 1;   // les ornières
    if (hachage(x, y, 962) > 0.975) ton += 2;
    t.poser(x, y, 'terreC', ton);
    if (y < 6 && fbm(x * 0.2, 0, 963) > 0.45 && y < 6 - fbm(x * 0.5, 1, 964) * 6) t.poser(x, y, 'herbeC', 2 + (y % 2));
  }
  t.texture(scene, cle);
  return cle;
}

// (v0.58) Le fond de l'étal vu de près (480×270, peint en demi-résolution) : le mur de pierre de
// la maison derrière, deux poteaux, le mur de planches du fond avec deux étagères à consoles,
// une tringle de fer sous l'auvent, le plateau du comptoir, et les pavés de la place.
function fondVitrineHD(scene) {
  if (scene.textures.exists('fondVitrineHD')) return 'fondVitrineHD';
  const L = 480, H = 270, t = toileDecor(L, H);
  // la maison derrière : de grosses pierres, dans l'ombre de l'auvent
  for (let y = 0; y < 236; y++) for (let x = 0; x < L; x++) {
    const rang = Math.floor(y / 14), dx = (rang % 2) * 11, bx = Math.floor((x + dx) / 22);
    const joint = y % 14 === 0 || (x + dx) % 22 === 0;
    t.poser(x, y, 'pierre', joint ? 0 : (hachage(bx, rang, 801) > 0.7 ? 1 : 0) + (fbm(x * 0.15, y * 0.15, 802) > 0.62 ? 1 : 0));
  }
  // le mur de planches du fond, entre les poteaux
  for (let k = 0; k * 20 < 360; k++) planche(t, 60 + k * 20, 40, 20, 128, 'cheneSombre', { horizontale: false, graine: 810 + k, noeuds: 1 });
  // deux étagères, sur des consoles
  for (const y of [107, 145]) {
    planche(t, 66, y, 348, 5, 'chene', { graine: 830 + y, noeuds: 2 });
    for (const x of [80, 400]) for (let j = 0; j < 8; j++) for (let e = 0; e <= 8 - j; e++) t.poser(x + (x < 200 ? e : -e), y + 5 + j, 'chene', 1);
  }
  // la tringle de fer sous l'auvent, et ses deux crochets
  for (let x = 70; x < 410; x++) { t.poser(x, 62, 'fer', 4); t.poser(x, 63, 'fer', 2); }
  for (const x of [72, 407]) for (let y = 56; y < 64; y++) t.poser(x, y, 'fer', 3);
  // les deux poteaux
  for (const x0 of [54, 414]) planche(t, x0, 30, 12, 206, 'chene', { horizontale: false, graine: 850 + x0, noeuds: 2 });
  // le plateau du comptoir, épais, et l'ombre dessous
  planche(t, 44, 167, 392, 9, 'chene', { graine: 870, noeuds: 3 });
  for (let x = 44; x < 436; x++) t.poser(x, 176, 'cheneSombre', 0);
  // les pavés de la place
  for (let y = 236; y < H; y++) for (let x = 0; x < L; x++) {
    const rang = Math.floor((y - 236) / 9), dx = (rang % 2) * 7, bx = Math.floor((x + dx) / 14);
    const bord = (y - 236) % 9 === 0 || (x + dx) % 14 === 0;
    t.poser(x, y, 'pierre', bord ? 1 : 2 + Math.round(hachage(bx, rang, 880) * 2));
  }
  t.texture(scene, 'fondVitrineHD');
  return 'fondVitrineHD';
}

// (v0.58) Le drapé du comptoir vu de près (380×62) : de grands plis verticaux, une bande de
// bordure en haut, et une frange festonnée en bas, aux couleurs du marchand.
function nappeVitrineHD(scene, couleur) {
  const cle = 'nappeVitrineHD_' + couleur.toString(16);
  if (scene.textures.exists(cle)) return cle;
  const L = 380, H = 62, t = toileDecor(L, H);
  t.rampes.nappe = rampe(couleur);
  t.rampes.galon = rampe(0xe8c860);
  for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) {
    const feston = 54 + Math.round(Math.abs(Math.sin(x / 9.5 * Math.PI)) * 5);
    if (y > feston) continue;
    if (y < 5) { t.poser(x, y, 'galon', y === 0 ? 1 : y === 4 ? 2 : (x % 6 < 3 ? 4 : 3)); continue; }
    const pli = Math.sin(x / 19 * Math.PI * 2);
    let ton = 3 + Math.round(pli * 1.3 - (y > feston - 3 ? 1 : 0));
    t.poser(x, y, 'nappe', ton);
  }
  // la frange : de petits fils au bas de chaque feston
  for (let x = 2; x < L; x += 3) { const f = 54 + Math.round(Math.abs(Math.sin(x / 9.5 * Math.PI)) * 5); for (let j = 1; j <= 3; j++) t.poser(x, f + j, 'galon', 2); }
  t.texture(scene, cle);
  return cle;
}

// (v0.58) La fontaine de la grand-place, vue de près (260×190, demi-résolution) : un grand bassin
// rond de pierre taillée (le rebord clair, la paroi en blocs, de la mousse au pied), une colonne
// cannelée qui sort de l'eau, une vasque haute et sa boule de pierre. L'eau du bassin est peinte
// à part (elle bouge) : ici, seulement le fond, sombre. Renvoie aussi où sont l'eau et la vasque.
const FONTAINE_PROCHE = { L: 260, H: 190, cx: 130, eauY: 128, eauRx: 100, eauRy: 16, vasqueY: 52, vasqueRx: 40, sommetY: 34 };
function fontaineProcheHD(scene) {
  if (scene.textures.exists('fontaineProcheHD')) return 'fontaineProcheHD';
  const F = FONTAINE_PROCHE, t = toileDecor(F.L, F.H);
  t.rampes.pierre = rampe(0xb8a07a);   // (un grès doré, chaud au soleil du matin)
  t.rampes.mousse = rampe(0x5a7a3a);
  t.rampes.bronze = rampe(0x4a8a78);   // (le bronze vert-de-gris des têtes de lion)
  t.rampes.lierre = rampe(0x3a7a2a);
  t.rampes.eauFond = [0x0a1a24, 0x10283a, 0x16364c, 0x1e4660, 0x285a78, 0x346e90];
  const dans = (x, y, cx, cy, rx, ry) => ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1;
  const ext = { rx: 112, ry: 22 };
  // la colonne cannelée, de l'eau jusqu'à la vasque, et ses deux bagues
  for (let y = F.vasqueY; y < F.eauY; y++) for (let x = F.cx - 8; x <= F.cx + 8; x++) {
    const n = (x + 0.5 - F.cx) / 8.5;
    t.poser(x, y, 'pierre', Math.round(3.4 - n * 1.6 - Math.abs(n) * 0.8 + ((x - F.cx + 8) % 4 === 0 ? -1 : 0)));
  }
  for (const yb of [70, 108]) t.forme('pierre', ellipsoide(F.cx, yb, 11, 3), { decalage: 0.6 });
  // la vasque haute : le dessous en coupe, puis le rebord, puis son eau
  t.forme('pierre', (x, y) => (y >= F.vasqueY && y <= F.vasqueY + 14 && Math.abs(x + 0.5 - F.cx) <= F.vasqueRx - (y - F.vasqueY) * 2.2 ? [(x + 0.5 - F.cx) / F.vasqueRx, 0.5, 0.7] : null), { decalage: -0.3 });
  t.forme('pierre', ellipsoide(F.cx, F.vasqueY, F.vasqueRx, 9), { decalage: 0.9 });
  t.forme('eauFond', ellipsoide(F.cx, F.vasqueY - 1, F.vasqueRx - 6, 6), { decalage: 1.6, bord: false });
  // la boule au sommet, sur son petit pied
  for (let y = F.sommetY + 4; y < F.vasqueY - 4; y++) for (let x = F.cx - 3; x <= F.cx + 3; x++) t.poser(x, y, 'pierre', x < F.cx ? 4 : 2);
  t.forme('pierre', ellipsoide(F.cx, F.sommetY, 7, 7), { decalage: 0.5 });
  // la paroi du bassin : entre le rebord et le sol, en blocs taillés
  for (let y = F.eauY; y < F.H - 2; y++) for (let x = F.cx - ext.rx; x <= F.cx + ext.rx; x++) {
    const nx = (x + 0.5 - F.cx) / ext.rx;
    if (Math.abs(nx) > 1) continue;
    const bas = F.eauY + 38 + Math.sqrt(1 - nx * nx) * ext.ry;
    const haut = F.eauY + Math.sqrt(1 - nx * nx) * ext.ry;
    if (y < haut || y > bas) continue;
    const joint = Math.round(x - F.cx) % 26 === 0 || Math.abs(y - (haut + bas) / 2) < 0.6;
    let ton = Math.round(3.2 - nx * 1.5 - Math.abs(nx) * 0.9) + (joint ? -2 : 0);
    if (y > bas - 4 && hachage(x, y, 905) > 0.45) { t.poser(x, y, 'mousse', 2 + Math.round(hachage(x, 1, 906) * 2)); continue; }
    t.poser(x, y, 'pierre', ton);
  }
  // le rebord : un anneau de pierre claire, épais, avec le fond d'eau sombre au milieu
  for (let y = F.eauY - ext.ry - 2; y <= F.eauY + ext.ry + 2; y++) for (let x = F.cx - ext.rx - 2; x <= F.cx + ext.rx + 2; x++) {
    if (!dans(x, y, F.cx, F.eauY, ext.rx, ext.ry)) continue;
    if (dans(x, y, F.cx, F.eauY, F.eauRx, F.eauRy)) { if (y >= F.eauY - F.eauRy || t.mat(x, y) !== 'pierre') t.poser(x, y, 'eauFond', 1 + Math.round((y - F.eauY + F.eauRy) / (2 * F.eauRy) * 2)); continue; }
    const devant = y > F.eauY;
    t.poser(x, y, 'pierre', devant ? 4 : 5 - (hachage(x >> 2, y, 907) > 0.8 ? 1 : 0));
  }
  // la frise sculptée sous le rebord : un sillon, et des losanges en relief
  for (let x = F.cx - ext.rx + 3; x <= F.cx + ext.rx - 3; x++) {
    const nx = (x + 0.5 - F.cx) / ext.rx, haut = Math.round(F.eauY + Math.sqrt(Math.max(0, 1 - nx * nx)) * ext.ry) + 3;
    const sh = Math.round(-nx * 1.5);
    t.poser(x, haut, 'pierre', 1 + sh); t.poser(x, haut + 7, 'pierre', 1 + sh);
    const m = ((x - F.cx) % 12 + 12) % 12, d = Math.abs(m - 6);
    for (let j = 1; j < 7; j++) if (Math.abs(j - 3.5) + d * 0.6 < 3) t.poser(x, haut + j, 'pierre', 4 + sh);
  }
  // deux têtes de lion en bronze sur la colonne : l'eau sort de leur gueule
  for (const sens of [-1, 1]) {
    const lx = F.cx + sens * 10, ly = 92;
    t.forme('bronze', ellipsoide(lx, ly, 4.5, 4.5), { decalage: 0.4 });
    t.forme('bronze', ellipsoide(lx + sens * 3, ly + 1.5, 2.6, 2), { decalage: 0.7 });   // le museau
    t.poser(Math.round(lx + sens * 4), ly + 2, 'eauFond', 0);                           // la gueule
    t.poser(Math.round(lx + sens * 1), ly - 2, 'eauFond', 1);                           // l'œil
  }
  // du lierre qui grimpe sur la paroi, de chaque côté
  for (const [x0, sens] of [[F.cx - ext.rx + 6, 1], [F.cx + ext.rx - 6, -1]]) {
    for (let k = 0; k < 26; k++) {
      const x = x0 + sens * Math.round(Math.sin(k * 0.7) * 4 + k * 0.5), y = F.H - 4 - k * 1.4;
      t.forme('lierre', ellipsoide(x + (k % 2 ? 2 : -2), y, 2, 1.4), { decalage: 0.3 + (k % 3) * 0.2, bord: false });
    }
  }
  t.contour();
  t.texture(scene, 'fontaineProcheHD');
  return 'fontaineProcheHD';
}

// (v0.58) Un pot de terre cuite fleuri (28×30), posé au pied de la fontaine
function potFleursHD(scene) {
  if (scene.textures.exists('potFleursHD')) return 'potFleursHD';
  const t = toileDecor(28, 30);
  t.rampes.terre = rampe(0xb8603a); t.rampes.feuille = rampe(0x4a8a3a); t.rampes.fleurR = rampe(0xd84050); t.rampes.fleurJ = rampe(0xf0c040);
  t.forme('terre', (x, y) => (y >= 16 && y <= 29 && Math.abs(x + 0.5 - 14) <= 8 - (y - 16) * 0.25 ? [(x + 0.5 - 14) / 9, 0, 0.8] : null));
  t.forme('terre', ellipsoide(14, 16, 9.5, 2.2), { decalage: 0.6 });
  for (const [x, y] of [[8, 12], [12, 9], [17, 10], [20, 13], [14, 13], [10, 14], [18, 14]]) t.forme('feuille', ellipsoide(x, y, 2.6, 1.8), { decalage: 0.3 });
  for (const [x, y, c] of [[9, 8, 'fleurR'], [14, 5, 'fleurJ'], [19, 7, 'fleurR'], [12, 11, 'fleurJ'], [17, 11, 'fleurR']]) { t.forme(c, ellipsoide(x, y, 2.2, 2), { decalage: 0.5 }); t.poser(x, y, 'fleurJ', 5); }
  t.contour();
  t.texture(scene, 'potFleursHD');
  return 'potFleursHD';
}

// (v0.58) Le coin du mendiant (480×270, demi-résolution) : un vieux mur de pierre taché, une
// gouttière, un soupirail, et les pavés de la place.
function murRuelleHD(scene) {
  if (scene.textures.exists('murRuelleHD')) return 'murRuelleHD';
  const L = 480, H = 270, t = toileDecor(L, H);
  t.rampes.pierre = rampe(0x8a7a66);
  for (let y = 0; y < 236; y++) for (let x = 0; x < L; x++) {
    const rang = Math.floor(y / 16), dx = (rang % 2) * 13, bx = Math.floor((x + dx) / 26);
    const joint = y % 16 === 0 || (x + dx) % 26 === 0;
    const tache = fbm(x * 0.04, y * 0.05, 931) > 0.62 ? -1 : 0;   // l'humidité
    t.poser(x, y, 'pierre', joint ? 0 : 2 + tache + (hachage(bx, rang, 932) > 0.75 ? 1 : 0) - (y > 200 ? 1 : 0));
  }
  // la gouttière de fer, et le soupirail grillagé
  for (let y = 0; y < 236; y++) { t.poser(410, y, 'fer', 3); t.poser(411, y, 'fer', 4); t.poser(412, y, 'fer', 2); }
  for (let y = 180; y < 214; y++) for (let x = 300; x < 350; x++) t.poser(x, y, 'fer', (x - 300) % 8 === 0 || (y - 180) % 8 === 0 ? 3 : 0);
  for (let y = 236; y < H; y++) for (let x = 0; x < L; x++) {
    const rang = Math.floor((y - 236) / 9), dx = (rang % 2) * 7, bx = Math.floor((x + dx) / 14);
    t.poser(x, y, 'pierre', (y - 236) % 9 === 0 || (x + dx) % 14 === 0 ? 0 : 1 + Math.round(hachage(bx, rang, 933) * 2));
  }
  t.texture(scene, 'murRuelleHD');
  return 'murRuelleHD';
}

// (v0.74) Le tableau d'affichage du marché, vu de la rue : deux poteaux, un panneau de planches
// sous un petit toit de bardeaux, et ses affiches punaisées (un avis de recherche, la gazette...).
function texturePanneauAffichage(scene) {
  if (scene.textures.exists('panneauAffichageHD')) return 'panneauAffichageHD';
  const L = 42, H = 58, t = toileDecor(L, H);
  t.rampes.papier = rampe(0xe8d6a4); t.rampes.punaise = rampe(0xa02a20); t.rampes.toit = rampe(0x5a3020); t.rampes.encre = rampe(0x3a2210);
  for (const x of [5, 33]) planche(t, x, 10, 4, H - 10, 'cheneSombre', { horizontale: false, graine: 970 + x });
  for (let k = 0; k < 4; k++) planche(t, 1, 13 + k * 7, L - 2, 7, 'chene', { graine: 980 + k, noeuds: 1 });
  for (let y = 13; y < 41; y++) { t.poser(1, y, 'cheneSombre', 1); t.poser(L - 2, y, 'cheneSombre', 1); }
  for (let x = 1; x < L - 1; x++) { t.poser(x, 13, 'cheneSombre', 2); t.poser(x, 40, 'cheneSombre', 1); }
  // le toit de bardeaux
  for (let y = 3; y < 13; y++) for (let x = 0; x < L; x++) {
    const demi = (y - 3) * 2.2 + 2;
    if (Math.abs(x + 0.5 - L / 2) > demi) continue;
    t.poser(x, y, 'toit', 2 + ((x + (y >> 1)) % 4 === 0 ? -1 : 0) + (y % 3 === 0 ? 1 : 0));
  }
  // les affiches : la gazette (des lignes), deux avis de recherche (un portrait, la prime)
  const feuille = (x0, y0, l, h) => {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + l; x++) t.poser(x, y, 'papier', (x === x0 + l - 1 || y === y0 + h - 1) ? 1 : 3);
    t.poser(x0 + (l >> 1), y0, 'punaise', 3);
  };
  feuille(4, 16, 11, 14); for (let k = 0; k < 5; k++) for (let x = 6; x < 13 - (k % 2) * 2; x++) t.poser(x, 19 + k * 2, 'encre', 2);
  for (const x0 of [17, 28]) {
    feuille(x0, 15, 9, 13);
    for (let y = 18; y < 23; y++) for (let x = x0 + 2; x < x0 + 7; x++) t.poser(x, y, 'encre', y === 18 || x === x0 + 2 ? 1 : 3);   // le portrait
    for (let x = x0 + 2; x < x0 + 7; x++) t.poser(x, 25, 'encre', 1);   // la prime
  }
  feuille(14, 31, 12, 7); for (let x = 16; x < 24; x++) t.poser(x, 34, 'encre', 2);
  t.contour(); t.texture(scene, 'panneauAffichageHD');
  return 'panneauAffichageHD';
}

// (v1.62, planche 80 validée) La fontaine de la grand-place vue de loin : la même que de près (fontaineProcheHD), en
// petit et vue un peu plus d'au-dessus. Le bassin rond de grès doré, son rebord clair, la frise de losanges, les blocs,
// la mousse, le lierre ; la colonne cannelée et ses deux bagues, les deux têtes de lion de bronze, la vasque haute, la
// boule ; les deux pots de fleurs. Texture à demi-résolution (132×96), posée ×2 sur la place, comme le sol.
//   sol : le centre du bassin, au sol (en demi-pixels de la texture), pour l'ordre de profondeur et l'obstacle
var FONTAINE_LOIN = { L: 132, H: 96, cx: 66, eauY: 56, ext: { rx: 57, ry: 20 }, eauRx: 50, eauRy: 15, paroi: 17,
  vasqueY: 22, vasqueRx: 21, vasqueRy: 6, sommetY: 11, lionY: 40, bagues: [31, 47], sol: 73 };
function fontaineLoinHD(scene) {
  if (scene.textures.exists('fontaineLoinHD')) return 'fontaineLoinHD';
  const F = FONTAINE_LOIN, t = toileDecor(F.L, F.H), ext = F.ext;
  t.rampes.pierre = rampe(0xb8a07a); t.rampes.mousse = rampe(0x5a7a3a); t.rampes.bronze = rampe(0x4a8a78); t.rampes.lierre = rampe(0x3a7a2a);
  t.rampes.eau = rampe(0x4aa0c8); t.rampes.eauFond = [0x0a1a24, 0x10283a, 0x16364c, 0x1e4660, 0x285a78, 0x346e90];
  const dans = (x, y, cx, cy, rx, ry) => ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1;
  // 1. la paroi du bassin, en blocs taillés, la frise sous le rebord, la mousse au pied
  for (let x = F.cx - ext.rx; x <= F.cx + ext.rx; x++) {
    const nx = (x + 0.5 - F.cx) / ext.rx; if (Math.abs(nx) > 1) continue;
    const s = Math.sqrt(1 - nx * nx), haut = F.eauY + s * ext.ry, bas = haut + F.paroi, ton = Math.round(3.2 - nx * 1.5 - Math.abs(nx) * 0.9);
    for (let y = Math.floor(haut); y <= Math.ceil(bas); y++) {
      if (y + 0.5 < haut || y > bas) continue;
      const j = y + 0.5 - haut;
      let k = ton;
      if (j < 6.5) {   // la frise : deux sillons, des losanges en relief entre eux
        if (j < 1.6 || (j > 5.2 && j < 6.5)) k = ton - 2;
        else { const m = ((x - F.cx) % 6 + 6) % 6, d = Math.abs(m - 3); if (Math.abs(j - 3.4) + d * 0.7 < 1.9) k = ton + 1; }
      } else {
        const joint = Math.round(x - F.cx) % 13 === 0 || Math.abs(y + 0.5 - (haut + 6.5 + bas) / 2) < 0.6;
        if (joint) k = ton - 2;
        if (y > bas - 2.5 && hachage(x, y, 905) > 0.42) { t.poser(x, y, 'mousse', 2 + Math.round(hachage(x, 1, 906) * 2)); continue; }
      }
      t.poser(x, y, 'pierre', k);
    }
  }
  // 2. le rebord clair, la paroi intérieure au fond (dans l'ombre), et l'eau
  for (let y = F.eauY - ext.ry - 1; y <= F.eauY + ext.ry + 1; y++) for (let x = F.cx - ext.rx - 1; x <= F.cx + ext.rx + 1; x++) {
    if (!dans(x, y, F.cx, F.eauY, ext.rx, ext.ry)) continue;
    if (dans(x, y, F.cx, F.eauY, F.eauRx, F.eauRy)) {
      if (!dans(x, y, F.cx, F.eauY + 2.5, F.eauRx - 0.5, F.eauRy - 1.5)) { t.poser(x, y, 'pierre', y < F.eauY ? 1 : 2); continue; }
      const v = (y + 0.5 - (F.eauY + 2.5 - F.eauRy + 1.5)) / (2 * (F.eauRy - 1.5));
      let k = v < 0.18 ? 2 : 3;
      if (dans(x, y, F.cx - F.eauRx * 0.28, F.eauY + 2.5 - F.eauRy * 0.3, F.eauRx * 0.55, F.eauRy * 0.28)) k = 4;   // la bande de lumière
      t.poser(x, y, 'eau', k);
      continue;
    }
    t.poser(x, y, 'pierre', y > F.eauY ? 4 : 5 - (hachage(x >> 2, y, 907) > 0.8 ? 1 : 0));
  }
  // les rides claires, comme de près
  for (let k = 0; k < 7; k++) { const x0 = Math.round(F.cx + (hachage(k, 1, 913) - 0.5) * F.eauRx * 1.4), y0 = Math.round(F.eauY + 3 + (hachage(k, 2, 914) - 0.5) * F.eauRy * 1.1), l = 3 + Math.round(hachage(k, 5, 916) * 4);
    for (let x = x0 - l; x <= x0 + l; x++) if (t.mat(x, y0) === 'eau') t.poser(x, y0, 'eau', Math.abs(x - x0) < l - 1 ? 5 : 4); }
  // quelques pièces des vœux, au fond
  for (let k = 0; k < 6; k++) { const a = hachage(k, 3, 911) * 6.28, r = Math.sqrt(hachage(k, 4, 912)) * 0.75; const x = Math.round(F.cx + Math.cos(a) * r * F.eauRx * 0.9), y = Math.round(F.eauY + 3 + Math.sin(a) * r * F.eauRy * 0.7); if (t.mat(x, y) === 'eau') t.poser(x, y, 'or', 4); }
  // 3. la colonne cannelée qui sort de l'eau, ses deux bagues, le rond d'eau à son pied
  t.forme('eau', ellipsoide(F.cx, F.eauY + 2.5, 8, 2.2), { decalage: 1.4, bord: false });
  for (let y = F.vasqueY; y < F.eauY + 3; y++) for (let x = F.cx - 4; x <= F.cx + 4; x++) {
    const n = (x + 0.5 - F.cx) / 4.5;
    t.poser(x, y, 'pierre', Math.round(3.4 - n * 1.6 - Math.abs(n) * 0.8 + ((x - F.cx + 4) % 3 === 0 ? -1 : 0)));
  }
  for (const yb of F.bagues) t.forme('pierre', ellipsoide(F.cx, yb, 5.6, 1.7), { decalage: 0.6 });
  // 4. les deux têtes de lion de bronze : l'eau sort de leur gueule
  for (const sens of [-1, 1]) {
    const lx = F.cx + sens * 5, ly = F.lionY;
    t.forme('bronze', ellipsoide(lx, ly, 2.6, 2.6), { decalage: 0.4 });
    t.forme('bronze', ellipsoide(lx + sens * 1.8, ly + 0.9, 1.5, 1.2), { decalage: 0.7 });
    t.poser(Math.round(lx + sens * 2.4 - (sens < 0 ? 1 : 0)), ly + 1, 'eauFond', 0);
  }
  // 5. la vasque haute : le dessous en coupe, le rebord, son eau ; la boule au sommet sur son pied
  t.forme('pierre', (x, y) => (y >= F.vasqueY && y <= F.vasqueY + 7 && Math.abs(x + 0.5 - F.cx) <= F.vasqueRx - (y - F.vasqueY) * 2.3 ? [(x + 0.5 - F.cx) / F.vasqueRx, 0.5, 0.7] : null), { decalage: -0.3 });
  t.forme('pierre', ellipsoide(F.cx, F.vasqueY, F.vasqueRx, F.vasqueRy), { decalage: 0.9 });
  t.forme('eau', ellipsoide(F.cx, F.vasqueY - 0.5, F.vasqueRx - 3, F.vasqueRy - 2.2), { decalage: 0.9, bord: false });
  for (let y = F.sommetY + 2; y < F.vasqueY - 2; y++) for (let x = F.cx - 1; x <= F.cx + 1; x++) t.poser(x, y, 'pierre', x < F.cx ? 4 : 2);
  t.forme('pierre', ellipsoide(F.cx, F.sommetY, 3.8, 3.8), { decalage: 0.5 });
  // 6. le lierre qui grimpe sur la paroi, de chaque côté
  for (const [x0, sens] of [[F.cx - ext.rx + 4, 1], [F.cx + ext.rx - 4, -1]]) for (let k = 0; k < 12; k++) {
    const x = x0 + sens * Math.round(Math.sin(k * 0.8) * 2 + k * 0.35), y = F.H - 4 - k * 1.25;
    t.forme('lierre', ellipsoide(x + (k % 2 ? 1 : -1), y, 1.4, 1), { decalage: 0.3 + (k % 3) * 0.25, bord: false });
  }
  t.contour(); t.texture(scene, 'fontaineLoinHD');
  return 'fontaineLoinHD';
}
// Un petit pot de terre cuite fleuri (14×16), le même qu'au pied de la fontaine de près
function potFleursLoinHD(scene) {
  if (scene.textures.exists('potFleursLoinHD')) return 'potFleursLoinHD';
  const t = toileDecor(14, 16);
  t.rampes.terre = rampe(0xb8603a); t.rampes.feuille = rampe(0x4a8a3a); t.rampes.fleurR = rampe(0xd84050); t.rampes.fleurJ = rampe(0xf0c040);
  t.forme('terre', (x, y) => (y >= 8 && y <= 15 && Math.abs(x + 0.5 - 7) <= 4.4 - (y - 8) * 0.22 ? [(x + 0.5 - 7) / 5, 0, 0.8] : null));
  t.forme('terre', ellipsoide(7, 8, 5, 1.3), { decalage: 0.6 });
  for (const [x, y] of [[4, 6], [6, 5], [9, 5], [10, 7], [7, 7]]) t.forme('feuille', ellipsoide(x, y, 1.6, 1.1), { decalage: 0.3 });
  for (const [x, y, c] of [[4, 4, 'fleurR'], [7, 2.5, 'fleurJ'], [10, 4, 'fleurR'], [6, 6, 'fleurJ']]) t.forme(c, ellipsoide(x, y, 1.3, 1.2), { decalage: 0.5 });
  t.contour(); t.texture(scene, 'potFleursLoinHD');
  return 'potFleursLoinHD';
}

// (v1.62, planche 80, retouche du joueur) La même fontaine, vue d'à hauteur d'homme (la vue du mendiant) : elle est
// construite en vrai relief (un bassin rond, sa colonne, sa vasque, sa boule) et chaque pixel est projeté avec la même
// caméra que le sol de la vue. Le fond du bassin ne remonte donc jamais plus haut que ne le permet l'angle de vue :
// le rebord du fond reste sous l'horizon, et la vasque, plus haute que les yeux, se voit par en dessous.
//   cam : { f, y0 (l'horizon, à l'écran), h (les yeux, en m) } ; lat, prof : le centre du bassin (m, à droite, devant)
// Mesures en mètres, à l'image de la fontaine de près.
const FONTAINE_RELIEF = { R: 2.85, rebord: 0.28, hR: 0.75, hEau: 0.62, col: 0.22, bagues: [1.15, 1.75], lion: 1.45,
  vasque: [1.95, 2.25, 0.25, 1.02], levre: 2.33, pied: [0.07, 2.6], boule: [2.72, 0.17] };
function projeterRelief(cam, lat, prof, X, Y, Z) { const d = prof + Z, k = cam.f / d; return { x: 480 + (lat + X) * k, y: cam.y0 + (cam.h - Y) * k, k }; }
function fontaineVueBasseHD(scene, cam, lat, prof) {
  const cle = 'fontaineBasse_' + [cam.f, cam.y0, cam.h, lat, prof].map(v => Math.round(v * 100)).join('_');
  const F = FONTAINE_RELIEF, P = (X, Y, Z) => projeterRelief(cam, lat, prof, X, Y, Z);
  // le cadre à l'écran (en demi-pixels) : du sommet de la boule au pied du bassin, d'un bord à l'autre
  const haut = P(0, F.boule[0] + F.boule[1] + 0.05, 0).y, bas = P(0, 0, -F.R).y, g = P(-F.R - 0.05, 0, -F.R * 0.3).x, d = P(F.R + 0.05, 0, -F.R * 0.3).x;
  const x0 = Math.floor(g / 2) - 2, y0 = Math.floor(haut / 2) - 2, L = Math.ceil(d / 2) - x0 + 3, H = Math.ceil(bas / 2) - y0 + 3;
  const info = { cle, x: x0 * 2, y: y0 * 2, projeter: P };
  if (scene.textures.exists(cle)) return info;
  const t = toileDecor(L, H);
  t.rampes.pierre = rampe(0xb8a07a); t.rampes.mousse = rampe(0x5a7a3a); t.rampes.bronze = rampe(0x4a8a78); t.rampes.lierre = rampe(0x3a7a2a);
  t.rampes.eau = rampe(0x4aa0c8);
  const Lw = (() => { const v = [-0.5, 0.62, -0.6], n = Math.hypot(...v); return v.map(x => x / n); })();   // (la lumière du jeu : du haut à gauche, de face)
  const ton = (nx, ny, nz, dec = 0) => Math.round(1.2 + ((nx * Lw[0] + ny * Lw[1] + nz * Lw[2]) + 0.15) * 3.6 + dec);
  // les intersections d'un rayon (depuis l'œil, direction (a, b, 1) par mètre de profondeur) avec chaque pièce
  const cyl = (a, b, r, y1, y2, loin = false) => {   // un cylindre vertical, d'axe celui du bassin
    const A = a * a + 1, B = -2 * (a * lat + prof), C = lat * lat + prof * prof - r * r, D = B * B - 4 * A * C;
    if (D < 0) return null;
    const tt = (-B + (loin ? 1 : -1) * Math.sqrt(D)) / (2 * A), Y = cam.h + tt * b;
    return tt > 0 && Y >= y1 && Y <= y2 ? tt : null;
  };
  const plan = (b, Y) => (b === 0 ? null : (Y - cam.h) / b);
  const sphere = (a, b, cx, cy, cz, r) => {   // une sphère (cx, cy, cz : par rapport au centre du bassin)
    const ox = -(lat + cx), oy = cam.h - cy, oz = -(prof + cz), A = a * a + b * b + 1, B = 2 * (a * ox + b * oy + oz), C = ox * ox + oy * oy + oz * oz - r * r, D = B * B - 4 * A * C;
    return D < 0 ? null : (-B - Math.sqrt(D)) / (2 * A);
  };
  const cone = (a, b, y1, y2, r1, r2) => {   // le dessous de la vasque : un cône renversé (r1 en y1, r2 en y2)
    const s = (r2 - r1) / (y2 - y1), p = r1 + (cam.h - y1) * s, q = b * s;
    const A = a * a + 1 - q * q, B = -2 * (a * lat + prof) - 2 * p * q, C = lat * lat + prof * prof - p * p, D = B * B - 4 * A * C;
    if (D < 0 || Math.abs(A) < 1e-9) return null;
    const rs = [(-B - Math.sqrt(D)) / (2 * A), (-B + Math.sqrt(D)) / (2 * A)].sort((u, v) => u - v);
    for (const tt of rs) { const Y = cam.h + tt * b; if (tt > 0 && Y >= y1 && Y <= y2) return tt; }
    return null;
  };
  const Ri = F.R - F.rebord, [v1, v2, vr1, vr2] = F.vasque;
  for (let py = 0; py < H; py++) for (let px = 0; px < L; px++) {
    const sx = (x0 + px + 0.5) * 2, sy = (y0 + py + 0.5) * 2, a = (sx - 480) / cam.f, b = (cam.y0 - sy) / cam.f;
    let best = null;
    const ajout = (tt, quoi) => { if (tt !== null && tt > 0 && (!best || tt < best[0])) best = [tt, quoi]; };
    ajout(cyl(a, b, F.R, 0, F.hR), 'paroi');
    { const tt = plan(b, F.hR); if (tt > 0) { const r = Math.hypot(tt * a - lat, tt - prof); if (r <= F.R && r >= Ri) ajout(tt, 'rebord'); } }
    ajout(cyl(a, b, Ri, F.hEau, F.hR, true), 'dedans');
    { const tt = plan(b, F.hEau); if (tt > 0 && Math.hypot(tt * a - lat, tt - prof) < Ri) ajout(tt, 'eau'); }
    ajout(cyl(a, b, F.col, F.hEau, v1 + 0.02), 'colonne');
    for (const yb of F.bagues) ajout(cyl(a, b, F.col + 0.06, yb - 0.045, yb + 0.045), 'bague');
    for (const sens of [-1, 1]) { ajout(sphere(a, b, sens * (F.col + 0.03), F.lion, 0, 0.13), 'lion'); ajout(sphere(a, b, sens * (F.col + 0.15), F.lion - 0.03, -0.02, 0.065), sens < 0 ? 'museauG' : 'museauD'); }
    ajout(cone(a, b, v1, v2, vr1, vr2), 'vasque');
    ajout(cyl(a, b, vr2, v2, F.levre), 'levre');
    ajout(cyl(a, b, F.pied[0], F.levre, F.pied[1]), 'pied');
    ajout(sphere(a, b, 0, F.boule[0], 0, F.boule[1]), 'boule');
    if (!best) continue;
    const [tt, quoi] = best, X = tt * a - lat, Y = cam.h + tt * b, Z = tt - prof, r = Math.hypot(X, Z) || 1e-6, th = Math.atan2(Z, X);
    const nx = X / r, nz = Z / r;   // (la normale d'un cylindre)
    if (quoi === 'paroi') {
      // les blocs taillés, la frise de losanges sous le rebord, la mousse au pied, le lierre sur les côtés
      let k = ton(nx, 0, nz);
      const u = th * F.R, sous = F.hR - Y;
      if (sous < 0.035 || (sous > 0.15 && sous < 0.185)) k -= 2;
      else if (sous <= 0.15) { const m = ((u / 0.2) % 1 + 1) % 1; if (Math.abs(sous - 0.092) / 0.055 + Math.abs(m - 0.5) * 2.2 < 1) k += 1; }
      else if ((((u / 0.62) % 1) + 1) % 1 < 0.07 || Math.abs(Y - (F.hR - 0.185) / 2) < 0.02) k -= 2;
      const cote = Math.abs(X) / F.R;
      if (cote > 0.84 && sous > 0.2 && fbm(u * 4, Y * 6, 917) > 0.6 - (cote - 0.84) * 1.2 && hachage(px, py, 919) > 0.25) { t.poser(px, py, 'lierre', 2 + Math.round(fbm(u * 9, Y * 9, 918) * 3)); continue; }   // (le lierre, en touffes)
      if (Y < 0.08 && hachage(px, py, 905) > 0.4) { t.poser(px, py, 'mousse', 2 + Math.round(hachage(px, 1, 906) * 2)); continue; }
      t.poser(px, py, 'pierre', k);
    } else if (quoi === 'rebord') t.poser(px, py, 'pierre', Z < 0 ? 4 : 5 - (hachage(Math.round(th * 30), 1, 907) > 0.8 ? 1 : 0));
    else if (quoi === 'dedans') t.poser(px, py, 'pierre', F.hR - Y < 0.04 ? 2 : 1);
    else if (quoi === 'eau') {
      // l'eau : plus sombre contre la paroi du fond, une bande de lumière, des rides claires, des pièces au fond
      let k = 3;
      if (Ri - r < 0.16 && Z > 0) k = 2;
      if (Math.hypot((X + 0.7) / 1.3, (Z - 0.5) / 0.8) < 1) k = 4;
      if (hachage(Math.floor((X + 3) * 3), Math.floor((Z + 3) * 9), 913) > 0.94) k = 5;
      else if (hachage(Math.floor((X + 3) * 12), Math.floor((Z + 3) * 12), 911) > 0.993) { t.poser(px, py, 'or', 4); continue; }
      t.poser(px, py, 'eau', k);
    } else if (quoi === 'colonne') t.poser(px, py, 'pierre', ton(nx, 0, nz, 0.2) - ((((th * 12 / Math.PI) % 1) + 1) % 1 < 0.22 ? 1 : 0));   // (les cannelures)
    else if (quoi === 'bague' || quoi === 'levre' || quoi === 'pied') t.poser(px, py, 'pierre', ton(nx, 0, nz, quoi === 'bague' ? 0.6 : 0.3));
    else if (quoi === 'vasque') { const s = (vr2 - vr1) / (v2 - v1), n = Math.hypot(1, s); t.poser(px, py, 'pierre', ton(nx / n, -s / n, nz / n, -0.2)); }
    else if (quoi === 'boule') { const rb = F.boule[1]; t.poser(px, py, 'pierre', ton(X / rb, (Y - F.boule[0]) / rb, Z / rb, 0.5)); }
    else {   // les têtes de lion et leurs museaux
      const sens = quoi === 'lion' ? Math.sign(X) : quoi === 'museauG' ? -1 : 1;
      const [cx, cy, cz, rr] = quoi === 'lion' ? [sens * (F.col + 0.03), F.lion, 0, 0.13] : [sens * (F.col + 0.15), F.lion - 0.03, -0.02, 0.065];
      t.poser(px, py, 'bronze', ton((X - cx) / rr, (Y - cy) / rr, (Z - cz) / rr, quoi === 'lion' ? 0.4 : 0.7));
    }
  }
  t.contour(); t.texture(scene, cle);
  return info;
}
