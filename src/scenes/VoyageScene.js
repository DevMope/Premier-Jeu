// (v1.57, planche 75 v2 validée) Le grand voyage : la maison se lève et marche jusqu'à Pont-Royal. Rien ne glisse :
// elle avance pas à pas (devant-gauche et derrière-droite ensemble, puis l'inverse), le paysage défile au rythme de ses
// pas, la fumée file derrière elle. Chaque jour : ses étapes (les vergers et la vente par la fenêtre, le gué, la Porte
// des Hommes), un imprévu à trancher, puis le soir elle s'accroupit au bord du chemin, près du feu. Le dernier jour, à
// l'aube : Pont-Royal vue du fleuve, puis la rue du pont, où elle range ses pattes sous elle et où le duc vient « saluer ».
class VoyageScene extends Cinematique {
  constructor() { super('Voyage'); }

  init() { this.fini = false; }

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
    this.tuiles = [-960, 0, 960].map(x => this.add.image(x, -180, paysageHD(this, 960, sol + 180, 'comte', 0, { sansAstre: true })).setOrigin(0).setDisplaySize(960, sol + 180).setDepth(0));
    this.sols = [-960, 0, 960].map(x => this.add.image(x, sol, cheminTerreHD(this, 960, 70)).setOrigin(0).setDisplaySize(960, 70).setDepth(0.5));
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
    this.sys.events.on('addedtoscene', o => { if (this.uiCam && !this.enUI) this.uiCam.ignore(o); });
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
  gain(texte, positif = true, y = 160) { this.enInterface(() => gainEnDirect(this, 480, y, texte, positif, { taille: 15, duree: 2600 })); }
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
  placer() {
    const { x, haut } = this.etat, lev = this.sol - haut;
    for (const m of this.maison) m.o.setPosition(x + m.dx, haut + m.dy);
    this.repliees.forEach((p, i) => p.setPosition(x + this.bords[i], this.sol + 4));
    this.dessous.setPosition(x, haut - 6); this.attaches.setPosition(x, haut - 4); this.filet.setPosition(x + 4, haut + 60);
    for (const l of this.pattes) {
      l.p.x = x + l.dx;
      l.p.scaleY = (l.devant ? 1.75 : 1.68) * Math.max(0.15, lev / 142);
      l.p.y = this.sol - (l.devant ? 0 : 6) - (l.leve ? (l.devant ? 14 : 24) : 0);
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
  // Marcher n pas : la maison lève ses pattes en diagonale, le décor recule d'autant (elle avance, rien ne glisse)
  async marcher(n, { pas = 56 } = {}) {
    this.vent = -90;
    for (let k = 0; k < n && !this.fini; k++) {
      this.pattes.forEach((l, i) => { l.leve = (k % 2 === 0) === (i === 1 || i === 2); l.p.setTexture(patteMaisonHD(this, l.leve ? 'pas' : 'debout', this.sorte, l.recul)); });
      await Promise.all([this.animerEtat({ haut: this.sol - 148 }, 260), this.defiler(pas, 260)]);
      this.pattes.forEach(l => { l.leve = false; l.p.setTexture(patteMaisonHD(this, 'debout', this.sorte, l.recul)); });
      await Promise.all([this.animerEtat({ haut: this.sol - 142 }, 200), this.defiler(pas * 0.4, 200)]);
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
    this.tuiles.forEach((t, i) => { t.x = ((i - 1) * 960 - p * 0.5) % 2880; if (t.x < -1440) t.x += 2880; });
    this.sols.forEach((t, i) => { t.x = ((i - 1) * 960 - p) % 2880; if (t.x < -1440) t.x += 2880; });
    for (const b of this.bordChemin) if (b.o.active) b.o.x = b.x - p;
  }
  // Poser quelque chose au bord du chemin, à x (à l'écran, maintenant) : il reculera quand elle avance
  bord(o, x = o.x) { this.bordChemin.push({ o, x: x + this.parcouru }); o.x = x; return o; }
  changerBiome(biome, nuit = 0) {
    if (this.biome === biome) return;
    this.biome = biome;
    const cle = paysageHD(this, 960, this.sol + 180, biome, nuit, { sansAstre: true });
    for (const t of this.tuiles) { const n = this.add.image(t.x, t.y, cle).setOrigin(0).setDisplaySize(960, this.sol + 180).setDepth(0.01).setAlpha(0); this.tweens.add({ targets: n, alpha: 1, duration: 1200, onComplete: () => { t.setTexture(cle).setDisplaySize(960, this.sol + 180); n.destroy(); } }); }
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
      Sauvegarde.maintenant(G, 'Voyage');
      if (G.faillite) { this.fini = true; this.scene.start('Faillite'); return; }
      await this.matin();
    }
  }

  // Le départ : les voisins, les adieux de Garrick ; elle se lève et s'en va
  async depart() {
    const G = this.G, sol = this.sol;
    const voisins = [['Rosalie', { race: 'humain', nom: 'Rosalie', feminin: true, niveau: 'novice' }, 640], ['Garrick', 'mentor', 720], ['Thorgal', { race: 'nain', nom: 'Thorgal', costume: 'forgeron', niveau: 'aguerri' }, 800], ['Barnabé', { race: 'hobbit', nom: 'Barnabé', niveau: 'novice' }, 870]];
    this.voisins = voisins.map(([nom, q, x]) => this.bord(imageCorps(this, x, sol + 40, q, 6.4).setFlipX(true).setDepth(7)));
    this.joueur = this.add.image(560, sol + 44, textureJoueur(this, G)).setOrigin(0.5, 1).setScale(echelleJoueur(6.6)).setFlipX(true).setDepth(7);
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
    await this.marcher(8);
    this.ecrire('Les champs de la Comté défilent. Derrière, les voisins ne sont plus que des points qui agitent les bras.');
    await this.marcher(6);
  }
  // Les vergers : une voyageuse marche à côté et achète par la fenêtre
  async vergers() {
    const G = this.G;
    this.changerBiome('foret');
    this.ecrire('Les vergers : des pommiers à perte de vue. Une voyageuse marche à côté de la maison et frappe à la vitrine.');
    await this.marcher(4);
    const q = { race: 'elfe', nom: 'Une voyageuse', feminin: true, niveau: 'aguerri' };
    const p = imageCorps(this, -60, this.sol + 40, q, 6.4).setDepth(7);
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
  async gue() {
    this.changerBiome('comte');
    this.ecrire('Le gué : la rivière est large et lente. Elle y entre pas à pas, l\'eau jusqu\'aux genoux ; les poissons s\'écartent.');
    // la rivière coupe le chemin : trois bandes d'eau de suite, qui reculent avec le sol
    for (let k = 0; k < 3; k++) { const e = this.bord(this.add.image(900 + k * 960, this.sol - 30, eauGueHD(this)).setOrigin(0, 0).setScale(2).setDepth(4.95)); this.tweens.add({ targets: e, alpha: { from: 0.92, to: 1 }, duration: 700, yoyo: true, repeat: -1 }); }
    await this.marcher(12);
    for (let k = 0; k < 6; k++) { const g = this.add.circle(this.etat.x - 110 + k * 44, this.sol + 4, 6, 0xd8ecff, 0.8).setDepth(5); this.tweens.add({ targets: g, y: g.y - 30, alpha: 0, duration: 700, delay: k * 90, onComplete: () => g.destroy() }); }
    await this.marcher(12);
    await this.attendreClic();
  }
  // La Porte des Hommes : la frontière, la garde, la taxe ; la lettre du duc ou la fouille
  async porte() {
    const G = this.G, sol = this.sol;
    this.changerBiome('citadelle');
    const porte = this.bord(this.add.image(1500, sol + 2, porteDesHommesHD(this)).setOrigin(0.5, 1).setScale(2).setDepth(3));
    const gardes = [[1180, 'Le sergent de la Porte'], [1260, 'Garde du pont'], [1720, 'Garde du pont']].map(([x, nom]) => { const g = gardePont(this, x, sol + 40, 6.4, true, nom); this.bord(g.b, g.b.x); g.b.setDepth(7.01); this.bord(g.g.setDepth(7)); return g.g; });
    this.ecrire('La Porte des Hommes : deux tours de pierre blanche, la herse levée, les bannières du royaume. La garde barre la route.');
    await this.marcher(10);
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
    this.ecrire('La maison passe sous l\'arche en baissant la cheminée. Le Royaume des Hommes : des routes pavées, des bornes, des villages de pierre blanche.');
    await this.marcher(14);
  }
  // Un imprévu : le récit, puis le choix, puis ce qui a changé (en direct)
  async imprevu(id) {
    const G = this.G, I = IMPREVUS[id];
    await this.marcher(4);
    const o = choixPossibles(G, id);
    const i = await this.choisir(I.nom, I.texte, o);
    const r = choisirImprevu(G, id, i);
    this.ecrire(r.texte || '');
    (r.gains || []).forEach((t, k) => this.time.delayedCall(k * 500, () => this.gain(t, !/^−/.test(t), 160 + k * 26)));
    if (/[+]|♥|☀/.test((r.gains || []).join(' '))) Son.jouer('pieces');
    this.majTableau();
    if (id === 'brigands' && i === 1 && this.chat) { this.emotion(this.chat.o, '!', 1600); this.cameras.main.shake(300, 0.004); }
    await this.attendreClic();
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
    this.tweens.add({ targets: halo, alpha: { from: 0.4, to: 0.7 }, duration: 420, yoyo: true, repeat: -1 });
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
    for (const b of this.bordChemin) if (b.o.active && b.o !== this.voile) b.o.destroy();
    this.bordChemin = [];
    this.cameras.main.fadeIn(700);
    const lignes = (G.reveil && G.reveil.lignes) || [];
    if (lignes.length) { this.ecrire('Pendant la nuit : ' + lignes.slice(0, 2).join(' ')); await this.attendreClic(); }
  }

  // L'arrivée : Pont-Royal vue du fleuve, à l'aube ; puis la rue du pont, les pattes qui se rangent, le duc
  async arrivee() {
    const G = this.G;
    this.ecrire('L\'aube du dernier jour. Au détour d\'une colline, le grand fleuve... et Pont-Royal.');
    // la vue du fleuve, plein écran (sur l'interface : elle ne recule pas)
    const vue = this.enInterface(() => {
      this.add.rectangle(480, 270, 960, 540, 0x2a4a68).setDepth(20);
      this.add.image(0, 0, paysageHD(this, 960, 470, 'comte', 'aube')).setOrigin(0).setDisplaySize(960, 470).setDepth(20.1);
      this.add.rectangle(480, 505, 960, 70, 0x2a4a68).setDepth(20.2);
      this.add.image(0, 40, pontRoyalHD(this)).setOrigin(0).setScale(2).setDepth(20.3);
      for (const [x, y, sc, fl] of [[220, 470, 2, false], [790, 500, 1.6, true]]) { const avant = new Set(this.children.list); poserBarge(this, x, y, sc, fl); this.children.list.filter(o => !avant.has(o)).forEach(o => { o.setDepth(20.5); if (o.type === 'Image') this.tweens.add({ targets: o, y: o.y + 2, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }); }); }
      this.add.rectangle(480, 32, 940, 46, 0x1a120a, 0.9).setStrokeStyle(2, 0xd8b048).setDepth(21);
      this.add.text(30, 32, 'Pont-Royal : le grand pont de pierre blanche à cinq arches, les maisons serrées dessus, la chapelle, la citadelle sur son rocher. Les barges descendent le fleuve.', style(14, '#f6ead0', { fontStyle: 'italic', wordWrap: { width: 860 } })).setOrigin(0, 0.5).setDepth(21.1);
    });
    this.cameras.main.fadeIn(600);
    await this.attendreClic();
    vue.forEach(o => o.destroy());
    // la rue du pont : elle arrive debout par la gauche, à pas comptés, jusqu'au lot
    for (const t of [...this.tuiles, ...this.sols]) t.setVisible(false);
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
