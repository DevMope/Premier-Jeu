// (v1.48, planches 72 et 72 v2 validées) Chez Orvin, au Fil d'Argent : le salon (lambris, papier peint rayé,
// grand miroir, flacons, chauffe-serviettes, diplôme de la Guilde des barbiers des Monts, carrelage noir et blanc).
// Tu t'assieds dans le fauteuil sous la cape blanche ; Orvin monte sur son tabouret (il est nain). Dans le miroir,
// ton vrai reflet : retourné, avec la cape, la mousse, ta barbe du jour. La première fois, Orvin explique tout (le
// tuto) et le premier service est pour lui. Ensuite : laver et peigner, tailler, raser, changer de coupe ou de
// barbe, les anneaux de fête.

// Ce qui retombe sur la cape : les pixels de barbe et de cheveux du dessin (et les marques de négligence prises
// dedans), avec leur contour ; le reste est transparent
const MATIERES_POILS = ['barbe', 'cheveux'], MARQUES_POILS = ['anneauM', 'cheneSombre', 'feuilleN', 'grisN', 'miette', 'mousse'];
function poilsHorsCape(t) {
  const o = new ToileHD(t.l, t.h); o.rampes = t.rampes;
  let x0 = t.l, x1 = -1, y0 = t.h, y1 = -1;
  for (let y = 0; y < t.h; y++) for (let x = 0; x < t.l; x++) if (MATIERES_POILS.includes(t.m[y * t.l + x])) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const i = y * t.l + x, m = t.m[i];
    if (MATIERES_POILS.includes(m) || MARQUES_POILS.includes(m)) { o.c[i] = t.c[i]; o.m[i] = m; o.k[i] = t.k[i]; }
  }
  o.contour();
  // (sur le visage, pas de contour en plus : on garde le pixel d'origine ; sur la cape, le trait noir détache la barbe)
  const VISAGE = ['peau', 'levres', 'blanc', 'iris', 'oeil', 'noir', 'museau'];
  for (let i = 0; i < o.c.length; i++) if (o.m[i] === null && o.c[i] !== null && VISAGE.includes(t.m[i])) o.c[i] = t.c[i];
  return o;
}

class BarbierScene extends Phaser.Scene {
  constructor() { super('Barbier'); }
  init(data) { this.retour = (data && data.retour) || 'Rue'; this.sorti = false; this.occupe = false; this.menu = null; this.objetsMenu = []; }

  create() {
    const G = this.G = window.GAME;
    if (this.retour) this.scene.moveAbove(this.retour);
    this.cameras.main.fadeIn(350);
    creerInterieurHD(this);
    // le salon, décalé vers la gauche : le menu prend la droite
    const dx = -250; this.MX = 340 + dx;
    this.add.image(dx, 0, salonBarbierHD(this)).setOrigin(0).setScale(2);
    this.add.image(0, 460, solBarbierHD(this)).setOrigin(0).setScale(2);
    for (let k = 0; k < 3; k++) {   // la vapeur du chauffe-serviettes
      const v = this.add.ellipse(760 + dx + k * 8, 300 - k * 26, 26, 16, 0xffffff, 0.3);
      this.tweens.add({ targets: v, y: v.y - 14, alpha: 0.08, duration: 1600 + k * 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    const fx = this.fx = 300, fy = this.fy = 480, E = 4.2;
    this.add.image(fx, fy, fauteuilBarbierHD(this)).setOrigin(0.5, 1).setScale(E);
    // le reflet, dans l'ovale du miroir
    const m = this.make.graphics({ add: false }); m.fillStyle(0xffffff).fillEllipse(this.MX, 156, 184, 248); this.masque = m.createGeometryMask();
    this.reflet = this.add.image(this.MX, 345, '__DEFAULT').setOrigin(0.5, 1).setMask(this.masque).setAlpha(0.9);
    this.capeReflet = this.add.image(this.MX, 0, capeBarbierHD(this, true)).setOrigin(0.5, 0).setScale(4.2).setMask(this.masque).setAlpha(0.9);
    this.poilsReflet = this.add.image(this.MX, 345, '__DEFAULT').setMask(this.masque).setAlpha(0.9);
    this.mousseReflet = this.add.image(0, 0, mousseHD(this)).setScale(3.2).setMask(this.masque).setAlpha(0.9).setVisible(false);
    this.add.ellipse(this.MX, 156, 184, 248, 0x9ad0e0, 0.1);
    // toi, assis, sous la cape ; Orvin sur son tabouret
    this.heros = this.add.image(0, 0, '__DEFAULT');
    this.cape = this.add.image(0, 0, capeBarbierHD(this)).setOrigin(0.5, 0).setScale(4.2);
    this.poils = this.add.image(0, 0, '__DEFAULT');
    this.mousse = this.add.image(0, 0, mousseHD(this)).setScale(3.2).setVisible(false);
    this.add.image(fx + 118, fy, tabouretBarbierHD(this)).setOrigin(0.5, 1).setScale(E);
    this.orvin = imageCorps(this, fx + 118, fy - 16 * E + 4, FIGURANT_BARBIER, 10).setFlipX(true);
    this.tweens.add({ targets: this.orvin, scaleY: this.orvin.scaleY * 1.012, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.outil = this.add.image(this.orvin.x - 56, this.orvin.y - 100, ciseauxHD(this)).setScale(3.4).setFlipX(true).setAngle(-25).setVisible(false);
    this.peindre();
    // la bourse, en haut à gauche, et la bulle d'Orvin en bas
    this.bourse = this.add.text(14, 12, '', style(15, '#f3d98a', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 4 })).setDepth(50);
    this.majBourse();
    this.fondBulle = this.add.rectangle(280, 506, 548, 60, 0x1a120a, 0.9).setStrokeStyle(2, 0x8a6a3a).setDepth(48);
    this.qui = this.add.text(14, 482, 'Orvin :', style(14, '#f3d98a', { fontStyle: 'bold' })).setDepth(49);
    this.dit = this.add.text(80, 482, '', style(13, '#fff4dc', { wordWrap: { width: 470 }, lineSpacing: 2 })).setDepth(49);
    const b = etatBarbier(G);
    if (!b.vu) this.tuto(); else { this.parler(this.accueil()); this.ouvrirMenu(); }
    this.input.keyboard && this.input.keyboard.on('keydown-ESC', () => this.sortir());
  }

  accueil() {
    const e = etatPilosite(this.G);
    if (e && e.negligence >= 3) return '« Par la barbe de mon grand-père... Ça a bougé, là-dedans. Assieds-toi : on lave, on peigne, on taille. »';
    if (e && e.negligence >= 1) return `« Te voilà ! ${e.cible === 'barbe' ? 'Ta barbe' : 'Ta tignasse'} a besoin d'un bon coup de peigne, l'ami. »`;
    return auHasard(['« Ah, un habitué ! Assieds-toi, assieds-toi. »', '« Le fauteuil est chaud, les ciseaux affûtés. Qu’est-ce qu’on fait aujourd’hui ? »', '« Bienvenue au Fil d’Argent ! »']);
  }

  // La première visite : Orvin se présente et explique (le tuto)
  tuto() {
    const G = this.G, f = G.joueur.feminin, cible = f ? 'tes cheveux' : 'ta barbe';
    const pages = [
      '« Entre, entre ! Orvin Tresse-d’Argent, barbier des Monts. Chez nous, les nains, une barbe se raconte comme un livre : chaque tresse, un souvenir. »',
      `« Écoute bien : ${cible} pousse${f ? 'nt' : ''} tout seul${f ? 's' : 'e'}. Sans passer me voir, un cran tous les ${f ? BARBIER.pasCheveux : BARBIER.pas} jours, jusqu’au plus gros modèle. Et si tu le gardes trop longtemps... il se néglige. Ça se voit, et les clients le voient. »`,
      `« Ici : laver et peigner (${BARBIER.prix.laver} p.), tailler (${BARBIER.prix.tailler} p.), ${f ? '' : `raser (${BARBIER.prix.raser} p.), `}changer de coupe ou de ${f ? 'couleur' : 'barbe'}, et les anneaux de fête : un par fête passée avec les tiens. Le premier service est pour moi. »`,
    ];
    let i = 0;
    const suite = () => {
      if (i < pages.length) { this.parler(pages[i++]); return; }
      zone.destroy(); fleche.destroy();
      etatBarbier(G).vu = G.jour;
      this.ouvrirMenu();
    };
    const zone = this.add.zone(480, 270, 960, 540).setInteractive({ useHandCursor: true }).setDepth(60).on('pointerdown', suite);
    const fleche = this.add.text(540, 520, '▶', style(14, '#f3d98a', { fontStyle: 'bold' })).setDepth(61);
    this.tweens.add({ targets: fleche, alpha: 0.3, duration: 500, yoyo: true, repeat: -1 });
    suite();
  }

  parler(texte) { this.dit.setText(texte); Son.jouer('voix', { personne: { nom: 'Orvin', race: 'nain' }, ton: 'content', duree: 0.6 }); }
  majBourse() { this.bourse.setText(`Ta bourse : ${this.G.argent} p.`); }
  // un gain ou une perte affiché en direct, près de la bourse
  flotter(texte, couleur = '#ff8a6a') {
    const t = this.add.text(200, 14, texte, style(18, couleur, { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 4 })).setDepth(51);
    this.tweens.add({ targets: t, y: 44, alpha: 0, duration: 1600, ease: 'Quad.easeIn', onComplete: () => t.destroy() });
  }

  // Le joueur assis et son reflet (retourné, comme dans un vrai miroir), d'après une apparence donnée (ou celle du jour)
  peindre(apercu = null) {
    const G = this.G, f = G.joueur.feminin, st = stadeJoueur(G), E = 4.2, ap = apercu || apparenceDuJour(G);
    if (!apercu) rafraichirJoueur(this, G);
    // (les textures se repeignent sur place : le reflet et le fauteuil changent au même instant)
    const cleAssis = 'barbier_assis', cleFace = 'barbier_face';
    const ta = dessinerJoueurHD(ap, st, f, 0, G.tenue || [], 'troisQuarts', 'assis'), tf = dessinerJoueurHD(ap, st, f, 0, G.tenue || [], 'face');
    ta.texture(this, cleAssis); PIEDS_ASSIS[cleAssis] = ta.piedsAssis; this.textures.get(cleAssis).tailleAssis = ta.tailleAssis;
    tf.texture(this, cleFace);
    // la barbe (ou les cheveux longs) retombe PAR-DESSUS la cape, comme chez un vrai barbier
    poilsHorsCape(ta).texture(this, cleAssis + '_poils'); poilsHorsCape(tf).texture(this, cleFace + '_poils');
    // assis sur le fauteuil (la taille posée sur l'assise), tourné vers le miroir
    const pieds = PIEDS_ASSIS[cleAssis], taille = ta.tailleAssis !== undefined ? ta.tailleAssis : pieds - 14;
    this.heros.setTexture(cleAssis).setScale(echelleJoueur(13)).setFlipX(true);
    this.heros.setOrigin(0.5, (pieds + 1) / this.heros.height).setPosition(this.fx - 14, this.fy - 30 * E + (pieds - taille + 3) * this.heros.scaleY);
    this.poils.setTexture(cleAssis + '_poils').setScale(this.heros.scaleX).setFlipX(true).setOrigin(this.heros.originX, this.heros.originY).setPosition(this.heros.x, this.heros.y);
    const tete = this.heros.getTopCenter();
    this.cape.setPosition(this.heros.x - 6, tete.y + 66);
    this.mousse.setPosition(this.heros.x - 16, tete.y + 56);
    // le reflet : de face, retourné, avec la cape (et la mousse s'il y en a)
    this.reflet.setTexture(cleFace).setScale(echelleJoueur(13)).setFlipX(true);
    this.poilsReflet.setTexture(cleFace + '_poils').setScale(this.reflet.scaleX).setFlipX(true).setOrigin(0.5, 1).setPosition(this.reflet.x, this.reflet.y);
    const rt = this.reflet.getTopCenter();
    this.capeReflet.setPosition(this.MX, rt.y + 66);
    this.mousseReflet.setPosition(this.MX + 2, rt.y + 56);
  }

  // --- Le menu : simple et rapide, on y revient souvent ---
  viderMenu() { for (const o of this.objetsMenu) o.destroy(); this.objetsMenu = []; if (this.menu) { this.menu.detruire(); this.menu = null; } }
  ajouter(o) { this.objetsMenu.push(o); return o; }
  bouton(x, y, l, texte, action, actif = true) {
    const b = creerBouton(this, x, y, l, texte, actif ? action : () => {});
    b.fond.setDepth(41); b.label.setDepth(41.1);
    if (!actif) { b.fond.setAlpha(0.45); b.label.setAlpha(0.55); if (b.fond.disableInteractive) b.fond.disableInteractive(); }
    this.ajouter(b.fond); this.ajouter(b.label); return b;
  }
  ouvrirMenu() {
    this.viderMenu();
    const G = this.G, f = G.joueur.feminin, e = etatPilosite(G), gratuit = !etatBarbier(G).premierRasage;
    const t = (x, y, s, taille = 13, c = '#3b2410', o = {}) => this.ajouter(this.add.text(x, y, s, style(taille, c, { fontStyle: 'bold', ...o })).setDepth(41));
    this.ajouter(this.add.image(712, 262, panneauHD(this, 470, 470)).setScale(2).setDepth(40));
    t(712, 46, 'CHEZ ORVIN · LE FIL D’ARGENT', 17).setOrigin(0.5);
    if (e) {
      const quoi = e.cible === 'barbe' ? 'Ta barbe' : 'Tes cheveux';
      t(712, 72, `${quoi} : ${nomPousse(e)}${e.negligence ? ` · ${NOMS_NEGLIGENCE[e.negligence]}` : ''}`, 13, e.negligence >= 2 ? '#8a2a1a' : '#3b2410').setOrigin(0.5);
      t(712, 92, e.prochain ? `Ça poussera d’un cran dans ${pluriel(e.prochain, 'jour', 'jours')}.` : e.longueur >= e.max ? 'C’est le plus gros modèle : sans entretien, il se néglige.' : '', 11, '#6b4a2a', { fontStyle: 'italic' }).setOrigin(0.5);
    }
    if (gratuit) t(712, 112, 'Le premier service est offert par Orvin.', 12, '#2f6a2a').setOrigin(0.5);
    const prix = cle => (gratuit ? 'offert' : `${BARBIER.prix[cle]} p.`);
    const lignes = [
      ['Laver et peigner', prix('laver'), 'efface les marques du temps', () => this.service('laver'), !!(e && e.negligence)],
      ['Tailler', prix('tailler'), f ? 'ta coupe reprend sa forme' : 'ta barbe reprend sa forme', () => this.service('tailler'), !!(e && (e.longueur > e.base || e.negligence))],
    ];
    if (!f) lignes.push(['Raser', prix('raser'), 'tout recommence', () => this.service('raser'), !!(G.joueur.apparence.barbe || (e && e.longueur))]);
    lignes.push([f ? 'Changer de coupe ou de couleur' : 'Changer de coupe ou de barbe', gratuit ? 'offert' : 'selon', 'coupe 20 p. · couleur 15 p.' + (f ? '' : ' · barbe 15 p.'), () => this.changer(), true]);
    lignes.push(['Les anneaux de fête', `${BARBIER.prix.anneau} p.`, 'un par fête passée avec les tiens', () => this.anneaux(), true]);
    lignes.forEach(([n, p, d, a, actif], i) => {
      const y = 146 + i * 62;
      this.bouton(632, y, 290, n, a, actif);
      t(800, y - 8, p, 14, actif ? '#8a5a10' : '#a89880').setOrigin(0, 0.5);
      t(634, y + 29, d, 10, '#6b4a2a', { fontStyle: 'italic' }).setOrigin(0.5, 0.5);
    });
    this.bouton(712, 486, 220, 'Merci, Orvin ▸ Sortir', () => this.sortir());
  }

  // Un service : l'animation (ciseaux, mousse et rasoir, ou savon), puis le prix payé et le nouveau reflet
  service(cle) {
    if (this.occupe) return;
    const G = this.G, b = etatBarbier(G), gratuit = !b.premierRasage;
    const r = cle === 'laver' ? (gratuit ? (G.pilosite.lave = G.jour, null) : laverBarbe(G)) : cle === 'tailler' ? taillerBarbe(G, gratuit) : raserBarbe(G, gratuit);
    if (r) { this.parler(`« ${r} »`); return; }
    if (gratuit) b.premierRasage = G.jour; else this.flotter(`−${BARBIER.prix[cle]} p.`);
    this.animer(cle, () => {
      this.peindre(); this.majBourse();
      this.parler({ laver: '« Voilà ! Propre comme un sou neuf, et peigné comme un prince des Monts. »', tailler: '« Et voilà ! Net, carré, élégant. Tu fais trois ans de plus. Enfin... un an. »', raser: '« Lisse comme un galet de rivière ! Elle repoussera, va. Elle repousse toujours. »' }[cle]);
      this.ouvrirMenu();
    });
  }
  animer(cle, fin) {
    this.occupe = true;
    const G = this.G, coul = APPARENCE.cheveux[apparenceDuJour(G).cheveux][1], objets = [];
    const tete = this.heros.getTopCenter();
    if (cle === 'raser') { this.mousse.setVisible(true); this.mousseReflet.setVisible(true); }
    this.outil.setTexture(cle === 'raser' ? rasoirHD(this) : ciseauxHD(this)).setVisible(cle !== 'laver');
    const mots = { laver: 'FROTTE, FROTTE...', tailler: 'TCHIC ! TCHIC !', raser: 'SHHHK...', changer: 'TCHIC ! TCHIC !' };
    const onom = this.add.text(tete.x + 30, tete.y - 40, mots[cle], style(22, '#fff4dc', { fontStyle: 'bold', stroke: '#3b2410', strokeThickness: 6 })).setOrigin(0.5).setAngle(-8).setDepth(30);
    objets.push(onom);
    this.tweens.add({ targets: this.outil, angle: -5, duration: 160, yoyo: true, repeat: 6 });
    let k = 0;
    const ev = this.time.addEvent({ delay: 170, repeat: 10, callback: () => {
      k++;
      if (cle === 'laver') { const bulle = this.add.circle(tete.x - 30 + Math.random() * 40, tete.y + 40 + Math.random() * 30, 3 + Math.random() * 4, 0xffffff, 0.8).setStrokeStyle(1, 0x9ad0e0).setDepth(31); objets.push(bulle); this.tweens.add({ targets: bulle, y: bulle.y - 40, alpha: 0, duration: 900 }); }
      else if (cle !== 'raser' || k % 2) { const m = this.add.image(tete.x - 20 + Math.random() * 30, tete.y + 40, mecheHD(this, coul)).setScale(3).setAngle(Math.random() * 90 - 45).setDepth(31); objets.push(m); this.tweens.add({ targets: m, y: this.fy - 6, angle: m.angle + 60, duration: 700 + Math.random() * 400, ease: 'Quad.easeIn' }); }
      Son.jouer(cle === 'laver' ? 'glou' : 'glisse');
    } });
    this.time.delayedCall(2100, () => {
      ev.remove(); onom.destroy();
      this.outil.setVisible(false); this.mousse.setVisible(false); this.mousseReflet.setVisible(false);
      const v = this.add.text(tete.x + 40, tete.y - 50, 'ET VOILÀ !', style(26, '#ffe066', { fontStyle: 'bold', stroke: '#3b2410', strokeThickness: 7 })).setOrigin(0.5).setAngle(-6).setDepth(30);
      this.time.delayedCall(1400, () => { v.destroy(); for (const o of objets) if (o.active && o.texture && o.texture.key.startsWith('meche')) o.destroy(); });
      Son.jouer('pieces');
      this.occupe = false;
      fin();
    });
  }

  // Changer de coupe, de couleur ou de barbe : le menu de la création, sans le visage ni les habits ; le prix se
  // calcule en direct, le reflet change à chaque choix
  changer() {
    if (this.occupe) return;
    this.viderMenu();
    const G = this.G, f = G.joueur.feminin, avant = { ...G.joueur.apparence }, ap = { ...avant }, gratuit = !etatBarbier(G).premierRasage;
    const prixLabel = this.ajouter(this.add.text(712, 468, '', style(14, '#2a1608', { fontStyle: 'bold', backgroundColor: '#f0d890', padding: { x: 10, y: 4 } })).setOrigin(0.5).setDepth(45));
    const maj = () => { const p = prixChangement(G, avant, ap, gratuit); prixLabel.setText(gratuit ? 'Le premier est offert par Orvin' : p ? `À payer : ${p} p.` : 'Rien de changé pour l’instant'); this.peindre({ ...apparenceDuJour(G), ...ap, negligence: 0 }); };
    this.menu = panneauApparence(this, { x: 712, y: 240, l: 470, h: 400, ap, feminin: f, stade: 'adulte', barbe: !f, visage: false, habits: false, prof: 40, onglet: f ? 'coiffure' : 'barbe', quandChange: () => maj() });
    this.ajouter(this.add.text(712, 26, f ? 'TA COUPE, TA COULEUR' : 'TA COUPE, TA BARBE', style(16, '#f3e6c8', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 4 })).setOrigin(0.5).setDepth(46));
    this.bouton(660, 506, 170, 'Couper !', () => {
      const p = gratuit ? 0 : prixChangement(G, avant, ap);
      const r = changerApparenceBarbier(G, { coiffure: ap.coiffure, cheveux: ap.cheveux, barbe: ap.barbe, couleurBarbe: ap.couleurBarbe }, p);
      if (r) { this.parler(`« ${r} »`); return; }
      if (gratuit) etatBarbier(G).premierRasage = G.jour; else if (p) this.flotter(`−${p} p.`);
      this.viderMenu();
      this.animer('changer', () => { this.peindre(); this.majBourse(); this.parler('« Regarde-moi ça ! Les clients vont te prendre pour un héros revenu de mission. »'); this.ouvrirMenu(); });
    });
    this.bouton(850, 506, 170, 'Je garde tout', () => { this.peindre(); this.ouvrirMenu(); });
    this.parler('« Choisis tranquillement : regarde-toi dans le miroir avant de dire oui. »');
    maj();
  }

  // Les anneaux de fête : une coutume des nains, portés pendant leur fête
  anneaux() {
    this.viderMenu();
    const G = this.G, t = (x, y, s, taille = 13, c = '#3b2410', o = {}) => this.ajouter(this.add.text(x, y, s, style(taille, c, { fontStyle: 'bold', ...o })).setDepth(41));
    this.ajouter(this.add.image(712, 262, panneauHD(this, 470, 470)).setScale(2).setDepth(40));
    t(712, 46, 'LES ANNEAUX DE FÊTE', 17).setOrigin(0.5);
    t(712, 72, 'Un anneau par fête passée avec les siens, porté pendant sa fête.', 11, '#6b4a2a', { fontStyle: 'italic' }).setOrigin(0.5);
    [['anneauArgent', 'argent', 'Le Solstice', 'argent : la lumière de l’été'], ['anneauOr', 'or', 'Le Long Hiver', 'or : la chaleur du foyer'], ['anneauFer', 'fer', 'La Nuit des Brumes', 'fer noir : les ancêtres']].forEach(([id, metal, n, d], i) => {
      const y = 140 + i * 92;
      this.ajouter(this.add.image(520, y, anneauBarbeHD(this, metal)).setScale(5).setDepth(41));
      t(560, y - 22, n, 15); t(560, y, d, 11, '#6b4a2a', { fontStyle: 'italic' });
      if (!possede(G, id)) this.bouton(820, y, 170, `Acheter · ${BARBIER.prix.anneau} p.`, () => { const r = acheterAnneau(G, id); if (r) { this.parler(`« ${r} »`); return; } this.flotter(`−${BARBIER.prix.anneau} p.`); Son.jouer('pieces'); this.peindre(); this.majBourse(); this.parler('« Il te va bien. Porte-le pendant sa fête : les miens le remarqueront. »'); this.anneaux(); });
      else this.bouton(820, y, 170, porte(G, id) ? 'Le ranger' : 'Le porter', () => { basculerTenue(G, id); this.peindre(); this.anneaux(); });
    });
    t(712, 412, 'Pendant sa fête : +1 de relation avec les nains et tes habitués.', 12, '#2f6a2a').setOrigin(0.5);
    this.bouton(712, 486, 200, '◂ Retour', () => this.ouvrirMenu());
  }

  sortir() {
    if (this.sorti || this.occupe) return;
    this.sorti = true;
    this.viderMenu();
    Sauvegarde.maintenant(this.G, 'Rue');
    Son.jouer('porte');
    this.cameras.main.fadeOut(300);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop();
      const r = this.scene.get(this.retour);
      if (r && r.heros) { rafraichirJoueur(r, this.G); r.heros.setTexture(textureJoueur(r, this.G)); }
      this.scene.resume(this.retour);
    });
  }
}
