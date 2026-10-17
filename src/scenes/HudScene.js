// Le bandeau toujours visible, par-dessus toutes les pages du jeu : le jour en cours, et le
// menu « ☰ » pour retourner à l'écran titre quand on veut.
// Cette scène tourne en permanence, au-dessus des autres (elle s'y remet à chaque image).
const SCENES_SANS_BANDEAU = ['Titre', 'Intro', 'IntroHistoire', 'Renovation', 'Faillite', 'Carrefour', 'Hud'];

class HudScene extends Phaser.Scene {
  constructor() { super({ key: 'Hud', active: false }); }

  create() {
    // La plaque : du bois sombre à liseré doré, en haut à gauche
    const plaque = this.add.graphics();
    plaque.fillStyle(0x1e130a, 0.92).fillRoundedRect(-8, -8, 118, 26, 7);
    plaque.lineStyle(2, 0xc9a227, 1).strokeRoundedRect(-8, -8, 118, 26, 7);
    this.texteJour = this.add.text(36, 9, '', style(15, '#f3d98a', { fontStyle: 'bold', brut: true })).setOrigin(0, 0.5);
    creerIconesSaison(this);
    this.iconeSaison = this.add.image(100, 9, 'iconeSaison_semailles').setScale(0.9);   // (v0.99 : la saison, à côté du jour)
    const menu = this.add.text(16, 9, '☰', style(17, '#fff4dc', { fontStyle: 'bold', brut: true })).setOrigin(0.5);
    const zone = this.add.rectangle(55, 9, 110, 20, 0xffffff, 0).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => this.ouvrirMenu());
    zone.on('pointerover', () => menu.setColor('#ffe066'));
    zone.on('pointerout', () => menu.setColor('#fff4dc'));
    // La réputation, en direct : elle s'anime quand elle bouge.
    plaque.fillStyle(0x1e130a, 0.92).fillRoundedRect(114, -8, 104, 26, 7);
    plaque.lineStyle(2, 0xc9a227, 1).strokeRoundedRect(114, -8, 104, 26, 7);
    // Une étoile et une jauge dorée qui se remplit vers le prochain palier, le chiffre par-dessus.
    creerGlyphesHD(this);
    this.etoileReput = this.add.image(126, 9, 'glyphe_etoile').setScale(1.4).setOrigin(0, 0.5);
    this.jaugeReput = this.add.graphics();
    this.remplissage = 0;
    this.texteReput = this.add.text(178, 9, '', style(11, '#fff4dc', { fontStyle: 'bold', stroke: '#1e130a', strokeThickness: 4, brut: true })).setOrigin(0.5);
    const zoneReput = this.add.rectangle(166, 9, 104, 20, 0xffffff, 0).setInteractive({ useHandCursor: true });
    zoneReput.on('pointerover', () => this.infoReput(true));
    zoneReput.on('pointerout', () => this.infoReput(false));
    zoneReput.on('pointerdown', () => this.infoReput(!this.bulleReput));
    this.reputAffichee = null;
    // (v0.84) la lumière et l'ombre, en direct elles aussi : une fine bande sous les deux plaques, l'or
    // de la lumière à gauche, le violet de l'ombre à droite, et le curseur entre les deux
    plaque.fillStyle(0x1e130a, 0.92).fillRect(-8, 17, 226, 8);
    plaque.lineStyle(2, 0xc9a227, 1).strokeRect(-8, 17, 226, 8);
    this.jaugeCampG = this.add.graphics();
    const zoneCamp = this.add.rectangle(105, 21, 226, 10, 0xffffff, 0).setInteractive({ useHandCursor: true });
    // (v0.93) une goutte bleue tant que dure la bénédiction de la nymphe
    const goutte = this.add.graphics();
    goutte.fillStyle(0x1e130a, 0.92).fillCircle(0, 0, 11).lineStyle(2, 0xc9a227, 1).strokeCircle(0, 0, 11);
    goutte.fillStyle(0x4aa8f0, 1).fillTriangle(-5, 1, 5, 1, 0, -9).fillCircle(0, 2, 5);
    goutte.fillStyle(0xd8f4ff, 1).fillCircle(-2, 1, 1.5);
    const zoneGoutte = this.add.circle(0, 0, 12, 0xffffff, 0).setInteractive({ useHandCursor: true });
    this.goutte = this.add.container(234, 10, [goutte, zoneGoutte]).setVisible(false);
    zoneGoutte.on('pointerover', () => this.infoNymphe(true));
    zoneGoutte.on('pointerout', () => this.infoNymphe(false));
    zoneGoutte.on('pointerdown', () => this.infoNymphe(!this.bulleNymphe));
    this.tweens.add({ targets: goutte, y: -2, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.bandeau = this.add.container(0, 0, [plaque, menu, this.texteJour, this.iconeSaison, zone, this.etoileReput, this.jaugeReput, this.texteReput, zoneReput, this.jaugeCampG, zoneCamp, this.goutte]).setDepth(100);
    // (v0.84) pas assez d'argent : une grande alerte en haut de l'écran, par-dessus toutes les pages
    const surManque = m => this.alerteArgent(m);
    this.game.events.on('manqueArgent', surManque);
    this.events.once('shutdown', () => this.game.events.off('manqueArgent', surManque));
  }

  alerteArgent(manque) {
    if (this.alerte) { this.tweens.killTweensOf(this.alerte); this.alerte.destroy(); }
    const c = this.alerte = this.add.container(480, 74).setDepth(120);
    const texte = this.add.text(18, 0, `Pas assez d'argent : il te manque ${manque} pièce${manque > 1 ? 's' : ''} !`,
      style(17, '#fff4dc', { fontStyle: 'bold', stroke: '#3a0a06', strokeThickness: 4, brut: true })).setOrigin(0.5);
    const l = texte.width + 74;
    const fond = this.add.graphics();
    fond.fillStyle(0x7a1a10, 0.95).fillRoundedRect(-l / 2, -21, l, 42, 9);
    fond.lineStyle(3, 0xe8b040, 1).strokeRoundedRect(-l / 2, -21, l, 42, 9);
    creerPiecesHD(this);
    const piece = this.add.image(-l / 2 + 26, 0, 'pieceFace').setScale(2.2);
    const barre = this.add.text(-l / 2 + 26, 0, '✕', style(20, '#ff5040', { fontStyle: 'bold', stroke: '#1a0604', strokeThickness: 4, brut: true })).setOrigin(0.5);
    c.add([fond, piece, barre, texte]);
    c.setScale(0.4).setAlpha(0);
    this.tweens.add({ targets: c, scale: 1, alpha: 1, duration: 220, ease: 'Back.easeOut' });
    this.tweens.add({ targets: c, x: { from: 472, to: 488 }, duration: 60, yoyo: true, repeat: 3, delay: 220, onComplete: () => c.setX(480) });
    this.tweens.add({ targets: c, alpha: 0, y: 60, delay: 2400, duration: 400, onComplete: () => { c.destroy(); if (this.alerte === c) this.alerte = null; } });
  }

  dessinerJauge() {
    const g = this.jaugeReput, x0 = 146, l = 64, y0 = 3, h = 12, part = this.remplissage;
    g.clear();
    g.fillStyle(0x0e0904).fillRoundedRect(x0, y0, l, h, 4);
    g.fillStyle(0xb8860b).fillRoundedRect(x0 + 1, y0 + 1, Math.max(4, (l - 2) * part), h - 2, 3);
    g.fillStyle(0xf3d98a, 0.9).fillRect(x0 + 2, y0 + 2, Math.max(2, (l - 4) * part), 3);
    g.lineStyle(1, 0xc9a227).strokeRoundedRect(x0, y0, l, h, 4);
    g.lineStyle(1, 0x0e0904, 0.5);
    for (let k = 1; k < 5; k++) g.lineBetween(x0 + l * k / 5, y0 + 2, x0 + l * k / 5, y0 + h - 2);
  }

  // Le détail de la réputation : son palier (le plafond de clients) et le suivant.
  infoReput(montrer) {
    if (this.bulleReput) { this.bulleReput.destroy(); this.bulleReput = null; }
    const G = window.GAME;
    if (!montrer || !G) return;
    const p = palierClients(G);
    const texte = `Réputation : ${arrondi(G.reputation)}\n${p.nom} : jusqu'à ${p.max} clients de passage par jour\n(+${BONUS_CLIENTS_MAX} au plus grâce au stock varié, à l'éclairage, au trophée)` +
      (p.suivant ? `\nProchain palier à ${p.suivant.reputation} : ${p.suivant.nom} (${p.suivant.max} clients)` : '\nPalier maximum atteint !');
    this.bulleReput = this.add.text(116, 30, texte, style(12, '#fff4dc', { backgroundColor: '#1e130a', padding: { x: 8, y: 6 }, lineSpacing: 3 })).setDepth(105);
  }

  // (v0.90) la petite jauge du bandeau : la balance en dégradé, l'ombre à gauche, la lumière à droite
  dessinerCamp(j) {
    const g = this.jaugeCampG, x0 = -6, l = 222, y0 = 18, h = 6;
    g.clear();
    g.fillStyle(0x0a0604, 1).fillRect(x0 - 1, y0 - 1, l + 2, h + 2);
    const X = peindreJauge(g, x0, y0, l, h, { pas: 2, paliers: false });
    const pos = Math.round(X(Math.max(-100, Math.min(100, j))));
    g.fillStyle(0x1e130a, 1).fillRect(pos - 2, y0 - 3, 5, h + 6);
    g.fillStyle(0xfff4dc, 1).fillRect(pos - 1, y0 - 2, 3, h + 4);
  }

  infoCamp(montrer) {
    if (this.bulleCamp) { this.bulleCamp.destroy(); this.bulleCamp = null; }
    const G = window.GAME;
    if (!montrer || !G) return;
    const j = jaugeCamp(G), p = palierCamp(G);
    const serment = sermentDe(G);
    const texte = `Ombre ⟷ Lumière : ${NOMS_PALIERS_JAUGE[p]} (${j > 0 ? '+' : ''}${j})` + (Math.abs(j) < PALIERS_JAUGE[0] ? ' · zone neutre' : '') + '\n' +
      (serment ? `Tu as prêté serment ${serment === 'bien' ? 'à la Confrérie du Dernier Rempart' : 'aux Bannis'}.\n` : '') +
      'Le détail (ce qui fait pencher la balance, tes derniers gestes) : au bureau, « Lumière et ombre ».' +
      (G.camp ? `\nTon camp est scellé : ${G.camp === 'bien' ? 'la lumière' : 'l\'ombre'}.` : '');
    this.bulleCamp = this.add.text(4, 30, texte, style(12, '#fff4dc', { backgroundColor: '#1e130a', padding: { x: 8, y: 6 }, lineSpacing: 3 })).setDepth(105);
  }

  // (v0.93) La bénédiction de la nymphe, en un coup d'œil
  infoNymphe(montrer) {
    if (this.bulleNymphe) { this.bulleNymphe.destroy(); this.bulleNymphe = null; }
    const G = window.GAME;
    if (!montrer || !G || !benieJusqua(G)) return;
    const texte = `Bénie de la nymphe jusqu'au jour ${benieJusqua(G)} :\n+${Math.round(NYMPHE.benediction.bonus * 100)} % aux épreuves de rivière et de marais, et à celles où il faut une gourde.`;
    this.bulleNymphe = this.add.text(222, 30, texte, style(12, '#e8f6ff', { backgroundColor: '#14283e', padding: { x: 8, y: 6 }, lineSpacing: 3 })).setDepth(105);
  }

  // (v0.95) Le journal de bord : ce que le jeu a fait juste avant (et lors de la session précédente),
  // pour savoir où un gel s'est produit. Une page HTML par-dessus, qu'on peut lire et copier.
  ouvrirJournal() {
    this.fenetre.setVisible(false);
    const fond = document.createElement('div');
    fond.style.cssText = 'position:fixed;inset:0;z-index:50;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:12px';
    const boite = document.createElement('div');
    boite.style.cssText = 'background:#f2e4c0;color:#3b2410;border:3px solid #8a6a3a;border-radius:8px;max-width:720px;width:100%;max-height:90vh;display:flex;flex-direction:column;font:14px Georgia,serif';
    const titre = document.createElement('div');
    titre.style.cssText = 'padding:10px 14px;font-weight:bold;font-size:18px;border-bottom:2px solid #b8965e';
    titre.textContent = 'Journal de bord';
    const aide = document.createElement('div');
    aide.style.cssText = 'padding:6px 14px;font-style:italic;font-size:13px';
    aide.textContent = "Après un gel : recharge la page, puis ouvre ce journal. La partie « Session précédente » montre ce que le jeu faisait juste avant. Envoie une capture à Claude.";
    const zone = document.createElement('pre');
    zone.style.cssText = 'margin:0;padding:8px 14px;overflow:auto;white-space:pre-wrap;font:12px/1.45 Menlo,Consolas,monospace;flex:1';
    zone.textContent = `${VERSION_JEU}\n\n— Session en cours —\n` + (journalJeu.slice(-25).join('\n') || '(rien)') + '\n\n— Session précédente (avant le dernier rechargement) —\n' + (journalPrecedent.slice(-25).join('\n') || '(rien)');
    const bas = document.createElement('div');
    bas.style.cssText = 'padding:10px 14px;text-align:right;border-top:2px solid #b8965e';
    const ok = document.createElement('button');
    ok.textContent = 'Fermer';
    ok.style.cssText = 'font:bold 15px Georgia,serif;background:#6b4a22;color:#fff4dc;border:2px solid #c9a227;border-radius:6px;padding:6px 16px;cursor:pointer';
    ok.onclick = () => { fond.remove(); if (this.fenetre) this.fenetre.setVisible(true); };
    bas.append(ok); boite.append(titre, aide, zone, bas); fond.append(boite); document.body.append(fond);
    zone.scrollTop = 0;
  }

  // Un gain de lumière ou d'ombre : un « +3 lumière » qui monte, et une annonce quand un palier change
  gainCamp(d, palier, ancienPalier) {
    const lum = d > 0;
    const t = this.add.text(226, 21, `${lum ? '+' + d + ' ☀ lumière' : '+' + (-d) + ' ☾ ombre'}`, style(14, lum ? '#ffe070' : '#d0b0ff', { fontStyle: 'bold', stroke: '#1e130a', strokeThickness: 4, brut: true })).setOrigin(0, 0.5).setDepth(101);
    this.tweens.add({ targets: t, x: 246, alpha: 0, duration: 1800, delay: 700, onComplete: () => t.destroy() });
    this.tweens.add({ targets: this.jaugeCampG, alpha: { from: 0.4, to: 1 }, duration: 160, yoyo: true, repeat: 2 });
    Son.jouer(lum ? 'clochette' : 'froid');
    if (palier !== ancienPalier && ancienPalier !== null) {
      const c = this.add.container(480, 120).setDepth(118);
      const mot = this.add.text(0, 0, `${palier > ancienPalier ? '☀' : '☾'}  ${NOMS_PALIERS_JAUGE[palier]}  ${palier > ancienPalier ? '☀' : '☾'}`, style(26, palier > 0 ? '#ffe070' : palier < 0 ? '#d8b8ff' : '#fff4dc', { fontStyle: 'bold', stroke: '#1e130a', strokeThickness: 6, brut: true })).setOrigin(0.5);
      const sous = this.add.text(0, 30, palier > ancienPalier ? 'Le monde te voit un peu plus du côté de la lumière' : 'Le monde te voit un peu plus du côté de l\'ombre', style(13, '#fff4dc', { fontStyle: 'italic', stroke: '#1e130a', strokeThickness: 4, brut: true })).setOrigin(0.5);
      c.add([mot, sous]); c.setScale(0.5).setAlpha(0);
      this.tweens.add({ targets: c, scale: 1, alpha: 1, duration: 400, ease: 'Back.easeOut' });
      this.tweens.add({ targets: c, alpha: 0, delay: 2800, duration: 600, onComplete: () => c.destroy() });
    }
  }

  // La scène du jeu qu'on regarde (la plus haute, hors bandeau).
  scenePrincipale() {
    const actives = this.scene.manager.getScenes(true).filter(s => s.scene.key !== 'Hud');
    return actives[actives.length - 1];
  }

  update() {
    const G = window.GAME;
    const s = this.scenePrincipale();
    const visible = !!(G && s && !SCENES_SANS_BANDEAU.includes(s.scene.key));
    this.bandeau.setVisible(visible && !this.fenetre);
    if (visible) {
      this.texteJour.setText(`Jour ${G.jour}`);
      const sa = typeof saisonDe === 'function' && G.jour ? saisonDe(G) : null;
      if (sa && this.iconeSaison.texture.key !== 'iconeSaison_' + sa) this.iconeSaison.setTexture('iconeSaison_' + sa);
      this.iconeSaison.setVisible(!!sa).setX(Math.min(103, this.texteJour.x + this.texteJour.width + 9));
      const r = Math.round(G.reputation * 10) / 10;
      if (r !== this.reputAffichee) {
        if (this.reputAffichee !== null) {
          const d = Math.round((r - this.reputAffichee) * 10) / 10;
          // (à droite de la plaque, pour ne rien cacher en dessous)
          Son.jouer('pieces', { montant: Math.abs(d) });
          const t = this.add.text(226, 9, `${d > 0 ? '+' : ''}${String(d).replace('.', ',')}`, style(15, d > 0 ? '#a8f088' : '#ff8070', { fontStyle: 'bold', stroke: '#1e130a', strokeThickness: 4, brut: true })).setOrigin(0, 0.5).setDepth(101);
          this.tweens.add({ targets: t, x: 250, alpha: 0, duration: 1600, delay: 300, onComplete: () => t.destroy() });
          this.tweens.add({ targets: this.texteReput, scale: 1.25, duration: 150, yoyo: true });
        }
        this.reputAffichee = r;
        this.texteReput.setText(String(r).replace('.', ','));
        // La jauge glisse jusqu'à sa nouvelle place dans le palier
        const pal = palierClients(G);
        const debut = pal.reputation === -Infinity ? 0 : pal.reputation, fin = pal.suivant ? pal.suivant.reputation : debut + 10;
        const cible = Phaser.Math.Clamp((G.reputation - debut) / (fin - debut), 0, 1);
        this.tweens.killTweensOf(this);
        this.tweens.add({ targets: this, remplissage: cible, duration: 600, ease: 'Sine.easeOut', onUpdate: () => this.dessinerJauge() });
        this.dessinerJauge();
      }
      this.goutte.setVisible(!!benieJusqua(G));
      // (v0.84) la lumière et l'ombre
      const j = jaugeCamp(G), pal = palierCamp(G);
      if (j !== this.campAffiche) {
        if (this.campAffiche !== null && this.joueurCamp === G) this.gainCamp(j - this.campAffiche, pal, this.palierAffiche);
        this.campAffiche = j; this.palierAffiche = pal; this.joueurCamp = G;
        this.dessinerCamp(j);
      }
    } else {
      if (this.bulleReput) this.infoReput(false);
      if (this.bulleCamp) this.infoCamp(false);
      if (this.bulleNymphe) this.infoNymphe(false);
      if (this.fenetre && !G) this.fermerMenu();
    }
    // Toujours au-dessus des autres pages
    const liste = this.scene.manager.scenes;
    if (liste[liste.length - 1] !== this) this.scene.bringToTop();
  }

  ouvrirMenu() {
    if (this.fenetre) return;
    // Le jeu s'arrête derrière la question (timers, animations, clients).
    const s = this.scenePrincipale();
    this.scenePausee = s && s.scene.isActive() ? s : null;
    if (this.scenePausee) this.scenePausee.scene.pause();
    const c = this.fenetre = this.add.container(0, 0).setDepth(110);
    c.add(this.add.rectangle(480, 270, 960, 540, 0x000000, 0.55).setInteractive());
    c.add(this.add.image(480, 270, panneauHD(this, 480, 320)).setScale(2));
    c.add(this.add.text(480, 150, 'Pause', style(26, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
    c.add(this.add.text(480, 186, 'Ta partie est sauvegardée. En pleine journée,\ntu la reprendras au matin de ce jour-là.', style(14, '#4a2e18', { align: 'center', lineSpacing: 3 })).setOrigin(0.5));
    // (v0.57) un bouton par chose à faire, les uns sous les autres
    const boutons = [
      ['Continuer', () => this.fermerMenu()],
      ['Réglages du son', () => this.ouvrirReglages()],
      ['Sauvegardes', () => {
        this.fenetre.setVisible(false);
        ouvrirFenetreEmplacements({ peutSauver: !!window.GAME && !window.GAME.faillite, surCharger: p => { this.fermerMenu(); lancerPartieChargee(this, p); }, surFermer: () => { if (this.fenetre) this.fenetre.setVisible(true); } });
      }],
      ['Journal de bord', () => this.ouvrirJournal()],
      ['Écran titre', () => this.retourTitre()],
    ];
    boutons.forEach(([texte, action], k) => { const b = creerBouton(this, 480, 228 + k * 40, 240, texte, action); c.add([b.fond, b.label]); });
  }

  // (v0.57) Les réglages du son : cinq volumes, chacun avec sa glissière et son interrupteur.
  // On y arrive depuis le menu ☰ ou depuis l'écran titre.
  ouvrirReglages() {
    Son.demarrer();
    const depuisMenu = !!this.fenetre;
    if (depuisMenu) this.fenetre.setVisible(false);
    else {
      const s = this.scenePrincipale();
      this.scenePausee = s && s.scene.isActive() ? s : null;
      if (this.scenePausee) this.scenePausee.scene.pause();
    }
    const c = this.reglages = this.add.container(0, 0).setDepth(115);
    c.add(this.add.rectangle(480, 270, 960, 540, 0x000000, 0.55).setInteractive());
    c.add(this.add.image(480, 270, panneauHD(this, 560, 380)).setScale(2));
    c.add(this.add.text(480, 112, 'Réglages du son', style(26, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
    const lignes = [
      ['general', 'Volume général', null],
      ['musique', 'Musique', null],
      ['sons', 'Bruitages', 'pieces'],
      ['voix', 'Voix', 'voix'],
      ['interface', 'Interface (clics, pages)', 'clic'],
    ];
    const X0 = 452, L = 170;
    lignes.forEach(([quoi, nom, essai], k) => {
      const y = 162 + k * 50;
      c.add(this.add.text(232, y, nom, style(16, '#3b2410', { fontStyle: 'bold' })).setOrigin(0, 0.5));
      const piste = this.add.rectangle(X0, y, L, 10, 0x6b4a2a).setOrigin(0, 0.5).setStrokeStyle(2, 0x3b2410);
      const rempli = this.add.rectangle(X0, y, 0, 10, 0xc9a227).setOrigin(0, 0.5);
      const curseur = this.add.circle(X0, y, 9, 0xf3d98a).setStrokeStyle(2, 0x3b2410);
      const valeur = this.add.text(X0 + L + 22, y, '', style(15, '#3b2410', { fontStyle: 'bold' })).setOrigin(0, 0.5);
      const inter = this.add.image(X0 + L + 92, y, 'glyphe_son').setScale(2.2).setInteractive({ useHandCursor: true });
      const maj = () => {
        const v = Son.volumes[quoi], coupe = Son.coupe[quoi];
        rempli.width = L * v; curseur.x = X0 + L * v;
        rempli.setFillStyle(coupe ? 0x8a7a6a : 0xc9a227);
        valeur.setText(coupe ? 'coupé' : `${Math.round(v * 100)} %`);
        inter.setTexture(coupe ? 'glyphe_muet' : 'glyphe_son');
      };
      const essayer = () => { if (essai === 'voix') Son.jouer('voix', { race: 'humain', nom: 'Essai', ton: 'bonjour' }); else if (essai) Son.jouer(essai, { montant: 3 }); };
      // un clic ou un glissé sur la piste règle le volume
      const zone = this.add.rectangle(X0 - 10, y, L + 20, 30, 0xffffff, 0).setOrigin(0, 0.5).setInteractive({ useHandCursor: true, draggable: false });
      let tire = false;
      const regler = pointeur => { const x = this.cameras.main.getWorldPoint(pointeur.x, pointeur.y).x; Son.regler(quoi, Math.round(Phaser.Math.Clamp((x - X0) / L, 0, 1) * 20) / 20); maj(); };
      zone.on('pointerdown', p => { tire = true; regler(p); });
      zone.on('pointermove', p => { if (tire && p.isDown) regler(p); });
      zone.on('pointerup', () => { if (tire) essayer(); tire = false; });
      zone.on('pointerout', () => { tire = false; });
      inter.on('pointerdown', () => { Son.basculer(quoi); maj(); if (!Son.coupe[quoi]) essayer(); });
      maj();
      c.add([piste, rempli, curseur, valeur, inter, zone]);
    });
    const fermer = creerBouton(this, 480, 432, 200, 'Fermer', () => {
      this.reglages.destroy(); this.reglages = null;
      if (depuisMenu && this.fenetre) this.fenetre.setVisible(true);
      else if (!depuisMenu) { if (this.scenePausee && this.scenePausee.scene.isPaused()) this.scenePausee.scene.resume(); this.scenePausee = null; }
    });
    c.add([fermer.fond, fermer.label]);
  }

  fermerMenu() {
    if (this.fenetre) this.fenetre.destroy();
    this.fenetre = null;
    if (this.scenePausee && this.scenePausee.scene.isPaused()) this.scenePausee.scene.resume();
    this.scenePausee = null;
  }

  retourTitre() {
    this.fermerMenu();
    for (const s of this.scene.manager.getScenes(false)) {
      if (s.scene.key !== 'Hud' && (s.scene.isActive() || s.scene.isPaused() || s.scene.isSleeping())) s.scene.stop();
    }
    this.scene.launch('Titre');
  }
}
