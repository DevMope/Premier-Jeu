// Le soir : bilan de la journée, achats chez le fournisseur,
// lettres reçues et prévision des clients pour demain.
class NightScene extends Phaser.Scene {
  constructor() { super('Nuit'); }

  create() {
    const G = this.G = window.GAME;
    lettresDuSoir(G);

    this.cameras.main.setBackgroundColor('#1e140c');
    this.cameras.main.fadeIn(500);
    this.add.text(480, 34, `Soir du jour ${G.jour}`, style(30, '#f3d98a', { fontStyle: 'bold' })).setOrigin(0.5);
    this.texteArgent = this.add.text(940, 34, '', style(20, '#f3d98a', { fontStyle: 'bold' })).setOrigin(1, 0.5);

    this.panneauJournee(20, 300);
    this.panneauFournisseur(320, 640);
    this.panneauLettres(660, 940);

    creerBouton(this, 480, 505, 240, 'Aller dormir', () => {
      journeeSuivante(G);
      this.cameras.main.fadeOut(600);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Comptoir'));
    });
    this.majArgent();
  }

  parchemin(x1, x2, titre) {
    this.add.rectangle((x1 + x2) / 2, 270, x2 - x1, 400, 0xead9b0).setStrokeStyle(3, 0x8a6a3a);
    this.add.text((x1 + x2) / 2, 90, titre, style(20, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5);
  }

  panneauJournee(x1, x2) {
    const G = this.G;
    const j = G.journal;
    this.parchemin(x1, x2, 'La journée');
    const gain = G.argent - G.argentDebutJour;
    const lignes = [
      `Clients servis : ${j.servis}`,
      `Aventuriers revenus : ${j.retours}`,
      `Mauvaises nouvelles : ${j.morts}`,
      '',
      `Argent ce matin : ${G.argentDebutJour}`,
      `Argent ce soir : ${G.argent}  (${gain >= 0 ? '+' : ''}${gain})`,
      '',
      `Réputation : ${G.reputation}`,
      `Expérience : ${G.experience} clients servis`,
    ];
    this.add.text(x1 + 20, 120, lignes.join('\n'), style(15, '#3b2410', { lineSpacing: 6 }));

    this.add.text(x1 + 20, 330, 'En mission', style(15, '#3b2410', { fontStyle: 'bold' }));
    const missions = enMission(G).map(p => `${p.voyageur.nom} — jour ${p.retour}`);
    this.add.text(x1 + 20, 352, listeCourte(missions, 5, 'Personne'), style(13, '#5a3a20', { lineSpacing: 3 }));
  }

  panneauFournisseur(x1, x2) {
    this.parchemin(x1, x2, 'Le fournisseur');
    this.add.text((x1 + x2) / 2, 112, 'Remplis ton stock pour demain', style(13, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5);
    this.lignesStock = {};
    Object.entries(ITEMS).forEach(([id, item], i) => {
      const y = 145 + i * 38;
      this.add.image(x1 + 30, y, id).setScale(3);
      this.add.text(x1 + 50, y, item.nom, style(15, '#3b2410')).setOrigin(0, 0.5);
      this.add.text(x1 + 140, y, item.prix + ' p.', style(15, '#6b4a2a')).setOrigin(0, 0.5);
      const qte = this.add.text(x1 + 190, y, '', style(15, '#3b2410', { fontStyle: 'bold' })).setOrigin(0, 0.5);
      const btn = this.add.rectangle(x2 - 50, y, 70, 28, 0x8a5a2b).setStrokeStyle(2, 0x3b2410)
        .setInteractive({ useHandCursor: true });
      const label = this.add.text(x2 - 50, y, 'Acheter', style(13, '#fff4dc', { fontStyle: 'bold' })).setOrigin(0.5);
      btn.on('pointerover', () => btn.setFillStyle(0xa8743c));
      btn.on('pointerout', () => btn.setFillStyle(0x8a5a2b));
      btn.on('pointerdown', () => this.acheter(id));
      this.lignesStock[id] = { qte, btn, label };
    });
  }

  acheter(id) {
    const G = this.G;
    if (G.argent < ITEMS[id].prix) {
      this.cameras.main.shake(120, 0.004);
      return;
    }
    G.argent -= ITEMS[id].prix;
    G.stock[id]++;
    this.majArgent();
  }

  panneauLettres(x1, x2) {
    this.parchemin(x1, x2, 'Lettres reçues');
    const G = this.G;
    const lettres = G.annonces.slice(0, 3).map(a =>
      `✉ ${a.voyageur.nom} — jour ${a.jour}\n   ${commandeEnTexte(a.voyageur)}`);
    if (G.annonces.length > 3) lettres.push(`+ ${G.annonces.length - 3} autres lettres`);
    this.add.text(x1 + 16, 115, lettres.length ? lettres.join('\n') : 'Aucune lettre pour le moment.',
      style(13, '#3b2410', { lineSpacing: 4, wordWrap: { width: x2 - x1 - 30 } }));

    // La prévision pour demain
    this.add.rectangle((x1 + x2) / 2, 395, x2 - x1 - 24, 130, 0xd8c498).setStrokeStyle(2, 0x8a6a3a);
    this.add.text(x1 + 22, 340, 'Demain', style(16, '#3b2410', { fontStyle: 'bold' }));
    this.textePrevision = this.add.text(x1 + 22, 362, '', style(15, '#3b2410', { fontStyle: 'bold', wordWrap: { width: x2 - x1 - 44 } }));
    this.texteFacteurs = this.add.text(x1 + 22, 404, '', style(12, '#5a3a20', { lineSpacing: 2 }));
  }

  majArgent() {
    const G = this.G;
    this.texteArgent.setText(G.argent + ' pièces');
    for (const [id, l] of Object.entries(this.lignesStock)) {
      l.qte.setText('x ' + G.stock[id]);
      const abordable = G.argent >= ITEMS[id].prix;
      l.btn.setAlpha(abordable ? 1 : 0.5);
      l.label.setAlpha(abordable ? 1 : 0.5);
    }
    // La prévision change avec la variété du stock.
    const p = prevision(G);
    const a = attrait(G);
    this.textePrevision.setText(`Entre ${p.min} et ${p.max} clients attendus` +
      (p.annonces ? ` (dont ${p.annonces} annoncé${p.annonces > 1 ? 's' : ''})` : ''));
    const signe = n => (n >= 0 ? '+' : '') + n.toFixed(1);
    this.texteFacteurs.setText(`Réputation ${signe(a.reputation)} · Expérience ${signe(a.experience)}\nStock varié ${signe(a.variete)}`);
  }
}
