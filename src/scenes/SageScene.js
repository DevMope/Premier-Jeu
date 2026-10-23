// (v1.02, planche 32, dessin du Grand Sage envoyé par le joueur) Le deuxième Solstice, le grand jour : les
// cloches sonnent, le cortège du Conseil arrive sur la place du marché, et le Grand Sage paraît sur l'estrade
// dans une colonne de lumière. Son discours de « paix et bienveillance » (validé) ; la foule l'acclame...
// et, au fond de la place, Garrick n'applaudit pas (un indice pour les attentifs). Un clic à chaque étape.
// La cape d'écailles rouges du Sage est un autre indice : le dragon lui appartenait.
// (planche 33, validée le 18/10) le cortège du Conseil sur l'estrade (CONSEIL_VALIDE le ferme si on doit retirer les dessins)
let CONSEIL_VALIDE = true;   // (planche 33 validée le 18/10)
const DISCOURS_SAGE = [
  "Peuple du Comté ! Voilà bien des hivers que le dragon ne trouble plus nos ciels.",
  "Ce n'est pas la chance qui vous garde : c'est l'Union. Que chaque comptoir soit une lanterne, chaque voisin un frère.",
  "Le Conseil ne vous demande qu'une chose : la bienveillance... et un peu de vigilance envers ceux qui ont choisi l'ombre.",
];

class SageScene extends Phaser.Scene {
  constructor() { super('DiscoursSage'); }
  init(data) { this.retour = (data && data.retour) || 'Marche'; this.etape = 0; this.occupe = false; this.fini = false; }

  create() {
    const G = this.G = window.GAME;
    creerHalo(this); creerEmblemesHD(this);
    this.cameras.main.fadeIn(1000);
    this.decor();
    // l'estrade drapée aux couleurs du Conseil
    const e = this.add.graphics().setDepth(3);
    e.fillStyle(0x4a2e18).fillRect(310, 330, 340, 14); e.fillStyle(0x6a4424).fillRect(310, 330, 340, 4);   // le plancher
    e.fillStyle(0x2a4a8a).fillRect(318, 344, 324, 70);                                                       // la draperie
    for (let x = 318; x < 642; x += 12) e.fillStyle(0xd8b048).fillTriangle(x, 414, x + 12, 414, x + 6, 422);   // ses franges d'or
    e.lineStyle(3, 0xd8b048).lineBetween(318, 346, 642, 346);
    for (let j = 0; j < 3; j++) e.fillStyle(j % 2 ? 0x5a3a1c : 0x4a2e18).fillRect(440 - j * 8, 414 + j * 10, 80 + j * 16, 10);   // les marches
    this.add.image(480, 378, 'embleme_conseil').setScale(0.8).setDepth(3.1);
    // le Grand Sage (il n'apparaît qu'à l'étape 2), la lueur de son cristal
    const cle = corpsHD(this, 'sage', null, 'face');
    this.sage = this.add.image(480, 332, cle).setOrigin(0.5, 1).setScale(10.5 * echelleCorps(cle)).setDepth(4).setAlpha(0);
    const R = REPERES_CORPS[cle] || {}, S = this.sage.scaleX, c = R.cristal || [this.sage.width * 0.8, 8];
    this.lueur = this.add.image(480 + (c[0] - this.sage.width / 2) * S, 332 - (this.sage.height - c[1]) * S, 'halo').setScale(0.5).setTint(0x80e8ff).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD).setDepth(4.2);
    this.lueurDx = this.lueur.x - 480; this.lueurDy = this.lueur.y - 332;
    // les gardes du cortège, qui arriveront des deux côtés
    // (planche 33) le cortège du Conseil : le Gardien du Comté et le Champion du Rempart montent sur l'estrade
    this.cortege = (CONSEIL_VALIDE ? [['gardienComte', 318, 372], ['champion', 642, 598]] : []).map(([f, x0, x]) => { const c = imageCorps(this, x0, 332, f, 9).setDepth(3.9).setAlpha(0).setFlipX(x0 > 480); c.cible = x; return c; });
    this.gardes = [[-80, 290, false], [1040, 670, true]].map(([x0, x, flip]) => { const g = imageCorps(this, x0, 432, 'garde', 7).setDepth(5).setFlipX(flip); g.cible = x; return g; });
    // Garrick, au fond à droite, à l'écart
    this.garrick = imageCorps(this, 872, 404, 'mentor', 5.2).setDepth(2.5).setFlipX(true).setTint(0xd8d0c8);
    // la foule de dos, au premier plan (JeuneGoy parmi eux)
    this.foule = [];
    const gens = [['hobbit', false], ['humain', true], ['nain', false], ['humain', false], ['elfe', true], ['hobbit', true], ['humain', false], ['nain', true]];
    gens.forEach(([race, f], i) => {
      const x = 40 + i * 128 + (i % 2) * 20, qui = { nom: 'Villageois ' + i, race, feminin: f, niveau: 'novice' };
      if (i === 3) { const j = this.add.image(x, 572, textureJoueur(this, G, 'dos')).setOrigin(0.5, 1).setScale(echelleJoueur(12)).setDepth(7); j.joueur = true; this.foule.push(j); return; }
      const v = this.add.image(x, 562 + (i % 2) * 14, corpsHD(this, qui, null, 'dos')).setOrigin(0.5, 1).setScale(11.5 * ECHELLE_CORPS).setDepth(6 + (i % 2) * 0.5).setTint(0xc8bcb0);
      v.qui = qui; this.foule.push(v);
    });
    this.foule.forEach((v, i) => this.tweens.add({ targets: v, y: v.y - 3, duration: 900 + i * 70, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: i * 120 }));
    // la boîte de texte : la narration en italique, les paroles droites et claires
    this.boite = this.add.graphics().setDepth(20);
    this.boite.fillStyle(0x140c08, 0.88).fillRoundedRect(30, 8, 900, 92, 10).lineStyle(2, 0xc8a050).strokeRoundedRect(30, 8, 900, 92, 10);   // (en haut : la foule reste visible en bas)
    this.texte = null;
    this.indice = this.add.text(918, 88, '', style(11, '#e8d8b8', { fontStyle: 'italic' })).setOrigin(1, 0.5).setDepth(21);
    this.input.on('pointerdown', () => { if (!this.occupe) this.suivante(); });
    this.suivante();
  }

  // La place en fête : le ciel d'été, les toits, le beffroi et sa cloche, les lampions, les bannières, les pavés
  decor() {
    const g = this.add.graphics().setDepth(0);
    for (let y = 0; y < 300; y += 6) { const t = y / 300; g.fillStyle(Phaser.Display.Color.GetColor(150 + t * 90, 190 + t * 40, 230 - t * 30)).fillRect(0, y, 960, 6); }
    g.fillStyle(0xfff4c8, 0.9).fillCircle(880, 150, 22);
    // les toits du village
    const toits = [[0, 150, 120], [130, 120, 150], [250, 160, 100], [420, 140, 160], [560, 150, 110], [700, 130, 140], [840, 120, 120]];
    for (const [x, w, h] of toits) { const y = 330 - h; g.fillStyle(0xc8b090).fillRect(x, y, w, h); g.fillStyle(0x8a3a2a).fillTriangle(x - 8, y, x + w + 8, y, x + w / 2, y - 50); g.fillStyle(0x5a4030); for (let k = 0; k < 2; k++) g.fillRect(x + 20 + k * (w - 52), y + 24, 14, 20); }
    // le beffroi, sa cloche qui se balance
    g.fillStyle(0xa89070).fillRect(70, 120, 60, 210); g.fillStyle(0x6a2a20).fillTriangle(60, 120, 140, 120, 100, 60); g.fillStyle(0x2a1a10).fillRect(84, 132, 32, 34);
    this.cloche = this.add.graphics().setDepth(0.5).setPosition(100, 134);
    this.cloche.fillStyle(0xd8a838).fillRoundedRect(-10, 0, 20, 18, { tl: 8, tr: 8, bl: 2, br: 2 }).fillStyle(0xa87820).fillRect(-12, 16, 24, 4).fillStyle(0x6a4a10).fillCircle(0, 22, 3);
    // les lampions et les bannières de la Confrérie (comme au marché)
    this.texLampion = MarcheScene.prototype.texLampion;
    const c = this.add.container(0, 0).setDepth(1);
    MarcheScene.prototype.guirlandeLampions.call(this, c, 0, 960, 116, 24, 52);
    MarcheScene.prototype.banniereConfrerie.call(this, c, 200, 330, 200, 0.9);
    MarcheScene.prototype.banniereConfrerie.call(this, c, 760, 330, 200, 0.9);
    // les pavés de la place
    this.add.image(0, 330, pavesHD(this, 960, 210)).setOrigin(0).setScale(2).setDepth(0.8);
  }

  dire(t) {
    if (this.texte) this.texte.destroy();
    this.texte = texteMixte(this, 52, 22, t, { taille: 15, largeur: 856 }).setDepth(21).setAlpha(0);
    this.tweens.add({ targets: this.texte, alpha: 1, duration: 500 });
  }
  attendre(ms) { return new Promise(r => this.time.delayedCall(ms, r)); }
  sonner(n) { for (let k = 0; k < n; k++) this.time.delayedCall(k * 700, () => { Son.jouer('cloche'); this.tweens.add({ targets: this.cloche, angle: { from: -25, to: 25 }, duration: 350, yoyo: true, ease: 'Sine.easeInOut' }); }); }
  // le cristal du bâton qui s'illumine
  eclat(fort = 1) {
    this.lueur.setPosition(this.sage.x + this.lueurDx, this.sage.y + this.lueurDy);
    this.tweens.add({ targets: this.lueur, scale: 0.5 + fort * 0.6, alpha: Math.min(1, 0.6 + fort * 0.3), duration: 260, yoyo: true, hold: 200, onComplete: () => this.lueur.setAlpha(0.6).setScale(0.5) });
  }
  acclamer() {
    Son.jouer('foule');
    this.foule.forEach((v, i) => this.time.delayedCall(i * 90, () => {
      if (!v.active) return;
      const leve = v.joueur ? textureJoueurPose(this, this.G, 'dos', 'leves') : corpsHD(this, v.qui, 'leves', 'dos');
      const bas = v.joueur ? textureJoueur(this, this.G, 'dos') : corpsHD(this, v.qui, null, 'dos');
      let n = 0; const ev = this.time.addEvent({ delay: 380, repeat: 5, callback: () => { if (v.active) v.setTexture(++n % 2 ? leve : bas); } });
      this.time.delayedCall(380 * 7, () => { ev.remove(); if (v.active) v.setTexture(bas); });
    }));
    // des pétales de fleurs lancés en l'air
    for (let k = 0; k < 40; k++) { const p = this.add.rectangle(100 + Math.random() * 760, 420, 4, 3, Phaser.Utils.Array.GetRandom([0xf4f0e8, 0xf0c830, 0xe87aa0, 0x8ac8f0])).setDepth(8); this.tweens.add({ targets: p, y: 120 + Math.random() * 160, x: p.x + Phaser.Math.Between(-60, 60), angle: 360, duration: 900, ease: 'Quad.easeOut', yoyo: true, hold: 300, onComplete: () => p.destroy() }); }
  }

  async suivante() {
    this.etape++;
    this.indice.setText('');
    const fin = () => { if (!this.fini) this.indice.setText('▶ clique pour continuer'); this.occupe = false; };
    this.occupe = true;
    if (this.etape === 1) {
      this.dire("Le grand jour du Solstice. Les cloches sonnent à toute volée : le cortège du Conseil des Gardiens arrive sur la place." + (this.cortege.length ? " Maître Pommeval, le Gardien du Comté, et Sire Valdric, le Champion du Rempart, montent sur l'estrade." : ""));
      this.sonner(3);
      for (const c of this.cortege) { pasDeMarche(this, c, 1800); this.tweens.add({ targets: c, x: c.cible, alpha: 1, duration: 1800, ease: 'Sine.easeOut', onComplete: () => this.tweens.add({ targets: c, y: c.y - 2, duration: 1200 + c.x, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }) }); }
      for (const g of this.gardes) { pasDeMarche(this, g, 2200); this.tweens.add({ targets: g, x: g.cible, duration: 2200, ease: 'Sine.easeOut', onComplete: () => g.setFlipX(g.cible > 480) }); }
      await this.attendre(2400); fin();
    } else if (this.etape === 2) {
      // une colonne de lumière, et le Grand Sage est là
      const rayon = this.add.image(480, 200, 'halo').setScale(2.2, 7).setTint(0xfff0c0).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD).setDepth(3.5);
      this.tweens.add({ targets: rayon, alpha: 0.8, duration: 700, yoyo: true, hold: 500, onComplete: () => rayon.destroy() });
      Son.jouer('trefle');
      this.time.delayedCall(600, () => { this.tweens.add({ targets: this.sage, alpha: 1, duration: 900 }); this.lueur.setPosition(this.sage.x + this.lueurDx, this.sage.y + this.lueurDy); this.tweens.add({ targets: this.lueur, alpha: 0.6, duration: 900 }); });
      this.time.delayedCall(1600, () => {
        this.tweens.add({ targets: this.sage, y: 328, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', onUpdate: () => this.lueur.setPosition(this.sage.x + this.lueurDx, this.sage.y + this.lueurDy) });
        this.tweens.add({ targets: this.lueur, scale: 0.58, duration: 1000, yoyo: true, repeat: -1 });
      });
      this.dire("Dans une colonne de lumière, le Grand Sage paraît sur l'estrade : la couronne d'or, la cape d'écailles rouges, le bâton au cristal bleu. La foule retient son souffle.");
      await this.attendre(1800); fin();
    } else if (this.etape >= 3 && this.etape < 3 + DISCOURS_SAGE.length) {
      Son.jouer('voix');
      this.eclat(this.etape - 2);
      this.tweens.add({ targets: this.sage, scaleY: this.sage.scaleY * 1.02, duration: 200, yoyo: true });
      this.dire(`Le Grand Sage lève son bâton : « ${DISCOURS_SAGE[this.etape - 3]} »`);
      await this.attendre(700); fin();
    } else if (this.etape === 3 + DISCOURS_SAGE.length) {
      Son.jouer('fanfare');
      this.acclamer();
      this.dire("Il sourit. La place entière l'acclame : « Vive le Grand Sage ! Vive l'Union ! »");
      await this.attendre(900); fin();
    } else if (this.etape === 4 + DISCOURS_SAGE.length) {
      // au fond de la place, Garrick n'applaudit pas
      // tout s'assombrit, sauf lui (pas de mouvement de caméra : elle est zoomée pour la netteté de l'écran)
      const ombre = this.add.rectangle(480, 270, 960, 540, 0x080406, 0).setDepth(9);
      const halo = this.add.image(this.garrick.x, this.garrick.y - this.garrick.displayHeight / 2, 'halo').setScale(2.2, 3).setTint(0xffe8c0).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD).setDepth(9.5);
      this.tweens.add({ targets: ombre, fillAlpha: 0.62, duration: 900 });
      this.tweens.add({ targets: halo, alpha: 0.35, duration: 900 });
      this.garrick.clearTint().setDepth(10);
      this.tweens.add({ targets: this.garrick, scale: this.garrick.scale * 1.25, duration: 900, ease: 'Sine.easeOut' });
      if (this.texte) this.texte.setAlpha(0);
      await this.attendre(1000);
      this.dire("Au fond de la place, à l'écart, Garrick n'applaudit pas. Il regarde le Grand Sage... et son regard n'a rien de bienveillant.");
      fin();
    } else {
      this.fini = true;
      this.cameras.main.fadeOut(900);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(this.retour));
    }
  }
}

// (v1.04, planche 34) Le dallage de la salle du Conseil, à la Citadelle : de grandes dalles de marbre crème aux
// veines dorées (en perspective : plus grandes vers le bas), des joints d'or fin, une rosace d'or et de pourpre
// devant l'estrade, et le long tapis pourpre bordé d'or qui mène au trône. (Plus doux et plus noble qu'un damier.)
function dallageConseil(scene, y0 = 380, y1 = 540, xTrone = 480) {
  const g = scene.add.graphics();
  let y = y0, h = 12, rang = 0;
  while (y < y1) {
    const l = 60 + rang * 14, decale = (rang % 2) * l / 2;
    for (let x = -decale; x < 960; x += l) {
      const t = ((Math.round(x / l) + rang) % 3 + 3) % 3;
      g.fillStyle([0xe0d2b4, 0xd6c6a4, 0xdccbaa][t]).fillRect(x, y, l, h);
      g.fillStyle(0xf0e6cc, 0.5).fillRect(x + 2, y + 1, l - 4, 2);                       // le poli de la dalle
      for (let v = 0; v < 2; v++) { const vx = x + ((x * 7 + rang * 13 + v * 29) % l + l) % l, vy = y + 3 + v * (h / 3); g.lineStyle(1, 0xb8a27a, 0.6).lineBetween(vx, vy, vx + 14 + v * 6, vy + 3); }   // les veines
      g.fillStyle(0xc8a050).fillRect(x, y, 1, h);                                          // les joints d'or
    }
    g.fillStyle(0xc8a050).fillRect(0, y, 960, 1);
    y += h; h = Math.round(h * 1.18); rang++;
  }
  // la rosace d'or et de pourpre devant l'estrade
  const ry = y0 + 26;
  g.fillStyle(0x8a1a24).fillEllipse(xTrone, ry, 170, 34); g.lineStyle(3, 0xd8b048).strokeEllipse(xTrone, ry, 170, 34).strokeEllipse(xTrone, ry, 120, 22);
  for (let a = 0; a < 16; a++) { const an = a / 16 * Math.PI * 2; g.lineStyle(2, a % 2 ? 0xd8b048 : 0xf0dca0).lineBetween(xTrone, ry, xTrone + Math.cos(an) * 80, ry + Math.sin(an) * 16); }
  g.fillStyle(0xf0dca0).fillEllipse(xTrone, ry, 26, 8);
  // le tapis pourpre bordé d'or, de l'estrade jusqu'au bas de la salle (il s'élargit en approchant)
  g.fillStyle(0x7a1420).fillPoints([{ x: xTrone - 34, y: y0 }, { x: xTrone + 34, y: y0 }, { x: xTrone + 70, y: y1 }, { x: xTrone - 70, y: y1 }], true);
  g.lineStyle(3, 0xd8b048).lineBetween(xTrone - 34, y0, xTrone - 70, y1).lineBetween(xTrone + 34, y0, xTrone + 70, y1);
  for (let yy = y0 + 18; yy < y1; yy += 26) { const w = 30 + (yy - y0) / (y1 - y0) * 34; g.fillStyle(0xd8b048).fillTriangle(xTrone, yy - 5, xTrone - w * 0.25, yy, xTrone, yy + 5).fillTriangle(xTrone, yy - 5, xTrone + w * 0.25, yy, xTrone, yy + 5); }
  return g;
}
