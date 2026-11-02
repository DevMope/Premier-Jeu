// (v1.65, la ville des Hobbits en quartiers) Le quartier de la rue Soucolline, tel que la planche 89 v7 l'a validé, dessiné
// avec le moteur des quartiers. Chantier 2 : un tronçon de démonstration (le cœur du quartier). Chantier 3 : la rue entière,
// le vrai quartier du comptoir, qui remplace la rue d'avant (RueScene, de côté) et la montre par la scène « Rue ».
//   D'ouest en est, côté nord de la rue Soucolline : au bord du chemin du Rempart, le terrain de la Confrérie (l'hospice et la
//   chapelle, quand on les a bâtis) ; les Pommeroy ; la montée du Four, qui monte à la rue Haute ; l'impasse du Corbeau (et
//   sa porte dérobée, certains soirs : l'entrée du marché noir reste où elle était, jusqu'au chantier 4) ; la forge de
//   Thorgal ; le banc ; ton comptoir ; la ruelle du Pommier ; la maison du paon ; la maison haute ; la tente de Madame Ysmée
//   et son ardoise ; le Fil d'Argent, la boutique d'Orvin ; le lot des Mages-Charpentiers ; la Banque Centrale Goyenne ; le
//   porche de la place des Mastres (l'arche des Mastres).
//   Au milieu, la placette de la Fontaine (sa fontaine à la grenouille), au bord de la rue Soucolline ; au nord, la ruelle
//   du Pommier monte en marches à la rue Haute et au carrefour du Puits, puis l'escalier des Coteaux (c'est le seul chemin
//   entre les deux rues avec la montée du Four : la maison haute est une façade comme les autres, sans passage) ; au sud, la
//   placette se prolonge en palier, puis la descente des Marches tombe au bas-quartier, dont on voit les toits en contrebas.
//   Un seul grès pour tout le quartier (pavés pour les chaussées, dalles pour les trottoirs, la placette, les bordures
//   et les marches), et les jonctions de la planche 89 v7 entre les deux tailles.
//   Les passages : le porche de la place des Mastres ; la porte de ton comptoir ; celles de la banque, du barbier, des Mages,
//   la tente d'Ysmée ; et, pas encore faits, la descente des Marches (le bas-quartier), l'escalier des Coteaux, celui du bout
//   de la rue Haute, le chemin de derrière et le chemin du Rempart.
//   Le soir (la promenade, s.nuit) : la même rue, sous un voile de nuit ; les réverbères et les fenêtres éclairent ; la porte
//   dérobée de l'impasse, la lueur de la fontaine sous le porche, la banque ; le banc où s'asseoir, le chat de gouttière.
// Les coordonnées sont celles de toute la rue Soucolline de la planche (3900 × 2080), prolongée à l'ouest jusqu'au terrain
// de la Confrérie.

const SOUCO = { W: 3900, H: 2080, YN: 1500, YH: 1060, YA: 2012, E: 1.6, F: 0.8 };
const BORNES_SOUCO = { x0: -330, y0: 880, x1: 3900, y1: 2080 };
const TRONCON_SOUCO = { x0: 1000, y0: 880, x1: 2860, y1: 2080 };   // (le tronçon du chantier 2, pour mémoire)
// la placette, la ruelle du Pommier, l'escalier des Coteaux, la venelle (la descente des Marches), la montée du Four,
// l'escalier du bout de la rue Haute
const RUES_SOUCO = { PL: { x0: 1420, x1: 2010, y1: 1820 }, RU: { x0: 1524, x1: 1706 }, RH: { x0: 1560, x1: 1670 }, VE: { x0: 1460, x1: 1560 }, FO: { x0: 548, x1: 640 }, RE: { x0: 2640, x1: 2730 } };
// les lots du côté nord de la rue Soucolline (le centre de chaque façade ; le plan de la ville, planVilleHD.js, les reprend)
// (Q161) la maison du paon avant son arrivée : la même façade, vide (rivalHD.js : creerFacadeRivalHD), ses vitres éteintes
const MAISON_PAON_VIDE = { nom: 'vide', vide: true, rampes: { vitreBleue: [0x10141a, 0x1a2028, 0x283039, 0x3a4450, 0x56626e, 0x7c8894] } };
const LOTS_SOUCO = { confrerie: -130, pommeroy: 420, impasse: 757, forge: 1016, banc: 1180, comptoir: 1324, paon: 1876, maisonHaute: 2152, tente: 2370, ardoise: 2480, barbier: 2615, maisonC: 2819, mages: 3049, banque: 3340, arche: 3640 };
// (retours du 01/11, phase 1) la chaussée : 'grille' (les petits pavés en grille, jugés trop serrés), ou un essai de pavés
// ronds et gris comme la rue d'avant : 'rangs' (en rangées) ou 'galets' (posés sans rangées). Avec eux, une vraie rigole de
// pierre et d'eau, un peu plus large. (window.CHAUSSEE_ESSAI : pour comparer les variantes sur les captures)
const CHAUSSEE_SOUCOLLINE = 'rangs';
function chausseeSoucolline() { return (typeof window !== 'undefined' && window.CHAUSSEE_ESSAI) || CHAUSSEE_SOUCOLLINE; }
// (Q170) le caniveau n'est plus au milieu de la chaussée : collé à son bord bas ('bas', le long du trottoir sud, côté caméra)
// ou à son bord haut ('haut', au pied du trottoir nord). (window.RIGOLE_ESSAI : pour comparer sur les captures)
const RIGOLE_SOUCOLLINE = 'bas';
function rigoleSoucolline() { const r = (typeof window !== 'undefined' && window.RIGOLE_ESSAI) || RIGOLE_SOUCOLLINE; return r === 'haut' ? [1548, 1568] : r === 'milieu' ? [1612, 1632] : [1678, 1698]; }
// Le plan du sol de la rue Soucolline (planche 89 v7) : un code de SOL_VILLE en chaque point du monde
function planSolSoucolline() {
  const Q = SOUCO, YN = Q.YN, YH = Q.YH, { PL, RU, RH, VE, FO, RE } = RUES_SOUCO, ch = chausseeSoucolline(), rg = ch === 'grille' ? [1616, 1628] : rigoleSoucolline();
  const code = (X, Y) => {
    const n = (fbm(X * 0.01, Y * 0.01, 8911) - 0.5) * 40;
    if (X >= VE.x0 - 2 && X < VE.x1 + 2 && Y >= PL.y1 - 6 && Y < PL.y1 + 8) return 23;   // le seuil, entre la placette et le palier
    if (X >= PL.x0 && X < PL.x1 && Y >= 1546 && Y < PL.y1) return 20;                     // la placette : les dalles du trottoir, d'un bord à l'autre
    if (Y >= YN && Y < 1745 && X > 330 + n) {
      if (Y < 1540) return 4; if (Y < 1546) return 5;
      if (Math.abs(X - 3640) < 90 && Y < 1700) return 20;   // (Q169) le seuil du porche : les grandes dalles, qui font la liaison avec la place
      if (Y >= rg[0] && Y < rg[1] && (X < PL.x0 - 34 || X >= PL.x1 + 34) && X > 380) return 6;
      if (Y < 1700) return 1; if (Y < 1706) return 5; return 4;
    }
    // (chantier 3) le chemin du Rempart : la rue Soucolline finit à l'ouest en terre battue, devant le terrain de la Confrérie
    if (Y >= YN - 4 + n * 0.15 && Y < 1745 && X <= 330 + n) return 9;
    if (X >= VE.x0 - 16 && X < VE.x1 + 16 && Y >= PL.y1 && Y < Q.YA) return Y < PL.y1 + 36 ? 20 : 7;   // le palier, puis les marches
    if (Y >= Q.YA) return 11;   // la ruelle du bas-quartier, au pied des maisons
    if (Y >= 1745) return 9;
    if (Y >= YH && Y < 1196 && X >= FO.x0 - 4 + n * 0.7 && X < 2810) {   // la rue Haute ; au bout, à l'est, ses pierres se perdent dans l'herbe et le chemin de terre
      if (X > 2690 && fbm(X * 0.02, Y * 0.03, 8913) > (2810 - X) / 120) return Math.abs(Y - (1176 - (X - 2780) * 0.25)) < 26 + n * 0.2 ? 9 : 8;
      if (Y < 1090) return 4; if (Y < 1096) return 5; return 16; }
    if (X >= RU.x0 && X < RU.x1 && Y >= 1196 && Y < YN) { if (Y >= 1400 && Y < 1450) return 7; if (Y >= 1360 && Y < 1400) return 4; if (Y >= 1196 && Y < 1250) return 7; return 17; }   // la ruelle du Pommier
    // (chantier 3) la montée du Four : des pavés de ruelle, une volée de marches en haut, une autre en bas (l'angle de la planche)
    if (X >= FO.x0 && X < FO.x1 && Y >= 1196 && Y < YN) { if (Y < 1236 || (Y >= 1440 && Y < 1472)) return 7; return 17; }
    if (X >= RH.x0 && X < RH.x1 && Y >= 930 && Y < YH) return 7;   // l'escalier des Coteaux
    if (X >= RH.x0 - 20 && X < RH.x1 + 20 && Y >= 900 && Y < 930) return 4;
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
  return { id: 'soucolline3' + ch + rg[0], code, options: {
    pierre: PIERRES_QUARTIERS.soucolline, chaussee: ch, rigole: ch === 'grille' ? 'plate' : 'pierre',
    sauf: (X, Y) => X >= VE.x0 - 50 && X < VE.x1 + 50 && Y >= PL.y1 - 10,
    // (Q198-2, vue de haut) les trottoirs comme un plan : la bordure du nord jette une marche d'ombre sur la chaussée, le pied
    // de celle du sud est dans l'ombre (toute la rue, sauf la placette)
    ombreSol: (X, Y) => (X >= PL.x0 && X < PL.x1) ? 0 : Y >= 1546 && Y < 1550 ? -2 : Y >= 1550 && Y < 1553 ? -1 : Y >= 1697 && Y < 1700 ? -1 : 0,
    herbeJoints: (X, Y) => (Y < 1520 || (Y > 1700 && Y < 1745) || (Y > 1140 && Y < 1176)) ? 0.22 : ((X > RU.x0 && X < RU.x1) || (X > FO.x0 && X < FO.x1)) && Y < 1500 ? 0.3 : 0,
    passage: (X, Y) => Math.max(bande(Y, 1650, 34), Y > 1100 && Y < 1196 ? bande(Y, 1146, 24) : 0, Y > 1196 && Y < 1820 && X > RU.x0 && X < RU.x1 ? bande(X, 1615, 30) : 0, Y > 1196 && Y < 1500 && X > FO.x0 && X < FO.x1 ? bande(X, 594, 22) : 0, X > PL.x0 && X < PL.x1 && Y > 1546 && Y < 1800 ? bande(X - (Y - 1546) * 0.4, 1600, 40) * 0.8 : 0),
  } };
}

// Les mots de la rue d'avant (RueScene, v0.65 à v1.64), repris tels quels : ce qu'on lit en regardant chaque maison
function texteDeLaRue(quoi, G, nuit) {
  const jour = !nuit, H = Phaser.Utils.Array.GetRandom;
  switch (quoi) {
    case 'pommeroy': return jour ? 'Madame Pommeroy bat ses tapis à la fenêtre. Elle te salue d\'un hochement de tête.' : H(['La maison des Pommeroy. Leur chien ronfle derrière la porte.', 'Une bougie veille chez la vieille Berthe Pommeroy. Elle tricote, comme chaque soir.']);
    case 'impasse': return nuit && marcheNoirCeSoir(G) ? "Une lanterne rouge brûle au fond de l'impasse du Corbeau. La porte dérobée est ouverte ce soir..." : jour ? "L'impasse du Corbeau. Même en plein jour, le fond reste dans l'ombre." : G.visiteMarcheNoir !== undefined ? "L'impasse est noire. La lanterne rouge est éteinte ce soir." : "Une impasse si sombre qu'on n'en voit pas le fond. On dit qu'une porte basse s'y ouvre, certains soirs.";
    case 'forge': return jour ? 'Le marteau de Thorgal sonne sur l\'enclume. Pour lui acheter quelque chose, c\'est à son étal, sur la place.' : "La forge de Thorgal. Les braises rougeoient encore derrière les vantaux ; on l'entend ronfler à l'étage.";
    case 'comptoir': return `${G.nomShop}, ton comptoir. ${['Une humble chaumière', 'Une jolie maison', 'Une belle maison', 'La plus belle maison du village'][niveauFacade(G)]}.`;
    case 'brindeloup': return jour ? 'Le petit Brindeloup te regarde passer : il rêve de partir à l\'aventure.' : H(["Chez les Brindeloup. On s'y dispute à voix basse : l'aîné veut partir à l'aventure.", 'Les volets sont clos chez les Brindeloup. Tout le monde dort.']);
    case 'fontaine': return jour ? 'La fontaine chante. Pour y jeter une pièce, c\'est celle de la place des Mastres.' : 'La fontaine murmure dans la nuit. Au fond du bassin, des pièces luisent sous la lune.';
    case 'banque': return jour ? 'La Banque Centrale Goyenne. Des nains en redingote montent les marches, un registre sous le bras.' : 'La Banque Centrale Goyenne. Une lumière brûle encore : les nains comptent, même la nuit.';
    default: return null;
  }
}

// (Q252) où pend la plaque « Rue Soucolline » de la banque : 'poteau' (conseillé : à l'angle est, devant la palissade du porche, elle ne couvre rien) ou 'reverbere'
const PLAQUE_BANQUE = 'poteau';
// (Q258) le zoom de la rue : 1,25 avant (comme la place) ; la caméra recule pour qu'on voie les toits et les façades en marchant
const ZOOM_RUE = 1.0;
function zoomRue() { return (typeof window !== 'undefined' && window.ZOOM_RUE) || ZOOM_RUE; }
function plaqueBanque() { return (typeof window !== 'undefined' && window.PLAQUE_BANQUE) || PLAQUE_BANQUE; }
DECORS_QUARTIERS.soucolline = {
  sy: 320,             // (la caméra un peu plus basse que sur la place : on voit les façades, comme sur la planche 89 v7)
  // (retours du joueur) la hauteur de la caméra selon où l'on est : où se tient JeuneGoy à l'écran (ses pieds, moins 50).
  // Contre les façades du nord d'une rue, il est bas à l'écran : on voit le haut des maisons ; en descendant vers le sud (le
  // milieu de la chaussée, la placette, le palier), il remonte à l'écran : la vue descend, plus près du sol. Entre deux
  // repères, on glisse d'une hauteur à l'autre (la caméra, elle, suit en douceur : jamais d'à-coup).
  cameraY(y) {
    const R = [[1060, 378], [1200, 318], [1330, 340], [1505, 378], [1600, 352], [1700, 312], [1790, 282], [1860, 268]];
    const d = zoomRue() < 1.2 ? 40 : 0;   // (Q258 : la caméra recule ; JeuneGoy se tient un peu plus bas à l'écran, on voit les toits)
    if (y <= R[0][0]) return R[0][1] + d;
    for (let i = 1; i < R.length; i++) if (y <= R[i][0]) { const [y0, a] = R[i - 1], [y1, b] = R[i], u = (y - y0) / (y1 - y0), w = u * u * (3 - 2 * u); return a + (b - a) * w + d; }
    return R[R.length - 1][1] + d;
  },
  get zoom() { return zoomRue(); },
  passants: 5,
  // (par le plan : on arrive par le passage qui mène d'où l'on vient ; de chez soi, par sa porte)
  entrees: { place: 'arche', etang: 'arche', maison: 'comptoir', defaut: 'arche' },
  surLePlan: (x, y) => [MX_PLAN(Math.max(-120, x)), MY_PLAN(y)],
  bornes: BORNES_SOUCO,
  planSol: planSolSoucolline,
  construire(s, ici) {
    const G = window.GAME, Q = SOUCO, E = Q.E, F = Q.F, YN = Q.YN, YH = Q.YH, saison = ici.saison, pal = ici.pal, nuit = !!s.nuit, jour = !nuit, L = LOTS_SOUCO;
    const B = ici.bornes = { ...this.bornes };
    const { img, poser, ombre, lot } = ici, dans = (x, marge = 300) => x > B.x0 - marge && x < B.x1 + marge;
    // (vue de haut, validée sur le barbier et la maison haute : maisonVolumeHD.js) toutes les maisons de ville en un seul volume,
    // sous leur toit en croupe ; au pied de chaque façade, son ombre de contact sur le trottoir
    const contactA = (x, y, l) => poser(s.add.image(x, y + 2, ombreContactMaisonHD(s, l, 7)).setOrigin(0.5, 0).setScale(E), y - 0.5), contact = (x, l) => contactA(x, YN, l);
    const maison = (x, y, cle, o) => { const im = ici.maison(x, y, cle + 'V', { ...o, volume: true }); contactA(x, y, o.L || 136); return im; };
    creerRueHD(s); creerDecorPlaceHD(s); creerChatRueHD(s); fontaineRue81(s); objetsRue81(s); betes81(s);
    const roux = creerChatHD(s, { pelage: 'roux', yeux: 'vert', collier: 'aucun' }, 'chatRoux81');
    const { PL, RU, RH, VE, FO, RE } = RUES_SOUCO;
    const temps = G && typeof meteoDu === 'function' ? meteoDu(G) : 'soleil', mouille = ['pluie', 'orage', 'neige'].includes(temps);
    const lampe = (x, y) => { img(x, y, 'reverbereHD', E); ici.lumiere(x, y - 124, 96, 0xffb050, 18); };
    const betes = [];   // (Q165) tout ce qui vit, et s'anime : vieDesBetesSoucolline
    const regarder = (quoi, cadre, devant) => ici.regarder(...cadre, () => texteDeLaRue(quoi, G, nuit), devant);
    s.lieuxRue = {};

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
      // l'ombre bleue du matin, en contrebas (pas sur la descente) ; à l'ouest, au-delà du parapet, la pente de terre
      for (const [a, b] of [[330, VE.x0 - 16], [VE.x1 + 16, B.x1]]) poser(s.add.rectangle(a, 1760, b - a, Q.H - 1760, 0x1a2436, 0.16).setOrigin(0), YA + 3);
      poser(s.add.rectangle(VE.x0 - 16, YA + 12, VE.x1 - VE.x0 + 32, Q.H - YA, 0x1a2436, 0.16).setOrigin(0), YA + 3);
    }
    const parapet = parapet89(s, 'parapet89', 200), soutien = (x0, x1, yb, h) => {
      const g = s.add.graphics(); g.yTri = yb - 1;
      g.fillStyle(0x4e4840).fillRect(x0, yb, x1 - x0, h); g.fillStyle(0x3a3430).fillRect(x0, yb + h - 6, x1 - x0, 6);
      for (let y = yb; y < yb + h - 6; y += 12) for (let x = x0 + ((y - yb) / 12 % 2) * 16; x < x1; x += 32) { g.fillStyle(0x625a50).fillRect(x + 1, y + 1, 30, 10); g.fillStyle(0x746a5e).fillRect(x + 1, y + 1, 30, 2); }
      ici.C.add(g);
    };
    // (piliers : un pilier de grès à boule à chaque bout du parapet qui s'arrête, à une ouverture ou au bout de la rue)
    const ligneParapet = (x0, x1, yb, piliers = false) => { const p0 = x0 >= B.x0 - 40, p1 = x1 <= B.x1 + 40; x0 = Math.max(x0, B.x0 - 40); x1 = Math.min(x1, B.x1 + 40); if (x1 <= x0) return; soutien(x0, x1, yb, 30); for (let x = x0; x < x1; x += 200 * E) { const l = Math.min(200 * E, x1 - x); poser(s.add.image(x, yb, parapet).setOrigin(0, 1).setScale(E).setCrop(0, 0, l / E, 28), yb); }
      if (piliers) for (const [x, ok] of [[x0 + 8, p0], [x1 - 8, p1]]) if (ok) { img(x, yb + 10, pilier6(s), E, yb + 10); ici.obstacles.push([x - 12, yb - 4, x + 12, yb + 12]); } };
    ligneParapet(330, PL.x0, 1748, true); ligneParapet(PL.x1, Q.W, 1748);
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

    // ===================== 3. la rue Soucolline : les façades du côté nord, d'ouest en est =====================
    // --- le terrain de la Confrérie, au bord du chemin du Rempart : vague au début ; l'hospice et la chapelle s'y bâtissent
    //     (planche 52 ; les dessins et les écriteaux de la rue d'avant, l'hospice à gauche, la chapelle à droite) ---
    if (typeof creerConfrerieHD === 'function') {
      creerConfrerieHD(s);
      const bati = id => typeof confrerieA === 'function' && confrerieA(G, id), XC = L.confrerie, DC = 345;   // (345 : l'écart des deux bâtisses dans la rue d'avant)
      const cf = lot(XC, YN, () => {
        for (const [id, cle, dx] of [['hospice', 'rueHospiceHD', 0], ['chapelle', jour ? 'rueChapelleHD_jour' : 'rueChapelleHD', DC]]) {
          if (bati(id)) s.add.image(dx, 2, cle).setOrigin(0.5, 1).setScale(2);
          else s.add.image(dx, 4, 'terrainConfrerie').setOrigin(0.5, 1).setScale(1.15, 2);
        }
        if (!bati('hospice') || !bati('chapelle')) ecriteauRue(s, bati('hospice') ? DC : 170, -70, 'Terrain de la Confrérie', { taille: 10, fond: '#b8c8e0' });
        if (bati('hospice')) ecriteauRue(s, -90, -104, 'Hospice de la Confrérie', { taille: 10 });
        if (bati('chapelle')) ecriteauRue(s, DC, -194, 'CHAPELLE DU REMPART', { taille: 11, grave: true });
      });
      const xh = XC, xc = XC + DC * F;
      const quoi = () => !bati('hospice') ? (confrerieOuverte(G) ? "Un terrain vague, une palissade. La Confrérie du Dernier Rempart cherche un donateur pour y bâtir un hospice (le soir : « La Confrérie »)." : 'Un terrain vague. On dit que la Confrérie voudrait y bâtir quelque chose, si quelqu\'un payait.')
        : jour ? "L'hospice de la Confrérie. La sœur Aveline étend des draps propres ; un blessé prend le soleil sur le banc." : "L'hospice de la Confrérie. Une bougie veille à chaque fenêtre de l'étage.";
      ici.regarder(xh - 152, YN - 250, xh + 152, YN + 4, quoi, [xh, YN + 40]);
      if (bati('chapelle')) {
        ici.regarder(xc - 120, YN - 378, xc + 120, YN + 4, () => (jour ? 'La chapelle du Rempart. Sa cloche sonne pour chaque aventurier qui part vers les terres de la lumière.' + (bati('escouade') ? " Deux soldats de l'escouade montent la garde." : '') : 'La chapelle du Rempart. Les vitraux veillent toute la nuit.'), [xc, YN + 40]);
        ici.lumiere(xc, YN - 200, 82);
        if (nuit) for (const [dx, dy, r, c] of [[0, -256, 70, 0xffe0a0], [-74, -142, 50, 0x80a0ff], [74, -142, 50, 0x80a0ff]]) ici.lumiere(xc + dx * F, YN + dy * F, r * F, c);
        // le jour, deux soldats de l'escouade montent la garde devant la chapelle
        if (jour && bati('escouade')) for (const [k, dx] of [[0, -88], [3, 90]]) {
          const q = imageCorps(s, xc + dx, YN + 30, 'soldat' + k, 4.5 / 1).setFlipX(dx > 0); poser(q, YN + 30); ici.ombrePerso(xc + dx, YN + 30);
          s.tweens.add({ targets: q, scaleY: q.scaleY * 1.012, duration: 1500 + k * 200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
          ici.obstacles.push([xc + dx - 14, YN + 18, xc + dx + 14, YN + 36]);
        }
        // (le mécénat) le vitrail de la chapelle, qui s'allume de couleurs ; on le regarde de près
        if (typeof palierDuMecenat === 'function' && palierDuMecenat(G, 'vitrail')) {
          for (const [dx, c] of [[-8, 0x2a5aa8], [8, 0xc9a227], [0, 0x8a2a3a]]) { const h = s.add.image(xc + dx * F, YN - 232 * F, 'halo').setScale(0.35 * F).setTint(c).setAlpha(0.45).setBlendMode(Phaser.BlendModes.ADD); poser(h, YN + 1); }
          ici.regarder(xc - 26, YN - 214, xc + 26, YN - 158, () => { vitrailDuMecene(s); return null; }, [xc, YN + 40]);
        }
      }
      s.lieuxRue.confrerie = cf;
    }
    // --- les Pommeroy ---
    const pommeroy = lot(L.pommeroy, YN, () => { s.add.image(0, 2, pommeroyVolumeHD(s)).setOrigin(0.5, 1).setScale(2); ecriteauRue(s, 4, -112, 'Les Pommeroy', { taille: 10 }); });
    contact(L.pommeroy, 132);
    regarder('pommeroy', [L.pommeroy - 120, YN - 256, L.pommeroy + 120, YN + 4], [L.pommeroy, YN + 36]);
    // --- l'impasse du Corbeau : sa porte dérobée, au fond, s'ouvre certains soirs (le marché noir) ---
    const ouvertCeSoir = nuit && typeof marcheNoirCeSoir === 'function' && marcheNoirCeSoir(G);
    lot(L.impasse, YN, () => {
      s.add.image(0, 2, 'rueImpasseHD').setOrigin(0.5, 1).setScale(2);
      ecriteauRue(s, -13, -176, 'Impasse du Corbeau', { taille: 9, fond: '#a88a5a' });
      if (ouvertCeSoir) s.add.rectangle(0, -66, 6, 9, 0xff4a2a);
    });
    if (ouvertCeSoir) { ici.lumiere(L.impasse, YN - 53, 64, 0xff3020); ici.lumiere(L.impasse, YN - 53, 40, 0xff3020); }
    regarder('impasse', [L.impasse - 76, YN - 180, L.impasse + 76, YN + 4], [L.impasse, YN + 36]);
    // --- la forge de Thorgal : ouverte le jour (des étincelles jaillissent), ses braises la nuit ---
    // (Q258) refaite : une halle de forge ouverte, vue d'en haut (maisonVolumeHD.js, forgeHalleHD) ; l'écriteau sur sa poutre
    const FV = FORGE_VOLUME, enLotF = (x, y) => [(x - FV.L / 2) * 2, 2 - (FV.H - y) * 2], [fxF, fyF] = enLotF(...FV.feu), [exF, eyF] = enLotF(...FV.ecriteau);
    lot(L.forge, YN, () => { s.add.image(0, 2, forgeHalleHD(s)).setOrigin(0.5, 1).setScale(2); ecriteauRue(s, exF, eyF, 'Forge de Thorgal', { taille: 10 }); });
    ici.chem(forgeHalleHD(s), L.forge, YN + 2); contact(L.forge, 182);
    if (jour) s.time.addEvent({ delay: 260, loop: true, callback: () => {
      if (!ici.C.active || s.planVille) return;
      const e = s.add.rectangle(L.forge + (fxF - 14 + Math.random() * 28) * F, YN + (fyF - 4) * F, 2, 2, Math.random() < 0.5 ? 0xffd060 : 0xff8020); e.yTri = YN + 1; ici.C.add(e);
      s.tweens.add({ targets: e, y: e.y - (20 + Math.random() * 30) * F, x: e.x + (Math.random() - 0.5) * 30 * F, alpha: 0, duration: 500 + Math.random() * 400, onComplete: () => e.destroy() });
    } });
    ici.lumiere(L.forge + fxF * F, YN + fyF * F, 92, 0xff9040);
    regarder('forge', [L.forge - 144, YN - 272, L.forge + 144, YN + 4], [L.forge, YN + 36]);
    // --- ton comptoir : sa façade (son niveau, son étage, son style), ses pattes repliées, ce que le mécénat y accroche ---
    let facade = null;
    const comptoir = lot(L.comptoir, YN, () => {
      facade = dessinerFacade(s, 0, 0, G ? G.nomShop : undefined, undefined, { fumee: false, volume: true });
      if (typeof pattesPosees === 'function' && G && pattesPosees(G)) pattesRepliees(s, facade, { sorte: etatPattes(G).sorte, sol: 0 });   // (v1.56) ses pattes, repliées au coin des murs
      if (typeof palierDuMecenat === 'function' && G && palierDuMecenat(G, 'saufConduit')) { if (!s.textures.exists('embleme_conseil')) creerEmblemesHD(s); for (const [dx, cle] of [[-58, 'embleme_conseil'], [58, 'embleme_bannis']]) s.add.image(dx, -128, cle).setScale(0.42); }
      if (typeof palierDuMecenat === 'function' && G && palierDuMecenat(G, 'visite')) for (const dx of [-150, 150]) banniereRempart(s, dx, -300);
    });
    // (le battant de ta porte, dans le monde : il s'ouvre quand tu rentres, QuartierScene.animerPorte)
    const porteComptoir = (() => { const [x, y, l, h] = facade.zones.porte, im = facade.image, x0 = im.x - im.displayWidth * im.originX, y0 = im.y - im.displayHeight * im.originY;
      return { x: L.comptoir + x * F, y: YN + (y + 2) * F, l: l * F, h: (h - 2) * F, cx: L.comptoir + (x + l / 2) * F, yTri: YN + 0.5,
        src: { cle: im.texture.key, x: (x - x0) / im.scaleX, y: (y + 2 - y0) / im.scaleY, l: l / im.scaleX, h: (h - 2) / im.scaleY } }; })();
    // (la fumée de ta cheminée, seulement si le feu brûle : la rue d'avant)
    if (G && typeof feuAllume === 'function' && feuAllume(G, jour) && !(typeof styleDeMaison === 'function' && styleDeMaison(G))) {
      ici.chem(facade.image.texture.key, L.comptoir, YN + 2);   // (vue de haut : la cheminée debout sur le pan du toit en croupe)
    }
    ici.lumiere(porteComptoir.cx, YN - 70, 120);
    ici.regarder(L.comptoir - 160, YN - 300, L.comptoir + 160, YN - 4, () => texteDeLaRue('comptoir', G, nuit), [porteComptoir.cx + 60, YN + 30]);
    s.lieuxRue.comptoir = comptoir; s.lieuxRue.facade = facade; contact(L.comptoir, 180);
    // --- le banc de la rue (on s'y assoit le soir ; le jour, quelqu'un s'y repose parfois) ---
    img(L.banc, YN + 34, banc5(s), E); ici.obstacles.push([L.banc - 52, YN + 14, L.banc + 52, YN + 36]);
    s.bancRue = { x: L.banc, y: YN + 34 };
    // --- la maison du paon : selon l'histoire du rival (absent, ouvert, à vendre, rachetée : en travaux, le petit bar, l'orphelinat) ---
    const paon = lot(L.paon, YN - 440 * F, () => {
      const r = G && typeof rivalVisible === 'function' && rivalVisible(G) ? G.rival : null;
      if (r && typeof FacadeScene !== 'undefined') {
        // (la façade du matin, FacadeScene.dessinerVoisin, posée ici : son sol est à 440)
        const ici2 = Object.create(s), FP = FacadeScene.prototype; ici2.G = G; ici2.bulleVoisin = () => null; ici2.dessinerBar = FP.dessinerBar; ici2.dessinerOrphelinat = FP.dessinerOrphelinat;
        FacadeScene.prototype.dessinerVoisin.call(ici2, r, 0);
      } else {
        // (Q161) pas encore de voisin : la maison est là, vide, ses vitrines éteintes et sans objets, ses fenêtres sombres,
        // sans enseigne, sans emblème, sans tapis ; un panneau « À vendre » se balance à sa porte
        s.add.image(0, 442, creerFacadeRivalHD(s, 1, MAISON_PAON_VIDE)).setOrigin(0.5, 1).setScale(2);
        const pa = s.add.container(0, 330).setAngle(-6);
        pa.add(s.add.rectangle(0, 0, 130, 46, 0xe8d8b0).setStrokeStyle(3, 0x5a3a1a)); pa.add(s.add.text(0, -6, 'À VENDRE', style(19, '#8a1a14', { fontStyle: 'bold' })).setOrigin(0.5)); pa.add(s.add.text(0, 14, 'chez le notaire du Conseil', style(9, '#3b2410', { fontStyle: 'italic' })).setOrigin(0.5));
        s.tweens.add({ targets: pa, angle: -3, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
    }, YN);
    s.lieuxRue.paon = paon;
    // (vue de haut, validée) la maison haute à colombages en un seul volume, sous son toit d'ardoises en croupe (maisonVolumeHD.js)
    { const k = maisonHauteVolumeHD(s); img(L.maisonHaute, YN + 2, k, E); ici.chem(k, L.maisonHaute, YN + 2); contact(L.maisonHaute, 140); }
    img(2390, YN - 110, haie89(s, 'haieYsmee89', 150), E, YN - 110);
    ici.arbre(2470, YN - 80, 0);
    // --- la tente violette de Madame Ysmée, dès le jour 10 (on y entre le matin), et son ardoise du temps ---
    const ysmee = G && typeof ysmeeArrivee === 'function' && ysmeeArrivee(G);
    if (ysmee) {
      // (vue de haut) la tente : un cône posé sur son pied en ellipse (maisonVolumeHD.js), son ombre au sol
      ombre(L.tente, YN + 4, 190); img(L.tente, YN + 6, tenteYsmeeVolumeHD(s), E); ici.obstacles.push([L.tente - 88, YN - 10, L.tente - 16, YN + 8], [L.tente + 16, YN - 10, L.tente + 88, YN + 8]);   // (l'entrée reste libre : on y entre)
      const ard = lot(L.ardoise, YN, () => { if (typeof ardoiseMeteo === 'function') ardoiseMeteo(s, 0, 8, G); }, YN + 8);
      for (const t of ard.list) if (t.type === 'Text') { let f = 10; while (t.width > 70 && f > 7) t.setFontSize(--f); }   // (le mot du temps tient sur l'ardoise, quelle que soit la police)
      ici.obstacles.push([L.ardoise - 34, YN - 4, L.ardoise + 34, YN + 12]);
      if (nuit) { ici.lumiere(L.tente, YN - 40, 70, 0xb070ff); ici.regarder(L.tente - 90, YN - 190, L.tente + 90, YN + 4, "La tente de Madame Ysmée est fermée pour la nuit. Une lueur violette filtre sous la toile... Elle ne dort donc jamais ?", [L.tente, YN + 36]); }
    }
    // --- le Fil d'Argent, la boutique d'Orvin : close avant tes 18 ans ; ouverte le jour, volets clos la nuit ---
    const barbierOuv = G && typeof barbierOuvert === 'function' && barbierOuvert(G);
    const barbier = lot(L.barbier, YN, () => {
      s.add.image(0, 2, barbierVolumeHD(s)).setOrigin(0.5, 1).setScale(2);   // (vue de haut, validée : en un seul volume)
      const B = BARBIER_VOLUME, yF = B.egout - 1 - (B.montee + Math.round(B.prof * VOLUME_HD.prof)) + 1, enLot = (x, y) => [(x - B.L / 2) * 2, 2 - (B.H - y) * 2];
      if (jour && temps === 'soleil') {   // (Q209) un chat sur le toit, au soleil : il dort, bat de la queue, se lève, se recouche
        const [cx, cy] = enLot(74, B.egout - 1 - Math.round(10 * (B.montee / B.prof + VOLUME_HD.prof))), ch = s.add.image(cx, cy, 'chatRue_dort0').setOrigin(0.5, 1).setScale(1.5).setFlipX(true);
        let k = 0; const dormir = () => { if (!ch.active) return; ch.setTexture('chatRue_dort' + (++k % 2)); s.time.delayedCall(900, k % 6 === 5 && Math.random() < 0.5 ? reveil : dormir); };
        const reveil = () => { if (!ch.active) return; ch.setTexture('chatRue_assis0'); let q = 0; s.time.addEvent({ delay: 400, repeat: 7, callback: () => ch.active && ch.setTexture('chatRue_assis' + (++q % 2)) });
          s.time.delayedCall(3400, () => { if (!ch.active) return; ch.setTexture('chatRue_m0'); s.time.delayedCall(700, () => { if (!ch.active) return; ch.setFlipX(!ch.flipX).setTexture('chatRue_tapi'); s.time.delayedCall(600, dormir); }); }); };
        s.time.delayedCall(1500, dormir);
      }
      {   // (Q198-3) un pigeon posé sur le faîte, qui se tourne et se gonfle de temps en temps
        const [px, py] = enLot(46, yF - 1), pg = s.add.image(px, py, 'pigeon81_debout').setOrigin(0.5, 1).setScale(1);
        s.time.addEvent({ delay: 900, loop: true, callback: () => { if (!pg.active) return; const r = Math.random(); if (r < 0.3) pg.setFlipX(!pg.flipX); else if (r < 0.5) { pg.setTexture('pigeon81_gonfle'); s.time.delayedCall(600, () => pg.active && pg.setTexture('pigeon81_debout')); } } });
      }
      if (!barbierOuv || nuit) s.add.image(0, 2, boutiqueFermeeHD(s)).setOrigin(0.5, 1).setScale(2);
      if (!barbierOuv) s.add.text(52, 2 - 2 * 66, 'Ouvrira bientôt', style(11, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5);
      else {
        if (nuit) s.add.text(52, 2 - 2 * 66, 'Fermé', style(11, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5);
        const poteau = s.add.image(-112, 2 - 2 * 76, poteauBarbierHD(s, 0)).setScale(2); poteauBarbierHD(s, 1);
        if (jour) s.time.addEvent({ delay: 260, loop: true, callback: () => poteau.active && poteau.setTexture(poteau.texture.key === 'poteauBarbierHD0' ? 'poteauBarbierHD1' : 'poteauBarbierHD0') });
        s.add.image(40, 2 - 2 * 92, enseigneBarbierHD(s)).setScale(2);
        ecriteauRue(s, -30, -112, "Le Fil d'Argent", { taille: 10 });
      }
    });
    if (barbierOuv) ici.lumiere(L.barbier, YN - 48, 62);
    ici.chem('boutiqueBarbierVolumeHD', L.barbier, YN + 2); contact(L.barbier, 124);   // (Q198-3) la fumée de sa cheminée ; l'ombre de contact
    if (!barbierOuv) ici.regarder(L.barbier - 100, YN - 180, L.barbier + 100, YN + 4, "Les volets sont cloués. Sur l'écriteau : « Le Fil d'Argent, barbier. Ouvrira bientôt. » On entend parfois quelqu'un siffler dedans, derrière les planches.", [L.barbier, YN + 36]);
    else if (nuit) ici.regarder(L.barbier - 100, YN - 180, L.barbier + 100, YN + 4, "Le Fil d'Argent est fermé pour la nuit. Derrière les volets, Orvin affûte ses rasoirs en chantonnant.", [L.barbier, YN + 36]);
    maison(L.maisonC, YN, 'mvC89', { L: 124, etages: [52], toitMat: 'chaume', crepi: 'enduitR', vitrine: { x: 0.36, l: 52 }, porte: { x: 0.78, l: 22, h: 48 }, fenetres: [[0.3, 0.75]], lucarne: 0.55, store: 'storeV', volet: 'voletJ', lierre: true, graine: 9 });
    // --- le lot des Mages-Charpentiers : d'abord un chantier (les poutres montent seules), puis l'atelier ---
    const magesOuv = G && typeof atelierMagesOuvert === 'function' && atelierMagesOuvert(G), magesChantier = !magesOuv && G && typeof chantierMages === 'function' && chantierMages(G);
    if (magesOuv || magesChantier) lot(L.mages, YN, () => {
      if (magesOuv) { s.add.image(0, 2, atelierMagesHD(s)).setOrigin(0.5, 1).setScale(2); if (nuit) ecriteauRue(s, 6, -140, 'Les Mages-Charpentiers', { taille: 11 }); }
      else { s.add.image(0, 2, chantierMagesHD(s)).setOrigin(0.5, 1).setScale(2); ecriteauRue(s, -6, -64, 'Ici bientôt :\nles Mages-Charpentiers', { taille: 10 }); }
    });
    else { ici.arbre(L.mages - 40, YN - 60, 1); ici.buisson(L.mages + 66, YN - 26); }   // (un lot vide : de l'herbe, un arbre)
    if (magesOuv) {
      ici.lumiere(L.mages, YN - 96, 82);
      // (le jour) la maîtresse-charpentière se tient sur le seuil, le charpentier nain à côté
      if (jour) [[MAITRESSE_MAGES, L.mages - 72, false], [CHARPENTIER_NAIN, L.mages + 96, true]].forEach(([q, x, fl], i) => {
        const p = imageCorps(s, x, YN + 28, q, 4.5).setFlipX(fl); poser(p, YN + 28); ici.ombrePerso(x, YN + 28);
        s.tweens.add({ targets: p, scaleY: p.scaleY * 1.012, duration: 1500 + i * 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        ici.obstacles.push([x - 14, YN + 16, x + 14, YN + 34]);
      });
      else ici.regarder(L.mages - 125, YN - 240, L.mages + 125, YN + 4, "L'atelier des Mages-Charpentiers dort. Sur les poutres, les runes luisent encore un peu, bleu pâle.", [L.mages, YN + 36]);
    } else if (magesChantier) ici.regarder(L.mages - 125, YN - 240, L.mages + 125, YN + 4, "Un chantier, à côté de la fontaine : pas de grue, pas de corde... les poutres montent toutes seules, dans une lueur bleue. « Les Mages-Charpentiers », dit l'écriteau. Ils ouvriront quand un royaume sera entièrement libéré.", [L.mages, YN + 36]);
    // --- la Banque Centrale Goyenne ---
    const banque = lot(L.banque, YN, () => {
      s.add.image(0, 2, banqueVolumeHD(s)).setOrigin(0.5, 1).setScale(2);   // (vue de haut : le fronton, son toit en croupe derrière)
      {   // (Q198-3) la girouette de la banque, à la pointe du fronton : elle tourne avec le vent
        const B = BANQUE_VOLUME, gi = s.add.image(0, 2 - (B.H - 18) * 2 + 2, girouetteHD(s)).setOrigin(0.5, 1).setScale(2);
        const tourner = () => { if (!gi.active) return; s.tweens.add({ targets: gi, scaleX: gi.scaleX > 0 ? -2 : 2, duration: 700 + Math.random() * 900, ease: 'Sine.easeInOut', onComplete: () => s.time.delayedCall(1500 + Math.random() * 4000, tourner) }); };
        s.time.delayedCall(2000, tourner);
      }
      ecriteauRue(s, 0, -254, 'BANQUE CENTRALE GOYENNE', { taille: 12, grave: true });
      s.add.image(0, -263, creerLogoBanque(s)).setOrigin(0.5, 1).setScale(1.5);
      if (typeof palierDuMecenat === 'function' && G && palierDuMecenat(G, 'visite')) banniereRempart(s, -84, -236);   // (sous le fronton : le nom de la banque reste lisible)
    });
    ici.lumiere(L.banque, YN - 120, 72);
    ici.chem('banqueVolumeHD', L.banque, YN + 2); contact(L.banque, 200);
    regarder('banque', [L.banque - 160, YN - 282, L.banque + 160, YN - 40], [L.banque - 70, YN + 30]);
    // --- le porche de la place des Mastres (planche 80, porche A) : la place au travers, ses passants, l'écriteau pendu ---
    const nymphe = nuit && G && typeof nympheAttend === 'function' && nympheAttend(G);
    lot(L.arche, YN, () => {
      const k = porcheRueHD(s, jour), sz = k.split('_')[1];
      s.add.image(0, 2, 'placePorche_' + sz + (jour ? '_jour' : '_nuit')).setOrigin(0.5, 1).setScale(2);
      const foule = s.add.container(0, 0);
      s.add.image(0, 2, k).setOrigin(0.5, 1).setScale(2);
      if (jour) passantsPorche(s, foule, 0, 0, { hiver: sz === 'givre' });
      ecriteauRue(s, 0, -302 + 2 * (PORCHE_RUE.linteau + 13) + 10, 'Place des Mastres', { taille: 12 });
    });
    if (nymphe) {
      // (la nymphe attend) la place, au fond, baignée de bleu ; des gouttes de lumière montent par-dessus les toits
      const l = s.add.rectangle(L.arche, YN - 104, 144, 200, 0x3a9ad8, 0.3).setBlendMode(Phaser.BlendModes.ADD); poser(l, 9e5 + 2);
      s.tweens.add({ targets: l, fillAlpha: 0.12, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      s.time.addEvent({ delay: 180, loop: true, callback: () => {
        if (!ici.C.active || !s.lueurNymphe) return;
        const g = s.add.circle(L.arche + (Math.random() - 0.5) * 120, YN - 48 - Math.random() * 48, 1.2 + Math.random() * 1.2, Math.random() < 0.5 ? 0xd8fcff : 0x8ae0e8, 0.9).setBlendMode(Phaser.BlendModes.ADD); g.yTri = 9e5 + 3; ici.C.add(g);
        s.tweens.add({ targets: g, y: g.y - 96 - Math.random() * 64, alpha: 0, duration: 1600 + Math.random() * 800, onComplete: () => g.destroy() });
      } });
      s.lueurNymphe = l;
    }
    // (le mécénat) les fanions bleu et or du Rempart, tendus d'une maison à l'autre, sous les toits
    if (typeof palierDuMecenat === 'function' && G && palierDuMecenat(G, 'plaque')) {
      const g = s.add.graphics(); poser(g, YN + 2);
      // (sous les toits, au-dessus des enseignes et des écriteaux ; d'une maison à l'autre, jamais vers un lot vide)
      for (const [a, b] of [[L.pommeroy, L.forge], [L.forge, L.comptoir - 96], [L.comptoir + 128, L.paon - 60], [L.barbier, L.maisonC], ...(magesOuv || magesChantier ? [[L.maisonC, L.mages], [L.mages, L.banque - 160]] : [[L.maisonC, L.banque - 160]])]) {
        const n = Math.max(6, Math.round((b - a) / 28)); let pr = null;
        g.lineStyle(1.6, 0x3a2a1a);
        for (let i = 0; i <= n; i++) { const t = i / n, x = a + (b - a) * t, y = YN - 216 + Math.sin(t * Math.PI) * 20;
          if (pr) g.lineBetween(pr[0], pr[1], x, y);
          if (i < n) g.fillStyle(i % 2 ? 0xc9a227 : 0x2a5aa8).fillTriangle(x, y, x + 16, y + 2, x + 7, y + 16);
          pr = [x, y]; }
      }
    }
    // les plaques de la rue, clouées à l'angle des maisons
    // (Q262) la chaumière et la maison d'ardoise : la plaque quitte le toit, sur le mur à droite de la porte (plus bas)
    if (G && niveauFacade(G) < 2 && !(typeof styleDeMaison === 'function' && styleDeMaison(G))) ici.plaqueSur(comptoir, 'droite', 66, 'Rue Soucolline', { retrait: 58 });
    else ici.plaqueSur(comptoir, 'gauche', 116, 'Rue Soucolline', { retrait: 10 }); ici.plaqueSur(barbier, barbierOuv && jour ? 'droite' : 'gauche', 112, 'Rue Soucolline', { retrait: 14 });   // (close, ou la nuit : son écriteau « Fermé » est à droite)
    ici.plaqueSur(paon, 'droite', 120, 'Placette de la Fontaine', { retrait: 12 });
    ici.plaqueSur(pommeroy, 'droite', 100, 'Montée du Four', { retrait: 8 });
    // (Q252) la plaque « Rue Soucolline » de la banque, à une place plus fluide : sur une potence de fer au réverbère qui garde
    // l'angle ouest de la banque, ou (conseillé) sur un petit poteau à l'angle est, devant la palissade du porche (PLAQUE_BANQUE)
    if (plaqueBanque() === 'poteau') {
      const px = L.banque + 132, py = YN + 24; img(px, py, poteauPlaqueHD(s), E, py); ici.obstacles.push([px - 8, py - 6, px + 8, py + 2]); ici.plaque(px, py - 76, 'Rue Soucolline', { yTri: py + 0.5 });
    } else {
      const px = 3186, py = YN + 26; img(px - 4, py - 104, potencePlaqueHD(s), E, py + 0.3, 1, 0); ici.plaque(px - 50, py - 52, 'Rue Soucolline', { yTri: py + 0.5 });
    }
    // (l'été) les bottes de paille, rangées contre la palissade du porche, du côté est, toujours au même endroit (jamais au
    // milieu du passage, ni devant une porte, une enseigne ou un réverbère)
    if (saison === 'moissons' && typeof texturesPailleHD === 'function') { const bx = L.arche + 190; texturesPailleHD(s); ombre(bx, YN + 14, 70); img(bx, YN + 16, 'bottesPailleRue', E * 0.8, YN + 16); ici.obstacles.push([bx - 34, YN + 2, bx + 34, YN + 18]); }

    // ===================== 4. la rue Haute : les maisons du côté nord, la cour du Puits, le jardin du Pommier =====================
    maison(660, YH, 'mvL3', { L: 120, etages: [50], toitMat: 'ardoiseToit', crepi: 'enduitC', fenetres: [[0.3, 0.72]], porte: { x: 0.68, l: 22, h: 48, peinte: 'porteRouge' }, fenetresRdc: [0.28], volet: 'voletB', lucarne: null, graine: 51, fleur: 'fleurR2' });
    const mM = maison(866, YH, 'mvM3', { L: 128, etages: [50], toit: 50, toitMat: 'tuile', crepi: 'enduitR', fenetres: [[0.25, 0.72]], porte: { x: 0.3, l: 22, h: 48, peinte: 'porteVerte' }, fenetresRdc: [0.72], volet: 'voletV', lucarne: 0.5, graine: 52, lierre: true });
    maison(1086, YH, 'mvH89', { L: 136, etages: [46, 44], toit: 46, toitMat: 'tuile', crepi: 'enduitC', fenetres: [[0.25, 0.75], [0.25, 0.75]], porte: { x: 0.5, l: 24, h: 50, peinte: 'porteVerte' }, fenetresRdc: [0.2, 0.8], graine: 23, volet: 'voletB', fleur: 'fleurP2' });
    // (les Brindeloup : la maison du carrefour, ses bûches, son chat qui dort, son linge ; planche 81, la rue d'avant)
    const mD = maison(1418, YH, 'mvD89', { L: 130, etages: [52], toitMat: 'ardoiseToit', crepi: 'enduitB', porte: { x: 0.24, l: 22, h: 48, peinte: 'porteVerte' }, fenetres: [[0.25, 0.68]], fenetresRdc: [0.68], volet: 'voletB', lucarne: 0.4, fleur: 'fleurJ2', graine: 31 });
    maison(1255, YH, 'mvK3', { L: 72, etages: [50], toitMat: 'tuile', crepi: 'enduitR', fenetres: [[0.5]], porte: { x: 0.5, l: 22, h: 48, peinte: 'porteJaune' }, graine: 41, volet: 'voletV', lucarne: null, cheminee: 0.3 });
    { const t = ecriteauRue(s, 1456, YH - 106, 'Les Brindeloup', { taille: 10 }); poser(t.setDepth(0), YH + 0.4); }
    ici.regarder(1353, YH - 230, 1483, YH - 4, () => texteDeLaRue('brindeloup', G, nuit), [1418, YH + 34]);
    img(1856, YH + 28, banc5(s), E); ici.obstacles.push([1856 - 52, YH + 8, 1856 + 52, YH + 30]);
    img(1745, 1150, puits89(s), E); ombre(1745, 1150, 80); ici.obstacles.push({ ellipse: [1745, 1146, 46, 16] });
    { const k = arbrePlaceHD(s, pal, 0, 1478, 1184); poser(s.add.image(1478, 1184, k).setOrigin(0.5, origineArbre(s, k)).setScale(1.7), 1184); ombre(1486, 1184, 96); poser(s.add.rectangle(1478, 1181, 44, 11, 0x8a8070).setStrokeStyle(2, 0x5a5248), 1179); ici.obstacles.push([1478 - 24, 1172, 1478 + 24, 1188]); }
    img(1440, YH + 2, 'buches81', E, YH + 2, 0, 1); { const ch = img(1456, YH - 28, roux + '_dort0', F, YH + 3, 0.5, 1); betes.push({ sorte: 'dort', img: ch, cle: roux }); }
    img(1330, YH + 4, 'panier81', E); img(1394, YH + 4, 'balai81', E).setAngle(-7); img(1350, YH + 8, 'sabots81', E); img(1420, YH + 10, 'bidon81', E); img(1300, YH + 8, 'romarin81', E);
    ici.obstacles.push([1290, YH, 1500, YH + 14]);
    for (const x of [RH.x0 - 10, RH.x1]) img(x, 930, murLong89(s, 'murEsc3', Math.ceil((YH - 930) / E)), E, YH, 0, 0);
    // (les Coteaux ne sont pas encore faits : comme au chemin creux de la place, une barrière ferme le bas des deux escaliers, qu'on refait)
    for (const [a, b] of [[RH.x0, RH.x1], [RE.x0, RE.x1]]) img((a + b) / 2, YH + 2, barrierePlaceHD(s, Math.round((b - a) / 16)), 1.6, YH + 2);
    img(RH.x0 - 22, YH + 6, bacFleurs89(s, 'bacFleurs89e', 'fleurR2'), E * 0.7); img(RH.x1 + 22, YH + 6, bacFleurs89(s, 'bacFleurs89f', 'fleurB2'), E * 0.7);
    for (const [a, b] of [[FO.x1, RU.x0], [RU.x1, 2730]]) ligneParapet(a, b, 1200, true);
    const mE = maison(1812, YH, 'mvE89', { L: 120, etages: [50], toitMat: 'chaume', crepi: 'enduitC', porte: { x: 0.3, l: 22, h: 48, peinte: 'porteRouge' }, fenetres: [[0.3, 0.74]], fenetresRdc: [0.72], volet: 'voletV', graine: 33, lierre: true });
    // (la corde à linge des Brindeloup : rentrée la nuit et sous la pluie)
    if (jour && !mouille) { const yl = YH - 150; img(1524, yl, 'linge81_0', E, YH + 0.5, 0, 0); img(1524 + 62 * E, yl, 'linge81_1', E, YH + 0.5, 0, 0); }
    img(2016, 890, haie89(s, 'haiePommier89', 130), E, 890);
    ici.arbre(2030, 1030, 1, 2.8);
    for (const [x, y] of [[1950, 960], [2090, 990]]) ici.buisson(x, y);
    img(2016, YH + 4, murJardin89(s, 'murJardin89', 130), E);
    ici.plaque(1590, 1196, 'Ruelle du Pommier', { yTri: 1201 });
    maison(2230, YH, 'mvI89', { L: 130, etages: [52], toitMat: 'ardoiseToit', crepi: 'enduitO', fenetres: [[0.25, 0.72]], porte: { x: 0.72, l: 22, h: 48, peinte: 'porteJaune' }, fenetresRdc: [0.28], lucarne: 0.5, graine: 24, volet: 'voletV' });
    const mJ = maison(2440, YH, 'mvJ89', { L: 120, etages: [50], toitMat: 'tuile', crepi: 'enduitR', fenetres: [[0.3, 0.7]], porte: { x: 0.3, l: 22, h: 48 }, fenetresRdc: [0.72], graine: 25, volet: 'voletB', lierre: true });
    ici.plaqueSur(mD, 'gauche', 112, 'Rue Haute', { retrait: 12 }); ici.plaqueSur(mJ, 'droite', 104, 'Rue Haute', { retrait: 12 });
    ici.plaqueSur(mE, 'droite', 116, 'Carrefour du Puits', { retrait: 12 }); ici.plaqueSur(mM, 'gauche', 104, 'Rue Haute', { retrait: 12 });
    ici.arbre(2580, YH - 10, 0); ici.buisson(2780, YH + 10); ici.arbre(2840, YH - 30, 1);
    for (const [x, y, v] of [[1040, 900, 1], [2300, 920, 0], [2860, 900, 1], [440, 980, 0], [250, 1180, 1], [-60, 1060, 0], [3000, 1020, 0], [3300, 1100, 1], [3560, 960, 0], [3760, 1120, 1]]) ici.arbre(x, y, v);
    for (const [x, y] of [[120, 1300], [3150, 1240], [3480, 1200]]) ici.buisson(x, y);

    // ===================== 5. la placette de la Fontaine, sa fontaine à la grenouille =====================
    let fontaine = null;
    { const fx = 1860, fy = 1728;
      lot(fx, fy, () => {
        const F8 = FONT81, E2 = 2, X = px => -F8.L + px * E2, Y = py => -F8.H * E2 + py * E2;
        s.add.ellipse(0, -2, F8.L * E2, 16, 0x000000, 0.25);
        s.add.image(0, 0, 'fontaineRue81_bas').setOrigin(0.5, 1).setScale(E2);
        const ex = 0, ey = Y(F8.rebordY + 1.2), rx = (F8.eauRx - 1) * E2, ry = (F8.eauRy - 0.8) * E2;
        for (let k = 0; k < 3; k++) { const y = ey - ry * 0.4 + k * ry * 0.45, xa = ex - rx * (0.55 - k * 0.1), xb = ex + rx * (0.5 - k * 0.08), pz = s.add.image(xa + (xb - xa) * (0.2 + k * 0.3), y, 'poisson81_' + (k % 2)).setAlpha(0.85);
          betes.push({ sorte: 'poisson', img: pz, xa, xb, k }); }
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
        // (Q165) les bêtes de la fontaine (pigeons, chat, papillons, libellule) vivent dans le monde, hors du groupe : voir plus bas
        fontaine = { X: px => fx + X(px) * F, Y: py => fy + Y(py) * F, ex: fx + ex * F, ey: fy + ey * F };
        // (le mécénat) la plaque des mécènes, scellée dans la paroi du bassin, à gauche ; on la lit de près
        if (typeof palierDuMecenat === 'function' && G && palierDuMecenat(G, 'plaque')) {
          const pl = s.add.graphics(), px = -56, py = -16;
          pl.fillStyle(0x3a3a40).fillRect(px - 20, py - 26, 40, 30).fillStyle(0xb8b4a8).fillRect(px - 18, py - 24, 36, 26);
          for (let i = 0; i < 4; i++) pl.fillStyle(0x6a665a).fillRect(px - 13, py - 19 + i * 6, 26, 2);
          pl.fillStyle(0xc9a227).fillRect(px - 13, py - 7, 26, 2);
        }
      }, fy);
      ici.obstacles.push({ ellipse: [fx, fy - 12, 112, 22] }, [fx + 96, fy - 6, fx + 120, fy + 10], [fx - 150, fy - 6, fx - 120, fy + 10]);
      regarder('fontaine', [fx - 112, fy - 96, fx + 112, fy + 4], [fx + 20, fy + 34]);
      if (typeof palierDuMecenat === 'function' && G && palierDuMecenat(G, 'plaque')) ici.regarder(fx - 66, fy - 46, fx - 24, fy - 6, () => { plaqueDesMecenes(s); return null; }, [fx - 46, fy + 34]);
    }
    // (Q165) les bêtes de la placette et de la fontaine : posées dans le monde, et elles vivent (vieDesBetesSoucolline)
    if (jour) {
      const fo = fontaine;
      betes.push({ sorte: 'pigeon', x: fo.X(97), y: fo.Y(71.5), pose: 'boit', boit: true }, { sorte: 'pigeon', x: 1860 + 168 * F, y: 1728 + 14 * F }, { sorte: 'pigeon', x: 1860 + 196 * F, y: 1728 + 10 * F, flip: true },
        { sorte: 'pigeon', x: 1700, y: 1790 }, { sorte: 'pigeon', x: 1722, y: 1796, flip: true });
      betes.push({ sorte: 'chat', x: 1860 - 168 * F, y: 1728 + 10 * F, bouge: [1560, 1740] });
      if (saison !== 'givre' && !mouille) betes.push({ sorte: 'papillon', nom: 'citron', x: fo.X(18), y: fo.Y(58), r: 16, ry: 9, duree: 4200 }, { sorte: 'papillonPose', nom: 'paon', x: fo.X(118), y: fo.Y(64) }, { sorte: 'libellule', x: fo.ex - 66 * F, y: fo.ey - 20 * F, rx: 40, ry: 8 });
    }
    img(1560, 1560, bacFleurs89(s, 'bacFleurs89d', 'fleurJ2'), E * 0.8);
    for (const x of [1436, 1994]) { lampe(x, PL.y1 - 10); ici.obstacles.push([x - 10, PL.y1 - 18, x + 10, PL.y1 - 4]); }
    img(1700, PL.y1 - 2, bacFleurs89(s, 'bacFleurs89c', 'fleurR2'), E * 0.8);
    img(1540, 1392, bacFleurs89(s, 'bacFleurs89a', 'fleurP2'), E * 0.8); img(1690, 1392, bacFleurs89(s, 'bacFleurs89b', 'fleurJ2'), E * 0.8);
    ici.obstacles.push([1540 - 30, 1380, 1540 + 30, 1396], [1690 - 30, 1380, 1690 + 30, 1396], [1560 - 28, 1548, 1560 + 28, 1564], [1700 - 28, PL.y1 - 14, 1700 + 28, PL.y1 + 2]);

    // ===================== 6. les réverbères, les bancs, les bêtes, l'herbe au pied des murs =====================
    // (aucun réverbère devant une enseigne, un écriteau, une plaque, le poteau du barbier ou l'ardoise : celui du paon est
    // passé à droite de son enseigne, celui de la tente à droite du barbier)
    for (const x of [660, 1104, 2075, 2735, 3186]) { lampe(x, YN + 26); ici.obstacles.push([x - 10, YN + 16, x + 10, YN + 30]); }
    for (const x of [400, 1180, 2160, 2760, 3300]) { lampe(x, 1742); ici.obstacles.push([x - 10, 1730, x + 10, 1748]); }
    // (vue de haut) tout ce qui est posé au sol a son ombre en ellipse : les réverbères, le banc
    for (const x of [660, 1104, 2075, 2735, 3186]) ombre(x, YN + 26, 36); for (const x of [400, 1180, 2160, 2760, 3300]) ombre(x, 1742, 36); ombre(L.banc, YN + 34, 130);
    lampe(RH.x1 + 8, YH + 4); lampe(FO.x0 - 14, YH + 4);
    if (jour) betes.push({ sorte: 'moineau', img: img(2735 + 4, YN + 26 - 172 * 0.8, 'moineau81_pose', F, YN + 27) });
    if (jour) for (const [x, y, fl] of [[2300, 1662, false], [2322, 1672, true], [1180, 1130, true], [700, 1680, false], [3460, 1660, true]]) betes.push({ sorte: 'pigeon', x, y, flip: fl });
    // (Q172) des moineaux devant le banc, qui picorent entre les pavés et s'envolent avec les pigeons
    if (jour && !mouille) for (const [x, y, fl] of [[L.banc - 26, 1562, false], [L.banc + 12, 1574, true], [L.banc + 40, 1558, false]]) betes.push({ sorte: 'pigeon', espece: 'moineau', x, y, flip: fl });
    // (Q172) la vie du sol : le filet d'eau du caniveau qui scintille (et les feuilles qui y flottent, à l'automne), les
    // flaques entre les pavés les jours de pluie (le soir, elles reflètent les réverbères)
    vieDuSolSoucolline(s, ici, { rg: rigoleSoucolline(), saison, mouille, nuit, PL, hierMouille: !!(G && typeof meteoDu === 'function' && ['pluie', 'orage'].includes(meteoDu(G, G.jour - 1))) });
    img(2240, YN + 34, banc5(s), E); ici.obstacles.push([2240 - 52, YN + 14, 2240 + 52, YN + 36]);
    if (saison !== 'givre') {
      for (const [x, k] of [[1166, 'touffe81'], [1712, 'touffe81'], [2514, 'pissenlit81'], [2716, 'touffe81'], [1528, 'touffe81'], [1702, 'pissenlit81'], [306, 'touffe81'], [652, 'pissenlit81'], [2922, 'touffe81'], [3176, 'pissenlit81']]) img(x, YN + 4, k, F);
      for (const [x, k] of [[1530, 'pissenlit81'], [1712, 'touffe81'], [2110, 'touffe81'], [2550, 'pissenlit81'], [770, 'touffe81']]) img(x, YH + 4, k, F);
    }
    // le chemin du Rempart, au bout de la rue : son poteau indicateur (planche 89 v7, le passage 6), au bord sud du chemin
    { const px = -230, py = 1752; img(px, py, poteau89(s), E, py); ombre(px, py, 30);
      // (Q162) la flèche est assez longue pour son nom, qui tient dans le corps de la planche (jamais dans la pointe)
      const LF = 58, pointe = 6 * E, fx = px + 10, f = s.add.image(fx, py - 96, fleche89(s, LF, -1)).setOrigin(0.5).setScale(E); poser(f, py + 0.2);
      const corps = LF * E - pointe, t = poserLettrage(s, ici.C, fx + pointe / 2, py - 96, 'Le Rempart', { police: 'Alegreya', graisse: 900, taille: 11, couleur: '#1e1006', fond: BOIS_CLAIR_NOM, genre: 'grave', largeur: corps - 12, hauteur: 12 * E - 4, lignesMax: 1 }); t.yTri = py + 0.3;
      ici.obstacles.push([px - 10, py - 10, px + 10, py + 6]); }
    // (la pluie) des flaques sur les pavés, là où la chaussée se creuse
    if (temps === 'pluie' || temps === 'orage') for (const [x, y, w, h] of [[640, 1660, 120, 22], [1260, 1672, 140, 24], [2080, 1648, 120, 20], [2600, 1676, 150, 24], [3120, 1656, 130, 22], [3500, 1672, 110, 20]]) {
      const g = s.add.graphics(); g.fillStyle(0x2a3a50, 0.5).fillEllipse(x, y, w + 6, h + 4).fillStyle(0x8aa4c4, 0.55).fillEllipse(x, y, w, h).fillStyle(0xd8e8f8, 0.35).fillEllipse(x - w * 0.18, y - h * 0.15, w * 0.4, h * 0.3); poser(g, y - h);
      s.time.addEvent({ delay: 300 + Math.random() * 300, loop: true, callback: () => { if (!ici.C.active) return; const r = s.add.ellipse(x + (Math.random() - 0.5) * w * 0.7, y + (Math.random() - 0.5) * h * 0.5, 4, 2).setStrokeStyle(1, 0xe8f4ff, 0.8); r.yTri = y - h + 0.1; ici.C.add(r); s.tweens.add({ targets: r, scaleX: 4, scaleY: 3, alpha: 0, duration: 700, onComplete: () => r.destroy() }); } });
    }
    // (l'hiver) le bonhomme de neige de la rue, sur la placette, à l'écart du passage
    if (saison === 'givre') { const bx = 1478, by = 1704; ombre(bx, by, 50); lot(bx, by, () => { const b2 = s.add.graphics();
      b2.fillStyle(0xdde6f0).fillCircle(0, -22, 26).fillStyle(0xf8fbff).fillCircle(-3, -25, 22).fillStyle(0xdde6f0).fillCircle(0, -62, 19).fillStyle(0xf8fbff).fillCircle(-2, -64, 16);
      b2.fillStyle(0xdde6f0).fillCircle(0, -92, 14).fillStyle(0xf8fbff).fillCircle(-2, -94, 12);
      b2.fillStyle(0x1a1410).fillCircle(-5, -96, 2).fillCircle(5, -96, 2).fillCircle(0, -66, 2).fillCircle(0, -56, 2);
      b2.fillStyle(0xe87020).fillTriangle(0, -92, 14, -90, 0, -88);
      b2.fillStyle(0xc82a20).fillRect(-14, -80, 28, 6).fillRect(6, -80, 6, 18);
      b2.fillStyle(0x2a2420).fillRect(-12, -112, 24, 4).fillRect(-8, -126, 16, 14);
      b2.lineStyle(3, 0x5a3a20).lineBetween(-18, -64, -40, -80).lineBetween(18, -64, 38, -78); }, by, 0.6);
      ici.obstacles.push([bx - 18, by - 12, bx + 18, by + 4]); }

    // ===================== 7. où l'on marche, les zones nommées, les passages =====================
    const entre = (v, a, b) => v >= a && v < b;
    ici.marchable = (x, y) =>
      entre(y, YN + 8, 1742) ||                                                                             // la rue Soucolline (jusqu'au parapet), et le chemin du Rempart
      (entre(x, PL.x0 + 10, PL.x1 - 10) && entre(y, 1540, PL.y1 - 4)) ||                                    // la placette
      (entre(x, VE.x0, VE.x1) && entre(y, PL.y1 - 4, PL.y1 + 38)) ||                                        // le palier (jusqu'à la barrière)
      (entre(x, RU.x0 + 8, RU.x1 - 8) && entre(y, 1190, YN + 10)) ||                                        // la ruelle du Pommier
      (entre(x, FO.x0 + 8, FO.x1 - 8) && entre(y, 1190, YN + 10)) ||                                        // la montée du Four
      (entre(y, YH + 10, 1194) && entre(x, FO.x0 + 6, 2790)) ||                                             // la rue Haute
      (x >= 2700 && Math.abs(y - (1176 - (x - 2780) * 0.25)) < 22) ||                                       // le chemin de derrière
      false;   // (les escaliers des Coteaux : fermés par leur barrière, tant que les Coteaux ne sont pas faits)
    ici.zones.push(
      { nom: 'La placette de la Fontaine', dedans: (x, y) => entre(x, PL.x0, PL.x1) && entre(y, 1590, PL.y1 + 40) },
      { nom: 'Le carrefour du Puits', dedans: (x, y) => entre(x, 1500, 1990) && entre(y, YH, 1200) },
      { nom: 'La ruelle du Pommier', dedans: (x, y) => entre(x, RU.x0, RU.x1) && entre(y, 1200, YN) },
      { nom: 'La montée du Four', dedans: (x, y) => entre(x, FO.x0, FO.x1) && entre(y, 1200, YN) },
      { nom: 'La rue Haute', dedans: (x, y) => entre(y, 900, 1200) },
      { nom: 'Le chemin du Rempart', dedans: (x, y) => x < 300 && entre(y, YN - 300, 1760) },
      { nom: 'La rue Soucolline', dedans: (x, y) => entre(y, YN - 300, 1760) },
    );
    const G2 = G || {};
    ici.passages.push(
      // ta porte : le jour, on rentre chez soi ; le soir, on rentre de la promenade (RueScene)
      { id: 'comptoir', nom: G2.nomShop || 'Ton comptoir', sous: 'ta porte', verbe: nuit ? 'rentrer' : 'rentrer chez toi', type: 'porte', devant: [porteComptoir.cx, YN + 22], dehors: [porteComptoir.cx, YN - 4], porte: porteComptoir,
        cadre: [porteComptoir.x, porteComptoir.y, porteComptoir.x + porteComptoir.l, YN], zone: [porteComptoir.cx - 55, YN, porteComptoir.cx + 55, YN + 60], pousser: [0, -1],
        vers: { scene: 'Nuit', donnees: { matin: true } }, action: nuit ? (sc => sc.rentrerDeLaPromenade && sc.rentrerDeLaPromenade()) : null },
      { id: 'marches', nom: 'Le bas-quartier ▼', sous: 'la descente des Marches', type: 'escalier', devant: [1510, PL.y1 + 24], dehors: [1510, PL.y1 + 70], zone: [VE.x0 - 10, PL.y1 - 10, VE.x1 + 10, PL.y1 + 44], pousser: [0, 1],
        bientot: 'La descente des Marches mène au bas-quartier : une barrière en ferme le haut, on refait les marches. On y descendra bientôt.' },
      { id: 'coteaux', nom: 'Les Coteaux ▲', sous: 'l’escalier des Coteaux', type: 'escalier', devant: [1615, YH + 22], dehors: [1615, YH - 60], zone: [RH.x0 - 10, YH, RH.x1 + 10, YH + 60], pousser: [0, -1],
        bientot: 'L’escalier monte aux Coteaux et à leurs portes rondes. Une barrière en ferme le bas : on refait les marches, on y montera bientôt.' },
      { id: 'escalierHaut', nom: 'Les Coteaux ▲', sous: 'l’escalier du bout de la rue Haute', type: 'escalier', devant: [2685, YH + 22], dehors: [2685, YH - 60], zone: [RE.x0 - 10, YH, RE.x1 + 10, YH + 60], pousser: [0, -1],
        bientot: 'Cet escalier monte aussi aux Coteaux : sa barrière est fermée, on y montera bientôt.' },
      { id: 'chemin', nom: 'Le chemin de derrière ▶', sous: 'vers la place des Mastres', type: 'bord', devant: [2826, 1164], dehors: [2930, 1140], zone: [2780, 1090, 2900, 1200], pousser: [1, 0],
        bientot: 'Le chemin de derrière longe les jardins jusqu’à la place des Mastres. Il viendra plus tard ; pour la place, prends le porche, au bout de la rue Soucolline.' },
      { id: 'rempart', nom: '◀ Le chemin du Rempart', sous: 'vers la Grand-Porte', type: 'bord', devant: [B.x0 + 40, 1640], dehors: [B.x0 - 60, 1640], zone: [B.x0, YN, B.x0 + 90, 1748], pousser: [-1, 0],
        bientot: 'Le chemin du Rempart longe la muraille jusqu’à la Grand-Porte. Le quartier du Rempart n’est pas encore fait : on y ira bientôt.' },
    );
    // les portes de la rue : la banque (dès le jour 4), le barbier (le jour, ouvert), les Mages (le jour, l'atelier ouvert), la
    // tente d'Ysmée (le jour, dès le jour 10)
    const battant = (X, cle, tx, ty, tl, th, tL, tH) => { const x0 = X - tL * 2 * F, y0 = YN + 2 * F - tH * 2 * F;   // (un battant peint dans une texture ×2, dans un lot)
      return { x: x0 + tx * 2 * F, y: y0 + ty * 2 * F, l: tl * 2 * F, h: th * 2 * F, yTri: YN + 0.5, src: { cle, x: tx, y: ty, l: tl, h: th } }; };
    { const B = BANQUE_VOLUME, P = battant(L.banque, banqueVolumeHD(s), 82 + B.ox, 118 + B.oy, 36, 46, B.L / 2 + B.ox, B.H + B.oy);
      ici.passages.push({ id: 'banque', nom: 'La Banque Centrale Goyenne', sous: 'la banque', verbe: 'entrer', type: 'porte', devant: [L.banque, YN + 22], dehors: [L.banque, YN - 6], porte: P, page: 'Banque',
        cadre: [P.x, P.y - 10, P.x + P.l, YN], zone: [L.banque - 55, YN, L.banque + 55, YN + 60], pousser: [0, -1],
        ferme: () => (typeof lieuDebloque === 'function' && G && !lieuDebloque(G, 'banque') ? 'La porte de la banque est close pour toi. Elle s\'ouvrira au jour 4.' : null) }); }
    if (barbierOuv && jour) { const RB = BARBIER_VOLUME, P = battant(L.barbier, barbierVolumeHD(s), 74 + RB.ox, 66 + RB.oy, 28, 32, RB.L / 2, RB.H), cx = P.x + P.l / 2;
      ici.passages.push({ id: 'barbier', nom: "Le Fil d'Argent", sous: 'chez Orvin, le barbier', verbe: 'entrer', type: 'porte', devant: [cx, YN + 22], dehors: [cx, YN - 6], porte: P, page: 'Barbier',
        cadre: [P.x - 4, P.y - 14, P.x + P.l + 4, YN], zone: [cx - 50, YN, cx + 50, YN + 60], pousser: [0, -1] }); }
    if (magesOuv && jour) ici.passages.push({ id: 'mages', nom: 'Les Mages-Charpentiers', sous: 'l’atelier', verbe: 'entrer', type: 'porte', devant: [L.mages + 6, YN + 22], dehors: [L.mages + 6, YN - 8], page: 'Mages',
      cadre: [L.mages - 50, YN - 100, L.mages + 62, YN], zone: [L.mages - 48, YN, L.mages + 60, YN + 60], pousser: [0, -1] });
    if (ysmee && jour) ici.passages.push({ id: 'ysmee', nom: 'Madame Ysmée', sous: 'sa tente, présages', verbe: 'entrer', type: 'porte', devant: [L.tente, YN + 26], dehors: [L.tente, YN - 6], page: 'Diseuse',
      cadre: [L.tente - 36, YN - 120, L.tente + 36, YN], zone: [L.tente - 60, YN + 8, L.tente + 60, YN + 64], pousser: [0, -1] });
    // le porche : le jour, la place des Mastres ; le soir, la place dort (sauf quand la nymphe attend : sa lueur)
    if (jour) ici.passages.push({ id: 'arche', nom: 'La place des Mastres ▲', sous: 'par l’arche des Mastres', type: 'porche', devant: [L.arche, YN + 22], dehors: [L.arche, YN - 40], cadre: [L.arche - 70, YN - 150, L.arche + 70, YN],
      zone: [L.arche - 70, YN, L.arche + 70, YN + 64], pousser: [0, -1], vers: { quartier: 'place', arrivee: 'arche' } });
    else if (nymphe) ici.passages.push({ id: 'nymphe', nom: 'La lueur de la fontaine', sous: 'sous le porche de la place', verbe: 'y aller', type: 'porche', devant: [L.arche, YN + 22], dehors: [L.arche, YN - 40], cadre: [L.arche - 70, YN - 150, L.arche + 70, YN],
      zone: [L.arche - 70, YN, L.arche + 70, YN + 64], pousser: [0, -1], page: 'Nymphe',
      surRetour: sc => { if (typeof nympheAttend === 'function' && !nympheAttend(sc.G)) { if (sc.lueurNymphe) { sc.lueurNymphe.destroy(); sc.lueurNymphe = null; } const p = sc.passages.find(q => q.id === 'nymphe'); if (p) { p.page = null; p.regard = true; p.texte = "La lueur s'est éteinte. La place dort ; l'eau de la fontaine murmure encore un peu."; } } } });
    else ici.regarder(L.arche - 120, YN - 240, L.arche + 120, YN + 4, "Le porche de la place des Mastres. Ses battants restent ouverts, mais la place dort : les étals rouvriront à l'aube.", [L.arche, YN + 36]);
    // le soir de la porte dérobée : au fond de l'impasse du Corbeau
    if (ouvertCeSoir) ici.passages.push({ id: 'porteDerobee', nom: 'La porte dérobée', sous: 'au fond de l’impasse du Corbeau', verbe: 'frapper', type: 'porte', devant: [L.impasse, YN + 22], dehors: [L.impasse, YN - 10],
      cadre: [L.impasse - 30, YN - 120, L.impasse + 30, YN], zone: [L.impasse - 50, YN, L.impasse + 50, YN + 60], pousser: [0, -1], action: sc => sc.allerAuMarcheNoir && sc.allerAuMarcheNoir() });
    s.porteComptoir = porteComptoir;
    // d'où l'on arrive : de chez soi (la porte), de la place (le porche), après la marche d'essai (devant le comptoir)
    ici.arrivees.apresEssai = { x: porteComptoir.cx + 200, y: 1650, vue: 'dos' };
    ici.arrivees.defaut = { x: porteComptoir.cx + 40, y: YN + 40, vue: 'face' };
    ici.pointsPassants = [[1200, 1640], [1500, 1660], [1760, 1600], [2000, 1680], [2400, 1640], [2700, 1660], [1615, 1300], [1615, 1150], [1300, 1140], [2000, 1150], [2400, 1140], [1700, 1780], [1520, 1700],
      [480, 1650], [800, 1680], [3000, 1650], [3300, 1670], [3600, 1640], [594, 1320], [800, 1140], [120, 1660]];
    // les grilles d'égout : dans le caniveau, un peu avant qu'il ne s'arrête au bord de la placette (ici.grille vérifie leur
    // place : tout le cadre sur le caniveau, loin des arbres, des piliers, des réverbères et des marches)
    { const rg = rigoleSoucolline(); for (const gx of [PL.x0 - 34 - 44, PL.x1 + 34 + 44, 760, 3060]) ici.grille(gx, (rg[0] + rg[1]) / 2); }
    vieDesBetesSoucolline(s, ici, betes);
  },
};

// (Q165, règle du joueur : tout ce qui est vivant s'anime) Les bêtes de la rue Soucolline :
//   - les pigeons picorent, hochent la tête, se gonflent, font quelques pas en sautillant ; celui de la margelle boit. Quand
//     JeuneGoy (ou un passant) s'approche, ils s'envolent à grands coups d'ailes et se reposent plus loin, sur le pavé ;
//   - le moineau du réverbère picore et se redresse ; les poissons nagent d'un bout à l'autre du bassin, la queue bat ;
//   - le chat de la fontaine bat de la queue, cligne des yeux, fait sa toilette (vieDuChatAssis) ; le chat roux des
//     Brindeloup respire en dormant sur ses bûches ;
//   - les papillons voltigent autour des fleurs (le paon du jour, posé, ouvre et ferme ses ailes) ; la libellule darde
//     au-dessus de l'eau.
function vieDesBetesSoucolline(s, ici, betes) {
  const C = ici.C, F = SOUCO.F, poser = (o, y) => { o.yTri = y; C.add(o); return o; };
  const pigeons = [], A = Phaser.Math.Between, al = (a, b) => a + Math.random() * (b - a);
  // une image qui bascule entre plusieurs images, à son rythme
  const basculer = (img, cles, delai, hasard = 0) => { let k = 0; const tick = () => { if (!img.active) return; k = (k + 1) % cles.length; img.setTexture(cles[k]); s.time.delayedCall(delai + Math.random() * hasard, tick); }; s.time.delayedCall(Math.random() * delai, tick); };
  const voleter = (img, cx, cy, r, ryv, duree, frames, f) => { basculer(img, frames, f, 30); let a = Math.random() * 6.28;
    const ev = s.time.addEvent({ delay: 30, loop: true, callback: () => { if (!img.active) return ev.remove(); a += 30 / duree * 6.28; const nx = Math.round(cx + Math.cos(a) * r + Math.sin(a * 2.7) * r * 0.25), ny = Math.round(cy + Math.sin(a * 1.6) * ryv); img.setFlipX(nx < img.x).setPosition(nx, ny); } }); };
  for (const b of betes) {
    if (b.sorte === 'pigeon') {
      // (Q172) espece 'moineau' : les mêmes manières, avec les images du moineau (posé, picore ; en vol, il bat des deux)
      // (phase 3, retour du joueur : « on ne voit même pas qu'il y a quelque chose ») les moineaux plus grands (1,2 au lieu de
      // 0,8), plus vifs (ils sautillent deux fois plus souvent), avec leur petite ombre
      const P = b.espece === 'moineau' ? { pre: 'moineau81_', debout: 'pose', picore: 'picore', gonfle: 'pose', boit: 'pose', ailes: 'picore', vol2: 'pose', echelle: 1.2, vif: 0.5 } : { pre: 'pigeon81_', debout: 'debout', picore: 'picore', gonfle: 'gonfle', boit: 'boit', ailes: 'ailes', vol2: 'gonfle', echelle: F, vif: 1 };
      const im = poser(s.add.image(b.x, b.y, P.pre + P[b.pose || 'debout']).setOrigin(0.5, 1).setScale(P.echelle).setFlipX(!!b.flip), b.y); im.mobile = true;   // (il s'envole : jamais rangé avec le décor immobile)
      if (b.espece === 'moineau') { const o = ici.ombre(b.x, b.y, 14); o.mobile = true; im.ombre = o; }
      pigeons.push({ img: im, P, boit: !!b.boit, vol: false, prochain: s.time.now + A(300, 1500) });
    } else if (b.sorte === 'chat') { const im = poser(s.add.image(b.x, b.y, 'chatRue_assis0').setOrigin(0.5, 1).setScale(F), b.y); im.mobile = true; vieDuChatAssis(s, im, 'chatRue', () => true, { bouge: b.bouge }); }
    else if (b.sorte === 'dort') basculer(b.img, [b.cle + '_dort0', b.cle + '_dort1'], 900, 200);
    else if (b.sorte === 'moineau') basculer(b.img, ['moineau81_pose', 'moineau81_picore', 'moineau81_pose'], 500, 700);
    else if (b.sorte === 'poisson') { const p = b.img; basculer(p, ['poisson81_0', 'poisson81_1'], 220 - b.k * 30);
      const aller = vers => { if (!p.active) return; s.tweens.add({ targets: p, x: vers ? b.xb : b.xa, duration: 5200 + b.k * 1300, ease: 'Sine.easeInOut', onStart: () => p.setFlipX(vers), onComplete: () => aller(!vers) }); }; aller(b.k % 2 === 0); }
    else if (b.sorte === 'papillon') voleter(poser(s.add.image(b.x, b.y, 'papillon81_' + b.nom + '0').setScale(F), b.y + 30), b.x, b.y, b.r, b.ry, b.duree, ['papillon81_' + b.nom + '0', 'papillon81_' + b.nom + '1'], 80);
    else if (b.sorte === 'papillonPose') basculer(poser(s.add.image(b.x, b.y, 'papillon81_' + b.nom + '0').setScale(F), b.y + 30), ['papillon81_' + b.nom + '0', 'papillon81_' + b.nom + '0', 'papillon81_' + b.nom + '1'], 420, 500);
    else if (b.sorte === 'libellule') { const lib = poser(s.add.image(b.x, b.y, 'libellule81_0').setScale(F), b.y + 40); basculer(lib, ['libellule81_0', 'libellule81_1'], 30, 10);
      const darder = () => { if (!lib.active) return; const x = b.x + al(-b.rx, b.rx), y = b.y + al(-b.ry, b.ry); lib.setFlipX(x > lib.x); s.tweens.add({ targets: lib, x, y, duration: 260, ease: 'Quad.easeOut', onComplete: () => s.time.delayedCall(A(400, 1600), darder) }); };
      s.time.delayedCall(800, darder); }
  }
  if (!pigeons.length) return;
  // où un pigeon peut se poser : un point libre du pavé (ni mur, ni obstacle), à bonne distance de JeuneGoy
  const posePossible = (x, y, h) => s.bloqueEn && !s.bloqueEn(x, y) && Math.hypot(x - h.x, y - h.y) > 160;
  const envol = (p, h) => {
    const im = p.img; let x = im.x, y = im.y;
    for (let k = 0; k < 30; k++) { const a = Math.random() * 6.28, d = al(180, 420), nx = im.x + Math.cos(a) * d, ny = im.y + Math.sin(a) * d * 0.45; if (posePossible(nx, ny, h)) { x = nx; y = ny; break; } }
    if (x === im.x && y === im.y) return;
    p.vol = true; p.boit = false; im.setFlipX(x < im.x); if (im.ombre) im.ombre.setAlpha(0);
    const x0 = im.x, y0 = im.y, d = Math.hypot(x - x0, y - y0), duree = Math.max(700, d * 2.4), haut = 40 + d * 0.18;
    let k = 0; const ailes = s.time.addEvent({ delay: 70, loop: true, callback: () => { if (im.active) im.setTexture(p.P.pre + (++k % 2 ? p.P.ailes : p.P.vol2)); } });
    im.yTri = 1e5;   // (en l'air : au-dessus de la rue)
    s.tweens.addCounter({ from: 0, to: 1, duration: duree, ease: 'Sine.easeInOut', onUpdate: tw => { if (!im.active) return; const u = tw.getValue(); im.setPosition(x0 + (x - x0) * u, y0 + (y - y0) * u - Math.sin(u * Math.PI) * haut); },
      onComplete: () => { ailes.remove(); if (!im.active) return; im.setTexture(p.P.pre + p.P.debout); im.yTri = im.y; p.vol = false; p.prochain = s.time.now + A(600, 1400); if (im.ombre) im.ombre.setPosition(im.x + 1, im.y - 2).setAlpha(1); } });
  };
  s.time.addEvent({ delay: 110, loop: true, callback: () => {
    const h = s.heros; if (!h || !h.active || s.planVille) return;
    const proches = [h, ...(s.passants || []).map(o => o.img)];
    for (const p of pigeons) {
      const im = p.img, T = p.P; if (p.vol || !im.active) continue;
      if (proches.some(o => o && Math.hypot(o.x - im.x, (o.y - im.y) * 1.4) < 76)) { envol(p, h); continue; }
      if (s.time.now < p.prochain) continue;
      const r = Math.random();
      if (p.boit) { im.setTexture(T.pre + (im.texture.key.endsWith(T.boit) ? T.debout : T.boit)); p.prochain = s.time.now + A(500, 1300); continue; }
      if (r < 0.42) { im.setTexture(T.pre + T.picore); s.time.delayedCall(A(160, 260), () => im.active && !p.vol && im.setTexture(T.pre + T.debout)); p.prochain = s.time.now + A(380, 900); }   // il picore, et relève la tête
      else if (r < 0.62) { im.setFlipX(!im.flipX); p.prochain = s.time.now + A(500, 1200); }                                                                                       // il tourne la tête, se retourne
      else if (r < 0.72) { im.setTexture(T.pre + T.gonfle); s.time.delayedCall(A(500, 900), () => im.active && !p.vol && im.setTexture(T.pre + T.debout)); p.prochain = s.time.now + A(900, 1600); }   // il se gonfle
      else {   // quelques pas, en sautillant (la tête qui va et vient)
        const sens = im.flipX ? -1 : 1, nx = im.x + sens * A(8, 18), ny = im.y + A(-3, 3);
        if (s.bloqueEn && s.bloqueEn(nx, ny)) { im.setFlipX(!im.flipX); p.prochain = s.time.now + 400; continue; }
        let k = 0; const pas = s.time.addEvent({ delay: 90, repeat: 3, callback: () => { if (im.active && !p.vol) im.setTexture(T.pre + (++k % 2 ? T.picore : T.debout)); } });
        s.tweens.add({ targets: im, x: nx, y: ny, duration: 360, onUpdate: () => { im.yTri = im.y; if (im.ombre) im.ombre.setPosition(im.x + 1, im.y - 2); }, onComplete: () => { pas.remove(); if (im.active && !p.vol) im.setTexture(T.pre + T.debout); } });
        p.prochain = s.time.now + A(700, 1500) * T.vif;
      }
    }
  } });
}

// (Q165) Le chat assis, vivant : il bat de la queue, et de temps en temps cligne des yeux, ou fait sa toilette (petits coups
// de langue, les yeux mi-clos). Les deux images en plus sont tirées de son image assise (creerChatHD, interieurHD.js : la
// tête de profil, l'œil en 26,6, la truffe en 29,7), pour tous les pelages. libre() : faux quand une scène le fait agir.
function gestesChatAssis(s, pref) {
  const k0 = pref + '_assis0';
  if (!s.textures.exists(k0) || s.textures.exists(pref + '_leche')) return;
  const src = s.textures.get(k0).getSourceImage();
  for (const [suffixe, langue] of [['_cligne', false], ['_leche', true]]) {
    const ct = s.textures.createCanvas(pref + suffixe, src.width, src.height), cx = ct.getContext();
    cx.drawImage(src, 0, 0); const im = cx.getImageData(0, 0, src.width, src.height), d = im.data;
    const px = (x, y) => (y * src.width + x) * 4, poser = (x, y, c) => { const i = px(x, y); d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255; };
    const i0 = px(23, 5), poil = [d[i0] * 0.45, d[i0 + 1] * 0.45, d[i0 + 2] * 0.45];
    poser(26, 6, poil); poser(27, 6, poil);   // l'œil fermé : un trait sombre
    if (langue) { poser(29, 8, [214, 96, 120]); poser(30, 8, [240, 150, 168]); }   // le bout de la langue, sous la truffe
    cx.putImageData(im, 0, 0); ct.refresh();
  }
}
// bouge: [x0, x1] : de temps en temps, il se lève, s'étire, et va se rasseoir un peu plus loin (proposition 3, validée)
// Rend un objet { arreter() } (alias remove) pour mettre fin à la vie du chat.
function vieDuChatAssis(s, im, pref, libre = () => true, { bouge = null } = {}) {
  gestesChatAssis(s, pref);
  const gestes = s.textures.exists(pref + '_leche'), marche = s.textures.exists(pref + '_m3') && s.textures.exists(pref + '_tapi');
  let q = 0, fini = false;
  const plusTard = (ms, f) => s.time.delayedCall(ms, () => { if (im.active && !fini) f(); });
  const tick = () => {
    if (!libre()) return plusTard(400, tick);
    const r = Math.random();
    if (bouge && marche && r < 0.025) {   // il s'étire (tapi, le dos rond), puis trottine vers une autre place, et se rassoit
      im.setTexture(pref + '_tapi');
      plusTard(700, () => { if (!libre()) return tick(); let nx = bouge[0] + Math.random() * (bouge[1] - bouge[0]); if (Math.abs(nx - im.x) < 40) nx = im.x + (nx < im.x ? -40 : 40); nx = Math.max(bouge[0], Math.min(bouge[1], nx));
        const d = Math.abs(nx - im.x); im.setFlipX(nx < im.x); let k = 0;
        const pas = s.time.addEvent({ delay: 110, loop: true, callback: () => { if (im.active && !fini) im.setTexture(pref + '_m' + (++k % 4)); } });
        s.tweens.add({ targets: im, x: nx, duration: d / 55 * 1000, onComplete: () => { pas.remove(); if (!im.active || fini) return; im.setTexture(pref + '_assis0'); im.setFlipX(Math.random() < 0.5); plusTard(900, tick); } }); });
    } else if (gestes && r < 0.12) { im.setTexture(pref + '_cligne'); plusTard(150, () => { if (libre()) im.setTexture(pref + '_assis0'); plusTard(300 + Math.random() * 500, tick); }); }   // il cligne
    else if (gestes && r < 0.19) {   // sa toilette : quatre à huit coups de langue
      const n = 4 + Math.floor(Math.random() * 5); let k = 0;
      const coup = () => { if (!libre()) return tick(); k++; im.setTexture(pref + (k % 2 ? '_leche' : '_cligne')); if (k < n * 2) plusTard(140, coup); else plusTard(160, () => { if (libre()) im.setTexture(pref + '_assis0'); plusTard(600, tick); }); };
      coup();
    } else { im.setTexture(pref + '_assis' + (++q % 2)); plusTard(380 + Math.random() * 260, tick); }   // la queue bat
  };
  plusTard(Math.random() * 500, tick);
  const h = { arreter: () => { fini = true; } }; h.remove = h.arreter; return h;
}

// (Q172, validé) La vie du sol de la rue Soucolline :
//   - le filet d'eau du caniveau scintille : de petits éclats qui glissent dans le sens de la pente (vers l'est) ; aux Brumes,
//     quelques feuilles mortes y flottent, en tournant un peu ;
//   - les jours de pluie, des flaques entre les pavés, sur la chaussée ; le soir, celles qui sont près d'un réverbère en
//     reflètent la lumière (un halo chaud qui tremble).
// hierMouille (Q198-4) : le lendemain d'un jour de pluie, le matin, les flaques sèchent (plus petites, plus pâles) ; le soir, sèches.
function vieDuSolSoucolline(s, ici, { rg, saison, mouille, nuit, PL, hierMouille = false }) {
  const C = ici.C, A = Phaser.Math.Between, al = (a, b) => a + Math.random() * (b - a);
  const poserSol = (o, d = 1) => { o.yTri = -1e6 + d; o.mobile = true; C.add(o); return o; };
  if (!s.textures.exists('eclatCaniveau')) { const t = s.textures.createCanvas('eclatCaniveau', 10, 2), c = t.getContext(); for (let x = 0; x < 10; x++) { const a = 1 - Math.abs(x - 4.5) / 5; c.fillStyle = `rgba(235,245,255,${(a * 0.9).toFixed(2)})`; c.fillRect(x, 0, 1, 1); c.fillStyle = `rgba(180,210,240,${(a * 0.5).toFixed(2)})`; c.fillRect(x, 1, 1, 1); } t.refresh(); }
  if (!s.textures.exists('feuilleCaniveau0')) for (let k = 0; k < 2; k++) { const t = s.textures.createCanvas('feuilleCaniveau' + k, 6, 4), c = t.getContext(); c.fillStyle = k ? '#b8641e' : '#8a4a16'; c.fillRect(1, 1, 4, 2); c.fillRect(2, 0, 2, 4); c.fillStyle = k ? '#d88a30' : '#a86220'; c.fillRect(1, 1, 2, 1); c.fillStyle = '#5a2e0c'; c.fillRect(0, 2, 1, 1); c.fillRect(5, 1, 1, 1); t.refresh(); }
  // les tronçons du caniveau (la placette et le seuil du porche l'interrompent)
  const yc = (rg[0] + rg[1]) / 2, troncons = [[400, PL.x0 - 40], [PL.x1 + 40, 3540], [3740, 3880]];
  for (const [xa, xb] of troncons) {
    const n = Math.max(1, Math.round((xb - xa) / 240));
    for (let i = 0; i < n; i++) {
      const e = poserSol(s.add.image(al(xa, xb), yc + al(-2, 2), 'eclatCaniveau').setScale(1.6).setAlpha(0), 2);
      const glisser = () => { if (!e.active) return; const x0 = al(xa, xb - 60); e.setPosition(x0, yc + al(-3, 3)).setAlpha(0);
        s.tweens.add({ targets: e, x: x0 + 60, alpha: { from: 0, to: 0.85 }, yoyo: true, duration: 1100, ease: 'Sine.easeInOut', onComplete: () => s.time.delayedCall(A(300, 1800), glisser) }); };
      s.time.delayedCall(A(0, 2000), glisser);
    }
    if (saison === 'brumes') for (let i = 0; i < Math.max(1, Math.round((xb - xa) / 420)); i++) {
      const f = poserSol(s.add.image(al(xa, xb), yc + al(-4, 4), 'feuilleCaniveau' + (i % 2)).setScale(1.6).setAngle(al(0, 360)), 3);
      const deriver = () => { if (!f.active) return; const d = al(120, 260); s.tweens.add({ targets: f, x: f.x + d, y: yc + al(-4, 4), angle: f.angle + al(-60, 60), duration: d / 14 * 1000, ease: 'Sine.easeInOut', onComplete: () => { if (f.x > xb - 10) f.setPosition(xa + 10, yc); s.time.delayedCall(A(200, 1500), deriver); } }); };
      s.time.delayedCall(A(0, 1500), deriver);
    }
  }
  if (!mouille && !(hierMouille && !nuit)) return;
  const seche = !mouille;
  if (!s.textures.exists('flaqueRue')) { const t = s.textures.createCanvas('flaqueRue', 48, 16), c = t.getContext();
    for (let y = 0; y < 16; y++) for (let x = 0; x < 48; x++) { const u = (x - 24) / 23, v = (y - 8) / 7, d = u * u + v * v + (hachage(x >> 2, y >> 1, 9731) - 0.5) * 0.3; if (d > 1) continue;
      const bord = d > 0.8, haut = y < 7 && u < 0.2; c.fillStyle = bord ? 'rgba(40,46,60,0.5)' : haut ? 'rgba(150,170,196,0.5)' : 'rgba(90,104,128,0.55)'; c.fillRect(x, y, 1, 1); } t.refresh(); }
  const lampes = (ici.lumieres || []).map(l => l[0]);
  for (let i = 0; i < 11; i++) {
    const x = 460 + i * 310 + hachage(i, 1, 9732) * 140, y = 1556 + hachage(i, 2, 9733) * 130;
    if ((x > PL.x0 - 40 && x < PL.x1 + 40) || Math.abs(x - 3640) < 100 || (y > rg[0] - 12 && y < rg[1] + 4)) continue;
    const f = poserSol(s.add.image(x, y, 'flaqueRue').setScale((1.4 + hachage(i, 3, 9734) * 0.8) * (seche ? 0.5 : 1), seche ? 0.7 : 1.4).setAlpha(seche ? 0.5 : 0.85), 1.5);
    const lampe = lampes.find(lx => Math.abs(lx - x) < 150);
    if (nuit && !seche && lampe !== undefined && s.textures.exists('halo')) { const h = poserSol(s.add.image(x + (lampe - x) * 0.15, y, 'halo').setScale(f.displayWidth / 64 * 0.7, 0.2).setTint(0xffc878).setAlpha(0.32).setBlendMode(Phaser.BlendModes.ADD), 1.6);
      s.tweens.add({ targets: h, alpha: 0.46, duration: 900 + A(0, 600), yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }); }
  }
}

// (le mécénat, planche 58) une bannière du Rempart, accrochée à une façade (dans un lot posé « à l'ancienne »)
function banniereRempart(s, x, y) {
  const b = s.add.container(x, y), g = s.add.graphics(); b.add(g);
  g.fillStyle(0x6a4a22).fillRect(-18, -4, 36, 4);
  g.fillStyle(0x2a5aa8).fillRect(-14, 0, 28, 54).fillTriangle(-14, 54, 14, 54, 0, 66).fillStyle(0xc9a227).fillRect(-14, 0, 28, 4).fillCircle(0, 22, 7).fillStyle(0xfff0a0).fillCircle(0, 22, 3);
  s.tweens.add({ targets: b, angle: 2, duration: 2200 + Math.abs(x) % 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  return b;
}
