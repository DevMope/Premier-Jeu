// La cave du marché noir (v0.57) : trois coins côte à côte, qu'on parcourt en glissant.
//   0. le coin des doyens : de petites habitations creusées dans la roche, une échelle, du linge ;
//   1. le coin des voyageurs (l'arrivée) : murs maçonnés, la voûte et l'escalier qui remonte ;
//   2. la table de la Main Noire : boiseries sombres, tenture rouge, rideau de velours, tapis.
// Tout est peint à demi-résolution dans une seule grande texture (1440 × 270, affichée ×2).

const CAVE = { L: 1440, H: 270, sol: 160, coin: 480 };

function creerCaveHD(scene) {
  if (scene.textures.exists('caveFond')) return;
  const { L, H, sol } = CAVE;
  const t = toileDecor(L, H);
  const R = t.rampes;
  R.roche = [0x120c10, 0x21181c, 0x31252a, 0x433636, 0x584844, 0x6e5c52];
  R.taille = [0x1a1416, 0x2c2426, 0x40363a, 0x564a4a, 0x6c5e5a, 0x86766c];
  R.terreCave = [0x140e0c, 0x221812, 0x32241a, 0x443222, 0x56402c, 0x6a5038];
  R.velours = [0x1a0406, 0x34080c, 0x520e14, 0x72161c, 0x922228, 0xb03a36];
  R.lueur = [0x5a3010, 0x8a5018, 0xb87820, 0xe0a030, 0xf4c860, 0xfff0b0];
  R.linA = rampe(0xb8a888); R.linB = rampe(0x8a4a3a); R.linC = rampe(0x4a5a7a); R.linD = rampe(0x6a7a4a);

  // --- La roche brute (relief à partir d'un champ de bosses, éclairé d'en haut à gauche) ---
  const bosse = (x, y) => fbm(x * 0.045, y * 0.07, 901) + 0.45 * fbm(x * 0.16, y * 0.16, 902);
  const roche = (x, y, mat = 'roche') => {
    const d = bosse(x, y) - bosse(x + 1, y + 1);
    let ton = 2 + Math.round(d * 22) + (y < 30 ? -1 : 0) + (y < 12 ? -1 : 0);
    if (hachage(x, y, 903) > 0.985) ton += 1;
    t.poser(x, y, mat, ton);
  };
  for (let y = 0; y < sol; y++) for (let x = 0; x < L; x++) roche(x, y);

  // --- Le coin des voyageurs : un mur maçonné, la voûte, l'escalier ---
  const ax = 720, ar = 62, ay = 104;   // le centre de la voûte
  const dansArche = (x, y, r) => Math.abs(x + 0.5 - ax) < r && (y >= ay || (x + 0.5 - ax) ** 2 + (y + 0.5 - ay) ** 2 < r * r);
  for (let y = 6; y < sol; y++) for (let x = 500; x < 940; x++) {
    if (dansArche(x, y, ar + 10)) continue;
    const rangee = Math.floor(y / 13), dec = (rangee % 2) * 11;
    const bx = (x + dec) % 22, by = y % 13;
    if (bx === 0 || by === 0) { t.poser(x, y, 'taille', 0); continue; }
    let ton = 2 + (by === 1 ? 1 : 0) + (bx === 1 ? 1 : 0) - (by === 12 || bx === 21 ? 1 : 0) + Math.round((hachage(Math.floor((x + dec) / 22), rangee, 905) - 0.5) * 1.6);
    if (fbm(x * 0.05, y * 0.012, 906) > 0.62) ton -= 1;                // (les coulures d'humidité)
    t.poser(x, y, 'taille', ton);
  }
  // l'arc de la voûte : des claveaux autour de l'ouverture
  for (let y = 0; y < sol; y++) for (let x = 640; x < 800; x++) {
    if (!dansArche(x, y, ar + 10) || dansArche(x, y, ar)) continue;
    const ang = Math.atan2(y + 0.5 - ay, x + 0.5 - ax), k = Math.floor((ang + Math.PI) / (Math.PI / 11));
    const joint = Math.abs(((ang + Math.PI) / (Math.PI / 11)) - Math.round((ang + Math.PI) / (Math.PI / 11))) < 0.06 && y < ay;
    const r = Math.hypot(x + 0.5 - ax, y + 0.5 - ay);
    t.poser(x, y, 'taille', joint ? 0 : (r < ar + 2 ? 2 : r > ar + 8 ? 2 : 4) + (k % 2 ? 0 : -1) + (y >= ay && x > ax ? -1 : 0));
  }
  // dans l'ouverture : le noir, et l'escalier qui remonte vers la ruelle (de plus en plus sombre)
  for (let y = 0; y < sol; y++) for (let x = ax - ar; x < ax + ar; x++) if (dansArche(x, y, ar)) t.poser(x, y, 'roche', 0);
  for (let i = 0; i < 7; i++) {
    const yH = sol - 2 - i * 12, demi = 54 - i * 6, x0 = ax - demi + i * 4;
    for (let x = x0; x < x0 + demi * 2 - i * 4; x++) {
      if (!dansArche(x, yH - 10, ar)) continue;
      for (let j = 0; j < 3; j++) t.poser(x, yH - 12 + j, 'taille', Math.max(0, 4 - Math.floor(i * 0.6) - j));   // le dessus de la marche
      for (let j = 3; j < 12; j++) t.poser(x, yH - 12 + j, 'taille', Math.max(0, 1 - Math.floor(i / 3)));     // la contremarche
    }
  }

  // --- Le coin des doyens : des maisons creusées dans la roche ---
  const maison = (cx, bas, larg, haut, { fenetre = true, graine = 1 } = {}) => {
    const dedans = (x, y) => Math.abs(x + 0.5 - cx) < larg / 2 && y < bas && (y >= bas - haut + larg / 2 || (x + 0.5 - cx) ** 2 + (y + 0.5 - (bas - haut + larg / 2)) ** 2 < (larg / 2) ** 2);
    // l'encadrement taillé, puis la porte de planches
    for (let y = bas - haut - 4; y < bas; y++) for (let x = cx - larg / 2 - 4; x < cx + larg / 2 + 4; x++) {
      const pres = !dedans(x, y) && [[3, 0], [-3, 0], [0, 3], [2, 2], [-2, 2]].some(([dx, dy]) => dedans(x + dx, y + dy));
      if (pres) t.poser(x, y, 'taille', y < bas - haut / 2 ? 4 : 3);
    }
    planche(t, Math.round(cx - larg / 2), bas - haut, larg, haut, 'chene', { horizontale: false, graine });
    for (let y = bas - haut - 1; y < bas; y++) for (let x = Math.round(cx - larg / 2) - 1; x < cx + larg / 2 + 1; x++) {
      if (!dedans(x, y)) { if (t.mat(x, y) === 'chene') roche(x, y); continue; }
      if ((x - Math.round(cx - larg / 2)) % 8 === 0) t.poser(x, y, 'chene', 0);                       // les planches
    }
    for (const yb of [bas - haut * 0.7, bas - haut * 0.3]) for (let x = Math.round(cx - larg / 2); x < cx + larg / 2; x++) { t.poser(x, Math.round(yb), 'fer', 2); t.poser(x, Math.round(yb) + 1, 'fer', 1); }
    t.poser(Math.round(cx + larg / 2 - 5), bas - Math.round(haut * 0.45), 'laiton', 5);              // la poignée
    if (fenetre) {
      // une petite fenêtre ronde, à côté, où brille une lampe
      const fx = cx + larg / 2 + 14, fy = bas - haut * 0.62;
      for (let y = Math.round(fy - 8); y < fy + 8; y++) for (let x = Math.round(fx - 8); x < fx + 8; x++) {
        const d = Math.hypot(x + 0.5 - fx, y + 0.5 - fy);
        if (d < 5) t.poser(x, y, 'lueur', d < 2.5 ? 5 : 3 + (Math.abs(x + 0.5 - fx) < 0.6 || Math.abs(y + 0.5 - fy) < 0.6 ? -2 : 0));
        else if (d < 7) t.poser(x, y, 'chene', d < 6 ? 3 : 1);
      }
    }
  };
  maison(96, sol, 40, 62, { graine: 911 });
  maison(318, sol, 44, 66, { graine: 912 });
  // la maison du haut, avec son rebord de planches et son échelle
  maison(214, 82, 34, 50, { fenetre: true, graine: 913 });
  planche(t, 176, 82, 92, 6, 'chene', { graine: 914 });
  for (let y = 88; y < sol; y++) for (const x of [244, 254]) { t.poser(x, y, 'chene', 3); t.poser(x + 1, y, 'chene', 1); }
  for (let y = 92; y < sol; y += 9) for (let x = 244; x < 256; x++) { t.poser(x, y, 'chene', 4); t.poser(x, y + 1, 'chene', 1); }
  // le linge qui sèche, sur une corde tendue entre deux crochets
  const corde = x => Math.round(28 + ((x - 30) / 400) * 10 + Math.sin(((x - 30) / 400) * Math.PI) * 9);
  for (let x = 30; x < 430; x++) t.poser(x, corde(x), 'toile', 1);
  [[60, 18, 22, 'linA'], [96, 14, 16, 'linB'], [150, 20, 26, 'linC'], [262, 16, 18, 'linA'], [300, 22, 14, 'linD'], [372, 14, 22, 'linB']].forEach(([x0, l, h, mat], i) => {
    for (let x = x0; x < x0 + l; x++) {
      const y0 = corde(x) + 1, bas = h + Math.round(Math.sin((x - x0) / l * Math.PI) * 2) + (i % 2 ? (x - x0) % 5 === 0 ? -1 : 0 : 0);
      for (let y = y0; y < y0 + bas; y++) t.poser(x, y, mat, 3 + (x === x0 ? -1 : 0) + (x === x0 + l - 1 ? -1 : 0) + ((x - x0) % 4 === 0 ? -1 : 0) + (y === y0 ? 1 : 0));
    }
    for (const px of [x0 + 1, x0 + l - 2]) t.poser(px, corde(px), 'chene', 4);   // les pinces
  });

  // --- La table de la Main Noire : boiseries sombres, tenture rouge à la main noire ---
  for (let y = 8; y < sol; y++) for (let x = 990; x < L; x++) {
    const p = (x - 990) % 40;
    let ton = p < 2 ? 1 : p > 37 ? 1 : 2 + Math.round((fbm(x * 0.02, y * 0.2, 921) - 0.5) * 2);
    if (y % 54 < 2) ton = 0;
    if (y % 54 === 2) ton = 4;
    t.poser(x, y, 'cheneSombre', ton);
  }
  for (let y = 18; y < 132; y++) for (let x = 1150; x < 1290; x++) {
    const pli = Math.sin((x - 1150) / 7) * 0.8;
    let ton = 3 + Math.round(pli) + (x < 1153 || x > 1286 ? -1 : 0);
    if (y < 22) ton = 4;
    if (y > 124) { t.poser(x, y, 'laiton', (x + y) % 3 ? 4 : 2); continue; }   // la frange d'or
    t.poser(x, y, 'velours', ton);
  }
  for (let x = 1144; x < 1296; x++) { t.poser(x, 16, 'laiton', 3); t.poser(x, 17, 'laiton', 5); t.poser(x, 15, 'laiton', 1); }
  // le rideau de velours, à l'entrée du coin, retenu par une cordelière dorée
  for (let y = 0; y < sol + 6; y++) for (let x = 960; x < 1012; x++) {
    const retenu = y > 70 && y < 86;
    const bord = 1012 - (y > 40 && y < 120 ? 18 * Math.sin(((y - 40) / 80) * Math.PI) : 0);
    if (x > bord) continue;
    const pli = Math.sin((x - 960) / 5 + (retenu ? 0 : y * 0.01)) * 1.2;
    t.poser(x, y, retenu ? 'laiton' : 'velours', retenu ? 3 + ((x + y) % 3 === 0 ? 1 : 0) : 2 + Math.round(pli) + (x > bord - 2 ? -1 : 0));
  }
  for (let x = 960; x < L; x++) for (let y = 0; y < 10; y++) t.poser(x, y, 'velours', y > 7 ? 1 : 3 + Math.round(Math.sin(x / 6)));   // le lambrequin

  // --- Les piliers de roche qui séparent les coins ---
  for (const px of [480, 960]) for (let y = 0; y < sol + 4; y++) {
    const demi = 16 + (y > sol - 30 ? (y - (sol - 30)) * 0.5 : 0) + Math.sin(y * 0.09) * 2;
    for (let x = Math.round(px - demi); x < px + demi; x++) {
      const n = (x + 0.5 - px) / demi;
      const ton = Math.round(3.4 - n * 1.6 - (1 - Math.sqrt(1 - Math.min(1, n * n))) * 1.5 + (fbm(x * 0.2, y * 0.08, 931) - 0.5) * 1.5);
      t.poser(x, y, 'roche', ton);
    }
  }

  // --- Le sol : de la terre battue, des dalles chez les voyageurs, un tapis chez la Main Noire ---
  for (let y = sol; y < H; y++) for (let x = 0; x < L; x++) {
    const p = (y - sol) / (H - sol);
    let ton = 2 + Math.round((fbm(x * 0.06, y * 0.2, 941) - 0.5) * 2.4) + (p < 0.06 ? -1 : 0);
    if (hachage(x, y, 942) > 0.97) ton += 2;                  // (des cailloux)
    if (x > 520 && x < 920 && y > sol + 3) {
      const rg = Math.floor((y - sol - 3) / (6 + p * 8)), dec = rg % 2 ? 14 : 0, bx = (x + dec) % 28;
      if (bx === 0 || (y - sol - 3) % Math.round(6 + p * 8) === 0) { t.poser(x, y, 'terreCave', 0); continue; }
      t.poser(x, y, 'taille', 2 + Math.round((hachage(Math.floor((x + dec) / 28), rg, 943) - 0.5) * 2));
      continue;
    }
    t.poser(x, y, 'terreCave', ton);
  }
  for (let y = sol + 6; y < sol + 40; y++) for (let x = 1060; x < 1370; x++) {
    const bord = y < sol + 9 || y > sol + 36 || x < 1066 || x > 1363;
    const motif = (Math.abs(((x - 1215) / 3) % 8) < 1 || Math.abs(((y - sol) * 2) % 10) < 1) ? 1 : 0;
    t.poser(x, y, bord ? 'laiton' : 'velours', bord ? 2 : 2 - motif + (x % 7 === 0 ? 0 : 0));
  }
  t.texture(scene, 'caveFond');

  // --- Les petits décors à part (devant les personnages) ---
  {
    // La table de jeu de la Main Noire : tapis vert, cartes, piles de pièces
    const d = toileDecor(120, 44);
    d.rampes.feutre = rampe(0x1e4a2a);
    d.forme('cheneSombre', (x, y) => (y >= 8 && y <= 18 && x >= 2 && x <= 117 ? [0, -0.6, 0.8] : null));
    d.forme('feutre', (x, y) => (y >= 4 && y <= 14 && x >= 6 && x <= 113 ? [0, -1, 0.6] : null), { bord: false });
    for (const lx of [10, 106]) d.forme('cheneSombre', (x, y) => (y > 18 && y < 44 && Math.abs(x + 0.5 - lx) < 3 ? [(x + 0.5 - lx) / 3, 0, 0.8] : null));
    [[30, 8], [44, 9], [58, 7]].forEach(([x0, y0], i) => { for (let y = y0; y < y0 + 5; y++) for (let x = x0; x < x0 + 4; x++) d.poser(x, y, 'parchemin', y === y0 || x === x0 ? 5 : 4); d.poser(x0 + 1, y0 + 2, i === 1 ? 'cuirRouge' : 'encre', 2); });
    for (const [x0, n] of [[80, 4], [88, 6], [96, 3]]) for (let j = 0; j < n; j++) for (let x = x0; x < x0 + 6; x++) d.poser(x, 12 - j, 'laiton', j === n - 1 ? 5 : x === x0 ? 2 : 3);
    d.contour();
    d.texture(scene, 'tableMainNoire');
  }
  {
    // Le feu de camp des doyens : un cercle de pierres et des bûches
    const d = toileDecor(44, 16);
    for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; d.forme('pierre', ellipsoide(22 + Math.cos(a) * 17, 9 + Math.sin(a) * 4.5, 3.4, 2.6), { decalage: 0.2 }); }
    d.forme('chene', (x, y) => (Math.abs(y + 0.5 - 8 - (x - 22) * 0.18) < 1.8 && Math.abs(x - 22) < 11 ? [0, -0.7, 0.7] : null));
    d.forme('chene', (x, y) => (Math.abs(y + 0.5 - 8 + (x - 22) * 0.18) < 1.8 && Math.abs(x - 22) < 11 ? [0, -0.7, 0.7] : null));
    d.rampes.lueur = R.lueur;
    for (let x = 18; x < 27; x++) d.poser(x, 8, 'lueur', 4);
    d.contour();
    d.texture(scene, 'feuCamp');
  }
  {
    // Des caisses de contrebande, cerclées de fer
    const d = toileDecor(40, 30);
    for (const [x0, y0, l, h] of [[0, 10, 22, 20], [18, 14, 22, 16], [6, 0, 16, 11]]) {
      planche(d, x0, y0, l, h, 'chene', { graine: x0 + y0 });
      for (let y = y0; y < y0 + h; y++) { d.poser(x0, y, 'chene', 0); d.poser(x0 + l - 1, y, 'chene', 1); }
      for (let x = x0; x < x0 + l; x++) { d.poser(x, y0, 'fer', 3); d.poser(x, y0 + h - 1, 'fer', 1); }
      for (let k2 = 0; k2 < Math.min(l, h); k2++) d.poser(x0 + Math.round(k2 * (l - 1) / (Math.min(l, h) - 1)), y0 + k2, 'chene', 1);   // la traverse en biais
    }
    d.contour();
    d.texture(scene, 'caissesContrebande');
  }
}
