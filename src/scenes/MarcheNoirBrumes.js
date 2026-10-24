// (v1.01, lot B-3b, planche 22 v3 C et D) La Nuit des Brumes dans la cave du marché noir : des lanternes
// rouges partout (pour honorer les ancêtres), un grand feu au milieu des voyageurs, l'étal des atours des
// ancêtres, la table des osselets de Grik le Rusé, et les Bannis autour du feu. Le grand soir : l'hydromel
// noir, le pain de cendre, l'histoire du Passeur, et la première année le discours de Garrick.
const FEU_BRUMES = 1440;
Object.assign(MarcheNoirScene.prototype, {
  // Une lanterne rouge des ancêtres (ronde, à la chinoise, ses franges dorées), dans le monde de la cave
  lanterneAncetres(g, x, y, e) {
    const halo = this.add.image(x, y, 'halo').setScale(0.9 * e).setTint(0xff4020).setAlpha(0.3).setBlendMode(Phaser.BlendModes.ADD).setDepth(1.5);
    this.tweens.add({ targets: halo, alpha: 0.18, duration: 600 + Math.random() * 600, yoyo: true, repeat: -1 });
    g.fillStyle(0x2a1a10).fillRect(x - 6 * e, y - 16 * e, 12 * e, 4 * e).fillRect(x - 6 * e, y + 12 * e, 12 * e, 3 * e);
    g.fillStyle(0xc81e18).fillEllipse(x, y, 30 * e, 26 * e).fillStyle(0xe8402a).fillEllipse(x - 3 * e, y - 2 * e, 18 * e, 18 * e);
    g.lineStyle(1, 0x8a1010); for (const dx of [-8, 0, 8]) g.lineBetween(x + dx * e, y - 12 * e, x + dx * e, y + 12 * e);
    g.fillStyle(0xf0c040); for (let k = -2; k <= 2; k++) g.fillRect(x + k * 2.5 * e - 0.5, y + 15 * e, 1.5, 10 * e);
  },

  decorBrumes() {
    creerHalo(this);
    const g = this.add.graphics().setDepth(1.6);
    // des guirlandes de lanternes d'un bout à l'autre de la cave
    for (let x0 = 0; x0 < 2880; x0 += 240) {
      const fil = x => 66 + Math.sin((x - x0) / 240 * Math.PI) * 30;
      g.lineStyle(2, 0x2a1a10); g.beginPath(); g.moveTo(x0, fil(x0)); for (let x = x0; x <= x0 + 240; x += 12) g.lineTo(x, fil(x)); g.strokePath();
      for (const dx of [60, 180]) this.lanterneAncetres(g, x0 + dx, fil(x0 + dx) + 20, dx === 60 ? 0.9 : 0.75);
    }
    // des lanternes sur pied autour du feu
    for (const x of [1180, 1700]) { g.lineStyle(3, 0x4a2a14).lineBetween(x, 300, x, 372); this.lanterneAncetres(g, x, 286, 1.2); }
    // le grand feu des ancêtres, au milieu des voyageurs
    this.add.image(FEU_BRUMES, 376, 'feuCamp').setOrigin(0.5, 1).setScale(4).setDepth(2.2);
    for (const [dx, e] of [[-26, 6], [0, 7.5], [24, 5.5], [-10, 4], [14, 4.5]]) {
      const f = this.add.sprite(FEU_BRUMES + dx, 354, 'flammeBougie0').setOrigin(0.5, 1).setScale(e).setTint(0xff9a40).setDepth(2.25);
      f.play({ key: 'flammeBougie', startFrame: Math.floor(Math.random() * 3) });
    }
    lumiere(this, FEU_BRUMES, 320, 340, 0xff7a20, 0.55);
    this.time.addEvent({ delay: 160, loop: true, callback: () => {
      const e = this.add.rectangle(FEU_BRUMES + Phaser.Math.Between(-30, 30), 330, 3, 3, 0xffc040).setDepth(2.3);
      this.tweens.add({ targets: e, y: 180 + Math.random() * 60, x: e.x + Phaser.Math.Between(-20, 20), alpha: 0, duration: 1600 + Math.random() * 900, onComplete: () => e.destroy() });
    } });
    // les Bannis autour du feu : ils se balancent, lèvent parfois leur coupe
    this.fetards = [];
    [['troll', 'Bourk', false, 1250, 5.0], ['orc', 'Ourgha', true, 1320, 5.4], ['vampire', 'Dame Sombreval', true, 1560, 5.2], ['loupgarou', 'Vargr', false, 1630, 5.4], ['momie', 'Nephet', true, 1700, 5.0]].forEach(([race, nom, f, x, e], k) => {
      const qui = { nom, race, feminin: f, niveau: 'aguerri' };
      const img = imageCorps(this, x, 372, qui, e).setFlipX(x > FEU_BRUMES).setTint(0xffc8a0).setDepth(2.1);
      img.qui = qui;
      this.tweens.add({ targets: img, y: 369, duration: 900 + k * 170, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.fetards.push(img);
    });
    this.time.addEvent({ delay: 2600, loop: true, callback: () => {
      const f = Phaser.Utils.Array.GetRandom(this.fetards);
      if (!f || !f.active) return;
      f.setTexture(corpsHD(this, f.qui, 'leves'));
      this.time.delayedCall(900, () => f.active && f.setTexture(corpsHD(this, f.qui)));
    } });
    // la brume des ancêtres, au ras du sol
    for (let k = 0; k < 3; k++) { const b = this.add.rectangle(1440, 378 - k * 10, 2880, 22, 0xb8b0c8, 0.1).setDepth(2.4); this.tweens.add({ targets: b, x: 1440 + (k % 2 ? 40 : -40), duration: 4000 + k * 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }); }
    // l'étal des atours des ancêtres
    const t = this.add.graphics().setDepth(2.6);
    t.fillStyle(0x2a1a10).fillRect(1030, 318, 130, 56).lineStyle(2, 0x8a1a1a).strokeRect(1030, 318, 130, 56);
    t.fillStyle(0x4a2a1a).fillRect(1030, 312, 130, 8);
    t.fillStyle(0xe8dcc0).fillEllipse(1056, 338, 22, 26).fillStyle(0x1a1008).fillEllipse(1051, 335, 5, 6).fillEllipse(1061, 335, 5, 6);
    t.fillStyle(0x6a6a7a).fillRect(1084, 324, 26, 30); t.fillStyle(0xc81e18).fillCircle(1136, 340, 9);
    this.add.text(1095, 390, 'Atours des ancêtres', style(11, '#f3d9b0', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 4 })).setOrigin(0.5).setDepth(2.7);
    // la table des osselets, et Grik le Rusé derrière
    imageCorps(this, 1810, 352, { nom: 'Grik le Rusé', race: 'gobelin', niveau: 'aguerri' }, 4.6).setFlipX(true).setTint(0xffc8a0).setDepth(2.5);
    t.fillStyle(0x3a2414).fillEllipse(1790, 360, 150, 36).fillStyle(0x5a3a20).fillEllipse(1790, 354, 140, 28);
    for (let k = 0; k < 5; k++) t.fillStyle(0xe8dcc0).fillRoundedRect(1750 + k * 15, 348 + (k % 2) * 4, 9, 7, 2);
    this.add.text(1790, 390, 'Les osselets', style(11, '#f3d9b0', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 4 })).setOrigin(0.5).setDepth(2.7);
  },

  // --- La page de la fête ---
  pageBrumes(message = null) {
    const G = this.G, s = etatBrumes(G), grand = grandSoirBrumes(G);
    this.fermerVue(); this.vider(); this.allerCoin(1);
    this.titreCoin.setText('La Nuit des Brumes');
    this.texte(40, 374, message || (grand ? "Le grand soir. Le feu monte haut, les Bannis chantent pour leurs morts, une coupe d'hydromel noir passe de main en main." : 'Les lanternes rouges des ancêtres brillent partout dans la cave. Ce soir, on honore ceux qui reposent dans les brumes.'), 14, '#f3d9b0', { fontStyle: 'italic', wordWrap: { width: 880 } });
    const choix = [['Les osselets de Grik', () => this.pageOsselets()], ['Atours des ancêtres', () => this.pageAtoursAncetres()], ['Les lanternes pour tes morts', () => this.pageLanternesMorts()]];
    if (grand) choix.push(['Le grand feu', () => this.pageGrandFeu()]);
    const l = 900 / choix.length;
    choix.forEach(([t, a], i) => this.bouton(30 + l * (i + 0.5), 452, l - 14, t, a));
    if (grand && !s.passeur) this.bouton(330, 500, 260, 'Écouter le Passeur', () => { s.passeur = true; Son.jouer('voix', { personne: FIGURANTS.passeur, ton: 'neutre' }); this.pageBrumes(`Le Passeur, les yeux dans le feu : ${HISTOIRE_PASSEUR}`); });
    this.bouton(860, 500, 140, '◂ Retour', () => this.accueil());
  },

  pageAtoursAncetres(message = null) {
    const G = this.G;
    this.fermerVue(); this.vider(); this.allerCoin(1); this.titreCoin.setText('Les atours des ancêtres');
    this.texte(40, 374, message || "Une vieille momie tient l'étal : « On s'habille comme eux, pour qu'ils reconnaissent les vivants. »", 14, '#f3d9b0', { fontStyle: 'italic', wordWrap: { width: 880 } });
    ATOURS_ANCETRES.forEach((id, i) => {
      const d = GARDE_ROBE[id], y = 414 + i * 30;
      this.elements.push(this.add.image(52, y, iconeObjet(this, id)).setScale(1.8).setDepth(6).setScrollFactor(0));
      this.texte(76, y, `${d.nom} · ${d.prix} p.`, 13, '#f3e6c8', { fontStyle: 'bold' }).setOrigin(0, 0.5);
      if (possede(G, id)) this.texte(420, y, porte(G, id) ? 'tu l\'as sur toi' : 'dans ta malle', 12, '#9ac080', { fontStyle: 'italic' }).setOrigin(0, 0.5);
      else this.bouton(470, y, 110, 'Acheter', () => { const e = acheterTenue(G, id); if (!e) Son.jouer('achat'); this.majBourse(); this.pageAtoursAncetres(e || `${d.nom} : tu l'arbores dès ce soir. Les Bannis hochent la tête.`); }, peutPayer(G, d.prix));
    });
    this.texte(620, 430, "Portés pendant la fête : les clients de l'ombre t'en aiment un peu plus (+1 de relation).", 11, '#c8a890', { fontStyle: 'italic', wordWrap: { width: 300 } });
    this.bouton(860, 500, 140, '◂ La fête', () => this.pageBrumes());
  },

  // --- Les osselets (planche 22 v3 D) ---
  pageOsselets(message = null) {
    const G = this.G, reste = partiesOsseletsRestantes(G);
    this.ouvrirVue(0.55); this.dessinerTableOsselets(null);
    this.titreCoin.setText('Les osselets de Grik');
    this.vider();
    if (!message && tropJeunePourParier(G)) message = "Grik referme sa main griffue : « Les osselets, c'est pour les grands. Reviens à dix-huit ans, l'ami. »";
    this.texte(40, 374, message || "Grik le Rusé fait rouler cinq osselets dans sa main griffue : « Une petite partie, l'ami ? Le plus beau coup gagne. Paires, brelans, carrés... »", 14, '#f3d9b0', { fontStyle: 'italic', wordWrap: { width: 880 } });
    this.texte(40, 420, `Mise : ${BRUMES.osselets.mise} p. (tu peux miser plus) · une relance · gagné : ta mise doublée · ${reste > 0 ? `encore ${reste} partie${reste > 1 ? 's' : ''} ce soir` : 'plus de partie ce soir'}`, 12, '#e8c890', { fontStyle: 'italic' });
    if (reste > 0 && !tropJeunePourParier(G)) this.bouton(330, 470, 260, `Jouer (${BRUMES.osselets.mise} p.)`, () => {
      const p = commencerOsselets(G);
      if (typeof p === 'string') return this.pageOsselets(p);
      Sauvegarde.maintenant(G, 'Nuit');   // (v1.07 : la mise est jouée, même si l'on recharge)
      Son.jouer('des'); this.majBourse(); this.partieOsselets(p);
    }, peutPayer(G, BRUMES.osselets.mise));
    this.bouton(860, 500, 140, '◂ La fête', () => this.pageBrumes());
  },

  dessinerTableOsselets(p) {
    if (this.tableO) this.tableO.forEach(o => o.destroy());
    this.tableO = [];
    const o = x => { this.vueObj(x, 3.8); this.tableO.push(x); return x; };
    if (!this.decorOsselets) {
      for (let k = 0; k < 8; k++) { this.vueObj(this.add.image(60 + k * 120, 70, 'halo').setScale(1.2).setTint(0xff4020).setAlpha(0.25).setBlendMode(Phaser.BlendModes.ADD), 3.7); const l = this.vueObj(this.add.graphics(), 3.7); this.lanterneAncetres(l, 60 + k * 120, 70, 0.9); }
      const t = this.vueObj(this.add.graphics(), 3.72); t.fillStyle(0x3a2414).fillEllipse(480, 300, 820, 170).fillStyle(0x5a3a20).fillEllipse(480, 292, 790, 145);
      const grik = { nom: 'Grik le Rusé', race: 'gobelin', feminin: false };
      this.grikBuste = this.vueObj(this.add.image(480, 222, textureBusteHD(this, grik, 'content')).setOrigin(0.5, 1).setScale(1.6), 3.71);
      this.tweens.add({ targets: this.grikBuste, y: 218, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.decorOsselets = true;
    }
    if (!p) return;
    // un osselet : un petit os poli, ses points creusés
    const os = (x, y, v, choisi, cache) => {
      const g = o(this.add.graphics());
      g.fillStyle(choisi ? 0xffe08a : 0xe8dcc0).fillRoundedRect(x - 18, y - 13, 36, 26, 8).lineStyle(2, 0x6a4a2a).strokeRoundedRect(x - 18, y - 13, 36, 26, 8);
      if (cache) { g.fillStyle(0x8a6a4a).fillRoundedRect(x - 12, y - 7, 24, 14, 5); return g; }
      const pos = { 1: [[0, 0]], 2: [[-7, -5], [7, 5]], 3: [[-8, -5], [0, 0], [8, 5]], 4: [[-7, -5], [7, -5], [-7, 5], [7, 5]], 5: [[-8, -5], [8, -5], [0, 0], [-8, 5], [8, 5]], 6: [[-9, -5], [0, -5], [9, -5], [-9, 5], [0, 5], [9, 5]] }[v];
      g.fillStyle(0x4a2a14); for (const [dx, dy] of pos) g.fillCircle(x + dx, y + dy, 2.6);
      return g;
    };
    p.gobelin.forEach((v, k) => os(330 + k * 75, 258, v, false, !p.finie));
    p.joueur.forEach((v, k) => {
      const g = os(330 + k * 75, 318, v, p.choisis && p.choisis[k], false);
      if (!p.finie && !p.relance) { const z = o(this.add.rectangle(330 + k * 75, 318, 38, 28, 0xffffff, 0).setInteractive({ useHandCursor: true })); z.on('pointerdown', () => { p.choisis = p.choisis || []; p.choisis[k] = !p.choisis[k]; this.dessinerTableOsselets(p); }); }
      void g;
    });
    o(this.add.text(700, 300, `mise : ${p.mise} p.`, style(13, '#f3d9b0', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 3 })));
    o(this.add.text(330 - 30, 286, `ton coup : ${nomCoup(p.joueur)} (${valeurOsselets(p.joueur)})`, style(12, '#fff4dc', { fontStyle: 'italic', stroke: '#1a0e06', strokeThickness: 3 })).setOrigin(0, 0.5));
    if (p.flair && !p.finie) o(this.add.text(640, 150, '(Ton flair : il cache un osselet dans sa manche...)', style(13, '#ffb0a0', { fontStyle: 'italic', backgroundColor: '#1a0a0acc', padding: { x: 6, y: 3 } })).setOrigin(0.5));
  },

  partieOsselets(p, message = null) {
    const G = this.G;
    this.bloqueCoins = true;   // (v1.08) pendant une partie, les flèches attendent : la mise n'est plus perdue en quittant
    this.dessinerTableOsselets(p);
    this.vider();
    this.texte(40, 374, message || (p.relance ? 'Grik te regarde par-dessus ses osselets cachés. À toi : miser plus, montrer, ou te coucher.' : 'Clique sur les osselets à relancer (une seule relance), ou joue tout de suite.'), 14, '#f3d9b0', { fontStyle: 'italic', wordWrap: { width: 880 } });
    const fin = (choix) => { this.bloqueCoins = false; const r = finirOsselets(G, p, choix); Son.jouer(r.gain > p.mise ? 'pieces' : 'des'); this.majBourse(); this.dessinerTableOsselets(p); this.vider(); this.texte(40, 374, r.texte, 14, r.gain ? '#a8e090' : '#f3d9b0', { fontStyle: 'italic', wordWrap: { width: 880 } }); this.bouton(330, 470, 260, 'Encore une partie', () => this.pageOsselets(), partiesOsseletsRestantes(G) > 0); this.bouton(860, 500, 140, '◂ La fête', () => this.pageBrumes()); };
    const boutons = [];
    if (!p.relance) boutons.push(['Relancer', () => { p.relance = true; p.joueur = p.joueur.map((v, k) => (p.choisis && p.choisis[k] ? 1 + Math.floor(Math.random() * 6) : v)); p.choisis = []; Son.jouer('des'); this.partieOsselets(p); }]);
    boutons.push(['Miser plus', () => { const r = miserPlus(G, p); this.majBourse(); if (r && r.couche) { this.bloqueCoins = false; this.dessinerTableOsselets(p); this.vider(); this.texte(40, 374, r.texte, 14, '#a8e090', { fontStyle: 'italic' }); this.bouton(330, 470, 260, 'Encore une partie', () => this.pageOsselets(), partiesOsseletsRestantes(G) > 0); this.bouton(860, 500, 140, '◂ La fête', () => this.pageBrumes()); return; } this.partieOsselets(p, typeof r === 'string' ? r : `Tu ajoutes ${BRUMES.osselets.mise} p. Grik plisse les yeux...`); }]);
    boutons.push(['Montrer', () => fin('montrer')]);
    if (p.flair) boutons.push(['Dénoncer la triche', () => fin('denoncer')]);
    boutons.push(['Se coucher', () => fin('coucher')]);
    const l = 900 / boutons.length;
    boutons.forEach(([t, a], i) => this.bouton(30 + l * (i + 0.5), 460, l - 14, t, a));
  },

  // --- Le grand feu : l'hydromel noir, le pain de cendre ---
  pageGrandFeu(message = null) {
    const G = this.G, s = etatBrumes(G);
    this.fermerVue(); this.vider(); this.allerCoin(1); this.titreCoin.setText('Le grand feu');
    const mineur = typeof ageJoueur === 'function' && ageJoueur(G) < 18;   // (v1.46 : pas d'hydromel avant 18 ans : la tisane des anciens, qui fait voir loin aussi)
    this.texte(40, 374, message || (mineur ? "Un vieil orc lève une coupe d'hydromel noir, te regarde... et la repose : « Pas pour toi, petit. Tiens : la tisane des anciens. Elle fait voir loin, elle aussi. Pour nos morts, et pour les tiens. » À côté, on rompt le pain de cendre « pour les absents »." : "Un vieil orc te tend une coupe d'hydromel noir, épais comme la nuit : « Pour nos morts. Et pour les tiens. » À côté, on rompt le pain de cendre « pour les absents »."), 14, '#f3d9b0', { fontStyle: 'italic', wordWrap: { width: 880 } });
    if (!s.hydromel) {
      this.bouton(200, 456, 300, mineur ? 'Boire la tisane des anciens' : "Boire l'hydromel noir", () => { boireHydromel(G); Son.jouer('glou'); this.vider(); this.bloqueCoins = true; this.cameras.main.fadeOut(1400, 20, 10, 30); this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Vision', { retour: 'MarcheNoir' })); });
      this.bouton(520, 456, 240, 'Refuser poliment', () => { refuserHydromel(G); this.pageGrandFeu("Le vieil orc hausse les épaules et boit ta part. Quelques regards se détournent."); });
    } else this.texte(40, 420, s.hydromel === 'refuse' ? "Tu as refusé la coupe, ce soir." : (mineur ? 'La tisane des anciens te laisse un goût de fumée et d\'étoiles...' : "L'hydromel noir te tourne encore un peu la tête..."), 12, '#c8a890', { fontStyle: 'italic' });
    if (!s.pain) this.bouton(200, 500, 300, 'Rompre le pain de cendre', () => { prendrePain(G); Son.jouer('miam'); this.pageGrandFeu("Tu romps le pain « pour les absents ». On t'en glisse un quignon dans la poche : donné à un aventurier qui part en terre d'ombre, il le fera rebrousser chemin au lieu de mourir."); });
    this.bouton(860, 500, 140, '◂ La fête', () => this.pageBrumes());
  },

  // --- Les lanternes pour tes morts ---
  pageLanternesMorts(message = null) {
    const G = this.G, morts = mortsAHonorer(G), s = etatBrumes(G);
    this.fermerVue(); this.vider(); this.allerCoin(1); this.titreCoin.setText('Les lanternes pour tes morts');
    if (!morts.length) {
      this.texte(40, 374, message || (s.lanternes.length ? 'Tes lanternes montent dans la brume, avec celles des Bannis.' : "Aucun de tes aventuriers n'est tombé. Tu regardes les lanternes des autres monter, le cœur léger."), 14, '#f3d9b0', { fontStyle: 'italic', wordWrap: { width: 880 } });
      this.bouton(860, 500, 140, '◂ La fête', () => this.pageBrumes());
      return;
    }
    this.texte(40, 372, message || 'Pour qui allumes-tu une lanterne ? Chaque famille la regardera monter.', 13, '#f3d9b0', { fontStyle: 'italic', wordWrap: { width: 880 } });
    const L = BRUMES.lanternes;
    morts.slice(0, 3).forEach((m, i) => {
      const y = 424 + i * 28;
      this.texte(40, y, `${m.nom} (${NOMS_RACES[m.race] || m.race})`, 13, '#f3e6c8', { fontStyle: 'bold' }).setOrigin(0, 0.5);
      ['basse', 'moyenne', 'belle'].forEach((q, k) => this.bouton(390 + k * 170, y, 160, `${['Papier', 'Soie', "D'or"][k]} (${L[q].prix} p.)`, () => this.lacherLanterne(m.nom, q), peutPayer(G, L[q].prix)));
    });
    this.bouton(860, 500, 140, '◂ La fête', () => this.pageBrumes());
  },

  // La lanterne monte : la basse peine et retombe, la moyenne monte droit, la belle en fait beaucoup trop
  lacherLanterne(nom, qualite) {
    const G = this.G, r = allumerLanterne(G, nom, qualite);
    if (r.erreur) return this.pageLanternesMorts(r.erreur);
    Sauvegarde.maintenant(G, 'Nuit');
    this.majBourse(); this.vider();
    this.texte(40, 374, `La lanterne pour ${nom} quitte tes mains et monte vers la voûte...`, 14, '#f3d9b0', { fontStyle: 'italic' });
    const x = FEU_BRUMES + Phaser.Math.Between(-60, 60), y0 = 330;
    const c = this.add.container(x, y0).setDepth(2.9);
    const e = qualite === 'belle' ? 1.5 : qualite === 'moyenne' ? 1.1 : 0.9;
    const g = this.add.graphics(); this.lanterneAncetres(g, 0, 0, e); c.add(g);
    const halo = this.add.image(0, 0, 'halo').setScale(e).setTint(0xff6020).setAlpha(0.45).setBlendMode(Phaser.BlendModes.ADD); c.add(halo);
    Son.jouer('ting');
    if (qualite === 'basse') {
      // elle peine, hésite, retombe un peu, repart...
      this.tweens.chain({ targets: c, tweens: [
        { y: y0 - 60, duration: 1200, ease: 'Sine.easeOut' }, { y: y0 - 30, angle: 14, duration: 700, ease: 'Sine.easeIn' },
        { y: y0 - 110, angle: -8, duration: 1300, ease: 'Sine.easeOut' }, { y: y0 - 80, angle: 6, duration: 600 },
        { y: -60, angle: 0, duration: 4200, ease: 'Sine.easeIn' }] });
    } else if (qualite === 'moyenne') {
      this.tweens.add({ targets: c, y: -60, duration: 6000, ease: 'Sine.easeIn' });
    } else {
      // beaucoup trop : des gerbes d'étincelles, des feux qui éclatent, pour une seule personne
      this.tweens.add({ targets: c, y: -60, duration: 6000, ease: 'Sine.easeIn' });
      for (let k = 0; k < 7; k++) this.time.delayedCall(700 + k * 650, () => {
        const fx = x + Phaser.Math.Between(-220, 220), fy = Phaser.Math.Between(60, 200), col = Phaser.Utils.Array.GetRandom([0xffd040, 0xff6040, 0xff40a0, 0x80d0ff]);
        Son.jouer('ting');
        for (let j = 0; j < 14; j++) { const a = j / 14 * Math.PI * 2, p = this.add.rectangle(fx, fy, 3, 3, col).setDepth(3).setBlendMode(Phaser.BlendModes.ADD); this.tweens.add({ targets: p, x: fx + Math.cos(a) * 60, y: fy + Math.sin(a) * 60 + 20, alpha: 0, duration: 900, ease: 'Quad.easeOut', onComplete: () => p.destroy() }); }
      });
    }
    this.time.delayedCall(qualite === 'basse' ? 3800 : 2600, () => this.pageLanternesMorts(r.texte));
  },

  // --- Le discours de Garrick aux Bannis (le grand soir, la première année) ---
  discoursGarrick() {
    const G = this.G;
    this.vider(); this.allerCoin(1);
    this.bloqueCoins = true;
    const garrick = imageCorps(this, 960 + 980, 372, 'mentor', 5.8).setFlipX(true).setDepth(2.8);
    pasDeMarche(this, garrick, 2200);
    this.tweens.add({ targets: garrick, x: FEU_BRUMES + 120, duration: 2200, ease: 'Sine.easeOut' });
    const phrases = DISCOURS_GARRICK.replace(/^« | »$/g, '').split(/(?<=[.:]) (?=[A-ZJM])/), morceaux = [];
    for (let k = 0; k < phrases.length; k += 2) morceaux.push(phrases.slice(k, k + 2).join(' '));   // (deux phrases à la fois)
    let i = 0;
    const suite = () => {
      this.vider();
      if (i < morceaux.length) {
        this.texte(40, 374, 'Garrick, près du feu :', 13, '#c8a890', { fontStyle: 'italic' });
        this.texte(40, 400, `« ${morceaux[i]} »`, 15, '#f3e6c8', { fontStyle: 'italic', wordWrap: { width: 880 } });
        Son.jouer('voix', { personne: FIGURANTS.mentor, ton: 'neutre' });
        i++;
        this.bouton(860, 500, 140, 'Suite ▸', suite);
      } else {
        // les Bannis se taisent, puis lèvent leurs coupes
        (this.fetards || []).forEach((f, k) => this.time.delayedCall(k * 200, () => { if (f.active) { f.setTexture(corpsHD(this, f.qui, 'leves')); this.time.delayedCall(1800, () => f.active && f.setTexture(corpsHD(this, f.qui))); } }));
        Son.jouer('foule', { duree: 1.4 });
        G.garrickBrumes = true; etatBrumes(G).garrick = true; this.bloqueCoins = false;   // (v1.07 : entendu jusqu'au bout, une fois pour toutes)
        this.texte(40, 374, "Un long silence... puis les Bannis lèvent leurs coupes vers Garrick. Tu te demandes ce qu'il fait ici, au milieu d'eux.", 14, '#f3d9b0', { fontStyle: 'italic', wordWrap: { width: 880 } });
        this.bouton(860, 500, 140, 'Continuer', () => this.pageBrumes());
      }
    };
    this.time.delayedCall(2300, suite);
  },
});
