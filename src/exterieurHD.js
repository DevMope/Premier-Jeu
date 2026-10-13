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
};

// Peint un paysage à la taille demandée (à l'écran). Renvoie la clé de la texture.
// `nuit` : de 0 (plein jour) à 1 (nuit noire), ou 'aube' pour le lever du soleil.
// `sansAstre` : sans soleil ni lune (quand on les dessine à part, plus détaillés).
function paysageHD(scene, largeur, hauteur, biome = 'comte', nuit = 0, { sansAstre = false } = {}) {
  const L = Math.round(largeur / 2), H = Math.round(hauteur / 2);
  const aube = nuit === 'aube';
  if (aube) nuit = 0;
  const cle = `paysage_${biome}_${L}x${H}_${aube ? 'aube' : Math.round(nuit * 10)}${sansAstre ? '_sans' : ''}`;
  if (scene.textures.exists(cle)) return cle;
  const b = BIOMES[biome] || BIOMES.comte, r = RELIEFS[biome] || {};
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
    else pierres(t, x0, y0, l, h, 712);
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
  // La porte : de simples planches pour la chaumière, de chêne cintrée dans un arc de pierre ensuite
  if (n === 0) {
    const [px0, py0, pl, ph] = FACADE.porte;
    for (let x = px0; x < px0 + pl; x += 6) planche(t, x, py0 + 6, Math.min(6, px0 + pl - x), ph - 6, 'chene', { horizontale: false, graine: 713 + x, noeuds: 1 });
    for (const y of [py0 + 14, py0 + ph - 12]) for (let x = px0 + 1; x < px0 + pl - 1; x++) t.poser(x, y, 'chene', 1);
    for (let y = py0 + 4; y < py0 + ph; y++) { t.poser(px0 - 1, y, 'chene', 4); t.poser(px0 + pl, y, 'chene', 1); }
    for (let x = px0 - 2; x < px0 + pl + 2; x++) t.poser(x, py0 + 4, 'chene', 4);
    t.poser(px0 + pl - 6, py0 + ph / 2, 'fer', 4);
  } else {
    const [px0, py0, pl, ph] = FACADE.porte;
    const cx = px0 + pl / 2, r = pl / 2;
    for (let y = py0 - 4; y < py0 + ph; y++) for (let x = px0 - 4; x < px0 + pl + 4; x++) {
      const dy = Math.max(0, py0 + r - y);
      const d = Math.hypot(x + 0.5 - cx, dy);
      if (d > r + 4) continue;
      if (d > r) { t.poser(x, y, 'pierre', 4 + (Math.floor(Math.atan2(dy, x - cx) * 4) % 2)); continue; }
      t.poser(x, y, 'chene', 3 + (x < cx ? 0 : -1) + ((x - px0) % 6 === 0 ? -1 : 0) + (d > r - 1.5 ? -1 : 0));
    }
    for (const y of [py0 + 16, py0 + ph - 14]) for (let x = px0 + 2; x < px0 + pl - 2; x++) t.poser(x, y, 'fer', y % 2 ? 3 : 2);
    t.forme('laiton', ellipsoide(px0 + pl - 8, py0 + ph / 2 + 4, 2.2, 2.2), { decalage: 0.4 });
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
  if (scene.textures.exists('tonneauxHD')) return;
  // Les tonneaux et la caisse, devant la maison
  {
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
function dessinerFacade(scene, cx, sol, nomShop = (window.GAME && window.GAME.nomShop) || NOM_SHOP_DEFAUT, n = window.GAME ? niveauFacade(window.GAME) : 3) {
  creerFacadeHD(scene, n);
  const image = scene.add.image(cx, sol + 2, 'facadeHD_' + n).setOrigin(0.5, 1).setScale(2);
  const gauche = cx - FACADE.L, haut = sol + 2 - FACADE.H * 2;
  const ecran = ([x, y, l, h]) => [gauche + x * 2, haut + y * 2, l * 2, h * 2];
  const tonneaux = scene.add.image(gauche + FACADE.L * 2 - 26, sol + 4, 'tonneauxHD').setOrigin(0, 1).setScale(2);
  // L'enseigne pend à son support, et se balance un peu
  const luxe = window.GAME ? niveauAmelioration(window.GAME, 'comptoir') : 1;
  const ex = gauche + (FACADE.enseigne[0] + 6) * 2, ey = haut + FACADE.enseigne[1] * 2;
  const enseigne = scene.add.container(ex, ey);
  const planche = scene.add.image(0, 22, 'enseigneHD_' + luxe).setScale(2).setOrigin(0.5, 0);
  const chaines = scene.add.graphics();
  chaines.lineStyle(2, 0x2a2a30).lineBetween(-62, 0, -62, 23).lineBetween(62, 0, 62, 23);
  // Le nom du shop, en grand, peint en brun sombre et cerné de clair pour bien se lire de loin
  const texte = scene.add.text(0, 46, nomShop, style(17, '#2a1608', { fontStyle: 'bold', stroke: '#fff4dc', strokeThickness: 3 })).setOrigin(0.5);
  for (let taille = 17; texte.width > 148 && taille >= 10; taille--) texte.setFontSize(taille);
  if (texte.width > 148) texte.setWordWrapWidth(148).setAlign('center');
  enseigne.add([chaines, planche, texte]);
  scene.tweens.add({ targets: enseigne, angle: { from: -2.5, to: 2.5 }, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  // Un filet de fumée qui monte de la cheminée
  creerHalo(scene);
  const [chx, chy, chl] = ecran(chemineeFacade(n));
  scene.time.addEvent({ delay: 700, loop: true, callback: () => {
    if (!image.active) return;
    const f = scene.add.image(chx + chl / 2, chy, 'halo').setScale(0.15).setTint(0xd0d0d0).setAlpha(0.5);
    scene.tweens.add({ targets: f, y: f.y - 70, x: f.x + 20, scale: 0.45, alpha: 0, duration: 2600, onComplete: () => f.destroy() });
  } });
  const [px, , pl] = ecran(FACADE.porte);
  return {
    porteX: px + pl / 2, porteY: sol, image, enseigne, tonneaux,
    zones: { toit: ecran(n >= 2 ? FACADE.toit : [0, 42, 200, 72]), etage: n >= 2 ? ecran(FACADE.etage) : null, fenetre: ecran(FACADE.fenetre), porte: ecran(FACADE.porte),
      enseigne: [ex - 80, ey + 18, 160, 56] },
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
  const cle = `paves_${largeur}x${hauteur}`;
  if (scene.textures.exists(cle)) return cle;
  const L = Math.round(largeur / 2), H = Math.round(hauteur / 2);
  const t = toileDecor(L, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) {
    const rangee = Math.floor(y / 4), dec = (rangee % 2) * 3;
    const bx = (x + dec) % 6, by = y % 4;
    const joint = bx === 0 || by === 0;
    let i = joint ? 1 : 3 + (by === 1 ? 1 : 0) - (bx === 5 ? 1 : 0) + Math.round((hachage(Math.floor((x + dec) / 6), rangee, 730) - 0.5) * 1.5);
    if (y === 0) i = 0;
    t.poser(x, y, 'pierre', i);
  }
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
    for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) {
      const rangee = Math.floor(y / 12), dec = (rangee % 2) * 14;
      const bx = (x + dec) % 28, by = y % 12;
      const joint = bx === 0 || by === 0;
      let i = joint ? 1 : 3 + (by === 1 ? 1 : 0) - (bx === 27 || by === 11 ? 1 : 0) + Math.round((fbm(x * 0.08, y * 0.08, 740) - 0.5) * 1.2);
      t.poser(x, y, 'pierre', i);
    }
    for (const x0 of [12, 90, 380, 458]) for (let y = 0; y < H; y++) for (let x = x0; x < x0 + 10; x++) {
      t.poser(x, y, 'pierre', x === x0 ? 5 : x === x0 + 9 ? 1 : x === x0 + 4 ? 2 : 4);
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
        else t.poser(x, y, 'chene', 3 + Math.round((fbm(x * 0.1, y * 0.1, 752 + k) - 0.5)));
      }
    }
    // La plaque de laiton au centre, pour le nom de la banque
    for (let y = 22; y < 40; y++) for (let x = 70; x < 220; x++) t.poser(x, y, 'laiton', (y === 22 || x === 70) ? 5 : (y === 39 || x === 219) ? 1 : 3);
    t.contour();
    t.texture(scene, 'bureauBanque');
  }
}

// --- La carte des contrées ---

// Le parchemin de la carte, avec les contrées dessinées à l'encre et lavées d'aquarelle.
function creerCarteHD(scene) {
  if (scene.textures.exists('carteHD')) return;
  const L = 466, H = 184, ox = 14, oy = 50;            // affichée en (14, 50), en ×2
  const t = toileDecor(L, H);
  t.rampes.sepia = [0x2a1808, 0x4a2c12, 0x6a421e, 0x8a5a2c, 0xa8764a, 0xc8a070];
  // Le parchemin vieilli, les bords roussis, l'ombre (est) et la lumière (ouest)
  for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) {
    const bord = Math.min(x, y, L - 1 - x, H - 1 - y);
    const dechire = fbm(x * 0.2, y * 0.2, 760) * 3;
    let i = 4 + Math.round((fbm(x * 0.03, y * 0.05, 761) - 0.5) * 1.6);
    if (bord < dechire + 2) i -= 2;
    else if (bord < dechire + 5) i -= 1;
    if (fbm(x * 0.02, y * 0.03, 762) > 0.7) i -= 1;      // des taches
    t.poser(x, y, 'parchemin', i);
  }
  // Les lavis d'aquarelle sous chaque contrée, dans la couleur de son paysage
  const lavis = [];
  for (const [cle, z] of Object.entries(ZONES)) {
    const zx = (z.x - ox) / 2, zy = (z.y - oy) / 2, couleur = BIOMES[z.biome].pres;
    t.rampes['lavis_' + cle] = rampe(melangeCouleur(couleur, 0xe8d4a4, 0.45));
    lavis.push([cle, zx, zy]);
    for (let y = Math.floor(zy - 30); y < zy + 30; y++) for (let x = Math.floor(zx - 34); x < zx + 34; x++) {
      const d = Math.hypot((x - zx) / 32, (y - zy) / 27) + (fbm(x * 0.1, y * 0.1, 763) - 0.5) * 0.5;
      if (d < 1 && t.dans(x, y)) t.poser(x, y, 'lavis_' + cle, d > 0.85 ? 3 : 4);
    }
  }
  // Les reliefs à l'encre : collines, arbres, montagnes, roseaux, colonnes, dunes
  const encre = (x, y, i = 1) => { if (t.dans(Math.round(x), Math.round(y))) t.poser(Math.round(x), Math.round(y), 'sepia', i); };
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
    bourbier: ['roseau'], repaire: ['sapin'], tour: ['colonne', 'montagne'] };
  for (const [cle, zx, zy] of lavis) {
    const z = ZONES[cle], formes = parBiome[z.biome] || ['colline'];
    for (let k = 0; k < 7; k++) {
      const a = hachage(k, 1, cle.length * 7) * Math.PI * 2, rr = 14 + hachage(k, 2, cle.length * 7) * 14;
      glyphes[formes[k % formes.length]](zx + Math.cos(a) * rr * 1.2, zy + Math.sin(a) * rr * 0.8);
    }
  }
  // Une rose des vents dans le coin
  const rx = 30, ry = H - 30;
  for (let k = -12; k <= 12; k++) { encre(rx + k, ry, Math.abs(k) < 3 ? 0 : 2); encre(rx, ry + k * 0.8, Math.abs(k) < 3 ? 0 : 2); }
  for (let k = -6; k <= 6; k++) { encre(rx + k, ry + k * 0.8, 3); encre(rx + k, ry - k * 0.8, 3); }
  for (let a = 0; a < 6.28; a += 0.12) encre(rx + Math.cos(a) * 7, ry + Math.sin(a) * 6, 2);
  t.texture(scene, 'carteHD');
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
    if (!scene.textures.exists('vignetteZone_' + cle)) peindreVignetteZone(scene, cle, z.biome);
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

function peindreVignetteZone(scene, cle, biome) {
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

  switch (biome) {
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
