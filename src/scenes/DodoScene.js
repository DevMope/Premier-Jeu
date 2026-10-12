// Aller dormir : la fin de la journée. Ton personnage rentre dans sa chambre, souffle la
// bougie et se glisse dans son lit, pendant que le bilan de la journée s'affiche (façon
// Dave the Diver). La nuit passe à la fenêtre, puis l'aube : il se lève, direction le marché.
class DodoScene extends Cinematique {
  constructor() { super('Dodo'); }

  init(data) {
    this.bilan = data.bilan;
    this.nuitPassee = false;
    this.fini = false;
  }

  create() {
    const G = this.G = window.GAME;
    this.cameras.main.fadeIn(500);
    this.dessinerChambre();
    this.joueur = this.add.image(1000, SOL_CHAMBRE, textureJoueur(this, G)).setOrigin(0.5, 1).setScale(6).setDepth(3);
    this.boutonPasser(() => this.passer());
    this.derouler();
  }

  // --- Le décor ---

  dessinerChambre() {
    // Le ciel derrière la fenêtre : la nuit par-dessus le jour, qu'on effacera à l'aube.
    const fx = 640, fy = 60, fw = 200, fh = 150;
    this.add.rectangle(fx + fw / 2, fy + fh / 2, fw, fh, 0x8ac8f0);
    this.soleil = this.add.circle(fx + 140, fy + fh + 30, 22, 0xfff0a0);
    this.cielNuit = this.add.container(0, 0);
    this.cielNuit.add(this.add.rectangle(fx + fw / 2, fy + fh / 2, fw, fh, 0x0e1430));
    for (let i = 0; i < 14; i++) {
      const etoile = this.add.rectangle(fx + 10 + Math.random() * (fw - 20), fy + 8 + Math.random() * (fh - 30), 2, 2, 0xf3f0d0);
      this.tweens.add({ targets: etoile, alpha: 0.3, duration: 400 + Math.random() * 900, yoyo: true, repeat: -1 });
      this.cielNuit.add(etoile);
    }
    this.lune = this.add.circle(fx + 50, fy + 45, 18, 0xf3ecc8);
    this.cielNuit.add([this.lune, this.add.circle(fx + 58, fy + 40, 15, 0x0e1430)]);
    // L'aube : une lueur orangée entre la nuit et le jour.
    this.aube = this.add.rectangle(fx + fw / 2, fy + fh / 2, fw, fh, 0xf0a060, 0);

    // Les murs en planches, avec un trou pour la fenêtre.
    const g = this.add.graphics().setDepth(1);
    g.fillStyle(0x4a2e18);
    g.fillRect(0, 0, 960, fy).fillRect(0, fy + fh, 960, SOL_CHAMBRE - fy - fh).fillRect(0, fy, fx, fh).fillRect(fx + fw, fy, 960 - fx - fw, fh);
    g.lineStyle(2, 0x3b2410);
    for (let y = 30; y < SOL_CHAMBRE; y += 30) {
      g.lineBetween(0, y, fx, y).lineBetween(fx + fw, y, 960, y);
      if (y < fy || y > fy + fh) g.lineBetween(fx, y, fx + fw, y);
    }
    // Le cadre et la croisée de la fenêtre.
    g.lineStyle(8, 0x6b4423).strokeRect(fx, fy, fw, fh);
    g.lineStyle(5, 0x6b4423).lineBetween(fx + fw / 2, fy, fx + fw / 2, fy + fh).lineBetween(fx, fy + fh / 2, fx + fw, fy + fh / 2);
    // Le plancher.
    g.fillStyle(0x6b4423).fillRect(0, SOL_CHAMBRE, 960, 540 - SOL_CHAMBRE);
    g.lineStyle(2, 0x4a2e18);
    for (let x = 0; x < 960; x += 80) g.lineBetween(x, SOL_CHAMBRE, x, 540);

    // Le lit : cadre, matelas, oreiller.
    const lit = this.add.graphics().setDepth(2);
    lit.fillStyle(0x5a3a1a).fillRect(250, SOL_CHAMBRE - 110, 18, 110).fillRect(560, SOL_CHAMBRE - 70, 16, 70);
    lit.fillStyle(0x7a4a22).fillRect(250, SOL_CHAMBRE - 50, 326, 30);
    lit.fillStyle(0xe8d8b0).fillRect(268, SOL_CHAMBRE - 72, 292, 24);
    lit.fillStyle(0xf4f0e4).fillRect(274, SOL_CHAMBRE - 88, 70, 22);
    // La couverture en patchwork, posée par-dessus le dormeur (elle ne se voit qu'une fois couché).
    this.couverture = this.add.graphics().setDepth(4).setAlpha(0);
    const couleurs = [0x8a3a2a, 0xc9a046, 0x4f7a3a, 0x3a5a8a];
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 2; j++) this.couverture.fillStyle(couleurs[(i + j) % 4]).fillRect(330 + i * 26, SOL_CHAMBRE - 92 + j * 22, 26, 22);
    }
    this.couverture.lineStyle(2, 0x3b2410).strokeRect(330, SOL_CHAMBRE - 92, 234, 44);

    // La table de chevet, la bougie et sa lumière.
    lit.fillStyle(0x5a3a1a).fillRect(600, SOL_CHAMBRE - 60, 70, 10).fillRect(610, SOL_CHAMBRE - 50, 8, 50).fillRect(652, SOL_CHAMBRE - 50, 8, 50);
    lit.fillStyle(0xf3ecc8).fillRect(628, SOL_CHAMBRE - 84, 12, 24);
    this.flamme = this.add.ellipse(634, SOL_CHAMBRE - 92, 8, 14, 0xffc040).setDepth(2);
    this.lumiere = this.add.container(634, SOL_CHAMBRE - 90).setDepth(5);
    for (let k = 0; k < 10; k++) this.lumiere.add(this.add.circle(0, 0, 30 + k * 16, 0xffb040, 0.03).setBlendMode(Phaser.BlendModes.ADD));
    this.tweens.add({ targets: [this.flamme, this.lumiere], scaleX: 0.85, duration: 180, yoyo: true, repeat: -1 });

    // Un tapis, un coffre, et la vieille épée de Garrick accrochée au mur.
    lit.fillStyle(0x8a3a2a).fillEllipse(440, SOL_CHAMBRE + 40, 300, 34);
    lit.fillStyle(0xc9a046).fillEllipse(440, SOL_CHAMBRE + 40, 250, 22);
    lit.fillStyle(0x8a3a2a).fillEllipse(440, SOL_CHAMBRE + 40, 200, 12);
    this.add.image(120, SOL_CHAMBRE, 'coffre').setOrigin(0.5, 1).setScale(6).setDepth(2);
    // Le mannequin de l'armure (du côté qu'elle avait hier soir), et le compte des pièces.
    this.coteAffiche = this.G.armureCoteVu || coteArmure(this.G);
    this.dessinerArmure(this.G.armure.filter(id => !(this.G.nouvellesPieces || []).some(n => n.piece === id)));
    this.add.image(400, 150, 'epee').setScale(6).setAngle(45).setDepth(2);

    // L'obscurité de la chambre, qui tombe quand on souffle la bougie.
    this.noir = this.add.rectangle(480, 270, 960, 540, 0x05060f, 0).setDepth(6);
  }

  // --- Le déroulé ---

  async derouler() {
    const b = this.bilan;
    await this.marcher(this.joueur, 600, 4);
    this.onomatopee(600, SOL_CHAMBRE - 130, 'Aaaah...', '#f3d98a');
    await this.animer({ targets: this.joueur, scaleY: 6.5, duration: 260, yoyo: true });
    await this.attendre(300);
    // Il souffle la bougie...
    this.onomatopee(650, SOL_CHAMBRE - 140, 'Fffff !');
    this.tweens.killTweensOf([this.flamme, this.lumiere]);
    this.tweens.add({ targets: [this.flamme, this.lumiere], alpha: 0, duration: 400 });
    this.tweens.add({ targets: this.noir, fillAlpha: 0.45, duration: 700 });
    await this.attendre(500);
    // ... et se glisse sous la couverture.
    this.joueur.setOrigin(0.5, 0.5);
    this.joueur.y -= this.joueur.displayHeight / 2;
    await this.animer({ targets: this.joueur, x: 360, y: SOL_CHAMBRE - 80, angle: -90, duration: 500, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: this.couverture, alpha: 1, duration: 300 });
    this.ronfler();
    if (this.fini) return;

    // Le bilan de la journée, sur un parchemin.
    this.afficherBilan(b);
    await this.attendreClicSansBoite();
    if (this.fini) return;
    this.carteBilan.destroy();

    // La nuit passe...
    this.passerLaNuit();
    if (this.G.faillite) return this.partir('Faillite');
    this.tweens.add({ targets: this.lune, y: this.lune.y - 60, alpha: 0, duration: 1600 });
    await this.attendre(800);
    this.tweens.add({ targets: this.cielNuit, alpha: 0, duration: 1800 });
    this.tweens.add({ targets: this.aube, fillAlpha: 0.6, duration: 1000, yoyo: true, hold: 300 });
    this.tweens.add({ targets: this.soleil, y: this.soleil.y - 110, duration: 2200, ease: 'Sine.easeOut' });
    await this.animer({ targets: this.noir, fillAlpha: 0, duration: 2000 });
    if (this.zzz) this.zzz.remove();
    // Debout !
    this.tweens.add({ targets: this.couverture, alpha: 0, duration: 200 });
    await this.animer({ targets: this.joueur, angle: 0, x: 600, y: SOL_CHAMBRE - this.joueur.displayHeight / 2, duration: 450, ease: 'Back.easeOut' });
    this.joueur.setOrigin(0.5, 1).setY(SOL_CHAMBRE);
    this.onomatopee(600, SOL_CHAMBRE - 140, 'Debout !', '#f3d98a');
    // L'armure a pu changer de côté pendant la nuit.
    if (!(this.G.nouvellesPieces || []).length && this.G.armure.length) await this.changerCote(coteArmure(this.G));
    // Un messager (Confrérie ou Main Noire), avec une pièce de l'armure pour chaque zone ouverte.
    for (const n of this.G.nouvellesPieces || []) {
      await this.attendre(500);
      if (this.fini) return;
      await this.messager(n);
    }
    this.annoncerMatin();
    await this.attendre(1600);
    if (this.fini) return;
    await this.marcher(this.joueur, 1020, 3);
    this.partir('Marche');
  }

  ronfler() {
    const lettre = () => {
      const z = this.add.text(380 + Math.random() * 20, SOL_CHAMBRE - 120, 'z', style(18 + Math.random() * 10, '#c8d0f0', { fontStyle: 'bold' })).setDepth(7);
      this.tweens.add({ targets: z, x: z.x + 40, y: z.y - 70, alpha: 0, duration: 1800, onComplete: () => z.destroy() });
    };
    lettre();
    this.zzz = this.time.addEvent({ delay: 700, loop: true, callback: lettre });
  }

  // Le parchemin du bilan : ce que la journée a donné.
  afficherBilan(b) {
    const c = this.carteBilan = this.add.container(0, -400).setDepth(8);
    c.add(this.add.rectangle(760, 210, 330, 290, 0xead9b0).setStrokeStyle(4, 0x8a6a3a));
    c.add(this.add.text(760, 88, `Fin du jour ${b.jour}`, style(24, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
    const lignes = [
      ['Clients servis', b.servis],
      ['Revenus de mission', b.retours],
      ['Disparus', b.morts],
      ['Réputation', arrondi(b.reputation)],
    ];
    lignes.forEach(([nom, valeur], i) => {
      c.add(this.add.text(620, 124 + i * 28, nom, style(15, '#5a3a20')));
      c.add(this.add.text(900, 124 + i * 28, String(valeur), style(15, '#3b2410', { fontStyle: 'bold' })).setOrigin(1, 0));
    });
    const signe = b.gain >= 0 ? '+' : '−';
    c.add(this.add.rectangle(760, 250, 290, 2, 0x8a6a3a));
    c.add(this.add.text(620, 262, 'Bénéfice du jour', style(16, '#3b2410', { fontStyle: 'bold' })));
    c.add(this.add.text(900, 262, `${signe}${Math.abs(b.gain)} p.`, style(18, b.gain >= 0 ? '#2f7a2a' : '#a03030', { fontStyle: 'bold' })).setOrigin(1, 0));
    const mot = b.gain > 0 && !b.morts ? 'Une bonne journée de travail !'
      : b.gain > 0 ? 'Une bonne journée... malgré les pertes.'
        : 'Une dure journée. Demain sera meilleur.';
    c.add(this.add.text(760, 312, mot, style(14, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5));
    c.add(this.add.text(760, 340, '▶ clique pour dormir', style(12, '#8a6a4a', { fontStyle: 'italic' })).setOrigin(0.5));
    this.tweens.add({ targets: c, y: 0, duration: 600, ease: 'Back.easeOut' });
  }

  attendreClicSansBoite() {
    return new Promise(resoudre => this.time.delayedCall(500, () => this.input.once('pointerdown', resoudre)));
  }

  // La nuit : échéances, salaires, atelier, nouveau jour... (une seule fois).
  passerLaNuit() {
    if (this.nuitPassee) return;
    this.nuitPassee = true;
    nuit(this.G);
    if (this.G.faillite) Sauvegarde.supprimer();
    else Sauvegarde.maintenant(this.G, 'Marche');
  }

  dessinerArmure(possedees) {
    if (this.mannequin) this.mannequin.destroy();
    if (this.texteArmure) this.texteArmure.destroy();
    const cote = this.coteAffiche || coteArmure(this.G);
    this.mannequin = dessinerMannequin(this, 790, SOL_CHAMBRE, possedees, 4, cote).setDepth(2);
    if (possedees.length) {
      this.texteArmure = this.add.text(790, SOL_CHAMBRE + 14, `${NOMS_ARMURE[cote]} · ${possedees.length} / ${ARMURE.length}`,
        style(11, '#f3d98a', { fontStyle: 'italic', stroke: '#2a1a10', strokeThickness: 3 })).setOrigin(0.5, 0).setDepth(2);
    }
  }

  // Toc toc : le messager encapuchonné apporte une pièce de l'armure. La première fois, il
  // raconte la légende du champion.
  async messager({ piece, zone, cote = 'clair', scelle }) {
    const sombre = cote === 'sombre';
    const p = pieceArmure(piece, cote);
    // La légende, la première fois de chaque côté.
    const premiere = sombre ? !this.G.legendeSombre : this.G.armure.indexOf(piece) === 0 || !this.G.legendeClaire;
    if (sombre) this.G.legendeSombre = true;
    else this.G.legendeClaire = true;
    await this.changerCote(cote);
    this.onomatopee(900, SOL_CHAMBRE - 160, sombre ? 'Tok... tok...' : 'Toc toc !', sombre ? '#ff6080' : '#fff4dc');
    const m = this.add.image(1010, SOL_CHAMBRE, 'perso_colporteur').setOrigin(0.5, 1).setScale(6).setTint(sombre ? 0x3a1a24 : 0x7a7aa8).setDepth(3);
    await this.marcher(m, 905, 4);
    const c = this.add.container(0, 0).setDepth(9);
    c.add(this.add.rectangle(480, 210, 640, premiere ? 290 : 220, 0xead9b0).setStrokeStyle(4, 0x8a6a3a));
    const haut = premiere ? 78 : 112;
    c.add(this.add.text(480, haut, sombre ? 'Un messager de la Main Noire' : 'Un messager de la Confrérie du Dernier Rempart',
      style(17, sombre ? '#7a1a2a' : '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
    c.add(this.add.image(220, haut + 70, sombre ? piece + '_sombre' : piece).setScale(8));
    c.add(this.add.text(275, haut + 30, p.nom, style(17, '#7a5a10', { fontStyle: 'bold' })));
    c.add(this.add.text(275, haut + 56, p.texte, style(13, '#5a3a20', { fontStyle: 'italic', wordWrap: { width: 500 } })));
    const ouvre = `${ZONES[zone].nom} ${ZONES[zone].nom.startsWith('Les ') ? "s'ouvrent" : "s'ouvre"} à tes aventuriers.`;
    let message = premiere ? (sombre ? LEGENDE_SOMBRE : LEGENDE_ARMURE)
      : sombre ? `« ${ouvre} La Main Noire te laisse une pièce de plus pour son champion. Ne la perds pas. »`
        : `« ${ouvre} La Confrérie te confie une pièce de plus pour le champion. Garde-la bien. »`;
    if (scelle) {
      message += scelle === 'mal' ? "\nL'armure est complète. Ton camp est scellé : l'ombre. Il n'y aura plus de retour en arrière."
        : "\nL'armure est complète. Ton camp est scellé : la lumière. Il n'y aura plus de retour en arrière.";
    }
    c.add(this.add.text(185, haut + 110, message, style(13, '#3b2410', { wordWrap: { width: 590 }, lineSpacing: 3 })));
    c.add(this.add.text(780, (premiere ? 345 : 312), '▶ clique', style(12, '#8a6a4a', { fontStyle: 'italic' })).setOrigin(1, 0.5));
    c.setAlpha(0);
    await this.animer({ targets: c, alpha: 1, duration: 300 });
    await this.attendreClicSansBoite();
    if (this.fini) return;
    c.destroy();
    // La pièce rejoint le mannequin.
    const icone = this.add.image(905, SOL_CHAMBRE - 90, sombre ? piece + '_sombre' : piece).setScale(5).setDepth(8);
    await this.animer({ targets: icone, x: 790, y: SOL_CHAMBRE - 100, scale: 3, duration: 600, ease: 'Sine.easeInOut' });
    icone.destroy();
    this.dessinerArmure(this.G.armure.slice(0, this.G.armure.indexOf(piece) + 1));
    if (sombre) this.cameras.main.flash(300, 120, 0, 30);
    else this.cameras.main.flash(250, 255, 230, 150);
    await this.marcher(m, 1020, 3);
    m.destroy();
  }

  // L'armure change de côté : elle se corrompt (vers l'ombre) ou se purifie (vers la lumière).
  async changerCote(cote) {
    if (cote === this.coteAffiche) return;
    const avant = this.coteAffiche;
    this.coteAffiche = cote;
    this.G.armureCoteVu = cote;
    const possedees = this.mannequin ? this.G.armure.filter(id => !(this.G.nouvellesPieces || []).some(n => n.piece === id)) : [];
    if (!avant || !possedees.length) return this.dessinerArmure(possedees);
    this.cameras.main.flash(500, cote === 'sombre' ? 80 : 255, 0, cote === 'sombre' ? 40 : 200);
    this.dessinerArmure(possedees);
    const t = this.add.text(790, SOL_CHAMBRE - 190, cote === 'sombre' ? "L'armure s'assombrit..." : "L'armure se purifie...",
      style(16, cote === 'sombre' ? '#ff6080' : '#fff4dc', { fontStyle: 'bold italic', stroke: '#2a1a10', strokeThickness: 4 })).setOrigin(0.5).setDepth(8);
    this.tweens.add({ targets: t, alpha: 0, y: t.y - 30, delay: 1500, duration: 800, onComplete: () => t.destroy() });
    await this.attendre(1200);
  }

  annoncerMatin() {
    const G = this.G;
    const t = this.add.text(480, 150, `Jour ${G.jour}`, style(56, '#f3d98a', { fontStyle: 'bold', stroke: '#2a1a10', strokeThickness: 8 }))
      .setOrigin(0.5).setDepth(9).setScale(0);
    this.tweens.add({ targets: t, scale: 1, duration: 400, ease: 'Back.easeOut' });
    const nouvelles = (G.nouvellesAtelier || []).slice(0, 2);
    this.add.text(480, 196, ['Direction le Marché des Mastres !', ...nouvelles].join('\n'),
      style(15, '#fff4dc', { align: 'center', stroke: '#2a1a10', strokeThickness: 4, lineSpacing: 4 })).setOrigin(0.5, 0).setDepth(9);
    G.banniere = G.jour; // le « Jour N » est déjà annoncé
  }

  // « Passer ▶▶ » : la nuit passe quand même.
  passer() {
    if (this.fini) return;
    this.passerLaNuit();
    this.partir(this.G.faillite ? 'Faillite' : 'Marche');
  }

  partir(scene) {
    if (this.fini) return;
    this.fini = true;
    this.cameras.main.fadeOut(500);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(scene));
  }
}

const SOL_CHAMBRE = 430;
