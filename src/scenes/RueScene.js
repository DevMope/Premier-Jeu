// (v0.65, étape 10c) La rue, le jour : au sortir du shop, on la traverse à pied jusqu'à l'arche du
// Marché des Mastres (ou l'inverse en rentrant). La forge est ouverte, des passants vont et viennent ;
// on peut entrer à la banque. « Au marché » et « Chez toi » restent des raccourcis.
class RueScene extends Phaser.Scene {
  constructor() { super('Rue'); }

  init(data) { this.depuis = (data && data.depuis) || 'shop'; }

  create() {
    const G = this.G = window.GAME;
    this.fini = false; this.transition = false;
    this.cameras.main.fadeIn(400);
    const sol = 470;
    this.portes = [];
    const ici = {
      regarder: (x, y, l, h, texte) => {
        const z = this.add.rectangle(x + l / 2, y + h / 2, l, h, 0xffffff, 0).setDepth(8.4).setInteractive({ useHandCursor: true });
        z.on('pointerdown', () => { this.allerVers(x + l / 2); this.dire(texte); });
      },
      porte: (x, s, etiquette, page, { large = 80, haut = 110 } = {}) => {
        const z = this.add.rectangle(x, s - haut / 2 - 5, large, haut, 0xffffff, 0).setDepth(8.65).setInteractive({ useHandCursor: true });
        this.add.text(x, s - 140, etiquette, style(12, '#fff4dc', { fontStyle: 'bold italic', stroke: '#1a0e06', strokeThickness: 4 })).setOrigin(0.5).setDepth(8.6);
        z.on('pointerdown', () => this.passerPar(page, x));
      },
    };
    // (v1.57) à Pont-Royal : la rue sur le pont
    this.pont = typeof aPontRoyal === 'function' && aPontRoyal(G);
    this.largeur = this.pont ? 960 : LARGEUR_RUE;
    if (this.pont) return this.creerRuePont(ici, sol);
    const r = construireRue(this, 0, { jour: true, ici });
    if (typeof rueDuMecenat === 'function') rueDuMecenat(this, 0, sol, G);   // (v1.32, planche 58) ce que le monde montre de tes dons
    const toits = this.children.list.filter(o => o.type === 'Image' && o.texture && /^(rueMaisonHD|rueForgeHD|rueImpasseHD|facadeHD)/.test(o.texture.key)).map(o => [o, o.texture.key === 'facadeHD_4' ? 0.26 : /^facadeHD/.test(o.texture.key) ? 0.34 : 0.12]);   // (v1.31 : avec l'étage, le toit ne fait plus qu'un quart de l'image)
    decorSaison(this, { sol: sol, largeur: LARGEUR_RUE, prof: 8.3, meules: [[LOT_CONFRERIE + (LARGEUR_RUE - LOT_CONFRERIE) * 0.42, 22]], bonhomme: LOT_CONFRERIE + (LARGEUR_RUE - LOT_CONFRERIE) * 0.62, toits });   // (v0.99 : la saison)
    // (v0.99) les bruits de la saison, doucement, sous la musique : oiseaux, cigales, vent
    if (typeof saisonDe === 'function') { Son.nature(true, { saison: saisonDe(G), volume: 0.7, meteo: typeof meteoDu === 'function' ? meteoDu(G) : null }); this.events.once('shutdown', () => Son.nature(false)); this.events.once('sleep', () => Son.nature(false)); }
    this.porteShop = r.porteShop;
    // la porte du shop : on rentre chez soi
    const zp = this.add.rectangle(this.porteShop.x, sol - 60, 70, 120, 0xffffff, 0).setDepth(8.65).setInteractive({ useHandCursor: true });
    this.add.text(this.porteShop.x, sol - 150, 'Rentrer', style(12, '#fff4dc', { fontStyle: 'bold italic', stroke: '#1a0e06', strokeThickness: 4 })).setOrigin(0.5).setDepth(8.6);
    zp.on('pointerdown', () => this.passerPar('Maison', this.porteShop.x));

    textureJoueur(this, G);
    const x0 = this.depuis === 'marche' ? PLACES_RUE.arche - 60 : this.depuis === 'mages' ? PLACES_RUE.mages - 40 : this.depuis === 'essai' ? this.porteShop.x + 260 : this.porteShop.x + 40;   // (v1.56 : en sortant des Mages, ou après la marche d'essai)
    this.heros = this.add.image(x0, SOL_PROMENADE, textureJoueur(this, G)).setOrigin(0.5, 1).setScale(echelleJoueur(7.5)).setDepth(8.5).setFlipX(this.depuis === 'marche');
    this.cible = null; this.pas = 0;
    // (v1.40) le matin du jour 1, avec le didacticiel : Garrick t'accompagne jusqu'au marché
    this.garrick = null;
    if (typeof didacticiel === 'function' && didacticiel(G) && G.tuto && G.jour === 1 && this.depuis !== 'marche') {
      this.garrick = imageCorps(this, x0 - 80, SOL_PROMENADE, 'mentor', 7.5).setOrigin(0.5, 1).setDepth(8.49);
      this.time.delayedCall(700, () => this.garrickDit("« Allez, en route ! Le marché, c'est au bout de la rue, sous l'arche. Suis-moi, je te présente les marchands. »"));
    }
    this.cameras.main.scrollX = Phaser.Math.Clamp(x0 - 480, 0, LARGEUR_RUE - 960);
    // (v1.48) le jour où il ouvre (et tant qu'on n'est pas entré), Orvin attend sur le pas de sa porte
    this.orvin = null;
    if (typeof barbierOuvert === 'function' && barbierOuvert(G) && !etatBarbier(G).vu) {
      this.orvin = imageCorps(this, PLACES_RUE.barbier + 150, SOL_PROMENADE, FIGURANT_BARBIER, 6.2, 'accueil').setFlipX(true).setDepth(8.45).setInteractive({ useHandCursor: true });
      this.orvin.on('pointerdown', () => this.passerPar('Barbier', PLACES_RUE.barbier + 52));
      this.orvinSalue = false;
    }

    // l'interface, fixe à l'écran
    const fixe = o => o.setScrollFactor(0).setDepth(30);
    fixe(this.add.text(480, 22, `La rue du marché · jour ${G.jour}`, style(22, '#fff4dc', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 5 })).setOrigin(0.5));
    fixe(this.add.text(480, 48, '◀ ▶ ou clique au sol pour marcher · clique sur les maisons pour les regarder · l\'arche mène au marché', style(12, '#fff4dc', { fontStyle: 'italic', stroke: '#1a0e06', strokeThickness: 3 })).setOrigin(0.5));
    this.bulle = fixe(this.add.text(480, 78, '', style(14, '#3b2410', { fontStyle: 'italic', backgroundColor: '#ead9b0', padding: { x: 10, y: 6 }, wordWrap: { width: 640 }, align: 'center' })).setOrigin(0.5, 0).setVisible(false));
    for (const [x, l, texte, page] of [[110, 190, '◀ Chez toi', 'Maison'], [850, 200, 'Au marché ▶▶', 'Marche']]) { const b = creerBouton(this, x, 505, l, texte, () => this.passerPar(page)); fixe(b.fond); fixe(b.label); }

    this.input.on('pointerdown', (pointeur, sous) => { if (!sous.length) this.allerVers(pointeur.worldX); });
    this.touches = this.input.keyboard ? this.input.keyboard.createCursorKeys() : null;
    // des passants qui vont et viennent
    this.time.addEvent({ delay: 4500, startAt: 3500, loop: true, callback: () => this.passant() });
    this.passant();
    // (v0.68) quelqu'un se repose sur le banc, de temps en temps
    // (v1.53, planche 62 v2) le temps qu'il fait : l'ardoise d'Ysmée entre sa tente et les Brindeloup, la pluie, les flaques...
    if (typeof ambianceMeteo === 'function') {
      if (typeof ysmeeArrivee === 'function' && ysmeeArrivee(G)) ardoiseMeteo(this, PLACES_RUE.ardoise, 478, G);
      const P = PLACES_RUE;
      ambianceMeteo(this, { sol, flaques: [[P.hospice + 160, 500, 120, 14], [P.impasse + 60, 512, 150, 16], [P.shop - 230, 498, 130, 14], [P.ardoise - 30, 515, 140, 16], [P.maison1 + 200, 502, 120, 13], [P.banque - 160, 508, 150, 16], [P.arche - 240, 500, 110, 13]] });
    }
    this.banc = r.banc; this.surLeBanc = null;
    this.time.addEvent({ delay: 9000, startAt: 8000, loop: true, callback: () => this.reposBanc() });
    if (Math.random() < 0.6) this.reposBanc();
  }

  // (v1.57, planche 75 v2) La rue sur le pont de Pont-Royal : à gauche le tonnelier, ta maison sur son lot, la maison rose
  // et la Halle des Bateliers ; derrière le parapet, le fleuve, l'autre rive et la citadelle sur son rocher.
  creerRuePont(ici, sol) {
    const G = this.G;
    dessinerComte(this.add.graphics(), 0, 0, 960, sol, 0);
    this.add.image(0, 0, rueDuPontHD(this)).setOrigin(0).setScale(2);
    this.add.image(0, sol, pavesHD(this, 960, 70)).setOrigin(0).setScale(2);
    const facade = dessinerFacade(this, 398, sol, G.nomShop);
    for (const o of [facade.image, facade.tonneaux, facade.enseigne]) if (o) o.setDepth(4);
    this.porteShop = { x: facade.porteX };
    const zp = this.add.rectangle(this.porteShop.x, sol - 60, 70, 120, 0xffffff, 0).setDepth(8.65).setInteractive({ useHandCursor: true });
    this.add.text(this.porteShop.x, sol - 150, 'Rentrer', style(12, '#fff4dc', { fontStyle: 'bold italic', stroke: '#1a0e06', strokeThickness: 4 })).setOrigin(0.5).setDepth(8.6);
    zp.on('pointerdown', () => this.passerPar('Maison', this.porteShop.x));
    ici.porte(846, sol, 'La Halle des Bateliers', 'Halle', { large: 160, haut: 150 });
    ici.regarder(0, 250, 160, 220, "La tonnelière cercle un tonneau à grands coups de maillet. « Bienvenue sur le pont, voisin ! Ici, tout arrive par le fleuve... et tout repart en tonneau. »");
    ici.regarder(612, 200, 98, 270, 'Une maison rose, haute et étroite. À la fenêtre du deuxième, une vieille dame arrose ses géraniums... et la rue en dessous.');
    ici.regarder(160, 300, 80, 90, 'Derrière le parapet, le grand fleuve. Les barges descendent vers la Halle, chargées de caisses et de tonneaux venus d\'autres royaumes.');
    // le panneau de la ville basse : le marché, la banque, l'architecte
    const pan = ecriteauRue(this, 196, 452, '◀ La ville basse', { taille: 13, profondeur: 8.62 }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    pan.on('pointerdown', () => this.passerPar('VilleBasse', 250));
    textureJoueur(this, G);
    const x0 = this.depuis === 'marche' ? 120 : this.porteShop.x + 40;
    this.heros = this.add.image(x0, SOL_PROMENADE, textureJoueur(this, G)).setOrigin(0.5, 1).setScale(echelleJoueur(7.5)).setDepth(8.5);
    this.cible = null; this.pas = 0; this.garrick = null; this.orvin = null;
    const fixe = o => o.setScrollFactor(0).setDepth(30);
    fixe(this.add.text(480, 22, `Le pont de Pont-Royal · jour ${G.jour}`, style(22, '#fff4dc', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 5 })).setOrigin(0.5));
    fixe(this.add.text(480, 48, '◀ ▶ ou clique au sol pour marcher · clique sur les maisons pour les regarder · le panneau mène à la ville basse', style(12, '#fff4dc', { fontStyle: 'italic', stroke: '#1a0e06', strokeThickness: 3 })).setOrigin(0.5));
    this.bulle = fixe(this.add.text(480, 78, '', style(14, '#3b2410', { fontStyle: 'italic', backgroundColor: '#ead9b0', padding: { x: 10, y: 6 }, wordWrap: { width: 640 }, align: 'center' })).setOrigin(0.5, 0).setVisible(false));
    for (const [x, l, texte, page] of [[110, 190, '◀ Chez toi', 'Maison'], [850, 200, 'Au marché ▶▶', 'Marche']]) { const b = creerBouton(this, x, 505, l, texte, () => this.passerPar(page)); fixe(b.fond); fixe(b.label); }
    this.input.on('pointerdown', (pointeur, sous) => { if (!sous.length) this.allerVers(pointeur.worldX); });
    this.touches = this.input.keyboard ? this.input.keyboard.createCursorKeys() : null;
    this.time.addEvent({ delay: 4500, startAt: 3500, loop: true, callback: () => this.passant() });
    this.passant();
    if (typeof ambianceMeteo === 'function') ambianceMeteo(this, { sol, flaques: [[250, 500, 120, 14], [640, 508, 150, 15]] });
    if (typeof saisonDe === 'function') { Son.nature(true, { saison: saisonDe(G), volume: 0.7, meteo: typeof meteoDu === 'function' ? meteoDu(G) : null }); this.events.once('shutdown', () => Son.nature(false)); }
    // (la première fois) le batelier salue le nouveau voisin
    const P = etatPontRoyal(G);
    if (!P.salueBatelier) { P.salueBatelier = true; this.time.delayedCall(900, () => this.dire('Le batelier, de la porte de la Halle : « Bienvenue sur le pont ! Ici, tout arrive par le fleuve. Passe voir la barge de la semaine. »')); }
  }

  reposBanc() {
    if (this.surLeBanc && this.surLeBanc.active) {
      // (v1.61) il ne s'efface plus sur place : il se lève et repart à pied, jusqu'au bout de la rue
      if (!this.surLeBanc.enRoute && Math.random() < 0.4) { const p = this.surLeBanc; this.surLeBanc = null; this.marcherHorsDeVue(p.quoi, p.x, p.flipX ? -1 : 1); p.destroy(); }
      return;
    }
    if (Math.random() < 0.5) return;
    const race = auHasard(['humain', 'humain', 'hobbit', 'nain', 'elfe', 'magicienne']);
    const quoi = { nom: auHasard(NOMS_PASSANTS_RUE) + ' ' + Math.floor(Math.random() * 99), race, niveau: auHasard(['novice', 'aguerri']), feminin: Math.random() < 0.5 };
    // (v1.61) il arrive à pied par un bord de l'écran, puis s'assoit (il n'apparaît plus d'un coup sur le banc)
    const xb = this.banc.x + (Math.random() < 0.5 ? -22 : 22), cam = this.cameras.main.scrollX, deGauche = Math.random() < 0.5;
    const x0 = deGauche ? cam - 60 : cam + 1020, duree = Math.abs(xb - x0) * 11;
    const venu = imageCorps(this, x0, SOL_PROMENADE + 6, quoi, 7.2).setFlipX(!deGauche).setDepth(8.45);
    this.surLeBanc = venu; venu.enRoute = true; venu.quoi = quoi;   // (la place est prise dès qu'il est en route)
    pasDeMarche(this, venu, duree, { poussiere: false });
    this.tweens.add({ targets: venu, x: xb, duration: duree, onComplete: () => { if (!venu.active) return; venu.destroy(); this.asseoirSurLeBanc(quoi, xb, deGauche); } });
  }
  asseoirSurLeBanc(quoi, xb, deGauche) {
    const p = this.surLeBanc = imageCorps(this, xb, this.banc.sol - 6, quoi, 7.2, 'assis').setDepth(8.44).setFlipX(!deGauche).setInteractive({ useHandCursor: true });
    p.quoi = quoi;
    p.on('pointerdown', () => { this.allerVers(p.x + 70); this.dire(`« ${auHasard(['Belle journée, hein ? Je me pose deux minutes, mes pieds n\'en peuvent plus.', 'Je regarde passer les aventuriers. Il en part tous les jours, de chez toi !', 'Chut... j\'écoute les potins du marché.', 'Ce banc est le meilleur du village. Ne le dis à personne.'])} »`); });
  }

  // (v1.61) Quelqu'un qui s'en va à pied jusqu'au bout de la rue (hors de toute vue), puis seulement disparaît
  marcherHorsDeVue(quoi, x, sens) {
    const fin = sens > 0 ? (this.largeur || LARGEUR_RUE) + 140 : -140, duree = Math.abs(fin - x) * 11;
    const p = imageCorps(this, x, SOL_PROMENADE + 6, quoi, 7.2).setFlipX(sens < 0).setDepth(8.45);
    pasDeMarche(this, p, duree, { poussiere: false });
    this.tweens.add({ targets: p, x: fin, duration: duree, onComplete: () => p.destroy() });
    return p;
  }

  passant() {
    const race = auHasard(this.pont ? ['humain', 'humain', 'humain', 'humain', 'nain', 'elfe', 'hobbit'] : ['humain', 'humain', 'hobbit', 'nain', 'elfe', 'magicienne']);
    // (v1.57) sur le pont, la garde fait sa ronde de temps en temps
    const quoi = this.pont && Math.random() < 0.22 ? { race: 'humain', nom: 'Garde du pont ' + Math.floor(Math.random() * 99), costume: 'gardeRoyal', habit: 0x1c1c24, cheveux: 0x1a1612, coiffure: 'long', niveau: 'aguerri', armeEmportee: 'lance', serieux: true }
      : { nom: auHasard(NOMS_PASSANTS_RUE) + ' ' + Math.floor(Math.random() * 99), race, niveau: auHasard(['novice', 'aguerri']) };
    const sens = Math.random() < 0.5 ? 1 : -1, cam = this.cameras.main.scrollX;
    const x0 = sens > 0 ? cam - 60 : cam + 1020, x1 = sens > 0 ? (this.largeur || LARGEUR_RUE) + 140 : -140;   // (v1.61 : jusqu'au bout de la rue, jamais sous les yeux du joueur)
    const p = imageCorps(this, x0, SOL_PROMENADE + 4 + Math.random() * 8, quoi, 7.2).setFlipX(sens < 0).setDepth(8.45);
    // (v1.32) le neutre qui paie les deux camps : parfois, un garde et un Banni font la ronde ensemble
    if (typeof patrouilleMelee === 'function' && patrouilleMelee(this.G)) {
      p.setTexture(corpsHD(this, GARDE.capitaine)).setScale(7.2 * echelleCorps(p.texture.key));
      const b = imageCorps(this, x0 - sens * 46, SOL_PROMENADE + 6, PERCEPTEUR_BANNI, 7.2).setFlipX(sens < 0).setDepth(8.45);
      pasDeMarche(this, b, Math.abs(x1 - x0) * 11, { poussiere: false });
      this.tweens.add({ targets: b, x: x1 - sens * 46, duration: Math.abs(x1 - x0) * 11, onComplete: () => b.destroy() });
    }
    const duree = Math.abs(x1 - x0) * 11;
    pasDeMarche(this, p, duree, { poussiere: false });
    this.tweens.add({ targets: p, x: x1, duration: duree, onComplete: () => { if (p.bulle) p.bulle.destroy(); p.destroy(); } });
    // (v0.84) un clic sur un passant : il s'arrête un instant et dit une phrase (une nouvelle du jeu,
    // ou pour rire), comme au marché
    p.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.passantParle(p));
  }

  passantParle(p) {
    if (!p.active || (p.bulle && p.bulle.active)) return;
    const cam = this.cameras.main;
    if (p.x < cam.scrollX + 40 || p.x > cam.scrollX + 920) return;   // (hors de l'écran : il se tait)
    const texte = phrasePassant(this.G);
    // il s'arrête pour parler, puis reprend sa route
    const tw = this.tweens.getTweensOf(p); tw.forEach(t => t.pause());
    if (p.marche) p.marche.paused = true;
    Son.jouer('voix', { personne: { nom: p.texture.key, race: 'humain' }, ton: Phaser.Utils.Array.GetRandom(['content', 'rire', 'etonne', 'neutre']) });
    const bulle = p.bulle = this.add.text(p.x, p.y - p.displayHeight - 8, texte, style(12, '#3b2410', { fontStyle: 'italic', backgroundColor: '#f3e6c8', padding: { x: 8, y: 5 }, wordWrap: { width: 230 }, align: 'center' })).setOrigin(0.5, 1).setDepth(9).setScale(0);
    this.tweens.add({ targets: bulle, scale: 1, duration: 180, ease: 'Back.easeOut' });
    const suivre = () => { if (bulle.active && p.active) bulle.setX(p.x); };
    this.events.on('update', suivre);
    this.events.once('shutdown', () => this.events.off('update', suivre));   // (v0.97) sinon il survivait à la scène
    this.time.delayedCall(Math.max(3000, texte.length * 60), () => {
      this.events.off('update', suivre);
      if (bulle.active) this.tweens.add({ targets: bulle, alpha: 0, duration: 300, onComplete: () => bulle.destroy() });
      if (p.active) { tw.forEach(t => t.resume()); if (p.marche) p.marche.paused = false; }
    });
  }

  // (v1.40) Garrick parle : une bulle au-dessus de lui, qui le suit
  garrickDit(texte) {
    const g = this.garrick;
    if (!g || !g.active) return;
    if (g.bulle) g.bulle.destroy();
    Son.jouer('voix', { personne: { nom: 'Garrick', race: 'humain' }, ton: 'content', duree: 1.4 });
    const b = g.bulle = this.add.text(g.x, g.y - g.displayHeight - 10, texte, style(13, '#2a1a0c', { backgroundColor: '#fff8e8', padding: { x: 9, y: 6 }, wordWrap: { width: 300 }, align: 'center' })).setOrigin(0.5, 1).setDepth(9).setScale(0);
    this.tweens.add({ targets: b, scale: 1, duration: 180, ease: 'Back.easeOut' });
    this.time.delayedCall(Math.max(3500, texte.length * 55), () => { if (b.active) this.tweens.add({ targets: b, alpha: 0, duration: 300, onComplete: () => b.destroy() }); });
  }

  dire(texte) {
    this.bulle.setText(texte).setVisible(true).setAlpha(1);
    this.tweens.killTweensOf(this.bulle);
    this.tweens.add({ targets: this.bulle, alpha: 0, delay: 4000, duration: 600 });
  }

  allerVers(x) { this.cible = Phaser.Math.Clamp(x, 40, (this.largeur || LARGEUR_RUE) - 40); }

  // Entrer quelque part : à pied jusqu'à la porte (si on la donne), puis on y va.
  passerPar(page, x = null) {
    if (this.transition || this.fini) return;
    if (page === 'Banque' && typeof lieuDebloque === 'function' && !lieuDebloque(window.GAME, 'banque')) return this.dire('La porte de la banque est close pour toi. Elle s\'ouvrira au jour 4.');   // (v1.40)
    this.transition = true;
    const aller = () => {
      Son.jouer('porte');
      if (page === 'Banque') { this.transition = false; this.scene.pause(); this.scene.launch('Banque', { retour: 'Rue' }); return; }
      if (page === 'Barbier') { this.transition = false; this.scene.pause(); this.scene.launch('Barbier', { retour: 'Rue' }); return; }   // (v1.48) chez Orvin
      if (page === 'Mages') { this.transition = false; this.scene.pause(); this.scene.launch('Mages', { retour: 'Rue' }); return; }   // (v1.56) chez les Mages-Charpentiers
      if (page === 'Halle') { this.transition = false; ouvrirHalle(this); return; }   // (v1.57) Pont-Royal
      if (page === 'VilleBasse') { this.transition = false; menuVilleBasse(this); return; }
      if (page === 'Diseuse') { this.transition = false; this.scene.pause(); this.scene.launch('Diseuse', { retour: 'Rue' }); return; }   // (v1.05) sous la tente de Madame Ysmée
      this.fini = true;
      Sauvegarde.maintenant(this.G, page === 'Maison' ? 'Maison' : 'Marche');
      this.cameras.main.fadeOut(300);
      this.cameras.main.once('camerafadeoutcomplete', () => (page === 'Maison' ? this.scene.start('Nuit', { matin: true }) : this.scene.start('Marche')));
    };
    if (x === null) return aller();
    this.allerVers(x);
    const attendre = () => (this.cible === null ? aller() : this.time.delayedCall(60, attendre));
    attendre();
  }

  update(temps, delta) {
    if (!this.heros) return;
    let dx = 0;
    if (this.touches && (this.touches.left.isDown || this.touches.right.isDown) && !this.transition) {
      this.cible = null;
      dx = (this.touches.right.isDown ? 1 : -1) * 0.32 * delta;
    } else if (this.cible !== null) {
      const reste = this.cible - this.heros.x;
      dx = Math.sign(reste) * Math.min(Math.abs(reste), 0.32 * delta);
      if (Math.abs(reste) < 1) this.cible = null;
    }
    if (dx) {
      this.heros.x = Phaser.Math.Clamp(this.heros.x + dx, 40, this.largeur - 40);
      this.heros.setFlipX(dx < 0);
      this.pas += delta;
      if (!this.heros.marche) pasDeMarche(this, this.heros, 260);
      this.heros.y = SOL_PROMENADE - Math.abs(Math.sin(this.pas / 120)) * 2;
    } else this.heros.y = SOL_PROMENADE;
    if (this.orvin && !this.orvinSalue && Math.abs(this.heros.x - this.orvin.x) < 420) { this.orvinSalue = true; this.dire(etatBarbier(this.G).anniversaire === false ? "Orvin : « Bienvenue au Fil d'Argent ! Je viens de m'installer : le premier rasage est pour moi. Entre, l'ami ! »" : "Orvin : « Dix-huit ans ! J'attendais ce jour pour ouvrir : le premier rasage est pour moi. Entre, l'ami ! »"); }
    // (v1.40) Garrick suit le joueur, un pas derrière lui
    const g = this.garrick;
    if (g && g.active) {
      const cible = this.heros.x + (this.heros.flipX ? 80 : -80), reste = cible - g.x;
      if (Math.abs(reste) > 6) {
        g.x += Math.sign(reste) * Math.min(Math.abs(reste), 0.3 * delta);
        g.setFlipX(reste < 0);
        if (!g.marche) pasDeMarche(this, g, 260);
      }
      if (g.bulle && g.bulle.active) g.bulle.setPosition(g.x, g.y - g.displayHeight - 10);
    }
    this.cameras.main.scrollX = Phaser.Math.Clamp(this.heros.x - 480, 0, this.largeur - 960);
  }
}

const NOMS_PASSANTS_RUE = ['Passant', 'Passante', 'Voyageur', 'Colporteur', 'Badaud'];
