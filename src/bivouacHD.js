// (v1.34, planche 59) Les gestes du bivouac, dans les récits : l'aventurier mange vraiment sa ration (assis sur un
// rondin, la main à la bouche, des bouchées qui la font rapetisser), boit à sa gourde (le coude levé, la gourde
// renversée sur les lèvres), se réchauffe les mains au feu (assis, les deux mains tendues) et dort près des braises (les
// yeux fermés, sa cape en couverture). De vraies poses du moteur des corps : jamais de bras en plus.
Object.assign(StoryScene.prototype, {
  // Changer de pose sans bouger les pieds (assis : posé par les pieds, devant le rondin)
  poserPose(pose = null) {
    const p = this.perso, cle = this.cleCorps(pose);
    p.setTexture(cle).setOrigin(0.5, PIEDS_ASSIS[cle] ? (PIEDS_ASSIS[cle] + 1) / p.height : 1);
    return cle;
  },
  // Un objet tenu dans la vraie main de la pose (il la suit d'une pose à l'autre)
  tenirEnMain(cleImage, { echelle = 2.2, angle = 0, dx = 0, dy = 0, reel = null } = {}) {
    const p = this.perso;
    // (retours planche 86) le vrai dessin de l'objet (ration, gourde), à l'échelle, tenu par la vraie main de la pose
    const idObjet = typeof cleImage === 'string' && cleImage.startsWith('hd_') ? cleImage.slice(3) : null;
    if (idObjet && OBJETS_MAIN[idObjet]) {
      const pos = () => {
        const m = MAINS_XY[p.texture.key.replace(/_pas[12]$/, '')] || { x: 14, y: 40 }, s = p.flipX ? -1 : 1, bas = p.y + (1 - p.originY) * p.displayHeight;
        return { x: p.x + m.x * Math.abs(p.scaleX) * s, y: bas - m.y * Math.abs(p.scaleY) };
      };
      const r = imageObjetMain(this, idObjet, p, pos, { angle: reel === null ? 0 : reel });
      const o = this.garder(r.o); this.chaqueImage(r.suivre);
      return o;
    }
    const o = this.garder(this.add.image(0, 0, cleImage).setScale(echelle).setAngle(angle));
    o.dx = dx; o.dy = dy;
    const suivre = () => {
      if (!o.active || !p.active || o.libre) return;
      const m = MAINS_XY[p.texture.key.replace(/_pas[12]$/, '')], s = p.flipX ? -1 : 1;
      if (!m) return;
      // (l'origine du sprite peut être aux pieds assis : on repart du bas de l'image)
      const bas = p.y + (1 - p.originY) * p.displayHeight;
      o.setPosition(p.x + (m.x * p.scaleX + o.dx) * s, bas - m.y * p.scaleY + o.dy).setFlipX(p.flipX).setDepth(p.depth + 0.05);
    };
    suivre(); this.chaqueImage(suivre);
    return o;
  },
  // Le rondin où l'on s'assoit, au bord du feu
  rondin(x) {
    const g = this.garder(this.add.graphics().setDepth(2.5));
    g.fillStyle(0x2a1a0e).fillRoundedRect(x - 46, SOL_RECIT - 30, 92, 32, 12).fillStyle(0x6a4424).fillRoundedRect(x - 43, SOL_RECIT - 27, 86, 26, 10);
    for (let i = 0; i < 5; i++) g.fillStyle(0x4a2e18).fillRect(x - 36 + i * 17, SOL_RECIT - 24, 9, 2);
    g.fillStyle(0xc89a60).fillEllipse(x + 40, SOL_RECIT - 14, 12, 24).fillStyle(0x8a6034).fillEllipse(x + 40, SOL_RECIT - 14, 6, 13);
    return g;
  },
  // Il mange sa ration : assis sur le rondin, il la sort du sac, mord dedans trois fois ; elle rapetisse
  async bivouacManger() {
    const p = this.perso;
    this.poserPose('assis');
    const r = this.tenirEnMain(iconeObjet(this, 'ration'), { echelle: 1.8, dx: 6, dy: -6 });
    await this.attendre(400);
    for (let i = 0; i < 3; i++) {
      this.poserPose('mangeAssis');
      await this.animer({ targets: p, y: p.y + 2, duration: 140, yoyo: true });
      this.onomatopee(p.x + (p.flipX ? -40 : 40), p.y - p.displayHeight * 0.95, i === 2 ? 'Miam !' : 'Crounch', '#f3d98a');
      if (r.objetMain) r.reduit = 1 - (i + 1) * 0.24; else r.setScale(1.8 * (1 - (i + 1) * 0.24));   // (la ration dessinée rapetisse à chaque bouchée)
      for (let k = 0; k < 4; k++) {
        const m = this.garder(this.add.rectangle(r.x, r.y + 6, 3, 3, 0xc89a50).setDepth(p.depth + 0.1));
        this.tweens.add({ targets: m, x: m.x + Phaser.Math.Between(-12, 12), y: SOL_RECIT - 4, alpha: 0, duration: 520, delay: k * 50, onComplete: () => m.destroy() });
      }
      await this.attendre(380);
      this.poserPose('assis');
      await this.attendre(300);
    }
    this.tweens.add({ targets: r, alpha: 0, duration: 250 });
    this.emotion(p, 'joie', 1100);
  },
  // Il boit à sa gourde : le coude se lève, la gourde se renverse sur ses lèvres, trois grandes gorgées
  async bivouacBoire() {
    const p = this.perso;
    const sg = p.flipX ? -1 : 1, reel = !!OBJETS_MAIN.gourde;   // (la gourde dessinée : le col en haut ; on la penche vers la bouche)
    const o = this.tenirEnMain(iconeObjet(this, 'gourde'), { echelle: 1.8, angle: -30, dx: 8, dy: -2, reel: 8 * sg });
    await this.attendre(250);
    this.poserPose('boit');
    o.setAngle(reel ? 70 * sg : -125);
    await this.animer({ targets: p, angle: p.flipX ? 4 : -4, duration: 200 });
    this.onomatopee(p.x + (p.flipX ? -30 : 30), p.y - p.displayHeight * 1.05, 'Glou glou !', '#a8d8ff');
    for (let k = 0; k < 3; k++) await this.animer({ targets: o, angle: reel ? 105 * sg : -140, duration: 170, yoyo: true });
    this.gouttes(0x8ac8f0, 2);
    await this.animer({ targets: p, angle: 0, duration: 200 });
    this.poserPose(null);
    o.setAngle(reel ? 8 * sg : -30);
    await this.attendre(250);
    this.tweens.add({ targets: o, alpha: 0, duration: 250 });
  },
  // Il se réchauffe les mains : assis face au feu, les mains tendues ; il frissonne, puis la chaleur le gagne
  async bivouacChauffer() {
    const p = this.perso;
    this.poserPose('chauffe');
    for (let k = 0; k < 4; k++) await this.animer({ targets: p, x: p.x + (k % 2 ? 2 : -2), duration: 70 });   // (il grelotte)
    this.onomatopee(p.x, p.y - p.displayHeight * 1.0, 'Brrr...', '#c8e0ff');
    await this.attendre(500);
    this.tweens.addCounter({ from: 0, to: 1, duration: 900, onUpdate: tw => { const v = tw.getValue(); p.setTint(Phaser.Display.Color.GetColor(255, 255 - v * 40, 255 - v * 80)); } });
    // il frotte ses mains : elles montent et descendent un peu devant les flammes
    for (let k = 0; k < 3; k++) await this.animer({ targets: p, y: p.y - 2, duration: 220, yoyo: true });
    this.onomatopee(p.x, p.y - p.displayHeight * 1.0, 'Ahhh...', '#ffd8a0');
    this.emotion(p, 'joie', 1200);
    await this.attendre(600);
  },
  // Il dort près des braises : couché, les yeux fermés, sa cape en couverture ; il respire, les Z montent
  // (planche 86) il s'allonge pour de bon (la pose dortBivouac du rig : sur le dos, relâché, les genoux un peu fléchis,
  // une jambe plus repliée, posé au sol) ; la couverture épouse sa silhouette couchée, des pieds jusqu'au cou
  async bivouacDormir(cape = 0x5a3a2a) {
    const p = this.perso;
    const debout = { y: p.y, flip: p.flipX };
    if (typeof POSES_HD === 'undefined') return null;
    // les pieds vers le feu, la tête de l'autre côté (pas dans les braises)
    const feu = [...(this.decor && this.decor.list || []), ...this.children.list].find(o => o.active && o.texture && o.texture.key === 'feuCampHD');
    if (feu) p.setFlipX(feu.x < p.x);
    if (feu && !this.rapide) Son.jouer('feuDeCamp', { duree: 4 });   // (v1.64 : les braises crépitent pendant qu'il s'endort)
    this.poserRecit('aGenoux');
    await this.attendre(260);
    this.poserRecit('dortBivouac');
    p.setY(SOL_RECIT - 5);
    await this.animer({ targets: p, y: SOL_RECIT, duration: 240, ease: 'Quad.easeIn' });
    const a = APPUI_POSES[p.texture.key], sil = silhouetteHaute(this, p.texture.key), sc = p.scaleX, f = p.flipX;
    // un point de la texture (non retournée) → l'écran
    const ex = tx => p.x + ((f ? a.l - tx : tx) - p.originX * a.l) * sc, ey = ty => p.y + (ty - p.originY * a.h) * p.scaleY;
    // les colonnes couvertes : du cou jusqu'au bout des pieds (la tête dépasse, posée sur le sac)
    let fin = 0; for (let x = 0; x < sil.length; x++) if (sil[x] >= 0) fin = x;
    const debut = Math.round(a.cou[0]) + 1;
    // (le haut du corps, lissé : l'étoffe passe d'une bosse à l'autre sans suivre chaque doigt ; elle retombe aux deux bouts)
    const env = []; for (let x = debut; x <= fin + 3; x++) { let m = 1e9; for (let j = -4; j <= 4; j++) { const v = sil[Math.max(0, Math.min(fin, x + j))]; if (v >= 0) m = Math.min(m, v); } env.push(m < 1e9 ? m : a.y); }
    const haut = env.map((_, i) => { let t = 0, n = 0; for (let j = -6; j <= 6; j++) { const v = env[Math.max(0, Math.min(env.length - 1, i + j))]; t += v; n++; } const bout = Math.min(i, env.length - 1 - i); return t / n + Math.max(0, 6 - bout) * 0.9; });
    const g = this.garder(this.add.graphics().setDepth(p.depth + 0.1));
    // (un sac roulé sous la tête, en guise d'oreiller)
    const sac = this.garder(this.add.graphics().setDepth(p.depth - 0.05)), sx = ex(a.tete[0]), sy = SOL_RECIT;
    const so = sx + (f ? 1 : -1) * 10;   // (il dépasse derrière la tête)
    sac.fillStyle(0x2a1a0e).fillEllipse(so, sy - 6, 36, 18).fillStyle(0x8a6a40).fillEllipse(so, sy - 7, 32, 14).fillStyle(0x6a4a2a).fillRect(so - 2, sy - 14, 4, 14);
    const cols = haut.map((h, i) => ({ x: ex(debut + i), y: ey(h) - 2, u: i / Math.max(1, haut.length - 1) }));
    const dessiner = (souffle) => {
      // la cape posée comme une couverture : elle suit le corps (la poitrine qui se soulève), retombe en plis jusqu'au sol
      g.clear();
      for (const c of cols) g.fillStyle(0x1a1008).fillRect(c.x - 2, c.y - souffle * Math.max(0, 1 - c.u * 2.2) - 2, 5, SOL_RECIT - c.y + 4);
      for (const c of cols) {
        const hy = c.y - souffle * Math.max(0, 1 - c.u * 2.2), pli = Math.floor(c.u * 7) % 2;
        g.fillStyle(cape).fillRect(c.x - 1, hy, 3, SOL_RECIT - hy);
        g.fillStyle(0x000000, pli ? 0.16 : 0.05).fillRect(c.x - 1, hy + 6, 3, Math.max(0, SOL_RECIT - hy - 6));
        g.fillStyle(0xffffff, 0.16).fillRect(c.x - 1, hy, 3, 2);
      }
      const xa = Math.min(cols[0].x, cols[cols.length - 1].x), xb = Math.max(cols[0].x, cols[cols.length - 1].x);
      g.fillStyle(0xc9a227, 0.8).fillRect(xa, SOL_RECIT - 4, xb - xa, 2);   // (l'ourlet brodé)
    };
    const u = { s: 0 }; dessiner(0);
    this.tweens.add({ targets: u, s: 2.5, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', onUpdate: () => dessiner(u.s) });
    const tete = { x: ex(a.tete[0]), y: ey(a.tete[1]) - 30 }, sens = f ? 1 : -1;
    const zz = this.zz = this.time.addEvent({ delay: 700, loop: true, callback: () => {
      const z = this.garder(this.add.text(tete.x, tete.y, 'z', style(14 + Math.random() * 8, '#e8e0ff', { fontStyle: 'bold' })).setDepth(8));
      this.tweens.add({ targets: z, y: z.y - 70, x: z.x + sens * 20, alpha: 0, duration: 2000, onComplete: () => z.destroy() });
    } });
    this.garder({ destroy: () => zz.remove() });
    return { couverture: g, sac, debout };
  },
  // Il se réveille : la couverture et le sac s'en vont, il se relève (à genoux, puis debout)
  async bivouacReveil(etat) {
    if (this.zz) { this.zz.remove(); this.zz = null; }
    if (etat && etat.couverture) { this.tweens.killTweensOf(etat.couverture); etat.couverture.destroy(); }
    if (etat && etat.sac) etat.sac.destroy();
    await this.debout(600);
    if (etat && etat.debout && etat.debout.flip !== undefined) this.perso.setFlipX(etat.debout.flip);
  },
  // La couleur de sa cape (pour la couverture) : celle de son baluchon s'il en a une, sinon une laine brune
  couleurCape() { const c = this.parti && this.parti.colis && this.parti.colis.cape; return c ? 0x3a5a7a : 0x6a4a2a; },
});

// (planche 86) Le haut de la silhouette d'une texture, colonne par colonne (en pixels de la texture ; -1 : rien)
const SILHOUETTES_HAUTES = {};
function silhouetteHaute(scene, cle) {
  if (SILHOUETTES_HAUTES[cle]) return SILHOUETTES_HAUTES[cle];
  const src = scene.textures.get(cle).getSourceImage(), W = src.width, H = src.height;
  let ctx = src.getContext ? src.getContext('2d') : null;
  if (!ctx) { const c = document.createElement('canvas'); c.width = W; c.height = H; ctx = c.getContext('2d'); ctx.drawImage(src, 0, 0); }
  const d = ctx.getImageData(0, 0, W, H).data, haut = new Array(W).fill(-1);
  for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) if (d[(y * W + x) * 4 + 3] > 20) { haut[x] = y; break; }
  return (SILHOUETTES_HAUTES[cle] = haut);
}
