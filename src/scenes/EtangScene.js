// (v1.64, planche 89 v6/v7, retours du joueur sur le chantier 1) Au bout de la route du Vieux Moulin, le jour : l'étang,
// le moulin et sa roue, et la cabane de Barnabé Goujon, à part, au bord de l'eau (elle a quitté la place des Mastres). Le
// décor est celui de la pêche et de l'aventure du Moulin (construireMoulin, de jour) ; on arrive à pied par la route de
// la place, après le pont, et on marche le long du bief (◀ ▶, ou un clic au sol). La cabane ouvre Barnabé : ses cannes, le
// carnet, la pêche sur le ponton (PecheScene, qui revient ici). Pour repartir : à l'ouest, la route de la place.
const ETANG = { cabane: 2186, arrivee: 1330, ouest: 1290, est: PLACES_MOULIN.ponton + 250, bord: 1250, vitesse: 0.32 };

class EtangScene extends Phaser.Scene {
  constructor() { super('Etang'); }

  init(data) {
    this.depuis = (data && data.depuis) || 'place';
    this.sys.settings.data = {};
    // (Phaser garde la scène d'une visite à l'autre : on repart de zéro)
    this.fini = false; this.sortie = false; this.cible = null; this.apres = null; this.panneauC = null; this.entree = null; this.pas = 0;
  }

  create() {
    const G = this.G = window.GAME, E = ETANG;
    exclureScenes(this, 'Marche', 'Peche');
    creerHalo(this); creerMoulinHD(this); creerFumeeHD(this);
    this.r = construireMoulin(this, { jour: true });
    this.cameras.main.setBounds(E.bord, 0, LARGEUR_MOULIN - E.bord, 540);
    // (v1.65, façon Pokémon : la vue se rouvre aussi vite qu'elle s'est fermée, villeQuartiers.js)
    if (typeof ouvrirDuNoir === 'function') ouvrirDuNoir(this, 500); else this.cameras.main.fadeIn(500);
    // la cabane de Barnabé, sur son assise de pierre, au bord de l'étang (le dessin de la planche 71 v2), à l'échelle du chemin
    this.creerCabane();
    // JeuneGoy : il arrive par la route de la place (ou revient du ponton)
    textureJoueur(this, G);
    // (v1.65, façon Pokémon : déjà posé au bout de la route, après le pont, tourné vers l'étang, il fait un pas)
    const x0 = this.depuis === 'peche' ? PLACES_MOULIN.ponton + 120 : E.arrivee - (typeof PAS_ARRIVEE !== 'undefined' ? PAS_ARRIVEE : 48);
    this.heros = this.add.image(x0, SOL_PROMENADE, textureJoueur(this, G)).setOrigin(0.5, 1).setScale(echelleJoueur(7.5)).setDepth(8.5).setFlipX(this.depuis === 'peche');
    if (this.depuis !== 'peche') { this.entree = true; this.cible = E.arrivee; }
    this.cameras.main.scrollX = Phaser.Math.Clamp(x0 - 480, E.bord, LARGEUR_MOULIN - 960);
    this.creerInterface();
    this.input.on('pointerdown', (p, sous) => { if (!sous.length && !this.panneauC && !this.fini && !this.sortie && !this.entree && p.worldY > 300) this.allerVers(p.worldX); });
    this.touches = this.input.keyboard ? this.input.keyboard.createCursorKeys() : null;
    if (this.input.keyboard) this.input.keyboard.on('keydown-ESC', () => { if (this.panneauC) this.fermerPanneau(); });
    if (typeof Son !== 'undefined' && Son.nature && typeof saisonDe === 'function') { Son.nature(true, { saison: saisonDe(G), volume: 0.6 }); this.events.once('shutdown', () => Son.nature(false)); }
    this.events.once('shutdown', () => { this.panneauC = null; });
  }

  // La cabane : ses objets sont ceux de l'ancienne cabane du marché (poserCabanePecheur), mis dans un conteneur à l'échelle
  // du chemin (×1,25 : Barnabé est un hobbit, un peu plus petit que JeuneGoy), posé par sa base sur le sol ; le nom gravé sur
  // la planche de rive
  creerCabane() {
    const X = ETANG.cabane, k = 1.25;
    creerDecorPlaceHD(this); creerLieuxMarcheHD(this);   // (les tonneaux, les cagettes)
    const avant = this.children.list.length;
    poserCabanePecheur(this, 0);
    const objets = this.children.list.slice(avant), c = this.add.container(X, SOL_MOULIN + 4 - 256 * k).setScale(k).setDepth(2.6);
    c.add(objets);
    const cab = objets.find(o => o.texture && o.texture.key === 'cabanePecheurHD'), yr = cab.y - 192 + 23 * 2;
    c.add(this.add.image(0, yr, plancheRiveHD(this, 88, 12)).setOrigin(0.5, 0).setScale(2));
    poserLettrage(this, c, 0, yr + 12, 'La cabane de Barnabé', { police: 'Alegreya', graisse: 900, taille: 16, couleur: '#1e1006', fond: BOIS_CLAIR_NOM, genre: 'grave', largeur: 164, hauteur: 21, lignesMax: 1, ...contrasteLettrage('#1e1006', BOIS_CLAIR_NOM) });
    // (Barnabé respire, derrière son comptoir ; avant son ouverture, la cabane est close et l'écriteau le dit)
    const barnabe = objets.find(o => o.texture && /^corps/.test(o.texture.key)), ouvert = lieuOuvert(this.G, 'peche');
    if (barnabe && ouvert) this.tweens.add({ targets: barnabe, scaleY: barnabe.scaleY * 1.015, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    if (!ouvert) { if (barnabe) barnabe.setVisible(false); c.add(ecriteauRue(this, 0, 196, `Ouverture le jour ${OUVERTURE_LIEUX.peche}`, { taille: 10 })); }
    const zone = this.add.rectangle(X, SOL_MOULIN - 130, 230, 250, 0xffffff, 0).setDepth(8.6).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => { if (this.panneauC || this.fini || this.sortie || this.entree) return;
      this.allerVers(X, () => (lieuOuvert(this.G, 'peche') ? this.ouvrirBarnabe() : this.dire(`La cabane est close. Sur l’écriteau : « Barnabé Goujon, pêcheur. Ouverture le jour ${OUVERTURE_LIEUX.peche}. »`))); });
    this.cabane = c;
  }

  creerInterface() {
    const G = this.G, fixe = (o, d = 30) => o.setScrollFactor(0).setDepth(d);
    fixe(this.add.text(480, 22, `L’étang du Vieux Moulin · jour ${G.jour}`, style(22, '#fff4dc', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 5 })).setOrigin(0.5));
    fixe(this.add.text(480, 48, '◀ ▶ ou clique au sol pour marcher · la cabane de Barnabé · à l’ouest, la route de la place', style(12, '#fff4dc', { fontStyle: 'italic', stroke: '#1a0e06', strokeThickness: 3 })).setOrigin(0.5));
    this.bulle = fixe(this.add.text(480, 78, '', style(14, '#3b2410', { fontStyle: 'italic', backgroundColor: '#ead9b0', padding: { x: 10, y: 6 }, wordWrap: { width: 640 }, align: 'center' })).setOrigin(0.5, 0).setVisible(false));
    const b = creerBouton(this, 150, 505, 250, '◀ La place des Mastres', () => this.repartir()); fixe(b.fond); fixe(b.label);
    this.boutonsBas = [b];
  }

  dire(texte) {
    this.bulle.setText(texte).setVisible(true).setAlpha(1);
    this.tweens.killTweensOf(this.bulle);
    this.tweens.add({ targets: this.bulle, alpha: 0, delay: 4000, duration: 600 });
  }

  allerVers(x, apres = null) { this.cible = Phaser.Math.Clamp(x, ETANG.ouest - 30, ETANG.est); this.apres = apres; }

  // Repartir vers la place : à pied jusqu'au bord de la vue, à l'ouest ; l'écran tombe au noir (vite, façon Pokémon :
  // villeQuartiers.js) pendant qu'il continue de marcher sur la route
  repartir() {
    if (this.fini || this.sortie) return;
    if (this.panneauC) this.fermerPanneau();
    this.sortie = true; this.entree = null;
    this.cible = Math.min(this.heros.x - 1, ETANG.bord + 20);   // (le bord de la vue)
    this.apres = () => {
      if (this.fini) return; this.fini = true;
      this.cible = ETANG.bord - 60;
      if (typeof allerDansLaVille === 'function') return allerDansLaVille(this, { scene: 'Marche', donnees: { depuis: 'etang' }, genre: 'bord' });
      Sauvegarde.maintenant(this.G, 'Marche');
      this.cameras.main.fadeOut(400); this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Marche', { depuis: 'etang' }));
    };
  }

  // --- Barnabé : la première fois il se présente ; ensuite ses cannes, ton niveau, le carnet, et le ponton ---
  panneau(titre, sousTitre) {
    this.fermerPanneau();
    const c = this.panneauC = this.add.container(0, 0).setScrollFactor(0).setDepth(40);
    c.add(this.add.rectangle(480, 270, 960, 540, 0x000000, 0.001).setInteractive());   // (le décor ne reçoit plus les clics)
    c.add(this.add.image(480, 388, panneauHD(this, 936, 200)).setScale(2));
    c.add(this.add.text(30, 300, titre, style(17, '#3b2410', { fontStyle: 'bold' })));
    c.add(this.add.text(930, 302, sousTitre, style(12, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(1, 0));
    this.boutonPanneau(842, 280, 150, 'Partir (Échap)', () => this.fermerPanneau());
    return c;
  }
  boutonPanneau(x, y, l, texte, fn) {
    const b = creerBouton(this, x, y, l, texte, () => { Son.jouer('clic'); fn(); });
    for (const o of [b.fond, b.label]) { o.setScrollFactor(0); this.panneauC.add(o); }
    return b;
  }
  fermerPanneau() { if (this.panneauC) { this.panneauC.destroy(); this.panneauC = null; } }

  ouvrirBarnabe() {
    const G = this.G, p = etatPeche(G);
    this.heros.setFlipX(false);
    const c = this.panneau('Barnabé Goujon', 'Le pêcheur de la Comté · cannes, poissons, et l’étang du Moulin');
    if (!p.barnabe) {
      const pages = ["« Tiens, un nouveau visage ! Barnabé Goujon, pêcheur depuis que j'ai des pieds poilus. Tu veux apprendre ? Une canne de roseau, vingt pièces, et je te montre. »",
        "« L'étang du Moulin, le voilà. À l'aube, ça mord : tanches et carpes. Le jour, perches et brochets. La nuit... les anguilles. Pêcher ne te prendra pas ta journée, va ! »",
        "« Mais l'étang n'est pas bête : prends-en trop d'affilée, et il se méfie. Et les gros, les coriaces, il faut du métier pour les sortir de l'eau. Ça viendra. Et ce que tu prends, je te le rachète. Six par jour, hein : ma cabane est petite ! »"];
      let i = 0;
      const t = this.add.text(30, 336, pages[0], style(14, '#3b2410', { wordWrap: { width: 880 }, lineSpacing: 4 })); c.add(t);
      this.boutonPanneau(850, 452, 120, 'Suite ▸', () => { if (++i < pages.length) return t.setText(pages[i]); p.barnabe = true; this.ouvrirBarnabe(); });
      Son.jouer('page');
      return;
    }
    const pr = progresPeche(G);
    c.add(this.add.text(30, 330, aUneCanne(G) ? '« Alors, ça mord ? Ce que tu pêches, tu peux me le vendre ici même : je passe prendre la bourriche. »' : '« Une canne de roseau, et je t’apprends le reste. »', style(11, '#6b4a2a', { fontStyle: 'italic' })));
    ['roseau', 'noisetier', 'grandPere'].forEach((id, i) => {
      const k = CANNES_PECHE[id], a = p.cannes.includes(id);
      if (id === 'grandPere' && !a) return;
      const y = 362 + i * 28;
      c.add(this.add.image(60, y, textureCanne(this, id)).setScale(1.2).setOrigin(0, 0.6));
      c.add(this.add.text(220, y - 8, `${k.nom}${k.prix ? ' · ' + k.prix + ' p.' : ''}`, style(12, '#3b2410', { fontStyle: 'bold' })));
      c.add(this.add.text(220, y + 6, k.texte.length > 80 ? k.texte.slice(0, k.texte.indexOf('.') + 1) : k.texte, style(10, '#6b4a2a', { fontStyle: 'italic' })));
      if (a) c.add(this.add.text(700, y, p.canne === id ? '✓ dans ta main' : '✓ à toi', style(12, '#2f6a2a', { fontStyle: 'bold' })).setOrigin(0, 0.5));
      else this.boutonPanneau(760, y, 110, 'Acheter', () => {
        const r = acheterCanne(G, id);
        if (r.erreur) return this.dire(r.erreur);
        Son.jouer('achat'); this.fermerPanneau();
        ecranNouvelObjet(this, textureCanne(this, id), { nom: k.nom, de: 'achetée à Barnabé Goujon', texte: k.texte + (id === 'roseau' ? "\nLe ponton t'attend, juste là : le matin (l'aube), ou le soir." : ''), ech: id === 'roseau' ? 5 : 4.4, bouton: 'Merci, Barnabé' }).then(() => this.ouvrirBarnabe());
      });
    });
    c.add(this.add.text(30, 452, `${eJ() ? 'Pêcheuse' : 'Pêcheur'} · niveau ${pr.niveau}${pr.haut ? ` (${pr.xp}/${pr.haut})` : ' (le plus haut)'} · vendus aujourd'hui : ${ventesDuJour(G)}/${PECHE.venteParJour}`, style(12, '#1f4a7a', { fontStyle: 'bold' })).setOrigin(0, 0.5));
    this.boutonPanneau(600, 452, 170, 'Le carnet de pêche', () => carnetDePeche(this));
    if (aUneCanne(G)) this.boutonPanneau(812, 452, 190, 'Pêcher (l’aube)', () => this.pecher());
  }

  // Sur le ponton, la canne en main (la scène de la pêche revient ici)
  pecher() {
    if (this.fini || enTransition(this)) return;
    this.fini = true; this.fermerPanneau();
    Sauvegarde.maintenant(this.G, 'Marche');
    this.cameras.main.fadeOut(400);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Peche', { plage: 'aube', retour: 'Etang' }));
  }

  update(temps, delta) {
    if (!this.heros) return;
    const E = ETANG, h = this.heros;
    let dx = 0;
    const libre = !this.panneauC && !this.entree && !this.sortie && !this.fini;
    if (libre && this.touches && (this.touches.left.isDown || this.touches.right.isDown)) {
      this.cible = null; this.apres = null;
      dx = (this.touches.right.isDown ? 1 : -1) * E.vitesse * delta;
    } else if (this.cible !== null) {
      const reste = this.cible - h.x;
      dx = Math.sign(reste) * Math.min(Math.abs(reste), E.vitesse * delta);
      if (Math.abs(reste) < 1) { this.cible = null; this.entree = null; const f = this.apres; this.apres = null; if (f) f(); }
    }
    if (dx) {
      const min = this.sortie ? E.bord - 80 : E.ouest - 30;
      h.x = Phaser.Math.Clamp(h.x + dx, min, E.est);
      h.setFlipX(dx < 0);
      this.pas += delta;
      if (!h.marche) pasDeMarche(this, h, 260, { sol: typeof saisonDe === 'function' && saisonDe(window.GAME) === 'givre' ? 'neige' : 'terre', volumePas: 0.55 });   // (v1.64 : le chemin de terre de l'étang)
      h.y = SOL_PROMENADE - Math.abs(Math.sin(this.pas / 120)) * 2;
      // (tout à l'ouest, à pied : c'est la route de la place)
      if (!this.sortie && !this.fini && !this.entree && dx < 0 && h.x <= E.ouest - 28) this.repartir();
    } else h.y = SOL_PROMENADE;
    this.cameras.main.scrollX = Phaser.Math.Clamp(h.x - 480, E.bord, LARGEUR_MOULIN - 960);
  }
}
