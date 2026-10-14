// La Banque Centrale Goyenne : des banquiers nains te regardent de haut,
// perchés derrière leur immense bureau, en se demandant si tu mérites un prêt.
// La scène s'ouvre par-dessus le soir, qui reste en pause.
class BanqueScene extends Phaser.Scene {
  constructor() { super('Banque'); }

  create() {
    this.time.delayedCall(500, () => conseilGarrick(this, 'banque', true));
    const G = this.G = window.GAME;
    this.cameras.main.setBackgroundColor('#2a2a30');

    // Murs de pierre
    creerInterieurHD(this);
    creerBanqueHD(this);
    this.add.image(0, 0, 'murBanque').setOrigin(0).setScale(2).setTint(0xb8b0c0);
    vignette(this, 0.8, 0);
    // Bannières de velours, et deux chandeliers dorés
    for (const x of [90, 870]) this.add.image(x, 20, 'banniereHD').setOrigin(0.5, 0).setScale(2);
    for (const x of [230, 730]) poserLuminaire(this, x, -30, 3, 0);

    // Les banquiers nains, perchés très haut
    this.banquiers = [[330, 238, 7], [480, 226, 8], [630, 238, 7]].map(([x, y, e], i) => {
      const b = imageCorps(this, x, y, 'nainBanquier', e);
      b.place = { x, y, echelle: b.scaleX };
      return b;
    });
    this.toiser();
    // L'immense bureau, devant eux : on ne voit que leurs têtes qui dépassent
    this.bureau = this.add.image(480, 180, 'bureauBanque').setOrigin(0.5, 0).setScale(2);
    this.add.text(480, 242, 'BANQUE CENTRALE GOYENNE', style(17, '#3a2408', { fontStyle: 'bold' })).setOrigin(0.5);

    // Toi, tout petit, tout en bas
    this.add.image(70, 535, textureJoueur(this, G, 'troisQuarts')).setOrigin(0.5, 1).setScale(echelleJoueur(5));   // (tourné vers les banquiers)

    // Ce que dit Thorgrim Coffrefort
    this.add.rectangle(480, 330, 760, 50, 0x1e130a, 0.92).setStrokeStyle(2, 0xc9a227).setY(334);
    this.texteNain = this.add.text(110, 314, '', style(14, '#f3e6c8', { wordWrap: { width: 740 } }));
    this.parler(this.accueil());

    this.creerPrets();
    creerBouton(this, 875, 505, 150, 'Quitter', () => this.fermer());
  }

  parler(texte) {
    this.texteNain.setText(`Thorgrim Coffrefort : « ${texte} »`);
    Son.jouer('voix', { race: 'nain', nom: 'Thorgrim', duree: Math.min(1.6, 0.3 + texte.length * 0.018) });
  }

  accueil() {
    const r = this.G.reputation;
    if (r < 0) return 'Hmpf. Ta réputation sent le moisi. Estime-toi heureux qu\'on te reçoive.';
    if (r < 4) return 'Un petit marchand de rien du tout... On peut te prêter un peu. Un tout petit peu.';
    if (r < 10) return 'Ta réputation grandit, marchand. La Banque Centrale Goyenne... t\'écoute. Pour l\'instant.';
    return 'Ah, un client respectable ! Asseyez-vous. Ah non, nous n\'avons pas de chaises à votre taille.';
  }

  creerPrets() {
    if (this.panneau) this.panneau.destroy();
    const G = this.G;
    const c = this.panneau = this.add.container(0, 0);
    c.add(this.add.image(470, 442, panneauHD(this, 660, 160)).setScale(2));
    pretsProposes(G).forEach((p, i) => {
      const y = 378 + i * 21;
      const taux = tauxPret(G, p), du = Math.round(p.somme * (1 + taux));
      c.add(this.add.text(165, y, `${p.nom} : reçois ${p.somme} p., rends ${du} p. en ${p.jours} nuits (${Math.round(taux * 100)} %${taux < p.taux ? ', prix de la lumière' : ''})`,
        style(12, refusPret(G, p) ? '#7a6a5a' : '#3b2410')).setOrigin(0, 0.5));
      const refus = refusPret(G, p);
      if (refus) {
        c.add(this.add.text(785, y, refus, style(12, '#8a3a1a', { fontStyle: 'italic' })).setOrigin(1, 0.5));
      } else {
        const btn = creerBouton(this, 735, y, 104, 'Emprunter', () => this.emprunter(p));
        btn.label.setFontSize(13);
        btn.fond.setScale(2, 0.92);
        c.add([btn.fond, btn.label]);
      }
    });
    const dettes = G.prets.map(p => `${p.nom} : reste ${p.restant} (−${p.parJour}/nuit)`).join(' · ');
    c.add(this.add.text(165, 504, dettes ? 'En cours : ' + dettes : 'Aucun prêt en cours.', style(12, '#5a3a20', { wordWrap: { width: 610 } })).setOrigin(0, 0.5));
  }

  // Ils te toisent : petits mouvements de tête, l'un après l'autre.
  toiser() {
    this.banquiers.forEach((b, i) => {
      this.tweens.killTweensOf(b);
      const { x, y, echelle } = b.place;
      b.setPosition(x, y).setAngle(0).setScale(echelle).setFlipX(false).clearTint();
      if (b.marche) { b.marche.remove(); b.marche = null; }
      this.tweens.add({ targets: b, angle: i === 1 ? 4 : -4, duration: 900 + i * 300, yoyo: true, repeat: -1, delay: i * 400, ease: 'Sine.easeInOut' });
    });
  }

  emprunter(pret) {
    emprunter(this.G, pret);
    this.creerPrets();
    if (pret.mal) {
      Son.jouer('tampon'); Son.jouer('froid');
      // La Main Noire ne danse pas : les banquiers se figent, la lumière baisse.
      this.parler('... Nous n\'avons rien vu. La Main Noire sait où tu dors.');
      const ombre = this.add.rectangle(480, 270, 960, 540, 0x000000, 0).setDepth(50);
      this.banquiers.forEach(b => { this.tweens.killTweensOf(b); b.setAngle(0).setTint(0x8080a0); });
      this.tweens.add({ targets: ombre, fillAlpha: 0.55, duration: 600, yoyo: true, hold: 900, onComplete: () => { ombre.destroy(); this.toiser(); } });
      return;
    }
    Son.jouer('pieces', { montant: pret.somme });
    // Plus le prêt est gros, plus la fête des banquiers est longue et folle.
    const n = pret.somme >= 400 ? 3 : pret.somme >= 150 ? 2 : 1;
    this.parler(['Signé. Et n\'oublie pas : un nain n\'oublie jamais une dette.',
      'Cent cinquante pièces ! Les intérêts... ah, les intérêts ! Messieurs, LA DANSE !',
      'QUATRE CENTS PIÈCES ! Sortez les tambours, la Banque Centrale Goyenne est en FÊTE !'][n - 1]);
    this.danse(n);
  }

  // La danse de la Banque Centrale Goyenne : ils grimpent sur le bureau et célèbrent la dette.
  danse(n) {
    const pieds = 190;
    const voile = this.add.rectangle(480, 270, 960, 540, 0x000000, 0).setDepth(60).setInteractive();
    const passer = this.add.text(944, 10, 'Clique pour passer', style(12, '#f3e6c8', { fontStyle: 'italic', stroke: '#1e130a', strokeThickness: 3 })).setOrigin(1, 0).setDepth(61).setAlpha(0.7);
    const decor = [];
    const etapes = [];
    let fini = false;
    const finir = () => {
      if (fini) return;
      fini = true;
      etapes.forEach(e => e.remove());
      decor.forEach(o => { this.tweens.killTweensOf(o); o.destroy(); });
      voile.destroy(); passer.destroy();
      this.cameras.main.resetFX();
      this.toiser();
    };
    voile.on('pointerdown', finir);
    const plus = (ms, f) => etapes.push(this.time.delayedCall(ms, () => { if (!fini) f(); }));

    // Une pluie de pièces d'or
    creerPiecesHD(this);
    const pluie = (combien, hauteur = -20) => {
      for (let k = 0; k < combien; k++) {
        const p = this.add.image(Phaser.Math.Between(150, 810), hauteur - Phaser.Math.Between(0, 200), Math.random() < 0.6 ? 'pieceFace' : 'pieceTranche').setScale(2).setDepth(55);
        decor.push(p);
        this.tweens.add({ targets: p, y: Phaser.Math.Between(300, 520), angle: Phaser.Math.Between(-360, 360), duration: Phaser.Math.Between(900, 1600), ease: 'Quad.easeIn',
          onComplete: () => this.tweens.add({ targets: p, alpha: 0, duration: 300 }) });
      }
    };
    // Des notes de musique qui s'envolent
    const notes = (x, y) => {
      const t = this.add.text(x, y, Phaser.Utils.Array.GetRandom(['♪', '♫', '♬']), style(26, '#ffe9a0', { stroke: '#3a2408', strokeThickness: 4 })).setOrigin(0.5).setDepth(56);
      decor.push(t);
      this.tweens.add({ targets: t, y: y - 70, x: x + Phaser.Math.Between(-30, 30), alpha: 0, duration: 1100 });
    };

    // 1) Ils bondissent sur le bureau
    this.banquiers.forEach((b, i) => {
      this.tweens.killTweensOf(b);
      b.setAngle(0);
      this.tweens.add({ targets: b, y: pieds - 70, duration: 260, delay: i * 120, ease: 'Quad.easeOut',
        onComplete: () => this.tweens.add({ targets: b, y: pieds, duration: 220, ease: 'Quad.easeIn' }) });
    });
    plus(500, () => { pluie(8 * n); this.cameras.main.shake(120, 0.004); });

    // 2) Le dandinement : gauche, droite, en rythme
    plus(700, () => {
      this.banquiers.forEach((b, i) => {
        this.tweens.add({ targets: b, angle: { from: -14, to: 14 }, duration: 260, yoyo: true, repeat: 3 + n * 2, delay: i * 90, ease: 'Sine.easeInOut' });
        this.tweens.add({ targets: b, y: pieds - 12, duration: 130, yoyo: true, repeat: 7 + n * 4, delay: i * 90 });
      });
      for (let k = 0; k < 3 + n * 2; k++) plus(k * 300, () => notes(Phaser.Math.Between(300, 660), 150));
    });
    let t = 700 + 1200 + n * 500;

    // 3) Le grand saut tourbillon du chef, les deux autres font des ruades
    if (n >= 2) for (let tour = 0; tour < 2; tour++) {
      plus(t, () => {
        const [g, chef, d] = this.banquiers;
        this.tweens.add({ targets: chef, y: pieds - 150, angle: 360, duration: 500, yoyo: true, ease: 'Quad.easeOut' });
        for (const [b, sens] of [[g, 1], [d, -1]]) {
          this.tweens.add({ targets: b, x: b.place.x + 40 * sens, duration: 250, yoyo: true, repeat: 1 });
          this.tweens.add({ targets: b, scaleX: b.place.echelle * 1.25, scaleY: b.place.echelle * 0.8, duration: 125, yoyo: true, repeat: 3 });
        }
        pluie(10 * n);
      });
      plus(t + 1000, () => {
        this.cameras.main.flash(200, 255, 220, 120);
        this.cameras.main.shake(200, 0.006);
        for (let k = 0; k < 5; k++) notes(Phaser.Math.Between(200, 760), Phaser.Math.Between(120, 200));
      });
      t += 1400;
    }

    // 4) La farandole : ils font le tour du bureau en file, sous un feu d'artifice d'or
    if (n >= 3) {
      plus(t, () => {
        const titre = this.add.text(480, 90, 'PRÊT ACCORDÉ !', style(46, '#ffe066', { fontStyle: 'bold', stroke: '#3a2408', strokeThickness: 8 })).setOrigin(0.5).setDepth(57).setScale(0);
        decor.push(titre);
        this.tweens.add({ targets: titre, scale: 1, duration: 450, ease: 'Back.easeOut' });
        this.tweens.add({ targets: titre, angle: { from: -4, to: 4 }, duration: 300, yoyo: true, repeat: -1 });
        this.banquiers.forEach((b, i) => {
          this.tweens.add({ targets: b, x: { from: b.place.x - 140, to: b.place.x + 140 }, duration: 900, yoyo: true, repeat: 1, ease: 'Sine.easeInOut',
            onYoyo: () => b.setFlipX(!b.flipX), onRepeat: () => b.setFlipX(!b.flipX) });
          this.tweens.add({ targets: b, y: pieds - 30, duration: 225, yoyo: true, repeat: 7, delay: i * 75 });
        });
        for (let k = 0; k < 6; k++) plus(k * 500, () => {
          pluie(12);
          const x = Phaser.Math.Between(180, 780), y = Phaser.Math.Between(60, 160);
          for (let a = 0; a < 10; a++) {
            const e = this.add.image(x, y, 'eclat').setScale(3).setDepth(56);
            decor.push(e);
            const ang = (a / 10) * Math.PI * 2;
            this.tweens.add({ targets: e, x: x + Math.cos(ang) * 80, y: y + Math.sin(ang) * 80, alpha: 0, scale: 1, duration: 700, ease: 'Quad.easeOut' });
          }
          this.cameras.main.shake(90, 0.003);
        });
      });
      t += 3800;
    }

    // Fin : ils redescendent derrière leur bureau, très dignes, comme si de rien n'était
    plus(t, () => {
      this.banquiers.forEach(b => { this.tweens.killTweensOf(b); b.setAngle(0).setFlipX(false).setScale(b.place.echelle);
        this.tweens.add({ targets: b, x: b.place.x, y: b.place.y, duration: 400, ease: 'Quad.easeIn' }); });
      this.parler('Hm. Hum. Nous n\'avons pas dansé. Tu n\'as rien vu.');
    });
    plus(t + 500, finir);
  }

  fermer() {
    this.scene.stop();
    this.scene.resume('Nuit');
  }
}
