// Le Marché des Mastres, chaque matin avant d'ouvrir le comptoir :
// quatre étals (épicerie, forge, apothicaire, tailleuse), le Bazar de Rosalie (les cadeaux), les enchères,
// le coin des jeux, le mendiant, et le crieur qui annonce les nouvelles du jour.
// La rue est plus large que l'écran : on la parcourt avec les flèches ◀ ▶.
const LARGEUR_MARCHE = 1700;
const DEPLACEMENT_RUE = 360;
// On clique sur un lieu pour l'ouvrir dans le panneau du bas.
class MarcheScene extends Phaser.Scene {
  constructor() { super('Marche'); }

  create() {
    const G = this.G = window.GAME;
    G.banniere = G.jour;
    this.cameras.main.fadeIn(500);

    // La rue du marché, plus large que l'écran : on la parcourt avec les flèches.
    this.monde = this.add.container(0, 0);
    const g = this.add.graphics();
    this.monde.add(g);
    dessinerComte(g, 0, 0, LARGEUR_MARCHE, 300, 0.05);
    this.monde.add(this.add.image(0, 250, pavesHD(this, LARGEUR_MARCHE, 50)).setOrigin(0).setScale(2));
    this.add.text(480, 22, `Le Marché des Mastres · matin du jour ${G.jour}`, style(24, '#fff4dc', { fontStyle: 'bold', stroke: '#2a1a10', strokeThickness: 5 })).setOrigin(0.5).setDepth(5);

    // Les étals, les enchères, les jeux et le mendiant
    this.positions = { mendiant: [70, 'lieu'], bazar: [1030, 'lieu'], encheres: [1220, 'lieu'], jeux: [1410, 'lieu'], crieur: [1595, 'lieu'] };
    Object.entries(MARCHANDS).forEach(([cle, m], i) => {
      this.positions[cle] = [260 + i * 190, 'etal'];
      this.creerEtal(cle, m, 260 + i * 190);
    });
    this.creerSurbrillance();
    this.creerLieu(70, 'perso_mendiant', 'Le mendiant', () => this.ouvrirMendiant(), { angle: -4, echelle: 4.5 });
    // L'estrade des enchères, avec son crieur
    const estrade = this.add.graphics();
    estrade.fillStyle(0x6b4423).fillRect(1175, 225, 90, 22);
    estrade.fillStyle(0x7a1a1a).fillRect(1185, 120, 70, 14);
    // La petite échoppe à rayures vertes du Bazar de Rosalie
    this.monde.add(this.add.image(1030, 244, etalHD(this, 0x4f8a3a)).setOrigin(0.5, 1).setScale(2));
    // L'estrade du crieur
    estrade.fillStyle(0x5a3a1a).fillRect(1560, 228, 70, 18);
    this.monde.add(estrade);
    this.creerLieu(1030, 'perso_hobbit', 'Le Bazar de Rosalie', () => this.ouvrirBazar(), { echelle: 4.5 });
    Object.keys(CADEAUX).slice(0, 4).forEach((id, i) => this.monde.add(this.add.image(990 + i * 28, 200, id).setScale(2.5)));
    this.creerLieu(1220, 'perso_humain', 'Les enchères', () => this.ouvrirEncheres(), { echelle: 4.5 }).setY(228);
    this.creerLieu(1410, 'perso_gobelin', 'Le coin des jeux', () => this.ouvrirJeux(), { echelle: 4.5 });
    this.creerLieu(1595, 'perso_garde', 'Le crieur', () => this.ouvrirCrieur(), { echelle: 4.5 }).setY(230);
    this.creerFlechesRue();

    // Le panneau du bas et la barre d'infos
    this.add.image(480, 388, panneauHD(this, 940, 168)).setScale(2);
    this.add.rectangle(480, 510, 960, 60, 0x2a1a10);
    this.texteInfos = this.add.text(20, 498, '', style(13, '#f3e6c8', { lineSpacing: 4 }));
    creerBouton(this, 640, 510, 170, 'Rentrer chez toi', () => this.rentrer());
    creerBouton(this, 840, 510, 210, 'Ouvrir le comptoir', () => this.ouvrir());

    this.ouvrirEtal('gedeon');
    this.time.delayedCall(700, () => conseilGarrick(this, 'marche'));
    afficherStatutSauvegarde(this, 940, 46, 1);
    // Les commandes prévues, qu'on déroule ou referme
    this.commandesOuvertes = false;
    this.boutonCommandes = this.add.text(16, 46, '', style(14, '#fff4dc', { fontStyle: 'bold', backgroundColor: '#3b2410', padding: { x: 10, y: 5 } }))
      .setDepth(21).setInteractive({ useHandCursor: true });
    this.boutonCommandes.on('pointerdown', () => this.basculerCommandes());
    this.majBoutonCommandes();

    // Le crieur annonce la première nouvelle du jour (clic : toutes les nouvelles).
    if (G.gazette && G.gazette.jour === G.jour && G.gazette.lignes.length) {
      const nouvelle = this.add.text(480, 82, '📯 Oyez ! ' + G.gazette.lignes[0], style(12, '#3b2410', {
        fontStyle: 'italic', backgroundColor: '#f3e6c8', padding: { x: 8, y: 4 }, wordWrap: { width: 760 }, align: 'center' }))
        .setOrigin(0.5, 0).setDepth(5).setInteractive({ useHandCursor: true });
      nouvelle.on('pointerdown', () => { nouvelle.destroy(); this.ouvrirCrieur(); });
      this.tweens.add({ targets: nouvelle, alpha: 0, delay: 9000, duration: 800, onComplete: () => nouvelle.destroy() });
    }

    // Les nouvelles de l'atelier (une réparation terminée cette nuit)
    if (G.nouvellesAtelier.length) {
      const t = this.add.text(480, 52, G.nouvellesAtelier.join(' '), style(13, '#fff4dc', { fontStyle: 'bold', backgroundColor: '#3b2410', padding: { x: 8, y: 3 } })).setOrigin(0.5).setDepth(5);
      this.tweens.add({ targets: t, alpha: 0, delay: 6000, duration: 800 });
    }
  }

  // Les flèches ◀ ▶ pour se déplacer dans la rue du marché.
  creerFlechesRue() {
    this.flechesRue = [[-1, 26, '◀'], [1, 934, '▶']].map(([sens, x, texte]) => {
      const fond = this.add.circle(x, 165, 22, 0x3b2410, 0.85).setStrokeStyle(2, 0xc9a227).setDepth(6).setInteractive({ useHandCursor: true });
      const t = this.add.text(x, 165, texte, style(20, '#f3d98a', { fontStyle: 'bold' })).setOrigin(0.5).setDepth(6);
      fond.on('pointerdown', () => this.deplacer(this.monde.x - sens * DEPLACEMENT_RUE));
      this.tweens.add({ targets: [fond, t], x: x + sens * 4, duration: 500, yoyo: true, repeat: -1 });
      return { sens, fond, t };
    });
    this.majFlechesRue();
  }

  // Fait glisser la rue jusqu'à une position (bornée aux deux bouts de la rue).
  deplacer(x) {
    const cible = Phaser.Math.Clamp(x, 960 - LARGEUR_MARCHE, 0);
    this.tweens.add({ targets: this.monde, x: cible, duration: 450, ease: 'Sine.easeInOut', onComplete: () => this.majFlechesRue() });
  }

  majFlechesRue() {
    for (const f of this.flechesRue) {
      const visible = f.sens < 0 ? this.monde.x < 0 : this.monde.x > 960 - LARGEUR_MARCHE;
      f.fond.setVisible(visible);
      f.t.setVisible(visible);
    }
  }

  // La flèche qui sautille au-dessus du lieu qu'on regarde.
  creerSurbrillance() {
    const f = this.add.graphics();
    f.fillStyle(0xffe066).fillTriangle(-12, -10, 12, -10, 0, 8);
    f.lineStyle(2, 0x3b2410).strokeTriangle(-12, -10, 12, -10, 0, 8);
    this.flecheLieu = this.add.container(0, 0, [f]).setVisible(false);
    this.tweens.add({ targets: f, y: 8, duration: 450, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.monde.add(this.flecheLieu);
  }

  montrer(cle) {
    const [x, type] = this.positions[cle];
    const etal = type === 'etal';
    this.flecheLieu.setVisible(true).setPosition(x, etal ? 46 : 128);
    // Si le lieu est hors de l'écran, la rue glisse jusqu'à lui.
    const aEcran = x + this.monde.x;
    if (aEcran < 110 || aEcran > 850) this.deplacer(480 - x);
  }

  // Un étal : auvent rayé aux couleurs du marchand, comptoir, marchand derrière.
  creerEtal(cle, m, x) {
    const avant = this.children.list.length;
    // L'étal (poteaux et auvent), le marchand derrière, puis la table par-dessus lui
    const etal = etalHD(this, m.couleur);
    this.add.image(x, 244, etal).setOrigin(0.5, 1).setScale(2);
    imageCorps(this, x, 205, { nom: m.nom, race: m.race, feminin: /Mère|Hilda|Rosalie/.test(m.nom), niveau: 'aguerri' }, 5);
    this.add.image(x, 244, etal).setOrigin(0.5, 1).setScale(2).setCrop(0, 56, 88, 26);
    Object.keys(this.G.etals[cle] || {}).slice(0, 4).forEach((id, i) => this.add.image(x - 54 + i * 36, 192, iconeObjet(this, id)).setOrigin(0.5, 1).setScale(2));
    this.add.text(x, 254, m.nom, style(13, couleurNom(this.G, m.nom, true), { fontStyle: 'bold', stroke: '#2a1a10', strokeThickness: 4 })).setOrigin(0.5);
    this.add.text(x, 272, m.metier, style(11, '#fff4dc', { stroke: '#2a1a10', strokeThickness: 3 })).setOrigin(0.5);
    const zone = this.add.rectangle(x, 160, 170, 140, 0xffffff, 0).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => this.ouvrirEtal(cle));
    // Tout ce qu'on vient de créer appartient à la rue (qui glisse).
    this.monde.add(this.children.list.slice(avant));
  }

  creerLieu(x, texture, nom, action, { tint = 0xffffff, angle = 0, echelle = 5 }) {
    const avant = this.children.list.length;
    const perso = imageCorps(this, x, 245, texture.replace('perso_', ''), echelle).setTint(tint).setAngle(angle);
    this.add.text(x, 262, nom, style(13, '#fff4dc', { fontStyle: 'bold', stroke: '#2a1a10', strokeThickness: 4 })).setOrigin(0.5);
    const zone = this.add.rectangle(x, 200, 110, 120, 0xffffff, 0).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', action);
    this.monde.add(this.children.list.slice(avant));
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
    Sauvegarde.planifier(G, 'Marche');
    const p = prevision(G, G.jour);
    this.texteInfos.setText(`Bourse : ${G.argent} pièces · Réserve : ${stockTotal(G)}/${G.capacite} · Fer ${G.materiaux.fer} · Cuir ${G.materiaux.cuir}\n` +
      `Aujourd'hui : entre ${p.min} et ${p.max} clients attendus${p.annonces ? `, + ${p.annonces} annoncé${p.annonces > 1 ? 's' : ''} par lettre` : ''} (un stock varié en attire plus)`);
  }

  message(texte, couleur = '#3b2410') {
    if (this.texteMessage) this.texteMessage.destroy();
    this.texteMessage = this.add.text(480, 460, texte, style(13, couleur, { fontStyle: 'bold' })).setOrigin(0.5);
    this.contenu.add(this.texteMessage);
  }

  // --- Les commandes prévues (lettres acceptées) ---

  majBoutonCommandes() {
    const n = this.G.annonces.filter(a => a.acceptee && a.jour >= this.G.jour).length;
    this.boutonCommandes.setText(`Commandes prévues (${n}) ${this.commandesOuvertes ? '▲' : '▼'}`);
  }

  basculerCommandes() {
    this.commandesOuvertes = !this.commandesOuvertes;
    this.majBoutonCommandes();
    if (this.panneauCommandes) this.panneauCommandes.destroy();
    this.panneauCommandes = null;
    if (this.commandesOuvertes) this.creerPanneauCommandes();
  }

  creerPanneauCommandes() {
    const G = this.G;
    const c = this.panneauCommandes = this.add.container(0, 0).setDepth(20);
    c.add(this.add.rectangle(480, 178, 940, 240, 0xead9b0, 0.97).setStrokeStyle(3, 0x8a6a3a).setInteractive());

    // À gauche : les commandes, jour par jour
    const lettres = G.annonces.filter(a => a.acceptee && a.jour >= G.jour).sort((a, b) => a.jour - b.jour);
    const enAttente = G.annonces.filter(a => !a.acceptee).length;
    const lignes = [];
    let jour = null;
    for (const a of lettres) {
      if (a.jour !== jour) {
        jour = a.jour;
        lignes.push({ texte: jour === G.jour ? `Aujourd'hui (jour ${jour})` : jour === G.jour + 1 ? `Demain (jour ${jour})` : `Jour ${jour}`, titre: true });
      }
      lignes.push({ texte: `• ${a.voyageur.nom} : ${commandeEnTexte(a.voyageur)}` });
    }
    if (!lignes.length) lignes.push({ texte: 'Aucune commande acceptée pour les jours à venir.' });
    if (enAttente) lignes.push({ texte: `(+ ${enAttente} lettre${enAttente > 1 ? 's' : ''} sans réponse : à accepter ou refuser le soir)`, discret: true });
    c.add(this.add.text(220, 66, 'Les commandes reçues par lettre', style(15, '#3b2410', { fontStyle: 'bold' })));
    lignes.slice(0, 11).forEach((l, i) => c.add(this.add.text(30, 94 + i * 17, l.texte,
      style(l.titre ? 13 : 12, l.discret ? '#8a6a4a' : '#3b2410', { fontStyle: l.titre ? 'bold' : l.discret ? 'italic' : 'normal' }))));
    if (lignes.length > 11) c.add(this.add.text(30, 94 + 11 * 17, `+ ${lignes.length - 11} lignes...`, style(11, '#8a6a4a')));

    // À droite : le total à prévoir, comparé à ta réserve
    const x0 = 560;
    c.add(this.add.text(x0, 70, 'Total à prévoir', style(15, '#3b2410', { fontStyle: 'bold' })));
    [['auj.', 175], ['total', 228], ['tu as', 268]].forEach(([t, dx]) =>
      c.add(this.add.text(x0 + dx, 78, t, style(11, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5)));
    const aujourdhui = totalCommandes(G, G.jour, G.jour);
    const toutes = totalCommandes(G);
    const ids = Object.keys(ITEMS).filter(id => toutes[id]);
    if (!ids.length) c.add(this.add.text(x0, 100, 'Rien à prévoir pour l\'instant.', style(12, '#6b4a2a')));
    ids.forEach((id, i) => {
      const y = 104 + i * 22;
      const manque = toutes[id] - G.stock[id];
      c.add(this.add.image(x0 + 10, y, id).setScale(2.5));
      c.add(this.add.text(x0 + 28, y, ITEMS[id].nom, style(13, '#3b2410')).setOrigin(0, 0.5));
      c.add(this.add.text(x0 + 175, y, String(aujourdhui[id] || 0), style(13, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
      c.add(this.add.text(x0 + 228, y, String(toutes[id]), style(13, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
      c.add(this.add.text(x0 + 268, y, String(G.stock[id]), style(13, '#3b2410')).setOrigin(0.5));
      c.add(this.add.text(x0 + 300, y, manque > 0 ? `il en manque ${manque}` : 'OK', style(12, manque > 0 ? '#a03030' : '#2f6a2a', { fontStyle: 'bold' })).setOrigin(0, 0.5));
    });
    c.add(this.add.text(x0, 280, 'Les clients imprévus ne sont pas comptés : garde un peu de marge !', style(11, '#6b4a2a', { fontStyle: 'italic' })));
  }

  // --- Un étal ---

  ouvrirEtal(cle) {
    const G = this.G;
    this.montrer(cle);
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
        if (this.commandesOuvertes) { this.panneauCommandes.destroy(); this.creerPanneauCommandes(); }
        this.message(r.message || `Acheté : ${nomObjet(id)}.`);
      });
      if (o.qte <= 0 || !peutPayer(G, prixMarchand(G, cle, id))) { b.fond.setAlpha(0.5); b.label.setAlpha(0.5); }
    });
  }

  // --- Les enchères : on choisit jusqu'à 3 objets, qui forment un lot ---

  ouvrirEncheres() {
    const G = this.G;
    this.montrer('encheres');
    const c = this.panneau('Les enchères', 'Lord Pommeroy, Dame Ysaline, Gros Bob et Thrain Fendroc se disputent tes objets');
    if (G.encheresJour === G.jour) {
      c.add(this.add.text(30, 360, "La vente du jour est terminée. Reviens demain avec d'autres objets !", style(14, '#3b2410')));
      return;
    }
    const dispo = G.tresors.filter(t => !t.reparation);
    if (!dispo.length) {
      c.add(this.add.text(30, 352, "Tu n'as aucun objet à vendre.\nRachète des objets aux aventuriers à la fin de leur récit, et répare-les à l'atelier (le soir).",
        style(14, '#3b2410', { lineSpacing: 4 })));
      return;
    }
    this.lot = this.lot ? this.lot.filter(t => dispo.includes(t)) : [];
    c.add(this.add.text(30, 336, `Clique sur 1 à ${OBJETS_PAR_LOT} objets pour former un lot. Un lot de la même catégorie attire les collectionneurs.`, style(12, '#6b4a2a', { fontStyle: 'italic' })));
    dispo.slice(0, 8).forEach((t, i) => {
      const x = 30 + (i % 2) * 260;
      const y = 362 + Math.floor(i / 2) * 26;
      const choisi = this.lot.includes(t);
      const fond = this.add.rectangle(x + 125, y, 250, 24, choisi ? 0xc9a046 : 0xd8c498).setStrokeStyle(1, 0x8a6a3a).setInteractive({ useHandCursor: true });
      fond.on('pointerdown', () => {
        if (choisi) this.lot = this.lot.filter(x => x !== t);
        else if (this.lot.length < OBJETS_PAR_LOT) this.lot.push(t);
        this.ouvrirEncheres();
      });
      c.add([fond, this.add.image(x + 12, y, 'tr_' + t.categorie).setScale(2),
        this.add.rectangle(x + 246, y, 8, 20, ETATS[t.etat].couleur),
        this.add.text(x + 26, y, `${t.nom} · ${estRestaure(t) ? 'Restauré ★' : ETATS[t.etat].nom} · ~${valeurTresor(t)} p.`, style(11, ETATS[t.etat].texte, { fontStyle: 'bold' })).setOrigin(0, 0.5)]);
    });
    const estimation = this.lot.reduce((s, t) => s + valeurTresor(t), 0);
    c.add(this.add.text(560, 340, this.lot.length ? `Lot de ${this.lot.length} objet${this.lot.length > 1 ? 's' : ''} · estimé ~${estimation} p.` : 'Aucun objet choisi',
      style(14, '#3b2410', { fontStyle: 'bold' })));
    if (this.lot.length) this.bouton(c, 830, 342, 170, 'Mettre aux enchères', () => this.vendre());
  }

  vendre() {
    const G = this.G;
    const lot = this.lot;
    this.lot = [];
    const r = vendreAuxEncheres(G, lot);
    const c = this.panneau('Les enchères', 'La vente commence !');
    c.add(this.add.text(30, 345, `Le lot : ${lot.map(t => t.nom).join(', ')} (estimé ~${r.estimation} p.)`, style(13, '#3b2410', { fontStyle: 'bold' })));
    // Les enchérisseurs, avec leur bulle
    const bulles = {};
    ENCHERISSEURS.forEach((e, i) => {
      const x = 120 + i * 200;
      c.add(imageCorps(this, x, 440, { nom: e.nom, race: e.race, niveau: 'veteran' }, 3));
      c.add(this.add.text(x, 444, e.nom, style(11, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5, 0));
      bulles[e.nom] = this.add.text(x + 20, 385, '', style(14, '#fff4dc', { fontStyle: 'bold', backgroundColor: '#3b2410', padding: { x: 6, y: 3 } })).setOrigin(0, 0.5);
      c.add(bulles[e.nom]);
    });
    const actuel = this.add.text(930, 345, '', style(14, '#a03030', { fontStyle: 'bold' })).setOrigin(1, 0);
    c.add(actuel);
    r.deroule.forEach((b, i) => this.time.delayedCall(400 + i * 380, () => {
      Object.values(bulles).forEach(t => t.setAlpha(0.35));
      bulles[b.nom].setText(`${b.montant} p. !`).setAlpha(1);
      this.tweens.add({ targets: bulles[b.nom], scale: { from: 1.3, to: 1 }, duration: 200 });
      actuel.setText(`Enchère : ${b.montant} p.`);
    }));
    this.time.delayedCall(700 + r.deroule.length * 380, () => {
      if (!r.gagnant) return this.message("Personne n'a enchéri... Tes objets te reviennent.", '#a03030');
      this.message(`Adjugé ! ${r.gagnant.nom} remporte le lot pour ${r.prix} pièces.`, '#2f6a2a');
      this.majInfos();
    });
  }

  // --- Le mendiant ---

  ouvrirMendiant() {
    const G = this.G;
    this.montrer('mendiant');
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

  // --- Le Bazar de Rosalie : les cadeaux ---

  ouvrirBazar() {
    const G = this.G;
    this.montrer('bazar');
    const c = this.panneau('Le Bazar de Rosalie', 'Un cadeau par client et par jour · chacun ses goûts, à toi de les découvrir');
    c.add(this.add.text(30, 340, "« Un petit cadeau, et la chance leur sourit ! Mais attention : un nain n'aime pas ce qu'aime un elfe. »",
      style(12, '#6b4a2a', { fontStyle: 'italic' })));
    Object.entries(CADEAUX).forEach(([id, cad], i) => {
      const x = 40 + (i % 2) * 460;
      const y = 372 + Math.floor(i / 2) * 26;
      c.add(this.add.image(x, y, id).setScale(2.4));
      c.add(this.add.text(x + 20, y, `${cad.nom} · ${cad.prix} p.`, style(13, '#3b2410', { fontStyle: 'bold' })).setOrigin(0, 0.5));
      c.add(this.add.text(x + 280, y, `tu en as ${G.cadeaux[id] || 0}`, style(11, '#6b4a2a')).setOrigin(0, 0.5));
      this.bouton(c, x + 390, y, 70, 'Acheter', () => {
        const erreur = acheterCadeau(G, id);
        this.ouvrirBazar();
        this.message(erreur || `${cad.nom} : dans ton tiroir à cadeaux, au comptoir.`, erreur ? '#a03030' : '#2f6a2a');
      });
    });
  }

  // --- Le crieur : les nouvelles du jour ---

  ouvrirCrieur() {
    const G = this.G;
    this.montrer('crieur');
    const c = this.panneau('Le crieur', 'Les nouvelles du jour, vraies ou presque');
    const lignes = G.gazette && G.gazette.jour === G.jour ? G.gazette.lignes : ['Rien de neuf aujourd\'hui. Le crieur s\'ennuie.'];
    const actifs = evenementsActifs(G).map(e => EVENEMENTS[e.id].nouvelle);
    c.add(this.add.text(30, 344, ['📯 Oyez, oyez !', ...lignes.map(l => '• ' + l),
      ...(actifs.length ? ['', 'En ce moment : ' + actifs.join(' · ')] : [])].join('\n'),
      style(13, '#3b2410', { wordWrap: { width: 890 }, lineSpacing: 4 })));
  }

  // --- Le coin des jeux : les dés et le bonneteau ---

  ouvrirJeux() {
    const G = this.G;
    this.montrer('jeux');
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

  // Repasser chez soi avant d'ouvrir : réserve, atelier, bureau, banque.
  rentrer() {
    Sauvegarde.maintenant(this.G, 'Maison');
    this.cameras.main.fadeOut(300);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Nuit', { matin: true }));
  }

  ouvrir() {
    // On sauvegarde avant que la file d'attente du jour se forme.
    Sauvegarde.maintenant(this.G, 'Marche');
    commencerJournee(this);
  }
}
