// L'atelier : les objets de valeur rachetés aux aventuriers. Chaque ouvrier répare un objet
// à la fois ; tu choisis jusqu'à quel état aller (plus de jours et de matériaux, plus de valeur).
// Un objet cassé ou abîmé restauré jusqu'au parfait état vaut encore plus (« Restauré ★ »).
// La page s'ouvre par-dessus le soir, qui reste en pause.
class AtelierScene extends Phaser.Scene {
  constructor() { super('Atelier'); }

  create() {
    const G = this.G = window.GAME;
    this.cameras.main.setBackgroundColor('#2a1a10');
    creerInterieurHD(this);
    creerAtelierHD(this);
    creerHalo(this);
    if (typeof creerRecitHD === 'function') creerRecitHD(this);

    // La pièce de l'atelier, avec une lanterne qui réchauffe l'établi
    this.add.image(0, 46, 'atelierHD').setOrigin(0).setScale(2);
    this.add.image(500, 90, 'halo').setScale(4, 2.4).setTint(0xffc070).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD);
    this.add.rectangle(480, 46, 960, 4, 0x1a0e06).setOrigin(0.5, 0);
    this.add.rectangle(480, 226, 960, 4, 0x1a0e06).setOrigin(0.5, 0);
    this.add.text(236, 22, "L'atelier", style(26, '#f3d98a', { fontStyle: 'bold' })).setOrigin(0, 0.5);
    this.add.text(360, 23, `Artisanat niv. ${niveauArtisanat(G)} · un objet cassé demande plus de travail · enchères au Marché`,
      style(12, '#c9b48a', { fontStyle: 'italic' })).setOrigin(0, 0.5);
    this.texteInfo = this.add.text(480, 438, '', style(13, '#f3d98a', { fontStyle: 'bold' })).setOrigin(0.5).setDepth(5);

    creerBouton(this, 890, 22, 120, 'Fermer', () => this.fermer());
    this.liste();
  }

  // On voit les objets dans la pièce : les armes et armures au râtelier, les bijoux et
  // le reste sur le velours de la table d'orfèvre, et ceux qu'on répare sur l'établi,
  // avec l'ouvrier à côté et des étincelles. Plus l'objet est abîmé, plus il est terne.
  piece(dx = 0, dy = 0) {
    const G = this.G;
    if (this.objetsPiece) this.objetsPiece.destroy();
    if (this.etincelles) this.etincelles.forEach(e => e.remove());
    this.etincelles = [];
    const c = this.objetsPiece = this.add.container(dx, dy);
    const TEINTES = [0x7a5a4a, 0xa88a78, 0xd8ccbc, 0xffffff, 0xffffff];
    const poser = (t, x, y, echelle, pendu = false) => {
      const img = this.add.image(x, y, iconeObjet(this, 'tr_' + t.categorie)).setOrigin(0.5, pendu ? 0 : 1).setScale(echelle).setTint(TEINTES[t.etat]);
      if (t.etat === 0) img.setAngle(pendu ? 12 : -14);
      c.add(img);
      c.add(this.add.circle(x, pendu ? y - 4 : y + 6, 4, ETATS[t.etat].couleur).setStrokeStyle(1, 0x2a1a10));
      if (t.etat === ETATS.length - 1) {
        const brille = this.add.text(x + 10, (pendu ? y + 4 : y - 26), '✦', style(14, '#fff4b0', { fontStyle: 'bold', brut: true })).setOrigin(0.5);
        c.add(brille);
        this.tweens.add({ targets: brille, alpha: 0.1, scale: 0.6, duration: 700, yoyo: true, repeat: -1, delay: Math.random() * 600 });
      }
      return img;
    };
    const auRatelier = G.tresors.filter(t => !t.reparation && ['arme', 'armure'].includes(t.categorie));
    const surLaTable = G.tresors.filter(t => !t.reparation && !['arme', 'armure'].includes(t.categorie));
    auRatelier.forEach((t, i) => poser(t, 52 + (i % 4) * 48, i < 4 ? 46 + 42 : 46 + 88, 2.4, true));
    surLaTable.forEach((t, i) => poser(t, 738 + (i % 6) * 30, i < 6 ? 148 : 178, 1.5));
    // L'établi : un objet par ouvrier, et l'ouvrier juste à côté
    const surEtabli = enReparation(G).slice(0, 5);
    surEtabli.forEach((t, i) => {
      const x = (surEtabli.length > 3 ? 392 + i * 58 : 410 + i * 80);
      const o = t.reparation.ouvrier;
      const qui = o === 'toi' ? this.add.image(x - 30, 222, textureJoueur(this, G)).setOrigin(0.5, 1).setScale(echelleJoueur(4))
        : imageCorps(this, x - 30, 222, EMPLOYES[o].race, 4);
      c.add(qui);
      poser(t, x + 6, 150, 2);
      const cible = ETATS[t.reparation.cible || t.etat + 1];
      c.add(this.add.text(x + 6, 84, `→ ${cible.nom}\n${t.reparation.jours} j`, style(11, '#fff4dc', { fontStyle: 'bold', align: 'center', stroke: '#2a1a10', strokeThickness: 3 })).setOrigin(0.5, 0));
      this.tweens.add({ targets: qui, angle: { from: -2, to: 3 }, duration: 260, yoyo: true, repeat: -1, delay: i * 120 });
      // Des étincelles qui jaillissent du travail
      this.etincelles.push(this.time.addEvent({ delay: 420 + i * 90, loop: true, callback: () => {
        if (!c.active) return;
        const e = this.add.rectangle(x + 6, 132, 2, 2, Phaser.Utils.Array.GetRandom([0xffe066, 0xffa040, 0xfff4dc])).setBlendMode(Phaser.BlendModes.ADD);
        c.add(e);
        this.tweens.add({ targets: e, x: x + 6 + Phaser.Math.Between(-22, 22), y: 132 - Phaser.Math.Between(6, 26), alpha: 0, duration: 420, onComplete: () => e.destroy() });
      } }));
    });
    if (!G.tresors.length) c.add(this.add.text(480, 136, "L'atelier est vide…", style(15, '#fff4dc', { fontStyle: 'italic', stroke: '#2a1a10', strokeThickness: 4 })).setOrigin(0.5));
  }

  // Les employés : chacun permet une réparation de plus en même temps, contre un salaire.
  employes() {
    const G = this.G;
    if (this.zoneEmployes) this.zoneEmployes.destroy();
    const c = this.zoneEmployes = this.add.container(0, 0);
    const places = placesEmployes(G);
    c.add(this.add.text(24, 456, `Main-d'œuvre : ${ouvriers(G).length} réparation${ouvriers(G).length > 1 ? 's' : ''} en même temps · employés ${G.employes.length} / ${places}` +
      (salaires(G) ? ` · salaires : ${salaires(G)} p. par nuit` : '') + (places < EMPLOYES_DE_BASE + 2 ? ' · un établi de plus (améliorations) = une place de plus' : ''),
      style(12, '#f3e6c8', { fontStyle: 'bold' })).setOrigin(0, 0.5));
    Object.entries(EMPLOYES).forEach(([id, e], i) => {
      const x = 14 + i * 236;
      const embauche = G.employes.includes(id);
      const libre = embauche || G.employes.length < places;
      c.add(imageCorps(this, x + 12, 534, e.race, 2));
      c.add(this.add.text(x + 28, 474, e.nom, style(12, '#f3d98a', { fontStyle: 'bold' })));
      c.add(this.add.text(x + 28, 490, `${e.salaire} p./nuit · ${e.description}`, style(10, '#c9b48a', { wordWrap: { width: 196 } })));
      const btn = this.add.rectangle(x + 198, 476, 70, 20, embauche ? 0x8a3a2a : 0x4f7a3a).setStrokeStyle(2, 0x2a1a10).setInteractive({ useHandCursor: true });
      if (!libre) btn.setFillStyle(0x5a4a3a);
      btn.on('pointerdown', () => {
        if (!clicUnique(this, 600)) return;
        if (embauche) {
          renvoyer(G, id);
          this.texteInfo.setText(`${e.nom} est parti${e.race === 'nain' ? 'e' : ''}. Sa réparation en cours s'arrête.`);
        } else {
          const erreur = embaucher(G, id);
          if (erreur) return this.texteInfo.setText(erreur);
          this.texteInfo.setText(`${e.nom} rejoint ton atelier ! Salaire : ${e.salaire} pièces chaque nuit.`);
        }
        this.liste();
      });
      c.add([btn, this.add.text(x + 198, 476, embauche ? 'Renvoyer' : libre ? 'Embaucher' : '🔒 Établi', style(10, '#fff4dc', { fontStyle: 'bold' })).setOrigin(0.5)]);
    });
  }

  liste() {
    const G = this.G;
    this.piece();
    if (this.contenu) this.contenu.destroy();
    const c = this.contenu = this.add.container(0, 0);
    c.add(this.add.image(480, 331, panneauHD(this, 932, 196)).setScale(2));
    c.add(this.add.text(36, 244, `Tes objets de valeur (${G.tresors.length} / ${PLACES_ATELIER}) · Fer ${G.materiaux.fer} · Cuir ${G.materiaux.cuir} · Fil d'or ${G.materiaux.filOr || 0}`,
      style(14, '#3b2410', { fontStyle: 'bold' })).setOrigin(0, 0.5));
    this.employes();
    if (!G.tresors.length) {
      c.add(this.add.text(480, 335, "Rachète des objets aux aventuriers à la fin de leur récit :\nils apparaîtront ici, et dans la pièce au-dessus.",
        style(15, '#6b4a2a', { align: 'center', lineSpacing: 6 })).setOrigin(0.5));
    }
    G.tresors.forEach((t, i) => {
      const x0 = i < 4 ? 30 : 490, y = 280 + (i % 4) * 38;
      c.add(this.add.image(x0 + 12, y, iconeObjet(this, 'tr_' + t.categorie)).setScale(1.5));
      c.add(this.add.text(x0 + 30, y - 8, raccourcir(t.nom, 26), style(13, '#3b2410', { fontStyle: 'bold' })).setOrigin(0, 0.5));
      // Ce qu'il t'a coûté, et ce qu'il vaut maintenant
      const achat = t.prixAchat !== undefined ? `acheté ${t.prixAchat} p.` : CATEGORIES[t.categorie].nom;
      c.add(this.add.text(x0 + 30, y + 9, `${achat} · vaut ~${valeurTresor(t)} p.${estRestaure(t) ? ' ★' : ''}`,
        style(11, estRestaure(t) ? '#b8860b' : '#5a3a20', { fontStyle: 'bold' })).setOrigin(0, 0.5));
      c.add(...pastilleEtat(this, x0 + 222, y, t.etat, 11));
      const droite = x0 + 436;
      if (t.reparation) {
        const cible = ETATS[t.reparation.cible || t.etat + 1];
        const qui = t.reparation.ouvrier === 'toi' ? 'Toi' : EMPLOYES[t.reparation.ouvrier].nom.split(' ')[0];
        c.add(this.add.text(droite, y, `${qui} → ${cible.nom}\nencore ${t.reparation.jours} j`,
          style(11, '#2f6a2a', { fontStyle: 'bold', align: 'right' })).setOrigin(1, 0.5));
      } else if (t.etat >= ETATS.length - 1) {
        c.add(this.add.text(droite, y, estRestaure(t) ? 'Restauré ★' : 'Parfait état', style(13, estRestaure(t) ? '#b8860b' : '#1f5aa0', { fontStyle: 'bold italic' })).setOrigin(1, 0.5));
      } else {
        const btn = this.add.rectangle(droite - 64, y, 128, 28, 0x8a5a2b).setStrokeStyle(2, 0x3b2410).setInteractive({ useHandCursor: true });
        btn.on('pointerdown', () => {
          if (!ouvrierLibre(G)) return this.texteInfo.setText("Tout le monde est déjà occupé. Embauche quelqu'un pour réparer plus d'objets à la fois.");
          this.choisirStade(t);
        });
        if (!ouvrierLibre(G)) btn.setAlpha(0.5);
        c.add([btn, this.add.text(droite - 64, y, 'Réparer…', style(13, '#fff4dc', { fontStyle: 'bold' })).setOrigin(0.5)]);
      }
    });
    if (G.tresors.length > 4) c.add(this.add.rectangle(480, 330, 2, 150, 0x8a6a3a, 0.6));
  }

  // La fenêtre du choix : jusqu'à quel état réparer l'objet, avec les jours, les matériaux
  // et la valeur à la fin. Le parfait état d'un objet cassé ou abîmé est mis en avant.
  choisirStade(t) {
    const G = this.G;
    if (this.fenetre) this.fenetre.destroy();
    const c = this.fenetre = this.add.container(0, 0).setDepth(30);
    const ouvrier = ouvrierLibre(G, t);
    const mat = CATEGORIES[t.categorie].materiau;
    const stades = [];
    for (let e = t.etat + 1; e < ETATS.length; e++) stades.push(e);
    const h = 120 + stades.length * 44;
    c.add(this.add.rectangle(480, 270, 960, 540, 0x000000, 0.55).setInteractive());
    c.add(this.add.image(480, 270, panneauHD(this, 620, h)).setScale(2));
    const haut = 270 - h / 2;
    c.add(this.add.text(480, haut + 24, `Réparer : ${t.nom}`, style(18, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
    c.add(this.add.text(480, haut + 50, `${ouvrier === 'toi' ? "C'est toi qui t'y mets" : nomOuvrier(ouvrier) + " s'en charge"} · état actuel : ${ETATS[t.etat].nom} (~${valeurTresor(t)} p.)` +
      (mat ? ` · ${MATERIAUX[mat].nom} : ${G.materiaux[mat] || 0}` : '') + (t.prixAchat !== undefined ? ` · acheté ${t.prixAchat} p.` : ''), style(12, '#5a3a20')).setOrigin(0.5));
    stades.forEach((e, i) => {
      const y = haut + 88 + i * 44;
      const jours = dureeReparation(G, t, ouvrier, e);
      const n = materiauxReparation(t, e);
      const possible = !mat || (G.materiaux[mat] || 0) >= n;
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
