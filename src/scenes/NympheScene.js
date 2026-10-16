// (v0.67) La nymphe de la fontaine : après cinq vœux (puis tous les dix), un soir, une lueur bleue
// monte de la place du marché. La place dort ; l'eau de la fontaine se lève, prend une tête, une
// silhouette, un sceptre, puis devient presque humaine (voir nympheHD.js). Elle bénit les
// aventuriers pour sept jours, offre un souvenir la première fois, et en dit un peu plus à chaque
// visite sur ce que l'eau a vu... et que le village a oublié.
const PAROLES_NYMPHE = [
  // (première visite : voir premiereVisite)
  null,
  ["Encore toi... Dix pièces de plus. Tu es têtu{J}, petit{J} marchand{J} ; j'aime ça.",
    "L'eau m'a raconté des choses, depuis. Des villages entiers vidés en une nuit, puis effacés des cartes.",
    "Et ceux qui gardent ce pays jurent qu'il n'y a jamais rien eu là-bas. Étrange, non ?"],
  ["Tu reviens toujours. Alors écoute bien.",
    "Un sort d'oubli pèse sur vos têtes, à vous autres de la Comté. Il ne tient pas sur l'eau : c'est pour ça que moi, je me souviens.",
    "Je ne peux pas le briser. Mais quelqu'un qui saurait où chercher... peut-être."],
  ["Les Bannis n'ont pas toujours été bannis, tu sais.",
    "Demande aux plus vieux d'entre eux ce qu'était leur terre, avant. Écoute ce qu'ils ne disent pas."],
];
const PAROLES_NYMPHE_ENSUITE = [
  ["Te revoilà. Les rivières te saluent, et moi aussi.", "L'eau se souvient. Toi, n'oublie pas de regarder derrière les belles histoires."],
  ["Encore un vœu de plus... Je finirai par croire que c'est moi que tu viens voir.", "Va. Tes aventuriers ne craindront pas l'eau, ces jours-ci."],
];

class NympheScene extends Cinematique {
  constructor() { super('Nymphe'); }

  init(data) { this.retour = (data && data.retour) || 'Nuit'; this.sys.settings.data = {}; }

  create() {
    const G = this.G = window.GAME;
    this.rapide = false; this.fini = false;
    this.tweens.timeScale = 1; this.time.timeScale = 1;
    this.cameras.main.resetFX(); this.cameras.main.fadeIn(800);
    // la rencontre compte dès qu'on arrive (même si l'on passe la cinématique)
    this.rencontre = rencontrerNymphe(G);
    creerHalo(this); creerNympheHD(this); creerIconesHD(this);
    this.dessinerPlace();
    this.creerBoiteTexte();
    this.boutonPasser(() => {
      if (this.rapide) return;
      this.rapide = true; this.tweens.timeScale = 6; this.time.timeScale = 6; this.events.emit('passer');
    });
    this.raconter();
  }

  // La grand-place, la nuit : le ciel étoilé, les pavés, la fontaine, et toi, à l'écart
  dessinerPlace() {
    const F = FONTAINE_PROCHE, E = 2, nuit = 0x8a94c0;
    this.add.image(0, 0, paysageHD(this, 960, 320, 'comte', 1)).setOrigin(0).setScale(2);
    this.add.image(0, 300, pavesHD(this, 960, 240)).setOrigin(0).setScale(2).setTint(nuit);
    this.add.rectangle(480, 270, 960, 540, 0x0a1030, 0.35);
    const ox = 480 - F.L, oy = 500 - F.H * E;
    this.X = x => ox + x * E; this.Y = y => oy + y * E;
    this.add.ellipse(480, 500, F.L * 1.9, 46, 0x000000, 0.35);
    this.fontaine = this.add.image(480, 500, fontaineProcheHD(this)).setOrigin(0.5, 1).setScale(E).setTint(nuit);
    for (const [x, flip] of [[175, false], [785, true]]) this.add.image(x, 508, potFleursHD(this)).setOrigin(0.5, 1).setScale(2.6).setFlipX(flip).setTint(nuit);
    // l'eau du grand bassin, qui va s'allumer
    const cx = this.X(F.cx), ey = this.Y(F.eauY);
    this.eau = this.add.ellipse(cx, ey, F.eauRx * E * 2, F.eauRy * E * 2, 0x4ab8e8, 0.25).setBlendMode(Phaser.BlendModes.ADD);
    this.halo = this.add.image(cx, ey - 60, 'halo').setScale(3).setTint(0x60d8ff).setAlpha(0.15).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: this.halo, alpha: 0.3, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    // toi, au bord de la place
    this.heros = this.add.image(170, 520, textureJoueur(this, this.G, 'troisQuarts')).setOrigin(0.5, 1).setScale(echelleJoueur(6.5)).setTint(0xb8c0e0).setDepth(3);
    this.ombreSol(this.heros);
    this.cx = cx; this.ey = ey;
  }

  // Des étincelles d'eau qui montent autour d'elle
  scintiller(n = 1) {
    for (let k = 0; k < n; k++) {
      const p = this.add.circle(this.cx + (Math.random() - 0.5) * 160, this.ey - Math.random() * 30, 1.5 + Math.random() * 1.5, Math.random() < 0.5 ? 0xd8fcff : 0x8ae0e8, 0.9).setBlendMode(Phaser.BlendModes.ADD).setDepth(6);
      this.tweens.add({ targets: p, y: p.y - 80 - Math.random() * 120, x: p.x + (Math.random() - 0.5) * 40, alpha: 0, duration: 1400 + Math.random() * 900, onComplete: () => p.destroy() });
    }
  }

  // Les cinq états, de l'eau à la nymphe (ou à rebours quand elle repart)
  async transformer(aRebours = false) {
    const etats = aRebours ? [4, 3, 2, 1, 0] : [0, 1, 2, 3, 4];
    const pied = this.ey + 6;
    let avant = this.nymphe;
    for (const k of etats) {
      const img = this.add.image(this.cx, pied, 'nymphe_' + k).setOrigin(0.5, 1).setScale(2.2).setDepth(5).setAlpha(0);
      if (!avant && !aRebours) { img.setScale(2.2, 0.1); this.tweens.add({ targets: img, scaleY: 2.2, duration: 700, ease: 'Back.easeOut' }); }
      this.tweens.add({ targets: img, alpha: 1, duration: 450 });
      if (avant) { const a = avant; this.tweens.add({ targets: a, alpha: 0, duration: 450, onComplete: () => a.destroy() }); }
      avant = img;
      this.scintiller(10);
      await this.attendre(aRebours ? 380 : 900);
    }
    this.nymphe = avant;
    if (aRebours) {
      await this.animer({ targets: this.nymphe, scaleY: 0.1, alpha: 0, duration: 600, ease: 'Quad.easeIn' });
      this.nymphe.destroy(); this.nymphe = null;
    } else {
      // l'éclat de la dernière transformation, puis elle flotte doucement
      const eclat = this.add.image(this.cx, pied - 110, 'halo').setScale(1).setTint(0xd8fcff).setBlendMode(Phaser.BlendModes.ADD).setDepth(6);
      this.tweens.add({ targets: eclat, scale: 6, alpha: 0, duration: 900, onComplete: () => eclat.destroy() });
      this.tweens.add({ targets: this.nymphe, y: pied - 6, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }

  async raconter() {
    const r = this.rencontre, voix = { personne: { race: 'magicienne' }, ton: 'neutre' };
    const parle = t => this.replique('Ondine, la nymphe de la fontaine', t, voix);
    this.boiteEnHaut(true);
    await this.replique('La grand-place', "La place du marché dort. Les étals sont bâchés, les pigeons aussi... Seule la fontaine luit d'une drôle de lumière bleue.");
    this.boiteEnHaut(false);
    this.montrerBoite(false);
    Son.jouer('nymphe');
    this.tweens.add({ targets: this.eau, fillAlpha: 0.6, duration: 1500 });
    this.tweens.add({ targets: this.fontaine, tint: 0xc8f0ff, duration: 1500 });
    const pluie = this.time.addEvent({ delay: 120, loop: true, callback: () => this.scintiller(1) });
    await this.attendre(600);
    await this.transformer();
    this.emotion(this.heros, '!');
    await this.attendre(900);
    this.montrerBoite(true);
    if (r.visite === 1) {
      await parle("Cinq pièces, cinq vœux, cinq jours différents... Il y a bien longtemps qu'on ne m'avait pas appelée avec autant de patience.");
      await parle("Je suis Ondine, la gardienne des sources et des rivières. Ton argent ne m'intéresse pas ; ta constance, si.");
      await parle("Ce village a la mémoire courte, tu sais. L'eau, elle, se souvient de tout ce qui a coulé... même de ce qu'on a voulu faire oublier.");
    } else {
      // (v0.93) la 2e visite dit bien le 1er secret (il était sauté)
      const lignes = PAROLES_NYMPHE[r.visite - 1] || PAROLES_NYMPHE_ENSUITE[r.visite % PAROLES_NYMPHE_ENSUITE.length];
      for (const l of lignes) await parle(l.replaceAll('{J}', eJ()));   // (accordé à la joueuse)
    }
    await parle("Pour sept jours, l'eau sera l'amie de tes aventuriers : les rivières les porteront, les marais les épargneront, et leurs gourdes ne les trahiront pas.");
    Son.jouer('succes');
    await this.replique('La bénédiction de la nymphe', `Jusqu'au jour ${r.jusqua}, +${Math.round(NYMPHE.benediction.bonus * 100)} % aux épreuves de rivière et de marais, et à celles où il faut une gourde.`);
    if (r.souvenir) {
      // le coquillage flotte vers toi dans une bulle de lumière
      const lueur = this.add.image(this.cx - 90, this.ey - 120, 'halo').setScale(0).setTint(0x8ae0ff).setBlendMode(Phaser.BlendModes.ADD).setDepth(6.9);
      const coq = this.add.image(this.cx - 90, this.ey - 120, iconeObjet(this, NYMPHE.souvenir)).setScale(0).setDepth(7);
      this.tweens.add({ targets: coq, scale: 4, duration: 500, ease: 'Back.easeOut' });
      this.tweens.add({ targets: lueur, scale: 1.4, alpha: 0.7, duration: 500 });
      this.tweens.add({ targets: [coq, lueur], y: '-=8', duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 500 });
      await parle("Et garde ceci. Pose-le chez toi : il chante quand la pluie approche... et quand quelqu'un ment.");
      Son.jouer('trefle');
      this.tweens.killTweensOf([coq, lueur]);
      this.tweens.add({ targets: [coq, lueur], x: this.heros.x, y: this.heros.y - 120, scale: 1.2, alpha: 0, duration: 900, ease: 'Quad.easeIn', onComplete: () => { coq.destroy(); lueur.destroy(); } });
      await this.replique('Un souvenir', `Tu reçois le ${DECOS[NYMPHE.souvenir].nom}. Il t'attend dans l'arrière-boutique, avec tes décorations.`);
    }
    if (r.fiole) {
      // (v0.93) la 4e visite : une fiole d'eau de la fontaine, et ses adieux
      await parle("Prends aussi cette fiole. Elle se remplira d'elle-même, chaque semaine : de quoi soigner un de tes aventuriers.");
      Son.jouer('trefle');
      await this.replique('La fiole de la nymphe', 'Chaque semaine, une potion de plus apparaît dans ta réserve.');
    }
    if (r.derniere) {
      await parle("Je t'ai dit tout ce que l'eau sait. Ne me rappelle plus : mes vœux sont épuisés, et le reste, c'est à toi de le trouver.");
      await parle("Mais continue de jeter tes pièces. Tous les dix vœux, la fontaine brillera pour toi, et ma bénédiction reviendra.");
    } else await parle(r.visite === 1 ? "Reviens quand tu auras encore fait dix vœux. J'aurai peut-être d'autres choses à te dire." : "Dix vœux de plus, et nous reparlerons.");
    this.montrerBoite(false);
    await this.transformer(true);
    pluie.remove();
    this.tweens.add({ targets: this.eau, fillAlpha: 0.15, duration: 1200 });
    this.tweens.add({ targets: this.fontaine, tint: 0x8a94c0, duration: 1200 });
    this.tweens.add({ targets: this.halo, alpha: 0, duration: 1200 });
    this.montrerBoite(true);
    await this.replique('La grand-place', "La fontaine murmure de nouveau, comme si de rien n'était. Tu rentres chez toi, le cœur battant.");
    this.finir();
  }

  montrerBoite(oui) {
    if (!oui) this.ecrire('', '');
    for (const o of [this.boite, this.entete, this.texte]) o.setVisible(oui);
  }

  finir() {
    if (this.fini) return;
    this.fini = true;
    this.tweens.timeScale = 1; this.time.timeScale = 1;
    const nuit = this.scene.get('Nuit');
    if (nuit && nuit.lieu) Sauvegarde.planifier(this.G, nuit.lieu);
    this.cameras.main.fadeOut(500);
    this.cameras.main.once('camerafadeoutcomplete', () => { this.scene.stop(); if (this.scene.isPaused(this.retour)) this.scene.resume(this.retour); else this.scene.resume('Nuit'); });
  }
}
