// (v1.45, planche 71 v2 validée) La pêche à l'étang du Vieux Moulin : JeuneGoy au bout du ponton, sa canne, le bouchon.
// Lancer (maintenir, relâcher dans le vert), la touche (ferrer tout de suite), la remontée (garder le poisson dans la zone
// verte jusqu'à 100 %), puis la fiche de la prise. L'étang se méfie quand on enchaîne les prises ; ton chat, s'il pêche
// avec toi, danse quand on lui donne un poisson... et file parfois avec ta prise. La légende ne se prend qu'une fois.
class PecheScene extends Phaser.Scene {
  constructor() { super('Peche'); }

  init(data) {
    this.plage = (data && data.plage) || 'nuit';
    this.retour = (data && data.retour) || 'NuitSoir';
    this.sys.settings.data = {};
    // (Phaser garde les champs d'une visite à l'autre : on repart de zéro)
    this.fini = false; this.carte = null; this.chat = null; this.cible = null; this.prise = null; this.bilan = null;
    this.excl = null; this.minuteur = null; this.flotte = null; this.iconeRemontee = null; this.ombrePoisson = null; this.moulinette = false; this.etat = 'pret';
  }

  create() {
    const G = this.G = window.GAME, p = this.p = etatPeche(G);
    exclureScenes(this, 'Nuit', 'Carte', 'Comptoir', 'Dodo', 'Marche');
    creerHalo(this); creerMoulinHD(this); creerFumeeHD(this);
    this.r = construireMoulin(this, { aube: this.plage === 'aube', jour: this.plage === 'jour' });
    this.X0 = LARGEUR_MOULIN - 960;
    this.cameras.main.setBounds(0, 0, LARGEUR_MOULIN, 540).setScroll(this.X0, 0).fadeIn(600);
    const nuit = this.plage === 'nuit';
    // JeuneGoy au bout du ponton, la canne en main
    const cle = joueurPecheur(this), ech = echelleJoueur(7.5);
    this.heros = this.add.image(this.X0 + 600, SOL_PROMENADE, cle).setOrigin(0.5, 1).setScale(ech).setDepth(8.5);
    if (nuit) this.heros.setTint(0x8a96c8);
    const m = this.textures.get(cle).main || { x: 6, y: 30 };
    this.main = { x: this.heros.x + m.x * ech, y: SOL_PROMENADE - m.y * ech };
    this.tensionCanne = 0;
    this.canne = this.add.graphics().setDepth(8.6);
    this.ligne = this.add.graphics().setDepth(8.55);
    this.bouchon = this.add.image(0, 0, textureBouchon(this)).setScale(2).setDepth(2.5).setOrigin(0.5, 0.6).setVisible(false);
    this.ombrePoisson = null;
    // ton chat, s'il pêche avec toi : assis sur le ponton, la queue qui bat
    if (chatPecheAvecToi(G)) {
      this.cleChat = creerChatHD(this, lookChat(G));
      this.chat = this.add.image(this.heros.x - 80, SOL_PROMENADE, this.cleChat + '_assis0').setOrigin(0.5, 1).setScale(2.4).setDepth(8.45).setFlipX(false);
      if (nuit) this.chat.setTint(0x9aa4c8);
      let q = 0; this.queueChat = this.time.addEvent({ delay: 420, loop: true, callback: () => { if (this.chat && this.chat.active && this.chat.etat !== 'occupe') this.chat.setTexture(this.cleChat + '_assis' + (++q % 2)); } });
    }
    this.creerInterface();
    this.etat = 'pret';
    this.input.on('pointerdown', (pt, sous) => { if (!sous.length) this.appui(true); });
    this.input.on('pointerup', () => this.appui(false));
    if (typeof Son !== 'undefined') Son.ambiance(nuit ? 'nuit' : 'recitHeureux');
    const textes = { aube: 'L’aube sur l’étang du Moulin. La brume se lève ; des ronds dans l’eau, près des roseaux.', jour: 'Il fait encore jour sur l’étang. Les libellules rasent l’eau ; un brochet chasse quelque part.', nuit: 'La nuit sur l’étang. Les grenouilles chantent, la lune tremble sur l’eau. Les anguilles sortent.' };
    this.textePlage = textes[this.plage];
    if (!p.tuto) { this.etat = 'tuto'; this.time.delayedCall(700, () => this.tuto()); }   // (v1.49 : pas de lancer pendant que Barnabé explique)
    else this.attendreLancer();
  }

  // --- L'interface : le bandeau, la méfiance, le niveau, les boutons ---
  creerInterface() {
    const f = (o, d = 30) => o.setScrollFactor(0).setDepth(d);
    this.fondB = f(this.add.rectangle(480, 12, 920, 40, 0x2a1a10, 0.94).setStrokeStyle(2, 0xc9a227).setOrigin(0.5, 0), 29.9);
    this.narr = f(this.add.text(40, 22, '', style(13, '#c9b48a', { fontStyle: 'italic', wordWrap: { width: 880 } })));
    this.cons = f(this.add.text(40, 40, '', style(14, '#fff4dc', { fontStyle: 'bold', wordWrap: { width: 880 } })));
    // la méfiance de l'étang (en haut à droite) et le niveau de pêcheur (en haut à gauche)
    this.boiteMef = f(this.add.container(0, 0));
    this.boiteNiv = f(this.add.container(0, 0));
    this.majBadges();
    // les boutons du bas
    const b1 = creerBouton(this, 840, 510, 170, 'Rentrer', () => this.rentrer());
    const b2 = creerBouton(this, 650, 510, 190, 'Le carnet de pêche', () => { if (this.etat === 'pret') carnetDePeche(this); });
    for (const b of [b1, b2]) { b.fond.setScrollFactor(0).setDepth(31); b.label.setScrollFactor(0).setDepth(31.1); }
    this.boutonsBas = [b1, b2];
    // la jauge de force (le lancer) et la barre de remontée
    this.jauge = f(this.add.graphics(), 30.5);
    this.barre = f(this.add.graphics(), 30.5);
    this.anneau = f(this.add.graphics(), 30.6);
    this.texteAnneau = f(this.add.text(612, 180, '', style(12, '#fff4dc', { fontStyle: 'bold' })).setOrigin(0.5), 30.7);
    this.iconeRemontee = null;
  }
  dire(narration, consigne = '') {
    this.narr.setText(narration);
    this.cons.setText(consigne).setY(26 + this.narr.height);
    this.fondB.setSize(920, 20 + this.narr.height + (consigne ? this.cons.height + 4 : 0));
  }
  majBadges() {
    const G = this.G, n = mefiancePeche(G, this.plage), pr = progresPeche(G);
    this.boiteMef.removeAll(true);
    const NOMS = { aube: 'Aube', jour: 'Jour', nuit: 'Nuit' }, y = 112;
    this.boiteMef.add(this.add.rectangle(800, y, 300, 46, 0x1a120a, 0.86).setStrokeStyle(2, 0x8a6a3a));
    this.boiteMef.add(this.add.text(662, y - 16, `${NOMS[this.plage]} · ${n} prise${n > 1 ? 's' : ''} d’affilée`, style(12, '#f3d98a', { fontStyle: 'bold' })));
    this.boiteMef.add(this.add.text(662, y + 2, 'L’étang se méfie :', style(11, '#c9b48a', { fontStyle: 'italic' })));
    const max = PECHE.mefianceMax;
    for (let k = 0; k < max; k++) this.boiteMef.add(this.add.image(780 + k * 26, y + 9, texturePoisson(this, 'gardon')).setScale(0.9).setAlpha(k < max - n ? 1 : 0.25).setTint(k < max - n ? 0xffffff : 0x404040));
    this.boiteNiv.removeAll(true);
    this.boiteNiv.add(this.add.rectangle(150, y, 260, 46, 0x1a120a, 0.86).setStrokeStyle(2, 0x8a6a3a));
    this.boiteNiv.add(this.add.text(32, y - 16, `${eJ() ? 'Pêcheuse' : 'Pêcheur'} · niveau ${pr.niveau}`, style(13, '#f3d98a', { fontStyle: 'bold' })));
    const g = this.add.graphics(); g.fillStyle(0x3a2a1a).fillRect(32, y + 4, 180, 8);
    if (pr.haut) g.fillStyle(0x6ab0e0).fillRect(32, y + 4, 180 * (pr.xp - pr.bas) / (pr.haut - pr.bas), 8); else g.fillStyle(0xd8a830).fillRect(32, y + 4, 180, 8);
    this.boiteNiv.add(g);
    this.boiteNiv.add(this.add.text(272, y + 8, pr.haut ? `${pr.xp}/${pr.haut}` : 'max', style(10, '#c9b48a')).setOrigin(1, 0.5));
  }

  // --- La canne (dessinée chaque image : elle plie quand ça tire) ---
  update(t, dt) {
    if (!this.heros) return;
    const h = this.main, k = this.tensionCanne;
    const pointe = { x: h.x + 110 + 10 * k, y: h.y - 150 + 80 * k }, ctrl = { x: h.x + 60 + 30 * k, y: h.y - 90 - 40 * k };
    this.pointe = pointe;
    const pts = new Phaser.Curves.QuadraticBezier(new Phaser.Math.Vector2(h.x - 14, h.y + 12), new Phaser.Math.Vector2(ctrl.x, ctrl.y), new Phaser.Math.Vector2(pointe.x, pointe.y)).getPoints(24);
    const [c1, c2] = { roseau: [0x8a7a3a, 0xc0b060], grandPere: [0x7a6a30, 0xc8b868], noisetier: [0x6e4a26, 0xb08450] }[this.p.canne] || [0x8a6030, 0x9a7e52];
    this.canne.clear();
    pts.forEach((pt, i) => { if (!i) return; const q = pts[i - 1], ep = 5 - i * 0.16; this.canne.lineStyle(ep, i < 5 ? 0x5a3a1a : c1).lineBetween(q.x, q.y, pt.x, pt.y); this.canne.lineStyle(Math.max(1, ep - 3), i < 5 ? 0x8a6040 : c2).lineBetween(q.x - 1, q.y - 1, pt.x - 1, pt.y - 1); });
    // la ligne : jusqu'au bouchon (molle), ou tendue vers le poisson
    this.ligne.clear();
    if (this.bouchon.visible || this.cible) {
      const b = this.cible || { x: this.bouchon.x, y: this.bouchon.y - 6 };
      this.ligne.lineStyle(1, 0xe8e8e8, 0.85);
      if (k > 0.3) this.ligne.lineBetween(pointe.x, pointe.y, b.x, b.y);
      else new Phaser.Curves.QuadraticBezier(new Phaser.Math.Vector2(pointe.x, pointe.y), new Phaser.Math.Vector2((pointe.x + b.x) / 2, Math.max(pointe.y, b.y) + 30), new Phaser.Math.Vector2(b.x, b.y)).draw(this.ligne, 20);
    }
    if (this.etat === 'arme') this.majJauge(t);
    if (this.etat === 'remontee') this.majRemontee(dt);
  }

  // --- Le tuto de la première fois : Barnabé (ou ton chat) explique ---
  async tuto() {
    const G = this.G, p = this.p;
    const parChat = !p.barnabe && chatPecheAvecToi(G);
    let guide = null;
    if (!parChat) {
      guide = imageCorps(this, this.X0 + 450, SOL_PROMENADE, PECHEUR_COMTE, 5).setDepth(8.4).setFlipX(false);
      if (this.plage === 'nuit') guide.setTint(0x9aa4c8);
    }
    const qui = parChat ? this.chat : guide, nom = parChat ? nomChatMaj(G) : 'Barnabé';
    const bulle = this.add.text(0, 0, '', style(13, '#2a1608', { fontStyle: 'bold', backgroundColor: '#f4ead2', padding: { x: 7, y: 4 }, align: 'center' })).setOrigin(0.5, 1).setDepth(9.9);
    const pages = parChat
      ? ["« Mon grand-père pêchait ici. Il disait : on ne pêche pas un poisson,\non le convainc. Regarde-moi ça, tu tiens ta canne comme une fourchette. »",
        "« Maintiens pour armer, relâche quand la jauge est dans le vert.\nTrop fort, ça s'emmêle. Plus loin, plus gros... mais plus long à mordre. »",
        "« Le bouchon plonge : ferre tout de suite. Puis garde-le dans la zone verte\njusqu'à ce qu'il soit à toi. Et n'en prends pas trop d'affilée : l'étang se méfie. »"]
      : ["« Ah, te voilà ! Je passais justement. Allez, je te montre.\nMaintiens pour armer, relâche quand la jauge est dans le vert. »",
        "« Trop fort, ça s'emmêle. Plus loin, plus gros... mais plus long à mordre.\nQuand le bouchon plonge : tu ferres, tout de suite ! »",
        "« Ensuite, garde-le dans la zone verte jusqu'à ce qu'il soit à toi.\nEt n'en prends pas trop d'affilée : l'étang se méfie. Bonne pêche ! »"];
    this.dire(this.textePlage, `${nom} t'explique la pêche.`);
    for (const pg of pages) {
      bulle.setText(pg).setPosition(Phaser.Math.Clamp(qui.x - this.X0, 240, 720) + this.X0, qui.y - qui.displayHeight - 10);
      await this.suite();
    }
    bulle.destroy();
    p.tuto = true;
    if (guide) { this.tweens.add({ targets: guide, x: guide.x - 300, alpha: 0, duration: 2200, onComplete: () => guide.destroy() }); }
    this.attendreLancer();
  }
  suite() {
    return new Promise(ok => {
      const b = creerBouton(this, 480, 170, 140, 'Suite ▸', () => { Son.jouer('clic'); b.fond.destroy(); b.label.destroy(); ok(); });
      b.fond.setScrollFactor(0).setDepth(32); b.label.setScrollFactor(0).setDepth(32.1);
    });
  }

  // --- Lancer ---
  attendreLancer() {
    this.etat = 'pret'; this.cible = null; this.tensionCanne = 0;
    this.bouchon.setVisible(false);
    // (v1.49) ce qui restait d'une prise interrompue : le « ! », l'ombre du poisson, le bouchon qui flotte
    if (this.flotte) { this.flotte.stop(); this.flotte = null; }
    if (this.excl) { this.excl.destroy(); this.excl = null; }
    if (this.ombrePoisson) { this.ombrePoisson.destroy(); this.ombrePoisson = null; }
    this.jauge.clear(); this.barre.clear(); this.anneau.clear(); this.texteAnneau.setText('');
    if (this.iconeRemontee) { this.iconeRemontee.destroy(); this.iconeRemontee = null; }
    if (plusRienNeMord(this.G, this.plage)) return this.dire(this.textePlage, 'Plus rien ne mord : l’étang se méfie. Reviens à un autre moment de la journée (l’aube, le jour, la nuit).');
    this.dire(this.textePlage, 'Maintiens le clic pour armer · relâche quand la jauge est dans le vert');
  }
  appui(bas) {
    if (bas && this.etat === 'pret' && !plusRienNeMord(this.G, this.plage)) { this.etat = 'arme'; this.t0 = this.time.now; return; }
    if (!bas && this.etat === 'arme') return this.lancer();
    if (bas && this.etat === 'attente') return this.tropTot();
    if (bas && this.etat === 'touche') return this.ferrer();
    if (this.etat === 'remontee') this.moulinette = bas;
  }
  forceJauge(t) { const u = ((t - this.t0) / 1100) % 2; return u < 1 ? u : 2 - u; }
  majJauge(t) {
    const g = this.jauge, x = 430, y0 = 300, h = 160, f = this.forceJauge(t);
    g.clear().fillStyle(0x1a120a, 0.9).fillRoundedRect(x - 16, y0 - 8, 32, h + 16, 8);
    for (let k = 0; k < h; k++) { const u = k / h; g.fillStyle(u > 0.78 ? 0xd84a2a : u > 0.55 ? 0x5ab040 : u > 0.3 ? 0xe8c040 : 0x8a7a5a).fillRect(x - 10, y0 + h - k - 1, 20, 1); }
    g.lineStyle(3, 0xfff4dc).strokeRect(x - 14, y0 + h - f * h - 3, 28, 6);
    this.tensionCanne = -0.3 * f;   // (il arme : la canne part en arrière)
  }
  lancer() {
    const f = this.forceJauge(this.time.now), c = canneDe(this.G);
    this.jauge.clear(); this.tensionCanne = 0;
    let dist = Phaser.Math.Clamp(f / 0.78, 0.15, 1);
    if (f > 0.78) { dist = 0.25; this.dire(this.textePlage, 'Trop fort ! La ligne s’emmêle et le bouchon tombe tout près. (Attends la touche, ou clique pour relancer plus tard.)'); }
    else this.dire(this.textePlage, 'Le bouchon flotte... Attends que ça morde (cliquer trop tôt fait fuir le poisson)');
    this.distance = dist;
    const xb = this.X0 + 640 + dist * c.portee * 300, yb = SOL_MOULIN - 30 + dist * 6;
    this.bouchon.setVisible(true).setPosition(this.pointe.x, this.pointe.y).setAngle(0);
    Son.jouer('siffle');
    this.etat = 'vol';
    // (une belle courbe : le bouchon monte, puis retombe dans l'eau)
    const x0 = this.pointe.x, y0 = this.pointe.y, haut = 60 + dist * 70, vol = { u: 0 };
    this.tweens.add({ targets: vol, u: 1, duration: 520 + dist * 300, ease: 'Linear',
      onUpdate: () => this.bouchon.setPosition(x0 + (xb - x0) * vol.u, y0 + (yb - y0) * vol.u - haut * Math.sin(vol.u * Math.PI)).setAngle(vol.u * 360),
      onComplete: () => { this.bouchon.setAngle(0); Son.jouer('plouf'); this.ronds(xb, yb, 2); this.yb = yb; this.attendreTouche(); } });
  }
  ronds(x, y, n = 1) { for (let k = 0; k < n; k++) { const o = this.add.ellipse(x, y + 4, 18, 5).setStrokeStyle(2, 0xffffff, 0.7).setDepth(2.6); this.tweens.add({ targets: o, scaleX: 3, scaleY: 2.4, alpha: 0, duration: 1100, delay: k * 250, onComplete: () => o.destroy() }); } }

  // --- La touche ---
  attendreTouche() {
    const G = this.G;
    this.etat = 'attente';
    this.prise = tirerPrise(G, this.plage, this.distance);
    this.regl = reglagesTouche(G, this.plage, this.prise);
    this.flotte = this.tweens.add({ targets: this.bouchon, y: this.yb + 2, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    // de petites touches pour rien (le poisson goûte), puis la vraie
    const n = Phaser.Math.Between(0, 2);
    for (let k = 0; k < n; k++) this.time.delayedCall(this.regl.delai * (k + 1) / (n + 2), () => { if (this.etat === 'attente') { this.tweens.add({ targets: this.bouchon, angle: 10, duration: 90, yoyo: true }); this.ronds(this.bouchon.x, this.yb); } });
    this.minuteur = this.time.delayedCall(this.regl.delai, () => this.touche());
  }
  touche() {
    if (this.etat !== 'attente') return;
    this.etat = 'touche';
    if (this.flotte) this.flotte.stop();
    this.tweens.add({ targets: this.bouchon, y: this.yb + 10, angle: 18, duration: 120 });
    this.ronds(this.bouchon.x, this.yb, 3); Son.jouer('plouf');
    this.dire(this.textePlage, 'Ça mord ! FERRE ! (un clic, tout de suite)');
    this.excl = this.add.text(this.bouchon.x, this.yb - 50, '!', style(40, '#ffe066', { fontStyle: 'bold', stroke: '#3b2410', strokeThickness: 6 })).setOrigin(0.5).setDepth(9);
    this.minuteur = this.time.delayedCall(this.regl.fenetre, () => {
      if (this.etat !== 'touche') return;
      if (this.excl) this.excl.destroy();
      this.rate('Trop tard... il a filé avec l’appât.');
    });
  }
  tropTot() {
    if (this.minuteur) this.minuteur.remove();
    if (this.flotte) this.flotte.stop();
    this.rate('Trop tôt ! Le poisson a eu peur.');
  }
  rate(texte) {
    this.etat = 'rate';
    Son.jouer('echec');
    this.dire(this.textePlage, texte);
    this.tweens.add({ targets: this.bouchon, x: this.pointe.x, y: this.pointe.y, duration: 500, onComplete: () => { this.bouchon.setVisible(false); this.time.delayedCall(900, () => this.attendreLancer()); } });
  }

  // --- La remontée : garder le poisson dans la zone verte ---
  ferrer() {
    if (this.minuteur) this.minuteur.remove();
    if (this.excl) { this.excl.destroy(); this.excl = null; }
    this.etat = 'remontee';
    Son.jouer('coup');
    this.bouchon.setVisible(false);
    this.cible = { x: this.bouchon.x, y: this.yb + 6 };
    this.rem = { z: 0.5, vz: 0, f: 0.5, cf: 0.5, prog: 0.3, hors: 0, t: 0 };
    this.moulinette = this.input.activePointer.isDown;
    const id = this.prise.legende ? 'legende' : this.prise.etrange ? 'carpe' : this.prise.id;
    this.ombrePoisson = this.add.image(this.cible.x, this.cible.y + 14, texturePoisson(this, id)).setScale(this.prise.legende ? 3 : 2.2).setTint(0x14303a).setAlpha(0.45).setDepth(2.45);
    this.iconeRemontee = this.add.image(0, 180, texturePoisson(this, id)).setScale(this.prise.legende ? 0.9 : 1.1).setScrollFactor(0).setDepth(30.8);
    const nom = this.prise.legende ? 'Ça tire comme jamais... Quelque chose d’énorme !' : this.prise.etrange ? 'C’est lourd... mais ça ne se débat pas beaucoup.' : 'Ça tire ! Garde-le dans la zone verte.';
    this.dire(nom, 'Clic maintenu : tu moulines (la zone verte avance) · relâché : elle recule · reste sur le poisson jusqu’à 100 %');
  }
  majRemontee(dt) {
    const R = this.rem, g = this.barre, x0 = 120, y = 180, L = 420, d = dt / 1000, c = canneDe(this.G);
    R.t += dt;
    // le poisson : il file d'un point à l'autre, plus vite et plus loin s'il est fort
    if (Math.abs(R.f - R.cf) < 0.02 || Math.random() < d * (0.6 + this.regl.force)) R.cf = Phaser.Math.Clamp(R.f + (Math.random() - 0.5) * (0.4 + this.regl.force * 0.8), 0.04, 0.96);
    R.f += (R.cf - R.f) * Math.min(1, d * (1.2 + this.regl.force * 3));
    // la zone : le moulinet la pousse, la ligne la ramène
    R.vz += (this.moulinette ? 1.9 * c.moulinet : -1.6) * d;
    R.vz *= Math.pow(0.12, d);
    R.z = Phaser.Math.Clamp(R.z + R.vz * d, 0, 1);
    if (R.z <= 0 || R.z >= 1) R.vz = 0;
    const dedans = Math.abs(R.f - R.z) < this.regl.zone / 2;
    R.prog = Phaser.Math.Clamp(R.prog + (dedans ? 0.26 * c.moulinet : -0.2) * d * (this.prise.legende ? 0.6 : 1), 0, 1);
    if (!dedans) R.hors += dt;
    this.tensionCanne = dedans ? 0.6 + 0.2 * Math.sin(R.t / 90) : 0.85;
    // dessin
    g.clear().fillStyle(0x1a120a, 0.92).fillRoundedRect(x0 - 16, y - 26, L + 32, 52, 10).lineStyle(2, 0xc9a227).strokeRoundedRect(x0 - 16, y - 26, L + 32, 52, 10);
    g.fillStyle(0x4a3a2a).fillRect(x0, y - 8, L, 16);
    const zl = L * this.regl.zone;
    g.fillStyle(dedans ? 0x6ac050 : 0x4a8a3a).fillRect(x0 + R.z * L - zl / 2, y - 8, zl, 16).lineStyle(2, 0xb8f0a0).strokeRect(x0 + R.z * L - zl / 2, y - 8, zl, 16);
    this.iconeRemontee.setPosition(x0 + R.f * L, y);
    this.anneau.clear().fillStyle(0x1a120a, 0.92).fillCircle(612, y, 30).lineStyle(6, 0x4a3a2a).strokeCircle(612, y, 22).lineStyle(6, 0xf3d98a).beginPath().arc(612, y, 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0.001, R.prog)).strokePath();
    this.texteAnneau.setPosition(612, y).setText(Math.round(R.prog * 100) + ' %');
    // le poisson dans l'eau suit, et se rapproche du ponton à mesure qu'on gagne
    const xp = Phaser.Math.Linear(this.main.x + 160, this.bouchon.x + 40, 1 - R.prog) + (R.f - 0.5) * 120;
    this.cible.x = xp; this.ombrePoisson.setPosition(xp, this.cible.y + 14).setFlipX(R.cf > R.f);
    if (Math.random() < d * 3) this.ronds(xp, this.cible.y - 4);
    // trop coriace : la ligne casse ; à zéro, il se décroche ; à 100 %, il est à toi
    if (this.regl.ecart && R.hors > this.regl.casse) return this.finRemontee('casse');
    if (R.prog <= 0) return this.finRemontee('decroche');
    if (R.prog >= 1) return this.finRemontee('prise');
  }
  finRemontee(issue) {
    this.etat = 'fin';
    this.barre.clear(); this.anneau.clear(); this.texteAnneau.setText('');
    if (this.iconeRemontee) { this.iconeRemontee.destroy(); this.iconeRemontee = null; }
    if (this.ombrePoisson) { this.ombrePoisson.destroy(); this.ombrePoisson = null; }
    const cx = this.cible.x; this.cible = null; this.tensionCanne = 0;
    if (issue === 'casse') {
      Son.jouer('coup'); this.cameras.main.shake(140, 0.006);
      const t = this.add.text(cx, SOL_MOULIN - 80, 'CRAC !', style(30, '#ffe066', { fontStyle: 'bold', stroke: '#3b2410', strokeThickness: 6 })).setOrigin(0.5).setAngle(-8).setDepth(9);
      this.tweens.add({ targets: t, y: t.y - 30, alpha: 0, delay: 900, duration: 600, onComplete: () => t.destroy() });
      const P = this.prise.legende ? { niveau: PECHE.legende.niveau } : POISSONS[this.prise.id] || { niveau: 1 };
      this.dire('La ligne casse ! Le poisson file avec ton hameçon...', `Trop coriace pour l’instant (niveau ${P.niveau} conseillé). Chaque prise te donne de l’expérience ; une meilleure canne aide aussi.`);
      return this.time.delayedCall(2600, () => this.attendreLancer());
    }
    if (issue === 'decroche') { Son.jouer('echec'); this.dire('Il s’est décroché, et retourne au fond en narguant ta ligne.', ''); return this.time.delayedCall(1800, () => this.attendreLancer()); }
    // à toi !
    Son.jouer('plouf');
    const bilan = this.bilan = enregistrerPrise(this.G, this.prise, this.plage);
    this.majBadges();
    if (bilan.monte) vignetteGuide(this, 'PÊCHEUR', `Niveau ${bilan.niveau} !`, 'Tu sens mieux le poisson : les plus coriaces cassent moins ta ligne.', { y: 460, prof: 1800 });
    if (typeof montrerSuccesEnAttente === 'function') montrerSuccesEnAttente(this);
    if (chatVoleLaPrise(this.G, this.prise, bilan)) return this.vol();
    this.fiche();
  }

  // --- Le chat voleur : il file avec la prise, dans la gueule ---
  async vol() {
    const c = this.chat, X = this.heros.x;
    c.etat = 'occupe';
    this.dire(`${nomChatMaj(this.G)} est venu pêcher avec toi... à sa façon.`, '');
    // la prise, au bout de la ligne, et le chat qui bondit
    const poisson = this.add.image(X + 70, SOL_PROMENADE - 70, texturePoisson(this, this.prise.id)).setScale(1.6).setDepth(8.7).setAngle(-20);
    c.setTexture(this.cleChat + '_bond').setFlipX(false);
    await new Promise(ok => this.tweens.add({ targets: c, x: X + 60, y: SOL_PROMENADE - 30, duration: 300, ease: 'Quad.easeOut', onComplete: ok }));
    Son.jouer('miaou');
    // dans sa gueule, et il détale
    c.setTexture(this.cleChat + '_m0').setFlipX(true).setY(SOL_PROMENADE);   // (il détale vers la gauche, la prise dans la gueule)
    const dx = -c.displayWidth / 2 + 10, dy = -c.displayHeight + 26;
    poisson.setPosition(c.x + dx, c.y + dy).setAngle(-6).setScale(1.2);
    const bulle = this.add.text(c.x - this.X0, c.y - 80, '« Pour la familleeeee ! »', style(14, '#2a1608', { fontStyle: 'bold', backgroundColor: '#f4ead2', padding: { x: 6, y: 3 } })).setOrigin(0.5, 1).setScrollFactor(0).setDepth(30);
    let k = 0; const pas = this.time.addEvent({ delay: 110, loop: true, callback: () => c.active && c.setTexture(this.cleChat + '_m' + (++k % 2)) });
    this.tweens.add({ targets: [c], x: this.X0 - 80, duration: 1600, ease: 'Quad.easeIn', onUpdate: () => poisson.setPosition(c.x + dx, c.y + dy) });
    this.tweens.add({ targets: bulle, x: 120, alpha: 0, delay: 700, duration: 900 });
    this.dire(`${nomChatMaj(this.G)} file avec ${/^(Gardon|Brochet)$/.test(POISSONS[this.prise.id].nom) ? 'ton' : 'ta'} ${POISSONS[this.prise.id].nom.toLowerCase()} dans la gueule !`, `L’expérience, tu la gardes (+${this.bilan.gain}). Le poisson... beaucoup moins.`);
    await new Promise(ok => this.time.delayedCall(1800, ok));
    pas.remove(); poisson.destroy(); bulle.destroy();
    // il revient s'asseoir l'air de rien, en se léchant les babines
    c.setPosition(this.heros.x - 80, SOL_PROMENADE).setTexture(this.cleChat + '_assis0').setFlipX(false).setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, duration: 600, onComplete: () => { c.etat = null; } });
    this.time.delayedCall(900, () => this.attendreLancer());
  }

  // --- La fiche de la prise ---
  fiche() {
    const G = this.G, P = this.prise, B = this.bilan;
    const c = this.carte = this.add.container(0, 0).setScrollFactor(0).setDepth(1500);
    c.add(this.add.rectangle(480, 270, 960, 540, 0x000000, 0.45).setInteractive());
    const leg = P.legende;
    c.add(this.add.image(480, 252, panneauHD(this, leg ? 600 : 560, leg ? 380 : 340)).setScale(2));
    if (leg) { const g = this.add.graphics(); g.lineStyle(4, 0xd8a830).strokeRoundedRect(186, 66, 588, 372, 10).lineStyle(1, 0xfff0a0).strokeRoundedRect(192, 72, 576, 360, 8); c.add(g);
      c.add(this.add.text(480, 90, '★ LÉGENDE ★', style(13, '#2a1606', { fontStyle: 'bold', backgroundColor: '#f3c450', padding: { x: 10, y: 3 } })).setOrigin(0.5)); }
    const ajouter = o => { c.add(o); return o; };
    if (P.etrange) {
      const e = PRISES_ETRANGES[P.id];
      ajouter(this.add.text(480, 116, e.nom + ' !', style(22, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
      ajouter(this.add.image(480, 196, texturePrise(this, P.id)).setScale(4.5));
      if (B.nouveau) ajouter(this.add.text(640, 160, 'NOUVEAU DANS LE CARNET', style(11, '#14100a', { fontStyle: 'bold', backgroundColor: '#e8c060', padding: { x: 6, y: 2 } })).setOrigin(0.5).setAngle(8));
      ajouter(this.add.text(480, 262, `+${B.gain} expérience de pêcheur`, style(13, '#1f4a7a', { fontStyle: 'bold' })).setOrigin(0.5));
      ajouter(this.add.text(480, 296, e.texte, style(12, '#3b2410', { wordWrap: { width: 500 }, align: 'center' })).setOrigin(0.5));
      if (e.pieces) this.gain(`+${e.pieces} p.`);
      return this.boutonsFiche([['Ranger', () => this.fermerFiche()]]);
    }
    const f = leg ? LEGENDE_ETANG : POISSONS[P.id];
    ajouter(this.add.text(480, leg ? 118 : 116, leg ? f.nom : `${/^[AEIOUÉ]/.test(f.nom) ? 'Une' : (f.nom === 'Gardon' || f.nom === 'Brochet') ? 'Un' : 'Une'} ${f.nom.toLowerCase()} !`.replace('Un gardon', 'Un gardon').replace('Une anguille', 'Une anguille'), style(leg ? 24 : 22, leg ? '#5a2a06' : '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
    ajouter(this.add.text(480, leg ? 144 : 142, `${P.taille} cm${B.record && !leg ? ' · ton record pour cette espèce' : ''}${leg ? ' · cent ans au moins, l’anneau du meunier dans la lèvre' : ''}`, style(13, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5));
    ajouter(this.add.image(480, leg ? 192 : 200, texturePoisson(this, leg ? 'legende' : P.id)).setScale(leg ? 2.9 : 5.2));
    if (B.nouveau && !leg) ajouter(this.add.text(640, 168, 'NOUVEAU DANS LE CARNET', style(11, '#14100a', { fontStyle: 'bold', backgroundColor: '#e8c060', padding: { x: 6, y: 2 } })).setOrigin(0.5).setAngle(8));
    const pr = progresPeche(G);
    if (leg) {
      ajouter(this.add.text(480, 254, `« Par tous les goujons de la Comté ! Cinquante ans que je la guette...\nTu es ${eJ() ? 'une vraie pêcheuse' : 'un vrai pêcheur'}, toi. » — Barnabé, accouru sur la berge`, style(12, '#3b2410', { align: 'center', fontStyle: 'bold' })).setOrigin(0.5));
      ajouter(this.add.text(480, 288, `+${B.gain} expérience de pêcheur · un succès · elle ne se pêche qu’une seule fois`, style(12, '#1f4a7a', { fontStyle: 'bold' })).setOrigin(0.5));
      return this.choixLegende();
    }
    ajouter(this.add.text(480, 258, `+${B.gain} expérience de pêcheur  (niveau ${pr.niveau}${pr.haut ? ' · ' + pr.xp + ' / ' + pr.haut : ''})`, style(13, '#1f4a7a', { fontStyle: 'bold' })).setOrigin(0.5));
    ajouter(this.add.text(480, 284, f.note, style(11, '#3b2410', { wordWrap: { width: 540 }, align: 'center' })).setOrigin(0.5));
    const prix = prixPoisson(P), reste = PECHE.venteParJour - ventesDuJour(G);
    const choix = [[`Garder (fumée : +1 ration)`, () => { const r = garderPoisson(G, P); if (r.erreur) return this.alerte(r.erreur); this.gain('+1 ration'); this.fermerFiche(); }],
      [reste > 0 ? `Vendre à Barnabé · ${prix} p.` : 'Barnabé n’en veut plus', () => { const r = vendrePoisson(G, P); if (r.erreur) return this.alerte(r.erreur); Son.jouer('pieces'); this.gain(`+${r.gain} p.`); this.fermerFiche(); }]];
    if (this.chat) choix.push([`Donner à ${nomChat(G)} · +1 ♥`, () => { const r = donnerAuChat(G, P); this.fermerFiche(false); this.danse(P, r.gain); }]);
    choix.push(['La relâcher', () => { Son.jouer('plouf'); this.dire(this.textePlage, 'Tu la relâches. Elle file au fond, dans un éclair d’écailles.'); this.fermerFiche(); }]);
    this.boutonsFiche(choix);
    ajouter(this.add.text(480, 418, `Barnabé en rachète encore ${Math.max(0, reste)} aujourd’hui : la pêche est un plaisir, pas une mine d’or.`, style(11, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5));
  }
  boutonsFiche(choix, y0 = 330) {
    const n = choix.length;
    choix.forEach(([t, a], i) => {
      const x = n === 1 ? 480 : 330 + (i % 2) * 300, y = n === 1 ? 380 : y0 + Math.floor(i / 2) * 48;
      const b = creerBouton(this, x, y, 270, t, () => { Son.jouer('clic'); a(); });
      b.fond.setScrollFactor(0); b.label.setScrollFactor(0);
      this.carte.add([b.fond, b.label]);
    });
  }
  alerte(texte) {
    Son.jouer('refus');
    const t = this.add.text(480, 446, texte, style(13, '#a03030', { fontStyle: 'bold', backgroundColor: '#f4ead2', padding: { x: 6, y: 3 } })).setOrigin(0.5).setScrollFactor(0).setDepth(1600);
    this.tweens.add({ targets: t, alpha: 0, delay: 2200, duration: 500, onComplete: () => t.destroy() });
  }
  gain(texte, couleur = '#8af0a0') {
    const t = this.add.text(480, 300, texte, style(22, couleur, { fontStyle: 'bold', stroke: '#14100a', strokeThickness: 5 })).setOrigin(0.5).setScrollFactor(0).setDepth(1700);
    this.tweens.add({ targets: t, y: 240, alpha: 0, duration: 1600, onComplete: () => t.destroy() });
  }
  fermerFiche(relancer = true) {
    if (this.carte) { this.carte.destroy(); this.carte = null; }
    if (typeof Sauvegarde !== 'undefined') Sauvegarde.planifier(this.G, this.retour === 'NuitMatin' ? 'Maison' : this.retour === 'Marche' ? 'Marche' : 'Nuit');   // (v1.49 : le bon lieu au rechargement)
    if (relancer) this.time.delayedCall(300, () => this.attendreLancer());
  }

  // --- Le chat danse : debout, la prise levée à deux pattes, il change de pied et fredonne ---
  async danse(P, gain, legende = false) {
    const c = this.chat, look = lookChat(this.G);
    c.etat = 'occupe';
    const x = this.heros.x - 90;
    c.setPosition(x, SOL_PROMENADE + 2).setOrigin(0.5, 1).setScale(2.6);
    const id = legende ? 'legende' : P.id;
    const poisson = this.add.image(x, SOL_PROMENADE - 128, texturePoisson(this, id)).setScale(legende ? 1.2 : 1.6).setDepth(8.71);
    const bulle = this.add.text(x - this.X0, SOL_PROMENADE - 170, legende ? '« Grand-Mère Écaille... pour moi ?\nOn dînera chez les rois, ce soir ! »' : `« ${/^(Gardon|Brochet)$/.test(POISSONS[P.id].nom) ? 'Un' : 'Une'} ${POISSONS[P.id].nom.toLowerCase()} ? Pour moi ? Oh, toi... »`, style(13, '#2a1608', { fontStyle: 'bold', backgroundColor: '#f4ead2', padding: { x: 7, y: 4 }, align: 'center' })).setOrigin(0.5, 1).setScrollFactor(0).setDepth(30);
    this.dire(`${nomChatMaj(this.G)} se dresse sur ses pattes arrière, lève sa prise au-dessus de sa tête... et danse.`, gain > 0 ? `+${gain} ♥` : 'Il danse quand même (le ♥ du jour, il l’a déjà eu).');
    if (gain > 0) this.gain(`+${gain} ♥`, '#ff8aa0');
    Son.jouer('miaou');
    const notes = [];
    for (let k = 0; k < 8; k++) {
      const im = k % 2;
      c.setTexture(textureChatDanse(this, look, im)).setAngle(im ? 7 : -7);
      const a = Phaser.Math.DegToRad(c.angle);
      poisson.setPosition(x + Math.sin(a) * 128, SOL_PROMENADE + 2 - Math.cos(a) * 128).setAngle(c.angle);
      if (k % 2 === 0) { const n = this.add.text(x + Phaser.Math.Between(-30, 30), SOL_PROMENADE - 150, k % 4 ? '♫' : '♪', style(20, '#fff4dc', { stroke: '#3b2410', strokeThickness: 4 })).setOrigin(0.5).setDepth(9); notes.push(n); this.tweens.add({ targets: n, y: n.y - 50, alpha: 0, duration: 1300, onComplete: () => n.destroy() }); }
      await new Promise(ok => this.time.delayedCall(300, ok));
    }
    bulle.destroy(); poisson.destroy();
    c.setAngle(0).setScale(2.4).setTexture(this.cleChat + '_assis0').setPosition(this.heros.x - 80, SOL_PROMENADE);
    c.etat = null;
    this.attendreLancer();
  }

  // --- La légende : quatre choix (et la relâcher, pour rire), chacun confirmé une fois ---
  choixLegende() {
    const G = this.G, P = this.prise, L = PECHE.legende;
    this.legendeChoisie = false; this.confirmLegende = null;
    // (v1.49) une seule confirmation à la fois, et un seul choix : sinon deux « Oui » payaient deux fois
    const confirmer = (titre, ok0) => {
      if (this.confirmLegende || this.legendeChoisie || this.relacheEnCours) return;
      const ok = () => { if (this.legendeChoisie) return; this.legendeChoisie = true; ok0(); };
      const c = this.confirmLegende = this.add.container(0, 0).setScrollFactor(0).setDepth(1550);
      c.once('destroy', () => { if (this.confirmLegende === c) this.confirmLegende = null; });
      c.add(this.add.rectangle(480, 488, 520, 92, 0x2a1a10, 0.97).setStrokeStyle(2, 0xc9a227).setInteractive());
      c.add(this.add.text(480, 458, titre, style(15, '#f3d98a', { fontStyle: 'bold' })).setOrigin(0.5));
      c.add(this.add.text(480, 478, 'Tu ne pourras plus jamais la pêcher.', style(12, '#e8dcc0', { fontStyle: 'italic' })).setOrigin(0.5));
      [['Oui', 400, () => { c.destroy(); ok(); }], ['Non', 560, () => c.destroy()]].forEach(([t, x, a]) => { const b = creerBouton(this, x, 512, 140, t, () => { Son.jouer('clic'); a(); }); b.fond.setScrollFactor(0); b.label.setScrollFactor(0); c.add([b.fond, b.label]); });
    };
    const choix = [
      [`Vendre à Barnabé · ${L.prix} p.`, () => confirmer(`Vendre Grand-Mère Écaille pour ${L.prix} p. ?`, () => {
        const r = vendrePoisson(G, P); Son.jouer('pieces'); this.gain(`+${r.gain} p.`);
        this.fermerFiche(false);
        this.barnabeDit("« Je la mettrai à la grande table du bourgmastre, il en pleurera ! Tiens, 750 pièces...\net bravo, petit. Cinquante ans, et c'est toi qui l'as eue. »");
      })],
      [`Garder (fumée : ${L.rations} rations)`, () => confirmer(`Fumer Grand-Mère Écaille (${L.rations} rations) ?`, () => {
        const r = garderPoisson(G, P); if (r.erreur) return this.alerte(r.erreur);
        this.gain(`+${r.rations} rations`); this.fermerFiche();
      })],
    ];
    if (this.chat) choix.push([`À ${nomChat(G)} · +${L.lien} ♥`, () => confirmer(`Donner Grand-Mère Écaille à ${nomChat(G)} ?`, () => { const r = donnerAuChat(G, P); this.fermerFiche(false); this.danse(P, r.gain, true); })]);
    choix.push(['La naturaliser, au mur', () => confirmer('La naturaliser et l’accrocher dans ta chambre ?', () => { naturaliserLegende(G); this.gain('Un trophée pour ta chambre !', '#f3d98a'); this.fermerFiche(); })]);
    choix.push(['La relâcher', () => { if (!this.confirmLegende && !this.legendeChoisie && !this.relacheEnCours) this.relacherLegende(); }]);
    this.boutonsFiche(choix, 324);
  }
  // On ne relâche pas une légende : ton chat la rattrape au vol (sans lui : l'épuisette de Barnabé)
  async relacherLegende() {
    this.relacheEnCours = true;
    if (this.carte) this.carte.setVisible(false);
    const X = this.heros.x, poisson = this.add.image(X + 40, SOL_PROMENADE - 90, texturePoisson(this, 'legende')).setScale(2.4).setDepth(8.65);
    Son.jouer('glisse');
    const lx = X + 170, ly = SOL_MOULIN - 60;
    await new Promise(ok => this.tweens.add({ targets: poisson, x: lx, y: ly, angle: 30, duration: 520, ease: 'Sine.easeIn', onComplete: ok }));
    let qui;
    if (this.chat) {
      const c = this.chat; c.etat = 'occupe';
      c.setTexture(this.cleChat + '_bond').setFlipX(false).setPosition(X - 40, SOL_PROMENADE - 20);
      Son.jouer('miaou');
      await new Promise(ok => this.tweens.add({ targets: c, x: lx + 30, y: ly + 20, duration: 260, ease: 'Quad.easeOut', onComplete: ok }));
      qui = { x: c.x, y: c.y - 60, texte: '« Tu es fou ? Cent ans qu’elle nargue tout le monde ! »' };
      this.dire(`Tu la lâches au-dessus de l’eau... et ${nomChat(this.G)} jaillit du ponton : il la rattrape au vol avant même qu’elle effleure la surface.`, 'Une légende ne se relâche pas : il faut choisir.');
      await new Promise(ok => this.time.delayedCall(1600, ok));
      await new Promise(ok => this.tweens.add({ targets: [c, poisson], x: X + 50, y: SOL_PROMENADE - 40, duration: 400, onComplete: ok }));
      c.setTexture(this.cleChat + '_assis0').setFlipX(false).setPosition(X - 80, SOL_PROMENADE); c.etat = null;
    } else {
      const b = imageCorps(this, lx - 60, SOL_PROMENADE, PECHEUR_COMTE, 5).setDepth(8.4);
      qui = { x: lx - 60, y: SOL_PROMENADE - 150, texte: '« Malheureux ! »' };
      this.dire('Tu la lâches au-dessus de l’eau... Barnabé, accouru sur la berge, la rattrape dans son épuisette.', 'Une légende ne se relâche pas : il faut choisir.');
      await new Promise(ok => this.time.delayedCall(1400, ok));
      b.destroy();
    }
    const bulle = this.add.text(qui.x - this.X0, qui.y, qui.texte, style(13, '#2a1608', { fontStyle: 'bold', backgroundColor: '#f4ead2', padding: { x: 6, y: 3 } })).setOrigin(0.5, 1).setScrollFactor(0).setDepth(30);
    await new Promise(ok => this.time.delayedCall(1400, ok));
    bulle.destroy(); poisson.destroy();
    this.relacheEnCours = false;
    if (this.carte) this.carte.setVisible(true);
  }
  barnabeDit(texte) {
    const b = imageCorps(this, this.X0 + 420, SOL_PROMENADE, PECHEUR_COMTE, 5).setDepth(8.4);
    const bulle = this.add.text(420, SOL_PROMENADE - 150, texte, style(13, '#2a1608', { fontStyle: 'bold', backgroundColor: '#f4ead2', padding: { x: 7, y: 4 }, align: 'center' })).setOrigin(0.5, 1).setScrollFactor(0).setDepth(30);
    this.dire('Barnabé repart avec Grand-Mère Écaille dans les bras, comme un trésor.', '');
    this.time.delayedCall(4200, () => { bulle.destroy(); this.tweens.add({ targets: b, x: b.x - 300, alpha: 0, duration: 2000, onComplete: () => b.destroy() }); this.attendreLancer(); });
  }

  rentrer() {
    if (this.fini || this.carte || enTransition(this)) return;
    if (!['pret', 'rate'].includes(this.etat)) return;
    this.fini = true;
    Son.jouer('clic');
    this.cameras.main.fadeOut(500);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      if (this.retour === 'Marche') this.scene.start('Marche');
      else this.scene.start('Nuit', { matin: this.retour === 'NuitMatin' });
    });
  }
}

// --- Le carnet de pêche : les espèces (records, moments), la légende en ombre avec l'indice, les prises étranges ---
function carnetDePeche(scene) {
  const G = scene.G || window.GAME, p = etatPeche(G);
  const c = scene.add.container(0, 0).setScrollFactor(0).setDepth(1800);
  c.add(scene.add.rectangle(480, 270, 960, 540, 0x0a0604, 0.7).setInteractive());
  c.add(scene.add.image(480, 272, panneauHD(scene, 940, 530)).setScale(2));
  const ids = Object.keys(POISSONS), vus = ids.filter(k => p.carnet[k] && p.carnet[k].n).length, prises = ids.reduce((a, k) => a + ((p.carnet[k] && p.carnet[k].n) || 0), 0);
  c.add(scene.add.text(480, 34, 'Le carnet de pêche · l’étang du Moulin', style(20, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
  c.add(scene.add.text(480, 58, `${vus + (p.legende ? 1 : 0)} / ${ids.length + 1} espèces · ${prises} prises · ${p.etranges.length} prise${p.etranges.length > 1 ? 's' : ''} étrange${p.etranges.length > 1 ? 's' : ''} · pêcheur niveau ${niveauPeche(G)}`, style(13, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5));
  const NOMS = { aube: 'aube', jour: 'jour', nuit: 'nuit' };
  ids.forEach((id, i) => {
    const x = 140 + (i % 4) * 225, y = 120 + Math.floor(i / 4) * 150, f = p.carnet[id], vu = f && f.n, P = POISSONS[id];
    const g = scene.add.graphics(); g.fillStyle(0x3b2410, 0.08).fillRoundedRect(x - 100, y - 40, 200, 136, 8).lineStyle(1, 0x8a6a3a, 0.6).strokeRoundedRect(x - 100, y - 40, 200, 136, 8); c.add(g);
    const im = scene.add.image(x, y + 6, texturePoisson(scene, id)).setScale(3.2); if (!vu) im.setTint(0x2a1a0e).setAlpha(0.6); c.add(im);
    c.add(scene.add.text(x, y + 52, vu ? P.nom : '???', style(14, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
    const quand = Object.keys(P.plages).filter(k => P.plages[k] >= 1).map(k => NOMS[k]).join(', ') || 'rare';
    c.add(scene.add.text(x, y + 72, vu ? `record ${f.record} cm · ${f.n} prise${f.n > 1 ? 's' : ''}` : `${quand} · niveau ${P.niveau}`, style(11, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5));
  });
  // la légende : une ombre et l'indice de Barnabé, tant qu'on ne l'a pas prise
  { const x = 140 + 3 * 225, y = 270, g = scene.add.graphics(); g.fillStyle(0x6a3a10, 0.1).fillRoundedRect(x - 100, y - 40, 200, 136, 8).lineStyle(2, 0xc9a227).strokeRoundedRect(x - 100, y - 40, 200, 136, 8); c.add(g);
    const im = scene.add.image(x, y + 8, texturePoisson(scene, 'legende')).setScale(2.3); if (!p.legende) im.setTint(0x1a1008).setAlpha(0.65); c.add(im);
    c.add(scene.add.text(x, y + 52, p.legende ? 'LÉGENDE · ' + LEGENDE_ETANG.nom : 'LÉGENDE · ???', style(p.legende ? 12 : 14, '#8a5a10', { fontStyle: 'bold' })).setOrigin(0.5));
    c.add(scene.add.text(x, y + 74, p.legende ? `${p.legende.taille} cm · prise le jour ${p.legende.jour}` : '« Une très vieille carpe vit sous\nla roue du moulin... » (Barnabé)', style(10, '#6b4a2a', { fontStyle: 'italic', align: 'center' })).setOrigin(0.5)); }
  c.add(scene.add.text(140, 420, 'Prises étranges', style(15, '#3b2410', { fontStyle: 'bold' })));
  Object.keys(PRISES_ETRANGES).forEach((id, i) => { const vu = p.etranges.includes(id), im = scene.add.image(120 + i * 90, 472, texturePrise(scene, id)).setScale(2.6); if (!vu) im.setTint(0x2a1a0e).setAlpha(0.55); c.add(im); });
  c.add(scene.add.text(400, 450, p.etranges.length ? Object.keys(PRISES_ETRANGES).filter(k => p.etranges.includes(k)).map(k => PRISES_ETRANGES[k].nom).join(' · ') : 'Rien d’étrange pour l’instant... L’étang garde ses secrets.', style(12, '#3b2410', { wordWrap: { width: 500 } })));
  const b = creerBouton(scene, 830, 500, 150, 'Fermer', () => { Son.jouer('page'); b.fond.destroy(); b.label.destroy(); c.destroy(); });
  b.fond.setScrollFactor(0).setDepth(1801); b.label.setScrollFactor(0).setDepth(1801.1);
  Son.jouer('page');
  return c;
}

// --- (v1.45) Le cadeau du chat : la canne de son grand-père (pour qui a déjà eu la conversation au coin du feu) ---
function cadeauCanneDuChat(scene, ensuite = null, pendantLaConversation = false) {
  const G = scene.G;
  if (!(typeof moulinFait === 'function' && moulinFait(G) && (G.moulin.conversation || pendantLaConversation)) || etatPeche(G).grandPere || (scene.fenetreMoulin && !pendantLaConversation)) return false;
  if (typeof chatParti === 'function' && chatParti(G)) return false;
  if (!pendantLaConversation) scene.fenetreMoulin = true;
  donnerCanne(G, 'grandPere');
  if (typeof Sauvegarde !== 'undefined') Sauvegarde.planifier(G, scene.lieu || 'Nuit');
  ecranNouvelObjet(scene, textureCanne(scene, 'grandPere'), { nom: 'La canne du grand-père', de: `offerte par ${nomChat(G)}`,
    texte: (pendantLaConversation ? 'Trois brins de roseau emmanchés de laiton, une plume rouge porte-bonheur.' : `« Une dernière chose. La canne de mon grand-père : il pêchait à l'étang du Moulin. Prends-la, moi, j'ai des gens pour ça. »`) + `\nElle lance un peu plus loin, et ${nomChat(G)} viendra pêcher avec toi.`, ech: 4.2, angle: -14, bouton: `Merci, ${nomChat(G)}` })
    .then(() => { if (!pendantLaConversation) scene.fenetreMoulin = null; if (ensuite) ensuite(); });
  return true;
}
