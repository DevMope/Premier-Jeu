// Base commune des cinématiques (récits, introduction, faillite) :
// une boîte de texte, « clique pour continuer », et des animations qu'on attend avec `await`.
class Cinematique extends Phaser.Scene {
  creerBoiteTexte() {
    this.boite = this.add.image(480, 455, panneauHD(this, 940, 150, 'ardoise')).setScale(2).setDepth(10).setScrollFactor(0);
    this.entete = this.add.text(30, 392, '', style(16, '#f3d98a', { fontStyle: 'bold' })).setDepth(10);
    this.texte = this.add.text(30, 418, '', style(18, '#f3e6c8', { wordWrap: { width: 900 }, lineSpacing: 6 })).setDepth(10);
    this.indice = this.add.text(930, 506, '▶ clique pour continuer', style(13, '#c9b48a', { fontStyle: 'italic' }))
      .setOrigin(1, 0.5).setVisible(false).setDepth(10);
    for (const o of [this.entete, this.texte, this.indice]) o.setScrollFactor(0);
    this.tweens.add({ targets: this.indice, alpha: 0.4, duration: 600, yoyo: true, repeat: -1 });
  }

  // La boîte de texte en haut de l'écran, quand c'est en bas que se passe ce qu'il faut voir
  // (la découverte du shop, par exemple), ou de nouveau en bas.
  boiteEnHaut(enHaut = true) {
    const dy = enHaut ? -370 : 0;
    this.boite.setY(455 + dy);
    this.entete.setY(392 + dy);
    this.texte.setY(418 + dy);
    this.indice.setY(518 + dy);
  }

  // (v0.68) le texte s'écrit lettre après lettre (un clic l'affiche d'un coup) ; en accéléré, tout de suite
  ecrire(entete, texte, depuis = 0) {
    this.entete.setText(entete);
    this.texteComplet = texte;
    this.defile = texteQuiDefile(this, this.texte, texte, { depuis, son: !this.rapide });
    if (this.rapide) this.defile.finir();
  }
  // Ajouter une phrase à la suite de ce qui est déjà écrit (elle s'écrit à son tour)
  ajouterTexte(suite) {
    if (this.defile) this.defile.finir();
    const avant = this.texte.text;
    this.texteComplet = (this.texteComplet || '') + suite;
    this.defile = texteQuiDefile(this, this.texte, this.texteComplet, { depuis: avant.length });
    if (this.rapide) this.defile.finir();
  }
  enEcriture() { return !!(this.defile && this.defile.enCours()); }

  // À la fin d'une cinématique : on attend que le joueur clique pour passer à la suite
  // (rien ne s'enchaîne tout seul).
  attendreSuite(texte = '▶ Clique pour continuer') {
    const t = this.add.text(940, 520, texte, style(15, '#fff4dc', { fontStyle: 'bold italic', stroke: '#2a1a10', strokeThickness: 4 }))
      .setOrigin(1, 0.5).setDepth(30).setScrollFactor(0);
    this.tweens.add({ targets: t, alpha: 0.4, duration: 700, yoyo: true, repeat: -1 });
    return new Promise(resoudre => this.time.delayedCall(300, () => {
      const suite = () => { if (this.enEcriture()) { this.defile.finir(); this.input.once('pointerdown', suite); return; } t.destroy(); resoudre(); };
      this.input.once('pointerdown', suite);
    }));
  }

  attendreClic() {
    // En accéléré (« Passer »), on n'attend pas les clics : l'histoire défile toute seule.
    if (this.rapide) return this.attendre(150);
    return new Promise(resoudre => {
      this.time.delayedCall(200, () => {
        if (this.rapide) return resoudre();   // (v0.97) « Passer » cliqué juste avant
        this.indice.setVisible(true);
        const suite = (pointeur) => {
          // (v0.68) un clic pendant que le texte s'écrit l'affiche en entier ; le suivant fait avancer
          if (pointeur && this.enEcriture()) { this.defile.finir(); this.input.once('pointerdown', suite); return; }
          this.events.off('passer', suite); this.input.off('pointerdown', suite); this.indice.setVisible(false); if (this.defile) this.defile.finir(); resoudre();
        };
        this.input.once('pointerdown', suite);
        this.events.once('passer', suite);
      });
    });
  }

  attendre(ms) {
    return new Promise(resoudre => this.time.delayedCall(ms, resoudre));
  }

  animer(config) {
    return new Promise(resoudre => this.tweens.add({ ...config, onComplete: resoudre }));
  }

  // Un personnage marche jusqu'à x en sautillant, façon figurine.
  async marcher(sprite, x, vitesse = 5) {
    const duree = Math.max(300, Math.abs(x - sprite.x) * vitesse);
    if (x !== sprite.x) sprite.setFlipX(x < sprite.x);
    const y = sprite.y;
    // Les personnages HD marchent vraiment (jambes, bras, poussière) ; les autres sautillent.
    const hd = this.textures.exists(sprite.texture.key.replace(/_pas[12]$/, '') + '_pas1');
    if (hd) pasDeMarche(this, sprite, duree);
    this.tweens.add({ targets: sprite, y: y - (hd ? 2 : 6), duration: hd ? 125 : 130, yoyo: true, repeat: Math.floor(duree / (hd ? 250 : 260)) });
    await this.animer({ targets: sprite, x, duration: duree, ease: 'Linear' });
    sprite.y = y;
  }

  // --- (v0.58) Des personnages vivants : ils se regardent, parlent avec leur voix, montrent ce
  // qu'ils ressentent, font des gestes, et rêvent tout haut dans des bulles de pensée. ---

  // `a` se tourne vers `b` (les corps regardent vers la droite ; un point {x} suffit aussi).
  regarderVers(a, b) {
    if (a && b && Math.abs(b.x - a.x) > 2) a.setFlipX(b.x < a.x);
    return a;
  }

  // Une ombre douce au sol, sous les pieds : elle reste au sol quand le personnage saute, et
  // rapetisse avec la hauteur. `sprite.sol` : la hauteur du sol (sa position au départ).
  ombreSol(sprite, largeur = 0.62) {
    if (sprite.ombre) return sprite.ombre;
    sprite.sol = sprite.y;
    const o = this.add.ellipse(sprite.x, sprite.y, 40, 9, 0x000000, 0.3).setDepth(sprite.depth - 0.01);
    const maj = () => {
      if (!sprite.active || !o.active) { this.events.off('update', maj); if (o.active) o.destroy(); return; }
      const debout = Math.abs(sprite.angle) < 25 && sprite.originY > 0.9;
      const haut = Math.max(0, sprite.sol - sprite.y);
      o.setVisible(sprite.visible && debout && sprite.alpha > 0.3).setPosition(sprite.x, sprite.sol - 1).setDepth(sprite.depth - 0.01);
      o.setScale(sprite.displayWidth * largeur / 40 * Math.max(0.5, 1 - haut / 120));
    };
    this.events.on('update', maj);
    sprite.ombre = o;
    return o;
  }

  // Une émotion au-dessus de la tête : '!', '?', '♥', 'colere', 'larme', 'joie', '…', 'idee'
  emotion(sprite, quoi, duree = 1500) {
    const glyphes = { '!': ['!', '#c0301a'], '?': ['?', '#2a4a8a'], '♥': ['♥', '#d03050'], joie: ['♪', '#2a8a3a'], '…': ['…', '#3b2410'] };
    // (v0.68) la colère, la larme, l'idée, l'étincelle : de petits dessins en pixel art (plus d'émojis)
    const dessin = { colere: 'colere', larme: 'larme', idee: 'idee', merci: 'merci' }[quoi];
    const [g, couleur] = glyphes[quoi] || [quoi, '#3b2410'];
    const x = sprite.x + (sprite.flipX ? -1 : 1) * sprite.displayWidth * 0.22, y = sprite.y - sprite.displayHeight - 8;
    const c = this.add.container(x, y).setDepth(9).setScale(0);
    c.add(this.add.circle(0, 0, 15, 0xfff8e8).setStrokeStyle(2.5, 0x3b2410));
    c.add(this.add.triangle(0, 0, -5, 12, 5, 12, 0, 20, 0xfff8e8).setOrigin(0));
    if (dessin) { creerGlyphesHD(this); c.add(this.add.image(0, 0, 'glyphe_' + dessin).setScale(2)); }
    else c.add(this.add.text(0, 0, g, style(19, couleur, { fontStyle: 'bold' })).setOrigin(0.5));
    this.tweens.add({ targets: c, scale: 1, duration: 220, ease: 'Back.easeOut' });
    this.tweens.add({ targets: c, y: y - 5, duration: 400, yoyo: true, repeat: 1, ease: 'Sine.easeInOut', delay: 220 });
    this.tweens.add({ targets: c, alpha: 0, delay: duree, duration: 300, onComplete: () => c.destroy() });
    return c;
  }

  // Un geste : 'hoche' (oui de la tête), 'saut' (de joie), 'penche' (vers l'autre), 'tremble',
  // 'recule', 'bras' (les bras levés : il faut `quoi`, ce que corpsHD sait dessiner), 'salut'.
  async geste(sprite, quel, quoi = null) {
    const y = sprite.sol ?? sprite.y, x = sprite.x;
    if (quel === 'hoche') return this.animer({ targets: sprite, y: y + 3, duration: 120, yoyo: true, repeat: 1 });
    if (quel === 'saut') return this.animer({ targets: sprite, y: y - 26, duration: 180, yoyo: true, repeat: 1, ease: 'Quad.easeOut' });
    if (quel === 'penche') { await this.animer({ targets: sprite, angle: sprite.flipX ? -6 : 6, duration: 200 }); await this.attendre(300); return this.animer({ targets: sprite, angle: 0, duration: 250 }); }
    if (quel === 'tremble') return this.animer({ targets: sprite, x: x + 3, duration: 50, yoyo: true, repeat: 5 });
    if (quel === 'recule') { await this.animer({ targets: sprite, x: x + (sprite.flipX ? 16 : -16), duration: 160, ease: 'Quad.easeOut' }); return; }
    if (quel === 'bras' && quoi) {
      const avant = sprite.texture.key;
      sprite.setTexture(corpsHD(this, quoi, 'leves'));
      await this.animer({ targets: sprite, y: y - 8, duration: 160, yoyo: true, ease: 'Quad.easeOut' });
      await this.attendre(500);
      sprite.setTexture(avant);
      return;
    }
    if (quel === 'salut') {
      creerGlyphesHD(this);
      const main = this.add.image(sprite.x + (sprite.flipX ? -1 : 1) * sprite.displayWidth * 0.35, sprite.y - sprite.displayHeight * 0.75, 'glyphe_main').setScale(2.4).setOrigin(0.5, 1).setDepth(9);
      await this.animer({ targets: main, angle: { from: -25, to: 25 }, duration: 140, yoyo: true, repeat: 2 });
      main.destroy();
    }
  }

  // Une réplique : le texte, la voix du personnage (avec son intonation), son émotion et son
  // geste, et il se tourne vers celui à qui il parle. Puis on attend le clic.
  // o : { sprite, vers, personne, ton, emotion, geste, quoi, entete }
  async replique(entete, texte, o = {}) {
    this.ecrire(entete, texte);
    if (o.sprite && o.vers) this.regarderVers(o.sprite, o.vers);
    if (o.vers && o.sprite && o.vers.setFlipX && o.ecoute !== false) this.regarderVers(o.vers, o.sprite);
    if (!this.rapide && o.personne) Son.jouer('voix', { personne: o.personne, ton: o.ton || 'neutre', duree: Math.min(2, 0.4 + texte.length * 0.012) });
    if (o.sprite && o.emotion) this.emotion(o.sprite, o.emotion);
    if (o.sprite && o.geste) this.geste(o.sprite, o.geste, o.quoi);
    if (o.attendre !== false) await this.attendreClic();
  }

  // Une bulle de pensée au-dessus d'un personnage : trois petites bulles qui montent, puis un
  // nuage avec une image dedans (le trésor promis, le shop rêvé...). Renvoie la bulle (on la
  // ferme avec fermerPensee).
  pensee(sprite, image, { echelle = 2, teinte = null } = {}) {
    const cote = sprite.flipX ? -1 : 1;
    const x0 = sprite.x + cote * sprite.displayWidth * 0.25, y0 = sprite.y - sprite.displayHeight - 6;
    const bx = x0 + cote * 70, by = y0 - 80;
    const c = this.add.container(0, 0).setDepth(9);
    [[x0 + cote * 6, y0 - 4, 4], [x0 + cote * 20, y0 - 18, 6], [x0 + cote * 38, y0 - 36, 8]].forEach(([x, y, r], i) => {
      const b = this.add.circle(x, y, r, 0xfff8e8).setStrokeStyle(2, 0x3b2410).setScale(0);
      c.add(b);
      this.tweens.add({ targets: b, scale: 1, duration: 180, delay: i * 140, ease: 'Back.easeOut' });
    });
    const nuage = this.add.container(bx, by).setScale(0);
    const g = this.add.graphics();
    g.fillStyle(0x3b2410);
    for (const [dx, dy, r] of [[-38, 4, 26], [0, -10, 32], [38, 2, 26], [-16, 18, 24], [18, 18, 24]]) g.fillCircle(dx, dy, r + 2.5);
    g.fillStyle(0xfff8e8);
    for (const [dx, dy, r] of [[-38, 4, 26], [0, -10, 32], [38, 2, 26], [-16, 18, 24], [18, 18, 24]]) g.fillCircle(dx, dy, r);
    nuage.add(g);
    const img = this.add.image(0, 4, image).setScale(echelle);
    if (teinte) img.setTint(teinte);
    nuage.add(img);
    c.add(nuage);
    this.tweens.add({ targets: nuage, scale: 1, duration: 300, delay: 420, ease: 'Back.easeOut' });
    this.tweens.add({ targets: img, y: 0, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 720 });
    return c;
  }
  fermerPensee(c) {
    if (!c || !c.active) return;
    this.tweens.add({ targets: c, alpha: 0, duration: 300, onComplete: () => c.destroy() });
  }

  // Un mot qui surgit, façon bande dessinée (« PLOUF ! », « BAM ! »).
  onomatopee(x, y, mot, couleur = '#fff4dc') {
    const son = sonDuMot(mot); if (son) Son.jouer(son);
    const t = this.add.text(x, y, mot, style(30, couleur, { fontStyle: 'bold', stroke: '#2a1a10', strokeThickness: 6 }))
      .setOrigin(0.5).setScale(0).setDepth(9).setAngle(Phaser.Math.Between(-12, 12));
    this.tweens.add({ targets: t, scale: 1, duration: 200, ease: 'Back.easeOut' });
    this.tweens.add({ targets: t, alpha: 0, y: y - 30, delay: 900, duration: 500, onComplete: () => t.destroy() });
  }

  // « Passer ▶▶ » en haut à droite.
  boutonPasser(action) {
    const t = this.add.text(940, 20, 'Passer ▶▶', style(15, '#fff4dc', { fontStyle: 'bold', backgroundColor: '#3b2410', padding: { x: 8, y: 4 } }))
      .setOrigin(1, 0).setDepth(20).setScrollFactor(0).setInteractive({ useHandCursor: true });
    // (le 4e argument est l'événement de Phaser : l'arrêter évite que ce clic fasse aussi avancer l'histoire)
    t.on('pointerdown', (pointer, x, y, evenement) => { evenement.stopPropagation(); action(); });
    return t;
  }
}
