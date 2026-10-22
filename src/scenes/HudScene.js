// Le bandeau toujours visible, par-dessus toutes les pages du jeu : le jour en cours, et le
// menu « ☰ » pour retourner à l'écran titre quand on veut.
// Cette scène tourne en permanence, au-dessus des autres (elle s'y remet à chaque image).
const SCENES_SANS_BANDEAU = ['Titre', 'Intro', 'IntroHistoire', 'Renovation', 'Faillite', 'Carrefour', 'Saison', 'TirArc', 'Mat', 'Roue', 'Banquet', 'Diseuse', 'Lanternes', 'Vision', 'DiscoursSage', 'Moulin', 'Parrain', 'Peche', 'Barbier', 'Hud'];

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
    // (v1.05, planche 24 C) la bûche rouge : le soir, en Givre, tant que le foyer est vide
    const buche = this.add.graphics();
    buche.fillStyle(0x1e130a, 0.92).fillRoundedRect(-20, -11, 40, 22, 6).lineStyle(2, 0xc02a1a, 1).strokeRoundedRect(-20, -11, 40, 22, 6);
    buche.fillStyle(0x6a3a1a).fillRoundedRect(-12, -4, 22, 9, 4).fillStyle(0x8a5a2a).fillEllipse(10, 0, 6, 9).fillStyle(0x4a2a12).fillEllipse(10, 0, 3, 5);
    buche.lineStyle(2, 0xe03020, 1).lineBetween(-14, 7, 14, -7);
    const zoneBuche = this.add.rectangle(0, 0, 40, 22, 0xffffff, 0).setInteractive({ useHandCursor: true });
    this.buche = this.add.container(268, 9, [buche, zoneBuche]).setVisible(false);
    zoneBuche.on('pointerover', () => this.infoBuche(true));
    zoneBuche.on('pointerout', () => this.infoBuche(false));
    zoneBuche.on('pointerdown', () => this.infoBuche(!this.bulleBuche));
    this.tweens.add({ targets: buche, alpha: 0.55, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    // (v1.11, planche 41) le mois des comptoirs, face au paon d'à côté : le score, et un clic ouvre le panneau
    const med = this.add.graphics();
    med.fillStyle(0x1e130a, 0.92).fillRoundedRect(-42, -11, 84, 22, 6).lineStyle(2, 0xc9a227, 1).strokeRoundedRect(-42, -11, 84, 22, 6);
    med.fillStyle(0x2a4a8a).fillCircle(-29, 0, 7).lineStyle(1, 0xc9a227).strokeCircle(-29, 0, 7).fillStyle(0xd8b048).fillCircle(-29, -2, 2);
    this.texteRival = this.add.text(7, 0, '', style(12, '#f3d98a', { fontStyle: 'bold', brut: true })).setOrigin(0.5);
    const zoneRival = this.add.rectangle(0, 0, 84, 22, 0xffffff, 0).setInteractive({ useHandCursor: true });
    this.medaillonRival = this.add.container(290, 9, [med, this.texteRival, zoneRival]).setVisible(false);
    zoneRival.on('pointerdown', () => this.infoRival(!this.panneauRival));
    zoneRival.on('pointerover', () => this.texteRival.setColor('#ffe066'));
    zoneRival.on('pointerout', () => this.texteRival.setColor('#f3d98a'));
    // (v1.40, planche 67) le carnet des objectifs : une pastille à droite des plaques ; un clic l'ouvre
    this.pastilleObjectifs = this.add.text(0, 9, '', style(12, '#2a1608', { fontStyle: 'bold', backgroundColor: '#f3d98a', padding: { x: 7, y: 2 }, brut: true })).setOrigin(0, 0.5).setInteractive({ useHandCursor: true }).setVisible(false);
    this.pastilleObjectifs.on('pointerdown', () => { Son.jouer('plume'); ouvrirCarnetObjectifs(this); });
    this.pastilleObjectifs.on('pointerover', () => this.pastilleObjectifs.setBackgroundColor('#ffe9a0'));
    this.pastilleObjectifs.on('pointerout', () => this.pastilleObjectifs.setBackgroundColor('#f3d98a'));
    this.compteObjectifs = 0;
    this.bandeau = this.add.container(0, 0, [plaque, menu, this.texteJour, this.iconeSaison, zone, this.etoileReput, this.jaugeReput, this.texteReput, zoneReput, this.jaugeCampG, zoneCamp, this.goutte, this.buche, this.medaillonRival, this.pastilleObjectifs]).setDepth(100);
    // (v0.84) pas assez d'argent : une grande alerte en haut de l'écran, par-dessus toutes les pages
    const surManque = m => this.alerteArgent(m);
    this.game.events.on('manqueArgent', surManque);
    this.events.once('shutdown', () => this.game.events.off('manqueArgent', surManque));
  }

  // (v1.40) Le carnet des objectifs : la pastille suit les plaques visibles ; un objectif atteint s'annonce en direct
  objectifsEnDirect(G) {
    if (typeof verifierObjectifs !== 'function') return;
    let x = 226;
    if (this.goutte.visible) x = 250;
    if (this.buche.visible) x = this.buche.x + 24;
    if (this.medaillonRival.visible) x = this.medaillonRival.x + 46;
    this.pastilleObjectifs.setX(x + 4);
    if (++this.compteObjectifs % 20) return;
    for (const o of verifierObjectifs(G)) {
      Son.jouer('pieces', { montant: o.argent || 3 });
      vignetteGuide(this, 'OBJECTIF ATTEINT ✓', o.texte, o.argent ? `Ta récompense : +${o.argent} pièces.` : `Ta récompense : ${recompenseObjectif(o)}.`, { y: 92, prof: 112 });
      gainEnDirect(this, this.pastilleObjectifs.x + 60, 44, recompenseObjectif(o), true, { taille: 14 });
    }
    const n = objectifsEnCours(G).length;
    const t = `✎ Objectifs (${n})`;
    if (this.pastilleObjectifs.text !== t) this.pastilleObjectifs.setText(t);
    this.pastilleObjectifs.setVisible(n > 0);
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

  // (v1.11) Le panneau du mois des comptoirs, sous le médaillon
  infoRival(montrer) {
    if (this.panneauRival) { this.panneauRival.destroy(); this.panneauRival = null; }
    const G = window.GAME;
    if (!montrer || !G || typeof panneauMoisDesComptoirs !== 'function') return;
    this.panneauRival = panneauMoisDesComptoirs(this, this.medaillonRival.x + 76, 134, G).setDepth(105);
    this.panneauRival.setSize(236, 214).setInteractive().on('pointerdown', () => this.infoRival(false));
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
  // (v1.05) la bûche rouge expliquée
  infoBuche(montrer) {
    if (this.bulleBuche) { this.bulleBuche.destroy(); this.bulleBuche = null; }
    if (!montrer) return;
    this.bulleBuche = this.add.text(this.buche.x - 10, 28, "Le foyer est vide : dehors, il gèle. Mets une bûche dans la cheminée avant de dormir (1 planche de bois), sinon tu te réveilleras fatigué.", style(12, '#3b2410', { fontStyle: 'italic', backgroundColor: '#f3e6c8', padding: { x: 8, y: 5 }, wordWrap: { width: 260 } })).setDepth(102);
  }

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

  // (v1.17) Une relation qui bouge, en direct : « +1 relation » près de celui qui est au comptoir, sinon sous
  // le bandeau avec son nom. (Plusieurs d'un coup, comme au matin des retours, ne s'affichent pas : trop de bruit.)
  relationsEnDirect(G, s) {
    const R = G.relations || {};
    if (this.relationsDe !== G) { this.relationsDe = G; this.relationsVues = { ...R }; return; }
    const changes = [];
    for (const nom in R) if (R[nom] !== (this.relationsVues[nom] || 0)) changes.push([nom, R[nom] - (this.relationsVues[nom] || 0)]);
    if (!changes.length) return;
    this.relationsVues = { ...R };
    if (changes.length > 2) return;
    changes.forEach(([nom, d], i) => {
      const ici = s && s.scene.key === 'Comptoir' && s.voyageur && s.voyageur.nom === nom && typeof FENETRE !== 'undefined';
      const texte = `${ici ? '' : nom + ' : '}${d > 0 ? '+' : '−'}${Math.abs(d)} relation`;
      gainEnDirect(this, ici ? FENETRE.x + 120 : 480, (ici ? FENETRE.y + 70 : 64) + i * 26, texte, d > 0);
    });
  }

  // (v1.24, planche 50 v3) Une pensée de départ : JeuneGoy en médaillon (la pose « il pense ») et sa bulle
  penseesEnDirect(G) {
    if (this.penseeAffichee || this.fichePiece || !G.penseesNouvelles || !G.penseesNouvelles.length || typeof bulleDePensee !== 'function') return;
    const p = G.penseesNouvelles.shift();
    const md = medaillonJeuneGoy(this, 884, 132, G, 38, 128);
    const age = this.add.text(884, 186, `${p.age} ans · ${{ reve: 'il rêve', voir: 'il veut voir', savoir: 'il veut savoir', heros: 'il rêve', carte: 'il veut voir' }[p.temps] || ''}`,
      style(12, '#fff4dc', { fontStyle: 'bold', backgroundColor: '#2a1a10cc', padding: { x: 6, y: 2 } })).setOrigin(0.5).setDepth(129);
    const b = bulleDePensee(this, 676, 118, p.texte, 290, [1, 0], 128);
    const tous = [md, age, b];
    tous.forEach(o => o.setAlpha(0)); this.tweens.add({ targets: tous, alpha: 1, duration: 500 });
    this.tweens.add({ targets: b, y: 114, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });   // (la bulle flotte un peu)
    Son.jouer('page');
    this.penseeAffichee = tous;
    const fin = () => { if (this.penseeAffichee !== tous) return; this.penseeAffichee = null; this.tweens.add({ targets: tous, alpha: 0, duration: 500, onComplete: () => { tous.forEach(o => o.destroy()); if (md.masque) md.masque.destroy(); } }); };
    this.time.delayedCall(6500, fin);
    b.list[0].setInteractive(new Phaser.Geom.Rectangle(-145, -60, 290, 120), Phaser.Geom.Rectangle.Contains).on('pointerdown', fin);
  }

  // (v1.23, planche 48 v2) Une pièce de collection gagnée : une petite fiche en haut à droite, le temps de la voir
  piecesEnDirect(G) {
    if (this.fichePiece || this.penseeAffichee || !G.piecesNouvelles || !G.piecesNouvelles.length || typeof dessinerPieceCollection !== 'function') return;
    const p = G.piecesNouvelles.shift(), C = COLLECTIONS[p.serie];
    creerEmblemesHD(this); creerObjetsHD(this); creerIconesHD(this);
    const x = 838, y = 150, c = this.fichePiece = this.add.container(x, y).setDepth(130);
    const h = p.complete ? 210 : 176;
    c.add(this.add.image(0, 0, panneauHD(this, 220, h)).setScale(2));
    c.add(this.add.text(0, -h / 2 + 18, p.complete ? 'Série complète !' : 'Nouvelle pièce !', style(16, '#5a0e0e', { fontStyle: 'bold' })).setOrigin(0.5));
    const o = dessinerPieceCollection(this, p.serie, p.piece, 0, 0, 1.6, true); o.setPosition(0, -h / 2 + 62); c.add(o);
    c.add(this.add.text(0, -h / 2 + 104, p.nom, style(12, '#3b2410', { fontStyle: 'bold', align: 'center', wordWrap: { width: 196 } })).setOrigin(0.5));
    c.add(this.add.text(0, -h / 2 + 128, `${C.nom} · ${p.n} / ${p.total}`, style(11, '#3b2410', { align: 'center', wordWrap: { width: 200 } })).setOrigin(0.5));
    c.add(this.add.text(0, -h / 2 + 150, p.complete ? `Ton titre : « ${C.titre} »\n${C.bonus}` : 'rangée dans ta vitrine', style(11, p.complete ? '#2f6a2a' : '#6b4a2a', { fontStyle: p.complete ? 'bold' : 'italic', align: 'center', wordWrap: { width: 200 } })).setOrigin(0.5, 0));
    Son.jouer(p.complete ? 'fanfare' : 'clochette');
    c.setAlpha(0).setScale(0.85);
    this.tweens.add({ targets: c, alpha: 1, scale: 1, duration: 350, ease: 'Back.easeOut' });
    const fin = () => { if (!c.active) return; this.tweens.add({ targets: c, alpha: 0, duration: 400, onComplete: () => { c.destroy(); this.fichePiece = null; } }); };
    this.time.delayedCall(p.complete ? 5200 : 3600, fin);
    c.setSize(220, h).setInteractive({ useHandCursor: true }).on('pointerdown', fin);
  }

  update() {
    const G = window.GAME;
    const s = this.scenePrincipale();
    const visible = !!(G && s && !SCENES_SANS_BANDEAU.includes(s.scene.key));
    this.bandeau.setVisible(visible && !this.fenetre);
    // (v1.50, planche 61) les succès débloqués : une vignette à la fois, en haut à droite, dès que le bandeau est là
    if (visible && G.succesAMontrer && G.succesAMontrer.length && !this.vignetteEnCours && typeof vignetteSucces === 'function') {
      this.vignetteEnCours = true;
      try { vignetteSucces(this, G.succesAMontrer[0], { fin: () => this.time.delayedCall(500, () => { this.vignetteEnCours = false; }) }); }
      catch (e) { G.succesAMontrer.shift(); this.vignetteEnCours = false; }
    }
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
          // (v1.17) en direct, sous la plaque : « +0,6 réputation »
          gainEnDirect(this, 196, 44, `${d > 0 ? '+' : '−'}${String(Math.abs(d)).replace('.', ',')} réputation`, d > 0, { taille: 13 });
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
      const sansFeu = typeof foyerVide === 'function' && soirDuJour(G) && foyerVide(G);
      this.buche.setVisible(sansFeu).setX(this.goutte.visible ? 270 : 242);
      // (v1.11) le score du mois des comptoirs, tant que le paon est ouvert
      const paon = typeof rivalOuvert === 'function' && rivalOuvert(G);
      this.medaillonRival.setVisible(paon).setX(sansFeu ? 340 : this.goutte.visible ? 300 : 290);
      if (paon) { const sc = scoreDuMois(G), t = `${sc.toi} – ${sc.lui}`; if (this.texteRival.text !== t) this.texteRival.setText(t); }
      else if (this.panneauRival) this.infoRival(false);
      if (!sansFeu && this.bulleBuche) this.infoBuche(false);
      sansPlanter('objectifsEnDirect', () => this.objectifsEnDirect(G));
      this.relationsEnDirect(G, s);
      // (v1.23) « Nouvelle pièce ! » pour la vitrine ; (v1.24) JeuneGoy pense à partir (v1.31 : jamais de quoi figer le jeu)
      sansPlanter('piecesEnDirect', () => this.piecesEnDirect(G));
      sansPlanter('penseesEnDirect', () => this.penseesEnDirect(G));
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
      if (this.panneauRival) this.infoRival(false);   // (housekeep v1.14 : il flottait par-dessus les scènes sans bandeau)
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
    c.add(this.add.image(480, 270, panneauHD(this, 480, 400)).setScale(2));
    c.add(this.add.text(480, 110, 'Pause', style(26, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
    c.add(this.add.text(480, 146, 'Ta partie est sauvegardée. En pleine journée,\ntu la reprendras au matin de ce jour-là.', style(14, '#4a2e18', { align: 'center', lineSpacing: 3 })).setOrigin(0.5));
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
    boutons.forEach(([texte, action], k) => { const b = creerBouton(this, 480, 188 + k * 40, 240, texte, action); c.add([b.fond, b.label]); });
    // (v1.40) le didacticiel de Garrick : on l'active ou on le coupe, ici, à tout moment
    if (typeof reglerDidacticiel === 'function' && window.GAME) {
      const G = window.GAME;
      const libelle = () => `Didacticiel : ${didacticiel(G) ? 'activé ✓' : 'désactivé'}`;
      const explication = () => didacticiel(G) ? 'Garrick te guide, et les lieux s\'ouvrent petit à petit.' : 'Pas de conseils : tout est ouvert d\'emblée.';
      const b = creerBouton(this, 480, 408, 300, libelle(), () => { reglerDidacticiel(!didacticiel(G), G); b.label.setText(libelle()); note.setText(explication()); });
      const note = this.add.text(480, 436, explication(), style(12, '#5a3a1a', { fontStyle: 'italic' })).setOrigin(0.5);
      c.add([b.fond, b.label, note]);
    }
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
