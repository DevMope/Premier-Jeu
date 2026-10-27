// (v1.65, la ville des Hobbits en quartiers, chantier 2 : le socle) Le tronçon de démonstration du socle : le cœur du
// quartier de la rue Soucolline, tel que la planche 89 v7 l'a validé, dessiné avec le moteur des quartiers. On y va depuis
// la rue d'avant (la pancarte près de la fontaine) ; le quartier complet viendra au chantier 3.
//   Au milieu, la placette de la Fontaine (sa fontaine à la grenouille), au bord de la rue Soucolline ; au nord, la ruelle
//   du Pommier monte en marches à la rue Haute et au carrefour du Puits, puis l'escalier des Coteaux ; le passage couvert,
//   sous la maison haute, relie aussi les deux rues ; au sud, la placette se prolonge en palier, puis la descente des
//   Marches tombe au bas-quartier, dont on voit les toits en contrebas.
//   Un seul grès pour tout le quartier (pavés pour les chaussées, dalles pour les trottoirs, la placette, les bordures
//   et les marches), et les jonctions de la planche 89 v7 entre les deux tailles.
//   Les passages : à l'est, la rue continue vers l'arche des Mastres (la place des Mastres) ; à l'ouest, vers la forge et
//   le Rempart (on retrouve la rue d'avant) ; la porte de ton comptoir ; et, pas encore faits, la descente des Marches
//   (le bas-quartier), l'escalier des Coteaux, celui du bout de la rue Haute, et le chemin de derrière.
// Les coordonnées sont celles de toute la rue Soucolline de la planche (3900 × 2080) : le tronçon en est un rectangle.

const SOUCO = { W: 3900, H: 2080, YN: 1500, YH: 1060, YA: 2012, E: 1.6, F: 0.8 };
const TRONCON_SOUCO = { x0: 1000, y0: 880, x1: 2860, y1: 2080 };
// la placette, la ruelle du Pommier, l'escalier des Coteaux, la venelle (la descente des Marches), la montée du Four,
// l'escalier du bout de la rue Haute, le passage couvert
const RUES_SOUCO = { PL: { x0: 1420, x1: 2010, y1: 1820 }, RU: { x0: 1524, x1: 1706 }, RH: { x0: 1560, x1: 1670 }, VE: { x0: 1460, x1: 1560 }, FO: { x0: 548, x1: 640 }, RE: { x0: 2640, x1: 2730 }, PC: { x0: 2120, x1: 2186 } };
// Le plan du sol de la rue Soucolline (planche 89 v7) : un code de SOL_VILLE en chaque point du monde
function planSolSoucolline() {
  const Q = SOUCO, YN = Q.YN, YH = Q.YH, { PL, RU, RH, VE, FO, RE, PC } = RUES_SOUCO;
  const code = (X, Y) => {
    const n = (fbm(X * 0.01, Y * 0.01, 8911) - 0.5) * 40;
    if (X >= VE.x0 - 2 && X < VE.x1 + 2 && Y >= PL.y1 - 6 && Y < PL.y1 + 8) return 23;   // le seuil, entre la placette et le palier
    if (X >= PL.x0 && X < PL.x1 && Y >= 1546 && Y < PL.y1) return 20;                     // la placette : les dalles du trottoir, d'un bord à l'autre
    if (Y >= YN && Y < 1745 && X > 330 + n) {
      if (Y < 1540) return 4; if (Y < 1546) return 5;
      if (Y >= 1616 && Y < 1628 && (X < PL.x0 - 34 || X >= PL.x1 + 34)) return 6;
      if (Y < 1700) return 1; if (Y < 1706) return 5; return 4;
    }
    if (X >= VE.x0 - 16 && X < VE.x1 + 16 && Y >= PL.y1 && Y < Q.YA) return Y < PL.y1 + 36 ? 20 : 7;   // le palier, puis les marches
    if (Y >= Q.YA) return 11;   // la ruelle du bas-quartier, au pied des maisons
    if (Y >= 1745) return 9;
    if (Y >= YH && Y < 1196 && X >= FO.x0 && X < 2780) { if (Y < 1090) return 4; if (Y < 1096) return 5; return 16; }   // la rue Haute
    if (X >= RU.x0 && X < RU.x1 && Y >= 1196 && Y < YN) { if (Y >= 1400 && Y < 1450) return 7; if (Y >= 1360 && Y < 1400) return 4; if (Y >= 1196 && Y < 1250) return 7; return 17; }   // la ruelle du Pommier
    if (X >= RH.x0 && X < RH.x1 && Y >= 930 && Y < YH) return 7;   // l'escalier des Coteaux
    if (X >= RH.x0 - 20 && X < RH.x1 + 20 && Y >= 900 && Y < 930) return 4;
    if (X >= PC.x0 && X < PC.x1 && Y >= 1196 && Y < YN) return 17;   // le passage couvert
    if (Math.abs(Y - (1176 - (X - 2780) * 0.25)) < 26 + n * 0.2 && X >= 2700 && X < 3900) return 9;   // le chemin de derrière
    if (X >= RE.x0 && X < RE.x1 && Y >= 900 && Y < YH) return 7;   // l'escalier du bout de la rue Haute
    const chemin = Math.abs(X - (1615 + Math.sin(Y / 90) * 26)) < 40 + n * 0.3 && Y < 940;
    const ch2 = Math.abs(X - (2685 + Math.sin(Y / 70) * 18)) < 30 && Y < 900 && Y > 700;
    if (chemin || ch2) return 9;
    if (X > 1930 && X < 2110 && Y > 900 && Y < 1010 && (Math.floor(Y / 2) % 6) < 3) return 9;   // le potager du jardin du Pommier
    return 8;
  };
  // là où l'on passe le plus (l'hiver, la neige y est tassée) : le milieu des chaussées, la traversée de la placette
  const bande = (v, c, l) => Math.exp(-(((v - c) / l) ** 2));
  return { id: 'soucolline', code, options: {
    pierre: PIERRES_QUARTIERS.soucolline,
    sauf: (X, Y) => X >= VE.x0 - 50 && X < VE.x1 + 50 && Y >= PL.y1 - 10,
    herbeJoints: (X, Y) => (Y < 1520 || (Y > 1700 && Y < 1745) || (Y > 1140 && Y < 1176)) ? 0.22 : ((X > RU.x0 && X < RU.x1) || (X > FO.x0 && X < FO.x1)) && Y < 1500 ? 0.3 : 0,
    passage: (X, Y) => Math.max(bande(Y, 1650, 34), Y > 1100 && Y < 1196 ? bande(Y, 1146, 24) : 0, Y > 1196 && Y < 1820 && X > RU.x0 && X < RU.x1 ? bande(X, 1615, 30) : 0, X > PL.x0 && X < PL.x1 && Y > 1546 && Y < 1800 ? bande(X - (Y - 1546) * 0.4, 1600, 40) * 0.8 : 0),
  } };
}
DECORS_QUARTIERS.soucolline = {
  sousTitre: 'la placette de la Fontaine · le quartier du Comptoir',
  sy: 360,             // (la caméra un peu plus basse que sur la place : on voit les façades, comme sur la planche 89 v7)
  passants: 4,
  entrees: { place: 'arche', rue: 'ouest', defaut: 'arche' },   // (par le plan : on arrive par le passage qui mène d'où l'on vient)
  surLePlan: (x, y) => [MX_PLAN(x), MY_PLAN(y)],
  bornes: TRONCON_SOUCO,
  planSol: planSolSoucolline,
  construire(s, ici) {
    const G = window.GAME, Q = SOUCO, E = Q.E, F = Q.F, YN = Q.YN, YH = Q.YH, saison = ici.saison, pal = ici.pal;
    const B = ici.bornes = { ...this.bornes };
    const { img, poser, ombre, lot, maison } = ici, dans = (x, marge = 300) => x > B.x0 - marge && x < B.x1 + marge;
    creerRueHD(s); creerDecorPlaceHD(s); creerChatRueHD(s); fontaineRue81(s); objetsRue81(s); betes81(s);
    const roux = creerChatHD(s, { pelage: 'roux', yeux: 'vert', collier: 'aucun' }, 'chatRoux81');
    const { PL, RU, RH, VE, FO, RE, PC } = RUES_SOUCO;

    // ===================== 1. le sol : le plan, peint par le moteur de pavage =====================
    ici.sol(this.planSol());

    // ===================== 2. en contrebas : les toits du bas-quartier, le mur de soutènement, le parapet =====================
    { const YA = Q.YA, H0 = { rdc: 54, etage: 40, toit: 36 }, mats = ['tuile', 'ardoiseToit', 'tuile', 'chaume', 'tuile', 'ardoiseToit'], vol = ['voletR', 'voletV', 'voletB', 'voletJ'];
      const rang = (xa, xb, g0) => { let x = xa, n = 0; while (x < xb - 120) { const g = g0 + n, pen = [3, -2, 2, 4, -3][n % 5]; let Lm = 104 + Math.floor(hachage(g, 1, 9620) * 3) * 8, w = (Lm + Math.abs(pen) + 6) * E;
          const reste = xb - x; if (reste - w < 150) { Lm = Math.floor(reste / E) - Math.abs(pen) - 6; w = (Lm + Math.abs(pen) + 6) * E; }
          if (Lm < 70) break;
          if (dans(x + w / 2)) { const o = { ...H0, L: Lm, graine: 60 + g, porte: [0.3, 0.68, 0.5, 0.25, 0.7][n % 5], fenetres: [[0.7], [0.3], [0.25], [0.66], [0.3]][n % 5], penche: pen, volet: vol[n % 4], toitMat: mats[n % 6], linge: n % 4 === 1, pots: n % 3 === 2 };
            const k = vieilleMaison5(s, 'vieille6_' + g, o); img(x + w / 2, YA + 2, k, E); ici.chem(k, x + w / 2, YA + 2); }
          x += w - 4; n++; } };
      rang(340, PL.x0 - 6, 0); rang(PL.x1 + 8, Q.W + 150, 20);
      maison(VE.x1 + 18 + 0.5 * 128 * E, YA, 'basse6a', { L: 128, rdc: 56, etages: [], toit: 30, toitMat: 'tuile', crepi: 'enduitR', fenetres: [], fenetresRdc: [0.25], porte: { x: 0.7, l: 22, h: 46 }, lucarne: null, graine: 81, volet: 'voletB', jardinieres: false });
      maison(VE.x1 + 18 + 128 * E + 0.5 * 134 * E, YA, 'basse6b', { L: 134, rdc: 56, etages: [], toit: 30, toitMat: 'ardoiseToit', crepi: 'enduitO', fenetres: [], fenetresRdc: [0.72], porte: { x: 0.3, l: 24, h: 46, peinte: 'porteVerte' }, lucarne: null, graine: 82, volet: 'voletV', jardinieres: false });
      img(VE.x0 - 40, Q.YA + 4, 'tonneauxHD', E * 0.8);
      // l'ombre bleue du matin, en contrebas (pas sur la descente)
      for (const [a, b] of [[B.x0, VE.x0 - 16], [VE.x1 + 16, B.x1]]) poser(s.add.rectangle(a, 1760, b - a, Q.H - 1760, 0x1a2436, 0.16).setOrigin(0), YA + 3);
      poser(s.add.rectangle(VE.x0 - 16, YA + 12, VE.x1 - VE.x0 + 32, Q.H - YA, 0x1a2436, 0.16).setOrigin(0), YA + 3);
    }
    const parapet = parapet89(s, 'parapet89', 200), soutien = (x0, x1, yb, h) => {
      const g = s.add.graphics(); g.yTri = yb - 1;
      g.fillStyle(0x4e4840).fillRect(x0, yb, x1 - x0, h); g.fillStyle(0x3a3430).fillRect(x0, yb + h - 6, x1 - x0, 6);
      for (let y = yb; y < yb + h - 6; y += 12) for (let x = x0 + ((y - yb) / 12 % 2) * 16; x < x1; x += 32) { g.fillStyle(0x625a50).fillRect(x + 1, y + 1, 30, 10); g.fillStyle(0x746a5e).fillRect(x + 1, y + 1, 30, 2); }
      ici.C.add(g);
    };
    const ligneParapet = (x0, x1, yb) => { x0 = Math.max(x0, B.x0 - 40); x1 = Math.min(x1, B.x1 + 40); if (x1 <= x0) return; soutien(x0, x1, yb, 30); for (let x = x0; x < x1; x += 200 * E) { const l = Math.min(200 * E, x1 - x); poser(s.add.image(x, yb, parapet).setOrigin(0, 1).setScale(E).setCrop(0, 0, l / E, 28), yb); } };
    ligneParapet(330, PL.x0, 1748); ligneParapet(PL.x1, Q.W, 1748);
    ligneParapet(PL.x0, VE.x0 - 16, PL.y1 + 4); ligneParapet(VE.x1 + 16, PL.x1, PL.y1 + 4);
    for (const [x, y0, y1] of [[PL.x0 - 12, 1700, PL.y1 + 4], [PL.x1, 1700, PL.y1 + 4]]) img(x, y0, murLong89(s, 'murLong89_' + (y1 - y0), Math.ceil((y1 - y0) / E)), E, y1, 0, 0);
    // la descente des Marches : deux piliers au bout du parapet, deux murets à couvertine de grès, un garde-corps de fer
    { const l = Math.round((VE.x1 - VE.x0 + 32) / E), h = Math.round((Q.YA - PL.y1 - 6) / E);
      poser(s.add.rectangle(VE.x0, PL.y1 + 8, 12, Q.YA - PL.y1 - 8, 0x2a2018, 0.28).setOrigin(0), PL.y1 + 7);
      poser(s.add.rectangle(VE.x1 - 6, PL.y1 + 8, 6, Q.YA - PL.y1 - 8, 0x2a2018, 0.14).setOrigin(0), PL.y1 + 7);
      img(VE.x0 - 16, PL.y1 + 6, descente6(s, 'descente6', l, h), E, Q.YA + 1, 0, 0);
      for (const x of [VE.x0 - 16 + 7, VE.x1 + 16 - 7]) img(x, PL.y1 + 14, pilier6(s), E, PL.y1 + 14);
      // (le bas-quartier n'est pas encore fait : une barrière de bois en travers du haut des marches, qu'on ôtera)
      img((VE.x0 + VE.x1) / 2, PL.y1 + 44, barrierePlaceHD(s, 5), 1.6, PL.y1 + 44);
    }

    // ===================== 3. la rue Soucolline : les façades du côté nord =====================
    lot(1016, YN, () => { s.add.image(0, 2, 'rueForgeHD_jour').setOrigin(0.5, 1).setScale(2); });
    ici.cheminees.push([1016 + 60, YN - 270]);
    const comptoir = lot(1324, YN, () => { dessinerFacade(s, 0, 0, G ? G.nomShop : undefined, undefined, { fumee: false }); });
    ici.cheminees.push([1324 + 92, YN - 330]);
    img(1180, YN + 34, banc5(s), E); ici.obstacles.push([1180 - 52, YN + 14, 1180 + 52, YN + 36]);
    const rival = lot(1876, YN, () => { dessinerFacadeRival(s, 0, 0, 1); });
    maison(2152, YN, 'mvB89', { L: 140, etages: [48, 46], toit: 50, toitMat: 'ardoiseToit', crepi: 'enduitO', porche: { x: 0.5, l: 34 }, porte: null, fenetres: [[0.2, 0.8], [0.2, 0.5, 0.8]], volet: 'voletR', fleur: 'fleurP2', graine: 5 });
    img(2390, YN - 110, haie89(s, 'haieYsmee89', 150), E, YN - 110);
    ici.arbre(2470, YN - 80, 0);
    ombre(2370, YN + 4, 230); img(2370, YN + 6, tenteYsmee89(s), E); ici.obstacles.push([2370 - 110, YN - 10, 2370 + 110, YN + 8]);
    lot(2480, YN, () => { if (typeof ardoiseMeteo === 'function' && G) ardoiseMeteo(s, 0, 8, G); }, YN + 8);
    const barbier = lot(2615, YN, () => { s.add.image(0, 2, boutiqueBarbierHD(s)).setOrigin(0.5, 1).setScale(2); s.add.image(-112, 2 - 2 * 76, poteauBarbierHD(s, 0)).setScale(2); s.add.image(40, 2 - 2 * 92, enseigneBarbierHD(s)).setScale(2); });
    maison(2819, YN, 'mvC89', { L: 124, etages: [52], toitMat: 'chaume', crepi: 'enduitR', vitrine: { x: 0.36, l: 52 }, porte: { x: 0.78, l: 22, h: 48 }, fenetres: [[0.3, 0.75]], lucarne: 0.55, store: 'storeV', volet: 'voletJ', lierre: true, graine: 9 });
    // les plaques de la rue, clouées à l'angle des maisons
    ici.plaqueSur(comptoir, 'gauche', 132, 'Rue Soucolline', { retrait: 10 }); ici.plaqueSur(barbier, 'droite', 128, 'Rue Soucolline', { retrait: 14 });
    ici.plaqueSur(rival, 'droite', 136, 'Placette de la Fontaine', { retrait: 12 });

    // ===================== 4. la rue Haute : les maisons du côté nord, la cour du Puits, le jardin du Pommier =====================
    maison(1086, YH, 'mvH89', { L: 136, etages: [46, 44], toit: 46, toitMat: 'tuile', crepi: 'enduitC', fenetres: [[0.25, 0.75], [0.25, 0.75]], porte: { x: 0.5, l: 24, h: 50, peinte: 'porteVerte' }, fenetresRdc: [0.2, 0.8], graine: 23, volet: 'voletB', fleur: 'fleurP2' });
    const mD = maison(1418, YH, 'mvD89', { L: 130, etages: [52], toitMat: 'ardoiseToit', crepi: 'enduitB', porte: { x: 0.24, l: 22, h: 48, peinte: 'porteVerte' }, fenetres: [[0.25, 0.68]], fenetresRdc: [0.68], volet: 'voletB', lucarne: 0.4, fleur: 'fleurJ2', graine: 31 });
    maison(1255, YH, 'mvK3', { L: 72, etages: [50], toitMat: 'tuile', crepi: 'enduitR', fenetres: [[0.5]], porte: { x: 0.5, l: 22, h: 48, peinte: 'porteJaune' }, graine: 41, volet: 'voletV', lucarne: null, cheminee: 0.3 });
    img(1856, YH + 28, banc5(s), E); ici.obstacles.push([1856 - 52, YH + 8, 1856 + 52, YH + 30]);
    img(1745, 1150, puits89(s), E); ombre(1745, 1150, 80); ici.obstacles.push({ ellipse: [1745, 1146, 46, 16] });
    { const k = arbrePlaceHD(s, pal, 0, 1478, 1184); poser(s.add.image(1478, 1184, k).setOrigin(0.5, origineArbre(s, k)).setScale(1.7), 1184); ombre(1486, 1184, 96); poser(s.add.rectangle(1478, 1181, 44, 11, 0x8a8070).setStrokeStyle(2, 0x5a5248), 1179); ici.obstacles.push([1478 - 24, 1172, 1478 + 24, 1188]); }
    img(1440, YH + 2, 'buches81', E, YH + 2, 0, 1); img(1456, YH - 28, roux + '_dort0', F, YH + 3, 0.5, 1);
    img(1330, YH + 4, 'panier81', E); img(1394, YH + 4, 'balai81', E).setAngle(-7); img(1350, YH + 8, 'sabots81', E); img(1420, YH + 10, 'bidon81', E); img(1300, YH + 8, 'romarin81', E);
    ici.obstacles.push([1290, YH, 1500, YH + 14]);
    for (const x of [RH.x0 - 10, RH.x1]) img(x, 930, murLong89(s, 'murEsc3', Math.ceil((YH - 930) / E)), E, YH, 0, 0);
    img(RH.x0 - 22, YH + 6, bacFleurs89(s, 'bacFleurs89e', 'fleurR2'), E * 0.7); img(RH.x1 + 22, YH + 6, bacFleurs89(s, 'bacFleurs89f', 'fleurB2'), E * 0.7);
    for (const [a, b] of [[FO.x1, RU.x0], [RU.x1, 2120], [2186, 2780]]) ligneParapet(a, b, 1200);
    const mE = maison(1812, YH, 'mvE89', { L: 120, etages: [50], toitMat: 'chaume', crepi: 'enduitC', porte: { x: 0.3, l: 22, h: 48, peinte: 'porteRouge' }, fenetres: [[0.3, 0.74]], fenetresRdc: [0.72], volet: 'voletV', graine: 33, lierre: true });
    { const yl = YH - 150; img(1524, yl, 'linge81_0', E, YH + 0.5, 0, 0); img(1524 + 62 * E, yl, 'linge81_1', E, YH + 0.5, 0, 0); }
    img(2016, 890, haie89(s, 'haiePommier89', 130), E, 890);
    ici.arbre(2030, 1030, 1, 2.8);
    for (const [x, y] of [[1950, 960], [2090, 990]]) ici.buisson(x, y);
    img(2016, YH + 4, murJardin89(s, 'murJardin89', 130), E);
    ici.plaque(1590, 1196, 'Ruelle du Pommier', { yTri: 1201 });
    maison(2230, YH, 'mvI89', { L: 130, etages: [52], toitMat: 'ardoiseToit', crepi: 'enduitO', fenetres: [[0.25, 0.72]], porte: { x: 0.72, l: 22, h: 48, peinte: 'porteJaune' }, fenetresRdc: [0.28], lucarne: 0.5, graine: 24, volet: 'voletV' });
    const mJ = maison(2440, YH, 'mvJ89', { L: 120, etages: [50], toitMat: 'tuile', crepi: 'enduitR', fenetres: [[0.3, 0.7]], porte: { x: 0.3, l: 22, h: 48 }, fenetresRdc: [0.72], graine: 25, volet: 'voletB', lierre: true });
    ici.plaqueSur(mD, 'gauche', 112, 'Rue Haute', { retrait: 12 }); ici.plaqueSur(mJ, 'droite', 104, 'Rue Haute', { retrait: 12 });
    ici.plaqueSur(mE, 'droite', 116, 'Carrefour du Puits', { retrait: 12 });
    ici.arbre(2580, YH - 10, 0); ici.buisson(2780, YH + 10); ici.arbre(2840, YH - 30, 1);
    for (const [x, y, v] of [[1040, 900, 1], [2300, 920, 0], [2860, 900, 1]]) ici.arbre(x, y, v);

    // ===================== 5. la placette de la Fontaine, sa fontaine à la grenouille =====================
    { const fx = 1860, fy = 1728;
      lot(fx, fy, () => {
        const F8 = FONT81, E2 = 2, X = px => -F8.L + px * E2, Y = py => -F8.H * E2 + py * E2;
        s.add.ellipse(0, -2, F8.L * E2, 16, 0x000000, 0.25);
        s.add.image(0, 0, 'fontaineRue81_bas').setOrigin(0.5, 1).setScale(E2);
        const ex = 0, ey = Y(F8.rebordY + 1.2), rx = (F8.eauRx - 1) * E2, ry = (F8.eauRy - 0.8) * E2;
        for (let k = 0; k < 3; k++) s.add.image(ex - rx * (0.4 - k * 0.35), ey - ry * 0.4 + k * ry * 0.45, 'poisson81_' + (k % 2)).setAlpha(0.85).setFlipX(k === 1);
        s.add.ellipse(ex, ey, rx * 2, ry * 2, saison === 'givre' ? 0xb8d0e0 : 0x4aa0c8, saison === 'givre' ? 0.75 : 0.45);
        s.add.ellipse(ex - rx * 0.3, ey - ry * 0.3, rx, ry * 0.5, 0xd8f4ff, 0.2).setBlendMode(Phaser.BlendModes.ADD);
        s.add.image(0, ey + 8, grenouille3(s)).setOrigin(0.5, 1).setScale(E2);
        for (const [dx, dy, cle] of [[-62, 2, 'nenuphar81a'], [-44, 6, 'nenuphar81b'], [58, -2, 'nenuphar81a']]) s.add.image(ex + dx, ey + dy, cle).setScale(E2);
        if (saison !== 'givre') s.add.image(ex - 61, ey - 1, 'fleurNenuphar81').setScale(E2);
        // l'eau que crache la grenouille : un arc de gouttes qui tombent vraiment, et les ronds là où elles touchent l'eau
        if (saison !== 'givre') { const mx = 20, my = ey - 30, N = 9;
          for (let i = 1; i <= N; i++) { const gtt = s.add.circle(mx, my, 1.7, 0xd8f4ff, 0.95), u0 = i / N;
            s.tweens.addCounter({ from: 0, to: 1, duration: 700, repeat: -1, delay: u0 * 700, onUpdate: tw => { const u = tw.getValue(); gtt.setPosition(mx + 46 * u, my - Math.sin(u * Math.PI) * 12 + (ey + 2 - my) * u * u); } }); }
          const rond = s.add.ellipse(mx + 46, ey + 2, 14, 3).setStrokeStyle(1, 0xe8fcff, 0.7);
          s.tweens.add({ targets: rond, scaleX: 1.8, scaleY: 1.6, alpha: 0, duration: 900, repeat: -1 }); }
        s.add.image(X(18), Y(70), 'potGeranium81').setOrigin(0.5, 1).setScale(E2);
        s.add.image(132, 8, 'seau81').setOrigin(0.5, 1).setScale(E2);
        s.add.image(X(97), Y(71.5), 'pigeon81_boit').setOrigin(0.5, 1);
        s.add.image(168, 14, 'pigeon81_picore').setOrigin(0.5, 1); s.add.image(196, 10, 'pigeon81_debout').setOrigin(0.5, 1).setFlipX(true);
        s.add.image(-168, 10, 'chatRue_assis0').setOrigin(0.5, 1);
        if (saison !== 'givre') { s.add.image(X(18), Y(58), 'papillon81_citron0'); s.add.image(X(118), Y(64), 'papillon81_paon0'); s.add.image(ex - 66, ey - 20, 'libellule81_0'); }
      }, fy);
      ici.obstacles.push({ ellipse: [fx, fy - 12, 112, 22] }, [fx + 96, fy - 6, fx + 120, fy + 10], [fx - 150, fy - 6, fx - 120, fy + 10]);
    }
    // les grilles d'égout, là où le caniveau s'arrête au bord de la placette
    for (const gx of [PL.x0 - 34, PL.x1 + 4]) { const gg = s.add.graphics(); gg.yTri = 1617; gg.fillStyle(0x1a1818).fillRect(gx, 1614, 30, 16).fillStyle(0x4a4a50).fillRect(gx + 1, 1615, 28, 14); for (let k = 0; k < 6; k++) gg.fillStyle(0x0c0c10).fillRect(gx + 3 + k * 4.4, 1617, 2.4, 10); gg.fillStyle(0x7a7a84).fillRect(gx + 1, 1615, 28, 1.5); ici.C.add(gg); }
    img(1700, 1790, 'pigeon81_picore', F); img(1722, 1796, 'pigeon81_debout', F).setFlipX(true); img(1560, 1560, bacFleurs89(s, 'bacFleurs89d', 'fleurJ2'), E * 0.8);
    for (const x of [1436, 1994]) { img(x, PL.y1 - 10, 'reverbereHD', E); ici.obstacles.push([x - 10, PL.y1 - 18, x + 10, PL.y1 - 4]); }
    img(1700, PL.y1 - 2, bacFleurs89(s, 'bacFleurs89c', 'fleurR2'), E * 0.8);
    img(1540, 1392, bacFleurs89(s, 'bacFleurs89a', 'fleurP2'), E * 0.8); img(1690, 1392, bacFleurs89(s, 'bacFleurs89b', 'fleurJ2'), E * 0.8);
    ici.obstacles.push([1540 - 30, 1380, 1540 + 30, 1396], [1690 - 30, 1380, 1690 + 30, 1396], [1560 - 28, 1548, 1560 + 28, 1564], [1700 - 28, PL.y1 - 14, 1700 + 28, PL.y1 + 2]);

    // ===================== 6. les réverbères, les bancs, les bêtes, l'herbe au pied des murs =====================
    for (const x of [1104, 2044, 2512]) { img(x, YN + 26, 'reverbereHD', E); ici.obstacles.push([x - 10, YN + 16, x + 10, YN + 30]); }
    for (const x of [1180, 2160, 2760]) { img(x, 1742, 'reverbereHD', E); ici.obstacles.push([x - 10, 1730, x + 10, 1748]); }
    img(RH.x1 + 8, YH + 4, 'reverbereHD', E);
    img(2512 + 4, YN + 26 - 172 * 0.8, 'moineau81_pose', F, YN + 27);
    for (const [x, y, k, fl] of [[2300, 1662, 'pigeon81_picore', false], [2322, 1672, 'pigeon81_debout', true], [1180, 1130, 'pigeon81_picore', true]]) img(x, y, k, F).setFlipX(fl);
    img(2240, YN + 34, banc5(s), E); ici.obstacles.push([2240 - 52, YN + 14, 2240 + 52, YN + 36]);
    if (saison !== 'givre') {
      for (const [x, k] of [[1166, 'touffe81'], [1712, 'touffe81'], [2514, 'pissenlit81'], [2716, 'touffe81'], [1528, 'touffe81'], [1702, 'pissenlit81']]) img(x, YN + 4, k, F);
      for (const [x, k] of [[1530, 'pissenlit81'], [1712, 'touffe81'], [2110, 'touffe81'], [2550, 'pissenlit81']]) img(x, YH + 4, k, F);
    }

    // ===================== 7. où l'on marche, les zones nommées, les passages =====================
    const entre = (v, a, b) => v >= a && v < b;
    ici.marchable = (x, y) =>
      entre(y, YN + 8, 1742) ||                                                                             // la rue Soucolline (jusqu'au parapet)
      (entre(x, PL.x0 + 10, PL.x1 - 10) && entre(y, 1540, PL.y1 - 4)) ||                                    // la placette
      (entre(x, VE.x0, VE.x1) && entre(y, PL.y1 - 4, PL.y1 + 38)) ||                                        // le palier (jusqu'à la barrière)
      (entre(x, RU.x0 + 8, RU.x1 - 8) && entre(y, 1190, YN + 10)) ||                                        // la ruelle du Pommier
      (entre(x, PC.x0 + 6, PC.x1 - 6) && entre(y, 1190, YN + 10)) ||                                        // le passage couvert
      (entre(y, YH + 10, 1194) && entre(x, FO.x0, 2790)) ||                                                 // la rue Haute
      (x >= 2700 && Math.abs(y - (1176 - (x - 2780) * 0.25)) < 22) ||                                       // le chemin de derrière
      (entre(x, RH.x0 + 6, RH.x1 - 6) && entre(y, 905, YH + 12)) ||                                         // l'escalier des Coteaux
      (entre(x, RE.x0 + 6, RE.x1 - 6) && entre(y, 905, YH + 12));                                           // l'escalier du bout de la rue Haute
    ici.zones.push(
      { nom: 'La placette de la Fontaine', dedans: (x, y) => entre(x, PL.x0, PL.x1) && entre(y, 1590, PL.y1 + 40) },
      { nom: 'Le carrefour du Puits', dedans: (x, y) => entre(x, 1500, 1990) && entre(y, YH, 1200) },
      { nom: 'La ruelle du Pommier', dedans: (x, y) => entre(x, RU.x0, RU.x1) && entre(y, 1200, YN) },
      { nom: 'La rue Haute', dedans: (x, y) => entre(y, 900, 1200) },
      { nom: 'La rue Soucolline', dedans: (x, y) => entre(y, YN - 300, 1760) },
    );
    ici.passages.push(
      { id: 'arche', nom: 'La place des Mastres ▶', sous: 'par l’arche des Mastres', type: 'bord', devant: [2826, 1640], dehors: [2930, 1640], zone: [2770, YN, B.x1, 1748], pousser: [1, 0], vers: { quartier: 'place', arrivee: 'arche' } },
      { id: 'ouest', nom: '◀ La rue Soucolline', sous: 'vers la forge et le Rempart', type: 'bord', devant: [1034, 1640], dehors: [930, 1640], zone: [B.x0, YN, 1090, 1748], pousser: [-1, 0], vers: { scene: 'Rue', arrivee: 'ouest' } },
      { id: 'comptoir', nom: G ? G.nomShop : 'Ton comptoir', sous: 'ta porte', verbe: 'rentrer chez toi', type: 'porte', devant: [1354, YN + 22], dehors: [1354, YN - 4], zone: [1300, YN, 1410, YN + 60], pousser: [0, -1], vers: { scene: 'Nuit', donnees: { matin: true } } },
      { id: 'marches', nom: 'Le bas-quartier ▼', sous: 'la descente des Marches', type: 'escalier', devant: [1510, PL.y1 + 24], dehors: [1510, PL.y1 + 70], zone: [VE.x0 - 10, PL.y1 - 10, VE.x1 + 10, PL.y1 + 44], pousser: [0, 1],
        bientot: 'La descente des Marches mène au bas-quartier : une barrière en ferme le haut, on refait les marches. On y descendra bientôt.' },
      { id: 'coteaux', nom: 'Les Coteaux ▲', sous: 'l’escalier des Coteaux', type: 'escalier', devant: [1615, 920], dehors: [1615, 870], zone: [RH.x0, 900, RH.x1, 970], pousser: [0, -1],
        bientot: 'L’escalier monte aux Coteaux et à leurs portes rondes. Le quartier n’est pas encore fait : on y montera bientôt.' },
      { id: 'escalierHaut', nom: 'Les Coteaux ▲', sous: 'l’escalier du bout de la rue Haute', type: 'escalier', devant: [2685, 920], dehors: [2685, 870], zone: [RE.x0, 900, RE.x1, 970], pousser: [0, -1],
        bientot: 'Cet escalier monte aussi aux Coteaux. On y montera bientôt.' },
      { id: 'chemin', nom: 'Le chemin de derrière ▶', sous: 'vers la place des Mastres', type: 'bord', devant: [2826, 1164], dehors: [2930, 1140], zone: [2780, 1090, B.x1, 1200], pousser: [1, 0],
        bientot: 'Le chemin de derrière longe les jardins jusqu’à la place des Mastres. Il viendra avec le quartier complet ; pour la place, prends la rue.' },
    );
    // d'où l'on arrive quand on vient de la rue d'avant (par la pancarte de la fontaine) : devant la placette
    ici.arrivees.rue = { x: 1880, y: 1600, vers: [1880, 1660], vue: 'face' };
    ici.arrivees.defaut = { x: 1700, y: 1650, vue: 'face' };
    ici.pointsPassants = [[1200, 1640], [1500, 1660], [1760, 1600], [2000, 1680], [2400, 1640], [2700, 1660], [1615, 1300], [1615, 1150], [1300, 1140], [2000, 1150], [2400, 1140], [1700, 1780], [1520, 1700]];
  },
};
