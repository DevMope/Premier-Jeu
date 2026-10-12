// La petite cinématique : on voit l'aventure d'un voyageur, épreuve par épreuve,
// et comment chaque objet du colis l'a aidé (ou lui a manqué).
class StoryScene extends Cinematique {
  constructor() { super('Recit'); }

  init(data) {
    this.idParti = data.id;
  }

  create() {
    this.G = window.GAME;
    this.parti = this.G.partis.find(p => p.voyageur.id === this.idParti);
    const v = this.parti.voyageur;
    this.e = v.feminin ? 'e' : '';

    this.cameras.main.fadeIn(500);
    this.fond = this.add.graphics();
    // Le paysage de la zone où il est parti.
    dessinerComte(this.fond, 0, 0, 960, 370, 0, v.zone ? ZONES[v.zone].biome : 'comte');
    this.voile = this.add.rectangle(480, 185, 960, 370, 0x05051a, 0);
    this.decor = this.add.container(0, 0);

    this.perso = this.add.image(-60, 360, 'perso_' + v.race).setOrigin(0.5, 1).setScale(6);

    this.coeurs = [];
    // Ses cœurs, plus ceux gagnés grâce aux soins donnés en plus.
    const pvDepart = (this.parti.resultat && this.parti.resultat.pvDepart) || v.pv;
    for (let i = 0; i < pvDepart; i++) {
      this.coeurs.push(this.add.image(30 + i * 34, 30, 'coeur').setScale(4));
    }
    this.titre = this.add.text(480, 26, '', style(20, '#fff4dc', { fontStyle: 'bold', stroke: '#2a1a10', strokeThickness: 4 })).setOrigin(0.5);

    this.creerBoiteTexte();

    this.raconter();
  }

  async marcherVers(x) {
    const duree = Math.max(300, Math.abs(x - this.perso.x) * 5);
    this.tweens.add({ targets: this.perso, scaleY: 5.6, duration: 140, yoyo: true, repeat: Math.floor(duree / 280) });
    await this.animer({ targets: this.perso, x, duration: duree, ease: 'Linear' });
    this.perso.setScale(6);
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
      this.ecrire(`Épreuve ${i + 1} / ${etapes}`, accord(epreuve.intro, v));
      await this.attendreClic();

      if (niveau !== 'rien') await this.montrerObjet(epreuve.besoin);

      let suite;
      if (reussie) {
        suite = niveau === 'complet' ? 'Épreuve surmontée !' : `Je m'en suis sorti${this.e}... de justesse.`;
      } else {
        suite = (niveau === 'complet' ? "Mais la chance n'était pas de mon côté... " : '') + `J'ai été blessé${this.e} !`;
      }
      this.ecrire(`Épreuve ${i + 1} / ${etapes}`, `« ${accord(epreuve[niveau], v)} »\n${suite}`);
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

    const { gain, message } = terminerAventure(this.G, this.parti);
    const relation = niveauRelation(this.G, v.nom);
    if (r.vivant) {
      await this.marcherVers(880);
      this.pleuvoirPieces();
      const ajuste = gain !== v.butin ? ` (prévu : ${v.butin}, ajusté selon votre relation et tes décorations)` : '';
      this.ecrire('Retour au comptoir',
        `« Merci pour ton aide. Sans ton colis, je ne serais pas là. Voici ta part du butin ! »\n` +
        `+ ${gain} pièces${ajuste} · Relation : ${relation.nom}${message ? '\n' + message : ''}`);
    } else {
      this.perso.setTint(0x888888);
      await this.animer({ targets: this.perso, angle: -90, alpha: 0.6, duration: 700, ease: 'Bounce.easeOut' });
      this.ecrire('Fin du carnet', r.valeureux
        ? `${v.nom} est mort${this.e} valeureusement au combat. On chantera son nom dans les tavernes.\nTon investissement est perdu.`
        : `${v.nom} est mort${this.e} loin de chez ${v.feminin ? 'elle' : 'lui'}, sans gloire. Il fallait sans doute mieux ${v.feminin ? 'la' : 'le'} préparer...\nTon investissement est perdu.`);
      this.tweens.add({ targets: this.voile, fillAlpha: 0.5, duration: 1500 });
      this.indice.destroy();
      return this.proposerDedommagement();
    }

    this.indice.destroy();
    const retour = creerBouton(this, 820, 345, 240, 'Retour au comptoir', () => this.scene.start('Comptoir'));
    retour.fond.setDepth(11);
    retour.label.setDepth(11);
    if (r.vivant) {
      this.proposerSoins();
      this.proposerTrouvailles();
    }
  }

  // L'aventurier te montre ce qu'il a rapporté : à toi de repérer la bonne affaire.
  proposerTrouvailles() {
    const G = this.G;
    const liste = this.parti.trouvailles || [];
    if (!liste.length) return;
    const c = this.add.container(0, 0).setDepth(12);
    const h = 90 + liste.length * 54;
    c.add(this.add.rectangle(290, 70 + h / 2, 540, h, 0xead9b0).setStrokeStyle(3, 0x8a6a3a));
    c.add(this.add.text(40, 84, "« J'ai aussi ramené ça de mon voyage. Ça t'intéresse ? »", style(14, '#3b2410', { fontStyle: 'bold' })));
    const info = this.add.text(40, 70 + h - 24, '', style(12, '#a03030', { fontStyle: 'bold', wordWrap: { width: 500 } }));
    c.add(info);
    liste.forEach((t, i) => {
      const y = 130 + i * 54;
      const tr = t.tresor;
      c.add(this.add.image(60, y, 'tr_' + tr.categorie).setScale(4));
      c.add(this.add.text(90, y - 16, tr.nom, style(15, '#3b2410', { fontStyle: 'bold' })));
      c.add(...pastilleEtat(this, 90, y + 12, tr.etat, 11));
      c.add(this.add.text(170, y + 4, `${CATEGORIES[tr.categorie].nom} · vaut ~${valeurTresor(tr)} p. en l'état`, style(12, '#5a3a20')));
      const b = creerBouton(this, 470, y, 140, '', () => {
        const erreur = acheterTrouvaille(G, t);
        if (erreur) return info.setText(erreur);
        info.setColor('#2f6a2a').setText(`${tr.nom} rejoint ton atelier. Répare-le pour en tirer plus aux enchères !`);
        maj();
      });
      b.fond.setDepth(13);
      b.label.setDepth(13);
      const maj = () => {
        b.setTexte(t.vendu ? 'Acheté' : `Acheter ${t.prix} p.`);
        b.setActif(!t.vendu);
      };
      maj();
    });
  }

  // L'aventurier est mort : sa famille doit être dédommagée. Trois montants au choix.
  proposerDedommagement() {
    const G = this.G;
    const v = this.parti.voyageur;
    const montants = montantsDedommagement(v);
    this.texte.setText(this.texte.text + `\nTu dois verser un dédommagement à sa famille. Plus tu es généreux, plus ta réputation remonte... et plus un proche voudra reprendre le flambeau.`);
    const boutons = Object.entries(DEDOMMAGEMENTS).map(([cle, d], i) => {
      const b = creerBouton(this, 200 + i * 280, 345, 250, `${d.nom} : ${montants[cle]} p.`, () => {
        dedommager(G, this.parti, cle);
        boutons.forEach(x => x.setVisible(false));
        const rep = d.reputation ? ` Réputation +${d.reputation}.` : '';
        this.ecrire('Dédommagement', `Tu as versé ${montants[cle]} pièces à la famille de ${v.nom}.${rep}` +
          (G.argent < 0 ? `\nTu es à découvert (${G.argent} pièces). Attention à la faillite !` : ''));
        const retour = creerBouton(this, 820, 345, 240, 'Retour au comptoir', () => this.scene.start('Comptoir'));
        retour.fond.setDepth(11);
        retour.label.setDepth(11);
      });
      b.fond.setDepth(11);
      b.label.setDepth(11);
      return b;
    });
  }

  // L'aventurier est revenu blessé ? On peut le soigner avec une potion, et il paie.
  proposerSoins() {
    const G = this.G;
    const v = this.parti.voyageur;
    if (!blessuresDe(G, v.nom)) return;
    const bouton = creerBouton(this, 540, 345, 290, '', () => {
      const erreur = soigner(G, v.nom);
      if (erreur) return this.ecrire('Soins', erreur);
      const coeur = this.coeurs.find(c => c.texture.key === 'coeurVide');
      if (coeur) {
        coeur.setTexture('coeur');
        this.tweens.add({ targets: coeur, scale: 6, duration: 150, yoyo: true });
      }
      this.perso.setTint(0x80ff80);
      this.time.delayedCall(300, () => this.perso.clearTint());
      this.ecrire('Soins', `« Ah, ça fait du bien ! Tiens, ${PRIX_SOIN} pièces pour la potion. »` +
        (blessuresDe(G, v.nom) ? `\nEncore ${blessuresDe(G, v.nom)} cœur(s) à soigner.` : '\nComplètement remis sur pied !'));
      maj();
    });
    bouton.fond.setDepth(11);
    bouton.label.setDepth(11);
    const maj = () => {
      const reste = blessuresDe(G, v.nom);
      bouton.setVisible(reste > 0);
      bouton.setTexte(`Soigner un cœur (+${PRIX_SOIN} p.)`);
      bouton.setActif(G.stock.potion > 0);
    };
    maj();
    const n = blessuresDe(G, v.nom);
    this.texte.setText(this.texte.text + `\n${v.feminin ? 'Elle' : 'Il'} a perdu ${n} cœur${n > 1 ? 's' : ''}. ` +
      (G.stock.potion > 0 ? `Une potion par cœur (il te reste ${G.stock.potion} potion${G.stock.potion > 1 ? 's' : ''}).` : "Tu n'as pas de potion pour le soigner."));
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
    this.voile.setFillStyle(0x05051a, this.voile.fillAlpha);
    const g = this.add.graphics();
    this.decor.add(g);
    this.tweens.add({ targets: this.voile, fillAlpha: ['nuit', 'grotte', 'feufollet', 'esprits', 'malediction', 'mortvivant'].includes(type) ? 0.6 : 0, duration: 500 });

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
    } else if (type === 'bandits') {
      [0, 60].forEach(dx => this.decor.add(
        this.add.image(x + dx, sol, 'perso_humain').setOrigin(0.5, 1).setScale(6).setFlipX(true).setTint(0x504048)));
    } else if (type === 'gouffre') {
      g.fillStyle(0x111111).fillRect(x - 60, sol - 26, 140, 40);
      g.fillStyle(0x6b4423).fillRect(x - 64, sol - 34, 6, 10).fillRect(x + 80, sol - 34, 6, 10);
    } else if (type === 'sanglier') {
      this.decor.add(this.add.image(x + 30, sol, 'loup').setOrigin(0.5, 1).setScale(7).setFlipX(true).setTint(0x8a5a3a));
    } else if (type === 'esprits') {
      [[x, 230], [x + 60, 200], [x + 120, 240]].forEach(([fx, fy], i) => {
        const esprit = this.add.ellipse(fx, fy, 26, 34, 0xf0f8ff, 0.6);
        this.decor.add(esprit);
        this.tweens.add({ targets: esprit, y: fy - 25, x: fx + 15, duration: 700 + i * 200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      });
    } else if (type === 'champignons') {
      [[x, sol - 6], [x + 30, sol - 4], [x + 60, sol - 8]].forEach(([cx, cy]) => {
        g.fillStyle(0xf0e8d0).fillRect(cx - 3, cy - 12, 6, 14);
        g.fillStyle(0xc03030).fillEllipse(cx, cy - 14, 26, 14);
        g.fillStyle(0xffffff).fillCircle(cx - 5, cy - 16, 2).fillCircle(cx + 5, cy - 14, 2);
      });
    } else if (type === 'sangsues') {
      g.fillStyle(0x3a4a2a).fillRect(x - 70, sol - 20, 180, 30);
      g.fillStyle(0x1a1a1a);
      for (let i = 0; i < 6; i++) g.fillEllipse(x - 50 + i * 28, sol - 10 + (i % 2) * 6, 16, 6);
    } else if (type === 'soif') {
      g.fillStyle(0xfff4b0, 0.5).fillCircle(820, 70, 60);
      g.fillStyle(0xa8c8e0, 0.6).fillEllipse(x + 80, sol - 20, 120, 16);
    } else if (type === 'tempete') {
      this.tweens.add({ targets: this.voile, fillAlpha: 0.35, duration: 500 });
      this.voile.setFillStyle(0x8a6a3a);
      g.lineStyle(2, 0xe8d0a0, 0.8);
      for (let i = 0; i < 18; i++) g.lineBetween(Phaser.Math.Between(0, 960), Phaser.Math.Between(60, 340), Phaser.Math.Between(0, 960), Phaser.Math.Between(60, 340));
    } else if (type === 'pillards') {
      [0, 60, 120].forEach(dx => this.decor.add(
        this.add.image(x + dx, sol, 'perso_humain').setOrigin(0.5, 1).setScale(6).setFlipX(true).setTint(0x8a6a50)));
    } else if (type === 'froid') {
      g.fillStyle(0xffffff, 0.9);
      for (let i = 0; i < 40; i++) g.fillCircle(Phaser.Math.Between(0, 960), Phaser.Math.Between(40, 350), Phaser.Math.Between(1, 3));
    } else if (type === 'avalanche') {
      g.fillStyle(0xf8fbff).fillTriangle(x - 40, sol, x + 200, sol, x + 200, sol - 180);
      g.fillStyle(0xd0d8e8);
      for (let i = 0; i < 6; i++) g.fillCircle(x + 20 + i * 30, sol - 20 - i * 18, 10);
    } else if (type === 'yeti') {
      this.decor.add(this.add.image(x + 40, sol, 'perso_nain').setOrigin(0.5, 1).setScale(9).setFlipX(true).setTint(0xf0f4ff));
    } else if (type === 'mortvivant') {
      [0, 70].forEach(dx => this.decor.add(
        this.add.image(x + dx, sol, 'perso_humain').setOrigin(0.5, 1).setScale(6).setFlipX(true).setTint(0xb0c8a0)));
    } else if (type === 'malediction') {
      for (let i = 0; i < 5; i++) {
        const rond = this.add.circle(this.perso.x, sol - 50, 20 + i * 18).setStrokeStyle(2, 0xa060e0, 0.8);
        this.decor.add(rond);
        this.tweens.add({ targets: rond, scale: 0.3, alpha: 0, duration: 1200, delay: i * 150, repeat: -1 });
      }
    } else if (type === 'monstre') {
      this.decor.add(this.add.image(x + 60, sol, 'loup').setOrigin(0.5, 1).setScale(16).setFlipX(true).setTint(0xc04030));
      g.fillStyle(0xff9030, 0.7).fillTriangle(x - 40, sol - 70, x + 10, sol - 90, x + 10, sol - 50);
    } else if (type === 'blessure') {
      g.fillStyle(0xd8344a, 0.8).fillRect(this.perso.x - 8, sol - 70, 16, 4);
    }
    this.decor.list.forEach(o => o.setAlpha(0));
    this.tweens.add({ targets: this.decor.list, alpha: 1, duration: 400 });
  }
}
