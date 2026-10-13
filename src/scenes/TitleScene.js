// Écran titre : continuer la partie sauvegardée, en commencer une nouvelle, ou gérer les sauvegardes.
class TitleScene extends Phaser.Scene {
  constructor() { super('Titre'); }

  create() {
    creerToutesLesTextures(this);

    const g = this.add.graphics();
    dessinerComte(g, 0, 0, 960, 540, 0.35);
    this.add.rectangle(480, 200, 640, 180, 0x2a1a10, 0.75).setStrokeStyle(4, 0xc9a227);

    this.add.text(480, 160, 'Le Passage des Aventuriers', style(40, '#f3d98a', { fontStyle: 'bold' })).setOrigin(0.5);
    this.add.text(480, 212, 'Prépare leurs provisions. Parie sur leur retour.', style(20, '#f3e6c8', { fontStyle: 'italic' })).setOrigin(0.5);
    this.add.text(480, 255, 'Prototype — étape 3', style(16, '#c9b48a')).setOrigin(0.5);

    this.texteSauvegarde = this.add.text(480, 318, 'Recherche de ta sauvegarde...', style(14, '#fff4dc', { fontStyle: 'italic', stroke: '#2a1a10', strokeThickness: 4 })).setOrigin(0.5);
    this.boutonContinuer = creerBouton(this, 480, 360, 300, 'Continuer', () => this.continuer());
    this.boutonContinuer.setVisible(false);
    creerBouton(this, 480, 410, 300, 'Nouvelle partie', () => this.scene.start('Intro'));
    creerBouton(this, 480, 460, 300, 'Sauvegardes', () => this.ouvrirSauvegardes());
    this.chercher();
  }

  async chercher() {
    this.trouvees = await Sauvegarde.trouver();
    if (!this.scene.isActive()) return;
    const p = this.trouvees.meilleure;
    this.boutonContinuer.setVisible(!!p);
    if (p) this.boutonContinuer.setTexte(`Continuer · ${p.nom}, jour ${p.jour}`);
    this.texteSauvegarde.setText(p
      ? `Dernière sauvegarde : ${new Date(p.date).toLocaleString('fr-FR')}${this.trouvees.compte ? ' · aussi sur ton compte' : ''}`
      : 'Aucune sauvegarde pour le moment.');
  }

  continuer() {
    const p = this.trouvees && this.trouvees.meilleure;
    if (p) this.charger(p);
  }

  charger(p) {
    const lieu = Sauvegarde.charger(p);
    if (lieu === 'Maison') this.scene.start('Nuit', { matin: true });
    else this.scene.start(lieu);
  }

  ouvrirSauvegardes() {
    this.input.enabled = false;
    ouvrirFenetreSauvegardes(this.trouvees || { locale: Sauvegarde.lireLocale(), nuage: null, meilleure: Sauvegarde.lireLocale(), compte: false },
      p => { this.input.enabled = true; this.charger(p); },
      () => { this.input.enabled = true; this.chercher(); });
  }
}
