// Le vrai début : Garrick t'emmène devant ton futur shop... une vieille auberge abandonnée,
// sous la poussière et les toiles d'araignée. Tu la remets à neuf, endroit par endroit, en
// cliquant sur ce qui est délabré (la façade, le comptoir, l'arrière-boutique, la chambre).
// Puis on découvre le shop restauré, filmé de gauche à droite, et la première journée commence.
//
// Les quatre lieux sont posés côte à côte dans un monde de 3840 pixels :
// la chambre (0), l'arrière-boutique (960), le comptoir (1920), la façade (2880).

const LIEUX_RENOVATION = { chambre: 0, arriere: 960, comptoir: 1920, facade: 2880 };

// --- Les versions délabrées des textures ---

// Une copie poussiéreuse, ternie et moisie d'une texture : `cle + '_sale'`.
function salir(scene, cle) {
  const sale = cle + '_sale';
  if (scene.textures.exists(sale)) return sale;
  const source = scene.textures.get(cle).getSourceImage();
  const l = source.width, h = source.height;
  const tex = scene.textures.createCanvas(sale, l, h);
  const ctx = tex.getContext();
  ctx.drawImage(source, 0, 0);
  const img = ctx.getImageData(0, 0, l, h);
  const d = img.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < l; x++) {
    const k = (y * l + x) * 4;
    if (!d[k + 3]) continue;
    const lum = (d[k] * 0.3 + d[k + 1] * 0.59 + d[k + 2] * 0.11);
    // Ternie : moins de couleur, plus sombre, tirant vers le brun-gris
    let r = (d[k] * 0.35 + lum * 0.65) * 0.7 + 18, v = (d[k + 1] * 0.35 + lum * 0.65) * 0.68 + 14, b = (d[k + 2] * 0.35 + lum * 0.65) * 0.6 + 8;
    // Des taches de moisi, de la crasse, de la poussière
    const n = fbm(x * 0.06, y * 0.06, 901);
    if (n > 0.66) { r *= 0.8; v *= 0.9; b *= 0.7; }
    if (n < 0.3) { r *= 0.75; v *= 0.72; b *= 0.7; }
    if (hachage(x, y, 902) < 0.07) { r += 40; v += 38; b += 34; }
    if (hachage(x >> 1, y >> 1, 903) < 0.02) { r *= 0.5; v *= 0.5; b *= 0.5; }    // des trous, des éclats
    d[k] = Math.min(255, r); d[k + 1] = Math.min(255, v); d[k + 2] = Math.min(255, b);
  }
  ctx.putImageData(img, 0, 0);
  tex.refresh();
  return sale;
}

function creerRuinesHD(scene) {
  if (scene.textures.exists('toileAraignee')) return;
  // Une toile d'araignée, tendue dans un coin
  {
    const L = 30, t = toileDecor(L, L);
    t.rampes.fil = [0x6a6a70, 0x8a8a90, 0xa8a8b0, 0xc8c8d0, 0xe0e0e8, 0xf8f8ff];
    const rayons = 6;
    for (let k = 0; k <= rayons; k++) {
      const a = (k / rayons) * Math.PI / 2;
      for (let r = 0; r < L * 1.2; r += 0.5) t.poser(Math.round(Math.cos(a) * r), Math.round(Math.sin(a) * r), 'fil', 4);
    }
    for (let anneau = 4; anneau < L * 1.2; anneau += 4 + anneau * 0.15) {
      for (let k = 0; k < rayons; k++) {
        const a0 = (k / rayons) * Math.PI / 2, a1 = ((k + 1) / rayons) * Math.PI / 2;
        for (let s = 0; s <= 1; s += 0.05) {
          const a = a0 + (a1 - a0) * s, r = anneau - Math.sin(s * Math.PI) * 1.5;
          t.poser(Math.round(Math.cos(a) * r), Math.round(Math.sin(a) * r), 'fil', 3 + (anneau < 10 ? 1 : 0));
        }
      }
    }
    t.texture(scene, 'toileAraignee');
  }
  // Une planche clouée en travers
  {
    const t = toileDecor(56, 7);
    t.rampes.chene = BOIS_LUXE[0].bois;
    planche(t, 0, 0, 56, 7, 'chene', { graine: 910, noeuds: 2 });
    clou(t, 2, 2); clou(t, 52, 2);
    t.contour();
    t.texture(scene, 'plancheClouee');
  }
}

class RenovationScene extends Cinematique {
  constructor() { super('Renovation'); }

  create() {
    const G = this.G = window.GAME;
    this.fini = false;
    this.cameras.main.fadeIn(600);
    this.cameras.main.setBounds(0, 0, 3840, 540);
    creerInterieurHD(this);
    creerDecorComptoir(this);
    creerObjetsHD(this);
    creerRuinesHD(this);
    this.endroits = { facade: [], comptoir: [], arriere: [], chambre: [] };
    this.construireFacade();
    this.construireComptoir();
    this.construireArriere();
    this.construireChambre();
    textureJoueur(this, G);
    this.heros = this.add.image(LIEUX_RENOVATION.facade - 60, 470, 'joueur_petit').setOrigin(0.5, 1).setScale(echelleJoueur(5)).setDepth(6);
    this.garrick = imageCorps(this, LIEUX_RENOVATION.facade - 120, 470, 'mentor', 5).setDepth(6);
    this.creerBoiteTexte();
    this.consigne = this.add.text(480, 20, '', style(16, '#fff4dc', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 5, align: 'center' }))
      .setOrigin(0.5, 0).setScrollFactor(0).setDepth(20);
    // Pendant le nettoyage, Garrick parle dans une bulle en haut (la boîte du bas cacherait la pièce).
    this.bulle = this.add.text(480, 52, '', style(14, '#3b2410', { fontStyle: 'italic', backgroundColor: '#ead9b0ee', padding: { x: 10, y: 6 },
      wordWrap: { width: 760 }, align: 'center' })).setOrigin(0.5, 0).setScrollFactor(0).setDepth(20).setVisible(false);
    this.boutonPasser(() => this.finir());
    this.derouler();
  }

  // --- Les quatre lieux, chacun avec ses endroits délabrés ---

  // Un endroit : ses images propres, recouvertes de leur version sale, de toiles et de planches.
  // `zone` = [x, y, l, h] (dans le monde) : là où l'on clique.
  endroit(lieu, nom, images, zone, { planches = false, toiles = 2, cache = [] } = {}) {
    const [zx, zy, zl, zh] = zone;
    const sales = images.map(img => {
      const s = this.add.image(img.x, img.y, salir(this, img.texture.key)).setOrigin(img.originX, img.originY)
        .setScale(img.scaleX, img.scaleY).setDepth(img.depth + 0.01).setFlipX(img.flipX);
      if (img.decoupe) s.setCrop(...img.decoupe);
      if (img.isTinted) s.setTint(img.tintTopLeft);
      return s;
    });
    const ajouts = [];
    const coins = [[zx, zy, false, false], [zx + zl, zy, true, false], [zx, zy + zh, false, true], [zx + zl, zy + zh, true, true]];
    for (let k = 0; k < toiles; k++) {
      const [x, y, fx, fy] = coins[(k * 3 + nom.length) % 4];
      ajouts.push(this.add.image(x, y, 'toileAraignee').setOrigin(fx ? 1 : 0, fy ? 1 : 0).setFlip(fx, fy).setScale(2).setAlpha(0.85).setDepth(4));
    }
    if (planches) {
      ajouts.push(this.add.image(zx + zl / 2, zy + zh / 2, 'plancheClouee').setScale(zl / 56 * 1.1, 2.4).setAngle(16).setDepth(4));
      ajouts.push(this.add.image(zx + zl / 2, zy + zh / 2, 'plancheClouee').setScale(zl / 56 * 1.1, 2.4).setAngle(-14).setDepth(4));
    }
    cache.forEach(o => o.setAlpha(0));
    const e = { nom, sales, ajouts, cache, zone, propre: false };
    const cible = this.add.rectangle(zx + zl / 2, zy + zh / 2, zl, zh, 0xffffff, 0).setDepth(5).setInteractive({ useHandCursor: true });
    cible.on('pointerover', () => !e.propre && this.actif === lieu && sales.forEach(s => s.setTint(0xfff0c0)));
    cible.on('pointerout', () => sales.forEach((s, i) => (images[i].isTinted ? s.setTint(images[i].tintTopLeft) : s.clearTint())));
    cible.on('pointerdown', () => this.nettoyer(lieu, e));
    e.cible = cible;
    this.endroits[lieu].push(e);
    return e;
  }

  construireFacade() {
    const o = LIEUX_RENOVATION.facade;
    const g = this.add.graphics().setPosition(0, 0);
    dessinerComte(g, o, 0, 960, 470, 0.15);
    const sol = this.add.image(o, 470, pavesHD(this, 960, 70)).setOrigin(0).setScale(2);
    const f = dessinerFacade(this, o + 520, 470, this.G.nomShop);
    const z = f.zones;
    this.porteFacade = f.porteX;
    this.endroit('facade', 'Le toit', [f.image], z.toit, { toiles: 3 });
    if (z.etage) this.endroit('facade', "L'étage", [], z.etage, { toiles: 2 });
    this.endroit('facade', 'La fenêtre', [], z.fenetre, { planches: true, toiles: 1 });
    this.endroit('facade', "L'enseigne", [], z.enseigne, { toiles: 0, cache: [f.enseigne] });
    this.endroit('facade', 'La porte', [f.tonneaux], z.porte, { planches: true, toiles: 1 });
    this.endroit('facade', 'Le chemin', [sol], [o, 470, 960, 70], { toiles: 0 });
  }

  construireComptoir() {
    const o = LIEUX_RENOVATION.comptoir;
    const paysage = this.add.graphics();
    dessinerComte(paysage, o + FENETRE.x, FENETRE.y, FENETRE.w, FENETRE.h, 0);
    // Le mur, découpé autour de la fenêtre (on y voit le paysage) : quatre morceaux
    const morceaux = [[0, 0, 480, 10], [0, 125, 480, 45], [0, 10, 150, 115], [330, 10, 150, 115]].map(r => {
      const m = this.add.image(o, 0, 'murComptoir').setOrigin(0).setScale(2).setCrop(...r);
      m.decoupe = r;
      return m;
    });
    const fenetre = this.add.image(o + FENETRE.x - 16, FENETRE.y - 16, 'cadreFenetre').setOrigin(0).setScale(2);
    const ardoise = this.add.image(o + 20, 20, 'ardoiseComptoir').setOrigin(0).setScale(2);
    const parchemin = this.add.image(o + 685, 20, 'parcheminComptoir').setOrigin(0).setScale(2);
    const plateau = this.add.image(o, 340, plateauComptoir(this, 0)).setOrigin(0).setScale(2);
    const registre = this.add.image(o + 75, 368, 'registreComptoir').setScale(2);
    this.endroit('comptoir', 'Les murs', morceaux, [o, 254, 960, 84], { toiles: 2 });
    this.endroit('comptoir', 'La fenêtre', [fenetre], [o + FENETRE.x, FENETRE.y, FENETRE.w, FENETRE.h], { planches: true, toiles: 2 });
    this.endroit('comptoir', "L'ardoise", [ardoise], [o + 20, 20, 250, 230], { toiles: 1 });
    this.endroit('comptoir', 'Le tableau des commandes', [parchemin], [o + 685, 20, 260, 230], { toiles: 1 });
    this.endroit('comptoir', 'Le comptoir', [plateau], [o + 140, 350, 560, 190], { toiles: 2 });
    this.endroit('comptoir', 'Le registre', [registre], [o + 17, 340, 120, 60], { toiles: 0 });
  }

  construireArriere() {
    const o = LIEUX_RENOVATION.arriere;
    const mur = this.add.image(o, 0, murInterieur(this, 'murArriere', { poteaux: [272, 412], graine: 310 })).setOrigin(0).setScale(2).setTint(0xc8a47c);
    const sol = this.add.image(o, 440, plancher(this, 'plancherArriere', { graine: 410 })).setOrigin(0).setScale(2).setTint(0xd8bc98);
    const etagere = this.add.image(o + 20, 76, etagereHD(this, 0)).setOrigin(0).setScale(2);
    const coffre = this.add.image(o + 690, 446, coffreHD(this, 0)).setOrigin(0.5, 1).setScale(3);
    const buffet = this.add.image(o + 540, 498, 'buffetHD').setOrigin(0.5, 1).setScale(2);
    const porte = this.add.image(o + 900, 440, 'porteHD').setOrigin(0.5, 1).setScale(2);
    const panier = this.add.image(o + 330, 496, 'panierHD').setOrigin(0.5, 1).setScale(2);
    const lum = poserLuminaire(this, o + 640, 18, 0);
    this.endroit('arriere', 'Les murs et le plancher', [mur, sol], [o + 560, 230, 260, 200], { toiles: 3 });
    this.endroit('arriere', "L'étagère", [etagere], [o + 20, 76, 512, 364], { toiles: 3 });
    this.endroit('arriere', 'Le coffre', [coffre], [o + 636, 362, 108, 84], { toiles: 1 });
    this.endroit('arriere', 'Le vieux buffet', [buffet], [o + 488, 414, 104, 84], { toiles: 1 });
    this.endroit('arriere', 'La porte de la chambre', [porte], [o + 854, 272, 92, 168], { toiles: 1 });
    this.endroit('arriere', 'Le panier', [panier], [o + 282, 436, 96, 60], { toiles: 0 });
    this.endroit('arriere', 'La lumière', [lum.image], [o + 610, 100, 60, 80], { toiles: 0, cache: lum.halos });
  }

  construireChambre() {
    const o = LIEUX_RENOVATION.chambre;
    const fx = 640, fy = 60, fw = 200, fh = 150;
    this.add.image(o + fx, fy, paysageHD(this, fw, fh, 'comte', 0)).setOrigin(0).setDisplaySize(fw, fh);
    const mur = this.add.image(o, 0, murInterieur(this, 'murChambre', { h: SOL_CHAMBRE / 2, poteaux: [96, 400], graine: 320,
      fenetre: { x: fx / 2, y: fy / 2, l: fw / 2, h: fh / 2 } })).setOrigin(0).setScale(2).setTint(0xc8a47c);
    const sol = this.add.image(o, SOL_CHAMBRE, plancher(this, 'plancherChambre', { h: (540 - SOL_CHAMBRE) / 2, graine: 420 })).setOrigin(0).setScale(2).setTint(0xd8bc98);
    const lit = this.add.image(o + 250, SOL_CHAMBRE, litHD(this, 0)).setOrigin(0, 1).setScale(2);
    const couverture = this.add.image(o + 330, SOL_CHAMBRE - 92, couvertureHD(this, 0)).setOrigin(0).setScale(2);
    const chevet = this.add.image(o + 635, SOL_CHAMBRE, chevetHD(this, 0)).setOrigin(0.5, 1).setScale(2);
    const tapis = this.add.image(o + 440, SOL_CHAMBRE + 42, tapisHD(this, 0)).setScale(2);
    const coffre = this.add.image(o + 120, SOL_CHAMBRE + 4, coffreHD(this, 0)).setOrigin(0.5, 1).setScale(3);
    const b = bougie(this, o + 628, SOL_CHAMBRE - 62, { rayon: 200 });
    this.endroit('chambre', 'Les murs et le plancher', [mur, sol], [o + 0, 20, 600, 160], { toiles: 3 });
    this.endroit('chambre', 'La fenêtre', [], [o + fx, fy, fw, fh], { planches: true, toiles: 1 });
    this.endroit('chambre', 'Le lit', [lit, couverture], [o + 250, SOL_CHAMBRE - 124, 344, 124], { toiles: 1 });
    this.endroit('chambre', 'La table de chevet', [chevet, b.bougie], [o + 599, SOL_CHAMBRE - 100, 72, 100], { toiles: 0, cache: [b.flamme, b.halo] });
    this.endroit('chambre', 'Le tapis', [tapis], [o + 300, SOL_CHAMBRE + 22, 290, 40], { toiles: 0 });
    this.endroit('chambre', 'Le coffre', [coffre], [o + 66, SOL_CHAMBRE - 80, 108, 84], { toiles: 1 });
  }

  // --- Le nettoyage ---

  async nettoyer(lieu, e) {
    if (e.propre || this.actif !== lieu || this.occupe) return;
    this.occupe = true;
    const [zx, zy, zl, zh] = e.zone;
    const cx = zx + zl / 2;
    // JeuneGoy va jusqu'à l'endroit
    const xHeros = Phaser.Math.Clamp(cx, LIEUX_RENOVATION[lieu] + 40, LIEUX_RENOVATION[lieu] + 920);
    await this.marcher(this.heros, xHeros, 1.6);
    // Un nuage de poussière, un coup de chiffon...
    this.onomatopee(cx, Math.max(60, zy + zh / 2 - 30), Phaser.Utils.Array.GetRandom(['Frotte, frotte !', 'Pfff !', 'Tchac !', 'Hop !', 'Atchoum !']), '#f3d98a');
    for (let k = 0; k < 9; k++) {
      const p = this.add.image(zx + Math.random() * zl, zy + Math.random() * zh, 'halo').setScale(0.3).setTint(0xb8a888).setAlpha(0.8).setDepth(7);
      this.tweens.add({ targets: p, scale: 1 + Math.random(), alpha: 0, y: p.y - 30, duration: 700 + Math.random() * 400, onComplete: () => p.destroy() });
    }
    this.tweens.add({ targets: this.heros, angle: { from: -8, to: 8 }, duration: 90, yoyo: true, repeat: 3, onComplete: () => this.heros.setAngle(0) });
    await this.attendre(350);
    // ... et l'endroit retrouve sa beauté
    e.propre = true;
    e.cible.disableInteractive();
    if (e.indice) { e.indice.destroy(); e.indice = null; }
    this.tweens.add({ targets: e.sales, alpha: 0, duration: 500 });
    e.ajouts.forEach((a, i) => this.tweens.add({ targets: a, y: a.y + 300, angle: a.angle + 40, alpha: 0, duration: 700, delay: i * 60, ease: 'Quad.easeIn' }));
    e.cache.forEach(c => this.tweens.add({ targets: c, alpha: c.texture && c.texture.key === 'halo' ? 0.5 : 1, duration: 500 }));
    creerObjetsHD(this);
    for (let k = 0; k < 5; k++) {
      const s = this.add.image(zx + Math.random() * zl, zy + Math.random() * zh, 'eclat').setScale(0).setDepth(7);
      this.tweens.add({ targets: s, scale: 3, angle: 90, duration: 260, delay: 200 + k * 90, yoyo: true, onComplete: () => s.destroy() });
    }
    await this.attendre(500);
    this.occupe = false;
    this.majConsigne();
    if (this.endroits[lieu].every(x => x.propre) && this.finLieu) { const f = this.finLieu; this.finLieu = null; f(); }
  }

  majConsigne() {
    const liste = this.endroits[this.actif] || [];
    const restants = liste.filter(e => !e.propre).length;
    this.consigne.setText(restants ? `Clique sur ce qui est délabré pour le remettre à neuf · encore ${restants}` : '');
  }

  // Le joueur rénove un lieu : on attend que tout soit propre.
  renover(lieu) {
    this.actif = lieu;
    this.majConsigne();
    const boite = [this.boite, this.entete, this.texte, this.indice];
    boite.forEach(o => o.setVisible(false));
    this.bulle.setText(`${this.entete.text} : ${this.texte.text}`).setVisible(true);
    // Les endroits encore sales clignotent doucement, pour aider à les trouver
    // Chaque endroit à nettoyer est entouré d'un cadre doré qui pulse, avec un petit balai
    for (const e of this.endroits[lieu]) {
      const [zx, zy, zl, zh] = e.zone;
      const c = this.add.container(0, 0).setDepth(5);
      const cadre = this.add.graphics();
      cadre.lineStyle(4, 0x1a0e06, 0.6).strokeRoundedRect(zx + 2, zy + 2, zl - 4, zh - 4, 8);
      cadre.lineStyle(2, 0xffd860, 1).strokeRoundedRect(zx + 2, zy + 2, zl - 4, zh - 4, 8);
      const balai = this.add.text(zx + zl / 2, zy + Math.min(zh / 2, 40), '🧹', style(26, '#ffffff')).setOrigin(0.5);
      const nom = this.add.text(zx + zl / 2, zy + Math.min(zh / 2, 40) + 26, e.nom, style(13, '#fff4dc', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 4 })).setOrigin(0.5);
      c.add([cadre, balai, nom]);
      this.tweens.add({ targets: cadre, alpha: 0.35, duration: 650, yoyo: true, repeat: -1 });
      this.tweens.add({ targets: balai, angle: { from: -15, to: 15 }, y: balai.y - 4, duration: 420, yoyo: true, repeat: -1, delay: Math.random() * 400 });
      e.indice = c;
    }
    return new Promise(resoudre => {
      this.finLieu = () => {
        for (const e of this.endroits[lieu]) if (e.indice) e.indice.destroy();
        resoudre();
      };
    }).then(() => {
      this.actif = null;
      this.bulle.setVisible(false);
      [this.boite, this.entete, this.texte].forEach(o => o.setVisible(true));
    });
  }

  // Passer d'un lieu à l'autre : fondu, la caméra change de lieu, les deux personnages entrent.
  async allerA(lieu, entree = 120) {
    await this.animer({ targets: this.cameras.main, alpha: 0, duration: 350 });
    this.cameras.main.setScroll(LIEUX_RENOVATION[lieu], 0);
    const sol = lieu === 'facade' ? 470 : lieu === 'chambre' ? SOL_CHAMBRE : lieu === 'arriere' ? 440 : 530;
    this.heros.setPosition(LIEUX_RENOVATION[lieu] + entree, sol).setFlipX(false);
    this.garrick.setPosition(LIEUX_RENOVATION[lieu] + entree - 60, sol).setFlipX(false);
    // Au comptoir, on est derrière le plateau : on ne voit pas les personnages
    this.heros.setVisible(lieu !== 'comptoir');
    this.garrick.setVisible(lieu !== 'comptoir');
    await this.animer({ targets: this.cameras.main, alpha: 1, duration: 350 });
  }

  // --- Le déroulé ---

  async derouler() {
    const G = this.G;
    const petit = nomJoueur(G, 'petit');
    const garrick = 'Garrick Cœur-de-Chêne';
    // L'arrivée devant l'auberge abandonnée
    this.cameras.main.setScroll(LIEUX_RENOVATION.facade, 0);
    this.ecrire('', 'Garrick t\'emmena au bout du village, devant une vieille auberge abandonnée depuis des années...');
    await Promise.all([this.marcher(this.heros, LIEUX_RENOVATION.facade + 200, 4), this.marcher(this.garrick, LIEUX_RENOVATION.facade + 140, 4)]);
    if (this.fini) return;
    this.ecrire(garrick, `« Et voilà ton shop, ${petit} ! Bon... il a un peu souffert. Mais avec de l'huile de coude, il sera magnifique. Au travail ! »`);
    await this.attendreClic();
    this.ecrire(garrick, '« Commence par la façade : décloue les planches, chasse les toiles d\'araignée, remets l\'enseigne. »');
    await this.renover('facade');
    if (this.fini) return;
    // La porte grince...
    this.onomatopee(this.porteFacade, 380, 'Griiiiinc...', '#c8c0b0');
    this.ecrire(garrick, '« Ha ! Déjà beaucoup mieux. Entrons... attention à la poussière. »');
    await this.attendre(1300);
    if (this.fini) return;
    await this.allerA('comptoir');
    this.ecrire(garrick, '« Le comptoir ! C\'est ici que tu serviras les aventuriers, par cette fenêtre. Il y a du travail... »');
    await this.renover('comptoir');
    if (this.fini) return;
    await this.allerA('arriere', 860);
    this.ecrire(garrick, '« L\'arrière-boutique : tes étagères, ton coffre, et la porte de ta chambre. Une bonne araignée y a élu domicile... »');
    await this.renover('arriere');
    if (this.fini) return;
    await this.allerA('chambre', 880);
    this.ecrire(garrick, '« Et ta chambre ! Un lit, une fenêtre sur les collines... Tu seras bien, ici. »');
    await this.renover('chambre');
    if (this.fini) return;
    await this.visite();
  }

  // Le shop restauré, filmé de gauche à droite : chambre, arrière-boutique, comptoir, façade.
  async visite() {
    const G = this.G;
    this.consigne.setText('');
    await this.animer({ targets: this.cameras.main, alpha: 0, duration: 400 });
    this.heros.setVisible(false);
    this.garrick.setVisible(false);
    this.cameras.main.setScroll(0, 0);
    this.boite.setVisible(false); this.entete.setVisible(false); this.texte.setVisible(false);
    const titre = this.add.text(480, 60, 'Quelques jours de travail plus tard...', style(28, '#fff4dc', { fontStyle: 'bold italic', stroke: '#1a0e06', strokeThickness: 6 }))
      .setOrigin(0.5).setScrollFactor(0).setDepth(20).setAlpha(0);
    await this.animer({ targets: this.cameras.main, alpha: 1, duration: 600 });
    this.tweens.add({ targets: titre, alpha: 1, duration: 600, hold: 2200, yoyo: true });
    // Comme si l'on tournait la tête : des bandes noires de cinéma, des poteaux au premier plan qui
    // défilent plus vite que les pièces (la profondeur), un léger recul de la caméra à chaque passage,
    // et une pause au milieu de chaque pièce.
    const bandes = [0, 540].map(y => this.add.rectangle(480, y, 960, 70, 0x000000).setScrollFactor(0).setDepth(19));
    this.tweens.add({ targets: bandes[0], y: 20, duration: 800 });
    this.tweens.add({ targets: bandes[1], y: 520, duration: 800 });
    const vignetteVisite = vignette(this, 0.55, 18).setScrollFactor(0);
    const pf = 1.4;
    for (const J of [960, 1920, 2880]) {
      const x = 480 + (J - 480) * pf;
      const poteau = this.add.image(x, 0, 'murComptoir').setOrigin(0.5, 0).setCrop(140, 0, 9, 170).setScale(5, 3.2).setScrollFactor(pf, 1).setDepth(17).setTint(0x3a2a1c);
      poteau.setPosition(x - 140 * 5 - 22, 0);
    }
    for (const centre of [960, 1920, 2880]) {
      this.tweens.add({ targets: this.cameras.main, zoom: 0.93, duration: 1300, yoyo: true, ease: 'Sine.easeInOut' });
      await this.animer({ targets: this.cameras.main, scrollX: centre, duration: 2600, ease: 'Sine.easeInOut' });
      if (this.fini) return;
      await this.attendre(centre === 2880 ? 200 : 900);
    }
    this.tweens.add({ targets: bandes[0], y: -40, duration: 600 });
    this.tweens.add({ targets: bandes[1], y: 580, duration: 600 });
    this.tweens.add({ targets: vignetteVisite, alpha: 0, duration: 600 });
    if (this.fini) return;
    // Devant la façade, tout le monde est fier
    this.heros.setPosition(2880 + 230, 470).setVisible(true).setFlipX(false);
    this.garrick.setPosition(2880 + 160, 470).setVisible(true).setFlipX(false);
    this.onomatopee(2880 + 520, 160, 'TADAAA !', '#f3d98a');
    this.boite.setVisible(true); this.entete.setVisible(true); this.texte.setVisible(true);
    this.ecrire('Garrick Cœur-de-Chêne', `« Magnifique ! « ${G.nomShop} » est prêt à ouvrir. Demain, je reste avec toi pour ta première journée : je te montrerai tout. »`);
    await this.attendreClic();
    this.finir();
  }

  finir() {
    if (this.fini) return;
    this.fini = true;
    this.G.tuto = true;
    commencerJournee(this, false, false);
  }
}
