// (v1.01, lot B-3b, vision validée par le joueur) L'hydromel noir de la Nuit des Brumes : JeuneGoy, ivre, revoit
// des bribes de son enfance. Une cuisine qui sent la cannelle, sa mère aux mains pleines de farine ; son père qui
// le hisse sur ses épaules pour voir les lanternes ; la médaille qu'on lui passe autour du cou ; puis le ciel
// devient orange, une ombre immense passe, et le feu du dragon dévore tout. Il rouvre les yeux près du grand feu.
// Les visages des parents restent noyés de lumière : le souvenir ne les rend pas (le sort d'oubli).
// Un clic à chaque image (pas d'enchaînement automatique). Le joueur ne parle jamais.
// (planche 31 v2) La vision a son cadre à elle, différent des bulles de nuage des récits : un voile de fumée
// violette (l'hydromel noir) qui ondule autour d'un ovale, des poussières d'or qui dérivent, un battement de
// cœur, l'image qui tangue doucement. Le souvenir du feu brûle comme un vieux parchemin, des bords vers le
// centre, avant le réveil (les paupières qui se rouvrent).
class VisionScene extends Phaser.Scene {
  constructor() { super('Vision'); }
  init(data) { this.retour = (data && data.retour) || 'MarcheNoir'; this.etape = 0; this.objets = []; this.occupe = false; }

  create() {
    const G = this.G = window.GAME;
    creerHalo(this); creerIconesHD(this);
    this.cameras.main.setBackgroundColor('#140a06');
    // JeuneGoy enfant (le stade « petit » de son apparence)
    this.enfant = 'joueur_vision_enfant';
    if (!this.textures.exists(this.enfant)) for (const [pas, suffixe] of [[0, ''], [-1, '_pas1'], [1, '_pas2']]) dessinerJoueurHD(G.joueur.apparence, 'petit', G.joueur.feminin, pas, [], 'troisQuarts').texture(this, this.enfant + suffixe);
    // sur les épaules de son père : de dos, les cuisses de part et d'autre de sa tête, les bras levés
    this.enfantEpaules = 'joueur_vision_enfant_epaules';
    const toile = dessinerJoueurHD(G.joueur.apparence, 'petit', G.joueur.feminin, 0, [], 'dos', 'epaules');
    if (!this.textures.exists(this.enfantEpaules)) toile.texture(this, this.enfantEpaules);
    this.assiseEnfant = toile.assise;
    this.creerVoile();
    // la narration (en italique) et les paroles (droites, plus claires), sur un bandeau de fumée sombre
    this.bandeau = this.add.image(480, 58, 'halo').setScale(9, 1.3).setTint(0x0a0610).setAlpha(0.75).setDepth(58);
    this.ligne = null;
    this.indice = this.add.text(940, 525, '', style(12, '#e8d8f0', { fontStyle: 'italic', stroke: '#0a0610', strokeThickness: 3 })).setOrigin(1, 0.5).setDepth(60);
    this.input.on('pointerdown', () => { if (!this.occupe) this.suivante(); });
    // on plonge dans le souvenir : l'ovale s'ouvre depuis le noir, comme des yeux qui se ferment sur un rêve
    this.cameras.main.fadeIn(1400, 40, 20, 50);
    this.suivante();
  }

  // --- Le voile du souvenir ---
  // Une vignette ovale aux bords de fumée (deux couches qui respirent à des rythmes différents, si bien que
  // le bord ondule sans cesse), des volutes violettes qui tournent autour, des poussières d'or, le battement
  // du cœur, et l'image qui tangue un peu.
  creerVoile() {
    const cle = 'voileVision';
    if (!this.textures.exists(cle)) {
      const L = 240, H = 135, tex = this.textures.createCanvas(cle, L, H), ctx = tex.getContext(), img = ctx.createImageData(L, H);
      const bruit = (x, y) => { const v = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; return v - Math.floor(v); };
      const lisse = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi; const a = bruit(xi, yi), b = bruit(xi + 1, yi), c = bruit(xi, yi + 1), d = bruit(xi + 1, yi + 1); const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy); return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy; };
      for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) {
        const nx = (x + 0.5 - L / 2) / (L / 2), ny = (y + 0.5 - H / 2) / (H / 2);
        const d = Math.sqrt(nx * nx * 0.92 + ny * ny * 1.05);
        const n = lisse(x / 9, y / 9) * 0.6 + lisse(x / 4, y / 4) * 0.4;
        const a = Math.max(0, Math.min(1, (d - 0.62 + (n - 0.5) * 0.3) / 0.32));
        const i = (y * L + x) * 4;
        // du violet sombre de l'hydromel vers le noir, au bord
        img.data[i] = 26 - a * 16; img.data[i + 1] = 12 - a * 8; img.data[i + 2] = 34 - a * 20; img.data[i + 3] = Math.round(Math.pow(a, 1.3) * 255);
      }
      ctx.putImageData(img, 0, 0); tex.refresh();
    }
    this.voiles = [0, 1].map(j => {
      const v = this.add.image(480, 270, cle).setDisplaySize(960 * (1.04 + j * 0.05), 540 * (1.04 + j * 0.05)).setDepth(50 + j).setAlpha(j ? 0.55 : 0.95).setFlipX(!!j).setFlipY(!!j);
      v.base = v.scaleX;
      this.tweens.add({ targets: v, scaleX: v.scaleX * (1.03 + j * 0.02), scaleY: v.scaleY * (1.05 - j * 0.02), duration: 2600 + j * 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      return v;
    });
    // les volutes de fumée qui tournent lentement le long du bord
    this.volutes = [];
    for (let k = 0; k < 14; k++) {
      const a0 = (k / 14) * Math.PI * 2;
      const v = this.add.image(0, 0, 'halo').setScale(1.4 + (k % 3) * 0.5).setTint(k % 2 ? 0x4a3a6a : 0x2a1a3a).setAlpha(0.32).setDepth(52);
      v.angle0 = a0; v.vitesse = 0.00006 * (k % 2 ? 1 : -1);
      this.volutes.push(v);
    }
    // les poussières d'or du souvenir, qui dérivent vers le centre et s'éteignent
    this.time.addEvent({ delay: 260, loop: true, callback: () => {
      if (!this.voileActif) return;
      const a = Math.random() * Math.PI * 2, r = 0.95 + Math.random() * 0.1;
      const p = this.add.image(480 + Math.cos(a) * 470 * r, 270 + Math.sin(a) * 260 * r, 'halo').setScale(0.06 + Math.random() * 0.05).setTint(0xffe0a0).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD).setDepth(53);
      this.tweens.add({ targets: p, x: 480 + Math.cos(a) * 300, y: 270 + Math.sin(a) * 160, alpha: { from: 0.9, to: 0 }, duration: 3200 + Math.random() * 1500, onComplete: () => p.destroy() });
    } });
    // le cœur qui bat (boum-boum... boum-boum) : le voile se resserre un instant
    this.time.addEvent({ delay: 1700, loop: true, callback: () => {
      if (!this.voileActif) return;
      // (pas de zoom de la caméra : elle est déjà zoomée pour la netteté de l'écran, depuis son coin)
      this.voiles.forEach(v => this.tweens.add({ targets: v, alpha: v.alpha + 0.05, displayWidth: v.displayWidth * 0.985, displayHeight: v.displayHeight * 0.985, duration: 90, yoyo: true, repeat: 1, hold: 60 }));
    } });
    this.voileActif = true;
  }
  update(t) {
    if (!this.volutes) return;
    for (const v of this.volutes) {
      const a = v.angle0 + t * v.vitesse;
      v.setPosition(480 + Math.cos(a) * 500, 270 + Math.sin(a) * 300);
    }
    // le voile tangue doucement, comme une tête lourde
    if (this.voileActif) this.voiles.forEach((v, j) => v.setRotation(Math.sin(t / 1900 + j) * 0.012));
  }
  fermerVoile() {
    this.voileActif = false;
    this.tweens.add({ targets: [...this.voiles, ...this.volutes], alpha: 0, duration: 600 });
  }

  vider() { this.objets.forEach(o => { this.tweens.killTweensOf(o); o.destroy(); }); this.objets = []; }
  o(x) { this.objets.push(x); return x; }
  // un parent : un corps chaud, le visage perdu dans une lumière
  parent(x, y, feminin, echelle, flip = false, vue = 'troisQuarts', pose = null) {
    const qui = { nom: feminin ? 'Ta mère' : 'Ton père', race: 'humain', feminin, niveau: 'novice', peau: 1 };
    const cle = corpsHD(this, qui, pose, vue);
    const p = this.o(this.add.image(x, y, cle).setOrigin(0.5, 1).setScale(echelle * echelleCorps(cle)).setFlipX(flip).setTint(0xffe0c0));
    p.cle = cle;
    const tete = this.o(this.add.image(x, y - p.displayHeight * 0.86, 'halo').setScale(echelle * 0.11).setTint(0xfff4d0).setAlpha(vue === 'dos' ? 0.35 : 0.95).setBlendMode(Phaser.BlendModes.ADD));
    this.tweens.add({ targets: tete, alpha: vue === 'dos' ? 0.2 : 0.75, duration: 900, yoyo: true, repeat: -1 });
    if (vue !== 'dos' || !pose) this.tweens.add({ targets: p, y: y - 3, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    p.tete = tete;
    return p;
  }
  // la narration en italique, les paroles (« ... ») droites et plus claires
  dire(t) {
    if (this.ligne) this.ligne.destroy();
    this.ligne = texteMixte(this, 480, 58, t, { taille: t.length > 150 ? 16 : 17, largeur: 900, align: 'center', extra: { stroke: '#0a0610', strokeThickness: 5 } }).setOrigin(0.5, 0.5).setDepth(60).setAlpha(0);
    this.tweens.add({ targets: this.ligne, alpha: 1, duration: 900 });
    this.bandeau.setScale(9, 0.9 + this.ligne.hauteur / 60).setVisible(true);
  }

  suivante() {
    this.etape++;
    this.vider();
    this.indice.setText('▶ clique pour continuer');
    const g = this.o(this.add.graphics());
    if (this.etape === 1) {
      // la cuisine qui sent la cannelle : le mur chaud, les poutres, le four, la table des gâteaux
      g.fillStyle(0xa8643a).fillRect(0, 0, 960, 540); g.fillStyle(0x8a4a24).fillRect(0, 470, 960, 70);
      for (const x of [0, 240, 480, 720]) g.fillStyle(0x5a3018).fillRect(x, 0, 240, 18).fillStyle(0x6a3a1c).fillRect(x + 110, 18, 18, 452);
      g.fillStyle(0x4a2814).fillRect(620, 150, 260, 320); g.fillStyle(0x2a1408).fillRoundedRect(660, 290, 180, 120, { tl: 60, tr: 60, bl: 0, br: 0 }); g.fillStyle(0xff8a30).fillRoundedRect(676, 306, 148, 104, { tl: 50, tr: 50, bl: 0, br: 0 });   // le four
      const four = this.o(this.add.image(750, 360, 'halo').setScale(3.4).setTint(0xff9a40).setAlpha(0.55).setBlendMode(Phaser.BlendModes.ADD));
      this.tweens.add({ targets: four, alpha: 0.35, duration: 700, yoyo: true, repeat: -1 });
      g.fillStyle(0x3a2010).fillRect(120, 352, 440, 16).fillStyle(0x5a3418).fillRect(120, 346, 440, 10).fillStyle(0x3a2010).fillRect(140, 368, 18, 102).fillRect(522, 368, 18, 102);   // la table
      for (const x of [220, 330, 440]) { g.fillStyle(0xc88a40).fillEllipse(x, 340, 84, 24); g.fillStyle(0xe8b060).fillEllipse(x, 333, 72, 15); g.fillStyle(0xa0281e); for (let k = 0; k < 5; k++) g.fillCircle(x - 24 + k * 12, 332, 3); }
      for (const [x, y] of [[180, 230], [250, 210], [320, 236]]) { g.fillStyle(0x6a8a3a).fillCircle(x, y, 7); g.lineStyle(2, 0x5a3018).lineBetween(x, y - 7, x, y - 30); }   // des herbes qui sèchent
      for (let k = 0; k < 22; k++) { const f = this.o(this.add.rectangle(380 + Math.random() * 180, 230 + Math.random() * 100, 2, 2, 0xffffff, 0.85)); this.tweens.add({ targets: f, y: f.y - 40, alpha: 0, duration: 1600 + Math.random() * 1200, repeat: -1 }); }   // la farine qui vole
      this.parent(470, 470, true, 11, true);
      const e = this.o(this.add.image(250, 470, this.enfant).setOrigin(0.5, 1).setScale(echelleJoueur(8)));
      pasDeMarche(this, e, 0, { poussiere: false });   // (ses petites jambes trottinent)
      this.tweens.add({ targets: e, x: 222, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });   // il chipe un gâteau et recule
      this.dire("Une cuisine qui sent la cannelle. Une femme aux mains pleines de farine éclate de rire :\n« Doucement, petit voleur, ce sont les gâteaux du Solstice ! »");
    } else if (this.etape === 2) {
      // sur les épaules de son père, les lanternes au-dessus des toits
      g.fillStyle(0x141a3a).fillRect(0, 0, 960, 540);
      for (let k = 0; k < 60; k++) g.fillStyle(0xfff4d0, Math.random() * 0.8).fillRect(Math.random() * 960, Math.random() * 300, 2, 2);
      g.fillStyle(0x1a1420); for (const [x, w, h] of [[0, 220, 170], [200, 180, 210], [360, 240, 150], [580, 200, 200], [760, 200, 170]]) { g.fillRect(x, 540 - h - 110, w, h + 110); g.fillTriangle(x - 10, 540 - h - 110, x + w + 10, 540 - h - 110, x + w / 2, 540 - h - 190); }
      for (let k = 0; k < 24; k++) {
        const l = this.o(this.add.container(60 + Math.random() * 840, 330 + Math.random() * 120));
        l.add([this.add.image(0, 0, 'halo').setScale(0.4).setTint(0xffa040).setAlpha(0.6).setBlendMode(Phaser.BlendModes.ADD), this.add.rectangle(0, 0, 10, 12, 0xf8c070)]);
        this.tweens.add({ targets: l, y: l.y - 360, duration: 9000 + Math.random() * 5000, ease: 'Sine.easeIn' });
      }
      this.porteEtEnfant(480, 560, 19);
      this.dire("Un homme te hisse sur ses épaules. Au loin, des lanternes montent au-dessus des toits :\n« Regarde, elles vont dire bonjour aux étoiles. »");
    } else if (this.etape === 3) {
      // la médaille, que deux mains (pleines de farine) passent autour de ton cou
      g.fillStyle(0x3a2014).fillRect(0, 0, 960, 540);
      this.o(this.add.image(480, 270, 'halo').setScale(4).setTint(0xffd080).setAlpha(0.4).setBlendMode(Phaser.BlendModes.ADD));
      const groupe = this.o(this.add.container(480, 0));
      const ruban = this.add.graphics();
      const m = this.add.image(0, 330, texMedailleParents(this)).setScale(6).setOrigin(0.5, 0);
      const mains = [-1, 1].map(sens => this.add.image(sens * 150, 150, texMainsMedaille(this)).setScale(4).setFlipX(sens > 0).setOrigin(0.5, 0.5));
      // le ruban : des deux mains jusqu'au haut de la médaille (il fait le tour du cou)
      const dessinerRuban = () => {
        ruban.clear();
        for (const sens of [-1, 1]) {
          const hx = mains[sens < 0 ? 0 : 1].x - sens * 34, hy = mains[sens < 0 ? 0 : 1].y + 34;
          const bx = sens * 22, by = 334;
          ruban.lineStyle(26, 0x5a1010).lineBetween(hx, hy, bx, by);
          ruban.lineStyle(20, 0xa82a24).lineBetween(hx, hy, bx, by);
          ruban.lineStyle(5, 0xd04a3a).lineBetween(hx, hy, bx, by);
        }
      };
      groupe.add([ruban, m, ...mains]);
      dessinerRuban();
      // les mains descendent doucement, la médaille se balance
      const etat = { t: 0 };
      this.tweens.add({ targets: etat, t: 1, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', onUpdate: () => { mains.forEach((h, j) => { h.y = 150 + etat.t * 22; h.angle = (j ? -1 : 1) * etat.t * 4; }); m.y = 330 + etat.t * 22; m.angle = Math.sin(etat.t * Math.PI) * 4; dessinerRuban(); } });
      for (let k = 0; k < 14; k++) { const f = this.o(this.add.rectangle(480 + (Math.random() < 0.5 ? -1 : 1) * (120 + Math.random() * 80), 160 + Math.random() * 60, 3, 3, 0xffffff, 0.85).setDepth(2)); this.tweens.add({ targets: f, y: f.y + 120, alpha: 0, duration: 1800 + Math.random() * 1400, repeat: -1, delay: Math.random() * 1500 }); }   // la farine qui tombe des mains
      this.dire("Ta mère te passe une médaille autour du cou :\n« Elle te gardera, quand nous ne serons pas là. »");
    } else if (this.etape === 4) {
      // le ciel devient orange, l'ombre passe, le feu dévore tout... et le souvenir brûle comme un parchemin
      this.occupe = true; this.indice.setText('');
      g.fillStyle(0x8a4a24).fillRect(0, 0, 960, 540);
      this.parent(580, 500, true, 10, true); this.parent(380, 500, false, 10.5);
      const ciel = this.o(this.add.rectangle(480, 270, 960, 540, 0xff7a20, 0).setDepth(5));
      this.tweens.add({ targets: ciel, fillAlpha: 0.55, duration: 1400 });
      // l'ombre immense des ailes
      const ombre = this.o(this.add.graphics().setDepth(6));
      ombre.fillStyle(0x0a0404, 0.85).fillTriangle(0, 0, 420, 40, 200, 160).fillTriangle(420, 40, 840, 0, 640, 160).fillEllipse(420, 60, 220, 70).fillTriangle(560, 40, 760, 20, 700, 80);
      ombre.setPosition(-900, -40);
      this.tweens.add({ targets: ombre, x: 1100, duration: 2600, delay: 900, ease: 'Sine.easeInOut' });
      Son.jouer('vent', { duree: 3 });
      this.time.delayedCall(2600, () => {
        this.cameras.main.shake(1400, 0.012); Son.jouer('feu');
        for (let k = 0; k < 40; k++) { const f = this.o(this.add.image(Math.random() * 960, 560, 'halo').setScale(1 + Math.random() * 2).setTint(Phaser.Utils.Array.GetRandom([0xff4010, 0xff8a20, 0xffc040])).setAlpha(0.8).setBlendMode(Phaser.BlendModes.ADD).setDepth(7)); this.tweens.add({ targets: f, y: -80 - Math.random() * 200, duration: 1400 + Math.random() * 900, delay: Math.random() * 600, repeat: 1 }); }
        this.time.delayedCall(1500, () => this.bruler(4800, () => { this.occupe = false; this.indice.setText('▶ clique pour continuer'); }));
      });
      this.dire("Le ciel devient orange. Une ombre immense passe sur le village...\net le feu du dragon dévore la cuisine, les rires, les visages.");
    } else if (this.etape === 5) {
      // il rouvre les yeux, près du grand feu : le voile du souvenir se dissipe
      this.fermerVoile();
      g.fillStyle(0x1a0c08).fillRect(0, 0, 960, 540);
      this.o(this.add.image(480, 540, 'halo').setScale(7, 4).setTint(0xff7a20).setAlpha(0.45).setBlendMode(Phaser.BlendModes.ADD));
      for (let k = 0; k < 8; k++) { const l = this.o(this.add.graphics()); l.fillStyle(0xc81e18).fillEllipse(60 + k * 120, 14 + (k % 2) * 8, 30, 26); }
      const orc = this.o(this.add.image(330, 540, textureBusteHD(this, { nom: 'Vieux Grôm', race: 'orc', vieux: true }, 'content')).setOrigin(0.5, 1).setScale(2.2).setAngle(5));
      const gob = this.o(this.add.image(640, 540, textureBusteHD(this, { nom: 'Mémé Pikka', race: 'gobelin', feminin: true, vieux: true }, 'content')).setOrigin(0.5, 1).setScale(2.2).setAngle(-5).setFlipX(true));
      this.tweens.add({ targets: orc, y: 532, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: gob, y: 534, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 300 });
      this.paupieres();
      this.dire("Tu rouvres les yeux près du grand feu. Un vieil orc et une vieille gobeline sont penchés sur toi.\nLe vieil orc : « Ça va, petit ? »   La gobeline : « Encore une coupe ? Cette boisson-là, c'est que pour les vrais ! »");
    } else {
      this.occupe = true;
      this.cameras.main.fadeOut(900);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(this.retour));
    }
  }

  // Le père, de dos, et JeuneGoy assis sur ses épaules : les fesses sur sa nuque, les cuisses de part et
  // d'autre de sa tête, les bras levés vers les lanternes ; les mains du père tiennent ses genoux (on les
  // repeint par-dessus l'enfant). Ils se balancent ensemble, doucement.
  porteEtEnfant(x, y, echelle) {
    const pere = this.parent(x, y, false, echelle, false, 'dos', 'porteur');
    const S = pere.scaleX, R = REPERES_CORPS[pere.cle] || { yT: pere.height * 0.28 };
    const k = FINESSE, ep = PROPORTIONS.humain.ep * k;
    const nuque = y - (pere.height - R.yT) * S;
    const Se = S * 0.62;   // (un petit enfant : comme dans la cuisine, un peu plus de la moitié de la taille d'un adulte)
    const tex = this.textures.get(this.enfantEpaules).getSourceImage();
    const enfant = this.o(this.add.image(x, nuque + 2 * k * S + (tex.height - this.assiseEnfant) * Se, this.enfantEpaules).setOrigin(0.5, 1).setScale(Se));
    pere.tete.setVisible(false);   // (de dos, sa tête est cachée par l'enfant)
    // les mains du père, repeintes par-dessus les genoux de l'enfant
    const mains = [-1, 1].map(cote => {
      const m = this.o(this.add.image(x, y, pere.cle).setOrigin(0.5, 1).setScale(S).setTint(0xffe0c0));
      const cxT = pere.width / 2 - cote * (ep + 0.6 * k);
      m.setCrop(cxT - 3.6 * k, R.yT - 4.6 * k, 7.2 * k, 7 * k);
      return m;
    });
    const tout = [pere, enfant, ...mains];
    this.tweens.add({ targets: tout, y: '-=4', duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: enfant, angle: { from: -2, to: 2 }, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  // Le souvenir brûle comme un vieux parchemin (ou une carte jetée au feu) : des bords vers le centre, un
  // liseré de braise qui avance, une bande roussie devant lui, des escarbilles et de la fumée qui montent ;
  // derrière, plus rien que le noir.
  bruler(duree, fini) {
    const L = 160, H = 90, P = 6, cle = 'brulureVision';
    if (this.textures.exists(cle)) this.textures.remove(cle);
    const tex = this.textures.createCanvas(cle, L, H), ctx = tex.getContext(), img = ctx.createImageData(L, H);
    const bruit = (x, y) => { const v = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return v - Math.floor(v); };
    const lisse = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi; const a = bruit(xi, yi), b = bruit(xi + 1, yi), c = bruit(xi, yi + 1), d = bruit(xi + 1, yi + 1); const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy); return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy; };
    // le seuil de chaque case : les bords d'abord (le coin bas gauche en premier, là où le feu a pris), le centre en dernier
    const seuil = new Float32Array(L * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) {
      const bord = Math.min(x / L, (L - x) / L, y / H * 0.6, (H - y) / H * 0.6) * 2;
      const coin = Math.hypot(x / L, (H - y) / H) * 0.25;
      seuil[y * L + x] = bord * 0.55 + coin + (lisse(x / 10, y / 10) * 0.65 + lisse(x / 4, y / 4) * 0.35) * 0.4;
    }
    const brulure = this.o(this.add.image(480, 270, cle).setScale(P).setDepth(9));
    const etat = { p: 0 };
    const peindre = () => {
      const p = etat.p * 1.15;
      for (let k = 0; k < L * H; k++) {
        const d = seuil[k] - p, i = k * 4;
        if (d < 0) { img.data[i] = 8; img.data[i + 1] = 5; img.data[i + 2] = 6; img.data[i + 3] = 255; }   // brûlé : le noir
        else if (d < 0.018) { const v = bruit(k, Math.floor(etat.p * 40)) > 0.5; img.data[i] = 255; img.data[i + 1] = v ? 230 : 150; img.data[i + 2] = v ? 120 : 30; img.data[i + 3] = 255; }   // la braise
        else if (d < 0.05) { img.data[i] = 40; img.data[i + 1] = 18; img.data[i + 2] = 8; img.data[i + 3] = 235; }   // le bord carbonisé
        else if (d < 0.11) { img.data[i] = 90; img.data[i + 1] = 46; img.data[i + 2] = 14; img.data[i + 3] = Math.round((0.11 - d) / 0.06 * 170); }   // roussi
        else img.data[i + 3] = 0;
      }
      ctx.putImageData(img, 0, 0); tex.refresh();
    };
    peindre();
    Son.jouer('feu');
    // des escarbilles et de la fumée, pris au hasard le long du liseré
    const etincelles = this.time.addEvent({ delay: 70, loop: true, callback: () => {
      for (let essai = 0; essai < 20; essai++) {
        const k = Math.floor(Math.random() * L * H), d = seuil[k] - etat.p * 1.15;
        if (d < 0 || d > 0.03) continue;
        const x = (k % L + 0.5) * P, y = (Math.floor(k / L) + 0.5) * P;
        const e = this.o(this.add.rectangle(x, y, 4, 4, Phaser.Utils.Array.GetRandom([0xffd060, 0xff8a20, 0xfff0b0])).setDepth(10));
        this.tweens.add({ targets: e, x: x + Phaser.Math.Between(-30, 30), y: y - 60 - Math.random() * 80, alpha: 0, duration: 900 + Math.random() * 700, onComplete: () => e.destroy() });
        if (Math.random() < 0.35) { const f = this.o(this.add.image(x, y, 'halo').setScale(0.5).setTint(0x3a3038).setAlpha(0.5).setDepth(10)); this.tweens.add({ targets: f, y: y - 120, scale: 1.6, alpha: 0, duration: 2200, onComplete: () => f.destroy() }); }
        break;
      }
    } });
    this.tweens.add({ targets: this.ligne, alpha: 0, duration: 1200, delay: duree * 0.45 });
    this.tweens.add({ targets: this.bandeau, alpha: 0, duration: 1200, delay: duree * 0.45 });
    this.tweens.add({ targets: etat, p: 1, duration: duree, ease: 'Sine.easeIn', onUpdate: peindre, onComplete: () => {
      etincelles.remove();
      // il ne reste que des cendres qui retombent dans le noir
      for (let k = 0; k < 18; k++) { const c = this.o(this.add.rectangle(Math.random() * 960, -10 - Math.random() * 200, 3, 3, 0x8a7a70, 0.8).setDepth(10)); this.tweens.add({ targets: c, y: 560, x: c.x + Phaser.Math.Between(-40, 40), duration: 4000 + Math.random() * 2000 }); }
      this.bandeau.setAlpha(0.75);
      fini();
    } });
  }

  // Le réveil : deux paupières noires qui se rouvrent, se referment une fois, puis s'ouvrent pour de bon
  paupieres() {
    const haut = this.o(this.add.rectangle(480, 135, 980, 290, 0x050304).setDepth(59)), bas = this.o(this.add.rectangle(480, 405, 980, 290, 0x050304).setDepth(59));
    const ouvrir = (part, duree) => new Promise(r => { this.tweens.add({ targets: haut, y: 135 - 290 * part, duration: duree, ease: 'Sine.easeOut' }); this.tweens.add({ targets: bas, y: 405 + 290 * part, duration: duree, ease: 'Sine.easeOut', onComplete: r }); });
    this.cameras.main.fadeIn(900, 255, 240, 210);
    ouvrir(0.35, 700).then(() => ouvrir(0.05, 260)).then(() => ouvrir(1, 900));
  }
}

// Les mains de ta mère qui tiennent le ruban de la médaille : la manche de sa robe (un revers de lin),
// le dos de la main, quatre doigts repliés sur le ruban et le pouce par-dessus ; un peu de farine sur les
// doigts. (Peintes avec le moteur des corps : relief, ombres et contour comme les personnages.)
function texMainsMedaille(scene) {
  const cle = 'mainsMedaille';
  if (scene.textures.exists(cle)) return cle;
  const t = new ToileHD(44, 40);
  t.relief = true; t.cel = true;
  t.rampes.peau = PEAUX_VIVES[1]; t.rampes.manche = rampeVive(0x8a3a3a); t.rampes.lin = rampeVive(0xe8dcc0); t.rampes.farine = rampeVive(0xf4f0ea);
  cylindre(t, 'manche', [2, 2], [14, 14], 8);                       // la manche
  cylindre(t, 'lin', [12, 12], [16, 16], 8.5, { decalage: 0.2 });  // le revers de lin
  cylindre(t, 'peau', [16, 16], [21, 21], 4.8, { decalage: 0.1 }); // le poignet
  t.forme('peau', ellipsoide(25, 24, 8, 6.5), { decalage: 0.2 });  // le dos de la main
  for (let j = 0; j < 4; j++) {                                    // quatre doigts repliés vers le bas
    const bx = 23 + j * 3, by = 28 + j * 0.8;
    cylindre(t, 'peau', [bx, by], [bx + 2.6, by + 5.5], 1.9, { decalage: 0.25 - j * 0.05 });
    cylindre(t, 'peau', [bx + 2.6, by + 5.5], [bx + 4.2, by + 7.5], 1.6, { decalage: 0.3 - j * 0.05 });   // (le bout replié vers le pouce : la main serre le ruban)
  }
  cylindre(t, 'peau', [28, 21], [36, 26], 2.2, { decalage: 0.5 });  // le pouce, par-dessus
  t.forme('peau', ellipsoide(36.5, 26.5, 2, 1.8), { decalage: 0.6, ombre: false });
  for (const [x, y] of [[24, 22], [30, 25], [27, 32]]) t.poser(x, y, 'farine', 5);   // la farine
  contourEpais(t, 1);
  t.texture(scene, cle);
  return cle;
}
