// Le Mastre Marché, chaque matin avant d'ouvrir le comptoir :
// trois étals (épicerie, forge, apothicaire), le coin des jeux et le mendiant.
// On clique sur un lieu pour l'ouvrir dans le panneau du bas.
class MarcheScene extends Phaser.Scene {
  constructor() { super('Marche'); }

  create() {
    const G = this.G = window.GAME;
    G.banniere = G.jour;
    this.cameras.main.fadeIn(500);

    // La place du marché au matin
    const g = this.add.graphics();
    dessinerComte(g, 0, 0, 960, 300, 0.05);
    g.fillStyle(0xa89a80).fillRect(0, 250, 960, 50);
    g.lineStyle(1, 0x8a7a60);
    for (let x = 0; x < 960; x += 24) g.lineBetween(x, 250, x + 12, 300);
    this.add.text(480, 22, `Le Mastre Marché · matin du jour ${G.jour}`, style(24, '#fff4dc', { fontStyle: 'bold', stroke: '#2a1a10', strokeThickness: 5 })).setOrigin(0.5);

    // Les étals
    Object.entries(MARCHANDS).forEach(([cle, m], i) => this.creerEtal(cle, m, 270 + i * 210));
    this.creerLieu(70, 'perso_colporteur', 'Le mendiant', () => this.ouvrirMendiant(), { tint: 0x9a9a9a, angle: -6, echelle: 4.5 });
    this.creerLieu(885, 'perso_gobelin', 'Le coin des jeux', () => this.ouvrirJeux(), { echelle: 4.5 });

    // Le panneau du bas et la barre d'infos
    this.add.rectangle(480, 388, 940, 168, 0xead9b0).setStrokeStyle(3, 0x8a6a3a);
    this.add.rectangle(480, 510, 960, 60, 0x2a1a10);
    this.texteInfos = this.add.text(20, 498, '', style(14, '#f3e6c8', { lineSpacing: 4 }));
    creerBouton(this, 840, 510, 220, 'Ouvrir le comptoir', () => this.ouvrir());

    this.ouvrirEtal('gedeon');
  }

  // Un étal : auvent rayé aux couleurs du marchand, comptoir, marchand derrière.
  creerEtal(cle, m, x) {
    const g = this.add.graphics();
    g.fillStyle(0x6b4423).fillRect(x - 92, 80, 8, 150).fillRect(x + 84, 80, 8, 150);
    for (let i = 0; i < 8; i++) {
      g.fillStyle(i % 2 ? 0xf3e6c8 : m.couleur).fillRect(x - 96 + i * 24, 66, 24, 30);
    }
    this.add.image(x, 205, 'perso_' + m.race).setOrigin(0.5, 1).setScale(5);
    const comptoir = this.add.graphics();
    comptoir.fillStyle(0x8a5a2b).fillRect(x - 90, 196, 180, 44);
    comptoir.fillStyle(0x6b4423).fillRect(x - 90, 196, 180, 6);
    Object.keys(this.G.etals[cle] || {}).slice(0, 4).forEach((id, i) => this.add.image(x - 60 + i * 40, 188, id).setScale(3));
    this.add.text(x, 254, m.nom, style(13, '#fff4dc', { fontStyle: 'bold', stroke: '#2a1a10', strokeThickness: 4 })).setOrigin(0.5);
    this.add.text(x, 272, m.metier, style(11, '#fff4dc', { stroke: '#2a1a10', strokeThickness: 3 })).setOrigin(0.5);
    const zone = this.add.rectangle(x, 160, 190, 140, 0xffffff, 0).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => this.ouvrirEtal(cle));
  }

  creerLieu(x, texture, nom, action, { tint = 0xffffff, angle = 0, echelle = 5 }) {
    const perso = this.add.image(x, 245, texture).setOrigin(0.5, 1).setScale(echelle).setTint(tint).setAngle(angle);
    this.add.text(x, 262, nom, style(13, '#fff4dc', { fontStyle: 'bold', stroke: '#2a1a10', strokeThickness: 4 })).setOrigin(0.5);
    const zone = this.add.rectangle(x, 200, 110, 120, 0xffffff, 0).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', action);
    return perso;
  }

  // Vide le panneau du bas et le prépare pour un nouveau lieu.
  panneau(titre, sousTitre = '') {
    if (this.contenu) this.contenu.destroy();
    this.tweens.killTweensOf(this.cibles || []);
    this.cibles = [];
    const c = this.contenu = this.add.container(0, 0);
    c.add(this.add.text(30, 314, titre, style(17, '#3b2410', { fontStyle: 'bold' })));
    c.add(this.add.text(930, 316, sousTitre, style(12, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(1, 0));
    this.majInfos();
    return c;
  }

  bouton(c, x, y, l, texte, action, couleur = 0x8a5a2b) {
    const fond = this.add.rectangle(x, y, l, 26, couleur).setStrokeStyle(2, 0x3b2410).setInteractive({ useHandCursor: true });
    const label = this.add.text(x, y, texte, style(12, '#fff4dc', { fontStyle: 'bold' })).setOrigin(0.5);
    fond.on('pointerdown', action);
    c.add([fond, label]);
    return { fond, label };
  }

  majInfos() {
    const G = this.G;
    const p = prevision(G, G.jour);
    this.texteInfos.setText(`Bourse : ${G.argent} pièces · Réserve : ${stockTotal(G)}/${G.capacite} · Fer ${G.materiaux.fer} · Cuir ${G.materiaux.cuir}\n` +
      `Aujourd'hui : entre ${p.min} et ${p.max} clients attendus (un stock varié en attire plus)`);
  }

  message(texte, couleur = '#3b2410') {
    if (this.texteMessage) this.texteMessage.destroy();
    this.texteMessage = this.add.text(480, 460, texte, style(13, couleur, { fontStyle: 'bold' })).setOrigin(0.5);
    this.contenu.add(this.texteMessage);
  }

  // --- Un étal ---

  ouvrirEtal(cle) {
    const G = this.G;
    const m = MARCHANDS[cle];
    const rel = niveauRelation(G, m.nom);
    const remise = remiseMarchand(G, cle);
    const c = this.panneau(`${m.nom} · ${m.metier}`, `Relation : ${rel.nom}${remise ? ` · remise ${Math.round(remise * 100)} %` : ''} · les prix changent chaque jour`);
    const offre = G.etals[cle];
    const ids = m.objets.filter(id => offre[id]);
    m.objets.filter(id => !offre[id]).forEach(id => ids.push(id));
    ids.forEach((id, i) => {
      const x = 40 + (i % 2) * 460;
      const y = 352 + Math.floor(i / 2) * 34;
      const o = offre[id];
      c.add(this.add.image(x + 12, y, id).setScale(3));
      c.add(this.add.text(x + 34, y, nomObjet(id), style(14, '#3b2410')).setOrigin(0, 0.5));
      const enStock = id in MATERIAUX ? G.materiaux[id] : G.stock[id];
      c.add(this.add.text(x + 150, y, `tu as ${enStock}`, style(12, '#6b4a2a')).setOrigin(0, 0.5));
      if (!o) {
        c.add(this.add.text(x + 260, y, "Pas aujourd'hui", style(12, '#8a6a4a', { fontStyle: 'italic' })).setOrigin(0, 0.5));
        return;
      }
      c.add(this.add.text(x + 230, y, `${prixMarchand(G, cle, id)} p.`, style(14, '#3b2410', { fontStyle: 'bold' })).setOrigin(0, 0.5));
      const libelle = o.qte > 0 ? `Acheter (${o.qte})` : 'Épuisé';
      const b = this.bouton(c, x + 345, y, 100, libelle, () => {
        const r = acheterAuMarche(G, cle, id);
        if (r.erreur) return this.message(r.erreur, '#a03030');
        this.ouvrirEtal(cle);
        this.message(r.message || `Acheté : ${nomObjet(id)}.`);
      });
      if (o.qte <= 0 || !peutPayer(G, prixMarchand(G, cle, id))) { b.fond.setAlpha(0.5); b.label.setAlpha(0.5); }
    });
  }

  // --- Le mendiant ---

  ouvrirMendiant() {
    const G = this.G;
    const c = this.panneau('Le mendiant', `Tu lui as déjà donné ${G.mendiant} pièce${G.mendiant > 1 ? 's' : ''}`);
    c.add(this.add.text(30, 350, "Un vieil homme est assis contre la fontaine, une sébile ébréchée entre les mains.\nPersonne ne s'arrête jamais pour lui.",
      style(14, '#3b2410', { lineSpacing: 4 })));
    [1, 5, 10].forEach((n, i) => this.bouton(c, 120 + i * 150, 420, 130, `Donner ${n} pièce${n > 1 ? 's' : ''}`, () => {
      const merci = donnerAuMendiant(G, n);
      if (!merci) return this.message("Tu n'as pas assez d'argent.", '#a03030');
      this.ouvrirMendiant();
      this.message(merci);
    }));
  }

  // --- Le coin des jeux : les dés et le bonneteau ---

  ouvrirJeux() {
    const G = this.G;
    const c = this.panneau('Le coin des jeux', 'Tenu par Fil-de-Fer, cousin du vieux Grippesou');
    c.add(this.add.rectangle(480, 395, 2, 120, 0x8a6a3a));
    // Les dés
    c.add(this.add.text(40, 340, `Les dés · le plus gros total gagne (${partiesRestantes(G, 'des')} parties restantes)`, style(13, '#3b2410', { fontStyle: 'bold' })));
    c.add(this.add.text(40, 362, 'Toi', style(12, '#6b4a2a')));
    c.add(this.add.text(250, 362, 'Fil-de-Fer', style(12, '#6b4a2a')));
    this.desToi = [this.creerDe(c, 70, 400), this.creerDe(c, 120, 400)];
    this.desLui = [this.creerDe(c, 280, 400), this.creerDe(c, 330, 400)];
    MISES.forEach((m, i) => this.bouton(c, 400, 365 + i * 30, 80, `Miser ${m}`, () => this.lancerDes(m)));
    // Le bonneteau
    c.add(this.add.text(500, 340, `Le bonneteau · trouve la pièce, gagne le double (${partiesRestantes(G, 'bonneteau')} restantes)`, style(13, '#3b2410', { fontStyle: 'bold' })));
    this.gobelets = [0, 1, 2].map(i => this.creerGobelet(c, 560 + i * 100, 420, i));
    this.piece = this.add.ellipse(0, 428, 18, 10, 0xe8c040).setStrokeStyle(2, 0x9a7a10).setVisible(false);
    c.add(this.piece);
    MISES.forEach((m, i) => this.bouton(c, 880, 365 + i * 30, 80, `Miser ${m}`, () => this.lancerBonneteau(m)));
    this.etatBonneteau = 'attente';
  }

  creerDe(c, x, y) {
    const de = this.add.container(x, y);
    de.add(this.add.rectangle(0, 0, 36, 36, 0xf8f4e8).setStrokeStyle(2, 0x3b2410));
    de.points = this.add.graphics();
    de.add(de.points);
    c.add(de);
    this.dessinerDe(de, 1);
    return de;
  }

  dessinerDe(de, valeur) {
    const pos = { 1: [[0, 0]], 2: [[-8, -8], [8, 8]], 3: [[-9, -9], [0, 0], [9, 9]], 4: [[-8, -8], [8, -8], [-8, 8], [8, 8]],
      5: [[-9, -9], [9, -9], [0, 0], [-9, 9], [9, 9]], 6: [[-8, -10], [8, -10], [-8, 0], [8, 0], [-8, 10], [8, 10]] }[valeur];
    de.points.clear().fillStyle(0x2a1a10);
    for (const [px, py] of pos) de.points.fillCircle(px, py, 3);
  }

  lancerDes(mise) {
    const G = this.G;
    if (this.desEnCours) return;
    const r = jouerAuxDes(G, mise);
    if (!r) return this.message(partiesRestantes(G, 'des') <= 0 ? "Plus de parties aujourd'hui. Reviens demain !" : "Pas assez d'argent pour cette mise.", '#a03030');
    this.desEnCours = true;
    const tous = [...this.desToi, ...this.desLui];
    let n = 0;
    this.time.addEvent({
      delay: 70, repeat: 9, callback: () => {
        n++;
        tous.forEach(d => { this.dessinerDe(d, Phaser.Math.Between(1, 6)); d.setAngle(Phaser.Math.Between(-20, 20)); });
        if (n < 10) return;
        tous.forEach(d => d.setAngle(0));
        this.desToi.forEach((d, i) => this.dessinerDe(d, r.toi[i]));
        this.desLui.forEach((d, i) => this.dessinerDe(d, r.lui[i]));
        this.desEnCours = false;
        const total = `${r.toi[0] + r.toi[1]}${r.bonus ? ' +1 (trèfle)' : ''} contre ${r.lui[0] + r.lui[1]}`;
        this.majInfos();
        if (r.resultat === 'gagne') this.message(`${total} : tu gagnes ${mise} pièces !`, '#2f6a2a');
        else if (r.resultat === 'perdu') this.message(`${total} : tu perds ${mise} pièces. « Hé hé, merci ! »`, '#a03030');
        else this.message(`${total} : égalité, tu récupères ta mise.`);
      },
    });
  }

  creerGobelet(c, x, y, i) {
    const g = this.add.container(x, y);
    const forme = this.add.graphics();
    forme.fillStyle(0x7a4a1e).fillTriangle(-24, 18, 24, 18, 0, -26);
    forme.fillStyle(0x7a4a1e).fillRect(-24, 4, 48, 14);
    forme.fillStyle(0x5a3a1a).fillRect(-26, 14, 52, 6);
    g.add(forme);
    g.setSize(56, 50).setInteractive({ useHandCursor: true });
    g.on('pointerdown', () => this.choisirGobelet(g));
    c.add(g);
    this.cibles.push(g);
    return g;
  }

  async lancerBonneteau(mise) {
    const G = this.G;
    if (this.etatBonneteau !== 'attente') return;
    if (!miserAuBonneteau(G, mise)) {
      return this.message(partiesRestantes(G, 'bonneteau') <= 0 ? "Plus de parties aujourd'hui. Reviens demain !" : "Pas assez d'argent pour cette mise.", '#a03030');
    }
    this.majInfos();
    this.mise = mise;
    this.etatBonneteau = 'melange';
    // La pièce se cache sous un gobelet...
    this.gagnant = Phaser.Utils.Array.GetRandom(this.gobelets);
    this.piece.setPosition(this.gagnant.x, 428).setVisible(true);
    await this.animer({ targets: this.gagnant, y: 385, duration: 250, yoyo: true, hold: 500 });
    this.piece.setVisible(false);
    // ... puis Fil-de-Fer mélange.
    const vitesse = aDecoration(G, 'trefle') ? 380 : 260;
    for (let i = 0; i < 7; i++) {
      const [a, b] = Phaser.Utils.Array.Shuffle([...this.gobelets]).slice(0, 2);
      const xa = a.x, xb = b.x;
      await Promise.all([
        this.animer({ targets: a, x: xb, duration: vitesse, ease: 'Sine.easeInOut' }),
        this.animer({ targets: b, x: xa, duration: vitesse, ease: 'Sine.easeInOut' }),
      ]);
    }
    this.etatBonneteau = 'choix';
    this.message('Alors, sous quel gobelet est la pièce ?');
  }

  async choisirGobelet(g) {
    if (this.etatBonneteau !== 'choix') return;
    this.etatBonneteau = 'revelation';
    this.piece.setPosition(this.gagnant.x, 428).setVisible(true);
    await Promise.all(this.gobelets.map(x => this.animer({ targets: x, y: 385, duration: 250 })));
    if (g === this.gagnant) {
      gagnerAuBonneteau(this.G, this.mise);
      this.message(`Trouvé ! Tu gagnes ${this.mise * 2} pièces.`, '#2f6a2a');
    } else {
      this.message(`Raté ! « Hé hé, l'œil est plus lent que la main... »`, '#a03030');
    }
    this.majInfos();
    await this.attendre(900);
    await Promise.all(this.gobelets.map(x => this.animer({ targets: x, y: 420, duration: 250 })));
    this.piece.setVisible(false);
    this.etatBonneteau = 'attente';
  }

  animer(config) {
    return new Promise(resoudre => this.tweens.add({ ...config, onComplete: resoudre }));
  }

  attendre(ms) {
    return new Promise(resoudre => this.time.delayedCall(ms, resoudre));
  }

  ouvrir() {
    ouvrirComptoir(this.G);
    this.cameras.main.fadeOut(400);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Comptoir'));
  }
}
