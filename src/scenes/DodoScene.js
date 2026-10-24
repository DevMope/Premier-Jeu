// (v0.61) Où s'accrochent les armes légendaires : la panoplie du mur (réglée sur la planche)
function placeArmeAuMur(i) { return [160 + (i % 4) * 46, 110 + Math.floor(i / 4) * 42]; }

// Aller dormir : la fin de la journée. Ton personnage rentre dans sa chambre, souffle la
// bougie et se glisse dans son lit, pendant que le bilan de la journée s'affiche (façon
// Dave the Diver). La nuit passe à la fenêtre, puis l'aube : il se lève, direction le marché.
class DodoScene extends Cinematique {
  constructor() { super('Dodo'); }

  init(data) {
    this.bilan = data.bilan;
    this.nuitPassee = false;
    this.fini = false;
  }

  create() {
    exclureScenes(this, 'Nuit', 'Carte', 'Comptoir');   // (v0.62)
    const G = this.G = window.GAME;
    // (v1.00) le dernier soir du Solstice, avant d'aller dormir : les lanternes célestes, une fois par an
    if (typeof lanternesCelestesDues === 'function' && lanternesCelestesDues(G)) {
      G.lanternesVues = dateDuJour(G).an;
      this.scene.start('Lanternes', { suite: 'Dodo', donnees: { bilan: this.bilan } });
      return;
    }
    // (v1.05) le grand soir du Long Hiver, avant d'aller dormir : le banquet sous le sapin, une fois par an
    // (v1.07 : marqué « fait » seulement quand le cadeau est donné : une sauvegarde juste avant ne le fait plus perdre)
    if (typeof banquetDu === 'function' && banquetDu(G)) {
      this.scene.start('Banquet', { suite: 'Dodo', donnees: { bilan: this.bilan } });
      return;
    }
    this.cameras.main.fadeIn(500);
    this.dessinerChambre();
    this.joueur = this.add.image(1000, SOL_CHAMBRE, textureJoueur(this, G)).setOrigin(0.5, 1).setScale(echelleJoueur(7.5)).setDepth(3);
    this.boutonPasser(() => this.passer());
    // (v1.40, planche 67) le soir du Jour Zéro : la veillée au coin du feu avec Garrick, puis la nuit
    if (typeof veilleeDuJourZero === 'function' && jourZero(G) && didacticiel(G) && !G.veilleeFaite) {
      if (this.allumerCheminee) this.allumerCheminee();
      this.joueur.setX(470).setFlipX(true);
      veilleeDuJourZero(this, () => { this.joueur.setX(1000).setFlipX(false); this.derouler(); });
    } else this.derouler();
  }

  // --- Le décor ---

  dessinerChambre() {
    // Le ciel derrière la fenêtre : un vrai paysage, de jour et de nuit (étoiles, collines dans
    // l'ombre, pleine lune), qu'on fera passer de l'un à l'autre à l'aube.
    const fx = 640, fy = 60, fw = 200, fh = 150;
    creerFenetreHD(this);
    const ciel = moment => {
      const cle = paysageHD(this, fw, fh, 'comte', moment, { sansAstre: true });
      const tex = this.textures.get(cle).getSourceImage();
      return this.add.image(fx, fy, cle).setOrigin(0).setScale(fw / tex.width, fh / tex.height);
    };
    ciel(0);
    this.soleil = this.add.image(fx + 140, fy + fh + 30, 'soleilHD').setScale(1.4);
    // Le soleil se lève DERRIÈRE les arbres : on le cache sous la ligne des collines
    const horizon = this.make.graphics({ add: false });
    horizon.fillStyle(0xffffff).fillRect(fx, fy, fw, fh * 0.6);
    this.soleil.setMask(horizon.createGeometryMask());
    this.tweens.add({ targets: this.soleil, angle: 360, duration: 30000, repeat: -1 });
    this.cielNuit = this.add.container(0, 0);
    this.cielNuit.add(ciel(0.95));
    for (let i = 0; i < 10; i++) {
      const etoile = this.add.image(fx + 10 + Math.random() * (fw - 20), fy + 8 + Math.random() * (fh * 0.45), 'eclat').setScale(0.7);
      this.tweens.add({ targets: etoile, alpha: 0.2, scale: 0.4, duration: 500 + Math.random() * 900, yoyo: true, repeat: -1 });
      this.cielNuit.add(etoile);
    }
    creerHalo(this);
    const lueur = this.add.image(fx + 52, fy + 42, 'halo').setScale(0.9).setTint(0xc8d8ff).setAlpha(0.45).setBlendMode(Phaser.BlendModes.ADD);
    this.lune = this.add.image(fx + 52, fy + 42, 'luneHD').setScale(1.3);
    this.cielNuit.add([lueur, this.lune]);
    this.tweens.add({ targets: lueur, alpha: 0.3, duration: 1800, yoyo: true, repeat: -1 });
    // L'aube : le paysage rose orangé du lever du soleil, entre la nuit et le jour.
    this.aube = this.add.rectangle(fx + fw / 2, fy + fh / 2, fw, fh, 0xf0a060, 0);
    this.cielAube = ciel('aube').setAlpha(0);

    // Les murs à colombages, avec le trou de la fenêtre (le ciel est derrière), et le plancher.
    creerInterieurHD(this);
    this.add.image(0, 0, murInterieur(this, 'murChambre', { h: SOL_CHAMBRE / 2, poteaux: [96, 400], graine: 320,
      fenetre: { x: fx / 2, y: fy / 2, l: fw / 2, h: fh / 2 } })).setOrigin(0).setScale(2).setDepth(1).setTint(0x9a7c60);
    this.add.image(0, SOL_CHAMBRE, plancher(this, 'plancherChambre', { h: (540 - SOL_CHAMBRE) / 2, graine: 420 })).setOrigin(0).setScale(2).setDepth(1).setTint(0xc8a888);
    // Le cadre de la fenêtre, ses reflets, et les rideaux de part et d'autre
    this.add.image(fx - 16, fy - 16, 'cadreFenetreHD').setOrigin(0).setScale(2).setDepth(1.1).setDisplaySize(fw + 32, fh + 44);
    const reflets = this.add.graphics().setDepth(1.05);
    reflets.fillStyle(0xffffff, 0.08);
    for (const [px, py] of [[fx, fy], [fx + fw / 2, fy], [fx, fy + fh / 2], [fx + fw / 2, fy + fh / 2]]) reflets.fillTriangle(px + 8, py + 6, px + 30, py + 6, px + 8, py + 34);
    this.add.image(fx - 34, fy - 18, 'rideauHD').setOrigin(0, 0).setScale(2).setDepth(1.2);
    this.add.image(fx + fw + 34, fy - 18, 'rideauHD').setOrigin(0, 0).setScale(-2, 2).setDepth(1.2);
    vignette(this, 0.85, 1.5);
    // Le clair de lune qui entre par la fenêtre
    this.clairDeLune = this.add.image(fx + fw / 2, fy + fh / 2 + 40, 'halo').setScale(3.4, 2.6).setTint(0x6a8ad8).setAlpha(0.18)
      .setBlendMode(Phaser.BlendModes.ADD).setDepth(1.6);

    // Le lit, et la couverture en patchwork posée par-dessus le dormeur (elle ne se voit qu'une fois couché).
    const luxe = niveauAmelioration(this.G, 'chambre');
    this.lit = this.add.image(250, SOL_CHAMBRE, litHD(this, luxe)).setOrigin(0, 1).setScale(2).setDepth(2);
    this.couverture = this.add.image(316, SOL_CHAMBRE - 100, couvertureHD(this, luxe)).setOrigin(0).setScale(2, 2.35).setDepth(4).setAlpha(0);

    // La table de chevet, la bougie et sa lumière.
    this.chevet = this.add.image(635, SOL_CHAMBRE, chevetHD(this, luxe)).setOrigin(0.5, 1).setScale(2).setDepth(2);
    const b = bougie(this, 628, SOL_CHAMBRE - 62, { rayon: 230, profondeur: 2 });
    this.flamme = b.flamme;
    this.lumiere = b.halo.setDepth(5);

    // Un tapis tressé, un coffre, et la vieille épée de Garrick accrochée au mur.
    this.tapis = this.add.image(440, SOL_CHAMBRE + 42, tapisHD(this, luxe)).setScale(2).setDepth(1.4);
    // (v0.66) le coffre, au pied du lit ; à sa place, contre le mur de gauche, la cheminée
    this.add.image(548, SOL_CHAMBRE + 44, coffreHD(this, niveauAmelioration(this.G, 'coffre'))).setOrigin(0.5, 1).setScale(2.4).setDepth(4.5);
    creerChemineeHD(this);
    this.add.image(112, SOL_CHAMBRE + 6, 'chemineeHD').setOrigin(0.5, 1).setScale(2).setDepth(1.6);
    this.add.image(112, SOL_CHAMBRE - 2, 'buchesHD').setOrigin(0.5, 1).setScale(2).setDepth(1.65);
    this.feuCheminee = null;
    this.allumerCheminee = () => {
      if (this.feuCheminee) return;
      // les flammes et leur lueur restent visibles quand la bougie est soufflée (au-dessus du noir)
      const f = this.add.image(112, SOL_CHAMBRE - 6, 'flammeHD_0').setOrigin(0.5, 1).setScale(2.2).setDepth(6.5);
      const l = this.add.image(112, SOL_CHAMBRE - 40, 'halo').setScale(2.6).setTint(0xff8a30).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD).setDepth(6.6);
      let k = 0;
      this.time.addEvent({ delay: 120, loop: true, callback: () => { if (f.active) f.setTexture('flammeHD_' + (++k % 3)); } });
      this.tweens.add({ targets: l, alpha: 0.22, scale: 2.4, duration: 260, yoyo: true, repeat: -1 });
      this.feuCheminee = f;
    };
    if (feuAllume(this.G)) this.allumerCheminee();
    // Le mannequin de l'armure (du côté qu'elle avait hier soir), et le compte des pièces.
    this.coteAffiche = this.G.armureCoteVu || coteArmure(this.G);
    // (audit v0.61) le soir, tout ce qui a été reçu est en place (les livraisons de ce matin
    // comprises) ; ce que la nuit apporte sera retiré dans passerLaNuit(), pour le messager
    this.dessinerArmure(this.G.armure.slice());
    this.dessinerArmes((this.G.armesLegendaires || []).slice());
    this.add.image(400, 150, 'hd_epee').setScale(4).setAngle(45).setDepth(2);
    // (v0.57) Les souvenirs au mur : le portrait de famille, l'étagère des trophées (rares), les lettres
    creerSouvenirsChambreHD(this);
    this.add.image(64, 96, 'portraitFamille').setScale(2).setDepth(1.3);
    this.add.image(140, 210, 'etagereTrophees').setOrigin(0, 0).setScale(2).setDepth(1.3);
    (this.G.trophees || []).slice(0, 6).forEach((t, i) => this.add.image(160 + i * 32, 212, 'trophee_' + t.id).setOrigin(0.5, 1).setScale(2).setDepth(1.35));
    // (v1.45) Grand-Mère Écaille, naturalisée, sur sa plaque de chêne au-dessus de l'étagère
    if (this.G.peche && this.G.peche.trophee && typeof texturePoisson === 'function') {
      this.add.rectangle(246, 146, 150, 58, 0x4a2e18).setStrokeStyle(3, 0x2a1808).setDepth(1.31);
      this.add.rectangle(246, 146, 140, 48, 0x6a4424).setDepth(1.32);
      this.add.image(246, 144, texturePoisson(this, 'legende')).setScale(1.6).setDepth(1.33);
      this.add.rectangle(246, 172, 60, 8, 0xc9a227).setStrokeStyle(1, 0x5a3a08).setDepth(1.34);
    }
    if (!(this.G.trophees || []).length) this.add.text(244, 196, 'Trophées des aventuriers', style(10, '#c8a878', { fontStyle: 'italic' })).setOrigin(0.5).setAlpha(0.55).setDepth(1.35);
    this.add.image(480, 60, 'tableauLettres').setOrigin(0, 0).setScale(2).setDepth(1.3);
    const nLettres = Math.min(6, (this.G.courrier || []).length + Math.floor(((this.G.stats || {}).lettresAcceptees || 0) / 3));
    for (let i = 0; i < nLettres; i++) this.add.image(496 + (i % 3) * 26 + (i % 2) * 3, 70 + Math.floor(i / 3) * 34 + (i % 3) * 2, 'lettreEpinglee' + (i % 3)).setOrigin(0, 0).setScale(2).setAngle((i % 2 ? 4 : -5)).setDepth(1.32);

    // L'obscurité de la chambre, qui tombe quand on souffle la bougie.
    this.noir = this.add.rectangle(480, 270, 960, 540, 0x05060f, 0).setDepth(6);
  }

  // --- Le déroulé ---

  async derouler() {
    const b = this.bilan;
    await this.marcher(this.joueur, 600, 4);
    this.onomatopee(600, SOL_CHAMBRE - 130, 'Aaaah...', '#f3d98a');
    await this.animer({ targets: this.joueur, scaleY: echelleJoueur(8), duration: 260, yoyo: true });
    await this.attendre(300);
    // Il souffle la bougie...
    this.onomatopee(650, SOL_CHAMBRE - 140, 'Fffff !');
    Son.jouer('glisse'); this.time.delayedCall(900, () => Son.jouer('hibou'));
    this.tweens.killTweensOf([this.flamme, this.lumiere]);
    this.tweens.add({ targets: [this.flamme, this.lumiere], alpha: 0, duration: 400 });
    this.tweens.add({ targets: this.noir, fillAlpha: 0.45, duration: 700 });
    await this.attendre(500);
    // ... et se glisse sous la couverture.
    this.joueur.setOrigin(0.5, 0.5);
    this.joueur.y -= this.joueur.displayHeight / 2;
    await this.animer({ targets: this.joueur, x: 330, y: SOL_CHAMBRE - 68, angle: -90, duration: 500, ease: 'Sine.easeInOut' });
    this.joueur.setTexture(textureJoueurDort(this, this.G));   // (v1.61) il ferme les yeux
    this.tweens.add({ targets: this.couverture, alpha: 1, duration: 300 });
    this.ronfler();
    if (this.fini) return;

    // Le bilan de la journée, sur un parchemin.
    this.afficherBilan(b);
    await this.attendreClicSansBoite();
    if (this.fini) return;
    this.carteBilan.destroy();

    // La nuit passe...
    this.passerLaNuit();
    if (this.G.faillite) return this.partir('Faillite');
    this.tweens.add({ targets: this.lune, y: this.lune.y - 60, alpha: 0, duration: 1600 });
    await this.attendre(800);
    this.tweens.add({ targets: this.cielNuit, alpha: 0, duration: 1800 });
    this.tweens.add({ targets: this.clairDeLune, alpha: 0, duration: 1800 });
    this.tweens.add({ targets: this.cielAube, alpha: 1, duration: 1000, yoyo: true, hold: 700 });
    this.tweens.add({ targets: this.soleil, y: this.soleil.y - 110, duration: 2200, ease: 'Sine.easeOut' });
    await this.animer({ targets: this.noir, fillAlpha: 0, duration: 2000 });
    if (this.zzz) this.zzz.remove();
    // Debout !
    this.tweens.add({ targets: this.couverture, alpha: 0, duration: 200 });
    this.joueur.setTexture(textureJoueur(this, this.G));   // (v1.61) il rouvre les yeux
    await this.animer({ targets: this.joueur, angle: 0, x: 600, y: SOL_CHAMBRE - this.joueur.displayHeight / 2, duration: 450, ease: 'Back.easeOut' });
    this.joueur.setOrigin(0.5, 1).setY(SOL_CHAMBRE);
    this.onomatopee(600, SOL_CHAMBRE - 140, 'Debout !', '#f3d98a');
    await this.travauxDeLaNuit();
    // L'armure a pu changer de côté pendant la nuit.
    if (!(this.G.nouvellesPieces || []).length && this.G.armure.length) await this.changerCote(coteArmure(this.G));
    // Un messager (Confrérie ou Main Noire), avec une pièce de l'armure et l'arme d'un royaume libéré.
    for (const n of this.G.nouvellesPieces || []) {
      await this.attendre(500);
      if (this.fini) return;
      await this.messager(n);
    }
    this.annoncerMatin();
    await this.attendre(800);
    if (this.fini) return;
    await this.attendreSuite('▶ Clique pour sortir dans la rue');
    if (this.fini) return;
    await this.marcher(this.joueur, 1020, 3);
    this.partir('Rue');   // (v0.65 : on sort dans la rue, l'arche mène au marché)
  }

  ronfler() {
    const lettre = () => {
      const z = this.add.text(380 + Math.random() * 20, SOL_CHAMBRE - 120, 'z', style(18 + Math.random() * 10, '#c8d0f0', { fontStyle: 'bold' })).setDepth(7);
      this.tweens.add({ targets: z, x: z.x + 40, y: z.y - 70, alpha: 0, duration: 1800, onComplete: () => z.destroy() });
    };
    lettre();
    this.zzz = this.time.addEvent({ delay: 700, loop: true, callback: lettre });
  }

  // Le parchemin du bilan : ce que la journée a donné.
  afficherBilan(b) {
    const c = this.carteBilan = this.add.container(0, -440).setDepth(8);
    const G = this.G;
    const dette = G.prets.reduce((a, p) => a + p.restant, 0);
    const echeance = G.prets.reduce((a, p) => a + Math.min(p.parJour, p.restant), 0);
    const h = dette ? 408 : 348;
    c.add(this.add.image(760, 50 + h / 2, panneauHD(this, 330, h)).setScale(2));
    c.add(this.add.text(760, 86, `Fin du jour ${b.jour}`, style(26, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
    const lignes = [
      ['Clients servis', b.servis],
      ['Retours de mission', b.retours],
      ['Disparus', b.morts],
      ['Réputation', arrondi(b.reputation)],
    ];
    lignes.forEach(([nom, valeur], i) => {
      c.add(this.add.text(618, 116 + i * 28, nom, style(17, '#4a2e18')));
      c.add(this.add.text(902, 116 + i * 28, String(valeur), style(17, '#3b2410', { fontStyle: 'bold' })).setOrigin(1, 0));
    });
    // La jauge lumière ⟷ ombre, en petit : une barre, et le palier en mot
    if (b.jauge !== undefined) {
      const yj = 116 + lignes.length * 28 + 4;
      c.add(this.add.text(618, yj, 'Lumière / ombre', style(17, '#4a2e18')));
      c.add(this.add.text(902, yj, b.palier, style(15, b.jauge > 0 ? '#9a7a10' : b.jauge < 0 ? '#5a3a8a' : '#5a3a20', { fontStyle: 'bold italic' })).setOrigin(1, 0));
      c.add(barreJauge(this, 760, yj + 30, 284, b.jauge));
    }
    const signe = b.gain >= 0 ? '+' : '−';
    c.add(this.add.rectangle(760, 286, 290, 2, 0x8a6a3a));
    c.add(this.add.text(618, 296, 'Bénéfice du jour', style(18, '#3b2410', { fontStyle: 'bold' })));
    c.add(this.add.text(902, 296, `${signe}${Math.abs(b.gain)} p.`, style(19, b.gain >= 0 ? '#2f7a2a' : '#a03030', { fontStyle: 'bold' })).setOrigin(1, 0));
    let y = 332;
    if (dette) {
      // Le rappel de la dette : ce qui reste à rembourser, et ce que la banque prélève cette nuit
      const fond = this.add.rectangle(760, y + 26, 296, 54, 0xa03030, 0.14).setStrokeStyle(2, 0xa03030, 0.6);
      c.add(fond);
      c.add(this.add.text(618, y + 4, `Dette : ${dette} p.`, style(17, '#8a1a1a', { fontStyle: 'bold' })));
      const apres = G.argent - echeance;
      c.add(this.add.text(618, y + 28, apres < 0
        ? `Cette nuit : −${echeance} p. → ${apres} p. (faillite à ${SEUIL_FAILLITE})`
        : `Cette nuit, la banque prélève −${echeance} p.`, style(14, '#8a1a1a', { fontStyle: apres < 0 ? 'bold' : 'normal' })));
      this.tweens.add({ targets: fond, alpha: 0.4, duration: 700, yoyo: true, repeat: -1 });
      y += 64;
    }
    const mot = b.gain > 0 && !b.morts ? 'Une bonne journée de travail !'
      : b.gain > 0 ? 'Une bonne journée... malgré les pertes.'
        : 'Une dure journée. Demain sera meilleur.';
    c.add(this.add.text(760, y + 6, mot, style(16, '#5a3a20', { fontStyle: 'italic' })).setOrigin(0.5));
    const clic = this.add.text(760, y + 34, '▶ Clique pour dormir', style(15, '#7a4a20', { fontStyle: 'bold italic' })).setOrigin(0.5);
    c.add(clic);
    this.tweens.add({ targets: clic, alpha: 0.45, duration: 700, yoyo: true, repeat: -1 });
    this.tweens.add({ targets: c, y: 0, duration: 600, ease: 'Back.easeOut' });
  }

  attendreClicSansBoite() {
    return new Promise(resoudre => this.time.delayedCall(500, () => this.input.once('pointerdown', resoudre)));
  }

  // La nuit : échéances, salaires, atelier, nouveau jour... (une seule fois).
  // Les ouvriers sont passés pendant la nuit : la chambre change sous nos yeux, et on dit ce
  // qui a été installé ailleurs.
  async travauxDeLaNuit() {
    const finis = this.G.travauxFinis || [];
    if (!finis.length || this.fini) return;
    await this.attendre(500);
    if (finis.includes('chambre')) {
      const n = niveauAmelioration(this.G, 'chambre');
      for (const [image, cle] of [[this.lit, litHD(this, n)], [this.couverture, couvertureHD(this, n)], [this.chevet, chevetHD(this, n)], [this.tapis, tapisHD(this, n)]]) {
        const poussiere = this.add.image(image.x + image.displayWidth / 2 * (image.originX === 0 ? 1 : 0), image.y - image.displayHeight / 2, 'halo')
          .setTint(0xfff0c0).setScale(3).setAlpha(0).setDepth(7).setBlendMode(Phaser.BlendModes.ADD);
        this.tweens.add({ targets: poussiere, alpha: 0.8, duration: 250, yoyo: true, onYoyo: () => image.setTexture(cle), onComplete: () => poussiere.destroy() });
      }
      await this.attendre(600);
    }
    const noms = finis.map(c => `${AMELIORATIONS[c].nom.toLowerCase()} (${AMELIORATIONS[c].niveaux[niveauAmelioration(this.G, c)]})`);
    this.onomatopee(480, 110, 'Les ouvriers ont fini !', '#f3d98a');
    const texte = this.add.text(480, 150, noms.join(' · '), style(16, '#fff4dc', { fontStyle: 'bold italic', stroke: '#1a0e06', strokeThickness: 4, align: 'center', wordWrap: { width: 700 } }))
      .setOrigin(0.5).setDepth(8);
    await this.attendre(2200);
    this.tweens.add({ targets: texte, alpha: 0, duration: 400, onComplete: () => texte.destroy() });
    this.G.travauxFinis = [];
  }

  passerLaNuit() {
    if (this.nuitPassee) return;
    this.nuitPassee = true;
    nuit(this.G);
    // ce que le messager apportera ce matin n'est pas encore sur le mannequin ni au mur
    const nouv = this.G.nouvellesPieces || [];
    if (nouv.length) {
      this.dessinerArmure(this.G.armure.filter(id => !nouv.some(n => n.piece === id)));
      this.dessinerArmes((this.G.armesLegendaires || []).filter(id => !nouv.some(n => n.arme === id)));
    }
    if (this.G.faillite) Sauvegarde.supprimer();
    else Sauvegarde.maintenant(this.G, 'Marche');
  }

  dessinerArmure(possedees) {
    if (this.mannequin) this.mannequin.destroy();
    if (this.texteArmure) this.texteArmure.destroy();
    this.mannequin = null; this.texteArmure = null;
    // (v0.58) Pas de mannequin tant que Garrick ne l'a pas apporté (à la première pièce d'armure ;
    // les anciennes parties qui ont déjà des pièces l'ont, bien sûr)
    if (!this.G.mannequin && !possedees.length) return;
    const cote = this.coteAffiche || coteArmure(this.G);
    this.mannequin = dessinerMannequin(this, 790, SOL_CHAMBRE, possedees, 4, cote).setDepth(2);
    if (possedees.length) {
      this.texteArmure = this.add.text(790, SOL_CHAMBRE + 14, `${NOMS_ARMURE[cote]} · ${possedees.length} / ${ARMURE.length}`,
        style(11, '#f3d98a', { fontStyle: 'italic', stroke: '#2a1a10', strokeThickness: 3 })).setOrigin(0.5, 0).setDepth(2);
    }
  }

  // Toc toc : le messager encapuchonné apporte une pièce de l'armure. La première fois, il
  // raconte la légende du champion.
  async messager({ piece, arme, royaume, cote = 'clair', scelle, avertit }) {
    // (v0.61) une partie d'avant, à l'armure déjà complète : l'arme du royaume arrive seule
    if (!piece) return this.livrerArme(arme, royaume, cote === 'sombre');
    if (!this.G.mannequin) { await this.offrirMannequin(); if (this.fini) return; }
    const sombre = cote === 'sombre';
    const p = pieceArmure(piece, cote);
    // La légende, la première fois de chaque côté.
    const premiere = sombre ? !this.G.legendeSombre : this.G.armure.indexOf(piece) === 0 || !this.G.legendeClaire;
    if (sombre) this.G.legendeSombre = true;
    else this.G.legendeClaire = true;
    await this.changerCote(cote);
    this.onomatopee(900, SOL_CHAMBRE - 160, sombre ? 'Tok... tok...' : 'Toc toc !', sombre ? '#ff6080' : '#fff4dc');
    const m = imageCorps(this, 1010, SOL_CHAMBRE, 'colporteur', 6).setTint(sombre ? 0x3a1a24 : 0x7a7aa8).setDepth(3);
    await this.marcher(m, 905, 4);
    const c = this.add.container(0, 0).setDepth(9);
    const hPanneau = premiere ? 290 : 220;
    const panneau = this.add.image(480, 210, panneauHD(this, 640, hPanneau)).setScale(2);
    c.add(panneau);
    const haut = premiere ? 78 : 112;
    c.add(this.add.text(480, haut, sombre ? 'Un messager de la Main Noire' : 'Un messager de la Confrérie du Dernier Rempart',
      style(17, sombre ? '#7a1a2a' : '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
    c.add(this.add.image(220, haut + 70, iconeObjet(this, sombre ? piece + '_sombre' : piece)).setScale(5));
    c.add(this.add.text(275, haut + 30, p.nom, style(17, '#7a5a10', { fontStyle: 'bold' })));
    c.add(this.add.text(275, haut + 56, p.texte, style(13, '#5a3a20', { fontStyle: 'italic', wordWrap: { width: 500 } })));
    const ouvre = `Tes aventuriers ont libéré ${ROYAUMES[royaume].nom.replace(/^(Le|La|Les) /, m => m.toLowerCase())}.`;
    let message = premiere ? (sombre ? LEGENDE_SOMBRE : LEGENDE_ARMURE)
      : sombre ? `« ${ouvre} La Main Noire te cède une pièce de plus. Elle a un prix, comme tout : ne la perds pas. »`
        : `« ${ouvre} La Confrérie te confie une pièce de plus pour le champion. Garde-la bien. »`;
    if (arme) message += premiere ? `\nEt avec elle, une arme légendaire : ${armeLegendaire(arme).nom}. ${ouvre}`
      : `\nEt avec elle, l'arme légendaire du royaume : ${armeLegendaire(arme).nom}.`;
    if (avertit && !scelle) {
      const serment = sermentDe(this.G), pal = palierCamp(this.G);
      message += `\nPlus qu'une pièce, et l'armure sera complète : ton camp sera scellé pour de bon. ` + (serment ? `Tu as juré ${serment === 'bien' ? 'à la Confrérie' : 'aux Bannis'} : c'est ce serment qui sera scellé.`
        : pal > 0 ? "Aujourd'hui, ta balance penche vers la lumière." : pal < 0 ? "Aujourd'hui, ta balance penche vers l'ombre." : "Aujourd'hui, tu es entre les deux, sans serment : si tu le restes, ce ne sera ni la lumière, ni l'ombre...");
    }
    if (scelle) {
      message += scelle === 'mal' ? "\nL'armure est complète. Ton camp est scellé : l'ombre. Il n'y aura plus de retour en arrière."
        : scelle === 'neutre' ? "\nL'armure est complète. Tu n'as juré à personne, et ta balance n'a penché d'aucun côté. Ni la lumière, ni l'ombre : l'armure attend quelqu'un d'autre..."
        : "\nL'armure est complète. Ton camp est scellé : la lumière. Il n'y aura plus de retour en arrière.";
    }
    const texteMsg = this.add.text(185, haut + 110, message, style(13, '#3b2410', { wordWrap: { width: 590 }, lineSpacing: 3 }));
    c.add(texteMsg);
    // (audit v0.61) un long message (avant-dernière pièce + arme) agrandit le parchemin vers le bas
    let basClique = premiere ? 345 : 312;
    const bas = texteMsg.y + texteMsg.height + 22, basPanneau = 210 + hPanneau / 2;   // (la texture fait la moitié, affichée ×2)
    if (bas > basPanneau - 6) {
      const h = hPanneau + Math.ceil(bas - basPanneau + 10);
      panneau.setTexture(panneauHD(this, 640, h)).setY(210 - hPanneau / 2 + h / 2);
      basClique = bas;
    }
    c.add(this.add.text(780, basClique, '▶ clique', style(12, '#8a6a4a', { fontStyle: 'italic' })).setOrigin(1, 0.5));
    c.setAlpha(0);
    await this.animer({ targets: c, alpha: 1, duration: 300 });
    await this.attendreClicSansBoite();
    if (this.fini) return;
    c.destroy();
    // Le grand moment : la pièce s'élève au milieu de la chambre, dans un faisceau de lumière.
    creerHalo(this); creerObjetsHD(this);
    const teinte = sombre ? 0xff3060 : 0xffe080;
    const voile = this.add.rectangle(480, 270, 960, 540, sombre ? 0x14000a : 0x0a0614, 0).setDepth(7.5);
    const halo = this.add.image(480, 220, 'halo').setScale(0).setTint(teinte).setBlendMode(Phaser.BlendModes.ADD).setDepth(7.6);
    const rayons = this.add.graphics().setPosition(480, 220).setScale(0).setDepth(7.6).setBlendMode(Phaser.BlendModes.ADD);
    for (let k = 0; k < 14; k++) {
      const a = k / 14 * Math.PI * 2;
      rayons.fillStyle(teinte, 0.22).fillTriangle(0, 0, Math.cos(a - 0.07) * 360, Math.sin(a - 0.07) * 360, Math.cos(a + 0.07) * 360, Math.sin(a + 0.07) * 360);
    }
    const icone = this.add.image(905, SOL_CHAMBRE - 90, iconeObjet(this, sombre ? piece + '_sombre' : piece)).setScale(3).setDepth(8);
    this.animer({ targets: voile, fillAlpha: 0.65, duration: 500 });
    this.tweens.add({ targets: rayons, scale: 1, duration: 900, ease: 'Back.easeOut' });
    this.tweens.add({ targets: rayons, angle: 360, duration: 14000, repeat: -1 });
    this.tweens.add({ targets: halo, scale: 4.5, duration: 900 });
    await this.animer({ targets: icone, x: 480, y: 220, scale: 8, duration: 1100, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: icone, y: 210, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.cameras.main.flash(300, sombre ? 160 : 255, sombre ? 20 : 240, sombre ? 60 : 180);
    for (let k = 0; k < 24; k++) {
      const e = this.add.image(480, 220, 'eclat').setScale(2.5).setTint(teinte).setDepth(8.1);
      const a = k / 24 * Math.PI * 2;
      this.tweens.add({ targets: e, x: 480 + Math.cos(a) * 220, y: 220 + Math.sin(a) * 150, alpha: 0, angle: 180, duration: 1000, ease: 'Quad.easeOut', onComplete: () => e.destroy() });
    }
    const n = this.G.armure.indexOf(piece) + 1;
    const titre = this.add.text(480, 360, `✦ ${p.nom} ✦`, style(28, sombre ? '#ff90a8' : '#ffe8a0', { fontStyle: 'bold', stroke: '#1a0a06', strokeThickness: 6 })).setOrigin(0.5).setDepth(8.2).setScale(0);
    const sous = this.add.text(480, 398, `Pièce ${n} / ${ARMURE.length} de ${sombre ? "l'Armure de la Nuit Éternelle" : "l'Armure du Dernier Rempart"}` +
      ((this.G.piecesAVenir || []).length ? `\nLe messager reviendra demain : encore ${this.G.piecesAVenir.length} pièce${this.G.piecesAVenir.length > 1 ? 's' : ''} promise${this.G.piecesAVenir.length > 1 ? 's' : ''}.` : ''),
      style(15, '#fff4dc', { fontStyle: 'italic', align: 'center', stroke: '#1a0a06', strokeThickness: 4 })).setOrigin(0.5, 0).setDepth(8.2).setAlpha(0);
    this.tweens.add({ targets: titre, scale: 1, duration: 500, ease: 'Back.easeOut' });
    this.tweens.add({ targets: sous, alpha: 1, duration: 500, delay: 300 });
    await this.attendre(900);
    await this.attendreClicSansBoite();
    if (this.fini) return;
    // La pièce rejoint le mannequin.
    this.tweens.killTweensOf(icone);
    this.tweens.add({ targets: [voile], fillAlpha: 0, duration: 500 });
    this.tweens.add({ targets: [halo, rayons, titre, sous], alpha: 0, duration: 400, onComplete: () => { halo.destroy(); rayons.destroy(); titre.destroy(); sous.destroy(); } });
    await this.animer({ targets: icone, x: 790, y: SOL_CHAMBRE - 100, scale: 3, duration: 700, ease: 'Sine.easeInOut' });
    icone.destroy();
    voile.destroy();
    this.dessinerArmure(this.G.armure.slice(0, this.G.armure.indexOf(piece) + 1));
    if (sombre) this.cameras.main.flash(300, 120, 0, 30);
    else this.cameras.main.flash(250, 255, 230, 150);
    if (arme && !this.fini) await this.livrerArme(arme, royaume, sombre, m);
    if (this.fini) return;
    await this.marcher(m, 1020, 3);
    m.destroy();
  }

  // (v0.61) L'arme légendaire du royaume libéré : elle s'élève, puis rejoint la panoplie au mur.
  async livrerArme(id, royaume, sombre, messager = null) {
    const a = armeLegendaire(id);
    if (!a) return;
    let m = messager;
    if (!m) {
      this.onomatopee(900, SOL_CHAMBRE - 160, 'Toc toc !', '#fff4dc');
      m = imageCorps(this, 1010, SOL_CHAMBRE, 'colporteur', 6).setTint(sombre ? 0x3a1a24 : 0x7a7aa8).setDepth(3);
      await this.marcher(m, 905, 4);
    }
    creerHalo(this);
    const voile = this.add.rectangle(480, 270, 960, 540, 0x0a0614, 0).setDepth(7.5);
    const halo = this.add.image(480, 220, 'halo').setScale(0).setTint(0xfff0c0).setBlendMode(Phaser.BlendModes.ADD).setDepth(7.6);
    const icone = this.add.image(905, SOL_CHAMBRE - 110, 'arme_' + id).setScale(echelleArme(id, 2)).setDepth(8);
    this.animer({ targets: voile, fillAlpha: 0.6, duration: 400 });
    this.tweens.add({ targets: halo, scale: 3.5, duration: 700 });
    Son.jouer('tresor');
    await this.animer({ targets: icone, x: 480, y: 200, scale: echelleArme(id, 6), duration: 900, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: icone, y: 190, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const titre = this.add.text(480, 316, `— ${a.nom} —`, style(26, '#ffe8a0', { fontStyle: 'bold', stroke: '#1a0a06', strokeThickness: 6 })).setOrigin(0.5).setDepth(8.2).setScale(0);
    const sous = this.add.text(480, 350, `Arme légendaire : ${ROYAUMES[royaume].nom}\n${a.texte}\nAccrochée au mur, elle fera parler d'elle : un peu plus de curieux au comptoir.`,
      style(14, '#fff4dc', { fontStyle: 'italic', align: 'center', stroke: '#1a0a06', strokeThickness: 4, wordWrap: { width: 640 } })).setOrigin(0.5, 0).setDepth(8.2).setAlpha(0);
    this.tweens.add({ targets: titre, scale: 1, duration: 450, ease: 'Back.easeOut' });
    this.tweens.add({ targets: sous, alpha: 1, duration: 500, delay: 250 });
    await this.attendre(800);
    await this.attendreClicSansBoite();
    if (this.fini) return;
    this.tweens.killTweensOf(icone);
    this.tweens.add({ targets: voile, fillAlpha: 0, duration: 400 });
    this.tweens.add({ targets: [halo, titre, sous], alpha: 0, duration: 350, onComplete: () => { halo.destroy(); titre.destroy(); sous.destroy(); } });
    const n = this.G.armesLegendaires.indexOf(id);
    const [x, y] = placeArmeAuMur(n);
    await this.animer({ targets: icone, x, y, scale: echelleArme(id, 1.6), duration: 650, ease: 'Sine.easeInOut' });
    icone.destroy(); voile.destroy();
    this.dessinerArmes(this.G.armesLegendaires.slice(0, n + 1));
    this.cameras.main.flash(200, 255, 230, 150);
    if (!messager) { await this.marcher(m, 1020, 3); m.destroy(); }
  }

  // La panoplie : les armes légendaires accrochées au mur, au-dessus du coffre et du tapis
  dessinerArmes(ids) {
    (this.armesAuMur || []).forEach(o => o.destroy());
    this.armesAuMur = ids.map((id, i) => {
      const [x, y] = placeArmeAuMur(i);
      return this.add.image(x, y, 'arme_' + id).setScale(echelleArme(id, 1.6)).setDepth(1.36);
    });
  }

  // (v0.58) Le matin de la première pièce d'armure, Garrick repasse, un vieux mannequin de bois
  // sur l'épaule : il l'installe dans ta chambre et t'explique qu'il faudra retrouver toutes les
  // pièces de l'armure du champion, une par royaume libéré.
  async offrirMannequin() {
    this.G.mannequin = true;
    const voix = { nom: 'Garrick', race: 'humain' };
    this.onomatopee(900, SOL_CHAMBRE - 160, 'Toc toc !', '#fff4dc');
    const g = imageCorps(this, 1020, SOL_CHAMBRE, 'mentor', 6).setDepth(3);
    this.ombreSol(g);
    const porte = dessinerMannequin(this, 0, 0, [], 4).setDepth(3.1).setAngle(-12);
    const suivre = () => porte.active && porte.setPosition(g.x + (g.flipX ? 10 : -10), g.y - g.displayHeight * 0.35);
    this.events.on('update', suivre);
    this.events.once('shutdown', () => this.events.off('update', suivre));   // (audit v0.59 : si on passe pendant qu'il marche)
    Son.jouer('voix', { personne: voix, ton: 'bonjour' });
    await this.marcher(g, 880, 4);
    this.events.off('update', suivre);
    // il pose le mannequin à sa place, près de la fenêtre
    Son.jouer('poser');
    await this.animer({ targets: porte, x: 790, y: SOL_CHAMBRE, angle: 0, duration: 500, ease: 'Quad.easeOut' });
    this.cameras.main.shake(120, 0.003);
    this.regarderVers(g, this.joueur); this.regarderVers(this.joueur, g);
    const parler = async (texte, ton, emotion, image = null) => {
      const c = this.add.container(0, 0).setDepth(9);
      c.add(this.add.image(480, 92, panneauHD(this, 700, 150)).setScale(2));
      c.add(this.add.text(160, 44, 'Garrick Cœur-de-Chêne', style(16, '#7a5a10', { fontStyle: 'bold' })));
      c.add(this.add.text(160, 68, `« ${texte} »`, style(14, '#3b2410', { wordWrap: { width: 640 }, lineSpacing: 3 })));
      c.add(this.add.text(800, 150, '▶ clique', style(12, '#8a6a4a', { fontStyle: 'italic' })).setOrigin(1, 0.5));
      Son.jouer('voix', { personne: voix, ton, duree: Math.min(2, 0.4 + texte.length * 0.012) });
      if (emotion) this.emotion(g, emotion);
      const bulle = image ? this.pensee(g, image, { echelle: 2.6 }) : null;
      await this.attendreClicSansBoite();
      if (bulle) this.fermerPensee(bulle);
      c.destroy();
    };
    await parler("Bien dormi ? Je passais par la Comté... et je t'ai apporté un vieil ami : le mannequin de mon ancien capitaine.", 'content', 'joie');
    if (this.fini) return;
    await parler(`L'armure du champion a été dispersée en ${ARMURE.length} pièces, aux quatre coins du monde. Chaque fois que tes aventuriers libéreront un royaume (cinq missions réussies dans chacune de ses contrées, et son drapeau flottera sur ta carte), on t'en rapportera une, avec l'arme légendaire de ce royaume.`, 'neutre', null, iconeObjet(this, ARMURE[0].id));
    if (this.fini) return;
    await parler("Trouve-les toutes, et habille ce mannequin, pièce après pièce. Le jour où l'armure sera complète, ton camp sera choisi pour de bon. Lumière ou ombre... à toi de voir.", 'inquiet', '!');
    if (this.fini) return;
    this.emotion(this.joueur, '♥');
    Son.jouer('voix', { personne: { nom: this.G.joueur.nom || 'toi', race: 'humain', feminin: this.G.joueur.feminin }, ton: 'merci' });
    porte.destroy();
    this.dessinerArmure([]);
    await parler("Tiens, justement : on frappe. Ce doit être la première pièce ! Je file, prends-en soin.", 'rire', 'joie');
    this.geste(this.joueur, 'salut');
    await this.marcher(g, 1040, 3);
    g.destroy();
  }

  // L'armure change de côté : elle se corrompt (vers l'ombre) ou se purifie (vers la lumière).
  async changerCote(cote) {
    if (cote === this.coteAffiche) return;
    const avant = this.coteAffiche;
    this.coteAffiche = cote;
    this.G.armureCoteVu = cote;
    const possedees = this.mannequin ? this.G.armure.filter(id => !(this.G.nouvellesPieces || []).some(n => n.piece === id)) : [];
    if (!avant || !possedees.length) return this.dessinerArmure(possedees);
    this.cameras.main.flash(500, cote === 'sombre' ? 80 : 255, 0, cote === 'sombre' ? 40 : 200);
    this.dessinerArmure(possedees);
    const t = this.add.text(790, SOL_CHAMBRE - 190, cote === 'sombre' ? "L'armure s'assombrit..." : "L'armure se purifie...",
      style(16, cote === 'sombre' ? '#ff6080' : '#fff4dc', { fontStyle: 'bold italic', stroke: '#2a1a10', strokeThickness: 4 })).setOrigin(0.5).setDepth(8);
    this.tweens.add({ targets: t, alpha: 0, y: t.y - 30, delay: 1500, duration: 800, onComplete: () => t.destroy() });
    await this.attendre(1200);
  }

  annoncerMatin() {
    const G = this.G;
    const t = this.add.text(480, 150, `Jour ${G.jour}`, style(56, '#f3d98a', { fontStyle: 'bold', stroke: '#2a1a10', strokeThickness: 8 }))
      .setOrigin(0.5).setDepth(9).setScale(0);
    this.tweens.add({ targets: t, scale: 1, duration: 400, ease: 'Back.easeOut' });
    const nouvelles = nouvellesDuMatin(G).slice(0, 3);
    this.add.text(480, 196, ['Direction le Marché des Mastres !', ...nouvelles].join('\n'),
      style(15, '#fff4dc', { align: 'center', stroke: '#2a1a10', strokeThickness: 4, lineSpacing: 4, wordWrap: { width: 760 } })).setOrigin(0.5, 0).setDepth(9);
    G.banniere = G.jour; // le « Jour N » est déjà annoncé
  }

  // « Passer ▶▶ » : la nuit passe quand même.
  passer() {
    if (this.fini) return;
    this.passerLaNuit();
    this.partir(this.G.faillite ? 'Faillite' : 'Rue');
  }

  partir(scene) {
    if (this.fini) return;
    // (v1.57) le matin du grand départ : la route, au lieu de la rue
    if (scene === 'Rue' && typeof departAujourdhui === 'function' && departAujourdhui(this.G)) scene = 'Voyage';
    this.fini = true;
    this.cameras.main.fadeOut(500);
    // (v0.99) le premier matin d'une nouvelle saison : la petite cinématique de passage, puis la rue
    const passage = scene === 'Rue' && typeof passageDeSaison === 'function' ? passageDeSaison(this.G) : null;
    // (v1.55, planche 63) cette nuit, ton chat a fait fuir un cambrioleur : le petit film d'abord
    const c = this.G.cambriolage;
    if (scene === 'Rue' && c && c.chat && c.jour === this.G.jour && !c.vu) { c.vu = true; this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Cambrioleur', { suite: scene, passage })); return; }
    this.cameras.main.once('camerafadeoutcomplete', () => (passage ? this.scene.start('Saison', { suite: scene, ...passage }) : this.scene.start(scene)));
  }
}

const SOL_CHAMBRE = 430;
