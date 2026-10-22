// (v1.49, planche 73 v2 validée « parfait ») La grand-place du marché, où l'on se promène à pied, vue d'au-dessus.
// Le sol a du relief (herbe, terre battue, dalles au centre seulement), tout ce qui est debout a son ombre ; JeuneGoy,
// les marchands et les passants sont à la même échelle. On marche (clic au sol, flèches ou ZQSD), on s'approche d'un
// lieu (clic dessus, ou Espace devant lui) : les étals ouvrent la boutique en grand (un seul panier pour toute la
// place), les autres lieux le panneau du bas, comme avant. M : la carte de la place ; L : la liste de courses.

const PLACE_MARCHE = { L: 1800, H: 1040, zoom: 1.25, zoomPanneau: 0.95, vitesse: 0.3, course: 0.6, echelle: 4.5 };
// Où est chaque lieu (sa base, au sol), en pixels de la place
const LIEUX_PLACE = { forge: [330, 340], apothicaire: [560, 310], encheres: [900, 290], gedeon: [1240, 310], tailleuse: [1470, 340],
  bazar: [170, 610], brocante: [170, 870], garderobe: [1630, 610], peche: [1630, 880], crieur: [660, 560], tableau: [1140, 560], jeux: [560, 920], mendiant: [770, 1000],
  fontaine: [900, 660], carte: [1060, 1000], arche: [900, 1040], moulin: [1760, 760] };
// La hauteur de l'enseigne au-dessus de la base (les autres : 200)
const HAUTEUR_ENSEIGNE = { encheres: 150, crieur: 112, tableau: 110, jeux: 170, mendiant: 120, fontaine: 190, carte: 70, arche: 230, moulin: 30, peche: 200 };
const PETITS_LIEUX = ['crieur', 'tableau', 'mendiant'];

Object.assign(MarcheScene.prototype, {
  // Le nom et le métier de chaque lieu, sur son enseigne
  nomLieuPlace(cle) {
    const G = this.G;
    if (MARCHANDS[cle]) return [MARCHANDS[cle].nom, MARCHANDS[cle].metier];
    const autres = { fontaine: ['La fontaine', 'Un vœu : 1 p.'], carte: ['La carte du monde', ''], arche: ['Vers la rue', 'ta boutique, la banque'], moulin: ['Sentier du Moulin', 'l’étang de Barnabé'] };
    if (autres[cle]) return autres[cle];
    if (cle === 'jeux' && this.fete) return ["Le tir à l'arc", 'la Confrérie'];
    if (cle === 'jeux' && this.feteHiver) return ['La grande roue', 'du Père Givrin'];
    if (OUVERTURE_LIEUX[cle] && !lieuOuvert(G, cle)) return ['En travaux', `ouvre le jour ${OUVERTURE_LIEUX[cle]}`];
    return { mendiant: ['Le mendiant', 'et son chien'], bazar: ['Le Bazar de Rosalie', 'Cadeaux'], encheres: ['Les enchères', 'Trouvailles à vendre'], jeux: ['Le coin des jeux', 'Dés, bonneteau'],
      crieur: ['Le crieur', 'Nouvelles du jour'], tableau: ['Le tableau d’affichage', 'Commandes, primes'], brocante: ['La brocante de Firmin', 'Décorations'],
      garderobe: this.fete ? ["L'étal de l'Union", 'Atours de la fête'] : ['La garde-robe de Marcelline', 'Vêtements'], peche: ['La cabane de Barnabé', 'Pêche'] }[cle] || [cle, ''];
  },

  // Où se tenir pour parler à un lieu : devant lui, face à lui
  devantLieu(cle) {
    const [x, y] = LIEUX_PLACE[cle];
    if (cle === 'fontaine') return [x, y + 44];
    if (cle === 'arche') return [x, y - 250];   // (l'arche est haute : on s'arrête devant, côté place)
    if (cle === 'moulin') return [x - 40, y + 24];
    return [x, Math.min(PLACE_MARCHE.H - 8, y + 34)];
  },

  construirePlace() {
    const G = this.G, P = PLACE_MARCHE;
    // l'ancienne vue (la rue en demi-cercle) s'efface : tout se passe sur la place
    for (const o of [this.fondVue, this.fondVue && this.fondVue.paysage, this.solVue, this.monde, this.vue]) if (o && o.setVisible) o.setVisible(false);
    if (this.bulleCrieur) { this.bulleCrieur.destroy(); this.bulleCrieur = null; }
    this.etiquettesRue.forEach(t => t.setVisible(false));
    for (const c of [this.vue, this.monde]) if (c) c.list.forEach(o => { if (o.input && o.disableInteractive) o.disableInteractive(); });
    creerRueHD(this); creerDecorPlaceHD(this);
    const place = this.place = this.add.container(0, 0).setDepth(-1);
    const saison = typeof saisonDe === 'function' ? saisonDe(G) : 'semailles';
    const pal = this.palettePlace = paletteSaisonComte(saison);
    // le sol : terre battue sous les étals et sur les chemins d'usure, dalles au centre, herbe ailleurs
    const pads = Object.entries(LIEUX_PLACE).filter(([k]) => !['fontaine', 'arche', 'moulin', 'carte'].includes(k)).map(([k, [x, y]]) => PETITS_LIEUX.includes(k) ? [x / 2, y / 2 - 6, 44, 18] : [x / 2, y / 2 - 12, 104, 34]);
    pads.push([530, 500, 40, 20]);
    const chemins = [...pads.map(([x, y]) => [[450, 318], [x, y]]), [[450, 318], [450, 520], 12], [[450, 318], [900, 382], 8], [[0, 92], [900, 92], 11]];
    const plan = { centre: [450, 318], rTerre: 150, rDalles: 104, pads, chemins, largeur: 8, pas: [[450, 432], [452, 452], [448, 472], [451, 492]] };
    place.add(this.add.image(0, 0, solPlaceHD(this, 'solPlace_' + saison, pal, 900, 520, plan)).setOrigin(0).setScale(2));
    this.obstacles = [];
    const ombre = (x, y, l) => { const o = this.add.image(x + l * 0.06, y - 2, ombrePlaceHD(this)).setScale(l / 64, l / 64 * 0.9); o.yTri = y - 0.5; place.add(o); return o; };
    this.ombrePlace = ombre;
    // les maisons qui bordent la place, au nord
    [['rueForgeHD', 110], ['rueImpasseHD', 300], ['rueBanqueHD', 470], ['rueBanqueHD', 1330], ['rueImpasseHD', 1500], ['rueForgeHD', 1690]].forEach(([k, x]) => { const im = this.add.image(x, 160, k).setOrigin(0.5, 1).setScale(1.3); im.yTri = 0; place.add(im); });
    // les étals et les lieux : les groupes de la rue, posés à leur place
    const xs = { 84: 'mendiant', 70: 'mendiant', 1030: 'bazar', 1220: 'encheres', 1410: 'jeux', 1595: 'crieur', 1600: 'crieur', 1705: 'tableau', 1850: 'brocante', 2045: 'garderobe', 2240: 'peche' };
    Object.keys(MARCHANDS).forEach((k, i) => { xs[260 + i * 190] = k; });
    const cleDe = x => { let best = null, d = 1e9; for (const k of Object.keys(xs)) { const e = Math.abs(k - x); if (e < d) { d = e; best = xs[k]; } } return d < 40 ? best : null; };
    this.actionsLieux = {};
    const poses = new Set();
    for (const g of this.groupes) {
      const k = cleDe(g.x); if (!k || !LIEUX_PLACE[k]) continue;
      const [x, y] = LIEUX_PLACE[k];
      this.monde.remove(g);
      g.setPosition(x, y).setScale(0.9).setVisible(true).setAlpha(1);
      place.add(g); g.cle = k;
      // (v1.49 : un second groupe au même endroit, comme le décor de l'étal de l'Union, n'a ni ombre ni obstacle de plus)
      if (!poses.has(k)) { poses.add(k); ombre(x, y + 4, PETITS_LIEUX.includes(k) ? 90 : 200); if (!PETITS_LIEUX.includes(k)) this.obstacles.push([x - 70, y - 30, x + 70, y + 4]); }
      // un clic sur le lieu : JeuneGoy y va à pied, puis ce que le lieu faisait déjà
      const zones = g.list.filter(o => o.input && o.input.enabled && o.type !== 'Text');
      let action = null;
      for (const z of zones) {
        const fns = z.listeners('pointerdown');
        if (!action && fns.length) action = (...a) => fns.forEach(f => f.apply(z, a));
        z.removeAllListeners('pointerdown');
        z.on('pointerdown', () => this.allerVersLieu(k));
      }
      if (MARCHANDS[k]) this.actionsLieux[k] = () => this.boutique(k);
      else if (action) this.actionsLieux[k] = action;   // (un groupe sans zone ne remplace pas l'action du lieu)
      else if (!this.actionsLieux[k]) this.actionsLieux[k] = () => {};
    }
    // la fontaine, l'arche, la carte, le sentier
    ombre(900, 662, 200);
    const fontaine = this.add.image(900, 660, 'fontaineHD').setOrigin(0.5, 1).setScale(4).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.allerVersLieu('fontaine'));
    place.add(fontaine); this.obstacles.push([790, 600, 1010, 664]);
    if (benieJusqua(G)) { creerHalo(this); const l = this.add.image(900, 600, 'halo').setScale(2.2, 1.1).setTint(0x60c8ff).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD); l.yTri = 661; place.add(l); this.tweens.add({ targets: l, alpha: 0.15, duration: 1600, yoyo: true, repeat: -1 }); }
    this.actionsLieux.fontaine = () => this.vueFontaine();
    const arche = this.add.image(900, 1040, this.textures.exists('rueArcheHD_jour') ? 'rueArcheHD_jour' : 'rueArcheHD').setOrigin(0.5, 1).setScale(1.25).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.allerVersLieu('arche'));
    arche.yTri = 1040; place.add(arche); this.obstacles.push([800, 800, 1000, 1040]);
    this.actionsLieux.arche = () => this.rentrer();
    ombre(1060, 1002, 60); const carte = panneauCarteMonde(this, 1060, 1000); place.add(carte);
    this.actionsLieux.carte = () => this.message('La carte du monde : tes voyageurs partent de ton comptoir vers toutes ces contrées.');
    const poteau = this.add.image(1760, 760, barrierePlaceHD(this, 2)).setOrigin(0.5, 1).setScale(2.2); place.add(poteau);
    this.actionsLieux.moulin = () => this.message('Le sentier mène au Vieux Moulin et à l’étang de Barnabé. On s’y promène le soir, depuis chez toi.');
    // les arbres, les buissons, les barrières : dans l'herbe, jamais sur les chemins
    [[70, 420, 0], [70, 760, 1], [1740, 420, 1], [1720, 1030, 0], [420, 740, 1], [1390, 760, 0], [560, 200, 0], [1250, 200, 1], [40, 1040, 0], [330, 1040, 1]].forEach(([x, y, v]) => {
      ombre(x + 10, y, 120); place.add(this.add.image(x, y, arbrePlaceHD(this, pal, v)).setOrigin(0.5, 1).setScale(2.2)); this.obstacles.push([x - 16, y - 16, x + 16, y + 2]); });
    const marcheDuJour = typeof jourDeMarche === 'function' && jourDeMarche(G);   // (v1.54 : les jours de marché, les charrettes des colporteurs prennent la place de deux buissons)
    [[250, 760], [1520, 760], [700, 760], [1100, 760], ...(marcheDuJour ? [] : [[460, 470], [1340, 470]])].forEach(([x, y]) => { ombre(x, y, 70); place.add(this.add.image(x, y, buissonPlaceHD(this, pal)).setOrigin(0.5, 1).setScale(2.2)); });
    [[640, 1020], [1160, 1020]].forEach(([x, y]) => { ombre(x, y, 100); place.add(this.add.image(x, y, barrierePlaceHD(this, 5)).setOrigin(0.5, 1).setScale(2.2)); });
    // les jours de fête, des guirlandes au-dessus de la place
    if (this.fete || this.feteHiver) {
      const c = this.add.container(0, 0); c.yTri = 5000;
      for (const [x0, x1, y] of [[40, 900, 230], [900, 1760, 230], [120, 900, 470], [900, 1680, 470]]) {
        if (this.fete) this.guirlandeLampions(c, x0, x1, y, 34, 52, 1.2); else guirlandeSapin(this, c, x0, x1, y, 34, 80);
      }
      if (this.fete) { this.banniereConfrerie(c, 50, 600, 230, 0.9); this.banniereConfrerie(c, 1750, 600, 230, 0.9); }
      place.add(c);
    }
    // les enseignes, lisibles de loin, au-dessus de tout
    this.enseignesPlace = [];
    for (const cle of Object.keys(LIEUX_PLACE)) {
      if (!this.actionsLieux[cle]) continue;
      const [x, y] = LIEUX_PLACE[cle], [n, m] = this.nomLieuPlace(cle);
      enseigneLieu(this, x, y - (HAUTEUR_ENSEIGNE[cle] || 200), n, m, n === 'En travaux' ? '#c9b48a' : MARCHANDS[cle] ? couleurNom(G, MARCHANDS[cle].nom, true) : '#f3d98a').forEach(o => { o.yTri = 1e6; o.setDepth(0); place.add(o); this.enseignesPlace.push(o); });
    }
    // JeuneGoy, à l'arche s'il vient de la rue
    textureJoueur(this, G, 'dos');
    this.heros = this.add.image(840, 760, textureJoueur(this, G, 'dos')).setOrigin(0.5, 1).setScale(echelleJoueur(P.echelle));
    this.ombreHeros = ombre(840, 760, 40);
    place.add(this.heros);
    this.vueHeros = 'dos'; this.pasHeros = 0; this.cible = null; this.apresMarche = null;
    // le crieur annonce la première nouvelle du jour
    if (G.gazette && G.gazette.jour === G.jour && G.gazette.lignes.length) {
      const [x, y] = LIEUX_PLACE.crieur;
      const b = this.add.text(x - 30, y - 150, '« Oyez, oyez ! ' + G.gazette.lignes[0] + ' »', style(12, '#3b2410', { fontStyle: 'italic', backgroundColor: '#f6ead0', padding: { x: 7, y: 5 }, wordWrap: { width: 250 } })).setOrigin(1, 1).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.allerVersLieu('crieur'));
      b.yTri = 1e6 + 1; place.add(b); this.bullePlaceCrieur = b;
    }
    // les passants, à la même échelle que tout le monde
    this.passantsPlace = [];
    const peuples = ['humain', 'nain', 'elfe', 'hobbit', 'humain', 'magicienne'];
    const marche = typeof jourDeMarche === 'function' && jourDeMarche(G);
    for (let i = 0; i < (marche ? 8 : 5); i++) this.ajouterPassantPlace(i, peuples[(G.jour + i) % peuples.length]);
    if (marche) this.jourDeMarchePlace();
    // (v1.53, planche 62) le temps qu'il fait sur la place, sous l'interface
    if (typeof ambianceMeteo === 'function') ambianceMeteo(this, { ciel: false, prof: -0.6 });
    // l'interface de la place : l'invite devant un lieu, la carte (M), la liste de courses (L)
    this.add.rectangle(480, 22, 960, 40, 0x1a120a, 0.45).setDepth(4);
    this.invitePlace = this.add.text(480, 462, '', style(14, '#fff4dc', { fontStyle: 'bold', backgroundColor: '#1a120add', padding: { x: 12, y: 5 } })).setOrigin(0.5).setDepth(6).setVisible(false);
    const b1 = creerBouton(this, 882, 108, 140, 'La place · M', () => this.basculerCartePlace()); b1.label.setFontSize(13);
    const b2 = creerBouton(this, 882, 146, 140, 'Ma liste · L', () => this.listeCourses()); b2.label.setFontSize(13);
    this.boutonsPlace = [b1, b2];
    this.retour.setTexte && this.retour.setTexte('◀ La place');
    // les commandes au clavier
    const k = this.input.keyboard;
    if (k) {
      this.touches = k.createCursorKeys();
      this.zqsd = k.addKeys('Z,Q,S,D,W,A', false);
      k.on('keydown', e => {
        if (!this.place || !this.sys.isActive()) return;
        if (this.boutiqueC || this.listeC) return;
        if (e.key === 'm' || e.key === 'M') this.basculerCartePlace();
        else if (e.key === 'l' || e.key === 'L') { if (!this.bloquePlace()) this.listeCourses(); }
        else if (e.key === 'Escape') { if (this.carteC) this.basculerCartePlace(); else if (this.panneauOuvert && !this.vitrineOuverte) this.vueEnsemble(); }
        else if ((e.key === ' ' || e.key === 'Enter') && this.lieuProche && !this.bloquePlace()) this.agirLieu(this.lieuProche);
      });
    }
    this.input.on('pointerdown', (p, sous) => {
      if (!this.place || sous.length || p.y < 40 || p.y > 476) return;
      // (un clic sur la place, panneau ouvert au-dessus : on le referme et on repart à pied)
      if (this.panneauOuvert && !this.vitrineOuverte && !this.boutiqueC && !this.listeC && !this.carteC && !this.jeuLance && p.y < 300) this.vueEnsemble();
      if (this.bloquePlace()) return;
      this.partirVers((p.x - place.x) / place.scaleX, (p.y - place.y) / place.scaleY);
    });
    this.cadrerPlace(true);
  },

  // (v1.54, planche 62) Le jour de marché : des fanions, deux charrettes de colporteurs de passage, du monde, et Garrick
  // qui flâne entre les étals (un clic : ce qu'il en dit)
  jourDeMarchePlace() {
    const c = this.add.container(0, 0); c.yTri = 5000;
    for (const [x0, x1, y] of [[40, 900, 236], [900, 1760, 236]]) guirlandeFanions(this, c, x0, x1, y, 30, 44, 1.2);
    this.place.add(c);
    const lignes = [
      "Jour de marché ! Je viens de loin, alors je vends moins cher qu'eux : tout est un dixième en dessous, sur toute la place.",
      "Des colporteurs, il en passe un jour par semaine. Le reste du temps, on est sur les routes, avec l'âne.",
      "Tu tiens un comptoir ? Aujourd'hui, du monde de passage ira jusqu'à chez toi. Fais le plein avant !",
    ];
    [[450, 486, false], [1350, 486, true]].forEach(([x, y, miroir], i) => {
      this.ombrePlace(x, y, 230);
      const ch = this.add.image(x, y, charretteColporteurHD(this)).setOrigin(0.5, 1).setScale(2.2).setFlipX(miroir).setInteractive({ useHandCursor: true });
      ch.yTri = y; this.place.add(ch); this.obstacles.push([x - 120, y - 40, x + 120, y + 2]);
      const cle = corpsHD(this, 'colporteur', null, 'face');
      const v = this.add.image(x + (miroir ? -70 : 70), y + 44, cle).setOrigin(0.5, 1).setScale(PLACE_MARCHE.echelle * echelleCorps(cle)).setInteractive({ useHandCursor: true });
      v.yTri = y + 44; this.place.add(v); this.ombrePlace(v.x, v.y, 40);
      this.tweens.add({ targets: v, scaleY: v.scaleY * 1.015, duration: 1400 + i * 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });   // (il respire)
      const parle = () => this.bulleSur(v, lignes[(this.G.jour + i + (v.n = (v.n || 0) + 1)) % lignes.length], { nom: 'Colporteur ' + i, race: 'humain' });
      ch.on('pointerdown', parle); v.on('pointerdown', parle);
    });
    // Garrick, qui fait ses courses comme tout le monde
    this.ajouterPassantPlace(9, null, 'mentor');
  },

  // Une bulle au-dessus de quelqu'un sur la place
  bulleSur(img, texte, personne) {
    if (img.bulle && img.bulle.active) return;
    Son.jouer('voix', { personne, ton: 'content' });
    const b = img.bulle = this.add.text(img.x, img.y - img.displayHeight - 8, texte, style(12, '#3b2410', { fontStyle: 'italic', backgroundColor: '#f3e6c8', padding: { x: 8, y: 5 }, wordWrap: { width: 260 }, align: 'center' })).setOrigin(0.5, 1).setScale(0);
    b.yTri = 1e6 + 2; this.place.add(b);
    this.tweens.add({ targets: b, scale: 1 / this.place.scaleX, duration: 180, ease: 'Back.easeOut' });
    this.time.delayedCall(Math.max(2600, texte.length * 55), () => b.active && this.tweens.add({ targets: b, alpha: 0, duration: 300, onComplete: () => b.destroy() }));
  },

  // Un passant qui flâne d'un lieu à l'autre, s'arrête un peu, repart (figurant : 'mentor' pour Garrick)
  ajouterPassantPlace(i, race, figurant = null) {
    const quoi = figurant || { nom: 'Flâneur ' + i, race, feminin: i % 2 === 1, niveau: 'novice' };
    const pts = Object.keys(LIEUX_PLACE).filter(k => k !== 'arche').map(k => this.devantLieu(k));
    const [x, y] = pts[(i * 3 + this.G.jour) % pts.length];
    const cle = corpsHD(this, quoi, null, 'face');
    const img = this.add.image(x + 30, y + 10, cle).setOrigin(0.5, 1).setScale(PLACE_MARCHE.echelle * echelleCorps(cle)).setInteractive({ useHandCursor: true });
    const o = { img, quoi, vue: 'face', cible: null, pause: 600 + i * 900, pas: 0, ombre: this.ombrePlace(x + 30, y + 10, 40), pts };
    img.on('pointerdown', () => this.passantPlaceParle(o));
    this.place.add(img);
    this.passantsPlace.push(o);
  },

  passantPlaceParle(o) {
    if (o.bulle && o.bulle.active) return;
    o.pause = 4200; o.cible = null;
    const garrick = o.quoi === 'mentor';
    const texte = garrick ? Phaser.Utils.Array.GetRandom(PHRASES_GARRICK_MARCHE) : this.phraseMarche();
    Son.jouer('voix', { personne: garrick ? { nom: 'Garrick', race: 'humain' } : { nom: o.quoi.nom, race: o.quoi.race, feminin: o.quoi.feminin }, ton: Phaser.Utils.Array.GetRandom(['content', 'rire', 'etonne', 'neutre']) });
    const b = o.bulle = this.add.text(o.img.x, o.img.y - o.img.displayHeight - 8, texte, style(12, '#3b2410', { fontStyle: 'italic', backgroundColor: '#f3e6c8', padding: { x: 8, y: 5 }, wordWrap: { width: 240 }, align: 'center' })).setOrigin(0.5, 1).setScale(0);
    b.yTri = 1e6 + 2; this.place.add(b);
    this.tweens.add({ targets: b, scale: 1 / this.place.scaleX, duration: 180, ease: 'Back.easeOut' });
    this.time.delayedCall(Math.max(2600, texte.length * 55), () => this.tweens.add({ targets: b, alpha: 0, duration: 300, onComplete: () => b.destroy() }));
  },

  // Une vue du joueur ou d'un passant, selon le sens de la marche
  vueSelon(dx, dy) { return Math.abs(dy) > Math.abs(dx) * 0.8 ? (dy < 0 ? 'dos' : 'face') : 'profil'; },

  // Rien ne bouge quand une boutique, une vue de près ou la carte est ouverte
  bloquePlace() { return !!(this.panneauOuvert || this.vitrineOuverte || this.boutiqueC || this.listeC || this.carteC || this.jeuLance || conseilOuvert()); },

  bloqueParObstacle(x, y) { return this.obstacles.some(([x0, y0, x1, y1]) => x > x0 && x < x1 && y > y0 && y < y1); },

  // (v1.49) Un itinéraire : une recherche sur une grille de 20 px (les étals, la fontaine, les troncs bloquent), puis on
  // lisse le chemin en ne gardant que les tournants nécessaires. Une cible inaccessible : la case libre la plus proche.
  libreEntre(x0, y0, x1, y1) {
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 6);
    for (let k = 1; k <= n; k++) if (this.bloqueParObstacle(x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n)) return false;
    return true;
  },
  itineraire(dx, dy, ax, ay) {
    const P = PLACE_MARCHE, C = 20, W = Math.ceil(P.L / C), Hc = Math.ceil(P.H / C);
    ax = Phaser.Math.Clamp(ax, 30, P.L - 30); ay = Phaser.Math.Clamp(ay, 196, P.H - 6);
    if (this.libreEntre(dx, dy, ax, ay) && !this.bloqueParObstacle(ax, ay)) return [[ax, ay]];
    if (!this.grillePlace) {
      this.grillePlace = new Uint8Array(W * Hc);
      for (let j = 0; j < Hc; j++) for (let i = 0; i < W; i++) {
        const x = i * C + C / 2, y = j * C + C / 2;
        this.grillePlace[j * W + i] = y < 196 || x < 30 || x > P.L - 30 || this.obstacles.some(([x0, y0, x1, y1]) => x > x0 - 8 && x < x1 + 8 && y > y0 - 8 && y < y1 + 8) ? 1 : 0;
      }
    }
    const g = this.grillePlace, cel = (x, y) => [Phaser.Math.Clamp(Math.floor(x / C), 0, W - 1), Phaser.Math.Clamp(Math.floor(y / C), 0, Hc - 1)];
    const [si, sj] = cel(dx, dy);
    let [gi, gj] = cel(ax, ay);
    if (g[gj * W + gi]) {   // la case libre la plus proche de la cible
      let best = null, bd = 1e9;
      for (let j = 0; j < Hc; j++) for (let i = 0; i < W; i++) if (!g[j * W + i]) { const d = (i - gi) ** 2 + (j - gj) ** 2; if (d < bd) { bd = d; best = [i, j]; } }
      if (!best) return [[ax, ay]];
      [gi, gj] = best; ax = gi * C + C / 2; ay = gj * C + C / 2;
    }
    const prec = new Int32Array(W * Hc).fill(-1), vu = new Uint8Array(W * Hc), file = [sj * W + si];
    vu[sj * W + si] = 1;
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    let trouve = false;
    for (let q = 0; q < file.length && !trouve; q++) {
      const c = file[q], ci = c % W, cj = (c - ci) / W;
      for (const [di, dj] of dirs) {
        const ni = ci + di, nj = cj + dj; if (ni < 0 || nj < 0 || ni >= W || nj >= Hc) continue;
        const n = nj * W + ni; if (vu[n] || g[n]) continue;
        if (di && dj && (g[cj * W + ni] || g[nj * W + ci])) continue;   // (pas de coin coupé)
        vu[n] = 1; prec[n] = c; file.push(n);
        if (ni === gi && nj === gj) { trouve = true; break; }
      }
    }
    if (!trouve) return [[ax, ay]];
    const cases = [];
    for (let c = gj * W + gi; c !== -1 && c !== sj * W + si; c = prec[c]) cases.unshift([(c % W) * C + C / 2, Math.floor(c / W) * C + C / 2]);
    cases[cases.length - 1] = [ax, ay];
    // lissage : de là où l'on est, on file au point visible le plus loin
    const pts = []; let [cx, cy] = [dx, dy], k = 0;
    while (k < cases.length) {
      let loin = k;
      for (let m = cases.length - 1; m > k; m--) if (this.libreEntre(cx, cy, cases[m][0], cases[m][1])) { loin = m; break; }
      pts.push(cases[loin]); [cx, cy] = cases[loin]; k = loin + 1;
    }
    return pts;
  },
  partirVers(x, y, cle = null, courir = false) {
    const pts = this.itineraire(this.heros.x, this.heros.y, x, y);
    this.cible = pts.shift(); this.chemin = pts; this.apresMarche = cle; this.courir = courir;
    this.meilleur = { d: 1e9, t: this.time.now };
  },

  allerVersLieu(cle, courir = false) {
    if (!this.place || this.bloquePlace()) return;
    const [x, y] = this.devantLieu(cle);
    if (Math.hypot(this.heros.x - x, this.heros.y - y) < 40) return this.agirLieu(cle);
    this.partirVers(x, y, cle, courir || Math.hypot(this.heros.x - x, this.heros.y - y) > 600);
  },

  agirLieu(cle) {
    this.cible = null; this.chemin = null; this.apresMarche = null;
    this.vueHeros = cle === 'arche' ? 'face' : 'dos'; this.poserHeros(0);
    const a = this.actionsLieux[cle];
    if (a) { Son.jouer('clic'); a(); }
  },

  poserHeros(pas) {
    const base = textureJoueur(this, this.G, this.vueHeros);
    const k = pas ? base + '_pas' + pas : base;
    this.heros.setTexture(this.textures.exists(k) ? k : base).setFlipX(this.vueHeros === 'profil' && this.versGauche);
  },

  // Le cadre : la place suit JeuneGoy ; panneau ouvert, on recule un peu pour voir le lieu au-dessus du panneau
  cadrerPlace(instantane = false, cle = null) {
    const P = PLACE_MARCHE, place = this.place;
    let z = P.zoom, fx = this.heros.x, fy = this.heros.y - 40, sy = 270;
    if (cle) { z = P.zoomPanneau; [fx, fy] = LIEUX_PLACE[cle]; sy = 250; }
    const x = Phaser.Math.Clamp(480 - fx * z, 960 - P.L * z, 0), y = Phaser.Math.Clamp(sy - fy * z, 478 - P.H * z, 0);
    if (instantane) { place.setScale(z).setPosition(x, y); return; }
    if (cle) { this.tweens.killTweensOf(place); this.tweens.add({ targets: place, x, y, scale: z, duration: 450, ease: 'Sine.easeInOut' }); return; }
    // en marchant : on glisse doucement
    if (this.tweens.isTweening(place)) return;
    const k = 0.14;
    place.setScale(place.scaleX + (z - place.scaleX) * k);
    place.setPosition(place.x + (x - place.x) * k, place.y + (y - place.y) * k);
  },

  // --- Les deux méthodes de la vue d'avant, redirigées sur la place ---
  montrer(cle) {
    this.lieuMontre = cle; this.modeVue = false; this.panneauOuvert = true;
    if (this.place) { this.cadrerPlace(false, LIEUX_PLACE[cle] ? cle : null); if (this.invitePlace) this.invitePlace.setVisible(false); }
    if (this.bulleCrieur) this.bulleCrieur.setVisible(false);
    for (const o of [this.fondPanneau, this.retour.fond, this.retour.label]) o.setVisible(true);
  },
  vueEnsemble() {
    this.modeVue = true; this.lieuMontre = null; this.panneauOuvert = false;
    if (this.contenu) this.contenu.setVisible(false);
    if (this.panneau && this.etatBonneteau === 'melange') this.panneau('');   // (la mise rendue, comme avant)
    if (this.contenu) this.contenu.setVisible(false);
    for (const o of [this.fondPanneau, this.retour && this.retour.fond, this.retour && this.retour.label]) if (o) o.setVisible(false);
    if (this.place) this.tweens.killTweensOf(this.place);
  },

  // --- La carte de la place (M) : tout d'un coup d'œil ; un clic sur un nom, et JeuneGoy y court ---
  basculerCartePlace() {
    if (!this.place) return;
    if (this.carteC) { this.carteC.destroy(); this.carteC = null; return; }
    if (this.bloquePlace()) return;
    const P = PLACE_MARCHE, z = Math.min(940 / P.L, 404 / P.H), ox = (960 - P.L * z) / 2, oy = 70;
    this.tweens.killTweensOf(this.place);
    this.place.setScale(z).setPosition(ox, oy);
    const c = this.carteC = this.add.container(0, 0).setDepth(30);
    c.add(this.add.rectangle(480, 34, 960, 68, 0x1a120a, 0.92));
    c.add(this.add.text(480, 50, 'La grand-place · clique sur un lieu pour y aller · M ou Échap : refermer', style(14, '#f3d98a', { fontStyle: 'bold' })).setOrigin(0.5));
    for (const cle of Object.keys(LIEUX_PLACE)) {
      if (!this.actionsLieux[cle]) continue;
      const [x, y] = LIEUX_PLACE[cle], [n] = this.nomLieuPlace(cle), dy = { arche: -150, mendiant: -10, carte: 6, moulin: -60 }[cle] || 0;
      const t = this.add.text(ox + Math.min(x, 1720) * z, oy + (y + dy) * z + 4, n, style(11, '#fff4dc', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 4, align: 'center', wordWrap: { width: 110 } })).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
      t.on('pointerover', () => t.setColor('#ffe066')).on('pointerout', () => t.setColor('#fff4dc'));
      t.on('pointerdown', () => { this.basculerCartePlace(); this.allerVersLieu(cle, true); });
      c.add(t);
    }
    const moi = this.add.text(ox + this.heros.x * z, oy + this.heros.y * z + 2, 'Toi', style(12, '#ffe066', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 4 })).setOrigin(0.5, 0);
    c.add(moi); this.tweens.add({ targets: moi, alpha: 0.4, duration: 500, yoyo: true, repeat: -1 });
    // les enseignes se cachent (les noms de la carte les remplacent)
    this.enseignesPlace.forEach(o => o.setVisible(false));
    c.once('destroy', () => { this.enseignesPlace.forEach(o => o.active && o.setVisible(true)); this.cadrerPlace(true); });
  },

  // --- Chaque image : JeuneGoy qui marche, les passants qui flânent, le cadre qui suit, l'ordre de profondeur ---
  update(temps, dt) {
    if (!this.place || !this.heros || !this.heros.active) return;
    dt = Math.min(dt, 50);
    const P = PLACE_MARCHE, h = this.heros;
    let dx = 0, dy = 0;
    if (!this.bloquePlace()) {
      const t = this.touches, z = this.zqsd;
      const bas = k => !!(k && k.isDown);
      const gauche = bas(t && t.left) || bas(z && z.Q) || bas(z && z.A), droite = bas(t && t.right) || bas(z && z.D);
      const haut = bas(t && t.up) || bas(z && z.Z) || bas(z && z.W), basT = bas(t && t.down) || bas(z && z.S);
      if (gauche || droite || haut || basT) {
        this.cible = null; this.chemin = null; this.apresMarche = null; this.courir = false;
        dx = (droite ? 1 : 0) - (gauche ? 1 : 0); dy = (basT ? 1 : 0) - (haut ? 1 : 0);
        const n = Math.hypot(dx, dy) || 1; dx *= P.vitesse * dt / n; dy *= P.vitesse * dt / n;
      } else if (this.cible) {
        const rx = this.cible[0] - h.x, ry = this.cible[1] - h.y, d = Math.hypot(rx, ry), v = (this.courir ? P.course : P.vitesse) * dt;
        if (d <= v + 0.5) { dx = rx; dy = ry; }
        else { dx = rx / d * v; dy = ry / d * v; }
      }
    }
    if (dx || dy) {
      const nx = Phaser.Math.Clamp(h.x + dx, 30, P.L - 30), ny = Phaser.Math.Clamp(h.y + dy, 196, P.H - 6);
      let ok = false;
      if (!this.bloqueParObstacle(nx, ny)) { h.setPosition(nx, ny); ok = true; }
      else if (dx && !this.bloqueParObstacle(nx, h.y)) { h.x = nx; ok = true; }
      else if (dy && !this.bloqueParObstacle(h.x, ny)) { h.y = ny; ok = true; }
      if (!ok && this.cible) {
        // coincé derrière un étal : on le contourne par le bas
        if (!this.bloqueParObstacle(h.x, h.y + 4)) h.y += 4; else { this.cible = null; this.apresMarche = null; }
      }
      const vue = this.vueSelon(dx, dy);
      if (dx) this.versGauche = dx < 0;
      if (vue !== this.vueHeros) this.vueHeros = vue;
      this.pasHeros += dt;
      const f = Math.floor(this.pasHeros / (this.courir ? 90 : 125)) % 4;
      this.poserHeros(f === 1 ? 1 : f === 3 ? 2 : 0);
      // (v1.49) il n'avance plus vers son but depuis une demi-seconde : il s'arrête (jamais de marche sur place)
      if (this.cible) {
        const d = Math.hypot(this.cible[0] - h.x, this.cible[1] - h.y);
        if (!this.meilleur || d < this.meilleur.d - 1.5) this.meilleur = { d, t: this.time.now };
        else if (this.time.now - this.meilleur.t > 500) { this.cible = null; this.chemin = null; this.apresMarche = null; this.courir = false; this.poserHeros(0); }
      }
      if (this.cible && Math.hypot(this.cible[0] - h.x, this.cible[1] - h.y) < 1 && this.chemin && this.chemin.length) { this.cible = this.chemin.shift(); this.meilleur = { d: 1e9, t: this.time.now }; }
      else if (this.cible && Math.hypot(this.cible[0] - h.x, this.cible[1] - h.y) < 1) {
        this.cible = null; this.courir = false;
        const cle = this.apresMarche; this.apresMarche = null;
        if (cle) this.agirLieu(cle); else this.poserHeros(0);
      }
    } else {
      if (this.pasHeros) { this.pasHeros = 0; this.poserHeros(0); }
      // (v1.49) déjà sur le point visé (un détour de longueur nulle) : on passe au suivant, ou on arrive
      if (this.cible && Math.hypot(this.cible[0] - h.x, this.cible[1] - h.y) < 1 && !this.bloquePlace()) {
        if (this.chemin && this.chemin.length) { this.cible = this.chemin.shift(); this.meilleur = { d: 1e9, t: this.time.now }; }
        else { const cle = this.apresMarche; this.cible = null; this.apresMarche = null; this.courir = false; if (cle) this.agirLieu(cle); }
      }
    }
    this.ombreHeros.setPosition(h.x + 2, h.y - 2); this.ombreHeros.yTri = h.y - 0.5;
    // les passants
    for (const o of this.passantsPlace) {
      if (o.bulle && o.bulle.active) o.bulle.setPosition(o.img.x, o.img.y - o.img.displayHeight - 8);
      if (o.pause > 0) { o.pause -= dt; if (o.pause <= 0) o.cible = Phaser.Utils.Array.GetRandom(o.pts).map((v, k) => v + (k ? 16 : Phaser.Math.Between(-40, 40))); continue; }
      if (!o.cible) { o.pause = 1500; continue; }
      const rx = o.cible[0] - o.img.x, ry = o.cible[1] - o.img.y, d = Math.hypot(rx, ry), v = 0.07 * dt;
      if (d < v + 1) { o.cible = null; o.pause = Phaser.Math.Between(1500, 5000); o.img.setTexture(corpsHD(this, o.quoi, null, o.vue)); continue; }
      let nx = o.img.x + rx / d * v, ny = o.img.y + ry / d * v;
      if (this.bloqueParObstacle(nx, ny)) { ny = o.img.y + 2; nx = o.img.x + Math.sign(rx) * v * 0.5; if (this.bloqueParObstacle(nx, ny)) { o.cible = null; o.pause = 800; continue; } }
      o.img.setPosition(nx, ny); o.ombre.setPosition(nx + 2, ny - 2); o.ombre.yTri = ny - 0.5;
      const vue = this.vueSelon(rx, ry);
      if (vue !== o.vue) o.vue = vue;
      o.pas += dt;
      const base = corpsHD(this, o.quoi, null, o.vue), f = Math.floor(o.pas / 150) % 4, k = f === 1 ? base + '_pas1' : f === 3 ? base + '_pas2' : base;
      o.img.setTexture(this.textures.exists(k) ? k : base).setFlipX(o.vue === 'profil' && rx < 0);
    }
    // le lieu le plus proche : son nom, et ce qu'on peut y faire
    let proche = null, dmin = 56;
    for (const cle of Object.keys(this.actionsLieux)) { const [x, y] = this.devantLieu(cle), d = Math.hypot(h.x - x, h.y - y); if (d < dmin) { dmin = d; proche = cle; } }
    this.lieuProche = proche;
    const montrer = proche && !this.bloquePlace();
    this.invitePlace.setVisible(!!montrer);
    if (montrer) { const [n, m] = this.nomLieuPlace(proche); this.invitePlace.setText(`${n}${m ? ' · ' + m : ''}   —   Espace ou clic : ${MARCHANDS[proche] ? 'faire tes courses' : proche === 'arche' ? 'rentrer' : 'approcher'}`); }
    if (!this.carteC && !this.panneauOuvert) this.cadrerPlace();
    for (const o of this.place.list) o.yTriPlace = o.yTri !== undefined ? o.yTri : o.y;
    this.place.sort('yTriPlace');
  },
});
