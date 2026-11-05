// La carte du monde. Deux usages :
// - le matin, en ouvrant le comptoir (`planification`) : tu places d'abord tous les voyageurs
//   du jour qui cherchent l'aventure sur les zones de ton choix, puis tu prépares leurs sacs ;
// - au comptoir (`comptoir`) : pour un seul voyageur, le comptoir attend en pause.
// La carte montre aussi où sont tes aventuriers en mission et les clients qui t'ont écrit :
// une vue d'ensemble de tes alentours et de ta progression.
// Les zones dangereuses s'ouvrent avec la réputation, ou quand un aventurier les découvre.
// (05/11) Les petits pas des noms de royaumes, de loin (« Tout voir ») et de près, pour qu'ils ne touchent rien :
// calculés en essayant chaque zoom (les médaillons, leurs étoiles, les noms des contrées, les fanions, les autres noms).
const NOMS_ROYAUMES_CARTE = {
  loin: { gobelins: [0, 10], bambous: [-6, 0], humains: [-1, 0] },
  pres: { loups: [14, 0], orcs: [-84, 16], gobelins: [0, 14], sables: [0, 2] },
};
// (05/11) un nom de contrée qui toucherait le médaillon voisin se plie plus tôt
const LARGEUR_NOM_CARTE = { hautgarde: 100 };

class CarteScene extends Phaser.Scene {
  constructor() { super('Carte'); }

  init(data) {
    this.comptoir = data.comptoir || null;
    // (v0.93) la carte consultée de partout (comptoir, arrière-boutique, chambre, marchés) : on ne fait que regarder
    this.consultation = data.consultation ? data.retour : null;
    this.planification = !this.comptoir && !this.consultation;
    this.zoneChoisie = null;
    this.devoilement = false;   // (audit v0.59) la scène est réutilisée : sans ça, une carte quittée pendant le dévoilement restait inerte
  }

  create() {
    if (!this.consultation) exclureScenes(this, 'Nuit', 'Dodo');   // (v0.62)
    // (v1.07) consultée depuis une page rangée après elle (arrière-boutique, promenade, rue, marché noir) :
    // elle passe devant, sinon cette page la cachait et le jeu semblait figé
    else this.scene.moveAbove(this.consultation);
    const G = this.G = window.GAME;
    // Les voyageurs à placer : tout ceux du jour sans destination, ou celui du comptoir.
    this.voyageurs = this.consultation ? [] : this.comptoir ? [this.comptoir.voyageur]
      : G.file.filter(e => e.type === 'client' && (!e.voyageur.queteId || e.planifie)).map(e => e.voyageur);
    this.place = {}; // id du voyageur → zone choisie
    for (const e of G.file) if (e.planifie) this.place[e.voyageur.id] = e.voyageur.zone;
    this.selection = this.voyageurs.find(v => !this.place[v.id]) || this.voyageurs[0];

    // Le monde (le parchemin, les contrées, les repères) vit dans `this.monde`, filmé par sa propre
    // caméra qu'on fait glisser et zoomer ; tout le reste (bureau, bande, bulle) est l'interface.
    this.monde = this.add.container(0, 0);
    this.dessus = this.add.container(0, 0).setDepth(10);   // l'interface posée sur la carte (sa propre caméra, au-dessus)
    this.bulle = this.add.container(0, 0);
    this.dessus.add(this.bulle);
    this.etiquettes = [];        // les textes du monde qui gardent la même taille à l'écran
    this.dessinerParchemin();
    this.titre = this.add.text(480, 24, '', style(19, '#f3d98a', { fontStyle: 'bold' })).setOrigin(0.5);
    // (v1.42, planche 68) un titre court ; le rang et le peuple dans une petite étiquette à côté
    this.puceTitre = this.add.text(0, 25, '', style(12, '#2a1608', { fontStyle: 'bold', backgroundColor: '#c9b48a', padding: { x: 6, y: 2 } })).setOrigin(0, 0.5);
    this.dessinerZones();
    this.reperes = this.add.container(0, 0).setDepth(5);
    this.monde.add(this.reperes);
    this.creerBande();
    this.creerCamera();
    this.tout();
    this.cameras.main.fadeIn(300);
    this.camCarte.fadeIn(300);
    if (this.nouvelles.length) this.time.delayedCall(400, () => this.devoiler(this.nouvelles.slice()));
    else if (this.planification && !visiteDuMonde(this)) this.time.delayedCall(500, () => conseilGarrick(this, 'carte'));   // (v1.40) le Jour Zéro : la visite du monde
  }

  // Le dévoilement d'une contrée qui vient de s'ouvrir : la caméra y glisse, la brume se dissipe,
  // le médaillon se déplie avec une fanfare, puis son nom et ses étoiles s'écrivent.
  devoiler(liste) {
    const cle = liste.shift();
    if (!cle) {
      // Le monde connu s'est agrandi : on dézoome pour le voir en entier
      this.vue(this.kMin, this.limites.cx, this.limites.cy, () => { this.devoilement = false; if (this.planification) conseilGarrick(this, 'carte'); });
      return;
    }
    this.devoilement = true;
    const z = ZONES[cle], p = this.pieces[cle];
    this.fermerBulle();
    this.limiter(Object.keys(ZONES).filter(c => zoneOuverte(this.G, c) && (!this.nouvelles.includes(c) || c === cle || !liste.includes(c))));
    this.vue(Math.max(this.k, 0.95), z.x, z.y, () => {
      if (p.point) p.point.destroy();
      (p.nuages || []).forEach((n, i) => { this.tweens.killTweensOf(n); this.tweens.add({ targets: n, x: n.x + (n.x < z.x ? -90 : 90), y: n.y - 20 + i * 8, alpha: 0, duration: 900, ease: 'Sine.easeIn', onComplete: () => n.destroy() }); });
      this.tweens.add({ targets: p.brume, alpha: 0, scaleX: 3.2, scaleY: 2.6, duration: 700, ease: 'Sine.easeOut', onComplete: () => p.brume.destroy() });
      p.pastille.setTexture('vignetteZone_' + cle).setScale(0);
      p.ombre.setTexture('vignetteZone_' + cle).setScale(0);
      Son.jouer('fanfare');
      this.tweens.add({ targets: [p.pastille, p.ombre], scale: 2, duration: 550, ease: 'Back.easeOut', delay: 250 });
      // un éclat de lumière derrière le médaillon
      const eclat = this.add.image(z.x, z.y, 'halo').setScale(0.5).setTint(0xfff0a0).setAlpha(0.9).setBlendMode(Phaser.BlendModes.ADD);
      this.monde.add(eclat);
      this.tweens.add({ targets: eclat, scale: 4, alpha: 0, duration: 900, delay: 200, onComplete: () => eclat.destroy() });
      this.time.delayedCall(850, () => {
        p.nom.setText(z.nom).setColor('#2a1808').setAlpha(0);
        const etoiles = this.add.text(z.x, z.y + 30, '★'.repeat(z.danger), style(13, '#ffd860', { fontStyle: 'bold', stroke: '#3b2410', strokeThickness: 4 })).setOrigin(0.5).setAlpha(0);
        this.monde.add(etoiles); this.etiquettes.push({ o: etoiles, etiquette: true });
        const neuf = this.add.text(z.x, z.y - 44, '✦ Nouvelle contrée ! ✦', style(14, '#a0300a', { fontStyle: 'bold', stroke: '#fff4dc', strokeThickness: 4 })).setOrigin(0.5).setAlpha(0);
        this.monde.add(neuf); const eNeuf = { o: neuf, etiquette: true, detail: true, nouveau: true }; this.etiquettes.push(eNeuf);   // (05/11 : de près seulement, comme les noms ; de loin il couvrait le nom d'un royaume)
        // (05/11) il s'efface après quelques secondes ; tant qu'il est là, le nom d'un royaume qu'il toucherait s'efface (appliquerVue)
        this.time.delayedCall(6000, () => this.tweens.add({ targets: neuf, alpha: 0, duration: 500, onComplete: () => {
          this.etiquettes = this.etiquettes.filter(x => x !== eNeuf); neuf.destroy(); if (this.centre) this.appliquerVue(this.k, this.centre.x, this.centre.y); } }));
        this.appliquerVue(this.k, this.centre.x, this.centre.y);
        this.tweens.add({ targets: [p.nom, etoiles, neuf], alpha: 1, duration: 400 });
        this.tweens.add({ targets: neuf, alpha: 0.6, duration: 500, yoyo: true, repeat: -1, delay: 400 });
        this.time.delayedCall(1100, () => this.devoiler(liste));
      });
    });
  }

  // --- Le décor ---

  dessinerParchemin() {
    // Le parchemin posé sur le bureau
    creerInterieurHD(this);
    creerBureauHD(this);
    creerCarteHD(this);
    creerHalo(this);
    creerVignettesZonesHD(this);
    creerComptoirCarteHD(this);
    creerEmblemesHD(this);
    creerNuagesCarteHD(this);
    this.add.image(0, 0, 'bureauBois').setOrigin(0).setScale(2).setTint(0xa08870);
    vignette(this, 0.7, 0);
    // Le cadre de la carte (le monde s'affiche dedans, par sa caméra)
    this.add.rectangle(480, 234, 938, 374, 0x000000, 0).setStrokeStyle(4, 0x3b2410);
    this.add.rectangle(480, 234, 944, 380, 0x000000, 0).setStrokeStyle(2, 0xc9a227, 0.8);
    this.monde.add(this.add.image(0, 0, 'carteHD').setOrigin(0).setScale(2));
    // Le nom des royaumes, à la plume, avec leurs étoiles, et leur écu devant
    for (const [cle, r] of Object.entries(ROYAUMES)) {
      const t = this.add.text(0, 0, r.nom + (r.etoiles ? ' ' + '★'.repeat(r.etoiles) : ''), style(13, cle === 'bannis' ? '#3a1a4a' : '#4a2a0a',
        { fontStyle: 'bold italic', stroke: '#f0e2bc', strokeThickness: 4 })).setOrigin(0.5).setAlpha(0.92)
        .setInteractive({ useHandCursor: true });
      t.on('pointerup', () => { if (!this.aGlisse()) this.vue(1, r.x, r.y + 120); });
      const groupe = this.add.container(r.x, r.y, [t]);
      let gauche = t.width / 2, demiH = t.height / 2;
      if (EMBLEME_ROYAUME[cle]) { const e = this.add.image(-t.width / 2 - 10, 0, 'embleme_' + EMBLEME_ROYAUME[cle]).setScale(0.5); groupe.add(e);
        gauche = t.width / 2 + 10 + e.displayWidth / 2; demiH = Math.max(demiH, e.displayHeight / 2); }
      this.monde.add(groupe);
      // (05/11) son étendue, pour qu'il ne sorte jamais du parchemin (voir appliquerVue)
      this.etiquettes.push({ o: groupe, royaume: true, cle, x: r.x, y: r.y, gauche, droite: t.width / 2, demiH });
    }
    for (const [x, y, nom, angle] of [[60, 520, "Mer d'Opale", -80], [1432, 240, 'La Grande Muraille', 88], [368, 496, 'Le Grand Fleuve', -42],
      [646, 186, 'Lac de Lune', 0], [872, 744, "L'étang du Moulin", 0], [240, 780, 'Baie des Brisants', 0], [936, 50, 'Lac gelé', 0], [1832, 300, 'Fleuve des Cendres', 88]]) {
      const t = this.add.text(x, y, nom, style(12, '#3b2a4a', { fontStyle: 'italic', stroke: '#f0e2bc', strokeThickness: 3 })).setOrigin(0.5).setAngle(angle).setAlpha(0.8);
      this.monde.add(t);
      this.etiquettes.push({ o: t, detail: true });
    }
    // Ton comptoir
    const depart = typeof positionComptoir === 'function' ? positionComptoir(this.G) : MONDE_CARTE.comptoir;   // (v1.57) à Pont-Royal, ta maison est sur le pont
    this.monde.add(this.add.image(depart.x, depart.y + 14, 'halo').setScale(0.9, 0.5).setTint(0xffe8a0).setAlpha(0.7));
    this.monde.add(this.add.image(depart.x, depart.y + 14, 'comptoirCarteHD').setOrigin(0.5, 1).setScale(2));
    const ici = this.add.text(depart.x, depart.y + 17, 'Ton comptoir', style(12, '#3b2410', { fontStyle: 'bold', stroke: '#f0e2bc', strokeThickness: 4 })).setOrigin(0.5, 0);
    this.monde.add(ici);
    this.etiquettes.push({ o: ici });
  }

  dessinerZones() {
    const G = this.G;
    this.anneau = this.add.ellipse(0, 0, 116, 82).setStrokeStyle(4, 0xffe066).setVisible(false);
    this.monde.add(this.anneau);
    this.tweens.add({ targets: this.anneau, scale: 1.15, duration: 500, yoyo: true, repeat: -1 });
    const ajouter = (o, opts = {}) => { this.monde.add(o); if (opts.etiquette) this.etiquettes.push({ o, ...opts }); return o; };
    // Les contrées qui viennent de s'ouvrir depuis la dernière visite : elles sortent de la brume
    // sous tes yeux (voir `devoiler`), dans l'ordre des étoiles.
    this.nouvelles = G.zonesVuesCarte ? Object.keys(ZONES).filter(c => zoneOuverte(G, c) && !G.zonesVuesCarte.includes(c)).sort((a, b) => ZONES[a].danger - ZONES[b].danger) : [];
    this.pieces = {};
    for (const [cle, z] of Object.entries(ZONES)) {
      const ouverte = zoneOuverte(G, cle) && !this.nouvelles.includes(cle);   // (une nouvelle reste brumeuse jusqu'à son dévoilement)
      const p = this.pieces[cle] = {};
      // Les contrées inconnues restent dans la brume du parchemin.
      if (!ouverte) p.brume = ajouter(this.add.image(z.x, z.y, 'halo').setScale(2.3, 1.9).setTint(0xe4d0a0).setAlpha(0.9));
      // Le médaillon peint de la contrée (ou sa brume), et ses étoiles de danger en bas.
      p.ombre = ajouter(this.add.image(z.x + 3, z.y + 4, ouverte ? 'vignetteZone_' + cle : 'vignetteZone_inconnue').setScale(2).setTint(0x000000).setAlpha(0.25));
      const pastille = p.pastille = ajouter(this.add.image(z.x, z.y, ouverte ? 'vignetteZone_' + cle : 'vignetteZone_inconnue').setScale(2)
        .setInteractive({ useHandCursor: true }));
      if (ouverte) ajouter(this.add.text(z.x, z.y + 30, '★'.repeat(z.danger), style(13, '#ffd860', { fontStyle: 'bold', stroke: '#3b2410', strokeThickness: 4 })).setOrigin(0.5), { etiquette: true });
      else p.point = ajouter(this.add.text(z.x, z.y, '?', style(26, '#8a7450', { fontStyle: 'bold' })).setOrigin(0.5));
      // (05/11) le nom suit ses étoiles quand elles grossissent (voir appliquerVue), et se plie plus tôt : deux noms voisins ne se touchent plus
      p.nom = ajouter(this.add.text(z.x, z.y + 40, ouverte ? z.nom : '???', style(13, ouverte ? '#2a1808' : '#6a6458', { fontStyle: 'bold', align: 'center', wordWrap: { width: LARGEUR_NOM_CARTE[cle] || 170 }, stroke: '#f0e2bc', strokeThickness: 4 })).setOrigin(0.5, 0), { etiquette: true, detail: true, sousEtoiles: z.y + 40 });
      pastille.on('pointerup', () => { if (!this.aGlisse() && !this.devoilement) this.choisirZone(cle); });
      // La conquête : un fanion avec le compte des missions réussies, doré une fois conquise
      if (ouverte) {
        const n = (G.conquete || {})[cle] || 0;
        const conquise = n >= conqueteZone(cle);
        const fanion = ajouter(this.add.text(z.x + 50, z.y - 22, conquise ? '⚑ Conquise' : `⚑ ${n}/${conqueteZone(cle)}`,
          style(11, conquise ? '#7a4a00' : '#3b2410', { fontStyle: 'bold', backgroundColor: conquise ? '#f0c840' : '#e8d8b0', padding: { x: 3, y: 1 } })).setOrigin(0.5), { etiquette: true, detail: true });
        if (conquise) this.tweens.add({ targets: fanion, angle: { from: -4, to: 4 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
    }
    // De gros nuages couvrent les contrées pas encore ouvertes : elles se dévoileront plus tard
    // (ils ne débordent jamais sur une contrée déjà ouverte : son médaillon, son nom, son fanion)
    const ouvertesVues = Object.entries(ZONES).filter(([c]) => zoneOuverte(G, c) && !this.nouvelles.includes(c));
    const gene = (x, y, e) => ouvertesVues.some(([c, o]) => {
      const demiNom = Math.min(95, o.nom.length * 4.2);
      const zonesLibres = [[o.x - 62, o.y - 48, o.x + 92, o.y + 36], [o.x - demiNom, o.y + 36, o.x + demiNom, o.y + 60]];
      return zonesLibres.some(([x0, y0, x1, y1]) => x + 30 * e > x0 && x - 30 * e < x1 && y + 14 * e > y0 && y - 16 * e < y1);
    });
    for (const [cle, z] of Object.entries(ZONES)) {
      if (zoneOuverte(G, cle) && !this.nouvelles.includes(cle)) continue;
      const p = this.pieces[cle];
      p.nuages = [[-38, -8, 0, 1.9], [30, -14, 1, 1.7], [0, 12, 2, 2.1], [-14, -24, 1, 1.3], [44, 10, 0, 1.5], [-46, 14, 2, 1.4], [16, -30, 2, 1.2]].map(([dx, dy, v, e]) => {
        // un nuage qui gênerait rapetisse, et disparaît s'il gêne encore
        if (gene(z.x + dx, z.y + dy, e)) e *= 0.65;
        return gene(z.x + dx, z.y + dy, e) ? null : [dx, dy, v, e];
      }).filter(Boolean).map(([dx, dy, v, e], i) => {
        const n = this.add.image(z.x + dx, z.y + dy, 'nuageCarte_' + ((v + cle.length) % 3)).setScale(e).setAlpha(0.96).setFlipX((i + cle.length) % 2 === 0);
        this.monde.add(n);
        // ils dérivent doucement sur place
        this.tweens.add({ targets: n, x: n.x + (i % 2 ? 7 : -7), duration: 2600 + i * 500 + cle.length * 90, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        return n;
      });
    }
    const conquises = Object.keys(ZONES).filter(c => ((G.conquete || {})[c] || 0) >= conqueteZone(c)).length;
    // (05/11) dans la règle, au-dessus de la carte : il ne cache plus aucune contrée
    this.dessus.add(this.add.text(940, 62, `⚑ Contrées conquises : ${conquises} / ${Object.keys(ZONES).length} · royaumes libérés : ${Object.keys(ROYAUMES).filter(r => royaumeLibere(G, r)).length} / ${Object.keys(ROYAUMES).length}`, style(12, '#f3e6c8', { fontStyle: 'bold', backgroundColor: '#2a1a10cc', padding: { x: 5, y: 2 } })).setOrigin(1, 0.5));
    G.zonesVuesCarte = zonesOuvertes(G);
  }

  // --- La caméra du monde : on la fait glisser (glisser-déposer) et zoomer (molette, boutons) ---

  creerCamera() {
    const Z = this.Z = this.cameras.main.zoom;
    // (05/11) la carte commence sous sa règle (les boutons et le compte des conquêtes) : rien ne se pose sur elle
    this.cadre = { x: 14, y: 74, l: 932, h: 344 };
    this.add.rectangle(480, 62, 932, 24, 0x2a1a10);
    this.add.rectangle(480, 74, 932, 2, 0xc9a227, 0.7);
    this.kMax = 1.3;
    // Le monde connu : la carte ne montre que les contrées ouvertes (et un peu autour), zoomée
    // dessus ; elle se dézoome à mesure que de nouvelles contrées s'ouvrent.
    this.limiter(Object.keys(ZONES).filter(c => zoneOuverte(this.G, c) && !this.nouvelles.includes(c)));
    // (sans bornes de caméra : appliquerVue borne le centre elle-même, et centre le monde quand il tient tout entier)
    this.camCarte = this.cameras.add(this.cadre.x * Z, this.cadre.y * Z, this.cadre.l * Z, this.cadre.h * Z).setBackgroundColor('#2a1a10');
    this.camDessus = this.cameras.add(0, 0, 960 * Z, 540 * Z).setOrigin(0, 0).setZoom(Z);
    this.cameras.main.ignore([this.monde, this.dessus]);
    this.events.off('postupdate', this.filtrerCameras, this);   // (audit v0.59 : un seul écouteur, pas un de plus à chaque ouverture)
    this.events.on('postupdate', this.filtrerCameras, this);
    this.events.once('shutdown', () => this.events.off('postupdate', this.filtrerCameras, this));
    this.filtrerCameras();
    // La vue de la dernière fois, sinon le monde entier
    const v = this.G.vueCarte && this.G.vueCarte.k >= this.kMin ? this.G.vueCarte : { k: this.kMin, x: this.limites.cx, y: this.limites.cy };
    this.k = v.k;
    this.appliquerVue(v.k, v.x, v.y);
    // Glisser pour se déplacer
    this.input.on('pointerdown', p => {
      if (!this.dansCadre(p)) { this.glisse = null; return; }
      this.glisse = { x: p.x, y: p.y, sx: this.centre.x, sy: this.centre.y, bouge: false };
    });
    this.input.on('pointermove', p => {
      const g = this.glisse;
      if (!g || !p.isDown) return;
      if (!g.bouge && Math.hypot(p.x - g.x, p.y - g.y) < 8 * Z) return;
      if (!g.bouge) { g.bouge = true; this.fermerBulle(); }
      this.appliquerVue(this.k, g.sx - (p.x - g.x) / (Z * this.k), g.sy - (p.y - g.y) / (Z * this.k));
    });
    this.input.on('pointerup', () => this.time.delayedCall(0, () => { this.glisse = null; }));
    this.input.on('wheel', (p, objets, dx, dy) => {
      if (!this.dansCadre(p)) return;
      const k = Phaser.Math.Clamp(this.k * (dy > 0 ? 0.85 : 1.18), this.kMin, this.kMax);
      // on zoome vers le point visé
      const c = this.centre, Z = this.Z;
      const m = { x: c.x + (p.x / Z - this.cadre.x - this.cadre.l / 2) / this.k, y: c.y + (p.y / Z - this.cadre.y - this.cadre.h / 2) / this.k };
      const f = this.k / k;
      this.fermerBulle();
      this.appliquerVue(k, m.x + (c.x - m.x) * f, m.y + (c.y - m.y) * f);
    });
    // Les boutons : zoomer, dézoomer, voir tout le monde
    let xb = 24;
    const bouton = (texte, action) => {
      const b = this.add.text(xb, 62, texte, style(15, '#fff4dc', { fontStyle: 'bold', backgroundColor: '#3b2410cc', padding: { x: 7, y: 1 } }))
        .setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
      b.on('pointerdown', () => { Son.jouer('clic'); action(); });
      this.dessus.add(b);
      xb += b.width + 6;
      return b;
    };
    const c = () => this.centre;
    bouton('＋', () => { this.fermerBulle(); this.vue(Math.min(this.kMax, this.k * 1.4), c().x, c().y); });
    bouton('－', () => { this.fermerBulle(); this.vue(Math.max(this.kMin, this.k / 1.4), c().x, c().y); });
    bouton('Tout voir', () => { this.fermerBulle(); this.vue(this.kMin, this.limites.cx, this.limites.cy); });
  }

  // Les limites du monde connu : un rectangle autour des contrées ouvertes et du comptoir, avec
  // de la marge, jamais plus grand que le monde ; le zoom minimal est celui qui le montre en entier.
  limiter(ouvertes) {
    const dep = typeof positionComptoir === 'function' ? positionComptoir(this.G) : MONDE_CARTE.comptoir;
    const pts = [[dep.x, dep.y], ...ouvertes.map(c => [ZONES[c].x, ZONES[c].y])];
    const marge = 150;
    const x0 = Math.max(0, Math.min(...pts.map(p => p[0])) - marge), x1 = Math.min(MONDE_CARTE.L, Math.max(...pts.map(p => p[0])) + marge);
    const y0 = Math.max(0, Math.min(...pts.map(p => p[1])) - marge), y1 = Math.min(MONDE_CARTE.H, Math.max(...pts.map(p => p[1])) + marge + 30);
    // (au moins un cadre entier, pour qu'on puisse toujours glisser un peu)
    const l = Math.max(x1 - x0, this.cadre.l), h = Math.max(y1 - y0, this.cadre.h);
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    this.limites = { x0: Math.max(0, cx - l / 2), x1: Math.min(MONDE_CARTE.L, cx + l / 2), y0: Math.max(0, cy - h / 2), y1: Math.min(MONDE_CARTE.H, cy + h / 2), cx, cy };
    // (05/11) « Tout voir » montre tout le monde connu, en largeur ET en hauteur : rien n'est rogné par le cadre
    // (quand le monde ne remplit pas le cadre, le bois sombre se voit de part et d'autre)
    this.kMin = Math.min(this.cadre.l / (this.limites.x1 - this.limites.x0), this.cadre.h / (this.limites.y1 - this.limites.y0));
    this.kMin = Math.min(this.kMin, 1.1);
  }

  // Ce que la caméra du monde ne filme pas : tout sauf le monde (et inversement pour l'interface).
  filtrerCameras() {
    if (!this.camCarte || !this.camCarte.id || !this.camDessus || !this.cameras.main || !this.monde || !this.monde.list) return;   // (la carte fermée : ses caméras n'existent plus)
    const bit = this.camCarte.id, dessus = this.camDessus.id;
    for (const o of this.children.list) {
      if (o !== this.monde && !(o.cameraFilter & bit)) o.cameraFilter |= bit;
      if (o !== this.dessus && !(o.cameraFilter & dessus)) o.cameraFilter |= dessus;
    }
    // (et la caméra de l'interface ne doit pas tester les clics sur le monde, à de fausses positions)
    const principal = this.cameras.main.id | dessus;
    const marquer = liste => { for (const o of liste) { o.cameraFilter |= principal; if (o.list) marquer(o.list); } };
    marquer(this.monde.list);
  }

  dansCadre(p) {
    const Z = this.Z, c = this.cadre;
    return p.x >= c.x * Z && p.x <= (c.x + c.l) * Z && p.y >= c.y * Z && p.y <= (c.y + c.h) * Z;
  }

  // Vrai si le geste en cours est un glissement (on ne choisit pas une contrée en glissant la carte)
  aGlisse() { return !!(this.glisse && this.glisse.bouge); }

  appliquerVue(k, x, y) {
    this.k = k;
    // (on borne nous-mêmes le centre : la caméra ne recalcule sa vue qu'à l'image suivante)
    const dx = this.cadre.l / 2 / k, dy = this.cadre.h / 2 / k, L = this.limites;
    x = 2 * dx >= L.x1 - L.x0 ? (L.x0 + L.x1) / 2 : Phaser.Math.Clamp(x, L.x0 + dx, L.x1 - dx);
    y = 2 * dy >= L.y1 - L.y0 ? (L.y0 + L.y1) / 2 : Phaser.Math.Clamp(y, L.y0 + dy, L.y1 - dy);
    this.centre = { x, y };
    this.camCarte.setZoom(this.Z * k);
    this.camCarte.centerOn(x, y);
    // Les textes gardent la même taille à l'écran ; les détails (noms des contrées, fanions)
    // n'apparaissent qu'en s'approchant.
    const proche = k >= 0.75;
    for (const e of this.etiquettes) {
      // (05/11) en s'éloignant, les textes rapetissent un peu à l'écran (k^-0,8 au lieu de 1/k ; les noms des royaumes k^-0,75 ;
      // ceux des contrées et les fanions, qui ne se montrent que de près, k^-0,5) : la vue « Tout voir » respire
      const s = Math.max(1, Math.pow(k, e.royaume ? -0.75 : e.detail ? -0.5 : -0.8)) * (e.royaume ? (proche ? 0.85 : 1) : 1);
      e.o.setScale(s);
      if (e.detail) e.o.setVisible(proche);
      if (e.sousEtoiles !== undefined) e.o.y = e.sousEtoiles + 10.5 * (s - 1);
      // (05/11) le nom d'un royaume, grossi quand on s'éloigne, ne déborde jamais du parchemin
      // (05/11) et il se pose là où il ne touche ni médaillon ni autre nom (de loin, puis de près : NOMS_ROYAUMES_CARTE)
      if (e.royaume && e.gauche !== undefined) {
        const m = 4 * s, d = (NOMS_ROYAUMES_CARTE[proche ? 'pres' : 'loin'][e.cle] || [0, 0]);
        e.o.setPosition(Phaser.Math.Clamp(e.x + d[0], e.gauche * s + m, MONDE_CARTE.L - e.droite * s - m), Phaser.Math.Clamp(e.y + d[1], e.demiH * s + m, MONDE_CARTE.H - e.demiH * s - m));
      }
      // (05/11) en « Tout voir », quand le monde connu ne montre qu'une partie de la carte : le nom d'un royaume que le
      // cadre couperait (une terre encore inconnue, au bord) ne se montre pas, plutôt qu'à moitié
      if (e.royaume && e.gauche !== undefined) {
        const tout = k <= this.kMin + 1e-3, X = e.o.x, Y = e.o.y;
        const x0 = X - e.gauche * s, x1 = X + e.droite * s, y0 = Y - e.demiH * s, y1 = Y + e.demiH * s;
        const sousUnNouveau = proche && this.etiquettes.some(n => n.nouveau && n.o.active && (() => { const b = n.o.getBounds(); return b.x < x1 && x0 < b.right && b.y < y1 && y0 < b.bottom; })());
        e.o.setVisible(!sousUnNouveau && (!tout || (x0 >= x - dx && x1 <= x + dx && y0 >= y - dy && y1 <= y + dy)));
      }
    }
    if (this.reperes) this.reperes.setVisible(true);
  }

  // Une vue animée vers (x, y) au zoom k
  vue(k, x, y, fin) {
    const c = this.centre;
    const etat = { k: this.k, x: c.x, y: c.y };
    this.tweens.add({ targets: etat, k, x, y, duration: 450, ease: 'Sine.easeInOut',
      onUpdate: () => this.appliquerVue(etat.k, etat.x, etat.y), onComplete: () => fin && fin() });
  }

  // Où se trouve un point du monde, à l'écran (en coordonnées de l'interface)
  versEcran(x, y) {
    const c = this.centre;
    return { x: this.cadre.x + this.cadre.l / 2 + (x - c.x) * this.k, y: this.cadre.y + this.cadre.h / 2 + (y - c.y) * this.k };
  }

  fermerBulle() {
    if (!this.bulle) return;
    this.bulle.removeAll(true);
    this.anneau.setVisible(false);
    this.zoneChoisie = null;
  }

  memoriserVue() {
    const c = this.centre;
    this.G.vueCarte = { k: this.k, x: Math.round(c.x), y: Math.round(c.y) };
  }

  // Les petits personnages posés sur la carte : missions en cours, lettres, voyageurs placés.
  dessinerReperes() {
    const G = this.G;
    this.reperes.removeAll(true);
    const parZone = {};
    const ajouter = (zone, race, texte, couleur, choisi, glyphe = null) => (parZone[zone] = parZone[zone] || []).push({ race, texte, couleur, choisi, glyphe });
    creerGlyphesHD(this);
    for (const p of enMission(G)) ajouter(p.voyageur.zone, p.voyageur.race, `${p.retour}`, '#3b2410', false, 'epees');
    for (const e of G.file) {
      if (e.type !== 'client' || !e.voyageur.queteId || this.voyageurs.includes(e.voyageur)) continue;
      ajouter(e.voyageur.zone, e.voyageur.race, '', '#1f5aa0', false, estCible(G, e.voyageur) ? 'crane' : 'lettre');
    }
    for (const v of this.voyageurs) {
      if (this.place[v.id]) ajouter(this.place[v.id], v.race, prenomDe(v.nom).slice(0, 6), '#2f6a2a', v === this.selection);
    }
    for (const [zone, liste] of Object.entries(parZone)) {
      const z = ZONES[zone];
      liste.slice(0, 6).forEach((r, i) => {
        const x = z.x - (Math.min(liste.length, 6) - 1) * 18 + i * 36;
        const y = z.y - 22;
        if (r.choisi) this.reperes.add(this.add.circle(x, y - 12, 15, 0xffe066, 0.6));
        this.reperes.add(imageCorps(this, x, y, r.race, 1.6));
        // Les étiquettes alternent de hauteur pour ne pas se chevaucher.
        const yt = y - 26 - (i % 2) * 12;
        // (v0.68) un petit pictogramme en pixel art (épées, lettre, crâne) plutôt qu'un émoji
        if (r.glyphe) {
          const t = r.texte ? this.add.text(0, 0, r.texte, style(11, r.couleur, { fontStyle: 'bold' })).setOrigin(0, 1) : null;
          const lg = 14 + (t ? t.width + 2 : 0);
          this.reperes.add(this.add.rectangle(x, yt - 8, lg + 4, 18, 0xf3e6c8).setStrokeStyle(1, 0x8a6a3a));
          this.reperes.add(this.add.image(x - lg / 2 + 7, yt - 8, 'glyphe_' + r.glyphe).setScale(1.2));
          if (t) { t.setPosition(x - lg / 2 + 15, yt); this.reperes.add(t); }
        } else this.reperes.add(this.add.text(x, yt, r.texte, style(11, r.couleur, { fontStyle: 'bold', backgroundColor: '#f3e6c8', padding: { x: 2, y: 0 } })).setOrigin(0.5, 1));
      });
      if (liste.length > 6) this.reperes.add(this.add.text(z.x + 82, z.y - 36, `+${liste.length - 6}`, style(12, '#3b2410', { fontStyle: 'bold' })));
    }
  }

  // --- La bande des voyageurs du jour ---

  creerBande() {
    this.add.rectangle(480, 476, 932, 100, 0x2a1a10).setStrokeStyle(2, 0xc9a227);
    // La légende des repères, à part dans la bande : rien ne peut la cacher.
    this.add.text(24, 438, 'Sur la carte :', style(12, '#c9b48a', { fontStyle: 'bold italic' }));
    creerGlyphesHD(this);
    [['epees', 'en mission (jour\ndu retour)', 466], ['lettre', 'une quête', 492], ['crane', 'ta cible', 510]].forEach(([g, t, y]) => {
      this.add.image(32, y, 'glyphe_' + g).setScale(1.7);
      this.add.text(44, y, t, style(11, '#f3e6c8', { lineSpacing: -2 })).setOrigin(0, 0.5);
    });
    this.add.rectangle(138, 476, 2, 84, 0x8a6a3a);
    this.cartes = this.add.container(0, 0);
    const libelle = this.planification ? 'Préparer les sacs ▶' : this.consultation ? '◀ Ranger la carte' : 'Retour au comptoir';
    this.boutonFin = creerBouton(this, 840, 476, 190, libelle, () => this.terminer());
    this.boutonFin.label.setFontSize(16);
    // (v1.42) ce qu'il reste à faire, près du bouton ; le bouton luit quand tout est prêt
    this.texteRestants = this.add.text(840, 444, '', style(12, '#f3d98a', { fontStyle: 'bold italic', stroke: '#1a0e06', strokeThickness: 3 })).setOrigin(0.5);
    this.lueurFin = lueurBouton(this, this.boutonFin, 190).setVisible(false);
  }

  dessinerBande() {
    this.cartes.removeAll(true);
    const largeur = Math.min(130, 590 / Math.max(1, this.voyageurs.length));
    this.voyageurs.forEach((v, i) => {
      const x = 144 + largeur * (i + 0.5);
      const choisi = v === this.selection;
      const zone = this.place[v.id];
      const fond = this.add.rectangle(x, 476, largeur - 6, 90, choisi ? 0x6b4a22 : 0x3b2410)
        .setStrokeStyle(2, choisi ? 0xffe066 : zone ? 0x4f7a3a : 0x8a6a3a).setInteractive({ useHandCursor: true });
      fond.on('pointerdown', () => { this.selection = v; this.tout(); });
      this.cartes.add([fond,
        imageCorps(this, x, 470, v, 2.4),
        this.add.text(x, 474, prenomDe(v.nom), style(14, couleurNom(this.G, v.nom, true), { fontStyle: 'bold' })).setOrigin(0.5, 0),
        this.add.text(x, 490, zone ? '→ ' + ZONES[zone].nom.replace(/^(Les |La |L')/, '') : nomRang(v.niveau, true),
          style(12, zone ? '#b8e0a0' : '#c9b48a', { align: 'center', wordWrap: { width: largeur - 12 } })).setOrigin(0.5, 0)]);
    });
    if (!this.voyageurs.length) {
      this.cartes.add(this.add.text(440, 476, this.consultation ? 'Touche une contrée pour la découvrir : sa conquête, son butin, ce qu\'il faut y emporter.' : "Personne ne cherche l'aventure aujourd'hui : tes clients savent déjà où ils vont.",
        style(15, '#f3e6c8', { fontStyle: 'italic', wordWrap: { width: 580 } })).setOrigin(0.5));
    }
  }

  tout() {
    const v = this.selection;
    const restants = this.voyageurs.filter(x => !this.place[x.id]).length;
    const puce = v ? `${nomRang(v.niveau)} · ${NOMS_RACES[v.race] || v.race}` : '';
    if (!v) this.titre.setText('La carte de tes alentours');
    else if (this.planification && !restants) this.titre.setText('Tout le monde a sa destination !');
    else this.titre.setText(`Où envoyer ${prenomDe(v.nom)} ?`);
    const avecPuce = !!v && !(this.planification && !restants);
    this.puceTitre.setText(puce).setVisible(avecPuce);
    this.texteRestants.setText(this.planification ? (restants ? `encore ${restants} à placer` : 'à toi de préparer les sacs') : '');
    this.lueurFin.setVisible(!!this.planification && !restants);
    // (v0.85) jamais sous les plaques du jour et de la réputation (en haut à gauche, jusqu'à x 226)
    this.titre.setFontSize(19);
    const largeurTotale = this.titre.width + (avecPuce ? 10 + this.puceTitre.width : 0);
    const gauche = Math.max(480 - largeurTotale / 2, 232);
    this.titre.setX(gauche + this.titre.width / 2);
    this.puceTitre.setX(gauche + this.titre.width + 10);
    this.dessinerBande();
    this.dessinerReperes();
    if (this.zoneChoisie) this.choisirZone(this.zoneChoisie);
  }

  // --- La bulle d'une zone ---

  choisirZone(cle) {
    const G = this.G;
    const v = this.selection;
    const z = ZONES[cle];
    // De loin, on s'approche d'abord de la contrée, puis la bulle s'ouvre.
    const ecran = this.versEcran(z.x, z.y);
    if (this.k < 0.75 || ecran.x < 40 || ecran.x > 920 || ecran.y < 70 || ecran.y > 400) {
      this.fermerBulle();
      return this.vue(Math.max(this.k, 0.9), z.x, z.y, () => this.choisirZone(cle));
    }
    this.zoneChoisie = cle;
    this.anneau.setVisible(true).setPosition(z.x, z.y);
    this.bulle.removeAll(true);
    const ouverte = zoneOuverte(G, cle);
    const w = 360;
    // On écrit d'abord le contenu (en haut à gauche), puis on mesure et on place la bulle.
    const contenu = this.add.container(0, 0);
    const fermer = this.add.text(w - 22, 0, '✕', style(14, '#c9b48a', { fontStyle: 'bold' })).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    fermer.on('pointerdown', () => this.fermerBulle());
    let bas;
    if (!ouverte) {
      contenu.add(this.add.text(0, 0, 'Une contrée inconnue', style(15, '#f3d98a', { fontStyle: 'bold' })));
      // Ce qu'il manque pour l'ouvrir : la réputation (ou une découverte), et des retours réussis.
      const c = conditionsZone(G, cle);
      const lignes = [`Personne ne sait vraiment ce qu'il y a là-bas${z.camp === 'mal' ? ", dans les terres d'ombre" : z.camp === 'bien' ? ', dans les terres de lumière' : ''}. Pour l'ouvrir :`,
        `${c.reputation ? '✓' : '✗'} une réputation de ${z.reputation} (toi : ${arrondi(G.reputation)}), ou qu'un aventurier la découvre`];
      if (z.royaume) { const a = avanceeRoyaume(G, z.royaume); lignes.push(`${ROYAUMES[z.royaume].nom} : ${a.faites} / ${a.total} contrée${a.total > 1 ? 's' : ''} conquise${a.total > 1 ? 's' : ''}. Toutes conquises : ${(G.armure || []).length < ARMURE.length ? "une pièce de l'armure et une arme légendaire" : 'son arme légendaire'}.`); }
      if (c.besoin) lignes.push(`${c.faits >= c.besoin ? '✓' : '✗'} ${c.besoin} missions réussies dans des zones à ${z.danger - 1} étoile${z.danger > 2 ? 's' : ''} (${Math.min(c.faits, c.besoin)} / ${c.besoin})`);
      const texte = this.add.text(0, 24, lignes.join('\n'), style(14, '#f3e6c8', { wordWrap: { width: w - 24 }, lineSpacing: 3 }));
      contenu.add(texte);
      bas = texte.y + texte.height;
    } else {
      contenu.add(this.add.text(0, 0, `${z.nom}  ${'★'.repeat(z.danger)}`, style(14, '#f3d98a', { fontStyle: 'bold' })));
      const nc = (G.conquete || {})[cle] || 0;
      contenu.add(this.add.text(w - 44, 2, nc >= conqueteZone(cle) ? '⚑ Conquise !' : `⚑ Conquête ${nc}/${conqueteZone(cle)}`, style(12, nc >= conqueteZone(cle) ? '#f0c840' : '#c9b48a', { fontStyle: 'bold' })).setOrigin(1, 0));
      const quetes = z.quetes.map(q => QUETES[q]);
      const dureeMin = Math.min(...quetes.map(q => q.duree[0]));
      const dureeMax = Math.max(...quetes.map(q => q.duree[1]));
      let ligne = `${dureeMin} à ${dureeMax} jours`;
      if (v) {
        const mult = BUTIN_PAR_DANGER[z.danger] / BUTIN_PAR_DANGER[1] * NIVEAUX_AVENTURIER[v.niveau].butin * (aSaMesure(v, cle) ? BONUS_A_SA_MESURE : 1);
        const butinMin = Math.round(Math.min(...quetes.map(q => q.butin[0])) * mult);
        const butinMax = Math.round(Math.max(...quetes.map(q => q.butin[1])) * mult);
        ligne = `Butin espéré pour ${prenomDe(v.nom)} : ${butinMin} à ${butinMax} p. · ${ligne}` + (aSaMesure(v, cle) ? `\n★ À sa mesure : ${v.feminin ? 'elle' : 'il'} y va avec plaisir (+15 % de butin)` : '');
      }
      const texte = this.add.text(0, 22, `${z.description}\n${ligne}`, style(13, '#f3e6c8', { wordWrap: { width: w - 24 }, lineSpacing: 2 }));
      contenu.add(texte);
      // Les provisions qu'on y emporte souvent, sur leur propre rangée, avec ce que tu as en stock.
      const yIcones = texte.y + texte.height + 8;
      contenu.add(this.add.text(0, yIcones, 'Il faut souvent :', style(12, '#c9b48a', { fontStyle: 'italic' })));
      besoinsDeZone(cle).forEach((id, i) => {
        const enStock = G.stock[id] || 0;
        const gx = 118 + i * 58;
        contenu.add(this.add.rectangle(gx + 22, yIcones + 8, 54, 36, 0x3b2410).setStrokeStyle(1, 0x8a6a3a));
        contenu.add(this.add.image(gx + 12, yIcones + 8, iconeObjet(this, id)).setScale(2));
        contenu.add(this.add.text(gx + 30, yIcones + 8, `×${enStock}`, style(13, enStock ? '#b8e0a0' : '#f0a8a0', { fontStyle: 'bold' })).setOrigin(0, 0.5));
      });
      bas = yIcones + 30;
      if (v) {
        const refus = refusZone(G, v, cle);
        if (refus) {
          const t = this.add.text(w - 24, bas + 6, refus, style(13, '#f0a8a0', { fontStyle: 'italic', align: 'right', wordWrap: { width: w - 24 } })).setOrigin(1, 0);
          contenu.add(t);
          bas = t.y + t.height;
        } else {
          const envoyer = this.add.text(w - 24, bas + 6, `Envoyer ${prenomDe(v.nom)} ici ▶`,
            style(15, '#fff4dc', { fontStyle: 'bold', backgroundColor: '#4f7a3a', padding: { x: 8, y: 5 } })).setOrigin(1, 0).setInteractive({ useHandCursor: true });
          envoyer.on('pointerdown', () => this.envoyer(cle));
          contenu.add(envoyer);
          bas = envoyer.y + envoyer.height;
        }
      }
    }
    contenu.add(fermer);
    const h = bas + 20;
    const e = this.versEcran(z.x, z.y), ecart = 62 * this.k;
    const bx = Phaser.Math.Clamp(e.x + (e.x > 480 ? -w / 2 - ecart : w / 2 + ecart), w / 2 + 18, 942 - w / 2);
    const by = Phaser.Math.Clamp(e.y, 54 + h / 2, 420 - h / 2);
    contenu.setPosition(bx - w / 2 + 12, by - h / 2 + 10);
    this.bulle.add(this.add.rectangle(bx, by, w, h, 0x2a1a10, 0.96).setStrokeStyle(2, 0xc9a227));
    this.bulle.add(contenu);
  }

  envoyer(cle) {
    const v = this.selection;
    if (!v) return;
    envoyerDans(this.G, v, cle);
    Son.jouer('plume');
    if (!this.planification) return this.fermer({ destination: cle });
    this.place[v.id] = cle;
    const entree = this.G.file.find(e => e.voyageur === v);
    if (entree) entree.planifie = true;
    // On passe au suivant qui n'a pas encore de destination.
    this.selection = this.voyageurs.find(x => !this.place[x.id]) || null;
    this.fermerBulle();
    this.tout();
  }

  terminer() {
    if (this.consultation) { this.memoriserVue(); this.scene.stop(); this.scene.resume(this.consultation); return; }
    if (!this.planification) return this.fermer({ annule: true });
    if (enTransition(this)) return;
    this.memoriserVue();
    // (v0.68) toutes les caméras s'éteignent ensemble : celle de l'interface aussi, sinon la case de
    // dialogue de Garrick restait visible pendant le fondu, par-dessus le noir
    for (const cam of this.cameras.cameras) cam.fadeOut(400);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Comptoir'));
  }

  fermer(donnees) {
    this.memoriserVue();
    this.scene.stop();
    this.scene.resume('Comptoir', donnees);
  }
}

// Ouvrir le comptoir le matin : la file d'attente du jour se forme, et s'il y a des
// voyageurs qui cherchent l'aventure, on passe d'abord par la carte pour les placer.
// D'abord la façade du shop (sauf si on vient de la voir), puis la carte ou le comptoir.
function commencerJournee(scene, ouvrir = true, facade = true) {
  const G = window.GAME;
  if (enTransition(scene)) return;
  if (ouvrir) ouvrirComptoir(G);
  const aPlacer = G.file.some(e => e.type === 'client' && !e.voyageur.queteId);
  const suite = aPlacer ? 'Carte' : 'Comptoir';
  for (const cam of scene.cameras.cameras) cam.fadeOut(400);   // (v0.68 : toutes les caméras, interface comprise)
  scene.cameras.main.once('camerafadeoutcomplete', () => scene.scene.start(facade ? 'Facade' : suite, facade ? { suite } : {}));
}

// (v0.93) La carte du monde, consultée de partout : la page d'où l'on vient attend en pause.
function ouvrirCarteMonde(scene) {
  // (on regarde s'il y a une transition sans en marquer une : sinon le clic suivant serait ignoré)
  if ((scene._transition && performance.now() - scene._transition < 1500) || scene.enPartance || scene.scene.isActive('Carte')) return;
  Son.jouer('plume');
  scene.scene.pause();
  scene.scene.launch('Carte', { consultation: true, retour: scene.scene.key });
}
// Une petite carte roulée (le bouton « La carte » des pages et des panneaux) ; (la fin du 16 px) en HD, à la même taille :
// le parchemin ombré et ses plis, les bois, un lac, des montagnes, le chemin rouge et sa croix, les deux rouleaux
function texCarteMonde(scene) {
  const cle = 'iconeCarteMonde';
  if (scene.textures.exists(cle)) return cle;
  const t = toileDecor(30, 24); t.rampes.bois = rampe(0x5a8a3a); t.rampes.lac = rampe(0x6a8ac0); t.rampes.mont = rampe(0x8a6a4a); t.rampes.rouleau = rampe(0x8a5a2a);
  t.forme('parchemin', (x, y) => (x >= 2 && x <= 27 && y >= 3 && y <= 20 ? [0, (y - 11.5) / 14, 0.9] : null),
    { motif: (x, y) => (x === 10 || x === 19 ? -1 : x === 11 || x === 20 ? 0.6 : fbm(x * 0.35, y * 0.35, 5851) > 0.64 ? -0.6 : 0) });
  for (const [cx, cy, rx, ry] of [[6, 7.5, 2.6, 1.8], [8, 9, 1.8, 1.4], [15.5, 15, 2.6, 2]]) t.forme('bois', ellipsoide(cx, cy, rx, ry), { decalage: 0.2 });
  t.forme('lac', ellipsoide(24, 6.5, 2.6, 1.6), { decalage: 0.1 });
  for (let y = 8; y <= 13; y++) t.poser(24 + (y > 10 ? 1 : 0), y, 'lac', 3);
  for (const [x0, y0] of [[4, 17], [17, 7]]) for (let k = 0; k < 3; k++) { t.poser(x0 + k, y0 - Math.min(k, 2 - k), 'mont', 4 - k % 2); t.poser(x0 + k, y0 + 1, 'mont', 1); }
  for (const [x, y] of [[5, 13], [7, 13], [9, 12], [11, 12], [13, 11], [15, 10], [17, 10], [19, 11], [21, 12]]) t.poser(x, y, 'tissuRouge', 3);
  for (const [x, y] of [[22, 14], [24, 14], [23, 15], [22, 16], [24, 16]]) t.poser(x, y, 'tissuRouge', 4);
  for (const x0 of [0, 27]) t.forme('rouleau', (x, y) => (x >= x0 && x <= x0 + 2 && y >= 0 && y <= 23 ? [(x - x0 - 1) / 1.6, 0, 0.8] : null), { decalage: 0.2 });
  t.contour(); t.texture(scene, cle);
  return cle;
}
// Le bouton « La carte » : l'icône et son nom, qui grandissent un peu au survol
function boutonCarteMonde(scene, x, y, { profondeur = 30, libelle = 'La carte', couleur = '#f3d98a', compact = false } = {}) {
  const c = scene.add.container(x, y).setDepth(profondeur);
  // (compact : en largeur, l'icône à gauche du nom, pour les pages où la place manque en hauteur)
  const fond = compact ? scene.add.rectangle(0, 0, libelle.length > 5 ? 118 : 96, 34, 0x2a1a10, 0.85).setStrokeStyle(2, 0xc9a227) : scene.add.rectangle(0, 4, 74, 62, 0x2a1a10, 0.85).setStrokeStyle(2, 0xc9a227);
  const icone = compact ? scene.add.image(libelle.length > 5 ? -36 : -26, 0, texCarteMonde(scene)).setScale(1.1) : scene.add.image(0, -4, texCarteMonde(scene)).setScale(2);
  const texte = compact ? scene.add.text(libelle.length > 5 ? -14 : -4, 0, libelle, style(14, couleur, { fontStyle: 'bold' })).setOrigin(0, 0.5) : scene.add.text(0, 24, libelle, style(12, couleur, { fontStyle: 'bold' })).setOrigin(0.5);
  const e = icone.scale;
  c.add([fond, icone, texte]);
  fond.setInteractive({ useHandCursor: true })
    .on('pointerover', () => icone.setScale(e * 1.1)).on('pointerout', () => icone.setScale(e))
    .on('pointerdown', () => ouvrirCarteMonde(scene));
  return c;
}
// Le panneau de bois planté sur la place (marché, marché noir), une carte du monde punaisée dessus
function panneauCarteMonde(scene, x, yBase, { echelle = 1, nom = 'La carte', sombre = false } = {}) {
  const c = scene.add.container(x, yBase).setScale(echelle);
  const bois = sombre ? 0x3a2a20 : 0x6b4a22, clair = sombre ? 0x5a4030 : 0x9a7040;
  c.add([
    scene.add.rectangle(0, -26, 6, 52, bois).setStrokeStyle(2, 0x1a0e06),             // le poteau
    scene.add.rectangle(0, -62, 64, 44, bois).setStrokeStyle(2, 0x1a0e06),            // la planche
    scene.add.rectangle(0, -75, 60, 3, clair), scene.add.rectangle(0, -52, 60, 2, clair),
    scene.add.image(0, -62, texCarteMonde(scene)).setScale(1.6),                       // la carte punaisée
    scene.add.circle(-20, -78, 2, 0xc82a20), scene.add.circle(20, -78, 2, 0xc82a20),
  ]);
  const t = scene.add.text(0, 4, nom, style(12, '#fff4dc', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 4 })).setOrigin(0.5, 0);
  c.add(t);
  const zone = scene.add.rectangle(0, -40, 72, 100, 0xffffff, 0).setInteractive({ useHandCursor: true });
  zone.on('pointerdown', () => ouvrirCarteMonde(scene));
  c.add(zone);
  return c;
}
