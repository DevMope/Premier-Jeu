// Le soir, une promenade dans ton shop : la chambre, l'arrière-boutique, le comptoir, l'atelier,
// puis dehors sous les étoiles. Une pièce à la fois : on clique au sol (ou ◀ ▶ au clavier) pour
// marcher, sur les choses pour les regarder de plus près, et sur une porte pour passer dans la
// pièce voisine. Le comptoir ne se traverse pas : on s'y installe comme pour recevoir les clients,
// et on regarde la rue par la fenêtre. Tout est tel que tu l'as amélioré, à la lueur des bougies.
const PIECES_PROMENADE = [
  { nom: 'Ta chambre', x: 0 },
  { nom: "L'arrière-boutique", x: 960 },
  { nom: 'Le comptoir, la nuit', x: 1920, marche: false },
  { nom: "L'atelier", x: 2880 },
  { nom: 'Dehors, sous les étoiles', x: 3840 },
];
const P_CHAMBRE = 0, P_ARRIERE = 1, P_COMPTOIR = 2, P_ATELIER = 3, P_DEHORS = 4;
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
    this.heros = this.add.image(960 + 480, SOL_PROMENADE, 'joueur_petit').setOrigin(0.5, 1).setScale(echelleJoueur(7.5)).setDepth(8.5);
    this.cible = null;
    this.rue = [];   // (les animations de la rue, vues du comptoir)

    // L'interface, fixe à l'écran
    const fixe = o => o.setScrollFactor(0).setDepth(30);
    this.titre = fixe(this.add.text(480, 22, '', style(22, '#f3d98a', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 5 })).setOrigin(0.5));
    this.conseil = fixe(this.add.text(480, 48, '', style(12, '#e8d4a8', { fontStyle: 'italic', stroke: '#1a0e06', strokeThickness: 3 })).setOrigin(0.5));
    this.bulle = fixe(this.add.text(480, 78, '', style(14, '#3b2410', { fontStyle: 'italic', backgroundColor: '#ead9b0', padding: { x: 10, y: 6 }, wordWrap: { width: 640 }, align: 'center' })).setOrigin(0.5, 0).setVisible(false));
    const b = creerBouton(this, 860, 505, 170, '↩ Retour', () => this.partir());
    fixe(b.fond); fixe(b.label);

    // Les portes : chaque pièce a la sienne, on clique dessus pour changer de pièce
    this.portes();

    this.input.on('pointerdown', (pointeur, sous) => { if (!sous.length) this.allerVers(pointeur.worldX); });
    this.touches = this.input.keyboard ? this.input.keyboard.createCursorKeys() : null;
    this.pas = 0;
    this.entrer(P_ARRIERE, 960 + 480, true);
  }

  // --- Les pièces et leurs portes ---

  portes() {
    // Une porte dessinée (ou une zone sur une porte qui existe déjà), avec son écriteau
    const porte = (x, vers, ecriteau, { dessiner = true, large = 92, haut = 168, sol = SOL_PROMENADE, ecriteauX = 0 } = {}) => {
      if (dessiner) this.add.image(x, sol, 'porteHD').setOrigin(0.5, 1).setScale(2).setDepth(7.5);
      this.add.text(x + ecriteauX, sol - haut - 14, ecriteau, style(12, '#f3d98a', { fontStyle: 'bold italic', stroke: '#1a0e06', strokeThickness: 4 })).setOrigin(0.5).setDepth(8.6);
      const zone = this.add.rectangle(x, sol - haut / 2, large, haut, 0xffffff, 0).setDepth(8.6).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', async () => {
        if (this.transition) return;
        this.transition = true;
        if (PIECES_PROMENADE[this.piece].marche !== false) { this.allerVers(x); await this.attendreArrivee(); }
        Son.jouer('porte');
        this.entrer(vers.piece, vers.x);
        this.transition = false;
      });
    };
    const o = PIECES_PROMENADE;
    // La chambre : une porte vers l'arrière-boutique
    porte(900, { piece: P_ARRIERE, x: o[P_ARRIERE].x + 840 }, "L'arrière-boutique", { sol: SOL_PROMENADE - 10 });
    // L'arrière-boutique : la porte de la chambre (déjà dessinée), et le passage vers le comptoir
    porte(o[P_ARRIERE].x + 900, { piece: P_CHAMBRE, x: 840 }, 'Ta chambre', { dessiner: false, sol: SOL_ARRIERE });
    porte(o[P_ARRIERE].x + 22, { piece: P_COMPTOIR, x: 0 }, '◀ Le comptoir', { sol: SOL_ARRIERE + 30, ecriteauX: 58 });   // (au bord, à moitié dans le mur : le passage vers l'avant)
    // Le comptoir : on n'y marche pas ; comme dans la journée, on se retourne vers
    // l'arrière-boutique ou l'atelier d'un bouton, et la fenêtre donne sur la rue
    this.boutonsComptoir = [
      creerBouton(this, 150, 505, 250, '↻ Arrière-boutique', () => { if (!this.transition) { Son.jouer('porte'); this.entrer(P_ARRIERE, o[P_ARRIERE].x + 120); } }),
      creerBouton(this, 430, 505, 220, "🔨 L'atelier", () => { if (!this.transition) { Son.jouer('porte'); this.entrer(P_ATELIER, o[P_ATELIER].x + 120); } }),
    ];
    for (const b of this.boutonsComptoir) { b.fond.setScrollFactor(0).setDepth(30); b.label.setScrollFactor(0).setDepth(30); }
    const { x, y, w, h } = FENETRE;
    const fen = this.add.rectangle(o[P_COMPTOIR].x + x + w / 2, y + h / 2, w, h, 0xffffff, 0).setDepth(8.6).setInteractive({ useHandCursor: true });
    fen.on('pointerdown', () => { if (this.transition) return; Son.jouer('glisse'); this.dire('Tu ouvres le store, et tu sors dans la rue...'); this.time.delayedCall(600, () => this.entrer(P_DEHORS, o[P_DEHORS].x + 560)); });
    // L'atelier : la porte du comptoir
    porte(o[P_ATELIER].x + 60, { piece: P_COMPTOIR, x: 0 }, 'Le comptoir', { sol: 360 + 150 });
    // Dehors : la porte du shop ramène au comptoir
    porte(this.porteShop.x, { piece: P_COMPTOIR, x: 0 }, 'Rentrer', { dessiner: false, sol: this.porteShop.y, haut: 120, large: 70 });
  }

  attendreArrivee() { return new Promise(r => { const v = () => { if (this.cible === null) r(); else this.time.delayedCall(60, v); }; v(); }); }

  // Entrer dans une pièce : la caméra s'y pose, le héros arrive par la porte (sauf au comptoir,
  // où l'on s'installe derrière le plateau pour regarder la rue).
  entrer(index, xHeros, direct = false) {
    const piece = PIECES_PROMENADE[index];
    const cam = this.cameras.main;
    const aller = () => {
      this.piece = index;
      this.cible = null;
      cam.setScroll(piece.x, 0);
      this.titre.setText(piece.nom);
      this.conseil.setText(piece.marche === false ? "Regarde la rue par la fenêtre (clique dessus pour sortir) · les boutons pour te retourner" : '◀ ▶ ou clique au sol pour marcher · clique sur les choses pour les regarder · sur une porte pour changer de pièce');
      this.heros.setVisible(piece.marche !== false);
      for (const b of this.boutonsComptoir) { b.fond.setVisible(index === P_COMPTOIR); b.label.setVisible(index === P_COMPTOIR); }
      if (piece.marche !== false) { this.heros.x = xHeros; this.heros.setFlipX(xHeros > piece.x + 480); }
      this.arreterRue();
      if (index === P_COMPTOIR) this.animerRue();
    };
    if (direct) return aller();
    cam.fadeOut(220);
    cam.once('camerafadeoutcomplete', () => { aller(); cam.fadeIn(260); });
  }

  // --- La rue, vue de la fenêtre du comptoir : étoiles filantes, un chat de gouttière, un
  // passant à la lanterne, le hibou... ---
  animerRue() {
    const o = PIECES_PROMENADE[P_COMPTOIR].x, { x, y, w, h } = FENETRE;
    const masque = this.add.graphics().fillStyle(0xffffff).fillRect(o + x, y, w, h).setVisible(false);
    const geo = masque.createGeometryMask();
    const dansLaFenetre = obj => { obj.setMask(geo); this.rue.push(obj); return obj; };
    this.rue.push(masque);
    const filante = () => {
      const x0 = o + x + 40 + Math.random() * (w - 120), y0 = y + 15 + Math.random() * 50;
      const e = dansLaFenetre(this.add.rectangle(x0, y0, 26, 2, 0xfff8d0, 0.9).setAngle(22).setDepth(7.3).setBlendMode(Phaser.BlendModes.ADD));
      this.tweens.add({ targets: e, x: x0 + 90, y: y0 + 36, alpha: 0, scaleX: 0.3, duration: 650, ease: 'Quad.easeOut', onComplete: () => e.destroy() });
    };
    const chat = () => {
      const sens = Math.random() < 0.5 ? 1 : -1;
      const c = dansLaFenetre(this.add.image(o + x + (sens > 0 ? -30 : w + 30), y + h - 2, 'chatHD').setOrigin(0.5, 1).setScale(1.5).setTint(0x1a1424).setFlipX(sens < 0).setDepth(7.4));
      let k = 0;
      const pattes = this.time.addEvent({ delay: 260, loop: true, callback: () => { if (!c.active) { pattes.remove(); return; } c.setTexture(++k % 2 ? 'chatHD_2' : 'chatHD'); } });
      this.tweens.add({ targets: c, x: o + x + (sens > 0 ? w + 30 : -30), duration: 5200, ease: 'Linear', onComplete: () => c.destroy() });
      if (Math.random() < 0.5) this.time.delayedCall(1800, () => Son.jouer('miaou'));
    };
    const passant = () => {
      const sens = Math.random() < 0.5 ? 1 : -1;
      const p = dansLaFenetre(imageCorps(this, o + x + (sens > 0 ? -40 : w + 40), y + h - 4, 'garde', 2.2).setTint(0x3a3450).setFlipX(sens < 0).setDepth(7.4));
      const lanterne = dansLaFenetre(this.add.image(p.x, p.y - 40, 'halo').setScale(1.3).setTint(0xffb050).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD).setDepth(7.5));
      pasDeMarche(this, p, 7000, { poussiere: false });
      this.tweens.add({ targets: p, x: o + x + (sens > 0 ? w + 40 : -40), duration: 7000, ease: 'Linear', onUpdate: () => lanterne.setPosition(p.x + sens * 12, p.y - 40), onComplete: () => { p.destroy(); lanterne.destroy(); } });
    };
    this.rue.push(
      this.time.addEvent({ delay: 2500, loop: true, callback: () => { if (Math.random() < 0.45) filante(); } }),
      this.time.addEvent({ delay: 9000, startAt: 5000, loop: true, callback: () => { if (Math.random() < 0.6) chat(); } }),
      this.time.addEvent({ delay: 16000, startAt: 2000, loop: true, callback: () => { if (Math.random() < 0.5) passant(); } }),
      this.time.addEvent({ delay: 7000, loop: true, callback: () => { if (Math.random() < 0.3) Son.jouer('hibou'); } }),
    );
    this.time.delayedCall(900, filante);
  }

  arreterRue() {
    for (const r of this.rue) { if (r.remove) r.remove(); else if (r.destroy) r.destroy(); }
    this.rue = [];
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
      ArriereScene.prototype.dessinerDecos.call(this);
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
    this.porteShop = { x: f.porteX, y: f.porteY };
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
    const piece = PIECES_PROMENADE[this.piece];
    if (piece.marche === false) return;
    this.cible = Phaser.Math.Clamp(x, piece.x + 40, piece.x + 920);
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
    const piece = PIECES_PROMENADE[this.piece];
    if (piece.marche === false) dx = 0;
    if (dx) {
      this.heros.x = Phaser.Math.Clamp(this.heros.x + dx, piece.x + 40, piece.x + 920);
      this.heros.setFlipX(dx < 0);
      this.pas += delta;
      if (!this.heros.marche) pasDeMarche(this, this.heros, 260);
      this.heros.y = SOL_PROMENADE - Math.abs(Math.sin(this.pas / 120)) * 2;
    } else this.heros.y = SOL_PROMENADE;
  }

  partir() {
    if (this.fini) return;
    this.fini = true;
    this.cameras.main.fadeOut(400);
    this.cameras.main.once('camerafadeoutcomplete', () => { this.scene.stop(); this.scene.resume('Nuit'); });
  }
}
