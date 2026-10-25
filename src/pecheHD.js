// (v1.45, planche 71 v2 validée) Les dessins de la pêche : les poissons de l'étang et leur légende, les prises étranges,
// les cannes de chaque peuple (une forme, une longueur, une façon de pêcher), le bouchon, la cabane de Barnabé au bout
// du marché, le chat qui danse, et l'écran « nouvel objet » (pour tout objet unique du jeu).
const RAMPES_PECHE = {
  argentP: [0x2a3440, 0x56626e, 0x8a96a2, 0xb8c2ca, 0xdce4ea, 0xf8fcff],
  rougeN: [0x4a0e08, 0x7e1e10, 0xb03a1e, 0xd85a2a, 0xf08a4a, 0xffc090],
  perche: [0x1e2a0a, 0x3a4e14, 0x5e7424, 0x86983a, 0xb4b85a, 0xe0dc90],
  barre: [0x0e1406, 0x1a240c, 0x2a3814, 0x3a4a1e, 0x4e5e2a, 0x6a7a3a],
  tanche: [0x141a06, 0x28320e, 0x404a18, 0x5a6424, 0x7a8434, 0xa4aa58],
  brochet: [0x101c0c, 0x203418, 0x345226, 0x4e7036, 0x6e9048, 0x9ab468],
  taches: [0x8a8a3a, 0xaaa84e, 0xc8c468, 0xe0dc84, 0xf0eca4, 0xfffcd0],
  anguille: [0x14100a, 0x2a2214, 0x42361e, 0x5e4c2a, 0x7e6a3e, 0xa89060],
  carpe: [0x2a1608, 0x4e2c10, 0x7a4a1c, 0xa46c2c, 0xc8923e, 0xe8bc64],
  orP: [0x5a3404, 0x8a560a, 0xc08414, 0xe8ac24, 0xfad050, 0xfff0a0],
  vieille: [0x1a1c14, 0x34362a, 0x4e4e3a, 0x6a6848, 0x8a865c, 0xb0aa7c],
  lichen: [0x2a3a1a, 0x3e5a24, 0x5a7a30, 0x7e9a40, 0xa4b85a, 0xd0dc88],
  oeilB: [0x404040, 0x8a8a8a, 0xc0c0c0, 0xe0e0e0, 0xf4f4f4, 0xffffff],
  oeilLaiteux: [0x6a7078, 0x98a0a8, 0xbcc4cc, 0xd4dce2, 0xe6ecf0, 0xf8fcff],
  verre: [0x0a2414, 0x14402a, 0x226a40, 0x38985a, 0x64c47e, 0xb0f0c0],
  papier: [0x8a7a5a, 0xb8a47c, 0xd8c69c, 0xece0bc, 0xf6eed6, 0xfffaf0],
  bronzeP: [0x2a1a08, 0x4a3012, 0x6e4a1e, 0x94682e, 0xb88a44, 0xdcb468],
  roseau: [0x3a3010, 0x5e5020, 0x86763a, 0xae9e58, 0xd0c27c, 0xece2a8],
  noisetier: [0x2a1a0e, 0x4a3018, 0x6e4a26, 0x8e6436, 0xb08450, 0xd0a874],
  frene: [0x3a2a1a, 0x6a5232, 0x9a7e52, 0xc0a474, 0xdcc49a, 0xf0e0c0],
  bambou: [0x2a2a08, 0x4e5010, 0x7a7c1e, 0xa4a432, 0xcaca5a, 0xecec96],
  laque: [0x2a0606, 0x4e0c0c, 0x7a1414, 0xa42020, 0xc83a2e, 0xe86a50],
  argentE: [0x3a4450, 0x6a7686, 0x9aa6b6, 0xc4ced8, 0xe2e8ee, 0xffffff],
  ebene: [0x07060a, 0x100e13, 0x1a181f, 0x26242c, 0x37353f, 0x54525c],
  orFil: [0x3a2404, 0x6e4a0a, 0xa87818, 0xd8a830, 0xf4d464, 0xfff6c8],
  liege: [0x5a3a1a, 0x8a6030, 0xb08048, 0xc89a60, 0xdcb47c, 0xeed0a0],
  ligne: [0x8a8a8a, 0xb0b0b0, 0xd0d0d0, 0xe4e4e4, 0xf2f2f2, 0xffffff],
  filet: [0x3a3020, 0x5a4a30, 0x7a6644, 0x9a845a, 0xb8a274, 0xd4c094],
  cuirB: [0x1a0e06, 0x2e1a0c, 0x4a2c14, 0x664020, 0x84582e, 0xa47444],
  algue: [0x0e2a0e, 0x1a4418, 0x2a6026, 0x3e7c36, 0x5a9a4a, 0x84ba6a],
};
function toilePeche(l, h) { const t = toileObjet(l, h); Object.assign(t.rampes, RAMPES_PECHE); return t; }

// --- Un poisson de profil (la tête à gauche) ---
// corps : ellipse éclairée ; nageoires ; queue fourchue ; œil ; motifs (barres, taches, écailles)
function corpsPoisson(t, o) {
  const { cx, cy, rx, ry, mat, ventre = null, nag = 'rougeN', queue = 0.8, dos = 0.5, fourche = true } = o;
  // la queue
  const qx = cx + rx - 1.5, ql = rx * 0.55 * queue, qh = ry * 1.25;
  t.forme(nag, (x, y) => { const u = (x + 0.5 - qx) / ql; if (u < 0 || u > 1) return null; const d = Math.abs(y + 0.5 - cy); const lim = qh * (0.25 + 0.75 * u); if (d > lim) return null; if (fourche && u > 0.55 && d < lim * (u - 0.55) * 1.6) return null; return [0.2, (y + 0.5 - cy) / qh * 0.6, 0.8]; }, { decalage: -0.2 });
  // la nageoire du dos
  if (dos) t.forme(nag, (x, y) => { const u = (x + 0.5 - (cx - rx * 0.2)) / (rx * 0.75); if (u < 0 || u > 1) return null; const h = ry * dos * 1.3 * Math.sin(Math.PI * Math.pow(u, 0.6)) + 0.4; const yy = cy - ry * 0.85 - (y + 0.5); return yy > -0.5 && yy < h ? [0, -0.8, 0.5] : null; }, { decalage: -0.1 });
  // nageoire ventrale et anale
  for (const [px, l] of [[cx - rx * 0.05, 0.28], [cx + rx * 0.45, 0.22]]) t.forme(nag, (x, y) => { const u = (x + 0.5 - px) / (rx * l); if (u < 0 || u > 1) return null; const yy = (y + 0.5) - (cy + ry * 0.8); return yy > -0.5 && yy < ry * 0.55 * (1 - u) + 0.5 ? [0, 0.8, 0.5] : null; }, { decalage: -0.3 });
  // le corps
  t.forme(mat, (x, y) => { const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry; let d = nx * nx + ny * ny; if (nx < -0.4) d += (nx + 0.4) * (nx + 0.4) * 0.6; if (d > 1) return null; return [nx * 0.7, ny, Math.sqrt(Math.max(0, 1 - d)) + 0.25]; }, { motif: o.motif || null });
  if (ventre) t.forme(ventre, (x, y) => { const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry; return nx * nx + ny * ny <= 0.92 && ny > 0.35 && nx > -0.8 && nx < 0.75 ? [nx * 0.5, 0.9, 0.5] : null; }, { decalage: 0.6, bord: false, ombre: false });
  // l'opercule (la joue)
  for (let y = Math.round(cy - ry * 0.5); y <= Math.round(cy + ry * 0.5); y++) { const x = Math.round(cx - rx * 0.45 + Math.abs(y - cy) * 0.35); if (t.mat(x, y)) t.poser(x, y, mat, Math.max(0, t.teinte(x, y) - 2)); }
}
function oeilPoisson(t, x, y, { laiteux = false, rouge = false } = {}) {
  t.poser(x, y, laiteux ? 'oeilLaiteux' : rouge ? 'rougeN' : 'orP', laiteux ? 3 : 4); t.poser(x + 1, y, laiteux ? 'oeilLaiteux' : 'orP', 3);
  t.poser(x, y + 1, laiteux ? 'oeilLaiteux' : rouge ? 'rougeN' : 'orP', 2); t.poser(x + 1, y + 1, laiteux ? 'oeilLaiteux' : 'barre', laiteux ? 2 : 0);
  if (!laiteux) t.poser(x, y, 'oeilB', 5);
}
function texturePoisson(scene, id) {
  const cle = 'poissonHD_' + id; if (scene.textures.exists(cle)) return cle;
  let t;
  if (id === 'gardon') { t = toilePeche(32, 16); corpsPoisson(t, { cx: 13, cy: 8, rx: 11, ry: 4.4, mat: 'argentP', nag: 'rougeN', dos: 0.35, motif: (x, y) => ((x + y * 2) % 4 === 0 ? -0.35 : 0) }); oeilPoisson(t, 6, 7, { rouge: true }); }
  if (id === 'perche') { t = toilePeche(32, 18); corpsPoisson(t, { cx: 13, cy: 10, rx: 11, ry: 5, mat: 'perche', nag: 'rougeN', dos: 0.9, motif: (x, y) => (Math.floor((x - 5) / 3) % 2 === 0 && x > 7 && x < 22 && y < 13 ? -2.4 : 0.3) });
    for (let x = 9; x < 20; x += 2) t.poser(x, 3 + ((x / 2) % 2 ? 1 : 0), 'barre', 1);   // les épines de la dorsale
    oeilPoisson(t, 6, 8); }
  if (id === 'tanche') { t = toilePeche(32, 18); corpsPoisson(t, { cx: 13, cy: 9, rx: 11.5, ry: 5, mat: 'tanche', nag: 'tanche', fourche: false, queue: 0.75, motif: (x, y) => ((x * 3 + y) % 5 === 0 ? -0.4 : 0) }); oeilPoisson(t, 5, 8, { rouge: true }); t.poser(2, 10, 'tanche', 1); t.poser(1, 11, 'tanche', 1); }
  if (id === 'brochet') { t = toilePeche(40, 14); corpsPoisson(t, { cx: 17, cy: 7, rx: 15, ry: 3.8, mat: 'brochet', ventre: 'taches', nag: 'brochet', dos: 0, queue: 0.55, motif: (x, y) => (hachage(x, y, 71) > 0.82 && y < 9 ? 2.4 : 0) });
    t.forme('brochet', (x, y) => { const u = (x + 0.5 - 21) / 5; if (u < 0 || u > 1) return null; const yy = 3.6 - (y + 0.5); return yy > -0.5 && yy < 2.2 * (1 - u) + 0.5 ? [0, -0.8, 0.5] : null; }); // (la dorsale tout au fond, près de la queue)
    for (let x = 1; x < 7; x++) t.poser(x, 8, 'brochet', 0);   // la gueule en bec de canard
    oeilPoisson(t, 5, 5); }
  if (id === 'anguille') { t = toilePeche(44, 16);
    for (let k = 0; k <= 40; k++) { const x = 2 + k, y = 8 + Math.sin(k / 5.5) * 3.2, r = 2.4 - Math.max(0, k - 30) * 0.15; t.forme('anguille', (px, py) => { const dx = px + 0.5 - x, dy = py + 0.5 - y; return dx * dx + dy * dy <= r * r ? [dx / r * 0.4, dy / r, 0.7] : null; }, { bord: false, ombre: false }); }
    for (let k = 0; k <= 40; k++) { const x = 2 + k, y = Math.round(8 + Math.sin(k / 5.5) * 3.2 + 2); if (t.mat(x, y)) t.poser(x, y, 'taches', 2); const yh = Math.round(8 + Math.sin(k / 5.5) * 3.2 - 2); if (t.mat(x, yh)) t.poser(x, yh, 'anguille', 1); }
    oeilPoisson(t, 3, 7); }
  if (id === 'carpe' || id === 'carpeDoree') { t = toilePeche(32, 20); corpsPoisson(t, { cx: 13, cy: 11, rx: 11.5, ry: 6, mat: id === 'carpe' ? 'carpe' : 'orP', nag: id === 'carpe' ? 'carpe' : 'rougeN', dos: 0.55, motif: (x, y) => { const lx = (x + (Math.floor(y / 3) % 2) * 1.5) % 3, ly = y % 3; return lx < 0.6 || ly === 0 ? -0.8 : 0.15; } });
    t.poser(2, 13, 'carpe', 1); t.poser(1, 14, 'carpe', 1); t.poser(3, 14, 'carpe', 1);   // les barbillons
    oeilPoisson(t, 6, 9); }
  if (id === 'legende') {   // Grand-Mère Écaille : la carpe centenaire du Moulin
    t = toilePeche(52, 28);
    corpsPoisson(t, { cx: 21, cy: 15, rx: 18.5, ry: 9, mat: 'vieille', nag: 'vieille', dos: 0.6, motif: (x, y) => { const lx = (x + (Math.floor(y / 4) % 2) * 2) % 4, ly = y % 4; return (lx < 0.7 || ly === 0 ? -0.9 : 0.2) + (fbm(x * 0.3, y * 0.3, 5) > 0.62 ? 1.2 : 0); } });
    // le lichen sur le dos, une vieille cicatrice
    t.forme('lichen', (x, y) => { const nx = (x + 0.5 - 21) / 18.5, ny = (y + 0.5 - 15) / 9; return nx * nx + ny * ny < 1 && ny < -0.45 && fbm(x * 0.35, y * 0.35, 9) > 0.5 ? [0, -1, 0.6] : null; }, { bord: false, ombre: false });
    for (let k = 0; k < 7; k++) t.poser(24 + k, 12 + Math.round(k * 0.6), 'vieille', 0);
    oeilPoisson(t, 8, 12, { laiteux: true });
    // l'anneau d'or du meunier, pris dans la lèvre
    for (const [x, y, i] of [[2, 17, 4], [2, 18, 3], [3, 19, 2], [4, 19, 2], [5, 18, 3], [5, 17, 4], [4, 16, 5], [3, 16, 5]]) t.poser(x, y, 'orP', i);
    t.poser(3, 21, 'vieille', 1); t.poser(2, 22, 'vieille', 1); t.poser(5, 21, 'vieille', 1); t.poser(5, 22, 'vieille', 1);
  }
  t.contour(); t.texture(scene, cle); return cle;
}
// --- Les prises étranges du Comté ---
function texturePrise(scene, id) {
  const cle = 'priseHD_' + id; if (scene.textures.exists(cle)) return cle;
  const t = toilePeche(24, 24);
  if (id === 'botte') {
    t.forme('cuirB', (x, y) => (x >= 7 && x <= 14 && y >= 2 && y <= 17 ? [(x - 10.5) / 5, 0, 0.8] : null));
    t.forme('cuirB', (x, y) => { const dx = (x + 0.5 - 13) / 9, dy = (y + 0.5 - 18.5) / 3.5; return dx * dx + dy * dy <= 1 && x >= 7 ? [dx * 0.5, dy, 0.6] : null; });
    for (let x = 6; x < 22; x++) t.poser(x, 22, 'cuirB', 0);
    for (let x = 6; x < 16; x++) t.poser(x, 3, 'cuirB', 4);
    for (const [x, y] of [[7, 5], [6, 6], [6, 7], [7, 8], [15, 4], [16, 5], [16, 6], [12, 19], [13, 20], [11, 20]]) t.poser(x, y, 'algue', 3);
    t.poser(18, 15, 'argentP', 4); t.poser(19, 14, 'argentP', 3);   // une goutte d'eau
  }
  if (id === 'bouteille') {
    t.forme('verre', (x, y) => { const dx = (x + 0.5 - 12) / 5; return y >= 9 && y <= 21 && Math.abs(dx) <= 1 ? [dx, 0, 0.8] : null; });
    t.forme('verre', (x, y) => (Math.abs(x + 0.5 - 12) <= 1.6 && y >= 3 && y <= 9 ? [(x + 0.5 - 12) / 2, 0, 0.8] : null));
    t.forme('liege', (x, y) => (Math.abs(x + 0.5 - 12) <= 1.8 && y >= 1 && y <= 3 ? [0, -0.5, 0.8] : null));
    t.forme('papier', (x, y) => (x >= 10 && x <= 13 && y >= 11 && y <= 19 ? [(x - 11.5) / 2, 0, 0.8] : null), { decalage: -0.4, bord: false });
    for (let y = 12; y < 19; y += 2) t.poser(11, y, 'cuirB', 2);   // le message roulé, ficelé
    for (let y = 10; y < 20; y++) t.poser(9, y, 'verre', 5);       // le reflet du verre
  }
  if (id === 'piece') {
    t.forme('bronzeP', (x, y) => { const dx = (x + 0.5 - 12) / 8, dy = (y + 0.5 - 12) / 8; return dx * dx + dy * dy <= 1 ? [dx * 0.4, dy * 0.4, 0.9] : null; }, { motif: (x, y) => (fbm(x * 0.5, y * 0.5, 3) > 0.62 ? -1.2 : 0) });
    for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2; t.poser(Math.round(12 + Math.cos(a) * 6), Math.round(12 + Math.sin(a) * 6), 'bronzeP', 1); }
    for (const [x, y] of [[10, 9], [11, 9], [12, 9], [13, 10], [12, 11], [11, 12], [12, 13], [13, 14], [11, 14]]) t.poser(x, y, 'bronzeP', 5);   // un profil de roi, effacé
    for (const [x, y] of [[8, 15], [9, 16], [15, 9], [16, 10]]) t.poser(x, y, 'algue', 2);   // le vert-de-gris
  }
  t.contour(); t.texture(scene, cle); return cle;
}

Object.assign(RAMPES_PECHE, {
  boisBlanc: [0x6a6458, 0x9a9484, 0xc4bea8, 0xe0dac6, 0xf2eee0, 0xffffff],
  soie: [0x3a6a7a, 0x5aa0b0, 0x8ad0dc, 0xb4ecf0, 0xd8fcff, 0xffffff],
  fer: [0x16181c, 0x2c3036, 0x464c54, 0x646a72, 0x8a9098, 0xb8bec4],
  os: [0x4a4234, 0x7a6e58, 0xa89a7c, 0xccbe9e, 0xe4dabe, 0xf8f2e0],
  cuivre: [0x3a1606, 0x6a2e10, 0x9a4a1e, 0xc46a30, 0xe2925a, 0xf8c49a],
  plumeCiel: [0x1a3a6a, 0x2e5e9a, 0x4a86c4, 0x76acdc, 0xa8d0ee, 0xe2f2ff],
  morse: [0x5a5040, 0x8a7e66, 0xb4a88a, 0xd4caae, 0xeae2ca, 0xfffaea],
  pompon: [0x5a0a0a, 0x8a1414, 0xb82020, 0xdc3a2a, 0xf06a4a, 0xffa080],
  braiseP: [0x3a0a04, 0x7a1a06, 0xc0400a, 0xf07a1a, 0xffb040, 0xffe8a0],
});

// --- Les cannes : une forme, une longueur, une façon de pêcher par peuple ---
// L : la longueur du scion (en pixels de la texture) ; ep : l'épaisseur au manche et à la pointe
const CANNES_PEUPLES = [
  { id: 'roseau', nom: 'Canne de roseau', peuple: 'comte', L: 64, ep: [1.5, 0.5], mat: 'roseau', manche: ['roseau', 10, 1.8], noeuds: 13, ligneBout: true,
    qui: 'Barnabé, 20 p.', style: 'Une tige, une ficelle nouée au bout, un bouchon : la canne des enfants de la Comté.' },
  { id: 'grandPere', nom: 'Canne du grand-père', peuple: 'comte', L: 76, ep: [1.6, 0.5], mat: 'roseau', manche: ['cuirB', 13, 2], bagues: ['laiton', [0.33, 0.66]], anneaux: 'laiton', plume: true,
    qui: 'offerte par ton chat', style: 'Trois brins emmanchés de laiton, une plume rouge porte-bonheur.' },
  { id: 'noisetier', nom: 'Noisetier à moulinet', peuple: 'comte', L: 80, ep: [1.9, 0.5], mat: 'noisetier', manche: ['liege', 14, 2.2], anneaux: 'laiton', moulinet: 'bois',
    qui: 'Barnabé, 180 p.', style: 'Courbé à la vapeur, un moulinet de bois à manivelle : on remonte plus vite.' },
  { id: 'elfe', nom: 'Fil-de-Lune', peuple: 'elfes', L: 122, ep: [1.3, 0.3], mat: 'boisBlanc', manche: ['argentE', 16, 1.7], anneaux: 'argentE', moulinet: 'feuille', soie: true,
    qui: 'Ilwen, au Lac de Lune', style: 'À la mouche : très longue, très fine, une soie qui luit ; la 1re prise est rendue au lac.' },
  { id: 'nain', nom: 'Brise-Glace', peuple: 'nains', L: 34, ep: [3, 1.6], mat: 'fer', manche: ['morse', 10, 3.2], bagues: ['bronzeP', [0.45]], moulinet: 'engrenages',
    qui: 'Thrain, au lac gelé', style: 'Courte et trapue, pour pêcher assis par un trou dans la glace ; moulinet à engrenages.' },
  { id: 'panda', nom: 'Tige-Patience', peuple: 'bambous', L: 128, ep: [1.8, 0.4], mat: 'bambou', manche: ['laque', 12, 2], noeuds: 11, pompon: true,
    qui: 'Maître Bao, rivière aux bambous', style: 'Un bambou immense, sans moulinet : le poisson vient à celui qui sait attendre.' },
  { id: 'marin', nom: 'Gaffe des Brisants', peuple: 'hommes', L: 70, ep: [2.6, 0.9], mat: 'noisetier', manche: ['cuirB', 15, 3], anneaux: 'cuivre', moulinet: 'cuivre', crosse: true,
    qui: 'Mère Varech, baie des Brisants', style: 'Canne de mer, gros moulinet de cuivre, crosse calée à la ceinture ; on pêche en chantant.' },
  { id: 'gobelin', nom: 'Croc-de-Fleuve', peuple: 'gobelins', L: 66, ep: [2.2, 0.8], mat: 'os', manche: ['cuirB', 12, 2.4], chaine: true, croc: true,
    qui: 'Grisk, Fleuve des Cendres', style: 'Des os ligaturés, une chaîne pour ligne, un croc de troll pour hameçon, un appât qui brûle.' },
  { id: 'ciel', nom: 'Plume-des-Nuées', peuple: 'mages', L: 92, ep: [1.5, 0.4], mat: 'boisBlanc', manche: ['plumeCiel', 12, 1.8], plumes: true, moulinet: 'helice',
    qui: 'le pêcheur des nuées (Cité dans les cieux)', style: 'Légère comme une plume ; une hélice remonte la ligne tombée vers la plus haute rivière.' },
  { id: 'parrain', nom: 'La canne du Parrain', peuple: 'mainNoire', L: 84, ep: [1.8, 0.5], mat: 'ebene', manche: ['ebene', 10, 2.2], bagues: ['orFil', [0.25, 0.5, 0.75]], anneaux: 'orFil', pommeau: true,
    qui: 'offerte par le Parrain', style: 'Le jour, une canne de promenade à pommeau d’or ; elle se déplie et file un fil d’or.' },
];
function textureCanne(scene, id) {
  const c = CANNES_PEUPLES.find(k => k.id === id), cle = 'canneHD_' + id; if (scene.textures.exists(cle)) return cle;
  const Lt = c.L + 18, H = 22, t = toilePeche(Lt, H); t.rampes.laiton = RAMPES_DECOR.laiton || RAMPES_PECHE.orFil;
  const x0 = 4, yb = 14, rise = 5;
  const yA = u => yb - rise * Math.pow(u, 1.4);
  const epA = u => c.ep[0] + (c.ep[1] - c.ep[0]) * u;
  const colonne = (x, y, ep, mat, haut = 4) => { for (let dy = -Math.ceil(ep); dy <= Math.ceil(ep); dy++) if (Math.abs(dy) <= ep + 0.25) t.poser(x, Math.round(y + dy), mat, dy < 0 ? haut : dy > 0 ? 1 : 3); };
  // le scion, du manche (à gauche) à la pointe (à droite)
  for (let x = x0; x <= x0 + c.L; x++) { const u = (x - x0) / c.L, y = yA(u);
    let mat = c.mat; if (c.mat === 'os' && Math.floor(x / 9) % 2) mat = 'morse';   // (des os de deux âges, ligaturés)
    colonne(x, y, epA(u), mat);
    if (c.noeuds && (x - x0) % c.noeuds === c.noeuds - 1 && u > 0.1) { t.poser(x, Math.round(y) - 1, c.mat, 0); t.poser(x, Math.round(y), c.mat, 0); t.poser(x, Math.round(y) + 1, c.mat, 0); }
    if (c.mat === 'os' && x % 9 === 0) for (let dy = -2; dy <= 2; dy++) t.poser(x, Math.round(y + dy), 'cuirB', 2);   // (les ligatures de cuir)
    if (c.plumes && u > 0.15 && u < 0.85 && (x - x0) % 12 === 0) for (let k = 1; k <= 3; k++) { t.poser(x - k, Math.round(y) - 1 - k, 'plumeCiel', 5 - k); t.poser(x + 1 - k, Math.round(y) - 1 - k, 'plumeCiel', 3); }
  }
  // le manche
  const [mm, ml, me] = c.manche;
  for (let x = x0; x < x0 + ml; x++) { const u = (x - x0) / c.L; colonne(x, yA(u), me, mm, 5); if (mm === 'cuirB' && x % 2) t.poser(x, Math.round(yA(u)), 'cuirB', 1); }
  // les bagues (laiton, or, bronze)
  if (c.bagues) for (const u of c.bagues[1]) { const x = Math.round(x0 + u * c.L), y = yA(u); for (const dx of [0, 1]) colonne(x + dx, y, epA(u) + 0.8, c.bagues[0], 5); }
  // les anneaux, sous le scion
  if (c.anneaux) for (let k = 1; k <= 5; k++) { const u = 0.18 + k * 0.15; if (u > 0.95) break; const x = Math.round(x0 + u * c.L), y = Math.round(yA(u) + epA(u) + 1); t.poser(x, y, c.anneaux, 4); t.poser(x - 1, y + 1, c.anneaux, 2); t.poser(x + 1, y + 1, c.anneaux, 2); t.poser(x, y + 2, c.anneaux, 1); }
  // le moulinet, sous le manche
  const xm = x0 + ml + 3, ym = Math.round(yA((xm - x0) / c.L)) + 4;
  if (c.moulinet === 'bois') { t.forme('frene', ellipsoide(xm, ym, 3, 3)); t.poser(xm, ym, 'cheneSombre' in t.rampes ? 'cheneSombre' : 'cuirB', 1); t.poser(xm + 3, ym - 2, 'cuirB', 2); }
  if (c.moulinet === 'feuille') { t.forme('argentE', (x, y) => { const dx = (x + 0.5 - xm) / 4, dy = (y + 0.5 - ym) / 2.2; return dx * dx + dy * dy <= 1 ? [dx, dy, 0.7] : null; }); for (let x = xm - 3; x <= xm + 3; x++) t.poser(x, ym, 'soie', 4); }
  if (c.moulinet === 'engrenages') { t.forme('bronzeP', ellipsoide(xm + 1, ym + 1, 4.2, 4.2)); for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; t.poser(Math.round(xm + 1 + Math.cos(a) * 5), Math.round(ym + 1 + Math.sin(a) * 5), 'bronzeP', 2); } t.poser(xm + 1, ym + 1, 'fer', 1); traitHD(t, 'fer', [[xm + 1, ym + 1], [xm + 6, ym - 3]], 0.6); t.poser(xm + 6, ym - 3, 'morse', 4); }
  if (c.moulinet === 'cuivre') { t.forme('cuivre', ellipsoide(xm + 1, ym + 1, 4.5, 4.5)); t.forme('cuivre', ellipsoide(xm + 1, ym + 1, 2, 2), { decalage: 0.5 }); traitHD(t, 'cuivre', [[xm + 1, ym + 1], [xm + 7, ym + 4]], 0.6); t.poser(xm + 7, ym + 4, 'cuirB', 3); }
  if (c.moulinet === 'helice') { for (const [dx, dy] of [[-4, -1], [-3, -1], [-2, 0], [2, 0], [3, 1], [4, 1]]) t.poser(xm + dx, ym + dy, 'plumeCiel', 4); for (const [dx, dy] of [[0, -3], [0, -2], [1, 2], [1, 3]]) t.poser(xm + dx, ym + dy, 'boisBlanc', 3); t.poser(xm, ym, 'orFil', 4); t.poser(xm + 1, ym, 'orFil', 3); }
  // les détails de chacune
  const xp = x0 + c.L, yp = Math.round(yA(1));
  if (c.ligneBout) { for (let k = 1; k < 6; k++) t.poser(xp + 1, yp + k, 'ligne', 2); t.forme('rougeN', ellipsoide(xp + 1, yp + 7, 1.4, 1.4)); }
  if (c.plume) for (const [dx, dy, i] of [[-30, -2, 4], [-29, -3, 5], [-28, -3, 4], [-29, -2, 3], [-30, -1, 2]]) t.poser(xp + dx, yp + dy + 3, 'rougeN', i);
  if (c.soie) for (let k = 1; k < 10; k++) t.poser(xp + Math.round(Math.sin(k * 0.7) * 2), yp + k, 'soie', 5 - (k % 2));
  if (c.pompon) { for (let k = 1; k < 4; k++) t.poser(xp - 6, yp + k + 1, 'pompon', 2); t.forme('pompon', ellipsoide(xp - 6, yp + 6, 1.6, 1.8)); }
  if (c.crosse) t.forme('cuirB', ellipsoide(x0 - 1, yb, 2.6, 3.2), { decalage: -0.3 });
  if (c.chaine) for (let k = 1; k < 8; k++) t.poser(xp + (k % 2), yp + k, 'fer', k % 2 ? 4 : 2);
  if (c.croc) { t.forme('morse', (x, y) => (x >= xp - 1 && x <= xp + 2 && y >= yp + 8 && y <= yp + 8 + (xp + 2 - x) * 1.2 ? [0, 0.5, 0.7] : null)); t.poser(xp - 3, yp + 9, 'braiseP', 5); t.poser(xp - 3, yp + 10, 'braiseP', 3); }
  if (c.pommeau) { t.forme('orFil', ellipsoide(x0 - 1, yb - 0.5, 2.6, 2.6)); t.poser(x0 - 2, yb - 2, 'orFil', 5); }
  t.contour(); t.texture(scene, cle); return cle;
}

// --- Le chat qui danse, debout, le poisson levé à deux pattes (deux images : il change de pied) ---
function textureChatDanse(scene, look, image = 0) {
  const cle = `chatDanse_${look.pelage}_${look.yeux}_${look.collier}_${image}`; if (scene.textures.exists(cle)) return cle;
  const P = PELAGES_CHAT[look.pelage] || PELAGES_CHAT.gris, Y = YEUX_CHAT[look.yeux] || YEUX_CHAT.vert, C = COLLIERS_CHAT[look.collier] || COLLIERS_CHAT.aucun;
  const t = toileDecor(34, 50), o = 6;   // (6 pixels de plus en haut : les pattes levées)
  t.rampes.poil = rampe(P.poil); t.rampes.ventre = rampe(P.ventre); t.rampes.oeil = rampe(Y.couleur);
  if (P.taches) t.rampes.tache = rampe(P.taches);
  if (C.couleur) t.rampes.collier = rampe(C.couleur);
  const rayures = P.rayures ? (x, y) => ((y + Math.floor(x * 0.6)) % 4 === 0 ? -1 : 0) : (x, y) => (hachage(x, y, 17) > 0.9 ? -0.4 : 0);
  const s = image ? -1 : 1;   // de quel côté part la queue, quelle patte se lève
  traitHD(t, 'poil', image ? [[20, 40 + o], [26, 38 + o], [28, 33 + o], [26, 29 + o]] : [[9, 40 + o], [4, 38 + o], [2, 33 + o], [4, 29 + o]], 1.4);   // la queue qui balance
  // une patte arrière d'appui, l'autre levée, le genou plié (il change de pied)
  const appui = image ? 17 : 12, levee = image ? 12 : 17;
  traitHD(t, 'poil', [[appui, 33 + o], [appui, 40 + o]], 1.6, -0.2); t.forme('poil', ellipsoide(appui + 2, 41.5 + o, 3, 1.4));
  traitHD(t, 'poil', [[levee, 33 + o], [levee + 4 * s, 36 + o], [levee + 1 * s, 38.5 + o]], 1.6, 0); t.forme('poil', ellipsoide(levee + 2 * s, 38.8 + o, 2.4, 1.3));
  t.forme('poil', ellipsoide(15, 27 + o, 6.5, 9), { motif: rayures });
  t.forme('ventre', ellipsoide(17, 28 + o, 3.6, 6.5), { decalage: 0.3 });
  // la tête, un peu penchée, les yeux plissés de bonheur
  const cx = 16 + s * 0.6, cy = 12 + o;
  for (const ox of [-2.4, 1.8]) t.forme('poil', (x, y) => (y >= cy - 8 && y <= cy - 2 && Math.abs(x + 0.5 - (cx + ox)) <= (y - (cy - 8)) * 0.42 + 0.2 ? [0, -0.6, 0.8] : null), { decalage: 0.2 });
  t.forme('poil', ellipsoide(cx, cy, 5, 4.3), { motif: rayures });
  t.forme('ventre', ellipsoide(cx + 3.4, cy + 1.6, 2.4, 1.8), { decalage: 0.2 });
  for (const [dx, dy] of [[1, -1], [2, -2], [3, -1]]) t.poser(Math.round(cx + dx), cy + dy, 'oeil', 1);   // ^ : l'œil fermé de plaisir
  t.poser(Math.round(cx + 5), cy + 1, 'verreRouge', 3); t.poser(Math.round(cx + 3), cy + 3, 'verreRouge', 2);   // le nez, la bouche ouverte
  if (C.couleur) for (let x = Math.round(cx) - 4; x <= Math.round(cx) + 2; x++) for (const y of [cy + 4, cy + 5]) if (t.mat(x, y)) t.poser(x, y, 'collier', y === cy + 4 ? 4 : 2);
  // les deux pattes de devant levées au-dessus de la tête (elles tiennent le poisson)
  traitHD(t, 'poil', [[11, 21 + o], [9, 13 + o], [11, 4 + o]], 1.2, -0.2);
  traitHD(t, 'poil', [[19, 21 + o], [22, 13 + o], [21, 4 + o]], 1.2, 0.3);
  if (P.taches) for (let y = 0; y < t.h; y++) for (let x = 0; x < t.l; x++) if (t.mat(x, y) === 'poil' && fbm(x * 0.22, y * 0.22, 433) > 0.56) t.poser(x, y, 'tache', t.k[y * t.l + x]);
  t.contour(); t.texture(scene, cle); return cle;
}

// --- L'écran « nouvel objet » (règle du joueur : pour TOUT objet unique du jeu) : des rayons dorés qui tournent, l'objet en
// grand (on voit bien son design), son nom, qui l'offre, ce qu'il fait. Renvoie une promesse : le bouton referme l'écran.
function ecranNouvelObjet(s, cle, { titre = 'NOUVEL OBJET', nom, texte, ech = 5, angle = -18, de = '', bouton = 'Merci !' }) {
  return new Promise(ok => {
    const c = s.add.container(0, 0).setScrollFactor(0).setDepth(1900), cx = 480, cy = 232;
    c.add(s.add.rectangle(480, 270, 960, 540, 0x0a0604, 0.74).setInteractive());
    const g = s.add.graphics({ x: cx, y: cy }); c.add(g);
    for (let k = 0; k < 18; k++) { const a = k / 18 * Math.PI * 2, b = a + 0.18; g.fillStyle(0xffe6a0, k % 2 ? 0.1 : 0.2).fillTriangle(0, 0, Math.cos(a) * 600, Math.sin(a) * 600, Math.cos(b) * 600, Math.sin(b) * 600); }
    s.tweens.add({ targets: g, angle: 360, duration: 40000, repeat: -1 });
    const halo = s.add.image(cx, cy, 'halo').setScale(7).setTint(0xffd070).setAlpha(0.55).setBlendMode(Phaser.BlendModes.ADD); c.add(halo);
    s.tweens.add({ targets: halo, alpha: 0.35, scale: 6.4, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const obj = s.add.image(cx, cy + 40, cle).setScale(ech * 0.3).setAngle(angle - 30).setAlpha(0); c.add(obj);
    s.tweens.add({ targets: obj, scale: ech, angle, alpha: 1, y: cy, duration: 650, ease: 'Back.easeOut' });
    s.tweens.add({ targets: obj, y: cy - 6, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 700 });   // (il flotte doucement)
    for (const [x, y, t, d] of [[cx - 210, cy - 70, 22, 0], [cx + 230, cy - 90, 16, 300], [cx + 180, cy + 70, 20, 600], [cx - 160, cy + 80, 14, 900], [cx + 40, cy - 120, 12, 1200]]) {
      const e = s.add.text(x, y, '✦', style(t, '#fff4c0', { stroke: '#a07010', strokeThickness: 2 })).setOrigin(0.5).setAlpha(0); c.add(e);
      s.tweens.add({ targets: e, alpha: 1, scale: 1.3, duration: 700, yoyo: true, repeat: -1, delay: d });
    }
    c.add(s.add.text(cx, 64, titre, style(16, '#2a1606', { fontStyle: 'bold', backgroundColor: '#f3c450', padding: { x: 14, y: 4 } })).setOrigin(0.5));
    c.add(s.add.text(cx, 346, nom, style(30, '#fff4dc', { fontStyle: 'bold', stroke: '#2a1606', strokeThickness: 6 })).setOrigin(0.5));
    if (de) c.add(s.add.text(cx, 378, de, style(14, '#f3d98a', { fontStyle: 'italic', stroke: '#1a0e06', strokeThickness: 3 })).setOrigin(0.5));
    c.add(s.add.text(cx, 400, texte, style(14, '#e8dcc0', { align: 'center', wordWrap: { width: 660 }, stroke: '#1a0e06', strokeThickness: 3 })).setOrigin(0.5, 0));
    if (typeof Son !== 'undefined') Son.jouer('succes');
    s.time.delayedCall(500, () => {
      const b = creerBouton(s, 480, 508, Math.max(180, bouton.length * 10 + 60), bouton, () => { Son.jouer('clic'); b.fond.destroy(); b.label.destroy(); c.destroy(); ok(); });
      b.fond.setScrollFactor(0).setDepth(1901); b.label.setScrollFactor(0).setDepth(1901.1);
    });
  });
}

// --- La cabane du pêcheur, au marché ---
function cabanePecheurHD(scene) {
  const cle = 'cabanePecheurHD'; if (scene.textures.exists(cle)) return cle;
  const L = 96, H = 96, t = toilePeche(L, H); Object.assign(t.rampes, RAMPES_DECOR);
  // les murs de planches verticales, délavées
  for (let x = 6; x < L - 6; x += 6) planche(t, x, 30, 6, 58, 'chene', { horizontale: false, graine: 900 + x, noeuds: 1 });
  // le toit de bardeaux, en pente
  for (let y = 8; y < 32; y++) for (let x = 0; x < L; x++) {
    const bord = Math.abs(x - L / 2) < (y - 6) * 2.4 + 6; if (!bord) continue;
    const rang = Math.floor((y - 8) / 4), dec = (rang % 2) * 4, b = Math.floor((x + dec) / 8);
    t.poser(x, y, 'cheneSombre', (y - 8) % 4 === 3 ? 0 : 2 + Math.round(hachage(b, rang, 901) * 2) - ((x + dec) % 8 === 0 ? 1 : 0));
  }
  // l'ouverture du comptoir (sombre dedans), et l'auvent de toile bleue rayée
  for (let y = 40; y < 62; y++) for (let x = 16; x < L - 16; x++) t.poser(x, y, 'cheneSombre', y < 44 ? 0 : 1);
  t.rampes.auventP = rampe(0x3a6a9a); t.rampes.lin = RAMPES_OBJETS.lin;
  for (let y = 34; y < 42; y++) for (let x = 12; x < L - 12; x++) { const bande = Math.floor(x / 8) % 2; if (y >= 40 && Math.abs((x % 8) - 4) > (42 - y) * 2) continue; t.poser(x, y, bande ? 'lin' : 'auventP', y < 36 ? 4 : 3); }
  // le comptoir
  planche(t, 10, 60, L - 20, 5, 'chene', { graine: 902, noeuds: 2 }); for (let x = 10; x < L - 10; x++) t.poser(x, 60, 'chene', 5);
  // le filet de pêche drapé sur le côté gauche, avec ses flotteurs de liège
  for (let y = 30; y < 76; y++) for (let x = 0; x < 14; x++) if ((x + y) % 4 === 0 || (x - y + 100) % 4 === 0) t.poser(x, y, 'filet', 3 + ((x + y) % 8 === 0 ? 1 : 0));
  for (const [x, y] of [[3, 34], [9, 46], [4, 58], [10, 70]]) { t.poser(x, y, 'liege', 4); t.poser(x + 1, y, 'liege', 3); t.poser(x, y + 1, 'liege', 2); t.poser(x + 1, y + 1, 'liege', 2); }
  // le séchoir à poissons à droite : une perche, trois poissons pendus
  for (let x = L - 14; x < L; x++) t.poser(x, 44, 'cheneSombre', 3);
  // l'enseigne : une planche avec un poisson peint, au-dessus du toit
  planche(t, 30, 0, 36, 10, 'chene', { graine: 903, noeuds: 0 }); for (const [x, y] of [[36, 2], [36, 8]]) t.poser(x, y, 'cheneSombre', 0);
  // l'assise de pierre : de gros moellons posés sur les pavés (la cabane ne flotte pas)
  for (let y = 86; y < H; y++) for (let x = 4; x < L - 4; x++) { const r = Math.floor((y - 86) / 5), dec = (r % 2) * 7, b = Math.floor((x + dec) / 14); const joint = (y - 86) % 5 === 4 || (x + dec) % 14 === 0; t.poser(x, y, 'pierre', joint ? 0 : 2 + Math.round(hachage(b, r, 907) * 2)); }
  for (let x = 4; x < L - 4; x++) t.poser(x, 85, 'cheneSombre', 1);
  for (let y = 76; y < 86; y++) for (let x = 0; x < 14; x++) if ((x + y) % 4 === 0 || (x - y + 100) % 4 === 0) t.poser(x, y, 'filet', 3);   // (le filet descend jusqu'à l'assise)
  t.contour(); t.texture(scene, cle); return cle;
}
// (v1.63, planche 80 v3) La planche de rive de la cabane : une planche de bois clair, liée de corde aux deux bouts,
// clouée sous le bord du toit ; le nom de la cabane y est gravé (le lettrage : poserLettrage, placeMarcheHD.js)
function plancheRiveHD(scene, l, h, graine = 7450) {
  const cle = 'plancheRive_' + l + 'x' + h; if (scene.textures.exists(cle)) return cle;
  const t = toileDecor(l, h); t.rampes.pin = rampe(BOIS_CLAIR_NOM);
  planche(t, 0, 0, l, h, 'pin', { graine, noeuds: 1 });
  for (let x = 0; x < l; x++) { t.poser(x, 0, 'pin', 5); t.poser(x, h - 1, 'chene', 1); }
  for (const x of [1, l - 2]) for (let y = 0; y < h; y++) t.poser(x, y, 'cheneSombre', 2);   // la corde qui la lie, aux deux bouts
  for (const [x, y] of [[4, 2], [l - 5, h - 3]]) t.poser(x, y, 'fer', 4);
  t.contour(); t.texture(scene, cle); return cle;
}
// La cabane posée au bout de la rue du marché, avec Barnabé Goujon derrière son comptoir (renvoie les objets créés)
const PECHEUR_COMTE = { race: 'hobbit', nom: 'Barnabé Goujon', niveau: 'aguerri', costume: 'colporteur', vieux: true };
function poserCabanePecheur(s, X) {
  const objets = [], add = o => { objets.push(o); return o; };
  const cab = cabanePecheurHD(s);
  add(s.add.image(X, 256, cab).setOrigin(0.5, 1).setScale(2));
  ['roseau', 'noisetier'].forEach((id, i) => add(s.add.image(X - 92 + i * 12, 254, textureCanne(s, id)).setScale(1.5).setAngle(-70 + i * 6).setOrigin(0.03, 0.7)));
  ['gardon', 'perche', 'gardon'].forEach((id, i) => add(s.add.image(X + 72 + i * 8, 147, texturePoisson(s, id)).setScale(1.1).setAngle(-90 + (i - 1) * 5).setOrigin(0.05, 0.5)));
  add(s.add.image(X, 74, texturePoisson(s, 'brochet')).setScale(1.3));
  add(imageCorps(s, X, 205, PECHEUR_COMTE, 5));
  add(s.add.image(X, 256, cab).setOrigin(0.5, 1).setScale(2).setCrop(0, 60, 96, 36));
  add(s.add.image(X - 30, 178, texturePrise(s, 'bouteille')).setScale(1.2).setOrigin(0.5, 1));
  add(s.add.image(X + 28, 180, 'cagetteHD').setOrigin(0.5, 1).setScale(1.6));
  add(s.add.image(X + 28, 172, texturePoisson(s, 'tanche')).setScale(1.1).setOrigin(0.5, 1));
  // au pied de la cabane, sur les pavés : le tonneau d'appâts, une cagette de poissons, la vieille botte qui sèche
  add(s.add.image(X + 112, 262, 'tonneauxHD').setOrigin(0.5, 1).setScale(1.05));
  add(s.add.image(X - 120, 262, 'cagetteHD').setOrigin(0.5, 1).setScale(1.7));
  ['gardon', 'perche'].forEach((id, i) => add(s.add.image(X - 126 + i * 12, 248, texturePoisson(s, id)).setScale(1).setAngle(-8 + i * 14)));
  add(s.add.image(X + 70, 262, texturePrise(s, 'botte')).setOrigin(0.5, 1).setScale(1.1));
    return objets;
}

// Un bouchon rouge et blanc
function textureBouchon(scene) {
  const cle = 'bouchonHD'; if (scene.textures.exists(cle)) return cle;
  const t = toilePeche(8, 14);
  t.forme('rougeN', (x, y) => { const dx = (x + 0.5 - 4) / 3, dy = (y + 0.5 - 6) / 3.2; return dx * dx + dy * dy <= 1 && y < 6 ? [dx, dy, 0.7] : null; });
  t.forme('oeilB', (x, y) => { const dx = (x + 0.5 - 4) / 3, dy = (y + 0.5 - 6) / 3.2; return dx * dx + dy * dy <= 1 && y >= 6 ? [dx, dy, 0.7] : null; });
  for (let y = 0; y < 3; y++) t.poser(4, y, 'barre', 2); for (let y = 10; y < 14; y++) t.poser(4, y, 'liege', 2);
  t.contour(); t.texture(scene, cle); return cle;
}
// JeuneGoy qui tient sa canne (une main en avant) : sa texture et la position de sa main
function joueurPecheur(scene) {
  const G = window.GAME, stade = stadeJoueur(G), cle = 'joueurPeche_' + stade;
  const sig = signatureJoueur(G);   // (v1.49 : redessiné quand la tenue, la coupe ou la barbe changent)
  if (scene.textures.exists(cle) && scene.textures.get(cle).tenue !== sig) scene.textures.remove(cle);
  if (!scene.textures.exists(cle)) { const t = dessinerJoueurHD(apparenceDuJour(G), stade, G.joueur.feminin, 0, G.tenue || [], 'troisQuarts', 'empoigne'); t.texture(scene, cle); scene.textures.get(cle).main = t.mainXY ? { x: t.mainXY[0] - t.l / 2, y: t.h - t.mainXY[1] } : { x: 6, y: 30 }; scene.textures.get(cle).tenue = sig; }
  return cle;
}
