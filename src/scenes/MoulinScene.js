// (v1.35, planches 60 v5, fin et formes de fumée validées) L'aventure du Vieux Moulin, jouée : on marche (◀ ▶, ou un
// clic au sol), ton chat guide et s'arrête là où il faut regarder. Le pont à la planche pourrie (un saut au bon moment),
// le renard de l'Engeance et la chatte sur sa planche qui file vers la roue (trois chances ; sinon ton chat s'en charge :
// elle est toujours sauvée), le sauvetage, puis l'aube sur l'étang : son nom, le succès, et le secret de ton chat. Il
// parle ; il tend son cigare (fumer ou non), souffle ses formes, et le cercle noir se referme sur lui, comme à la fin
// d'un dessin animé. La nuit est passée : on rentre se coucher.
class MoulinScene extends Phaser.Scene {
  constructor() { super('Moulin'); }

  init(data) {
    this.etape = (data && data.etape) || 'sentier';
    this.etat = (data && data.etat) || { chances: 0, nom: '', fume: false };
    this.sys.settings.data = {};
  }

  create() {
    const G = this.G = window.GAME, P = PLACES_MOULIN, aube = this.etape === 'aube';
    exclureScenes(this, 'Nuit', 'Carte', 'Comptoir', 'Dodo');
    creerHalo(this); creerMoulinHD(this); creerFumeeHD(this);
    this.r = construireMoulin(this, { aube });
    this.cameras.main.setBounds(0, 0, LARGEUR_MOULIN, 540).fadeIn(800);
    this.look = lookChat(G);
    this.cleChat = creerChatHD(this, this.look);
    this.lookElle = lookCompagne(G);
    this.cleElle = creerChatHD(this, this.lookElle);
    textureJoueur(this, G);
    this.cleHeros = textureJoueur(this, G);
    this.heros = this.add.image(aube ? P.ponton + 100 : P.entree, SOL_PROMENADE, this.cleHeros).setOrigin(0.5, 1).setScale(echelleJoueur(7.5)).setDepth(8.5);
    this.chat = this.add.image(aube ? P.ponton + 200 : P.entree + 120, SOL_PROMENADE, this.cleChat + '_assis0').setOrigin(0.5, 1).setScale(2.4).setDepth(8.6);
    this.limite = { min: 60, max: aube ? P.ponton + 330 : P.pont - 80 };   // (le pont, d'abord, arrête tes pas)
    this.cible = null; this.pas = 0; this.libre = !aube; this.fini = false; this.cameraLibre = false; this.enSaut = false;
    this.touches = this.input.keyboard ? this.input.keyboard.createCursorKeys() : null;
    this.input.on('pointerdown', (p, sous) => { if (this.libre && !sous.length) this.cible = Phaser.Math.Clamp(p.worldX, this.limite.min, this.limite.max); });
    this.creerBandeau();
    if (typeof Son !== 'undefined') Son.ambiance(aube ? 'recitHeureux' : 'nuit');
    if (aube) this.time.delayedCall(900, () => this.laube());
    else {
      this.dire(`${nomChatMaj(G)} ne touche plus à sa gamelle. Ce soir, il t'a guidé${eJ()} hors de la ville, par le vieux sentier qui longe l'étang. Les grenouilles se taisent quand tu passes.`, '◀ ▶ pour marcher (ou clique au sol) · clique sur les choses pour les regarder');
      this.curiosites();
      this.guider(P.panneau + 120);
    }
  }

  // --- L'interface : le bandeau (la narration en italique, ce qu'on doit faire en gras), les boutons ---
  creerBandeau() {
    const fixe = o => o.setScrollFactor(0).setDepth(9.96);
    this.fondB = this.add.rectangle(480, 12, 920, 40, 0x2a1a10, 0.94).setStrokeStyle(2, 0xc9a227).setOrigin(0.5, 0).setScrollFactor(0).setDepth(9.95);
    this.narr = fixe(this.add.text(40, 22, '', style(13, '#c9b48a', { fontStyle: 'italic', wordWrap: { width: 880 } })));
    this.cons = fixe(this.add.text(40, 40, '', style(14, '#fff4dc', { fontStyle: 'bold', wordWrap: { width: 880 } })));
    this.boutons = [];
  }
  dire(narration, consigne = '') {
    this.narr.setText(narration);
    this.cons.setText(consigne).setY(26 + this.narr.height);
    this.fondB.setSize(920, 20 + this.narr.height + (consigne ? this.cons.height + 4 : 0));
    this.fondB.setVisible(!!narration); this.narr.setVisible(!!narration); this.cons.setVisible(!!narration);
  }
  // Une rangée de boutons en bas de l'écran ; renvoie une promesse qui donne l'indice choisi
  choisir(textes, couleurs = []) {
    this.effacerBoutons();
    return new Promise(ok => {
      const n = textes.length, L = Math.min(300, 880 / n);
      this.cadreB = this.add.rectangle(480, 516, L * n + 20, 40, 0x2a1a10, 0.92).setStrokeStyle(2, 0xc9a227).setScrollFactor(0).setDepth(9.94);
      textes.forEach((t, i) => {
        const b = this.add.text(480 + (i - (n - 1) / 2) * L, 516, t, style(14, '#fff4dc', { fontStyle: 'bold', backgroundColor: couleurs[i] || '#4f7a3a', padding: { x: 8, y: 5 } }))
          .setOrigin(0.5).setScrollFactor(0).setDepth(9.97).setInteractive({ useHandCursor: true });
        b.on('pointerdown', () => { Son.jouer('clic'); this.effacerBoutons(); ok(i); });
        this.boutons.push(b);
      });
    });
  }
  effacerBoutons() { for (const b of this.boutons) b.destroy(); this.boutons = []; if (this.cadreB) { this.cadreB.destroy(); this.cadreB = null; } }
  bulle(x, y, texte, couleur = '#3b2410', taille = 14, duree = 0) {
    const b = this.add.text(x, y, texte, style(taille, couleur, { fontStyle: 'bold', backgroundColor: '#f4ead2', padding: { x: 7, y: 4 }, align: 'center' })).setOrigin(0.5, 1).setDepth(9.9);
    if (duree) this.time.delayedCall(duree, () => this.tweens.add({ targets: b, alpha: 0, duration: 300, onComplete: () => b.destroy() }));
    return b;
  }
  attendre(ms) { return new Promise(ok => this.time.delayedCall(ms, ok)); }
  animer(cfg) { return new Promise(ok => this.tweens.add({ ...cfg, onComplete: ok })); }

  // --- Marcher ---
  update(t, delta) {
    if (!this.heros || this.fini) return;
    let dx = 0;
    if (this.libre && this.touches && (this.touches.left.isDown || this.touches.right.isDown)) { this.cible = null; dx = (this.touches.right.isDown ? 1 : -1) * 0.3 * delta; }
    else if (this.cible !== null) { const reste = this.cible - this.heros.x; dx = Math.sign(reste) * Math.min(Math.abs(reste), 0.3 * delta); if (Math.abs(reste) < 1) this.cible = null; }
    if (dx) {
      const x = Phaser.Math.Clamp(this.heros.x + dx, this.limite.min, this.limite.max);
      if (x !== this.heros.x) { this.heros.x = x; this.heros.setFlipX(dx < 0); this.pas += delta; if (!this.heros.marche) pasDeMarche(this, this.heros, 260); }
      this.heros.y = SOL_PROMENADE - Math.abs(Math.sin(this.pas / 120)) * 2;
    } else if (!this.enSaut) this.heros.y = SOL_PROMENADE;   // (v1.38 : sinon l'arc du saut était effacé à chaque image)
    if (!this.cameraLibre) this.cameras.main.scrollX = Phaser.Math.Clamp(this.heros.x - 420, 0, LARGEUR_MOULIN - 960);
    if (this.libre && this.quandArrive && this.heros.x >= this.quandArrive.x) { const f = this.quandArrive.f; this.quandArrive = null; f(); }
  }
  // Aller quelque part, de soi-même (pendant une scène) : renvoie une promesse
  marcherVers(x, vitesse = 0.22) {
    return new Promise(ok => {
      const d = Math.abs(x - this.heros.x); if (d < 2) return ok();
      this.heros.setFlipX(x < this.heros.x); pasDeMarche(this, this.heros, d / vitesse);
      this.tweens.add({ targets: this.heros, x, duration: d / vitesse, onComplete: ok });
    });
  }
  // Ton chat trottine jusqu'à x, puis s'assoit et attend (la queue qui bat)
  guider(x, { vitesse = 0.25 } = {}) {
    const c = this.chat; this.tweens.killTweensOf(c); if (c.queue) c.queue.remove();
    const d = Math.abs(x - c.x); c.setFlipX(x < c.x);
    let k = 0; const pattes = this.time.addEvent({ delay: 110, loop: true, callback: () => c.setTexture(this.cleChat + '_m' + (k = (k + 1) % 4)) });
    return new Promise(ok => this.tweens.add({ targets: c, x, duration: Math.max(1, d / vitesse), onComplete: () => {
      pattes.remove(); c.setFlipX(false).setTexture(this.cleChat + '_assis0');
      let q = 0; c.queue = this.time.addEvent({ delay: 420, loop: true, callback: () => { if (c.active && c.texture.key.startsWith(this.cleChat + '_assis')) c.setTexture(this.cleChat + '_assis' + (++q % 2)); } });
      ok();
    } }));
  }
  // Les choses qu'on regarde en chemin
  curiosites() {
    const P = PLACES_MOULIN;
    const chose = (x, y, w, h, texte) => {
      const z = this.add.rectangle(x, y, w, h, 0xffffff, 0).setDepth(8.7).setInteractive({ useHandCursor: true });
      const oeil = this.add.text(x, y - h / 2 - 8, '?', style(14, '#f3d98a', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 4 })).setOrigin(0.5).setDepth(8.8);
      this.tweens.add({ targets: oeil, y: oeil.y - 5, duration: 700, yoyo: true, repeat: -1 });
      z.on('pointerdown', () => { if (!this.libre) return; oeil.destroy(); this.dire(texte, this.cons.text); });
      (this.curieux = this.curieux || []).push(z, oeil);
    };
    chose(P.panneau, SOL_MOULIN - 50, 70, 60, "« Le Vieux Moulin ». L'écriteau penche. Plus personne ne vient moudre ici depuis des années.");
    chose(P.saule0, SOL_MOULIN - 90, 120, 120, 'Un vieux saule. Ses branches touchent presque le sol ; des lucioles dorment dedans.');
    chose(760, SOL_MOULIN - 90, 120, 120, "Sous le saule, des traces de pattes dans la boue. Des petites... et d'autres, plus grandes.");
    chose(P.moulin, SOL_MOULIN - 170, 200, 120, 'La lucarne du grenier est allumée. Pourtant, le moulin est abandonné.');
    this.quandArrive = { x: P.pont - 160, f: () => this.lePont() };
  }

  // --- Le pont : une planche pourrie, un saut au bon moment ---
  async lePont() {
    const P = PLACES_MOULIN, G = this.G;
    this.libre = false; this.cible = null;
    await this.guider(P.pont + 110);
    this.bulle(this.heros.x + 30, SOL_PROMENADE - 92, 'Craaac...', '#5a3a2a', 13, 1400);
    this.dire("Le pont de planches sur le ruisseau. Une planche a cédé ; " + nomChat(G) + " est passé d'un bond et t'attend, la queue en point d'interrogation.", 'Clique quand le curseur est dans le vert pour enjamber la planche pourrie.');
    await this.marcherVers(P.pont - 70);
    // la jauge du saut : un curseur qui va et vient
    const x0 = 480, y0 = 130, w = 260;   // (sous le bandeau, loin du pont)
    const fond = this.add.rectangle(x0, y0, w, 16, 0x2a1a10).setStrokeStyle(2, 0xc9a227).setScrollFactor(0).setDepth(9.9);
    const vert = this.add.rectangle(x0 + 30, y0, 56, 12, 0x4f9a3a).setScrollFactor(0).setDepth(9.91);
    const curseur = this.add.rectangle(x0 - w / 2, y0, 6, 22, 0xfff4dc).setScrollFactor(0).setDepth(9.92);
    const va = this.tweens.add({ targets: curseur, x: x0 + w / 2, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const choix = await this.choisir(['Sauter ⤴']);
    void choix; va.stop();
    const reussi = Math.abs(curseur.x - vert.x) <= 32;
    fond.destroy(); vert.destroy(); curseur.destroy();
    Son.jouer('saut');
    this.heros.setFlipX(false);
    const xA = this.heros.x, xB = P.pont + 40;
    const saut = { t: 0 };
    this.enSaut = true;
    await this.animer({ targets: saut, t: 1, duration: 520, onUpdate: () => { this.heros.x = xA + (xB - xA) * saut.t; this.heros.y = SOL_PROMENADE - Math.sin(saut.t * Math.PI) * (reussi ? 40 : 18); } });
    this.enSaut = false; this.heros.y = SOL_PROMENADE;
    if (!reussi) {
      Son.jouer('plouf');
      for (let k = 0; k < 8; k++) { const g = this.add.image(xA + 60, SOL_PROMENADE + 20, 'halo').setScale(0.1).setTint(0xa8d8ff).setDepth(8.7); this.tweens.add({ targets: g, x: g.x + (Math.random() - 0.5) * 50, y: g.y - 20 - Math.random() * 30, alpha: 0, duration: 600, onComplete: () => g.destroy() }); }
      this.dire("Plouf ! Ton pied passe par le trou, droit dans l'eau froide. Tu le retires en grimaçant... rien de grave, juste une botte trempée.", '');
      this.tweens.add({ targets: this.heros, x: this.heros.x + 2, duration: 60, yoyo: true, repeat: 5 });
      await this.attendre(1600);
    } else this.dire("D'un bond, tu enjambes la planche pourrie. " + nomChatMaj(G) + ' te jette un coup d\'œil approbateur, et repart.', '');
    this.limite.max = P.moulin - 360; this.limite.min = P.pont + 20;   // (pas de retour par le trou)
    this.libre = true;
    this.guider(P.moulin - 420);
    this.dire(this.narr.text, '◀ ▶ pour marcher · suis ' + nomChat(G) + ' vers le moulin');
    this.quandArrive = { x: P.moulin - 470, f: () => this.leRenard() };
  }

  // --- Le renard de l'Engeance, et la chatte qui file vers la roue : trois chances ---
  async leRenard() {
    const P = PLACES_MOULIN, G = this.G, X = P.roue;
    this.libre = false; this.cible = null;
    for (const o of this.curieux || []) if (o.active) o.destroy();   // (plus le temps de regarder les choses)
    if (typeof Son !== 'undefined') Son.ambiance('recitPeur');
    // la planche qui dérive sur le bief, la chatte cramponnée dessus
    const yP = SOL_MOULIN - 24;
    const planche = this.add.container(X - 270, yP).setDepth(1.65);
    const pg = this.add.graphics(); pg.fillStyle(0x2a1a0e).fillRect(-30, -4, 60, 9).fillStyle(0x8a6034).fillRect(-28, -3, 56, 6);
    const eau = this.add.graphics(); eau.fillStyle(0x2e4270, 0.75).fillRect(-32, 2, 64, 6).fillStyle(0xd8e8ff, 0.8).fillRect(26, -1, 8, 2);
    const sillage = this.add.graphics(); for (let k = 1; k <= 5; k++) { sillage.lineStyle(2, 0xc8dcff, 0.7 - k * 0.11); sillage.lineBetween(-30 - k * 18, -4 - k * 2.5, -30 - (k - 1) * 18, -2); sillage.lineBetween(-30 - k * 18, 6 + k * 1.5, -30 - (k - 1) * 18, 4); }
    const elle = this.add.image(0, -2, this.cleElle + '_tapi').setOrigin(0.5, 1).setScale(2.1);
    planche.add([sillage, pg, elle, eau]);
    this.tweens.add({ targets: planche, y: yP + 2, duration: 500, yoyo: true, repeat: -1 });
    this.tweens.add({ targets: elle, angle: 3, duration: 700, yoyo: true, repeat: -1 });
    const derive = this.tweens.add({ targets: planche, x: X - 200, duration: 9000 });
    const miaou = this.bulle(X - 250, SOL_MOULIN - 74, 'Miaaaou !', '#2a4a8a', 13); this.events.on('update', () => { if (miaou.active) miaou.setX(planche.x + 30); });
    Son.jouer('miaou');
    // la jauge de la roue
    const jg = this.add.graphics().setDepth(9.9);
    const majJauge = () => { const k = Phaser.Math.Clamp((planche.x - (X - 290)) / 220, 0, 1); jg.clear(); jg.fillStyle(0x2a1a10, 0.9).fillRoundedRect(X - 196, SOL_MOULIN - 108, 92, 12, 4).fillStyle(0xe04030).fillRoundedRect(X - 194, SOL_MOULIN - 106, 88 * Math.max(0.08, k), 8, 3); };
    const libJauge = this.add.text(X - 150, SOL_MOULIN - 110, 'la roue approche', style(11, '#ffd0c0', { fontStyle: 'bold' })).setOrigin(0.5, 1).setDepth(9.9);
    this.events.on('update', majJauge);
    // le renard sort des roseaux, la fumée violette autour de lui
    const renard = this.renard = this.add.image(X - 220, SOL_PROMENADE, 'renardHD_infecte').setOrigin(0.5, 1).setScale(2.2).setDepth(8.55);
    const brume = brumeEngeance(this, renard);
    await this.animer({ targets: renard, x: X - 330, duration: 900 });
    const tremble = this.tweens.add({ targets: renard, x: renard.x + 6, duration: 260, yoyo: true, repeat: -1 });
    Son.jouer('grogne');
    this.bulle(renard.x - 30, SOL_PROMENADE - 60, 'Grrrrhhh...', '#6a1a8a', 13, 2200);
    this.cameraLibre = true;
    this.tweens.add({ targets: this.cameras.main, scrollX: P.moulin - 560, duration: 800 });   // (comme la planche : toi, ton chat, le renard, la planche et la roue)
    this.marcherVers(X - 600);
    await this.guider(X - 520);
    this.chat.setTexture(this.cleChat + '_tapi'); if (this.chat.queue) this.chat.queue.remove();
    this.bulle(this.chat.x, SOL_PROMENADE - 40, 'Pfffchh !', '#8a2a1a', 13, 1800);
    this.dire("Au pied du moulin, un renard aux yeux violets — une fumée étrange s'échappe de son poil. Sur le bief, une chatte s'accroche à une planche qui file vers la roue.", 'Trois chances pour le chasser et la sortir de l\'eau. Si tu les rates toutes, ' + nomChat(G) + " s'en charge : elle est toujours sauvée.");
    // les trois chances : chaque geste a sa chance (la torche est la plus sûre ; la deuxième fois, il hésite)
    const GESTES = [['🪨 Lancer une pierre', 0.4, 'La pierre siffle et rebondit à ses pattes. Il recule d\'un pas... et revient, les babines retroussées.'],
      ['🔥 Brandir la torche', 0.6, 'Tu agites ta torche ; il gronde et tourne autour de la flamme, sans lâcher la berge.'],
      ['🐾 Appeler ' + nomChat(G), 0.5, nomChatMaj(G) + ' fait le gros dos et crache ; le renard le toise et ne bouge pas.']];
    let chasse = false, essai = 0, geste = null;
    const points = this.add.text(940, 488, '', style(13, '#f3d98a', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 4 })).setOrigin(1, 1).setScrollFactor(0).setDepth(9.98);
    const majPoints = () => points.setText('Chances : ' + '● '.repeat(3 - essai) + '○ '.repeat(essai));
    majPoints();
    while (!chasse && essai < 3) {
      const i = await this.choisir(GESTES.map(g => g[0]));
      geste = i; essai++; majPoints();
      if (i === 0) { const p = this.add.circle(this.heros.x + 20, SOL_PROMENADE - 70, 4, 0x8a8478).setDepth(8.7); await this.animer({ targets: p, x: renard.x, y: SOL_PROMENADE - 20, duration: 420, ease: 'Quad.easeIn' }); p.destroy(); }
      if (i === 1) { const f = this.add.image(this.heros.x + 24, SOL_PROMENADE - 92, 'halo').setScale(0.4).setTint(0xff8030).setBlendMode(Phaser.BlendModes.ADD).setDepth(8.7); Son.jouer('feu'); await this.animer({ targets: f, x: f.x + 30, scale: 0.6, duration: 300, yoyo: true, repeat: 1 }); f.destroy(); }
      if (i === 2) { Son.jouer('miaou'); await this.animer({ targets: this.chat, x: this.chat.x + 40, duration: 200, yoyo: true }); }
      chasse = (this.tirage ? this.tirage() : Math.random()) < GESTES[i][1] + (essai - 1) * 0.1;   // (tirage : pour les essais)
      if (!chasse) {
        this.dire(GESTES[i][2], essai < 3 ? 'Encore ' + (3 - essai) + (3 - essai > 1 ? ' chances.' : ' chance.') : '');
        planche.x += 40; derive.stop(); this.tweens.add({ targets: planche, x: planche.x + 30, duration: 2600 });
        await this.attendre(700);
      }
    }
    // chassé : la magie le quitte ; ou, les trois ratées, ton chat bondit lui-même
    if (!chasse) {
      this.dire(nomChatMaj(G) + " en a assez. Il bondit, toutes griffes dehors, et se jette sur le renard en feulant comme un tigre !", '');
      Son.jouer('grogne');
      await this.animer({ targets: this.chat, x: renard.x - 20, y: SOL_PROMENADE - 30, duration: 260 }); this.chat.y = SOL_PROMENADE;
      this.chat.setTexture(this.cleChat + '_bond');
      await this.attendre(500);
    }
    tremble.stop(); brume.arreter();
    renard.setTexture('renardHD_pas').setFlipX(true);
    for (let k = 0; k < 14; k++) { const v = this.add.image(renard.x - 10 + (k % 5) * 8, SOL_PROMENADE - 40 - k * 9, 'halo').setScale(0.25 - k * 0.012).setTint(0x8a30d0).setAlpha(0.5 - k * 0.03).setBlendMode(Phaser.BlendModes.ADD).setDepth(8.6); this.tweens.add({ targets: v, y: v.y - 80, alpha: 0, duration: 2200, delay: k * 60, onComplete: () => v.destroy() }); }
    this.bulle(renard.x, SOL_PROMENADE - 78, 'Kaï !', '#6a4a2a', 13, 1400);
    Son.jouer('loup');
    this.dire((chasse ? ['La pierre l\'a touché au flanc', 'La torche l\'a fait reculer', nomChatMaj(G) + ' l\'a fait reculer'][geste] : nomChatMaj(G) + ' l\'a mis en fuite') + " ; la fumée violette s'échappe de lui et monte vers le ciel. Le renard redevient roux — et s'enfuit dans les roseaux.", '');
    await this.animer({ targets: renard, x: X + 300, duration: 1400 });
    renard.destroy();
    this.etat.chances = essai;
    // le sauvetage : ton chat bondit sur la planche ; toi, tu tends une branche et tu la tires jusqu'au bord
    derive.stop(); this.tweens.killTweensOf(planche);
    this.tweens.add({ targets: planche, y: yP + 2, duration: 500, yoyo: true, repeat: -1 });
    this.dire('Vite, avant la roue !', 'Tends-lui une branche.');
    const j = await this.choisir(['🌿 Tendre une branche']); void j;
    await this.marcherVers(planche.x - 120);
    const branche = this.add.graphics().setDepth(8.6);
    branche.lineStyle(5, 0x3a2414).lineBetween(this.heros.x + 22, SOL_PROMENADE - 70, planche.x - 25, yP).lineStyle(2, 0x8a6034).lineBetween(this.heros.x + 22, SOL_PROMENADE - 71, planche.x - 25, yP - 1);
    this.chat.setTexture(this.cleChat + '_bond');
    await this.animer({ targets: this.chat, x: planche.x + 10, y: yP - 10, duration: 420, ease: 'Quad.easeOut' });
    this.chat.setDepth(1.67); this.chat.y = yP - 4;
    // on tire : la planche vient au bord, les deux chats sautent sur la berge
    this.tweens.killTweensOf(planche);
    await Promise.all([this.animer({ targets: planche, x: this.heros.x + 70, duration: 1400 }), this.animer({ targets: this.chat, x: this.heros.x + 80, duration: 1400 })]);
    branche.destroy();
    elle.destroy(); planche.destroy(); miaou.destroy(); jg.destroy(); libJauge.destroy(); points.destroy();
    this.events.off('update', majJauge);
    this.elle = this.add.image(this.heros.x + 100, SOL_PROMENADE, this.cleElle + '_assis0').setOrigin(0.5, 1).setScale(2.2).setDepth(8.6).setFlipX(true);
    this.chat.setDepth(8.6).setY(SOL_PROMENADE).setX(this.heros.x + 60).setTexture(this.cleChat + '_assis0');
    Son.jouer('miaou');
    this.add.text(this.chat.x + 20, SOL_PROMENADE - 58, '♥', style(22, '#e04060', { fontStyle: 'bold' })).setOrigin(0.5).setDepth(9.9);
    this.dire("Trempée, elle tremble de tout son corps. " + nomChatMaj(G) + " lui lèche le museau. Elle te regarde longtemps... et ne s'enfuit pas.", '(L\'Engeance... jusqu\'ici ? Une page de plus dans ton carnet des choses étranges.)');
    await this.attendre(3200);
    this.dire('Ils partent devant, vers l\'étang. Le ciel pâlit.', 'Suis-les jusqu\'au ponton.');
    if (typeof Son !== 'undefined') Son.ambiance('nuit');
    this.cameraLibre = false;
    this.tweens.add({ targets: [this.chat, this.elle], x: P.ponton + 60, duration: 3000 });
    this.limite.max = P.ponton + 40; this.libre = true;
    this.quandArrive = { x: P.ponton - 40, f: () => { this.libre = false; this.cameras.main.fadeOut(1200); this.cameras.main.once('camerafadeoutcomplete', () => this.scene.restart({ etape: 'aube', etat: this.etat })); } };
  }

  // --- L'aube sur l'étang, en grande pompe : son nom, le succès ---
  async laube() {
    const P = PLACES_MOULIN, G = this.G, X = P.ponton + 230;
    this.cameraLibre = true; this.cameras.main.scrollX = LARGEUR_MOULIN - 960;
    this.heros.setX(X - 130);
    this.chat.setX(X - 30).setFlipX(true);
    this.elle = this.add.image(X + 8, SOL_PROMENADE, this.cleElle + '_assis1').setOrigin(0.5, 1).setScale(2.2).setDepth(8.6).setFlipX(true);
    for (let k = 0; k < 6; k++) { const o = this.add.text(LARGEUR_MOULIN - 760 + k * 90, 120 + (k % 3) * 24, 'v', style(14, '#3a2a3a', { fontStyle: 'bold' })).setDepth(-2); this.tweens.add({ targets: o, x: o.x + 140, y: o.y - 20, duration: 5000, repeat: -1 }); }
    Son.jouer('coq');
    this.add.text(X - 10, SOL_PROMENADE - 58, '♥', style(22, '#e04060', { fontStyle: 'bold' })).setOrigin(0.5).setDepth(9.9);
    this.dire("Le jour se lève sur l'étang. " + nomChatMaj(G) + " et la chatte, serrés l'un contre l'autre sur le ponton. Les oiseaux reviennent, la brume se lève, l'eau devient d'or.", "Elle se méfie de tout le monde — sauf de toi. Comment s'appellera-t-elle ?");
    await this.attendre(1600);
    const nom = await new Promise(ok => demanderTexte('Le nom de la chatte', '', NOM_CHAT_MAX, n => ok((n || '').trim() || 'Minette')));
    this.etat.nom = nom;
    Son.jouer('miaou');
    this.dire(`Elle s'appellera ${nom}. Elle cligne lentement des yeux : chez les chats, c'est un « je t'aime bien ».`, '');
    debloquerSucces(G, 'coeurDeChat', 'au Vieux Moulin'); vignetteSucces(this, 'coeurDeChat');
    await this.attendre(4600);
    await this.leSecret();
  }

  // --- Le secret : il parle. Le cigare, les formes de fumée, et le cercle qui se referme ---
  async leSecret() {
    const G = this.G, X = PLACES_MOULIN.ponton + 230, nom = nomChatMaj(G);
    const c = this.chat; if (c.queue) c.queue.remove();
    c.setTexture(textureChatDebout(this, this.look)).setScale(2.6).setFlipX(false);
    const bout = { x: c.x + 36, y: c.y - 98 };
    const braise = this.add.image(bout.x, bout.y, 'halo').setScale(0.1).setTint(0xff8030).setBlendMode(Phaser.BlendModes.ADD).setDepth(8.7);
    this.tweens.add({ targets: braise, scale: 0.14, duration: 500, yoyo: true, repeat: -1 });
    filetDeFumee(this, () => (c.active ? bout : null));
    this.dire(`${nom} se lève sur ses pattes arrière, sort un petit cigare de son collier, l'allume à une braise... et te regarde droit dans les yeux.`, '');
    await this.attendre(1800);
    // JeuneGoy n'en revient pas : les yeux ronds, la bouche en O, les mains levées
    this.heros.setTexture(textureJoueurPose(this, G, 'troisQuarts', 'stupeur')).setAngle(-5);
    this.tweens.add({ targets: this.heros, x: this.heros.x - 3, duration: 60, yoyo: true, repeat: 5 });
    const ex = this.add.text(this.heros.x - 20, SOL_PROMENADE - 150, '!?', style(28, '#c0301a', { fontStyle: 'bold' })).setOrigin(0.5).setDepth(9.9);
    const goutte = this.add.text(this.heros.x + 22, SOL_PROMENADE - 118, '💧', style(14, '#a8d8ff')).setOrigin(0.5).setDepth(9.9);
    this.tweens.add({ targets: goutte, y: goutte.y + 10, alpha: 0.3, duration: 900, repeat: -1 });
    const repliques = ["« Bon. Faut qu'on parle, toi et moi. »", "« T'as été réglo. Alors voilà : je cause.\nDepuis le début, oui. »",
      "« D'où je viens ? Aucune idée. Un vieux sorcier, je crois.\nUn bel enfoiré, ça, j'en suis sûr. »", `« Mon vrai nom, je l'ai oublié.\nMais ${nomChat(G)}... ça me plaît bien. »`];
    for (const l of repliques) { const b = this.bulle(X - 30, SOL_PROMENADE - 150, l, '#2a1608', 14); this.dire('', ''); await this.choisir(['Suite ▸']); b.destroy(); }
    ex.destroy(); goutte.destroy();
    this.heros.setTexture(this.cleHeros).setAngle(0);
    // il tend son cigare
    // (v1.46) pas avant 18 ans : il ne le propose pas à un gamin
    const mineur = typeof ageJoueur === 'function' && ageJoueur(G) < 18;
    const offre = this.bulle(X - 30, SOL_PROMENADE - 150, mineur ? "« Je t'en offrirais bien une bouffée...\nT'as quel âge, toi ? Pas avant tes dix-huit ans, gamin. »" : '« Une bouffée ? »', '#2a1608', 14);
    this.dire(mineur ? `${nom} tire sur son cigare et te toise des oreilles aux bottes.` : `${nom} te tend son cigare, l'air de rien.`, mineur ? '' : 'À toi de choisir.');
    const fume = mineur ? (await this.choisir(['Suite ▸']), false) : (await this.choisir(['🚬 Tirer une bouffée avec lui', '✋ Non merci'], ['#4f7a3a', '#6a4a2a'])) === 0;
    offre.destroy();
    this.etat.fume = fume;
    let cx = 0, cy = 0;
    if (fume) {
      const cle = textureJoueurPose(this, G, 'troisQuarts', 'mange'), e = echelleJoueur(7.5);
      this.heros.setTexture(cle); const m = MAINS_XY[cle] || { x: 6, y: 90 };
      cx = this.heros.x + m.x * e + 6; cy = SOL_PROMENADE - m.y * e;
      this.add.rectangle(cx, cy, 16, 4, 0x6a3a1a).setDepth(8.6); this.add.rectangle(cx + 8, cy, 3, 4, 0xff7030).setDepth(8.61);
      filetDeFumee(this, () => ({ x: cx + 10, y: cy - 2 }));
      this.dire("Tu prends le cigare. Une bouffée... et tu tousses à t'en décrocher les poumons. " + nom + ' se tient les côtes.', '');
      const kof = this.bulle(this.heros.x - 70, SOL_PROMENADE - 140, 'Kof ! Kof ! Kof !', '#5a3a2a', 15);
      this.tweens.add({ targets: this.heros, angle: 4, duration: 120, yoyo: true, repeat: 7 });
      await this.attendre(1400); kof.destroy(); this.heros.setAngle(0);
      souffleDeFumee(this, cx - 2, cy - 4, 1);
      const rit = this.bulle(X + 40, SOL_PROMENADE - 160, "« Héhé. Doucement, gamin.\nÇa se fume pas, ça se savoure. »", '#2a1608', 14);
      const gain = changerLien(G, 1); if (gain) gainEnDirect(this, c.x, c.y - 170, '+1 ♥ complicité', true);
      await this.attendre(2400); rit.destroy();
      // ton rond de fumée, de travers... et son navire qui passe au travers
      const sx = this.cameras.main.scrollX, g = this.add.graphics().setDepth(8.74);
      g.lineStyle(7, 0xd8d8e0, 0.75).strokeEllipse(sx + 520, 232, 80, 120).lineStyle(2, 0xffffff, 0.8).strokeEllipse(sx + 518, 230, 72, 112);
      this.dire('Tu souffles un rond, de travers. ' + nom + ' y fait passer son navire, voiles gonflées, sans même te regarder.', '');
      formeDeFumee(this, 'navire', c.x + 16, c.y - 96, sx + 380, 236, { taille: 40, tenue: 3600 }); voirForme(G, 'navire');
      await this.attendre(5200); this.tweens.add({ targets: g, alpha: 0, duration: 800, onComplete: () => g.destroy() });
    } else {
      this.heros.setTexture(textureJoueurPose(this, G, 'troisQuarts', 'empoigne'));
      const r = this.bulle(X - 30, SOL_PROMENADE - 150, mineur ? '« Plus pour moi. »' : "« Comme tu veux. Plus pour moi. »", '#2a1608', 14);
      this.dire(mineur ? nom + ' tire une longue bouffée... et souffle un rond de fumée parfait.' : 'Tu lèves la main : non merci. ' + nom + ' hausse les épaules, tire une longue bouffée... et souffle un rond de fumée parfait.', '');
      rondDeFumee(this, c.x + 16, c.y - 96, 1);
      await this.attendre(1800); r.destroy(); this.heros.setTexture(this.cleHeros);
      this.dire('Puis il tire une autre bouffée, la garde... et souffle doucement. La fumée ne monte pas : elle se range, trait par trait.', '');
      formeDeFumee(this, 'navire', c.x + 16, c.y - 96, c.x + 150, 230, { taille: 52, tenue: 3000 }); voirForme(G, 'navire');
      await this.attendre(5000);
    }
    // un cœur pour elle, un poisson qu'elle suit des yeux
    this.dire('Pour elle, un cœur qui bat. Elle lève les yeux, et pour la première fois, elle ronronne.', '');
    formeDeFumee(this, 'coeur', c.x + 16, c.y - 96, c.x + 60, 250, { taille: 38, tenue: 2600 }); voirForme(G, 'coeur');
    await this.attendre(4400);
    this.dire("Un poisson, qui file au-dessus de l'étang. La chatte se ramasse, la queue battante... et bondit dans le vide.", '');
    formeDeFumee(this, 'poisson', c.x + 16, c.y - 96, c.x + 130, 260, { taille: 40, tenue: 2600 }); voirForme(G, 'poisson');
    this.time.delayedCall(2200, () => this.tweens.add({ targets: this.elle, y: SOL_PROMENADE - 30, duration: 220, yoyo: true }));
    await this.attendre(4400);
    const fin = this.bulle(X - 30, SOL_PROMENADE - 150, "« Bon. On rentre ? J'ai deux-trois trucs\nà t'expliquer. Et elle a besoin d'un coin. »", '#2a1608', 14);
    await this.attendre(2600);
    fin.destroy();
    finirMoulin(G, { nom: this.etat.nom, fume: this.etat.fume, chances: this.etat.chances });
    // le cercle noir se referme sur lui, comme à la fin d'un dessin animé (et pas de « The End »)
    this.dire('', '');
    rondDeFumee(this, c.x + 16, c.y - 96, 1);
    const cercle = fermetureEnCercle(this, c.x - this.cameras.main.scrollX, c.y - 80);
    await cercle.promesse;
    await this.attendre(500);
    this.rentrer();
  }

  // La nuit est passée : on rentre, et on se couche (comme « Aller dormir »)
  rentrer() {
    const G = this.G;
    this.fini = true;
    if (typeof Sauvegarde !== 'undefined') Sauvegarde.maintenant(G, 'Nuit');
    const bilan = { jour: G.jour, servis: G.journal.servis, retours: G.journal.retours, morts: G.journal.morts,
      gain: G.argent - G.argentDebutJour, reputation: G.reputation, jauge: jaugeCamp(G), palier: nomPalierCamp(G) };
    this.scene.start('Dodo', { bilan });
  }
}

// Le soir où ton chat boude sa gamelle : il gratte à la porte. Le suivre, ou remettre à un autre soir.
function soireeDuMoulin(scene) {
  const G = scene.G;
  if (!(typeof moulinCeSoir === 'function' && moulinCeSoir(G)) || scene.fenetreMoulin) return false;
  const c = scene.fenetreMoulin = scene.add.container(0, 0).setDepth(40);
  c.add(scene.add.rectangle(480, 270, 960, 540, 0x0a0604, 0.6).setInteractive());
  c.add(scene.add.image(480, 280, panneauHD(scene, 560, 300)).setScale(2));
  const cle = creerChatHD(scene, lookChat(G));
  const chat = scene.add.image(480, 236, cle + '_assis0').setOrigin(0.5, 1).setScale(3.4); c.add(chat);
  let q = 0; const queue = scene.time.addEvent({ delay: 420, loop: true, callback: () => { if (chat.active) chat.setTexture(cle + '_assis' + (++q % 2)); } });
  c.add(scene.add.text(480, 260, `Ce soir, ${nomChat(G)} ne touche pas à sa gamelle. Il gratte à la porte, te regarde, miaule doucement... puis recommence. On dirait qu'il veut que tu le suives.`, style(14, '#5a3a1a', { fontStyle: 'italic', align: 'center', wordWrap: { width: 500 }, lineSpacing: 3 })).setOrigin(0.5, 0));
  const fermer = () => { queue.remove(); c.destroy(); scene.fenetreMoulin = null; };
  const b1 = creerBouton(scene, 360, 386, 250, `Suivre ${nomChat(G)} (toute la nuit)`, () => {
    if (enTransition(scene)) return;   // (v1.38 : « Aller dormir » pendant le fondu lançait le Moulin et le coucher ensemble)
    fermer(); Son.jouer('porte');
    scene.cameras.main.fadeOut(700);
    scene.cameras.main.once('camerafadeoutcomplete', () => scene.scene.start('Moulin'));
  });
  const b2 = creerBouton(scene, 620, 386, 200, 'Pas ce soir', () => { remettreMoulin(G); fermer(); scene.annoncer && scene.annoncer(`${nomChatMaj(G)} soupire et se couche contre la porte. Il réessaiera un autre soir.`); });
  c.add([b1.fond, b1.label, b2.fond, b2.label]);
  Son.jouer('miaou');
  return true;
}
