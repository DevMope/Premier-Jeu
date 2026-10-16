// (v0.93, planche 18) L'enseigne du comptoir, qui s'améliore avec la maison entière (niveauFacade) :
// la planche brute de la chaumière, le panneau encadré de la maison, le panneau peint de la belle
// maison, l'enseigne de maître de la demeure. Le joueur choisit l'écriture (5 polices) et la
// couleur du fond, au bureau.

const ENSEIGNE = {
  // [famille, graisse, nom affiché]
  polices: [['Alegreya', 'bold', 'Alegreya'], ['MedievalSharp', 'normal', 'MedievalSharp'], ['Uncial Antiqua', 'normal', 'Uncial Antiqua'],
    ['Pirata One', 'normal', 'Pirata One'], ['IM Fell English SC', 'normal', 'IM Fell English']],
  // le fond : « naturel » garde le bois ou la peinture du niveau ; les autres repeignent le panneau
  couleurs: [
    { cle: 'naturel', nom: 'Naturel', c: null },
    { cle: 'vert', nom: 'Vert forêt', c: [0x1e4a32, 0x2a5e40] },
    { cle: 'bordeaux', nom: 'Bordeaux', c: [0x6a1424, 0x8a1e30] },
    { cle: 'bleu', nom: 'Bleu nuit', c: [0x1a2a5a, 0x26407e] },
    { cle: 'noir', nom: 'Noir de fumée', c: [0x1c1816, 0x2c2622] },
    { cle: 'creme', nom: 'Crème', c: [0xe2d0a4, 0xf2e4c0] },
    { cle: 'ocre', nom: 'Ocre', c: [0xb07a24, 0xcc983a] },
  ],
  tailles: [[80, 24], [86, 26], [92, 28], [98, 32]],
};

function reglagesEnseigne(G) {
  const e = (G && G.enseigne) || {};
  return { police: Phaser.Math.Clamp(e.police || 0, 0, ENSEIGNE.polices.length - 1), couleur: ENSEIGNE.couleurs.some(c => c.cle === e.couleur) ? e.couleur : 'naturel' };
}

// La planche d'un niveau, dans une couleur de fond
function texEnseigne(scene, n, couleur = 'naturel') {
  const cle = `enseigneNiv${n}_${couleur}`;
  if (scene.textures.exists(cle)) return cle;
  const [W, H] = ENSEIGNE.tailles[n], oy = n === 3 ? 8 : 0;
  const peinture = (ENSEIGNE.couleurs.find(c => c.cle === couleur) || {}).c;
  const t = scene.textures.createCanvas(cle, W, H + oy), g = t.getContext();
  const hex = c => '#' + c.toString(16).padStart(6, '0');
  const px = (x, y, c) => { g.fillStyle = hex(c); g.fillRect(x | 0, y | 0, 1, 1); };
  const bruit = (x, y, s = 1) => { const v = Math.sin(x * 12.9898 * s + y * 78.233) * 43758.5453; return v - Math.floor(v); };
  const mix = (a, b, k) => { const r = (a >> 16) + (((b >> 16) - (a >> 16)) * k), gg = ((a >> 8) & 255) + ((((b >> 8) & 255) - ((a >> 8) & 255)) * k), bb = (a & 255) + (((b & 255) - (a & 255)) * k); return (Math.round(r) << 16) | (Math.round(gg) << 8) | Math.round(bb); };
  const fond = (x, y, a, b, k) => peinture ? mix(peinture[0], peinture[1], k) : mix(a, b, k);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const b = Math.min(x, y, W - 1 - x, H - 1 - y);
    let c;
    if (n === 0) {
      // la planche brute : deux planches de pin mal équarries, des nœuds, un bord irrégulier
      if ((x < 2 || x > W - 3) && bruit(x, y, 3) > 0.6) continue;
      if ((y === 0 || y === H - 1) && bruit(x, 7, 2) > 0.75) continue;
      const planche = y < H / 2 ? 0 : 1, fibre = Math.sin(x * 0.35 + y * 1.7 + planche * 3) * 0.5 + bruit(x, y) * 0.5;
      c = fond(x, y, 0x8a6438, 0xb08654, fibre);
      if (y === Math.floor(H / 2)) c = 0x4a321a;
      if (b === 0) c = 0x3a2614;
      if (Math.hypot(x - 14, y - 6) < 2 || Math.hypot(x - 62, y - 17) < 1.6) c = peinture ? mix(peinture[0], 0x000000, 0.4) : 0x5a3a1e;
    } else if (n === 1) {
      // le panneau encadré : du chêne clair dans un cadre de noyer, quatre clous
      c = b < 3 ? (b === 0 ? 0x24160a : b === 1 ? 0x5a3a1e : 0x3e2812) : fond(x, y, 0xd8b880, 0xe8cc98, bruit(x, y) * 0.6 + Math.sin(x * 0.2) * 0.2);
      if (b >= 3 && !peinture && (x + y * 3) % 23 === 0) c = 0xc8a46a;
      if ((x === 5 || x === W - 6) && (y === 5 || y === H - 6)) c = 0x8a8a96;
    } else if (n === 2) {
      // le panneau peint : un cadre de laiton à rivets, une vigne peinte aux bords
      c = b === 0 ? 0x2a1a08 : b < 3 ? (b === 1 ? 0xe0b040 : 0xa87a20) : b === 3 ? 0x0e2a1a : fond(x, y, 0x1e4a32, 0x2a5e40, bruit(x, y) * 0.5 + y / H * 0.3);
      if (b < 3 && b > 0 && (x % 10 === 5) && (y === 1 || y === H - 2)) c = 0xfff0a0;
      const vigne = (x > 4 && x < 12) || (x > W - 13 && x < W - 5);
      if (b > 3 && vigne && Math.abs(Math.sin(y * 0.6 + x) * 3 - (x % 7 - 3)) < 0.8) c = 0x8ac060;
      if (b > 3 && vigne && bruit(x, y, 5) > 0.93) c = 0xd04a4a;
    } else {
      // l'enseigne de maître : double cadre doré, cartouche en arc au-dessus
      c = b === 0 ? 0x2a1006 : b === 1 ? 0xf0c850 : b === 2 ? 0xb8862a : b === 3 ? 0x2a0a10 : b === 4 ? 0xe0b040 : fond(x, y, 0x6a1424, 0x8a1e30, bruit(x, y) * 0.5 + (1 - y / H) * 0.3);
      if (b === 4 && (x + y) % 2 === 0) c = 0xc89a30;
    }
    px(x, y + oy, c);
  }
  if (n === 3) {
    // le cartouche en arc, avec une étoile d'or
    const cx = W / 2, interieur = peinture ? peinture[0] : 0x6a1424;
    for (let y = 0; y < 10; y++) for (let x = cx - 16; x < cx + 16; x++) {
      const d = Math.hypot((x - cx) / 16, (y - 10) / 10);
      if (d > 1) continue;
      px(x, y, d > 0.86 ? 0x2a1006 : d > 0.72 ? 0xf0c850 : interieur);
    }
    for (const [dx, dy] of [[0, -2], [0, -1], [0, 0], [0, 1], [0, 2], [-1, 0], [-2, 0], [1, 0], [2, 0], [-1, -1], [1, -1], [-1, 1], [1, 1]]) px(cx + dx, 5 + dy, 0xfff0a0);
  }
  t.refresh();
  return cle;
}

// Ce qui tient l'enseigne : une corde, des chaînes, des chaînes de laiton, des anneaux dorés
function attacheEnseigne(scene, n, w) {
  const g = scene.add.graphics();
  if (n === 0) { g.lineStyle(3, 0x8a6a3a).lineBetween(-w / 2 + 10, 0, -w / 2 + 10, 24).lineBetween(w / 2 - 10, 0, w / 2 - 10, 24); g.fillStyle(0x6a4a24); for (let y = 2; y < 24; y += 5) { g.fillRect(-w / 2 + 9, y, 3, 2); g.fillRect(w / 2 - 11, y, 3, 2); } }
  if (n === 1) g.lineStyle(2, 0x2a2a30).lineBetween(-w / 2 + 10, 0, -w / 2 + 10, 24).lineBetween(w / 2 - 10, 0, w / 2 - 10, 24);
  if (n === 2) { g.lineStyle(3, 0xc89a30).lineBetween(-w / 2 + 12, 0, -w / 2 + 12, 24).lineBetween(w / 2 - 12, 0, w / 2 - 12, 24); g.fillStyle(0xfff0a0); for (let y = 2; y < 24; y += 6) { g.fillRect(-w / 2 + 11, y, 2, 2); g.fillRect(w / 2 - 13, y, 2, 2); } }
  if (n === 3) { g.lineStyle(3, 0x1a1a20).lineBetween(-w / 2 + 14, 0, -w / 2 + 14, 22).lineBetween(w / 2 - 14, 0, w / 2 - 14, 22);
    for (const s of [-1, 1]) for (let y = 3; y < 22; y += 6) g.lineStyle(2, 0xe0b040).strokeCircle(s * (w / 2 - 14), y, 2); }
  return g;
}

// La couleur des lettres : sombres sur un fond clair, dorées sur un fond sombre
function lettresEnseigne(n, couleur) {
  const peinture = (ENSEIGNE.couleurs.find(c => c.cle === couleur) || {}).c;
  const clair = peinture ? (((peinture[1] >> 16) * 0.3 + ((peinture[1] >> 8) & 255) * 0.59 + (peinture[1] & 255) * 0.11) > 140) : n < 2;
  if (clair) return n === 0 && !peinture ? { texte: '#2a1406', contour: '#c8a070', epais: 2 } : { texte: '#2a1608', contour: '#fff4dc', epais: 3 };
  return { texte: n === 3 ? '#ffe080' : '#ffe8a0', contour: '#2a0a06', epais: 4 };
}

// L'enseigne entière (attache, planche, nom) dans un container ; le haut du container = l'accroche.
// `police` et `couleur` : sinon ceux choisis par le joueur.
function poserEnseigne(scene, x, y, n, nom, { police, couleur } = {}) {
  const r = reglagesEnseigne(window.GAME);
  police = police == null ? r.police : police;
  couleur = couleur || r.couleur;
  const c = scene.add.container(x, y), [W, H] = ENSEIGNE.tailles[n];
  const planche = scene.add.image(0, 22, texEnseigne(scene, n, couleur)).setScale(2).setOrigin(0.5, 0);
  const k = lettresEnseigne(n, couleur), [famille, graisse] = ENSEIGNE.polices[police];
  const texte = scene.add.text(0, 22 + (n === 3 ? 16 : 0) + H, nom, { fontFamily: `"${famille}", Georgia, serif`, fontSize: '20px', fontStyle: graisse,
    color: k.texte, stroke: k.contour, strokeThickness: k.epais, resolution: typeof ZOOM_ECRAN === 'number' ? Math.max(2, ZOOM_ECRAN + 1) : 3, align: 'center' }).setOrigin(0.5);
  const ajuster = () => {
    if (!texte.active) return;
    texte.setWordWrapWidth(null);
    for (let taille = 20; taille >= 10; taille--) { texte.setFontSize(taille); if (texte.width <= W * 2 - 24) break; }
    if (texte.width > W * 2 - 24) texte.setWordWrapWidth(W * 2 - 24);
  };
  ajuster();
  // la police arrive du réseau : on réécrit le nom quand elle est là
  if (document.fonts && !document.fonts.check(`${graisse === 'bold' ? 700 : 400} 20px "${famille}"`)) {
    document.fonts.load(`${graisse === 'bold' ? 700 : 400} 20px "${famille}"`).then(() => { if (texte.active) { texte.updateText(); ajuster(); } }).catch(() => {});
  }
  c.add([attacheEnseigne(scene, n, W * 2), planche, texte]);
  c.planche = planche; c.texte = texte;
  return c;
}
