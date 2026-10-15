// (v0.59) Les épreuves des récits, jouées comme de petites scènes (au niveau du ravin) : chaque
// sorte d'épreuve a son décor, son « avant » (la bête qui hurle, la nuit qui tombe...), la façon
// dont l'objet du baluchon sert, et son issue, réussie ou ratée. Le texte de l'épreuve choisit
// la variante (une morsure d'araignée n'est pas une morsure de vampire).
//
// Une scène d'épreuve : { decor(X, ep), avant(ep), utiliser(id, reussie, niveau), issue(reussie) }
// (toutes appelées avec `this` = le StoryScene). Tout ce qu'elles créent passe par `garder`, et
// disparaît à l'épreuve suivante.

const SOL_RECIT = 360;

Object.assign(StoryScene.prototype, {

  // --- Les outils de mise en scène ---

  garder(o) { (this.menace.objets = this.menace.objets || []).push(o); return o; },
  chaqueImage(fn) { this.events.on('update', fn); this.garder({ destroy: () => this.events.off('update', fn) }); },

  // On efface tout ce que la scène précédente a créé, et le voyageur redevient lui-même.
  nettoyerScenario() {
    const m = this.menace;
    // (audit v0.61) leurs tweens en boucle meurent avec eux (Phaser 3.80 ne les tue pas tout seul)
    if (m && m.objets) for (const o of m.objets.splice(0)) { if (o && o.scene) this.tweens.killTweensOf(o); if (o && o.destroy) o.destroy(); }
    this.ombreNuit = null;
    this.premierPlan.setVisible(true); this.planMoyen.setVisible(true);
    if (this.cameras.main.rotation) this.cameras.main.setRotation(0);
    this.remettrePerso();
  },
  remettrePerso() {
    const p = this.perso; if (!p || !p.active) return;
    this.tweens.killTweensOf(p);
    if (p.marche) { p.marche.remove(); p.marche = null; }
    p.setTexture(this.cleCorps()).setAngle(0).setAlpha(1).clearTint().setScale(6 * this.fCorps).setFlipX(false).setY(SOL_RECIT).setDepth(3).setVisible(true);
  },
  // La texture du voyageur (avec ses bandages, une fois soigné)
  cleCorps(pose = null) {
    const v = this.parti.voyageur;
    return corpsHD(this, this.blesse ? { ...v, blesse: true } : v, pose);
  },
  // Où est sa main (celle de devant)
  main(p = this.perso) {
    const k = p.texture.key.replace(/_pas[12]$/, '');
    const h = (MAINS_CORPS[k] || 26) * p.scaleY;
    return { x: p.x + (p.flipX ? -1 : 1) * p.displayWidth * 0.16, y: p.y - h };
  },
  tete(p = this.perso) { return { x: p.x + (p.flipX ? -1 : 1) * p.displayWidth * 0.05, y: p.y - p.displayHeight * 0.86 }; },
  // Il tient un objet : l'image suit sa main
  tenir(cle, { echelle = 2.6, angle = 0, dx = 0, dy = 0, qui = this.perso, devant = true } = {}) {
    const o = this.garder(this.add.image(0, 0, cle).setScale(echelle).setAngle(angle).setDepth(qui.depth + (devant ? 0.05 : -0.05)));
    o.dx = dx; o.dy = dy;
    if (qui === this.perso) (this.menace.tenus = this.menace.tenus || []).push(o);
    const suivre = () => {
      if (!o.active || !qui.active || o.libre) return;
      const m = this.main(qui), s = qui.flipX ? -1 : 1;
      o.setPosition(m.x + o.dx * s, m.y + o.dy).setFlipX(qui.flipX).setDepth(qui.depth + (devant ? 0.05 : -0.05));
    };
    suivre(); this.chaqueImage(suivre);
    return o;
  },
  // Il lève les bras (ou les baisse)
  bras(leves, p = this.perso) {
    if (p !== this.perso) return;
    p.setTexture(this.cleCorps(leves ? 'leves' : null));
  },
  marcherA(x, vitesse = 5, sprite = this.perso) { return this.marcher(sprite, x, vitesse); },
  // Un saut en cloche jusqu'à (x, y)
  sauter(o, x, y, haut = 60, duree = 500, tourne = 0) {
    const x0 = o.x, y0 = o.y, a0 = o.angle, u = { t: 0 };
    return this.animer({ targets: u, t: 1, duration: duree, ease: 'Linear', onUpdate: () => {
      if (!o.active) return;
      o.setPosition(x0 + (x - x0) * u.t, y0 + (y - y0) * u.t - Math.sin(u.t * Math.PI) * haut);
      if (tourne) o.setAngle(a0 + tourne * u.t);
    } });
  },
  // Une bête qui alterne ses images (pattes qui marchent, ailes qui battent)
  animerBete(b, cles, delai = 140) {
    if (b.anim) b.anim.remove();
    let i = 0;
    b.anim = this.time.addEvent({ delay: delai, loop: true, callback: () => { if (!b.active) { b.anim.remove(); return; } i = (i + 1) % cles.length; b.setTexture(cles[i]); } });
    this.garder({ destroy: () => b.anim && b.anim.remove() });
  },
  arreterBete(b, cle) { if (b.anim) { b.anim.remove(); b.anim = null; } if (cle && b.active) b.setTexture(cle); },
  // Une bulle de paroles au-dessus de quelqu'un
  parole(qui, texte, duree = 1800) {
    const x = Phaser.Math.Clamp(qui.x, 90, 870), y = qui.y - qui.displayHeight - 26;
    const t = this.add.text(x, y, texte, style(14, '#3b2410', { fontStyle: 'bold', align: 'center', wordWrap: { width: 200 } })).setOrigin(0.5).setDepth(9.1);
    const l = t.width + 22, h = t.height + 12;
    const g = this.add.graphics().setDepth(9);
    g.fillStyle(0x3b2410).fillRoundedRect(x - l / 2 - 2, y - h / 2 - 2, l + 4, h + 4, 10).fillTriangle(qui.x - 8, y + h / 2, qui.x + 8, y + h / 2, qui.x, y + h / 2 + 12);
    g.fillStyle(0xfff8e8).fillRoundedRect(x - l / 2, y - h / 2, l, h, 9).fillTriangle(qui.x - 6, y + h / 2 - 1, qui.x + 6, y + h / 2 - 1, qui.x, y + h / 2 + 8);
    const c = this.garder(this.add.container(0, 0, [g, t]).setDepth(9).setScale(1));
    this.tweens.add({ targets: c, alpha: 0, delay: duree, duration: 300, onComplete: () => c.destroy() });
    return c;
  },
  // Trois griffures rouges en travers de lui
  griffures(x, y) {
    const g = this.garder(this.add.graphics().setDepth(8));
    g.lineStyle(5, 0xc01818, 0.9);
    for (let k = 0; k < 3; k++) g.lineBetween(x - 22 + k * 12, y - 22, x - 6 + k * 12, y + 20);
    g.lineStyle(2, 0xffd0d0, 0.8);
    for (let k = 0; k < 3; k++) g.lineBetween(x - 21 + k * 12, y - 21, x - 7 + k * 12, y + 16);
    this.tweens.add({ targets: g, alpha: 0, delay: 600, duration: 500 });
  },
  // Des étoiles qui tournent autour de la tête (sonné)
  sonne(p = this.perso, duree = 1600) {
    const c = this.garder(this.add.container(0, 0).setDepth(9));
    const etoiles = [0, 1, 2].map(() => this.add.text(0, 0, '★', style(16, '#ffe060', { fontStyle: 'bold', stroke: '#3b2410', strokeThickness: 3 })).setOrigin(0.5));
    c.add(etoiles);
    const u = { a: 0 };
    this.tweens.add({ targets: u, a: Math.PI * 6, duration: duree, onUpdate: () => { const h = this.tete(p); etoiles.forEach((e, i) => { const a = u.a + i * 2.1; e.setPosition(h.x + Math.cos(a) * 26, h.y - 14 + Math.sin(a) * 7).setScale(Math.sin(a) > 0 ? 1.1 : 0.8); }); }, onComplete: () => c.destroy() });
  },
  // Des gouttes (sueur, eau) qui volent de sa tête
  gouttes(teinte = 0x8ac8f0, n = 4) {
    const h = this.tete();
    for (let k = 0; k < n; k++) {
      const g = this.garder(this.add.ellipse(h.x + (k % 2 ? 10 : -10), h.y, 4, 6, teinte).setDepth(8));
      this.tweens.add({ targets: g, x: g.x + (k % 2 ? 22 : -22), y: g.y + 30, alpha: 0, duration: 600, delay: k * 120, ease: 'Quad.easeIn', onComplete: () => g.destroy() });
    }
  },
  poussiere(x, y, n = 8, teinte = 0xc8b090) {
    for (let k = 0; k < n; k++) {
      const d = this.garder(this.add.circle(x + (k - n / 2) * 5, y, 4, teinte, 0.7).setDepth(3.2));
      this.tweens.add({ targets: d, y: y - 8 - Math.random() * 10, x: d.x + (k - n / 2) * 4, alpha: 0, scale: 2, duration: 500, onComplete: () => d.destroy() });
    }
  },
  // Il tombe à genoux (puis se relève avec `debout`)
  aGenoux() { return this.animer({ targets: this.perso, scaleY: 6 * this.fCorps * 0.84, angle: this.perso.flipX ? -6 : 6, duration: 260, ease: 'Quad.easeIn' }); },
  debout(duree = 400) { return this.animer({ targets: this.perso, scaleY: 6 * this.fCorps, scaleX: 6 * this.fCorps, angle: 0, y: SOL_RECIT, duration: duree, ease: 'Sine.easeOut' }); },
  // Renversé sur le dos (la tête du côté opposé à `depuis`)
  // Il lâche ce qu'il tenait (l'objet tombe et s'efface)
  lacherTout() {
    for (const o of this.menace.tenus || []) if (o.active && o.visible && o.alpha > 0.05) { o.libre = true; this.tweens.add({ targets: o, y: SOL_RECIT - 6, angle: o.angle + 90, alpha: 0, duration: 400, ease: 'Quad.easeIn' }); }
    this.menace.tenus = [];
  },
  renverse(depuisDroite = true) { this.lacherTout(); return this.animer({ targets: this.perso, angle: depuisDroite ? -82 : 82, y: SOL_RECIT - this.perso.displayWidth * 0.22, duration: 260, ease: 'Quad.easeIn' }); },

  // La bête s'effondre, assommée (et reste au sol, des étoiles autour de la tête)
  async assommer(b, cle) {
    this.arreterBete(b, cle);
    this.tweens.killTweensOf(b);
    b.setAngle(0);
    this.onomatopee(b.x, b.y - 100, 'BOUM !', '#fff4dc');
    await this.animer({ targets: b, scaleY: b.scaleY * 0.55, angle: -6, duration: 260, ease: 'Bounce.easeOut' });
    b.setTint(0xa0a0b0);
    this.poussiere(b.x, SOL_RECIT, 10);
    this.sonne({ x: b.x - b.displayWidth * 0.35, y: b.y - 16, flipX: false, displayWidth: 0, displayHeight: 0, active: true }, 1800);
    await this.attendre(700);
  },

  // L'obscurité : un voile noir percé par les lumières (feu, torche). `lumieres` : des
  // { x, y, r } ou des { suivre: () => ({x, y}), r }.
  obscurite(alpha = 0.9, teinte = 0x05040c) {
    creerHalo(this);
    const rt = this.garder(this.add.renderTexture(0, 0, 960, 390).setOrigin(0).setDepth(6.6));
    const gomme = this.garder(this.make.image({ key: 'lumiereHD', add: false }));
    const ob = { rt, lumieres: [], alpha, teinte };
    ob.ajouter = l => { ob.lumieres.push(l); return l; };
    ob.retirer = l => { ob.lumieres = ob.lumieres.filter(x => x !== l); };
    const maj = () => {
      if (!rt.active) return;
      rt.clear();
      if (ob.alpha <= 0.01) return;
      rt.fill(ob.teinte, ob.alpha);
      const t = this.time.now;
      for (const l of ob.lumieres) {
        if (l.r < 2) continue;
        const pos = l.suivre ? l.suivre() : l;
        const s = l.r / 64 * (l.vacille ? 1 + Math.sin(t / 70 + l.r) * 0.04 + Math.sin(t / 23) * 0.02 : 1);
        gomme.setPosition(pos.x, pos.y).setScale(s);
        rt.erase(gomme);
      }
    };
    // une faible lueur autour du voyageur (qu'on le voie toujours un peu dans le noir)
    ob.ajouter({ suivre: () => ({ x: this.perso.x, y: this.perso.y - this.perso.displayHeight * 0.5 }), r: 70 });
    maj(); this.chaqueImage(maj);
    this.ombreNuit = ob;
    return ob;
  },
  // Une lueur chaude qui suit (le halo coloré par-dessus le noir)
  lueur(pos, r, teinte = 0xffa040, alpha = 0.35) {
    const h = this.garder(this.add.image(0, 0, 'halo').setTint(teinte).setAlpha(alpha).setBlendMode(Phaser.BlendModes.ADD).setDepth(6.7));
    const maj = () => { if (!h.active) return; const p = pos.suivre ? pos.suivre() : pos; h.setPosition(p.x, p.y).setScale((pos.r ?? r) / 60 * (1 + Math.sin(this.time.now / 80) * 0.04)); };
    maj(); this.chaqueImage(maj);
    return h;
  },
  // Le ciel qui change (couleur et force du voile du fond)
  ciel(teinte, alpha, duree = 800) {
    this.tweens.killTweensOf(this.voile);
    this.voile.setFillStyle(teinte, this.voile.fillAlpha);
    return this.animer({ targets: this.voile, fillAlpha: alpha, duration: duree });
  },
  // Le feu de camp (bûches, flamme, braises) ; renvoie { feu, flamme, lumiere }
  feuDeCamp(x, { lumiere = 150 } = {}) {
    const feu = this.garder(this.add.image(x, SOL_RECIT + 2, 'feuCampHD').setOrigin(0.5, 1).setScale(2.5).setDepth(2.6));
    const flamme = this.garder(this.add.sprite(x, SOL_RECIT - 10, 'flammeBougie0').setOrigin(0.5, 1).setScale(5).setDepth(2.7).setTint(0xff9a30).play('flammeBougie'));
    // trois langues de flamme (orange, puis jaune au cœur), qui dansent chacune à son rythme
    for (const [dx, e, teinte, d] of [[-8, 0.7, 0xff6a20, 0], [8, 0.65, 0xff7a20, 180], [0, 0.5, 0xffe070, 90]]) {
      const f = this.garder(this.add.sprite(x + dx, SOL_RECIT - 10, 'flammeBougie0').setOrigin(0.5, 1).setDepth(2.71).setTint(teinte).play({ key: 'flammeBougie', startFrame: (d / 90) | 0 }));
      const maj = () => { if (f.active && flamme.active) f.setScale(flamme.scale * e * (1 + Math.sin(this.time.now / (90 + d) + d) * 0.12)); };
      maj(); this.chaqueImage(maj);
    }
    const l = { x, y: SOL_RECIT - 30, r: lumiere, vacille: true };
    if (this.ombreNuit) this.ombreNuit.ajouter(l);
    const halo = this.lueur(l, lumiere);
    const braises = this.time.addEvent({ delay: 260, loop: true, callback: () => {
      if (flamme.scale < 2) return;
      const e = this.garder(this.add.image(x + Phaser.Math.Between(-8, 8), SOL_RECIT - 30, 'lueurHD').setScale(0.6).setTint(0xffa040).setBlendMode(Phaser.BlendModes.ADD).setDepth(6.8));
      this.tweens.add({ targets: e, y: e.y - 60 - Math.random() * 40, x: e.x + Phaser.Math.Between(-16, 16), alpha: 0, duration: 1300, onComplete: () => e.destroy() });
    } });
    this.garder({ destroy: () => braises.remove() });
    return { feu, flamme, lumiere: l, halo };
  },
  // Des étoiles qui scintillent dans le ciel de nuit, et la lune
  cielDeNuit(teinteLune = 0xf3ecc8) {
    const lune = this.garder(this.add.circle(820, 66, 22, teinteLune).setDepth(6.75));
    const halo = this.garder(this.add.image(820, 66, 'halo').setScale(1.4).setTint(teinteLune).setAlpha(0.45).setBlendMode(Phaser.BlendModes.ADD).setDepth(6.75));
    for (let k = 0; k < 26; k++) {
      const e = this.garder(this.add.rectangle(hachage(k, 3, 77) * 960, 12 + hachage(k, 5, 78) * 150, 2, 2, 0xfff8e0).setDepth(6.75).setAlpha(0.3));
      this.tweens.add({ targets: e, alpha: 0.9, duration: 500 + (k % 5) * 300, yoyo: true, repeat: -1, delay: k * 90 });
    }
    return { lune, halo };
  },
  // Des yeux qui brillent dans le noir
  yeux(x, y, teinte = '#ffd040') {
    const o = this.garder(this.add.text(x, y, '• •', style(15, teinte, { fontStyle: 'bold', brut: true })).setOrigin(0.5).setDepth(6.9).setAlpha(0));
    return o;
  },
  // Une flèche tirée de (x0, y0) vers (x1, y1), en cloche ; elle se plante (ou disparaît)
  async tirerFleche(x0, y0, x1, y1, { haut = 30, plante = true, duree = 340 } = {}) {
    const f = this.garder(this.add.image(x0, y0, 'flecheHD').setScale(2).setDepth(6));
    const u = { t: 0 };
    Son.jouer('vol', { force: 0.6 });
    await this.animer({ targets: u, t: 1, duration: duree, ease: 'Linear', onUpdate: () => {
      const x = x0 + (x1 - x0) * u.t, y = y0 + (y1 - y0) * u.t - Math.sin(u.t * Math.PI) * haut;
      const vx = x1 - x0, vy = (y1 - y0) - Math.cos(u.t * Math.PI) * Math.PI * haut;
      f.setPosition(x, y).setRotation(Math.atan2(vy, vx));
    } });
    if (!plante) f.destroy();
    return f;
  },
  // Un brigand (ou un pillard) en pied
  brigand(x, figurant, flip = true) {
    const b = this.garder(imageCorps(this, x, SOL_RECIT, figurant, 6).setFlipX(flip).setDepth(2.8));
    b.figurant = figurant;
    return b;
  },

  // --- Les scènes elles-mêmes ---

  scenarioEpreuve(type, X, epreuve) {
    const sc = SCENES_EPREUVES[type];
    if (!sc) return false;
    creerRecitEpreuvesHD(this);
    this.menace.scenario = sc;
    this.menace.texte = (epreuve && epreuve.intro) || '';
    this.menace.besoin = epreuve && epreuve.besoin;
    this.perso.setDepth(3);
    this.tweens.killTweensOf(this.voile);
    this.voile.setFillStyle(0x05051a, this.voile.fillAlpha);
    this.tweens.add({ targets: this.voile, fillAlpha: 0, duration: 600 });
    sc.decor.call(this, X, epreuve || {});
    return true;
  },
});

// L'issue dit-elle que la bête est tombée (et non qu'elle a fui) ?
function abattu(scene) { return scene.menace.niveau === 'complet' && /tomb|effondr|abatt|tranch/.test(scene.menace.texteIssue || ''); }

// Le texte de l'épreuve contient-il un de ces mots ?
function texteDit(scene, re) { return re.test(scene.menace.texte || ''); }

const SCENES_EPREUVES = {

  // ======================= LA ROUTE =======================
  // Les jours passent (le soleil traverse le ciel), la fatigue, la faim ou la soif ; la pause
  // (le feu et le pain, ou la gourde) ; il repart d'un bon pas, ou il titube.
  route: {
    decor(X) {
      const M = this.menace;
      M.soif = M.besoin === 'gourde';
      const g = this.garder(this.add.graphics().setDepth(1));
      // le chemin de terre, ses ornières et ses cailloux
      const sec = texteDit(this, /brûl|sèche|soleil|four/);
      const boue = texteDit(this, /marais|boue/);
      const neige = texteDit(this, /neige/) || ['montagne', 'glace', 'neige'].includes(this.biome);
      const terre = neige ? 0xe8eef4 : sec ? 0xc8a070 : 0xa88a5a;
      g.fillStyle(terre, 0.85).fillRect(0, SOL_RECIT - 8, 960, 14);
      g.fillStyle(0x000000, 0.12).fillRect(0, SOL_RECIT - 4, 960, 2).fillRect(0, SOL_RECIT + 2, 960, 2);
      for (let k = 0; k < 40; k++) g.fillStyle(0x6a5a44, 0.7).fillRect(hachage(k, 1, 81) * 960, SOL_RECIT - 7 + hachage(k, 2, 81) * 12, 3, 2);
      if (sec) for (let k = 0; k < 14; k++) { const cx = hachage(k, 4, 82) * 960; g.lineStyle(1, 0x7a5a3a, 0.8).lineBetween(cx, SOL_RECIT - 6, cx + 8, SOL_RECIT - 2).lineBetween(cx + 8, SOL_RECIT - 2, cx + 4, SOL_RECIT + 4); }
      if (boue) for (let k = 0; k < 4; k++) {
        const fx = 120 + k * 230;
        g.fillStyle(0x4a5a3a, 0.9).fillEllipse(fx, SOL_RECIT + 2, 70, 10);
        g.fillStyle(0x7a8a5a, 0.5).fillEllipse(fx - 10, SOL_RECIT, 30, 3);
        for (let r = 0; r < 4; r++) g.lineStyle(2, 0x5a7a3a).lineBetween(fx + 30 + r * 4, SOL_RECIT, fx + 28 + r * 5, SOL_RECIT - 18 - r * 3);
      }
      // (v0.60) un détail de la contrée au bord du chemin : pommier, cairn, cactus, roseaux... ou le panneau
      const b = this.biome;
      if (['neige', 'mines', 'badlands'].includes(b)) {
        for (let k = 0; k < 4; k++) this.garder(this.add.image(X + 40, SOL_RECIT + 4 - k * 14, 'rocherHD').setOrigin(0.5, 1).setScale(1.3 - k * 0.22).setDepth(2 + k * 0.01));   // un cairn
      } else if (['desert', 'oasis'].includes(b)) this.garder(this.add.image(X + 40, SOL_RECIT + 4, 'cactusHD').setOrigin(0.5, 1).setScale(2.2).setDepth(2));
      else if (['comte', 'vergers', 'vallon', 'monastere'].includes(b) && Math.random() < 0.5) {
        this.garder(this.add.image(X + 40, SOL_RECIT + 4, 'arbreRecitHD').setOrigin(0.5, 1).setScale(1.8).setDepth(2));
        const pommes = this.garder(this.add.graphics().setDepth(2.01));
        for (let k = 0; k < 7; k++) pommes.fillStyle(0xc0301a).fillCircle(X + 40 - 50 + hachage(k, 3, 9) * 100, SOL_RECIT - 130 - hachage(k, 4, 9) * 60, 3.5);
      } else this.garder(this.add.image(X + 40, SOL_RECIT + 4, 'panneauRouteHD').setOrigin(0.5, 1).setScale(2.4).setDepth(2));
      M.borne = this.garder(this.add.image(X + 190, SOL_RECIT + 3, 'borneHD').setOrigin(0.5, 1).setScale(2.4).setDepth(2));
      // le soleil, qui va traverser le ciel
      M.soleil = this.garder(this.add.image(M.soif ? 760 : 90, M.soif ? 80 : 250, 'halo').setScale(1.6).setTint(0xfff0a0).setAlpha(0.85).setBlendMode(Phaser.BlendModes.ADD).setDepth(-0.3));
      M.disque = this.garder(this.add.circle(M.soleil.x, M.soleil.y, 20, 0xfff4c0).setDepth(-0.31));
      if (M.soif) {
        // l'air qui tremble de chaleur
        for (let k = 0; k < 6; k++) {
          const l = this.garder(this.add.rectangle(480, 250 + k * 16, 960, 2, 0xfff0d0, 0.18).setDepth(6.6));
          this.tweens.add({ targets: l, x: 500, alpha: 0.05, duration: 500 + k * 90, yoyo: true, repeat: -1 });
        }
      }
    },
    async avant() {
      const M = this.menace, p = this.perso;
      if (M.soif) {
        // il marche lentement sous le soleil, s'arrête, s'essuie le front
        this.tweens.add({ targets: M.soleil, scale: 2.2, duration: 1600, yoyo: true });
        await this.marcherA(p.x + 70, 9);
        this.gouttes(0x8ac8f0, 4);
        this.emotion(p, 'larme', 1200);
        this.onomatopee(p.x, p.y - 170, 'Pfff...', '#f0e0b0');
        await this.animer({ targets: p, angle: 5, duration: 300, yoyo: true });
        return;
      }
      // le soleil traverse le ciel : le jour passe, puis le soir tombe
      const u = { t: 0 };
      this.ciel(0xff9a40, 0.18, 1400);
      const marche = this.marcherA(p.x + 90, 12);
      await this.animer({ targets: u, t: 1, duration: 2200, ease: 'Sine.easeInOut', onUpdate: () => {
        const x = 90 + u.t * 780, y = 250 - Math.sin(u.t * Math.PI) * 190;
        M.soleil.setPosition(x, y).setTint(Phaser.Display.Color.GetColor(255, 240 - u.t * 90, 160 - u.t * 120));
        M.disque.setPosition(x, y);
      } });
      await marche;
      this.ciel(0x1a1440, 0.45, 900);
      this.tweens.add({ targets: [M.soleil, M.disque], y: 330, alpha: 0, duration: 900 });
      this.onomatopee(p.x + 80, p.y - 120, 'Grrrouu...', '#f0d0a0');
      this.emotion(p, '…', 1200);
      await this.animer({ targets: p, angle: 4, duration: 260, yoyo: true, repeat: 1 });
    },
    async utiliser(id, reussie) {
      const p = this.perso;
      if (id === 'gourde') {
        // il décroche sa gourde, la porte à sa bouche, et boit à grandes gorgées
        const o = this.tenir(iconeObjet(this, 'gourde'), { echelle: 2.4, angle: -20 });
        await this.animer({ targets: o, dy: -p.displayHeight * 0.5, dx: 4, angle: -110, duration: 400, ease: 'Quad.easeOut' });
        await this.animer({ targets: p, angle: -6, duration: 200 });
        this.onomatopee(p.x + 20, p.y - 180, 'Glou glou !', '#a8d8ff');
        for (let k = 0; k < (reussie ? 3 : 1); k++) { await this.animer({ targets: o, angle: -125, duration: 160, yoyo: true }); }
        this.gouttes(0x8ac8f0, 3);
        await this.animer({ targets: p, angle: 0, duration: 200 });
        this.tweens.add({ targets: o, alpha: 0, duration: 300 });
        if (reussie) this.emotion(p, 'joie', 1200);
        return;
      }
      // la pause du soir : le feu, le pain, les étoiles
      await this.utiliserObjet('ration');
    },
    async issue(reussie) {
      const M = this.menace, p = this.perso;
      if (reussie) {
        if (!M.soif) {
          // la nuit passe ; l'aube, rose, puis le soleil
          await this.ciel(0xff9ab0, 0.25, 900);
          this.ciel(0xffffff, 0, 900);
          this.onomatopee(p.x + 60, 150, 'Cui cui !', '#ffe0f0');
        }
        await this.geste(p, 'bras', this.corpsVoyageurPose());
        await this.marcherA(p.x + 50, 4);
        return;
      }
      if (M.soif) {
        // un mirage : une oasis qui tremble au loin... il y court, elle s'évanouit
        const mx = Math.min(880, p.x + 220);
        const g = this.garder(this.add.graphics().setDepth(1.5).setAlpha(0));
        g.fillStyle(0x6ab0e0, 0.8).fillEllipse(mx, SOL_RECIT - 14, 120, 14);
        const palme = this.garder(this.add.image(mx + 30, SOL_RECIT - 14, 'palmierHD').setOrigin(0.5, 1).setScale(1.6).setAlpha(0).setDepth(1.5));
        this.tweens.add({ targets: [g, palme], alpha: 0.55, duration: 600 });
        this.tweens.add({ targets: [g, palme], x: '+=4', duration: 120, yoyo: true, repeat: 12 });
        this.emotion(p, '!', 900);
        await this.marcherA(p.x + 90, 4);
        this.tweens.add({ targets: [g, palme], alpha: 0, duration: 500 });
        this.emotion(p, '?', 900);
        await this.attendre(500);
      } else {
        // le ventre vide : il titube, tombe à genoux
        this.onomatopee(p.x, p.y - 160, 'Grrrouu...', '#f0d0a0');
        this.ciel(0xff9ab0, 0.2, 900);
      }
      await this.animer({ targets: p, angle: 8, duration: 220, yoyo: true, repeat: 1 });
      await this.aGenoux();
      this.cameras.main.shake(200, 0.004);
      await this.attendre(600);
      await this.debout(700);
      this.ciel(0xffffff, 0, 900);
    },
  },

  // ======================= LA NUIT =======================
  nuit: {
    decor(X) {
      const M = this.menace, p = this.perso;
      M.brume = texteDit(this, /brume|brouillard/);
      M.remparts = texteDit(this, /siège|Citadelle|rempart/);
      M.morte = texteDit(this, /morte/);
      M.pommiers = texteDit(this, /pommiers/);
      M.yeuxMenace = M.besoin === 'torche' && !M.brume;
      this.ciel(0x05051a, 0.55, 600);
      if (M.remparts) {
        // les remparts de la Citadelle, derrière lui
        const r = this.garder(this.add.graphics().setDepth(1));
        r.fillStyle(0x4a4650).fillRect(0, 250, 960, 110);
        for (let x = 0; x < 960; x += 40) r.fillRect(x, 230, 24, 22);
        for (let y = 262; y < 360; y += 16) for (let x = (y / 16) % 2 ? 0 : 20; x < 960; x += 40) r.fillStyle(0x3a3640).fillRect(x, y, 38, 2);
        for (const x of [180, 560, 820]) { r.fillStyle(0x2a2630).fillRect(x, 290, 14, 30); r.fillStyle(0xffb040, 0.6).fillRect(x + 3, 294, 8, 22); }
      } else {
        // des arbres sombres (morts, ou des pommiers), la tente, les buissons
        for (const [i, [ax, e]] of [[X - 230, 2.2], [X + 300, 2.5], [X + 70, 1.9], [X - 70, 1.7]].entries()) {
          const arbre = this.garder(this.add.image(ax, SOL_RECIT + 4, M.morte ? 'arbreMortHD' : 'arbreRecitHD').setOrigin(0.5, 1).setScale(e).setFlipX(i % 2 === 1).setDepth(1 + i * 0.01));
          if (M.pommiers) { const a = this.garder(this.add.graphics().setDepth(1.05)); for (let k = 0; k < 8; k++) a.fillStyle(0xb02a1a).fillCircle(ax - 50 * e / 2 + hachage(k, ax, 5) * 50 * e, SOL_RECIT - arbre.displayHeight * (0.62 + hachage(ax, k, 6) * 0.25), 3.5); }
        }
        this.garder(this.add.image(p.x - 80, SOL_RECIT + 2, 'tenteHD').setOrigin(0.5, 1).setScale(2.4).setDepth(2.5));
      }
      M.buissons = [X + 130, X + 240].map(bx => this.garder(this.add.image(Math.min(900, bx), SOL_RECIT + 4, 'buissonHD').setOrigin(0.5, 1).setScale(2.4).setDepth(2.9)));
      this.obscurite(0.62);
      this.cielDeNuit(texteDit(this, /lune rouge/) ? 0xe04030 : 0xf3ecc8);
      M.camp = this.feuDeCamp(p.x + 46, { lumiere: 170 });
      if (M.brume) {
        // la brume, épaisse, qui roule
        for (let k = 0; k < 7; k++) {
          const b = this.garder(this.add.image(k * 160, 300 + (k % 3) * 20, 'halo').setScale(4, 1.3).setTint(0xb8c0d0).setAlpha(0.32).setDepth(6.7));
          this.tweens.add({ targets: b, x: b.x + 80, alpha: 0.18, duration: 2600 + k * 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        }
      }
    },
    async avant() {
      const M = this.menace, p = this.perso;
      if (!M.yeuxMenace) {
        // la nuit est longue : le feu baisse, il frissonne
        this.tweens.add({ targets: M.camp.lumiere, r: 110, duration: 1600 });
        this.tweens.add({ targets: M.camp.flamme, scale: 3.4, duration: 1600 });
        if (M.remparts) this.onomatopee(p.x, p.y - 160, 'Grrrouu...', '#f0d0a0');
        this.emotion(p, M.brume ? '?' : '…', 1300);
        await this.geste(p, 'tremble');
        return;
      }
      // le feu baisse... des yeux s'allument dans les buissons, un par un, de plus en plus près
      this.tweens.add({ targets: M.camp.lumiere, r: 80, duration: 2200 });
      this.tweens.add({ targets: M.camp.flamme, scale: 2.4, duration: 2200 });
      M.lesYeux = [];
      const places = [[M.buissons[1].x, 316], [M.buissons[0].x + 30, 322], [M.buissons[0].x - 20, 312]];
      for (const [i, [ex, ey]] of places.entries()) {
        await this.attendre(500);
        const o = this.yeux(ex, ey);
        M.lesYeux.push(o);
        this.tweens.add({ targets: o, alpha: 1, duration: 300 });
        if (i === 0) { this.onomatopee(ex, ey - 50, 'Crrr...', '#c8d0b0'); this.emotion(p, '!', 1000); }
        p.setFlipX(i % 2 === 1);
      }
      p.setFlipX(false);
      this.tweens.add({ targets: M.lesYeux, alpha: 0.4, duration: 200, yoyo: true, repeat: 2, delay: 300 });
    },
    async utiliser(id, reussie) {
      const M = this.menace, p = this.perso;
      if (id !== 'torche') { await this.utiliserObjet(id); return; }
      // il plonge une torche dans les braises... et la brandit
      await this.marcherA(M.camp.feu.x - 26, 4);
      p.setFlipX(false);
      const o = this.tenir(iconeObjet(this, 'torche'), { echelle: 2.6, angle: 20 });
      await this.animer({ targets: o, dy: 14, duration: 200, yoyo: true });
      this.bras(true);
      o.dy = -10; o.setAngle(0);
      const bout = { suivre: () => ({ x: o.x, y: o.y - 20 }), r: 0, vacille: true };
      this.ombreNuit.ajouter(bout);
      const lueur = this.lueur(bout, 0, 0xffb040, 0.45);
      M.torche = { o, bout, lueur };
      this.onomatopee(o.x, o.y - 80, 'FWOUF !', '#ffc060');
      Son.jouer('feu');
      await this.animer({ targets: bout, r: reussie ? 260 : 160, duration: 500, ease: 'Back.easeOut' });
      if (!M.lesYeux) return;
      // les loups, pris dans la lumière
      M.loups = M.lesYeux.slice(0, 2).map((y, i) => this.garder(this.add.image(y.x + 10, SOL_RECIT, 'loupHD').setOrigin(0.5, 1).setScale(2.1).setTint(0x8a8a9a).setDepth(2.95 + i * 0.01)));
      M.lesYeux.forEach(y => y.setAlpha(0));
      this.onomatopee(M.loups[0].x, SOL_RECIT - 120, 'Grrr...', '#c8d0b0');
    },
    async issue(reussie) {
      const M = this.menace, p = this.perso;
      if (reussie) {
        if (M.loups) {
          // aveuglés, ils glapissent et filent dans le noir
          Son.jouer('loup');
          this.onomatopee(M.loups[0].x, SOL_RECIT - 130, 'Kaï ! Kaï !', '#b8f0a0');
          for (const l of M.loups) { l.setFlipX(true); this.animerBete(l, ['loupHD_pas', 'loupHD'], 90); this.tweens.add({ targets: l, x: 1100, duration: 900, ease: 'Quad.easeIn' }); }
          await this.attendre(800);
        }
        // la nuit passe ; l'aube
        this.bras(false);
        if (M.torche) this.tweens.add({ targets: M.torche.o, alpha: 0, duration: 600 });
        await this.animer({ targets: this.ombreNuit, alpha: 0, duration: 1500 });
        this.ciel(0xff9ab0, 0.2, 800);
        this.onomatopee(p.x + 80, 150, 'Cui cui !', '#ffe0f0');
        await this.ciel(0xffffff, 0, 900);
        return;
      }
      // la torche crachote et s'éteint...
      if (M.torche) {
        this.onomatopee(M.torche.o.x, M.torche.o.y - 60, 'Pfff...', '#b0b0b0');
        for (let k = 0; k < 5; k++) { const f = this.garder(this.add.image(M.torche.o.x, M.torche.o.y - 20, 'halo').setScale(0.3).setTint(0x606060).setAlpha(0.6).setDepth(6.9)); this.tweens.add({ targets: f, y: f.y - 60, scale: 0.8, alpha: 0, duration: 900, delay: k * 120 }); }
        await this.animer({ targets: M.torche.bout, r: 0, duration: 600 });
        this.tweens.add({ targets: M.torche.o, alpha: 0, duration: 300 });
        this.bras(false);
      }
      this.tweens.add({ targets: M.camp.lumiere, r: 40, duration: 600 });
      // ... et une ombre jaillit du noir
      const l = M.loups ? M.loups[0] : this.garder(this.add.image(M.buissons[0].x, SOL_RECIT, 'loupHD').setOrigin(0.5, 1).setScale(2.1).setTint(0x50505a).setDepth(2.95));
      if (M.lesYeux) M.lesYeux.forEach(y => y.setAlpha(0));
      l.setTexture('loupHD_bond');
      this.lignesDeVitesse(l.x - 40, l.y - 60, -1);
      await this.sauter(l, p.x + 30, SOL_RECIT, 50, 300);
      this.griffures(p.x, p.y - 70);
      this.cameras.main.shake(250, 0.012);
      this.onomatopee(p.x, p.y - 170, 'AÏE !', '#ff8080');
      await this.renverse(true);
      l.setTexture('loupHD').setFlipX(true);
      for (const b of (M.loups || [l])) { b.setFlipX(true); this.animerBete(b, ['loupHD_pas', 'loupHD'], 110); this.tweens.add({ targets: b, x: 1100, duration: 1000, delay: 300 }); }
      await this.attendre(700);
      // il se relève à l'aube, griffé
      await this.animer({ targets: this.ombreNuit, alpha: 0.2, duration: 1200 });
      await this.debout(500);
      this.ciel(0xffffff, 0, 800);
    },
  },

  // ======================= LA GROTTE =======================
  // Il entre dans la bouche noire : le noir complet. La torche s'allume et révèle la galerie
  // (étais de mine, briques de crypte ou roche rouge), les chauves-souris s'envolent.
  grotte: {
    decor(X) {
      const M = this.menace;
      M.bouche = this.garder(this.add.image(Math.min(X + 150, 860), SOL_RECIT + 4, 'grotteHD').setOrigin(0.5, 1).setScale(2.4).setDepth(1));
      M.mine = texteDit(this, /mine|galerie/) && !texteDit(this, /rouges/);
      M.crypte = texteDit(this, /crypte|souterrain/);
      M.rouge = texteDit(this, /rouges/);
    },
    async avant() {
      const M = this.menace, p = this.perso;
      // il s'approche de la bouche noire, hésite, et entre
      await this.marcherA(M.bouche.x - 30, 5);
      this.emotion(p, '…', 900);
      await this.attendre(500);
      await this.marcherA(M.bouche.x, 6);
      this.cameras.main.fadeOut(350, 0, 0, 0);
      await this.attendre(400);
      // l'intérieur : tout l'écran devient la galerie
      const roche = M.rouge ? 0x6a3226 : M.crypte ? 0x4a4650 : 0x4a4038;
      const fond = this.garder(this.add.graphics().setDepth(0.9));
      fond.fillStyle(Phaser.Display.Color.ValueToColor(roche).darken(30).color).fillRect(-50, -50, 1060, 480);
      for (let k = 0; k < 60; k++) fond.fillStyle(roche, 0.5 + hachage(k, 1, 90) * 0.4).fillEllipse(hachage(k, 2, 90) * 960, 40 + hachage(k, 3, 90) * 260, 40 + hachage(k, 4, 90) * 80, 20 + hachage(k, 5, 90) * 30);
      if (M.crypte) {
        for (let y = 60; y < 340; y += 18) for (let x = (y / 18) % 2 ? 0 : 22; x < 960; x += 44) { fond.fillStyle(0x5a5660).fillRect(x, y, 42, 16); fond.fillStyle(0x6a6670).fillRect(x, y, 42, 3); }
        for (const x of [220, 520, 760]) { fond.fillStyle(0x2a2630).fillRoundedRect(x, 200, 60, 90, { tl: 30, tr: 30, bl: 0, br: 0 }); }
        for (let k = 0; k < 6; k++) { const bx = 120 + k * 150; fond.fillStyle(0xd8d0b8).fillCircle(bx, SOL_RECIT - 6, 6).fillRect(bx + 8, SOL_RECIT - 4, 16, 3); fond.fillStyle(0x1a1410).fillRect(bx - 3, SOL_RECIT - 8, 2, 2).fillRect(bx + 1, SOL_RECIT - 8, 2, 2); }
      }
      // la voûte : des stalactites, et le sol inégal avec ses stalagmites
      const v = this.garder(this.add.graphics().setDepth(2));
      v.fillStyle(Phaser.Display.Color.ValueToColor(roche).darken(45).color);
      v.fillRect(-50, -50, 1060, 70);
      for (let x = 0; x < 960; x += 26 + (x * 7) % 23) { const h = 20 + (x * 13) % 70; v.fillTriangle(x, 18, x + 18, 18, x + 9, 18 + h); }
      v.fillRect(-50, SOL_RECIT, 1060, 80);
      for (let x = 30; x < 960; x += 90 + (x * 3) % 70) { const h = 14 + (x * 11) % 34; v.fillTriangle(x, SOL_RECIT + 2, x + 22, SOL_RECIT + 2, x + 11, SOL_RECIT - h); }
      v.fillStyle(roche).fillRect(-50, SOL_RECIT, 1060, 4);
      if (M.mine) {
        // les étais de la mine, et les rails
        for (const x of [180, 470, 760]) { v.fillStyle(0x5a4028).fillRect(x, 120, 12, 240).fillRect(x + 120, 120, 12, 240).fillRect(x - 6, 112, 144, 14); v.fillStyle(0x7a5a38).fillRect(x - 6, 112, 144, 3); }
        v.fillStyle(0x6a6a72).fillRect(-50, SOL_RECIT + 6, 1060, 3).fillRect(-50, SOL_RECIT + 16, 1060, 3);
        for (let x = 0; x < 960; x += 30) v.fillStyle(0x4a3828).fillRect(x, SOL_RECIT + 4, 8, 18);
      }
      // une flaque, et des gouttes qui tombent de la voûte
      v.fillStyle(0x203040, 0.9).fillEllipse(640, SOL_RECIT + 2, 90, 8);
      const goutte = this.time.addEvent({ delay: 700, loop: true, callback: () => {
        const gx = 600 + Math.random() * 80;
        const d = this.garder(this.add.ellipse(gx, 40, 3, 5, 0xa8d0f0).setDepth(2.1));
        this.tweens.add({ targets: d, y: SOL_RECIT - 2, duration: 600, ease: 'Quad.easeIn', onComplete: () => { d.destroy(); const r = this.garder(this.add.ellipse(gx, SOL_RECIT + 1, 4, 2).setStrokeStyle(1, 0xa8d0f0).setDepth(2.1)); this.tweens.add({ targets: r, scaleX: 5, scaleY: 3, alpha: 0, duration: 500, onComplete: () => r.destroy() }); } });
      } });
      this.garder({ destroy: () => goutte.remove() });
      // les chauves-souris, pendues la tête en bas
      M.chauves = [];
      for (let k = 0; k < 7; k++) M.chauves.push(this.garder(this.add.image(160 + k * 105 + (k % 2) * 30, 30 + (k % 3) * 10, 'chauveSourisHD1').setFlipY(true).setScale(2).setDepth(2.2)));
      M.dedans = true;
      M.bouche.setVisible(false);
      this.premierPlan.setVisible(false); this.planMoyen.setVisible(false);
      p.setX(150).setFlipX(false);
      this.cadrer(330, 230, 1.1, 0);
      this.obscurite(0.9);
      this.cameras.main.fadeIn(400, 0, 0, 0);
      await this.attendre(500);
      // le noir complet : on n'entend que les gouttes
      this.onomatopee(640, 200, 'Ploc...', '#a8d0f0');
      this.emotion(p, '?', 1300);
      await this.marcherA(200, 8);
    },
    async utiliser(id, reussie) {
      const M = this.menace, p = this.perso;
      if (id !== 'torche') { await this.utiliserObjet(id); return; }
      // il frotte le briquet... la torche s'allume, et la galerie apparaît
      const o = this.tenir(iconeObjet(this, 'torche'), { echelle: 2.6, angle: 10 });
      for (let k = 0; k < 3; k++) { const e = this.garder(this.add.image(o.x + 6, o.y - 22, 'eclat').setScale(1.2).setTint(0xffe080).setDepth(6.9)); this.tweens.add({ targets: e, alpha: 0, scale: 0.3, duration: 200, delay: k * 160, onComplete: () => e.destroy() }); }
      await this.attendre(500);
      this.bras(true); o.dy = -10; o.setAngle(0);
      const bout = { suivre: () => ({ x: o.x, y: o.y - 20 }), r: 0, vacille: true };
      this.ombreNuit.ajouter(bout);
      this.lueur(bout, 0, 0xffb040, 0.4);
      M.torche = { o, bout };
      this.onomatopee(o.x, o.y - 80, 'FWOUF !', '#ffc060');
      Son.jouer('feu');
      await this.animer({ targets: bout, r: reussie ? 280 : 170, duration: 600, ease: 'Back.easeOut' });
      // la lumière réveille les chauves-souris : elles s'envolent en piaillant
      this.onomatopee(480, 90, 'KIII !', '#e0c0ff');
      Son.jouer('siffle');
      M.chauves.forEach((c, i) => {
        c.setFlipY(false).setTexture('chauveSourisHD0').setDepth(6.85).setScale(2.6);
        this.animerBete(c, ['chauveSourisHD0', 'chauveSourisHD1'], 80 + i * 7);
        this.tweens.add({ targets: c, x: i % 2 ? -80 : p.x + Phaser.Math.Between(-40, 60), y: i % 2 ? 120 : p.y - 120, duration: 600 + i * 90, delay: i * 70, ease: 'Sine.easeIn', onComplete: () => this.tweens.add({ targets: c, x: -100, y: 60, duration: 500 }) });
      });
      await this.animer({ targets: p, scaleY: 6 * this.fCorps * 0.86, duration: 150, yoyo: true, hold: 500 });   // il baisse la tête
    },
    async issue(reussie) {
      const M = this.menace, p = this.perso;
      if (reussie) {
        // il avance dans la galerie ; au bout, la lumière du jour
        const jour = this.garder(this.add.image(960, 260, 'halo').setScale(0.5, 1.4).setTint(0xfff8e0).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD).setDepth(6.8));
        const sortie = { x: 960, y: 270, r: 0 };
        this.ombreNuit.ajouter(sortie);
        this.tweens.add({ targets: jour, alpha: 0.8, scaleX: 2.2, duration: 1600 });
        this.tweens.add({ targets: sortie, r: 200, duration: 1600 });
        this.cadrer(700, 230, 1.1, 1800);
        await this.marcherA(840, 6);
        this.emotion(p, 'joie', 900);
      } else {
        if (M.torche) {
          // une chauve-souris frôle la torche : elle s'éteint
          this.onomatopee(M.torche.o.x, M.torche.o.y - 60, 'Pfff...', '#b0b0b0');
          await this.animer({ targets: M.torche.bout, r: 0, duration: 400 });
          M.torche.o.setVisible(false);
          this.bras(false);
        }
        // dans le noir, il avance à tâtons... et BONK, contre une stalactite
        this.emotion(p, '?', 900);
        await this.marcherA(p.x + 80, 10);
        this.onomatopee(p.x + 20, p.y - 170, 'BONK !', '#ff8080');
        Son.jouer('coup');
        this.cameras.main.shake(220, 0.012);
        this.ombreNuit.alpha = 0.85;
        this.sonne(p, 1600);
        await this.animer({ targets: p, angle: -10, duration: 120, yoyo: true, repeat: 2 });
        await this.attendre(900);
        await this.marcherA(p.x + 120, 10);
      }
      // dehors
      this.cameras.main.fadeOut(300, 0, 0, 0);
      await this.attendre(350);
      M.dedans = false;
      const garde = new Set([M.bouche]);
      for (const o of M.objets.splice(0)) { if (garde.has(o)) M.objets.push(o); else if (o.destroy) o.destroy(); }
      this.ombreNuit = null;
      this.bras(false);
      M.bouche.setVisible(true);
      this.premierPlan.setVisible(true); this.planMoyen.setVisible(true);
      p.setPosition(Math.min(M.bouche.x + 70, 900), SOL_RECIT).setAngle(0).setScale(6 * this.fCorps);
      this.cadrer(p.x, 240, 1.12, 0);
      this.cameras.main.fadeIn(400, 0, 0, 0);
      await this.attendre(400);
      if (!reussie) await this.animer({ targets: p, angle: 6, duration: 160, yoyo: true, repeat: 1 });
    },
  },

  // ======================= LE LOUP =======================
  // Il hurle sur son rocher, saute, rôde en grondant ; les flèches ou l'épée ; il fuit, ou il
  // bondit et le renverse.
  loup: {
    decor(X) {
      const M = this.menace;
      const renard = texteDit(this, /renard/), enorme = texteDit(this, /énorme|crocs comme/), jeune = texteDit(this, /jeune/);
      M.meute = texteDit(this, /meute|loups/);
      M.echelle = enorme || renard ? 2.8 : jeune ? 1.9 : 2.3;
      M.teinte = renard ? 0xe08a4a : null;
      M.rx = Math.min(X + 210, 860);
      this.ciel(0xff8a40, texteDit(this, /crépuscule/) ? 0.3 : 0.12, 600);
      M.rocher = this.garder(this.add.image(M.rx, SOL_RECIT + 6, 'rocherHD').setOrigin(0.5, 1).setScale(4.2, 3.4).setDepth(2));
      this.garder(this.add.image(M.rx - 90, SOL_RECIT + 4, 'rocherHD').setOrigin(0.5, 1).setScale(1.4).setDepth(2.1));
      const os = this.garder(this.add.graphics().setDepth(2.1));
      for (const [ox, a] of [[X + 60, 0.3], [X + 90, -0.5], [X + 130, 0.1]]) { os.fillStyle(0xe8e0c8); const c = Math.cos(a) * 9, s = Math.sin(a) * 9; os.lineStyle(3, 0xe8e0c8).lineBetween(ox - c, SOL_RECIT - 2 - s, ox + c, SOL_RECIT - 2 + s); os.fillCircle(ox - c, SOL_RECIT - 2 - s, 2.5).fillCircle(ox + c, SOL_RECIT - 2 + s, 2.5); }
      M.loup = this.garder(this.add.image(M.rx, SOL_RECIT - M.rocher.displayHeight + 8, 'loupHD').setOrigin(0.5, 1).setScale(M.echelle).setDepth(2.9).setAlpha(0));
      if (M.teinte) M.loup.setTint(M.teinte);
      M.sprites = [M.loup];
    },
    async avant() {
      const M = this.menace, p = this.perso, l = M.loup;
      // il apparaît sur le rocher, et hurle
      await this.animer({ targets: l, alpha: 1, duration: 400 });
      l.setTexture('loupHD_hurle');
      Son.jouer('loup');
      this.onomatopee(l.x, l.y - 100, 'AOUUUH !', '#e0e8ff');
      await this.attendre(900);
      l.setTexture('loupHD_bond');
      await this.sauter(l, M.rx - 70, SOL_RECIT, 40, 420);
      l.setTexture('loupHD');
      this.poussiere(l.x, SOL_RECIT);
      this.emotion(p, '!', 900);
      if (M.meute) {
        // la meute arrive derrière lui
        M.autres = [M.rx + 40, M.rx + 100].map((ax, i) => {
          const a = this.garder(this.add.image(1040 + i * 60, SOL_RECIT, 'loupHD').setOrigin(0.5, 1).setScale(M.echelle * 0.85).setDepth(2.85 - i * 0.01).setTint(0xa0a0b0));
          this.animerBete(a, ['loupHD_pas', 'loupHD'], 150);
          this.tweens.add({ targets: a, x: Math.min(ax, 920), duration: 1200, ease: 'Sine.easeOut', onComplete: () => this.arreterBete(a, 'loupHD') });
          return a;
        });
      }
      // il rôde, tapi, en grondant
      this.animerBete(l, ['loupHD_pas', 'loupHD'], 170);
      this.tweens.add({ targets: l, scaleY: M.echelle * 0.9, duration: 300 });
      await this.animer({ targets: l, x: p.x + 170, duration: 1100, ease: 'Sine.easeInOut' });
      this.arreterBete(l, 'loupHD');
      this.onomatopee(l.x, l.y - 90, 'Grrr...', '#c8d0b0');
      await this.animer({ targets: l, x: l.x + 4, duration: 60, yoyo: true, repeat: 3 });
    },
    async utiliser(id, reussie) {
      const M = this.menace, p = this.perso, l = M.loup;
      if (id === 'fleches') {
        // il bande son arc, vise... deux flèches
        const arc = this.tenir('arcHD', { echelle: 2.4, dy: -16 });
        this.cadrer(p.x + 80, 250, 1.35, 400);
        await this.animer({ targets: arc, scaleX: 2.1, duration: 400 });
        arc.setScale(2.4);
        const m = this.main();
        const f1 = await this.tirerFleche(m.x + 10, m.y - 16, l.x - 40, SOL_RECIT - 2, { haut: 16 });
        f1.setRotation(0.5);
        this.onomatopee(l.x - 40, SOL_RECIT - 70, 'TOC !', '#fff4dc');
        await this.animer({ targets: l, x: l.x + 14, duration: 140, ease: 'Quad.easeOut' });   // il recule d'un bond
        await this.animer({ targets: arc, scaleX: 2.1, duration: 300 });
        arc.setScale(2.4);
        if (reussie) {
          const f2 = await this.tirerFleche(m.x + 10, m.y - 16, l.x - 10, l.y - l.displayHeight * 0.6, { haut: 10, plante: false });
          void f2;
          l.setTint(0xff6060); this.time.delayedCall(160, () => l.active && (M.teinte ? l.setTint(M.teinte) : l.clearTint()));
          this.onomatopee(l.x, l.y - 110, 'KAÏ !', '#ff8080');
          Son.jouer('loup');
        } else {
          // il esquive d'un bond
          l.setTexture('loupHD_bond');
          const fl = this.tirerFleche(m.x + 10, m.y - 16, l.x + 30, SOL_RECIT - 4, { haut: 10 });
          await this.sauter(l, l.x - 40, SOL_RECIT, 50, 360);
          l.setTexture('loupHD');
          await fl;
        }
        this.tweens.add({ targets: arc, alpha: 0, duration: 300 });
        this.cadrer(p.x + 120, 250, 1.12, 400);
        return;
      }
      if (id === 'epee') {
        // il tire l'épée ; le loup bondit ; le coup part en plein vol
        const lame = this.tenir(iconeObjet(this, 'epee'), { echelle: 2.6, angle: -40, dy: -8 });
        await this.attendre(300);
        l.setTexture('loupHD_bond');
        this.lignesDeVitesse(l.x - 40, l.y - 50, -1);
        const saut = this.sauter(l, p.x + (reussie ? 80 : 40), SOL_RECIT, 70, 380);
        await this.attendre(240);
        this.tweens.add({ targets: lame, angle: 120, duration: 140 });
        const arcG = this.garder(this.add.graphics().setDepth(7));
        arcG.lineStyle(6, 0xffffff, 0.9).beginPath().arc(p.x + 30, p.y - 70, 60, -1.3, 0.8).strokePath();
        this.tweens.add({ targets: arcG, alpha: 0, duration: 300 });
        await saut;
        if (reussie) {
          this.onomatopee(l.x, l.y - 110, 'TCHAK !', '#fff4dc');
          Son.jouer('coup');
          this.coupDeZoom(l.x - 20, l.y - 50, 1.35);
          await this.sauter(l, l.x + 120, SOL_RECIT, 40, 420, 360);
          l.setTexture('loupHD').setAngle(0);
        } else {
          this.onomatopee(p.x + 50, p.y - 160, 'RATÉ !', '#ff8080');
          l.setTexture('loupHD');
        }
        this.tweens.add({ targets: lame, alpha: 0, duration: 300, delay: 300 });
        return;
      }
      await this.utiliserObjet(id);
    },
    async issue(reussie) {
      const M = this.menace, p = this.perso, l = M.loup;
      const loups = [l, ...(M.autres || [])];
      if (reussie && abattu(this)) { await this.assommer(l, 'loupHD'); return; }
      if (reussie) {
        // ils détalent en couinant
        if (!M.meute) this.onomatopee(l.x, l.y - 110, 'Kaï ! Kaï !', '#b8f0a0');
        else this.onomatopee(l.x, l.y - 110, 'OUSTE !', '#b8f0a0');
        for (const b of loups) {
          b.setFlipX(true).setAngle(0);
          this.animerBete(b, ['loupHD_pas', 'loupHD_bond'], 90);
          this.tweens.add({ targets: b, x: 1120, duration: 900, ease: 'Quad.easeIn' });
        }
        await this.attendre(700);
        return;
      }
      // il bondit, le renverse, le mord ; un coup de pied, et il recule
      l.setTexture('loupHD_bond');
      this.lignesDeVitesse(l.x - 30, l.y - 60, -1);
      await this.sauter(l, p.x + 36, SOL_RECIT - 20, 50, 300);
      this.cameras.main.shake(300, 0.014);
      this.onomatopee(p.x, p.y - 170, 'AÏE !', '#ff8080');
      this.griffures(p.x + 6, p.y - 70);
      await this.renverse(true);
      l.setTexture('loupHD');
      await this.animer({ targets: l, x: l.x + 6, duration: 70, yoyo: true, repeat: 4 });
      this.onomatopee(p.x + 60, p.y - 130, 'PAF !', '#fff4dc');
      l.setTexture('loupHD_bond');
      await this.sauter(l, l.x + 90, SOL_RECIT, 30, 300, 40);
      l.setTexture('loupHD').setAngle(0);
      await this.debout(500);
      for (const b of loups) { b.setFlipX(true); this.animerBete(b, ['loupHD_pas', 'loupHD'], 140); this.tweens.add({ targets: b, x: 1120, duration: 1400, delay: 400, ease: 'Sine.easeIn' }); }
      await this.attendre(500);
    },
  },

  // ======================= LE SANGLIER =======================
  sanglier: {
    decor(X) {
      const M = this.menace;
      M.arbreX = Math.min(X + 250, 900);
      const g = this.garder(this.add.graphics().setDepth(1.6));
      // la bauge boueuse, des fougères, un gros chêne
      g.fillStyle(0x5a4028, 0.9).fillEllipse(X + 120, SOL_RECIT + 2, 160, 14);
      g.fillStyle(0x7a5a38, 0.6).fillEllipse(X + 100, SOL_RECIT, 60, 4);
      for (const fx of [X - 40, X + 30, X + 200]) for (let k = 0; k < 5; k++) g.lineStyle(3, 0x3f7a34).lineBetween(fx, SOL_RECIT, fx - 16 + k * 8, SOL_RECIT - 22 - (k % 2) * 8);
      g.fillStyle(0x4a3420).fillRect(M.arbreX - 14, SOL_RECIT - 190, 28, 192);
      g.fillStyle(0x5a4028).fillRect(M.arbreX - 14, SOL_RECIT - 190, 8, 192);
      g.fillStyle(0x2f5a2a).fillCircle(M.arbreX, SOL_RECIT - 210, 60).fillCircle(M.arbreX - 50, SOL_RECIT - 180, 40).fillCircle(M.arbreX + 50, SOL_RECIT - 185, 42);
      g.fillStyle(0x3f7a34).fillCircle(M.arbreX - 14, SOL_RECIT - 226, 40);
      M.bete = this.garder(this.add.image(1040, SOL_RECIT, 'sanglierHD').setOrigin(0.5, 1).setScale(2.4).setDepth(2.9));
    },
    async avant() {
      const M = this.menace, p = this.perso, b = M.bete;
      this.animerBete(b, ['sanglierHD_pas', 'sanglierHD'], 120);
      await this.animer({ targets: b, x: Math.min(p.x + 230, M.arbreX - 60), duration: 1000, ease: 'Sine.easeOut' });
      this.arreterBete(b, 'sanglierHD');
      Son.jouer('sanglier');
      this.onomatopee(b.x, b.y - 100, 'GROINK !', '#f0c0a0');
      // il gratte le sol, la tête basse
      for (let k = 0; k < 3; k++) { this.poussiere(b.x + 30, SOL_RECIT, 5, 0x8a6a40); await this.animer({ targets: b, x: b.x + 6, duration: 120, yoyo: true }); }
      this.emotion(p, '!', 900);
      await this.animer({ targets: b, angle: 6, duration: 200 });
    },
    async utiliser(id, reussie) {
      const M = this.menace, p = this.perso, b = M.bete;
      // la charge part
      this.animerBete(b, ['sanglierHD_pas', 'sanglierHD'], 70);
      this.lignesDeVitesse(b.x - 30, b.y - 40, -1);
      const charge = this.animer({ targets: b, x: p.x + 120, angle: 0, duration: 700, ease: 'Quad.easeIn' });
      if (id === 'fleches') {
        const arc = this.tenir('arcHD', { echelle: 2.4, dy: -16 });
        await this.attendre(250);
        const m = this.main();
        await this.tirerFleche(m.x + 10, m.y - 16, p.x + 140, b.y - 40, { haut: 4, plante: false, duree: 200 });
        this.tweens.add({ targets: arc, alpha: 0, duration: 300 });
      } else if (id === 'epee' || id === 'bouclier') {
        this.tenir(iconeObjet(this, id), { echelle: 2.6, dy: -10 });
      }
      await charge;
      this.arreterBete(b, 'sanglierHD');
      if (reussie) {
        // touché, il fait une embardée... droit dans le chêne
        this.onomatopee(b.x, b.y - 100, 'COUIC !', '#ff8080');
        this.animerBete(b, ['sanglierHD_pas', 'sanglierHD'], 70);
        await this.animer({ targets: b, x: M.arbreX - 40, y: SOL_RECIT - 4, duration: 450, ease: 'Quad.easeIn' });
        this.arreterBete(b, 'sanglierHD');
        this.onomatopee(M.arbreX, SOL_RECIT - 150, 'BONK !', '#fff4dc');
        Son.jouer('coup');
        this.cameras.main.shake(200, 0.01);
        for (let k = 0; k < 4; k++) { const f = this.garder(this.add.ellipse(M.arbreX + Phaser.Math.Between(-50, 50), SOL_RECIT - 220, 8, 5, 0x3f7a34).setDepth(3.5)); this.tweens.add({ targets: f, y: SOL_RECIT, x: f.x + Phaser.Math.Between(-30, 30), angle: 360, duration: 1200, delay: k * 100 }); }
        await this.animer({ targets: b, angle: -12, duration: 160, yoyo: true });
        this.sonne(b, 1400);
        await this.attendre(500);
      }
    },
    async issue(reussie) {
      const M = this.menace, p = this.perso, b = M.bete;
      if (reussie && abattu(this)) { await this.assommer(b, 'sanglierHD'); return; }
      if (reussie) {
        b.setFlipX(true).setAngle(0);
        this.animerBete(b, ['sanglierHD_pas', 'sanglierHD'], 110);
        await this.animer({ targets: b, x: 1100, y: SOL_RECIT, duration: 1200, ease: 'Sine.easeIn' });
        return;
      }
      if (b.x > p.x + 140) {
        this.animerBete(b, ['sanglierHD_pas', 'sanglierHD'], 70);
        await this.animer({ targets: b, x: p.x + 120, duration: 300, ease: 'Quad.easeIn' });
      }
      // il l'encorne et l'envoie en l'air
      this.onomatopee(p.x, p.y - 180, 'OUILLE !', '#ff8080');
      this.cameras.main.shake(260, 0.014);
      this.animer({ targets: b, x: p.x - 160, duration: 600, ease: 'Linear' });
      await this.sauter(p, p.x - 40, SOL_RECIT, 120, 650, -360);
      this.poussiere(p.x, SOL_RECIT, 10);
      await this.renverse(false);
      this.arreterBete(b, 'sanglierHD');
      b.setFlipX(true);
      this.tweens.add({ targets: b, x: -150, duration: 900 });
      await this.attendre(600);
      await this.debout(500);
    },
  },

  // ======================= LES BRIGANDS =======================
  // Ils sortent des buissons (ou se lèvent autour de leur feu, ou sautent du quai) : « La bourse
  // ou la vie ! ». Un duel à l'épée (trois passes d'armes), ou une volée de flèches sur le bouclier.
  bandits: {
    decor(X) { SCENES_EPREUVES.bandits.planter.call(this, X, false); },
    planter(X, pillards) {
      const M = this.menace;
      M.pillards = pillards;
      M.quai = texteDit(this, /quai|barque/);
      M.feu = texteDit(this, /autour du feu/);
      M.oasis = texteDit(this, /oasis/);
      M.convoi = texteDit(this, /chariot|convoi/);
      M.fort = texteDit(this, /fort/i) && !M.convoi;
      const n = pillards ? 3 : 2;
      const base = Math.min(X + 110, 960 - n * 62);
      if (M.quai) {
        const g = this.garder(this.add.graphics().setDepth(1.4));
        // le fleuve, à gauche du quai (on y tombe), et le quai de planches
        M.bordQuai = X - 175;
        const eau = this.garder(this.add.graphics().setDepth(3.5));
        eau.fillStyle(0x1a3a5a, 0.95).fillRect(-50, SOL_RECIT - 6, M.bordQuai + 50, 30);
        for (let x = -40; x < M.bordQuai; x += 24) eau.fillStyle(0x6a9ac0, 0.7).fillRect(x, SOL_RECIT - 6, 12, 2);
        for (let x = M.bordQuai; x < 1000; x += 36) { g.fillStyle(0x6a4a2a).fillRect(x, SOL_RECIT - 4, 34, 10); g.fillStyle(0x8a6a40).fillRect(x, SOL_RECIT - 4, 34, 2); }
        for (const cx of [base - 60, base + 150]) { g.fillStyle(0x7a5a34).fillRect(cx, SOL_RECIT - 36, 32, 32); g.lineStyle(2, 0x4a3420).strokeRect(cx, SOL_RECIT - 36, 32, 32).lineBetween(cx, SOL_RECIT - 36, cx + 32, SOL_RECIT - 4); }
        this.cielDeNuit(); this.ciel(0x05051a, 0.45, 600);
      } else if (M.oasis) {
        const g = this.garder(this.add.graphics().setDepth(1.4));
        g.fillStyle(0x4a90c0, 0.9).fillEllipse(base + 60, SOL_RECIT + 2, 220, 16);
        this.garder(this.add.image(base + 160, SOL_RECIT + 4, 'palmierHD').setOrigin(0.5, 1).setScale(2.4).setDepth(1.5));
        this.garder(this.add.image(base - 50, SOL_RECIT + 4, 'palmierHD').setOrigin(0.5, 1).setScale(2).setFlipX(true).setDepth(1.5));
      } else if (M.convoi) {
        this.garder(dessinerCaravane(this, base + 150, SOL_RECIT).setDepth(1.4));
      } else if (M.fort) {
        const g = this.garder(this.add.graphics().setDepth(1.2));
        for (let x = base - 120; x < 980; x += 22) { g.fillStyle(0x6a4a2a).fillRect(x, SOL_RECIT - 140, 20, 140); g.fillTriangle(x, SOL_RECIT - 140, x + 20, SOL_RECIT - 140, x + 10, SOL_RECIT - 156); g.fillStyle(0x8a6a40).fillRect(x, SOL_RECIT - 140, 5, 140); }
      }
      if (M.feu) M.camp = this.feuDeCamp(base + 40, { lumiere: 120 });
      // les cachettes : un tronc en travers du chemin et des buissons
      M.cachettes = [];
      if (!M.quai && !M.feu && !M.oasis) {
        // (le chef derrière le tronc abattu, les autres dans les buissons)
        M.cachettes.push(this.garder(this.add.image(base + 20, SOL_RECIT + 6, 'troncHD').setOrigin(0.5, 1).setScale(2).setDepth(2.95)));
        for (let i = 1; i < n; i++) M.cachettes.push(this.garder(this.add.image(base + i * 62 + 20, SOL_RECIT + 4, 'buissonHD').setOrigin(0.5, 1).setScale(2.2).setDepth(2.95).setFlipX(i % 2 === 1)));
      }
      const figurants = pillards ? ['pillard', 'pillarde', 'pillard'] : ['brigand', 'brigande'];
      M.brigands = figurants.map((f, i) => {
        const b = this.brigand(base + i * 62, f);
        if (M.cachettes.length) b.setY(SOL_RECIT + 70);
        else if (M.feu) b.setFlipX(i % 2 === 0).setScale(b.scaleX, b.scaleY * 0.86);    // assis autour du feu
        return b;
      });
      M.chef = M.brigands[0];
    },
    async avant() {
      const M = this.menace, p = this.perso;
      if (M.cachettes.length) {
        // ils jaillissent des buissons
        for (const [i, b] of M.brigands.entries()) {
          this.poussiere(b.x, SOL_RECIT - 20, 5, 0x5a8a3a);
          this.sauter(b, b.x - 30, SOL_RECIT, 60, 420).then(() => b.setDepth(3.05));
          await this.attendre(180 + i * 60);
        }
        await this.attendre(400);
      } else {
        // ils se lèvent et se retournent vers lui
        for (const b of M.brigands) { b.setFlipX(true).setScale(b.scaleX, Math.abs(b.scaleX)); this.tweens.add({ targets: b, y: SOL_RECIT - 10, duration: 160, yoyo: true }); }
        await this.attendre(400);
      }
      this.emotion(p, '!', 900);
      // armes à la main
      M.armes = M.brigands.map((b, i) => ((M.pillards || M.besoin === 'bouclier') && i === 1) ? this.tenir('arcHD', { qui: b, echelle: 2.2, dy: -16 }) : this.tenir(iconeObjet(this, 'epee'), { qui: b, echelle: 2.2, angle: -30, dy: -8 }));
      M.armes.forEach(a => a.setTint(0xb0b0b8));
      Son.jouer('voix', { personne: { nom: 'Brigand', race: 'humain' }, ton: 'fache' });
      this.parole(M.chef, M.pillards ? 'Le convoi est à nous !' : 'La bourse ou la vie !');
      this.onomatopee(M.brigands[M.brigands.length - 1].x, SOL_RECIT - 170, 'HA HA !', '#f0c0a0');
      await this.attendre(900);
    },
    async utiliser(id, reussie) {
      const M = this.menace, p = this.perso, chef = M.chef;
      if (id === 'bouclier') {
        // une volée de flèches : il lève son bouclier, elles se plantent dedans
        const bouclier = this.tenir(iconeObjet(this, 'bouclier'), { echelle: 3.2, dy: -50, dx: 12 });
        await this.attendre(200);
        const archer = M.brigands[1] || chef;
        const fleches = [];
        for (let k = 0; k < 4; k++) {
          const m = this.main(archer);
          const passe = !reussie && k === 3;
          fleches.push(this.tirerFleche(m.x - 10, m.y - 14, passe ? p.x + 6 : bouclier.x + 6, passe ? p.y - 30 : bouclier.y - 8 + k * 6, { haut: 30, plante: !passe, duree: 380 }).then(f => {
            if (passe) { this.onomatopee(p.x, p.y - 150, 'AÏE !', '#ff8080'); return; }
            this.onomatopee(bouclier.x + 10, bouclier.y - 50 - k * 10, 'TOC !', '#fff4dc');
            Son.jouer('bouclier', { force: 0.6 });
            // elle reste plantée dans le bouclier
            const dx = f.x - bouclier.x, dy = f.y - bouclier.y;
            this.chaqueImage(() => { if (f.active && bouclier.active) f.setPosition(bouclier.x + dx, bouclier.y + dy).setAlpha(bouclier.alpha); });
          }));
          await this.attendre(220);
        }
        await Promise.all(fleches);
        if (reussie) {
          // la charge, bouclier en avant
          this.lignesDeVitesse(p.x + 40, p.y - 60, 1);
          await this.animer({ targets: p, x: chef.x - 60, duration: 350, ease: 'Quad.easeIn' });
          this.onomatopee(chef.x, chef.y - 170, 'BLONG !', '#d8e4f0');
          Son.jouer('bouclier');
          this.cameras.main.shake(200, 0.01);
          await this.sauter(chef, chef.x + 70, SOL_RECIT, 30, 350, 70);
          M.chefAterre = true;
        }
        return;
      }
      if (id !== 'epee') { await this.utiliserObjet(id); return; }
      // le duel : trois passes d'armes
      const lame = this.tenir(iconeObjet(this, 'epee'), { echelle: 2.6, angle: -30, dy: -8 });
      const milieu = (p.x + chef.x) / 2;
      this.cadrer(milieu, 240, 1.3, 400);
      await Promise.all([this.marcherA(milieu - 34, 3), this.animer({ targets: chef, x: milieu + 34, duration: 400 })]);
      for (let k = 0; k < 3; k++) {
        const qui = k % 2 ? chef : p;
        await this.animer({ targets: qui, x: qui.x + (qui === p ? 10 : -10), duration: 90, yoyo: true });
        this.tweens.add({ targets: lame, angle: k % 2 ? -60 : 60, duration: 90, yoyo: true });
        this.tweens.add({ targets: M.armes[0], angle: k % 2 ? 40 : -80, duration: 90, yoyo: true });
        const ex = milieu, ey = SOL_RECIT - 90 + k * 8;
        for (let e = 0; e < 6; e++) { const s = this.garder(this.add.image(ex, ey, 'eclat').setScale(1.6).setTint(0xfff0a0).setDepth(7)); const a = Math.random() * Math.PI * 2; this.tweens.add({ targets: s, x: ex + Math.cos(a) * 40, y: ey + Math.sin(a) * 30, alpha: 0, duration: 300, onComplete: () => s.destroy() }); }
        this.onomatopee(ex, ey - 60, k === 2 ? 'CLANG !' : 'TCHING !', '#fff4dc');
        Son.jouer('coup', { force: 0.7 });
        await this.attendre(260);
      }
      // la lame qui vole : celle du chef, ou la sienne
      const perdue = reussie ? M.armes[0] : lame;
      perdue.libre = true;   // (lâchée : elle ne suit plus la main)
      await this.sauter(perdue, perdue.x + (reussie ? 120 : -120), SOL_RECIT - 10, 90, 600, reussie ? 540 : -540);
      perdue.setAngle(reussie ? 160 : -160);
      Son.jouer('poser');
      if (reussie) {
        // le chef tombe sur les fesses, les autres lèvent les mains
        await this.animer({ targets: chef, scaleY: chef.scaleY * 0.82, angle: 12, duration: 200 });
        for (const [i, b] of M.brigands.entries()) if (i > 0) { b.setTexture(corpsHD(this, b.figurant, 'leves')); if (M.armes[i]) M.armes[i].setVisible(false); }
        this.parole(chef, 'Pitié ! Pitié !', 1400);
        M.chefAterre = true;
      }
      this.cadrer(p.x + 120, 250, 1.12, 500);
    },
    async issue(reussie) {
      const M = this.menace, p = this.perso;
      const texte = M.texteIssue || '';
      const jete = /à l'eau/.test(texte), vole = /pris|moitié|emporté/.test(texte);
      if (reussie && vole) {
        // repoussés... mais l'un d'eux file avec une partie du butin
        const sac = this.garder(this.add.image(M.chef.x, SOL_RECIT - 40, iconeObjet(this, 'ration')).setScale(2.4).setDepth(3.2));
        this.chaqueImage(() => { if (sac.active && M.chef.active) sac.setPosition(M.chef.x + 14, M.chef.y - M.chef.displayHeight * 0.5); });
        this.onomatopee(M.chef.x, SOL_RECIT - 170, 'HA HA !', '#f0c0a0');
        this.emotion(p, 'colere', 1000);
      }
      if (reussie) {
        // ils prennent leurs jambes à leur cou
        await this.attendre(300);
        for (const [i, b] of M.brigands.entries()) {
          b.setTexture(corpsHD(this, b.figurant)).setAngle(0).setScale(Math.abs(b.scaleX), Math.abs(b.scaleX)).setFlipX(false);
          if (M.armes[i]) M.armes[i].setVisible(false);
          pasDeMarche(this, b, 900);
          this.tweens.add({ targets: b, x: 1120 + i * 40, y: SOL_RECIT, duration: 900, delay: i * 120, ease: 'Quad.easeIn' });
        }
        this.onomatopee(M.chef.x, SOL_RECIT - 170, 'OUSTE !', '#b8f0a0');
        await this.attendre(900);
        return;
      }
      // un coup de pommeau, et ils filent avec sa bourse
      const chef = M.chef;
      await this.animer({ targets: chef, x: p.x + 60, duration: 300, ease: 'Quad.easeIn' });
      this.onomatopee(p.x, p.y - 170, 'BAM !', '#ff8080');
      this.cameras.main.shake(220, 0.012);
      if (jete) {
        // jeté{e} à l'eau, par-dessus le bord du quai
        await this.sauter(p, p.x - 90, SOL_RECIT + 60, 80, 600, -200);
        this.onomatopee(p.x, SOL_RECIT - 60, 'PLOUF !', '#a8d0ff');
        for (let k = 0; k < 12; k++) { const g = this.garder(this.add.circle(p.x + (Math.random() - 0.5) * 30, SOL_RECIT + 6, 2 + Math.random() * 2, 0xe8fcff, 0.9).setDepth(4)); this.sauter(g, g.x + Phaser.Math.Between(-40, 40), SOL_RECIT + 10, 40 + Math.random() * 40, 500).then(() => g.destroy()); }
        for (const [i, b] of M.brigands.entries()) { b.setFlipX(false); pasDeMarche(this, b, 1000); this.tweens.add({ targets: b, x: 1120 + i * 40, duration: 1000, delay: 300 + i * 100 }); }
        await this.attendre(900);
        p.setAngle(0).setTint(0xa8c8ff);
        await this.sauter(p, p.x + 40, SOL_RECIT, 60, 500);
        await this.animer({ targets: p, angle: 10, duration: 100, yoyo: true, repeat: 3 });   // il s'ébroue
        p.clearTint();
        return;
      }
      await this.renverse(true);
      // les pièces s'envolent de la bourse
      creerPiecesHD(this);
      Son.jouer('pieces');
      for (let k = 0; k < 8; k++) {
        const c = this.garder(this.add.image(p.x + 10, p.y - 30, 'pieceFace').setScale(1.6).setDepth(7));
        this.sauter(c, chef.x + Phaser.Math.Between(-20, 40), SOL_RECIT - 60, 60 + k * 6, 500 + k * 40).then(() => c.destroy());
      }
      this.onomatopee(chef.x, chef.y - 180, 'HA HA !', '#f0c0a0');
      await this.attendre(500);
      for (const [i, b] of M.brigands.entries()) {
        b.setFlipX(false);
        pasDeMarche(this, b, 1000);
        this.tweens.add({ targets: b, x: 1120 + i * 40, duration: 1000, delay: i * 100, ease: 'Quad.easeIn' });
      }
      await this.attendre(600);
      await this.debout(500);
    },
  },

  // ======================= LE VENIN (morsures, piqûres) =======================
  morsure: {
    decor(X) {
      const M = this.menace, p = this.perso;
      M.sorte = texteDit(this, /araign/) ? 'araignee' : texteDit(this, /coffre|aiguille/) ? 'coffre'
        : texteDit(this, /loup-garou/) ? 'loupgarou' : texteDit(this, /vampire/) ? 'vampire' : 'serpent';
      if (M.sorte === 'loupgarou') { this.ciel(0x05051a, 0.5, 600); this.cielDeNuit(0xf8f0d0); }
      if (M.sorte === 'coffre') {
        M.coffre = this.garder(this.add.image(p.x + 70, SOL_RECIT + 3, 'coffreRecitHD0').setOrigin(0.5, 1).setScale(2.4).setDepth(2.9));
        const g = this.garder(this.add.graphics().setDepth(1));
        g.fillStyle(0x3a3036).fillRect(-50, 120, 1060, 245);
        for (let y = 130; y < 360; y += 22) for (let x = (y / 22) % 2 ? 0 : 26; x < 960; x += 52) { g.fillStyle(0x4a4046).fillRect(x, y, 50, 20); g.fillStyle(0x5a5056).fillRect(x, y, 50, 3); }
        this.obscurite(0.6);
        this.ombreNuit.ajouter({ x: p.x + 70, y: SOL_RECIT - 40, r: 220 });
      } else if (M.sorte === 'araignee') {
        this.garder(this.add.image(p.x - 40, SOL_RECIT + 4, 'buissonHD').setOrigin(0.5, 1).setScale(2.4).setDepth(2));
        const t = this.garder(this.add.graphics().setDepth(1.5));
        t.lineStyle(1, 0xe8e8e8, 0.4);
        for (let k = 0; k < 8; k++) t.lineBetween(p.x + 60, 40, p.x + 60 + Math.cos(k * 0.8) * 120, 40 + Math.sin(k * 0.8) * 90);
        for (let r = 20; r < 110; r += 18) t.strokeCircle(p.x + 60, 40, r);
      } else if (M.sorte === 'serpent') {
        // les hautes herbes
        const g = this.garder(this.add.graphics().setDepth(3.2));
        for (let x = p.x + 30; x < p.x + 260; x += 7) g.lineStyle(3, 0x4a7a2a).lineBetween(x, SOL_RECIT + 2, x + (x % 3) - 1, SOL_RECIT - 18 - (x * 7) % 16);
        M.serpent = this.garder(this.add.image(p.x + 200, SOL_RECIT + 2, 'serpentHD0').setOrigin(0.5, 1).setScale(2.2).setDepth(3.1).setAlpha(0));
      } else {
        if (M.sorte === 'loupgarou') this.garder(this.add.image(Math.min(p.x + 220, 900), SOL_RECIT + 4, 'buissonHD').setOrigin(0.5, 1).setScale(2.4).setDepth(2.95));
        if (M.sorte === 'vampire') {
          // le bal : des lustres, des rideaux de velours, un parquet ciré
          const g = this.garder(this.add.graphics().setDepth(1));
          g.fillStyle(0x2a1020).fillRect(-50, -50, 1060, 415);
          g.fillStyle(0x3a1828).fillRect(-50, 100, 1060, 265);
          g.fillStyle(0x5a3a22).fillRect(-50, SOL_RECIT - 6, 1060, 20);
          for (let x = -40; x < 1000; x += 48) g.fillStyle(0x6a4a2a).fillRect(x, SOL_RECIT - 6, 46, 3);
          for (let x = 0; x < 960; x += 120) { g.fillStyle(0x6a1a2a).fillRect(x, 100, 50, 265); g.fillStyle(0x8a2a3a).fillRect(x, 100, 10, 265); }
          for (const lx of [260, 680]) { g.fillStyle(0xd8b040).fillRect(lx - 40, 130, 80, 4); for (let k = 0; k < 5; k++) { g.fillStyle(0xfff0c0).fillRect(lx - 36 + k * 18, 120, 4, 10); } }
        }
      }
    },
    async avant() {
      const M = this.menace, p = this.perso;
      if (M.sorte === 'coffre') {
        // il s'agenouille devant le coffre et l'ouvre...
        await this.marcherA(M.coffre.x - 46, 5);
        await this.aGenoux();
        M.coffre.setTexture('coffreRecitHD1');
        const h = this.garder(this.add.image(M.coffre.x, M.coffre.y - 40, 'halo').setScale(1.2).setTint(0xffd060).setAlpha(0.7).setBlendMode(Phaser.BlendModes.ADD).setDepth(6.9));
        this.tweens.add({ targets: h, alpha: 0.4, duration: 300, yoyo: true, repeat: -1 });
        this.emotion(p, '♥', 800);
        await this.attendre(600);
        // ... une aiguille jaillit
        const a = this.garder(this.add.rectangle(M.coffre.x - 10, M.coffre.y - 34, 2, 2, 0xe0e8f0).setDepth(7));
        await this.animer({ targets: a, width: 30, x: M.coffre.x - 34, duration: 80 });
        this.onomatopee(p.x + 20, p.y - 150, 'TSING !', '#e0e8f0');
      } else if (M.sorte === 'araignee') {
        // une araignée descend au bout de son fil... sur son bras
        const fil = this.garder(this.add.rectangle(p.x + 14, 0, 1, 10, 0xeeeeee, 0.8).setOrigin(0.5, 0).setDepth(6));
        const a = this.garder(this.add.image(p.x + 14, 0, 'araignetteHD').setScale(2.2).setDepth(6.1));
        const cible = this.main().y - 10;
        await this.animer({ targets: a, y: cible, duration: 1300, ease: 'Sine.easeOut', onUpdate: () => fil.setSize(1, Math.max(1, a.y - 6)) });
        this.emotion(p, '!', 700);
        await this.attendre(300);
        this.onomatopee(a.x + 20, a.y - 40, 'CHTAK !', '#c0ff80');
        await this.attendre(300);
        this.tweens.add({ targets: a, y: 0, duration: 900, ease: 'Sine.easeIn', onUpdate: () => fil.setSize(1, Math.max(1, a.y - 6)) });
      } else if (M.sorte === 'serpent') {
        const s = M.serpent;
        this.animerBete(s, ['serpentHD0', 'serpentHD1'], 220);
        this.tweens.add({ targets: s, alpha: 1, duration: 300 });
        this.onomatopee(s.x, s.y - 60, 'Ksss...', '#c0ff80');
        await this.animer({ targets: s, x: p.x + 60, duration: 1200, ease: 'Sine.easeInOut' });
        this.emotion(p, '!', 700);
        await this.animer({ targets: s, x: p.x + 30, duration: 90, yoyo: true });
        this.onomatopee(p.x + 20, p.y - 100, 'CHTAK !', '#c0ff80');
        this.tweens.add({ targets: s, x: 1080, alpha: 0, duration: 1400, delay: 400 });
      } else {
        // la créature de la nuit sort du buisson
        const qui = imageCorps(this, 1000, SOL_RECIT, M.sorte, 6).setFlipX(true).setDepth(2.9);
        this.garder(qui);
        M.creature = qui;
        await this.marcherA(p.x + 50, 4, qui);
        qui.setFlipX(true);
        if (M.sorte === 'vampire') this.parole(qui, 'Juste une petite gorgée...', 1400);
        else this.onomatopee(qui.x, qui.y - 180, 'GRAOU !', '#ff8080');
        await this.attendre(700);
        await this.animer({ targets: qui, x: p.x + 26, angle: -10, duration: 200 });
        this.onomatopee(p.x, p.y - 170, M.sorte === 'vampire' ? 'SLURP !' : 'CROC !', '#ff8080');
        this.cameras.main.shake(200, 0.01);
        await this.attendre(400);
        await this.animer({ targets: qui, x: p.x + 70, angle: 0, duration: 200 });
        if (M.sorte === 'vampire') this.emotion(qui, '♥', 900);
        qui.setFlipX(false);
        pasDeMarche(this, qui, 900);
        this.tweens.add({ targets: qui, x: 1100, duration: 900, delay: 300 });
      }
      // le venin : il verdit, la vue se brouille
      M.venin = this.tweens.addCounter({ from: 0, to: 1, duration: 500, yoyo: true, repeat: -1, onUpdate: tw => { if (p.active) p.setTint(Phaser.Display.Color.GetColor(200 - tw.getValue() * 80, 255, 200 - tw.getValue() * 110)); } });
      this.garder({ destroy: () => M.venin.remove() });
      const cam = this.cameras.main;
      M.vertige = this.tweens.addCounter({ from: 0, to: Math.PI * 2, duration: 1600, repeat: -1, onUpdate: tw => cam.setRotation(Math.sin(tw.getValue()) * 0.02) });
      this.garder({ destroy: () => { M.vertige.remove(); cam.setRotation(0); } });
      this.emotion(p, '…', 1200);
      await this.animer({ targets: p, angle: p.angle + 6, duration: 300, yoyo: true });
    },
    async utiliser(id, reussie) {
      const M = this.menace, p = this.perso;
      // il boit la fiole d'un trait
      const o = this.tenir(iconeObjet(this, id), { echelle: 2.4 });
      await this.animer({ targets: o, dy: -p.displayHeight * 0.48, angle: -120, duration: 400, ease: 'Quad.easeOut' });
      this.onomatopee(p.x + 20, p.y - 180, 'Glou !', id === 'antidote' ? '#a0ffb0' : '#ffb0c0');
      await this.attendre(400);
      this.tweens.add({ targets: o, alpha: 0, duration: 300 });
      const teinte = id === 'antidote' ? 0x70ff90 : 0xff7090;
      for (let k = 0; k < 14; k++) {
        const e = this.garder(this.add.image(p.x + Phaser.Math.Between(-26, 26), p.y - Phaser.Math.Between(10, 100), 'lueurHD').setScale(1.5).setTint(teinte).setBlendMode(Phaser.BlendModes.ADD).setDepth(7));
        this.tweens.add({ targets: e, y: e.y - 70, alpha: 0, duration: 900, delay: k * 50, onComplete: () => e.destroy() });
      }
      if (reussie) {
        M.venin.remove(); M.vertige.remove();
        this.cameras.main.setRotation(0);
        if (p.active) p.clearTint();
      }
      await this.attendre(500);
    },
    async issue(reussie) {
      const M = this.menace, p = this.perso;
      if (M.sorte === 'coffre' && p.scaleY < 6 * this.fCorps * 0.95) await this.debout(400);
      if (reussie) {
        if (M.venin) M.venin.remove(); if (M.vertige) M.vertige.remove();
        this.cameras.main.setRotation(0); p.clearTint();
        this.emotion(p, 'joie', 1000);
        return;
      }
      // il s'effondre ; le noir ; il se réveille, pâle
      await this.aGenoux();
      await this.renverse(false);
      await this.ciel(0x000000, 0.75, 600);
      this.onomatopee(p.x, p.y - 100, 'Zzz...', '#c0c0ff');
      await this.attendre(900);
      if (M.venin) M.venin.remove(); if (M.vertige) M.vertige.remove();
      this.cameras.main.setRotation(0);
      p.setTint(0xc8d8b8);
      await this.ciel(0x05051a, ['vampire', 'loupgarou'].includes(M.sorte) ? 0.5 : 0, 600);
      await this.debout(700);
    },
  },

  // ======================= LES BLESSURES =======================
  // Ses blessures à lui (il boite, saigne, serre un bandage... qu'on voit ensuite sur lui), ou
  // les blessés qu'il soigne (le Fort, les malades, la guérisseuse).
  blessure: {
    decor(X) {
      const M = this.menace, p = this.perso;
      M.soigner = texteDit(this, /blessés|malades|guérisseuse/);
      if (M.soigner) {
        // un hôpital de campagne : la tente, des paillasses, des blessés allongés
        this.garder(this.add.image(X + 250, SOL_RECIT + 2, 'tenteHD').setOrigin(0.5, 1).setScale(3.2).setDepth(1.5));
        const n = texteDit(this, /guérisseuse/) ? 1 : 3;
        M.blesses = [];
        for (let i = 0; i < n; i++) {
          const bx = p.x + 120 + i * 90;
          this.garder(this.add.image(bx, SOL_RECIT + 4, 'paillasseHD').setOrigin(0.5, 1).setScale(2).setDepth(2));
          const nom = ['Aldric', 'Mira', 'Oswin'][i];
          const quoi = n === 1 ? { nom: 'Guérisseuse', race: 'elfe', feminin: true, niveau: 'aguerri', blesse: true } : { nom, race: ['humain', 'nain', 'hobbit'][i], feminin: i === 1, niveau: 'novice', blesse: true };
          const b = this.garder(imageCorps(this, bx + 55, SOL_RECIT, quoi, 6).setAngle(-88).setDepth(2.2));
          b.setY(SOL_RECIT - b.displayWidth * 0.22);
          b.quoi = quoi;
          M.blesses.push(b);
          this.tweens.add({ targets: b, scaleY: b.scaleY * 1.02, duration: 900 + i * 100, yoyo: true, repeat: -1 });
        }
        return;
      }
      M.rocher = this.garder(this.add.image(X + 80, SOL_RECIT + 4, 'rocherHD').setOrigin(0.5, 1).setScale(1.8).setDepth(2));
    },
    async avant() {
      const M = this.menace, p = this.perso;
      if (M.soigner) {
        this.onomatopee(M.blesses[0].x + 30, SOL_RECIT - 80, 'Aïe... aïe...', '#f0d0c0');
        this.emotion(p, '!', 900);
        await this.attendre(600);
        return;
      }
      // il boite jusqu'au rocher, en laissant des gouttes de sang
      const cible = M.rocher.x - 50;
      const pas = Math.max(1, Math.round((cible - p.x) / 30));
      for (let k = 0; k < pas; k++) {
        await this.animer({ targets: p, x: p.x + 30, angle: k % 2 ? 6 : -2, duration: 260, ease: 'Sine.easeInOut' });
        const g = this.garder(this.add.circle(p.x - 4, SOL_RECIT - 1, 2.5, 0xa01818).setDepth(2.5));
        void g;
      }
      p.setAngle(0);
      this.emotion(p, 'larme', 1000);
      await this.aGenoux();
      for (let k = 0; k < 5; k++) { const g = this.garder(this.add.circle(p.x + Phaser.Math.Between(-10, 10), p.y - 60, 3, 0xb01818).setDepth(6)); this.tweens.add({ targets: g, y: SOL_RECIT - 2, duration: 450, delay: k * 110, ease: 'Quad.easeIn' }); }
      await this.attendre(500);
    },
    async utiliser(id, reussie) {
      const M = this.menace, p = this.perso;
      if (M.soigner) {
        // il passe d'un blessé à l'autre
        const soignes = reussie ? M.blesses.length : Math.max(0, M.blesses.length - 1);
        for (let i = 0; i < M.blesses.length; i++) {
          const b = M.blesses[i];
          await this.marcherA(b.x - 40, 4);
          await this.aGenoux();
          const o = this.tenir(iconeObjet(this, id), { echelle: 2.2 });
          await this.animer({ targets: o, dx: 30, dy: 20, duration: 300 });
          o.destroy();
          if (i < soignes) {
            for (let k = 0; k < 6; k++) { const e = this.garder(this.add.image(b.x + Phaser.Math.Between(-20, 30), SOL_RECIT - 14, 'lueurHD').setScale(1.4).setTint(id === 'potion' ? 0xff7090 : 0xffffff).setBlendMode(Phaser.BlendModes.ADD).setDepth(7)); this.tweens.add({ targets: e, y: e.y - 50, alpha: 0, duration: 700, delay: k * 60 }); }
            this.tweens.killTweensOf(b);
            await this.debout(250);
            await this.animer({ targets: b, angle: 0, x: b.x - 20, y: SOL_RECIT, duration: 400, ease: 'Back.easeOut' });
            b.setFlipX(true);
            this.emotion(b, '♥', 900);
            Son.jouer('voix', { personne: b.quoi, ton: 'merci' });
          } else {
            await this.debout(250);
            this.emotion(b, '…', 900);
          }
          await this.attendre(300);
        }
        return;
      }
      if (id === 'potion') {
        await SCENES_EPREUVES.morsure.utiliser.call(this, id, true);
        if (reussie) this.emotion(p, 'joie', 900);
        return;
      }
      // il serre le bandage : on le verra ensuite sur lui
      const o = this.tenir(iconeObjet(this, 'bandage'), { echelle: 2.2, dy: -20 });
      for (let k = 0; k < 3; k++) await this.animer({ targets: o, dx: 20, dy: -40, angle: 180, duration: 180, yoyo: true });
      o.destroy();
      this.onomatopee(p.x, p.y - 150, reussie ? 'Serré !' : 'Hmm...', '#fff4dc');
      if (reussie) {
        this.blesse = true;
        p.setTexture(this.cleCorps());
        this.emotion(p, 'joie', 900);
      }
      await this.attendre(400);
    },
    async issue(reussie) {
      const M = this.menace, p = this.perso;
      if (M.soigner) {
        if (!reussie) { this.emotion(p, 'larme', 1200); await this.attendre(800); }
        return;
      }
      await this.debout(400);
      if (reussie) { await this.marcherA(p.x + 60, 5); return; }
      // ça saigne encore : il pâlit, vacille
      p.setTint(0xe8d0c8);
      for (let k = 0; k < 6; k++) { const g = this.garder(this.add.circle(p.x + Phaser.Math.Between(-10, 10), p.y - 60, 3, 0xb01818).setDepth(6)); this.tweens.add({ targets: g, y: SOL_RECIT - 2, duration: 450, delay: k * 90, ease: 'Quad.easeIn' }); }
      await this.animer({ targets: p, angle: -8, duration: 260, yoyo: true, repeat: 1 });
    },
  },
};

// Les pillards : la même scène que les brigands, avec un archer et le bouclier
SCENES_EPREUVES.pillards = { ...SCENES_EPREUVES.bandits, decor(X) { SCENES_EPREUVES.bandits.planter.call(this, X, true); } };

// La pose « bras levés » du voyageur (pour `geste`)
StoryScene.prototype.corpsVoyageurPose = function () { return this.blesse ? { ...this.parti.voyageur, blesse: true } : this.parti.voyageur; };
