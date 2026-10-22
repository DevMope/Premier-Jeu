// (v1.55, planche 63 validée) Ce qu'on voit du cambrioleur hors de sa nuit : la serrure de la porte de la rue
// (l'amélioration du bureau). Le voleur lui-même est dans le moteur des corps (costume « cambrioleur »).

// La serrure : un simple loquet de bois (0), puis une grosse serrure de fer à moraillon, clous et trou de clé (1)
function serrureHD(scene, n = 1) {
  const cle = 'serrureHD_' + n; if (scene.textures.exists(cle)) return cle;
  const L = 40, H = 44, t = toileDecor(L, H);
  // un pan de la porte, en planches verticales
  for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) t.poser(x, y, 'chene', (x % 10 === 0 ? 1 : 3) - (y > H - 3 ? 1 : 0));
  if (!n) {   // le loquet de bois
    for (let x = 8; x < 32; x++) for (let y = 19; y < 24; y++) t.poser(x, y, 'cheneSombre', y === 19 ? 5 : 3);
    for (const x of [10, 29]) for (let y = 16; y < 27; y++) t.poser(x, y, 'cheneSombre', 2);
    t.contour(); t.texture(scene, cle); return cle;
  }
  // la plaque de fer, ses quatre clous, le trou de la clé
  for (let y = 8; y < 38; y++) for (let x = 9; x < 31; x++) t.poser(x, y, 'fer', x === 9 || y === 8 ? 5 : x === 30 || y === 37 ? 1 : 3);
  for (const [x, y] of [[11, 10], [28, 10], [11, 35], [28, 35]]) { t.poser(x, y, 'fer', 5); t.poser(x + 1, y + 1, 'fer', 1); }
  for (let y = 18; y < 23; y++) for (let x = 18; x < 22; x++) t.poser(x, y, 'encre', 0);
  for (let y = 23; y < 29; y++) for (let x = 19; x < 21; x++) t.poser(x, y, 'encre', 0);
  // le moraillon et son anneau
  for (let x = 2; x < 12; x++) for (let y = 12; y < 15; y++) t.poser(x, y, 'fer', y === 12 ? 4 : 2);
  for (let a = 0; a < 6.3; a += 0.3) t.poser(Math.round(5 + Math.cos(a) * 3), Math.round(18 + Math.sin(a) * 3), 'laiton', a < 3.1 ? 2 : 4);
  t.contour(); t.texture(scene, cle); return cle;
}
