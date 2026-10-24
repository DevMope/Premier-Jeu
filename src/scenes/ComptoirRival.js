// (v1.11, lot C-5, planches 40 v2 et 41 validées) Au comptoir : Lucien Belhomme vient se présenter, se pavaner ou se
// moquer ; le crieur annonce le mois des comptoirs en fin de file ; un client de passage file chez le voisin sous tes
// yeux ; la lettre du notaire quand sa boutique est à vendre. Et, pour le bandeau, le panneau du mois.
const RIVAL_BUSTE = { nom: 'Lucien Belhomme', race: 'humain', feminin: false, figurant: 'rivalA', prestige: true };
const CRIEUR_BUSTE = { nom: 'Le crieur', race: 'humain', feminin: false, figurant: 'crieur' };

// Le panneau « Le mois des comptoirs » (planche 41) : les deux barres, les jours qui restent, la pression
function panneauMoisDesComptoirs(scene, x, y, G = window.GAME) {
  const r = rivalDe(G), sc = scoreDuMois(G), max = Math.max(10, sc.toi, sc.lui) * 1.15;
  const P = scene.add.container(x, y);
  P.add(scene.add.image(0, 0, panneauHD(scene, 236, 214)).setScale(2));
  P.add(scene.add.text(0, -86, 'Le mois des comptoirs', style(15, '#5a0e0e', { fontStyle: 'bold' })).setOrigin(0.5));
  P.add(scene.add.text(0, -66, 'aventuriers revenus vainqueurs', style(11, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5));
  const ligne = (ly, nom, n, coul) => {
    const t = scene.add.text(-100, ly - 10, nom, style(12, '#3b2410', { fontStyle: 'bold' }));
    for (let k = 12; t.width > 190 && k >= 9; k--) t.setFontSize(k);
    P.add(t);
    P.add(scene.add.rectangle(-100, ly + 10, 160, 9, 0xcdb27a).setOrigin(0, 0.5));
    P.add(scene.add.rectangle(-100, ly + 10, Math.max(0, Math.min(160, 160 * n / max)), 9, coul).setOrigin(0, 0.5));
    P.add(scene.add.text(100, ly + 10, String(n), style(15, '#3b2410', { fontStyle: 'bold' })).setOrigin(1, 0.5));
  };
  ligne(-32, G.nomShop, sc.toi, 0x4a8a3a); ligne(10, RIVAL.boutique, sc.lui, 0x2a4a8a);
  const j = sc.joursRestants;
  P.add(scene.add.text(0, 52, `${j === 0 ? 'le crieur passe aujourd\'hui' : j === 1 ? 'le crieur passe demain' : `encore ${j} jours`} · pression ${r.pression}`, style(13, '#5a0e0e', { fontStyle: 'bold' })).setOrigin(0.5));
  const vols = RIVAL.vols[r.pression];
  P.add(scene.add.text(0, 76, `${vols < 1 ? 'un client de passage attiré tous les deux jours' : vols === 1 ? 'un client de passage attiré par jour' : `${vols} clients de passage attirés par jour`}\n${r.pression <= 1 ? 'gagne le mois : il ferme boutique' : 'gagne le mois : sa pression baisse'}`, style(10, r.pression <= 1 ? '#2f5a2a' : '#6b4a2a', { fontStyle: 'italic', align: 'center' })).setOrigin(0.5));
  return P;
}

// La lettre du notaire : la boutique d'à côté est à vendre (planche 41, 6). Dans n'importe quelle page.
function lettreDuNotaire(scene, suite) {
  const G = window.GAME, r = rivalDe(G), prix = prixRachat(G), et = Math.min(5, etoilesDe(G));
  r.notaireVu = true;
  const voile = scene.add.rectangle(480, 270, 960, 540, 0x0a0604, 0.55).setDepth(80).setInteractive();
  const L = scene.add.container(480, 262).setDepth(81);
  L.add(scene.add.image(0, 0, panneauHD(scene, 600, 400)).setScale(2));
  if (!scene.textures.exists('embleme_conseil')) creerEmblemesHD(scene);
  const sceau = scene.add.container(0, -152); sceau.add(scene.add.circle(0, 0, 19, 0x7a0e0e)); sceau.add(scene.add.circle(-1, -1, 16, 0xa81a18)); sceau.add(scene.add.image(0, 0, 'embleme_conseil').setScale(0.3).setTint(0x5a0606)); L.add(sceau);
  L.add(scene.add.text(0, -118, 'LA BOUTIQUE D’À CÔTÉ EST À VENDRE', style(19, '#5a0e0e', { fontStyle: 'bold' })).setOrigin(0.5));
  L.add(scene.add.text(0, -94, `Le notaire du Conseil · prix : ${prix} p. (${RIVAL.rachat.parEtoile} p. × ★${et})`, style(12, '#3b2410', { fontStyle: 'italic' })).setOrigin(0.5));
  const choix = (x, nom, l1, l2, coul) => { const c = scene.add.container(x, 10); c.add(scene.add.rectangle(0, 0, 250, 170, 0xf3e6c8).setStrokeStyle(3, coul)); c.add(scene.add.text(0, -66, nom, style(16, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5)); c.add(scene.add.text(0, -6, l1, style(12, '#3b2410', { wordWrap: { width: 226 }, align: 'center' })).setOrigin(0.5)); c.add(scene.add.text(0, 56, l2, style(11, '#6b4a2a', { fontStyle: 'italic', wordWrap: { width: 226 }, align: 'center' })).setOrigin(0.5)); L.add(c); };
  choix(-140, "L'orphelinat", `Tu l'offres aux orphelins de la Comté : +${RIVAL.orphelinat.reputation} de réputation, et des petits coursiers.`, 'Ils font tes courses au marché, et courent pour toi au comptoir.', 0x4a8a3a);
  choix(140, 'Le petit bar', 'Tu en feras ton petit bar : une salle à faire tourner le soir, ton équipe, tes musiciens.', 'Les installations sont chères, et les paies viennent en plus, chaque soir ouvert.', 0x8a5a2a);
  L.add(scene.add.text(0, 132, peutPayer(G, prix) ? 'Le premier terrain de ton quartier. Rien ne presse : le notaire attend ton offre.' : `Il te manque ${prix - Math.floor(G.argent)} pièces. Rien ne presse : le notaire attend ton offre (le soir, chez toi).`, style(12, peutPayer(G, prix) ? '#2f5a2a' : '#b02020', { fontStyle: 'bold italic', wordWrap: { width: 560 }, align: 'center' })).setOrigin(0.5));
  const objets = [voile, L];
  const fermer = () => { if (!voile.active) return; for (const o of objets) { if (o.fond) { o.fond.destroy(); o.label.destroy(); } else o.destroy(); } if (suite) suite(); };
  const acheter = (quoi) => {
    const res = racheterBoutique(G, quoi);
    if (!res.ok) { Son.jouer('refus'); return; }
    Son.jouer('pieces'); scene.cameras.main.flash(250, 255, 240, 160);
    fermer();
    if (typeof noterJournal === 'function') noterJournal(`rachat : ${quoi}`);
  };
  if (peutPayer(G, prix)) {
    const b1 = creerBouton(scene, 345, 428, 230, "Acheter : l'orphelinat", () => acheter('orphelinat')); b1.fond.setDepth(82); b1.label.setDepth(82.1); objets.push(b1);
    const b2 = creerBouton(scene, 615, 428, 230, 'Acheter : le petit bar', () => acheter('bar')); b2.fond.setDepth(82); b2.label.setDepth(82.1); objets.push(b2);   // (v1.16)
  }
  objets.push(scene.add.text(950, 530, '▶ clique pour refermer', style(12, '#d6bf98', { fontStyle: 'italic' })).setOrigin(1, 1).setDepth(82));
  L.setScale(0.2).setAlpha(0);
  scene.tweens.add({ targets: L, scale: 1, alpha: 1, duration: 420, ease: 'Back.easeOut' });
  Son.jouer('page');
  scene.time.delayedCall(500, () => { if (voile.active) voile.once('pointerdown', fermer); });
  return fermer;
}

Object.assign(CounterScene.prototype, {
  direRival(texte) { this.dire(texte, `${RIVAL.nom} — ${RIVAL.sous}`, RIVAL.nom); },

  // Lucien Belhomme au comptoir : il se présente le jour de l'ouverture, se pavane après un mois gagné, se moque
  // d'une commande scellée manquée. Tu ne lui réponds pas : tu le laisses parler, puis tu lui montres la porte.
  visiteRival(entree) {
    const G = this.G;
    this.titreCommande.setText(''); this.sousTitre.setText(''); this.texteSac.setText(''); this.texteChance.setText('');
    this.aideCommande.setVisible(false); this.boutonEscorte.setVisible(false);
    this.geste('hanche', 2600);
    const porte = () => this.bouton('Lui montrer la porte', () => { this.exprimer('neutre'); this.bouton('...', null); this.partirPar(FENETRE.x - 80); });
    if (entree.mode === 'ouverture') {
      this.direRival(REPLIQUES_RIVAL.ouverture[0]);
      this.bouton('Le laisser parler', () => { this.geste('salut', 1800); this.direRival(REPLIQUES_RIVAL.ouverture[1]); porte(); });
      return;
    }
    if (entree.mode === 'moquerie') { this.direRival(REPLIQUES_RIVAL.moquerie); return porte(); }
    const ombre = typeof jaugeCamp === 'function' && jaugeCamp(G) < 0 && Math.random() < 0.5;
    this.direRival(ombre ? REPLIQUES_RIVAL.pavaneOmbre : auHasard(REPLIQUES_RIVAL.pavane));
    porte();
  },

  // Le crieur, tout au bout de la file : les comptes du mois, et le panneau sur ton parchemin
  visiteCrieur() {
    const G = this.G, b = rivalDe(G).dernierMois;
    this.titreCommande.setText(''); this.sousTitre.setText(''); this.texteSac.setText(''); this.texteChance.setText('');
    this.aideCommande.setVisible(false); this.boutonEscorte.setVisible(false);
    Son.jouer('cloche');
    this.geste('salut', 1600);
    this.dire(texteDuCrieur(G), 'Le crieur — Le mois des comptoirs', 'Le crieur');
    if (b) {
      if (this.feuilleConseil) { this.feuilleConseil.destroy(); this.feuilleConseil = null; }
      const F = this.feuilleConseil = this.add.container(815, 135).setDepth(2.5);
      F.add(this.add.image(0, 0, panneauHD(this, 236, 214)).setScale(2));
      F.add(this.add.text(0, -86, 'Le mois des comptoirs', style(15, '#5a0e0e', { fontStyle: 'bold' })).setOrigin(0.5));
      F.add(this.add.text(0, -66, 'aventuriers revenus vainqueurs', style(11, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5));
      const max = Math.max(10, b.toi, b.lui) * 1.15;
      [[G.nomShop, b.toi, 0x4a8a3a, -32], [RIVAL.boutique, b.lui, 0x2a4a8a, 10]].forEach(([nom, n, coul, ly]) => {
        const t = this.add.text(-100, ly - 10, nom, style(12, '#3b2410', { fontStyle: 'bold' })); for (let k = 12; t.width > 190 && k >= 9; k--) t.setFontSize(k); F.add(t);
        F.add(this.add.rectangle(-100, ly + 10, 160, 9, 0xcdb27a).setOrigin(0, 0.5));
        F.add(this.add.rectangle(-100, ly + 10, Math.max(0, Math.min(160, 160 * n / max)), 9, coul).setOrigin(0, 0.5));
        F.add(this.add.text(100, ly + 10, String(n), style(15, '#3b2410', { fontStyle: 'bold' })).setOrigin(1, 0.5));
      });
      const verdict = b.ferme ? 'Il ferme boutique !' : b.gagne === 'toi' ? `Tu gagnes le mois : pression ${b.pressionAvant} → ${b.pression}` : b.gagne === 'lui' ? `Il gagne le mois : pression ${b.pressionAvant} → ${b.pression}` : 'Égalité : rien ne bouge';
      F.add(this.add.text(0, 56, verdict, style(13, b.gagne === 'toi' ? '#2f5a2a' : b.gagne === 'lui' ? '#b02020' : '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
      F.add(this.add.text(0, 80, b.ferme ? 'sa maison est à vendre chez le notaire' : `il attire ${RIVAL.vols[b.pression] < 1 ? 'un client tous les deux jours' : RIVAL.vols[b.pression] === 1 ? 'un client par jour' : RIVAL.vols[b.pression] + ' clients par jour'}`, style(11, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5));
    }
    this.bouton("Le remercier d'un signe", () => { this.bouton('...', null); this.partirPar(FENETRE.x - 80); });
  },

  // Un client de passage attiré par le paon : il hésite dans la file... puis file chez le voisin
  clientVole(entree) {
    const G = this.G, v = entree.voyageur;
    this.entree = null; this.voyageur = null;
    this.majFileAttente();
    this.perso.setVisible(false);
    const premier = this.fileSprites.shift();
    this.fileSprites.forEach((sprite, i) => { sprite.setVisible(!sprite.estPigeon); this.tweens.add({ targets: sprite, x: FILE.x - i * FILE.ecart, duration: 900, delay: 900, ease: 'Sine.easeInOut', onStart: () => sprite.estPigeon || pasDeMarche(this, sprite, 900) }); });
    // le paon qui fait signe depuis sa vitrine, en médaillon au coin de la fenêtre
    const mx = FENETRE.x + FENETRE.w - 48, my = FENETRE.y + 148, m = this.add.container(mx, my).setDepth(3.2).setScale(0);
    m.add(this.add.circle(0, 0, 46, 0xc9a227)); m.add(this.add.circle(0, 0, 42, 0x7aa0c8));
    const bu = this.add.image(mx, my + 60, textureBusteHD(this, RIVAL_BUSTE, 'content', { pose: 'salut' })).setOrigin(0.5, 1).setScale(1.1).setDepth(3.3).setAlpha(0);
    const msk = this.make.graphics().fillCircle(mx, my, 42); bu.setMask(msk.createGeometryMask());
    this.tweens.add({ targets: m, scale: 1, duration: 300, ease: 'Back.easeOut' });
    this.tweens.add({ targets: bu, alpha: 1, duration: 300 });
    this.raconter(`Dans la file, ${v.nom} hésite... puis court chez le voisin : Lucien Belhomme lui fait signe depuis sa vitrine. (Un client de moins aujourd'hui.)`, RIVAL.sous);
    const moins = this.add.text(FENETRE.x + FENETRE.w / 2, FENETRE.y + 130, '−1 client', style(16, '#ffdddd', { fontStyle: 'bold', stroke: '#5a0e0e', strokeThickness: 5 })).setOrigin(0.5).setDepth(3.4).setAlpha(0);
    this.tweens.add({ targets: moins, alpha: 1, y: FENETRE.y + 110, duration: 700, delay: 500, yoyo: true, hold: 900 });
    if (premier) {
      premier.setVisible(true).setFlipX(false);
      this.tweens.killTweensOf(premier);
      pasDeMarche(this, premier, 1400);
      this.tweens.add({ targets: premier, x: FENETRE.x + FENETRE.w + 60, duration: 1400, delay: 500, ease: 'Sine.easeIn', onComplete: () => premier.destroy() });
    }
    Son.jouer('pas');
    this.time.delayedCall(2600, () => {
      for (const o of [m, bu, moins]) if (o.active) o.destroy();
      msk.destroy();
      if (this.scene.isActive()) this.voyageurSuivant();
    });
  },
});
