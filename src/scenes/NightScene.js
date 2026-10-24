// Chez toi. Le soir : bilan de la journée, lettres à accepter ou refuser, banque, atelier,
// bureau, et prévision des clients pour demain.
// Le matin (`matin`), en rentrant du marché : les mêmes lieux, avant d'ouvrir le comptoir.
class NightScene extends Phaser.Scene {
  constructor() { super('Nuit'); }

  init(data) {
    this.matin = !!(data && data.matin);
    this.fenetreFoyer = null;
    this.fenetreMoulin = null;   // (v1.38 : la fenêtre du chat d'un soir quitté par le menu bloquait les suivantes)
    this.menuProjets = null;   // (v1.31 : pareil pour le menu « Tes projets »)   // (v1.07 : une fenêtre du foyer d'une soirée quittée par le menu bloquait le coucher)
    // Phaser garde les données d'un démarrage à l'autre : sans ce ménage, le soir du jour 2
    // (lancé sans données) se croyait encore « le matin » — plus de bouton pour aller dormir.
    this.sys.settings.data = {};
  }

  create() {
    exclureScenes(this, 'Carte', 'Comptoir', 'Dodo');   // (v0.62)
    const G = this.G = window.GAME;
    // (v1.57) une partie rechargée en plein grand voyage : on reprend la route
    if (typeof enRoute === 'function' && enRoute(G)) { this.time.delayedCall(0, () => this.scene.start('Voyage')); return; }
    if (!this.matin) { preparerSoir(G); tirerGardeDuLendemain(G); }
    if (!this.matin) this.time.delayedCall(800, () => { const n = oublierPortraits(this.game); if (n && typeof noterJournal === 'function') noterJournal(`(${n} portraits oubliés)`); });   // (v0.96)   // (v0.65 : la garde de demain se tire dès ce soir, le chat la sent parfois)
    this.lieu = this.matin ? 'Maison' : 'Nuit';
    // (v1.32) le premier matin d'adulte : le miroir des 18 ans (une fois)
    if (this.matin && typeof miroirAFaire === 'function' && miroirAFaire(G)) {
      // (si un saut de temps a enjambé la veille, la fête est notée comme passée : le miroir vient quand même)
      if (!G.feteFaite) G.feteFaite = G.jour;
      this.time.delayedCall(700, () => miroirDes18Ans(this, () => this.annoncer && this.annoncer(`Te voilà, ${nomJoueur(G)}. Le miroir garde ton nouveau reflet.`)));
    }
    // (v1.32, planche 56 v2 validée) la veille des 18 ans, le soir : la fête à l'arrière-boutique
    if (!this.matin && typeof feteAFaire === 'function' && feteAFaire(G)) this.time.delayedCall(600, () => feteDes18Ans(this, () => {}));

    this.cameras.main.setBackgroundColor(this.matin ? '#2a1e12' : '#1e140c');
    this.cameras.main.fadeIn(500);
    // Le décor : l'arrière-boutique, à la lueur du luminaire (plus sombre le soir)
    creerInterieurHD(this);
    const murN = this.add.image(0, 0, murInterieur(this, 'murArriere', { poteaux: [272, 412], graine: 310 })).setOrigin(0).setScale(2).setTint(this.matin ? 0xb8946c : 0x7a5c44);
    const solN = this.add.image(0, 440, plancher(this, 'plancherArriere', { graine: 410 })).setOrigin(0).setScale(2).setTint(this.matin ? 0xc8a888 : 0x8a6c54);
    // (v1.32) la décoration choisie dans le carnet de la tapissière : c'est la même pièce, le matin et le soir
    const deco = typeof texturesDeco === 'function' ? texturesDeco(this, G) : null;
    if (deco && deco.mur) murN.setTexture(deco.mur).setTint(this.matin ? 0xd8c8b8 : 0x8a7868);
    if (deco && deco.sol) solN.setTexture(deco.sol).setTint(this.matin ? 0xe0d4c8 : 0x9a8a7a);
    vignette(this, 0.85, 0);
    poserLuminaire(this, 480, -40, niveauAmelioration(G, 'eclairage'), 0);
    this.add.text(480, 34, this.matin ? `Matin du jour ${G.jour} · chez toi` : `Soir du jour ${G.jour}`, style(30, '#f3d98a', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 5 })).setOrigin(0.5);
    boutonCarteMonde(this, 80, 44, { compact: true });   // (v0.93) la carte du monde, depuis la chambre
    // La dette, bien en vue en haut de l'écran
    if (G.prets.length) {
      const dette = G.prets.reduce((a, p) => a + p.restant, 0);
      const echeance = G.prets.reduce((a, p) => a + Math.min(p.parJour, p.restant), 0);
      const note = this.add.text(190, 40, `Dette : ${dette} p. · −${echeance} cette nuit`, style(15, '#8a1a1a', {
        fontStyle: 'bold', backgroundColor: '#ecdcb4', padding: { x: 10, y: 5 } })).setOrigin(0.5).setAngle(-2).setDepth(5);
      this.tweens.add({ targets: note, angle: 2, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    this.bourse = bourse(this, 846, 50, this.G.argent, { echelle: 1.5, taille: 19, aDroite: true });

    this.parchemin(20, 300, this.matin ? "Aujourd'hui" : 'Ta journée');
    this.parchemin(320, 640, 'Ta réserve');
    this.parchemin(660, 940, 'Les nouvelles');   // (v1.61) plus de lettres de commande : les nouvelles du bourg
    if (this.G.annonces.length) this.add.text(800, 108, '1 lettre acceptée = 1 client EN PLUS', style(12, '#8a3a1a', { fontStyle: 'bold italic' })).setOrigin(0.5);
    this.creerReserve(320, 640);
    this.creerPrevision(660, 940);

    // (v0.86) pas d'autre page pendant un fondu (« Dormir », « Ouvrir le comptoir ») : sinon elle s'ouvrait par-dessus la suivante
    const enFondu = () => this._transition && performance.now() - this._transition < 1500;
    const ouvrirPage = (page, donnees) => { if (enFondu()) return; this.scene.pause(); this.scene.launch(page, donnees); };
    const soireeAuBar = !this.matin && G.bar && G.bar.ce && G.bar.ce.jour === G.jour && G.bar.ce.mode === 'joue';   // (v1.16) la soirée jouée a pris tout le soir
    // (v1.57) à Pont-Royal, ce qui est resté dans la Comté (la rue, la porte dérobée, le notaire, l'orphelinat, le petit bar, l'étang) n'est pas à deux pas
    const comte = typeof villeActuelle !== 'function' || villeActuelle(G) === 'comte';
    const boutons = [
      ['Le bureau', () => ouvrirPage('Bureau', { retour: 'Nuit' })],
      ['La banque', () => this.ouvrirBanque()],
      [`L'atelier (${G.tresors.length})`, () => ouvrirPage('Atelier')],
      ...(this.matin || !comte ? [] : [['Se promener', () => { if (soireeAuBar) return this.annoncer('Ta soirée s’est passée au petit bar : il est trop tard pour te promener.'); ouvrirPage('Promenade'); }]]),
      ...(!this.matin && comte && marcheNoirCeSoir(G) ? [['La porte dérobée', () => ouvrirPage('MarcheNoir')]] : []),
      ...(!this.matin && comte && typeof rivalDe === 'function' && G.rival && G.rival.etat === 'aVendre' ? [['Chez le notaire', () => { if (enFondu()) return; lettreDuNotaire(this, () => { if (G.rival.etat !== 'aVendre') this.scene.restart({ matin: false }); }); }]] : []),   // (v1.11) la boutique d'à côté est à vendre
      ...(!this.matin && comte && typeof orphelinatOuvert === 'function' && orphelinatOuvert(G) ? [["L'orphelinat", () => { if (enFondu()) return; orphelinatDuSoir(this, () => this.tout()); }]] : []),   // (v1.12) la liste des courses, les améliorations
      ...(!this.matin && comte && typeof barOuvert === 'function' && barOuvert(G) ? [['Le petit bar', () => { if (enFondu()) return; barDuSoir(this, () => this.tout()); }]] : []),   // (v1.16) la soirée, l'équipe, les installations
      ...(!this.matin && typeof confrerieOuverte === 'function' && confrerieOuverte(G) ? [['La Confrérie', () => { if (enFondu()) return; confrerieDuSoir(this, () => this.tout()); }]] : []),   // (v1.28) le livre des dons
      ...(!this.matin && typeof repaireOuvert === 'function' && repaireOuvert(G) ? [['Le repaire', () => { if (enFondu()) return; repaireDuSoir(this, () => this.tout()); }]] : []),   // (v1.29) le livre noir
      ...(!this.matin && typeof etageOuvert === 'function' && etageOuvert(G) ? [["L'étage", () => { if (enFondu()) return; etageDuSoir(this, () => this.tout()); }]] : []),   // (v1.30) le grenier, le salon, l'appartement
      ...(this.matin
        ? [["L'arrière-boutique", () => ouvrirPage('Arriere', { retour: 'Nuit' })], ['Le marché', () => this.allerA('Marche')], ['Ouvrir le comptoir', () => this.ouvrirComptoir()]]
        : [['Aller dormir', () => this.dormir()]]),
    ];
    // (v1.45, la pêche) l'étang du Moulin, dès qu'on a une canne : l'aube le matin ; le soir, le jour (comptoir fermé tôt) ou la nuit
    if (comte && typeof aUneCanne === 'function' && aUneCanne(G)) boutons.splice(boutons.length - (this.matin ? 2 : 1), 0, ["L'étang", () => {
      if (enFondu()) return;
      Sauvegarde.maintenant(G, this.lieu);   // (v1.49 : le matin, c'est la maison qu'on recharge, pas le soir)
      this._transition = performance.now();
      this.cameras.main.fadeOut(400);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Peche', { plage: plageDePeche(G, this.matin), retour: this.matin ? 'NuitMatin' : 'NuitSoir' }));
    }]);
    // (v1.30) trop de boutons pour une rangée lisible : les projets (orphelinat, bar, Confrérie, repaire, étage, notaire)
    // se rangent derrière un seul bouton, qui ouvre leur liste
    const PROJETS = ["L'orphelinat", 'Le petit bar', 'La Confrérie', 'Le repaire', "L'étage", 'Chez le notaire'];
    const projets = boutons.filter(([t]) => PROJETS.includes(t));
    if (boutons.length > 8 && projets.length >= 2) {
      const i0 = boutons.findIndex(([t]) => PROJETS.includes(t));
      boutons.splice(0, boutons.length, ...boutons.filter(([t]) => !PROJETS.includes(t)));
      boutons.splice(i0, 0, [`Tes projets (${projets.length}) ▴`, () => this.listeProjets(projets, this.xBoutons[i0])]);
    }
    // (v1.40, planche 67) le didacticiel : ce qui n'est pas encore ouvert a son cadenas et dit quand il s'ouvrira ;
    // ce qui vient de s'ouvrir porte « NOUVEAU » et une vignette l'explique
    const CLES_SOIR = [['Le bureau', 'bureau'], ['La banque', 'banque'], ["L'atelier", 'atelier']];
    const neufs = typeof nouveautes === 'function' ? nouveautes(G) : [];
    for (const bt of boutons) {
      const k = CLES_SOIR.find(([t]) => bt[0].startsWith(t));
      if (!k || typeof lieuDebloque !== 'function') continue;
      const d = DEBLOCAGES[k[1]];
      if (!lieuDebloque(G, k[1])) { bt[0] = k[0]; bt[1] = () => { Son.jouer('refus'); this.annoncer(`${d.nom} s'ouvrira ${d.quand === 'ta 1re trouvaille' ? 'avec ta première trouvaille' : d.quand}.`); }; bt[2] = { ferme: d }; }
      else if (neufs.includes(k[1])) { bt[2] = { neuf: k[1] }; const agir = bt[1]; bt[1] = () => { lieuVu(k[1]); agir(); }; }
    }
    // (v1.43, planche 70) le matin qui suit les travaux qui font changer de rang : les boutons ont changé avec la maison
    if (this.matin && typeof rangInterface === 'function') {
      const r = rangInterface(this), avant = G.rangInterfaceVu;
      G.rangInterfaceVu = r;
      const TEXTES = [null, 'Chêne et coins de laiton : tes boutons ont pris du galon, comme ta façade.',
        'Les premières pierres, polies en cabochon : une couleur pour chaque chose. Saphir pour toi, topaze pour le client, émeraude pour ta réserve, rubis pour tes actions, améthyste pour l’étrange.',
        'Acajou et or : les pierres sont maintenant taillées et serties.',
        'Ébène et or : tes pierres scintillent. Une demeure, enfin !'];
      let vignette = null;
      if (avant === undefined && G.jour > 1) vignette = ['NOUVEAU', 'Tes boutons suivent ta maison', `Ta maison est au rang « ${RANGS[r].nom} ». Embellis-la : sapin brut, puis chêne, puis des pierres précieuses (saphir : toi, topaze : le client, émeraude : ta réserve, rubis : tes actions).`];
      else if (avant !== undefined && r > avant) vignette = ['TA MAISON S’EMBELLIT', RANGS[r].nom, TEXTES[r]];
      if (vignette) this.time.delayedCall(1100, () => { if (this.scene.isActive()) vignetteGuide(this, vignette[0], vignette[1], vignette[2], { y: 92, prof: 60, duree: 7000 }); });
    }
    G.nouveautesAnnoncees = G.nouveautesAnnoncees || { ...(G.nouveautesVues || {}) };
    const aAnnoncer = neufs.filter(c => !G.nouveautesAnnoncees[c]);
    if (aAnnoncer.length) this.time.delayedCall(1000, () => { if (!this.scene.isActive()) return; aAnnoncer.forEach((c, i) => { G.nouveautesAnnoncees[c] = true; vignetteGuide(this, 'NOUVEAU', DEBLOCAGES[c].nom, DEBLOCAGES[c].texte, { y: 92, prof: 60, duree: 5000 }); }); });
    // (v1.43) chaque bouton prend une largeur selon son libellé : les longs (« Ouvrir le comptoir ») ne s'écrivent plus en tout petit
    const poids = boutons.map(([t]) => t.length + 8), somme = poids.reduce((a, b) => a + b, 0);
    let cumul = 20;
    const places = poids.map(p => { const l = 920 * p / somme, c = cumul + l / 2; cumul += l; return [c, l]; });
    this.xBoutons = places.map(([c]) => c);
    this.tagsNeufs = [];
    boutons.forEach(([texte, action, marque], i) => {
      const [cx, l] = places[i], largeur = l + 4;   // (largeur - 16 = la plaque : 12 px entre deux boutons)
      const b = creerBouton(this, cx, 505, largeur - 16, texte, action);
      if (marque && marque.ferme) {
        b.fond.setTint(0x6a6a6a); b.label.setAlpha(0.5);
        this.add.image(b.label.x - b.label.width / 2 - 14, b.label.y, texCadenas(this)).setScale(2);
        this.add.text(b.fond.x, b.fond.y - 34, marque.ferme.quand, style(12, '#e8dcc0', { fontStyle: 'bold italic', backgroundColor: '#2a1a10e0', padding: { x: 6, y: 2 } })).setOrigin(0.5);
      } else if (marque && marque.neuf) {
        const tag = this.add.text(b.fond.x, b.fond.y - 34, 'NOUVEAU', style(12, '#14181e', { fontStyle: 'bold', backgroundColor: '#8ab0d0', padding: { x: 8, y: 2 } })).setOrigin(0.5);
        tag.cleNeuve = marque.neuf; (this.tagsNeufs = this.tagsNeufs || []).push(tag);   // (v1.61 : effacé au retour du lieu)
        this.tweens.add({ targets: tag, y: tag.y - 3, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
      // Le bouton pour avancer (aller dormir le soir, ouvrir le comptoir le matin) se voit bien : il luit (planche 68).
      if (i === boutons.length - 1) {
        b.label.setColor('#ffe9a0');
        lueurBouton(this, b, largeur - 16);
      }
    });
    this.events.off('resume', this.tout, this);
    this.events.on('resume', this.tout, this);
    this.events.off('resume', this.effacerNeufs, this);
    this.events.on('resume', this.effacerNeufs, this);
    this.tout();
    afficherStatutSauvegarde(this, 940, 60, 1);
    if (!this.matin) this.time.delayedCall(600, () => conseilGarrick(this, 'soir'));
    if (!this.matin && typeof midiDuBar === 'function') { const m = midiDuBar(G); if (m) this.time.delayedCall(900, () => this.annoncer(m)); }   // (v1.16) la terrasse, à midi
    // (v0.90) le soir du Carrefour (ou du parjure) : deux visiteurs frappent à la porte
    if (!this.matin) this.time.delayedCall(700, () => this.carrefourEnAttente());
    // (v1.35) le soir où ton chat boude sa gamelle et gratte à la porte : l'aventure du Vieux Moulin
    if (!this.matin && typeof soireeDuMoulin === 'function') this.time.delayedCall(1300, () => { if (this.scene.isActive() && !(this._transition && performance.now() - this._transition < 1500)) soireeDuMoulin(this) || (typeof soireeDeLaConversation === 'function' && soireeDeLaConversation(this)) || (typeof soireeDuParrain === 'function' && soireeDuParrain(this)) || (typeof cadeauCanneDuChat === 'function' && cadeauCanneDuChat(this)); });   // (v1.45 : la canne du grand-père, pour qui a déjà eu la conversation)
  }

  // (v0.90) Le soir du Carrefour (ou du parjure) : deux visiteurs frappent à la porte. Renvoie vrai si la
  // scène s'ouvre (le soir ne compte comme « vu » qu'une fois qu'elle s'est vraiment ouverte).
  carrefourEnAttente() {
    const G = this.G, lo = etatLO(G);
    if (this.matin || !(lo.carrefour || lo.parjure) || lo.soirVu === G.jour || !this.scene.isActive() || enTransition(this)) return false;
    lo.soirVu = G.jour;
    this.scene.pause();
    this.scene.launch('Carrefour', { retour: 'Nuit' });
    return true;
  }

  allerA(scene) {
    if (enTransition(this)) return;
    Sauvegarde.maintenant(this.G, scene === 'Marche' ? 'Marche' : this.lieu);
    this.cameras.main.fadeOut(300);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(scene));
  }

  // Le matin : on sauvegarde, puis la file d'attente du jour se forme.
  ouvrirComptoir() {
    if (this._transition && performance.now() - this._transition < 1500) return;
    Sauvegarde.maintenant(this.G, 'Maison');
    commencerJournee(this);
  }

  // Dormir : la fin de la journée. Ton personnage va se coucher (une petite scène, avec le
  // bilan du jour), la nuit passe, et au matin, direction le Marché des Mastres.
  dormir() {
    if (this.carrefourEnAttente()) return;   // (v0.97) avant le verrou de transition, qui le faisait sauter
    const G = this.G;
    if (typeof foyerVide === 'function' && foyerVide(G) && this.froidAccepte !== G.jour && !(typeof banquetDu === 'function' && banquetDu(G))) return this.confirmerFoyer();   // (v1.05, planche 24 B ; avant le verrou de transition)
    if (enTransition(this)) return;   // (v0.90) on ne s'endort pas avant d'avoir ouvert la porte
    const bilan = { jour: G.jour, servis: G.journal.servis, retours: G.journal.retours, morts: G.journal.morts,
      gain: G.argent - G.argentDebutJour, reputation: G.reputation, jauge: jaugeCamp(G), palier: nomPalierCamp(G) };
    this.cameras.main.fadeOut(500);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Dodo', { bilan }));
  }

  // (v1.05, planche 24 B) En Givre, au coucher, sans bûche dans la cheminée : on prévient avant de dormir
  confirmerFoyer() {
    if (this.fenetreFoyer) return;
    const G = this.G, bois = G.materiaux.bois || 0;
    const c = this.fenetreFoyer = this.add.container(0, 0).setDepth(40);
    c.add(this.add.rectangle(480, 270, 960, 540, 0x0a0604, 0.55).setInteractive());
    c.add(this.add.image(480, 300, panneauHD(this, 520, 250)).setScale(2));
    c.add(this.add.text(480, 206, 'Le foyer est vide', style(22, '#a02020', { fontStyle: 'bold' })).setOrigin(0.5));
    const b = this.add.graphics(); b.fillStyle(0x6a3a1a).fillRoundedRect(-16, -6, 32, 12, 5).fillStyle(0xc8501e).fillEllipse(13, 0, 7, 11).fillStyle(0xa02020).fillRect(-18, -1, 36, 3);
    b.setPosition(480, 240).setAngle(-28); c.add(b);
    c.add(this.add.text(480, 296, `Dehors, il gèle. Sans une bûche dans la cheminée, tu te réveilleras fatigué${eJ(G)} (un client de moins demain). Deux nuits de suite : tu tomberas malade, et le comptoir n'ouvrira qu'à midi.`, style(14, '#3b2410', { align: 'center', wordWrap: { width: 470 }, lineSpacing: 3 })).setOrigin(0.5));
    const fermer = () => { c.destroy(); this.fenetreFoyer = null; };
    const b1 = creerBouton(this, 360, 372, 230, bois > 0 ? 'Mettre une bûche (1 planche)' : 'Plus une planche de bois', () => {
      const err = allumerFeu(G);
      if (err) return this.annoncer(err);
      Son.jouer('glisse'); fermer(); this.tout(); this.dormir();
    });
    if (!bois) { b1.fond.setAlpha(0.5); b1.label.setAlpha(0.6); }
    const b2 = creerBouton(this, 600, 372, 210, 'Dormir quand même', () => { this.froidAccepte = G.jour; fermer(); this.dormir(); });
    c.add([b1.fond, b1.label, b2.fond, b2.label]);
    if (!bois) c.add(this.add.text(480, 410, "Thorgal vend du bois à la forge (au marché, demain matin).", style(11, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5));
  }

  parchemin(x1, x2, titre) {
    this.add.image((x1 + x2) / 2, 270, panneauHD(this, x2 - x1, 400)).setScale(2);
    this.add.text((x1 + x2) / 2, 90, titre, style(20, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5);
  }

  // Tout ce qui change quand on achète, emprunte ou répond à une lettre.
  tout() {
    // (v1.61 : appelée par une page qui revient alors que le soir n'a pas encore été ouvert, ou déjà fermé ;
    // pendant create(), la scène n'est pas encore « active » : on regarde donc son état)
    const etat = this.sys.settings.status;
    if (!this.G || etat < Phaser.Scenes.CREATING || etat >= Phaser.Scenes.SHUTDOWN) return;
    Sauvegarde.planifier(this.G, this.lieu);
    this.majArgent();
    this.majJournee(20, 300);
    this.majLettres(660, 940);
    this.majPrevision();
  }

  // --- La journée ---

  majJournee(x1, x2) {
    if (!this.matin) return this.majJourneeSoir(x1, x2);
    const G = this.G;
    const j = G.journal;
    if (this.journee) this.journee.destroy();
    const c = this.journee = this.add.container(0, 0);
    const gain = G.argent - G.argentDebutJour;
    const p = prevision(G, G.jour);
    const lignes = this.matin ? [
      `Clients attendus : ${p.min} à ${p.max}${p.annonces ? ` + ${p.annonces} par lettre` : ''}`,
      ...(G.annonces.some(a => a.acceptee && a.jour === G.jour) ? [`Commandes par lettre : ${G.annonces.filter(a => a.acceptee && a.jour === G.jour).length}`] : []),
      `Argent : ${G.argent} pièces`,
      `Réputation : ${arrondi(G.reputation)}`,
      `Expérience : ${G.experience}`,
      `Flair : ${Math.round(niveauFlair(G) * 100)} % · Artisanat : niv. ${niveauArtisanat(G)}`,
      salaires(G) ? `Salaires : ${salaires(G)} p. par nuit` : '',
    ] : [
      `Clients servis : ${j.servis}`,
      `Revenus : ${j.retours} · Ratées : ${j.echecs || 0} · Morts : ${j.morts}`,
      `Argent ce matin : ${G.argentDebutJour}`,
      `Argent ce soir : ${G.argent} (${gain >= 0 ? '+' : ''}${gain})`,
      `Réputation : ${arrondi(G.reputation)}`,
      `Expérience : ${G.experience}`,
      `Flair : ${Math.round(niveauFlair(G) * 100)} % · Artisanat : niv. ${niveauArtisanat(G)}`,
    ];
    c.add(this.add.text(x1 + 18, 112, lignes.join('\n'), style(14, '#3b2410', { lineSpacing: 5 })));

    const dettes = G.prets.map(p => `${p.nom} : reste ${p.restant} (−${p.parJour}/nuit)`);
    c.add(this.add.text(x1 + 18, 290, 'Prêts en cours', style(14, '#3b2410', { fontStyle: 'bold' })));
    const texteDettes = this.add.text(x1 + 18, 310, listeCourte(dettes, 2, 'Aucun'), style(12, '#5a3a20', { lineSpacing: 2 }));
    c.add(texteDettes);
    if (G.argent < 0) {
      c.add(this.add.text(x1 + 18, 312 + texteDettes.height, `À découvert ! Faillite à ${SEUIL_FAILLITE} p.`, style(12, '#a03030', { fontStyle: 'bold' })));
    }

    c.add(this.add.text(x1 + 18, 352, 'En mission', style(14, '#3b2410', { fontStyle: 'bold' })));
    const missions = enMission(G).map(p => `${p.voyageur.nom} — jour ${p.retour}`);
    // (v0.93) le soir, la ligne du chat/de la nymphe se place sous la liste (elle la recouvrait avec 3 missions)
    const foyer = !this.matin && typeof ligneFoyer === 'function' ? ligneFoyer(G) : null;   // (v1.05) le bois de l'hiver, la gamelle du chat
    const billet = typeof alerteInformateurs === 'function' && alerteInformateurs(G);   // (v1.29) le billet de Fil-de-Fer
    const evenement = !this.matin && (billet || alerteChat(G) || foyer || nympheAttend(G) || chatCeSoir(G));
    const texteMissions = this.add.text(x1 + 18, 372, listeCourte(missions, evenement ? 2 : 4, 'Personne'), style(12, '#5a3a20', { lineSpacing: 2 }));
    c.add(texteMissions);
    // (v0.65, étape 10c) le chat : celui de gouttière qui rôde, ou le tien qui sent venir la garde
    if (!this.matin) {
      let ligne = null, action = null;
      if (billet || alerteChat(G)) {
        const cache = G.cachette === G.jour + 1;
        ligne = (billet ? 'Billet de Fil-de-Fer : « La garde, demain. Sûr et certain. »' : `${nomChat(G)[0].toUpperCase() + nomChat(G).slice(1)} crache vers la porte. La garde, demain ?`) + (cache ? ' Tout est caché.' : aCacher(G) ? '' : ' (Rien à cacher.)');
        if (!cache && aCacher(G)) action = ['▸ Tout cacher sous le plancher', () => { cacherMarchandise(G); Son.jouer('glisse'); this.tout(); }];
      } else if (foyer) {
        ligne = foyer;
        if (foyerVide(G) && (G.materiaux.bois || 0) > 0) action = ['▸ Mettre une bûche (1 planche)', () => { const err = allumerFeu(G); if (err) return this.annoncer(err); Son.jouer('glisse'); this.tout(); }];
      } else if (nympheAttend(G)) ligne = 'Une lueur bleue monte de la place du marché... Sors voir, par la rue !';
      else if (chatCeSoir(G)) ligne = 'Un chat de gouttière rôde devant ta porte ce soir.';
      const yLigne = Math.max(410, texteMissions.y + texteMissions.height + 8);
      let yAction = 455;
      if (ligne) {
        const t = this.add.text(x1 + 18, yLigne, ligne, style(12, '#5a2a4a', { fontStyle: 'bold italic', wordWrap: { width: x2 - x1 - 36 } })); c.add(t);
        // (v1.31) le lien d'action ne descend jamais sur la rangée de boutons : la ligne remonte plutôt
        if (action && t.y + t.height + 6 > 460) t.y = 460 - 6 - t.height;
        yAction = Math.min(460, Math.max(yAction, t.y + t.height + 6));
      }
      if (action) c.add(this.add.text(x1 + 18, yAction, action[0], style(12, '#8a1a1a', { fontStyle: 'bold', backgroundColor: '#ecdcb4', padding: { x: 4, y: 2 } })).setInteractive({ useHandCursor: true }).on('pointerdown', action[1]));
    } else if (G.fioleRemplie === G.jour) {
      // (v0.93) le matin où la fiole de la nymphe s'est remplie
      c.add(this.add.text(x1 + 18, Math.max(410, texteMissions.y + texteMissions.height + 8), 'La fiole de la nymphe s\'est remplie cette nuit : une potion de plus dans ta réserve.', style(12, '#2a4a7a', { fontStyle: 'bold italic', wordWrap: { width: x2 - x1 - 36 } })));
    }
  }

  // (v1.42, planche 68) Le soir : ta journée en quatre chiffres (le détail sur un clic), puis « Demain » en grand,
  // ceux qui sont en mission, les prêts, et la ligne du soir (le chat, le foyer, le billet de la garde)
  majJourneeSoir(x1, x2) {
    const G = this.G, j = G.journal;
    if (this.journee) this.journee.destroy();
    const c = this.journee = this.add.container(0, 0);
    const gain = G.argent - G.argentDebutJour;
    creerGlyphesHD(this); creerPiecesHD(this);
    const tuile = (x, y, icone, n, lib, coul) => {
      const g = this.add.graphics(); g.fillStyle(0x3b2410, 0.1).fillRoundedRect(x - 58, y - 30, 116, 60, 8); c.add(g);
      c.add(this.add.image(x - 34, y - 6, icone).setScale(1.8));
      c.add(this.add.text(x + 10, y - 8, n, style(n.length > 6 ? 15 : 18, coul, { fontStyle: 'bold' })).setOrigin(0.5));
      c.add(this.add.text(x, y + 16, lib, style(11, '#5a3a1a')).setOrigin(0.5));
    };
    const signe = n => (n >= 0 ? '+' : '−') + Math.abs(n).toLocaleString('fr-FR');
    tuile(98, 146, 'pieceFace', signe(gain), 'pièces', gain >= 0 ? '#3a6a2a' : '#a03020');
    tuile(222, 146, 'glyphe_epees', String(j.servis), j.servis > 1 ? 'clients servis' : 'client servi', '#3b2410');
    tuile(98, 214, 'glyphe_etoile', String(arrondi(G.reputation)).replace('.', ','), 'réputation', '#3b2410');
    tuile(222, 214, 'glyphe_crane', String(j.morts), j.morts > 1 ? 'morts' : 'mort', j.morts ? '#a03020' : '#3b2410');
    const detail = this.add.text(160, 256, 'Le détail de la journée ▸', style(12, '#7a4a1a', { fontStyle: 'bold italic' })).setOrigin(0.5).setInteractive({ useHandCursor: true });
    detail.on('pointerover', () => detail.setColor('#a0601a')); detail.on('pointerout', () => detail.setColor('#7a4a1a'));
    detail.on('pointerdown', () => this.detailJournee());
    c.add(detail);
    const sep = this.add.graphics(); sep.lineStyle(2, 0x8a6a3a, 0.6).lineBetween(46, 278, 274, 278); c.add(sep);
    c.add(this.add.text(160, 300, 'Demain', style(18, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
    const partis = enMission(G);
    const dette = G.prets.reduce((a, p) => a + p.restant, 0);
    // (v1.61) les lignes du bas de la colonne, posées plus bas une fois qu'on sait la place qu'il reste
    let infos = [
      { t: `En mission : ${partis.length ? partis.length + ' (' + partis.slice(0, 2).map(p => prenomDe(p.voyageur.nom)).join(', ') + (partis.length > 2 ? '…' : '') + ')' : 'personne'}`, c: '#3b2410', vide: !partis.length, prio: 1 },
      { t: G.prets.length ? `Prêts : ${G.prets.length} (reste ${dette} p.)` : 'Prêts : aucun', c: G.prets.length ? '#8a1a1a' : '#3b2410', vide: !G.prets.length, prio: 2 },
    ];
    if (G.argent < 0) infos.push({ t: `À découvert ! Faillite à ${SEUIL_FAILLITE} p.`, c: '#a03030', gras: true });
    // la ligne du soir (le chat, le foyer, le billet de Fil-de-Fer, la nymphe) et son action
    const foyer = typeof ligneFoyer === 'function' ? ligneFoyer(G) : null;
    const billet = typeof alerteInformateurs === 'function' && alerteInformateurs(G);
    let ligne = null, action = null;
    if (billet || alerteChat(G)) {
      const cache = G.cachette === G.jour + 1;
      ligne = (billet ? 'Billet de Fil-de-Fer : « La garde, demain. Sûr et certain. »' : `${nomChat(G)[0].toUpperCase() + nomChat(G).slice(1)} crache vers la porte. La garde, demain ?`) + (cache ? ' Tout est caché.' : aCacher(G) ? '' : ' (Rien à cacher.)');
      if (!cache && aCacher(G)) action = ['▸ Tout cacher sous le plancher', () => { cacherMarchandise(G); Son.jouer('glisse'); this.tout(); }];
    } else if (foyer) {
      ligne = foyer;
      if (foyerVide(G) && (G.materiaux.bois || 0) > 0) action = ['▸ Mettre une bûche (1 planche)', () => { const err = allumerFeu(G); if (err) return this.annoncer(err); Son.jouer('glisse'); this.tout(); }];
    } else if (nympheAttend(G)) ligne = 'Une lueur bleue monte de la place du marché... Sors voir, par la rue !';
    else if (chatCeSoir(G)) ligne = 'Un chat de gouttière rôde devant ta porte ce soir.';
    // (v1.61) tout doit tenir entre « Demain » et le bas du parchemin (les étiquettes NOUVEAU des boutons sont juste dessous) :
    // s'il manque de la place, on tait d'abord ce qui ne dit rien (« personne », « aucun »), puis on remonte un peu ;
    // et s'il en manque encore, les missions puis les prêts (on les retrouve dans « Le détail de la journée »)
    const BAS = 457, HAUT = 380;
    const t = ligne ? this.add.text(40, 0, ligne, style(11, '#5a2a4a', { fontStyle: 'bold italic', wordWrap: { width: 240 } })) : null;
    let reste = (t ? t.height + 4 : 0) + (action ? 22 : 0);
    const textes = infos.map(l => Object.assign(this.add.text(40, 0, l.t, style(12, l.c, { wordWrap: { width: 240 }, ...(l.gras ? { fontStyle: 'bold' } : {}) })), { vide: l.vide, prio: l.prio }));
    const haut = l => l.reduce((a, o) => a + o.height + 1, 0);
    let gardes = textes;
    if (386 + haut(gardes) + reste > BAS) gardes = gardes.filter(o => !o.vide);
    for (const p of [1, 2]) if (HAUT + haut(gardes) + reste > BAS) gardes = gardes.filter(o => o.prio !== p);
    textes.filter(o => !gardes.includes(o)).forEach(o => o.destroy());
    // (en dernier recours, la ligne du soir garde sa première phrase)
    if (t && HAUT + haut(gardes) + reste > BAS) { const court = ligne.replace(/^(.*?[.!?])\s.*$/, '$1'); if (court !== ligne) { const h = t.height; t.setText(court); reste -= h - t.height; } }
    let y = Math.max(HAUT, Math.min(386, BAS - haut(gardes) - reste));
    for (const o of gardes) { o.setY(y); c.add(o); y += o.height + 1; }
    if (t) {
      t.setY(y + 2); c.add(t);
      if (action) c.add(this.add.text(40, t.y + t.height + 3, action[0], style(12, '#8a1a1a', { fontStyle: 'bold', backgroundColor: '#ecdcb4', padding: { x: 4, y: 2 } })).setInteractive({ useHandCursor: true }).on('pointerdown', action[1]));
    }
  }

  // Le détail de la journée (l'ancienne colonne, entière) : un parchemin par-dessus, un clic le ferme
  detailJournee() {
    const G = this.G, j = G.journal, gain = G.argent - G.argentDebutJour;
    Son.jouer('page');
    const c = this.add.container(0, 0).setDepth(60);
    const voile = this.add.rectangle(480, 270, 960, 540, 0x000000, 0.45).setInteractive();
    c.add(voile);
    c.add(this.add.image(480, 270, panneauHD(this, 520, 380)).setScale(2));
    c.add(this.add.text(480, 104, 'Le détail de ta journée', style(20, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
    const lignes = [
      `Clients servis : ${j.servis}`,
      `Revenus : ${j.retours} · Ratées : ${j.echecs || 0} · Morts : ${j.morts}`,
      `Argent ce matin : ${G.argentDebutJour} · ce soir : ${G.argent} (${gain >= 0 ? '+' : ''}${gain})`,
      `Réputation : ${arrondi(G.reputation)} · Expérience : ${G.experience}`,
      `Flair : ${Math.round(niveauFlair(G) * 100)} % · Artisanat : niv. ${niveauArtisanat(G)}`,
      '', 'Demain : ' + this.textePrevision.text.replace('\n', ' '), this.texteFacteurs.text,
      '', 'En mission : ' + (listeCourte(enMission(G).map(p => `${p.voyageur.nom} (jour ${p.retour})`), 4, 'personne').replace(/\n/g, ' · ')),
      'Prêts : ' + (G.prets.length ? G.prets.map(p => `${p.nom}, reste ${p.restant} (−${p.parJour}/nuit)`).join(' · ') : 'aucun'),
    ];
    c.add(this.add.text(240, 130, lignes.join('\n'), style(13, '#3b2410', { lineSpacing: 4, wordWrap: { width: 480 } })));
    c.add(this.add.text(480, 440, 'Un clic pour fermer', style(12, '#6a4a2a', { fontStyle: 'italic' })).setOrigin(0.5));
    voile.on('pointerdown', () => c.destroy());
  }

  // --- Ta réserve (on achète le matin, au Marché des Mastres) ---

  creerReserve(x1, x2) {
    this.add.text((x1 + x2) / 2, 110, this.matin ? 'Tu peux encore retourner au marché' : 'Demain matin : le Marché des Mastres', style(12, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5);
    this.lignesStock = {};
    // (v0.64) toutes les armes sur une seule ligne, comme au râtelier (sinon la liste sortait de l'écran)
    const ids = [...Object.keys(ITEMS).filter(id => !estArme(id)), 'armes', ...Object.keys(MATERIAUX)];
    ids.forEach((id, i) => {
      const x = x1 + 24 + (i % 2) * 150;
      const y = 140 + Math.floor(i / 2) * 32;
      // (audit v0.54) le nom et la quantité sur une seule ligne : la liste se lit d'un coup d'œil
      this.add.image(x, y, iconeObjet(this, id === 'armes' ? 'epee' : id)).setScale(2);
      this.add.text(x + 20, y, id === 'armes' ? 'Armes' : nomObjet(id), style(13, '#3b2410')).setOrigin(0, 0.5);
      this.lignesStock[id] = this.add.text(x + 124, y, '', style(13, '#3b2410', { fontStyle: 'bold' })).setOrigin(1, 0.5);
    });
    this.texteReserve = this.add.text(x1 + 18, 398, '', style(13, '#3b2410', { fontStyle: 'bold' }));
    // (v0.66) la cheminée de la chambre : une planche de bois, et la nuit passe au chaud
    this.texteFeu = this.matin ? null : this.add.text(x2 - 18, 398, '', style(13, '#8a3a10', { fontStyle: 'bold' })).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    if (this.texteFeu) this.texteFeu.on('pointerdown', () => { const err = allumerFeu(this.G); if (err) return this.annoncer(err); Son.jouer('glisse'); this.tout(); });
    const pl = plaqueDuRang(this, x2 - x1 - 36, 'emeraude');   // (v1.43) au rang de la maison
    this.placeAgrandir = pl.place;
    const btn = this.add.image((x1 + x2) / 2, 444, pl.cle).setScale(2).setInteractive({ useHandCursor: true });
    this.texteAgrandir = this.add.text((x1 + x2) / 2 + pl.decal, 444, '', style(13, '#fff4dc', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 3 })).setOrigin(0.5);
    btn.on('pointerdown', () => {
      if (agrandirReserve(this.G)) return this.tout();
      if (agrandissementSuivant(this.G)) this.annoncer(manqueArgent(this.G, agrandissementSuivant(this.G).prix, "Pas assez d'argent pour agrandir la réserve."));
    });
    this.boutonAgrandir = btn;
  }

  // Un message important en haut de l'écran.
  annoncer(texte) {
    const t = this.add.text(480, 66, texte, style(14, '#fff4dc', { fontStyle: 'bold', backgroundColor: '#3b2410', padding: { x: 10, y: 4 } }))
      .setOrigin(0.5).setDepth(30);
    this.tweens.add({ targets: t, alpha: 0, delay: 3500, duration: 800, onComplete: () => t.destroy() });
  }

  majArgent() {
    const G = this.G;
    this.bourse.maj(G.argent);
    for (const [id, t] of Object.entries(this.lignesStock)) {
      const n = id === 'armes' ? IDS_ARMES.reduce((s, w) => s + (G.stock[w] || 0), 0) : id in MATERIAUX ? G.materiaux[id] : G.stock[id];
      t.setText('×' + n).setColor(n > 0 ? '#3b2410' : '#a05040');
    }
    const plein = stockTotal(G) >= G.capacite;
    this.texteReserve.setText(`Réserve : ${stockTotal(G)} / ${G.capacite}${plein ? ' — pleine !' : ''}`);
    if (this.texteFeu) this.texteFeu.setText(feuAllume(G) ? 'Le feu brûle' : 'Allumer le feu (1 bois)').setColor(feuAllume(G) ? '#a05010' : (G.materiaux.bois || 0) > 0 ? '#8a3a10' : '#a08070');
    // (v1.49) réserve pleine et feu sur la même ligne : les deux rétrécissent plutôt que de se chevaucher
    if (this.texteFeu) for (let t = 13; t >= 10 && this.texteReserve.x + this.texteReserve.width + 10 > this.texteFeu.x - this.texteFeu.width; t--) { this.texteReserve.setFontSize(t); this.texteFeu.setFontSize(t); }
    const a = agrandissementSuivant(G);
    this.texteAgrandir.setText(a ? `Agrandir : ${G.capacite} → ${a.capacite} places (+${a.capacite - G.capacite}) — ${a.prix} p.` : 'Réserve au maximum');
    this.texteAgrandir.setFontSize(13);
    for (let t = 12; this.texteAgrandir.width > (this.placeAgrandir || 999) && t >= 9; t--) this.texteAgrandir.setFontSize(t);
    this.boutonAgrandir.setAlpha(a && peutPayer(G, a.prix) ? 1 : 0.5);
  }

  // --- Les lettres ---

  majLettres(x1, x2) {
    const G = this.G;
    if (this.lettres) this.lettres.destroy();
    const c = this.lettres = this.add.container(0, 0);
    // Les lettres d'information d'abord (un événement passé, en cours ou à venir)...
    const infos = (G.courrier || []).filter(l => l.jour === G.jour).slice(0, 2);
    infos.forEach((l, i) => {
      const y = 124 + i * 54;
      c.add(this.add.text(x1 + 14, y, l.texte, style(11, '#3b2410', { fontStyle: 'italic', wordWrap: { width: x2 - x1 - 24 }, lineSpacing: 1 })));
    });
    // ... puis les commandes (à accepter ou refuser), les nouvelles d'abord.
    // (audit v0.53 : on peut feuilleter toutes les lettres, aucune n'est refusée sans avoir été vue)
    const max = (this.matin ? 4 : 6) - infos.length, toutes = [...G.annonces].sort((a, b) => a.acceptee - b.acceptee);
    if ((this.pageLettres || 0) * max >= toutes.length) this.pageLettres = 0;
    const liste = toutes.slice((this.pageLettres || 0) * max, (this.pageLettres || 0) * max + max);
    if (!liste.length && !infos.length) c.add(this.add.text(x1 + 16, 127, this.matin ? 'Rien de neuf ce matin.' : 'Rien de neuf ce soir.', style(13, '#3b2410', { fontStyle: 'italic' })));
    liste.forEach((a, i) => {
      const y = 124 + (i + infos.length) * 52;
      const v = a.voyageur;
      // (v1.12) un nom long ne passe plus sous les boutons Oui / Non : la police rapetisse, puis le nom s'abrège
      const titre = this.add.text(x1 + 14, y, `Lettre ${dePersonne(v.nom)}`, style(13, couleurNom(G, v.nom), { fontStyle: 'bold' }));
      const place = (a.acceptee ? x2 - 70 : x2 - 92) - (x1 + 14);
      for (let t = 13; titre.width > place && t > 10; t--) titre.setFontSize(t);
      while (titre.width > place && titre.text.length > 12) titre.setText(titre.text.replace(/…$/, '').slice(0, -1) + '…');
      c.add(titre);
      c.add(this.add.text(x1 + 14, y + 17, `+1 client le jour ${a.jour} · butin ~${v.butin} p. · ${v.duree} j`, style(11, '#6b4a2a')));
      c.add(this.add.text(x1 + 14, y + 31, commandeEnTexte(v), style(11, '#3b2410', { wordWrap: { width: x2 - x1 - 24 } })));
      if (a.acceptee) {
        c.add(this.add.text(x2 - 12, y, 'acceptée', style(11, '#2f6a2a', { fontStyle: 'italic' })).setOrigin(1, 0));
      } else {
        c.add(this.petitBouton(x2 - 70, y + 8, 'Oui', 0x4f7a3a, () => { accepterLettre(G, a); Son.jouer('plume'); this.tout(); }));
        c.add(this.petitBouton(x2 - 30, y + 8, 'Non', 0x8a3a2a, () => { refuserLettre(G, a); Son.jouer('tampon'); this.tout(); }));
      }
    });
    const cachees = G.annonces.length - liste.length;
    if (cachees > 0) {
      const nonLues = toutes.filter((x, i) => !x.acceptee && !liste.includes(x)).length;
      const suite = this.add.text(x2 - 12, this.matin ? 344 : 452, `▸ ${cachees} autre${cachees > 1 ? 's' : ''} lettre${cachees > 1 ? 's' : ''}${nonLues ? ` (${nonLues} sans réponse)` : ''}`, style(12, nonLues ? '#a03a1a' : '#6b4a2a', { fontStyle: 'bold italic' })).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });
      suite.on('pointerdown', () => { this.pageLettres = (this.pageLettres || 0) + 1; Son.jouer('page'); this.tout(); });
      c.add(suite);
    }
  }

  // (v1.61) au retour du bureau, de la banque ou de l'atelier : leur « NOUVEAU » s'en va
  effacerNeufs() {
    const vus = this.G.nouveautesVues || {};
    (this.tagsNeufs || []).forEach(t => { if (t.active && vus[t.cleNeuve]) { this.tweens.killTweensOf(t); t.destroy(); } });
  }

  petitBouton(x, y, texte, couleur, action) {
    const btn = this.add.container(x, y);
    const fond = this.add.rectangle(0, 0, 36, 20, couleur).setStrokeStyle(1, 0x2a1a10).setInteractive({ useHandCursor: true });
    fond.on('pointerdown', () => { if (clicUnique(this)) action(); });
    btn.add([fond, this.add.text(0, 0, texte, style(11, '#fff4dc', { fontStyle: 'bold' })).setOrigin(0.5)]);
    return btn;
  }

  // --- La prévision pour demain ---

  creerPrevision(x1, x2) {
    // (v1.42, planche 68) le soir, « Demain » est en grand dans la colonne de gauche ; les lettres ont la leur
    if (!this.matin) {
      this.texteAlerte = this.add.text(160, 362, '', style(12, '#a02010', { fontStyle: 'bold', align: 'center' })).setOrigin(0.5, 0);
      this.textePrevision = this.add.text(160, 334, '', style(22, '#7a2a10', { fontStyle: 'bold', align: 'center' })).setOrigin(0.5);
      this.texteFacteurs = this.add.text(-1000, -1000, '', style(11, '#5a3a20')).setVisible(false);   // (le détail, sur un clic)
      return;
    }
    this.add.rectangle((x1 + x2) / 2, 412, x2 - x1 - 40, 112, 0xc8b080, 0.55).setStrokeStyle(2, 0x8a6a3a);
    this.add.text(x1 + 22, 366, this.matin ? "Aujourd'hui" : 'Demain', style(15, '#3b2410', { fontStyle: 'bold' }));
    // (v0.60) l'alerte : ce que la nuit va prélever, et la faillite si on n'a pas de quoi payer
    this.texteAlerte = this.add.text(x2 - 22, 366, '', style(12, '#a02010', { fontStyle: 'bold', align: 'right' })).setOrigin(1, 0);
    this.textePrevision = this.add.text(x1 + 22, 386, '', style(14, '#3b2410', { fontStyle: 'bold', wordWrap: { width: x2 - x1 - 44 } }));
    this.texteFacteurs = this.add.text(x1 + 22, 416, '', style(11, '#5a3a20', { lineSpacing: 2, wordWrap: { width: x2 - x1 - 44 } }));
  }

  majPrevision() {
    if (this.texteAlerte) {
      const du = this.matin ? 0 : depensesDeLaNuit(this.G);
      const apres = this.G.argent - du;
      this.texteAlerte.setColor(apres <= SEUIL_FAILLITE ? '#c01010' : apres < 0 ? '#a05010' : '#5a3a20');
      this.texteAlerte.setText(!du ? '' : apres <= SEUIL_FAILLITE ? `Attention, cette nuit : −${du} p. → FAILLITE !`
        : `Cette nuit : −${du} p.${jourDeLoyer(this.G) ? ' (loyer)' : ''}${apres < 0 ? ' (à découvert !)' : ''}`);
    }
    const p = prevision(this.G, this.matin ? this.G.jour : this.G.jour + 1);
    const a = attrait(this.G);
    this.textePrevision.setText(`${p.min === p.max ? p.min : p.min + ' à ' + p.max} client${p.max > 1 ? 's' : ''}` +
      (p.annonces ? (this.matin ? ` (+ ${p.annonces} par lettre)` : `\n+ ${p.annonces} par lettre`) : ''));
    if (!this.matin) this.textePrevision.setFontSize(p.annonces ? 18 : 22);
    const signe = n => (n >= 0 ? '+' : '') + n.toFixed(1);
    const jour = this.matin ? this.G.jour : this.G.jour + 1;
    const evenements = modifEvenement(this.G, 'clients', null, jour);
    const rumeur = this.G.rumeur && this.G.rumeur.jour === jour ? -RUMEUR_CLIENTS : 0;
    this.texteFacteurs.setText(`Réputation ${signe(a.reputation)} · Expérience ${signe(a.experience)}\nStock varié ${signe(a.variete)}` +
      (evenements ? ` · Événements ${evenements > 0 ? '+' : ''}${evenements}` : '') + (rumeur ? ` · Rumeur ${rumeur}` : ''));
    const pal = p.palier;
    this.texteFacteurs.setText(this.texteFacteurs.text + `\nPalier : ${pal.max} clients (+${BONUS_CLIENTS_MAX})` + (pal.suivant ? ` · ${pal.suivant.max} dès ${pal.suivant.reputation} de réput.` : ''));
    // (v0.93) quand la journée est pleine, on le dit à la place du palier
    if (p.plein) this.texteFacteurs.setText(this.texteFacteurs.text.replace(/\nPalier.*$/, `\nJournée pleine : ${p.capacite} clients au plus`));
  }

  // --- La banque : une page à part, le soir attend en pause ---

  // (v1.30) La liste des projets du soir, au-dessus de leur bouton : un clic à côté la referme
  listeProjets(projets, x) {
    if (this.menuProjets) { this.menuProjets.forEach(o => (o.fond ? (o.fond.destroy(), o.label.destroy()) : o.destroy())); this.menuProjets = null; return; }
    const h = projets.length * 44 + 16, cx = Phaser.Math.Clamp(x, 130, 830), y0 = 480 - h;
    const voile = this.add.rectangle(480, 270, 960, 540, 0x000000, 0.001).setDepth(60).setInteractive();
    const fond = this.add.rectangle(cx, y0 + h / 2, 236, h, 0x2a1a10, 0.94).setStrokeStyle(2, 0xc9a227).setDepth(61);
    this.menuProjets = [voile, fond];
    projets.forEach(([texte, action], i) => {
      const b = creerBouton(this, cx, y0 + 30 + i * 44, 212, texte, () => { this.listeProjets(); action(); });
      b.fond.setDepth(62); b.label.setDepth(62.1); this.menuProjets.push(b);
    });
    voile.on('pointerdown', () => this.listeProjets());
  }

  ouvrirBanque() {
    if (this._transition && performance.now() - this._transition < 1500) return;   // (v0.86 : pas pendant un fondu)
    this.scene.pause();
    this.scene.launch('Banque', { retour: 'Nuit' });
  }
}

// Un nombre à la française : 3 reste 3, 2.5 devient « 2,5 », 0.25 devient « 0,25 ».
function arrondi(n) {
  return String(Math.round(n * 100) / 100).replace('.', ',');
}
