// La carte du monde. Deux usages :
// - le matin, en ouvrant le comptoir (`planification`) : tu places d'abord tous les voyageurs
//   du jour qui cherchent l'aventure sur les zones de ton choix, puis tu prépares leurs sacs ;
// - au comptoir (`comptoir`) : pour un seul voyageur, le comptoir attend en pause.
// La carte montre aussi où sont tes aventuriers en mission et les clients qui t'ont écrit :
// une vue d'ensemble de tes alentours et de ta progression.
// Les zones dangereuses s'ouvrent avec la réputation, ou quand un aventurier les découvre.
class CarteScene extends Phaser.Scene {
  constructor() { super('Carte'); }

  init(data) {
    this.comptoir = data.comptoir || null;
    this.planification = !this.comptoir;
    this.zoneChoisie = null;
  }

  create() {
    const G = this.G = window.GAME;
    // Les voyageurs à placer : tout ceux du jour sans destination, ou celui du comptoir.
    this.voyageurs = this.comptoir ? [this.comptoir.voyageur]
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
    this.dessinerZones();
    this.reperes = this.add.container(0, 0).setDepth(5);
    this.monde.add(this.reperes);
    this.creerBande();
    this.creerCamera();
    this.tout();
    this.cameras.main.fadeIn(300);
    this.camCarte.fadeIn(300);
    if (this.nouvelles.length) this.time.delayedCall(400, () => this.devoiler(this.nouvelles.slice()));
    else if (!this.comptoir) this.time.delayedCall(500, () => conseilGarrick(this, 'carte'));
  }

  // Le dévoilement d'une contrée qui vient de s'ouvrir : la caméra y glisse, la brume se dissipe,
  // le médaillon se déplie avec une fanfare, puis son nom et ses étoiles s'écrivent.
  devoiler(liste) {
    const cle = liste.shift();
    if (!cle) {
      // Le monde connu s'est agrandi : on dézoome pour le voir en entier
      this.vue(this.kMin, this.limites.cx, this.limites.cy, () => { this.devoilement = false; if (!this.comptoir) conseilGarrick(this, 'carte'); });
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
        this.monde.add(neuf); this.etiquettes.push({ o: neuf, etiquette: true });
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
      if (EMBLEME_ROYAUME[cle]) groupe.add(this.add.image(-t.width / 2 - 10, 0, 'embleme_' + EMBLEME_ROYAUME[cle]).setScale(0.5));
      this.monde.add(groupe);
      this.etiquettes.push({ o: groupe, royaume: true });
    }
    for (const [x, y, nom, angle] of [[60, 520, "Mer d'Opale", -80], [1440, 600, 'La Grande Muraille', 88], [300, 540, 'Le Grand Fleuve', -42]]) {
      const t = this.add.text(x, y, nom, style(12, '#3b2a4a', { fontStyle: 'italic', stroke: '#f0e2bc', strokeThickness: 3 })).setOrigin(0.5).setAngle(angle).setAlpha(0.8);
      this.monde.add(t);
      this.etiquettes.push({ o: t, detail: true });
    }
    // Ton comptoir
    const depart = MONDE_CARTE.comptoir;
    this.monde.add(this.add.image(depart.x, depart.y + 14, 'halo').setScale(0.9, 0.5).setTint(0xffe8a0).setAlpha(0.7));
    this.monde.add(this.add.image(depart.x, depart.y + 14, 'comptoirCarteHD').setOrigin(0.5, 1).setScale(2));
    const ici = this.add.text(depart.x, depart.y + 16, 'Ton comptoir', style(12, '#3b2410', { fontStyle: 'bold', stroke: '#f0e2bc', strokeThickness: 4 })).setOrigin(0.5, 0);
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
      p.nom = ajouter(this.add.text(z.x, z.y + 40, ouverte ? z.nom : '🔒 ???', style(13, ouverte ? '#2a1808' : '#6a6458', { fontStyle: 'bold', align: 'center', wordWrap: { width: 190 }, stroke: '#f0e2bc', strokeThickness: 4 })).setOrigin(0.5, 0), { etiquette: true, detail: true });
      pastille.on('pointerup', () => { if (!this.aGlisse() && !this.devoilement) this.choisirZone(cle); });
      // La conquête : un fanion avec le compte des missions réussies, doré une fois conquise
      if (ouverte) {
        const n = (G.conquete || {})[cle] || 0;
        const conquise = n >= CONQUETE_ZONE;
        const fanion = ajouter(this.add.text(z.x + 50, z.y - 22, conquise ? '⚑ Conquise' : `⚑ ${n}/${CONQUETE_ZONE}`,
          style(11, conquise ? '#7a4a00' : '#3b2410', { fontStyle: 'bold', backgroundColor: conquise ? '#f0c840' : '#e8d8b0', padding: { x: 3, y: 1 } })).setOrigin(0.5), { etiquette: true, detail: true });
        if (conquise) this.tweens.add({ targets: fanion, angle: { from: -4, to: 4 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
    }
    // De gros nuages couvrent les contrées pas encore ouvertes : elles se dévoileront plus tard
    for (const [cle, z] of Object.entries(ZONES)) {
      if (zoneOuverte(G, cle) && !this.nouvelles.includes(cle)) continue;
      const p = this.pieces[cle];
      p.nuages = [[-38, -8, 0, 1.9], [30, -14, 1, 1.7], [0, 12, 2, 2.1], [-14, -24, 1, 1.3], [44, 10, 0, 1.5], [-46, 14, 2, 1.4], [16, -30, 2, 1.2]].map(([dx, dy, v, e], i) => {
        const n = this.add.image(z.x + dx, z.y + dy, 'nuageCarte_' + ((v + cle.length) % 3)).setScale(e).setAlpha(0.96).setFlipX((i + cle.length) % 2 === 0);
        this.monde.add(n);
        // ils dérivent doucement sur place
        this.tweens.add({ targets: n, x: n.x + (i % 2 ? 7 : -7), duration: 2600 + i * 500 + cle.length * 90, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        return n;
      });
    }
    const conquises = Object.keys(ZONES).filter(c => ((G.conquete || {})[c] || 0) >= CONQUETE_ZONE).length;
    this.dessus.add(this.add.text(938, 402, `⚑ Contrées conquises : ${conquises} / ${Object.keys(ZONES).length}`, style(12, '#f3e6c8', { fontStyle: 'bold', backgroundColor: '#2a1a10cc', padding: { x: 5, y: 2 } })).setOrigin(1, 0.5));
    G.zonesVuesCarte = zonesOuvertes(G);
  }

  // --- La caméra du monde : on la fait glisser (glisser-déposer) et zoomer (molette, boutons) ---

  creerCamera() {
    const Z = this.Z = this.cameras.main.zoom;
    this.cadre = { x: 14, y: 50, l: 932, h: 368 };
    this.kMax = 1.3;
    // Le monde connu : la carte ne montre que les contrées ouvertes (et un peu autour), zoomée
    // dessus ; elle se dézoome à mesure que de nouvelles contrées s'ouvrent.
    this.limiter(Object.keys(ZONES).filter(c => zoneOuverte(this.G, c) && !this.nouvelles.includes(c)));
    this.camCarte = this.cameras.add(this.cadre.x * Z, this.cadre.y * Z, this.cadre.l * Z, this.cadre.h * Z)
      .setBounds(0, 0, MONDE_CARTE.L, MONDE_CARTE.H).setBackgroundColor('#2a1a10');
    this.camDessus = this.cameras.add(0, 0, 960 * Z, 540 * Z).setOrigin(0, 0).setZoom(Z);
    this.cameras.main.ignore([this.monde, this.dessus]);
    this.events.on('postupdate', this.filtrerCameras, this);
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
      const b = this.add.text(xb, 68, texte, style(15, '#fff4dc', { fontStyle: 'bold', backgroundColor: '#3b2410cc', padding: { x: 7, y: 2 } }))
        .setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
      b.on('pointerdown', () => { Son.jouer('clic'); action(); });
      this.dessus.add(b);
      xb += b.width + 6;
      return b;
    };
    const c = () => this.centre;
    bouton('＋', () => { this.fermerBulle(); this.vue(Math.min(this.kMax, this.k * 1.4), c().x, c().y); });
    bouton('－', () => { this.fermerBulle(); this.vue(Math.max(this.kMin, this.k / 1.4), c().x, c().y); });
    bouton('🗺 Tout', () => { this.fermerBulle(); this.vue(this.kMin, this.limites.cx, this.limites.cy); });
  }

  // Les limites du monde connu : un rectangle autour des contrées ouvertes et du comptoir, avec
  // de la marge, jamais plus grand que le monde ; le zoom minimal est celui qui le montre en entier.
  limiter(ouvertes) {
    const pts = [[MONDE_CARTE.comptoir.x, MONDE_CARTE.comptoir.y], ...ouvertes.map(c => [ZONES[c].x, ZONES[c].y])];
    const marge = 150;
    const x0 = Math.max(0, Math.min(...pts.map(p => p[0])) - marge), x1 = Math.min(MONDE_CARTE.L, Math.max(...pts.map(p => p[0])) + marge);
    const y0 = Math.max(0, Math.min(...pts.map(p => p[1])) - marge), y1 = Math.min(MONDE_CARTE.H, Math.max(...pts.map(p => p[1])) + marge + 30);
    // (au moins un cadre entier, pour qu'on puisse toujours glisser un peu)
    const l = Math.max(x1 - x0, this.cadre.l), h = Math.max(y1 - y0, this.cadre.h);
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    this.limites = { x0: Math.max(0, cx - l / 2), x1: Math.min(MONDE_CARTE.L, cx + l / 2), y0: Math.max(0, cy - h / 2), y1: Math.min(MONDE_CARTE.H, cy + h / 2), cx, cy };
    this.kMin = Math.max(this.cadre.l / (this.limites.x1 - this.limites.x0), this.cadre.h / (this.limites.y1 - this.limites.y0), this.cadre.l / MONDE_CARTE.L);
    this.kMin = Math.min(this.kMin, 1.1);
  }

  // Ce que la caméra du monde ne filme pas : tout sauf le monde (et inversement pour l'interface).
  filtrerCameras() {
    if (!this.camCarte || !this.camCarte.id) return;
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
    x = Phaser.Math.Clamp(x, L.x0 + dx, Math.max(L.x0 + dx, L.x1 - dx));
    y = Phaser.Math.Clamp(y, L.y0 + dy, Math.max(L.y0 + dy, L.y1 - dy));
    this.centre = { x, y };
    this.camCarte.setZoom(this.Z * k);
    this.camCarte.centerOn(x, y);
    // Les textes gardent la même taille à l'écran ; les détails (noms des contrées, fanions)
    // n'apparaissent qu'en s'approchant.
    const proche = k >= 0.75;
    for (const e of this.etiquettes) {
      e.o.setScale(Math.max(1, 1 / k) * (e.royaume ? (proche ? 0.85 : 1) : 1));
      if (e.detail) e.o.setVisible(proche);
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
    const ajouter = (zone, race, texte, couleur, choisi) => (parZone[zone] = parZone[zone] || []).push({ race, texte, couleur, choisi });
    for (const p of enMission(G)) ajouter(p.voyageur.zone, p.voyageur.race, `⚔${p.retour}`, '#3b2410');
    for (const e of G.file) {
      if (e.type !== 'client' || !e.voyageur.queteId || this.voyageurs.includes(e.voyageur)) continue;
      ajouter(e.voyageur.zone, e.voyageur.race, estCible(G, e.voyageur) ? '☠' : '✉', estCible(G, e.voyageur) ? '#7a1a4a' : '#1f5aa0');
    }
    for (const v of this.voyageurs) {
      if (this.place[v.id]) ajouter(this.place[v.id], v.race, v.nom.split(' ')[0].slice(0, 6), '#2f6a2a', v === this.selection);
    }
    for (const [zone, liste] of Object.entries(parZone)) {
      const z = ZONES[zone];
      liste.slice(0, 6).forEach((r, i) => {
        const x = z.x - (Math.min(liste.length, 6) - 1) * 18 + i * 36;
        const y = z.y - 22;
        if (r.choisi) this.reperes.add(this.add.circle(x, y - 12, 15, 0xffe066, 0.6));
        this.reperes.add(imageCorps(this, x, y, r.race, 1.6));
        // Les étiquettes alternent de hauteur pour ne pas se chevaucher.
        this.reperes.add(this.add.text(x, y - 26 - (i % 2) * 12, r.texte, style(11, r.couleur, { fontStyle: 'bold', backgroundColor: '#f3e6c8', padding: { x: 2, y: 0 } })).setOrigin(0.5, 1));
      });
      if (liste.length > 6) this.reperes.add(this.add.text(z.x + 82, z.y - 36, `+${liste.length - 6}`, style(12, '#3b2410', { fontStyle: 'bold' })));
    }
  }

  // --- La bande des voyageurs du jour ---

  creerBande() {
    this.add.rectangle(480, 476, 932, 100, 0x2a1a10).setStrokeStyle(2, 0xc9a227);
    // La légende des repères, à part dans la bande : rien ne peut la cacher.
    this.add.text(24, 438, 'Sur la carte :', style(12, '#c9b48a', { fontStyle: 'bold italic' }));
    this.add.text(24, 456, '⚔3  en mission\n      (jour du retour)\n✉  t\'a écrit\n☠  ta cible', style(12, '#f3e6c8', { lineSpacing: 1 }));
    this.add.rectangle(138, 476, 2, 84, 0x8a6a3a);
    this.cartes = this.add.container(0, 0);
    const libelle = this.planification ? 'Préparer les sacs ▶' : 'Retour au comptoir';
    this.boutonFin = creerBouton(this, 840, 476, 190, libelle, () => this.terminer());
    this.boutonFin.label.setFontSize(16);
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
        this.add.text(x, 474, v.nom.split(' ')[0], style(14, couleurNom(this.G, v.nom, true), { fontStyle: 'bold' })).setOrigin(0.5, 0),
        this.add.text(x, 490, zone ? '→ ' + ZONES[zone].nom.replace(/^(Les |La |L')/, '') : NIVEAUX_AVENTURIER[v.niveau].nom,
          style(12, zone ? '#b8e0a0' : '#c9b48a', { align: 'center', wordWrap: { width: largeur - 12 } })).setOrigin(0.5, 0)]);
    });
    if (!this.voyageurs.length) {
      this.cartes.add(this.add.text(440, 476, "Personne ne cherche l'aventure aujourd'hui : tes clients savent déjà où ils vont.",
        style(15, '#f3e6c8', { fontStyle: 'italic', wordWrap: { width: 580 } })).setOrigin(0.5));
    }
  }

  tout() {
    const v = this.selection;
    const restants = this.voyageurs.filter(x => !this.place[x.id]).length;
    if (!v) this.titre.setText('La carte de tes alentours');
    else if (this.planification) {
      this.titre.setText(restants ? `Où envoyer ${v.nom} ? (${NIVEAUX_AVENTURIER[v.niveau].nom}, ${NOMS_RACES[v.race] || v.race}) · encore ${restants} à placer`
        : 'Tout le monde a sa destination : à toi de préparer les sacs !');
    } else {
      this.titre.setText(`Où envoyer ${v.nom} ? (${NIVEAUX_AVENTURIER[v.niveau].nom}, ${NOMS_RACES[v.race] || v.race})`);
    }
    if (this.titre.width > 930) this.titre.setFontSize(15);
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
      if ((G.armure || []).length < ARMURE.length) lignes.push("🛡 À son ouverture, la Confrérie t'enverra une pièce de l'armure.");
      if (c.besoin) lignes.push(`${c.faits >= c.besoin ? '✓' : '✗'} ${c.besoin} missions réussies dans des zones à ${z.danger - 1} étoile${z.danger > 2 ? 's' : ''} (${Math.min(c.faits, c.besoin)} / ${c.besoin})`);
      const texte = this.add.text(0, 24, lignes.join('\n'), style(14, '#f3e6c8', { wordWrap: { width: w - 24 }, lineSpacing: 3 }));
      contenu.add(texte);
      bas = texte.y + texte.height;
    } else {
      contenu.add(this.add.text(0, 0, `${z.nom}  ${'★'.repeat(z.danger)}`, style(14, '#f3d98a', { fontStyle: 'bold' })));
      const nc = (G.conquete || {})[cle] || 0;
      contenu.add(this.add.text(w - 44, 2, nc >= CONQUETE_ZONE ? '⚑ Conquise !' : `⚑ Conquête ${nc}/${CONQUETE_ZONE}`, style(12, nc >= CONQUETE_ZONE ? '#f0c840' : '#c9b48a', { fontStyle: 'bold' })).setOrigin(1, 0));
      const quetes = z.quetes.map(q => QUETES[q]);
      const dureeMin = Math.min(...quetes.map(q => q.duree[0]));
      const dureeMax = Math.max(...quetes.map(q => q.duree[1]));
      let ligne = `${dureeMin} à ${dureeMax} jours`;
      if (v) {
        const mult = BUTIN_PAR_DANGER[z.danger] / BUTIN_PAR_DANGER[1] * NIVEAUX_AVENTURIER[v.niveau].butin;
        const butinMin = Math.round(Math.min(...quetes.map(q => q.butin[0])) * mult);
        const butinMax = Math.round(Math.max(...quetes.map(q => q.butin[1])) * mult);
        ligne = `Butin espéré pour ${v.nom.split(' ')[0]} : ${butinMin} à ${butinMax} p. · ${ligne}`;
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
          const envoyer = this.add.text(w - 24, bas + 6, `Envoyer ${v.nom.split(' ')[0]} ici ▶`,
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
    if (!this.planification) return this.fermer({ annule: true });
    if (enTransition(this)) return;
    this.memoriserVue();
    this.camCarte.fadeOut(400);
    this.cameras.main.fadeOut(400);
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
  scene.cameras.main.fadeOut(400);
  scene.cameras.main.once('camerafadeoutcomplete', () => scene.scene.start(facade ? 'Facade' : suite, facade ? { suite } : {}));
}
