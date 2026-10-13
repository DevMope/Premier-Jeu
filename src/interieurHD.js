// L'intérieur du shop en HD : les murs à colombages, le plancher, l'étagère de la réserve,
// le coffre, les sacs et les lingots, le panier des cadeaux, le vieux buffet, la porte de la
// chambre, le lit, la table de chevet, le tapis, les bougies et la lanterne (et leur lumière),
// et les panneaux de parchemin encadrés des écrans de gestion.
// Tout est peint à demi-résolution et affiché en ×2, comme le comptoir.

// --- Les pièces de base ---

// Un mur : enduit à la chaux entre les colombages, lambris de planches en bas.
// `fenetre` ({ x, y, l, h }, en pixels de la toile) laisse un trou transparent avec son cadre.
function murInterieur(scene, cle, { l = 480, h = 220, poteaux = [150, 330], graine = 300, fenetre = null } = {}) {
  if (scene.textures.exists(cle)) return cle;
  const t = toileDecor(l, h);
  enduit(t, 0, 0, l, h, graine, false);
  // La sablière haute et les poteaux
  planche(t, 0, 0, l, 10, 'cheneSombre', { graine: graine + 1, noeuds: 4 });
  for (let x = 0; x < l; x++) t.poser(x, 10, 'platre', 1); // l'ombre de la poutre sur l'enduit
  for (const x of poteaux) {
    planche(t, x, 10, 9, h - 10, 'cheneSombre', { horizontale: false, graine: graine + x, noeuds: 2 });
    for (let y = 11; y < h; y++) t.poser(x + 9, y, 'platre', 1);
    clou(t, x + 3, 16);
  }
  // Le lambris : des planches verticales, une cimaise en haut, une plinthe en bas
  const haut = h - 46;
  for (let x = 0; x < l; x += 12) planche(t, x, haut, 12, 46, 'chene', { horizontale: false, graine: graine + 50 + x, noeuds: hachage(x, 1, graine) < 0.3 ? 1 : 0 });
  for (let x = 0; x < l; x++) {
    t.poser(x, haut - 1, 'platre', 1);
    for (let y = haut; y < haut + 4; y++) t.poser(x, y, 'cheneSombre', y === haut ? 5 : y === haut + 3 ? 1 : 3);
    for (let y = h - 5; y < h; y++) t.poser(x, y, 'cheneSombre', y === h - 5 ? 4 : 1);
  }
  if (fenetre) {
    const { x: fx, y: fy, l: fl, h: fh } = fenetre;
    // Le cadre (5 pixels, biseauté), la croisée, l'appui de pierre
    for (let y = fy - 5; y < fy + fh + 5; y++) for (let x = fx - 5; x < fx + fl + 5; x++) {
      const dedans = x >= fx && x < fx + fl && y >= fy && y < fy + fh;
      if (dedans) {
        const croisee = Math.abs(x + 0.5 - (fx + fl / 2)) < 1.5 || Math.abs(y + 0.5 - (fy + fh / 2)) < 1.5;
        if (croisee) t.poser(x, y, 'chene', x + 0.5 < fx + fl / 2 || y + 0.5 < fy + fh / 2 ? 4 : 2);
        else { t.c[y * l + x] = null; t.m[y * l + x] = null; }
        continue;
      }
      const d = Math.min(fx - x, x - (fx + fl - 1), fy - y, y - (fy + fh - 1));
      t.poser(x, y, 'chene', (x < fx || y < fy) ? 5 - Math.floor(-d / 2) : 1 + Math.floor(-d / 2));
    }
    pierres(t, fx - 9, fy + fh + 5, fl + 18, 5, graine + 9);
    for (let x = fx - 9; x < fx + fl + 9; x++) { t.poser(x, fy + fh + 5, 'pierre', 5); t.poser(x, fy + fh + 10, 'platre', 1); }
  }
  t.texture(scene, cle);
  return cle;
}

// Un plancher : de larges lames, de plus en plus hautes vers le bas (la perspective).
function plancher(scene, cle, { l = 480, h = 50, graine = 400 } = {}) {
  if (scene.textures.exists(cle)) return cle;
  const t = toileDecor(l, h);
  let y = 0, k = 0;
  while (y < h) {
    const hl = Math.min(h - y, 5 + k);
    const dec = (k * 37) % 60;
    for (let x = -dec; x < l; x += 70 + (k % 3) * 10) {
      planche(t, Math.max(0, x), y, Math.min(l, x + 70 + (k % 3) * 10) - Math.max(0, x), hl, 'chene', { graine: graine + k * 13 + x, noeuds: 1 });
      if (x > 0) { for (let yy = y; yy < y + hl; yy++) t.poser(x, yy, 'chene', 0); clou(t, x + 2, y + Math.floor(hl / 2)); }
    }
    y += hl; k++;
  }
  // L'ombre au pied du mur
  for (let x = 0; x < l; x++) { t.poser(x, 0, 'cheneSombre', 0); t.poser(x, 1, 'chene', 1); }
  t.texture(scene, cle);
  return cle;
}

// --- La lumière ---

// Un halo doux (blanc → transparent), qu'on teinte et qu'on additionne au décor.
function creerHalo(scene) {
  if (scene.textures.exists('halo')) return;
  const c = scene.textures.createCanvas('halo', 128, 128);
  const ctx = c.getContext();
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,0.9)');
  grad.addColorStop(0.25, 'rgba(255,255,255,0.45)');
  grad.addColorStop(0.6, 'rgba(255,255,255,0.12)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  c.refresh();
}

// Une lumière chaude qui vacille doucement. Renvoie l'image du halo.
function lumiere(scene, x, y, rayon = 160, couleur = 0xffb050, intensite = 0.55) {
  creerHalo(scene);
  const halo = scene.add.image(x, y, 'halo').setScale(rayon / 64).setTint(couleur).setAlpha(intensite)
    .setBlendMode(Phaser.BlendModes.ADD);
  scene.tweens.add({ targets: halo, alpha: intensite * 0.8, scale: (rayon / 64) * 0.96, duration: 160 + Math.random() * 120,
    yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  return halo;
}

// L'ombre des coins de la pièce : les bords s'assombrissent, le centre reste éclairé.
function vignette(scene, intensite = 0.6, profondeur = 8) {
  if (!scene.textures.exists('vignette')) {
    const c = scene.textures.createCanvas('vignette', 240, 135);
    const ctx = c.getContext();
    const grad = ctx.createRadialGradient(120, 60, 30, 120, 67, 150);
    grad.addColorStop(0, 'rgba(10,5,2,0)');
    grad.addColorStop(0.55, 'rgba(10,5,2,0.25)');
    grad.addColorStop(1, 'rgba(10,5,2,0.95)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 240, 135);
    c.refresh();
  }
  return scene.add.image(480, 270, 'vignette').setScale(4).setAlpha(intensite).setDepth(profondeur);
}

// Une bougie sur son bougeoir de laiton, avec une flamme animée et sa lumière.
// Renvoie { bougie, flamme, halo }.
function bougie(scene, x, sol, { echelle = 2, rayon = 150, profondeur = 2 } = {}) {
  creerInterieurHD(scene);
  const b = scene.add.image(x, sol, 'bougieHD').setOrigin(0.5, 1).setScale(echelle).setDepth(profondeur);
  const flamme = scene.add.sprite(x, sol - 15 * echelle, 'flammeBougie0').setOrigin(0.5, 1).setScale(echelle).setDepth(profondeur);
  flamme.play('flammeBougie');
  const halo = lumiere(scene, x, sol - 17 * echelle, rayon).setDepth(profondeur + 0.1);
  return { bougie: b, flamme, halo };
}

// --- Les panneaux des écrans de gestion ---

// Un panneau de parchemin (ou d'ardoise) dans un cadre de noyer à coins de laiton,
// à la taille voulue (à l'écran). Renvoie la clé de sa texture.
function panneauHD(scene, largeur, hauteur, fond = 'parchemin') {
  const cle = `panneau_${fond}_${Math.round(largeur)}x${Math.round(hauteur)}`;
  if (scene.textures.exists(cle)) return cle;
  const l = Math.round(largeur / 2), h = Math.round(hauteur / 2);
  const t = toileDecor(l, h);
  for (let y = 4; y < h - 4; y++) for (let x = 4; x < l - 4; x++) {
    const bord = Math.min(x - 4, y - 4, l - 5 - x, h - 5 - y);
    if (fond === 'ardoise') {
      t.poser(x, y, 'ardoise', 2 + Math.round((fbm(x * 0.15, y * 0.15, 21) - 0.5) * 1.6) + (hachage(x, y, 22) < 0.04 ? 1 : 0));
      continue;
    }
    let i = 4 + Math.round((fbm(x * 0.06, y * 0.08, 44 + l) - 0.5) * 1.6);
    if (bord < 2) i -= 1;
    if (hachage(x, y, 45) < 0.03) i -= 1;
    t.poser(x, y, 'parchemin', i);
  }
  cadreNoyer(t, l, h, fond);
  t.texture(scene, cle);
  return cle;
}

// --- Les meubles et les objets ---

function creerInterieurHD(scene) {
  if (scene.textures.exists('bougieHD')) return;
  creerObjetsHD(scene);

  // La bougie, coulée de cire, sur un bougeoir de laiton
  {
    const t = toileObjet(10, 17);
    t.forme('laiton', (x, y) => (y >= 14 && y <= 16 && x >= 0 && x <= 9 ? [(x - 4.5) / 6, -0.6, 0.8] : null));
    t.forme('laiton', (x, y) => (y >= 12 && y <= 13 && x >= 2 && x <= 7 ? [(x - 4.5) / 4, -0.3, 0.9] : null), { decalage: 0.3 });
    t.forme('cire', (x, y) => (y >= 3 && y <= 12 && x >= 3 && x <= 6 ? [(x - 4.5) / 2.5, 0, 0.9] : null));
    t.poser(3, 5, 'cire', 5); t.poser(2, 6, 'cire', 4); t.poser(2, 7, 'cire', 3); t.poser(6, 4, 'cire', 5); t.poser(7, 5, 'cire', 3); // les coulures
    t.poser(4, 2, 'encre', 0); t.poser(4, 1, 'encre', 1); // la mèche
    t.contour();
    t.texture(scene, 'bougieHD');
  }
  // La flamme, en trois images
  for (let f = 0; f < 3; f++) {
    const t = toileObjet(5, 9);
    const pench = [0, 0.6, -0.5][f], haut = [0, 1, 0][f];
    t.forme('flamme', (x, y) => {
      const v = (y + 0.5 - haut) / (9 - haut);
      if (v < 0) return null;
      const w = 2.4 * Math.sqrt(v) * (1.1 - v * 0.35);
      const nx = (x + 0.5 - 2.5 - (1 - v) * pench) / Math.max(0.4, w);
      return Math.abs(nx) <= 1 ? [nx, -0.2, 0.9] : null;
    }, { bord: false });
    t.forme('flamme', (x, y) => (y >= 5 && y <= 7 && Math.abs(x + 0.5 - 2.5) < 1.1 ? [0, 0, 1] : null), { decalage: 1.4, bord: false });
    t.poser(2, 8, 'gemme', 4); // le bleu au pied de la flamme
    t.texture(scene, 'flammeBougie' + f);
  }
  if (!scene.anims.exists('flammeBougie')) {
    scene.anims.create({ key: 'flammeBougie', frames: [0, 1, 0, 2].map(f => ({ key: 'flammeBougie' + f })), frameRate: 7, repeat: -1 });
  }

  // La lanterne de fer, qui pend au plafond
  {
    const t = toileObjet(16, 26);
    for (let y = 0; y < 4; y++) t.poser(7 + (y % 2), y, 'fer', 3); // la chaîne
    t.forme('fer', (x, y) => (y >= 4 && y <= 7 && Math.abs(x + 0.5 - 8) <= 2 + (y - 4) * 1.6 ? [(x + 0.5 - 8) / 7, -0.7, 0.7] : null));
    t.forme('flamme', (x, y) => (y >= 9 && y <= 20 && x >= 3 && x <= 12 ? [(x - 7.5) / 8, (y - 14) / 10, 0.9] : null), { decalage: 0.6, bord: false });
    t.forme('flamme', ellipsoide(7.5, 15, 2, 3), { decalage: 1.3, bord: false });
    for (let y = 8; y <= 21; y++) for (const x of [2, 7, 13]) t.poser(x, y, 'fer', x === 2 ? 4 : 2);
    for (let x = 2; x <= 13; x++) { t.poser(x, 8, 'fer', 4); t.poser(x, 21, 'fer', 2); }
    t.forme('fer', (x, y) => (y >= 22 && y <= 24 && Math.abs(x + 0.5 - 8) <= 4 - (y - 22) ? [0, 0.6, 0.8] : null));
    t.contour();
    t.texture(scene, 'lanterneHD');
  }

  // Un sac de pièces, noué
  {
    const t = toileObjet(16, 18);
    t.forme('chanvre', ellipsoide(8, 12, 7, 6));
    t.forme('chanvre', (x, y) => (y >= 3 && y <= 6 && Math.abs(x + 0.5 - 8) <= 2 + (6 - y) * 0.7 ? [(x + 0.5 - 8) / 4, -0.4, 0.8] : null), { decalage: -0.3 });
    for (let x = 5; x <= 10; x++) t.poser(x, 6, 'cuir', 2);
    t.poser(7, 2, 'or', 4); t.poser(8, 2, 'or', 5); t.poser(9, 3, 'or', 3); // des pièces qui dépassent
    t.dessin(6, 10, ['.ooo.', 'o...o', '.ooo.'], { o: ['chanvre', 1] }); // le symbole de la pièce
    t.contour();
    t.texture(scene, 'sacHD');
  }

  // Un lingot d'or
  {
    const t = toileObjet(14, 7);
    t.forme('or', (x, y) => (y >= 1 && y <= 5 && x >= 1 + (5 - y) * 0.4 && x <= 12 - (5 - y) * 0.4 ? [0, y < 3 ? -0.9 : 0.4, 0.6] : null));
    for (let x = 3; x <= 10; x++) t.poser(x, 1, 'or', 5);
    t.contour();
    t.texture(scene, 'lingotHD');
  }

  // Le panier d'osier des cadeaux, avec son anse
  {
    const t = toileObjet(48, 30);
    for (let a = 0; a <= Math.PI; a += 0.04) {
      const x = 24 + Math.cos(a) * 18, y = 13 - Math.sin(a) * 12;
      t.poser(Math.round(x), Math.round(y), 'chanvre', a < Math.PI / 2 ? 2 : 4);
      t.poser(Math.round(x), Math.round(y) + 1, 'chanvre', 1);
    }
    t.forme('chanvre', (x, y) => {
      const v = (y - 13) / 16;
      return y >= 13 && y <= 28 && Math.abs(x + 0.5 - 24) <= 22 - v * 4 ? [(x + 0.5 - 24) / 26, v - 0.3, 0.8] : null;
    }, { motif: (x, y) => (((x >> 1) + (y >> 1)) % 2 ? 0.45 : -0.45) });
    for (let x = 2; x <= 45; x++) { t.poser(x, 13, 'chanvre', 5); t.poser(x, 14, 'chanvre', 3); }
    t.contour();
    t.texture(scene, 'panierHD');
  }

  // Le vieux buffet : plateau qui déborde, deux tiroirs à poignées de laiton, petits pieds
  {
    const t = toileDecor(52, 42);
    // (tout descend de 4 pixels : un fronton cintré coiffe le buffet)
    t.forme('chene', (x, y) => { const dx = (x + 0.5 - 26) / 18; return y < 5 && dx * dx + Math.pow((y - 5) / 5, 2) < 1 ? [dx * 0.5, -0.6, 0.7] : null; });
    planche(t, 0, 4, 52, 4, 'chene', { graine: 530, noeuds: 1 });
    arrondirCoins(t, 0, 4, 52, 4, 2, { bas: false });
    planche(t, 2, 8, 48, 30, 'cheneSombre', { graine: 531, noeuds: 2 });
    arrondirCoins(t, 2, 8, 48, 30, 3, { haut: false });
    for (const y0 of [11, 24]) {
      planche(t, 5, y0, 42, 11, 'chene', { graine: 532 + y0, noeuds: 1 });
      for (let x = 5; x < 47; x++) { t.poser(x, y0, 'chene', 5); t.poser(x, y0 + 10, 'chene', 1); }
      for (let y = y0; y < y0 + 11; y++) { t.poser(5, y, 'chene', 4); t.poser(46, y, 'chene', 1); }
      t.forme('laiton', ellipsoide(26, y0 + 5.5, 3, 1.4), { decalage: 0.3 });
    }
    for (const x of [6, 46]) t.forme('cheneSombre', ellipsoide(x, 39.5, 2.6, 2.2), { decalage: 0.5 }); // des pieds en boule
    t.contour();
    t.texture(scene, 'buffetHD');
  }

  // La porte de la chambre : arc de pierre, planches, pentures de fer, anneau de laiton
  {
    const L = 46, H = 84, r = 23;
    const t = toileDecor(L, H);
    const dansArc = (x, y, marge) => {
      const cx = L / 2, cy = r;
      if (x < marge || x >= L - marge) return false;
      return y >= cy || Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= r - marge;
    };
    for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) {
      if (!dansArc(x, y, 0)) continue;
      if (!dansArc(x, y, 4)) {
        const i = 2 + Math.round(fbm(x * 0.3, y * 0.3, 540) * 2) + ((x + Math.floor(y / 5)) % 5 === 0 || y % 5 === 0 ? -1 : 0);
        t.poser(x, y, 'pierre', i);
      }
    }
    for (let x = 4; x < L - 4; x += 8) planche(t, x, 0, Math.min(8, L - 4 - x), H, 'chene', { horizontale: false, graine: 541 + x, noeuds: 1 });
    for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) {
      if (!dansArc(x, y, 0)) { t.c[y * L + x] = null; t.m[y * L + x] = null; continue; }
      if (!dansArc(x, y, 4)) { if (t.m[y * L + x] !== 'pierre') t.poser(x, y, 'pierre', 3); continue; }
      if (!dansArc(x, y, 5)) t.poser(x, y, 'cheneSombre', 0);
    }
    for (const y0 of [22, 62]) for (let x = 5; x < 34; x++) for (let y = y0; y < y0 + 3; y++) t.poser(x, y, 'fer', y === y0 ? 4 : 2);
    for (const y0 of [22, 62]) { clou(t, 9, y0); clou(t, 20, y0); clou(t, 30, y0); }
    t.forme('laiton', (x, y) => (Math.abs(Math.hypot(x + 0.5 - 35, y + 0.5 - 46) - 2.6) < 0.9 ? [(x - 35) / 3, (y - 46) / 3, 0.7] : null));
    t.poser(35, 42, 'laiton', 2);
    t.texture(scene, 'porteHD');
  }

  // Une reconnaissance de dette, clouée au mur
  {
    const t = toileDecor(30, 24);
    for (let y = 1; y < 24; y++) for (let x = 1; x < 29; x++) {
      if (hachage(x, y, 550) < 0.25 && (y === 23 || x === 28)) continue;
      t.poser(x, y, 'parchemin', 4 + Math.round((fbm(x * 0.2, y * 0.2, 551) - 0.5) * 1.5) - (y > 19 ? 1 : 0));
    }
    t.forme('cuirRouge', ellipsoide(22, 19, 2.6, 2.6), { decalage: 0.4 }); // le sceau
    clou(t, 14, 2);
    t.contour();
    t.texture(scene, 'noteDette');
  }

}

// --- Les niveaux de luxe (voir AMELIORATIONS) ---
// 0 : bois brut · 1 : chêne ciré · 2 : noyer à moulures, laiton · 3 : ébène et dorures.

const BOIS_LUXE = [
  { bois: [0x2a2420, 0x463a30, 0x645444, 0x82705a, 0x9e8a70, 0xb8a688], sombre: [0x15110e, 0x251e18, 0x372c22, 0x4a3c2e, 0x5e4c3a, 0x786250] },
  { bois: RAMPES_DECOR.chene, sombre: RAMPES_DECOR.cheneSombre },
  { bois: [0x1c0c06, 0x34180c, 0x522614, 0x6e3820, 0x8c4e30, 0xae6c48], sombre: [0x0e0604, 0x1c0c08, 0x2c140c, 0x3e1e12, 0x52281a, 0x6a3624] },
  { bois: [0x100c10, 0x201820, 0x30242e, 0x44323e, 0x5e4654, 0x806474], sombre: [0x08060a, 0x120e14, 0x1c1620, 0x28202c, 0x362a3a, 0x4a3a4c] },
];

// Une toile dont le bois (et le laiton, doré au plus haut niveau) dépend du niveau de luxe.
function toileLuxe(l, h, n) {
  const t = toileDecor(l, h);
  t.rampes.chene = BOIS_LUXE[n].bois;
  t.rampes.cheneSombre = BOIS_LUXE[n].sombre;
  if (n === 3) t.rampes.laiton = [0x5a3a08, 0x8a6010, 0xc09020, 0xe8c040, 0xf8e070, 0xfffcd0];
  return t;
}

// Arrondit les coins d'un rectangle de la toile (efface les pixels hors des quarts de cercle).
function arrondirCoins(t, x0, y0, l, h, r, { haut = true, bas = true } = {}) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + l; x++) {
    const dx = x < x0 + r ? x0 + r - x - 0.5 : x >= x0 + l - r ? x - (x0 + l - r) + 0.5 : 0;
    const dy = y < y0 + r ? y0 + r - y - 0.5 : y >= y0 + h - r ? y - (y0 + h - r) + 0.5 : 0;
    if (!dx || !dy || (y < y0 + r && !haut) || (y >= y0 + h - r && !bas)) continue;
    if (dx * dx + dy * dy > r * r) { t.c[y * t.l + x] = null; t.m[y * t.l + x] = null; }
  }
}

// Des moulures : un creux sombre et un filet clair, le long d'une pièce de bois.
function moulure(t, x0, y0, l, h, horizontale = true) {
  if (horizontale) for (let x = x0; x < x0 + l; x++) { t.poser(x, y0, 'chene', 0); t.poser(x, y0 + 1, 'chene', 5); }
  else for (let y = y0; y < y0 + h; y++) { t.poser(x0, y, 'chene', 0); t.poser(x0 + 1, y, 'chene', 5); }
}

// L'étagère de la réserve : fond de planches dans l'ombre, montants, trois rayons à consoles.
function etagereHD(scene, n) {
  const cle = 'etagereArriere_' + n;
  if (scene.textures.exists(cle)) return cle;
  const L = 256, H = 182, rayons = [37, 90, 142];
  const t = toileLuxe(L, H, n);
  for (let x = 6; x < L - 6; x += 14) planche(t, x, 6, Math.min(14, L - 6 - x), H - 6, 'cheneSombre', { horizontale: false, graine: 500 + x, noeuds: n ? 1 : 3 });
  for (const r of rayons) for (let y = r + 5; y < r + 11; y++) for (let x = 6; x < L - 6; x++) {
    if (hachage(x, y, 501) < 0.85 - (y - r - 5) * 0.12) t.poser(x, y, 'cheneSombre', 0);
  }
  planche(t, 0, 0, L, 6, 'chene', { graine: 502, noeuds: 2 });
  for (let x = 0; x < L; x++) t.poser(x, 6, 'cheneSombre', 0);
  for (const x of [0, L - 6]) planche(t, x, 0, 6, H, 'chene', { horizontale: false, graine: 503 + x, noeuds: 2 });
  for (const r of rayons) {
    planche(t, 6, r, L - 12, 5, 'chene', { graine: 510 + r, noeuds: n ? 2 : 4 });
    for (const cx of [7, L - 13]) for (let k = 0; k < 6; k++) for (let j = 0; j < 6 - k; j++) t.poser(cx + (cx < L / 2 ? j : 5 - j), r + 5 + k, 'chene', j === 0 ? 4 : 2);
    if (n === 0) { clou(t, 2, r + 1); clou(t, L - 4, r + 1); clou(t, L / 2, r + 1); }
  }
  if (n === 0) {
    // Du bois brut : des échardes et des planches mal ajustées
    for (let k = 0; k < 40; k++) t.poser(Math.floor(hachage(k, 1, 505) * L), Math.floor(hachage(k, 2, 505) * H), 'chene', 0);
  }
  if (n >= 2) {
    // Des moulures sur les montants et une corniche à denticules
    for (const x of [2, L - 4]) moulure(t, x, 8, 0, H - 10, false);
    moulure(t, 0, 2, L, 0);
    for (let x = 6; x < L - 6; x += 4) for (let y = 7; y < 9; y++) { t.poser(x, y, 'chene', 3); t.poser(x + 1, y, 'chene', 4); }
    for (const r of rayons) for (let x = 6; x < L - 6; x++) t.poser(x, r + 4, 'laiton', n === 3 ? 4 : 3); // le bord des rayons
  }
  if (n === 3) {
    // Les dorures : filets d'or, rosaces sur les montants, coins dorés
    for (let x = 0; x < L; x++) { t.poser(x, 0, 'laiton', 5); t.poser(x, 5, 'laiton', 3); }
    for (const x of [0, L - 6]) for (const y of [20, 64, 116, 166]) t.dessin(x + 1, y, ['.o.', 'oOo', '.o.'], { o: ['laiton', 3], O: ['laiton', 5] });
    for (const r of rayons) for (const cx of [7, L - 13]) for (let k = 0; k < 6; k++) t.poser(cx + (cx < L / 2 ? 0 : 5), r + 5 + k, 'laiton', 4);
  }
  t.texture(scene, cle);
  return cle;
}

// Le coffre de la fortune.
function coffreHD(scene, n) {
  const cle = 'coffreHD_' + n;
  if (scene.textures.exists(cle)) return cle;
  const t = toileLuxe(36, 28, Math.min(n, 1));
  const corps = n === 2 ? 'fer' : n === 3 ? 'laiton' : 'chene';
  if (n === 3) t.rampes.laiton = [0x5a3a08, 0x8a6010, 0xc09020, 0xe8c040, 0xf8e070, 0xfffcd0];
  // Le couvercle bombé, puis le corps
  t.forme(corps, (x, y) => {
    const dy = (y + 0.5 - 10) / 9;
    return y < 10 && x >= 1 && x <= 34 && dy * dy + Math.pow((x + 0.5 - 18) / 30, 2) < 1 ? [0, dy, 0.8] : null;
  });
  if (corps === 'chene') { planche(t, 1, 10, 34, 8, 'chene', { graine: 520, noeuds: 1 }); planche(t, 1, 18, 34, 9, 'chene', { graine: 521, noeuds: 1 }); }
  else t.forme(corps, (x, y) => (x >= 1 && x <= 34 && y >= 10 && y <= 26 ? [(x - 17.5) / 30, (y - 16) / 20, 0.85] : null));
  if (n === 0) {
    // Une simple caisse, tenue par une corde
    for (let x = 1; x < 35; x++) t.poser(x, 10, 'chene', 1);
    for (let y = 2; y < 27; y++) { t.poser(17, y, 'chanvre', 3 + (y % 2)); t.poser(18, y, 'chanvre', 2); }
  } else if (n === 1) {
    for (const x of [4, 30]) for (let y = 2; y < 27; y++) { t.poser(x, y, 'fer', 3); t.poser(x + 1, y, 'fer', 1); }
    for (let x = 1; x < 35; x++) { t.poser(x, 10, 'fer', 4); t.poser(x, 11, 'fer', 2); t.poser(x, 26, 'fer', 1); }
    for (const [x, y] of [[4, 14], [30, 14], [4, 22], [30, 22]]) t.poser(x, y, 'fer', 5);
    t.forme('laiton', (x, y) => (x >= 15 && x <= 20 && y >= 9 && y <= 15 ? [(x - 17.5) / 4, (y - 12) / 5, 0.8] : null));
    t.poser(17, 12, 'encre', 0); t.poser(17, 13, 'encre', 0); t.poser(18, 12, 'encre', 1);
  } else if (n === 2) {
    // Le coffre-fort des nains : rivets partout, une molette de laiton
    for (let x = 1; x < 35; x++) { t.poser(x, 10, 'fer', 1); t.poser(x, 11, 'fer', 4); }
    for (let x = 3; x < 34; x += 4) for (const y of [13, 25]) { t.poser(x, y, 'fer', 5); t.poser(x + 1, y + 1, 'fer', 1); }
    for (let y = 13; y < 26; y += 4) for (const x of [3, 32]) { t.poser(x, y, 'fer', 5); t.poser(x + 1, y + 1, 'fer', 1); }
    t.forme('laiton', ellipsoide(18, 18, 4.2, 4.2), { decalage: 0.3 });
    t.forme('laiton', ellipsoide(18, 18, 2, 2), { decalage: -0.4 });
    for (let a = 0; a < 6.28; a += 0.8) t.poser(Math.round(18 + Math.cos(a) * 3.3), Math.round(18 + Math.sin(a) * 3.3), 'laiton', 1);
  } else {
    // L'or gravé, serti de gemmes
    for (let x = 1; x < 35; x++) { t.poser(x, 10, 'laiton', 1); t.poser(x, 11, 'laiton', 5); }
    for (let x = 4; x < 33; x += 2) t.poser(x, 15 + ((x >> 1) % 2), 'laiton', 2); // la frise gravée
    for (let x = 4; x < 33; x += 2) t.poser(x, 22 + ((x >> 1) % 2), 'laiton', 2);
    t.forme('gemme', ellipsoide(18, 18.5, 2.6, 2.6), { decalage: 0.4 });
    t.forme('verreRouge', ellipsoide(8, 18.5, 1.6, 1.6), { decalage: 0.4 });
    t.forme('verreRouge', ellipsoide(28, 18.5, 1.6, 1.6), { decalage: 0.4 });
    t.forme('verreVert', ellipsoide(18, 5, 1.6, 1.6), { decalage: 0.4 });
  }
  t.contour();
  t.texture(scene, cle);
  return cle;
}

// Le lit : de la paillasse au lit à baldaquin.
function litHD(scene, n) {
  const cle = 'litHD_' + n;
  if (scene.textures.exists(cle)) return cle;
  const L = 172, H = n === 3 ? 150 : 62, b = H - 62; // b : décalage vers le bas (le baldaquin est plus haut)
  const t = toileLuxe(L, H, n);
  if (n === 0) {
    // Une paillasse sur des planches posées sur deux caisses
    for (const x of [14, L - 34]) planche(t, x, b + 42, 20, 20, 'chene', { graine: 559 + x, noeuds: 1 });
    planche(t, 6, b + 38, L - 12, 5, 'chene', { graine: 560, noeuds: 3 });
    t.forme('chanvre', (x, y) => (x >= 8 && x < L - 8 && y >= b + 28 && y <= b + 38 ? [0, (y - b - 31) / 9, 0.85] : null),
      { motif: (x, y) => (hachage(x, y, 561) < 0.3 ? 0.6 : hachage(x, y, 562) < 0.2 ? -0.6 : 0) });
    arrondirCoins(t, 8, b + 28, L - 16, 11, 5); // une paillasse bien rebondie
    t.forme('toile', (x, y) => { const nx = (x + 0.5 - 24) / 12, ny = (y + 0.5 - b - 26) / 4.5; return nx * nx + ny * ny < 1 ? [nx * 0.7, ny, 0.7] : null; });
    t.contour();
    t.texture(scene, cle);
    return cle;
  }
  // La tête de lit (plus haute et sculptée aux niveaux supérieurs), le pied de lit
  const hauteurTete = n === 1 ? 4 : 0;
  planche(t, 0, b + hauteurTete, 9, H - b - hauteurTete, 'chene', { horizontale: false, graine: 560, noeuds: 1 });
  planche(t, 9, b + 8, 6, 30, 'cheneSombre', { horizontale: false, graine: 561 });
  planche(t, L - 9, b + 22, 9, 40, 'chene', { horizontale: false, graine: 562, noeuds: 1 });
  if (n === 1) {
    // Une tête de lit cintrée, un pied de lit arrondi
    t.forme('chene', (x, y) => {
      const dx = (x + 0.5 - 18) / 18, dy = (y + 0.5 - b - 14) / 10;
      return x >= 0 && x < 36 && y >= b + 4 && y < b + 30 && (y >= b + 14 || dx * dx + dy * dy < 1) ? [0, -0.3, 0.85] : null;
    });
    moulure(t, 3, b + 26, 30, 0);
    t.forme('chene', ellipsoide(4.5, b + 3.5, 4, 3.5), { decalage: 0.3 });
    t.forme('chene', (x, y) => { const dx = (x + 0.5 - (L - 4.5)) / 4.5; return y >= b + 17 && y < b + 24 && Math.abs(dx) < 1 && y >= b + 17 + dx * dx * 3 ? [dx, -0.3, 0.8] : null; }, { decalage: 0.3 });
  } else {
    // Un panneau sculpté en arc derrière l'oreiller
    t.forme('chene', (x, y) => {
      const dx = (x + 0.5 - 22) / 22, dy = (y + 0.5 - b - 14) / 12;
      return x >= 0 && x < 44 && y >= b + 2 && y < b + 30 && (y >= b + 14 || dx * dx + dy * dy < 1) ? [0, -0.3, 0.85] : null;
    });
    moulure(t, 4, b + 26, 38, 0);
    for (let x = 8; x < 38; x += 6) t.dessin(x, b + 16, ['.o.', 'o.o', '.o.'], { o: ['chene', 5] });
    t.forme('laiton', ellipsoide(L - 4.5, b + 20, 3.5, 3.5), { decalage: 0.4 });
  }
  // Le matelas, le cadre, l'oreiller
  t.forme('toile', (x, y) => (x >= 9 && x < L - 9 && y >= b + 30 && y <= b + 40 ? [0, (y - b - 33) / 9, 0.85] : null),
    { motif: (x, y) => (y === b + 31 ? 0.4 : x % 10 === 0 ? -0.4 : 0) });
  planche(t, 9, b + 40, L - 18, 8, 'chene', { graine: 563, noeuds: 2 });
  if (n >= 2) { moulure(t, 9, b + 42, L - 18, 0); for (let x = 9; x < L - 9; x++) t.poser(x, b + 47, 'laiton', n === 3 ? 4 : 2); }
  for (let x = 9; x < L - 9; x++) t.poser(x, b + 48, 'cheneSombre', 0);
  for (const dx of n >= 2 ? [0, 22] : [0]) {
    t.forme('lin', (x, y) => { const nx = (x + 0.5 - 26 - dx) / 14, ny = (y + 0.5 - b - 27) / 6; return nx * nx + ny * ny < 1 ? [nx * 0.7, ny, 0.7] : null; });
  }
  if (n === 3) {
    // Le baldaquin : deux colonnes, un ciel de velours rouge à franges d'or, des rideaux
    for (const x of [0, L - 9]) { planche(t, x, 0, 9, H, 'chene', { horizontale: false, graine: 570 + x }); moulure(t, x + 3, 6, 0, H - 10, false); }
    t.forme('cuirRouge', (x, y) => (y >= 2 && y <= 14 && x >= 0 && x < L ? [0, (y - 8) / 10, 0.85] : null), { motif: (x) => ((x % 16) < 2 ? -0.7 : 0) });
    for (let x = 0; x < L; x++) { t.poser(x, 1, 'laiton', 5); t.poser(x, 15, 'laiton', 4); if (x % 3 === 0) t.poser(x, 16, 'laiton', 3); }
    for (const [x0, sens] of [[9, 1], [L - 9, -1]]) {
      t.forme('cuirRouge', (x, y) => {
        const largeur = 10 - (y - 16) * 0.07;
        const dx = (x + 0.5 - x0) * sens;
        return y > 16 && y < b + 34 && dx >= 0 && dx < largeur ? [dx / largeur - 0.5, 0.1, 0.85] : null;
      }, { motif: (x) => (x % 4 === 0 ? -0.6 : 0) });
    }
  }
  t.contour();
  t.texture(scene, cle);
  return cle;
}

// La couverture : laine rayée, patchwork, édredon de velours, velours pourpre brodé d'or.
function couvertureHD(scene, n) {
  const cle = 'couvertureHD_' + n;
  if (scene.textures.exists(cle)) return cle;
  const L = 120, H = 26;
  const t = toileLuxe(L, H, n);
  // La couverture épouse le dormeur : bosses des épaules, des hanches et des pieds, coins
  // arrondis, et le drap retourné près de l'oreiller.
  const bosse = x => 5.5 * Math.exp(-(((x - 26) / 13) ** 2)) + 4 * Math.exp(-(((x - 68) / 16) ** 2)) + 3 * Math.exp(-(((x - 106) / 8) ** 2));
  const haut = x => Math.round(9 - bosse(x));
  for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) {
    const yh = haut(x);
    if (y < yh) continue;
    const coin = Math.min(x, L - 1 - x);
    if (coin < 3 && y > H - 4 + coin) continue;
    if (x > L - 4 && y < yh + (L - x)) continue;
    const pente = haut(x + 1) - haut(x - 1);
    let ombre = (y > H - 4 ? -1 : 0) + (y <= yh + 1 ? 1 : 0) + (pente > 0 ? 1 : pente < 0 ? -1 : 0) + ((x + y * 3) % 23 === 0 ? -1 : 0);
    if (x < 9) { t.poser(x, y, 'lin', 4 + (x === 8 ? -2 : 0) + (y <= yh + 1 ? 1 : 0)); continue; } // le drap retourné
    if (n === 0) {
      t.poser(x, y, 'chanvre', 3 + ombre + (y % 8 < 2 ? -1 : 0) + Math.round((fbm(x * 0.2, y * 0.2, 575) - 0.5)));
    } else if (n === 1) {
      const cx = Math.floor(x / 12), cy = Math.floor(y / 13);
      const mat = ['cuirRouge', 'laiton', 'toile', 'encre'][(cx + cy * 3) % 4];
      let i = 3 + Math.round((fbm(x * 0.15, y * 0.15, 570 + cx) - 0.5) * 1.4) + ombre;
      if (x % 12 === 0 || y === 13) i = 1;
      if ((x % 12 === 6 && y % 13 === 6) || ((x + y) % 4 === 0 && (cx + cy) % 2 === 0)) i += 1;
      t.poser(x, y, mat, i);
    } else {
      // Le capitonnage en losanges, cousu de fil d'or
      const mat = n === 2 ? 'cuirRouge' : 'gemme';
      const u = (x + y) % 12, v = (x - y + 120) % 12;
      let i = (n === 2 ? 3 : 2) + ombre + (u < 6 ? 1 : 0) - (v < 2 ? 1 : 0);
      t.poser(x, y, mat, i);
      if (u === 0 || v === 0) t.poser(x, y, 'laiton', n === 3 ? 4 : 2);
      if (n === 3 && (y < 2 || x < 2 || x > L - 3)) t.poser(x, y, 'laiton', y === 0 ? 5 : 3);
    }
  }
  t.contour();
  t.texture(scene, cle);
  return cle;
}

// La table de chevet.
function chevetHD(scene, n) {
  const cle = 'chevetHD_' + n;
  if (scene.textures.exists(cle)) return cle;
  const t = toileLuxe(36, 32, n);
  // Les pieds tournés, un peu évasés, avec leurs renflements
  for (const [x0, sens] of [[6, -1], [29, 1]]) for (let y = 13; y < 32; y++) {
    const v = (y - 13) / 19, larg = 1.2 + Math.abs(Math.sin(v * Math.PI * 2.2)) * 1.1;
    const cx = x0 + sens * v * 2;
    for (let x = Math.floor(cx - larg); x <= cx + larg; x++) t.poser(x, y, 'chene', x < cx ? 4 : 2);
  }
  // Le caisson et son tiroir, aux coins arrondis
  planche(t, 4, 4, 28, 11, 'cheneSombre', { graine: 581 });
  arrondirCoins(t, 4, 4, 28, 11, 3, { haut: false });
  for (let x = 8; x < 28; x++) { t.poser(x, 6, 'chene', 4); t.poser(x, 12, 'chene', 1); }
  for (let y = 6; y < 13; y++) { t.poser(8, y, 'chene', 4); t.poser(27, y, 'chene', 1); }
  t.forme(n ? 'laiton' : 'chene', ellipsoide(18, 9.5, 1.6, 1.4), { decalage: 0.4 });
  // Le plateau, arrondi aux deux bouts
  t.forme('chene', (x, y) => (y >= 0 && y <= 4 && Math.abs(x + 0.5 - 18) < 18 - Math.max(0, Math.abs(y - 2) - 1) * 1.5 ? [(x + 0.5 - 18) / 30, (y - 2) / 3, 0.85] : null),
    { motif: (x, y) => (y === 0 ? 0.6 : 0) });
  if (n >= 2) for (let x = 3; x < 33; x++) t.poser(x, 4, 'laiton', n === 3 ? 4 : 2);
  t.contour();
  t.texture(scene, cle);
  return cle;
}

// Le tapis : une natte, un tapis tressé, un grand tapis tressé, un tapis d'Orient à franges.
function tapisHD(scene, n) {
  const cle = 'tapisHD_' + n;
  if (scene.textures.exists(cle)) return cle;
  const L = [100, 150, 170, 180][n], H = [14, 20, 22, 24][n];
  const t = toileLuxe(L, H, n);
  const anneaux = [['chanvre', 'chanvre'], ['cuirRouge', 'laiton', 'cuirRouge', 'toile', 'cuirRouge', 'laiton'],
    ['encre', 'laiton', 'cuirRouge', 'toile', 'cuirRouge', 'laiton', 'encre'], null][n];
  for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) {
    if (n === 3) {
      // Rectangulaire, bordure dorée, médaillon central, franges
      if (x < 3 || x > L - 4) { if (y % 2 === 0) t.poser(x, y, 'toile', 4); continue; }
      const bord = Math.min(x - 3, y, L - 4 - x, H - 1 - y);
      const d = Math.hypot((x + 0.5 - L / 2) / 26, (y + 0.5 - H / 2) / 7);
      if (bord < 2) t.poser(x, y, 'laiton', bord ? 3 : 4);
      else if (d < 1) t.poser(x, y, d < 0.5 ? 'laiton' : 'encre', 3 + ((x + y) % 3 === 0 ? 1 : 0));
      else t.poser(x, y, 'cuirRouge', 3 + ((x * 2 + y) % 7 === 0 ? 1 : 0) - (bord < 4 ? 1 : 0));
      continue;
    }
    const d = Math.hypot((x + 0.5 - L / 2) / (L / 2), (y + 0.5 - H / 2) / (H / 2));
    if (d > 1) continue;
    const k = Math.min(anneaux.length - 1, Math.floor((1 - d) * anneaux.length));
    const tresse = (x + Math.floor(y / 2)) % 3 === 0 ? -1 : 0;
    t.poser(x, y, anneaux[k], 3 + tresse + (y < H / 2 ? 0 : -1));
  }
  t.contour();
  t.texture(scene, cle);
  return cle;
}

// Les luminaires : applique à bougie, lanterne, chandelier de fer, lustre de cristal.
function luminaireHD(scene, n) {
  const cle = 'luminaire_' + n;
  if (scene.textures.exists(cle)) return cle;
  creerInterieurHD(scene);
  if (n === 1) return 'lanterneHD';
  const L = [14, 0, 44, 56][n], H = [22, 0, 34, 46][n];
  const t = toileObjet(L, H);
  Object.assign(t.rampes, { laiton: n === 3 ? [0x5a3a08, 0x8a6010, 0xc09020, 0xe8c040, 0xf8e070, 0xfffcd0] : RAMPES_DECOR.laiton });
  const chandelle = (x, y) => {
    t.forme('cire', (xx, yy) => (xx >= x && xx <= x + 1 && yy >= y && yy <= y + 4 ? [xx === x ? -0.5 : 0.5, 0, 0.9] : null));
    t.forme('flamme', ellipsoide(x + 0.5, y - 2, 1.2, 2), { decalage: 1, bord: false });
  };
  if (n === 0) {
    // Une applique de fer forgé, fixée au mur, avec sa bougie
    for (let y = 8; y < 22; y++) t.poser(1, y, 'fer', y % 4 ? 2 : 4);
    for (let x = 1; x < 10; x++) t.poser(x, 18 - Math.round(Math.sin((x - 1) / 9 * 1.6) * 4), 'fer', 3);
    t.forme('laiton', (x, y) => (y >= 15 && y <= 16 && x >= 6 && x <= 12 ? [0, -0.5, 0.8] : null));
    chandelle(8, 10);
  } else {
    // Suspendu au plafond par une chaîne
    for (let y = 0; y < 8; y++) t.poser(L / 2 + (y % 2), y, n === 3 ? 'laiton' : 'fer', 3);
    const metal = n === 3 ? 'laiton' : 'fer';
    const cy = n === 2 ? 22 : 26, rx = L / 2 - 3;
    for (let a = 0; a < Math.PI * 2; a += 0.03) {
      const x = L / 2 + Math.cos(a) * rx, y = cy + Math.sin(a) * 3;
      t.poser(Math.round(x), Math.round(y), metal, Math.sin(a) > 0 ? 2 : 4);
    }
    for (const k of [-1, 1]) for (let y = 8; y < cy; y++) t.poser(Math.round(L / 2 + k * (y - 8) * rx / (cy - 8)), y, metal, 3);
    const bougies = n === 2 ? [-1, -0.35, 0.35, 1] : [-1, -0.6, -0.2, 0.2, 0.6, 1];
    for (const k of bougies) chandelle(Math.round(L / 2 + k * (rx - 1)) - 1, cy - 6);
    if (n === 3) {
      // Les pampilles de cristal, et un second étage
      for (let x = 4; x < L - 4; x += 3) for (let y = cy + 2; y < cy + 6 + (x % 2) * 3; y++) t.poser(x, y, 'verre', y === cy + 2 ? 5 : 3 + (y % 2));
      for (let x = L / 2 - 10; x < L / 2 + 10; x += 2) t.poser(x, cy - 12, 'laiton', 4);
      for (const k of [-0.5, 0, 0.5]) chandelle(Math.round(L / 2 + k * 16) - 1, cy - 18);
      t.forme('verre', ellipsoide(L / 2, cy + 12, 2, 3), { decalage: 0.8 });
    }
  }
  t.contour();
  t.texture(scene, cle);
  return cle;
}

// Pose le luminaire du niveau d'éclairage, avec sa lumière. `x, y` : le point d'accroche
// (au plafond ; l'applique se fixe au mur, plus bas). Renvoie { image, halos }.
function poserLuminaire(scene, x, y, n, profondeur = 1) {
  const cle = luminaireHD(scene, n);
  const echelle = 3;
  const image = scene.add.image(x, n === 0 ? y + 90 : y, cle).setOrigin(0.5, 0).setScale(echelle).setDepth(profondeur);
  const centre = n === 0 ? y + 90 + 12 * echelle : y + (n === 1 ? 14 : n === 2 ? 18 : 24) * echelle;
  const halos = [
    lumiere(scene, x, centre, 260 + 70 * n, 0xffb060, 0.34 + 0.05 * n).setDepth(profondeur + 0.1),
    lumiere(scene, x, centre, 70 + 20 * n, 0xffd890, 0.45).setDepth(profondeur + 0.1),
  ];
  return { image, halos };
}

// --- Le bureau ---

function creerBureauHD(scene) {
  if (scene.textures.exists('livreRegistre')) return;
  // Le dessus du bureau : de larges planches cirées
  {
    const t = toileDecor(480, 270);
    for (let k = 0; k * 18 < 270; k++) planche(t, 0, k * 18, 480, Math.min(18, 270 - k * 18), 'chene', { graine: 600 + k, noeuds: 2 });
    t.texture(scene, 'bureauBois');
  }
  // Le registre ouvert : couverture de cuir rouge, deux pages, la reliure au milieu, la tranche
  {
    const L = 270, H = 211, dos = 135;
    const t = toileDecor(L, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) {
      const bord = Math.min(x, y, L - 1 - x, H - 1 - y);
      if (bord === 0) { t.poser(x, y, 'cuirRouge', 0); continue; }
      if (bord < 4) { t.poser(x, y, 'cuirRouge', (x < 4 || y < 4 ? 4 : 2) + Math.round((fbm(x * 0.3, y * 0.3, 610) - 0.5))); continue; }
      if (y > H - 7) { t.poser(x, y, 'parchemin', y % 2 ? 2 : 3); continue; } // la tranche des pages
      const gouttiere = Math.abs(x + 0.5 - dos);
      let i = 4 + Math.round((fbm(x * 0.05, y * 0.06, 611) - 0.5) * 0.9);
      if (gouttiere < 5) i -= Math.ceil((5 - gouttiere) / 1.6);
      if (bord < 6) i -= 1;
      t.poser(x, y, 'parchemin', i);
    }
    for (const [x, y] of [[0, 0], [L - 6, 0], [0, H - 6], [L - 6, H - 6]]) for (let j = 0; j < 6; j++) for (let k = 0; k < 6 - j; k++) {
      t.poser(x === 0 ? x + k : x + 5 - k, y === 0 ? y + j : y + 5 - j, 'laiton', j === 0 || k === 0 ? 4 : 3);
    }
    t.texture(scene, 'livreRegistre');
  }
  // Les onglets (marque-pages de cuir), actif et inactif
  for (const actif of [false, true]) {
    const t = toileDecor(43, 14);
    for (let y = 0; y < 14; y++) for (let x = 0; x < 43; x++) {
      if ((x === 0 || x === 42) && y < 2) continue;
      const bord = Math.min(x, y, 42 - x);
      t.poser(x, y, actif ? 'parchemin' : 'cuirRouge', bord === 0 ? 1 : y === 1 ? 5 : (actif ? 4 : 3) - (y > 11 ? 1 : 0));
    }
    t.texture(scene, actif ? 'ongletHD_actif' : 'ongletHD');
  }
  // Un tiroir du bureau : façade de chêne moulurée, poignée de laiton (et sa version éclairée)
  for (const clair of [false, true]) {
    const t = toileDecor(180, 17);
    if (clair) t.rampes.chene = RAMPES_DECOR.chene.map((c, i, r) => r[Math.min(5, i + 1)]);
    planche(t, 0, 0, 180, 17, 'chene', { graine: 620, noeuds: 1 });
    for (let x = 0; x < 180; x++) { t.poser(x, 0, 'cheneSombre', 0); t.poser(x, 1, 'chene', 5); t.poser(x, 15, 'chene', 1); t.poser(x, 16, 'cheneSombre', 0); }
    for (let y = 0; y < 17; y++) { t.poser(0, y, 'cheneSombre', 0); t.poser(1, y, 'chene', 4); t.poser(178, y, 'chene', 1); t.poser(179, y, 'cheneSombre', 0); }
    moulure(t, 4, 3, 172, 0); moulure(t, 4, 12, 172, 0);
    t.forme('laiton', (x, y) => (x >= 160 && x <= 172 && y >= 6 && y <= 10 ? [(x - 166) / 8, (y - 8) / 4, 0.8] : null), { decalage: clair ? 0.6 : 0.2 });
    t.contour();
    t.texture(scene, clair ? 'tiroirHD_clair' : 'tiroirHD');
  }
}
