// (v1.16, planche 43 v5 validée) La soirée jouée au petit bar, façon Dave the Diver : de 19 h à minuit, les clients
// entrent, s'assoient et commandent (une chope, un plat, ou les deux) ; leur patience baisse. Le barman tire les chopes
// sur le comptoir, le cuisinier pose les plats sur la passe-plat ; toi, le plateau à la main, tu prends (clic sur le
// comptoir ou la passe-plat) et tu sers (clic sur le client). Les serveurs portent aussi, plus lentement. Les petits
// imprévus : une bagarre à calmer, un filou à rattraper, une rumeur à écouter (le videur, s'il est là, s'en charge
// selon son niveau). À minuit, le bilan.

// La lancer depuis le soir, chez toi
function lancerSoireeBar(scene) {
  if (soireeDecidee(window.GAME)) return;
  scene.scene.pause();
  scene.scene.launch('Bar', { retour: scene.scene.key });
}

const SOIREE_BAR = {
  duree: 180,             // secondes réelles pour 19 h → minuit (5 heures : 1 minute de jeu = 0,6 s)
  arrivees: [0.02, 0.7],  // les clients arrivent entre ces deux moments de la soirée
  patience: { chope: 38, plat: 52 },   // secondes, selon ce qu'ils attendent (la plus longue compte)
  attenteDehors: 30,      // à la porte, quand toutes les chaises sont prises
  prepa: { chope: 3.2, plat: 6.5 },    // le barman (chopes), le cuisinier (plats)
  places: { chope: 4, plat: 3 },       // sur le comptoir, sur la passe-plat
  plateau: 3,             // ce que tu portes à la fois
  pas: 340,               // ta vitesse (pixels par seconde)
  pasServeur: 210,
  quartDHeure: 2.5,       // une action d'un quart d'heure (calmer, rattraper, écouter) : tu ne fais rien d'autre
  delaiImprevu: 12,       // le temps pour réagir à une bagarre, un filou, une rumeur
  pourboire: [1, 4],
};
// Les places : trois tables, deux chaises chacune (x de la chaise, sol, dossier : -1 à gauche, 1 à droite)
const PLACES_BAR = [
  { table: 0, x: 262, sol: 384, dos: -1 }, { table: 0, x: 398, sol: 384, dos: 1 },
  { table: 1, x: 88, sol: 486, dos: -1 }, { table: 1, x: 232, sol: 486, dos: 1 },
  { table: 2, x: 362, sol: 500, dos: -1 }, { table: 2, x: 502, sol: 500, dos: 1 },
];
const TABLES_BAR = [{ x: 330, sol: 384, d: 3.3 }, { x: 160, sol: 486, d: 3.8 }, { x: 432, sol: 500, d: 3.8 }];
const PEUPLES_DU_BAR = ['humain', 'humain', 'hobbit', 'nain', 'elfe', 'magicienne', 'hobbit', 'nain'];

class BarScene extends Phaser.Scene {
  constructor() { super('Bar'); }

  init(data) { this.retour = data.retour || 'Nuit'; }

  create() {
    const G = this.G = window.GAME, b = this.b = barDe(G);
    this.st = { murs: styleDuBar(G, 'murs'), sol: styleDuBar(G, 'sol'), tables: styleDuBar(G, 'tables'), chaises: styleDuBar(G, 'chaises'), comptoir: styleDuBar(G, 'comptoir'), lumieres: styleDuBar(G, 'lumieres') };
    salleBar(this, this.st.murs, { sol: this.st.sol, comptoir: this.st.comptoir, lumieres: this.st.lumieres });
    this.plats = barA(G, 'cuisine') && aEmbauche(G, 'cuisinier');
    if (!this.plats && this.cuisinierBar) this.cuisinierBar.setVisible(false);
    for (const t of TABLES_BAR) tableBar(this, t.x, t.sol, this.st.tables, t.d);
    this.places = PLACES_BAR.map(p => {
      const d = p.sol < 450 ? 3.35 : 3.85, ombre = imageCorps(this, p.x, p.sol, { race: 'humain', nom: 'Chaise' }, p.sol < 450 ? 6 : 6.3, 'assis');
      const assise = Math.round(p.sol - ombre.displayHeight * 0.18); ombre.destroy();
      chaiseBar(this, p.x + p.dos * 6, p.sol, assise, p.dos, this.st.chaises, d - 0.05);
      return { ...p, d, client: null };
    });
    // la scène : la bande et le conteur, sur une petite estrade au fond à gauche
    this.dessinerEstrade();
    // les préparations : les chopes sur le comptoir, les plats sur la passe-plat
    this.pret = { chope: [], plat: [] };
    this.enPrepa = { chope: 0, plat: 0 };
    this.jaugeBarman = this.jauge(710, 206, 60); this.jaugeCuisine = this.plats ? this.jauge(115, 132, 60) : null;
    // toi, le plateau à la main ; les serveurs
    this.joueur = this.add.image(640, 506, textureJoueurPose(this, G, 'troisQuarts', 'plateau')).setOrigin(0.5, 1).setScale(echelleJoueur(6.4)).setDepth(4.5);
    this.plateau = [];
    this.plateauG = this.add.container(0, 0).setDepth(4.6);
    this.occupe = false;
    this.serveurs = ['serveur', 'serveuse'].filter(q => aEmbauche(G, q)).map((q, i) => {
      const im = imageCorps(this, 560 - i * 60, 520, { ...BAR.equipe[q].quoi, niveau: 'aguerri' }, 5.6).setDepth(4.4);
      return { qui: q, im, porte: null, libre: true, active: q === 'serveur' || null };
    });
    // la soirée
    this.minutes = 0; this.fini = false;
    this.attendus = clientsDuSoir(G);
    this.stats = { servis: 0, attendus: this.attendus, pourboires: 0, recette: 0, bagarresRatees: 0, filousRates: 0, rumeur: null, partis: 0 };
    const bande = b.bande && BAR.bandes[b.bande];
    this.prix = { chope: BAR.prix.chope * (bande && bande.chopes || 1) * (bande && bande.prix || 1), plat: BAR.prix.plat * (bande && bande.prix || 1) };
    this.arrivees = Array.from({ length: this.attendus }, () => Phaser.Math.FloatBetween(...SOIREE_BAR.arrivees) * SOIREE_BAR.duree).sort((a, c) => a - c);
    this.dehors = [];
    this.clients = [];
    this.preparerImprevus();
    this.creerBandeau();
    // les clics : le comptoir, la passe-plat, les clients
    this.zone(640, 300, 300, 70, () => this.allerPrendre('chope'));
    if (this.plats) this.zone(115, 200, 180, 120, () => this.allerPrendre('plat'));
    this.aide = this.add.text(480, 528, 'Clic sur le comptoir ou la passe-plat : prendre · clic sur un client : servir', style(12, '#fff4dc', { fontStyle: 'italic', stroke: '#2a1a10', strokeThickness: 4 })).setOrigin(0.5, 1).setDepth(95);
    this.t0 = this.time.now;
    this.cameras.main.fadeIn(400);
    Son.jouer('porte');
  }

  // --- Le décor vivant ---

  dessinerEstrade() {
    const G = this.G, b = this.b;
    if (!barA(G, 'scene')) return;
    const g = this.add.graphics().setDepth(3.2);
    g.fillStyle(0x3a2010).fillRect(18, 352, 190, 18).fillStyle(0x6a4424).fillRect(14, 346, 198, 8);
    const bande = b.bande && BAR.bandes[b.bande], ct = conteurDuJour(G);
    const MUSICIENS = { gobelets: [['hobbit', 0x3a7a3a], ['gobelin', 0x3a7a3a], ['hobbit', 0x3a7a3a]], cornes: [['orc', 0x6a2a14], ['troll', 0x6a2a14], ['orc', 0x6a2a14]], ombres: [['elfe', 0x2a1a3a], ['vampire', 0x2a1a3a], ['elfe', 0x2a1a3a]] };
    if (bande) {
      MUSICIENS[b.bande].forEach(([race, habit], i) => {
        const im = imageCorps(this, 46 + i * 62, 350, { race, nom: 'Musicien' + i, costume: b.bande === 'ombres' ? 'passeur' : b.bande === 'cornes' ? 'pirate' : 'colporteur', habit, niveau: 'aguerri' }, race === 'troll' ? 4.2 : 4.6).setDepth(3.25);
        this.tweens.add({ targets: im, y: 347, duration: 380 + i * 50, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: i * 120 });   // ils jouent en rythme
      });
      this.time.addEvent({ delay: 700, loop: true, callback: () => { if (this.fini) return; const n = this.add.text(Phaser.Math.Between(30, 200), 300, Math.random() < 0.5 ? '♪' : '♫', style(18, '#ffe9a8', { stroke: '#2a1a10', strokeThickness: 3, brut: true })).setDepth(3.3); this.tweens.add({ targets: n, y: 250, alpha: 0, duration: 1600, onComplete: () => n.destroy() }); } });
    }
    if (ct) {
      // le conteur : il raconte une histoire vers 21 h (sur l'estrade, devant la bande)
      this.conteur = imageCorps(this, 196, 352, { race: 'humain', nom: ct.nom, costume: 'mentor', habit: 0x4a3a5a, cheveux: 0xe0e0e0, barbe: 'pleine', niveau: 'veteran', vieux: true }, 4.8).setDepth(3.26).setFlipX(true).setAlpha(0);
    }
  }

  jauge(x, y, l) {
    const g = this.add.graphics().setDepth(60);
    return { maj: p => { g.clear(); if (p <= 0) return; g.fillStyle(0x1a0e08).fillRoundedRect(x - l / 2 - 2, y - 5, l + 4, 10, 4).fillStyle(0x4a3a2a).fillRoundedRect(x - l / 2, y - 3, l, 6, 3).fillStyle(0x4aa83a).fillRoundedRect(x - l / 2, y - 3, Math.max(3, l * p), 6, 3); } };
  }

  creerBandeau() {
    const g = this.add.graphics().setDepth(90);
    g.fillStyle(0x1e130a, 0.92).fillRoundedRect(150, 40, 660, 34, 8).lineStyle(2, 0xc9a227).strokeRoundedRect(150, 40, 660, 34, 8);
    this.txtHeure = this.add.text(170, 57, '', style(15, '#fff4dc', { fontStyle: 'bold', brut: true })).setOrigin(0, 0.5).setDepth(91);
    this.barreHeure = this.add.graphics().setDepth(91);
    this.txtCaisse = this.add.text(430, 57, '', style(15, '#f3d98a', { fontStyle: 'bold', brut: true })).setOrigin(0, 0.5).setDepth(91);
    this.txtServis = this.add.text(580, 57, '', style(14, '#fff4dc', { fontStyle: 'bold', brut: true })).setOrigin(0, 0.5).setDepth(91);
    this.add.text(796, 57, `Renommée ★ ${Math.round(this.b.renommee * 10) / 10} / 5`, style(13, '#f3d98a', { fontStyle: 'bold', brut: true })).setOrigin(1, 0.5).setDepth(91);
  }
  majBandeau() {
    const h = 19 + this.minutes / 60, hh = Math.floor(h), mm = Math.floor((h - hh) * 60);
    this.txtHeure.setText(`🕯 ${hh === 24 ? 'minuit' : `${hh} h ${String(mm).padStart(2, '0')}`}`);
    this.barreHeure.clear().fillStyle(0x4a3a2a).fillRect(262, 53, 140, 8).fillStyle(0xe8a830).fillRect(262, 53, 140 * Math.min(1, this.minutes / 300), 8);
    this.txtCaisse.setText(`Caisse : ${Math.round(this.stats.recette + this.stats.pourboires)} p.`);
    this.txtServis.setText(`${this.stats.servis} / ${this.attendus} servis`);
  }

  zone(x, y, l, h, action) {
    return this.add.rectangle(x, y, l, h, 0xffffff, 0).setDepth(50).setInteractive({ useHandCursor: true }).on('pointerdown', () => { if (!this.fini) action(); });
  }

  // --- Les dessins d'une chope, d'un plat ---

  chope(x, y, d = 5, e = 1) { const g = this.add.graphics().setDepth(d); g.fillStyle(0x2a1a10).fillRect(x - 7 * e, y - 12 * e, 14 * e, 16 * e).fillStyle(0xe8a830).fillRect(x - 5 * e, y - 9 * e, 10 * e, 11 * e).fillStyle(0xfff4e0).fillRect(x - 6 * e, y - 13 * e, 12 * e, 4 * e); g.lineStyle(2 * e, 0x2a1a10).strokeRect(x + 7 * e, y - 8 * e, 4 * e, 7 * e); return g; }
  plat(x, y, d = 5, e = 1) { const g = this.add.graphics().setDepth(d); g.fillStyle(0x2a1a10).fillEllipse(x, y, 30 * e, 12 * e).fillStyle(0xf0ece0).fillEllipse(x, y - 1, 26 * e, 9 * e).fillStyle(0x9a4a1a).fillEllipse(x - 3 * e, y - 4 * e, 12 * e, 7 * e).fillStyle(0x5a8a2a).fillCircle(x + 6 * e, y - 4 * e, 3 * e); return g; }
  dessin(quoi, x, y, d, e) { return quoi === 'chope' ? this.chope(x, y, d, e) : this.plat(x, y, d, e); }

  // --- Les clients ---

  arrivee() {
    const libre = this.places.find(p => !p.client);
    const quoi = { race: auHasard(PEUPLES_DU_BAR), nom: 'Client du bar ' + Phaser.Math.Between(1, 9999), feminin: Math.random() < 0.5, niveau: auHasard(['novice', 'aguerri', 'veteran']) };
    if (!libre) { this.dehors.push({ quoi, depuis: this.secondes() }); return; }
    this.installer(libre, quoi);
  }
  installer(place, quoi) {
    const c = { place, quoi, veut: [], recu: [], patience: 1, etat: 'arrive', id: Phaser.Math.Between(1, 1e9) };
    place.client = c;
    if (this.plats && Math.random() < 0.75) { c.veut = Math.random() < 0.45 ? ['chope', 'plat'] : ['plat']; } else c.veut = ['chope'];
    c.max = Math.max(...c.veut.map(v => SOIREE_BAR.patience[v]));
    // il entre par la droite, marche jusqu'à sa chaise, s'assoit
    const debout = imageCorps(this, 1000, place.sol + 20, quoi, 6).setDepth(4.3).setFlipX(true);
    pasDeMarche(this, debout, 1200);
    this.tweens.add({ targets: debout, x: place.x, y: place.sol, duration: 1200, ease: 'Sine.easeOut', onComplete: () => {
      debout.destroy();
      if (!place.client || place.client !== c) return;
      c.im = imageCorps(this, place.x, place.sol, quoi, place.sol < 450 ? 6 : 6.3, 'assis').setDepth(place.d).setFlipX(place.dos > 0);
      this.tweens.add({ targets: c.im, y: place.sol - 1.5, duration: 900 + (place.x % 7) * 90, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      c.im.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.allerServir(c));
      c.etat = 'attend'; c.depuis = this.secondes();
      this.bulle(c);
    } });
  }
  // la bulle de commande, sur fond noir (planche 43 v4), et sa jauge de patience
  bulle(c) {
    if (c.bulleC) c.bulleC.destroy();
    const reste = c.veut.filter((v, i) => !c.recu.includes(v) || c.recu.filter(x => x === v).length < c.veut.slice(0, i + 1).filter(x => x === v).length);
    const x = c.place.x + (c.place.dos > 0 ? 20 : -20), y = c.place.sol - 108;
    const B = this.add.container(x, y).setDepth(62);
    const g = this.add.graphics(); B.add(g);
    const l = reste.length > 1 ? 58 : 50;
    g.fillStyle(0xe8d8b0).fillRoundedRect(-l / 2, -21, l, 34, 9).fillStyle(0x0e0a08).fillRoundedRect(-l / 2 + 2, -19, l - 4, 30, 8).fillStyle(0xe8d8b0).fillTriangle(-6, 13, 6, 13, 0, 21).fillStyle(0x0e0a08).fillTriangle(-4, 11, 4, 11, 0, 17);
    reste.forEach((v, i) => { const dx = reste.length > 1 ? (i ? 12 : -12) : 0; const o = this.dessin(v, dx, v === 'chope' ? 4 : 2, 0, reste.length > 1 ? 0.8 : 1); B.add(o); });
    c.jaugeG = this.add.graphics(); B.add(c.jaugeG);
    c.bulleC = B;
    this.majJaugeClient(c);
  }
  majJaugeClient(c) {
    if (!c.jaugeG) return;
    const p = Math.max(0, c.patience), col = p > 0.6 ? 0x4aa83a : p > 0.3 ? 0xe0a020 : 0xd03020;
    c.jaugeG.clear().fillStyle(0x1a0e08).fillRoundedRect(-24, -35, 48, 10, 4).fillStyle(0x4a3a2a).fillRoundedRect(-22, -33, 44, 6, 3).fillStyle(col).fillRoundedRect(-22, -33, Math.max(3, 44 * p), 6, 3);
  }
  manque(c) {   // ce qui manque encore à ce client (dans l'ordre de sa commande)
    const r = c.recu.slice(), m = [];
    for (const v of c.veut) { const i = r.indexOf(v); if (i >= 0) r.splice(i, 1); else m.push(v); }
    return m;
  }
  donner(c, quoi) {
    c.recu.push(quoi);
    if (this.manque(c).length) { this.bulle(c); return; }
    // servi : il paie (ou il file sans payer, si c'est le filou du soir), puis s'en va
    c.etat = 'servi';
    if (c.bulleC) { c.bulleC.destroy(); c.bulleC = null; }
    if (this.imp.filou && !this.imp.filou.fait && this.minutes > 60) return this.lancerFilou(c);
    this.encaisser(c);
  }
  encaisser(c, partir = true) {
    const prix = c.veut.reduce((s, v) => s + this.prix[v], 0);
    this.stats.recette += prix; this.stats.servis++;
    let pb = 0;
    if (c.patience > 0.55 && Math.random() < 0.55) { pb = Phaser.Math.Between(...SOIREE_BAR.pourboire); this.stats.pourboires += pb; }
    this.flotter(c.place.x, c.place.sol - 120, `+${Math.round(prix)} p.${pb ? ` (+${pb} de pourboire)` : ''}`, pb ? '#ffe066' : '#f3d98a');
    Son.jouer('pieces');
    if (partir) this.time.delayedCall(1800, () => this.depart(c));
  }
  depart(c, fache = false) {
    if (c.etat === 'parti') return;
    c.etat = 'parti';
    if (c.bulleC) { c.bulleC.destroy(); c.bulleC = null; }
    const place = c.place;
    if (c.im) { const x = c.im.x, y = c.im.y; c.im.destroy(); const deb = imageCorps(this, x, place.sol + 6, c.quoi, 6).setDepth(4.3); pasDeMarche(this, deb, 1300); if (fache) this.flotter(x, place.sol - 110, '😠', '#ff9a8a'); this.tweens.add({ targets: deb, x: 1000, duration: 1300, ease: 'Sine.easeIn', onComplete: () => deb.destroy() }); }
    if (fache) this.stats.partis++;
    this.libererPlace(place);
  }
  libererPlace(place) {   // la chaise se libère : quelqu'un attendait à la porte ? il prend la place
    place.client = null;
    const s = this.dehors.shift();
    if (s) this.time.delayedCall(600, () => { if (!place.client && !this.fini) this.installer(place, s.quoi); });
  }
  flotter(x, y, t, coul) { const o = this.add.text(x, y, t, style(14, coul, { fontStyle: 'bold', stroke: '#2a1a10', strokeThickness: 4, brut: true })).setOrigin(0.5).setDepth(70); this.tweens.add({ targets: o, y: y - 30, alpha: 0, duration: 1600, delay: 400, onComplete: () => o.destroy() }); }

  // --- Toi : prendre, servir ---

  marcher(x, y, suite) {
    if (this.occupe) return;
    this.occupe = true;
    const d = Math.hypot(x - this.joueur.x, y - this.joueur.y), duree = Math.max(150, d / SOIREE_BAR.pas * 1000);
    if (x !== this.joueur.x) this.joueur.setFlipX(x < this.joueur.x);
    pasDeMarche(this, this.joueur, duree);
    this.tweens.add({ targets: this.joueur, x, y, duration: duree, ease: 'Sine.easeInOut', onComplete: () => { this.occupe = false; if (suite) suite(); } });
  }
  allerPrendre(quoi) {
    if (this.plateau.length >= SOIREE_BAR.plateau) { Son.jouer('refus'); return this.flotter(this.joueur.x, this.joueur.y - 130, 'Le plateau est plein', '#ffb0a0'); }
    const [x, y] = quoi === 'chope' ? [640, 470] : [150, 400];
    this.marcher(x, y, () => {
      while (this.pret[quoi].length && this.plateau.length < SOIREE_BAR.plateau) { const o = this.pret[quoi].pop(); o.destroy(); this.plateau.push(quoi); }
      Son.jouer('clic'); this.majPlateau();
    });
  }
  allerServir(c) {
    if (c.etat !== 'attend') return;
    const besoin = this.manque(c).filter(v => this.plateau.includes(v));
    if (!besoin.length) { Son.jouer('refus'); return this.flotter(c.place.x, c.place.sol - 140, this.plateau.length ? 'Pas ce qu’il attend' : 'Ton plateau est vide', '#ffb0a0'); }
    this.marcher(c.place.x + (c.place.dos > 0 ? 46 : -46), Math.min(530, c.place.sol + 26), () => {
      if (c.etat !== 'attend') return;
      for (const v of this.manque(c)) { const i = this.plateau.indexOf(v); if (i >= 0) { this.plateau.splice(i, 1); this.donner(c, v); if (c.etat !== 'attend') break; } }
      this.majPlateau();
    });
  }
  majPlateau() {
    this.plateauG.removeAll(true);
    const hx = this.joueur.x + (this.joueur.flipX ? -1 : 1) * this.joueur.displayHeight * 0.21, hy = this.joueur.y - this.joueur.displayHeight * 0.73;
    const g = this.add.graphics(); g.fillStyle(0x2a1a10).fillEllipse(hx + 6, hy - 3, 50, 11).fillStyle(0xb88a4a).fillEllipse(hx + 6, hy - 5, 46, 8);
    this.plateauG.add(g);
    this.plateau.forEach((v, i) => this.plateauG.add(this.dessin(v, hx - 8 + i * 14, hy - (v === 'chope' ? 9 : 8), 0, 0.8)));
  }

  // --- Les serveurs : ils portent un objet à la fois, à qui l'attend ---

  serveursAgissent() {
    for (const s of this.serveurs) {
      if (!s.libre) continue;
      if (s.qui === 'serveuse' && this.attendus < BAR.clients.serveuse) continue;   // (la deuxième, dès 12 clients)
      const c = this.clients.find(x => x.etat === 'attend' && !x.servi && this.manque(x).some(v => this.pret[v].length));
      if (!c) continue;
      const quoi = this.manque(c).find(v => this.pret[v].length);
      s.libre = false; c.servi = true;
      const [px, py] = quoi === 'chope' ? [600, 480] : [180, 400];
      const aller = (x, y, ensuite) => { const d = Math.hypot(x - s.im.x, y - s.im.y), du = Math.max(200, d / SOIREE_BAR.pasServeur * 1000); s.im.setFlipX(x < s.im.x); pasDeMarche(this, s.im, du); this.tweens.add({ targets: s.im, x, y, duration: du, onComplete: ensuite }); };
      aller(px, py, () => {
        const o = this.pret[quoi].pop();
        c.servi = false;
        if (!o || c.etat !== 'attend') { if (o) this.pret[quoi].push(o); s.libre = true; return; }
        o.destroy(); s.porte = this.dessin(quoi, s.im.x + 18, s.im.y - 60, 4.45, 0.8);
        c.servi = true;
        aller(c.place.x + (c.place.dos > 0 ? 50 : -50), Math.min(530, c.place.sol + 30), () => {
          if (s.porte) { s.porte.destroy(); s.porte = null; }
          c.servi = false;
          if (c.etat === 'attend' && this.manque(c).includes(quoi)) this.donner(c, quoi); else this.rangerPret(quoi);
          s.libre = true;
        });
      });
    }
  }
  rangerPret(quoi) {   // un objet revient sur le comptoir (ou la passe-plat)
    if (this.pret[quoi].length >= SOIREE_BAR.places[quoi]) return;
    const i = this.pret[quoi].length;
    this.pret[quoi].push(quoi === 'chope' ? this.chope(580 + i * 26, 322, 3.6, 1.1) : this.plat(70 + i * 40, 232, 1.45, 1));
  }

  // --- Les imprévus : la bagarre, le filou, la rumeur ; le videur selon son niveau ---

  preparerImprevus() {
    const imp = imprevusDuSoir(this.G), v = videurDuSoir(this.G, (imp.bagarre ? 1 : 0) + (imp.filou ? 1 : 0));
    let geres = v.geres;
    this.imp = {
      bagarre: imp.bagarre ? { quand: SOIREE_BAR.duree * Phaser.Math.FloatBetween(0.35, 0.85), videur: geres-- > 0 } : null,
      filou: imp.filou ? { videur: geres-- > 0 } : null,
      rumeur: imp.rumeur ? { quand: SOIREE_BAR.duree * Phaser.Math.FloatBetween(0.5, 0.85) } : null,
    };
  }
  boutonImprevu(x, y, texte, action, sous) {
    const bt = creerBouton(this, x, y, 220, texte, () => { if (this.occupe || this.fini) return; nettoyer(); action(); });
    bt.fond.setDepth(80); bt.label.setDepth(80.1);
    const t = this.add.text(x, y + 24, sous, style(11, '#f3d98a', { fontStyle: 'bold', backgroundColor: '#1e130acc', padding: { x: 5, y: 2 }, brut: true })).setOrigin(0.5).setDepth(80);
    const nettoyer = () => { bt.fond.destroy(); bt.label.destroy(); t.destroy(); };
    return nettoyer;
  }
  quartDHeure(x, y, suite) {   // une action d'un quart d'heure : tu y vas, et tu ne fais rien d'autre pendant ce temps
    this.marcher(x, y, () => { this.occupe = true; this.minutes += 15; this.time.delayedCall(SOIREE_BAR.quartDHeure * 1000, () => { this.occupe = false; suite(); }); });
  }
  videurArrive(x, sol, suite) {
    const v = imageCorps(this, 1000, sol + 20, { ...BAR.equipe.videur.quoi, niveau: ['novice', 'aguerri', 'veteran'][niveauVideur(this.G)] }, 7, 'empoigne').setDepth(4.6).setFlipX(true);
    pasDeMarche(this, v, 900);
    this.tweens.add({ targets: v, x: x + 60, y: sol + 10, duration: 900, onComplete: () => { this.time.delayedCall(1200, () => { suite(); pasDeMarche(this, v, 1000); this.tweens.add({ targets: v, x: 1000, duration: 1000, onComplete: () => v.destroy() }); }); } });
    this.flotter(x, sol - 150, 'Brok s’en charge', '#9ae08a');
  }
  lancerBagarre() {
    const B = this.imp.bagarre; B.fait = true;
    const deux = this.clients.filter(c => c.etat === 'attend' && c.im).slice(0, 2);
    if (deux.length < 2) return;
    const [a, c] = deux, x = (a.place.x + c.place.x) / 2, sol = Math.max(a.place.sol, c.place.sol);
    const etoiles = [0, 1, 2].map(k => { const t = this.add.text(x - 14 + k * 14, sol - 120 - (k % 2) * 10, '✶', style(22, '#ffe066', { stroke: '#2a1a10', strokeThickness: 3, brut: true })).setOrigin(0.5).setDepth(63); this.tweens.add({ targets: t, angle: 360, duration: 900, repeat: -1 }); return t; });
    for (const cl of deux) this.tweens.add({ targets: cl.im, x: cl.im.x + 4, duration: 120, yoyo: true, repeat: -1 });
    this.bagarreEnCours = { a, c, etoiles };
    const fin = (calmee) => {
      if (!this.bagarreEnCours) return;
      for (const e of etoiles) e.destroy();
      for (const cl of deux) if (cl.im) { this.tweens.killTweensOf(cl.im); cl.im.x = cl.place.x; }
      this.bagarreEnCours = null;
      if (calmee) { this.flotter(x, sol - 130, 'Bagarre calmée ✓', '#9ae08a'); for (const cl of deux) cl.patience = Math.max(cl.patience, 0.5); }
      else { this.stats.bagarresRatees++; this.flotter(x, sol - 130, 'Ils partent fâchés (la garde passera demain)', '#ffb0a0'); for (const cl of deux) this.depart(cl, true); }
    };
    if (B.videur) return this.videurArrive(x, sol, () => fin(true));
    const nettoyer = this.boutonImprevu(x, sol - 170, 'Calmer la bagarre', () => { this.bagarreEnCours.prise = true; this.quartDHeure(x, Math.min(530, sol + 30), () => fin(true)); }, '⌛ ¼ h · une chope offerte, ou la garde demain');
    this.time.delayedCall(SOIREE_BAR.delaiImprevu * 1000, () => { if (this.bagarreEnCours && !this.bagarreEnCours.prise) { nettoyer(); fin(false); } });
  }
  lancerFilou(c) {
    const F = this.imp.filou; F.fait = true;
    // il se lève et file vers la porte, sans payer
    const place = c.place, x0 = c.im ? c.im.x : place.x;
    if (c.im) c.im.destroy();
    c.etat = 'parti';
    const deb = imageCorps(this, x0, place.sol + 6, c.quoi, 6).setDepth(4.3);
    pasDeMarche(this, deb, 4500);
    this.tweens.add({ targets: deb, x: 940, duration: 4500 });
    this.flotter(x0, place.sol - 120, 'Il file sans payer !', '#ffb0a0');
    this.libererPlace(place);
    const attrape = () => { deb._attrape = true; this.tweens.killTweensOf(deb); this.flotter(deb.x, deb.y - 120, 'Rattrapé : il paie ✓', '#9ae08a'); this.time.delayedCall(800, () => deb.destroy()); this.encaisser({ ...c, place: { ...place, x: deb.x } }, false); };
    if (F.videur) return this.videurArrive(deb.x + 100, place.sol, attrape);
    const nettoyer = this.boutonImprevu(700, 420, 'Le rattraper', () => { deb._poursuivi = true; this.quartDHeure(Math.min(900, deb.x + 40), 520, attrape); }, '⌛ ¼ h · sinon, l’ardoise est perdue');
    this.time.delayedCall(4500, () => { if (deb.active && !deb._attrape && !deb._poursuivi) { nettoyer(); this.stats.filousRates++; this.flotter(940, 420, 'Parti sans payer...', '#ffb0a0'); deb.destroy(); } });
  }
  lancerRumeur() {
    const R = this.imp.rumeur; R.fait = true;
    const r = rumeurDuBar(this.G), x = 760, y = 250;
    const bulle = this.add.container(x, y).setDepth(64);
    const t = this.add.text(0, 0, r.texte, style(12, '#2a1a0c', { fontStyle: 'bold', wordWrap: { width: 210 }, align: 'center' })).setOrigin(0.5);
    const g = this.add.graphics(); g.fillStyle(0x2a1a10).fillRoundedRect(-117, -t.height / 2 - 11, 234, t.height + 22, 12).fillStyle(0xfff8e8).fillRoundedRect(-115, -t.height / 2 - 9, 230, t.height + 18, 11);
    bulle.add([g, t]); bulle.setAlpha(0.35);
    let ecoute = false;
    const nettoyer = this.boutonImprevu(760, 330, 'Tendre l’oreille', () => { ecoute = true; this.quartDHeure(720, 470, () => { this.stats.rumeur = r; bulle.setAlpha(1); this.flotter(760, 200, 'Une rumeur vraie sur demain ✓', '#9ae08a'); this.time.delayedCall(3000, () => bulle.destroy()); }); }, '⌛ ¼ h · une rumeur vraie sur demain');
    this.time.delayedCall(SOIREE_BAR.delaiImprevu * 1000, () => { if (!ecoute) { nettoyer(); bulle.destroy(); } });
  }

  secondes() { return (this.time.now - this.t0) / 1000; }

  update(_, dt) {
    if (this.fini) return;
    const s = this.secondes(), d = dt / 1000;
    this.minutes = Math.max(this.minutes, Math.min(300, s / SOIREE_BAR.duree * 300));
    // les arrivées
    while (this.arrivees.length && this.arrivees[0] <= s) { this.arrivees.shift(); this.arrivee(); }
    this.clients = this.places.map(p => p.client).filter(Boolean);
    // la patience
    for (const c of this.clients) {
      if (c.etat !== 'attend') continue;
      const presse = this.bagarreEnCours && this.bagarreEnCours.a !== c && this.bagarreEnCours.c !== c ? 1.6 : 1;
      c.patience -= d / c.max * presse;
      this.majJaugeClient(c);
      if (c.patience <= 0) this.depart(c, true);
    }
    // ceux qui attendent à la porte depuis trop longtemps repartent
    while (this.dehors.length && s - this.dehors[0].depuis > SOIREE_BAR.attenteDehors) { this.dehors.shift(); this.stats.partis++; }
    // le barman et le cuisinier préparent ce qui manque (sans trop d'avance)
    for (const [quoi, jg] of [['chope', this.jaugeBarman], ['plat', this.plats ? this.jaugeCuisine : null]]) {
      if (!jg) continue;
      const voulus = this.clients.filter(c => c.etat === 'attend').reduce((n, c) => n + this.manque(c).filter(v => v === quoi).length, 0);
      const dispo = this.pret[quoi].length + this.plateau.filter(v => v === quoi).length + this.serveurs.filter(x => x.porte).length;
      if (voulus > dispo && this.pret[quoi].length < SOIREE_BAR.places[quoi]) {
        this.enPrepa[quoi] += d;
        jg.maj(this.enPrepa[quoi] / SOIREE_BAR.prepa[quoi]);
        if (this.enPrepa[quoi] >= SOIREE_BAR.prepa[quoi]) { this.enPrepa[quoi] = 0; jg.maj(0); this.rangerPret(quoi); }
      } else jg.maj(this.enPrepa[quoi] / SOIREE_BAR.prepa[quoi]);
    }
    this.serveursAgissent();
    // les imprévus du soir
    if (this.imp.bagarre && !this.imp.bagarre.fait && s >= this.imp.bagarre.quand) this.lancerBagarre();
    if (this.imp.rumeur && !this.imp.rumeur.fait && s >= this.imp.rumeur.quand) this.lancerRumeur();
    // le conteur raconte, vers 21 h
    if (this.conteur && !this.conteurVu && this.minutes >= 110) { this.conteurVu = true; this.tweens.add({ targets: this.conteur, alpha: 1, duration: 600 }); this.flotter(196, 240, '« Il était une fois, au-delà de la Porte... »', '#e8d8ff'); this.time.delayedCall(25000, () => this.conteur && this.tweens.add({ targets: this.conteur, alpha: 0, duration: 600 })); }
    if (this.plateau.length) this.majPlateau(); else this.plateauG.removeAll(true);
    this.majBandeau();
    // la fin : minuit, ou plus personne à servir après 23 h
    const plusPersonne = !this.arrivees.length && !this.dehors.length && !this.clients.some(c => c.etat !== 'parti');
    if (this.minutes >= 300 || (this.minutes >= 240 && plusPersonne)) this.finir();
  }

  finir() {
    if (this.fini) return;
    this.fini = true;
    for (const c of this.clients) if (c.etat === 'attend') this.depart(c, false);
    const d = finirSoireeJouee(this.G, this.stats);
    this.bilan(d);
  }
  bilan(d) {
    const G = this.G;
    this.add.rectangle(480, 270, 960, 540, 0x0a0604, 0.6).setDepth(96).setInteractive();
    const L = this.add.container(480, 262).setDepth(97);
    L.add(this.add.image(0, 0, panneauHD(this, 420, 400)).setScale(2));
    L.add(this.add.text(0, -168, 'Ta soirée au petit bar', style(18, '#5a0e0e', { fontStyle: 'bold' })).setOrigin(0.5));
    const bande = this.b.bande && BAR.bandes[this.b.bande];
    L.add(this.add.text(0, -146, `19 h – minuit, toi au service${bande ? ' · ' + bande.nom : ''}`, style(11, '#3b2410', { fontStyle: 'italic' })).setOrigin(0.5));
    const lignes = [
      [`Chopes et plats (${d.servis} servis sur ${d.attendus})`, `+${d.recette} p.`],
      ['Pourboires', `+${d.pourboires} p.`, '#2f5a2a'],
      ['Les paies (l’équipe, la bande, le conteur)', `−${d.paies} p.`, '#8a1a14'],
      ...(d.perte ? [['L’ardoise perdue (le filou)', `−${d.perte} p.`, '#8a1a14']] : []),
      ['Renommée du bar', `${d.renommee >= 0 ? '+' : ''}${Math.round(d.renommee * 100) / 100} ★`, '#5a2a8a'],
      ['Des habitués', `${d.habitues} (des clients en plus)`, '#2a4a8a'],
      ...(d.rumeur ? [['Une rumeur vraie', 'sur demain', '#2a4a8a']] : []),
      ...(this.stats.bagarresRatees ? [['Une bagarre ratée', 'la garde demain', '#8a1a14']] : []),
    ];
    lignes.forEach(([a, bb, c], i) => { L.add(this.add.text(-180, -116 + i * 26, a, style(13, c || '#3b2410', { fontStyle: 'bold' }))); L.add(this.add.text(180, -116 + i * 26, bb, style(13, c || '#3b2410', { fontStyle: 'bold' })).setOrigin(1, 0)); });
    L.add(this.add.text(0, 118, `Gain : ${d.gain >= 0 ? '+' : ''}${d.gain} p.`, style(18, d.gain >= 0 ? '#2f5a2a' : '#8a1a14', { fontStyle: 'bold' })).setOrigin(0.5));
    L.setScale(0.9).setAlpha(0); this.tweens.add({ targets: L, scale: 1, alpha: 1, duration: 300, ease: 'Back.easeOut' });
    Son.jouer(d.gain >= 0 ? 'fanfare' : 'page');
    const bt = creerBouton(this, 480, 432, 240, 'Rentrer chez toi', () => this.rentrer()); bt.fond.setDepth(98); bt.label.setDepth(98.1);
  }
  rentrer() {
    if (this.sortie) return;
    this.sortie = true;
    this.cameras.main.fadeOut(350);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      const r = this.retour;
      this.scene.stop();
      const sc = this.scene.get(r);
      if (r === 'Nuit' && sc) sc.scene.restart({ matin: false }); else this.scene.resume(r);
    });
  }
}
