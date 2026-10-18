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
  { nom: 'Dehors, sous les étoiles', x: 3840, largeur: 2960 },   // (v0.65 : toute la rue, la caméra suit)
];
const P_CHAMBRE = 0, P_ARRIERE = 1, P_COMPTOIR = 2, P_ATELIER = 3, P_DEHORS = 4;
const LARGEUR_PROMENADE = 3840 + 2960;
const SOL_PROMENADE = 505;

class PromenadeScene extends Cinematique {
  constructor() { super('Promenade'); }

  create() {
    const G = this.G = window.GAME;
    this.fini = false;
    this.transition = false;   // (audit v0.59)
    this.assis = null;   // (v0.97) on n'est plus assis sur le banc d'hier soir
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
    this.heros = this.add.image(960 + 480, SOL_PROMENADE, 'joueur_' + stadeJoueur(G)).setOrigin(0.5, 1).setScale(echelleJoueur(7.5)).setDepth(8.5);
    this.cible = null;
    this.rue = [];   // (les animations de la rue, vues du comptoir)
    // (v0.65) ton chat te suit de pièce en pièce ; le chat de gouttière, lui, attend dehors
    this.compagnon = null;
    if (chatAdopte(G) && !(typeof chatParti === 'function' && chatParti(G))) this.creerCompagnon();   // (v1.06 : parti, il ne te suit pas)
    if (chatCeSoir(G)) this.chatDeGouttiere();

    // L'interface, fixe à l'écran
    const fixe = o => o.setScrollFactor(0).setDepth(30);
    this.titre = fixe(this.add.text(480, 22, '', style(22, '#f3d98a', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 5 })).setOrigin(0.5));
    this.conseil = fixe(this.add.text(480, 48, '', style(12, '#e8d4a8', { fontStyle: 'italic', stroke: '#1a0e06', strokeThickness: 3 })).setOrigin(0.5));
    this.bulle = fixe(this.add.text(480, 78, '', style(14, '#3b2410', { fontStyle: 'italic', backgroundColor: '#ead9b0', padding: { x: 10, y: 6 }, wordWrap: { width: 640 }, align: 'center' })).setOrigin(0.5, 0).setVisible(false));
    const b = creerBouton(this, 860, 505, 170, '◀ Retour', () => this.partir());
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
    const porte = (x, vers, ecriteau, { dessiner = true, large = 92, haut = 168, sol = SOL_PROMENADE, ecriteauX = 0, ecriteauY = null } = {}) => {
      if (dessiner) this.add.image(x, sol, 'porteHD').setOrigin(0.5, 1).setScale(2).setDepth(7.5);
      this.add.text(x + ecriteauX, ecriteauY ?? sol - haut - 14, ecriteau, style(12, '#f3d98a', { fontStyle: 'bold italic', stroke: '#1a0e06', strokeThickness: 4 })).setOrigin(0.5).setDepth(8.6);
      const zone = this.add.rectangle(x, sol - haut / 2, large, haut, 0xffffff, 0).setDepth(8.6).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', async () => {
        if (this.transition) return;
        this.transition = true;
        if (PIECES_PROMENADE[this.piece].marche !== false) { this.allerVers(x); await this.attendreArrivee(); }
        if (this.fini) { this.transition = false; return; }
        Son.jouer('porte');
        this.entrer(vers.piece, vers.x);
        this.transition = false;
      });
    };
    const o = PIECES_PROMENADE;
    // La chambre : une porte vers l'arrière-boutique
    porte(900, { piece: P_ARRIERE, x: o[P_ARRIERE].x + 640 }, "L'arrière-boutique", { sol: SOL_PROMENADE - 10 });
    // L'arrière-boutique : la porte de la chambre (déjà dessinée), et le passage vers le comptoir
    porte(o[P_ARRIERE].x + 688, { piece: P_CHAMBRE, x: 840 }, 'Ta chambre', { dessiner: false, sol: SOL_ARRIERE });
    // (v0.84) la porte de derrière : on sort dans la rue sans repasser par le comptoir
    porte(o[P_ARRIERE].x + 898, { piece: P_DEHORS, x: this.porteShop.x + 60 }, 'La rue', { dessiner: false, sol: SOL_ARRIERE, large: 108, haut: 180, ecriteauY: SOL_ARRIERE - 198 });
    porte(o[P_ARRIERE].x + 22, { piece: P_COMPTOIR, x: 0 }, '◀ Le comptoir', { dessiner: false, sol: SOL_ARRIERE + 30, ecriteauX: 58, ecriteauY: SOL_ARRIERE + 18 });   // (v0.57 : un simple passage au bord, sans porte devant l'étagère)
    // Le comptoir : on n'y marche pas ; comme dans la journée, on se retourne vers
    // l'arrière-boutique ou l'atelier d'un bouton, et la fenêtre donne sur la rue
    this.boutonsComptoir = [
      creerBouton(this, 150, 505, 250, '↻ Arrière-boutique', () => { if (!this.transition) { Son.jouer('porte'); this.entrer(P_ARRIERE, o[P_ARRIERE].x + 120); } }),
      creerBouton(this, 400, 505, 200, "L'atelier", () => { if (!this.transition) { Son.jouer('porte'); this.entrer(P_ATELIER, o[P_ATELIER].x + 120); } }),
      // (v0.58 : on sort par la porte d'entrée du shop, pas par la fenêtre)
      creerBouton(this, 630, 505, 230, 'Sortir dans la rue', () => { if (!this.transition) { Son.jouer('porte'); this.dire('Tu pousses la porte du comptoir ; la clochette tinte dans la nuit...'); this.time.delayedCall(500, () => this.entrer(P_DEHORS, this.porteShop.x + 60)); } }),
    ];
    for (const b of this.boutonsComptoir) { b.fond.setScrollFactor(0).setDepth(30); b.label.setScrollFactor(0).setDepth(30); }
    const { x, y, w, h } = FENETRE;
    const fen = this.add.rectangle(o[P_COMPTOIR].x + x + w / 2, y + h / 2, w, h, 0xffffff, 0).setDepth(8.6).setInteractive({ useHandCursor: true });
    fen.on('pointerdown', () => { if (this.transition) return; Son.jouer('glisse'); this.dire(Phaser.Utils.Array.GetRandom(['La rue dort. Pour sortir, mieux vaut passer par la porte d\'entrée.', 'Tu colles le front à la vitre : les pavés luisent sous la lune.', 'Une lanterne passe au loin... La porte d\'entrée t\'attend si tu veux sortir.'])); });
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
      cam.setScroll(piece.largeur ? Phaser.Math.Clamp(xHeros - 480, piece.x, piece.x + piece.largeur - 960) : piece.x, 0);
      this.titre.setText(piece.nom);
      this.conseil.setText(piece.marche === false ? "La rue, par la fenêtre · « Sortir dans la rue » par la porte · les boutons pour te retourner" : '◀ ▶ ou clique au sol pour marcher · clique sur les choses pour les regarder · sur une porte pour changer de pièce');
      this.heros.setVisible(piece.marche !== false);
      for (const b of this.boutonsComptoir) { b.fond.setVisible(index === P_COMPTOIR); b.label.setVisible(index === P_COMPTOIR); }
      if (piece.marche !== false) { this.heros.x = xHeros; this.heros.setFlipX(xHeros > piece.x + (piece.largeur || 960) / 2); }
      if (this.compagnon) { this.compagnon.setVisible(piece.marche !== false); this.compagnon.x = Phaser.Math.Clamp(xHeros + (xHeros > piece.x + 480 ? 70 : -70), piece.x + 30, piece.x + (piece.largeur || 960) - 30); }
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
    // Le chat de gouttière : il passe rarement, et pas toujours de la même façon. Parfois il
    // traverse ; parfois il saute sur le banc, s'y assoit un moment en battant de la queue ;
    // parfois une souris file devant lui, il se tapit... et bondit.
    const sol = y + h - 3, banc = this.bancRue;
    const chat = () => {
      if (this.chatDehors) return;
      this.chatDehors = true;
      const sens = Math.random() < 0.5 ? 1 : -1, bord = v => o + x + (v > 0 ? w + 34 : -34);
      const c = dansLaFenetre(this.add.image(bord(-sens), sol, 'chatRue_m0').setOrigin(0.5, 1).setScale(0.75).setTint(0x9a94b8).setFlipX(sens < 0).setDepth(7.4));
      let pattes = null;
      const marche = (on) => {
        if (pattes) { pattes.remove(); pattes = null; }
        if (!on) return;
        let k = 0;
        pattes = this.time.addEvent({ delay: 110, loop: true, callback: () => { if (!c.active) { pattes.remove(); return; } c.setTexture('chatRue_m' + (++k % 4)); } });
        this.rue.push(pattes);
      };
      const aller = (versX, vitesse = 9) => new Promise(r => { marche(true); c.setFlipX(versX < c.x); this.tweens.add({ targets: c, x: versX, duration: Math.abs(versX - c.x) * vitesse, ease: 'Linear', onComplete: () => { marche(false); r(); } }); });
      const sauter = (versX, versY, image = 'chatRue_bond') => new Promise(r => {
        c.setTexture(image).setFlipX(versX < c.x);
        const y0 = c.y;
        this.tweens.add({ targets: c, x: versX, duration: 420, ease: 'Linear' });
        this.tweens.addCounter({ from: 0, to: 1, duration: 420, onUpdate: tw => { const u = tw.getValue(); if (c.active) c.y = y0 + (versY - y0) * u - Math.sin(u * Math.PI) * 26; }, onComplete: r });
      });
      const pause = ms => new Promise(r => this.time.delayedCall(ms, r));
      const fin = () => { this.chatDehors = false; if (c.active) c.destroy(); };
      const scenario = Math.random();
      (async () => {
        if (scenario < 0.4 && banc) {
          // Une pause sur le banc
          await aller(banc.x - sens * 34);
          if (!c.active) return fin();
          await sauter(banc.x, banc.siege, 'chatRue_tapi');
          c.setTexture('chatRue_assis0').setFlipX(Math.random() < 0.5);
          let q = 0;
          const queue = this.time.addEvent({ delay: 380, loop: true, callback: () => { if (c.active) c.setTexture('chatRue_assis' + (++q % 2)); } });
          this.rue.push(queue);
          if (Math.random() < 0.6) this.time.delayedCall(1500, () => { if (c.active) Son.jouer('miaou'); });
          await pause(5000 + Math.random() * 4000);
          queue.remove();
          if (!c.active) return fin();
          await sauter(banc.x + sens * 40, sol, 'chatRue_tapi');
          await aller(bord(sens));
        } else if (scenario < 0.7) {
          // La chasse à la souris
          const s = dansLaFenetre(this.add.image(bord(-sens), sol, 'souris_0').setOrigin(0.5, 1).setScale(1).setTint(0xc8c0dc).setFlipX(sens < 0).setDepth(7.4));
          let ks = 0;
          const trot = this.time.addEvent({ delay: 70, loop: true, callback: () => { if (s.active) s.setTexture('souris_' + (++ks % 2)); } });
          this.rue.push(trot);
          const milieu = o + x + w / 2 + sens * 40;
          this.tweens.add({ targets: s, x: milieu, duration: 1300, ease: 'Linear' });
          await pause(900);
          await aller(milieu - sens * 110, 7);
          if (!c.active) return fin();
          c.setTexture('chatRue_tapi');                           // il se tapit, l'arrière-train qui frétille
          this.tweens.add({ targets: c, angle: sens * 3, duration: 90, yoyo: true, repeat: 5 });
          this.tweens.add({ targets: s, x: milieu + sens * 14, duration: 900, ease: 'Sine.easeInOut' });
          await pause(1300);
          if (!c.active) return fin();
          const attrape = Math.random() < 0.4;
          if (!attrape) this.tweens.add({ targets: s, x: bord(sens), duration: 900, ease: 'Quad.easeIn', delay: 120 });
          await sauter(milieu + sens * 14, sol);
          if (attrape && s.active) { s.destroy(); Son.jouer('miaou'); }
          trot.remove();
          c.setTexture('chatRue_assis0');
          await pause(attrape ? 1600 : 900);
          if (!c.active) return fin();
          await aller(bord(sens), attrape ? 10 : 6);
          if (s.active) s.destroy();
        } else {
          // Il traverse, simplement, sans se presser
          await aller(bord(sens), 11);
        }
        fin();
      })();
    };
    this.lancerChat = chat;   // (pour les essais)
    const passant = () => {
      const sens = Math.random() < 0.5 ? 1 : -1;
      const p = dansLaFenetre(imageCorps(this, o + x + (sens > 0 ? -40 : w + 40), y + h - 4, 'garde', 2.2).setTint(0x3a3450).setFlipX(sens < 0).setDepth(7.4));
      const lanterne = dansLaFenetre(this.add.image(p.x, p.y - 40, 'halo').setScale(1.3).setTint(0xffb050).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD).setDepth(7.5));
      pasDeMarche(this, p, 7000, { poussiere: false });
      this.tweens.add({ targets: p, x: o + x + (sens > 0 ? w + 40 : -40), duration: 7000, ease: 'Linear', onUpdate: () => lanterne.setPosition(p.x + sens * 12, p.y - 40), onComplete: () => { p.destroy(); lanterne.destroy(); } });
    };
    this.rue.push(
      this.time.addEvent({ delay: 2500, loop: true, callback: () => { if (Math.random() < 0.45) filante(); } }),
      this.time.addEvent({ delay: 20000, startAt: 8000, loop: true, callback: () => { if (Math.random() < 0.35) chat(); } }),   // (le chat est rare)
      this.time.addEvent({ delay: 16000, startAt: 2000, loop: true, callback: () => { if (Math.random() < 0.5) passant(); } }),
      this.time.addEvent({ delay: 7000, loop: true, callback: () => { if (Math.random() < 0.3) Son.jouer('hibou'); } }),
    );
    this.time.delayedCall(900, filante);
  }

  arreterRue() {
    this.chatDehors = false;
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
    this.dessinerArmes = DodoScene.prototype.dessinerArmes;
    DodoScene.prototype.dessinerChambre.call(this);
    // La nuit, à la fenêtre ; le soleil reste couché
    this.soleil.setVisible(false);
    this.lumieres.push([628, SOL_CHAMBRE - 80, 2.4]);
    const luxe = niveauAmelioration(G, 'chambre');
    this.regarder(250, SOL_CHAMBRE - 130, 340, 130, `Ton lit : ${AMELIORATIONS.chambre.niveaux[luxe]}. Il t'attend...`);
    if (G.mannequin || G.armure.length) this.regarder(740, SOL_CHAMBRE - 200, 110, 200, G.armure.length ? `${NOMS_ARMURE[coteArmure(G)]} : ${G.armure.length} / ${ARMURE.length} pièces.` : "Le mannequin de Garrick attend sa première pièce d'armure.");
    // (v0.69) la malle au pied du lit : tes vêtements ; un clic pour choisir ce que tu portes
    const malle = this.add.rectangle(550, SOL_CHAMBRE + 5, 100, 70, 0xffffff, 0).setDepth(8.4).setInteractive({ useHandCursor: true });
    malle.on('pointerdown', () => { if (this.transition) return; this.allerVers(550); ouvrirMalle(this); });
    // (v0.66) la cheminée : une planche de bois, et le feu brûle toute la nuit
    const zf = this.add.rectangle(112, SOL_CHAMBRE - 90, 160, 180, 0xffffff, 0).setDepth(8.6).setInteractive({ useHandCursor: true });
    zf.on('pointerdown', () => {
      if (this.transition) return;
      this.allerVers(220);
      if (feuAllume(G)) return this.dire('Le feu crépite doucement. La nuit sera chaude.');
      this.dire(`La cheminée est froide. ${G.materiaux.bois || 0} planche${(G.materiaux.bois || 0) > 1 ? 's' : ''} de bois en réserve.`);
      this.choixChat([`Allumer un feu (1 bois)`, () => { const err = allumerFeu(G); if (err) { Son.jouer('refus'); return this.dire(err); } Son.jouer('glisse'); this.allumerCheminee(); this.dire('Les flammes prennent. La fumée monte par la cheminée : la nuit sera douce' + (chatAdopte(G) ? `, et ${nomChat(G)} s'installe déjà devant l'âtre.` : '.')); }], ['Pas ce soir', () => this.dire('Tu laisses la cheminée froide. Le bois attendra.')]);
    });
    this.regarder(360, 110, 80, 80, "La vieille épée de Garrick. Il t'a dit qu'elle portait chance.");
    // (v0.91) l'étagère des trophées : ce qu'on y a, et comment en gagner (la règle, dite clairement)
    {
      const tr = G.trophees || [], total = Object.keys(TROPHEES).length;
      this.regarder(140, 170, 210, 60, tr.length
        ? `Tes trophées (${tr.length} / ${total}) : ${tr.map(t => `${TROPHEES[t.id].nom.toLowerCase()}, de ${prenomDe(t.de)}`).join(' ; ')}. Chaque aventurier qui devient ton frère ou ta sœur de sang t'en rapporte un.`
        : `L'étagère des trophées est vide (0 / ${total}). Quand un aventurier devient ton frère ou ta sœur de sang, il te rapporte un trophée de ses aventures.`);
    }
    // (v0.91) le portrait de famille : une pensée pour tes parents, une autre à chaque fois
    const zp = this.add.rectangle(64, 96, 70, 80, 0xffffff, 0).setDepth(8.4).setInteractive({ useHandCursor: true });
    zp.on('pointerdown', () => {
      if (this.transition) return;
      this.allerVers(120);
      G.penseeParents = ((G.penseeParents ?? -1) + 1) % PENSEES_PARENTS.length;
      // (v0.93) depuis la médaille, une pensée sur deux est pour elle
      if (G.medailleParents && G.penseeParents % 2) return this.dire(`La médaille de tes parents, rendue par le vieux mendiant. « Ils ne t'ont pas abandonné${eJ(G)} », a-t-il dit. Tu voudrais tant le croire.`);
      this.dire(PENSEES_PARENTS[G.penseeParents].replaceAll('{J}', eJ(G)));
    });
    if (G.medailleParents) this.add.image(64, 146, texMedailleParents(this)).setScale(1.3).setDepth(8.3);
    const armes = G.armesLegendaires || [];
    if (armes.length) this.regarder(140, 88, 180, 88, `Tes armes légendaires (${armes.length} / ${Object.keys(ARMES_LEGENDAIRES).length}) : ${armes.map(id => armeLegendaire(id).nom).join(', ')}. La ville en parle : un peu plus de curieux au comptoir.`);
  }

  pieceArriere() {
    const G = this.G;
    // (les dessins de l'arrière-boutique s'appellent entre eux : on les emprunte)
    for (const nom of Object.getOwnPropertyNames(ArriereScene.prototype)) {
      if (nom.startsWith('dessiner') && !this[nom]) this[nom] = ArriereScene.prototype[nom];
    }
    let etagere = [];
    this.decaler(960, () => {
      ArriereScene.prototype.dessinerPiece.call(this);
      const avant = this.children.list.length;
      ArriereScene.prototype.dessinerEtageres.call(this);
      etagere = this.children.list.slice(avant);
      ArriereScene.prototype.dessinerFortune.call(this);
      ArriereScene.prototype.dessinerPanier.call(this);
      ArriereScene.prototype.dessinerBuffet.call(this);
      ArriereScene.prototype.dessinerPorte.call(this);
      ArriereScene.prototype.dessinerPorteRue.call(this);
      ArriereScene.prototype.dessinerDecos.call(this);
    });
    this.lumieres.push([960 + 640, 90, 3], [960 + 514, SOL_ARRIERE - 30, 1.6]);
    this.armoire(etagere);
    this.regarder(960 + 680, 300, 160, 140, `Ta fortune : ${G.argent} pièces.` + (G.prets.length ? ` Et ${G.prets.reduce((a, p) => a + p.restant, 0)} p. de dette...` : ''));
    // (v0.82, étape 10b) le passage vers la forge, au fond de l'arrière-boutique
    if (forgeProposee(G)) {
      const t = this.add.text(960 + 300, 150, forgeConstruite(G) ? '⚒ La forge ▸' : '⚒ Le coin de la forge ▸', style(14, '#f3d98a', { fontStyle: 'bold', backgroundColor: '#3b2410', padding: { x: 10, y: 5 } })).setOrigin(0.5).setDepth(8.6).setInteractive({ useHandCursor: true });
      t.on('pointerdown', () => { if (this.transition) return; Son.jouer('porte'); this.scene.pause(); this.scene.launch('Forge', { appelant: 'Promenade' }); });
    }
  }

  // (v0.68) L'étagère de la réserve devient une armoire : fermée, on ne voit que ses portes (moins de
  // texte à l'écran) ; un clic l'ouvre (les deux battants pivotent) et montre le stock, un autre la referme.
  armoire(objets) {
    const G = this.G;
    const fond = objets[0], plaque = objets.slice(-2);
    const contenu = objets.slice(1, -2);
    const x0 = fond.x, y0 = fond.y + 22, l = fond.displayWidth, h = fond.displayHeight - 30, demi = l / 2;
    const porte = (cote) => {
      const g = this.add.graphics();
      const w = demi - 2;
      g.fillStyle(0x3a2412).fillRect(0, 0, w, h);
      g.fillStyle(0x6a4424).fillRect(3, 3, w - 6, h - 6);
      for (let x = 3; x < w - 6; x += 22) { g.fillStyle(0x7a5030).fillRect(x, 3, 12, h - 6); g.fillStyle(0x4a2e16).fillRect(x + 20, 3, 2, h - 6); }   // les planches
      g.lineStyle(4, 0x3a2412).strokeRect(14, 18, w - 28, h * 0.4); g.strokeRect(14, h * 0.52, w - 28, h * 0.4);   // les panneaux moulurés
      g.lineStyle(2, 0x9a6a3a).strokeRect(16, 20, w - 32, h * 0.4 - 4); g.strokeRect(16, h * 0.52 + 2, w - 32, h * 0.4 - 4);
      const charn = cote < 0 ? 0 : w - 10;   // les charnières de fer, côté mur
      for (const y of [24, h - 40]) { g.fillStyle(0x24201c).fillRect(charn, y, 10, 16); g.fillStyle(0x6a6460).fillRect(charn + 2, y + 2, 6, 3); }
      const bouton = cote < 0 ? w - 14 : 6;   // le bouton de laiton, au milieu
      g.fillStyle(0x3a2412).fillCircle(bouton + 4, h / 2, 6); g.fillStyle(0xc9a227).fillCircle(bouton + 4, h / 2, 4); g.fillStyle(0xfff0a0).fillRect(bouton + 2, h / 2 - 2, 2, 2);
      const c = this.add.container(cote < 0 ? x0 : x0 + l, y0, [g]).setDepth(fond.depth + 0.5);
      g.setPosition(cote < 0 ? 0 : -w, 0);
      return c;
    };
    const portes = [porte(-1), porte(1)];
    for (const p of plaque) p.setDepth(fond.depth + 0.6);   // la plaque « Ta réserve » reste lisible, sur les portes
    let ouverte = false;
    const montrer = (o) => { for (const c of contenu) c.setVisible(o); };
    montrer(false);
    const zone = this.add.rectangle(x0 + l / 2, y0 + h / 2, l, h, 0xffffff, 0).setDepth(8.4).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => {
      if (this.transition) return;
      this.allerVers(x0 + l / 2);
      ouverte = !ouverte;
      Son.jouer('porte');
      if (ouverte) montrer(true);
      this.tweens.killTweensOf(portes);
      this.tweens.add({ targets: portes, scaleX: ouverte ? 0.12 : 1, duration: 380, ease: ouverte ? 'Quad.easeOut' : 'Quad.easeIn', onComplete: () => { if (!ouverte) montrer(false); } });
      this.dire(ouverte ? `Ta réserve : ${stockTotal(G)} / ${G.capacite} objets, rangés sur ${AMELIORATIONS.reserve.niveaux[niveauAmelioration(G, 'reserve')].toLowerCase()}.` : 'Tu refermes les portes de la réserve.');
    });
  }

  pieceComptoir() {
    const G = this.G, o = 1920, { x, y, w, h } = FENETRE;
    const cle = paysageHD(this, w, h, 'comte', 0.9);
    const tex = this.textures.get(cle).getSourceImage();
    this.add.image(o + x, y, cle).setOrigin(0).setScale(w / tex.width, h / tex.height);
    creerChatRueHD(this);
    const banc = this.add.image(o + x + 250, y + h - 3, 'bancRue').setOrigin(0.5, 1).setScale(1.5).setTint(0x9a94b8);
    this.bancRue = { x: banc.x, siege: y + h - 3 - 12 * 1.5 };
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
    // L'éclairage : sans amélioration, une simple bougie posée sur le plateau du comptoir
    // (l'applique murale n'a pas de mur où s'accrocher au milieu de la fenêtre) ; ensuite, la
    // lanterne ou le lustre pendent du plafond.
    const eclairage = niveauAmelioration(G, 'eclairage');
    if (eclairage === 0) { bougie(this, o + 880, 352, { rayon: 140, profondeur: 7.6 }); this.lumieres.push([o + 880, 316, 2.4]); }
    else { poserLuminaire(this, o + 480, 4, eclairage); this.lumieres.push([o + 480, 120, 3.4]); }
    this.regarder(o + 140, 340, 560, 120, `Ton comptoir : ${AMELIORATIONS.comptoir.niveaux[niveauAmelioration(G, 'comptoir')]}. Demain, la file d'attente recommencera ici.`);
    this.regarder(o + 17, 340, 120, 60, `Le registre : ${G.stats.servis ?? G.experience} clients servis depuis le début.`);
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

  // (v0.65, étape 10c) Toute la rue, de l'impasse du marché noir jusqu'à l'arche du marché.
  pieceDehors() {
    const o = 3840;
    const ici = {
      regarder: (x, y, l, h, texte) => this.regarder(x, y, l, h, texte),
      porte: (x, sol, etiquette, page, { large = 80, haut = 110 } = {}) => {
        const z = this.add.rectangle(x, sol - haut / 2 - 5, large, haut, 0xffffff, 0).setDepth(8.65).setInteractive({ useHandCursor: true });
        this.add.text(x, sol - 140, etiquette, style(12, page === 'MarcheNoir' ? '#ffb0a0' : '#f3d98a', { fontStyle: 'bold italic', stroke: '#1a0e06', strokeThickness: 4 })).setOrigin(0.5).setDepth(8.6);
        z.on('pointerdown', () => this.sortirVers(page, x));
      },
    };
    const r = construireRue(this, o, { ici });
    this.porteShop = r.porteShop;
    // (v0.68) le banc de la rue : on peut s'y asseoir un moment, regarder les étoiles
    const zb = this.add.rectangle(r.banc.x, r.banc.sol - 30, 130, 60, 0xffffff, 0).setDepth(8.42).setInteractive({ useHandCursor: true });
    zb.on('pointerdown', () => this.asseoir(r.banc));
    this.lumieres.push(...r.lumieres);
  }

  // (v0.65) Entrer dans la banque ou par la porte dérobée : la promenade s'arrête là, le soir attend.
  async sortirVers(page, x) {
    if (this.transition || this.fini) return;
    // (v0.91) revenu de la nymphe : la lueur s'est éteinte, on ne la revoit pas deux fois le même soir
    if (page === 'Nymphe' && !nympheAttend(this.G)) { this.allerVers(x); this.dire("La lueur s'est éteinte. La place dort ; l'eau de la fontaine murmure encore un peu."); return; }
    this.transition = true;
    this.allerVers(x); await this.attendreArrivee();
    if (this.fini) { this.transition = false; return; }   // (v0.97) « Retour » cliqué pendant la marche
    Son.jouer('porte');
    // (v0.68) la banque s'ouvre par-dessus la rue : en sortant, on se retrouve devant sa porte
    // (v0.91) ... et la nymphe aussi : après elle, on se retrouve dans la rue, devant l'arche (on était renvoyé chez soi)
    if (page === 'Banque' || page === 'Nymphe') { this.transition = false; this.cible = null; this.scene.pause(); this.scene.launch(page, { retour: 'Promenade' }); return; }
    this.fini = true;
    const nuit = this.scene.get('Nuit');
    if (nuit && nuit.lieu) Sauvegarde.planifier(this.G, nuit.lieu);
    this.cameras.main.fadeOut(300);
    this.cameras.main.once('camerafadeoutcomplete', () => { this.scene.stop(); this.scene.launch(page); });
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
    this.cible = Phaser.Math.Clamp(x, piece.x + 40, piece.x + (piece.largeur || 960) - 40);
  }

  // (v0.68) S'asseoir sur le banc : il y va, s'assoit (les jambes pliées, les mains sur les cuisses) ;
  // un clic ailleurs ou une flèche, et il se relève
  async asseoir(banc) {
    if (this.transition || this.assis) return;
    this.allerVers(banc.x); await this.attendreArrivee();
    if (this.cible !== null) return;
    await this.attendre(300);   // (le dernier pas se termine)
    if (this.cible !== null) return;
    const cle = textureJoueurAssis(this, this.G);
    this.assis = { avant: this.heros.texture.key.replace(/_pas[12]$/, '') };
    this.heros.setTexture(cle).setOrigin(0.5, (PIEDS_ASSIS[cle] + 1) / this.heros.height).setY(banc.sol - 6).setFlipX(false);
    this.dire(Phaser.Utils.Array.GetRandom(['Tu t\'assois un moment sur le banc. Le ciel est plein d\'étoiles.', 'Un banc, la nuit, et le silence du village. Tu respires.', 'Tu t\'assois. Au loin, un hibou. La journée a été longue.']));
  }
  seLever() {
    if (!this.assis) return;
    const avant = this.assis.avant;
    this.assis = null;
    this.heros.setTexture(avant).setOrigin(0.5, 1).setY(SOL_PROMENADE);
  }

  update(temps, delta) {
    if (!this.heros) return;
    if (this.assis) {
      if ((this.touches && (this.touches.left.isDown || this.touches.right.isDown)) || this.cible !== null) this.seLever();
      else { this.suivre(delta); return; }
    }
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
      this.heros.x = Phaser.Math.Clamp(this.heros.x + dx, piece.x + 40, piece.x + (piece.largeur || 960) - 40);
      this.heros.setFlipX(dx < 0);
      this.pas += delta;
      if (!this.heros.marche) pasDeMarche(this, this.heros, 260);
      this.heros.y = SOL_PROMENADE - Math.abs(Math.sin(this.pas / 120)) * 2;
    } else this.heros.y = SOL_PROMENADE;
    // (v0.65) dans la rue, la caméra suit tes pas
    if (piece.largeur) this.cameras.main.scrollX = Phaser.Math.Clamp(this.heros.x - 480, piece.x, piece.x + piece.largeur - 960);
    this.suivre(delta);
  }

  // --- (v0.65, étape 10c) Le chat ---

  creerCompagnon() {
    const k = creerChatHD(this, lookChat(this.G));
    this.cleChat = k;
    const c = this.compagnon = this.add.image(this.heros.x - 70, SOL_PROMENADE, k + '_assis0').setOrigin(0.5, 1).setScale(2.4).setDepth(8.45).setInteractive({ useHandCursor: true });
    c.etape = 0; c.temps = 0;
    c.on('pointerdown', () => {
      if (this.transition) return;
      if (typeof chatBoude === 'function' && chatBoude(this.G)) { Son.jouer('grogne'); return this.dire(`${nomChatMaj(this.G)} te tourne le dos. « Rrrr. » Sa gamelle est vide depuis trois jours...`); }   // (v1.06)
      Son.jouer('miaou');
      this.dire(`${nomChat(this.G)} ronronne et se frotte contre ta jambe.`);
      ouvrirPanneauChat(this, { quandFini: () => { this.cleChat = creerChatHD(this, lookChat(this.G)); c.setTexture(this.cleChat + '_assis0'); } });
    });
  }

  // Il te suit à quelques pas ; quand tu t'arrêtes, il s'assoit et sa queue bat.
  suivre(delta) {
    const c = this.compagnon;
    if (!c || !c.visible) return;
    const piece = PIECES_PROMENADE[this.piece];
    const cible = Phaser.Math.Clamp(this.heros.x + (this.heros.flipX ? 64 : -64), piece.x + 30, piece.x + (piece.largeur || 960) - 30);
    const reste = cible - c.x;
    c.temps += delta;
    if (Math.abs(reste) > 6) {
      c.x += Math.sign(reste) * Math.min(Math.abs(reste), 0.36 * delta);
      c.setFlipX(reste < 0);
      if (c.temps > 110) { c.temps = 0; c.etape = (c.etape + 1) % 4; c.setTexture(this.cleChat + '_m' + c.etape); }
    } else if (c.temps > 420) { c.temps = 0; c.etape = (c.etape + 1) % 2; c.setTexture(this.cleChat + '_assis' + c.etape); }
  }

  // Le chat de gouttière, certains soirs, assis sur les pavés devant ta porte.
  chatDeGouttiere() {
    const G = this.G, x = this.porteShop.x - 130;
    creerChatRueHD(this);
    const c = this.gouttiere = this.add.image(x, SOL_PROMENADE, 'chatRue_assis0').setOrigin(0.5, 1).setScale(2.4).setDepth(8.45).setFlipX(true).setInteractive({ useHandCursor: true });
    let q = 0;
    const queue = this.time.addEvent({ delay: 420, loop: true, callback: () => { if (c.active && !c.occupe) c.setTexture('chatRue_assis' + (++q % 2)); } });
    const coeurs = () => '♥'.repeat(chatDe(G).soirs.length) + '♡'.repeat(CHAT.soirsPourAdopter - chatDe(G).soirs.length);
    c.on('pointerdown', () => {
      if (this.transition || c.occupe) return;
      this.allerVers(x + 90);
      if (chatDe(G).soirs.includes(G.jour)) return this.dire(`Il a eu sa ration ce soir. Il fait sa toilette sans te quitter des yeux. ${coeurs()}`);
      Son.jouer('miaou');
      this.dire(`Un chat de gouttière, maigre et sale. Il te fixe de ses yeux verts... ${coeurs()}`);
      this.choixChat([`Lui donner une ration (${G.stock.ration || 0})`, () => this.nourrir(c, queue)], ['Le laisser', () => this.dire('Il te suit du regard pendant que tu t\'éloignes.')]);
    });
  }

  choixChat(...options) {
    if (this.boutonsChat) for (const b of this.boutonsChat) { b.fond.destroy(); b.label.destroy(); }
    this.boutonsChat = options.map(([texte, action], i) => {
      const b = creerBouton(this, 480 + (i - (options.length - 1) / 2) * 280, 440, 260, texte, () => { for (const o of this.boutonsChat) { o.fond.destroy(); o.label.destroy(); } this.boutonsChat = null; action(); });
      b.fond.setScrollFactor(0).setDepth(31); b.label.setScrollFactor(0).setDepth(31);
      return b;
    });
  }

  async nourrir(c, queue) {
    const G = this.G;
    const r = nourrirChat(G);
    if (r.erreur) { Son.jouer('refus'); return this.dire(r.erreur); }
    c.occupe = true;
    Son.jouer('glisse');
    const ration = this.add.image(c.x - 34, SOL_PROMENADE - 4, iconeObjet(this, 'ration')).setOrigin(0.5, 1).setScale(2).setDepth(8.44);
    const pause = ms => new Promise(f => this.time.delayedCall(ms, f));
    c.setTexture('chatRue_tapi');
    this.tweens.add({ targets: c, y: SOL_PROMENADE + 2, duration: 160, yoyo: true, repeat: 6 });
    this.tweens.add({ targets: ration, alpha: 0, scale: 1, duration: 1800 });
    await pause(1900);
    ration.destroy();
    // (v0.68) repu, il pense à toi : une petite bulle de pensée heureuse
    creerIconesHD(this);
    bullePensee(this, c.x, c.y - c.displayHeight - 6, 'hd_coeur', { echelle: 2.4, profondeur: 9, cote: c.flipX ? -1 : 1, duree: 2000 });
    const aller = (versX, vitesse = 5) => new Promise(f => {
      let k = 0; c.setFlipX(versX < c.x);
      const pas = this.time.addEvent({ delay: 110, loop: true, callback: () => { if (c.active) c.setTexture('chatRue_m' + (++k % 4)); } });
      this.tweens.add({ targets: c, x: versX, duration: Math.abs(versX - c.x) * vitesse, onComplete: () => { pas.remove(); f(); } });
    });
    if (!r.adopte) {
      if (r.soirs >= 2) { await aller(this.heros.x - 40); Son.jouer('miaou'); await pause(700); }
      this.dire(r.soirs >= 2 ? 'Il mange, puis se frotte contre ta jambe avant de filer dans la nuit. ♥♥♡' : 'Il dévore la ration... et file dans la nuit sans un regard. ♥♡♡');
      await aller(PIECES_PROMENADE[P_DEHORS].x - 60, 4);
      queue.remove(); c.destroy();
      return;
    }
    // Le troisième soir : il te suit jusqu'à la porte... et entre.
    await aller(this.heros.x - 40);
    Son.jouer('miaou');
    this.dire('Il mange, se frotte contre tes jambes... et te suit jusqu\'à la porte ! ♥♥♥');
    await pause(1600);
    queue.remove(); c.destroy();
    ouvrirPanneauChat(this, { adoption: true, quandFini: () => {
      this.creerCompagnon();
      this.compagnon.x = this.heros.x - 64;
      this.dire(`${nomChat(G)} est chez lui. Il a déjà choisi le coussin de l'arrière-boutique... et plus un rat n'osera entrer.`);
    } });
  }

  partir() {
    if (this.fini) return;
    this.fini = true;
    this.cameras.main.fadeOut(400);
    const nuit = this.scene.get('Nuit');
    if (nuit && nuit.lieu) Sauvegarde.planifier(this.G, nuit.lieu);   // (v0.65 : le chat adopté, nourri...)
    this.cameras.main.once('camerafadeoutcomplete', () => { this.scene.stop(); this.scene.resume('Nuit'); if (nuit && nuit.tout) nuit.tout(); });
  }
}

// --- (v0.65, étape 10c) Le panneau du chat : son pelage et ses yeux (une seule fois, au premier
// bain : son vrai pelage apparaît), son collier et son nom (à changer quand on veut). ---
function ouvrirPanneauChat(scene, { adoption = false, quandFini = null } = {}) {
  const G = window.GAME, c = chatDe(G);
  c.look = c.look || { pelage: 'gris', yeux: 'vert', collier: 'aucun' };
  const look = { ...c.look };
  const fixe = o => { o.setScrollFactor(0).setDepth(60); boite.add(o); return o; };
  const boite = scene.add.container(0, 0).setDepth(60);
  boite.add(scene.add.rectangle(480, 270, 960, 540, 0x0a0604, 0.6).setScrollFactor(0).setInteractive());
  fixe(scene.add.image(480, 270, panneauHD(scene, 620, 420)).setScale(2));
  fixe(scene.add.text(480, 86, adoption ? 'Un nouveau compagnon !' : nomChat(G).replace(/^ton chat$/, 'Ton chat'), style(22, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
  fixe(scene.add.text(480, 114, adoption ? "Un bon bain plus tard, son vrai pelage apparaît. Comment est-il ?" : 'Un nouveau collier ? Un autre nom ?', style(13, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5));
  // l'aperçu : assis, la queue qui bat
  const apercu = fixe(scene.add.image(300, 300, 'chatRue_assis0').setScale(6).setOrigin(0.5, 1));
  let q = 0;
  const queue = scene.time.addEvent({ delay: 400, loop: true, callback: () => { if (apercu.active) apercu.setTexture(cleChat(look) + '_assis' + (++q % 2)); } });
  const maj = () => { creerChatHD(scene, look); apercu.setTexture(cleChat(look) + '_assis0'); for (const l of lignes) l.maj(); };
  const lignes = [];
  const choix = (y, titre, liste, cle) => {
    const ids = Object.keys(liste);
    fixe(scene.add.text(560, y - 18, titre, style(12, '#6b4a2a', { fontStyle: 'bold' })).setOrigin(0.5));
    const t = fixe(scene.add.text(560, y, '', style(15, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
    const tourner = d => { look[cle] = ids[(ids.indexOf(look[cle]) + d + ids.length) % ids.length]; Son.jouer('glisse'); maj(); };
    for (const [x, d, s] of [[440, -1, '◀'], [680, 1, '▶']]) fixe(scene.add.text(x, y, s, style(20, '#7a4a1a', { fontStyle: 'bold' })).setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', () => tourner(d)));
    lignes.push({ maj: () => t.setText(liste[look[cle]].nom) });
  };
  if (adoption) { choix(170, 'Son pelage', PELAGES_CHAT, 'pelage'); choix(222, 'Ses yeux', YEUX_CHAT, 'yeux'); }
  choix(adoption ? 274 : 200, 'Son collier', COLLIERS_CHAT, 'collier');
  let nom = c.nom || '';
  const texteNom = fixe(scene.add.text(560, adoption ? 330 : 270, '', style(16, '#3b2410', { fontStyle: 'bold italic' })).setOrigin(0.5).setInteractive({ useHandCursor: true }));
  const majNom = () => texteNom.setText(`✎ ${nom ? '« ' + nom + ' »' : 'Lui donner un nom'}`);
  texteNom.on('pointerdown', () => demanderTexte('Le nom de ton chat', nom, NOM_CHAT_MAX, n => { nom = n.trim() || nom; majNom(); }));
  majNom(); maj();
  const fin = creerBouton(scene, 480, 430, 220, adoption ? 'Bienvenue à la maison !' : 'Valider', () => {
    if (!nom) { Son.jouer('refus'); return demanderTexte('Le nom de ton chat', '', NOM_CHAT_MAX, n => { nom = n.trim(); majNom(); }); }
    c.look = { ...look }; c.nom = nom;
    Son.jouer('miaou');
    queue.remove(); boite.destroy();
    if (quandFini) quandFini();
  });
  fixe(fin.fond); fixe(fin.label);
  return boite;
}

// --- (v0.69) La malle à vêtements, au pied du lit : ce que tu as acheté chez Marcelline. On choisit
// ce qu'on porte (on te voit avec, partout) ; le reste dort, plié, dans la malle. ---
function ouvrirMalle(scene, quandFini = null) {
  const G = window.GAME;
  const boite = scene.add.container(0, 0).setDepth(60);
  const fixe = o => { o.setScrollFactor(0); boite.add(o); return o; };
  fixe(scene.add.rectangle(480, 270, 960, 540, 0x0a0604, 0.6).setInteractive());
  fixe(scene.add.image(480, 270, panneauHD(scene, 700, 430)).setScale(2));
  fixe(scene.add.text(480, 80, 'Ta malle à vêtements', style(22, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
  fixe(scene.add.text(480, 106, 'Ce que tu portes, on le voit sur toi, partout ; le reste reste plié ici.', style(13, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5));
  creerIconesHD(scene);
  const apercu = fixe(scene.add.image(250, 430, 'joueur_' + stadeJoueur(G)).setOrigin(0.5, 1).setScale(echelleJoueur(9)));
  const lignes = scene.add.container(0, 0); boite.add(lignes);
  const dessiner = () => {
    lignes.removeAll(true);
    const ids = Object.keys(GARDE_ROBE).filter(id => possede(G, id));
    if (!ids.length) lignes.add(fixe(scene.add.text(600, 250, "La malle est vide... Marcelline, au marché, a de quoi la remplir.", style(14, '#6b4a2a', { fontStyle: 'italic', wordWrap: { width: 380 }, align: 'center' })).setOrigin(0.5)));
    ids.forEach((id, i) => {
      const y = 142 + i * 41, d = GARDE_ROBE[id], porté = porte(G, id);
      lignes.add(fixe(scene.add.image(420, y, iconeObjet(scene, id)).setScale(2).setAlpha(porté ? 1 : 0.55)));
      lignes.add(fixe(scene.add.text(442, y - 7, d.nom, style(14, '#3b2410', { fontStyle: 'bold' })).setOrigin(0, 0.5)));
      lignes.add(fixe(scene.add.text(442, y + 9, d.effet, style(10, '#6b4a2a', { wordWrap: { width: 250 } })).setOrigin(0, 0.5)));
      const b = creerBouton(scene, 760, y, 120, porté ? 'Ranger' : 'Porter', () => {
        basculerTenue(G, id); Son.jouer('glisse');
        rafraichirJoueur(scene, G);
        dessiner();
      });
      b.label.setFontSize(14);
      lignes.add(fixe(b.fond)); lignes.add(fixe(b.label));
    });
  };
  dessiner();
  const fin = creerBouton(scene, 480, 470, 200, 'Refermer la malle', () => {
    Son.jouer('porte');
    const nuit = scene.scene.get('Nuit');
    if (nuit && nuit.lieu) Sauvegarde.planifier(G, nuit.lieu);
    boite.destroy(); if (quandFini) quandFini();
  });
  fixe(fin.fond); fixe(fin.label);
  Son.jouer('porte');
  return boite;
}
