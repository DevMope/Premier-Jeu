// Base commune des cinématiques (récits, introduction, faillite) :
// une boîte de texte, « clique pour continuer », et des animations qu'on attend avec `await`.
class Cinematique extends Phaser.Scene {
  creerBoiteTexte() {
    this.boite = this.add.image(480, 455, panneauHD(this, 940, 150, 'ardoise')).setScale(2).setDepth(10).setScrollFactor(0);
    this.entete = this.add.text(30, 392, '', style(16, '#f3d98a', { fontStyle: 'bold' })).setDepth(10);
    this.texte = this.add.text(30, 418, '', style(18, '#f3e6c8', { wordWrap: { width: 900 }, lineSpacing: 6 })).setDepth(10);
    this.indice = this.add.text(940, 518, '▶ clique pour continuer', style(13, '#c9b48a', { fontStyle: 'italic' }))
      .setOrigin(1, 0.5).setVisible(false).setDepth(10);
    for (const o of [this.entete, this.texte, this.indice]) o.setScrollFactor(0);
    this.tweens.add({ targets: this.indice, alpha: 0.4, duration: 600, yoyo: true, repeat: -1 });
  }

  ecrire(entete, texte) {
    this.entete.setText(entete);
    this.texte.setText(texte);
  }

  // À la fin d'une cinématique : on attend que le joueur clique pour passer à la suite
  // (rien ne s'enchaîne tout seul).
  attendreSuite(texte = '▶ Clique pour continuer') {
    const t = this.add.text(940, 520, texte, style(15, '#fff4dc', { fontStyle: 'bold italic', stroke: '#2a1a10', strokeThickness: 4 }))
      .setOrigin(1, 0.5).setDepth(30).setScrollFactor(0);
    this.tweens.add({ targets: t, alpha: 0.4, duration: 700, yoyo: true, repeat: -1 });
    return new Promise(resoudre => this.time.delayedCall(300, () => this.input.once('pointerdown', () => { t.destroy(); resoudre(); })));
  }

  attendreClic() {
    // En accéléré (« Passer »), on n'attend pas les clics : l'histoire défile toute seule.
    if (this.rapide) return this.attendre(150);
    return new Promise(resoudre => {
      this.time.delayedCall(200, () => {
        this.indice.setVisible(true);
        const suite = () => { this.events.off('passer', suite); this.input.off('pointerdown', suite); this.indice.setVisible(false); resoudre(); };
        this.input.once('pointerdown', suite);
        this.events.once('passer', suite);
      });
    });
  }

  attendre(ms) {
    return new Promise(resoudre => this.time.delayedCall(ms, resoudre));
  }

  animer(config) {
    return new Promise(resoudre => this.tweens.add({ ...config, onComplete: resoudre }));
  }

  // Un personnage marche jusqu'à x en sautillant, façon figurine.
  async marcher(sprite, x, vitesse = 5) {
    const duree = Math.max(300, Math.abs(x - sprite.x) * vitesse);
    if (x !== sprite.x) sprite.setFlipX(x < sprite.x);
    const y = sprite.y;
    // Les personnages HD marchent vraiment (jambes, bras, poussière) ; les autres sautillent.
    const hd = this.textures.exists(sprite.texture.key.replace(/_pas[12]$/, '') + '_pas1');
    if (hd) pasDeMarche(this, sprite, duree);
    this.tweens.add({ targets: sprite, y: y - (hd ? 2 : 6), duration: hd ? 125 : 130, yoyo: true, repeat: Math.floor(duree / (hd ? 250 : 260)) });
    await this.animer({ targets: sprite, x, duration: duree, ease: 'Linear' });
    sprite.y = y;
  }

  // Un mot qui surgit, façon bande dessinée (« PLOUF ! », « BAM ! »).
  onomatopee(x, y, mot, couleur = '#fff4dc') {
    const t = this.add.text(x, y, mot, style(30, couleur, { fontStyle: 'bold', stroke: '#2a1a10', strokeThickness: 6 }))
      .setOrigin(0.5).setScale(0).setDepth(9).setAngle(Phaser.Math.Between(-12, 12));
    this.tweens.add({ targets: t, scale: 1, duration: 200, ease: 'Back.easeOut' });
    this.tweens.add({ targets: t, alpha: 0, y: y - 30, delay: 900, duration: 500, onComplete: () => t.destroy() });
  }

  // « Passer ▶▶ » en haut à droite.
  boutonPasser(action) {
    const t = this.add.text(940, 20, 'Passer ▶▶', style(15, '#fff4dc', { fontStyle: 'bold', backgroundColor: '#3b2410', padding: { x: 8, y: 4 } }))
      .setOrigin(1, 0).setDepth(20).setScrollFactor(0).setInteractive({ useHandCursor: true });
    // (le 4e argument est l'événement de Phaser : l'arrêter évite que ce clic fasse aussi avancer l'histoire)
    t.on('pointerdown', (pointer, x, y, evenement) => { evenement.stopPropagation(); action(); });
  }
}
