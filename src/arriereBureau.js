// (v1.64, planche 82 v2 validée) L'arrière-boutique, un peu plus large : la porte du bureau entre la chambre et le
// coffre, la caméra qui suit le joueur, et le joueur qui y marche. Il va à pied jusqu'aux portes ; pour passer, il prend
// la poignée, pousse (le vantail tourne vers la pièce d'à côté, la lumière de la pièce tombe sur le plancher), puis il
// passe sous le chambranle. Le bureau (BureauScene) s'ouvre derrière ; quand on en ressort, on le voit revenir par la
// même porte, qu'il tire derrière lui. La même porte, et la pièce élargie, dans la promenade du soir.
// Toutes les portes intérieures de l'arrière-boutique (la chambre, le bureau) sont du même modèle (bureauHD.js), plus
// petites que la porte de la rue.

const SOL_HEROS_ARRIERE = 505;

// La porte du bureau, et sa plaque
ArriereScene.prototype.dessinerPorteBureau = function () {
  const x = PORTES_ARRIERE.bureau;
  this.porteBureau = poserPorteInterieure(this, x, SOL_ARRIERE, { ecriteau: 'Le bureau', dedans: 'bureau' });
  const zone = this.add.rectangle(x, SOL_ARRIERE - 90, 100, 180, 0xffffff, 0).setInteractive({ useHandCursor: true });
  zone.on('pointerdown', () => { if (this.allerALaPorte) this.allerALaPorte('bureau'); });
};

// (le décor de la tapissière : ses murs et son sol, à la largeur de la pièce)
{
  const appliquer = ArriereScene.prototype.appliquerDeco;
  ArriereScene.prototype.appliquerDeco = function () {
    appliquer.call(this);
    const G = this.G, d = typeof decoDe === 'function' ? decoDe(G) : null;
    if (!d || !this.imMur || !this.imSol) return;
    const P = d.poses, M = STYLES_DECO[P.murs], B = STYLES_DECO[P.bois];
    if (P.murs !== 'rustique' || P.bois !== 'rustique') {
      const cle = 'decoMurLarge_' + P.murs + '_' + P.bois;
      if (!this.textures.exists(cle)) murDeco(this, cle, { ...M, bois: B.bois, boisSombre: B.boisSombre }, { l: LARGEUR_ARRIERE / 2, poteaux: [272, 502], graine: 310 });
      this.imMur.setTexture(cle);
    }
    if (P.sol !== 'rustique') {
      const cle = 'decoSolLarge_' + P.sol;
      if (!this.textures.exists(cle)) solDeco(this, cle, STYLES_DECO[P.sol], { l: LARGEUR_ARRIERE / 2 });
      this.imSol.setTexture(cle);
    }
  };
}

// Après create() : la caméra bornée à la pièce, l'interface fixée à l'écran, le joueur, la marche au clic
function elargirArriere(s) {
  const G = s.G, cam = s.cameras.main;
  s.animPorte = false; s.cibleX = null; s.pasHeros = 0;
  // (pas de setBounds : la caméra est zoomée depuis son coin, on la borne à la main, comme dans la promenade)
  // les boutons du bas (retour, forge, tapissière) restent à l'écran, par-dessus le joueur qui passe devant
  const fonds = s.children.list.filter(o => o.type === 'Image' && o.input && Math.abs(o.y - 505) < 0.5);
  for (const f of fonds) {
    f.setScrollFactor(0).setDepth(30);
    for (const t of s.children.list) if (t.type === 'Text' && Math.abs(t.x - f.x) < 0.5 && Math.abs(t.y - f.y) < 0.5) t.setScrollFactor(0).setDepth(30.1);
  }
  // le joueur, debout devant le vieux buffet
  textureJoueur(s, G); textureJoueur(s, G, 'deFace'); textureJoueur(s, G, 'dos');
  s.heros = s.add.image(560, SOL_HEROS_ARRIERE, 'joueur_' + stadeJoueur(G)).setOrigin(0.5, 1).setScale(echelleJoueur(7.5)).setDepth(3.6);
  // (pas sur la trappe ouverte de la cave, ni sur le coussin du chat)
  s.bornesHeros = [typeof repaireA === 'function' && repaireA(G, 'cave') ? 450 : 300, LARGEUR_ARRIERE - 40];
  cam.setScroll(0, 0);
  s.input.on('pointerdown', (p, sous) => {
    if (sous.length || s.animPorte || s.liste || s.cave || p.worldY < SOL_ARRIERE - 30) return;
    s.cibleX = Phaser.Math.Clamp(p.worldX, s.bornesHeros[0], s.bornesHeros[1]);
  });
  s.touches = s.input.keyboard ? s.input.keyboard.createCursorKeys() : null;
}

// Il marche (au clic sur le plancher, ou ◀ ▶) ; la caméra le suit, sans à-coups
ArriereScene.prototype.update = function (temps, delta) {
  const h = this.heros, cam = this.cameras.main;
  if (!h || !h.active) return;
  if (!this.animPorte) {
    let dx = 0;
    if (this.touches && (this.touches.left.isDown || this.touches.right.isDown) && !this.liste && !this.cave) { this.cibleX = null; dx = (this.touches.right.isDown ? 1 : -1) * 0.3 * delta; }
    else if (this.cibleX !== null) { const reste = this.cibleX - h.x; dx = Math.sign(reste) * Math.min(Math.abs(reste), 0.3 * delta); if (Math.abs(reste) < 1) this.cibleX = null; }
    if (dx) {
      if (h.texture.key.indexOf('_dos') > 0 || h.texture.key.indexOf('_deFace') > 0 || /_pose_|empoigne/.test(h.texture.key)) h.setTexture(textureJoueur(this, this.G)).setOrigin(0.5, 1);
      h.x = Phaser.Math.Clamp(h.x + dx, this.bornesHeros[0], this.bornesHeros[1]);
      h.setFlipX(dx < 0);
      if (!h.marche) pasDeMarche(this, h, 260, { poussiere: false });
    }
  }
  // la caméra : elle ne bouge que quand il approche du bord de l'écran
  const vise = Phaser.Math.Clamp(h.x < cam.scrollX + 260 ? h.x - 260 : h.x > cam.scrollX + 700 ? h.x - 700 : cam.scrollX, 0, ELARGI_ARRIERE);
  cam.scrollX += (vise - cam.scrollX) * Math.min(1, delta / 120);
};

// Il va à une porte : la chambre, le bureau, la rue. Selon le moment, il passe, ou on lui dit pourquoi pas.
ArriereScene.prototype.allerALaPorte = async function (quoi) {
  if (this.animPorte || this.liste || this.cave) return;
  const G = this.G, c = this.comptoir, h = this.heros;
  this.cibleX = null;
  if (quoi === 'rue') { this.animPorte = true; await marcherJusqua(this, h, 898 + ELARGI_ARRIERE - 76, SOL_HEROS_ARRIERE); this.animPorte = false; return this.porteRue(); }
  const p = quoi === 'chambre' ? this.porteChambre : this.porteBureau;
  if (!p) return;
  const devant = async () => { this.animPorte = true; await marcherJusqua(this, h, p.x - 44, SOL_HEROS_ARRIERE); tournerJoueur(this, h, 'face'); this.animPorte = false; };
  if (quoi === 'chambre') {
    // la journée n'est pas finie (ou elle commence) : il y va, et on lui dit pourquoi pas maintenant
    if (!c || c.voyageur || c.entree || G.file.length) { await devant(); return this.porte(); }
    if (enTransition(this)) return;
    this._transition = 0;
    await passerPorte(this, h, p, { profHeros: 3.6 });
    return this.porte();
  }
  // le bureau
  if (typeof lieuDebloque === 'function' && !lieuDebloque(G, 'bureau')) { await devant(); const d = DEBLOCAGES.bureau; return this.message(`${d.nom} s'ouvrira ${d.quand}.`); }
  await passerPorte(this, h, p, { profHeros: 3.6 });
  if (!this.sys.isActive()) return;
  this.scene.pause();
  this.scene.launch('Bureau', { retour: 'Arriere', comptoir: this.comptoir, parLaPorte: true });
  this.scene.moveAbove('Arriere', 'Bureau');   // (le bureau est déclaré avant l'arrière-boutique : sinon il passerait dessous)
};
// On ressort du bureau : la porte est ouverte, il revient vers nous et la tire derrière lui
ArriereScene.prototype.revenirDuBureau = async function () {
  const cam = this.cameras.main;
  cam.setScroll(Phaser.Math.Clamp(this.porteBureau.x - 480, 0, ELARGI_ARRIERE), 0);
  cam.fadeIn(320);
  await revenirParLaPorte(this, this.heros, this.porteBureau, { profHeros: 3.6 });
};

// --- Passer une porte d'intérieur (l'arrière-boutique, la promenade) ---
// Il va contre le mur, à gauche du vantail, la main à hauteur de la poignée ; il la prend, pousse : le vantail tourne
// vers la pièce d'à côté ; puis il passe, de dos, sous le chambranle et devant le vantail ouvert. La caméra s'éteint.
async function passerPorte(s, h, p, { profHeros = 3.6, sol = SOL_ARRIERE } = {}) {
  s.animPorte = true;
  const E = h.scaleX, G = window.GAME;
  const k = textureJoueurPose(s, G, 'troisQuarts', 'empoigne'), m = mainTendue(s, k);
  const xA = p.poignee.x - m.dx * E, yA = Math.max(sol + 8, p.poignee.y + m.dy * E);
  await marcherJusqua(s, h, xA, yA, { vue: 'face' });
  if (!h.active) return;
  // il prend la poignée
  h.setTexture(k).setFlipX(false).setOrigin(0.5, 1);
  await pauseBureau(s, 260);
  // il pousse : la porte s'ouvre vers la pièce d'à côté
  // (la porte part vers la pièce d'à côté : passé 45°, sa main la lâche)
  const ouverture = p.ouvrir();
  await pauseBureau(s, 230);
  if (!h.active) return;
  tournerJoueur(s, h, 'face');
  await ouverture;
  await pauseBureau(s, 160);
  if (!h.active) return;
  // il passe : de dos, sous le chambranle
  await marcherJusqua(s, h, p.x - 2, sol + 4, { vue: 'dos', echelle: E * 0.97 });
  h.setDepth(p.prof - 0.01);
  s.cameras.main.fadeOut(380);
  await marcherJusqua(s, h, p.x - 2, sol - 8, { vue: 'dos', echelle: E * 0.92 });
  await pauseBureau(s, 60);
  h.setScale(E).setDepth(profHeros);
}
// Il revient par la porte (ouverte) : de face, il passe le seuil, tire la porte derrière lui et s'avance dans la pièce
async function revenirParLaPorte(s, h, p, { profHeros = 3.6, sol = SOL_ARRIERE, solHeros = SOL_HEROS_ARRIERE } = {}) {
  s.animPorte = true; s.cibleX = null; s.cible = null;
  const E = h.scaleX;
  p.montrer(75);
  tournerJoueur(s, h, 'deFace');
  h.setPosition(p.x - 2, sol - 8).setScale(E * 0.92).setDepth(p.prof - 0.01).setVisible(true);
  await pauseBureau(s, 200);
  await marcherJusqua(s, h, p.x - 2, sol + 6, { vue: 'deFace', echelle: E * 0.97 });
  h.setDepth(profHeros);
  p.fermer();   // (il la tire derrière lui)
  await marcherJusqua(s, h, p.x - 2, solHeros, { vue: 'deFace', echelle: E });
  h.setScale(E);
  s.animPorte = false;
}

// --- La promenade du soir : la même pièce élargie, et la porte du bureau ---
{
  const portesAvant = PromenadeScene.prototype.portes;
  PromenadeScene.prototype.portes = function () {
    portesAvant.call(this);
    if (this.scene.key !== 'Promenade' || !this.porteBureau) return;   // (la nuit du cambrioleur réutilise le décor, sans y marcher)
    const p = this.porteBureau;
    this.add.zone(p.x, SOL_ARRIERE - 90, 100, 180).setDepth(8.6).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.allerAuBureau());
  };
  const majAvant = PromenadeScene.prototype.update;
  PromenadeScene.prototype.update = function (t, d) {
    if (this.animPorte) { if (this.suivre) this.suivre(d); return; }
    return majAvant.call(this, t, d);
  };
}
PromenadeScene.prototype.allerAuBureau = async function () {
  if (this.transition || this.fini || this.animPorte || this.piece !== P_ARRIERE) return;
  const G = this.G, p = this.porteBureau;
  if (typeof lieuDebloque === 'function' && !lieuDebloque(G, 'bureau')) { this.allerVers(p.x - 44); const d = DEBLOCAGES.bureau; return this.dire(`${d.nom} s'ouvrira ${d.quand}.`); }
  this.transition = true; this.cible = null;
  if (this.heros.marche) { this.heros.marche.remove(); this.heros.marche = null; }
  await passerPorte(this, this.heros, p, { profHeros: 8.5 });
  if (this.fini || !this.sys.isActive()) { this.transition = false; this.animPorte = false; return; }
  this.scene.pause();
  this.scene.launch('Bureau', { retour: 'Promenade', parLaPorte: true });
  this.scene.moveAbove('Promenade', 'Bureau');
};
PromenadeScene.prototype.revenirDuBureau = async function () {
  const cam = this.cameras.main, piece = PIECES_PROMENADE[P_ARRIERE], p = this.porteBureau;
  cam.setScroll(Phaser.Math.Clamp(p.x - 480, piece.x, piece.x + piece.largeur - 960), 0);
  cam.fadeIn(320);
  await revenirParLaPorte(this, this.heros, p, { profHeros: 8.5, solHeros: SOL_PROMENADE });
  this.heros.setY(SOL_PROMENADE);
  this.transition = false;
};
