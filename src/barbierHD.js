// (v1.48, planches 72 et 72 v2 validées) Le Fil d'Argent, la boutique d'Orvin : sa façade (fermée avant tes
// 18 ans), le poteau rayé, l'enseigne, le salon (lambris, miroir, flacons, chauffe-serviettes, diplôme de la
// Guilde), le carrelage, le fauteuil, le tabouret, les ciseaux, la cape, les mèches, le rasoir, la mousse...
function rampesBarbier(t) {
  t.rampes.blanc = rampe(0xe8e4dc); t.rampes.rouge = rampe(0xb02a24); t.rampes.bleu = rampe(0x2a4a8a); t.rampes.vert = rampe(0x2e6a3a);
  t.rampes.verre = rampe(0x6a8a9a); t.rampes.mousse = rampe(0xf4f2ec);
}
// La boutique : assise de pierre, colombages, grande vitrine (on voit le fauteuil et le miroir), porte, enseigne, enseigne-poteau
function boutiqueBarbierHD(scene) {
  const cle = 'boutiqueBarbierHD'; if (scene.textures.exists(cle)) return cle;
  const L = 124, H = 112, t = toileDecor(L, H); rampesBarbier(t);
  // le toit d'ardoise
  for (let y = 4; y < 26; y++) for (let x = 2; x < L - 2; x++) { if (Math.abs(x - L / 2) > (y - 2) * 3 + 20) continue; const r = Math.floor((y - 4) / 4), dec = (r % 2) * 5, b = Math.floor((x + dec) / 10); t.poser(x, y, 'ardoise', (y - 4) % 4 === 3 ? 0 : 2 + Math.round(hachage(b, r, 7201) * 2)); }
  // les murs blanchis à la chaux, et les poutres de chêne
  for (let y = 26; y < 98; y++) for (let x = 6; x < L - 6; x++) t.poser(x, y, 'platre', 3 + (fbm(x * 0.15, y * 0.15, 7202) > 0.62 ? -1 : 0) + (y > 92 ? -1 : 0));
  for (const x of [6, 60, L - 10]) for (let y = 26; y < 98; y++) for (let k = 0; k < 4; k++) t.poser(x + k, y, 'cheneSombre', k === 0 ? 1 : 3);
  for (let x = 6; x < L - 6; x++) for (let k = 0; k < 4; k++) { t.poser(x, 26 + k, 'cheneSombre', k === 3 ? 1 : 3); t.poser(x, 50 + k, 'cheneSombre', k === 3 ? 1 : 3); }
  // l'auvent vert et blanc au-dessus de la vitrine
  for (let y = 54; y < 62; y++) for (let x = 12; x < 58; x++) { const bande = Math.floor(x / 5) % 2; if (y >= 60 && Math.abs((x % 5) - 2.5) > (62 - y) * 1.5) continue; t.poser(x, y, bande ? 'blanc' : 'vert', y < 56 ? 4 : 3); }
  // la vitrine : le fauteuil rouge et le miroir doré dedans
  for (let y = 62; y < 90; y++) for (let x = 14; x < 56; x++) t.poser(x, y, 'cheneSombre', 1);
  for (let y = 64; y < 80; y++) for (let x = 28; x < 42; x++) { const dx = (x + 0.5 - 35) / 7, dy = (y + 0.5 - 72) / 8; if (dx * dx + dy * dy <= 1) t.poser(x, y, dx * dx + dy * dy > 0.7 ? 'laiton' : 'verre', dx * dx + dy * dy > 0.7 ? 4 : 3 - (dx < -0.3 ? -1 : 0)); }
  for (let y = 78; y < 89; y++) for (let x = 22; x < 34; x++) if (y < 82 ? x < 25 || x > 30 : true) t.poser(x, y, 'cuirRouge', y < 82 ? 3 : 4);
  for (let x = 20; x < 36; x++) t.poser(x, 84, 'laiton', 4);
  for (let y = 62; y < 90; y++) { t.poser(13, y, 'chene', 2); t.poser(56, y, 'chene', 2); t.poser(35, y, 'chene', 1); }
  for (let x = 13; x < 57; x++) { t.poser(x, 62, 'chene', 3); t.poser(x, 75, 'chene', 2); t.poser(x, 89, 'chene', 4); t.poser(x, 90, 'cheneSombre', 2); }
  for (let y = 63; y < 74; y++) t.poser(17 + Math.floor((y - 63) / 2), y, 'blanc', 5);   // (un reflet)
  // la porte, ronde en haut (les nains aiment les portes rondes)
  for (let y = 58; y < 98; y++) for (let x = 72; x < 104; x++) { const dx = (x + 0.5 - 88) / 16, dy = (y + 0.5 - 74) / 16; if (y < 74 && dx * dx + dy * dy > 1) continue; t.poser(x, y, 'chene', (x - 72) % 8 === 0 ? 1 : 3); }
  for (let x = 72; x < 104; x++) for (let y = 58; y < 98; y++) { const dx = (x + 0.5 - 88) / 16, dy = (y + 0.5 - 74) / 16; if (y < 74 && Math.abs(Math.hypot(dx, dy) - 1) < 0.08) t.poser(x, y, 'fer', 3); }
  for (const [x, y] of [[98, 80], [99, 80], [98, 81], [99, 81]]) t.poser(x, y, 'laiton', 5);
  // les ciseaux peints au-dessus de la porte
  for (let k = -5; k <= 5; k++) { t.poser(88 + k, 40 + Math.abs(k) * 0, 'fer', 4); }
  for (let k = 0; k < 8; k++) { t.poser(84 + k, 36 + k, 'fer', 5); t.poser(92 - k, 36 + k, 'fer', 5); }
  for (const [cx, cy] of [[83, 45], [93, 45]]) for (let a = 0; a < 16; a++) t.poser(Math.round(cx + Math.cos(a / 16 * 6.283) * 2.6), Math.round(cy + Math.sin(a / 16 * 6.283) * 2.6), 'rouge', 3);
  // l'assise de pierre (posée sur les pavés)
  for (let y = 98; y < H; y++) for (let x = 4; x < L - 4; x++) { const r = Math.floor((y - 98) / 5), dec = (r % 2) * 7, b = Math.floor((x + dec) / 14); const joint = (y - 98) % 5 === 4 || (x + dec) % 14 === 0; t.poser(x, y, 'pierre', joint ? 0 : 2 + Math.round(hachage(b, r, 7203) * 2)); }
  // la marche devant la porte
  for (let y = 96; y < 100; y++) for (let x = 70; x < 106; x++) t.poser(x, y, 'pierre', y === 96 ? 4 : 2);
  t.contour(); t.texture(scene, cle); return cle;
}
// Le poteau rayé (rouge, blanc, bleu) dans sa gaine de verre, sur sa potence ; deux images pour qu'il tourne
function poteauBarbierHD(scene, phase = 0) {
  const cle = 'poteauBarbierHD' + phase; if (scene.textures.exists(cle)) return cle;
  const t = toileDecor(14, 40); rampesBarbier(t);
  for (let y = 0; y < 4; y++) for (let x = 2; x < 12; x++) t.poser(x, y, 'laiton', y === 0 ? 5 : 3);
  for (let y = 36; y < 40; y++) for (let x = 2; x < 12; x++) t.poser(x, y, 'laiton', y === 39 ? 1 : 3);
  for (let y = 4; y < 36; y++) for (let x = 3; x < 11; x++) {
    const b = Math.floor((y + x * 0.9 + phase * 3) / 3) % 3; const ombre = x < 5 ? -1 : x > 8 ? -1 : 0;
    t.poser(x, y, ['rouge', 'blanc', 'bleu'][b], 3 + ombre);
  }
  for (let y = 5; y < 35; y++) t.poser(5, y, 'blanc', 5);
  t.contour(); t.texture(scene, cle); return cle;
}
// L'enseigne pendue : un peigne et des ciseaux, et le nom
function enseigneBarbierHD(scene) {
  const cle = 'enseigneBarbierHD'; if (scene.textures.exists(cle)) return cle;
  const t = toileDecor(46, 26); rampesBarbier(t);
  for (let x = 0; x < 46; x++) t.poser(x, 0, 'fer', 3);
  for (const x of [8, 37]) for (let y = 1; y < 6; y++) t.poser(x, y, 'fer', 2);
  planche(t, 2, 6, 42, 20, 'chene', { graine: 7210, noeuds: 1 });
  for (let x = 2; x < 44; x++) { t.poser(x, 6, 'cheneSombre', 2); t.poser(x, 25, 'cheneSombre', 1); }
  // le peigne d'argent
  for (let x = 8; x < 22; x++) { t.poser(x, 11, 'blanc', 4); t.poser(x, 12, 'blanc', 3); if (x % 2 === 0) for (let y = 13; y < 19; y++) t.poser(x, y, 'blanc', 3); }
  // les ciseaux
  for (let k = 0; k < 10; k++) { t.poser(26 + k, 10 + k, 'fer', 5); t.poser(36 - k, 10 + k, 'fer', 5); }
  for (const [cx, cy] of [[27, 21], [35, 21]]) for (let a = 0; a < 14; a++) t.poser(Math.round(cx + Math.cos(a / 14 * 6.283) * 2.4), Math.round(cy + Math.sin(a / 14 * 6.283) * 2.4), 'rouge', 3);
  t.contour(); t.texture(scene, cle); return cle;
}
// Le salon, vu de l'intérieur (480×230, ×2) : lambris, papier peint, grand miroir, étagères de flacons, diplôme de la Guilde
function salonBarbierHD(scene) {
  const cle = 'salonBarbierHD'; if (scene.textures.exists(cle)) return cle;
  const L = 610, H = 230, t = toileDecor(L, H); rampesBarbier(t); t.rampes.papier = rampe(0x3a5a4a); t.rampes.cuivre = rampe(0xb06a30);
  // le papier peint vert à motifs de peignes
  for (let y = 0; y < 120; y++) for (let x = 0; x < L; x++) { const b = x % 16; t.poser(x, y, 'papier', b < 6 ? 3 : b === 6 || b === 15 ? 2 : 2 + (((x >> 4) + (y >> 3)) % 4 === 0 && b === 10 && y % 8 < 3 ? 1 : 0)); }
  // la frise et le lambris de chêne
  for (let x = 0; x < L; x++) for (let k = 0; k < 4; k++) t.poser(x, 120 + k, 'chene', k === 0 ? 5 : 3);
  for (let x = 0; x < L; x += 30) planche(t, x, 124, 30, 96, 'chene', { horizontale: false, graine: 7300 + x, noeuds: 1 });
  for (let x = 0; x < L; x++) for (let k = 0; k < 10; k++) t.poser(x, 220 + k, 'cheneSombre', k < 2 ? 4 : 2);
  // le grand miroir (ovale, cadre de laiton)
  const mx = 170, my = 78, rx = 46, ry = 62;
  for (let y = my - ry - 4; y < my + ry + 4; y++) for (let x = mx - rx - 4; x < mx + rx + 4; x++) { const d = ((x + 0.5 - mx) / rx) ** 2 + ((y + 0.5 - my) / ry) ** 2; if (d <= 1) t.poser(x, y, 'verre', 3 + (x < mx - 20 && y < my ? 1 : 0)); else if (d <= 1.18) t.poser(x, y, 'laiton', d < 1.08 ? 4 : 2); }
  for (let k = 0; k < 30; k++) t.poser(mx - 30 + Math.floor(k / 3), my - 40 + k, 'blanc', 5);
  // la tablette sous le miroir : flacons, peigne, blaireau, bol à mousse
  for (let x = 110; x < 232; x++) for (let k = 0; k < 4; k++) t.poser(x, 146 + k, 'chene', k === 0 ? 5 : 2);
  const flacon = (x, h, m) => { for (let y = 146 - h; y < 146; y++) for (let dx = -3; dx <= 3; dx++) t.poser(x + dx, y, m, dx === -2 ? 5 : dx === 3 ? 1 : 3); for (let y = 146 - h - 4; y < 146 - h; y++) { t.poser(x, y, m, 2); t.poser(x + 1, y, m, 2); } t.poser(x, 146 - h - 5, 'cuivre', 4); t.poser(x + 1, 146 - h - 5, 'cuivre', 4); };
  flacon(122, 12, 'vert'); flacon(134, 16, 'bleu'); flacon(206, 14, 'rouge'); flacon(218, 10, 'laiton');
  for (let x = 150; x < 166; x++) for (let y = 138; y < 146; y++) if ((x - 158) ** 2 / 64 + (y - 146) ** 2 / 64 <= 1) t.poser(x, y, 'blanc', 3);
  for (let x = 152; x < 164; x++) t.poser(x, 137, 'mousse', 5);
  for (let y = 132; y < 146; y++) t.poser(176, y, 'chene', 3); for (let y = 126; y < 133; y++) for (let x = 173; x < 180; x++) t.poser(x, y, 'blanc', 4);
  // les étagères de droite : flacons de lotions, serviettes pliées
  for (const sy of [52, 92]) { for (let x = 300; x < 420; x++) for (let k = 0; k < 4; k++) t.poser(x, sy + k, 'chene', k === 0 ? 5 : 2);
    [['vert', 10], ['bleu', 14], ['rouge', 9], ['laiton', 12], ['vert', 16], ['bleu', 11]].forEach(([m, h], i) => { const x = 308 + i * 18; for (let y = sy - h; y < sy; y++) for (let dx = -3; dx <= 3; dx++) t.poser(x + dx, y, m, dx === -2 ? 5 : dx === 3 ? 1 : 3); }); }
  for (let i = 0; i < 4; i++) for (let y = 104 + i * 4; y < 108 + i * 4; y++) for (let x = 318; x < 352; x++) t.poser(x, y, 'blanc', y % 4 === 3 ? 2 : 4);
  // le chauffe-serviettes : une urne ronde de cuivre sur trois pieds, son couvercle à bouton, son robinet
  for (let y = 152; y < 204; y++) for (let x = 356; x < 404; x++) { const dx = (x + 0.5 - 380) / 22, dy = (y + 0.5 - 180) / 26; const d = dx * dx + dy * dy; if (d <= 1) t.poser(x, y, 'cuivre', 3 + (dx < -0.45 ? 1 : dx > 0.55 ? -1 : 0) + (d > 0.85 ? -1 : 0) + (Math.abs(dy) < 0.06 ? 1 : 0)); }
  for (let y = 146; y < 156; y++) for (let x = 368; x < 392; x++) if ((x + 0.5 - 380) ** 2 / 144 + (y + 0.5 - 156) ** 2 / 100 <= 1) t.poser(x, y, 'cuivre', 4);
  for (let y = 141; y < 146; y++) for (let x = 378; x < 382; x++) t.poser(x, y, 'laiton', 5);
  for (let x = 402; x < 412; x++) t.poser(x, 190, 'laiton', 4); for (let y = 190; y < 196; y++) t.poser(411, y, 'laiton', 3);
  for (const x of [362, 380, 398]) for (let y = 204; y < 220; y++) t.poser(x, y, 'fer', 2);
  // le diplôme encadré de la Guilde des barbiers des Monts : lignes d'écriture, l'emblème (un peigne sous un marteau), le sceau de cire
  for (let y = 14; y < 56; y++) for (let x = 244; x < 292; x++) { const cadre = x < 247 || x > 288 || y < 17 || y > 52; t.poser(x, y, cadre ? 'laiton' : 'parchemin', cadre ? (x < 247 || y < 17 ? 4 : 2) : 4 - (fbm(x * 0.2, y * 0.2, 7330) > 0.66 ? 1 : 0)); }
  for (let x = 262; x < 275; x++) t.poser(x, 21, 'encre', 2);
  for (let y = 24; y < 33; y++) { t.poser(268, y, 'chene', 2); t.poser(269, y, 'chene', 3); }
  for (let x = 263; x < 275; x++) for (let y = 23; y < 26; y++) t.poser(x, y, 'fer', y === 23 ? 4 : 2);
  for (let x = 262; x < 276; x++) { t.poser(x, 34, 'blanc', 4); if (x % 2 === 0) for (let y = 35; y < 38; y++) t.poser(x, y, 'blanc', 3); }
  for (const yl of [41, 44, 47]) for (let x = 252; x < 284; x++) if (hachage(x, yl, 7331) > 0.18) t.poser(x, yl, 'encre', 2);
  for (let y = 46; y < 54; y++) for (let x = 280; x < 288; x++) if ((x - 284) ** 2 + (y - 50) ** 2 <= 12) t.poser(x, y, 'rouge', (x - 284) ** 2 + (y - 50) ** 2 <= 4 ? 4 : 3);
  for (let y = 53; y < 60; y++) { t.poser(281 + ((y - 53) >> 2), y, 'rouge', 2); t.poser(286 - ((y - 53) >> 2), y, 'rouge', 2); }
  // le porte-rasoirs et le cuir à affûter
  for (let y = 60; y < 110; y++) for (let x = 440; x < 446; x++) t.poser(x, y, 'cuirRouge', 3);
  for (let x = 436; x < 450; x++) t.poser(x, 58, 'laiton', 4);
  for (let y = 62; y < 82; y++) { t.poser(454, y, 'fer', 4); t.poser(455, y, 'fer', 5); } for (let y = 82; y < 92; y++) { t.poser(454, y, 'cheneSombre', 3); t.poser(455, y, 'cheneSombre', 2); }
  // (v1.48) à droite, la porte de la rue : chêne, vitre en haut (le jour dehors), la clochette ; à côté, la patère et le tablier
  for (let y = 40; y < 220; y++) for (let x = 500; x < 568; x++) {
    const cadre = x < 504 || x > 563 || y < 44, vitre = x >= 512 && x <= 555 && y >= 54 && y <= 110;
    if (vitre) t.poser(x, y, 'verre', (x + y) % 23 < 3 ? 5 : 4);
    else t.poser(x, y, 'chene', cadre ? 5 : (x === 533 || x === 534) ? 2 : 3 + (y % 40 === 0 ? -1 : 0));
  }
  for (let x = 512; x <= 555; x++) t.poser(x, 82, 'chene', 4); for (let y = 54; y <= 110; y++) t.poser(533, y, 'chene', 4);
  for (let y = 150; y < 156; y++) for (let x = 554; x < 560; x++) t.poser(x, y, 'laiton', y === 150 ? 5 : 3);
  for (let y = 30; y < 40; y++) t.poser(534, y, 'laiton', 3); for (let y = 36; y < 42; y++) for (let x = 530; x < 539; x++) if ((x - 534) ** 2 / 20 + (y - 41) ** 2 / 25 <= 1) t.poser(x, y, 'laiton', x < 534 ? 5 : 3);
  for (let x = 580; x < 604; x++) t.poser(x, 70, 'chene', 4);
  for (const px of [584, 598]) { t.poser(px, 71, 'laiton', 4); t.poser(px, 72, 'laiton', 3); }
  for (let y = 73; y < 120; y++) for (let x = 590; x < 606; x++) if (Math.abs(x + 0.5 - 598) < 4 + (y - 73) * 0.08) t.poser(x, y, 'blanc', (x + y) % 5 === 0 ? 2 : 3);
  t.contour(); t.texture(scene, cle); return cle;
}
// Le carrelage noir et blanc du sol
function solBarbierHD(scene) {
  const cle = 'solBarbierHD'; if (scene.textures.exists(cle)) return cle;
  const t = toileDecor(480, 40); rampesBarbier(t);
  for (let y = 0; y < 40; y++) for (let x = 0; x < 480; x++) { const w = 12 + y * 0.5, c = (Math.floor((x - 240) / w + 100) + Math.floor(y / 8)) % 2; t.poser(x, y, c ? 'blanc' : 'ardoise', c ? 3 - (y % 8 === 7 ? 1 : 0) : 2); }
  t.texture(scene, cle); return cle;
}
// Le fauteuil de barbier (de profil, tourné vers la gauche) : cuir rouge capitonné, accoudoirs, repose-pieds et pied de laiton
function fauteuilBarbierHD(scene) {
  const cle = 'fauteuilBarbierHD'; if (scene.textures.exists(cle)) return cle;
  const L = 44, H = 60, t = toileDecor(L, H); rampesBarbier(t);
  // le dossier haut, et l'appui-tête
  for (let y = 4; y < 34; y++) for (let x = 30; x < 40; x++) t.poser(x, y, 'cuirRouge', 3 + (x === 31 ? 1 : x === 39 ? -1 : 0) - ((y - 4) % 7 === 0 ? 1 : 0));
  for (let y = 0; y < 6; y++) for (let x = 28; x < 40; x++) t.poser(x, y, 'cuirRouge', 4);
  // l'assise
  for (let y = 30; y < 38; y++) for (let x = 8; x < 38; x++) t.poser(x, y, 'cuirRouge', y === 30 ? 5 : 3 - ((x - 8) % 8 === 0 ? 1 : 0));
  // l'accoudoir de laiton
  for (let x = 10; x < 36; x++) t.poser(x, 24, 'laiton', 4); for (let y = 24; y < 30; y++) t.poser(12, y, 'laiton', 3);
  // le repose-pieds
  for (let y = 38; y < 44; y++) t.poser(6, y, 'laiton', 3); for (let x = 0; x < 10; x++) t.poser(x, 44, 'laiton', 4);
  // le pied de laiton, la manivelle
  for (let y = 38; y < 54; y++) for (let x = 20; x < 26; x++) t.poser(x, y, 'laiton', x === 21 ? 5 : 3);
  for (let y = 54; y < 60; y++) for (let x = 10; x < 36; x++) t.poser(x, y, 'laiton', y === 54 ? 5 : 2);
  for (let x = 26; x < 32; x++) t.poser(x, 46, 'fer', 3);
  t.contour(); t.texture(scene, cle); return cle;
}
// Le tabouret d'Orvin (un nain doit monter pour couper les cheveux des grands)
function tabouretBarbierHD(scene) {
  const cle = 'tabouretBarbierHD'; if (scene.textures.exists(cle)) return cle;
  const t = toileDecor(20, 16); rampesBarbier(t);
  planche(t, 0, 0, 20, 4, 'chene', { graine: 7320, noeuds: 0 });
  for (let y = 4; y < 16; y++) { t.poser(3, y, 'chene', 2); t.poser(4, y, 'chene', 3); t.poser(15, y, 'chene', 2); t.poser(16, y, 'chene', 3); }
  for (let x = 3; x < 17; x++) t.poser(x, 10, 'chene', 2);
  t.contour(); t.texture(scene, cle); return cle;
}
// Des ciseaux tenus (petite icône)
function ciseauxHD(scene, ouverts = true) {
  const cle = 'ciseauxHD' + (ouverts ? 'O' : 'F'); if (scene.textures.exists(cle)) return cle;
  const t = toileDecor(14, 12); rampesBarbier(t);
  const a = ouverts ? 0.55 : 0.12;
  for (let k = 0; k < 9; k++) { t.poser(Math.round(4 + k), Math.round(6 - k * a), 'fer', 5); t.poser(Math.round(4 + k), Math.round(6 + k * a), 'fer', 4); }
  for (const cy of [3, 9]) for (let q = 0; q < 10; q++) t.poser(Math.round(2 + Math.cos(q / 10 * 6.283) * 1.8), Math.round(cy + Math.sin(q / 10 * 6.283) * 1.8), 'rouge', 3);
  t.contour(); t.texture(scene, cle); return cle;
}

// La cape blanche du barbier, nouée au cou (posée sur le joueur assis, tourné vers la gauche)
function capeBarbierHD(scene, face = false) {
  const cle = 'capeBarbierHD' + (face ? 'F' : ''); if (scene.textures.exists(cle)) return cle;
  const L = 34, H = 24, t = toileDecor(L, H); rampesBarbier(t);
  for (let y = 0; y < H; y++) {
    const g = face ? 12 - y * 0.5 : 13 - y * 0.62, d = face ? 22 + y * 0.5 : 21 + y * 0.18;
    for (let x = Math.max(0, Math.round(g)); x < Math.min(L, Math.round(d)); x++) { const pli = (x + Math.round(y * 0.3)) % 6 === 0 ? -1 : 0; t.poser(x, y, 'blanc', (y < 3 ? 4 : 3) + pli + (x < g + 2 ? 1 : 0) - (y > H - 3 ? 1 : 0)); }
  }
  for (let x = 13; x < 21; x++) t.poser(x, 0, 'bleu', 3);   // le ruban noué au cou
  t.contour(); t.texture(scene, cle); return cle;
}
// Une mèche de cheveux coupée (couleur des cheveux du joueur)
function mecheHD(scene, couleur) {
  const cle = 'meche_' + couleur.toString(16); if (scene.textures.exists(cle)) return cle;
  const t = toileDecor(8, 4); t.rampes.ch = rampe(couleur);
  for (let x = 0; x < 8; x++) t.poser(x, x < 3 ? 2 : x < 6 ? 1 : 2, 'ch', 3 + (x % 3 === 0 ? 1 : 0));
  t.texture(scene, cle); return cle;
}
// Le rasoir droit (manche de corne, lame d'acier)
function rasoirHD(scene) {
  const cle = 'rasoirBarbierHD'; if (scene.textures.exists(cle)) return cle;
  const t = toileDecor(16, 6); rampesBarbier(t);
  for (let x = 0; x < 8; x++) { t.poser(x, 2, 'cheneSombre', 3); t.poser(x, 3, 'cheneSombre', 2); }
  for (let x = 8; x < 16; x++) { t.poser(x, 1, 'fer', 5); t.poser(x, 2, 'fer', 4); t.poser(x, 3, 'fer', 3); }
  t.poser(8, 2, 'laiton', 5);
  t.contour(); t.texture(scene, cle); return cle;
}
// Le miroir à main (cadre de laiton, manche)
function miroirMainHD(scene) {
  const cle = 'miroirMainHD'; if (scene.textures.exists(cle)) return cle;
  const t = toileDecor(14, 22); rampesBarbier(t);
  for (let y = 0; y < 14; y++) for (let x = 0; x < 14; x++) { const d = ((x + 0.5 - 7) / 7) ** 2 + ((y + 0.5 - 7) / 7) ** 2; if (d <= 1) t.poser(x, y, d > 0.7 ? 'laiton' : 'verre', d > 0.7 ? 4 : 3 + (x < 6 && y < 6 ? 2 : 0)); }
  for (let y = 14; y < 22; y++) { t.poser(6, y, 'laiton', 4); t.poser(7, y, 'laiton', 2); }
  t.contour(); t.texture(scene, cle); return cle;
}
// Un anneau de barbe (argent pour le Solstice, or pour le Long Hiver, fer noir pour la Nuit des Brumes)
function anneauBarbeHD(scene, metal) {
  const cle = 'anneauBarbe_' + metal; if (scene.textures.exists(cle)) return cle;
  const t = toileDecor(6, 8); rampesBarbier(t); t.rampes.argentA = rampe(0xc8ccd4); t.rampes.orA = rampe(0xe0b030); t.rampes.ferA = rampe(0x3a3a44);
  const m = { argent: 'argentA', or: 'orA', fer: 'ferA' }[metal];
  for (let y = 0; y < 8; y++) for (let x = 0; x < 6; x++) { const bord = x === 0 || x === 5 || y === 0 || y === 7; if (bord && !((x === 0 || x === 5) && (y === 0 || y === 7))) t.poser(x, y, m, y < 3 ? 5 : y === 7 ? 2 : 3); }
  for (let x = 1; x < 5; x++) t.poser(x, 3, m, 4);
  t.contour(); t.texture(scene, cle); return cle;
}
// La boutique close, avant tes 18 ans : volets cloués sur la vitrine, planches en croix sur la porte, l'écriteau
function boutiqueFermeeHD(scene) {
  const cle = 'boutiqueBarbierFermeeHD'; if (scene.textures.exists(cle)) return cle;
  const L = 124, H = 112, t = toileDecor(L, H); rampesBarbier(t);
  // les volets cloués sur la vitrine, et deux planches en croix sur la porte ronde
  for (let y = 61; y < 91; y++) for (let x = 12; x < 58; x++) { const b = Math.floor((x - 12) / 6); t.poser(x, y, 'chene', (x - 12) % 6 === 0 ? 1 : 2 + Math.round(hachage(b, y >> 3, 7501) * 2)); }
  for (let x = 12; x < 58; x++) for (const y of [66, 84]) { t.poser(x, y, 'cheneSombre', 3); t.poser(x, y + 1, 'cheneSombre', 2); }
  for (let k = 0; k < 34; k++) for (let e = 0; e < 3; e++) { t.poser(72 + k, 62 + Math.round(k * 0.95) + e, 'chene', 4 - e); t.poser(104 - k, 62 + Math.round(k * 0.95) + e, 'chene', 4 - e); }
  for (const [x, y] of [[14, 67], [55, 67], [14, 85], [55, 85], [74, 64], [102, 64]]) t.poser(x, y, 'fer', 5);
  // l'écriteau cloué : « Ouvrira bientôt »
  for (let y = 40; y < 52; y++) for (let x = 64; x < 112; x++) t.poser(x, y, 'parchemin', y === 40 ? 5 : x === 64 || x === 111 || y === 51 ? 2 : 4);
  t.contour(); t.texture(scene, cle); return cle;
}
// La mousse à raser : un petit nuage blanc, bombé, avec ses bulles
function mousseHD(scene) {
  const cle = 'mousseBarbierHD'; if (scene.textures.exists(cle)) return cle;
  const t = toileDecor(18, 12); rampesBarbier(t);
  t.forme('mousse', (x, y) => { for (const [cx, cy, r] of [[5, 7, 4.5], [10, 6, 5], [14, 7.5, 3.6], [8, 3.5, 3.2]]) { const dx = (x + 0.5 - cx) / r, dy = (y + 0.5 - cy) / r; if (dx * dx + dy * dy <= 1) return [dx, dy, 0.8]; } return null; });
  for (const [x, y] of [[6, 4], [11, 3], [13, 6]]) t.poser(x, y, 'blanc', 5);
  t.contour(); t.texture(scene, cle); return cle;
}
