// (v0.90) Le Carrefour (planche 17, validée le 16/10). Le soir où ta balance atteint le 2e palier
// d'un côté, deux visiteurs frappent à ta porte : le héraut de la Confrérie et la messagère des
// Bannis. Seul le camp vers lequel tu penches peut recevoir ton serment ; le chemin d'en face reste
// visible, mais barré. Tu jures, ou tu restes libre (le camp refusé reviendra une dernière fois au
// 3e palier). La même scène joue aussi le parjure : le camp trahi vient te le dire en face.
const ENVOYES = {
  bien: { nom: 'Sire Aldric', titre: 'Sire Aldric, héraut de la Confrérie', buste: { nom: 'Sire Aldric', race: 'humain', garde: true }, corps: 'heraut', lumiere: 0xffb040, lanterne: 0xffd060 },
  mal: { nom: 'Ilvane', titre: 'Ilvane, messagère des Bannis', buste: { nom: 'Ilvane Nuit-Sans-Lune', race: 'vampire', feminin: true, niveau: 'veteran' }, corps: { nom: 'Ilvane Nuit-Sans-Lune', race: 'vampire', feminin: true, niveau: 'veteran', costume: 'passeur' }, lumiere: 0x9a5aff, lanterne: 0xc89aff },
};
const PAROLES_CARREFOUR = {
  offre: {
    bien: "« Le Conseil a entendu parler de toi, marchand. Ce que tu fais pour les contrées de lumière ne passe pas inaperçu. Prête serment à la Confrérie du Dernier Rempart : nos quêtes seront les tiennes, et le royaume saura te remercier. »",
    mal: "« Ils t'offrent une bannière. Nous, on t'offre la vérité... et un toit pour ceux qu'on chasse. Personne ne te forcera, marchand. Mais un serment, chez nous, ça engage. »",
  },
  derniere: {
    bien: "« Je reviens une dernière fois, marchand. Ta lumière brille plus fort que jamais, et la Confrérie te veut toujours parmi les siens. Après ce soir, elle ne te le demandera plus. »",
    mal: "« Une dernière fois, marchand. Tu as plus d'ombre en toi que bien des nôtres. Après ce soir, on ne frappera plus à ta porte. »",
  },
  ferme: {
    bien: "« Tu sens trop la lumière pour nous, marchand. Notre porte reste fermée... pour l'instant. »",
    mal: "« Ta balance penche vers l'ombre. La Confrérie ne reçoit pas les serments des amis des Bannis. Pas ce soir. »",
  },
  parjure: {
    bien: "« Tu avais juré, marchand. Et voilà qu'on te voit tendre la main aux Bannis. La Confrérie n'oublie pas les parjures. »",
    mal: "« On t'avait ouvert notre porte. Tu l'as refermée sur nos doigts. Ne reviens pas frapper chez nous. »",
  },
};
const OFFRES_SERMENT = {
  bien: { titre: 'La Confrérie\ndu Dernier Rempart', embleme: 'confrerie', couleur: '#f6d878', contour: 0xe0b040, verres: [0x2a5ab0, 0x1e3e86, 0xe0b040, 0xf6d878, 0x3a72c8],
    lignes: ['tes gains de lumière ×1,5', '+1 client par jour', "taux d'ami à la Banque", 'plus de fouille de la garde', '1 soin sur 2 sans potion', 'un paladin escorte 1 mission/sem.', '+10 % de butin en lumière'], prix: 'les Bannis ne viendront plus' },
  mal: { titre: 'Les Bannis', embleme: 'bannis', couleur: '#d8c4ff', contour: 0xb494ff, verres: [0x4a2a7a, 0x2e1a52, 0x8a2a4a, 0x6a3aa0, 0x241640],
    lignes: ["tes gains d'ombre ×1,5", 'prêts sans intérêts (Main Noire)', 'marché noir chaque soir', 'objets interdits +10 %', 'le Passeur rend 1 baluchon/sem.', "+10 % de butin en ombre"], prix: 'la Confrérie te surveillera' },
};

const ARMEMENT_CARREFOUR = 900;   // (ms avant que les choix du Carrefour répondent aux clics)

class CarrefourScene extends Cinematique {
  constructor() { super('Carrefour'); }

  init(data) {
    this.retour = (data && data.retour) || 'Nuit';
    this.sys.settings.data = {};
  }

  create() {
    const G = this.G = window.GAME;
    this.fini = false;
    this.cameras.main.setBackgroundColor('#000000');
    this.cameras.main.fadeIn(600);
    this.creerBoiteTexte();
    for (const o of [this.boite, this.entete, this.texte, this.indice]) o.setDepth(30);
    if (!this.textures.exists('halo')) creerHalo(this);
    creerEmblemesHD(this); creerGlyphesHD(this);
    const lo = etatLO(G);
    const deroule = lo.parjure ? this.parjure(lo.parjure) : lo.carrefour ? this.carrefour(lo.carrefour) : null;
    if (!deroule) { this.finir(); return; }
    deroule.catch(e => { console.error(e); this.finir(); });
  }

  // Chaque plan pose ses objets ; le suivant efface le précédent (et ses animations)
  plan(dessiner) {
    for (const o of this.objetsPlan || []) if (o.active) o.destroy();
    this.tweens.killAll();
    this.cameras.main.scrollX = 0;
    const avant = new Set(this.children.list);
    dessiner();
    this.objetsPlan = this.children.list.filter(o => !avant.has(o) && ![this.boite, this.entete, this.texte, this.indice].includes(o));
    this.tweens.add({ targets: this.indice, alpha: 0.4, duration: 600, yoyo: true, repeat: -1 });
  }
  boiteVisible(v) { for (const o of [this.boite, this.entete, this.texte]) o.setVisible(v); if (!v) this.indice.setVisible(false); }
  async dire(entete, texte) { this.boiteVisible(true); this.ecrire(entete, texte); await this.attendreClic(); }

  // --- Les plans ---

  // La rue, le soir : les visiteurs devant ta porte, chacun sa lanterne
  rue(qui) {
    const ici = { regarder() {}, porte() {} };
    construireRue(this, 0, { jour: false, ici });
    const px = PLACES_RUE.shop, sol = SOL_PROMENADE;
    this.cameras.main.scrollX = px - 480;
    this.add.rectangle(px, 270, 960, 540, 0x0a0618, 0.35).setDepth(7);
    for (const camp of qui) {
      const e = ENVOYES[camp], x = px + (camp === 'bien' ? -250 : 250);
      this.add.image(x, sol - 90, 'halo').setScale(5).setTint(e.lumiere).setAlpha(0.45).setBlendMode('ADD').setDepth(7.2);
      this.add.image(x, sol - 60, 'halo').setScale(1.6).setTint(e.lumiere).setAlpha(0.6).setBlendMode('ADD').setDepth(8.9);
      const corps = imageCorps(this, x, sol, e.corps, 7.5).setDepth(8.5);
      if (camp === 'mal') corps.setFlipX(true);
      const lx = x + (camp === 'bien' ? 36 : -36), ly = sol - 70, g = this.add.graphics().setDepth(8.8);
      g.fillStyle(0x2a1a10).fillRect(lx - 6, ly - 10, 12, 16); g.fillStyle(e.lanterne).fillRect(lx - 4, ly - 8, 8, 12); g.fillStyle(0xffffff, 0.6).fillRect(lx - 2, ly - 6, 2, 6); g.fillStyle(0x2a1a10).fillRect(lx - 1, ly - 16, 2, 6);
    }
    this.add.image(px, sol, textureJoueur(this, this.G, 'face')).setOrigin(0.5, 1).setScale(echelleJoueur(7.5)).setDepth(8.5);
    this.boiteEnHaut(true);
  }

  // Le gros plan : un buste dans sa lumière, le décor du Carrefour derrière
  grosPlan(camp, expression) {
    const H = CARREFOUR_HD, e = ENVOYES[camp], gauche = camp === 'bien';
    this.add.image(gauche ? 0 : -960, 0, H.decor(this)).setOrigin(0).setScale(4).setDepth(0);
    this.add.rectangle(480, 270, 960, 540, gauche ? 0x2a1606 : 0x0a0618, 0.55).setDepth(1);
    this.add.image(gauche ? 300 : 660, 230, 'halo').setScale(7).setTint(gauche ? 0xffc050 : 0x9a5aff).setAlpha(0.5).setBlendMode('ADD').setDepth(1.5);
    this.add.image(gauche ? 760 : 200, 190, 'embleme_' + (gauche ? 'confrerie' : 'bannis')).setScale(3).setAlpha(0.85).setDepth(1.6);
    const b = this.add.image(gauche ? 300 : 660, 380, textureBusteHD(this, e.buste, expression)).setOrigin(0.5, 1).setScale(3.2).setDepth(2);
    if (!gauche) b.setFlipX(true);
    b.setAlpha(0); this.tweens.add({ targets: b, alpha: 1, y: 376, duration: 500 });
    this.boiteEnHaut(false);
  }

  // La page du Carrefour : le chemin qui se sépare, les deux vitraux ; `ouvert` = le côté où l'on peut jurer
  page(ouvert, { surSerment = null, surLibre = null, derniere = false } = {}) {
    const H = CARREFOUR_HD, E = 2, ferme = ouvert === 'bien' ? 'mal' : 'bien';
    this.add.image(0, 0, H.decor(this)).setOrigin(0).setScale(E);
    this.add.image(472, 392, H.poteau(this)).setOrigin(0.5, 1).setScale(E).setDepth(3);
    this.fleches = {};
    const fleche = (camp, x, y, texte) => {
      const sens = camp === 'bien' ? -1 : 1, c = this.add.container(x, y).setDepth(4);
      const g = this.add.graphics(), l = 210, h = 30, p = 18;
      const pts = (sens < 0 ? [[-l / 2 - p, 0], [-l / 2, -h / 2], [l / 2, -h / 2], [l / 2, h / 2], [-l / 2, h / 2]] : [[l / 2 + p, 0], [l / 2, -h / 2], [-l / 2, -h / 2], [-l / 2, h / 2], [l / 2, h / 2]]);
      const P = d => pts.map(([a, b]) => new Phaser.Geom.Point(a + d[0], b + d[1]));
      g.fillStyle(0x000000, 0.35).fillPoints(P([3, 4]), true);
      g.fillStyle(camp === 'bien' ? 0x2a4a9a : 0x4a2a7a).fillPoints(P([0, 0]), true);
      g.fillStyle(0xffffff, 0.12).fillRect(-l / 2, -h / 2, l, 5);
      g.lineStyle(3, camp === 'bien' ? 0xe0b040 : 0xb494ff).strokePoints(P([0, 0]), true);
      c.add(g);
      c.add(this.add.image(sens < 0 ? -l / 2 + 14 : l / 2 - 14, 0, 'glyphe_' + (camp === 'bien' ? 'soleil' : 'lune')).setScale(1.6));
      c.add(this.add.text(0, 0, texte, style(15, '#fff4dc', { fontStyle: 'bold', stroke: '#140c06', strokeThickness: 3 })).setOrigin(0.5));
      if (camp === ouvert && surSerment) {
        // (un clic de trop, pour finir de lire, ne doit pas faire jurer : les choix s'arment après un instant)
        c.setSize(l + p, h);
        this.time.delayedCall(ARMEMENT_CARREFOUR, () => { if (c.active) c.setInteractive({ useHandCursor: true }); });
        c.on('pointerover', () => c.setScale(1.06)); c.on('pointerout', () => c.setScale(1));
        c.on('pointerdown', () => { if (this.choisi) return; this.choisi = true; Son.jouer('clic'); surSerment(); });
        this.tweens.add({ targets: c, scale: 1.04, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
      this.fleches[camp] = c;
      return c;
    };
    fleche('bien', 370, 300, 'Serment à la Confrérie');
    fleche('mal', 578, 334, 'Serment aux Bannis');
    this.fleches[ferme].setAlpha(0.3);
    this.add.image(472, 480, H.borne(this)).setOrigin(0.5, 1).setScale(E).setDepth(3);
    if (surLibre) {
      const libre = creerBouton(this, 472, 500, 160, 'Rester libre', () => { if (this.choisi || !this.arme) return; this.choisi = true; surLibre(); });
      libre.fond.setDepth(6); libre.label.setDepth(7);
      this.arme = false; this.choisi = false;
      this.time.delayedCall(ARMEMENT_CARREFOUR, () => { this.arme = true; });
    }
    this.add.text(472, 526, '« La pierre ne prie personne. »', style(12, '#f3e6c8', { fontStyle: 'italic', stroke: '#140c06', strokeThickness: 3 })).setOrigin(0.5).setDepth(7);
    this.add.image(500, 418, textureJoueur(this, this.G, 'dos')).setOrigin(0.5, 1).setScale(0.5).setDepth(5);
    // les vitraux : ce que chaque camp t'offre
    for (const camp of ['bien', 'mal']) {
      const o = OFFRES_SERMENT[camp], x = camp === 'bien' ? 132 : 828;
      const v = this.add.image(x, 150, H.vitrail(this, 'cf_vit_' + camp, 120, 158, o.verres, o.contour)).setOrigin(0.5, 0).setScale(E).setDepth(2);
      this.add.image(x, 300, 'halo').setScale(3.4).setTint(o.contour).setAlpha(camp === ferme ? 0.06 : 0.22).setDepth(1.9).setBlendMode('ADD');
      const m = this.add.graphics().setDepth(2.5); m.fillStyle(0x0e0a12, 0.92).fillCircle(x, 226, 34); m.lineStyle(3, o.contour).strokeCircle(x, 226, 34);
      this.add.image(x, 228, 'embleme_' + o.embleme).setScale(1.3).setDepth(2.6);
      const p = this.add.graphics().setDepth(2.5); p.fillStyle(0x0e0a12, 0.9).fillRect(x - 108, 264, 216, 172); p.lineStyle(2, o.contour, 0.9).strokeRect(x - 108, 264, 216, 172);
      const coul = camp === ferme ? 0.45 : 1;
      this.add.text(x, 272, o.titre, style(14, o.couleur, { fontStyle: 'bold', align: 'center', lineSpacing: -2 })).setOrigin(0.5, 0).setDepth(2.6).setAlpha(coul);
      let yy = o.titre.includes('\n') ? 308 : 298;
      // (v0.95) plus d'avantages : un peu plus petit, une ligne chacun
      for (const l of o.lignes) { const t = this.add.text(x - 98, yy, '◆ ' + l, style(11, '#f3e6c8', { wordWrap: { width: 200 } })).setDepth(2.6).setAlpha(coul); if (t.width > 200) t.setScale(200 / t.width); yy += t.displayHeight; }
      this.add.text(x - 98, yy + 2, '◇ ' + o.prix, style(11, '#ff9a8a', { fontStyle: 'italic', wordWrap: { width: 200 } })).setDepth(2.6).setAlpha(coul);
      if (camp === ferme) {
        // le chemin d'en face : visible, mais barré
        v.setTint(0x5a5a6e);
        const c = this.add.graphics().setDepth(2.8); c.lineStyle(5, 0x8a8a98).strokeCircle(x, 206, 14); c.fillStyle(0x6a6a78).fillRoundedRect(x - 20, 206, 40, 32, 5); c.fillStyle(0x1a1a22).fillRect(x - 2, 216, 4, 12);
        this.add.text(x, 446, `Ce chemin t'est fermé :\nta balance penche vers ${ouvert === 'bien' ? 'la lumière' : "l'ombre"}.`, style(12, camp === 'mal' ? '#d8c4ff' : '#f6e0a0', { fontStyle: 'italic', align: 'center', backgroundColor: '#0e0a12dd', padding: { x: 8, y: 4 } })).setOrigin(0.5).setDepth(2.9);
        const voile = this.add.graphics().setDepth(2.95); voile.fillStyle(0x05030c, 0.35);
        const f = y => H.frontiere(y) * 2 + 30;
        voile.fillPoints((camp === 'mal' ? [[f(0), 0], [960, 0], [960, 540], [f(270), 540]] : [[0, 0], [f(0), 0], [f(270), 540], [0, 540]]).map(([a, b]) => new Phaser.Geom.Point(a, b)), true);
        const b = this.add.graphics().setDepth(3.2), bx = camp === 'mal' ? 574 : 330;
        for (const xx of [bx - 26, bx + 26]) { b.fillStyle(0x2a1a10).fillRect(xx - 4, 352, 9, 46); b.fillStyle(0x5a3a1e).fillRect(xx - 3, 352, 7, 44); }
        b.fillStyle(0x2a1a10).fillRect(bx - 34, 362, 70, 9); b.fillStyle(0x6a4422).fillRect(bx - 33, 363, 68, 7);
        b.fillStyle(0x2a1a10).fillRect(bx - 34, 380, 70, 8); b.fillStyle(0x5a3a1e).fillRect(bx - 33, 381, 68, 6);
        for (let k = 0; k < 8; k++) b.fillStyle(0x9a9aa8).fillCircle(bx - 26 + k * 7.4, 374 + Math.sin(k / 7 * Math.PI) * 6, 2.4);
      }
    }
    this.titre = H.plaque(this, 480, 50, 420, 78, 'Le Carrefour', derniere ? '3e palier atteint · une dernière offre' : '2e palier atteint · quel chemin prendras-tu ?').setDepth(8);
  }

  // Après le choix : le chemin juré s'illumine et l'autre s'éteint, ou bien tout reste en suspens
  apres(camp, jure, titre, sous) {
    const H = CARREFOUR_HD, f = y => H.frontiere(y) * 2 + 30;
    const voile = this.add.graphics().setDepth(2.95);
    if (jure) {
      voile.fillStyle(0x05030c, 0.62);
      voile.fillPoints((camp === 'bien' ? [[f(0), 0], [960, 0], [960, 540], [f(270), 540]] : [[0, 0], [f(0), 0], [f(270), 540], [0, 540]]).map(([a, b]) => new Phaser.Geom.Point(a, b)), true);
      const sx = camp === 'bien' ? 140 : 824, sy = camp === 'bien' ? 90 : 80, teinte = camp === 'bien' ? 0xffd060 : 0xb080ff;
      for (const [x, y, e] of camp === 'bien' ? [[440, 380, 2.2], [400, 330, 2], [380, 290, 1.8], [380, 250, 2.6]] : [[520, 380, 2.2], [560, 340, 2], [600, 300, 1.8], [620, 260, 2.6]]) this.add.image(x, y, 'halo').setScale(e).setTint(teinte).setAlpha(0.45).setBlendMode('ADD').setDepth(3.5);
      this.add.image(sx, sy, 'halo').setScale(5).setTint(teinte).setAlpha(0.45).setBlendMode('ADD').setDepth(3.5);
      const g = this.add.graphics().setDepth(3.4).setBlendMode('ADD');
      for (let k = 0; k < 7; k++) { const a0 = camp === 'bien' ? 0.15 + k * 0.12 : Math.PI - 0.2 - k * 0.12, a1 = a0 + (camp === 'bien' ? 0.05 : -0.05); g.fillStyle(camp === 'bien' ? 0xffe08a : 0xc8a0ff, 0.08); g.fillTriangle(sx, sy, sx + 600 * Math.cos(a0), sy + 600 * Math.sin(a0), sx + 600 * Math.cos(a1), sy + 600 * Math.sin(a1)); }
      this.fleches[camp === 'bien' ? 'mal' : 'bien'].setAlpha(0.15);
      // la bannière du camp se déroule sur le poteau
      const bn = this.add.graphics().setDepth(4.5), coul = camp === 'bien' ? 0x2a4a9a : 0x2e1a52, bord = camp === 'bien' ? 0xe0b040 : 0xb494ff;
      bn.fillStyle(coul).fillRect(478, 238, 46, 70); bn.fillStyle(coul).fillTriangle(478, 308, 524, 308, 501, 326); bn.lineStyle(2, bord).strokeRect(478, 238, 46, 70);
      this.add.image(501, 268, 'embleme_' + (camp === 'bien' ? 'confrerie' : 'bannis')).setScale(0.55).setDepth(4.6);
    } else {
      voile.fillStyle(0x05030c, 0.3).fillRect(0, 0, 960, 540);
      this.add.image(472, 440, 'halo').setScale(2.6).setTint(0xd8d0c0).setAlpha(0.4).setBlendMode('ADD').setDepth(3.5);
    }
    if (this.titre) this.titre.destroy();
    H.plaque(this, 480, 50, 560, 78, titre, sous).setDepth(8);
  }

  // --- Le Carrefour ---

  async carrefour(cf) {
    const G = this.G, camp = cf.camp, autre = camp === 'bien' ? 'mal' : 'bien';
    Son.jouer('clochette');
    // 1. la rue : les deux visiteurs (une dernière offre : seul le camp refusé revient)
    this.plan(() => this.rue(cf.derniere ? [camp] : ['bien', 'mal']));
    await this.dire(cf.derniere ? 'Ce soir-là, une dernière fois' : 'Ce soir-là',
      cf.derniere ? `On frappe à ta porte. ${ENVOYES[camp].nom} est revenu${camp === 'mal' ? 'e' : ''}, seul${camp === 'mal' ? 'e' : ''}, sa lanterne à la main.`
        : "Deux visiteurs t'attendent devant ta porte. L'un tient une lanterne d'or, l'autre une lanterne violette. Ils ne se regardent pas. Ils ne regardent que toi.");
    // 2. celui du camp où tu penches te fait son offre
    this.plan(() => this.grosPlan(camp, 'content'));
    await this.dire(ENVOYES[camp].titre, PAROLES_CARREFOUR[cf.derniere ? 'derniere' : 'offre'][camp]);
    // 3. l'autre te dit que sa porte reste fermée
    if (!cf.derniere) {
      this.plan(() => this.grosPlan(autre, 'fache'));
      await this.dire(ENVOYES[autre].titre, PAROLES_CARREFOUR.ferme[camp]);
    }
    // 4. le Carrefour : jurer, ou rester libre
    const choix = await new Promise(resoudre => {
      this.plan(() => this.page(camp, { surSerment: () => resoudre('serment'), surLibre: () => resoudre('libre'), derniere: cf.derniere }));
      this.boiteVisible(false);
    });
    // 5. ce qui s'ensuit
    if (choix === 'serment') {
      preterSerment(G);
      Son.jouer('clochette');
      this.apres(camp, true, 'Serment prêté', camp === 'bien' ? 'La Confrérie du Dernier Rempart te compte parmi les siens.' : 'Les Bannis te comptent parmi les leurs.');
      await this.dire(camp === 'bien' ? 'La Confrérie' : 'Les Bannis', camp === 'bien'
        ? "Tes gains de lumière comptent maintenant ×1,5, sa bannière flotte sur ton comptoir et la Banque Centrale te fait des taux d'ami. Le chemin de l'ombre se couvre de brume : les Bannis ne viendront plus chez toi."
        : "Tes gains d'ombre comptent maintenant ×1,5 et la Main Noire te prête sans intérêts. Mais la Confrérie a vu passer la lanterne violette : elle te surveillera de près.");
    } else {
      resterLibre(G);
      this.apres(camp, false, 'Tu restes libre', 'Aucun serment ne te lie.');
      await this.dire('La pierre ne prie personne', cf.derniere
        ? `${camp === 'bien' ? 'Sire Aldric' : 'Ilvane'} s'en va sans un mot. ${camp === 'bien' ? 'La Confrérie' : 'Les Bannis'} ne te ${camp === 'bien' ? 'le proposera' : 'le proposeront'} plus.`
        : `${ENVOYES[camp].nom} repart, sa lanterne à la main. ${camp === 'bien' ? 'La Confrérie' : 'Les Bannis'} reviendr${camp === 'bien' ? 'a' : 'ont'} une dernière fois si ta balance atteint le 3e palier. Et si un jour elle penche de l'autre côté, l'autre chemin pourrait s'ouvrir.`);
    }
    this.finir();
  }

  // --- Le parjure ---

  async parjure(pj) {
    const G = this.G, camp = pj.camp;
    this.plan(() => this.rue([camp]));
    await this.dire('Ce soir-là', `On frappe à ta porte, très fort. ${ENVOYES[camp].nom} est là, et sa lanterne tremble.`);
    this.plan(() => this.grosPlan(camp, 'fache'));
    await this.dire(ENVOYES[camp].titre, PAROLES_CARREFOUR.parjure[camp]);
    this.plan(() => { this.page(camp === 'bien' ? 'mal' : 'bien'); for (const f of Object.values(this.fleches)) f.setAlpha(0.3); this.apres(camp, false, 'Serment rompu', `${camp === 'bien' ? 'La Confrérie' : 'Les Bannis'} ne te ${camp === 'bien' ? 'le proposera' : 'le proposeront'} plus jamais.`); });
    await this.dire('Le parjure', `Tu perds les avantages de ton serment, et ta réputation en prend un coup (−${SERMENT.reputationParjure}). Si ta balance atteint le 2e palier de l'autre côté, l'autre camp pourra te proposer le sien.`);
    G.lo.parjure = null;
    this.finir();
  }

  finir() {
    if (this.fini) return;
    this.fini = true;
    this.cameras.main.fadeOut(500);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      const retour = this.retour;
      this.scene.stop();
      if (this.scene.isPaused(retour)) this.scene.resume(retour);
      else this.scene.start(retour);
    });
  }
}
