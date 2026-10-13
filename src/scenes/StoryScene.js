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
    // Le paysage déborde un peu de l'écran : il glisse doucement quand le voyageur avance.
    this.paysage = this.fond.paysage.setScale(this.fond.paysage.scaleX * 1.1, this.fond.paysage.scaleY * 1.1).setPosition(0, -18);
    this.voile = this.add.rectangle(480, 185, 960, 370, 0x05051a, 0);
    this.decor = this.add.container(0, 0);

    this.perso = imageCorps(this, -60, 360, v, 6);
    this.fCorps = echelleCorps(this.perso.texture.key);

    this.coeurs = [];
    // Ses cœurs, plus ceux gagnés grâce aux soins donnés en plus.
    const pvDepart = (this.parti.resultat && this.parti.resultat.pvDepart) || v.pv;
    for (let i = 0; i < pvDepart; i++) {
      this.coeurs.push(this.add.image(30 + i * 34, 30, 'hd_coeur').setScale(2));
    }
    this.titre = this.add.text(480, 26, '', style(20, '#fff4dc', { fontStyle: 'bold', stroke: '#2a1a10', strokeThickness: 4 })).setOrigin(0.5);

    this.creerBoiteTexte();

    this.raconter();
  }

  async marcherVers(x) {
    const duree = Math.max(300, Math.abs(x - this.perso.x) * 5);
    pasDeMarche(this, this.perso, duree);
    const y = this.perso.y;
    this.tweens.add({ targets: this.perso, y: y - 2, duration: 125, yoyo: true, repeat: Math.floor(duree / 250) });
    this.tweens.add({ targets: this.paysage, x: -Phaser.Math.Clamp(x, 0, 960) / 960 * 96, duration: duree, ease: 'Sine.easeInOut' });
    await this.animer({ targets: this.perso, x, duration: duree, ease: 'Linear' });
    this.perso.setScale(6 * this.fCorps).setY(y);
  }

  // --- Le récit ---

  async raconter() {
    const v = this.parti.voyageur;
    const r = this.parti.resultat;
    const etapes = v.epreuves.length;

    this.titre.setText(r.vivant ? 'Le récit de ' + v.nom : 'Le carnet de ' + v.nom).setColor(couleurNom(this.G, v.nom, true));
    this.ecrire(v.quete, r.vivant
      ? `${v.nom} est revenu${this.e} au comptoir, couvert${this.e} de poussière. Assis${this.e} sur le rebord de la fenêtre, ${v.feminin ? 'elle' : 'il'} te raconte son aventure...`
      : `${v.nom} n'est jamais revenu${this.e}... La Faucheuse a laissé son carnet de voyage sur ton comptoir. Tu l'ouvres en tremblant.`);
    await this.attendreClic();

    for (let i = 0; i < r.etapes.length; i++) {
      const { epreuve, niveau, reussie, pvApres, piege, pvAvant, sauvee, repli } = r.etapes[i];
      const x = 140 + i * (680 / etapes);

      if (this.meteo) { this.meteo.remove(); this.meteo = null; }
      this.decor.removeAll(true);
      this.ecrire(`Épreuve ${i + 1} / ${etapes}`, '...');
      await this.marcherVers(x);
      this.planterDecor(epreuve.type, x + 130);
      this.ecrire(`Épreuve ${i + 1} / ${etapes}`, accord(epreuve.intro, v));
      await this.attendreClic();

      if (niveau !== 'rien') { await this.montrerObjet(epreuve.besoin); await this.utiliserObjet(epreuve.besoin); }

      // Un objet piégé : il lâche au pire moment, et c'est fini.
      if (piege) {
        this.ecrire(`Épreuve ${i + 1} / ${etapes}`, `« ${accord(PIEGES[piege].mort, v)} »`);
        this.cameras.main.flash(400, 90, 0, 30);
        await this.issue(false);
        for (let pv = (pvAvant || 1) - 1; pv >= 0; pv--) await this.blesser(pv);
        await this.attendreClic();
        continue;
      }

      // Sa bonne étoile : il rebrousse chemin au lieu de mourir.
      if (repli) {
        await this.trefle();
        this.ecrire(`Épreuve ${i + 1} / ${etapes}`, `« ${accord(epreuve[niveau], v)} »\n` +
          `J'ai senti que la prochaine fois serait la dernière. Ma bonne étoile m'a soufflé de rebrousser chemin... J'ai abandonné la mission.`);
        await this.attendreClic();
        break;
      }

      let suite;
      if (reussie && sauvee) {
        await this.trefle();
        suite = `C'était perdu... et puis un coup de chance incroyable ! Ma bonne étoile m'a sauvé${this.e}.`;
      } else if (reussie) {
        suite = niveau === 'complet' ? 'Épreuve surmontée !' : `Je m'en suis sorti${this.e}... de justesse.`;
      } else {
        suite = (niveau === 'complet' ? "Mais la chance n'était pas de mon côté... " : '') + `J'ai été blessé${this.e} !`;
      }
      await this.issue(reussie);
      this.ecrire(`Épreuve ${i + 1} / ${etapes}`, `« ${accord(epreuve[niveau], v)} »\n${suite}`);
      if (!reussie) await this.blesser(pvApres);
      else await this.victoire(niveau === 'complet');
      await this.attendreClic();
    }

    await this.conclure();
  }

  // Le trèfle de la chance qui brille au-dessus de lui.
  async trefle() {
    const t = this.add.image(this.perso.x, this.perso.y - 120, 'hd_trefleChance').setScale(0).setDepth(5);
    await this.animer({ targets: t, scale: 3.5, angle: 360, duration: 500, ease: 'Back.easeOut' });
    this.tweens.add({ targets: t, alpha: 0, y: t.y - 40, duration: 900, delay: 400, onComplete: () => t.destroy() });
  }

  async montrerObjet(id) {
    creerObjetsHD(this);
    const cle = iconeObjet(this, id);
    const icone = this.add.image(this.perso.x, this.perso.y - 110, cle).setScale(0).setDepth(5);
    await this.animer({ targets: icone, scale: cle.startsWith('hd_') ? 3 : 5, y: icone.y - 30, duration: 350, ease: 'Back.easeOut' });
    this.tweens.add({ targets: icone, alpha: 0, y: icone.y - 30, duration: 900, delay: 500, onComplete: () => icone.destroy() });
  }

  // Une épreuve surmontée : un bond de joie (et quelques étincelles si c'était bien préparé).
  async victoire(eclatante) {
    const y = this.perso.y;
    if (eclatante) {
      creerObjetsHD(this);
      for (let k = 0; k < 7; k++) {
        const e = this.add.image(this.perso.x, y - 60, 'eclat').setScale(2).setDepth(6);
        const a = (k / 7) * Math.PI * 2;
        this.tweens.add({ targets: e, x: e.x + Math.cos(a) * 60, y: e.y + Math.sin(a) * 40, alpha: 0, angle: 90, duration: 600, onComplete: () => e.destroy() });
      }
    }
    await this.animer({ targets: this.perso, y: y - 26, duration: 180, ease: 'Quad.easeOut', yoyo: true });
    this.perso.setY(y);
  }

  async blesser(pvRestants) {
    this.cameras.main.shake(250, 0.01);
    this.cameras.main.flash(180, 160, 20, 20);
    // Il recule sous le choc
    const x = this.perso.x;
    this.tweens.add({ targets: this.perso, x: x - 14, duration: 90, yoyo: true, ease: 'Quad.easeOut' });
    this.perso.setTint(0xff4040);
    this.time.delayedCall(300, () => this.perso.clearTint());
    const coeur = this.coeurs[pvRestants];
    if (coeur) {
      coeur.setTexture('hd_coeurVide');
      await this.animer({ targets: coeur, scale: 3, duration: 150, yoyo: true });
    }
  }

  async conclure() {
    const v = this.parti.voyageur;
    const r = this.parti.resultat;
    if (this.meteo) { this.meteo.remove(); this.meteo = null; }
    this.decor.removeAll(true);

    const { gain, message } = terminerAventure(this.G, this.parti);
    const relation = niveauRelation(this.G, v.nom);
    if (r.vivant && r.echec) {
      // Mission ratée : vivant, mais les mains vides.
      await this.marcherVers(880);
      this.ecrire('Mission ratée', [`« Je suis désolé${this.e}... Je reviens les mains vides. » · Relation : ${relation.nom}`,
        ...(this.parti.malus || []).map(m => '• ' + m)].join('\n'));
      this.texte.setFontSize(13).setLineSpacing(1);
    } else if (r.vivant) {
      await this.marcherVers(880);
      this.pleuvoirPieces();
      const ajuste = gain !== v.butin ? ` (prévu : ${v.butin}, ajusté selon votre relation et tes décorations)` : '';
      this.ecrire('Retour au comptoir',
        `« Merci pour ton aide. Sans ton baluchon, je ne serais pas là. Voici ta part du butin ! »\n` +
        `+ ${gain} pièces${ajuste} · Relation : ${relation.nom}${message ? '\n' + message : ''}`);
    } else {
      this.perso.setTint(0x888888);
      await this.animer({ targets: this.perso, angle: -90, alpha: 0.6, duration: 700, ease: 'Bounce.easeOut' });
      this.ecrire('Fin du carnet', r.valeureux
        ? `${v.nom} est mort${this.e} valeureusement au combat. On chantera son nom dans les tavernes.\nTon investissement est perdu.`
        : `${v.nom} est mort${this.e} loin de chez ${v.feminin ? 'elle' : 'lui'}, sans gloire. Il fallait sans doute mieux ${v.feminin ? 'la' : 'le'} préparer...\nTon investissement est perdu.`);
      if (this.parti.demasque) {
        const id = Object.keys(this.parti.pieges).find(k => this.parti.pieges[k] > 0);
        this.texte.setText(this.texte.text + `\nOn a retrouvé ${PIEGES[id] ? leNom(id, PIEGES[id].nom.toLowerCase()) : 'ton piège'} près du corps. Au village, on t'accuse.`);
      }
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
    c.add(this.add.image(290, 70 + h / 2, panneauHD(this, 540, h)).setScale(2));
    c.add(this.add.text(40, 84, "« J'ai aussi ramené ça de mon voyage. Ça t'intéresse ? »", style(14, '#3b2410', { fontStyle: 'bold' })));
    const info = this.add.text(40, 70 + h - 24, '', style(12, '#a03030', { fontStyle: 'bold', wordWrap: { width: 500 } }));
    c.add(info);
    liste.forEach((t, i) => {
      const y = 130 + i * 54;
      const tr = t.tresor;
      c.add(this.add.image(60, y, iconeObjet(this, 'tr_' + tr.categorie)).setScale(2.4));
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
        const verse = dedommager(G, this.parti, cle);
        boutons.forEach(x => x.setVisible(false));
        const rep = d.reputation ? ` Réputation +${d.reputation}.` : '';
        this.ecrire('Dédommagement', `Tu as versé ${verse} pièces à la famille de ${v.nom}.${rep}` +
          (G.argent < 0 ? `\nTu es à découvert (${G.argent} pièces). Faillite à ${SEUIL_FAILLITE} !` : ''));
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
      const coeur = this.coeurs.find(c => c.texture.key === 'hd_coeurVide');
      if (coeur) {
        coeur.setTexture('hd_coeur');
        this.tweens.add({ targets: coeur, scale: 3, duration: 150, yoyo: true });
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
  // --- Le décor de chaque épreuve : créatures et obstacles en HD, météo, lumière ---

  planterDecor(type, x) {
    creerRecitHD(this);
    creerInterieurHD(this);
    creerObjetsHD(this);
    const sol = 360;
    if (this.meteo) { this.meteo.remove(); this.meteo = null; }
    this.menace = { sorte: 'ambiance', sprites: [] };
    const sombre = ['nuit', 'grotte', 'feufollet', 'esprits', 'malediction', 'mortvivant'].includes(type);
    this.voile.setFillStyle(type === 'tempete' ? 0x8a6a3a : 0x05051a, this.voile.fillAlpha);
    this.tweens.add({ targets: this.voile, fillAlpha: sombre ? 0.55 : type === 'tempete' ? 0.3 : 0, duration: 600 });
    const ajouter = o => { this.decor.add(o); return o; };
    // Une créature qui arrive de la droite, en se dandinant, jusqu'à sa place
    const bete = (cle, bx, echelle, { flottante = false, depuisHaut = false } = {}) => {
      const b = ajouter(this.add.image(depuisHaut ? bx : 1040, depuisHaut ? -80 : sol, cle).setOrigin(0.5, 1).setScale(echelle).setDepth(2));
      if (depuisHaut) {
        const fil = ajouter(this.add.rectangle(bx, 0, 1, 10, 0xdddddd, 0.7).setOrigin(0.5, 0));
        this.tweens.add({ targets: b, y: sol - 40, duration: 1200, ease: 'Bounce.easeOut', onUpdate: () => fil.setSize(1, Math.max(0, b.y - b.displayHeight * 0.6)) });
      } else {
        this.tweens.add({ targets: b, x: bx, duration: 1100, ease: 'Sine.easeOut' });
        this.tweens.add({ targets: b, y: sol - (flottante ? 70 : 3), duration: flottante ? 900 : 140, yoyo: true, repeat: flottante ? -1 : 6, ease: 'Sine.easeInOut' });
      }
      if (flottante) b.setAlpha(0.8).setBlendMode(Phaser.BlendModes.SCREEN);
      b.base = { x: bx, y: depuisHaut ? sol - 40 : sol };
      this.menace.sorte = 'bete';
      this.menace.sprites.push(b);
      return b;
    };
    const humain = (bx, teinte) => {
      const h = ajouter(imageCorps(this, 1040, sol, { nom: 'Brigand ' + bx, race: 'humain', niveau: 'aguerri' }, 6).setFlipX(true).setTint(teinte).setDepth(2));
      this.tweens.add({ targets: h, x: bx, duration: 1100, ease: 'Sine.easeOut' });
      pasDeMarche(this, h, 1100);
      h.base = { x: bx, y: sol };
      this.menace.sorte = 'bete';
      this.menace.sprites.push(h);
    };
    // Des particules qui tombent ou volent (neige, sable, lucioles)
    const particules = (cle, teinte, { vx = 0, vy = 1, n = 2, echelle = 1.5, alpha = 0.8, add = false } = {}) => {
      this.meteo = this.time.addEvent({ delay: 90, loop: true, callback: () => {
        for (let k = 0; k < n; k++) {
          const px = Phaser.Math.Between(-100, 1000), py = vy > 0 ? Phaser.Math.Between(-20, 40) : Phaser.Math.Between(60, 360);
          const p = this.add.image(px, py, cle).setScale(echelle * (0.6 + Math.random() * 0.8)).setTint(teinte).setAlpha(alpha).setDepth(7);
          if (add) p.setBlendMode(Phaser.BlendModes.ADD);
          this.decor.add(p);
          this.tweens.add({ targets: p, x: px + vx * 400, y: py + vy * 380, alpha: 0, duration: 2200 + Math.random() * 1200, onComplete: () => p.destroy() });
        }
      } });
    };
    creerHalo(this);

    switch (type) {
      case 'loup': bete('loupHD', x + 140, 3.2); break;
      case 'sanglier': bete('sanglierHD', x + 140, 3.2); break;
      case 'araignee': {
        for (let i = 0; i < 6; i++) ajouter(this.add.rectangle(x + 150, 0, 1, 260, 0xe8e8e8, 0.35).setOrigin(0.5, 0).setAngle(-50 + i * 20));
        bete('araigneeHD', x + 150, 3, { depuisHaut: true });
        break;
      }
      case 'yeti': bete('yetiHD', x + 160, 3.4); particules('lueurHD', 0xffffff, { vx: -0.3, vy: 1, n: 3, echelle: 1.2 }); break;
      case 'monstre': bete('trollHD', x + 170, 3.4); break;
      case 'esprits': [0, 60, 120].forEach(dx => bete('espritHD', x + 110 + dx, 2.4, { flottante: true })); break;
      case 'mortvivant': [0, 70].forEach(dx => bete('squeletteHD', x + 130 + dx, 2.8)); break;
      case 'bandits': [0, 60].forEach(dx => humain(x + 120 + dx, 0x6a5a66)); break;
      case 'pillards': [0, 60, 120].forEach(dx => humain(x + 110 + dx, 0x8a6a50)); break;
      case 'feufollet':
        for (let i = 0; i < 6; i++) {
          const l = ajouter(this.add.image(x + 60 + i * 35, 220 + (i % 3) * 30, 'lueurHD').setScale(3).setBlendMode(Phaser.BlendModes.ADD));
          const halo = ajouter(this.add.image(l.x, l.y, 'halo').setScale(0.6).setTint(0x60ffc0).setAlpha(0.4).setBlendMode(Phaser.BlendModes.ADD));
          this.tweens.add({ targets: [l, halo], y: l.y - 30, x: l.x + Phaser.Math.Between(-30, 30), duration: 900 + i * 170, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        }
        break;
      case 'grotte': {
        ajouter(this.add.image(x + 150, sol + 4, 'grotteHD').setOrigin(0.5, 1).setScale(2.4).setDepth(1));
        break;
      }
      case 'gouffre': ajouter(this.add.image(x + 100, sol + 12, 'gouffreHD').setOrigin(0.5, 1).setScale(2.2).setDepth(1)); this.menace.sorte = 'gouffre'; this.menace.x = x + 100; break;
      case 'riviere': {
        const eau = ajouter(this.add.tileSprite(x + 110, sol - 2, 220, 50, riviereHD(this)).setOrigin(0.5, 0.5).setTileScale(2).setDepth(1));
        this.tweens.add({ targets: eau, tilePositionX: -240, duration: 6000, repeat: -1 });
        this.menace.sorte = 'gouffre'; this.menace.x = x + 110; this.menace.eau = true;
        break;
      }
      case 'sangsues': {
        ajouter(this.add.ellipse(x + 110, sol, 260, 34, 0x2a3a22, 0.9).setDepth(1));
        for (let i = 0; i < 6; i++) {
          const s = ajouter(this.add.ellipse(x + 20 + i * 36, sol - 4, 16, 6, 0x111111).setDepth(1.1));
          this.tweens.add({ targets: s, scaleX: 0.6, duration: 400 + i * 70, yoyo: true, repeat: -1 });
        }
        break;
      }
      case 'champignons': ajouter(this.add.image(x + 90, sol + 2, 'champignonsHD').setOrigin(0.5, 1).setScale(3).setDepth(1)); particules('lueurHD', 0xd0ff60, { vx: 0.1, vy: -0.4, n: 1, echelle: 0.9, alpha: 0.6 }); break;
      case 'avalanche':
        for (let i = 0; i < 4; i++) {
          const r = ajouter(this.add.image(1000 + i * 60, sol - 200 - i * 40, 'rocherHD').setOrigin(0.5, 1).setScale(2 + i * 0.4).setDepth(2));
          this.tweens.add({ targets: r, x: x + 140 + i * 50, y: sol, angle: -540, duration: 1300 + i * 200, ease: 'Bounce.easeOut' });
        }
        particules('lueurHD', 0xffffff, { vx: -0.4, vy: 1, n: 3, echelle: 1.2 });
        break;
      case 'froid': particules('lueurHD', 0xffffff, { vx: -0.5, vy: 1, n: 4, echelle: 1.3 }); break;
      case 'tempete': particules('lueurHD', 0xe8c890, { vx: -2.4, vy: 0.15, n: 6, echelle: 1, alpha: 0.7 }); break;
      case 'soif': {
        const soleil = ajouter(this.add.image(820, 70, 'halo').setScale(2.4).setTint(0xfff0a0).setAlpha(0.6).setBlendMode(Phaser.BlendModes.ADD));
        this.tweens.add({ targets: soleil, scale: 2.8, duration: 900, yoyo: true, repeat: -1 });
        particules('lueurHD', 0xfff0c0, { vx: 0, vy: -0.4, n: 1, echelle: 1.6, alpha: 0.25 });
        break;
      }
      case 'nuit': {
        ajouter(this.add.circle(820, 70, 24, 0xf3ecc8).setDepth(0.5));
        const feu = ajouter(this.add.image(x - 40, sol + 2, 'feuCampHD').setOrigin(0.5, 1).setScale(2.5).setDepth(2));
        const flamme = ajouter(this.add.sprite(feu.x, sol - 14, 'flammeBougie0').setOrigin(0.5, 1).setScale(5).setDepth(2.1).play('flammeBougie'));
        const lueur = ajouter(this.add.image(feu.x, sol - 30, 'halo').setScale(3).setTint(0xffa040).setAlpha(0.45).setBlendMode(Phaser.BlendModes.ADD).setDepth(8));
        this.tweens.add({ targets: lueur, alpha: 0.3, scale: 2.7, duration: 300, yoyo: true, repeat: -1 });
        // Des yeux jaunes qui brillent dans le noir...
        for (const [ex, ey] of [[x + 150, 290], [x + 230, 300], [x + 300, 280]]) {
          const yeux = ajouter(this.add.text(ex, ey, '• •', style(14, '#ffd040', { fontStyle: 'bold', brut: true })).setOrigin(0.5).setDepth(8).setAlpha(0));
          this.tweens.add({ targets: yeux, alpha: 1, duration: 300, delay: Phaser.Math.Between(300, 1500), yoyo: true, hold: 1200, repeat: -1, repeatDelay: 800 });
        }
        particules('lueurHD', 0xffa040, { vx: 0.1, vy: -0.6, n: 1, echelle: 0.7, add: true });
        void flamme;
        break;
      }
      case 'malediction':
        for (let i = 0; i < 5; i++) {
          const rond = ajouter(this.add.circle(this.perso.x, sol - 60, 20 + i * 18).setStrokeStyle(3, 0xa060e0, 0.8).setDepth(6));
          this.tweens.add({ targets: rond, scale: 0.3, alpha: 0, duration: 1200, delay: i * 150, repeat: -1 });
        }
        particules('lueurHD', 0xb070ff, { vx: 0, vy: -0.5, n: 2, echelle: 1, add: true });
        break;
      case 'morsure': {
        const serpent = ajouter(this.add.text(this.perso.x + 40, sol - 6, '〰', style(30, '#4a8a2a', { fontStyle: 'bold', brut: true })).setOrigin(0.5, 1).setDepth(3));
        this.tweens.add({ targets: serpent, x: serpent.x + 16, duration: 300, yoyo: true, repeat: -1 });
        particules('lueurHD', 0x60c040, { vx: 0, vy: -0.4, n: 1, echelle: 1, alpha: 0.6 });
        break;
      }
      case 'blessure':
        ajouter(this.add.image(x + 80, sol + 4, 'rocherHD').setOrigin(0.5, 1).setScale(1.6).setDepth(1));
        break;
      default: { // la route : un panneau, des cailloux, des fleurs
        const g = ajouter(this.add.graphics().setDepth(1));
        g.fillStyle(0x6b4423).fillRect(x + 120, sol - 90, 8, 90);
        g.fillStyle(0x8a5a2b).fillRect(x + 90, sol - 90, 70, 20);
        g.fillStyle(0x6b4423).fillTriangle(x + 160, sol - 90, x + 172, sol - 80, x + 160, sol - 70);
        ajouter(this.add.image(x + 60, sol + 2, 'rocherHD').setOrigin(0.5, 1).setScale(1).setDepth(1));
      }
    }
  }

  // L'objet du colis entre en action, selon ce que c'est.
  async utiliserObjet(id) {
    const p = this.perso, sol = 360;
    const cible = this.menace.sprites[0];
    const cx = cible ? cible.x - 20 : p.x + 120, cy = sol - 70;
    const icone = cle => this.add.image(p.x + 30, sol - 80, iconeObjet(this, cle)).setScale(3).setDepth(6);
    const etincelles = (x, y, teinte, n = 10) => {
      for (let k = 0; k < n; k++) {
        const e = this.add.image(x, y, 'eclat').setScale(2).setTint(teinte).setDepth(7);
        const a = Math.random() * Math.PI * 2;
        this.tweens.add({ targets: e, x: x + Math.cos(a) * 70, y: y + Math.sin(a) * 50, alpha: 0, angle: 180, duration: 600, onComplete: () => e.destroy() });
      }
    };
    switch (id) {
      case 'epee': case 'bouclier': {
        const o = icone(id);
        await this.animer({ targets: p, x: p.x + 40, duration: 160, ease: 'Quad.easeOut' });
        o.setPosition(p.x + 40, sol - 70);
        if (id === 'epee') {
          const arc = this.add.graphics().setDepth(7);
          arc.lineStyle(6, 0xffffff, 0.9).beginPath().arc(p.x + 50, sol - 70, 60, -1.2, 0.9).strokePath();
          this.tweens.add({ targets: arc, alpha: 0, duration: 300, onComplete: () => arc.destroy() });
          this.tweens.add({ targets: o, angle: 200, duration: 220 });
          this.onomatopee(cx, cy - 40, 'TCHAK !', '#fff4dc');
        } else {
          this.onomatopee(p.x + 60, cy - 50, 'BLONG !', '#d8e4f0');
          this.tweens.add({ targets: o, scale: 4, duration: 120, yoyo: true });
        }
        this.cameras.main.shake(150, 0.006);
        etincelles(cx, cy, 0xfff0a0);
        await this.attendre(350);
        this.tweens.add({ targets: o, alpha: 0, duration: 300, onComplete: () => o.destroy() });
        await this.animer({ targets: p, x: p.x - 40, duration: 220 });
        break;
      }
      case 'fleches': {
        for (let k = 0; k < 3; k++) {
          const f = this.add.image(p.x + 20, sol - 80, iconeObjet(this, 'fleches')).setScale(2.5).setAngle(45).setDepth(6);
          this.tweens.add({ targets: f, x: cx, y: cy + Phaser.Math.Between(-20, 20), duration: 260, delay: k * 140, onComplete: () => { etincelles(f.x, f.y, 0xfff0a0, 4); f.destroy(); } });
        }
        this.onomatopee(p.x + 40, cy - 60, 'FIOUU !');
        await this.attendre(700);
        break;
      }
      case 'torche': {
        const o = icone('torche').setPosition(p.x + 26, sol - 90);
        const lumiere = this.add.image(p.x + 20, sol - 90, 'halo').setScale(0.5).setTint(0xffc060).setAlpha(0.7).setBlendMode(Phaser.BlendModes.ADD).setDepth(8);
        this.decor.add([o, lumiere]);
        this.tweens.add({ targets: lumiere, scale: 4.5, duration: 600, ease: 'Sine.easeOut' });
        this.tweens.add({ targets: this.voile, fillAlpha: Math.min(this.voile.fillAlpha, 0.35), duration: 600 });
        this.tweens.add({ targets: lumiere, alpha: 0.5, duration: 200, yoyo: true, repeat: -1, delay: 600 });
        await this.attendre(700);
        break;
      }
      case 'corde': {
        const x2 = (this.menace.x || p.x + 100) + 120;
        const corde = this.add.graphics().setDepth(5);
        this.decor.add(corde);
        let u = 0;
        this.tweens.addCounter({ from: 0, to: 1, duration: 500, onUpdate: tw => {
          u = tw.getValue();
          corde.clear().lineStyle(3, 0xc8a060).beginPath().moveTo(p.x + 10, sol - 60);
          for (let k = 1; k <= 10; k++) { const t = k / 10 * u; corde.lineTo(p.x + 10 + (x2 - p.x - 10) * t, sol - 60 + Math.sin(t * Math.PI) * 26); }
          corde.strokePath();
        } });
        this.onomatopee(p.x + 60, cy - 60, 'HOP !');
        await this.attendre(600);
        break;
      }
      case 'potion': case 'antidote': case 'bandage': {
        const o = icone(id).setPosition(p.x, sol - 130);
        await this.animer({ targets: o, y: sol - 100, scale: 2, alpha: 0, duration: 500 });
        o.destroy();
        const teinte = id === 'antidote' ? 0x70ff90 : id === 'potion' ? 0xff7090 : 0xffffff;
        for (let k = 0; k < 12; k++) {
          const e = this.add.image(p.x + Phaser.Math.Between(-30, 30), sol - Phaser.Math.Between(10, 60), 'lueurHD').setScale(1.5).setTint(teinte).setBlendMode(Phaser.BlendModes.ADD).setDepth(7);
          this.tweens.add({ targets: e, y: e.y - 80, alpha: 0, duration: 900, delay: k * 50, onComplete: () => e.destroy() });
        }
        this.perso.setTint(teinte); this.time.delayedCall(400, () => this.perso.clearTint());
        await this.attendre(500);
        break;
      }
      case 'ration': case 'gourde': {
        const o = icone(id).setPosition(p.x + 10, sol - 110);
        this.onomatopee(p.x, sol - 160, id === 'ration' ? 'Miam !' : 'Glou glou !', '#f3d98a');
        await this.animer({ targets: o, scale: 1.5, alpha: 0, y: o.y + 10, duration: 600 });
        o.destroy();
        for (let k = 0; k < 8; k++) {
          const m = this.add.rectangle(p.x + 10, sol - 100, 3, 3, id === 'ration' ? 0xc89a50 : 0x8ac8f0).setDepth(7);
          this.tweens.add({ targets: m, x: m.x + Phaser.Math.Between(-30, 30), y: sol, alpha: 0, duration: 500, delay: k * 40, onComplete: () => m.destroy() });
        }
        await this.attendre(200);
        break;
      }
      case 'cape': {
        const o = icone('cape').setPosition(p.x, sol - 80).setScale(5).setAlpha(0);
        await this.animer({ targets: o, alpha: 0.85, duration: 300 });
        this.tweens.add({ targets: o, alpha: 0, delay: 600, duration: 400, onComplete: () => o.destroy() });
        await this.attendre(500);
        break;
      }
      case 'amulette': {
        for (let i = 0; i < 4; i++) {
          const r = this.add.circle(p.x, sol - 70, 20).setStrokeStyle(4, 0xc080ff, 0.9).setDepth(7);
          this.tweens.add({ targets: r, scale: 8, alpha: 0, duration: 900, delay: i * 150, onComplete: () => r.destroy() });
        }
        this.cameras.main.flash(250, 160, 100, 220);
        await this.attendre(700);
        break;
      }
      default: await this.attendre(300);
    }
  }

  // L'issue de l'épreuve, en image : la bête fuit, ou elle frappe ; l'obstacle est franchi, ou pas.
  async issue(reussie) {
    const p = this.perso, sol = 360;
    const betes = this.menace.sprites;
    if (this.menace.sorte === 'bete' && betes.length) {
      if (reussie) {
        // Touchées ! Elles reculent, se retournent, et détalent.
        betes.forEach(b => b.setTint(0xffffff));
        for (const b of betes) {
          this.tweens.killTweensOf(b);
          this.tweens.add({ targets: b, x: b.x + 30, duration: 120, yoyo: true, onComplete: () => {
            b.setFlipX(!b.flipX);
            this.tweens.add({ targets: b, x: 1100, duration: 700, ease: 'Quad.easeIn' });
            this.tweens.add({ targets: b, y: b.y - 8, duration: 110, yoyo: true, repeat: 3 });
          } });
        }
        this.onomatopee(betes[0].x, sol - 150, 'OUSTE !', '#b8f0a0');
        await this.attendre(500);
      } else {
        // Elle bondit sur lui.
        const b = betes[0];
        this.tweens.killTweensOf(b);
        await this.animer({ targets: b, x: p.x + 50, y: b.y - 30, duration: 220, ease: 'Quad.easeIn' });
        this.onomatopee(p.x + 20, sol - 150, Phaser.Utils.Array.GetRandom(['AÏE !', 'OUILLE !', 'CRAC !']), '#ff8080');
        this.tweens.add({ targets: b, x: b.base.x, y: b.base.y, duration: 400, ease: 'Quad.easeOut' });
        this.tweens.add({ targets: p, angle: -14, duration: 100, yoyo: true });
      }
    } else if (this.menace.sorte === 'gouffre') {
      const x0 = p.x, y0 = p.y, x1 = (this.menace.x || x0) + 130;
      if (reussie) {
        // Un grand saut par-dessus
        this.tweens.add({ targets: this.paysage, x: this.paysage.x - 20, duration: 600 });
        await Promise.all([
          this.animer({ targets: p, x: x1, duration: 600, ease: 'Linear' }),
          this.animer({ targets: p, y: y0 - 70, duration: 300, yoyo: true, ease: 'Quad.easeOut' }),
        ]);
        p.setY(y0);
        this.onomatopee(x1, sol - 150, 'HOP !', '#b8f0a0');
      } else {
        await this.animer({ targets: p, x: x0 + 40, y: y0 + 12, angle: 20, duration: 300, ease: 'Quad.easeIn' });
        this.onomatopee(p.x, sol - 140, this.menace.eau ? 'PLOUF !' : 'AÏE !', this.menace.eau ? '#a8d0ff' : '#ff8080');
        await this.animer({ targets: p, x: x0, y: y0, angle: 0, duration: 400 });
      }
    } else if (!reussie) {
      // Il trébuche, frissonne ou suffoque
      await this.animer({ targets: p, angle: 12, duration: 140, yoyo: true, repeat: 1 });
    }
  }
}
