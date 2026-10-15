// (v0.65, étape 10c) La rue, le jour : au sortir du shop, on la traverse à pied jusqu'à l'arche du
// Marché des Mastres (ou l'inverse en rentrant). La forge est ouverte, des passants vont et viennent ;
// on peut entrer à la banque. « Au marché » et « Chez toi » restent des raccourcis.
class RueScene extends Phaser.Scene {
  constructor() { super('Rue'); }

  init(data) { this.depuis = (data && data.depuis) || 'shop'; }

  create() {
    const G = this.G = window.GAME;
    this.fini = false; this.transition = false;
    this.cameras.main.fadeIn(400);
    const sol = 470;
    this.portes = [];
    const ici = {
      regarder: (x, y, l, h, texte) => {
        const z = this.add.rectangle(x + l / 2, y + h / 2, l, h, 0xffffff, 0).setDepth(8.4).setInteractive({ useHandCursor: true });
        z.on('pointerdown', () => { this.allerVers(x + l / 2); this.dire(texte); });
      },
      porte: (x, s, etiquette, page, { large = 80, haut = 110 } = {}) => {
        const z = this.add.rectangle(x, s - haut / 2 - 5, large, haut, 0xffffff, 0).setDepth(8.65).setInteractive({ useHandCursor: true });
        this.add.text(x, s - 140, etiquette, style(12, '#fff4dc', { fontStyle: 'bold italic', stroke: '#1a0e06', strokeThickness: 4 })).setOrigin(0.5).setDepth(8.6);
        z.on('pointerdown', () => this.passerPar(page, x));
      },
    };
    const r = construireRue(this, 0, { jour: true, ici });
    this.porteShop = r.porteShop;
    // la porte du shop : on rentre chez soi
    const zp = this.add.rectangle(this.porteShop.x, sol - 60, 70, 120, 0xffffff, 0).setDepth(8.65).setInteractive({ useHandCursor: true });
    this.add.text(this.porteShop.x, sol - 150, 'Rentrer', style(12, '#fff4dc', { fontStyle: 'bold italic', stroke: '#1a0e06', strokeThickness: 4 })).setOrigin(0.5).setDepth(8.6);
    zp.on('pointerdown', () => this.passerPar('Maison', this.porteShop.x));

    textureJoueur(this, G);
    const x0 = this.depuis === 'marche' ? PLACES_RUE.arche - 60 : this.porteShop.x + 40;
    this.heros = this.add.image(x0, SOL_PROMENADE, textureJoueur(this, G)).setOrigin(0.5, 1).setScale(echelleJoueur(7.5)).setDepth(8.5).setFlipX(this.depuis === 'marche');
    this.cible = null; this.pas = 0;
    this.cameras.main.scrollX = Phaser.Math.Clamp(x0 - 480, 0, LARGEUR_RUE - 960);

    // l'interface, fixe à l'écran
    const fixe = o => o.setScrollFactor(0).setDepth(30);
    fixe(this.add.text(480, 22, `La rue du marché · jour ${G.jour}`, style(22, '#fff4dc', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 5 })).setOrigin(0.5));
    fixe(this.add.text(480, 48, '◀ ▶ ou clique au sol pour marcher · clique sur les maisons pour les regarder · l\'arche mène au marché', style(12, '#fff4dc', { fontStyle: 'italic', stroke: '#1a0e06', strokeThickness: 3 })).setOrigin(0.5));
    this.bulle = fixe(this.add.text(480, 78, '', style(14, '#3b2410', { fontStyle: 'italic', backgroundColor: '#ead9b0', padding: { x: 10, y: 6 }, wordWrap: { width: 640 }, align: 'center' })).setOrigin(0.5, 0).setVisible(false));
    for (const [x, l, texte, page] of [[110, 190, '◀ Chez toi', 'Maison'], [850, 200, 'Au marché ▶▶', 'Marche']]) { const b = creerBouton(this, x, 505, l, texte, () => this.passerPar(page)); fixe(b.fond); fixe(b.label); }

    this.input.on('pointerdown', (pointeur, sous) => { if (!sous.length) this.allerVers(pointeur.worldX); });
    this.touches = this.input.keyboard ? this.input.keyboard.createCursorKeys() : null;
    // des passants qui vont et viennent
    this.time.addEvent({ delay: 4500, startAt: 3500, loop: true, callback: () => this.passant() });
    this.passant();
    // (v0.68) quelqu'un se repose sur le banc, de temps en temps
    this.banc = r.banc; this.surLeBanc = null;
    this.time.addEvent({ delay: 9000, startAt: 8000, loop: true, callback: () => this.reposBanc() });
    if (Math.random() < 0.6) this.reposBanc();
  }

  reposBanc() {
    if (this.surLeBanc && this.surLeBanc.active) {
      if (Math.random() < 0.4) { const p = this.surLeBanc; this.surLeBanc = null; this.tweens.add({ targets: p, alpha: 0, duration: 500, onComplete: () => p.destroy() }); }
      return;
    }
    if (Math.random() < 0.5) return;
    const race = auHasard(['humain', 'humain', 'hobbit', 'nain', 'elfe', 'magicienne']);
    const quoi = { nom: auHasard(NOMS_PASSANTS_RUE) + ' ' + Math.floor(Math.random() * 99), race, niveau: auHasard(['novice', 'aguerri']), feminin: Math.random() < 0.5 };
    const p = this.surLeBanc = imageCorps(this, this.banc.x + (Math.random() < 0.5 ? -22 : 22), this.banc.sol - 6, quoi, 7.2, 'assis').setDepth(8.44).setFlipX(Math.random() < 0.5).setAlpha(0).setInteractive({ useHandCursor: true });
    this.tweens.add({ targets: p, alpha: 1, duration: 500 });
    p.on('pointerdown', () => { this.allerVers(p.x + 70); this.dire(`« ${auHasard(['Belle journée, hein ? Je me pose deux minutes, mes pieds n\'en peuvent plus.', 'Je regarde passer les aventuriers. Il en part tous les jours, de chez toi !', 'Chut... j\'écoute les potins du marché.', 'Ce banc est le meilleur du village. Ne le dis à personne.'])} »`); });
  }

  passant() {
    const race = auHasard(['humain', 'humain', 'hobbit', 'nain', 'elfe', 'magicienne']);
    const quoi = { nom: auHasard(NOMS_PASSANTS_RUE) + ' ' + Math.floor(Math.random() * 99), race, niveau: auHasard(['novice', 'aguerri']) };
    const sens = Math.random() < 0.5 ? 1 : -1, cam = this.cameras.main.scrollX;
    const x0 = sens > 0 ? cam - 60 : cam + 1020, x1 = sens > 0 ? cam + 1100 : cam - 140;
    const p = imageCorps(this, x0, SOL_PROMENADE + 4 + Math.random() * 8, quoi, 7.2).setFlipX(sens < 0).setDepth(8.45);
    const duree = Math.abs(x1 - x0) * 11;
    pasDeMarche(this, p, duree, { poussiere: false });
    this.tweens.add({ targets: p, x: x1, duration: duree, onComplete: () => p.destroy() });
  }

  dire(texte) {
    this.bulle.setText(texte).setVisible(true).setAlpha(1);
    this.tweens.killTweensOf(this.bulle);
    this.tweens.add({ targets: this.bulle, alpha: 0, delay: 4000, duration: 600 });
  }

  allerVers(x) { this.cible = Phaser.Math.Clamp(x, 40, LARGEUR_RUE - 40); }

  // Entrer quelque part : à pied jusqu'à la porte (si on la donne), puis on y va.
  passerPar(page, x = null) {
    if (this.transition || this.fini) return;
    this.transition = true;
    const aller = () => {
      Son.jouer('porte');
      if (page === 'Banque') { this.transition = false; this.scene.pause(); this.scene.launch('Banque', { retour: 'Rue' }); return; }
      this.fini = true;
      Sauvegarde.maintenant(this.G, page === 'Maison' ? 'Maison' : 'Marche');
      this.cameras.main.fadeOut(300);
      this.cameras.main.once('camerafadeoutcomplete', () => (page === 'Maison' ? this.scene.start('Nuit', { matin: true }) : this.scene.start('Marche')));
    };
    if (x === null) return aller();
    this.allerVers(x);
    const attendre = () => (this.cible === null ? aller() : this.time.delayedCall(60, attendre));
    attendre();
  }

  update(temps, delta) {
    if (!this.heros) return;
    let dx = 0;
    if (this.touches && (this.touches.left.isDown || this.touches.right.isDown) && !this.transition) {
      this.cible = null;
      dx = (this.touches.right.isDown ? 1 : -1) * 0.32 * delta;
    } else if (this.cible !== null) {
      const reste = this.cible - this.heros.x;
      dx = Math.sign(reste) * Math.min(Math.abs(reste), 0.32 * delta);
      if (Math.abs(reste) < 1) this.cible = null;
    }
    if (dx) {
      this.heros.x = Phaser.Math.Clamp(this.heros.x + dx, 40, LARGEUR_RUE - 40);
      this.heros.setFlipX(dx < 0);
      this.pas += delta;
      if (!this.heros.marche) pasDeMarche(this, this.heros, 260);
      this.heros.y = SOL_PROMENADE - Math.abs(Math.sin(this.pas / 120)) * 2;
    } else this.heros.y = SOL_PROMENADE;
    this.cameras.main.scrollX = Phaser.Math.Clamp(this.heros.x - 480, 0, LARGEUR_RUE - 960);
  }
}

const NOMS_PASSANTS_RUE = ['Passant', 'Passante', 'Voyageur', 'Colporteur', 'Badaud'];
