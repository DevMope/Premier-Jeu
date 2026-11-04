// (v1.65, la ville des Hobbits en quartiers, chantier 2 : le socle) La scène commune à tous les quartiers de la ville.
// Elle reprend de la place des Mastres (MarchePlace.js) la marche, la caméra et l'interface, pour que chaque quartier se
// parcoure exactement comme la place :
//   - la marche : on marche partout, au clic (bouton gardé enfoncé : il suit le pointeur), aux flèches ou ZQSD, avec la
//     même vitesse, les mêmes images de pas et le même chemin qui contourne les obstacles (une grille de 20 px, lissée) ;
//     les pas sonnent comme le sol dans la banque de pas du jeu (pavés, pierre, terre, herbe, boue ; la neige l'hiver), et
//     sur les marches le corps se soulève à chaque pas ;
//   - la caméra : la vue de trois quarts de la place, ×1,25, qui suit JeuneGoy avec la même douceur et s'arrête aux
//     bornes du quartier ;
//   - les enseignes : le nom du quartier à l'entrée (un ruban qui se déroule), le nom de la rue ou de la placette où l'on
//     est dans le bandeau du haut, et les plaques de rue clouées aux murs, dans le décor ;
//   - les passages : chaque quartier sort par des passages visibles (le bord d'une rue, un porche, une porte, un escalier,
//     un pont). Devant l'un d'eux, une invite dit où il mène ; on le franchit (E, Espace, un clic dessus, ou en continuant
//     de marcher vers lui) : JeuneGoy y marche, la vue se ferme en fondu et s'ouvre de l'autre côté, où il arrive à pied
//     par le passage qui y correspond. Un passage pas encore fait le dit (« bientôt ») ;
//   - le plan de la ville (M), avec « tu es ici » ;
//   - quelques passants qui vont et viennent, à pied, par les mêmes chemins.
// Le décor de chaque quartier est décrit à part (DECORS_QUARTIERS : quartierSoucolline.js…), avec les outils de « ici »
// (outilsQuartier) : son sol (le moteur de pavage, solQuartiersHD.js), ses maisons, ses plaques, ses obstacles, ses
// zones nommées, ses passages et ses points d'arrivée.
// Phaser réutilise la scène : tout l'état est remis à zéro dans create().

const DECORS_QUARTIERS = {};
// Les réglages de la marche et de la caméra : ceux de la place des Mastres (PLACE_MARCHE), pour que tout se ressemble
function reglesQuartier() {
  const P = typeof PLACE_MARCHE !== 'undefined' ? PLACE_MARCHE : { zoom: 1.25, vitesse: 0.3, course: 0.6, echelle: 4.5 };
  return { zoom: P.zoom, vitesse: P.vitesse, course: P.course, echelle: P.echelle, douceur: 0.14, grille: 20, proche: 56 };
}

// Les outils donnés au décor d'un quartier pour se construire (ici.C est le monde : tout s'y trie par yTri, le pied
// des choses). Les décors déclarent aussi ce qui fait le quartier : ici.bornes, ici.marchable(x, y), ici.obstacles,
// ici.zones, ici.passages, ici.arrivees, ici.pointsPassants, ici.cheminees.
function outilsQuartier(s, C, saison) {
  const pal = paletteSaisonComte(saison);
  const ici = { C, pal, saison, bornes: { x0: 0, y0: 0, x1: 960, y1: 540 }, marchable: () => true, obstacles: [], zones: [], passages: [], arrivees: {}, pointsPassants: [], cheminees: [], plaques: [], arbres: [], regards: [], lumieres: [] };
  const poser = ici.poser = (o, yTri) => { o.yTri = yTri === undefined ? o.y : yTri; C.add(o); return o; };
  ici.img = (x, y, k, sc = 1.6, yTri, ox = 0.5, oy = 1) => poser(s.add.image(x, y, k).setOrigin(ox, oy).setScale(sc), yTri === undefined ? y : yTri);
  // (vue de haut, validée) l'ombre d'un personnage : une ellipse franche sous ses pieds (maisonVolumeHD.js)
  ici.ombrePerso = (x, y) => { const o = s.add.image(x, y - 1, ombreEllipseHD(s, 34, 11)).setScale(1.25); o.yTri = y - 0.5; C.add(o); return o; };
  ici.ombre = (x, y, l) => { const o = s.add.image(x + l * 0.06, y - 2, ombrePlaceHD(s)).setScale(l / 64, l / 64 * 0.9); o.yTri = y - 0.5; C.add(o); return o; };
  // un groupe dessiné « à l'ancienne » (à la position (0, 0) de la scène) puis rangé dans le monde, en (X, Y), à l'échelle F
  ici.lot = (X, Y, fn, yTri, F = 0.8) => { const avant = new Set(s.children.list); fn(); const nouv = s.children.list.filter(o => !avant.has(o)); const sub = s.add.container(X, Y).setScale(F); nouv.forEach(o => sub.add(o)); sub.yTri = yTri === undefined ? Y : yTri; C.add(sub); return sub; };
  // la cheminée d'une maison (son point noté dans la texture) : la fumée y monte en bouffées
  ici.chem = (cle, X, Y, sc = 1.6) => { const tx = s.textures.get(cle), c = tx.cheminee, src = tx.getSourceImage(); if (c) ici.cheminees.push([X + (c[0] - src.width * (tx.origineX || 0.5)) * sc, Y - (src.height - c[1]) * sc]); };
  ici.maison = (x, y, cle, o, sc = 1.6) => { const k = maison5(s, cle, o), im = ici.img(x, y + 2, k, sc), ox = s.textures.get(k).origineX; if (ox && ox !== 0.5) im.setOrigin(ox, 1); ici.chem(k, x, y + 2, sc); return im; };
  // une plaque clouée au mur d'un bâtiment (une image ou un groupe déjà posé), contre son bord gauche ou droit, à la hauteur h
  // (chantier 3 : le mur, c'est l'image du bâtiment ; dans un groupe, sa plus grande image, pas les bannières ni les écriteaux)
  ici.murDe = (bat) => { if (bat.type !== 'Container') return bat.getBounds(); let best = null;
    for (const o of bat.list) if (o.type === 'Image' && o.visible) { const r = o.getBounds(); if (!best || r.width * r.height > best.width * best.height) best = r; }
    return best || bat.getBounds(); };
  ici.plaqueSur = (bat, cote, h, texte, o = {}) => { const b = ici.murDe(bat), y0 = bat.yTri !== undefined ? bat.yTri : bat.y;
    return ici.plaque(0, y0 - h, texte, { entre: [b.left + (o.retrait || 0), b.right - (o.retrait || 0)], cote, yTri: y0 + 0.5, ...o }); };
  ici.arbre = (x, y, v = 0, sc = 2.2) => { ici.arbres.push([x, y, sc]); const cle = arbrePlaceHD(s, pal, v, x, y); ici.ombre(x + 10, y, 55 * sc); return poser(s.add.image(x, y, cle).setOrigin(0.5, origineArbre(s, cle)).setScale(sc), y); };
  ici.buisson = (x, y, sc = 2.2) => { const cle = buissonPlaceHD(s, pal, x, y); ici.ombre(x, y, 60); return poser(s.add.image(x, y, cle).setOrigin(0.5, origineArbre(s, cle)).setScale(sc), y); };
  ici.plaque = (x, y, texte, o = {}) => { const r = poserPlaqueRue(s, C, x, y, texte, o); ici.plaques.push(...r); return r; };
  // (chantier 3) une chose à regarder : un clic dans son cadre [x0, y0, x1, y1] (la façade d'une maison...), et JeuneGoy va
  // jusque devant elle (devant : [x, y], sinon au pied du cadre), puis la bulle dit le texte (ou ce que rend la fonction)
  ici.regarder = (x0, y0, x1, y1, texte, devant = null) => { const r = { regard: true, id: 'regard' + ici.regards.length, cadre: [x0, y0, x1, y1], texte, devant: devant || [(x0 + x1) / 2, y1 + 24] }; ici.regards.push(r); return r; };
  // (chantier 3) une lumière, la nuit : un halo chaud (x, y, rayon en unités du monde, teinte)
  ici.lumiere = (x, y, r = 60, teinte = 0xffb050, coeur = 0) => { ici.lumieres.push([x, y, r, teinte, coeur]); };
  // (retours du joueur) une grille d'égout : petite (la largeur de deux pavés), posée à plat DANS le caniveau, vue de trois
  // quarts. Sa place est vérifiée : tout son cadre sur le caniveau (le code du sol, ici.codeSol), à bonne distance de tout
  // obstacle (arbre, pilier, réverbère, banc, mur) et d'aucune marche ; sinon, on la décale le long du caniveau, vers le
  // point voulu, jusqu'à une place libre (ou on n'en pose pas). Notée dans ici.grilles (pour les essais).
  ici.grilles = [];
  ici.grille = (x, y, { dans = [SOL_VILLE.CANIVEAU], marge = 14 } = {}) => {
    const k = grilleEgoutHD(s), tx = s.textures.get(k).getSourceImage(), l = tx.width * 2, h = (tx.height - 1) * 2;   // (sans son ombre)
    const libre = (cx, cy) => {
      for (let u = -l / 2; u <= l / 2; u += 2) for (const v of [-h / 2 + 0.5, 0, h / 2 - 1.5]) if (!ici.codeSol || !dans.includes(ici.codeSol(cx + u, cy + v))) return false;
      for (const o of ici.obstacles) {
        if (o.length === 4) { if (cx + l / 2 + marge > o[0] && cx - l / 2 - marge < o[2] && cy + h / 2 + marge > o[1] && cy - h / 2 - marge < o[3]) return false; }
        else if (o.ellipse) { const [ex, ey, rx, ry] = o.ellipse; if (((cx - ex) / (rx + l / 2 + marge)) ** 2 + ((cy - ey) / (ry + h / 2 + marge)) ** 2 < 1) return false; }
      }
      for (const [ax, ay, sc] of ici.arbres) if (Math.abs(cx - ax) < 30 * sc + l / 2 && cy > ay - 95 * sc && cy < ay + 20) return false;   // (ni sous un arbre, ni sous son feuillage)
      if (ici.codeSol) for (let u = -l / 2 - marge; u <= l / 2 + marge; u += 4) for (const v of [-h / 2 - marge, h / 2 + marge]) if (ici.codeSol(cx + u, cy + v) === SOL_VILLE.MARCHES) return false;   // (loin des marches)
      return true;
    };
    for (let d = 0; d < 400; d += 4) for (const sx of d ? [-1, 1] : [1]) { const cx = x + sx * d; if (libre(cx, y)) {
      const im = ici.img(cx, y + h / 2 + 2, k, 2, y - 6); ici.grilles.push({ x: cx, y, l, h, im }); return im; } }
    return null;
  };
  // le sol du quartier : le moteur de pavage, sur les bornes, à la résolution ×2 ; code(X, Y) reçoit des coordonnées du monde
  ici.sol = (plan) => {
    const B = ici.bornes, [cle, L, H, code, o] = argumentsSolQuartier(plan, B, saison);
    solQuartierHD(s, cle, L, H, code, o);
    ici.solCle = cle; ici.solO = [B.x0, B.y0]; ici.codeSol = plan.code;
    poser(s.add.image(B.x0, B.y0, cle).setOrigin(0).setScale(2), -1e6);
    return cle;
  };
  return ici;
}

// Le plan du sol d'un quartier ({ id, code(X, Y), options }, en coordonnées du monde) traduit pour le moteur de pavage,
// qui travaille à la résolution de la texture (un pixel = deux unités du monde, à partir du coin des bornes)
function argumentsSolQuartier(plan, B, saison) {
  const o = plan.options || {}, W = f => f ? (x, y) => f(B.x0 + x * 2 + 1, B.y0 + y * 2 + 1) : null;
  return [`solQ_${plan.id}_${saison}`, Math.ceil((B.x1 - B.x0) / 2), Math.ceil((B.y1 - B.y0) / 2), W(plan.code),
    { saison, ...o, sauf: W(o.sauf), herbeJoints: W(o.herbeJoints), passage: W(o.passage), ombreSol: W(o.ombreSol) }];
}
// (v1.65) Préparer le sol d'un quartier en tâche de fond, depuis une autre scène (la rue, la place) : quand on y entre,
// il est prêt. Les autres dessins du quartier (plus petits) se font à l'arrivée, pendant le fondu.
function prechaufferQuartier(scene, id, saison = (typeof saisonDe === 'function' && window.GAME ? saisonDe(window.GAME) : 'semailles'), delai = 2500) {
  const def = DECORS_QUARTIERS[id]; if (!def || !def.planSol || !def.bornes) return null;
  const [cle, L, H, code, o] = argumentsSolQuartier(def.planSol(), def.bornes, saison);
  return prechaufferSolQuartier(scene, cle, L, H, code, o, { delai });
}

class QuartierScene extends Phaser.Scene {
  // (chantier 3) la rue Soucolline est un quartier montré par sa propre scène (RueScene, la clé « Rue »), qui hérite de celle-ci
  constructor(cle = 'Quartier') { super(cle); }

  init(data) { this.donnees = data || {}; }

  create() {
    const G = this.G = window.GAME, d = this.donnees || {}, R = this.R = reglesQuartier();
    // (Phaser réutilise la scène : on repart de zéro)
    this.fini = false; this.allerEnCours = false; this.enPassage = null; this.arrivant = null;
    this.cible = null; this.chemin = null; this.apresMarche = null; this.courir = false; this.meilleur = null;
    this.pasHeros = 0; this.pasVuHeros = 0; this.vueHeros = 'dos'; this.versGauche = false; this.vuesEnCours = {};
    this.planVille = null; this.carteC = null; this.ecritsDecor = null; this.grilleQ = null; this.lieuProche = null; this.zoneCourante = undefined;
    this.poussee = 0; this.dernierPas = -1; this.passants = []; this.bulleQ = null; this.banniereQ = null; this.dejaDit = null;
    this.pageOuverte = null; this.nuit = !!d.nuit;
    const id = this.idQuartier = DECORS_QUARTIERS[d.quartier] ? d.quartier : Object.keys(DECORS_QUARTIERS)[0];
    const Q = this.Q = QUARTIERS_VILLE[id] || { nom: id, sous: '' }, def = this.def = DECORS_QUARTIERS[id];
    this.saison = d.saison || (typeof saisonDe === 'function' && G ? saisonDe(G) : 'semailles');
    this.cameras.main.setBackgroundColor(0x1a120a);
    // (la vue se rouvre aussi vite qu'elle s'est fermée, façon Pokémon : villeQuartiers.js)
    ouvrirDuNoir(this, 450);
    // le monde : tout le quartier, dans un conteneur que la caméra déplace et agrandit (comme la place)
    const monde = this.monde = this.add.container(0, 0).setDepth(0);
    const ici = this.ici = outilsQuartier(this, monde, this.saison);
    def.construire(this, ici);
    if (this.saison === 'givre' && typeof neigeToitsQuartier === 'function') neigeToitsQuartier(this, monde);   // (la neige sur les toits : villeDecorHD.js)
    if (this.nuit) this.poserNuit();   // (chantier 3 : le soir, la promenade dans la rue)
    // (chantier 3) le décor immobile (tout ce qui est posé jusqu'ici) : son cadre dans le monde, pour ne dessiner que ce que la
    // caméra voit (une rue entière, c'est quatre fois l'écran : sans cela, chaque image redessinait tout le quartier)
    this.decorFixe = [];
    for (const o of monde.list) { if (o.yTri >= 9e5 || o.yTri <= -1e6 || !o.getBounds || o.mobile) continue; const b = this.cadreDe(o); o.cadreVu = [b.x, b.y, b.right, b.bottom]; this.decorFixe.push(o); }
    this.obstacles = ici.obstacles; this.passages = ici.passages; this.regards = ici.regards;
    for (const p of this.passages) p.zone = p.zone || [p.devant[0] - R.proche, p.devant[1] - R.proche, p.devant[0] + R.proche, p.devant[1] + R.proche];
    // JeuneGoy : là où il arrive (par un passage, ou au point de départ du quartier)
    const arr = this.pointArrivee(d.arrivee);
    textureJoueur(this, G, 'dos');
    this.heros = this.add.image(arr.x, arr.y, (textureJoueur(this, G, arr.vue || 'dos'))).setOrigin(0.5, 1).setScale(echelleJoueur(R.echelle));
    this.ombreHeros = ici.ombrePerso(arr.x, arr.y);
    monde.add(this.heros);
    this.vueHeros = arr.vue || 'dos'; this.versGauche = !!arr.gauche; this.poserHeros(0);
    if (arr.vers) this.arrivant = { pts: [arr.vers] };
    // (arrivé par une porte : elle est encore ouverte derrière lui, et se referme en deux images pendant qu'il fait son pas)
    if (arr.passage && arr.passage.type === 'porte' && arr.passage.porte) this.animerPorte(arr.passage, 'fermer');
    // les passants
    const peuples = ['humain', 'hobbit', 'nain', 'elfe', 'hobbit', 'magicienne'];
    if (ici.pointsPassants.length > 2) for (let i = 0; i < (this.nuit ? def.passantsNuit || 0 : def.passants || 4); i++) this.ajouterPassant(i, peuples[(((G && G.jour) || 0) + i * 5) % peuples.length]);
    // la fumée des cheminées : des bouffées qui montent, s'élargissent, dérivent et s'effacent
    // (Q209) la fumée dérive avec le vent du jour : couchée les jours de grand vent, poussée par la pluie, droite au calme
    const temps = G && typeof meteoDu === 'function' ? meteoDu(G) : 'soleil', souffle = temps === 'vent' ? { monte: 44, vent: 110 } : temps === 'pluie' || temps === 'orage' ? { monte: 60, vent: 60 } : { monte: 80, vent: 26 };
    if (ici.cheminees.length) this.time.addEvent({ delay: 260, loop: true, callback: () => {
      if (this.planVille || this.fini) return;
      const [x, y] = Phaser.Utils.Array.GetRandom(ici.cheminees);
      const f = bouffeeFumee(this, x + (Math.random() - 0.5) * 3, y, { echelle: 1.5, monte: souffle.monte, vent: souffle.vent + (Math.random() - 0.5) * 10, duree: 3800, alpha: 0.78, conteneur: monde, teinte: 0xe4e2e8 }); f.yTri = 2e5;
    } });
    // le temps qu'il fait, ce qui tombe du ciel selon la saison
    if (typeof ambianceMeteo === 'function') ambianceMeteo(this, { ciel: false, prof: 1 });
    if (typeof decorSaison === 'function') decorSaison(this, { fixe: true, sansSol: true, prof: 1.5, sol: 540 });
    if (typeof saisonDe === 'function' && G) { Son.nature(true, { saison: this.saison, volume: 0.6, meteo: typeof meteoDu === 'function' ? meteoDu(G) : null }); this.events.once('shutdown', () => Son.nature(false)); }
    this.creerInterface();
    this.creerCommandes();
    this.cadrer(true);
    // le nom du quartier, à l'entrée
    this.time.delayedCall(350, () => banniereQuartier(this, Q.nom, this.nuit ? 'le soir, sous les étoiles' : def.sousTitre || Q.sous));
    if (typeof prechaufferPlanVille === 'function') prechaufferPlanVille(this, 3000);   // (le plan de la ville, prêt pour la première pression sur M)
    this.events.once('shutdown', () => { if (this.planVille) this.planVille.destroy(); this.planVille = null; });
    // (chantier 3) revenu d'une page ouverte par-dessus (la banque, le barbier...) : il ressort par la porte où il était entré
    this.events.off('resume', this.revenirDePage, this); this.events.on('resume', this.revenirDePage, this);
  }

  // (chantier 3) Le soir : la nuit tombe sur tout le quartier (un voile bleu nuit, par-dessus tout, JeuneGoy compris) ; les
  // réverbères, les fenêtres et les braises réchauffent ce qui les entoure (des halos, par-dessus le voile)
  poserNuit() {
    const B = this.ici.bornes, m = this.monde;
    const v = this.add.image(B.x0 - 40, B.y0 - 400, '__WHITE').setOrigin(0).setDisplaySize(B.x1 - B.x0 + 80, B.y1 - B.y0 + 440).setTint(0x0a0a28).setAlpha(0.6); v.yTri = 9e5; m.add(v);
    creerHalo(this);
    for (const [x, y, r, teinte, coeur] of this.ici.lumieres) {
      const h = this.add.image(x, y, 'halo').setScale(r / 64).setTint(teinte).setAlpha(0.42).setBlendMode(Phaser.BlendModes.ADD); h.yTri = 9e5 + 1; m.add(h);
      this.tweens.add({ targets: h, alpha: 0.3, scale: h.scaleX * 0.94, duration: 300 + Math.random() * 300, yoyo: true, repeat: -1 });
      // (la flamme elle-même : un petit cœur de lumière, vif, là où elle brûle)
      if (coeur) { const c = this.add.image(x, y, 'halo').setScale(coeur / 64).setTint(0xfff0c0).setAlpha(0.9).setBlendMode(Phaser.BlendModes.ADD); c.yTri = 9e5 + 1.5; m.add(c); }
    }
  }
  // Ce que dit le moment, dans le titre
  momentDuJour() { return this.nuit ? 'soir' : 'matin'; }

  // Où arrive JeuneGoy : le passage d'où il vient (façon Pokémon : déjà posé devant, tourné vers le quartier, il fait un pas
  // pour s'en dégager), un point nommé, ou le départ
  pointArrivee(cle) {
    const ici = this.ici, p = this.passages.find(q => q.id === cle);
    if (p) { const [dx, dy] = p.devant, [ox, oy] = p.dehors || [dx, dy + 1], n = Math.hypot(dx - ox, dy - oy) || 1, ux = (dx - ox) / n, uy = (dy - oy) / n;
      return { x: dx, y: dy, vers: [dx + ux * PAS_ARRIVEE, dy + uy * PAS_ARRIVEE], vue: this.vueSelon(ux, uy), gauche: ux < 0, passage: p }; }
    const a = ici.arrivees[cle] || ici.arrivees.defaut || { x: (ici.bornes.x0 + ici.bornes.x1) / 2, y: (ici.bornes.y0 + ici.bornes.y1) / 2 };
    return { x: a.x, y: a.y, vers: a.vers || null, vue: a.vue || 'dos', gauche: a.gauche };
  }

  // --- L'interface : celle de la place (le bandeau du titre, le bouton du plan, l'invite, la barre du bas) ---
  creerInterface() {
    const G = this.G, D = 40;
    this.bandeQ = this.add.rectangle(480, 22, 960, 40, 0x1a120a, 0.45).setDepth(D);
    this.titreQ = this.add.text(480, 22, '', style(24, '#fff4dc', { fontStyle: 'bold', stroke: '#2a1a10', strokeThickness: 5 })).setOrigin(0, 0.5).setDepth(D + 1);
    this.majTitre(true);
    this.boutonPlan = null; this.placeBoutonPlan = null; this.placerBoutonPlan(0);
    this.invite = this.add.text(480, 462, '', style(14, '#fff4dc', { fontStyle: 'bold', backgroundColor: '#1a120add', padding: { x: 12, y: 5 } })).setOrigin(0.5).setDepth(D + 2).setVisible(false)
      .setInteractive({ useHandCursor: true }).on('pointerdown', () => { if (this.lieuProche && !this.bloque()) this.franchir(this.lieuProche); });
    this.add.rectangle(480, 510, 960, 60, 0x2a1a10).setDepth(D);
    if (G) { const b = bourse(this, 34, 532, G.argent, { echelle: 1.4, taille: 14, aDroite: true }); if (b && b.setDepth) b.setDepth(D + 1); }
    const temps = G && typeof meteoDu === 'function' && METEOS[meteoDu(G)] ? METEOS[meteoDu(G)].nom.toLowerCase() : 'beau temps';
    this.add.text(112, 498, `${this.nuit ? 'Soir' : 'Matin'} · ${temps}\n${(SAISONS[this.saison] || { nom: '' }).nom}`, style(13, '#f3e6c8', { lineSpacing: 2 })).setDepth(D + 1);
    for (const [x, l, t, f] of this.boutonsDuBas()) { const b = creerBouton(this, x, 510, l, t, f); b.fond.setDepth(D + 1); b.label.setDepth(D + 2); }
    // une bulle de parchemin, pour ce que disent les lieux (« bientôt »…)
    this.bulleQ = this.add.text(480, 78, '', style(14, '#3b2410', { fontStyle: 'italic', backgroundColor: '#ead9b0', padding: { x: 10, y: 6 }, wordWrap: { width: 640 }, align: 'center' })).setOrigin(0.5, 0).setDepth(D + 3).setVisible(false);
  }
  boutonsDuBas() { return [[640, 170, 'Rentrer chez toi', () => this.rentrer()], [840, 210, 'Ouvrir le comptoir', () => this.ouvrirComptoir()]]; }
  // Le bouton du plan : en haut à droite, comme sur la place ; si une plaque de rue ou un nom du décor tomberait dessous,
  // il passe en haut à gauche (refait plutôt que déplacé, comme ceux de la place)
  placerBoutonPlan(i) {
    const P = [[882, 108], [78, 108]];
    if (this.placeBoutonPlan === i && this.boutonPlan) return;
    if (this.boutonPlan) for (const o of [this.boutonPlan.fond, this.boutonPlan.label]) if (o && o.active) o.destroy();
    const [x, y] = P[i], b = this.boutonPlan = creerBouton(this, x, y, 140, 'Le plan (M)', () => this.basculerPlan());
    b.label.setFontSize(13); b.fond.setDepth(41); b.label.setDepth(42);
    this.placeBoutonPlan = i;
  }
  ecritsSous(x0, y0, x1, y1) {
    if (!this.ecritsDecor) {   // (une fois : les plaques, et tous les textes peints dans le décor, jusque dans les groupes)
      const l = [...this.ici.plaques], voir = c => { for (const o of c.list) { if (o.list) voir(o); else if (o.type === 'Text') l.push(o); } };
      voir(this.monde); this.ecritsDecor = l;
    }
    let n = 0;
    for (const o of this.ecritsDecor) { if (!o.active || !o.visible) continue; const b = o.getBounds(); if (b.x < x1 && b.right > x0 && b.y < y1 && b.bottom > y0) n++; }
    return n;
  }
  majBoutonPlan() {
    const droite = this.ecritsSous(806, 86, 958, 130), gauche = this.ecritsSous(2, 86, 154, 130);
    // (chantier 3) une pensée de JeuneGoy (son médaillon et sa bulle, en haut à droite, HudScene.penseesEnDirect) : le bouton
    // passe à gauche le temps qu'elle s'affiche, puis revient
    const hud = this.scene.get('Hud'), pensee = !!(hud && hud.penseeAffichee && hud.penseeAffichee.some(o => o.active && o.alpha > 0.05));
    this.placerBoutonPlan(pensee ? 1 : droite && !gauche ? 1 : !droite ? 0 : this.placeBoutonPlan);
    { const h = this.scene.get('Hud'), p = h && h.pastilleObjectifs, g = p && p.active && p.visible ? p.getBounds().right + 12 : 250; if (g !== this.gaucheTitre && !this.tweens.isTweening(this.titreQ)) this.poserTitre(this.titreQ.text); }   // (la pastille des objectifs a changé)
    // (une plaque de rue passe sous le bandeau du titre : il se fonce, pour que deux noms ne se lisent jamais l'un sur l'autre)
    const a = this.ecritsSous(0, 0, 960, 44) ? 1 : 0.45;
    if (this.bandeQ && this.bandeQ.cible !== a) { this.bandeQ.cible = a; this.tweens.killTweensOf(this.bandeQ); this.tweens.add({ targets: this.bandeQ, fillAlpha: a, duration: 250 }); }
  }
  dire(texte) {
    if (!this.bulleQ) return;
    this.bulleQ.setText(texte).setVisible(true).setAlpha(0);
    // (elle se pose là où elle ne couvre aucun nom du décor : sous le bandeau, sinon un peu plus bas)
    const w = this.bulleQ.width, h = this.bulleQ.height, y = [78, 130, 190, 250].find(y => !this.ecritsSous(480 - w / 2, y, 480 + w / 2, y + h)) || 78;
    this.bulleQ.setY(y);
    this.tweens.killTweensOf(this.bulleQ);
    this.tweens.add({ targets: this.bulleQ, alpha: 1, duration: 180 });
    this.tweens.add({ targets: this.bulleQ, alpha: 0, delay: Math.max(3200, texte.length * 55), duration: 600 });
  }
  // Le titre : le nom de la rue, de la placette ou du carrefour où l'on est (sinon celui du quartier)
  majTitre(tout = false) {
    const h = this.heros, zones = this.ici.zones;
    const z = h ? zones.find(z => z.dedans(h.x, h.y)) || null : null;
    if (!tout && z === this.zoneCourante) return;
    this.zoneCourante = z;
    const texte = `${z ? z.nom : this.Q.nom} · ${this.momentDuJour()} du jour ${this.G ? this.G.jour : 1}`;
    if (tout) { this.poserTitre(texte); return; }
    this.tweens.killTweensOf(this.titreQ);
    this.tweens.add({ targets: this.titreQ, alpha: 0, duration: 180, onComplete: () => { this.poserTitre(texte); this.tweens.add({ targets: this.titreQ, alpha: 1, duration: 260 }); } });
  }
  // Le titre, centré, mais jamais sous la pastille des objectifs du haut de l'écran (ni hors de l'écran)
  poserTitre(texte) {
    const t = this.titreQ.setText(texte), h = this.scene.get('Hud'), p = h && h.pastilleObjectifs;
    const gauche = this.gaucheTitre = p && p.active && p.visible ? p.getBounds().right + 12 : 250;
    let f = 24; t.setFontSize(f);
    while (t.width > 950 - gauche && f > 16) t.setFontSize(--f);
    t.setX(Math.max(gauche, 480 - t.width / 2));
  }

  creerCommandes() {
    const k = this.input.keyboard;
    if (k) {
      this.touches = k.createCursorKeys();
      this.zqsd = k.addKeys('Z,Q,S,D,W,A', false);
      k.on('keydown', e => {
        if (!this.sys.isActive() || e.repeat || this.fini) return;
        if (e.key === 'm' || e.key === 'M') this.basculerPlan();
        else if (e.key === 'Escape') { if (this.planVille) fermerPlanVille(this); }
        else if ((e.key === 'e' || e.key === 'E' || e.key === ' ' || e.key === 'Enter') && this.lieuProche && !this.bloque()) this.franchir(this.lieuProche);
      });
    }
    const dansMonde = o => { for (let c = o; c; c = c.parentContainer) if (c === this.monde) return true; return false; };
    this.input.on('pointerdown', (p, sous) => {
      if (!this.monde || p.worldY < 40 || p.worldY > 476 || this.bloque()) return;
      if (sous.some(o => !dansMonde(o))) return;
      const x = (p.worldX - this.monde.x) / this.monde.scaleX, y = (p.worldY - this.monde.y) / this.monde.scaleY;
      if (sous.length && sous.some(o => o.passant)) return;
      // un clic sur un passage : on y va, et on le franchit en arrivant
      // (chantier 3 : une porte se clique aussi sur la façade, dans son cadre)
      const dans = (r) => r && x > r[0] && x < r[2] && y > r[1] && y < r[3];
      const pas = this.passages.find(q => dans(q.zone) && q.clic !== false) || this.passages.find(q => dans(q.cadre) && q.clic !== false);
      if (pas) { this.partirVers(pas.devant[0], pas.devant[1], pas); this.marqueClic(pas.devant[0], pas.devant[1]); return; }
      // (chantier 3) un clic sur une chose à regarder (une façade, un banc...) : il va devant, et la bulle parle
      const r = this.regardSous(x, y);
      if (r) { this.partirVers(r.devant[0], r.devant[1], r); this.marqueClic(r.devant[0], r.devant[1]); return; }
      this.partirVers(x, y); this.marqueClic(x, y);
    });
    this.input.on('pointermove', p => {
      if (!this.monde || !p.isDown || (!p.wasTouch && !(p.event && p.event.buttons & 1)) || p.worldY < 40 || p.worldY > 476 || this.bloque() || this.apresMarche) return;
      if (this.time.now - (this.dernierGlisse || 0) < 120) return;
      this.dernierGlisse = this.time.now;
      this.partirVers((p.worldX - this.monde.x) / this.monde.scaleX, (p.worldY - this.monde.y) / this.monde.scaleY);
    });
  }

  // La chose à regarder sous un point du monde (la plus petite, si plusieurs cadres se chevauchent)
  regardSous(x, y) {
    let best = null, aire = 1e12;
    for (const r of this.regards || []) { if (r.inactif) continue; const [a, b, c, d] = r.cadre; if (x > a && x < c && y > b && y < d && (c - a) * (d - b) < aire) { best = r; aire = (c - a) * (d - b); } }
    return best;
  }
  // Regarder : la bulle dit le texte (une fonction peut aussi agir : s'asseoir sur le banc, nourrir le chat...)
  regarder(r) {
    this.cible = null; this.chemin = null; this.apresMarche = null; this.arreterPas();
    const t = typeof r.texte === 'function' ? r.texte(this) : r.texte;
    if (t) this.dire(t);
  }
  // Rien ne bouge pendant un passage, une arrivée, ou le plan ouvert
  bloque() { return !!(this.fini || this.enPassage || this.arrivant || this.planVille || (typeof conseilOuvert === 'function' && conseilOuvert())); }
  basculerPlan() {
    if (this.planVille) return fermerPlanVille(this);
    if (this.bloque()) return;
    this.cible = null; this.chemin = null;
    ouvrirPlanVille(this);
  }
  rentrer() { if (this.bloque()) return; allerDansLaVille(this, { scene: 'Nuit', donnees: { matin: true }, genre: 'porte' }); }
  ouvrirComptoir() { if (this.bloque() || this.allerEnCours) return; this.fini = true; Sauvegarde.maintenant(this.G, 'Marche'); commencerJournee(this); }

  marqueClic(x, y) {
    const r = this.add.ellipse(x, y, 34, 14).setStrokeStyle(2, 0xffe6a0, 0.9); r.yTri = y - 1; this.monde.add(r);
    this.tweens.add({ targets: r, scaleX: 0.4, scaleY: 0.4, alpha: 0, duration: 450, onComplete: () => r.destroy() });
  }

  // --- La marche (la même que sur la place) ---
  vueSelon(dx, dy) { return Math.abs(dy) > Math.abs(dx) * 0.8 ? (dy < 0 ? 'dos' : 'face') : 'profil'; }
  bloqueEn(x, y) {
    const B = this.ici.bornes;
    if (x < B.x0 + 12 || x > B.x1 - 12 || y < B.y0 + 12 || y > B.y1 - 4) return true;
    if (!this.ici.marchable(x, y)) return true;
    for (const o of this.obstacles) {
      if (o.length === 4) { if (x > o[0] && x < o[2] && y > o[1] && y < o[3]) return true; }
      else if (o.ellipse) { const [cx, cy, rx, ry] = o.ellipse; if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 1) return true; }
    }
    return false;
  }
  libreEntre(x0, y0, x1, y1) {
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 3);
    for (let k = 1; k <= n; k++) if (this.bloqueEn(x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n)) return false;
    return true;
  }
  // Un itinéraire : une recherche sur une grille de 20 px, puis lissé (on file au point visible le plus loin) ; une cible
  // inaccessible : la case libre la plus proche
  itineraire(dx, dy, ax, ay) {
    const B = this.ici.bornes, C = this.R.grille, W = Math.ceil((B.x1 - B.x0) / C), Hc = Math.ceil((B.y1 - B.y0) / C);
    if (this.libreEntre(dx, dy, ax, ay) && !this.bloqueEn(ax, ay)) return [[ax, ay]];
    if (!this.grilleQ) {
      const g = this.grilleQ = new Uint8Array(W * Hc);
      for (let j = 0; j < Hc; j++) for (let i = 0; i < W; i++) {
        const x = B.x0 + i * C + C / 2, y = B.y0 + j * C + C / 2;
        g[j * W + i] = this.bloqueEn(x, y) || [[-7, 0], [7, 0], [0, -6], [0, 6]].some(([a, b]) => this.bloqueEn(x + a, y + b)) ? 1 : 0;
      }
    }
    const g = this.grilleQ, cel = (x, y) => [Phaser.Math.Clamp(Math.floor((x - B.x0) / C), 0, W - 1), Phaser.Math.Clamp(Math.floor((y - B.y0) / C), 0, Hc - 1)];
    const [si, sj] = cel(dx, dy); let [gi, gj] = cel(ax, ay);
    if (g[gj * W + gi] || this.bloqueEn(ax, ay)) {
      let best = null, bd = 1e9;
      for (let j = 0; j < Hc; j++) for (let i = 0; i < W; i++) if (!g[j * W + i]) { const d = (i - gi) ** 2 + (j - gj) ** 2; if (d < bd) { bd = d; best = [i, j]; } }
      if (!best) return [[dx, dy]];
      [gi, gj] = best; ax = B.x0 + gi * C + C / 2; ay = B.y0 + gj * C + C / 2;
    }
    const prec = new Int32Array(W * Hc).fill(-1), vu = new Uint8Array(W * Hc), file = [sj * W + si];
    vu[sj * W + si] = 1;
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    let trouve = si === gi && sj === gj;
    for (let q = 0; q < file.length && !trouve; q++) {
      const c = file[q], ci = c % W, cj = (c - ci) / W;
      for (const [di, dj] of dirs) {
        const ni = ci + di, nj = cj + dj; if (ni < 0 || nj < 0 || ni >= W || nj >= Hc) continue;
        const n = nj * W + ni; if (vu[n] || g[n]) continue;
        if (di && dj && (g[cj * W + ni] || g[nj * W + ci])) continue;
        vu[n] = 1; prec[n] = c; file.push(n);
        if (ni === gi && nj === gj) { trouve = true; break; }
      }
    }
    if (!trouve) return [[ax, ay]];
    const cases = [];
    for (let c = gj * W + gi; c !== -1 && c !== sj * W + si; c = prec[c]) cases.unshift([B.x0 + (c % W) * C + C / 2, B.y0 + Math.floor(c / W) * C + C / 2]);
    if (!cases.length) return [[ax, ay]];
    cases[cases.length - 1] = [ax, ay];
    const pts = []; let [cx, cy] = [dx, dy], k = 0;
    while (k < cases.length) {
      let loin = k;
      for (let m = cases.length - 1; m > k; m--) if (this.libreEntre(cx, cy, cases[m][0], cases[m][1])) { loin = m; break; }
      pts.push(cases[loin]); [cx, cy] = cases[loin]; k = loin + 1;
    }
    return pts;
  }
  partirVers(x, y, passage = null, courir = false) {
    const pts = this.itineraire(this.heros.x, this.heros.y, x, y);
    this.cible = pts.shift(); this.chemin = pts; this.apresMarche = passage; this.courir = courir || Math.hypot(this.heros.x - x, this.heros.y - y) > 700;
    this.meilleur = { d: 1e9, t: this.time.now };
  }

  poserHeros(pas) {
    // la vraie vue de face ('deFace') quand il descend vers nous ; les huit images de la marche dès qu'elles sont prêtes
    const vue = this.vueHeros === 'face' ? 'deFace' : this.vueHeros;
    const base = textureJoueur(this, this.G, vue), st = stadeJoueur(this.G);
    for (const [i, v] of ['deFace', 'profil'].entries()) if (!this.textures.exists(`joueur_${st}_${v}`) && !this.vuesEnCours[v]) {
      this.vuesEnCours[v] = true;
      setTimeout(() => { if (this.vuesEnCours) this.vuesEnCours[v] = false; if (this.sys.isActive() && !this.textures.exists(`joueur_${st}_${v}`)) textureJoueur(this, this.G, v); }, 600 + i * 500);
    }
    const enMarche = this.pasHeros > 0 && this.pasVuHeros !== this.pasHeros;
    this.pasVuHeros = this.pasHeros;
    let k = pas ? base + '_pas' + pas : base;
    if (enMarche && marcheJoueurPrete(this, base)) k = base + '_m' + (Math.floor(this.pasHeros / (this.courir ? 45 : MARCHE_HD.duree)) % MARCHE_HD.images);
    this.heros.setTexture((this.textures.exists(k) ? k : base)).setFlipX(this.vueHeros === 'profil' && this.versGauche);
  }
  // Un pas de plus (dx, dy déjà mesurés) : la vue, les images, le bruit du pas selon le sol, le corps qui se soulève sur les marches
  animerPas(dx, dy, dt) {
    const h = this.heros, vue = this.vueSelon(dx, dy);
    if (dx) this.versGauche = dx < 0;
    this.vueHeros = vue;
    this.pasHeros += dt;
    const f = Math.floor(this.pasHeros / (this.courir ? 90 : 125)) % 4;
    this.poserHeros(f === 1 ? 1 : f === 3 ? 2 : 0);
    const sol = this.ici.solCle ? solSous(this, this.ici.solCle, h.x, h.y, ...this.ici.solO) : 'paves';
    // (le pas, dans la banque de pas du jeu, au même volume que sur la place ; l'hiver, on marche dans la neige, comme sur la place)
    if ((f === 1 || f === 3) && f !== this.dernierPas && typeof jouerPas === 'function') jouerPas(this.saison === 'givre' ? 'neige' : sol, 0.5);
    this.dernierPas = f;
    // sur les marches, chaque pas soulève le corps (le pied monte sur la marche suivante, ou descend)
    const marches = this.ici.solCle && solCode(this, this.ici.solCle, h.x, h.y, ...this.ici.solO) === SOL_VILLE.MARCHES;
    const lev = marches ? Math.abs(Math.sin(this.pasHeros / (this.courir ? 90 : 125) * Math.PI / 2)) * 3 : 0;
    h.setOrigin(0.5, 1 + lev / Math.max(1, h.displayHeight));
  }
  arreterPas() { if (this.pasHeros) { this.pasHeros = 0; this.dernierPas = -1; this.heros.setOrigin(0.5, 1); this.poserHeros(0); } }

  // --- La caméra : celle de la place (×1,25, elle suit JeuneGoy et glisse doucement), arrêtée aux bornes du quartier ---
  // (retours du joueur) sa hauteur suit celle de JeuneGoy dans la rue : contre les façades, au nord, elle monte pour montrer
  // le haut des maisons (lui plus bas à l'écran) ; vers le sud (la placette, le palier), elle descend, plus près du sol. Le
  // décor donne cette hauteur (def.cameraY : où se tient JeuneGoy à l'écran, selon son y), sans à-coup : elle glisse.
  cadrer(instantane = false) {
    const R = this.R, B = this.ici.bornes, m = this.monde, z = this.def.zoom || R.zoom, sy = this.def.cameraY ? this.def.cameraY(this.heros.y) : this.def.sy || 270;
    const fx = this.heros.x, fy = this.heros.y - 40;
    const y0 = this.def.hautCamera ? Math.max(B.y0, this.def.hautCamera(fx)) : B.y0;   // (étape 12b : un quartier peut monter la caméra plus haut à certains endroits)
    const x = Phaser.Math.Clamp(480 - fx * z, 960 - B.x1 * z, -B.x0 * z), y = Phaser.Math.Clamp(sy - fy * z, 478 - B.y1 * z, -y0 * z);
    if (instantane) { m.setScale(z).setPosition(x, y); return; }
    const k = R.douceur;
    m.setScale(m.scaleX + (z - m.scaleX) * k);
    m.setPosition(m.x + (x - m.x) * k, m.y + (y - m.y) * k);
  }

  // --- Les passages, façon Pokémon (villeQuartiers.js : fermerEnNoir) ---
  // Franchir un passage, selon son genre :
  //   - une porte : JeuneGoy va jusque sur le seuil et s'y arrête net, tourné vers elle ; la porte s'ouvre en trois images,
  //     puis il entre (il s'assombrit dans l'embrasure) pendant que l'écran tombe au noir, vite (250 ms) ;
  //   - le bord d'une rue, une arche, un porche, un pont : il continue de marcher vers le dehors, et l'écran tombe au noir
  //     (250 ms) juste avant qu'il n'y arrive ;
  //   - un escalier : il s'engage dans l'escalier (ses premiers pas sur les marches), puis le noir, un peu plus long.
  // La scène suivante s'ouvre aussitôt (son décor préparé pendant qu'il marchait : prechaufferArrivee).
  franchir(p) {
    if (this.enPassage || this.fini || this.arrivant) return;
    if (p.regard) return this.regarder(p);
    // (une porte close ce jour-là : elle le dit)
    if (p.ferme) { const t = typeof p.ferme === 'function' ? p.ferme(this) : p.ferme; if (t) { if (this.dejaDit !== p.id || !this.bulleQ.visible || this.bulleQ.alpha < 0.2) { this.dire(t); Son.jouer('refus'); } this.dejaDit = p.id; this.cible = null; this.chemin = null; this.apresMarche = null; return; } }
    if (p.bientot) {
      if (this.dejaDit !== p.id || !this.bulleQ.visible || this.bulleQ.alpha < 0.2) { this.dire(p.bientot); Son.jouer('refus'); }
      this.dejaDit = p.id; this.cible = null; this.chemin = null; this.apresMarche = null;
      return;
    }
    const h = this.heros, genre = genreTransition(p.type), loin = Math.hypot(h.x - p.devant[0], h.y - p.devant[1]) > 6;
    prechaufferArrivee(this, p.vers);
    // (une porte : il s'arrête d'abord sur le seuil ; ailleurs, il file d'une traite si rien ne gêne)
    if (loin && (genre === 'porte' || !this.libreEntre(h.x, h.y, p.devant[0], p.devant[1]))) { this.partirVers(p.devant[0], p.devant[1], p); return; }
    const pts = loin ? [p.devant] : [];
    if (genre !== 'porte') pts.push(p.dehors || p.devant);
    this.cible = null; this.chemin = null; this.apresMarche = null; this.courir = false;
    this.enPassage = { p, genre, pts, fondu: false, t: 0, surMarches: 0 };
    if (genre === 'porte') {   // arrêté net sur le seuil, tourné vers la porte, qui s'ouvre
      const [ox, oy] = p.dehors || p.devant; this.arreterPas();
      this.vueHeros = this.vueSelon(ox - h.x, oy - h.y); if (ox !== h.x) this.versGauche = ox < h.x; this.poserHeros(0);
      if (p.porte) this.animerPorte(p, 'ouvrir');
    }
    if (this.invite) this.invite.setVisible(false);
  }
  majPassage(dt) {
    const E = this.enPassage, h = this.heros, v = this.R.vitesse * dt, p = E.p;
    E.t += dt;
    // (la porte s'ouvre en trois images, 210 ms ; puis il entre dans l'embrasure)
    if (E.genre === 'porte' && !E.entre && E.t >= (p.porte ? 210 : 60)) { E.entre = true; E.pts.push(p.dehors || p.devant); }
    const c = E.pts[0];
    if (c) {
      const rx = c[0] - h.x, ry = c[1] - h.y, d = Math.hypot(rx, ry);
      const mx = d <= v ? rx : rx / d * v, my = d <= v ? ry : ry / d * v;
      h.setPosition(h.x + mx, h.y + my); this.animerPas(mx, my, dt);
      if (d <= v) E.pts.shift();
      if (E.pts.length <= 1) E.surMarches += dt;   // (passé le devant du passage : sur les marches, sous le porche…)
      // dans l'embrasure d'une porte ou l'ombre d'un porche, il s'assombrit à mesure qu'il y entre
      if ((p.type === 'porte' || p.type === 'porche') && E.pts.length <= 1) { const [ox, oy] = p.dehors || p.devant, rest = Math.hypot(ox - h.x, oy - h.y), tot = Math.max(1, Math.hypot(ox - p.devant[0], oy - p.devant[1])), u = Phaser.Math.Clamp(1 - rest / tot, 0, 1), g = Math.round(255 - u * 170); h.setTint((g << 16) | (g << 8) | g); }
    } else if (E.genre !== 'porte' || E.entre) this.arreterPas();
    // quand l'écran tombe au noir : une porte, dès qu'il y entre ; un bord, dès qu'il a passé le devant du passage (il
    // continue vers le dehors, encore visible) ; un escalier, après ses premiers pas sur les marches (au plus tard 1,6 s
    // après le départ)
    const reste = E.pts.length ? E.pts.reduce((s, q, i) => s + Math.hypot(q[0] - (i ? E.pts[i - 1][0] : h.x), q[1] - (i ? E.pts[i - 1][1] : h.y)), 0) : 0;
    const T = TRANSITIONS_VILLE[E.genre];
    const top = E.genre === 'porte' ? E.entre : E.genre === 'escalier' ? E.surMarches > 140 || reste < this.R.vitesse * T.noir : E.pts.length <= 1 || reste < this.R.vitesse * T.noir || Math.hypot(h.x - p.devant[0], h.y - p.devant[1]) < 45;   // (encore bien visible)
    if (!E.fondu && (top || E.t > 1600)) {
      E.fondu = true;
      if (p.page || p.action) return this.ouvrirPage(p);   // (chantier 3 : une page par-dessus la rue, ou ce que fait le passage)
      allerDansLaVille(this, { ...p.vers, depuis: this.idQuartier, genre: p.type });
    }
  }
  // (chantier 3) Entrer quelque part qui s'ouvre par-dessus la rue (la banque, le barbier, la tente d'Ysmée...) : la vue se
  // ferme au noir comme pour un passage (le son de porte, façon Pokémon ; la banque et les Mages gardent leur lourde porte,
  // jouée en ouvrant la page), puis la page s'ouvre ; la rue attend dessous, en pause. p.action(scene) : ce que fait le
  // passage à la place (rentrer de la promenade, la porte dérobée...).
  ouvrirPage(p) {
    const lourde = ['Banque', 'Mages', 'Forge'].includes(p.page), suite = () => {
      if (!this.sys.isActive()) return;
      this.enPassage = null; this.pageOuverte = p;
      if (p.action) return p.action(this);
      this.scene.pause(); this.scene.launch(p.page, { retour: this.scene.key, ...(p.donnees || {}) });
    };
    if (lourde) { for (const cam of this.cameras.cameras) cam.fadeOut(250, 0, 0, 0); this.cameras.main.once('camerafadeoutcomplete', suite); }
    else fermerEnNoir(this, p.type, suite);
  }
  // Revenu de la page : il ressort par la même porte (déjà sur le seuil, tourné vers la rue, la porte se referme derrière lui,
  // il fait un pas), la vue se rouvre
  revenirDePage() {
    const p = this.pageOuverte; this.pageOuverte = null;
    if (!p || !this.heros || !this.heros.active) return;
    const [dx, dy] = p.devant, [ox, oy] = p.dehors || [dx, dy - 1], n = Math.hypot(dx - ox, dy - oy) || 1, ux = (dx - ox) / n, uy = (dy - oy) / n;
    this.heros.clearTint().setPosition(dx, dy); this.vueHeros = this.vueSelon(ux, uy); this.versGauche = ux < 0; this.arreterPas(); this.poserHeros(0);
    this.cible = null; this.chemin = null; this.apresMarche = null; this.enPassage = null;
    this.arrivant = { pts: [[dx + ux * PAS_ARRIVEE * 0.6, dy + uy * PAS_ARRIVEE * 0.6]] };
    if (p.type === 'porte' && p.porte) this.animerPorte(p, 'fermer');
    if (p.surRetour) p.surRetour(this);
    this.cadrer(true);
    for (const cam of this.cameras.cameras) { cam.resetFX(); cam.fadeIn(TRANSITIONS_VILLE.porte.ouverture, 0, 0, 0); }
  }
  // La porte d'un passage qui s'ouvre (trois images : entrouverte, à moitié, grande ouverte) ou se referme (deux images),
  // dessinée par-dessus le battant peint (p.porte : son rectangle dans le monde, gonds à gauche). Le battant tourne vers
  // l'intérieur : on le voit de plus en plus de chant, et l'ombre de la maison s'ouvre derrière lui.
  animerPorte(p, sens) {
    const P = p.porte, { x, y, l, h } = P, c = this.add.container(x, y); c.yTri = P.yTri !== undefined ? P.yTri : y + h + 0.5; this.monde.add(c);
    const g = this.add.graphics(); c.add(g);
    // le battant : le vrai battant peint de la façade (P.src : son rectangle dans la texture), découpé une fois
    let battant = null;
    if (P.src && this.textures.exists(P.src.cle)) {
      const S = P.src, k = `battant_${S.cle}_${Math.round(S.x)}_${Math.round(S.y)}`;
      if (!this.textures.exists(k)) { const src = this.textures.get(S.cle).getSourceImage(), t = this.textures.createCanvas(k, Math.round(S.l), Math.round(S.h)); t.getContext().drawImage(src, Math.round(S.x), Math.round(S.y), Math.round(S.l), Math.round(S.h), 0, 0, Math.round(S.l), Math.round(S.h)); t.refresh(); }
      battant = this.add.image(0, 0, k).setOrigin(0, 0).setVisible(false); c.add(battant);
    }
    const image = ouv => {   // ouv : de 0 (fermée) à 1 (grande ouverte)
      g.clear(); if (battant) battant.setVisible(ouv > 0); if (ouv <= 0) return;
      const lb = Math.max(2, Math.round(l * Math.cos(ouv * Math.PI / 2 * 0.94)));
      g.fillStyle(0x120804).fillRect(0, 0, l, h);                                  // le noir de la maison
      g.fillStyle(0x3a2410, 0.7).fillRect(lb, h * 0.55, l - lb, h * 0.45);         // un peu de lumière chaude, au sol, au fond
      g.fillStyle(0x24140a).fillRect(lb, 0, 3, h);                                 // la tranche du battant, et son ombre
      if (battant) { const v = Math.round(255 - ouv * 95); battant.setDisplaySize(lb, h).setTint((v << 16) | (v << 8) | v); }   // (de plus en plus de chant, et dans l'ombre)
      else g.fillStyle(Phaser.Display.Color.GetColor(Math.round(110 - ouv * 46), Math.round(70 - ouv * 30), Math.round(40 - ouv * 18))).fillRect(0, 0, lb, h);
    };
    const etapes = sens === 'ouvrir' ? [0.34, 0.66, 1] : [1, 0.5, 0];
    etapes.forEach((u, i) => this.time.delayedCall(i * 70, () => { if (c.active) image(u); }));
    if (sens === 'fermer') this.time.delayedCall(2 * 70 + 10, () => c.destroy());
    return c;
  }

  // --- Chaque image ---
  update(temps, dt) {
    if (!this.monde || !this.heros || !this.heros.active || this.fini) return;
    dt = Math.min(dt, 50);
    const R = this.R, h = this.heros;
    if (this.enPassage) { this.majPassage(dt); this.apresImage(temps, dt); return; }
    if (this.arrivant) {   // il entre en marchant, par le passage d'où il vient
      const c = this.arrivant.pts[0], rx = c[0] - h.x, ry = c[1] - h.y, d = Math.hypot(rx, ry), v = R.vitesse * dt;
      if (d <= v) { h.setPosition(c[0], c[1]); this.arrivant.pts.shift(); if (!this.arrivant.pts.length) { this.arrivant = null; this.arreterPas(); } }
      else { const mx = rx / d * v, my = ry / d * v; h.setPosition(h.x + mx, h.y + my); this.animerPas(mx, my, dt); }
      this.apresImage(temps, dt); return;
    }
    let dx = 0, dy = 0, clavier = false;
    if (!this.bloque()) {
      const t = this.touches, z = this.zqsd, bas = k => !!(k && k.isDown);
      const gauche = bas(t && t.left) || bas(z && z.Q) || bas(z && z.A), droite = bas(t && t.right) || bas(z && z.D);
      const haut = bas(t && t.up) || bas(z && z.Z) || bas(z && z.W), basT = bas(t && t.down) || bas(z && z.S);
      if (gauche || droite || haut || basT) {
        clavier = true; this.cible = null; this.chemin = null; this.apresMarche = null; this.courir = false;
        dx = (droite ? 1 : 0) - (gauche ? 1 : 0); dy = (basT ? 1 : 0) - (haut ? 1 : 0);
        const n = Math.hypot(dx, dy) || 1; dx *= R.vitesse * dt / n; dy *= R.vitesse * dt / n;
      } else if (this.cible) {
        const rx = this.cible[0] - h.x, ry = this.cible[1] - h.y, d = Math.hypot(rx, ry), v = (this.courir ? R.course : R.vitesse) * dt;
        if (d <= v + 0.5) { dx = rx; dy = ry; } else { dx = rx / d * v; dy = ry / d * v; }
      }
    }
    let bouge = false;
    if (dx || dy) {
      const nx = h.x + dx, ny = h.y + dy;
      if (!this.bloqueEn(nx, ny)) { h.setPosition(nx, ny); bouge = true; }
      else if (dx && !this.bloqueEn(nx, h.y)) { h.x = nx; bouge = true; }
      else if (dy && !this.bloqueEn(h.x, ny)) { h.y = ny; bouge = true; }
      // (aux flèches, contre un passage : on continue de pousser vers lui, et on le franchit)
      const p = clavier && this.lieuProche;
      if (p && p.pousser && (dx * p.pousser[0] + dy * p.pousser[1]) > 0 && (!bouge || this.dansZone(p, h.x, h.y, 0.5))) { this.poussee += dt; if (this.poussee > 280) { this.poussee = 0; this.franchir(p); } }
      else this.poussee = 0;
      if (bouge) this.animerPas(dx, dy, dt);
      else if (this.cible) { this.cible = null; this.chemin = null; this.apresMarche = null; this.arreterPas(); }
      else this.arreterPas();
      // il n'avance plus vers son but depuis une demi-seconde : il s'arrête (jamais de marche sur place)
      if (this.cible) {
        const d = Math.hypot(this.cible[0] - h.x, this.cible[1] - h.y);
        if (!this.meilleur || d < this.meilleur.d - 1.5) this.meilleur = { d, t: this.time.now };
        else if (this.time.now - this.meilleur.t > 500) { this.cible = null; this.chemin = null; this.apresMarche = null; this.courir = false; this.arreterPas(); }
      }
      if (this.cible && Math.hypot(this.cible[0] - h.x, this.cible[1] - h.y) < 1) {
        if (this.chemin && this.chemin.length) { this.cible = this.chemin.shift(); this.meilleur = { d: 1e9, t: this.time.now }; }
        else { const p2 = this.apresMarche; this.cible = null; this.apresMarche = null; this.courir = false; this.arreterPas(); if (p2) this.franchir(p2); }
      }
    } else {
      this.arreterPas(); this.poussee = 0;
      if (this.cible && Math.hypot(this.cible[0] - h.x, this.cible[1] - h.y) < 1 && !this.bloque()) {
        if (this.chemin && this.chemin.length) { this.cible = this.chemin.shift(); this.meilleur = { d: 1e9, t: this.time.now }; }
        else { const p2 = this.apresMarche; this.cible = null; this.apresMarche = null; this.courir = false; if (p2) this.franchir(p2); }
      }
    }
    this.apresImage(temps, dt);
  }
  dansZone(p, x, y, marge = 0) { const [a, b, c, d] = p.zone; return x > a - marge && x < c + marge && y > b - marge && y < d + marge; }

  // Ce qui se fait à chaque image, qu'il marche ou non : l'ombre, les passants, le passage le plus proche et son invite,
  // le titre, la caméra, l'ordre de profondeur
  apresImage(temps, dt) {
    const h = this.heros;
    this.ombreHeros.setPosition(h.x, h.y - 1); this.ombreHeros.yTri = h.y - 0.5;
    this.majPassants(dt);
    let proche = null, dmin = 1e9;
    if (!this.enPassage && !this.arrivant) for (const p of this.passages) { if (!this.dansZone(p, h.x, h.y)) continue; const d = Math.hypot(h.x - p.devant[0], h.y - p.devant[1]); if (d < dmin) { dmin = d; proche = p; } }
    if (proche !== this.lieuProche && !proche) this.dejaDit = null;
    this.lieuProche = proche;
    const montrer = proche && !this.bloque();
    this.invite.setVisible(!!montrer);
    if (montrer) this.invite.setText(`${proche.nom}${proche.sous ? ' · ' + proche.sous : ''}   —   ${proche.bientot ? 'bientôt' : 'E ou clic : ' + (proche.verbe || 'y aller')}`);
    if (temps - (this.derniereZone || 0) > 200) { this.derniereZone = temps; this.majTitre(); this.majBoutonPlan(); }
    if (!this.planVille) this.cadrer();
    this.cacherHorsVue();
    for (const o of this.monde.list) o.yTriQ = o.yTri !== undefined ? o.yTri : o.y;
    this.monde.sort('yTriQ');
  }

  // Le cadre d'un objet du monde (pour un groupe : tout ce qu'il contient, sauf les dessins à main levée, sans cadre fiable)
  cadreDe(o) {
    if (o.type !== 'Container') return o.getBounds();
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    const voir = c => { for (const k of c.list) { if (k.type === 'Container') voir(k); else if (k.getBounds && k.type !== 'Graphics') { const r = k.getBounds(); x0 = Math.min(x0, r.x); y0 = Math.min(y0, r.y); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom); } } };
    voir(o);
    return x1 > x0 ? { x: x0, y: y0, right: x1, bottom: y1 } : { x: o.x - 100, y: o.y - 200, right: o.x + 100, bottom: o.y + 20 };
  }
  // Le décor immobile hors de la vue n'est pas dessiné (une marge de 80 : l'ombre d'un toit, une fumée qui en part)
  cacherHorsVue() {
    const m = this.monde, k = m.scaleX, x0 = -m.x / k - 80, y0 = -m.y / k - 80, x1 = x0 + 960 / k + 160, y1 = y0 + 540 / k + 160;
    for (const o of this.decorFixe || []) { if (!o.active) continue; const c = o.cadreVu, v = c[2] > x0 && c[0] < x1 && c[3] > y0 && c[1] < y1; if (o.visible !== v && !o.cacheExprès) o.setVisible(v); }
  }
  // --- Les passants : ils vont d'un point à l'autre de la rue, à pied, par les mêmes chemins ; on peut leur parler ---
  ajouterPassant(i, race) {
    const pts = this.ici.pointsPassants, [x, y] = pts[(i * 3 + ((this.G && this.G.jour) || 0)) % pts.length];
    const quoi = { nom: 'Flâneur du quartier ' + i, race, feminin: i % 2 === 1, niveau: 'novice' };
    const cle = corpsHD(this, quoi, null, 'face');
    const img = this.add.image(x, y, (cle)).setOrigin(0.5, 1).setScale(this.R.echelle * echelleCorps(cle)).setInteractive({ useHandCursor: true });
    img.passant = true;
    // (Q165) même arrêté, il respire
    this.tweens.add({ targets: img, scaleY: img.scaleY * 1.012, duration: 1400 + i * 170, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const o = { img, quoi, vue: 'face', cible: null, chemin: [], pause: 800 + i * 1300, pas: 0, ombre: this.ici.ombrePerso(x, y) };
    img.on('pointerdown', () => this.passantParle(o));
    this.monde.add(img); this.passants.push(o);
  }
  passantParle(o) {
    if ((o.bulle && o.bulle.active) || this.bloque()) return;
    o.pause = 4200; o.cible = null; o.chemin = [];
    if (o.vue !== 'face') { o.vue = 'face'; o.img.setTexture((corpsHD(this, o.quoi, null, 'face'))).setFlipX(false); }
    const texte = typeof phrasePassant === 'function' ? phrasePassant(this.G) : 'Belle journée, hein ?';
    Son.jouer('voix', { personne: { nom: o.quoi.nom, race: o.quoi.race, feminin: o.quoi.feminin }, ton: Phaser.Utils.Array.GetRandom(['content', 'rire', 'etonne', 'neutre']) });
    const b = o.bulle = this.add.text(o.img.x, o.img.y - o.img.displayHeight - 8, texte, style(12, '#3b2410', { fontStyle: 'italic', backgroundColor: '#f3e6c8', padding: { x: 8, y: 5 }, wordWrap: { width: 240 }, align: 'center' })).setOrigin(0.5, 1).setScale(0);
    b.yTri = 1e6 + 2; this.monde.add(b);
    this.tweens.add({ targets: b, scale: 1 / this.monde.scaleX, duration: 180, ease: 'Back.easeOut' });
    this.time.delayedCall(Math.max(2600, texte.length * 55), () => b.active && this.tweens.add({ targets: b, alpha: 0, duration: 300, onComplete: () => b.destroy() }));
  }
  majPassants(dt) {
    for (const o of this.passants) {
      if (o.bulle && o.bulle.active) o.bulle.setPosition(o.img.x, o.img.y - o.img.displayHeight - 8);
      if (o.pause > 0) {
        o.pause -= dt;
        if (o.pause <= 0) { const pts = this.ici.pointsPassants, [x, y] = Phaser.Utils.Array.GetRandom(pts), ch = this.itineraire(o.img.x, o.img.y, x + Phaser.Math.Between(-30, 30), y + Phaser.Math.Between(-6, 6)); o.cible = ch.shift(); o.chemin = ch; o.meilleur = { d: 1e9, t: this.time.now }; }
        continue;
      }
      if (!o.cible) { o.pause = 1200; continue; }
      const rx = o.cible[0] - o.img.x, ry = o.cible[1] - o.img.y, d = Math.hypot(rx, ry), v = 0.07 * dt;
      if (d < v + 1) {
        o.img.setPosition(o.cible[0], o.cible[1]);
        if (o.chemin && o.chemin.length) { o.cible = o.chemin.shift(); o.meilleur = { d: 1e9, t: this.time.now }; }
        else { o.cible = null; o.pause = Phaser.Math.Between(1500, 6000); o.vue = Phaser.Utils.Array.GetRandom(['face', 'face', 'dos', 'troisQuarts']); o.img.setTexture(corpsHD(this, o.quoi, null, o.vue)).setFlipX(false); }
        o.ombre.setPosition(o.img.x, o.img.y - 1); o.ombre.yTri = o.img.y - 0.5;
        continue;
      }
      if (!o.meilleur || d < o.meilleur.d - 1) o.meilleur = { d, t: this.time.now };
      else if (this.time.now - o.meilleur.t > 2000) { o.cible = null; o.chemin = []; o.pause = 900; continue; }
      const nx = o.img.x + rx / d * v, ny = o.img.y + ry / d * v;
      o.img.setPosition(nx, ny); o.ombre.setPosition(nx, ny - 1); o.ombre.yTri = ny - 0.5;
      o.vue = this.vueSelon(rx, ry); o.pas += dt;
      const base = corpsHD(this, o.quoi, null, o.vue), f = Math.floor(o.pas / 150) % 4, k = f === 1 ? base + '_pas1' : f === 3 ? base + '_pas2' : base;
      o.img.setTexture((this.textures.exists(k) ? k : base)).setFlipX(o.vue === 'profil' && rx < 0);
    }
  }
}
