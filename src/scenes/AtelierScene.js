// L'atelier : les objets de valeur rachetés aux aventuriers. On en répare un à la fois ;
// chaque réparation prend plusieurs jours et fait monter l'objet d'un état (et sa valeur).
// La page s'ouvre par-dessus le soir, qui reste en pause.
class AtelierScene extends Phaser.Scene {
  constructor() { super('Atelier'); }

  create() {
    const G = this.G = window.GAME;
    this.cameras.main.setBackgroundColor('#2a1a10');

    // L'établi
    const g = this.add.graphics();
    g.fillStyle(0x3b2410).fillRect(0, 0, 960, 540);
    g.lineStyle(2, 0x2a1a10);
    for (let y = 0; y < 540; y += 36) g.lineBetween(0, y, 960, y);
    g.fillStyle(0x8a5a2b).fillRect(20, 470, 920, 16);
    this.add.image(60, 470, 'enclume').setOrigin(0.5, 1).setScale(6);

    this.add.text(480, 30, "L'atelier", style(28, '#f3d98a', { fontStyle: 'bold' })).setOrigin(0.5);
    this.add.text(480, 62, `Artisanat niv. ${niveauArtisanat(G)} · un objet à la fois · plus tu répares, plus ça va vite · vends tes objets aux enchères du Mastre Marché`,
      style(12, '#c9b48a', { fontStyle: 'italic' })).setOrigin(0.5);
    this.texteInfo = this.add.text(480, 445, '', style(14, '#f3d98a', { fontStyle: 'bold' })).setOrigin(0.5);

    creerBouton(this, 840, 510, 180, 'Fermer', () => this.fermer());
    this.liste();
  }

  liste() {
    const G = this.G;
    if (this.contenu) this.contenu.destroy();
    const c = this.contenu = this.add.container(0, 0);
    c.add(this.add.rectangle(480, 255, 900, 330, 0xead9b0).setStrokeStyle(3, 0x8a6a3a));
    c.add(this.add.text(50, 100, `Tes objets de valeur (${G.tresors.length} / ${PLACES_ATELIER}) · Fer ${G.materiaux.fer} · Cuir ${G.materiaux.cuir}`,
      style(14, '#3b2410', { fontStyle: 'bold' })));
    if (!G.tresors.length) {
      c.add(this.add.text(480, 255, "L'atelier est vide.\nRachète des objets aux aventuriers à la fin de leur récit.",
        style(15, '#6b4a2a', { align: 'center', lineSpacing: 6 })).setOrigin(0.5));
    }
    G.tresors.forEach((t, i) => {
      const y = 140 + i * 36;
      c.add(this.add.image(70, y, 'tr_' + t.categorie).setScale(3));
      c.add(this.add.text(95, y, t.nom, style(14, '#3b2410', { fontStyle: 'bold' })).setOrigin(0, 0.5));
      c.add(this.add.text(330, y, `${CATEGORIES[t.categorie].nom} · ${ETATS[t.etat].nom}`, style(13, '#5a3a20')).setOrigin(0, 0.5));
      c.add(this.add.text(520, y, `~${valeurTresor(t)} p.`, style(13, '#3b2410', { fontStyle: 'bold' })).setOrigin(0, 0.5));
      if (t.reparation) {
        c.add(this.add.text(910, y, `En réparation : encore ${t.reparation.jours} jour${t.reparation.jours > 1 ? 's' : ''}`,
          style(13, '#2f6a2a', { fontStyle: 'bold' })).setOrigin(1, 0.5));
      } else if (t.etat >= ETATS.length - 1) {
        c.add(this.add.text(910, y, 'Parfait état', style(13, '#1f5aa0', { fontStyle: 'italic' })).setOrigin(1, 0.5));
      } else {
        const mat = CATEGORIES[t.categorie].materiau;
        const prochaine = Math.round(t.valeurBase * ETATS[t.etat + 1].valeur);
        const texte = `Réparer : ${dureeReparation(G, t)} j${mat ? `, 1 ${MATERIAUX[mat].nom.toLowerCase()}` : ''} → ~${prochaine} p.`;
        const btn = this.add.rectangle(790, y, 240, 28, 0x8a5a2b).setStrokeStyle(2, 0x3b2410).setInteractive({ useHandCursor: true });
        btn.on('pointerdown', () => {
          const erreur = reparerTresor(G, t);
          if (erreur) return this.texteInfo.setText(erreur);
          this.texteInfo.setText(`Tu te mets au travail sur : ${t.nom}.`);
          this.liste();
        });
        if (enReparation(G)) btn.setAlpha(0.5);
        c.add([btn, this.add.text(790, y, texte, style(12, '#fff4dc', { fontStyle: 'bold' })).setOrigin(0.5)]);
      }
    });
  }

  fermer() {
    this.scene.stop();
    this.scene.resume('Nuit');
  }
}
