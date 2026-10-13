// Les dernières icônes en HD (16 × 16, comme les marchandises) : décorations du comptoir,
// catégories de trésors, pièces de l'armure (claire et sombre), cœurs, trèfle, caisse.
// Elles portent le préfixe « hd_ » : iconeObjet(scene, id) les trouve toute seule.

const DESSINS_ICONES = {
  // --- Les décorations du comptoir ---
  carte(t) { // une carte au trésor roulée à moitié
    t.forme('parchemin', (x, y) => (x >= 2 && x <= 13 && y >= 3 && y <= 13 ? [0, 0, 1] : null), { motif: (x, y) => (fbm(x * 0.4, y * 0.4, 1201) > 0.6 ? -0.8 : 0) });
    t.forme('parchemin', ellipsoide(14, 8, 2, 5.5), { decalage: 0.3 });
    for (const [x, y] of [[4, 6], [5, 7], [6, 7], [7, 8], [8, 9], [9, 9]]) t.poser(x, y, 'tissuRouge', 2);
    t.poser(10, 10, 'tissuRouge', 4); t.poser(11, 11, 'tissuRouge', 4); t.poser(11, 10, 'tissuRouge', 4); t.poser(10, 11, 'tissuRouge', 4);
  },
  blason(t) { // un écu aux armes du bourg : deux champs, une tour d'or
    t.forme('tissuRouge', (x, y) => (y >= 1 && y <= 14 && Math.abs(x + 0.5 - 8) < 6 - Math.max(0, y - 8) * 0.9 ? [(x + 0.5 - 8) / 7, (y - 7) / 10, 0.8] : null));
    t.forme('encre', (x, y) => (y >= 1 && y <= 14 && x + 0.5 < 8 && Math.abs(x + 0.5 - 8) < 6 - Math.max(0, y - 8) * 0.9 ? [(x + 0.5 - 8) / 7, (y - 7) / 10, 0.8] : null));
    for (let y = 4; y <= 10; y++) for (let x = 6; x <= 9; x++) t.poser(x, y, 'or', y === 4 && x % 2 ? 5 : 4);
    for (let y = 1; y <= 14; y++) { const d = Math.round(6 - Math.max(0, y - 8) * 0.9); t.poser(8 - d, y, 'or', 3); t.poser(7 + d, y, 'or', 3); }
    for (let x = 2; x <= 13; x++) t.poser(x, 1, 'or', 4);
  },
  sceau(t) { // un sceau de cire d'or sur un ruban bleu, frappé d'une étoile
    for (let y = 8; y <= 15; y++) { t.poser(5 + (y > 11 ? y - 11 : 0), y, 'encre', 3); t.poser(6 + (y > 11 ? y - 11 : 0), y, 'encre', 4); t.poser(10 - (y > 11 ? y - 11 : 0), y, 'encre', 3); t.poser(9 - (y > 11 ? y - 11 : 0), y, 'encre', 4); }
    t.forme('or', ellipsoide(8, 7, 5.5, 5.5), { decalage: 0.2, motif: (x, y) => (Math.hypot(x + 0.5 - 8, y + 0.5 - 7) > 4.6 ? -0.9 : 0) });
    for (const [dx, dy] of [[0, -2], [-2, 1], [2, 1], [-1, 2], [1, 2], [0, 0], [0, -1], [-1, 0], [1, 0], [0, 1]]) t.poser(8 + dx, 7 + dy, 'or', 5);
  },
  // --- La brocante de Firmin ---
  tropheeCerf(t) { // une tête de cerf sur son écusson de bois
    t.rampes.cerf = rampe(0x8a6a3a);
    t.forme('chene', (x, y) => (y >= 2 && y <= 14 && Math.abs(x + 0.5 - 8) < 5.5 - Math.max(0, y - 10) * 0.8 ? [(x + 0.5 - 8) / 6, 0, 0.8] : null), { decalage: -0.4 });
    t.forme('cerf', ellipsoide(8, 9, 2.6, 3.6));
    t.forme('cerf', ellipsoide(8, 12.5, 1.8, 1.6), { decalage: 0.4 });
    for (const s of [-1, 1]) { for (let k = 0; k < 5; k++) t.poser(8 + s * (2 + k), 6 - k, 'parchemin', 4); t.poser(8 + s * 4, 1, 'parchemin', 5); t.poser(8 + s * 6, 3, 'parchemin', 5); t.poser(8 + s * 3, 3, 'parchemin', 4); }
    t.poser(7, 8, 'encre', 0); t.poser(9, 8, 'encre', 0); t.poser(8, 13, 'encre', 0);
  },
  tapisserie(t) { // une tenture aux trois terres : lumière, milieu, ombre, sur sa tringle
    t.rampes.lumiere = rampe(0xe8d060); t.rampes.ombre = rampe(0x4a2a5a); t.rampes.vert = rampe(0x4f7a3a);
    for (let x = 1; x <= 14; x++) t.poser(x, 1, 'chene', 3);
    t.forme('lumiere', (x, y) => (y >= 2 && y <= 13 && x >= 2 && x <= 5 ? [0, 0, 1] : null), { bord: false });
    t.forme('vert', (x, y) => (y >= 2 && y <= 13 && x >= 6 && x <= 9 ? [0, 0, 1] : null), { bord: false });
    t.forme('ombre', (x, y) => (y >= 2 && y <= 13 && x >= 10 && x <= 13 ? [0, 0, 1] : null), { bord: false });
    t.poser(3, 5, 'or', 5); t.poser(7, 8, 'vert', 1); t.poser(8, 7, 'vert', 1); t.poser(11, 5, 'lin', 5);
    for (let x = 2; x <= 13; x += 2) t.poser(x, 14, 'or', 3);
  },
  carillon(t) { // des tubes de cuivre suspendus à un disque de bois
    t.rampes.cuivre = rampe(0xc87a3a);
    t.forme('chene', ellipsoide(8, 3, 5, 1.8), { decalage: 0.3 });
    trait(t, 'chanvre', 8, 0, 8, 2, 0.5);
    for (const [x, h] of [[4, 9], [6, 12], [8, 14], [10, 11], [12, 8]]) for (let y = 5; y <= h; y++) t.poser(x, y, 'cuivre', y === 5 ? 1 : x % 4 === 0 ? 4 : 3);
  },
  horloge(t) { // une horloge à coucou : toit pointu, cadran, balancier
    t.rampes.cadran = rampe(0xf0e8d0);
    t.forme('cheneSombre', (x, y) => (y >= 1 && y <= 5 && Math.abs(x + 0.5 - 8) < (y - 1) * 1.3 + 1 ? [0, -0.4, 0.8] : null));
    t.forme('chene', (x, y) => (y >= 5 && y <= 12 && x >= 3 && x <= 12 ? [(x + 0.5 - 8) / 6, 0, 0.8] : null), { decalage: -0.3 });
    t.forme('cadran', ellipsoide(8, 8.5, 3, 3), { decalage: 0.5 });
    t.poser(8, 8, 'encre', 0); t.poser(8, 7, 'encre', 0); t.poser(9, 8, 'encre', 0);
    for (let y = 12; y <= 15; y++) t.poser(8, y, 'or', 3); t.poser(7, 15, 'or', 4); t.poser(9, 15, 'or', 4);
    t.poser(8, 2, 'cadran', 5); t.poser(8, 3, 'cadran', 4); // le coucou à sa lucarne
  },
  globe(t) { // un globe de cristal sur un pied de laiton, une lueur à l'intérieur
    t.rampes.cristal = rampe(0x9ad0f0);
    t.forme('cristal', ellipsoide(8, 7, 5.5, 5.5), { decalage: 0.2, motif: (x, y) => (Math.hypot(x + 0.5 - 6, y + 0.5 - 5) < 2 ? 1.5 : 0) });
    t.poser(8, 8, 'cristal', 5); t.poser(9, 7, 'cristal', 5);
    t.forme('laiton', (x, y) => (y >= 12 && y <= 15 && Math.abs(x + 0.5 - 8) < (y - 10) * 0.9 ? [0, -0.3, 0.8] : null));
  },
  fougere(t) { // une fougère touffue dans un pot de terre
    t.rampes.feuille = rampe(0x4f8a3a); t.rampes.terre = rampe(0xb06a3a);
    t.forme('terre', (x, y) => (y >= 11 && y <= 15 && Math.abs(x + 0.5 - 8) < 4.5 - (y - 11) * 0.3 ? [(x + 0.5 - 8) / 5, 0, 0.8] : null));
    for (const [dx, dy, s] of [[0, 0, 0], [-1, 1, -1], [1, 1, 1], [-2, 3, -1], [2, 3, 1]]) {
      for (let k = 0; k < 7 - Math.abs(dy); k++) { const x = 8 + dx + Math.round(s * k * 0.7), y = 10 - dy - k; t.poser(x, y, 'feuille', 3); t.poser(x + 1, y, 'feuille', k % 2 ? 4 : 2); t.poser(x - 1, y, 'feuille', k % 2 ? 2 : 4); }
    }
  },
  // --- La garde-robe de Marcelline ---
  chapeau(t) { // un chapeau de cow-boy : calotte pincée, bord relevé, ruban de cuir
    t.rampes.feutre = rampe(0x4a3a2a);
    t.forme('feutre', (x, y) => (y >= 2 && y <= 9 && Math.abs(x + 0.5 - 8) < 4.5 - Math.max(0, 4 - y) * 0.5 ? [(x + 0.5 - 8) / 5, -0.2, 0.8] : null), { motif: (x, y) => (y < 6 && Math.abs(x + 0.5 - 8) < 1 ? -0.9 : 0) });
    t.forme('feutre', (x, y) => { const d = Math.abs(x + 0.5 - 8); const rel = d > 5 ? Math.round((d - 5) * 0.7) : 0; return y >= 9 - rel && y <= 11 - rel && d < 8 ? [0, (y - 10) * 0.6, 0.8] : null; });
    for (let x = 4; x <= 11; x++) t.poser(x, 8, 'cuir', 2);
  },
  bandana(t) { // un bandana rouge à pois, noué
    t.rampes.ruban = rampe(0x9a2a3a);
    t.forme('ruban', (x, y) => (y >= 4 && y <= 13 && Math.abs(x + 0.5 - 8) < 6.5 - (y - 4) * 0.7 ? [(x + 0.5 - 8) / 6 * 0.5, 0.2, 0.9] : null), { motif: (x, y) => ((x * 3 + y * 5) % 7 === 0 ? 1.4 : 0) });
    for (let k = 0; k < 4; k++) t.poser(12 + (k % 2), 2 + k, 'ruban', 2 + (k % 2));
    t.poser(3, 3, 'ruban', 3); t.poser(4, 2, 'ruban', 2);
  },
  cape(t) { // une cape de voyage pliée, avec sa broche
    t.rampes.capeV = rampe(0x5a2a2a);
    t.forme('capeV', (x, y) => (y >= 3 && y <= 14 && Math.abs(x + 0.5 - 8) < 3 + (y - 3) * 0.45 ? [(x + 0.5 - 8) / 8, 0, 0.8] : null), { motif: (x) => (x % 4 === 0 ? -0.5 : 0) });
    t.forme('or', ellipsoide(8, 4, 1.6, 1.6), { decalage: 0.6 });
  },
  echarpe(t) { // une écharpe de laine rayée, enroulée
    t.rampes.laine = rampe(0xc04040);
    t.forme('laine', (x, y) => (y >= 2 && y <= 8 && x >= 2 && x <= 13 ? [0, (y - 5) / 4, 0.9] : null), { motif: (x, y) => (y % 3 === 0 ? 0.6 : 0) });
    t.forme('laine', (x, y) => (y >= 8 && y <= 14 && x >= 9 && x <= 12 ? [(x - 10.5) / 2, 0, 0.9] : null), { motif: (x, y) => (y % 3 === 0 ? 0.6 : 0) });
    for (const x of [9, 11]) t.poser(x, 15, 'laine', 2);
  },
  monocle(t) { // un monocle d'or à chaînette
    for (let a = 0; a < 6.28; a += 0.18) t.poser(Math.round(7 + Math.cos(a) * 4.5), Math.round(6 + Math.sin(a) * 4.5), 'or', a < 3 ? 4 : 3);
    t.forme('verre', ellipsoide(7, 6, 3.6, 3.6), { decalage: 0.8 });
    t.poser(5, 4, 'verre', 5); t.poser(6, 4, 'verre', 5);
    for (let k = 0; k < 6; k++) t.poser(11 + (k % 2), 10 + k, 'or', 4);
  },
  pipe(t) { // une pipe en bruyère, un filet de fumée
    t.rampes.bruyere = rampe(0x6a3a22);
    trait(t, 'bruyere', 3, 6, 11, 9, 1.1);
    t.forme('bruyere', ellipsoide(12, 10, 2.6, 3), { decalage: -0.2 });
    t.poser(12, 7, 'encre', 1); t.poser(11, 7, 'encre', 2);
    for (const [x, y] of [[13, 5], [12, 3], [13, 1]]) { t.poser(x, y, 'lin', 5); t.poser(x + 1, y, 'lin', 4); }
  },
  montre(t) { // une montre à gousset ouverte, sa chaîne d'or
    t.forme('or', ellipsoide(8, 9, 5, 5), { decalage: 0.1 });
    t.forme('lin', ellipsoide(8, 9, 3.4, 3.4), { decalage: 0.9 });
    t.poser(8, 9, 'encre', 0); t.poser(8, 8, 'encre', 0); t.poser(8, 7, 'encre', 1); t.poser(9, 9, 'encre', 0); t.poser(10, 9, 'encre', 1);
    t.poser(8, 3, 'or', 5); t.poser(8, 2, 'or', 4);
    for (let k = 0; k < 5; k++) t.poser(2 + k, 14 - (k % 2), 'or', 3);
  },
  bague(t) { // une bague d'or sertie d'un rubis
    for (let a = 0; a < 6.28; a += 0.14) t.poser(Math.round(8 + Math.cos(a) * 4.5), Math.round(9 + Math.sin(a) * 4.5), 'or', a > 3.5 && a < 6 ? 4 : 2);
    for (let a = 0; a < 6.28; a += 0.2) t.poser(Math.round(8 + Math.cos(a) * 3.5), Math.round(9 + Math.sin(a) * 3.5), 'or', 3);
    t.rampes.rubis = rampe(0xd02030);
    t.forme('rubis', ellipsoide(8, 4, 2.2, 2), { decalage: 0.4 });
    t.poser(7, 3, 'rubis', 5);
  },
  trophee(t) { // une coupe d'or sur son socle
    t.forme('or', (x, y) => (y >= 2 && y <= 8 && Math.abs(x + 0.5 - 8) < 5.5 - (y - 2) * 0.5 ? [(x + 0.5 - 8) / 6, 0, 0.8] : null));
    for (const s of [-1, 1]) trait(t, 'or', 8 + s * 5, 3, 8 + s * 7, 6, 0.6);
    trait(t, 'or', 8, 9, 8, 12, 0.8);
    t.forme('chene', (x, y) => (y >= 12 && y <= 15 && Math.abs(x + 0.5 - 8) < 5 ? [0, -0.3, 0.8] : null));
    t.poser(6, 3, 'or', 5); t.poser(6, 4, 'or', 5);
  },
  lanterne(t) { // une lanterne de fer, flamme vive
    t.forme('fer', (x, y) => (y >= 4 && y <= 13 && Math.abs(x + 0.5 - 8) < 4.5 ? [(x + 0.5 - 8) / 5, 0, 0.8] : null));
    t.forme('flamme', (x, y) => (y >= 6 && y <= 11 && Math.abs(x + 0.5 - 8) < 2.8 ? [0, (y - 9) / 5, 0.9] : null), { decalage: 0.8 });
    for (let x = 4; x <= 11; x++) { t.poser(x, 4, 'fer', 4); t.poser(x, 13, 'fer', 1); }
    trait(t, 'fer', 6, 3, 8, 1, 0.5); trait(t, 'fer', 10, 3, 8, 1, 0.5);
  },
  enclume(t) { // l'enclume du forgeron
    t.forme('fer', (x, y) => (y >= 4 && y <= 7 && x >= 1 && x <= 14 - (y - 4) ? [0, -0.6, 0.8] : null), { decalage: 0.3 });
    t.forme('fer', (x, y) => (y >= 8 && y <= 11 && x >= 5 && x <= 10 ? [(x - 7.5) / 4, 0, 0.8] : null), { decalage: -0.2 });
    t.forme('fer', (x, y) => (y >= 12 && y <= 14 && x >= 3 && x <= 12 ? [0, 0.3, 0.8] : null), { decalage: -0.4 });
    t.forme('fer', (x, y) => (y >= 4 && y <= 6 && x >= 0 && x <= 3 ? [-0.6, -0.4, 0.7] : null), { decalage: 0.2 });
  },
  trefleChance(t) { // le trèfle à quatre feuilles
    t.rampes.trefle = rampe(0x3a9a3a);
    for (const [cx, cy] of [[5.5, 5.5], [10.5, 5.5], [5.5, 10.5], [10.5, 10.5]]) t.forme('trefle', ellipsoide(cx, cy, 3.3, 3.3), { decalage: 0.2 });
    trait(t, 'trefle', 8, 8, 12, 15, 0.6, { decalage: -0.4 });
    t.poser(8, 8, 'trefle', 5);
  },
  // --- Les catégories de trésors rapportés par les aventuriers ---
  tr_arme(t) { // une épée rouillée
    t.rampes.rouille = rampe(0x9a5a2a);
    trait(t, 'rouille', 4, 12, 14, 2, 1.1, { decalage: 0.2 });
    for (const [x, y] of [[8, 7], [11, 4], [6, 10]]) t.poser(x, y, 'metal', 4);
    trait(t, 'chene', 2, 9, 7, 14, 0.8);
    trait(t, 'cuir', 2, 14, 4, 12, 0.8);
  },
  tr_armure(t) { // un casque cabossé
    t.forme('metal', (x, y) => (y >= 3 && y <= 12 ? ellipsoide(8, 9, 6, 6.5)(x, y) : null));
    for (let y = 8; y <= 12; y++) t.poser(8, y, 'metal', 1);
    for (let x = 3; x <= 13; x++) if (x !== 8) t.poser(x, 8, 'encre', 0);
    t.poser(5, 5, 'metal', 0); t.poser(6, 6, 'metal', 1);
  },
  tr_bijou(t) { // une bague sertie
    t.forme('or', (x, y) => { const d = Math.hypot(x + 0.5 - 8, y + 0.5 - 10); return d > 3 && d < 5 ? [(x + 0.5 - 8) / 5, (y + 0.5 - 10) / 5, 0.7] : null; });
    t.forme('gemme', ellipsoide(8, 4.5, 2.6, 2.4), { decalage: 0.5 });
    t.poser(7, 4, 'verre', 5);
  },
  tr_artefact(t) { // une orbe magique sur un pied
    t.forme('gemme', ellipsoide(8, 7, 5, 5), { decalage: 0.4 });
    t.poser(6, 5, 'verre', 5); t.poser(7, 5, 'verre', 4);
    t.forme('or', (x, y) => (y >= 12 && y <= 14 && Math.abs(x + 0.5 - 8) < 4 - (14 - y) * 0.8 ? [0, 0, 0.9] : null));
  },
  tr_vetement(t) { // une cape pliée
    t.forme('tissuRouge', (x, y) => (y >= 5 && y <= 13 && x >= 2 && x <= 13 ? [0, (y - 9) / 8, 0.9] : null), { motif: (x, y) => (y % 3 === 0 ? -0.8 : 0) });
    t.forme('or', ellipsoide(8, 6, 1.6, 1.4), { decalage: 0.4 });
  },
  // --- Les cœurs (récits) ---
  coeur(t) {
    t.forme('verreRouge', (x, y) => {
      const dx = x + 0.5 - 8, dy = y + 0.5 - 8;
      const dedans = Math.hypot(dx + 3, dy + 1.5) < 3.7 || Math.hypot(dx - 3, dy + 1.5) < 3.7 || (dy >= -1.5 && Math.abs(dx) < 6.7 - (dy + 1.5) * 1.05);
      return dedans && y <= 14 ? [dx / 8, dy / 8, 0.8] : null;
    }, { decalage: 0.4 });
    t.poser(5, 5, 'verre', 5); t.poser(5, 6, 'verre', 4);
  },
  coeurVide(t) {
    t.rampes.vide = rampe(0x3a2a2e);
    t.forme('vide', (x, y) => {
      const dx = x + 0.5 - 8, dy = y + 0.5 - 8;
      const dedans = Math.hypot(dx + 3, dy + 1.5) < 3.7 || Math.hypot(dx - 3, dy + 1.5) < 3.7 || (dy >= -1.5 && Math.abs(dx) < 6.7 - (dy + 1.5) * 1.05);
      return dedans && y <= 14 ? [dx / 8, dy / 8, 0.8] : null;
    });
  },
  // --- La caisse (la faillite) ---
  caisse(t) {
    planche(t, 1, 3, 14, 4, 'chene', { graine: 1210, noeuds: 1 });
    planche(t, 1, 7, 14, 4, 'chene', { graine: 1211, noeuds: 1 });
    planche(t, 1, 11, 14, 4, 'chene', { graine: 1212, noeuds: 1 });
    trait(t, 'cheneSombre', 2, 4, 14, 14, 0.7);
    for (const [x, y] of [[2, 4], [13, 4], [2, 13], [13, 13]]) t.poser(x, y, 'fer', 5);
  },
};

// Les pièces de l'armure : une version claire (Confrérie) et une sombre (Main Noire).
const DESSINS_ARMURE = {
  heaume(t) {
    t.forme('acier', (x, y) => (y >= 2 && y <= 13 ? ellipsoide(8, 8.5, 6, 6.5)(x, y) : null));
    for (let x = 3; x <= 13; x++) t.poser(x, 8, 'encre', 0);
    for (let y = 9; y <= 13; y++) t.poser(8, y, 'acier', 1);
    trait(t, 'liseré', 8, 2, 8, 6, 0.6);
  },
  gantelets(t) {
    for (const ox of [5, 11]) {
      t.forme('acier', (x, y) => (y >= 5 && y <= 13 && Math.abs(x + 0.5 - ox) < 2.6 ? [(x + 0.5 - ox) / 3, 0, 0.8] : null));
      for (let y = 6; y <= 12; y += 2) t.poser(ox - 1, y, 'acier', 1);
      t.forme('liseré', (x, y) => (y >= 12 && y <= 14 && Math.abs(x + 0.5 - ox) < 3 ? [0, 0.3, 0.8] : null));
    }
  },
  spalieres(t) {
    for (const [ox, s] of [[5, -1], [11, 1]]) t.forme('acier', (x, y) => (y >= 4 && y <= 11 ? ellipsoide(ox, 8, 4, 4)(x, y) : null));
    for (let x = 1; x <= 15; x++) t.poser(x, 8, 'liseré', 3);
  },
  ceinturon(t) {
    t.forme('cuir', (x, y) => (y >= 6 && y <= 10 && x >= 0 && x <= 15 ? [0, (y - 8) / 4, 0.9] : null));
    t.forme('liseré', (x, y) => (y >= 5 && y <= 11 && x >= 6 && x <= 10 ? [(x - 8) / 3, (y - 8) / 4, 0.8] : null), { decalage: 0.3 });
    t.poser(8, 8, 'encre', 0);
  },
  jambieres(t) {
    for (const ox of [5, 11]) t.forme('acier', (x, y) => (y >= 2 && y <= 14 && Math.abs(x + 0.5 - ox) < 2.8 - (y > 10 ? 0.5 : 0) ? [(x + 0.5 - ox) / 3, 0, 0.8] : null));
    for (const ox of [5, 11]) t.forme('liseré', ellipsoide(ox, 8, 2.4, 1.6), { decalage: 0.3 });
  },
  solerets(t) {
    for (const ox of [4, 11]) t.forme('acier', (x, y) => (y >= 8 && y <= 13 && x >= ox - 3 && x <= ox + 3 - (13 - y) * 0.4 ? [0, (y - 10) / 5, 0.8] : null));
    for (let x = 1; x <= 15; x++) t.poser(x, 13, 'liseré', 2);
  },
  plastron(t) {
    t.forme('acier', (x, y) => (y >= 2 && y <= 14 && Math.abs(x + 0.5 - 8) < 6 - Math.max(0, y - 10) * 0.6 ? [(x + 0.5 - 8) / 7, (y - 8) / 12, 0.8] : null));
    for (let y = 3; y <= 13; y++) t.poser(8, y, 'acier', 5);
    t.forme('liseré', ellipsoide(8, 7, 2.2, 2.2), { decalage: 0.4 });
  },
  pavois(t) {
    t.forme('acier', (x, y) => (y >= 1 && y <= 15 && Math.abs(x + 0.5 - 8) < 6.5 - Math.max(0, y - 9) * 0.8 ? [(x + 0.5 - 8) / 8, (y - 8) / 14, 0.8] : null));
    t.forme('liseré', (x, y) => (Math.abs(x + 0.5 - 8) < 1 && y >= 3 && y <= 13) || (Math.abs(y + 0.5 - 7) < 1 && x >= 3 && x <= 12) ? [0, 0, 1] : null, { decalage: 0.3 });
  },
  lame(t) {
    trait(t, 'acier', 4, 12, 15, 1, 1.2, { decalage: 0.6 });
    trait(t, 'liseré', 2, 9, 7, 14, 0.8);
    trait(t, 'cuir', 1, 15, 4, 12, 0.8);
  },
};

function creerIconesHD(scene) {
  if (scene.textures.exists('hd_coeur')) return;
  for (const [id, dessin] of Object.entries(DESSINS_ICONES)) {
    const t = toileObjet();
    dessin(t);
    t.contour();
    t.texture(scene, 'hd_' + id);
  }
  for (const [id, dessin] of Object.entries(DESSINS_ARMURE)) {
    for (const sombre of [false, true]) {
      const t = toileObjet();
      t.rampes.acier = sombre ? [0x08060c, 0x161220, 0x241c34, 0x34284a, 0x4a3a66, 0x6a5288] : [0x3a4250, 0x5a6472, 0x8a96a4, 0xb8c4d0, 0xdce4ec, 0xffffff];
      t.rampes['liseré'] = sombre ? rampe(0x9a2a6a) : [0x5a3a08, 0x8a6010, 0xc09020, 0xe8c040, 0xf8e070, 0xfffcd0];
      dessin(t);
      t.contour();
      t.texture(scene, 'hd_' + id + (sombre ? '_sombre' : ''));
    }
  }
}
