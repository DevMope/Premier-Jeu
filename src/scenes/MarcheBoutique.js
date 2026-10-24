// (v1.49, planche 73 v2, images 5 et 6) La boutique en grand et la liste de courses.
// La boutique : plein écran, le marchand derrière son comptoir ; chaque cagette est un gros bouton (clic +1, Maj+clic
// +5, clic droit −1) ; un onglet par étal pour changer sans marcher ; un seul panier pour toute la place, payé d'un coup
// (chaque marchand compte ses ventes : la relation monte comme à l'étal). Au clavier : Tab, ← →, Espace, Entrée, Échap.
// La liste de courses (L) : faite toute seule (2 de chaque provision, moins ce que tu as), rangée par marchand ;
// « Tout acheter », « Mettre au panier », « Refaire mes courses d'hier ».

const ONGLETS_BOUTIQUE = ['gedeon', 'apothicaire', 'forge', 'tailleuse'];
const LISTE_BASE = 2;   // (v1.61) la liste de courses vise au moins 2 de chaque provision

Object.assign(MarcheScene.prototype, {
  // Ce que tu as d'un article (les matériaux à part)
  aDejaMarche(id) { const G = this.G; return id in MATERIAUX ? G.materiaux[id] || 0 : G.stock[id] || 0; },
  articlesEtal(cle) { const offre = (this.G.etals || {})[cle] || {}; return MARCHANDS[cle].objets.filter(id => offre[id] && offre[id].qte > 0); },
  // (v1.49) le panier ne garde que ce qui est encore en vente, pas plus que le stock
  nettoyerPanier() {
    const G = this.G; this.panier = this.panier || {};
    for (const [k, q] of Object.entries(this.panier)) {
      const [cle, id] = k.split(':'), o = G.etals && G.etals[cle] && G.etals[cle][id];
      if (!o || o.qte <= 0) delete this.panier[k]; else if (q > o.qte) this.panier[k] = o.qte;
    }
  },
  totalPanier() { let t = 0; for (const [k, q] of Object.entries(this.panier || {})) { const [cle, id] = k.split(':'); t += prixMarchand(this.G, cle, id) * q; } return t; },

  ajouterAuPanier(cle, id, n) {
    this.panier = this.panier || {};
    const k = cle + ':' + id, offre = this.G.etals[cle][id], avant = this.panier[k] || 0;
    const q = Phaser.Math.Clamp(avant + n, 0, offre ? offre.qte : 0);
    if (q === avant) { if (n > 0) { this.messageBoutique(`Plus de ${nomObjet(id).toLowerCase()} chez ${prenomDe(MARCHANDS[cle].nom)} aujourd'hui.`, '#ffb0a0'); } return; }
    Son.jouer(n > 0 ? 'clic' : 'glisse');
    if (q) this.panier[k] = q; else delete this.panier[k];
  },

  boutique(cle) {
    if (this.boutiqueC) this.boutiqueC.destroy();
    this.ongletBoutique = cle; this.carteSel = 0;
    this.input.mouse && this.input.mouse.disableContextMenu();
    const c = this.boutiqueC = this.add.container(0, 0).setDepth(40);
    c.once('destroy', () => { if (this.toucheBoutique && this.input.keyboard) this.input.keyboard.off('keydown', this.toucheBoutique); this.toucheBoutique = null; });
    if (this.input.keyboard) {
      this.toucheBoutique = e => {
        if (!this.boutiqueC || this.listeC) return;
        const ids = this.articlesEtal(this.ongletBoutique);
        if (e.key === 'Tab') { e.preventDefault && e.preventDefault(); const i = ONGLETS_BOUTIQUE.indexOf(this.ongletBoutique); this.ongletBoutique = ONGLETS_BOUTIQUE[(i + (e.shiftKey ? -1 : 1) + ONGLETS_BOUTIQUE.length) % ONGLETS_BOUTIQUE.length]; this.carteSel = 0; Son.jouer('page'); this.dessinerBoutique(); }
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { this.carteSel = Phaser.Math.Clamp(this.carteSel + (e.key === 'ArrowLeft' ? -1 : 1), 0, Math.max(0, ids.length - 1)); this.dessinerBoutique(); }
        else if ((e.key === ' ' || e.key === '+') && ids[this.carteSel]) { this.ajouterAuPanier(this.ongletBoutique, ids[this.carteSel], e.key === ' ' && e.shiftKey ? 5 : 1); this.dessinerBoutique(); }   // (« + » demande Maj sur un clavier français : il ajoute 1)
        else if (e.key === '-' && ids[this.carteSel]) { this.ajouterAuPanier(this.ongletBoutique, ids[this.carteSel], -1); this.dessinerBoutique(); }
        else if (e.key === 'Enter') this.payerPanier();
        else if (e.key === 'Escape') this.fermerBoutique();
        else if (e.key === 'l' || e.key === 'L') this.listeCourses();
      };
      this.input.keyboard.on('keydown', this.toucheBoutique);
    }
    this.dessinerBoutique();
  },

  fermerBoutique() { if (!this.boutiqueC) return; Son.jouer('glisse'); this.boutiqueC.destroy(); this.boutiqueC = null; this.majInfos(); },

  // (v1.61) un refus (réserve pleine, plus d'argent...) s'affiche là où tu viens de cliquer, bien visible, en rouge,
  // avec un petit sursaut (avant : une ligne discrète loin du clic)
  refusPresDuClic(texte) {
    Son.jouer('refus');
    const p = this.input.activePointer, cam = this.cameras.main, w = cam.getWorldPoint(p.x, p.y);
    const zx = cam.scrollX, zy = cam.scrollY, lw = cam.width / cam.zoom, lh = cam.height / cam.zoom;
    if (this.refusClic && this.refusClic.active) this.refusClic.destroy();
    const t = this.refusClic = this.add.text(0, 0, '✋ ' + texte, style(15, '#fff0e8', { fontStyle: 'bold', stroke: '#3a0a06', strokeThickness: 4, align: 'center', wordWrap: { width: 300 }, backgroundColor: '#8a1e14ee', padding: { x: 12, y: 7 } }))
      .setOrigin(0.5, 1).setDepth(90).setScrollFactor(1);
    t.setPosition(Phaser.Math.Clamp(w.x, zx + t.width / 2 + 8, zx + lw - t.width / 2 - 8), Phaser.Math.Clamp(w.y - 18, zy + t.height + 8, zy + lh - 8));
    t.setScale(0.6);
    this.tweens.add({ targets: t, scale: 1, duration: 160, ease: 'Back.easeOut' });
    this.tweens.add({ targets: t, x: t.x + 5, duration: 50, yoyo: true, repeat: 3, delay: 160 });
    this.tweens.add({ targets: t, alpha: 0, y: t.y - 14, delay: 2600, duration: 450, onComplete: () => t.destroy() });
  },

  messageBoutique(texte, couleur = '#fff4dc') {
    if (couleur === '#ffb0a0') return this.refusPresDuClic(texte);
    if (!this.boutiqueC) return this.message(texte);
    if (this.texteBoutique && this.texteBoutique.active) this.texteBoutique.destroy();
    const t = this.texteBoutique = this.add.text(306, 262, texte, style(13, couleur, { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 4, align: 'center', wordWrap: { width: 560 }, backgroundColor: '#1a120acc', padding: { x: 10, y: 5 } })).setOrigin(0.5).setDepth(46);
    this.tweens.add({ targets: t, alpha: 0, delay: 3200, duration: 500, onComplete: () => t.destroy() });
  },

  // un gain ou une perte, en direct, près de la bourse
  flotterMarche(texte, couleur = '#ff8a6a', x = 860, y = 40) {
    const t = this.add.text(x, y, texte, style(20, couleur, { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 5 })).setOrigin(0.5).setDepth(60);
    this.tweens.add({ targets: t, y: y + 34, alpha: 0, duration: 1700, ease: 'Quad.easeIn', onComplete: () => t.destroy() });
  },

  dessinerBoutique() {
    this.nettoyerPanier();
    const G = this.G, c = this.boutiqueC, cle = this.ongletBoutique, m = MARCHANDS[cle];
    c.removeAll(true);
    const T = (x, y, t, taille = 13, coul = '#fff4dc', o = {}) => { const tx = this.add.text(x, y, t, style(taille, coul, { fontStyle: 'bold', ...o })); c.add(tx); return tx; };
    const icone = (id, x, y, e) => { const i = this.add.image(x, y, iconeObjet(this, id)).setScale(e); c.add(i); return i; };
    c.add(this.add.rectangle(480, 270, 960, 540, 0x120a04, 0.96).setInteractive());
    // l'étal en grand, à gauche
    propsVitrineHD(this); decorsEtalsHD(this); creerDecorPlaceHD(this); creerHalo(this);
    const fond = this.add.container(0, 0); c.add(fond);
    fond.add(this.add.image(305, 262, fondVitrineHD(this)).setScale(1.3));
    fond.add(this.add.image(305, 76, etalHD(this, m.couleur)).setOrigin(0.5, 0).setScale(5.6, 2.4).setCrop(0, 0, 88, 22));
    fond.add(this.add.rectangle(305, 200, 610, 300, 0x120a04, 0.25));
    const personne = { nom: m.nom, race: m.race, feminin: /Mère|Hilda|Rosalie/.test(m.nom) };
    fond.add(this.add.image(305, 302, textureBusteHD(this, personne, 'content')).setOrigin(0.5, 1).setScale(2.1));
    fond.add(this.add.image(305, 292, nappeVitrineHD(this, m.couleur)).setOrigin(0.5, 0).setScale(1.3));
    fond.add(this.add.rectangle(305, 420, 616, 240, 0x1a120a, 1));
    const msk = this.make.graphics({ add: false }); msk.fillStyle(0xffffff).fillRect(0, 72, 612, 468); fond.setMask(msk.createGeometryMask());
    const rel = niveauRelation(G, m.nom), remise = remiseMarchand(G, cle);
    T(470, 124, `Relation : ${rel.nom}${remise ? ` · −${Math.round(remise * 100)} %` : ''}`, 11, rel.couleur, { fontStyle: 'italic', backgroundColor: '#f3e6c8', padding: { x: 7, y: 3 } }).setOrigin(0.5);
    // les onglets : un clic, on change d'étal sans marcher
    c.add(this.add.rectangle(480, 50, 960, 44, 0x1a120a));
    ONGLETS_BOUTIQUE.forEach((k, i) => {
      const x = 82 + i * 136, sel = k === cle;
      const r = this.add.rectangle(x, 50, 130, 34, sel ? 0x8a3a1a : 0x3a2a1a).setStrokeStyle(2, sel ? 0xf0c020 : 0x6a4a2a).setInteractive({ useHandCursor: true });
      r.on('pointerdown', () => { if (k !== this.ongletBoutique) { this.ongletBoutique = k; this.carteSel = 0; Son.jouer('page'); this.dessinerBoutique(); } });
      c.add(r);
      T(x, 42, MARCHANDS[k].metier.split(' ')[0], 13, sel ? '#ffe9a8' : '#e8d4a8').setOrigin(0.5);
      T(x, 57, MARCHANDS[k].nom, 9, sel ? '#f8e0b0' : '#a89878', { fontStyle: 'italic' }).setOrigin(0.5);
    });
    const bl = this.add.rectangle(632, 50, 104, 34, 0x2f5a2a).setStrokeStyle(2, 0x8ad05a).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.listeCourses());
    c.add(bl); T(632, 42, '☰ Ma liste', 13, '#e8ffd0').setOrigin(0.5); T(632, 57, 'touche L', 9, '#c8e8b0', { fontStyle: 'italic' }).setOrigin(0.5);
    const bx = this.add.rectangle(930, 50, 46, 34, 0x5a2a1a).setStrokeStyle(2, 0xc8a050).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.fermerBoutique());
    c.add(bx); T(930, 50, '✕', 16, '#ffe9a8').setOrigin(0.5);
    c.add(bourse(this, 770, 50, G.argent, { echelle: 1.3, taille: 15, aDroite: true }));
    // la marchandise : chaque cagette est un gros bouton
    const ids = this.articlesEtal(cle), prevus = totalCommandes(G), panier = this.panier || {};
    const n = ids.length, cols = n <= 4 ? Math.max(1, n) : 5, rangs = Math.ceil(n / cols), grand = rangs === 1;
    const lw = Math.min(146, 600 / cols), lh = grand ? 168 : 100, y0 = grand ? 312 : 306;
    if (!n) T(306, 380, 'Les cagettes sont vides aujourd’hui...\nLes étals changent chaque matin.', 15, '#c9b48a', { fontStyle: 'italic', align: 'center' }).setOrigin(0.5);
    ids.slice(0, 10).forEach((id, i) => {
      const col = i % cols, rang = Math.floor(i / cols);
      const x = 306 + (col - (Math.min(cols, n - rang * cols) - 1) / 2) * lw, y = y0 + rang * (lh + 6), o = G.etals[cle][id];
      const prix = prixMarchand(G, cle, id), dans = panier[cle + ':' + id] || 0, aToi = this.aDejaMarche(id), faut = id in MATERIAUX ? 0 : prevus[id] || 0, sel = i === this.carteSel;
      const carte = this.add.rectangle(x, y + lh / 2, lw - 8, lh, sel ? 0x3a2a10 : 0x1a120a, 0.92).setStrokeStyle(sel ? 3 : 2, sel ? 0xf0c020 : 0x6a4a2a).setInteractive({ useHandCursor: true });
      carte.on('pointerdown', p => { this.carteSel = i; const shift = p.event && p.event.shiftKey; this.ajouterAuPanier(cle, id, p.rightButtonDown() ? -1 : shift ? 5 : 1); this.dessinerBoutique(); });
      carte.on('pointerover', () => carte.setStrokeStyle(3, 0xf0c020)).on('pointerout', () => carte.setStrokeStyle(sel ? 3 : 2, sel ? 0xf0c020 : 0x6a4a2a));
      c.add(carte);
      const ks = typeof prixSaison === 'function' ? prixSaison(G, id) : 1, prixT = `${prix} p.${ks > 1 ? ' ▲' : ks < 1 ? ' ▼' : ''}`, coulP = ks > 1 ? '#ff9a7a' : ks < 1 ? '#9ae07a' : '#f3d98a';
      const coulA = faut > aToi + dans ? '#ff9a80' : faut ? '#9ae07a' : '#e8d4a8', texteA = 'tu as ' + aToi + (faut ? ' · il en faut ' + faut : '');
      if (grand) {
        const k = this.add.image(x, y + 50, 'cagetteHD').setOrigin(0.5, 1).setScale(2.4); c.add(k);
        for (let j = 0; j < Math.min(3, Math.ceil(o.qte / 2)); j++) icone(id, x - 12 + j * 12, y + 38 - j * 5, 3.4).setOrigin(0.5, 1).setAngle((j - 1) * 6);
        T(x, y + 64, nomObjet(id), 13).setOrigin(0.5);
        T(x, y + 84, prixT, 18, coulP).setOrigin(0.5);
        T(x, y + 104, o.qte + ' en vente', 10, '#c9b48a', { fontStyle: 'italic' }).setOrigin(0.5);
        T(x, y + 122, texteA, 10, coulA).setOrigin(0.5);
      } else {
        icone(id, x - lw / 2 + 26, y + 30, 2.6);
        const nt = T(x - lw / 2 + 46, y + 10, nomObjet(id), 11); for (let f = 11; nt.width > lw - 56 && f > 8; f--) nt.setFontSize(f);
        T(x - lw / 2 + 46, y + 28, prixT, 14, coulP);
        T(x, y + 56, `${o.qte} en vente · ${texteA}`, 9, coulA).setOrigin(0.5);
      }
      if (dans) { c.add(this.add.circle(x + lw / 2 - 18, y + 12, 14, 0xc23a2c).setStrokeStyle(2, 0xffe9a8)); T(x + lw / 2 - 18, y + 12, '×' + dans, 12).setOrigin(0.5); }
      const yb = y + lh - 18;
      for (const [dx, t, d] of [[-30, '−', -1], [30, '+', 1]]) {
        const b = this.add.circle(x + dx, yb, 11, 0x6a4a2a).setStrokeStyle(2, 0xc8a050).setInteractive({ useHandCursor: true });
        b.on('pointerdown', p => { p.event && p.event.stopPropagation && p.event.stopPropagation(); this.carteSel = i; this.ajouterAuPanier(cle, id, d); this.dessinerBoutique(); });
        c.add(b); T(x + dx, yb - 1, t, 15, '#ffe9a8').setOrigin(0.5);
      }
      T(x, yb, String(dans), 14, dans ? '#ffe066' : '#a89878').setOrigin(0.5);
    });
    if (n > 10) T(306, 512, `+ ${n - 10} autres articles demain matin, peut-être`, 10, '#c9b48a', { fontStyle: 'italic' }).setOrigin(0.5);
    // (v0.82) pour qui a une forge : les lots en gros de Thorgal
    if (cle === 'forge' && typeof forgeConstruite === 'function' && forgeConstruite(G)) {
      ['fer', 'cuir', 'bois'].forEach((mat, i) => {
        const b = creerBouton(this, 90 + i * 180, 286, 170, `${FORGE.lot} ${MATERIAUX[mat].nom.toLowerCase()} · ${prixLotGros(G, mat)} p.`, () => {
          const r = acheterLotGros(G, mat);
          if (typeof r === 'string') return this.messageBoutique(r, '#ffb0a0');
          Son.jouer('achat'); this.flotterMarche(`−${prixLotGros(G, mat)} p.`); this.dessinerBoutique(); this.messageBoutique(r.message || `${FORGE.lot} ${MATERIAUX[mat].nom.toLowerCase()} pour ta forge.`);
        });
        b.label.setFontSize(11); c.add([b.fond, b.label]);
      });
    }
    // le panier, à droite : une ardoise
    c.add(this.add.rectangle(785, 300, 330, 448, 0x23302a).setStrokeStyle(6, 0x7a5230));
    T(785, 92, 'TON PANIER', 18, '#f4f0e0').setOrigin(0.5);
    T(785, 113, 'un seul panier pour toute la place', 10, '#b8c8b8', { fontStyle: 'italic' }).setOrigin(0.5);
    const lignes = Object.entries(panier), total = this.totalPanier();
    if (!lignes.length) T(785, 200, 'Clique sur une cagette\npour la mettre au panier.', 13, '#9ab0a0', { fontStyle: 'italic', align: 'center' }).setOrigin(0.5);
    lignes.slice(0, 6).forEach(([k, q], i) => {
      const [kc, id] = k.split(':'), y = 144 + i * 36, prix = prixMarchand(G, kc, id) * q;
      icone(id, 640, y, 2);
      T(660, y - 9, nomObjet(id) + ' × ' + q, 12, '#f4f0e0'); T(660, y + 6, MARCHANDS[kc].nom, 9, '#9ab0a0', { fontStyle: 'italic' });
      T(870, y, prix + ' p.', 13, '#f3d98a').setOrigin(1, 0.5);
      const moins = this.add.circle(904, y, 10, 0x4a3a2a).setStrokeStyle(1, 0xc8a050).setInteractive({ useHandCursor: true }).on('pointerdown', () => { this.ajouterAuPanier(kc, id, -1); this.dessinerBoutique(); });
      c.add(moins); T(904, y - 1, '−', 13, '#ffe9a8').setOrigin(0.5);
      c.add(this.add.line(0, 0, 630, y + 19, 940, y + 19, 0x4a5a50).setOrigin(0));
    });
    if (lignes.length > 6) T(785, 360, `+ ${lignes.length - 6} autre${lignes.length - 6 > 1 ? 's' : ''} article${lignes.length - 6 > 1 ? 's' : ''}`, 11, '#b8c8b8', { fontStyle: 'italic' }).setOrigin(0.5);
    T(640, 380, 'Total', 16, '#f4f0e0'); T(930, 380, total + ' p.', 18, '#ffe066').setOrigin(1, 0);
    const reste = G.argent - total;
    T(640, 402, reste >= 0 ? `Il te restera ${reste} p.` : `Il te manque ${-reste} p.`, 11, reste >= 0 ? '#b8c8b8' : '#ff9a80', { fontStyle: 'italic' });
    const pay = creerBouton(this, 785, 438, 280, lignes.length ? `Payer · ${total} p.  (Entrée)` : 'Le panier est vide', () => this.payerPanier());
    if (!lignes.length) { pay.fond.setAlpha(0.5); pay.label.setAlpha(0.6); }
    c.add([pay.fond, pay.label]);
    if (lignes.length) { const v = T(785, 470, 'Vider le panier', 11, '#d8a8a0', { fontStyle: 'italic' }).setOrigin(0.5).setInteractive({ useHandCursor: true }); v.on('pointerdown', () => { this.panier = {}; Son.jouer('glisse'); this.dessinerBoutique(); }); }
    T(785, 500, 'Chaque marchand compte ses ventes :\nla relation monte comme à l’étal.', 10, '#9ab0a0', { fontStyle: 'italic', align: 'center' }).setOrigin(0.5);
    c.add(this.add.rectangle(306, 526, 612, 28, 0x0a0604, 0.9));
    T(306, 526, 'clic : +1 · Maj+clic : +5 · clic droit : −1 · Tab : étal suivant · ← → Espace · Entrée : payer · Échap', 10, '#e8d4a8').setOrigin(0.5);
  },

  // On paie tout le panier : article par article, chez chaque marchand (comme à l'étal)
  payerPanier(panier = null) {
    this.nettoyerPanier();
    const G = this.G, propre = !panier, lePanier = panier || this.panier, lignes = Object.entries(lePanier || {});
    if (!lignes.length) return;
    const avant = G.argent, achats = [], relations = [];
    let erreur = null;
    for (const [k, q] of lignes) {
      const [cle, id] = k.split(':');
      let pris = 0;
      for (; pris < q; pris++) { const r = acheterAuMarche(G, cle, id); if (r.erreur) { erreur = r.erreur; break; } if (r.message) relations.push(r.message); }
      if (pris) { achats.push([cle, id, pris]); if (pris >= q) delete lePanier[k]; else lePanier[k] = q - pris; }
      if (erreur) break;
    }
    const depense = avant - G.argent;
    if (achats.length) {
      Son.jouer('achat');   // (la bourse du bas affiche elle-même la dépense, en direct)
      // ce que tu as acheté, gardé pour « refaire mes courses d'hier »
      if (!G.courses || G.courses.jour !== G.jour) { if (G.courses) G.coursesAvant = G.courses; G.courses = { jour: G.jour, lignes: [] }; }
      for (const [cle, id, q] of achats) { const l = G.courses.lignes.find(x => x[0] === cle && x[1] === id); if (l) l[2] += q; else G.courses.lignes.push([cle, id, q]); }
      this.majInfos();
      if (this.commandesOuvertes && this.panneauCommandes) { this.panneauCommandes.destroy(); this.creerPanneauCommandes(); }
    }
    if (!propre) this.nettoyerPanier();   // (ce qui reste au panier ne dépasse pas ce qui reste en vente)
    if (this.boutiqueC) this.dessinerBoutique();
    if (erreur) this.messageBoutique(erreur, '#ffb0a0');
    else if (relations.length) this.messageBoutique(relations[relations.length - 1], '#9ae07a');
    else if (achats.length) this.messageBoutique('Dans ton baluchon ! Les marchands te saluent.', '#ffe066');
    return { depense, achats, erreur };
  },

  // --- La liste de courses (L) ---
  // Ce qui manque pour les commandes acceptées, chez le marchand le moins cher qui en a ce matin ; (v1.61) et, les
  // lettres parties, de quoi avoir au moins 2 de chaque provision vendue ce matin, dans la place libre de la réserve
  calculerListe() {
    this.nettoyerPanier();
    const G = this.G, besoin = { ...totalCommandes(G) }, lignes = [], auPanier = {};
    const vendus = new Set(Object.keys(MARCHANDS).flatMap(k => Object.keys((G.etals || {})[k] || {}).filter(id => G.etals[k][id].qte > 0)));
    for (const id of vendus) if (!(id in MATERIAUX) && ITEMS[id] && !ITEMS[id].arme && G.stock[id] !== undefined) besoin[id] = Math.max(besoin[id] || 0, LISTE_BASE);
    for (const [k, q] of Object.entries(this.panier)) { const id = k.split(':')[1]; auPanier[id] = (auPanier[id] || 0) + q; }
    let place = G.capacite - stockTotal(G) - Object.entries(auPanier).reduce((a, [id, q]) => a + (id in MATERIAUX ? 0 : q), 0);
    for (const id of Object.keys(besoin)) {
      let manque = besoin[id] - this.aDejaMarche(id) - (auPanier[id] || 0);   // (v1.49 : ce qui est déjà au panier est compté)
      if (!(id in MATERIAUX)) { manque = Math.min(manque, place); place -= Math.max(0, manque); }
      if (manque <= 0) continue;
      const dispo = k => G.etals[k][id].qte - (this.panier[k + ':' + id] || 0);
      const offres = Object.keys(MARCHANDS).filter(k => G.etals[k] && G.etals[k][id] && dispo(k) > 0).sort((a, b) => prixMarchand(G, a, id) - prixMarchand(G, b, id));
      for (const k of offres) { const q = Math.min(manque, dispo(k)); lignes.push({ cle: k, id, q, ok: true }); manque -= q; if (!manque) break; }
      if (manque > 0) lignes.push({ cle: null, id, q: manque, ok: false });
    }
    return lignes;
  },
  listeHier() {
    const G = this.G, h = G.courses && G.courses.jour !== G.jour ? G.courses : G.coursesAvant;
    if (!h) return null;
    return h.lignes.map(([cle, id, q]) => { const o = G.etals[cle] && G.etals[cle][id]; const dispo = o ? Math.min(q, o.qte) : 0; return dispo ? { cle, id, q: dispo, ok: true } : { cle: null, id, q, ok: false }; });
  },

  listeCourses(lignes = null, hier = false) {
    if (this.listeC) { this.listeC.destroy(); this.listeC = null; if (!lignes) return; }
    const G = this.G;
    this.lignesListe = lignes || this.calculerListe();
    const c = this.listeC = this.add.container(0, 0).setDepth(50);
    const fermer = () => { if (this.listeC === c) { c.destroy(); this.listeC = null; } };
    const touche = e => { if (this.listeC !== c) return; if (e.key === 'Escape' || e.key === 'l' || e.key === 'L') fermer(); else if (e.key === 'Enter') toutAcheter(); };
    if (this.input.keyboard) { this.input.keyboard.on('keydown', touche); c.once('destroy', () => this.input.keyboard && this.input.keyboard.off('keydown', touche)); }
    const T = (x, y, t, taille = 13, coul = '#3b2410', o = {}) => { const tx = this.add.text(x, y, t, style(taille, coul, { fontStyle: 'bold', ...o })); c.add(tx); return tx; };
    c.add(this.add.rectangle(480, 270, 960, 540, 0x0a0604, 0.6).setInteractive());
    T(400, 54, hier ? 'TES COURSES D’HIER' : 'TA LISTE DE COURSES', 19).setOrigin(0.5);
    T(400, 76, hier ? 'les mêmes, si les étals en ont encore ce matin' : 'faite toute seule : 2 de chaque provision, moins ce que tu as déjà', 11, '#6b4a2a', { fontStyle: 'italic' }).setOrigin(0.5);
    const bx = this.add.text(690, 44, '✕', style(18, '#8a3a1a', { fontStyle: 'bold' })).setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', fermer); c.add(bx);
    const L = this.lignesListe;
    let y = 104;
    const total = () => L.filter(l => l.ok && !l.decoche).reduce((t, l) => t + prixMarchand(G, l.cle, l.id) * l.q, 0);
    if (!L.length) { y = 196; T(400, 150, hier ? 'Tu n’as rien acheté au marché, hier.' : 'Rien ne manque : tu as de tout,\nou ta réserve est pleine.', 14, '#4a6a2a', { fontStyle: 'italic', align: 'center' }).setOrigin(0.5); }
    const groupes = {};
    for (const l of L) (groupes[l.cle || '—'] = groupes[l.cle || '—'] || []).push(l);
    let affichees = 0;
    for (const [k, ls] of Object.entries(groupes)) {
      if (affichees >= 10) break;
      T(110, y, k === '—' ? 'Introuvable ce matin' : 'Chez ' + MARCHANDS[k].nom, 13, k === '—' ? '#8a6a4a' : '#8a3a1a'); y += 22;
      for (const l of ls) {
        if (affichees++ >= 10) break;
        const actif = l.ok && !l.decoche, prix = l.ok ? prixMarchand(G, l.cle, l.id) * l.q : 0;
        const box = this.add.rectangle(130, y + 8, 16, 16, actif ? 0x2f6a2a : 0xe8d8b8).setStrokeStyle(2, 0x3b2410);
        if (l.ok) box.setInteractive({ useHandCursor: true }).on('pointerdown', () => { l.decoche = !l.decoche; Son.jouer('clic'); this.listeCourses(L, hier); });
        c.add(box); if (actif) T(130, y + 7, '✓', 13, '#fff4dc').setOrigin(0.5);
        c.add(this.add.image(160, y + 8, iconeObjet(this, l.id)).setScale(2));
        T(180, y, `${l.q} × ${nomObjet(l.id)}`, 13, actif ? '#3b2410' : '#9a8a70');
        T(690, y, l.ok ? prix + ' p.' : '—', 13, actif ? '#3b2410' : '#9a8a70').setOrigin(1, 0);
        if (!l.ok) T(360, y + 1, 'épuisé ce matin : demain, peut-être', 11, '#a03030', { fontStyle: 'italic' });
        y += 26;
      }
      y += 4;
    }
    c.add(this.add.line(0, 0, 110, y, 690, y, 0x8a6a3a).setOrigin(0));
    T(110, y + 8, 'Total', 15); T(690, y + 8, total() + ' p.', 16, '#8a3a1a').setOrigin(1, 0);
    const toutAcheter = () => {
      const choisies = L.filter(l => l.ok && !l.decoche);
      if (!choisies.length) return;
      // (v1.49) un panier à part : celui de la boutique n'est pas touché
      const aPart = {};
      for (const l of choisies) aPart[l.cle + ':' + l.id] = (aPart[l.cle + ':' + l.id] || 0) + l.q;
      const r = this.payerPanier(aPart) || {};
      fermer();
      if (r.achats && r.achats.length) {
        // le butin, qui tombe dans le baluchon
        const t = this.add.text(480, 200, 'Dans ton baluchon !', style(20, '#ffe066', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 5 })).setOrigin(0.5).setDepth(60);
        const ics = r.achats.slice(0, 6).map(([, id], i) => this.add.image(480 + (i - (Math.min(6, r.achats.length) - 1) / 2) * 50, 250, iconeObjet(this, id)).setScale(2.6).setDepth(60));
        this.tweens.add({ targets: [t, ...ics], alpha: 0, y: '+=30', delay: 1300, duration: 600, onComplete: () => { t.destroy(); ics.forEach(i => i.destroy()); } });
        if (!this.boutiqueC) this.message(r.erreur || `Courses faites : −${r.depense} p. Les marchands te saluent.`, r.erreur ? '#a03030' : '#3b2410');
      } else if (r.erreur) this.message(r.erreur, '#a03030');
    };
    const vide = !L.some(l => l.ok && !l.decoche);
    const b1 = creerBouton(this, 290, y + 62, 280, vide ? 'Rien à acheter' : `Tout acheter · ${total()} p.`, toutAcheter);
    const b2 = creerBouton(this, 560, y + 62, 220, 'Mettre au panier ▸', () => {
      const choisies = L.filter(l => l.ok && !l.decoche); if (!choisies.length) return;
      this.panier = this.panier || {};
      for (const l of choisies) this.panier[l.cle + ':' + l.id] = Math.min((this.panier[l.cle + ':' + l.id] || 0) + l.q, G.etals[l.cle][l.id].qte);
      fermer(); this.boutique(choisies[0].cle);
    });
    for (const b of [b1, b2]) { if (vide) { b.fond.setAlpha(0.5); b.label.setAlpha(0.6); } c.add([b.fond, b.label]); }
    const hierL = this.listeHier();
    const tH = T(400, y + 98, hier ? '◂ Revenir à la liste de mes commandes' : hierL ? '↺ Refaire mes courses d’hier' : '(pas encore de courses d’hier à refaire)', 12, hierL || hier ? '#2f5a8a' : '#9a8a70', { fontStyle: 'italic' }).setOrigin(0.5);
    if (hierL || hier) tH.setInteractive({ useHandCursor: true }).on('pointerdown', () => { Son.jouer('page'); this.listeCourses(hier ? this.calculerListe() : hierL, !hier); });
    T(400, y + 120, 'Clique sur une case pour décocher ce que tu ne veux pas · Entrée : tout acheter · Échap : fermer', 10, '#6b4a2a', { fontStyle: 'italic' }).setOrigin(0.5);
    // le parchemin, à la taille de la liste (glissé sous les lignes)
    const h = Math.min(500, y + 150 - 24);
    c.addAt(this.add.image(400, 24 + h / 2, panneauHD(this, 620, h)).setScale(2), 1);
  },
});
