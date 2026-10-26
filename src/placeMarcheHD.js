// (v1.49, planche 73 v2 validée « parfait ») Les dessins de la grand-place du marché, et les palettes des régions.

// Les palettes : 60 % (la couleur qui domine), 30 % (la seconde), 10 % (l'accent), + les complémentaires.
// `sol` : comment le sol de la région s'en sert (herbe, terre, pierre, fleurs, feuillage).
const PALETTES_REGIONS = {
  comte: { nom: 'La Comté', lieu: 'le marché, ta rue, le Moulin', p: [[0x7aa84e, 'vert prairie'], [0xc8a06a, 'ocre de terre battue'], [0xc23a2c, 'rouge garance']], compl: [0xf2e4c4, 0x7ab8d8, 0x7a5230, 0xe8c040],
    sol: { herbe: 0x7aa84e, terre: 0xc8a06a, pierre: 0xb8ac94, fleur: 0xd84a3a, fleur2: 0xf0d050, feuille: 0x5a8a3a }, humeur: 'chaud, rond, rassurant : le pays où l’on rentre' },
  monts: { nom: 'Les Monts des nains', lieu: 'forges, mines, cols', p: [[0x667086, 'ardoise bleutée'], [0x9a5a32, 'rouille et cuivre'], [0xf0b030, 'or de forge']], compl: [0xe8eef2, 0xe0602a, 0x3a3a44, 0x8a9aa8],
    sol: { herbe: 0x7d8a6e, terre: 0x8c8274, pierre: 0x6e7890, fleur: 0xf0b030, fleur2: 0xe8eef2, feuille: 0x4e6a5a }, humeur: 'froid dehors, braise dedans' },
  foret: { nom: 'Les Forêts des elfes', lieu: 'Sérambre, Ardévanne', p: [[0x3e6e4a, 'vert profond'], [0x9ab8c8, 'argent bleuté'], [0xe8d890, 'or pâle']], compl: [0x7a6a9a, 0xf4f4ec, 0x2a4a3a, 0xb8d8a0],
    sol: { herbe: 0x4a7e50, terre: 0x7a6a4a, pierre: 0xa8b8b8, fleur: 0xe8d890, fleur2: 0xc8b8e8, feuille: 0x2e5a3c }, humeur: 'calme, ancien, lumière qui filtre' },
  cite: { nom: 'La Cité des hommes', lieu: 'Hautval, le Conseil', p: [[0xd8ccb0, 'pierre crème'], [0x2e4a8a, 'bleu royal'], [0xb02a2a, 'rouge des bannières']], compl: [0xd0a040, 0x6e9a4a, 0x4a4038, 0xf4ecd8],
    sol: { herbe: 0x6e9a4a, terre: 0xbcae92, pierre: 0xd4c8ac, fleur: 0xb02a2a, fleur2: 0x2e4a8a, feuille: 0x4a7a3a }, humeur: 'ordre, pouvoir, cérémonie' },
  mages: { nom: 'Les Terres des mages', lieu: 'tours, Bibliothèque, Opale', p: [[0x5a3a7a, 'violet'], [0x1e2a5a, 'bleu nuit'], [0x3ad0c0, 'turquoise des sorts']], compl: [0xe0c050, 0xe88ab8, 0x2a1a3a, 0xc8c8e8],
    sol: { herbe: 0x4a6a72, terre: 0x6a5a7a, pierre: 0x7a6a9a, fleur: 0x3ad0c0, fleur2: 0xe0c050, feuille: 0x3a4a6a }, humeur: 'mystère, étoiles, savoir' },
  bannis: { nom: 'Les Terres des Bannis', lieu: 'le marché noir, l’Antre', p: [[0x3a2e2a, 'brun-noir'], [0x6a7a3a, 'vert maladif'], [0xa01a1a, 'rouge sang']], compl: [0xd8d0b8, 0x5a2a5a, 0x1a1414, 0xc8a050],
    sol: { herbe: 0x5a6432, terre: 0x4e3e32, pierre: 0x5a5450, fleur: 0xa01a1a, fleur2: 0xd8d0b8, feuille: 0x3e4a26 }, humeur: 'menace, sécheresse, braises' },
};

// Le sol d'une place, à la Stardew : herbe partout, terre battue là où l'on marche (sous les étals, les chemins),
// dalles de pierre au centre seulement, qui se dispersent en pas japonais vers les bords. L'herbe déborde sur la
// terre (un liseré clair, une ombre dessous) : le sol a du relief.
//   plan : { centre:[x,y], rTerre, rDalles, pads:[[x,y,l,h]], chemins:[[[x,y],[x,y]],...], largeur, pas:[[x,y]] }
function solPlaceHD(scene, cle, pal, L, H, plan) {
  if (scene.textures.exists(cle)) return cle;
  const t = toileDecor(L, H), R = t.rampes, s = pal.sol;
  R.herbeP = rampe(s.herbe); R.terreP = rampe(s.terre); R.pierreP = rampe(s.pierre); R.fleurP = rampe(s.fleur); R.fleur2P = rampe(s.fleur2); R.feuilleP = rampe(s.feuille);
  R.jointP = rampe(((s.terre >> 1) & 0x7f7f7f));
  const [cx, cy] = plan.centre, G0 = plan.graine || 7600;
  const distSeg = (x, y, [ax, ay], [bx, by]) => { const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1; const u = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l2)); return Math.hypot(ax + u * dx - x, ay + u * dy - y); };
  // 1. qui est quoi : 0 herbe, 1 terre, 2 dalle
  const type = new Uint8Array(L * H), dalle = new Int32Array(L * H).fill(-1), bord = new Float32Array(L * H), cote = new Int8Array(L * H);
  const C = 12;   // la taille moyenne d'une dalle
  for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) {
    const n = (fbm(x * 0.06, y * 0.06, G0) - 0.5) * 14, i = y * L + x;
    const dr = Math.hypot(x - cx, (y - cy) * 1.55);
    let terre = dr < plan.rTerre + n;
    if (!terre) for (const [px, py, pl, ph] of plan.pads) { const ex = Math.max(0, Math.abs(x - px) - pl / 2), ey = Math.max(0, Math.abs(y - py) - ph / 2); if (Math.hypot(ex, ey * 1.4) < 8 + n * 0.6) { terre = true; break; } }
    if (!terre) for (const c of plan.chemins) if (distSeg(x, y, c[0], c[1]) < (c[2] || plan.largeur) + n * 0.4) { terre = true; break; }
    if (!terre) continue;
    type[i] = 1;
    // les dalles : un pavage irrégulier (cellules de Voronoï), plein au centre, clairsemé vers les bords
    const gx = Math.floor(x / C), gy = Math.floor(y / C);
    let d1 = 1e9, d2 = 1e9, best = null;
    for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) {
      const ax = gx + k, ay = gy + j, fx = (ax + 0.15 + hachage(ax, ay, G0 + 1) * 0.7) * C, fy = (ay + 0.15 + hachage(ax, ay, G0 + 2) * 0.7) * C;
      const d = Math.hypot(x + 0.5 - fx, (y + 0.5 - fy) * 1.2);
      if (d < d1) { d2 = d1; d1 = d; best = [ax, ay, fx, fy]; } else if (d < d2) d2 = d;
    }
    const [ax, ay, fx, fy] = best, drF = Math.hypot(fx - cx, (fy - cy) * 1.55);
    let proba = drF < plan.rDalles - 26 ? 0.96 : drF < plan.rDalles ? 0.96 - (drF - plan.rDalles + 26) / 26 * 0.7 : drF < plan.rDalles + 30 ? 0.18 : 0;
    for (const [sx, sy] of plan.pas || []) if (Math.hypot(fx - sx, fy - sy) < 8) proba = 1;
    if (hachage(ax, ay, G0 + 3) < proba && d2 - d1 > 1.4) { type[i] = 2; dalle[i] = (ay & 0xffff) * 65536 + (ax & 0xffff); bord[i] = d2 - d1; cote[i] = (x - fx) + (y - fy) * 1.3 < 0 ? 1 : -1; }
    else if (hachage(ax, ay, G0 + 3) < proba) { type[i] = 3; }   // le joint entre deux dalles
  }
  // 2. on peint, avec le relief
  const T = (x, y) => (x < 0 || y < 0 || x >= L || y >= H ? 0 : type[y * L + x]);
  for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) {
    const i = y * L + x, ty = type[i];
    if (ty === 0) {
      // l'herbe : des plaques plus claires ou plus sombres, des brins, et le liseré clair au bord de la terre
      const p = fbm(x * 0.025, y * 0.025, G0 + 4), q = hachage(x, y, G0 + 5);
      let k = p > 0.6 ? 4 : 3;
      if (p > 0.56 && p <= 0.6 && (x + y) % 2 === 0) k = 4;   // (un tramage doux entre les deux tons)
      if (q > 0.97) k += 1; else if (q < 0.025) k -= 1;
      if (T(x, y + 1) && T(x, y + 1) !== 0) k = 5; else if (T(x, y + 2) && T(x, y + 2) !== 0) k = 4;
      t.poser(x, y, 'herbeP', k);
    } else if (ty === 1) {
      // la terre battue : douce, quelques cailloux ; à l'ombre de l'herbe qui la surplombe, plus sombre
      const p = fbm(x * 0.05, y * 0.05, G0 + 6);
      let k = p > 0.6 ? 4 : p < 0.24 ? 2 : 3;
      if (T(x, y - 1) === 0) k = 1; else if (T(x, y - 2) === 0 || T(x - 1, y) === 0) k = Math.min(k, 2);
      if (T(x, y - 1) === 2 || T(x - 1, y - 1) === 2) k = Math.min(k, 2);
      t.poser(x, y, 'terreP', k);
    } else if (ty === 3) t.poser(x, y, hachage(x >> 2, y >> 2, G0 + 7) < 0.3 ? 'herbeP' : 'jointP', 2);
    else {
      // une dalle : son ton à elle, biseau clair en haut à gauche, sombre en bas à droite, un peu de grain
      const d = dalle[i], v = hachage(d & 0xffff, d >> 16, G0 + 8);
      let k = 3 + (v > 0.7 ? 1 : v < 0.25 ? -1 : 0);
      if (bord[i] < 3.2) k += cote[i];
      if (hachage(x, y, G0 + 9) > 0.93) k -= 1;
      if (v > 0.9 && fbm(x * 0.3, y * 0.3, G0 + 10) > 0.62) { t.poser(x, y, 'herbeP', 2); continue; }   // (de la mousse sur les vieilles)
      t.poser(x, y, 'pierreP', k);
    }
  }
  // 3. des touffes d'herbe en V et des fleurs (l'accent) dans l'herbe, des cailloux sur la terre
  for (let n = 0; n < L * H / 260; n++) {
    const x = Math.floor(hachage(n, 1, G0 + 11) * L), y = Math.floor(hachage(n, 2, G0 + 11) * H);
    if (T(x, y) !== 0 || T(x, y + 3) !== 0) continue;
    const r = hachage(n, 3, G0 + 11);
    if (r < 0.08) { const m = r < 0.05 ? 'fleurP' : 'fleur2P'; for (const [a, b] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) t.poser(x + a, y + b, m, 4); t.poser(x, y, 'fleur2P', 5); t.poser(x, y + 2, 'feuilleP', 2); }
    else { t.poser(x - 1, y - 1, 'herbeP', 5); t.poser(x, y, 'herbeP', 4); t.poser(x + 1, y - 1, 'herbeP', 5); t.poser(x, y + 1, 'herbeP', 1); }
  }
  for (let n = 0; n < L * H / 900; n++) {
    const x = Math.floor(hachage(n, 4, G0 + 12) * L), y = Math.floor(hachage(n, 5, G0 + 12) * H);
    if (T(x, y) !== 1 || T(x + 1, y + 1) !== 1) continue;
    t.poser(x, y, 'pierreP', 4); t.poser(x + 1, y, 'pierreP', 3); t.poser(x, y + 1, 'terreP', 1); t.poser(x + 1, y + 1, 'terreP', 1);
  }
  t.texture(scene, cle); return cle;
}

// (v1.63) Un arbre de la place, peint comme ceux de la rue (arbresHD.js) : une essence par endroit (chêne, pommier,
// bouleau, aulne, saule), toujours la même au même endroit (sur la place comme dans la vue du mendiant), et la saison
// de la place (fleurs, vert, roux, nu et neigeux). `variante` change l'arbre (deux voisins ne se ressemblent pas).
const ESSENCES_PLACE = ['chene', 'pommier', 'bouleau', 'aulne', 'chene', 'saule', 'pommier', 'bouleau', 'chene', 'aulne'];
function arbrePlaceHD(scene, pal, variante = 0, x = 0, y = 0) {
  const saison = pal.saison || 'semailles', k = (Math.round(x / 10) * 7 + Math.round(y / 10) * 3 + variante) % ESSENCES_PLACE.length;
  const esp = ESSENCES_PLACE[k];
  return arbreHD(scene, esp, saison, esp === 'bouleau' ? 84 : 76, 20 + k, 0, { neige: saison === 'givre' });
}
// Un buisson (peint comme les arbres : ses touffes, ses fleurs au printemps, roux à l'automne ; l'hiver, un buis
// toujours vert sous la neige, comme ceux des récits)
function buissonPlaceHD(scene, pal, x = 0, y = 0) {
  const saison = pal.saison || 'semailles', v = 30 + (Math.round(x / 10) + Math.round(y / 10)) % 3;
  if (saison === 'givre') return toileArbreHD(scene, `buisPlace_${v}`, 'buisson', 'moissons', 26, v, { neige: true, couleur: 0x2e5232 });
  return arbreHD(scene, 'buisson', saison, 26, v, 0, { neige: false });
}
// Une ombre portée (ellipse douce), sous tout ce qui est debout
function ombrePlaceHD(scene) {
  const cle = 'ombrePlace'; if (scene.textures.exists(cle)) return cle;
  const c = scene.textures.createCanvas(cle, 64, 24), g = c.getContext(), d = g.createRadialGradient(32, 12, 2, 32, 12, 32);
  d.addColorStop(0, 'rgba(20,12,4,0.42)'); d.addColorStop(0.65, 'rgba(20,12,4,0.3)'); d.addColorStop(1, 'rgba(20,12,4,0)');
  g.save(); g.scale(1, 24 / 64); g.fillStyle = d; g.beginPath(); g.arc(32, 32, 32, 0, Math.PI * 2); g.fill(); g.restore(); c.refresh();
  return cle;
}
// Une barrière basse de bois (un tronçon de `n` piquets)
function barrierePlaceHD(scene, n = 5) {
  const cle = 'barrierePlace' + n; if (scene.textures.exists(cle)) return cle;
  const L = n * 10 + 2, H = 16, t = toileDecor(L, H);
  for (let k = 0; k <= n; k++) for (let y = 1; y < 16; y++) for (let x = k * 10; x < k * 10 + 3; x++) t.poser(x, y, 'chene', x === k * 10 ? 4 : 2 + (y === 1 ? 2 : 0));
  for (const yy of [5, 10]) for (let x = 0; x < L; x++) for (let k = 0; k < 2; k++) t.poser(x, yy + k, 'chene', k === 0 ? 4 : 2);
  t.contour(); t.texture(scene, cle); return cle;
}

// --- (v1.63, planche 80 v3) Les noms des lieux : peints, brodés, gravés ou cloués dans l'étal lui-même ---
// Plus de panneau qui flotte au-dessus : le nom fait partie de l'étal (la bande haute de son auvent, la poutre de sa
// façade, l'estrade, le tableau...), comme le montre la planche 80 v3. La table ETALS_NOMS dit le style de chaque lieu ;
// etalNomHD (exterieurHD.js) dessine la bande, poserLettrage y écrit le nom, à la résolution des textes du jeu.
const BOIS_CLAIR_NOM = 0xc09860;   // le bois clair des planches gravées : le creux sombre des lettres s'y lit de loin
// modele : 'toile' (lambrequin sous une tringle) ou 'poutre' (poutre de façade) ; genre : peint, brode, grave, decoupe, dore ;
// comptoir : coffre, ferre, peint, caisse ou nappe:or|lin|dentelle (comptoirEtalHD, exterieurHD.js)
const ETALS_NOMS = {
  gedeon: { modele: 'toile', comptoir: 'coffre', ton: -1, bord: 'laiton', bas: 'festons', ble: true, genre: 'brode', police: 'Alegreya' },
  forge: { modele: 'poutre', comptoir: 'ferre', bois: 'cheneSombre', fer: true, genre: 'grave', police: 'Alegreya' },
  apothicaire: { modele: 'toile', comptoir: 'nappe:or', bord: 'laiton', bas: 'pointes', etoiles: true, genre: 'peint', police: 'Uncial Antiqua', graisse: 400, taille: 16 },
  tailleuse: { modele: 'toile', comptoir: 'nappe:lin', bord: 'piqure', bas: 'festons', genre: 'brode', police: 'Alegreya', italique: true },
  bazar: { modele: 'poutre', comptoir: 'peint', bois: 'peinte', noeud: true, genre: 'decoupe', police: 'Alegreya', couleurFixe: '#fbecb8' },
  brocante: { modele: 'poutre', comptoir: 'caisse', bois: 'vieille', genre: 'peint', police: 'MedievalSharp', graisse: 400, taille: 16, couleurFixe: '#fff4dc', inclinaison: 1.2 },
  garderobe: { modele: 'toile', comptoir: 'nappe:dentelle', bord: 'laiton', bas: 'dentelle', tringle: 'laiton', genre: 'brode', police: 'Alegreya', italique: true, couleurFixe: '#f6e2a0', deuxLignes: true },
  tir: { modele: 'toile', comptoir: 'nappe:or:18', bord: 'laiton', bas: 'pointes', genre: 'dore', police: 'Alegreya', couleurFixe: '#f0c850' },    // le tir à l'arc du Solstice
  roue: { modele: 'toile', comptoir: 'nappe:lin:18', bord: 'laiton', bas: 'festons', genre: 'brode', police: 'Alegreya', italique: true, couleurFixe: '#fbecb8' },   // la grande roue du Long Hiver
};
// La hauteur de la bande (en rangs de texture) : une ligne, deux ou trois
function bandeEtalNom(lignes) { return [12, 18, 22][Math.min(3, lignes) - 1]; }
// Le métier de chaque lieu, sur sa petite enseigne pendue (le nom de la planche 80 v3 : « Pêcheur » plutôt que « Pêche »)
const METIERS_NOMS = { peche: 'Pêcheur' };

const COULEUR_CSS = c => typeof c === 'number' ? '#' + c.toString(16).padStart(6, '0') : c;
function melangeCouleurs(a, b, k) {
  const A = parseInt(COULEUR_CSS(a).slice(1), 16), B = parseInt(COULEUR_CSS(b).slice(1), 16);
  const f = s => Math.round(((A >> s) & 255) + ((((B >> s) & 255) - ((A >> s) & 255)) * k));
  return '#' + ((f(16) << 16) | (f(8) << 8) | f(0)).toString(16).padStart(6, '0');
}
function luminanceCouleur(c) { const n = parseInt(COULEUR_CSS(c).slice(1), 16); return (0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255; }
// Ce qui détache le nom de sa bande : une lettre claire (la couleur vive de la relation sur une bande sombre) prend un
// liseré sombre épais et une ombre portée ; une lettre sombre (sur du bois clair) un halo clair
function contrasteLettrage(couleur, fond) {
  if (luminanceCouleur(couleur) > 0.42) return { lisere: { c: melangeCouleurs(fond, '#000000', 0.75), w: 2.6 }, ombre: [0.7, 1.5, 0.55] };
  return { lisere: { c: melangeCouleurs(fond, '#fffaf0', 0.65), w: 2.2 }, ombre: null };
}
// Un nom, dessiné dans une texture. Le texte est tracé à la résolution des textes du jeu (style() : ZOOM_ECRAN + 1), puis
// affiché à 1/R : il reste net sur un écran fin. Il tient dans (largeur × hauteur) : une ligne, au besoin les lettres un
// peu serrées, puis un point plus petite, sinon deux lignes coupées au mot le plus proche du milieu.
// genre : 'peint' (à plat), 'grave' (creusé : le haut du creux dans l'ombre, la lèvre du bas éclairée), 'decoupe' (lettres
// de bois en relief, clouées), 'brode' (fil, point lancé), 'dore' (feuille d'or). Renvoie { cle, l, h, R, mise }.
function lettrageHD(scene, texte, o) {
  const R = typeof ZOOM_ECRAN === 'number' ? Math.max(2, ZOOM_ECRAN + 1) : 3;
  const { police = 'Alegreya', graisse = 900, italique = false, taille = 16, couleur = '#3a2410', fond = 0x8a5a2b, genre = 'peint',
    largeur = 150, hauteur = 40, lignesMax = 2, serrage = 0, inclinaison = 0, coupe = false, lisere = null, ombre = null } = o;
  const g = document.createElement('canvas').getContext('2d');
  const fonte = t => `${italique ? 'italic ' : ''}${graisse} ${t * R}px "${police}", Georgia, serif`;
  const mesurer = (l, t, e) => { g.font = fonte(t); g.letterSpacing = (e * R) + 'px'; const m = g.measureText(l); return { l: m.width / R, a: m.actualBoundingBoxAscent / R, d: m.actualBoundingBoxDescent / R }; };
  const coupes = () => { const mots = texte.split(' '); let best = null; for (let k = 1; k < mots.length; k++) { const a = mots.slice(0, k).join(' '), b = mots.slice(k).join(' '), e = Math.abs(a.length - b.length); if (!best || e < best[0]) best = [e, [a, b]]; } return best ? best[1] : [texte]; };
  let mise = null;
  const essais = [];
  if (!coupe) for (const [t, e] of [[taille, serrage], [taille, serrage - 0.4], [taille - 1, serrage - 0.4]]) essais.push([texte.split('\n'), t, e]);
  if (lignesMax > 1 && !texte.includes('\n')) for (const [t, e] of [[taille - 1, serrage], [taille - 1, serrage - 0.4], [taille - 2, serrage - 0.4], [taille - 3, serrage - 0.5]]) essais.push([coupes(), t, e]);
  for (const [lignes, t, e] of essais) {
    const ms = lignes.map(l => mesurer(l, t, e)), lh = t * 1.02, haut = ms[0].a + (lignes.length - 1) * lh + ms[ms.length - 1].d;
    if (Math.max(...ms.map(m => m.l)) <= largeur && haut <= hauteur) { mise = { lignes, t, e, ms, lh, haut }; break; }
  }
  if (!mise) { const lignes = coupes(), t = taille - 3, e = serrage - 0.5, ms = lignes.map(l => mesurer(l, t, e)); mise = { lignes, t, e, ms, lh: t * 1.02, haut: ms[0].a + (lignes.length - 1) * t * 1.02 + ms[ms.length - 1].d, deborde: true }; }
  const marge = 3 + (lisere ? lisere.w : 0) + (ombre ? 1.5 : 0), W = Math.ceil(Math.max(...mise.ms.map(m => m.l)) + marge * 2), H = Math.ceil(mise.haut + marge * 2);
  // (la police arrive du réseau : un nom dessiné avec la police de secours n'est pas gardé comme s'il était fini)
  const prete = !document.fonts || document.fonts.check(`${italique ? 'italic ' : ''}${graisse} 20px "${police}"`);
  const cle = 'lettrage_' + [mise.lignes.join('/'), police, graisse, italique, mise.t, mise.e, COULEUR_CSS(couleur), COULEUR_CSS(fond), genre, inclinaison, R, lisere ? lisere.c + lisere.w : '', ombre ? ombre.join(',') : '', prete ? 1 : 0].join('|');
  if (!scene.textures.exists(cle)) {
    const tex = scene.textures.createCanvas(cle, W * R, H * R), c = tex.getContext();
    // une couche : le texte, d'une couleur, décalé de (dx, dy) unités
    const calque = (coul, dx = 0, dy = 0, trait = 0) => {
      const k = document.createElement('canvas'); k.width = W * R; k.height = H * R; const q = k.getContext('2d');
      q.font = fonte(mise.t); q.letterSpacing = (mise.e * R) + 'px'; q.textAlign = 'center'; q.textBaseline = 'alphabetic'; q.lineJoin = 'round';
      mise.lignes.forEach((l, i) => {
        const x = (W / 2 + dx) * R, y = (marge + mise.ms[0].a + i * mise.lh + dy) * R;
        q.save(); if (inclinaison) { q.translate(x, y); q.rotate((i % 2 ? -1 : 1) * inclinaison * Math.PI / 180); q.translate(-x, -y); }
        if (trait) { q.strokeStyle = coul; q.lineWidth = trait * R; q.strokeText(l, x, y); }
        q.fillStyle = coul; q.fillText(l, x, y); q.restore();
      });
      return { k, q };
    };
    const sur = (a, b, op) => { a.q.globalCompositeOperation = op; a.q.drawImage(b.k, 0, 0); a.q.globalCompositeOperation = 'source-over'; return a; };
    const sombre = melangeCouleurs(fond, '#000000', 0.55), clair = melangeCouleurs(fond, '#fff4dc', 0.45);
    if (ombre) { c.globalAlpha = ombre[2]; c.drawImage(calque('#000000', ombre[0], ombre[1], lisere ? lisere.w : 0).k, 0, 0); c.globalAlpha = 1; }
    if (lisere) c.drawImage(calque(lisere.c, 0, 0, lisere.w).k, 0, 0);
    if (genre === 'peint') {
      c.globalAlpha = 0.35; c.drawImage(calque(melangeCouleurs(fond, '#000000', 0.5), 0, 0.5).k, 0, 0); c.globalAlpha = 1;   // la peinture a un peu bu
      c.drawImage(calque(couleur).k, 0, 0);
    } else if (genre === 'grave') {
      if (!lisere) c.drawImage(calque(clair, 0, 0.7).k, 0, 0);                                    // la lèvre du bas, qui prend la lumière
      const creux = calque(melangeCouleurs(couleur, '#000000', 0.6));                              // le fond du creux, dans l'ombre en haut
      c.drawImage(sur(creux, calque(couleur, 0, 0.5), 'source-atop').k, 0, 0);
    } else if (genre === 'decoupe') {
      c.globalAlpha = 0.5; c.drawImage(calque('#000000', 1.4, 2).k, 0, 0); c.globalAlpha = 1;      // l'ombre portée sur la poutre
      c.drawImage(calque(melangeCouleurs(couleur, '#000000', 0.5), 0.6, 0.9).k, 0, 0);             // la tranche
      const face = calque(melangeCouleurs(couleur, '#ffffff', 0.4));                               // le bord du haut, éclairé
      c.drawImage(sur(face, calque(couleur, 0.5, 0.5), 'source-atop').k, 0, 0);
    } else if (genre === 'brode') {
      c.drawImage(calque(sombre, 0, 0.5, 1.4).k, 0, 0);
      const fil = calque(couleur);
      fil.q.globalCompositeOperation = 'source-atop'; fil.q.strokeStyle = melangeCouleurs(couleur, '#ffffff', 0.35); fil.q.lineWidth = 0.45 * R;
      for (let x = -H; x < W + H; x += 1.6) { fil.q.beginPath(); fil.q.moveTo(x * R, 0); fil.q.lineTo((x + H * 0.7) * R, H * R); fil.q.stroke(); }   // le point lancé
      c.drawImage(fil.k, 0, 0);
    } else if (genre === 'dore') {
      c.drawImage(calque('#2a1006', 0, 0.6, 1.8).k, 0, 0);
      const or = calque('#ffffff'); or.q.globalCompositeOperation = 'source-atop';
      mise.lignes.forEach((l, i) => { const y0 = (marge + i * mise.lh) * R, y1 = y0 + (mise.ms[0].a + mise.ms[0].d) * R, gr = or.q.createLinearGradient(0, y0, 0, y1);
        gr.addColorStop(0, '#fff4b0'); gr.addColorStop(0.45, COULEUR_CSS(couleur)); gr.addColorStop(1, melangeCouleurs(couleur, '#5a3008', 0.55)); or.q.fillStyle = gr; or.q.fillRect(0, y0, W * R, y1 - y0 + R); });
      c.drawImage(or.k, 0, 0);
    }
    tex.refresh();
  }
  return { cle, l: W, h: H, R, mise };
}
// Le nom posé dans un conteneur (un groupe de la place), centré en (x, y). Il se redessine tout seul quand la police
// arrive du réseau (comme poserEnseigne), et sur demande (relettrer : la relation avec le marchand a changé de couleur).
function poserLettrage(s, g, x, y, texte, o) {
  const im = s.add.image(x, y, lettrageHD(s, texte, o).cle); im.lettre = { texte, o };
  relettrer(s, im, {});
  g.add(im);
  const sonde = `${o.italique ? 'italic ' : ''}${o.graisse || 900} 20px "${o.police || 'Alegreya'}"`;
  if (document.fonts && !document.fonts.check(sonde)) document.fonts.load(sonde).then(() => { if (im.active) relettrer(s, im, {}); }).catch(() => {});
  return im;
}
// Redessine le nom d'une image faite par poserLettrage ; `changements` : de nouvelles options (la couleur : le liseré suit)
function relettrer(s, im, changements) {
  const o = im.lettre.o; Object.assign(o, changements);
  if (changements.couleur) Object.assign(o, contrasteLettrage(changements.couleur, o.fond));
  const L = lettrageHD(s, im.lettre.texte, o);
  im.setTexture(L.cle).setScale(1 / L.R); im.lettrage = L;
}

// La planche du nom de la carte du monde, posée sur le haut des deux poteaux (38 × 20) : bois clair, le nom gravé dessus
function plancheNomCarteHD(scene) {
  const cle = 'plancheNomCarte'; if (scene.textures.exists(cle)) return cle;
  const L = 38, H = 20, t = toileDecor(L, H); t.rampes.pin = rampe(BOIS_CLAIR_NOM);
  for (const x of [3, 31]) for (let y = 17; y < H; y++) { t.poser(x, y, 'cheneSombre', 3); t.poser(x + 1, y, 'cheneSombre', 1); }
  planche(t, 0, 0, L, 17, 'pin', { graine: 7490, noeuds: 1 });
  for (let x = 0; x < L; x++) { t.poser(x, 0, 'pin', 5); t.poser(x, 16, 'chene', 1); }
  for (const [x, y] of [[2, 2], [L - 3, 2], [2, 14], [L - 3, 14]]) t.poser(x, y, 'fer', 4);
  t.contour(); t.texture(scene, cle); return cle;
}
// La bannière de velours du portique des enchères, élargie entre ses deux montants (50 × 15), frangée d'or
function banniereEncheresHD(scene) {
  const cle = 'banniereEncheres'; if (scene.textures.exists(cle)) return cle;
  const L = 50, H = 15, t = toileDecor(L, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) {
    if (y >= 12 && Math.abs((x % 10) - 4.5) > (15 - y) * 1.6) continue;
    t.poser(x, y, 'cuirRouge', 3 + (x < 2 ? 1 : 0) - (x > L - 3 ? 1 : 0) + (y === 1 ? 1 : 0) - (y > 10 ? 1 : 0) + (fbm(x * 0.1, y * 0.4, 7480) > 0.68 ? -1 : 0));
  }
  for (let x = 0; x < L; x++) { t.poser(x, 0, 'laiton', 4); t.poser(x, 11, 'laiton', 3); }
  t.contour(); t.texture(scene, cle); return cle;
}
// Le poteau indicateur du sentier du Moulin : un bras en flèche, de bois clair, où le nom est gravé (66 × 34)
function poteauSentierHD(scene) {
  const cle = 'poteauSentier'; if (scene.textures.exists(cle)) return cle;
  const L = 66, H = 34, t = toileDecor(L, H); t.rampes.pin = rampe(BOIS_CLAIR_NOM);
  planche(t, L - 9, 2, 4, H - 2, 'cheneSombre', { horizontale: false, graine: 7460 });
  t.forme('pin', (x, y) => { if (y < 4 || y > 15) return null; const pointe = L - 1 - Math.abs(y - 9.5) * 0.9; return x <= pointe ? [0, (y - 9.5) / 6, 0.8] : null; }, { decalage: 0.3 });
  for (let x = 1; x < L - 2; x++) t.poser(x, 4, 'pin', 5);
  t.poser(L - 7, 6, 'fer', 5); t.poser(L - 7, 13, 'fer', 5);
  t.contour(); t.texture(scene, cle); return cle;
}
// La petite enseigne du métier, pendue à une potence de fer scellée au poteau de l'étal (l × h en rangs de texture)
function enseignePendueHD(scene, l, h) {
  const cle = 'enseignePendue_' + l + 'x' + h; if (scene.textures.exists(cle)) return cle;
  const bras = l + 4, H = h + 6, t = toileDecor(bras, H); t.rampes.pin = rampe(BOIS_CLAIR_NOM);
  for (let x = 0; x < bras; x++) t.poser(x, 0, 'fer', x === bras - 1 ? 4 : 3);
  for (let k = 0; k < 4; k++) t.poser(k, 1 + k, 'fer', 2);   // la jambe de force
  for (const x of [4, l + 1]) for (let y = 1; y < 6; y++) t.poser(x, y, 'fer', y % 2 ? 4 : 2);
  planche(t, 2, 6, l, h, 'pin', { graine: 7470 + l, noeuds: 0 });
  for (let x = 2; x < l + 2; x++) { t.poser(x, 6, 'pin', 5); t.poser(x, 5 + h, 'chene', 1); }
  for (let y = 6; y < 6 + h; y++) { t.poser(2, y, 'chene', 2); t.poser(l + 1, y, 'chene', 1); }
  t.contour(); t.texture(scene, cle); return cle;
}
// Le métier sur sa petite enseigne : pendue du côté du centre de la place (versDroite), dans le conteneur g, à la hauteur y
// (demi : de l'axe du lieu à la potence) ; renvoie l'image du texte
function poserEnseignePendue(s, g, versDroite, metier, y, demi = 84) {
  const mots = metier;   // (un métier long passe sur deux lignes, coupé au mot le plus proche du milieu)
  const o = { police: 'Alegreya', graisse: 900, taille: 12, couleur: '#1e1006', fond: BOIS_CLAIR_NOM, genre: 'peint', largeur: 84, hauteur: 30, lignesMax: 2, ...contrasteLettrage('#1e1006', BOIS_CLAIR_NOM) };
  const essai = lettrageHD(s, mots, { ...o, lignesMax: 1 });
  if (essai.mise.deborde || essai.mise.t < o.taille || essai.mise.e < 0) o.coupe = true;   // (trop long pour une ligne à la taille voulue : deux lignes, pas des lettres serrées)
  const L = lettrageHD(s, mots, o);
  const l = Math.max(24, Math.ceil(L.l / 2)), h = Math.max(9, Math.ceil(L.h / 2));
  const e = s.add.image(versDroite ? demi : -demi, y, enseignePendueHD(s, l, h)).setOrigin(versDroite ? 0 : 1, 0).setScale(2).setFlipX(!versDroite);
  g.add(e);
  const cx = versDroite ? demi + (2 + l / 2) * 2 : -demi - (2 + l / 2) * 2;
  return [e, poserLettrage(s, g, cx, y + 12 + h, mots, o)];
}

// (v1.62) Le plan du sol de la grand-place (terre battue sous les étals et sur les chemins d'usure, dalles au centre,
// herbe ailleurs) : la place le peint vu d'au-dessus, la vue du mendiant le reprend en perspective.
function planSolPlace() {
  const pads = Object.entries(LIEUX_PLACE).filter(([k]) => !['fontaine', 'arche', 'moulin', 'carte'].includes(k)).map(([k, [x, y]]) => PETITS_LIEUX.includes(k) ? [x / 2, y / 2 - 6, 44, 18] : [x / 2, y / 2 - 12, 104, 34]);
  pads.push([530, 500, 40, 20]);
  const chemins = [...pads.map(([x, y]) => [[450, 318], [x, y]]), [[450, 318], [450, 520], 12], [[450, 318], [900, 382], 8], [[0, 92], [900, 92], 11]];
  return { centre: [450, 318], rTerre: 150, rDalles: 104, pads, chemins, largeur: 8, pas: [[450, 432], [452, 452], [448, 472], [451, 492]] };
}
// Un point du plan (en demi-pixels de la place, continus) est-il de terre battue ? (le même calcul que solPlaceHD)
function estTerrePlace(plan, x, y) {
  const distSeg = (x, y, [ax, ay], [bx, by]) => { const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1; const u = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l2)); return Math.hypot(ax + u * dx - x, ay + u * dy - y); };
  const n = (fbm(x * 0.06, y * 0.06, plan.graine || 7600) - 0.5) * 14, [cx, cy] = plan.centre;
  if (Math.hypot(x - cx, (y - cy) * 1.55) < plan.rTerre + n) return true;
  for (const [px, py, pl, ph] of plan.pads) { const ex = Math.max(0, Math.abs(x - px) - pl / 2), ey = Math.max(0, Math.abs(y - py) - ph / 2); if (Math.hypot(ex, ey * 1.4) < 8 + n * 0.6) return true; }
  for (const c of plan.chemins) if (distSeg(x, y, c[0], c[1]) < (c[2] || plan.largeur) + n * 0.4) return true;
  return false;
}

// --- (v1.62, planche 80, système A validé) Le porche couvert, à l'entrée de la place côté rue ---
// Deux poteaux de chêne sur leurs socles de grès, un linteau, un petit toit de tuiles, les deux battants ouverts vers
// la place ; le nom est peint sur le linteau. L'ouverture est vide : on voit le chemin, et qui passe.
function toilePorche(l, h) { const t = toileDecor(l, h); Object.assign(t.rampes, RAMPES_RUE); t.rampes.gres = rampe(0xb8a07a); return t; }
// Un battant ouvert vers la place, vu de biais : il part du gond (xh, bas) et file vers l'intérieur (sens) et vers le
// fond (il monte à l'écran) ; des planches et deux pentures
function battantOuvert(t, xh, bas, sens, { dx = 11, dy = 14, haut = 46, graine = 1 } = {}) {
  for (let u = 0; u <= dx; u++) {
    const x = xh + sens * u, yb = bas - Math.round(u / dx * dy), yt = yb - haut;
    for (let y = yt; y <= yb; y++) {
      const h = yb - y, joint = u > 0 && u % Math.max(3, Math.round(dx / 4)) === 0;
      const penture = (Math.abs(h - haut * 0.18) < 1 || Math.abs(h - haut * 0.8) < 1) && u < dx - 1;
      if (penture) { t.poser(x, y, 'fer', 3); continue; }
      if (Math.abs(h - haut * 0.18 + 1.5) < 0.6 || Math.abs(h - haut * 0.8 + 1.5) < 0.6) { t.poser(x, y, 'fer', 1); continue; }
      t.poser(x, y, 'chene', joint ? 1 : u === dx ? 1 : y === yt ? 4 : 2 + (hachage(Math.floor(u / 3), Math.floor(h / 9), graine) > 0.6 ? 1 : 0));
    }
  }
}
// Le porche (120×84, demi-résolution, ×2 sur la place) ; PORCHE_MARCHE : où sont ses poteaux et ses battants
const PORCHE_MARCHE = { L: 120, H: 84, poteaux: [25, 94], socle: 6, linteau: 18, hLinteau: 11 };   // (le linteau, haut de 11 rangs, porte « Vers la rue » : poserPorchePlace)
function porcheMarcheHD(scene) {
  if (scene.textures.exists('porcheMarcheHD')) return 'porcheMarcheHD';
  const L = PORCHE_MARCHE.L, H = PORCHE_MARCHE.H, sol = H - 1, t = toilePorche(L, H);
  battantOuvert(t, 29, sol - 3, 1, { dx: 13, dy: 16, haut: 48, graine: 7401 }); battantOuvert(t, 90, sol - 3, -1, { dx: 13, dy: 16, haut: 48, graine: 7402 });
  for (const cx of PORCHE_MARCHE.poteaux) {
    moellons(t, cx - 6, sol - 7, 13, 8, 7403 + cx, 'gres', 6);                                         // le socle de pierre
    for (let x = cx - 6; x <= cx + 6; x++) t.poser(x, sol - 7, 'gres', 5);
    planche(t, cx - 3, 22, 7, sol - 29, 'chene', { horizontale: false, graine: 7404 + cx, noeuds: 1 });  // le poteau
    for (let y = 22; y < sol - 7; y++) { t.poser(cx - 3, y, 'chene', 5); t.poser(cx + 3, y, 'chene', 1); }
  }
  for (const [x0, sens] of [[28, 1], [91, -1]]) for (let k = 0; k < 11; k++) for (let e = 0; e < 3; e++) t.poser(x0 + sens * k, 40 - k + e, 'chene', e === 0 ? 4 : 2);   // les aisseliers
  const { linteau, hLinteau } = PORCHE_MARCHE;
  planche(t, 8, linteau, 104, hLinteau, 'chene', { graine: 7405, noeuds: 2 });                        // le linteau, où le nom est peint
  for (let x = 8; x < 112; x++) { t.poser(x, linteau, 'chene', 5); t.poser(x, linteau + hLinteau - 1, 'cheneSombre', 1); }
  for (const x of [11, 108]) for (const y of [linteau + 3, linteau + 8]) t.poser(x, y, 'fer', 5);     // ses chevilles
  toitRue(t, 2, 117, 4, 18, 'tuile', 7406);                                                           // le petit toit de tuiles
  t.contour(); t.texture(scene, 'porcheMarcheHD'); return 'porcheMarcheHD';
}
// --- (v1.62, planche 80 validée) Le mendiant vu de près, dans son vrai coin de la grand-place ---
// On le regarde depuis là où se tient JeuneGoy (juste au sud de lui) : derrière lui, c'est la place elle-même, en
// perspective. Le sol est celui de la place (même plan, même grain), les étals, les maisons, les arbres et la fontaine
// sont posés à leur vraie distance, avec un peu de brume au loin. Plus de mur de ruelle.
// La caméra : 2,5 m au sud du mendiant, les yeux à 1,45 m ; 40 px de la place font 1 m ; l'horizon en y0.
const CAMERA_MENDIANT = { X: 756, Y: 1100, h: 1.45, f: 512, y0: 208, m: 40 };
function projeterMendiant(X, Y) { const C = CAMERA_MENDIANT, d = (C.Y - Y) / C.m; if (d <= 0.2) return null; const k = C.f / d; return { d, k, x: 480 + (X - C.X) / C.m * k, y: C.y0 + C.h * k, e: k / C.m }; }

// Le sol vu du coin du mendiant (480 de large, à demi-résolution, de l'horizon au bas de l'écran), une texture par
// saison. Il est long à peindre : on le prépare par petits morceaux pendant qu'on se promène sur la place
// (budget : le temps qu'on peut y passer à chaque appel, en ms), et on le finit d'un coup si la vue s'ouvre avant.
const SOLS_MENDIANT = {};
function solMendiantHD(s, saison, budget = Infinity) {
  const cle = 'solMendiant_' + saison;
  if (s.textures.exists(cle)) return cle;
  const src = 'solPlace_' + saison;
  if (!s.textures.exists(src) || !s.palettePlace) return null;
  const etat = SOLS_MENDIANT[cle] = SOLS_MENDIANT[cle] || { suite: peindreSolMendiant(s, s.palettePlace, src) };
  const fin = performance.now() + budget;
  let r;
  do { r = etat.suite.next(); } while (!r.done && performance.now() < fin);
  if (!r.done) return null;
  const { W, H, img, r0 } = r.value, tex = s.textures.createCanvas(cle, W, H);
  tex.getContext().putImageData(img, 0, 0); tex.refresh(); tex.r0 = r0;
  delete SOLS_MENDIANT[cle];
  return cle;
}
function* peindreSolMendiant(s, pal, src) {
  const C = CAMERA_MENDIANT, S = pal.sol, plan = planSolPlace(), G0 = 7600;
  const R = { herbe: rampe(S.herbe), terre: rampe(S.terre), pierre: rampe(S.pierre), fleur: rampe(S.fleur), fleur2: rampe(S.fleur2), feuille: rampe(S.feuille), joint: rampe(((S.terre >> 1) & 0x7f7f7f)) };
  const qui = new Map(); for (const [m, r] of Object.entries(R)) r.forEach((c, k) => { if (!qui.has(c)) qui.set(c, [m, k]); });
  const image = s.textures.get(src).getSourceImage();
  const px0 = image.getContext('2d').getImageData(0, 0, image.width, image.height).data, SW = image.width, SH = image.height;
  const lire = (X, Y) => { const x = Math.floor(X / 2), y = Math.floor(Y / 2); if (x < 0 || y < 0 || x >= SW || y >= SH) return ['herbe', 3]; const i = (y * SW + x) * 4, c = (px0[i] << 16) | (px0[i + 1] << 8) | px0[i + 2]; return qui.get(c) || ['herbe', 3]; };
  const r0 = Math.floor(C.y0 / 2) + 1, W = 480, H = 270 - r0;
  const img = new ImageData(W, H), brume = [0xd8, 0xcc, 0xb4];
  for (let py = 0; py < H; py++) {
    const sy = (r0 + py) * 2 + 1, d = C.h * C.f / (sy - C.y0), dLoin = C.h * C.f / Math.max(0.5, sy - 1 - C.y0), dPres = C.h * C.f / (sy + 1 - C.y0);
    const prof = (dLoin - dPres) * C.m / 2;   // combien de demi-pixels de place ce rang couvre, en profondeur
    for (let px = 0; px < W; px++) {
      const lat = ((px * 2 + 1) - 480) * d / C.f, X = C.X + lat * C.m, Y = C.Y - d * C.m;
      let c;
      if (d < 7) {
        // de près : le plan exact (bords nets, sans escaliers), le grain de la place, et des détails à la bonne taille
        const x = X / 2, y = Y / 2, T = (a, b) => estTerrePlace(plan, a, b);
        const terre = T(x, y), [mPl, kPl] = lire(X, Y);
        if (terre && (mPl === 'pierre' || mPl === 'joint')) c = R[mPl][kPl];
        else if (terre) {
          const p = fbm(x * 0.05, y * 0.05, G0 + 6);
          let k = p > 0.6 ? 4 : p < 0.24 ? 2 : 3;
          if (!T(x, y - 1)) k = 1; else if (!T(x, y - 2) || !T(x - 1, y)) k = Math.min(k, 2);
          const g = hachage(Math.floor(X * 0.9), Math.floor(Y * 0.9), 7611);
          if (g > 0.985) k = 5; else if (g > 0.965) k = 4; else if (g < 0.03) k = Math.max(1, k - 1);   // le gravier
          c = R.terre[k];
        } else {
          const p = fbm(x * 0.025, y * 0.025, G0 + 4);
          let k = p > 0.6 ? 4 : 3;
          if (T(x, y + 1)) k = 5; else if (T(x, y + 2)) k = 4;
          const b = hachage(px, Math.floor(sy / 3), 7612);
          if (b > 0.9) k = Math.min(5, k + 1); else if (b < 0.07) k -= 1;   // les brins
          const f = hachage(Math.floor(X / 3), Math.floor(Y / 3), 7613);
          c = f > 0.992 ? R.fleur[4] : f > 0.986 ? R.fleur2[4] : R.herbe[Math.max(0, k)];
        }
      } else {
        // au loin : la couleur moyenne de ce que le pixel couvre sur la place
        const n = Math.max(1, Math.min(10, Math.ceil(prof))); let rr = 0, gg = 0, bb = 0;
        for (let j = 0; j < n; j++) { const [m, k] = lire(X, Y - (j / n - 0.5) * prof * 2); const cc = R[m][k]; rr += cc >> 16; gg += (cc >> 8) & 255; bb += cc & 255; }
        c = (Math.round(rr / n) << 16) | (Math.round(gg / n) << 8) | Math.round(bb / n);
      }
      const a = Math.max(0, Math.min(0.4, (d - 6) / 45)), i = (py * W + px) * 4;
      img.data[i] = (c >> 16) * (1 - a) + brume[0] * a; img.data[i + 1] = ((c >> 8) & 255) * (1 - a) + brume[1] * a; img.data[i + 2] = (c & 255) * (1 - a) + brume[2] * a; img.data[i + 3] = 255;
    }
    yield py;
  }
  return { W, H, img, r0 };
}

// Un groupe de la place (un étal avec son marchand, le crieur...) photographié tel qu'il est ce matin, pour le poser au
// loin (la même texture est repeinte à chaque visite : les étals changent d'un jour à l'autre)
function instantanePlace(s, g, cle) {
  const W = 420, H = 300, ox = 210, oy = 280, [x, y, sc] = [g.x, g.y, g.scaleX];   // (large : l'enseigne pendue du métier dépasse de l'étal)
  const dt = s.textures.exists(cle) ? s.textures.get(cle) : s.textures.addDynamicTexture(cle, W, H);
  dt.clear();
  g.setPosition(ox, oy).setScale(1); dt.draw(g); g.setPosition(x, y).setScale(sc);
  dt.oy = oy;
  return cle;
}
// Une palissade vue de près (le bout de la barrière gauche, à 2 m), peinte à demi-résolution à cette distance
function palissadePresHD(s, l, h, poteaux, rails) {
  const cle = 'palissadeMendiant'; if (s.textures.exists(cle)) return cle;
  const t = toileDecor(l, h);
  for (const [y0, e] of rails) planche(t, 0, y0, l, e, 'chene', { graine: 7620 + y0, noeuds: 2 });
  for (const [x0, e] of poteaux) { planche(t, x0, 0, e, h, 'chene', { horizontale: false, graine: 7630 + x0, noeuds: 1 }); for (let y = 0; y < h; y++) { t.poser(x0, y, 'chene', 4); t.poser(x0 + e - 1, y, 'chene', 1); } }
  t.contour(); t.texture(s, cle); return cle;
}

// L'eau de la fontaine vue d'à hauteur d'homme : des reflets qui dansent, le rideau de gouttes qui tombe de la vasque,
// les jets des deux lions, le petit jet du sommet ; tout est placé avec la même projection que la fontaine
function eauFontaineBasse(s, c, info) {
  const F = FONTAINE_RELIEF, P = info.projeter, Ri = F.R - F.rebord, [, v2, , vr2] = F.vasque;
  for (let k = 0; k < 6; k++) {
    const X = (hachage(k, 1, 913) - 0.5) * Ri * 1.3, Z = (hachage(k, 2, 914) - 0.5) * Ri * 0.9, q = P(X, F.hEau, Z);
    const r = s.add.ellipse(q.x, q.y, 0.4 * q.k, 2, 0xffffff, 0.45); c.add(r);
    s.tweens.add({ targets: r, alpha: 0.05, scaleX: 1.6, duration: 900 + k * 170, yoyo: true, repeat: -1, delay: k * 140 });
  }
  const ev = s.time.addEvent({ delay: 70, loop: true, callback: () => {
    if (!c.active) { ev.remove(); return; }
    // une goutte du rebord de la vasque (la moitié qui nous fait face), jusqu'à l'eau du bassin, à la verticale
    const phi = Math.PI * (0.08 + Math.random() * 0.84), X = Math.cos(phi) * (vr2 - 0.04), Z = -Math.sin(phi) * (vr2 - 0.04);
    const a = P(X, v2, Z), b = P(X, F.hEau, Z), g = s.add.circle(a.x, a.y, 1.4, 0xc8f0ff, 0.9); c.add(g);
    s.tweens.add({ targets: g, y: b.y, duration: 430 + Math.random() * 60, ease: 'Quad.easeIn', onComplete: () => {
      g.destroy(); if (!c.active || Math.random() > 0.3) return;
      const o = s.add.ellipse(b.x, b.y, 6, 2).setStrokeStyle(1, 0xe8fcff, 0.7); c.add(o);
      s.tweens.add({ targets: o, scaleX: 2.2, scaleY: 1.6, alpha: 0, duration: 420, onComplete: () => o.destroy() }); } });
    // les jets des lions, en arc, jusqu'à l'eau
    if (Math.random() < 0.6) for (const sens of [-1, 1]) {
      const m = P(sens * (F.col + 0.2), F.lion - 0.04, -0.03), e = P(sens * (0.95 + Math.random() * 0.15), F.hEau, -0.05), j = s.add.circle(m.x, m.y, 1.3, 0xd8f4ff, 0.95); c.add(j);
      s.tweens.add({ targets: j, x: e.x, duration: 360, ease: 'Linear' });
      s.tweens.add({ targets: j, y: e.y, duration: 360, ease: 'Quad.easeIn', onComplete: () => j.destroy() });
    }
    // le petit jet du sommet
    if (Math.random() < 0.4) { const h = P(0, F.boule[0] + F.boule[1], 0), j = s.add.circle(h.x, h.y, 1.1, 0xe8fcff, 0.95); c.add(j);
      s.tweens.add({ targets: j, x: j.x + (Math.random() - 0.5) * 16, duration: 520, ease: 'Linear' });
      s.tweens.add({ targets: j, y: h.y - 7, duration: 240, ease: 'Quad.easeOut', yoyo: true, onComplete: () => j.destroy() }); }
  } });
}

// Le décor complet de la vue du mendiant : le ciel et les collines, le sol, puis tout ce qui est debout, du plus loin
// au plus près, avec un voile de brume sur le lointain ; au premier plan, le bout de la barrière.
//   fontaine : { x, sol } le centre du bassin sur la place
function decorMendiantHD(s, saison, fontaine) {
  const c = s.add.container(0, 0), C = CAMERA_MENDIANT, pal = s.palettePlace, G = s.G;
  const fond = s.add.graphics(); c.add(fond); dessinerComte(fond, 0, 0, 960, C.y0 + 14, 'aube');
  const sol = solMendiantHD(s, saison);
  if (sol) c.add(s.add.image(0, s.textures.get(sol).r0 * 2, sol).setOrigin(0).setScale(2));
  const objets = [];
  const poser = (cle, X, Y, echellePlace, { oy = 1, ombre = 0, flip = false } = {}) => { const P = projeterMendiant(X, Y); if (P) objets.push({ d: P.d, P, cle, echellePlace, oy, ombre, flip }); };
  [['rueForgeHD', 110], ['rueImpasseHD', 300], ['rueBanqueHD', 470], ['rueBanqueHD', 1330], ['rueImpasseHD', 1500], ['rueForgeHD', 1690]].forEach(([k, x]) => { if (s.textures.exists(k)) poser(k, x, 160, 1.3); });
  [[70, 420, 0], [70, 760, 1], [1740, 420, 1], [420, 740, 1], [1390, 760, 0], [560, 200, 0], [1250, 200, 1]].forEach(([x, y, v]) => { const cle = arbrePlaceHD(s, pal, v, x, y); poser(cle, x, y, 2.2, { ombre: 120, oy: origineArbre(s, cle) }); });
  const marcheDuJour = typeof jourDeMarche === 'function' && jourDeMarche(G);
  [[250, 760], [1520, 760], [700, 760], [1100, 760], ...(marcheDuJour ? [] : [[460, 470], [1340, 470]])].forEach(([x, y]) => { const cle = buissonPlaceHD(s, pal, x, y); poser(cle, x, y, 2.2, { ombre: 70, oy: origineArbre(s, cle) }); });
  if (marcheDuJour) [[450, 486, false], [1350, 486, true]].forEach(([x, y, miroir]) => poser(charretteColporteurHD(s), x, y, 2.2, { ombre: 230, flip: miroir }));
  // les étals et les lieux, photographiés sur la place même, avec leurs marchands
  const faits = new Set();
  for (const g of s.place.list) {
    const k = g.cle; if (!k || faits.has(k) || k === 'mendiant' || !LIEUX_PLACE[k]) continue;
    faits.add(k);
    const [x, y] = LIEUX_PLACE[k], cle = instantanePlace(s, g, 'instantaneMendiant_' + k);
    poser(cle, x, y, 0.9, { oy: s.textures.get(cle).oy / 300, ombre: PETITS_LIEUX.includes(k) ? 90 : 200 });
  }
  // la fontaine, dessinée en relief avec la même caméra que le sol, et ses deux pots de fleurs
  const lat = (fontaine.x - C.X) / C.m, prof = (C.Y - fontaine.sol) / C.m;
  const fo = fontaineVueBasseHD(s, C, lat, prof);
  objets.push({ d: prof, fontaine: fo });
  for (const sens of [-1, 1]) poser(potFleursHD(s), fontaine.x + sens * 150, fontaine.sol + 50, 1.1, { flip: sens > 0 });
  objets.sort((a, b) => b.d - a.d);
  let voile = false;
  for (const o of objets) {
    if (!voile && o.d < 12) { voile = true; c.add(s.add.rectangle(480, 0, 960, projeterMendiant(0, C.Y - 12 * C.m).y + 2, 0xe8dcc4, 0.16).setOrigin(0.5, 0)); }
    if (o.fontaine) {
      // son ombre, portée à droite (le soleil vient de la gauche), puis la fontaine et son eau qui bouge
      const F = FONTAINE_RELIEF, P = o.fontaine.projeter, av = P(0.5, 0, -F.R), ar = P(0.5, 0, F.R), mi = P(0.5, 0, 0);
      c.add(s.add.image(mi.x + 4, (av.y + ar.y) / 2, ombrePlaceHD(s)).setScale((F.R + 0.3) * 2 * mi.k / 64, Math.max(4, av.y - ar.y + 6) / 24));
      c.add(s.add.image(o.fontaine.x, o.fontaine.y, o.fontaine.cle).setOrigin(0).setScale(2));
      eauFontaineBasse(s, c, o.fontaine);
      continue;
    }
    const sc = o.echellePlace * o.P.e;
    if (o.ombre) c.add(s.add.image(o.P.x + o.ombre * o.P.e * 0.05, o.P.y, ombrePlaceHD(s)).setScale(o.ombre * o.P.e / 64, o.ombre * o.P.e * 0.11 / 24));
    c.add(s.add.image(o.P.x, o.P.y, o.cle).setOrigin(0.5, o.oy).setScale(sc).setFlipX(o.flip));
  }
  // au premier plan, à gauche : le bout de la barrière, à 2 m (dessinée à cette distance, pas agrandie)
  const P = projeterMendiant(693, 1020), e = P.e, hP = 16 * 2.2 * e;
  const xd = Math.round(P.x + 6.6 * e), largeur = Math.ceil(xd / 2) + 1, haut = Math.round((P.y - hP) / 2);
  const poteaux = [[Math.round(P.x / 2), Math.round(6.6 * e / 2)], [Math.round(projeterMendiant(671, 1020).x / 2), Math.round(6.6 * e / 2)]].filter(([x]) => x > -20);
  const rails = [[Math.round(5 * 2.2 * e / 2), Math.round(2 * 2.2 * e / 2)], [Math.round(10 * 2.2 * e / 2), Math.round(2 * 2.2 * e / 2)]];
  c.add(s.add.image(0, haut * 2, palissadePresHD(s, largeur, 270 - haut, poteaux.map(([x, w]) => [Math.max(0, x), w]), rails)).setOrigin(0).setScale(2));
  return c;
}

// (v1.62, retours du joueur) Le panneau de la carte du monde, sur la place : deux poteaux de chêne, un tableau de
// planches où la carte est punaisée ; son nom, un seul, sur la planche posée en haut des poteaux (plancheNomCarteHD ; 38×50, ×2)
const CARTE_PLACE = { L: 38, H: 50, cadre: [1, 8, 36, 28] };
function cartePlaceHD(scene) {
  if (scene.textures.exists('cartePlaceHD')) return 'cartePlaceHD';
  const { L, H, cadre: [bx, by, bl, bh] } = CARTE_PLACE, t = toileDecor(L, H);
  for (const x0 of [3, 31]) { planche(t, x0, 0, 4, H, 'chene', { horizontale: false, graine: 7730 + x0, noeuds: 1 }); for (let y = 0; y < H; y++) { t.poser(x0, y, 'chene', 4); t.poser(x0 + 3, y, 'chene', 1); } }
  for (let k = 0; k < 4; k++) planche(t, bx, by + k * 7, bl, 7, 'chene', { graine: 7740 + k, noeuds: 1 });   // le tableau, en planches
  for (let x = bx; x < bx + bl; x++) { t.poser(x, by, 'cheneSombre', 4); t.poser(x, by + bh - 1, 'cheneSombre', 1); }
  for (let y = by; y < by + bh; y++) { t.poser(bx, y, 'cheneSombre', 3); t.poser(bx + bl - 1, y, 'cheneSombre', 1); }
  for (let x = 2; x < L - 2; x++) t.poser(x, 0, 'cheneSombre', 2);   // le haut des poteaux, où pose la planche du nom
  t.contour(); t.texture(scene, 'cartePlaceHD'); return 'cartePlaceHD';
}

// --- (v1.62, retours du joueur) Le coin du mendiant : un vieux tapis élimé, sa sébile ébréchée, son baluchon, une bougie
// dans un pot sur le tonneau, la gamelle cabossée de Brisquet. Les mêmes objets sur la place (petits) et de près (grands).
// Le tapis, en mètres ; son motif se lit en (u, v) de 0 à 1 (au-delà de u : les franges) : [matière, teinte] ou null (un trou)
const TAPIS_MENDIANT = { l: 2.2, p: 1.2 };
function rampesCoinMendiant(t) {
  Object.assign(t.rampes, { laine: rampe(0x9a3e2c), laineS: rampe(0x5a2018), ocreT: rampe(0xc8963e), bleuT: rampe(0x3a5a7a), pieceT: rampe(0x6a7a4a),
    sacT: rampe(0x8a7a58), terreC: rampe(0xb8603a), eau: rampe(0x4a90b8) });
}
function motifTapis(u, v) {
  const T = TAPIS_MENDIANT, x = u * T.l, y = v * T.p;
  if (v < 0 || v > 1) return null;
  if (u < 0 || u > 1) {   // les franges, aux deux bouts : des brins, certains arrachés
    const d = u < 0 ? -x : x - T.l, brin = Math.floor(y / 0.035);
    if (d > 0.04 + hachage(brin, u < 0 ? 3 : 4, 7701) * 0.04 || hachage(brin, u < 0 ? 1 : 2, 7701) < 0.22) return null;
    return ['toile', brin % 2 ? 2 : 3];
  }
  const trou = fbm(x * 3.2, y * 3.2, 7702);
  if (trou > 0.75) return null;   // usé jusqu'à la corde : un trou
  const bord = Math.min(x, T.l - x, y, T.p - y);
  let m = 'laine', k = 3;
  if (bord < 0.13) {   // la bordure : un galon ocre entre deux filets sombres, des chevrons
    m = 'ocreT'; k = 3;
    if (bord < 0.025 || Math.abs(bord - 0.105) < 0.012) { m = 'laineS'; k = 2; }
    else if ((Math.floor((x + y) * 14) % 3) === 0) k = 4;
  } else {
    const l = Math.abs(x - T.l / 2) / 0.52 + Math.abs(y - T.p / 2) / 0.34;   // le médaillon du milieu, en losange
    if (l < 1) { m = l > 0.82 ? 'ocreT' : 'bleuT'; if (l < 0.28) { m = 'ocreT'; k = 4; } }
    else if ((Math.floor(x * 9) + Math.floor(y * 9)) % 2 === 0 && fbm(x * 7, y * 7, 7703) > 0.52) k = 2;   // le fond, à petits carreaux
  }
  if (fbm(x * 1.4, y * 1.4, 7704) > 0.6 && m !== 'laineS') k += 1;   // pâli là où l'on s'assoit
  if (fbm(x * 5, y * 5, 7705) < 0.26) k -= 1;                          // des taches
  if (trou > 0.7) { m = 'toile'; k = 1; }                              // la trame qui se voit au bord des trous
  if (x > 1.42 && x < 1.74 && y > 0.24 && y < 0.56) {                  // une pièce cousue, d'un autre drap
    const couture = Math.min(x - 1.42, 1.74 - x, y - 0.24, 0.56 - y) < 0.016;
    m = couture ? 'laineS' : 'pieceT'; k = couture ? 1 : 3 - (Math.floor(x * 40 + y * 40) % 3 === 0 ? 1 : 0);
  }
  return [m, k];
}
// Le tapis vu de la place (d'au-dessus, un peu de biais)
function tapisMendiantPlaceHD(scene) {
  const cle = 'tapisMendiantPlace'; if (scene.textures.exists(cle)) return cle;
  const L = 48, H = 9, t = toileDecor(L, H); rampesCoinMendiant(t);
  for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) { const r = motifTapis((x + 0.5 - 2) / 44, (y + 0.5) / H); if (r) t.poser(x, y, r[0], r[1]); }
  t.contour(); t.texture(scene, cle); return cle;
}
// Le tapis vu de près, couché sur le sol de la vue : chaque pixel est ramené au sol avec la caméra de la vue
//   cam : { f, y0, h } ; lat, prof : le milieu du tapis (m) ; renvoie { cle, x, y } (le coin haut-gauche, à l'écran)
function tapisMendiantVueHD(scene, cam, lat, prof) {
  const T = TAPIS_MENDIANT, cle = 'tapisMendiantVue_' + [lat, prof].map(v => Math.round(v * 100)).join('_');
  const yDe = d => cam.y0 + cam.h * cam.f / d, xDe = (l, d) => 480 + l * cam.f / d;
  const dl = prof + T.p / 2, dp = prof - T.p / 2, fr = 0.09;
  const x0 = Math.floor(xDe(lat - T.l / 2 - fr, dp) / 2) - 1, x1 = Math.ceil(xDe(lat + T.l / 2 + fr, dp) / 2) + 1, y0 = Math.floor(yDe(dl) / 2) - 1, y1 = Math.min(270, Math.ceil(yDe(dp) / 2) + 1);
  const info = { cle, x: x0 * 2, y: y0 * 2 };
  if (scene.textures.exists(cle)) return info;
  const t = toileDecor(x1 - x0, y1 - y0); rampesCoinMendiant(t);
  for (let py = 0; py < y1 - y0; py++) for (let px = 0; px < x1 - x0; px++) {
    const sx = (x0 + px + 0.5) * 2, sy = (y0 + py + 0.5) * 2; if (sy <= cam.y0) continue;
    const d = cam.h * cam.f / (sy - cam.y0), l = (sx - 480) * d / cam.f;
    const r = motifTapis((l - lat + T.l / 2) / T.l, (dl - d) / T.p);
    if (r) t.poser(px, py, r[0], r[1]);
  }
  t.contour(); t.texture(scene, cle); return info;
}
// La sébile ébréchée (l : sa largeur en demi-pixels ; ecrase : combien on la voit d'au-dessus ; n : les pièces dedans)
function sebileHD(scene, l, ecrase, n = 0) {
  const cle = `sebile_${l}_${Math.round(ecrase * 100)}_${n}`; if (scene.textures.exists(cle)) return cle;
  const rx = l / 2, ry = Math.max(1.5, rx * ecrase), hb = Math.max(2, l * 0.28), H = Math.ceil(ry * 2 + hb + 2), t = toileDecor(l + 2, H);
  const cx = rx + 1, cy = ry + 1;
  t.forme('chene', (x, y) => { const nx = (x + 0.5 - cx) / rx; if (Math.abs(nx) > 1) return null; const bas = cy + Math.sqrt(1 - nx * nx) * (ry + hb); return y + 0.5 >= cy && y + 0.5 <= bas ? [nx, 0.3, 0.8] : null; }, { decalage: -0.4 });   // le ventre de bois
  t.forme('chene', ellipsoide(cx, cy, rx, ry), { decalage: 0.8 });                                   // le rebord
  t.forme('cheneSombre', ellipsoide(cx, cy + ry * 0.12, rx * 0.78, ry * 0.7), { decalage: 0.4, bord: false });   // le creux
  // l'éclat qui manque au rebord, à droite
  for (let y = 0; y < H; y++) for (let x = 0; x < l + 2; x++) if (Math.hypot((x + 0.5 - (cx + rx * 0.72)) / (rx * 0.22), (y + 0.5 - (cy - ry * 0.5)) / Math.max(1, ry * 0.6)) < 1) t.poser(x, y, 'cheneSombre', 1);
  for (let k = 0; k < n; k++) { const a = hachage(k, 1, 7711) * 6.28, r = Math.sqrt(hachage(k, 2, 7711)) * 0.6; const x = Math.round(cx + Math.cos(a) * rx * 0.7 * r), y = Math.round(cy + ry * 0.1 + Math.sin(a) * ry * 0.5 * r); t.poser(x, y, 'or', 4); if (l > 12) { t.poser(x + 1, y, 'or', 3); t.poser(x, y + 1, 'or', 2); } }
  t.contour(); t.texture(scene, cle); return cle;
}
// La gamelle cabossée de Brisquet, en fer-blanc, un fond d'eau
function gamelleHD(scene, l, ecrase) {
  const cle = `gamelle_${l}_${Math.round(ecrase * 100)}`; if (scene.textures.exists(cle)) return cle;
  const rx = l / 2, ry = Math.max(1.5, rx * ecrase), hb = Math.max(1.5, l * 0.2), H = Math.ceil(ry * 2 + hb + 2), t = toileDecor(l + 2, H); rampesCoinMendiant(t);
  const cx = rx + 1, cy = ry + 1;
  t.forme('fer', (x, y) => { const nx = (x + 0.5 - cx) / rx; if (Math.abs(nx) > 1) return null; const bas = cy + Math.sqrt(1 - nx * nx) * ry + hb; return y + 0.5 >= cy && y + 0.5 <= bas ? [nx, 0.2, 0.8] : null; }, { decalage: 0.6, motif: (x, y) => (Math.hypot(x - cx + rx * 0.4, y - cy - ry * 0.6) < Math.max(1.2, rx * 0.25) ? -1.4 : 0) });   // la bosse
  t.forme('fer', ellipsoide(cx, cy, rx, ry), { decalage: 1.2 });
  t.forme('eau', ellipsoide(cx, cy + ry * 0.1, rx * 0.8, ry * 0.68), { decalage: 0.2, bord: false });
  t.contour(); t.texture(scene, cle); return cle;
}
// Le baluchon : un sac de toile rapiécé, noué en haut, une corde autour (l : sa largeur en demi-pixels)
function baluchonHD(scene, l) {
  const cle = 'baluchonMendiant_' + l; if (scene.textures.exists(cle)) return cle;
  const H = Math.round(l * 0.92), t = toileDecor(l + 2, H + 2); rampesCoinMendiant(t);
  const cx = l / 2 + 1, cy = H * 0.62 + 1, rx = l / 2, ry = H * 0.4;
  t.forme('sacT', ellipsoide(cx, cy, rx, ry), { motif: (x, y) => (fbm(x * 0.4, y * 0.4, 7721) - 0.5) * 1.4 });   // le sac, et ses plis
  for (const s of [-1, 1]) t.forme('sacT', ellipsoide(cx + s * rx * 0.28, cy - ry * 1.05, rx * 0.2, ry * 0.42), { decalage: 0.4 });   // les deux oreilles du nœud
  t.forme('sacT', ellipsoide(cx, cy - ry * 0.85, rx * 0.22, ry * 0.2), { decalage: -0.2 });
  // une pièce de toile plus sombre, cousue
  const p0 = [Math.round(cx + rx * 0.05), Math.round(cy - ry * 0.1)], pl = Math.max(2, Math.round(l * 0.26));
  for (let y = p0[1]; y < p0[1] + pl; y++) for (let x = p0[0]; x < p0[0] + pl; x++) if (t.mat(x, y) === 'sacT') t.poser(x, y, 'pieceT', x === p0[0] || y === p0[1] ? 2 : 3);
  // la corde qui ceinture le sac
  for (let x = 0; x < l + 2; x++) { const nx = (x + 0.5 - cx) / rx; if (Math.abs(nx) >= 0.98) continue; const y = Math.round(cy - ry * 0.35 + Math.sqrt(1 - nx * nx) * ry * 0.18); if (t.mat(x, y) === 'sacT') t.poser(x, y, 'chene', x % 3 ? 4 : 2); }
  t.contour(); t.texture(scene, cle); return cle;
}
// La bougie dans son pot de terre cuite (la flamme est à part : elle danse) ; l : la largeur du pot en demi-pixels
function bougiePotHD(scene, l) {
  const cle = 'bougiePot_' + l; if (scene.textures.exists(cle)) return cle;
  const hp = Math.round(l * 0.8), hb = Math.max(2, Math.round(l * 0.5)), H = hp + hb + 2, t = toileDecor(l + 2, H); rampesCoinMendiant(t);
  const cx = l / 2 + 1, haut = hb + 1;
  t.forme('terreC', (x, y) => (y >= haut && y <= H - 1 && Math.abs(x + 0.5 - cx) <= l / 2 - (y - haut) * 0.12 ? [(x + 0.5 - cx) / (l / 2), 0, 0.8] : null));   // le pot
  t.forme('terreC', ellipsoide(cx, haut, l / 2, Math.max(1, l * 0.14)), { decalage: 0.7 });
  const lb = Math.max(1, Math.round(l * 0.18));
  for (let y = 1; y <= haut; y++) for (let x = Math.round(cx - lb); x <= Math.round(cx + lb) - (l < 8 ? 1 : 0); x++) t.poser(x, y, 'cire', x < cx ? 4 : 3);   // la bougie
  if (l >= 8) { t.poser(Math.round(cx + lb), 3, 'cire', 5); t.poser(Math.round(cx + lb), 4, 'cire', 4); }   // une coulure
  t.poser(Math.round(cx), 0, 'cheneSombre', 0);   // la mèche
  t.contour(); t.texture(scene, cle); return cle;
}
// La flamme qui danse au bout de la mèche, et sa lueur
function flammeBougie(s, conteneur, x, y, taille, prof) {
  creerHalo(s);
  const lueur = s.add.image(x, y, 'halo').setScale(taille * 0.09).setTint(0xffb040).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD);
  const f = s.add.ellipse(x, y, taille * 0.5, taille, 0xffc850, 0.95), c = s.add.ellipse(x, y + taille * 0.15, taille * 0.22, taille * 0.45, 0xfff4c0, 1);
  for (const o of [lueur, f, c]) { if (prof !== undefined) o.yTri = prof; conteneur.add(o); }
  f.setOrigin(0.5, 0.85); c.setOrigin(0.5, 0.85);
  const danse = () => { if (!f.active) return; const k = 0.8 + Math.random() * 0.4; s.tweens.add({ targets: [f, c], scaleY: k, scaleX: 1.1 - (k - 0.8) * 0.5, angle: (Math.random() - 0.5) * 14, duration: 90 + Math.random() * 120, onComplete: danse }); s.tweens.add({ targets: lueur, alpha: 0.25 + Math.random() * 0.15, duration: 140 }); };
  danse();
  return [lueur, f, c];
}

// (v1.49) La palette du Comté selon la saison : l'herbe jaunit aux moissons, rougit aux brumes, blanchit au givre
function paletteSaisonComte(saison) {
  const b = PALETTES_REGIONS.comte, s = { ...b.sol };
  if (saison === 'moissons') Object.assign(s, { herbe: 0x94a84a, feuille: 0x6a8a32, fleur: 0xe8b030, fleur2: 0xf0e070 });
  else if (saison === 'brumes') Object.assign(s, { herbe: 0x8a9a52, feuille: 0xc06a2a, fleur: 0xd85a2a, fleur2: 0xe0a040, terre: 0xb89262 });
  else if (saison === 'givre') Object.assign(s, { herbe: 0xdce6ec, feuille: 0x9ab0a8, fleur: 0xffffff, fleur2: 0xc8d8e8, terre: 0xa89880, pierre: 0xb0aaa0 });
  return { ...b, nom: b.nom + ' ' + (saison || ''), sol: s, saison };
}
