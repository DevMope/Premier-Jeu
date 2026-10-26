// (planche 85 v2, validée) L'écran de l'armoire de la chambre, à deux onglets :
//  - « Mes vêtements » : les couleurs du haut, du bas et des bottes (on les change chaque jour, quand on veut), et les
//    accessoires achetés chez Marcelline, à porter ou à ranger (l'armoire remplace la malle au pied du lit) ;
//  - « Mes pyjamas » : celui de cette nuit (les six, ceux qu'on n'a pas encore sont chez Marcelline).
// À gauche, le joueur tel qu'il sera (de la place pour un adulte, un chapeau, un bonnet de nuit).
//   ouvrirArmoireEcran(scene, { onglet, quandFini(changement) }) : changement = { habits: bool, avant: { haut, bas, bottes } }

const ARMOIRE_ECRAN = { x0: 350, x1: 860, parPage: 5 };

function ouvrirArmoireEcran(scene, { onglet = 'vetements', quandFini = null } = {}) {
  const G = window.GAME, ap = G.joueur.apparence;
  const avant = couleursHabits(G), avantApp = { haut: ap.haut, bas: ap.bas, bottes: ap.bottes }, avantTenue = (G.tenue || []).join(',');
  const boite = scene.add.container(0, 0).setDepth(60);
  const fixe = o => { o.setScrollFactor(0); boite.add(o); return o; };
  const T = (x, y, t, taille = 13, couleur = '#3b2410', o = {}) => fixe(scene.add.text(x, y, t, style(taille, couleur, { fontStyle: 'bold', ...o })));
  // (un texte qui ne tient pas dans sa place rapetisse, puis se resserre : il ne déborde jamais)
  const tenir = (t, largeur) => { for (let f = parseInt(t.style.fontSize, 10); t.width > largeur && f > 8; f--) t.setFontSize(f); if (t.width > largeur) t.setScale(largeur / t.width, 1); return t; };
  fixe(scene.add.rectangle(480, 270, 960, 540, 0x0a0604, 0.6).setInteractive());
  fixe(scene.add.image(480, 270, panneauHD(scene, 800, 470)).setScale(2));
  T(480, 62, 'Ton armoire', 22).setOrigin(0.5);
  creerIconesHD(scene);
  // --- l'aperçu : le joueur, de face, dans un cadre ---
  const cadre = fixe(scene.add.graphics());
  cadre.fillStyle(0x6a4a2a).fillRoundedRect(102, 88, 224, 360, 12).fillStyle(0xeee2c6).fillRoundedRect(105, 91, 218, 354, 10);
  const apercu = fixe(scene.add.image(214, 412, '__DEFAULT').setOrigin(0.5, 1));
  const legende = T(214, 428, '', 11, '#6b4a2a', { fontStyle: 'italic', align: 'center', wordWrap: { width: 200 } }).setOrigin(0.5, 0);
  let nApercu = 0;
  const peindreApercu = (pyj) => {
    const cle = 'armoireApercu_' + (++nApercu % 2);
    if (scene.textures.exists(cle)) scene.textures.remove(cle);
    (pyj ? dessinerJoueurNuit(G, pyj, { vue: 'face' }) : dessinerJoueurHD(apparenceDuJour(G), stadeJoueur(G), G.joueur.feminin, 0, G.tenue || [], 'face')).texture(scene, cle);
    const h = scene.textures.get(cle).getSourceImage().height;
    apercu.setTexture(cle).setScale(Math.min(echelleJoueur(10), 300 / h));
    legende.setText(pyj ? 'Cette nuit, pour dormir' : "Ce que tu portes aujourd'hui");
  };
  // --- les onglets ---
  const { x0, x1 } = ARMOIRE_ECRAN, contenu = [];
  const vider = () => { for (const o of contenu) o.destroy(); contenu.length = 0; };
  const C = o => { fixe(o); contenu.push(o); return o; };
  const CT = (x, y, t, taille = 13, couleur = '#3b2410', o = {}) => C(scene.add.text(x, y, t, style(taille, couleur, { fontStyle: 'bold', ...o })));
  const ongletsG = fixe(scene.add.graphics());
  const onglets = [['vetements', 'Mes vêtements'], ['pyjamas', 'Mes pyjamas']];
  const lo = (x1 - x0) / 2;
  const titres = onglets.map(([id, nom], i) => {
    const t = T(x0 + i * lo + lo / 2, 100, nom, 14).setOrigin(0.5);
    const z = fixe(scene.add.zone(x0 + i * lo + lo / 2, 100, lo - 8, 28).setInteractive({ useHandCursor: true }));
    z.on('pointerdown', () => { if (onglet !== id) { onglet = id; Son.jouer('page'); dessiner(); } });
    return t;
  });
  let page = 0;
  const infobulle = scene.add.text(0, 0, '', style(11, '#fff4dc', { fontStyle: 'bold', backgroundColor: '#2a1a10dd', padding: { x: 5, y: 2 } })).setOrigin(0.5, 1).setVisible(false);
  const dessiner = () => {
    vider(); infobulle.setVisible(false);
    ongletsG.clear();
    onglets.forEach(([id], i) => { const sel = id === onglet; ongletsG.fillStyle(sel ? 0x8a3a1a : 0xc8b088).fillRoundedRect(x0 + i * lo + 3, 86, lo - 6, 28, 6); titres[i].setColor(sel ? '#f8e8c8' : '#3b2410'); });
    ongletsG.fillStyle(0x8a3a1a).fillRect(x0, 114, x1 - x0, 2);
    if (onglet === 'vetements') dessinerVetements(); else dessinerPyjamas();
  };
  // --- « Mes vêtements » : les couleurs, puis les accessoires ---
  const dessinerVetements = () => {
    peindreApercu(null);
    CT(x0, 128, 'Les habits', 14);
    const rangee = (py, titre, cle, liste) => {
      CT(x0, py, titre, 12, '#5a3a1a').setOrigin(0, 0.5);
      const g = C(scene.add.graphics()), debut = x0 + 102, pas = Math.min(22, Math.floor((x1 - debut) / liste.length)), r = Math.floor(pas / 2) - 1;
      liste.forEach(([nom, c], i) => {
        const px = debut + i * pas + pas / 2, choisi = (ap[cle] ?? 0) === i;
        g.fillStyle(0x3b2410).fillRect(px - r, py - r, 2 * r, 2 * r).fillStyle(c).fillRect(px - r + 2, py - r + 2, 2 * r - 4, 2 * r - 4);
        if (choisi) g.lineStyle(3, 0xf0c020).strokeRect(px - r - 2, py - r - 2, 2 * r + 4, 2 * r + 4);
        const z = C(scene.add.zone(px, py, pas, 2 * r + 2).setInteractive({ useHandCursor: true }));
        z.on('pointerover', () => infobulle.setText(nom).setPosition(px, py - r - 4).setVisible(true));
        z.on('pointerout', () => infobulle.setVisible(false));
        z.on('pointerdown', () => { if (ap[cle] === i) return; ap[cle] = i; Son.jouer('glisse'); dessiner(); });
      });
    };
    rangee(158, 'Habit du haut', 'haut', APPARENCE.haut);
    rangee(184, 'Habit du bas', 'bas', APPARENCE.bas);
    rangee(210, 'Bottes', 'bottes', APPARENCE.bottes);
    CT(x0, 232, 'Les accessoires', 14);
    tenir(CT(x0 + 128, 235, '(ce que tu as acheté chez Marcelline)', 11, '#6b4a2a', { fontStyle: 'italic' }), x1 - x0 - 128);
    const ids = Object.keys(GARDE_ROBE).filter(id => possede(G, id)), parPage = ARMOIRE_ECRAN.parPage, nPages = Math.max(1, Math.ceil(ids.length / parPage));
    page = Math.min(page, nPages - 1);
    if (!ids.length) CT((x0 + x1) / 2, 320, "Rien pour l'instant : Marcelline, au marché, a de quoi remplir ton armoire.", 13, '#6b4a2a', { fontStyle: 'italic', align: 'center', wordWrap: { width: x1 - x0 - 40 } }).setOrigin(0.5);
    ids.slice(page * parPage, page * parPage + parPage).forEach((id, i) => {
      const y = 274 + i * 34, d = GARDE_ROBE[id], porte_ = porte(G, id);
      C(scene.add.image(x0 + 12, y, iconeObjet(scene, id)).setScale(1.6).setAlpha(porte_ ? 1 : 0.6));
      tenir(CT(x0 + 32, y, d.nom, 13).setOrigin(0, 0.5), 220);
      tenir(CT(x0 + 262, y, porte_ ? (d.f ? 'portée' : 'porté') : "rangé dans l'armoire", 11, porte_ ? '#2f6a2a' : '#8a6a4a', { fontStyle: 'italic' }).setOrigin(0, 0.5), 150);
      const b = creerBouton(scene, x1 - 46, y, 92, porte_ ? 'Ranger' : 'Porter', () => {
        basculerTenue(G, id); Son.jouer('glisse'); dessiner();
      });
      b.label.setFontSize(14);
      C(b.fond); C(b.label);
    });
    if (nPages > 1) {
      const py = 274 + parPage * 34 - 6;
      CT((x0 + x1) / 2, py, `${page + 1} / ${nPages}`, 12, '#5a3a1a').setOrigin(0.5);
      for (const [dx, sens, t] of [[-60, -1, '◀'], [60, 1, '▶']]) {
        const f = CT((x0 + x1) / 2 + dx, py, t, 18, '#8a3a1a').setOrigin(0.5).setInteractive({ useHandCursor: true });
        f.on('pointerdown', () => { page = (page + sens + nPages) % nPages; Son.jouer('page'); dessiner(); });
      }
    }
  };
  // --- « Mes pyjamas » : six cartes ---
  const dessinerPyjamas = () => {
    const nuit = pyjamaDeCetteNuit(G);
    peindreApercu(nuit);
    const ids = Object.keys(PYJAMAS), lc = (x1 - x0 - 20) / 3, hc = 144;
    ids.forEach((id, i) => {
      const cx = x0 + (i % 3) * (lc + 10), cy = 124 + Math.floor(i / 3) * (hc + 8), p = PYJAMAS[id], a = aPyjama(G, id), sel = a && id === nuit;
      const g = C(scene.add.graphics());
      g.fillStyle(sel ? 0xf0c020 : a ? 0xeadcbc : 0xcfc2a6).fillRoundedRect(cx, cy, lc, hc, 8);
      if (sel) g.lineStyle(3, 0x8a3a1a).strokeRoundedRect(cx, cy, lc, hc, 8);
      tenir(CT(cx + lc / 2, cy + 6, p.nom, 11, a ? '#3b2410' : '#6a5a48', { align: 'center', wordWrap: { width: lc - 12 } }).setOrigin(0.5, 0), lc - 10);
      // le joueur dans ce pyjama, en petit (de trois-quarts)
      const cle = `armoirePyj_${id}_${signatureCorpsJoueur(G).replace(/[^\w]/g, '')}`;
      if (!scene.textures.exists(cle)) dessinerJoueurNuit(G, id).texture(scene, cle);
      const h = scene.textures.get(cle).getSourceImage().height;
      C(scene.add.image(cx + lc / 2, cy + hc - 24, cle).setOrigin(0.5, 1).setScale(Math.min(0.7, 76 / h)).setAlpha(a ? 1 : 0.55));
      const v = ventePyjama(G, id);
      const bas = sel ? '✓ cette nuit' : a ? 'Choisir' : v.enVente ? `Marcelline · ${p.prix} p.` : p.cadeau && v.quand !== 'revient au Givre' ? 'Cadeau du Long Hiver' : v.quand.replace(/^r/, 'R');
      tenir(CT(cx + lc / 2, cy + hc - 12, bas, 11, sel ? '#5a2a0a' : a ? '#2f6a2a' : '#7a6a58', { fontStyle: a ? 'bold' : 'italic' }).setOrigin(0.5), lc - 10);
      if (p.chaud) tenir(CT(cx + 8, cy + hc - 40, 'chaud', 10, '#8a3a1a', { fontStyle: 'bold italic' }), 50);
      if (a && !sel) {
        const z = C(scene.add.zone(cx + lc / 2, cy + hc / 2, lc, hc).setInteractive({ useHandCursor: true }));
        z.on('pointerdown', () => { choisirPyjama(G, id); Son.jouer('glisse'); dessiner(); });
      }
    });
    CT((x0 + x1) / 2, 441, 'Le pyjama ne se porte que pour dormir : tu le mets en te couchant, et tu reprends tes habits au réveil.', 11, '#6b4a2a', { fontStyle: 'italic', align: 'center', wordWrap: { width: x1 - x0 } }).setOrigin(0.5, 0.5);
  };
  fixe(infobulle);
  dessiner();
  const fin = creerBouton(scene, 480, 478, 240, "Refermer l'armoire", () => {
    const habits = ap.haut !== avantApp.haut || ap.bas !== avantApp.bas || ap.bottes !== avantApp.bottes || (G.tenue || []).join(',') !== avantTenue;
    for (const k of ['armoireApercu_0', 'armoireApercu_1']) if (scene.textures.exists(k)) { apercu.setTexture('__DEFAULT'); scene.textures.remove(k); }
    boite.destroy();
    const nuit = scene.scene.get('Nuit');
    if (nuit && nuit.lieu) Sauvegarde.planifier(G, nuit.lieu);
    if (quandFini) quandFini({ habits, avant });
  });
  fin.label.setFontSize(16);
  fixe(fin.fond); fixe(fin.label);
  Son.jouer('porte');
  return boite;
}

// Le tourbillon sur un personnage quelconque (la promenade du soir) : la tenue change au plus fort
function tourbillonTenue(scene, sprite, avant, changer, profondeur = null) {
  return new Promise(ok => {
    const cj = couleursHabits(window.GAME), haut = sprite.displayHeight + 8;
    const tb = tourbillonHD(scene, sprite.x, sprite.y + 6, haut, [avant.haut, avant.bas, cj.haut, cj.bas, 0xe8dcc0, 0xfff4c8], profondeur ?? sprite.depth + 0.3);
    Son.jouer('glisse');
    let fait = false;
    scene.tweens.addCounter({ from: 0, to: 1, duration: 800, onUpdate: tw => {
      const u = tw.getValue(), force = Math.sin(u * Math.PI);
      tb.maj(force, u * 9); sprite.setAlpha(1 - force * 0.75);
      if (!fait && u > 0.45) { fait = true; changer(); }
    }, onComplete: () => { tb.detruire(); sprite.setAlpha(1); ok(); } });
  });
}
