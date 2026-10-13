// Chez toi. Le soir : bilan de la journée, lettres à accepter ou refuser, banque, atelier,
// bureau, et prévision des clients pour demain.
// Le matin (`matin`), en rentrant du marché : les mêmes lieux, avant d'ouvrir le comptoir.
class NightScene extends Phaser.Scene {
  constructor() { super('Nuit'); }

  init(data) {
    this.matin = !!(data && data.matin);
    // Phaser garde les données d'un démarrage à l'autre : sans ce ménage, le soir du jour 2
    // (lancé sans données) se croyait encore « le matin » — plus de bouton pour aller dormir.
    this.sys.settings.data = {};
  }

  create() {
    const G = this.G = window.GAME;
    if (!this.matin) preparerSoir(G);
    this.lieu = this.matin ? 'Maison' : 'Nuit';

    this.cameras.main.setBackgroundColor(this.matin ? '#2a1e12' : '#1e140c');
    this.cameras.main.fadeIn(500);
    // Le décor : l'arrière-boutique, à la lueur du luminaire (plus sombre le soir)
    creerInterieurHD(this);
    this.add.image(0, 0, murInterieur(this, 'murArriere', { poteaux: [272, 412], graine: 310 })).setOrigin(0).setScale(2).setTint(this.matin ? 0xb8946c : 0x7a5c44);
    this.add.image(0, 440, plancher(this, 'plancherArriere', { graine: 410 })).setOrigin(0).setScale(2).setTint(this.matin ? 0xc8a888 : 0x8a6c54);
    vignette(this, 0.85, 0);
    poserLuminaire(this, 480, -40, niveauAmelioration(G, 'eclairage'), 0);
    this.add.text(480, 34, this.matin ? `Matin du jour ${G.jour} · chez toi` : `Soir du jour ${G.jour}`, style(30, '#f3d98a', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 5 })).setOrigin(0.5);
    // La dette, bien en vue en haut de l'écran
    if (G.prets.length) {
      const dette = G.prets.reduce((a, p) => a + p.restant, 0);
      const echeance = G.prets.reduce((a, p) => a + Math.min(p.parJour, p.restant), 0);
      const note = this.add.text(190, 40, `📜 Dette : ${dette} p. · −${echeance} cette nuit`, style(15, '#8a1a1a', {
        fontStyle: 'bold', backgroundColor: '#ecdcb4', padding: { x: 10, y: 5 } })).setOrigin(0.5).setAngle(-2).setDepth(5);
      this.tweens.add({ targets: note, angle: 2, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    this.bourse = bourse(this, 846, 50, this.G.argent, { echelle: 1.5, taille: 19, aDroite: true });

    this.parchemin(20, 300, this.matin ? "Aujourd'hui" : 'La journée');
    this.parchemin(320, 640, 'Ta réserve');
    this.parchemin(660, 940, 'Lettres reçues');
    this.add.text(800, 108, '1 lettre acceptée = 1 client EN PLUS', style(12, '#8a3a1a', { fontStyle: 'bold italic' })).setOrigin(0.5);
    this.creerReserve(320, 640);
    this.creerPrevision(660, 940);

    const ouvrirPage = (page, donnees) => { this.scene.pause(); this.scene.launch(page, donnees); };
    const boutons = [
      ['Le bureau', () => ouvrirPage('Bureau', { retour: 'Nuit' })],
      ['La banque', () => this.ouvrirBanque()],
      [`L'atelier (${G.tresors.length})`, () => ouvrirPage('Atelier')],
      ...(this.matin
        ? [['Retour au marché', () => this.allerA('Marche')], ['Ouvrir le comptoir', () => this.ouvrirComptoir()]]
        : [['🌙 Aller dormir', () => this.dormir()]]),
    ];
    const largeur = 920 / boutons.length;
    boutons.forEach(([texte, action], i) => {
      const b = creerBouton(this, 20 + largeur * (i + 0.5), 505, largeur - 16, texte, action);
      // Le soir, le bouton pour aller dormir (et passer au lendemain) se voit bien : il luit.
      if (!this.matin && i === boutons.length - 1) {
        b.label.setColor('#ffe9a0');
        creerHalo(this);
        const lueur = this.add.image(b.fond.x, b.fond.y, 'halo').setScale(2.2, 0.7).setTint(0xffd060).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD);
        this.tweens.add({ targets: lueur, alpha: 0.1, duration: 900, yoyo: true, repeat: -1 });
      }
    });
    this.events.off('resume', this.tout, this);
    this.events.on('resume', this.tout, this);
    this.tout();
    afficherStatutSauvegarde(this, 940, 60, 1);
    if (!this.matin) this.time.delayedCall(600, () => conseilGarrick(this, 'soir'));
  }

  allerA(scene) {
    Sauvegarde.maintenant(this.G, scene === 'Marche' ? 'Marche' : this.lieu);
    this.cameras.main.fadeOut(300);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(scene));
  }

  // Le matin : on sauvegarde, puis la file d'attente du jour se forme.
  ouvrirComptoir() {
    Sauvegarde.maintenant(this.G, 'Maison');
    commencerJournee(this);
  }

  // Dormir : la fin de la journée. Ton personnage va se coucher (une petite scène, avec le
  // bilan du jour), la nuit passe, et au matin, direction le Marché des Mastres.
  dormir() {
    const G = this.G;
    const bilan = { jour: G.jour, servis: G.journal.servis, retours: G.journal.retours, morts: G.journal.morts,
      gain: G.argent - G.argentDebutJour, reputation: G.reputation };
    this.cameras.main.fadeOut(500);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Dodo', { bilan }));
  }

  parchemin(x1, x2, titre) {
    this.add.image((x1 + x2) / 2, 270, panneauHD(this, x2 - x1, 400)).setScale(2);
    this.add.text((x1 + x2) / 2, 90, titre, style(20, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5);
  }

  // Tout ce qui change quand on achète, emprunte ou répond à une lettre.
  tout() {
    Sauvegarde.planifier(this.G, this.lieu);
    this.majArgent();
    this.majJournee(20, 300);
    this.majLettres(660, 940);
    this.majPrevision();
  }

  // --- La journée ---

  majJournee(x1, x2) {
    const G = this.G;
    const j = G.journal;
    if (this.journee) this.journee.destroy();
    const c = this.journee = this.add.container(0, 0);
    const gain = G.argent - G.argentDebutJour;
    const p = prevision(G, G.jour);
    const lignes = this.matin ? [
      `Clients attendus : ${p.min} à ${p.max}${p.annonces ? ` + ${p.annonces} par lettre` : ''}`,
      `Commandes par lettre : ${G.annonces.filter(a => a.acceptee && a.jour === G.jour).length}`,
      `Argent : ${G.argent} pièces`,
      `Réputation : ${arrondi(G.reputation)}`,
      `Expérience : ${G.experience} clients`,
      `Flair : ${Math.round(niveauFlair(G) * 100)} % · Artisanat : niv. ${niveauArtisanat(G)}`,
      salaires(G) ? `Salaires : ${salaires(G)} p. par nuit` : '',
    ] : [
      `Clients servis : ${j.servis}`,
      `Revenus : ${j.retours} · Ratées : ${j.echecs || 0} · Morts : ${j.morts}`,
      `Argent ce matin : ${G.argentDebutJour}`,
      `Argent ce soir : ${G.argent} (${gain >= 0 ? '+' : ''}${gain})`,
      `Réputation : ${arrondi(G.reputation)}`,
      `Expérience : ${G.experience} clients`,
      `Flair : ${Math.round(niveauFlair(G) * 100)} % · Artisanat : niv. ${niveauArtisanat(G)}`,
    ];
    c.add(this.add.text(x1 + 18, 112, lignes.join('\n'), style(14, '#3b2410', { lineSpacing: 5 })));

    const dettes = G.prets.map(p => `${p.nom} : reste ${p.restant} (−${p.parJour}/nuit)`);
    c.add(this.add.text(x1 + 18, 290, 'Prêts en cours', style(14, '#3b2410', { fontStyle: 'bold' })));
    c.add(this.add.text(x1 + 18, 310, listeCourte(dettes, 2, 'Aucun'), style(12, '#5a3a20', { lineSpacing: 2 })));
    if (G.argent < 0) {
      c.add(this.add.text(x1 + 18, 330, `À découvert ! Faillite à ${SEUIL_FAILLITE} p.`, style(12, '#a03030', { fontStyle: 'bold' })));
    }

    c.add(this.add.text(x1 + 18, 352, 'En mission', style(14, '#3b2410', { fontStyle: 'bold' })));
    const missions = enMission(G).map(p => `${p.voyageur.nom} — jour ${p.retour}`);
    c.add(this.add.text(x1 + 18, 372, listeCourte(missions, 4, 'Personne'), style(12, '#5a3a20', { lineSpacing: 2 })));
  }

  // --- Ta réserve (on achète le matin, au Marché des Mastres) ---

  creerReserve(x1, x2) {
    this.add.text((x1 + x2) / 2, 110, this.matin ? 'Tu peux encore retourner au marché' : 'Demain matin : le Marché des Mastres', style(12, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5);
    this.lignesStock = {};
    Object.keys({ ...ITEMS, ...MATERIAUX }).forEach((id, i) => {
      const x = x1 + 24 + (i % 2) * 150;
      const y = 136 + Math.floor(i / 2) * 34;
      this.add.image(x, y, iconeObjet(this, id)).setScale(2);
      this.add.text(x + 20, y - 8, nomObjet(id), style(13, '#3b2410'));
      this.lignesStock[id] = this.add.text(x + 20, y + 8, '', style(13, '#3b2410', { fontStyle: 'bold' }));
    });
    this.texteReserve = this.add.text(x1 + 18, 410, '', style(13, '#3b2410', { fontStyle: 'bold' }));
    const btn = this.add.image((x1 + x2) / 2, 444, plaqueBouton(this, x2 - x1 - 36)).setScale(2).setInteractive({ useHandCursor: true });
    this.texteAgrandir = this.add.text((x1 + x2) / 2, 444, '', style(13, '#fff4dc', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 3 })).setOrigin(0.5);
    btn.on('pointerdown', () => {
      if (agrandirReserve(this.G)) return this.tout();
      if (agrandissementSuivant(this.G)) this.annoncer("Pas assez d'argent pour agrandir la réserve.");
    });
    this.boutonAgrandir = btn;
  }

  // Un message important en haut de l'écran.
  annoncer(texte) {
    const t = this.add.text(480, 66, texte, style(14, '#fff4dc', { fontStyle: 'bold', backgroundColor: '#3b2410', padding: { x: 10, y: 4 } }))
      .setOrigin(0.5).setDepth(30);
    this.tweens.add({ targets: t, alpha: 0, delay: 3500, duration: 800, onComplete: () => t.destroy() });
  }

  majArgent() {
    const G = this.G;
    this.bourse.maj(G.argent);
    for (const [id, t] of Object.entries(this.lignesStock)) {
      const n = id in MATERIAUX ? G.materiaux[id] : G.stock[id];
      t.setText('x ' + n).setColor(n > 0 ? '#3b2410' : '#a05040');
    }
    const plein = stockTotal(G) >= G.capacite;
    this.texteReserve.setText(`Réserve : ${stockTotal(G)} / ${G.capacite}${plein ? ' — pleine !' : ''}`);
    const a = agrandissementSuivant(G);
    this.texteAgrandir.setText(a ? `Agrandir à ${a.capacite} places — ${a.prix} p.` : 'Réserve au maximum');
    this.boutonAgrandir.setAlpha(a && peutPayer(G, a.prix) ? 1 : 0.5);
  }

  // --- Les lettres ---

  majLettres(x1, x2) {
    const G = this.G;
    if (this.lettres) this.lettres.destroy();
    const c = this.lettres = this.add.container(0, 0);
    // Les lettres d'information d'abord (un événement passé, en cours ou à venir)...
    const infos = (G.courrier || []).filter(l => l.jour === G.jour).slice(0, 2);
    infos.forEach((l, i) => {
      const y = 124 + i * 54;
      c.add(this.add.text(x1 + 14, y, '📜 ' + l.texte, style(11, '#3b2410', { fontStyle: 'italic', wordWrap: { width: x2 - x1 - 24 }, lineSpacing: 1 })));
    });
    // ... puis les commandes (à accepter ou refuser), les nouvelles d'abord.
    const liste = [...G.annonces].sort((a, b) => a.acceptee - b.acceptee).slice(0, 4 - infos.length);
    if (!liste.length && !infos.length) c.add(this.add.text(x1 + 16, 127, 'Aucune lettre pour le moment.\nLes lettres sont rares.', style(13, '#3b2410')));
    liste.forEach((a, i) => {
      const y = 124 + (i + infos.length) * 52;
      const v = a.voyageur;
      c.add(this.add.text(x1 + 14, y, `✉ ${v.nom}`, style(13, couleurNom(G, v.nom), { fontStyle: 'bold' })));
      c.add(this.add.text(x1 + 14, y + 17, `+1 client le jour ${a.jour} · butin ~${v.butin} p. · ${v.duree} j`, style(11, '#6b4a2a')));
      c.add(this.add.text(x1 + 14, y + 31, commandeEnTexte(v), style(11, '#3b2410', { wordWrap: { width: x2 - x1 - 24 } })));
      if (a.acceptee) {
        c.add(this.add.text(x2 - 12, y, 'acceptée', style(11, '#2f6a2a', { fontStyle: 'italic' })).setOrigin(1, 0));
      } else {
        c.add(this.petitBouton(x2 - 70, y + 8, 'Oui', 0x4f7a3a, () => { accepterLettre(G, a); this.tout(); }));
        c.add(this.petitBouton(x2 - 30, y + 8, 'Non', 0x8a3a2a, () => { refuserLettre(G, a); this.tout(); }));
      }
    });
    if (G.annonces.length > 4) c.add(this.add.text(x1 + 14, 326, `+ ${G.annonces.length - 4} autres`, style(11, '#6b4a2a')));
  }

  petitBouton(x, y, texte, couleur, action) {
    const btn = this.add.container(x, y);
    const fond = this.add.rectangle(0, 0, 36, 20, couleur).setStrokeStyle(1, 0x2a1a10).setInteractive({ useHandCursor: true });
    fond.on('pointerdown', action);
    btn.add([fond, this.add.text(0, 0, texte, style(11, '#fff4dc', { fontStyle: 'bold' })).setOrigin(0.5)]);
    return btn;
  }

  // --- La prévision pour demain ---

  creerPrevision(x1, x2) {
    this.add.rectangle((x1 + x2) / 2, 410, x2 - x1 - 40, 96, 0xc8b080, 0.55).setStrokeStyle(2, 0x8a6a3a);
    this.add.text(x1 + 22, 366, this.matin ? "Aujourd'hui" : 'Demain', style(15, '#3b2410', { fontStyle: 'bold' }));
    this.textePrevision = this.add.text(x1 + 22, 386, '', style(14, '#3b2410', { fontStyle: 'bold', wordWrap: { width: x2 - x1 - 44 } }));
    this.texteFacteurs = this.add.text(x1 + 22, 424, '', style(11, '#5a3a20', { lineSpacing: 2 }));
  }

  majPrevision() {
    const p = prevision(this.G, this.matin ? this.G.jour : this.G.jour + 1);
    const a = attrait(this.G);
    this.textePrevision.setText(`Environ ${p.min} à ${p.max} clients` +
      (p.annonces ? `, + ${p.annonces} annoncé${p.annonces > 1 ? 's' : ''} par lettre` : ''));
    const signe = n => (n >= 0 ? '+' : '') + n.toFixed(1);
    const jour = this.matin ? this.G.jour : this.G.jour + 1;
    const evenements = modifEvenement(this.G, 'clients', null, jour);
    const rumeur = this.G.rumeur && this.G.rumeur.jour === jour ? -RUMEUR_CLIENTS : 0;
    this.texteFacteurs.setText(`Réputation ${signe(a.reputation)} · Expérience ${signe(a.experience)}\nStock varié ${signe(a.variete)}` +
      (evenements ? ` · Événements ${evenements > 0 ? '+' : ''}${evenements}` : '') + (rumeur ? ` · Rumeur ${rumeur}` : ''));
  }

  // --- La banque : une page à part, le soir attend en pause ---

  ouvrirBanque() {
    this.scene.pause();
    this.scene.launch('Banque');
  }
}

// Un nombre à la française : 3 reste 3, 2.5 devient « 2,5 », 0.25 devient « 0,25 ».
function arrondi(n) {
  return String(Math.round(n * 100) / 100).replace('.', ',');
}
