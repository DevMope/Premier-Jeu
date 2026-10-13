// Le soir, une promenade dans ton shop : la chambre, l'arrière-boutique, le comptoir, l'atelier,
// puis dehors sous les étoiles. On clique au sol (ou ◀ ▶ au clavier) pour marcher, et sur les
// choses pour les regarder de plus près. Tout est tel que tu l'as amélioré, à la lueur des bougies.
const PIECES_PROMENADE = [
  { nom: 'Ta chambre', x: 0 },
  { nom: "L'arrière-boutique", x: 960 },
  { nom: 'Le comptoir', x: 1920 },
  { nom: "L'atelier", x: 2880 },
  { nom: 'Dehors, sous les étoiles', x: 3840 },
];
const LARGEUR_PROMENADE = 4800;
const SOL_PROMENADE = 505;

class PromenadeScene extends Cinematique {
  constructor() { super('Promenade'); }

  create() {
    const G = this.G = window.GAME;
    this.fini = false;
    this.cameras.main.fadeIn(500);
    creerInterieurHD(this); creerDecorComptoir(this); creerObjetsHD(this); creerHalo(this);
    creerAtelierHD(this); creerFenetreHD(this); creerDouilletHD(this);
    this.lumieres = [];

    this.pieceChambre();
    this.pieceArriere();
    this.pieceComptoir();
    this.pieceAtelier();
    this.pieceDehors();

    // La nuit tombe sur tout le shop ; seules les flammes réchauffent les pièces.
    this.add.rectangle(LARGEUR_PROMENADE / 2, 270, LARGEUR_PROMENADE, 540, 0x0a0a28, 0.36).setDepth(8);
    for (const [x, y, r] of this.lumieres) {
      const h = this.add.image(x, y, 'halo').setScale(r).setTint(0xffb050).setAlpha(0.3).setBlendMode(Phaser.BlendModes.ADD).setDepth(9);
      this.tweens.add({ targets: h, alpha: 0.2, scale: r * 0.94, duration: 300 + Math.random() * 300, yoyo: true, repeat: -1 });
    }
    // Les cloisons entre les pièces
    for (const p of PIECES_PROMENADE.slice(1)) {
      this.add.rectangle(p.x, 270, 18, 540, 0x1a0e06).setDepth(7.9);
      this.add.rectangle(p.x - 6, 270, 3, 540, 0x4a2e18).setDepth(7.9);
    }

    textureJoueur(this, G);
    this.heros = this.add.image(2300, SOL_PROMENADE, 'joueur_petit').setOrigin(0.5, 1).setScale(echelleJoueur(5)).setDepth(8.5);
    this.cible = null;

    // L'interface, fixe à l'écran
    const fixe = o => o.setScrollFactor(0).setDepth(30);
    this.titre = fixe(this.add.text(480, 22, '', style(22, '#f3d98a', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 5 })).setOrigin(0.5));
    fixe(this.add.text(480, 48, '◀ ▶ ou clique au sol pour te promener · clique sur les choses pour les regarder', style(12, '#e8d4a8', { fontStyle: 'italic', stroke: '#1a0e06', strokeThickness: 3 })).setOrigin(0.5));
    this.bulle = fixe(this.add.text(480, 78, '', style(14, '#3b2410', { fontStyle: 'italic', backgroundColor: '#ead9b0', padding: { x: 10, y: 6 }, wordWrap: { width: 640 }, align: 'center' })).setOrigin(0.5, 0).setVisible(false));
    const b = creerBouton(this, 860, 505, 170, '↩ Retour', () => this.partir());
    fixe(b.fond); fixe(b.label);
    for (const [sens, x, texte] of [[-1, 26, '◀'], [1, 934, '▶']]) {
      const f = fixe(this.add.text(x, 290, texte, style(26, '#f3d98a', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 5 })).setOrigin(0.5).setInteractive({ useHandCursor: true }));
      f.on('pointerdown', () => this.allerVers(this.heros.x + sens * 700));
    }

    this.input.on('pointerdown', (pointeur, sous) => { if (!sous.length) this.allerVers(pointeur.worldX); });
    this.touches = this.input.keyboard ? this.input.keyboard.createCursorKeys() : null;
    this.pas = 0;
  }

  // --- Les pièces (chacune construite avec les mêmes dessins que dans le jeu) ---

  // Construit une pièce dessinée pour l'écran, puis la décale à sa place dans la promenade.
  // Les zones cliquables d'origine sont désactivées (on ne fait que regarder).
  decaler(dx, construire) {
    const avant = this.children.list.length;
    construire();
    for (const o of this.children.list.slice(avant)) {
      o.x += dx;
      if (o.input) o.disableInteractive();
    }
  }

  pieceChambre() {
    const G = this.G;
    this.dessinerArmure = DodoScene.prototype.dessinerArmure;
    DodoScene.prototype.dessinerChambre.call(this);
    // La nuit, à la fenêtre ; le soleil reste couché
    this.soleil.setVisible(false);
    this.lumieres.push([628, SOL_CHAMBRE - 80, 2.4]);
    const luxe = niveauAmelioration(G, 'chambre');
    this.regarder(250, SOL_CHAMBRE - 130, 340, 130, `Ton lit : ${AMELIORATIONS.chambre.niveaux[luxe]}. Il t'attend...`);
    this.regarder(740, SOL_CHAMBRE - 200, 110, 200, G.armure.length ? `${NOMS_ARMURE[coteArmure(G)]} : ${G.armure.length} / ${ARMURE.length} pièces.` : "Le mannequin attend sa première pièce d'armure.");
    this.regarder(66, SOL_CHAMBRE - 80, 110, 84, `Ton coffre (${AMELIORATIONS.coffre.niveaux[niveauAmelioration(G, 'coffre')]}).`);
    this.regarder(360, 110, 80, 80, "La vieille épée de Garrick. Il t'a dit qu'elle portait chance.");
  }

  pieceArriere() {
    const G = this.G;
    // (les dessins de l'arrière-boutique s'appellent entre eux : on les emprunte)
    for (const nom of Object.getOwnPropertyNames(ArriereScene.prototype)) {
      if (nom.startsWith('dessiner') && !this[nom]) this[nom] = ArriereScene.prototype[nom];
    }
    this.decaler(960, () => {
      ArriereScene.prototype.dessinerPiece.call(this);
      ArriereScene.prototype.dessinerEtageres.call(this);
      ArriereScene.prototype.dessinerFortune.call(this);
      ArriereScene.prototype.dessinerPanier.call(this);
      ArriereScene.prototype.dessinerBuffet.call(this);
      ArriereScene.prototype.dessinerPorte.call(this);
    });
    this.lumieres.push([960 + 640, 90, 3], [960 + 514, SOL_ARRIERE - 30, 1.6]);
    this.regarder(980, 76, 512, 364, `Ta réserve : ${stockTotal(G)} / ${G.capacite} objets, rangés sur ${AMELIORATIONS.reserve.niveaux[niveauAmelioration(G, 'reserve')].toLowerCase()}.`);
    this.regarder(960 + 600, 300, 200, 150, `Ta fortune : ${G.argent} pièces.` + (G.prets.length ? ` Et ${G.prets.reduce((a, p) => a + p.restant, 0)} p. de dette...` : ''));
  }

  pieceComptoir() {
    const G = this.G, o = 1920, { x, y, w, h } = FENETRE;
    const cle = paysageHD(this, w, h, 'comte', 0.9);
    const tex = this.textures.get(cle).getSourceImage();
    this.add.image(o + x, y, cle).setOrigin(0).setScale(w / tex.width, h / tex.height);
    for (let i = 0; i < 8; i++) {
      const e = this.add.image(o + x + 10 + Math.random() * (w - 20), y + 10 + Math.random() * h * 0.4, 'eclat').setScale(0.7);
      this.tweens.add({ targets: e, alpha: 0.2, duration: 600 + Math.random() * 900, yoyo: true, repeat: -1 });
    }
    for (const r of [[0, 0, 480, 10], [0, 125, 480, 45], [0, 10, 150, 115], [330, 10, 150, 115]]) this.add.image(o, 0, 'murComptoir').setOrigin(0).setScale(2).setCrop(...r);
    this.add.image(o + x - 16, y - 16, 'cadreFenetre').setOrigin(0).setScale(2);
    this.add.image(o + 20, 20, 'ardoiseComptoir').setOrigin(0).setScale(2);
    this.add.image(o + 685, 20, 'parcheminComptoir').setOrigin(0).setScale(2);
    this.add.image(o, 340, plateauComptoir(this, niveauAmelioration(G, 'comptoir'))).setOrigin(0).setScale(2);
    this.add.image(o + 75, 368, 'registreComptoir').setScale(2);
    bourse(this, o + 66, 500, G.argent, { echelle: 2.2, taille: 15 });
    const lum = poserLuminaire(this, o + 480, 4, niveauAmelioration(G, 'eclairage'));
    void lum;
    this.lumieres.push([o + 480, 120, 3.4]);
    this.regarder(o + 140, 340, 560, 120, `Ton comptoir : ${AMELIORATIONS.comptoir.niveaux[niveauAmelioration(G, 'comptoir')]}. Demain, la file d'attente recommencera ici.`);
    this.regarder(o + 17, 340, 120, 60, `Le registre : ${G.experience} clients servis depuis le début.`);
  }

  pieceAtelier() {
    const G = this.G, o = 2880;
    // Le haut du mur crépi, avec ses poutres, au-dessus de la pièce de l'atelier
    if (!this.textures.exists('murAtelierHaut')) {
      const t = toileDecor(480, 180);
      for (let y = 0; y < 180; y++) for (let x = 0; x < 480; x++) t.poser(x, y, 'platre', 3 + Math.round((fbm(x * 0.06, y * 0.08, 301) - 0.5) * 2));
      for (const bx of [0, 150, 330, 474]) planche(t, bx, 0, 6, 180, 'cheneSombre', { horizontale: false, graine: 340 + bx, noeuds: 1 });
      planche(t, 0, 0, 480, 7, 'cheneSombre', { graine: 349, noeuds: 2 });
      t.texture(this, 'murAtelierHaut');
    }
    this.add.image(o, 0, 'murAtelierHaut').setOrigin(0).setScale(2);
    this.add.image(o, 360, 'atelierHD').setOrigin(0).setScale(2);
    this.etincelles = [];
    AtelierScene.prototype.piece.call(this, o, 360 - 46);
    this.lumieres.push([o + 500, 330, 3]);
    const enCours = enReparation(G).length;
    this.regarder(o + 330, 360, 330, 150, enCours ? `${enCours} objet${enCours > 1 ? 's' : ''} sur l'établi : on y travaille même le soir.` : "L'établi est libre. Rachète des trouvailles aux aventuriers !");
    this.regarder(o + 700, 380, 240, 120, `${G.tresors.length} / ${placesAtelier(G)} objets de valeur dans l'atelier.`);
  }

  pieceDehors() {
    const G = this.G, o = 3840;
    const g = this.add.graphics();
    dessinerComte(g, o, 0, 960, 470, 1);
    this.add.image(o, 470, pavesHD(this, 960, 70)).setOrigin(0).setScale(2);
    for (let i = 0; i < 24; i++) {
      const e = this.add.image(o + Math.random() * 960, 10 + Math.random() * 160, 'eclat').setScale(0.6 + Math.random() * 0.5);
      this.tweens.add({ targets: e, alpha: 0.15, duration: 700 + Math.random() * 1200, yoyo: true, repeat: -1 });
    }
    const f = dessinerFacade(this, o + 520, 470, G.nomShop);
    this.lumieres.push([f.porteX, 400, 2.4]);
    this.regarder(o + 360, 200, 330, 270, `${G.nomShop}, ton shop. ${['Une humble chaumière', 'Une jolie maison', 'Une belle maison', 'La plus belle maison du village'][niveauFacade(G)]}.`);
  }

  // Une chose à regarder : on y va, et une petite phrase s'affiche.
  regarder(x, y, l, h, texte) {
    const zone = this.add.rectangle(x + l / 2, y + h / 2, l, h, 0xffffff, 0).setDepth(8.4).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => { this.allerVers(x + l / 2); this.dire(texte); });
  }

  dire(texte) {
    this.bulle.setText(texte).setVisible(true).setAlpha(1);
    this.tweens.killTweensOf(this.bulle);
    this.tweens.add({ targets: this.bulle, alpha: 0, delay: 4000, duration: 600 });
  }

  allerVers(x) {
    this.cible = Phaser.Math.Clamp(x, 40, LARGEUR_PROMENADE - 40);
  }

  update(temps, delta) {
    if (!this.heros) return;
    let dx = 0;
    if (this.touches && (this.touches.left.isDown || this.touches.right.isDown)) {
      this.cible = null;
      dx = (this.touches.right.isDown ? 1 : -1) * 0.32 * delta;
    } else if (this.cible !== null) {
      const reste = this.cible - this.heros.x;
      dx = Math.sign(reste) * Math.min(Math.abs(reste), 0.32 * delta);
      if (Math.abs(reste) < 1) this.cible = null;
    }
    if (dx) {
      this.heros.x = Phaser.Math.Clamp(this.heros.x + dx, 40, LARGEUR_PROMENADE - 40);
      this.heros.setFlipX(dx < 0);
      this.pas += delta;
      if (!this.heros.marche) pasDeMarche(this, this.heros, 260);
      this.heros.y = SOL_PROMENADE - Math.abs(Math.sin(this.pas / 120)) * 2;
    } else this.heros.y = SOL_PROMENADE;
    // La caméra suit, sans dépasser les bouts du shop
    const cam = this.cameras.main;
    cam.setScroll(Phaser.Math.Clamp(cam.scrollX + (this.heros.x - 480 - cam.scrollX) * Math.min(1, delta / 120), 0, LARGEUR_PROMENADE - 960), 0);
    const piece = [...PIECES_PROMENADE].reverse().find(p => this.heros.x >= p.x);
    if (piece && this.titre.text !== piece.nom) this.titre.setText(piece.nom);
  }

  partir() {
    if (this.fini) return;
    this.fini = true;
    this.cameras.main.fadeOut(400);
    this.cameras.main.once('camerafadeoutcomplete', () => { this.scene.stop(); this.scene.resume('Nuit'); });
  }
}
