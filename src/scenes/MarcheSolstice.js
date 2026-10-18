// (v1.00, lot B-3a, planches 22 v3 et 22b v2) Le marché pendant la Fête du Solstice : les lampions, les
// bannières de la Confrérie, le tir à l'arc du sergent Aubrin à la place du coin des jeux, et l'étal
// de l'Union chez Marcelline (les atours, et la bénédiction du comptoir par Frère Anselme).
Object.assign(MarcheScene.prototype, {
  // Un lampion de papier, ses deux chapeaux sombres et sa lueur
  texLampion(couleur) {
    const cle = 'lampion_' + couleur.toString(16);
    if (this.textures.exists(cle)) return cle;
    const g = this.make.graphics({ add: false });
    g.fillStyle(0x2a1a10).fillRect(4, 0, 6, 3).fillRect(4, 17, 6, 3);
    g.fillStyle(couleur).fillEllipse(7, 10, 14, 15);
    g.fillStyle(0xffffff, 0.35).fillEllipse(5, 8, 4, 8);
    g.fillStyle(0x000000, 0.18); for (const y of [6, 10, 14]) g.fillRect(1, y, 12, 1);
    g.fillStyle(0xf0c040).fillRect(6, 20, 2, 3);
    g.generateTexture(cle, 14, 23); g.destroy();
    return cle;
  },

  // Une guirlande de lampions entre x0 et x1 (fil qui pend), dans le conteneur `c`
  guirlandeLampions(c, x0, x1, y, creux, pas, echelle = 1) {
    const g = this.add.graphics(); g.lineStyle(1, 0x3b2410, 0.9);
    const fil = x => y + Math.sin((x - x0) / (x1 - x0) * Math.PI) * creux;
    g.beginPath(); g.moveTo(x0, fil(x0)); for (let x = x0; x <= x1; x += 8) g.lineTo(x, fil(x)); g.strokePath();
    c.add(g);
    const couleurs = [0xe8603a, 0xf0b040, 0xe84a5a, 0xf08a3a];
    for (let x = x0 + pas / 2, k = 0; x < x1; x += pas, k++) {
      const l = this.add.image(x, fil(x) - 1, this.texLampion(couleurs[k % couleurs.length])).setOrigin(0.5, 0).setScale(echelle);
      c.add(l);
      this.tweens.add({ targets: l, angle: { from: -4, to: 4 }, duration: 1400 + (k % 3) * 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  },

  // Une grande bannière de la Confrérie, pendue à la traverse d'un mât planté (rien ne flotte)
  banniereConfrerie(c, x, ySol, h, echelle = 1) {
    creerEmblemesHD(this);
    const g = this.add.graphics();
    const e = echelle, haut = ySol - h;
    g.fillStyle(0x3a2410).fillRect(x - 3 * e, haut, 6 * e, h);                 // le mât
    g.fillStyle(0x5a3a20).fillRect(x - 2 * e, haut, 2 * e, h);
    g.fillStyle(0x3a2410).fillRect(x - 30 * e, haut + 8 * e, 60 * e, 5 * e);    // la traverse
    g.fillStyle(0xd8b048).fillCircle(x, haut, 4 * e);                         // la pomme d'or
    g.fillStyle(0x2a4a8a).fillRect(x - 26 * e, haut + 13 * e, 52 * e, 70 * e);  // la bannière
    g.fillTriangle(x - 26 * e, haut + 83 * e, x + 26 * e, haut + 83 * e, x, haut + 98 * e);
    g.lineStyle(2 * e, 0xe8e0d0).strokeRect(x - 26 * e, haut + 13 * e, 52 * e, 70 * e);
    g.fillStyle(0xd8b048); for (let k = 0; k < 5; k++) g.fillRect(x - 24 * e + k * 11 * e, haut + 10 * e, 3 * e, 5 * e);   // les anneaux
    c.add(g);
    c.add(this.add.image(x, haut + 46 * e, 'embleme_confrerie').setScale(0.9 * e));
  },

  // La vue d'ensemble en fête : lampions au-dessus de la place, deux bannières, l'étal de l'Union
  decorFeteVue() {
    const c = this.vue;
    this.guirlandeLampions(c, 30, 930, 96, 26, 46);
    this.banniereConfrerie(c, 46, 330, 230, 0.9);
    this.banniereConfrerie(c, 914, 330, 230, 0.9);
  },

  // La rue en fête : des lampions d'un étal à l'autre (seulement de près)
  decorFeteRue() {
    const c = this.add.container(0, 0);
    for (let x = 0; x < LARGEUR_MARCHE; x += 380) this.guirlandeLampions(c, x, x + 380, 30, 22, 38);
    this.monde.add(c);
    this.monde.moveAbove(c, this.paveRue);   // (derrière les étals, devant le ciel)
    this.etiquettesRue.push(c);
  },

  // --- Le tir à l'arc de la Confrérie (planche 22b v2, A) ---
  creerTirArc(x0) {
    const avant = this.children.list.length;
    creerEmblemesHD(this);
    this.add.image(x0, 252, etalHD(this, 0x2a4a8a)).setOrigin(0.5, 1).setScale(2);
    this.add.text(x0, 92, "TIR À L'ARC", style(12, '#fff4dc', { fontStyle: 'bold', stroke: '#10204a', strokeThickness: 4 })).setOrigin(0.5);
    imageCorps(this, x0 - 10, 226, 'garde', 4.5);   // le sergent Aubrin
    const g = this.add.graphics();
    // un arc posé sur la table, un carquois et ses flèches
    g.lineStyle(3, 0x6a4020); g.beginPath(); g.arc(x0 - 40, 214, 16, Math.PI * 1.15, Math.PI * 1.85); g.strokePath();
    g.lineStyle(1, 0xe8e0d0).lineBetween(x0 - 40 + 16 * Math.cos(Math.PI * 1.15), 214 + 16 * Math.sin(Math.PI * 1.15), x0 - 40 + 16 * Math.cos(Math.PI * 1.85), 214 + 16 * Math.sin(Math.PI * 1.85));
    g.fillStyle(0x5a3a20).fillRect(x0 + 26, 196, 10, 20); for (let k = 0; k < 4; k++) { g.fillStyle(0x8a6a40).fillRect(x0 + 27 + k * 2, 186, 1, 12); g.fillStyle(0xf4f0e8).fillRect(x0 + 26 + k * 2, 184, 2, 4); }
    // la bannière de la Confrérie accrochée à son poteau
    g.fillStyle(0x5a3a20).fillRect(x0 - 92, 120, 40, 4);
    g.fillStyle(0x2a4a8a).fillRect(x0 - 88, 124, 32, 50); g.fillTriangle(x0 - 88, 174, x0 - 56, 174, x0 - 72, 186); g.lineStyle(2, 0xd8d8e0).strokeRect(x0 - 88, 124, 32, 50);
    // la cible de paille sur son chevalet
    const cx = x0 + 78, cy = 210;
    g.fillStyle(0x5a3a20).fillRect(cx - 14, 214, 4, 38).fillRect(cx + 10, 214, 4, 38).fillRect(cx - 2, 222, 4, 30);
    for (const [r, c] of [[20, 0xc8a050], [17, 0xf4f0e8], [13, 0xc83a20], [9, 0xf4f0e8], [5, 0x2a4a8a], [2, 0xf0c040]]) g.fillStyle(c).fillCircle(cx, cy, r);
    // le mât et son fanion rouge, planté sur l'auvent
    g.fillStyle(0x4a3018).fillRect(x0 + 40, 54, 3, 34); g.fillStyle(0xc83a20).fillTriangle(x0 + 43, 55, x0 + 62, 60, x0 + 43, 66);
    this.add.image(x0 - 72, 148, 'embleme_confrerie').setScale(0.55);
    this.etiquettesRue.push(this.add.text(x0, 262, "Le tir à l'arc", style(13, '#fff4dc', { fontStyle: 'bold', stroke: '#2a1a10', strokeThickness: 4 })).setOrigin(0.5));
    this.add.rectangle(x0, 190, 190, 130, 0xffffff, 0).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.ouvrirTirArc());
    this.grouper(avant, x0);
  },

  ouvrirTirArc() {
    const G = this.G;
    this.montrer('jeux');
    const c = this.panneau("Le tir à l'arc de la Confrérie", 'Tenu par le sergent Aubrin, le temps de la Fête du Solstice');
    const T = SOLSTICE.tir, reste = partiesTirRestantes(G);
    c.add(this.add.text(40, 344, `Trois flèches pour viser le cœur de la cible : la largeur, la hauteur, puis la puissance.\n${T.prix} pièces la partie · lots : ${T.lots.map(l => `${l.score} points, ${l.argent} p.${l.trefle ? ' et un trèfle' : ''}`).reverse().join(' · ')}\nBattre le record du sergent : le titre « Œil du Rempart » (+${T.reputationTitre} de réputation).`,
      style(12, '#3b2410', { lineSpacing: 3, wordWrap: { width: 470 } })));
    const s = etatSolstice(G);
    c.add(this.add.text(40, 420, `Meilleur score du jour : le sergent Aubrin, ${recordTir(G)}${s.meilleur ? ` · ton meilleur : ${s.meilleur}` : ''}${G.titreRempart === s.an ? ' · tu es « Œil du Rempart » !' : ''}`, style(12, '#6b4a2a', { fontStyle: 'italic' })));
    c.add(this.add.text(820, 446, reste > 0 ? `encore ${reste} partie${reste > 1 ? 's' : ''} aujourd'hui` : 'plus de partie aujourd\'hui', style(11, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5));
    const b = creerBouton(this, 820, 408, 190, `Jouer (${T.prix} p.)`, () => {
      if (this.jeuLance || this.sortieEnCours()) return;   // (v1.07 : un double-clic faisait payer deux parties ; v1.08 : ni pendant une sortie)
      const erreur = commencerTir(G);
      if (erreur) return this.message(erreur, '#a03030');
      this.jeuLance = true; this._transition = performance.now(); Sauvegarde.maintenant(G, 'Marche');   // (la partie est payée, même si l'on recharge)
      Son.jouer('pieces');
      this.cameras.main.fadeOut(400);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('TirArc', { retour: 'Marche' }));
    });
    c.add([b.fond, b.label]);
    // le mât de cocagne, dressé à côté : main gauche, main droite
    const resteM = partiesMatRestantes(G);
    const m = creerBouton(this, 600, 408, 190, `Le mât (${SOLSTICE.mat.prix} p.)`, () => {
      if (this.jeuLance || this.sortieEnCours()) return;
      const erreur = commencerMat(G);
      if (erreur) return this.message(erreur, '#a03030');
      this.jeuLance = true; this._transition = performance.now(); Sauvegarde.maintenant(G, 'Marche');   // (la partie est payée, même si l'on recharge)
      Son.jouer('pieces');
      this.cameras.main.fadeOut(400);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Mat', { retour: 'Marche' }));
    });
    c.add([m.fond, m.label]);
    c.add(this.add.text(600, 446, resteM > 0 ? `mât : encore ${resteM} essai${resteM > 1 ? 's' : ''}` : 'mât : plus d\'essai aujourd\'hui', style(11, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5));
  },

  // --- L'étal de l'Union : les atours (Marcelline) et la bénédiction (Frère Anselme) ---
  decorerEtalUnion(x) {
    const avant = this.children.list.length;
    imageCorps(this, x + 84, 248, 'heraut', 4.4).setFlipX(true);   // Frère Anselme, paladin de la Confrérie
    this.etiquettesRue.push(this.add.text(x + 102, 140, 'Frère Anselme', style(11, '#fff4dc', { stroke: '#2a1a10', strokeThickness: 3 })).setOrigin(1, 0.5));
    // des guirlandes de fleurs sur l'auvent
    const g = this.add.graphics();
    const fleurs = [0xf4f0e8, 0xf0c830, 0xe87aa0, 0x8ac8f0];
    for (let k = 0; k < 15; k++) { const fx = x - 84 + k * 12, fy = 102 + Math.sin(k / 14 * Math.PI) * 10; g.fillStyle(0x4a8a3a).fillRect(fx - 3, fy, 6, 2); g.fillStyle(fleurs[k % 4]).fillCircle(fx, fy - 1, 3); g.fillStyle(0xf0c040).fillRect(fx, fy - 1, 1, 1); }
    this.grouper(avant, x);
  },

  ouvrirAtours() {
    const G = this.G;
    this.montrer('garderobe');
    const c = this.panneau("L'étal de l'Union", 'Le temps de la fête · tes atours se rangent ensuite dans ta malle');
    c.add(this.add.text(30, 336, "Marcelline : « Pour le Solstice, tout le village s'habille aux couleurs de l'Union ! »", style(11, '#6b4a2a', { fontStyle: 'italic' })));
    ATOURS_UNION.forEach((id, i) => {
      const d = GARDE_ROBE[id], y = 366 + i * 26;
      c.add(this.add.image(42, y, iconeObjet(this, id)).setScale(1.6));
      c.add(this.add.text(60, y, `${d.nom} · ${d.prix} p.`, style(12, '#3b2410', { fontStyle: 'bold' })).setOrigin(0, 0.5));
      if (possede(G, id)) c.add(this.add.text(420, y, porte(G, id) ? 'tu le portes' : 'dans ta malle', style(11, '#4a6a2a', { fontStyle: 'italic' })).setOrigin(0, 0.5));
      else this.bouton(c, 450, y, 70, 'Acheter', () => {
        const erreur = acheterTenue(G, id);
        if (!erreur) Son.jouer('achat');
        this.ouvrirAtours();
        this.message(erreur || `${d.nom} : tu la portes dès maintenant ! Les clients de la lumière vont adorer.`, erreur ? '#a03030' : '#2f6a2a');
      }, undefined, 21);
    });
    c.add(this.add.text(40, 446, "Portés pendant la fête : les clients de la lumière t'en aiment un peu plus (+1 de relation).", style(10, '#6b4a2a', { fontStyle: 'italic' })));
    // Frère Anselme et sa bénédiction
    const s = etatSolstice(G), B = SOLSTICE.benediction;
    c.add(this.add.text(560, 352, 'Frère Anselme, paladin de la Confrérie :', style(12, '#3b2410', { fontStyle: 'bold' })));
    c.add(this.add.text(560, 372, s.benit ? '« Ton comptoir est béni. Que la lumière garde tes aventuriers ! »' : `« Une offrande de ${B.prix} pièces, et je bénis ton comptoir : la lumière y brillera ${B.jours} jours. »`, style(11, '#6b4a2a', { fontStyle: 'italic', wordWrap: { width: 380 } })));
    if (!s.benit) this.bouton(c, 700, 422, 250, `Faire bénir ton comptoir (${B.prix} p.)`, () => {
      const erreur = benirComptoir(G);
      if (!erreur) Son.jouer('trefle');
      this.ouvrirAtours();
      this.message(erreur || `Frère Anselme lève la main : ton comptoir est béni ! (+${String(B.reputation).replace(".", ",")} de réputation)`, erreur ? '#a03030' : '#2f6a2a');
    }, 0x2a4a8a, 26);
    this.bouton(c, 700, 452, 250, 'Les vêtements de Marcelline ▸', () => this.ouvrirGardeRobe(), undefined, 22);
  },
});
