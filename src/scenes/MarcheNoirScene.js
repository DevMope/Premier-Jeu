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
    this.dessinerCave();
    this.dessinerGens();
    this.add.text(480, 26, 'Le marché noir', style(26, '#ff9a70', { fontStyle: 'bold', stroke: '#1a0806', strokeThickness: 5 })).setOrigin(0.5).setDepth(5);
    this.texteBourse = this.add.text(940, 26, '', style(16, '#f3d98a', { fontStyle: 'bold', stroke: '#1a0806', strokeThickness: 4 })).setOrigin(1, 0.5).setDepth(5);
    this.add.image(480, 452, panneauHD(this, 940, 170, 'ardoise')).setScale(2).setDepth(4);
    this.elements = [];
    this.majBourse();
    if (G.marcheNoir.entre) this.accueil(); else this.porte();
    this.time.delayedCall(900, () => conseilGarrick(this, 'marcheNoir', true));
  }

  majBourse() { this.texteBourse.setText(`${this.G.argent} p.`); }

  // --- Le décor : des murs de pierre, des lanternes rouges, des tonneaux, un chat noir ---
  dessinerCave() {
    const g = this.add.graphics();
    g.fillStyle(0x140e12).fillRect(0, 0, 960, 540);
    for (let y = 0; y < 370; y += 22) for (let x = -((y / 22) % 2) * 26; x < 960; x += 52) {
      const t = hachage(Math.floor(x / 52), Math.floor(y / 22), 41);
      g.fillStyle(t > 0.6 ? 0x2c2226 : t > 0.3 ? 0x261d21 : 0x211a1d).fillRect(x + 1, y + 1, 50, 20);
    }
    g.fillStyle(0x1e1513).fillRect(0, 360, 960, 180);
    for (let x = 0; x < 960; x += 64) g.fillStyle(0x281c18).fillRect(x, 360, 62, 180);
    // Une voûte au fond, et l'escalier par lequel on est descendu
    g.fillStyle(0x0a0608).fillEllipse(480, 140, 300, 220).fillRect(330, 140, 300, 220);
    for (let i = 0; i < 6; i++) g.fillStyle(0x2a201e - i * 0x020202).fillRect(400 + i * 8, 250 + i * 18, 160 - i * 16, 18);
    creerAccessoiresFacade(this);
    this.add.image(880, 372, 'tonneauxHD').setOrigin(0.5, 1).setScale(2.2).setTint(0x9a7a7a);
    this.add.image(60, 372, 'tonneauxHD').setOrigin(0.5, 1).setScale(1.8).setTint(0x8a6a6a).setFlipX(true);
    // Les lanternes rouges, qui vacillent
    creerHalo(this);
    for (const [x, y] of [[170, 70], [480, 52], [790, 70]]) {
      g.lineStyle(2, 0x3a2a20).lineBetween(x, 0, x, y - 14);
      g.fillStyle(0x3a1a10).fillRect(x - 9, y - 14, 18, 4).fillRect(x - 9, y + 12, 18, 4);
      g.fillStyle(0xc0321e).fillRect(x - 7, y - 10, 14, 22);
      g.fillStyle(0xff8040).fillRect(x - 2, y - 4, 4, 9);
      const halo = this.add.image(x, y, 'halo').setScale(3.2).setTint(0xff4a20).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: halo, alpha: 0.2, scale: 2.9, duration: 500 + Math.random() * 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    // Le chat noir, sur un tonneau : deux yeux jaunes qui clignent, une queue qui balance
    const chat = this.add.container(860, 300);
    const c = this.add.graphics();
    c.fillStyle(0x0a080a).fillEllipse(0, 0, 26, 18).fillCircle(-11, -10, 8).fillTriangle(-17, -16, -14, -24, -11, -16).fillTriangle(-9, -16, -6, -24, -4, -15);
    const yeux = this.add.graphics(); yeux.fillStyle(0xf0d040).fillRect(-15, -12, 3, 2).fillRect(-9, -12, 3, 2);
    const queue = this.add.graphics(); queue.lineStyle(4, 0x0a080a).beginPath().moveTo(12, 2).lineTo(20, -6).lineTo(18, -16).strokePath();
    chat.add([queue, c, yeux]);
    this.tweens.add({ targets: queue, angle: 14, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.time.addEvent({ delay: 3200, loop: true, callback: () => { yeux.setVisible(false); this.time.delayedCall(140, () => yeux.setVisible(true)); } });
    vignette(this, 0.9, 3);
  }

  // Le Passeur à gauche, les deux Bannis à droite
  dessinerGens() {
    this.passeur = imageCorps(this, 210, 368, 'passeur', 5.2).setTint(0xd8b8b0);
    this.soiree.bannis.forEach((b, i) => {
      const img = imageCorps(this, 640 + i * 130, 368, b, 4.6).setFlipX(true).setTint(0xd8b0a8);
      this.tweens.add({ targets: img, y: 366, duration: 1400 + i * 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    });
    // Certains soirs, un aîné des Bannis est assis près des tonneaux, appuyé sur sa canne
    if (this.soiree.aine && !(this.G.ainesRecits || []).includes(this.soiree.aine)) {
      this.aine = imageCorps(this, 112, 372, personneAine(this.soiree.aine), 4).setTint(0xd8b8b0);
    }
  }

  // --- Le panneau du bas : une page à la fois ---
  vider() { for (const e of this.elements) e.destroy(); this.elements = []; }
  texte(x, y, t, taille = 15, couleur = '#f3e6c8', extra = {}) { const o = this.add.text(x, y, t, style(taille, couleur, extra)).setDepth(6); this.elements.push(o); return o; }
  bouton(x, y, l, t, action, actif = true) {
    const fond = this.add.rectangle(x, y, l, 28, actif ? 0x7a2a1a : 0x3a2a26).setStrokeStyle(2, 0x1a0806).setDepth(6);
    const label = this.add.text(x, y, t, style(13, actif ? '#fff0dc' : '#8a7a70', { fontStyle: 'bold' })).setOrigin(0.5).setDepth(6);
    if (actif) { fond.setInteractive({ useHandCursor: true }); fond.on('pointerdown', () => { Son.jouer('clic'); action(); }); fond.on('pointerover', () => fond.setFillStyle(0x9a3a24)); fond.on('pointerout', () => fond.setFillStyle(0x7a2a1a)); }
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
    const mainNoire = G.mal >= SEUIL_MAIN_NOIRE || palierCamp(G) <= -2;
    const choix = [['Le Passeur (objets interdits)', () => this.pagePasseur()], ['Les commandes des Bannis', () => this.pageCommandes()], ['Vendre une trouvaille', () => this.pageTrouvailles()]];
    if (mainNoire) choix.push(['La table du fond', () => this.pageMainNoire()]);
    const aine = s.aine && !(G.ainesRecits || []).includes(s.aine) ? AINES[s.aine] : null;
    if (aine) {
      this.texte(40, 424, `Près des tonneaux, ${aine.nom} tapote sa canne : « Tu as un peu de temps pour une vieille histoire ? »`, 12, '#e8c890', { fontStyle: 'italic', wordWrap: { width: 880 } });
      choix.push([aine.feminin ? "Écouter l'aïeule" : "Écouter l'aïeul", () => this.pageAine()]);
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
    const voile = this.add.rectangle(480, 270, 960, 540, 0x08050a).setAlpha(0).setDepth(3);
    creerVignettesZonesHD(this);
    const souvenir = this.add.image(600, 196, 'vignetteZone_' + a.vignette).setScale(6.4).setDepth(3.2).setAlpha(0).setTint(0xc8a878);
    const conteur = this.add.image(190, 82, textureBusteHD(this, personneAine(race), 'neutre')).setOrigin(0.5, 0).setScale(2.6).setDepth(3.3).setAlpha(0);
    const nom = this.add.text(190, 64, a.nom, style(18, '#f3d98a', { fontStyle: 'bold', stroke: '#1a0806', strokeThickness: 4 })).setOrigin(0.5).setDepth(3.4).setAlpha(0);
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
