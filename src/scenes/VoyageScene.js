// (v1.57, planche 75 v2 validée) Le grand voyage : la maison se lève et marche jusqu'à Pont-Royal. Rien ne glisse :
// elle avance pas à pas (devant-gauche et derrière-droite ensemble, puis l'inverse), le paysage défile au rythme de ses
// pas, la fumée file derrière elle. Chaque jour : ses étapes (les vergers et la vente par la fenêtre, le gué, la Porte
// des Hommes), un imprévu à trancher, puis le soir elle s'accroupit au bord du chemin, près du feu. Le dernier jour, à
// l'aube : Pont-Royal vue du fleuve, puis la rue du pont, où elle range ses pattes sous elle et où le duc vient « saluer ».
class VoyageScene extends Cinematique {
  constructor() { super('Voyage'); }

  init() { this.fini = false; this.gueEau = null; this.paveRoyaume = null; this.accroupie = false; this.filetHisse = 0; this.gainsVifs = []; }   // (la scène peut être rejouée : rien de la fois d'avant)

  create() {
    const G = this.G = window.GAME, v = etatVoyage(G);
    if (!v.enRoute) partirEnVoyage(G);
    Sauvegarde.maintenant(G, 'Voyage');
    const sol = this.sol = 470;
    this.cameras.main.fadeIn(500);
    const Z = this.Z = this.cameras.main.zoom;
    // (l'origine de la caméra est le coin en haut à gauche : la vue va de -160 à 1120, et de -180 au sol)
    this.cameras.main.setZoom(0.75 * Z).setScroll(-160, -180);
    // le décor qui défile : trois tuiles de paysage, le chemin ; ce qui est posé au bord du chemin défile avec lui
    this.biome = 'comte';
    // (quatre tuiles, une sur deux retournée : leurs bords se raccordent toujours, sans couture dans les collines)
    this.tuiles = [-960, 0, 960, 1920].map((x, i) => this.add.image(x, -180, paysageHD(this, 960, sol + 180, 'comte', 0, { sansAstre: true })).setOrigin(0).setDisplaySize(960, sol + 180).setDepth(0).setFlipX(i % 2 === 1));
    this.sols = [-960, 0, 960, 1920].map((x, i) => this.add.image(x, sol, cheminTerreHD(this, 960, 70)).setOrigin(0).setDisplaySize(960, 70).setDepth(0.5).setFlipX(i % 2 === 1));
    this.bordChemin = [];   // (les gens, la Porte, le feu... : { o, x } dans le monde, qui reculent quand elle avance)
    this.parcouru = 0;
    // la maison, ses pattes, son filet, le chat sur le faîte (comme pour la marche d'essai)
    const sorte = this.sorte = etatPattes(G).sorte || 'chene';
    this.etat = { x: 360, haut: sol };
    const avant = new Set(this.children.list);
    this.facade = dessinerFacade(this, this.etat.x, sol, G.nomShop, undefined, { fumee: false, etage: false });
    this.facade.tonneaux.setVisible(false);
    this.maison = this.children.list.filter(o => !avant.has(o)).map(o => ({ o, dx: o.x - this.etat.x, dy: o.y - sol }));
    for (const m of this.maison) m.o.setDepth(5 + (m.o.depth || 0) * 0.01);
    this.repliees = pattesRepliees(this, this.facade, { sorte, sol, prof: 5.001 });
    const [g0, d0] = bordsDuMur(this, this.facade.image); this.bords = [g0 + 4 - this.etat.x, d0 - 4 - this.etat.x];
    this.dessous = this.add.image(0, 0, dessousMaisonHD(this)).setOrigin(0.5, 0).setScale(2).setDepth(4.2).setVisible(false);
    this.filet = this.add.image(0, 0, filetBoisHD(this, Math.min(12, etatPattes(G).bois.length))).setOrigin(0.5, 0).setScale(2).setDepth(4.3).setVisible(false);
    this.attaches = this.add.image(0, 0, attachesMaisonHD(this, sorte)).setOrigin(0.5, 0).setScale(2).setDepth(4.8).setVisible(false);
    this.pattes = [[-50, false, 0], [170, false, 11], [-110, true, 0], [110, true, 0]].map(([dx, devant, recul]) => {
      const p = this.add.image(0, sol, patteMaisonHD(this, 'debout', sorte, recul)).setOrigin(0.5, 1).setScale(devant ? 1.75 : 1.68).setDepth(devant ? 4.6 : 4.1).setVisible(false);
      if (!devant) p.setTint(0x7a6a5e);
      return { p, dx, devant, recul, leve: false };
    });
    this.chat = chatAdopte(G) ? { o: this.add.image(0, 0, creerChatHD(this, lookChat(G)) + '_assis0').setOrigin(0.5, 1).setScale(2.4).setDepth(5.9), dx: -36, dy: -264 } : null;
    this.debout = false;
    this.placer();
    // le soir qui tombe (un voile sur le monde) et le feu de camp
    this.voile = this.add.rectangle(480, 180, 2600, 1400, 0x1a1030, 1).setAlpha(0).setDepth(6.5);
    // l'interface, sur sa caméra à elle (sans recul)
    const ui = this.uiObjets = [];
    this.uiCam = this.cameras.add(0, 0, 960 * Z, 540 * Z).setOrigin(0, 0).setZoom(Z);
    ui.push(this.add.rectangle(480, 32, 940, 46, 0x1a120a, 0.9).setStrokeStyle(2, 0xd8b048));
    this.ligne = this.add.text(30, 32, '', style(14, '#f6ead0', { fontStyle: 'italic', wordWrap: { width: 720 } })).setOrigin(0, 0.5); ui.push(this.ligne);
    this.indiceClic = this.add.text(930, 32, '▶ clique', style(13, '#f3d98a', { fontStyle: 'bold italic' })).setOrigin(1, 0.5).setVisible(false); ui.push(this.indiceClic);
    this.tweens.add({ targets: this.indiceClic, alpha: 0.4, duration: 600, yoyo: true, repeat: -1 });
    // le compteur des jours, et le tableau de bord (le bois, la bourse)
    ui.push(this.add.rectangle(826, 100, 240, 74, 0x1e140a, 0.86).setStrokeStyle(2, 0xd8b048));
    this.titreJour = this.add.text(826, 82, '', style(14, '#ffe9a8', { fontStyle: 'bold' })).setOrigin(0.5); ui.push(this.titreJour);
    this.points = v.plan.map((_, k) => { const c = this.add.circle(826 + (k - (v.plan.length - 1) / 2) * 30, 112, 8, 0x3b2410).setStrokeStyle(2, 0xd8b048); ui.push(c); return c; });
    ui.push(this.add.rectangle(110, 100, 200, 74, 0x1e140a, 0.86).setStrokeStyle(2, 0xd8b048));
    this.texteBois = this.add.text(110, 86, '', style(13, '#f3d98a', { fontStyle: 'bold' })).setOrigin(0.5); ui.push(this.texteBois);
    this.texteBourse = this.add.text(110, 112, '', style(13, '#f3d98a', { fontStyle: 'bold' })).setOrigin(0.5); ui.push(this.texteBourse);
    this.cameras.main.ignore(ui);
    this.uiCam.ignore(this.children.list.filter(o => !ui.includes(o)));
    // (l'écouteur est retiré à l'arrêt de la scène : sinon, à la scène suivante, il cachait aussi l'interface toute neuve)
    const neSurUI = o => { if (this.uiCam && !this.enUI) this.uiCam.ignore(o); };
    this.sys.events.on('addedtoscene', neSurUI); this.events.once('shutdown', () => this.sys.events.off('addedtoscene', neSurUI));
    this.majTableau();
    // la fumée de la cheminée, qui file à l'opposé de sa marche
    this.vent = 40;
    this.time.addEvent({ delay: 380, loop: true, callback: () => {
      const im = this.facade.image; if (!im.active || this.voile.alpha > 0.5 && !this.debout) return;
      const [cx, cy, cl] = chemineeFacade(niveauFacade(G)), g = im.x - im.displayWidth / 2, h = im.y - im.displayHeight;
      if (!styleDeMaison(G)) bouffeeFumee(this, g + (cx + cl / 2) * 2, h + cy * 2, { echelle: 2.2, monte: 110, vent: this.vent, duree: 3000, alpha: 0.9, profondeur: 5.95 });
    } });
    Son.nature(true, { saison: typeof saisonDe === 'function' ? saisonDe(G) : 'ete', volume: 0.6 });
    this.events.once('shutdown', () => Son.nature(false));
    this.derouler().catch(e => { console.error(e); if (typeof noterJournal === 'function') noterJournal('erreur voyage : ' + e.message); });
  }

  // --- L'interface : ce qui est créé ici n'est vu que par la caméra de l'interface ---
  enInterface(f) { this.enUI = true; const avant = new Set(this.children.list); try { f(); } finally { this.enUI = false; } const nv = this.children.list.filter(o => !avant.has(o)); this.cameras.main.ignore(nv); return nv; }
  gain(texte, positif = true, y = 160) { this.enInterface(() => (this.gainsVifs = (this.gainsVifs || []).filter(t => t.active)).push(gainEnDirect(this, 480, y, texte, positif, { taille: 15, duree: 2600 }))); }
  majTableau() {
    const G = this.G, v = G.voyage, j = Math.min(v.plan.length, v.jourRoute + 1);
    this.titreJour.setText(`Le grand voyage · jour ${j} sur ${v.plan.length}`);
    this.points.forEach((c, k) => c.setFillStyle(k < j ? 0xd8b048 : 0x3b2410));
    this.texteBois.setText(`🔥 ${heuresDeBois(G)} h de bois`);
    this.texteBourse.setText(`${Math.floor(G.argent)} pièces`);
  }
  ecrire(texte) { this.ligne.setText(texte); }
  attendreClic() {
    return new Promise(ok => this.time.delayedCall(250, () => { if (this.fini) return; this.indiceClic.setVisible(true); this.input.once('pointerdown', () => { this.indiceClic.setVisible(false); ok(); }); }));
  }
  // Un choix : un parchemin et ses boutons (sur l'interface) ; renvoie l'indice choisi
  choisir(titre, texte, options) {
    return new Promise(ok => {
      const objets = this.enInterface(() => {
        const h = 150 + options.length * 54;
        this.add.rectangle(480, 290, 720, h, 0x1e140a, 0.94).setStrokeStyle(3, 0xd8b048).setDepth(40);
        this.add.text(480, 290 - h / 2 + 24, titre, style(18, '#ffe9a8', { fontStyle: 'bold' })).setOrigin(0.5).setDepth(41);
        this.add.text(480, 290 - h / 2 + 50, texte, style(13, '#f6ead0', { fontStyle: 'italic', align: 'center', wordWrap: { width: 640 } })).setOrigin(0.5, 0).setDepth(41);
        options.forEach((o, i) => {
          const b = creerBouton(this, 480, 290 - h / 2 + 128 + i * 54, 520, o.nom, () => { if (!o.ok) { Son.jouer('refus'); return; } for (const x of objets) x.destroy(); ok(o.i ?? i); });
          b.fond.setDepth(42); b.label.setDepth(42.1);
          if (!o.ok) { b.fond.setAlpha(0.45); b.label.setAlpha(0.6); }
        });
      });
    });
  }

  // --- La maison ---
  // Le sol sous un point du monde : le chemin, ou le lit du gué (chaque patte pose le pied sur son bout de terrain)
  solSous(x) { const g = this.gueEau; return this.sol + (g && !g.pont ? profondeurGue(x - g.c.x, this.sol, g.P) : 0); }
  // (au gué) l'eau autour d'une patte : ce qui est sous la surface disparaît dans l'eau, une ride entoure la patte
  eauAutour(l) {
    if (!l.eau) { const tons = COULEURS_GUE[(this.gueEau && this.gueEau.P.nom === 'ruisseau' ? 'ruisseauHD_' : 'gueHD_') + this.tuiles[0].texture.key] || [0, 0, 0x3a6c88, 0x3a6c88]; l.eau = this.add.rectangle(0, 0, 30, 4, tons[4], 0.9).setOrigin(0.5, 0).setDepth(l.devant ? 4.62 : 4.12); l.ride = this.add.rectangle(0, 0, 40, 2, 0xe8f6ff, 0.7).setDepth(l.devant ? 4.63 : 4.13); this.uiCam.ignore([l.eau, l.ride]); }
    const surf = this.sol + GUE.niveau - (l.devant ? 0 : 6), dedans = this.gueEau && !this.gueEau.pont && this.debout && dansLEauGue(l.p.x - this.gueEau.c.x, this.sol, this.gueEau.P), h = l.p.y - surf;
    l.eau.setVisible(dedans && h > 0); l.ride.setVisible(dedans && h > 0);
    if (dedans && h > 0) { l.eau.setPosition(l.p.x + (l.devant ? 0 : 2), surf).setSize(l.devant ? 50 : 42, h + 1); l.ride.setPosition(l.p.x, surf).setSize((l.devant ? 60 : 50) + Math.sin(this.time.now / 300 + l.dx) * 4, 2); }
  }
  placer() {
    const { x } = this.etat;
    // la maison descend avec ses pattes : de la moyenne de ce qu'il y a sous ses quatre pieds
    const creux = this.pattes.reduce((s, l) => s + this.solSous(x + l.dx) - this.sol, 0) / this.pattes.length;
    const haut = this.etat.haut + (this.debout ? creux : 0);
    for (const m of this.maison) m.o.setPosition(x + m.dx, haut + m.dy);
    this.repliees.forEach((p, i) => p.setPosition(x + this.bords[i], this.sol + 4));
    this.dessous.setPosition(x, haut - 6); this.attaches.setPosition(x, haut - 4); this.filet.setPosition(x + 4, haut + 60 - (this.filetHisse || 0));
    for (const l of this.pattes) {
      l.p.x = x + l.dx;
      const pied = this.solSous(l.p.x);
      // (accroupie : la pose aux genoux pliés, deux fois moins haute ; son pied est au milieu de l'image)
      l.p.scaleY = (l.devant ? 1.75 : 1.68) * Math.max(0.15, (pied - haut) / (this.accroupie ? 70 : 142));
      l.p.setOrigin(0.5, this.accroupie ? 0.5 : 1);
      l.p.y = pied - (l.devant ? 0 : 6) - (l.leve ? (this.accroupie ? 8 : l.devant ? 14 : 24) : 0);
      if (this.gueEau || l.eau) this.eauAutour(l);
    }
    if (this.chat) this.chat.o.setPosition(x + this.chat.dx, haut + this.chat.dy);
  }
  animerEtat(cible, duree, ease = 'Sine.easeInOut') {
    return new Promise(ok => this.tweens.add({ targets: this.etat, ...cible, duration: duree, ease, onUpdate: () => this.placer(), onComplete: ok }));
  }
  async seLever() {
    if (this.debout) return;
    this.repliees.forEach(p => p.setVisible(false));
    for (const o of [this.dessous, this.attaches, this.filet, ...this.pattes.map(l => l.p)]) o.setVisible(true);
    this.filet.setTexture(filetBoisHD(this, Math.min(12, etatPattes(this.G).bois.length)));
    this.cameras.main.shake(400, 0.003); Son.jouer('porte');
    await this.animerEtat({ haut: this.sol - 142 }, 1400, 'Back.easeOut');
    this.debout = true;
  }
  async sAccroupir() {
    if (!this.debout) return;
    await this.animerEtat({ haut: this.sol }, 1300, 'Sine.easeIn');
    this.cameras.main.shake(260, 0.005);
    for (const o of [this.dessous, this.attaches, this.filet, ...this.pattes.map(l => l.p)]) o.setVisible(false);
    this.repliees.forEach(p => p.setVisible(true)); this.placer();
    this.debout = false;
  }
  // Plier les genoux (pour passer sous une voûte) ou se redresser, sans quitter le sol
  async plierGenoux(oui) {
    if (!this.debout || !!this.accroupie === oui) return;
    // (le filet de bois remonte sous le plancher : accroupie, il traînerait par terre)
    const filet = h => new Promise(ok => this.tweens.add({ targets: this, filetHisse: h, duration: 500, ease: 'Sine.easeInOut', onUpdate: () => this.placer(), onComplete: ok }));
    if (oui) { this.filetAvant = this.filetHisse || 0; await filet(Math.max(this.filetAvant, 66)); }
    else this.time.delayedCall(700, () => filet(this.filetAvant || 0));
    if (oui) { await this.animerEtat({ haut: this.sol - 110 }, 500); this.accroupie = true; this.pattes.forEach(l => l.p.setTexture(patteMaisonHD(this, 'accroupie', this.sorte, l.recul))); await this.animerEtat({ haut: this.sol - 70 }, 500); }
    else { this.accroupie = false; this.pattes.forEach(l => l.p.setTexture(patteMaisonHD(this, 'debout', this.sorte, l.recul))); this.etat.haut = this.sol - 100; this.placer(); await this.animerEtat({ haut: this.sol - 142 }, 700, 'Back.easeOut'); }
  }
  // Marcher n pas : la maison lève ses pattes en diagonale, le décor recule d'autant (elle avance, rien ne glisse)
  async marcher(n, { pas = 56 } = {}) {
    this.vent = -90;
    const bas = () => this.accroupie ? 70 : 142, poseLevee = () => this.accroupie ? 'accroupie' : 'pas', posePosee = () => this.accroupie ? 'accroupie' : 'debout';
    for (let k = 0; k < n && !this.fini; k++) {
      this.pattes.forEach((l, i) => { l.leve = (k % 2 === 0) === (i === 1 || i === 2); l.p.setTexture(patteMaisonHD(this, l.leve ? poseLevee() : posePosee(), this.sorte, l.recul)); });
      await Promise.all([this.animerEtat({ haut: this.sol - bas() - 6 }, 260), this.defiler(pas, 260)]);
      this.pattes.forEach(l => { l.leve = false; l.p.setTexture(patteMaisonHD(this, posePosee(), this.sorte, l.recul)); });
      await Promise.all([this.animerEtat({ haut: this.sol - bas() }, 200), this.defiler(pas * 0.4, 200)]);
      // (dans le gué) chaque pied qui se pose dans l'eau fait une éclaboussure et des ronds ; sur le chemin, un peu de poussière
      const mouilles = this.gueEau && !this.gueEau.pont ? this.pattes.filter(l => dansLEauGue(l.p.x - this.gueEau.c.x, this.sol, this.gueEau.P)) : [];
      for (const l of mouilles.filter(m => (k % 2 === 0) === (m === this.pattes[1] || m === this.pattes[2]))) eclaboussure(this, l.p.x, this.sol + GUE.niveau - (l.devant ? 0 : 6), { taille: l.devant ? 0.4 : 0.3, profondeur: l.devant ? 4.64 : 4.14, ronds: true });
      if (mouilles.length) { if (k % 2 === 0) Son.jouer('plouf', { volume: 0.25 }); if (mouilles.length === 4) continue; }
      const nu = this.add.circle(this.etat.x - 150 + Math.random() * 30, this.sol + 6, 10, 0xd8c098, 0.5).setDepth(4.9);
      this.tweens.add({ targets: nu, scale: 2.2, alpha: 0, x: nu.x - 40, duration: 1100, onComplete: () => nu.destroy() });
      if (k % 2 === 0) Son.jouer('pas', { volume: 0.5 });
    }
    this.vent = 40;
  }
  // Le décor recule de d pixels (les tuiles bouclent ; ce qui borde le chemin recule avec le sol)
  defiler(d, duree) {
    const depart = this.parcouru;
    return new Promise(ok => this.tweens.addCounter({ from: 0, to: d, duration: duree, onUpdate: tw => { this.parcouru = depart + tw.getValue(); this.placerDecor(); }, onComplete: ok }));
  }
  placerDecor() {
    const p = this.parcouru;
    this.tuiles.forEach((t, i) => { t.x = ((i - 1) * 960 - p * 0.5) % 3840; if (t.x < -1440) t.x += 3840; });
    this.sols.forEach((t, i) => { t.x = ((i - 1) * 960 - p) % 3840; if (t.x < -1440) t.x += 3840; });
    for (const b of this.bordChemin) if (b.o.active) b.o.x = b.x - p * (b.f || 1);
    // (la route pavée du Royaume, depuis l'entrée de la Porte jusqu'au bord droit de la vue)
    const pr = this.paveRoyaume;
    if (pr) { const x0 = pr.porte.active ? pr.porte.x - PORTE_FR.demi : -1000, x = Math.max(-170, x0); pr.ts.x = x; pr.ts.width = Math.max(2, 1130 - x); pr.ts.tilePositionX = (x - x0) / 2; pr.ts.setVisible(x < 1130); }
    // (le gué) la rivière défile avec la route ; une fois loin derrière, on la retire
    const g = this.gueEau;
    if (g) { g.devant.x = g.c.x; if (g.c.x < -160 - 360) this.retirerGue(); }
  }
  // (house keep v1.59) la rivière ou le ruisseau, retirés pour de bon : le lit, les roseaux de devant, l'eau autour des pieds
  retirerGue() {
    const g = this.gueEau; if (!g) return;
    if (g.c.active) g.c.destroy(); if (g.devant.active) g.devant.destroy(); this.gueEau = null;
    for (const l of this.pattes) if (l.eau) { l.eau.destroy(); l.ride.destroy(); l.eau = null; }
  }
  // Le gué : la rivière (voyageDecorHD.js) posée à x, hors de la vue à droite
  poserGue(x, P = GUE) {
    const { c, devant } = poserGueHD(this, this.sol, this.tuiles[0].texture.key, P);
    c.setDepth(0.6); devant.setDepth(6.2);
    this.uiCam.ignore([c, devant]);
    this.gueEau = { c, devant, P };
    this.bord(c, x); devant.x = c.x;
  }
  // Poser quelque chose au bord du chemin, à x (à l'écran, maintenant) : il reculera quand elle avance
  // (f : la vitesse de défilement, 1 pour ce qui borde le chemin, moins pour ce qui est loin)
  bord(o, x = o.x, f = 1) { this.bordChemin.push({ o, x: x + this.parcouru * f, f }); o.x = x; return o; }
  changerBiome(biome, nuit = 0) {
    if (this.biome === biome) return;
    this.biome = biome;
    const cle = paysageHD(this, 960, this.sol + 180, biome, nuit, { sansAstre: true });
    for (const t of this.tuiles) { const n = this.add.image(t.x, t.y, cle).setOrigin(0).setDisplaySize(960, this.sol + 180).setDepth(0.01).setAlpha(0).setFlipX(t.flipX); this.tweens.add({ targets: n, alpha: 1, duration: 1200, onComplete: () => { t.setTexture(cle).setDisplaySize(960, this.sol + 180); n.destroy(); } }); }
  }
  fumeeSoir(on) { this.tweens.add({ targets: this.voile, alpha: on ? 0.55 : 0, duration: 1600 }); }

  // --- Le voyage, jour après jour ---
  async derouler() {
    const G = this.G, v = G.voyage;
    while (!this.fini) {
      const jour = jourDeRoute(G);
      if (!jour) break;
      this.majTableau();
      if (jour.etapes.includes(4)) { await this.arrivee(); return; }
      if (jour.etapes[0] === 0) await this.depart(); else { this.ecrire(`L'aube. ${G.nomShop} s'étire, déplie ses pattes et reprend la route.`); await this.attendreClic(); await this.seLever(); }
      if (this.fini) return;
      for (const e of jour.etapes) {
        if (e === 0) continue;
        if (e === 1) await this.vergers();
        if (e === 2) await this.gue();
        if (e === 3) await this.porte();
        if (this.fini) return;
      }
      if (jour.imprevu && !v.imprevus.some(x => x.jour === G.jour)) await this.imprevu(jour.imprevu);   // (déjà tranché : une partie rechargée ne le rejoue pas)
      if (this.fini) return;
      const m = v.marcheJour === G.jour ? { assez: true } : marcherLeJour(G);
      v.marcheJour = G.jour;
      this.majTableau();
      await this.marcher(4);
      if (!m.assez) { this.ecrire('Le feu baisse : il n\'y a plus de bois dans le filet ! On ramasse du bois mort tout le long du chemin, et elle repart en toussant.'); await this.attendreClic(); }
      await this.soir();
      if (this.fini) return;
      nuitEnRoute(G);
      if (G.faillite) { Sauvegarde.supprimer(); this.fini = true; this.scene.start('Faillite'); return; }   // (comme au coucher : une partie en faillite ne se sauve pas)
      Sauvegarde.maintenant(G, 'Voyage');
      await this.matin();
    }
  }

  // (planche 77) La rue de la Comté autour de la maison, telle qu'on la voit en se promenant (la forge, l'impasse, les
  // Pommeroy à gauche ; les Brindeloup, le barbier, la fontaine, les Mages, la banque et l'arche du marché à droite) : elle
  // défile avec la route. On la construit comme la vraie rue, sans sa façade (la maison, c'est elle, debout au milieu).
  rueDuDepart() {
    const avant = new Set(this.children.list), o = this.etat.x - PLACES_RUE.shop;
    const facade = window.dessinerFacade, pattes = window.pattesRepliees;
    window.dessinerFacade = (scene, cx, sol) => ({ porteX: cx, porteY: sol - 60 }); window.pattesRepliees = () => [];
    // (sans les étincelles de la forge : elles ne suivraient pas la rue qui défile)
    try { construireRue(this, o, { jour: true, etincelles: false, ici: { regarder() {}, porte() {} } }); } finally { window.dessinerFacade = facade; window.pattesRepliees = pattes; }
    for (const x of this.children.list.filter(x => !avant.has(x))) {
      if (x.type === 'Graphics' || (x.texture && /^paysage/.test(x.texture.key))) { x.destroy(); continue; }   // (le paysage : on a déjà le nôtre)
      x.setDepth((x.depth || 0) > 3 ? 3.2 : 0.52 + (x.depth || 0) * 0.01);   // (tout derrière la maison, au-dessus du chemin)
      this.uiCam.ignore(x); this.bord(x, x.x);
    }
    return o;
  }
  // Le départ : toute la rue est sortie ; les adieux de Garrick ; elle se lève et descend la rue jusqu'à l'arche, puis la
  // route de la Comté
  async depart() {
    const G = this.G, sol = this.sol;
    const o = this.rueDuDepart();
    const voisins = [['Rosalie', { race: 'humain', nom: 'Rosalie', feminin: true, niveau: 'novice' }, 640], ['Garrick', 'mentor', 720], ['Thorgal', { race: 'nain', nom: 'Thorgal', costume: 'forgeron', niveau: 'aguerri' }, 800], ['Barnabé', { race: 'hobbit', nom: 'Barnabé', niveau: 'novice' }, 870]];
    this.voisins = voisins.map(([nom, q, x]) => { const p = imageCorps(this, x, sol + 40, q, 6.4).setFlipX(true).setDepth(7); this.uiCam.ignore(p); return this.bord(p); });
    // (plus loin dans la rue, d'autres sont sortis sur le pas de leur porte pour la voir passer)
    const rue = [[PLACES_RUE.maison1 + 60, { race: 'hobbit', nom: 'Une Brindeloup', feminin: true }], [PLACES_RUE.fontaine - 40, { race: 'humain', nom: 'Une porteuse d\'eau', feminin: true }], [PLACES_RUE.fontaine + 60, { race: 'nain', nom: 'Un vieux nain' }], [PLACES_RUE.banque - 120, 'banquier'], [PLACES_RUE.arche - 160, { race: 'elfe', nom: 'Une voyageuse', feminin: true }]];
    this.badauds = rue.map(([x, q]) => { const p = imageCorps(this, o + x, sol + 36, q, 6.2).setFlipX(true).setDepth(6.9); this.uiCam.ignore(p); return this.bord(p); });
    this.joueur = this.add.image(560, sol + 44, textureJoueur(this, G)).setOrigin(0.5, 1).setScale(echelleJoueur(6.6)).setFlipX(true).setDepth(7);
    this.uiCam.ignore(this.joueur);
    this.ecrire(`Le grand jour. Toute la rue est venue. Garrick : « Le filet est plein, ${etatPattes(G).bois.length} places de bois. Alors file, petit... et écris-moi. »`);
    this.emotion(this.voisins[1], '♥', 1600);
    await this.attendreClic(); if (this.fini) return;
    this.ecrire('Rosalie s\'essuie les yeux dans son tablier. Thorgal tape sur le mur de la maison, comme on flatte un cheval. Barnabé agite son chapeau.');
    await this.attendreClic(); if (this.fini) return;
    // tu montes à bord (par la porte), elle se lève
    await new Promise(ok => { pasDeMarche(this, this.joueur, 700); this.tweens.add({ targets: this.joueur, x: this.facade.porteX, duration: 700, onComplete: () => { this.joueur.destroy(); ok(); } }); });
    Son.jouer('porte');
    this.ecrire(`${G.nomShop} frémit, déplie ses pattes et se lève. Les fanions claquent, la cheminée crache une grosse fumée.`);
    await this.seLever(); if (this.fini) return;
    this.voisins.forEach(p => this.emotion(p, '!', 1200));
    await this.marcher(6);
    const barbier = typeof barbierOuvert === 'function' && barbierOuvert(G);
    this.ecrire(`Elle descend la rue au pas, entre les maisons. Aux portes, aux fenêtres, on agite des mouchoirs ; ${barbier ? 'le barbier sort sur son seuil, ' : 'les Brindeloup sortent sur leur seuil, '}la porteuse d'eau en lâche son seau.`);
    for (let k = 0; k < 16 && !this.fini; k++) { await this.marcher(1); this.badauds.forEach(p => { if (p.active && Math.abs(p.x - this.etat.x) < 260 && !p.salue) { p.salue = true; this.emotion(p, k % 2 ? '!' : 'joie', 1200); } }); }
    this.ecrire('Le porche du marché, la dernière maison... et la route de la Comté s\'ouvre devant elle. Derrière, la rue n\'est plus qu\'une rangée de toits.');
    for (let k = 0; k < 20 && !this.fini && o + LARGEUR_RUE - this.parcouru > this.etat.x - 360; k++) await this.marcher(1);
    await this.marcher(4);
  }
  // Les vergers : des rangées de pommiers des deux côtés de la route (leurs pommes, des échelles, des paniers) ; une
  // voyageuse marche à côté de la maison et achète par la fenêtre
  verger() {
    const sol = this.sol, saison = typeof saisonActuelle === 'function' ? saisonActuelle() : null;
    const cle = saison === 'hiver' ? arbreRiveHD(this, 'hiver', 'aulne', 4) : textureArbre(this, 'pommiers');
    const poser = (x, y, e, prof) => { const a = this.add.image(x, y, cle).setOrigin(0.5, 1).setScale(e).setDepth(prof); this.uiCam.ignore(a); return this.bord(a, x); };
    for (let k = 0; k < 18; k++) {
      const x = 1180 + k * 170;
      poser(x + (k % 2) * 40, sol - 74, 0.9, 0.31); poser(x + 85, sol - 46, 1.2, 0.33);   // (deux rangées au fond, en quinconce)
      poser(x + 40, sol - 8, 1.75, 0.36);   // (la rangée du bord de la route)
      if (k % 4 === 1) { const p = this.add.image(x + 70, sol - 2, vergerHD(this, 'panier')).setOrigin(0.5, 1).setScale(2).setDepth(0.37); this.uiCam.ignore(p); this.bord(p, x + 70); }
      if (k % 5 === 2) { const e = this.add.image(x + 22, sol - 6, vergerHD(this, 'echelle')).setOrigin(0.5, 1).setScale(2).setDepth(0.365); this.uiCam.ignore(e); this.bord(e, x + 22); }
    }
  }
  async vergers() {
    const G = this.G;
    this.changerBiome('comte');
    this.verger();
    this.ecrire('Les vergers : des rangées de pommiers à perte de vue, des échelles contre les troncs, des paniers pleins au pied des arbres. Une voyageuse marche à côté de la maison et frappe à la vitrine.');
    await this.marcher(6);
    const q = { race: 'elfe', nom: 'Une voyageuse', feminin: true, niveau: 'aguerri' };
    const p = imageCorps(this, -60, this.sol + 40, q, 6.4).setDepth(7);
    this.uiCam.ignore(p);
    // elle rattrape la maison, puis marche à son pas devant la vitrine
    pasDeMarche(this, p, 1200);
    await new Promise(ok => this.tweens.add({ targets: p, x: this.etat.x + 120, duration: 1200, onComplete: ok }));
    const v = G.voyage, gain = v.venteJour === G.jour ? 0 : venteParLaFenetre(G);
    v.venteJour = G.jour;   // (une partie rechargée ne revend pas deux fois)
    this.ecrire(`« Deux gourdes et une corde, s'il vous plaît ! » Elle paie à travers la vitrine sans s'arrêter de marcher : le comptoir de voyage.`);
    if (gain) { this.gain(`+${gain} p.`); Son.jouer('pieces'); } this.majTableau();
    pasDeMarche(this, p, 2400);
    await Promise.all([this.marcher(4), new Promise(ok => this.tweens.add({ targets: p, x: this.etat.x + 220, duration: 2400, onComplete: ok }))]);
    p.setFlipX(true); pasDeMarche(this, p, 1600);
    this.tweens.add({ targets: p, x: 1200, duration: 1600, onComplete: () => p.destroy() });
    await this.attendreClic();
  }
  // Le gué : elle traverse la rivière, l'eau aux genoux
  // Le gué : une rivière large et peu profonde coupe la route. On hisse le filet sous le plancher (le bois reste au sec),
  // elle descend la berge, traverse l'eau aux chevilles, remonte de l'autre côté ; on ne s'arrête jamais dans l'eau
  async gue() {
    this.changerBiome('comte');
    this.poserGue(1500);
    const g = GUE, berge = () => this.gueEau.c.x - g.demiRoute - g.berge, autre = () => this.gueEau.c.x + g.demiRoute + g.berge;
    this.ecrire('Une rivière large et lente coupe la route : le gué. Avant d\'y entrer, tu hisses le filet sous le plancher, pour garder le bois au sec.');
    // (elle s'arrête sur la route, avant la berge, le temps de hisser le filet)
    for (let k = 0; k < 30 && berge() - (this.etat.x + 190) > 40; k++) await this.marcher(1);
    await new Promise(ok => this.tweens.add({ targets: this, filetHisse: 46, duration: 900, ease: 'Sine.easeInOut', onUpdate: () => this.placer(), onComplete: ok }));
    for (let k = 0; k < 30 && this.gueEau.c.x - this.etat.x > 70; k++) await this.marcher(1);
    this.ecrire('Elle descend la berge à petits pas et entre dans l\'eau. Le courant lui monte aux chevilles, les poissons s\'écartent, les roseaux se couchent.');
    for (let k = 0; k < 40 && autre() - (this.etat.x - 110) > -20; k++) await this.marcher(1);
    await new Promise(ok => this.tweens.add({ targets: this, filetHisse: 0, duration: 800, ease: 'Sine.easeInOut', onUpdate: () => this.placer(), onComplete: ok }));
    this.ecrire('Elle remonte sur l\'autre rive et s\'ébroue. Le filet redescend : pas une bûche de mouillée.');
    await this.attendreClic();
    for (let k = 0; k < 12 && this.gueEau; k++) await this.marcher(1);   // (la rivière s'éloigne derrière elle)
  }
  // La Porte des Hommes : la frontière, la garde, la taxe ; la lettre du duc ou la fouille
  async porte() {
    const G = this.G, sol = this.sol;
    this.changerBiome('comte');
    // la frontière : le mur qui descend des collines et le châtelet qui enjambe la route (voyageDecorHD.js) ;
    // passé la porte, la route du Royaume est pavée
    const { c: porte, ombre: ombreVoute } = poserPorteFrontiereHD(this, sol, this.tuiles[0].texture.key);
    porte.setDepth(3); ombreVoute.setDepth(0.56); this.uiCam.ignore([porte, ombreVoute]);
    this.bord(porte, 1500); this.bord(ombreVoute, 1500);
    this.paveRoyaume = { porte, ts: this.add.tileSprite(0, sol, 16, 70, pavesHD(this, 960, 70)).setOrigin(0).setTileScale(2).setDepth(0.55) };
    this.uiCam.ignore(this.paveRoyaume.ts); this.placerDecor();
    // de l'autre côté : les villages de pierre blanche sur leurs collines (au loin, ils défilent moins vite), une borne
    for (const [x, y, e, g] of [[1700, sol - 92, 1.5, 1], [2350, sol - 108, 1.2, 2]]) { const v = this.add.image(x, y, villageRoyaumeHD(this, g)).setOrigin(0.5, 1).setScale(e).setDepth(0.3); this.uiCam.ignore(v); this.bord(v, x, 0.55); }
    { const b = this.add.image(2150, sol + 2, borneRoyaumeHD(this)).setOrigin(0.5, 1).setScale(2.4).setDepth(3.5); this.uiCam.ignore(b); this.bord(b, 2150); }
    const gardes = [[1160, 'Le sergent de la Porte'], [1216, 'Garde du pont'], [1850, 'Garde du pont']].map(([x, nom]) => { const g = gardePont(this, x, sol + 40, 6.4, true, nom); this.bord(g.b, g.b.x); g.b.setDepth(7.01); this.bord(g.g.setDepth(7)); return g.g; });
    this.ecrire('La Porte des Hommes : le grand mur de la frontière descend des collines jusqu\'à la route, et la route passe sous son châtelet. La garde barre le passage.');
    await this.marcher(7);
    this.emotion(gardes[0], '!', 1400);
    const ombre = coteCamp(G) === 'mal';
    this.ecrire('Le sergent : « Halte ! Une maison qui marche... Nom, provenance, marchandises. Et la taxe de passage : deux pièces par patte. »');
    await this.attendreClic(); if (this.fini) return;
    let choix = null;
    if (ombre && G.voyage.porteJour !== G.jour) choix = (await this.choisir('La Porte des Hommes', 'Le sergent plisse les yeux en lisant ton nom sur sa liste. « Les rebelles, les Bannis, les comptoirs louches... On va jeter un œil à votre cave. »',
      [{ nom: 'Laisser fouiller la maison', ok: true }, { nom: `Glisser une pièce au sergent (${VOYAGE.sergent} p.)`, ok: peutPayer(G, VOYAGE.sergent + VOYAGE.taxePorte * 4) }])) === 1 ? 'sergent' : null;
    const dejaPasse = G.voyage.porteJour === G.jour;
    const r = dejaPasse ? { texte: 'Le sergent te reconnaît : « Encore vous ? Passez, passez. »', gains: [] } : passerLaPorte(G, choix);
    G.voyage.porteJour = G.jour;
    this.ecrire(r.texte);
    r.gains.forEach((t, i) => this.time.delayedCall(i * 500, () => this.gain(t, !/^−/.test(t), 160 + i * 26)));
    this.majTableau();
    if (!ombre) gardes.forEach(g => this.emotion(g, '♪', 1200));
    await this.attendreClic(); if (this.fini) return;
    this.ecrire('La voûte est plus basse que la cheminée : la maison plie les genoux et s\'engage sous la porte, à petits pas, la cheminée frôlant la pierre. Les torches, l\'écho des pas, le vantail grand ouvert...');
    await this.plierGenoux(true);
    await this.marcher(13);
    await this.plierGenoux(false);
    this.ecrire('... et de l\'autre côté, le Royaume des Hommes : la route pavée, des bornes, des villages de pierre blanche.');
    await this.marcher(4);
  }
  // Un imprévu : on le voit arriver (sa mise en scène), le récit, le choix, puis ce qui a changé (en direct) et ce qu'on voit
  async imprevu(id) {
    const G = this.G, I = IMPREVUS[id];
    await this.marcher(2);
    const sc = (await this.scenette(id)) || {};
    if (this.fini) return;
    this.ecrire(I.texte);
    await this.attendreClic(); if (this.fini) return;
    const o = choixPossibles(G, id);
    const i = await this.choisir(I.nom, I.texte, o);
    const r = choisirImprevu(G, id, i);
    this.ecrire(r.texte || '');
    (r.gains || []).forEach((t, k) => this.time.delayedCall(k * 500, () => this.gain(t, !/^−/.test(t), 160 + k * 26)));
    if (/[+]|♥|☀/.test((r.gains || []).join(' '))) Son.jouer('pieces');
    this.majTableau();
    if (sc.apres) await sc.apres(i, r);
    await this.attendreClic();
    if (sc.fin) await sc.fin();
  }
  // (planche 77) La mise en scène de chaque imprévu : ce qui arrive se voit, avant le choix ; `apres(i)` montre ce que
  // le choix a changé, `fin()` range. Tout ce qui est posé au bord du chemin défile avec lui.
  posePerso(q, x, y, e, { prof = 6.9, flip = true, pose = null } = {}) { const p = imageCorps(this, x, y, q, e, pose).setFlipX(flip).setDepth(prof); return this.bord(p); }
  allerA(p, x, duree, flip = x > p.x ? false : true) { p.setFlipX(flip); pasDeMarche(this, p, duree); return new Promise(ok => this.tweens.add({ targets: p, x, duration: duree, onComplete: () => { const b = this.bordChemin.find(b => b.o === p); if (b) b.x = x + this.parcouru; ok(); } })); }
  cheminee() { const im = this.facade.image, [cx, cy, cl] = chemineeFacade(niveauFacade(this.G)); return { x: im.x - im.displayWidth / 2 + (cx + cl / 2) * 2, y: im.y - im.displayHeight + cy * 2 }; }
  // le ruisseau du pont étroit et de l'ogre du péage : la rivière du gué, et un pont de planches posé dessus
  ruisseauEtPont(x) {
    this.poserGue(x, RUISSEAU);
    const g = this.gueEau, pont = [this.add.image(-180, this.sol - 24, 'pontMoulinHD').setOrigin(0, 0).setScale(2)];
    pont.forEach(o => { o.setDepth(0.62); g.c.add(o); });   // (dans le conteneur du gué : il défile avec lui)
    g.pont = false; return g;
  }
  async traverserRuisseau({ parLePont = false } = {}) {
    const g = this.gueEau; if (!g) return;
    g.pont = parLePont;   // (sur le pont, les pieds restent au sec)
    for (let k = 0; k < 30 && this.gueEau && g.c.x + g.P.demiRoute + g.P.berge - (this.etat.x - 110) > -20; k++) await this.marcher(1);
  }
  async scenette(id) {
    const G = this.G, sol = this.sol, X = this.etat.x;
    if (id === 'orage') {
      creerTexturesMeteo(this);
      const pluie = this.enInterface(() => {
        voileMeteo(this, 0x5a6088, 1, 'MULTIPLY', -2).setAlpha(0);
        panMeteo(this, 'meteoPluie', { prof: -1.5, alpha: 0.8, vx: -260, vy: 1100 }); panMeteo(this, 'meteoPluie', { prof: -1.5, alpha: 0.45, vx: -200, vy: 800, echelle: 0.7 });
      });
      pluie.forEach(o => { if (o.alpha !== undefined) { const a = o.alpha || 1; o.setAlpha(0); this.tweens.add({ targets: o, alpha: a, duration: 900 }); } });
      const eclair = () => this.enInterface(() => eclairMeteo(this, -1.2));
      eclair(); const ev = this.time.addEvent({ delay: 3800, loop: true, callback: eclair });
      const gens = [[{ race: 'humain', nom: 'Un colporteur trempé', costume: 'colporteur' }, 1180], [{ race: 'hobbit', nom: 'Une voyageuse trempée', feminin: true }, 1260]].map(([q, x]) => this.posePerso(q, x, sol + 38, 6.2));
      await Promise.all(gens.map((p, k) => this.allerA(p, X + 120 + k * 52, 1300 + k * 200)));
      gens.forEach(p => this.emotion(p, '…', 1200));
      return {
        apres: async i => { if (i === 1) { await Promise.all(gens.map((p, k) => this.allerA(p, this.facade.porteX, 600 + k * 200))); gens.forEach(p => this.tweens.add({ targets: p, alpha: 0, duration: 300 })); } else gens.forEach(p => this.emotion(p, 'joie', 1200)); },
        fin: async () => { ev.remove(); pluie.forEach(o => this.tweens.add({ targets: o, alpha: 0, duration: 1400, onComplete: () => o.destroy() })); gens.forEach(p => { if (p.alpha > 0.5) this.allerA(p, -300, 2600); }); },
      };
    }
    if (id === 'clandestin') {
      // (couché sur le tas de bûches, dans le filet)
      // (planche 86) couché pour de bon, sur le dos, les yeux fermés (la pose dortBivouac), posé sur les bûches
      const PIP = { race: 'gobelin', nom: 'Pip', niveau: 'novice' };
      const f = this.filet, pip = imageCorps(this, f.x + 6, f.y + f.displayHeight * 0.34 + 12, PIP, 4.4, 'dortBivouac').setDepth(4.31);
      pip.dort = true;
      const ronfle = this.time.addEvent({ delay: 1400, loop: true, callback: () => { if (!pip.active || !pip.dort) return; const t = teteCorps(pip) || { x: pip.x - 14, y: pip.y - 10 }; const z = this.add.text(t.x - 4, t.y - 16, 'z', style(14, '#3b2410', { fontStyle: 'bold italic' })).setDepth(4.9); this.uiCam.ignore(z); this.tweens.add({ targets: z, y: z.y - 26, x: z.x - 10, alpha: 0, duration: 1300, onComplete: () => z.destroy() }); } });
      return { apres: async i => {
        // il se réveille, les yeux ouverts : il se met à genoux sur les bûches, puis se redresse dans le filet
        ronfle.remove(); pip.dort = false;
        pip.setTexture(corpsHD(this, PIP, 'aGenoux')).setY(f.y + f.displayHeight * 0.8); origineCorps(pip);
        await new Promise(ok => this.time.delayedCall(280, ok));
        if (!pip.active) return;
        pip.setTexture(corpsHD(this, PIP)).setAngle(0).setOrigin(0.5, 1).setY(f.y + f.displayHeight * 0.8);
        if (i === 0) { this.emotion(pip, 'colere', 1200); await new Promise(ok => this.tweens.add({ targets: pip, x: pip.x - 90, y: sol + 40, duration: 600, ease: 'Quad.easeIn', onComplete: ok })); pip.setDepth(6.9); this.bord(pip); this.allerA(pip, -300, 2400); }
        else { this.emotion(pip, 'joie', 1400); await new Promise(ok => this.tweens.add({ targets: pip, x: this.facade.porteX, y: sol - 10, alpha: 0, duration: 900, onComplete: ok })); pip.destroy(); }
      } };
    }
    if (id === 'maison') {
      const isba = this.bord(this.add.image(1300, sol + 4, isbaPoulesHD(this, 0)).setOrigin(0.5, 1).setScale(2.3).setFlipX(true).setDepth(3.6));
      let k = 0; const pas = this.time.addEvent({ delay: 220, loop: true, callback: () => isba.setTexture(isbaPoulesHD(this, (k = 1 - k))) });
      await new Promise(ok => this.tweens.add({ targets: isba, x: 900, duration: 2600, onUpdate: () => { const b = this.bordChemin.find(b => b.o === isba); if (b) b.x = isba.x + this.parcouru; }, onComplete: ok }));
      pas.remove();
      const marchand = this.posePerso({ race: 'humain', nom: 'Le marchand nomade', costume: 'colporteur', niveau: 'aguerri' }, 830, sol + 40, 6.2);
      this.emotion(marchand, 'joie', 1400); if (this.chat) this.emotion(this.chat.o, '?', 1400);
      return { fin: async () => { marchand.setFlipX(false); this.allerA(marchand, 900, 500).then(() => marchand.setVisible(false));
        const pas2 = this.time.addEvent({ delay: 220, loop: true, callback: () => isba.setTexture(isbaPoulesHD(this, (k = 1 - k))) }); isba.setFlipX(false);
        this.tweens.add({ targets: isba, x: 1500, duration: 3200, onUpdate: () => { const b = this.bordChemin.find(b => b.o === isba); if (b) b.x = isba.x + this.parcouru; }, onComplete: () => { pas2.remove(); isba.destroy(); } }); } };
    }
    if (id === 'pont' || id === 'troll') {
      creerMoulinHD(this);
      const g = this.ruisseauEtPont(1500);
      for (let k = 0; k < 20 && g.c.x - g.P.demiRoute - g.P.berge - (X + 190) > 30; k++) await this.marcher(1);
      if (id === 'pont') return { apres: async (i, r) => { if (i === 0) { await new Promise(ok => this.tweens.add({ targets: this, filetHisse: 46, duration: 700, onUpdate: () => this.placer(), onComplete: ok })); await this.traverserRuisseau(); this.tweens.add({ targets: this, filetHisse: 0, duration: 700, onUpdate: () => this.placer() }); }
        else { await this.traverserRuisseau({ parLePont: true }); if (/Crac/.test(r.texte)) { this.cameras.main.shake(300, 0.006); Son.jouer('porte'); } } } };
      // (v1.59, planche 79) l'ogre du péage : il se lève du ruisseau, sous le petit pont, et lève son gourdin. Il respire
      // (deux images), et quand il s'écarte, il marche vraiment dans l'eau (ses deux images de pas)
      let pose = { bras: 'epaule', visage: 'colere' }, souffle = 0, marche = false;
      const ogre = this.bord(this.add.image(g.c.x + 25, sol + 80, ogreHD(this, pose)).setOrigin(0.5, 1).setScale(0.8).setDepth(6.4));
      const poser = q => { pose = q; ogre.setTexture(ogreHD(this, { ...q, souffle })); };
      const respire = this.time.addEvent({ delay: 650, loop: true, callback: () => { if (!ogre.active) { respire.remove(); return; } if (!marche) { souffle = 1 - souffle; poser(pose); } } });
      this.time.delayedCall(700, () => { if (ogre.active) { poser({ bras: 'leve', visage: 'colere' }); Son.jouer('grogne'); } });
      this.emotion(ogre, 'colere', 1600);
      return { apres: async i => {
        poser(i === 1 ? { bras: 'epaule', visage: 'larmes' } : { bras: 'piece', visage: 'joie' });
        this.emotion(ogre, i === 1 ? 'larme' : 'joie', 1600);
        await new Promise(ok => this.time.delayedCall(1500, ok));
        // il recule dans le ruisseau, en aval du pont, pour laisser passer la maison
        marche = true; ogre.setFlipX(true); let k = 0;
        const pas = this.time.addEvent({ delay: 230, loop: true, callback: () => { if (ogre.active) ogre.setTexture(ogreHD(this, { jambes: (k = 1 - k) ? 'pas1' : 'pas2', bras: 'epaule', visage: 'neutre' })); } });
        await new Promise(ok => this.tweens.add({ targets: ogre, x: ogre.x + 34, y: ogre.y + 18, scale: 0.86, duration: 1500, onUpdate: () => { const b = this.bordChemin.find(b => b.o === ogre); if (b) b.x = ogre.x + this.parcouru; }, onComplete: ok }));
        pas.remove(); ogre.setFlipX(false); marche = false; poser({ bras: 'epaule', visage: 'neutre' });
        await this.traverserRuisseau({ parLePont: true });
        // (on ne campe pas sous le nez de l'ogre) elle marche encore jusqu'à ce que le pont et son gardien soient hors de vue
        for (let k = 0; k < 14 && ogre.active && ogre.x + ogre.displayWidth / 2 > -10; k++) await this.marcher(1);
        respire.remove(); if (ogre.active) ogre.destroy(); } };
    }
    if (id === 'fete') {
      creerRueHD(this);
      const x0 = 1260;
      for (const [cle, dx] of [['rueMaisonHD_0', 0], ['rueMaisonHD_1', 420]]) { const m = this.add.image(x0 + dx, sol + 2, cle).setOrigin(0.5, 1).setScale(2).setDepth(0.52); this.bord(m, m.x); }
      const c = this.add.container(0, 0).setDepth(0.6); guirlandeFanions(this, c, x0 + 90, x0 + 330, sol - 190, 26, 34, 1); this.bord(c, 0);
      for (let k = 0; k < 4; k++) { const l = this.add.image(x0 + 110 + k * 66, sol - 172 + Math.sin(k + 1) * 18, 'halo').setScale(0.35).setTint(0xffb050).setAlpha(0.7).setBlendMode(Phaser.BlendModes.ADD).setDepth(0.61); this.bord(l, l.x); const lp = this.add.ellipse(l.x, l.y, 10, 12, 0xe8783a).setDepth(0.62); this.bord(lp, lp.x); }
      { const t = this.add.image(x0 + 210, sol + 14, 'tonneauxHD').setOrigin(0.5, 1).setScale(2).setDepth(0.7); this.bord(t, t.x); }
      const danse = [[{ race: 'hobbit', nom: 'Un danseur' }, x0 + 140], [{ race: 'hobbit', nom: 'Une danseuse', feminin: true }, x0 + 190], [{ race: 'humain', nom: 'Une fermière', feminin: true }, x0 + 270], [{ race: 'nain', nom: 'Un vieux nain' }, x0 + 330]].map(([q, x]) => this.posePerso(q, x, sol + 36, 6.0, { prof: 3.5 }));
      danse.forEach((p, k) => { this.tweens.add({ targets: p, y: p.y - 10, duration: 260, yoyo: true, repeat: -1, delay: k * 130, ease: 'Quad.easeOut' }); const tour = this.time.addEvent({ delay: 520, loop: true, callback: () => { if (!p.active) { tour.remove(); return; } p.setFlipX(!p.flipX); } }); });   // (la boucle s'arrête avec le danseur)
      for (let k = 0; k < 10 && !this.fini; k++) await this.marcher(1);
      return { apres: async i => danse.forEach(p => this.emotion(p, i === 1 ? '♥' : 'joie', 1400)) };
    }
    if (id === 'blesse') {
      const borne = this.bord(this.add.image(1064, sol + 32, borneComteHD(this)).setOrigin(0.5, 1).setScale(2.4).setDepth(6.6));
      const q = { race: 'humain', nom: 'Un héros blessé', niveau: 'aguerri', blesse: true };
      const h = this.posePerso(q, 1010, sol + 34, 6.2, { prof: 6.7, pose: 'assis', flip: false });
      const epee = this.bord(this.add.image(1100, sol + 36, epeeCasseeHD(this)).setOrigin(0.5, 1).setScale(2).setDepth(6.65));
      void borne; void epee;
      for (let k = 0; k < 6 && !this.fini; k++) await this.marcher(1);
      this.emotion(h, '…', 1400);
      return { apres: async i => {
        if (i === 0) { h.setTexture(corpsHD(this, q)).setOrigin(0.5, 1); this.emotion(h, '♥', 1600); }
        else if (i === 1) this.emotion(h, '…', 1400);
        else { await this.marcher(3); h.setFlipX(true); this.emotion(h, '…', 1600); }
      } };
    }
    if (id === 'brigands') {
      // (v1.59, planche 79) les pandas renégats, déserteurs de la Confrérie
      const bandits = [[{ ...FIGURANTS.renegatWen, serieux: true, armeEmportee: 'arc' }, 780], [{ ...FIGURANTS.renegateLin, serieux: true, armeEmportee: 'dague' }, 850], [{ ...FIGURANTS.renegatHao, serieux: true, armeEmportee: 'bambou' }, 925]].map(([q, x]) => this.posePerso(q, x + 300, sol + 40, 6.4));
      await Promise.all(bandits.map((p, k) => this.allerA(p, 760 + k * 72, 1100 + k * 150)));
      bandits.forEach(p => this.emotion(p, 'colere', 1400));
      return { apres: async i => {
        const partis = () => bandits.forEach(p => p.setVisible(false));   // (une fois dans les fourrés, on ne les voit plus)
        if (i === 0) { await new Promise(ok => this.time.delayedCall(500, ok)); await Promise.all(bandits.map((p, k) => this.allerA(p, 1700, 1900 + k * 100, false))); partis(); }
        else if (i === 1) { const c = this.cheminee(); formeDeFumee(this, 'chat', c.x, c.y, c.x + 40, c.y - 150, { taille: 120, profondeur: 6.2, tenue: 2800 }); this.cameras.main.shake(400, 0.004); bandits.forEach(p => this.emotion(p, '!', 1200)); await new Promise(ok => this.time.delayedCall(900, ok)); await Promise.all(bandits.map((p, k) => this.allerA(p, 1700, 1300 + k * 120, false))); partis(); }
        else if (i === 3) { bandits.forEach(p => this.emotion(p, '…', 1000)); await new Promise(ok => this.time.delayedCall(1100, ok)); await Promise.all(bandits.map((p, k) => this.allerA(p, 1700, 2100 + k * 140, false))); partis(); }   // (ils s'effacent dans les fourrés)
        else { for (let k = 0; k < 6 && !this.fini; k++) await this.marcher(1, { pas: 90 }); bandits.forEach(p => this.emotion(p, '!', 1000)); }
      } };
    }
    return null;
  }
  // Le soir : elle s'accroupit au bord du chemin ; le feu, les fagots
  async soir() {
    const G = this.G;
    this.fumeeSoir(true);
    this.ecrire('Le soir tombe. Elle s\'arrête au bord du chemin, s\'accroupit et souffle une dernière bouffée.');
    await this.sAccroupir(); if (this.fini) return;
    const fx = this.etat.x + 300, f = this.bord(this.add.container(fx, this.sol + 30).setDepth(7));
    const halo = this.add.image(0, -30, 'halo').setScale(1.8).setTint(0xff9a40).setAlpha(0.55).setBlendMode(Phaser.BlendModes.ADD); f.add(halo);
    const feu = this.add.image(0, 12, feuDeCampHD(this, 0)).setOrigin(0.5, 1).setScale(2.4); f.add(feu);
    let k = 0; const flamme = this.time.addEvent({ delay: 150, loop: true, callback: () => { if (!feu.active) { flamme.remove(); return; } feu.setTexture(feuDeCampHD(this, (k = (k + 1) % 3))); } });
    const lueur = this.tweens.add({ targets: halo, alpha: { from: 0.4, to: 0.7 }, duration: 420, yoyo: true, repeat: -1 }); halo.once('destroy', () => lueur.remove());   // (pas de lueur sans feu)
    this.joueur = this.add.image(fx - 70, this.sol + 44, textureJoueur(this, G)).setOrigin(0.5, 1).setScale(echelleJoueur(6.6)).setDepth(7.1);
    const n = soirEnRoute(G);
    this.majTableau();
    this.ecrire(`Un feu de camp, les étoiles. ${n ? `Tu ramasses du bois mort : +${n} fagot${n > 1 ? 's' : ''} dans le filet${G.voyage.pip ? ' (Pip en rapporte une brassée)' : ''}.` : 'Le filet est plein : pas besoin de ramasser du bois.'} ${this.chat ? 'Le chat dort sur le toit, roulé en boule.' : ''}`);
    if (n) this.gain(`+${n} fagot${n > 1 ? 's' : ''}`);
    await this.attendreClic(); if (this.fini) return;
    this.joueur.destroy(); this.joueur = null;
    // la nuit passe : un fondu au noir, puis le matin
    await new Promise(ok => { this.cameras.main.fadeOut(700); this.cameras.main.once('camerafadeoutcomplete', ok); });
    f.destroy();
  }
  async matin() {
    const G = this.G;
    this.voile.setAlpha(0);
    this.retirerGue();   // (le ruisseau du pont étroit ou de l'ogre ne suit pas au matin : ses roseaux restaient figés devant la maison)
    for (const b of this.bordChemin) if (b.o.active && b.o !== this.voile) b.o.destroy();
    this.bordChemin = [];
    this.cameras.main.fadeIn(700);
    const lignes = (G.reveil && G.reveil.lignes) || [];
    if (lignes.length) { this.ecrire('Pendant la nuit : ' + lignes.slice(0, 2).join(' ')); await this.attendreClic(); }
  }

  // L'arrivée : Pont-Royal vue du fleuve, à l'aube ; puis la rue du pont, les pattes qui se rangent, le duc
  async arrivee() {
    const G = this.G;
    for (const t of this.gainsVifs || []) if (t.active) t.destroy();   // (un « +2 fagots » du soir ne flotte pas sur Pont-Royal)
    this.retirerGue();
    this.ecrire('L\'aube du dernier jour. Au détour d\'une colline, le grand fleuve... et Pont-Royal.');
    // la vue du fleuve, plein écran (sur l'interface : elle ne recule pas)
    const vue = this.enInterface(() => {
      this.add.rectangle(480, 270, 960, 540, 0x2a4a68).setDepth(20);
      this.add.image(0, 0, paysageHD(this, 960, 470, 'comte', 'aube')).setOrigin(0).setDisplaySize(960, 470).setDepth(20.1);
      this.add.rectangle(480, 505, 960, 70, 0x2a4a68).setDepth(20.2);
      this.add.image(0, 40, pontRoyalHD(this)).setOrigin(0).setScale(2).setDepth(20.3);
      for (const [x, y, sc, fl] of [[220, 470, 2, false], [790, 500, 1.6, true]]) { const avant = new Set(this.children.list); poserBarge(this, x, y, sc, fl); this.children.list.filter(o => !avant.has(o)).forEach(o => { o.setDepth(20.5); if (o.type === 'Image') this.tweens.add({ targets: o, y: o.y + 2, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }); }); }
      this.add.rectangle(480, 32, 940, 46, 0x1a120a, 0.9).setStrokeStyle(2, 0xd8b048).setDepth(21);
      this.add.text(30, 32, 'Pont-Royal : le grand pont de pierre blanche, les maisons serrées dessus, la chapelle, la citadelle sur son rocher. La route arrive par la haute rive, à hauteur du pont.', style(14, '#f6ead0', { fontStyle: 'italic', wordWrap: { width: 860 } })).setOrigin(0, 0.5).setDepth(21.1);
    });
    this.cameras.main.fadeIn(600);
    await this.attendreClic();
    vue.forEach(o => o.destroy());
    if (this.fini) return;
    // (planche 77) la tête de pont : la route arrive à plat sur la haute rive jusqu'à la tour qui garde le pont ; la
    // maison plie les genoux pour passer sous la voûte, et la voilà sur le pont (le fleuve est en bas, dans son lit)
    await this.versLeTeteDePont();
    if (this.fini) return;
    // la rue du pont : elle arrive debout par la gauche, à pas comptés, jusqu'au lot
    for (const t of [...this.tuiles, ...this.sols]) t.setVisible(false);
    if (this.paveRoyaume) { this.paveRoyaume.ts.destroy(); this.paveRoyaume = null; }
    for (const b of this.bordChemin) if (b.o.active) b.o.destroy();
    this.bordChemin = [];
    // (la vue recule : de chaque côté de la rue, le parapet et le fleuve continuent)
    const decor = [this.add.image(-160, -180, paysageHD(this, 1280, 650, 'comte', 0)).setOrigin(0).setDisplaySize(1280, 650).setDepth(0), this.add.image(0, 0, rueDuPontHD(this)).setOrigin(0).setScale(2).setDepth(0.2),
      this.add.image(-328, 0, rueDuPontHD(this)).setOrigin(0).setScale(2).setCrop(84, 0, 84, 235).setDepth(0.19), this.add.image(792, 0, rueDuPontHD(this)).setOrigin(0).setScale(2).setCrop(84, 0, 84, 235).setDepth(0.19),
      this.add.image(-160, this.sol, pavesHD(this, 1280, 70)).setOrigin(0).setScale(2).setDepth(0.5)];
    this.etat.x = -260; this.placer();
    if (!this.debout) await this.seLever();
    this.ecrire('Elle s\'engage sur le pont à petits pas. Les passants s\'écartent, un garde en lâche sa lance. Il reste un seul lot libre, entre le tonnelier et la maison rose.');
    this.vent = -90;
    for (let k = 0; k < 12 && !this.fini; k++) {
      this.pattes.forEach((l, i) => { l.leve = (k % 2 === 0) === (i === 1 || i === 2); l.p.setTexture(patteMaisonHD(this, l.leve ? 'pas' : 'debout', this.sorte, l.recul)); });
      await this.animerEtat({ x: this.etat.x + 34, haut: this.sol - 148 }, 260);
      this.pattes.forEach(l => { l.leve = false; l.p.setTexture(patteMaisonHD(this, 'debout', this.sorte, l.recul)); });
      await this.animerEtat({ x: Math.min(398, this.etat.x + 21), haut: this.sol - 142 }, 200);
      if (this.etat.x >= 398) break;
    }
    if (this.etat.x < 398) await this.animerEtat({ x: 398 }, 400);
    this.vent = 40;
    await this.attendreClic(); if (this.fini) return;
    await this.rangerPattes(); if (this.fini) return;
    // le duc vient « saluer », avec deux gardes
    const duc = imageCorps(this, 1180, this.sol + 40, 'duc', 6.4).setFlipX(true).setDepth(7);
    const gardes = [1260, 1330].map(x => { const g = gardePont(this, x, this.sol + 40, 6.4, true); g.g.setDepth(7); g.b.setDepth(7.01); return g; });
    const marche = (o, x, d) => { pasDeMarche(this, o, d); return new Promise(ok => this.tweens.add({ targets: o, x, duration: d, onComplete: ok })); };
    await Promise.all([marche(duc, 640, 2600), ...gardes.map((g, i) => Promise.all([marche(g.g, 770 + i * 90, 2600), marche(g.b, 770 + i * 90 - 6.4 * 3.4, 2600)]))]);
    this.joueur = this.add.image(this.facade.porteX, this.sol + 44, textureJoueur(this, G)).setOrigin(0.5, 1).setScale(echelleJoueur(6.6)).setDepth(7.2).setAlpha(0);
    this.tweens.add({ targets: this.joueur, alpha: 1, x: this.facade.porteX + 90, duration: 600 }); pasDeMarche(this, this.joueur, 600);
    this.emotion(duc, '♪', 1400);
    this.ecrire(`Le duc Aldebert Pansard : « Bienvenue, bienvenue ! À Pont-Royal, on paie son lot, la taxe du pont, et la taxe des fenêtres. Vous avez de bien belles fenêtres. »${coteCamp(G) === 'mal' ? ' Il te regarde un peu trop longtemps. « On m\'a parlé de vous. »' : ''}`);
    await this.attendreClic(); if (this.fini) return;
    this.ecrire(`Le batelier, depuis la Halle : « Bienvenue sur le pont ! Ici, tout arrive par le fleuve. » Ta nouvelle vie commence : les clients de Pont-Royal sont surtout des Hommes, et le duc passera chaque semaine.`);
    await this.attendreClic();
    decor.forEach(o => o.destroy());
    this.finir();
  }
  async versLeTeteDePont() {
    const sol = this.sol;
    if (!this.paveRoyaume) { this.paveRoyaume = { porte: { active: false }, ts: this.add.tileSprite(0, sol, 16, 70, pavesHD(this, 960, 70)).setOrigin(0).setTileScale(2).setDepth(0.55) }; this.uiCam.ignore(this.paveRoyaume.ts); }
    const { c, pont, ombre } = poserTeteDePontHD(this, sol);
    c.setDepth(3); ombre.setDepth(0.56); pont.forEach(o => o.setDepth(0.4));
    this.uiCam.ignore([c, ombre, ...pont]);
    this.bord(c, 1400); this.bord(ombre, 1400); pont.forEach(o => this.bord(o, o.x + 1400));
    const gardes = [[1180, 'Garde du pont'], [1640, 'Garde du pont']].map(([x, nom]) => { const g = gardePont(this, x, sol + 40, 6.4, x < 1400, nom); this.uiCam.ignore([g.g, g.b]); this.bord(g.b, g.b.x); g.b.setDepth(7.01); this.bord(g.g.setDepth(7)); return g.g; });
    this.placerDecor();
    if (!this.debout) await this.seLever();
    this.ecrire('La route du Royaume court sur la haute rive, à hauteur du pont : le fleuve coule tout en bas, dans son lit. Au bout, la tour de la tête de pont et sa garde.');
    for (let k = 0; k < 20 && !this.fini && c.x - TETE_PONT.demi - (this.etat.x + 190) > 40; k++) await this.marcher(1);
    this.emotion(gardes[0], '!', 1400);
    this.ecrire('Un garde en lâche sa lance. La maison plie les genoux et passe sous la tour à petits pas, la cheminée frôlant la voûte.');
    await this.plierGenoux(true);
    for (let k = 0; k < 20 && !this.fini && (this.etat.x - 190) - (c.x + TETE_PONT.demi) < 16; k++) await this.marcher(1);
    await this.plierGenoux(false);
    await this.marcher(2);
    this.cameras.main.fadeOut(500); await new Promise(ok => this.time.delayedCall(520, ok));
    for (const b of this.bordChemin) if (b.o.active) b.o.destroy();
    this.bordChemin = [];
    this.cameras.main.fadeIn(500);
  }
  // Les pattes se rangent : elle plie les genoux, les pattes rentrent dessous, plus rien ne dépasse
  async rangerPattes() {
    this.ecrire('Sur son lot, elle s\'accroupit, plie les genoux... et range ses pattes sous elle, comme un chat qui rentre les siennes.');
    await this.animerEtat({ haut: this.sol - 70 }, 900, 'Sine.easeInOut');
    await this.animerEtat({ haut: this.sol - 26 }, 800, 'Sine.easeIn');
    // les pattes rentrent : elles s'écrasent sous la maison et disparaissent
    await new Promise(ok => this.tweens.add({ targets: this.pattes.map(l => l.p), scaleY: 0.05, alpha: 0, duration: 600, onComplete: ok }));
    this.tweens.add({ targets: [this.dessous, this.attaches, this.filet], alpha: 0, duration: 500 });
    await this.animerEtat({ haut: this.sol }, 500, 'Sine.easeIn');
    for (const o of [this.dessous, this.attaches, this.filet, ...this.pattes.map(l => l.p)]) o.setVisible(false);
    this.cameras.main.shake(300, 0.005);
    for (let k = 0; k < 9; k++) { const nu = this.add.circle(this.etat.x - 180 + k * 45, this.sol + 4 - (k % 2) * 4, 12 + (k % 3) * 4, 0xd8c098, 0.6).setDepth(5.5); this.tweens.add({ targets: nu, scale: 2, alpha: 0, y: nu.y - 16, duration: 1400, onComplete: () => nu.destroy() }); }
    this.debout = false;
    this.ecrire('La poussière retombe. Une maison comme les autres : plus rien ne dépasse. Elle ressortira ses pattes pour le prochain voyage.');
    await this.attendreClic();
  }

  finir() {
    if (this.fini) return;
    this.fini = true;
    arriverAPontRoyal(this.G);
    Sauvegarde.maintenant(this.G, 'Maison');
    if (typeof noterJournal === 'function') noterJournal('arrivée à Pont-Royal');
    this.cameras.main.fadeOut(500);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Rue', { depuis: 'voyage' }));
  }
}
