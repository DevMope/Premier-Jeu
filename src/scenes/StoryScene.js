// La petite cinématique : on voit l'aventure d'un voyageur, épreuve par épreuve,
// et comment chaque objet du colis l'a aidé (ou lui a manqué).
class StoryScene extends Cinematique {
  constructor() { super('Recit'); }

  init(data) {
    this.idParti = data.id;
  }

  create() {
    this.G = window.GAME;
    // (la scène est réutilisée d'un récit à l'autre : on remet la vitesse normale)
    this.rapide = false;
    this.blesse = false;
    this.menace = null;
    this.tweens.timeScale = 1;
    this.time.timeScale = 1;
    this.parti = this.G.partis.find(p => p.voyageur.id === this.idParti);
    if (!this.parti) { this.time.delayedCall(0, () => this.scene.start('Comptoir')); return; }
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
    this.fond = this.add.graphics();
    // Le paysage de la zone où il est parti.
    dessinerComte(this.fond, 0, 0, 960, 370, 0, v.zone ? ZONES[v.zone].biome : 'comte');
    // Le paysage déborde un peu de l'écran : il glisse doucement quand le voyageur avance.
    this.paysage = this.fond.paysage.setScale(this.fond.paysage.scaleX * 1.1, this.fond.paysage.scaleY * 1.1).setPosition(0, -18).setDepth(-2);
    this.fond.setDepth(-2);
    // (audit v0.54) le voile de la nuit couvre aussi le plan moyen, et le plan moyen reste derrière le voyageur
    this.voile = this.add.rectangle(480, 185, 960, 370, 0x05051a, 0).setDepth(-0.4);
    this.decor = this.add.container(0, 0);
    // Un premier plan qui glisse plus vite que le paysage (profondeur), et un léger assombrissement
    // des bords qui concentre le regard sur le voyageur
    this.planMoyen = this.add.container(0, 0).setDepth(-0.5);
    this.premierPlan = this.add.container(0, 0).setDepth(6.5);
    this.biome = v.zone ? ZONES[v.zone].biome : 'comte';
    this.planterPlanMoyen(this.biome);
    this.planterPremierPlan(this.biome);
    this.meteoBiome(this.biome);

    this.perso = imageCorps(this, -60, 360, v, 6);
    this.fCorps = echelleCorps(this.perso.texture.key);
    this.creerCompagnons(v);

    this.coeurs = [];
    // Ses cœurs, plus ceux gagnés grâce aux soins donnés en plus.
    const pvDepart = (this.parti.resultat && this.parti.resultat.pvDepart) || v.pv;
    for (let i = 0; i < pvDepart; i++) {
      this.coeurs.push(this.add.image(30 + i * 34, 46, 'hd_coeur').setScale(2));
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
    // Passer : le récit défile en accéléré jusqu'à la fin (les choix de la fin restent à faire).
    const passer = this.boutonPasser(() => {
      if (this.rapide) return;
      this.rapide = true;
      this.tweens.timeScale = 6;
      this.time.timeScale = 6;
      this.events.emit('passer');
    });
    if (passer) this.ui.add(passer);

    this.raconter();
  }

  // Tout ce qui n'est pas dans `this.ui` est caché à la caméra de l'interface, et seule la caméra
  // de l'interface voit `this.ui`. (À chaque tour, pour attraper ce qui vient d'être créé.)
  filtrerCameras() {
    if (!this.camUI || !this.camUI.id) return;
    const bit = this.camUI.id;
    for (const o of this.children.list) if (o !== this.ui && !(o.cameraFilter & bit)) o.cameraFilter |= bit;
  }

  // La caméra du monde cadre un point (x, y) avec un grossissement k (1 = tout l'écran)
  cadrer(x, y, k = 1, duree = 600, ease = 'Sine.easeInOut') {
    const cam = this.cameras.main;
    const zoom = this.zoomBase * k;
    const sx = Phaser.Math.Clamp(x - 480 / k, 0, Math.max(0, 960 - 960 / k));
    // (le sol, à y = 360, reste à la même hauteur à l'écran : on ne cadre qu'en largeur, et `y`
    // ne fait que pencher un peu le regard vers le haut quand il est petit)
    const sy = Phaser.Math.Clamp(360 - 360 / k - Math.max(0, 200 - y) * 0.1, 0, 360 - 360 / k);
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
    this.ui.add(g);
    // le conteur : son buste, dans le coin de la boîte de texte (ou son carnet, s'il n'est plus là)
    if (vivant) {
      this.conteur = this.add.image(92, 538, textureBusteHD(this, v, 'content')).setOrigin(0.5, 1).setScale(1.45);
      this.ui.add(this.conteur);
      this.tweens.add({ targets: this.conteur, y: 541, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    } else {
      creerObjetsHD(this);
      const carnet = this.add.image(92, 470, 'registreComptoir').setScale(2.2).setAngle(-6);
      this.ui.add(carnet);
    }
  }

  // Le conteur parle (sa voix) à chaque nouveau texte
  ecrire(entete, texte) {
    super.ecrire(entete, texte);
    if (this.conteur && this.parti && this.parti.resultat.vivant && !this.rapide) Son.jouer('voix', { personne: this.parti.voyageur, duree: Math.min(1.8, 0.3 + (texte || '').length * 0.012), force: 0.7 });
  }

  // Les mots qui surgissent se dessinent dans le monde (devant tout)
  onomatopee(x, y, mot, couleur) {
    super.onomatopee(x, y, mot, couleur);
  }

  async marcherVers(x) {
    const duree = Math.max(300, Math.abs(x - this.perso.x) * 5);
    pasDeMarche(this, this.perso, duree);
    const y = this.perso.y;
    this.tweens.add({ targets: this.perso, y: y - 2, duration: 125, yoyo: true, repeat: Math.floor(duree / 250) });
    this.tweens.add({ targets: this.paysage, x: -Phaser.Math.Clamp(x, 0, 960) / 960 * 96, duration: duree, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: this.premierPlan, x: -Phaser.Math.Clamp(x, 0, 960) / 960 * 260, duration: duree, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: this.planMoyen, x: -Phaser.Math.Clamp(x, 0, 960) / 960 * 40, duration: duree, ease: 'Sine.easeInOut' });
    this.cadrer(x + 120, 250, 1.12, duree, 'Sine.easeInOut');
    await this.animer({ targets: this.perso, x, duration: duree, ease: 'Linear' });
    this.perso.setScale(6 * this.fCorps).setY(y);
  }

  // --- Le récit ---

  async raconter() {
    const v = this.parti.voyageur;
    const r = this.parti.resultat;
    const etapes = v.epreuves.length;

    this.titre.setText(r.vivant ? 'Le récit de ' + v.nom : 'Le carnet de ' + v.nom).setColor(couleurNom(this.G, v.nom, true));
    Son.ambiance(r.vivant ? 'recitEtonne' : 'recitTriste');   // (la musique suit le récit : étonnement, peur, joie, tristesse)
    this.ecrire(v.quete, r.vivant
      ? `${v.nom} est revenu${this.e} au comptoir, ${this.etatAuRetour()}. Assis${this.e} sur le rebord de la fenêtre, ${v.feminin ? 'elle' : 'il'} te raconte son aventure...`
      : `${v.nom} n'est jamais revenu${this.e}... ${this.G.faucheuse && this.G.faucheuse.visites ? 'La Faucheuse a laissé son carnet de voyage sur ton comptoir' : 'Un berger a rapporté son carnet de voyage'}. Tu l'ouvres en tremblant.`);
    await this.attendreClic();

    for (let i = 0; i < r.etapes.length; i++) {
      const { epreuve, niveau, reussie, pvApres, piege, pvAvant, sauvee, repli, saignement, fane } = r.etapes[i];
      const fanee = fane ? '\n(Son trèfle de chance s\'est fané : le cadeau a servi.)' : '';
      // (v0.59) une scène d'épreuve peut l'avoir fait avancer : on repart d'où il est
      const x = Phaser.Math.Clamp(Math.max(140 + i * (680 / etapes), this.perso.x), 0, 600);

      if (this.meteo) { this.meteo.remove(); this.meteo = null; }
      this.nettoyerScenario();
      this.tweens.killTweensOf(this.decor.list);   // (audit v0.61 : les tweens en boucle des décors)
      this.decor.removeAll(true);
      this.titreEtape = r.vivant ? `Épreuve ${i + 1} / ${etapes}` : `Jour ${Math.min(v.duree || etapes, 1 + Math.floor(i * (v.duree || etapes) / etapes))}`;
      this.ecrire(this.titreEtape, '...');
      await this.marcherVers(x);
      this.planterDecor(epreuve.type, x + 130, epreuve);
      const scene = this.menace.scenario;
      this.menace.niveau = niveau;
      this.menace.texteIssue = epreuve[niveau] || '';
      this.cadrer(x + 150, 240, scene ? 1.12 : 1.22, 900);   // (on s'approche de ce qui l'attend)
      this.ecrire(this.titreEtape, accord(epreuve.intro, v));
      // (v0.59) la scène se joue pendant qu'on lit : la bête arrive, la nuit tombe...
      if (scene && scene.avant) await scene.avant.call(this);
      await this.attendreClic();

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

    await this.conclure();
  }

  // L'écriture du carnet qui tremble (plus le voyageur a perdu de cœurs, plus elle tremble)
  trembler(perdus) {
    this.tweens.killTweensOf(this.texte);
    this.texte.setX(176).setAngle(0);
    if (perdus <= 0) return;
    this.tweens.add({ targets: this.texte, x: 176 + Math.min(3, perdus), angle: Math.min(1.2, perdus * 0.3), duration: Math.max(40, 140 - perdus * 25), yoyo: true, repeat: -1 });
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
    const cle = iconeObjet(this, id);
    const icone = this.add.image(this.perso.x, this.perso.y - 88, cle).setScale(0).setDepth(5);
    await this.animer({ targets: icone, scale: cle.startsWith('hd_') ? 3 : 5, y: icone.y - 30, duration: 350, ease: 'Back.easeOut' });
    this.tweens.add({ targets: icone, alpha: 0, y: icone.y - 30, duration: 900, delay: 500, onComplete: () => icone.destroy() });
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

  async conclure() {
    // La fin du récit se lit à vitesse normale.
    this.rapide = false;
    this.cadrer(480, 185, 1, 800);
    Son.ambiance(this.parti.resultat.vivant && !this.parti.resultat.echec ? 'recitHeureux' : 'recitTriste');
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
    const relation = niveauRelation(this.G, v.nom);
    if (r.vivant && r.echec) {
      // Mission ratée : vivant, mais les mains vides.
      await this.marcherVers(880);
      this.ecrire('Mission ratée', [`« Je suis désolé${this.e}... Je reviens les mains vides. » · Relation : ${relation.nom}`,
        ...(this.parti.malus || []).map(m => '• ' + m)].join('\n'));
      this.texte.setFontSize(13).setLineSpacing(1);
    } else if (r.vivant) {
      await this.marcherVers(880);
      // (v0.60) la fin de la quête, en une image : ce qu'on n'avait jamais vu
      const finQuete = FINS_QUETES[v.queteId];
      if (finQuete && !v.quetePerso) {
        this.ecrire(v.quete, `« ${accord(finQuete, v)} »`);
        if (this.conteur) this.conteur.setTexture(textureBusteHD(this, v, 'content'));
        await this.attendreClic();
      }
      this.pleuvoirPieces();
      const ajuste = gain !== v.butin ? ` (prévu : ${v.butin}, ajusté selon votre relation et tes décorations)` : '';
      this.ecrire('Retour au comptoir',
        `« ${this.remerciement()} Voici ta part du butin ! »\n` +
        `+ ${gain} pièces${ajuste} · Relation : ${relation.nom}${message ? '\n' + message : ''}`);
    } else {
      this.perso.setTint(0x888888);
      Son.jouer('glas');
      await this.animer({ targets: this.perso, angle: -90, alpha: 0.6, duration: 700, ease: 'Bounce.easeOut' });
      this.ecrire('Fin du carnet', r.valeureux
        ? `${v.nom} est mort${this.e} valeureusement au combat. On chantera son nom dans les tavernes.\nTon investissement est perdu.`
        : `${v.nom} est mort${this.e} loin de chez ${v.feminin ? 'elle' : 'lui'}, sans gloire. Il fallait sans doute mieux ${v.feminin ? 'la' : 'le'} préparer...\nTon investissement est perdu.`);
      // (v0.60) la dernière ligne du carnet, interrompue
      const proche = auHasard(['ma sœur', 'mon frère', 'ma mère', 'mon père', 'mes enfants', 'ma bien-aimée']);
      this.texte.setText(this.texte.text + `\nLa dernière ligne du carnet, à peine lisible : « Dis à ${proche} que je... »`);
      this.trembler(3);
      if (this.parti.demasque) {
        const id = Object.keys(this.parti.pieges).find(k => this.parti.pieges[k] > 0);
        this.texte.setText(this.texte.text + `\nOn a retrouvé ${PIEGES[id] ? leNom(id, PIEGES[id].nom.toLowerCase()) : 'ton piège'} près du corps. Au village, on t'accuse.`);
      }
      this.tweens.add({ targets: this.voile, fillAlpha: 0.5, duration: 1500 });
      this.indice.destroy();
      return this.proposerDedommagement();
    }

    this.indice.destroy();
    const retour = creerBouton(this, 820, 345, 240, 'Retour au comptoir', () => this.scene.start('Comptoir'));
    this.dansUI(retour);
    if (r.vivant) {
      this.proposerSoins();
      this.proposerTrouvailles();
    }
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
    if (b === 'sanctuaire') return "une feuille d'argent prise dans les cheveux";
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
    const fin = camp === 'bien' ? ' Au village, on a sonné les cloches pour moi.' : camp === 'mal' ? " Personne ne m'a vu revenir. C'est mieux ainsi." : '';
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
      c.add(this.add.text(170, y + 17, `👃 ${e.verdict.texte}`, style(12, e.verdict.couleur, { fontStyle: 'bold' })));
      const b = creerBouton(this, 470, y, 140, '', () => {
        const erreur = acheterTrouvaille(G, t);
        if (erreur) { Son.jouer('refus'); return info.setText(erreur); }
        Son.jouer('achat');
        info.setColor('#2f6a2a').setText(`${tr.nom} rejoint ton atelier : à réparer !`);
        maj();
      });
      c.add([b.fond, b.label]);
      const maj = () => {
        b.setTexte(t.vendu ? 'Acheté' : `Acheter ${t.prix} p.`);
        b.setActif(!t.vendu);
      };
      maj();
    });
  }

  // L'aventurier est mort : sa famille doit être dédommagée. Trois montants au choix.
  proposerDedommagement() {
    const G = this.G;
    const v = this.parti.voyageur;
    const montants = montantsDedommagement(v);
    this.texte.setText(this.texte.text + `\nTu dois verser un dédommagement à sa famille. Plus tu es ${eJ(this.G) ? 'généreuse' : 'généreux'}, plus ta réputation remonte... et plus un proche voudra reprendre le flambeau.`);
    const boutons = Object.entries(DEDOMMAGEMENTS).map(([cle, d], i) => {
      const b = creerBouton(this, 200 + i * 280, 345, 250, `${d.nom} : ${montants[cle]} p.`, () => {
        const verse = dedommager(G, this.parti, cle);
        boutons.forEach(x => x.setVisible(false));
        const rep = d.reputation ? ` Réputation +${d.reputation}.` : '';
        this.ecrire('Dédommagement', `Tu as versé ${verse} pièces à la famille de ${v.nom}.${rep}` +
          (G.argent < 0 ? `\nTu es à découvert (${G.argent} pièces). Faillite à ${SEUIL_FAILLITE} !` : ''));
        const retour = creerBouton(this, 820, 345, 240, 'Retour au comptoir', () => this.scene.start('Comptoir'));
        this.dansUI(retour);
      });
      return this.dansUI(b);
    });
  }

  // L'aventurier est revenu blessé ? On peut le soigner avec une potion, et il paie.
  proposerSoins() {
    const G = this.G;
    const v = this.parti.voyageur;
    if (!blessuresDe(G, v.nom)) return;
    const bouton = creerBouton(this, 540, 345, 290, '', () => {
      const erreur = soigner(G, v.nom);
      if (erreur) { Son.jouer('refus'); return this.ecrire('Soins', erreur); }
      Son.jouer('coeur');
      const coeur = this.coeurs.find(c => c.texture.key === 'hd_coeurVide');
      if (coeur) {
        coeur.setTexture('hd_coeur');
        this.tweens.add({ targets: coeur, scale: 3, duration: 150, yoyo: true });
      }
      this.perso.setTint(0x80ff80);
      this.time.delayedCall(300, () => this.perso.clearTint());
      this.ecrire('Soins', `« Ah, ça fait du bien ! Tiens, ${PRIX_SOIN} pièces pour la potion. »` +
        (blessuresDe(G, v.nom) ? `\nEncore ${blessuresDe(G, v.nom)} cœur(s) à soigner.` : `\nComplètement remis${this.e} sur pied !`));
      maj();
    });
    this.dansUI(bouton);
    const maj = () => {
      const reste = blessuresDe(G, v.nom);
      bouton.setVisible(reste > 0);
      bouton.setTexte(`Soigner un cœur (+${PRIX_SOIN} p.)`);
      bouton.setActif(G.stock.potion > 0);
    };
    maj();
    const n = blessuresDe(G, v.nom);
    this.texte.setText(this.texte.text + `\n${v.feminin ? 'Elle' : 'Il'} a perdu ${n} cœur${n > 1 ? 's' : ''}. ` +
      (G.stock.potion > 0 ? `Une potion par cœur (il te reste ${G.stock.potion} potion${G.stock.potion > 1 ? 's' : ''}).` : `Tu n'as pas de potion pour ${v.feminin ? 'la' : 'le'} soigner.`));
  }

  pleuvoirPieces() {
    for (let i = 0; i < 18; i++) {
      const p = this.add.ellipse(Phaser.Math.Between(700, 940), -20, 18, 18, 0xe8c040).setStrokeStyle(2, 0x9a7a10);
      this.tweens.add({ targets: p, y: 360, duration: Phaser.Math.Between(600, 1100), delay: i * 60, ease: 'Bounce.easeOut' });
    }
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
    const g = this.add.graphics();
    // les touffes d'herbe (ou de neige), en silhouette
    for (let x = -100; x < 1300; x += 26 + (x * 7) % 19) {
      const h = 10 + (x * 13) % 16;
      g.fillStyle(teinte, 0.95);
      g.fillTriangle(x, sol + 2, x + 6, sol - h, x + 12, sol + 2);
      g.fillTriangle(x + 8, sol + 2, x + 13, sol - h * 0.7, x + 18, sol + 2);
    }
    this.premierPlan.add(g);
    if (sombre) for (const [x, e] of [[-40, 1.1], [1180, 1.3]]) this.premierPlan.add(this.add.image(x, sol + 30, 'sapinPremierPlanHD').setOrigin(0.5, 1).setScale(e).setTint(0x101c14).setAlpha(0.9));
  }

  // Le plan moyen : des arbres ou des rochers en silhouette, entre le paysage et le voyageur, qui
  // glissent un peu moins vite que lui (profondeur)
  planterPlanMoyen(biome) {
    const sombre = ['foret', 'marais', 'repaire', 'tour', 'grotte'].includes(biome);
    const neige = ['montagne', 'glace', 'neige'].includes(biome);
    const g = this.add.graphics();
    // (audit v0.54) la couleur suit le paysage (plus de bosquets verts dans les terres brûlées), et
    // les déserts, terres brûlées et montagnes ont des rochers plutôt que des arbres
    const b = BIOMES[biome] || BIOMES.comte;
    const rocheux = neige || ['desert', 'badlands', 'mines', 'antre', 'opale'].includes(biome);
    const teinte = neige ? 0xc8d4e0 : melangeCouleur(b.arbres || b.loin, 0x0a0a10, sombre ? 0.45 : 0.3);
    for (let x = -60; x < 1100; x += 70 + (x * 3) % 50) {
      const h = 60 + (x * 7) % 70, r = 22 + (x * 5) % 18;
      g.fillStyle(teinte, 0.8);
      if (rocheux) { g.fillTriangle(x - r * 1.4, 332, x, 332 - h * (neige ? 1 : 0.6), x + r * 1.4, 332); g.fillStyle(melangeCouleur(teinte, 0xffffff, 0.15), 0.8).fillTriangle(x - r * 0.5, 332, x, 332 - h * (neige ? 1 : 0.6), x + r * 0.2, 332); }
      else { g.fillRect(x - 3, 332 - h * 0.5, 6, h * 0.5); g.fillCircle(x, 332 - h * 0.5 - r * 0.6, r); g.fillCircle(x - r * 0.7, 332 - h * 0.5 - r * 0.2, r * 0.8); g.fillCircle(x + r * 0.7, 332 - h * 0.5 - r * 0.2, r * 0.8); }
    }
    this.planMoyen.add(g);
  }

  // La météo de la contrée, en continu : pluie des marais, neige des montagnes, feuilles de la
  // forêt, brume... (en plus des effets propres à chaque épreuve)
  meteoBiome(biome) {
    if (this.ambiance) this.ambiance.remove();
    const marais = biome === 'marais', neige = ['montagne', 'glace', 'neige'].includes(biome), foret = ['foret', 'sanctuaire'].includes(biome), ombre = ['repaire', 'tour', 'bourbier'].includes(biome);
    if (!marais && !neige && !foret && !ombre) return;
    this.ambiance = this.time.addEvent({ delay: marais ? 40 : 160, loop: true, callback: () => {
      if (marais) {
        // des gouttes de pluie en biais
        const x = Phaser.Math.Between(-60, 1000);
        const r = this.add.rectangle(x, -10, 1.5, 16, 0xcfe4f0, 0.5).setAngle(-12).setDepth(6.8);
        this.tweens.add({ targets: r, y: 380, x: x - 80, duration: 650 + Math.random() * 200, ease: 'Linear', onComplete: () => r.destroy() });
        if (Math.random() < 0.08) { const b = this.add.ellipse(Phaser.Math.Between(0, 960), Phaser.Math.Between(200, 330), 180, 40, 0xb8c8c0, 0.08).setDepth(6.7); this.tweens.add({ targets: b, x: b.x + 120, alpha: 0, duration: 4000, onComplete: () => b.destroy() }); }
      } else if (neige) {
        const x = Phaser.Math.Between(-40, 1000);
        const f = this.add.circle(x, -8, 1.5 + Math.random() * 2, 0xffffff, 0.85).setDepth(6.8);
        this.tweens.add({ targets: f, y: 380, x: x + Phaser.Math.Between(-60, 20), duration: 3500 + Math.random() * 2500, ease: 'Linear', onComplete: () => f.destroy() });
      } else if (foret) {
        if (Math.random() < 0.5) return;
        const x = Phaser.Math.Between(0, 1000);
        const f = this.add.ellipse(x, -6, 6, 3, Phaser.Utils.Array.GetRandom([0xc8a040, 0xa86a28, 0x7a9a30]), 0.9).setDepth(6.8);
        this.tweens.add({ targets: f, y: 375, x: x - 120, angle: 720, duration: 5000 + Math.random() * 2000, ease: 'Sine.easeIn', onComplete: () => f.destroy() });
      } else if (ombre) {
        if (Math.random() < 0.6) return;
        const b = this.add.ellipse(Phaser.Math.Between(-100, 1000), Phaser.Math.Between(240, 340), 220, 50, 0x3a2a48, 0.12).setDepth(6.7);
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
    if (this.parti.resultat.vivant) Son.ambiance(sombre ? 'recitPeur' : 'recitEtonne');
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
    const humain = (bx, teinte) => {
      const h = ajouter(imageCorps(this, 1040, sol, { nom: 'Brigand ' + bx, race: 'humain', niveau: 'aguerri' }, 6).setFlipX(true).setTint(teinte).setDepth(2));
      this.tweens.add({ targets: h, x: bx, duration: 1100, ease: 'Sine.easeOut' });
      pasDeMarche(this, h, 1100);
      h.base = { x: bx, y: sol };
      this.menace.sorte = 'bete';
      this.menace.sprites.push(h);
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
      case 'mortvivant': [0, 70].forEach(dx => bete('squeletteHD', x + 130 + dx, 2.4)); break;
      case 'bandits': [0, 60].forEach(dx => humain(x + 120 + dx, 0x6a5a66)); break;
      case 'pillards': [0, 60, 120].forEach(dx => humain(x + 110 + dx, 0x8a6a50)); break;
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
        const flamme = ajouter(this.add.sprite(feu.x, sol - 14, 'flammeBougie0').setOrigin(0.5, 1).setScale(5).setDepth(2.1).play('flammeBougie'));
        const lueur = ajouter(this.add.image(feu.x, sol - 30, 'halo').setScale(3).setTint(0xffa040).setAlpha(0.45).setBlendMode(Phaser.BlendModes.ADD).setDepth(8));
        this.tweens.add({ targets: lueur, alpha: 0.3, scale: 2.7, duration: 300, yoyo: true, repeat: -1 });
        // Des yeux jaunes qui brillent dans le noir...
        for (const [ex, ey] of [[x + 150, 290], [x + 230, 300], [x + 300, 280]]) {
          const yeux = ajouter(this.add.text(ex, ey, '• •', style(14, '#ffd040', { fontStyle: 'bold', brut: true })).setOrigin(0.5).setDepth(8).setAlpha(0));
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
        const serpent = ajouter(this.add.text(this.perso.x + 40, sol - 6, '〰', style(30, '#4a8a2a', { fontStyle: 'bold', brut: true })).setOrigin(0.5, 1).setDepth(3));
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
        // Une pause au coin du feu : le feu s'allume à côté de lui, la lumière baisse, il mange
        if (id === 'ration') {
          const feu = this.add.image(p.x - 70, sol + 2, 'feuCampHD').setOrigin(0.5, 1).setScale(0).setDepth(2);
          const flamme = this.add.sprite(feu.x, sol - 14, 'flammeBougie0').setOrigin(0.5, 1).setScale(0).setDepth(2.1).play('flammeBougie');
          const lueur = this.add.image(feu.x, sol - 30, 'halo').setScale(0).setTint(0xffa040).setAlpha(0.45).setBlendMode(Phaser.BlendModes.ADD).setDepth(8);
          this.decor.add([feu, flamme, lueur]);
          Son.jouer('feu');
          this.tweens.add({ targets: feu, scale: 2.5, duration: 300, ease: 'Back.easeOut' });
          this.tweens.add({ targets: flamme, scale: 5, duration: 400, delay: 200, ease: 'Back.easeOut' });
          this.tweens.add({ targets: lueur, scale: 3, duration: 500, delay: 200 });
          this.tweens.add({ targets: lueur, alpha: 0.3, scale: 2.7, duration: 300, yoyo: true, repeat: -1, delay: 700 });
          this.tweens.add({ targets: this.voile, fillAlpha: Math.min(0.6, this.voile.fillAlpha + 0.3), duration: 600 });
          this.cadrer(p.x - 20, 280, 1.3, 700);
          for (let k = 0; k < 10; k++) { const e = this.add.image(feu.x + Phaser.Math.Between(-8, 8), sol - 30, 'lueurHD').setScale(0.7).setTint(0xffa040).setBlendMode(Phaser.BlendModes.ADD).setDepth(7); this.decor.add(e); this.tweens.add({ targets: e, y: sol - 110 - Math.random() * 40, x: e.x + Phaser.Math.Between(-20, 20), alpha: 0, duration: 1200, delay: 300 + k * 120, onComplete: () => e.destroy() }); }
          await this.attendre(700);
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
        this.onomatopee(betes[0].x, sol - 150, 'OUSTE !', '#b8f0a0');
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
        this.tweens.add({ targets: this.paysage, x: this.paysage.x - 20, duration: 600 });
        await Promise.all([
          this.animer({ targets: p, x: x1, duration: 600, ease: 'Linear' }),
          this.animer({ targets: p, y: y0 - 70, duration: 300, yoyo: true, ease: 'Quad.easeOut' }),
        ]);
        p.setY(y0);
        this.onomatopee(x1, sol - 150, 'HOP !', '#b8f0a0');
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
      if (this.eauRecit) this.eauRecit.destroy();
      this.eauRecit = eauRecitHD(this, X + 110, bas, 210, 40).setDepth(1.05);
      // les rapides : des traînées d'écume qui filent, des rochers qui fendent le courant
      for (const [rx, ry] of [[X + 70, bas - 26], [X + 150, bas - 22]]) {
        const roc = ajouter(this.add.ellipse(rx, ry, 26, 12, 0x3a3430).setDepth(1.08));
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
    const arbre = ajouter(this.add.graphics().setDepth(1.3));
    arbre.lineStyle(14, 0x4a3420).beginPath().moveTo(X + 262, haut).lineTo(X + 252, haut - 80).lineTo(X + 236, haut - 150).strokePath();
    arbre.lineStyle(8, 0x5a4028).beginPath().moveTo(X + 246, haut - 104).lineTo(X + 180, haut - 112).lineTo(br.x, br.y).strokePath();
    for (const [lx, ly, r] of [[X + 236, haut - 165, 34], [X + 266, haut - 150, 26], [X + 206, haut - 150, 24], [X + 150, haut - 126, 18], [X + 112, haut - 124, 14], [X + 250, haut - 190, 24]]) {
      arbre.fillStyle(0x2f5a2a).fillCircle(lx, ly, r); arbre.fillStyle(0x3f7a34).fillCircle(lx - r * 0.25, ly - r * 0.25, r * 0.7);
    }
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
    const main = () => ({ x: p.x + 8, y: p.y - p.displayHeight * 0.72 });
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
      const m0 = { x: p.x + 8, y: p.y - p.displayHeight * 0.72 };
      const r = Math.hypot(m0.x - br.x, m0.y - br.y), a0 = Math.atan2(m0.y - br.y, m0.x - br.x);
      const a1 = Math.PI - a0, ecart = p.displayHeight * 0.72;
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
    this.onomatopee(p.x, p.y - 140, 'HOP !', '#b8f0a0');
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
      for (let k = 0; k < 16; k++) { const g = this.add.circle(p.x + (Math.random() - 0.5) * 20, fond - 10, 2 + Math.random() * 2, 0xe8fcff, 0.9).setDepth(4); this.decor.add(g); const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.8, v = 30 + Math.random() * 50; this.tweens.add({ targets: g, x: g.x + Math.cos(a) * v, y: g.y + Math.sin(a) * v, duration: 300, yoyo: true, ease: 'Quad.easeOut', onComplete: () => g.destroy() }); }
      p.setAlpha(0.6);
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
