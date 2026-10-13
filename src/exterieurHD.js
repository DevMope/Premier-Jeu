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
  comte: { arbres: 'ronds', porte: true, fleurs: 0xf0d060 },
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
function paysageHD(scene, largeur, hauteur, biome = 'comte', nuit = 0) {
  const L = Math.round(largeur / 2), H = Math.round(hauteur / 2);
  const cle = `paysage_${biome}_${L}x${H}_${Math.round(nuit * 10)}`;
  if (scene.textures.exists(cle)) return cle;
  const b = BIOMES[biome] || BIOMES.comte, r = RELIEFS[biome] || {};
  const graine = biome.length * 31;
  const soir = c => melangeCouleur(c, melangeCouleur(teinte(c, 0.45), 0x1a1840, 0.5), nuit);
  const px = new Uint32Array(L * H);
  const poser = (x, y, c) => { if (x >= 0 && y >= 0 && x < L && y < H) px[y * L + Math.floor(x)] = c; };

  // Le ciel : un dégradé tramé du zénith à l'horizon, puis les nuages
  const zenith = soir(teinte(b.ciel, 0.85)), horizon = soir(b.horizon);
  const nuages = nuit > 0.6 ? 0x3a3a5a : soir(0xfff8f0);
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
  const sx = L * 0.78, sy = H * (0.2 + nuit * 0.3), sr = Math.max(6, H * 0.06);
  for (let y = Math.floor(sy - sr * 3); y < sy + sr * 3; y++) for (let x = Math.floor(sx - sr * 3); x < sx + sr * 3; x++) {
    const d = Math.hypot(x - sx, y - sy);
    if (d < sr) poser(x, y, nuit > 0.6 ? 0xf3ecc8 : soir(b.soleil));
    else if (d < sr * 2.2 && tramer(x, y, 1 - (d - sr) / (sr * 1.2), 3) > 0 && y >= 0 && y < H) px[y * L + x] = melangeCouleur(px[y * L + x], soir(b.soleil), 0.35);
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
    if (r.arbres && hachage(x, 7, graine) < 0.08 * (r.densite || 1)) arbre(x, h0 + 2, 0.6, teinte(b.arbres || b.loin, 0.75));
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
    if (r.arbres && hachage(x, 9, graine) < 0.03 * (r.densite || 1)) arbre(x, h0 + 3, 1, teinte(b.arbres || herbe, 0.7));
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

  // Les arbres (définis après pour rester lisibles : hissés en fonctions)
  function arbre(x, sol, taille, couleur) {
    const forme = r.arbres;
    const h = Math.round((forme === 'sapins' ? 16 : 11) * taille * (0.8 + hachage(x, 3, graine) * 0.5));
    for (let y = 0; y < 3 * taille; y++) poser(x, Math.floor(sol - y), soir(0x4a3020));
    for (let y = 0; y < h; y++) {
      const w = forme === 'sapins' ? (y / h) * h * 0.35 : Math.sqrt(Math.max(0, 1 - Math.pow((y - h / 2) / (h / 2), 2))) * h * 0.45;
      for (let k = -Math.ceil(w); k <= Math.ceil(w); k++) {
        const lum = k < 0 ? 1.08 : 0.82;
        poser(x + k, Math.floor(sol - 2 * taille - h + y), soir(teinte(couleur, lum - (hachage(x + k, y, graine) < 0.2 ? 0.1 : 0))));
      }
    }
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

function creerFacadeHD(scene) {
  if (scene.textures.exists('facadeHD')) return;
  const L = 196, H = 142;           // 392 × 284 à l'écran ; le sol est en bas
  const t = toileDecor(L, H);
  Object.assign(t.rampes, RAMPES_EXTERIEUR);
  const mx = 18, my = 56, ml = 160, mh = 86;                     // les murs
  // Le soubassement de pierre, puis l'enduit entre les colombages
  enduit(t, mx, my, ml, mh, 700, false);
  pierres(t, mx, H - 12, ml, 12, 701);
  for (const x of [mx, mx + 52, mx + 100, mx + ml - 6]) planche(t, x, my, 6, mh - 12, 'cheneSombre', { horizontale: false, graine: 702 + x });
  planche(t, mx, my, ml, 6, 'cheneSombre', { graine: 703 });
  planche(t, mx, H - 18, ml, 6, 'cheneSombre', { graine: 704 });
  for (let k = 0; k < 18; k++) { t.poser(mx + 58 + k * 2.2, my + 8 + k * 2, 'cheneSombre', 2); t.poser(mx + 59 + k * 2.2, my + 8 + k * 2, 'cheneSombre', 3); } // une écharpe
  // Le toit de chaume, épais et arrondi au bord, avec sa cheminée
  for (let y = 0; y < my + 6; y++) for (let x = 0; x < L; x++) {
    const demi = (y + 4) * 1.55;
    if (Math.abs(x + 0.5 - L / 2) > demi) continue;
    const brin = (x * 3 + Math.floor(y * 0.6)) % 5;
    let i = 3 + (brin === 0 ? -1 : brin === 3 ? 1 : 0) + Math.round((fbm(x * 0.1, y * 0.2, 705) - 0.5) * 1.5);
    if (y > my - 2) i -= 2;                                       // l'ombre sous l'avancée
    else if (y > my - 6) i -= 1;
    if (Math.abs(x + 0.5 - L / 2) > demi - 2) i = Math.max(1, i - 1);
    t.poser(x, y, 'chaume', i);
  }
  pierres(t, 140, 0, 14, 22, 706);
  for (let y = 0; y < 22; y++) { t.poser(140, y, 'pierre', 1); t.poser(153, y, 'pierre', 1); }
  // La fenêtre-comptoir : volets ouverts, vitre éclairée, appui de comptoir
  const fx = mx + 10, fy = my + 16, fl = 64, fh = 40;
  for (let y = fy; y < fy + fh; y++) for (let x = fx; x < fx + fl; x++) {
    const cadre = x < fx + 3 || x >= fx + fl - 3 || y < fy + 3;
    if (cadre) { t.poser(x, y, 'chene', x < fx + 3 || y < fy + 3 ? 4 : 2); continue; }
    t.poser(x, y, 'vitre', 3 + Math.round((fbm(x * 0.1, y * 0.1, 707) - 0.5) * 2) + (y < fy + 10 ? 1 : 0));
  }
  for (const [x0, sens] of [[fx - 12, 1], [fx + fl, -1]]) {               // les volets
    for (let x = x0; x < x0 + 12; x++) for (let y = fy - 2; y < fy + fh; y++) t.poser(x, y, 'porteVerte', (x - x0) % 4 === 0 ? 1 : 3 + (sens > 0 ? 0 : -1));
    for (const y of [fy + 6, fy + fh - 8]) for (let x = x0 + 2; x < x0 + 10; x++) t.poser(x, y, 'fer', 3);
  }
  planche(t, fx - 6, fy + fh, fl + 12, 6, 'chene', { graine: 708, noeuds: 2 });     // l'appui-comptoir
  for (let x = fx - 6; x < fx + fl + 6; x++) t.poser(x, fy + fh + 6, 'cheneSombre', 0);
  for (const x of [fx, fx + fl - 4]) for (let y = fy + fh + 6; y < fy + fh + 14; y++) for (let k = 0; k < 3; k++) t.poser(x + k + (y - fy - fh - 6) * 0.3 * (x === fx ? 1 : -1), y, 'chene', 2);
  // La porte ronde de hobbit, verte, avec son bouton de laiton
  const px = mx + 126, py = H - 12, r = 19;
  for (let y = py - r * 2 - 4; y < py; y++) for (let x = px - r - 3; x <= px + r + 3; x++) {
    const d = Math.hypot(x + 0.5 - px, Math.max(0, py - r - (y + 0.5)));
    if (d > r + 3) continue;
    if (d > r) { t.poser(x, y, 'pierre', 2 + Math.round(fbm(x * 0.4, y * 0.4, 709) * 2)); continue; }
    t.poser(x, y, 'porteVerte', 3 + (x < px ? 0 : -1) + ((x - px + 40) % 7 === 0 ? -1 : 0) + (d > r - 1.5 ? -1 : 0));
  }
  t.forme('laiton', ellipsoide(px, py - r + 2, 2.4, 2.4), { decalage: 0.4 });
  // Le support de l'enseigne, à gauche
  for (let x = 2; x < mx + 30; x++) t.poser(x, my + 2, 'fer', x % 3 ? 3 : 1);
  for (let k = 0; k < 10; k++) t.poser(mx + 2 - k, my + 2 + k, 'fer', 2);
  // Une jardinière de fleurs sous la fenêtre
  for (let x = fx; x < fx + fl; x++) if (hachage(x, 1, 710) < 0.5) t.poser(x, fy + fh - 1, hachage(x, 2, 710) < 0.5 ? 'cuirRouge' : 'laiton', 5);
  t.contour();
  t.texture(scene, 'facadeHD');
  // L'enseigne en bois suspendue
  for (let n = 0; n < 4; n++) {
    const e = toileLuxe(60, 18, n);
    for (let x = 0; x < 60; x++) for (let y = 0; y < 18; y++) {
      const bord = Math.min(x, y, 59 - x, 17 - y);
      e.poser(x, y, bord < 2 ? (n >= 2 ? 'laiton' : 'chene') : 'parchemin', bord < 2 ? (bord ? 4 : 2) : 4 + Math.round((fbm(x * 0.2, y * 0.2, 711) - 0.5)));
    }
    e.contour();
    e.texture(scene, 'enseigneHD_' + n);
  }
}

// La façade du comptoir, vue de dehors. `cx` = centre, `sol` = bas des murs.
// Renvoie la position de la porte (et l'image).
function dessinerFacade(scene, cx, sol, nomShop = (window.GAME && window.GAME.nomShop) || NOM_SHOP_DEFAUT) {
  creerFacadeHD(scene);
  const image = scene.add.image(cx, sol + 2, 'facadeHD').setOrigin(0.5, 1).setScale(2);
  const gauche = cx - 196;
  // L'enseigne pend à son support, et se balance un peu
  const luxe = window.GAME ? niveauAmelioration(window.GAME, 'comptoir') : 1;
  const ex = gauche + 30, ey = sol - 284 + 112 + 16;
  const enseigne = scene.add.container(ex, ey);
  const planche = scene.add.image(0, 22, 'enseigneHD_' + luxe).setScale(2).setOrigin(0.5, 0);
  const chaines = scene.add.graphics();
  chaines.lineStyle(2, 0x2a2a30).lineBetween(-44, 0, -44, 23).lineBetween(44, 0, 44, 23);
  const texte = scene.add.text(0, 40, nomShop, style(13, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5);
  for (let taille = 12; texte.width > 108 && taille >= 7; taille--) texte.setFontSize(taille);
  if (texte.width > 108) texte.setWordWrapWidth(108).setAlign('center');
  enseigne.add([chaines, planche, texte]);
  scene.tweens.add({ targets: enseigne, angle: { from: -2.5, to: 2.5 }, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  // Un filet de fumée qui monte de la cheminée
  creerHalo(scene);
  scene.time.addEvent({ delay: 700, loop: true, callback: () => {
    if (!image.active) return;
    const f = scene.add.image(gauche + 294, sol - 284 + 2, 'halo').setScale(0.15).setTint(0xd0d0d0).setAlpha(0.5);
    scene.tweens.add({ targets: f, y: f.y - 70, x: f.x + 20, scale: 0.45, alpha: 0, duration: 2600, onComplete: () => f.destroy() });
  } });
  return { porteX: gauche + 2 * 144, porteY: sol, image, enseigne };
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
