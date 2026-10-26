// (planche 91, validée) Le val d'Ardévanne et la forêt de Sérambre : leurs gens au comptoir, et leur découverte dans
// les récits.
//  - Les apprentis du seigneur Évrandel (Ruvel et Vélanne) viennent acheter ses outils : un seigneur n'achète pas ses
//    outils lui-même. Ils passent quand tu as rempli assez d’objectifs, puis une semaine après un achat (quatre jours après un refus).
//  - Le seigneur Évrandel, maître des Terrasses, ne vient en personne qu'une fois que ses apprentis ont été bien servis
//    et que tu as rempli assez d'objectifs ; puis Dame Ardéline, la Dame aux Lanternes, plus tard encore, et ensuite
//    une fois par saison. Chacun a son entrée en scène (voir entreeEnScene), travaillée comme celle de la Faucheuse :
//    sa lumière, son son, son rythme, ses mots.
//  - La première fois qu'un voyageur arrive au val ou à la forêt, son récit s'arrête sur le lieu (decouverteDuLieu).
// La sauvegarde : G.elfes (voir elfesParDefaut ; une vieille partie le reçoit à son chargement).

const SEUILS_ELFES = { apprentis: 5, evrandel: 7, ardeline: 9 };   // (le nombre d'objectifs remplis)
const PERSONNES_ELFES = {
  ardeline: { nom: 'Dame Ardéline', race: 'elfe', feminin: true, figurant: 'ardeline' },
  evrandel: { nom: 'Le seigneur Évrandel', race: 'elfe', feminin: false, figurant: 'evrandel' },
  ruvel: { nom: 'Ruvel', race: 'elfe', feminin: false, figurant: 'ruvel' },
  velanne: { nom: 'Vélanne', race: 'elfe', feminin: true, figurant: 'velanne' },
};
// Les commandes des apprentis : les outils des Terrasses (des cordes pour les ponts, de quoi couper et éclairer)
const COMMANDES_TERRASSES = [[['corde', 2]], [['corde', 1], ['torche', 2]], [['hache', 1]], [['cape', 1], ['corde', 1]], [['bandage', 3]], [['corde', 3]]];
// Ce que la Dame demande quand elle revient, à chaque saison
const DEMANDES_DAME = [[['potion', 1]], [['cape', 1]], [['antidote', 1]], [['corde', 2]], [['amulette', 1]]];
if (typeof POSTES !== 'undefined') { POSTES.terrasses = 'Les Terrasses d’Ardévanne'; POSTES.dame = 'La Dame aux Lanternes'; }

function elfesParDefaut() { return { apprentis: 0, commandes: 0, prochainApprenti: 0, evrandel: 0, ardeline: 0, saisonDame: null, decouvertes: {} }; }
function etatElfes(G) {
  if (!G.elfes) G.elfes = elfesParDefaut();
  const e = G.elfes; e.decouvertes = e.decouvertes || {};
  return e;
}
function objectifsRemplis(G) { return typeof etatObjectifs === 'function' ? Object.keys(etatObjectifs(G).faits || {}).length : 0; }
function saisonElfes(G) { return typeof saisonDe === 'function' ? saisonDe(G, G.jour) : null; }

// Les visites du jour (appelé quand la file se forme, le matin)
function visitesDuVal(G) {
  if (!G || G.faillite || G.jour < 6) return [];
  const e = etatElfes(G), n = objectifsRemplis(G);
  // la Dame : une fois le seigneur venu (et au moins cinq jours plus tard), puis à chaque nouvelle saison
  if (!e.ardeline && e.evrandel && n >= SEUILS_ELFES.ardeline && G.jour >= e.evrandel + 5) return [{ type: 'ardeline', invisible: true }];
  if (e.ardeline && G.jour >= e.ardeline + 8 && saisonElfes(G) && saisonElfes(G) !== e.saisonDame) return [{ type: 'ardeline', invisible: true, retour: true, demande: DEMANDES_DAME[(G.jour + e.apprentis) % DEMANDES_DAME.length] }];
  // le seigneur, quand ses apprentis ont été servis deux fois
  if (!e.evrandel && e.commandes >= 2 && n >= SEUILS_ELFES.evrandel) return [{ type: 'evrandel' }];
  // ses apprentis, chacun son tour
  if (n >= SEUILS_ELFES.apprentis && G.jour >= (e.prochainApprenti || 0)) return [{ type: 'apprenti', qui: e.apprentis % 2 ? 'velanne' : 'ruvel', commande: COMMANDES_TERRASSES[(e.apprentis * 5 + G.jour) % COMMANDES_TERRASSES.length] }];
  return [];
}

// Ce que les visites changent à la partie (à part de la mise en scène : la simulation s'en sert aussi)
const PRIME_EVRANDEL = 80;
function nomCommandeElfes(commande) { return commande.map(([id, q]) => `${q} ${(ITEMS[id] ? ITEMS[id].nom : id).toLowerCase()}${q > 1 && ITEMS[id] && !/s$/.test(ITEMS[id].nom) ? 's' : ''}`).join(' et '); }
function prixCommandeElfes(commande, facteur) { return Math.round(commande.reduce((s, [id, q]) => s + (ITEMS[id] ? ITEMS[id].prix : 5) * q, 0) * facteur); }
function prixApprenti(G, commande) { return prixCommandeElfes(commande, etatElfes(G).evrandel ? 3 : 2); }   // (le double, le triple une fois le seigneur venu)
function aDeQuoiServir(G, commande) { return commande.every(([id, q]) => (G.stock[id] || 0) >= q); }
function servirLesElfes(G, commande, prix, poste) { for (const [id, q] of commande) G.stock[id] -= q; encaisser(G, prix, poste); }
function servirApprenti(G, commande) { const prix = prixApprenti(G, commande); servirLesElfes(G, commande, prix, 'terrasses'); etatElfes(G).commandes++; return prix; }
function departApprenti(G, servi) { const e = etatElfes(G); e.apprentis++; e.prochainApprenti = G.jour + (servi ? 7 : 4); }
function recevoirEvrandel(G) { encaisser(G, PRIME_EVRANDEL, 'terrasses'); G.reputation += 1; etatElfes(G).evrandel = G.jour; }
function cadeauDeLaDame(G) { const e = etatElfes(G); G.stock.torche = (G.stock.torche || 0) + 3; e.ardeline = G.jour; e.feuille = true; }
function servirLaDame(G, demande) { const prix = prixCommandeElfes(demande, 3); servirLesElfes(G, demande, prix, 'dame'); G.reputation += 1; return prix; }
function finVisiteDame(G) { etatElfes(G).saisonDame = saisonElfes(G); }

// --- Les petits dessins des visites : la lanterne-feuille, la feuille d'érable, les racines de la fenêtre, la canne ---
const RAMPE_LANTERNE = [0x7a3a08, 0xb06010, 0xe0901c, 0xf8b838, 0xffd870, 0xfff4c0];
const RAMPE_LANTERNE_ETEINTE = [0x2a1a10, 0x3e2614, 0x56361a, 0x6e4822, 0x86602c, 0x9e7838];
function texturesElfes(scene) {
  if (scene.textures.exists('elfes_lanterne')) return;
  // la lanterne-feuille : une feuille pliée en deux, sa nervure, son fil ; allumée et éteinte
  for (const [cle, R] of [['elfes_lanterne', RAMPE_LANTERNE], ['elfes_lanterneEteinte', RAMPE_LANTERNE_ETEINTE]]) {
    const t = new ToileHD(12, 20); t.rampes.l = R; t.rampes.fil = rampe(0x3a2414);
    for (let y = 0; y < 5; y++) t.poser(6, y, 'fil', 2);
    for (let j = 0; j < 14; j++) { const demi = Math.round(4.6 * Math.sin((j + 0.5) / 14 * Math.PI) * (j < 7 ? 1 : 1 - (j - 7) * 0.05)); for (let i = -demi; i <= demi; i++) t.poser(6 + i, 5 + j, 'l', i < -1 ? 5 : j > 11 ? 2 : i > 2 ? 3 : 4); }
    for (let j = 1; j < 13; j++) t.poser(6, 5 + j, 'l', 2);
    t.contour(); t.texture(scene, cle);
  }
  // la feuille d'érable : cinq lobes pointus, la nervure ; rouge, orange, or (et celle qui ne fane pas, plus claire)
  [['elfes_feuilleR', 0xc83a16], ['elfes_feuilleO', 0xe0741e], ['elfes_feuilleJ', 0xe0a828], ['elfes_feuilleD', 0xf0a030]].forEach(([cle, c]) => {
    const t = new ToileHD(15, 15); t.rampes.f = rampe(c); t.rampes.q = rampe(0x6a3a1a);
    const lobe = (a, L) => { for (let r = 0; r < L; r += 0.5) { const w = Math.max(0.6, (1 - r / L) * L * 0.38); for (let s = -w; s <= w; s += 0.5) t.poser(Math.round(7 + Math.cos(a) * r - Math.sin(a) * s), Math.round(8 + Math.sin(a) * r + Math.cos(a) * s), 'f', s < 0 ? 4 : 3); } };
    lobe(-Math.PI / 2, 7.4); lobe(-Math.PI / 2 - 1.15, 6.2); lobe(-Math.PI / 2 + 1.15, 6.2); lobe(Math.PI / 2 + 1.0, 4); lobe(Math.PI / 2 - 1.0, 4);
    for (let r = 0; r < 6; r++) t.poser(7, 8 - r, 'f', 1); for (let r = 0; r < 4; r++) t.poser(7, 9 + r, 'q', 2);
    t.contour(); t.texture(scene, cle);
  });
  // les racines qui montent le long de la fenêtre et courent sur le rebord (sur une toile de la taille de la fenêtre, ×2)
  {
    const W = FENETRE.w / 2, H = FENETRE.h / 2, t = new ToileHD(W, H);
    Object.assign(t.rampes, { arbEcorce: [0x1a0e08, 0x2e1a0e, 0x462816, 0x603a20, 0x7c502c, 0x9a6a3c], arbVert: [0x14302c, 0x22483e, 0x2e5a30, 0x3e7a3e, 0x5a9a4e, 0x80b46a], f: rampe(0xc83a16) });
    const put = (x, y, m, i) => { x = Math.round(x); y = Math.round(y); if (t.dans(x, y)) t.poser(x, y, m, Math.max(0, Math.min(5, Math.round(i)))); };
    for (const s of [-1, 1]) {
      const x0 = s < 0 ? 4 : W - 5;
      torsade(put, u => [x0 + s * -Math.sin(u * 5) * 2.5 + s * -u * 4, H - 1 - u * (H - 8)], { largeur: u => 3.2 - u * 1.8, nb: 3, tours: 2.4, g: 31 + s, ecart: 0.5 });
      torsade(put, u => [x0 + s * -(u * 40 + Math.sin(u * 3) * 3), H - 3 - Math.sin(u * Math.PI) * 4], { largeur: u => 2.2 - u * 1.2, nb: 2, tours: 1.8, g: 41 + s, ecart: 0.45 });
      for (const [u, d] of [[0.35, 1], [0.6, -1], [0.82, 1]]) { const y = H - 1 - u * (H - 8), x = x0 + s * -Math.sin(u * 5) * 2.5 + s * -u * 4; traitArbre(put, x, y, x + d * 7, y - 6, 1.4, 0.8, 'arbEcorce', 50 + u * 10);
        for (const [dx, dy] of [[d * 8, -7], [d * 6, -9]]) t.forme('f', ellipsoide(x + dx, y + dy, 1.6, 1.1), { decalage: 0.4, ombre: false }); }
    }
    t.contour(); t.texture(scene, 'elfes_racines');
  }
  // la canne de racine vivante, plantée devant la fenêtre
  {
    const t = new ToileHD(16, 70); Object.assign(t.rampes, { arbEcorce: [0x1a0e08, 0x3a2414, 0x5a3820, 0x6a4628, 0x8a6036, 0xa87a48], arbVert: [0x14302c, 0x22483e, 0x2e5a30, 0x3e7a3e, 0x5a9a4e, 0x80b46a] });
    const put = (x, y, m, i) => { x = Math.round(x); y = Math.round(y); if (t.dans(x, y)) t.poser(x, y, m, Math.max(0, Math.min(5, Math.round(i)))); };
    torsade(put, u => [8 + Math.sin(u * 7) * 0.8, 69 - u * 60], { largeur: u => 2.2 - u * 0.6, nb: 2, tours: 2, g: 7, ecart: 0.35 });
    t.contour(); t.texture(scene, 'elfes_canne');
  }
  // (l'entrée du seigneur) l'arche de racines tressées dans l'encadrement de la fenêtre : deux faisceaux montent des coins
  // du bas le long des montants, se courbent en ogive et se nouent au milieu du linteau ; des radicelles pendent dessous
  {
    const W = FENETRE.w / 2, H = FENETRE.h / 2, t = new ToileHD(W, H);
    Object.assign(t.rampes, { arbEcorce: [0x1a0e08, 0x2e1a0e, 0x462816, 0x603a20, 0x7c502c, 0x9a6a3c], arbVert: [0x1e2a14, 0x2e3c1c, 0x445424, 0x5a6a2c, 0x76843a, 0x94a04c] });
    const put = (x, y, m, i) => { x = Math.round(x); y = Math.round(y); if (t.dans(x, y)) t.poser(x, y, m, Math.max(0, Math.min(5, Math.round(i)))); };
    const u0 = 0.38, cote = (s, u) => {
      let x, y;
      if (u < u0) { const v = u / u0; x = 5 + Math.sin(v * 6) * 1.5; y = H - 1 - v * (H - 1 - 52); }
      else { const v = (u - u0) / (1 - u0), a = Math.PI - v * Math.PI / 2; x = W / 2 + (W / 2 - 5) * Math.cos(a); y = 52 - 43 * Math.sin(a); }
      return [s < 0 ? x : W - 1 - x, y];
    };
    for (const s of [-1, 1]) {
      torsade(put, u => cote(s, u), { largeur: u => 3.8 - u * 1.9, nb: 3, tours: 5, g: 61 + s, ecart: 0.5 });
      torsade(put, u => { const [x, y] = cote(s, u * 0.92); return [x - s * 3 * Math.sin(u * Math.PI), y + 2.5 * Math.sin(u * Math.PI)]; }, { largeur: u => 1.6 - u * 0.6, nb: 2, tours: 3, g: 71 + s, ecart: 0.35 });
      // les radicelles qui pendent sous l'arche, et sur les montants les petits rejets qui s'accrochent au bois
      for (const u of [0.48, 0.6, 0.72, 0.84, 0.94]) { const [x, y] = cote(s, u); traitArbre(put, x, y + 1, x + s * -1.5, y + 5 + (u * 37 % 5), 0.9, 0.4, 'arbEcorce', 80 + u * 10); }
      for (const u of [0.12, 0.24, 0.33]) { const [x, y] = cote(s, u); traitArbre(put, x, y, x - s * 5, y - 4, 1.1, 0.5, 'arbEcorce', 90 + u * 10); }
    }
    // le nœud au milieu du linteau, et un peu de mousse dans les creux
    t.forme('arbEcorce', ellipsoide(W / 2, 9, 4.2, 3.2), { decalage: 0.5 });
    for (const [x, y] of [[8, 40], [W - 9, 46], [20, 22], [W - 22, 20], [W / 2 - 5, 10], [6, 80], [W - 7, 70]]) t.forme('arbVert', ellipsoide(x, y, 1.8, 1.1), { decalage: 0.4, ombre: false });
    t.contour(); t.texture(scene, 'elfes_arche');
  }
  // une latte du plancher du comptoir (planche de chêne, deux clous) ; une vrille de racine qui se retire sous la main
  {
    const t = new ToileHD(28, 6); t.rampes.l = [0x2a160a, 0x4a2a14, 0x6a4020, 0x8a5a30, 0xa87444, 0xc49058];
    for (let x = 0; x < 28; x++) for (let y = 0; y < 5; y++) t.poser(x, y, 'l', y === 0 ? 4 : y === 4 ? 1 : (x * 7 + y * 13) % 11 === 0 ? 2 : 3);
    for (const x of [2, 25]) t.poser(x, 2, 'l', 0);
    t.contour(); t.texture(scene, 'elfes_latte');
  }
  {
    const t = new ToileHD(22, 10); t.rampes.arbEcorce = [0x1a0e08, 0x2e1a0e, 0x462816, 0x603a20, 0x7c502c, 0x9a6a3c];
    const put = (x, y, m, i) => { x = Math.round(x); y = Math.round(y); if (t.dans(x, y)) t.poser(x, y, m, Math.max(0, Math.min(5, Math.round(i)))); };
    traitArbre(put, 0, 4, 14, 3, 1.8, 1, 'arbEcorce', 101); traitArbre(put, 14, 3, 18, 6, 1, 0.6, 'arbEcorce', 102); traitArbre(put, 18, 6, 15, 8, 0.6, 0.4, 'arbEcorce', 103);
    t.contour(); t.texture(scene, 'elfes_vrille');
  }
}

// Un petit délai qui suit l'horloge de la scène
function attendreElfes(scene, ms) { return new Promise(ok => scene.time.delayedCall(ms, ok)); }

if (typeof CounterScene !== 'undefined') Object.assign(CounterScene.prototype, {
  // les accroches de CounterScene : la texture de la file, la personne en buste
  textureSpeciale(entree, pose) {
    if (entree.type === 'apprenti') return corpsHD(this, entree.qui, pose);
    if (entree.type === 'evrandel') return corpsHD(this, 'ruvel', pose);   // (dans la file, c'est Ruvel qu'on voit : le maître ne fait pas la queue)
    if (entree.type === 'ardeline') return corpsHD(this, 'ardeline', pose);
    return null;
  },
  personneSpeciale(entree) {
    if (entree.type === 'apprenti') return PERSONNES_ELFES[entree.qui];
    if (entree.type === 'evrandel') return PERSONNES_ELFES.evrandel;
    if (entree.type === 'ardeline') return PERSONNES_ELFES.ardeline;
    return null;
  },
  // Les entrées en scène : le seigneur et la Dame ne s'avancent pas comme les autres
  entreeEnScene(entree) {
    if (entree.type === 'evrandel') { this.entreeEvrandel(entree); return true; }
    if (entree.type === 'ardeline') { this.entreeArdeline(entree); return true; }
    return false;
  },
  // la file avance d'une place (le premier est parti, ou n'a jamais été là)
  avancerFileElfes() {
    const premier = this.fileSprites.shift(); if (premier) premier.destroy();
    this.fileSprites.forEach((sprite, i) => {
      sprite.setVisible(!sprite.estPigeon);
      this.tweens.add({ targets: sprite, x: FILE.x - i * FILE.ecart, duration: 900, delay: 300 + i * 150, ease: 'Sine.easeInOut', onStart: () => sprite.estPigeon || pasDeMarche(this, sprite, 900) });
    });
    this.majFileAttente();
  },
  // tout ce que pose une visite des elfes, qu'on enlève à la fin
  objetElfes(o) { (this.objetsElfes = this.objetsElfes || []).push(o); return o; },
  nettoyerElfes() { (this.objetsElfes || []).forEach(o => { this.tweens.killTweensOf(o); if (o.active) o.destroy(); }); this.objetsElfes = []; if (this.minuterieFeuilles) { this.minuterieFeuilles.remove(); this.minuterieFeuilles = null; } },
  // un dialogue pas à pas, comme la Faucheuse : [qui, texte] (qui = '' : le récit) ; à la fin, `suite`
  derouler(etapes, nomPlaque, suite) {
    const montrer = i => {
      if (i >= etapes.length) return suite();
      const [qui, texte, action] = etapes[i];
      if (action) action();
      if (qui) this.dire(texte, nomPlaque); else this.dire(texte, '');
      this.bouton('...', () => montrer(i + 1));
    };
    montrer(0);
  },
  viderPanneauCommande() {
    this.titreCommande.setText(''); this.sousTitre.setText(''); this.texteSac.setText(''); this.texteChance.setText('');
    this.aideCommande.setVisible(false); this.boutonEscorte.setVisible(false);
  },

  // --- L'entrée du seigneur Évrandel, le bâtisseur : lente et terrienne. Ses apprentis s'avancent et se rangent ; le
  // plancher du comptoir craque, deux lattes se soulèvent ; des racines en sortent, montent le long de l'encadrement et
  // s'y tressent en arche ; il passe dessous, sans se presser, la main sur une racine qui se retire ; ses apprentis
  // s'inclinent. (Rien de la Dame : ni lanternes, ni temps figé, ni feuilles en l'air.) ---
  async entreeEvrandel(entree) {
    texturesElfes(this); creerHalo(this);
    this.nettoyerElfes();
    this.perso.setVisible(false);
    this.buste = null;
    Son.jouer('clochette');
    this.raconter('Deux jeunes elfes en tablier de cuir s’avancent ensemble, sans un mot.');
    const premier = this.fileSprites[0], depart = premier ? premier.x : FILE.x;
    this.avancerFileElfes();
    const ech = FILE.echelle * 1.18, cx = FENETRE.x + FENETRE.w / 2, bas = FENETRE.y + FENETRE.h;
    const marcheur = (qui, x0, x1, flipFin, duree = 1500) => {
      const cle = corpsHD(this, qui), s = this.objetElfes(this.add.image(x0, FILE.y + 2, cle).setOrigin(0.5, 1).setScale(ech * echelleCorps(cle)).setDepth(1.6).setFlipX(x1 < x0));
      s.setMask(this.masqueFenetre); pasDeMarche(this, s, duree);
      this.tweens.add({ targets: s, x: x1, duration: duree, ease: 'Sine.easeInOut', onComplete: () => s.setFlipX(flipFin) });
      return s;
    };
    const ruvel = marcheur('ruvel', depart, cx - 132, false);
    await attendreElfes(this, 500);
    const velanne = marcheur('velanne', FENETRE.x - 40, cx + 132, true);
    await attendreElfes(this, 2100);
    // le plancher craque : deux lattes du rebord tremblent, puis se soulèvent sur des trous noirs
    this.raconter('Ils se rangent de chaque côté de la fenêtre. Sous le comptoir, le plancher se met à craquer, lentement.');
    Son.jouer('craquement');
    const lattes = [-1, 1].map(s => {
      const x = s < 0 ? FENETRE.x + 34 : FENETRE.x + FENETRE.w - 34;
      const trou = this.objetElfes(this.add.rectangle(x, bas - 3, 52, 6, 0x120a04, 0).setDepth(2.42));
      const l = this.objetElfes(this.add.image(x, bas - 3, 'elfes_latte').setScale(2).setDepth(2.46));
      l.trou = trou; l.x0 = x; l.cote = s;
      this.tweens.add({ targets: l, x: x + 1, duration: 60, yoyo: true, repeat: 9, delay: s < 0 ? 0 : 500 });
      return l;
    });
    await attendreElfes(this, 1700);
    Son.jouer('craquement', { fort: true });
    this.cameras.main.shake(500, 0.0012);
    for (const l of lattes) {
      this.tweens.add({ targets: l, angle: l.cote * -24, y: l.y - 9, x: l.x0 + l.cote * -6, duration: 420, ease: 'Back.easeOut' });
      this.tweens.add({ targets: l.trou, fillAlpha: 0.9, duration: 200 });
      for (let k = 0; k < 4; k++) {   // (la poussière du plancher)
        const p = this.objetElfes(this.add.image(l.x0 - 18 + k * 12, bas - 6, 'halo').setScale(0.12).setTint(0xb09070).setAlpha(0.5).setDepth(2.47));
        this.tweens.add({ targets: p, y: p.y - 14 - k * 3, scale: 0.34, alpha: 0, duration: 900 + k * 120 });
      }
    }
    await attendreElfes(this, 900);
    // les racines sortent des trous, montent le long des montants, et se tressent en arche (on les voit pousser du bas)
    this.raconter('Des racines sortent de sous les lattes. Elles montent le long de l’encadrement et s’y tressent, en arche, au-dessus de la fenêtre.');
    Son.jouer('racines');
    this.time.delayedCall(2100, () => Son.jouer('racines'));
    const arche = this.objetElfes(this.add.image(FENETRE.x, bas, 'elfes_arche').setOrigin(0, 1).setScale(2).setDepth(2.4));
    const voile = this.objetElfes(this.make.graphics({ add: false })); arche.setMask(voile.createGeometryMask()); arche.voile = voile;
    const pousse = arche.pousse = { h: 0 };
    const tracer = () => { voile.clear(); voile.fillStyle(0xffffff); voile.fillRect(FENETRE.x - 6, bas - pousse.h, FENETRE.w + 12, pousse.h + 4); };
    arche.tracer = tracer; tracer();
    this.tweens.add({ targets: pousse, h: FENETRE.h + 4, duration: 4600, ease: 'Sine.easeInOut', onUpdate: tracer });
    await attendreElfes(this, 4900);
    // lui : il passe sous l'arche, lentement ; sa main se pose sur une vrille, qui se retire
    this.raconter('Quelqu’un passe sous l’arche, sans se presser. Il pose la main sur une racine ; elle se retire sous ses doigts. Ses apprentis s’inclinent.');
    Son.ambiance('terrasses');
    const vrille = this.objetElfes(this.add.image(FENETRE.x + 12, bas - 92, 'elfes_vrille').setOrigin(0, 0.5).setScale(2).setDepth(2.41));
    const lui = marcheur('evrandel', FENETRE.x - 30, cx, false, 3600);
    this.time.delayedCall(900, () => { Son.jouer('feuille'); this.tweens.add({ targets: vrille, scaleX: 0, duration: 900, ease: 'Sine.easeIn' }); });
    const incliner = (s, d) => this.time.delayedCall(d, () => { if (!s.active) return; this.tweens.add({ targets: s, angle: s.flipX ? -6 : 6, scaleY: s.scaleY * 0.9, duration: 900, ease: 'Sine.easeInOut' }); });   // (la tête baissée, le dos un peu rond)
    incliner(ruvel, 1700); incliner(velanne, 3300);
    await attendreElfes(this, 3700);
    // il est arrivé : son buste monte, comme celui de chacun (devant l'arche, qui l'encadre)
    this.montrerBuste(PERSONNES_ELFES.evrandel, 'neutre');
    this.buste.pose = 'croises'; this.majVisage();
    const yBuste = this.perso.y;
    this.perso.setAlpha(0).setDepth(2.5).setY(yBuste + 26);
    this.tweens.add({ targets: lui, alpha: 0, duration: 500, delay: 100 });
    this.tweens.add({ targets: this.perso, alpha: 1, y: yBuste, duration: 900, ease: 'Sine.easeOut' });
    this.time.delayedCall(500, () => { if (this.buste) Son.jouer('voix', { personne: PERSONNES_ELFES.evrandel, ton: 'bonjour' }); });
    await attendreElfes(this, 1100);
    this.arrivee(entree);
  },
  visiteEvrandel(entree) {
    const G = this.G, e = etatElfes(G);
    this.avancer(JOURNEE.visite);
    this.viderPanneauCommande();
    this.titreCommande.setFontSize(17).setText('Le maître des Terrasses');
    const nom = 'Le seigneur Évrandel — maître des Terrasses';
    const prime = PRIME_EVRANDEL;
    this.derouler([
      ['', 'Il s’arrête sous l’arche et te regarde longtemps, comme on regarde un arbre avant de le tailler.'],
      ['E', '« Ruvel et Vélanne me parlent de toi depuis des saisons. Les cordes que tu leur as vendues tiennent encore. Une corde qui tient, c’est une parole tenue. »'],
      ['E', '« Je suis Évrandel. Je taille les terrasses d’Ardévanne. Un pont de racines, cela prend trois cents ans. On ne le bâtit pas : on le persuade. »'],
      ['E', '« Dis à tes aventuriers de passer sur mes ponts pieds nus. Les racines aiment savoir qui les traverse. »'],
      ['E', '« Ma fille siège au Conseil. Elle porte leur broche rouge. Depuis qu’elle est partie, je n’ai plus taillé un seul rameau. ... Pardonne-moi. Les vieux arbres parlent trop. »', () => this.exprimer('inquiet')],
      ['', `Il pose sur le comptoir une bourse de cuir tressée de racines : +${prime} pièces, et ta réputation grandit au val (+1). Ses apprentis paieront désormais mieux encore.`, () => {
        recevoirEvrandel(G); Son.jouer('pieces', { montant: prime }); this.majStock(); this.dessinerPieces(); this.exprimer('neutre');
        if (typeof noterJournal === 'function') noterJournal('visite du seigneur Évrandel');
      }],
      ['E', '« Nous nous reverrons quand la saison tournera. Ou dans cent ans. Pour moi, c’est pareil. »'],
    ], nom, () => this.departEvrandel());
  },
  async departEvrandel() {
    this.bouton('...', null);
    this.dire('Il repasse sous l’arche, du même pas. Les racines se dénouent et redescendent sous les lattes, qui retombent à leur place. Ses apprentis le suivent.', '');
    const ech = FILE.echelle * 1.18, cx = FENETRE.x + FENETRE.w / 2;
    // il se retourne et s'en va à pied, lentement ; le buste s'efface
    const cle = corpsHD(this, 'evrandel');
    const lui = this.objetElfes(this.add.image(cx, FILE.y + 2, cle).setOrigin(0.5, 1).setScale(ech * echelleCorps(cle)).setDepth(1.6).setFlipX(true).setAlpha(0));
    lui.setMask(this.masqueFenetre);
    this.tweens.add({ targets: this.perso, alpha: 0, duration: 700, ease: 'Sine.easeIn' });
    this.tweens.add({ targets: lui, alpha: 1, duration: 500, delay: 300 });
    this.time.delayedCall(500, () => { pasDeMarche(this, lui, 3200); this.tweens.add({ targets: lui, x: FENETRE.x - 60, duration: 3200, ease: 'Sine.easeIn' }); });
    const [ruvel, velanne] = (this.objetsElfes || []).filter(o => o.texture && /corps_(ruvel|velanne)/.test(o.texture.key));
    for (const [s, x, d] of [[ruvel, FENETRE.x - 50, 1400], [velanne, FENETRE.x - 90, 1900]]) if (s) this.time.delayedCall(d, () => { s.setFlipX(true); this.tweens.add({ targets: s, angle: 0, scaleY: s.scaleY / 0.9, duration: 300 }); pasDeMarche(this, s, 2000); this.tweens.add({ targets: s, x, duration: 2000, ease: 'Sine.easeIn' }); });
    // l'arche se dénoue du haut vers le bas, et rentre sous le plancher
    const arche = (this.objetsElfes || []).find(o => o.texture && o.texture.key === 'elfes_arche');
    this.time.delayedCall(2200, () => { Son.jouer('racines'); if (arche && arche.pousse) this.tweens.add({ targets: arche.pousse, h: 0, duration: 2600, ease: 'Sine.easeIn', onUpdate: arche.tracer }); });
    await attendreElfes(this, 4900);
    // les lattes retombent, le plancher se tait
    Son.jouer('pas');
    for (const l of (this.objetsElfes || []).filter(o => o.texture && o.texture.key === 'elfes_latte')) {
      this.tweens.add({ targets: l, angle: 0, y: FENETRE.y + FENETRE.h - 3, x: l.x0, duration: 260, ease: 'Bounce.easeOut' });
      if (l.trou) this.tweens.add({ targets: l.trou, fillAlpha: 0, duration: 200 });
    }
    await attendreElfes(this, 700);
    this.perso.setVisible(false).setAlpha(1).clearTint().setDepth(2);
    this.nettoyerElfes();
    if (this.titreCommande) this.titreCommande.setText('');
    Son.ambiance('comptoir');
    this.voyageurSuivant();
  },

  // --- L'entrée de Dame Ardéline : le vent se lève, les feuilles de la rue montent vers la fenêtre et s'y enroulent en
  // une colonne de feuilles d'érable qui tourne de plus en plus vite ; quand le tourbillon retombe, elle est là. Alors le
  // temps s'arrête dans l'automne : les feuilles qui tombaient encore restent en l'air, une feuille d'or, qui ne fanera
  // pas, se pose sur le comptoir, et les lanternes s'allument une à une autour d'elle ---
  async entreeArdeline(entree) {
    texturesElfes(this); creerHalo(this);
    this.nettoyerElfes();
    this.perso.setVisible(false);
    this.buste = null;
    this.avancerFileElfes();
    const retour = !!entree.retour, cx = FENETRE.x + FENETRE.w / 2, bas = SOL_COMPTOIR + 4, H = FENETRE.h - 34;
    const T = retour ? 4400 : 6400;   // (la montée du tourbillon)
    Son.jouer('vent', { duree: T / 1000 + 1.5 });
    this.raconter(retour ? 'Dehors, le vent se lève d’un coup. Tu reconnais ce bruit de feuilles.' : 'Dehors, le vent se lève d’un coup. Les feuilles de la rue montent vers ta fenêtre.');
    // les feuilles : chacune a sa hauteur dans la colonne, son angle, sa vitesse ; elles arrivent de la rue, à gauche
    const N = retour ? 52 : 72, feuilles = [];
    for (let k = 0; k < N; k++) {
      const f = this.objetElfes(this.add.image(FENETRE.x - 30 - Math.random() * 160, bas - Math.random() * 70, k === 0 ? 'elfes_feuilleD' : Phaser.Utils.Array.GetRandom(['elfes_feuilleR', 'elfes_feuilleR', 'elfes_feuilleO', 'elfes_feuilleJ'])).setAngle(Math.random() * 360));
      f.setMask(this.masqueFenetre);
      Object.assign(f, { hc: k === 0 ? 0.55 : Math.random(), th: Math.random() * Math.PI * 2, v: 0.85 + Math.random() * 0.4, x0: f.x, y0: f.y, e: k === 0 ? 1.9 : 1.05 + Math.random() * 0.6, rot: (Math.random() < 0.5 ? -1 : 1) * (120 + Math.random() * 200), retard: Math.random() * 0.22 });
      feuilles.push(f);
    }
    const etat = { u: 0 };
    let th = 0, avant = this.time.now;
    const tourner = () => {
      const now = this.time.now, dt = Math.min(0.05, (now - avant) / 1000); avant = now;
      const u = etat.u, omega = 1.2 + 13 * u * u;   // (de plus en plus vite)
      th += omega * dt;
      const R = 74 - 30 * u;                        // (et de plus en plus serrée)
      for (const f of feuilles) {
        if (!f.active) continue;
        const arrive = Phaser.Math.Clamp((u - f.retard) / 0.28, 0, 1), lisse = arrive * arrive * (3 - 2 * arrive);
        const a = f.th + th * f.v, h = f.hc * (0.35 + 0.65 * Math.min(1, u * 1.7)), r = R * (0.4 + 0.8 * h);   // (en entonnoir)
        const s = Math.sin(a), xc = cx + Math.cos(a) * r + Math.sin(now / 260 + f.hc * 9) * 3, yc = bas - 4 - h * H + s * 5;
        f.setPosition(f.x0 + (xc - f.x0) * lisse, f.y0 + (yc - f.y0) * lisse);
        f.setScale(f.e * (1 + 0.3 * s * lisse)).setDepth(s > 0 ? 2.65 : 1.9).setTint(s > 0 ? 0xffffff : 0xc89870);
        f.angle += (f.rot + omega * 40) * dt;
      }
    };
    this.events.on('update', tourner);
    const finTourner = () => this.events.off('update', tourner);
    this.events.once('shutdown', finTourner);
    this.tweens.add({ targets: etat, u: 1, duration: T, ease: 'Sine.easeIn' });
    const froissements = this.time.addEvent({ delay: 420, loop: true, callback: () => { Son.jouer('feuille'); froissements.delay = Math.max(140, froissements.delay - 30); } });
    await attendreElfes(this, T * 0.42);
    if (!retour) this.raconter('Elles s’enroulent sur elles-mêmes, de plus en plus vite : une colonne de feuilles d’érable, rousse, haute comme la fenêtre.');
    await attendreElfes(this, T * 0.36);
    // au cœur de la colonne, une lueur ; elle y est déjà, derrière les feuilles qui tournent
    const eclat = this.objetElfes(this.add.image(cx, bas - H * 0.5, 'halo').setTint(0xffc870).setAlpha(0).setScale(0.4).setBlendMode(Phaser.BlendModes.ADD).setDepth(1.95));
    this.tweens.add({ targets: eclat, alpha: 0.8, scale: 1.3, duration: T * 0.22, ease: 'Sine.easeIn' });
    this.montrerBuste(PERSONNES_ELFES.ardeline, 'neutre');
    this.buste.pose = 'coeur'; this.majVisage();
    this.perso.setAlpha(0).setDepth(2);
    this.tweens.add({ targets: this.perso, alpha: 1, duration: T * 0.22, ease: 'Sine.easeIn' });
    await attendreElfes(this, T * 0.22);
    // le tourbillon retombe d'un coup : les feuilles s'écartent et tombent
    finTourner(); froissements.remove();
    Son.jouer('vent', { duree: 1.2 }); Son.jouer('feuille');
    this.raconter(retour ? 'Le tourbillon retombe. Elle est là.' : 'Le tourbillon retombe d’un coup. Elle est là, au milieu des feuilles.');
    this.tweens.add({ targets: eclat, alpha: 0.25, scale: 1.6, duration: 900, ease: 'Sine.easeOut' });
    const tombe = new Map();
    for (const f of feuilles) {
      if (!f.active) continue;
      const dx = f.x - cx, duree = 1500 + Math.random() * 1100;
      // (elles s'écartent vite, et tombent de plus en plus vite)
      const ecart = this.tweens.add({ targets: f, x: f.x + Math.sign(dx || 1) * (50 + Math.random() * 70) + dx * 0.6, duration: duree * 0.8, ease: 'Sine.easeOut' });
      const chute = this.tweens.add({ targets: f, y: bas + 6 - Math.random() * 10, angle: f.angle + (Math.random() - 0.5) * 500, duration: duree, ease: 'Quad.easeIn' });
      tombe.set(f, { stop: () => { ecart.stop(); chute.stop(); } });
    }
    // ... et le temps s'arrête : celles qui sont encore en l'air y restent, prises dans l'ambre
    await attendreElfes(this, 420);
    Son.jouer('lanterne', { i: 0 });
    const ambre = this.objetElfes(this.add.rectangle(cx, FENETRE.y + FENETRE.h / 2, FENETRE.w, FENETRE.h, 0xd87a28, 0).setDepth(1.7));
    ambre.setMask(this.masqueFenetre);
    this.tweens.add({ targets: ambre, fillAlpha: 0.24, duration: 900, ease: 'Sine.easeOut' });
    const figees = [], visage = f => Math.abs(f.x - cx) < 78;   // (rien devant elle)
    const candidates = [...tombe.keys()].filter(f => f.active && f.texture.key !== 'elfes_feuilleD' && f.y < bas - 16 && !visage(f)).sort((a, b) => Math.abs(b.x - cx) - Math.abs(a.x - cx));
    for (const f of candidates.slice(0, 20)) { tombe.get(f).stop(); f.setTint(0xf0b878).setDepth(2.65); figees.push(f); }
    // (celles qui lui passeraient devant le visage tombent quand même : on la voit, entourée de feuilles immobiles)
    for (const [f] of tombe) if (f.active && !figees.includes(f) && f.texture.key !== 'elfes_feuilleD') this.tweens.add({ targets: f, alpha: 0, duration: 1200, delay: 500 });
    this.feuillesFigees = figees;
    this.fileFigee = this.fileSprites.filter(s => s.visible);
    this.fileFigee.forEach(s => { this.tweens.killTweensOf(s); if (s.marche) { s.marche.remove(); s.marche = null; } s.setTint(0xd89a5a); });
    // la feuille d'or, seule, continue de tomber, et se pose sur le comptoir
    const dore = feuilles[0];
    if (dore && dore.active) {
      if (tombe.get(dore)) tombe.get(dore).stop();
      const halo = this.objetElfes(this.add.image(dore.x, dore.y, 'halo').setTint(0xffc860).setAlpha(0.5).setScale(0.35).setBlendMode(Phaser.BlendModes.ADD).setDepth(2.55));
      dore.setDepth(2.66).clearMask();
      this.tweens.add({ targets: [dore, halo], x: cx - 70, y: SOL_COMPTOIR + 6, duration: retour ? 1100 : 1800, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: dore, angle: 360 * 2, scale: 1.8, duration: retour ? 1100 : 1800, ease: 'Sine.easeOut', onComplete: () => { dore.setAngle(-12); this.tweens.add({ targets: halo, scale: 0.5, alpha: 0.35, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }); } });
    }
    await attendreElfes(this, retour ? 900 : 1500);
    // les lanternes-feuilles, pendues au linteau, s'allument une à une autour d'elle
    if (!retour) this.raconter('Plus rien ne bouge. Autour de la fenêtre, des lanternes que tu n’avais jamais vues s’allument, une à une.');
    Son.ambiance('lanternes');
    // (trois de chaque côté, qui l'encadrent sans lui passer devant le visage ; elles s'allument du bord vers le milieu,
    // une à gauche, une à droite ; sous les plaques de l'heure et de la file, chacune pend à son fil depuis le linteau)
    const n = 6, pas = retour ? 240 : 420;
    for (let i = 0; i < n; i++) {
      const cote = i % 2 ? 1 : -1, rang = Math.floor(i / 2);
      const x = cx + cote * (FENETRE.w / 2 - 26 - rang * 40), y = FENETRE.y + 44 + [10, 2, 8][rang];
      const fil = this.objetElfes(this.add.rectangle(x, FENETRE.y, 2, y - FENETRE.y + 2, 0x3a2414).setOrigin(0.5, 0).setDepth(2.59));
      const l = this.objetElfes(this.add.image(x, y, 'elfes_lanterneEteinte').setOrigin(0.5, 0).setScale(2.4).setDepth(2.6));
      l.fil = fil;
      const h = this.objetElfes(this.add.image(x, y + 32, 'halo').setTint(0xffb040).setAlpha(0).setScale(0.2).setBlendMode(Phaser.BlendModes.ADD).setDepth(2.58));
      this.time.delayedCall(pas * i, () => { if (!l.active) return; l.setTexture('elfes_lanterne'); Son.jouer('lanterne', { i: i + 1 }); this.tweens.add({ targets: h, alpha: 0.55, scale: 0.42, duration: 500, ease: 'Sine.easeOut' }); });
      l.halo = h;
    }
    await attendreElfes(this, pas * n + 400);
    this.time.delayedCall(100, () => { if (this.buste) Son.jouer('voix', { personne: PERSONNES_ELFES.ardeline, ton: 'bonjour' }); });
    this.arrivee(entree);
  },
  visiteArdeline(entree) {
    const G = this.G, e = etatElfes(G), nom = 'Dame Ardéline — la Dame aux Lanternes';
    this.avancer(JOURNEE.visite);
    this.viderPanneauCommande();
    this.titreCommande.setFontSize(17).setText('La Dame aux Lanternes');
    const fin = () => { finVisiteDame(G); if (typeof noterJournal === 'function') noterJournal('visite de Dame Ardéline'); this.departArdeline(); };
    if (!entree.retour) {
      const vu = !!e.decouvertes.ardevanne;
      this.derouler([
        ['', 'Le temps s’est arrêté. Dans la file, personne ne bouge ; dehors, les feuilles ne tombent plus.'],
        ['A', '« N’aie pas peur. Ce n’est que l’automne. Chez moi, il ne finit jamais ; je l’ai apporté avec moi, le temps d’une visite. »'],
        ['A', '« Je suis Ardéline. Au val d’Ardévanne, on m’appelle la Dame aux Lanternes. Chaque feuille que je retiens garde un nom. Si elle tombe, quelqu’un, quelque part, l’oublie. »'],
        ['A', vu ? '« Ton voyageur a bu à mon lac. Il y a vu ce qui était, pas ce qui est. Ne le gronde pas s’il revient en pleurant. »'
          : '« Un jour, un de tes voyageurs passera le pont de racines. Alors tu sauras où je vis. »'],
        ['A', '« Le Sage parle de paix. Moi, je me souviens d’avant sa paix. Pas de tout. Juste assez pour allumer une lanterne. »', () => this.exprimer('inquiet')],
        ['', 'Elle laisse sur ton comptoir trois lanternes-feuilles, qui éclairent comme des torches (+3 torches dans ta réserve). La feuille d’érable, elle, reste posée là. Elle ne fane pas.', () => {
          cadeauDeLaDame(G); Son.jouer('trefle'); this.majStock(); this.exprimer('content');
        }],
        ['A', '« Quand la saison tournera, je reviendrai. Garde ma feuille près de toi. »'],
      ], nom, fin);
      return;
    }
    // ses retours, à chaque saison : elle demande une chose, la paie en or elfique
    const demande = entree.demande || DEMANDES_DAME[0], liste = nomCommandeElfes(demande);
    const prix = prixCommandeElfes(demande, 3), ok = aDeQuoiServir(G, demande);
    const repliques = ['« Les lanternes du val ont gardé encore un nom cette saison. Celui d’une enfant. Je ne te dirai pas lequel. »',
      '« Évrandel a taillé un rameau. Un seul. C’est la première fois depuis longtemps. »', '« La Lune grise chante au Col, la nuit. Je l’entends d’ici. Nous chantions la même chose, autrefois. »'];
    this.dire(`${repliques[(G.jour >> 2) % repliques.length]} « Cette saison, il me faudrait ${liste}. »`, nom);
    const donner = () => {
      servirLaDame(G, demande); Son.jouer('pieces', { montant: prix }); this.majStock(); this.dessinerPieces(); this.exprimer('content');
      this.dire(`« Merci. » Elle pose sur le comptoir ${prix} pièces d’or elfique, qui sentent la feuille morte (+1 réputation).`, nom);
      this.bouton('...', fin);
    };
    if (ok) this.choix([`Lui donner (+${prix} p.)`, donner], ['Je n’en ai pas', () => { this.dire('« Alors à la saison prochaine. J’ai le temps. »', nom); this.bouton('...', fin); }]);
    else { this.dire(`${repliques[(G.jour >> 2) % repliques.length]} « Il me faudrait ${liste}... mais tu n’en as pas. Ce n’est rien. À la saison prochaine. »`, nom); this.bouton('...', fin); }
  },
  async departArdeline() {
    this.bouton('...', null);
    this.dire('Elle incline la tête. Les lanternes s’éteignent une à une, et le vent se lève de nouveau. Dans la file, personne ne semble avoir rien remarqué.', '');
    this.tweens.add({ targets: this.perso, alpha: 0, duration: 1400, ease: 'Sine.easeIn' });
    const lanternes = (this.objetsElfes || []).filter(o => o.texture && o.texture.key === 'elfes_lanterne');
    lanternes.reverse().forEach((l, i) => this.time.delayedCall(300 + i * 280, () => { if (!l.active) return; l.setTexture('elfes_lanterneEteinte'); if (l.halo) this.tweens.add({ targets: l.halo, alpha: 0, duration: 400 }); this.tweens.add({ targets: [l, l.fil].filter(Boolean), alpha: 0, duration: 900, delay: 300 }); }));
    await attendreElfes(this, 1900);
    // le temps repart : les feuilles suspendues finissent de tomber, l'ambre s'en va
    Son.jouer('vent', { duree: 2 });
    for (const f of this.feuillesFigees || []) if (f.active) this.tweens.add({ targets: f, y: SOL_COMPTOIR + 30, x: f.x - 60, angle: f.angle + 300, duration: 1600 + Math.random() * 800, ease: 'Sine.easeIn' });
    for (const o of this.objetsElfes || []) if (o.type === 'Rectangle') this.tweens.add({ targets: o, fillAlpha: 0, duration: 1600 });
    (this.fileFigee || []).forEach(s => s.active && s.setTint(0xd8d0c0));
    this.fileFigee = []; this.feuillesFigees = [];
    await attendreElfes(this, 2200);
    // la feuille qui ne fane pas reste posée sur le comptoir, le temps de la journée
    const garder = (this.objetsElfes || []).filter(o => o.texture && o.texture.key === 'elfes_feuilleD');
    this.objetsElfes = (this.objetsElfes || []).filter(o => !garder.includes(o));
    this.perso.setVisible(false).setAlpha(1);
    this.nettoyerElfes();
    if (this.titreCommande) this.titreCommande.setText('');
    Son.ambiance('comptoir');
    this.voyageurSuivant();
  },

  // --- Les apprentis : ils viennent acheter les outils du maître ---
  visiteApprenti(entree) {
    const G = this.G, e = etatElfes(G), p = PERSONNES_ELFES[entree.qui], nom = `${p.nom} — ${p.feminin ? 'apprentie' : 'apprenti'} des Terrasses`;
    this.avancer(JOURNEE.visite);
    this.viderPanneauCommande();
    this.titreCommande.setFontSize(17).setText('Une commande des Terrasses');
    const commande = entree.commande || COMMANDES_TERRASSES[0];
    const liste = nomCommandeElfes(commande), prix = prixApprenti(G, commande), ok = aDeQuoiServir(G, commande);
    const bonjours = entree.qui === 'ruvel'
      ? ['« Bonjour ! Le maître m’envoie. Il dit que les outils des Hommes sont mal trempés, mais que les tiens, ça va. »', '« C’est encore moi ! Le maître a demandé ton nom, hier. Il ne demande jamais le nom de personne. »', '« Le maître a cassé une corde sur le pont du lac. Enfin, c’est le pont qui l’a cassée. »']
      : ['« Le seigneur Évrandel ne vient jamais lui-même. Il dit qu’un arbre ne va pas au marché. Alors c’est moi qui viens. »', '« Le val est roux, ce matin. Comme tous les matins. On ne s’en lasse pas. »', '« La Dame a allumé une lanterne de plus, cette nuit. Le maître dit que ce n’est pas notre affaire. »'];
    const bonjour = bonjours[Math.min(bonjours.length - 1, Math.floor(e.apprentis / 2))];
    this.dire(`${bonjour} Il nous faudrait ${liste}.`, nom, p.nom);
    this.exprimer('content');
    const partir = (servi) => { departApprenti(G, servi); this.bouton('Au revoir !', () => { this.bouton('...', null); this.partirPar(FENETRE.x - 80); }); };
    const vendre = () => {
      servirApprenti(G, commande); Son.jouer('pieces', { montant: prix }); this.majStock(); this.dessinerPieces();
      this.dire(entree.qui === 'ruvel' ? `« Merci ! Le maître dira « bien » sans lever les yeux. C’est beaucoup, chez lui. » (+${prix} pièces)` : `« Il sera content. Enfin, il ne le montrera pas, mais il le sera. » (+${prix} pièces)`, nom, p.nom);
      partir(true);
    };
    const non = () => { this.exprimer('inquiet'); this.dire('« Tant pis. Le maître attendra. Il sait attendre. »', nom, p.nom); partir(false); };
    if (ok) this.choix([`Lui vendre (+${prix} p.)`, vendre], ['Je n’en ai pas assez', non]);
    else this.bouton('Je n’en ai pas assez', non);
  },
});
if (typeof CounterScene !== 'undefined') CounterScene.prototype.visitesSpeciales = Object.assign(CounterScene.prototype.visitesSpeciales || {}, {
  apprenti(entree) { this.visiteApprenti(entree); },
  evrandel(entree) { this.visiteEvrandel(entree); },
  ardeline(entree) { this.visiteArdeline(entree); },
});

// --- Les sons et les musiques des elfes ---
if (typeof SONS !== 'undefined') Object.assign(SONS, {
  // une lanterne qui s'allume : une note de célesta, chacune plus haute que la précédente (une gamme pentatonique)
  lanterne(t, bus, o) { const d = [0, 2, 4, 7, 9, 12, 14][((o && o.i) || 0) % 7]; this.note('celesta', 587.33 * Math.pow(2, d / 12), t, 1.2, 0.7, bus); this.note('harpe', 293.66 * Math.pow(2, d / 12), t + 0.02, 0.8, 0.3, bus); },
  // une feuille qui vole : un frôlement léger
  feuille(t, bus) { this.bruit(0.5, t, bus, 0.08, 5200, 'highpass'); this.bruit(0.35, t + 0.25, bus, 0.05, 3800, 'bandpass'); },
  // les racines : un craquement de bois sourd, qui gémit lentement
  racines(t, bus) {
    for (let i = 0; i < 7; i++) this.bruit(0.06 + Math.random() * 0.08, t + i * 0.22 + Math.random() * 0.08, bus, 0.32, 220 + Math.random() * 260, 'lowpass');
    const osc = this.ctx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.setValueAtTime(58, t); osc.frequency.linearRampToValueAtTime(41, t + 1.6);
    const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 180; const g = this.ctx.createGain(); g.gain.setValueAtTime(0.0005, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.3); g.gain.exponentialRampToValueAtTime(0.0005, t + 1.7);
    osc.connect(f); f.connect(g); g.connect(bus); osc.start(t); osc.stop(t + 1.8);
  },
  // le plancher du comptoir qui craque : des grincements de bois secs, puis (fort) une latte qui saute
  craquement(t, bus, o) {
    const fort = o && o.fort;
    for (let i = 0; i < (fort ? 4 : 6); i++) this.bruit(0.05 + Math.random() * 0.07, t + i * (fort ? 0.05 : 0.28) + Math.random() * 0.06, bus, fort ? 0.4 : 0.22, 500 + Math.random() * 700, 'bandpass');
    const osc = this.ctx.createOscillator(); osc.type = 'triangle'; osc.frequency.setValueAtTime(fort ? 140 : 210, t); osc.frequency.linearRampToValueAtTime(fort ? 70 : 160, t + (fort ? 0.25 : 1.4));
    const g = this.ctx.createGain(); g.gain.setValueAtTime(0.0005, t); g.gain.exponentialRampToValueAtTime(fort ? 0.2 : 0.07, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0005, t + (fort ? 0.35 : 1.5));
    osc.connect(g); g.connect(bus); osc.start(t); osc.stop(t + 1.6);
  },
  // la découverte d'un lieu : un arpège de harpe qui monte, un accord de chœur tenu, des étincelles de célesta
  decouverte(t, bus) {
    [0, 7, 12, 16, 19, 24].forEach((d, i) => this.note('harpe', 196 * Math.pow(2, d / 12), t + i * 0.12, 1.4, 0.6, bus));
    [0, 7, 16].forEach(d => this.note('choeur', 196 * Math.pow(2, d / 12), t + 0.6, 2.6, 0.5, bus));
    [28, 31, 36].forEach((d, i) => this.note('celesta', 196 * Math.pow(2, d / 12), t + 1 + i * 0.18, 1, 0.35, bus));
  },
});
if (typeof THEMES !== 'undefined') Object.assign(THEMES, {
  // Dame Ardéline : une valse lente de célesta et de harpe, un bourdon grave, beaucoup de silence (l'automne figé)
  lanternes: {
    base: NOTE.D / 2, gamme: GAMMES.dorien, tempo: 60, temps: 3, phrase: 8,
    accords: [0, 5, 3, 4, 0, 5, 1, 4], octaveMelodie: 2,
    instruments: { melodie: 'celesta', accompagnement: 'harpe', basse: 'bourdon' }, reverb: 0.65,
    motif: { 0: [[0, 7, 1], [1, 9, 1], [2, 11, 1]], 1: [[0, 12, 3]], 4: [[0, 11, 1], [1, 9, 1], [2, 7, 1]], 7: [[0, 7, 3]] },
    rythmes: [[1, 1, 1], [2, 1], [3]], silence: 0.3, lie: 1.2,
    basse: (m, a) => [[0, a, 2.9]],
    accompagnement: (m) => [[0, 0, 0.9, 0.35], [1, 2, 0.9, 0.3], [2, 4, 0.9, 0.3]],
  },
  // le seigneur Évrandel : une flûte douce et patiente sur des cordes pincées, un bourdon de terre, des gouttes
  terrasses: {
    base: NOTE.G / 4, gamme: GAMMES.mixolydien, tempo: 54, temps: 4, phrase: 8,
    accords: [0, 0, 3, 4, 0, 6, 3, 4], octaveMelodie: 2,
    instruments: { melodie: 'fluteDouce', accompagnement: 'pizzicato', basse: 'bourdon' }, reverb: 0.55,
    motif: { 0: [[0, 7, 2], [2, 9, 2]], 2: [[0, 11, 1], [1, 9, 1], [2, 7, 2]], 4: [[0, 4, 2], [2, 7, 2]], 7: [[0, 7, 4]] },
    rythmes: [[2, 2], [1, 1, 2], [4]], silence: 0.35, lie: 1.1,
    basse: (m, a) => [[0, a, 3.9]],
    accompagnement: (m) => [[0, 0, 0.9, 0.4], [2, 2, 0.9, 0.3]],
    percussion: (m) => (m % 2 ? [[1.5, 'goutte', 0.35]] : []),
  },
});

// --- La découverte des lieux, dans les récits : la première fois qu'un voyageur y arrive ---
const DECOUVERTES_ELFES = {
  lac: { lieu: 'ardevanne', titre: 'Le val d’Ardévanne', sous: 'où l’automne ne finit jamais', feuilles: ['elfes_feuilleR', 'elfes_feuilleO', 'elfes_feuilleJ'], lumiere: 0xff9a40,
    depart: e => `« Au détour du chemin, la vallée s’est ouverte d’un coup : des coteaux en flammes, un lac immobile comme un miroir, et par-dessus l’eau, un pont de racines. Là-bas, c’était l’automne. Et ça l’est resté tout le temps que j’y suis resté${e}. »`,
    arrivee: e => `« Au bout du chemin, l’île de la rotonde. Ses lanternes brûlaient en plein jour. On dit qu’une Dame y veille. Je ne l’ai pas vue... mais quelqu’un m’a regardé${e} passer. »` },
  sanctuaire: { lieu: 'serambre', titre: 'La forêt de Sérambre', sous: 'où la lumière garde la couleur du soir', feuilles: ['elfes_feuilleJ', 'elfes_feuilleD', 'elfes_feuilleJ'], lumiere: 0xffd060,
    depart: e => `« Je suis entré${e} sous les arbres, et tout est devenu d’or. Les troncs sont tressés comme des cordes de cuivre, les feuilles se recouvrent comme des écailles, et la lumière tombe en colonnes. »`,
    arrivee: e => '« Et puis l’Arbre-Mère. Je n’ai jamais rien vu d’aussi grand. Ses racines s’ouvrent comme une porte, et tout au fond, quelque chose luisait. »' },
};
async function decouverteDuLieu(scene, moment) {
  const G = scene.G, v = scene.parti && scene.parti.voyageur, D = v && DECOUVERTES_ELFES[v.zone];
  if (!D || !G || scene.modeFiche) return;
  const e = etatElfes(G);
  if (moment === 'depart') { scene.decouverteEnCours = false; if (e.decouvertes[D.lieu] || scene.rapide) return; scene.decouverteEnCours = true; e.decouvertes[D.lieu] = G.jour; }
  else if (!scene.decouverteEnCours || scene.rapide || !(scene.parti.resultat && scene.parti.resultat.vivant && !scene.parti.resultat.echec)) return;
  const r = (scene.reperesRecit || [])[moment === 'depart' ? 0 : 1];
  if (!r || !r.img || !r.img.active) return;
  // (à l'arrivée : la dernière épreuve s'efface d'abord, sa nuit, sa pluie, sa bête)
  if (moment === 'arrivee') {
    if (scene.meteo) { scene.meteo.remove(); scene.meteo = null; }
    if (scene.nettoyerScenario) scene.nettoyerScenario();
    if (scene.decor) { scene.tweens.killTweensOf(scene.decor.list); scene.decor.removeAll(true); }
    if (scene.voile) scene.tweens.add({ targets: scene.voile, fillAlpha: 0, duration: 600 });
  }
  texturesElfes(scene); creerHalo(scene);
  const cam = scene.cameras.main, f = 0.55, k = moment === 'depart' ? 1.32 : 1.12;
  const xRepere = r.img.x + (scene.planLoin ? scene.planLoin.x : 0), yRepere = r.img.y - r.img.displayHeight * 0.45;
  const objets = [];
  const garder = o => { objets.push(o); return o; };
  // la lumière baisse autour, le lieu reste dans la sienne
  const voileLoin = garder(scene.add.rectangle(480, 270, 960, 540, 0x1a1008, 0).setScrollFactor(0).setDepth(-2.55));
  const voilePres = garder(scene.add.rectangle(480, 270, 960, 540, 0x1a1008, 0).setScrollFactor(0).setDepth(-1.3));
  const halo = garder(scene.add.image(xRepere, yRepere, 'halo').setScrollFactor(f, 1).setTint(D.lumiere).setAlpha(0).setScale(1.6).setBlendMode(Phaser.BlendModes.ADD).setDepth(-2.52));
  scene.tweens.add({ targets: voileLoin, fillAlpha: 0.22, duration: 1600 });
  scene.tweens.add({ targets: voilePres, fillAlpha: 0.3, duration: 1600 });
  scene.tweens.add({ targets: halo, alpha: 0.75, duration: 1800 });
  Son.jouer('decouverte');
  // la caméra s'approche du lieu (le repère défile à ×0,55 : on vise son centre)
  // (caméra d'origine 0 : à l'écran, x' = zoom × (x − facteur × scrollX) ; on garde le pré et les collines dans le champ)
  const vue = 960 / k, z = scene.zoomBase * k;
  let sx = (xRepere - 480 / k) / f;
  const sol = scene.coucheSol, col = scene.coucheCollines;
  if (sol) sx = Phaser.Math.Clamp(sx, sol.x, Math.max(sol.x, sol.x + sol.displayWidth - vue));
  if (col) sx = Phaser.Math.Clamp(sx, col.x / f, Math.max(col.x / f, (col.x + col.displayWidth - vue) / f));
  const sy = Phaser.Math.Clamp(yRepere - 190 / k, 0, 360 - 360 / k);
  // (la parallaxe décale le pré devant le lieu : les arbres qui le cacheraient, une fois la caméra arrivée, s'effacent un moment)
  const pmx = scene.planMoyen ? scene.planMoyen.x : 0, xEcran = xRepere - f * sx, demi = r.img.displayWidth / 2;
  const caches = (scene.arbresRecit || []).filter(a => a.active && a.visible && Math.abs(a.x + pmx - sx - xEcran) < demi + a.displayWidth * 0.4);
  const alphas = caches.map(a => a.alpha);
  scene.tweens.add({ targets: caches, alpha: 0, duration: 1800, ease: 'Sine.easeInOut' });
  scene.tweens.killTweensOf(cam);
  const retour = { zoom: cam.zoom, scrollX: cam.scrollX, scrollY: cam.scrollY };
  scene.tweens.add({ targets: cam, zoom: z, scrollX: sx, scrollY: sy, duration: 2600, ease: 'Sine.easeInOut' });
  // des feuilles qui volent devant (rousses au val, d'or à Sérambre), et à Sérambre des colonnes de lumière
  const vol = scene.time.addEvent({ delay: 340, loop: true, callback: () => {
    const x = Phaser.Math.Between(-20, 980), fl = garder(scene.add.image(x, -10, Phaser.Utils.Array.GetRandom(D.feuilles)).setScrollFactor(0).setDepth(6.8).setScale(1.2 + Math.random()).setAngle(Math.random() * 360));
    scene.tweens.add({ targets: fl, y: 380, x: x - 140 + Math.random() * 60, angle: fl.angle + 540, duration: 4200 + Math.random() * 1800, ease: 'Sine.easeIn', onComplete: () => fl.destroy() });
  } });
  if (D.lieu === 'serambre') for (let i = 0; i < 4; i++) {
    const c = garder(scene.add.rectangle(170 + i * 210, 160, 46 + i * 8, 520, 0xfff0b0, 0).setAngle(-18).setScrollFactor(0).setBlendMode(Phaser.BlendModes.ADD).setDepth(-1.2));
    scene.tweens.add({ targets: c, fillAlpha: 0.1, duration: 1800 + i * 300, delay: 600 + i * 250, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
  // le nom du lieu, comme une enluminure : un filet d'or, le nom, ce qu'on en dit
  const cadre = garder(scene.add.container(480, 92).setAlpha(0).setScrollFactor(0));
  const titre = scene.add.text(0, 0, moment === 'depart' ? D.titre : (D.lieu === 'ardevanne' ? 'L’île de la rotonde' : 'L’Arbre-Mère'), style(34, '#fff1c8', { fontStyle: 'bold', stroke: '#2a1408', strokeThickness: 6 })).setOrigin(0.5);
  const sous = scene.add.text(0, 32, moment === 'depart' ? D.sous : (D.lieu === 'ardevanne' ? 'où veille la Dame aux Lanternes' : 'le cœur de Sérambre'), style(17, '#f6dca0', { fontStyle: 'italic', stroke: '#2a1408', strokeThickness: 4 })).setOrigin(0.5);
  const l = Math.min(420, titre.width + 60), filet = scene.add.graphics();
  filet.lineStyle(2, 0xe8c068, 0.9).lineBetween(-l / 2, -26, -14, -26).lineBetween(14, -26, l / 2, -26);
  filet.fillStyle(0xe8c068, 1).fillTriangle(-6, -26, 0, -32, 6, -26).fillTriangle(-6, -26, 0, -20, 6, -26);
  cadre.add([filet, titre, sous]);
  scene.ui.add(cadre);
  scene.tweens.add({ targets: cadre, alpha: 1, y: 84, duration: 1400, delay: 900, ease: 'Sine.easeOut' });
  await new Promise(ok => scene.time.delayedCall(2200, ok));
  scene.ecrire(moment === 'depart' ? 'Une découverte' : 'En arrivant', D[moment](scene.e));
  await scene.attendreClic();
  // on revient au chemin
  vol.remove();
  scene.tweens.add({ targets: cadre, alpha: 0, duration: 700 });
  for (const o of [voileLoin, voilePres]) scene.tweens.add({ targets: o, fillAlpha: 0, duration: 900 });
  scene.tweens.add({ targets: halo, alpha: 0, duration: 900 });
  caches.forEach((a, i) => scene.tweens.add({ targets: a, alpha: alphas[i], duration: 1000, delay: 200 }));
  scene.tweens.add({ targets: cam, zoom: retour.zoom, scrollX: retour.scrollX, scrollY: retour.scrollY, duration: 1100, ease: 'Sine.easeInOut' });
  await new Promise(ok => scene.time.delayedCall(1150, ok));
  for (const o of objets) { scene.tweens.killTweensOf(o); if (o.active) o.destroy(); }
}
