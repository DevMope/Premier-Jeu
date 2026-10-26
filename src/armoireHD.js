// (planche 85 v2, validée) Les meubles et les étoffes du coucher, dans la chambre (DodoScene, et la promenade du soir) :
//  - l'armoire, contre le mur à droite de la fenêtre : fermée, ses deux battants qui pivotent (quatre images), ouverte
//    (l'étagère des pyjamas pliés, la tringle des habits du jour, les bottes) ;
//  - le paravent : replié contre le mur, à demi ouvert, déplié en zigzag ; les habits jetés par-dessus ;
//  - le tourbillon « comme dans les Sims » : des rubans aux couleurs des deux tenues, des étincelles ;
//  - le lit raccourci à la taille du joueur (le même dessin, sans le grand bout de matelas vide) ;
//  - la couverture refaite : dessinée à partir du corps couché (elle tombe sur la poitrine, les hanches, les genoux et la
//    pointe des pieds, pend sur le côté du lit avec un ourlet souple, finit au pied du lit par un coin arrondi) ; vers la
//    tête, le revers du drap ; le lit ouvert : la couverture rabattue vers le pied, en un gros pli roulé.

// --- Où sont les choses, dans la chambre (en pixels du jeu) ---
const CHAMBRE_PYJ = { armoire: 905, paravent: 846, devantArmoire: 836, bougie: [628, 331] };

// --- Le lit raccourci ---
// (la tête de lit et l'oreiller à gauche, le pied à droite : on retire un morceau du milieu, là où le dessin se répète)
function litChambre(G) {
  const n = typeof niveauAmelioration === 'function' ? niveauAmelioration(G, 'chambre') : 0, petit = stadeJoueur(G) === 'petit';
  const coupe = petit ? 70 : 60, L = 172 - coupe, x0 = 250, x1 = x0 + 2 * L;
  return { n, coupe, L, x0, x1, haut: n === 0 ? 362 : 366, bas: n === 0 ? 383 : 387, pied: x1 - (n === 0 ? 14 : 18), oreiller: [x0 + 52, n === 0 ? 358 : 360] };
}
function litCourtHD(scene, n, coupe) {
  const cle = `litCourt_${n}_${coupe}`;
  if (scene.textures.exists(cle)) return cle;
  const src = scene.textures.get(litHD(scene, n)).getSourceImage(), W = src.width, H = src.height, a = 64;
  const tex = scene.textures.createCanvas(cle, W - coupe, H), ctx = tex.getContext();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(src, 0, 0, a, H, 0, 0, a, H);
  ctx.drawImage(src, a + coupe, 0, W - a - coupe, H, a, 0, W - a - coupe, H);
  tex.refresh();
  return cle;
}

// --- L'armoire ---
// ouverture : 0 fermée, 1 et 2 les battants qui pivotent, 3 ouverte. habits : { haut, bas, bottes } (les couleurs du jour) ;
// pyjamas : les ids des pyjamas pliés sur l'étagère. Toutes les images ont la même taille (les battants ouverts dépassent
// de chaque côté) : ARMOIRE_HD.ox dit où commence la face.
const ARMOIRE_HD = { L: 72, H: 80, ox: 13, face: [14, 49] };
function armoireHD(scene, { n = 0, ouverture = 0, habits = null, pyjamas = [] } = {}) {
  const nb = Math.min(3, Math.max(1, n));   // (au plus simple, du chêne ciré : le bois brut gris jurait avec la chambre)
  const cle = `armoireHD_${nb}_${ouverture}_${habits ? [habits.haut, habits.bas, habits.bottes].join('-') : 'x'}_${pyjamas.join('-')}`;
  if (scene.textures.exists(cle)) return cle;
  const { L, H, ox } = ARMOIRE_HD, t = toileLuxe(L, H, nb);
  const f = { x0: ox + 1, x1: ox + 36, y0: 7, y1: H - 5 }, fl = 7, bas = f.y1 - 4;
  // le flanc droit, dans l'ombre (en perspective, comme le coffre)
  t.forme('chene', (x, y) => (x > f.x1 && x <= f.x1 + fl && y >= f.y0 - (x - f.x1) * 0.6 && y <= f.y1 + 3 - (x - f.x1) * 0.6 ? [1, 0, 0.3] : null), { decalage: -1.2 });
  for (let y = f.y0; y < H; y++) for (let x = f.x1 + 1; x <= f.x1 + fl; x++) if (t.mat(x, y) && (x - f.x1 + y) % 9 === 0) t.poser(x, y, 'chene', 0);
  // la corniche moulurée et le dessus en perspective ; le socle ; les pieds tournés
  for (let y = 0; y < f.y0; y++) for (let x = f.x0 - 2; x <= f.x1 + 2 + Math.max(0, fl - y); x++) { if (y < 3 && x > f.x1 + 6 - y) continue; t.poser(x, y, 'chene', y === 0 ? 5 : y === 1 ? 4 : y === 4 ? 1 : y === 5 ? 4 : 3); }
  if (nb >= 2) for (let x = f.x0 - 1; x <= f.x1 + 1; x++) t.poser(x, 3, 'laiton', nb === 3 ? 4 : 3);
  for (let x = f.x0 - 1; x <= f.x1 + 1; x++) for (let y = f.y1 - 4; y <= f.y1; y++) t.poser(x, y, 'chene', y === f.y1 - 4 ? 5 : y === f.y1 ? 1 : 3);
  for (const px of [f.x0, f.x1 - 3]) for (let y = f.y1 + 1; y < H; y++) for (let x = px; x < px + 4; x++) t.poser(x, y, 'cheneSombre', x === px ? 3 : 1);
  // l'intérieur : le fond dans l'ombre, l'étagère, la tringle, et ce qu'on y range
  if (ouverture > 0) {
    for (let y = f.y0; y < bas; y++) for (let x = f.x0; x <= f.x1; x++) t.poser(x, y, 'cheneSombre', (x === f.x0 || x === f.x1) ? 2 : (x + y) % 11 === 0 ? 0 : 1);
    for (let x = f.x0 + 1; x < f.x1; x++) { t.poser(x, f.y0 + 13, 'chene', 4); t.poser(x, f.y0 + 14, 'chene', 2); t.poser(x, f.y0 + 15, 'cheneSombre', 0); }
    for (let x = f.x0 + 1; x < f.x1; x++) t.poser(x, f.y0 + 19, 'laiton', 3);
    // les pyjamas pliés sur l'étagère, chacun avec son motif
    pyjamas.slice(0, 5).forEach((id, i) => {
      const c = couleursPyjama(id); t.rampes['pj' + i] = rampeVive(c.fond); t.rampes['pr' + i] = rampeVive(c.motif);
      const x0 = f.x0 + 2 + i * 7;
      for (let y = f.y0 + 8; y < f.y0 + 13; y++) for (let x = x0; x < x0 + 6; x++) {
        const raye = c.motifNom === 'raies' ? (x - x0) % 2 : c.motifNom === 'carreaux' ? (x + y) % 3 === 0 : c.motifNom === 'etoiles' ? (x * 3 + y) % 7 === 0 : 0;
        t.poser(x, y, raye ? 'pr' + i : 'pj' + i, y === f.y0 + 8 ? 4 : y === f.y0 + 12 ? 1 : (y === f.y0 + 10 ? 2 : 3));
      }
    });
    if (habits) {
      t.rampes.hab = rampeVive(habits.haut); t.rampes.basA = rampeVive(habits.bas); t.rampes.bot = rampeVive(habits.bottes);
      const cintre = (cx) => { for (let d = -4; d <= 4; d++) t.poser(cx + d, f.y0 + 21 + Math.round(Math.abs(d) * 0.3), 'laiton', 2); t.poser(cx, f.y0 + 20, 'laiton', 4); };
      cintre(f.x0 + 8); cintre(f.x0 + 19); cintre(f.x0 + 29);
      // la tunique (les manches pendent), le tablier, le pantalon plié sur sa barre
      t.forme('hab', (x, y) => { const cx = f.x0 + 8, u = y - f.y0 - 22; return u >= 0 && u < 26 && Math.abs(x + 0.5 - cx) < 5.5 + Math.min(u, 4) * 0.5 - (u > 6 && u < 22 && Math.abs(x + 0.5 - cx) > 4 ? 9 : 0) ? [(x + 0.5 - cx) / 8, 0.1, 0.9] : null; });
      t.forme('lin', (x, y) => { const cx = f.x0 + 19, u = y - f.y0 - 22; return u >= 0 && u < 22 && Math.abs(x + 0.5 - cx) < 3 + Math.min(u, 6) * 0.5 ? [(x + 0.5 - cx) / 7, 0.1, 0.9] : null; });
      t.forme('basA', (x, y) => { const cx = f.x0 + 29, u = y - f.y0 - 22; return u >= 0 && u < 28 && Math.abs(x + 0.5 - cx) < 4.5 && !(u > 8 && Math.abs(x + 0.5 - cx) < 0.8) ? [(x + 0.5 - cx) / 6, 0.1, 0.9] : null; });
      for (const bx of [f.x0 + 20, f.x0 + 27]) t.forme('bot', (x, y) => (y >= f.y1 - 13 && y < bas && x >= bx && x < bx + 4 + (y > f.y1 - 7 ? 3 : 0) ? [0, -0.2, 0.9] : null), { decalage: 0.1 });
    }
  }
  // les deux battants, à panneaux moulurés, qui pivotent sur leurs gonds (ouverture 0 à 3) ; vus de face, puis de biais,
  // puis par leur envers, le bord libre qui vient vers nous (il paraît un peu plus haut)
  const angle = [0, 0.62, 1.25, 2.3][ouverture];
  const cosA = Math.cos(angle), sinA = Math.sin(angle), w = 18;
  for (const [gond, sens] of [[f.x0, 1], [f.x1, -1]]) {
    const proj = Math.max(1, Math.round(Math.abs(w * cosA))), envers = cosA < 0;
    for (let i = 0; i < proj; i++) {
      const u = (i + 0.5) / proj, x = envers ? gond - sens * (1 + i) : gond + sens * i;
      const dh = u * sinA * 2.2;   // (la perspective du bord libre)
      for (let y = Math.round(f.y0 - dh * 0.5); y < Math.round(bas + dh); y++) {
        let ton = ouverture ? (sens > 0 ? 3 : 2) - (envers ? 1 : 0) : 3;
        if (!envers) {
          // les panneaux moulurés, écrasés par la perspective
          const ux = u * w, enHaut = y >= f.y0 + 4 && y <= f.y0 + 28, enBas = y >= f.y0 + 32 && y <= f.y0 + 59;
          if ((enHaut || enBas) && (Math.abs(ux - 3) < 0.6 || Math.abs(ux - (w - 3)) < 0.6)) ton = ux < w / 2 === (sens > 0) ? 0 : 5;
          if ((y === f.y0 + 4 || y === f.y0 + 32) && ux > 3 && ux < w - 3) ton = 0;
          if ((y === f.y0 + 28 || y === f.y0 + 59) && ux > 3 && ux < w - 3) ton = 5;
          if (i === proj - 1 && sens < 0 && !ouverture) ton = 0;   // (le joint entre les deux portes)
        } else if (i === proj - 1) ton = 1;
        if (!envers && !ouverture) t.poser(x, y, 'chene', ton + Math.round((fbm(x * 0.3, y * 0.08, 600 + gond) - 0.5) * 1.6));
        else t.poser(x, y, 'chene', ton + Math.round((fbm(x * 0.5, y * 0.08, 610 + gond) - 0.5) * 1.2));
      }
      // le bouton de laiton, près du bord libre
      if (!envers && i === proj - 2) { t.poser(x, 38, 'laiton', 4); t.poser(x, 39, 'laiton', 2); }
    }
  }
  t.contour();
  t.texture(scene, cle);
  return cle;
}
// Les couleurs des habits du jour (pour la tringle de l'armoire, le tourbillon, les habits jetés)
function couleursHabits(G) {
  const ap = apparenceDuJour(G);
  return { haut: APPARENCE.haut[ap.haut ?? 0][1], bas: APPARENCE.bas[ap.bas ?? 0][1], bottes: APPARENCE.bottes[ap.bottes ?? 0][1] };
}

// --- Le paravent : trois feuilles de bois tendues de toile peinte ---
// pli : 0 replié (les trois feuilles l'une contre l'autre), 1 à demi ouvert, 2 déplié en zigzag. Même taille pour les trois
// images, posées par le coin bas droit (setOrigin(1, 1)).
const PARAVENT_HD = { L: 56, H: 42 };   // (à peine plus haut que son épaule : on voit sa tête dépasser)
function paraventHD(scene, pli = 2) {
  const cle = 'paraventHD_' + pli;
  if (scene.textures.exists(cle)) return cle;
  const { L, H } = PARAVENT_HD, t = toileDecor(L, H);
  t.rampes.toileP = rampeVive(0xb8a070); t.rampes.motifP = rampeVive(0x6a3a4a); t.rampes.feuilleP = rampeVive(0x5a7a3a);
  // la largeur vue de chaque feuille (16 de face), son inclinaison ; le zigzag : au milieu de face, les deux autres de biais
  // (la feuille de droite reste contre l'armoire : le paravent se déplie vers la gauche, le bord droit ne bouge pas)
  const ouv = [0.12, 0.55, 1][pli], larg = 16 * Math.max(0.24, Math.cos((1 - ouv) * 1.32)), cote = 16 * Math.max(0.12, Math.cos(1.32 - ouv * 0.6)) * (pli ? 1 : 0.5);
  const droite = L - 2, feuilles = [[droite - 2 * cote - larg, droite - cote - larg, -1], [droite - cote - larg, droite - cote, 0], [droite - cote, droite, 1]];
  for (const [a0, b0, sens] of feuilles) {
    const a = Math.round(a0), b = Math.round(b0); if (b - a < 1) continue;
    for (let x = a; x < b; x++) {
      const u = (x - a + 0.5) / (b - a), recul = sens ? (sens < 0 ? 1 - u : u) * 2.2 * (pli ? 1 : 0.4) : 0;   // (les feuilles de biais s'éloignent : plus basses)
      for (let y = Math.round(2 + recul); y < Math.round(H - 2 - recul * 0.35); y++) {
        const bord = x === a || x === b - 1 || y < 4 + recul || y > H - 6;
        const ton = bord ? (x === a ? 4 : 2) : (sens < 0 ? 4 : sens > 0 ? 2 : 3) + ((x * 3 + y * 5) % 13 === 0 ? 1 : 0);
        t.poser(x, y, bord ? 'chene' : 'toileP', ton);
      }
      // les fleurs peintes et leurs feuilles, sur la toile
      if (b - a >= 5) for (let i = 0; i < 4; i++) { const fx = Math.round(a + (b - a) * (i % 2 ? 0.7 : 0.3)), fy = Math.round(10 + i * 8 + recul); if (x !== fx) continue; t.poser(fx, fy, 'motifP', 3); t.poser(fx + 1, fy, 'motifP', 4); t.poser(fx, fy + 1, 'motifP', 2); t.poser(fx - 1, fy + 2, 'feuilleP', 3); }
    }
    // les petits pieds de bois
    for (let x = a + 1; x < Math.min(b, a + 3); x++) for (let y = H - 2; y < H; y++) t.poser(x, y, 'cheneSombre', 2);
  }
  t.contour();
  t.texture(scene, cle);
  return cle;
}

// --- Les habits jetés sur le paravent, et ceux qui volent vers l'armoire ---
// quoi : 'haut' (la tunique, une manche qui pend), 'tablier', 'bas' (le pantalon) ; forme : 'drape' (pendu sur l'arête),
// 'roule' (en boule, en l'air), 'plie' (plié, pour voler vers l'étagère)
function habitHD(scene, quoi, couleur, forme = 'drape', motif = null) {
  const cle = `habitHD_${quoi}_${forme}_${couleur.toString(16)}_${motif ? motif.join('-') : ''}`;
  if (scene.textures.exists(cle)) return cle;
  const L = 18, H = forme === 'drape' ? 20 : 10, t = toileDecor(L, H);
  t.rampes.etoffe = rampeVive(couleur); if (motif) t.rampes.motifE = rampeVive(motif[0]);
  const raie = (x, y) => (motif && motif[1] === 'raies' ? x % 3 === 0 : motif && motif[1] === 'carreaux' ? (x % 4 === 0 || y % 4 === 0) : motif && motif[1] === 'etoiles' ? (x * 5 + y * 3) % 11 === 0 : false);
  const mat = (x, y) => (raie(x, y) ? 'motifE' : 'etoffe');
  if (forme === 'drape') {
    // le pli sur l'arête (en haut, au milieu), les deux pans qui tombent, le bas souple
    for (let x = 1; x < L - 1; x++) {
      const pan = Math.round(10 + Math.sin(x * 0.9) * 1.5 + (quoi === 'tablier' ? 2 : 0) - Math.abs(x - L / 2) * 0.25);
      for (let y = 2 + (x < 4 || x > L - 5 ? 1 : 0); y < pan; y++) t.poser(x, y, mat(x, y), y < 4 ? 4 : (x % 5 === 2 ? 2 : 3) - (y > pan - 2 ? 1 : 0));
    }
    for (let x = 4; x < L - 4; x++) t.poser(x, 2, mat(x, 2), 5);
    if (quoi === 'haut') for (let y = 6; y < H; y++) for (let x = L - 5; x < L - 2; x++) t.poser(x, y, mat(x, y), x === L - 5 ? 4 : 2);   // (la manche)
    if (quoi === 'bas') for (let y = 6; y < H - 1; y++) for (let x = 2; x < 5; x++) t.poser(x, y, mat(x, y), x === 2 ? 4 : 2);       // (une jambe du pantalon)
    if (quoi === 'tablier') for (let y = 4; y < 12; y++) { t.poser(L / 2 - 4, y, 'laiton', 2); }                                   // (le cordon)
  } else if (forme === 'roule') {
    t.forme('etoffe', ellipsoide(L / 2, H / 2, 7, 4.2), { motif: (x, y) => (raie(x, y) ? 0.9 : (x + y) % 4 === 0 ? -0.7 : 0) });
    for (let x = 3; x < 6; x++) t.poser(x + 9, 7, mat(x, 7), 2);
  } else {
    for (let y = 2; y < H - 1; y++) for (let x = 2; x < L - 2; x++) t.poser(x, y, mat(x, y), y === 2 ? 5 : y === H - 2 ? 1 : y === 5 ? 2 : 3);
  }
  t.contour();
  t.texture(scene, cle);
  return cle;
}

// --- Le tourbillon : des rubans d'étoffe qui tournent autour du corps, en cône, et des étincelles ---
// Renvoie { maj(force, phase), detruire() } : force 0..1 (au plus fort, on ne voit plus le corps), phase : la rotation
function tourbillonHD(scene, x, sol, haut, couleurs, profondeur = 4.8) {
  creerHalo(scene);
  const devant = scene.add.graphics().setDepth(profondeur), derriere = scene.add.graphics().setDepth(profondeur - 1.95);
  const halo = scene.add.image(x, sol - haut * 0.5, 'halo').setScale(1.4, 2.2).setTint(0xfff0c0).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD).setDepth(profondeur - 0.1);
  const eclats = [];
  for (let i = 0; i < 22; i++) eclats.push(scene.add.image(x, sol, 'eclat').setDepth(profondeur + 0.1).setAlpha(0).setScale(0.4 + ((i * 13) % 7) / 12));
  const maj = (force, phase) => {
    devant.clear(); derriere.clear();
    const n = Math.round(6 + force * 10);
    for (let i = 0; i < n; i++) {
      const u = i / Math.max(1, n - 1), y = sol - 4 - u * haut * (0.8 + force * 0.25), rx = 9 + u * (8 + force * 12) + force * 4, ry = 2.5 + u * 2 + force * 1.5;
      const c = couleurs[i % couleurs.length], a0 = i * 2.35 + phase * (1.4 + u * 0.8), l = 1.1 + ((i * 7) % 5) * 0.45 + force * 0.8, ep = 1.6 + ((i * 3) % 3) * 0.7 + force;
      for (let j = 0; j < 16; j++) {
        const th0 = a0 + (j / 16) * l, th1 = a0 + ((j + 1) / 16) * l, z = Math.sin((th0 + th1) / 2);
        const g = z > 0 ? devant : derriere;
        g.lineStyle(ep, c, (z > 0 ? 0.95 : 0.5) * (0.4 + force * 0.6));
        g.lineBetween(x + Math.cos(th0) * rx, y + Math.sin(th0) * ry - (j / 16) * 5, x + Math.cos(th1) * rx, y + Math.sin(th1) * ry - ((j + 1) / 16) * 5);
      }
    }
    eclats.forEach((e, i) => {
      const a = i * 2.4 + phase * 2.2, r = 10 + (i * 7) % 26 * (0.5 + force * 0.6);
      e.setPosition(x + Math.cos(a) * r, sol - 8 - ((i * 37 + phase * 40) % Math.round(haut + 10))).setAlpha(i < 8 + force * 14 ? 0.5 + force * 0.5 : 0).setAngle(phase * 90 + i * 20);
    });
    halo.setAlpha(Math.max(0, force - 0.5) * 1.1);
  };
  return { maj, detruire: () => { devant.destroy(); derriere.destroy(); halo.destroy(); for (const e of eclats) e.destroy(); } };
}

// --- La couverture refaite ---
// Le profil d'un corps posé (image + toile) : pour chaque colonne de l'écran, le haut du corps
function profilCorps(im, t) {
  const e = im.scaleX, x0 = im.x - im.originX * t.l * e, y0 = im.y - im.originY * t.h * e, haut = {};
  for (let y = 0; y < t.h; y++) for (let x = 0; x < t.l; x++) {
    if (!t.m[y * t.l + x]) continue;
    const X = Math.floor(x0 + x * e), Y = y0 + y * e;
    if (haut[X] === undefined || Y < haut[X]) haut[X] = Y;
  }
  return haut;
}
// lit : litChambre(G) ; profil : le corps dessous ({ x écran: y du haut }) ; xa : où commence la couverture, vers la tête ;
// replie : la largeur du pan rabattu vers le pied (le lit ouvert), 0 sinon ; cle : la texture à repeindre
function couvertureV2(scene, lit, { profil = {}, xa = 330, replie = 0, cle = 'couvV2', graine = 3 } = {}) {
  const n = lit.n, M = lit.haut - 1, x1 = lit.pied + 1, xA = Math.round(xa);
  const W = Math.max(12, x1 - xA + 4), Y0 = 290, H = lit.bas + 8 - Y0;
  const t = toileLuxe(W, H, Math.min(3, n));
  t.rampes.lin = rampe(0xeee6d4);
  t.rampes.chanvre = rampe(0x93714c);   // (la couverture de laine brune de la paillasse : elle ne se confond plus avec la paille)
  // la hauteur que donne le corps : la couverture se tend d'une bosse à l'autre (une tente, puis lissée)
  const E = [];
  for (let i = 0; i < W; i++) {
    const X = xA + i; let e = 0;
    for (const [kx, y] of Object.entries(profil)) { const d = Math.abs(+kx - X); if (+kx < xA + 1) continue; e = Math.max(e, (M - y + 2.5) - d * (d < 6 ? 0.5 : 0.9)); }
    E.push(Math.max(0, e));
  }
  const lisse = (A, r) => A.map((_, i) => { let s0 = 0, c = 0; for (let j = -r; j <= r; j++) { s0 += A[Math.max(0, Math.min(A.length - 1, i + j))]; c++; } return s0 / c; });
  const E2 = lisse(lisse(E, 4), 3);
  const T = E2.map(e => M - 2 - e);
  // vers la tête, le bord s'arrondit sur l'épaule (au lieu d'un bord droit)
  const Wc = replie ? 0 : 10, Ttop = Math.min(...T.slice(0, Wc + 6));
  const gauche = y => { if (!Wc || y >= M) return 0; const u = Math.max(0, Math.min(1, (M - y) / Math.max(1, M - Ttop))); return Wc * (1 - Math.sqrt(1 - u * u)); };
  const ondule = i => Math.sin((i + graine * 7) / 8.5) * 0.8 + Math.sin((i + graine * 3) / 21) * 0.7;
  const B = E2.map((e, i) => lit.bas + 1 + ondule(i) - Math.min(3, e * 0.1));   // l'ourlet, sur le côté du lit
  // les plis : ils partent des flancs des bosses, en biais, et s'effacent vers l'ourlet
  const plis = [];
  for (let i = 4; i < W - 4; i++) { const p = E2[i + 2] - E2[i - 2]; if (Math.abs(p) > 2.2 && (!plis.length || i - plis[plis.length - 1][0] > 7)) plis.push([i, p > 0 ? -1 : 1, Math.min(1, Math.abs(p) / 5)]); }
  for (const f of [0.55, 0.78, 0.93]) plis.push([Math.round(W * f), f > 0.9 ? 1 : -1, 0.55]);
  const pliEn = (i, y) => { let v = 0; const h = y - T[i];
    for (const [pi, dir, force] of plis) { const xp = pi + h * 0.28 * dir, d = i - xp, att = Math.max(0, 1 - h / 22) * force;
      if (Math.abs(d) < 1) v -= 1.3 * att; else if (d * dir > 0 && Math.abs(d) < 2.5) v += 0.8 * att; }
    return v; };
  // les coins arrondis
  const R = 5;
  const dedans = (i, y) => {
    if (i < 0 || i >= W - 4 || y < T[i] || y > B[i]) return false;
    const xl = i, xr = W - 5 - i;
    if (i + 0.5 < gauche(y)) return false;
    if (xl < R && y > B[i] - R) { const dx = R - xl - 0.5, dy = y - (B[i] - R) + 0.5; if (dx * dx + dy * dy > R * R) return false; }
    if (xr < R + 2 && y < T[W - 5] + R + 2) { const r = R + 2, dx = r - xr - 0.5, dy = T[W - 5] + r - y - 0.5; if (dx * dx + dy * dy > r * r) return false; }
    if (xr < R && y > B[i] - R) { const dx = R - xr - 0.5, dy = y - (B[i] - R) + 0.5; if (dx * dx + dy * dy > R * R) return false; }
    return true;
  };
  // le tissu de chaque niveau, qui suit le drapé (u le long du lit, v en descendant depuis le dessus)
  const tissu = (i, y, ton) => {
    const v = y - T[i], u = i + Math.round(v * 0.1) + (xA - lit.x0);   // (le motif reste à sa place sur le lit quand le bord avance)
    if (n === 0) return ['chanvre', ton + (Math.floor((v + 2) / 6) % 2 ? 0 : -1) + Math.round((fbm(u * 0.2, y * 0.2, 575) - 0.5)) + (((u + v * 3) % 19) === 0 ? -1 : 0)];
    if (n === 1) { const cu = Math.floor((u + 3) / 13), cv = Math.floor((v + 2) / 12), mat = ['cuirRouge', 'laiton', 'toile', 'encre'][(((cu + cv * 3) % 4) + 4) % 4];
      let k = ton + Math.round((fbm(u * 0.15, y * 0.15, 570 + cu) - 0.5) * 1.2); if ((u + 3) % 13 === 0 || (v + 2) % 12 === 0) k = Math.min(k, 1); return [mat, k]; }
    const mat = n === 2 ? 'cuirRouge' : 'gemme', a = ((u + v) % 12 + 12) % 12, b = ((u - v) % 12 + 12) % 12;
    if (a === 0 || b === 0) return ['laiton', n >= 3 ? 4 : 2];
    return [mat, ton + (a < 6 ? 1 : 0) - (b < 2 ? 1 : 0) - (n === 2 ? 0 : 1)];
  };
  for (let i = 0; i < W - 4; i++) for (let y = Math.floor(T[i]); y <= Math.ceil(B[i]); y++) {
    if (!dedans(i, y)) continue;
    const v = y - T[i], pente = (T[Math.min(W - 5, i + 2)] - T[Math.max(0, i - 2)]) / 4;
    let ton = 3;
    if (v < 1.5) ton = 4; else if (v < 5) ton += pente < -0.3 ? 1 : pente > 0.3 ? -1 : 0;
    if (y > B[i] - 2) ton -= 1;
    ton += Math.round(pliEn(i, y));
    const [mat, k] = tissu(i, y, ton);
    t.poser(i, y - Y0, mat, Math.max(0, Math.min(5, k)));
  }
  for (let i = 0; i < W - 4; i++) { const yb = Math.round(B[i]); if (dedans(i, yb)) t.poser(i, yb - Y0, t.m[(yb - Y0) * W + i] || 'chanvre', 1); }
  // le revers du drap, vers la tête : un pan de lin replié sur la couverture ; étroit sur le corps, il s'élargit en tombant
  // sur le côté du lit ; son bord roulé est éclairé, la couture court le long du pli, le pli fait une ombre sur la couverture
  if (!replie) {
    const larg = y => 5 + Math.max(0, y - M) * 0.22 + Math.sin((y - Ttop) / 4.5) * 0.6;
    for (let y = 0; y < H; y++) {
      const Y = y + Y0, g = gauche(Y), w = larg(Y);
      for (let i = Math.floor(g); i < g + w + 3 && i < W - 4; i++) {
        if (!dedans(i, Y)) continue; const d = i - g, idx = y * W + i;
        if (d < w) { let ton = Y < T[i] + 1.5 ? 5 : Y > B[i] - 1.5 ? 2 : 4; if (d < 1.2) ton = Math.min(5, ton + 1); if (Math.abs(d - (w - 2)) < 0.5 && (Y % 3) && Y > T[i] + 2) ton = 2; if (d > w - 1) ton = 3; t.poser(i, y, 'lin', ton); }
        else if (d < w + 1) t.poser(i, y, t.m[idx], Math.max(0, t.k[idx] - 2));
        else if (d < w + 2.5) t.poser(i, y, t.m[idx], Math.max(0, t.k[idx] - 1));
      }
    }
  }
  // le lit ouvert : la couverture rabattue vers le pied, en un gros pli roulé (son envers, plus sombre ; le haut du drap
  // en lin qui s'enroule au bord) ; le pli s'aplatit vers le pied du lit et fait son ombre
  if (replie) {
    const F = Math.min(replie, W - 6), hautP = i => T[i] - 2 - 3.2 * Math.sqrt(Math.max(0, 1 - Math.max(0, i - 4) / Math.max(1, F - 4)));
    for (let i = 0; i <= F; i++) for (let y = Math.floor(hautP(i)); y <= Math.ceil(B[i]) - 1; y++) {
      const r = 7, dx = r - i - 0.5, dyH = hautP(0) + r - y, dyB = y - (B[i] - 1 - r);
      if (i < r && ((dyH > 0 && dx * dx + dyH * dyH > r * r) || (dyB > 0 && dx * dx + dyB * dyB > r * r))) continue;
      const v = y - hautP(i), bord = i < 4 + Math.max(0, y - M) * 0.15;
      let ton = v < 1.5 ? 4 : 3; if (y > B[i] - 2.5) ton -= 1; if (i > F - 3) ton -= 1;
      if (bord) t.poser(i, y - Y0, 'lin', i < 1.5 ? 5 : v < 1.5 ? 5 : 4);
      else { const [mat, k] = tissu(i, y, ton - 1); t.poser(i, y - Y0, mat, Math.max(0, Math.min(5, k))); }
    }
    for (let y = 0; y < H; y++) for (const [d, o] of [[F + 1, 2], [F + 2, 1], [F + 3, 1]]) { const idx = y * W + d; if (t.m[idx] && y + Y0 > T[d] + 1) t.poser(d, y, t.m[idx], Math.max(0, t.k[idx] - o)); }
  }
  t.contour();
  if (scene.textures.exists(cle)) { const tx = scene.textures.get(cle); if (tx.getSourceImage().width !== W || tx.getSourceImage().height !== H) scene.textures.remove(cle); }
  t.texture(scene, cle);
  return { cle, x: xA, y: Y0 };
}
// Le drap, sur le matelas, là où la couverture ne le couvre pas (le lit ouvert)
function drapHD(scene, lit) {
  const cle = `drapHD_${lit.n}_${lit.x1}`;
  if (scene.textures.exists(cle)) return cle;
  const W = lit.pied - lit.x0 - 22, t = toileDecor(W, 6);
  t.rampes.lin = rampe(0xeee6d4);
  for (let x = 0; x < W; x++) for (let y = 0; y < 6; y++) t.poser(x, y, 'lin', y === 0 ? 5 : y === 5 ? 2 : (x % 17 === 0 ? 3 : 4));
  t.texture(scene, cle);
  return cle;
}
