// (planche 66, à valider) Le Parrain : les accessoires de la révélation. Le grand fauteuil de cuir à oreilles, le haut
// tabouret (sous la robe, il fallait bien monter à hauteur d'homme), le gant noir (la Main Noire, c'est lui), la robe
// tombée en tas, et la patère du coin des chats (où pendent ses chapeaux).
function creerParrainHD(scene) {
  if (scene.textures.exists('fauteuilParrainHD')) return;
  // --- Le fauteuil : cuir sang-de-bœuf capitonné, oreilles, accoudoirs roulés, pieds tournés ---
  {
    const t = toileDecor(60, 64);
    t.rampes.cuir = rampe(0x6a1a16);
    const capiton = (x, y) => (((x + 3) % 7 === 0 && (y + 2) % 7 === 0) ? -1.4 : ((x + 3) % 7 < 2 && (y + 2) % 7 < 2 ? -0.5 : 0));
    t.forme('cuir', (x, y) => (x >= 9 && x <= 50 && y >= 3 && y <= 46 ? [(x - 29.5) / 24, (y - 3) / 60 - 0.4, 0.8] : null), { motif: capiton });   // le dossier
    for (const sx of [-1, 1]) t.forme('cuir', ellipsoide(30 + sx * 20, 14, 6, 11), { decalage: -0.15, motif: capiton });                   // les oreilles
    t.forme('cuir', ellipsoide(30, 44, 21, 5), { decalage: 0.25 });                                                                       // l'assise, son coussin
    for (const sx of [-1, 1]) {                                                                                                          // les accoudoirs roulés
      t.forme('cuir', (x, y) => (Math.abs(x + 0.5 - (30 + sx * 24)) <= 6 && y >= 30 && y <= 54 ? [sx * 0.5, 0, 0.8] : null), { decalage: -0.1 });
      t.forme('cuir', ellipsoide(30 + sx * 24, 30, 6.8, 3.6), { decalage: 0.35 });
      for (let y = 34; y <= 52; y += 3) t.poser(30 + sx * 24 + (sx > 0 ? -5 : 5), y, 'laiton', 4);                                     // (les clous dorés)
    }
    t.forme('cuir', (x, y) => (x >= 7 && x <= 53 && y >= 48 && y <= 55 ? [0, 0.3, 0.9] : null), { decalage: -0.2 });                  // le devant
    for (const x of [10, 49]) for (let y = 55; y < 64; y++) t.poser(x + (y > 60 ? (x < 30 ? -1 : 1) : 0), y, 'cheneSombre', y % 3 ? 3 : 4), t.poser(x + 1, y, 'cheneSombre', 2);
    t.contour(); t.texture(scene, 'fauteuilParrainHD');
  }
  // --- Le haut tabouret de bar (trois pieds, un barreau) ---
  {
    const t = toileDecor(22, 40);
    t.forme('chene', ellipsoide(11, 3, 10, 2.6), { decalage: 0.3 });
    for (const [a, b] of [[4, 2], [11, 11], [18, 20]]) for (let y = 5; y < 40; y++) { const x = Math.round(a + (b - a) * (y - 5) / 35); t.poser(x, y, 'chene', 3); t.poser(x + 1, y, 'chene', 2); }
    for (let x = 4; x <= 18; x++) t.poser(x, 26, 'chene', 4);
    t.contour(); t.texture(scene, 'tabouretHautHD');
  }
  // --- Le gant noir : cuir luisant, une couture, le revers ---
  {
    const t = toileDecor(16, 18);
    t.rampes.gant = rampe(0x1c1a20);
    t.forme('gant', ellipsoide(8, 11, 4.6, 4.2));
    for (const [x, h] of [[4.6, 6.5], [6.9, 8.5], [9.2, 8], [11.4, 6.2]]) traitHD(t, 'gant', [[x, 9], [x, 9 - h * 0.62]], 1.05);
    traitHD(t, 'gant', [[4.2, 12], [1.6, 9.6]], 1.1);                       // (le pouce)
    t.forme('gant', (x, y) => (x >= 4 && x <= 12 && y >= 14 && y <= 17 ? [0, 0.5, 0.8] : null), { decalage: 0.4 });   // (le revers)
    for (let y = 9; y < 14; y++) t.poser(8, y, 'gant', 1);
    t.contour(); t.texture(scene, 'gantNoirHD');
  }
  // --- La robe noire tombée en tas (la capuche par-dessus) ---
  {
    const t = toileDecor(56, 22);
    t.rampes.robe = rampe(0x24202a);
    t.forme('robe', ellipsoide(28, 16, 27, 6), { motif: (x, y) => (Math.sin(x * 0.7 + y * 0.3) > 0.6 ? -0.6 : 0) });
    t.forme('robe', ellipsoide(20, 11, 11, 6), { motif: (x, y) => (Math.sin(x * 0.9) > 0.7 ? -0.5 : 0) });
    t.forme('robe', ellipsoide(38, 10, 8, 6), { decalage: 0.2 });           // (la capuche, vide)
    t.forme('encre', ellipsoide(39, 11, 4, 3.4), { bord: false, ombre: false });
    t.contour(); t.texture(scene, 'robeTombeeHD');
  }
  // --- La souris blanche (elle se blottit sur ses genoux : même les souris travaillent pour lui) ---
  {
    const t = toileDecor(18, 10);
    t.rampes.souris = rampe(0xe8e4e0); t.rampes.rose = rampe(0xe0909a);
    traitHD(t, 'rose', [[3, 7], [1, 5], [1.5, 2.5]], 0.5);
    t.forme('souris', ellipsoide(8, 6.5, 5.5, 3.4));
    t.forme('souris', ellipsoide(13, 5.5, 3, 2.6), { decalage: 0.2 });
    t.forme('rose', ellipsoide(12, 2.8, 1.4, 1.4)); t.poser(16, 5, 'rose', 3); t.poser(14, 5, 'encre', 0);
    t.contour(); t.texture(scene, 'sourisBlancheHD');
  }
  // --- La patère du coin des chats : un pied de bois, quatre crochets ---
  {
    const t = toileDecor(30, 70);
    planche(t, 4, 64, 22, 6, 'chene', { graine: 991 });
    for (let y = 6; y < 64; y++) { t.poser(14, y, 'chene', 3); t.poser(15, y, 'chene', 2); }
    t.forme('chene', ellipsoide(14.5, 5, 2.4, 2.4), { decalage: 0.3 });
    for (const [x, y, sx] of [[10, 12, -1], [19, 12, 1], [9, 26, -1], [20, 26, 1]]) for (let k = 0; k < 4; k++) t.poser(x + sx * k * 0.75 | 0, y + (k === 3 ? -1 : 0), 'laiton', 4);
    t.contour(); t.texture(scene, 'patereChatHD');
  }
}
