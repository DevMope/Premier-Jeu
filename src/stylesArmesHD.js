// (retours sur la planche 86) Chaque arme a sa propre façon d'être tenue : les prises, les appuis des jambes et le placement des
// bras sont propres à chacune (l'épée à une main, la rapière en fente, la lance à deux mains inclinée, la hache à deux mains,
// la massue sur l'épaule, le bâton à deux mains, l'arc, l'arbalète à l'épaule, la dague en garde basse, les griffes...).
// Six moments par arme : garde, basse (garde basse), menace, armer (le geste qui précède le coup), attaque, recul.
// Chaque moment dit : d, le sens du bout de l'arme qui frappe (écran : [vers l'avant, vers le haut négatif]) ; j, les deux jambes
// ([cuisse, genou] : la proche, la lointaine) ; b, les deux bras ([épaule, coude, écart] : le proche tient l'arme) ; r, les
// angles du buste, de la tête et du corps entier ; dx, l'écart de la seconde main sur le manche (deux mains) ; x, des options.
// Les poses se nomment <moment><Arme> : gardeRapiere, attaqueLance...

const STYLES_ARMES = {
  // --- Les lames à une main ---
  epee: {   // l'épée à une main : la pointe en avant et en haut, l'autre main protège la poitrine
    garde: { d: [1, -0.75], j: [[-0.4, 0.35], [0.5, 0.7]], b: [[1.15, 0.65, 0.22], [0.85, 0.95, 0.35]], r: [6, -3] },
    basse: { d: [1, 0.32], j: [[-0.22, 0.12], [0.28, 0.3]], b: [[0.55, 0.45, 0.18], [0.15, 1.6, 0.45]], r: [-2, -6] },
    menace: { d: [-0.45, -0.9], j: [[-0.45, 0.2], [0.45, 0.4]], b: [[2.6, 0.9, 0.25], [1.55, 0.08, 0.12]], r: [4, 2], x: { boucheForcee: 2 } },
    armer: { d: [-0.55, -0.85], j: [[-0.4, 0.1], [0.5, 0.55]], b: [[2.75, 0.95, 0.25], [1.15, 0.5, 0.25]], r: [-7, 0] },
    attaque: { d: [1, 0.42], j: [[-0.6, 0.1], [0.75, 0.85]], b: [[1.35, 0.05, 0], [-0.55, 0.35, 0.35]], r: [13, -6] },
    recul: { d: [0.5, -1], j: [[-0.6, 0.75], [0.4, 0.1]], b: [[1.85, 0.95, 0.3], [1.35, 1.25, 0.5]], r: [-13, 9], x: { boucheForcee: 2 } },
  },
  epeecourte: {   // l'épée courte : on se ramasse, le coude collé, la lame au ras de la hanche, la main libre en balancier
    garde: { d: [1, -0.22], j: [[-0.5, 0.8], [0.7, 1.05]], b: [[0.95, 0.9, 0.2], [1.25, 0.7, 0.32]], r: [14, -6] },
    basse: { d: [0.9, 0.5], j: [[-0.3, 0.45], [0.5, 0.7]], b: [[0.45, 0.5, 0.15], [0.95, 0.9, 0.4]], r: [8, -4] },
    menace: { d: [0.55, -0.85], j: [[-0.45, 0.6], [0.6, 0.9]], b: [[2.1, 0.9, 0.22], [1.5, 0.5, 0.4]], r: [10, -2], x: { boucheForcee: 2 } },
    armer: { d: [1, -0.35], j: [[-0.55, 0.5], [0.65, 0.8]], b: [[0.3, 1.45, 0.2], [1.3, 0.6, 0.35]], r: [3, -2] },
    attaque: { d: [1, 0.1], j: [[-0.7, 0.3], [0.85, 1.1]], b: [[1.4, 0.05, 0.05], [-0.5, 0.3, 0.3]], r: [19, -8] },
    recul: { d: [1, -0.6], j: [[-0.6, 0.9], [0.3, 0.2]], b: [[0.9, 0.8, 0.25], [1.5, 0.4, 0.3]], r: [-10, 6], x: { boucheForcee: 2 } },
  },
  dague: {   // la dague : très bas, la lame près de la hanche, le coude plié, la main libre ouverte devant
    garde: { d: [1, 0.12], j: [[-0.45, 0.8], [0.75, 1.1]], b: [[0.7, 0.6, 0.2], [1.0, 0.9, 0.45]], r: [16, -8] },
    basse: { d: [0.75, 0.65], j: [[-0.25, 0.4], [0.4, 0.6]], b: [[0.25, 0.8, 0.15], [0.5, 1.3, 0.4]], r: [10, -5] },
    menace: { d: [-0.1, -1], j: [[-0.4, 0.5], [0.55, 0.8]], b: [[2.5, 0.7, 0.2], [1.4, 0.6, 0.4]], r: [8, 0], x: { boucheForcee: 2 } },
    armer: { d: [0.1, -1], j: [[-0.45, 0.4], [0.5, 0.7]], b: [[2.3, 0.9, 0.2], [1.1, 0.7, 0.4]], r: [-4, 0] },
    attaque: { d: [1, 0.55], j: [[-0.6, 0.4], [0.85, 1.0]], b: [[1.5, 0.3, 0.05], [-0.4, 0.4, 0.35]], r: [22, -10] },
    recul: { d: [0.9, -0.4], j: [[-0.55, 0.9], [0.3, 0.3]], b: [[0.9, 0.8, 0.25], [1.4, 0.7, 0.4]], r: [-8, 5] },
  },
  khopesh: {   // le khopesh : une lame de faucille qu'on lève et qu'on abat, le coude écarté
    garde: { d: [0.9, -0.55], j: [[-0.4, 0.4], [0.55, 0.7]], b: [[1.3, 0.7, 0.35], [0.9, 0.9, 0.4]], r: [7, -3] },
    basse: { d: [0.8, 0.5], j: [[-0.25, 0.2], [0.35, 0.4]], b: [[0.6, 0.5, 0.3], [0.2, 1.5, 0.5]], r: [0, -5] },
    menace: { d: [-0.3, -0.95], j: [[-0.45, 0.25], [0.5, 0.45]], b: [[2.65, 0.85, 0.35], [1.5, 0.2, 0.2]], r: [5, 2], x: { boucheForcee: 2 } },
    armer: { d: [-0.5, -0.85], j: [[-0.4, 0.2], [0.5, 0.6]], b: [[2.8, 1.0, 0.3], [1.1, 0.5, 0.3]], r: [-8, 0] },
    attaque: { d: [1, 0.6], j: [[-0.6, 0.15], [0.8, 0.9]], b: [[1.5, 0.15, 0.05], [-0.5, 0.4, 0.35]], r: [15, -6] },
    recul: { d: [0.55, -0.95], j: [[-0.6, 0.8], [0.4, 0.15]], b: [[1.9, 0.9, 0.35], [1.3, 1.2, 0.5]], r: [-12, 8] },
  },
  rapiere: {   // la rapière : en fente d'escrime, le bras long et tendu, la main libre en arrière, relevée
    garde: { d: [1, -0.1], j: [[0.55, 0.8], [-0.4, 0.45]], b: [[1.3, 0.25, 0.12], [2.9, 0.6, 0.5]], r: [4, -2] },
    basse: { d: [1, 0.22], j: [[0.45, 0.65], [-0.35, 0.35]], b: [[0.95, 0.3, 0.1], [2.4, 0.5, 0.5]], r: [2, -3] },
    menace: { d: [1, -0.5], j: [[0.6, 0.85], [-0.45, 0.5]], b: [[1.65, 0.45, 0.1], [3.0, 0.5, 0.5]], r: [5, -3], x: { boucheForcee: 2 } },
    armer: { d: [1, -0.32], j: [[0.5, 0.75], [-0.4, 0.45]], b: [[1.0, 0.85, 0.12], [2.9, 0.6, 0.5]], r: [-3, 0] },
    attaque: { d: [1, 0.02], j: [[1.1, 1.6], [-0.7, 0.02]], b: [[1.5, 0.0, 0.05], [3.4, 0.0, 0.4]], r: [15, -9] },
    recul: { d: [1, -0.85], j: [[0.3, 0.55], [-0.5, 0.5]], b: [[1.15, 0.9, 0.12], [2.5, 0.6, 0.5]], r: [-12, 5] },
  },
  massue: {   // la massue : à une main, sur l'épaule, puis le grand coup de haut en bas
    garde: { d: [0.35, -1], j: [[-0.4, 0.3], [0.5, 0.6]], b: [[2.4, 0.8, 0.2], [1.2, 0.5, 0.3]], r: [4, -2] },
    basse: { d: [0.7, 0.7], j: [[-0.25, 0.1], [0.3, 0.3]], b: [[0.7, 0.3, 0.15], [0.2, 0.4, 0.45]], r: [-2, -5] },
    menace: { d: [-0.2, -1], j: [[-0.45, 0.2], [0.5, 0.4]], b: [[2.7, 0.7, 0.2], [1.5, 0.1, 0.2]], r: [5, 2], x: { boucheForcee: 2 } },
    armer: { d: [-0.6, -0.8], j: [[-0.4, 0.15], [0.45, 0.55]], b: [[2.95, 1.0, 0.25], [1.0, 0.5, 0.3]], r: [-9, 3] },
    attaque: { d: [1, 0.8], j: [[-0.65, 0.1], [0.8, 0.9]], b: [[1.7, 0.2, 0.05], [-0.4, 0.4, 0.3]], r: [20, -8] },
    recul: { d: [0.4, -1], j: [[-0.6, 0.75], [0.4, 0.1]], b: [[1.9, 0.9, 0.3], [1.3, 1.1, 0.5]], r: [-13, 8] },
  },
  // --- Les armes à deux mains ---
  hache: {   // la hache : les deux mains sur le manche, la tête en haut ; on l'arme derrière l'épaule, on l'abat de tout le buste
    garde: { d: [0.45, -0.9], j: [[-0.4, 0.3], [0.45, 0.6]], b: [[1.0, 0.8, 0.15], null], dx: 10, r: [6, -3] },
    basse: { d: [0.85, 0.55], j: [[-0.25, 0.15], [0.3, 0.35]], b: [[0.55, 0.4, 0.1], null], dx: 9, r: [-2, -5] },
    menace: { d: [-0.15, -1], j: [[-0.45, 0.2], [0.5, 0.45]], b: [[2.3, 0.9, 0.15], null], dx: 10, r: [4, 2], x: { boucheForcee: 2 } },
    armer: { d: [-0.6, -0.8], j: [[-0.4, 0.15], [0.5, 0.55]], b: [[2.7, 0.9, 0.15], null], dx: 10, r: [-9, 0] },
    attaque: { d: [1, 0.7], j: [[-0.65, 0.1], [0.8, 0.9]], b: [[1.55, 0.3, 0.05], null], dx: 10, r: [21, -9] },
    recul: { d: [0.6, -0.8], j: [[-0.6, 0.75], [0.4, 0.1]], b: [[1.25, 0.9, 0.15], null], dx: 10, r: [-12, 8] },
  },
  lance: {   // la lance : la main arrière à la hanche, l'autre loin devant sur la hampe ; la pointe inclinée, jamais raide
    garde: { d: [1, -0.2], j: [[-0.45, 0.25], [0.6, 0.5]], b: [[0.55, 0.95, 0.2], null], dx: 17, r: [5, -2] },
    basse: { d: [1, 0.06], j: [[-0.35, 0.15], [0.45, 0.35]], b: [[0.4, 0.75, 0.2], null], dx: 17, r: [2, -4] },
    menace: { d: [1, -0.5], j: [[-0.5, 0.3], [0.65, 0.55]], b: [[0.9, 0.9, 0.2], null], dx: 16, r: [4, -1], x: { boucheForcee: 2 } },
    armer: { d: [1, -0.4], j: [[-0.5, 0.2], [0.6, 0.5]], b: [[2.3, 1.2, 0.2], null], dx: 12, r: [-8, 0] },
    attaque: { d: [1, -0.02], j: [[-0.7, 0.1], [0.95, 1.1]], b: [[1.3, 0.15, 0.1], null], dx: 19, r: [17, -6] },
    recul: { d: [1, -0.75], j: [[-0.6, 0.7], [0.4, 0.1]], b: [[1.1, 0.8, 0.2], null], dx: 14, r: [-10, 6] },
  },
  baton: {   // le bâton (et le bambou) : à deux mains, planté puis balancé ; le mage le pointe ou le lève, la pierre en haut
    garde: { d: [0.35, -1], j: [[-0.4, 0.2], [0.5, 0.45]], b: [[1.1, 0.5, 0.2], null], dx: 14, r: [3, -2] },
    basse: { d: [0.1, -1], j: [[-0.25, 0.1], [0.3, 0.25]], b: [[0.85, 0.5, 0.2], null], dx: 12, r: [0, -3] },
    menace: { d: [0.95, -0.4], j: [[-0.55, 0.15], [0.6, 0.6]], b: [[1.5, 0.15, 0.1], null], dx: 14, r: [8, -3], x: { boucheForcee: 2 } },
    armer: { d: [-0.4, -0.9], j: [[-0.4, 0.15], [0.5, 0.5]], b: [[2.6, 0.9, 0.2], null], dx: 12, r: [-7, 0] },
    attaque: { d: [1, -0.1], j: [[-0.55, 0.1], [0.65, 0.7]], b: [[1.5, 0.1, 0.1], null], dx: 15, r: [11, -4] },
    recul: { d: [0.5, -0.9], j: [[-0.6, 0.7], [0.4, 0.1]], b: [[1.3, 0.9, 0.3], null], dx: 13, r: [-12, 7] },
  },
  arbalete: {   // l'arbalète : la crosse à l'épaule, la main arrière à la poignée, l'autre sous le fût ; on la tient au creux de la hanche d'abord
    garde: { d: [1, -0.12], j: [[-0.35, 0.3], [0.45, 0.55]], b: [[0.8, 0.95, 0.15], null], dx: 9, r: [4, -2] },
    basse: { d: [1, 0.5], j: [[-0.25, 0.15], [0.3, 0.3]], b: [[0.55, 0.8, 0.15], null], dx: 9, r: [1, -4] },
    menace: { d: [1, -0.03], j: [[-0.5, 0.25], [0.6, 0.6]], b: [[1.4, 0.75, 0.1], null], dx: 9, r: [7, -4], x: { boucheForcee: 2 } },
    armer: { d: [0.45, 0.9], j: [[-0.4, 0.2], [0.5, 0.5]], b: [[0.5, 1.0, 0.15], null], dx: 9, r: [10, -4] },
    attaque: { d: [1, -0.05], j: [[-0.55, 0.25], [0.7, 0.7]], b: [[1.45, 0.7, 0.1], null], dx: 9, r: [5, -4] },
    recul: { d: [0.55, -0.7], j: [[-0.6, 0.7], [0.4, 0.1]], b: [[1.0, 1.1, 0.2], null], dx: 9, r: [-11, 6] },
  },
  // --- Les autres ---
  fronde: {   // la fronde : elle pend, elle tourne au-dessus de la tête, puis le bras se détend
    garde: { d: [0.4, 1], j: [[-0.3, 0.15], [0.35, 0.3]], b: [[0.5, 0.4, 0.15], [0.9, 0.5, 0.3]], r: [3, -2] },
    basse: { d: [0.15, 1], j: [[-0.2, 0.1], [0.25, 0.2]], b: [[0.35, 0.3, 0.1], [0.4, 0.4, 0.3]], r: [0, -3] },
    menace: { d: [-0.35, -1], j: [[-0.35, 0.1], [0.4, 0.3]], b: [[2.9, 0.2, 0.15], [0.9, 0.5, 0.3]], r: [-6, 0], x: { boucheForcee: 2 } },
    armer: { d: [-0.35, -1], j: [[-0.35, 0.1], [0.4, 0.3]], b: [[2.9, 0.2, 0.15], [0.9, 0.5, 0.3]], r: [-6, 0] },
    attaque: { d: [1, 0.6], j: [[-0.6, 0.1], [0.7, 0.8]], b: [[1.75, 0.1, 0], [-0.4, 0.3, 0.3]], r: [12, -4] },
    recul: { d: [0.6, 0.8], j: [[-0.55, 0.7], [0.4, 0.1]], b: [[0.9, 0.7, 0.2], [1.2, 0.8, 0.4]], r: [-10, 6] },
  },
  griffes: {   // les griffes de fer : accroupi, les deux mains en avant comme un fauve
    garde: { d: [1, -0.15], j: [[-0.5, 0.85], [0.75, 1.1]], b: [[1.25, 0.6, 0.15], [1.0, 0.85, 0.4]], r: [16, -9] },
    basse: { d: [0.9, 0.35], j: [[-0.3, 0.45], [0.5, 0.7]], b: [[0.6, 0.5, 0.15], [0.5, 0.7, 0.4]], r: [10, -6] },
    menace: { d: [0.6, -0.8], j: [[-0.5, 0.7], [0.7, 1.0]], b: [[2.2, 0.8, 0.2], [2.0, 0.8, 0.45]], r: [12, -4], x: { boucheForcee: 2 } },
    armer: { d: [0.3, -0.95], j: [[-0.5, 0.6], [0.6, 0.9]], b: [[2.7, 0.8, 0.2], [1.6, 1.0, 0.4]], r: [2, -2] },
    attaque: { d: [1, 0.5], j: [[-0.7, 0.4], [0.9, 1.1]], b: [[1.6, 0.2, 0.05], [0.7, 0.5, 0.4]], r: [23, -10] },
    recul: { d: [0.8, -0.5], j: [[-0.6, 0.9], [0.35, 0.3]], b: [[1.1, 0.8, 0.2], [1.0, 1.0, 0.4]], r: [-6, 5] },
  },
};
// le marteau a la prise de la hache, le bambou celle du bâton
STYLES_ARMES.marteau = STYLES_ARMES.hache; STYLES_ARMES.bambou = STYLES_ARMES.baton;

const MOMENTS_ARMES = ['garde', 'basse', 'menace', 'armer', 'attaque', 'recul'];
const nomPoseArme = (moment, arme) => moment + arme.charAt(0).toUpperCase() + arme.slice(1);

// Les bras posés : l'épaule, le coude et l'écart (brasA) ; la main libre d'une arme à deux mains est placée par dessinerPoseHD
function inscrireStylesArmes() {
  const R = (r) => (R0, k) => ({ buste: { a: r[0], px: R0.cx, py: R0.yB }, tete: { a: r[1], px: R0.cx, py: R0.yT }, ...(r[2] ? { global: { a: r[2], px: R0.cx, py: R0.sol } } : {}) });
  for (const [arme, moments] of Object.entries(STYLES_ARMES)) for (const m of MOMENTS_ARMES) {
    const s = moments[m]; if (!s) continue;
    const bras = s.b, jam = s.j;
    const dir = { lame: s.d, masse: s.d, hampe: s.d, baton: s.d };
    POSES_HD[nomPoseArme(m, arme)] = {
      arme, moment: m, dirArme: s.d, deux: s.dx || 0,
      armeMain: armeEnMain(dir, s.dx || 0),
      membres: {
        jambeP: { p: jam[0][0], f: jam[0][1] }, jambeL: { p: jam[1][0], f: jam[1][1] },
        brasP: { p: bras[0][0], f: bras[0][1], a: bras[0][2] }, ...(bras[1] ? { brasL: { p: bras[1][0], f: bras[1][1], a: bras[1][2] } } : {}),
      },
      extra: { fache: true, ...(s.x || {}) }, rig: R(s.r),
    };
  }
}
inscrireStylesArmes();

// L'arc a ses deux poses (bandé, lâché) ; l'arc baissé et l'arc en recul sont des variantes
(() => {
  const P = POSES_HD;
  P.basseArc = { arc: true, armeMain: arcEnMain(false), membres: { jambeP: { p: -0.2, f: 0.1 }, jambeL: { p: 0.25, f: 0.12 }, brasL: { p: 0.95, f: 0.25, a: 0.1 }, brasP: { p: 0.3, f: 0.45, a: 0.2 } }, extra: { fache: true }, rig: (R) => ({ buste: { a: 2, px: R.cx, py: R.yB } }) };
  P.reculArc = { arc: true, armeMain: arcEnMain(false), membres: { jambeP: { p: -0.55, f: 0.7 }, jambeL: { p: 0.4, f: 0.1 }, brasL: { p: 1.1, f: 0.4, a: 0.2 }, brasP: { p: 0.9, f: 0.9, a: 0.35 } }, extra: { fache: true, boucheForcee: 2 }, rig: (R) => ({ buste: { a: -12, px: R.cx, py: R.yB }, tete: { a: 8, px: R.cx, py: R.yT } }) };
})();

// La paire (armer, frapper) de chaque arme, pour le voyageur ; et tous les noms de poses de combat
const POSES_COMBAT = {};
for (const arme of Object.keys(STYLES_ARMES)) POSES_COMBAT[arme] = [nomPoseArme('armer', arme), nomPoseArme('attaque', arme)];
POSES_COMBAT.arc = ['arcBande', 'arcTire'];
const POSES_COMBAT_NOMS = new Set([...Object.keys(POSES_HD).filter(n => POSES_HD[n].armeMain || POSES_HD[n].bouclier)]);
// Les postures d'un combattant des récits, selon son arme : garder, menacer, frapper, reculer
function posesActeur(arme) {
  if (arme === 'arc') return { garde: 'arcTire', basse: 'basseArc', menace: 'arcBande', recul: 'reculArc', attaque: 'arcTire', armer: 'arcBande' };
  const s = STYLES_ARMES[arme] ? arme : 'epee';
  return Object.fromEntries(MOMENTS_ARMES.map(m => [m, nomPoseArme(m, s)]));
}
