// (v1.43, planche 70 validée) L'interface s'embellit avec la maison : cinq rangs de boutons qui suivent la façade
// (sapin brut, chêne et laiton, cabochons, acajou et or serti, ébène et or), et une pierre précieuse par sujet
// (saphir : toi, topaze : le client, émeraude : ta réserve, rubis : tes actions, améthyste : l'étrange).
const RAMPES_PIERRES = {
  rubis: [0x2a0408, 0x5a0a14, 0x9a1424, 0xd02a3a, 0xf06a70, 0xffd0d0],
  emeraude: [0x03200e, 0x084420, 0x0e7038, 0x1ea054, 0x56d086, 0xc4ffdc],
  saphir: [0x050a2e, 0x0c1c5e, 0x163496, 0x2a58d0, 0x6a94f0, 0xd0e0ff],
  topaze: [0x3a1404, 0x6e2a08, 0xa84a10, 0xe0761c, 0xf8a848, 0xffe4b0],
  amethyste: [0x1a0828, 0x36124e, 0x5a2280, 0x8840b4, 0xb87ae0, 0xf0d8ff],
  or: [0x3a2404, 0x6e4a0a, 0xa87818, 0xd8a830, 0xf4d464, 0xfff6c8],
  acajou: [0x1c0806, 0x36110b, 0x561e13, 0x762e1e, 0x94422c, 0xb45e44],
  ebene: [0x07060a, 0x100e13, 0x1a181f, 0x26242c, 0x37353f, 0x54525c],
  sapin: [0x3a2a18, 0x6a5030, 0x94744a, 0xb89668, 0xd2b488, 0xe6d0a8],
  perle: [0x6a6670, 0x9a96a2, 0xc4c0cc, 0xe0dce6, 0xf2eef6, 0xffffff],
};
const PIERRES = {
  saphir: { nom: 'Saphir', sujet: 'toi : ta maison, tes comptes, ta carte, dormir' },
  topaze: { nom: 'Topaze', sujet: 'le client : inspecter, marchander, miser' },
  emeraude: { nom: 'Émeraude', sujet: 'ta réserve : le marché, l’express, l’arrière-boutique' },
  rubis: { nom: 'Rubis', sujet: 'tes actions au comptoir : servir, attendre, refuser, remettre' },
  amethyste: { nom: 'Améthyste', sujet: 'l’étrange : la diseuse, la nymphe, la porte dérobée' },
};
const RANGS = [
  { nom: 'Chaumière', quand: 'au début' },
  { nom: 'Échoppe', quand: 'façade 1 (4 améliorations)' },
  { nom: 'Maison', quand: 'façade 2 (8 améliorations)' },
  { nom: 'Belle maison', quand: 'façade 3 (12 améliorations)' },
  { nom: 'Demeure', quand: 'l’étage bâti (l’appartement)' },
];
// Le rang de l'interface pour la partie en cours : la façade (0 à 3), l'appartement de l'étage (4).
// Les écrans d'avant la partie (titre, création) gardent les boutons de toujours (rang 1).
const SCENES_SANS_RANG = ['Titre', 'Intro', 'IntroHistoire', 'Boot', 'Chargement'];
function rangInterface(scene) {
  const G = window.GAME;
  if (!G || !G.ameliorations || (scene && SCENES_SANS_RANG.includes(scene.scene.key))) return 1;
  if (typeof etageA === 'function' && etageA(G, 'appartement')) return 4;
  return typeof niveauFacade === 'function' ? niveauFacade(G) : 1;
}
function toilePierres(l, h) { const t = toileDecor(l, h); Object.assign(t.rampes, RAMPES_PIERRES); return t; }

// Une pierre taillée (octogone : la table au centre, les facettes de la couronne autour), sertie d'or
function pierreTaillee(t, cx, cy, r, mat, { serti = true, griffes = true } = {}) {
  if (serti) t.forme('or', (x, y) => { const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy); return d <= r + 1.2 && d > r - 0.2 ? [(x + 0.5 - cx) / (r + 1), (y + 0.5 - cy) / (r + 1), 0.6] : null; }, { bord: false });
  const oct = (x, y, rr) => { const dx = Math.abs(x), dy = Math.abs(y); return dx <= rr && dy <= rr && dx + dy <= rr * 1.42; };
  const pts = [];
  for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++) for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) {
    const px = x + 0.5 - cx, py = y + 0.5 - cy;
    if (!oct(px, py, r)) continue;
    let i;
    if (oct(px, py, r * 0.5)) i = px + py < -0.2 ? 4 : 3;                                  // la table : claire en haut à gauche
    else { const a = Math.atan2(py, px), k = Math.round(a / (Math.PI / 4));                // la facette (8 directions)
      const nx = Math.cos(k * Math.PI / 4), ny = Math.sin(k * Math.PI / 4);
      const lum = (nx * LUMIERE[0] + ny * LUMIERE[1]) / Math.hypot(LUMIERE[0], LUMIERE[1]);
      i = lum > 0.75 ? 5 : lum > 0.3 ? 4 : lum > -0.3 ? 2 : lum > -0.75 ? 1 : 0;
      if (!oct(px, py, r - 0.9)) i = Math.max(0, i - 1); }                                 // l'arête
    pts.push([x, y, i]);
  }
  for (const [x, y, i] of pts) t.poser(x, y, mat, i);
  // l'éclat : un point blanc en haut à gauche de la table, un reflet en bas à droite
  t.poser(Math.round(cx - r * 0.35 - 0.5), Math.round(cy - r * 0.35 - 0.5), 'perle', 5);
  t.poser(Math.round(cx + r * 0.3 - 0.5), Math.round(cy + r * 0.45 - 0.5), mat, 5);
  if (serti && griffes) for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { t.poser(Math.round(cx + sx * r * 0.72 - 0.5), Math.round(cy + sy * r * 0.72 - 0.5), 'or', sy < 0 ? 5 : 3); }
}
// Un cabochon (pierre polie en dôme), dans un chaton de laiton
function cabochon(t, cx, cy, r, mat) {
  t.forme('laiton', (x, y) => { const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy); return d <= r + 1 && d > r - 0.3 ? [(x + 0.5 - cx) / (r + 1), (y + 0.5 - cy) / (r + 1), 0.6] : null; }, { bord: false });
  t.forme(mat, (x, y) => { const dx = (x + 0.5 - cx) / r, dy = (y + 0.5 - cy) / r, d = dx * dx + dy * dy; return d <= 1 ? [dx, dy, Math.sqrt(1 - d) + 0.2] : null; });
  t.poser(Math.round(cx - r * 0.4 - 0.5), Math.round(cy - r * 0.45 - 0.5), 'perle', 5);
}

// Le cadre d'un bouton ou d'un panneau selon le rang de la maison
function cadreRang(t, l, h, rang, fond, enfonce, gemme) {
  const sombre = rang >= 4 ? 'ebene' : rang >= 3 ? 'acajou' : 'cheneSombre';
  const filet = rang >= 3 ? 'or' : rang >= 1 ? 'laiton' : null;
  for (let y = 0; y < h; y++) for (let x = 0; x < l; x++) {
    const d = Math.min(x, y, l - 1 - x, h - 1 - y), lumiere = (d === y || d === x) !== enfonce;
    if (d === 0) t.poser(x, y, sombre, 0);
    else if (d <= 2) {
      if (rang >= 4 && d === 1) t.poser(x, y, 'or', lumiere ? 4 : 2);                   // la moulure dorée
      else if (rang === 0) t.poser(x, y, 'cheneSombre', lumiere ? 3 + (hachage(x, y, 5) < 0.3 ? 1 : 0) : 1);   // le bois brut, inégal
      else t.poser(x, y, sombre, lumiere ? 6 - d : 1 + d);
    }
    else if (d === 3 && filet) t.poser(x, y, filet, lumiere ? (rang >= 4 ? 4 : 3) : 2);
    else if (d === 3 && !filet) t.poser(x, y, fond, lumiere ? 2 : 1);
    else if (d === 4 && (d === y || d === x)) t.poser(x, y, fond, enfonce ? 0 : 1);
    else if (enfonce && d === 5 && d === y) t.poser(x, y, fond, 1);
  }
  // les coins
  const coins = [[0, 0, 1, 1], [l - 1, 0, -1, 1], [0, h - 1, 1, -1], [l - 1, h - 1, -1, -1]];
  for (const [cx, cy, sx, sy] of coins) {
    if (rang === 0) {   // une équerre de fer, un clou
      for (let j = 0; j < 5; j++) for (let k = 0; k < 5; k++) if (j < 2 || k < 2) t.poser(cx + sx * k, cy + sy * j, 'fer', (sy > 0 && j === 0) || (sx > 0 && k === 0) ? 4 : 2);
      t.poser(cx + sx * 1, cy + sy * 1, 'fer', 0); t.poser(cx + sx * 1 - (sx > 0 ? 0 : 0), cy + sy * 1, 'fer', 5);
      continue;
    }
    const met = rang >= 3 ? 'or' : 'laiton';
    for (let j = 0; j < 6; j++) for (let k = 0; j + k < 6; k++) {
      const bord = j + k === 5 || j === 0 || k === 0;
      t.poser(cx + sx * k, cy + sy * j, met, bord ? (sy > 0 && j === 0 || sx > 0 && k === 0 ? 4 : 1) : 3);
    }
    if (rang >= 4 && gemme) pierreTaillee(t, cx + sx * 2.5, cy + sy * 2.5, 1.6, gemme, { serti: false });
    else { t.poser(cx + sx * 2, cy + sy * 2, met, 5); t.poser(cx + sx * 3, cy + sy * 2, met, 1); t.poser(cx + sx * 2, cy + sy * 3, met, 1); }
  }
}

// La plaque d'un bouton : rang 0 (sapin brut) … 4 (ébène et or, pierres taillées)
function plaqueRang(scene, largeur, rang, gemme = null, une = false) {
  if (rang === 1 && !gemme) return plaqueBouton(scene, largeur);
  const cle = `plaqueR${rang}_${gemme || 'nue'}${une ? '1' : ''}_${Math.round(largeur)}`;
  if (scene.textures.exists(cle)) return cle;
  const l = Math.max(14, Math.round(largeur / 2)), h = 20;
  const fond = rang >= 4 ? 'ebene' : rang >= 3 ? 'acajou' : rang === 0 ? 'sapin' : 'chene';
  for (const etat of ['', '_clair', '_enfonce']) {
    const t = toilePierres(l, h), clair = etat === '_clair', enfonce = etat === '_enfonce';
    if (clair) for (const m of [fond, 'laiton', 'or', 'cheneSombre', 'acajou', 'ebene']) t.rampes[m] = RAMPES_PIERRES[m] ? RAMPES_PIERRES[m].map((c, i, r) => r[Math.min(5, i + 1)]) : RAMPES_DECOR[m].map((c, i, r) => r[Math.min(5, i + 1)]);
    planche(t, 4, 4, l - 8, h - 8, fond, { graine: l + 7 + rang, noeuds: rang === 0 ? 2 : 0 });
    cadreRang(t, l, h, rang, fond, enfonce, gemme);
    if (gemme && rang === 2) { cabochon(t, 9, h / 2, 2.4, gemme); if (!une) cabochon(t, l - 9, h / 2, 2.4, gemme); }
    if (gemme && rang >= 3) { pierreTaillee(t, 10, h / 2, rang >= 4 ? 3.7 : 3.2, gemme); if (!une) pierreTaillee(t, l - 10, h / 2, rang >= 4 ? 3.7 : 3.2, gemme); }
    t.texture(scene, cle + etat);
  }
  return cle;
}
// Une pierre seule (coins des panneaux, vignettes) : texture de d × d
function pierreSeule(scene, mat, d = 15, rang = 3) {
  const cle = `pierreSeule_${mat}_${d}_${rang}`;
  if (scene.textures.exists(cle)) return cle;
  const t = toilePierres(d, d);
  if (rang === 2) cabochon(t, d / 2, d / 2, d / 2 - 1.6, mat); else pierreTaillee(t, d / 2, d / 2, d / 2 - 1.8, mat);
  t.texture(scene, cle); return cle;
}
// Une étincelle qui scintille sur une pierre (rang 4, et le bouton principal)
function etincelle(scene, x, y, prof = 6) {
  const g = scene.add.graphics().setDepth(prof);
  g.fillStyle(0xffffff, 1).fillRect(-0.5, -4, 1, 8).fillRect(-4, -0.5, 8, 1).fillStyle(0xffffff, 0.8).fillRect(-1, -1, 2, 2);
  g.setPosition(x, y).setScale(0.3);
  scene.tweens.add({ targets: g, scale: 1.1, alpha: { from: 1, to: 0.2 }, angle: 45, duration: 700, yoyo: true, repeat: -1, repeatDelay: 1600, delay: Math.random() * 1500 });
  return g;
}
// Une pierre sur un coin de panneau (cadre déjà dessiné) : une image à poser par-dessus
function coinPierre(scene, x, y, mat, rang, prof = 3) {
  if (rang < 2) return null;
  return scene.add.image(x, y, pierreSeule(scene, mat, rang >= 4 ? 11 : 9, rang)).setScale(2).setDepth(prof);
}

// La pierre de chaque bouton, selon ce qu'il fait
function pierreDe(texte) {
  const t = texte.toLowerCase();
  if (/ouvrir le comptoir|refuser|attente|remettre|servir|choisir sa destination|baluchon|accepter|donner|merci|au revoir/.test(t)) return 'rubis';
  if (/express|grippesou|coursier|arrière|marché|réserve|agrandir|étal/.test(t)) return 'emeraude';
  if (/inspecter|marchander|miser/.test(t)) return 'topaze';
  if (/porte dérobée|diseuse|nymphe|étrange/.test(t)) return 'amethyste';
  return 'saphir';   // toi : ta maison, ton bureau, ta banque, ta carte, dormir, se promener...
}

// Une plaque seule (une étiquette, une enseigne cliquable) au rang de la maison : { cle, decal, place }
// `decal` : de combien pousser le texte à droite (une seule pierre, à gauche) ; `place` : la largeur pour le texte.
function plaqueDuRang(scene, largeur, gemme, une = true) {
  const rang = typeof rangInterface === 'function' ? rangInterface(scene) : 1;
  const avec = rang >= 2 && !!gemme;
  return {
    cle: rang === 1 && !avec ? plaqueBouton(scene, largeur) : plaqueRang(scene, largeur, rang, avec ? gemme : null, une),
    decal: avec && une ? (rang >= 3 ? 13 : 9) : 0,
    place: largeur - (avec ? (une ? (rang >= 3 ? 42 : 30) : (rang >= 3 ? 64 : 52)) : 16),
  };
}
