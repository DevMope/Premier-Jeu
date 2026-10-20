// (v1.32, planche 57 images 3 et 4 validées) Le menu de l'apparence : des onglets (Visage, Coiffure, Barbe, Couleurs,
// Habits) et une grille de vignettes, puisqu'avec plus de vingt coupes et trente barbes les flèches ◀ ▶ ne suffisent plus.
// Le même menu sert à la création (15 ans), au miroir des 18 ans et chez le barbier.
//   panneauApparence(scene, { x, y, l, h, ap, feminin, stade, barbe, prof, quandChange }) → { detruire }
//   x, y : le centre du parchemin ; ap : l'apparence (modifiée sur place) ; barbe : false pour cacher l'onglet Barbe
const ONGLETS_APPARENCE = [['visage', 'Visage'], ['coiffure', 'Coiffure'], ['barbe', 'Barbe'], ['couleurs', 'Couleurs'], ['habits', 'Habits']];
const VIGNETTES_PAR_PAGE = 15;

// Une vignette : la tête du joueur avec une coupe (ou une barbe) donnée, de face
function textureVignetteApparence(scene, ap, feminin, stade) {
  const cle = `vignAp_${feminin ? 'f' : 'g'}_${stade}_${ap.coiffure}_${ap.cheveux}_${ap.peau}_${stade === 'petit' ? 0 : ap.barbe}_${ap.couleurBarbe || 0}`;
  if (!scene.textures.exists(cle)) dessinerJoueurHD(ap, stade, feminin, 0, [], 'face').texture(scene, cle);
  return cle;
}

function panneauApparence(scene, { x = 705, y = 262, l = 470, h = 400, ap, feminin = false, stade = 'petit', barbe = true, visage = true, prof = 0, quandChange = null, onglet = 'coiffure' } = {}) {
  const fond = scene.add.image(x, y, panneauHD(scene, l, h)).setScale(2).setDepth(prof);
  const x0 = x - l / 2 + 22, x1 = x + l / 2 - 22, haut = y - h / 2;
  const onglets = [], contenu = [], pages = { coiffure: 0, barbe: 0 };
  let actif = onglet, minuteries = [];
  const changer = (cle, v) => { ap[cle] = v; Son.jouer('glisse'); if (quandChange) quandChange(ap); dessiner(); };
  const vider = () => { for (const m of minuteries) m.remove(); minuteries = []; for (const o of contenu) o.destroy(); contenu.length = 0; };
  const texte = (px, py, t, taille = 13, couleur = '#3b2410', o = {}) => { const tx = scene.add.text(px, py, t, style(taille, couleur, { fontStyle: 'bold', ...o })).setDepth(prof + 1); contenu.push(tx); return tx; };
  // une rangée de pastilles de couleur (deux lignes si elle est longue)
  const pastilles = (py, titre, cle, liste, { decal = 0 } = {}) => {
    texte(x0, py, titre, 13).setOrigin(0, 0.5);
    const g = scene.add.graphics().setDepth(prof + 1); contenu.push(g);
    // (une seule rangée : les pastilles rétrécissent un peu quand la liste est longue)
    const pas = Math.min(24, Math.floor((x1 - x0) / liste.length)), r = Math.floor(pas / 2) - 1;
    liste.forEach(([nom, c], i) => {
      const px = x0 + i * pas + pas / 2, yy = py + 22;
      const choisi = (ap[cle] ?? 0) === i + decal;
      g.fillStyle(0x3b2410).fillRect(px - r, yy - r, 2 * r, 2 * r);
      if (c === null) { g.fillStyle(0xe8d8b8).fillRect(px - r + 2, yy - r + 2, 2 * r - 4, 2 * r - 4); g.lineStyle(2, 0x8a6a3a).lineBetween(px - r + 3, yy + r - 3, px + r - 3, yy - r + 3); }
      else g.fillStyle(c).fillRect(px - r + 2, yy - r + 2, 2 * r - 4, 2 * r - 4);
      if (choisi) g.lineStyle(3, 0xf0c020).strokeRect(px - r - 2, yy - r - 2, 2 * r + 4, 2 * r + 4);
      const z = scene.add.zone(px, yy, pas, 2 * r).setInteractive({ useHandCursor: true }).setDepth(prof + 2); contenu.push(z);
      z.on('pointerover', () => { infobulle.setText(nom).setPosition(px, yy - r - 4).setVisible(true); });
      z.on('pointerout', () => infobulle.setVisible(false));
      z.on('pointerdown', () => changer(cle, i + decal));
    });
    return py + 36;
  };
  const infobulle = scene.add.text(0, 0, '', style(11, '#fff4dc', { fontStyle: 'bold', backgroundColor: '#2a1a10dd', padding: { x: 5, y: 2 } })).setOrigin(0.5, 1).setDepth(prof + 5).setVisible(false);
  // la grille de vignettes (coiffures ou barbes)
  const grille = (cle, nb, py) => {
    const page = pages[cle], debut = page * VIGNETTES_PAR_PAGE, nPages = Math.ceil(nb / VIGNETTES_PAR_PAGE);
    const lc = (x1 - x0) / 5, hc = 74;
    for (let i = debut; i < Math.min(nb, debut + VIGNETTES_PAR_PAGE); i++) {
      const j = i - debut, cx = x0 + (j % 5) * lc + lc / 2, cy = py + Math.floor(j / 5) * (hc + 4);
      const choisi = (ap[cle] ?? 0) === i, g = scene.add.graphics().setDepth(prof + 1); contenu.push(g);
      g.fillStyle(choisi ? 0xf0c020 : 0xe8d8b8).fillRoundedRect(cx - lc / 2 + 3, cy, lc - 6, hc, 6);
      if (choisi) g.lineStyle(3, 0x8a3a1a).strokeRoundedRect(cx - lc / 2 + 3, cy, lc - 6, hc, 6);
      const z = scene.add.zone(cx, cy + hc / 2, lc - 6, hc).setInteractive({ useHandCursor: true }).setDepth(prof + 3); contenu.push(z);
      const nom = cle === 'coiffure' ? APPARENCE.coiffure[i] : APPARENCE.barbe[i];
      z.on('pointerover', () => { infobulle.setText(nom).setPosition(cx, cy - 2).setVisible(true); });
      z.on('pointerout', () => infobulle.setVisible(false));
      z.on('pointerdown', () => changer(cle, i));
      // (les vignettes se peignent une à une, pour ne pas figer l'écran)
      minuteries.push(scene.time.delayedCall(20 + j * 25, () => {
        const v = { ...ap, [cle]: i }, st = cle === 'barbe' ? 'adulte' : stade;
        const im = scene.add.image(cx, cy + 3, textureVignetteApparence(scene, v, feminin, st)).setOrigin(0.5, 0).setDepth(prof + 2);
        const H = im.height; im.setCrop(0, 0, im.width, H * 0.36); im.setScale((hc - 6) / (H * 0.36)); contenu.push(im);
      }));
    }
    if (nPages > 1) {
      const py2 = py + 3 * (hc + 4) + 10;
      texte((x0 + x1) / 2, py2, `page ${page + 1} / ${nPages}`, 13).setOrigin(0.5);
      for (const [dx, sens, t] of [[-90, -1, '◀'], [90, 1, '▶']]) {
        const b = texte((x0 + x1) / 2 + dx, py2, t, 18, '#8a3a1a').setOrigin(0.5).setInteractive({ useHandCursor: true });
        b.on('pointerdown', () => { pages[cle] = (page + sens + nPages) % nPages; Son.jouer('page'); dessiner(); });
      }
      return py2 + 16;
    }
    return py + 3 * (hc + 4);
  };
  const dessiner = () => {
    vider(); infobulle.setVisible(false);
    for (const o of onglets) o.destroy(); onglets.length = 0;
    const lo = (x1 - x0) / ONGLETS_APPARENCE.length;
    ONGLETS_APPARENCE.forEach(([id, nom], i) => {
      const ox = x0 + i * lo + lo / 2, sel = id === actif, off = id === 'barbe' && !barbe;
      const g = scene.add.graphics().setDepth(prof + 1); g.fillStyle(sel ? 0x8a3a1a : off ? 0xb8a888 : 0xc8b088).fillRoundedRect(ox - lo / 2 + 2, haut + 16, lo - 4, 28, 6); onglets.push(g);
      const t = scene.add.text(ox, haut + 30, nom, style(13, sel ? '#f8e8c8' : off ? '#8a7a6a' : '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5).setDepth(prof + 2); onglets.push(t);
      if (!off) { const z = scene.add.zone(ox, haut + 30, lo - 4, 28).setInteractive({ useHandCursor: true }).setDepth(prof + 3); onglets.push(z); z.on('pointerdown', () => { actif = id; Son.jouer('page'); dessiner(); }); }
    });
    let py = haut + 62;
    if (actif === 'visage') {
      if (visage) { py = pastilles(py, 'Peau', 'peau', APPARENCE.peau) + 10; py = pastilles(py, 'Yeux', 'yeux', APPARENCE.yeux) + 10; }
      texte(x0, py, 'Bouche', 13).setOrigin(0, 0.5);
      APPARENCE.bouche.forEach((nom, i) => { const bx = x0 + 10 + i * ((x1 - x0) / 4), sel = (ap.bouche ?? 0) === i;
        const t = texte(bx, py + 24, nom, 13, sel ? '#8a3a1a' : '#5a3a1a', { backgroundColor: sel ? '#f0c020' : '#e8d8b8', padding: { x: 6, y: 3 } }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
        t.on('pointerdown', () => changer('bouche', i)); });
      texte((x0 + x1) / 2, py + 64, visage ? '(la peau et les yeux ne changeront plus ensuite)' : '(la peau et les yeux ne changent pas)', 11, '#6b4a2a', { fontStyle: 'italic' }).setOrigin(0.5);
    } else if (actif === 'coiffure') {
      py = grille('coiffure', APPARENCE.coiffure.length, py) + 8;
      pastilles(py, 'Couleur des cheveux', 'cheveux', APPARENCE.cheveux);
    } else if (actif === 'barbe') {
      py = grille('barbe', APPARENCE.barbe.length, py) + 8;
      pastilles(py, 'Couleur de la barbe', 'couleurBarbe', APPARENCE.couleurBarbe);
      if (stade === 'petit') texte((x0 + x1) / 2, haut + h - 18, '(elle poussera à 18 ans)', 11, '#6b4a2a', { fontStyle: 'italic' }).setOrigin(0.5);
    } else if (actif === 'couleurs') {
      py = pastilles(py, 'Cheveux', 'cheveux', APPARENCE.cheveux) + 12;
      if (barbe) pastilles(py, 'Barbe', 'couleurBarbe', APPARENCE.couleurBarbe);
    } else {
      py = pastilles(py, 'Habit du haut', 'haut', APPARENCE.haut) + 10;
      py = pastilles(py, 'Habit du bas', 'bas', APPARENCE.bas) + 10;
      pastilles(py, 'Bottes', 'bottes', APPARENCE.bottes);
    }
  };
  dessiner();
  return {
    rafraichir: dessiner,
    choisirOnglet: id => { actif = id; dessiner(); },
    detruire: () => { vider(); for (const o of onglets) o.destroy(); infobulle.destroy(); fond.destroy(); },
    regler: (opts) => { if ('feminin' in opts) feminin = opts.feminin; if ('barbe' in opts) { barbe = opts.barbe; if (!barbe && actif === 'barbe') actif = 'coiffure'; } dessiner(); },
  };
}
