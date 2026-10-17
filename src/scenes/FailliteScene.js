// La faillite (v0.57) : quatre fins, selon ce qui t'a mené à la ruine (voir causeFaillite) :
//   - la Main Noire vient chercher son dû : tu deviens son esclave, dans la cave ;
//   - la Banque Centrale saisit tout : tu deviens le larbin des banquiers ;
//   - la famille d'un aventurier mort vient se venger : tu t'enfuis dans la nuit ;
//   - ou tu as simplement mal géré : tu retournes vivre dans la forêt de tes débuts.
// Chaque fin tient en trois ou quatre plans, sur la musique dramatique de la faillite.
class FailliteScene extends Cinematique {
  constructor() { super('Faillite'); }

  create() {
    this.fini = false; // (la scène peut être rejouée dans la même session)
    const G = this.G = window.GAME;
    this.cause = G.causeFaillite || causeFaillite(G);
    this.objets = [];
    this.cameras.main.resetFX();   // (si une faillite précédente a laissé l'écran au noir)
    const generation = this.generation = (this.generation || 0) + 1;
    this.encore = () => this.generation === generation;
    creerHalo(this);
    creerInterieurHD(this);
    creerBaluchons(this);
    this.creerBoiteTexte();
    this.boutonPasser(() => this.finir());
    ({ mainNoire: () => this.finMainNoire(), banque: () => this.finBanque(), vengeance: () => this.finVengeance(), gestion: () => this.finForet() }[this.cause.type] || (() => this.finForet()))();
  }

  // --- Les outils des plans ---
  o(obj) { this.objets.push(obj); return obj; }
  async nouveauPlan(dessiner) {
    if (!this.encore()) return;
    if (this.objets.length) {
      this.cameras.main.fadeOut(450, 0, 0, 0);
      await this.attendre(500);
      for (const ob of this.objets) { this.tweens.killTweensOf(ob); ob.destroy(); }
      this.objets = [];
    }
    if (!this.encore()) return;
    dessiner();
    this.cameras.main.fadeIn(500, 0, 0, 0);
  }
  // Le ciel, la façade du comptoir et les pavés, de jour, à l'aube ou de nuit
  decorFacade(moment = 0) {
    const sol = 362;
    this.o(this.add.image(0, 0, paysageHD(this, 960, 380, 'comte', moment)).setOrigin(0).setScale(2));
    this.facade = dessinerFacade(this, 560, sol);
    for (const ob of [this.facade.image, this.facade.enseigne, this.facade.tonneaux]) if (ob) this.o(ob);
    this.o(this.add.image(0, sol, pavesHD(this, 960, 60)).setOrigin(0).setScale(2));
    this.nuit = moment >= 0.6;
    if (this.nuit) this.o(this.add.rectangle(480, 270, 960, 540, 0x0a1030, 0.45).setDepth(2.5));
    return sol;
  }
  joueur(x, sol, echelle = 6.5) { const j = this.o(this.add.image(x, sol, textureJoueur(this, this.G, 'troisQuarts')).setOrigin(0.5, 1).setScale(echelleJoueur(echelle)).setDepth(3)); if (this.nuit) j.setTint(0xa8b0d0); return j; }
  corps(x, sol, qui, echelle = 6.2) { const c = this.o(imageCorps(this, x, sol, qui, echelle).setDepth(3)); if (this.nuit) c.setTint(0xa8b0d0); return c; }
  creerGarde(x, sol) {
    const c = this.o(this.add.container(x, sol).setDepth(3));
    const lance = this.add.graphics();
    lance.fillStyle(0x6b4423).fillRect(26, -140, 4, 140);
    lance.fillStyle(0xc0c8d0).fillTriangle(22, -140, 28, -160, 34, -140);
    c.add([lance, imageCorps(this, 0, 0, 'garde', 6)]);
    return c;
  }
  async defiler(cibles, xs, duree) {
    cibles.forEach(c => pasDeMarche(this, c.list ? c.list[1] : c, duree));
    await Promise.all(cibles.map((c, i) => this.animer({ targets: c, x: xs[i], duration: duree, ease: 'Linear' })));
  }
  // Une torche tenue haut : la flamme qui danse, et sa lumière orangée
  torche(x, y) {
    this.o(this.add.rectangle(x, y + 22, 4, 44, 0x5a3a1a).setDepth(3.2));
    const f = this.o(this.add.sprite(x, y, 'flammeBougie0').setOrigin(0.5, 1).setScale(3.4).setTint(0xffa040).setDepth(3.3));
    f.play('flammeBougie');
    this.o(lumiere(this, x, y - 14, 120, 0xff8a30, 0.55).setDepth(3.4));
  }

  // --- La Main Noire : l'esclavage ---
  async finMainNoire() {
    const G = this.G;
    let sol;
    await this.nouveauPlan(() => {
      sol = this.decorFacade(0.95);
      this.p = this.joueur(400, sol);
      this.ombre = this.o(this.add.image(1040, sol, corpsHD(this, 'silhouette')).setOrigin(0.5, 1).setScale(6.6 * echelleCorps(corpsHD(this, 'silhouette'))).setTint(0x2a1c24).setDepth(3));
      this.orcs = [0, 1].map(i => this.corps(1110 + i * 80, sol, { nom: i ? 'Krug Briseur' : 'Mog Poing-de-Fer', race: 'orc', niveau: 'veteran' }).setFlipX(true));
    });
    this.ecrire('', "Cette nuit-là, personne ne frappa à la porte. Elle s'ouvrit toute seule.");
    await this.defiler([this.ombre, ...this.orcs], [560, 650, 730], 2200);
    await this.attendreClic();
    this.ecrire('La Main Noire', '« Tu nous dois. Tu ne peux pas payer. Alors tu travailleras. La Main Noire n\'oublie jamais. »');
    if (this.orcs) { this.regarderVers(this.orcs[0], this.p); this.emotion(this.orcs[0], 'colere'); Son.jouer('voix', { personne: { nom: "Mog", race: "orc" }, ton: 'grogne' }); } this.emotion(this.p, '!'); this.geste(this.p, 'tremble');
    Son.jouer('voix', { race: 'humain', nom: 'La Main Noire', ton: 'grogne' });
    await this.attendreClic();
    this.ecrire('', 'Les deux orcs te prirent chacun par un bras.');
    Son.jouer('voix', { personne: { nom: 'toi', race: 'humain', feminin: this.G.joueur.feminin }, ton: 'peur' }); this.emotion(this.p, 'larme');
    await this.defiler(this.orcs, [450, 360], 700);
    this.p.setFlipX(false);
    await this.defiler([this.p, ...this.orcs, this.ombre], [1100, 1060, 1150, 1200], 2400);
    await this.attendreClic();
    // La cave : tu portes leurs caisses
    await this.nouveauPlan(() => {
      this.nuit = false;
      creerCaveHD(this);
      this.o(this.add.image(-960, 0, 'caveFond').setOrigin(0).setScale(2));
      this.o(this.add.rectangle(480, 270, 960, 540, 0x100608, 0.35).setDepth(2.5));
      for (const x of [170, 480, 790]) this.o(lumiere(this, x, 60, 110, 0xff4a20, 0.35));
      this.o(this.add.image(120, 372, 'caissesContrebande').setOrigin(0.5, 1).setScale(2.4).setDepth(3));
      this.ombre = this.o(this.add.image(820, 372, corpsHD(this, 'silhouette')).setOrigin(0.5, 1).setScale(6.6 * echelleCorps(corpsHD(this, 'silhouette'))).setTint(0x2a1c24).setFlipX(true).setDepth(3));
      this.p = this.joueur(200, 372);
      this.caisse = this.o(this.add.image(200, 372 - 120, 'hd_caisse').setScale(3).setDepth(3.5));
    });
    this.ecrire('', 'Nuit après nuit, tu portes leurs caisses, de la ruelle à la cave et de la cave à la ruelle.');
    for (let k = 0; k < 2; k++) {
      this.p.setFlipX(false);
      this.tweens.add({ targets: this.caisse, x: 640, duration: 1800, ease: 'Linear' });
      await this.defiler([this.p], [640], 1800);
      this.p.setFlipX(true);
      this.tweens.add({ targets: this.caisse, x: 200, duration: 1800, ease: 'Linear' });
      await this.defiler([this.p], [200], 1800);
    }
    this.ecrire('La Main Noire', '« Encore une. Ta dette, elle, ne baisse jamais. »');
    await this.attendreClic();
    // Ta nouvelle vie : des années plus tard, c'est toi qui gardes la table du fond
    await this.nouveauPlan(() => {
      this.nuit = false;
      this.o(this.add.image(-1920, 0, 'caveFond').setOrigin(0).setScale(2));
      this.o(this.add.rectangle(480, 270, 960, 540, 0x100608, 0.3).setDepth(2.5));
      creerEmblemesHD(this);
      this.o(this.add.image(520, 128, 'embleme_mainNoire').setScale(2.6));
      this.o(lumiere(this, 430, 300, 120, 0xffc070, 0.5));
      this.o(this.add.image(520, 350, corpsHD(this, 'silhouette')).setOrigin(0.5, 1).setScale(6.6 * echelleCorps(corpsHD(this, 'silhouette'))).setTint(0x3a2830));
      this.o(this.add.image(520, 392, 'tableMainNoire').setOrigin(0.5, 1).setScale(2.2).setDepth(3));
      this.p = this.joueur(250, 372, 7.5).setTint(0x8a7a90);
      this.client = this.corps(780, 372, { nom: 'Petit marchand', race: 'hobbit', niveau: 'novice' }, 5.6).setFlipX(true);
    });
    this.ecrire('', 'Des années plus tard, c\'est toi qui gardes la table du fond. Ce soir, un petit marchand tremble devant toi... comme toi, autrefois.');
    this.regarderVers(this.p, this.client); this.regarderVers(this.client, this.p); this.geste(this.client, 'tremble'); this.emotion(this.client, '!'); Son.jouer('voix', { personne: { nom: "Petit marchand", race: "hobbit" }, ton: 'peur' });
    this.tweens.add({ targets: this.client, x: 790, duration: 120, yoyo: true, repeat: -1 });
    await this.attendreClic();
    this.finir();
  }

  // --- La Banque Centrale : le larbin des banquiers ---
  async finBanque() {
    let sol;
    await this.nouveauPlan(() => {
      sol = this.decorFacade(0);
      this.p = this.joueur(320, sol);
      this.banquier = this.corps(1040, sol, 'banquier', 6).setFlipX(true);
      this.gardes = [0, 1].map(i => this.creerGarde(1110 + i * 70, sol));
      this.gardes.forEach(c => c.setScale(-1, 1));
    });
    this.ecrire('', 'Au matin, on frappa à la porte. Très fort.');
    this.emotion(this.p, '!');
    this.onomatopee(this.facade.porteX, 220, 'TOC TOC TOC !');
    this.cameras.main.shake(300, 0.006);
    await this.attendreClic();
    this.ecrire('', 'Thorgrim Coffrefort, de la Banque Centrale, était venu en personne. Avec des amis.');
    await this.defiler([this.banquier, ...this.gardes], [470, 560, 630], 2200);
    await this.attendreClic();
    this.ecrire('Le banquier', '« Par ordre de la Banque Centrale Goyenne, vos dettes s\'élèvent à... beaucoup. Tout est saisi. Et vous aussi. »');
    if (this.banquier) { this.regarderVers(this.banquier, this.p); this.regarderVers(this.p, this.banquier); this.geste(this.banquier, 'hoche'); Son.jouer('voix', { personne: { nom: "Grippesou", race: "nain" }, ton: 'neutre' }); } this.time.delayedCall(900, () => this.emotion(this.p, 'larme'));
    Son.jouer('page');
    const porte = this.facade.porteX;
    for (let i = 0; i < 2; i++) {
      const planche = this.o(this.add.rectangle(porte, 240 + i * 50, 100, 14, 0x6b4423).setAngle(i ? -12 : 12).setDepth(4).setStrokeStyle(2, 0x3b2410));
      this.onomatopee(porte + 20, 220 + i * 50, 'BAM !', '#f3d98a');
      this.cameras.main.shake(150, 0.008);
      await this.attendre(500);
    }
    await this.attendreClic();
    // La banque : tu cires les pièces pendant qu'ils dansent
    await this.nouveauPlan(() => {
      this.nuit = false;
      creerBanqueHD(this);
      this.o(this.add.image(0, 0, 'murBanque').setOrigin(0).setScale(2));
      for (const x of [90, 870]) this.o(this.add.image(x, 20, 'banniereHD').setOrigin(0.5, 0).setScale(2));
      const banquiers = [[330, 238, 7], [480, 226, 8], [630, 238, 7]].map(([x, y, e]) => this.o(imageCorps(this, x, y, 'nainBanquier', e)));
      this.o(this.add.image(480, 180, 'bureauBanque').setOrigin(0.5, 0).setScale(2));
      this.o(this.add.text(480, 242, 'BANQUE CENTRALE GOYENNE', style(17, '#4a2c06', { fontStyle: 'bold' })).setOrigin(0.5));
      banquiers.forEach((b, i) => this.tweens.add({ targets: b, y: b.y - 14, angle: i % 2 ? 6 : -6, duration: 320, yoyo: true, repeat: -1, delay: i * 110, ease: 'Sine.easeInOut' }));
      creerBoursesHD(this);
      this.o(this.add.image(560, 372, 'bourseHD4').setOrigin(0.5, 1).setScale(2.4).setDepth(3));
      this.p = this.joueur(470, 372, 7.5);
      this.tweens.add({ targets: this.p, angle: 4, duration: 220, yoyo: true, repeat: -1 });
    });
    this.ecrire('', 'Depuis, tu cires les pièces de la Banque Centrale, au pied de leur grand bureau. Au-dessus de ta tête, les banquiers dansent.');
    this.onomatopee(520, 300, 'Frotte, frotte...');
    await this.attendreClic();
    // Ta nouvelle vie : porter leurs registres à travers la Comté, sous les regards
    await this.nouveauPlan(() => {
      this.o(this.add.image(0, 0, paysageHD(this, 960, 380, 'comte', 0)).setOrigin(0).setScale(2));
      this.o(this.add.image(0, 362, pavesHD(this, 960, 60)).setOrigin(0).setScale(2));
      this.banquier = this.corps(-60, 362, 'banquier', 6);
      this.p = this.joueur(-200, 362, 7);
      this.pile = this.o(this.add.container(-200, 362 - 108).setDepth(3.5));
      [0x6a2a1a, 0x2a3a6a, 0x5a4a20, 0x3a5a2a, 0x6a2a1a, 0x4a3a5a].forEach((c, i) => this.pile.add(this.add.rectangle(Phaser.Math.Between(-3, 3), -i * 13, 46, 12, c).setStrokeStyle(2, 0x1a0e06)));
      this.badauds = [[700, 'humain'], [770, 'elfe'], [840, 'nain']].map(([x, race], i) => this.corps(x, 362, { nom: 'Badaud ' + i, race, feminin: i === 1, niveau: 'novice' }, 5.4).setFlipX(true));
    });
    this.ecrire('', `Chaque matin, tu portes leurs registres à travers la Comté, derrière le banquier. Les gens chuchotent : « C'est ${eJ(this.G) ? "l'ancienne marchande" : "l'ancien marchand"} de “${this.G.nomShop}”. »`);
    if (this.badauds) this.badauds.forEach((b, i) => this.time.delayedCall(400 + i * 300, () => this.emotion(b, i === 1 ? '…' : '?')));
    this.tweens.add({ targets: this.pile, angle: { from: -5, to: 5 }, duration: 400, yoyo: true, repeat: -1 });
    this.tweens.add({ targets: this.pile, x: 520, duration: 3600, ease: 'Linear' });
    await this.defiler([this.banquier, this.p], [640, 520], 3600);
    await this.attendreClic();
    this.finir();
  }

  // --- La vengeance de la famille ---
  async finVengeance() {
    const c = this.cause;
    const mot = (c.nom || 'Un aventurier').split(' ');
    const famille = mot.length > 1 ? mot[mot.length - 1] : mot[0];
    let sol;
    await this.nouveauPlan(() => {
      sol = this.decorFacade(0.95);
      this.p = this.joueur(560, sol);
      this.proches = [0, 1, 2].map(i => this.corps(1060 + i * 70, sol, { nom: `${['Père', 'Sœur', 'Frère'][i]} ${famille}`, race: c.race || 'humain', feminin: i === 1, niveau: 'aguerri' }, 6).setFlipX(true).setTint(0xd8b8a0));
    });
    this.ecrire('', `Cette nuit-là, des torches montèrent la rue. La famille de ${c.nom || "l'aventurier mort"} n'avait pas oublié.`);
    await this.defiler(this.proches, [700, 770, 840], 2000);
    this.proches.forEach((pp, i) => this.torche(pp.x - 26, pp.y - 120 - (i % 2) * 6));
    await this.attendreClic();
    this.ecrire(`La famille ${famille}`, `« ${c.nom || (c.feminin ? 'Elle' : 'Il')} est mort${c.feminin ? 'e' : ''} à cause de toi. Ton argent ne nous ${c.feminin ? 'la' : 'le'} rendra pas. »`);
    if (this.proches) { this.proches.forEach(q => this.regarderVers(q, this.p)); this.emotion(this.proches[0], 'colere'); this.geste(this.proches[0], 'penche'); Son.jouer('voix', { personne: { nom: "Père", race: "humain" }, ton: 'fache' }); } this.regarderVers(this.p, this.proches ? this.proches[0] : { x: 9999 }); this.geste(this.p, 'recule'); this.emotion(this.p, '!');
    Son.jouer('voix', { race: c.race || 'humain', nom: famille, ton: 'fache' });
    await this.attendreClic();
    this.ecrire('', 'Une torche vola. La vitre éclata.');
    this.onomatopee(this.facade.porteX - 80, 240, 'CRAC !', '#ffb060');
    this.cameras.main.shake(400, 0.01);
    // le feu prend à la fenêtre, puis au toit de chaume
    const feu = this.o(lumiere(this, 500, 250, 300, 0xff6a10, 0.25).setDepth(2.8));
    this.tweens.add({ targets: feu, alpha: 0.75, duration: 1500 });
    [[440, 300, 3.6], [470, 296, 4.4], [500, 302, 3.4], [430, 200, 5], [500, 170, 6], [580, 190, 5.2], [640, 215, 4.4]].forEach(([fx, fy, e], i) => this.time.delayedCall(250 * i, () => {
      const f = this.o(this.add.sprite(fx, fy, 'flammeBougie0').setOrigin(0.5, 1).setScale(0.5).setTint(i % 2 ? 0xffc040 : 0xff7020).setDepth(2.9));
      f.play({ key: 'flammeBougie', startFrame: i % 3 });
      this.tweens.add({ targets: f, scale: e, duration: 600, ease: 'Back.easeOut' });
    }));
    await this.attendreClic();
    this.ecrire('', `Tu t'es enfui${eJ(this.G)} par derrière, dans la nuit, sans te retourner. Derrière toi, le comptoir brûlait.`);
    this.p.setFlipX(true);
    await this.defiler([this.p], [-80], 1600);
    await this.attendreClic();
    // Ta nouvelle vie : loin, sous un autre nom, dans un village de montagne
    await this.nouveauPlan(() => {
      this.nuit = false;
      this.o(this.add.image(0, 0, paysageHD(this, 960, 380, 'neige', 0.2)).setOrigin(0).setScale(2));
      this.o(this.add.image(0, 362, cheminTerreHD(this, 960, 120)).setOrigin(0).setScale(2).setTint(0xd8dce8));
      creerAccessoiresFacade(this);
      this.o(this.add.image(600, 366, 'tonneauxHD').setOrigin(0.5, 1).setScale(2.4).setDepth(3));
      for (let i = 0; i < 6; i++) this.o(this.add.circle(570 + (i % 3) * 14, 300 - Math.floor(i / 3) * 10, 6, 0xc83a2a).setStrokeStyle(2, 0x5a1a10).setDepth(3.4));
      this.p = this.joueur(500, 366, 7).setTint(0x9a8a9a);
      this.passant = this.corps(1040, 366, { nom: 'Passant des cimes', race: 'nain', niveau: 'novice' }, 5.6).setFlipX(true);
    });
    this.ecrire('', 'Loin, très loin, sous un autre nom, tu vends des pommes dans un village où personne ne te connaît.');
    await this.attendreClic();
    this.ecrire('', 'Mais chaque fois qu\'un étranger s\'approche avec une torche, ton cœur s\'arrête.');
    this.emotion(this.p, '!'); this.geste(this.p, 'tremble');
    await this.defiler([this.passant], [760], 1600);
    this.torche(734, 250);
    this.tweens.add({ targets: this.p, y: 352, duration: 120, yoyo: true });
    this.onomatopee(500, 230, '!', '#ffb060');
    await this.attendreClic();
    this.finir();
  }

  // --- La forêt : on repart de rien ---
  async finForet() {
    let sol;
    await this.nouveauPlan(() => {
      sol = this.decorFacade('aube');
      this.p = this.joueur(this.facade.porteX - 40, sol);
      this.affiche = this.o(this.add.text(this.facade.porteX, 290, 'À VENDRE', style(18, '#a02020', { fontStyle: 'bold', backgroundColor: '#ead9b0', padding: { x: 6, y: 2 } })).setOrigin(0.5).setAngle(-6).setDepth(4).setAlpha(0));
    });
    this.ecrire('', 'Plus de pièces, plus de marchandises, plus de clients. Un matin, tu as fermé la porte pour la dernière fois.');
    this.emotion(this.p, 'larme', 2200); Son.jouer('voix', { personne: { nom: 'toi', race: 'humain', feminin: this.G.joueur.feminin }, ton: 'triste' });
    await this.animer({ targets: this.affiche, alpha: 1, scale: { from: 1.8, to: 1 }, duration: 300 });
    this.onomatopee(this.facade.porteX + 30, 250, 'Clac.');
    await this.attendreClic();
    // La route
    await this.nouveauPlan(() => {
      this.nuit = false;
      this.o(this.add.image(0, 0, paysageHD(this, 960, 400, 'comte', 0.3)).setOrigin(0).setScale(2));
      this.o(this.add.image(0, 360, cheminTerreHD(this, 960, 120)).setOrigin(0).setScale(2));
      this.p = this.joueur(-40, 380);
      this.sac = this.o(this.add.image(-60, 290, 'baluchon_provisions').setScale(2.2).setDepth(3.5));
    });
    this.ecrire('', 'Ton baluchon sur l\'épaule, tu as repris la route. Celle qui mène à la forêt.');
    this.tweens.add({ targets: this.sac, x: 1000, duration: 4200, ease: 'Linear' });
    await this.defiler([this.p], [1020], 4200);
    // La forêt, au crépuscule
    await this.nouveauPlan(() => {
      this.nuit = false;
      this.o(this.add.image(0, 0, paysageHD(this, 960, 400, 'foret', 0.75)).setOrigin(0).setScale(2));
      this.o(this.add.image(0, 360, cheminTerreHD(this, 960, 120)).setOrigin(0).setScale(2).setTint(0x8a7a6a));
      creerCaveHD(this);
      this.o(this.add.image(520, 382, 'feuCamp').setOrigin(0.5, 1).setScale(2.4).setDepth(3));
      for (const [dx, e] of [[-10, 3.2], [6, 3.8], [16, 2.8]]) { const f = this.o(this.add.sprite(520 + dx, 366, 'flammeBougie0').setOrigin(0.5, 1).setScale(e).setTint(0xffb060).setDepth(3.1)); f.play('flammeBougie'); }
      this.o(lumiere(this, 520, 330, 240, 0xff8a30, 0.45).setDepth(3.2));
      this.p = this.joueur(420, 380);
    });
    this.ecrire('', `Tu es retourné${eJ(this.G)} vivre dans la forêt, là où tout avait commencé. Le soir, près du feu, tu repenses au comptoir.`);
    await this.attendreClic();
    // Et l'histoire recommence peut-être : un voyageur blessé arrive jusqu'à ton feu
    this.blesse = this.corps(1040, 380, { nom: 'Voyageur blessé', race: 'humain', niveau: 'aguerri' }, 6.2).setFlipX(true);
    this.ecrire('', 'Un soir, un voyageur blessé est arrivé en titubant jusqu\'à ton feu...');
    this.regarderVers(this.p, this.blesse); this.emotion(this.blesse, '…'); this.geste(this.blesse, 'tremble'); Son.jouer('voix', { personne: { nom: "Voyageur blessé", race: "humain" }, ton: 'triste' }); this.time.delayedCall(800, () => this.emotion(this.p, '!'));
    await this.defiler([this.blesse], [640], 2200);
    await this.animer({ targets: this.blesse, angle: -80, y: 392, duration: 500, ease: 'Quad.easeIn' });
    this.cameras.main.shake(150, 0.004);
    await this.attendreClic();
    this.ecrire('', 'Tu l\'as soigné, comme autrefois. Et s\'il revenait un jour, lui aussi, pour te remercier ?');
    this.regarderVers(this.blesse, this.p); this.emotion(this.blesse, 'merci'); Son.jouer('voix', { personne: { nom: "Voyageur blessé", race: "humain" }, ton: 'merci' }); this.time.delayedCall(700, () => this.emotion(this.p, '♥'));
    await this.attendreClic();
    this.finir();
  }

  finir() {
    if (this.fini) return;
    this.fini = true;
    const G = this.G;
    this.cameras.main.resetFX();   // (audit v0.59 : « Passer » pendant un fondu laissait l'écran noir)
    this.tweens.killAll();
    this.time.removeAllEvents();
    const fins = {
      mainNoire: ['Esclave de la Main Noire', 'Ta dette envers la Main Noire est devenue ta vie.'],
      banque: ['Le larbin des banquiers', 'La Banque Centrale a tout saisi. Toi compris.'],
      vengeance: ['La vengeance', `La famille de ${this.cause.nom || "l'aventurier"} ne t'a jamais pardonné.`],
      gestion: ['Retour à la forêt', 'Plus rien à vendre, plus rien à perdre : tu repars de zéro.'],
    };
    const [titre, phrase] = fins[this.cause.type] || fins.gestion;
    this.add.rectangle(480, 270, 960, 540, 0x140c08, 0.92).setDepth(30);
    this.add.text(480, 120, 'Faillite', style(22, '#c9b48a', { fontStyle: 'italic' })).setOrigin(0.5).setDepth(31);
    this.add.text(480, 170, titre, style(48, '#d8604a', { fontStyle: 'bold' })).setOrigin(0.5).setDepth(31);
    this.add.text(480, 240, `${phrase}\nAu matin du jour ${G.jour + 1}, tes dettes avaient atteint ${-SEUIL_FAILLITE} pièces.`,
      style(18, '#f3e6c8', { align: 'center', lineSpacing: 8 })).setOrigin(0.5).setDepth(31);
    this.add.text(480, 312,
      `${G.jour} jours tenus · ${G.stats.servis ?? G.experience} aventuriers servis · réputation ${arrondi(G.reputation)}`,
      style(15, '#c9b48a')).setOrigin(0.5).setDepth(31);
    // (v0.57) Reprendre au dernier point de reprise, charger une de ses sauvegardes, ou recommencer
    const boutons = [];
    const ajouter = (y, texte, action) => { const b = creerBouton(this, 480, y, 380, texte, action); b.fond.setDepth(31); b.label.setDepth(31); boutons.push(b); return b; };
    let reprendre = null;
    const reprise = ajouter(370, 'Recherche du point de reprise...', () => reprendre && reprendre());
    reprise.setActif(false);
    ajouter(422, 'Mes sauvegardes', () => {
      this.input.enabled = false;
      ouvrirFenetreEmplacements({ peutSauver: false, surCharger: p => { this.input.enabled = true; lancerPartieChargee(this, p); }, surFermer: () => { this.input.enabled = true; } });
    });
    ajouter(474, 'Recommencer depuis le début', () => allerA(this, 'Titre'));
    Sauvegarde.lireEmplacement('reprise').then(p => {
      if (!reprise.fond.active) return;
      if (p && p.partie && !p.partie.faillite) {
        reprise.setTexte(`Reprendre au jour ${p.jour} (point de reprise)`);
        reprise.setActif(true);
        reprendre = () => lancerPartieChargee(this, p);
      } else reprise.setTexte('Pas encore de point de reprise');
    });
  }
}
