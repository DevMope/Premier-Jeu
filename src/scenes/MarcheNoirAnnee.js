// (v0.98, planches 27 et 28) Le marché noir toute l'année, dans la cave : le coin bar de Mère Nok
// « Au Gobelet Fêlé » (un verre, une rumeur, et les contrats de l'ombre), la fosse (les paris, et
// des combats qui doivent en mettre plein la vue) et le bras de fer de Mog. Chaque lieu s'ouvre en
// « vue » par-dessus la cave (comme le récit d'un aîné), le panneau du bas reste celui de la scène.
Object.assign(MarcheNoirScene.prototype, {

  // --- Les vues : des objets fixes à l'écran, entre la cave et le panneau du bas ---
  ouvrirVue(voile = 0.35) {
    this.fermerVue();
    this.vue = [];
    // (la cave des voyageurs, vide : les gens du soir restent derrière)
    this.vueObj(this.add.image(-960, 0, 'caveFond').setOrigin(0).setScale(2), 3.6);
    this.vueObj(this.add.rectangle(480, 270, 960, 540, 0x08050a, voile), 3.6);
    return this.vue;
  },
  vueObj(o, prof = null) { o.setScrollFactor(0); if (prof !== null) o.setDepth(prof); else if (o.depth < 3.6) o.setDepth(3.7); (this.vue = this.vue || []).push(o); return o; },
  fermerVue() {
    if (this.jeuBras) { this.jeuBras.fini = true; this.jeuBras = null; }
    if (this.espaceBras) { this.espaceBras.removeAllListeners(); this.espaceBras = null; }
    this.tweens.timeScale = 1;
    for (const o of this.vue || []) { this.tweens.killTweensOf(o); o.destroy(); }
    this.vue = [];
    this.decorOsselets = false; this.tableO = null;   // (v1.01 : la table des osselets se redessine à la prochaine vue)
  },
  corpsVue(x, y, quoi, echelle, prof = 3.75) { return this.vueObj(imageCorps(this, x, y, quoi, echelle), prof); },
  texteVue(x, y, t, taille, couleur, extra = {}, prof = 3.9) { return this.vueObj(this.add.text(x, y, t, style(taille, couleur, extra)), prof); },

  // --- Le coin bar de Mère Nok ---
  dessinerBar(accoude = null) {
    const g = this.vueObj(this.add.graphics(), 3.7), x0 = 330;
    g.fillStyle(0x2a1a10).fillRect(x0, 130, 300, 150); g.lineStyle(3, 0x1a0e08).strokeRect(x0, 130, 300, 150);
    for (let r = 0; r < 3; r++) {
      g.fillStyle(0x5a3a20).fillRect(x0 + 6, 172 + r * 44, 288, 7);
      for (let k = 0; k < 11; k++) {
        const c = [0x3a6a3a, 0x7a2a2a, 0x8a6a2a, 0x2a3a6a, 0x5a2a5a][(k * 3 + r) % 5], h = 18 + ((k * 7 + r * 3) % 4) * 4, bx = x0 + 14 + k * 26;
        g.fillStyle(c).fillRect(bx, 172 + r * 44 - h, 12, h).fillRect(bx + 4, 172 + r * 44 - h - 7, 4, 7);
        g.fillStyle(0xffffff, 0.25).fillRect(bx + 2, 172 + r * 44 - h + 3, 2, h - 6);
      }
    }
    this.texteVue(x0 + 150, 112, 'Au Gobelet Fêlé', 16, '#f3a060', { fontStyle: 'bold', stroke: '#1a0a06', strokeThickness: 4 }).setOrigin(0.5);
    for (const lx of [x0 - 30, x0 + 330]) { const h = this.vueObj(this.add.image(lx, 150, 'halo').setScale(2.6).setTint(0xff7a30).setAlpha(0.3).setBlendMode(Phaser.BlendModes.ADD), 3.7); this.tweens.add({ targets: h, alpha: 0.18, duration: 700, yoyo: true, repeat: -1 }); }
    const nok = this.corpsVue(480, 312, { nom: 'Mère Nok', race: 'gobelin', feminin: true, niveau: 'veteran', vieux: true }, 7, 3.72);
    this.tweens.add({ targets: nok, x: 470, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });   // (elle essuie ses verres, d'un bout à l'autre)
    const gc = this.vueObj(this.add.graphics(), 3.74);
    gc.fillStyle(0x4a2c16).fillRect(x0 - 20, 296, 340, 70).fillStyle(0x6a4424).fillRect(x0 - 26, 288, 352, 12);
    for (let k = 0; k < 6; k++) gc.fillStyle(0x3a2010).fillRect(x0 - 10 + k * 58, 306, 3, 56);
    gc.fillStyle(0xc8a050).fillRect(x0 + 40, 274, 10, 14).fillStyle(0x8a6a2a).fillRect(x0 + 230, 270, 14, 18).fillStyle(0xe8d8b0).fillRect(x0 + 232, 266, 10, 5);
    this.vueObj(this.add.image(250, 368, textureJoueur(this, this.G, 'troisQuarts')).setOrigin(0.5, 1).setScale(echelleJoueur(6.4)), 3.76);
    if (accoude) this.corpsVue(700, 368, accoude, 6.2, 3.76);
  },

  pageBar(message = null) {
    const G = this.G, s = soireeAnnee(G), c = s.contrat;
    this.ouvrirVue();
    this.dessinerBar(c && !c.pris ? c.banni : null);
    this.titreCoin.setText('Au Gobelet Fêlé');
    this.vider();
    const mineur = typeof ageJoueur === 'function' && ageJoueur(G) < 18;   // (v1.46 : avant 18 ans, Mère Nok sert un jus de mûre)
    this.texte(40, 374, message || (mineur ? "Mère Nok te jauge par-dessus son comptoir : « Toi ? Un jus de mûre, et estime-toi heureux. »" : "Mère Nok essuie un verre sans te regarder : « Qu'est-ce que je te sers ? Et ne me dis pas « du lait ». »"), 14, '#f3d9b0', { fontStyle: 'italic', wordWrap: { width: 880 } });
    if (c && !c.pris) this.texte(40, 420, `${c.banni.nom} s'accoude à côté de toi et pose un pli scellé sur le comptoir.`, 12, '#e8c890', { fontStyle: 'italic' });
    else if (c && c.pris) this.texte(40, 420, 'Le contrat de ce soir est déjà parti, avec ton aventurier.', 12, '#a89080', { fontStyle: 'italic' });
    this.bouton(170, 462, 260, mineur ? `Un jus de mûre (${OMBRE_ANNEE.verre} p.)` : `Un verre (${OMBRE_ANNEE.verre} p.)`, () => {
      const r = boireUnVerre(G);
      if (r.erreur) return this.pageBar(r.erreur);
      Son.jouer('glou'); this.majBourse(); this.pageBar(r.texte);
    }, peutPayer(G, OMBRE_ANNEE.verre));
    if (c && !c.pris) this.bouton(460, 462, 260, 'Ouvrir le pli scellé', () => { Son.jouer('page'); this.pageContrat(); });
    this.bouton(860, 503, 140, '◂ Retour', () => this.accueil());
  },

  // Le contrat de l'ombre : la feuille, le Banni, et qui tu envoies
  pageContrat(message = null) {
    const G = this.G, c = soireeAnnee(G).contrat;
    this.ouvrirVue(0.8);
    const g = this.vueObj(this.add.graphics(), 3.8);
    g.fillStyle(0x2a2016).fillRect(300, 40, 600, 310); g.lineStyle(3, 0xc8a050).strokeRect(300, 40, 600, 310); g.fillStyle(0x7a1a1a).fillCircle(870, 70, 16);
    this.vueObj(this.add.image(170, 360, textureBusteHD(this, c.banni, 'neutre')).setOrigin(0.5, 1).setScale(1.6), 3.8);
    this.texteVue(320, 52, `Contrat de l'ombre — « ${c.titre} »`, 16, '#f3d98a', { fontStyle: 'bold' });
    this.texteVue(320, 84, `${c.banni.nom.split(' ')[0]} : « ${c.texte} »`, 13, '#f3e6c8', { fontStyle: 'italic', lineSpacing: 4, wordWrap: { width: 575 } });
    const manque = kitManquant(G, c);
    this.texteVue(320, 160, `Qui : un de tes aventuriers (${NIVEAUX_AVENTURIER[c.niveauMin].nom.toLowerCase()} ou plus)\nÉquipement à fournir : ${c.kit.map(id => nomObjet(id).toLowerCase()).join(', ')}\nDanger : ${'★'.repeat(c.danger)}${'☆'.repeat(5 - c.danger)}\nPaie : ${c.paie} p.   ·   Durée : ${c.duree} jours   ·   ☾ (ombre)`, 13, '#f3e6c8', { lineSpacing: 6 });
    this.texteVue(320, 262, "Si ça tourne mal : l'aventurier peut ne pas revenir, et la garde se souvient des visages.", 12, '#ff9a80', { fontStyle: 'italic' });
    c.kit.forEach((id, k) => {
      g.fillStyle(0x1a120c).fillRect(320 + k * 46, 290, 38, 38); g.lineStyle(1, manque.includes(id) ? 0xc04030 : 0x6aa04a).strokeRect(320 + k * 46, 290, 38, 38);
      this.vueObj(this.add.image(339 + k * 46, 309, iconeObjet(this, id)).setScale(1.6).setAlpha(manque.includes(id) ? 0.4 : 1), 3.85);
    });
    this.texteVue(470, 302, manque.length ? `il te manque : ${manque.map(id => nomObjet(id).toLowerCase()).join(', ')}` : "← tout est dans ta réserve", 12, manque.length ? '#ff9a80' : '#a8e0a0', { fontStyle: 'italic' });
    this.titreCoin.setText("Un contrat de l'ombre");
    this.vider();
    const candidats = candidatsContrat(G, c).slice(0, 3);
    this.texte(40, 374, message || (candidats.length ? 'Qui envoies-tu ? (Il sera absent deux jours.)' : `Aucun de tes habitués n'a le niveau (${NIVEAUX_AVENTURIER[c.niveauMin].nom.toLowerCase()} ou plus), ou ils se remettent de leurs blessures.`), 14, '#f3d9b0', { fontStyle: 'italic', wordWrap: { width: 880 } });
    candidats.forEach((h, i) => {
      const ch = chanceContrat(c, h), mot = ch >= 0.7 ? 'bonnes' : ch >= 0.5 ? 'moyennes' : 'minces';
      this.bouton(160 + i * 280, 440, 260, `${h.nom.split(' ')[0]} (${NIVEAUX_AVENTURIER[h.niveau || 'novice'].nom}) · chances ${mot}`, () => {
        const e = accepterContrat(G, h.nom);
        if (e) return this.pageContrat(e);
        Son.jouer('tampon'); this.majBourse();
        this.pageBar(`${c.banni.nom.split(' ')[0]} glisse le pli dans sa manche : « ${h.nom.split(' ')[0]} partira cette nuit. Dans deux jours, tu auras de ses nouvelles. Ou pas. »`);
      }, !manque.length);
    });
    this.bouton(860, 503, 140, 'Refuser', () => this.pageBar(`${c.banni.nom.split(' ')[0]} reprend son pli sans rien dire. « On ne t'en voudra pas... cette fois. »`));
  },

  // --- La fosse ---
  dessinerFosse(cb) {
    const g = this.vueObj(this.add.graphics(), 3.7);
    g.fillStyle(0x1a120c).fillEllipse(480, 300, 440, 116).fillStyle(0x3a2a1c).fillEllipse(480, 296, 400, 90);
    for (let k = 0; k < 120; k++) { const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()); g.fillStyle(Math.random() < 0.5 ? 0x4a3826 : 0x2e2016).fillRect(480 + Math.cos(a) * r * 190, 296 + Math.sin(a) * r * 40, 3, 2); }
    // les pieux et la corde, derrière ; puis la foule
    const pieux = this.vueObj(this.add.graphics(), 3.71);
    for (let k = 0; k < 18; k++) { const a = Math.PI * (k / 17), x = 480 - Math.cos(a) * 220, y = 300 - Math.sin(a) * 56; pieux.fillStyle(0x4a3018).fillRect(x - 3, y - 26, 6, 30); }
    pieux.lineStyle(2, 0x8a6a40).beginPath(); for (let k = 0; k <= 17; k++) { const a = Math.PI * (k / 17), x = 480 - Math.cos(a) * 220, y = 300 - Math.sin(a) * 56 - 18; if (k === 0) pieux.moveTo(x, y); else pieux.lineTo(x, y); } pieux.strokePath();
    for (const [x, y] of [[230, 210], [730, 210]]) { const h = this.vueObj(this.add.image(x, y, 'halo').setScale(4).setTint(0xff6a20).setAlpha(0.3).setBlendMode(Phaser.BlendModes.ADD), 3.7); this.tweens.add({ targets: h, alpha: 0.18, duration: 500, yoyo: true, repeat: -1 }); }
    this.foule = [];
    for (const [x, r, f] of [[130, 'gobelin', 0], [200, 'vampire', 1], [760, 'loupgarou', 0], [830, 'momie', 1], [895, 'gobelin', 1]]) {
      const p = this.corpsVue(x, 368, { nom: 'Badaud ' + x, race: r, feminin: !!f, niveau: 'aguerri' }, 5.4, 3.78).setFlipX(x > 480).setTint(0xb8a098);
      this.foule.push(p);
      this.tweens.add({ targets: p, y: 362, duration: 260 + (x % 7) * 40, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: x % 300 });
    }
    // les deux combattants, face à face
    this.combattants = [
      this.corpsVue(400, 318, cb.a, 7, 3.74),
      this.corpsVue(560, 318, cb.b, 7, 3.74).setFlipX(true),
    ];
    this.combattants.forEach((p, i) => this.tweens.add({ targets: p, y: 314, duration: 500 + i * 90, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }));
  },

  // --- (v1.20, planche 47 v3) La mise noire : Grisouille, au pied de l'escalier, prend les paris CONTRE les aventuriers ---
  pageParisNoirs(message = null) {
    const G = this.G, cibles = cibleParisNoirs(G), enCours = enMission(G).filter(p => p.voyageur.pariNoir);
    this.ouvrirVue(0.2);
    creerBoursesHD(this);
    this.titreCoin.setText('Les paris contre');
    // l'ardoise accrochée au mur, écrite à la craie
    this.vueObj(this.add.image(800, 112, panneauHD(this, 236, 152, 'ardoise')).setScale(2), 3.8);
    const craie = (x, y, t, taille = 13, c = '#ece6d6', o = 0) => this.vueObj(this.add.text(x, y, t, style(taille, c, { fontStyle: 'bold' })).setOrigin(o, 0.5).setAlpha(0.92), 3.81);
    craie(800, 52, 'PARIS CONTRE', 14, '#f4eedc', 0.5);
    this.vueObj(this.add.rectangle(800, 63, 140, 2, 0xece6d6, 0.7), 3.81);
    const lignes = [...enCours.map(p => [p, true]), ...cibles.map(p => [p, false])].slice(0, 3);
    if (!lignes.length) craie(800, 110, 'personne en route', 12, '#b8b2a2', 0.5);
    lignes.forEach(([p, pris], i) => {
      craie(696, 78 + i * 34, p.voyageur.nom.length > 18 ? p.voyageur.nom.slice(0, 17) + '…' : p.voyageur.nom, 11, pris ? '#f0c870' : '#ece6d6');
      craie(696, 92 + i * 34, ZONES[p.voyageur.zone] ? ZONES[p.voyageur.zone].nom : '', 9, '#b8b2a2');
      craie(906, 84 + i * 34, pris ? `${p.voyageur.pariNoir.mise} p. ✓` : `${String(coteContre(p)).replace('.', ',')} contre 1`, 12, '#f0c870', 1);
    });
    // Grisouille et sa bourse sur un vieux tonneau ; toi en face
    const tg = this.vueObj(this.add.graphics(), 3.77);
    tg.fillStyle(0x3a2412).fillRoundedRect(740, 318, 44, 50, 6).fillStyle(0x5a3a1e).fillRoundedRect(743, 321, 38, 44, 5);
    tg.fillStyle(0x7a7e86).fillRect(740, 328, 44, 4).fillRect(740, 354, 44, 4); tg.fillStyle(0x2a1a0c).fillRect(760, 321, 2, 44);
    this.vueObj(this.add.image(762, 320, 'bourseHD3').setOrigin(0.5, 1).setScale(1.8), 3.79);
    const gob = this.corpsVue(705, 368, { nom: 'Grisouille', race: 'gobelin', niveau: 'veteran' }, 5.4, 3.78).setFlipX(true);
    this.tweens.add({ targets: gob, scaleY: gob.scaleY * 1.02, duration: 700, yoyo: true, repeat: -1 });
    this.vueObj(this.add.image(610, 368, textureJoueur(this, G, 'troisQuarts')).setOrigin(0.5, 1).setScale(echelleJoueur(6.4)), 3.78);
    // le panneau du bas
    this.vider();
    const cible = cibles[0];
    const dit = !cible ? "Grisouille, le preneur de paris : « Personne en route sur qui parier ce soir. Envoie-moi des aventuriers, et reviens. »"
      : `Grisouille, le preneur de paris : « Tu paries qu'il n'en revient pas ? ${String(coteContre(cible)).replace('.', ',')} contre 1 sur ${cible.voyageur.nom.split(' ')[0]}. Personne n'en saura rien... »`;
    this.texte(40, 374, message || dit, 14, '#f3d9b0', { fontStyle: 'italic', wordWrap: { width: 880 } });
    if (cible) this.texte(40, 400, 'La cote suit ses vraies chances : bien équipé, elle monte. Ton flair les connaît aussi.', 12, '#c8a890', { fontStyle: 'italic', wordWrap: { width: 880 } });
    if (cibles.length && parisNoirsEnCours(G) < MISE_NOIRE.max) {
      const [mn, mx] = MISE_NOIRE.mise;
      this.miseNoire = Phaser.Math.Clamp(this.miseNoire || 30, mn, mx);
      const texteMise = this.texte(160, 440, `Mise : ${this.miseNoire} p.`, 15, '#f3d98a', { fontStyle: 'bold' }).setOrigin(0.5);
      const changer = d => { this.miseNoire = Phaser.Math.Clamp(this.miseNoire + d, mn, Math.min(mx, Math.max(mn, G.argent))); texteMise.setText(`Mise : ${this.miseNoire} p.`); };
      this.bouton(70, 440, 50, '−', () => changer(-MISE_NOIRE.pas));
      this.bouton(250, 440, 50, '+', () => changer(MISE_NOIRE.pas));
      const n = Math.min(3, cibles.length), l = n === 1 ? 300 : n === 2 ? 250 : 180;
      cibles.slice(0, n).forEach((p, i) => this.bouton(300 + l / 2 + 20 + i * (l + 10), 440, l, `Contre ${p.voyageur.nom.split(' ')[0]} (${String(coteContre(p)).replace('.', ',')} contre 1)`, () => {
        const r = parierContre(G, p, this.miseNoire);
        if (r.erreur) return this.pageParisNoirs(r.erreur);
        Sauvegarde.maintenant(G, 'Nuit');
        Son.jouer('pieces'); this.majBourse();
        this.pageParisNoirs(`Grisouille crache dans sa main et tope : « ${this.miseNoire} p. contre ${p.voyageur.nom.split(' ')[0]}, à ${String(r.cote).replace('.', ',')} contre 1. S'il échoue, je te paie. »`);
      }, peutPayer(G, this.miseNoire)));
    } else if (cibles.length) this.texte(40, 440, "« Trois paris à la fois, c'est assez. »", 13, '#a89080', { fontStyle: 'italic' });
    this.texte(40, 482, "S'il échoue (sans rien, ou mort), ta mise × la cote. Un geste d'ombre (☾), et la Faucheuse s'y intéresse.", 11, '#b89a80', { fontStyle: 'italic' });
    this.bouton(860, 503, 140, '◂ Retour', () => this.accueil());
  },

  pageFosse(message = null) {
    const G = this.G, cb = soireeAnnee(G).combat;
    this.ouvrirVue();
    this.dessinerFosse(cb);
    this.titreCoin.setText('La fosse');
    this.vider();
    const prenom = p => p.nom.split(' ')[0];
    if (cb.pari) {
      const r = cb.resultat, gagnant = r.gagnant ? cb.b : cb.a;
      this.texte(40, 374, message || `Le combat de ce soir est fini : ${prenom(gagnant)} a gagné. ${r.gain ? `Tu as encaissé ${r.gain} pièces.` : 'Ta mise est perdue.'}`, 14, '#f3d9b0', { fontStyle: 'italic', wordWrap: { width: 880 } });
      this.combattants[1 - r.gagnant].setAngle(r.fin === 'ko' ? (r.gagnant ? -88 : 88) : 0).setAlpha(r.fin === 'ko' ? 0.9 : 1);
      this.bouton(860, 503, 140, '◂ Retour', () => this.accueil());
      return;
    }
    this.miseFosse = Phaser.Math.Clamp(this.miseFosse || 10, OMBRE_ANNEE.fosse.mise[0], OMBRE_ANNEE.fosse.mise[1]);
    this.texte(40, 374, message || `Ce soir : ${cb.a.nom} contre ${cb.b.nom}. La foule tape du pied.`, 14, '#f3d9b0', { fontStyle: 'italic', wordWrap: { width: 880 } });
    this.texte(40, 400, `Ton flair : ${indiceFosse(G)}`, 12, '#e8c890', { fontStyle: 'italic', wordWrap: { width: 880 } });
    const texteMise = this.texte(160, 440, `Mise : ${this.miseFosse} p.`, 15, '#f3d98a', { fontStyle: 'bold' }).setOrigin(0.5);
    const changer = d => { this.miseFosse = Phaser.Math.Clamp(this.miseFosse + d, OMBRE_ANNEE.fosse.mise[0], Math.min(OMBRE_ANNEE.fosse.mise[1], Math.max(OMBRE_ANNEE.fosse.mise[0], G.argent))); texteMise.setText(`Mise : ${this.miseFosse} p.`); Son.jouer('piece'); };
    this.bouton(70, 440, 50, '−', () => changer(-5));
    this.bouton(250, 440, 50, '+', () => changer(5));
    [cb.a, cb.b].forEach((p, i) => this.bouton(440 + i * 260, 440, 240, `Parier sur ${prenom(p)} (${String(cb.cotes[i]).replace('.', ',')} contre 1)`, () => {
      const r = parierFosse(G, i, this.miseFosse);
      if (r.erreur) return this.pageFosse(r.erreur);
      Sauvegarde.maintenant(G, 'Nuit');   // (v1.07 : le pari est joué ; recharger la page ne rend plus la mise)
      Son.jouer('pieces'); this.majBourse();
      this.combatFosse(cb, r, i);
    }, peutPayer(G, this.miseFosse)));
    this.texte(40, 480, 'Celui qui gagne double presque toujours ta mise... si tu as misé sur le bon.', 11, '#a89080', { fontStyle: 'italic' });
    this.bouton(860, 503, 140, '◂ Retour', () => this.accueil());
  },

  // Le combat : de vrais échanges, des esquives, la poussière, la foule ; et une fin qui claque
  // (le K.O. n'est pas systématique : aux points, abandon, l'arbitre, ou un coup bas).
  combatFosse(cb, r, choix) {
    this.bloqueCoins = true;
    this.vider();
    const [A, B] = this.combattants;
    for (const p of [A, B]) { this.tweens.killTweensOf(p); p.y = 318; }
    const base = [A.x, B.x];
    const noms = [cb.a.nom.split(' ')[0], cb.b.nom.split(' ')[0]];
    const titre = this.texte(480, 448, '', 18, '#ffcf70', { fontStyle: 'bold', stroke: '#1a0806', strokeThickness: 5 }).setOrigin(0.5);
    const cri = (t, x, y, coul = '#ffb090', taille = 14) => {
      const o = this.texteVue(x, y, t, taille, coul, { fontStyle: 'italic bold', stroke: '#1a0a06', strokeThickness: 4 }, 3.95).setOrigin(0.5).setScale(0.3);
      this.tweens.add({ targets: o, scale: 1, duration: 160, ease: 'Back.easeOut' });
      this.tweens.add({ targets: o, alpha: 0, y: y - 30, delay: 700, duration: 400, onComplete: () => o.destroy() });
    };
    const poussiere = (x, y, n = 10, coul = 0x8a6a4a) => {
      for (let i = 0; i < n; i++) {
        const p = this.vueObj(this.add.circle(x, y, Phaser.Math.Between(2, 5), coul, 0.8), 3.77);
        const a = Math.random() * Math.PI * 2, d = Phaser.Math.Between(20, 60);
        this.tweens.add({ targets: p, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d * 0.4 - 10, alpha: 0, scale: 1.8, duration: Phaser.Math.Between(350, 700), onComplete: () => p.destroy() });
      }
    };
    const flashBlanc = (o) => { o.setTintFill(0xffffff); this.time.delayedCall(70, () => o.active && o.clearTint()); };
    const crisFoule = ['« Allez ! »', '« Défonce-le ! »', '« Ouuuh ! »', '« Encore ! »', '« Debout ! »', '« À terre ! »'];
    const huer = () => cri(Phaser.Utils.Array.GetRandom(crisFoule), Phaser.Math.Between(140, 820), Phaser.Math.Between(150, 230), '#e8d0b0', 12);
    // L'entrée : le nom des combattants claque à l'écran, la foule rugit
    const ouverture = this.texteVue(480, 120, `${noms[0]}  ⚔  ${noms[1]}`, 34, '#ffd070', { fontStyle: 'bold', stroke: '#1a0806', strokeThickness: 7 }, 3.95).setOrigin(0.5).setScale(3).setAlpha(0);
    this.tweens.add({ targets: ouverture, scale: 1, alpha: 1, duration: 260, ease: 'Cubic.easeIn', onComplete: () => { this.cameras.main.shake(180, 0.012); Son.jouer('impact'); } });
    this.tweens.add({ targets: ouverture, alpha: 0, delay: 1300, duration: 400 });
    Son.jouer('foule', { duree: 2.2 });
    // Les échanges, l'un après l'autre
    let t = 1600;
    r.coups.forEach((c, i) => {
      this.time.delayedCall(t, () => {
        const att = this.combattants[c.qui], def = this.combattants[1 - c.qui], sens = c.qui === 0 ? 1 : -1;
        if (!att || !att.active) return;
        titre.setText(c.touche ? `${noms[c.qui]} frappe ! ${noms[1 - c.qui]} encaisse.` : `${noms[c.qui]} attaque... ${noms[1 - c.qui]} esquive !`);
        // l'élan : il recule pour prendre son élan, puis bondit
        this.tweens.add({ targets: att, x: att.x - sens * 14, duration: 120, ease: 'Sine.easeOut', yoyo: false, onComplete: () => {
          this.tweens.add({ targets: att, x: def.x - sens * 46, angle: sens * 8, duration: 110, ease: 'Cubic.easeIn', onComplete: () => {
            if (c.touche) {
              Son.jouer('impact'); flashBlanc(def); this.cameras.main.shake(120, 0.009);
              poussiere(def.x, 300, 8);
              cri(Phaser.Utils.Array.GetRandom(['BAM !', 'CRAC !', 'PAF !', 'BOUM !']), def.x, 200, '#ffffff', 22);
              this.tweens.add({ targets: def, x: def.x + sens * 34, angle: sens * 12, duration: 140, ease: 'Cubic.easeOut', yoyo: false, onComplete: () => this.tweens.add({ targets: def, angle: 0, duration: 260 }) });
            } else {
              Son.jouer('siffle');
              this.tweens.add({ targets: def, y: 330, scaleY: def.scaleY * 0.85, duration: 90, yoyo: true });   // il se baisse
              cri('Esquive !', def.x, 210, '#a8e0ff', 16);
            }
            this.tweens.add({ targets: att, angle: 0, duration: 220 });
            if (Math.random() < 0.6) huer();
            // chacun reprend sa garde, à distance (sinon ils finissent l'un dans l'autre)
            this.time.delayedCall(420, () => { if (!A.active) return; this.tweens.add({ targets: A, x: base[0] + Phaser.Math.Between(-12, 18), duration: 260, ease: 'Sine.easeOut' }); this.tweens.add({ targets: B, x: base[1] + Phaser.Math.Between(-18, 12), duration: 260, ease: 'Sine.easeOut' }); });
          } });
        } });
      });
      t += 900;
    });
    // On se replace au centre avant la fin
    this.time.delayedCall(t, () => { this.tweens.add({ targets: A, x: base[0] + 20, duration: 300 }); this.tweens.add({ targets: B, x: base[1] - 20, duration: 300 }); });
    t += 450;
    this.time.delayedCall(t, () => this.finCombat(cb, r, choix, noms, { cri, poussiere, flashBlanc, titre }));
  },

  finCombat(cb, r, choix, noms, { cri, poussiere, flashBlanc, titre }) {
    const g = r.gagnant, gagnant = this.combattants[g], perdant = this.combattants[1 - g], sens = g === 0 ? 1 : -1;
    const conclure = (texteFin, delai) => this.time.delayedCall(delai, () => {
      this.tweens.timeScale = 1; this.bloqueCoins = false;
      const moi = r.gain ? `Tu avais misé sur ${noms[choix]} : tu encaisses ${r.gain} pièces !` : `Tu avais misé sur ${noms[choix]} : ta mise est perdue.`;
      if (r.gain) Son.jouer('pieces'); else Son.jouer('refus');
      this.majBourse();
      this.vider();
      this.texte(40, 374, `${texteFin} ${moi}`, 14, r.gain ? '#a8e0a0' : '#f3d9b0', { fontStyle: 'italic', wordWrap: { width: 880 } });
      this.bouton(860, 503, 140, '◂ Retour', () => this.accueil());
    });
    if (r.fin === 'ko') {
      // Le K.O. : la cave retient son souffle, bandes noires, ralenti... et le dernier coup
      const haut = this.vueObj(this.add.rectangle(480, -30, 960, 60, 0x000000), 3.93), bas = this.vueObj(this.add.rectangle(480, 400, 960, 60, 0x000000), 3.93);
      this.tweens.add({ targets: haut, y: 30, duration: 300 }); this.tweens.add({ targets: bas, y: 342, duration: 300 });
      titre.setText('...');
      this.time.delayedCall(450, () => {
        this.tweens.timeScale = 0.35;
        this.tweens.add({ targets: gagnant, x: perdant.x - sens * 44, angle: sens * 14, duration: 160, ease: 'Cubic.easeIn', onComplete: () => {
          this.tweens.timeScale = 1;
          const eclair = this.vueObj(this.add.rectangle(480, 270, 960, 540, 0xffffff, 0.9), 3.94);
          this.tweens.add({ targets: eclair, alpha: 0, duration: 260, onComplete: () => eclair.destroy() });
          Son.jouer('impact'); Son.jouer('coup'); this.cameras.main.shake(380, 0.022);
          flashBlanc(perdant); poussiere(perdant.x, 310, 22, 0x9a7a54);
          this.tweens.add({ targets: perdant, x: perdant.x + sens * 18, y: 326, angle: sens * 88, duration: 520, ease: 'Bounce.easeOut', onComplete: () => poussiere(perdant.x, 320, 16) });
          this.tweens.add({ targets: gagnant, angle: 0, duration: 400 });
          const ko = this.texteVue(480, 170, 'K.O. !', 64, '#ff4a2a', { fontStyle: 'bold', stroke: '#1a0806', strokeThickness: 9 }, 3.95).setOrigin(0.5).setScale(4).setAlpha(0);
          this.tweens.add({ targets: ko, scale: 1, alpha: 1, duration: 220, ease: 'Cubic.easeIn' });
          this.time.delayedCall(500, () => { Son.jouer('foule', { duree: 2.6, fort: 1.6 }); for (const p of this.foule || []) this.tweens.add({ targets: p, y: p.y - 18, duration: 140, yoyo: true, repeat: 3 }); this.tweens.add({ targets: gagnant, y: 300, duration: 200, yoyo: true, repeat: 2 }); });
          this.tweens.add({ targets: [haut, bas, ko], alpha: 0, delay: 2200, duration: 500 });
          conclure(`K.O. ! ${noms[g]} envoie ${noms[1 - g]} au tapis.`, 2600);
        } });
      });
      return;
    }
    if (r.fin === 'points') {
      titre.setText('Les deux tiennent debout...');
      for (const p of [gagnant, perdant]) this.tweens.add({ targets: p, scaleY: p.scaleY * 0.96, duration: 400, yoyo: true, repeat: 2 });   // ils soufflent
      this.time.delayedCall(1300, () => {
        Son.jouer('cloche');
        cri('Victoire aux points !', 480, 160, '#ffd070', 26);
        this.tweens.add({ targets: gagnant, y: 296, duration: 220, yoyo: true, repeat: 3 });
        Son.jouer('foule', { duree: 1.8 });
      });
      return conclure(`Aux points ! ${noms[g]} l'emporte de peu.`, 3000);
    }
    if (r.fin === 'abandon') {
      this.tweens.add({ targets: perdant, scaleY: perdant.scaleY * 0.78, y: 326, angle: -sens * 6, duration: 500 });   // à genoux
      this.time.delayedCall(600, () => { cri('« Assez ! J\'abandonne ! »', perdant.x, 190, '#ffffff', 16); Son.jouer('aie'); });
      this.time.delayedCall(1400, () => { cri('Abandon !', 480, 150, '#ffd070', 28); Son.jouer('foule', { duree: 1.4 }); this.tweens.add({ targets: gagnant, y: 298, duration: 200, yoyo: true, repeat: 2 }); });
      return conclure(`${noms[1 - g]} met un genou à terre et abandonne.`, 3000);
    }
    if (r.fin === 'arbitre') {
      Son.jouer('cloche');
      this.time.delayedCall(200, () => { this.cameras.main.shake(150, 0.008); cri('L\'arbitre arrête le combat !', 480, 150, '#ffd070', 22); });
      this.tweens.add({ targets: perdant, angle: sens * 10, x: perdant.x + sens * 16, duration: 250, yoyo: true, repeat: 2 });   // il titube
      this.time.delayedCall(1400, () => Son.jouer('foule', { duree: 1.6 }));
      return conclure(`${noms[1 - g]} titube : l'arbitre arrête tout et donne la victoire à ${noms[g]}.`, 3000);
    }
    // Le coup bas : celui qui frappe sous la ceinture est disqualifié
    const tricheur = this.combattants[r.tricheur], victime = this.combattants[1 - r.tricheur], s2 = r.tricheur === 0 ? 1 : -1;
    this.tweens.add({ targets: tricheur, x: victime.x - s2 * 40, y: 330, duration: 140, ease: 'Cubic.easeIn', onComplete: () => {
      Son.jouer('impact'); flashBlanc(victime); this.cameras.main.shake(120, 0.01);
      this.tweens.add({ targets: victime, scaleY: victime.scaleY * 0.85, angle: -s2 * 10, duration: 200, yoyo: true });
      this.tweens.add({ targets: tricheur, y: 318, duration: 200 });
      cri('Coup bas !', victime.x, 190, '#ff6a50', 24);
      this.time.delayedCall(700, () => { Son.jouer('foule', { duree: 1.8 }); cri('« Houuuu ! »', 300, 200, '#e8d0b0', 16); cri('« Tricheur ! »', 660, 210, '#e8d0b0', 16); });
      this.time.delayedCall(1500, () => { Son.jouer('cloche'); cri('Disqualifié !', 480, 150, '#ffd070', 28); });
    } });
    conclure(`Coup bas ! ${noms[r.tricheur]} est disqualifié : ${noms[g]} gagne sans finir le combat.`, 3200);
  },

  // --- Le bras de fer : Grisk le gobelin, Mog l'orc, Bourk le troll (de plus en plus forts) ---
  dessinerBrasDeFer(a) {
    const corps = { nom: a.nom, race: a.race, niveau: a.niveau };
    if (a.race === 'gobelin') {   // (Grisk monte sur un tonneau pour être à ta hauteur)
      const t = this.vueObj(this.add.graphics(), 3.71);
      t.fillStyle(0x5a3a1c).fillRoundedRect(532, 328, 56, 42, 8).fillStyle(0x6a4624).fillRect(538, 328, 44, 42);
      t.fillStyle(0x3a3a40).fillRect(532, 334, 56, 4).fillRect(532, 360, 56, 4).lineStyle(2, 0x2a1a0c).strokeRoundedRect(532, 328, 56, 42, 8);
      this.advCorps = this.corpsVue(560, 330, corps, 6.2, 3.72).setFlipX(true);
    } else this.advCorps = this.corpsVue(a.race === 'troll' ? 572 : 560, 352, corps, a.race === 'troll' ? 6.6 : 6.4, 3.72).setFlipX(true);
    this.advX = this.advCorps.x;
    this.vueObj(this.add.image(405, 352, textureJoueur(this, this.G, 'troisQuarts')).setOrigin(0.5, 1).setScale(echelleJoueur(6.4)), 3.72);
    const ga = this.vueObj(this.add.graphics(), 3.75);
    ga.fillStyle(0x4a3018).fillRect(360, 296, 240, 16).fillStyle(0x5a3a20).fillRect(360, 296, 240, 4).fillStyle(0x3a2410).fillRect(375, 312, 14, 56).fillRect(571, 312, 14, 56);
    this.brasG = this.vueObj(this.add.graphics(), 3.76);
    this.advBrasStyle = { gobelin: { peau: 0x6a9a3a, poing: 0x5a8a2a, manche: 0x6a5a30, epaule: [540, 278], ep: 9 }, orc: { peau: 0x5a8a3a, poing: 0x4a7a2a, manche: 0x6a4a2a, epaule: [546, 264], ep: 12 }, troll: { peau: 0x9a9284, poing: 0x8a8274, manche: 0x5a6a2a, epaule: [556, 244], ep: 15 } }[a.race];
    this.dessinerBras(0.5);
    for (const [x, r] of [[180, 'vampire'], [760, a.race === 'gobelin' ? 'orc' : 'gobelin'], [840, 'loupgarou']]) { const p = this.corpsVue(x, 368, { nom: 'Spectateur ' + x, race: r, niveau: 'aguerri' }, 5.4, 3.71).setFlipX(x > 480).setTint(0xb8a098); this.tweens.add({ targets: p, y: 364, duration: 600 + x % 200, yoyo: true, repeat: -1 }); }
  },
  // Les deux avant-bras qui se rejoignent : ils penchent selon qui gagne (p = 1 : tu as gagné)
  dessinerBras(p) {
    const g = this.brasG, st = this.advBrasStyle; if (!g || !g.active || !st) return;
    g.clear();
    // les coudes posés sur la table, les mains serrées au-dessus ; p = 1 : son bras est plaqué de son côté
    const a = (p - 0.5) * 2.4, cx = 480, cy = 294, L = 34;
    const fx = cx + Math.sin(a) * L, fy = cy - Math.cos(a) * L;
    const moi = [[418, 268], [462, cy]], lui = [st.epaule, [498, cy]];
    g.lineStyle(11, 0x3a5a8a).lineBetween(moi[0][0], moi[0][1], moi[1][0], moi[1][1]);   // (la manche)
    g.lineStyle(st.ep + 1, st.manche).lineBetween(lui[0][0], lui[0][1], lui[1][0], lui[1][1]);
    g.lineStyle(9, 0xe8b890).lineBetween(moi[1][0], moi[1][1], fx - 3, fy);
    g.lineStyle(st.ep, st.peau).lineBetween(lui[1][0], lui[1][1], fx + 3, fy);
    g.fillStyle(0xd8a880).fillCircle(fx - 3, fy, 8); g.fillStyle(st.poing).fillCircle(fx + 4, fy - 2, st.ep * 0.75);
  },

  pageBrasDeFer(message = null, id = null) {
    const G = this.G, s = soireeAnnee(G), b = brasDeFerDe(G);
    // (par défaut : le plus fort de ceux que tu peux affronter)
    if (id) this.advBras = id;
    if (!this.advBras || !brasDebloque(G, this.advBras)) this.advBras = [...ADVERSAIRES_BRAS].reverse().find(x => brasDebloque(G, x.id)).id;
    const a = adversaireBras(this.advBras), prenom = a.nom.split(' ')[0];
    this.ouvrirVue();
    this.dessinerBrasDeFer(a);
    this.titreCoin.setText(`Le bras de fer · ${prenom} ${a.titre}`);
    this.vider();
    this.texte(40, 374, message || a.defi, 14, '#f3d9b0', { fontStyle: 'italic', wordWrap: { width: 880 } });
    this.texte(40, 424, `Mise : ${a.mise} p. · si tu gagnes : ta mise doublée, et le respect des Bannis. (Tes victoires contre ${prenom} : ${b.victoires[a.id] || 0}.)`, 12, '#e8c890', { fontStyle: 'italic' });
    ADVERSAIRES_BRAS.forEach((x, k) => {
      const ouvert = brasDebloque(G, x.id), choisi = x.id === a.id;
      this.bouton(170 + k * 250, 458, 236, ouvert ? `${choisi ? '▸ ' : ''}${x.nom.split(' ')[0]} ${x.titre} (${['facile', 'moyen', 'difficile'][k]})` : `🔒 Bats d'abord ${ADVERSAIRES_BRAS[k - 1].nom.split(' ')[0]}`, () => this.pageBrasDeFer(null, x.id), ouvert && !choisi);
    });
    if (!(s.brasDeFer || {})[a.id]) this.bouton(240, 500, 300, `Défier ${prenom} (${a.mise} p.)`, () => {
      const e = commencerBrasDeFer(G, a.id);
      if (e) return this.pageBrasDeFer(e);
      Sauvegarde.maintenant(G, 'Nuit');
      Son.jouer('pieces'); this.majBourse(); this.jeuBrasDeFer(a);
    }, peutPayer(G, a.mise));
    else this.texte(40, 500, `${prenom} se masse le bras : une fois par soir.`, 13, '#a89080', { fontStyle: 'italic' }).setOrigin(0, 0.5);
    this.bouton(860, 503, 140, '◂ Retour', () => this.accueil());
  },

  // Le mini-jeu : le repère fait l'aller-retour sur la barre ; un clic dans le vert fait pencher
  // le bras de Mog, un clic à côté lui redonne l'avantage. Il pousse sans arrêt.
  jeuBrasDeFer(a) {
    const G = this.G, prenom = a.nom.split(' ')[0];
    this.vider();
    const jeu = this.jeuBras = { p: 0.5, x: 0, sens: 1, fini: false, temps: 0, coup: 0 };
    this.bloqueCoins = true;
    const gb = this.vueObj(this.add.graphics(), 3.9);
    this.texteVue(280, 102, 'Toi', 12, '#a8e0a0', { fontStyle: 'bold' });
    this.texteVue(680, 102, prenom, 12, '#ffb0a0', { fontStyle: 'bold' }).setOrigin(1, 0);
    this.texteVue(480, 190, 'clique (ou Espace) quand le repère passe dans le vert', 11, '#e8d4a8', { fontStyle: 'italic', stroke: '#1a0a06', strokeThickness: 3 }).setOrigin(0.5);
    this.texte(40, 380, 'Le bras de fer !', 16, '#f3d98a', { fontStyle: 'bold' });
    const zone = this.vueObj(this.add.rectangle(480, 270, 960, 540, 0x000000, 0.001).setInteractive(), 3.95);
    const vert = a.vert;
    const dessiner = () => {
      gb.clear();
      gb.fillStyle(0x1a120c).fillRect(280, 120, 400, 22); gb.fillStyle(0x2a6a2a).fillRect(280, 120, 400 * jeu.p, 22); gb.fillStyle(0x8a2a1a).fillRect(280 + 400 * jeu.p, 120, 400 * (1 - jeu.p), 22); gb.fillStyle(0xf3d98a).fillRect(277 + 400 * jeu.p, 114, 6, 34);
      gb.fillStyle(0x1a120c).fillRect(380, 160, 200, 14); gb.fillStyle(0x4aa04a).fillRect(380 + 200 * vert[0], 160, 200 * (vert[1] - vert[0]), 14); gb.fillStyle(0xffffff).fillRect(378 + 200 * jeu.x, 156, 4, 22);
      this.dessinerBras(jeu.p);
    };
    const taper = () => {
      if (jeu.fini) return;
      if (jeu.x >= vert[0] && jeu.x <= vert[1]) { jeu.p = Math.min(1, jeu.p + 0.1); Son.jouer('coup'); this.cameras.main.shake(60, 0.004); }
      else { jeu.p = Math.max(0, jeu.p - 0.06); Son.jouer('grogne'); }
    };
    zone.on('pointerdown', taper);
    const espace = this.input.keyboard && this.input.keyboard.addKey('SPACE');
    if (espace) { espace.removeAllListeners(); espace.on('down', taper); this.espaceBras = espace; }
    const finir = gagne => {
      if (jeu.fini) return;
      jeu.fini = true; this.jeuBras = null; this.bloqueCoins = false;
      if (espace) espace.removeAllListeners();
      zone.disableInteractive();
      const avant = ADVERSAIRES_BRAS.filter(x => brasDebloque(G, x.id)).length;
      finirBrasDeFer(G, gagne, a.id);
      this.majBourse();
      if (gagne) { Son.jouer('fanfare'); this.cameras.main.shake(250, 0.012); this.tweens.add({ targets: this.advCorps, angle: 6, duration: 200, yoyo: true }); }
      else Son.jouer('refus');
      const suivant = ADVERSAIRES_BRAS.filter(x => brasDebloque(G, x.id)).length > avant ? ADVERSAIRES_BRAS[avant] : null;
      this.time.delayedCall(900, () => this.pageBrasDeFer((gagne ? `${a.victoire} (+${a.mise} p., respect des Bannis)` : a.defaite) + (suivant ? ` Au fond de la cave, ${suivant.nom.split(' ')[0]} ${suivant.titre} se lève : il veut t'affronter.` : ''), a.id));
    };
    const pousse = forceAdversaire(G, a.id);
    // (le temps réel de la scène : sur une machine lente, le repère ne ralentit pas)
    const maj = (t, delta) => {
      if (jeu.fini || !gb.active) { this.events.off('update', maj); return; }
      const dt = Math.min(0.2, delta / 1000);   // (même sur une machine lente, la partie dure le même temps)
      jeu.temps += dt;
      jeu.x += jeu.sens * dt / a.balayage; if (jeu.x > 1) { jeu.x = 1; jeu.sens = -1; } if (jeu.x < 0) { jeu.x = 0; jeu.sens = 1; }
      jeu.p -= pousse * dt;
      if (this.advCorps && this.advCorps.active) this.advCorps.x = this.advX + Math.sin(jeu.temps * 40) * (1 - jeu.p) * 1.5;   // il force, il tremble
      dessiner();
      if (jeu.p >= 1) { this.events.off('update', maj); finir(true); } else if (jeu.p <= 0 || jeu.temps > 30) { this.events.off('update', maj); finir(false); }
    };
    this.events.on('update', maj);
    dessiner();
  },
});
