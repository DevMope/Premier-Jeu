// Étape 9e. Le marché noir : certains soirs, un papier glissé sous la porte donne un mot de passe.
// La porte dérobée de l'arrière-boutique descend dans une cave aux lanternes rouges : le Passeur y
// vend des objets interdits, deux Bannis y passent commande, on y vend ses trouvailles sans
// questions. Plus tard, la Main Noire tient la table du fond. Chaque affaire augmente le risque
// qu'une plainte fasse venir la garde le lendemain.
class MarcheNoirScene extends Phaser.Scene {
  constructor() { super('MarcheNoir'); }

  create() {
    const G = this.G = window.GAME;
    this.cameras.main.fadeIn(600);
    this.soiree = soireeMarcheNoir(G);
    this.mainNoireOuverte = G.mal >= SEUIL_MAIN_NOIRE || palierCamp(G) <= -2;
    // (v0.57) La cave a trois coins côte à côte : les doyens, les voyageurs (l'arrivée), la Main Noire
    this.coin = 1;
    this.cameras.main.setScroll(960, 0);
    this.dessinerCave();
    this.dessinerGens();
    const fixe = o => o.setScrollFactor(0);
    this.titreCoin = fixe(this.add.text(480, 26, 'Le marché noir', style(26, '#ff9a70', { fontStyle: 'bold', stroke: '#1a0806', strokeThickness: 5 })).setOrigin(0.5).setDepth(5));
    this.texteBourse = fixe(this.add.text(940, 26, '', style(16, '#f3d98a', { fontStyle: 'bold', stroke: '#1a0806', strokeThickness: 4 })).setOrigin(1, 0.5).setDepth(5));
    fixe(this.add.image(480, 452, panneauHD(this, 940, 170, 'ardoise')).setScale(2).setDepth(4));
    this.fleches();
    this.elements = [];
    this.majBourse();
    if (G.marcheNoir.entre) this.accueil(); else this.porte();
    this.time.delayedCall(900, () => conseilGarrick(this, 'marcheNoir', true));
  }

  majBourse() { this.texteBourse.setText(`${this.G.argent} p.`); }

  // --- Le décor : les trois coins de la cave (voir caveHD.js) ---
  dessinerCave() {
    creerCaveHD(this);
    creerAccessoiresFacade(this);
    creerInterieurHD(this);
    creerHalo(this);
    this.add.image(0, 0, 'caveFond').setOrigin(0).setScale(2);
    // Chez les voyageurs : les lanternes rouges qui vacillent, les tonneaux, les caisses de contrebande
    const g = this.add.graphics();
    for (const [x, y] of [[1130, 70], [1440, 40], [1750, 70]]) {
      g.lineStyle(2, 0x3a2a20).lineBetween(x, 0, x, y - 14);
      g.fillStyle(0x3a1a10).fillRect(x - 9, y - 14, 18, 4).fillRect(x - 9, y + 12, 18, 4);
      g.fillStyle(0xc0321e).fillRect(x - 7, y - 10, 14, 22);
      g.fillStyle(0xff8040).fillRect(x - 2, y - 4, 4, 9);
      const halo = this.add.image(x, y, 'halo').setScale(3.4).setTint(0xff4a20).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: halo, alpha: 0.2, scale: 3.1, duration: 500 + Math.random() * 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    this.add.image(1850, 370, 'tonneauxHD').setOrigin(0.5, 1).setScale(2.4).setTint(0x9a7a7a);
    this.add.image(1050, 370, 'caissesContrebande').setOrigin(0.5, 1).setScale(2.4).setTint(0xb09090);
    // Le chat noir, sur un tonneau : deux yeux jaunes qui clignent, une queue qui balance
    const chat = this.add.container(1830, 296);
    const c = this.add.graphics();
    c.fillStyle(0x0a080a).fillEllipse(0, 0, 26, 18).fillCircle(-11, -10, 8).fillTriangle(-17, -16, -14, -24, -11, -16).fillTriangle(-9, -16, -6, -24, -4, -15);
    const yeux = this.add.graphics(); yeux.fillStyle(0xf0d040).fillRect(-15, -12, 3, 2).fillRect(-9, -12, 3, 2);
    const queue = this.add.graphics(); queue.lineStyle(4, 0x0a080a).beginPath().moveTo(12, 2).lineTo(20, -6).lineTo(18, -16).strokePath();
    chat.add([queue, c, yeux]);
    this.tweens.add({ targets: queue, angle: 14, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.time.addEvent({ delay: 3200, loop: true, callback: () => { yeux.setVisible(false); this.time.delayedCall(140, () => yeux.setVisible(true)); } });
    // Chez les doyens : le feu de camp, et la lueur des petites fenêtres
    this.add.image(400, 374, 'feuCamp').setOrigin(0.5, 1).setScale(2.4);
    for (const [dx, e] of [[-10, 3.4], [6, 4], [16, 3]]) {
      const f = this.add.sprite(400 + dx, 358, 'flammeBougie0').setOrigin(0.5, 1).setScale(e).setTint(0xffb060);
      f.play({ key: 'flammeBougie', startFrame: Math.floor(Math.random() * 3) });
    }
    lumiere(this, 400, 330, 260, 0xff8a30, 0.5);
    for (const [x, y] of [[260, 244], [708, 238], [490, 102]]) lumiere(this, x, y, 50, 0xffb050, 0.45);
    // Chez la Main Noire : deux chandelles sur la table, l'emblème sur la tenture
    creerEmblemesHD(this);
    this.add.image(2440, 128, 'embleme_mainNoire').setScale(2.6);
    for (const x of [2350, 2530]) lumiere(this, x, 300, 120, 0xffc070, 0.5);
    vignette(this, 0.85, 3).setScrollFactor(0);
  }

  // Les gens : le Passeur et deux Bannis chez les voyageurs ; les familles bannies chez les
  // doyens (et l'aîné du soir, près du feu) ; les gardes orcs et la silhouette de la Main Noire
  dessinerGens() {
    const G = this.G;
    this.passeur = imageCorps(this, 1170, 370, 'passeur', 6.4).setTint(0xd8b8b0);
    this.soiree.bannis.forEach((b, i) => {
      const img = imageCorps(this, 1600 + i * 150, 370, b, 5.8).setFlipX(true).setTint(0xd8b0a8);
      this.tweens.add({ targets: img, y: 368, duration: 1400 + i * 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    });
    // Les familles des doyens : un enfant gobelin, une mère orc qui étend le linge, un vieux troll qui somnole
    const habitants = [
      [{ nom: 'Pipou', race: 'gobelin', niveau: 'novice' }, 150, 4.2, 0xc8b0a0],
      [{ nom: 'Grenouille', race: 'gobelin', feminin: true, niveau: 'novice' }, 560, 3.9, 0xc8b0a0],
      [{ nom: 'Ourga Lavandière', race: 'orc', feminin: true, niveau: 'novice' }, 800, 5.6, 0xb8a098],
    ];
    habitants.forEach(([p, x, e, tint], i) => {
      const img = imageCorps(this, x, 370, p, e).setTint(tint).setFlipX(i === 2);
      this.tweens.add({ targets: img, y: 367, duration: 1600 + i * 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    });
    // Certains soirs, un aîné des Bannis est assis près du feu, appuyé sur sa canne
    if (this.soiree.aine && !(G.ainesRecits || []).includes(this.soiree.aine)) {
      this.aine = imageCorps(this, 470, 370, personneAine(this.soiree.aine), 5.2).setTint(0xe8c8b0).setFlipX(true);
    }
    // La Main Noire : une silhouette encapuchonnée derrière sa table, deux gardes orcs
    this.add.image(2440, 350, corpsHD(this, 'passeur')).setOrigin(0.5, 1).setScale(6.6 * echelleCorps(corpsHD(this, 'passeur'))).setTint(0x3a2830);
    this.add.image(2440, 392, 'tableMainNoire').setOrigin(0.5, 1).setScale(2.2);
    [[2150, false], [2730, true]].forEach(([x, flip], i) => imageCorps(this, x, 370, { nom: i ? 'Krug Briseur' : 'Mog Poing-de-Fer', race: 'orc', niveau: 'veteran' }, 6.2).setFlipX(flip).setTint(0xc8a8a0));
    // Tant que la Main Noire ne s'intéresse pas à toi, le rideau est gardé
    if (!this.mainNoireOuverte) this.garde = imageCorps(this, 2000, 370, { nom: 'Mog Poing-de-Fer', race: 'orc', niveau: 'veteran' }, 6.4).setFlipX(true).setTint(0xc8a8a0);
  }

  // --- Les flèches pour aller d'un coin à l'autre ---
  fleches() {
    const noms = ['Le coin des doyens', 'Les voyageurs', 'La table du fond'];
    const fleche = (sens) => {
      const x = sens < 0 ? 26 : 934;
      const fond = this.add.circle(x, 200, 20, 0x2a1810, 0.85).setStrokeStyle(2, 0xc9a227).setScrollFactor(0).setDepth(5).setInteractive({ useHandCursor: true });
      const signe = this.add.text(x, 200, sens < 0 ? '◀' : '▶', style(18, '#f3d98a', { fontStyle: 'bold' })).setOrigin(0.5).setScrollFactor(0).setDepth(5);
      const nom = this.add.text(x + (sens < 0 ? 26 : -26), 200, '', style(13, '#f3d98a', { fontStyle: 'italic bold', stroke: '#1a0806', strokeThickness: 4 })).setOrigin(sens < 0 ? 0 : 1, 0.5).setScrollFactor(0).setDepth(5);
      fond.on('pointerdown', () => { Son.jouer('clic'); this.allerCoin(this.coin + sens); });
      return { fond, signe, nom };
    };
    this.flecheG = fleche(-1); this.flecheD = fleche(1);
    this.majFleches = () => {
      for (const [f, sens] of [[this.flecheG, -1], [this.flecheD, 1]]) {
        const cible = this.coin + sens, ok = cible >= 0 && cible <= 2;
        f.fond.setVisible(ok); f.signe.setVisible(ok); f.nom.setVisible(ok).setText(ok ? noms[cible] : '');
      }
      this.titreCoin.setText(['Le coin des doyens', 'Le marché noir', 'La table de la Main Noire'][this.coin]);
    };
    this.majFleches();
  }

  allerCoin(coin, apres = null) {
    coin = Phaser.Math.Clamp(coin, 0, 2);
    if (coin === this.coin) { if (apres) apres(); return; }
    this.coin = coin;
    Son.jouer('pas');
    this.tweens.add({ targets: this.cameras.main, scrollX: coin * 960, duration: 900, ease: 'Sine.easeInOut', onComplete: () => { if (apres) apres(); } });
    this.majFleches();
    // le garde orc arrête ceux que la Main Noire n'a pas invités
    if (coin === 2 && !this.mainNoireOuverte) this.time.delayedCall(900, () => { if (this.coin === 2) this.accueil("Un orc énorme te barre le passage : « La table du fond, c'est sur invitation. Reviens quand on parlera de toi, marchand. »"); });
    if (coin === 0 && !this.aine) this.time.delayedCall(900, () => { if (this.coin === 0) this.accueil('Le feu crépite. Une vieille gobeline te sourit sans un mot : ce soir, aucun aîné ne raconte.'); });
  }

  // --- Le panneau du bas : une page à la fois ---
  vider() { for (const e of this.elements) e.destroy(); this.elements = []; }
  texte(x, y, t, taille = 15, couleur = '#f3e6c8', extra = {}) { const o = this.add.text(x, y, t, style(taille, couleur, extra)).setDepth(6).setScrollFactor(0); this.elements.push(o); return o; }
  bouton(x, y, l, t, action, actif = true) {
    // (v0.57) les mêmes plaques de bois doré que partout ailleurs dans le jeu
    const cle = plaqueBouton(this, l);
    const fond = this.add.image(x, y, cle).setScale(2, 1.6).setDepth(6).setScrollFactor(0).setAlpha(actif ? 1 : 0.55);
    const label = this.add.text(x, y, t, style(13, actif ? '#fff0d0' : '#c8b8a0', { fontStyle: 'bold', stroke: '#24140a', strokeThickness: 3 })).setOrigin(0.5).setDepth(6).setScrollFactor(0);
    if (actif) {
      fond.setInteractive({ useHandCursor: true });
      fond.on('pointerdown', () => { Son.jouer('clic'); fond.setTexture(cle + '_enfonce'); this.time.delayedCall(110, () => fond.active && fond.setTexture(cle)); action(); });
      fond.on('pointerover', () => fond.setTexture(cle + '_clair'));
      fond.on('pointerout', () => fond.setTexture(cle));
    }
    this.elements.push(fond, label);
    return fond;
  }

  // La porte : le mot de passe
  porte() {
    const G = this.G;
    this.vider();
    this.texte(40, 382, 'Trois coups contre la trappe. Une voix, derrière : « Le mot de passe ? »', 16, '#f3d9b0', { fontStyle: 'italic' });
    this.texte(40, 408, `(Le papier glissé sous ta porte disait : ${G.marcheNoir.mot}.)`, 12, '#b89a80', { fontStyle: 'italic' });
    const mots = Phaser.Utils.Array.Shuffle([G.marcheNoir.mot, ...Phaser.Utils.Array.Shuffle(MARCHE_NOIR.mots.filter(m => m !== G.marcheNoir.mot)).slice(0, 2)]);
    mots.forEach((m, i) => this.bouton(170 + i * 230, 460, 200, `« ${m} »`, () => {
      if (m === G.marcheNoir.mot) { G.marcheNoir.entre = true; Son.jouer('porte'); this.accueil(); }
      else { this.vider(); this.texte(40, 392, "« Pas ce soir, inconnu. » La trappe se referme.", 16, '#f3d9b0', { fontStyle: 'italic' }); this.bouton(480, 470, 220, 'Remonter', () => this.partir(false)); }
    }));
    this.bouton(860, 500, 140, 'Remonter', () => this.partir(false));
  }

  // L'accueil : le Passeur, et ce qu'on peut faire ce soir
  accueil(message = null) {
    const G = this.G, s = this.soiree;
    this.vider();
    const b = s.bannis[0];
    this.texte(40, 374, message || `Le Passeur : « Bienvenue en bas. Ici, personne ne pose de questions. »`, 15, '#f3d9b0', { fontStyle: 'italic', wordWrap: { width: 880 } });
    this.texte(40, 400, `${b.nom} murmure : « ${s.murmure} »`, 12, '#c8a890', { fontStyle: 'italic', wordWrap: { width: 880 } });
    const mainNoire = this.mainNoireOuverte;
    const ici = page => () => this.allerCoin(1, page);
    const choix = [['Le Passeur (objets interdits)', ici(() => this.pagePasseur())], ['Les commandes des Bannis', ici(() => this.pageCommandes())], ['Vendre une trouvaille', ici(() => this.pageTrouvailles())]];
    if (mainNoire) choix.push(['La table du fond', () => this.allerCoin(2, () => this.pageMainNoire())]);
    const aine = s.aine && !(G.ainesRecits || []).includes(s.aine) ? AINES[s.aine] : null;
    if (aine) {
      this.texte(40, 424, `Près du feu des doyens, ${aine.nom} tapote sa canne : « Tu as un peu de temps pour une vieille histoire ? »`, 12, '#e8c890', { fontStyle: 'italic', wordWrap: { width: 880 } });
      choix.push([aine.feminin ? "Écouter l'aïeule" : "Écouter l'aïeul", () => this.allerCoin(0, () => this.pageAine())]);
    }
    const l = 900 / choix.length;
    choix.forEach(([t, a], i) => this.bouton(30 + l * (i + 0.5), 460, l - 14, t, a));
    this.bouton(860, 503, 140, 'Remonter', () => this.partir(true));
    this.texteRisque();
  }

  texteRisque() {
    const r = this.soiree.risque;
    const mot = r <= 0 ? 'La ruelle est calme.' : r < 0.15 ? 'Le chat noir dresse une oreille.' : r < 0.3 ? 'Le chat noir fixe l\'escalier...' : 'Le chat noir crache vers l\'escalier !';
    this.texte(40, 503, mot, 12, r < 0.15 ? '#a89080' : '#ff8a6a', { fontStyle: 'italic' }).setOrigin(0, 0.5);
  }

  // Le Passeur : les objets interdits
  pagePasseur(message = null) {
    const G = this.G;
    this.vider();
    this.texte(40, 374, message || 'Le Passeur ouvre sa cape : des fioles, des livres, des choses sans nom.', 14, '#f3d9b0', { fontStyle: 'italic' });
    Object.entries(INTERDITS).forEach(([id, o], i) => {
      const x = 40 + (i % 2) * 450, y = 414 + Math.floor(i / 2) * 36;
      this.elements.push(this.add.image(x + 10, y, iconeObjet(this, id)).setScale(2).setDepth(6));
      this.texte(x + 32, y, `${o.nom} · ${o.prix} p. (tu en as ${G.interdits[id] || 0})`, 13, '#f3e6c8', { fontStyle: 'bold' }).setOrigin(0, 0.5);
      this.bouton(x + 380, y, 90, 'Acheter', () => {
        const e = acheterInterdit(G, id);
        if (!e) Son.jouer('achat');
        this.majBourse();
        this.pagePasseur(e || `« Bon choix. » ${o.nom} rejoint ta cachette.`);
      }, peutPayer(G, o.prix));
    });
    this.bouton(860, 503, 140, '◂ Retour', () => this.accueil());
  }

  // Les commandes des Bannis
  pageCommandes(message = null) {
    const G = this.G, s = this.soiree;
    this.vider();
    this.texte(40, 374, message || 'Les Bannis attendent, dans l\'ombre. Chacun cherche quelque chose.', 14, '#f3d9b0', { fontStyle: 'italic' });
    s.commandes.forEach((c, i) => {
      const y = 418 + i * 38;
      const nom = `${c.banni.nom} (${NOMS_RACES[c.banni.race] || c.banni.race})`;
      this.texte(40, y, `${nom} veut : ${INTERDITS[c.objet].nom.toLowerCase()} · paie ${c.prix} p.`, 13, c.faite ? '#7a9a6a' : '#f3e6c8', { fontStyle: 'bold' }).setOrigin(0, 0.5);
      if (c.faite) this.texte(760, y, 'Affaire faite', 12, '#7a9a6a', { fontStyle: 'italic bold' }).setOrigin(0.5);
      else this.bouton(760, y, 150, 'Lui vendre', () => {
        const e = honorerCommande(G, c);
        if (!e) Son.jouer('pieces');
        this.majBourse();
        this.pageCommandes(e || `${c.banni.nom} glisse ${c.prix} pièces sur le tonneau. « On se reverra, marchand. »`);
      }, (G.interdits[c.objet] || 0) > 0);
    });
    this.bouton(860, 503, 140, '◂ Retour', () => this.accueil());
  }

  // Vendre ses trouvailles, sans questions
  pageTrouvailles(message = null) {
    const G = this.G;
    this.vider();
    const liste = (G.tresors || []).filter(t => !t.reparation).sort((a, b) => prixTresorMarcheNoir(b) - prixTresorMarcheNoir(a)).slice(0, 3);
    this.texte(40, 374, message || (liste.length ? 'Le Passeur soupèse tes trouvailles. « Je paie mieux que les enchères. Et je ne demande pas d\'où ça vient. »' : 'Tu n\'as rien à vendre ce soir (les trouvailles viennent de l\'atelier).'), 14, '#f3d9b0', { fontStyle: 'italic', wordWrap: { width: 880 } });
    liste.forEach((t, i) => {
      const y = 418 + i * 30;
      this.texte(40, y, `${t.nom} (${ETATS[t.etat].nom.toLowerCase()})`, 13, '#f3e6c8', { fontStyle: 'bold' }).setOrigin(0, 0.5);
      this.bouton(640, y, 220, `Vendre ${prixTresorMarcheNoir(t)} p.`, () => {
        const prix = vendreTresorMarcheNoir(G, t);
        Son.jouer('pieces');
        this.majBourse();
        this.pageTrouvailles(`Vendu : ${t.nom}, ${prix} pièces. Personne n'a rien vu.`);
      });
    });
    this.bouton(860, 503, 140, '◂ Retour', () => this.accueil());
  }

  // La table du fond : la Main Noire
  pageMainNoire(message = null) {
    const G = this.G;
    this.vider();
    const pret = PRETS.find(p => p.mal);
    const refus = pret && refusPret(G, pret);
    this.texte(40, 374, message || "À la table du fond, une main gantée de noir bat les cartes. « Tu as besoin d'argent ? La Main Noire prête. Sans questions. Et elle n'oublie jamais. »", 14, '#f3d9b0', { fontStyle: 'italic', wordWrap: { width: 880 } });
    if (pret) {
      const du = Math.round(pret.somme * (1 + tauxPret(G, pret)));
      this.texte(40, 440, `${pret.nom} : reçois ${pret.somme} p., rends ${du} p. en ${pret.jours} nuits.`, 13, '#f3e6c8', { fontStyle: 'bold' }).setOrigin(0, 0.5);
      this.bouton(700, 440, 200, refus || 'Emprunter', () => { emprunter(G, pret); Son.jouer('pieces'); this.majBourse(); this.pageMainNoire('La main gantée pousse une bourse vers toi. « À bientôt. »'); }, !refus);
    }
    this.bouton(860, 503, 140, '◂ Retour', () => this.accueil());
  }

  // Le récit d'un aîné : la cave s'efface, le souvenir apparaît (un tableau qui se colore peu à
  // peu), et l'aîné raconte, page après page. Personne d'autre ne l'écoute, sauf Garrick, d'habitude.
  pageAine() {
    const G = this.G, race = this.soiree.aine, a = AINES[race];
    const scene = [];
    const voile = this.add.rectangle(480, 270, 960, 540, 0x08050a).setAlpha(0).setDepth(3.6).setScrollFactor(0);
    creerVignettesZonesHD(this);
    const souvenir = this.add.image(600, 196, 'vignetteZone_' + a.vignette).setScale(6.4).setDepth(3.7).setAlpha(0).setTint(0xc8a878).setScrollFactor(0);
    const conteur = this.add.image(190, 82, textureBusteHD(this, personneAine(race), 'neutre')).setOrigin(0.5, 0).setScale(2.6).setDepth(3.8).setAlpha(0).setScrollFactor(0);
    const nom = this.add.text(190, 64, a.nom, style(18, '#f3d98a', { fontStyle: 'bold', stroke: '#1a0806', strokeThickness: 4 })).setOrigin(0.5).setDepth(3.9).setAlpha(0).setScrollFactor(0);
    scene.push(voile, souvenir, conteur, nom);
    this.tweens.add({ targets: voile, alpha: 0.88, duration: 900 });
    this.tweens.add({ targets: [conteur, nom], alpha: 1, duration: 900, delay: 300 });
    this.tweens.add({ targets: souvenir, alpha: 0.95, duration: 1600, delay: 700 });
    this.tweens.add({ targets: souvenir, scale: 6.9, x: 590, duration: 26000, ease: 'Sine.easeInOut' });
    Son.jouer('page');
    let page = 0;
    const montrer = () => {
      this.vider();
      // (le souvenir reprend ses couleurs au fil du récit, puis se ternit à la dernière page)
      const fin = page === a.recit.length - 1;
      const teinte = fin ? 0x9a8a80 : [0xc8a878, 0xe0c8a0, 0xf4e8d4, 0xffffff][Math.min(3, page)];
      souvenir.setTint(teinte);
      const txt = this.texte(40, 380, a.recit[page], 15, '#f3e6c8', { fontStyle: 'italic', wordWrap: { width: 880 }, lineSpacing: 4 }).setAlpha(0);
      this.tweens.add({ targets: txt, alpha: 1, duration: 500 });
      Son.jouer('voix', { personne: personneAine(race), duree: Math.min(2.6, 0.5 + a.recit[page].length * 0.01) });
      this.texte(40, 503, `${page + 1} / ${a.recit.length}`, 12, '#a89080').setOrigin(0, 0.5);
      this.bouton(840, 503, 180, fin ? (a.feminin ? 'La remercier' : 'Le remercier') : 'Suite ▸', () => {
        if (!fin) { page++; Son.jouer('page'); montrer(); return; }
        G.ainesRecits = [...new Set([...(G.ainesRecits || []), race])];
        this.tweens.add({ targets: scene, alpha: 0, duration: 900, onComplete: () => scene.forEach(o => o.destroy()) });
        if (this.aine) { this.tweens.add({ targets: this.aine, alpha: 0, duration: 1200 }); }
        this.accueil(`${a.nom} se tait. Le Passeur hausse les épaules : « Les vieux racontent n'importe quoi. » Mais toi, tu te souviendras.`);
      });
    };
    this.time.delayedCall(700, montrer);
    this.vider();
  }

  // Remonter : quelqu'un a-t-il vu la lanterne ?
  partir(entre) {
    const G = this.G;
    if (this.part) return;
    this.part = true;
    const plainte = entre ? quitterMarcheNoir(G) : false;
    this.vider();
    this.texte(480, 420, plainte ? "En remontant, tu crois voir une ombre filer vers la caserne... La garde viendra peut-être demain." : 'Tu remontes sans bruit. La ruelle est calme.', 15, plainte ? '#ff8a6a' : '#f3d9b0', { fontStyle: 'italic' }).setOrigin(0.5);
    Sauvegarde.maintenant(G, 'Nuit');
    this.time.delayedCall(1800, () => {
      this.cameras.main.fadeOut(400);
      this.cameras.main.once('camerafadeoutcomplete', () => { this.scene.stop(); this.scene.resume('Nuit'); });
    });
  }
}
