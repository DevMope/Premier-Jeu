// Le vrai début : Garrick t'emmène devant ton futur shop... une vieille auberge abandonnée,
// sous la poussière et les toiles d'araignée. Tu la remets à neuf, endroit par endroit, en
// cliquant sur ce qui est délabré (la façade, le comptoir, l'arrière-boutique, la chambre).
// Puis on découvre le shop restauré, filmé de gauche à droite, et la première journée commence.
//
// Les quatre lieux sont posés côte à côte dans un monde de 3840 pixels :
// la chambre (0), l'arrière-boutique (960), le comptoir (1920), la façade (2880).

const LIEUX_RENOVATION = { chambre: 0, arriere: 960, comptoir: 1920, facade: 2880 };
const NOMS_PIECES = { facade: 'La façade', comptoir: 'Le comptoir', arriere: "L'arrière-boutique", chambre: 'La chambre' };

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
    this.occupe = false;
    const G = this.G = window.GAME;
    this.fini = false;
    this.cameras.main.fadeIn(600);
    // (pas de setBounds : avec le zoom haute résolution, Phaser décalait toute la scène)
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
    this.heros = this.add.image(LIEUX_RENOVATION.facade - 60, 470, 'joueur_petit').setOrigin(0.5, 1).setScale(echelleJoueur(6)).setDepth(6);
    this.garrick = imageCorps(this, LIEUX_RENOVATION.facade - 120, 470, 'mentor', 6).setDepth(6);
    this.ombreSol(this.heros); this.ombreSol(this.garrick);
    this.creerBoiteTexte();
    this.consigne = this.add.text(480, 20, '', style(16, '#fff4dc', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 5, align: 'center' }))
      .setOrigin(0.5, 0).setScrollFactor(0).setDepth(20);
    // Pendant le nettoyage, Garrick parle dans une bulle en haut (la boîte du bas cacherait la pièce).
    this.bulle = this.add.text(480, 52, '', style(14, '#3b2410', { fontStyle: 'italic', backgroundColor: '#ead9b0ee', padding: { x: 10, y: 6 },
      wordWrap: { width: 760 }, align: 'center' })).setOrigin(0.5, 0).setScrollFactor(0).setDepth(20).setVisible(false);
    this.guide = typeof didacticiel === 'function' && didacticiel(G);
    this.boutonPasser(() => this.finir()).setText('Laisser faire les ouvriers ▶▶');
    this.derouler();
  }

  // --- Les quatre lieux, chacun avec ses endroits délabrés ---

  // Un endroit : ses images propres, recouvertes de leur version sale, de toiles et de planches.
  // `zone` = [x, y, l, h] (dans le monde) : là où l'on clique.
  endroit(lieu, nom, images, zone, { planches = false, toiles = 2, cache = [] } = {}) {
    const [zx, zy, zl, zh] = zone;
    const sales = images.map(img => {
      // La version sale est posée juste au-dessus de l'objet propre (et pas plus haut : sinon le
      // mur encore sale recouvrait les meubles déjà nettoyés, qui semblaient disparaître).
      const s = this.add.image(img.x, img.y, salir(this, img.texture.key)).setOrigin(img.originX, img.originY)
        .setScale(img.scaleX, img.scaleY).setDepth(img.depth).setFlipX(img.flipX);
      if (img.parentContainer) img.parentContainer.addAt(s, img.parentContainer.getIndex(img) + 1);
      else {
        // (moveAbove de Phaser ne fait rien si l'objet est déjà plus haut : on le replace à la main)
        const liste = this.children.list;
        liste.splice(liste.indexOf(s), 1);
        liste.splice(liste.indexOf(img) + 1, 0, s);
      }
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
    const f = dessinerFacade(this, o + 520, 470, this.G.nomShop, undefined, { etage: false });
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

  // La vague : chaque endroit de la pièce se nettoie à son tour, de gauche à droite
  async nettoyerPiece(lieu) {
    if (this.occupe || this.actif !== lieu) return;
    this.occupe = true;
    if (this.cadrePiece) { this.cadrePiece.destroy(); this.cadrePiece = null; }
    for (const e of this.endroits[lieu]) e.sales.forEach(x => x.clearTint());
    const liste = this.endroits[lieu].filter(e => !e.propre).sort((a, b) => a.zone[0] - b.zone[0]);
    if (this.heros.visible) await this.marcher(this.heros, LIEUX_RENOVATION[lieu] + 470, 2.2);
    this.onomatopee(LIEUX_RENOVATION[lieu] + 480, 200, 'Frotte, frotte !', '#f3d98a');
    for (const e of liste) { this.nettoyerEndroit(e); await this.attendre(260); }
    await this.attendre(700);
    this.occupe = false;
    if (this.finLieu) { const f = this.finLieu; this.finLieu = null; f(); }
  }

  // Un endroit retrouve sa beauté : la poussière, le coup de chiffon, les éclats
  nettoyerEndroit(e) {
    const [zx, zy, zl, zh] = e.zone;
    for (let k = 0; k < 9; k++) {
      const p = this.add.image(zx + Math.random() * zl, zy + Math.random() * zh, 'halo').setScale(0.3).setTint(0xb8a888).setAlpha(0.8).setDepth(7);
      this.tweens.add({ targets: p, scale: 1 + Math.random(), alpha: 0, y: p.y - 30, duration: 700 + Math.random() * 400, onComplete: () => p.destroy() });
    }
    if (this.heros.visible) this.tweens.add({ targets: this.heros, angle: { from: -8, to: 8 }, duration: 90, yoyo: true, repeat: 1, onComplete: () => this.heros.setAngle(0) });
    e.propre = true;
    e.cible.disableInteractive();
    if (e.indice) { e.indice.destroy(); e.indice = null; }
    this.tweens.add({ targets: e.sales, alpha: 0, duration: 500 });
    e.ajouts.forEach((a, i) => this.tweens.add({ targets: a, y: a.y + 300, angle: a.angle + 40, alpha: 0, duration: 700, delay: i * 60, ease: 'Quad.easeIn' }));
    e.cache.forEach(c => this.tweens.add({ targets: c, alpha: c.texture && c.texture.key === 'halo' ? 0.5 : 1, duration: 500 }));
    creerObjetsHD(this);
    for (let k = 0; k < 4; k++) {
      const s = this.add.image(zx + Math.random() * zl, zy + Math.random() * zh, 'eclat').setScale(0).setDepth(7);
      this.tweens.add({ targets: s, scale: 3, angle: 90, duration: 260, delay: 200 + k * 90, yoyo: true, onComplete: () => s.destroy() });
    }
    Son.jouer('glisse');
  }

  majConsigne() { this.consigne.setText(''); }

  // (v1.40, planche 67) Une pièce, un clic : un grand cadre doré autour de toute la pièce ; au clic, une vague
  // de propreté la traverse, endroit après endroit, pendant que Garrick explique à quoi elle sert.
  renover(lieu) {
    this.actif = lieu;
    this.majConsigne();
    const boite = [this.boite, this.entete, this.texte, this.indice];
    boite.forEach(o => o.setVisible(false));
    if (this.defile) this.defile.finir();
    this.bulle.setText(`${this.entete.text} : ${this.texteComplet ?? this.texte.text}`).setVisible(true);
    const ordre = ['facade', 'comptoir', 'arriere', 'chambre'];
    if (this.rubanPieces) this.rubanPieces.destroy();
    this.rubanPieces = etapesGuide(this, 22, ordre.map(k => NOMS_PIECES[k]), ordre.indexOf(lieu), 'Remettre à neuf :', 20);
    this.rubanPieces.x = -90;
    for (const e of this.endroits[lieu]) e.cible.disableInteractive();
    const o = LIEUX_RENOVATION[lieu], zs = this.endroits[lieu].filter(e => e.nom !== 'Le chemin').map(e => e.zone);
    const x0 = Math.max(o + 8, Math.min(...zs.map(z => z[0])) - 12), x1 = Math.min(o + 952, Math.max(...zs.map(z => z[0] + z[2])) + 12);
    const y0 = Math.max(96 + this.bulle.height, Math.min(...zs.map(z => z[1])) - 12), y1 = Math.min(530, Math.max(...zs.map(z => z[1] + z[3])) + 12);
    const c = this.cadrePiece = this.add.container(0, 0).setDepth(5);
    const cadre = this.add.graphics();
    cadre.lineStyle(6, 0x1a0e06, 0.6).strokeRoundedRect(x0, y0, x1 - x0, y1 - y0, 10);
    cadre.lineStyle(3, 0xffd860, 1).strokeRoundedRect(x0, y0, x1 - x0, y1 - y0, 10);
    creerGlyphesHD(this);
    const cx = (x0 + x1) / 2, cy = Math.min(y0 + 40, (y0 + y1) / 2);
    const balai = this.add.image(cx, cy, 'glyphe_balai').setScale(3);
    const nom = this.add.text(cx, cy + 30, `${NOMS_PIECES[lieu]}\nclique pour la remettre à neuf`, style(15, '#fff4dc', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 5, align: 'center' })).setOrigin(0.5, 0);
    c.add([cadre, balai, nom]);
    this.tweens.add({ targets: cadre, alpha: 0.4, duration: 650, yoyo: true, repeat: -1 });
    this.tweens.add({ targets: balai, angle: { from: -15, to: 15 }, y: balai.y - 4, duration: 420, yoyo: true, repeat: -1 });
    const cible = this.add.rectangle((x0 + x1) / 2, (y0 + y1) / 2, x1 - x0, y1 - y0, 0xffffff, 0).setDepth(5).setInteractive({ useHandCursor: true });
    c.add(cible);
    cible.on('pointerover', () => { for (const e of this.endroits[lieu]) if (!e.propre) e.sales.forEach(x => x.setTint(0xfff0c0)); });
    cible.on('pointerout', () => { for (const e of this.endroits[lieu]) e.sales.forEach(x => x.clearTint()); });
    cible.on('pointerdown', () => this.nettoyerPiece(lieu));
    return new Promise(resoudre => {
      this.finLieu = () => {
        for (const e of this.endroits[lieu]) if (e.indice) e.indice.destroy();
        if (this.cadrePiece) { this.cadrePiece.destroy(); this.cadrePiece = null; }
        if (lieu === 'chambre' && this.rubanPieces) { this.rubanPieces.destroy(); this.rubanPieces = null; }
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
    this.aLEchelle(lieu);
    // Au comptoir, on est derrière le plateau : on ne voit pas les personnages
    this.heros.setVisible(lieu !== 'comptoir');
    this.garrick.setVisible(lieu !== 'comptoir');
    await this.animer({ targets: this.cameras.main, alpha: 1, duration: 350 });
  }

  // Les personnages à l'échelle des portes : dehors (porte de 112 px), un adulte en fait ~96 ;
  // dedans, les portes font 168 px, un adulte en fait ~140.
  aLEchelle(lieu) {
    const e = lieu === 'facade' ? 6 : 8.6;
    this.heros.setScale(echelleJoueur(e));
    this.garrick.setScale(e * echelleCorps(this.garrick.texture.key));
  }

  // --- Le déroulé ---

  // (v0.58) Garrick parle : il se tourne vers toi, avec sa voix, son humeur et un geste ; tu le
  // regardes ; s'il imagine quelque chose, une bulle de pensée s'ouvre au-dessus de lui.
  garrickDit(texte, o = {}) {
    const visible = this.garrick.visible;
    if (this.pense) { this.fermerPensee(this.pense); this.pense = null; }
    this.replique('Garrick Cœur-de-Chêne', texte, { ...o, sprite: visible ? this.garrick : null, vers: visible ? this.heros : null, personne: { nom: 'Garrick', race: 'humain' }, quoi: 'mentor', attendre: false });
    if (visible && o.pensee) this.pense = this.pensee(this.garrick, o.pensee, { echelle: 2.4 });
  }

  async derouler() {
    const G = this.G;
    const petit = nomJoueur(G, 'petit');
    const garrick = 'Garrick Cœur-de-Chêne';
    // L'arrivée devant l'auberge abandonnée
    this.cameras.main.setScroll(LIEUX_RENOVATION.facade, 0);
    this.boiteEnHaut(true); // (dehors, c'est le shop qu'on découvre : le texte ne doit pas le cacher)
    this.ecrire('', 'Garrick t\'emmena au bout du village, devant une vieille auberge abandonnée depuis des années...');
    await Promise.all([this.marcher(this.heros, LIEUX_RENOVATION.facade + 200, 4), this.marcher(this.garrick, LIEUX_RENOVATION.facade + 140, 4)]);
    if (this.fini) return;
    this.garrickDit(`« Et voilà ton comptoir, ${petit} ! Bon... il a un peu souffert. Mais avec de l'huile de coude, il sera magnifique. Au travail ! »`, { ton: 'content', emotion: 'joie', geste: 'bras' });
    await this.attendreClic();
    this.garrickDit(this.guide ? "« La façade, c'est ce que voient les passants. Une façade qui tient debout, et ils s'arrêtent. Un clic, et on s'y met tous les deux ! »" : '« Commence par la façade : décloue les planches, chasse les toiles d\'araignée, remets l\'enseigne. »', { ton: 'neutre', geste: 'hoche' });
    await this.renover('facade');
    if (this.fini) return;
    // La porte grince...
    this.onomatopee(this.porteFacade, 380, 'Griiiiinc...', '#c8c0b0');
    this.garrickDit('« Ha ! Déjà beaucoup mieux. Entrons... attention à la poussière. »', { ton: 'rire', emotion: 'joie' });
    await this.attendreClic();
    if (this.fini) return;
    this.boiteEnHaut(false);
    await this.allerA('comptoir');
    this.garrickDit(this.guide ? "« Le comptoir, c'est ton cœur de métier. Par cette fenêtre, les aventuriers te passent commande : tu remplis leur baluchon. S'ils reviennent vivants, ils te reversent une part du butin. S'ils meurent... tu as tout perdu avec eux. »" : '« Le comptoir ! C\'est ici que tu serviras les aventuriers, par cette fenêtre. Il y a du travail... »', { ton: 'etonne', emotion: '!' });
    await this.renover('comptoir');
    if (this.fini) return;
    // (après chaque pièce, Garrick prend le temps d'un mot : rien ne s'enchaîne tout seul)
    this.garrickDit('« Voilà un comptoir qui a de l\'allure ! Les aventuriers vont se bousculer à cette fenêtre. Passons derrière. »', { ton: 'content', emotion: 'merci', geste: 'hoche' });
    await this.attendreClic();
    if (this.fini) return;
    await this.allerA('arriere', 860);
    this.garrickDit(this.guide ? "« L'arrière-boutique : ta réserve sur les étagères, ta fortune dans le coffre. Ce qui manque sur l'étagère manquera au comptoir : jette un œil chaque soir. »" : '« L\'arrière-boutique : tes étagères, ton coffre, et la porte de ta chambre. Une bonne araignée y a élu domicile... »', { ton: 'inquiet', emotion: '…' });
    await this.renover('arriere');
    if (this.fini) return;
    this.garrickDit('« Tes étagères brillent comme un sou neuf ! Et ce coffre... il attend tes premières pièces d\'or. Il ne reste que ta chambre. »', { ton: 'content', emotion: 'idee', pensee: 'pieceFace' });
    await this.attendreClic();
    if (this.fini) return;
    await this.allerA('chambre', 880);
    this.garrickDit(this.guide ? "« Et ta chambre. Une bonne nuit, et tu seras en forme demain : plus vif au comptoir. Le soir, c'est ici que la journée se termine. »" : '« Et ta chambre ! Un lit, une fenêtre sur les collines... Tu seras bien, ici. »', { ton: 'content', emotion: '♥' });
    await this.renover('chambre');
    if (this.fini) return;
    this.garrickDit('« Tout est propre, du toit à la cave ! Viens, on fait le tour du propriétaire. »', { ton: 'rire', emotion: 'joie', geste: 'saut' });
    await this.attendreClic();
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
    // Comme un livre d'images : un cadre de cuir aux coins dorés autour de l'écran, et chaque
    // pièce restaurée est une page qu'on tourne.
    const cadre = this.add.image(0, 0, cadreLivreHD(this)).setOrigin(0).setScale(2).setScrollFactor(0).setDepth(19).setAlpha(0);
    const legende = this.add.text(480, 506, '', style(17, '#3b2410', { fontStyle: 'bold italic', backgroundColor: '#e8d8b0', padding: { x: 14, y: 4 } }))
      .setOrigin(0.5).setScrollFactor(0).setDepth(20).setAlpha(0);
    const numero = this.add.text(900, 506, '', style(13, '#f3d98a', { fontStyle: 'italic' })).setOrigin(0.5).setScrollFactor(0).setDepth(20).setAlpha(0);
    this.tweens.add({ targets: [cadre, legende, numero], alpha: 1, duration: 800 });
    const pages = [[0, 'Pièce 1 · Ta chambre'], [960, "Pièce 2 · L'arrière-boutique"], [1920, 'Pièce 3 · Le comptoir'], [2880, 'Pièce 4 · La façade']];
    for (let i = 0; i < pages.length; i++) {
      const [x, nom] = pages[i];
      if (i > 0) await this.tournerPage(() => this.cameras.main.setScroll(x, 0));
      if (this.fini) return;
      legende.setText(nom);
      numero.setText(`— ${i + 1} —`);
      await this.attendre(i === pages.length - 1 ? 1200 : 2300);
      if (this.fini) return;
    }
    this.tweens.add({ targets: [cadre, legende, numero], alpha: 0, duration: 600 });
    if (this.fini) return;
    // Devant la façade, tout le monde est fier
    this.heros.setPosition(2880 + 230, 470).setVisible(true).setFlipX(false);
    this.garrick.setPosition(2880 + 160, 470).setVisible(true).setFlipX(false);
    this.aLEchelle('facade');
    this.onomatopee(2880 + 520, 160, 'TADAAA !', '#f3d98a');
    this.geste(this.heros, 'saut'); this.emotion(this.heros, '♥');
    this.time.delayedCall(900, () => { this.regarderVers(this.garrick, this.heros); this.regarderVers(this.heros, this.garrick); Son.jouer('voix', { personne: { nom: 'Garrick', race: 'humain' }, ton: 'content', duree: 1.6 }); this.emotion(this.garrick, 'joie'); });
    // (Garrick parle dans la boîte de dialogue habituelle, en haut : en bas, elle cacherait les deux
    // fiers rénovateurs ; v0.68 : plus de bulle d'un autre style)
    this.boiteEnHaut(true);
    [this.boite, this.entete, this.texte].forEach(o => o.setVisible(true));
    this.ecrire('Garrick Cœur-de-Chêne', `« Magnifique ! “${G.nomShop}” est prêt à ouvrir. Demain, je reste avec toi pour ta première journée : je te montrerai tout. »`);
    // (v1.43, planche 70) avec le didacticiel : Garrick montre les boutons, en sapin brut comme la maison
    if (this.guide && typeof pierreSeule === 'function') {
      await this.attendreSuite('▶ Suite');
      if (this.fini) return;
      this.ecrire('Garrick Cœur-de-Chêne', "« Et tes boutons, tu les as vus ? Du sapin brut, comme ta maison. Embellis-la, et eux aussi s'embelliront : un jour, des pierres précieuses, une couleur pour chaque chose. »");
      const pierres = [['rubis', 'tes actions'], ['emeraude', 'ta réserve'], ['saphir', 'toi']].map(([m, quoi], i) => {
        const x = 330 + i * 150, img = this.add.image(x, 214, pierreSeule(this, m, 13, 3)).setScale(3).setScrollFactor(0).setDepth(20).setAlpha(0);
        const t = this.add.text(x, 250, quoi, style(13, '#fff4dc', { fontStyle: 'bold', stroke: '#140c06', strokeThickness: 3 })).setOrigin(0.5).setScrollFactor(0).setDepth(20).setAlpha(0);
        this.tweens.add({ targets: [img, t], alpha: 1, delay: 300 + i * 250, duration: 400 });
        this.tweens.add({ targets: img, y: 210, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: i * 200 });
        return [img, t];
      });
      await this.attendreSuite('▶ Clique pour commencer');
      pierres.flat().forEach(o => o.destroy());
    } else await this.attendreSuite('▶ Clique pour commencer');
    this.finir();
  }

  // Une page qui tourne : elle se soulève à droite, balaie l'écran vers la gauche (on change de
  // pièce pendant qu'elle cache tout), puis retombe à gauche et dévoile la page suivante.
  async tournerPage(changer) {
    const page = this.add.rectangle(960, 270, 960, 540, 0xeadcb4).setOrigin(1, 0.5).setScale(0, 1).setScrollFactor(0).setDepth(18.5);
    const pli = this.add.rectangle(960, 270, 22, 540, 0x8a6a3a, 0.5).setOrigin(0.5).setScrollFactor(0).setDepth(18.6);
    const ombre = this.add.rectangle(960, 270, 40, 540, 0x000000, 0.25).setOrigin(0, 0.5).setScrollFactor(0).setDepth(18.4);
    this.onomatopee(780, 140, 'Frrrt !', '#fff4dc');
    await this.animer({ targets: page, scaleX: 1, duration: 520, ease: 'Sine.easeIn', onUpdate: () => {
      const bord = 960 - page.scaleX * 960;
      pli.setX(bord + 11); ombre.setX(bord - 40);
    } });
    changer();
    page.setOrigin(0, 0.5).setX(0);
    await this.animer({ targets: page, scaleX: 0, duration: 520, ease: 'Sine.easeOut', onUpdate: () => {
      const bord = page.scaleX * 960;
      pli.setX(bord - 11); ombre.setX(bord);
      ombre.setAlpha(page.scaleX * 0.6);
    } });
    for (const o of [page, pli, ombre]) o.destroy();
  }

  finir() {
    if (this.fini) return;
    this.fini = true;
    // (v1.40) le didacticiel : le Jour Zéro (la visite, le premier client guidé) ; sinon, on ouvre au jour 1
    if (this.guide) return lancerJourZero(this);
    this.G.tuto = false;
    commencerJournee(this, false, false);
  }
}
