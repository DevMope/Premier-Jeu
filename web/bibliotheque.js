// La bibliothèque : on lance le moteur du jeu sans le jeu, on lui fait peindre toutes les
// créations, puis on les range par catégorie dans la page (des images, qu'on peut agrandir).

// Un nom lisible à partir d'une clé de texture (« coffreTresorHD » → « Coffre tresor »).
function joli(cle) {
  const s = cle.replace(/^hd_/, '').replace(/HD(_|$)/, '$1').replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').trim();
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

// Les nouvelles textures créées par une fonction (on compare avant / après).
function nouvelles(scene, creer) {
  const avant = new Set(scene.textures.getTextureKeys());
  try { creer(); } catch (e) { console.warn(e); }
  return scene.textures.getTextureKeys().filter(k => !avant.has(k) && !k.startsWith('__'));
}

const NIVEAUX = n => ['★ niveau 0', '★ niveau 1', '★★ niveau 2', '★★★ niveau 3'][n];

// Chaque catégorie : un nom, une phrase, et la liste de ses créations [{ cle, nom }].
function categories(scene) {
  const G = window.GAME;
  const cats = [];
  const ajouter = (id, nom, phrase, items, large = false) => cats.push({ id, nom, phrase, items: items.filter(i => i && scene.textures.exists(i.cle)), large });
  const sur = f => { try { return f(); } catch (e) { console.warn(e); return null; } };

  // Les personnages en pied
  const peuples = { humain: 'Humain', hobbit: 'Hobbit', nain: 'Nain', elfe: 'Elfe', magicienne: 'Magicienne' };
  const persos = [];
  for (const [r, nom] of Object.entries(peuples)) persos.push(sur(() => ({ cle: corpsHD(scene, r), nom })));
  for (const [k, f] of Object.entries(FIGURANTS)) persos.push(sur(() => ({ cle: corpsHD(scene, k), nom: f.nom })));
  persos.push(sur(() => ({ cle: corpsHD(scene, 'mentor', 'leves'), nom: 'Garrick, bras levés' })));
  for (const niveau of Object.keys(NIVEAUX_AVENTURIER)) {
    persos.push(sur(() => ({ cle: corpsHD(scene, { nom: 'Aldric Montfort', race: 'humain', niveau }), nom: `Aventurier · ${NIVEAUX_AVENTURIER[niveau].nom}` })));
  }
  persos.push(sur(() => ({ cle: textureJoueur(scene, G), nom: 'Toi (le joueur)' })));
  ajouter('personnages', 'Personnages', 'Les peuples, les figurants du village, Garrick, et les tenues qui changent avec le niveau des aventuriers.', persos);

  // Les portraits du comptoir
  const portraits = [];
  const gens = [['Pippa Boisclair', 'hobbit', true], ['Durgan Barbe-de-Fer', 'nain', false], ["Mirabelle Lune-d'Argent", 'magicienne', true],
    ['Faelor Ventlune', 'elfe', false], ['Maud Rivecourt', 'humain', true], ['Aldric Montfort', 'humain', false], ['Helga Forgeterre', 'nain', true], ['Lindë Brisargent', 'elfe', true]];
  for (const [nom, race, feminin] of gens) for (const ex of ['neutre', 'content', 'fache']) {
    portraits.push(sur(() => ({ cle: textureBusteHD(scene, { nom, race, feminin }, ex), nom: `${nom} · ${ex === 'fache' ? 'fâché' : ex}` })));
  }
  ajouter('portraits', 'Portraits', 'Les bustes des voyageurs au comptoir, avec leurs expressions.', portraits);

  // Les objets
  const objets = [];
  for (const id of Object.keys(ITEMS)) objets.push({ cle: iconeObjet(scene, id), nom: ITEMS[id].nom });
  for (const id of Object.keys(MATERIAUX)) objets.push({ cle: iconeObjet(scene, id), nom: MATERIAUX[id].nom + ' (matériau)' });
  for (const id of Object.keys(CADEAUX)) objets.push({ cle: iconeObjet(scene, id), nom: CADEAUX[id].nom + ' (cadeau)' });
  for (const c of Object.keys(CATEGORIES)) objets.push({ cle: iconeObjet(scene, 'tr_' + c), nom: CATEGORIES[c].nom + ' de valeur' });
  ajouter('objets', 'Objets', 'Les provisions, les matériaux, les cadeaux du Bazar et les trésors rapportés de voyage.', objets);

  const armure = [];
  for (const p of ARMURE) {
    armure.push({ cle: 'hd_' + p.id, nom: p.nom });
    armure.push({ cle: 'hd_' + p.id + '_sombre', nom: pieceArmure(p.id, 'sombre').nom });
  }
  ajouter('armure', 'Armure', "L'Armure du Dernier Rempart et sa version de la Nuit Éternelle, pièce par pièce.", armure);

  const icones = Object.keys(DESSINS_ICONES).map(k => ({ cle: 'hd_' + k, nom: joli(k) }));
  for (let n = 0; n <= 4; n++) icones.push({ cle: (creerBoursesHD(scene), 'bourseHD' + n), nom: `Bourse ${['vide', 'légère', 'moyenne', 'pleine', 'débordante'][n]}` });
  ajouter('icones', 'Icônes et interface', 'Les petites icônes du jeu : cœurs, trèfle, trophées, bourses.', icones);

  // Le mobilier, niveau par niveau
  const meubles = [];
  for (let n = 0; n <= 3; n++) {
    meubles.push(sur(() => ({ cle: etagereHD(scene, n), nom: `Étagère · ${AMELIORATIONS.reserve.niveaux[n]}` })));
    meubles.push(sur(() => ({ cle: plateauComptoir(scene, n), nom: `Comptoir · ${AMELIORATIONS.comptoir.niveaux[n]}` })));
    meubles.push(sur(() => ({ cle: coffreHD(scene, n), nom: `Coffre · ${AMELIORATIONS.coffre.niveaux[n]}` })));
    meubles.push(sur(() => ({ cle: litHD(scene, n), nom: `Lit · ${AMELIORATIONS.chambre.niveaux[n]}` })));
    meubles.push(sur(() => ({ cle: couvertureHD(scene, n), nom: `Couverture · ${NIVEAUX(n)}` })));
    meubles.push(sur(() => ({ cle: chevetHD(scene, n), nom: `Table de chevet · ${NIVEAUX(n)}` })));
    meubles.push(sur(() => ({ cle: tapisHD(scene, n), nom: `Tapis · ${NIVEAUX(n)}` })));
    meubles.push(sur(() => ({ cle: luminaireHD(scene, n), nom: `Éclairage · ${AMELIORATIONS.eclairage.niveaux[n]}` })));
  }
  ajouter('mobilier', 'Mobilier', 'Chaque meuble du shop, de son état le plus humble au plus luxueux.', meubles);

  const interieur = [
    ...nouvelles(scene, () => creerInterieurHD(scene)), ...nouvelles(scene, () => creerDouilletHD(scene)),
    ...nouvelles(scene, () => creerDecorComptoir(scene)), ...nouvelles(scene, () => creerFenetreHD(scene)),
    ...nouvelles(scene, () => creerBureauHD(scene)), ...nouvelles(scene, () => creerAtelierHD(scene)),
    ...nouvelles(scene, () => coffreTresorHD(scene)), ...nouvelles(scene, () => cadreLivreHD(scene)),
  ].map(cle => ({ cle, nom: joli(cle) }));
  ajouter('interieur', 'Intérieurs', "Murs, fenêtres, bougies, coin douillet, bureau, atelier : tout ce qui habille l'intérieur.", interieur, true);

  // L'extérieur
  const lieux = [];
  for (let n = 0; n <= 3; n++) lieux.push(sur(() => { creerFacadeHD(scene, n); return { cle: 'facadeHD_' + n, nom: `Façade · ${['humble chaumière', 'jolie maison', 'belle maison', 'la plus belle du village'][n]}` }; }));
  for (const b of Object.keys(BIOMES)) lieux.push(sur(() => ({ cle: paysageHD(scene, 480, 270, b, 0), nom: `Paysage · ${joli(b)}` })));
  lieux.push(sur(() => ({ cle: paysageHD(scene, 480, 270, 'comte', 'aube'), nom: 'Paysage · la Comté à l\'aube' })));
  lieux.push(sur(() => ({ cle: paysageHD(scene, 480, 270, 'comte', 0.95), nom: 'Paysage · la Comté la nuit' })));
  ajouter('lieux', 'Lieux et paysages', 'La façade du shop à chaque niveau, et les paysages de chaque contrée (de jour, à l\'aube, de nuit).', lieux, true);

  const ville = [
    ...nouvelles(scene, () => creerLieuxMarcheHD(scene)), ...nouvelles(scene, () => creerDecorPlaceHD(scene)),
    ...nouvelles(scene, () => creerBanqueHD(scene)), ...nouvelles(scene, () => creerEauHD(scene)),
    ...Object.values(MARCHANDS).map(m => sur(() => etalHD(scene, m.couleur))).filter(Boolean),
  ].map(cle => ({ cle, nom: joli(cle) }));
  ajouter('ville', 'Marché et village', "Les étals, les enchères, la fontaine, les charrettes, la banque des nains, et l'eau de la rivière.", ville);

  const carte = [...nouvelles(scene, () => creerCarteHD(scene)), ...nouvelles(scene, () => creerComptoirCarteHD(scene))].map(cle => ({ cle, nom: joli(cle) }));
  creerVignettesZonesHD(scene);
  for (const [k, z] of Object.entries(ZONES)) carte.push({ cle: 'vignetteZone_' + k, nom: z.nom });
  carte.push({ cle: 'vignetteZone_inconnue', nom: 'Contrée inconnue' });
  ajouter('carte', 'Carte du monde', 'Le parchemin, ton comptoir, et le médaillon peint de chaque contrée.', carte);

  const recits = nouvelles(scene, () => creerRecitHD(scene)).map(cle => ({ cle, nom: joli(cle) }));
  ajouter('recits', 'Récits de voyage', 'Les créatures, les décors et les effets des histoires que racontent les aventuriers.', recits);

  creerBaluchons(scene);
  const baluchons = scene.textures.getTextureKeys().filter(k => k.startsWith('baluchon_') || k.startsWith('tissu_'))
    .map(cle => ({ cle, nom: (cle.startsWith('tissu_') ? 'Tissu · ' : 'Baluchon · ') + joli(cle.replace(/^(baluchon|tissu)_/, '')) }));
  ajouter('baluchons', 'Baluchons', 'Les baluchons préparés pour chaque voyageur.', baluchons);

  return cats.filter(c => c.items.length);
}

// --- La page ---

function construirePage(scene, cats) {
  const textures = scene.textures;
  const image = cle => {
    const src = textures.get(cle).getSourceImage();
    return { url: textures.getBase64(cle), l: src.width, h: src.height };
  };
  const vus = new Set();
  for (const c of cats) {
    c.items = c.items.filter(i => { const k = c.id + i.cle; if (vus.has(k)) return false; vus.add(k); return true; });
    for (const i of c.items) Object.assign(i, image(i.cle));
  }
  const total = cats.reduce((s, c) => s + c.items.length, 0);
  document.getElementById('total').textContent = total;
  document.getElementById('chargement').hidden = true;

  let choisie = 'tout';
  try { choisie = localStorage.getItem('biblio-onglet') || 'tout'; } catch (e) { /* rien */ }
  const onglets = document.getElementById('onglets');
  const contenu = document.getElementById('contenu');
  const recherche = document.getElementById('recherche');

  const bouton = (id, nom, n) => {
    const b = document.createElement('button');
    b.className = 'onglet';
    b.type = 'button';
    b.dataset.id = id;
    b.innerHTML = `${nom} <span>${n}</span>`;
    b.addEventListener('click', () => { choisie = id; try { localStorage.setItem('biblio-onglet', id); } catch (e) { /* rien */ } dessiner(); });
    onglets.appendChild(b);
  };
  bouton('tout', 'Tout', total);
  for (const c of cats) bouton(c.id, c.nom, c.items.length);
  if (choisie !== 'tout' && !cats.some(c => c.id === choisie)) choisie = 'tout';

  function carte(i) {
    const b = document.createElement('button');
    b.className = 'carte';
    b.type = 'button';
    const echelle = Math.max(1, Math.min(8, Math.floor(140 / Math.max(i.l, i.h))));
    b.innerHTML = `<div class="socle"><img alt="" src="${i.url}" width="${i.l * echelle}" height="${i.h * echelle}"></div>
      <div><div class="nom"></div><div class="taille">${i.l} × ${i.h} px</div></div>`;
    b.querySelector('.nom').textContent = i.nom;
    b.querySelector('img').alt = i.nom;
    b.addEventListener('click', () => ouvrirLoupe(i));
    return b;
  }

  function dessiner() {
    for (const b of onglets.children) b.setAttribute('aria-pressed', String(b.dataset.id === choisie));
    const q = recherche.value.trim().toLowerCase();
    contenu.innerHTML = '';
    let trouves = 0;
    for (const c of cats) {
      if (choisie !== 'tout' && c.id !== choisie) continue;
      const items = c.items.filter(i => !q || i.nom.toLowerCase().includes(q) || i.cle.toLowerCase().includes(q));
      if (!items.length) continue;
      trouves += items.length;
      const s = document.createElement('section');
      s.className = 'section';
      s.innerHTML = `<h2></h2><p></p>`;
      s.querySelector('h2').textContent = `${c.nom} (${items.length})`;
      s.querySelector('p').textContent = c.phrase;
      const g = document.createElement('div');
      g.className = 'grille' + (c.large ? ' large' : '');
      for (const i of items) g.appendChild(carte(i));
      s.appendChild(g);
      contenu.appendChild(s);
    }
    if (!trouves) contenu.innerHTML = '<p class="vide">Aucune création ne correspond à cette recherche.</p>';
  }
  recherche.addEventListener('input', dessiner);
  dessiner();

  // La loupe
  const loupe = document.getElementById('loupe');
  const img = document.getElementById('loupe-img');
  const zoom = document.getElementById('loupe-zoom');
  let courant = null;
  function ouvrirLoupe(i) {
    courant = i;
    document.getElementById('loupe-nom').textContent = i.nom;
    document.getElementById('loupe-taille').textContent = `${i.l} × ${i.h} px`;
    img.src = i.url;
    img.alt = i.nom;
    const max = Math.max(1, Math.min(10, Math.floor(Math.min(window.innerWidth * 0.86 / i.l, window.innerHeight * 0.66 / i.h))));
    zoom.innerHTML = '';
    for (const z of [1, 2, 3, 4, 6, 8, 10].filter(z => z <= Math.max(max, 2))) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = '×' + z;
      b.addEventListener('click', () => grossir(z));
      zoom.appendChild(b);
    }
    grossir(Math.min(max, 10));
    if (typeof loupe.showModal === 'function') loupe.showModal(); else loupe.setAttribute('open', '');
  }
  function grossir(z) {
    img.width = courant.l * z;
    img.height = courant.h * z;
    for (const b of zoom.children) b.setAttribute('aria-pressed', String(b.textContent === '×' + z));
  }
  document.getElementById('loupe-fermer').addEventListener('click', () => loupe.close());
  loupe.addEventListener('click', e => { if (e.target === loupe) loupe.close(); });
}

// Le moteur du jeu, tout petit et caché : il ne sert qu'à peindre.
new Phaser.Game({
  type: Phaser.CANVAS,
  parent: 'moteur',
  width: 16,
  height: 16,
  banner: false,
  audio: { noAudio: true },
  scene: {
    create() {
      const scene = this;
      setTimeout(() => {
        try { nouvellePartie({}); } catch (e) { console.warn(e); }
        try { creerToutesLesTextures(scene); } catch (e) { console.warn(e); }
        construirePage(scene, categories(scene));
      }, 30);
    },
  },
});
