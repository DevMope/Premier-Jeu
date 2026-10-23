// (v1.56, planche 64 v5 validée) La marche d'essai : dans la rue, devant les voisins, ta maison déplie ses pattes, se
// lève, fait quelques pas (en diagonale, comme un vrai animal : devant-gauche et derrière-droite ensemble, puis l'inverse),
// la fumée filant derrière elle, puis se rassoit. Le chat, sur le faîte, reste un chat ordinaire.
class EssaiScene extends Cinematique {
  constructor() { super('Essai'); }

  init(data) { this.retour = (data && data.retour) || 'Rue'; this.fini = false; }

  create() {
    const G = this.G = window.GAME, sol = this.sol = 470;
    this.cameras.main.fadeIn(400);
    // (la caméra recule un peu : debout, la maison est haute ; l'interface a sa propre caméra, qui ne recule pas)
    for (const x of [-960, 0, 960]) { dessinerComte(this.add.graphics(), x, -160, 960, sol + 160, 0); for (const y of [sol, sol + 70, sol + 140, sol + 210]) this.add.image(x, y, pavesHD(this, 960, 70)).setOrigin(0).setScale(2); }
    // (v1.57) en tenant compte du zoom de l'écran (sinon, en 1080p ou sur iPad, la vue reculait deux fois trop)
    const Z = this.cameras.main.zoom;
    this.cameras.main.setZoom(0.75 * Z).setScroll(-160, -180);   // (la caméra zoome depuis son coin en haut à gauche)
    const sorte = this.sorte = etatPattes(G).sorte || 'chene';
    // la maison assise : sa façade, ses pattes repliées au coin des murs
    this.etat = { x: 330, haut: sol };
    const avant = new Set(this.children.list);
    this.facade = dessinerFacade(this, this.etat.x, sol, G.nomShop, undefined, { fumee: false, etage: false });
    this.facade.tonneaux.setVisible(false);
    this.maison = this.children.list.filter(o => !avant.has(o)).map(o => ({ o, dx: o.x - this.etat.x, dy: o.y - sol }));
    for (const m of this.maison) m.o.setDepth(5 + (m.o.depth || 0) * 0.01);
    this.repliees = pattesRepliees(this, this.facade, { sorte, sol, prof: 5.001 });
    const [g0, d0] = bordsDuMur(this, this.facade.image); this.bords = [g0 + 4 - this.etat.x, d0 - 4 - this.etat.x];   // (les coins du mur, par rapport au centre)
    // le dessous (la motte, les racines) et les attaches, cachés tant qu'elle est assise
    this.dessous = this.add.image(0, 0, dessousMaisonHD(this)).setOrigin(0.5, 0).setScale(2).setDepth(4.2).setVisible(false);
    this.attaches = this.add.image(0, 0, attachesMaisonHD(this, sorte)).setOrigin(0.5, 0).setScale(2).setDepth(4.8).setVisible(false);
    // les quatre pattes debout (celles de derrière plus sombres, décalées) : [décalage, devant ?, recul]
    this.pattes = [[-50, false, 0], [170, false, 11], [-110, true, 0], [110, true, 0]].map(([dx, devant, recul]) => {
      const p = this.add.image(0, sol, patteMaisonHD(this, 'debout', sorte, recul)).setOrigin(0.5, 1).setScale(devant ? 1.75 : 1.68).setDepth(devant ? 4.6 : 4.1).setVisible(false);
      if (!devant) p.setTint(0x7a6a5e);
      return { p, dx, devant, recul, leve: false };
    });
    // le chat, assis sur le faîte (un chat ordinaire : les voisins regardent)
    this.chat = null;
    if (chatAdopte(G)) this.chat = { o: this.add.image(0, 0, creerChatHD(this, lookChat(G)) + '_assis0').setOrigin(0.5, 1).setScale(2.4).setDepth(5.9), dx: -36, dy: -264 };
    // les voisins qui regardent
    const voisins = [['Rosalie', 'humain', true, 790], ['Garrick', 'mentor', false, 865], ['Barnabé', 'hobbit', false, 925]];
    this.voisins = voisins.map(([nom, race, fe, x]) => imageCorps(this, x, sol + 40, race === 'mentor' ? 'mentor' : { race, nom, feminin: fe, niveau: 'novice' }, 6.4).setFlipX(true).setDepth(7));
    textureJoueur(this, G);
    this.joueur = this.add.image(724, sol + 44, textureJoueur(this, G)).setOrigin(0.5, 1).setScale(echelleJoueur(6.6)).setFlipX(true).setDepth(7);
    this.placer();
    // l'interface : une ligne de récit en haut, « Passer », le clic pour continuer (caméra à part, sans recul)
    const ui = [];
    this.uiCam = this.cameras.add(0, 0, 960 * Z, 540 * Z).setOrigin(0, 0).setZoom(Z);   // (v1.57 : au zoom de l'écran)
    ui.push(this.add.rectangle(480, 62, 940, 40, 0x1a120a, 0.88).setStrokeStyle(2, 0xd8b048));
    this.ligne = this.add.text(30, 62, '', style(15, '#f6ead0', { fontStyle: 'italic', wordWrap: { width: 760 } })).setOrigin(0, 0.5); ui.push(this.ligne);
    this.indiceClic = this.add.text(930, 62, '▶ clique', style(13, '#f3d98a', { fontStyle: 'bold italic' })).setOrigin(1, 0.5).setVisible(false); ui.push(this.indiceClic);
    this.tweens.add({ targets: this.indiceClic, alpha: 0.4, duration: 600, yoyo: true, repeat: -1 });
    ui.push(this.boutonPasser(() => this.finir()));
    this.cameras.main.ignore(ui);
    this.uiCam.ignore(this.children.list.filter(o => !ui.includes(o)));
    this.sys.events.on('addedtoscene', o => this.uiCam && this.uiCam.ignore(o));   // (ce qui naît ensuite, fumée, poussière, bulles : seulement dans le monde)
    // la fumée de la cheminée, qui suit la maison et file à l'opposé de sa marche
    this.vent = 40;
    this.time.addEvent({ delay: 380, loop: true, callback: () => {
      const im = this.facade.image; if (!im.active) return;
      const [cx, cy, cl] = chemineeFacade(niveauFacade(G)), g = im.x - im.displayWidth / 2, h = im.y - im.displayHeight;
      bouffeeFumee(this, g + (cx + cl / 2) * 2, h + cy * 2, { echelle: 2.2, monte: 110, vent: this.vent, duree: 3000, alpha: 0.9, profondeur: 5.95 });
    } });
    this.derouler();
  }

  // Tout ce qui tient à la maison suit sa position (x, et la hauteur de son plancher)
  placer() {
    const { x, haut } = this.etat, lev = this.sol - haut;
    for (const m of this.maison) m.o.setPosition(x + m.dx, haut + m.dy);
    this.repliees.forEach((p, i) => p.setPosition(x + this.bords[i], this.sol + 4));
    this.dessous.setPosition(x, haut - 6); this.attaches.setPosition(x, haut - 4);
    for (const l of this.pattes) {
      l.p.x = x + l.dx;
      // la patte s'allonge avec la maison qui monte (ancrée au sol), et se lève d'un cran quand elle marche
      l.p.scaleY = (l.devant ? 1.75 : 1.68) * Math.max(0.15, lev / 142);
      l.p.y = this.sol - (l.devant ? 0 : 6) - (l.leve ? (l.devant ? 14 : 24) : 0);
    }
    if (this.chat) this.chat.o.setPosition(x + this.chat.dx, haut + this.chat.dy);
  }

  ecrire(titre, texte) { this.ligne.setText(texte); }
  attendreClic() {
    return new Promise(ok => this.time.delayedCall(250, () => { this.indiceClic.setVisible(true); this.input.once('pointerdown', () => { this.indiceClic.setVisible(false); ok(); }); }));
  }

  animerEtat(cible, duree, ease = 'Sine.easeInOut') {
    return new Promise(ok => this.tweens.add({ targets: this.etat, ...cible, duration: duree, ease, onUpdate: () => this.placer(), onComplete: ok }));
  }

  async derouler() {
    const G = this.G;
    this.ecrire('La marche d\'essai', `Les voisins se sont arrêtés. ${G.nomShop} frémit, ses pattes se déplient...`);
    await this.attendreClic(); if (this.fini) return;
    // elle se lève : les pattes repliées disparaissent, les vraies poussent sous la maison
    this.repliees.forEach(p => p.setVisible(false));
    for (const o of [this.dessous, this.attaches, ...this.pattes.map(l => l.p)]) o.setVisible(true);
    this.cameras.main.shake(500, 0.004);
    Son.jouer('porte');
    await this.animerEtat({ haut: this.sol - 142 }, 1600, 'Back.easeOut'); if (this.fini) return;
    this.voisins.forEach(v => this.emotion(v, '!', 1400));
    this.ecrire('La marche d\'essai', '« Elle se lève ! » Rosalie lâche son panier. Garrick ne dit rien, mais il sourit dans sa barbe.');
    // quelques pas, en diagonale : devant-gauche + derrière-droite, puis l'inverse
    this.vent = -90;
    for (let k = 0; k < 6 && !this.fini; k++) {
      this.pattes.forEach((l, i) => { l.leve = (k % 2 === 0) === (i === 1 || i === 2); l.p.setTexture(patteMaisonHD(this, l.leve ? 'pas' : 'debout', this.sorte, l.recul)); });
      await this.animerEtat({ x: this.etat.x + 28, haut: this.sol - 148 }, 260);
      this.pattes.forEach(l => { l.leve = false; l.p.setTexture(patteMaisonHD(this, 'debout', this.sorte, l.recul)); });
      await this.animerEtat({ haut: this.sol - 142 }, 200);
      const nu = this.add.circle(this.etat.x - 140 + Math.random() * 30, this.sol + 4, 10, 0xd8c098, 0.5).setDepth(4.9);
      this.tweens.add({ targets: nu, scale: 2.2, alpha: 0, x: nu.x - 30, duration: 1200, onComplete: () => nu.destroy() });
    }
    if (this.fini) return;
    this.vent = 40;
    const e = etatPattes(G);
    this.ecrire('La marche d\'essai', `Elle s'arrête, s'ébroue, et se rassoit doucement. Dans le filet, il reste ${heuresDeBois(G)} h de marche (${e.bois.length} place${e.bois.length > 1 ? 's' : ''}).`);
    await this.animerEtat({ haut: this.sol }, 1400, 'Sine.easeIn'); if (this.fini) return;
    this.cameras.main.shake(300, 0.006);
    for (const o of [this.dessous, this.attaches, ...this.pattes.map(l => l.p)]) o.setVisible(false);
    this.repliees.forEach(p => p.setVisible(true)); this.placer();
    await this.attendreClic();
    this.finir();
  }

  finir() {
    if (this.fini) return;
    this.fini = true;
    Sauvegarde.maintenant(this.G, 'Rue');
    this.cameras.main.fadeOut(400);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(this.retour, { depuis: 'essai' }));
  }
}
