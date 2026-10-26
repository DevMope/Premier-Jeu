// (v0.82, étape 10b) La forge chez soi, dans un coin de l'arrière-boutique : le foyer et son
// soufflet, l'enclume, le bac de trempe, le râtelier où sortent les armes. Aldo et Baba y
// travaillent ; le soir, on leur dit quoi forger (panneau « Ce soir à la forge », à droite).
// On y vient depuis l'arrière-boutique (le jour ou en promenade) et depuis le bureau.

// Le décor de la forge, peint une fois (480 × 270, affiché ×2)
function forgeHD(scene) {
  if (scene.textures.exists('forgeHD')) return 'forgeHD';
  const L = 300, H = 270, t = toileRepere(L, H);
  // le mur de pierre et ses poutres
  remplir(t, 'pierre', (x, y) => y < 220, (x, y) => tonBlocs(x, y, 14, 9, 2, (x, y) => (x < 120 && y > 60 ? 1 : 0)));
  for (const x of [0, 150, 294]) remplir(t, 'cheneSombre', (px, py) => px >= x && px < x + 6 && py < 220, (px) => (px === x ? 4 : 2));
  remplir(t, 'cheneSombre', (x, y) => y < 8, (x, y) => (y === 7 ? 1 : 3));
  // le sol de terre battue et de dalles
  remplir(t, 'pierre', (x, y) => y >= 220, (x, y) => tonBlocs(x, y, 20, 8, 2) - (y > 250 ? 1 : 0));
  // le foyer : une hotte de briques, l'âtre, les braises
  remplir(t, 'tuile', (x, y) => y >= 30 && y < 120 && Math.abs(x + 0.5 - 70) < 36 + (y - 30) * 0.35, (x, y) => tonBlocs(x, y, 8, 5, 2, (x) => (x < 56 ? 1 : 0)));
  remplir(t, 'pierre', (x, y) => y >= 120 && y < 220 && Math.abs(x + 0.5 - 70) < 62, (x, y) => tonBlocs(x, y, 12, 8, 3));
  remplir(t, 'rochesombre', (x, y) => y >= 140 && y < 196 && Math.abs(x + 0.5 - 70) < 40 && (y > 160 || Math.hypot(x - 70, y - 160) < 40), () => 1);
  for (let k = 0; k < 40; k++) { const x = 40 + hachage(k, 1, 2) * 60, y = 180 + hachage(k, 2, 2) * 14; t.forme('braiseR', ellipsoide(x, y, 3, 2), { decalage: 0.6, bord: false }); }
  // le soufflet de cuir, accroché à côté du foyer
  remplir(t, 'cuir', (x, y) => y >= 150 && y < 176 && x >= 134 && x < 150 + (y - 150) * 0.9, (x, y) => (y % 5 === 0 ? 1 : 3) + (x < 140 ? 1 : 0));
  remplir(t, 'chene', (x, y) => y >= 146 && y < 152 && x >= 130 && x < 176, (x) => (x % 9 === 0 ? 2 : 4));
  ligne(t, 'chene', 3, 176, 149, 196, 140, 2);
  // les outils au mur : pinces, marteaux, tisonnier
  for (const [x, l] of [[176, 34], [190, 30], [204, 38], [218, 28]]) { ligne(t, 'chene', 3, x, 40, x, 40 + l, 2); t.forme('fer', boite(x - 5, 38 + l, x + 5, 44 + l, 1), { decalage: 0.3 }); }
  for (let x = 170; x < 230; x++) t.poser(x, 38, 'fer', 3);
  // le bac de trempe, et son eau
  remplir(t, 'chene', (x, y) => y >= 196 && y < 230 && x >= 230 && x < 282, (x, y) => (y === 196 ? 5 : (x - 230) % 9 === 0 ? 1 : 3));
  for (const y of [204, 222]) for (let x = 230; x < 282; x++) t.poser(x, y, 'fer', 2);
  remplir(t, 'eau', (x, y) => y >= 198 && y < 202 && x >= 233 && x < 279, (x) => (x % 7 === 0 ? 5 : 3));
  // des sacs de charbon et une réserve de bois
  for (const [x, y] of [[20, 230], [36, 236]]) t.forme('toile', ellipsoide(x, y, 14, 10), { decalage: 0.1 });
  for (let k = 0; k < 4; k++) remplir(t, 'chene', (x, y) => y >= 236 - k * 5 && y < 241 - k * 5 && x >= 186 + (k % 2) * 3 && x < 222 + (k % 2) * 3, (x) => (x % 11 === 0 ? 2 : 4));
  t.contour();
  t.texture(scene, 'forgeHD');
  return 'forgeHD';
}

// L'enclume sur sa souche (une texture à part : Baba tape dessus)
function enclumeHD(scene) {
  if (scene.textures.exists('enclumeHD')) return 'enclumeHD';
  const t = toileRepere(60, 50);
  remplir(t, 'cheneSombre', (x, y) => y >= 26 && Math.abs(x + 0.5 - 30) < 12, (x, y) => ((y - 26) % 6 === 0 ? 1 : 3) + (x < 26 ? 1 : 0));
  remplir(t, 'fer', (x, y) => y >= 10 && y < 16 && x >= 6 && x < 54 - Math.max(0, 16 - y) * 0, (x, y) => (y === 10 ? 5 : 3) + (x < 20 ? 1 : 0));
  remplir(t, 'fer', (x, y) => y >= 10 && y < 14 && x >= 0 && x < 8 && y - 10 >= (8 - x) * 0.5, () => 3);   // la bigorne
  remplir(t, 'fer', (x, y) => y >= 16 && y < 26 && Math.abs(x + 0.5 - 30) < 9 + (y - 16) * 0.4, (x) => (x < 28 ? 3 : 2));
  t.contour();
  t.texture(scene, 'enclumeHD');
  return 'enclumeHD';
}

class ForgeScene extends Phaser.Scene {
  constructor() { super('Forge'); }

  init(data) { this.appelant = data && data.appelant; }

  create() {
    this.cameras.main.fadeIn(250);
    this.batir();
  }

  // (on rebâtit tout quand un forgeron arrive : plus simple qu'un redémarrage de la scène)
  rebatir() {
    this.time.removeAllEvents();
    this.tweens.killAll();
    this.children.removeAll(true);
    this.batir();
  }

  batir() {
    const G = this.G = window.GAME;
    etatForge(G);
    creerObjetsHD(this); creerIconesHD(this); creerHalo(this);
    this.add.rectangle(480, 270, 960, 540, 0x140c08);
    this.add.image(0, 0, forgeHD(this)).setOrigin(0).setScale(2);
    const f = G.forge;
    // la lueur du foyer, qui danse
    const lueur = this.add.image(140, 370, 'halo').setScale(5).setTint(0xff7a20).setAlpha(f.construite ? 0.5 : 0.15).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: lueur, alpha: f.construite ? 0.32 : 0.1, scale: 4.6, duration: 260, yoyo: true, repeat: -1 });
    this.add.text(360, 26, f.construite ? 'La forge' : 'Le coin de la future forge', style(24, '#f3d98a', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 5 })).setOrigin(0.5);
    // le râtelier : les armes de ta réserve, celles en « bel ouvrage » brillent
    this.ratelier();
    if (f.construite) {
      this.add.image(318, 478, enclumeHD(this)).setOrigin(0.5, 1).setScale(1.2);   // (à la bonne échelle : elle arrive à la taille des forgerons)
      this.forgerons();
    } else {
      // le chantier : des planches, un plan roulé, et Garrick qui a laissé un mot
      const mot = this.add.text(300, 300, forgeProposee(G) ? `Garrick l'a dit : il y a la place ici pour une forge.\nLe foyer et la hotte sont déjà là ; il manque l'enclume, le soufflet... et un forgeron.` : `Ce coin de l'arrière-boutique attendra les contrées à ${FORGE.etoiles} étoiles.`,
        style(14, '#f3e6c8', { fontStyle: 'italic', align: 'center', stroke: '#1a0e06', strokeThickness: 4, wordWrap: { width: 520 } })).setOrigin(0.5).setDepth(2);
      // (un bandeau sombre dessous : la phrase passe sur la hotte et les briques)
      this.add.rectangle(300, 300, mot.width + 28, mot.height + 14, 0x1a0e06, 0.72).setStrokeStyle(2, 0x6b4a2a).setDepth(1.9);
    }
    // le panneau de droite
    this.panneauForge = this.add.container(0, 0);
    this.panneau();
    creerBouton(this, 160, 510, 260, '◀ Retour', () => this.fermer());
  }

  // Aldo au soufflet, Baba à l'enclume, s'ils sont engagés ; sinon, une place vide
  forgerons() {
    const f = this.G.forge;
    if (f.baba) {
      const baba = imageCorps(this, 392, 490, 'baba', 8.4).setFlipX(true);
      // elle frappe : le corps se tasse à chaque coup, des étincelles jaillissent de l'enclume
      this.time.addEvent({ delay: 900, loop: true, callback: () => {
        this.tweens.add({ targets: baba, scaleY: baba.scaleY * 0.96, duration: 90, yoyo: true });
        if (!(typeof sonAChoisir === 'function' && sonAChoisir('marteau', { matiere: 'metal', duree: 0.5 }))) Son.jouer('marteau');   // (v1.64 : point d'accroche du marteau refait)
        for (let k = 0; k < 6; k++) { const e = this.add.circle(322, 432, 2, 0xffc060).setBlendMode(Phaser.BlendModes.ADD); this.tweens.add({ targets: e, x: 322 + Phaser.Math.Between(-50, 50), y: 432 - Phaser.Math.Between(10, 60), alpha: 0, duration: 400, onComplete: () => e.destroy() }); }
      } });
    }
    if (f.aldo) {
      const aldo = imageCorps(this, 218, 490, 'aldo', 9.2);
      this.tweens.add({ targets: aldo, scaleY: aldo.scaleY * 0.97, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });   // il pompe le soufflet
    }
  }

  ratelier() {
    const G = this.G;
    const x0 = 470, y0 = 120;
    this.add.rectangle(x0 + 55, y0 + 60, 130, 150, 0x2a1a10, 0.85).setStrokeStyle(3, 0x6a4a2a);
    this.add.text(x0 + 55, y0 - 6, 'Le râtelier', style(12, '#f3d98a', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 3 })).setOrigin(0.5);
    const armes = IDS_ARMES.filter(id => (G.stock[id] || 0) > 0);
    armes.slice(0, 12).forEach((id, i) => {
      const x = x0 + 12 + (i % 4) * 30, y = y0 + 18 + Math.floor(i / 4) * 44;
      if ((G.belOuvrage[id] || 0) > 0) { const h = this.add.image(x + 6, y + 6, 'halo').setScale(0.6).setTint(0xffe080).setAlpha(0.7).setBlendMode(Phaser.BlendModes.ADD); this.tweens.add({ targets: h, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 }); }
      this.add.image(x + 6, y + 6, iconeObjet(this, id)).setScale(1.7);
      this.add.text(x + 6, y + 26, `×${G.stock[id]}`, style(10, '#f3e6c8', { fontStyle: 'bold' })).setOrigin(0.5, 0);
    });
    if (!armes.length) this.add.text(x0 + 55, y0 + 60, 'Vide', style(12, '#a08a6a', { fontStyle: 'italic' })).setOrigin(0.5);
  }

  message(t, couleur = '#3b2410') {
    if (this.msg) this.msg.destroy();
    this.msg = this.add.text(300, 470, t, style(13, couleur === '#3b2410' ? '#fff4dc' : '#ffb0a0', { fontStyle: 'italic bold', align: 'center', wordWrap: { width: 520 }, stroke: '#1a0e06', strokeThickness: 4 })).setOrigin(0.5).setDepth(5);
    this.time.delayedCall(4000, () => { if (this.msg && this.msg.active && this.msg.text === t) this.msg.destroy(); });
  }

  // Le panneau « Ce soir à la forge » : construire, engager, choisir les armes de la nuit
  panneau() {
    const G = this.G, f = G.forge, c = this.panneauForge;
    c.removeAll(true);
    c.add(this.add.image(780, 270, panneauHD(this, 356, 528)).setScale(2));
    const X0 = 618;
    const titre = (t, y) => c.add(this.add.text(780, y, t, style(16, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
    const texte = (t, x, y, taille = 12, couleur = '#3b2410', l = 330, gras = false) => { const o = this.add.text(x, y, t, style(taille, couleur, { wordWrap: { width: l }, lineSpacing: 1, fontStyle: gras ? 'bold' : '' })); c.add(o); return o; };
    const bouton = (x, y, l, t, action, actif = true) => { const b = creerBouton(this, x, y, l, t, action); b.label.setFontSize(12); if (!actif) { b.fond.setAlpha(0.45); b.fond.disableInteractive(); } c.add([b.fond, b.label]); return b; };
    if (!f.construite) {
      titre('Construire la forge', 40);
      texte(f.achat ? 'Les ouvriers viendront cette nuit : demain matin, ta forge sera prête.' : `Un soufflet, une enclume, un bac de trempe et un râtelier : ${FORGE.prix} pièces. Ensuite, il faudra un forgeron.\n\nAvec une forge, tu as toutes les armes que tu veux, quand tu veux, du « bel ouvrage » qu'on ne trouve pas au marché, et Thorgal te vend ses matériaux en gros (−${Math.round(FORGE.remiseGros * 100)} %).`, X0, 66, 13);
      if (!f.achat) bouton(780, 300, 260, `Construire (${FORGE.prix} p.)`, () => { const e = acheterForge(G); if (e) return this.message(e, '#a03030'); Son.jouer('achat'); this.panneau(); }, forgeProposee(G) && peutPayer(G, FORGE.prix));
      return;
    }
    // les forgerons
    titre('Tes forgerons', 32);
    let y = 52;
    for (const id of ['aldo', 'baba']) {
      const d = FORGE.forgerons[id];
      const buste = this.add.image(X0 + 22, y + 46, textureBusteHD(this, { nom: d.nom, race: d.race, feminin: d.feminin, figurant: id }, 'neutre')).setOrigin(0.5, 1); buste.setScale(46 / buste.height); c.add(buste);
      texte(id === 'aldo' && f.aldo ? `Aldo, ${rangAldo(G).nom}` : d.nom, X0 + 50, y + 2, 13, '#3b2410', 220, true);
      texte(f[id] ? `${d.salaire} p. par nuit · ${id === 'baba' ? `${d.vitesse} armes par nuit` : rangAldo(G).vitesse < 1 ? '1 arme toutes les 2 nuits' : '1 arme par nuit'}${id === 'aldo' ? ` · ${f.armesAldo} forgées` : ''}` : d.description, X0 + 50, y + 20, 10, '#6b4a2a', f[id] ? 280 : 196);
      if (!f[id]) bouton(888, y + 24, 108, id === 'baba' && !babaDisponible(G) ? `À ★${d.etoiles}` : `Engager`, () => { const e = engagerForgeron(G, id); if (e) return this.message(e, '#a03030'); Son.jouer('pieces'); this.rebatir(); }, id !== 'baba' || babaDisponible(G));
      y += 56;
    }
    // ce soir
    titre('Ce soir à la forge', y + 12);
    const cap = capaciteForge(G);
    texte(cap ? (f.file.length ? `En commande : ${f.file.map(nomForge).join(', ')}` : 'Rien en commande : clique sur une arme.') : 'Engage un forgeron pour lancer la forge.', X0, y + 30, 11, '#6b4a2a', f.file.length ? 236 : 330);
    if (f.file.length) bouton(900, y + 38, 84, 'Vider', () => { while (f.file.length) annulerArme(G, f.file.length - 1); this.panneau(); });
    if (cap) texte(`Ils en sortent ${cap === 0.5 ? '1 toutes les 2 nuits' : cap % 1 ? `${Math.floor(cap)} ou ${Math.ceil(cap)} par nuit` : `${cap} par nuit`} (les matériaux sont pris tout de suite).`, X0, y + 60, 10, '#8a6a4a', 330);
    // la liste des armes à forger, avec leur recette
    const ids = [...Object.keys(RECETTES), ...(coteCamp(G) === 'mal' ? Object.keys(RECETTES_OMBRE) : [])];
    const y0 = y + 76;
    ids.forEach((id, i) => {
      const col = i % 2, x = X0 + col * 168, yy = y0 + Math.floor(i / 2) * 25;
      const peut = !peutForger(G, id);
      c.add(this.add.image(x + 9, yy + 10, iconeObjet(this, id)).setScale(1.2).setAlpha(peut ? 1 : 0.45));
      const rec = Object.entries(recetteDe(id)).map(([m, n]) => `${n} ${(MATERIAUX[m] ? MATERIAUX[m].nom : INTERDITS[m] ? INTERDITS[m].nom : ITEMS[m].nom).toLowerCase()}`).join(' + ');
      c.add(this.add.text(x + 22, yy, nomForge(id), style(10, peut ? (RECETTES_OMBRE[id] ? '#5a1a3a' : '#3b2410') : '#9a8a6a', { fontStyle: 'bold' })));
      c.add(this.add.text(x + 22, yy + 12, rec, style(9, peut ? '#6b4a2a' : '#a89a7a')));
      const zone = this.add.rectangle(x + 80, yy + 11, 164, 24, 0xffffff, 0).setInteractive({ useHandCursor: true });
      zone.on('pointerover', () => zone.setFillStyle(0xffffff, 0.25)); zone.on('pointerout', () => zone.setFillStyle(0xffffff, 0));
      zone.on('pointerdown', () => { const e = commanderArme(G, id); if (e) return this.message(e, '#a03030'); if (!(typeof sonAChoisir === 'function' && sonAChoisir('marteau', { matiere: 'metal' }))) Son.jouer('marteau'); this.panneau(); });
      c.add(zone);
    });
    texte(`Fer ${G.materiaux.fer || 0} · cuir ${G.materiaux.cuir || 0} · bois ${G.materiaux.bois || 0} · fil d'or ${G.materiaux.filOr || 0}\n(lots en gros chez Thorgal)`, X0, y0 + Math.ceil(ids.length / 2) * 25 + 2, 10, '#6b4a2a');
  }

  fermer() {
    this.cameras.main.fadeOut(200);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      const a = this.appelant;
      this.scene.stop();
      if (a) { this.scene.resume(a); const s = this.scene.get(a); if (s && s.surRetourForge) s.surRetourForge(); }
    });
  }
}
