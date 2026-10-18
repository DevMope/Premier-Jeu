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
  chandelier(t) { // un chandelier d'argent à trois branches, trois flammes
    t.rampes.argent = rampe(0xc8ccd8); t.rampes.cire = rampe(0xf0e8d0); t.rampes.flamme = rampe(0xffc040);
    t.forme('argent', (x, y) => (y >= 13 && y <= 15 && Math.abs(x + 0.5 - 8) < 4 - (15 - y) ? [(x + 0.5 - 8) / 4, -0.3, 0.8] : null));
    for (let y = 7; y <= 13; y++) t.poser(8, y, 'argent', 4);
    for (const s of [-1, 1]) { for (let k = 0; k <= 4; k++) t.poser(8 + s * k, 9 - Math.round(k * k * 0.15), 'argent', 3); t.poser(8 + s * 4, 7, 'argent', 4); }
    for (const x of [4, 8, 12]) { t.poser(x, 5, 'cire', 4); t.poser(x, 6, 'cire', 3); t.poser(x, 3, 'flamme', 5); t.poser(x, 4, 'flamme', 3); }
  },
  banniere(t) { // la bannière bleue de la Confrérie, un soleil d'or
    t.rampes.bleu = rampe(0x2a4a8a);
    for (let x = 1; x <= 14; x++) t.poser(x, 1, 'chene', 3);
    t.forme('bleu', (x, y) => (y >= 2 && y <= 14 && x >= 3 && x <= 12 && (y < 12 || Math.abs(x + 0.5 - 8) > (y - 12) * 2) ? [(x + 0.5 - 8) / 6, 0, 0.8] : null), { motif: (x) => (x % 3 === 0 ? -0.4 : 0) });
    t.forme('or', ellipsoide(8, 7, 2.2, 2.2), { decalage: 0.3 });
    for (const [dx, dy] of [[0, -4], [0, 4], [-4, 0], [4, 0], [-3, -3], [3, -3], [-3, 3], [3, 3]]) t.poser(8 + dx, 7 + dy, 'or', 4);
  },
  craneTroll(t) { // un énorme crâne de troll, un grand trou pour le nez, sur une planche
    t.rampes.os = rampe(0xd8ceb0);
    for (let x = 1; x <= 14; x++) { t.poser(x, 14, 'cheneSombre', 3); t.poser(x, 15, 'cheneSombre', 2); }
    t.forme('os', ellipsoide(8, 6.5, 6.5, 5.5), { decalage: 0.1 });
    t.forme('os', (x, y) => (y >= 9 && y <= 13 && Math.abs(x + 0.5 - 8) < 4.5 - (y - 9) * 0.3 ? [(x + 0.5 - 8) / 5, 0.3, 0.8] : null));
    for (const ox of [5, 10]) { t.poser(ox, 6, 'encre', 0); t.poser(ox + 1, 6, 'encre', 0); t.poser(ox, 7, 'encre', 0); t.poser(ox + 1, 7, 'encre', 1); }
    t.poser(7, 9, 'encre', 0); t.poser(8, 9, 'encre', 0); t.poser(7, 10, 'encre', 1); t.poser(8, 10, 'encre', 0);
    for (let x = 5; x <= 11; x += 2) t.poser(x, 12, 'encre', 1);
  },
  lanterneCrane(t) { // un petit crâne évidé, une lueur verte dedans, pendu à une chaîne
    t.rampes.os = rampe(0xd8ceb0); t.rampes.lueur = rampe(0x70ff50);
    for (let y = 0; y <= 3; y++) t.poser(8, y, 'fer', y % 2 ? 2 : 4);
    t.forme('os', ellipsoide(8, 8, 5, 4.5), { decalage: 0.1 });
    t.forme('os', (x, y) => (y >= 11 && y <= 14 && Math.abs(x + 0.5 - 8) < 3.2 ? [0, 0.3, 0.8] : null));
    for (const ox of [6, 10]) { t.poser(ox, 8, 'lueur', 5); t.poser(ox - (ox < 8 ? 1 : 0), 9, 'lueur', 4); }
    t.poser(8, 11, 'lueur', 3); for (let x = 6; x <= 10; x += 2) t.poser(x, 13, 'encre', 1);
  },
  poison(t) { // une fiole verte, un bouchon de cire, une tête de mort sur l'étiquette
    t.rampes.verre = rampe(0x4ac040); t.rampes.cire = rampe(0x8a2a2a);
    t.forme('verre', (x, y) => (y >= 5 && y <= 14 && Math.abs(x + 0.5 - 8) < (y < 8 ? 2 : 4.5) ? [(x + 0.5 - 8) / 5, 0, 0.8] : null), { motif: (x, y) => (x === 6 && y > 8 ? 1.2 : 0) });
    for (let x = 6; x <= 10; x++) { t.poser(x, 3, 'cire', 3); t.poser(x, 4, 'cire', 2); }
    t.forme('parchemin', (x, y) => (y >= 9 && y <= 12 && Math.abs(x + 0.5 - 8) < 2.6 ? [0, 0, 1] : null), { bord: false });
    t.poser(7, 10, 'encre', 0); t.poser(9, 10, 'encre', 0); t.poser(8, 11, 'encre', 1);
  },
  grimoire(t) { // un livre noir à fermoir, un œil violet sur la couverture
    t.rampes.cuirNoir = rampe(0x2a1a2a); t.rampes.oeilViolet = rampe(0xb050f0);
    t.forme('cuirNoir', (x, y) => (x >= 3 && x <= 13 && y >= 2 && y <= 14 ? [(x + 0.5 - 8) / 7, 0, 0.8] : null), { motif: (x) => (x === 3 ? -0.8 : 0) });
    for (let y = 3; y <= 13; y++) t.poser(13, y, 'parchemin', y % 2 ? 4 : 3);
    t.forme('oeilViolet', ellipsoide(8.5, 7.5, 2.5, 1.5), { decalage: 0.4, bord: false }); t.poser(8, 7, 'encre', 0); t.poser(9, 7, 'encre', 0);
    for (let y = 6; y <= 9; y++) t.poser(14, y, 'or', 4);
  },
  poudre(t) { // un sachet noué d'où s'échappe une poudre bleu nuit étoilée
    t.rampes.sac = rampe(0x5a4a5a); t.rampes.nuitPoudre = rampe(0x3a3a8a);
    t.forme('sac', (x, y) => (y >= 6 && y <= 14 && Math.abs(x + 0.5 - 8) < 4.5 - Math.max(0, 8 - y) ? [(x + 0.5 - 8) / 5, 0.2, 0.8] : null));
    for (let x = 6; x <= 10; x++) t.poser(x, 6, 'chanvre', 3);
    for (const [x, y] of [[11, 4], [12, 3], [13, 5], [10, 2], [12, 1]]) t.poser(x, y, 'nuitPoudre', 4);
    t.poser(12, 2, 'or', 5); t.poser(10, 4, 'or', 5);
  },
  // (v0.82, étape 10b) les armes interdites de ta forge
  lameEmpoisonnee(t) { // une dague dont la lame suinte un poison vert
    t.rampes.venin = rampe(0x58d040);
    for (let k = 0; k < 9; k++) { t.poser(5 + k, 10 - k, 'metal', 4); t.poser(6 + k, 10 - k, 'metal', 2); }
    for (const [x, y] of [[8, 8], [10, 6], [12, 4], [9, 9], [13, 3]]) t.poser(x, y, 'venin', 4);
    t.poser(9, 10, 'venin', 3); t.poser(9, 11, 'venin', 5); t.poser(12, 6, 'venin', 3); t.poser(12, 7, 'venin', 5);
    for (let k = 0; k < 4; k++) { t.poser(2 + k, 9 + k, 'or', 3); t.poser(3 + k, 8 + k, 'or', 4); }
    for (let k = 0; k < 3; k++) t.poser(2 + k, 13 - k + 1, 'cuir', 3);
  },
  lameLune(t) { // une lame courbe noir-bleu, mate, avec un croissant de lune gravé
    t.rampes.lameNoire = rampe(0x2a2a4a);
    t.forme('lameNoire', (x, y) => { const d = Math.hypot(x + 0.5 - 2, y + 0.5 - 16); return d > 9 && d < 13 && x > 2 && y < 12 ? [0, 0, 1] : null; });
    t.poser(8, 6, 'or', 4); t.poser(9, 7, 'or', 3); t.poser(8, 8, 'or', 4);   // le croissant
    for (let k = 0; k < 4; k++) t.poser(1 + k, 12 + Math.min(k, 3), 'cuir', 3);
    t.poser(3, 11, 'metal', 4); t.poser(4, 12, 'metal', 4);
  },
  griffesOmbre(t) { // trois griffes de fer noirci sur un gantelet, une serrure fondue dessus
    t.rampes.ferNoir = rampe(0x3a3440);
    t.forme('cuir', (x, y) => (y >= 9 && y <= 14 && x >= 3 && x <= 12 ? [0, 0.2, 0.9] : null));
    for (const x0 of [4, 7, 10]) for (let k = 0; k < 7; k++) t.poser(x0 + Math.round(k * 0.3), 8 - k, 'ferNoir', k < 2 ? 2 : 4);
    t.forme('or', ellipsoide(8, 12, 1.6, 1.6), { decalage: 0.3 }); t.poser(8, 12, 'encre', 0);
  },
  passe(t) { // une clé tordue à l'anneau de fer
    t.forme('fer', (x, y) => (Math.abs(Math.hypot(x + 0.5 - 5, y + 0.5 - 5) - 2.6) < 1 ? [0, 0, 1] : null));
    for (let k = 0; k < 8; k++) { t.poser(7 + k, 7 + k, 'fer', 4); t.poser(7 + k, 8 + k, 'fer', 2); }
    t.poser(12, 14, 'fer', 3); t.poser(11, 14, 'fer', 3); t.poser(14, 11, 'fer', 3); t.poser(14, 12, 'fer', 3);
  },
  fougere(t) { // une fougère touffue dans un pot de terre
    t.rampes.feuille = rampe(0x4f8a3a); t.rampes.terre = rampe(0xb06a3a);
    t.forme('terre', (x, y) => (y >= 11 && y <= 15 && Math.abs(x + 0.5 - 8) < 4.5 - (y - 11) * 0.3 ? [(x + 0.5 - 8) / 5, 0, 0.8] : null));
    for (const [dx, dy, s] of [[0, 0, 0], [-1, 1, -1], [1, 1, 1], [-2, 3, -1], [2, 3, 1]]) {
      for (let k = 0; k < 7 - Math.abs(dy); k++) { const x = 8 + dx + Math.round(s * k * 0.7), y = 10 - dy - k; t.poser(x, y, 'feuille', 3); t.poser(x + 1, y, 'feuille', k % 2 ? 4 : 2); t.poser(x - 1, y, 'feuille', k % 2 ? 2 : 4); }
    }
  },
  coquillageNymphe(t) { // (v0.67) le souvenir de la nymphe : un coquillage nacré en éventail, côtelé, où luit une goutte
    t.rampes.nacre = rampe(0xe8d4dc); t.rampes.goutte = rampe(0x4ab8d0);
    t.forme('nacre', (x, y) => {
      const dx = x + 0.5 - 8, dy = y + 0.5 - 13, r = Math.hypot(dx, dy), a = Math.atan2(-dy, dx);
      const bord = 7.4 + Math.cos(a * 14) * 0.5;   // le bord festonné
      return a > 0.25 && a < Math.PI - 0.25 && r < bord ? [dx / 9, dy / 9, 0.75] : null;
    }, { motif: (x, y) => (Math.round(Math.atan2(13 - y - 0.5, x + 0.5 - 8) * 14 / Math.PI) % 2 ? -0.7 : 0.4) });
    // la charnière et ses deux oreillettes
    t.forme('nacre', (x, y) => (y >= 12 && y <= 13 && Math.abs(x + 0.5 - 8) < (y === 12 ? 3.6 : 2.6) ? [0, 0.4, 0.8] : null), { decalage: -0.3 });
    t.forme('goutte', ellipsoide(8, 8.5, 1.4, 1.7), { decalage: 0.7, bord: false });
    t.poser(8, 7, 'goutte', 5);
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
  // --- (v1.01) La Nuit des Brumes ---
  masqueOs(t) { // le masque d'os des anciens : deux orbites, une fente pour la bouche, un lien de cuir
    t.rampes.os = rampe(0xe8dcc0);
    t.forme('os', (x, y) => { const d = Math.hypot((x + 0.5 - 8) / 5.6, (y + 0.5 - 8) / 6.8); return d < 1 ? [(x + 0.5 - 8) / 7, (y - 8) / 8, 0.8] : null; }, { motif: (x, y) => ((x * 7 + y * 3) % 11 === 0 ? -0.8 : 0) });
    for (const ox of [5, 10]) for (let y = 6; y <= 8; y++) for (let x = ox; x <= ox + 1; x++) t.poser(x, y, 'encre', 1);
    for (let x = 6; x <= 10; x++) t.poser(x, 12, 'encre', 2);
    for (let y = 5; y <= 9; y++) { t.poser(2, y, 'cuir', 2); t.poser(13, y, 'cuir', 2); }
  },
  chaleBrume(t) { // le châle de brume : gris, effiloché, plié en triangle
    t.rampes.brume = rampe(0x8a8a9a);
    t.forme('brume', (x, y) => (y >= 3 && y <= 13 && Math.abs(x + 0.5 - 8) < 7 - (y - 3) * 0.6 ? [(x + 0.5 - 8) / 8, 0, 0.85] : null), { motif: (x, y) => ((x + y) % 3 === 0 ? 0.6 : 0) });
    for (let x = 2; x <= 13; x++) t.poser(x, 3, 'brume', 5);
    for (const [x, y] of [[4, 14], [7, 15], [9, 14], [12, 13]]) t.poser(x, y, 'brume', 2);
  },
  lanterneCeinture(t) { // la petite lanterne rouge de ceinture, son crochet et ses franges d'or
    t.rampes.rouge = rampe(0xc81e18);
    t.forme('rouge', ellipsoide(8, 8, 5, 4.5), { decalage: 0.2, motif: (x) => (x % 3 === 0 ? -0.6 : 0) });
    for (let x = 5; x <= 10; x++) { t.poser(x, 3, 'encre', 2); t.poser(x, 13, 'encre', 2); }
    trait(t, 'or', 8, 0, 8, 3, 0.6);
    for (const x of [6, 8, 10]) for (let y = 14; y <= 15; y++) t.poser(x, y, 'or', 4);
    t.poser(8, 8, 'or', 5);
  },
  painCendre(t) { // le pain de cendre : une miche sombre, cuite sous la braise, un peu de cendre dessus
    t.forme('pain', (x, y) => { const d = Math.hypot((x + 0.5 - 8) / 6.5, (y + 0.5 - 9) / 4.5); return d < 1 ? [(x + 0.5 - 8) / 8, (y - 9) / 6, 0.8] : null; }, { motif: (x, y) => ((x * 5 + y * 3) % 7 === 0 ? -1.4 : -0.5) });
    for (const [x0, x1] of [[5, 7], [8, 10]]) trait(t, 'pain', x0, 7, x1, 9, 0.4, { decalage: -1, bord: false });
    for (const [x, y] of [[6, 6], [10, 7], [8, 5], [11, 9]]) t.poser(x, y, 'lin', 3);
  },
  // --- (v1.00) La Fête du Solstice ---
  tarte(t) { // une tarte aux fruits rouges, croisillons dorés, une part entamée
    t.rampes.feuille = rampe(0x4a9a3a);
    t.rampes.fruit = rampe(0xc0283a);
    t.forme('pain', (x, y) => { const d = Math.hypot((x + 0.5 - 8) / 7, (y + 0.5 - 9) / 4.6); return d < 1 && !(x >= 9 && y <= 8 && x - 9 > 8 - y - 1) ? [(x + 0.5 - 8) / 8, (y - 9) / 6, 0.8] : null; });
    t.forme('fruit', (x, y) => { const d = Math.hypot((x + 0.5 - 8) / 5.6, (y + 0.5 - 8.6) / 3.4); return d < 1 && !(x >= 9 && y <= 8 && x - 9 > 8 - y - 1) ? [(x + 0.5 - 8) / 8, -0.3, 0.9] : null; }, { motif: (x, y) => ((x + y) % 3 === 0 ? 0.9 : 0) });
    for (const [x0, y0, x1, y1] of [[4, 7, 11, 11], [5, 10, 10, 6], [3, 9, 8, 6], [7, 11, 12, 8]]) trait(t, 'pain', x0, y0, x1, y1, 0.6, { decalage: 0.6, bord: false });
    t.poser(6, 6, 'feuille', 3); t.poser(7, 5, 'feuille', 4);
  },
  trefleSolstice(t) { // un trèfle à quatre feuilles noué d'un ruban bleu et or
    t.rampes.feuille = rampe(0x4a9a3a);
    for (const [cx, cy] of [[8, 4.5], [11.5, 8], [8, 11.5], [4.5, 8]]) t.forme('feuille', ellipsoide(cx, cy, 3, 3), { decalage: 0.2 });
    for (const [x, y] of [[8, 5], [11, 8], [8, 11], [5, 8]]) t.poser(x, y, 'feuille', 5);
    trait(t, 'feuille', 9, 10, 12, 15, 0.7, { decalage: -0.4 });
    t.rampes.ruban = rampe(0x2a5aa8);
    t.forme('ruban', ellipsoide(8, 8, 1.6, 1.6), { decalage: 0.3 });
    t.poser(8, 8, 'or', 5);
  },
  couronneFleurs(t) { // une couronne tressée de blé, de fleurs blanches, jaunes et roses
    t.rampes.feuille = rampe(0x4a9a3a);
    t.rampes.paille = rampe(0xd0a040); t.rampes.fleurB = rampe(0xf4f0e8); t.rampes.fleurJ = rampe(0xf0c830); t.rampes.fleurR = rampe(0xe87aa0);
    t.forme('paille', (x, y) => { const d = Math.hypot((x + 0.5 - 8) / 7, (y + 0.5 - 8) / 4.2); return d > 0.62 && d < 1 ? [(x + 0.5 - 8) / 8, (y - 8) / 5, 0.8] : null; }, { motif: (x, y) => ((x + y * 2) % 3 === 0 ? -0.6 : 0) });
    [[2, 8, 'fleurB'], [4, 5, 'fleurJ'], [8, 4, 'fleurR'], [12, 5, 'fleurB'], [14, 8, 'fleurJ'], [11, 11, 'fleurR'], [5, 11, 'fleurB'], [8, 12, 'fleurJ']]
      .forEach(([x, y, m]) => { t.forme(m, ellipsoide(x, y, 1.6, 1.6), { decalage: 0.4 }); t.poser(x, y, 'fleurJ', 2); });
    t.poser(6, 4, 'feuille', 3); t.poser(10, 12, 'feuille', 3);
  },
  echarpeUnion(t) { // l'écharpe de la Confrérie : bleu roi, bordée d'or, une tour brodée
    t.rampes.bleuRoi = rampe(0x2a4a9a);
    t.forme('bleuRoi', (x, y) => (y >= 2 && y <= 8 && x >= 2 && x <= 13 ? [0, (y - 5) / 4, 0.9] : null), { motif: (x, y) => (y === 2 || y === 8 ? 1.6 : 0) });
    t.forme('bleuRoi', (x, y) => (y >= 8 && y <= 14 && x >= 9 && x <= 12 ? [(x - 10.5) / 2, 0, 0.9] : null));
    for (let x = 2; x <= 13; x++) { t.poser(x, 2, 'or', 4); t.poser(x, 8, 'or', 3); }
    for (let y = 9; y <= 14; y++) { t.poser(9, y, 'or', 3); t.poser(12, y, 'or', 4); }
    for (const [x, y] of [[6, 4], [7, 4], [8, 4], [6, 5], [8, 5], [6, 6], [7, 6], [8, 6], [5, 3], [7, 3], [9, 3]]) t.poser(x, y, 'or', 5);
    for (const x of [9, 10, 11, 12]) t.poser(x, 15, 'or', 4);
  },
  capeUnion(t) { // la cape blanche de l'Union, pliée, sa bordure d'or et sa broche bleue
    t.rampes.capeB = rampe(0xe8e8f0); t.rampes.saphir = rampe(0x2a5ac8);
    t.forme('capeB', (x, y) => (y >= 3 && y <= 14 && Math.abs(x + 0.5 - 8) < 3 + (y - 3) * 0.45 ? [(x + 0.5 - 8) / 8, 0, 0.8] : null), { motif: (x) => (x % 4 === 0 ? -0.5 : 0) });
    for (let y = 3; y <= 14; y++) { const d = Math.round(3 + (y - 3) * 0.45); t.poser(8 - d, y, 'or', 3); t.poser(7 + d, y, 'or', 4); }
    for (let x = 3; x <= 12; x++) t.poser(x, 14, 'or', 4);
    t.forme('saphir', ellipsoide(8, 4, 1.6, 1.6), { decalage: 0.6 });
  },
  // --- (v1.05) La Fête du Long Hiver ---
  bonnetHiver(t) { // le bonnet de laine rouge côtelé, son revers blanc et son pompon
    t.rampes.rouge = rampe(0xc0302c); t.rampes.laineB = rampe(0xf4f2ee);
    t.forme('rouge', (x, y) => { const d = Math.hypot((x + 0.5 - 8) / 6, (y + 0.5 - 11) / 7); return d < 1 && y <= 11 ? [(x + 0.5 - 8) / 7, (y - 9) / 7, 0.8] : null; }, { motif: (x) => (x % 3 === 0 ? -0.5 : 0) });
    t.forme('laineB', (x, y) => (y >= 10 && y <= 13 && x >= 1 && x <= 14 ? [(x - 7.5) / 8, (y - 11.5) / 3, 0.85] : null), { motif: (x, y) => ((x + y) % 2 ? 0.4 : -0.2) });
    t.forme('laineB', ellipsoide(8, 3, 2.4, 2.2), { decalage: 0.3, motif: (x, y) => ((x + y) % 2 ? 0.4 : -0.2) });
  },
  mouflesHiver(t) { // deux moufles vert sapin, leur pouce, leur revers de fourrure blanche, reliées d'un cordon
    t.rampes.sapin = rampe(0x2e6a3a); t.rampes.laineB = rampe(0xf4f2ee);
    for (const [ox, sens] of [[4.5, -1], [11.5, 1]]) {
      t.forme('sapin', ellipsoide(ox, 8, 3, 4), { decalage: 0.1 });
      t.forme('sapin', ellipsoide(ox + sens * 3, 9, 1.2, 1.8), { decalage: 0.3 });
      t.forme('laineB', (x, y) => (y >= 11 && y <= 14 && Math.abs(x + 0.5 - ox) < 3.4 ? [(x + 0.5 - ox) / 4, 0, 0.85] : null), { motif: (x, y) => ((x + y) % 2 ? 0.4 : -0.2) });
    }
    trait(t, 'lin', 4, 3, 12, 3, 0.4);
  },
  echarpeHiver(t) { // l'écharpe du Long Hiver, rayée rouge et blanc, à franges
    t.rampes.rouge = rampe(0xc8302c); t.rampes.laineB = rampe(0xf4f2ee);
    t.forme('rouge', (x, y) => (y >= 2 && y <= 7 && x >= 1 && x <= 14 ? [0, (y - 4.5) / 4, 0.9] : null));
    t.forme('rouge', (x, y) => (y >= 7 && y <= 13 && x >= 9 && x <= 12 ? [(x - 10.5) / 2, 0, 0.9] : null));
    for (const x of [3, 6, 13]) for (let y = 2; y <= 7; y++) t.poser(x, y, 'laineB', 4);
    for (const y of [9, 12]) for (let x = 9; x <= 12; x++) t.poser(x, y, 'laineB', 4);
    for (const x of [9, 11, 12]) for (let y = 14; y <= 15; y++) t.poser(x, y, 'rouge', 2);
  },
  sapinCristal(t) { // le sapin de cristal : trois étages de verre bleu, une étoile d'or, un pied d'argent
    t.rampes.cristal = rampe(0x70d8f0); t.rampes.argent = rampe(0xc8ccd4);
    for (const [y0, y1, l] of [[2, 7, 3.5], [5, 11, 5.2], [8, 14, 6.8]]) t.forme('cristal', (x, y) => (y >= y0 && y <= y1 && Math.abs(x + 0.5 - 8) < (y - y0 + 1) / (y1 - y0 + 1) * l ? [(x + 0.5 - 8) / 8, -0.2, 0.9] : null), { decalage: 0.2, motif: (x, y) => ((x * 3 + y * 5) % 7 === 0 ? 1.2 : 0) });
    t.forme('argent', (x, y) => (y >= 14 && y <= 15 && x >= 6 && x <= 9 ? [0, 0, 1] : null));
    t.poser(8, 1, 'or', 5); t.poser(7, 2, 'or', 4); t.poser(9, 2, 'or', 4); t.poser(8, 0, 'or', 3);
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
};

// (v0.61) Les armes légendaires, une par royaume libéré (en 24 × 24 : plus de détail qu'une marchandise ;
// la massue des nains, plus imposante, en 32 × 32).
const TAILLE_ARMES = { briseMontagne: 32 };
// L'échelle d'affichage d'une arme : les plus grandes toiles restent un peu plus grandes à l'écran
function echelleArme(id, echelle) { const n = TAILLE_ARMES[id] || 24; return echelle * 24 / n * (n > 24 ? 1.2 : 1); }
const DESSINS_ARMES = {
  // Pique-Bourdon : une dague de hobbit, garde en feuille, pommeau de laiton
  piqueBourdon(t) {
    t.rampes.lame = rampe(0xdce6f0); t.rampes.laiton = rampe(0xd8a838); t.rampes.bois = rampe(0x7a4a24);
    trait(t, 'lame', 8, 16, 19, 5, 1.6, { decalage: 0.5 });
    trait(t, 'lame', 9, 15, 18, 6, 0.5, { decalage: 0.9, bord: false });
    t.forme('laiton', ellipsoide(7.5, 16.5, 3.2, 1.6), { decalage: 0.2 });
    trait(t, 'bois', 3, 21, 7, 17, 1.2);
    t.forme('laiton', ellipsoide(3, 21, 1.6, 1.6), { decalage: 0.4 });
  },
  // Aube-Lame : l'épée du champion, longue, lame claire et garde dorée, une gemme d'aube
  aubeLame(t) {
    t.rampes.lame = rampe(0xe8f0ff); t.rampes.or = rampe(0xe8c040); t.rampes.cuirR = rampe(0x6a2a1a); t.rampes.gemme = rampe(0xff9a5a);
    trait(t, 'lame', 7, 17, 21, 3, 1.7, { decalage: 0.5 });
    trait(t, 'lame', 8, 16, 20, 4, 0.5, { decalage: 0.95, bord: false });
    trait(t, 'or', 3, 13, 11, 21, 1.1, { decalage: 0.3 });
    trait(t, 'cuirR', 3, 21, 7, 17, 1.2);
    t.forme('or', ellipsoide(2.5, 21.5, 1.7, 1.7), { decalage: 0.4 });
    t.forme('gemme', ellipsoide(7, 17, 1.2, 1.2), { decalage: 0.6 });
  },
  // Brise-Montagne : la massue du premier roi nain, longue hampe de fer et tête à ailettes
  // tranchantes qui jaillissent comme des éclats de roche, une rune bleue au cœur
  briseMontagne(t) {
    t.rampes.fer = rampe(0x6a6e78); t.rampes.ferS = rampe(0x34363e); t.rampes.lame = rampe(0xc8ccd4); t.rampes.rune = rampe(0x58c8ff); t.rampes.cuir = rampe(0x4a3424);
    const O = [13, 19], ax = [0.707, -0.707], no = [0.707, 0.707];   // le haut de la hampe, l'axe de l'arme et sa normale
    const pt = (u, v) => [O[0] + ax[0] * u + no[0] * v, O[1] + ax[1] * u + no[1] * v];
    // la hampe et sa poignée gainée, le pommeau
    trait(t, 'ferS', 2.5, 29.5, O[0], O[1], 1.2);
    for (const u of [0.12, 0.24, 0.36, 0.48]) t.forme('cuir', ellipsoide(2.5 + 10.5 * u, 29.5 - 10.5 * u, 1.6, 1.6), { decalage: 0.1 });
    t.forme('fer', ellipsoide(2.2, 29.8, 1.7, 1.7), { decalage: 0.3 });
    // une ailette : une lame en pointe qui part du cœur vers l'extérieur et vers le haut
    const lame = (u0, cote, long, larg) => {
      const [bx, by] = pt(u0, 0), [tx, ty] = pt(u0 + long * 0.6, cote * long);
      t.forme('lame', (x, y) => { const px = x + 0.5, py = y + 0.5, dx = tx - bx, dy = ty - by, L2 = dx * dx + dy * dy;
        const v = ((px - bx) * dx + (py - by) * dy) / L2; if (v < 0 || v > 1) return null;
        const d = Math.abs((px - bx) * dy - (py - by) * dx) / Math.sqrt(L2); return d <= larg * (1 - v) + 0.2 ? [cote * 0.7, -0.4, 0.8] : null; }, { decalage: 0.3 });
    };
    for (const [u0, long] of [[2, 5], [6.2, 6.5], [10.4, 5.5]]) { lame(u0, -1, long, 1.25); lame(u0, 1, long, 1.25); }
    // le cœur sombre de la tête, gravé, la pointe au sommet, les runes
    t.forme('ferS', (x, y) => { const px = x + 0.5 - O[0], py = y + 0.5 - O[1]; const u = px * ax[0] + py * ax[1], v = px * no[0] + py * no[1];
      return u > -0.5 && u < 14 && Math.abs(v) < 2 - Math.max(0, u - 12) * 0.7 ? [v / 2.5, -0.2, 0.85] : null; }, { decalage: 0.1 });
    const [sx, sy] = pt(13, 0), [px2, py2] = pt(18, 0);
    trait(t, 'lame', sx, sy, px2, py2, 1.1, { decalage: 0.4 });
    for (const u of [2, 6.2, 10.4]) { const [rx, ry] = pt(u, 0); t.poser(Math.round(rx), Math.round(ry), 'rune', 5); }
  },
  // Chant-de-Lune : un arc d'argent pâle, une lune à la poignée
  chantDeLune(t) {
    t.rampes.argent = rampe(0xc8d8e8); t.rampes.corde = rampe(0xf0f4ff); t.rampes.lune = rampe(0xfff4c0); t.rampes.feuille = rampe(0x6ac08a);
    t.forme('argent', (x, y) => { const d = Math.hypot(x + 0.5 - 3, y + 0.5 - 12); return d > 8.6 && d < 10.6 && x >= 3 ? [(x - 8) / 10, (y - 12) / 10, 0.8] : null; });
    trait(t, 'corde', 4, 2, 4, 22, 0.35, { bord: false });
    t.forme('lune', (x, y) => (Math.hypot(x + 0.5 - 13, y + 0.5 - 12) < 2.2 && Math.hypot(x + 0.5 - 14, y + 0.5 - 11.5) > 1.6 ? [0, 0, 1] : null), { decalage: 0.5 });
    t.forme('feuille', ellipsoide(9, 4, 1.6, 0.9), { decalage: 0.2 }); t.forme('feuille', ellipsoide(9, 20, 1.6, 0.9), { decalage: 0.2 });
  },
  // Le Bâton des Sept Étoiles : un bâton noueux, sept pierres (la dernière éteinte)
  septEtoiles(t) {
    t.rampes.bois = rampe(0x5a3a6a); t.rampes.pierre = rampe(0xb8a8ff); t.rampes.eteinte = rampe(0x4a4458); t.rampes.or = rampe(0xe8c040);
    trait(t, 'bois', 6, 22, 15, 6, 1.3);
    t.forme('or', (x, y) => { const d = Math.hypot(x + 0.5 - 16, y + 0.5 - 5); return d > 3 && d < 4.4 ? [0, 0, 0.8] : null; }, { decalage: 0.2 });
    t.forme('pierre', ellipsoide(16, 5, 2, 2), { decalage: 0.6 });
    [[10.5, 15], [9.3, 17], [8.2, 19]].forEach(([x, y]) => t.poser(Math.round(x), y, 'pierre', 5));
    [[19, 2], [20, 6]].forEach(([x, y]) => t.poser(x, y, 'pierre', 5));
    t.poser(12, 2, 'eteinte', 3);
  },
  // Souffle-de-Bambou : une lance à lame courbe, hampe de bambou à nœuds, un ruban rouge
  souffleBambou(t) {
    t.rampes.bambou = rampe(0x9ad070); t.rampes.lame = rampe(0xdce6f0); t.rampes.ruban = rampe(0xd83a2a);
    trait(t, 'bambou', 3, 22, 16, 9, 1);
    for (const k of [0.3, 0.55, 0.8]) t.poser(Math.round(3 + 13 * k), Math.round(22 - 13 * k), 'bambou', 1);
    t.forme('lame', (x, y) => { const d = Math.hypot(x + 0.5 - 14, y + 0.5 - 11); return d > 7 && d < 10 && x >= 16 && y <= 9 && y >= 1 ? [(x - 18) / 6, (y - 5) / 8, 0.85] : null; }, { decalage: 0.4 });
    t.forme('ruban', ellipsoide(14, 13, 1.4, 2.2), { decalage: 0.2 });
    trait(t, 'ruban', 13, 14, 11, 18, 0.6);
  },
  // Croc-de-Wyverne : une hache dont la lame est une dent d'os ivoire
  crocWyverne(t) {
    t.rampes.bois = rampe(0x6a4020); t.rampes.os = rampe(0xece0c0); t.rampes.cuir = rampe(0x8a5a30);
    trait(t, 'bois', 5, 22, 15, 4, 1.2);
    t.forme('os', (x, y) => { const px = x + 0.5, py = y + 0.5;
      const u = (py - 6) / 9; if (u < 0 || u > 1) return null; const larg = 6 * Math.sin(u * Math.PI) ** 0.7;
      return px > 14 && px < 14 + larg + 1 ? [(px - 17) / 5, (py - 10) / 9, 0.85] : null; });
    trait(t, 'cuir', 12, 8, 15, 11, 1, { decalage: 0.3 }); trait(t, 'cuir', 12, 11, 14, 13, 0.8, { decalage: 0.3 });
  },
  // La Lame sans Nom : un sabre noir courbe, fil rouge sombre
  lameSansNom(t) {
    t.rampes.noir = rampe(0x3a3448); t.rampes.fil = rampe(0xc83a5a); t.rampes.cuir = rampe(0x2a1a14); t.rampes.argent = rampe(0x9aa0b0);
    t.forme('noir', (x, y) => { const d = Math.hypot(x + 0.5 - 4, y + 0.5 + 4); return d > 17 && d < 19.6 && x >= 6 && y <= 18 ? [(x - 12) / 12, (y - 8) / 12, 0.85] : null; }, { decalage: 0.3 });
    t.forme('fil', (x, y) => { const d = Math.hypot(x + 0.5 - 4, y + 0.5 + 4); return d > 19 && d < 19.8 && x >= 8 && y <= 16 ? [0, 0, 1] : null; }, { decalage: 0.6, bord: false });
    trait(t, 'argent', 7, 13, 11, 17, 1, { decalage: 0.3 });
    trait(t, 'cuir', 4, 20, 9, 15, 1.1);
    t.forme('argent', ellipsoide(3.5, 20.5, 1.4, 1.4), { decalage: 0.3 });
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
  for (const [id, dessin] of Object.entries(DESSINS_ARMES)) {
    const n = TAILLE_ARMES[id] || 24;
    const t = toileObjet(n, n);
    dessin(t);
    t.contour();
    t.texture(scene, 'arme_' + id);
  }
}

// (v0.93) La médaille de tes parents, rendue par le mendiant : un disque d'or terni, deux épées
// croisées sous une étoile, pendu à un ruban rouge usé
function texMedailleParents(scene) {
  const cle = 'medailleParents';
  if (scene.textures.exists(cle)) return cle;
  const g = scene.make.graphics({ add: false });
  g.fillStyle(0x5a1010).fillRect(4, 0, 10, 9);                          // le ruban
  g.fillStyle(0xa82a24).fillRect(5, 0, 8, 8).fillStyle(0xd04a3a).fillRect(8, 0, 2, 8);
  g.fillStyle(0x3a2408).fillCircle(9, 16, 8);                            // le disque
  g.fillStyle(0xc89a30).fillCircle(9, 16, 7);
  g.fillStyle(0xe8c050).fillCircle(8, 15, 5);
  g.fillStyle(0x8a6a1a);                                                 // les épées croisées
  for (let k = -3; k <= 3; k++) { g.fillRect(9 + k, 16 + k, 1, 1); g.fillRect(9 - k, 16 + k, 1, 1); }
  g.fillStyle(0xfff0a0).fillRect(9, 11, 1, 1).fillRect(8, 12, 3, 1).fillRect(9, 13, 1, 1);   // l'étoile
  g.fillStyle(0x7a5a18).fillRect(13, 19, 2, 1).fillRect(4, 14, 1, 2);    // l'usure
  g.generateTexture(cle, 18, 25); g.destroy();
  return cle;
}
