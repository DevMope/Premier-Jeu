// La petite cinématique : on voit l'aventure d'un voyageur, épreuve par épreuve,
// et comment chaque objet du colis l'a aidé (ou lui a manqué).
class StoryScene extends Phaser.Scene {
  constructor() { super('Recit'); }

  init(data) {
    this.index = data.index;
  }

  create() {
    this.G = window.GAME;
    this.parti = this.G.partis[this.index];
    const v = this.parti.voyageur;
    // Le sort est tiré une seule fois, puis rejoué tel quel.
    if (!this.parti.resultat) this.parti.resultat = simulerAventure(v, this.parti.colis);
    this.e = v.feminin ? 'e' : '';

    this.cameras.main.fadeIn(500);
    this.fond = this.add.graphics();
    dessinerComte(this.fond, 0, 0, 960, 370, 0);
    this.voile = this.add.rectangle(480, 185, 960, 370, 0x05051a, 0);
    this.decor = this.add.container(0, 0);

    this.perso = this.add.image(-60, 360, 'perso_' + v.race).setOrigin(0.5, 1).setScale(6);

    this.coeurs = [];
    for (let i = 0; i < v.pv; i++) {
      this.coeurs.push(this.add.image(30 + i * 34, 30, 'coeur').setScale(4));
    }
    this.titre = this.add.text(480, 26, '', style(20, '#fff4dc', { fontStyle: 'bold', stroke: '#2a1a10', strokeThickness: 4 })).setOrigin(0.5);

    // Boîte de texte
    this.add.rectangle(480, 455, 940, 150, 0x1e130a, 0.95).setStrokeStyle(2, 0xc9a227);
    this.entete = this.add.text(30, 392, '', style(16, '#f3d98a', { fontStyle: 'bold' }));
    this.texte = this.add.text(30, 418, '', style(18, '#f3e6c8', { wordWrap: { width: 900 }, lineSpacing: 6 }));
    this.indice = this.add.text(940, 518, '▶ clique pour continuer', style(13, '#c9b48a', { fontStyle: 'italic' }))
      .setOrigin(1, 0.5).setVisible(false);
    this.tweens.add({ targets: this.indice, alpha: 0.4, duration: 600, yoyo: true, repeat: -1 });

    this.raconter();
  }

  // --- Outils d'animation (on attend la fin avec `await`) ---

  attendreClic() {
    return new Promise(resoudre => {
      this.time.delayedCall(200, () => {
        this.indice.setVisible(true);
        this.input.once('pointerdown', () => {
          this.indice.setVisible(false);
          resoudre();
        });
      });
    });
  }

  animer(config) {
    return new Promise(resoudre => this.tweens.add({ ...config, onComplete: resoudre }));
  }

  async marcherVers(x) {
    const duree = Math.max(300, Math.abs(x - this.perso.x) * 5);
    this.tweens.add({ targets: this.perso, scaleY: 5.6, duration: 140, yoyo: true, repeat: Math.floor(duree / 280) });
    await this.animer({ targets: this.perso, x, duration: duree, ease: 'Linear' });
    this.perso.setScale(6);
  }

  ecrire(entete, texte) {
    this.entete.setText(entete);
    this.texte.setText(texte);
  }

  // --- Le récit ---

  async raconter() {
    const v = this.parti.voyageur;
    const r = this.parti.resultat;
    const etapes = v.epreuves.length;

    this.titre.setText(r.vivant ? 'Le récit de ' + v.nom : 'Le carnet de ' + v.nom);
    this.ecrire(v.quete, r.vivant
      ? `${v.nom} est revenu${this.e} au comptoir, couvert${this.e} de poussière. Assis${this.e} sur le rebord de la fenêtre, ${v.feminin ? 'elle' : 'il'} te raconte son aventure...`
      : `${v.nom} n'est jamais revenu${this.e}... Un colporteur a retrouvé son carnet de voyage sur la route. Tu l'ouvres en tremblant.`);
    await this.attendreClic();

    for (let i = 0; i < r.etapes.length; i++) {
      const { epreuve, niveau, reussie, pvApres } = r.etapes[i];
      const x = 140 + i * (680 / etapes);

      this.decor.removeAll(true);
      this.ecrire(`Épreuve ${i + 1} / ${etapes}`, '...');
      await this.marcherVers(x);
      this.planterDecor(epreuve.type, x + 130);
      this.ecrire(`Épreuve ${i + 1} / ${etapes}`, epreuve.intro);
      await this.attendreClic();

      if (niveau !== 'rien') await this.montrerObjet(epreuve.besoin);

      let suite;
      if (reussie) {
        suite = niveau === 'complet' ? 'Épreuve surmontée !' : `Je m'en suis sorti${this.e}... de justesse.`;
      } else {
        suite = (niveau === 'complet' ? "Mais la chance n'était pas de mon côté... " : '') + `J'ai été blessé${this.e} !`;
      }
      this.ecrire(`Épreuve ${i + 1} / ${etapes}`, `« ${epreuve[niveau]} »\n${suite}`);
      if (!reussie) await this.blesser(pvApres);
      await this.attendreClic();
    }

    await this.conclure();
  }

  async montrerObjet(id) {
    const icone = this.add.image(this.perso.x, this.perso.y - 110, id).setScale(0).setDepth(5);
    await this.animer({ targets: icone, scale: 5, y: icone.y - 30, duration: 350, ease: 'Back.easeOut' });
    this.tweens.add({ targets: icone, alpha: 0, y: icone.y - 30, duration: 900, delay: 500, onComplete: () => icone.destroy() });
  }

  async blesser(pvRestants) {
    this.cameras.main.shake(250, 0.01);
    this.perso.setTint(0xff4040);
    this.time.delayedCall(300, () => this.perso.clearTint());
    const coeur = this.coeurs[pvRestants];
    if (coeur) {
      coeur.setTexture('coeurVide');
      await this.animer({ targets: coeur, scale: 6, duration: 150, yoyo: true });
    }
  }

  async conclure() {
    const v = this.parti.voyageur;
    const r = this.parti.resultat;
    this.decor.removeAll(true);

    if (r.vivant) {
      if (!r.encaisse) {
        this.G.argent += v.butin;
        r.encaisse = true;
      }
      await this.marcherVers(880);
      this.pleuvoirPieces();
      this.ecrire('Retour au comptoir',
        `« Merci pour ton aide, l'ami. Sans ton colis, je ne serais pas là. Voici ta part du butin ! »\n+ ${v.butin} pièces`);
    } else {
      this.perso.setTint(0x888888);
      await this.animer({ targets: this.perso, angle: -90, alpha: 0.6, duration: 700, ease: 'Bounce.easeOut' });
      this.ecrire('Fin du carnet', r.valeureux
        ? `${v.nom} est mort${this.e} valeureusement au combat. On chantera son nom dans les tavernes.\nTon investissement est perdu.`
        : `${v.nom} est mort${this.e} loin de chez ${v.feminin ? 'elle' : 'lui'}, sans gloire. Il fallait sans doute mieux ${v.feminin ? 'la' : 'le'} préparer...\nTon investissement est perdu.`);
      this.tweens.add({ targets: this.voile, fillAlpha: 0.5, duration: 1500 });
    }

    const dernier = this.index >= this.G.partis.length - 1;
    this.indice.destroy();
    creerBouton(this, 820, 495, 220, dernier ? 'Voir le bilan' : 'Récit suivant', () => {
      this.scene.start(dernier ? 'Bilan' : 'Recit', { index: this.index + 1 });
    });
  }

  pleuvoirPieces() {
    for (let i = 0; i < 18; i++) {
      const p = this.add.ellipse(Phaser.Math.Between(700, 940), -20, 18, 18, 0xe8c040).setStrokeStyle(2, 0x9a7a10);
      this.tweens.add({ targets: p, y: 360, duration: Phaser.Math.Between(600, 1100), delay: i * 60, ease: 'Bounce.easeOut' });
    }
  }

  // Le décor de chaque épreuve, dessiné avec des formes simples.
  planterDecor(type, x) {
    const sol = 360;
    const g = this.add.graphics();
    this.decor.add(g);
    this.tweens.add({ targets: this.voile, fillAlpha: ['nuit', 'grotte', 'feufollet'].includes(type) ? 0.6 : 0, duration: 500 });

    if (type === 'route') {
      g.fillStyle(0x6b4423).fillRect(x, sol - 90, 8, 90);
      g.fillStyle(0x8a5a2b).fillRect(x - 30, sol - 90, 70, 20);
      g.fillStyle(0x6b4423).fillTriangle(x + 40, sol - 90, x + 52, sol - 80, x + 40, sol - 70);
    } else if (type === 'riviere') {
      g.fillStyle(0x2f6a9a).fillRect(x - 70, sol - 26, 160, 36);
      g.fillStyle(0x8fd0f0);
      for (let i = 0; i < 6; i++) g.fillRect(x - 60 + i * 26, sol - 18 + (i % 2) * 8, 14, 3);
      g.fillStyle(0x6b4423).fillRect(x - 74, sol - 40, 8, 30).fillRect(x + 86, sol - 40, 8, 30);
    } else if (type === 'nuit') {
      g.fillStyle(0xf0e8c0).fillCircle(820, 70, 26);
      g.fillStyle(0xffd040);
      [[x, 270], [x + 70, 300], [x + 140, 260]].forEach(([ex, ey]) => {
        g.fillRect(ex, ey, 6, 4).fillRect(ex + 14, ey, 6, 4);
      });
      g.fillStyle(0xf08a24).fillTriangle(x - 70, sol, x - 50, sol - 30, x - 30, sol);
    } else if (type === 'grotte') {
      g.fillStyle(0x4a4a50).fillTriangle(x - 120, sol, x + 60, sol - 250, x + 260, sol);
      g.fillStyle(0x111111).fillEllipse(x + 40, sol - 10, 110, 150);
    } else if (type === 'araignee') {
      g.lineStyle(2, 0xdddddd, 0.6);
      for (let i = 0; i < 6; i++) g.lineBetween(x + 40, 60, x + 40 + Math.cos(i) * 120, 60 + Math.abs(Math.sin(i)) * 140);
      this.decor.add(this.add.image(x + 40, sol - 40, 'araignee').setScale(8));
    } else if (type === 'loup') {
      this.decor.add(this.add.image(x + 30, sol, 'loup').setOrigin(0.5, 1).setScale(8).setFlipX(true));
    } else if (type === 'morsure') {
      g.fillStyle(0x60c040, 0.8);
      for (let i = 0; i < 8; i++) g.fillCircle(this.perso.x + Phaser.Math.Between(-40, 40), sol - Phaser.Math.Between(20, 100), 5);
    } else if (type === 'feufollet') {
      [[x, 250], [x + 50, 210], [x + 100, 260], [x + 150, 230]].forEach(([fx, fy], i) => {
        const lueur = this.add.circle(fx, fy, 10, 0x80ffd0, 0.8);
        this.decor.add(lueur);
        this.tweens.add({ targets: lueur, y: fy - 20, duration: 800 + i * 150, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      });
    } else if (type === 'blessure') {
      g.fillStyle(0xd8344a, 0.8).fillRect(this.perso.x - 8, sol - 70, 16, 4);
    }
    this.decor.list.forEach(o => o.setAlpha(0));
    this.tweens.add({ targets: this.decor.list, alpha: 1, duration: 400 });
  }
}
