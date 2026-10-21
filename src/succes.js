// (v1.35) Les succès, façon Steam (la page du bureau viendra avec la planche 61) : une liste, ce que tu as débloqué et
// quand, et la vignette qui glisse en haut à droite quand tu en débloques un.
const SUCCES = {
  coeurDeChat: { nom: 'Cœur de chat', texte: 'Sauver la compagne de ton chat au Vieux Moulin', icone: '🐾♥' },
  repertoireComplet: { nom: 'Le répertoire complet', texte: 'Voir Caramel souffler toutes ses formes de fumée', icone: '💨', cache: true },
};
function succesDe(G) { return (G.succes = G.succes || {}); }
function aLeSucces(G, cle) { return !!(G.succes && G.succes[cle]); }
// Débloquer : renvoie vrai la première fois (la vignette attend alors d'être montrée)
function debloquerSucces(G, cle) {
  if (!SUCCES[cle] || aLeSucces(G, cle)) return false;
  succesDe(G)[cle] = G.jour;
  (G.succesAMontrer = G.succesAMontrer || []).push(cle);
  return true;
}
// La vignette : un cadre sombre, l'icône dans son carré doré, « SUCCÈS DÉBLOQUÉ », le nom, la ligne ; elle glisse,
// reste un moment, puis repart. (Fixée à l'écran, au-dessus de tout.)
function vignetteSucces(scene, cle, { x = 770, y = 92, duree = 4200 } = {}) {
  const S = SUCCES[cle]; if (!S) return null;
  const c = scene.add.container(x + 420, y).setScrollFactor(0).setDepth(2000);
  c.add(scene.add.rectangle(0, 0, 380, 74, 0x14181e, 0.96).setStrokeStyle(2, 0x5a6a7a));
  c.add(scene.add.rectangle(-150, 0, 58, 58, 0x2a3a4a).setStrokeStyle(2, 0xc9a227));
  c.add(scene.add.text(-150, 0, S.icone, style(20, '#f3d98a')).setOrigin(0.5));
  c.add(scene.add.text(-112, -26, 'SUCCÈS DÉBLOQUÉ', style(11, '#8ab0d0', { fontStyle: 'bold' })));
  c.add(scene.add.text(-112, -10, S.nom, style(16, '#ffffff', { fontStyle: 'bold' })));
  c.add(scene.add.text(-112, 12, S.texte, style(11, '#b8c4d0', { wordWrap: { width: 280 } })));
  if (typeof Son !== 'undefined') Son.jouer('succes');
  scene.tweens.add({ targets: c, x, duration: 450, ease: 'Back.easeOut' });
  scene.time.delayedCall(duree, () => scene.tweens.add({ targets: c, x: x + 420, duration: 400, ease: 'Quad.easeIn', onComplete: () => c.destroy() }));
  const G = window.GAME;
  if (G && G.succesAMontrer) G.succesAMontrer = G.succesAMontrer.filter(k => k !== cle);
  return c;
}
// Montrer celles qui attendent (une à la fois, l'une après l'autre)
function montrerSuccesEnAttente(scene) {
  const G = window.GAME;
  if (!(G && G.succesAMontrer && G.succesAMontrer.length)) return;
  [...G.succesAMontrer].forEach((k, i) => scene.time.delayedCall(600 + i * 4800, () => vignetteSucces(scene, k)));
}
