// Planche 79 : les deux imprévus joués dans la vraie scène du voyage, avec l'ogre et les pandas renégats à la place
// du « troll » et des brigands (le jeu n'est pas modifié : on remplace leurs dessins le temps de la photo).
// node imprevu79.js <prefixe> <troll|brigands> <choix#>
const { ouvrir } = require('../s164/base2');
const O = require('./ogre');
(async () => {
  const [pfx, id, choix] = process.argv.slice(2);
  const { b, p, errs, libre } = await ouvrir();
  await libre(`window.ogreHD = ogreHD;`, { outils: O, prep2: `G.pattes = { sorte: 'chene', filet: 0, bois: Array(12).fill('buche'), essais: 1, essaiJour: null }; G.argent = 6000; G.stock.ration = 5;`, attente: 300 });
  await p.evaluate(id => {
    // l'ogre à la place du dessin du troll (à sa vraie taille : deux fois et quelque un homme)
    const F = Phaser.GameObjects.GameObjectFactory.prototype, image0 = F.image;
    F.image = function (x, y, cle, f) { if (cle !== 'trollHD') return image0.call(this, x, y, cle, f);
      const im = image0.call(this, x + 95, y + 6, ogreHD(this.scene, { jambes: 'droit', bras: 'leve', visage: 'colere' }), f); const ech = im.setScale; im.setScale = function () { return ech.call(this, 0.8); }; window.__ogre = im; return im; };
    Object.assign(IMPREVUS.troll, { nom: 'L’ogre du péage', texte: 'Sous le petit pont, un ogre se lève du ruisseau, une marmite cabossée sur la tête, et lève sa massue au-dessus du chemin. « Péage ! Ou je mange une patte. »' });
    IMPREVUS.troll.choix[0].fait = G => { payer(G, 40, 'voyage'); if (window.__ogre) window.__ogre.setTexture(ogreHD(window.__ogre.scene, { bras: 'piece', visage: 'joie' })); return { texte: 'Il mord la pièce, la trouve bonne, et s’écarte en traînant les pieds dans l’eau.', gains: ['−40 p.'] }; };
    // les pandas renégats à la place des brigands
    Object.assign(FIGURANTS.brigand, { race: 'panda', nom: 'Wen Ombre-de-Bambou', costume: 'renegat', barbe: null });
    Object.assign(FIGURANTS.brigande, { race: 'panda', nom: 'Lin Patte-Grise', costume: 'renegat' });
    Object.assign(FIGURANTS.pillard, { race: 'panda', nom: 'Hao Sans-Serment', costume: 'renegat', barbe: null, peau: undefined });
    Object.assign(IMPREVUS.brigands, { nom: 'Les pandas renégats', texte: 'Trois pandas en capuche barrent la route, l’arc bandé. Sur leur poitrine, l’insigne de la Confrérie est rayé d’un coup de couteau. « Ta bourse, voyageur. Le Conseil ne nous paie plus depuis qu’on se souvient. »' });
    const G = GAME; partirEnVoyage(G); G.voyage.plan = [{ etapes: [], imprevu: id }, { etapes: [4], imprevu: null }];
    jeu.scene.getScenes(true).filter(s => s.scene.key !== 'Hud').forEach(s => s.scene.stop()); jeu.scene.start('Voyage'); }, id);
  let der = '', n = 0;
  for (let k = 0; k < 90; k++) {
    await p.waitForTimeout(600);
    const e = await p.evaluate(() => { const s = jeu.scene.getScene('Voyage'); if (!s || !s.ligne) return {}; return { clic: s.indiceClic.visible, soir: s.voile.alpha > 0.1, ligne: s.ligne.text.slice(0, 80),
      boutons: s.children.list.filter(o => o.type === 'Image' && o.input && o.input.enabled && o.depth === 42 && o.alpha > 0.9).map(o => [o.x, o.y]) }; });
    if (e.ligne !== der || (e.boutons && e.boutons.length)) { der = e.ligne; await p.waitForTimeout(700); await p.screenshot({ path: __dirname + '/' + pfx + '_' + String(n++).padStart(2, '0') + '.png' }); }
    if (e.soir) break;
    if (e.boutons && e.boutons.length) { const [x, y] = e.boutons[Math.min(Number(choix), e.boutons.length - 1)]; await p.mouse.click(x, y); continue; }
    if (e.clic) await p.mouse.click(480, 300);
  }
  console.log(n, errs.slice(0, 4)); await b.close();
})();
