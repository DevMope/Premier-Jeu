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
  tenirEnMain(cleImage, { echelle = 2.2, angle = 0, dx = 0, dy = 0 } = {}) {
    const p = this.perso, o = this.garder(this.add.image(0, 0, cleImage).setScale(echelle).setAngle(angle));
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
      r.setScale(1.8 * (1 - (i + 1) * 0.24));
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
    const o = this.tenirEnMain(iconeObjet(this, 'gourde'), { echelle: 1.8, angle: -30, dx: 8, dy: -2 });
    await this.attendre(250);
    this.poserPose('boit');
    o.setAngle(-125);
    await this.animer({ targets: p, angle: p.flipX ? 4 : -4, duration: 200 });
    this.onomatopee(p.x + (p.flipX ? -30 : 30), p.y - p.displayHeight * 1.05, 'Glou glou !', '#a8d8ff');
    for (let k = 0; k < 3; k++) await this.animer({ targets: o, angle: -140, duration: 170, yoyo: true });
    this.gouttes(0x8ac8f0, 2);
    await this.animer({ targets: p, angle: 0, duration: 200 });
    this.poserPose(null);
    o.setAngle(-30);
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
  async bivouacDormir(cape = 0x5a3a2a) {
    const p = this.perso;
    this.poserPose('dort');
    const debout = { y: p.y };
    await this.animer({ targets: p, angle: p.flipX ? 90 : -90, y: SOL_RECIT - p.displayWidth * 0.18, duration: 500, ease: 'Sine.easeInOut' });
    // la couverture : du cou jusqu'aux pieds, en drapé (une forme posée sur lui, qui respire avec lui)
    // (couché, la tête du côté où montait le haut de l'image : la couverture va des pieds aux épaules, la tête dépasse)
    // (v1.61) la couverture suit le vrai dessin couché (ses pixels pleins) : des pieds jusqu'aux épaules, et sur toute
    // son épaisseur (avant, le haut du corps, une main et les bottes dépassaient)
    const sens = p.flipX ? 1 : -1, y = p.y + 8, bo = boiteOpaque(this, p.texture.key), s = p.scaleX, lt = p.width, h = p.height;
    const xAt = py => p.x - sens * (py - h) * s;
    const partTete = { hobbit: 0.34, nain: 0.3, magicienne: 0.3, panda: 0.3 }[(this.parti && this.parti.voyageur.race) || ''] || 0.25;
    const x0 = xAt(bo.y1) - sens * 5, x1 = xAt(bo.y0 + partTete * (bo.y1 - bo.y0)), yTop = p.y - (bo.x1 - lt / 2) * s - 2;
    const g = this.garder(this.add.graphics().setDepth(p.depth + 0.1));
    // (un sac roulé sous la tête, en guise d'oreiller)
    const sac = this.garder(this.add.graphics().setDepth(p.depth - 0.05));
    sac.fillStyle(0x2a1a0e).fillEllipse(p.x + sens * p.displayHeight * 0.86, y + 2, 34, 18).fillStyle(0x8a6a40).fillEllipse(p.x + sens * p.displayHeight * 0.86, y + 1, 30, 14).fillStyle(0x6a4a2a).fillRect(p.x + sens * p.displayHeight * 0.86 - 2, y - 6, 4, 14);
    const xa = Math.min(x0, x1), w = Math.abs(x1 - x0);
    const dessiner = (souffle) => {
      // la cape posée comme une couverture : bombée sur les épaules et les hanches, retombant en plis jusqu'au sol
      const haut = xx => { const t = (xx - xa) / w, u = sens < 0 ? 1 - t : t, ligne = Phaser.Math.Clamp(Math.round(h - (xx - p.x) / (sens * s)), 0, h - 1);
        if (bo.profil) return Math.min(y - 6, p.y - (Math.max(bo.profil[ligne], lt / 2 + 6) - lt / 2) * s - 3) - souffle * (u > 0.6 ? 1 : 0.4) - Math.sin(u * Math.PI) * 2;
        return Math.min(y - 6, yTop) - souffle * (u > 0.6 ? 1 : 0.4) - Math.sin(u * Math.PI) * 5 - Math.max(0, Math.sin((u - 0.55) / 0.45 * Math.PI)) * 6; };
      g.clear();
      for (let xx = xa - 3; xx <= xa + w + 3; xx += 3) g.fillStyle(0x1a1008).fillRect(xx, haut(Phaser.Math.Clamp(xx, xa, xa + w)) - 3, 3, SOL_RECIT - haut(Phaser.Math.Clamp(xx, xa, xa + w)) + 3);
      for (let xx = xa; xx <= xa + w; xx += 3) {
        const hy = haut(xx), pli = Math.floor((xx - xa) / 14) % 2;
        g.fillStyle(cape).fillRect(xx, hy, 3, SOL_RECIT - hy);
        g.fillStyle(0x000000, pli ? 0.16 : 0.05).fillRect(xx, hy + 6, 3, SOL_RECIT - hy - 6);
        g.fillStyle(0xffffff, 0.16).fillRect(xx, hy, 3, 3);
      }
      g.fillStyle(0xc9a227, 0.8).fillRect(xa, SOL_RECIT - 5, w, 2);   // (l'ourlet brodé)
    };
    const u = { s: 0 }; dessiner(0);
    this.tweens.add({ targets: u, s: 3, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', onUpdate: () => dessiner(u.s) });
    const tete = { x: p.x + sens * p.displayHeight * 0.85, y: y - 40 };
    const zz = this.zz = this.time.addEvent({ delay: 700, loop: true, callback: () => {
      const z = this.garder(this.add.text(tete.x, tete.y, 'z', style(14 + Math.random() * 8, '#e8e0ff', { fontStyle: 'bold' })).setDepth(8));
      this.tweens.add({ targets: z, y: z.y - 70, x: z.x + sens * -20, alpha: 0, duration: 2000, onComplete: () => z.destroy() });
    } });
    this.garder({ destroy: () => zz.remove() });
    return { couverture: g, sac, debout };
  },
  // Il se réveille : la couverture et le sac s'en vont, il se relève
  async bivouacReveil(etat) {
    const p = this.perso;
    if (this.zz) { this.zz.remove(); this.zz = null; }
    if (etat && etat.couverture) { this.tweens.killTweensOf(etat.couverture); etat.couverture.destroy(); }
    if (etat && etat.sac) etat.sac.destroy();
    this.poserPose(null);
    await this.animer({ targets: p, angle: 0, y: SOL_RECIT, duration: 450, ease: 'Sine.easeOut' });
  },
  // La couleur de sa cape (pour la couverture) : celle de son baluchon s'il en a une, sinon une laine brune
  couleurCape() { const c = this.parti && this.parti.colis && this.parti.colis.cape; return c ? 0x3a5a7a : 0x6a4a2a; },
});

// (v1.61) le rectangle des pixels pleins d'une texture (en pixels de la texture), gardé en mémoire
const BOITES_OPAQUES = {};
function boiteOpaque(scene, cle) {
  if (BOITES_OPAQUES[cle]) return BOITES_OPAQUES[cle];
  const src = scene.textures.get(cle).getSourceImage(), W = src.width, H = src.height;
  let ctx = src.getContext ? src.getContext('2d') : null;
  if (!ctx) { const c = document.createElement('canvas'); c.width = W; c.height = H; ctx = c.getContext('2d'); ctx.drawImage(src, 0, 0); }
  const d = ctx.getImageData(0, 0, W, H).data;
  let x0 = W, x1 = 0, y0 = H, y1 = 0;
  const droites = [];
  for (let y = 0; y < H; y++) {
    let g = -1, dr = -1;
    for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 20) { if (g < 0) g = x; dr = x; }
    droites.push(dr);
    if (dr >= 0) { if (g < x0) x0 = g; if (dr > x1) x1 = dr; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  if (x1 < x0) return (BOITES_OPAQUES[cle] = { x0: 0, x1: W, y0: 0, y1: H });
  // le bord du corps, du buste aux chevilles : la médiane des bords de chaque ligne (une arme, une main qui dépasse
  // n'y comptent pas)
  const bande = droites.slice(Math.round(y0 + 0.35 * (y1 - y0)), Math.round(y0 + 0.95 * (y1 - y0))).filter(x => x >= 0).sort((a, b) => a - b);
  const corps = bande.length ? bande[Math.floor(bande.length / 2)] + 1 : x1 + 1;
  // le profil lissé (le bord le plus haut sur ±5 lignes) : la couverture épouse le corps couché
  const bord = droites.map((_, y) => { let m = -1; for (let k = Math.max(0, y - 5); k <= Math.min(H - 1, y + 5); k++) m = Math.max(m, droites[k]); return m + 1; });
  const profil = bord.map((_, y) => { let t = 0, n = 0; for (let k = Math.max(0, y - 12); k <= Math.min(H - 1, y + 12); k++) if (bord[k] > 0) { t += bord[k]; n++; } return n ? t / n + 1 : 0; });   // (en pente douce)
  return (BOITES_OPAQUES[cle] = { x0, x1: corps, y0, y1: y1 + 1, profil });
}
