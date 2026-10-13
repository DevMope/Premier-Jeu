// L'atelier : les objets de valeur rachetés aux aventuriers. Chaque ouvrier répare un objet
// à la fois ; tu choisis jusqu'à quel état aller (plus de jours et de matériaux, plus de valeur).
// Un objet cassé ou abîmé restauré jusqu'au parfait état vaut encore plus (« Restauré ★ »).
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
    this.add.image(60, 50, 'enclume').setOrigin(0.5, 1).setScale(5);

    this.add.text(480, 30, "L'atelier", style(28, '#f3d98a', { fontStyle: 'bold' })).setOrigin(0.5);
    this.add.text(480, 62, `Artisanat niv. ${niveauArtisanat(G)} · un objet cassé demande plus de travail · vends tes objets aux enchères du Marché des Mastres`,
      style(12, '#c9b48a', { fontStyle: 'italic' })).setOrigin(0.5);
    this.texteInfo = this.add.text(480, 432, '', style(14, '#f3d98a', { fontStyle: 'bold' })).setOrigin(0.5);

    creerBouton(this, 870, 34, 140, 'Fermer', () => this.fermer());
    this.liste();
  }

  // Les employés : chacun permet une réparation de plus en même temps, contre un salaire.
  employes() {
    const G = this.G;
    if (this.zoneEmployes) this.zoneEmployes.destroy();
    const c = this.zoneEmployes = this.add.container(0, 0);
    c.add(this.add.text(110, 452, `Main-d'œuvre : ${ouvriers(G).map(nomOuvrier).join(', ')} · ${ouvriers(G).length} réparation${ouvriers(G).length > 1 ? 's' : ''} en même temps` +
      (salaires(G) ? ` · salaires : ${salaires(G)} p. par nuit` : ''), style(13, '#f3e6c8', { fontStyle: 'bold' })));
    Object.entries(EMPLOYES).forEach(([id, e], i) => {
      const x = 110 + i * 370;
      const embauche = G.employes.includes(id);
      c.add(imageCorps(this, x + 10, 528, e.race, 2));
      c.add(this.add.text(x + 28, 478, `${e.nom} · ${e.salaire} p./nuit`, style(13, '#f3d98a', { fontStyle: 'bold' })));
      c.add(this.add.text(x + 28, 496, e.description, style(11, '#c9b48a', { wordWrap: { width: 230 } })));
      const btn = this.add.rectangle(x + 310, 500, 100, 28, embauche ? 0x8a3a2a : 0x4f7a3a).setStrokeStyle(2, 0x2a1a10).setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => {
        if (embauche) {
          renvoyer(G, id);
          this.texteInfo.setText(`${e.nom} est parti${e.race === 'nain' ? 'e' : ''}. Sa réparation en cours s'arrête.`);
        } else {
          embaucher(G, id);
          this.texteInfo.setText(`${e.nom} rejoint ton atelier ! Salaire : ${e.salaire} pièces chaque nuit.`);
        }
        this.liste();
      });
      c.add([btn, this.add.text(x + 310, 500, embauche ? 'Renvoyer' : 'Embaucher', style(12, '#fff4dc', { fontStyle: 'bold' })).setOrigin(0.5)]);
    });
  }

  liste() {
    const G = this.G;
    if (this.contenu) this.contenu.destroy();
    const c = this.contenu = this.add.container(0, 0);
    c.add(this.add.image(480, 255, panneauHD(this, 900, 330)).setScale(2));
    c.add(this.add.text(50, 100, `Tes objets de valeur (${G.tresors.length} / ${PLACES_ATELIER}) · Fer ${G.materiaux.fer} · Cuir ${G.materiaux.cuir}`,
      style(14, '#3b2410', { fontStyle: 'bold' })));
    this.employes();
    if (!G.tresors.length) {
      c.add(this.add.text(480, 255, "L'atelier est vide.\nRachète des objets aux aventuriers à la fin de leur récit.",
        style(15, '#6b4a2a', { align: 'center', lineSpacing: 6 })).setOrigin(0.5));
    }
    G.tresors.forEach((t, i) => {
      const y = 140 + i * 36;
      c.add(this.add.image(70, y, 'tr_' + t.categorie).setScale(3));
      c.add(this.add.text(95, y, t.nom, style(14, '#3b2410', { fontStyle: 'bold' })).setOrigin(0, 0.5));
      c.add(this.add.text(300, y, CATEGORIES[t.categorie].nom, style(12, '#5a3a20')).setOrigin(0, 0.5));
      c.add(...pastilleEtat(this, 380, y, t.etat));
      c.add(this.add.text(470, y, `~${valeurTresor(t)} p.${estRestaure(t) ? ' ★' : ''}`, style(13, estRestaure(t) ? '#b8860b' : '#3b2410', { fontStyle: 'bold' })).setOrigin(0, 0.5));
      if (t.reparation) {
        const cible = ETATS[t.reparation.cible || t.etat + 1];
        c.add(this.add.text(910, y, `${nomOuvrier(t.reparation.ouvrier) === 'toi' ? 'Tu répares' : nomOuvrier(t.reparation.ouvrier) + ' répare'} → ${cible.nom} : encore ${t.reparation.jours} j`,
          style(12, '#2f6a2a', { fontStyle: 'bold' })).setOrigin(1, 0.5));
      } else if (t.etat >= ETATS.length - 1) {
        c.add(this.add.text(910, y, estRestaure(t) ? 'Restauré ★' : 'Parfait état', style(13, estRestaure(t) ? '#b8860b' : '#1f5aa0', { fontStyle: 'bold italic' })).setOrigin(1, 0.5));
      } else {
        const btn = this.add.rectangle(790, y, 240, 28, 0x8a5a2b).setStrokeStyle(2, 0x3b2410).setInteractive({ useHandCursor: true });
        btn.on('pointerdown', () => {
          if (!ouvrierLibre(G)) return this.texteInfo.setText("Tout le monde est déjà occupé. Embauche quelqu'un pour réparer plus d'objets à la fois.");
          this.choisirStade(t);
        });
        if (!ouvrierLibre(G)) btn.setAlpha(0.5);
        c.add([btn, this.add.text(790, y, 'Réparer… (choisir le stade)', style(12, '#fff4dc', { fontStyle: 'bold' })).setOrigin(0.5)]);
      }
    });
  }

  // La fenêtre du choix : jusqu'à quel état réparer l'objet, avec les jours, les matériaux
  // et la valeur à la fin. Le parfait état d'un objet cassé ou abîmé est mis en avant.
  choisirStade(t) {
    const G = this.G;
    if (this.fenetre) this.fenetre.destroy();
    const c = this.fenetre = this.add.container(0, 0).setDepth(30);
    const ouvrier = ouvrierLibre(G);
    const mat = CATEGORIES[t.categorie].materiau;
    const stades = [];
    for (let e = t.etat + 1; e < ETATS.length; e++) stades.push(e);
    const h = 120 + stades.length * 44;
    c.add(this.add.rectangle(480, 270, 960, 540, 0x000000, 0.55).setInteractive());
    c.add(this.add.image(480, 270, panneauHD(this, 620, h)).setScale(2));
    const haut = 270 - h / 2;
    c.add(this.add.text(480, haut + 24, `Réparer : ${t.nom}`, style(18, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
    c.add(this.add.text(480, haut + 50, `${ouvrier === 'toi' ? "C'est toi qui t'y mets" : nomOuvrier(ouvrier) + " s'en charge"} · état actuel : ${ETATS[t.etat].nom} (~${valeurTresor(t)} p.)` +
      (mat ? ` · ${MATERIAUX[mat].nom} : ${G.materiaux[mat]}` : ''), style(12, '#5a3a20')).setOrigin(0.5));
    stades.forEach((e, i) => {
      const y = haut + 88 + i * 44;
      const jours = dureeReparation(G, t, ouvrier, e);
      const n = materiauxReparation(t, e);
      const possible = !mat || G.materiaux[mat] >= n;
      const restaure = e === ETATS.length - 1 && t.etatInitial in BONUS_RESTAURE;
      const fond = this.add.rectangle(480, y, 560, 36, possible ? 0xf6ead0 : 0xd8c8a8).setStrokeStyle(2, restaure ? 0xd4a020 : 0x8a6a3a);
      c.add(fond);
      c.add(pastilleEtat(this, 230, y, e));
      c.add(this.add.text(322, y, `${jours} jour${jours > 1 ? 's' : ''}${mat ? ` · ${n} ${MATERIAUX[mat].nom.toLowerCase()}` : ''}`, style(13, possible ? '#3b2410' : '#9a3020', { fontStyle: 'bold' })).setOrigin(0, 0.5));
      c.add(this.add.text(740, y, `→ ~${valeurTresor(t, e)} p.${restaure ? `  Restauré ★ (×${String(BONUS_RESTAURE[t.etatInitial]).replace('.', ',')})` : ''}`,
        style(13, restaure ? '#b8860b' : '#2f6a2a', { fontStyle: 'bold' })).setOrigin(1, 0.5));
      if (!possible) return;
      fond.setInteractive({ useHandCursor: true });
      fond.on('pointerover', () => fond.setFillStyle(0xfff4dc));
      fond.on('pointerout', () => fond.setFillStyle(0xf6ead0));
      fond.on('pointerdown', () => {
        const erreur = reparerTresor(G, t, e);
        this.fenetre.destroy();
        this.fenetre = null;
        if (erreur) return this.texteInfo.setText(erreur);
        this.texteInfo.setText(`${ouvrier === 'toi' ? 'Tu te mets' : nomOuvrier(ouvrier) + ' se met'} au travail : ${t.nom} → ${ETATS[e].nom} en ${jours} jour${jours > 1 ? 's' : ''}.`);
        this.liste();
      });
    });
    const annuler = this.add.text(480, haut + h - 20, 'Annuler', style(14, '#8a3a2a', { fontStyle: 'bold' })).setOrigin(0.5).setInteractive({ useHandCursor: true });
    annuler.on('pointerdown', () => { this.fenetre.destroy(); this.fenetre = null; });
    c.add(annuler);
  }

  fermer() {
    this.scene.stop();
    this.scene.resume('Nuit');
  }
}
