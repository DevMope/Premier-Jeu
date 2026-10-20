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
    const L = p.displayHeight * 0.62, sens = p.flipX ? 1 : -1, x0 = p.x - sens * 4, x1 = p.x + sens * L, y = p.y + 8;
    const g = this.garder(this.add.graphics().setDepth(p.depth + 0.1));
    // (un sac roulé sous la tête, en guise d'oreiller)
    const sac = this.garder(this.add.graphics().setDepth(p.depth - 0.05));
    sac.fillStyle(0x2a1a0e).fillEllipse(p.x + sens * p.displayHeight * 0.86, y + 2, 34, 18).fillStyle(0x8a6a40).fillEllipse(p.x + sens * p.displayHeight * 0.86, y + 1, 30, 14).fillStyle(0x6a4a2a).fillRect(p.x + sens * p.displayHeight * 0.86 - 2, y - 6, 4, 14);
    const xa = Math.min(x0, x1), w = Math.abs(x1 - x0);
    const dessiner = (souffle) => {
      // la cape posée comme une couverture : bombée sur les épaules et les hanches, retombant en plis jusqu'au sol
      const haut = xx => { const t = (xx - xa) / w, u = sens < 0 ? 1 - t : t; return y - 6 - souffle * (u > 0.6 ? 1 : 0.4) - Math.sin(u * Math.PI) * 5 - Math.max(0, Math.sin((u - 0.55) / 0.45 * Math.PI)) * 6; };
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
    const zz = this.time.addEvent({ delay: 700, loop: true, callback: () => {
      const z = this.garder(this.add.text(tete.x, tete.y, 'z', style(14 + Math.random() * 8, '#e8e0ff', { fontStyle: 'bold' })).setDepth(8));
      this.tweens.add({ targets: z, y: z.y - 70, x: z.x + sens * -20, alpha: 0, duration: 2000, onComplete: () => z.destroy() });
    } });
    this.garder({ destroy: () => zz.remove() });
    return { couverture: g, debout };
  },
});
