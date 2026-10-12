// Le soir : bilan de la journée, achats chez le fournisseur,
// lettres à accepter ou refuser, banque, et prévision des clients pour demain.
class NightScene extends Phaser.Scene {
  constructor() { super('Nuit'); }

  create() {
    const G = this.G = window.GAME;
    preparerSoir(G);

    this.cameras.main.setBackgroundColor('#1e140c');
    this.cameras.main.fadeIn(500);
    this.add.text(480, 34, `Soir du jour ${G.jour}`, style(30, '#f3d98a', { fontStyle: 'bold' })).setOrigin(0.5);
    this.texteArgent = this.add.text(940, 34, '', style(20, '#f3d98a', { fontStyle: 'bold' })).setOrigin(1, 0.5);

    this.parchemin(20, 300, 'La journée');
    this.parchemin(320, 640, 'Le fournisseur');
    this.parchemin(660, 940, 'Lettres reçues');
    this.creerFournisseur(320, 640);
    this.creerPrevision(660, 940);

    creerBouton(this, 160, 505, 200, 'La banque', () => this.ouvrirBanque());
    this.events.off('resume');
    this.events.on('resume', () => this.tout());
    creerBouton(this, 480, 505, 240, 'Aller dormir', () => this.dormir());
    this.tout();
  }

  dormir() {
    journeeSuivante(this.G);
    this.cameras.main.fadeOut(600);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(this.G.faillite ? 'Faillite' : 'Comptoir'));
  }

  parchemin(x1, x2, titre) {
    this.add.rectangle((x1 + x2) / 2, 270, x2 - x1, 400, 0xead9b0).setStrokeStyle(3, 0x8a6a3a);
    this.add.text((x1 + x2) / 2, 90, titre, style(20, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5);
  }

  // Tout ce qui change quand on achète, emprunte ou répond à une lettre.
  tout() {
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
    const lignes = [
      `Clients servis : ${j.servis}`,
      `Revenus : ${j.retours} · Morts : ${j.morts}`,
      `Argent ce matin : ${G.argentDebutJour}`,
      `Argent ce soir : ${G.argent}  (${gain >= 0 ? '+' : ''}${gain})`,
      `Réputation : ${arrondi(G.reputation)}`,
      `Expérience : ${G.experience} clients`,
      `Flair : ${Math.round(niveauFlair(G) * 100)} % · Artisanat : niv. ${niveauArtisanat(G)}`,
    ];
    c.add(this.add.text(x1 + 18, 112, lignes.join('\n'), style(14, '#3b2410', { lineSpacing: 5 })));

    const dettes = G.prets.map(p => `${p.nom} : reste ${p.restant} (−${p.parJour}/nuit)`);
    c.add(this.add.text(x1 + 18, 262, 'Prêts en cours', style(14, '#3b2410', { fontStyle: 'bold' })));
    c.add(this.add.text(x1 + 18, 282, listeCourte(dettes, 2, 'Aucun'), style(12, '#5a3a20', { lineSpacing: 2 })));
    if (G.argent < 0) {
      c.add(this.add.text(x1 + 18, 318, `À découvert ! Faillite à ${SEUIL_FAILLITE} pièces.`, style(12, '#a03030', { fontStyle: 'bold' })));
    }

    c.add(this.add.text(x1 + 18, 340, 'En mission', style(14, '#3b2410', { fontStyle: 'bold' })));
    const missions = enMission(G).map(p => `${p.voyageur.nom} — jour ${p.retour}`);
    c.add(this.add.text(x1 + 18, 360, listeCourte(missions, 5, 'Personne'), style(12, '#5a3a20', { lineSpacing: 2 })));
  }

  // --- Le fournisseur ---

  creerFournisseur(x1, x2) {
    this.texteGedeon = this.add.text((x1 + x2) / 2, 110, '', style(11, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5);
    this.lignesStock = {};
    Object.entries({ ...ITEMS, ...MATERIAUX }).forEach(([id, item], i) => {
      const y = 132 + i * 28;
      this.add.image(x1 + 26, y, id).setScale(3);
      this.add.text(x1 + 44, y, item.nom, style(14, '#3b2410')).setOrigin(0, 0.5);
      const prix = this.add.text(x1 + 120, y, '', style(14, '#6b4a2a')).setOrigin(0, 0.5);
      const qte = this.add.text(x1 + 162, y, '', style(14, '#3b2410', { fontStyle: 'bold' })).setOrigin(0, 0.5);
      const btn = this.add.rectangle(x2 - 52, y, 88, 26, 0x8a5a2b).setStrokeStyle(2, 0x3b2410)
        .setInteractive({ useHandCursor: true });
      const label = this.add.text(x2 - 52, y, '', style(12, '#fff4dc', { fontStyle: 'bold' })).setOrigin(0.5);
      btn.on('pointerdown', () => this.acheter(id));
      this.lignesStock[id] = { prix, qte, btn, label };
    });

    this.texteReserve = this.add.text(x1 + 18, 410, '', style(13, '#3b2410', { fontStyle: 'bold' }));
    const btn = this.add.rectangle((x1 + x2) / 2, 444, x2 - x1 - 36, 30, 0x6b4423).setStrokeStyle(2, 0x3b2410)
      .setInteractive({ useHandCursor: true });
    this.texteAgrandir = this.add.text((x1 + x2) / 2, 444, '', style(13, '#fff4dc', { fontStyle: 'bold' })).setOrigin(0.5);
    btn.on('pointerdown', () => { if (agrandirReserve(this.G)) this.tout(); });
    this.boutonAgrandir = btn;
  }

  acheter(id) {
    const G = this.G;
    const offre = G.offre[id];
    const materiau = id in MATERIAUX;
    const prix = offre && prixFournisseur(G, offre.prix);
    if (!offre || offre.qte <= 0 || (!materiau && stockTotal(G) >= G.capacite) || !peutPayer(G, prix)) {
      this.cameras.main.shake(120, 0.004);
      return;
    }
    offre.qte--;
    if (materiau) G.materiaux[id]++;
    else G.stock[id]++;
    const msg = depenserChezFournisseur(G, prix);
    if (msg) this.annoncer(msg);
    this.tout();
  }

  // Un message important (cadeau, palier de relation) en haut de l'écran.
  annoncer(texte) {
    const t = this.add.text(480, 66, texte, style(14, '#fff4dc', { fontStyle: 'bold', backgroundColor: '#3b2410', padding: { x: 10, y: 4 } }))
      .setOrigin(0.5).setDepth(30);
    this.tweens.add({ targets: t, alpha: 0, delay: 3500, duration: 800, onComplete: () => t.destroy() });
  }

  majArgent() {
    const G = this.G;
    this.texteArgent.setText(G.argent + ' pièces').setColor(G.argent < 0 ? '#ff8070' : '#f3d98a');
    const plein = stockTotal(G) >= G.capacite;
    const remise = remiseFournisseur(G);
    this.texteGedeon.setText(`${FOURNISSEUR.nom} · ${niveauRelation(G, FOURNISSEUR.nom).nom}` +
      (remise ? ` · remise ${Math.round(remise * 100)} %` : '') + ' · (n) = dispo');
    for (const [id, l] of Object.entries(this.lignesStock)) {
      const offre = G.offre[id];
      const materiau = id in MATERIAUX;
      const prix = offre && prixFournisseur(G, offre.prix);
      l.prix.setText(offre ? prix + ' p.' : '');
      l.qte.setText('x ' + (materiau ? G.materiaux[id] : G.stock[id]));
      l.label.setText(!offre ? 'Absent' : offre.qte > 0 ? `Acheter (${offre.qte})` : 'Épuisé');
      const possible = offre && offre.qte > 0 && (materiau || !plein) && peutPayer(G, prix);
      l.btn.setAlpha(possible ? 1 : 0.4);
      l.label.setAlpha(possible ? 1 : 0.4);
    }
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
    // Les nouvelles lettres (à accepter ou refuser) d'abord.
    const liste = [...G.annonces].sort((a, b) => a.acceptee - b.acceptee).slice(0, 4);
    if (!liste.length) c.add(this.add.text(x1 + 16, 115, 'Aucune lettre pour le moment.', style(13, '#3b2410')));
    liste.forEach((a, i) => {
      const y = 112 + i * 54;
      const v = a.voyageur;
      c.add(this.add.text(x1 + 14, y, `✉ ${v.nom}`, style(13, '#3b2410', { fontStyle: 'bold' })));
      c.add(this.add.text(x1 + 14, y + 17, `Jour ${a.jour} · butin ~${v.butin} p. · ${v.duree} j`, style(11, '#6b4a2a')));
      c.add(this.add.text(x1 + 14, y + 31, commandeEnTexte(v), style(11, '#3b2410', { wordWrap: { width: x2 - x1 - 24 } })));
      if (a.acceptee) {
        c.add(this.add.text(x2 - 12, y, 'acceptée', style(11, '#2f6a2a', { fontStyle: 'italic' })).setOrigin(1, 0));
      } else {
        c.add(this.petitBouton(x2 - 70, y + 8, 'Oui', 0x4f7a3a, () => { a.acceptee = true; this.tout(); }));
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
    this.add.rectangle((x1 + x2) / 2, 410, x2 - x1 - 24, 100, 0xd8c498).setStrokeStyle(2, 0x8a6a3a);
    this.add.text(x1 + 22, 366, 'Demain', style(15, '#3b2410', { fontStyle: 'bold' }));
    this.textePrevision = this.add.text(x1 + 22, 386, '', style(14, '#3b2410', { fontStyle: 'bold', wordWrap: { width: x2 - x1 - 44 } }));
    this.texteFacteurs = this.add.text(x1 + 22, 424, '', style(11, '#5a3a20', { lineSpacing: 2 }));
  }

  majPrevision() {
    const p = prevision(this.G);
    const a = attrait(this.G);
    this.textePrevision.setText(`Entre ${p.min} et ${p.max} clients attendus` +
      (p.annonces ? ` (dont ${p.annonces} par lettre)` : ''));
    const signe = n => (n >= 0 ? '+' : '') + n.toFixed(1);
    this.texteFacteurs.setText(`Réputation ${signe(a.reputation)} · Expérience ${signe(a.experience)}\nStock varié ${signe(a.variete)}`);
  }

  // --- La banque : une page à part, le soir attend en pause ---

  ouvrirBanque() {
    this.scene.pause();
    this.scene.launch('Banque');
  }
}

// 2.5 reste 2.5, 3 reste 3.
function arrondi(n) {
  return Number.isInteger(n) ? n : n.toFixed(1);
}
