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

  // (v0.84) La porte de la rue, au fond de l'arrière-boutique : la même que la porte d'entrée vue de
  // la rue, qui embellit avec la maison (quatre niveaux)
  for (let n = 0; n <= 3; n++) {
    const t = toileDecor(58, 98);
    porteEntree(t, 0, 0, 58, 98, n);
    t.contour();
    t.texture(scene, 'porteRueHD_' + n);
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
  const L = 256, H = 182, rayons = [37, 90, 142], P = 8; // P : la largeur des montants
  const t = toileLuxe(L, H, n);
  // Le fond : des lames verticales, plus sombres dans l'ombre des rayons et de la corniche
  for (let x = P; x < L - P; x += 16) planche(t, x, 10, Math.min(16, L - P - x), H - 20, 'cheneSombre', { horizontale: false, graine: 500 + x, noeuds: n ? 1 : 3 });
  const ombre = (y0, h) => { for (let y = y0; y < y0 + h; y++) for (let x = P; x < L - P; x++) if (hachage(x, y, 501) < 0.9 - (y - y0) / h) t.poser(x, y, 'cheneSombre', 0); };
  ombre(10, 7);
  for (const r of rayons) ombre(r + 6, 8);
  // Les montants : épais, chanfreinés, éclairés à gauche
  for (const x0 of [0, L - P]) {
    planche(t, x0, 4, P, H - 4, 'chene', { horizontale: false, graine: 503 + x0, noeuds: 2 });
    for (let y = 4; y < H; y++) { t.poser(x0, y, 'chene', 4); t.poser(x0 + P - 1, y, 'chene', 1); t.poser(x0 + 1, y, 'chene', 3); }
  }
  // La corniche, avec son profil mouluré
  planche(t, 0, 0, L, 10, 'chene', { graine: 502, noeuds: 2 });
  for (let x = 0; x < L; x++) { t.poser(x, 0, 'chene', 5); t.poser(x, 1, 'chene', 4); t.poser(x, 7, 'chene', 4); t.poser(x, 8, 'chene', 2); t.poser(x, 9, 'cheneSombre', 0); }
  // Le socle
  planche(t, 0, H - 10, L, 10, 'chene', { graine: 506, noeuds: 2 });
  for (let x = 0; x < L; x++) { t.poser(x, H - 10, 'chene', 5); t.poser(x, H - 1, 'cheneSombre', 0); }
  if (n >= 1) for (let x = 12; x < L - 12; x += 30) for (let k = 0; k < 18; k++) t.poser(x + k, H - 6, 'chene', 1 + (k === 0 || k === 17 ? 2 : 0)); // panneaux du socle
  // Les rayons : épais, chant éclairé, et des consoles en dessous
  for (const r of rayons) {
    planche(t, P, r, L - 2 * P, 6, 'chene', { graine: 510 + r, noeuds: n ? 2 : 4 });
    for (let x = P; x < L - P; x++) { t.poser(x, r, 'chene', 5); t.poser(x, r + 5, 'cheneSombre', 1); }
    for (const cx of [P, L - P - 1, L / 2]) for (let k = 0; k < 7; k++) for (let j = 0; j < 7 - k; j++) {
      const x = cx === L / 2 ? cx - 3 + j : cx < L / 2 ? cx + j : cx - j;
      if (cx === L / 2 && j > 6 - k * 1.2) continue;
      t.poser(x, r + 6 + k, 'chene', j === 0 ? 4 : 2);
    }
    if (n === 0) { clou(t, P + 2, r + 2); clou(t, L - P - 4, r + 2); clou(t, L / 2, r + 2); }
  }
  if (n === 0) {
    // Du bois brut : des échardes, une corde qui ligote les montants
    for (let k = 0; k < 40; k++) t.poser(Math.floor(hachage(k, 1, 505) * L), Math.floor(hachage(k, 2, 505) * H), 'chene', 0);
    for (const x0 of [0, L - P]) for (const y0 of [30, 120]) for (let k = 0; k < 6; k++) for (let x = x0; x < x0 + P; x++) t.poser(x, y0 + k, 'chanvre', 2 + ((x + k) % 2) * 2);
  }
  if (n >= 1) {
    // Des patères sur les montants, pour suspendre un sac ou une lanterne
    for (const x0 of [2, L - 6]) for (const y of [60, 112]) { t.poser(x0 + 1, y, 'laiton', 4); t.poser(x0 + 2, y, 'laiton', 3); t.poser(x0 + 2, y + 1, 'laiton', 1); }
  }
  if (n >= 2) {
    // Des moulures sur les montants et une corniche à denticules
    for (const x of [3, L - 5]) moulure(t, x, 12, 0, H - 24, false);
    for (let x = 4; x < L - 4; x += 4) for (let y = 3; y < 6; y++) { t.poser(x, y, 'chene', 2); t.poser(x + 1, y, 'chene', 4); }
    for (const r of rayons) for (let x = P; x < L - P; x++) t.poser(x, r + 1, 'laiton', n === 3 ? 4 : 3); // le bord des rayons
  }
  if (n === 3) {
    // Les dorures : filets d'or, rosaces sur les montants, coins dorés
    for (let x = 0; x < L; x++) { t.poser(x, 0, 'laiton', 5); t.poser(x, 8, 'laiton', 3); t.poser(x, H - 10, 'laiton', 4); }
    for (const x of [1, L - P + 1]) for (const y of [24, 64, 116, 160]) t.dessin(x + 1, y, ['.o.', 'oOo', '.o.'], { o: ['laiton', 3], O: ['laiton', 5] });
  }
  t.texture(scene, cle);
  return cle;
}

// Le coffre de la fortune : du vieux coffre de bois au coffre-fort doré.
// Vu de trois quarts : le dessus (en perspective), la face avant, le flanc droit dans l'ombre.
function coffreHD(scene, n) {
  if (n >= 4 && typeof textureLuxe === 'function') return textureLuxe(scene, 'coffre');   // (v1.30) le luxe
  const cle = 'coffreHD_' + n;
  if (scene.textures.exists(cle)) return cle;
  const L = 44, H = 36;
  const t = toileLuxe(L, H, Math.min(n, 1));
  const coffreFort = n >= 2;
  const matiere = n === 3 ? 'laiton' : coffreFort ? 'fer' : 'chene';
  if (n === 2) t.rampes.fer = [0x14181e, 0x262c34, 0x3c444e, 0x58626e, 0x7a8692, 0xa8b4c0];
  if (n === 3) t.rampes.laiton = [0x4a2c06, 0x7a520e, 0xb0821c, 0xdcae36, 0xf4d464, 0xfff6c4];
  const avant = { x0: 2, x1: 35, y0: coffreFort ? 9 : 12, y1: H - 1 };    // la face avant
  const flanc = 7;                                                         // la profondeur du flanc
  // Le flanc droit, dans l'ombre
  t.forme(matiere, (x, y) => (x > avant.x1 && x <= avant.x1 + flanc && y >= avant.y0 - (x - avant.x1) * 0.6 && y <= avant.y1 - (x - avant.x1) * 0.6 ? [1, 0, 0.3] : null), { decalage: -1.2 });
  // Le dessus : bombé pour un coffre, plat et biseauté pour un coffre-fort
  t.forme(matiere, (x, y) => {
    if (x < avant.x0 || x > avant.x1 + flanc) return null;
    const recul = Math.max(0, x - avant.x1) * 0.6;
    if (coffreFort) return y >= avant.y0 - 5 - recul && y < avant.y0 - recul + (x > avant.x1 ? 0 : 0) && y < avant.y0 ? [0, -1, 0.6] : null;
    const bombe = Math.sqrt(Math.max(0, 1 - ((x + 0.5 - (avant.x0 + avant.x1 + flanc) / 2) / ((avant.x1 + flanc - avant.x0) / 2 + 1)) ** 2)) * 9;
    return y >= avant.y0 - bombe - recul && y < avant.y0 - recul + 1 && y < avant.y0 + 1 ? [0, -0.7, 0.7] : null;
  }, { decalage: 0.4 });
  // La face avant
  if (matiere === 'chene') {
    for (let k = 0; k < 3; k++) planche(t, avant.x0, avant.y0 + 1 + k * 8, avant.x1 - avant.x0 + 1, 8, 'chene', { graine: 520 + k + n * 7, noeuds: n ? 1 : 2 });
  } else {
    t.forme(matiere, (x, y) => (x >= avant.x0 && x <= avant.x1 && y >= avant.y0 && y <= avant.y1 ? [(x - 18) / 40, (y - 22) / 40, 0.9] : null));
    // Le biseau du cadre de la porte blindée
    for (let x = avant.x0 + 3; x <= avant.x1 - 3; x++) { t.poser(x, avant.y0 + 3, matiere, 1); t.poser(x, avant.y1 - 3, matiere, 5); }
    for (let y = avant.y0 + 3; y <= avant.y1 - 3; y++) { t.poser(avant.x0 + 3, y, matiere, 1); t.poser(avant.x1 - 3, y, matiere, 5); }
  }
  const rivet = (x, y) => { t.poser(x, y, n === 3 ? 'laiton' : 'fer', 5); t.poser(x + 1, y + 1, n === 3 ? 'laiton' : 'fer', 0); };
  if (n <= 1) {
    // Les ferrures : coins, bandes verticales, et la ligne du couvercle
    const ferrure = n === 0 ? 'fer' : 'fer';
    for (let x = avant.x0; x <= avant.x1; x++) { t.poser(x, avant.y0, ferrure, n ? 4 : 2); t.poser(x, avant.y0 + 1, ferrure, 1); }
    for (const bx of n ? [avant.x0 + 4, avant.x1 - 5] : [avant.x0 + 6, avant.x1 - 7]) for (let y = avant.y0 - 7; y <= avant.y1; y++) {
      if (y < avant.y0 - 6 + Math.abs(bx - 18) * 0.05) continue;
      t.poser(bx, y, ferrure, n ? 3 : 2); t.poser(bx + 1, y, ferrure, n ? 2 : 1);
      if (n && (y - avant.y0) % 5 === 0) rivet(bx, y);
    }
    if (n) for (const [x, y] of [[avant.x0, avant.y1 - 3], [avant.x1 - 3, avant.y1 - 3], [avant.x0, avant.y0 + 2], [avant.x1 - 3, avant.y0 + 2]]) for (let k = 0; k < 3; k++) for (let j = 0; j < 3; j++) t.poser(x + k, y + j, 'fer', 3);
    // La serrure : une plaque, un moraillon, un cadenas
    t.forme(n ? 'laiton' : 'fer', (x, y) => (x >= 15 && x <= 21 && y >= avant.y0 - 1 && y <= avant.y0 + 7 ? [(x - 18) / 4, (y - avant.y0 - 3) / 6, 0.8] : null), { decalage: 0.2 });
    t.poser(18, avant.y0 + 3, 'encre', 0); t.poser(18, avant.y0 + 4, 'encre', 0);
    traitHD(t, 'fer', [[16.5, avant.y0 + 9], [16.5, avant.y0 + 7], [19.5, avant.y0 + 7], [19.5, avant.y0 + 9]], 0.7);
    t.forme(n ? 'laiton' : 'fer', (x, y) => (x >= 15 && x <= 21 && y >= avant.y0 + 9 && y <= avant.y0 + 14 ? [(x - 18) / 4, 0.2, 0.8] : null), { decalage: 0.1 });
    // Les poignées sur le flanc
    traitHD(t, 'fer', [[avant.x1 + 2, avant.y0 + 6], [avant.x1 + 5, avant.y0 + 5], [avant.x1 + 5, avant.y0 + 10]], 0.7, -0.5);
  } else {
    // Le coffre-fort : rivets tout autour, une molette graduée et un volant pour ouvrir
    for (let x = avant.x0 + 1; x <= avant.x1 - 1; x += 4) { rivet(x, avant.y0 + 1); rivet(x, avant.y1 - 1); }
    for (let y = avant.y0 + 5; y <= avant.y1 - 4; y += 4) { rivet(avant.x0 + 1, y); rivet(avant.x1 - 1, y); }
    const dore = n === 3 ? 'laiton' : 'laiton';
    t.forme(dore, ellipsoide(14, 23, 5, 5), { decalage: 0.3 });
    t.forme(n === 3 ? 'gemme' : 'fer', ellipsoide(14, 23, 2.4, 2.4), { decalage: -0.2 });
    for (let a = 0; a < 6.28; a += 0.52) t.poser(Math.round(14 + Math.cos(a) * 4.2), Math.round(23 + Math.sin(a) * 4.2), dore, 1);
    // Le volant à trois branches
    for (const a of [0, 2.09, 4.19]) traitHD(t, dore, [[27, 23], [27 + Math.cos(a) * 4.5, 23 + Math.sin(a) * 4.5]], 0.7, 0.3);
    t.forme(dore, ellipsoide(27, 23, 1.6, 1.6), { decalage: 0.5 });
    for (const a of [0, 2.09, 4.19]) t.forme(dore, ellipsoide(27 + Math.cos(a) * 4.5, 23 + Math.sin(a) * 4.5, 1.2, 1.2), { decalage: 0.6 });
    // Les gonds, à gauche
    for (const y of [avant.y0 + 6, avant.y1 - 6]) for (let k = 0; k < 4; k++) t.poser(avant.x0 + 1, y + k, 'fer', k === 0 ? 5 : 2);
    if (n === 3) {
      // Le coffre-fort doré : une tête de lion au-dessus, des gemmes aux coins
      for (const [x, y] of [[6, avant.y0 + 5], [31, avant.y0 + 5], [6, avant.y1 - 5], [31, avant.y1 - 5]]) t.forme('verreRouge', ellipsoide(x, y, 1.4, 1.4), { decalage: 0.5 });
      t.forme('laiton', ellipsoide(20, avant.y0 + 6, 3, 3), { decalage: 0.5 });
      for (const dx of [-1, 1]) t.poser(20 + dx, avant.y0 + 5, 'encre', 0);
    }
  }
  t.contour();
  t.texture(scene, cle);
  return cle;
}

// Le lit : de la paillasse au lit à baldaquin.
function litHD(scene, n) {
  if (n >= 4 && typeof textureLuxe === 'function') return textureLuxe(scene, 'lit');   // (v1.30) le luxe
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
  n = Math.min(3, n);   // (v1.30 : le lit royal garde l'édredon du baldaquin)
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
  n = Math.min(3, n);
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
  n = Math.min(3, n);
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
  if (n >= 4 && typeof textureLuxe === 'function') return textureLuxe(scene, 'luminaire');   // (v1.30) le luxe
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
  const echelle = n >= 4 ? 2 : 3;   // (v1.30 : le grand lustre est plus haut)
  const image = scene.add.image(x, n === 0 ? y + 90 : y, cle).setOrigin(0.5, 0).setScale(echelle).setDepth(profondeur);
  const centre = n === 0 ? y + 90 + 12 * echelle : y + (n === 1 ? 14 : n === 2 ? 18 : n === 3 ? 24 : 55) * echelle;
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

// --- Le chat de gouttière (vu de profil, tourné vers la droite) : quatre images de marche, assis
// (deux images : la queue qui bat), le bond du chasseur ; et la souris qu'il guette, et le banc
// de la rue où il aime s'asseoir. (Il deviendra peut-être ton familier, un jour...)
// (v0.65) Un chat, sous toutes ses poses, avec son pelage, ses yeux et son collier :
// le chat de gouttière (gris tigré, sans collier) et, une fois adopté, le tien.
// Poses : marche (_m0.._m3), assis (_assis0/1, la queue bat), tapi, bond, endormi en boule (_dort0/1).
function cleChat(look) { return `chat_${look.pelage}_${look.yeux}_${look.collier}`; }
function creerChatHD(scene, look = { pelage: 'gris', yeux: 'vert', collier: 'aucun' }, pref = cleChat(look)) {
  if (scene.textures.exists(pref + '_m0')) return pref;
  const P = PELAGES_CHAT[look.pelage] || PELAGES_CHAT.gris, Y = YEUX_CHAT[look.yeux] || YEUX_CHAT.vert, C = COLLIERS_CHAT[look.collier] || COLLIERS_CHAT.aucun;
  const pelage = t => {
    t.rampes.poil = rampe(P.poil); t.rampes.ventre = rampe(P.ventre);
    if (P.taches) t.rampes.tache = rampe(P.taches);
    if (P.masque) t.rampes.masque = rampe(P.masque);
    t.rampes.oeil = rampe(Y.couleur);
    if (C.couleur) t.rampes.collier = rampe(C.couleur);
  };
  const rayures = P.rayures ? (x, y) => ((x + Math.floor(y * 0.6)) % 4 === 0 ? -1 : 0) : (x, y) => (hachage(x, y, 17) > 0.9 ? -0.4 : 0);
  // les taches de l'écaille de tortue : de grandes plaques rousses sur le poil sombre
  const finir = (t, tete) => {
    if (P.taches) for (let y = 0; y < t.h; y++) for (let x = 0; x < t.l; x++) if (t.mat(x, y) === 'poil' && fbm(x * 0.22, y * 0.22, 433) > 0.56) t.poser(x, y, 'tache', t.k[y * t.l + x]);
    // le masque brun du chat crème : la tête, les oreilles, le bout de la queue et des pattes
    if (P.masque) for (let y = t.h - 4; y < t.h; y++) for (let x = 0; x < t.l; x++) if (t.mat(x, y) === 'poil') t.poser(x, y, 'masque', t.k[y * t.l + x]);   // (les chaussettes brunes)
    if (P.masque && tete) for (let y = 0; y < t.h; y++) for (let x = 0; x < t.l; x++) if (t.mat(x, y) === 'poil' && Math.hypot(x + 0.5 - tete[0], y + 0.5 - tete[1]) < 5.2) t.poser(x, y, 'masque', Math.max(0, t.k[y * t.l + x] - (Math.hypot(x + 0.5 - tete[0] - 3, y + 0.5 - tete[1] - 1) < 2.5 ? 0 : 1)));
  };
  // le collier, au cou (sous la tête, côté nuque), et son grelot ou son foulard
  const collier = (t, cx, cy) => {
    if (!C.couleur) return;
    for (let y = Math.round(cy + 2); y <= Math.round(cy + 3); y++) for (let x = Math.round(cx - 4); x <= Math.round(cx); x++) if (['poil', 'ventre', 'tache', 'masque'].includes(t.mat(x, y))) t.poser(x, y, 'collier', y === Math.round(cy + 2) ? 4 : 2);
    if (C.grelot) { t.poser(Math.round(cx - 1), Math.round(cy + 4), 'or', 5); t.poser(Math.round(cx), Math.round(cy + 4), 'or', 3); t.poser(Math.round(cx - 1), Math.round(cy + 5), 'or', 2); }
    if (C.foulard) for (const [dx, dy, k] of [[-2, 4, 4], [-1, 4, 3], [-1, 5, 3], [0, 4, 2], [-1, 6, 2]]) t.poser(Math.round(cx + dx), Math.round(cy + dy), 'collier', k);
  };
  // La tête (de profil) : le crâne, le museau, deux oreilles pointues, l'œil
  const tete = (t, cx, cy) => {
    for (const ox of [-2.2, 1.4]) t.forme('poil', (x, y) => (y >= cy - 7 && y <= cy - 2 && Math.abs(x + 0.5 - (cx + ox)) <= (y - (cy - 7)) * 0.42 + 0.2 ? [0, -0.6, 0.8] : null), { decalage: 0.2 });
    t.forme('poil', ellipsoide(cx, cy, 4.4, 3.8), { motif: rayures });
    t.forme('ventre', ellipsoide(cx + 3, cy + 1.4, 2.2, 1.6), { decalage: 0.2 });
    t.poser(Math.round(cx + 1.6), Math.round(cy - 0.8), 'oeil', 4);
    t.poser(Math.round(cx + 2.6), Math.round(cy - 0.8), 'oeil', 2);
    t.poser(Math.round(cx + 2.1), Math.round(cy - 0.8), 'encre', 0);
    t.poser(Math.round(cx + 5), Math.round(cy + 0.6), 'verreRouge', 3);
  };
  const patte = (t, pts) => traitHD(t, 'poil', pts, 1.25, -0.2);
  const fin = (t, cle, tx, ty) => { collier(t, tx, ty); finir(t, [tx, ty]); t.contour(); t.texture(scene, pref + cle); };
  // Marche : les pattes diagonales avancent ensemble (avant gauche et arrière droite...)
  for (let k = 0; k < 4; k++) {
    const t = toileDecor(40, 26); pelage(t);
    const a = Math.sin(k * Math.PI / 2) * 3, leve = v => (v > 0.5 ? 1.5 : 0);
    const dos = k % 2 ? 0.5 : 0;
    patte(t, [[12, 16], [12 - a, 21], [11 - a, 24.5 - leve(-a)]]);
    patte(t, [[25, 16], [25 + a, 21], [26 + a, 24.5 - leve(a)]]);
    t.forme('poil', ellipsoide(18, 14 + dos, 10.5, 5.2), { motif: rayures });     // le corps
    t.forme('ventre', ellipsoide(19, 17.4 + dos, 7, 1.6), { decalage: 0.3 });
    patte(t, [[14, 17], [14 + a, 21], [13 + a, 24.5 - leve(a)]]);
    patte(t, [[27, 17], [27 - a, 21], [28 - a, 24.5 - leve(-a)]]);
    traitHD(t, 'poil', [[8, 12 + dos], [4, 9], [3, 4 + (k % 2)], [5, 1.5]], 1.3);   // la queue dressée
    tete(t, 31, 9 + dos);
    fin(t, '_m' + k, 31, 9 + dos);
  }
  // Assis, la queue enroulée au sol (deux images : le bout de la queue bat)
  for (let k = 0; k < 2; k++) {
    const t = toileDecor(40, 26); pelage(t);
    traitHD(t, 'poil', k ? [[13, 23.5], [6, 23.5], [3, 21], [2, 17]] : [[13, 23.5], [6, 23.5], [2.5, 22.5], [1, 20.5]], 1.3);
    t.forme('poil', ellipsoide(17, 18.5, 7.5, 6), { motif: rayures });            // l'arrière-train
    t.forme('poil', ellipsoide(22, 13, 4.6, 7));                                  // le poitrail
    t.forme('ventre', ellipsoide(24, 14, 2.4, 5), { decalage: 0.3 });
    patte(t, [[22, 17], [22, 24.5]]); patte(t, [[25, 17], [25.5, 24.5]]);
    tete(t, 24, 6.5);
    fin(t, '_assis' + k, 24, 6.5);
  }
  // Tapi (prêt à bondir), puis le bond, tout en longueur
  {
    const t = toileDecor(40, 26); pelage(t);
    traitHD(t, 'poil', [[8, 18], [3, 20], [1, 22]], 1.3);
    patte(t, [[12, 20], [10, 24.5]]); patte(t, [[25, 20], [28, 24.5]]);
    t.forme('poil', ellipsoide(18, 19.5, 11, 4.2), { motif: rayures });
    tete(t, 31, 17);
    fin(t, '_tapi', 31, 17);
  }
  {
    const t = toileDecor(44, 26); pelage(t);
    patte(t, [[12, 15], [5, 19], [1, 21]]); patte(t, [[30, 13], [37, 15], [41, 16]]);
    t.forme('poil', ellipsoide(21, 13, 13, 4.4), { motif: rayures });
    traitHD(t, 'poil', [[8, 12], [3, 10], [0.5, 11]], 1.3);
    tete(t, 35, 10);
    fin(t, '_bond', 35, 10);
  }
  // Endormi en boule, la queue autour du nez (deux images : il respire)
  for (const [k, gonfle] of [[0, 0], [1, 0.6]]) {
    const t = toileDecor(34, 20); pelage(t);
    t.forme('poil', ellipsoide(18, 12.5 - gonfle * 0.4, 13 + gonfle * 0.3, 7.2 + gonfle), { motif: P.rayures ? (x, y) => ((x + Math.floor(y / 2)) % 5 === 0 ? -1 : 0) : rayures });
    t.forme('poil', ellipsoide(8, 13, 6.4, 5.4), { decalage: 0.2 });
    for (const ox of [4, 9]) t.forme('poil', (x, y) => (y >= 6 && y <= 9 && Math.abs(x + 0.5 - ox) <= (y - 6) * 0.6 + 0.3 ? [0, -0.6, 0.8] : null), { decalage: 0.3 });
    t.forme('ventre', ellipsoide(6, 16, 3.5, 2.2), { decalage: 0.2 });
    for (const x of [4, 5, 9, 10]) t.poser(x, 13, 'encre', 1);   // les yeux fermés
    t.poser(6, 15, 'verreRouge', 4);
    traitHD(t, 'poil', [[30, 17], [24, 19.5], [12, 19.5], [6, 18.5]], 1.6, 0.2);
    t.forme('ventre', ellipsoide(6, 18.5, 2, 1.3), { decalage: 0.4 });
    // (le collier, sous la joue)
    if (C.couleur) { for (const [x, y] of [[11, 16], [12, 16], [12, 15], [13, 15], [11, 17]]) if (t.mat(x, y)) t.poser(x, y, 'collier', 3); if (C.grelot) { t.poser(11, 18, 'or', 5); t.poser(12, 18, 'or', 3); } }
    finir(t, [8, 13]);
    t.contour(); t.texture(scene, pref + '_dort' + k);
  }
  return pref;
}

function creerChatRueHD(scene) {
  if (scene.textures.exists('chatRue_m0')) return;
  creerChatHD(scene, { pelage: 'gris', yeux: 'vert', collier: 'aucun' }, 'chatRue');
  // La souris (deux images : les pattes qui trottinent)
  for (let k = 0; k < 2; k++) {
    const t = toileDecor(16, 8);
    t.rampes.souris = rampe(0x8a7a6a);
    traitHD(t, 'souris', [[5, 5.5], [2, 5], [0.5, 3.5]], 0.6);
    t.forme('souris', ellipsoide(8, 4.6, 4, 2.6));
    t.forme('souris', ellipsoide(12, 4.6, 2.2, 1.8));
    t.forme('souris', ellipsoide(11, 2.2, 1.2, 1.2), { decalage: 0.3 });
    t.poser(13, 4, 'encre', 0); t.poser(14, 5, 'verreRouge', 3);
    for (const x of (k ? [6, 10] : [7, 11])) t.poser(x, 7, 'souris', 1);
    t.contour(); t.texture(scene, 'souris_' + k);
  }
  // Le banc de la rue : une planche épaisse sur deux pieds, un dossier de deux lattes
  {
    const t = toileDecor(48, 22);
    for (const x of [5, 39]) planche(t, x, 11, 4, 11, 'cheneSombre', { horizontale: false, graine: 70 + x });
    for (const x of [6, 40]) planche(t, x, 0, 3, 11, 'cheneSombre', { horizontale: false, graine: 80 + x });
    planche(t, 2, 1, 44, 3, 'chene', { graine: 91 });
    planche(t, 2, 5, 44, 3, 'chene', { graine: 92 });
    planche(t, 0, 10, 48, 4, 'chene', { graine: 93, noeuds: 2 });
    t.contour(); t.texture(scene, 'bancRue');
  }
}

// --- Le coin douillet : un chat qui dort, des herbes qui sèchent, des livres, une plante ---
function creerDouilletHD(scene) {
  if (scene.textures.exists('chatHD')) return;
  // Le chat roux roulé en boule, la queue autour du nez (deux images : il respire)
  for (const [k, gonfle] of [[0, 0], [1, 0.6]]) {
    const t = toileDecor(34, 20);
    t.rampes.roux = rampe(0xd8843a);
    t.rampes.blanc = [0x8a7a6a, 0xb0a090, 0xd0c4b4, 0xe8e0d4, 0xf6f0e8, 0xffffff];
    t.forme('roux', ellipsoide(18, 12.5 - gonfle * 0.4, 13 + gonfle * 0.3, 7.2 + gonfle), { motif: (x, y) => ((x + Math.floor(y / 2)) % 5 === 0 ? -1 : 0) }); // le dos rayé
    t.forme('roux', ellipsoide(8, 13, 6.4, 5.4), { decalage: 0.2 });                              // la tête, posée
    for (const ox of [4, 9]) t.forme('roux', (x, y) => (y >= 6 && y <= 9 && Math.abs(x + 0.5 - ox) <= (y - 6) * 0.6 + 0.3 ? [0, -0.6, 0.8] : null), { decalage: 0.3 });
    t.forme('blanc', ellipsoide(6, 16, 3.5, 2.2), { decalage: 0.2 });                              // le museau blanc
    for (const x of [4, 9]) t.poser(x, 13, 'encre', 1);                                            // les yeux fermés
    t.poser(10, 13, 'encre', 1); t.poser(5, 13, 'encre', 1);
    t.poser(6, 15, 'verreRouge', 4);                                                                // le petit nez rose
    traitHD(t, 'roux', [[30, 17], [24, 19.5], [12, 19.5], [6, 18.5]], 1.6, 0.2);                   // la queue autour
    t.forme('blanc', ellipsoide(6, 18.5, 2, 1.3), { decalage: 0.4 });                              // le bout blanc
    t.contour();
    t.texture(scene, 'chatHD' + (k ? '_2' : ''));
  }
  // Le coussin du chat
  {
    const t = toileDecor(44, 12);
    t.rampes.coussin = rampe(0x8a3a4a);
    t.forme('coussin', ellipsoide(22, 6.5, 21, 5.5), { motif: (x, y) => ((x + y) % 6 === 0 ? -0.7 : 0) });
    for (const x of [2, 41]) t.forme('laiton', ellipsoide(x, 6, 1.5, 1.5), { decalage: 0.4 });
    t.contour(); t.texture(scene, 'coussinHD');
  }
  // Un bouquet d'herbes qui sèche, la tête en bas
  {
    const t = toileDecor(14, 30);
    t.rampes.herbe = rampe(0x6a8a3a); t.rampes.lavande = rampe(0x8a6ab0);
    traitHD(t, 'chanvre', [[7, 0], [7, 6]], 0.7);
    for (let k = 0; k < 7; k++) traitHD(t, k % 3 === 0 ? 'lavande' : 'herbe', [[7, 6], [2 + k * 1.6, 26 + (k % 2) * 3]], 0.8, -0.1);
    for (let y = 6; y < 9; y++) for (let x = 5; x < 10; x++) t.poser(x, y, 'chanvre', 3);
    t.contour(); t.texture(scene, 'herbesHD');
  }
  // Une rangée de vieux livres
  {
    const t = toileDecor(30, 18);
    const couleurs = [0x7a2a2a, 0x2a4a6a, 0x5a6a2a, 0x6a4a2a, 0x4a2a5a];
    let x = 1;
    couleurs.forEach((c, i) => {
      const l = 4 + (i % 2), h = 13 + (i * 7) % 5, nom = 'livre' + i;
      t.rampes[nom] = rampe(c);
      const penche = i === 4 ? 1 : 0;
      t.forme(nom, (xx, y) => (xx >= x + penche * (18 - y) / 6 && xx < x + l + penche * (18 - y) / 6 && y >= 18 - h && y < 18 ? [(xx - x - l / 2) / l, 0, 0.9] : null));
      for (let xx = x; xx < x + l; xx++) { t.poser(xx, 18 - h + 3, 'laiton', 4); t.poser(xx, 16, 'laiton', 3); }
      x += l + 1;
    });
    t.contour(); t.texture(scene, 'livresHD');
  }
  // Une plante en pot
  {
    const t = toileDecor(18, 22);
    t.rampes.feuille = rampe(0x4a8a3a); t.rampes.pot = rampe(0xb0603a);
    t.forme('pot', (x, y) => (y >= 13 && y <= 21 && Math.abs(x + 0.5 - 9) < 5 - (y - 13) * 0.2 ? [(x + 0.5 - 9) / 5, 0, 0.85] : null));
    for (let x = 3; x < 15; x++) t.poser(x, 13, 'pot', 5);
    for (const [a, l] of [[-2.2, 9], [-1.6, 11], [-1.0, 10], [-0.6, 8], [-2.6, 7]]) {
      const fx = 9 + Math.cos(a) * l, fy = 13 + Math.sin(a) * l;
      traitHD(t, 'feuille', [[9, 13], [fx, fy]], 0.6);
      t.forme('feuille', ellipsoide(fx, fy, 2.2, 1.4), { decalage: 0.3 });
    }
    t.contour(); t.texture(scene, 'planteHD');
  }
}

// Le cadre du livre d'images (visite du shop restauré) : un cuir brun repoussé, un filet d'or,
// et de grandes fleurons dorés dans les coins. Le centre est vide (on voit la scène à travers).
function cadreLivreHD(scene) {
  if (scene.textures.exists('cadreLivre')) return 'cadreLivre';
  const L = 480, H = 270, E = 13; // E : l'épaisseur du cuir
  const t = toileDecor(L, H);
  t.rampes.cuir = rampe(0x5a2e1a);
  t.rampes.or = [0x3a2006, 0x6e440c, 0xa8761c, 0xd8aa30, 0xf2d060, 0xfff2b8];
  t.forme('cuir', (x, y) => {
    const d = Math.min(x, y, L - 1 - x, H - 1 - y);
    if (d >= E) return null;
    const u = (d - E / 2) / (E / 2);
    return [x < E ? -u : x > L - 1 - E ? u : 0, y < E ? -u : y > H - 1 - E ? u : 0, 0.8];
  }, { motif: (x, y) => (fbm(x * 0.2, y * 0.2, 970) > 0.6 ? -0.6 : 0) });
  // Le filet d'or, et le liseré de parchemin de la page
  for (let x = 4; x < L - 4; x++) for (const y of [4, H - 5]) t.poser(x, y, 'or', 4);
  for (let y = 4; y < H - 4; y++) for (const x of [4, L - 5]) t.poser(x, y, 'or', 4);
  for (let x = E; x < L - E; x++) for (const y of [E, E + 1, H - E - 1, H - E - 2]) t.poser(x, y, 'parchemin', y === E || y === H - E - 1 ? 5 : 3);
  for (let y = E; y < H - E; y++) for (const x of [E, E + 1, L - E - 1, L - E - 2]) t.poser(x, y, 'parchemin', x === E || x === L - E - 1 ? 5 : 3);
  // Les fleurons des coins : une rosace et deux volutes
  for (const [cx, cy, sx, sy] of [[E + 2, E + 2, 1, 1], [L - E - 3, E + 2, -1, 1], [E + 2, H - E - 3, 1, -1], [L - E - 3, H - E - 3, -1, -1]]) {
    t.forme('or', ellipsoide(cx, cy, 8, 8), { decalage: 0.3 });
    t.forme('verreRouge', ellipsoide(cx, cy, 3, 3), { decalage: 0.5 });
    for (const [dx, dy] of [[1, 0], [0, 1]]) for (let k = 0; k < 26; k++) {
      const a = k / 26 * Math.PI * 1.6;
      const r = 4 + k * 0.5;
      const px = cx + sx * (dx * (10 + k * 1.1) + dy * Math.sin(a) * 4), py = cy + sy * (dy * (10 + k * 1.1) + dx * Math.sin(a) * 4);
      t.poser(Math.round(px), Math.round(py), 'or', 4); t.poser(Math.round(px), Math.round(py) + 1, 'or', 1);
      void r;
    }
  }
  // Le milieu des côtés : un petit fermoir doré
  for (const [cx, cy] of [[L / 2, 6], [L / 2, H - 7], [6, H / 2], [L - 7, H / 2]]) t.forme('or', ellipsoide(cx, cy, 5, 4), { decalage: 0.4 });
  t.contour();
  t.texture(scene, 'cadreLivre');
  return 'cadreLivre';
}

// Le coffre au trésor du prologue (celui que Garrick rapporte) : bois sombre, couvercle bombé,
// coins et bandes dorés, serrure ouvragée avec son trou de clé, rivets, poignées de fer, et des
// pièces et des bijoux qui débordent du couvercle mal fermé.
function coffreTresorHD(scene) {
  if (scene.textures.exists('coffreTresorHD')) return 'coffreTresorHD';
  const L = 44, H = 36;
  const t = toileLuxe(L, H, 2);
  t.rampes.laiton = [0x4a2c06, 0x7a520e, 0xb0821c, 0xdcae36, 0xf4d464, 0xfff6c4];
  const x0 = 3, x1 = 40, yC = 15; // la ligne du couvercle
  // Le trésor qui déborde, derrière le couvercle entrouvert
  for (let k = 0; k < 14; k++) {
    const px = 8 + k * 2.2, py = yC - 6 - Math.sin(k * 0.9) * 2;
    t.forme('laiton', ellipsoide(px, py, 2.2, 1.3), { decalage: 0.4 });
  }
  t.forme('verreRouge', ellipsoide(14, yC - 8, 1.6, 1.6), { decalage: 0.6 });
  t.forme('gemme', ellipsoide(28, yC - 9, 1.6, 1.6), { decalage: 0.6 });
  traitHD(t, 'laiton', [[31, yC - 7], [35, yC - 12], [37, yC - 9]], 0.6, 0.6); // un collier qui pend
  // Le couvercle bombé, en planches, entrouvert (un peu soulevé)
  t.forme('chene', (x, y) => {
    if (x < x0 || x > x1) return null;
    const u = (x + 0.5 - (x0 + x1) / 2) / ((x1 - x0) / 2 + 1);
    const haut = yC - 3 - Math.sqrt(Math.max(0, 1 - u * u)) * 9;
    return y >= haut && y < yC - 2 ? [u * 0.4, -0.7, 0.7] : null;
  }, { motif: (x, y) => (x % 7 === 0 ? -1 : 0) });
  // Le corps en planches
  for (let k = 0; k < 3; k++) planche(t, x0, yC + k * 7, x1 - x0 + 1, 7, 'chene', { graine: 990 + k, noeuds: 1 });
  // Les ferrures dorées : bord du couvercle, bord du coffre, bandes, coins
  for (let x = x0; x <= x1; x++) { t.poser(x, yC - 3, 'laiton', 4); t.poser(x, yC - 2, 'laiton', 2); t.poser(x, yC, 'laiton', 5); t.poser(x, yC + 1, 'laiton', 2); t.poser(x, H - 1, 'laiton', 1); }
  for (const bx of [x0 + 6, x1 - 7]) {
    for (let y = yC - 11; y < H; y++) {
      if (y < yC - 3 && y < yC - 3 - Math.sqrt(Math.max(0, 1 - ((bx + 0.5 - (x0 + x1) / 2) / ((x1 - x0) / 2 + 1)) ** 2)) * 9) continue;
      t.poser(bx, y, 'laiton', 4); t.poser(bx + 1, y, 'laiton', 2);
    }
    for (let y = yC + 3; y < H - 1; y += 4) { t.poser(bx, y, 'laiton', 5); t.poser(bx + 1, y + 1, 'laiton', 0); } // les rivets
  }
  for (const [cx0, cy0, sx, sy] of [[x0, yC, 1, 1], [x1, yC, -1, 1], [x0, H - 1, 1, -1], [x1, H - 1, -1, -1]]) {
    for (let k = 0; k < 4; k++) for (let j = 0; j < 4 - k; j++) t.poser(cx0 + sx * j, cy0 + sy * k, 'laiton', k === 0 || j === 0 ? 5 : 3);
  }
  // La serrure ouvragée : une plaque en écu, un trou de clé, un moraillon
  t.forme('laiton', (x, y) => {
    const dx = x + 0.5 - 21.5, dy = y + 0.5 - (yC + 6);
    return Math.abs(dx) < 5.5 - Math.max(0, dy) * 0.45 && dy > -5 && dy < 7 ? [dx / 6, dy / 8, 0.8] : null;
  }, { decalage: 0.3 });
  for (const [x, y] of [[21, yC + 4], [22, yC + 4], [21, yC + 5], [22, yC + 5], [21, yC + 6], [22, yC + 7], [21, yC + 7]]) t.poser(x, y, 'encre', 0);
  for (const [x, y] of [[17, yC + 2], [26, yC + 2], [21, yC + 10]]) t.poser(x, y, 'laiton', 5);
  traitHD(t, 'laiton', [[19, yC - 4], [19, yC + 1], [24, yC + 1], [24, yC - 4]], 0.6, 0.4); // le moraillon
  // Les poignées de fer sur les côtés
  for (const [x, s] of [[x0 - 1, -1], [x1 + 1, 1]]) traitHD(t, 'fer', [[x, yC + 5], [x + s * 2, yC + 7], [x, yC + 10]], 0.7, 0.2);
  t.contour();
  t.texture(scene, 'coffreTresorHD');
  return 'coffreTresorHD';
}

// --- La fenêtre de la chambre : la lune, le soleil, le cadre et les rideaux ---
function creerFenetreHD(scene) {
  if (scene.textures.exists('luneHD')) return;
  // La pleine lune : mers sombres, cratères, et un léger dégradé vers le bord
  {
    const t = toileDecor(30, 30);
    t.rampes.lune = [0x6a6a78, 0x9a98a4, 0xc8c4c0, 0xe4e0d4, 0xf6f2e4, 0xfffdf4];
    t.forme('lune', ellipsoide(15, 15, 13.5, 13.5), {
      decalage: 0.6,
      motif: (x, y) => (fbm(x * 0.18, y * 0.18, 990) > 0.58 ? -1.1 : 0) + (hachage(x, y, 991) < 0.04 ? -0.6 : 0),
    });
    for (const [x, y, r] of [[10, 9, 2.4], [19, 18, 3], [8, 19, 1.8], [20, 8, 1.5], [14, 23, 1.4]]) {
      t.forme('lune', (xx, yy) => { const d = Math.hypot(xx + 0.5 - x, yy + 0.5 - y); return d < r ? [(xx + 0.5 - x) / -r, (yy + 0.5 - y) / -r, 0.6] : null; }, { decalage: -0.2, bord: false });
    }
    t.texture(scene, 'luneHD');
  }
  // Le soleil : un disque doré, plus clair au centre, cerclé de rayons
  {
    const t = toileDecor(40, 40);
    t.rampes.soleil = [0xd86a10, 0xf0901c, 0xf8b830, 0xffd858, 0xfff090, 0xfffce0];
    for (let k = 0; k < 12; k++) {
      const a = k / 12 * Math.PI * 2, long = k % 2 ? 17 : 19.5;
      t.forme('soleil', (x, y) => {
        const dx = x + 0.5 - 20, dy = y + 0.5 - 20, r = Math.hypot(dx, dy);
        const ang = Math.atan2(dy, dx), da = Math.abs(((ang - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
        return r > 11 && r < long && da < 0.16 * (1 - (r - 11) / (long - 11)) + 0.03 ? [dx / r, dy / r, 0.5] : null;
      }, { decalage: 0.5, bord: false });
    }
    t.forme('soleil', (x, y) => { const d = Math.hypot(x + 0.5 - 20, y + 0.5 - 20); return d < 11 ? [0, 0, 1 - d / 22] : null; }, { decalage: 0.8 });
    t.texture(scene, 'soleilHD');
  }
  // Le cadre de la fenêtre : montants de chêne, croisillon, appui, et reflets sur les vitres
  {
    const L = 116, H = 92, b = 8, f = 3; // b : épaisseur du cadre, f : le croisillon
    const t = toileDecor(L, H);
    t.rampes.vitre = [0xffffff, 0xffffff, 0xffffff, 0xffffff, 0xffffff, 0xffffff];
    for (const [x, y, l, h] of [[0, 0, L, b], [0, H - b - 6, L, b], [0, 0, b, H - 6], [L - b, 0, b, H - 6], [L / 2 - f / 2, 0, f, H - 6], [0, (H - 6) / 2 - f / 2, L, f]]) {
      planche(t, x, y, l, h, 'chene', { horizontale: l > h, graine: 900 + x + y, noeuds: 1 });
    }
    for (let x = 0; x < L; x++) { t.poser(x, 0, 'chene', 5); t.poser(x, b - 1, 'cheneSombre', 1); }
    // L'appui de fenêtre, qui déborde
    planche(t, 0, H - 7, L, 7, 'chene', { graine: 909, noeuds: 2 });
    for (let x = 0; x < L; x++) { t.poser(x, H - 7, 'chene', 5); t.poser(x, H - 1, 'cheneSombre', 0); }
    // Des reflets en diagonale sur chaque carreau (semi-transparents : dessinés à part)
    t.contour();
    t.texture(scene, 'cadreFenetreHD');
  }
  // Un rideau de lin, plissé, retenu par une embrasse
  {
    const L = 22, H = 96;
    const t = toileDecor(L, H);
    t.rampes.rideau = rampe(0x9a3a32);
    t.forme('rideau', (x, y) => {
      const serre = y > 50 && y < 60 ? 0.55 : y >= 60 ? 0.55 + (y - 60) / 36 * 0.45 : 1;
      if (x > L * serre) return null;
      const pli = Math.sin(x * 1.1) * 0.6;
      return [pli, 0, 0.8];
    }, { motif: (x, y) => ((x + 1) % 4 === 0 ? -0.8 : 0) });
    for (let x = 0; x < L * 0.6; x++) for (let y = 53; y < 57; y++) t.poser(x, y, 'laiton', y === 53 ? 5 : 3);
    for (let x = 0; x < L; x++) t.poser(x, 0, 'fer', 3);
    t.contour();
    t.texture(scene, 'rideauHD');
  }
}

// --- L'atelier ---

// La pièce de l'atelier, vue de face (480×90, affichée en ×2) : un mur crépi et son lambris,
// le râtelier des armes et armures à gauche, l'établi et son panneau d'outils au milieu,
// la table d'orfèvre (velours rouge, loupe sur pied) à droite.
function creerAtelierHD(scene) {
  if (scene.textures.exists('atelierHD')) return;
  const L = 480, H = 90;
  const t = toileDecor(L, H);
  t.rampes.velours = rampe(0x8a1a2a);
  // Le mur et le lambris, le plancher
  for (let y = 0; y < 46; y++) for (let x = 0; x < L; x++) t.poser(x, y, 'platre', 3 + Math.round((fbm(x * 0.06, y * 0.08, 301) - 0.5) * 2) - (y < 3 ? 1 : 0));
  for (let x = 0; x < L; x += 12) planche(t, x, 46, 12, 18, 'cheneSombre', { horizontale: false, graine: 310 + x, noeuds: 0 });
  for (let x = 0; x < L; x++) { t.poser(x, 46, 'chene', 4); t.poser(x, 47, 'chene', 2); }
  for (let y = 64; y < H; y += 6) planche(t, 0, y, L, 6, 'chene', { graine: 320 + y, noeuds: 2 });
  // Le râtelier : deux barres sur deux montants, des chevilles
  for (const x of [14, 134]) for (let y = 10; y < 76; y++) { t.poser(x, y, 'cheneSombre', 4); t.poser(x + 1, y, 'cheneSombre', 3); t.poser(x + 2, y, 'cheneSombre', 1); }
  for (const y of [17, 40]) {
    planche(t, 12, y, 126, 3, 'cheneSombre', { graine: 330 + y, noeuds: 0 });
    for (let x = 26; x < 130; x += 24) { t.poser(x, y + 3, 'chene', 4); t.poser(x, y + 4, 'chene', 2); }
  }
  // Le panneau d'outils au-dessus de l'établi : une scie, un marteau, une pince, des limes
  planche(t, 182, 8, 132, 28, 'chene', { graine: 340, noeuds: 1 });
  for (const [x, y] of [[184, 10], [310, 10], [184, 32], [310, 32]]) clou(t, x, y);
  trait(t, 'fer', 192, 14, 224, 22, 2.5); trait(t, 'cheneSombre', 222, 22, 230, 25, 2);           // la scie
  for (let k = 0; k < 14; k++) t.poser(194 + k * 2, 17 + Math.round(k * 0.5) + 2, 'fer', 1);
  trait(t, 'cheneSombre', 244, 12, 244, 32, 1.2); trait(t, 'fer', 239, 13, 249, 13, 2);         // le marteau
  trait(t, 'fer', 262, 12, 268, 30, 1); trait(t, 'fer', 272, 12, 266, 30, 1);                   // la pince
  for (const x of [284, 292, 300]) trait(t, 'fer', x, 12, x, 30, 0.8);                          // les limes
  // L'établi : un épais plateau, des pieds, une étagère basse, un étau
  planche(t, 170, 52, 160, 6, 'chene', { graine: 350, noeuds: 2 });
  for (const x of [176, 320]) for (let y = 58; y < 86; y++) for (let k = 0; k < 5; k++) t.poser(x + k, y, 'cheneSombre', k === 0 ? 4 : k === 4 ? 1 : 2);
  planche(t, 176, 74, 149, 3, 'cheneSombre', { graine: 351, noeuds: 0 });
  for (let y = 44; y < 58; y++) for (let x = 172; x < 182; x++) t.poser(x, y, 'fer', y === 44 ? 4 : x === 172 ? 3 : 2);
  trait(t, 'fer', 168, 47, 186, 47, 0.7);
  // La table d'orfèvre, son plateau de velours, la loupe sur son pied
  planche(t, 352, 56, 112, 4, 'cheneSombre', { graine: 360, noeuds: 0 });
  for (const x of [356, 456]) for (let y = 60; y < 86; y++) for (let k = 0; k < 3; k++) t.poser(x + k, y, 'cheneSombre', k === 0 ? 3 : 1);
  for (let y = 51; y < 56; y++) for (let x = 360; x < 448; x++) t.poser(x, y, 'velours', y === 51 ? 4 : 2 + ((x + y) % 5 === 0 ? 1 : 0));
  for (let y = 66; y < 72; y++) for (let x = 362; x < 452; x++) t.poser(x, y, 'velours', y === 66 ? 3 : 1);
  trait(t, 'laiton', 452, 54, 452, 26, 0.8); trait(t, 'laiton', 452, 26, 440, 20, 0.8);
  t.forme('verre', ellipsoide(436, 20, 6, 6), { decalage: 1 });
  for (let a = 0; a < 6.28; a += 0.1) t.poser(Math.round(436 + Math.cos(a) * 6.5), Math.round(20 + Math.sin(a) * 6.5), 'laiton', 4);
  t.contour();
  t.texture(scene, 'atelierHD');
}

// --- La bourse (v1.62, planche 84 validée : la besace) ---

// Ta besace de cuir tanné, plus ou moins rebondie selon ce que tu possèdes : à plat et rapiécée quand tu
// es fauché, ventrue puis débordante d'or quand tu es riche. Six tailles, aux seuils étalés sur toute la
// partie (avant : cinq tailles, et passé 300 p., vers le 4e jour, elle ne changeait plus).
const PALIERS_BOURSE = [0, 1, 50, 300, 2000, 10000];
const NOMS_BESACE = ['Vide', 'Maigre', 'Ronde', 'Pleine', 'Ventrue', 'Débordante'];
const TAILLES_BESACE = [[11, 4], [6.5, 7.5], [8.5, 9], [10.5, 10.5], [13, 12.5], [15.5, 14]];
function niveauBourse(argent) {
  let n = 0;
  PALIERS_BOURSE.forEach((p, i) => { if (argent >= p) n = i; });
  return argent <= 0 ? 0 : Math.max(1, n);
}
// la toile d'une besace : 60 × 44, le pied au milieu (x = 30), posé en y = 42
const BESACE = { l: 60, h: 44, cx: 30, bas: 42 };
// la hauteur du col au-dessus du pied (en pixels de la toile), pour y faire tomber les pièces
function hauteurColBesace(n) { const [, ry] = TAILLES_BESACE[n]; return n === 0 ? 4 : 2 * ry + 4 + Math.round(n * 0.4); }

function rampesBesace(t) {
  t.rampes.cuirB = [0x2a1208, 0x4e2412, 0x74381c, 0x9a5228, 0xc0743a, 0xe09a58];
  t.rampes.cuirF = rampe(0x4a2612); t.rampes.laniere = rampe(0x3a2010); t.rampes.fil = rampe(0xc8a870); t.rampes.pieceOr = rampe(0xe8b830);
}
// une pièce : à plat, debout, ou sur la tranche (elle tourne en tombant)
function pieceBesace(t, x, y, vue = 'plat') {
  const [rx, ry] = vue === 'plat' ? [2.6, 1.4] : vue === 'debout' ? [1.7, 2.6] : [0.8, 2.6];
  t.forme('pieceOr', ellipsoide(x, y, rx, ry), { decalage: 0.6, ombre: false });
  if (vue !== 'tranche') t.poser(Math.round(x - rx * 0.4), Math.round(y - ry * 0.4), 'pieceOr', 5);
}
// La besace : n (taille), ouverte (le col bâille), ecrase (+1 tassée sous le poids, −1 étirée), penche
// (en radians, autour du pied), pieces (l'or qui dépasse du col)
function dessinerBesace(t, { n = 2, ouverte = 0, ecrase = 0, penche = 0, cx = BESACE.cx, bas = BESACE.bas, pieces = true } = {}) {
  rampesBesace(t);
  const ca = Math.cos(penche), sa = Math.sin(penche);
  const versLocal = (x, y) => { const dx = x + 0.5 - cx, dy = y + 0.5 - bas; return [cx + dx * ca + dy * sa - 0.5, bas - dx * sa + dy * ca - 0.5]; };
  const versEcran = (lx, ly) => { const dx = lx - cx, dy = ly - bas; return [cx + dx * ca - dy * sa, bas + dx * sa + dy * ca]; };
  const forme = (mat, f, o = {}) => t.forme(mat, (x, y) => { const [lx, ly] = versLocal(x, y); const nrm = f(lx, ly); if (!nrm) return null; return [nrm[0] * ca - nrm[1] * sa, nrm[0] * sa + nrm[1] * ca, nrm[2]]; }, o);
  const poserL = (lx, ly, mat, i) => { const [x, y] = versEcran(lx, ly); t.poser(Math.round(x), Math.round(y), mat, i); };
  let [rx, ry] = TAILLES_BESACE[n];
  rx *= 1 + ecrase * 0.12; ry *= 1 - ecrase * 0.12;
  const cy = bas - ry;
  if (n === 0) {
    // fauchée : à plat, le col couché sur le côté, une pièce de lin cousue, la lanière défaite
    forme('cuirB', (x, y) => { const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry; const d = nx * nx + ny * ny; return d <= 1 && y <= bas ? [nx, ny, Math.sqrt(1 - d)] : null; }, { motif: (x, y) => (hachage(x, y, 41) - 0.5) * 0.5 });
    forme('cuirB', (x, y) => (y >= cy - 2 && y <= cy + 2 && x >= cx + 6 && x <= cx + 15 - Math.abs(y - cy) ? [0.3, -0.4, 0.8] : null), { decalage: -0.3 });
    for (let x = Math.round(cx - 4); x <= cx + 1; x++) for (let y = Math.round(cy - 1); y <= cy + 2; y++) poserL(x, y, 'lin', y === Math.round(cy - 1) ? 4 : 2);
    for (const x of [cx - 4, cx - 2, cx, cx + 1]) poserL(x, cy - 2, 'fil', 3);
    for (let k = 0; k < 9; k++) poserL(cx + 14 + k, bas - 1 - Math.round(Math.sin(k * 0.9) * 1.2), 'laniere', 3);
    poserL(cx + 23, bas - 1, 'laiton', 4);
    return;
  }
  // le ventre (en poire : il se resserre vers le col), un peu aplati au sol
  const rxY = y => rx * (1 - 0.16 * Math.max(0, Math.min(1, (cy - y) / ry)));
  forme('cuirB', (x, y) => { const nx = (x + 0.5 - cx) / rxY(y), ny = (y + 0.5 - cy) / ry; const d = nx * nx + ny * ny; return d <= 1 && y <= bas ? [nx, ny, Math.sqrt(1 - d)] : null; },
    { motif: (x, y) => (hachage(Math.floor(x), Math.floor(y), 40 + n) - 0.5) * 0.5 });
  // le cul de la bourse : un cuir plus épais et plus sombre, cousu au point sellier
  const hautCul = cy + ry * 0.42;
  forme('cuirF', (x, y) => { if (y < hautCul + Math.abs(x + 0.5 - cx) * 0.12) return null; const nx = (x + 0.5 - cx) / rxY(y), ny = (y + 0.5 - cy) / ry; const d = nx * nx + ny * ny; return d <= 1 && y <= bas ? [nx, ny, Math.sqrt(1 - d)] : null; }, { decalage: 0.1 });
  for (let x = Math.ceil(cx - rx * 0.85); x <= cx + rx * 0.85; x += 2) poserL(x, Math.round(hautCul + Math.abs(x + 0.5 - cx) * 0.12) - 1, 'fil', 4);
  for (let x = Math.ceil(cx - rx * 0.7); x <= cx + rx * 0.7; x++) poserL(x, bas - 1, 'cuirF', 0);
  // les coutures sellier sur les deux flancs
  for (const cote of [-1, 1]) for (let a = -1.15; a <= 0.95; a += 0.32) { const px = cx + cote * Math.cos(a) * rx * 0.8, py = cy + Math.sin(a) * ry * 0.8; if (py < hautCul - 1) poserL(px, py, 'fil', cote < 0 ? 4 : 2); }
  // le médaillon de laiton du comptoir, repoussé d'une étoile, rivé sur le ventre
  if (n >= 2) {
    const px = cx + rx * 0.1, py = cy - ry * 0.08, r = Math.max(2.3, rx * 0.24);
    forme('laiton', (x, y) => { const d = Math.hypot(x + 0.5 - px, y + 0.5 - py) / r; return d <= 1 ? [(x + 0.5 - px) / r * 0.7, (y + 0.5 - py) / r * 0.7, Math.sqrt(1 - Math.min(1, d * d) * 0.5)] : null; }, { decalage: 0.3 });
    for (const [dx, dy] of [[0, -1], [-1, 0], [0, 0], [1, 0], [0, 1]]) poserL(px + dx, py + dy, 'laiton', dx + dy < 0 ? 1 : 2);
    poserL(px - r * 0.55, py - r * 0.55, 'laiton', 5);
  }
  // le reflet du cuir, et l'usure
  for (const [dx, dy] of [[-0.5, -0.45], [-0.42, -0.5], [-0.55, -0.35]]) poserL(cx + rx * dx, cy + ry * dy, 'cuirB', 5);
  if (n === 1) for (let k = 0; k < 3; k++) poserL(cx - 2 + k * 2, cy + 1 + (k % 2), 'cuirB', 1);   // le cuir qui plisse, mal rempli
  if (n >= 4) for (const s of [-1, 1]) for (let k = 1; k < 4; k++) poserL(cx + s * (2 + k * 1.2), cy - ry + 1 + k * 1.6, 'cuirB', 5);   // le cuir tendu
  // le col froncé, la lanière nouée et ses deux perles de laiton
  const haut = cy - ry, hc = 4 + Math.round(n * 0.4), col = Math.max(2.5, rx * 0.3), colH = ouverte ? col * 1.9 : col * 1.25;
  forme('cuirB', (x, y) => { if (y < haut - hc || y > haut + 1.5) return null; const v = (haut + 1.5 - y) / (hc + 1.5); const w = col + (colH - col) * Math.max(0, v - 0.45) / 0.55; return Math.abs(x + 0.5 - cx) <= w ? [(x + 0.5 - cx) / (w + 1) * 0.7, -0.4, 0.8] : null; }, { decalage: 0.2 });
  for (let k = -2; k <= 2; k++) for (let y = haut - hc + 1; y < haut; y++) if ((k + y) % 2 === 0) poserL(cx + k * colH * 0.4, y, 'cuirB', 5);   // les fronces
  for (let x = Math.ceil(cx - colH); x <= cx + colH; x++) poserL(x, haut - hc, 'cuirB', ouverte ? 3 : 5);
  if (ouverte) {   // la bouche ouverte : le dedans sombre, et l'or qu'on devine
    for (let x = Math.ceil(cx - colH + 1); x <= cx + colH - 1; x++) for (let y = haut - hc; y <= haut - hc + 1; y++) poserL(x, y, 'cuirF', 0);
    if (n >= 2 && pieces) for (let x = Math.ceil(cx - colH + 2); x <= cx + colH - 2; x += 2) poserL(x, haut - hc + 1, 'pieceOr', 4);
  }
  const yl = haut - (ouverte ? 0 : 1);
  for (let x = Math.round(cx - col - 1); x <= cx + col + 1; x++) poserL(x, yl, 'laniere', (x % 2) ? 4 : 2);
  const nd = [cx + col + 1, yl];
  for (let k = 1; k <= 5; k++) { poserL(nd[0] + k * 0.5, nd[1] + k, 'laniere', 3); poserL(nd[0] + k * 0.9 + 1, nd[1] + k * 0.8, 'laniere', 2); }
  poserL(nd[0] + 3, nd[1] + 6, 'laiton', 5); poserL(nd[0] + 5.5, nd[1] + 5, 'laiton', 4);
  // les pièces : une qui dépasse, puis un dôme qui déborde, et celles tombées au pied
  if (pieces && !ouverte && n === 3) pieceBesace(t, ...versEcran(cx + 1, haut - hc - 1.5), 'debout');
  if (pieces && n === 4 && !ouverte) { pieceBesace(t, ...versEcran(cx - 2, haut - hc - 1)); pieceBesace(t, ...versEcran(cx + 2, haut - hc - 2), 'debout'); }
  if (pieces && n === 5) {
    for (const [dx, dy, v] of [[-5, -0.5, 'plat'], [-1.5, -1.5, 'plat'], [2.5, -1, 'plat'], [5.5, -0.5, 'plat'], [-3.5, -3, 'plat'], [1, -3.5, 'plat'], [4, -4, 'debout'], [-1, -5.5, 'plat']]) pieceBesace(t, ...versEcran(cx + dx, haut - hc + dy), v);
    t.rampes.eclat = rampe(0xfff0a0);
    for (const [ex, ey] of [[cx - 5, haut - hc - 7], [cx + 7, haut - hc - 3]]) for (let d = -1; d <= 1; d++) { t.poser(Math.round(ex + d), Math.round(ey), 'eclat', 5); t.poser(Math.round(ex), Math.round(ey + d), 'eclat', 5); }
    for (const [x, v] of [[cx - rx - 3, 'plat'], [cx + rx + 2, 'plat'], [cx + rx + 4.5, 'debout']]) pieceBesace(t, x, bas - (v === 'debout' ? 2 : 1), v);
  }
}

// Les variantes de chaque taille : posée, le col ouvert, tassée sous le poids d'une pièce, étirée (elle
// se gonfle), penchée (elle verse). Les clés : bourseHD<n>, bourseHD<n>_ouverte, ... (bourseHD<n> reste
// l'image posée, comme avant, pour les écrans qui la montrent sans animation).
const VARIANTES_BESACE = { '': {}, _ouverte: { ouverte: 1 }, _tassee: { ouverte: 1, ecrase: 1 }, _etiree: { ecrase: -1 }, _penchee: { ouverte: 1, penche: 0.5 } };
function creerBoursesHD(scene) {
  if (scene.textures.exists('bourseHD5_penchee')) return;
  for (let n = 0; n < TAILLES_BESACE.length; n++) for (const [suffixe, o] of Object.entries(VARIANTES_BESACE)) {
    const cle = 'bourseHD' + n + suffixe;
    if (scene.textures.exists(cle)) scene.textures.remove(cle);   // (l'ancienne bourse, si elle était déjà là)
    const t = toileDecor(BESACE.l, BESACE.h);
    dessinerBesace(t, { n, ...o });
    t.contour();
    t.texture(scene, cle);
  }
  creerPiecesVolHD(scene);
}
// La pièce qui vole, en trois dessins (de face, de trois quarts, sur la tranche) : elle tourne vraiment
function creerPiecesVolHD(scene) {
  if (scene.textures.exists('pieceVol2')) return;
  [[3.4, 3.4], [2, 3.4], [0.9, 3.4]].forEach(([rx, ry], i) => {
    const t = toileDecor(9, 9);
    t.rampes.pieceOr = rampe(0xe8b830);
    t.forme('pieceOr', ellipsoide(4.5, 4.5, rx, ry), { decalage: 0.5, ombre: false });
    if (i < 2) { t.forme('pieceOr', ellipsoide(4.5, 4.5, rx * 0.62, ry * 0.62), { decalage: -0.7, bord: false, ombre: false }); t.poser(Math.round(4.5 - rx * 0.5), 2, 'pieceOr', 5); }
    else t.poser(4, 2, 'pieceOr', 5);
    t.contour();
    t.texture(scene, 'pieceVol' + i);
  });
}

// Un petit widget : la besace et le compte. Renvoie le conteneur, avec `maj(argent)`, `col()` (où tombent
// les pièces), `ouvrirCol()` et `recevoirPiece()` (pour `voleePieces`).
// `sens` : de quel côté elle verse quand on paie (1 : vers la droite, −1 : vers la gauche) ; `gain` : [dx, dy], où
// s'affiche le gain ou la dépense (par défaut au-dessus d'elle).
function bourse(scene, x, y, argent, { echelle = 2, taille = 14, couleur = '#f3d98a', aDroite = false, conteneur = null, sens = 1, gain = null } = {}) {
  creerBoursesHD(scene);
  const c = scene.add.container(x, y);
  const img = scene.add.image(0, 0, 'bourseHD0').setOrigin(0.5, 1).setScale(echelle);
  const texte = (aDroite ? scene.add.text(echelle * 15, -echelle * 11, '', style(taille, couleur, { fontStyle: 'bold', stroke: '#1a100a', strokeThickness: 4 })).setOrigin(0, 0.5)
    : scene.add.text(0, 2, '', style(taille, couleur, { fontStyle: 'bold', stroke: '#1a100a', strokeThickness: 4 })).setOrigin(0.5, 0));
  c.image = img; c.texte = texte;
  c.add([img, texte]);
  c.niveau = -1;
  // les images clés : une suite de [variante, taille, durée]
  const cle = (n, v = '') => 'bourseHD' + n + v;
  const jouer = (etapes) => {
    const id = c.suite = (c.suite || 0) + 1;
    let t = 0;
    for (const [v, n, ms] of etapes) {
      const poser = () => { if (c.suite === id && img.active) img.setTexture(cle(n, v)).setFlipX(v === '_penchee' && sens < 0); };
      if (t === 0) poser(); else scene.time.delayedCall(t, poser);
      t += ms;
    }
    return t;
  };
  c.col = () => ({ x: c.x, y: c.y - hauteurColBesace(Math.max(0, c.niveau)) * echelle });
  // une pièce arrive au-dessus du col : il s'ouvre ; elle tombe dedans : la besace se tasse, puis se rouvre
  c.ouvrirCol = () => { if (c.niveau > 0 && !c.versement) jouer([['_ouverte', c.niveau, 1]]); };
  c.recevoirPiece = () => {
    if (c.niveau <= 0 || c.versement) return;
    jouer([['_tassee', c.niveau, 90], ['_ouverte', c.niveau, 1]]);
    // (sans nouvelle pièce, elle se referme d'elle-même)
    if (c.fermer) c.fermer.remove();
    c.fermer = scene.time.delayedCall(450, () => { c.fermer = null; if (img.active) jouer([['_etiree', c.niveau, 120], ['', c.niveau, 1]]); });
  };
  // On paie : elle penche, et les pièces sautent du col, tombent sur la tranche, rebondissent et roulent
  const verser = (n0, n1, montant) => {
    c.versement = true;
    const hc = hauteurColBesace(Math.max(1, n0)) * echelle;
    const colX = sens * Math.sin(0.5) * hc, colY = -Math.cos(0.5) * hc;
    const total = Math.max(1, Math.min(4, Math.ceil(Math.sqrt(montant) / 3)));
    for (let k = 0; k < total; k++) scene.time.delayedCall(100 + k * 90, () => {
      if (!c.active) return;
      const p = scene.add.image(colX, colY, 'pieceVol1').setScale(echelle * 0.75);
      c.add(p);
      const loin = sens * (12 + k * 5) * echelle, haut = 7 * echelle;
      const vol = { t: 0 }, x0 = colX, y0 = colY;
      let i = 0;
      const tourne = scene.time.addEvent({ delay: 70, loop: true, callback: () => { if (!p.active) return tourne.remove(); i = (i + 1) % 4; p.setTexture('pieceVol' + [0, 1, 2, 1][i]).setFlipX(i === 3); } });
      scene.tweens.add({ targets: vol, t: 1, duration: 260, ease: 'Linear', onUpdate: () => {
        if (!p.active) return;
        p.setPosition(x0 + (loin - x0) * vol.t, y0 + (-echelle - y0) * vol.t * vol.t - Math.sin(vol.t * Math.PI) * haut);
      }, onComplete: () => {
        if (!p.active) return;
        tourne.remove(); p.setTexture('pieceVol2'); Son.jouer('piece');
        // un rebond, puis elle roule à plat et s'efface
        scene.tweens.add({ targets: p, y: -echelle * 4, duration: 110, yoyo: true, ease: 'Quad.easeOut', onComplete: () => {
          if (!p.active) return;
          p.setTexture('pieceVol0').setScale(echelle * 0.75, echelle * 0.4);
          scene.tweens.add({ targets: p, x: p.x + sens * 10 * echelle, alpha: 0, duration: 420, ease: 'Sine.easeOut', onComplete: () => p.destroy() });
        } });
      } });
    });
    const t = jouer([['_penchee', n0, 100 + total * 90 + 200], ['_penchee', n1, 120], ['', n1, 1]]);
    scene.time.delayedCall(t, () => { c.versement = false; });
  };
  c.maj = (a) => {
    a = Math.floor(a);
    // (v1.17) le gain ou la dépense, en direct au-dessus de la bourse
    const vivant = c.dernier !== undefined && a !== c.dernier && c.visible && scene.sys.isActive();
    if (vivant) {
      const d = a - c.dernier, m = c.getWorldTransformMatrix();
      const yHaut = m.ty - echelle * (aDroite ? 30 : 36) - 8;   // (v1.61 : une bourse collée au haut de l'écran affiche son gain dessous)
      const g = gainEnDirect(scene, gain ? m.tx + gain[0] : m.tx + (aDroite ? echelle * 15 + 30 : 0), gain ? m.ty + gain[1] : yHaut < 30 ? m.ty + 26 : yHaut, `${d > 0 ? '+' : '−'}${Math.abs(d)} p.`, d > 0, { taille: 14 });
      if (conteneur) conteneur.add(g);   // (v1.61 : dans l'interface d'un récit, sous sa caméra fixe)
    }
    const avant = c.dernier, n0 = c.niveau;
    c.dernier = a;
    const n = niveauBourse(a);
    texte.setText(`${a} p.`).setColor(a < 0 ? '#f0a8a0' : couleur);
    c.niveau = n;
    if (!vivant || n0 < 0) { if (!c.versement) jouer([['', n, 1]]); return; }
    if (a < avant) verser(n0, n, avant - a);
    else if (c.fermer) { c.fermer.remove(); c.fermer = null; jouer([['_etiree', n, 120], ['', n, 1]]); }   // (les pièces viennent d'y tomber)
    else jouer([['_ouverte', Math.max(1, n0), 80], ['_tassee', Math.max(1, n0), 90], ['_etiree', n, 120], ['', n, 1]]);
  };
  c.maj(argent);
  return c;
}

// --- (v1.62, planche 84 validée) Le carnet de voyage d'un disparu : cuir usé jusqu'au clair aux coins, sangle
// et boucle de laiton, auréole d'eau, sang séché, coin corné, signet et plume de geai ; givré quand la
// Faucheuse l'a laissé. Fermé (debout), ouvert (dans le récit), couché (sur le rebord du comptoir).
function rampesCarnet(t) {
  t.rampes.couv = rampe(0x5a3a22); t.rampes.couvU = rampe(0x8a6440); t.rampes.sangle = rampe(0x3a2414); t.rampes.tache = rampe(0x4a1a12); t.rampes.eauT = rampe(0x7a5a3a);
  t.rampes.givre = [0x8aa8c0, 0xa8c4d8, 0xc4dcea, 0xdceaf4, 0xeef6fa, 0xffffff]; t.rampes.papier = RAMPES_DECOR.parchemin; t.rampes.encreB = rampe(0x5a3a24); t.rampes.signet = rampe(0x8a2a2a); t.rampes.plume = rampe(0x6a8a5a);
}
function dessinerCarnetFerme(t, { x0 = 4, y0 = 2, l = 26, h = 34, givre = false } = {}) {
  rampesCarnet(t);
  // la tranche des pages, à droite, et la couverture de cuir usé
  for (let y = y0 + 2; y < y0 + h - 1; y++) for (let x = x0 + l - 1; x < x0 + l + 2; x++) t.poser(x, y, 'papier', (y % 2 ? 3 : 4) - (x === x0 + l + 1 ? 1 : 0));
  t.forme('couv', (x, y) => (x >= x0 && x < x0 + l && y >= y0 && y < y0 + h ? [(x - x0 - l / 2) / l * 0.6, (y - y0 - h / 2) / h * 0.4, 0.9] : null), { motif: (x, y) => (fbm(x * 0.4, y * 0.4, 83) - 0.5) * 1.4 });
  // les coins et les bords usés jusqu'au cuir clair, un coin corné
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + l; x++) { const bord = Math.min(x - x0, y - y0, x0 + l - 1 - x, y0 + h - 1 - y); if (bord === 0 && hachage(x, y, 85) < 0.55) t.poser(x, y, 'couvU', 3 + (hachage(x, y, 86) < 0.3 ? 1 : 0)); }
  for (let k = 0; k < 4; k++) for (let j = 0; j <= 3 - k; j++) t.poser(x0 + l - 1 - j, y0 + h - 1 - k, 'papier', j === 3 - k ? 2 : 4);
  // le dos : une bande plus sombre, deux nerfs
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + 3; x++) t.poser(x, y, 'couv', x === x0 ? 1 : 2);
  for (const y of [y0 + 6, y0 + h - 7]) for (let x = x0; x < x0 + 3; x++) t.poser(x, y, 'couvU', 4);
  // les taches : une auréole d'eau (le gué), du sang séché, une éclaboussure de boue
  for (let a = 0; a < 6.28; a += 0.15) t.poser(Math.round(x0 + l * 0.62 + Math.cos(a) * 5), Math.round(y0 + h * 0.28 + Math.sin(a) * 4), 'eauT', 4);
  t.forme('tache', (x, y) => { const d = Math.hypot((x + 0.5 - (x0 + l * 0.3)) / 4.5, (y + 0.5 - (y0 + h * 0.7)) / 3.2); return d < 1 - hachage(Math.floor(x), Math.floor(y), 88) * 0.35 ? [0, 0, 1] : null; }, { bord: false, ombre: false, decalage: -0.6 });
  for (const [dx, dy] of [[0.45, 0.82], [0.5, 0.88], [0.38, 0.9]]) t.poser(Math.round(x0 + l * dx), Math.round(y0 + h * dy), 'tache', 2);
  // la sangle de cuir qui fait le tour, et sa boucle de laiton
  const ys = Math.round(y0 + h * 0.5);
  for (let x = x0 - 1; x < x0 + l + 2; x++) for (let y = ys; y < ys + 3; y++) t.poser(x, y, 'sangle', y === ys ? 4 : y === ys + 2 ? 1 : 3);
  const bx = Math.round(x0 + l * 0.7);
  for (let y = ys - 1; y <= ys + 3; y++) { t.poser(bx, y, 'laiton', 4); t.poser(bx + 3, y, 'laiton', 3); }
  for (let x = bx; x <= bx + 3; x++) { t.poser(x, ys - 1, 'laiton', 5); t.poser(x, ys + 3, 'laiton', 2); }
  t.poser(bx + 1, ys + 1, 'laiton', 3);
  for (let k = 1; k <= 4; k++) t.poser(bx + 3 + k, ys + 3 + Math.floor(k / 2), 'sangle', 3);
  // le signet rouge, et une plume de geai glissée dans les pages
  for (let y = y0 + h; y < y0 + h + 5; y++) t.poser(x0 + l - 7, y, 'signet', y === y0 + h + 4 ? 2 : 4);
  for (let k = 0; k < 9; k++) { t.poser(x0 + l + 1 + Math.round(k * 0.5), y0 + 5 - k, 'plume', 3 + (k % 2)); if (k > 2) t.poser(x0 + l + 2 + Math.round(k * 0.5), y0 + 6 - k, 'plume', 2); }
  if (givre) {
    for (let x = x0 - 1; x < x0 + l + 3; x++) for (let j = 0; j < 2 + (hachage(x, 1, 91) > 0.6 ? 1 : 0); j++) t.poser(x, y0 + j, 'givre', 5 - j);
    for (let y = y0; y < y0 + h; y++) if (hachage(1, y, 92) > 0.4) t.poser(x0 - 1 + (hachage(2, y, 93) > 0.5 ? 1 : 0), y, 'givre', 4);
    for (let k = 0; k < 14; k++) { const x = Math.round(x0 + 3 + hachage(k, 3, 94) * (l - 4)), y = Math.round(y0 + 2 + hachage(k, 4, 94) * (h * 0.35)); t.poser(x, y, 'givre', 5); if (k % 3 === 0) { t.poser(x + 1, y, 'givre', 4); t.poser(x, y + 1, 'givre', 3); } }
  }
}
// ouvert, à plat (vu un peu de haut) : deux pages couvertes d'une écriture qui tremble, la sangle défaite
function dessinerCarnetOuvert(t, { x0 = 2, y0 = 12, l = 64, h = 36, tremble = 0.45 } = {}) {
  rampesCarnet(t);
  const m = x0 + l / 2;
  t.forme('couv', (x, y) => (x >= x0 && x < x0 + l && y >= y0 + 1 && y < y0 + h + 1 ? [0, 0.3, 0.9] : null), { decalage: -0.4 });
  // les pages, bombées vers la reliure
  for (let y = y0; y < y0 + h - 1; y++) for (let x = x0 + 2; x < x0 + l - 2; x++) {
    const u = Math.abs(x + 0.5 - m) / (l / 2), creux = u < 0.08, yb = y0 + Math.round((1 - u) * 2);
    if (y < yb) continue;
    const bordP = Math.min(x - x0 - 2, x0 + l - 3 - x, y - y0, y0 + h - 2 - y);
    t.poser(x, y, 'papier', creux ? 1 : u < 0.2 ? 3 : 4 - (bordP < 2 ? 1 : 0) - (y > y0 + h - 4 ? 1 : 0) + (hachage(x, y, 95) > 0.93 ? -1 : 0) - (fbm(x * 0.15, y * 0.15, 61) > 0.68 ? 1 : 0));
  }
  // l'écriture, ligne par ligne : de plus en plus tremblée vers le bas de la page de droite
  for (const [a, b, droite] of [[x0 + 5, m - 3, false], [m + 3, x0 + l - 5, true]]) for (let y = y0 + 6, ligne = 0; y < y0 + h - 4; y += 3, ligne++) {
    let x = a + (hachage(y, a, 96) < 0.3 ? 2 : 0); const fin = droite && ligne >= 6 ? a + (b - a) * 0.35 : b;
    while (x < fin) {
      const mot = 2 + Math.floor(hachage(x, y, 97) * 5);
      for (let k = 0; k < mot && x + k < fin; k++) { const tr = droite ? Math.round((hachage(x + k, y, 98) - 0.5) * 2 * tremble * ligne * 0.5) : 0; t.poser(x + k, y + tr, 'encreB', hachage(x + k, y, 99) < 0.3 ? 3 : 2); }
      x += mot + 1;
    }
  }
  // un croquis de carte sur la page de gauche : une rivière, une croix
  for (let k = 0; k < 10; k++) t.poser(x0 + 8 + k, y0 + h - 9 + Math.round(Math.sin(k * 0.8)), 'encreB', 2);
  for (const [dx, dy] of [[20, -11], [21, -10], [20, -10], [21, -11]]) t.poser(x0 + dx, y0 + h + dy, 'tache', 3);
  // une tache de sang séché qui a bu la page de droite, une auréole d'eau à gauche
  t.forme('tache', (x, y) => { const d = Math.hypot((x + 0.5 - (x0 + l * 0.8)) / 5, (y + 0.5 - (y0 + h * 0.72)) / 3.4); return d < 1 - hachage(Math.floor(x), Math.floor(y), 87) * 0.3 ? [0, 0, 1] : null; }, { bord: false, ombre: false, decalage: -0.2 });
  for (let a = 0; a < 6.28; a += 0.15) t.poser(Math.round(x0 + l * 0.22 + Math.cos(a) * 5), Math.round(y0 + h * 0.3 + Math.sin(a) * 3), 'eauT', 4);
  // la sangle défaite qui pend, le signet, la plume de geai entre les pages
  for (let k = 0; k < 12; k++) for (let j = 0; j < 3; j++) t.poser(x0 + l + j, y0 + 12 + k, 'sangle', j === 0 ? 4 : j === 2 ? 1 : 3);
  for (let y = y0 + 24; y <= y0 + 27; y++) { t.poser(x0 + l - 1, y, 'laiton', 4); t.poser(x0 + l + 3, y, 'laiton', 3); }
  for (let x = x0 + l - 1; x <= x0 + l + 3; x++) { t.poser(x, y0 + 24, 'laiton', 5); t.poser(x, y0 + 27, 'laiton', 2); }
  for (let y = y0 + h; y < y0 + h + 6; y++) t.poser(m + 1, y, 'signet', y === y0 + h + 5 ? 2 : 4);
  for (let k = 0; k < 10; k++) { t.poser(m - 1 + Math.round(k * 0.2), y0 - 1 - k, 'plume', 3 + (k % 2)); if (k > 2) t.poser(m + Math.round(k * 0.2), y0 - k, 'plume', 2); }
}
// couché sur le rebord de la fenêtre, vu d'un peu au-dessus : le plat de la couverture, la tranche des pages devant
function dessinerCarnetCouche(t, { givre = false } = {}) {
  rampesCarnet(t);
  const y0 = 2, hc = 8;
  t.forme('couv', (x, y) => { if (y < y0 || y >= y0 + hc) return null; const r = (y0 + hc - 1 - y) * 0.35; return x >= 2 + r && x <= 31 - r ? [0, -0.8, 0.6] : null; }, { motif: (x, y) => (fbm(x * 0.4, y * 0.5, 83) - 0.5) * 1.2 });
  for (let x = 3; x <= 30; x++) if (hachage(x, 1, 85) < 0.6) t.poser(x, y0, 'couvU', 4);
  for (const x of [2, 3, 30, 31]) t.poser(x, y0 + hc - 1, 'couvU', 3);
  // la tranche des pages, puis le plat du dessous
  for (let y = y0 + hc; y < y0 + hc + 3; y++) for (let x = 2; x <= 31; x++) t.poser(x, y, 'papier', (y - y0 - hc) % 2 ? 3 : 4 - (x > 28 ? 1 : 0));
  for (let x = 2; x <= 31; x++) t.poser(x, y0 + hc + 3, 'couv', 1);
  // l'auréole d'eau et le sang séché sur la couverture
  for (let a = 0; a < 6.28; a += 0.2) t.poser(Math.round(9 + Math.cos(a) * 4), Math.round(y0 + 4 + Math.sin(a) * 2), 'eauT', 4);
  t.forme('tache', (x, y) => (Math.hypot((x + 0.5 - 25) / 3.4, (y + 0.5 - (y0 + 5)) / 1.8) < 1 - hachage(x, y, 88) * 0.3 ? [0, 0, 1] : null), { bord: false, ombre: false, decalage: -0.6 });
  // la sangle qui passe sur la couverture et descend devant les pages, sa boucle de laiton
  for (let y = y0; y < y0 + hc + 4; y++) for (let x = 17; x <= 19; x++) t.poser(x, y, 'sangle', x === 17 ? 4 : x === 19 ? 1 : 3);
  for (let x = 16; x <= 20; x++) { t.poser(x, y0 + hc, 'laiton', 5); t.poser(x, y0 + hc + 3, 'laiton', 2); }
  for (let y = y0 + hc; y <= y0 + hc + 3; y++) { t.poser(16, y, 'laiton', 4); t.poser(20, y, 'laiton', 3); }
  // le signet rouge qui pend devant, la plume de geai qui dépasse
  for (let y = y0 + hc + 3; y < y0 + hc + 7; y++) t.poser(26, y, 'signet', y === y0 + hc + 6 ? 2 : 4);
  for (let k = 0; k < 7; k++) t.poser(31 + Math.round(k * 0.4), y0 + hc + 1 - k, 'plume', 3 + (k % 2));
  if (givre) {
    for (let x = 2; x <= 31; x++) for (let j = 0; j < 1 + (hachage(x, 2, 91) > 0.55 ? 1 : 0); j++) t.poser(x, y0 + j + (x < 4 || x > 29 ? 1 : 0), 'givre', 5 - j);
    for (let k = 0; k < 12; k++) t.poser(Math.round(4 + hachage(k, 3, 94) * 26), Math.round(y0 + 1 + hachage(k, 4, 94) * (hc - 2)), 'givre', 4 + (k % 2));
    for (const x of [2, 31]) for (let y = y0 + hc; y < y0 + hc + 3; y++) t.poser(x, y, 'givre', 4);
  }
}
function creerCarnetsHD(scene) {
  if (scene.textures.exists('carnetCoucheGivreHD')) return;
  const fabriquer = (cle, l, h, dessin) => { const t = toileDecor(l, h); dessin(t); t.contour(); t.texture(scene, cle); };
  fabriquer('carnetFermeHD', 38, 42, t => dessinerCarnetFerme(t));
  fabriquer('carnetGivreHD', 38, 42, t => dessinerCarnetFerme(t, { givre: true }));
  fabriquer('carnetOuvertHD', 72, 58, t => dessinerCarnetOuvert(t));
  fabriquer('carnetCoucheHD', 36, 18, t => dessinerCarnetCouche(t));
  fabriquer('carnetCoucheGivreHD', 36, 18, t => dessinerCarnetCouche(t, { givre: true }));
}

// --- (v0.57) Les souvenirs de la chambre : l'étagère des trophées, le tableau des lettres, le portrait ---
function creerSouvenirsChambreHD(scene) {
  if (scene.textures.exists('etagereTrophees')) return;
  {
    // Une étagère murale sur deux consoles sculptées
    const t = toileDecor(104, 14);
    planche(t, 0, 0, 104, 5, 'chene', { graine: 971 });
    for (let x = 0; x < 104; x++) { t.poser(x, 0, 'chene', 5); t.poser(x, 4, 'chene', 1); }
    for (const x0 of [10, 88]) for (let y = 5; y < 14; y++) for (let x = x0; x < x0 + 6 - Math.floor((y - 5) * 0.5); x++) t.poser(x, y, 'chene', x === x0 ? 4 : 2);
    t.contour();
    t.texture(scene, 'etagereTrophees');
  }
  {
    // Le tableau de liège où l'on épingle les lettres reçues
    const t = toileDecor(52, 40);
    t.rampes.liege = rampe(0xa8784a);
    for (let y = 0; y < 40; y++) for (let x = 0; x < 52; x++) {
      const bord = Math.min(x, y, 51 - x, 39 - y);
      if (bord < 3) t.poser(x, y, 'chene', bord === 0 ? 1 : bord === 1 ? 4 : 3);
      else t.poser(x, y, 'liege', 3 + (hachage(x, y, 972) > 0.7 ? 1 : hachage(x, y, 973) > 0.8 ? -1 : 0));
    }
    t.contour();
    t.texture(scene, 'tableauLettres');
    // une lettre épinglée (trois variantes de papier)
    ['parchemin', 'cire', 'toile'].forEach((mat, v) => {
      const l = toileDecor(12, 14);
      for (let y = 0; y < 14; y++) for (let x = 0; x < 12; x++) l.poser(x, y, mat, (x === 11 || y === 13) ? 2 : 4 - (y > 2 && y < 12 && y % 2 === 0 && x > 1 && x < 10 ? 2 : 0));
      l.poser(5, 1, v === 1 ? 'cuirRouge' : 'fer', 4); l.poser(6, 1, v === 1 ? 'cuirRouge' : 'fer', 2);
      l.contour();
      l.texture(scene, 'lettreEpinglee' + v);
    });
  }
  {
    // Le portrait de famille : un médaillon ovale, deux silhouettes (tes parents ?) devant un ciel
    const t = toileDecor(36, 44);
    t.rampes.ciel = rampe(0x8aa0b8); t.rampes.ombre = rampe(0x3a2e2a);
    for (let y = 0; y < 44; y++) for (let x = 0; x < 36; x++) {
      const d = Math.hypot((x + 0.5 - 18) / 17.5, (y + 0.5 - 22) / 21.5);
      if (d > 1) continue;
      if (d > 0.84) { t.poser(x, y, 'laiton', d > 0.95 ? 1 : (x + y) % 4 === 0 ? 5 : 3); continue; }
      t.poser(x, y, 'ciel', 4 - Math.floor(y / 14));
    }
    t.forme('ombre', ellipsoide(13, 16, 4, 4.5)); t.forme('ombre', ellipsoide(13, 31, 6.5, 9, (x, y) => y > 22));
    t.forme('ombre', ellipsoide(23, 18, 3.6, 4.2)); t.forme('ombre', ellipsoide(23, 32, 6, 9, (x, y) => y > 24));
    t.contour();
    t.texture(scene, 'portraitFamille');
  }
  // Les trophées
  const dessins = {
    croc: d => d.forme('ivoire', (x, y) => { const u = (y - 2) / 12; return u >= 0 && u <= 1 && Math.abs(x + 0.5 - 8 - u * u * 3) < 3.2 * (1 - u) + 0.4 ? [0, -0.5, 0.8] : null; }),
    plume: d => { for (let y = 1; y < 15; y++) { const w = Math.sin((y / 15) * Math.PI) * 3.5; for (let x = Math.round(8 - w); x <= 8 + w; x++) d.poser(x + Math.round((15 - y) * 0.2), y, x === 8 ? 'ivoire' : 'plumeT', x < 8 ? 2 : 4); } },
    ecaille: d => d.forme('ecailleT', (x, y) => { const nx = (x + 0.5 - 8) / 6, ny = (y + 0.5 - 7) / 7; return nx * nx + ny * ny <= 1 && y > 2 - Math.abs(nx) * 3 ? [nx, ny, 0.7] : null; }),
    corne: d => { for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 1.3, r = 6 - i * 0.18; d.forme('ivoire', ellipsoide(8 + Math.cos(a) * r, 9 - Math.sin(a) * r, 2.6 - i * 0.1, 2.6 - i * 0.1), { decalage: -0.1 * (i % 2) }); } },
    crane: d => { d.forme('ivoire', ellipsoide(8, 7, 5.5, 5)); d.forme('ivoire', ellipsoide(8, 12, 3.5, 2.5)); for (const x of [6, 10]) { d.poser(x, 7, 'fer', 0); d.poser(x, 8, 'fer', 0); } },
    masque: d => { d.forme('chene', ellipsoide(8, 8, 5.5, 7)); for (const x of [5, 11]) d.poser(x, 6, 'fer', 0); for (let x = 6; x < 11; x++) d.poser(x, 11, 'cuirRouge', 3); d.poser(8, 1, 'plumeT', 4); d.poser(8, 0, 'plumeT', 3); },
  };
  for (const [id, f] of Object.entries(dessins)) {
    const d = toileObjet(16, 16);
    d.rampes.ivoire = rampe(0xe8dcb4); d.rampes.plumeT = rampe(0x6a5a9a); d.rampes.ecailleT = rampe(0x3a8a6a);
    f(d);
    d.contour();
    d.texture(scene, 'trophee_' + id);
  }
}

// --- (v0.57) Le coin de la forge, encore bâché (il ouvrira à l'étape 10b), et une étagère de pots ---
function creerCoinForgeHD(scene) {
  if (scene.textures.exists('forgeBachee')) return;
  {
    const t = toileDecor(44, 50);
    // le tuyau de la cheminée, qui monte le long du mur
    for (let y = 0; y < 22; y++) for (let x = 18; x < 25; x++) t.poser(x, y, 'fer', x === 18 ? 4 : x === 24 ? 1 : 3 - (y % 8 === 0 ? 1 : 0));
    // la bâche, posée sur la forge et l'enclume : une bosse avec de grands plis, ficelée
    t.rampes.bacheF = rampe(0x7a6c52);
    t.forme('bacheF', (x, y) => {
      const nx = (x + 0.5 - 22) / 21, ny = (y + 0.5 - 50) / 30;
      return y >= 20 && nx * nx + ny * ny <= 1 && y < 49 ? [nx * 0.8, -0.5, Math.sqrt(Math.max(0.1, 1 - nx * nx))] : null;
    }, { decalage: 0.2 });
    // les grands plis qui tombent du sommet
    for (const [x0, pente] of [[14, -0.35], [22, 0], [30, 0.35]]) for (let y = 24; y < 49; y++) {
      const x = Math.round(x0 + (y - 24) * pente);
      if (t.mat(x, y) === 'bacheF') { t.poser(x, y, 'bacheF', 1); if (t.mat(x + 1, y) === 'bacheF') t.poser(x + 1, y, 'bacheF', 4); }
    }
    for (let x = 4; x < 41; x++) { const y = 36 + Math.round(Math.sin(x * 0.3)); if (t.mat(x, y) === 'bacheF') t.poser(x, y, 'chene', 2); }   // la ficelle
    // la corne de l'enclume qui dépasse sous la bâche
    t.forme('fer', (x, y) => (y >= 40 && y <= 44 && x >= 36 && x <= 43 - (y - 40) * 0.6 ? [0.3, -0.7, 0.6] : null), { decalage: 0.3 });
    t.contour();
    t.texture(scene, 'forgeBachee');
  }
  {
    const t = toileDecor(72, 26);
    planche(t, 0, 20, 72, 4, 'chene', { graine: 981 });
    for (let x = 0; x < 72; x++) t.poser(x, 20, 'chene', 5);
    t.rampes.potA = rampe(0x6a8aa0); t.rampes.potB = rampe(0x9a5a3a); t.rampes.potC = rampe(0x5a7a4a);
    [[8, 'potA', 7, 13], [22, 'potB', 6, 16], [36, 'potC', 5, 11], [50, 'potB', 7, 12], [63, 'potA', 4, 9]].forEach(([cx, mat, r, h]) => {
      t.forme(mat, (x, y) => { const nx = (x + 0.5 - cx) / r; return y < 20 && y >= 20 - h && Math.abs(nx) <= 1 - (y < 20 - h + 3 ? 0.35 : 0) ? [nx, -0.2, Math.sqrt(1 - nx * nx * 0.9)] : null; }, { decalage: 0.3 });
      for (let x = cx - r + 2; x <= cx + r - 2; x++) t.poser(x, 20 - h, 'chene', 3);   // le bouchon de liège
    });
    t.contour();
    t.texture(scene, 'etagerePots');
  }
}

// --- (v0.66) La cheminée de la chambre : jambages de pierre, manteau de chêne, hotte, âtre noirci ---
// (+ deux bûches, et trois images de flammes pour quand on l'allume)
function creerChemineeHD(scene) {
  if (scene.textures.exists('chemineeHD')) return;
  {
    const L = 84, H = 96, t = toileDecor(L, H);
    t.rampes.suie = [0x06050a, 0x0e0b10, 0x1a1418, 0x261e20, 0x3a2e2a, 0x4a3a32];
    // la hotte, qui monte en se resserrant jusqu'au plafond
    for (let y = 0; y < 34; y++) for (let x = 16 + Math.round((34 - y) * 0.18); x < L - 16 - Math.round((34 - y) * 0.18); x++) {
      const rang = Math.floor(y / 6), joint = y % 6 === 0 || (x + (rang % 2) * 5) % 10 === 0;
      t.poser(x, y, 'pierre', joint ? 1 : 3 + (hachage(Math.floor(x / 10), rang, 901) > 0.7 ? 1 : 0) - (x > L / 2 + 14 ? 1 : 0));
    }
    // le manteau de chêne, qui déborde
    planche(t, 4, 34, L - 8, 7, 'chene', { graine: 902, noeuds: 2 });
    for (let x = 4; x < L - 4; x++) { t.poser(x, 34, 'chene', 5); t.poser(x, 41, 'chene', 0); }
    // les jambages et le linteau de pierre
    for (let y = 42; y < H; y++) for (let x = 8; x < L - 8; x++) {
      const dansAtre = x >= 20 && x < L - 20 && y >= 52;
      if (dansAtre) continue;
      const rang = Math.floor((y - 42) / 7), joint = (y - 42) % 7 === 0 || (x + (rang % 2) * 6) % 12 === 0;
      t.poser(x, y, 'pierre', joint ? 1 : (x < 12 ? 5 : x > L - 12 ? 2 : 4) - (y > H - 4 ? 1 : 0));
    }
    // l'âtre : le fond noirci de suie, plus clair au milieu (les pierres chauffées)
    for (let y = 52; y < H - 4; y++) for (let x = 20; x < L - 20; x++) {
      const d = Math.hypot((x - L / 2) / 22, (y - (H - 6)) / 40);
      t.poser(x, y, 'suie', Math.max(0, Math.min(5, Math.round(3 - d * 3 + ((x + y) % 7 === 0 ? -1 : 0)))));
    }
    // la pierre de l'âtre, devant
    for (let y = H - 4; y < H; y++) for (let x = 2; x < L - 2; x++) t.poser(x, y, 'pierre', y === H - 4 ? 5 : 2);
    t.contour(); t.texture(scene, 'chemineeHD');
  }
  {
    const t = toileDecor(40, 12);
    t.rampes.buche = rampe(0x6a4426); t.rampes.coeurBois = rampe(0xc8965a);
    for (const [y0, x0, x1] of [[4, 2, 36], [7, 5, 38]]) {
      for (let x = x0; x < x1; x++) for (let y = y0 - 2; y <= y0 + 2; y++) t.poser(x, y, 'buche', 3 + (y === y0 - 2 ? 1 : y === y0 + 2 ? -2 : 0) + ((x * 3 + y) % 7 === 0 ? -1 : 0));
      for (let y = y0 - 2; y <= y0 + 2; y++) for (let x = x1 - 2; x < x1; x++) t.poser(x, y, 'coeurBois', 3);
    }
    t.contour(); t.texture(scene, 'buchesHD');
  }
  for (let k = 0; k < 3; k++) {
    const t = toileDecor(30, 30);
    t.rampes.flamme = [0x7a1800, 0xc03a08, 0xf06a10, 0xffa830, 0xffe090, 0xfffff0];
    for (const [cx, h, lx] of [[9, 18 + k * 2, 5], [15, 26 - k * 3, 7], [21, 16 + ((k + 1) % 3) * 3, 5]]) {
      for (let y = 29 - h; y < 30; y++) {
        const v = (y - (29 - h)) / h, w = lx * Math.sin(Math.min(1, v * 1.3) * Math.PI * 0.5) * (1 - Math.max(0, v - 0.85) * 3);
        const ox = Math.sin(v * 5 + k * 2) * 1.2 * (1 - v);
        for (let x = Math.round(cx + ox - w); x <= Math.round(cx + ox + w); x++) {
          const bord = Math.abs(x - cx - ox) / Math.max(1, w);
          t.poser(x, y, 'flamme', Math.max(0, Math.min(5, Math.round(5 - bord * 3 - (1 - v) * 1.5))));
        }
      }
    }
    t.texture(scene, 'flammeHD_' + k);
  }
}
