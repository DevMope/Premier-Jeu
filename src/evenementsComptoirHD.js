// (v1.63) Les dessins des événements du comptoir (voir evenementsComptoir.js) : les nouveaux personnages (figurants du
// moteur des corps et des bustes, avec leurs coiffes : le feutre de l'espion, le chapeau de l'inspecteur, la capuche
// trempée, la casserole de Pimprenelle, le béret de la barde...), et les objets (le pigeon blessé et sa caisse, la main
// du pickpocket, les papiers qui s'envolent, la tasse de tisane, le luth, le gâteau et les fanions de l'anniversaire,
// le carnet de l'espion, la balance de l'inspecteur, les objets du troc, le bouquet, la lettre de Garrick, la
// berceuse...). Tout est peint avec ToileHD, comme le reste du jeu.

// --- Les personnages ---
Object.assign(FIGURANTS, {
  // le vieux voyageur qui a connu tes parents : cheveux et barbe blancs, une longue cape de route, la canne
  vieuxVoyageur: { race: 'humain', nom: 'Le vieux voyageur', habit: 0x4a5866, cape: 0x3a3a30, cheveux: 0xb8b0a0, barbe: 'pleine', coiffure: 'long', peau: 1, niveau: 1, vieux: true, buste: true },
  // la barde de passage : une elfe aux cheveux cuivrés, pourpoint bordeaux, cape bleu nuit
  barde: { race: 'elfe', feminin: true, nom: "Aëlis Corde-d'Or", habit: 0x7a2440, cape: 0x26365a, cheveux: 0xc8844a, coiffure: 'long', peau: 0, niveau: 1, buste: true },
  // Célestin, l'enfant perdu : un petit hobbit en guenilles reprisées ; et plus tard, l'apprenti au tablier de cuir
  celestinPetit: { race: 'hobbit', nom: 'Célestin', habit: 0x6a5a3e, cape: 0x4a3a2a, cheveux: 0x8a5426, coiffure: 'boucles', peau: 1, niveau: 0, buste: true,
    proportions: { H: 38, ep: 6.8, torse: 11, rx: 8.6, ry: 8.8, membre: 0.95 } },
  celestin: { race: 'hobbit', nom: 'Célestin Petit-Pont', costume: 'forgeron', habit: 0x4a6a5a, cheveux: 0x8a5426, coiffure: 'boucles', peau: 1, niveau: 0, buste: true },
  // le passant trempé par l'averse, sous sa capuche qui dégouline
  passantTrempe: { race: 'humain', nom: 'Mathurin Lavandier', habit: 0x5a5444, cape: 0x34465a, cheveux: 0x3a2a1a, barbe: 'courte', coiffure: 'court', peau: 2, niveau: 1, buste: true },
  // le nain sans le sou, au bonnet troué
  troqueur: { race: 'nain', nom: 'Durli Poche-Vide', habit: 0x6a4a2a, cape: 0x4a3a2a, cheveux: 0x9a5a2a, barbe: 'nain', peau: 2, niveau: 0, buste: true },
  // le vantard : un faux héros en velours, la moustache cirée, le chapeau à plume
  vantard: { race: 'humain', nom: 'Gonzague le Sans-Pareil', costume: 'noble', habit: 0x9a2a2a, cape: 0xe0c060, cheveux: 0xd8b048, barbe: 'moustache', coiffure: 'court', peau: 0, niveau: 3, buste: true },
  // l'espion du paon : gris de la tête aux pieds, le feutre bas sur les yeux
  espion: { race: 'humain', nom: 'Ursin Plumet', habit: 0x4a4a52, cape: 0x34343c, cheveux: 0x2a2620, coiffure: 'court', peau: 0, niveau: 1, buste: true },
  // les enfants qui jouent aux aventuriers
  pimprenelle: { race: 'hobbit', feminin: true, nom: 'Pimprenelle', habit: 0x8a3a2a, cheveux: 0xc87a3a, coiffure: 'boucles', peau: 0, niveau: 0, buste: true,
    proportions: { H: 38, ep: 6.6, torse: 11, rx: 8.6, ry: 8.8, membre: 0.95 } },
  toinou: { race: 'humain', nom: 'Toinou', habit: 0x3a5a8a, cheveux: 0x5a3a1a, coiffure: 'court', peau: 3, niveau: 0, buste: true,
    proportions: { H: 44, ep: 6.6, torse: 14, rx: 8, ry: 8.6, membre: 0.85 } },
  gaspard: { race: 'hobbit', nom: 'Gaspard', habit: 0x4a7a3a, cheveux: 0x4a3020, coiffure: 'boucles', peau: 2, niveau: 0, buste: true,
    proportions: { H: 36, ep: 6.6, torse: 10.5, rx: 8.6, ry: 8.8, membre: 0.95 } },
  // le petit chapardeur, qui détale dans la rue
  chapardeur: { race: 'humain', nom: 'Le chapardeur', habit: 0x4a4038, cape: 0x3a3430, cheveux: 0x2a1c12, coiffure: 'herisse', peau: 2, niveau: 0, buste: true,
    proportions: { H: 42, ep: 6.4, torse: 13, rx: 7.8, ry: 8.4, membre: 0.85 } },
  // les amoureux : une naine forgeronne aux cheveux roux noués (sans barbe, comme Baba), et son elfe
  brunhilde: { race: 'nain', feminin: true, nom: 'Brunhilde Fer-Doux', costume: 'forgeron', habit: 0x3a6a4a, cheveux: 0xb8582a, coiffure: 'queue', peau: 0, niveau: 1, buste: true },
  elrian: { race: 'elfe', nom: 'Elrian', habit: 0x5a4a7a, cape: 0x3a5a4a, cheveux: 0xe0d4a0, coiffure: 'long', peau: 0, niveau: 1, buste: true },
  // l'inspecteur des poids et mesures : habit noir, le chapeau haut, le lorgnon
  inspecteur: { race: 'humain', nom: 'Maître Ambroise Trébuchet', costume: 'banquier', habit: 0x22222a, cheveux: 0x8a8a90, barbe: 'moustache', coiffure: 'court', peau: 1, niveau: 2, buste: true },
});

// --- Les coiffes : peintes par-dessus la tête, sur le buste comme sur le corps en pied ---
// `H` : la tête, en pixels de la toile : cx (le milieu), haut (le haut des cheveux), rx (la demi-largeur), front (là où
// s'arrête un bord de chapeau : juste au-dessus des sourcils), cy (le centre), menton. La tête est tournée de trois
// quarts vers la droite.
const COIFFES_EVT = { espion: 'feutre', inspecteur: 'hautForme', passantTrempe: 'capuche', pimprenelle: 'casserole', barde: 'beret', troqueur: 'bonnet', brunhilde: 'fleur', celestinPetit: 'salete', celestin: 'casquette' };
const COIFFES_CORPS_EVT = { espion: 'feutre', passantTrempe: 'capuche', pimprenelle: 'casserole', barde: 'beret', troqueur: 'bonnet', celestin: 'casquette' };
function rampesCoiffes(t) {
  Object.assign(t.rampes, {
    feutre: rampeVive(0x4a4a50), ruban: rampeVive(0x24242a), hautForme: rampeVive(0x1c1c22), soie: rampeVive(0x5a1a24),
    capuche: rampeVive(0x34465a), eau: [0x3a6a9a, 0x5a8ab8, 0x7aaad0, 0x9ac8e8, 0xc0e2f6, 0xf0faff],
    cuivre: rampeVive(0xb8642a), beret: rampeVive(0x6a1a34), plume: rampeVive(0xe8e0d0), laine: rampeVive(0x7a5a3a),
    fleurRose: rampeVive(0xe07a9a), feuille: rampeVive(0x4a8a3a), coeurFleur: rampeVive(0xf0c040), suie: rampe(0x4a3a30),
    rapiece: rampeVive(0x8a6a3a), casquette: rampeVive(0x5a6a3a), orLorgnon: RAMPES.or, fer: RAMPES_DECOR.fer,
  });
}
const domeEvt = (x, y, ax, ay, bx, by) => { const nx = (x + 0.5 - ax) / bx, ny = (y + 0.5 - ay) / by; return nx * nx + ny * ny <= 1 ? [nx, ny, Math.sqrt(Math.max(0.05, 1 - nx * nx - ny * ny))] : null; };
function peindreCoiffe(t, coiffe, H) {
  rampesCoiffes(t);
  // (le contour déjà posé est retiré : il sera refait autour de la tête coiffée)
  for (let p = 0; p < t.c.length; p++) if (t.m[p] === null) t.c[p] = null;
  const { cx, haut, rx, front } = H, dome = domeEvt;
  const relief = t.relief; t.relief = true;
  if (coiffe === 'feutre' || coiffe === 'hautForme' || coiffe === 'casquette') {
    const hautF = coiffe === 'hautForme', casq = coiffe === 'casquette';
    const bord = front - 1, haute = Math.max(hautF ? Math.round(rx * 1.25) : casq ? Math.round(rx * 0.55) : Math.round(rx * 0.75), bord - haut + (hautF ? 6 : 1));
    const mat = hautF ? 'hautForme' : casq ? 'casquette' : 'feutre';
    // la calotte (pincée au sommet pour le feutre, bombée pour la casquette), puis le ruban, puis le bord
    t.forme(mat, (x, y) => {
      if (y > bord - 1 || y < bord - haute) return null;
      const u = (bord - y) / haute, demi = hautF ? rx * 0.86 : casq ? rx * 1.04 * Math.sqrt(Math.max(0, 1 - (u * 0.92) ** 2)) : rx * 0.94 * (1 - u * u * 0.32);
      const nx = (x + 0.5 - cx + 1) / Math.max(1, demi);
      if (!hautF && !casq && u > 0.9 && Math.abs(x + 0.5 - cx + 1) < 1.5) return null;   // (le creux du feutre)
      return Math.abs(nx) <= 1 ? [nx, -0.4 + u * 0.3, Math.sqrt(Math.max(0.1, 1 - nx * nx))] : null;
    }, { decalage: hautF ? 0.1 : 0.2 });
    if (!casq) t.forme('ruban', (x, y) => (y >= bord - 3 && y <= bord - 1 && Math.abs(x + 0.5 - cx + 1) <= (hautF ? rx * 0.86 : rx * 0.94) ? [(x + 0.5 - cx) / rx, 0, 0.9] : null), { decalage: hautF ? 0.4 : 0.1, ombre: false });
    if (casq) t.forme('casquette', (x, y) => (y >= bord - 1 && y <= bord + 1 && x + 0.5 >= cx - 1 && x + 0.5 <= cx + rx * 1.5 ? [0.2, -0.6, 0.8] : null), { decalage: -0.2 });   // (la visière, vers l'avant)
    else t.forme(mat, (x, y) => dome(x, y, cx + 0.5, bord + 0.5, rx * (hautF ? 1.28 : 1.5), 1.9), { decalage: -0.1 });
    if (hautF) t.forme('soie', (x, y) => (y === bord - 2 && Math.abs(x + 0.5 - cx + 1) <= rx * 0.86 ? [0, 0, 1] : null), { decalage: 0.6, ombre: false, bord: false });
  } else if (coiffe === 'capuche') {
    // la capuche relevée, qui encadre le visage et tombe sur les épaules ; l'eau qui ruisselle sur le bord
    const cyC = H.cy - 1, ext = rx + 3.5, extY = Math.max(H.cy - haut + 4, (H.menton - haut) * 0.62 + 3);
    t.forme('capuche', (x, y) => {
      const o = dome(x, y, cx - 1, cyC, ext, extY);
      if (!o || y > H.menton + 2) return null;
      const visage = dome(x, y, cx + 2, H.cy + 3, rx - 1.5, (H.menton - front) * 0.62 + 2);
      return visage && y > front - 3 ? null : o;
    }, { motif: (x, y) => ((x + y * 2) % 7 === 0 ? -0.6 : 0) });
    for (let k = 0; k < 9; k++) { const a = Math.PI * (0.15 + k * 0.09), x = Math.round(cx - 1 + Math.cos(a) * ext * (k % 2 ? 1 : 0.96)), y = Math.round(cyC + Math.sin(a) * extY * 0.4 + 6 + (k % 3)); if (t.mat(x, y) === 'capuche') t.poser(x, y, 'eau', 4 + (k % 2)); }
    for (const [dx, dy] of [[-ext + 1, 6], [ext - 2, 9], [-ext + 3, 13]]) { t.poser(Math.round(cx + dx), Math.round(cyC + dy), 'eau', 5); t.poser(Math.round(cx + dx), Math.round(cyC + dy + 1), 'eau', 3); }
  } else if (coiffe === 'casserole') {
    // une vieille casserole de cuivre, retournée en casque, le manche qui dépasse en arrière
    const bord = front - 1, h = Math.max(Math.round(rx * 0.85), bord - haut + 1);
    t.forme('cuivre', (x, y) => (y <= bord && y >= bord - h ? dome(x, y, cx, bord + 0.5, rx + 1.5, h + 0.5) : null), { motif: (x, y) => (Math.abs(x + 0.5 - cx - rx * 0.35) < 1 && y < bord - h * 0.4 ? 0.8 : 0) });
    t.forme('cuivre', (x, y) => (y >= bord - 1 && y <= bord + 1 && Math.abs(x + 0.5 - cx) <= rx + 2.5 ? [(x + 0.5 - cx) / (rx + 3), 0.2, 0.9] : null), { decalage: -0.3 });
    trait(t, 'cuivre', cx - rx - 1, bord - 1, cx - rx * 1.9 - 4, bord - h * 0.5, 1.1, { decalage: -0.4 });
    t.forme('fer', (x, y) => dome(x, y, cx - rx * 1.9 - 4, bord - h * 0.5, 1.6, 1.6), { decalage: -0.2 });
    t.poser(Math.round(cx + rx * 0.2), bord - Math.round(h * 0.55), 'cuivre', 1);   // (une bosse)
  } else if (coiffe === 'beret') {
    // le béret de velours posé de côté, et sa longue plume blanche
    const bord = Math.min(front - 2, haut + 5);
    t.forme('beret', (x, y) => dome(x, y, cx - rx * 0.25, bord - 2, rx * 1.12, 4.2), { decalage: 0.1 });
    t.forme('beret', (x, y) => (y >= bord - 1 && y <= bord + 1 && Math.abs(x + 0.5 - cx + rx * 0.1) <= rx * 0.85 ? [0, 0.3, 0.9] : null), { decalage: -0.4 });
    traitHD(t, 'plume', [[cx + rx * 0.3, bord - 3], [cx - rx * 0.3, bord - 9], [cx - rx * 1.1, bord - 12], [cx - rx * 1.7, bord - 10]], 1.4, 0.4);
    t.forme('orLorgnon', (x, y) => dome(x, y, cx + rx * 0.35, bord - 2.5, 1.4, 1.4), { decalage: 0.5 });
  } else if (coiffe === 'bonnet') {
    // le bonnet de laine, troué, une mèche qui passe par un trou
    const bord = front - 1, h = Math.max(Math.round(rx * 0.95), bord - haut + 1);
    t.forme('laine', (x, y) => (y <= bord && y >= bord - h ? dome(x, y, cx, bord + 1, rx + 1.2, h + 1) : null), { motif: (x, y) => (y % 2 === 0 ? -0.4 : 0) + (x % 3 === 0 ? -0.3 : 0) });
    t.forme('laine', (x, y) => (y >= bord - 2 && y <= bord + 1 && Math.abs(x + 0.5 - cx) <= rx + 1.4 ? [(x + 0.5 - cx) / (rx + 2), 0, 0.9] : null), { decalage: 0.3, motif: x => (x % 2 ? -0.6 : 0) });
    for (const [dx, dy] of [[-rx * 0.35, -h * 0.5], [rx * 0.4, -h * 0.75]]) { const x = Math.round(cx + dx), y = Math.round(bord + dy); t.poser(x, y, 'ruban', 0); t.poser(x + 1, y, 'ruban', 1); t.poser(x, y + 1, 'ruban', 1); }
  } else if (coiffe === 'fleur') {
    // une fleur des champs piquée au-dessus de l'oreille
    const fx = Math.round(cx - rx * 0.78), fy = Math.round(front + 1);
    for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 - 0.4; t.forme('fleurRose', (x, y) => dome(x, y, fx + Math.cos(a) * 2.4, fy + Math.sin(a) * 2.4, 1.7, 1.7), { decalage: 0.3 }); }
    t.forme('coeurFleur', (x, y) => dome(x, y, fx, fy, 1.3, 1.3), { decalage: 0.5, ombre: false });
    t.forme('feuille', (x, y) => dome(x, y, fx + 3.5, fy + 3, 2.4, 1.1), { decalage: 0.1 });
  } else if (coiffe === 'salete') {
    // la suie sur la joue, une pièce cousue sur l'épaule
    for (const [dx, dy] of [[-rx * 0.55, 5], [-rx * 0.45, 6], [-rx * 0.6, 7], [rx * 0.5, 9]]) { const x = Math.round(cx + dx), y = Math.round(H.cy + dy); if (t.mat(x, y) === 'peau') t.poser(x, y, 'suie', 2); }
    if (H.epaule) for (let y = H.epaule[1]; y < H.epaule[1] + 6; y++) for (let x = H.epaule[0]; x < H.epaule[0] + 7; x++) if (t.mat(x, y)) t.poser(x, y, 'rapiece', (x + y) % 3 === 0 ? 2 : 3 + (y === H.epaule[1] ? 1 : 0));
  }
  t.relief = relief;
}
// La tête d'un buste (80 × 100, voir dessinerBusteHD) : d'après VISAGES, et le haut réel des cheveux
function teteBusteEvt(t, gene) {
  const v = VISAGES[gene.race] || VISAGES.humain, cx = 40;
  let haut = v.cy - v.ry;
  for (let y = 0, trouve = false; y < t.h && !trouve; y++) for (let x = cx - 6; x <= cx + 6; x++) if (t.c[y * t.l + x] !== null) { haut = y; trouve = true; break; }
  return { cx: cx + 1, haut, rx: v.rx, cy: v.cy, front: v.yeux - 7 - (v.front || 0), menton: v.cy + v.ry, epaule: [cx - v.rx - 6, v.torse + 6] };
}
// Le lorgnon de l'inspecteur : un cercle d'or autour de l'œil le plus proche, et sa chaînette
function lorgnonEvt(t) {
  let xi = -1, yi = -1;
  for (let y = 30; y < 60; y++) for (let x = 40; x < 70; x++) if (t.mat(x, y) === 'iris' && x > xi) { xi = x; yi = y; }
  if (xi < 0) return;
  rampesCoiffes(t);
  for (let a = 0; a < 6.28; a += 0.3) { const x = Math.round(xi - 0.5 + Math.cos(a) * 3.2), y = Math.round(yi + Math.sin(a) * 3); t.poser(x, y, 'orLorgnon', a < 3 ? 4 : 2); }
  for (let k = 0; k < 10; k++) t.poser(xi + 3 + Math.round(k * 0.3), yi + 2 + k, 'orLorgnon', k % 2 ? 3 : 1);
}
// Le buste d'un figurant coiffé : comme textureBusteHD, avec sa coiffe
const textureBusteHDAvantEvt = textureBusteHD;
textureBusteHD = function (scene, personne, expression = 'neutre', etat = {}) {
  const coiffe = personne && personne.figurant && COIFFES_EVT[personne.figurant];
  if (!coiffe) return textureBusteHDAvantEvt(scene, personne, expression, etat);
  const cle = `busteHD_evt_${personne.figurant}_${expression}${etat.pose ? '_' + etat.pose : ''}${etat.cligne ? '_c' : ''}${etat.parle ? '_p' : ''}`;
  if (!scene.textures.exists(cle)) {
    const gene = geneHD(personne), t = dessinerBusteHD(gene, expression, etat);
    peindreCoiffe(t, coiffe, teteBusteEvt(t, gene));
    if (personne.figurant === 'inspecteur') lorgnonEvt(t);
    t.contour();
    t.texture(scene, cle);
  }
  return cle;
};
// La tête d'un corps en pied, trouvée dans ses pixels : le haut des cheveux, la largeur au niveau du front
function teteCorpsEvt(data, l, h, cy) {
  const plein = (x, y) => x >= 0 && y >= 0 && x < l && y < h && data[(y * l + x) * 4 + 3] > 0;
  let haut = -1;
  for (let y = 0; y < h && haut < 0; y++) for (let x = Math.round(l * 0.3); x < l * 0.7; x++) if (plein(x, y)) { haut = y; break; }
  if (haut < 0) return null;
  const ligne = Math.min(h - 1, Math.max(haut + 4, cy - 4));
  let x0 = l, x1 = -1;
  for (let x = Math.round(l * 0.2); x < l * 0.8; x++) if (plein(x, ligne)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
  if (x1 < 0) return null;
  const rx = (x1 - x0) / 2, cx = (x0 + x1) / 2;
  return { cx, haut, rx, cy, front: Math.round(cy - rx * 0.18), menton: Math.round(cy + rx * 1.05) };
}
// Peint la coiffe sur une texture de corps (et ses images de marche), une seule fois par texture
function coifferCorpsEvt(scene, cle, coiffe) {
  for (const k of [cle, cle + '_pas1', cle + '_pas2']) {
    if (!scene.textures.exists(k)) continue;
    const tex = scene.textures.get(k);
    if (!tex.getContext || tex.evtCoiffe) continue;
    tex.evtCoiffe = true;
    const ctx = tex.getContext(), img = tex.getSourceImage(), l = img.width, h = img.height;
    const id = ctx.getImageData(0, 0, l, h), base = (REPERES_CORPS[cle] || {}).cy || Math.round(h * 0.2);
    const H = teteCorpsEvt(id.data, l, h, base);
    if (!H) continue;
    const t = new ToileHD(l, h);
    peindreCoiffe(t, coiffe, H);
    t.contour();
    for (let p = 0; p < l * h; p++) {
      const c = t.c[p];
      if (c === null) continue;
      if (t.m[p] === null && id.data[p * 4 + 3] > 0) continue;   // (le contour de la coiffe ne mord pas sur le corps)
      id.data[p * 4] = (c >> 16) & 255; id.data[p * 4 + 1] = (c >> 8) & 255; id.data[p * 4 + 2] = c & 255; id.data[p * 4 + 3] = 255;
    }
    ctx.putImageData(id, 0, 0);
    tex.refresh();
  }
}
const corpsHDAvantEvt = corpsHD;
corpsHD = function (scene, quoi, pose = null, vue = 'troisQuarts', armeForcee = undefined) {
  const cle = corpsHDAvantEvt(scene, quoi, pose, vue, armeForcee);
  const fig = typeof quoi === 'string' ? quoi : quoi && quoi.figurant;
  if (fig && COIFFES_CORPS_EVT[fig] && vue !== 'dos') coifferCorpsEvt(scene, cle, COIFFES_CORPS_EVT[fig]);
  return cle;
};

// --- Les objets des événements (dessinés une fois par partie, à la première demande) ---
function creerObjetsEvtHD(scene) {
  if (scene.textures.exists('evt_gateau')) return;
  const fabriquer = (cle, l, h, dessin) => { const t = toileObjet(l, h); rampesCoiffes(t); dessin(t); t.contour(); t.texture(scene, cle); };
  const dome = domeEvt;
  // Le pigeon blessé : posé bas, ébouriffé, une aile qui pend ; puis l'aile bandée
  const pigeon = (t, bande) => {
    t.rampes.plume = rampe(0x8a8a98); t.rampes.cou = rampe(0x5a7a6a); t.rampes.bec = rampe(0xd0a080); t.rampes.patte = rampe(0xd0705a);
    const cx = 14, cy = 13;
    t.forme('plume', polygoneHD([[cx + 4, cy + 1], [cx + 12, cy + 4], [cx + 11, cy + 7], [cx + 3, cy + 5]]), { motif: x => (x % 2 ? -0.4 : 0) });
    t.forme('plume', ellipsoide(cx, cy + 1, 7, 5.2), { motif: (x, y) => (hachage(x, y, 7) > 0.8 ? 0.7 : 0) });
    t.forme('cou', ellipsoide(cx - 5, cy - 3, 3.2, 3.2), { decalage: 0.3 });
    t.forme('plume', ellipsoide(cx - 6, cy - 5.5, 2.8, 2.6), { decalage: 0.5 });
    t.poser(cx - 9, cy - 5, 'bec', 3); t.poser(cx - 10, cy - 5, 'bec', 4);
    t.poser(cx - 7, cy - 6, 'encre', 0); t.poser(cx - 7, cy - 7, 'plume', 1);   // (l'œil mi-clos)
    // l'aile qui pend jusqu'au sol, les rémiges écartées
    t.forme('plume', polygoneHD([[cx - 1, cy - 1], [cx + 5, cy], [cx + 7, cy + 8], [cx + 3, cy + 9], [cx - 2, cy + 6]]), { decalage: -0.2, motif: (x, y) => ((x + y) % 3 === 0 ? -0.6 : 0) });
    for (const [x, y] of [[cx + 2, cy + 7], [cx + 4, cy + 8], [cx + 5, cy + 6]]) t.poser(x, y, 'plume', 0);
    if (bande) { for (let y = cy + 1; y <= cy + 4; y++) for (let x = cx - 1; x <= cx + 6; x++) if (t.mat(x, y) === 'plume' && (y === cy + 1 || y === cy + 3 || (x + y) % 4 === 0)) t.poser(x, y, 'lin', y === cy + 1 ? 5 : 4); }
    for (const dx of [-3, 1]) { t.poser(cx + dx, t.h - 2, 'patte', 2); t.poser(cx + dx - 1, t.h - 1, 'patte', 3); t.poser(cx + dx + 1, t.h - 1, 'patte', 3); t.poser(cx + dx, t.h - 1, 'patte', 2); }
  };
  fabriquer('evt_pigeonBlesse', 28, 22, t => pigeon(t, false));
  fabriquer('evt_pigeonSoigne', 28, 22, t => pigeon(t, true));
  // Le même, qui revient : posé fièrement, un objet brillant au bec
  fabriquer('evt_pigeonFier', 28, 22, t => {
    t.rampes.plume = rampe(0x8a8a98); t.rampes.cou = rampe(0x5a7a6a); t.rampes.bec = rampe(0xd0a080); t.rampes.patte = rampe(0xd0705a);
    const cx = 15, cy = 11;
    t.forme('plume', polygoneHD([[cx + 4, cy + 1], [cx + 11, cy + 6], [cx + 10, cy + 9], [cx + 3, cy + 5]]), { motif: x => (x % 2 ? -0.4 : 0) });
    t.forme('plume', ellipsoide(cx, cy + 1, 6.4, 5.2));
    t.forme('cou', ellipsoide(cx - 4, cy - 4, 3.2, 3.6), { decalage: 0.3 });
    t.forme('plume', ellipsoide(cx - 5, cy - 8, 2.8, 2.6), { decalage: 0.5 });
    t.forme('plume', polygoneHD([[cx - 3, cy - 2], [cx + 5, cy - 1], [cx + 9, cy + 4], [cx + 1, cy + 4]]), { decalage: -0.3 });
    for (let y = cy - 1; y <= cy + 1; y++) for (let x = cx; x <= cx + 5; x++) if ((x + y) % 4 === 0) t.poser(x, y, 'lin', 4);   // (la trace du bandage)
    t.poser(cx - 8, cy - 8, 'bec', 3); t.poser(cx - 9, cy - 8, 'bec', 4); t.poser(cx - 6, cy - 9, 'encre', 0);
    t.forme('or', ellipsoide(cx - 11, cy - 7, 2, 2), { decalage: 0.6 });
    for (const dx of [-2, 2]) { for (let y = cy + 5; y <= t.h - 2; y++) t.poser(cx + dx, y, 'patte', 2); for (const k of [-1, 0, 1]) t.poser(cx + dx + k, t.h - 1, 'patte', 3); }
  });
  // La caisse garnie de paille, où il se repose
  fabriquer('evt_caisse', 38, 14, t => {
    t.rampes.paille = rampe(0xd8b050);
    for (let y = 0; y < 3; y++) for (let x = 1; x < 37; x++) if (hachage(x, y, 81) > 0.25) t.poser(x, y, 'paille', 2 + Math.round(hachage(y, x, 82) * 3));
    planche(t, 0, 3, 38, 5, 'chene', { graine: 851, noeuds: 1 }); planche(t, 0, 8, 38, 6, 'chene', { graine: 852, noeuds: 1 });
    for (const x of [0, 36]) for (let y = 3; y < 14; y++) { t.poser(x, y, 'cheneSombre', 3); t.poser(x + 1, y, 'cheneSombre', 2); }
    for (const [x, y] of [[3, 5], [34, 5], [3, 11], [34, 11]]) t.poser(x, y, 'fer', 4);
  });
  // La main du pickpocket, qui monte de sous le comptoir : ouverte (elle cherche), puis serrée sur deux pièces
  const main = (t, serre) => {
    t.rampes.manche = rampe(0x5a4a34); t.rampes.peauM = RAMPES_PEAU[1];
    t.forme('manche', (x, y) => (y >= 30 && Math.abs(x + 0.5 - 11 - (y - 30) * 0.05) <= 6.2 - (y < 33 ? 0.6 : 0) ? [(x + 0.5 - 11) / 6.5, 0, 0.8] : null), { motif: (x, y) => (y % 5 === 0 ? -0.5 : 0) });
    for (let x = 5; x < 18; x++) t.poser(x, 30, 'manche', 1);
    for (const [x, y] of [[8, 40], [9, 41], [13, 46], [12, 47], [9, 52]]) t.poser(x, y, 'manche', 5);   // (des fils qui pendent)
    t.forme('peauM', (x, y) => (y >= 18 && y < 31 && Math.abs(x + 0.5 - 11) <= 3.6 ? [(x + 0.5 - 11) / 3.8, 0, 0.8] : null));   // le poignet
    if (!serre) {
      t.forme('peauM', ellipsoide(11, 15, 5.2, 4.4));
      for (const [ax, ay, bx, by] of [[8, 12, 5, 3], [10, 11, 9, 1], [12, 11, 13, 1.5], [14, 12, 17, 4], [15, 16, 20, 13]]) trait(t, 'peauM', ax, ay, bx, by, 1.15, { decalage: 0.2 });
    } else {
      // le poing fermé : les pièces qui dépassent entre le pouce et l'index, les quatre doigts repliés
      t.forme('or', ellipsoide(9, 9.5, 3, 1.6), { decalage: 0.6 }); t.forme('or', ellipsoide(12.5, 8.6, 3, 1.6), { decalage: 0.3 });
      t.forme('peauM', (x, y) => (y >= 10 && y <= 19 && Math.abs(x + 0.5 - 11) <= 5.6 - (y > 17 ? (y - 17) * 1.2 : 0) - (y < 11 ? 1 : 0) ? [(x + 0.5 - 11) / 6, (y - 14) / 9, 0.8] : null));
      for (const x of [8, 11, 14]) for (let y = 11; y <= 15; y++) t.poser(x, y, 'peauM', 1);   // (les doigts repliés)
      for (let x = 6; x <= 16; x++) t.poser(x, 16, 'peauM', 2);
      trait(t, 'peauM', 5.5, 17, 8.5, 11.5, 1.3, { decalage: 0.3 });   // le pouce, refermé sur les pièces
    }
  };
  fabriquer('evt_main0', 22, 64, t => main(t, false));
  fabriquer('evt_main1', 22, 64, t => main(t, true));
  // Les papiers qui s'envolent : une lettre cachetée, une facture, la liste des commandes, un parchemin plié
  ['parchemin', 'cire', 'toile', 'parchemin'].forEach((mat, v) => fabriquer('evt_papier' + v, 16, 20, t => {
    for (let y = 0; y < 20; y++) for (let x = 0; x < 16; x++) {
      const pli = v === 3 && y === 9;
      t.poser(x, y, mat, x === 15 || y === 19 ? 2 : pli ? 2 : 4 - (y > 2 && y < 17 && y % 3 === 0 && x > 1 && x < 14 && v !== 0 ? 2 : 0));
    }
    if (v === 0) { t.forme('cuirRouge', ellipsoide(8, 11, 2.6, 2.6), { decalage: 0.5 }); for (let x = 2; x < 14; x++) { t.poser(x, 4, 'encre', 3); t.poser(x - 1 + (x % 3), 6, 'encre', 3); } }
    if (v === 1) { for (let y = 4; y < 16; y += 3) t.poser(12, y, 'encre', 1); t.poser(12, 17, 'cuirRouge', 4); }
    if (v === 2) for (let y = 3; y < 17; y += 3) { t.poser(2, y, 'encre', 1); t.poser(3, y, 'encre', 1); }
  }));
  // La tasse de tisane, en terre, et son infusion verte
  fabriquer('evt_tasse', 16, 13, t => {
    t.rampes.terre = rampe(0xa8643a); t.rampes.tisane = rampe(0x7a8a3a);
    t.forme('terre', (x, y) => (y >= 2 && y <= 12 && Math.abs(x + 0.5 - 7) <= 5.2 - (y > 10 ? 0.8 : 0) ? [(x + 0.5 - 7) / 5.5, 0, 0.8] : null));
    t.forme('tisane', ellipsoide(7, 2.6, 4.6, 1.3), { decalage: 0.4, ombre: false });
    t.forme('terre', (x, y) => { const d = Math.hypot(x + 0.5 - 12.5, y + 0.5 - 6.5); return d >= 1.6 && d <= 3.2 && x + 0.5 > 12 ? [0.8, 0, 0.6] : null; });
    for (let x = 3; x < 12; x++) t.poser(x, 7, 'terre', 2);
  });
  // Le luth de la barde : la caisse en poire, la rosace, le manche et le chevillier coudé
  fabriquer('evt_luth', 30, 48, t => {
    t.rampes.erable = rampe(0xc08040); t.rampes.ebene = rampe(0x2a1a14);
    t.forme('erable', ellipsoide(15, 36, 11, 11), { motif: (x, y) => ((x * 2 + y) % 6 === 0 ? -0.4 : 0) });
    t.forme('erable', ellipsoide(15, 27, 7.5, 7), { motif: (x, y) => ((x * 2 + y) % 6 === 0 ? -0.4 : 0) });
    t.forme('ebene', ellipsoide(15, 33, 3, 3), { decalage: -1.2, ombre: false });
    t.forme('or', (x, y) => { const d = Math.hypot(x + 0.5 - 15, y + 0.5 - 33); return d > 2.6 && d < 3.6 ? [0, 0, 1] : null; }, { decalage: 0.3, ombre: false, bord: false });
    t.forme('ebene', (x, y) => (y >= 2 && y < 22 && Math.abs(x + 0.5 - 15) <= 1.8 ? [(x + 0.5 - 15) / 2, 0, 0.8] : null), { decalage: 0.3 });
    t.forme('erable', polygoneHD([[13, 0], [18, 0], [20, 5], [14, 5]]), { decalage: -0.2 });
    for (const [x, y] of [[13, 1], [19, 2], [13, 3], [20, 4]]) t.poser(x, y, 'cire', 5);
    t.forme('ebene', (x, y) => (y >= 41 && y <= 42 && Math.abs(x + 0.5 - 15) <= 3.5 ? [0, 0, 1] : null), { decalage: 0.2 });
    for (const dx of [-1, 0, 1]) for (let y = 4; y < 42; y += 1) if (t.mat(15 + dx, y) && y % 1 === 0 && (y < 30 || y > 36)) t.poser(15 + dx, y, 'cire', dx === 0 ? 5 : 4);
  });
  // Le gâteau de l'anniversaire : deux étages de crème, des mûres, une bougie
  fabriquer('evt_gateau', 40, 32, t => {
    t.rampes.creme = rampe(0xf4e8d0); t.rampes.biscuit = rampe(0xc8884a); t.rampes.mure = rampe(0x4a1a4a); t.rampes.bougie = rampe(0xe8d8a0); t.rampes.plat = rampe(0xb8b8c0);
    t.forme('plat', ellipsoide(20, 29, 18.5, 2.6), { decalage: 0.3 });
    t.forme('biscuit', (x, y) => (y >= 17 && y <= 28 && Math.abs(x + 0.5 - 20) <= 15 ? [(x + 0.5 - 20) / 15, 0, 0.8] : null));
    t.forme('creme', (x, y) => (y >= 15 && y <= 19 + (Math.sin(x * 1.3) > 0.4 ? 2 : 0) && Math.abs(x + 0.5 - 20) <= 15.5 ? [(x + 0.5 - 20) / 16, -0.6, 0.7] : null), { decalage: 0.3 });
    t.forme('biscuit', (x, y) => (y >= 8 && y <= 16 && Math.abs(x + 0.5 - 20) <= 9.5 ? [(x + 0.5 - 20) / 9.5, 0, 0.8] : null));
    t.forme('creme', (x, y) => (y >= 6 && y <= 10 + (Math.sin(x * 1.5 + 1) > 0.5 ? 2 : 0) && Math.abs(x + 0.5 - 20) <= 10 ? [(x + 0.5 - 20) / 10.5, -0.6, 0.7] : null), { decalage: 0.4 });
    for (const [x, y] of [[8, 17], [14, 18], [26, 17], [32, 18], [20, 18], [14, 7], [25, 7]]) t.forme('mure', ellipsoide(x, y, 1.6, 1.5), { decalage: 0.4 });
    t.forme('bougie', (x, y) => (y >= 0 && y <= 6 && x >= 19 && x <= 20 ? [x === 19 ? -0.6 : 0.4, 0, 0.8] : null));
  });
  fabriquer('evt_flamme', 6, 8, t => { t.forme('flamme', ellipsoide(3, 4.6, 2.2, 3.4), { decalage: 0.8, ombre: false }); t.poser(3, 6, 'flamme', 5); });
  // Les fanions : trois couleurs, l'étoffe qui ondule
  [0xa82a2a, 0xd8a030, 0x3a7a3a, 0x2a4a8a].forEach((c, v) => fabriquer('evt_fanion' + v, 10, 13, t => {
    t.rampes.fanion = rampe(c);
    t.forme('fanion', polygoneHD([[0, 0], [10, 0], [5, 12.5]]), { motif: (x, y) => (x === 4 ? 0.5 : 0) });
    for (let x = 0; x < 10; x++) t.poser(x, 0, 'fanion', 5);
  }));
  // Les cadeaux de l'anniversaire, selon ta réputation : la plaque d'argent, l'enseigne sculptée, le panier, le bouquet
  fabriquer('evt_plaque', 34, 26, t => {
    t.rampes.argent = rampe(0xb8c0cc);
    planche(t, 0, 0, 34, 26, 'cheneSombre', { graine: 861, noeuds: 0 });
    t.forme('argent', (x, y) => (x >= 3 && x <= 30 && y >= 3 && y <= 22 ? [(x - 16.5) / 16, (y - 12.5) / 12, 0.7] : null), { decalage: 0.4 });
    for (const [x, y] of [[5, 5], [28, 5], [5, 20], [28, 20]]) t.poser(x, y, 'or', 5);
    // (deux filets gravés, et un petit comptoir ciselé entre eux)
    for (let x = 8; x <= 25; x++) { t.poser(x, 8, 'argent', 1); t.poser(x, 17, 'argent', 1); }
    t.dessin(12, 10, ['..aaaaa...', '.a.....a..', 'aaaaaaaaa.', '.a.a.a.a..', '.aaaaaaa..'], { a: ['argent', 0] });
  });
  fabriquer('evt_enseigne', 36, 24, t => {
    planche(t, 0, 4, 36, 18, 'chene', { graine: 871, noeuds: 2 });
    for (let x = 0; x < 36; x++) { t.poser(x, 4, 'chene', 5); t.poser(x, 21, 'cheneSombre', 2); }
    for (const x of [6, 29]) { t.poser(x, 0, 'fer', 3); t.poser(x, 1, 'fer', 3); t.poser(x, 2, 'fer', 4); t.poser(x, 3, 'fer', 2); }
    t.forme('cheneSombre', ellipsoide(18, 13, 5.5, 5.5), { decalage: -0.5 });
    t.forme('or', ellipsoide(18, 13, 3, 3), { decalage: 0.5 });
    for (let x = 4; x < 12; x++) t.poser(x, 13, 'cheneSombre', 1); for (let x = 25; x < 33; x++) t.poser(x, 13, 'cheneSombre', 1);
  });
  fabriquer('evt_panier', 32, 26, t => {
    t.rampes.osier = rampe(0xb08a4a); t.rampes.pomme = rampe(0xc0302a);
    t.forme('pomme', ellipsoide(10, 9, 4.2, 4), { decalage: 0.5 }); t.forme('pain', ellipsoide(19, 8, 6, 4), { decalage: 0.3 }); t.forme('fromage', ellipsoide(25, 10, 4, 3), { decalage: 0.3 });
    t.forme('osier', (x, y) => (y >= 11 && y <= 25 && Math.abs(x + 0.5 - 16) <= 15 - (y - 11) * 0.25 ? [(x + 0.5 - 16) / 15, 0, 0.8] : null), { motif: (x, y) => ((x + (y % 4 < 2 ? 0 : 2)) % 4 < 2 ? 0.5 : -0.4) });
    traitHD(t, 'osier', [[3, 11], [6, 2], [16, 0.5], [26, 2], [29, 11]], 1.1, 0.2);
  });
  const bouquet = t => {
    t.rampes.tige = rampe(0x4a7a2a); t.rampes.ruban2 = rampe(0x8a3a9a);
    for (const [a, b] of [[14, 26, 9, 10], [15, 26, 15, 8], [16, 26, 21, 10], [15, 26, 12, 6], [15, 26, 19, 5]]) trait(t, 'tige', a, b, ...[a === 14 ? 9 : a === 16 ? 21 : 15, b - 16], 0.6);
    const fleurs = [[9, 9, 'fleurRose'], [15, 7, 'coeurFleur'], [21, 9, 'fleurRose'], [12, 4, 'cire'], [19, 4, 'beret'], [6, 14, 'cire'], [24, 14, 'coeurFleur']];
    for (const [x, y, m] of fleurs) { for (let k = 0; k < 5; k++) { const a = k * 1.256; t.forme(m, ellipsoide(x + Math.cos(a) * 1.7, y + Math.sin(a) * 1.7, 1.4, 1.4), { decalage: 0.3 }); } t.poser(x, y, 'coeurFleur', 5); }
    t.forme('ruban2', (x, y) => (y >= 20 && y <= 22 && Math.abs(x + 0.5 - 15) <= 3 ? [0, 0, 1] : null), { decalage: 0.3 });
    trait(t, 'ruban2', 13, 22, 10, 26, 0.7); trait(t, 'ruban2', 17, 22, 20, 26, 0.7);
  };
  fabriquer('evt_bouquet', 30, 28, bouquet);
  // Le carnet noir de l'espion, frappé d'un œil de paon doré
  fabriquer('evt_carnet', 22, 16, t => {
    t.rampes.carnet = rampe(0x24222a); t.rampes.paon = rampe(0x2a8a8a);
    t.forme('carnet', (x, y) => (x >= 0 && x <= 21 && y >= 0 && y <= 15 ? [(x - 10.5) / 12, (y - 7.5) / 9, 0.7] : null));
    for (let y = 1; y < 15; y++) t.poser(19, y, 'cire', 4);
    t.forme('or', ellipsoide(9, 7.5, 3.6, 4.4), { decalage: 0.2 }); t.forme('paon', ellipsoide(9, 8, 2.4, 3), { decalage: 0.2 }); t.forme('encre', ellipsoide(9, 8.4, 1.2, 1.5), { decalage: 0.6 });
  });
  // La balance de l'inspecteur (un trébuchet de laiton) et ses poids
  fabriquer('evt_balance', 44, 36, t => {
    t.forme('laiton', (x, y) => (y >= 4 && y <= 32 && Math.abs(x + 0.5 - 22) <= 1.2 ? [(x + 0.5 - 22) / 1.3, 0, 0.8] : null));
    t.forme('cheneSombre', (x, y) => (y >= 32 && y <= 35 && Math.abs(x + 0.5 - 22) <= 9 - (y - 32) * -0.5 ? [(x + 0.5 - 22) / 10, -0.5, 0.7] : null), { decalage: 0.2 });
    trait(t, 'laiton', 5, 7, 39, 5, 1.1, { decalage: 0.3 });
    t.forme('laiton', ellipsoide(22, 5, 2.2, 2.2), { decalage: 0.5 });
    for (const [x, y] of [[6, 7], [38, 5]]) { trait(t, 'fer', x, y, x - 4, y + 14, 0.4); trait(t, 'fer', x, y, x + 4, y + 14, 0.4); t.forme('laiton', (xx, yy) => (yy >= y + 14 && yy <= y + 16 && Math.abs(xx + 0.5 - x) <= 5.5 - (yy - y - 14) * 1.2 ? [(xx + 0.5 - x) / 6, 0.4, 0.8] : null)); }
    t.forme('fer', (x, y) => (x >= 34 && x <= 41 && y >= 15 && y <= 18 ? [(x - 37.5) / 4, -0.5, 0.7] : null), { decalage: 0.2 });
    t.forme('fer', (x, y) => (x >= 36 && x <= 39 && y >= 12 && y <= 14 ? [(x - 37.5) / 2, -0.5, 0.7] : null), { decalage: 0.4 });
  });
  // Les objets du troc
  const troc = [
    t => { t.forme('laiton', ellipsoide(10, 10, 8.5, 8.5)); t.forme('cire', ellipsoide(10, 10, 6.4, 6.4), { decalage: 0.3 }); trait(t, 'cuirRouge', 10, 10, 13, 4.5, 0.8); trait(t, 'encre', 10, 10, 7, 15.5, 0.7); t.forme('laiton', ellipsoide(10, 10, 1.2, 1.2), { decalage: 0.5 }); t.forme('laiton', ellipsoide(10, 1.2, 1.8, 1.4)); },
    t => { t.forme('pierre', ellipsoide(10, 11, 6.5, 8.5), { motif: (x, y) => (hachage(x, y, 91) > 0.85 ? -0.8 : 0) }); t.forme('flamme', ellipsoide(12, 8, 1.2, 1.6), { decalage: -0.8, ombre: false }); },
    t => { t.forme('laiton', (x, y) => { const d = Math.hypot(x + 0.5 - 6, y + 0.5 - 6); return d >= 2 && d <= 4.6 ? [(x - 6) / 5, (y - 6) / 5, 0.7] : null; }); trait(t, 'laiton', 9, 9, 17, 17, 1); for (const [x, y] of [[14, 17], [16, 15], [15, 18]]) t.poser(x, y, 'laiton', 3); },
    t => { t.forme('verre', (x, y) => (y >= 6 && y <= 18 && Math.abs(x + 0.5 - 10) <= 5 - Math.max(0, 9 - y) * 0.8 ? [(x + 0.5 - 10) / 5, 0, 0.8] : null), { decalage: 0.2 }); t.forme('flamme', ellipsoide(10, 14, 3.6, 3.4), { decalage: 0.3, ombre: false }); t.forme('chene', (x, y) => (y >= 2 && y <= 5 && Math.abs(x + 0.5 - 10) <= 2.2 ? [0, -0.5, 0.8] : null)); },
    t => { t.forme('fer', (x, y) => (y >= 3 && y <= 18 && Math.abs(x + 0.5 - 9) <= 5.5 ? [(x + 0.5 - 9) / 6, 0, 0.8] : null), { motif: (x, y) => (y === 6 || y === 15 ? -0.8 : 0) }); t.forme('fer', (x, y) => { const d = Math.hypot(x + 0.5 - 15.5, y + 0.5 - 10.5); return d >= 2 && d <= 3.6 && x > 14 ? [0.8, 0, 0.6] : null; }); t.forme('cire', ellipsoide(9, 3.4, 5.4, 1.2), { decalage: 0.5, ombre: false }); },
  ];
  troc.forEach((d, i) => fabriquer('evt_troc' + i, 20, 20, d));
  // Le petit baluchon pour jouer (un vieux mouchoir noué au bout d'un bâton)
  fabriquer('evt_baluchonJouet', 26, 20, t => {
    t.rampes.carreaux = rampe(0xa83a3a);
    trait(t, 'chene', 1, 19, 22, 3, 0.8);
    t.forme('carreaux', ellipsoide(19, 8, 6.5, 5.5), { motif: (x, y) => ((Math.floor(x / 2) + Math.floor(y / 2)) % 2 ? 0.7 : -0.3) });
    t.forme('carreaux', polygoneHD([[18, 2], [22, 0], [21, 4]]), { decalage: -0.2 });
  });
  // La lettre de Garrick, au sceau de cire verte frappé d'une feuille de chêne
  fabriquer('evt_lettreGarrick', 26, 18, t => {
    t.rampes.cireVerte = rampe(0x3a6a2a);
    for (let y = 0; y < 18; y++) for (let x = 0; x < 26; x++) t.poser(x, y, 'parchemin', x === 25 || y === 17 ? 2 : 4 - (Math.abs(y - 1 - x * 0.62) < 0.6 || Math.abs(y - 1 - (25 - x) * 0.62) < 0.6 ? 2 : 0));
    t.forme('cireVerte', ellipsoide(13, 10, 3.6, 3.4), { decalage: 0.4 });
    t.poser(13, 9, 'feuille', 5); t.poser(12, 10, 'feuille', 4); t.poser(14, 10, 'feuille', 4); t.poser(13, 11, 'feuille', 3);
  });
  // La berceuse : une vieille page de musique pliée en quatre
  fabriquer('evt_berceuse', 26, 20, t => {
    for (let y = 0; y < 20; y++) for (let x = 0; x < 26; x++) t.poser(x, y, 'cire', x === 25 || y === 19 ? 2 : x === 13 ? 2 : 4);
    for (const y0 of [3, 11]) for (let k = 0; k < 4; k++) for (let x = 2; x < 24; x++) if (x !== 13) t.poser(x, y0 + k * 2, 'parchemin', 2);
    for (const [x, y] of [[4, 6], [8, 5], [11, 7], [16, 5], [20, 6], [5, 13], [10, 12], [18, 14], [22, 13]]) { t.poser(x, y, 'encre', 0); t.poser(x + 1, y, 'encre', 0); t.poser(x + 1, y - 1, 'encre', 1); t.poser(x + 1, y - 2, 'encre', 1); }
  });
  // Ce que le chat rapporte : un bouton d'argent, une plume
  fabriquer('evt_bouton', 9, 9, t => { t.rampes.argent = rampe(0xb8c0cc); t.forme('argent', ellipsoide(4.5, 4.5, 4, 4)); for (const [x, y] of [[3, 3], [5, 3], [3, 5], [5, 5]]) t.poser(x, y, 'argent', 0); });
  fabriquer('evt_plume', 16, 7, t => { traitHD(t, 'plume', [[1, 5], [6, 3], [12, 2], [15, 1]], 1.6, 0.3); for (let x = 2; x < 14; x++) t.poser(x, Math.round(5 - x * 0.28), 'cire', 1); });
  // Le petit tonneau où Célestin attend, au coin de la fenêtre
  fabriquer('evt_tonneau', 20, 22, t => {
    t.forme('chene', (x, y) => (y >= 1 && y <= 21 && Math.abs(x + 0.5 - 10) <= 8 + Math.sin((y - 1) / 20 * Math.PI) * 1.6 ? [(x + 0.5 - 10) / 9.6, 0, 0.8] : null), { motif: x => (x % 4 === 0 ? -0.7 : 0) });
    for (const y of [4, 5, 16, 17]) for (let x = 0; x < 20; x++) if (t.mat(x, y)) t.poser(x, y, 'fer', y % 2 ? 2 : 4);
    t.forme('cheneSombre', ellipsoide(10, 1.5, 8, 1.6), { decalage: 0.6, ombre: false });
  });
  // Une note de musique (la chanson de la barde)
  fabriquer('evt_note', 8, 11, t => { t.forme('encre', ellipsoide(2.6, 8.6, 2.4, 1.8), { decalage: 1.5 }); for (let y = 1; y < 9; y++) t.poser(4, y, 'encre', 3); t.poser(5, 1, 'encre', 3); t.poser(6, 2, 'encre', 3); t.poser(7, 3, 'encre', 3); });
}

// --- Célestin à l'atelier (l'enfant perdu, devenu apprenti) : assis sur une caisse au pied du râtelier, il reprise ---
// Ses gestes, comme ceux de Brann : piquer l'aiguille, passer, tirer le fil bien haut, serrer le point.
BRAS_ATELIER.celestin = {
  piquer: { pres: [[0.9, 8, 0.5], [0.35, 15, 0.92]], loin: [[1.0, 6, 0.45], [0.55, 16, 0.95]] },
  passer: { pres: [[0.95, 8, 0.45], [0.45, 14, 0.8]], loin: [[1.0, 6, 0.45], [0.55, 16, 0.95]] },
  tirer: { pres: [[1.25, 2, 0.3], [1.05, 6, -2]], loin: [[1.0, 6, 0.45], [0.55, 16, 0.95]] },
  serrer: { pres: [[1.2, 2, 0.4], [1.0, 9, 0.35]], loin: [[1.0, 7, 0.4], [0.6, 17, 0.9]] },
};
ASSIS_ATELIER.celestin = true;
function meubleCelestin() {
  const t = toileAtelier(92, 88);
  planche(t, 6, 74, 24, 13, 'chene', { horizontale: true, graine: 381, noeuds: 1 });   // la caisse où il s'assoit
  for (const x of [6, 29]) for (let y = 74; y < 87; y++) t.poser(x, y, 'cheneSombre', 2);
  for (let x = 6; x < 30; x++) { t.poser(x, 74, 'chene', 5); t.poser(x, 80, 'cheneSombre', 1); }
  // le panier à ouvrage, à ses pieds : les pelotes
  t.rampes.osier = rampe(0xb08a4a); t.rampes.pelote = rampe(0x8a3a3a); t.rampes.pelote2 = rampe(0x3a5a8a);
  t.forme('pelote', ellipsoide(42, 79, 3, 2.6), { decalage: 0.3 }); t.forme('pelote2', ellipsoide(47, 80, 2.6, 2.2), { decalage: 0.3 });
  t.forme('osier', (x, y) => (y >= 80 && y <= 87 && Math.abs(x + 0.5 - 44.5) <= 7 - (y - 80) * 0.3 ? [(x + 0.5 - 44.5) / 7, 0, 0.8] : null), { motif: (x, y) => ((x + (y % 4 < 2 ? 0 : 2)) % 4 < 2 ? 0.5 : -0.4) });
  t.contour();
  return t;
}
function teteToileEvt(t, cy) {
  const d = new Uint8ClampedArray(t.l * t.h * 4);
  for (let p = 0; p < t.l * t.h; p++) if (t.c[p] !== null) d[p * 4 + 3] = 255;
  return teteCorpsEvt(d, t.l, t.h, cy);
}
function posteCelestin(etape) {
  const meuble = agrandirAtelier(meubleCelestin());
  const outils = toileAtelier(POSTE_L, POSTE_H); outils.rampes.fil = rampe(0xe8dcb4); outils.rampes.cape = rampe(0x6a5a8a); outils.rampes.piece = rampe(0x8a6a3a);
  if (etape === 'vide') { outils.contour(); return fusionAtelier([[meuble], [outils]]); }
  const corps = corpsReparateur('celestin', etape === 'repos' ? null : etape);
  const H = teteToileEvt(corps, corps.reperes.cy); if (H) { peindreCoiffe(corps, 'casquette', H); corps.contour(); }
  const oxC = 14, oyC = POSTE_SOL - (corps.piedsAssis ?? corps.h - 1) - 1;
  const { ML, MP } = mainsPoste(corps, oxC, oyC);
  // la cape trouée posée sur ses genoux, la pièce qu'il y coud, et le fil
  const gx = ML[0] + 2, gy = ML[1] + 4;
  outils.forme('cape', (x, y) => (y >= gy - 2 && y <= gy + 12 && x >= gx - 16 + (y - gy) * 0.4 && x <= gx + 12 - (y - gy) * 0.2 ? [(x - gx) / 16, (y - gy) / 12, 0.8] : null), { motif: (x, y) => ((x + y * 2) % 7 === 0 ? -0.6 : 0) });
  outils.forme('piece', (x, y) => (x >= gx - 6 && x <= gx + 2 && y >= gy && y <= gy + 6 ? [0, -0.3, 0.9] : null), { decalage: 0.2 });
  const point = [gx - 6 + ({ piquer: 2, passer: 3, tirer: 4, serrer: 4 }[etape] ?? 1) * 2, gy];
  for (let i = 0; i < 4; i++) outils.poser(gx - 6 + i * 2, gy, 'fil', 4);
  const fil = (a, b) => { const n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]))); for (let i = 0; i <= n; i++) outils.poser(Math.round(a[0] + (b[0] - a[0]) * i / n), Math.round(a[1] + (b[1] - a[1]) * i / n), 'fil', 4); };
  if (etape === 'piquer') trait(outils, 'metal', MP[0], MP[1], point[0], point[1] + 1, 0.5);
  if (etape === 'passer' || etape === 'tirer' || etape === 'serrer') { fil(point, MP); trait(outils, 'metal', MP[0], MP[1], MP[0] + 3, MP[1] - 3, 0.45); }
  outils.contour();
  const avant = toileAtelier(POSTE_L, POSTE_H);
  if (etape !== 'repos') { poingAtelier(avant, corps, ML, 1.7); poingAtelier(avant, corps, MP, 1.6); }
  avant.contour();
  const fx = toileAtelier(POSTE_L, POSTE_H); fx.rampes.fil = outils.rampes.fil;
  if (etape === 'tirer') for (const d of [4, 9]) fx.poser(Math.round(point[0] + (MP[0] - point[0]) * d / 14), Math.round(point[1] + (MP[1] - point[1]) * d / 14), 'fil', 5);   // le fil tendu brille
  if (etape === 'piquer') eclatAtelier(fx, point[0] + 1, point[1] - 1, 1);
  return fusionAtelier([[meuble], [corps, oxC, oyC], [outils], [avant], [fx]]);
}
GESTES_ATELIER.celestin = { dessin: posteCelestin, images: ['piquer', 'passer', 'tirer', 'serrer'], durees: { piquer: 260, passer: 240, tirer: 420, serrer: 260 },
  boucle: () => ['piquer', 'passer', 'tirer', 'serrer', 'piquer', 'passer', 'tirer', 'serrer', 'piquer', 'passer', 'tirer', 'tirer', 'serrer'] };
// Dans la pièce de l'atelier (AtelierScene.piece, et la promenade du soir) : son coin au pied du râtelier, s'il est embauché
function posteCelestinAtelier(scene, conteneur, G) {
  if (!(G.employes || []).includes('celestin')) return null;
  const travail = scene.reparationDe && scene.reparationDe('celestin');
  const img = scene.add.image(-20, 52, texturePosteAtelier(scene, 'celestin', 'repos')).setOrigin(0);
  conteneur.add(img);
  if (travail && scene.gestes) scene.gestes.push(animerPosteAtelier(scene, img, 'celestin'));
  return img;
}
