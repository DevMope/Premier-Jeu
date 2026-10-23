// Planche 79 : l'ogre du péage (ses poses) et les pandas renégats (leur tenue)
const { ouvrir } = require('../s164/base2');
const O = require('./ogre');
const D = __dirname + '/';
const OUTILS = O + `
  const tag = (s, x, y, txt, coul = '#2a1a0c', o = 0.5, taille = 12) => s.add.text(x, y, txt, style(taille, coul, { fontStyle: 'bold', brut: true, backgroundColor: '#fff4dccc', padding: { x: 5, y: 2 }, align: 'center' })).setOrigin(o, 0.5).setDepth(80);
  const fondRive = s => { const g = s.add.graphics().setDepth(0); for (let y = 0; y < 540; y += 4) { const f = y / 540; g.fillStyle(Phaser.Display.Color.GetColor(150 + f * 40 | 0, 178 + f * 20 | 0, 190 - f * 30 | 0)).fillRect(0, y, 960, 4); }
    g.fillStyle(0x7a8a4a).fillRect(0, 440, 960, 100); g.fillStyle(0x6a7a3e).fillRect(0, 440, 960, 6); };
`;
const PANNEAUX = [
  { nom: 'p79_1', code: `
    fondRive(s);
    const P = [['droit','epaule','colere',0,'il garde le pont (il respire)'],['droit','leve','colere',0,'« Péage ! »'],['pas1','epaule','neutre',0,'il marche : pas 1'],['pas2','epaule','neutre',0,'pas 2'],['droit','piece','joie',0,'il mord la pièce'],['droit','epaule','larmes',0,'l’histoire le fait pleurer']];
    P.forEach(([j,b,v,r,t],i) => { const x = 82 + i * 150; s.add.image(x, 440, ogreHD(s, { jambes: j, bras: b, visage: v })).setOrigin(0.5, 1).setScale(0.62).setDepth(2); tag(s, x, 462, t, '#2a1a0c', 0.5, 11); });
    s.add.image(925, 440, corpsHD(s, { race: 'humain', nom: 'Aldric Merrow', niveau: 'aguerri' })).setOrigin(0.5, 1).setScale(6.4 * 0.125 * 0.62 / 0.8).setDepth(2);
    tag(s, 925, 462, 'un homme', '#2a1a0c', 0.5, 11);
    tag(s, 480, 500, 'deux fois et demie un homme · une marmite cabossée pour casque · un tablier rapiécé · la caisse du péage à la ceinture · une massue taillée dans un poteau de pont', '#2a1a0c', 0.5, 12).setWordWrapWidth(900);
    tag(s, 18, 22, 'L’ogre du péage (ce n’est plus un troll : les trolls sont un peuple du jeu)', '#2a1a0c', 0, 15);` },
  { nom: 'p79_3', code: `
    fondRive(s);
    const R = [['Wen Ombre-de-Bambou', 'arc', false, 'Wen, l’ancien sergent'], ['Lin Patte-Grise', 'dague', true, 'Lin, l’éclaireuse'], ['Hao Sans-Serment', 'baton', false, 'Hao, et son bâton']];
    R.forEach(([n, a, f, t], i) => { const x = 110 + i * 150; s.add.image(x, 440, corpsHD(s, { race: 'panda', nom: n, feminin: f, costume: 'renegat', niveau: 'aguerri', serieux: true, armeEmportee: a })).setOrigin(0.5, 1).setScale(1).setDepth(2); tag(s, x, 462, t, '#2a1a0c', 0.5, 11); });
    const V = [['face', 'de face'], ['profil', 'de profil'], ['dos', 'de dos']];
    V.forEach(([v, t], i) => { const x = 560 + i * 110; s.add.image(x, 440, corpsHD(s, { race: 'panda', nom: 'Wen Ombre-de-Bambou', costume: 'renegat', niveau: 'aguerri', serieux: true, armeEmportee: 'arc' }, null, v)).setOrigin(0.5, 1).setScale(1).setDepth(2); tag(s, x, 462, t, '#2a1a0c', 0.5, 11); });
    s.add.image(880, 440, corpsHD(s, { race: 'panda', nom: 'Bao Bambou-Doux', niveau: 'aguerri' })).setOrigin(0.5, 1).setScale(1).setDepth(2); tag(s, 880, 462, 'un panda du Monastère', '#2a1a0c', 0.5, 11);
    tag(s, 480, 500, 'le bleu passé de la Confrérie · une cape grise · les oreilles par deux fentes de la capuche · un foulard sur le museau · l’insigne de la Confrérie rayé d’un coup de couteau', '#2a1a0c', 0.5, 12).setWordWrapWidth(900);
    tag(s, 18, 22, 'Les pandas renégats, déserteurs de la Confrérie', '#2a1a0c', 0, 15);` },
];
(async () => {
  const { b, p, errs, libre } = await ouvrir();
  for (const P of PANNEAUX) { await libre(P.code, { outils: OUTILS, attente: 1200 }); await p.screenshot({ path: `${D}${P.nom}.png` }); }
  console.log('erreurs', errs.slice(0, 5)); await b.close();
})();
