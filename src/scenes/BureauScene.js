// Le bureau (v1.64, planche 82 v2 validée) : une vraie pièce de la maison, derrière sa porte, au fond de l'arrière-
// boutique. Chaque fonction est un meuble, nommé au survol, qui ouvre ce qu'il contient là où il est :
//   le meuble à tiroirs (les carnets), le calendrier (le mois), l'ardoise (les comptes), le registre (les fiches) et la
//   feuille du jour (l'ordre de passage), le tableau des succès (les médailles), les plans de la maison (améliorer le
//   comptoir), le carnet de la forge, l'enseigne (le nom du comptoir), et la porte (on ressort).
// Le joueur y est assis, à sa table. Arrivé par la porte (depuis l'arrière-boutique ou la promenade du soir), on le voit
// entrer, refermer derrière lui et s'asseoir ; ouvert depuis le comptoir ou le soir, il y est déjà. La page s'ouvre
// par-dessus la scène d'où l'on vient, qui attend en pause.
const NOMS_RACES = { humain: 'Humain', hobbit: 'Hobbit', nain: 'Nain', elfe: 'Elfe', magicienne: 'Magicienne', gobelin: 'Gobelin', orc: 'Orc', loupgarou: 'Loup-garou', vampire: 'Vampire', momie: 'Momie', troll: 'Troll', panda: 'Panda' };
const ONGLETS = [
  ['avenir', 'À venir'], ['aujourdhui', "Aujourd'hui"], ['mission', 'En mission'],
  ['revenus', 'Revenus'], ['disparus', 'Disparus'], ['repertoire', 'Répertoire'],
];
const FICHES_PAR_PAGE = 6;   // (v1.64 : le grand registre, trois lignes par fiche)
const TIROIRS = [['ameliorations', 'Améliorer le comptoir'], ['competences', 'Tes compétences'], ['aventuriers', 'Chiffres des missions'], ['commerce', 'Le commerce'], ['reputation', 'Réputation et relations'], ['camps', 'Lumière et ombre'], ['etrange', 'Choses étranges']];
// Où sont les choses, dans la pièce (à l'écran)
const PIECE_BUREAU = { sol: 452, table: { x: 350, bas: 498 }, chaise: { x: 480, pieds: 474 }, porte: { x: 892 }, debout: 482, echelle: 13.4 };   // (la même proportion que dans l'arrière-boutique : debout, il fait les trois cinquièmes de la porte)

class BureauScene extends Phaser.Scene {
  constructor() { super('Bureau'); }

  init(data) {
    this.retour = data.retour || 'Nuit';
    this.comptoir = data.comptoir || null;
    this.parLaPorte = !!data.parLaPorte;
    this.onglet = 'aujourdhui';
    this.pageListe = 0;
  }

  create() {
    const G = this.G = window.GAME;
    // (la scène sert tous les jours : on repart de zéro)
    this.zoom = null; this.calendrier = null; this.comptes = null; this.feuille = null; this.pageEnseigne = null; this.badgeSucces = null;
    this.pages = null; this.ficheDroite = null; this.meubleChoisi = undefined; this.sortieEnCours = false; this.assis = false; this.etiquette = null;
    this.objets = []; this.ficheChoisie = null; this.tiroirOuvert = null; this.carnetOuvert = null; this.decalPages = null; this.tiroirAnime = false;
    this.objetEnseigne = null; this.enseigneSalle = null; this.entreeEnCours = false; this.pageQuiTourne = null; this.minuteurEcrit = null;
    this.vueRegistre = null; this.vueFeuille = null; this.yAssis = null; this.mainsHeros = null;
    lieuVu('bureau');   // (v1.61)
    this.cameras.main.fadeIn(300);
    creerInterieurHD(this); creerBureauHD(this); texturesBureau(this); texturesZoomBureau(this); creerHalo(this);
    this.moment = this.momentDuJour();
    this.dessinerPiece();
    this.creerObjets();
    this.add.text(480, 24, 'Ton bureau', style(24, '#f3d98a', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 5 })).setOrigin(0.5).setDepth(30);
    this.boutonSortir = creerBouton(this, 860, 512, 170, '◀ Sortir', () => this.sortir());
    this.boutonSortir.fond.setDepth(30); this.boutonSortir.label.setDepth(30.1);
    if (this.input.keyboard) this.input.keyboard.on('keydown-ESC', () => { if (this.zoom) this.fermerZoom(); });
    if (!this.comptoir) this.onglet = 'mission';
    // le joueur : il entre par la porte, ou il est déjà assis à sa table
    textureJoueur(this, G); textureJoueur(this, G, 'deFace'); textureJoueur(this, G, 'dos');
    this.E = echelleJoueur(PIECE_BUREAU.echelle);
    this.heros = this.add.image(PIECE_BUREAU.chaise.x, PIECE_BUREAU.debout, 'joueur_' + stadeJoueur(G)).setOrigin(0.5, 1).setScale(this.E).setDepth(1.5);
    if (this.parLaPorte) this.entrer(); else { this.asseoir(true); this.time.delayedCall(300, () => conseilGarrick(this, 'bureau')); }
  }

  // Le jour par la fenêtre : celui de la scène d'où l'on vient
  momentDuJour() {
    if (this.retour === 'Promenade') return 'nuit';
    const nuit = this.scene.get('Nuit');
    if (this.retour === 'Nuit') return nuit && nuit.matin ? 'aube' : 'soir';
    if (this.retour === 'Arriere') { const a = this.scene.get('Arriere'); return a && !a.comptoir && a.retour === 'Nuit' ? 'aube' : 'jour'; }
    return 'jour';
  }

  // --- La pièce ---

  dessinerPiece() {
    const G = this.G, m = this.moment, P = (x, y, cle, prof) => this.add.image(x, y, cle).setOrigin(0).setScale(2).setDepth(prof);
    // le dehors, par la fenêtre
    const cle = paysageHD(this, 176, 144, 'comte', { jour: 0, aube: 'aube', soir: 0.7, nuit: 0.95 }[m]), tex = this.textures.get(cle).getSourceImage();
    this.add.image(392, 80, cle).setOrigin(0).setScale(176 / tex.width, 144 / tex.height).setDepth(-2);
    this.add.image(0, 0, murInterieur(this, 'murBureau', { l: 480, h: 226, poteaux: [118, 352], graine: 8301, fenetre: { x: 196, y: 40, l: 88, h: 72 } })).setOrigin(0).setScale(2).setTint(0xd8bc98).setDepth(-1);
    this.add.image(0, PIECE_BUREAU.sol, plancher(this, 'plancherBureau', { l: 480, h: 44, graine: 8320 })).setOrigin(0).setScale(2).setTint(0xc8a888).setDepth(-1);
    // le tapis sous la table ; le chat qui dort dessus (s'il est à la maison)
    this.add.image(480, 512, tapisHD(this, Math.max(1, niveauAmelioration(G, 'chambre')))).setScale(2.4, 2).setDepth(0.2);
    // (le soir seulement : le jour, il dort sur son coussin de l'arrière-boutique ; en promenade, il te suit)
    if (this.retour === 'Nuit' && chatAdopte(G) && !(typeof chatParti === 'function' && chatParti(G))) {
      const cc = creerChatHD(this, lookChat(G)), chat = this.add.image(616, 534, cc + '_dort0').setOrigin(0.5, 1).setScale(2.4).setDepth(2.4);
      let souffle = 0;
      this.time.addEvent({ delay: 1100, loop: true, callback: () => { if (chat.active) chat.setTexture(cc + '_dort' + (++souffle % 2)); } });
      chat.setInteractive({ useHandCursor: true }).on('pointerdown', () => { if (!this.zoom && typeof Son !== 'undefined') Son.jouer('miaou'); });
    }
    // les meubles qui ne s'ouvrent pas : la chaise, le tabouret et ses vieux registres, la corbeille, l'encrier, la bougie
    P(PIECE_BUREAU.chaise.x - 46, PIECE_BUREAU.chaise.pieds - 128, 'bureauChaise', 1.3);
    P(232, 414, 'bureauTabouret', 1.2);
    P(618, 462, 'bureauCorbeille', 2.3);
    P(392, 352, 'bureauEncrier', 2.15);
    this.bougieTable = bougie(this, 372, 400, { rayon: 130, profondeur: 2.2 });
    // la lumière : par la fenêtre le jour (et la poussière qui y danse) ; le soir et la nuit, seules les bougies
    if (m === 'jour' || m === 'aube') {
      const rais = this.add.graphics().setDepth(3).setBlendMode(Phaser.BlendModes.ADD), c = m === 'aube' ? 0xffc8a0 : 0xffe0a0;
      rais.fillStyle(c, 0.08).fillPoints([{ x: 396, y: 84 }, { x: 564, y: 84 }, { x: 700, y: 520 }, { x: 470, y: 520 }], true);
      rais.fillStyle(c, 0.05).fillPoints([{ x: 420, y: 100 }, { x: 540, y: 100 }, { x: 640, y: 470 }, { x: 500, y: 470 }], true);
      for (let k = 0; k < 18; k++) { const p = this.add.circle(430 + Math.random() * 180, 120 + Math.random() * 280, 1, 0xfff0c0, 0.7).setDepth(3.1).setBlendMode(Phaser.BlendModes.ADD);
        this.tweens.add({ targets: p, y: p.y + 16, x: p.x + (Math.random() - 0.5) * 16, alpha: { from: 0.8, to: 0.1 }, duration: 3000 + Math.random() * 2500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: Math.random() * 2000 }); }
    } else {
      this.add.rectangle(480, 270, 960, 540, 0x0a0a28, m === 'nuit' ? 0.42 : 0.3).setDepth(5);
      for (const [x, y, r] of [[372, 368, 2.4], [892, 300, 0.8]]) { const h = this.add.image(x, y, 'halo').setScale(r).setTint(0xffb050).setAlpha(0.3).setBlendMode(Phaser.BlendModes.ADD).setDepth(6);
        this.tweens.add({ targets: h, alpha: 0.2, scale: r * 0.94, duration: 300 + Math.random() * 300, yoyo: true, repeat: -1 }); }
    }
    vignette(this, 0.5, 4);
  }

  // Chaque meuble : ses images (et leur version éclairée), sa zone, son nom au survol, ce qu'il ouvre
  objet({ nom, ouvre, images = [], zone, agir, dessous = false }) {
    const [x, y, l, h] = zone, o = { nom, ouvre, images, zone, dessous };
    const z = this.add.zone(x + l / 2, y + h / 2, l, h).setDepth(25).setInteractive({ useHandCursor: true });
    z.on('pointerover', () => this.survoler(o, true));
    z.on('pointerout', () => this.survoler(o, false));
    z.on('pointerdown', () => { if (this.sortieEnCours || this.zoom) return; this.survoler(o, false); agir(o); });
    o.zoneJeu = z; this.objets.push(o);
    return o;
  }
  survoler(o, oui) {
    for (const im of o.images) {
      if (!im || !im.active) continue;
      if (im.eclairer) { im.eclairer(oui); continue; }
      const base = im.texture.key.replace(/_clair$/, '');
      if (this.textures.exists(base + '_clair')) im.setTexture(oui ? base + '_clair' : base);
    }
    if (this.etiquette) { this.etiquette.destroy(); this.etiquette = null; }
    if (!oui || this.sortieEnCours || this.zoom) return;
    // le nom, et ce qu'il ouvre, juste au-dessus du meuble (ou dessous, s'il est tout en haut)
    const [x, y, l, h] = o.zone, c = this.etiquette = this.add.container(0, 0).setDepth(28);
    const t1 = this.add.text(0, 0, o.nom, style(13, '#fff4dc', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 4 })).setOrigin(0.5, 0);
    const t2 = this.add.text(0, t1.height, '→ ' + o.ouvre, style(12, '#ffd870', { fontStyle: 'bold italic', stroke: '#1a0e06', strokeThickness: 4 })).setOrigin(0.5, 0);
    const lb = Math.max(t1.width, t2.width) + 18, hb = t1.height + t2.height + 8;
    const fond = this.add.graphics().fillStyle(0x1a0e06, 0.78).fillRoundedRect(-lb / 2, -4, lb, hb, 6).lineStyle(1, 0xc9a227, 0.8).strokeRoundedRect(-lb / 2, -4, lb, hb, 6);
    c.add([fond, t1, t2]);
    let cy = y - hb - 4; if (cy < 46 || o.dessous) cy = y + h + 8;   // (sur la table, sous l'objet : le nom ne cache pas le joueur)
    c.setPosition(Phaser.Math.Clamp(x + l / 2, lb / 2 + 6, 954 - lb / 2), Math.min(cy, 536 - hb));
  }

  creerObjets() {
    const G = this.G, P = (x, y, cle, prof) => this.add.image(x, y, cle).setOrigin(0).setScale(2).setDepth(prof);
    // 1. le meuble à tiroirs des carnets
    const meuble = P(28, 140, texMeubleBureau(this, this.tiroirs().map(t => !!t.ouvert)), 1);
    this.objet({ nom: 'Le meuble à tiroirs', ouvre: 'les carnets', images: [meuble], zone: [28, 140, 184, 328], agir: () => this.ouvrirTiroirs() });
    // 2. le calendrier, pendu au poteau
    const d = dateDuJour(G), cal = P(217, 230, texCalendrierBureau(this, d.jourDuMois), 1);
    this.objet({ nom: 'Le calendrier', ouvre: 'le mois', images: [cal], zone: [217, 230, 56, 72], agir: o => { Son.jouer('page'); this.ouvrirCalendrier(); this.approcher(this.calendrier, o.zone); } });
    // 3. l'ardoise des comptes, à la craie
    const ardoise = P(264, 86, 'bureauArdoise', 1);
    const craie = (x, y, txt, t, c = '#eef0e4', b = 'italic') => this.add.text(x, y, txt, style(t, c, { fontStyle: b, brut: true })).setOrigin(0.5).setDepth(1.1);
    const dp = debutsDePeriodes(G), signe = v => (v > 0 ? '+ ' : v < 0 ? '− ' : '') + Math.abs(v);
    const jour = bilanPeriode(G, G.jour, G.jour).benefice, sem = bilanPeriode(G, dp.semaine, G.jour).benefice, mois = bilanPeriode(G, dp.mois, G.jour).benefice;
    craie(322, 112, 'Chiffre d’affaires', 11, '#f3f0d8', 'bold italic');
    const gros = craie(322, 136, signe(jour) + ' p.', 20, jour >= 0 ? '#b8e0a0' : '#f0a8a0', 'bold'); if (gros.width > 100) gros.setScale(100 / gros.width);
    craie(322, 157, 'aujourd’hui', 9, '#c9d4dc');
    craie(322, 174, 'semaine : ' + signe(sem), 9, '#c9d4dc');
    craie(322, 187, 'mois : ' + signe(mois), 9, '#c9d4dc');
    this.objet({ nom: 'L’ardoise', ouvre: 'les comptes', images: [ardoise], zone: [264, 86, 116, 112], agir: o => { Son.jouer('page'); this.detailComptes(); this.approcher(this.comptes, o.zone); } });
    // 4. la table, le registre et ses signets ; 5. la feuille du jour, sous son galet
    const table = P(PIECE_BUREAU.table.x, PIECE_BUREAU.table.bas - 116, 'bureauTable', 2);
    const registre = P(426, 374, 'bureauRegistre', 2.1);
    this.table = table;
    this.objet({ nom: 'Le registre', ouvre: 'les fiches', images: [registre], zone: [418, 368, 124, 70], dessous: true, agir: o => this.ouvrirRegistre(o.zone) });
    const feuille = P(544, 384, 'bureauFeuille', 2.1);
    this.objet({ nom: 'La feuille du jour', ouvre: 'l’ordre de passage', images: [feuille], zone: [542, 372, 62, 34], dessous: true, agir: o => {
      if (!this.comptoir) return this.ouvrirRegistre(o.zone);   // (comptoir fermé : la feuille du jour se lit dans le registre)
      Son.jouer('page'); this.ouvrirFeuille(); this.approcher(this.feuille, o.zone); } });
    // 6. le tableau des succès, en haut à droite
    if (typeof SUCCES !== 'undefined') {
      const ids = this.ordreSucces(), gagnes = ids.filter(id => aLeSucces(G, id));
      const tab = P(584, 80, texTableauSucces(this, ids, gagnes), 1);
      this.add.text(640, 186, `${gagnes.length} / ${ids.length}`, style(9, '#3b2410', { fontStyle: 'bold', brut: true })).setOrigin(0.5).setDepth(1.1);
      if (G.succesNonVus) this.badgeSucces = this.add.text(690, 84, `${G.succesNonVus}`, style(10, '#1a0e06', { fontStyle: 'bold', backgroundColor: '#e8b830', padding: { x: 4, y: 0 } })).setOrigin(0.5).setDepth(1.2);
      this.objet({ nom: 'Le tableau des succès', ouvre: 'tes médailles', images: [tab], zone: [584, 80, 112, 124], agir: o => this.ouvrirSucces(o.zone) });
    }
    // 7. les plans de la maison
    const plans = P(732, 60, 'bureauPlans', 1);
    this.objet({ nom: 'Les plans de la maison', ouvre: 'améliorer', images: [plans], zone: [732, 60, 92, 88], agir: o => this.ouvrirPlans(o.zone) });
    // 8. le carnet de la forge, une fois qu'elle est proposée
    if (forgeProposee(G)) {
      const cf = P(762, 196, 'bureauCarnetForge', 1);
      this.objet({ nom: 'Le carnet de la forge', ouvre: forgeConstruite(G) ? 'la forge' : 'le coin de la forge', images: [cf], zone: [758, 190, 40, 60], agir: () => { Son.jouer('page'); this.scene.pause(); this.scene.launch('Forge', { appelant: 'Bureau' }); } });
    }
    // 9. l'enseigne, en modèle, appuyée au lambris
    this.poserEnseigneSalle();
    // 10. la porte : elle ramène à l'arrière-boutique
    const versArriere = this.retour === 'Arriere' || this.retour === 'Promenade';
    this.porte = poserPorteGrande(this, PIECE_BUREAU.porte.x, PIECE_BUREAU.sol, { prof: 1, ecriteau: 'L’arrière-boutique' });
    this.objet({ nom: 'La porte', ouvre: versArriere ? 'l’arrière-boutique' : 'sortir', images: [this.porte], zone: [828, 128, 128, 324], agir: () => this.sortir() });
  }

  poserEnseigneSalle() {
    const G = this.G;
    if (this.enseigneSalle) this.enseigneSalle.destroy();
    const e = this.enseigneSalle = poserEnseigne(this, 774, 326, niveauFacade(G), G.nomShop).setScale(0.66).setDepth(1.4);   // (pendue au mur, à ses deux clous)
    if (!this.objetEnseigne) this.objetEnseigne = this.objet({ nom: 'L’enseigne', ouvre: 'le nom du comptoir', images: [], zone: [730, 326, 96, 110], agir: o => { this.ouvrirEnseigne(); this.approcher(this.pageEnseigne, o.zone); } });
    return e;
  }

  // Les dix tiroirs du meuble, et ce que chacun contient aujourd'hui
  tiroirs() {
    const G = this.G;
    const ouvert = {
      reputation: true, camps: true, etrange: true, aventuriers: true, commerce: true, competences: true,
      carnet: !!(G.envie && G.envie.pensees && G.envie.pensees.length),                 // (v1.24) le carnet de JeuneGoy
      formes: typeof moulinFait === 'function' && moulinFait(G),                        // (v1.37) le carnet des formes de fumée
      voyage: !!(G.voyage && G.voyage.lettreLue && !aPontRoyal(G)),                     // (v1.57) le grand voyage
    };
    return TIROIRS_BUREAU.map(([cle, nom]) => ({ cle, nom: cle === 'carnet' ? nomJoueur(G) : nom, ouvert: !!(cle && ouvert[cle]) }));
  }
  ordreSucces() {
    const ordre = Object.keys(CATEGORIES_SUCCES);
    return Object.keys(SUCCES).sort((a, b) => ordre.indexOf(SUCCES[a].cat) - ordre.indexOf(SUCCES[b].cat));
  }

  // --- Le joueur : il entre, il s'assoit, il écrit ; il se lève et ressort ---

  // Assis sur sa chaise, de face derrière la table : sa taille sur l'assise, les mains posées sur le plateau, juste
  // avant son bord. Le corps est derrière la table (le plateau cache le ventre) ; les avant-bras et les mains, à part,
  // se posent par-dessus le registre.
  poseAssise(geste = 'repos') {
    const h = this.heros, cle = textureJoueurBureau(this, this.G, geste), tex = this.textures.get(cle), src = tex.getSourceImage();
    if (h.marche) { h.marche.remove(); h.marche = null; }
    const taille = tex.tailleAssis || src.height * 0.62, mainY = tex.mains ? Math.max(tex.mains.pres[1], tex.mains.loin[1]) : taille - 10;
    const bord = PIECE_BUREAU.table.bas - 116 + 20;   // (le bord avant du plateau)
    h.setCrop().setTexture(cle).setFlipX(false).setOrigin(0.5, taille / src.height).setDepth(1.95);
    this.yAssis = bord - 8 - (mainY - taille) * this.E;
    h.x = PIECE_BUREAU.chaise.x;
    if (!this.mainsHeros) this.mainsHeros = this.add.image(h.x, h.y, cle + '_mains').setDepth(2.12);
    this.mainsHeros.setTexture(cle + '_mains').setOrigin(h.originX, h.originY).setScale(h.scaleX).setVisible(true);
    this.suivreMains();
  }
  suivreMains() { if (this.mainsHeros && this.mainsHeros.active) this.mainsHeros.setPosition(this.heros.x, this.heros.y); }
  cacherMains() { if (this.mainsHeros && this.mainsHeros.active) this.mainsHeros.setVisible(false); }
  asseoir(direct = false) {
    const h = this.heros;
    this.poseAssise('repos');
    if (direct) { h.y = this.yAssis; this.suivreMains(); this.assis = true; this.ecrire(); return Promise.resolve(); }
    // il se laisse descendre sur la chaise (ses jambes, derrière la table, plient), et pose les avant-bras sur le plateau
    h.y = this.yAssis - 60; this.suivreMains();
    return new Promise(ok => this.tweens.add({ targets: h, y: this.yAssis, duration: 380, ease: 'Sine.easeInOut', onUpdate: () => this.suivreMains(),
      onComplete: () => { this.suivreMains(); this.assis = true; this.ecrire(); ok(); } }));
  }
  // Il écrit dans le registre : la plume avance sur la page, il la relève, il se repose un peu
  ecrire() {
    if (this.minuteurEcrit) this.minuteurEcrit.remove();
    const suite = ['ecrit0', 'ecrit1', 'ecrit2', 'ecrit1', 'ecrit0', 'ecrit1', 'ecrit2', 'repos', 'repos', 'repos', 'repos', 'repos'];
    let k = 0;
    for (const g of new Set(suite)) textureJoueurBureau(this, this.G, g);
    this.minuteurEcrit = this.time.addEvent({ delay: 340, loop: true, callback: () => {
      if (!this.assis || !this.heros.active) return;
      k = (k + 1) % suite.length;
      const y = this.heros.y; this.poseAssise(suite[k]); this.heros.y = y; this.suivreMains();
    } });
  }
  seLever() {
    const h = this.heros;
    if (this.minuteurEcrit) { this.minuteurEcrit.remove(); this.minuteurEcrit = null; }
    if (!this.assis) return Promise.resolve();
    this.assis = false;
    this.poseAssise('repos'); h.y = this.yAssis; this.suivreMains();
    return new Promise(ok => this.tweens.add({ targets: h, y: this.yAssis - 60, duration: 320, ease: 'Sine.easeInOut', onUpdate: () => this.suivreMains(), onComplete: () => {
      this.cacherMains(); tournerJoueur(this, h, 'deFace'); h.setY(PIECE_BUREAU.debout).setDepth(1.5); ok(); } }));
  }
  // Il entre : la porte s'ouvre vers nous (il la pousse de l'autre côté), il passe, la tire derrière lui, va à sa table
  async entrer() {
    const h = this.heros, p = this.porte, x = PIECE_BUREAU.porte.x + 22;
    this.entreeEnCours = true;   // (les meubles s'ouvrent déjà ; la porte attend qu'il soit assis)
    tournerJoueur(this, h, 'deFace'); h.setPosition(x, PIECE_BUREAU.sol - 6).setScale(this.E * 0.94).setDepth(p.prof - 0.02).setVisible(false);
    await pauseBureau(this, 250);
    if (!h.active) return;
    p.ouvrir(); await pauseBureau(this, 150); h.setVisible(true); await pauseBureau(this, 260);
    await marcherJusqua(this, h, x, PIECE_BUREAU.sol + 4, { vue: 'deFace', echelle: this.E * 0.97 });
    h.setDepth(1.5);
    await marcherJusqua(this, h, x, PIECE_BUREAU.sol + 22, { vue: 'deFace', echelle: this.E });
    if (!h.active) return;
    p.fermer();   // (il la tire derrière lui)
    await pauseBureau(this, 260);
    await marcherJusqua(this, h, PIECE_BUREAU.chaise.x, PIECE_BUREAU.debout, { vue: 'face' });
    if (!h.active) return;
    tournerJoueur(this, h, 'deFace');
    await pauseBureau(this, 180);
    await this.asseoir();
    this.entreeEnCours = false;
    if (!this.zoom) conseilGarrick(this, 'bureau');
  }
  // Il ressort : il se lève, va à la porte, la tire vers lui (il se tient à droite, la porte s'ouvre de l'autre côté),
  // et passe dans l'arrière-boutique
  async sortir() {
    if (this.sortieEnCours || this.entreeEnCours) return;
    this.sortieEnCours = true;
    if (this.zoom) this.fermerZoom(true);
    if (this.etiquette) { this.etiquette.destroy(); this.etiquette = null; }
    for (const o of [this.calendrier, this.comptes, this.feuille, this.pageEnseigne]) if (o && o.active) o.destroy();
    this.calendrier = this.comptes = this.feuille = this.pageEnseigne = null;
    const h = this.heros, p = this.porte, x = PIECE_BUREAU.porte.x + 22;
    this.tweens.killTweensOf(h);
    await this.seLever();
    await marcherJusqua(this, h, x, PIECE_BUREAU.sol + 22, { vue: 'face' });
    if (!h.active) return;
    tournerJoueur(this, h, 'dos');
    await pauseBureau(this, 160);
    await p.ouvrir(); await pauseBureau(this, 160);
    await marcherJusqua(this, h, x, PIECE_BUREAU.sol + 4, { vue: 'dos', echelle: this.E * 0.97 });
    h.setDepth(p.prof - 0.02);
    this.cameras.main.fadeOut(360);
    await marcherJusqua(this, h, x, PIECE_BUREAU.sol - 8, { vue: 'dos', echelle: this.E * 0.93 });
    this.fermer();
  }

  // --- On s'approche d'un meuble : ce qu'il contient s'ouvre en grand, depuis là où il est ---

  // Une page (un conteneur plein écran) qui grandit depuis le meuble
  approcher(c, zone, duree = 260) {
    if (!c || !zone) return;
    const [x, y, l, h] = zone, cx = x + l / 2, cy = y + h / 2, s0 = 0.18;
    const poser = s => { if (c.active) c.setScale(s).setPosition(cx * (1 - s), cy * (1 - s)); };
    poser(s0); c.setAlpha(0.2);
    this.tweens.addCounter({ from: s0, to: 1, duration: duree, ease: 'Cubic.easeOut', onUpdate: tw => { poser(tw.getValue()); if (c.active) c.setAlpha(Math.min(1, 0.2 + tw.progress * 1.6)); },
      onComplete: () => { poser(1); if (c.active) c.setAlpha(1); } });
  }
  ouvrirZoom(zone, construire) {
    if (this.zoom) this.fermerZoom(true);
    if (this.etiquette) { this.etiquette.destroy(); this.etiquette = null; }
    const c = this.zoom = this.add.container(0, 0).setDepth(40);
    c.zoneMeuble = zone;
    c.add(this.add.rectangle(480, 270, 960, 540, 0x0a0604, 1).setInteractive());
    construire(c);
    const b = creerBouton(this, 860, 512, 170, '◀ Le bureau', () => this.fermerZoom());
    c.add([b.fond, b.label]);
    this.approcher(c, zone);
    return c;
  }
  fermerZoom(direct = false) {
    const c = this.zoom;
    if (!c) return;
    this.zoom = null; this.pages = null; this.ficheDroite = null; this.tiroirOuvert = null; this.vueRegistre = null; this.vueFeuille = null;
    this.carnetOuvert = null; this.decalPages = null; this.tiroirAnime = false; this.pageQuiTourne = null;
    if (direct || !c.zoneMeuble) return c.destroy();
    const [x, y, l, h] = c.zoneMeuble, cx = x + l / 2, cy = y + h / 2;
    for (const o of c.list) if (o.input) o.disableInteractive();
    this.tweens.addCounter({ from: 1, to: 0.18, duration: 200, ease: 'Cubic.easeIn', onUpdate: tw => { const s = tw.getValue(); if (c.active) c.setScale(s).setPosition(cx * (1 - s), cy * (1 - s)).setAlpha(Math.min(1, s * 1.3)); }, onComplete: () => c.destroy() });
  }

  // --- 4. Le registre, ouvert sur la table : ses signets, la feuille du jour à côté ---

  ouvrirRegistre(zone) {
    Son.jouer('page');
    this.ouvrirZoom(zone, c => {
      c.add(this.add.image(0, 0, 'bureauBois').setOrigin(0).setScale(2).setTint(0xc8a080));
      c.add(this.add.image(24, 30, 'zoomRegistre').setOrigin(0).setScale(2));
      this.vueRegistre = this.add.container(0, 0); c.add(this.vueRegistre);
      // la feuille du jour, sous son galet ; le billet de la date (il ouvre le calendrier) ; l'encrier, la bougie
      this.vueFeuille = this.add.container(0, 0); c.add(this.vueFeuille);
      const billet = this.add.image(642, 350, 'zoomBillet').setOrigin(0).setScale(2).setAngle(-2).setInteractive({ useHandCursor: true });
      const date = this.add.text(792, 364, `${dateEnTexte(this.G)} · jour ${this.G.jour}  ▸`, style(12, '#3b2410', { fontStyle: 'italic bold' })).setOrigin(0.5).setAngle(-2);
      if (date.width > 280) date.setScale(280 / date.width);
      billet.on('pointerover', () => billet.setTexture('zoomBillet_clair')).on('pointerout', () => billet.setTexture('zoomBillet'));
      billet.on('pointerdown', () => { Son.jouer('page'); this.ouvrirCalendrier(); this.approcher(this.calendrier, [642, 350, 300, 32]); });
      c.add([billet, date, this.add.image(660, 528, 'zoomEncrier').setOrigin(0.5, 1).setScale(2)]);
      const b = bougie(this, 930, 486, { rayon: 170, profondeur: 0 }); c.add([b.bougie, b.flamme, b.halo]);
      c.add(this.add.image(0, 0, 'vignette').setOrigin(0).setScale(4).setAlpha(0.45));
      this.afficherListe();
      this.dessinerFeuilleDuJour();
    });
  }

  // Les signets de cuir collés au bord des pages : ceux des sections d'avant dépassent sous la page de gauche, la tienne et
  // les suivantes sous celle de droite. Nombreux d'un côté, une sur deux dépasse plus (comme dans un vrai registre).
  onglets() { return ONGLETS.filter(([cle]) => cle !== 'avenir' || (this.G.annonces || []).length || this.onglet === 'avenir'); }
  dessinerSignets(c) {
    const liste = this.onglets(), i0 = Math.max(0, liste.findIndex(o => o[0] === this.onglet));
    const avant = liste.slice(0, i0), apres = liste.slice(i0);
    const cote = (groupe, x0, x1, gauche) => {
      const n = groupe.length; if (!n) return;
      const pas = n <= 3 ? 96 : (x1 - x0 - 88) / (n - 1), decale = n > 3;
      groupe.forEach(([cle, nom], j) => {
        const k = ONGLETS.findIndex(o => o[0] === cle), actif = cle === this.onglet, long = decale && j % 2 === 1;
        const x = gauche ? x1 - 88 - (n - 1 - j) * pas : x0 + j * pas, y = 469;
        const im = this.add.image(x, y, 'zoomLanguette' + k + (long ? '_long' : '') + (actif ? '_actif' : '')).setOrigin(0).setScale(2, actif ? 2.08 : 2).setInteractive({ useHandCursor: true });
        const t = this.add.text(x + 44, y + (long ? 58 : 27) + (actif ? 2 : 0), nom, style(12, actif ? '#ffe9a0' : '#f3d070', { fontStyle: 'bold', stroke: '#2a1206', strokeThickness: 3, brut: true })).setOrigin(0.5);
        if (t.width > 80) t.setScale(80 / t.width);
        im.on('pointerdown', () => { if (cle !== this.onglet) this.tournerPages(cle); });
        im.depthTri = long ? 0 : 1;
        c.add([im, t]); im.texte = t;
      });
      // (les courtes par-dessus les longues : chaque nom reste lisible)
      const ims = c.list.filter(o => o.depthTri !== undefined);
      for (const im of ims.filter(o => o.depthTri === 1)) { c.bringToTop(im); c.bringToTop(im.texte); }
      // les feuilles qui recouvrent le haut des languettes des autres sections
      const fe = this.add.graphics();
      groupe.forEach(([cle], j) => { if (cle === this.onglet) return; const x = gauche ? x1 - 88 - (n - 1 - j) * pas : x0 + j * pas;
        fe.fillStyle(0xe8d4a8).fillRect(x, 469, 88, 3).fillStyle(0xc8ae80).fillRect(x, 472, 88, 1).fillStyle(0x3a1a0a, 0.6).fillRect(x, 473, 88, 2); });
      c.add(fe);
    };
    cote(avant, 36, 318, true);
    cote(apres, 332, 614, false);
  }
  // Tourner les pages jusqu'à une autre section : un feuillet se soulève, se plie sur la reliure et retombe de l'autre côté
  tournerPages(cle) {
    if (this.pageQuiTourne) return;
    const liste = this.onglets(), avance = liste.findIndex(o => o[0] === cle) > liste.findIndex(o => o[0] === this.onglet);
    Son.jouer('page');
    const c = this.zoom; if (!c) return;
    const dos = 324, f = this.pageQuiTourne = this.add.image(dos, 42, 'zoomFeuillet').setOrigin(avance ? 0 : 1, 0).setScale(2);
    const ombre = this.add.rectangle(dos, 256, 290, 428, 0x1a0e06, 0.18).setOrigin(avance ? 0 : 1, 0.5);
    c.add([ombre, f]);
    this.tweens.add({ targets: [f, ombre], scaleX: 0, duration: 150, ease: 'Sine.easeIn', onComplete: () => {
      this.onglet = cle; this.pageListe = 0; this.afficherListe();
      if (!f.active) return;
      c.bringToTop(ombre); c.bringToTop(f);
      f.setOrigin(avance ? 1 : 0, 0); ombre.setOrigin(avance ? 1 : 0, 0.5);
      this.tweens.add({ targets: [f, ombre], scaleX: { from: 0, to: 2 }, duration: 150, ease: 'Sine.easeOut', onUpdate: () => ombre.setScale(f.scaleX / 2, 1),
        onComplete: () => { f.destroy(); ombre.destroy(); this.pageQuiTourne = null; } });
    } });
  }

  // Les fiches de l'onglet : { nom, race, ligne, detail() }
  fiches() {
    const G = this.G;
    const pctAffiche = c => niveauFlair(G) < 1 ? `~${Math.round(c * 10) * 10} %` : `${Math.round(c * 100)} %`;
    switch (this.onglet) {
      case 'avenir':
        return G.annonces.map(a => ({
          nom: a.voyageur.nom, race: a.voyageur.race,
          ligne: `Jour ${a.jour} · ${a.acceptee ? 'commande acceptée' : 'lettre à répondre'}`,
          detail: () => [`Arrive le jour ${a.jour} (lettre ${a.acceptee ? 'acceptée' : 'sans réponse'})`,
            `Quête : ${a.voyageur.quete}`, `Durée : ${pluriel(a.voyageur.duree, "jour", "jours")} · butin espéré ~${a.voyageur.butin} p.`,
            `Commande : ${commandeEnTexte(a.voyageur)}`],
        }));
      case 'aujourdhui': {
        const entrees = [...(this.comptoir && this.comptoir.entree ? [this.comptoir.entree] : []), ...G.file];
        return entrees.map(e => {
          if (e.type === 'client') {
            const v = e.voyageur;
            return { nom: v.nom, race: v.race, ligne: (e === (this.comptoir && this.comptoir.entree) ? 'Au comptoir · ' : 'Dans la file · ') + v.quete,
              detail: () => [`Quête : ${v.quete}`, `Commande : ${commandeEnTexte(v)}`, `Durée : ${pluriel(v.duree, "jour", "jours")} · butin espéré ~${v.butin} p.`] };
          }
          if (e.type === 'famille') {
            const p = e.visite.parent;
            return { nom: p.nom, race: p.race, ligne: `Visite : ${p.lien} ${dePersonne(e.visite.defunt.nom)}`, detail: () => [`Vient au sujet ${dePersonne(e.visite.defunt.nom)}.`] };
          }
          if (e.type === 'faucheuse') return null;   // (v0.93) elle reste une surprise
          // (audit v0.61) les visites sans voyageur (garde, Garrick, collecteur, Serpent, colporteur, notable, aîné...)
          if (!e.parti) {
            const p = CounterScene.prototype.personneDe.call({ G }, e) || {};
            const LIGNES = { garde: 'La garde de la Confrérie', garrick: 'Garrick passe te voir', collecteur: `Le collecteur de ${nomBande(G)}`, serpent: 'Le Serpent à deux têtes', colporteur: 'Le colporteur et sa hotte', notable: 'Un visiteur de marque', aine: 'Un aîné vient te parler', heraut: 'Le héraut du Conseil (commande scellée)', rival: "Lucien Belhomme, le voisin", crieur: 'Le crieur : le mois des comptoirs' };
            return { nom: p.nom || 'Un visiteur', race: p.race || 'humain', ligne: LIGNES[e.type] || 'Une visite', detail: () => [] };
          }
          const v = e.parti.voyageur;
          return { nom: v.nom, race: v.race,
            ligne: e.type === 'retour' ? 'Revient de mission !' : e.type === 'detresse' ? 'Un pigeon : son appel à l’aide' : 'Son carnet est posé sur ton comptoir...',
            detail: () => [`Parti${v.feminin ? 'e' : ''} le jour ${e.parti.depart} : ${v.quete}`] };
        }).filter(Boolean);
      }
      case 'mission':
        return enMission(G).map(p => ({
          nom: p.voyageur.nom, race: p.voyageur.race,
          ligne: `Retour jour ${p.retour} · préparé à ${pctAffiche(p.chance)}`,
          detail: () => [`Quête : ${p.voyageur.quete}`, `Parti${p.voyageur.feminin ? 'e' : ''} le jour ${p.depart}, retour prévu le jour ${p.retour}`,
            `Préparé à ${pctAffiche(p.chance)} · butin espéré ~${p.voyageur.butin} p.`,
            `Colis : ${Object.entries(p.colis).filter(([, n]) => n).map(([id, n]) => `${n} ${ITEMS[id].nom}`).join(', ') || 'rien'}`],
        }));
      case 'revenus':
      case 'disparus':
        return G.historique.filter(h => (this.onglet === 'revenus') === ['vivant', 'echec'].includes(h.issue)).map(h => ({
          nom: h.nom, race: h.race,
          ligne: h.issue === 'echec' ? `Jour ${h.retour} · mission ratée · ${h.quete}` : h.issue === 'vivant' ? `Jour ${h.retour} · +${h.gain} p. · ${h.quete}` : `Jour ${h.retour} · mort${(G.personnes[h.nom] || {}).feminin ? 'e' : ''} ${h.issue === 'valeureux' ? 'au combat' : 'sans gloire'}${h.voulu ? ' · offert à la Faucheuse' : ''}`,
          detail: () => [`Quête : ${h.quete} (jours ${h.depart} à ${h.retour})`,
            ...(() => { const f = (G.personnes[h.nom] || {}).feminin ? 'e' : '';
              return [h.issue === 'echec' ? `Revenu${f} vivant${f}, mais sans rien : mission ratée.` : h.issue === 'vivant' ? `Revenu${f} vivant${f}, a rapporté ${h.gain} pièces.` : `Mort${f} ${h.issue === 'valeureux' ? 'valeureusement au combat' : 'sans gloire'}.`]; })(),
            ...(h.voulu ? [`Offert à la Faucheuse : ${MORTS_VOULUES[h.voulu].texte}.`] : [])],
        }));
      default: {
        const marchands = Object.entries(MARCHANDS).map(([cle, m]) => [m.nom, { race: m.race, marchand: cle }]);
        const connus = Object.keys(G.relations).map(nom => {
          const m = marchands.find(([n]) => n === nom);
          return { nom, race: m ? m[1].race : (G.personnes[nom] || {}).race || 'humain', marchand: m && m[1].marchand };
        });
        connus.sort((a, b) => G.relations[b.nom] - G.relations[a.nom]);
        return connus.map(c => ({
          nom: c.nom, race: c.race,
          ligne: `${niveauRelation(G, c.nom).nom} (${G.relations[c.nom]} pts)${c.marchand ? ' · ' + MARCHANDS[c.marchand].metier : ''}`,
          detail: () => c.marchand ? [`${MARCHANDS[c.marchand].metier} du Marché des Mastres`, `Tu as dépensé ${G.depenses[c.marchand] || 0} pièces chez ${c.nom}.`,
            `Remise actuelle : ${Math.round(remiseMarchand(G, c.marchand) * 100)} %`] : [],
        }));
      }
    }
  }

  // La page de gauche : les fiches de la section (portrait, nom, ligne) ; la page de droite : la fiche choisie
  afficherListe() {
    const c = this.vueRegistre;
    if (!c) return;
    c.removeAll(true);
    this.ficheDroite = null;
    this.dessinerSignets(c);
    const fiches = this.fiches(), titre = (ONGLETS.find(o => o[0] === this.onglet) || ONGLETS[1])[1];
    const pages = Math.max(1, Math.ceil(fiches.length / FICHES_PAR_PAGE));
    this.pageListe = Math.min(this.pageListe, pages - 1);
    c.add(this.add.text(176, 60, titre, style(17, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
    if (!fiches.length) {
      const vide = { avenir: 'Aucune lettre reçue.', aujourdhui: this.comptoir ? 'Plus personne aujourd\'hui.' : 'Le comptoir est fermé.', mission: 'Personne en mission.',
        revenus: 'Personne n\'est encore revenu.', disparus: 'Aucun disparu. Pour l\'instant.', repertoire: 'Tu ne connais encore personne.' }[this.onglet];
      c.add(this.add.text(176, 220, vide, style(13, '#6b4a2a', { fontStyle: 'italic', align: 'center', wordWrap: { width: 240 } })).setOrigin(0.5));
      c.add(this.add.text(472, 240, 'Rien à lire de ce côté.\nUn signet, en bas : une autre section.', style(13, '#8a6a4a', { fontStyle: 'italic', align: 'center' })).setOrigin(0.5));
      return;
    }
    const surPage = fiches.slice(this.pageListe * FICHES_PAR_PAGE, (this.pageListe + 1) * FICHES_PAR_PAGE);
    const avant = this.ficheChoisie;
    this.ficheChoisie = (avant && surPage.find(f => f.nom === avant.nom && f.ligne === avant.ligne)) || surPage[0];
    surPage.forEach((f, i) => {
      const y = 98 + i * 58, choisie = f === this.ficheChoisie;
      const fond = this.add.rectangle(176, y + 10, 264, 54, choisie ? 0xd8c498 : 0xffffff, choisie ? 0.9 : 0.001).setInteractive({ useHandCursor: true });
      fond.on('pointerover', () => { if (!choisie) fond.setFillStyle(0xe4d2a8, 0.8); });
      fond.on('pointerout', () => { if (!choisie) fond.setFillStyle(0xffffff, 0.001); });
      fond.on('pointerdown', () => { this.ficheChoisie = f; Son.jouer('plume'); this.afficherListe(); });
      const quoi = f.race === 'faucheuse' ? 'faucheuse' : { nom: f.nom, race: f.race, niveau: (this.G.personnes[f.nom] || {}).niveau };
      const nom = this.add.text(84, y - 12, f.nom, style(14, couleurNom(this.G, f.nom), { fontStyle: 'bold' }));
      if (nom.width > 224) nom.setScale(224 / nom.width);
      const ligne = this.add.text(84, y + 8, f.ligne, style(11, '#5a3a20', { fontStyle: 'italic', wordWrap: { width: 222 }, maxLines: 2 }));
      c.add([fond, imageCorps(this, 60, y + 32, quoi, 1.7), nom, ligne]);
    });
    if (pages > 1) {
      const nav = (x, texte, sens) => {
        const t = this.add.text(x, 448, texte, style(15, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5).setInteractive({ useHandCursor: true });
        t.on('pointerdown', () => { this.pageListe = (this.pageListe + sens + pages) % pages; this.ficheChoisie = null; Son.jouer('page'); this.afficherListe(); });
        c.add(t);
      };
      nav(66, '◀', -1); nav(286, '▶', 1);
      c.add(this.add.text(176, 448, `page ${this.pageListe + 1} / ${pages}`, style(11, '#6b4a2a')).setOrigin(0.5));
    }
    this.afficherFiche(this.ficheChoisie);
  }

  // --- Une fiche (page de droite) ---

  afficherFiche(f) {
    const G = this.G;
    if (!f) return;
    if (this.ficheDroite) this.ficheDroite.destroy();
    const c = this.ficheDroite = this.add.container(0, 0);
    this.vueRegistre.add(c);
    const quoi = f.race === 'faucheuse' ? 'faucheuse' : { nom: f.nom, race: f.race, niveau: (G.personnes[f.nom] || {}).niveau };
    c.add(imageCorps(this, 472, 196, quoi, 3.4));
    const nom = this.add.text(472, 214, f.nom, style(17, couleurNom(G, f.nom), { fontStyle: 'bold' })).setOrigin(0.5, 0);
    if (nom.width > 260) nom.setScale(260 / nom.width);
    c.add(nom);
    const habitueNiv = (G.habitues.find(h => h.nom === f.nom) || {}).niveau;
    c.add(this.add.text(472, 238, [NOMS_RACES[f.race] || '', habitueNiv ? nomRang(habitueNiv) : ''].filter(Boolean).join(' · '), style(12, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5, 0));

    const lignes = [];
    if (f.nom in G.relations) {
      const n = niveauRelation(G, f.nom);
      const pts = G.relations[f.nom];
      const suivant = NIVEAUX_RELATION[n.index + 1];
      lignes.push(`Relation : ${n.nom} (${pts} pts)`);
      if (suivant) lignes.push(`Prochain palier : ${suivant.nom} à ${suivant.min} pts`);
    } else {
      lignes.push('Relation : Inconnu');
    }
    // Son niveau, ses succès et sa chance.
    const fiche = G.personnes[f.nom];
    if (fiche || f.nom in G.relations) {
      const succes = succesDe(G, f.nom);
      if (habitueNiv) lignes.push(`Rang : ${nomRang(habitueNiv)} (${EXPLICATION_RANGS[habitueNiv]}) · ${succes} mission${succes > 1 ? 's' : ''} réussie${succes > 1 ? 's' : ''}`);
      lignes.push(`Chance (trèfle) : ${trefleDe(G, f.nom)} / ${TREFLE_MAX}`);
      const gouts = fiche && fiche.gouts ? Object.entries(fiche.gouts) : [];
      const aime = gouts.filter(([, g]) => g === 'aime').map(([id]) => CADEAUX[id].nom.toLowerCase());
      const deteste = gouts.filter(([, g]) => g === 'deteste').map(([id]) => CADEAUX[id].nom.toLowerCase());
      if (aime.length) lignes.push(`Aime : ${aime.join(', ')}`);
      if (deteste.length) lignes.push(`Déteste : ${deteste.join(', ')}`);
    }
    const missions = G.historique.filter(h => h.nom === f.nom);
    if (missions.length) {
      const vivants = missions.filter(h => h.issue === 'vivant');
      lignes.push(`Missions terminées : ${missions.length} (${vivants.length} réussie${vivants.length > 1 ? 's' : ''}) · butin : ${vivants.reduce((s, h) => s + h.gain, 0)} p.`);
    }
    const habitue = G.habitues.find(h => h.nom === f.nom);
    if (habitue) {
      const objets = Object.entries(habitue.inventaire).map(([id, e]) => `${ITEMS[id].nom} ${e}/${USURE_MAX}`);
      if (objets.length) lignes.push(`Son matériel : ${objets.join(', ')}`);
      if (habitue.blessures) lignes.push(`Blessures non soignées : ${habitue.blessures}`);
    }
    const detail = f.detail();
    if (detail.length) lignes.push(...detail);
    // (v1.61) la relation en tête, à sa couleur (du rouge des ennemis au vert des frères de sang) ; le reste dessous, qui
    // se resserre s'il le faut pour tenir dans la page
    const titreRel = lignes.shift();
    const tRel = this.add.text(344, 262, titreRel, style(12, f.nom in G.relations ? niveauRelation(G, f.nom).couleur : '#6b5a40', { fontStyle: 'bold', wordWrap: { width: 256 } }));
    c.add(tRel);
    const y0 = 262 + tRel.height + 4, bas = 462;
    let corps = null;
    for (const t of [12, 11, 10]) {
      if (corps) corps.destroy();
      corps = this.add.text(344, y0, lignes.join('\n'), style(t, '#3b2410', { lineSpacing: t > 10 ? 3 : 1, wordWrap: { width: 256 } }));
      if (y0 + corps.height <= bas) break;
    }
    if (y0 + corps.height > bas) corps.setCrop(0, 0, corps.width, bas - y0);
    c.add(corps);
  }

  // La feuille du jour, sous son galet, à côté du registre : qui passe d'abord (▲ ▼) ; tout le rangement sur la grande feuille
  dessinerFeuilleDuJour() {
    const G = this.G, c = this.vueFeuille;
    if (!c) return;
    c.removeAll(true);
    c.add(this.add.image(650, 30, 'zoomFeuilleJour').setOrigin(0).setScale(2).setAngle(1.5));
    c.add(this.add.image(874, 40, 'zoomGalet').setScale(2));
    c.add(this.add.text(786, 62, `Feuille du jour ${G.jour}`, style(16, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5).setAngle(1.5));
    c.add(this.add.text(786, 84, 'Qui passe d’abord ?', style(11, '#6a4a2a', { fontStyle: 'italic' })).setOrigin(0.5).setAngle(1.5));
    const lignes = G.file.filter(e => e.type !== 'faucheuse');
    if (!this.comptoir || !lignes.length) {
      c.add(this.add.text(786, 190, this.comptoir ? 'Personne n’attend plus.' : 'Le comptoir est fermé.\nLa feuille de demain\ns’écrira demain matin.', style(13, '#6a4a2a', { fontStyle: 'italic', align: 'center' })).setOrigin(0.5).setAngle(1.5));
      return;
    }
    const NOTES = { retour: 'Retour de mission', famille: 'Une famille en deuil', garde: 'La garde', gardeRecherche: 'La garde', garrick: 'Garrick', collecteur: 'Le collecteur', serpent: 'Le Serpent à deux têtes',
      colporteur: 'Le colporteur', notable: 'Un visiteur de marque', aine: 'Un aîné des Bannis', carnet: 'Un carnet rapporté', heraut: 'Le messager du Conseil', rival: 'Le voisin', crieur: 'Le crieur', detresse: 'Un pigeon : appel à l\'aide', collectionneur: 'Le collectionneur' };
    const changer = () => { if (this.comptoir && this.comptoir.reconstruireFile) this.comptoir.reconstruireFile(); Son.jouer('plume'); this.dessinerFeuilleDuJour(); if (this.onglet === 'aujourdhui') this.afficherListe(); };
    lignes.slice(0, 6).forEach((e, i) => {
      const y = 114 + i * 33 + i * 0.9, client = e.type === 'client';
      const p = client ? e.voyageur : e.parti ? e.parti.voyageur : e.type === 'famille' ? e.visite.parent : CounterScene.prototype.personneDe.call({ G }, e);
      c.add(this.add.text(668, y, (i + 1) + '.', style(12, '#6a4a2a', { fontStyle: 'bold' })).setOrigin(0, 0.5).setAngle(1.5));
      c.add(this.add.text(688, y - 7, raccourcir((p && p.nom) || NOTES[e.type] || 'Un visiteur', 21), style(12, '#3b2410', { fontStyle: 'bold' })).setOrigin(0, 0.5).setAngle(1.5));
      const v = client ? e.voyageur : null;
      const note = client ? (e.reporte ? "Revient d'hier" : v.prestige ? 'Client prestigieux' : v.prevu ? 'Commande prévue' : 'De passage') : (NOTES[e.type] || 'Une visite');
      c.add(this.add.text(688, y + 8, note, style(10, '#6a4a2a', { fontStyle: 'italic' })).setOrigin(0, 0.5).setAngle(1.5));
      if (client) for (const [x, sens, t] of [[862, -1, '▲'], [888, 1, '▼']]) {
        const f = this.add.text(x, y + 1, t, style(13, '#5a3a20', { fontStyle: 'bold' })).setOrigin(0.5).setAngle(1.5).setInteractive({ useHandCursor: true });
        f.on('pointerover', () => f.setColor('#a0301a')).on('pointerout', () => f.setColor('#5a3a20'));
        f.on('pointerdown', () => { if (deplacerDansFile(G, e, sens)) { G.ordreFile = 'arrivee'; changer(); } });
        c.add(f);
      } else c.add(this.add.text(875, y + 1, 'fixe', style(11, '#8a6a4a', { fontStyle: 'italic' })).setOrigin(0.5).setAngle(1.5));
    });
    const tout = this.add.text(786, 316, lignes.length > 6 ? `+ ${lignes.length - 6} · tout ranger d’un coup ▸` : 'Tout ranger d’un coup ▸', style(12, '#7a3a1a', { fontStyle: 'bold italic' })).setOrigin(0.5).setAngle(1.5).setInteractive({ useHandCursor: true });
    tout.on('pointerover', () => tout.setColor('#a0301a')).on('pointerout', () => tout.setColor('#7a3a1a'));
    tout.on('pointerdown', () => { Son.jouer('page'); this.ouvrirFeuille(); this.approcher(this.feuille, [650, 30, 280, 304]); });
    c.add(tout);
  }

  // --- 2. Le calendrier du mois ---

  // (v0.99, planche 24) les jours passés barrés, aujourd'hui entouré, les loyers, les fêtes, la saison et ses effets,
  // le prochain grand rendez-vous
  ouvrirCalendrier() {
    const G = this.G;
    if (this.calendrier) this.calendrier.destroy();
    creerIconesSaison(this);
    const c = this.calendrier = this.add.container(0, 0).setDepth(60);
    c.add(this.add.rectangle(480, 270, 960, 540, 0x0a0604, 0.55).setInteractive());
    const g = this.add.graphics(); c.add(g);
    g.fillStyle(0xf0e2bc).fillRect(40, 30, 880, 470).lineStyle(4, 0x8a6a30).strokeRect(40, 30, 880, 470).lineStyle(1, 0xc8a050).strokeRect(48, 38, 864, 454);
    const d = dateDuJour(G), saison = saisonDe(G), S = SAISONS[saison];
    c.add(this.add.image(330, 66, 'iconeSaison_' + saison).setScale(1.6));
    c.add(this.add.image(630, 66, 'iconeSaison_' + saison).setScale(1.6));
    c.add(this.add.text(480, 66, `${MOIS[d.mois]} · an ${d.an}`, style(22, '#3b2410', { fontFamily: 'MedievalSharp, serif' })).setOrigin(0.5));
    const prix = Object.entries(PRIX_SAISON[saison]).map(([id, k]) => `${nomObjet(id).toLowerCase()} ${k > 1 ? '+' : '−'}${Math.round(Math.abs(k - 1) * 100)} %`).join(', ');
    c.add(this.add.text(480, 92, `${S.effet} · au marché : ${prix}`, style(12, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5));
    ['Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.', 'Dim.'].forEach((n, i) => c.add(this.add.text(140 + i * 102, 116, n, style(12, '#5a3a20', { fontStyle: 'bold' })).setOrigin(0.5)));
    for (let k = 0; k < JOURS_PAR_MOIS; k++) {
      const col = k % 7, ligne = Math.floor(k / 7), x = 92 + col * 102, y = 128 + ligne * 62, jeu = G.jour + (k + 1 - d.jourDuMois);
      const f = feteDuJour(G, jeu);
      g.fillStyle(f ? (f.camp === 'bien' ? 0xf8e8a0 : f.camp === 'tous' ? 0xd8ecf8 : 0xd8c8e8) : 0xf8f0d8).fillRect(x, y, 96, 56).lineStyle(1, 0xb89a6a).strokeRect(x, y, 96, 56);
      c.add(this.add.text(x + 5, y + 3, String(k + 1), style(11, '#3b2410', { fontStyle: 'bold' })));
      if (k + 1 < d.jourDuMois) g.lineStyle(2, 0x9a7a50, 0.8).lineBetween(x + 8, y + 50, x + 88, y + 8);   // (les jours passés, barrés)
      if (k + 1 === d.jourDuMois) g.lineStyle(3, 0xc02a1a).strokeEllipse(x + 48, y + 28, 90, 50);        // (aujourd'hui)
      if (jeu > 0 && jourDeLoyer(G, jeu)) { c.add(this.add.text(x + 48, y + 44, 'loyer', style(10, '#8a5a2a', { fontStyle: 'italic' })).setOrigin(0.5)); g.fillStyle(0xe8b830).fillCircle(x + 84, y + 12, 6).lineStyle(1, 0x8a6a10).strokeCircle(x + 84, y + 12, 6); }
      if (f) c.add(this.add.text(x + 48, y + 26, f.jour === 1 ? f.titre.replace('La ', '') : f.jour === 0 ? 'la veille' : 'le lendemain', style(10, f.camp === 'bien' ? '#2a4a8a' : f.camp === 'tous' ? '#1e5a8a' : '#5a2a6a', { fontStyle: 'bold', align: 'center', wordWrap: { width: 90 } })).setOrigin(0.5));
    }
    // les quatre saisons de l'année, celle d'aujourd'hui en avant
    ORDRE_SAISONS.forEach((s2, i) => {
      const x = 150 + i * 120;
      if (s2 === saison) g.fillStyle(0xf8e098).fillRect(x - 46, 380, 92, 56);
      c.add(this.add.image(x, 398, 'iconeSaison_' + s2).setScale(1.5));
      c.add(this.add.text(x, 424, SAISONS[s2].nom, style(12, '#3b2410', { fontStyle: s2 === saison ? 'bold' : 'normal' })).setOrigin(0.5));
    });
    const p = prochaineFete(G), now = feteDuJour(G);
    g.fillStyle(0xf8f0d8).fillRoundedRect(640, 378, 250, 64, 8).lineStyle(2, 0xb89a6a).strokeRoundedRect(640, 378, 250, 64, 8);
    c.add(this.add.text(765, 392, 'Prochain grand rendez-vous', style(12, '#5a3a20', { fontStyle: 'bold' })).setOrigin(0.5));
    c.add(this.add.text(765, 418, now ? `${now.titre} : c'est ${['demain le grand jour', "aujourd'hui", 'le dernier jour'][now.jour]} !` : p ? `${p.titre} dans ${pluriel(p.dans, 'jour', 'jours')}` : '—', style(12, '#2a4a8a', { fontStyle: 'bold', wordWrap: { width: 230 }, align: 'center' })).setOrigin(0.5));
    const b = creerBouton(this, 480, 470, 160, 'Fermer', () => { c.destroy(); this.calendrier = null; });
    c.add([b.fond, b.label].filter(Boolean));
  }

  // --- 3. L'ardoise : recettes, dépenses, bénéfice sur quatre périodes (un clic pour refermer) ---

  detailComptes() {
    if (this.comptes) return;
    const G = this.G, c = this.comptes = this.add.container(0, 0).setDepth(60);
    const voile = this.add.rectangle(480, 270, 960, 540, 0x000000, 0.45).setInteractive();
    c.add(voile);
    c.add(this.add.image(480, 262, panneauHD(this, 400, 270, 'ardoise')).setScale(2));
    const craie = (x, y, texte, taille = 13, couleur = '#e8ecdf', origine = 0) =>
      c.add(this.add.text(x, y, texte, style(taille, couleur, { fontStyle: 'italic' })).setOrigin(origine, 0.5));
    craie(480, 154, 'Recettes et dépenses', 18, '#f3f0d8', 0.5);
    const d = debutsDePeriodes(G);
    const periodes = [["Aujourd'hui", bilanPeriode(G, G.jour, G.jour)], ['Semaine', bilanPeriode(G, d.semaine, G.jour)],
      ['Mois', bilanPeriode(G, d.mois, G.jour)], ['Année', bilanPeriode(G, d.an, G.jour)]];
    periodes.forEach(([nom], i) => craie(420 + i * 72, 190, nom, 11, '#c8d4c0', 0.5));
    [['Recettes', 'recettes', '#b8e0a0'], ['Dépenses', 'depenses', '#f0a8a0'], ['Bénéfice', 'benefice', '#f3f0d8']].forEach(([nom, cle, couleur], r) => {
      const y = 222 + r * 32;
      craie(298, y, nom, 13, couleur);
      periodes.forEach(([, b], i) => {
        const v = b[cle];
        craie(420 + i * 72, y, (cle === 'benefice' && v > 0 ? '+' : '') + v, 14, cle === 'benefice' ? (v >= 0 ? '#b8e0a0' : '#f0a8a0') : couleur, 0.5);
      });
    });
    c.add(this.add.graphics().lineStyle(1, 0x8a9a88).lineBetween(298, 270, 662, 270));
    const total = Object.values(G.comptaTotal.pret).reduce((a, b) => a + b, 0);
    craie(298, 312, `Depuis le début : ${Object.values(G.comptaTotal.r).reduce((a, b) => a + b, 0)} p. de recettes`, 11, '#c8d4c0');
    craie(298, 330, total ? `Prêts reçus (hors chiffre d'affaires) : ${total} p.` : 'Les prêts ne comptent pas comme des recettes.', 11, '#c8d4c0');
    craie(480, 366, 'un clic pour refermer', 11, '#a8b4a0', 0.5);
    voile.on('pointerdown', () => { c.destroy(); this.comptes = null; });
  }

  // --- 1. Le meuble à tiroirs : chaque tiroir a son nom sur sa carte, et contient un carnet ---

  ouvrirTiroirs() {
    Son.jouer('glisse');
    const mx = 16, my = 28;
    this.ouvrirZoom([28, 140, 184, 328], c => {
      c.add(this.add.image(0, 0, murInterieur(this, 'murZoomBureau', { l: 480, h: 270, poteaux: [233], graine: 8411 })).setOrigin(0).setScale(2).setTint(0xd0b490));
      c.add(this.add.image(mx, my, 'zoomMeuble').setOrigin(0).setScale(2));
      this.vueTiroirs = this.add.container(0, 0); c.add(this.vueTiroirs);
      this.tiroirs().forEach((t, k) => {
        const col = k % 2, row = Math.floor(k / 2), x = mx + (8 + col * 99) * 2, y = my + (14 + row * 45) * 2;
        const boite = this.add.image(x - 8, y, 'zoomTiroirOuvert').setOrigin(0).setScale(2).setVisible(false);
        const carnet = this.add.image(x + 24, y + 10, 'zoomCarnetFerme').setOrigin(0).setScale(2).setVisible(false);
        const titreCarnet = this.add.text(x + 74, y + 30, t.ouvert ? (t.cle === 'carnet' ? 'Mon carnet' : 'Tes ' + t.nom.toLowerCase().replace(/^les? /, '').replace(/^l’|^l'/, '')) : '', style(9, '#3b2410', { fontStyle: 'bold italic', brut: true })).setOrigin(0.5).setVisible(false);
        if (titreCarnet.width > 54) titreCarnet.setScale(54 / titreCarnet.width);
        const face = this.add.image(x, y, t.ouvert ? 'zoomFaceTiroir' : 'zoomFaceTiroir_vide').setOrigin(0).setScale(2).setInteractive({ useHandCursor: true });
        const nom = this.add.text(x + 95, y + 30, t.ouvert ? t.nom : '', style(11, '#3b2410', { fontStyle: 'bold', brut: true })).setOrigin(0.5);
        if (nom.width > 110) nom.setScale(110 / nom.width);
        const tiroir = { ...t, x, y, boite, carnet, titreCarnet, face, nom, sorti: false };
        face.on('pointerover', () => face.setTexture((t.ouvert ? 'zoomFaceTiroir' : 'zoomFaceTiroir_vide') + '_clair'));
        face.on('pointerout', () => face.setTexture(t.ouvert ? 'zoomFaceTiroir' : 'zoomFaceTiroir_vide'));
        face.on('pointerdown', () => this.tirerTiroir(tiroir));
        this.vueTiroirs.add([boite, carnet, titreCarnet, face, nom]);
      });
      c.add(this.add.text(692, 250, 'Tire un tiroir :\nson carnet s’ouvrira ici.', style(14, '#fff4dc', { fontStyle: 'italic', align: 'center', stroke: '#1a0e06', strokeThickness: 4 })).setOrigin(0.5));
      c.add(this.add.image(0, 0, 'vignette').setOrigin(0).setScale(4).setAlpha(0.4));
    });
  }
  // On tire un tiroir (il vient vers nous : on voit le dedans, et son carnet) ; on le repousse
  tirerTiroir(t) {
    if (this.tiroirAnime) return;
    const autre = this.tiroirOuvert;
    if (autre && autre !== t) { this.repousserTiroir(autre, () => this.tirerTiroir(t)); return; }
    if (t.sorti) { this.repousserTiroir(t); return; }
    this.tiroirAnime = true; t.sorti = true; this.tiroirOuvert = t;
    Son.jouer('glisse');
    t.boite.setVisible(true); t.carnet.setVisible(t.ouvert); t.titreCarnet.setVisible(t.ouvert);
    this.vueTiroirs.bringToTop(t.boite); this.vueTiroirs.bringToTop(t.carnet); this.vueTiroirs.bringToTop(t.titreCarnet); this.vueTiroirs.bringToTop(t.face); this.vueTiroirs.bringToTop(t.nom);
    this.tweens.add({ targets: t.face, y: t.y + 54, x: t.x - 8, scaleX: 2.17, duration: 260, ease: 'Quad.easeOut' });
    this.tweens.add({ targets: t.nom, y: t.y + 84, duration: 260, ease: 'Quad.easeOut', onComplete: () => {
      this.tiroirAnime = false;
      if (!t.ouvert) return gainEnDirect(this, t.x + 95, t.y + 20, 'Ce tiroir est vide pour l’instant.', false, { taille: 12, duree: 1800, profondeur: 45 });
      this.sortirCarnet(t);
    } });
  }
  repousserTiroir(t, ensuite = null) {
    if (this.carnetOuvert) { this.rangerCarnet(() => this.repousserTiroir(t, ensuite)); return; }
    this.tiroirAnime = true;
    Son.jouer('glisse');
    this.tweens.add({ targets: t.face, y: t.y, x: t.x, scaleX: 2, duration: 220, ease: 'Quad.easeIn' });
    this.tweens.add({ targets: t.nom, y: t.y + 30, duration: 220, ease: 'Quad.easeIn', onComplete: () => {
      t.boite.setVisible(false); t.carnet.setVisible(false); t.titreCarnet.setVisible(false);
      t.sorti = false; this.tiroirAnime = false; if (this.tiroirOuvert === t) this.tiroirOuvert = null;
      if (ensuite) ensuite();
    } });
  }
  // Le carnet sort du tiroir et s'ouvre en grand, avec ses vraies pages
  sortirCarnet(t) {
    if (t.cle === 'formes') return ouvrirCarnetFormes(this);   // (v1.37 : son carnet à lui)
    if (t.cle === 'voyage') return ouvrirPageVoyage(this);     // (v1.57)
    const c = this.zoom; if (!c) return;
    Son.jouer('page');
    const X = 400, Y = 62;
    const cx0 = t.x + 74, cy0 = t.y + 31;
    const k = this.carnetOuvert = this.add.container(0, 0);
    c.add(k);
    k.add(this.add.rectangle(X + 278, Y + 220, 540, 422, 0x1a0e06, 0.45));
    k.add(this.add.image(X, Y, 'zoomCarnet').setOrigin(0).setScale(2));
    this.decalPages = { x: X - 22, y: Y - 52, parent: k };
    const fermer = creerBouton(this, X + 270, Y + 452, 200, 'Ranger le carnet', () => this.rangerCarnet());
    k.add([fermer.fond, fermer.label]);
    this.ouvrirTiroir(t.cle, t.nom);
    // (il grandit depuis le tiroir : son milieu va du carnet fermé au milieu de la page)
    t.carnet.setVisible(false); t.titreCarnet.setVisible(false);
    this.animerCarnet(k, t, 0, 1, 300);
  }
  animerCarnet(k, t, de, a, duree, fin = null) {
    const X = 400, Y = 62, mx = X + 270, my = Y + 211, cx0 = t ? t.x + 74 : 480, cy0 = t ? t.y + 31 : 270, s0 = 0.2;
    const poser = u => { if (!k.active) return; const s = s0 + (1 - s0) * u; k.setScale(s); k.x = cx0 + (mx - cx0) * u - mx * s; k.y = cy0 + (my - cy0) * u - my * s; };
    poser(de);
    this.tweens.addCounter({ from: de, to: a, duration: duree, ease: a > de ? 'Cubic.easeOut' : 'Cubic.easeIn', onUpdate: tw => poser(tw.getValue()), onComplete: () => { if (fin) fin(); } });
  }
  rangerCarnet(ensuite = null) {
    const k = this.carnetOuvert, t = this.tiroirOuvert;
    if (!k) { if (ensuite) ensuite(); return; }
    this.carnetOuvert = null; this.pages = null; this.decalPages = null;
    Son.jouer('page');
    for (const o of k.list) if (o.input) o.disableInteractive();
    this.animerCarnet(k, t, 1, 0, 220, () => { k.destroy(); if (t && t.ouvert && t.carnet.active) { t.carnet.setVisible(true); t.titreCarnet.setVisible(true); } if (ensuite) ensuite(); });
  }

  // Les pages du carnet (ou des plans) : un conteneur neuf, posé à sa place (les pages sont dessinées comme sur l'ancien
  // registre : 540 × 422, la page de gauche de 42 à 286, celle de droite de 304 à 548)
  vider() {
    if (this.pages) this.pages.destroy();
    const d = this.decalPages || { x: 0, y: 0, parent: null };
    this.pages = this.add.container(d.x, d.y);
    if (d.parent) d.parent.add(this.pages);
    return this.pages;
  }

  ouvrirTiroir(cle, nom = (TIROIRS.find(t => t[0] === cle) || [])[1]) {
    const G = this.G;
    if (cle === 'formes') return ouvrirCarnetFormes(this);
    if (cle === 'voyage') return ouvrirPageVoyage(this);   // (v1.57)
    if (cle === 'forge') { this.scene.pause(); this.scene.launch('Forge', { appelant: 'Bureau' }); return; }
    const c = this.vider();
    if (cle === 'ameliorations') return this.afficherAmeliorations(c);
    if (cle === 'camps') return this.afficherCamps(c);
    const TITRES = { competences: 'Tes compétences', aventuriers: 'Chiffres des missions', commerce: 'Le commerce', reputation: 'Réputation et relations', etrange: 'Choses étranges', carnet: `Le carnet de ${nomJoueur(G)}` };
    c.add(this.add.text(161, 72, TITRES[cle] || nom, style(16, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
    const top = (obj, n, format) => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n).map(format);
    // Chaque page est faite de blocs encadrés, un sujet par bloc (« des catégories bien encadrées »)
    let gauche = [], droite = [];
    if (cle === 'competences') {
      const flair = niveauFlair(G);
      const prochainArtisanat = (niveauArtisanat(G) + 1) * 4;
      gauche = [
        { titre: 'Toi', lignes: [`${nomJoueur(G)}, ${ageJoueur(G)} ans`,
          // (v0.93) la bénédiction de la nymphe, et sa fiole
          benieJusqua(G) ? `Bénédiction de la nymphe jusqu'au jour ${benieJusqua(G)} (+${Math.round(NYMPHE.benediction.bonus * 100)} % rivières, marais, gourdes)` : '',
          G.nymphe && G.nymphe.fiole ? 'La fiole de la nymphe : une potion de plus chaque semaine' : ''] },
        { titre: `Flair : ${Math.round(flair * 100)} %`, lignes: [flair < 1 ? `Tes estimations peuvent se tromper de ±${Math.round(35 * (1 - flair))} %.` : 'Tes estimations sont exactes.', flair < 1 ? `Il monte en servant des clients (${G.experience} / ${EXPERIENCE_MAX}).` : ''] },
        { titre: `Artisanat : niveau ${niveauArtisanat(G)}`, lignes: [`Réparations faites : ${G.reparations} (niveau suivant à ${prochainArtisanat})`, `Matériaux par réparation : ${materiauxRequis(G)}`, `${niveauArtisanat(G)} jour(s) de moins à l'atelier`] },
        // (v0.93) la persuasion
        (() => { const n = niveauPersuasion(G), suivant = PERSUASION.paliers[n + 1];
          return { titre: `Persuasion : niveau ${n}`, lignes: [`Marchandages réussis : ${G.persuasion || 0}${suivant != null ? ` (niveau suivant à ${suivant})` : ''}`,
            n ? `+${n} de patience aux clients · ils partent moins fâchés` : 'Elle monte quand tu obtiens plus que ce qu\'on te proposait.',
            n ? `Parfois, un client lâche 5 % au-delà de sa limite (${Math.round(PERSUASION.auDela[n] * 100)} %)` : ''] }; })(),
      ];
      droite = [
        { titre: 'Marchandage', lignes: Object.entries(MARCHANDS).map(([m, d]) => `${d.nom} : ${niveauRelation(G, d.nom).nom}${remiseMarchand(G, m) ? ` (−${Math.round(remiseMarchand(G, m) * 100)} %)` : ''}`) },
        { titre: "Main-d'œuvre", lignes: [G.employes.length ? `${pluriel(ouvriers(G).length, "réparation", "réparations")} à la fois · salaires : ${salaires(G)} p. par nuit` : "Personne : embauche un ouvrier à l'atelier",
          // (v0.60) le bilan de chacun ; (v1.62) avec son niveau, son salaire du moment et sa prochaine hausse
          ...G.employes.map(id => { const b = bilanEmploye(G, id), h = prochainesHausses(G, id);
            return `${prenomDe(EMPLOYES[id].nom)} (niv. ${niveauEmploye(G, id)}) : ${salaireEmploye(G, id)} p. par nuit, +${h.mois.montant} p. dans ${h.mois.jours} j · ${b.reparations} rép., +${b.valeur} p. de valeur pour ${b.cout} p. payés` + (b.cout >= 20 ? (b.solde >= 0 ? ' ✓' : ' (donne-lui du travail !)') : ''); })] },
      ];
    } else if (cle === 'carnet') {
      // (v1.24, planche 50 v3) le carnet de JeuneGoy : chaque pensée de départ, datée (les dix dernières)
      const notes = ((G.envie || {}).pensees || []).slice(-10);
      const blocs = notes.map(n => ({ titre: `Jour ${n.jour} · ${n.age} ans`, lignes: [n.texte.replace(/^« | »$/g, '')] }));
      gauche = blocs.slice(0, 5); droite = blocs.slice(5);
      if (!droite.length) droite = [{ titre: 'Le chemin parcouru', lignes: ['15 ans : rêver → 18 ans : voir → les secrets : savoir'] }];
    } else if (cle === 'etrange') {
      // (v0.60) le carnet des choses étranges : les indices glissés dans les récits (les huit derniers)
      const notes = (G.etrangetes || []).slice(-8);
      const blocs = notes.length ? notes.map(n => ({ titre: `Jour ${n.jour} · ${n.nom}`, lignes: [`« ${n.texte} »`] }))
        : [{ titre: 'Rien encore', lignes: ["Certains récits laissent des questions sans réponse. Quand un aventurier en rapportera une, tu la noteras ici."] }];
      gauche = blocs.filter((_, i) => i % 2 === 0);
      droite = blocs.filter((_, i) => i % 2 === 1);
    } else if (cle === 'aventuriers') {
      const h = G.historique;
      const vivants = h.filter(x => x.issue === 'vivant').length;
      gauche = [
        { titre: 'Les missions', lignes: [`Réussies : ${vivants}`, `Ratées : ${h.filter(x => x.issue === 'echec').length}`, `Morts au combat : ${h.filter(x => x.issue === 'valeureux').length}`, `Morts sans gloire : ${h.filter(x => x.issue === 'sans gloire').length}`, `Taux de retour : ${h.length ? Math.round(vivants / h.length * 100) : 0} %`] },
        { titre: 'Les clients', lignes: [`Servis : ${G.stats.servis ?? G.experience}`, `Refusés : ${G.stats.refus}`, ...(G.stats.lettresAcceptees || G.stats.lettresRefusees ? [`Lettres acceptées : ${G.stats.lettresAcceptees} · refusées : ${G.stats.lettresRefusees}`] : [])] },
      ];
      const gains = {};
      h.forEach(x => { if (x.issue === 'vivant') gains[x.nom] = (gains[x.nom] || 0) + x.gain; });
      droite = [
        { titre: 'Meilleurs clients', lignes: top(gains, 5, ([n, v]) => `${n} : ${v} p.`) },
        { titre: 'Objets les plus donnés', lignes: top(G.stats.objets, 5, ([id, v]) => `${ITEMS[id].nom} : ${v}`) },
      ];
    } else if (cle === 'commerce') {
      gauche = [{ titre: 'Recettes (depuis le début)', lignes: top(G.comptaTotal.r, 10, ([p, v]) => `${POSTES[p] || p} : ${v} p.`) }];
      droite = [
        { titre: 'Dépenses (depuis le début)', lignes: top(G.comptaTotal.d, 10, ([p, v]) => `${POSTES[p] || p} : ${v} p.`) },
        { titre: 'Trouvailles', lignes: [`Vendues aux enchères : ${G.stats.ventes}`, `À l'atelier : ${G.tresors.length}`] },
      ];
    } else {
      const parNiveau = {};
      Object.keys(G.relations).forEach(n => { const k = niveauRelation(G, n).nom; parNiveau[k] = (parNiveau[k] || 0) + 1; });
      const F = G.faucheuse;
      const m = F.mission;
      gauche = [
        { titre: `Réputation : ${arrondi(G.reputation)}`, lignes: [`Retours réussis : ${[1, 2, 3, 4, 5].map(d => `${d}★ ${(G.succes || {})[d] || 0}`).join(' · ')}`] },
        { titre: NOMS_ARMURE[coteArmure(G)], lignes: [`${(G.armure || []).length} / ${ARMURE.length} pièces` + (G.camp ? ` · camp scellé : ${G.camp === 'mal' ? "l'ombre" : 'la lumière'}` : ''), `Armes légendaires : ${(G.armesLegendaires || []).length} / ${Object.keys(ARMES_LEGENDAIRES).length}`] },
        { titre: `La Faucheuse : ${seductionFaucheuse(G).nom}`, lignes: [`Âmes offertes : ${arrondi(G.mal)}` + (G.mal >= SEUIL_SABOTAGE ? ' · sabotages possibles' : '') + (G.mal >= SEUIL_MAIN_NOIRE ? ' · la Main Noire te connaît' : ''), `${F.morts} âme${F.morts > 1 ? 's' : ''} emportée${F.morts > 1 ? 's' : ''}` + (F.sabotages ? ` · ${F.sabotages} sabotage${F.sabotages > 1 ? 's' : ''}` : ''), ...(m && m.etat !== 'proposee' ? [`Mission de mort : ${m.cible.nom} (${PIEGES[m.piege].nom.toLowerCase()}, ${m.prime} p.)`] : [])] },
        { titre: 'Le mendiant', lignes: [`Donné : ${G.mendiant} p.`] },
      ];
      droite = [
        { titre: 'Tes relations', lignes: NIVEAUX_RELATION.slice().reverse().map(n => `${n.nom} : ${parNiveau[n.nom] || 0}`) },
        { titre: 'Décorations du comptoir', lignes: G.decorations.length ? G.decorations.map(id => `• ${DECORATIONS[id].nom}`) : ["aucune pour l'instant"] },
        // (v1.23) les collections de la vitrine, et les titres des séries complètes
        ...(typeof COLLECTIONS !== 'undefined' ? [{ titre: 'La vitrine des collections', lignes: [
          ...titresCollections(G).map(t => `★ « ${t} »`),
          Object.keys(COLLECTIONS).map(k => `${nbPieces(G, k)}/${totalSerie(k)}`).join(' · ') + ' (trophées · armes · nymphe · Conseil · Bannis · carte)'] }] : []),
      ];
    }
    this.pageEnBlocs(c, 42, 96, gauche);
    this.pageEnBlocs(c, 304, 96, droite);
  }

  // Une colonne de blocs encadrés : un titre sur un bandeau, puis ses lignes. Si la colonne déborde, on recommence plus serré.
  pageEnBlocs(c, x, y0, blocs, largeur = 244, bas = 470) {
    for (const taille of [12, 11, 10]) {
      const objets = [];
      let y = y0;
      for (const b of blocs) {
        let lignes = (b.lignes || []).filter(l => l !== '');
        if (!lignes.length) lignes = ["rien pour l'instant"];
        const titre = this.add.text(x + 8, y + 4, b.titre, style(taille + 1, '#6a1a10', { fontStyle: 'bold', wordWrap: { width: largeur - 16 } }));
        const corps = this.add.text(x + 8, y + titre.height + 9, lignes.join('\n'), style(taille, '#3b2410', { lineSpacing: taille > 11 ? 3 : 1, wordWrap: { width: largeur - 16 } }));
        const h = titre.height + 9 + (lignes.length ? corps.height + 6 : 0);
        const cadre = this.add.graphics();
        cadre.fillStyle(0xf4e8c8, 0.55).fillRect(x, y, largeur, h);
        cadre.fillStyle(0xd8b888, 0.7).fillRect(x, y, largeur, titre.height + 7);
        cadre.lineStyle(1.5, 0x8a5a2a, 0.9).strokeRect(x, y, largeur, h);
        objets.push(cadre, titre, corps);
        y += h + 8;
      }
      if (y <= bas || taille === 10) { c.add(objets); return y; }
      for (const o of objets) o.destroy();
    }
  }

  // --- La jauge lumière ⟷ ombre (étape 9a) : le carnet « Lumière et ombre » ---

  // (v0.90) Le livre des deux voies. Page de gauche : la balance, et le prochain palier de chaque côté. Page de droite :
  // ce qui fait pencher la balance, et tes derniers gestes.
  afficherCamps(c) {
    const G = this.G, j = jaugeCamp(G), lo = etatLO(G), serment = sermentDe(G);
    this.time.delayedCall(300, () => conseilGarrick(this, 'jauge', true));
    creerGlyphesHD(this); creerEmblemesHD(this);
    c.add(this.add.text(161, 70, 'Le livre des deux voies', style(16, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
    c.add(this.add.text(161, 90, 'De quel côté le monde te voit', style(11, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5, 0));
    c.add(this.add.image(50, 128, 'embleme_bannis').setScale(0.5));
    c.add(this.add.image(272, 128, 'embleme_confrerie').setScale(0.5));
    c.add(barreJauge(this, 161, 132, 196, j, { h: 14 }));
    c.add(this.add.text(161, 160, nomPalierCamp(G), style(15, j > 0 ? '#9a7a10' : j < 0 ? '#5a3a8a' : '#5a3a20', { fontStyle: 'bold' })).setOrigin(0.5, 0));
    const etat = G.camp ? `ton camp est scellé : ${G.camp === 'mal' ? "l'ombre" : 'la lumière'}`
      : G.sceauNeutre ? "ni la lumière, ni l'ombre : l'armure attend quelqu'un d'autre"
        : serment ? `serment prêté ${serment === 'bien' ? 'à la Confrérie' : 'aux Bannis'}` : Math.abs(j) < PALIERS_JAUGE[0] ? 'tu es dans la zone neutre' : `tu penches ${j > 0 ? 'vers la lumière' : "vers l'ombre"}`;
    c.add(this.add.text(161, 180, `Balance : ${j > 0 ? '+' : ''}${j} · ${etat}`, style(11, '#5a3a20', { wordWrap: { width: 240 }, align: 'center' })).setOrigin(0.5, 0));
    const pp = prochainsPaliers(G);
    let y = 210;
    for (const camp of ['bien', 'mal']) {
      const p = pp[camp];
      c.add(this.add.rectangle(161, y + 42, 236, 88, 0xe8d6b0).setStrokeStyle(2, 0x8a6a40));
      c.add(this.add.image(56, y + 13, 'glyphe_' + (camp === 'bien' ? 'soleil' : 'lune')).setScale(2));
      const titre = p ? `${NOMS_PALIERS_JAUGE[p.palier]} (${p.seuil > 0 ? '+' : '−'}${Math.abs(p.seuil)})` : `${NOMS_PALIERS_JAUGE[camp === 'bien' ? 3 : -3]} : atteint`;
      c.add(this.add.text(70, y + 4, titre + (p && Math.abs(p.palier) === 2 ? ' · le Carrefour' : ''), style(13, camp === 'bien' ? '#8a6a10' : '#5a3a8a', { fontStyle: 'bold' })));
      let texte = p ? OFFRES_PALIERS[p.palier] : `Tu es allé${eJ(G)} au bout de ce chemin.`;
      const o = lo.offres[camp];
      if (p && Math.abs(p.palier) === 2 && o) texte = o === 'juree' ? 'Tu as déjà prêté serment de ce côté.' : o === 'parjure' ? 'Tu as rompu ton serment : ce camp ne te le proposera plus.' : 'Tu as choisi de rester libre. Le camp refusé reviendra une dernière fois au 3e palier.';
      c.add(this.add.text(52, y + 26, texte, style(11, '#3b2410', { wordWrap: { width: 214 }, lineSpacing: 1 })));
      y += 98;
    }
    const armure = `Le sceau : ${(G.armure || []).length} / ${ARMURE.length} pièces d'armure.`;
    c.add(this.add.text(161, y + 2, mafia(G).engage && !mafia(G).sorti ? `${armure}\n${NomBande(G)} : ${nomRangMafia(rangMafia(G), G)}` : `${armure}\nLes paliers d'après ? Le livre ne les montre pas encore...`,
      style(10, '#7a5a3a', { fontStyle: 'italic', wordWrap: { width: 236 }, align: 'center' })).setOrigin(0.5, 0));
    c.add(this.add.text(425, 70, 'Ce qui fait pencher la balance', style(14, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
    const bareme = Object.values(BAREME_CAMP).sort((a, b) => (a.camp === b.camp ? a.n - b.n : a.camp === 'bien' ? -1 : 1));
    bareme.forEach((b, i) => {
      const yy = 88 + i * 17;
      c.add(this.add.image(316, yy + 7, 'glyphe_' + (b.camp === 'bien' ? 'soleil' : 'lune')).setScale(1.2));
      c.add(this.add.text(328, yy, `+${b.n}`, style(11, b.camp === 'bien' ? '#8a6a10' : '#5a3a8a', { fontStyle: 'bold' })));
      const tb = this.add.text(350, yy + 1, b.texte, style(10, '#3b2410'));
      if (tb.width > 194) tb.setScale(194 / tb.width, 1);   // (v1.64 : les plus longs se serrent, sans sortir de la page)
      c.add(tb);
    });
    const yj = 88 + bareme.length * 17 + 6;
    c.add(this.add.rectangle(425, yj, 236, 2, 0x8a6a40));
    c.add(this.add.text(425, yj + 6, 'Ces derniers jours', style(13, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5, 0));
    const journal = lo.journal.slice(0, 4);
    if (!journal.length) c.add(this.add.text(425, yj + 30, "Rien encore : la balance attend tes premiers gestes.", style(11, '#6b4a2a', { fontStyle: 'italic', align: 'center', wordWrap: { width: 230 } })).setOrigin(0.5, 0));
    journal.forEach((e, i) => {
      const yy = yj + 28 + i * 19, b = BAREME_CAMP[e.cle] || { camp: 'bien' };
      c.add(this.add.image(316, yy + 7, 'glyphe_' + (b.camp === 'bien' ? 'soleil' : 'lune')).setScale(1.2));
      const tj = this.add.text(328, yy, raccourcir(`Jour ${e.jour} · +${e.n} · ${texteGeste(e)}`, 40), style(11, '#3b2410'));
      if (tj.width > 216) tj.setScale(216 / tj.width, 1);
      c.add(tj);
    });
    c.add(this.add.text(425, yj + 108, `Au sceau (${ARMURE.length}e pièce d'armure), sans serment et dans la zone neutre : une autre fin...`, style(10, '#7a5a3a', { fontStyle: 'italic', align: 'center', wordWrap: { width: 230 } })).setOrigin(0.5, 0));
  }

  // --- 7. Les plans de la maison : améliorer le comptoir ---

  ouvrirPlans(zone) {
    Son.jouer('page');
    this.ouvrirZoom(zone, c => {
      c.add(this.add.image(0, 0, murInterieur(this, 'murZoomPlans', { l: 480, h: 270, poteaux: [], graine: 8413 })).setOrigin(0).setScale(2).setTint(0xd0b490));
      c.add(this.add.rectangle(213 + 270, 63 + 214, 540, 422, 0x1a0e06, 0.35));
      c.add(this.add.image(206, 56, 'zoomPlans').setOrigin(0).setScale(2));
      c.add(this.add.text(476, 30, 'Les plans de la maison', style(16, '#fff4dc', { fontStyle: 'bold italic', stroke: '#1a0e06', strokeThickness: 4 })).setOrigin(0.5));
      this.decalPages = { x: 206 - 22, y: 56 - 52, parent: c };
      this.afficherAmeliorations(this.vider());
      c.add(this.add.image(0, 0, 'vignette').setOrigin(0).setScale(4).setAlpha(0.35));
    });
  }

  // Page de gauche : les meubles et leur niveau ; page de droite : le meuble choisi, avant/après.
  afficherAmeliorations(c, choisi = this.meubleChoisi || 'reserve') {
    const G = this.G;
    this.meubleChoisi = choisi;
    c.add(this.add.text(161, 72, 'Améliorer le comptoir', style(16, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
    c.add(this.add.text(161, 94, 'Commande le soir : les ouvriers\npassent pendant la nuit.', style(11, '#6b4a2a', { fontStyle: 'italic', align: 'center' })).setOrigin(0.5, 0));
    // (v1.64 : huit meubles depuis le cellier : la liste se resserre pour tenir dans la page)
    const liste = Object.entries(AMELIORATIONS), pas = Math.min(50, (446 - 148) / Math.max(1, liste.length - 1));
    liste.forEach(([cle, a], i) => {
      const y = 148 + i * pas;
      const n = niveauAmelioration(G, cle);
      const fond = this.add.rectangle(161, y - 6, 252, pas - 4, cle === choisi ? 0xd8c498 : 0xffffff, cle === choisi ? 1 : 0.001).setInteractive({ useHandCursor: true });
      fond.on('pointerdown', () => { Son.jouer('plume'); const p = this.vider(); this.afficherAmeliorations(p, cle); });
      const etoiles = n ? '★'.repeat(n) : '—';
      const prevu = (G.travaux || []).includes(cle) ? ' · travaux cette nuit' : '';
      c.add([fond,
        this.add.text(44, y - 18, a.nom, style(13, '#3b2410', { fontStyle: 'bold' })),
        this.add.text(44, y, `${a.niveaux[n]}${prevu}`, style(11, '#5a3a20', { fontStyle: 'italic' })),
        this.add.text(278, y - 16, etoiles, style(14, '#b8860b')).setOrigin(1, 0)]);
    });
    const a = AMELIORATIONS[choisi];
    const n = niveauAmelioration(G, choisi);
    const suivant = ameliorationSuivante(G, choisi);
    c.add(this.add.text(423, 72, a.nom, style(15, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
    const texteEffet = this.add.text(423, 92, a.effet, style(11, '#5a3a20', { align: 'center', wordWrap: { width: 236 } })).setOrigin(0.5, 0);
    c.add(texteEffet);
    // (v1.30) l'image du meuble ne recouvre jamais le texte de l'effet (la chambre en a un long)
    const apercu = (niveau, y) => {
      const { cle, echelle } = this.apercuMeuble(choisi, niveau);
      const im = this.add.image(423, y, cle).setScale(echelle);
      if (y < 260) im.y = Math.max(y, texteEffet.y + texteEffet.height + 6 + im.displayHeight / 2);
      c.add(im);
      const lab = this.add.text(423, Math.max(y + 46, im.y + im.displayHeight / 2 + 8), `${niveau ? '★'.repeat(niveau) + '  ' : ''}${a.niveaux[niveau]}`, style(12, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5);
      c.add(lab);
      return lab.y + lab.height / 2;
    };
    const bas = apercu(n, 196);
    if (!suivant) {
      c.add(this.add.text(423, 330, 'Le plus beau qui soit !', style(14, '#8a6a10', { fontStyle: 'bold italic' })).setOrigin(0.5));
      return;
    }
    const yFleche = Math.max(262, bas + 12);
    c.add(this.add.text(423, yFleche, '▼', style(16, '#8a6a4a')).setOrigin(0.5));
    apercu(suivant.niveau, yFleche + 56);
    // (v0.84) l'étagère : combien de places on gagne, par rapport à aujourd'hui
    const agr = choisi === 'reserve' ? agrandissementSuivant(G) : null;
    if (agr) c.add(this.add.text(423, 394, `${G.capacite} places → ${agr.capacite} places (+${agr.capacite - G.capacite})`, style(13, '#2a5a20', { fontStyle: 'bold' })).setOrigin(0.5));
    const prevu = (G.travaux || []).includes(choisi);
    const b = creerBouton(this, 423, 428, 230, prevu ? 'Prévu cette nuit' : `Commander · ${suivant.prix} p.`, () => {
      const erreur = commanderAmelioration(G, choisi);
      const p = this.vider();
      this.afficherAmeliorations(p, choisi);
      if (erreur) p.add(this.add.text(423, 456, erreur, style(12, '#a03030', { fontStyle: 'bold', wordWrap: { width: 240 }, align: 'center' })).setOrigin(0.5, 0));
      else p.add(this.add.text(423, 456, choisi === 'reserve' ? 'Ta réserve est agrandie !' : 'Commandé ! Les ouvriers viendront cette nuit.', style(12, '#3a6a20', { fontStyle: 'bold' })).setOrigin(0.5, 0));
    });
    b.label.setFontSize(15);
    if (prevu) b.setActif(false);
    // (v0.84) trop cher : le bouton reste cliquable (grisé), pour dire clairement combien il manque
    else if (!peutPayer(G, suivant.prix)) { b.fond.setTint(0x9a9a9a); b.label.setAlpha(0.6); }
    c.add([b.fond, b.label]);
  }

  // La texture d'un meuble à un niveau donné, et l'échelle pour l'aperçu (page de droite).
  apercuMeuble(cle, n) {
    switch (cle) {
      case 'reserve': return { cle: etagereHD(this, n), echelle: 0.42 };
      case 'comptoir': return { cle: plateauComptoir(this, n), echelle: 0.5 };
      case 'coffre': return { cle: coffreHD(this, n), echelle: 2.4 };
      case 'chambre': return { cle: litHD(this, n), echelle: n >= 3 ? 0.55 : 1.2 };
      case 'atelier': return { cle: iconeObjet(this, 'enclume'), echelle: 2.6 + n * 0.5 };
      case 'cellier': return { cle: cellierHD(this, n), echelle: 2.2 };   // (v1.54)
      case 'serrure': return { cle: serrureHD(this, n), echelle: 2.8 };   // (v1.55)
      default: return { cle: luminaireHD(this, n), echelle: n >= 4 ? 1.1 : n >= 2 ? 1.6 : 2.6 };
    }
  }

  // --- 6. Le tableau des succès, à sa place : les médailles gagnées brillent, les autres restent grises ---

  ouvrirSucces(zone) {
    const G = this.G;
    G.succesNonVus = 0;
    if (this.badgeSucces) { this.badgeSucces.destroy(); this.badgeSucces = null; }
    Son.jouer('page');
    this.pageSucces = 0; this.catSucces = 'tous';
    this.ouvrirZoom(zone, c => {
      c.add(this.add.image(0, 0, murInterieur(this, 'murZoomSucces', { l: 480, h: 270, poteaux: [], graine: 8412 })).setOrigin(0).setScale(2).setTint(0xd0b490));
      c.add(this.add.image(500, 30, 'zoomSucces').setOrigin(0).setScale(2));
      this.vueSucces = this.add.container(0, 0); c.add(this.vueSucces);
      this.vueFicheSucces = this.add.container(0, 0); c.add(this.vueFicheSucces);
      c.add(this.add.image(0, 0, 'vignette').setOrigin(0).setScale(4).setAlpha(0.3));
      this.dessinerSucces();
      this.ficheSucces(null);
    });
  }
  dessinerSucces() {
    const G = this.G, c = this.vueSucces, bx = 500, by = 30;
    c.removeAll(true);
    const ids = this.ordreSucces(), total = ids.length, n = ids.filter(id => aLeSucces(G, id)).length, pages = Math.max(1, Math.ceil(total / 35));
    // les catégories, sur une feuille punaisée à gauche : un clic ne laisse briller que les siennes
    const g = this.add.graphics();
    g.fillStyle(0x1a0e06, 0.4).fillRect(46, 46, 400, 268).fillStyle(0xead9b0).fillRect(40, 40, 400, 268).lineStyle(3, 0x8a6a3a).strokeRect(40, 40, 400, 268);
    g.fillStyle(0x8a2a1a).fillCircle(240, 46, 5).fillStyle(0xd85a3a).fillCircle(238.5, 44.5, 2);
    c.add(g);
    c.add(this.add.text(240, 66, `Tes succès · ${n} / ${total} · ${Math.round(100 * n / total)} %`, style(15, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
    c.add(this.add.rectangle(240, 88, 340, 10, 0x6b4a2a).setStrokeStyle(1, 0x3b2410));
    c.add(this.add.rectangle(71, 88, Math.max(1, 338 * n / total), 6, 0xe8b830).setOrigin(0, 0.5));
    const cats = { tous: 'Tous les succès', ...CATEGORIES_SUCCES };
    Object.entries(cats).forEach(([k, nom], i) => {
      const x = i % 2 ? 250 : 60, y = 112 + Math.floor(i / 2) * 36, l = ids.filter(id => k === 'tous' || SUCCES[id].cat === k), sel = k === this.catSucces;
      const f = this.add.rectangle(x + 85, y, 178, 28, sel ? 0x8a3a1a : 0xe8d8b8).setStrokeStyle(2, 0x6b4a2a).setInteractive({ useHandCursor: true });
      f.on('pointerdown', () => { this.catSucces = k; Son.jouer('plume'); this.dessinerSucces(); });
      const t1 = this.add.text(x + 8, y, nom, style(12, sel ? '#ffe9a8' : '#3b2410', { fontStyle: 'bold' })).setOrigin(0, 0.5);
      if (t1.width > 122) t1.setScale(122 / t1.width);
      c.add([f, t1, this.add.text(x + 166, y, `${l.filter(id => aLeSucces(G, id)).length}/${l.length}`, style(11, sel ? '#ffe9a8' : '#6b4a2a')).setOrigin(1, 0.5)]);
    });
    // les médailles, épinglées sur le velours (sept par rang)
    this.pageSucces = Math.min(this.pageSucces, pages - 1);
    ids.slice(this.pageSucces * 35, this.pageSucces * 35 + 35).forEach((id, k) => {
      const S = SUCCES[id], col = k % 7, row = Math.floor(k / 7), x = bx + 52 + col * 56, y = by + 54 + row * 62, ok = aLeSucces(G, id);
      const dans = this.catSucces === 'tous' || S.cat === this.catSucces;
      if (ok && dans) { const h = this.add.image(x, y + 4, 'halo').setScale(0.5).setTint(0xfff0a0).setAlpha(0.45).setBlendMode(Phaser.BlendModes.ADD); c.add(h);
        this.tweens.add({ targets: h, alpha: 0.25, duration: 1400 + k * 37, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }); }
      const os = poserMedaille(this, x, y, S.palier, S.icone, 1, !ok);
      for (const o of os) { if (!dans) o.setAlpha(0.3); c.add(o); }
      const z = this.add.rectangle(x, y + 6, 52, 58, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
      z.on('pointerdown', () => { Son.jouer('plume'); this.ficheSucces(id, { x, y }); });
      c.add(z);
    });
    c.add(this.add.text(bx + 222, by + 374, `Tes succès · ${n} / ${total}`, style(13, '#3b2410', { fontStyle: 'bold', brut: true })).setOrigin(0.5));
    if (pages > 1) for (const [x, sens, t] of [[bx + 120, -1, '◀'], [bx + 324, 1, '▶']]) {
      const f = this.add.text(x, by + 374, t, style(15, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5).setInteractive({ useHandCursor: true });
      f.on('pointerdown', () => { this.pageSucces = (this.pageSucces + sens + pages) % pages; this.dessinerSucces(); });
      c.add(f);
    }
  }
  // La fiche d'une médaille : un billet épinglé à côté du tableau (et un fil jusqu'à elle)
  ficheSucces(id, ou = null) {
    const G = this.G, c = this.vueFicheSucces, fx = 40, fy = 328, fl = 400, fh = 176;
    c.removeAll(true);
    const f = this.add.graphics();
    f.fillStyle(0x1a0e06, 0.5).fillRect(fx + 5, fy + 6, fl, fh).fillStyle(0xead9b0).fillRect(fx, fy, fl, fh).lineStyle(3, 0x8a6a3a).strokeRect(fx, fy, fl, fh);
    f.fillStyle(0x8a2a1a).fillCircle(fx + fl / 2, fy + 6, 5).fillStyle(0xd85a3a).fillCircle(fx + fl / 2 - 1.5, fy + 4.5, 2);
    c.add(f);
    if (!id) { c.add(this.add.text(fx + fl / 2, fy + fh / 2, 'Un clic sur une médaille :\ncomment tu l’as gagnée, ou ce qu’il reste à faire.', style(13, '#6b4a2a', { fontStyle: 'italic', align: 'center' })).setOrigin(0.5)); return; }
    const S = SUCCES[id], ok = aLeSucces(G, id), cache = S.cache && !ok, etat = ok ? 'OBTENU' : cache ? 'SECRET' : 'À GAGNER';
    if (ou) { const fil = this.add.graphics().lineStyle(2, 0xffd870, 0.9); for (let k = 0; k < 14; k++) { const u0 = k / 14, u1 = (k + 0.5) / 14, X = a => fx + fl - 20 + (ou.x - (fx + fl - 20)) * a, Y = a => fy + 20 + (ou.y + 24 - (fy + 20)) * a; fil.lineBetween(X(u0), Y(u0), X(u1), Y(u1)); } c.add(fil); }
    if (ok) c.add(this.add.image(fx + 62, fy + 84, 'halo').setScale(0.9).setTint(0xfff0a0).setAlpha(0.5));
    for (const o of poserMedaille(this, fx + 62, fy + 78, S.palier, S.icone, 2.2, !ok)) c.add(o);
    c.add(this.add.text(fx + 128, fy + 18, etat, style(11, ok ? '#2f6a2a' : cache ? '#6a3a9a' : '#8a6a4a', { fontStyle: 'bold' })));
    const nom = this.add.text(fx + 128, fy + 36, cache ? '???' : S.nom, style(17, '#3b2410', { fontStyle: 'bold', wordWrap: { width: 260 } }));
    c.add(nom);
    const y2 = fy + 40 + nom.height;
    const texte = this.add.text(fx + 128, y2, cache ? `Un secret : il se découvre en jouant. Indice : ${S.indice || '...'}` : S.texte, style(12, '#4a2a10', { wordWrap: { width: 260 } }));
    c.add(texte);
    const y3 = y2 + texte.height + 6;
    c.add(this.add.text(fx + 128, y3, `${TIERS_SUCCES[S.palier][1]} · ${CATEGORIES_SUCCES[S.cat]}`, style(11, '#6b4a2a', { fontStyle: 'italic' })));
    let sous = cache ? 'Personne ne te le dira.' : '';
    if (ok) sous = `Obtenu le jour ${G.hautsFaits[id]}${G.lieuxSucces && G.lieuxSucces[id] ? `, ${G.lieuxSucces[id]}` : ''}`;
    else if (!cache && S.progres) { let pr = null; try { pr = S.progres(G); } catch (e) {} if (pr) { const [a, b] = pr; sous = `Tu en es à ${Math.min(a, b)} / ${b}`;
      c.add(this.add.rectangle(fx + 128, fy + fh - 18, 200, 10, 0x6b4a2a).setOrigin(0, 0.5)); c.add(this.add.rectangle(fx + 130, fy + fh - 18, Math.max(1, 196 * Math.min(1, a / b)), 6, 0xe8b830).setOrigin(0, 0.5)); } }
    const ts = this.add.text(fx + 128, Math.min(y3 + 22, fy + fh - 44), sous, style(12, ok ? '#2f6a2a' : '#8a6a4a', { fontStyle: 'bold', wordWrap: { width: 260 } }));
    c.add(ts);
  }

  // --- 5. La feuille du jour, en grand : qui passe d'abord ---

  // (v0.93, planche 19) On range tout d'un coup (un rangement gardé pour les jours suivants) ou chacun avec ses flèches.
  // Les retours et les visites restent à leur place ; la Faucheuse n'y figure pas (elle reste une surprise).
  ouvrirFeuille(page = 0) {
    const G = this.G;
    if (this.feuille) this.feuille.destroy();
    const c = this.feuille = this.add.container(0, 0).setDepth(60);
    c.add(this.add.rectangle(480, 270, 960, 540, 0x0a0604, 0.6).setInteractive());
    c.add(this.add.image(480, 270, panneauHD(this, 900, 510)).setScale(2));
    c.add(this.add.text(480, 44, `La feuille du jour ${G.jour}`, style(22, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
    c.add(this.add.text(480, 68, "Qui passe d'abord ? Range tout d'un coup, ou déplace chacun avec ses flèches", style(12, '#6a4a2a', { fontStyle: 'italic' })).setOrigin(0.5));
    const changer = () => { if (this.comptoir && this.comptoir.reconstruireFile) this.comptoir.reconstruireFile(); Son.jouer('plume'); };
    const mode = G.ordreFile || 'arrivee';
    ORDRES_FILE.forEach(([cle, nom], i) => {
      const x = 480 + (i - (ORDRES_FILE.length - 1) / 2) * 164, choisi = cle === mode;
      const fond = this.add.rectangle(x, 100, 154, 30, choisi ? 0x6b4a22 : 0xe8d4a8).setStrokeStyle(2, choisi ? 0xffe066 : 0x8a6a3a).setInteractive({ useHandCursor: true });
      fond.on('pointerdown', () => { G.ordreFile = cle; rangerFile(G, cle); changer(); this.ouvrirFeuille(page); });
      c.add([fond, this.add.text(x, 100, nom, style(12, choisi ? '#fff4dc' : '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5)]);
    });
    const NOTES = { retour: 'Retour de mission', famille: 'Une famille en deuil', garde: 'La garde', gardeRecherche: 'La garde', garrick: 'Garrick', collecteur: 'Le collecteur', serpent: 'Le Serpent à deux têtes',
      colporteur: 'Le colporteur', notable: 'Un visiteur de marque', aine: 'Un aîné des Bannis', carnet: 'Un carnet rapporté', heraut: 'Le messager du Conseil', rival: 'Le voisin', crieur: 'Le crieur', detresse: 'Un pigeon : appel à l\'aide', collectionneur: 'Le collectionneur' };
    const lignes = G.file.filter(e => e.type !== 'faucheuse');
    const PAR = 8, pages = Math.max(1, Math.ceil(lignes.length / PAR));
    page = Math.min(page, pages - 1);
    const COULEURS = [0x7a9a5a, 0x4a7aa0, 0x8a5aa0, 0xc89a30, 0xc04a30];
    lignes.slice(page * PAR, page * PAR + PAR).forEach((e, k) => {
      const i = page * PAR + k, y = 140 + k * 38, client = e.type === 'client';
      c.add(this.add.rectangle(480, y, 820, 34, !client ? 0xd8c8a0 : (i % 2 ? 0xe8d4a8 : 0xf0e0b8)).setStrokeStyle(1, 0xc9a870));
      c.add(this.add.text(86, y, `${i + 1}.`, style(13, '#6a4a2a', { fontStyle: 'bold' })).setOrigin(0.5));
      const p = client ? e.voyageur : e.parti ? e.parti.voyageur : e.type === 'famille' ? e.visite.parent : CounterScene.prototype.personneDe.call({ G }, e);
      if (p) { try { c.add(this.add.image(118, y + 16, textureBusteHD(this, p)).setOrigin(0.5, 1).setScale(0.27)); } catch (err) { /* (pas de buste pour ce visiteur) */ } }
      const v = client ? e.voyageur : null;
      c.add(this.add.text(150, y - 8, (p && p.nom) || NOTES[e.type] || 'Un visiteur', style(13, '#3b2410', { fontStyle: 'bold' })).setOrigin(0, 0.5));
      const note = client ? (e.reporte ? "Revient d'hier, comme convenu" : v.prestige ? 'Client prestigieux' : v.prevu ? `Commande prévue · ${v.quete}` : 'De passage') : (NOTES[e.type] || 'Une visite') + ' · reste à sa place';
      c.add(this.add.text(150, y + 8, raccourcir(note, 60), style(10, '#6a4a2a', { fontStyle: 'italic' })).setOrigin(0, 0.5));
      if (v) {
        const r = Math.max(0, ORDRE_NIVEAUX.indexOf(v.niveau));
        c.add(this.add.rectangle(600, y, 110, 22, COULEURS[r]).setStrokeStyle(1, 0x2a1a08));
        c.add(this.add.text(600, y, nomRang(v.niveau, true), style(11, '#fff4dc', { fontStyle: 'bold' })).setOrigin(0.5));
        for (const [x, sens, t] of [[790, -1, '▲'], [840, 1, '▼']]) {
          const f = this.add.text(x, y, t, style(15, '#3b2410', { fontStyle: 'bold', backgroundColor: '#e0c890', padding: { x: 7, y: 1 } })).setOrigin(0.5).setInteractive({ useHandCursor: true });
          f.on('pointerdown', () => { if (deplacerDansFile(G, e, sens)) { G.ordreFile = 'arrivee'; changer(); } this.ouvrirFeuille(page); });
          c.add(f);
        }
      } else c.add(this.add.text(815, y, 'fixe', style(12, '#6a4a2a', { fontStyle: 'italic' })).setOrigin(0.5));
    });
    if (pages > 1) {
      for (const [x, t, sens] of [[380, '◀', -1], [580, '▶', 1]]) {
        const f = this.add.text(x, 450, t, style(16, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5).setInteractive({ useHandCursor: true });
        f.on('pointerdown', () => this.ouvrirFeuille((page + sens + pages) % pages));
        c.add(f);
      }
      c.add(this.add.text(480, 450, `page ${page + 1} / ${pages}`, style(12, '#6a4a2a')).setOrigin(0.5));
    }
    c.add(this.add.text(480, 474, 'Le rangement choisi est gardé pour les jours suivants. Déplacer quelqu\'un à la main le remet sur « Comme ils viennent ».', style(11, '#6a4a2a', { fontStyle: 'italic' })).setOrigin(0.5));
    const fermer = creerBouton(this, 480, 506, 180, 'Fermer', () => { c.destroy(); this.feuille = null; if (this.vueRegistre) { this.afficherListe(); this.dessinerFeuilleDuJour(); } });
    c.add([fermer.fond, fermer.label]);
  }

  // --- 9. L'enseigne : son nom, l'une des cinq écritures, la couleur de son fond ---

  // (v0.93) avec l'enseigne telle qu'elle pend devant ta maison (elle s'embellit quand la maison grandit)
  ouvrirEnseigne() {
    const G = this.G;
    if (this.pageEnseigne) this.pageEnseigne.destroy();
    const c = this.pageEnseigne = this.add.container(0, 0).setDepth(60);
    c.add(this.add.rectangle(480, 270, 960, 540, 0x0a0604, 0.6).setInteractive());
    c.add(this.add.image(480, 272, panneauHD(this, 760, 470)).setScale(2));
    c.add(this.add.text(480, 66, 'Ton enseigne', style(24, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
    const n = niveauFacade(G), NIVEAUX = ['la planche brute de la chaumière', 'le panneau encadré de la maison', 'le panneau peint de la belle maison', "l'enseigne de maître de la demeure"];
    c.add(this.add.text(480, 92, `Aujourd'hui : ${NIVEAUX[n]}` + (n < 3 ? ' · elle s\'embellit quand ta maison grandit (améliore le comptoir)' : ''),
      style(12, '#6a4a2a', { fontStyle: 'italic', align: 'center', wordWrap: { width: 680 } })).setOrigin(0.5, 0));
    const r = reglagesEnseigne(G);
    c.add(this.add.rectangle(480, 190, 420, 130, 0x6a5040).setStrokeStyle(2, 0x3b2410));
    const apercu = poserEnseigne(this, 480, 128, n, G.nomShop).setScale(1.25);
    c.add(apercu);
    this.tweens.add({ targets: apercu, angle: { from: -2, to: 2 }, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    c.add(this.add.text(120, 272, "L'écriture", style(15, '#3b2410', { fontStyle: 'bold' })).setOrigin(0, 0.5));
    ENSEIGNE.polices.forEach(([famille, graisse, nom], i) => {
      const x = 254 + i * 130, choisi = i === r.police;
      const fond = this.add.rectangle(x, 272, 122, 40, choisi ? 0x6b4a22 : 0xe8d4a8).setStrokeStyle(2, choisi ? 0xffe066 : 0x8a6a3a).setInteractive({ useHandCursor: true });
      const t = this.add.text(x, 272, nom, { fontFamily: `"${famille}", Georgia, serif`, fontSize: '16px', fontStyle: graisse, color: choisi ? '#fff4dc' : '#3b2410', resolution: 3 }).setOrigin(0.5);
      if (t.width > 112) t.setScale(112 / t.width);
      if (document.fonts) document.fonts.load(`16px "${famille}"`).then(() => { if (t.active) { t.updateText(); t.setScale(1); if (t.width > 112) t.setScale(112 / t.width); } }).catch(() => {});
      fond.on('pointerdown', () => { G.enseigne = { ...reglagesEnseigne(G), police: i }; Son.jouer('plume'); this.ouvrirEnseigne(); this.poserEnseigneSalle(); });
      c.add([fond, t]);
    });
    c.add(this.add.text(120, 336, 'Le fond', style(15, '#3b2410', { fontStyle: 'bold' })).setOrigin(0, 0.5));
    ENSEIGNE.couleurs.forEach((coul, i) => {
      const x = 240 + i * 94, choisi = coul.cle === r.couleur;
      const teinte = coul.c ? coul.c[1] : null;
      const pastille = teinte != null ? this.add.rectangle(x, 330, 56, 30, teinte) : this.add.image(x, 330, texEnseigne(this, n, 'naturel')).setDisplaySize(56, 30);
      const cadre = this.add.rectangle(x, 330, 60, 34).setStrokeStyle(choisi ? 4 : 2, choisi ? 0xffe066 : 0x3b2410).setInteractive({ useHandCursor: true });
      cadre.on('pointerdown', () => { G.enseigne = { ...reglagesEnseigne(G), couleur: coul.cle }; Son.jouer('plume'); this.ouvrirEnseigne(); this.poserEnseigneSalle(); });
      c.add([pastille, cadre, this.add.text(x, 352, coul.nom, style(11, choisi ? '#3b2410' : '#6a4a2a', { fontStyle: choisi ? 'bold' : '' })).setOrigin(0.5, 0)]);
    });
    const renommer = creerBouton(this, 360, 430, 230, '✎ Changer le nom', () => demanderTexte('Le nom de ton comptoir', G.nomShop, NOM_SHOP_MAX, nom => {
      if (!nom) return;
      G.nomShop = nom;
      this.poserEnseigneSalle();
      this.ouvrirEnseigne();
    }));
    const fermer = creerBouton(this, 620, 430, 180, 'Fermer', () => { c.destroy(); this.pageEnseigne = null; });
    c.add([renommer.fond, renommer.label, fermer.fond, fermer.label]);
  }

  fermer() {
    if (this.minuteurEcrit) { this.minuteurEcrit.remove(); this.minuteurEcrit = null; }
    const retour = this.retour, avant = this.scene.get(retour);
    this.scene.stop();
    this.scene.resume(retour);
    // (on ressort par la porte : dans l'arrière-boutique ou la promenade, on le voit sortir du bureau)
    if (avant && typeof avant.revenirDuBureau === 'function') avant.revenirDuBureau();
  }
}
