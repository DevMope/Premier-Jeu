// Chez toi. Le soir : bilan de la journée, lettres à accepter ou refuser, banque, atelier,
// bureau, et prévision des clients pour demain.
// Le matin (`matin`), en rentrant du marché : les mêmes lieux, avant d'ouvrir le comptoir.
class NightScene extends Phaser.Scene {
  constructor() { super('Nuit'); }

  init(data) {
    this.matin = !!(data && data.matin);
    // Phaser garde les données d'un démarrage à l'autre : sans ce ménage, le soir du jour 2
    // (lancé sans données) se croyait encore « le matin » — plus de bouton pour aller dormir.
    this.sys.settings.data = {};
  }

  create() {
    exclureScenes(this, 'Carte', 'Comptoir', 'Dodo');   // (v0.62)
    const G = this.G = window.GAME;
    if (!this.matin) { preparerSoir(G); tirerGardeDuLendemain(G); }
    if (!this.matin) this.time.delayedCall(800, () => { const n = oublierPortraits(this.game); if (n && typeof noterJournal === 'function') noterJournal(`(${n} portraits oubliés)`); });   // (v0.96)   // (v0.65 : la garde de demain se tire dès ce soir, le chat la sent parfois)
    this.lieu = this.matin ? 'Maison' : 'Nuit';

    this.cameras.main.setBackgroundColor(this.matin ? '#2a1e12' : '#1e140c');
    this.cameras.main.fadeIn(500);
    // Le décor : l'arrière-boutique, à la lueur du luminaire (plus sombre le soir)
    creerInterieurHD(this);
    this.add.image(0, 0, murInterieur(this, 'murArriere', { poteaux: [272, 412], graine: 310 })).setOrigin(0).setScale(2).setTint(this.matin ? 0xb8946c : 0x7a5c44);
    this.add.image(0, 440, plancher(this, 'plancherArriere', { graine: 410 })).setOrigin(0).setScale(2).setTint(this.matin ? 0xc8a888 : 0x8a6c54);
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

    this.parchemin(20, 300, this.matin ? "Aujourd'hui" : 'La journée');
    this.parchemin(320, 640, 'Ta réserve');
    this.parchemin(660, 940, 'Lettres reçues');
    this.add.text(800, 108, '1 lettre acceptée = 1 client EN PLUS', style(12, '#8a3a1a', { fontStyle: 'bold italic' })).setOrigin(0.5);
    this.creerReserve(320, 640);
    this.creerPrevision(660, 940);

    // (v0.86) pas d'autre page pendant un fondu (« Dormir », « Ouvrir le comptoir ») : sinon elle s'ouvrait par-dessus la suivante
    const enFondu = () => this._transition && performance.now() - this._transition < 1500;
    const ouvrirPage = (page, donnees) => { if (enFondu()) return; this.scene.pause(); this.scene.launch(page, donnees); };
    const boutons = [
      ['Le bureau', () => ouvrirPage('Bureau', { retour: 'Nuit' })],
      ['La banque', () => this.ouvrirBanque()],
      [`L'atelier (${G.tresors.length})`, () => ouvrirPage('Atelier')],
      ...(this.matin ? [] : [['Se promener', () => ouvrirPage('Promenade')]]),
      ...(!this.matin && marcheNoirCeSoir(G) ? [['La porte dérobée', () => ouvrirPage('MarcheNoir')]] : []),
      ...(this.matin
        ? [["L'arrière-boutique", () => ouvrirPage('Arriere', { retour: 'Nuit' })], ['Le marché', () => this.allerA('Marche')], ['Ouvrir le comptoir', () => this.ouvrirComptoir()]]
        : [['Aller dormir', () => this.dormir()]]),
    ];
    const largeur = 920 / boutons.length;
    boutons.forEach(([texte, action], i) => {
      const b = creerBouton(this, 20 + largeur * (i + 0.5), 505, largeur - 16, texte, action);
      // Le soir, le bouton pour aller dormir (et passer au lendemain) se voit bien : il luit.
      if (!this.matin && i === boutons.length - 1) {
        b.label.setColor('#ffe9a0');
        creerHalo(this);
        const lueur = this.add.image(b.fond.x, b.fond.y, 'halo').setScale(2.2, 0.7).setTint(0xffd060).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD);
        this.tweens.add({ targets: lueur, alpha: 0.1, duration: 900, yoyo: true, repeat: -1 });
      }
    });
    this.events.off('resume', this.tout, this);
    this.events.on('resume', this.tout, this);
    this.tout();
    afficherStatutSauvegarde(this, 940, 60, 1);
    if (!this.matin) this.time.delayedCall(600, () => conseilGarrick(this, 'soir'));
    // (v0.90) le soir du Carrefour (ou du parjure) : deux visiteurs frappent à la porte
    if (!this.matin) this.time.delayedCall(700, () => this.carrefourEnAttente());
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
    if (enTransition(this)) return;   // (v0.90) on ne s'endort pas avant d'avoir ouvert la porte
    const G = this.G;
    if (typeof foyerVide === 'function' && foyerVide(G) && this.froidAccepte !== G.jour) return this.confirmerFoyer();   // (v1.06, planche 24 B)
    const bilan = { jour: G.jour, servis: G.journal.servis, retours: G.journal.retours, morts: G.journal.morts,
      gain: G.argent - G.argentDebutJour, reputation: G.reputation, jauge: jaugeCamp(G), palier: nomPalierCamp(G) };
    this.cameras.main.fadeOut(500);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Dodo', { bilan }));
  }

  // (v1.06, planche 24 B) En Givre, au coucher, sans bûche dans la cheminée : on prévient avant de dormir
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
    Sauvegarde.planifier(this.G, this.lieu);
    this.majArgent();
    this.majJournee(20, 300);
    this.majLettres(660, 940);
    this.majPrevision();
  }

  // --- La journée ---

  majJournee(x1, x2) {
    const G = this.G;
    const j = G.journal;
    if (this.journee) this.journee.destroy();
    const c = this.journee = this.add.container(0, 0);
    const gain = G.argent - G.argentDebutJour;
    const p = prevision(G, G.jour);
    const lignes = this.matin ? [
      `Clients attendus : ${p.min} à ${p.max}${p.annonces ? ` + ${p.annonces} par lettre` : ''}`,
      `Commandes par lettre : ${G.annonces.filter(a => a.acceptee && a.jour === G.jour).length}`,
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
    const foyer = !this.matin && typeof ligneFoyer === 'function' ? ligneFoyer(G) : null;   // (v1.06) le bois de l'hiver, la gamelle du chat
    const evenement = !this.matin && (alerteChat(G) || foyer || nympheAttend(G) || chatCeSoir(G));
    const texteMissions = this.add.text(x1 + 18, 372, listeCourte(missions, evenement ? 2 : 4, 'Personne'), style(12, '#5a3a20', { lineSpacing: 2 }));
    c.add(texteMissions);
    // (v0.65, étape 10c) le chat : celui de gouttière qui rôde, ou le tien qui sent venir la garde
    if (!this.matin) {
      let ligne = null, action = null;
      if (alerteChat(G)) {
        const cache = G.cachette === G.jour + 1;
        ligne = `${nomChat(G)[0].toUpperCase() + nomChat(G).slice(1)} crache vers la porte. La garde, demain ?` + (cache ? ' Tout est caché.' : aCacher(G) ? '' : ' (Rien à cacher.)');
        if (!cache && aCacher(G)) action = ['▸ Tout cacher sous le plancher', () => { cacherMarchandise(G); Son.jouer('glisse'); this.tout(); }];
      } else if (foyer) {
        ligne = foyer;
        if (foyerVide(G) && (G.materiaux.bois || 0) > 0) action = ['▸ Mettre une bûche (1 planche)', () => { const err = allumerFeu(G); if (err) return this.annoncer(err); Son.jouer('glisse'); this.tout(); }];
      } else if (nympheAttend(G)) ligne = 'Une lueur bleue monte de la place du marché... Sors voir, par la rue !';
      else if (chatCeSoir(G)) ligne = 'Un chat de gouttière rôde devant ta porte ce soir.';
      const yLigne = Math.max(410, texteMissions.y + texteMissions.height + 8);
      let yAction = 455;
      if (ligne) { const t = this.add.text(x1 + 18, yLigne, ligne, style(12, '#5a2a4a', { fontStyle: 'bold italic', wordWrap: { width: x2 - x1 - 36 } })); c.add(t); yAction = Math.max(yAction, t.y + t.height + 6); }
      if (action) c.add(this.add.text(x1 + 18, yAction, action[0], style(12, '#8a1a1a', { fontStyle: 'bold', backgroundColor: '#ecdcb4', padding: { x: 4, y: 2 } })).setInteractive({ useHandCursor: true }).on('pointerdown', action[1]));
    } else if (G.fioleRemplie === G.jour) {
      // (v0.93) le matin où la fiole de la nymphe s'est remplie
      c.add(this.add.text(x1 + 18, Math.max(410, texteMissions.y + texteMissions.height + 8), 'La fiole de la nymphe s\'est remplie cette nuit : une potion de plus dans ta réserve.', style(12, '#2a4a7a', { fontStyle: 'bold italic', wordWrap: { width: x2 - x1 - 36 } })));
    }
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
    const btn = this.add.image((x1 + x2) / 2, 444, plaqueBouton(this, x2 - x1 - 36)).setScale(2).setInteractive({ useHandCursor: true });
    this.texteAgrandir = this.add.text((x1 + x2) / 2, 444, '', style(13, '#fff4dc', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 3 })).setOrigin(0.5);
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
    const a = agrandissementSuivant(G);
    this.texteAgrandir.setText(a ? `Agrandir : ${G.capacite} → ${a.capacite} places (+${a.capacite - G.capacite}) — ${a.prix} p.` : 'Réserve au maximum');
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
    const max = 4 - infos.length, toutes = [...G.annonces].sort((a, b) => a.acceptee - b.acceptee);
    if ((this.pageLettres || 0) * max >= toutes.length) this.pageLettres = 0;
    const liste = toutes.slice((this.pageLettres || 0) * max, (this.pageLettres || 0) * max + max);
    if (!liste.length && !infos.length) c.add(this.add.text(x1 + 16, 127, 'Aucune lettre pour le moment.\nLes lettres sont rares.', style(13, '#3b2410')));
    liste.forEach((a, i) => {
      const y = 124 + (i + infos.length) * 52;
      const v = a.voyageur;
      c.add(this.add.text(x1 + 14, y, `Lettre ${dePersonne(v.nom)}`, style(13, couleurNom(G, v.nom), { fontStyle: 'bold' })));
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
      const suite = this.add.text(x2 - 12, 344, `▸ ${cachees} autre${cachees > 1 ? 's' : ''} lettre${cachees > 1 ? 's' : ''}${nonLues ? ` (${nonLues} sans réponse)` : ''}`, style(12, nonLues ? '#a03a1a' : '#6b4a2a', { fontStyle: 'bold italic' })).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });
      suite.on('pointerdown', () => { this.pageLettres = (this.pageLettres || 0) + 1; Son.jouer('page'); this.tout(); });
      c.add(suite);
    }
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
    this.textePrevision.setText(`${p.min === p.max ? p.min : p.min + ' à ' + p.max} clients` +
      (p.annonces ? ` (+ ${p.annonces} par lettre)` : ''));
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
