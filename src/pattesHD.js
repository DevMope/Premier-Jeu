// (v1.56, planches 64 v5 et 74 v3 validées) Ce qu'on voit de la maison sur pattes : les pattes (debout, en marche,
// accroupie, repliée), le dessous de la maison soulevée et ses attaches, le chantier puis l'atelier des Mages-Charpentiers,
// le bois qu'elle mange (fagot, planches, bûche, charbon, bûche runique), le filet à bois et le cadran du feu.

function rampesMages(t) {
  t.rampes.rune = rampe(0x58c8f0); t.rampes.bache = rampe(0xb8a070); t.rampes.corde = rampe(0xc8a868); t.rampes.bleuNuit = rampe(0x2a3a6a);
  t.rampes.cheneClair = rampe(0xc8a070); t.rampes.blanc = rampe(0xe8e4dc); t.rampes.rouge = rampe(0xa83a2a);
}
// Un segment épais, éclairé par la gauche (un membre, une poutre)
function segmentHD(t, A, B, r, mat, { bandes = 0, mat2 = 'fer' } = {}) {
  const [ax, ay] = A, [bx, by] = B, dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1, L = Math.sqrt(l2), nx = -dy / L, ny = dx / L;
  for (let y = Math.floor(Math.min(ay, by) - r - 1); y <= Math.max(ay, by) + r + 1; y++) for (let x = Math.floor(Math.min(ax, bx) - r - 1); x <= Math.max(ax, bx) + r + 1; x++) {
    const u = Math.max(0, Math.min(1, ((x + 0.5 - ax) * dx + (y + 0.5 - ay) * dy) / l2)), px = ax + u * dx, py = ay + u * dy, d = Math.hypot(x + 0.5 - px, y + 0.5 - py);
    if (d > r) continue;
    const cote = ((x + 0.5 - px) * nx + (y + 0.5 - py) * ny) / r;   // −1 … 1 à travers le membre
    let ton = 3 + (cote < -0.35 ? 1 : cote > 0.45 ? -1 : 0) + (d > r - 0.8 ? -1 : 0);
    const bande = bandes && Math.floor(u * L) % bandes < 2 && u > 0.08 && u < 0.92;
    t.poser(x, y, bande ? mat2 : mat, Math.max(0, Math.min(5, ton + (bande ? 1 : 0))));
    if (!bande && mat === 'chene' && Math.floor(cote * 3 + 3) % 2 === 0 && hachage(Math.floor(u * L), Math.floor(cote * 4), 9) > 0.7) t.poser(x, y, mat, Math.max(0, ton - 1));
  }
}
function disqueHD(t, cx, cy, r, mat, ton = 3) { for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) { const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy); if (d <= r) t.poser(x, y, mat, Math.max(0, ton + (x + 0.5 < cx - r * 0.3 && y + 0.5 < cy ? 1 : 0) - (d > r - 0.9 ? 1 : 0))); } }
// Une patte : cuisse, genou (charnière de laiton et sa rune), tibia, cheville, trois orteils et un ergot.
// pose : 'debout', 'pas' (levée), 'accroupie' ; sorte : 'chene', 'ferree', 'runique'
// recul : la hanche reculée vers la gauche (en pixels de la toile), le pied à la même place : une patte de derrière dont
// le haut se cache sous la maison au lieu de dépasser sur le côté
function patteMaisonHD(scene, pose = 'debout', sorte = 'chene', recul = 0) {
  const cle = 'patteMaison_' + pose + '_' + sorte + (recul ? '_r' + recul : ''); if (scene.textures.exists(cle)) return cle;
  const L = 48, H = 84, t = toileDecor(L, H); rampesMages(t);
  const mat = sorte === 'runique' ? 'cheneSombre' : 'chene', band = sorte === 'chene' ? 0 : 7;
  const P = { debout: [[24, 2], [16, 36], [24, 72]], pas: [[24, 2], [36, 26], [30, 54]], accroupie: [[24, 2], [8, 22], [28, 34]], repliee: [[5, 44], [30, 18], [34, 70]] }[pose];   // (repliee : assise au sol, la hanche fixée au bas du mur, le genou relevé, le pied à plat)
  const [H0, G, C] = P; H0[0] -= recul; G[0] -= Math.round(recul * 0.45);
  segmentHD(t, H0, G, 7.5, mat, { bandes: band, mat2: 'fer' });
  segmentHD(t, G, C, 5.5, mat, { bandes: band, mat2: 'fer' });
  // le pied : trois orteils vers l'avant, un ergot derrière
  const pied = pose === 'pas' ? -0.5 : 0;
  for (const a of [-0.35, 0, 0.35]) { const ang = a + pied, B = [C[0] + Math.cos(ang) * 13 + 2, C[1] + Math.sin(ang) * 5 + 6]; segmentHD(t, C, B, 2.6, mat, {}); disqueHD(t, B[0], B[1], 2, sorte === 'chene' ? 'cheneSombre' : 'fer', 3); }
  segmentHD(t, C, [C[0] - 8, C[1] + 6], 2.2, mat, {});
  disqueHD(t, C[0], C[1], 4, sorte === 'chene' ? 'cheneSombre' : 'fer', 3);
  // le genou
  disqueHD(t, G[0], G[1], 6.5, 'laiton', 3); disqueHD(t, G[0], G[1], 3, sorte === 'chene' ? 'laiton' : 'rune', sorte === 'chene' ? 2 : 4);
  if (sorte === 'runique') for (const k of [0.25, 0.5, 0.75]) for (const [A, B] of [[H0, G], [G, C]]) { const x = A[0] + (B[0] - A[0]) * k, y = A[1] + (B[1] - A[1]) * k; t.poser(Math.round(x), Math.round(y), 'rune', 5); t.poser(Math.round(x) + 1, Math.round(y), 'rune', 4); t.poser(Math.round(x), Math.round(y) + 1, 'rune', 3); }
  // la plaque d'attache, sous le plancher
  if (pose === 'repliee') {   // (la plaque d'attache, vissée debout contre le mur, avec ses quatre boulons)
    for (let y = 32; y < 57; y++) for (let x = 0; x < 6; x++) t.poser(x, y, 'fer', x === 0 ? 4 : x === 5 ? 1 : 2);
    for (const y of [35, 53]) { t.poser(2, y, 'fer', 5); t.poser(3, y + 1, 'fer', 0); }
    disqueHD(t, H0[0], H0[1], 5.5, 'laiton', 3);
  } else for (let y = 0; y < 5; y++) for (let x = 12 - recul; x < 36 - recul; x++) t.poser(x, y, 'fer', y === 0 ? 4 : 2);
  t.contour(); t.texture(scene, cle); return cle;
}
// Le chantier : l'assise de pierre, le colombage nu, un mur de planches à moitié, l'échafaudage, la charpente, la grue
// de bois, une poutre qui flotte toute seule dans une lueur bleue (un sort de lévitation), la bâche
function chantierMagesHD(scene) {
  const cle = 'chantierMagesHD'; if (scene.textures.exists(cle)) return cle;
  const L = 156, H = 150, t = toileDecor(L, H); rampesMages(t);
  // l'assise de pierre
  for (let y = 132; y < H; y++) for (let x = 8; x < L - 8; x++) { const r = Math.floor((y - 132) / 6), dec = (r % 2) * 8, joint = (y - 132) % 6 === 5 || (x + dec) % 16 === 0; t.poser(x, y, 'pierre', joint ? 1 : 3 + (hachage(Math.floor((x + dec) / 16), r, 64) > 0.6 ? -1 : 0)); }
  // le colombage : poteaux et sablières en chêne clair (tout neuf)
  for (const x of [14, 52, 92, 134]) segmentHD(t, [x, 132], [x, 58], 2.6, 'cheneClair');
  for (const y of [58, 96]) segmentHD(t, [12, y], [138, y], 2.4, 'cheneClair');
  segmentHD(t, [14, 96], [52, 132], 1.8, 'cheneClair'); segmentHD(t, [92, 96], [134, 132], 1.8, 'cheneClair');
  // un mur de planches, à moitié monté (à gauche, en bas)
  for (let x = 17; x < 50; x++) for (let y = 104; y < 131; y++) t.poser(x, y, 'chene', (x - 17) % 6 === 0 ? 1 : 3 + (hachage(Math.floor((x - 17) / 6), y >> 3, 5) > 0.7 ? -1 : 0));
  for (let x = 55; x < 90; x++) for (let y = 116; y < 131; y++) t.poser(x, y, 'chene', (x - 55) % 6 === 0 ? 1 : 3);
  // la charpente du toit : les chevrons nus
  for (let k = 0; k <= 6; k++) { const x = 12 + k * 21; segmentHD(t, [x, 58], [x + (75 - x) * 0.55, 26 + Math.abs(k - 3) * 2], 1.6, 'cheneClair'); }
  segmentHD(t, [12, 58], [75, 20], 2.2, 'cheneClair'); segmentHD(t, [138, 58], [75, 20], 2.2, 'cheneClair');
  segmentHD(t, [30, 40], [120, 40], 1.6, 'cheneClair');
  // la bâche sur la moitié droite du toit
  for (let y = 22; y < 60; y++) for (let x = 76; x < 140; x++) { if ((x - 75) > (y - 20) * 1.66 + 2) continue; t.poser(x, y, 'bache', 3 + (Math.floor((x + y) / 7) % 2 ? -1 : 0) + (y > 54 ? -1 : 0)); }
  // l'échafaudage, devant à droite, avec ses planches et une échelle
  for (const x of [100, 128, 150]) segmentHD(t, [Math.min(x, L - 3), 140], [Math.min(x, L - 3), 50], 1.4, 'cheneClair');
  for (const y of [70, 104]) { for (let x = 98; x < L - 2; x++) for (let k = 0; k < 3; k++) t.poser(x, y + k, 'chene', k === 0 ? 4 : 2); }
  for (const y of [86, 120]) segmentHD(t, [100, y], [128, y + 10], 1, 'cheneClair');
  segmentHD(t, [112, 140], [104, 72], 1, 'cheneClair'); segmentHD(t, [120, 140], [112, 72], 1, 'cheneClair');
  for (let k = 0; k < 8; k++) { const y = 136 - k * 8.5; segmentHD(t, [112 - k, y], [120 - k, y], 0.7, 'cheneClair'); }
  // pas de grue : une poutre monte toute seule vers le faîte, dans sa lueur bleue (un sort de lévitation)
  segmentHD(t, [60, 14], [92, 6], 2, 'cheneClair');
  for (const [x, y] of [[58, 10], [66, 4], [76, 13], [88, 1], [95, 10], [70, 16]]) { t.poser(x, y, 'rune', 5); t.poser(x + 1, y, 'rune', 3); t.poser(x, y + 1, 'rune', 3); }
  // la planche qui flotte, toute seule, dans sa lueur bleue
  for (let x = 20; x < 46; x++) for (let k = 0; k < 4; k++) t.poser(x, 74 + k + Math.round((x - 20) * 0.12), 'chene', k === 0 ? 4 : 2);
  for (const [x, y] of [[18, 70], [24, 82], [33, 69], [44, 84], [48, 72], [29, 86], [40, 66]]) { t.poser(x, y, 'rune', 5); t.poser(x + 1, y, 'rune', 3); t.poser(x, y + 1, 'rune', 3); }
  // les tas de planches et un tonneau de clous au pied
  for (let k = 0; k < 4; k++) for (let x = 60 - k * 2; x < 92 + k; x++) for (let y = 0; y < 2; y++) t.poser(x, 140 + k * 2 + y - 12, 'chene', y === 0 ? 4 : 2);
  t.contour(); t.texture(scene, cle); return cle;
}
// L'atelier fini : grand pignon, colombages sombres, les deux grandes portes de grange ouvertes (dedans, une patte
// géante sur ses tréteaux), une cheminée qui fume bleu, des runes gravées sur les poutres
function atelierMagesHD(scene) {
  const cle = 'atelierMagesHD'; if (scene.textures.exists(cle)) return cle;
  const L = 156, H = 150, t = toileDecor(L, H); rampesMages(t);
  for (let y = 132; y < H; y++) for (let x = 8; x < L - 8; x++) { const r = Math.floor((y - 132) / 6), dec = (r % 2) * 8, joint = (y - 132) % 6 === 5 || (x + dec) % 16 === 0; t.poser(x, y, 'pierre', joint ? 1 : 3); }
  // le toit d'ardoises bleu nuit, en pignon
  for (let y = 10; y < 62; y++) for (let x = 4; x < L - 4; x++) { if (Math.abs(x - 78) > (y - 8) * 1.42 + 4) continue; const r = Math.floor((y - 10) / 5), dec = (r % 2) * 5, b = (x + dec) % 10 === 0 || (y - 10) % 5 === 4; t.poser(x, y, 'bleuNuit', b ? 1 : 3 + (hachage(Math.floor((x + dec) / 10), r, 81) > 0.7 ? 1 : 0)); }
  // la cheminée de pierre
  for (let y = 4; y < 30; y++) for (let x = 112; x < 124; x++) t.poser(x, y, 'pierre', (y % 5 === 4 || (x + (Math.floor(y / 5) % 2) * 3) % 6 === 0) ? 1 : 3);
  // les murs : enduit clair et colombages sombres
  for (let y = 60; y < 132; y++) for (let x = 12; x < L - 12; x++) t.poser(x, y, 'platre', 3 + (fbm(x * 0.15, y * 0.15, 6401) > 0.62 ? -1 : 0));
  for (const x of [12, 40, 116, 140]) segmentHD(t, [x + 2, 132], [x + 2, 60], 2.2, 'cheneSombre');
  for (const y of [60, 94]) segmentHD(t, [12, y], [L - 12, y], 2.2, 'cheneSombre');
  segmentHD(t, [14, 94], [40, 62], 1.6, 'cheneSombre'); segmentHD(t, [142, 94], [116, 62], 1.6, 'cheneSombre');
  // les runes gravées sur les poutres
  for (let k = 0; k < 9; k++) { const x = 20 + k * 14; if (x > 38 && x < 116) continue; t.poser(x, 60, 'rune', 5); t.poser(x + 1, 61, 'rune', 4); }
  // les grandes portes de grange ouvertes, et la patte géante dedans
  for (let y = 70; y < 132; y++) for (let x = 46; x < 110; x++) t.poser(x, y, 'cheneSombre', 0 + (y < 74 ? 1 : 0));
  for (const [x0, x1] of [[34, 46], [110, 122]]) for (let y = 70; y < 132; y++) for (let x = x0; x < x1; x++) t.poser(x, y, 'chene', (x - x0) % 4 === 0 ? 1 : 3);
  segmentHD(t, [56, 126], [62, 126], 1, 'cheneClair'); segmentHD(t, [94, 126], [100, 126], 1, 'cheneClair');
  segmentHD(t, [56, 126], [58, 112], 1, 'cheneClair'); segmentHD(t, [98, 126], [96, 112], 1, 'cheneClair');
  segmentHD(t, [60, 110], [78, 98], 4.5, 'cheneClair', { bandes: 6, mat2: 'fer' }); segmentHD(t, [78, 98], [96, 110], 3.5, 'cheneClair', { bandes: 6, mat2: 'fer' });
  disqueHD(t, 78, 98, 4.5, 'laiton', 3); disqueHD(t, 78, 98, 2, 'rune', 5);
  // la lueur de la forge au fond, et un établi
  for (let x = 50; x < 66; x++) for (let y = 116; y < 122; y++) t.poser(x, y, 'chene', y === 116 ? 4 : 2);
  // l'enseigne, sous le pignon : un rabot et une baguette croisés
  for (let y = 36; y < 54; y++) for (let x = 62; x < 94; x++) t.poser(x, y, 'chene', y === 36 || y === 53 ? 1 : 3);
  segmentHD(t, [66, 50], [90, 40], 1.2, 'cheneSombre'); disqueHD(t, 90, 40, 1.6, 'rune', 5);
  for (let x = 68; x < 86; x++) for (let y = 42; y < 47; y++) t.poser(x, y, x < 72 ? 'chene' : 'cheneSombre', 3); for (let x = 74; x < 80; x++) t.poser(x, 41, 'fer', 4);
  // les fenêtres à petits carreaux, éclairées
  for (const x0 of [18, 122]) { for (let y = 100; y < 120; y++) for (let x = x0; x < x0 + 16; x++) t.poser(x, y, (x - x0) % 8 === 0 || (y - 100) % 10 === 0 ? 'cheneSombre' : 'laiton', (x - x0) % 8 === 0 || (y - 100) % 10 === 0 ? 1 : 4); }
  t.contour(); t.texture(scene, cle); return cle;
}

var fig = (s, q, x, vue = 'troisQuarts', flip = false, pose = null) => { const k = corpsHD(s, q, pose, vue); return s.add.image(x, SOL_PROMENADE, k).setOrigin(0.5, 1).setScale(7.2 * echelleCorps(k)).setFlipX(flip).setDepth(9); };
var NAIN = { race: 'nain', nom: 'Le charpentier', costume: 'forgeron', niveau: 'novice' }, MAGE = { race: 'magicienne', nom: 'La maîtresse-charpentière', feminin: true, niveau: 'aguerri' };
// (planche 64 v2, demande du joueur) Le dessous de la maison soulevée : la motte de terre arrachée avec elle (les
// vieilles pierres de l'assise, les couches de terre, des cailloux), la mousse et l'herbe qui pendent au bord, les
// racines qui tombent en vrille, et des choses mal accrochées : un seau au bout de sa corde, une lanterne à un crochet,
// une planche qui ne tient plus que par un clou, un nid d'oiseau. L = 176 (la largeur de la façade, à l'échelle 2).
function dessousMaisonHD(scene, graine = 3) {
  const cle = 'dessousMaison_' + graine; if (scene.textures.exists(cle)) return cle;
  const L = 176, H = 74, t = toileDecor(L, H); rampesMages(t);
  t.rampes.terre = rampe(0x6e4c30); t.rampes.mousse = rampe(0x5e8a38); t.rampes.racine = rampe(0x5a3e26); t.rampes.argile = rampe(0x8a6a48); t.rampes.flamme = rampe(0xf0a030);
  // le profil du bas de la motte : bombé au milieu, déchiré sur les bords
  const bas = x => Math.round(12 + 18 * Math.pow(Math.sin(Math.PI * (x + 4) / (L + 8)), 0.8) + (fbm(x * 0.09, 1, graine) - 0.5) * 9);
  for (let x = 0; x < L; x++) for (let y = 0; y <= bas(x); y++) {
    if (y < 6) { const bloc = Math.floor((x + (y < 3 ? 0 : 5)) / 10), joint = (x + (y < 3 ? 0 : 5)) % 10 === 0 || y === 2; t.poser(x, y, 'pierre', joint ? 1 : 2 + Math.round(hachage(bloc, y < 3 ? 1 : 2, graine) * 1.6)); continue; }
    const strate = Math.floor((y + fbm(x * 0.05, 2, graine) * 6) / 6) % 2, n = fbm(x * 0.2, y * 0.2, graine + 4);
    t.poser(x, y, strate ? 'terre' : 'argile', Math.max(0, Math.min(5, 2 + Math.round((n - 0.5) * 3) - (y > bas(x) - 2 ? 1 : 0))));
  }
  // des cailloux pris dans la terre
  for (let k = 0; k < 16; k++) { const x = 6 + hachage(k, 5, graine) * (L - 12), y = 9 + hachage(k, 6, graine) * 20; if (y < bas(Math.floor(x)) - 3) disqueHD(t, x, y, 1.4 + hachage(k, 7, graine) * 1.6, 'pierre', 3); }
  // les racines : de longues vrilles qui pendent, quelques radicelles
  const racine = (x0, y0, long, ep, g) => { let x = x0, y = y0, a = Math.PI / 2;
    for (let i = 0; i < long; i++) { a += (hachage(i, g, 11) - 0.5) * 0.5; a = Math.max(Math.PI * 0.3, Math.min(Math.PI * 0.7, a)); x += Math.cos(a); y += Math.sin(a);
      const e = ep * (1 - i / long) + 0.5; for (let d = 0; d < e; d++) t.poser(Math.round(x + d), Math.round(y), 'racine', d === 0 ? 3 : 2);
      if (i > 3 && hachage(i, g, 12) > 0.86) { let rx = x, ry = y; const s = hachage(i, g, 13) > 0.5 ? 1 : -1; for (let j = 0; j < 5; j++) { rx += s * 0.8; ry += 0.7; t.poser(Math.round(rx), Math.round(ry), 'racine', 2); } } }
    return [x, y]; };
  [[14, 18, 1.6], [27, 22, 2.2], [40, 30, 1.4], [52, 16, 2], [70, 38, 2.4], [84, 22, 1.4], [97, 42, 2.6], [112, 26, 1.8], [126, 34, 2.2], [138, 18, 1.4], [150, 28, 2], [162, 14, 1.4]].forEach(([x, l, e], k) => {
    const [fx, fy] = racine(x, bas(x) - 1, l, e, k + 1);
    if ([2, 5, 8, 10].includes(k)) { disqueHD(t, fx, fy + 1, 2.6, 'terre', 2); disqueHD(t, fx - 1, fy, 1.4, 'argile', 3); t.poser(Math.round(fx) + 1, Math.round(fy) + 3, 'mousse', 3); } });   // (une motte de terre qui ne tient plus qu'à sa racine)
  // une grosse motte qui pend, à moitié décrochée, sous le milieu
  for (let y = 0; y < 7; y++) for (let x = -5 + Math.floor(y / 2); x <= 5 - Math.floor(y / 2); x++) t.poser(66 + x, bas(66) + y, y < 2 ? 'argile' : 'terre', 2 + (x < -1 ? 1 : 0) - (y > 4 ? 1 : 0));
  // la mousse et l'herbe qui débordent et pendent en mèches
  for (let x = 0; x < L; x++) { const b = bas(x), m = hachage(x, 21, graine);
    if (m > 0.35) for (let d = 0; d < 2; d++) t.poser(x, b - d, 'mousse', 2 + d);
    if (m > 0.78) { const l = 2 + Math.floor(hachage(x, 22, graine) * 6); for (let i = 1; i <= l; i++) t.poser(x + (i > 3 && m > 0.9 ? 1 : 0), b + i, 'mousse', i === l ? 1 : 3); } }
  // le seau au bout de sa corde, la lanterne au crochet
  const corde = (x, y0, y1) => { for (let y = y0; y <= y1; y++) t.poser(x + (y % 5 === 0 ? 1 : 0), y, 'corde', 3); };
  corde(52, bas(52), 52); for (let y = 53; y < 61; y++) for (let x = 47 - Math.floor((y - 53) / 4); x <= 58 + Math.floor((y - 53) / 4); x++) t.poser(x, y, (y === 55 || y === 59) ? 'fer' : 'chene', x === 47 - Math.floor((y - 53) / 4) ? 4 : 2);
  for (let x = 48; x <= 57; x++) t.poser(x, 52, 'fer', 3);
  corde(124, bas(124), 45); for (const [x, y] of [[123, 46], [125, 46], [122, 47], [126, 47]]) t.poser(x, y, 'fer', 2);
  for (let x = 121; x <= 127; x++) t.poser(x, 48, 'laiton', 4); for (let x = 119; x <= 129; x++) t.poser(x, 49, 'laiton', 3);   // (le chapeau de la lanterne)
  for (let y = 50; y < 59; y++) for (let x = 120; x <= 128; x++) { const cadre = x === 120 || x === 128 || x === 124 || y === 58; t.poser(x, y, cadre ? 'laiton' : 'flamme', cadre ? 2 : (Math.abs(x - 124) < 3 && y > 52 && y < 57 ? 5 : 3)); }
  // la planche qui ne tient plus que par un clou
  for (let i = 0; i < 26; i++) for (let w = 0; w < 4; w++) t.poser(Math.round(104 - i * 0.55 + w * 0.8), Math.round(bas(104) - 2 + i * 0.85 - w * 0.5), 'chene', w === 0 ? 4 : w === 3 ? 1 : 3);
  t.poser(104, bas(104) - 1, 'fer', 4);
  // un nid d'oiseau coincé entre deux racines, deux œufs
  for (let x = 78; x < 90; x++) for (let y = bas(84) + 1; y < bas(84) + 6; y++) if (hachage(x, y, 31) > 0.25 && Math.abs(x - 84) < 7 - (y - bas(84)) * 0.6) t.poser(x, y, 'racine', 1 + Math.floor(hachage(x, y, 32) * 3));
  t.poser(82, bas(84) + 1, 'blanc', 4); t.poser(85, bas(84) + 1, 'blanc', 3);
  t.contour(); t.texture(scene, cle); return cle;
}
// Les attaches : la grosse poutre de chêne sous le plancher, et à chaque patte une hanche de laiton (la même charnière
// que le genou, en plus grand), un collier de fer à quatre boulons et deux jambes de force en biais
function attachesMaisonHD(scene, sorte = 'chene') {
  const cle = 'attachesMaison_' + sorte; if (scene.textures.exists(cle)) return cle;
  const L = 176, H = 30, t = toileDecor(L, H); rampesMages(t);
  for (let y = 0; y < 6; y++) for (let x = 8; x < L - 8; x++) t.poser(x, y, 'cheneSombre', y === 0 ? 4 : y === 5 ? 1 : 2 + (hachage(Math.floor(x / 3), y, 4) > 0.8 ? 1 : 0));
  for (let x = 14; x < L - 8; x += 22) { t.poser(x, 2, 'fer', 4); t.poser(x, 3, 'fer', 2); }
  for (const px of [33, 143]) {
    segmentHD(t, [px - 18, 4], [px - 4, 15], 2.6, 'chene', {}); segmentHD(t, [px + 18, 4], [px + 4, 15], 2.6, 'chene', {});
    for (let y = 4; y < 19; y++) for (let x = px - 8; x <= px + 8; x++) t.poser(x, y, 'fer', x === px - 8 ? 4 : x === px + 8 ? 1 : (y === 4 || y === 18) ? 3 : 2);
    for (const [bx, by] of [[px - 6, 6], [px + 6, 6], [px - 6, 16], [px + 6, 16]]) { t.poser(bx, by, 'laiton', 5); t.poser(bx + 1, by + 1, 'laiton', 2); }
    disqueHD(t, px, 13, 6, 'laiton', 3); disqueHD(t, px, 13, 2.6, sorte === 'chene' ? 'laiton' : 'rune', sorte === 'chene' ? 2 : 4);
  }
  t.contour(); t.texture(scene, cle); return cle;
}

function rampesBois(t) {
  t.rampes.ecorce = rampe(0x5a3a22); t.rampes.coeurBois = rampe(0xd0a060); t.rampes.jute = rampe(0xb89868);
  t.rampes.charbon = [0x08080a, 0x141418, 0x22222a, 0x34343e, 0x4a4a58, 0x6a6a7a];
  t.rampes.ecorceRune = rampe(0x4a5468); t.rampes.rune = [0x1a4a8a, 0x2a6ac0, 0x40a0f0, 0x70d0ff, 0xb0f0ff, 0xf0ffff];
  t.rampes.corde = rampe(0xb89a60); t.rampes.vert = rampe(0x5a8a3a);
}
// une bûche couchée : l'écorce, et au bout les cernes du bois
function bucheSur(t, x0, y0, l, r, ecorce = 'ecorce', coeur = 'coeurBois', graine = 1) {
  for (let x = x0; x < x0 + l; x++) for (let y = Math.round(y0 - r); y <= y0 + r; y++) {
    const v = (y - y0) / r; if (Math.abs(v) > 1) continue;
    const ton = Math.round(3.4 - v * 1.6 + (hachage(x, Math.round(y / 2), graine) > 0.8 ? -1 : 0) + ((x + graine) % 6 === 0 ? -1 : 0));
    t.poser(x, y, ecorce, Math.max(0, Math.min(5, ton)));
  }
  const cx = x0 + l - 1;
  for (let y = Math.round(y0 - r); y <= y0 + r; y++) for (let x = cx - Math.round(r * 0.55); x <= cx + Math.round(r * 0.45); x++) {
    const d = Math.hypot((x - cx) / (r * 0.5), (y - y0) / r); if (d > 1) continue;
    t.poser(x, y, d > 0.82 ? ecorce : coeur, d > 0.82 ? 1 : d < 0.18 ? 2 : Math.floor(d * 5) % 2 ? 3 : 4 + (x < cx ? 1 : 0) - 1);
  }
}
function fagotHD(scene) {
  const cle = 'fagot74'; if (scene.textures.exists(cle)) return cle;
  const t = toileDecor(46, 22); rampesBois(t);
  // une dizaine de branches fines, un peu de travers, qui dépassent inégalement
  for (let k = 0; k < 10; k++) { const y0 = 5 + k * 1.3 + hachage(k, 3, 7) * 1.5, x0 = 1 + Math.round(hachage(k, 1, 7) * 5), x1 = 40 + Math.round(hachage(k, 2, 7) * 5);
    for (let x = x0; x <= x1; x++) { const y = Math.round(y0 + (x - x0) * (k % 2 ? 0.05 : -0.04)); t.poser(x, y, 'ecorce', k % 3 === 0 ? 4 : 3); t.poser(x, y + 1, 'ecorce', 1); } }
  // des brindilles qui partent en biais aux deux bouts, avec deux feuilles sèches
  for (const [x, y, dx] of [[4, 6, -1], [6, 15, -1], [41, 5, 1], [43, 16, 1]]) for (let k = 0; k < 4; k++) t.poser(x + dx * k, y - k, 'ecorce', 3);
  for (const [x, y] of [[1, 3], [45, 2]]) { t.poser(x, y, 'vert', 3); t.poser(x, y - 1, 'vert', 4); }
  // les deux liens de corde
  for (const cx of [13, 31]) for (let y = 3; y < 21; y++) { t.poser(cx, y, 'corde', 4 - (y % 3 === 0 ? 1 : 0)); t.poser(cx + 1, y, 'corde', 2); }
  t.contour(); t.texture(scene, cle); return cle;
}
function bucheCheneHD(scene) {
  const cle = 'bucheChene74'; if (scene.textures.exists(cle)) return cle;
  const t = toileDecor(40, 20); rampesBois(t);
  bucheSur(t, 2, 10, 36, 7.5, 'ecorce', 'coeurBois', 3);
  t.poser(14, 4, 'vert', 3); t.poser(15, 3, 'vert', 4); t.poser(16, 3, 'vert', 2);   // (un brin de mousse)
  t.contour(); t.texture(scene, cle); return cle;
}
function planchesRecupHD(scene) {
  const cle = 'planchesRecup74'; if (scene.textures.exists(cle)) return cle;
  const t = toileDecor(44, 22); rampesBois(t);
  planche(t, 2, 14, 38, 5, 'chene', { graine: 741 });
  planche(t, 5, 8, 36, 5, 'chene', { graine: 742, noeuds: 2 });
  planche(t, 1, 2, 30, 5, 'chene', { graine: 743 });
  for (let k = 0; k < 4; k++) { t.poser(31 + k, 2 + (k % 2), 'chene', 1); }   // (le bout cassé)
  for (const [x, y] of [[8, 10], [36, 16], [24, 4]]) { t.poser(x, y, 'fer', 4); t.poser(x, y - 1, 'fer', 2); }   // (les vieux clous)
  for (const [x, y] of [[16, 9], [17, 9], [18, 10], [19, 10], [20, 9], [21, 9]]) t.poser(x, y, 'encre', 1);   // (la marque de la caisse)
  t.contour(); t.texture(scene, cle); return cle;
}
function sacCharbonHD(scene) {
  const cle = 'sacCharbon74'; if (scene.textures.exists(cle)) return cle;
  const t = toileDecor(32, 32); rampesBois(t);
  t.forme('jute', ellipsoide(16, 20, 12, 11), { motif: (x, y) => ((x + y) % 3 === 0 ? -0.4 : 0) });
  for (let x = 6; x <= 26; x++) for (let y = 8; y <= 11; y++) t.poser(x, y, 'jute', y === 8 ? 4 : 2);   // (le rebord roulé)
  for (let k = 0; k < 16; k++) { const x = 8 + Math.round(hachage(k, 1, 9) * 16), y = 5 + Math.round(hachage(k, 2, 9) * 4);
    t.forme('charbon', ellipsoide(x, y, 2.2, 1.8), { decalage: 0.2 }); }
  // le marteau des nains, tamponné sur la toile
  for (let y = 18; y < 28; y++) t.poser(16, y, 'encre', 1);
  for (let x = 12; x < 21; x++) for (let y = 17; y < 20; y++) t.poser(x, y, 'encre', 1);
  t.contour(); t.texture(scene, cle); return cle;
}
function bucheRuniqueHD(scene) {
  const cle = 'bucheRunique74'; if (scene.textures.exists(cle)) return cle;
  const t = toileDecor(40, 20); rampesBois(t);
  bucheSur(t, 2, 10, 36, 7.5, 'ecorceRune', 'rune', 5);
  // trois runes gravées qui luisent
  for (const [x0, motif] of [[7, [[0, 0], [0, 1], [0, 2], [0, 3], [1, 1], [2, 0]]], [16, [[0, 0], [1, 1], [2, 2], [2, 0], [0, 2], [1, 3]]], [25, [[1, 0], [1, 1], [1, 2], [1, 3], [0, 1], [2, 2]]]])
    for (const [dx, dy] of motif) t.poser(x0 + dx, 8 + dy, 'rune', 4);
  t.contour(); t.texture(scene, cle); return cle;
}
// le filet à bois sous la maison : n bûches sur 12 places
function filetBoisHD(scene, n = 12) {
  const cle = 'filetBois74_' + n; if (scene.textures.exists(cle)) return cle;
  const L = 76, H = 44, t = toileDecor(L, H); rampesBois(t);
  const creux = x => 34 + Math.round(Math.sin(Math.PI * x / L) * 7);
  // les bûches, de bas en haut (rangées de 4, 4, 3, 1)
  const places = [[6, 36], [22, 38], [38, 38], [54, 36], [9, 29], [25, 30], [41, 30], [55, 29], [15, 22], [31, 22], [46, 22], [30, 15]];
  places.slice(0, n).forEach(([x, y], i) => bucheSur(t, x, y, 16, 3.6, 'ecorce', 'coeurBois', i + 3));
  // le filet : de grandes mailles de corde en losanges, par-dessus
  for (let x = 2; x < L - 2; x++) for (let y = 6; y <= creux(x); y++) {
    const a = (x + y) % 10 === 0, b = (x - y + 100) % 10 === 0;
    if (a || b) t.poser(x, y, 'corde', a ? 4 : 3);
  }
  for (let x = 2; x < L - 2; x++) { t.poser(x, creux(x), 'corde', 2); t.poser(x, 6, 'corde', 3); }
  // les deux crochets, et les cordes qui montent vers le dessous de la maison
  for (const x of [6, L - 7]) for (let y = 0; y < 7; y++) t.poser(x, y, 'fer', y === 0 ? 4 : 2);
  t.contour(); t.texture(scene, cle); return cle;
}
// la jauge du feu : un cadran de laiton au-dessus de l'âtre (vert, jaune, rouge), l'aiguille sur « niveau » (0 à 1)
function jaugeFeuHD(scene, niveau = 0.8) {
  const cle = 'jaugeFeu74_' + Math.round(niveau * 10); if (scene.textures.exists(cle)) return cle;
  const t = toileDecor(36, 26); rampesBois(t);
  t.rampes.rouge = rampe(0xc03a2a); t.rampes.jaune = rampe(0xe0b030);
  const cx = 18, cy = 22;
  for (let y = 0; y < 26; y++) for (let x = 0; x < 36; x++) {
    const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy); if (y > cy + 2 || d > 17) continue;
    if (d > 15) { t.poser(x, y, 'laiton', x < cx ? 4 : 2); continue; }
    if (d > 11 && y < cy) { const a = Math.atan2(cy - y - 0.5, x + 0.5 - cx) / Math.PI;   // 1 à gauche (vide), 0 à droite (plein)
      t.poser(x, y, a > 0.7 ? 'rouge' : a > 0.4 ? 'jaune' : 'vert', 3); continue; }
    t.poser(x, y, 'toile', 4);
  }
  const a = Math.PI * (1 - niveau);
  trait(t, 'encre', cx, cy, cx + Math.cos(a) * 12, cy - Math.sin(a) * 12, 0.6);
  t.forme('laiton', ellipsoide(cx, cy, 2, 2), { decalage: 0.4 });
  t.contour(); t.texture(scene, cle); return cle;
}

// Les pattes repliées, attachées au coin des murs d'une façade (celle que rend dessinerFacade) : la plaque de fer
// boulonnée sur le mur, la hanche de laiton, le genou relevé, le pied à plat. On mesure le mur sur l'image elle-même
// (une ligne près du bas), pour que ça tienne sur toutes les façades.
function bordsDuMur(scene, image) {
  const tex = image.texture.key, src = scene.textures.get(tex).getSourceImage(), w = src.width, y = src.height - 14;
  let g = null, d = null;
  for (let x = 0; x < w; x++) { const p = scene.textures.getPixel(x, y, tex); if (p && p.alpha > 200) { if (g === null) g = x; d = x; } }
  if (g === null) { g = 0; d = w - 1; }
  const gauche = image.x - image.displayWidth * image.originX, k = image.scaleX;
  return [gauche + g * k, gauche + (d + 1) * k];
}
function pattesRepliees(scene, facade, { sorte = 'chene', sol = facade.porteY, prof = null, conteneur = null } = {}) {
  const [g, d] = bordsDuMur(scene, facade.image), cle = patteMaisonHD(scene, 'repliee', sorte), z = prof !== null ? prof : facade.image.depth + 0.005;
  const pattes = [[g + 4, true], [d - 4, false]].map(([x, fl]) => {
    const p = scene.add.image(x, sol + 4, cle).setOrigin(fl ? 1 : 0, 1).setScale(1.75).setFlipX(fl).setDepth(z);
    if (conteneur) conteneur.add(p);
    return p;
  });
  if (facade.enseigne && facade.enseigne.depth <= z) facade.enseigne.setDepth(z + 0.001);   // (l'enseigne pend devant la patte)
  return pattes;
}
