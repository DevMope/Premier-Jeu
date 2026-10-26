// (planche 85 v2, validée) Le coucher en pyjama et le lever, dans la chambre (DodoScene) :
//  le soir : il ouvre l'armoire, prend son pyjama plié sur l'étagère, referme ; il déplie le paravent, passe derrière, y
//  jette ses habits du jour (la tunique, le tablier, le pantalon) et ressort en pyjama ; il souffle la bougie à bonne
//  distance (la flamme se couche, la mèche fume) ; il va au lit dans le noir, s'assoit au bord, ouvre la couverture, glisse
//  les jambes dessous, la remonte sur ses jambes, s'allonge, la remonte jusqu'aux épaules (les mains et les avant-bras
//  posés dessus) et ferme les yeux ;
//  le matin : il ouvre les yeux, s'assoit et s'étire en bâillant, rejette la couverture, pose les pieds par terre, se
//  frotte les yeux, se lève, va à l'armoire, et le tourbillon lui rend ses habits du jour : « Debout ! ».
// Chaque geste est une suite de vraies images (coucherHD.js) ; un clic pendant le coucher le fait passer trois fois plus vite.

const DUREE_POSE = 85;   // (ms par image)

Object.assign(DodoScene.prototype, {
  // --- Le décor de la nuit : l'armoire, le paravent, la couverture du lit fait ---
  meublesDeNuit() {
    const G = this.G;
    this.pyj = pyjamaDeCetteNuit(G);
    this.pyjEnCours = null;   // (ce qu'il porte : null, ses habits du jour ; sinon l'id du pyjama)
    this.pyjSorti = false;    // (le pyjama n'est plus plié sur l'étagère)
    this.habitsJour = couleursHabits(G);
    this.armoireImg = this.add.image(CHAMBRE_PYJ.armoire, SOL_CHAMBRE + 2, '__DEFAULT').setScale(2).setDepth(2.2);
    this.peindreArmoire(0);
    this.paravent = this.add.image(CHAMBRE_PYJ.paravent, SOL_CHAMBRE + 8, paraventHD(this, 0)).setOrigin(1, 1).setScale(2).setDepth(2.3);
    this.habitsJetes = [];
    this.nCouv = 0;
    this.couverture = this.add.image(0, 0, '__DEFAULT').setOrigin(0).setDepth(4);
    this.couvrir({ xa: this.litGeom.oreiller[0] + 24 });
    this.dessus = this.add.image(0, 0, '__DEFAULT').setDepth(4.05).setVisible(false);   // (les avant-bras et les mains, sur la couverture)
  },

  peindreArmoire(ouverture) {
    this.etatArmoire = ouverture;
    const pile = pyjamasDe(this.G).filter(id => !(this.pyjSorti && id === this.pyj));
    const cle = armoireHD(this, { n: niveauAmelioration(this.G, 'chambre'), ouverture, habits: this.habitsJour, pyjamas: pile });
    this.armoireImg.setTexture(cle).setOrigin((ARMOIRE_HD.ox + 18.5) / ARMOIRE_HD.L, 1);
  },
  async battants(sens) {
    Son.jouer('porte');
    for (const o of sens > 0 ? [1, 2, 3] : [2, 1, 0]) { if (this.fini) return; this.peindreArmoire(o); await this.attendre(75); }
  },
  // Où est, à l'écran, la pile de ce pyjama sur l'étagère
  pilePyjama(id) {
    const pile = pyjamasDe(this.G), i = Math.max(0, pile.indexOf(id)), x0 = this.armoireImg.x - (ARMOIRE_HD.ox + 18.5) * 2;
    return [x0 + (ARMOIRE_HD.ox + 1 + 2 + i * 7 + 3) * 2, this.armoireImg.y - (ARMOIRE_HD.H - 7 - 10.5) * 2];
  },
  // La couverture (repeinte à chaque image : deux textures qui alternent, l'une affichée pendant qu'on peint l'autre)
  couvrir({ xa, replie = 0, profil = {} }) {
    const cle = 'couvV2_' + this.scene.key + '_' + (++this.nCouv % 2);
    const r = couvertureV2(this, this.litGeom, { xa, replie, profil, cle });
    this.couverture.setTexture(cle).setPosition(r.x, r.y);
    this.etatCouv = { xa, replie, profil };
  },

  // --- Poser le joueur dans une pose, par un repère ('pied' : les pieds au sol ; 'hanche' : assis, couché) ---
  poserJoueur(cle, spec, repere, x, y, { lit = false } = {}) {
    if (lit) {
      const r = imagePoseJoueur(this, this.G, this.pyjEnCours, spec, cle, { parties: PARTIES_LIT });
      poserSurRepere(this.joueur, r.corps, repere, x, y);
      this.dessus.setFlipX(this.joueur.flipX).setScale(this.joueur.scaleX).setVisible(true);
      poserSurRepere(this.dessus, r.dessus, repere, x, y);
      return r.corps;
    }
    this.dessus.setVisible(false);
    const r = imagePoseJoueur(this, this.G, this.pyjEnCours, spec, cle);
    poserSurRepere(this.joueur, r, repere, x, y);
    return r;
  },
  // Une transition : les images d'une pose à l'autre (voir imagesTransition), le repère qui va de `de` à `a`. Une image
  // intermédiaire pas encore peinte (le premier soir, la file n'a pas fini) est sautée : le geste garde son rythme.
  prefixePoses(pyj = this.pyjEnCours) { return 'cch_' + (pyj || 'jour') + '_'; },
  async geste(nom, etapes, { repere = 'pied', de, a = de, duree = DUREE_POSE, lit = false, chaque = null }) {
    const imgs = imagesTransition(etapes, this.prefixePoses()), parties = lit ? PARTIES_LIT : null;
    for (let i = 0; i < imgs.length; i++) {
      if (this.fini) return null;
      const [cle, spec, bout] = imgs[i];
      if (!bout && !posePrete(this, this.G, this.pyjEnCours, cle, parties)) continue;
      const u = imgs.length > 1 ? i / (imgs.length - 1) : 1;
      const [x, y] = typeof de === 'function' ? de(u) : [de[0] + (a[0] - de[0]) * u, de[1] + (a[1] - de[1]) * u];
      const info = this.poserJoueur(cle, spec, repere, x, y, { lit });
      if (chaque) chaque(u, info, i);
      await this.attendre(duree);
    }
    return true;
  },
  // Les mêmes images, à préparer d'avance (en tâche de fond)
  prevoirGeste(etapes, pyj, lit = false) { prechargerCoucher(this, this.G, pyj, imagesTransition(etapes, this.prefixePoses(pyj)), lit ? PARTIES_LIT : null); },
  // Le joueur debout, dans ses habits du jour ou en pyjama (la texture qui marche)
  debout(vue = 'troisQuarts') {
    const cle = this.pyjEnCours ? textureJoueurPyjama(this, this.G, this.pyjEnCours, vue) : (vue === 'face' ? textureJoueur(this, this.G, 'deFace') : textureJoueur(this, this.G));
    this.dessus.setVisible(false);
    return this.joueur.setTexture(cle).setOrigin(0.5, 1).setAngle(0);
  },
  async marcherNuit(x, vitesse = 4) {
    if (this.fini) return;
    this.debout().setY(SOL_CHAMBRE);
    await this.marcher(this.joueur, x, vitesse);
  },
  // Se retourner : une image de face entre les deux trois-quarts
  async seTourner(versDroite) {
    if (this.fini || this.joueur.flipX === !versDroite) return;
    this.debout('face'); await this.attendre(90);
    this.joueur.setFlipX(!versDroite); this.debout();
  },
  // Où se trouve un repère d'une pose dans la scène (l'image étant posée par `repere` en x, y)
  pointPose(info, quoi, repere, x, y) {
    const e = this.joueur.scaleX, s = this.joueur.flipX ? -1 : 1, p = info[quoi], r = info[repere];
    return [x + (p[0] - r[0]) * e * s, y + (p[1] - r[1]) * e];
  },
  // Le bout du nez dans une pose (le pixel de peau le plus en avant, à hauteur du visage), en pixels de la texture
  nezPose(info) {
    const T = info.t; let nx = -1;
    for (let y = Math.round(info.tete[1] - 2); y <= info.tete[1] + 8; y++) for (let x = 0; x < T.l; x++) if (T.m[y * T.l + x] === 'peau') nx = Math.max(nx, x);
    return nx;
  },

  // --- Les repères du lit, pour ce joueur (sa taille, son âge) ---
  reperesLit() {
    if (this.repLit) return this.repLit;
    const lit = this.litGeom, e = this.joueur.scaleX, G = this.G;
    const couche = imagePoseJoueur(this, G, this.pyj, 'litBras', 'cch_rep_couche_' + this.pyj, {});
    // couché : la tête sur l'oreiller, le dos sur le matelas (il s'y enfonce un peu)
    const hx = lit.oreiller[0] + 4 + (couche.hanche[0] - couche.tete[0]) * e;
    const hy = lit.haut + 3 - (couche.boite[3] - couche.hanche[1]) * e;
    const debout = imagePoseJoueur(this, G, this.pyj, 'debout', 'cch_rep_debout_' + this.pyj, {});
    const hauteurHanche = (debout.pied[1] - debout.hanche[1]) * e;
    // assis au bord : un peu plus vers nous que couché (le bord du matelas), les fesses sur le matelas
    const bord = imagePoseJoueur(this, G, this.pyj, 'assisBord', 'cch_rep_bord_' + this.pyj, {});
    const bx = hx + 4, by = lit.haut + 1 - (bord.boite[3] - bord.hanche[1]) * e * 0.18;
    this.repLit = { couche: [hx, hy], bord: [bx, by], debout: [bx + 6, SOL_CHAMBRE - hauteurHanche], hauteurHanche,
      tete: hx - (couche.hanche[0] - couche.tete[0]) * e, pieds: hx + (couche.boite[2] - couche.hanche[0]) * e };
    return this.repLit;
  },

  // --- Les images à préparer d'avance ---
  etapesCoucher() {
    return {
      attrape: [{ pose: 'debout' }, { pose: 'attrape', n: 3 }],
      prend: [{ pose: 'attrape' }, { pose: 'tientPli', n: 3 }],
      tire: [{ pose: 'tientPli' }, { pose: 'tire', n: 3 }],
      tireRetour: [{ pose: 'tire' }, { pose: 'tientPli', n: 3 }],
      souffle: [{ pose: 'debout' }, { pose: 'souffle', n: 3 }],
      souffleRetour: [{ pose: 'souffle' }, { pose: 'debout', n: 3 }],
      assied: [{ pose: 'debout' }, { pose: 'appuie', n: 3 }, { pose: 'assisBord', n: 3 }],
      ouvre: [{ pose: 'assisBord' }, { pose: 'ouvre', n: 3 }],
      ouvreRetour: [{ pose: 'ouvre' }, { pose: 'assisBord', n: 3 }],
      jambes: [{ pose: 'assisBord' }, { pose: 'assisLit', n: 4 }],
      tireCouv: [{ pose: 'assisLit' }, { pose: 'tireCouv', n: 3 }],
      tireCouvRetour: [{ pose: 'tireCouv' }, { pose: 'assisLit', n: 3 }],
      allonge: [{ pose: 'assisLit' }, { pose: 'litBras', n: 4 }],
      remonte: [{ pose: 'litBras' }, { pose: 'litMains', n: 3 }],
      dort: [{ pose: 'litMains' }, { pose: 'litDort', n: 2 }],
    };
  },
  etapesLever() {
    return {
      reveil: [{ pose: 'litDort' }, { pose: 'litReveil', n: 2 }],
      assoit: [{ pose: 'litReveil' }, { pose: 'assisLit', n: 4 }],
      etire: [{ pose: 'assisLit' }, { pose: 'etire', n: 3 }],
      etireRetour: [{ pose: 'etire' }, { pose: 'assisLit', n: 3 }],
      rejette: [{ pose: 'assisLit' }, { pose: 'tireCouv', n: 3 }],
      rejetteRetour: [{ pose: 'tireCouv' }, { pose: 'assisLit', n: 3 }],
      sort: [{ pose: 'assisLit' }, { pose: 'assisBord', n: 4 }],
      frotte: [{ pose: 'assisBord' }, { pose: 'frotte', n: 3 }],
      frotteRetour: [{ pose: 'frotte' }, { pose: 'assisBord', n: 3 }],
      leve: [{ pose: 'assisBord' }, { pose: 'releve', n: 3 }, { pose: 'debout', n: 3 }],
    };
  },
  LIT_GESTES: ['jambes', 'tireCouv', 'tireCouvRetour', 'allonge', 'remonte', 'dort', 'reveil', 'assoit', 'etire', 'etireRetour', 'rejette', 'rejetteRetour', 'sort'],
  // Les poses qui se font en habits du jour (avant le paravent) ; toutes les autres, en pyjama
  GESTES_JOUR: ['attrape', 'prend', 'tire', 'tireRetour'],
  prevoirTout(lever = false) {
    const E = lever ? this.etapesLever() : this.etapesCoucher();
    for (const [nom, etapes] of Object.entries(E)) {
      this.prevoirGeste(etapes, this.GESTES_JOUR.includes(nom) ? null : this.pyj, this.LIT_GESTES.includes(nom));
    }
    // (et la marche en pyjama, de face et de trois-quarts)
    textureJoueurPyjama(this, this.G, this.pyj); textureJoueurPyjama(this, this.G, this.pyj, 'face');
  },

  // Un clic pendant le coucher : tout va trois fois plus vite
  accelerer(oui) {
    if (this.accel) { this.input.off('pointerdown', this.accel); this.accel = null; }
    this.time.timeScale = 1; this.tweens.timeScale = 1;
    if (oui) { this.accel = () => { this.time.timeScale = 3; this.tweens.timeScale = 3; }; this.input.on('pointerdown', this.accel); }
  },

  // --- Le soir ---
  async coucherEnPyjama() {
    const G = this.G, E = this.etapesCoucher(), e = this.joueur.scaleX;
    this.prevoirTout(false);
    this.accelerer(true);
    await this.coucherHabits();
    if (this.fini) return;
    await this.coucherBougie();
    if (this.fini) return;
    await this.coucherLit();
    this.accelerer(false);
    this.prevoirTout(true);   // (les images du réveil, pendant le bilan)
  },
  async coucherHabits() {
    const G = this.G, E = this.etapesCoucher(), e = this.joueur.scaleX;
    // 1. à l'armoire : il l'ouvre, prend son pyjama plié sur l'étagère, la referme
    const xA = CHAMBRE_PYJ.devantArmoire + 18;
    await this.marcherNuit(xA, 4);
    await this.seTourner(true);
    if (this.fini) return;
    await this.battants(1);
    const P = [this.joueur.x, SOL_CHAMBRE];
    await this.geste('attrape', E.attrape, { de: P });
    if (this.fini) return;
    const cp = couleursPyjama(this.pyj), [px, py] = this.pilePyjama(this.pyj);
    const pli = this.pli = this.add.image(px, py, habitHD(this, 'haut', cp.fond, 'plie', [cp.motif, cp.motifNom])).setScale(1.2).setDepth(3.2);
    this.pyjSorti = true; this.peindreArmoire(3);
    Son.jouer('glisse');
    // (de l'étagère, la main lointaine le ramène contre sa poitrine, où l'autre main le prend)
    const dans = (u, info) => { const q = u < 0.6 ? 'mainL' : 'main'; if (!info[q]) return; const [mx, my] = this.pointPose(info, q, 'pied', P[0], P[1]); pli.setPosition(mx + 2, my - 2); };
    await this.geste('prend', E.prend, { de: P, chaque: (u, info) => dans(u, info) });
    if (this.fini) return;
    await this.battants(-1);
    // 2. le paravent : il le déplie de sa main libre, passe derrière, jette ses habits par-dessus, ressort en pyjama
    await this.seTourner(false);
    if (this.fini) return;
    const tenir = info => { if (!info.main) return; const [mx, my] = this.pointPose(info, 'main', 'pied', P[0], P[1]); pli.setPosition(mx - 2, my - 2); };
    await this.geste('tire', E.tire, { de: P, chaque: (u, info) => { tenir(info); if (u > 0.5) this.paravent.setTexture(paraventHD(this, 1)); } });
    if (this.fini) return;
    Son.jouer('glisse'); this.paravent.setTexture(paraventHD(this, 2)).setDepth(3.5);
    await this.geste('tireRetour', E.tireRetour, { de: P, chaque: (u, info) => tenir(info) });
    if (this.fini) return;
    // (le pyjama sur l'épaule pour marcher)
    const epaule = () => pli.setPosition(this.joueur.x + (this.joueur.flipX ? 5 : -5), this.joueur.y - this.joueur.displayHeight * 0.67);   // (posé sur l'épaule, pas devant le visage)
    this.events.on('update', epaule);
    this.events.once('shutdown', () => this.events.off('update', epaule));   // (« Passer » pendant qu'il marche)
    const xP = CHAMBRE_PYJ.paravent - 50;
    await this.marcherNuit(xP, 5);
    this.events.off('update', epaule);
    if (this.fini) return;
    await this.jeterHabits(pli);
    if (this.fini) return;
  },
  async coucherBougie() {
    const G = this.G, E = this.etapesCoucher(), e = this.joueur.scaleX;
    // 3. la bougie : il s'arrête à une bonne main de la flamme (≈ 30 cm) et souffle ; la flamme se couche, la mèche fume
    this.pyjEnCours = this.pyj;
    const souffle = imagePoseJoueur(this, G, this.pyj, 'souffle', 'cch_souffleSeul', {});
    const nez = (this.nezPose(souffle) - souffle.pied[0]) * e;
    const [fx] = CHAMBRE_PYJ.bougie, xB = Math.round(fx + 22 + nez);
    await this.marcherNuit(xB, 4.5);
    if (this.fini) return;
    const B = [this.joueur.x, SOL_CHAMBRE];
    await this.geste('souffle', E.souffle, { de: B });
    if (this.fini) return;
    await this.soufflerBougie();
    await this.geste('souffleRetour', E.souffleRetour, { de: B });
    if (this.fini) return;
    await this.attendre(350);
  },
  async coucherLit() {
    const G = this.G, E = this.etapesCoucher(), e = this.joueur.scaleX;
    // 4. au lit, à pied, dans le noir : il s'assoit au bord, ouvre la couverture, glisse les jambes dessous
    const R = this.reperesLit();
    this.joueur.setDepth(4.2);   // (devant le lit : devant la couverture qui pend sur le côté)
    await this.marcherNuit(R.debout[0], 5);
    await this.seTourner(true);
    if (this.fini) return;
    this.joueur.setDepth(4.2);
    await this.geste('assied', E.assied, { repere: 'hanche', de: R.debout, a: R.bord });
    if (this.fini) return;
    // (la couverture se rabat jusque vers ses pieds : les jambes passent sur le drap, puis dessous)
    const xa0 = this.etatCouv.xa, D = Math.round(Math.max(30, Math.min(this.litGeom.pied - 34, R.pieds - 4) - xa0));
    await this.geste('ouvre', E.ouvre, { repere: 'hanche', de: R.bord });
    for (let i = 1; i <= 5 && !this.fini; i++) { const d = D * i / 5; this.couvrir({ xa: xa0 + d, replie: Math.max(4, d * 0.85) }); if (i === 2) Son.jouer('glisse'); await this.attendre(DUREE_POSE); }
    await this.geste('ouvreRetour', E.ouvreRetour, { repere: 'hanche', de: R.bord });
    if (this.fini) return;
    await this.geste('jambes', E.jambes, { repere: 'hanche', de: R.bord, a: R.couche, lit: true, chaque: u => { if (u > 0.6) this.joueur.setDepth(3.9); } });
    if (this.fini) return;
    // 5. il remonte la couverture sur ses jambes, s'allonge, la remonte jusqu'aux épaules, les mains posées dessus
    await this.geste('tireCouv', E.tireCouv, { repere: 'hanche', de: R.couche, lit: true });
    const xaJ = R.couche[0] - 4, pj = this.profilJambesLit();
    for (let i = 1; i <= 5 && !this.fini; i++) { const u = i / 5, d = D * (1 - u); this.couvrir({ xa: xaJ + (xa0 + D - xaJ) * (1 - u), replie: d > 4 ? d * 0.85 : 0, profil: pj }); if (i === 2) Son.jouer('glisse'); await this.attendre(DUREE_POSE); }
    await this.geste('tireCouvRetour', E.tireCouvRetour, { repere: 'hanche', de: R.couche, lit: true });
    if (this.fini) return;
    await this.geste('allonge', E.allonge, { repere: 'hanche', de: R.couche, lit: true, duree: DUREE_POSE + 15 });
    if (this.fini) return;
    const xaE = R.tete + 15;
    await this.geste('remonte', E.remonte, { repere: 'hanche', de: R.couche, lit: true, chaque: u => this.couvrir({ xa: xaJ + (xaE - xaJ) * u, profil: this.profilJoueur() }) });
    if (this.fini) return;
    Son.jouer('glisse');
    await this.attendre(300);
    await this.geste('dort', E.dort, { repere: 'hanche', de: R.couche, lit: true, duree: 160 });
  },

  // Le profil du joueur couché (pour que la couverture épouse son corps), d'après sa texture actuelle ; jambesSeules : ce
  // qui dépasse après la hanche (assis dans son lit, la couverture ne couvre que ses jambes)
  profilJoueur(jambesSeules = false) {
    const info = REPERES_COUCHER[this.joueur.texture.key];
    if (!info) return {};
    const p = profilCorps(this.joueur, info.t);
    if (!jambesSeules) return p;
    const garde = {}, hx = this.joueur.x;
    for (const [x, y] of Object.entries(p)) if (+x > hx + 2) garde[x] = y;
    return garde;
  },

  // Le profil de ses jambes dans le lit (les mêmes, assis ou couché : elles ne bougent pas)
  profilJambesLit() {
    if (this.profJambes) return this.profJambes;
    const R = this.reperesLit(), info = imagePoseJoueur(this, this.G, this.pyj, 'litBras', 'cch_rep_couche_' + this.pyj, {});
    const im = this.add.image(0, 0, info.cle).setScale(this.joueur.scaleX).setVisible(false);
    poserSurRepere(im, info, 'hanche', R.couche[0], R.couche[1]);
    const p = profilCorps(im, info.t); im.destroy();
    const garde = {};
    for (const [x, y] of Object.entries(p)) if (+x > R.couche[0] + 3) garde[x] = y;
    return (this.profJambes = garde);
  },

  // Derrière le paravent : la tunique, le tablier, le pantalon jetés par-dessus, un à un ; il enfile son pyjama
  async jeterHabits(pli) {
    const j = this.joueur, x = this.paravent.x, haut = this.paravent.y - PARAVENT_HD.H * 2 + 6;
    const c = this.habitsJour, cibles = [['haut', c.haut, x - 92], ['tablier', 0xe8dcc0, x - 58], ['bas', c.bas, x - 24]];
    await this.attendre(200);
    for (const [quoi, coul, cx] of cibles) {
      if (this.fini) return;
      // il lève l'habit au-dessus de sa tête (la tête qui s'incline), puis le lance
      await this.animer({ targets: j, y: j.y - 3, duration: 120, yoyo: true });
      if (pli.active && quoi === 'haut') pli.setVisible(false);
      const h = this.add.image(j.x, j.y - j.displayHeight * 0.9, habitHD(this, quoi, coul, 'roule')).setScale(2).setDepth(3.6);
      Son.jouer('glisse');
      const x0 = h.x, y0 = h.y, montee = 26;
      await new Promise(ok => this.tweens.addCounter({ from: 0, to: 1, duration: 380, ease: 'Sine.easeOut', onUpdate: tw => {
        const u = tw.getValue(); h.setPosition(x0 + (cx - x0) * u, y0 + (haut - y0) * u - Math.sin(u * Math.PI) * montee).setAngle(u * 200 * (cx < x0 ? -1 : 1));
      }, onComplete: ok }));
      // il retombe sur l'arête et pend des deux côtés
      h.setTexture(habitHD(this, quoi, coul, 'drape')).setAngle(0).setOrigin(0.5, 0.12).setPosition(cx, haut).setScale(2, 1.7);
      this.tweens.add({ targets: h, scaleY: 2, duration: 160, ease: 'Back.easeOut' });
      this.habitsJetes.push(h);
      await this.attendre(160);
    }
    if (this.fini) return;
    // il se baisse pour enfiler le bas du pyjama, se relève en pyjama
    await this.animer({ targets: j, y: j.y + 12, duration: 160, ease: 'Sine.easeIn' });
    this.pyjEnCours = this.pyj;
    this.debout();
    if (pli.active) pli.destroy();
    this.pli = null;
    await this.animer({ targets: j, y: SOL_CHAMBRE, duration: 200, ease: 'Sine.easeOut' });
    await this.attendre(160);
  },

  // Il souffle : « Fffff ! », la flamme se couche et s'éteint, la mèche fume
  async soufflerBougie() {
    const [fx, fy] = CHAMBRE_PYJ.bougie;
    this.onomatopee(fx + 20, SOL_CHAMBRE - 150, 'Fffff !');
    Son.jouer('glisse'); this.time.delayedCall(900, () => Son.jouer('hibou'));
    // (le souffle : trois petits traits qui partent de sa bouche vers la flamme)
    const g = this.add.graphics().setDepth(5.5);
    const bx = this.joueur.x - 18, by = SOL_CHAMBRE - this.joueur.displayHeight * 0.78;
    this.tweens.addCounter({ from: 0, to: 1, duration: 380, onUpdate: tw => { const u = tw.getValue(); g.clear(); g.lineStyle(1.5, 0xf4f0ff, 0.6 * (1 - u));
      for (const [dy, l] of [[-3, 9], [1, 13], [5, 8]]) g.lineBetween(bx - u * 10, by + dy, bx - u * 10 - l, by + dy - 2 - dy * 0.3); }, onComplete: () => g.destroy() });
    this.tweens.killTweensOf([this.flamme, this.lumiere]);
    this.flamme.setOrigin(0.5, 1);
    await this.animer({ targets: this.flamme, angle: -38, scaleY: this.flamme.scaleY * 0.7, duration: 180 });
    this.tweens.add({ targets: [this.flamme, this.lumiere], alpha: 0, duration: 260 });
    this.tweens.add({ targets: this.noir, fillAlpha: 0.45, duration: 700 });
    this.tweens.add({ targets: this.clairDeLune, alpha: 0.26, duration: 900 });
    await this.attendre(260);
    // la mèche fume : un filet qui monte en ondulant et se dissipe
    const fumee = this.add.graphics().setDepth(5.6);
    const n0 = this.time.now;
    const ev = this.time.addEvent({ delay: 40, loop: true, callback: () => {
      const t = (this.time.now - n0) / 1000; fumee.clear();
      for (let i = 0; i < 26; i++) { const y = fy + 2 - i * 1.7, x = fx + Math.sin(i / 3.2 - t * 3) * (1 + i * 0.13), a = Math.max(0, (0.5 - i * 0.018) * (1 - t / 2.6)); fumee.fillStyle(0xb8b8c8, a).fillRect(x, y, 1.5, 1.7); }
      if (t > 2.6) { ev.remove(); fumee.destroy(); }
    } });
    await this.attendre(500);
  },

  // --- Le matin ---
  async leverEnPyjama() {
    const E = this.etapesLever(), R = this.reperesLit(), e = this.joueur.scaleX;
    this.pyjEnCours = this.pyj;
    await this.geste('reveil', E.reveil, { repere: 'hanche', de: R.couche, lit: true, duree: 140 });
    if (this.fini) return;
    this.onomatopee(R.tete - 2, R.couche[1] - 40, '!', '#f3d98a');
    await this.attendre(600);
    // il s'assoit : la couverture glisse jusqu'à sa taille
    const xaJ = R.couche[0] - 4, xaE = this.etatCouv.xa, pj = this.profilJambesLit();
    await this.geste('assoit', E.assoit, { repere: 'hanche', de: R.couche, lit: true, duree: DUREE_POSE + 20, chaque: u => this.couvrir({ xa: xaE + (xaJ - xaE) * u, profil: u > 0.5 ? this.profilJambesLit() : this.profilJoueur() }) });
    if (this.fini) return;
    await this.geste('etire', E.etire, { repere: 'hanche', de: R.couche, lit: true });
    this.onomatopee(R.couche[0] + 30, R.couche[1] - 80, 'Aaaah...', '#f3d98a');
    await this.attendre(700);
    await this.geste('etireRetour', E.etireRetour, { repere: 'hanche', de: R.couche, lit: true });
    if (this.fini) return;
    // il rejette la couverture vers le pied du lit
    const D = Math.round(Math.max(30, Math.min(this.litGeom.pied - 34, R.pieds - 4) - xaJ) / 1.2), pj2 = this.profilJambesLit();
    await this.geste('rejette', E.rejette, { repere: 'hanche', de: R.couche, lit: true });
    for (let i = 1; i <= 5 && !this.fini; i++) { const d = D * i / 5; this.couvrir({ xa: xaJ + d * 1.2, replie: Math.max(4, d * 0.85), profil: pj2 }); if (i === 2) Son.jouer('glisse'); await this.attendre(DUREE_POSE); }
    await this.geste('rejetteRetour', E.rejetteRetour, { repere: 'hanche', de: R.couche, lit: true });
    if (this.fini) return;
    // les pieds par terre (au bord du lit), il se frotte les yeux, puis il se lève
    this.couvrir({ xa: this.etatCouv.xa, replie: this.etatCouv.replie });   // (plus de jambes dessous)
    await this.geste('sort', E.sort, { repere: 'hanche', de: R.couche, a: R.bord, lit: true, chaque: u => { if (u > 0.35) this.joueur.setDepth(4.2); } });
    this.dessus.setVisible(false);
    if (this.fini) return;
    await this.geste('frotte', E.frotte, { repere: 'hanche', de: R.bord });
    this.onomatopee(R.bord[0] + 60, R.bord[1] - 70, 'Hmmm...', '#f3d98a');
    await this.attendre(650);
    await this.geste('frotteRetour', E.frotteRetour, { repere: 'hanche', de: R.bord });
    if (this.fini) return;
    await this.geste('leve', E.leve, { repere: 'hanche', de: R.bord, a: R.debout });
    if (this.fini) return;
    // à l'armoire : le tourbillon lui rend ses habits du jour
    await this.marcherNuit(CHAMBRE_PYJ.devantArmoire + 18, 4);
    this.joueur.setDepth(3);
    await this.seTourner(true);
    if (this.fini) return;
    await this.battants(1);
    await this.tourbillon({ deNuit: true });
    if (this.fini) return;
    await this.battants(-1);
    this.onomatopee(this.joueur.x, SOL_CHAMBRE - 140, 'Debout !', '#f3d98a');
  },

  // Le matin, avant de sortir : « Clique pour sortir dans la rue », et le bouton de l'armoire (les couleurs du jour, les
  // accessoires, le pyjama de ce soir) ; ce qu'on y change se met d'un tourbillon
  attendreSortie() {
    const t = this.add.text(940, 520, '▶ Clique pour sortir dans la rue', style(15, '#fff4dc', { fontStyle: 'bold italic', stroke: '#2a1a10', strokeThickness: 4 })).setOrigin(1, 0.5).setDepth(30);
    this.tweens.add({ targets: t, alpha: 0.4, duration: 700, yoyo: true, repeat: -1 });
    const b = creerBouton(this, 130, 505, 210, "Ouvrir l'armoire", async () => {
      if (this.armoireOuverte || this.fini) return;
      this.armoireOuverte = true; b.fond.setVisible(false); b.label.setVisible(false); t.setVisible(false);
      if (Math.abs(this.joueur.x - (CHAMBRE_PYJ.devantArmoire + 18)) > 4) await this.marcherNuit(CHAMBRE_PYJ.devantArmoire + 18, 4);
      await this.seTourner(true);
      await this.battants(1);
      ouvrirArmoireEcran(this, { quandFini: async ({ habits, avant }) => {
        this.pyj = pyjamaDeCetteNuit(this.G);
        if (habits) await this.tourbillon({ avant });
        else { this.habitsJour = couleursHabits(this.G); this.peindreArmoire(3); }
        await this.battants(-1);
        b.fond.setVisible(true); b.label.setVisible(true); t.setVisible(true);
        this.time.delayedCall(250, () => { this.armoireOuverte = false; });
      } });
    });
    b.fond.setDepth(30); b.label.setDepth(30.1);
    this.armoireOuverte = false;
    return new Promise(ok => this.time.delayedCall(300, () => {
      const suite = (p, sous) => {
        if (this.armoireOuverte || (sous || []).includes(b.fond)) return;
        this.input.off('pointerdown', suite); t.destroy(); b.fond.destroy(); b.label.destroy(); ok();
      };
      this.input.on('pointerdown', suite);
    }));
  },

  // Le tourbillon « comme dans les Sims » (0,8 s) : des rubans aux couleurs des deux tenues ; au plus fort, la tenue
  // change ; ce qu'il quitte s'envole se ranger (le pyjama plié sur l'étagère), ce qu'il met vient à lui (les habits du
  // paravent) ; le paravent se replie tout seul. avant/apres : les couleurs d'un changement d'habits (à l'armoire, le jour)
  async tourbillon({ deNuit = false, avant = null } = {}) {
    const j = this.joueur, x = j.x, sol = SOL_CHAMBRE, haut = j.displayHeight + 8;
    const cp = couleursPyjama(this.pyj), cj = couleursHabits(this.G);
    const couleurs = deNuit ? [cp.fond, cp.motif, cj.haut, 0xe8dcc0, cj.bas, 0xfff4c8] : [(avant || cj).haut, (avant || cj).bas, cj.haut, cj.bas, 0xe8dcc0, 0xfff4c8];
    const tb = tourbillonHD(this, x, sol + 6, haut, couleurs);
    Son.jouer('glisse');
    const fantome = this.add.image(j.x, j.y, j.texture.key).setOrigin(j.originX, j.originY).setScale(j.scaleX).setFlipX(j.flipX).setDepth(j.depth + 0.01);
    let change = false;
    await new Promise(ok => this.tweens.addCounter({ from: 0, to: 1, duration: 800, onUpdate: tw => {
      const u = tw.getValue(), force = Math.sin(u * Math.PI);
      tb.maj(force, u * 9);
      j.setAlpha(1 - force * 0.75); fantome.setAlpha((1 - force * 0.75) * (change ? 0 : 1));
      if (!change && u > 0.45) {
        change = true;
        if (deNuit) {
          this.pyjEnCours = null;
          // le pyjama plié vole sur l'étagère ; les habits du paravent viennent à lui ; le paravent se replie
          const [px, py] = this.pilePyjama(this.pyj);
          const pli = this.add.image(x, sol - 60, habitHD(this, 'haut', cp.fond, 'plie', [cp.motif, cp.motifNom])).setScale(1.2).setDepth(4.9);
          this.tweens.add({ targets: pli, x: px, y: py, duration: 380, ease: 'Sine.easeInOut', onComplete: () => { pli.destroy(); this.pyjSorti = false; this.peindreArmoire(this.etatArmoire); } });
          for (const h of this.habitsJetes) this.tweens.add({ targets: h, x, y: sol - 50, scale: 0.6, alpha: 0, angle: 180, duration: 320, ease: 'Sine.easeIn', onComplete: () => h.destroy() });
          this.habitsJetes = [];
          if (this.paravent.texture.key !== paraventHD(this, 0)) { this.paravent.setTexture(paraventHD(this, 1)); this.time.delayedCall(140, () => this.paravent.setTexture(paraventHD(this, 0)).setDepth(2.3)); }
        } else {
          const vole = this.add.image(x, sol - 50, habitHD(this, 'haut', (avant || cj).haut, 'plie')).setScale(1.2).setDepth(4.9);
          const [ax, ay] = [this.armoireImg.x - 10, this.armoireImg.y - 100];
          this.tweens.add({ targets: vole, x: ax, y: ay, duration: 360, ease: 'Sine.easeInOut', onComplete: () => vole.destroy() });
        }
        this.debout();
        this.habitsJour = couleursHabits(this.G); this.peindreArmoire(this.etatArmoire);
      }
    }, onComplete: ok }));
    tb.detruire(); fantome.destroy(); j.setAlpha(1);
    for (let i = 0; i < 7; i++) { const s = this.add.image(x - 26 + (i * 13) % 52, sol - 20 - (i * 29) % Math.round(haut - 20), 'eclat').setScale(0.4 + (i % 3) * 0.15).setDepth(4.9).setAlpha(0.7); this.tweens.add({ targets: s, alpha: 0, y: s.y - 10, duration: 500, delay: i * 40, onComplete: () => s.destroy() }); }
    await this.attendre(200);
  },
});
