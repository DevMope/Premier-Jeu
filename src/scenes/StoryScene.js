// La petite cinématique : on voit l'aventure d'un voyageur, épreuve par épreuve,
// et comment chaque objet du colis l'a aidé (ou lui a manqué).
// (v1.62) de combien le repère des épreuves avance dans le monde, du départ au retour au comptoir
const BASE_MAX_RECIT = 480;
// (v1.62) où elle s'arrête au retour (dans le repère de l'étape : à l'écran, vers x = 740, à gauche de la besace)
const FIN_RECIT = 765;
// (v1.62) où est posée la besace du récit (à l'écran) : sur le bord bas de la bulle, à droite de la rangée des
// boutons ; son compte est à sa gauche. RANGEE_RECIT : la rangée des boutons, collée au-dessus de la boîte du conteur.
const BESACE_RECIT = { x: 892, y: 382 };
const RANGEE_RECIT = 349;

class StoryScene extends Cinematique {
  // (v0.84) la musique du récit, retenue : elle reste la même quand on revient du menu pause
  musique(theme) { this.musiqueVoulue = theme; Son.ambiance(theme); }
  // (v1.64) la musique de la contrée selon le moment : 'route', 'danger', 'victoire' (voir musiqueRecit, src/sonsRecits.js)
  musiqueContree(moment, sinon) { return typeof musiqueRecit === 'function' ? musiqueRecit(this.biome, moment) : sinon; }
  // (v1.64) le sol sous ses pieds, pour le bruit de ses pas
  solRecit() { return typeof solDuBiome === 'function' ? solDuBiome(this.biome) : null; }

  constructor() { super('Recit'); }

  init(data) {
    this.idParti = data.id;
  }

  create() {
    this.musiqueVoulue = null;
    this.modeFiche = false;
    this.G = window.GAME;
    // (la scène est réutilisée d'un récit à l'autre : on remet la vitesse normale)
    this.rapide = false;
    this.blesse = false;
    this.menace = null;
    this.tweens.timeScale = 1;
    this.time.timeScale = 1;
    this.parti = this.G.partis.find(p => p.voyageur.id === this.idParti);
    this.armeTenue = this.parti ? armeEmportee(this.parti.voyageur, this.parti.colis || {}) : 'epee';   // (v0.63)
    if (!this.parti) { this.time.delayedCall(0, () => allerA(this, 'Comptoir')); return; }
    const v = this.parti.voyageur;
    this.e = v.feminin ? 'e' : '';

    this.cameras.main.fadeIn(500);
    // Deux caméras : la principale filme le monde (elle zoome, se déplace, tremble), une seconde,
    // fixe, dessine l'interface (la boîte de texte, les cœurs, le conteur). Tout ce qui n'est pas
    // dans `this.ui` est caché à la caméra de l'interface (voir `filtrerCameras`).
    this.zoomBase = this.cameras.main.zoom;
    this.ui = this.add.container(0, 0).setDepth(20);
    this.camUI = this.cameras.add(0, 0, this.cameras.main.width, this.cameras.main.height).setOrigin(0, 0).setZoom(this.zoomBase);
    this.cameras.main.ignore(this.ui);
    this.events.off('postupdate', this.filtrerCameras, this);
    this.events.off('passer');   // (audit v0.59 : un « Passer » d'un récit interrompu ne doit pas relancer l'ancien)
    this.events.on('postupdate', this.filtrerCameras, this);
    this.biome = v.zone ? ZONES[v.zone].biome : 'comte';
    // (v1.62, planche 87) Le paysage de la zone où il est parti : un monde d'un écran et demi, en plans qui
    // défilent chacun à leur vitesse quand la caméra suit le voyageur (voir creerMonde)
    this.creerMonde(this.biome);
    // (audit v0.54) le voile de la nuit couvre aussi le plan moyen, et le plan moyen reste derrière le voyageur
    // (v1.62 : fixé à l'écran, il couvre tout ce que filme la caméra, où qu'elle soit)
    this.voile = this.add.rectangle(480, 185, 960, 370, 0x05051a, 0).setDepth(-0.4).setScrollFactor(0);
    this.decor = this.add.container(0, 0);
    // (v0.78) chaque destination a sa variante du décor de son royaume : arbres, repère, sol, faune
    this.variante = varianteRecit(v.zone);
    this.planterPlanMoyen(this.biome);
    this.planterPremierPlan(this.biome);
    planterVarianteRecit(this, v.zone, this.biome);
    this.meteoBiome(this.biome);
    // (v1.64) les bruits de fond de la contrée (le vent des cols, les crapauds du marais), et les sons préparés d'avance
    this.conclu = false; this.finRecit = false;
    if (typeof ambianceSonoreRecit === 'function') ambianceSonoreRecit(this, v.zone, this.biome);

    this.perso = imageCorps(this, -60, 360, v, 6);
    this.fCorps = echelleCorps(this.perso.texture.key);
    this.creerCompagnons(v);
    this.figerDessins();
    this.planMoyen.sort('y');
    if (this.raisLumiere) this.planMoyen.bringToTop(this.raisLumiere);

    this.coeurs = [];
    // Ses cœurs, plus ceux gagnés grâce aux soins donnés en plus.
    const pvDepart = (this.parti.resultat && this.parti.resultat.pvDepart) || v.pv;
    for (let i = 0; i < pvDepart; i++) {
      // (v1.61) les cœurs en plus (potion, escorte, tarte) sont dorés : les perdre n'est pas une blessure
      const c = this.add.image(30 + i * 34, 46, i >= v.pv ? 'hd_coeurOr' : 'hd_coeur').setScale(2);
      c.bonus = i >= v.pv;
      this.coeurs.push(c);
    }
    this.titre = this.add.text(480, 26, '', style(20, '#fff4dc', { fontStyle: 'bold', stroke: '#2a1a10', strokeThickness: 4 })).setOrigin(0.5);

    this.creerBoiteTexte();
    // La bulle de rêve : le récit est un souvenir que le voyageur nous raconte. Le monde est vu
    // à travers une bulle aux bords de nuage, qui part de sa tête, en bas à gauche.
    this.ui.add([this.boite, this.entete, this.texte, this.indice]);
    this.texte.setX(176).setWordWrapWidth(760);
    this.entete.setX(176);
    this.creerBulleDeReve();
    this.ui.add([...this.coeurs, this.titre]);
    // (v1.61) ta bourse, toujours visible en haut : on paie un dédommagement, des soins, une trouvaille.
    // (v1.62, planche 84) elle a sa place : posée sur le bord bas de la bulle, son compte à côté d'elle
    this.creerBesaceBord();
    this.time.addEvent({ delay: 200, loop: true, callback: () => { if (!this.piecesEnVol && this.bourse.dernier !== Math.floor(this.G.argent)) this.bourse.maj(Math.floor(this.G.argent)); } });
    // Passer : le récit défile en accéléré jusqu'à la fin (les choix de la fin restent à faire).
    const passer = this.boutonPasser(() => {
      if (this.rapide) return;
      this.rapide = true;
      this.tweens.timeScale = 6;
      this.time.timeScale = 6;
      this.events.emit('passer');
    });
    if (passer) this.ui.add(passer);
    // (v0.97) quitter un récit en cours (☰) : ses écouteurs d'image et ses particules partent avec lui
    this.events.once('shutdown', () => { const m = this.menace; if (m && m.objets) m.objets.splice(0).forEach(o => { try { o.destroy && o.destroy(); } catch (e) { /* rien */ } }); });

    // (v0.97) une erreur pendant une épreuve : on saute à la fin du récit plutôt que de rester bloqué
    this.raconter().catch(e => { if (typeof noterJournal === 'function') noterJournal('ERREUR récit : ' + ((e && e.message) || e)); if (this.scene.isActive() && !this.conclu) { this.conclu = true; this.conclure().catch(() => allerA(this, 'Comptoir')); } });
  }

  // Tout ce qui n'est pas dans `this.ui` est caché à la caméra de l'interface, et seule la caméra
  // de l'interface voit `this.ui`. (À chaque tour, pour attraper ce qui vient d'être créé.)
  filtrerCameras() {
    if (!this.camUI || !this.camUI.id) return;
    const bit = this.camUI.id;
    for (const o of this.children.list) if (o !== this.ui && !(o.cameraFilter & bit)) o.cameraFilter |= bit;
  }

  // La caméra du monde cadre un point (x, y) avec un grossissement k (1 = tout l'écran)
  // (v1.62) `decalage` : on cadre dans le repère de l'étape suivante, qui commence `decalage` plus loin dans le monde
  cadrer(x, y, k = 1, duree = 600, ease = 'Sine.easeInOut', decalage = 0) {
    const cam = this.cameras.main;
    const zoom = this.zoomBase * k;
    const sx = decalage + Phaser.Math.Clamp(x - 480 / k, 0, Math.max(0, 960 - 960 / k));
    // (le sol, à y = 360, reste à la même hauteur à l'écran : on ne cadre qu'en largeur, et `y`
    // ne fait que pencher un peu le regard vers le haut quand il est petit)
    const sy = Phaser.Math.Clamp(360 - 360 / k - Math.max(0, 200 - y) * 0.1, 0, 360 - 360 / k);
    this.cadreVise = { sx, sy, k };
    this.tweens.killTweensOf(cam);
    if (duree <= 0) { cam.setZoom(zoom).setScroll(sx, sy); return Promise.resolve(); }
    return this.animer({ targets: cam, zoom, scrollX: sx, scrollY: sy, duration: duree, ease });
  }

  // Un coup de zoom sur un impact, puis retour
  async coupDeZoom(x, y, k = 1.35) {
    await this.cadrer(x, y, k, 160, 'Quad.easeOut');
    await this.attendre(220);
    await this.cadrer(x, y, 1, 420, 'Sine.easeInOut');
  }

  // La bulle de rêve : un cadre aux bords de nuage autour du monde, trois petites bulles vers
  // le conteur, et le conteur lui-même (son buste) qui raconte depuis le coin de la boîte
  creerBulleDeReve() {
    const v = this.parti.voyageur, vivant = this.parti.resultat.vivant;
    const g = this.add.graphics();
    const teinte = vivant ? 0xf3e6c8 : 0x8a7aa8;
    g.fillStyle(0x1a120a, 1);
    // le cadre : l'extérieur de la bulle, plein, puis des bosses de nuage le long du bord
    g.fillRect(0, 0, 960, 10).fillRect(0, 372, 960, 12).fillRect(0, 0, 10, 384).fillRect(950, 0, 10, 384);
    g.fillStyle(teinte, 0.9);
    for (let x = 0; x <= 960; x += 44) { g.fillCircle(x, 2, 22 + (x % 88 ? 0 : 6)); g.fillCircle(x + 22, 379, 13 + (x % 88 ? 3 : 0)); }
    for (let y = 0; y <= 370; y += 40) { g.fillCircle(2, y, 20 + (y % 80 ? 0 : 5)); g.fillCircle(958, y + 20, 18 + (y % 80 ? 5 : 0)); }
    g.fillStyle(teinte, 0.75);
    for (let x = 22; x <= 960; x += 44) { g.fillCircle(x, 8, 16); g.fillCircle(x - 12, 376, 9); }
    // les petites bulles qui mènent au conteur
    for (const [bx, by, r] of [[112, 392, 9], [96, 412, 6], [86, 428, 4]]) { g.fillStyle(teinte, 0.9); g.fillCircle(bx, by, r); }
    // (v1.62) la bulle ne bouge pas : on la fige en une image (ses dizaines de ronds ne se retracent plus à chaque image)
    const cleBulle = 'bulleReve_' + (vivant ? 'vivant' : 'carnet');
    if (this.textures.exists(cleBulle)) this.textures.remove(cleBulle);
    const rt = this.make.renderTexture({ width: 960, height: 440 }, false);
    rt.draw(g, 0, 0);
    rt.saveTexture(cleBulle);
    g.destroy();
    this.events.once('shutdown', () => rt.destroy());
    this.bulleCadre = this.add.image(0, 0, cleBulle).setOrigin(0, 0);
    this.ui.add(this.bulleCadre);
    // le conteur : son buste, dans le coin de la boîte de texte (ou son carnet, s'il n'est plus là)
    if (vivant) {
      this.conteur = this.add.image(92, 538, textureBusteHD(this, v, 'content')).setOrigin(0.5, 1).setScale(1.45);
      this.ui.add(this.conteur);
      this.tweens.add({ targets: this.conteur, y: 541, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    } else {
      // (v1.62, planche 84) son carnet de voyage, ouvert : l'écriture tremble, la sangle défaite pend
      creerCarnetsHD(this);
      const carnet = this.add.image(90, 474, 'carnetOuvertHD').setScale(2).setAngle(-6);
      this.ui.add(carnet);
    }
  }

  // (v1.61) le texte tient toujours dans sa boîte, au-dessus de « clique pour continuer » : la police rétrécit
  // si besoin (avant, un retour blessé avec une ligne de plus sortait du cadre, en bas)
  ajusterTexte(texte) {
    const t = this.texte, bas = 500;
    let f = 18;
    t.setFontSize(f).setLineSpacing(6).setText(texte || '');
    while (t.y + t.height > bas && f > 11) { f--; t.setFontSize(f).setLineSpacing(f >= 15 ? 4 : 1); }
    t.setText('');
  }
  ajouterTexte(suite) {
    if (this.defile) this.defile.finir();
    const avant = this.texte.text;
    this.ajusterTexte((this.texteComplet || '') + suite);
    this.texte.setText(avant);
    super.ajouterTexte(suite);
  }

  // (v1.62, planche 84, retour du joueur) La besace du récit est posée sur le bord bas de la bulle, à droite de la
  // rangée des boutons ; son compte est écrit à sa gauche. Quand on paie, elle penche vers la droite et ses pièces
  // roulent sur le bord.
  creerBesaceBord() {
    this.bourse = bourse(this, BESACE_RECIT.x, BESACE_RECIT.y, this.G.argent, { echelle: 1.4, taille: 14, conteneur: this.ui, sens: 1, gain: [-6, -76] });
    this.bourse.texte.setOrigin(1, 0.5).setPosition(-26, -9);
    this.ui.add(this.bourse);
  }

  // Le conteur parle (sa voix) à chaque nouveau texte
  ecrire(entete, texte) {
    this.ajusterTexte(texte);
    super.ecrire(entete, texte);
    if (this.conteur && this.parti && this.parti.resultat.vivant && !this.rapide) Son.jouer('voix', { personne: this.parti.voyageur, duree: Math.min(1.8, 0.3 + (texte || '').length * 0.012), force: 0.7 });
  }

  // Les mots qui surgissent se dessinent dans le monde (devant tout)
  onomatopee(x, y, mot, couleur) {
    super.onomatopee(x, y, mot, couleur);
  }

  // Il marche jusqu'à x (dans le repère de l'étape d'après, qui commence `d` plus loin dans le monde) : il
  // avance vraiment sur le chemin, la caméra le suit, et chaque plan défile à sa vitesse. Rien ne glisse.
  async marcherVers(x, d = 0) {
    const cible = x + d;
    const duree = Math.max(300, Math.abs(cible - this.perso.x) * 5);
    this.perso.setFlipX(cible < this.perso.x);
    pasDeMarche(this, this.perso, duree, { sol: this.solRecit() });
    const y = this.perso.y;
    this.tweens.add({ targets: this.perso, y: y - 2, duration: 125, yoyo: true, repeat: Math.floor(duree / 250) });
    this.cadrer(x + 120, 250, 1.12, duree, 'Sine.easeInOut', d);
    await this.animer({ targets: this.perso, x: cible, duration: duree, ease: 'Linear' });
    this.perso.setScale(6 * this.fCorps).setY(y).setFlipX(false);
    this.recaler(d);
  }

  // --- (v1.62, planche 87) Le monde du récit, en plans ---

  // Le ciel (×0,1), les collines lointaines (×0,3), les collines du milieu et le repère (×0,55), le sol, le pré
  // et la barrière (×1), les herbes du bord (×1,25) : chaque plan suit la caméra à sa vitesse.
  creerMonde(biome) {
    this.base = 0;            // où commence, dans le monde, le repère de l'épreuve en cours (voir recaler)
    this.couches = [];        // [objet, facteur de défilement]
    this.raisLumiere = null; this.arbresRecit = []; this.reperesRecit = []; this.lacX = this.lacY = null;
    const H = 386;            // (le haut du chemin tombe en y = 360, sous les pieds du voyageur)
    const cle = paysageHD(this, LARGEUR_RECIT + 40, H, biome, 0, { couches: true, reserves: typeof emprisesRepere === 'function' ? emprisesRepere(varianteRecit(this.parti.voyageur.zone)) : null });   // (planche 91 : la place des repères fondus)
    const cleCiel = paysageHD(this, 1080, H, biome, 0, { couches: true });
    const plan = (k, f, prof) => { const im = this.add.image(-40, (this.textures.get(k).haut || 0) * 2, k).setOrigin(0).setScale(2).setScrollFactor(f, 1).setDepth(prof); this.couches.push([im, f]); return im; };
    const conteneur = (f, prof) => { const c = this.add.container(0, 0).setDepth(prof).setScrollFactor(f, 1); c.facteur = f; this.couches.push([c, f]); return c; };
    plan(cleCiel + '_ciel', 0.1, -4);
    this.planCiel = conteneur(0.1, -3.9);                 // ce qui vole, au loin
    plan(cle + '_loin', 0.3, -3);
    this.coucheCollines = plan(cle + '_collines', 0.55, -2.6);
    this.planLoin = conteneur(0.55, -2.5);                // le repère, sur les collines
    this.coucheSol = plan(cle + '_sol', 1, -2);
    this.planMoyen = conteneur(1, -1.5);                  // tout ce qui est posé dans le pré, derrière la barrière
    plan(cle + '_barriere', 1, -1.4);
    this.premierPlan = conteneur(1.25, 6.5);              // les herbes et les fleurs du bord, devant tout
    this.cleCouches = cle;
  }
  // Les herbes du bord et les silhouettes du pré ne bougent pas : on les fige en une image (un dessin vectoriel
  // de cette taille se retracerait à chaque image)
  figerDessins() {
    this.nFiges = 0;
    for (const [plan, y0, h] of [[this.premierPlan, 300, 90], [this.planMoyen, 120, 236]]) {
      for (const g of [...plan.list]) {
        if (g.type !== 'Graphics' || g === this.raisLumiere) continue;
        const cle = 'recitFige_' + (this.nFiges = (this.nFiges || 0) + 1);
        if (this.textures.exists(cle)) this.textures.remove(cle);
        const rt = this.make.renderTexture({ width: LARGEUR_RECIT + 600, height: h }, false);
        rt.draw(g, 160, -y0);
        rt.saveTexture(cle);
        const im = dansPlan(plan, this.add.image(-160, y0, cle).setOrigin(0, 0));
        plan.moveTo(im, plan.getIndex(g));
        g.destroy();
        this.events.once('shutdown', () => { rt.destroy(); });
      }
    }
  }
  // La crête des collines du milieu, à l'abscisse x de leur plan (pour y poser le repère, les pieds dans l'herbe)
  creteCollines(x) {
    try {
      const src = this.textures.get(this.cleCouches + '_collines').getSourceImage(), ctx = src.getContext('2d');
      const tx = Phaser.Math.Clamp(Math.floor((x + 40) / 2), 0, src.width - 1), d = ctx.getImageData(tx, 0, 1, src.height).data;
      const haut = this.textures.get(this.cleCouches + '_collines').haut || 0;
      for (let y = 0; y < src.height; y++) if (d[y * 4 + 3]) return (y + haut) * 2;
    } catch (e) { /* (pas de crête lisible : une hauteur moyenne) */ }
    return 280;
  }
  // L'abscisse, dans le monde (le plan du pré), du bord gauche de ce que filme la caméra
  xMondeVu() { return this.cameras.main.scrollX + this.base; }
  // On passe au repère de l'étape suivante, `d` plus loin : tout recule de `d` dans le monde, la caméra
  // aussi (chaque plan de `d` fois son facteur) ; rien ne bouge à l'écran. Les épreuves gardent ainsi
  // leurs places d'avant (le voyageur entre 140 et 600, les bêtes qui arrivent de x = 1040...).
  recaler(d) {
    if (!d) return;
    this.base += d;
    const cam = this.cameras.main;
    this.tweens.killTweensOf(cam);
    cam.scrollX -= d;
    if (this.cadreVise) this.cadreVise.sx -= d;
    for (const [o, f] of this.couches) o.x -= d * f;
    this.perso.x -= d;
    for (const c of this.compagnons || []) c.x -= d;
  }
  // Le repère de l'étape i (sur n) : il avance avec l'histoire, jusqu'au bout du monde pour le retour au comptoir
  baseEtape(i, n) { return Math.round(BASE_MAX_RECIT * Math.min(1, i / Math.max(1, n))); }

  // --- Le récit ---

  async raconter() {
    const v = this.parti.voyageur;
    const r = this.parti.resultat;
    const etapes = v.epreuves.length;

    this.titre.setText(r.vivant ? 'Le récit ' + dePersonne(v.nom) : 'Le carnet ' + dePersonne(v.nom)).setColor(couleurNom(this.G, v.nom, true));
    // (la musique suit le récit : v1.64, la marche de sa contrée, son danger, sa victoire ; la tristesse pour un carnet)
    this.musique(r.vivant ? this.musiqueContree('route', 'recitEtonne') : 'recitTriste');
    this.ecrire(v.quete, r.vivant
      ? `${v.nom} est revenu${this.e} au comptoir, ${this.etatAuRetour()}. Assis${this.e} sur le rebord de la fenêtre, ${v.feminin ? 'elle' : 'il'} te raconte son aventure...`
      : `${v.nom} n'est jamais revenu${this.e}... ${this.G.faucheuse && this.G.faucheuse.visites ? 'La Faucheuse a laissé son carnet de voyage sur ton comptoir' : 'Un berger a rapporté son carnet de voyage'}. Tu l'ouvres en tremblant.`);
    // (v0.84) après un premier récit vu en entier : le choix entre la cinématique et la fiche résumée
    if ((this.G.recitsVus || 0) > 0 && !this.rapide) {
      this.modeFiche = await this.choisirRecitOuFiche();
      if (this.modeFiche) return this.conclure();
    } else await this.attendreClic();
    if (typeof decouverteDuLieu === 'function') await decouverteDuLieu(this, 'depart');   // (planche 91 : la première fois au val d'Ardévanne, à Sérambre)

    for (let i = 0; i < r.etapes.length; i++) {
      const { epreuve, niveau, reussie, pvApres, piege, pvAvant, sauvee, repli, saignement, fane } = r.etapes[i];
      const fanee = fane ? '\n(Son trèfle de chance s\'est fané : le cadeau a servi.)' : '';
      // (v0.59) une scène d'épreuve peut l'avoir fait avancer : on repart d'où il est.
      // (v1.62) le monde fait un écran et demi : l'étape i est aussi `d` plus loin dans le monde (la caméra suit)
      let d = Phaser.Math.Clamp(this.baseEtape(i, etapes) - this.base, 0, BASE_MAX_RECIT - this.base);
      if (this.perso.x - d > 600) d = Math.min(BASE_MAX_RECIT - this.base, this.perso.x - 600);
      const x = Phaser.Math.Clamp(Math.max(140 + i * (680 / etapes), this.perso.x - d), 0, 600);

      if (this.meteo) { this.meteo.remove(); this.meteo = null; }
      this.nettoyerScenario();
      this.tweens.killTweensOf(this.decor.list);   // (audit v0.61 : les tweens en boucle des décors)
      this.decor.removeAll(true);
      this.titreEtape = r.vivant ? `Épreuve ${i + 1} / ${etapes}` : `Jour ${Math.min(v.duree || etapes, 1 + Math.floor(i * (v.duree || etapes) / etapes))}`;
      this.ecrire(this.titreEtape, '...');
      await this.marcherVers(x, d);
      this.planterDecor(epreuve.type, x + 130, epreuve);
      const scene = this.menace.scenario;
      this.menace.niveau = niveau;
      this.menace.texteIssue = epreuve[niveau] || '';
      this.cadrer(x + 150, 240, scene ? 1.12 : 1.22, 900);   // (on s'approche de ce qui l'attend)
      this.ecrire(this.titreEtape, accord(epreuve.intro, v));
      // (v0.59) la scène se joue pendant qu'on lit : la bête arrive, la nuit tombe...
      if (scene && scene.avant) await scene.avant.call(this);
      await this.attendreClic();
      // (v1.22) le pigeon envoyé au comptoir : le secours arrive ici (ou personne ne vient)
      const sos = this.parti.detresse;
      if (sos && sos.choix && sos.i === i) await this.secoursDetresse(sos);

      if (niveau !== 'rien') {
        await this.montrerObjet(epreuve.besoin);
        if (scene && scene.utiliser) await scene.utiliser.call(this, epreuve.besoin, reussie && !piege, niveau);
        else await this.utiliserObjet(epreuve.besoin);
      }

      // Un objet piégé : il lâche au pire moment, et c'est fini.
      if (piege) {
        this.ecrire(this.titreEtape, `« ${accord(PIEGES[piege].mort, v)} »`);
        this.cameras.main.flash(400, 90, 0, 30);
        Son.jouer('froid');
        await this.issue(false);
        for (let pv = (pvAvant || 1) - 1; pv >= 0; pv--) await this.blesser(pv);
        await this.attendreClic();
        continue;
      }

      // Sa bonne étoile : il rebrousse chemin au lieu de mourir.
      if (repli) {
        await this.trefle();
        this.ecrire(this.titreEtape, `« ${accord(epreuve[niveau], v)} »\n` +
          `J'ai senti que la prochaine fois serait la dernière. Ma bonne étoile m'a soufflé de rebrousser chemin... J'ai abandonné la mission.` + fanee);
        await this.attendreClic();
        break;
      }

      let suite;
      if (reussie && sauvee) {
        await this.trefle();
        suite = `C'était perdu... et puis un coup de chance incroyable ! Ma bonne étoile m'a sauvé${this.e}.` + fanee;
      } else if (reussie) {
        suite = niveau === 'complet' ? 'Épreuve surmontée !' : `Je m'en suis sorti${this.e}... de justesse.`;
        // (v0.93) la bénédiction de la nymphe a aidé
        if (r.etapes[i].beni) suite += " L'eau s'est écartée devant moi, comme si quelqu'un veillait...";
      } else {
        // (v0.60) le texte « complet » raconte une victoire : la blessure arrive avant d'en finir
      suite = niveau === 'complet' ? `Mais avant d'en finir, j'ai pris un mauvais coup : j'ai été blessé${this.e} !` : `J'ai été blessé${this.e} !`;
      }
      await this.issue(reussie);
      this.ecrire(this.titreEtape, `« ${accord(epreuve[niveau], v)} »\n${suite}`);
      // (v0.60) le conteur revit l'épreuve : il sourit, ou il grimace
      if (this.conteur && r.vivant) this.conteur.setTexture(textureBusteHD(this, v, reussie ? 'content' : 'fache'));
      // (v0.60) le carnet d'un disparu : l'écriture tremble de plus en plus
      if (!r.vivant) this.trembler(pvDepartRecit(this.parti) - pvApres);
      // (v0.60) les indices sur le Conseil : rangés dans le carnet des choses étranges
      if (reussie && niveau === 'complet') noterEtrangete(this.G, epreuve.complet, v);
      if (!reussie) await this.blesser(saignement === 'perte' ? pvApres + 1 : pvApres);
      else await this.victoire(niveau === 'complet');
      // Le saignement après un combat raté
      if (saignement) {
        await this.attendreClic();
        await this.saigner(saignement === 'bande');
        this.ecrire(this.titreEtape, saignement === 'bande'
          ? "« La plaie saignait beaucoup... Heureusement, j'avais un bandage en plus : j'ai serré fort, et le sang s'est arrêté. »"
          : "« La plaie saignait sans s'arrêter... Pas un seul bandage en plus dans mon sac. J'ai perdu des forces. »");
        if (saignement === 'perte') await this.blesser(pvApres);
      }
      await this.attendreClic();
    }

    if (typeof decouverteDuLieu === 'function') await decouverteDuLieu(this, 'arrivee');   // (planche 91 : l'île de la rotonde, l'Arbre-Mère)
    await this.conclure();
  }

  // L'écriture du carnet qui tremble (plus le voyageur a perdu de cœurs, plus elle tremble)
  trembler(perdus) {
    this.tweens.killTweensOf(this.texte);
    this.texte.setX(176).setAngle(0);
    if (perdus <= 0) return;
    // (v0.91) un tremblement doux et lent : on le sent, mais on lit sans effort (avant : trop vif, illisible)
    this.tweens.add({ targets: this.texte, x: 176 + Math.min(1, perdus * 0.4), angle: Math.min(0.35, perdus * 0.1), duration: Math.max(500, 900 - perdus * 100), yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  // Le trèfle de la chance qui brille au-dessus de lui.
  async trefle() {
    Son.jouer('trefle');
    const t = this.add.image(this.perso.x, this.perso.y - 120, 'hd_trefleChance').setScale(0).setDepth(5);
    await this.animer({ targets: t, scale: 3.5, angle: 360, duration: 500, ease: 'Back.easeOut' });
    this.tweens.add({ targets: t, alpha: 0, y: t.y - 40, duration: 900, delay: 400, onComplete: () => t.destroy() });
  }

  async montrerObjet(id) {
    creerObjetsHD(this);
    if (id === 'epee' && this.armeTenue) id = this.armeTenue;   // (v0.63 : son arme à lui)
    if (['epee', 'dague', 'epeecourte', 'rapiere', 'khopesh'].includes(id)) Son.jouer('degainer');   // (v1.64 : la lame sort du fourreau, avant le « TCHAK ! »)
    const cle = iconeObjet(this, id);
    const icone = this.add.image(this.perso.x, this.perso.y - 88, cle).setScale(0).setDepth(5);
    await this.animer({ targets: icone, scale: cle.startsWith('hd_') ? 3 : 5, y: icone.y - 30, duration: 350, ease: 'Back.easeOut' });
    this.tweens.add({ targets: icone, alpha: 0, y: icone.y - 30, duration: 900, delay: 500, onComplete: () => icone.destroy() });
  }

  // (v1.22, planche 49 v2) Le secours d'un message de détresse : l'aigle du Conseil qui lâche le paquet,
  // le corbeau de la Main Noire, le mercenaire qui arrive à pied... ou l'attente, seul.
  async secoursDetresse(d) {
    const v = this.parti.voyageur, x = this.perso.x, y = this.perso.y, e = this.e;
    creerObjetsHD(this); creerOiseauxMessagers(this);
    const id = d.objet || d.id, n = Math.min(3, d.qte);
    const nom = d.arme ? (d.qte > 1 ? 'des armes' : 'une arme') : `${d.qte > 1 ? d.qte + ' ' : 'un' + (ITEMS[id] && /e$/.test(ITEMS[id].nom) && !/^(Bouclier|Antidote)/.test(ITEMS[id].nom) ? 'e ' : ' ')}${nomObjet(id).toLowerCase()}${d.qte > 1 && !/[sx]$/.test(nomObjet(id)) ? 's' : ''}`;
    const lacher = async (sx, sy) => {   // le paquet tombe à ses pieds
      for (let k = 0; k < n; k++) {
        const o = this.add.image(sx + k * 8, sy, iconeObjet(this, id)).setScale(3).setDepth(6);
        this.tweens.add({ targets: o, x: x + 34 + k * 20, y: y - 8, angle: 160 + k * 40, duration: 900, delay: k * 160, ease: 'Quad.easeIn',
          onComplete: () => this.tweens.add({ targets: o, alpha: 0, delay: 1400, duration: 500, onComplete: () => o.destroy() }) });
      }
      await this.attendre(900 + n * 160);
    };
    if (d.choix === 'rien' || (d.choix === 'mercenaire' && !d.arrive)) {
      this.ecrire(this.titreEtape, d.choix === 'rien'
        ? "« J'avais envoyé un pigeon au comptoir... Personne ne viendra. Bon. Il faudra faire sans. »"
        : "« Le comptoir m'envoyait un mercenaire, paraît-il. Je l'ai attendu longtemps... Il n'est jamais arrivé. »");
      if (this.conteur) this.conteur.setTexture(textureBusteHD(this, v, 'inquiet'));
      for (let k = 0; k < 3 && d.choix === 'rien'; k++) {
        const pg = this.add.sprite(x + 60 + k * 46, y - 150 - k * 26, 'pigeonVolH').setScale(2.4).setFlipX(true).setDepth(7).play('volPigeon');
        this.tweens.add({ targets: pg, x: pg.x + 520, y: pg.y - 220, duration: 2400, delay: k * 220, ease: 'Sine.easeIn', onComplete: () => pg.destroy() });
      }
      await this.attendreClic();
      return;
    }
    if (d.choix === 'aigle' || d.choix === 'corbeau') {
      const aigle = d.choix === 'aigle';
      const oiseau = this.add.sprite(x - 460, y - 280, aigle ? 'aigleVolM' : 'corbeauVolH').setScale(aigle ? 3.2 : 3).setDepth(7)
        .setFlipX(!aigle).play(aigle ? 'volAigle' : 'volCorbeau');
      Son.jouer(aigle ? 'glisse' : 'corbeau');
      await this.animer({ targets: oiseau, x: x + 10, y: y - 210, duration: 1500, ease: 'Sine.easeOut' });
      await lacher(oiseau.x + 6, oiseau.y + (aigle ? 40 : 20));
      this.tweens.add({ targets: oiseau, x: x + 620, y: y - 420, duration: 1800, ease: 'Sine.easeIn', onComplete: () => oiseau.destroy() });
      this.ecrire(this.titreEtape, aigle
        ? `« Un aigle ?! Par la barbe de mes ancêtres... Il m'apporte ${nom} ! Le comptoir ne m'a pas oublié${e}. »`
        : `« Un corbeau noir s'est posé près de moi, a lâché ${nom} à mes pieds, et s'est envolé sans un cri. Je n'ose pas demander qui l'envoie. »`);
    } else {
      // le mercenaire arrive à pied, pose le paquet, et repart
      const m = this.add.image(x - 420, y, corpsHD(this, { race: 'humain', nom: 'Mercenaire', niveau: 'veteran' }, null, 'troisQuarts', 'epee')).setOrigin(0.5, 1).setScale(this.perso.scaleX).setDepth(Math.max(4, this.perso.depth));
      pasDeMarche(this, m, 1600);
      await this.animer({ targets: m, x: x - 70, duration: 1600, ease: 'Sine.easeOut' });
      await lacher(m.x + 10, y - 60);
      this.ecrire(this.titreEtape, `« Un mercenaire, envoyé par le comptoir ! Il m'a tendu ${nom} sans un mot, puis il est reparti. »`);
      if (this.conteur) this.conteur.setTexture(textureBusteHD(this, v, 'content'));
      await this.attendreClic();
      // (il reste là le temps qu'on lise, puis repart d'où il vient)
      m.setFlipX(true); pasDeMarche(this, m, 1800);
      this.tweens.add({ targets: m, x: x - 520, duration: 1800, onComplete: () => m.destroy() });
      return;
    }
    if (this.conteur) this.conteur.setTexture(textureBusteHD(this, v, 'content'));
    await this.attendreClic();
  }

  // Une épreuve surmontée : un bond de joie (et quelques étincelles si c'était bien préparé).
  async victoire(eclatante) {
    const y = this.perso.y;
    // (v0.60) chaque peuple a son cri de victoire
    const cris = { nain: 'Hrm !', elfe: '♪ La la...', hobbit: 'Youpi !', orc: 'GRAAH !', troll: 'HOUGA !', gobelin: 'Hé hé hé !', vampire: 'Ha ha ha...', momie: 'Mmmh !', loupgarou: 'AOUH !', panda: 'Ho ho !', magicienne: 'Et voilà !' };
    if (eclatante && Math.random() < 0.6) this.onomatopee(this.perso.x, y - 170, cris[this.parti.voyageur.race] || 'Hop !', '#f3d98a');
    if (eclatante) {
      creerObjetsHD(this);
      for (let k = 0; k < 7; k++) {
        const e = this.add.image(this.perso.x, y - 60, 'eclat').setScale(2).setDepth(6);
        const a = (k / 7) * Math.PI * 2;
        this.tweens.add({ targets: e, x: e.x + Math.cos(a) * 60, y: e.y + Math.sin(a) * 40, alpha: 0, angle: 90, duration: 600, onComplete: () => e.destroy() });
      }
    }
    await this.animer({ targets: this.perso, y: y - 26, duration: 180, ease: 'Quad.easeOut', yoyo: true });
    this.perso.setY(y);
  }

  // Des gouttes de sang qui tombent... et, s'il a un bandage en plus, le pansement.
  async saigner(bande) {
    for (let k = 0; k < 6; k++) {
      const g = this.add.circle(this.perso.x + Phaser.Math.Between(-12, 12), this.perso.y - 70, 3, 0xb01818).setDepth(6);
      this.tweens.add({ targets: g, y: this.perso.y - 4, alpha: 0.4, duration: 500, delay: k * 90, ease: 'Quad.easeIn', onComplete: () => g.destroy() });
    }
    await this.attendre(500);
    if (bande) { await this.montrerObjet('bandage'); await this.utiliserObjet('bandage'); }
  }

  async blesser(pvRestants) {
    this.cameras.main.shake(250, 0.01);
    this.cameras.main.flash(180, 160, 20, 20);
    Son.jouer('echec');
    // Il recule sous le choc
    const x = this.perso.x;
    this.tweens.add({ targets: this.perso, x: x - 14, duration: 90, yoyo: true, ease: 'Quad.easeOut' });
    this.perso.setTint(0xff4040);
    this.time.delayedCall(300, () => this.perso.clearTint());
    const coeur = this.coeurs[pvRestants];
    if (coeur) {
      coeur.setTexture('hd_coeurVide');
      await this.animer({ targets: coeur, scale: 3, duration: 150, yoyo: true });
    }
  }

  // (v1.64) La mort d'un voyageur : la musique se tait, et selon l'endroit où il est tombé, le chœur des disparus,
  // les cordes qui pleurent ou le grand glas (voir mortDuLieu) ; puis la musique triste revient doucement.
  sonDeLaMort() {
    if (typeof mortDuLieu !== 'function') return Son.jouer('glas');
    const nom = mortDuLieu(this.parti.voyageur.zone);
    this.musiqueVoulue = 'recitTriste';
    Son.jouerSeul(nom, {}, 'recitTriste', DUREE_MORT[nom] || 7);
  }

  async conclure() {
    // La fin du récit se lit à vitesse normale.
    this.finRecit = true;   // (v1.64 : les bruits de fond de la contrée se taisent)
    this.rapide = false;
    this.cadrer(480, 185, 1, 800);
    this.musique(this.parti.resultat.vivant && !this.parti.resultat.echec ? this.musiqueContree('victoire', 'recitHeureux') : 'recitTriste');
    this.tweens.timeScale = 1;
    this.time.timeScale = 1;
    const v = this.parti.voyageur;
    const r = this.parti.resultat;
    if (this.meteo) { this.meteo.remove(); this.meteo = null; }
    this.nettoyerScenario();
    this.tweens.killTweensOf(this.decor.list);   // (audit v0.61 : les tweens en boucle des décors)
    this.decor.removeAll(true);
    this.tweens.add({ targets: this.voile, fillAlpha: 0, duration: 600 });

    const { gain, message } = terminerAventure(this.G, this.parti);
    // (v1.62) le butin n'arrive dans la besace qu'avec ses pièces, quand il les lui tend (voir pleuvoirPieces)
    this.piecesEnVol = r.vivant && !r.echec && gain > 0;
    // (v1.61) la barre de cœurs montre ce qui reste, même avec la fiche ou « Passer » (avant, elle restait pleine
    // alors que le texte annonçait des cœurs perdus)
    const reste = r.vivant && r.etapes.length ? r.etapes[r.etapes.length - 1].pvApres : r.vivant ? this.coeurs.length : 0;
    this.coeurs.forEach((c, i) => c.setTexture(i < reste ? (c.bonus ? 'hd_coeurOr' : 'hd_coeur') : 'hd_coeurVide'));
    const relation = niveauRelation(this.G, v.nom);
    this.G.recitsVus = (this.G.recitsVus || 0) + 1;
    // (v0.84) la fiche de mission (si on l'a choisie) et la carte de progression façon RPG
    this.carte = this.fiche = null;
    if (this.modeFiche) this.ficheMission(20, 52);

    if (r.vivant && r.echec) {
      // Mission ratée : vivant, mais les mains vides.
      await this.allerAuComptoir();
      this.ecrire('Mission ratée', [`« Je suis désolé${this.e}... Je reviens les mains vides. » · Relation : ${relation.nom}`,
        ...(this.parti.malus || []).map(m => '• ' + m)].join('\n'));
      await this.carteApresFiche();
    } else if (r.vivant) {
      await this.allerAuComptoir();
      // (v0.60) la fin de la quête, en une image : ce qu'on n'avait jamais vu
      const finQuete = FINS_QUETES[v.queteId];
      if (finQuete && !v.quetePerso) {
        this.ecrire(v.quete, `« ${accord(finQuete, v)} »`);
        if (this.conteur) this.conteur.setTexture(textureBusteHD(this, v, 'content'));
        await this.attendreClic();
      }
      this.pleuvoirPieces(gain);
      const ajuste = (gain !== v.butin ? ` (prévu : ${v.butin}, ajusté selon ta relation et tes décorations)` : '') + (this.parti.dime ? ` · ${this.parti.dimeNom} : −${this.parti.dime}` : '');   // (v1.32)
      this.ecrire('Retour au comptoir',
        `« ${this.remerciement()} Voici ta part du butin ! »\n` +
        `+ ${gain} pièces${ajuste} · Relation : ${relation.nom}${message ? '\n' + message : ''}`);
      await this.carteApresFiche();
    } else {
      // (v1.62) elle s'écroule à droite de l'écran, pour laisser la rangée des boutons libre à sa gauche : si elle est
      // plus à gauche, elle fait les derniers pas (avec ses images de pas) avant de tomber
      if (this.perso.x < 690 && this.perso.active) {
        const dx = 690 - this.perso.x, dur = Math.max(300, dx * 5), y = this.perso.y;
        this.perso.setFlipX(false);
        pasDeMarche(this, this.perso, dur, { sol: this.solRecit() });
        await this.animer({ targets: this.perso, x: 690, duration: dur, ease: 'Linear' });
        this.perso.setScale(6 * this.fCorps).setY(y);
      }
      this.perso.setTint(0x888888);
      this.sonDeLaMort();
      await this.mourir(!!r.valeureux);   // (planche 86 : il s'effondre, puis il gît ; sur le dos au combat, face contre terre sinon)
      this.ecrire('Fin du carnet', r.valeureux
        ? `${v.nom} est mort${this.e} valeureusement au combat. On chantera son nom dans les tavernes.\nTon investissement est perdu, et ta réputation baisse (−${String(PERTE_MORT.valeureux).replace(".", ",")}).`
        : `${v.nom} est mort${this.e} loin de chez ${v.feminin ? 'elle' : 'lui'}, sans gloire. Il fallait sans doute mieux ${v.feminin ? 'la' : 'le'} préparer...\nTon investissement est perdu, et ta réputation baisse (−${String(PERTE_MORT.sansGloire).replace(".", ",")}).`);
      // (v0.60) la dernière ligne du carnet, interrompue
      const proche = auHasard(['ma sœur', 'mon frère', 'ma mère', 'mon père', 'mes enfants', 'ma bien-aimée']);
      this.ajouterTexte(`\nLa dernière ligne du carnet, à peine lisible : « Dis à ${proche} que je... »`);
      this.trembler(3);
      if (this.parti.demasque) {
        const id = Object.keys(this.parti.pieges).find(k => this.parti.pieges[k] > 0);
        this.ajouterTexte(`\nOn a retrouvé ${PIEGES[id] ? leNom(id, PIEGES[id].nom.toLowerCase()) : 'ton piège'} près du corps. Au village, on t'accuse.`);
      }
      // (v0.95) le Passeur des Bannis rapporte ce qui pouvait l'être
      if (this.parti.passeur) this.ajouterTexte(`\nLe Passeur des Bannis dépose son baluchon sur ton comptoir : ${this.parti.passeur} ${this.parti.passeurPluriel === false ? 'revient' : 'reviennent'} dans ta réserve.`);
      this.tweens.add({ targets: this.voile, fillAlpha: 0.5, duration: 1500 });
      this.indice.destroy();
      return this.proposerDedommagement();
    }

    // (v0.84) la carte de progression est un moment à part : on la lit, un clic, puis viennent les soins
    // et les trouvailles (qui prennent sa place)
    if (this.carte || this.fiche) {
      await this.attendreClic();
      for (const c of [this.carte, this.fiche]) if (c) this.tweens.add({ targets: c, alpha: 0, duration: 250, onComplete: () => c.destroy() });
      this.carte = this.fiche = null;
    }
    this.indice.destroy();
    // (v1.62) les boutons se rangent là où ils ne cachent ni la voyageuse ni la besace
    const soins = r.vivant && blessuresDe(this.G, v.nom) > 0;
    const places = this.rangerBoutons(soins ? [200, 214, 180] : [188], { trouvailles: r.vivant ? (this.parti.trouvailles || []).length : 0 });
    const [xr, yr] = places[places.length - 1];
    const retour = creerBouton(this, xr, yr, 180, 'Retour au comptoir', () => allerParVolets(this, 'Comptoir'));
    this.dansUI(retour);
    if (r.vivant) {
      this.proposerSoins(places);
      this.proposerTrouvailles();
    }
  }

  // (v1.62) Avec la fiche : on lit la fin, un clic, puis la carte de progression prend la place de la fiche (à
  // gauche), pour ne pas cacher la voyageuse arrivée au bout du chemin. Sans la fiche, la carte est au milieu.
  async carteApresFiche() {
    if (this.modeFiche && this.fiche && this.parti.progression) {
      await this.attendreClic();
      const f = this.fiche; this.fiche = null;
      this.tweens.add({ targets: f, alpha: 0, duration: 250, onComplete: () => f.destroy() });
      this.carteProgression(20, 52);
    } else this.carteProgression(this.modeFiche ? 494 : 257, 52);
  }

  // (v1.62) Où ranger des boutons (largeurs données) sur la rangée du bas de la bulle (y = 345) sans cacher la
  // voyageuse (debout ou couchée), la besace posée sur le bord, la fiche ni le panneau des trouvailles ; ce qui
  // n'y tient pas passe sur une rangée au-dessus (y = 300). Renvoie les centres [x, y].
  rangerBoutons(largeurs, { trouvailles = 0 } = {}) {
    const c = this.cadreVise || { sx: this.cameras.main.scrollX, sy: this.cameras.main.scrollY, k: 1 };
    const zones = [[BESACE_RECIT.x - 100, BESACE_RECIT.y - 70, BESACE_RECIT.x + 50, BESACE_RECIT.y + 6]];
    const p = this.perso;
    if (p && p.active && p.visible) {
      // (debout, on ne garde que sa silhouette, pas le vide de son image ; couché, toute l'image)
      const b = p.getBounds(), debout = Math.abs(p.angle) < 20, demi = debout ? p.displayWidth * 0.28 : (b.right - b.x) / 2, cx = debout ? p.x : (b.x + b.right) / 2;
      zones.push([(cx - demi - c.sx) * c.k - 10, (b.y - c.sy) * c.k, (cx + demi - c.sx) * c.k + 10, (b.bottom - c.sy) * c.k]);
    }
    if (this.fiche && this.fiche.active) { const b = this.fiche.getBounds(); zones.push([b.x, b.y, b.right, b.bottom]); }
    if (trouvailles) zones.push([20, 70, 560, 70 + 90 + trouvailles * 54]);
    // une rangée : les boutons à la suite, de gauche à droite, en sautant ce qu'il ne faut pas cacher
    const rangee = (y, depuis) => {
      const res = []; let x = 18, i = depuis;
      while (i < largeurs.length) {
        const l = largeurs[i];
        const gene = zones.find(([x0, y0, x1, y1]) => x < x1 + 6 && x + l > x0 - 6 && y - 16 < y1 && y + 16 > y0);
        if (x + l > 942) break;
        if (!gene) { res.push([x + l / 2, y]); x += l + 10; i++; continue; }
        x = gene[2] + 6;
        if (x + l > 942) break;
      }
      return res;
    };
    // tous sur la rangée du bas si possible, sinon tous sur celle du haut, sinon le début en haut et la suite en bas
    for (const y of [RANGEE_RECIT, 300]) { const r = rangee(y, 0); if (r.length === largeurs.length) return r; }
    const haut = rangee(300, 0), bas = rangee(RANGEE_RECIT, haut.length), places = [...haut, ...bas];
    while (places.length < largeurs.length) places.push([942 - largeurs[places.length] / 2, 300]);
    return places;
  }

  // (v1.61) avec la fiche, on ne regarde pas le voyageur marcher jusqu'au comptoir : il y est déjà
  async allerAuComptoir() {
    const d = BASE_MAX_RECIT - this.base;
    if (!this.modeFiche) return this.marcherVers(FIN_RECIT, d);
    // (avec la fiche, il y est déjà : on cadre directement le bout du chemin)
    this.recaler(d);
    this.perso.setX(FIN_RECIT);
    for (const c of this.compagnons || []) c.setX(FIN_RECIT - c.ecart);
    this.cadrer(1000, 250, 1.12, 0);
  }

  // --- (v0.84) Le choix du récit, la fiche de mission, la carte de progression ---

  choisirRecitOuFiche() {
    return new Promise(fini => {
      const a = creerBouton(this, 600, 345, 230, '▶ Voir le récit', () => choisir(false));
      const b = creerBouton(this, 840, 345, 230, '📜 Lire la fiche', () => choisir(true));
      this.dansUI(a); this.dansUI(b);
      const choisir = fiche => { for (const x of [a, b]) { x.fond.destroy(); x.label.destroy(); } fini(fiche); };
    });
  }

  // La fiche de mission : chaque épreuve en une ligne, ce qui a servi, ce qui a coûté
  ficheMission(x0, y0) {
    const v = this.parti.voyageur, r = this.parti.resultat, z = ZONES[v.zone];
    const c = this.fiche = this.add.container(0, 0);
    this.ui.add(c);
    const h = 70 + r.etapes.length * 34 + 30;
    c.add(this.add.image(x0 + 225, y0 + h / 2, panneauHD(this, 450, h)).setScale(2));
    c.add(this.add.text(x0 + 24, y0 + 18, 'Fiche de mission', style(18, '#3b2410', { fontStyle: 'bold' })));
    c.add(this.add.text(x0 + 24, y0 + 42, `${z ? z.nom + ' ' + '★'.repeat(z.danger) : ''} · ${v.quete || ''}`, style(12, '#6b4a2a', { fontStyle: 'italic', wordWrap: { width: 400 } })));
    const NOMS = { riviere: 'La rivière', nuit: 'La nuit', soif: 'La soif', faim: 'La faim', froid: 'Le froid', loup: 'Le loup', bandits: 'Les bandits', araignee: "L'araignée", sanglier: 'Le sanglier', pillards: 'Les pillards', yeti: 'Le yéti', mortvivant: 'Le mort-vivant', monstre: 'Le monstre', marais: 'Le marais', poison: 'Le poison', falaise: 'La falaise', tempete: 'La tempête', piege: 'Le piège', perdu: 'Perdu' };
    r.etapes.forEach((e, i) => {
      const y = y0 + 80 + i * 34, ep = e.epreuve;
      if (ep.besoin && ITEMS[ep.besoin]) c.add(this.add.image(x0 + 38, y, iconeObjet(this, ep.besoin)).setScale(1.6));
      c.add(this.add.text(x0 + 60, y - 8, `${i + 1}. ${NOMS[ep.type] || (ep.type || '').replace(/^./, m => m.toUpperCase())}`, style(13, '#3b2410', { fontStyle: 'bold' })).setOrigin(0, 0.5));
      const prepa = e.niveau === 'complet' ? `bien équipé${this.e}` : e.niveau === 'partiel' ? `à moitié équipé${this.e}` : `sans ${ITEMS[ep.besoin] ? ITEMS[ep.besoin].nom.toLowerCase() : 'rien'}`;
      // (v1.22) le secours d'un message de détresse, sur l'épreuve où il est arrivé
      const sos = this.parti.detresse && this.parti.detresse.choix && this.parti.detresse.i === i ? this.parti.detresse : null;
      const secours = !sos ? '' : sos.choix === 'rien' ? ' · personne n\'est venu' : sos.choix === 'mercenaire' && !sos.arrive ? ' · le mercenaire n\'est pas arrivé'
        : ` · ${{ aigle: "l'aigle", mercenaire: 'le mercenaire', corbeau: 'le corbeau' }[sos.choix]} est venu`;
      const detail = this.add.text(x0 + 60, y + 8, prepa + (e.piege ? ' · objet piégé !' : '') + secours, style(11, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0, 0.5);
      c.add(detail);
      const perdu = Math.max(0, (e.pvAvant ?? e.pvApres) - e.pvApres);
      const resultat = this.add.text(x0 + 426, y, e.reussie ? '✓ réussie' : `✗ ratée${perdu ? ` · −${perdu} ♥` : ''}`, style(13, e.reussie ? '#2f6a2a' : '#a03030', { fontStyle: 'bold' })).setOrigin(1, 0.5);
      c.add(resultat);
      // (v1.31) la ligne du détail (secours, piège) s'arrête avant le résultat
      for (let f = 12; detail.width > 426 - 60 - resultat.width - 10 && f >= 9; f--) detail.setFontSize(f);
    });
    const fin = r.vivant ? (r.echec ? `Revenu${this.e} vivant${this.e}, mais la mission a échoué.` : `Revenu${this.e} au comptoir : mission accomplie !`) : `N'est jamais revenu${this.e}...`;
    c.add(this.add.text(x0 + 24, y0 + h - 26, fin, style(13, r.vivant && !r.echec ? '#2f6a2a' : '#a03030', { fontStyle: 'bold italic' })));
    c.setAlpha(0); this.tweens.add({ targets: c, alpha: 1, duration: 300 });
  }

  // La carte de progression, façon RPG : les missions réussies qui remplissent la barre de son rang,
  // le rang qui monte, la relation, ce qu'il te reverse
  carteProgression(x0, y0) {
    const v = this.parti.voyageur, pr = this.parti.progression, r = this.parti.resultat;
    if (!pr) return;
    const c = this.carte = this.add.container(0, 0);
    this.ui.add(c);
    const L = 446, H = 236;
    c.add(this.add.image(x0 + L / 2, y0 + H / 2, panneauHD(this, L, H)).setScale(2));
    const monte = pr.apres.niveau !== pr.avant.niveau;
    c.add(this.add.image(x0 + 70, y0 + H - 10, textureBusteHD(this, v, monte || !r.echec ? 'content' : 'inquiet')).setOrigin(0.5, 1).setScale(1.2));
    c.add(this.add.text(x0 + 140, y0 + 18, v.nom, style(17, '#3b2410', { fontStyle: 'bold' })));
    const rang = this.add.text(x0 + 140, y0 + 42, nomRang(pr.avant.niveau), style(13, '#8a6a10', { fontStyle: 'bold' }));
    c.add(rang);
    // la barre : du seuil de son rang au seuil du suivant
    const i0 = ORDRE_NIVEAUX.indexOf(pr.avant.niveau);
    const seuil = k => NIVEAUX_AVENTURIER[ORDRE_NIVEAUX[k]].succes;
    const bas = seuil(i0), haut = i0 + 1 < ORDRE_NIVEAUX.length ? seuil(i0 + 1) : bas + 1;
    const part = n => Phaser.Math.Clamp((n - bas) / Math.max(1, haut - bas), 0, 1);
    const bx = x0 + 140, by = y0 + 92, bl = 280, bh = 14;
    c.add(this.add.text(bx, by - 14, r.echec ? 'Missions réussies : pas de progrès cette fois' : `Missions réussies : ${pr.avant.succes} → ${pr.apres.succes}`, style(12, '#3b2410')).setOrigin(0, 0.5));
    const fond = this.add.rectangle(bx, by, bl, bh, 0x2a1a10).setOrigin(0, 0.5).setStrokeStyle(2, 0x6b4a2a);
    const deja = this.add.rectangle(bx + 2, by, (bl - 4) * part(pr.avant.succes), bh - 4, 0xc9a227).setOrigin(0, 0.5);
    const largeur = (bl - 4) * (part(Math.min(pr.apres.succes, haut)) - part(pr.avant.succes));
    const gagne = this.add.rectangle(bx + 2 + (bl - 4) * part(pr.avant.succes), by, Math.max(1, largeur), bh - 4, 0xffe070).setOrigin(0, 0.5).setScale(0, 1);
    c.add([fond, deja, gagne]);
    for (let k = 1; k < haut - bas; k++) c.add(this.add.rectangle(bx + (bl * k) / (haut - bas), by, 2, bh, 0x2a1a10));
    // (le prochain rang à viser : celui d'après le nouveau rang, s'il vient de monter)
    const i1 = ORDRE_NIVEAUX.indexOf(pr.apres.niveau);
    const suivant = i1 + 1 < ORDRE_NIVEAUX.length ? ORDRE_NIVEAUX[i1 + 1] : null;
    c.add(this.add.text(bx + bl, by + 16, suivant ? `prochain rang : ${NIVEAUX_AVENTURIER[suivant].nom} (${NIVEAUX_AVENTURIER[suivant].succes} missions réussies)` : 'rang maximum', style(10, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(1, 0.5));
    // relation, pièces, réputation
    const lignes = [];
    if (pr.apres.relation !== pr.avant.relation) lignes.push([`Relation : ${pr.avant.relation} → ${pr.apres.relation}`, couleurRelation(pr.apres.relation)]);
    else lignes.push([`Relation : ${pr.apres.relation}`, couleurRelation(pr.apres.relation)]);
    if (pr.gain) lignes.push([`+ ${pr.gain} pièces (sa part du butin)${pr.dime ? ` · ${pr.dimeNom} −${pr.dime}` : ''}`, '#8a6a10']);   // (v1.32 : le mécénat ou la neutralité, en direct)
    const dr = Math.round((pr.apres.reputation - pr.avant.reputation) * 10) / 10;
    if (dr) lignes.push([`Réputation ${dr > 0 ? '+' : ''}${String(dr).replace('.', ',')}`, dr > 0 ? '#2f6a2a' : '#a03030']);
    lignes.forEach(([t, col], k) => c.add(this.add.text(bx, by + 34 + k * 20, t, style(13, col, { fontStyle: 'bold' }))));
    c.setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, duration: 300 });
    // l'animation : la barre se remplit, puis le rang monte
    if (largeur > 0) this.tweens.add({ targets: gagne, scaleX: 1, duration: 900, delay: 500, ease: 'Sine.easeOut', onComplete: () => {
      if (!monte) return;
      Son.jouer('niveau');   // (v1.61) plus doux que la fanfare
      rang.setText(`${NIVEAUX_AVENTURIER[pr.avant.niveau].nom} → ${nomRang(pr.apres.niveau)}`).setColor('#b02a10');
      const bravo = this.add.text(x0 + 70, y0 + 34, 'RANG\nSUPÉRIEUR !', style(16, '#fff4dc', { fontStyle: 'bold', stroke: '#8a2a10', strokeThickness: 5, align: 'center' })).setOrigin(0.5).setScale(0.3).setAngle(-8);
      c.add(bravo);
      this.tweens.add({ targets: bravo, scale: 1, duration: 400, ease: 'Back.easeOut' });
      c.add(this.add.text(bx, y0 + H - 22, EXPLICATION_RANGS[pr.apres.niveau].replace(/^./, m => m.toUpperCase()), style(11, '#6b4a2a', { fontStyle: 'italic', wordWrap: { width: 290 } })));
    } });
  }

  // (v0.60) Les compagnons du texte (pèlerins, convoi nain, guérisseuses...) marchent derrière lui
  creerCompagnons(v) {
    this.compagnons = [];
    if (!this.parti.resultat.vivant) return;
    const C = {
      pelerins: [{ nom: 'Frère Anselme', race: 'humain', costume: 'mendiant', niveau: 'novice' }, { nom: 'Sœur Brune', race: 'humain', feminin: true, costume: 'mendiant', niveau: 'novice' }],
      convoi: [{ nom: 'Borin Pied-de-Roc', race: 'nain', niveau: 'aguerri' }, { nom: 'Dwalina Forge-Vive', race: 'nain', feminin: true, niveau: 'aguerri' }],
      caravane: [{ nom: 'Maître Orfric', race: 'humain', costume: 'colporteur', niveau: 'novice' }],
      simples: [{ nom: 'Elwen la Guérisseuse', race: 'elfe', feminin: true, niveau: 'novice' }, { nom: 'Lirael', race: 'elfe', feminin: true, niveau: 'novice' }],
      remedes: [{ nom: 'Grak le Chaman', race: 'orc', niveau: 'veteran' }],
      forteresse: [{ nom: 'Urzog', race: 'orc', niveau: 'aguerri' }],
      garnison: [{ nom: 'Sergent Hobbe', race: 'humain', costume: 'garde', niveau: 'aguerri' }],
      siege: [{ nom: 'Sergent Hobbe', race: 'humain', costume: 'garde', niveau: 'aguerri' }],
      cloche: [{ nom: 'Frère Tobie', race: 'humain', costume: 'mendiant', niveau: 'novice' }],
    }[v.queteId] || [];
    C.forEach((q, i) => {
      const c = imageCorps(this, -110 - i * 46, 360, q, 6).setDepth(2.95 - i * 0.01);
      c.ecart = 52 + i * 44;
      this.compagnons.push(c);
    });
    this.events.off('update', this.suivreCompagnons, this);
    if (this.compagnons.length) this.events.on('update', this.suivreCompagnons, this);
  }
  suivreCompagnons() {
    {
      for (const c of this.compagnons) {
        if (!c.active || !this.perso.active) continue;
        const cible = this.perso.x - c.ecart, dx = cible - c.x;
        const marche = Math.abs(dx) > 2;
        if (marche) { c.x += Math.sign(dx) * Math.min(Math.abs(dx), 3.2); c.setFlipX(dx < 0); if (!c.marche) pasDeMarche(this, c, 300); }
        else c.setFlipX(false);
        c.setVisible(!(this.menace && (this.menace.ravin || this.menace.dedans)));
      }
    }
  }

  // (v0.60) L'allure au retour, selon la contrée traversée
  etatAuRetour() {
    const e = this.e, b = this.biome;
    if (['marais', 'bourbier'].includes(b)) return `trempé${e} et sentant la vase`;
    if (b === 'neige') return `de la neige plein ${this.parti.voyageur.race === 'nain' ? 'la barbe' : 'les cheveux'}`;
    if (['desert', 'badlands'].includes(b)) return 'du sable plein les bottes';
    if (b === 'antre') return `noirci${e} de suie`;
    if (b === 'sanctuaire') return "une feuille d'or prise dans les cheveux";
    if (b === 'val') return 'une feuille rousse prise dans les cheveux';
    if (['foret', 'repaire'].includes(b)) return 'des aiguilles de pin dans le col';
    if (['cote', 'port'].includes(b)) return 'les cheveux raides de sel';
    if (['mines', 'opale'].includes(b)) return `couvert${e} de poussière de roche`;
    return `couvert${e} de poussière`;
  }

  // (v0.60) Le merci du retour : selon la qualité du baluchon, son peuple, et sa quête personnelle
  remerciement() {
    const v = this.parti.voyageur, r = this.parti.resultat;
    const etapes = r.etapes || [];
    const complets = etapes.filter(e => e.niveau === 'complet').length;
    const qualite = etapes.length ? complets / etapes.length : 1;
    const perso = v.quetePerso ? v.quetePerso.fin + ' ' : '';
    if (qualite < 0.5) return perso + auHasard(["On fera mieux la prochaine fois, hein ? Il manquait des choses dans ce baluchon.", "J'ai dû me débrouiller avec ce que j'avais... mais je suis là."]);
    const parPeuple = {
      nain: "Hrm. Ton matériel a tenu. Le mien, moins.",
      hobbit: "J'ai tout mangé, même la ficelle du baluchon !",
      elfe: "Ton baluchon était aussi bien rangé qu'un jardin elfique. Merci.",
      magicienne: "Tes provisions valaient bien un sortilège. Merci !",
      humain: "Sans ton baluchon, je ne serais pas là.",
      gobelin: "Bon matos. Pas volé. Enfin, pas par moi.",
      orc: "Ton baluchon, solide. Comme toi. Grrr... merci.",
      troll: "Marchand donne bonnes choses. Troll content.",
      vampire: "Tes provisions m'ont été... utiles. Je n'ai mordu personne. Presque.",
      momie: "Mes bandelettes et moi te remercions. Surtout les bandelettes.",
      loupgarou: "Même les nuits de pleine lune, ton baluchon a tenu le coup.",
      panda: "Il ne manquait que le bambou. Pour le reste : parfait.",
    };
    // (v0.60) la fin selon le camp de la contrée
    const camp = ZONES[v.zone] && ZONES[v.zone].camp;
    const fin = camp === 'bien' ? ' Au village, on a sonné les cloches pour moi.' : camp === 'mal' ? ` Personne ne m'a vu${this.e} revenir. C'est mieux ainsi.` : '';
    return perso + (parPeuple[v.race] || "Sans ton baluchon, je ne serais pas là.") + fin;
  }

  // Un bouton posé dans l'interface (hors de la caméra du monde, qui zoome et se déplace)
  dansUI(b) { this.ui.add([b.fond, b.label]); return b; }

  // L'aventurier te montre ce qu'il a rapporté : à toi de repérer la bonne affaire.
  proposerTrouvailles() {
    const G = this.G;
    const liste = this.parti.trouvailles || [];
    if (!liste.length) return;
    const c = this.add.container(0, 0);
    this.ui.add(c);
    const h = 90 + liste.length * 54;
    c.add(this.add.image(290, 70 + h / 2, panneauHD(this, 540, h)).setScale(2));
    c.add(this.add.text(40, 84, "« J'ai aussi ramené ça de mon voyage. Ça t'intéresse ? »", style(14, '#3b2410', { fontStyle: 'bold' })));
    const info = this.add.text(40, 70 + h - 24, '', style(12, '#a03030', { fontStyle: 'bold', wordWrap: { width: 500 } }));
    c.add(info);
    liste.forEach((t, i) => {
      const y = 130 + i * 54;
      const tr = t.tresor;
      c.add(this.add.image(60, y, iconeObjet(this, 'tr_' + tr.categorie)).setScale(2.4));
      c.add(this.add.text(90, y - 16, tr.nom, style(15, '#3b2410', { fontStyle: 'bold' })));
      c.add(...pastilleEtat(this, 90, y + 12, tr.etat, 11));
      // Ton flair estime la revente (une fois restauré) et juge le prix demandé.
      const e = estimationFlair(G, t);
      c.add(this.add.text(170, y + 2, `Flair ${Math.round(e.flair * 100)} % · revente ~${e.min}–${e.max} p. restauré`, style(11, '#5a3a20')));
      const verdict = this.add.text(170, y + 17, `Ton flair : ${e.verdict.texte}`, style(12, e.verdict.couleur, { fontStyle: 'bold' }));
      c.add(verdict);
      const b = creerBouton(this, 470, y, 140, '', () => {
        const erreur = acheterTrouvaille(G, t);
        if (erreur) { Son.jouer('refus'); return info.setText(erreur); }
        Son.jouer('achat');
        info.setColor('#2f6a2a').setText(`${tr.nom} rejoint ton atelier : à réparer !`);
        maj();
      });
      c.add([b.fond, b.label]);
      // (v0.86, lot A-4) marchander : 10 % de moins à chaque fois, jusqu'à son plancher (caché)
      const marchand = this.add.text(470, y + 29, '« marchander »', style(11, '#6a3a10', { fontStyle: 'bold italic' })).setOrigin(0.5).setInteractive({ useHandCursor: true });
      marchand.on('pointerover', () => marchand.setColor('#a05a10'));
      marchand.on('pointerout', () => marchand.setColor('#6a3a10'));
      marchand.on('pointerdown', () => {
        if (t.vendu || t.retire || !clicUnique(this)) return;
        const r = marchanderTrouvaille(G, this.parti.voyageur, t);
        Son.jouer(r.issue === 'cede' ? 'clic' : 'refus');
        info.setColor(r.issue === 'cede' ? '#2f6a2a' : '#a03030').setText(`« ${r.texte} »`);
        maj();
      });
      c.add(marchand);
      const maj = () => {
        const e2 = estimationFlair(G, t);   // (v0.86 : le verdict suit le prix marchandé)
        verdict.setText(`Ton flair : ${e2.verdict.texte}`).setColor(e2.verdict.couleur);
        b.setTexte(t.vendu ? 'Acheté' : t.retire ? 'Remballé' : `Acheter ${t.prix} p.`);
        b.setActif(!t.vendu && !t.retire);
        marchand.setVisible(!t.vendu && !t.retire);
      };
      maj();
    });
  }

  // L'aventurier est mort : sa famille doit être dédommagée. Trois montants au choix.
  proposerDedommagement() {
    const G = this.G;
    const v = this.parti.voyageur;
    const montants = montantsDedommagement(v);
    this.ajouterTexte(`\nTu dois verser un dédommagement à sa famille. Plus tu es ${eJ(this.G) ? 'généreuse' : 'généreux'}, plus ta réputation remonte... et plus un proche voudra reprendre le flambeau.`);
    // (v1.62) rangés sans cacher le corps ni la besace
    const places = this.rangerBoutons(Object.keys(DEDOMMAGEMENTS).map(() => 190));
    const boutons = Object.entries(DEDOMMAGEMENTS).map(([cle, d], i) => {
      const b = creerBouton(this, places[i][0], places[i][1], 190, `${d.nom} : ${montants[cle]} p.`, () => {
        const verse = dedommager(G, this.parti, cle);
        boutons.forEach(x => x.setVisible(false));
        const rep = d.reputation ? ` Réputation +${String(d.reputation).replace('.', ',')}.` : '';
        this.ecrire('Dédommagement', `Tu as versé ${verse} pièces à la famille ${dePersonne(v.nom)}.${rep}` +
          (G.argent < 0 ? `\nTu es à découvert (${G.argent} pièces). Faillite à ${SEUIL_FAILLITE} !` : ''));
        const retour = creerBouton(this, places[0][0], places[0][1], 180, 'Retour au comptoir', () => allerParVolets(this, 'Comptoir'));
        this.dansUI(retour);
      });
      this.dansUI(b);
      if (cle === 'maximum') marquerCamp(this, b, 'bien');   // (v0.90) dédommager généreusement : un geste de lumière
      return b;
    });
  }

  // L'aventurier est revenu blessé ? On peut le soigner avec une potion, et il paie.
  proposerSoins(places = [[255, 345], [530, 345]]) {
    const G = this.G;
    const v = this.parti.voyageur;
    if (!blessuresDe(G, v.nom)) return;
    // (v0.90) deux façons de soigner : contre paiement, ou sans rien demander (un geste de lumière)
    const soin = gratuit => {
      const erreur = soigner(G, v.nom, { gratuit });
      if (erreur) { Son.jouer('refus'); return this.ecrire('Soins', erreur); }
      Son.jouer('coeur');
      const coeur = this.coeurs.find(c => c.texture.key === 'hd_coeurVide' && !c.bonus) || this.coeurs.find(c => c.texture.key === 'hd_coeurVide');
      if (coeur) {
        coeur.setTexture('hd_coeur');
        this.tweens.add({ targets: coeur, scale: 3, duration: 150, yoyo: true });
      }
      this.perso.setTint(0x80ff80);
      this.time.delayedCall(300, () => this.perso.clearTint());
      if (G.soinParHospice) gainEnDirect(this, this.perso.x, this.perso.y - hauteurCorps(this.perso) - 20, 'Soin offert (hospice) : pas de potion', true);   // (v1.28)
      this.ecrire('Soins', (G.soinParHospice ? 'La sœur Aveline est venue de l’hospice avec ses bandes et ses onguents. ' : '') + (gratuit ? `« Tu... tu ne me fais rien payer ? Je ne l'oublierai pas. »` : `« Ah, ça fait du bien ! Tiens, ${PRIX_SOIN} pièces pour la potion. »`) +
        (blessuresDe(G, v.nom) ? `\nEncore ${blessuresDe(G, v.nom)} cœur(s) à soigner.` : `\nComplètement remis${this.e} sur pied !`));
      maj();
    };
    const bouton = this.dansUI(creerBouton(this, places[0][0], places[0][1], 200, '', () => soin(false)));
    const offert = this.dansUI(creerBouton(this, places[1][0], places[1][1], 214, '', () => soin(true)));
    const maj = () => {
      const reste = blessuresDe(G, v.nom);
      bouton.setVisible(reste > 0); offert.setVisible(reste > 0);
      bouton.setTexte(`Soigner un cœur (+${PRIX_SOIN} p.)`);
      offert.setTexte('Soigner sans faire payer');
      const hosp = typeof soinHospiceLibre === 'function' && soinHospiceLibre(G);   // (v1.28) le soin du jour de l'hospice
      bouton.setActif(G.stock.potion > 0 || hosp); offert.setActif(G.stock.potion > 0 || hosp);
      if (hosp) bouton.setTexte(`Soigner un cœur (+${PRIX_SOIN} p., hospice)`);
      if (reste > 0) marquerCamp(this, offert, 'bien');
    };
    maj();
    const n = blessuresDe(G, v.nom);
    this.ajouterTexte(`\n${v.feminin ? 'Elle' : 'Il'} a perdu ${n} cœur${n > 1 ? 's' : ''}. ` +
      (typeof soinHospiceLibre === 'function' && soinHospiceLibre(G) ? 'Aujourd\'hui, le premier soin vient de l\'hospice de la Confrérie : il ne coûte pas de potion. ' : '') +
      (G.stock.potion > 0 ? `Une potion par cœur (il te reste ${G.stock.potion} potion${G.stock.potion > 1 ? 's' : ''}).` : `Tu n'as pas de potion pour ${v.feminin ? 'la' : 'le'} soigner.`));
  }

  // (v1.62, planche 84) Sa part du butin : les pièces partent de sa main, tournent en volant et tombent une à une
  // dans le col de ta besace, en haut à droite ; le compte monte à l'arrivée de chaque pièce.
  pleuvoirPieces(gain = 0) {
    const b = this.bourse;
    if (!b || !b.active || gain <= 0) { this.piecesEnVol = false; if (b) b.maj(Math.floor(this.G.argent)); return; }
    const cam = this.cameras.main, k = cam.zoom / this.zoomBase, m = this.main();
    const ux = (m.x - cam.worldView.x) * k, uy = (m.y - cam.worldView.y) * k, col = b.col();
    // (v1.64) les pièces qui tombent dans la besace de cuir, et le cordon qu'on serre (quand les premières arrivent)
    this.time.delayedCall(520, () => Son.jouer('besace', { montant: gain }));
    voleePieces(this, ux, uy, col.x, col.y, Math.ceil(Math.sqrt(gain)), { conteneur: this.ui, echelle: 2, besace: b, montant: Math.floor(this.G.argent) - b.dernier, fin: () => {
      this.piecesEnVol = false;
      if (b.active) b.maj(Math.floor(this.G.argent));
    } });
  }

  // Le décor de chaque épreuve, dessiné avec des formes simples.
  // --- Le décor de chaque épreuve : créatures et obstacles en HD, météo, lumière ---

  // Le premier plan : des touffes d'herbe, des buissons ou des sapins sombres selon la contrée,
  // tout en bas de l'écran, qui défilent vite quand le voyageur avance
  planterPremierPlan(biome) {
    creerForetPremierPlanHD(this);
    const sol = 370;
    const sombre = ['foret', 'marais', 'repaire', 'tour', 'grotte'].includes(biome);
    const neige = ['montagne', 'glace', 'neige'].includes(biome);
    const teinte = neige ? 0xdce8f0 : sombre ? 0x1a3020 : 0x2f5a2a;
    const g = dansPlan(this.premierPlan, this.add.graphics());
    // les touffes d'herbe (ou de neige), en silhouette (v1.62 : sur tout le monde, qu'elles défilent à ×1,25)
    for (let x = -100; x < 2100; x += 26 + (x * 7) % 19) {
      const h = 10 + (x * 13) % 16;
      g.fillStyle(teinte, 0.95);
      g.fillTriangle(x, sol + 2, x + 6, sol - h, x + 12, sol + 2);
      g.fillTriangle(x + 8, sol + 2, x + 13, sol - h * 0.7, x + 18, sol + 2);
    }
    // (deux grands sapins sombres encadrent le récit : l'un au départ, l'autre au bout du chemin)
    if (sombre) for (const [x, e] of [[-40, 1.1], [1640, 1.3]]) dansPlan(this.premierPlan, this.add.image(x, sol + 30, 'sapinPremierPlanHD').setOrigin(0.5, 1).setScale(e).setTint(0x101c14).setAlpha(0.9));
  }

  // Le plan moyen : des arbres ou des rochers en silhouette, entre le paysage et le voyageur, qui
  // glissent un peu moins vite que lui (profondeur)
  planterPlanMoyen(biome) {
    const sombre = ['foret', 'marais', 'repaire', 'tour', 'grotte'].includes(biome);
    const neige = ['montagne', 'glace', 'neige'].includes(biome);
    const g = dansPlan(this.planMoyen, this.add.graphics());
    // (audit v0.54) la couleur suit le paysage (plus de bosquets verts dans les terres brûlées), et
    // les déserts, terres brûlées et montagnes ont des rochers plutôt que des arbres
    const b = BIOMES[biome] || BIOMES.comte;
    const rocheux = neige || ['desert', 'badlands', 'mines', 'antre', 'opale'].includes(biome);
    const teinte = neige ? 0xc8d4e0 : melangeCouleur(b.arbres || b.loin, 0x0a0a10, sombre ? 0.45 : 0.3);
    const va = this.variante;
    if (va && va.arbres) return;   // (ses arbres à elle sont plantés par planterVarianteRecit)
    // (v1.62) dans le pré, sur tout le monde du récit, les pieds juste derrière la barrière du chemin
    const sol = PRE_RECIT.loin;
    // (v1.63) les arbres : peints comme tous les arbres (arbresHD.js, voir arbrePremierPlanHD), l'essence de la contrée
    const forme = neige || biome === 'citadelle' ? 'sapinsNeige' : ['marais', 'bourbier'].includes(biome) ? 'morts' : biome === 'sanctuaire' ? 'ambrennes' : biome === 'val' ? 'automne' : ['foret', 'repaire', 'tour', 'grotte'].includes(biome) ? 'sapins' : biome === 'comte' ? 'ronds' : 'chenes';
    const arbre = (x, k) => { const cle = arbrePremierPlanHD(this, forme, biome, k % 3); if (cle) this.arbresRecit = (this.arbresRecit || []).concat(dansPlan(this.planMoyen, this.add.image(x, sol + 3, cle).setOrigin(0.5, 1).setScale(0.62 + ((Math.abs(x) * 7) % 30) / 100).setFlipX((Math.abs(x) * 3) % 2 === 0).setTint(sombre ? 0xb0b0b8 : 0xf0f0ea))); };
    let k = 0;
    for (let x = -60; x < LARGEUR_RECIT + 60; x += 70 + (x * 3) % 50, k++) {
      const h = 60 + (x * 7) % 70, r = 22 + (x * 5) % 18;
      g.fillStyle(teinte, 0.8);
      if (neige && k % 3 === 1) { arbre(x, k); continue; }   // (des sapins entre les rochers)
      if (!rocheux) { if (k % 4 !== 3) arbre(x, k); continue; }   // (des trouées, pour que les arbres ne fassent pas un mur)
      if (rocheux) { g.fillTriangle(x - r * 1.4, sol, x, sol - h * (neige ? 1 : 0.6), x + r * 1.4, sol); g.fillStyle(melangeCouleur(teinte, 0xffffff, 0.15), 0.8).fillTriangle(x - r * 0.5, sol, x, sol - h * (neige ? 1 : 0.6), x + r * 0.2, sol); }
    }
    this.planMoyen.sort('y');
  }

  // La météo de la contrée, en continu : pluie des marais, neige des montagnes, feuilles de la
  // forêt, brume... (en plus des effets propres à chaque épreuve)
  meteoBiome(biome) {
    if (this.ambiance) this.ambiance.remove();
    const marais = biome === 'marais', neige = ['montagne', 'glace', 'neige'].includes(biome), foret = ['foret', 'sanctuaire', 'val'].includes(biome), ombre = ['repaire', 'tour', 'bourbier'].includes(biome);
    if (!marais && !neige && !foret && !ombre) return;
    this.ambiance = this.time.addEvent({ delay: marais ? 40 : 160, loop: true, callback: () => {
      if (marais) {
        // des gouttes de pluie en biais
        const x = Phaser.Math.Between(-60, 1000);
        const r = this.add.rectangle(x, -10, 1.5, 16, 0xcfe4f0, 0.5).setAngle(-12).setDepth(6.8).setScrollFactor(0);
        this.tweens.add({ targets: r, y: 380, x: x - 80, duration: 650 + Math.random() * 200, ease: 'Linear', onComplete: () => r.destroy() });
        if (Math.random() < 0.08) { const b = this.add.ellipse(Phaser.Math.Between(0, 960), Phaser.Math.Between(200, 330), 180, 40, 0xb8c8c0, 0.08).setDepth(6.7).setScrollFactor(0); this.tweens.add({ targets: b, x: b.x + 120, alpha: 0, duration: 4000, onComplete: () => b.destroy() }); }
      } else if (neige) {
        const x = Phaser.Math.Between(-40, 1000);
        const f = this.add.circle(x, -8, 1.5 + Math.random() * 2, 0xffffff, 0.85).setDepth(6.8).setScrollFactor(0);
        this.tweens.add({ targets: f, y: 380, x: x + Phaser.Math.Between(-60, 20), duration: 3500 + Math.random() * 2500, ease: 'Linear', onComplete: () => f.destroy() });
      } else if (foret) {
        if (Math.random() < 0.5) return;
        const x = Phaser.Math.Between(0, 1000);
        const f = this.add.ellipse(x, -6, 6, 3, Phaser.Utils.Array.GetRandom(biome === 'sanctuaire' ? [0xe8b828, 0xd89a20, 0xf0d060] : biome === 'val' ? [0xc83a16, 0xe8702a, 0xd8a41c] : [0xc8a040, 0xa86a28, 0x7a9a30]), 0.9).setDepth(6.8).setScrollFactor(0);
        this.tweens.add({ targets: f, y: 375, x: x - 120, angle: 720, duration: 5000 + Math.random() * 2000, ease: 'Sine.easeIn', onComplete: () => f.destroy() });
      } else if (ombre) {
        if (Math.random() < 0.6) return;
        const b = this.add.ellipse(Phaser.Math.Between(-100, 1000), Phaser.Math.Between(240, 340), 220, 50, 0x3a2a48, 0.12).setDepth(6.7).setScrollFactor(0);
        this.tweens.add({ targets: b, x: b.x + 160, alpha: 0, duration: 5000, onComplete: () => b.destroy() });
      }
    } });
  }

  planterDecor(type, x, epreuve = null) {
    if (this.eauRecit) { this.eauRecit.destroy(); this.eauRecit = null; }
    creerRecitHD(this);
    creerInterieurHD(this);
    creerObjetsHD(this);
    const sol = 360;
    if (this.meteo) { this.meteo.remove(); this.meteo = null; }
    this.menace = { sorte: 'ambiance', sprites: [], type };
    const sombre = ['nuit', 'grotte', 'feufollet', 'esprits', 'malediction', 'mortvivant'].includes(type);
    // (v1.64) une bête, des brigands : la musique du danger de la contrée ; le noir, les maléfices : la peur ; sinon la marche
    const danger = typeof EPREUVES_DANGER !== 'undefined' && EPREUVES_DANGER.has(type);
    if (this.parti.resultat.vivant) this.musique(danger ? this.musiqueContree('danger', 'recitPeur') : sombre ? 'recitPeur' : this.musiqueContree('route', 'recitEtonne'));
    this.voile.setFillStyle(type === 'tempete' ? 0x8a6a3a : 0x05051a, this.voile.fillAlpha);
    this.tweens.add({ targets: this.voile, fillAlpha: sombre ? 0.55 : type === 'tempete' ? 0.3 : 0, duration: 600 });
    const ajouter = o => { this.decor.add(o); return o; };
    // Une créature qui arrive de la droite, en se dandinant, jusqu'à sa place
    const bete = (cle, bx, echelle, { flottante = false, depuisHaut = false } = {}) => {
      const b = ajouter(this.add.image(depuisHaut ? bx : 1040, depuisHaut ? -80 : sol, cle).setOrigin(0.5, 1).setScale(echelle).setDepth(2));
      if (depuisHaut) {
        const fil = ajouter(this.add.rectangle(bx, 0, 1, 10, 0xdddddd, 0.7).setOrigin(0.5, 0));
        this.tweens.add({ targets: b, y: sol - 40, duration: 1200, ease: 'Bounce.easeOut', onUpdate: () => fil.setSize(1, Math.max(0, b.y - b.displayHeight * 0.6)) });
      } else {
        this.tweens.add({ targets: b, x: bx, duration: 1100, ease: 'Sine.easeOut' });
        this.tweens.add({ targets: b, y: sol - (flottante ? 70 : 3), duration: flottante ? 900 : 140, yoyo: true, repeat: flottante ? -1 : 6, ease: 'Sine.easeInOut' });
      }
      if (flottante) b.setAlpha(0.8).setBlendMode(Phaser.BlendModes.SCREEN);
      else this.time.delayedCall(1200, () => { if (b.active) this.tweens.add({ targets: b, scaleY: echelle * 1.05, scaleX: echelle * 0.97, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }); });   // (elle respire)
      b.base = { x: bx, y: depuisHaut ? sol - 40 : sol };
      this.menace.sorte = 'bete';
      this.menace.sprites.push(b);
      return b;
    };
    // (retours sur la planche 86) Les personnages génériques des épreuves : le moteur des postures et des armes à l'échelle, comme
    // dans les scènes jouées : ils arrivent en marchant, l'arme portée sur eux, puis se mettent en garde et changent d'appui
    const humain = (bx, figurant, arme) => {
      const h = ajouter(this.brigand(1040, figurant, true, arme).setDepth(2));
      this.tweens.add({ targets: h, x: bx, duration: 1100, ease: 'Sine.easeOut' });
      pasDeMarche(this, h, 1100);
      this.time.delayedCall(1150, () => { if (!h.active) return; const P = posesActeur(arme); this.posture(h, 'garde'); this.agiter(h, ['garde', P.basse === P.garde ? 'garde' : 'basse', 'menace']); });
      h.base = { x: bx, y: sol };
      this.menace.sorte = 'bete';
      this.menace.sprites.push(h);
      return h;
    };
    // Des particules qui tombent ou volent (neige, sable, lucioles)
    const particules = (cle, teinte, { vx = 0, vy = 1, n = 2, echelle = 1.5, alpha = 0.8, add = false } = {}) => {
      this.meteo = this.time.addEvent({ delay: 90, loop: true, callback: () => {
        for (let k = 0; k < n; k++) {
          const px = Phaser.Math.Between(-100, 1000), py = vy > 0 ? Phaser.Math.Between(-20, 40) : Phaser.Math.Between(60, 360);
          const p = this.add.image(px, py, cle).setScale(echelle * (0.6 + Math.random() * 0.8)).setTint(teinte).setAlpha(alpha).setDepth(7);
          if (add) p.setBlendMode(Phaser.BlendModes.ADD);
          this.decor.add(p);
          this.tweens.add({ targets: p, x: px + vx * 400, y: py + vy * 380, alpha: 0, duration: 2200 + Math.random() * 1200, onComplete: () => p.destroy() });
        }
      } });
    };
    creerHalo(this);
    // (v0.59) les épreuves jouées comme de petites scènes (voir RecitEpreuves.js)
    if (this.scenarioEpreuve(type, x, epreuve)) return;

    switch (type) {
      case 'loup': bete('loupHD', x + 140, 2.3); break;
      case 'sanglier': bete('sanglierHD', x + 140, 2.3); break;
      case 'araignee': {
        for (let i = 0; i < 6; i++) ajouter(this.add.rectangle(x + 150, 0, 1, 260, 0xe8e8e8, 0.35).setOrigin(0.5, 0).setAngle(-50 + i * 20));
        bete('araigneeHD', x + 150, 3, { depuisHaut: true });
        break;
      }
      case 'yeti': bete('yetiHD', x + 160, 3); particules('lueurHD', 0xffffff, { vx: -0.3, vy: 1, n: 3, echelle: 1.2 }); break;
      case 'monstre':
        // (v0.57) l'Antre a sa propre Bête : un grand wyrm qui crache le feu
        if (this.parti.voyageur.quete === 'bete') {
          creerBeteAntreHD(this);
          const b = bete('beteAntreHD', x + 200, 3.4);
          particules('lueurHD', 0xff7a20, { vx: -0.6, vy: -0.4, n: 2, echelle: 1.4, add: true });
          this.time.delayedCall(1300, () => { if (b.active) { const f = ajouter(this.add.image(b.x - 150, sol - 140, 'halo').setScale(2.6, 1.4).setTint(0xff6a10).setAlpha(0.55).setBlendMode(Phaser.BlendModes.ADD).setDepth(3)); this.tweens.add({ targets: f, alpha: 0.2, scaleX: 3.2, duration: 400, yoyo: true, repeat: -1 }); } });
        } else bete('trollHD', x + 170, 3.1);
        break;
      case 'esprits': [0, 60, 120].forEach(dx => bete('espritHD', x + 110 + dx, 2, { flottante: true })); break;
      case 'mortvivant': [0, 70].forEach((dx, i) => humain(x + 130 + dx, 'squelette', ['epee', 'hache'][i])); break;
      case 'bandits': [['brigand', 'epee', 0], ['brigande', 'dague', 60]].forEach(([f, a, dx]) => humain(x + 120 + dx, f, a)); break;
      case 'pillards': [['pillard', 'hache', 0], ['pillarde', 'arc', 60], ['pillard', 'lance', 120]].forEach(([f, a, dx]) => humain(x + 110 + dx, f, a)); break;
      case 'feufollet':
        for (let i = 0; i < 6; i++) {
          const l = ajouter(this.add.image(x + 60 + i * 35, 220 + (i % 3) * 30, 'lueurHD').setScale(3).setBlendMode(Phaser.BlendModes.ADD));
          const halo = ajouter(this.add.image(l.x, l.y, 'halo').setScale(0.6).setTint(0x60ffc0).setAlpha(0.4).setBlendMode(Phaser.BlendModes.ADD));
          this.tweens.add({ targets: [l, halo], y: l.y - 30, x: l.x + Phaser.Math.Between(-30, 30), duration: 900 + i * 170, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        }
        break;
      case 'grotte': {
        ajouter(this.add.image(x + 150, sol + 4, 'grotteHD').setOrigin(0.5, 1).setScale(2.4).setDepth(1));
        break;
      }
      // (v0.58) Le ravin : deux falaises à gradins, la rivière qui gronde tout au fond (ou le
      // gouffre et sa brume), et un vieil arbre penché au-dessus du vide, sur l'autre rive.
      case 'gouffre': this.ravin(x, false); break;
      case 'riviere': this.ravin(x, true); break;
      case 'sangsues': {
        ajouter(this.add.ellipse(x + 110, sol, 260, 34, 0x2a3a22, 0.9).setDepth(1));
        for (let i = 0; i < 6; i++) {
          const s = ajouter(this.add.ellipse(x + 20 + i * 36, sol - 4, 16, 6, 0x111111).setDepth(1.1));
          this.tweens.add({ targets: s, scaleX: 0.6, duration: 400 + i * 70, yoyo: true, repeat: -1 });
        }
        break;
      }
      case 'champignons': ajouter(this.add.image(x + 90, sol + 2, 'champignonsHD').setOrigin(0.5, 1).setScale(3).setDepth(1)); particules('lueurHD', 0xd0ff60, { vx: 0.1, vy: -0.4, n: 1, echelle: 0.9, alpha: 0.6 }); break;
      case 'avalanche':
        for (let i = 0; i < 4; i++) {
          const r = ajouter(this.add.image(1000 + i * 60, sol - 200 - i * 40, 'rocherHD').setOrigin(0.5, 1).setScale(2 + i * 0.4).setDepth(2));
          this.tweens.add({ targets: r, x: x + 140 + i * 50, y: sol, angle: -540, duration: 1300 + i * 200, ease: 'Bounce.easeOut' });
        }
        particules('lueurHD', 0xffffff, { vx: -0.4, vy: 1, n: 3, echelle: 1.2 });
        break;
      case 'froid': particules('lueurHD', 0xffffff, { vx: -0.5, vy: 1, n: 4, echelle: 1.3 }); break;
      case 'tempete': particules('lueurHD', 0xe8c890, { vx: -2.4, vy: 0.15, n: 6, echelle: 1, alpha: 0.7 }); break;
      case 'soif': {
        const soleil = ajouter(this.add.image(820, 70, 'halo').setScale(2.4).setTint(0xfff0a0).setAlpha(0.6).setBlendMode(Phaser.BlendModes.ADD));
        this.tweens.add({ targets: soleil, scale: 2.8, duration: 900, yoyo: true, repeat: -1 });
        particules('lueurHD', 0xfff0c0, { vx: 0, vy: -0.4, n: 1, echelle: 1.6, alpha: 0.25 });
        break;
      }
      case 'nuit': {
        ajouter(this.add.circle(820, 70, 24, 0xf3ecc8).setDepth(0.5));
        const feu = ajouter(this.add.image(x - 40, sol + 2, 'feuCampHD').setOrigin(0.5, 1).setScale(2.5).setDepth(2));
        Son.jouer('feuDeCamp', { duree: 4 });   // (v1.64)
        const flamme = ajouter(this.add.sprite(feu.x, sol - 14, 'flammeBougie0').setOrigin(0.5, 1).setScale(5).setDepth(2.1).play('flammeBougie'));
        const lueur = ajouter(this.add.image(feu.x, sol - 30, 'halo').setScale(3).setTint(0xffa040).setAlpha(0.45).setBlendMode(Phaser.BlendModes.ADD).setDepth(8));
        this.tweens.add({ targets: lueur, alpha: 0.3, scale: 2.7, duration: 300, yoyo: true, repeat: -1 });
        // Des yeux jaunes qui brillent dans le noir...
        for (const [ex, ey] of [[x + 150, 290], [x + 230, 300], [x + 300, 280]]) {
          const yeux = ajouter(yeuxDansLeNoir(this, ex, ey, 0xffd040, { taille: 2, profondeur: 8 }).setAlpha(0));
          this.tweens.add({ targets: yeux, alpha: 1, duration: 300, delay: Phaser.Math.Between(300, 1500), yoyo: true, hold: 1200, repeat: -1, repeatDelay: 800 });
        }
        particules('lueurHD', 0xffa040, { vx: 0.1, vy: -0.6, n: 1, echelle: 0.7, add: true });
        void flamme;
        break;
      }
      case 'malediction':
        for (let i = 0; i < 5; i++) {
          const rond = ajouter(this.add.circle(this.perso.x, sol - 60, 20 + i * 18).setStrokeStyle(3, 0xa060e0, 0.8).setDepth(6));
          this.tweens.add({ targets: rond, scale: 0.3, alpha: 0, duration: 1200, delay: i * 150, repeat: -1 });
        }
        particules('lueurHD', 0xb070ff, { vx: 0, vy: -0.5, n: 2, echelle: 1, add: true });
        break;
      case 'morsure': {
        // (v0.68) un petit serpent dessiné (une ondulation verte, la tête, la langue), plus de symbole
        const g = this.add.graphics();
        g.lineStyle(7, 0x1a2a10, 1); g.beginPath(); for (let i = 0; i <= 16; i++) { const px = -22 + i * 2.6, py = -6 + Math.sin(i * 0.8) * 5; if (i) g.lineTo(px, py); else g.moveTo(px, py); } g.strokePath();
        g.lineStyle(4, 0x5a9a2a, 1); g.beginPath(); for (let i = 0; i <= 16; i++) { const px = -22 + i * 2.6, py = -6 + Math.sin(i * 0.8) * 5; if (i) g.lineTo(px, py); else g.moveTo(px, py); } g.strokePath();
        g.fillStyle(0x1a2a10).fillEllipse(22, -8, 12, 9); g.fillStyle(0x6aaa32).fillEllipse(22, -8, 9, 6);
        g.fillStyle(0xc02020).fillRect(27, -8, 6, 1);
        const serpent = ajouter(g.setPosition(this.perso.x + 40, sol - 2).setDepth(3));
        this.tweens.add({ targets: serpent, x: serpent.x + 16, duration: 300, yoyo: true, repeat: -1 });
        particules('lueurHD', 0x60c040, { vx: 0, vy: -0.4, n: 1, echelle: 1, alpha: 0.6 });
        break;
      }
      case 'blessure':
        ajouter(this.add.image(x + 80, sol + 4, 'rocherHD').setOrigin(0.5, 1).setScale(1.6).setDepth(1));
        break;
      default: { // la route : un panneau, des cailloux, des fleurs
        const g = ajouter(this.add.graphics().setDepth(1));
        g.fillStyle(0x6b4423).fillRect(x + 120, sol - 90, 8, 90);
        g.fillStyle(0x8a5a2b).fillRect(x + 90, sol - 90, 70, 20);
        g.fillStyle(0x6b4423).fillTriangle(x + 160, sol - 90, x + 172, sol - 80, x + 160, sol - 70);
        ajouter(this.add.image(x + 60, sol + 2, 'rocherHD').setOrigin(0.5, 1).setScale(1).setDepth(1));
      }
    }
  }

  // L'objet du colis entre en action, selon ce que c'est.
  async utiliserObjet(id) {
    const p = this.perso, sol = 360;
    const cible = this.menace.sprites[0];
    const cx = cible ? cible.x - 20 : p.x + 120, cy = sol - 70;
    const icone = cle => this.add.image(p.x + 30, sol - 80, iconeObjet(this, cle)).setScale(3).setDepth(6);
    const etincelles = (x, y, teinte, n = 10) => {
      for (let k = 0; k < n; k++) {
        const e = this.add.image(x, y, 'eclat').setScale(2).setTint(teinte).setDepth(7);
        const a = Math.random() * Math.PI * 2;
        this.tweens.add({ targets: e, x: x + Math.cos(a) * 70, y: y + Math.sin(a) * 50, alpha: 0, angle: 180, duration: 600, onComplete: () => e.destroy() });
      }
    };
    switch (id) {
      case 'epee': case 'bouclier': {
        const o = icone(id);
        await this.animer({ targets: p, x: p.x + 40, duration: 160, ease: 'Quad.easeOut' });
        o.setPosition(p.x + 40, sol - 70);
        if (id === 'epee') {
          const arc = this.add.graphics().setDepth(7);
          arc.lineStyle(6, 0xffffff, 0.9).beginPath().arc(p.x + 50, sol - 70, 60, -1.2, 0.9).strokePath();
          this.tweens.add({ targets: arc, alpha: 0, duration: 300, onComplete: () => arc.destroy() });
          this.tweens.add({ targets: o, angle: 200, duration: 220 });
          this.onomatopee(cx, cy - 40, 'TCHAK !', '#fff4dc');
        } else {
          this.onomatopee(p.x + 60, cy - 50, 'BLONG !', '#d8e4f0');
          this.tweens.add({ targets: o, scale: 4, duration: 120, yoyo: true });
        }
        this.cameras.main.shake(150, 0.006);
        etincelles(cx, cy, 0xfff0a0);
        this.lignesDeVitesse(cx, cy, 1);
        this.coupDeZoom(cx, cy, 1.4);
        Son.jouer('succes');
        await this.attendre(350);
        this.tweens.add({ targets: o, alpha: 0, duration: 300, onComplete: () => o.destroy() });
        await this.animer({ targets: p, x: p.x - 40, duration: 220 });
        break;
      }
      case 'fleches': {
        for (let k = 0; k < 3; k++) {
          const f = this.add.image(p.x + 20, sol - 80, iconeObjet(this, 'fleches')).setScale(2.5).setAngle(45).setDepth(6);
          this.tweens.add({ targets: f, x: cx, y: cy + Phaser.Math.Between(-20, 20), duration: 260, delay: k * 140, onComplete: () => { etincelles(f.x, f.y, 0xfff0a0, 4); f.destroy(); } });
        }
        this.onomatopee(p.x + 40, cy - 60, 'FIOUU !');
        await this.attendre(700);
        break;
      }
      case 'torche': {
        const o = icone('torche').setPosition(p.x + 26, sol - 90);
        const lumiere = this.add.image(p.x + 20, sol - 90, 'halo').setScale(0.5).setTint(0xffc060).setAlpha(0.7).setBlendMode(Phaser.BlendModes.ADD).setDepth(8);
        this.decor.add([o, lumiere]);
        Son.jouer('torche');   // (v1.64 : « FWOUF ! », la flamme qui prend)
        this.tweens.add({ targets: lumiere, scale: 4.5, duration: 600, ease: 'Sine.easeOut' });
        this.tweens.add({ targets: this.voile, fillAlpha: Math.min(this.voile.fillAlpha, 0.35), duration: 600 });
        this.tweens.add({ targets: lumiere, alpha: 0.5, duration: 200, yoyo: true, repeat: -1, delay: 600 });
        await this.attendre(700);
        break;
      }
      case 'corde': {
        if (this.menace.ravin) { await this.grimperFalaise(); await this.lancerGrappin(); break; }
        const x2 = (this.menace.x || p.x + 100) + 120;
        const corde = this.add.graphics().setDepth(5);
        this.decor.add(corde);
        let u = 0;
        this.tweens.addCounter({ from: 0, to: 1, duration: 500, onUpdate: tw => {
          u = tw.getValue();
          corde.clear().lineStyle(3, 0xc8a060).beginPath().moveTo(p.x + 10, sol - 60);
          for (let k = 1; k <= 10; k++) { const t = k / 10 * u; corde.lineTo(p.x + 10 + (x2 - p.x - 10) * t, sol - 60 + Math.sin(t * Math.PI) * 26); }
          corde.strokePath();
        } });
        this.onomatopee(p.x + 60, cy - 60, 'HOP !');
        await this.attendre(600);
        break;
      }
      case 'potion': case 'antidote': case 'bandage': {
        const o = icone(id).setPosition(p.x, sol - 130);
        await this.animer({ targets: o, y: sol - 100, scale: 2, alpha: 0, duration: 500 });
        o.destroy();
        const teinte = id === 'antidote' ? 0x70ff90 : id === 'potion' ? 0xff7090 : 0xffffff;
        for (let k = 0; k < 12; k++) {
          const e = this.add.image(p.x + Phaser.Math.Between(-30, 30), sol - Phaser.Math.Between(10, 60), 'lueurHD').setScale(1.5).setTint(teinte).setBlendMode(Phaser.BlendModes.ADD).setDepth(7);
          this.tweens.add({ targets: e, y: e.y - 80, alpha: 0, duration: 900, delay: k * 50, onComplete: () => e.destroy() });
        }
        this.perso.setTint(teinte); this.time.delayedCall(400, () => this.perso.clearTint());
        await this.attendre(500);
        break;
      }
      case 'ration': case 'gourde': {
        // (v1.34, planche 59) il boit vraiment à sa gourde : le coude levé, la gourde sur les lèvres
        if (id === 'gourde' && typeof this.bivouacBoire === 'function') { await this.bivouacBoire(); break; }
        // Une pause au coin du feu : le feu s'allume à côté de lui, la lumière baisse, il mange
        if (id === 'ration') {
          const feu = this.add.image(p.x - 70, sol + 2, 'feuCampHD').setOrigin(0.5, 1).setScale(0).setDepth(2);
          const flamme = this.add.sprite(feu.x, sol - 14, 'flammeBougie0').setOrigin(0.5, 1).setScale(0).setDepth(2.1).play('flammeBougie');
          const lueur = this.add.image(feu.x, sol - 30, 'halo').setScale(0).setTint(0xffa040).setAlpha(0.45).setBlendMode(Phaser.BlendModes.ADD).setDepth(8);
          this.decor.add([feu, flamme, lueur]);
          Son.jouer('feuDeCamp', { duree: 4 });   // (v1.64 : le feu de camp qui crépite)
          this.tweens.add({ targets: feu, scale: 2.5, duration: 300, ease: 'Back.easeOut' });
          this.tweens.add({ targets: flamme, scale: 5, duration: 400, delay: 200, ease: 'Back.easeOut' });
          this.tweens.add({ targets: lueur, scale: 3, duration: 500, delay: 200 });
          this.tweens.add({ targets: lueur, alpha: 0.3, scale: 2.7, duration: 300, yoyo: true, repeat: -1, delay: 700 });
          this.tweens.add({ targets: this.voile, fillAlpha: Math.min(0.6, this.voile.fillAlpha + 0.3), duration: 600 });
          this.cadrer(p.x - 20, 280, 1.3, 700);
          for (let k = 0; k < 10; k++) { const e = this.add.image(feu.x + Phaser.Math.Between(-8, 8), sol - 30, 'lueurHD').setScale(0.7).setTint(0xffa040).setBlendMode(Phaser.BlendModes.ADD).setDepth(7); this.decor.add(e); this.tweens.add({ targets: e, y: sol - 110 - Math.random() * 40, x: e.x + Phaser.Math.Between(-20, 20), alpha: 0, duration: 1200, delay: 300 + k * 120, onComplete: () => e.destroy() }); }
          await this.attendre(700);
          // (v1.34, planche 59) il s'assoit sur un rondin et mange vraiment sa ration, puis se relève
          if (typeof this.bivouacManger === 'function') {
            this.rondin(p.x); p.setY(sol - 18);
            await this.bivouacManger();
            this.poserPose(null); p.setY(sol);
            this.cadrer(p.x + 120, 250, 1.12, 700);
            break;
          }
        }
        const o = icone(id).setPosition(p.x + 10, sol - 110);
        this.onomatopee(p.x, sol - 160, id === 'ration' ? 'Miam !' : 'Glou glou !', '#f3d98a');
        await this.animer({ targets: o, scale: 1.5, alpha: 0, y: o.y + 10, duration: 600 });
        o.destroy();
        for (let k = 0; k < 8; k++) {
          const m = this.add.rectangle(p.x + 10, sol - 100, 3, 3, id === 'ration' ? 0xc89a50 : 0x8ac8f0).setDepth(7);
          this.tweens.add({ targets: m, x: m.x + Phaser.Math.Between(-30, 30), y: sol, alpha: 0, duration: 500, delay: k * 40, onComplete: () => m.destroy() });
        }
        await this.attendre(id === 'ration' ? 900 : 200);
        if (id === 'ration') this.cadrer(p.x + 120, 250, 1.12, 700);
        break;
      }
      case 'cape': {
        const o = icone('cape').setPosition(p.x, sol - 80).setScale(5).setAlpha(0);
        await this.animer({ targets: o, alpha: 0.85, duration: 300 });
        this.tweens.add({ targets: o, alpha: 0, delay: 600, duration: 400, onComplete: () => o.destroy() });
        await this.attendre(500);
        break;
      }
      case 'amulette': {
        for (let i = 0; i < 4; i++) {
          const r = this.add.circle(p.x, sol - 70, 20).setStrokeStyle(4, 0xc080ff, 0.9).setDepth(7);
          this.tweens.add({ targets: r, scale: 8, alpha: 0, duration: 900, delay: i * 150, onComplete: () => r.destroy() });
        }
        this.cameras.main.flash(250, 160, 100, 220);
        await this.attendre(700);
        break;
      }
      default: await this.attendre(300);
    }
  }

  // L'issue de l'épreuve, en image : la bête fuit, ou elle frappe ; l'obstacle est franchi, ou pas.
  async issue(reussie) {
    const sc = this.menace.scenario;
    if (sc && sc.issue) { await sc.issue.call(this, reussie); return; }
    const p = this.perso, sol = 360;
    const betes = this.menace.sprites;
    if (this.menace.sorte === 'bete' && betes.length) {
      if (reussie) {
        // Touchées ! Elles reculent, se retournent, et détalent.
        betes.forEach(b => b.setTint(0xff6060));
        this.time.delayedCall(180, () => betes.forEach(b => b.active && b.clearTint()));
        for (const b of betes) {
          this.tweens.killTweensOf(b);
          this.tweens.add({ targets: b, x: b.x + 30, duration: 120, yoyo: true, onComplete: () => {
            b.setFlipX(!b.flipX);
            this.tweens.add({ targets: b, x: 1100, duration: 700, ease: 'Quad.easeIn' });
            this.tweens.add({ targets: b, y: b.y - 8, duration: 110, yoyo: true, repeat: 3 });
          } });
        }
        Son.jouer({ sanglier: 'sanglier', loup: 'loup', araignee: 'siffle', esprits: 'froid', mortvivant: 'coup' }[this.menace.type] || 'grogne');
        this.onomatopee(betes[0].x, sol - 150, 'OUSTE !', '#ffe9a8');
        await this.attendre(500);
      } else {
        // Elle bondit sur lui.
        const b = betes[0];
        this.tweens.killTweensOf(b);
        this.lignesDeVitesse(b.x - 40, b.y - 60, -1);
        await this.animer({ targets: b, x: p.x + 50, y: b.y - 30, duration: 220, ease: 'Quad.easeIn' });
        this.coupDeZoom(p.x + 30, sol - 70, 1.45);
        const impact = this.add.image(p.x + 30, sol - 80, 'eclat').setScale(5).setTint(0xffffff).setDepth(8);
        this.tweens.add({ targets: impact, scale: 1, alpha: 0, angle: 45, duration: 260, onComplete: () => impact.destroy() });
        this.onomatopee(p.x + 20, sol - 150, Phaser.Utils.Array.GetRandom(['AÏE !', 'OUILLE !', 'CRAC !']), '#ff8080');
        this.tweens.add({ targets: b, x: b.base.x, y: b.base.y, duration: 400, ease: 'Quad.easeOut' });
        this.tweens.add({ targets: p, angle: -14, duration: 100, yoyo: true });
      }
    } else if (this.menace.ravin) {
      await this.traverserRavin(reussie);
    } else if (this.menace.sorte === 'gouffre') {
      const x0 = p.x, y0 = p.y, x1 = (this.menace.x || x0) + 130;
      if (reussie) {
        // Un grand saut par-dessus
        await Promise.all([
          this.animer({ targets: p, x: x1, duration: 600, ease: 'Linear' }),
          this.animer({ targets: p, y: y0 - 70, duration: 300, yoyo: true, ease: 'Quad.easeOut' }),
        ]);
        p.setY(y0);
        this.onomatopee(x1, sol - 150, 'HOP !', '#ffe9a8');
      } else {
        await this.animer({ targets: p, x: x0 + 40, y: y0 + 12, angle: 20, duration: 300, ease: 'Quad.easeIn' });
        this.onomatopee(p.x, sol - 140, this.menace.eau ? 'PLOUF !' : 'AÏE !', this.menace.eau ? '#a8d0ff' : '#ff8080');
        await this.animer({ targets: p, x: x0, y: y0, angle: 0, duration: 400 });
      }
    } else if (!reussie) {
      // Il trébuche, frissonne ou suffoque
      await this.animer({ targets: p, angle: 12, duration: 140, yoyo: true, repeat: 1 });
    }
  }

  // --- (v0.58) Le ravin et la corde ---

  // Le décor : X = le bord du ravin. La falaise de gauche monte en deux gradins jusqu'au bord ;
  // le vide ; la falaise de droite, l'arbre penché, puis on redescend en deux gradins.
  ravin(X, eau) {
    const sol = 360, haut = 270, bas = 380;
    const R = this.menace;
    Object.assign(R, { sorte: 'gouffre', ravin: { X, haut, eau, branche: { x: X + 110, y: haut - 112 } }, x: X + 110, eau });
    const ajouter = o => { this.decor.add(o); return o; };
    this.perso.setDepth(3);
    // la paroi d'en face, au fond du canyon : de plus en plus sombre vers le bas, avec ses strates
    const canyon = ajouter(this.add.graphics().setDepth(1.02));
    for (let k = 0; k < 10; k++) canyon.fillStyle(Phaser.Display.Color.GetColor(92 - k * 6, 80 - k * 6, 66 - k * 5)).fillRect(X + 12, haut + k * 12, 196, 13);
    for (let y = haut + 6; y < bas; y += 9) canyon.fillStyle(0x000000, 0.12).fillRect(X + 12, y, 196, 2);
    for (let k = 0; k < 6; k++) canyon.fillStyle(0x3a5a2a, 0.6).fillEllipse(X + 30 + k * 32, haut + 6 + (k % 2) * 6, 18, 6);   // des touffes accrochées
    // le fond du ravin : la rivière qui gronde, ou le noir du gouffre et sa brume
    if (eau) {
      // (v0.68) l'eau fait partie du décor : dessinée derrière les falaises (elle passait par-dessus)
      // et effacée avec lui au changement de plan (elle traînait encore à l'écran)
      if (this.eauRecit) { this.eauRecit.destroy(); this.eauRecit = null; }
      ajouter(eauRecitHD(this, X + 110, bas + 20, 214, 60));
      // les rapides : des traînées d'écume qui filent, des rochers qui fendent le courant
      // (v0.68) l'eau s'enfonce dans l'ombre des falaises, et une ligne d'humidité marque la paroi
      ajouter(this.add.rectangle(X + 110, bas - 41, 200, 4, 0x1a1410, 0.35));
      for (const [ox, sens] of [[X + 30, 1], [X + 192, -1]]) for (let k = 0; k < 4; k++) ajouter(this.add.rectangle(ox + sens * k * 6, bas - 10, 6, 62, 0x0a1a24, 0.32 - k * 0.07).setOrigin(0.5, 1));
      for (const [rx, ry] of [[X + 70, bas - 26], [X + 150, bas - 22]]) {
        const roc = ajouter(this.add.ellipse(rx, ry, 26, 12, 0x3a3430).setDepth(1.08));
        ajouter(this.add.ellipse(rx - 3, ry - 3, 16, 5, 0x6a5e52));   // le dessus mouillé du rocher, qui accroche la lumière
        for (let k = 0; k < 3; k++) { const e = ajouter(this.add.ellipse(rx - 14, ry, 10, 4, 0xffffff, 0.8).setDepth(1.09)); this.tweens.add({ targets: e, x: rx - 40, alpha: 0, scaleX: 2, duration: 700, delay: k * 230, repeat: -1 }); }
        void roc;
      }
      this.tweens.add({ targets: ajouter(this.add.rectangle(X + 110, bas - 36, 200, 10, 0xe8f8ff, 0.12).setDepth(1.1)), alpha: 0.25, duration: 900, yoyo: true, repeat: -1 });
      this.time.addEvent({ delay: 140, repeat: 60, callback: () => {
        if (!this.menace.ravin) return;
        const g = ajouter(this.add.circle(X + 30 + Math.random() * 160, bas - 30, 1.5 + Math.random(), 0xe8f8ff, 0.8).setDepth(1.1));
        this.tweens.add({ targets: g, y: g.y - 20 - Math.random() * 20, x: g.x + 10, alpha: 0, duration: 700, onComplete: () => g.destroy() });
      } });
    } else {
      const fond = ajouter(this.add.graphics().setDepth(1.05));
      for (let k = 0; k < 8; k++) fond.fillStyle(Phaser.Display.Color.GetColor(30 - k * 3, 26 - k * 3, 30 - k * 3)).fillRect(X + 10, haut + k * 14, 200, 15);
      for (let k = 0; k < 4; k++) { const b = ajouter(this.add.image(X + 50 + k * 40, bas - 10, 'halo').setScale(1.4, 0.5).setTint(0xb0b0c0).setAlpha(0.25).setDepth(1.08)); this.tweens.add({ targets: b, x: b.x + 30, alpha: 0.1, duration: 2200 + k * 400, yoyo: true, repeat: -1 }); }
    }
    // les deux falaises, avec leurs strates, leurs fissures et l'herbe au bord
    const falaise = (pts, graine) => {
      const g = ajouter(this.add.graphics().setDepth(1.2));
      const v = pts.map(([x, y]) => new Phaser.Math.Vector2(x, y));
      g.fillStyle(0x7a6a56).fillPoints(v, true);
      const xs = pts.map(p => p[0]), x0 = Math.min(...xs), x1 = Math.max(...xs);
      // la lumière vient d'en haut à gauche : les dessus et les flancs gauches s'éclairent, le bas fonce
      for (let y = haut; y < bas + 20; y += 6) g.fillStyle(0x000000, Math.min(0.45, (y - haut) / 260)).fillRect(x0, y, x1 - x0, 6);
      for (let k = 0; k < pts.length - 1; k++) {
        const [ax, ay] = pts[k], [bx, by] = pts[k + 1];
        if (Math.abs(ay - by) < 2) g.lineStyle(4, 0xa8967a).lineBetween(ax, ay + 2, bx, by + 2);                // les dessus, clairs
        else if (bx === ax || Math.abs(bx - ax) < 12) g.lineStyle(5, by < ay ? 0x9a886e : 0x3e342a).lineBetween(ax + (by < ay ? 3 : -3), ay, bx + (by < ay ? 3 : -3), by);
      }
      // des blocs et des éclats de roche
      for (let k = 0; k < 9; k++) { const bx = x0 + 8 + hachage(k, graine, 61) * (x1 - x0 - 16), by = haut + 16 + hachage(graine, k, 62) * (bas - haut - 10); g.fillStyle(0x8a7a62, 0.9).fillRect(bx, by, 7 + (k % 3) * 3, 4); g.fillStyle(0x4a3e32).fillRect(bx, by + 4, 7 + (k % 3) * 3, 2); }
      for (let y = haut + 8; y < bas; y += 11) g.fillStyle(0x4a4036, 0.6).fillRect(x0 + 4, y, x1 - x0 - 8, 2);           // les strates
      for (let k = 0; k < 5; k++) { const fx = x0 + 10 + hachage(k, graine, 51) * (x1 - x0 - 20); g.lineStyle(2, 0x2e2822, 0.9).lineBetween(fx, haut + 20 + k * 9, fx + 6, haut + 40 + k * 9); }
      g.lineStyle(3, 0x2a221c).strokePoints(pts.map(([x, y]) => new Phaser.Math.Vector2(x, y)), true);
      return g;
    };
    falaise([[X - 96, bas + 20], [X - 96, 318], [X - 36, 318], [X - 36, haut], [X + 16, haut], [X + 26, 300], [X + 18, 330], [X + 30, bas + 20]], 1);
    falaise([[X + 194, bas + 20], [X + 204, 320], [X + 196, 300], [X + 206, haut], [X + 292, haut], [X + 292, 318], [X + 346, 318], [X + 346, bas + 20]], 2);
    // l'herbe au bord des gradins
    const herbe = ajouter(this.add.graphics().setDepth(1.25));
    for (const [a, b, y] of [[X - 96, X - 36, 318], [X - 36, X + 16, haut], [X + 206, X + 292, haut], [X + 292, X + 346, 318]]) {
      herbe.fillStyle(0x5a8a3a).fillRect(a, y - 3, b - a, 5);
      for (let k = a; k < b; k += 5) herbe.fillStyle(0x6aa040).fillTriangle(k, y - 2, k + 2, y - 8 - (k % 3) * 2, k + 4, y - 2);
    }
    for (const [a, b, y] of [[X - 36, X + 16, haut], [X + 206, X + 292, haut]]) for (let k = a + 3; k < b; k += 7) herbe.fillStyle(0x4a7a30, 0.9).fillRect(k, y + 2, 3, 4 + (k % 5) * 2);
    // le vieil arbre penché sur l'autre rive, et sa grosse branche au-dessus du vide
    const br = R.ravin.branche;
    // (v1.63 : peint comme tous les arbres, arbresHD.js, de la saison ; la toile à demi-résolution, affichée ×2, son
    // coin en (X + 90, haut - 220) : la branche finit juste au point d'accroche du grappin)
    const froid = NEIGES_RECIT.includes(this.biome), sa = froid ? 'givre' : saisonArbresContree(this.biome), nv = froid || neigeArbresContree(this.biome, sa);
    const cleR = arbreSurMesureHD(this, `arbreRavin_${sa}${nv ? '_n' : ''}`, 110, 113, { saison: sa, neige: nv, graine: 9,
      // le tronc qui se tord un peu en montant, ses racines agrippées au bord ; la grosse branche (un peu ployée) ; les branches de la couronne
      traits: [[86, 110, 84, 92, 7.4, 6.6], [84, 92, 80, 72, 6.6, 5.8], [80, 72, 77, 52, 5.8, 4.8], [77, 52, 73, 35, 4.8, 3.9], [73, 35, 75, 20, 3.9, 2.5], [75, 20, 79, 9, 2.5, 1.3],
        [86, 109, 76, 111, 3.4, 1.2], [86, 109, 97, 111, 3.6, 1.2], [79, 64, 62, 59, 4.6, 3.7], [62, 59, 45, 56, 3.7, 3], [45, 56, (br.x - X - 90) / 2, (br.y - haut + 220) / 2, 3, 2.2],
        [62, 59, 55, 48, 1.9, 1], [45, 56, 36, 46, 1.7, 0.9], [75, 37, 92, 28, 2.5, 1.3], [74, 28, 62, 17, 2.1, 1.1], [77, 47, 95, 41, 2.1, 1.2], [76, 22, 88, 15, 1.6, 0.9]],
      touffes: [[77, 11, 11], [66, 18, 10], [88, 21, 10], [75, 26, 13], [61, 30, 10], [94, 33, 9], [85, 37, 10], [52, 43, 8], [37, 43, 8], [23, 47, 8], [11, 47, 7], [57, 50, 7]] });
    ajouter(this.add.image(X + 90, haut - 220, cleR).setOrigin(0, 0).setScale(2).setDepth(1.3));
  }

  // Il grimpe sur la falaise de gauche, de gradin en gradin, jusqu'au bord du vide.
  async grimperFalaise() {
    const R = this.menace.ravin, p = this.perso;
    if (!R || R.grimpe) return;
    R.grimpe = true;
    this.cadrer(R.X + 110, 230, 1.15, 800);
    for (const [x, y] of [[R.X - 66, 318], [R.X - 6, R.haut]]) {
      p.setFlipX(false);
      pasDeMarche(this, p, 380);
      await Promise.all([this.animer({ targets: p, x, duration: 380, ease: 'Linear' }), this.animer({ targets: p, y: { from: p.y, to: y }, duration: 380, ease: 'Quad.easeOut' })]);
      p.setY(y);
    }
    // il se penche au-dessus du vide... et regarde en bas
    this.onomatopee(R.X + 60, R.haut - 80, R.eau ? 'Grrrrr...' : '...', '#c8e0ff');
    await this.animer({ targets: p, angle: 8, duration: 220, yoyo: true, hold: 300 });
  }

  // Le grappin : il le fait tournoyer, le lance en cloche, il s'enroule autour de la branche.
  async lancerGrappin() {
    const R = this.menace.ravin, p = this.perso, br = R.branche;
    const main = () => ({ x: p.x + 8, y: p.y - hauteurCorps(p) * 0.72 });
    const corde = this.add.graphics().setDepth(4); this.decor.add(corde);
    const crochet = this.add.triangle(0, 0, 0, 6, 6, 0, 12, 6, 0x9aa0a8).setDepth(4.1); this.decor.add(crochet);
    // il le fait tournoyer au-dessus de sa tête
    const tour = { a: 0 };
    Son.jouer('vol');
    await this.animer({ targets: tour, a: Math.PI * 4, duration: 700, onUpdate: () => {
      const m = main(), cx = m.x + Math.cos(tour.a) * 18, cy = m.y - 30 + Math.sin(tour.a) * 8;
      crochet.setPosition(cx, cy); corde.clear().lineStyle(2, 0xc8a060).lineBetween(m.x, m.y, cx, cy);
    } });
    // le lancer, en cloche
    const vol = { t: 0 }, m0 = main();
    await this.animer({ targets: vol, t: 1, duration: 600, ease: 'Linear', onUpdate: () => {
      const t = vol.t, x = m0.x + (br.x - m0.x) * t, y = m0.y + (br.y - m0.y) * t - Math.sin(t * Math.PI) * 50;
      crochet.setPosition(x, y).setAngle(t * 720);
      const m = main(); corde.clear().lineStyle(2, 0xc8a060).beginPath().moveTo(m.x, m.y);
      for (let k = 1; k <= 8; k++) { const u = k / 8; corde.lineTo(m.x + (x - m.x) * u, m.y + (y - m.y) * u + Math.sin(u * Math.PI) * 14 * (1 - t)); }
      corde.strokePath();
    } });
    // il s'enroule autour de la branche, et la corde se tend
    this.onomatopee(br.x, br.y - 30, 'CLAC !', '#fff4dc');
    Son.jouer('coup');
    const enroule = this.add.graphics().setDepth(4.2); this.decor.add(enroule);
    enroule.lineStyle(3, 0xc8a060).strokeEllipse(br.x, br.y, 12, 8);
    crochet.setPosition(br.x + 4, br.y + 6).setAngle(180);
    R.corde = corde;
    R.tirer = () => { const m = main(); corde.clear().lineStyle(2.5, 0xc8a060).lineBetween(br.x, br.y, m.x, m.y); };
    R.tirer();
    await this.animer({ targets: p, x: p.x - 4, duration: 120, yoyo: true });   // il tire un coup sec pour vérifier
  }

  // La traversée : accroché à la corde, il se balance au-dessus de l'eau et atterrit en face ;
  // ou la corde cède au milieu, et c'est le plongeon. Sans corde, il tente un grand saut.
  async traverserRavin(reussie) {
    const R = this.menace.ravin, p = this.perso, br = R.branche;
    await this.grimperFalaise();
    const pieds = () => ({ x: p.x, y: p.y });
    const fin = { x: R.X + 238, y: R.haut };
    if (R.corde) {
      // le balancier : les mains décrivent un arc autour de la branche
      const m0 = { x: p.x + 8, y: p.y - hauteurCorps(p) * 0.72 };
      const r = Math.hypot(m0.x - br.x, m0.y - br.y), a0 = Math.atan2(m0.y - br.y, m0.x - br.x);
      const a1 = Math.PI - a0, ecart = hauteurCorps(p) * 0.72;
      const balance = { u: 0 };
      this.lignesDeVitesse(p.x, p.y - 60, 1);
      Son.jouer('vol', { force: 1.2 });
      const casse = !reussie;
      await this.animer({ targets: balance, u: casse ? 0.5 : 1, duration: casse ? 620 : 1150, ease: casse ? 'Sine.easeIn' : 'Sine.easeInOut', onUpdate: () => {
        const a = a0 + (a1 - a0) * balance.u;
        const mx = br.x + Math.cos(a) * r, my = br.y + Math.sin(a) * r;
        p.setPosition(mx - 8, my + ecart).setAngle((a - Math.PI / 2) * -40 * 0.6);
        R.corde.clear().lineStyle(2.5, 0xc8a060).lineBetween(br.x, br.y, mx, my);
      } });
      if (casse) {
        // CRAC : la corde lâche, il tombe dans le vide
        this.onomatopee(br.x, br.y - 20, 'CRAC !', '#ff8080');
        this.cameras.main.shake(200, 0.01);
        const bout = { x: p.x + 8, y: p.y - ecart };
        R.corde.clear().lineStyle(2.5, 0xc8a060).lineBetween(br.x, br.y, br.x + 6, br.y + 30);
        void bout;
        await this.tomberDansLeRavin();
        return;
      }
      p.setAngle(0);
      // il lâche la corde au bon moment, et retombe sur ses pieds
      this.tweens.addCounter({ from: 0, to: 1, duration: 1400, onUpdate: tw => { const u = tw.getValue(); const a = Math.PI / 2 + Math.sin(u * 12) * (1 - u) * 0.6; R.corde.clear().lineStyle(2.5, 0xc8a060).lineBetween(br.x, br.y, br.x + Math.cos(a) * 70, br.y + Math.sin(a) * 70); } });
      await this.animer({ targets: p, x: fin.x, y: fin.y, duration: 260, ease: 'Quad.easeOut' });
    } else if (reussie) {
      // sans corde : un grand saut, de justesse
      this.lignesDeVitesse(p.x, p.y - 60, 1);
      const x0 = p.x, y0 = p.y;
      await Promise.all([this.animer({ targets: p, x: fin.x, duration: 700, ease: 'Linear' }), this.animer({ targets: p, y: { from: y0, to: y0 - 80 }, duration: 350, yoyo: true, ease: 'Quad.easeOut' })]);
      p.setY(fin.y);
      void pieds;
    } else {
      this.lignesDeVitesse(p.x, p.y - 60, 1);
      await Promise.all([this.animer({ targets: p, x: R.X + 110, duration: 500, ease: 'Linear' }), this.animer({ targets: p, y: { from: p.y, to: p.y - 50 }, duration: 250, yoyo: true, ease: 'Quad.easeOut' })]);
      await this.tomberDansLeRavin();
      return;
    }
    // la réception : un nuage de poussière, HOP, puis il redescend les gradins de l'autre côté
    for (let k = 0; k < 8; k++) { const d = this.add.circle(p.x + (k - 4) * 6, p.y, 4, 0xc8b090, 0.7).setDepth(3.1); this.decor.add(d); this.tweens.add({ targets: d, y: d.y - 10, x: d.x + (k - 4) * 4, alpha: 0, scale: 2, duration: 500, onComplete: () => d.destroy() }); }
    this.onomatopee(p.x, p.y - 140, 'HOP !', '#ffe9a8');
    this.tweens.add({ targets: p, scaleY: p.scaleY * 0.9, duration: 90, yoyo: true });
    await this.attendre(300);
    for (const [x, y] of [[R.X + 318, 318], [R.X + 372, 360]]) {
      pasDeMarche(this, p, 330);
      await Promise.all([this.animer({ targets: p, x, duration: 330, ease: 'Linear' }), this.animer({ targets: p, y: { from: p.y - 16, to: y }, duration: 330, ease: 'Quad.easeIn' })]);
    }
    p.setY(360);
    this.menace.ravin = null;
  }

  // La chute : il tombe en tournoyant, PLOUF dans la rivière (ou se rattrape à une racine dans
  // le gouffre), puis on le retrouve, trempé et sonné, au pied de la falaise de départ.
  async tomberDansLeRavin() {
    const R = this.menace.ravin, p = this.perso;
    const fond = R.eau ? 352 : 330;
    await this.animer({ targets: p, y: fond, angle: 160, duration: 520, ease: 'Quad.easeIn' });
    if (R.eau) {
      Son.jouer('plouf');
      this.onomatopee(p.x, fond - 120, 'PLOUF !', '#a8d0ff');
      eclaboussure(this, p.x, fond - 8, { taille: 2, conteneur: this.decor });   // (v0.70)
      p.setAlpha(0.6);
      this.tweens.add({ targets: p, angle: 148, y: fond + 6, duration: 175, yoyo: true, repeat: 1, ease: 'Sine.easeInOut' });   // (il se débat dans les remous)
      await this.animer({ targets: p, x: p.x - 60, duration: 700, ease: 'Sine.easeInOut' });   // le courant l'emporte
    } else {
      this.onomatopee(p.x, fond - 120, 'AÏE !', '#ff8080');
      this.cameras.main.shake(220, 0.012);
    }
    await this.animer({ targets: p, alpha: 0, duration: 300 });
    // on le retrouve au pied de la falaise, trempé
    p.setPosition(R.X - 130, 360).setAngle(0).setFlipX(false);
    if (R.eau) p.setTint(0xa8c8ff);
    await this.animer({ targets: p, alpha: 1, duration: 400 });
    this.time.delayedCall(1200, () => p.active && p.clearTint());
    await this.animer({ targets: p, angle: 10, duration: 120, yoyo: true, repeat: 2 });   // il s'ébroue
    this.menace.ravin = null;
  }

  // Des lignes de vitesse, façon bande dessinée, derrière un bond ou un coup (sens : 1 vers la droite)
  lignesDeVitesse(x, y, sens = 1) {
    for (let k = 0; k < 5; k++) {
      const l = this.add.rectangle(x - sens * (20 + k * 12), y - 30 + k * 15, 40 + (k % 2) * 30, 2, 0xffffff, 0.8).setOrigin(sens > 0 ? 1 : 0, 0.5).setDepth(8);
      this.tweens.add({ targets: l, scaleX: 0, alpha: 0, x: l.x - sens * 40, duration: 260, delay: k * 20, onComplete: () => l.destroy() });
    }
  }
}
