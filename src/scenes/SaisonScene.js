// (v0.99, lot B-2, planche 21) Le passage de saison : le premier matin d'une nouvelle saison, la façade
// du comptoir change sous tes yeux (la neige fond et les bourgeons s'ouvrent, les blés mûrissent, le
// vent arrache les feuilles et la brume monte, les flocons blanchissent le toit), puis le titre de la
// saison. Après un saut de temps, les saisons défilent en accéléré. Un clic passe.
class SaisonScene extends Phaser.Scene {
  constructor() { super('Saison'); }

  init(data) {
    this.suite = (data && data.suite) || 'Rue';
    this.ancienne = (data && data.ancienne) || null;
    this.mois = (data && data.mois) || 0;   // (un saut de temps : combien de mois sont passés)
    this.fini = false; this.couches = [];
  }

  create() {
    const G = this.G = window.GAME;
    this.nouvelle = saisonDe(G);
    this.cameras.main.fadeIn(600);
    // (v1.31) avec l'appartement, la maison est plus haute : on recule la vue (titres et indices restent fixes à l'écran)
    this.recul = facadeAvecEtage(G) ? RECUL_ETAGE : 0;
    this.cameras.main.setScroll(0, -this.recul);
    this.add.rectangle(480, 270, 960, 540, 0x000000).setDepth(-10).setScrollFactor(0);
    this.indice = this.add.text(940, 525, '▶ clique pour passer', style(12, '#fff4dc', { fontStyle: 'italic', stroke: '#2a1a10', strokeThickness: 3 })).setOrigin(1, 0.5).setDepth(30).setScrollFactor(0);
    this.input.on('pointerdown', () => { if (this.attenteClic) this.continuer(); else this.terminer(); });
    this.derouler();
  }

  // Une « couche » : la Comté, les pavés, la façade et le décor d'une saison donnée
  couche(saison) {
    SAISON_FORCEE = saison;
    const n0 = this.children.list.length;
    this.add.image(0, -this.recul, paysageHD(this, 960, 470 + this.recul, 'comte', 0)).setOrigin(0).setDisplaySize(960, 470 + this.recul);
    this.add.image(0, 440, pavesHD(this, 960, 100)).setOrigin(0).setScale(2);
    const facade = dessinerFacade(this, 560, 440, this.G.nomShop);
    decorSaison(this, { sol: 440, arbres: [[70, 1.15], [905, 1.05]], facade, bonhomme: 790, prof: 3 });
    SAISON_FORCEE = null;
    const objets = this.children.list.slice(n0);
    this.couches.push(objets);
    return objets;
  }
  fondu(objets, de, a, duree) {
    for (const o of objets) { if (!o.active) continue; const base = o.alpha || 1; o.setAlpha(base * de); this.tweens.add({ targets: o, alpha: base * a, duration: duree }); }
  }
  attendre(ms) { return new Promise(r => this.time.delayedCall(ms, r)); }

  async derouler() {
    const ordre = ORDRE_SAISONS, iN = ordre.indexOf(this.nouvelle);
    const avant = this.ancienne || ordre[(iN + 3) % 4];
    let actuelle = this.couche(avant);
    await this.attendre(1400);
    if (this.fini) return;
    // (après un saut de temps : les saisons défilent, de plus en plus vite)
    if (this.mois > 1) {
      const etapes = Math.min(8, this.mois - 1);
      const texte = this.add.text(480, 270, 'Les saisons passent...', style(30, '#fff4dc', { fontFamily: 'MedievalSharp, serif', stroke: '#1a0e06', strokeThickness: 6 })).setOrigin(0.5).setDepth(20).setScrollFactor(0);
      let i = ordre.indexOf(avant);
      for (let k = 0; k < etapes && !this.fini; k++) {
        i = (i + 1) % 4;
        const c = this.couche(ordre[i]);
        this.fondu(c, 0, 1, 380); this.fondu(actuelle, 1, 0, 380);
        const vieille = actuelle; this.time.delayedCall(420, () => vieille.forEach(o => o.active && o.destroy()));
        actuelle = c;
        Son.jouer('page');
        await this.attendre(Math.max(260, 620 - k * 60));
      }
      texte.destroy();
      if (this.fini) return;
    }
    // le vrai passage, plus lent : la nouvelle saison s'installe
    const nouvelle = this.couche(this.nouvelle);
    this.fondu(nouvelle, 0, 1, 2200); this.fondu(actuelle, 1, 0, 2200);
    Son.jouer({ semailles: 'trefle', moissons: 'coq', brumes: 'vent', givre: 'froid' }[this.nouvelle] || 'trefle', this.nouvelle === 'brumes' ? { duree: 3 } : undefined);
    await this.attendre(2400);
    if (this.fini) return;
    actuelle.forEach(o => o.active && o.destroy());
    // le titre de la saison
    const S = SAISONS[this.nouvelle];
    const t = this.add.graphics().setDepth(21);
    t.fillStyle(0x1a0e06, 0.82).fillRoundedRect(250, 40, 460, 110, 14).lineStyle(4, 0xd8b048).strokeRoundedRect(250, 40, 460, 110, 14).lineStyle(1, 0xf3d98a).strokeRoundedRect(258, 48, 444, 94, 10);
    const titre = this.add.text(480, 82, S.nom, style(46, '#f3d98a', { fontFamily: 'MedievalSharp, serif', stroke: '#1a0e06', strokeThickness: 6 })).setOrigin(0.5).setDepth(22);
    const sous = this.add.text(480, 126, this.mois > 1 ? `${dureeEnMois(this.mois)} plus tard · ${S.sous}` : S.sous, style(16, '#e8d4a8', { fontStyle: 'italic' })).setOrigin(0.5).setDepth(22);
    for (const o of [t, titre, sous]) o.setScrollFactor(0);
    for (const o of [t, titre, sous]) { o.setAlpha(0); this.tweens.add({ targets: o, alpha: 1, duration: 700 }); }
    this.add.text(480, 175, S.effet, style(14, '#fff4dc', { fontStyle: 'italic', stroke: '#1a0e06', strokeThickness: 4 })).setOrigin(0.5).setDepth(22).setScrollFactor(0);
    this.indice.setText('▶ clique pour continuer');
    this.attenteClic = true;   // (pas d'enchaînement automatique : on attend le joueur)
  }

  continuer() { this.terminer(); }

  terminer() {
    if (this.fini) return;
    this.fini = true;
    SAISON_FORCEE = null;
    this.cameras.main.fadeOut(500);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(this.suite));
  }
}

// Faut-il jouer le passage de saison ce matin ? (une fois par saison et par an ; jamais au tout premier jour)
function passageDeSaison(G) {
  const d = dateDuJour(G), cle = `${d.an}-${d.mois}`;
  if (G.saisonVue === undefined || G.jour <= 1) { G.saisonVue = cle; return null; }
  if (G.saisonVue === cle) return null;
  const [an0, mois0] = String(G.saisonVue).split('-').map(Number);
  const ecart = (d.an - an0) * 4 + (d.mois - mois0);
  G.saisonVue = cle;
  return { ancienne: ORDRE_SAISONS[((mois0 % 4) + 4) % 4], mois: Math.max(1, ecart) };
}
