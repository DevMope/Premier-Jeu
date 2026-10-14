// (v0.59) Les épreuves des récits, 2e et 3e lots : l'araignée, le yéti, les monstres (troll, golem,
// la Bête), les esprits, les morts-vivants, les malédictions, les feux follets, les champignons ;
// puis les sangsues, la soif, la tempête, le froid et l'avalanche. (Voir RecitEpreuves.js.)

Object.assign(StoryScene.prototype, {
  // Des particules portées par le vent (neige, sable, spores) ; s'arrêtent à l'épreuve suivante
  vent(teinte, { vx = -1, vy = 0.3, n = 3, echelle = 1.2, alpha = 0.8, profondeur = 6.8, duree = 1600 } = {}) {
    const ev = this.time.addEvent({ delay: 70, loop: true, callback: () => {
      for (let k = 0; k < n; k++) {
        const x = vx < 0 ? Phaser.Math.Between(400, 1100) : Phaser.Math.Between(-150, 600), y = Phaser.Math.Between(-20, 370);
        const p = this.add.image(x, y, 'lueurHD').setScale(echelle * (0.5 + Math.random())).setTint(teinte).setAlpha(alpha).setDepth(profondeur);
        this.garder(p);
        this.tweens.add({ targets: p, x: x + vx * 500, y: y + vy * 500, alpha: 0, duration: duree * (0.7 + Math.random() * 0.6), onComplete: () => p.destroy() });
      }
    } });
    this.garder({ destroy: () => ev.remove() });
    return ev;
  },
  // Des bancs de brume qui roulent
  brume(teinte = 0xb8c0d0, alpha = 0.3, y0 = 290, profondeur = 6.7) {
    for (let k = 0; k < 7; k++) {
      const b = this.garder(this.add.image(k * 160, y0 + (k % 3) * 22, 'halo').setScale(4, 1.3).setTint(teinte).setAlpha(alpha).setDepth(profondeur));
      this.tweens.add({ targets: b, x: b.x + 80, alpha: alpha * 0.55, duration: 2600 + k * 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  },
  // Une étendue d'eau au sol (lac, mare, rivière), devant ou derrière le voyageur
  plan_eau(x, l, h = 26, teinte = null) {
    const e = this.garder(eauRecitHD(this, x, SOL_RECIT + 8, l, h).setDepth(1.5));
    if (teinte) e.list.forEach(o => o.setTint && o.setTint(teinte));
    return e;
  },
  // Il entre dans l'eau jusqu'à la taille : un voile d'eau devant ses jambes
  async entrerDansLEau(x, profondeur = 0.4, teinte = 0x3a6a8a) {
    const p = this.perso;
    const voile = this.garder(this.add.rectangle(0, 0, 70, 10, teinte, 0.85).setOrigin(0.5, 1).setDepth(3.4));
    const reflet = this.garder(this.add.rectangle(0, 0, 70, 2, 0xd0f0ff, 0.6).setOrigin(0.5, 0).setDepth(3.41));
    const maj = () => { if (!voile.active) return; const h = Math.max(0, SOL_RECIT + 4 - (p.y - p.displayHeight * profondeur)); voile.setPosition(p.x, SOL_RECIT + 4).setSize(70, h * (p.dansLEau || 0)); reflet.setPosition(p.x, SOL_RECIT + 4 - h * (p.dansLEau || 0)).setVisible((p.dansLEau || 0) > 0.05); };
    p.dansLEau = 0; maj(); this.chaqueImage(maj);
    this.tweens.add({ targets: p, dansLEau: 1, duration: 600 });
    await this.marcherA(x, 9);
    return { sortir: () => this.animer({ targets: p, dansLEau: 0, duration: 400 }) };
  },
  // Des os qui volent (squelette en morceaux)
  osEnMorceaux(x, y, n = 7) {
    const g = [];
    for (let k = 0; k < n; k++) {
      const o = this.garder(this.add.rectangle(x, y - Math.random() * 60, 12 + Math.random() * 8, 4, 0xe8e0c8).setStrokeStyle(1, 0x3a3428).setDepth(3.3));
      g.push(o);
      this.sauter(o, x + Phaser.Math.Between(-70, 90), SOL_RECIT - 3, 40 + Math.random() * 50, 500 + Math.random() * 200, Phaser.Math.Between(-540, 540));
    }
    const crane = this.garder(this.add.circle(x, y - 70, 8, 0xe8e0c8).setStrokeStyle(1.5, 0x3a3428).setDepth(3.35));
    this.sauter(crane, x + 110, SOL_RECIT - 8, 70, 700, 720);
    return g;
  },
  // Un monstre en pied qui arrive (texture fixe), posé par les pieds
  monstre(cle, x, echelle, { depuis = 1060, teinte = null } = {}) {
    const m = this.garder(this.add.image(depuis, SOL_RECIT, cle).setOrigin(0.5, 1).setScale(echelle).setDepth(2.9));
    if (teinte) m.setTint(teinte);
    m.echelle = echelle;
    m.respire = () => this.tweens.add({ targets: m, scaleY: echelle * 1.04, scaleX: echelle * 0.98, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return m;
  },
  // Un coup de lame (l'arc blanc) depuis le voyageur
  coupDeLame(lame, versDroite = true) {
    const p = this.perso;
    if (lame) this.tweens.add({ targets: lame, angle: versDroite ? 120 : -120, duration: 130, yoyo: true });
    const g = this.garder(this.add.graphics().setDepth(7));
    g.lineStyle(6, 0xffffff, 0.9).beginPath().arc(p.x + (versDroite ? 30 : -30), p.y - 70, 60, versDroite ? -1.3 : Math.PI - 0.8, versDroite ? 0.8 : Math.PI + 1.3).strokePath();
    this.tweens.add({ targets: g, alpha: 0, duration: 300, onComplete: () => g.destroy() });
    Son.jouer('coup', { force: 0.8 });
  },
  // La fiole bue d'un trait (potion, antidote) : le remède agit
  async boireFiole(id, reussie) {
    const p = this.perso;
    const o = this.tenir(iconeObjet(this, id), { echelle: 2.4 });
    await this.animer({ targets: o, dy: -p.displayHeight * 0.48, angle: -120, duration: 400, ease: 'Quad.easeOut' });
    this.onomatopee(p.x + 20, p.y - 180, 'Glou !', id === 'antidote' ? '#a0ffb0' : '#ffb0c0');
    await this.attendre(400);
    this.tweens.add({ targets: o, alpha: 0, duration: 300 });
    const teinte = id === 'antidote' ? 0x70ff90 : 0xff7090;
    for (let k = 0; k < (reussie ? 14 : 6); k++) {
      const e = this.garder(this.add.image(p.x + Phaser.Math.Between(-26, 26), p.y - Phaser.Math.Between(10, 100), 'lueurHD').setScale(1.5).setTint(teinte).setBlendMode(Phaser.BlendModes.ADD).setDepth(7));
      this.tweens.add({ targets: e, y: e.y - 70, alpha: 0, duration: 900, delay: k * 50, onComplete: () => e.destroy() });
    }
    await this.attendre(500);
  },
  // Il s'enroule dans sa cape (on la voit sur lui) — ou la retire
  enroulerCape(oui = true) {
    // (la cape l'enveloppe : on le voit drapé de laine, des pans qui battent au vent)
    const M = this.menace, p = this.perso;
    if (oui && !M.capeSurLui) {
      M.capeSurLui = true;
      p.setTint(0xb08a5a);
      M.pans = this.time.addEvent({ delay: 220, loop: true, callback: () => {
        const l = this.garder(this.add.rectangle(p.x - 10, p.y - p.displayHeight * (0.3 + Math.random() * 0.4), 14, 4, 0x8a6a40).setDepth(3.1));
        this.tweens.add({ targets: l, x: l.x - 26, alpha: 0, scaleX: 0.4, duration: 400, onComplete: () => l.destroy() });
      } });
      this.garder({ destroy: () => M.pans.remove() });
    } else if (!oui && M.capeSurLui) { M.capeSurLui = false; if (M.pans) M.pans.remove(); p.clearTint(); }
  },
});

Object.assign(SCENES_EPREUVES, {

  // ======================= L'ARAIGNÉE GÉANTE =======================
  araignee: {
    decor(X) {
      const M = this.menace;
      M.cx = Math.min(X + 170, 840); M.cy = 150;
      // deux arbres morts, et la grande toile tendue entre eux
      for (const [dx, f] of [[-150, false], [150, true]]) this.garder(this.add.image(M.cx + dx, SOL_RECIT + 4, 'arbreMortHD').setOrigin(0.5, 1).setScale(2.6).setFlipX(f).setDepth(1.2));
      const t = M.toile = this.garder(this.add.graphics().setDepth(1.3));
      t.lineStyle(1.5, 0xf0f0f0, 0.7);
      for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; t.lineBetween(M.cx, M.cy, M.cx + Math.cos(a) * 150, M.cy + Math.sin(a) * 120); }
      for (let r = 18; r < 150; r += 14) { t.beginPath(); for (let k = 0; k <= 12; k++) { const a = k / 12 * Math.PI * 2, rr = r * (1 + Math.sin(k * 1.7) * 0.05); const x = M.cx + Math.cos(a) * rr, y = M.cy + Math.sin(a) * rr * 0.8; if (k) t.lineTo(x, y); else t.moveTo(x, y); } t.strokePath(); }
      // des cocons pendus, et la graine (ou le trésor) qui luit dans la toile
      for (const [cx, cy] of [[M.cx - 80, 200], [M.cx + 60, 90], [M.cx + 100, 210]]) { const c = this.garder(this.add.ellipse(cx, cy, 16, 30, 0xe8e4d8).setStrokeStyle(1.5, 0x8a8478).setDepth(1.35)); this.tweens.add({ targets: c, angle: 6, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }); }
      M.tresor = this.garder(this.add.image(M.cx + 30, M.cy + 40, 'lueurHD').setScale(2.4).setTint(0x90ff90).setBlendMode(Phaser.BlendModes.ADD).setDepth(1.4));
      this.tweens.add({ targets: M.tresor, scale: 3, duration: 700, yoyo: true, repeat: -1 });
      M.reine = this.garder(this.add.image(M.cx, -80, 'araigneeHD').setOrigin(0.5, 1).setScale(3).setDepth(2.9));
      M.fil = this.garder(this.add.rectangle(M.cx, 0, 1.5, 1, 0xeeeeee, 0.8).setOrigin(0.5, 0).setDepth(2.85));
      this.chaqueImage(() => { if (M.fil.active && M.reine.active) M.fil.setSize(1.5, Math.max(1, M.reine.y - M.reine.displayHeight * 0.6)).setX(M.reine.x); });
      this.ciel(0x2a1a30, 0.3, 600);
    },
    async avant() {
      const M = this.menace, p = this.perso;
      // la toile frémit... la reine descend au bout de son fil, et se pose
      this.tweens.add({ targets: M.toile, x: 3, duration: 80, yoyo: true, repeat: 5 });
      this.onomatopee(M.cx, 60, 'Ksss...', '#d0b0ff');
      await this.animer({ targets: M.reine, y: SOL_RECIT - 40, duration: 1400, ease: 'Sine.easeOut' });
      await this.animer({ targets: M.reine, y: SOL_RECIT, duration: 260, ease: 'Bounce.easeOut' });
      M.fil.setVisible(false);
      this.emotion(p, '!', 900);
      await this.animer({ targets: M.reine, angle: -10, duration: 300, yoyo: true, hold: 300 });   // elle se cabre
      this.tweens.add({ targets: M.reine, scaleY: 3.1, duration: 400, yoyo: true, repeat: -1 });
    },
    async utiliser(id, reussie) {
      const M = this.menace, p = this.perso, r = M.reine;
      const lame = this.tenir(iconeObjet(this, id), { echelle: 2.6, angle: -30, dy: -8 });
      // elle bondit ; il frappe
      await this.animer({ targets: r, x: r.x + 10, duration: 200 });
      const saut = this.sauter(r, p.x + 80, SOL_RECIT, 60, 380);
      await this.attendre(250);
      this.coupDeLame(lame);
      await saut;
      if (reussie) {
        this.onomatopee(r.x, r.y - 120, 'TCHAK !', '#fff4dc');
        r.setTint(0xff6060); this.time.delayedCall(160, () => r.active && r.clearTint());
        this.coupDeZoom(r.x, r.y - 40, 1.3);
        await this.sauter(r, r.x + 120, SOL_RECIT, 40, 400);
      } else {
        // elle crache sa toile : il est empêtré
        this.onomatopee(r.x, r.y - 120, 'PFFT !', '#e8e8e8');
        const cocon = this.garder(this.add.ellipse(p.x, p.y - p.displayHeight * 0.45, p.displayWidth * 0.7, p.displayHeight * 0.8, 0xf0f0f0, 0).setStrokeStyle(3, 0xffffff, 0.9).setDepth(3.2));
        this.tweens.add({ targets: cocon, fillAlpha: 0.55, duration: 300 });
        await this.animer({ targets: p, x: p.x + 3, duration: 60, yoyo: true, repeat: 7 });
        this.onomatopee(p.x, p.y - 170, 'CRAC !', '#fff4dc');
        this.tweens.add({ targets: cocon, alpha: 0, scale: 1.4, duration: 300 });
      }
      this.tweens.add({ targets: lame, alpha: 0, delay: 300, duration: 300 });
    },
    async issue(reussie) {
      const M = this.menace, p = this.perso, r = M.reine;
      if (reussie) {
        if (abattu(this)) await this.assommer(r, 'araigneeHD');
        else {
          // elle remonte se cacher en haut de son fil
          M.fil.setVisible(true);
          this.onomatopee(r.x, r.y - 120, 'Ksss !', '#d0b0ff');
          await this.animer({ targets: r, y: -60, duration: 900, ease: 'Sine.easeIn' });
        }
        // il tranche la toile et prend ce qu'elle gardait
        this.tweens.add({ targets: M.toile, y: 120, alpha: 0, duration: 800 });
        await this.marcherA(Math.min(M.tresor.x - 40, 900), 4);
        this.tweens.add({ targets: M.tresor, x: p.x, y: p.y - 90, scale: 1, duration: 500 });
        this.emotion(p, 'joie', 1000);
        await this.attendre(500);
        return;
      }
      // elle le mord, et retourne à sa toile
      await this.sauter(r, p.x + 50, SOL_RECIT, 40, 300);
      this.onomatopee(p.x, p.y - 170, 'AÏE !', '#ff8080');
      this.cameras.main.shake(220, 0.012);
      await this.animer({ targets: p, angle: -12, duration: 120, yoyo: true });
      M.fil.setVisible(true);
      this.tweens.add({ targets: r, y: -60, x: M.cx, duration: 1000, delay: 200 });
      await this.attendre(500);
    },
  },

  // ======================= LE YÉTI =======================
  yeti: {
    decor(X) {
      const M = this.menace;
      M.yx = Math.min(X + 180, 860);
      const g = this.garder(this.add.graphics().setDepth(1.2));
      // la neige au sol, une congère où il se cache, des pics de glace
      g.fillStyle(0xf0f6fa).fillRect(-50, SOL_RECIT - 6, 1060, 30);
      for (let x = -40; x < 1000; x += 30) g.fillStyle(0xffffff).fillEllipse(x, SOL_RECIT - 6, 50, 10);
      for (const [ix, h] of [[X - 120, 60], [X - 100, 40], [M.yx + 110, 70], [M.yx + 130, 46]]) { g.fillStyle(0xb8d8ec).fillTriangle(ix - 10, SOL_RECIT - 4, ix + 10, SOL_RECIT - 4, ix, SOL_RECIT - 4 - h); g.fillStyle(0xe8f6ff).fillTriangle(ix - 4, SOL_RECIT - 4, ix, SOL_RECIT - 4, ix - 2, SOL_RECIT - 4 - h * 0.8); }
      M.congere = this.garder(this.add.ellipse(M.yx, SOL_RECIT, 170, 110, 0xf4f8fc).setStrokeStyle(2, 0xc8d8e8).setDepth(3.1));
      M.yeti = this.monstre('yetiHD', M.yx, 3.2, { depuis: M.yx }).setY(SOL_RECIT + 230).setAlpha(0);
      this.vent(0xffffff, { vx: -0.5, vy: 1, n: 3, echelle: 1.1 });
      this.ciel(0xc8d8f0, 0.2, 600);
    },
    async avant() {
      const M = this.menace, p = this.perso, y = M.yeti;
      // la congère tremble... et il en jaillit
      await this.animer({ targets: M.congere, x: M.congere.x + 4, duration: 60, yoyo: true, repeat: 6 });
      this.tweens.add({ targets: M.congere, scaleX: 1.6, scaleY: 0.2, alpha: 0, duration: 400 });
      for (let k = 0; k < 14; k++) { const b = this.garder(this.add.circle(M.yx + Phaser.Math.Between(-60, 60), SOL_RECIT - 40, 6 + Math.random() * 6, 0xffffff).setDepth(6)); this.sauter(b, b.x + Phaser.Math.Between(-120, 120), SOL_RECIT, 80 + Math.random() * 60, 700).then(() => b.destroy()); }
      y.setAlpha(1);
      await this.animer({ targets: y, y: SOL_RECIT, duration: 400, ease: 'Back.easeOut' });
      this.onomatopee(y.x, y.y - 230, 'GROAAAR !', '#e0f0ff');
      Son.jouer('grogne', { force: 1.4 });
      this.cameras.main.shake(400, 0.012);
      // il se frappe la poitrine
      for (let k = 0; k < 3; k++) await this.animer({ targets: y, scaleX: 3.4, scaleY: 3.3, duration: 120, yoyo: true });
      this.emotion(p, '!', 900);
      await this.geste(p, 'recule');
    },
    async utiliser(id, reussie) {
      const M = this.menace, p = this.perso, y = M.yeti;
      const lame = this.tenir(iconeObjet(this, id), { echelle: 2.6, angle: -30, dy: -8 });
      // il avance, lève le bras, frappe le sol ; le voyageur saute de côté
      await this.animer({ targets: y, x: p.x + 130, duration: 600, ease: 'Sine.easeIn' });
      await this.animer({ targets: y, angle: -8, duration: 200 });
      this.animer({ targets: y, angle: 8, duration: 140 });
      await this.sauter(p, p.x - 40, SOL_RECIT, 50, 300);
      this.onomatopee(y.x - 60, SOL_RECIT - 40, 'BOUM !', '#e0f0ff');
      this.cameras.main.shake(200, 0.01);
      this.poussiere(y.x - 60, SOL_RECIT, 10, 0xffffff);
      await this.marcherA(y.x - 70, 2);
      this.coupDeLame(lame);
      if (reussie) {
        this.onomatopee(y.x, y.y - 200, 'TCHAK !', '#fff4dc');
        y.setTint(0xff9090); this.time.delayedCall(160, () => y.active && y.clearTint());
        this.coupDeZoom(y.x - 20, y.y - 90, 1.3);
        await this.animer({ targets: y, x: y.x + 50, angle: 0, duration: 300, ease: 'Quad.easeOut' });
      } else {
        this.onomatopee(p.x + 40, p.y - 160, 'TOC...', '#c0c0c0');
        this.emotion(y, 'joie', 900);   // il rigole
      }
      this.tweens.add({ targets: lame, alpha: 0, delay: 300, duration: 300 });
    },
    async issue(reussie) {
      const M = this.menace, p = this.perso, y = M.yeti;
      if (reussie) {
        // il recule, recule... jusqu'au bord de la falaise, et glisse dans la pente
        await this.animer({ targets: y, x: 880, duration: 900, ease: 'Sine.easeInOut' });
        this.onomatopee(880, SOL_RECIT - 230, 'OUAAAH !', '#e0f0ff');
        await this.animer({ targets: y, x: 1100, y: SOL_RECIT + 200, angle: 40, duration: 700, ease: 'Quad.easeIn' });
        return;
      }
      // il l'attrape et l'envoie dans la neige
      this.cameras.main.shake(260, 0.014);
      this.onomatopee(p.x, p.y - 180, 'OUILLE !', '#ff8080');
      await this.sauter(p, p.x - 120, SOL_RECIT, 120, 650, -360);
      p.setAngle(0);
      const tas = this.garder(this.add.ellipse(p.x, SOL_RECIT, 80, 40, 0xffffff).setDepth(3.3));
      p.setTint(0xc8e0ff);
      await this.attendre(500);
      this.tweens.add({ targets: tas, alpha: 0, scaleX: 1.5, duration: 400 });
      await this.animer({ targets: p, angle: 10, duration: 100, yoyo: true, repeat: 3 });   // il s'ébroue
      y.setFlipX(true);
      this.tweens.add({ targets: y, x: 1100, duration: 1400, delay: 200 });
      await this.attendre(500);
    },
  },

  // ======================= LES MONSTRES (troll, golem, la Bête) =======================
  monstre: {
    decor(X) {
      const M = this.menace;
      M.bete = this.parti.voyageur.quete === 'bete' || texteDit(this, /Bête|flammes|écailles/);
      M.golem = texteDit(this, /golem/);
      M.mx = Math.min(X + 200, 840);
      if (M.bete) {
        creerBeteAntreHD(this);
        // l'antre : des rochers noircis, des braises, une lueur rouge
        this.ciel(0x3a0a04, 0.45, 600);
        const g = this.garder(this.add.graphics().setDepth(1.1));
        g.fillStyle(0x2a1a14).fillRect(-50, 150, 1060, 215);
        for (let k = 0; k < 9; k++) g.fillStyle(0x3a2a20).fillEllipse(k * 120, 170 + (k % 2) * 30, 200, 140);
        for (let k = 0; k < 20; k++) g.fillStyle(0xff6a20, 0.6).fillCircle(hachage(k, 1, 31) * 960, SOL_RECIT - 2 - hachage(k, 2, 31) * 6, 2);
        this.vent(0xff7a20, { vx: 0.1, vy: -0.6, n: 1, echelle: 1, alpha: 0.7 });
        M.m = this.monstre('beteAntreHD', M.mx, 3.4);
      } else if (M.golem) {
        // les portes du palais, gardées
        const g = this.garder(this.add.graphics().setDepth(1.1));
        g.fillStyle(0xd8d0c0).fillRect(M.mx - 30, 120, 260, 245);
        g.fillStyle(0x6a4a2a).fillRoundedRect(M.mx + 40, 220, 100, 145, { tl: 50, tr: 50, bl: 0, br: 0 });
        for (const cx of [M.mx - 20, M.mx + 200]) { g.fillStyle(0xe8e0d0).fillRect(cx, 110, 26, 255); g.fillStyle(0xb8b0a0).fillRect(cx, 110, 6, 255); }
        M.m = this.monstre('golemHD', M.mx, 3, { depuis: M.mx });
        M.m.setTint(0x9a9a9a);
      } else {
        // le pont du troll : de grosses pierres, des os
        this.garder(this.add.image(M.mx + 90, SOL_RECIT + 6, 'rocherHD').setOrigin(0.5, 1).setScale(3.4, 2.6).setDepth(1.2));
        M.m = this.monstre('trollHD', M.mx, 3.1);
      }
    },
    async avant() {
      const M = this.menace, p = this.perso, m = M.m;
      if (M.golem) {
        // les runes s'allument : le golem s'éveille
        this.onomatopee(m.x, m.y - 230, 'GRRRMMM...', '#a0e0ff');
        m.clearTint();
        const h = this.garder(this.add.image(m.x, m.y - 190, 'halo').setScale(0.6).setTint(0x60d0ff).setAlpha(0.8).setBlendMode(Phaser.BlendModes.ADD).setDepth(3));
        this.tweens.add({ targets: h, alpha: 0.3, duration: 400, yoyo: true, repeat: -1 });
        this.cameras.main.shake(300, 0.008);
        await this.animer({ targets: m, x: m.x - 60, duration: 900, ease: 'Sine.easeInOut' });
      } else {
        // il arrive en faisant trembler le sol
        for (let k = 0; k < 4; k++) {
          await this.animer({ targets: m, x: m.x - (m.x - M.mx) / (4 - k), duration: 280, ease: 'Sine.easeOut' });
          this.cameras.main.shake(120, 0.006);
          this.poussiere(m.x, SOL_RECIT, 6, M.bete ? 0x8a6a5a : 0xc8b090);
        }
        m.setX(M.mx);
        this.onomatopee(m.x, m.y - 230, M.bete ? 'ROOOAAAR !' : 'GROOOAR !', M.bete ? '#ffb070' : '#d0e0a0');
        Son.jouer('grogne', { force: 1.5 });
        this.cameras.main.shake(300, 0.012);
      }
      m.respire();
      this.emotion(p, '!', 900);
    },
    async utiliser(id, reussie) {
      const M = this.menace, p = this.perso, m = M.m;
      if (id === 'bouclier') {
        const b = this.tenir(iconeObjet(this, 'bouclier'), { echelle: 3.4, dy: -50, dx: 14 });
        if (M.bete) {
          // le torrent de flammes s'écrase sur le bouclier
          this.onomatopee(m.x - 120, m.y - 200, 'FROOOOSH !', '#ffa040');
          const gueule = { x: m.x - m.displayWidth * 0.45, y: m.y - m.displayHeight * 0.62 };
          const flammes = this.time.addEvent({ delay: 30, repeat: 50, callback: () => {
            const f = this.garder(this.add.image(gueule.x, gueule.y, 'halo').setScale(0.4).setTint(Phaser.Utils.Array.GetRandom([0xff4a10, 0xff8a20, 0xffc040])).setAlpha(0.9).setBlendMode(Phaser.BlendModes.ADD).setDepth(6.9));
            const arrivee = reussie ? { x: b.x + 20, y: b.y + Phaser.Math.Between(-30, 30) } : { x: p.x, y: p.y - Phaser.Math.Between(20, 100) };
            this.tweens.add({ targets: f, x: arrivee.x, y: arrivee.y, scale: 1.1, duration: 300, onComplete: () => { if (reussie) this.tweens.add({ targets: f, x: f.x + Phaser.Math.Between(-20, 40), y: f.y + (Math.random() < 0.5 ? -60 : 60), alpha: 0, duration: 300, onComplete: () => f.destroy() }); else f.destroy(); } });
          } });
          this.garder({ destroy: () => flammes.remove() });
          this.cameras.main.shake(1500, 0.004);
          await this.attendre(1600);
          if (reussie) { b.setTint(0xffa060); this.time.delayedCall(800, () => b.active && b.clearTint()); }
          else { p.setTint(0x5a4038); this.onomatopee(p.x, p.y - 170, 'AÏE AÏE !', '#ff8080'); }
          return;
        }
        // le golem frappe : BLONG sur le bouclier
        await this.animer({ targets: m, x: p.x + 110, duration: 500 });
        for (let k = 0; k < 2; k++) {
          await this.animer({ targets: m, angle: -10, duration: 180 });
          this.animer({ targets: m, angle: 6, duration: 100 });
          this.onomatopee(b.x, b.y - 60, 'BLONG !', '#d8e4f0');
          Son.jouer('bouclier');
          this.cameras.main.shake(180, 0.01);
          await this.animer({ targets: p, x: p.x - 18, duration: 120, ease: 'Quad.easeOut' });
          await this.attendre(200);
        }
        m.setAngle(0);
        return;
      }
      // l'épée : il esquive la massue, et trouve la faille
      const lame = this.tenir(iconeObjet(this, id), { echelle: 2.6, angle: -30, dy: -8 });
      await this.animer({ targets: m, angle: -10, duration: 300 });
      this.animer({ targets: m, angle: 8, duration: 140 });
      await this.sauter(p, p.x - 40, SOL_RECIT, 50, 300);
      this.onomatopee(p.x + 70, SOL_RECIT - 40, 'BOUM !', '#fff4dc');
      this.cameras.main.shake(220, 0.012);
      this.poussiere(p.x + 70, SOL_RECIT, 10);
      m.setAngle(0);
      await this.marcherA(m.x - m.displayWidth * 0.45, 2);
      this.coupDeLame(lame);
      if (reussie) {
        this.onomatopee(m.x, m.y - 210, 'TCHAK !', '#fff4dc');
        m.setTint(0xff8080); this.time.delayedCall(180, () => m.active && m.clearTint());
        this.coupDeZoom(m.x - 30, m.y - 100, 1.3);
      } else this.onomatopee(p.x + 40, p.y - 160, 'TOC...', '#c0c0c0');
      this.tweens.add({ targets: lame, alpha: 0, delay: 300, duration: 300 });
      await this.attendre(300);
    },
    async issue(reussie) {
      const M = this.menace, p = this.perso, m = M.m;
      this.tweens.killTweensOf(m);
      if (reussie) {
        if (M.golem) {
          // le golem s'arrête, ses runes s'éteignent : il se rendort
          m.setTint(0x9a9a9a);
          this.onomatopee(m.x, m.y - 220, '...', '#a0e0ff');
          await this.animer({ targets: m, x: M.mx, duration: 900 });
          return;
        }
        if (M.bete) {
          // la Bête recule dans l'ombre de son antre
          this.onomatopee(m.x, m.y - 220, 'GRRR...', '#ffb070');
          await this.animer({ targets: m, x: 1100, alpha: 0.4, duration: 1100, ease: 'Sine.easeIn' });
          return;
        }
        // le troll vacille et tombe à la renverse
        await this.animer({ targets: m, angle: 20, duration: 500, ease: 'Quad.easeIn' });
        await this.animer({ targets: m, angle: 85, x: m.x + 60, duration: 350, ease: 'Quad.easeIn' });
        this.onomatopee(m.x, SOL_RECIT - 80, 'BADABOUM !', '#fff4dc');
        this.cameras.main.shake(400, 0.016);
        this.poussiere(m.x + 40, SOL_RECIT, 14);
        await this.attendre(600);
        return;
      }
      if (M.golem) {
        // il l'attrape et le jette dehors « par la fenêtre »
        await this.animer({ targets: m, x: p.x + 60, duration: 300 });
        this.onomatopee(p.x, p.y - 180, 'HOP !', '#ff8080');
        await this.sauter(p, p.x - 200, SOL_RECIT, 160, 800, -720);
        p.setAngle(0);
        this.poussiere(p.x, SOL_RECIT, 10);
        await this.renverse(false);
        await this.attendre(500);
        await this.debout(500);
        return;
      }
      if (M.bete) { await this.renverse(true); await this.attendre(600); await this.debout(600); return; }
      // un coup de massue
      await this.animer({ targets: m, x: p.x + 90, angle: -12, duration: 300 });
      this.animer({ targets: m, angle: 10, duration: 120 });
      this.onomatopee(p.x, p.y - 180, 'BONK !', '#ff8080');
      this.cameras.main.shake(260, 0.016);
      await this.sauter(p, p.x - 110, SOL_RECIT, 70, 500, -360);
      p.setAngle(0);
      this.sonne(p, 1500);
      await this.attendre(800);
      m.setAngle(0);
    },
  },

  // ======================= LES ESPRITS =======================
  esprits: {
    decor(X) {
      const M = this.menace;
      M.lac = texteDit(this, /eau/); M.biblio = texteDit(this, /rayons|lecteur/); M.argent = texteDit(this, /argent/);
      this.ciel(0x0a0a2a, 0.5, 600);
      if (M.biblio) {
        // les rayonnages de la bibliothèque, à perte de vue
        const g = this.garder(this.add.graphics().setDepth(1.1));
        g.fillStyle(0x2a1a12).fillRect(-50, -50, 1060, 415);
        for (let x = 0; x < 960; x += 150) {
          g.fillStyle(0x4a3020).fillRect(x, 60, 130, 305);
          for (let y = 80; y < 350; y += 40) { g.fillStyle(0x2a1a10).fillRect(x + 6, y, 118, 34); for (let b = 0; b < 14; b++) g.fillStyle(Phaser.Utils.Array.GetRandom([0x8a2a2a, 0x2a4a6a, 0x5a6a2a, 0xd8d0c0, 0x6a4a2a])).fillRect(x + 8 + b * 8, y + 6 + (b % 3) * 2, 7, 28 - (b % 3) * 2); }
        }
      } else {
        if (M.lac) this.plan_eau(Math.min(X + 220, 760), 420, 30, 0x8090c0);
        for (const [i, [ax, e]] of [[X - 200, 2.2], [X + 320, 2.4], [X + 40, 1.8]].entries()) {
          const a = this.garder(this.add.image(ax, SOL_RECIT + 4, 'arbreRecitHD').setOrigin(0.5, 1).setScale(e).setDepth(1 + i * 0.01));
          if (M.argent) a.setTint(0xd8e4f0);
        }
        for (const [px, e] of [[X + 120, 2], [X + 200, 2.4]]) this.garder(this.add.image(px, SOL_RECIT + 4, 'pierreLeveeHD').setOrigin(0.5, 1).setScale(e).setDepth(1.2));
      }
      this.brume(0xc0c8e0, 0.25, 300, 2.5);
      this.obscurite(0.7);
      if (!M.biblio) this.cielDeNuit();
      M.lanterne = { x: this.perso.x + 20, y: SOL_RECIT - 60, r: 130, vacille: true };
      this.ombreNuit.ajouter(M.lanterne);
      M.lueurLanterne = this.lueur(M.lanterne, 130, 0xffc060, 0.3);
      M.esprits = [0, 1, 2, 3].map(k => {
        const e = this.garder(this.add.image(Math.min(X + 120 + k * 60, 900), 200 + (k % 2) * 40, 'espritHD').setScale(2.2).setAlpha(0).setBlendMode(Phaser.BlendModes.SCREEN).setDepth(6.8));
        e.base = { x: e.x, y: e.y };
        return e;
      });
    },
    async avant() {
      const M = this.menace, p = this.perso;
      // les formes pâles apparaissent, tournoient, et soufflent sur sa lumière
      M.esprits.forEach((e, k) => {
        this.tweens.add({ targets: e, alpha: 0.75, duration: 600, delay: k * 250 });
        this.tweens.add({ targets: e, y: e.y - 24, x: e.x + Phaser.Math.Between(-30, 30), duration: 1000 + k * 200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      });
      this.onomatopee(M.esprits[0].x, 150, M.biblio ? 'Chhhh...' : 'Hihihi...', '#d0e0ff');
      await this.attendre(1200);
      const e = M.esprits[0];
      this.tweens.killTweensOf(e);
      await this.animer({ targets: e, x: p.x + 60, y: p.y - 110, duration: 600, ease: 'Sine.easeInOut' });
      this.onomatopee(p.x + 60, p.y - 160, 'FOUUU !', '#d0e0ff');
      Son.jouer('vent');
      await this.animer({ targets: M.lanterne, r: 30, duration: 500 });
      this.tweens.add({ targets: M.lueurLanterne, alpha: 0, duration: 400 });
      this.emotion(p, '?', 1000);
      this.tweens.add({ targets: e, x: e.base.x, y: e.base.y, duration: 900 });
    },
    async utiliser(id, reussie) {
      const M = this.menace, p = this.perso;
      if (id !== 'torche') { await this.utiliserObjet(id); return; }
      const o = this.tenir(iconeObjet(this, 'torche'), { echelle: 2.6 });
      this.bras(true); o.dy = -10;
      const bout = { suivre: () => ({ x: o.x, y: o.y - 20 }), r: 0, vacille: true };
      this.ombreNuit.ajouter(bout);
      this.lueur(bout, 0, 0xffb040, 0.45);
      M.torche = { o, bout };
      this.onomatopee(o.x, o.y - 80, 'FWOUF !', '#ffc060');
      Son.jouer('feu');
      await this.animer({ targets: bout, r: reussie ? 300 : 170, duration: 600, ease: 'Back.easeOut' });
      await this.attendre(300);
    },
    async issue(reussie) {
      const M = this.menace, p = this.perso;
      if (reussie) {
        // dans la lumière, ils se dissolvent en ricanant
        this.onomatopee(M.esprits[1].x, 140, 'Hiii !', '#d0e0ff');
        for (const [k, e] of M.esprits.entries()) {
          this.tweens.killTweensOf(e);
          this.tweens.add({ targets: e, alpha: 0, scale: 3, y: e.y - 60, duration: 700, delay: k * 120 });
          for (let j = 0; j < 4; j++) { const s = this.garder(this.add.image(e.x, e.y, 'lueurHD').setScale(1.4).setTint(0xd0e0ff).setBlendMode(Phaser.BlendModes.ADD).setDepth(6.9)); this.tweens.add({ targets: s, x: s.x + Phaser.Math.Between(-50, 50), y: s.y - Phaser.Math.Between(20, 80), alpha: 0, duration: 800, delay: k * 120 }); }
        }
        await this.attendre(900);
        this.bras(false);
        await this.marcherA(p.x + 60, 5);
        return;
      }
      // ils soufflent la torche, et l'égarent : il tourne en rond dans le noir
      if (M.torche) {
        const e = M.esprits[1];
        this.tweens.killTweensOf(e);
        await this.animer({ targets: e, x: p.x + 50, y: p.y - 130, duration: 400 });
        this.onomatopee(p.x + 50, p.y - 170, 'FOUUU !', '#d0e0ff');
        await this.animer({ targets: M.torche.bout, r: 0, duration: 500 });
        M.torche.o.setVisible(false);
        this.bras(false);
      }
      this.onomatopee(p.x, 140, 'Hihihi !', '#d0e0ff');
      for (let k = 0; k < 2; k++) { await this.marcherA(p.x + 60, 6); await this.marcherA(p.x - 60, 6); }
      p.setFlipX(false);
      this.emotion(p, 'larme', 1000);
      await this.attendre(500);
    },
  },

  // ======================= LES MORTS-VIVANTS =======================
  mortvivant: {
    decor(X) {
      const M = this.menace;
      M.remparts = texteDit(this, /rempart/); M.chevalier = texteDit(this, /chevalier/); M.tour = texteDit(this, /Tour|Nécromancien/);
      this.ciel(0x0a0a1e, 0.5, 600);
      if (M.remparts || M.tour) {
        const g = this.garder(this.add.graphics().setDepth(1.1));
        g.fillStyle(M.tour ? 0x2a2430 : 0x4a4650).fillRect(-50, M.tour ? -50 : 230, 1060, 400);
        if (!M.tour) for (let x = 0; x < 960; x += 40) g.fillRect(x, 210, 24, 22);
        for (let y = M.tour ? 20 : 246; y < 360; y += 16) for (let x = (y / 16) % 2 ? 0 : 20; x < 960; x += 40) g.fillStyle(M.tour ? 0x1a1620 : 0x3a3640).fillRect(x, y, 38, 2);
        if (M.tour) for (const x of [200, 600]) { g.fillStyle(0x3a2a50).fillRect(x, 60, 60, 120); g.fillStyle(0x8a60c0, 0.5).fillRect(x + 8, 68, 44, 104); }
      } else {
        // le cimetière : des tombes de travers, une grille, un arbre mort
        this.garder(this.add.image(X - 160, SOL_RECIT + 4, 'arbreMortHD').setOrigin(0.5, 1).setScale(2.4).setDepth(1.05));
        const grille = this.garder(this.add.graphics().setDepth(1.1));
        for (let x = 0; x < 960; x += 16) { grille.fillStyle(0x1a1a20).fillRect(x, SOL_RECIT - 70, 3, 70); grille.fillTriangle(x - 2, SOL_RECIT - 70, x + 5, SOL_RECIT - 70, x + 1.5, SOL_RECIT - 78); }
        grille.fillStyle(0x1a1a20).fillRect(0, SOL_RECIT - 60, 960, 3).fillRect(0, SOL_RECIT - 20, 960, 3);
      }
      M.tombes = [];
      const n = M.chevalier ? 1 : 3;
      for (let i = 0; i < n; i++) {
        const tx = Math.min(X + 110 + i * 80, 900);
        if (!M.remparts && !M.tour) M.tombes.push(this.garder(this.add.image(tx + 24, SOL_RECIT + 4, 'tombeHD').setOrigin(0.5, 1).setScale(2.4).setAngle((i % 2 ? -1 : 1) * 6).setDepth(2.5)));
      }
      M.morts = [];
      for (let i = 0; i < n; i++) {
        const sx = Math.min(X + 110 + i * 80, 900);
        const s = this.garder(this.add.image(sx, SOL_RECIT + (M.remparts || M.tour ? 0 : 130), 'squeletteHD').setOrigin(0.5, 1).setScale(M.chevalier ? 3.2 : 2.5).setDepth(2.9).setAlpha(M.remparts || M.tour ? 0 : 1));
        if (M.chevalier) s.setTint(0xd0d8e8);
        M.morts.push(s);
      }
      // la terre retournée devant les tombes (elle cache les morts qui remontent)
      if (!M.remparts && !M.tour) { M.terre = this.garder(this.add.graphics().setDepth(3.2)); M.terre.fillStyle(0x3a2a1e).fillRect(-50, SOL_RECIT, 1060, 140); for (const s of M.morts) M.terre.fillStyle(0x5a4030).fillEllipse(s.x, SOL_RECIT + 2, 60, 10); }
      this.brume(0x8090a8, 0.3, 320, 3.3);
      this.cielDeNuit(0xd8e0c8);
    },
    async avant() {
      const M = this.menace, p = this.perso;
      if (M.remparts || M.tour) {
        for (const [k, s] of M.morts.entries()) { s.setX(s.x + 120); this.tweens.add({ targets: s, alpha: 1, x: s.x - 120, duration: 900, delay: k * 250 }); }
        await this.attendre(1200);
      } else {
        // une main sort de terre... puis ils se relèvent, en claquant des dents
        for (const [k, s] of M.morts.entries()) {
          this.poussiere(s.x, SOL_RECIT, 8, 0x5a4030);
          this.tweens.add({ targets: s, y: SOL_RECIT, duration: 900, delay: k * 300, ease: 'Back.easeOut' });
        }
        await this.attendre(900 + M.morts.length * 300);
      }
      this.onomatopee(M.morts[0].x, SOL_RECIT - 170, 'CLAC CLAC !', '#e8e0c8');
      Son.jouer('coup', { force: 0.4 });
      for (const s of M.morts) this.tweens.add({ targets: s, angle: 4, duration: 160, yoyo: true, repeat: -1 });
      if (M.chevalier) this.parole(M.morts[0], 'En garde, vivant !', 1500);
      this.emotion(p, '!', 900);
      await this.attendre(500);
    },
    async utiliser(id, reussie) {
      const M = this.menace, p = this.perso;
      if (id === 'bouclier') {
        const b = this.tenir(iconeObjet(this, 'bouclier'), { echelle: 3.2, dy: -50, dx: 12 });
        for (const [k, s] of M.morts.entries()) {
          this.tweens.killTweensOf(s);
          await this.animer({ targets: s, x: p.x + 70 + k * 20, duration: 350 });
          this.onomatopee(b.x, b.y - 60 - k * 8, k === M.morts.length - 1 && !reussie ? 'AÏE !' : 'BLONG !', k === M.morts.length - 1 && !reussie ? '#ff8080' : '#d8e4f0');
          Son.jouer('bouclier', { force: 0.7 });
          this.cameras.main.shake(140, 0.008);
          await this.animer({ targets: s, x: s.x + 60, duration: 200 });
        }
        if (reussie) { for (const s of M.morts) this.osEnMorceaux(s.x, s.y); M.morts.forEach(s => s.setVisible(false)); M.brises = true; }
        return;
      }
      if (id !== 'epee') { await this.utiliserObjet(id); return; }
      const lame = this.tenir(iconeObjet(this, id), { echelle: 2.6, angle: -30, dy: -8 });
      const cible = M.morts[0];
      this.tweens.killTweensOf(cible);
      await Promise.all([this.marcherA(cible.x - 90, 3), this.animer({ targets: cible, x: cible.x - 30, duration: 400 })]);
      const coups = M.chevalier ? 3 : 1;
      for (let k = 0; k < coups; k++) {
        this.coupDeLame(lame);
        this.onomatopee((p.x + cible.x) / 2, SOL_RECIT - 140, k < coups - 1 ? 'TCHING !' : 'TCHAK !', '#fff4dc');
        for (let e = 0; e < 5; e++) { const s = this.garder(this.add.image((p.x + cible.x) / 2, SOL_RECIT - 90, 'eclat').setScale(1.4).setTint(0xfff0a0).setDepth(7)); const a = Math.random() * 6.3; this.tweens.add({ targets: s, x: s.x + Math.cos(a) * 40, y: s.y + Math.sin(a) * 30, alpha: 0, duration: 300 }); }
        await this.animer({ targets: cible, x: cible.x + 8, duration: 90, yoyo: true });
        await this.attendre(200);
      }
      if (reussie) {
        // ils volent en morceaux
        for (const s of M.morts) { this.osEnMorceaux(s.x, s.y); s.setVisible(false); }
        M.brises = true;
        Son.jouer('coup');
      }
      this.tweens.add({ targets: lame, alpha: 0, delay: 400, duration: 300 });
      await this.attendre(500);
    },
    async issue(reussie) {
      const M = this.menace, p = this.perso;
      if (reussie) {
        if (!M.brises) for (const s of M.morts) { this.osEnMorceaux(s.x, s.y); s.setVisible(false); }
        this.onomatopee(p.x + 120, SOL_RECIT - 160, 'CRAC !', '#e8e0c8');
        await this.attendre(700);
        return;
      }
      // des mains osseuses l'agrippent ; il se débat et s'enfuit en courant
      const s = M.morts[0];
      this.tweens.killTweensOf(s);
      await this.animer({ targets: s, x: p.x + 50, duration: 300 });
      this.griffures(p.x + 6, p.y - 70);
      this.onomatopee(p.x, p.y - 170, 'AÏE !', '#ff8080');
      this.cameras.main.shake(200, 0.01);
      await this.animer({ targets: p, x: p.x + 4, duration: 60, yoyo: true, repeat: 5 });
      await this.marcherA(p.x - 100, 2);
      p.setFlipX(false);
      await this.attendre(300);
    },
  },

  // ======================= LES MALÉDICTIONS =======================
  malediction: {
    decor(X) {
      const M = this.menace, p = this.perso;
      M.trone = texteDit(this, /trône/); M.momies = texteDit(this, /momies/); M.cristal = texteDit(this, /cristal/);
      M.grimoire = texteDit(this, /grimoire/); M.reliques = texteDit(this, /reliques|bénédiction/); M.graine = texteDit(this, /graine/);
      const sacre = M.reliques;
      M.couleur = sacre ? 0xffe070 : 0xa060e0;
      this.ciel(0x0a0418, 0.4, 600);
      const g = this.garder(this.add.graphics().setDepth(1.1));
      if (M.momies) {
        g.fillStyle(0xc8a870).fillRect(-50, -50, 1060, 415);
        for (let y = 40; y < 340; y += 26) for (let x = (y / 26) % 2 ? 0 : 30; x < 960; x += 60) { g.fillStyle(0xb89860).fillRect(x, y, 58, 24); for (let h = 0; h < 4; h++) g.fillStyle(0x6a4a2a).fillRect(x + 8 + h * 12, y + 6, 6, 10); }
        for (const sx of [X + 60, X + 300]) this.garder(this.add.image(Math.min(sx, 920), SOL_RECIT + 2, 'sarcophageHD').setOrigin(0.5, 1).setScale(2.6).setDepth(1.3));
      } else if (M.trone) {
        g.fillStyle(0x2a1a2a).fillRect(-50, -50, 1060, 415);
        for (const cx of [X - 100, X + 340]) { g.fillStyle(0x4a3a4a).fillRect(cx, 40, 40, 330); g.fillStyle(0x5a4a5a).fillRect(cx, 40, 10, 330); }
        g.fillStyle(0x6a1a2a).fillRect(X + 120, 120, 120, 245);
        g.fillStyle(0xc8a040).fillRect(X + 150, 200, 60, 90).fillRect(X + 140, 280, 80, 20);   // le trône
      } else if (M.reliques || M.grimoire || M.cristal) {
        g.fillStyle(0x3a3040).fillRect(-50, -50, 1060, 415);
        for (let y = 30; y < 360; y += 22) for (let x = (y / 22) % 2 ? 0 : 26; x < 960; x += 52) g.fillStyle(0x4a4050).fillRect(x, y, 50, 20);
      } else {
        for (const [ax, e] of [[X - 160, 2.2], [X + 330, 2.4]]) this.garder(this.add.image(ax, SOL_RECIT + 4, 'arbreRecitHD').setOrigin(0.5, 1).setScale(e).setDepth(1.05).setTint(0xb0c8d8));
      }
      // l'autel et ce qui est maudit dessus
      M.ax = Math.min(p.x + 170, 860);
      this.garder(this.add.image(M.ax, SOL_RECIT + 4, 'autelHD').setOrigin(0.5, 1).setScale(2.6).setDepth(2));
      const cle = M.grimoire ? iconeObjet(this, 'parchemin') : M.cristal ? 'lueurHD' : M.graine ? 'lueurHD' : M.reliques ? 'lueurHD' : 'lueurHD';
      M.objet = this.garder(this.add.image(M.ax, SOL_RECIT - 92, this.textures.exists(cle) ? cle : 'lueurHD').setScale(cle === 'lueurHD' ? 3 : 2.4).setDepth(2.1));
      if (cle === 'lueurHD') M.objet.setTint(M.cristal ? 0xb0e0ff : M.graine ? 0x90ff90 : M.couleur).setBlendMode(Phaser.BlendModes.ADD);
      M.aura = this.garder(this.add.image(M.ax, SOL_RECIT - 92, 'halo').setScale(1.4).setTint(M.couleur).setAlpha(0.5).setBlendMode(Phaser.BlendModes.ADD).setDepth(2.2));
      this.tweens.add({ targets: M.aura, scale: 1.8, alpha: 0.3, duration: 900, yoyo: true, repeat: -1 });
      this.obscurite(0.55, 0x0a0418);
      this.ombreNuit.ajouter({ x: M.ax, y: SOL_RECIT - 90, r: 160, vacille: true });
    },
    async avant() {
      const M = this.menace, p = this.perso;
      // une voix qui murmure ; des runes tournent ; la malédiction rampe vers lui
      this.onomatopee(M.ax, 110, M.momies ? 'Lis... nos... noms...' : 'Chhhh...', '#d0b0ff');
      M.runes = [];
      for (let k = 0; k < 6; k++) {
        const r = this.garder(this.add.text(M.ax, SOL_RECIT - 90, Phaser.Utils.Array.GetRandom(['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᛉ', 'ᛟ']), style(22, M.couleur === 0xffe070 ? '#fff0a0' : '#d0a0ff', { fontStyle: 'bold', brut: true })).setOrigin(0.5).setDepth(6.9).setAlpha(0));
        M.runes.push(r);
      }
      const u = { a: 0 };
      M.ronde = this.tweens.add({ targets: u, a: Math.PI * 2, duration: 2400, repeat: -1, onUpdate: () => M.runes.forEach((r, k) => { const a = u.a + k * 1.05; r.setPosition(M.ax + Math.cos(a) * 70, SOL_RECIT - 90 + Math.sin(a) * 30).setAlpha(0.4 + 0.5 * (Math.sin(a) + 1) / 2); }) });
      this.garder({ destroy: () => M.ronde.remove() });
      await this.attendre(800);
      // des filets de fumée vers lui
      M.fumee = this.time.addEvent({ delay: 120, loop: true, callback: () => {
        const f = this.garder(this.add.image(M.ax - 20, SOL_RECIT - 80, 'halo').setScale(0.3).setTint(M.couleur).setAlpha(0.6).setBlendMode(Phaser.BlendModes.ADD).setDepth(6.85));
        this.tweens.add({ targets: f, x: p.x + Phaser.Math.Between(-10, 10), y: p.y - Phaser.Math.Between(30, 100), scale: 0.6, alpha: 0, duration: 900, onComplete: () => f.destroy() });
      } });
      this.garder({ destroy: () => M.fumee.remove() });
      p.setTint(M.couleur === 0xffe070 ? 0xfff0c0 : 0xd8b0ff);
      this.emotion(p, '!', 900);
      await this.geste(p, 'tremble');
    },
    async utiliser(id, reussie) {
      const M = this.menace, p = this.perso;
      if (id !== 'amulette') { await this.utiliserObjet(id); return; }
      // il brandit l'amulette : une bulle dorée l'entoure, les runes éclatent
      this.bras(true);
      const a = this.tenir(iconeObjet(this, 'amulette'), { echelle: 2.6, dy: -16 });
      const bulle = this.garder(this.add.circle(p.x, p.y - p.displayHeight * 0.5, 10, 0xffe8a0, 0.18).setStrokeStyle(3, 0xffe070, 0.9).setDepth(6.9));
      const h = this.garder(this.add.image(a.x, a.y, 'halo').setScale(0.4).setTint(0xffe070).setAlpha(0.8).setBlendMode(Phaser.BlendModes.ADD).setDepth(6.95));
      this.chaqueImage(() => { if (h.active) h.setPosition(a.x, a.y); });
      this.cameras.main.flash(250, 200, 170, 80);
      await this.animer({ targets: bulle, radius: reussie ? 90 : 55, duration: 500, ease: 'Back.easeOut' });
      this.tweens.add({ targets: h, scale: 1.4, duration: 400, yoyo: true, repeat: 1 });
      if (reussie) {
        M.fumee.remove(); M.ronde.remove();
        this.onomatopee(M.ax, 120, 'KRRRSH !', '#ffe070');
        for (const r of M.runes) { this.tweens.add({ targets: r, scale: 2.2, alpha: 0, duration: 400 }); const s = this.garder(this.add.image(r.x, r.y, 'eclat').setScale(1.8).setTint(0xffe070).setDepth(7)); this.tweens.add({ targets: s, scale: 0.2, alpha: 0, angle: 180, duration: 500 }); }
        this.tweens.add({ targets: M.aura, alpha: 0, duration: 600 });
        p.clearTint();
      } else {
        // la bulle se fissure
        this.onomatopee(p.x, p.y - 180, 'CRIIIC...', '#d0a0ff');
        await this.animer({ targets: bulle, alpha: 0, scale: 1.3, duration: 400 });
      }
      this.tweens.add({ targets: bulle, alpha: 0, delay: 600, duration: 400 });
      await this.attendre(600);
      this.bras(false);
      this.tweens.add({ targets: [a, h], alpha: 0, duration: 300 });
    },
    async issue(reussie) {
      const M = this.menace, p = this.perso;
      if (reussie) { p.clearTint(); this.emotion(p, 'joie', 1000); await this.attendre(500); return; }
      // la malédiction le frappe en plein cœur : une ombre le suit désormais
      if (M.fumee) M.fumee.remove();
      this.cameras.main.flash(300, 120, 40, 180);
      this.onomatopee(p.x, p.y - 180, 'OUF !', '#d0a0ff');
      await this.animer({ targets: p, angle: -10, duration: 150, yoyo: true });
      const ombre = this.garder(this.add.image(p.x, p.y - 60, 'halo').setScale(1.1, 1.8).setTint(0x4a1a6a).setAlpha(0.5).setDepth(2.95));
      this.chaqueImage(() => { if (ombre.active) ombre.setPosition(p.x, p.y - 60); });
      this.tweens.add({ targets: ombre, alpha: 0.25, duration: 600, yoyo: true, repeat: -1 });
      await this.attendre(700);
    },
  },

  // ======================= LES FEUX FOLLETS =======================
  feufollet: {
    decor(X) {
      const M = this.menace;
      this.ciel(0x05101a, 0.5, 600);
      M.ex = Math.min(X + 200, 820);
      this.plan_eau(M.ex + 60, 380, 34, 0x6a8aa0);
      const g = this.garder(this.add.graphics().setDepth(1.6));
      for (const rx of [M.ex - 140, M.ex - 120, M.ex + 260]) for (let k = 0; k < 5; k++) g.lineStyle(2, 0x4a6a3a).lineBetween(rx + k * 4, SOL_RECIT + 2, rx + k * 5 - 6, SOL_RECIT - 30 - (k % 2) * 12);
      for (const [ax, e] of [[X - 180, 2], [M.ex + 300, 2.2]]) this.garder(this.add.image(ax, SOL_RECIT + 4, 'arbreMortHD').setOrigin(0.5, 1).setScale(e).setDepth(1.05));
      this.brume(0x90a8b8, 0.25, 320, 2.5);
      this.obscurite(0.6, 0x020810);
      this.cielDeNuit();
      M.follets = [];
      for (let k = 0; k < 5; k++) {
        const l = { x: M.ex - 60 + k * 50, y: 220 + (k % 3) * 30, r: 50, vacille: true };
        this.ombreNuit.ajouter(l);
        const s = this.garder(this.add.image(l.x, l.y, 'lueurHD').setScale(3).setBlendMode(Phaser.BlendModes.ADD).setDepth(6.9));
        const h = this.garder(this.add.image(l.x, l.y, 'halo').setScale(0.7).setTint(0x60ffc0).setAlpha(0.5).setBlendMode(Phaser.BlendModes.ADD).setDepth(6.9));
        const reflet = this.garder(this.add.image(l.x, SOL_RECIT + 14, 'halo').setScale(0.6, 0.15).setTint(0x60ffc0).setAlpha(0.5).setBlendMode(Phaser.BlendModes.ADD).setDepth(6.9));
        this.chaqueImage(() => { if (reflet.active) reflet.setX(l.x); });
        this.tweens.add({ targets: l, y: l.y - 30, x: l.x + Phaser.Math.Between(-30, 30), duration: 900 + k * 170, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', onUpdate: () => { s.setPosition(l.x, l.y); h.setPosition(l.x, l.y); } });
        M.follets.push({ l, s, h });
      }
    },
    async avant() {
      const M = this.menace, p = this.perso;
      // leur chant l'envoûte : il marche vers l'eau, le regard vide
      this.onomatopee(M.ex, 150, '♪ La la laaa ♪', '#a0ffd0');
      await this.attendre(700);
      this.emotion(p, '♥', 1200);
      await this.marcherA(M.ex - 150, 8);
      M.eau = await this.entrerDansLEau(M.ex - 60, 0.45, 0x2a4a5a);
    },
    async utiliser(id, reussie) {
      const M = this.menace, p = this.perso;
      await this.boireFiole(id, reussie);
      if (reussie) {
        // il reprend ses esprits d'un coup
        this.emotion(p, '!', 900);
        this.cameras.main.flash(200, 120, 255, 200);
        for (const f of M.follets) { this.tweens.killTweensOf(f.l); this.tweens.add({ targets: f.l, x: f.l.x + Phaser.Math.Between(150, 300), y: f.l.y - 120, duration: 900, onUpdate: () => { f.s.setPosition(f.l.x, f.l.y); f.h.setPosition(f.l.x, f.l.y); } }); }
      }
    },
    async issue(reussie) {
      const M = this.menace, p = this.perso;
      if (!reussie) {
        // il s'enfonce... PLOUF ; on le repêche, trempé
        await this.animer({ targets: p, y: SOL_RECIT + 40, duration: 700, ease: 'Sine.easeIn' });
        this.onomatopee(p.x, SOL_RECIT - 80, 'PLOUF !', '#a8d0ff');
        for (let k = 0; k < 12; k++) { const g = this.garder(this.add.circle(p.x + (Math.random() - 0.5) * 30, SOL_RECIT - 4, 2 + Math.random() * 2, 0xe8fcff, 0.9).setDepth(4)); this.sauter(g, g.x + Phaser.Math.Between(-40, 40), SOL_RECIT, 40 + Math.random() * 40, 500).then(() => g.destroy()); }
        await this.attendre(600);
        p.setY(SOL_RECIT).setTint(0xa8c8ff);
      }
      p.setFlipX(true);
      await M.eau.sortir();
      await this.marcherA(M.ex - 170, 5);
      p.setFlipX(false);
      if (!reussie) await this.animer({ targets: p, angle: 10, duration: 100, yoyo: true, repeat: 3 });   // il s'ébroue
      p.clearTint();
    },
  },

  // ======================= LES CHAMPIGNONS =======================
  champignons: {
    decor(X) {
      const M = this.menace;
      M.champis = [];
      for (const [cx, e] of [[X + 20, 3], [X + 110, 4.2], [X + 220, 3.4], [X - 80, 2.6], [X + 300, 2.8]]) {
        const c = this.garder(this.add.image(Math.min(cx, 940), SOL_RECIT + 3, 'champignonsHD').setOrigin(0.5, 1).setScale(e).setDepth(cx < X ? 2 : 2.6));
        M.champis.push(c);
      }
      for (const [ax, e] of [[X - 200, 2.2], [X + 360, 2.4]]) this.garder(this.add.image(ax, SOL_RECIT + 4, 'arbreRecitHD').setOrigin(0.5, 1).setScale(e).setDepth(1.05));
      this.vent(0xd0ff60, { vx: 0.1, vy: -0.5, n: 1, echelle: 0.9, alpha: 0.6, duree: 2400 });
    },
    async avant() {
      const M = this.menace, p = this.perso;
      // il en cueille un, le croque...
      await this.marcherA(M.champis[0].x - 30, 5);
      await this.aGenoux();
      const c = this.tenir('champignonsHD', { echelle: 1.2 });
      await this.debout(300);
      await this.animer({ targets: c, dy: -p.displayHeight * 0.5, duration: 300 });
      this.onomatopee(p.x + 30, p.y - 170, 'Crunch !', '#f0e0a0');
      c.setVisible(false);
      await this.attendre(500);
      // ... et le monde se met à onduler de toutes les couleurs
      this.emotion(p, '?', 900);
      const u = { t: 0 };
      M.trip = this.tweens.add({ targets: u, t: 1, duration: 3000, repeat: -1, onUpdate: () => {
        const c2 = Phaser.Display.Color.HSVToRGB(u.t, 0.6, 1);
        this.voile.setFillStyle(c2.color, 0.25);
        this.planMoyen.setScale(1, 1 + Math.sin(u.t * Math.PI * 4) * 0.04);
        M.champis.forEach((m, k) => m.setScale(m.scaleX, Math.abs(m.scaleX) * (1 + Math.sin(u.t * Math.PI * 4 + k) * 0.12)));
        if (p.active) p.setTint(Phaser.Display.Color.HSVToRGB((u.t + 0.5) % 1, 0.3, 1).color);
      } });
      this.garder({ destroy: () => { M.trip.remove(); this.voile.setFillStyle(0x05051a, 0); this.planMoyen.setScale(1); } });
      // des champignons qui dansent autour de lui
      M.danseurs = [0, 1, 2].map(k => this.garder(this.add.image(p.x + 60 + k * 50, SOL_RECIT, 'champignonsHD').setOrigin(0.5, 1).setScale(1.6).setDepth(3.1)));
      M.danseurs.forEach((d, k) => this.tweens.add({ targets: d, y: SOL_RECIT - 20, angle: 15, duration: 300, yoyo: true, repeat: -1, delay: k * 100 }));
      this.onomatopee(p.x + 100, p.y - 150, 'Youpiii !', '#ff90e0');
      await this.animer({ targets: p, angle: 10, duration: 250, yoyo: true, repeat: 2 });
    },
    async utiliser(id, reussie) {
      const M = this.menace, p = this.perso;
      await this.boireFiole(id, reussie);
      if (reussie) {
        M.trip.remove();
        this.voile.setFillStyle(0x05051a, 0);
        this.planMoyen.setScale(1);
        M.champis.forEach(m => m.setScale(m.scaleX, Math.abs(m.scaleX)));
        M.danseurs.forEach(d => { this.tweens.killTweensOf(d); this.tweens.add({ targets: d, alpha: 0, scale: 0, duration: 400 }); });
        p.clearTint();
        this.emotion(p, '!', 900);
      }
    },
    async issue(reussie) {
      const M = this.menace, p = this.perso;
      if (reussie) { await this.geste(p, 'hoche'); return; }
      // il parle aux arbres, puis s'endort sur place
      this.parole(p, 'Bonjour, Monsieur l\'Arbre !', 1500);
      await this.attendre(1300);
      await this.aGenoux();
      await this.renverse(false);
      this.onomatopee(p.x, p.y - 80, 'Zzz...', '#c0c0ff');
      await this.attendre(900);
      M.trip.remove(); this.voile.setFillStyle(0x05051a, 0); this.planMoyen.setScale(1); p.clearTint();
      M.danseurs.forEach(d => d.setVisible(false));
      await this.debout(600);
    },
  },

  // ======================= LES SANGSUES =======================
  sangsues: {
    decor(X) {
      const M = this.menace;
      M.ex = Math.min(X + 120, 760);
      this.plan_eau(M.ex + 60, 300, 34, 0x5a7a50);
      const g = this.garder(this.add.graphics().setDepth(1.6));
      for (const rx of [M.ex - 110, M.ex + 210]) for (let k = 0; k < 6; k++) g.lineStyle(2, 0x4a6a3a).lineBetween(rx + k * 4, SOL_RECIT + 2, rx + k * 5 - 6, SOL_RECIT - 32 - (k % 2) * 14);
      // la cloche, au fond de la mare (ou un trésor)
      M.cloche = this.garder(this.add.image(M.ex + 60, SOL_RECIT + 4, 'lueurHD').setScale(2.6).setTint(0xffd060).setBlendMode(Phaser.BlendModes.ADD).setDepth(1.55));
      this.tweens.add({ targets: M.cloche, alpha: 0.4, duration: 600, yoyo: true, repeat: -1 });
    },
    async avant() {
      const M = this.menace, p = this.perso;
      await this.marcherA(M.ex - 110, 5);
      M.eau = await this.entrerDansLEau(M.ex + 40, 0.42, 0x3a5a40);
      // il plonge (BLOUP), cherche à tâtons, remonte avec...
      await this.animer({ targets: p, y: SOL_RECIT + 60, duration: 400, ease: 'Quad.easeIn' });
      this.onomatopee(p.x, SOL_RECIT - 60, 'BLOUP !', '#a8d0a0');
      for (let k = 0; k < 6; k++) { const b = this.garder(this.add.circle(p.x + Phaser.Math.Between(-15, 15), SOL_RECIT, 3, 0xd0f0d0, 0.8).setDepth(3.5)); this.tweens.add({ targets: b, y: b.y - 20, alpha: 0, duration: 500, delay: k * 150 }); }
      await this.attendre(900);
      await this.animer({ targets: p, y: SOL_RECIT, duration: 400, ease: 'Quad.easeOut' });
      M.cloche.setVisible(false);
      this.tenir('lueurHD', { echelle: 2 }).setTint(0xffd060).setBlendMode(Phaser.BlendModes.ADD);
      // ... des sangsues collées aux jambes !
      p.setFlipX(true);
      await M.eau.sortir();
      await this.marcherA(M.ex - 130, 5);
      p.setFlipX(false);
      M.sangsues = [];
      for (let k = 0; k < 5; k++) {
        const s = this.garder(this.add.ellipse(0, 0, 9, 5, 0x1a1a14).setStrokeStyle(1, 0x3a3a2a).setDepth(3.3));
        const dx = (k % 2 ? -1 : 1) * (4 + k * 2), dy = 10 + k * 7;
        this.chaqueImage(() => { if (s.active) s.setPosition(p.x + dx, p.y - dy); });
        this.tweens.add({ targets: s, scaleX: 0.7, duration: 300 + k * 60, yoyo: true, repeat: -1 });
        M.sangsues.push(s);
      }
      this.emotion(p, '!', 900);
      this.onomatopee(p.x, p.y - 170, 'BEURK !', '#a0c080');
    },
    async utiliser(id, reussie) {
      const M = this.menace, p = this.perso;
      // il les arrache une par une (PLOP), puis bande les morsures
      await this.aGenoux();
      for (const s of M.sangsues) {
        this.onomatopee(s.x + 20, s.y - 40, 'PLOP !', '#a0c080');
        this.sauter(s, s.x + Phaser.Math.Between(40, 100), SOL_RECIT, 40, 400);
        await this.attendre(180);
      }
      await this.debout(300);
      if (id === 'bandage') {
        const o = this.tenir(iconeObjet(this, 'bandage'), { echelle: 2.2, dy: 30 });
        for (let k = 0; k < 2; k++) await this.animer({ targets: o, dx: 20, angle: 180, duration: 180, yoyo: true });
        o.destroy();
        if (reussie) { this.blesse = true; p.setTexture(this.cleCorps()); this.emotion(p, 'joie', 900); }
      }
    },
    async issue(reussie) {
      const p = this.perso;
      if (reussie) { await this.attendre(300); return; }
      p.setTint(0xd8e0b0);
      this.emotion(p, 'larme', 1000);
      await this.animer({ targets: p, angle: -6, duration: 260, yoyo: true, repeat: 1 });
    },
  },

  // ======================= LA SOIF (le désert) =======================
  soif: {
    decor(X) {
      const M = this.menace;
      M.besoin = 'gourde';
      // les dunes, les cactus, un crâne, les vautours
      const g = this.garder(this.add.graphics().setDepth(1.05));
      const rouge = texteDit(this, /rouge/);
      const sable = rouge ? 0xc87a4a : 0xe8c888;
      for (let k = 0; k < 6; k++) g.fillStyle(Phaser.Display.Color.ValueToColor(sable).darken(k % 2 ? 8 : 0).color).fillEllipse(k * 200 - 40, SOL_RECIT + 30, 360, 150);
      g.fillStyle(sable).fillRect(-50, SOL_RECIT - 8, 1060, 30);
      for (const cx of [X - 120, X + 260]) this.garder(this.add.image(cx, SOL_RECIT + 2, 'cactusHD').setOrigin(0.5, 1).setScale(2.4).setDepth(1.6));
      g.fillStyle(0xe8e0c8).fillCircle(X + 140, SOL_RECIT - 6, 7); g.fillStyle(0x3a3020).fillRect(X + 136, SOL_RECIT - 9, 3, 3).fillRect(X + 141, SOL_RECIT - 9, 3, 3);
      M.vautours = [0, 1].map(k => {
        const v = this.garder(this.add.graphics().setDepth(1));
        v.lineStyle(3, 0x2a1a10).beginPath().moveTo(-12, -4).lineTo(-5, 1).lineTo(0, -2).lineTo(5, 1).lineTo(12, -4).strokePath();
        this.tweens.add({ targets: v, scaleY: 0.6, duration: 400, yoyo: true, repeat: -1, delay: k * 150 });
        const u = { a: k * 3 };
        this.tweens.add({ targets: u, a: u.a + Math.PI * 2, duration: 5000, repeat: -1, onUpdate: () => v.setPosition(620 + Math.cos(u.a) * 120, 80 + Math.sin(u.a) * 30) });
        return v;
      });
      M.soleil = this.garder(this.add.image(760, 70, 'halo').setScale(2.4).setTint(0xfff0a0).setAlpha(0.9).setBlendMode(Phaser.BlendModes.ADD).setDepth(-0.3));
      M.disque = this.garder(this.add.circle(760, 70, 22, 0xfff8d0).setDepth(-0.31));
      this.tweens.add({ targets: M.soleil, scale: 2.9, duration: 900, yoyo: true, repeat: -1 });
      for (let k = 0; k < 6; k++) {
        const l = this.garder(this.add.rectangle(480, 260 + k * 16, 960, 2, 0xfff0d0, 0.18).setDepth(6.6));
        this.tweens.add({ targets: l, x: 500, alpha: 0.05, duration: 500 + k * 90, yoyo: true, repeat: -1 });
      }
      this.ciel(0xffc060, 0.15, 600);
      M.soif = true;
    },
    async avant() {
      const p = this.perso;
      // il avance péniblement ; le sable brûle à chaque pas
      for (let k = 0; k < 3; k++) {
        await this.marcherA(p.x + 30, 12);
        this.poussiere(p.x, SOL_RECIT, 4, 0xe8c888);
        await this.animer({ targets: p, y: SOL_RECIT - 8, duration: 90, yoyo: true });   // aïe, ça brûle
      }
      this.gouttes(0x8ac8f0, 5);
      this.onomatopee(p.x + 60, p.y - 170, 'De l\'eau...', '#f0e0b0');
      await this.aGenoux();
      await this.attendre(400);
      await this.debout(400);
    },
    utiliser(id, reussie) { return SCENES_EPREUVES.route.utiliser.call(this, id, reussie); },
    issue(reussie) { return SCENES_EPREUVES.route.issue.call(this, reussie); },
  },

  // ======================= LA TEMPÊTE DE SABLE =======================
  tempete: {
    decor() {
      const M = this.menace;
      const g = this.garder(this.add.graphics().setDepth(1.05));
      for (let k = 0; k < 6; k++) g.fillStyle(k % 2 ? 0xd8b878 : 0xe8c888).fillEllipse(k * 200 - 40, SOL_RECIT + 30, 360, 150);
      g.fillStyle(0xe8c888).fillRect(-50, SOL_RECIT - 8, 1060, 30);
      // le mur de sable qui arrive de la droite
      M.mur = this.garder(this.add.image(1300, 200, 'halo').setScale(9, 6).setTint(0xc89a5a).setAlpha(0.9).setDepth(6.6));
      this.ciel(0xe0b070, 0.15, 600);
    },
    async avant() {
      const M = this.menace, p = this.perso;
      this.emotion(p, '!', 900);
      this.onomatopee(760, 120, 'FSHHHHH...', '#f0d0a0');
      Son.jouer('vent', { force: 1.4 });
      await this.animer({ targets: M.mur, x: 480, duration: 1600, ease: 'Sine.easeIn' });
      this.ciel(0xb08040, 0.55, 600);
      M.sable = this.vent(0xe8c890, { vx: -2.6, vy: 0.1, n: 7, echelle: 1, alpha: 0.75, duree: 700 });
      this.tweens.add({ targets: M.mur, alpha: 0.55, duration: 600 });
      // il se protège le visage, courbé contre le vent
      await this.animer({ targets: p, angle: 12, duration: 300 });
      this.tweens.add({ targets: p, x: p.x - 4, duration: 90, yoyo: true, repeat: -1 });
    },
    async utiliser(id, reussie) {
      const M = this.menace, p = this.perso;
      if (id !== 'cape') { await this.utiliserObjet(id); return; }
      // il s'enroule dans la cape et s'accroupit, dos au vent
      this.tweens.killTweensOf(p);
      this.enroulerCape(true);
      await this.aGenoux();
      this.onomatopee(p.x, p.y - 160, reussie ? 'Ouf...' : 'Hmpf...', '#f0d0a0');
      await this.attendre(1400);
      void M;
    },
    async issue(reussie) {
      const M = this.menace, p = this.perso;
      this.tweens.killTweensOf(p);
      if (!reussie) {
        // le sable l'ensevelit à moitié
        const tas = this.garder(this.add.ellipse(p.x, SOL_RECIT + 6, 90, 50, 0xe0c080).setDepth(3.3).setScale(0.2));
        await this.animer({ targets: tas, scale: 1, duration: 900 });
        this.onomatopee(p.x, p.y - 170, 'Pfff !', '#f0d0a0');
        await this.attendre(500);
        this.tweens.add({ targets: tas, alpha: 0, duration: 600 });
      }
      // la tempête passe
      if (M.sable) M.sable.remove();
      this.tweens.add({ targets: M.mur, x: -400, alpha: 0, duration: 1400 });
      await this.ciel(0xe0b070, 0.1, 1200);
      this.enroulerCape(false);
      await this.debout(500);
      await this.animer({ targets: p, angle: 8, duration: 100, yoyo: true, repeat: 3 });   // il secoue le sable
    },
  },

  // ======================= LE FROID =======================
  froid: {
    decor(X) {
      const M = this.menace;
      M.lac = texteDit(this, /lac/); M.remparts = texteDit(this, /rempart/); M.brumeux = texteDit(this, /brume/);
      const g = this.garder(this.add.graphics().setDepth(1.1));
      if (M.remparts) {
        g.fillStyle(0x5a5a68).fillRect(-50, 230, 1060, 140);
        for (let x = 0; x < 960; x += 40) g.fillRect(x, 210, 24, 22);
        g.fillStyle(0xffffff).fillRect(-50, 206, 1060, 4);
      } else if (M.lac) {
        g.fillStyle(0xc8e0f0).fillEllipse(X + 220, SOL_RECIT + 10, 520, 40);
        g.fillStyle(0xffffff, 0.6).fillEllipse(X + 180, SOL_RECIT + 4, 200, 6);
      }
      g.fillStyle(0xf0f6fa).fillRect(-50, SOL_RECIT - 4, 1060, 30);
      for (let x = -40; x < 1000; x += 30) g.fillStyle(0xffffff).fillEllipse(x, SOL_RECIT - 4, 50, 10);
      for (const [ax, e] of [[X - 180, 2.2], [X + 300, 2.4]]) this.garder(this.add.image(ax, SOL_RECIT + 4, 'arbreMortHD').setOrigin(0.5, 1).setScale(e).setTint(0xd8e8f8).setDepth(1.05));
      this.ciel(0x8aa8d0, 0.35, 600);
      if (M.brumeux) this.brume(0xe0e8f0, 0.35, 290, 6.7);
      M.neige = this.vent(0xffffff, { vx: -1.6, vy: 0.6, n: 5, echelle: 1.1, duree: 1200 });
    },
    async avant() {
      const M = this.menace, p = this.perso;
      // il grelotte ; son souffle fait de la buée ; il bleuit
      p.setTint(0xc8dcff);
      Son.jouer('vent', { force: 1.2 });
      M.buee = this.time.addEvent({ delay: 700, loop: true, callback: () => { const h = this.tete(); const b = this.garder(this.add.image(h.x + 14, h.y + 10, 'halo').setScale(0.15).setAlpha(0.6).setDepth(6.9)); this.tweens.add({ targets: b, x: b.x + 20, y: b.y - 10, scale: 0.4, alpha: 0, duration: 800 }); } });
      this.garder({ destroy: () => M.buee.remove() });
      this.onomatopee(p.x + 40, p.y - 170, 'Brrrr...', '#c8e0ff');
      await this.geste(p, 'tremble');
      await this.geste(p, 'tremble');
    },
    async utiliser(id, reussie) {
      const p = this.perso;
      if (id !== 'cape') { await this.utiliserObjet(id); return; }
      this.enroulerCape(true);
      await this.attendre(500);
      if (reussie) {
        this.onomatopee(p.x, p.y - 170, 'Ahhh...', '#ffe0c0');
        this.emotion(p, 'joie', 900);
      }
      await this.attendre(400);
    },
    async issue(reussie) {
      const M = this.menace, p = this.perso;
      if (reussie) { await this.marcherA(p.x + 60, 7); return; }
      // il gèle : du givre sur lui, un éternuement
      p.setTint(0xa8c8ff);
      const givre = this.garder(this.add.image(p.x, p.y - p.displayHeight * 0.5, 'halo').setScale(0.8, 1.6).setTint(0xe8f4ff).setAlpha(0.5).setDepth(3.1));
      void givre;
      await this.attendre(500);
      this.onomatopee(p.x, p.y - 170, 'ATCHOUM !', '#c8e0ff');
      await this.animer({ targets: p, angle: -10, duration: 100, yoyo: true });
      void M;
    },
  },

  // ======================= L'AVALANCHE (ou l'éboulement) =======================
  avalanche: {
    decor(X) {
      const M = this.menace;
      M.galerie = texteDit(this, /galerie/);
      M.rx = Math.min(X + 40, 700);
      if (M.galerie) {
        const g = this.garder(this.add.graphics().setDepth(0.9));
        g.fillStyle(0x3a3028).fillRect(-50, -50, 1060, 415);
        for (let k = 0; k < 40; k++) g.fillStyle(0x4a4038, 0.8).fillEllipse(hachage(k, 2, 70) * 960, 40 + hachage(k, 3, 70) * 260, 60, 30);
        for (const x of [180, 470, 760]) { g.fillStyle(0x5a4028).fillRect(x, 120, 12, 240).fillRect(x + 120, 120, 12, 240).fillRect(x - 6, 112, 144, 14); }
        this.premierPlan.setVisible(false); this.planMoyen.setVisible(false);
      } else {
        // la pente enneigée au-dessus, à droite
        const g = this.garder(this.add.graphics().setDepth(1.05));
        g.fillStyle(0xe8f0f8).fillTriangle(300, SOL_RECIT, 1000, SOL_RECIT, 1000, 20);
        g.fillStyle(0xc8d8e8).fillTriangle(600, SOL_RECIT, 1000, SOL_RECIT, 1000, 160);
        g.fillStyle(0xf0f6fa).fillRect(-50, SOL_RECIT - 4, 1060, 30);
        this.ciel(0xa8c0e0, 0.2, 600);
      }
      // le rocher (pour s'encorder)
      M.rocher = this.garder(this.add.image(M.rx, SOL_RECIT + 6, 'rocherHD').setOrigin(0.5, 1).setScale(2.4).setDepth(2.8));
    },
    async avant() {
      const M = this.menace, p = this.perso;
      // un grondement sourd... puis la coulée
      this.onomatopee(760, 100, 'GRRRRMMMM...', M.galerie ? '#d0b090' : '#e0f0ff');
      this.cameras.main.shake(900, 0.006);
      this.emotion(p, '!', 900);
      await this.attendre(900);
      await this.marcherA(M.rx - 50, 3);
    },
    async utiliser(id, reussie) {
      const M = this.menace, p = this.perso;
      if (id !== 'corde') { await this.utiliserObjet(id); return; }
      // il passe la corde autour du rocher, et autour de sa taille
      const corde = this.garder(this.add.graphics().setDepth(3.1));
      M.corde = corde;
      const dessiner = () => { if (!corde.active) return; const m = this.main(); corde.clear().lineStyle(3, 0xc8a060).lineBetween(M.rocher.x, M.rocher.y - 24, m.x, m.y).strokeEllipse(M.rocher.x, M.rocher.y - 24, 50, 14); };
      this.chaqueImage(dessiner);
      this.onomatopee(M.rocher.x, M.rocher.y - 80, 'Nœud !', '#fff4dc');
      await this.aGenoux();
      await this.attendre(500);
      void reussie;
    },
    async issue(reussie) {
      const M = this.menace, p = this.perso;
      // la vague de neige (ou de pierres) déferle
      const vague = [];
      for (let k = 0; k < 26; k++) {
        const b = this.garder(this.add.image(1000 + k * 30, SOL_RECIT - 30 - Math.random() * 120, M.galerie ? 'rocherHD' : 'halo').setScale(M.galerie ? 1 + Math.random() : 1 + Math.random() * 1.2).setTint(M.galerie ? 0x8a7a6a : 0xffffff).setAlpha(M.galerie ? 1 : 0.95).setDepth(6.6));
        vague.push(b);
        this.tweens.add({ targets: b, x: -200 - Math.random() * 200, y: SOL_RECIT - 20 - Math.random() * 60, angle: M.galerie ? -720 : 0, duration: 1400 + Math.random() * 400, delay: k * 30, ease: 'Quad.easeIn' });
      }
      this.cameras.main.shake(1400, 0.012);
      await this.attendre(600);
      this.cameras.main.flash(300, 255, 255, 255);
      if (M.corde && reussie) {
        // il tient bon, accroché à sa corde
        await this.animer({ targets: p, x: p.x - 8, duration: 100, yoyo: true, repeat: 6 });
        await this.attendre(500);
        await this.debout(400);
        M.corde.setVisible(false);
        this.emotion(p, 'joie', 900);
        return;
      }
      // emporté par la coulée
      if (M.corde) { M.corde.setVisible(false); this.onomatopee(M.rocher.x, M.rocher.y - 70, 'CRAC !', '#ff8080'); }
      await this.sauter(p, p.x - 180, SOL_RECIT, 60, 800, -540);
      p.setAngle(0);
      const tas = this.garder(this.add.ellipse(p.x, SOL_RECIT, 100, 60, M.galerie ? 0x6a5a4a : 0xffffff).setDepth(3.3));
      await this.attendre(800);
      this.onomatopee(p.x, p.y - 160, 'Pouah !', '#e0f0ff');
      this.tweens.add({ targets: tas, scaleY: 0.3, alpha: 0, duration: 600 });
      await this.animer({ targets: p, angle: 8, duration: 100, yoyo: true, repeat: 3 });
    },
  },
});
