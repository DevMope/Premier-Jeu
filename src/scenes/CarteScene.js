// La carte du dispatch : tu choisis la zone où envoyer l'aventurier qui cherche l'aventure.
// Les zones dangereuses s'ouvrent avec la réputation, ou quand un aventurier les découvre.
// La page s'ouvre par-dessus le comptoir, qui reste en pause avec son client.
class CarteScene extends Phaser.Scene {
  constructor() { super('Carte'); }

  init(data) {
    this.comptoir = data.comptoir;
    this.choisie = null;
  }

  create() {
    const G = this.G = window.GAME;
    const v = this.comptoir.voyageur;

    // Le parchemin
    const g = this.add.graphics();
    g.fillStyle(0x3b2410).fillRect(0, 0, 960, 540);
    g.fillStyle(0xe8d4a4).fillRect(14, 50, 932, 368);
    g.lineStyle(4, 0x8a6a3a).strokeRect(14, 50, 932, 368);
    // Les terres de chaque zone, en taches de couleur
    for (const z of Object.values(ZONES)) {
      g.fillStyle(BIOMES[z.biome].pres, 0.35).fillCircle(z.x, z.y, 62);
    }
    // Ton comptoir, et les chemins qui en partent
    const depart = { x: 80, y: 380 };
    g.lineStyle(2, 0x8a6a3a, 0.7);
    for (const z of Object.values(ZONES)) {
      const n = 14;
      for (let i = 0; i < n; i += 2) {
        g.lineBetween(depart.x + (z.x - depart.x) * i / n, depart.y + (z.y - depart.y) * i / n,
          depart.x + (z.x - depart.x) * (i + 1) / n, depart.y + (z.y - depart.y) * (i + 1) / n);
      }
    }
    g.fillStyle(0x8a5a2b).fillRect(depart.x - 14, depart.y - 12, 28, 22);
    g.fillStyle(0xc9a046).fillTriangle(depart.x - 18, depart.y - 12, depart.x, depart.y - 28, depart.x + 18, depart.y - 12);
    this.add.text(depart.x, depart.y + 18, 'Ton comptoir', style(11, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5, 0);

    this.add.text(480, 24, `Où envoyer ${v.nom} ? (${NIVEAUX_AVENTURIER[v.niveau].nom}, ${NOMS_RACES[v.race] || v.race})`,
      style(20, '#f3d98a', { fontStyle: 'bold' })).setOrigin(0.5);

    // Les zones
    this.anneau = this.add.circle(0, 0, 30).setStrokeStyle(4, 0xffe066).setVisible(false);
    this.tweens.add({ targets: this.anneau, scale: 1.15, duration: 500, yoyo: true, repeat: -1 });
    for (const [cle, z] of Object.entries(ZONES)) {
      const ouverte = zoneOuverte(G, cle);
      const pastille = this.add.circle(z.x, z.y, 22, ouverte ? BIOMES[z.biome].loin : 0x8a8478).setStrokeStyle(3, 0x3b2410)
        .setInteractive({ useHandCursor: true });
      this.add.text(z.x, z.y, ouverte ? '★'.repeat(z.danger) : '?', style(ouverte ? 10 : 18, '#fff4dc', { fontStyle: 'bold', stroke: '#2a1a10', strokeThickness: 3 })).setOrigin(0.5);
      this.add.text(z.x, z.y + 28, ouverte ? z.nom : '???', style(11, ouverte ? '#3b2410' : '#7a7468', { fontStyle: 'bold', align: 'center', wordWrap: { width: 150 } })).setOrigin(0.5, 0);
      pastille.on('pointerdown', () => this.choisir(cle));
    }

    // Le panneau d'infos
    this.add.rectangle(480, 476, 932, 100, 0x2a1a10).setStrokeStyle(2, 0xc9a227);
    this.titreZone = this.add.text(30, 436, 'Clique sur une zone de la carte.', style(16, '#f3d98a', { fontStyle: 'bold' }));
    this.texteZone = this.add.text(30, 460, '', style(12, '#f3e6c8', { lineSpacing: 4, wordWrap: { width: 620 } }));
    this.icones = this.add.container(0, 0);
    this.boutonEnvoyer = creerBouton(this, 810, 455, 230, 'Envoyer ici', () => this.envoyer());
    this.boutonEnvoyer.setActif(false);
    creerBouton(this, 810, 503, 230, 'Retour au comptoir', () => this.fermer({ annule: true }));
  }

  choisir(cle) {
    const G = this.G;
    const v = this.comptoir.voyageur;
    const z = ZONES[cle];
    this.anneau.setVisible(true).setPosition(z.x, z.y);
    this.icones.removeAll(true);
    if (!zoneOuverte(G, cle)) {
      this.choisie = null;
      this.boutonEnvoyer.setActif(false);
      this.titreZone.setText('Une contrée inconnue');
      this.texteZone.setText(`Personne ne sait vraiment ce qu'il y a là-bas. Elle s'ouvrira avec une réputation de ${z.reputation}, ` +
        "ou quand un aventurier revenu d'une zone voisine t'en parlera dans son récit.");
      return;
    }
    this.choisie = cle;
    this.boutonEnvoyer.setActif(true);
    const niv = NIVEAUX_AVENTURIER[v.niveau];
    const quetes = z.quetes.map(q => QUETES[q]);
    const mult = BUTIN_PAR_DANGER[z.danger] / BUTIN_PAR_DANGER[1] * niv.butin;
    const butinMin = Math.round(Math.min(...quetes.map(q => q.butin[0])) * mult);
    const butinMax = Math.round(Math.max(...quetes.map(q => q.butin[1])) * mult);
    const dureeMin = Math.min(...quetes.map(q => q.duree[0]));
    const dureeMax = Math.max(...quetes.map(q => q.duree[1]));
    this.titreZone.setText(`${z.nom}  ·  danger ${'★'.repeat(z.danger)} (${z.danger}/5)`);
    this.texteZone.setText(`${z.description}\nButin espéré : ${butinMin} à ${butinMax} p. · Durée : ${dureeMin} à ${dureeMax} jours · Il faut souvent :`);
    besoinsDeZone(cle).forEach((id, i) => {
      const enStock = this.G.stock[id] || 0;
      this.icones.add(this.add.image(40 + i * 46, 512, id).setScale(2.5));
      this.icones.add(this.add.text(54 + i * 46, 512, String(enStock), style(11, enStock ? '#b8e0a0' : '#f0a8a0', { fontStyle: 'bold' })).setOrigin(0, 0.5));
    });
  }

  envoyer() {
    if (!this.choisie) return;
    envoyerDans(this.G, this.comptoir.voyageur, this.choisie);
    this.fermer({ destination: this.choisie });
  }

  fermer(donnees) {
    this.scene.stop();
    this.scene.resume('Comptoir', donnees);
  }
}
