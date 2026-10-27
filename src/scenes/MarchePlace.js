// (v1.49, planche 73 v2 validée « parfait ») La grand-place du marché, où l'on se promène à pied, vue d'au-dessus.
// Le sol a du relief (herbe, terre battue, dalles au centre seulement), tout ce qui est debout a son ombre ; JeuneGoy,
// les marchands et les passants sont à la même échelle. On marche (clic au sol, flèches ou ZQSD), on s'approche d'un
// lieu (clic dessus, ou Espace devant lui) : les étals ouvrent la boutique en grand (un seul panier pour toute la
// place), les autres lieux le panneau du bas, comme avant. M : la carte de la place ; L : la liste de courses.

// (v1.64, planche 89 v4 b, chantier 1 : la place remise d'aplomb) Au-dessus de la place monte le pied des Coteaux (haut : la
// bande des y négatifs, que la caméra montre quand on est en haut de la place)
const PLACE_MARCHE = { L: 1800, H: 1040, haut: 140, zoom: 1.25, zoomPanneau: 0.95, vitesse: 0.3, course: 0.6, echelle: 4.5 };
// Où est chaque lieu (sa base, au sol), en pixels de la place
//   (v1.64) la cabane de Barnabé a quitté la place : elle est au bord de l'étang, près du Vieux Moulin, au bout de la route
//   qui part de la place vers l'est (le poteau, au bout de la route) ; le chemin creux monte aux Coteaux ; les portes rondes
//   du bas des Coteaux donnent sur la place
const LIEUX_PLACE = { forge: [330, 340], apothicaire: [560, 310], encheres: [900, 290], gedeon: [1240, 310], tailleuse: [1470, 340],
  bazar: [170, 610], brocante: [170, 870], garderobe: [1630, 610], crieur: [660, 560], tableau: [1140, 560], jeux: [560, 920], mendiant: [770, 1000],
  fontaine: [900, 660], carte: [1090, 1000], arche: [900, 1040], moulin: [1784, 740], coteaux: [1070, 176],
  ...Object.fromEntries(COTEAUX_PLACE.bas.map(([x], i) => ['porte' + i, [x, COTEAUX_PLACE.levre]])) };
// (v1.64) Ce qu'on devine derrière les portes rondes du bas des Coteaux
const PORTES_COTEAUX = [
  'Une porte ronde, vert mousse, au bouton de laiton bien astiqué. Ça sent la tarte aux mûres jusque sur la place.',
  'Derrière la porte rouge, quelqu’un chante en faisant la vaisselle, faux et de bon cœur. Le banc attend les voisins du soir.',
  'Une porte jaune. Sur le paillasson : « Pas d’aventuriers, merci. » Et, en plus petit : « Sauf pour le thé. »',
  'La porte bleue est entrouverte : un couloir tout rond, des tapis tressés, et une odeur de pain chaud.',
];
const PETITS_LIEUX = ['crieur', 'tableau', 'mendiant'];
// (v1.61) Ce que se disent deux passants qui se croisent sur la place
const CAUSERIES_PLACE = [
  ['Tu as vu le prix des pommes ?', 'Une honte ! Mais elles sont bonnes.'],
  ['Il paraît qu’on a vu un dragon au nord.', 'Encore une histoire du crieur...'],
  ['Ton fils est parti à l’aventure ?', 'Avec un baluchon du Comptoir. Je dors mieux.'],
  ['Belle journée pour flâner !', 'Belle journée pour dépenser, surtout.'],
  ['Tu vas chez Thorgal ?', 'Pour un clou. Il va encore me vendre un marteau.'],
  ['On dit que la fontaine exauce les vœux.', 'Moi, elle m’a surtout mouillé les pieds.'],
  ['Tu viendras danser au Solstice ?', 'Si mes genoux veulent bien.'],
  ['Le mendiant a encore nourri son chien avant lui.', 'Brave homme. Je lui ai laissé une pièce.'],
  ['Marcelline a de nouvelles capes.', 'Trop chères pour moi. Mais si jolies...'],
  ['Il pleuvra demain, d’après Ysmée.', 'Ysmée se trompe une fois sur cinq. Je prends le risque.'],
];

Object.assign(MarcheScene.prototype, {
  // Le nom et le métier de chaque lieu (le nom est écrit dans le lieu lui-même : poserNomsPlace ; le métier sur une petite enseigne)
  nomLieuPlace(cle) {
    const G = this.G;
    if (MARCHANDS[cle]) return [MARCHANDS[cle].nom, MARCHANDS[cle].metier];
    const autres = { fontaine: ['La fontaine', 'Un vœu : 1 p.'], carte: ['La carte du monde', ''], arche: ['La rue Soucolline', 'ta boutique, la banque'], moulin: ['Le Vieux Moulin', 'l’étang de Barnabé'],
      coteaux: ['Les Coteaux', 'par le chemin creux'] };   // (v1.64 : la rue a son nom ; le poteau dit où mène le sentier)
    if (autres[cle]) return autres[cle];
    if (/^porte\d/.test(cle)) return ['Une porte ronde', 'les Coteaux'];
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
    if (cle === 'arche') return [x, y - 40];   // (v1.62 : devant le porche, côté place, entre ses deux poteaux)
    if (cle === 'moulin') return [x - 34, y + 26];   // (v1.64 : sur la route, au pied du poteau)
    if (cle === 'coteaux' || /^porte\d/.test(cle)) return [x, 206];   // (au pied du talus, sur le chemin du haut)
    return [x, Math.min(PLACE_MARCHE.H - 8, y + 34)];
  },

  construirePlace() {
    const G = this.G, P = PLACE_MARCHE;
    // (v1.64) le brouhaha de la place, en fond (en attente du choix du joueur : voir sonAChoisir, src/sonsRefaits.js)
    if (typeof sonAChoisir === 'function') sonAChoisir('foule', { scene: this });
    // l'ancienne vue (la rue en demi-cercle) s'efface : tout se passe sur la place
    for (const o of [this.fondVue, this.fondVue && this.fondVue.paysage, this.solVue, this.monde, this.vue]) if (o && o.setVisible) o.setVisible(false);
    if (this.bulleCrieur) { this.bulleCrieur.destroy(); this.bulleCrieur = null; }
    this.etiquettesRue.forEach(t => t.setVisible(false));
    for (const c of [this.vue, this.monde]) if (c) c.list.forEach(o => { if (o.input && o.disableInteractive) o.disableInteractive(); });
    creerRueHD(this); creerDecorPlaceHD(this);
    const place = this.place = this.add.container(0, 0).setDepth(-1);
    const saison = typeof saisonDe === 'function' ? saisonDe(G) : 'semailles';
    const pal = this.palettePlace = paletteSaisonComte(saison);
    this.saisonPlace = saison;
    // le sol : terre battue sous les étals et sur les chemins d'usure, dalles au centre, herbe ailleurs
    { const sol = this.add.image(0, 0, solPlaceHD(this, 'solPlace_' + saison, pal, P.L / 2, 520, planSolPlace())).setOrigin(0).setScale(2); sol.yTri = -1e6; place.add(sol); }
    this.obstacles = []; this.grillePlace = null;   // (v1.61 : les charrettes du jour de marché changent la grille)
    this.visite = null;
    this.nomsRelation = [];   // (les noms qui prennent la couleur de la relation : majNomsPlace les redessine si elle change)
    const ombre = (x, y, l) => { const o = this.add.image(x + l * 0.06, y - 2, ombrePlaceHD(this)).setScale(l / 64, l / 64 * 0.9); o.yTri = y - 0.5; place.add(o); return o; };
    this.ombrePlace = ombre;
    // (v1.64, planche 89) au nord, plus de façades de la rue recopiées : le pied des Coteaux, ses portes rondes, le chemin creux
    this.versMoulin = null; this.sapinPlace = null;
    this.poserCoteauxPlace(pal, saison);
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
      if (!poses.has(k)) { poses.add(k); ombre(x, y + 4, PETITS_LIEUX.includes(k) ? 90 : 200); this.obstacles.push(PETITS_LIEUX.includes(k) ? [x - 30, y - 22, x + 30, y + 2] : [x - 70, y - 30, x + 70, y + 4]); }   // (v1.61 : l'estrade du crieur, le tableau, le mendiant bloquent aussi)
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
    // (v1.62, planche 80) la fontaine : la même que de près, en petit, son eau qui bouge ; l'obstacle suit le bassin rond
    const fp = this.poserFontainePlace();
    if (benieJusqua(G)) { creerHalo(this); const l = this.add.image(900, fp.eau, 'halo').setScale(2.2, 1.1).setTint(0x60c8ff).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD); l.yTri = fp.sol + 0.6; place.add(l); this.tweens.add({ targets: l, alpha: 0.15, duration: 1600, yoyo: true, repeat: -1 }); }
    this.actionsLieux.fontaine = () => this.vueFontaine();
    // (v1.62, planche 80, système A) le porche couvert, vers la rue : on ne bute que sur ses deux poteaux
    this.poserPorchePlace();
    this.actionsLieux.arche = () => this.rentrer();
    { const [cx, cy] = LIEUX_PLACE.carte; ombre(cx, cy + 2, 80); this.poserCartePlace(cx, cy); this.obstacles.push([cx - 22, cy - 14, cx + 22, cy + 2]); }   // (v1.62 : un peu à l'écart du porche)
    this.coinMendiantPlace();
    this.actionsLieux.carte = () => this.message('La carte du monde : tes voyageurs partent de ton comptoir vers toutes ces contrées.');
    // (v1.64, planche 89 v4 b) la route du Vieux Moulin : elle quitte la place vers l'est, bordée de pierres (peintes dans le
    // sol), de deux bouts de barrière, et son poteau à deux bras (« Le Vieux Moulin », « l'étang de Barnabé ») ; y aller, c'est
    // marcher jusqu'au bout et passer de l'autre côté (scène de l'étang, EtangScene)
    { const [px, py] = LIEUX_PLACE.moulin, im = this.add.image(px, py, poteauDeuxBrasHD(this, saison)).setOrigin(0.85, 1).setScale(2); im.yTri = py; place.add(im);
      const [, , b1, b2] = POTEAU_DEUX_BRAS, o = { police: 'Alegreya', graisse: 900, couleur: '#1e1006', fond: BOIS_CLAIR_NOM, genre: 'grave', lignesMax: 1, ...contrasteLettrage('#1e1006', BOIS_CLAIR_NOM) }, gx = px - 0.85 * POTEAU_DEUX_BRAS[0] * 2, hy = py - POTEAU_DEUX_BRAS[1] * 2;
      poserLettrage(this, place, gx + b1[0] * 2, hy + b1[1] * 2, this.nomLieuPlace('moulin')[0], { ...o, taille: 13, largeur: b1[2] * 2, hauteur: 18 }).yTri = py + 0.1;
      poserLettrage(this, place, gx + b2[0] * 2, hy + b2[1] * 2, this.nomLieuPlace('moulin')[1].replace(/^l/, 'L'), { ...o, taille: 11, largeur: b2[2] * 2, hauteur: 15 }).yTri = py + 0.1;
      this.obstacles.push([px - 8, py - 12, px + 8, py + 2]);
      for (const [x, y] of [[1590, 708], [1690, 722], [1610, 802], [1706, 812]]) { ombre(x, y, 70); const b = this.add.image(x, y, barrierePlaceHD(this, 4)).setOrigin(0.5, 1).setScale(2.2); b.yTri = y; place.add(b); this.obstacles.push([x - 46, y - 10, x + 46, y + 2]); } }
    this.actionsLieux.moulin = () => this.partirVersMoulin();
    // (v1.64) le chemin creux, et les portes rondes du bas des Coteaux
    this.actionsLieux.coteaux = () => this.message('Le chemin creux monte aux Coteaux entre ses deux murets : là-haut, les portes rondes des familles hobbites, leurs jardins, leurs cheminées. Une barrière ferme les premières marches, qu’on refait : on montera une autre fois.');
    COTEAUX_PLACE.bas.forEach((b, i) => { this.actionsLieux['porte' + i] = () => this.message(PORTES_COTEAUX[i % PORTES_COTEAUX.length]); });
    // les arbres, les buissons, les barrières : dans l'herbe, jamais sur les chemins
    [[70, 420, 0], [70, 760, 1], [1740, 420, 1], [1720, 1030, 0], [420, 740, 1], [1390, 760, 0], [560, 200, 0], [1250, 200, 1], [40, 1040, 0], [330, 1040, 1]].forEach(([x, y, v]) => {
      ombre(x + 10, y, 120); { const cle = arbrePlaceHD(this, pal, v, x, y); place.add(this.add.image(x, y, cle).setOrigin(0.5, origineArbre(this, cle)).setScale(2.2)); } this.obstacles.push([x - 16, y - 16, x + 16, y + 2]); });
    const marcheDuJour = typeof jourDeMarche === 'function' && jourDeMarche(G);   // (v1.54 : les jours de marché, les charrettes des colporteurs prennent la place de deux buissons)
    [[250, 760], [1520, 760], [700, 760], [1100, 760], ...(marcheDuJour ? [] : [[460, 470], [1340, 470]])].forEach(([x, y]) => { ombre(x, y, 70); { const cle = buissonPlaceHD(this, pal, x, y); place.add(this.add.image(x, y, cle).setOrigin(0.5, origineArbre(this, cle)).setScale(2.2)); } this.obstacles.push([x - 26, y - 14, x + 26, y + 2]); });
    [[640, 1020], [1160, 1020]].forEach(([x, y]) => { ombre(x, y, 100); place.add(this.add.image(x, y, barrierePlaceHD(this, 5)).setOrigin(0.5, 1).setScale(2.2)); this.obstacles.push([x - 52, y - 12, x + 52, y + 2]); });
    // les jours de fête, des guirlandes au-dessus de la place
    if (this.fete || this.feteHiver) {
      const c = this.add.container(0, 0); c.yTri = 5000;
      for (const [x0, x1, y] of [[40, 900, 230], [900, 1760, 230], [120, 900, 470], [900, 1680, 470]]) {
        if (this.fete) this.guirlandeLampions(c, x0, x1, y, 34, 52, 1.2); else guirlandeSapin(this, c, x0, x1, y, 34, 80);
      }
      if (this.fete) { this.banniereConfrerie(c, 50, 600, 230, 0.9); this.banniereConfrerie(c, 1750, 600, 230, 0.9); }
      place.add(c);
    }
    // (v1.63, planche 80 v3) les noms : dans les étals eux-mêmes, plus de panneau qui flotte au-dessus
    this.poserNomsPlace();
    // (v1.64) pendant tout le Givre, les décorations du Long Hiver (après les noms : elles se posent autour, jamais dessus)
    if (saison === 'givre') this.decorerGivrePlace(pal);
    // JeuneGoy, à l'arche s'il vient de la rue
    textureJoueur(this, G, 'dos');
    // (v1.64 : de retour de l'étang, au bout de la route du Moulin, tourné vers la place)
    const [hx, hy] = this.depuisPlace === 'etang' ? this.devantLieu('moulin') : [840, 760];
    this.heros = this.add.image(hx, hy, textureJoueur(this, G, 'dos')).setOrigin(0.5, 1).setScale(echelleJoueur(P.echelle));
    this.ombreHeros = ombre(hx, hy, 40);
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
    this.oublierBoutonsPlace(); this.creerBoutonsPlace();   // (MarcheBoutons.js : ils s'écartent des noms des étals)
    // (v1.61) pour quitter un lieu : un bouton bien visible sur le coin du cadre, et un clic n'importe où sur la place
    if (this.retour.setTexte) this.retour.setTexte('✕ Partir · Échap');
    for (const o of [this.retour.fond, this.retour.label]) if (o) o.setPosition(842, 296).setDepth(7);
    // les commandes au clavier
    const k = this.input.keyboard;
    if (k) {
      this.touches = k.createCursorKeys();
      this.zqsd = k.addKeys('Z,Q,S,D,W,A', false);
      k.on('keydown', e => {
        if (!this.place || !this.sys.isActive() || e.repeat) return;   // (v1.61 : une touche maintenue n'agit qu'une fois)
        if (this.boutiqueC || this.listeC) return;
        if (this.visiteEnCours() && !this.bloquePlace() && this.toucheVisite(e)) return;   // (la visite de Garrick : Espace, Échap)
        if (e.key === 'm' || e.key === 'M') this.basculerCartePlace();
        else if (e.key === 'l' || e.key === 'L') { if (!this.bloquePlace()) this.listeCourses(); }
        else if (e.key === 'Escape') { if (this.carteC) this.basculerCartePlace(); else if (this.panneauOuvert && !this.vitrineOuverte) this.vueEnsemble(); }
        else if ((e.key === 'e' || e.key === 'E' || ((e.key === ' ' || e.key === 'Enter') && !this.visiteEnCours())) && this.lieuProche && !this.bloquePlace()) this.agirLieu(this.lieuProche);   // (v1.61 : E, comme dans les jeux d'aventure ; pendant la visite de Garrick, Espace : la suite)
      });
    }
    const dansPlace = o => { for (let c = o; c; c = c.parentContainer) if (c === place) return true; return false; };
    // (v1.61) les coordonnées du monde (960 × 540) : sur un grand écran, p.x et p.y comptent en pixels réels
    this.input.on('pointerdown', (p, sous) => {
      const px = p.worldX, py = p.worldY;
      if (!this.place || py < 40 || py > 476) return;
      const surInterface = sous.some(o => !dansPlace(o));
      // (v1.61) un lieu ouvert : un clic n'importe où sur la place au-dessus du cadre (même sur un passant ou une bulle) le referme
      if (this.panneauOuvert && !this.vitrineOuverte && !this.boutiqueC && !this.listeC && !this.carteC && !this.jeuLance && py < 300 && !surInterface) { this.vueEnsemble(); return; }
      if (sous.length || this.bloquePlace()) return;
      this.mainJoueur = this.time.now;   // (le joueur mène : Garrick l'attend, s'il fait la visite)
      this.partirVers((px - place.x) / place.scaleX, (py - place.y) / place.scaleY);
      this.marqueClic((px - place.x) / place.scaleX, (py - place.y) / place.scaleY);
    });
    // (v1.61) à la souris : bouton gardé enfoncé, JeuneGoy suit le pointeur (comme avec ZQSD)
    this.input.on('pointermove', p => {
      const px = p.worldX, py = p.worldY;
      if (!this.place || !p.isDown || (!p.wasTouch && !(p.event && p.event.buttons & 1)) || py < 40 || py > 476 || this.bloquePlace() || this.apresMarche) return;
      if (this.time.now - (this.dernierGlisse || 0) < 120) return;
      this.dernierGlisse = this.time.now; this.mainJoueur = this.time.now;
      this.partirVers((px - place.x) / place.scaleX, (py - place.y) / place.scaleY);
    });
    this.cadrerPlace(true);
    // (v1.62) le sol de la vue du mendiant se prépare par petits morceaux, pendant la promenade
    this.time.delayedCall(2500, () => {
      const ev = this.time.addEvent({ delay: 50, loop: true, callback: () => { if (!this.place || solMendiantHD(this, saison, 6)) ev.remove(); } });
    });
  },

  // (v1.63, planche 80 v3) Les noms des lieux sont dans les lieux : peints sur le lambrequin d'un auvent, gravés dans une
  // poutre, brodés, cloués en lettres de bois, selon le style de chaque étal (ETALS_NOMS). Le nom prend la couleur de la
  // relation avec le marchand (couleurNom), liseré et ombre pour se détacher de sa bande ; le métier pend à une petite
  // enseigne, au poteau du côté du centre de la place. Le mendiant, la fontaine : l'invite du bas les nomme, rien d'écrit.
  poserNomsPlace() {
    const G = this.G, faits = new Set();
    const nomRelation = (k, sombre) => MARCHANDS[k] ? couleurNom(G, MARCHANDS[k].nom, sombre) : null;
    for (const g of this.place.list) {
      const k = g.cle; if (!k || faits.has(k)) continue;
      const [nom, metier] = this.nomLieuPlace(k);
      if (nom === 'En travaux') { faits.add(k); continue; }   // (le chantier a son propre écriteau : « En travaux, ouverture le jour… »)
      const style = k === 'jeux' ? (this.fete ? 'tir' : this.feteHiver ? 'roue' : 'jeux') : k;
      const etals = g.list.filter(o => o.texture && /^etalHD_/.test(o.texture.key));
      const met = METIERS_NOMS[k] || metier;
      if (ETALS_NOMS[style]) {
        if (!etals.length) continue;   // (un second groupe au même endroit, comme le décor de l'étal de l'Union : le nom est sur le premier)
        faits.add(k);
        const m = ETALS_NOMS[style], couleur = parseInt(etals[0].texture.key.split('_')[1], 16);
        const coul = m.couleurFixe || nomRelation(k, true) || '#f3d98a';
        const fond = m.modele === 'poutre' ? (m.bois === 'peinte' ? couleur : m.bois === 'vieille' ? 0x8a5a2b : 0x3a2414) : (m.ton ? melangeCouleurs(couleur, '#000000', 0.2) : couleur);
        const o = { police: m.police, graisse: m.graisse || 900, italique: m.italique, taille: m.taille || 16, couleur: coul, genre: m.genre, inclinaison: m.inclinaison || 0,
          fond, largeur: 152, ...contrasteLettrage(coul, fond) };
        // une ligne ou deux ? (mesuré sur une ligne ; les noms longs, ou ceux qui le demandent, passent sur deux)
        const essai = lettrageHD(this, nom, { ...o, hauteur: 21, lignesMax: 1 });
        const deux = (m.deuxLignes && nom.length > 20) || essai.mise.deborde;
        const lignes = deux ? 2 : 1, E = etalNomHD(this, couleur, style, lignes);
        etals[0].setTexture(E.cle); if (etals[1]) etals[1].setTexture(E.cle).setCrop(0, 82 + E.ext - E.comptoir, 88, E.comptoir);   // (le comptoir, devant le marchand ; le tir à l'arc et la grande roue n'ont qu'une image)
        this.asseoirEtal(g, etals, E);
        // la bande du haut passe devant le marchand (le chapeau de Mère Sauge reste derrière le lambrequin)
        g.add(this.add.image(etals[0].x, etals[0].y, E.cle).setOrigin(0.5, 1).setScale(2).setCrop(0, 0, 88, E.rangs));
        const haut = etals[0].y - (82 + E.ext) * 2, yc = haut + (m.modele === 'poutre' ? E.toit : E.toit + 1) * 2 + E.hb + (m.modele === 'poutre' ? 0 : 0.5);
        g.bandeNom = [-88, haut, 88, haut + E.rangs * 2];
        g.attachesGuirlande = [[-86, haut + 6], [86, haut + 6]];   // (les coins de l'auvent, où l'on noue les guirlandes du jour de marché)   // (la bande du nom, dans le groupe : la bulle de Garrick la laisse libre)
        const im = poserLettrage(this, g, 0, yc, nom, { ...o, hauteur: E.hb * 2 - 3, lignesMax: lignes, coupe: deux });
        if (MARCHANDS[k]) this.nomsRelation.push({ im, k, couleur: coul });
        if (met) poserEnseignePendue(this, g, g.x < 900 || k === 'peche', met, haut + E.rangs * 2);
        continue;
      }
      if (k === 'encheres') {   // brodé d'or sur la bannière de velours du portique
        faits.add(k);
        g.list.filter(o => o.type === 'Text' && /ENCHÈRES/.test(o.text)).forEach(o => o.destroy());
        g.add(this.add.image(0, -138, banniereEncheresHD(this)).setOrigin(0.5, 0).setScale(2));
        g.attachesGuirlande = [[-56, -140], [56, -140]];   // (le haut des deux montants du portique)
        poserLettrage(this, g, 0, -126, nom, { police: 'Alegreya', graisse: 900, taille: 15, couleur: '#f0c850', fond: 0x7e2a20, genre: 'dore', largeur: 94, hauteur: 20, lignesMax: 1, ...contrasteLettrage('#f0c850', 0x7e2a20) });
        if (met) poserEnseignePendue(this, g, g.x < 900, met, -110, 64);
      } else if (k === 'jeux') {   // le coin des jeux : le nom peint, en or, sur le lambrequin violet de l'auvent
        const a = g.list.find(o => o.texture && o.texture.key === 'auventJeux'); if (!a) continue;
        faits.add(k);
        a.setTexture(auventJeuxNomHD(this));
        g.list.filter(o => o.type === 'Text' && /JEUX/.test(o.text)).forEach(o => o.destroy());
        poserLettrage(this, g, 0, a.y - 192 + (7 + 6.5) * 2, nom, { police: 'Pirata One', graisse: 400, taille: 19, couleur: '#f0c850', fond: 0x5a3a8a, genre: 'dore', largeur: 168, hauteur: 24, lignesMax: 1, ...contrasteLettrage('#f0c850', 0x5a3a8a) });
        if (met) poserEnseignePendue(this, g, g.x < 900, met, a.y - 192 + 24 * 2, 92);
      } else if (k === 'tableau') {   // le tableau d'affichage : le nom gravé sur la planche de bois clair, sous le toit
        const a = g.list.find(o => o.texture && o.texture.key === 'panneauAffichageHD'); if (!a) continue;
        faits.add(k);
        a.setTexture(tableauNomHD(this));
        if (this.exclamTableau) {   // (la pastille des nouvelles monte avec le toit, plus haut de 18 rangs)
          this.tweens.killTweensOf(this.exclamTableau); this.exclamTableau.y = -130 - 36;   // (-130 : où le groupe l'avait posé)
          this.tweens.add({ targets: this.exclamTableau, y: '-=10', duration: 420, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        }
        poserLettrage(this, g, 0, a.y - 152 + (13 + 8.5) * 2, nom, { police: 'Alegreya', graisse: 900, taille: 15, couleur: '#1e1006', fond: BOIS_CLAIR_NOM, genre: 'grave', largeur: 84, hauteur: 32, lignesMax: 2, coupe: true, ...contrasteLettrage('#1e1006', BOIS_CLAIR_NOM) });
      } else if (k === 'peche') {   // la cabane de Barnabé : le nom gravé sur la planche de rive, clouée au bord du toit
        const c = g.list.find(o => o.texture && /^cabane(Pecheur|Pilotis)HD/.test(o.texture.key)); if (!c) continue;
        faits.add(k);
        const yr = c.y - 192 + 23 * 2;
        g.add(this.add.image(0, yr, plancheRiveHD(this, 88, 12)).setOrigin(0.5, 0).setScale(2));
        poserLettrage(this, g, 0, yr + 12, nom, { police: 'Alegreya', graisse: 900, taille: 16, couleur: '#1e1006', fond: BOIS_CLAIR_NOM, genre: 'grave', largeur: 164, hauteur: 21, lignesMax: 1, ...contrasteLettrage('#1e1006', BOIS_CLAIR_NOM) });
        if (met) poserEnseignePendue(this, g, true, met, yr + 26, 96);
      } else if (k === 'crieur') {   // « Nouvelles du jour » : peint sur le devant de l'estrade
        faits.add(k);
        g.list.filter(o => o.type === 'Text' && /NOUVELLES/.test(o.text)).forEach(o => o.destroy());
        poserLettrage(this, g, 4, -20, 'NOUVELLES\nDU JOUR', { police: 'Alegreya', graisse: 900, taille: 12, couleur: '#f6e2a0', fond: 0x3a2414, genre: 'peint', largeur: 84, hauteur: 28, lignesMax: 2, ...contrasteLettrage('#f6e2a0', 0x3a2414) });
      }
    }
    // (le tir à l'arc et la grande roue : leurs textes de la rue, devenus inutiles, sont détruits aussi)
    for (const g of this.place.list) if (g.cle === 'jeux') g.list.filter(o => o.type === 'Text' && /TIR À L'ARC|LA GRANDE ROUE/.test(o.text)).forEach(o => o.destroy());
  },

  // (v1.63, retours du joueur : « le comptoir lévite ») Ce qui est posé sur l'étal touche ce qui le porte : le comptoir pose
  // son ombre sur le sol, chaque cagette la sienne sur le plateau, les sacs, paniers et tonneaux devant l'étal la leur sur
  // le sol ; le tapis passe sous le comptoir et s'étale devant lui (avant, il recouvrait le bas du comptoir).
  asseoirEtal(g, etals, E) {
    const pied = etals[0].y, ombre = (x, y, l, h, a) => this.add.image(x, y, ombrePlaceHD(this)).setScale(l / 64, h / 24).setAlpha(a);
    const tapis = g.list.find(o => o.texture && /^tapisEtalHD_/.test(o.texture.key));
    if (tapis) { tapis.setY(pied + tapis.displayHeight - 4); g.sendToBack(tapis); }
    const sol = [ombre(10, pied + 1, 196, 16, 0.95)];                                       // l'ombre du comptoir, portée vers le bas à droite
    const posees = g.list.filter(o => o.texture && o.originY === 1 && Math.abs(o.y - (pied + 8)) < 3 && /HD$/.test(o.texture.key) && !/^etal|^tapis|^corps/.test(o.texture.key));
    for (const o of posees) { o.setY(pied + 12); sol.push(ombre(o.x + 3, o.y - 1, o.displayWidth * 0.95, 9, 0.85)); }   // (sur le tapis, chacun avec son ombre)
    sol.forEach((o, i) => g.addAt(o, (tapis ? 1 : 0) + i));
    // le tir à l'arc et la grande roue n'ont qu'une image : le comptoir (plus bas) passe devant le sergent ou le Père Givrin
    if (!etals[1]) {
      const qui = g.list.filter(o => o.texture && /^corps/.test(o.texture.key)).pop(), H = 82 + E.ext;
      if (qui) g.addAt(this.add.image(etals[0].x, etals[0].y, E.cle).setOrigin(0.5, 1).setScale(2).setCrop(0, H - E.comptoir, 88, E.comptoir), g.getIndex(qui) + 1);
    }
    // les cagettes, sur le plateau : leur ombre, sous elles et sous ce qu'elles portent
    if (etals[1]) {
      const i0 = g.getIndex(etals[1]) + 1;
      g.list.filter(o => o.texture && o.texture.key === 'cagetteHD' && o.y < pied - 20).forEach((c, k) => g.addAt(ombre(c.x + 3, c.y - 1, c.displayWidth * 1.05, 6, 0.9), i0 + k));
    }
  },

  // La relation avec un marchand a changé (un achat, un cadeau, un refus) : son nom prend la nouvelle couleur
  majNomsPlace() {
    if (!this.place || !this.nomsRelation) return;
    for (const e of this.nomsRelation) {
      if (!e.im.active) continue;
      const c = couleurNom(this.G, MARCHANDS[e.k].nom, true);
      if (c !== e.couleur) { e.couleur = c; relettrer(this, e.im, { couleur: c }); }
    }
  },

  // (v1.64, retours du joueur) Les décorations du Givre, sur la place, pendant tout le Long Hiver (et pas seulement les jours
  // de fête) : une guirlande de sapin et de ruban rouge sur le haut de chaque auvent, ses boules et ses étoiles de paille, une
  // lanterne pendue au coin ; une couronne sur chaque porte ronde, une bougie sur chaque jardinière ; un sapin décoré là où
  // était la cabane de Barnabé. Rien ne passe devant un nom ni devant un étal.
  decorerGivrePlace(pal) {
    const place = this.place, C = COTEAUX_PLACE, E = C.echelle;
    creerHalo(this);
    const lueur = (x, y, prof, r = 0.32) => { const h = this.add.image(x, y, 'halo').setScale(r).setTint(0xffc060).setAlpha(0.32).setBlendMode(Phaser.BlendModes.ADD); h.yTri = prof; place.add(h);
      this.tweens.add({ targets: h, alpha: 0.18, scale: r * 0.86, duration: 260 + Math.random() * 240, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }); return h; };
    // 1. les auvents (les étals et le portique des enchères : là où se nouent aussi les fanions du jour de marché)
    for (const g of place.list) {
      if (!g.attachesGuirlande || !LIEUX_PLACE[g.cle]) continue;
      const [a, b] = g.attachesGuirlande, l = Math.round((b[0] - a[0]) / 2);
      g.add(this.add.image((a[0] + b[0]) / 2, a[1] - 9, guirlandeAuventHD(this, l)).setOrigin(0.5, 0).setScale(2));
      const lx = b[0] + 8, ly = a[1] - 2, lan = this.add.image(lx, ly, lanterneGivreHD(this)).setOrigin(0.5, 0).setScale(2); g.add(lan);
      this.tweens.add({ targets: lan, angle: { from: -2.5, to: 2.5 }, duration: 1800 + (g.x % 7) * 120, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });   // (elle se balance au vent)
      lueur(g.x + lx * g.scaleX, g.y + (ly + 18) * g.scaleY, g.y + 0.2, 0.28);
    }
    // 2. les portes rondes et leurs jardinières
    for (const [liste, base, enHaut] of [[C.hauts, C.terrasse, true], [C.bas, C.levre, false]]) for (const b of liste) {
      const Rp = reperesTrouCoteaux(b[2] === 74 ? 0 : 1), X = tx => b[0] + (tx - Rp.L / 2) * E, Y = ty => base + 6 * E - (Rp.H - ty) * E;
      const c = this.add.image(X(Rp.porte[0]), Y(Rp.porte[1]), couronneGivreHD(this)).setScale(E); c.yTri = base + 0.3; place.add(c);
      if (Rp.jardiniere) { const [jx, jy] = Rp.jardiniere, bx = X(jx + 4), by = Y(jy);
        const bg = this.add.image(bx, by, bougieGivreHD(this)).setOrigin(0.5, 1).setScale(E); bg.yTri = base + 0.3; place.add(bg);
        const fl = this.add.ellipse(bx, by - 8.5 * E, 2.6, 4.4, 0xffc040); fl.yTri = base + 0.31; place.add(fl);
        this.tweens.add({ targets: fl, scaleY: 0.75, scaleX: 1.15, duration: 180 + Math.random() * 160, yoyo: true, repeat: -1 });
        lueur(bx, by - 8.5 * E, base + 0.32, 0.22); }
    }
    // 3. le sapin décoré, à l'est, là où se tenait la cabane de Barnabé (s'il n'y a pas déjà celui de la fête)
    if (!this.sapinPlace) {
      const [sx, sy] = [1630, 900], s = grandSapin(this, sx, sy, 176);
      this.ombrePlace(sx + 10, sy, 130); s.g.yTri = sy; place.add(s.g); s.etoile.yTri = sy + 0.1; place.add(s.etoile);
      this.tweens.add({ targets: s.etoile, scale: 1.15, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      for (const [x, y] of s.lueurs.slice(0, 6)) lueur(x, y, sy + 0.2, 0.16);
      this.obstacles.push([sx - 26, sy - 16, sx + 26, sy + 2]); this.sapinPlace = s;
    }
  },

  // (v1.64) D'où l'on arrive sur la place (de l'étang : au bout de la route du Moulin)
  init(data) { this.depuisPlace = (data && data.depuis) || null; },

  // (v1.64) Prendre la route du Vieux Moulin : il se tourne vers l'est et y va à pied
  partirVersMoulin() {
    if (this.versMoulin || this.bloquePlace() || this.visiteEnCours()) return;
    this.cible = null; this.chemin = null; this.apresMarche = null; this.courir = false;
    this.versMoulin = { fondu: false };
  },

  // (v1.64, planche 89 v4 b, chantier 1) Le pied des Coteaux, au nord de la place : la pente et ses deux terrasses (dessinée
  // au-dessus de la place, dans la bande des y négatifs), les buttes et leurs portes rondes, des arbres et des buissons sur la
  // pente, le portique du chemin creux (son nom gravé sur la traverse), la barrière des marches qu'on refait, et la fumée
  // qui monte des cheminées
  poserCoteauxPlace(pal, saison) {
    const place = this.place, C = COTEAUX_PLACE, E = C.echelle, P = PLACE_MARCHE;
    const pente = this.add.image(0, -P.haut, penteCoteauxHD(this, pal)).setOrigin(0).setScale(2); pente.yTri = -1e6 + 1; place.add(pente);
    this.cheminees = [];
    const butte = (b, base, enHaut) => {
      const cle = trouCoteauxPlace(this, pal, b, enHaut), tex = this.textures.get(cle), src = tex.getSourceImage();
      const im = this.add.image(b[0], base + 6 * E, cle).setOrigin(0.5, 1).setScale(E); im.yTri = base; place.add(im);
      if (tex.cheminee) this.cheminees.push([b[0] + (tex.cheminee[0] - src.width / 2) * E, base + 6 * E - (src.height - tex.cheminee[1]) * E, base + 0.5]);
      return im;
    };
    C.hauts.forEach(b => butte(b, C.terrasse, true));
    C.bas.forEach((b, i) => butte(b, C.levre, false).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.allerVersLieu('porte' + i)));
    // des arbres et des buissons sur la pente, entre les buttes
    for (const [x, y, v] of [[255, 30, 1], [870, 20, 0]]) { this.ombrePlace(x + 10, y, 110); const cle = arbrePlaceHD(this, pal, v, x, y), a = this.add.image(x, y, cle).setOrigin(0.5, origineArbre(this, cle)).setScale(2.2); a.yTri = y; place.add(a); }
    for (const [x, y] of [[600, 166], [1480, 166], [1215, 40]]) { this.ombrePlace(x, y, 70); const cle = buissonPlaceHD(this, pal, x, y), b = this.add.image(x, y, cle).setOrigin(0.5, origineArbre(this, cle)).setScale(2.2); b.yTri = y; place.add(b); }
    // le portique du chemin creux, et la barrière en travers des premières marches
    const [e0, e1] = C.escalier, xm = (e0 + e1) / 2, yb = C.levre + 6, Q = PORTIQUE_COTEAUX, [tx, ty, tl, th] = Q.traverse;
    const bar = this.add.image(xm, C.levre - 6, barrierePlaceHD(this, 4)).setOrigin(0.5, 1).setScale(1.6); bar.yTri = C.levre - 6; place.add(bar);
    const por = this.add.image(xm, yb, portiqueCoteauxHD(this, saison)).setOrigin(0.5, 1).setScale(2).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.allerVersLieu('coteaux'));
    por.yTri = yb; place.add(por);
    poserLettrage(this, place, xm - Q.L + (tx + tl / 2) * 2, yb - Q.H * 2 + (ty + th / 2) * 2, this.nomLieuPlace('coteaux')[0], { police: 'Alegreya', graisse: 900, taille: 12, couleur: '#1e1006', fond: BOIS_CLAIR_NOM, genre: 'grave', largeur: tl * 2 - 6, hauteur: th * 2 - 4, lignesMax: 1, ...contrasteLettrage('#1e1006', BOIS_CLAIR_NOM) }).yTri = yb + 0.1;
    // la fumée des cheminées : des bouffées qui montent, s'élargissent, dérivent et s'effacent
    this.time.addEvent({ delay: 240, loop: true, callback: () => {
      if (!this.place || !this.cheminees.length || this.carteC || this.boutiqueC || this.vitrineOuverte) return;
      const [x, y, prof] = Phaser.Utils.Array.GetRandom(this.cheminees);
      const f = bouffeeFumee(this, x + (Math.random() - 0.5) * 3, y, { echelle: 1.5, monte: 80, vent: 26, duree: 3800, alpha: 0.78, conteneur: place, teinte: 0xe4e2e8 });
      f.yTri = prof;
    } });
  },

  // (v1.62, planche 80) La fontaine de loin (×2, comme le sol), ses deux pots, et son eau qui bouge comme de près : le
  // rideau de la vasque, les jets des lions, le petit jet du sommet, en gouttes qui tombent vraiment. Elle passe devant
  // qui est derrière le milieu du bassin, derrière qui est devant ; on bute sur le bassin rond, pas sur un rectangle.
  poserFontainePlace(x = 900, y = 662) {
    const F = FONTAINE_LOIN, E = 2, place = this.place, ox = x - F.cx * E, oy = y - F.H * E, X = v => ox + v * E, Y = v => oy + v * E;
    const sol = Y(F.sol), rx = F.ext.rx * E, ry = F.ext.ry * E;
    const ombre = this.add.image(x + 12, sol + 6, ombrePlaceHD(this)).setScale((rx * 2 + 30) / 64, (ry * 2 + 18) / 24); ombre.yTri = sol - 60; place.add(ombre);
    const im = this.add.image(x, y, fontaineLoinHD(this)).setOrigin(0.5, 1).setScale(E).setInteractive({ useHandCursor: true, pixelPerfect: false }).on('pointerdown', () => this.allerVersLieu('fontaine'));
    im.yTri = sol; place.add(im);
    for (const sens of [-1, 1]) {
      const px = x + sens * 150, p = this.add.image(px, y + 4, potFleursLoinHD(this)).setOrigin(0.5, 1).setScale(E).setFlipX(sens > 0); place.add(p);
      this.obstacles.push([px - 12, y - 10, px + 12, y + 4]);
    }
    // l'obstacle : le pied du bassin, en bandes de 8 px qui suivent l'ellipse
    for (let yb = sol - ry; yb < sol + ry; yb += 8) {
      const m = Math.max(Math.abs(yb - sol), Math.abs(yb + 8 - sol)) / ry, demi = (rx - 4) * Math.sqrt(Math.max(0, 1 - Math.min(1, m) ** 2)) + 6;
      this.obstacles.push([x - demi, yb - 1, x + demi, yb + 9]);   // (les bandes se chevauchent : pas de fente entre elles)
    }
    const gouttes = this.add.container(0, 0); gouttes.yTri = sol + 0.5; place.add(gouttes);
    const surface = Y(F.eauY + 2);
    const tomber = (gx, y0, y1, d) => { const g = this.add.circle(gx, y0, 1.3, 0xd8f4ff, 0.9); gouttes.add(g);
      this.tweens.add({ targets: g, y: y1, duration: d, ease: 'Quad.easeIn', onComplete: () => { g.destroy(); if (gouttes.active && Math.random() < 0.25) { const o = this.add.ellipse(gx, y1, 6, 2).setStrokeStyle(1, 0xe8fcff, 0.7); gouttes.add(o); this.tweens.add({ targets: o, scaleX: 2.4, scaleY: 1.8, alpha: 0, duration: 420, onComplete: () => o.destroy() }); } } }); };
    const ev = this.time.addEvent({ delay: 60, loop: true, callback: () => {
      if (!im.active) { ev.remove(); return; }
      if (this.carteC || this.boutiqueC || this.vitrineOuverte) return;   // (personne ne la regarde : elle coule sans qu'on la dessine)
      const cote = Math.random() < 0.5 ? -1 : 1;
      tomber(X(F.cx + cote * (F.vasqueRx - 1.5 - Math.random() * 2)), Y(F.vasqueY + 1), surface + (Math.random() - 0.3) * 10, 300 + Math.random() * 60);
      for (const sens of [-1, 1]) { const g = this.add.circle(X(F.cx + sens * 7.5), Y(F.lionY + 1), 1.3, 0xd8f4ff, 0.95); gouttes.add(g);
        this.tweens.add({ targets: g, x: g.x + sens * (16 + Math.random() * 4), duration: 300, ease: 'Linear' });
        this.tweens.add({ targets: g, y: surface - 2, duration: 300, ease: 'Quad.easeIn', onComplete: () => g.destroy() }); }
      if (Math.random() < 0.5) { const j = this.add.circle(X(F.cx), Y(F.sommetY - 4), 1.1, 0xe8fcff, 0.95); gouttes.add(j);
        this.tweens.add({ targets: j, x: j.x + (Math.random() - 0.5) * 18, duration: 520, ease: 'Linear' });
        this.tweens.add({ targets: j, y: Y(F.sommetY - 11), duration: 240, ease: 'Quad.easeOut', yoyo: true, onComplete: () => j.destroy() }); }
    } });
    // les reflets qui dansent sur l'eau du bassin
    for (let k = 0; k < 5; k++) { const r = this.add.ellipse(X(F.cx + (hachage(k, 1, 913) - 0.5) * F.eauRx * 1.3), Y(F.eauY + 2 + (hachage(k, 2, 914) - 0.5) * F.eauRy), 12, 2, 0xffffff, 0.5); gouttes.add(r);
      this.tweens.add({ targets: r, alpha: 0.05, scaleX: 1.6, duration: 900 + k * 170, yoyo: true, repeat: -1, delay: k * 140 }); }
    this.fontainePlace = { x, sol, eau: Y(F.eauY) };
    return this.fontainePlace;
  },

  // (v1.62, retours du joueur) La carte du monde : un panneau sur deux poteaux, la carte punaisée, et son nom, une seule
  // fois, sur l'écriteau posé en haut des poteaux. Un clic : la carte s'ouvre, comme avant.
  poserCartePlace(x, y) {
    const place = this.place, C = CARTE_PLACE, E = 2;
    const im = this.add.image(x, y, cartePlaceHD(this)).setOrigin(0.5, 1).setScale(E).setInteractive({ useHandCursor: true }).on('pointerdown', () => ouvrirCarteMonde(this));
    im.yTri = y; place.add(im);
    const [bx, by, bl, bh] = C.cadre, haut = y - C.H * E, carte = this.add.image(x - C.L + (bx + bl / 2) * E, haut + (by + bh / 2) * E, texCarteMonde(this)).setScale(E);
    carte.yTri = y + 0.05; place.add(carte);
    for (const sens of [-1, 1]) { const p = this.add.circle(carte.x + sens * 22, carte.y - 18, 2, 0xc82a20); p.yTri = y + 0.06; place.add(p); }   // (les punaises)
    // (v1.63, planche 80 v3) le nom, une seule fois : gravé sur une planche de bois clair posée sur le haut des poteaux
    const pl = this.add.image(x, haut + 2, plancheNomCarteHD(this)).setOrigin(0.5, 1).setScale(E); pl.yTri = y + 0.1; place.add(pl);
    poserLettrage(this, place, x, haut + 2 - 20 * E + 17, this.nomLieuPlace('carte')[0], { police: 'Alegreya', graisse: 900, taille: 14, couleur: '#1e1006', fond: BOIS_CLAIR_NOM, genre: 'grave', largeur: 66, hauteur: 30, lignesMax: 2, coupe: true, ...contrasteLettrage('#1e1006', BOIS_CLAIR_NOM) }).yTri = y + 0.2;
  },

  // (v1.62, retours du joueur) Le petit coin du mendiant, sur la place : un vieux tapis sous lui et Brisquet, sa sébile
  // devant lui, la gamelle sous le nez du chien, son baluchon derrière, une bougie dans un pot sur le tonneau
  coinMendiantPlace() {
    const place = this.place, g = place.list.find(o => o.cle === 'mendiant'); if (!g) return;
    const E = 2, enPlace = o => [g.x + o.x * g.scaleX, g.y + o.y * g.scaleY], [x, y] = LIEUX_PLACE.mendiant;
    const ajout = (o, prof) => { o.yTri = prof; place.add(o); return o; };
    ajout(this.add.image(x - 12, y + 2, tapisMendiantPlaceHD(this)).setOrigin(0.5, 0.75).setScale(E), 3);   // (à plat sur le sol, sous eux)
    // (sa sébile, il la tient dans ses mains ; la gamelle est devant le museau de Brisquet, le baluchon derrière lui)
    const chien = g.list.find(o => o.texture && /^chien/.test(o.texture.key)), [cx] = chien ? enPlace(chien) : [x - 40];
    const museau = cx + 22;   // (sa tête, tournée vers son maître)
    ajout(this.add.image(cx - 34, y - 4, baluchonHD(this, 12)).setOrigin(0.5, 1).setScale(E), y - 4);
    ajout(this.add.image(museau - 6, y + 11, gamelleHD(this, 7, 0.4)).setOrigin(0.5, 1).setScale(E), y + 11);
    // la bougie, sur le couvercle du tonneau de droite
    const t = g.list.find(o => o.texture && o.texture.key === 'tonneauxHD');
    if (t) {
      const [tx, ty] = enPlace(t), s = t.scaleX * g.scaleX, lx = tx + (18.5 - 18) * s, ly = ty - (22 - 4) * s + 1.5 * s;
      const pot = ajout(this.add.image(lx, ly, bougiePotHD(this, 4)).setOrigin(0.5, 1).setScale(E), y + 0.3);
      flammeBougie(this, place, lx, ly - pot.displayHeight + 1, 4, y + 0.31);
    }
  },

  // (v1.62, planche 80, système A validé) Le porche couvert, au bas de la place : deux poteaux de chêne, un petit toit de
  // tuiles, les battants ouverts ; le nom est sur le linteau. Seuls les poteaux (et les battants rabattus) bloquent.
  poserPorchePlace(X = 900, Y = 1040) {
    const place = this.place, Pm = PORCHE_MARCHE, E = 2, gauche = X - Pm.L;
    const ombre = this.add.image(X, Y + 2, ombrePlaceHD(this)).setScale(250 / 64, 30 / 24).setAlpha(0.8); ombre.yTri = Y - 60; place.add(ombre);
    const im = this.add.image(X, Y, porcheMarcheHD(this)).setOrigin(0.5, 1).setScale(E).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.allerVersLieu('arche'));
    im.yTri = Y; place.add(im);
    // (v1.63, planche 80 v3) « Vers la rue », doré, sur le linteau (plus d'écriteau pendu dessous)
    poserLettrage(this, place, X, Y - Pm.H * E + (Pm.linteau + Pm.hLinteau / 2) * E + 1, this.nomLieuPlace('arche')[0], { police: 'Alegreya', graisse: 900, taille: 16, couleur: '#f0c850', fond: 0x8a5a2b, genre: 'dore', largeur: 180, hauteur: 21, lignesMax: 1, ...contrasteLettrage('#f0c850', 0x8a5a2b) }).yTri = Y + 0.1;
    // les deux poteaux sur leurs socles, et le battant rabattu contre chacun
    const [p1, p2] = Pm.poteaux.map(c => gauche + c * E);
    this.obstacles.push([p1 - Pm.socle * E - 2, Y - 40, p1 + 34, Y], [p2 - 34, Y - 40, p2 + Pm.socle * E + 2, Y]);
  },

  // (v1.54, planche 62) Le jour de marché : des fanions, deux charrettes de colporteurs de passage, du monde, et Garrick
  // qui flâne entre les étals (un clic : ce qu'il en dit)
  jourDeMarchePlace() {
    // (v1.63, retours du joueur) les fanions sont tendus d'un étal à l'autre, au-dessus des enseignes : chaque corde est nouée
    // aux coins des auvents (au haut des montants, pour les enchères) et pend entre deux étals, sans passer devant aucun
    // nom, aucun marchand, aucune marchandise
    const rang = this.place.list.filter(g => g.attachesGuirlande && LIEUX_PLACE[g.cle] && LIEUX_PLACE[g.cle][1] < 400).sort((a, b) => a.x - b.x);
    for (let k = 0; k + 1 < rang.length; k++) {
      const A = rang[k], B = rang[k + 1], a = A.attachesGuirlande[1], b = B.attachesGuirlande[0];
      const c = this.add.container(0, 0); c.yTri = Math.min(A.y, B.y) - 1;   // (derrière qui passe devant les étals)
      guirlandeEntre(this, c, [A.x + a[0] * A.scaleX, A.y + a[1] * A.scaleY], [B.x + b[0] * B.scaleX, B.y + b[1] * B.scaleY], 10);
      this.place.add(c);
    }
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

  // (v1.61) Là où l'on a cliqué : un petit rond qui s'efface, pour voir où JeuneGoy s'en va
  marqueClic(x, y) {
    const r = this.add.ellipse(x, y, 34, 14).setStrokeStyle(2, 0xffe6a0, 0.9); r.yTri = y - 1; this.place.add(r);
    this.tweens.add({ targets: r, scaleX: 0.4, scaleY: 0.4, alpha: 0, duration: 450, onComplete: () => r.destroy() });
  },

  // (v1.61) Les passants ont une petite vie : ils vont faire leurs courses à un étal (et s'y arrêtent, face à lui),
  // s'arrêtent pour bavarder entre eux, flânent, ou quittent la place par l'arche et reviennent plus tard. Ils suivent
  // de vrais chemins (la même recherche que JeuneGoy) : plus de passant coincé contre un étal ni qui traverse un buisson.
  ajouterPassantPlace(i, race, figurant = null) {
    const quoi = figurant || { nom: 'Flâneur ' + i, race, feminin: i % 2 === 1, niveau: 'novice' };
    const pts = Object.keys(LIEUX_PLACE).filter(k => k !== 'arche').map(k => this.devantLieu(k));
    const [x, y] = pts[(i * 3 + this.G.jour) % pts.length];
    const cle = corpsHD(this, quoi, null, 'face');
    const img = this.add.image(x + 30, y + 10, cle).setOrigin(0.5, 1).setScale(PLACE_MARCHE.echelle * echelleCorps(cle)).setInteractive({ useHandCursor: true });
    const o = { img, quoi, vue: 'face', cible: null, chemin: [], but: null, pause: 600 + i * 900, pas: 0, ombre: this.ombrePlace(x + 30, y + 10, 40) };
    img.on('pointerdown', () => this.passantPlaceParle(o));
    this.place.add(img);
    this.passantsPlace.push(o);
  },

  // Où aller ensuite
  envieDePassant(o) {
    const P = PLACE_MARCHE, r = Math.random();
    const vers = (x, y, but, librement = false) => {
      // (v1.61) on ne s'arrête pas sur JeuneGoy : s'il est déjà là, on se pose un peu à côté
      if (!librement && this.heros && Math.hypot(x - this.heros.x, y - this.heros.y) < 60) x += (x < this.heros.x ? -1 : 1) * 70;
      const pts = librement ? [[x, y]] : this.itineraire(o.img.x, o.img.y, x, y);
      o.cible = pts.shift(); o.chemin = pts; o.but = but; o.meilleur = { d: 1e9, t: this.time.now };
    };
    if (o.sorti) {   // de retour sur la place, par l'arche
      o.sorti = false; o.img.setVisible(true); o.ombre.setVisible(true);
      const [ax, ay] = this.devantLieu('arche'); o.img.setPosition(ax + Phaser.Math.Between(-24, 24), P.H + 60);
      return vers(o.img.x, ay, { type: 'entree' }, true);
    }
    const etals = Object.keys(LIEUX_PLACE).filter(k => this.actionsLieux[k] && !['arche', 'moulin', 'carte', 'mendiant'].includes(k));
    if (r < 0.5 && etals.length) {
      const k = Phaser.Utils.Array.GetRandom(etals), [x, y] = this.devantLieu(k);
      return vers(x + Phaser.Math.Between(-34, 34), y + Phaser.Math.Between(0, 10), { type: 'etal', k });
    }
    if (r < 0.7) {   // bavarder avec quelqu'un qui ne fait rien de spécial
      const libres = this.passantsPlace.filter(q => q !== o && !q.sorti && !q.parle && !q.attend && q.pause > 0 && Math.hypot(q.img.x - o.img.x, q.img.y - o.img.y) < 700);
      if (libres.length) {
        const q = Phaser.Utils.Array.GetRandom(libres); q.attend = o; q.pause = 20000;
        const cote = q.img.x > o.img.x ? -46 : 46;
        return vers(q.img.x + cote, q.img.y, { type: 'causer', q });
      }
    }
    if (r < 0.9 || o.quoi === 'mentor') {   // flâner (Garrick ne quitte jamais la place)
      const pts = Object.keys(LIEUX_PLACE).filter(k => !['arche', 'mendiant'].includes(k)).map(k => this.devantLieu(k));   // (on ne flâne pas sous le nez du mendiant)
      const [x, y] = Phaser.Utils.Array.GetRandom(pts);
      return vers(x + Phaser.Math.Between(-80, 80), y + Phaser.Math.Between(4, 40), { type: 'flaner' });
    }
    const [ax, ay] = this.devantLieu('arche');
    return vers(ax + Phaser.Math.Between(-20, 20), ay, { type: 'sortir' });
  },

  // Arrivé là où il voulait
  arriveePassant(o) {
    const but = o.but || {}; o.but = null; o.cible = null; o.chemin = [];
    const tourner = vue => { o.vue = vue; o.img.setTexture(corpsHD(this, o.quoi, null, vue)).setFlipX(false); };
    if (but.type === 'etal') { tourner('dos'); o.pause = Phaser.Math.Between(3000, 8000); return; }
    if (but.type === 'causer') {
      const q = but.q;
      if (!q || !q.img.active || q.attend !== o || q.sorti) { if (q && q.attend === o) { q.attend = null; q.pause = 800; } tourner('face'); o.pause = 1500; return; }
      q.attend = null;
      const gauche = o.img.x < q.img.x;
      for (const [a, versDroite] of [[o, gauche], [q, !gauche]]) { a.vue = 'profil'; a.img.setTexture(corpsHD(this, a.quoi, null, 'profil')).setFlipX(!versDroite); a.parle = true; a.cible = null; a.chemin = []; }
      const [l1, l2] = (typeof causerieChanson === 'function' && causerieChanson(this.G)) || Phaser.Utils.Array.GetRandom(CAUSERIES_PLACE);   // (v1.63) la chanson de la barde, fredonnée au marché
      this.bulleCourte(o, l1);
      this.time.delayedCall(2300, () => q.img.active && this.bulleCourte(q, l2));
      this.time.delayedCall(5200, () => { for (const a of [o, q]) { a.parle = false; a.pause = Phaser.Math.Between(600, 2200); } });
      o.pause = 99999; q.pause = 99999;
      return;
    }
    if (but.type === 'sortir') {   // il passe sous l'arche et quitte la place
      o.cible = [o.img.x, PLACE_MARCHE.H + 70]; o.chemin = []; o.but = { type: 'dehors' }; o.librement = true;
      return;
    }
    if (but.type === 'dehors') { o.sorti = true; o.librement = false; o.img.setVisible(false); o.ombre.setVisible(false); o.pause = Phaser.Math.Between(5000, 14000); return; }
    if (but.type === 'entree') o.librement = false;
    tourner('face'); o.pause = Phaser.Math.Between(1500, 5000);
  },

  // Une petite bulle qui suit un passant (sans voix : on les entend sans les écouter)
  bulleCourte(o, texte) {
    if (o.bulle && o.bulle.active) o.bulle.destroy();
    const b = o.bulle = this.add.text(o.img.x, o.img.y - o.img.displayHeight - 8, texte, style(11, '#3b2410', { fontStyle: 'italic', backgroundColor: '#f3e6c8', padding: { x: 7, y: 4 }, wordWrap: { width: 200 }, align: 'center' })).setOrigin(0.5, 1).setScale(0);
    b.yTri = 1e6 + 2; this.place.add(b);
    this.tweens.add({ targets: b, scale: 1 / this.place.scaleX, duration: 160, ease: 'Back.easeOut' });
    this.time.delayedCall(2600, () => b.active && this.tweens.add({ targets: b, alpha: 0, duration: 250, onComplete: () => b.destroy() }));
  },

  passantPlaceParle(o) {
    if ((o.bulle && o.bulle.active) || o.parle || o.sorti) return;
    if (o.attend) { o.attend = null; }
    o.pause = 4200; o.cible = null; o.chemin = []; o.but = null;
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

  // (v1.64) Le sol de la place à cet endroit : les dalles du centre (la pierre), la terre battue sous les étals et sur
  // les chemins d'usure, l'herbe ailleurs ; la neige au Givre
  solSousLesPieds(x, y) {
    if (typeof saisonDe === 'function' && saisonDe(this.G) === 'givre') return 'neige';
    if (typeof planSolPlace !== 'function') return 'herbe';
    const plan = this.planSolSons || (this.planSolSons = planSolPlace()), px = x / 2, py = y / 2, [cx, cy] = plan.centre;
    if (Math.hypot(px - cx, (py - cy) * 1.55) < plan.rDalles - 12) return 'pierre';
    return typeof estTerrePlace === 'function' && estTerrePlace(plan, px, py) ? 'terre' : 'herbe';
  },
  bloqueParObstacle(x, y) { return this.obstacles.some(([x0, y0, x1, y1]) => x > x0 && x < x1 && y > y0 && y < y1); },

  // (v1.49) Un itinéraire : une recherche sur une grille de 20 px (les étals, la fontaine, les troncs bloquent), puis on
  // lisse le chemin en ne gardant que les tournants nécessaires. Une cible inaccessible : la case libre la plus proche.
  libreEntre(x0, y0, x1, y1) {
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 3);   // (v1.61 : tous les 3 px, pour ne plus couper les coins)
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
    if (Math.hypot(this.heros.x - x, this.heros.y - y) < 40) return this.time.delayedCall(0, () => this.agirLieu(cle));   // (v1.61 : sinon le clic de la scène refermait aussitôt le panneau)
    this.partirVers(x, y, cle, courir || Math.hypot(this.heros.x - x, this.heros.y - y) > 600);
  },

  agirLieu(cle) {
    this.cible = null; this.chemin = null; this.apresMarche = null;
    this.vueHeros = cle === 'arche' ? 'face' : 'dos'; this.poserHeros(0);
    const a = this.actionsLieux[cle];
    if (a) { Son.jouer('clic'); a(); }
  },

  poserHeros(pas) {
    // (planche 85) quand il descend vers nous, la vraie vue de face ('deFace' : 'face' est, pour le joueur, son image de
    // trois-quarts) ; et dès qu'elles sont prêtes, les huit images de la marche, 70 ms chacune (45 quand il court). Il
    // marche quand son compteur de pas a avancé depuis la dernière image (sinon, c'est qu'il vient de s'arrêter).
    const vue = this.vueHeros === 'face' ? 'deFace' : this.vueHeros;
    const base = textureJoueur(this, this.G, vue);
    // (les autres vues se préparent en tâche de fond, une par une : au premier virage, il a déjà ses images)
    const st = stadeJoueur(this.G);
    for (const [i, v] of ['deFace', 'profil'].entries()) if (!this.textures.exists(`joueur_${st}_${v}`) && !(this.vuesEnCours || (this.vuesEnCours = {}))[v]) {
      this.vuesEnCours[v] = true;
      setTimeout(() => { if (this.vuesEnCours) this.vuesEnCours[v] = false; if (this.sys.isActive() && !this.textures.exists(`joueur_${st}_${v}`)) textureJoueur(this, this.G, v); }, 600 + i * 500);
    }
    const enMarche = this.pasHeros > 0 && this.pasVuHeros !== this.pasHeros;
    this.pasVuHeros = this.pasHeros;
    let k = pas ? base + '_pas' + pas : base;
    if (enMarche && marcheJoueurPrete(this, base)) k = base + '_m' + (Math.floor(this.pasHeros / (this.courir ? 45 : MARCHE_HD.duree)) % MARCHE_HD.images);
    this.heros.setTexture(this.textures.exists(k) ? k : base).setFlipX(this.vueHeros === 'profil' && this.versGauche);
  },

  // Le cadre : la place suit JeuneGoy ; panneau ouvert, on recule un peu pour voir le lieu au-dessus du panneau
  cadrerPlace(instantane = false, cle = null) {
    const P = PLACE_MARCHE, place = this.place;
    // (v1.62) au départ de la visite de Garrick (et pendant la question), on cadre un peu plus bas : rien d'écrit ne reste à
    // moitié sous le titre, ni sous la barre de la visite (v1.63 : le mendiant n'a plus d'écriteau, mais la planche de la carte
    // du monde et le crieur passeraient dessous avec le cadre ordinaire)
    const depart = this.visite && !this.visite.fini && this.visite.i < 0;
    let z = P.zoom, fx = this.heros.x, fy = this.heros.y - (depart ? -12 : 40), sy = 270;
    if (cle) { z = PETITS_LIEUX.includes(cle) ? P.zoom * 1.2 : P.zoomPanneau; [fx, fy] = LIEUX_PLACE[cle]; sy = PETITS_LIEUX.includes(cle) ? 262 : 250; }
    // (v1.61) lieu ouvert : le bas de la place peut monter derrière le cadre, pour que le mendiant (tout en bas) reste visible
    const x = Phaser.Math.Clamp(480 - fx * z, 960 - P.L * z, 0), y = Phaser.Math.Clamp(sy - fy * z, (cle ? 300 : 478) - P.H * z, (P.haut || 0) * z);   // (v1.64 : en haut de la place, on voit monter les Coteaux)
    if (cle) this.placerBoutonsPlace(x, y, z);   // (les boutons « La place » et « Ma liste » laissent libre le nom du lieu)
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
    if (this.placerBoutonsPlace) this.placerBoutonsPlace();
  },

  // --- La carte de la place (M) : tout d'un coup d'œil ; un clic sur un nom, et JeuneGoy y court ---
  basculerCartePlace() {
    if (!this.place) return;
    if (this.carteC) { this.carteC.destroy(); this.carteC = null; return; }
    if (this.bloquePlace()) return;
    const P = PLACE_MARCHE, Hc = P.H + (P.haut || 0), z = Math.min(940 / P.L, 404 / Hc), ox = (960 - P.L * z) / 2, oy = 70 + (P.haut || 0) * z;   // (v1.64 : les Coteaux au-dessus)
    this.tweens.killTweensOf(this.place);
    this.place.setScale(z).setPosition(ox, oy);
    const c = this.carteC = this.add.container(0, 0).setDepth(30);
    c.add(this.add.rectangle(480, 34, 960, 68, 0x1a120a, 0.92));
    c.add(this.add.text(480, 50, 'La place des Mastres · clique sur un lieu pour y aller · M ou Échap : refermer', style(14, '#f3d98a', { fontStyle: 'bold' })).setOrigin(0.5));
    for (const cle of Object.keys(LIEUX_PLACE)) {
      if (!this.actionsLieux[cle] || /^porte\d/.test(cle)) continue;   // (les portes rondes n'ont pas de nom sur la carte)
      const [x, y] = LIEUX_PLACE[cle], [n] = this.nomLieuPlace(cle), dy = { arche: -100, mendiant: -10, carte: 6, moulin: 34, coteaux: -150 }[cle] || 0;
      const t = this.add.text(ox + Math.min(x, P.L - 80) * z, oy + (y + dy) * z + 4, n, style(11, '#fff4dc', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 4, align: 'center', wordWrap: { width: 110 } })).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
      t.on('pointerover', () => t.setColor('#ffe066')).on('pointerout', () => t.setColor('#fff4dc'));
      t.on('pointerdown', () => { this.basculerCartePlace(); this.allerVersLieu(cle, true); });
      c.add(t);
    }
    const moi = this.add.text(ox + this.heros.x * z, oy + this.heros.y * z + 2, 'Toi', style(12, '#ffe066', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 4 })).setOrigin(0.5, 0);
    c.add(moi); this.tweens.add({ targets: moi, alpha: 0.4, duration: 500, yoyo: true, repeat: -1 });
    c.once('destroy', () => this.cadrerPlace(true));
  },

  // --- Chaque image : JeuneGoy qui marche, les passants qui flânent, le cadre qui suit, l'ordre de profondeur ---
  update(temps, dt) {
    if (!this.place || !this.heros || !this.heros.active) return;
    dt = Math.min(dt, 50);
    const P = PLACE_MARCHE, h = this.heros;
    let dx = 0, dy = 0;
    // (v1.64) en route pour le Vieux Moulin : il marche jusqu'au bout de la route et passe de l'autre côté (à pied, ses pas)
    if (this.versMoulin) {
      const v = this.versMoulin, yRoute = 764;
      h.x += P.vitesse * dt; h.y += Phaser.Math.Clamp(yRoute - h.y, -0.2 * dt, 0.2 * dt);
      this.vueHeros = 'profil'; this.versGauche = false; this.pasHeros += dt;
      const f = Math.floor(this.pasHeros / 125) % 4; this.poserHeros(f === 1 ? 1 : f === 3 ? 2 : 0);
      this.ombreHeros.setPosition(h.x + 2, h.y - 2); this.ombreHeros.yTri = h.y - 0.5;
      if (h.x > P.L - 20 && !v.fondu) { v.fondu = true; Sauvegarde.maintenant(this.G, 'Marche'); this.cameras.main.fadeOut(450); this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Etang', { depuis: 'place' })); }
      for (const o of this.place.list) o.yTriPlace = o.yTri !== undefined ? o.yTri : o.y;
      this.place.sort('yTriPlace'); this.invitePlace.setVisible(false);
      return;
    }
    if (!this.bloquePlace()) {
      const t = this.touches, z = this.zqsd;
      const bas = k => !!(k && k.isDown);
      const gauche = bas(t && t.left) || bas(z && z.Q) || bas(z && z.A), droite = bas(t && t.right) || bas(z && z.D);
      const haut = bas(t && t.up) || bas(z && z.Z) || bas(z && z.W), basT = bas(t && t.down) || bas(z && z.S);
      if (gauche || droite || haut || basT) {
        this.cible = null; this.chemin = null; this.apresMarche = null; this.courir = false; this.mainJoueur = this.time.now;
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
      // (v1.64) ses pas sur la place, selon le sol sous ses pieds (un pas à chaque talon posé)
      if ((f === 1 || f === 3) && f !== this.dernierPasHeros && typeof jouerPas === 'function') jouerPas(this.solSousLesPieds(h.x, h.y), 0.5);
      this.dernierPasHeros = f;
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
    // les passants (v1.61 : ils suivent leur chemin, pas à pas, et vivent leur petite vie)
    for (const o of this.passantsPlace) {
      if (o.bulle && o.bulle.active) o.bulle.setPosition(o.img.x, o.img.y - o.img.displayHeight - 8);
      if (o.attend && !(o.attend.but && o.attend.but.q === o)) { o.attend = null; o.pause = Math.min(o.pause, 600); }   // (celui qu'il attendait a changé d'avis : il ne reste pas figé 20 s)
      if (o.parle || o.attend) continue;
      if (o.pause > 0) { o.pause -= dt; if (o.pause <= 0) this.envieDePassant(o); continue; }
      if (!o.cible) { o.pause = 1200; continue; }
      const rx = o.cible[0] - o.img.x, ry = o.cible[1] - o.img.y, d = Math.hypot(rx, ry), v = 0.07 * dt;
      if (d < v + 1) {
        o.img.setPosition(o.cible[0], o.cible[1]);
        if (o.chemin && o.chemin.length) { o.cible = o.chemin.shift(); o.meilleur = { d: 1e9, t: this.time.now }; }
        else { this.arriveePassant(o); if (!o.cible) o.img.setTexture(corpsHD(this, o.quoi, null, o.vue)); }
        o.ombre.setPosition(o.img.x + 2, o.img.y - 2); o.ombre.yTri = o.img.y - 0.5;
        continue;
      }
      const nx = o.img.x + rx / d * v, ny = o.img.y + ry / d * v;
      // (son chemin contourne déjà les étals, la fontaine, les buissons : il le suit sans s'arrêter au moindre coin frôlé)
      // (et s'il n'avance plus depuis deux secondes, il renonce et fait autre chose)
      if (!o.meilleur || d < o.meilleur.d - 1) o.meilleur = { d, t: this.time.now };
      else if (this.time.now - o.meilleur.t > 2000) { o.cible = null; o.chemin = []; if (o.but && o.but.q && o.but.q.attend === o) { o.but.q.attend = null; o.but.q.pause = 600; } o.but = null; o.pause = 900; continue; }
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
    if (this.visite) this.majVisite(dt);
    if (temps - (this.derniereMajNoms || 0) > 500) { this.derniereMajNoms = temps; this.majNomsPlace(); }   // (une relation qui change change la couleur du nom)
    const montrer = proche && !this.bloquePlace() && !this.visiteEnCours() && !(this.banniereVisite && this.banniereVisite.active)
      && !(this.texteMessage && this.texteMessage.active && this.texteMessage.alpha > 0.05 && this.texteMessage.depth === 45);   // (v1.64 : la bulle d'un lieu ne se pose plus sur l'invite)
    this.invitePlace.setVisible(!!montrer);
    if (montrer) { const [n, m] = this.nomLieuPlace(proche); this.invitePlace.setText(`${n}${m ? ' · ' + m : ''}   —   E ou clic : ${MARCHANDS[proche] ? 'faire tes courses' : proche === 'arche' ? 'rentrer' : proche === 'tableau' ? 'lire' : PETITS_LIEUX.includes(proche) ? 'parler' : proche === 'coteaux' || /^porte\d/.test(proche) ? 'regarder' : proche === 'moulin' ? 'y aller' : 'approcher'}`); }
    if (!this.carteC && !this.panneauOuvert) this.cadrerPlace();
    for (const o of this.place.list) o.yTriPlace = o.yTri !== undefined ? o.yTri : o.y;
    this.place.sort('yTriPlace');
  },

  // --- (v1.62, planche 88 validée) La visite du marché avec Garrick, le premier matin ---
  // Garrick est un passant qu'on pilote : il marche vraiment (ses images de pas, ses traces), d'étal en étal, par les
  // chemins de la place ; JeuneGoy le suit à deux pas. Si le joueur reprend la main, Garrick l'attend et l'appelle.
  // Espace (ou « La suite ») : la réplique suivante ; « Étal suivant ▶ » saute un marchand ; « ◀ Revenir » le ramène à
  // l'étal d'avant ; « Passer la visite » ou Échap : il s'en va. À la fin, il repart par le porche, à pied.
  visiteEnCours() { return !!(this.visite && !this.visite.fini); },

  //   opts.reprendre : l'étape où l'on s'était arrêté (Garrick demande s'il faut reprendre) ; opts.revoir : refaite depuis le menu ☰
  visiteGarrick(opts = {}) {
    if (!this.place || this.visite) return;
    const P = PLACE_MARCHE, h = this.heros;
    // (un jour de marché, Garrick flânait déjà parmi les passants : c'est lui qui fait la visite, il n'y en a qu'un)
    this.passantsPlace = this.passantsPlace.filter(o => { if (o.quoi !== 'mentor') return true; o.img.destroy(); o.ombre.destroy(); if (o.bulle) o.bulle.destroy(); return false; });
    const cle = corpsHD(this, 'mentor', null, 'face');
    const gar = this.add.image(h.x + 70, h.y + 4, cle).setOrigin(0.5, 1).setScale(P.echelle * echelleCorps(cle)).setInteractive({ useHandCursor: true });
    this.place.add(gar);
    const v = this.visite = { i: -1, phase: 'parle', gar, ombre: this.ombrePlace(gar.x, gar.y, 40), vue: 'face', versGauche: false, pas: 0, chemin: [], cible: null, but: null,
      suivre: true, attend: false, appel: 0, debutJambe: this.time.now, bulle: null, barre: null, cleBarre: '', etapes: null, trace: this.add.graphics(), traceT: 0,
      pasG: [gar.x, gar.y, 0, 1], pasH: [h.x, h.y, 0, 1], fini: false, encheres: false, question: opts.reprendre >= 0 ? opts.reprendre : null };
    v.trace.yTri = 2; this.place.add(v.trace);
    gar.on('pointerdown', () => { if (this.visite === v && v.phase === 'parle' && !v.fini && !this.bloquePlace()) this.suiteVisite(); });
    this.vueHeros = 'profil'; this.versGauche = false; this.poserHeros(0);   // (JeuneGoy se tourne vers lui)
    if (this.boutonCommandes) this.boutonCommandes.setVisible(false);   // (le temps de la visite, ses étapes prennent le haut de l'écran)
    if (typeof retenirVignettes === 'function') { retenirVignettes(true, this); this.events.once('shutdown', () => retenirVignettes(false)); }   // (les vignettes attendent la fin de la visite)
    const nm = this.nouvellesMatin;
    if (nm && nm.active && nm.alpha > 0) { this.tweens.killTweensOf(nm); this.tweens.add({ targets: nm, alpha: 0, delay: 1200, duration: 400 }); nm.setY(Math.max(nm.y, 88)); }   // (les nouvelles du matin, sous les étapes, puis elles s'effacent)
    this.etapesVisite(); this.barreVisite(true);
    if (v.question !== null) this.direVisite(VISITE_MARCHE.question(VISITE_MARCHE.etapes[v.question].nom));
    else this.direVisite(opts.revoir ? VISITE_MARCHE.revoir : VISITE_MARCHE.depart);
  },
  // (v1.62) La visite interrompue : on la reprend là où on en était, ou on l'ignore
  reprendreVisite() {
    const v = this.visite; if (!v || v.question === null) return;
    const i = v.question; v.question = null;
    this.allerEtapeVisite(i);
    this.bulleSur(v.gar, `« ${VISITE_MARCHE.reprise(VISITE_MARCHE.etapes[i].nom)} »`, { nom: 'Garrick', race: 'humain' });
  },
  ignorerVisite() { const v = this.visite; if (!v || v.question === null) return; v.question = null; this.partirVisite('ignore'); },
  // Le marchand répond à Garrick, d'une petite bulle au-dessus de sa tête, pendant qu'on repart
  reponseMarchand(k, texte) {
    const g = this.place.list.find(o => o.cle === k), m = g && g.list.find(o => o.texture && o.texture.key.startsWith('corps_'));
    if (!m || !MARCHANDS[k]) return;
    const nom = MARCHANDS[k].nom, cible = { x: g.x + m.x * g.scaleX, y: g.y + (m.y - m.displayHeight) * g.scaleY + 4, displayHeight: 0 };
    this.bulleSur(cible, `« ${texte.replaceAll('{J}', eJ(this.G))} »`, { nom, race: MARCHANDS[k].race, feminin: /Mère|Hilda|Rosalie/.test(nom) });
    this.visite.reponse = cible;
    // (pas de place au-dessus de sa tête, sous les étapes de la visite : la bulle se met à côté de lui)
    const b = cible.bulle, z = this.place.scaleX;
    if (b && this.place.y + cible.y * z - 8 - b.height < 100) {
      // à sa droite, sauf si elle passerait sous les boutons de la place ou hors de l'écran : alors à sa gauche
      const xd = this.place.x + (cible.x + 24) * z, yd = this.place.y + (cible.y + 24) * z;
      const aGauche = xd + b.width > 952 || (xd + b.width > 806 && yd - b.height / 2 < 172);
      b.setOrigin(aGauche ? 1 : 0, 0.5).setPosition(cible.x + (aGauche ? -24 : 24), cible.y + 24);
    }
  },
  // Les touches de la visite (appelée par la place, avant ses propres touches) : vrai si la touche a servi
  toucheVisite(e) {
    if (e.repeat) return false;
    const v = this.visite;
    if (v.question !== null) { if (e.key === ' ' || e.key === 'Enter') { this.reprendreVisite(); return true; } if (e.key === 'Escape') { this.ignorerVisite(); return true; } return false; }
    if (e.key === ' ' || e.key === 'Enter') { if (v.phase === 'parle') this.suiteVisite(); return true; }
    if (e.key === 'Escape') { this.passerVisite(); return true; }
    return false;
  },

  suiteVisite() {
    const v = this.visite; if (!v || v.fini || v.phase !== 'parle') return;
    if (v.question !== null) return this.reprendreVisite();
    const et = VISITE_MARCHE.etapes[v.i];
    if (et && et.reponse) this.reponseMarchand(et.lieu, et.reponse);   // (le marchand lui répond, et on repart)
    if (v.i < VISITE_MARCHE.etapes.length - 1) this.allerEtapeVisite(v.i + 1); else this.partirVisite(false);
  },
  etalSuivantVisite() { const v = this.visite; if (v && !v.fini && v.question === null && v.i < VISITE_MARCHE.etapes.length - 1) this.allerEtapeVisite(v.i + 1); },
  revenirVisite() { const v = this.visite; if (v && !v.fini && v.question === null && v.i > 0) this.allerEtapeVisite(v.i - 1); },
  passerVisite() { if (this.visiteEnCours()) this.partirVisite(true); },

  // Où Garrick se tient pour présenter l'étape j : à côté de l'étal, un peu devant, du côté opposé à celui d'où l'on
  // arrive (JeuneGoy, qui le suit, s'arrête devant l'étal sans lui passer au travers)
  placeGarrickVisite(j, depuisX) {
    const k = VISITE_MARCHE.etapes[j].lieu;
    if (k === 'fontaine') return [depuisX > 900 ? 810 : 990, 712];
    const [x, y] = LIEUX_PLACE[k], cote = depuisX > x ? -1 : 1;
    return [x + cote * 72, Math.min(PLACE_MARCHE.H - 8, y + 44)];
  },
  allerEtapeVisite(j) {
    const v = this.visite, g = v.gar;
    v.i = Phaser.Math.Clamp(j, 0, VISITE_MARCHE.etapes.length - 1);
    v.phase = 'marche'; v.attend = false; v.suivre = true; v.debutJambe = this.time.now; v.versSpot = false; v.tourne = false;
    if (v.bulle) { v.bulle.destroy(); v.bulle = null; }
    v.but = this.placeGarrickVisite(v.i, g.x);
    v.chemin = this.itineraire(g.x, g.y, v.but[0], v.but[1]); v.cible = v.chemin.shift() || null;
    if (!v.cible) v.cible = v.but;
    // (entre Hilda et Mère Sauge, on passe devant les enchères : il en dit un mot)
    v.encheres = VISITE_MARCHE.etapes[v.i].lieu === 'apothicaire' && !v.encheresDit;
    this.G.visiteMarche = { i: v.i };   // (si l'on quitte la place en chemin, Garrick proposera de reprendre ici)
    this.etapesVisite(); this.barreVisite();
    this.cheminVisite();
  },

  // Il arrive : il se tourne vers toi et présente le marchand ; JeuneGoy vient se poser devant l'étal
  arriveeGarrick() {
    const v = this.visite, g = v.gar;
    if (v.phase === 'depart') {
      if (!v.sortie) { v.sortie = true; v.cible = [g.x, PLACE_MARCHE.H + 56]; return; }   // (il passe sous le porche, et s'en va vers la rue)
      [g, v.ombre, v.trace].forEach(o => o && o.destroy()); if (g.bulle) g.bulle.destroy();
      this.visite = null;
      return;
    }
    v.phase = 'parle'; v.vue = 'face'; v.pas = 0; this.poserGarrick(0);
    v.trace.clear();
    this.direVisite(VISITE_MARCHE.etapes[v.i].texte);
    this.barreVisite();
  },

  // La fin : il repart par le porche, à pied ; la place est au joueur (mode : false, la visite finie ; true, passée ;
  // 'ignore' : la reprise refusée)
  partirVisite(mode) {
    const v = this.visite, G = this.G, g = v.gar, presse = mode === true, ignore = mode === 'ignore';
    v.fini = true; v.phase = 'depart'; v.attend = false; v.sortie = false;
    for (const o of [v.bulle, v.barre, v.etapes]) if (o) o.destroy();
    v.bulle = v.barre = null; v.trace.clear();
    G.tutoVu = G.tutoVu || {}; G.tutoVu.marche = true; G.tutoVu.place = true; G.tuto = false;   // (une seule fois : la place est expliquée)
    delete G.visiteMarche; delete G.revoirVisite;
    if (typeof retenirVignettes === 'function') retenirVignettes(false, this);
    if (presse || ignore) this.bulleSur(g, `« ${(ignore ? VISITE_MARCHE.ignore : VISITE_MARCHE.presse).replaceAll('{J}', eJ(G))} »`, { nom: 'Garrick', race: 'humain' });
    const [ax, ay] = this.devantLieu('arche');
    v.chemin = this.itineraire(g.x, g.y, ax, ay); v.cible = v.chemin.shift() || [ax, ay];
    v.depuis = this.time.now + (presse || ignore ? 700 : 300);   // (il finit sa phrase, puis se met en route)
    if (ignore) { if (this.boutonCommandes && this.boutonCommandes.active) this.majBoutonCommandes(); return; }
    v.etapes = presse ? null : this.etapesVisite(VISITE_MARCHE.etapes.length);   // (la visite finie : toutes les étapes cochées)
    const o = typeof OBJECTIFS !== 'undefined' && OBJECTIFS.find(x => x.id === 'marche');
    const b = this.banniereVisite = this.add.text(480, 462, VISITE_MARCHE.fin + (o ? `   Objectif : « ${o.texte} »` : ''), style(13, '#2a1608', { fontStyle: 'bold', backgroundColor: '#f3d98a', padding: { x: 10, y: 5 } })).setOrigin(0.5).setDepth(150).setScrollFactor(0);
    const et = v.etapes;
    this.tweens.add({ targets: et ? [b, et] : [b], alpha: 0, delay: 4500, duration: 500, onComplete: () => { b.destroy(); if (et) et.destroy(); if (this.boutonCommandes && this.boutonCommandes.active) this.majBoutonCommandes(); } });   // (il ne revient que s'il y a des commandes)
  },

  // Garrick avec sa vue et son image de pas ; son ombre le suit
  poserGarrick(pas) {
    const v = this.visite, g = v.gar, base = corpsHD(this, 'mentor', null, v.vue), k = pas ? base + '_pas' + pas : base;
    g.setTexture(this.textures.exists(k) ? k : base).setFlipX(v.vue === 'profil' && v.versGauche);
    v.ombre.setPosition(g.x + 2, g.y - 2); v.ombre.yTri = g.y - 0.5;
  },
  avancerGarrick(dt, vitesse) {
    const v = this.visite, g = v.gar, [cx, cy] = v.cible, rx = cx - g.x, ry = cy - g.y, d = Math.hypot(rx, ry), pas = vitesse * dt;
    if (d > 0.5) { v.vue = this.vueSelon(rx, ry); if (Math.abs(rx) > 0.5) v.versGauche = rx < 0; }
    if (d <= pas + 0.5) { g.setPosition(cx, cy); v.cible = v.chemin.shift() || null; if (!v.cible) return this.arriveeGarrick(); }
    else g.setPosition(g.x + rx / d * pas, g.y + ry / d * pas);
    v.pas += dt;
    const f = Math.floor(v.pas / 140) % 4;
    this.poserGarrick(f === 1 ? 1 : f === 3 ? 2 : 0);
  },
  tournerGarrickVers(x, y) {
    const v = this.visite, g = v.gar, vue = this.vueSelon(x - g.x, y - g.y);
    if (vue !== v.vue || v.pas) { v.vue = vue; v.versGauche = x < g.x; v.pas = 0; this.poserGarrick(0); }
  },

  // Chaque image : il marche, il attend, il appelle ; JeuneGoy le suit ; la bulle suit sa tête
  majVisite(dt) {
    const v = this.visite, h = this.heros, g = v.gar;
    if (!g.active) { this.visite = null; return; }
    const bloque = this.bloquePlace();
    for (const o of [v.barre, v.etapes]) if (o && o.active) o.setVisible(!bloque);
    if (v.bulle) v.bulle.setVisible(!bloque && !v.bulleCachee);
    if (g.bulle && g.bulle.active) g.bulle.setPosition(g.x, g.y - g.displayHeight - 8);
    if (bloque) { if (v.pas) { v.pas = 0; this.poserGarrick(0); } return; }   // (une boutique est ouverte : il t'attend)
    const now = this.time.now, dh = Math.hypot(h.x - g.x, h.y - g.y);
    this.tracesVisite(v.pasG, g.x, g.y); this.tracesVisite(v.pasH, h.x, h.y);
    const appeler = () => { if (now - v.appel > 6500) { v.appel = now; this.bulleSur(g, `« ${VISITE_MARCHE.appel} »`, { nom: 'Garrick', race: 'humain' }); } };
    if (v.phase === 'marche') {
      if (this.mainJoueur > v.debutJambe) v.suivre = false;   // (le joueur a repris la main : Garrick l'attendra)
      if (!v.attend && dh > 230) { v.attend = true; v.attendDepuis = now; }
      else if (v.attend && dh < 140) v.attend = false;
      if (v.attend) { this.tournerGarrickVers(h.x, h.y); if (now - v.attendDepuis > 1200) appeler(); }
      else if (v.cible) this.avancerGarrick(dt, 0.2);
      if (v.phase !== 'marche') return;
      // les enchères, en passant
      if (v.encheres && Math.abs(g.x - LIEUX_PLACE.encheres[0]) < 140 && !v.attend) {
        v.encheres = false; v.encheresDit = true;
        const G = this.G, ouvertes = typeof lieuOuvert !== 'function' || lieuOuvert(G, 'encheres');
        this.bulleSur(g, `« ${ouvertes ? VISITE_MARCHE.encheres : VISITE_MARCHE.encheresChantier(OUVERTURE_LIEUX.encheres - G.jour)} »`, { nom: 'Garrick', race: 'humain' });
      }
      // JeuneGoy le suit, deux pas derrière lui
      if (v.suivre && v.cible && now - (v.suiviT || 0) > 250) {
        v.suiviT = now;
        const dx = v.cible[0] - g.x, dy = v.cible[1] - g.y, d = Math.hypot(dx, dy) || 1, bx = g.x - dx / d * 50, by = g.y - dy / d * 50;
        if (Math.hypot(h.x - bx, h.y - by) > 26 && (!this.cible || Math.hypot(this.cible[0] - bx, this.cible[1] - by) > 20 || this.chemin && this.chemin.length)) this.partirVers(bx, by);
      }
      if (now - v.traceT > 200) { v.traceT = now; this.cheminVisite(); }
    } else if (v.phase === 'parle') {
      if (v.i >= 0 && v.suivre && !v.versSpot) { v.versSpot = true; const [x, y] = this.devantLieu(VISITE_MARCHE.etapes[v.i].lieu); this.partirVers(x, y); }
      if (v.versSpot && !v.tourne && !this.cible) { v.tourne = true; this.vueHeros = 'dos'; this.poserHeros(0); }
      // trop loin : la bulle se cache, il t'appelle
      v.bulleCachee = dh > 280;
      if (v.bulleCachee) appeler();
    } else if (v.phase === 'depart' && now > v.depuis && v.cible) this.avancerGarrick(dt, 0.22);
    if (v.bulle && !v.bulleCachee) this.placerBulleVisite();
  },

  // Des traces de pas derrière qui marche (elles s'effacent doucement) : p = [x, y, distance, côté]
  tracesVisite(p, x, y) {
    const d = Math.hypot(x - p[0], y - p[1]);
    if (d > 40) { p[0] = x; p[1] = y; p[2] = 0; return; }
    if (d < 0.01) return;
    p[2] += d;
    if (p[2] >= 17) {
      const ux = (x - p[0]) / d, uy = (y - p[1]) / d, e = this.add.ellipse(x - uy * 4 * p[3], y - 1 + ux * 3 * p[3], 7, 4, 0x3a2410, 0.32);
      e.yTri = 1.5; this.place.add(e); p[3] = -p[3]; p[2] = 0;
      this.tweens.add({ targets: e, alpha: 0, delay: 600, duration: 1300, onComplete: () => e.destroy() });
    }
    p[0] = x; p[1] = y;
  },
  // Son chemin, en pointillés dorés, jusqu'à l'étal où il va (et un rond doré où il s'arrêtera)
  cheminVisite() {
    const v = this.visite, g = v.trace;
    g.clear();
    if (v.phase !== 'marche' || !v.cible) return;
    const pts = [[v.gar.x, v.gar.y], v.cible, ...v.chemin];
    for (let k = 0; k < pts.length - 1; k++) {
      const [ax, ay] = pts[k], [bx, by] = pts[k + 1], n = Math.max(1, Math.floor(Math.hypot(bx - ax, by - ay) / 16));
      for (let j = k ? 0 : 1; j < n; j++) { const x = ax + (bx - ax) * j / n, y = ay + (by - ay) * j / n; g.fillStyle(0x1a0e06, 0.5).fillCircle(x, y + 1, 4.2); g.fillStyle(0xffd860, 0.95).fillCircle(x, y, 2.8); }
    }
    g.lineStyle(4, 0x1a0e06, 0.5).strokeCircle(v.but[0], v.but[1] + 1, 14); g.lineStyle(3, 0xffd860, 1).strokeCircle(v.but[0], v.but[1], 14);
  },

  // Garrick parle : sa bulle, au-dessus de sa tête, du côté où tu n'es pas ; elle suit sa tête quand la place glisse
  direVisite(texte, refaire = false) {
    const v = this.visite; if (!v) return;
    if (v.bulle) v.bulle.destroy();
    v.texte = texte; v.bulleCachee = false;
    if (!refaire && v.reponse && v.reponse.bulle && v.reponse.bulle.active) v.reponse.bulle.destroy();   // (le marchand a fini de répondre)
    const L = v.bulleL = this.bandeNomVisite() ? 352 : 410, t = `« ${texte.replaceAll('{J}', eJ(this.G))} »`, bouton = v.question === null ? 'La suite ▶' : null;
    if (!refaire) v.bulleCote = v.gar.x >= this.heros.x ? 1 : -1;
    const essai = this.add.text(0, 0, t, style(14, '#2a1a0c', { wordWrap: { width: L - 24 }, align: 'center' }));
    v.bulleH = essai.height + 18 + (bouton ? 34 : 0); essai.destroy();
    const [xc, yc, pointe] = this.cadreBulleVisite();
    v.bulleP = pointe;
    v.bulle = bulleGarrick(this, xc, yc, t, { l: L, pointe, bouton, action: () => this.suiteVisite() });
    if (refaire) { this.tweens.killTweensOf(v.bulle); v.bulle.setAlpha(1); }
    if (!refaire) Son.jouer('voix', { personne: { nom: 'Garrick', race: 'humain' }, ton: 'content', duree: 1.2 });
  },
  cadreBulleVisite() {
    const v = this.visite, z = this.place.scaleX, g = v.gar, L = v.bulleL, hB = v.bulleH;
    const tx = this.place.x + g.x * z, ty = this.place.y + (g.y - g.displayHeight) * z;
    const yc = Math.max(ty - 20 - hB / 2, 87 + 14 + hB / 2);
    let xc = Phaser.Math.Clamp(tx + v.bulleCote * 120, L / 2 + 8, 952 - L / 2);
    const zb = this.zoneBoutonsPlace();   // (sous les boutons « La place · M » et « Ma liste · L », où qu'ils soient)
    if (yc - hB / 2 < zb[3] && yc + hB / 2 > zb[1]) xc = zb[0] > 480 ? Math.min(xc, zb[0] - 4 - L / 2) : Math.max(xc, zb[2] + 4 + L / 2);
    if (this._vignette && this._vignette.active && yc - hB / 2 < 160) xc = Math.min(xc, 568 - L / 2);   // (ni sous une vignette « Objectif atteint »)
    // (v1.63) ni sur le nom de l'étal qu'il présente : la bulle passe à côté de la bande, du côté de Garrick si elle y tient
    const bande = this.bandeNomVisite();
    if (bande && yc - hB / 2 < bande[3] && yc + hB / 2 > bande[1] && xc + L / 2 > bande[0] && xc - L / 2 < bande[2]) {
      const zb = this.zoneBoutonsPlace(), haut = yc - hB / 2 < zb[3] && yc + hB / 2 > zb[1];
      const droiteMax = haut && zb[0] > 480 ? zb[0] - 4 : 952, gaucheMin = haut && zb[0] < 480 ? zb[2] + 4 : 8, gauche = bande[0] - 8 - L / 2, droite = bande[2] + 8 + L / 2;
      const tient = x => x - L / 2 >= gaucheMin && x + L / 2 <= droiteMax;
      const choix = (v.bulleCote > 0 ? [droite, gauche] : [gauche, droite]).find(tient);
      if (choix !== undefined) xc = choix;
    }
    return [Math.round(xc), Math.round(yc), Phaser.Math.Clamp(Math.round(tx - xc), -L / 2 + 22, L / 2 - 22)];
  },
  // (v1.63) la bande du nom de l'étal de l'étape en cours, à l'écran : [x0, y0, x1, y1] (ou null : la fontaine, le départ)
  bandeNomVisite() {
    const v = this.visite, e = v && !v.fini && v.i >= 0 ? VISITE_MARCHE.etapes[v.i] : null; if (!e || !this.place) return null;
    const g = this.place.list.find(o => o.cle === e.lieu && o.bandeNom); if (!g) return null;
    const z = this.place.scaleX, f = g.scaleX * z, [a, b, c, d] = g.bandeNom, ox = this.place.x + g.x * z, oy = this.place.y + g.y * z;
    return [ox + a * f - 6, oy + b * f - 4, ox + c * f + 6, oy + d * f + 4];
  },
  placerBulleVisite() {
    const v = this.visite, [xc, yc, pointe] = this.cadreBulleVisite();
    if (Math.abs(pointe - v.bulleP) > 24) return this.direVisite(v.texte, true);
    v.bulle.setPosition(xc, yc);
  },

  // En haut, les étapes de la visite (faites, en cours, à venir), entre le bouton des commandes et ceux de la place
  etapesVisite(enCours = null) {
    const v = this.visite;
    if (v.etapes && enCours === null) v.etapes.destroy();
    const c = etapesGuide(this, 69, VISITE_MARCHE.etapes.map(e => e.nom), enCours === null ? Math.max(0, v.question !== null ? v.question : v.i) : enCours, VISITE_MARCHE.titre);
    const fond = c.list[0], gauche = 480 - fond.width / 2, droite = 480 + fond.width / 2;
    if (droite > 804) c.x = Math.max(804 - droite, 8 - gauche);   // (à gauche des boutons de la place)
    if (enCours === null) v.etapes = c;
    return c;
  },
  // En bas, ce que tu peux faire pendant la visite
  barreVisite(force = false) {
    const v = this.visite, E = VISITE_MARCHE.etapes, et = E[v.i];
    const marchand = v.phase === 'parle' && et && MARCHANDS[et.lieu];
    const cle = [v.phase, v.i, !!marchand, v.question].join(':');
    if (!force && cle === v.cleBarre) return;
    v.cleBarre = cle;
    if (v.barre) v.barre.destroy();
    const c = v.barre = this.add.container(0, 0).setDepth(150).setScrollFactor(0);
    if (v.question !== null) {   // (deux boutons clairs : reprendre là où l'on en était, ou ignorer la visite)
      const n = v.question + 1, et2 = E[v.question];
      const b1 = creerBouton(this, 345, 456, 350, `▶ Reprendre la visite (${n} · ${et2.nom}) · Espace`, () => { if (!this.bloquePlace()) this.reprendreVisite(); });
      const b2 = creerBouton(this, 660, 456, 260, '✕ Ignorer la visite · Échap', () => { if (!this.bloquePlace()) this.ignorerVisite(); });
      let f = 15;   // (les deux textes à la même taille, et chacun tient dans son bouton)
      while (f > 10 && (b1.label.setFontSize(f).width > 350 - 28 || b2.label.setFontSize(f).width > 260 - 28)) f--;
      c.add([b1.fond, b1.label, b2.fond, b2.label]);
      return;
    }
    const aide = this.add.text(0, 462, marchand ? 'Espace : la suite  ·  E : ouvrir l’étal, il t’attend' : 'Espace : la suite  ·  ZQSD : tu marches, il t’attend', style(12, '#f3d98a', { fontStyle: 'bold italic' })).setOrigin(0, 0.5);
    const bouton = (t, coul, fn, actif = true) => {
      const b = this.add.text(0, 462, t, style(13, '#fff4dc', { fontStyle: 'bold', backgroundColor: coul, padding: { x: 9, y: 4 } })).setOrigin(0, 0.5).setAlpha(actif ? 1 : 0.4);
      if (actif) b.setInteractive({ useHandCursor: true }).on('pointerdown', (p, lx, ly, ev) => { if (ev && ev.stopPropagation) ev.stopPropagation(); if (this.bloquePlace()) return; Son.jouer('clic'); fn(); });
      return b;
    };
    const morceaux = [aide, bouton('◀ Revenir', '#6a4a24', () => this.revenirVisite(), v.i > 0), bouton('Étal suivant ▶', '#4f7a3a', () => this.etalSuivantVisite(), v.i < E.length - 1), bouton('Passer la visite · Échap', '#7a2a20', () => this.passerVisite())];
    const Ltot = morceaux.reduce((a, o) => a + o.width, 0) + 3 * 10 + 24;
    c.add(this.add.rectangle(480, 462, Ltot, 32, 0x140c08, 0.92).setStrokeStyle(2, 0xc9a227));
    let x = 480 - Ltot / 2 + 12;
    for (const o of morceaux) { o.setX(Math.round(x)); c.add(o); x += o.width + 10; }
  },
});
