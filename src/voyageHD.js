// (v1.57) Les fenêtres du grand voyage et de Pont-Royal : la lettre du duc (au comptoir), la page du grand voyage
// (au bureau), la Halle des Bateliers, l'architecte du pont et le panneau de la ville basse (dans la rue du pont).

// Une fenêtre de parchemin par-dessus n'importe quelle page : on y pose textes et boutons, « fermer » range tout
function fenetrePR(scene, { titre, sous = '', l = 640, h = 420, y = 262, sceau = true, suite = null } = {}) {
  const voile = scene.add.rectangle(480, 270, 960, 540, 0x0a0604, 0.55).setDepth(80).setInteractive().setScrollFactor(0);
  const L = scene.add.container(480, y).setDepth(81).setScrollFactor(0);
  L.add(scene.add.image(0, 0, panneauHD(scene, l, h)).setScale(2));
  if (sceau) { const s = scene.add.container(0, -h / 2 + 30); s.add(scene.add.circle(0, 0, 19, 0x7a0e0e)); s.add(scene.add.circle(-1, -1, 16, 0xa81a18)); s.add(scene.add.text(0, 0, '♛', style(16, '#f3d98a')).setOrigin(0.5)); L.add(s); }
  L.add(scene.add.text(0, -h / 2 + (sceau ? 66 : 38), titre, style(19, '#5a0e0e', { fontStyle: 'bold', align: 'center', wordWrap: { width: l - 60 } })).setOrigin(0.5));
  if (sous) L.add(scene.add.text(0, -h / 2 + (sceau ? 90 : 62), sous, style(12, '#3b2410', { fontStyle: 'italic', align: 'center', wordWrap: { width: l - 60 } })).setOrigin(0.5));
  const objets = [voile, L];
  const f = {
    L, objets, haut: -h / 2 + (sceau ? 110 : 84),
    texte: (x, yy, t, taille = 13, coul = '#2a1a10', o = {}) => { const tx = scene.add.text(x, yy, t, style(taille, coul, { wordWrap: { width: o.l || l - 70 }, lineSpacing: 3, ...o })).setOrigin(o.ox ?? 0.5, o.oy ?? 0); L.add(tx); return tx; },
    bouton: (x, yy, larg, t, action) => { const b = creerBouton(scene, 480 + x, y + yy, larg, t, action); b.fond.setDepth(82).setScrollFactor(0); b.label.setDepth(82.1).setScrollFactor(0); objets.push(b); return b; },
    fermer: () => { if (!voile.active) return; for (const o of objets) { if (o.fond) { o.fond.destroy(); o.label.destroy(); } else o.destroy(); } if (suite) suite(); },
  };
  const indice = scene.add.text(950, 530, '▶ clique hors du parchemin pour refermer', style(12, '#d6bf98', { fontStyle: 'italic' })).setOrigin(1, 1).setDepth(82).setScrollFactor(0);
  objets.push(indice);
  voile.on('pointerdown', () => f.fermer());
  L.setScale(0.2).setAlpha(0);
  scene.tweens.add({ targets: L, scale: 1, alpha: 1, duration: 380, ease: 'Back.easeOut' });
  Son.jouer('page');
  return f;
}

// --- La lettre du duc, au comptoir ---
function lettreDuDuc(scene, suite) {
  const G = window.GAME;
  lireLettreDuc(G);
  const f = fenetrePR(scene, { titre: 'UNE LETTRE DE PONT-ROYAL', sous: 'Le sceau rouge du duc Aldebert Pansard, seigneur du Pont et des Deux Rives', h: 380, suite });
  f.texte(0, f.haut, '« Son Excellence le duc Aldebert Pansard, seigneur du Pont et des Deux Rives, a appris que votre modeste comptoir ne déshonore pas la Comté. Un lot vous attend sur Son pont. Les comptoirs de renom y sont les bienvenus... moyennant les droits d\'usage, la taxe du pont, la taxe des fenêtres et un petit présent d\'arrivée.\n\nOn vous attend avant l\'hiver. Ou après. Son Excellence est patiente, pas Sa trésorerie. »', 13, '#2a1a10', { fontStyle: 'italic', l: 560 });
  f.texte(0, 96, `Rien ne presse : la lettre reste sur ton bureau. Quand tu veux, au bureau : « Le grand voyage » (le lot coûte ${VOYAGE.lot} p., puis trois jours de préparatifs). Tu peux aussi rester dans la Comté.`, 12, '#4a3a1a', { l: 560 });
  if (typeof noterJournal === 'function') noterJournal('lettre du duc');
}

// --- La page du grand voyage, au bureau ---
function ouvrirPageVoyage(scene) {
  const G = window.GAME, v = etatVoyage(G);
  const f = fenetrePR(scene, { titre: 'Le grand voyage : Pont-Royal', sous: `${joursDeRoute(G)} jours de route avec tes ${(PATTES.sortes[(G.pattes && G.pattes.sorte) || 'chene'].nom).toLowerCase()} · ${heuresDeRoute(G)} h de bois à prévoir dans le filet`, l: 700, h: 460 });
  conditionsVoyage(G).forEach((c, i) => {
    const yy = f.haut + 6 + i * 62;
    f.L.add(scene.add.circle(-300, yy + 16, 13, c.ok ? 0x5a8a3a : 0x8a3a2a).setStrokeStyle(2, 0x2a1a0a));
    f.texte(-300, yy + 6, c.ok ? '✓' : '✗', 15, '#f6f0dc', { fontStyle: 'bold' });
    f.texte(-276, yy, c.nom, 15, '#8a3a1a', { fontStyle: 'bold', ox: 0 });
    f.texte(-276, yy + 22, c.detail, 12, '#3b2410', { ox: 0, l: 560 });
  });
  const pret = voyagePossible(G), y2 = f.haut + 196;
  let etat;
  if (v.depart) etat = `Le départ est fixé au jour ${v.depart} (dans ${v.depart - G.jour} jour${v.depart - G.jour > 1 ? 's' : ''}). Le filet : ${heuresDeBois(G)} h de bois sur ${heuresDeRoute(G)}. ${assezDeBois(G) ? 'C\'est assez.' : 'Il en manque : chez les Mages-Charpentiers ou chez Thorgal.'}`;
  else if (pret) etat = `Tout est prêt. Le lot du pont coûte ${VOYAGE.lot} p. (tu as ${Math.floor(G.argent)} p.). Une fois payé, trois jours pour faire le plein de bois et dire au revoir. Le bar et l'orphelinat continueront sans toi.`;
  else etat = 'Il faut remplir les trois conditions. Rester dans la Comté est toujours possible : rien ne presse.';
  f.texte(0, y2, etat, 13, '#2a1a10', { l: 600, align: 'center' });
  if (v.depart) f.bouton(0, 176, 300, 'Annuler le départ', () => { const r = annulerDepart(G); f.fermer(); if (r.texte) gainEnDirect(scene, 480, 300, r.texte, true, { taille: 13, duree: 3600 }); });
  else if (pret) f.bouton(0, 176, 340, `Fixer le jour du départ · ${VOYAGE.lot} p.`, () => {
    const r = fixerDepart(G);
    if (r.erreur) { Son.jouer('refus'); gainEnDirect(scene, 480, 450, r.erreur, false, { taille: 13, duree: 3200 }); return; }
    Son.jouer('pieces'); f.fermer();
    gainEnDirect(scene, 480, 300, `−${VOYAGE.lot} p. · départ au jour ${r.depart}`, false, { taille: 16, duree: 3200 });
    if (typeof noterJournal === 'function') noterJournal(`départ fixé au jour ${r.depart}`);
  });
}

// --- Pont-Royal : le panneau de la ville basse (dans la rue du pont) ---
function menuVilleBasse(scene) {
  const f = fenetrePR(scene, { titre: 'Pont-Royal, la ville basse', sous: 'Au bout du pont, passé la porte fortifiée', sceau: false, l: 520, h: 330 });
  f.texte(0, f.haut, 'Le marché, la banque et l\'atelier de l\'architecte sont dans la ville basse, au pied du pont.', 13, '#2a1a10', { l: 440, align: 'center' });
  f.bouton(0, -10, 300, 'Le marché', () => { f.fermer(); scene.passerPar('Marche'); });
  f.bouton(0, 50, 300, 'La banque', () => { f.fermer(); scene.passerPar('Banque'); });
  f.bouton(0, 110, 300, "L'architecte du pont", () => { f.fermer(); ouvrirArchitecte(scene); });
}

// --- L'architecte du pont : les quatre styles de maison ---
function ouvrirArchitecte(scene) {
  const G = window.GAME, P = etatPontRoyal(G);
  const f = fenetrePR(scene, { titre: "L'architecte du pont", sous: '« Votre chaumière est charmante. Pour la Comté. » Un style acheté se garde : on en change quand on veut.', sceau: false, l: 900, h: 470, y: 268 });
  ORDRE_STYLES_PONT_ROYAL.forEach((id, i) => {
    const s = STYLES_PONT_ROYAL[id], x = -330 + i * 220, a = P.styles.includes(id), actif = P.style === id;
    f.L.add(scene.add.rectangle(x, 4, 206, 300, actif ? 0xf6e2a8 : 0xefe0c0).setStrokeStyle(actif ? 3 : 2, actif ? 0xb8860b : 0x8a6a3a));
    f.L.add(scene.add.image(x, 30, maisonStylePR(scene, id)).setOrigin(0.5, 1).setScale(0.72));
    f.texte(x, 38, s.nom, 14, '#8a3a1a', { fontStyle: 'bold', l: 196, align: 'center' });
    f.texte(x, 60, s.texte, 11, '#3b2410', { l: 192, align: 'center' });
    f.bouton(x, 190, 196, actif ? 'Ta maison' : a ? 'La reprendre' : `${s.prix} p.`, () => {
      if (actif) return;
      const r = acheterStylePR(G, id);
      if (r.erreur) { Son.jouer('refus'); gainEnDirect(scene, 480 + x, 300, r.erreur, false, { taille: 12, duree: 2800 }); return; }
      Son.jouer('pieces'); f.fermer();
      if (!a) gainEnDirect(scene, 480, 300, `−${s.prix} p. · ${s.nom}`, false, { taille: 16, duree: 3000 });
      if (scene.scene && scene.scene.key === 'Rue') { scene.scene.restart({ depuis: 'architecte' }); }
    });
  });
  if (P.style) f.bouton(0, 236, 300, 'Remettre la chaumière', () => { remettreStyleComte(G); f.fermer(); if (scene.scene.key === 'Rue') scene.scene.restart({ depuis: 'architecte' }); });
}

// --- La Halle des Bateliers : la barge de la semaine (des caisses à prix de gros, et une curiosité d'ailleurs) ---
const HALLE = {
  caisses: [
    { id: 'ration', n: 10, prix: 24, nom: 'Une caisse de rations' }, { id: 'potion', n: 5, prix: 40, nom: 'Une caisse de potions' },
    { id: 'bandage', n: 8, prix: 25, nom: 'Un ballot de bandages' }, { id: 'torche', n: 10, prix: 24, nom: 'Un fagot de torches' },
    { id: 'corde', n: 6, prix: 24, nom: 'Un rouleau de cordes' }, { id: 'antidote', n: 4, prix: 26, nom: 'Une caisse d\'antidotes' },
  ],
  curiosites: [{ id: 'khopesh', n: 2, prix: 18 }, { id: 'griffes', n: 2, prix: 22 }, { id: 'rapiere', n: 2, prix: 26 }, { id: 'bambou', n: 3, prix: 15 }, { id: 'amulette', n: 1, prix: 26 }],
};
// La barge arrive chaque semaine : trois caisses et une curiosité, à prendre tant qu'elle est à quai (le stock baisse)
function bargeDeLaSemaine(G) {
  const P = etatPontRoyal(G), sem = Math.floor(G.jour / 7);
  if (!P.barge || P.barge.semaine !== sem) {
    const c = HALLE.caisses.map((x, i) => i).sort((a, b) => ((a * 7 + sem * 13) % 11) - ((b * 7 + sem * 13) % 11)).slice(0, 3);
    P.barge = { semaine: sem, offres: [...c.map(i => ({ ...HALLE.caisses[i], reste: 2 })), { ...HALLE.curiosites[sem % HALLE.curiosites.length], curiosite: true, reste: 1 }] };
  }
  return P.barge;
}
function acheterALaHalle(G, k) {
  const b = bargeDeLaSemaine(G), o = b.offres[k];
  if (!o || o.reste <= 0) return { erreur: 'Il n\'en reste plus sur la barge.' };
  if (!peutPayer(G, o.prix)) return { erreur: `Il te manque ${o.prix - Math.floor(G.argent)} pièces.` };
  payer(G, o.prix, 'marche');
  G.stock[o.id] = (G.stock[o.id] || 0) + o.n; o.reste--;
  return { texte: `+${o.n} ${ITEMS[o.id].nom.toLowerCase()}` };
}
function ouvrirHalle(scene) {
  const G = window.GAME, b = bargeDeLaSemaine(G);
  const f = fenetrePR(scene, { titre: 'La Halle des Bateliers', sous: '« Bienvenue sur le pont ! Ici, tout arrive par le fleuve. » La barge de la semaine est à quai.', sceau: false, l: 760, h: 440 });
  b.offres.forEach((o, k) => {
    const yy = f.haut + 4 + k * 58, it = ITEMS[o.id];
    f.L.add(scene.add.rectangle(0, yy + 20, 680, 52, o.curiosite ? 0xf2e0b0 : 0xefe4c8).setStrokeStyle(2, o.curiosite ? 0xb8860b : 0x8a6a3a));
    f.texte(-320, yy + 6, (o.curiosite ? `D'ailleurs : ${it.nom} ×${o.n}` : `${o.nom} (${it.nom.toLowerCase()} ×${o.n})`), 14, '#3b2410', { fontStyle: 'bold', ox: 0, l: 380 });
    f.texte(-320, yy + 26, o.curiosite ? 'Arrivé par le fleuve, d\'un autre royaume : on n\'en trouve pas au marché.' : `Prix de gros : ${o.prix} p. (au marché : ${it.prix * o.n} p.) · ${o.reste} sur la barge`, 11, '#5a4020', { ox: 0, l: 420 });
    const bt = f.bouton(250, yy + 20 - 0, 170, o.reste > 0 ? `${o.prix} p.` : 'Plus rien', () => {
      const r = acheterALaHalle(G, k);
      if (r.erreur) { Son.jouer('refus'); gainEnDirect(scene, 730, 262 + yy, r.erreur, false, { taille: 12, duree: 2600 }); return; }
      Son.jouer('pieces'); gainEnDirect(scene, 730, 262 + yy - 10, `${r.texte} · −${o.prix} p.`, true, { taille: 13 });
      f.fermer(); ouvrirHalle(scene);
    });
    if (o.reste <= 0) bt.fond.setAlpha(0.5);
  });
  f.texte(0, 168, 'Une nouvelle barge chaque semaine. Le batelier dit que, plus tard, on pourra envoyer des baluchons par le fleuve.', 11, '#5a4020', { fontStyle: 'italic', l: 640, align: 'center' });
}
