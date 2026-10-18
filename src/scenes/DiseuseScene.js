// (v1.05, lot B-4, planche 23 validée) Sous la tente de Madame Ysmée : ses tentures violettes semées d'étoiles,
// la table ronde et sa nappe à franges d'or, la boule de cristal, la bougie, les cartes, et son chat noir au bout
// de la table. La première fois : la tente s'ouvre toute seule, les bougies s'allument, les cartes se retournent.
// Ensuite, pour 2 pièces le matin, une carte : le présage du jour. Quand elle se trompe, rien dans ses paroles ;
// seulement, avec du flair, la flamme qui vacille, une carte à l'envers, le chat qui détourne la tête.

// La tente dans la rue (le jour, l'entrée est ouverte et la lanterne brille ; la nuit, les rideaux sont tirés)
function tenteDiseuse(scene, x, y, jour) {
  const g = scene.add.graphics().setDepth(1.5);
  g.fillStyle(0x000000, 0.3).fillEllipse(x, y + 4, 230, 18);
  g.fillStyle(0x4a2a6a).fillTriangle(x - 105, y, x + 105, y, x, y - 170);
  for (let k = -3; k <= 3; k++) g.fillStyle(k % 2 ? 0x5e3a86 : 0x3a1e56).fillTriangle(x + k * 30 - 15, y, x + k * 30 + 15, y, x, y - 170);
  g.fillStyle(jour ? 0x1a0a24 : 0x4a2a6a).fillTriangle(x - 34, y, x + 34, y, x, y - 92);   // l'entrée
  if (jour) g.fillStyle(0xd8b048).fillTriangle(x - 34, y, x - 22, y, x - 6, y - 70).fillTriangle(x + 34, y, x + 22, y, x + 6, y - 70);   // les rideaux noués
  else g.lineStyle(2, 0x2a1440).lineBetween(x, y - 92, x, y).fillStyle(0xd8b048).fillRect(x - 3, y - 50, 6, 4);
  g.lineStyle(3, 0x6a4a2a).lineBetween(x, y - 170, x, y - 205); g.fillStyle(0xd8b048).fillTriangle(x, y - 205, x + 26, y - 197, x, y - 189);
  for (const [sx, sy] of [[x - 50, y - 60], [x + 46, y - 80], [x - 20, y - 120], [x + 60, y - 30]]) g.fillStyle(0xf3d98a).fillRect(sx - 1, sy - 4, 2, 8).fillRect(sx - 4, sy - 1, 8, 2);
  // la lanterne violette, qui palpite
  g.fillStyle(0x3a2a1a).fillRect(x - 62, y - 80, 4, 12).fillStyle(0xc890f0).fillRect(x - 68, y - 68, 16, 14);
  creerHalo(scene);
  const l = scene.add.image(x - 60, y - 61, 'halo').setScale(0.55).setTint(0xb070f0).setAlpha(jour ? 0.45 : 0.7).setBlendMode(Phaser.BlendModes.ADD).setDepth(1.6);
  scene.tweens.add({ targets: l, alpha: jour ? 0.2 : 0.4, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  // l'écriteau
  const pan = scene.add.graphics().setDepth(1.6);
  pan.fillStyle(0x5a3a20).fillRect(x - 150, y - 40, 6, 40).fillStyle(0xe8d4a8).fillRect(x - 178, y - 66, 64, 34).lineStyle(2, 0x5a3a20).strokeRect(x - 178, y - 66, 64, 34);
  scene.add.text(x - 146, y - 57, 'Madame Ysmée', style(9, '#4a2a6a', { fontStyle: 'bold' })).setOrigin(0.5).setDepth(1.7);
  scene.add.text(x - 146, y - 42, `présages · ${DISEUSE.prix} p.`, style(8, '#5a3a20', { fontStyle: 'italic' })).setOrigin(0.5).setDepth(1.7);
}

// Le dessin de chaque carte (sur sa face d'ivoire)
const DESSINS_CARTES = {
  corbeau(g) { g.fillStyle(0x1a1410).fillEllipse(0, -6, 30, 18).fillTriangle(10, -10, 26, -16, 14, -2).fillTriangle(-14, -8, -30, -24, -6, -14).fillTriangle(-12, -2, -26, 8, -4, 2); g.fillStyle(0xe8c040).fillCircle(8, -10, 2); },
  roue(g) { g.lineStyle(3, 0x6a4a2a).strokeCircle(0, -6, 18); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; g.lineBetween(0, -6, Math.cos(a) * 18, -6 + Math.sin(a) * 18); } g.fillStyle(0xd8a830).fillCircle(0, -6, 5); },
  tour(g) { g.fillStyle(0x7a7a88).fillRect(-10, -26, 20, 40).fillStyle(0x5a5a68).fillRect(-14, -30, 6, 6).fillRect(-3, -30, 6, 6).fillRect(8, -30, 6, 6); g.fillStyle(0x2a1a10).fillRect(-4, 2, 8, 12).fillRect(-3, -16, 6, 7); g.fillStyle(0xf0c040).fillTriangle(16, -34, 24, -24, 12, -26); },
  etoile(g) { const p = []; for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 7 : 18; p.push({ x: Math.cos(a) * r, y: -6 + Math.sin(a) * r }); } g.fillStyle(0xe8b830).fillPoints(p, true); g.fillStyle(0xfff4b0).fillCircle(-3, -9, 3); },
  soleil(g) { for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; g.fillStyle(0xf0a030).fillTriangle(Math.cos(a) * 12, -6 + Math.sin(a) * 12, Math.cos(a + 0.25) * 22, -6 + Math.sin(a + 0.25) * 22, Math.cos(a + 0.5) * 12, -6 + Math.sin(a + 0.5) * 12); } g.fillStyle(0xf8d040).fillCircle(0, -6, 12); g.fillStyle(0x8a5a10).fillCircle(-4, -8, 1.5).fillCircle(4, -8, 1.5); g.lineStyle(1, 0x8a5a10).beginPath(); g.arc(0, -5, 5, 0.3, Math.PI - 0.3); g.strokePath(); },
};

class DiseuseScene extends Phaser.Scene {
  constructor() { super('Diseuse'); }

  init(data) { this.retour = (data && data.retour) || 'Rue'; this.occupe = false; }

  create() {
    const G = this.G = window.GAME;
    if (this.retour) this.scene.moveAbove(this.retour);
    creerHalo(this);
    this.cameras.main.fadeIn(500);
    // les tentures violettes, semées d'étoiles d'or
    const dr = this.add.graphics();
    for (let k = 0; k < 16; k++) dr.fillStyle(k % 2 ? 0x3a1e56 : 0x2a1440).fillRect(k * 60, 0, 60, 540);
    dr.fillStyle(0x4a2a6a).fillTriangle(0, 0, 220, 0, 0, 300).fillTriangle(960, 0, 740, 0, 960, 300);
    let s = 5; const rnd = (a, b) => { s = (s * 16807) % 2147483647; return a + (s / 2147483647) * (b - a); };
    for (let k = 0; k < 40; k++) { const x = rnd(0, 960), y = rnd(0, 300); dr.fillStyle(0xd8b048, 0.6).fillRect(x, y - 2, 1, 5).fillRect(x - 2, y, 5, 1); }
    // Madame Ysmée, derrière sa table : elle respire, cligne des yeux
    this.ysmee = { nom: 'Madame Ysmée', race: 'humain', feminin: true, vieux: true, costume: 'diseuse' };
    this.buste = this.add.image(480, 318, textureBusteHD(this, this.ysmee, 'neutre')).setOrigin(0.5, 1).setScale(2.6);
    this.tweens.add({ targets: this.buste, scaleY: 2.63, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.time.addEvent({ delay: 3600, loop: true, callback: () => { if (!this.buste.active) return; this.buste.setTexture(textureBusteHD(this, this.ysmee, 'neutre', { cligne: true })); this.time.delayedCall(140, () => this.buste.active && this.buste.setTexture(textureBusteHD(this, this.ysmee, this.humeur || 'neutre'))); } });
    // la table ronde, sa nappe pourpre et ses franges d'or ; la boule de cristal
    const t = this.add.graphics();
    t.fillStyle(0x4a1e3a).fillEllipse(480, 360, 700, 120).fillStyle(0x6a2a50).fillEllipse(480, 350, 680, 100);
    for (let k = -6; k <= 6; k++) t.fillStyle(0xd8b048).fillCircle(480 + k * 52, 404 - Math.abs(k) * 3, 4);
    this.boule = this.add.image(480, 338, 'halo').setScale(1.1).setTint(0x80c0ff).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: this.boule, alpha: 0.18, scale: 1.25, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    t.fillStyle(0x3a2a1a).fillRect(458, 356, 44, 12); t.fillStyle(0xa8d0f0, 0.85).fillCircle(480, 338, 22).fillStyle(0xffffff, 0.6).fillCircle(472, 330, 6);
    // la bougie et sa flamme
    const bx = this.bx = 690, by = this.by = 340;
    t.fillStyle(0xf0e8d0).fillRect(bx - 7, by - 46, 14, 46).fillStyle(0x3a2a1a).fillRect(bx - 2, by - 52, 3, 6);
    this.flamme = this.add.graphics(); this.flamme.fillStyle(0xffc040).fillEllipse(0, 0, 12, 24).fillStyle(0xfff0a0).fillEllipse(0, 4, 6, 12);
    this.flamme.setPosition(bx, by - 62).setScale(0);
    this.lueur = this.add.image(bx, by - 62, 'halo').setScale(0.6).setTint(0xffc060).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD);
    // son chat noir, au bout de la table (la queue bat)
    creerChatHD(this, { pelage: 'noir', yeux: 'or', collier: 'aucun' }, 'chatDiseuse');
    this.chat = this.add.image(820, 352, 'chatDiseuse_assis0').setOrigin(0.5, 1).setScale(3.2).setFlipX(true);
    this.time.addEvent({ delay: 700, loop: true, callback: () => this.chat.active && this.chat.setTexture(this.chat.texture.key.endsWith('0') ? 'chatDiseuse_assis1' : 'chatDiseuse_assis0') });
    // les quatre cartes, face cachée
    this.cartes = [300, 380, 580, 660].map((x, i) => this.carte(x, 398 + (i % 2) * 4, null));
    // le bandeau des paroles, les boutons
    this.add.rectangle(480, 498, 960, 84, 0x0a0410, 0.88);
    this.bourse = bourse(this, 40, 532, G.argent, { echelle: 1.3, taille: 13, aDroite: true });
    this.indice = this.add.text(950, 534, '', style(11, '#c8b090', { fontStyle: 'italic' })).setOrigin(1, 1);
    this.boutons = [];
    if (!G.ysmeeVue) { G.ysmeeVue = G.jour; this.decouverte(); } else { this.allumer(true); this.accueil(); }
  }

  // Une carte (face cachée si `id` est nul), dans un conteneur qu'on peut retourner
  carte(x, y, id, renverse = false) {
    const c = this.add.container(x, y), g = this.add.graphics();
    g.fillStyle(0x1a0e06).fillRoundedRect(-36, -54, 72, 108, 6).fillStyle(id ? 0xf0e0b8 : 0x4a2a6a).fillRoundedRect(-33, -51, 66, 102, 5);
    c.add(g);
    if (!id) { g.lineStyle(2, 0xd8b048).strokeRoundedRect(-27, -45, 54, 90, 4); g.fillStyle(0xd8b048).fillCircle(0, 0, 8); }
    else {
      const d = this.add.graphics(); DESSINS_CARTES[id](d); c.add(d);
      c.add(this.add.text(0, 36, PRESAGES[id].nom.toUpperCase(), style(8, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
    }
    if (renverse) c.setAngle(180);
    return c;
  }

  dire(texte) {
    if (this.ligne) this.ligne.destroy();
    this.ligne = texteMixte(this, 480, 484, texte, { taille: 15, largeur: 900, align: 'center', extra: { stroke: '#0a0410', strokeThickness: 4 } }).setOrigin(0.5, 0.5).setAlpha(0);
    this.tweens.add({ targets: this.ligne, alpha: 1, duration: 500 });
  }
  viderBoutons() { for (const b of this.boutons) { b.fond.destroy(); b.label.destroy(); } this.boutons = []; }
  bouton(x, l, texte, fn) { const b = creerBouton(this, x, 522, l, texte, fn); this.boutons.push(b); return b; }

  // La bougie s'allume (d'un coup, ou d'elle-même pendant la découverte)
  allumer(vite) {
    this.tweens.add({ targets: this.flamme, scale: 1, duration: vite ? 1 : 600, ease: 'Back.easeOut' });
    this.tweens.add({ targets: this.lueur, alpha: 0.28, duration: vite ? 1 : 600 });
    this.tweens.add({ targets: this.flamme, scaleY: 1.12, duration: 380, yoyo: true, repeat: -1, delay: 620 });
  }

  // La première visite : la tente s'ouvre toute seule, la bougie s'allume, les cartes se retournent seules
  decouverte() {
    this.occupe = true;
    const gauche = this.add.rectangle(240, 270, 480, 540, 0x2a1440).setDepth(20), droite = this.add.rectangle(720, 270, 480, 540, 0x3a1e56).setDepth(20);
    const fil = this.add.graphics().setDepth(21); fil.fillStyle(0xd8b048); for (let k = 0; k < 9; k++) fil.fillRect(476, 30 + k * 60, 8, 24);
    this.time.delayedCall(700, () => {
      Son.jouer('vent');
      this.tweens.add({ targets: gauche, x: -260, duration: 1500, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: droite, x: 1220, duration: 1500, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: fil, alpha: 0, duration: 600 });
    });
    this.time.delayedCall(2000, () => { this.allumer(false); Son.jouer('clochette'); });
    this.cartes.forEach((c, i) => this.time.delayedCall(2600 + i * 450, () => {
      this.tweens.add({ targets: c, scaleX: 0, duration: 160, yoyo: true, onYoyo: () => { const id = Object.keys(PRESAGES)[i]; const n = this.carte(c.x, c.y, id); c.removeAll(true); c.add(n.list.slice()); n.destroy(); } });
      Son.jouer('page');
    }));
    this.time.delayedCall(4800, () => {
      this.dire("La tente s'est ouverte toute seule. Une vieille femme au foulard violet lève les yeux de ses cartes : « Entre, petit marchand. Les cartes m'avaient dit que tu viendrais. Je suis Ysmée. »");
      this.indice.setText('▶ clique pour continuer');
      this.input.once('pointerdown', () => {
        this.indice.setText('');
        // les cartes retournent d'elles-mêmes face contre la nappe
        this.cartes.forEach((c, i) => this.time.delayedCall(i * 120, () => this.tweens.add({ targets: c, scaleX: 0, duration: 140, yoyo: true, onYoyo: () => { const n = this.carte(c.x, c.y, null); c.removeAll(true); c.add(n.list.slice()); n.destroy(); } })));
        this.time.delayedCall(700, () => { this.occupe = false; this.accueil(); });
      });
    });
  }

  // L'accueil : la carte du jour (si elle est déjà tirée), sinon l'offre
  accueil() {
    const G = this.G, p = presageDuJour(G);
    this.viderBoutons();
    if (p) { this.montrerPresage(p, true); return; }
    const refus = refusPresage(G);
    this.dire(refus || `« Une carte pour ta journée ? ${DISEUSE.prix} pièces, et je te dis ce qu'elle cache. »`);
    if (!refus) this.bouton(380, 230, `Tirer une carte (${DISEUSE.prix} p.)`, () => this.tirer());
    this.bouton(refus ? 480 : 640, 160, 'Sortir', () => this.sortir());
  }

  tirer() {
    if (this.occupe) return;
    const G = this.G, r = tirerPresage(G);
    if (r.erreur) { this.dire(r.erreur); return; }
    this.occupe = true; this.viderBoutons();
    Son.jouer('pieces'); this.bourse.maj(G.argent);
    this.dire("Ses mains ridées battent les cartes, les étalent sur la nappe... puis s'arrêtent sur l'une d'elles.");
    // elle bat les cartes : elles glissent et se croisent
    this.cartes.forEach((c, i) => this.tweens.add({ targets: c, x: 480 + (i - 1.5) * 30, duration: 300, yoyo: true, hold: 200, delay: i * 60, ease: 'Sine.easeInOut' }));
    this.time.delayedCall(1300, () => { this.occupe = false; this.montrerPresage(r, false); });
  }

  // La carte du jour se retourne au milieu ; si elle se trompe, les petits détails que le flair permet de voir
  montrerPresage(p, deja) {
    const G = this.G;
    const choisie = this.cartes[1];
    this.tweens.add({ targets: choisie, x: 480, y: 402, duration: deja ? 1 : 400, ease: 'Sine.easeOut' });
    this.time.delayedCall(deja ? 1 : 420, () => {
      this.tweens.add({ targets: choisie, scaleX: 0, duration: deja ? 1 : 180, yoyo: true, onYoyo: () => { const n = this.carte(480, 402, p.id); choisie.removeAll(true); choisie.add(n.list.slice()); n.destroy(); if (p.indices.includes('carte')) choisie.setAngle(180); } });
      if (!deja) Son.jouer('page');
      // les indices d'un présage trompeur
      if (p.indices.includes('flamme')) { this.tweens.killTweensOf(this.flamme); this.flamme.setAngle(-55); this.tweens.add({ targets: this.flamme, angle: -35, duration: 260, yoyo: true, repeat: -1 }); }
      if (p.indices.includes('chat')) this.chat.setFlipX(false);
      this.humeur = 'neutre';
      this.dire(PRESAGES[p.id].dit + (deja ? " Elle rassemble ses cartes : « C'est tout pour aujourd'hui. »" : ''));
      this.viderBoutons();
      this.bouton(480, 180, 'Sortir', () => this.sortir());
    });
  }

  sortir() {
    if (this.sorti) return;
    this.sorti = true;
    Son.jouer('porte');
    this.cameras.main.fadeOut(300);
    this.cameras.main.once('camerafadeoutcomplete', () => { this.scene.stop(); this.scene.resume(this.retour); });
  }
}
