// Le bandeau toujours visible, par-dessus toutes les pages du jeu : le jour en cours, et le
// menu « ☰ » pour retourner à l'écran titre quand on veut.
// Cette scène tourne en permanence, au-dessus des autres (elle s'y remet à chaque image).
const SCENES_SANS_BANDEAU = ['Titre', 'Intro', 'IntroHistoire', 'Renovation', 'Faillite', 'Hud'];

class HudScene extends Phaser.Scene {
  constructor() { super({ key: 'Hud', active: false }); }

  create() {
    // La plaque : du bois sombre à liseré doré, en haut à gauche
    const plaque = this.add.graphics();
    plaque.fillStyle(0x1e130a, 0.92).fillRoundedRect(-8, -8, 118, 26, 7);
    plaque.lineStyle(2, 0xc9a227, 1).strokeRoundedRect(-8, -8, 118, 26, 7);
    this.texteJour = this.add.text(36, 9, '', style(15, '#f3d98a', { fontStyle: 'bold', brut: true })).setOrigin(0, 0.5);
    const menu = this.add.text(16, 9, '☰', style(17, '#fff4dc', { fontStyle: 'bold', brut: true })).setOrigin(0.5);
    const zone = this.add.rectangle(55, 9, 110, 20, 0xffffff, 0).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => this.ouvrirMenu());
    zone.on('pointerover', () => menu.setColor('#ffe066'));
    zone.on('pointerout', () => menu.setColor('#fff4dc'));
    // La réputation, en direct : elle s'anime quand elle bouge.
    plaque.fillStyle(0x1e130a, 0.92).fillRoundedRect(114, -8, 104, 26, 7);
    plaque.lineStyle(2, 0xc9a227, 1).strokeRoundedRect(114, -8, 104, 26, 7);
    // Une étoile et une jauge dorée qui se remplit vers le prochain palier, le chiffre par-dessus.
    this.etoileReput = this.add.text(126, 9, '⭐', style(13, '#f3d98a', { brut: true })).setOrigin(0, 0.5);
    this.jaugeReput = this.add.graphics();
    this.remplissage = 0;
    this.texteReput = this.add.text(178, 9, '', style(11, '#fff4dc', { fontStyle: 'bold', stroke: '#1e130a', strokeThickness: 4, brut: true })).setOrigin(0.5);
    const zoneReput = this.add.rectangle(166, 9, 104, 20, 0xffffff, 0).setInteractive({ useHandCursor: true });
    zoneReput.on('pointerover', () => this.infoReput(true));
    zoneReput.on('pointerout', () => this.infoReput(false));
    zoneReput.on('pointerdown', () => this.infoReput(!this.bulleReput));
    this.reputAffichee = null;
    this.bandeau = this.add.container(0, 0, [plaque, menu, this.texteJour, zone, this.etoileReput, this.jaugeReput, this.texteReput, zoneReput]).setDepth(100);
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
    this.bulleReput = this.add.text(116, 24, texte, style(12, '#fff4dc', { backgroundColor: '#1e130a', padding: { x: 8, y: 6 }, lineSpacing: 3 })).setDepth(105);
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
    } else if (this.bulleReput) this.infoReput(false);
    else if (this.fenetre && !G) this.fermerMenu();
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
    c.add(this.add.image(480, 270, panneauHD(this, 480, 300)).setScale(2));
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
      ['Écran titre', () => this.retourTitre()],
    ];
    boutons.forEach(([texte, action], k) => { const b = creerBouton(this, 480, 236 + k * 46, 240, texte, action); c.add([b.fond, b.label]); });
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
      const inter = this.add.text(X0 + L + 92, y, '', style(20, '#3b2410', { brut: true })).setOrigin(0.5).setInteractive({ useHandCursor: true });
      const maj = () => {
        const v = Son.volumes[quoi], coupe = Son.coupe[quoi];
        rempli.width = L * v; curseur.x = X0 + L * v;
        rempli.setFillStyle(coupe ? 0x8a7a6a : 0xc9a227);
        valeur.setText(coupe ? 'coupé' : `${Math.round(v * 100)} %`);
        inter.setText(coupe ? '🔇' : '🔊');
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
