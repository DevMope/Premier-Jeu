// Le matin, en arrivant au travail : la façade du shop avec son enseigne. Ton personnage
// traverse la Comté, ouvre la porte... et la journée commence. Un clic pour passer.
class FacadeScene extends Cinematique {
  constructor() { super('Facade'); }

  init(data) {
    this.suite = data.suite || 'Comptoir';
    this.fini = false;
  }

  create() {
    const G = this.G = window.GAME;
    this.cameras.main.fadeIn(400);
    const g = this.add.graphics();
    dessinerComte(g, 0, 0, 960, 470, 0); // midi : le soleil est haut, on ouvre le comptoir
    this.add.image(0, 440, pavesHD(this, 960, 100)).setOrigin(0).setScale(2);
    // (v1.11, planches 40 v2 et 41) la boutique du paon, juste à côté : ta maison se pousse vers la gauche
    const rival = typeof rivalVisible === 'function' && rivalVisible(G) ? G.rival : null;
    const facade = dessinerFacade(this, rival ? 268 : 560, 440, G.nomShop);
    if (rival) this.dessinerVoisin(rival, 728);
    decorSaison(this, { sol: 440, arbres: rival ? [[36, 1.05]] : [[70, 1.15], [905, 1.05]], facade, bonhomme: rival ? 500 : 790, prof: 3 });   // (v0.99 : la saison)
    // (v0.99) les bruits de la saison, doucement, sous la musique : oiseaux, cigales, vent
    if (typeof saisonDe === 'function') { Son.nature(true, { saison: saisonDe(G), volume: 0.7 }); this.events.once('shutdown', () => Son.nature(false)); this.events.once('sleep', () => Son.nature(false)); }
    this.add.text(480, 34, `Jour ${G.jour} · ${G.nomShop}`, style(26, '#fff4dc', { fontStyle: 'bold', stroke: '#2a1a10', strokeThickness: 6 })).setOrigin(0.5);
    // Une petite foule attend déjà devant la fenêtre, s'il y a du monde aujourd'hui.
    const clients = G.file.filter(e => e.type === 'client').slice(0, 4);
    clients.forEach((e, i) => imageCorps(this, (rival ? 236 : 330) - i * 40, 440, e.voyageur, 5.6).setTint(0xf0dcc8));
    if (clients.length) {
      this.add.text(rival ? 196 : 250, rival ? 466 : 300, `${G.file.length} visite${G.file.length > 1 ? 's' : ''} aujourd'hui`, style(13, '#fff4dc', { fontStyle: 'italic', stroke: '#2a1a10', strokeThickness: 4 })).setOrigin(0.5).setDepth(rival ? 9 : 0);
    }
    this.joueur = this.add.image(-40, 440, textureJoueur(this, G)).setOrigin(0.5, 1).setScale(echelleJoueur(7));
    this.indicePasser = this.add.text(940, 520, '▶ clique pour passer', style(12, '#fff4dc', { fontStyle: 'italic', stroke: '#2a1a10', strokeThickness: 3 })).setOrigin(1, 0.5);
    this.input.once('pointerdown', () => { if (this.indicePasser.visible) this.entrer(); });
    this.facadeVue = facade;
    this.derouler(facade);
  }

  // (v1.11) La maison d'à côté : ouverte (le paon à sa porte les grands jours), à vendre, ou rachetée (en travaux)
  dessinerVoisin(r, cx) {
    const G = this.G, sol = 440;
    const fort = r.etat === 'ouvert' && r.pression >= RIVAL.pression.max;
    const nom = r.etat === 'orphelinat' ? "L'orphelinat" : r.etat === 'bar' ? 'Le petit bar' : RIVAL.boutique;
    const f = this.voisin = dessinerFacadeRival(this, cx, sol, fort ? 2 : 1, nom, r.etat === 'orphelinat' ? ORPHELINAT.facade : null);
    if (r.etat === 'orphelinat') return this.dessinerOrphelinat(r, f, sol);
    if (r.etat === 'ouvert') {
      const ouverture = r.ouvertureJour === G.jour, pavane = r.pavaneJour === G.jour;
      if (ouverture) {
        // la banderole de la grande ouverture entre ses colonnes, des ballons qui dansent
        const g = this.add.graphics().setDepth(5);
        g.fillStyle(0x7a1a14).fillRect(cx - 88, 268, 176, 26).fillStyle(0xc9a227).fillRect(cx - 88, 268, 176, 3).fillRect(cx - 88, 291, 176, 3);
        g.fillStyle(0x7a1a14).fillTriangle(cx - 88, 268, cx - 88, 294, cx - 100, 281).fillTriangle(cx + 88, 268, cx + 88, 294, cx + 100, 281);
        this.add.text(cx, 281, 'GRANDE OUVERTURE', style(13, '#ffe9a8', { fontStyle: 'bold' })).setOrigin(0.5).setDepth(6);
        for (const [dx, c] of [[-128, 0xe8402a], [132, 0x3a7ad8], [-88, 0xe8c040], [90, 0x5ab04a]]) { const b = this.add.circle(cx + dx, 300, 9, c).setDepth(5); this.add.line(0, 0, cx + dx, 309, cx + dx, 330, 0x3a2a1a).setOrigin(0).setDepth(4.9); this.tweens.add({ targets: b, y: 296, duration: 900 + Math.abs(dx) * 2, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }); }
        for (const [x, qui, flip] of [[cx - 128, { race: 'nain', nom: 'Badaud' }, false], [cx - 78, { race: 'hobbit', nom: 'Badaude', feminin: true }, true]]) imageCorps(this, x, sol + 6, qui, 5.2).setFlipX(flip).setDepth(8);
      }
      if (ouverture || pavane) {
        const lu = imageCorps(this, f.porteX, sol, 'rivalA', 6.2, 'accueil').setFlipX(true).setDepth(8);
        this.tweens.add({ targets: lu, y: sol - 3, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.bulleVoisin(cx, 150, ouverture ? "« Approchez, approchez ! Fournisseur agréé par le Conseil ! Dix pour cent de moins qu'à côté ! »" : auHasard(["« Encore un mois pour moi ! Vous avez vu le crieur ? »", "« Le Conseil m'a reçu à sa table, figurez-vous ! »"]), 300, 20);
      }
      return;
    }
    if (r.etat === 'aVendre') {
      this.add.rectangle(cx, 352, 200, 176, 0x0a0a1a, 0.35).setDepth(5);   // (les vitrines éteintes)
      const pa = this.add.container(cx, 330).setDepth(7).setAngle(-6);
      pa.add(this.add.rectangle(0, 0, 130, 46, 0xe8d8b0).setStrokeStyle(3, 0x5a3a1a)); pa.add(this.add.text(0, -6, 'À VENDRE', style(19, '#8a1a14', { fontStyle: 'bold' })).setOrigin(0.5)); pa.add(this.add.text(0, 14, 'chez le notaire du Conseil', style(9, '#3b2410', { fontStyle: 'italic' })).setOrigin(0.5));
      this.tweens.add({ targets: pa, angle: -3, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      if (r.aVendreDepuis === G.jour) {
        // le jour de la fermeture : il plie bagage, sa malle à côté de lui
        const lu = imageCorps(this, cx - 180, sol + 6, 'rivalA', 6).setDepth(8);
        this.add.rectangle(cx - 222, sol + 4, 40, 26, 0x6a3a1a).setOrigin(0.5, 1).setStrokeStyle(2, 0x2a1a0a).setDepth(8);
        this.add.rectangle(cx - 222, sol - 16, 40, 4, 0xc9a227).setDepth(8.1);
        this.bulleVoisin(cx - 168, 200, REPLIQUES_RIVAL.depart, 260, -10);
        this.time.delayedCall(2600, () => { if (lu.active) { pasDeMarche(this, lu, 2600); this.tweens.add({ targets: lu, x: 1040, duration: 2600, ease: 'Sine.easeIn' }); } });
      }
      return;
    }
    // racheté : la boutique est en travaux (son nouveau visage attend sa planche)
    const pa = this.add.container(cx, 330).setDepth(7).setAngle(-4);
    pa.add(this.add.rectangle(0, 0, 150, 46, 0xd8b878).setStrokeStyle(3, 0x5a3a1a));
    pa.add(this.add.text(0, -7, 'TRAVAUX', style(17, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
    pa.add(this.add.text(0, 13, r.etat === 'orphelinat' ? "bientôt : l'orphelinat" : 'bientôt : le petit bar', style(10, '#3b2410', { fontStyle: 'italic' })).setOrigin(0.5));
  }

  // (v1.12, planche 42) L'orphelinat : du linge qui sèche, un soleil et une marelle à la craie, les enfants devant
  dessinerOrphelinat(r, f, sol) {
    const G = this.G, g = this.add.graphics().setDepth(5);
    g.lineStyle(2, 0x3a2a1a).lineBetween(f.gauche + 108, f.haut + 122, f.gauche + 292, f.haut + 118);
    const linge = [[0xe86060, 14, 16], [0x6a9ad8, 10, 20], [0xf0e0a0, 16, 12], [0x5ab06a, 12, 18], [0xf0a0c0, 10, 14]].map(([c, l, h], i) => {
      const x = f.gauche + 124 + i * 36, y = f.haut + 121 - i * 0.8;
      const p = this.add.container(x, y).setDepth(5.1);
      p.add(this.add.rectangle(0, 0, l, h, c).setOrigin(0)); p.add(this.add.rectangle(2, -2, 2, 3, 0x2a1a10).setOrigin(0)); p.add(this.add.rectangle(l - 4, -2, 2, 3, 0x2a1a10).setOrigin(0));
      this.tweens.add({ targets: p, angle: 4, duration: 1100 + i * 170, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: i * 120 });   // (le vent dans le linge)
      return p;
    });
    g.fillStyle(0xfff0a0, 0.9).fillCircle(f.gauche + 190, f.haut + 300, 7); g.lineStyle(2, 0xfff0a0, 0.9);
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; g.lineBetween(f.gauche + 190 + Math.cos(a) * 10, f.haut + 300 + Math.sin(a) * 10, f.gauche + 190 + Math.cos(a) * 15, f.haut + 300 + Math.sin(a) * 15); }
    g.fillStyle(0xf0e0e0, 0.9).fillRect(f.gauche + 208, f.haut + 292, 4, 4).fillRect(f.gauche + 216, f.haut + 296, 4, 4).fillRect(f.gauche + 224, f.haut + 300, 4, 4);
    // les enfants : un qui joue au cerceau, deux qui regardent (et qui bougent un peu)
    const enfants = enfantsOrphelinat(G), enfant = (x, nom, feminin, flip) => {
      const e = imageCorps(this, x, sol + 6, { race: 'hobbit', nom, feminin, niveau: 'novice' }, 4.6).setFlipX(flip).setDepth(8);
      this.tweens.add({ targets: e, y: sol + 3, duration: 600 + Math.random() * 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: Math.random() * 600 });
      return e;
    };
    enfant(f.porteX - 70, enfants[0], false, false); enfant(f.porteX + 60, enfants[1], true, true); enfant(f.porteX + 120, enfants[2], false, true);
    const cerceau = this.add.circle(f.porteX - 20, sol - 12, 12).setStrokeStyle(3, 0x8a6a2a).setDepth(8.1);
    this.tweens.add({ targets: cerceau, x: f.porteX + 30, angle: 360, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    // le premier matin : ils te remercient
    if (r.racheteLe === G.jour - 1) this.bulleVoisin(f.porteX + 20, 150, "« C'est toi, le patron du comptoir ? Merci pour la maison ! On peut t'aider ? »", 260, 20);
    else if (G.orphelinat && G.orphelinat.chantier) this.bulleVoisin(f.porteX + 20, 150, '« Cette nuit, les ouvriers viennent bâtir ! »', 230, 20);
  }

  // une bulle de parole au-dessus du voisin (coin arrondi, petite pointe vers lui)
  bulleVoisin(x, y, texte, l = 230, pointe = 0) {
    const t = this.add.text(0, 0, texte, style(13, '#2a1a0c', { fontStyle: 'bold', wordWrap: { width: l - 20 }, align: 'center' })).setOrigin(0.5);
    const h = t.height + 18, g = this.add.graphics();
    g.fillStyle(0x2a1a10).fillRoundedRect(-l / 2 - 2, -h / 2 - 2, l + 4, h + 4, 12).fillStyle(0xfff8e8).fillRoundedRect(-l / 2, -h / 2, l, h, 11);
    g.fillStyle(0x2a1a10).fillTriangle(pointe - 10, h / 2, pointe + 10, h / 2, pointe, h / 2 + 16).fillStyle(0xfff8e8).fillTriangle(pointe - 7, h / 2 - 1, pointe + 7, h / 2 - 1, pointe, h / 2 + 11);
    const c = this.add.container(x, y, [g, t]).setDepth(9).setScale(0);
    this.tweens.add({ targets: c, scale: 1, duration: 260, delay: 600, ease: 'Back.easeOut' });
    return c;
  }

  async derouler(facade) {
    await this.marcher(this.joueur, facade.porteX, 3);
    if (this.fini) return;
    this.onomatopee(facade.porteX, 330, 'Clic-clac !');
    await this.animer({ targets: this.joueur, alpha: 0, duration: 400 });
    if (this.fini) return;
    this.indicePasser.setVisible(false);
    await this.attendreSuite('▶ Clique pour ouvrir le comptoir');
    this.entrer();
  }

  entrer() {
    if (this.fini) return;
    this.fini = true;
    // (v0.57) Un cercle qui se referme sur la porte, comme dans les vieux films, puis le comptoir
    const cx = this.facadeVue ? this.facadeVue.porteX : 480, cy = 380;
    // (un anneau noir très épais autour d'un cercle qui rétrécit)
    const anneau = this.add.graphics().setDepth(50);
    const cercle = { r: 760 };
    const dessiner = () => { anneau.clear(); anneau.lineStyle(2000, 0x000000, 1).strokeCircle(cx, cy, Math.max(0, cercle.r) + 1000); };
    dessiner();
    Son.jouer('porte');
    this.tweens.add({ targets: cercle, r: 0, duration: 800, ease: 'Sine.easeIn', onUpdate: dessiner, onComplete: () => {
      this.add.rectangle(480, 270, 960, 540, 0x000000).setDepth(51);
      this.time.delayedCall(150, () => this.scene.start(this.suite, {}));
    } });
  }
}
