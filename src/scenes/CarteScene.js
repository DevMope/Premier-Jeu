// La carte du monde. Deux usages :
// - le matin, en ouvrant le comptoir (`planification`) : tu places d'abord tous les voyageurs
//   du jour qui cherchent l'aventure sur les zones de ton choix, puis tu prépares leurs sacs ;
// - au comptoir (`comptoir`) : pour un seul voyageur, le comptoir attend en pause.
// La carte montre aussi où sont tes aventuriers en mission et les clients qui t'ont écrit :
// une vue d'ensemble de tes alentours et de ta progression.
// Les zones dangereuses s'ouvrent avec la réputation, ou quand un aventurier les découvre.
class CarteScene extends Phaser.Scene {
  constructor() { super('Carte'); }

  init(data) {
    this.comptoir = data.comptoir || null;
    this.planification = !this.comptoir;
    this.zoneChoisie = null;
  }

  create() {
    const G = this.G = window.GAME;
    // Les voyageurs à placer : tout ceux du jour sans destination, ou celui du comptoir.
    this.voyageurs = this.comptoir ? [this.comptoir.voyageur]
      : G.file.filter(e => e.type === 'client' && (!e.voyageur.queteId || e.planifie)).map(e => e.voyageur);
    this.place = {}; // id du voyageur → zone choisie
    for (const e of G.file) if (e.planifie) this.place[e.voyageur.id] = e.voyageur.zone;
    this.selection = this.voyageurs.find(v => !this.place[v.id]) || this.voyageurs[0];

    this.dessinerParchemin();
    this.titre = this.add.text(480, 24, '', style(19, '#f3d98a', { fontStyle: 'bold' })).setOrigin(0.5);
    this.dessinerZones();
    this.reperes = this.add.container(0, 0).setDepth(5);
    this.bulle = this.add.container(0, 0).setDepth(10);
    this.creerBande();
    this.tout();
    this.cameras.main.fadeIn(300);
    if (!this.comptoir) this.time.delayedCall(500, () => conseilGarrick(this, 'carte'));
  }

  // --- Le décor ---

  dessinerParchemin() {
    // Le parchemin posé sur le bureau
    creerInterieurHD(this);
    creerBureauHD(this);
    creerCarteHD(this);
    creerHalo(this);
    creerVignettesZonesHD(this);
    creerComptoirCarteHD(this);
    this.add.image(0, 0, 'bureauBois').setOrigin(0).setScale(2).setTint(0xa08870);
    vignette(this, 0.7, 0);
    this.add.image(14, 50, 'carteHD').setOrigin(0).setScale(2);
    const g = this.add.graphics();
    // Les trois terres : la lumière à l'ouest, l'ombre à l'est, et le milieu.
    g.fillStyle(0xfff0a0, 0.2).fillRect(20, 56, 246, 356);
    g.fillStyle(0x2a1a3a, 0.2).fillRect(735, 56, 205, 356);
    g.lineStyle(2, 0x6a421e, 0.5).lineBetween(266, 58, 266, 410).lineBetween(735, 58, 735, 410);
    this.add.text(141, 400, '☀ Terres de lumière', style(14, '#8a6a10', { fontStyle: 'bold italic' })).setOrigin(0.5);
    this.add.text(840, 400, '☾ Terres d\'ombre', style(14, '#4a2a5a', { fontStyle: 'bold italic' })).setOrigin(0.5);
    // Ton comptoir, et les chemins qui en partent
    const depart = { x: 420, y: 386 };
    g.lineStyle(2, 0x8a6a3a, 0.7);
    for (const z of Object.values(ZONES)) {
      const n = 14;
      for (let i = 0; i < n; i += 2) {
        g.lineBetween(depart.x + (z.x - depart.x) * i / n, depart.y + (z.y - depart.y) * i / n,
          depart.x + (z.x - depart.x) * (i + 1) / n, depart.y + (z.y - depart.y) * (i + 1) / n);
      }
    }
    this.add.image(depart.x, depart.y + 14, 'halo').setScale(0.9, 0.5).setTint(0xffe8a0).setAlpha(0.7);
    this.add.image(depart.x, depart.y + 14, 'comptoirCarteHD').setOrigin(0.5, 1).setScale(2);
    this.add.text(depart.x, depart.y + 14, 'Ton comptoir', style(12, '#3b2410', { fontStyle: 'bold', stroke: '#f0e2bc', strokeThickness: 4 })).setOrigin(0.5, 0);
  }

  dessinerZones() {
    const G = this.G;
    this.anneau = this.add.ellipse(0, 0, 116, 82).setStrokeStyle(4, 0xffe066).setVisible(false).setDepth(2);
    this.tweens.add({ targets: this.anneau, scale: 1.15, duration: 500, yoyo: true, repeat: -1 });
    for (const [cle, z] of Object.entries(ZONES)) {
      const ouverte = zoneOuverte(G, cle);
      // Les contrées inconnues restent dans la brume du parchemin.
      if (!ouverte) this.add.image(z.x, z.y, 'halo').setScale(2.3, 1.9).setTint(0xe4d0a0).setAlpha(0.9);
      // Le médaillon peint de la contrée (ou sa brume), et ses étoiles de danger en bas.
      this.add.image(z.x + 3, z.y + 4, ouverte ? 'vignetteZone_' + cle : 'vignetteZone_inconnue').setScale(2).setTint(0x000000).setAlpha(0.25);
      const pastille = this.add.image(z.x, z.y, ouverte ? 'vignetteZone_' + cle : 'vignetteZone_inconnue').setScale(2)
        .setInteractive({ useHandCursor: true });
      if (ouverte) this.add.text(z.x, z.y + 30, '★'.repeat(z.danger), style(13, '#ffd860', { fontStyle: 'bold', stroke: '#3b2410', strokeThickness: 4 })).setOrigin(0.5);
      else this.add.text(z.x, z.y, '?', style(26, '#8a7450', { fontStyle: 'bold' })).setOrigin(0.5);
      this.add.text(z.x, z.y + 38, ouverte ? z.nom : '🔒 ???', style(13, ouverte ? '#2a1808' : '#6a6458', { fontStyle: 'bold', align: 'center', wordWrap: { width: 190 }, stroke: '#f0e2bc', strokeThickness: 4 })).setOrigin(0.5, 0);
      // Une contrée qui vient de s'ouvrir depuis la dernière fois : on la signale.
      if (ouverte && G.zonesVuesCarte && !G.zonesVuesCarte.includes(cle)) {
        const n = this.add.text(z.x, z.y - 44, '✦ Nouveau ! ✦', style(14, '#a0300a', { fontStyle: 'bold', stroke: '#fff4dc', strokeThickness: 4 })).setOrigin(0.5).setDepth(3);
        this.tweens.add({ targets: n, scale: 1.15, duration: 500, yoyo: true, repeat: -1 });
      }
      pastille.on('pointerdown', () => this.choisirZone(cle));
    }
    G.zonesVuesCarte = zonesOuvertes(G);
  }

  // Les petits personnages posés sur la carte : missions en cours, lettres, voyageurs placés.
  dessinerReperes() {
    const G = this.G;
    this.reperes.removeAll(true);
    const parZone = {};
    const ajouter = (zone, race, texte, couleur, choisi) => (parZone[zone] = parZone[zone] || []).push({ race, texte, couleur, choisi });
    for (const p of enMission(G)) ajouter(p.voyageur.zone, p.voyageur.race, `⚔${p.retour}`, '#3b2410');
    for (const e of G.file) {
      if (e.type !== 'client' || !e.voyageur.queteId || this.voyageurs.includes(e.voyageur)) continue;
      ajouter(e.voyageur.zone, e.voyageur.race, estCible(G, e.voyageur) ? '☠' : '✉', estCible(G, e.voyageur) ? '#7a1a4a' : '#1f5aa0');
    }
    for (const v of this.voyageurs) {
      if (this.place[v.id]) ajouter(this.place[v.id], v.race, v.nom.split(' ')[0].slice(0, 6), '#2f6a2a', v === this.selection);
    }
    for (const [zone, liste] of Object.entries(parZone)) {
      const z = ZONES[zone];
      liste.slice(0, 6).forEach((r, i) => {
        const x = z.x - (Math.min(liste.length, 6) - 1) * 18 + i * 36;
        const y = z.y - 22;
        if (r.choisi) this.reperes.add(this.add.circle(x, y - 12, 15, 0xffe066, 0.6));
        this.reperes.add(imageCorps(this, x, y, r.race, 1.6));
        // Les étiquettes alternent de hauteur pour ne pas se chevaucher.
        this.reperes.add(this.add.text(x, y - 26 - (i % 2) * 12, r.texte, style(11, r.couleur, { fontStyle: 'bold', backgroundColor: '#f3e6c8', padding: { x: 2, y: 0 } })).setOrigin(0.5, 1));
      });
      if (liste.length > 6) this.reperes.add(this.add.text(z.x + 82, z.y - 36, `+${liste.length - 6}`, style(12, '#3b2410', { fontStyle: 'bold' })));
    }
  }

  // --- La bande des voyageurs du jour ---

  creerBande() {
    this.add.rectangle(480, 476, 932, 100, 0x2a1a10).setStrokeStyle(2, 0xc9a227);
    // La légende des repères, à part dans la bande : rien ne peut la cacher.
    this.add.text(24, 438, 'Sur la carte :', style(12, '#c9b48a', { fontStyle: 'bold italic' }));
    this.add.text(24, 456, '⚔3  en mission\n      (jour du retour)\n✉  t\'a écrit\n☠  ta cible', style(12, '#f3e6c8', { lineSpacing: 1 }));
    this.add.rectangle(138, 476, 2, 84, 0x8a6a3a);
    this.cartes = this.add.container(0, 0);
    const libelle = this.planification ? 'Préparer les sacs ▶' : 'Retour au comptoir';
    this.boutonFin = creerBouton(this, 840, 476, 190, libelle, () => this.terminer());
    this.boutonFin.label.setFontSize(16);
  }

  dessinerBande() {
    this.cartes.removeAll(true);
    const largeur = Math.min(130, 590 / Math.max(1, this.voyageurs.length));
    this.voyageurs.forEach((v, i) => {
      const x = 144 + largeur * (i + 0.5);
      const choisi = v === this.selection;
      const zone = this.place[v.id];
      const fond = this.add.rectangle(x, 476, largeur - 6, 90, choisi ? 0x6b4a22 : 0x3b2410)
        .setStrokeStyle(2, choisi ? 0xffe066 : zone ? 0x4f7a3a : 0x8a6a3a).setInteractive({ useHandCursor: true });
      fond.on('pointerdown', () => { this.selection = v; this.tout(); });
      this.cartes.add([fond,
        imageCorps(this, x, 470, v, 2.4),
        this.add.text(x, 474, v.nom.split(' ')[0], style(14, couleurNom(this.G, v.nom, true), { fontStyle: 'bold' })).setOrigin(0.5, 0),
        this.add.text(x, 490, zone ? '→ ' + ZONES[zone].nom.replace(/^(Les |La |L')/, '') : NIVEAUX_AVENTURIER[v.niveau].nom,
          style(12, zone ? '#b8e0a0' : '#c9b48a', { align: 'center', wordWrap: { width: largeur - 12 } })).setOrigin(0.5, 0)]);
    });
    if (!this.voyageurs.length) {
      this.cartes.add(this.add.text(440, 476, "Personne ne cherche l'aventure aujourd'hui : tes clients savent déjà où ils vont.",
        style(15, '#f3e6c8', { fontStyle: 'italic', wordWrap: { width: 580 } })).setOrigin(0.5));
    }
  }

  tout() {
    const v = this.selection;
    const restants = this.voyageurs.filter(x => !this.place[x.id]).length;
    if (!v) this.titre.setText('La carte de tes alentours');
    else if (this.planification) {
      this.titre.setText(restants ? `Où envoyer ${v.nom} ? (${NIVEAUX_AVENTURIER[v.niveau].nom}, ${NOMS_RACES[v.race] || v.race}) · encore ${restants} à placer`
        : 'Tout le monde a sa destination : à toi de préparer les sacs !');
    } else {
      this.titre.setText(`Où envoyer ${v.nom} ? (${NIVEAUX_AVENTURIER[v.niveau].nom}, ${NOMS_RACES[v.race] || v.race})`);
    }
    if (this.titre.width > 930) this.titre.setFontSize(15);
    this.dessinerBande();
    this.dessinerReperes();
    if (this.zoneChoisie) this.choisirZone(this.zoneChoisie);
  }

  // --- La bulle d'une zone ---

  choisirZone(cle) {
    const G = this.G;
    const v = this.selection;
    const z = ZONES[cle];
    this.zoneChoisie = cle;
    this.anneau.setVisible(true).setPosition(z.x, z.y);
    this.bulle.removeAll(true);
    const ouverte = zoneOuverte(G, cle);
    const w = 360;
    // On écrit d'abord le contenu (en haut à gauche), puis on mesure et on place la bulle.
    const contenu = this.add.container(0, 0);
    const fermer = this.add.text(w - 22, 0, '✕', style(14, '#c9b48a', { fontStyle: 'bold' })).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    fermer.on('pointerdown', () => { this.bulle.removeAll(true); this.anneau.setVisible(false); this.zoneChoisie = null; });
    let bas;
    if (!ouverte) {
      contenu.add(this.add.text(0, 0, 'Une contrée inconnue', style(15, '#f3d98a', { fontStyle: 'bold' })));
      // Ce qu'il manque pour l'ouvrir : la réputation (ou une découverte), et des retours réussis.
      const c = conditionsZone(G, cle);
      const lignes = [`Personne ne sait vraiment ce qu'il y a là-bas${z.camp === 'mal' ? ", dans les terres d'ombre" : z.camp === 'bien' ? ', dans les terres de lumière' : ''}. Pour l'ouvrir :`,
        `${c.reputation ? '✓' : '✗'} une réputation de ${z.reputation} (toi : ${arrondi(G.reputation)}), ou qu'un aventurier la découvre`];
      if ((G.armure || []).length < ARMURE.length) lignes.push("🛡 À son ouverture, la Confrérie t'enverra une pièce de l'armure.");
      if (c.besoin) lignes.push(`${c.faits >= c.besoin ? '✓' : '✗'} ${c.besoin} missions réussies dans des zones à ${z.danger - 1} étoile${z.danger > 2 ? 's' : ''} (${Math.min(c.faits, c.besoin)} / ${c.besoin})`);
      const texte = this.add.text(0, 24, lignes.join('\n'), style(14, '#f3e6c8', { wordWrap: { width: w - 24 }, lineSpacing: 3 }));
      contenu.add(texte);
      bas = texte.y + texte.height;
    } else {
      contenu.add(this.add.text(0, 0, `${z.nom}  ${'★'.repeat(z.danger)}`, style(14, '#f3d98a', { fontStyle: 'bold' })));
      const quetes = z.quetes.map(q => QUETES[q]);
      const dureeMin = Math.min(...quetes.map(q => q.duree[0]));
      const dureeMax = Math.max(...quetes.map(q => q.duree[1]));
      let ligne = `${dureeMin} à ${dureeMax} jours`;
      if (v) {
        const mult = BUTIN_PAR_DANGER[z.danger] / BUTIN_PAR_DANGER[1] * NIVEAUX_AVENTURIER[v.niveau].butin;
        const butinMin = Math.round(Math.min(...quetes.map(q => q.butin[0])) * mult);
        const butinMax = Math.round(Math.max(...quetes.map(q => q.butin[1])) * mult);
        ligne = `Butin espéré pour ${v.nom.split(' ')[0]} : ${butinMin} à ${butinMax} p. · ${ligne}`;
      }
      const texte = this.add.text(0, 22, `${z.description}\n${ligne}`, style(13, '#f3e6c8', { wordWrap: { width: w - 24 }, lineSpacing: 2 }));
      contenu.add(texte);
      // Les provisions qu'on y emporte souvent, sur leur propre rangée, avec ce que tu as en stock.
      const yIcones = texte.y + texte.height + 8;
      contenu.add(this.add.text(0, yIcones, 'Il faut souvent :', style(12, '#c9b48a', { fontStyle: 'italic' })));
      besoinsDeZone(cle).forEach((id, i) => {
        const enStock = G.stock[id] || 0;
        const gx = 118 + i * 58;
        contenu.add(this.add.rectangle(gx + 22, yIcones + 8, 54, 36, 0x3b2410).setStrokeStyle(1, 0x8a6a3a));
        contenu.add(this.add.image(gx + 12, yIcones + 8, iconeObjet(this, id)).setScale(2));
        contenu.add(this.add.text(gx + 30, yIcones + 8, `×${enStock}`, style(13, enStock ? '#b8e0a0' : '#f0a8a0', { fontStyle: 'bold' })).setOrigin(0, 0.5));
      });
      bas = yIcones + 30;
      if (v) {
        const refus = refusZone(G, v, cle);
        if (refus) {
          const t = this.add.text(w - 24, bas + 6, refus, style(13, '#f0a8a0', { fontStyle: 'italic', align: 'right', wordWrap: { width: w - 24 } })).setOrigin(1, 0);
          contenu.add(t);
          bas = t.y + t.height;
        } else {
          const envoyer = this.add.text(w - 24, bas + 6, `Envoyer ${v.nom.split(' ')[0]} ici ▶`,
            style(15, '#fff4dc', { fontStyle: 'bold', backgroundColor: '#4f7a3a', padding: { x: 8, y: 5 } })).setOrigin(1, 0).setInteractive({ useHandCursor: true });
          envoyer.on('pointerdown', () => this.envoyer(cle));
          contenu.add(envoyer);
          bas = envoyer.y + envoyer.height;
        }
      }
    }
    contenu.add(fermer);
    const h = bas + 20;
    const bx = Phaser.Math.Clamp(z.x + (z.x > 560 ? -w / 2 - 62 : w / 2 + 62), w / 2 + 18, 942 - w / 2);
    const by = Phaser.Math.Clamp(z.y, 54 + h / 2, 420 - h / 2);
    contenu.setPosition(bx - w / 2 + 12, by - h / 2 + 10);
    this.bulle.add(this.add.rectangle(bx, by, w, h, 0x2a1a10, 0.96).setStrokeStyle(2, 0xc9a227));
    this.bulle.add(contenu);
  }

  envoyer(cle) {
    const v = this.selection;
    if (!v) return;
    envoyerDans(this.G, v, cle);
    if (!this.planification) return this.fermer({ destination: cle });
    this.place[v.id] = cle;
    const entree = this.G.file.find(e => e.voyageur === v);
    if (entree) entree.planifie = true;
    // On passe au suivant qui n'a pas encore de destination.
    this.selection = this.voyageurs.find(x => !this.place[x.id]) || null;
    this.bulle.removeAll(true);
    this.anneau.setVisible(false);
    this.zoneChoisie = null;
    this.tout();
  }

  terminer() {
    if (!this.planification) return this.fermer({ annule: true });
    this.cameras.main.fadeOut(400);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Comptoir'));
  }

  fermer(donnees) {
    this.scene.stop();
    this.scene.resume('Comptoir', donnees);
  }
}

// Ouvrir le comptoir le matin : la file d'attente du jour se forme, et s'il y a des
// voyageurs qui cherchent l'aventure, on passe d'abord par la carte pour les placer.
// D'abord la façade du shop (sauf si on vient de la voir), puis la carte ou le comptoir.
function commencerJournee(scene, ouvrir = true, facade = true) {
  const G = window.GAME;
  if (ouvrir) ouvrirComptoir(G);
  const aPlacer = G.file.some(e => e.type === 'client' && !e.voyageur.queteId);
  const suite = aPlacer ? 'Carte' : 'Comptoir';
  scene.cameras.main.fadeOut(400);
  scene.cameras.main.once('camerafadeoutcomplete', () => scene.scene.start(facade ? 'Facade' : suite, facade ? { suite } : {}));
}
