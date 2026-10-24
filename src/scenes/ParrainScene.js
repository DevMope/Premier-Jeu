// (v1.39, planche 66 v2 validée) La révélation du Parrain, à minuit, à la table du fond du marché noir.
// La cave est vide ; la main gantée renvoie Mog et Krug (personne, pas même eux, ne doit voir) ; la robe tombe :
// ton chat, debout sur un haut tabouret, en costume trois pièces. Puis le grand fauteuil de cuir, la souris blanche,
// sa compagne qui tient les comptes ; le mystère de la Main Noire ; et ce que ton camp en fait.
class ParrainScene extends Phaser.Scene {
  constructor() { super('Parrain'); }

  create() {
    const G = this.G = window.GAME;
    exclureScenes(this, 'Nuit');
    this.redemande = !!(this.sys.settings.data && this.sys.settings.data.redemande); this.sys.settings.data = {};
    this.cameras.main.fadeIn(800);
    // le décor de la cave, emprunté au marché noir, ce soir sans personne
    for (const nom of Object.getOwnPropertyNames(MarcheNoirScene.prototype)) if (nom.startsWith('dessiner') && !this[nom]) this[nom] = MarcheNoirScene.prototype[nom];
    this.soiree = { bannis: [], commandes: [] }; this.fete = false; this.mainNoireOuverte = true;
    this.dessinerCave(); this.dessinerGens();
    creerParrainHD(this);
    if (this.passeur) this.passeur.setVisible(false);   // (minuit : même le passeur dort)
    this.cameras.main.setScroll(1920, 0);
    this.robe = this.children.list.find(o => o.x === 2440 && o.y === 350);
    this.table = this.children.list.find(o => o.texture && o.texture.key === 'tableMainNoire');
    this.gardes = this.children.list.filter(o => o.type === 'Image' && (o.x === 2150 || o.x === 2730) && o.y === 370);
    this.heros = this.add.image(2170, 480, textureJoueur(this, G, 'troisQuarts')).setOrigin(0.5, 1).setScale(echelleJoueur(7.5)).setDepth(6);
    this.tweens.add({ targets: this.heros, scaleY: this.heros.scaleY * 1.012, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });   // (il respire)
    this.ui = [];
    this.derouler().catch(e => { console.error(e); this.rentrer(); });
  }

  // --- petits outils : le bandeau (narration en italique, consigne en gras), les bulles, les choix ---
  fixe(o) { o.setScrollFactor(0).setDepth(40); this.ui.push(o); return o; }
  attendre(ms) { return new Promise(ok => this.time.delayedCall(ms, ok)); }
  dire(n, c = '') {
    if (!this.bandeau) {
      this.fondB = this.fixe(this.add.rectangle(480, 12, 920, 40, 0x2a1a10, 0.94).setStrokeStyle(2, 0xc9a227).setOrigin(0.5, 0));
      this.narr = this.fixe(this.add.text(40, 22, '', style(13, '#c9b48a', { fontStyle: 'italic', wordWrap: { width: 880 } })));
      this.cons = this.fixe(this.add.text(40, 40, '', style(14, '#fff4dc', { fontStyle: 'bold', wordWrap: { width: 880 } })));
      this.bandeau = true;
    }
    this.narr.setText(n); this.cons.setText(c).setY(26 + this.narr.height);
    this.fondB.setSize(920, 20 + this.narr.height + (c ? this.cons.height + 4 : 0));
  }
  bulle(x, y, texte, taille = 14) {
    if (this.laBulle) this.laBulle.destroy();
    this.laBulle = this.add.text(x, y, texte, style(taille, '#2a1608', { fontStyle: 'bold', backgroundColor: '#f4ead2', padding: { x: 7, y: 4 }, align: 'center' })).setOrigin(0.5, 1).setDepth(9.9);
    if (typeof Son !== 'undefined') Son.jouer('voix', { personne: { nom: nomChat(this.G), race: 'humain' }, ton: 'neutre' });
    return this.laBulle;
  }
  choisir(textes) {
    return new Promise(ok => {
      const boutons = [], n = textes.length, L = Math.min(300, 880 / n);
      boutons.push(this.fixe(this.add.rectangle(480, 516, L * n + 20, 40, 0x2a1a10, 0.92).setStrokeStyle(2, 0xc9a227)));
      textes.forEach((t, i) => {
        const b = this.fixe(this.add.text(480 + (i - (n - 1) / 2) * L, 516, t, style(14, '#fff4dc', { fontStyle: 'bold', backgroundColor: '#4f7a3a', padding: { x: 8, y: 5 } })).setOrigin(0.5).setInteractive({ useHandCursor: true }));
        b.on('pointerdown', () => { Son.jouer('clic'); for (const x of boutons) x.destroy(); ok(i); });
        boutons.push(b);
      });
    });
  }
  suite() { return this.choisir(['Suite ▸']); }

  async derouler() {
    const G = this.G, nom = nomChatMaj(G), elleNom = nomCompagne(G), camp = etatParrain(G).camp = campDuParrain(G);
    const look = lookChat(G), lookElle = (G.moulin && G.moulin.compagne && G.moulin.compagne.look) || lookCompagne(G);
    if (!this.redemande) await this.revelation(nom, look);
    else { if (this.robe) this.robe.setVisible(false); for (const g of this.gardes) g.setVisible(false); }
    await this.leFauteuil(nom, elleNom, look, lookElle, camp);
  }

  async revelation(nom, look) {
    const G = this.G;
    // 1. Minuit, la table du fond : la main gantée renvoie les gardes
    this.dire("Minuit. La cave est vide, les tables désertes. À la table du fond, la main gantée bat les cartes.");
    await this.attendre(600);
    this.bulle(2440, 236, '« Laissez-nous. »');
    await this.attendre(900);
    this.gardes.forEach((g, i) => { g.setFlipX(i === 0); this.tweens.add({ targets: g, x: i === 0 ? 1880 : 3000, duration: 1800, ease: 'Sine.easeIn' }); });
    this.dire("D'un geste, elle renvoie Mog et Krug. Personne, pas même eux, ne doit voir ce qui va suivre.");
    await this.attendre(1900);
    this.bulle(2440, 236, '« Assieds-toi, gamin. »');
    await this.suite();
    // 2. La robe tombe : ton chat, debout sur un haut tabouret, en costume trois pièces
    if (this.table) this.table.setDepth(2);
    const tabouret = this.add.image(2440, 392, 'tabouretHautHD').setOrigin(0.5, 1).setScale(1.9).setDepth(1);
    const debout = this.add.image(2442, 322, textureChatDebout(this, look, { tenue: 'parrain' })).setOrigin(0.5, 1).setScale(2.6).setDepth(1.5);
    if (this.robe) this.tweens.add({ targets: this.robe, y: this.robe.y + 60, alpha: 0, duration: 700, ease: 'Quad.easeIn' });
    const tas = this.add.image(2330, 402, 'robeTombeeHD').setOrigin(0.5, 1).setScale(2.4).setDepth(3).setAlpha(0);
    this.tweens.add({ targets: tas, alpha: 1, delay: 500, duration: 300 });
    Son.jouer('glisse');
    this.heros.setTexture(textureJoueurPose(this, G, 'troisQuarts', 'stupeur'));
    this.dire(`La capuche glisse. Puis la robe tombe en tas. Dessous, debout sur un haut tabouret, en costume trois pièces, une rose à la boutonnière : ${nom}.`);
    await this.attendre(900);
    this.bulle(2445, 196, '« Surpris ? »', 15);
    await this.suite();
    tabouret.destroy(); debout.destroy();
  }

  async leFauteuil(nom, elleNom, look, lookElle, camp) {
    const G = this.G;
    // 3. Le grand fauteuil de cuir : la souris blanche, elle qui tient les comptes, la lune de miel
    this.heros.setTexture(textureJoueur(this, G, 'troisQuarts'));
    const reg = this.add.graphics().setDepth(1); reg.fillStyle(0x3a1a10).fillRect(2290, 288, 92, 16).fillStyle(0xe8dcc0).fillRect(2294, 284, 40, 10).fillRect(2338, 284, 40, 10).fillStyle(0x6a4a2a).fillRect(2334, 282, 4, 14);
    const kE = creerChatHD(this, lookElle), elle = this.add.image(2336, 290, kE + '_dort0').setOrigin(0.5, 1).setScale(2).setDepth(1.1);
    let souffle = 0; this.time.addEvent({ delay: 1200, loop: true, callback: () => { if (elle.active) elle.setTexture(kE + '_dort' + (++souffle % 2)); } });
    this.add.image(2560, 296, textureChapeauSeul(this, 'borsalino')).setOrigin(0.5, 1).setScale(2.4).setDepth(1.1);
    const v = this.add.graphics().setDepth(1.1); v.fillStyle(0xd8d8e0, 0.6).fillRect(2604, 274, 10, 18).fillStyle(0x7a0a1a).fillRect(2605, 282, 8, 9).fillStyle(0xd8d8e0, 0.7).fillRect(2608, 292, 2, 6).fillRect(2603, 297, 12, 2);
    this.add.image(2440, 484, 'fauteuilParrainHD').setOrigin(0.5, 1).setScale(2.5).setDepth(3);
    const assis = this.add.image(2440, 456, textureChatDebout(this, look, { tenue: 'parrain', assis: true, caresse: true })).setOrigin(0.5, 1).setScale(2.6).setDepth(3.5);
    const souris = this.add.image(2462, 440, 'sourisBlancheHD').setOrigin(0.5, 1).setScale(2.2).setDepth(3.6).setFlipX(true);
    this.tweens.add({ targets: souris, scaleY: 2.3, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });   // (elle respire, sous la patte)
    const bout = { x: assis.x + 36, y: assis.y - 98 }; const braise = this.add.image(bout.x, bout.y, 'halo').setScale(0.1).setTint(0xff8030).setBlendMode(Phaser.BlendModes.ADD).setDepth(3.7);
    filetDeFumee(this, () => (assis.active ? bout : null), { profondeur: 3.8 });
    if (this.redemande) this.dire(`Minuit, la table du fond. ${nom} t'attend dans son fauteuil.`);
    else {
    this.dire(`Il s'installe dans le grand fauteuil de cuir, la souris blanche sur les genoux. Sur la table, ${elleNom} dort sur le grand registre : c'est elle qui tient les comptes. Le Vieux Moulin ? C'était leur lune de miel... gâchée par un renard.`);
    this.bulle(2690, 250, "« Plein aux as, et je dors dans tes paniers.\nLes toits, les poubelles, les gamelles des autres :\nun chat de gouttière, personne ne le regarde.\nPersonne ne s'en méfie. C'est tout le secret. »", 13);
    await this.suite();
    this.dire("Voilà pourquoi la Main Noire n'a jamais eu de visage : ce n'est qu'une patte, dans un gant de cuir noir.");
    this.bulle(2690, 250, "« Ni Silas, ni le Serpent, ni la Garde\nne savent qui je suis.\nIls ne voient que le gant.\nLa Main Noire, gamin... c'est moi. »", 14);
    await this.suite();
    }
    // 4. Selon ton camp : ce qu'il te propose, et ce que tu en fais
    const LIGNES = {
      ombre: "« Tu as les mains aussi sales que les miennes, gamin.\nJe l'ai su dès le premier jour.\nAssieds-toi à ma droite. »",
      neutre: "« Ni ombre, ni lumière. Comme moi :\nje ne prends parti que pour mes affaires.\nOn se serre la patte ? »",
      lumiere: "« Je sais ce que tu penses. Mais qui a nourri\nce chat de gouttière quand personne ne le regardait ?\nToi. Écoute-moi avant de juger. »",
    };
    this.dire(camp === 'ombre' ? 'Il te tend la patte. Au doigt, une chevalière noire.' : camp === 'neutre' ? 'Il sort un parchemin plié de son gilet, et le pose sur la table.' : "Il pose son cigare. Pour une fois, il ne fanfaronne pas.", 'Que fais-tu ?');
    this.bulle(2690, 250, LIGNES[camp], 14);
    const options = CHOIX_PARRAIN[camp];
    const i = await this.choisir(options.map(o => o[1]));
    const ligne = choisirParrain(G, options[i][0]);
    if (this.laBulle) { this.laBulle.destroy(); this.laBulle = null; }
    if (options[i][0] === 'denoncer') { assis.destroy(); souris.destroy(); elle.destroy(); braise.destroy(); Son.jouer('porte'); }
    else { Son.jouer('miaou'); if (options[i][0] === 'bague' || options[i][0] === 'pacte') gainEnDirect(this, 2440, 300, options[i][0] === 'bague' ? 'Consigliere · plus de pizzo' : 'Pacte · plus de pizzo', true); }
    this.dire(ligne);
    await this.choisir(['Rentrer dormir']);
    this.rentrer();
  }

  // La nuit est passée : on rentre, et on se couche (comme « Aller dormir »)
  rentrer() {
    const G = this.G;
    if (this.fini) return; this.fini = true;
    if (typeof Sauvegarde !== 'undefined') Sauvegarde.maintenant(G, 'Nuit');
    const bilan = { jour: G.jour, servis: G.journal.servis, retours: G.journal.retours, morts: G.journal.morts,
      gain: G.argent - G.argentDebutJour, reputation: G.reputation, jauge: jaugeCamp(G), palier: nomPalierCamp(G) };
    this.cameras.main.fadeOut(700);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Dodo', { bilan }));
  }
}

// Le soir de l'invitation (différente selon ton camp) ; côté ombre, après « Réfléchir », il redemande
function soireeDuParrain(scene) {
  const G = scene.G;
  if (scene.fenetreMoulin) return false;
  const redemande = typeof parrainRedemande === 'function' && parrainRedemande(G);
  if (!redemande && !(typeof parrainCeSoir === 'function' && parrainCeSoir(G))) return false;
  const camp = campDuParrain(G), nom = nomChatMaj(G);
  const c = scene.fenetreMoulin = scene.add.container(0, 0).setDepth(40);
  c.add(scene.add.rectangle(480, 270, 960, 540, 0x0a0604, 0.6).setInteractive());
  c.add(scene.add.image(480, 280, panneauHD(scene, 580, 300)).setScale(2));
  creerParrainHD(scene);
  c.add(scene.add.image(480, 222, 'gantNoirHD').setScale(3.2));
  const texte = redemande ? `${nom} t'attend à ta fenêtre, son cigare au bec. « Alors, gamin ? La Famille attend ta réponse. Ce soir, minuit. »`
    : camp === 'ombre' ? `Ce soir, le panier est vide : ni lui, ni elle. Sur le coussin, un gant de cuir noir et une carte, signée d'une patte : « Minuit. La table du fond. Viens seul${eJ()}. — M. N. »`
      : camp === 'neutre' ? `À ta fenêtre, cigare au bec, ${nom} t'attend : « On parle affaires, ce soir ? Minuit, au marché noir. La table du fond. »`
        : `Depuis des jours, ${nom} tourne autour de toi sans rien dire. Ce soir, enfin : « Promets-moi de ne pas crier. Minuit, au marché noir. La table du fond. »`;
  c.add(scene.add.text(480, 262, texte, style(14, '#5a3a1a', { fontStyle: 'italic', align: 'center', wordWrap: { width: 520 }, lineSpacing: 3 })).setOrigin(0.5, 0));
  const fermer = () => { c.destroy(); scene.fenetreMoulin = null; };
  const b1 = creerBouton(scene, 360, 396, 240, 'Y aller (minuit)', () => {
    if (enTransition(scene)) return;
    fermer(); Son.jouer('porte');
    if (redemande) { G.parrain.fait = false; G.parrain.statut = null; }   // (il redemande : seulement la fin, dans son fauteuil)
    scene.cameras.main.fadeOut(700);
    scene.cameras.main.once('camerafadeoutcomplete', () => scene.scene.start('Parrain', { redemande }));
  });
  const b2 = creerBouton(scene, 620, 396, 200, 'Pas ce soir', () => {
    fermer();
    if (redemande) G.parrain.remis = G.jour; else remettreParrain(G);
    scene.annoncer && scene.annoncer(`${nom} hausse les épaules. « Un autre soir, alors. »`);
  });
  c.add([b1.fond, b1.label, b2.fond, b2.label]);
  return true;
}
