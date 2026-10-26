// (v1.10, lot C-1, planches 38 et 38 v2 validées) Au comptoir : le héraut de la Confrérie apporte la commande
// scellée du Conseil (la lettre au sceau rouge, puis le panneau punaisé sur l'ardoise), et revient la chercher le
// jour dit (livrée : la prime ; manquée : le Conseil est mécontent). Le 1er du mois, la lettre de l'impôt.
// (v1.61) `figurant` : son buste prend les couleurs du héraut en pied (FIGURANTS.heraut)
const HERAUT_CONSEIL = { nom: 'Le messager du Conseil — Héraut de la Confrérie', buste: { nom: 'Le héraut', race: 'humain', feminin: false, garde: true, figurant: 'heraut' } };

Object.assign(CounterScene.prototype, {
  direHeraut(texte) { this.dire(texte, HERAUT_CONSEIL.nom, HERAUT_CONSEIL.buste.nom); },

  // (un geste du buste, le temps d'une phrase : un salut, un pouce levé, un poing serré)
  geste(pose, duree = 1600) {
    if (!this.buste) return;
    this.buste.pose = pose;
    this.majVisage();
    // (un petit sursaut ; deux gestes de suite repartent de la même hauteur, sans faire glisser le buste)
    if (this.tweenGeste && this.tweenGeste.isPlaying()) { this.tweenGeste.stop(); this.perso.y = this.yGeste; }
    this.yGeste = this.perso.y;
    this.tweenGeste = this.tweens.add({ targets: this.perso, y: this.yGeste - 4, duration: 140, yoyo: true, ease: 'Sine.easeOut' });
    if (this.minuterieGeste) this.minuterieGeste.remove();
    this.minuterieGeste = this.time.delayedCall(duree, () => { if (this.buste && this.buste.pose === pose) { this.buste.pose = null; this.majVisage(); } });
  },

  // Le sceau de cire rouge du Conseil, entier ou brisé en deux
  sceauConseil(x, y, e = 1, casse = false) {
    if (!this.textures.exists('embleme_conseil')) creerEmblemesHD(this);
    const c = this.add.container(x, y);
    if (!casse) {
      c.add(this.add.circle(0, 0, 17 * e, 0x7a0e0e)); c.add(this.add.circle(-1 * e, -1 * e, 14 * e, 0xa81a18));
      c.add(this.add.image(0, 0, 'embleme_conseil').setScale(0.28 * e).setTint(0x5a0606));
      c.add(this.add.circle(-6 * e, -7 * e, 3 * e, 0xe86a5a, 0.6));
    } else {
      for (const [dx, a] of [[-9, -18], [9, 22]]) { const m = this.add.container(dx * e, 2 * e).setAngle(a); m.add(this.add.arc(0, 0, 14 * e, dx < 0 ? 90 : 270, dx < 0 ? 270 : 90, false, 0xa81a18)); c.add(m); }
    }
    return c;
  },

  // Un coup de tampon (LIVRÉE, MANQUÉE) qui s'abat sur le papier
  tamponRoyal(c, x, y, texte, largeur) {
    const t = this.add.container(x, y).setAngle(-12);
    t.add(this.add.rectangle(0, 0, largeur, 36).setStrokeStyle(4, 0xb02020));
    t.add(this.add.text(0, 0, texte, style(21, '#b02020', { fontStyle: 'bold' })).setOrigin(0.5));
    c.add(t);
    t.setScale(2.2).setAlpha(0);
    this.tweens.add({ targets: t, scale: 1, alpha: 1, duration: 220, delay: 250, ease: 'Quad.easeIn', onComplete: () => { Son.jouer('tampon'); this.cameras.main.shake(120, 0.004); } });
  },

  // Les lignes de la commande dans un panneau : ce qu'il faut, ce que tu as déjà (une barre qui se remplit)
  lignesRoyales(P, e, haut) {
    const n = e.lignes.length, pas = n >= 4 ? 26 : 30, y0 = haut + (n >= 4 ? 0 : 4);
    e.lignes.forEach((l, i) => {
      const y = y0 + i * pas;
      P.add(this.add.image(-92, y, iconeObjet(this, l.id)).setScale(n >= 4 ? 1 : 1.1));
      const nom = majuscule(nomRoyal(l.id, 2)) + (l.bel ? ` (bel ouvrage : ${l.aBel}/${l.bel})` : '');
      const t = this.add.text(-76, y - 8, nom, style(11, '#3b2410', { fontStyle: 'bold' })).setOrigin(0, 0.5);
      for (let k = 11; t.width > 150 && k >= 8; k--) t.setFontSize(k);
      P.add(t);
      P.add(this.add.rectangle(-76, y + 7, 110, 6, 0xcdb27a).setOrigin(0, 0.5));
      P.add(this.add.rectangle(-76, y + 7, 110 * Math.min(1, l.pret / l.n), 6, l.complet ? 0x4a8a3a : 0xc9a227).setOrigin(0, 0.5));
      P.add(this.add.text(96, y + 1, `${l.pret} / ${l.n}`, style(12, l.complet ? '#2f5a2a' : '#3b2410', { fontStyle: 'bold' })).setOrigin(1, 0.5));
    });
  },

  // Le panneau punaisé sur l'ardoise, tant que la commande est acceptée (il s'efface derrière un avis de recherche)
  majCommandeRoyale(arrivee = false) {
    const G = this.G, c = G.commandeRoyale;
    const e = c && c.etat === 'acceptee' && typeof etatCommandeRoyale === 'function' ? etatCommandeRoyale(G) : null;
    if (!e) { if (this.panneauRoyal) { this.panneauRoyal.destroy(); this.panneauRoyal = null; } return; }
    if (!this.panneauRoyal) {
      const P = this.panneauRoyal = this.add.container(146, 134).setDepth(3.5);
      P.add(this.add.image(0, 0, panneauHD(this, 236, 214)).setScale(2));
      P.add(this.sceauConseil(0, -86, 0.9));
      P.dyn = this.add.container(0, 0); P.add(P.dyn);
      // le sablier : son sable coule, grain après grain
      const g = this.add.graphics();
      g.fillStyle(0x6a4a22).fillRect(-98, 66, 18, 3).fillRect(-98, 92, 18, 3);
      g.fillStyle(0xe8f0f4, 0.8).fillTriangle(-96, 69, -82, 69, -89, 80).fillTriangle(-89, 80, -96, 92, -82, 92);
      g.fillStyle(0xd8b048).fillTriangle(-93, 72, -85, 72, -89, 78).fillTriangle(-89, 84, -94, 92, -84, 92);
      P.add(g);
      const grain = this.add.rectangle(-89, 80, 2, 2, 0xd8b048); P.add(grain);
      this.tweens.add({ targets: grain, y: 88, duration: 700, repeat: -1, ease: 'Quad.easeIn' });
      // (un clic le décroche un instant : l'ardoise redevient lisible)
      // (un clic l'estompe : l'ardoise redevient lisible ET cliquable ; un clic sur son sceau le ramène)
      const basculer = () => { const estompe = P.alpha >= 1; this.tweens.add({ targets: P, alpha: estompe ? 0.25 : 1, duration: 200 }); if (estompe) P.disableInteractive(); else P.setInteractive(); };
      P.setSize(236, 214).setInteractive({ useHandCursor: true }).on('pointerdown', basculer);
      const pastille = this.add.circle(146, 48, 16, 0xffffff, 0.001).setDepth(3.6).setInteractive({ useHandCursor: true });
      pastille.on('pointerdown', () => { if (P.alpha < 1) basculer(); });
      P.on('destroy', () => pastille.destroy());
      this.pastilleRoyale = pastille;
      if (arrivee) { P.setY(-120).setAngle(-8); this.tweens.add({ targets: P, y: 134, angle: 0, duration: 650, ease: 'Bounce.easeOut', onComplete: () => Son.jouer('poser') }); }
    }
    const P = this.panneauRoyal, d = P.dyn;
    d.removeAll(true);
    const titre = this.add.text(0, -60, e.complet ? 'Commande scellée : prête !' : 'Commande scellée', style(15, e.complet ? '#2f5a2a' : '#5a0e0e', { fontStyle: 'bold' })).setOrigin(0.5);
    for (let k = 15; titre.width > 220 && k >= 11; k--) titre.setFontSize(k);
    d.add(titre);
    this.lignesRoyales(d, e, -34);
    const j = e.joursRestants;
    d.add(this.add.text(-72, 80, j >= 2 ? `encore ${j} jours` : j === 1 ? 'le héraut passe demain' : "le héraut passe aujourd'hui", style(14, '#5a0e0e', { fontStyle: 'bold' })).setOrigin(0, 0.5));
    P.setVisible(!this.afficheEpinglee);
    if (this.pastilleRoyale) this.pastilleRoyale.setVisible(!this.afficheEpinglee);
  },

  // La feuille posée sur le parchemin de droite pendant la visite du héraut
  feuilleRoyale(etat, info = {}) {
    if (this.feuilleConseil) { this.feuilleConseil.destroy(); this.feuilleConseil = null; }
    const G = this.G, c = info.c || G.commandeRoyale;
    if (!c) return;
    const F = this.feuilleConseil = this.add.container(793, 150).setScale(0.88).setDepth(2.5);
    if (etat === 'scellee') {
      const L = this.add.container(0, 0).setAngle(-6);
      L.add(this.add.image(0, 0, panneauHD(this, 200, 140)).setScale(2));
      L.add(this.add.rectangle(0, 0, 200, 6, 0x9a1a18));
      L.add(this.sceauConseil(0, 0, 1.4));
      F.add(L);
      F.add(this.add.text(0, 86, 'La lettre au sceau rouge', style(13, '#3b2410', { fontStyle: 'bold italic' })).setOrigin(0.5));
      // (elle se balance un peu dans la main du héraut)
      this.tweens.add({ targets: L, angle: -3, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      L.setSize(200, 140).setInteractive({ useHandCursor: true }).on('pointerdown', () => { if (this.action) this.action(); });
      return;
    }
    F.add(this.add.image(0, 0, panneauHD(this, 236, 214)).setScale(2));
    F.add(this.sceauConseil(0, -86, 0.9, etat !== 'livraison' && etat !== 'manquee'));
    F.add(this.add.text(0, -60, 'Commande scellée', style(15, '#5a0e0e', { fontStyle: 'bold' })).setOrigin(0.5));
    if (etat === 'lue') {
      // la lettre ouverte, en petit : un clic la rouvre en grand
      const n = Object.keys(c.objets).length, pas = n >= 4 ? 24 : 28;
      Object.entries(c.objets).forEach(([id, k], i) => {
        const y = -32 + i * pas, b = (c.bel || {})[id] || 0;
        F.add(this.add.image(-92, y, iconeObjet(this, id)).setScale(1));
        const t = this.add.text(-76, y, `${k} ${nomRoyal(id, k)}${b ? ` (${b} bel ouvrage)` : ''}`, style(13, '#3b2410', { fontStyle: 'bold' })).setOrigin(0, 0.5);
        for (let s = 13; t.width > 180 && s >= 9; s--) t.setFontSize(s);
        F.add(t);
      });
      F.add(this.add.text(0, 66, c.pardon ? `Le jour ${c.limite} · le pardon` : `Le jour ${c.limite} · ${c.prime} p.`, style(14, '#5a0e0e', { fontStyle: 'bold' })).setOrigin(0.5));
      F.add(this.add.text(0, 88, 'clic : relire la lettre', style(11, '#7a5a3a', { fontStyle: 'italic' })).setOrigin(0.5));
      F.setSize(236, 214).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.lireCommandeRoyale(false));
      return;
    }
    if (etat === 'livraison' || etat === 'manquee') {
      this.lignesRoyales(F, info.e || etatCommandeRoyale(G, c), -34);
      if (etat === 'manquee') this.tamponRoyal(F, 10, 76, 'MANQUÉE', 150);
      return;
    }
    // livrée : la prime, la faveur du Conseil, l'impôt moitié prix (ou, pour la commande du pardon : le sceau rendu)
    F.add(this.add.text(0, -14, info.pardon ? 'Pardonné' : `+${info.prime} p.`, style(26, '#2f5a2a', { fontStyle: 'bold' })).setOrigin(0.5));
    F.add(this.add.text(0, 18, '+1 de réputation', style(14, '#2f5a2a', { fontStyle: 'bold' })).setOrigin(0.5));
    F.add(this.add.text(0, 38, "et l'impôt du mois prochain divisé par deux", style(11, '#2f5a2a', { fontStyle: 'italic' })).setOrigin(0.5));
    this.tamponRoyal(F, 40, 74, 'LIVRÉE', 110);
  },

  // Un grand papier au milieu de l'écran (la lettre scellée, le mécontentement, l'impôt) ; un clic le referme
  grandPapier(largeur, hauteur, remplir, suite) {
    const voile = this.add.rectangle(480, 270, 960, 540, 0x0a0604, 0.55).setDepth(80).setInteractive();
    const L = this.add.container(480, 262).setDepth(81);
    L.add(this.add.image(0, 0, panneauHD(this, largeur, hauteur)).setScale(2));
    remplir(L);
    L.setScale(0.2).setAlpha(0);
    this.tweens.add({ targets: L, scale: 1, alpha: 1, duration: 420, ease: 'Back.easeOut' });
    Son.jouer('page');
    const indice = this.add.text(950, 530, '▶ clique pour refermer', style(12, '#d6bf98', { fontStyle: 'italic' })).setOrigin(1, 1).setDepth(82);
    this.lettreOuverte = true;
    const fermer = () => {
      if (!voile.active) return;
      for (const o of [voile, L, indice]) o.destroy();
      this.lettreOuverte = false;
      if (suite) suite();
    };
    this.time.delayedCall(500, () => { if (voile.active) voile.once('pointerdown', fermer); });
    return fermer;
  },

  // --- La visite du héraut ---
  visiteHeraut(entree) {
    const G = this.G, c = G.commandeRoyale;
    this.titreCommande.setText(''); this.sousTitre.setText(''); this.texteSac.setText(''); this.texteChance.setText('');
    this.aideCommande.setVisible(false); this.boutonEscorte.setVisible(false);
    if (entree.mode === 'livraison') return this.livraisonRoyale();
    if (!c || c.etat !== 'proposee') { this.direHeraut('« Le Conseil des Gardiens te salue, marchand. »'); return this.auRevoirHeraut(); }
    Son.jouer('fanfare');
    this.geste('salut', 1800);
    this.direHeraut(c.pardon ? "« Par ordre du Conseil des Gardiens ! Il t'offre une chance de te racheter, marchand : la commande du pardon. Pas de prime, seulement ton honneur. »"
      : "« Par ordre du Conseil des Gardiens ! Ton comptoir fait parler de lui jusqu'au palais. Voici une commande scellée, marchand : lis-la bien. »");
    this.feuilleRoyale('scellee');
    this.bouton('Briser le sceau', () => this.lireCommandeRoyale(true));
  },

  auRevoirHeraut(texte = 'Le raccompagner') {
    // (relecture v1.10) la feuille de droite ne se rouvre plus pendant qu'il s'en va ; et un double clic sur le bouton
    // d'avant ne le fait pas partir avant qu'on ait lu sa réponse
    if (this.feuilleConseil) this.feuilleConseil.disableInteractive();
    this.bouton(texte, null);
    this.time.delayedCall(600, () => { if (this.entree && this.entree.type === 'heraut') this.bouton(texte, () => { this.bouton('...', null); this.partirPar(FENETRE.x - 80); }); });
  },

  // La lettre ouverte : la commande, son délai, sa prime (la première fois, le héraut attend ta réponse)
  lireCommandeRoyale(premiere = false) {
    const G = this.G, c = G.commandeRoyale;
    if (!c || this.lettreOuverte) return;
    if (premiere) { this.bouton('...', null); Son.jouer('lettre'); }
    this.feuilleRoyale('lue');
    if (!this.textures.exists('embleme_conseil')) creerEmblemesHD(this);
    this.grandPapier(560, 400, L => {
      L.add(this.add.image(0, -150, 'embleme_conseil').setScale(0.55));
      L.add(this.add.text(0, -112, c.pardon ? 'COMMANDE DU PARDON' : 'COMMANDE SCELLÉE', style(22, '#5a0e0e', { fontStyle: 'bold' })).setOrigin(0.5));
      const sous = this.add.text(0, -86, `Par ordre du Conseil des Gardiens, au comptoir « ${G.nomShop} »`, style(12, '#3b2410', { fontStyle: 'italic' })).setOrigin(0.5);
      for (let k = 12; sous.width > 520 && k >= 9; k--) sous.setFontSize(k);
      L.add(sous);
      const objets = Object.entries(c.objets), n = objets.length, pas = n >= 4 ? 28 : 34, y0 = n >= 4 ? -54 : -48;
      objets.forEach(([id, k], i) => {
        const b = (c.bel || {})[id] || 0, y = y0 + i * pas;
        L.add(this.add.image(-150, y, iconeObjet(this, id)).setScale(1.6));
        L.add(this.add.text(-126, y, `${k} ${nomRoyal(id, k)}${b ? (b >= k ? ' « bel ouvrage »' : `, dont ${b} « bel ouvrage »`) : ''}`, style(16, '#3b2410', { fontStyle: 'bold' })).setOrigin(0, 0.5));
      });
      const y = n >= 4 ? 70 : 62;
      L.add(this.add.text(0, y, `À livrer le jour ${c.limite}, au matin (dans ${c.limite - c.jour} jours).`, style(15, '#5a0e0e', { fontStyle: 'bold' })).setOrigin(0.5));
      L.add(this.add.text(0, y + 26, c.pardon ? `Pas de prime : livrée, elle efface tes fautes et ${(G.conseil && G.conseil.reussies) ? 'te rend' : 'te vaut'} le sceau du Conseil.` : `Prime : ${c.prime} pièces, et la faveur du Conseil (+1 de réputation).`, style(13, '#2f5a2a', { fontStyle: 'bold' })).setOrigin(0.5));
      L.add(this.add.text(0, y + 48, "Faute de quoi, le Conseil s'en souviendra.", style(12, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5));
      L.add(this.sceauConseil(150, 150, 1.2, true));
      L.add(this.add.text(-120, 156, '— le sceau brisé', style(11, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5));
    }, () => {
      if (!premiere || !G.commandeRoyale || G.commandeRoyale.etat !== 'proposee') return;
      this.direHeraut('« Alors, marchand ? Tu acceptes, ou je dis au Conseil que ton comptoir a peur du travail ? »');
      this.choix(['Accepter la commande', () => this.accepterRoyale()], ['Refuser (réputation −1)', () => this.refuserRoyale()]);
    });
  },

  accepterRoyale() {
    const G = this.G, c = G.commandeRoyale;
    if (!accepterCommandeRoyale(G)) return;
    this.exprimer('content');
    this.geste('pouce', 1600);
    this.direHeraut(`« Parfait ! Je repasserai le jour ${c.limite}, au matin. Que tout soit prêt : le Conseil compte sur toi. »`);
    this.majCommandeRoyale(true);   // (la commande, punaisée sur ton ardoise)
    this.auRevoirHeraut();
  },

  refuserRoyale() {
    const res = refuserCommandeRoyale(this.G);
    if (!res) return;
    Son.jouer('refus');
    this.exprimer('fache');
    this.direHeraut('« Comme tu voudras. Je dirai au Conseil que ton comptoir a peur du travail. »');
    if (this.feuilleConseil) { this.feuilleConseil.destroy(); this.feuilleConseil = null; }
    this.bouton('...', null);
    // (le récit reste à l'écran : c'est le joueur qui le laisse partir)
    this.time.delayedCall(1800, () => {
      if (!this.entree || this.entree.type !== 'heraut') return;
      this.raconter('Le héraut tourne les talons. Toute la Comté saura que tu as refusé (réputation −1).' + (res.pause ? ' Trois refus de suite : le Conseil ne te proposera plus rien pendant deux mois.' : ''), 'Le messager du Conseil');
      this.bouton('Le laisser partir', () => { this.bouton('...', null); this.partirPar(FENETRE.x - 80); });
    });
  },

  // Le jour dit : il vient chercher la commande
  livraisonRoyale() {
    const G = this.G, c = G.commandeRoyale;
    if (!c || c.etat !== 'acceptee') { this.direHeraut('« Le Conseil des Gardiens te salue, marchand. »'); return this.auRevoirHeraut(); }
    const e = etatCommandeRoyale(G);
    this.geste('salut', 1400);
    this.feuilleRoyale('livraison', { e });
    this.direHeraut(e.complet ? '« Le jour est venu, marchand ! La commande du Conseil est prête, à ce que je vois ? »'
      : '« Le jour est venu, marchand. La commande du Conseil est-elle prête ? »');
    this.bouton(e.complet ? 'Livrer la commande' : 'Lui montrer ce que tu as', () => this.livrerRoyale());
  },

  livrerRoyale() {
    const G = this.G, c = G.commandeRoyale;
    if (!c) return;
    const e = etatCommandeRoyale(G), r = livrerCommandeRoyale(G);
    if (!r) return;
    this.bouton('...', null);
    this.majStock(); this.dessinerPieces();
    if (r.ok) {
      this.feuilleRoyale('livree', { c, prime: r.prime, pardon: r.pardon });
      Son.jouer('pieces'); this.time.delayedCall(350, () => Son.jouer('fanfare'));
      this.cameras.main.flash(250, 255, 240, 160);
      this.exprimer('content');
      this.geste('pouce', 2000);
      this.direHeraut(r.pardon ? `« ${objetsRoyaux(c.objets)} : tout y est. Le Conseil te pardonne, marchand. ${r.premierSceau ? 'Son sceau ornera ta porte.' : 'Ton sceau retrouve sa place à ta porte.'} »`
        : `« ${objetsRoyaux(c.objets)} : tout y est ! Le Conseil n'oubliera pas ton service. Voici ta prime. »`);
      return this.auRevoirHeraut();
    }
    this.feuilleRoyale('manquee', { c, e });
    this.exprimer('fache');
    this.geste('poing', 2200);
    this.direHeraut(`« ${reprocheRoyal(r.manque)} Le Conseil n'aime pas qu'on le fasse attendre, marchand. Il s'en souviendra. »`);
    this.bouton('...', () => {
      this.bouton('...', null);
      this.mecontentementDuConseil(r, () => {
        this.direHeraut("« Voilà ce qu'il en coûte. La prochaine fois, ne promets que ce que tu peux tenir. »");
        this.auRevoirHeraut('Le laisser partir');
      });
    });
  },

  // Les conséquences, écrites par le Conseil (planche 38 v2)
  mecontentementDuConseil(r, suite) {
    const G = this.G, f = r.fautes || 1;
    const fois = x => String(Math.round(x * 100) / 100).replace('.', ',');
    Son.jouer('echec');
    this.grandPapier(560, 400, L => {
      L.add(this.add.image(0, -150, 'embleme_conseil').setScale(0.55).setTint(f >= 2 ? 0x3a3a3a : 0xffffff));
      L.add(this.add.text(0, -112, f >= 3 ? 'LA DISGRÂCE' : f === 2 ? 'LE SCEAU NOIR' : 'LE CONSEIL EST MÉCONTENT', style(21, f >= 2 ? '#1e1e1e' : '#5a0e0e', { fontStyle: 'bold' })).setOrigin(0.5));
      const sous = this.add.text(0, -86, `${r.pardonRate ? 'Commande du pardon' : 'Commande scellée'} manquée par le comptoir « ${G.nomShop} »${f >= 2 && !r.pardonRate ? ` · ${f >= 3 ? 'troisième' : 'deuxième'} faute` : ''}`, style(12, '#3b2410', { fontStyle: 'italic' })).setOrigin(0.5);
      for (let k = 12; sous.width > 520 && k >= 9; k--) sous.setFontSize(k);
      L.add(sous);
      const lignes = [[`−${r.reputation} de réputation`, 'toute la Comté le saura'],
        [`Impôt du Conseil × ${fois(r.majoration || 1.5)}`, `pendant ${r.mois} mois${r.ombre ? ' (plus dur pour qui penche vers les Bannis)' : ''}`]];
      if (f >= 3) lignes.push([r.avaitSceau === false ? 'Le Conseil te tourne le dos' : 'Le sceau du Conseil quitte ta porte', 'plus de nobles au comptoir, plus de commande pendant deux mois']);
      else lignes.push(['Pas de commande scellée', 'le mois prochain']);
      if (f === 2) lignes.push(['Un avertissement', r.rival ? 'le Conseil confie ses commandes au paon d’à côté (sa pression monte)' : 'à la prochaine faute, la disgrâce']);
      lignes.push(['La marchandise te reste sur les bras', 'rien n’est payé']);
      const pas = lignes.length > 4 ? 33 : 38;
      lignes.forEach(([t, d], i) => {
        L.add(this.add.text(-200, -50 + i * pas, '✗', style(18, '#b02020', { fontStyle: 'bold' })).setOrigin(0.5));
        L.add(this.add.text(-180, -58 + i * pas, t, style(15, '#3b2410', { fontStyle: 'bold' })));
        const det = this.add.text(-180, -38 + i * pas, d, style(11, '#6b4a2a', { fontStyle: 'italic' }));
        for (let k = 11; det.width > 390 && k >= 9; k--) det.setFontSize(k);
        L.add(det);
      });
      L.add(this.add.text(0, 124, f >= 3 ? 'Dans deux mois, le héraut t’apportera la commande du pardon.' : f === 2 ? 'Une faute de plus, et c’est la disgrâce. Une commande livrée en efface une.' : 'Réussis la suivante, et le Conseil oubliera.', style(13, '#2f5a2a', { fontStyle: 'bold italic' })).setOrigin(0.5));
      L.add(this.sceauConseil(200, 160, 1.1));
    }, suite);
  },

  // --- Le 1er du mois : la lettre du percepteur (planche 38 v2) ---
  montrerLettreImpot(suite) {
    const G = this.G, l = G.lettreImpot;
    l.vue = true;
    const pc = t => `${Math.round(t * 1000) / 10} %`.replace('.', ',');
    const p = n => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} p.`;
    this.grandPapier(520, 380, L => {
      L.add(this.sceauConseil(0, -150, 1.2));
      L.add(this.add.text(0, -112, 'IMPÔT DU CONSEIL', style(21, '#5a0e0e', { fontStyle: 'bold' })).setOrigin(0.5));
      L.add(this.add.text(0, -86, l.premiere ? `Désormais, le percepteur passe le 1er de chaque mois · ★${l.et}` : `Le percepteur passe le 1er du mois · ★${l.et}`, style(12, '#3b2410', { fontStyle: 'italic' })).setOrigin(0.5));
      const rangs = [[(l.dettes !== undefined ? l.dettes > 0 : l.fortune < G.argent) ? 'Ta fortune (sans tes dettes)' : 'Ta fortune', p(l.fortune)], [`Franchise (300 p. × ★${l.et})`, `− ${p(l.franchise)}`], [`Taux du mois (5 % × ★${l.et})`, pc(l.tauxBase)]];
      // (housekeep v1.14) majoration et ristourne peuvent se suivre : une ligne chacune, chacune avec son vrai résultat
      const maj = l.majore ? (l.majoration || 1.5) : 1;
      if (l.majore) rangs.push([`Majoration (${(G.conseil && G.conseil.fautes) >= 2 ? `${G.conseil.fautes >= 3 ? 'la disgrâce' : 'le sceau noir'}` : 'commande manquée'})`, `× ${String(Math.round(maj * 100) / 100).replace('.', ',')}  →  ${pc(l.tauxBase * maj)}`, '#b02020']);
      if (l.ristourne) rangs.push(['Ristourne (commande livrée)', `× ½  →  ${pc(l.taux)}`, '#2f5a2a']);
      // (v1.31) les reliques du Conseil : −10 %, à voir sur la lettre
      if ((l.reliques || 1) < 1) rangs.push(['Reliques du Conseil', `× ${String(l.reliques).replace('.', ',')}  →  ${pc(l.taux * l.reliques)}`, '#2f5a2a']);
      const pasR = rangs.length > 5 ? 22 : rangs.length > 4 ? 26 : 30;
      rangs.forEach(([a, b, c], i) => {
        const coul = c || '#3b2410';
        L.add(this.add.text(-190, -52 + i * pasR, a, style(14, coul, { fontStyle: 'bold' })));
        L.add(this.add.text(190, -52 + i * pasR, b, style(14, coul, { fontStyle: 'bold' })).setOrigin(1, 0));
      });
      L.add(this.add.rectangle(0, 76, 380, 2, 0x8a6a3a));
      L.add(this.add.text(-190, 88, 'À payer', style(18, '#5a0e0e', { fontStyle: 'bold' })));
      L.add(this.add.text(190, 88, l.montant > 0 ? p(l.montant) : 'rien', style(18, '#5a0e0e', { fontStyle: 'bold' })).setOrigin(1, 0));
      const sans = Math.round(Math.max(0, l.fortune - l.franchise) * l.tauxBase * (l.majore && l.ristourne ? 0.5 : 1) * (l.reliques || 1));   // (sans la majoration, mais avec la ristourne s'il y en a une)
      const note = l.dette ? `Il te manquait ${p(l.dette)} : une dette envers le Conseil, remboursée chaque nuit.`
        : l.montant === 0 ? (l.fortune <= l.franchise ? `Ce mois-ci, ta fortune ne dépasse pas la franchise : rien à payer.` : 'Ce mois-ci, presque rien au-delà de la franchise : rien à payer.')
          : l.majore ? `(sans la majoration : ${p(sans)}${l.encoreMajore ? ' ; encore un mois majoré après celui-ci' : ''})`
            : l.ristourne ? `(sans la ristourne : ${p(sans)})` : 'Une commande scellée livrée, et le prochain impôt sera moitié prix.';
      const t = this.add.text(0, 132, note, style(11, l.dette ? '#b02020' : '#6b4a2a', { fontStyle: 'italic', wordWrap: { width: 440 }, align: 'center' })).setOrigin(0.5);
      L.add(t);
    }, suite);
  },
});
