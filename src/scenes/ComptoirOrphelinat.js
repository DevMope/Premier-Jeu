// (v1.12, planche 42 validée) L'orphelinat, côté écrans : la fenêtre du soir (la liste des courses des petits, et
// les améliorations à bâtir), et le coursier au comptoir, à côté de Grippesou.

// Le soir, chez toi : « L'orphelinat ». `page` : 'courses' ou 'batir'. Dans n'importe quelle scène.
function orphelinatDuSoir(scene, suite, page = 'courses') {
  const G = window.GAME, o = orphelinatDe(G);
  const objets = [];
  const voile = scene.add.rectangle(480, 270, 960, 540, 0x0a0604, 0.55).setDepth(80).setInteractive();
  const L = scene.add.container(480, 258).setDepth(81);
  objets.push(voile, L);
  L.add(scene.add.image(0, 0, panneauHD(scene, 620, 420)).setScale(2).setInteractive());   // (housekeep v1.14 : un clic dans le panneau ne le ferme pas)
  const fermer = (relancer = false) => {
    if (!voile.active) return;
    for (const x of objets) { if (x.fond) { x.fond.destroy(); x.label.destroy(); } else if (x.active) x.destroy(); }
    if (relancer) orphelinatDuSoir(scene, suite, relancer); else if (suite) suite();
  };
  const bouton = (x, y, l, texte, action, actif = true) => { const b = creerBouton(scene, x, y, l, texte, action); b.fond.setDepth(82); b.label.setDepth(82.1); if (!actif) b.setActif(false); objets.push(b); return b; };
  const enfants = enfantsOrphelinat(G);
  L.add(scene.add.text(0, -186, "L'ORPHELINAT DU COMTÉ", style(19, '#5a0e0e', { fontStyle: 'bold' })).setOrigin(0.5));
  L.add(scene.add.text(0, -164, `${enfants.length} enfants · ${pluriel(coursesParJour(G), 'course', 'courses')} par jour au comptoir · une liste de ${tailleListe(G)} objets le soir`, style(12, '#3b2410', { fontStyle: 'italic' })).setOrigin(0.5));
  // les deux onglets
  const onglet = (x, texte, id) => {
    const actif = page === id, t = scene.add.text(x, -138, texte, style(14, actif ? '#fff4dc' : '#3b2410', { fontStyle: 'bold', backgroundColor: actif ? '#5a3a1a' : '#e8d8b0', padding: { x: 10, y: 4 } })).setOrigin(0.5);
    if (!actif) t.setInteractive({ useHandCursor: true }).on('pointerdown', () => { Son.jouer('page'); fermer(id); });
    L.add(t);
  };
  onglet(-110, 'Les courses des petits', 'courses');
  onglet(120, 'Bâtir', 'batir');

  if (page === 'courses') {
    const articles = articlesDuMarche(G), max = tailleListe(G);
    const liste = {};
    if (o.liste && o.liste.jour === G.jour) for (const [id, l] of Object.entries(o.liste.objets)) liste[id] = l.n;
    L.add(scene.add.text(0, -112, `Coche ce qu'il te faut : ${enfants[0]} et ${enfants[1]} iront au marché à l'aube, et tout sera sur ton comptoir à l'ouverture (${max} objets au plus, jamais plus cher qu'aujourd'hui).`, style(11, '#3b2410', { fontStyle: 'italic', wordWrap: { width: 560 }, align: 'center' })).setOrigin(0.5));
    const total = scene.add.text(0, 112, '', style(14, '#2f5a2a', { fontStyle: 'bold' })).setOrigin(0.5);
    L.add(total);
    const cases = [];
    const maj = () => {
      const n = Object.values(liste).reduce((a, b) => a + b, 0), p = articles.reduce((a, x) => a + (liste[x.id] || 0) * x.prix, 0);
      total.setText(n ? `${pluriel(n, 'objet', 'objets')} sur ${max} · ${p} p. · les petits partent à l'aube` : 'Rien sur la liste pour demain.');
      total.setColor(p > G.argent ? '#b02020' : '#2f5a2a');
      for (const c of cases) { const k = liste[c.id] || 0; c.nb.setText(k ? String(k) : '0').setColor(k ? '#2f5a2a' : '#8a6a3a'); c.fond.setFillStyle(k ? 0xe8f0d0 : 0xf3e6c8).setStrokeStyle(2, k ? 0x4a8a3a : 0x8a6a3a); }
    };
    const col = 5, lw = 108, lh = 58, x0 = -(col - 1) * lw / 2, y0 = -66;
    if (!articles.length) L.add(scene.add.text(0, 0, "Le marché n'a rien vendu aujourd'hui : rien à mettre sur la liste.", style(13, '#3b2410')).setOrigin(0.5));
    articles.slice(0, col * 3).forEach((a, i) => {
      const x = x0 + (i % col) * lw, y = y0 + Math.floor(i / col) * (lh + 6);
      const fond = scene.add.rectangle(x, y, lw - 6, lh, 0xf3e6c8).setStrokeStyle(2, 0x8a6a3a); L.add(fond);
      L.add(scene.add.image(x - 34, y - 8, iconeObjet(scene, a.id)).setScale(1.3));
      const nom = scene.add.text(x - 16, y - 18, nomObjet(a.id), style(11, '#3b2410', { fontStyle: 'bold' })).setOrigin(0, 0.5);
      for (let t = 11; nom.width > lw - 30 && t > 8; t--) nom.setFontSize(t);
      L.add(nom);
      L.add(scene.add.text(x - 16, y - 3, `${a.prix} p. · chez toi ${G.stock[a.id] || 0}`, style(9, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0, 0.5));
      const moins = scene.add.text(x - 28, y + 16, '−', style(17, '#8a1a14', { fontStyle: 'bold' })).setOrigin(0.5).setInteractive({ useHandCursor: true });
      const plus = scene.add.text(x + 28, y + 16, '+', style(17, '#2f5a2a', { fontStyle: 'bold' })).setOrigin(0.5).setInteractive({ useHandCursor: true });
      const nb = scene.add.text(x, y + 16, '0', style(15, '#8a6a3a', { fontStyle: 'bold' })).setOrigin(0.5);
      moins.on('pointerdown', () => { if (liste[a.id]) { liste[a.id]--; if (!liste[a.id]) delete liste[a.id]; Son.jouer('clic'); maj(); } });
      plus.on('pointerdown', () => { const n = Object.values(liste).reduce((s, k) => s + k, 0); if (n >= max) { Son.jouer('refus'); return; } liste[a.id] = (liste[a.id] || 0) + 1; Son.jouer('clic'); maj(); });
      L.add([moins, plus, nb]);
      cases.push({ id: a.id, fond, nb });
    });
    if (articles.length > col * 3) L.add(scene.add.text(0, 92, `(et ${articles.length - col * 3} autres objets aux étals : la liste montre les moins chers)`, style(10, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5));
    L.add(scene.add.text(0, 132, "(ce que le marché vendait aujourd'hui ; ce qui manquera à l'étal demain ne sera pas pris)", style(10, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5));
    maj();
    bouton(350, 428, 230, 'Envoyer les petits', () => {
      const n = fixerListeDesCourses(G, liste);
      Son.jouer(n ? 'pieces' : 'page');
      fermer();
      if (n && scene.annoncer) scene.annoncer(`${enfants[0]} et ${enfants[1]} partiront au marché à l'aube (${pluriel(n, 'objet', 'objets')}).`);
    });
    bouton(610, 428, 230, o.liste && o.liste.jour === G.jour ? 'Effacer la liste' : 'Rien ce soir', () => { o.liste = null; fermer(); });
  } else {
    // les trois améliorations, dans l'ordre (la suivante seule se bâtit)
    const suivante = ameliorationOrphelinat(G), couleurs = [0x4a8a3a, 0x2a4a8a, 0x8a5a2a];
    ORPHELINAT.ameliorations.forEach((a, i) => {
      const x = -212 + i * 212, bati = orphelinatA(G, a.id), chantier = o.chantier === a.id;
      const c = scene.add.container(x, -2); L.add(c);
      c.add(scene.add.rectangle(0, 0, 200, 222, bati ? 0xdcd0a8 : 0xf3e6c8).setStrokeStyle(3, couleurs[i]));
      c.add(scene.add.text(0, -92, a.nom, style(15, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
      c.add(scene.add.text(0, -71, bati ? 'déjà bâti' + (a.id === 'dortoir' ? '' : 'e') : chantier ? 'bâti' + (a.id === 'dortoir' ? '' : 'e') + ' cette nuit' : a.prix + ' p.', style(13, bati || chantier ? '#2f5a2a' : '#8a1a14', { fontStyle: 'bold' })).setOrigin(0.5));
      c.add(scene.add.text(0, 6, a.effet, style(12, '#3b2410', { wordWrap: { width: 180 }, align: 'center' })).setOrigin(0.5));
      c.add(scene.add.text(0, 88, a.decor, style(10, '#6b4a2a', { fontStyle: 'italic', wordWrap: { width: 180 }, align: 'center' })).setOrigin(0.5));
      if (!bati && !chantier && suivante && suivante.id !== a.id) c.add(scene.add.text(0, -54, `après ${ORPHELINAT.ameliorations[i - 1].nom.toLowerCase()}`, style(10, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5));
    });
    let note = 'Tout est bâti : le Comté entier parle de ton orphelinat.';
    if (o.chantier) note = 'Les ouvriers viennent cette nuit : des coups de marteau au réveil.';
    else if (suivante) note = peutPayer(G, suivante.prix) ? `Chaque amélioration se bâtit en une nuit (+${ORPHELINAT.reputation} de réputation).` : `Il te manque ${suivante.prix - Math.floor(G.argent)} pièces pour ${suivante.nom.toLowerCase()}.`;
    L.add(scene.add.text(0, 128, note, style(12, suivante && !o.chantier && !peutPayer(G, suivante.prix) ? '#b02020' : '#2f5a2a', { fontStyle: 'bold italic', wordWrap: { width: 560 }, align: 'center' })).setOrigin(0.5));
    if (suivante && !o.chantier) bouton(480, 430, 300, `Bâtir ${suivante.nom.toLowerCase()} (${suivante.prix} p.)`, () => {
      const res = batirOrphelinat(G);
      if (!res.ok) { Son.jouer('refus'); return; }
      Son.jouer('pieces'); scene.cameras.main.flash(250, 255, 240, 160);
      if (typeof noterJournal === 'function') noterJournal(`orphelinat : ${res.amelioration.id}`);
      fermer('batir');
    }, peutPayer(G, suivante.prix));
  }
  objets.push(scene.add.text(950, 530, '▶ clique à côté pour refermer', style(12, '#d6bf98', { fontStyle: 'italic' })).setOrigin(1, 1).setDepth(82));
  L.setScale(0.9).setAlpha(0); scene.tweens.add({ targets: L, scale: 1, alpha: 1, duration: 260, ease: 'Back.easeOut' });
  scene.time.delayedCall(400, () => { if (voile.active) voile.once('pointerdown', () => fermer()); });
  return fermer;
}

Object.assign(CounterScene.prototype, {
  // Le coursier, à côté de Grippesou (les deux boutons se partagent la ligne)
  creerCoursier() {
    const G = this.G;
    if (!orphelinatOuvert(G)) return;
    this.boutonCoursier = creerBouton(this, 896, 360, 100, 'Coursier', () => this.ouvrirCoursier());
    this.sablierCoursier = this.add.text(944, 343, '', style(11, '#fff4dc', { fontStyle: 'bold', backgroundColor: '#1e130a', padding: { x: 4, y: 1 }, brut: true })).setOrigin(1, 0.5).setDepth(5).setVisible(false);
  },
  majCoursier(libre) {
    if (!this.boutonCoursier) return;
    const G = this.G, reste = coursesRestantes(G), voir = this.enService && libre && !this.coursierEnRoute;
    this.boutonCoursier.setVisible(voir);
    this.boutonCoursier.setActif(reste > 0);
    const d = dureeCourse(G);
    this.sablierCoursier.setVisible(voir).setText(reste > 0 ? `${d ? '⌛ ' + formatDuree(d) : 'sans attente'} · ${reste}` : 'plus de course');
  },
  // Ce qu'il peut rapporter de l'étal : une petite fenêtre par-dessus le comptoir
  ouvrirCoursier() {
    const G = this.G;
    if (!this.enService || this.coursierEnRoute || this.fenetreCoursier) return;
    if (coursesRestantes(G) <= 0) { Son.jouer('refus'); return; }
    const offre = Object.entries(offreDuCoursier(G));
    const objets = [], v = this.voyageur, commande = v ? commandeDe(v) : {};
    const voile = this.add.rectangle(480, 270, 960, 540, 0x0a0604, 0.5).setDepth(80).setInteractive();
    const L = this.add.container(480, 250).setDepth(81);
    objets.push(voile, L);
    L.add(this.add.image(0, 0, panneauHD(this, 620, 400)).setScale(2).setInteractive());
    const petit = auHasard(enfantsOrphelinat(G)), fille = ORPHELINAT.filles.includes(petit);
    L.add(this.add.text(0, -172, `${petit.toUpperCase()}, ${fille ? 'LA COURSIÈRE' : 'LE COURSIER'}`, style(18, '#5a0e0e', { fontStyle: 'bold' })).setOrigin(0.5));
    const d = dureeCourse(G);
    L.add(this.add.text(0, -150, `Un objet de l'étal, au prix du marché${d ? `, en ${formatDuree(d)}` : ', sans te faire attendre'} · ${pluriel(coursesRestantes(G), 'course restante', 'courses restantes')} aujourd'hui`, style(12, '#3b2410', { fontStyle: 'italic' })).setOrigin(0.5));
    const fermer = () => { for (const x of objets) if (x.active) x.destroy(); this.fenetreCoursier = null; };
    this.fenetreCoursier = fermer;
    const col = 4, lw = 140, lh = 52, x0 = -(col - 1) * lw / 2, y0 = -110;
    offre.slice(0, col * 6).forEach(([id, a], i) => {
      const x = x0 + (i % col) * lw, y = y0 + Math.floor(i / col) * (lh + 6);
      const besoin = commande[id] && fourni(v, this.colis, id) < commande[id];
      const fond = this.add.rectangle(x, y, lw - 8, lh, besoin ? 0xe8f0d0 : 0xf3e6c8).setStrokeStyle(2, besoin ? 0x4a8a3a : 0x8a6a3a).setInteractive({ useHandCursor: true });
      fond.on('pointerover', () => fond.setFillStyle(0xfff4d0)); fond.on('pointerout', () => fond.setFillStyle(besoin ? 0xe8f0d0 : 0xf3e6c8));
      fond.on('pointerdown', () => { fermer(); this.envoyerCoursier(id, petit); });
      L.add(fond);
      L.add(this.add.image(x - 48, y, iconeObjet(this, id)).setScale(1.4));
      const nom = this.add.text(x - 28, y - 10, nomObjet(id), style(12, '#3b2410', { fontStyle: 'bold' })).setOrigin(0, 0.5);
      for (let t = 12; nom.width > lw - 44 && t > 8; t--) nom.setFontSize(t);
      L.add(nom);
      L.add(this.add.text(x - 28, y + 9, `${a.prix} p.${besoin ? ' · pour lui' : ` · chez toi ${G.stock[id] || 0}`}`, style(10, besoin ? '#2f5a2a' : '#6b4a2a', { fontStyle: besoin ? 'bold' : 'italic' })).setOrigin(0, 0.5));
    });
    if (!offre.length) L.add(this.add.text(0, 0, "L'étal est vide : il n'y a plus rien à rapporter aujourd'hui.", style(13, '#3b2410')).setOrigin(0.5));
    L.add(this.add.text(0, 172, 'Le vert : ce que ton client attend encore. Grippesou reste là pour les objets rares.', style(11, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5));
    objets.push(this.add.text(950, 530, '▶ clique à côté pour refermer', style(12, '#d6bf98', { fontStyle: 'italic' })).setOrigin(1, 1).setDepth(82));
    L.setScale(0.9).setAlpha(0); this.tweens.add({ targets: L, scale: 1, alpha: 1, duration: 240, ease: 'Back.easeOut' });
    Son.jouer('page');
    this.time.delayedCall(350, () => { if (voile.active) voile.once('pointerdown', fermer); });
  },
  // Il file au marché derrière la fenêtre, et revient l'objet sous le bras
  envoyerCoursier(id, petit) {
    const G = this.G, v = this.voyageur, commande = v ? commandeDe(v) : {};
    const pourLeClient = !!(commande[id] && fourni(v, this.colis, id) < commande[id]);
    const res = courseDuCoursier(G, id, pourLeClient);
    if (!res.ok) { Son.jouer('refus'); this.raconter(res.erreur, 'Les coursiers'); return; }
    if (pourLeClient) this.colis[id] = (this.colis[id] || 0) + 1;
    else G.stock[id] = (G.stock[id] || 0) + 1;
    Son.jouer('achat');
    const d = dureeCourse(G);
    if (d) this.avancer(d, 'le coursier court au marché');
    this.coursierEnRoute = true;
    this.majBoutonsService();
    // la petite course, derrière la fenêtre : il part à gauche, revient en courant
    const tom = imageCorps(this, FENETRE.x + FENETRE.w - 30, FILE.y + 2, { race: 'hobbit', nom: petit, feminin: ORPHELINAT.filles.includes(petit), niveau: 'novice' }, 4.4).setDepth(1.6).setFlipX(true);
    if (this.masqueFenetre) tom.setMask(this.masqueFenetre);
    pasDeMarche(this, tom, 900);
    this.tweens.add({ targets: tom, x: FENETRE.x - 40, duration: 900, ease: 'Sine.easeIn', onComplete: () => {
      tom.setFlipX(false);
      this.time.delayedCall(500, () => { if (!tom.active) return; pasDeMarche(this, tom, 900); this.tweens.add({ targets: tom, x: FENETRE.x + FENETRE.w - 30, duration: 900, ease: 'Sine.easeOut', onComplete: () => tom.destroy() }); });
    } });
    this.time.delayedCall(1400, () => {
      this.coursierEnRoute = false;
      this.majStock(); this.majCommande(); this.dessinerPieces();
      this.majBoutonsService();
      if (this.voyageur !== v) return;   // (housekeep v1.14 : le client est déjà parti)
      const nom = nomRoyal(id);
      this.raconter(`${petit} revient en courant : ${femininRoyal(id) ? 'une' : 'un'} ${nom}, au prix de l'étal (${res.prix} p.). ${pourLeClient ? 'Droit dans le baluchon.' : 'Dans ta réserve.'}${res.message ? ' ' + res.message : ''}`, ORPHELINAT.filles.includes(petit) ? 'La coursière' : 'Le coursier');
    });
  },
});
