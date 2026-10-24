// (planche 60 suite, validée) Le coin des chats : le grand panier d'osier pour deux, l'arbre à griffer (de la corde,
// deux plateaux), la petite cabane en bois à porte ronde, le coussin brodé d'un cœur, la pelote de laine ; et les deux
// gamelles, chacune à son nom.
function creerCoinChatsHD(scene) {
  if (scene.textures.exists('panierDoubleHD')) return;
  // --- Le grand panier d'osier, ovale, un coussin dedans ---
  {
    const t = toileDecor(70, 24);
    t.rampes.coussin = rampe(0x6a3a5a);
    t.forme('coussin', ellipsoide(35, 9, 30, 6), { motif: (x, y) => ((x + y) % 7 === 0 ? -0.6 : 0) });
    t.forme('chanvre', (x, y) => { const dx = (x + 0.5 - 35) / 34, dy = (y + 0.5 - 15) / 9; return dx * dx + dy * dy <= 1 && y >= 9 ? [dx * 0.6, dy - 0.2, 0.8] : null; },
      { motif: (x, y) => (((x >> 1) + (y >> 1)) % 2 ? 0.45 : -0.45) });
    for (let x = 2; x <= 67; x++) { const y = Math.round(9 + Math.pow(Math.abs(x - 35) / 33, 3) * 2); t.poser(x, y, 'chanvre', 5); t.poser(x, y + 1, 'chanvre', 3); }
    t.contour(); t.texture(scene, 'panierDoubleHD');
  }
  // --- L'arbre à griffer : un socle, deux poteaux de corde, deux plateaux garnis ---
  {
    const t = toileDecor(50, 76);
    t.rampes.feutre = rampe(0x5a6a3a);
    planche(t, 2, 70, 46, 6, 'chene', { graine: 961 });
    for (const [x, y0, y1] of [[12, 22, 70], [34, 44, 70]]) for (let y = y0; y < y1; y++) for (let x2 = x; x2 < x + 8; x2++) t.poser(x2, y, 'chanvre', (y % 3 === 0 ? 1 : 3) + (x2 === x ? -1 : x2 === x + 7 ? 1 : 0));
    for (const [x, y, l] of [[2, 16, 28], [24, 38, 24]]) { planche(t, x, y, l, 6, 'chene', { graine: 962 + x }); t.forme('feutre', ellipsoide(x + l / 2, y - 1, l / 2 - 1, 2.5), { decalage: 0.2 }); }
    // (une plume pend au bout d'une ficelle)
    for (let y = 22; y < 34; y++) t.poser(6, y, 'lin', 2);
    t.forme('tissuRouge', ellipsoide(6, 37, 2, 4), { decalage: 0.3 });
    t.contour(); t.texture(scene, 'arbreChatHD');
  }
  // --- La cabane : un toit de planches, une porte ronde, une petite plaque ---
  {
    const t = toileDecor(46, 42);
    for (let y = 14; y < 42; y += 7) planche(t, 4, y, 38, 7, 'chene', { graine: 970 + y });
    t.forme('encre', ellipsoide(23, 32, 8, 9), { decalage: -0.6, bord: false, ombre: false });
    for (let y = 0; y < 16; y++) { const w = Math.round(y * 1.45); for (let x = 23 - w; x <= 23 + w; x++) t.poser(x, y, 'cheneSombre', (x + y) % 4 === 0 ? 1 : y < 2 ? 5 : 3); }
    planche(t, 15, 18, 16, 4, 'laiton', { graine: 975 });
    t.contour(); t.texture(scene, 'cabaneChatHD');
  }
  // --- Le coussin brodé d'un cœur ---
  {
    const t = toileDecor(36, 12);
    t.rampes.coussin2 = rampe(0x3a5a8a);
    t.forme('coussin2', ellipsoide(18, 6.5, 17, 5.5), { motif: (x, y) => ((x + y) % 6 === 0 ? -0.6 : 0) });
    for (const [x, y] of [[16, 5], [20, 5], [15, 6], [16, 6], [17, 6], [19, 6], [20, 6], [21, 6], [16, 7], [17, 7], [18, 7], [19, 7], [20, 7], [17, 8], [18, 8], [19, 8], [18, 9]]) t.poser(x, y, 'tissuRouge', 4);
    t.contour(); t.texture(scene, 'coussinBrodeHD');
  }
  // --- La pelote de laine (un fil qui traîne) ---
  {
    const t = toileDecor(18, 10);
    t.forme('tissuRouge', ellipsoide(6, 5, 4.5, 4.2), { motif: (x, y) => ((x - y) % 3 === 0 ? -0.8 : 0) });
    for (let x = 10; x < 18; x++) t.poser(x, Math.round(8 + Math.sin(x) * 0.8), 'tissuRouge', 2);
    t.contour(); t.texture(scene, 'peloteHD');
  }
}

// Les éléments du coin, ce qu'ils coûtent et ce qu'ils font (le panier et les deux gamelles sont là dès le premier soir)
const COIN_CHATS = {
  panier: { nom: 'Le grand panier pour deux', prix: 0, texte: 'Ils y dorment en boule, serrés l’un contre l’autre.' },
  gamelles: { nom: 'Les deux gamelles à leur nom', prix: 0, texte: 'Une ration tous les trois jours chacun.' },
  arbre: { nom: "L'arbre à griffer", prix: 60, texte: 'Ils y font leurs griffes (et plus sur ta malle).' },
  coussin: { nom: 'Le coussin brodé', prix: 90, texte: 'Un cœur brodé : elle y dort quand il fume à la fenêtre.' },
  pelote: { nom: 'La pelote de laine', prix: 15, texte: 'Elle joue, il fait semblant de ne pas regarder.' },
  cabane: { nom: 'La cabane en bois', prix: 250, texte: 'Une maison à eux, avec une porte ronde. Assez grande pour plus tard...' },
};

// Le coin des chats posé au sol, à partir de x. `places` : où va chaque chose (en décalage depuis x ; le coussin peut
// avoir sa hauteur à lui, [dx, dy]) ; par défaut, l'arbre à gauche, le panier, les gamelles devant, la cabane à droite.
const PLACES_COIN = { arbre: 0, panier: 130, gamelles: 228, cabane: 300, pelote: 52, coussin: [300, -100] };
function dessinerCoinChats(scene, x, sol, { elements = ['panier', 'gamelles'], noms = ['', ''], profondeur = 2, places = PLACES_COIN, pleines = [true, true] } = {}) {
  creerCoinChatsHD(scene);
  const o = {}, P = { ...PLACES_COIN, ...places };
  if (elements.includes('arbre')) o.arbre = scene.add.image(x + P.arbre, sol, 'arbreChatHD').setOrigin(0.5, 1).setScale(2.4).setDepth(profondeur);
  if (elements.includes('cabane')) o.cabane = scene.add.image(x + P.cabane, sol, 'cabaneChatHD').setOrigin(0.5, 1).setScale(2.4).setDepth(profondeur);
  if (elements.includes('panier')) o.panier = scene.add.image(x + P.panier, sol + 6, 'panierDoubleHD').setOrigin(0.5, 1).setScale(2.4).setDepth(profondeur + 0.01);
  if (elements.includes('coussin')) o.coussin = scene.add.image(x + P.coussin[0], sol + P.coussin[1], 'coussinBrodeHD').setOrigin(0.5, 1).setScale(2.2).setDepth(profondeur + 0.02);
  if (elements.includes('pelote')) o.pelote = scene.add.image(x + P.pelote, sol + 12, 'peloteHD').setOrigin(0.5, 1).setScale(2.2).setDepth(profondeur + 0.03);
  if (elements.includes('gamelles')) {
    const g = o.gamelles = scene.add.graphics().setDepth(profondeur + 0.05);   // (devant le panier et la cabane)
    noms.forEach((n, i) => {
      const gx = x + P.gamelles + i * 66, gy = sol + 16;
      // (une gamelle en terre vernissée, son bord clair : qu'on la voie bien sur le plancher, même le soir)
      g.fillStyle(0x140c06, 0.45).fillEllipse(gx + 2, gy + 6, 62, 14);
      g.fillStyle(0x1a0e06).fillEllipse(gx, gy, 58, 22).fillStyle(0x7a4a22).fillEllipse(gx, gy, 54, 18).fillStyle(0xc89058).fillEllipse(gx, gy - 4, 50, 13).fillStyle(0x4a2a12).fillEllipse(gx, gy - 4, 40, 8);
      if (pleines[i]) for (let k = 0; k < 8; k++) g.fillStyle(k % 2 ? 0x7a3a14 : 0x9a5222).fillCircle(gx - 12 + (k % 4) * 8, gy - 5 - Math.floor(k / 4) * 2, 2.5);
      scene.add.text(gx, gy + 4, (n || '').toUpperCase().slice(0, 8), style(8, '#fff4dc', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 2 })).setOrigin(0.5).setDepth(profondeur + 0.06);
    });
  }
  return o;
}
