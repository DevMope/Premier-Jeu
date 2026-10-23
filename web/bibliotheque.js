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

// Une photo : un décor que le jeu pose dans une scène (le bar, la rue, le moulin...), sans texture à lui. On le pose
// dans une scène à part, on peint ce qu'elle montre dans une texture, puis on range la scène. Un long décor se peint par
// bandes de `bande` pixels (la rue entière). `x`, `y` : le coin du monde qu'on photographie (la carte, par exemple) ;
// `vues` : plusieurs photos du même décor, [[clé, x], ...] (là où le ciel suit la caméra, comme au Vieux Moulin, on
// montre ce que voit le joueur à chaque endroit plutôt qu'une bande de ciels recollés).
function photo(scene, cle, l, h, poser, { zoom = 1, bande = l, x = 0, y = 0, vues = [[cle, x]] } = {}) {
  if (vues.every(([k]) => scene.textures.exists(k))) return cle;
  const id = 'photo_' + cle, s = scene.scene.add(id, new Phaser.Scene(id), true);
  try {
    poser(s);
    s.children.depthSort();
    const objets = s.children.list.slice(), L = Math.round(l * zoom), H = Math.round(h * zoom), B = Math.round(bande * zoom), r = scene.sys.game.renderer;
    for (const [k, x0] of vues) {
      const c = scene.textures.createCanvas(k, L, H);
      for (let dx = 0; dx < l; dx += bande) {
        const dt = scene.textures.addDynamicTexture(id, B, H);
        dt.camera.setOrigin(0, 0).setZoom(zoom).setScroll(x0 + dx, y);
        dt.draw(objets.filter(o => o.willRender(dt.camera)));
        if (dt.canvas) c.context.drawImage(dt.canvas, Math.round(dx * zoom), 0);
        else {   // (WebGL : on relit les pixels de la texture)
          const gl = r.gl, px = new Uint8Array(B * H * 4), im = c.context.createImageData(B, H);
          r.setFramebuffer(dt.renderTarget.framebuffer);
          gl.readPixels(0, 0, B, H, gl.RGBA, gl.UNSIGNED_BYTE, px);
          r.setFramebuffer(null);
          const u = new Uint32Array(px.buffer);   // (les couleurs sont prémultipliées : on les rend là où le pixel est à demi transparent)
          for (let i = 0; i < u.length; i++) { const a = u[i] >>> 24; if (a === 255 || !a) continue; for (let j = i * 4; j < i * 4 + 3; j++) px[j] = Math.min(255, Math.round(px[j] * 255 / a)); }
          im.data.set(px);
          c.context.putImageData(im, Math.round(dx * zoom), 0);
        }
        dt.destroy();
      }
      c.refresh();
    }
  } finally { scene.scene.remove(id); }
  return cle;
}

// Les polices du jeu (celles des textes, et les cinq écritures de l'enseigne) : on les charge dès le début, et on les attend
// avant de peindre les photos (qui ont des textes), sans attendre plus de 4 secondes (hors ligne, on peint avec Georgia)
function policesDuJeu() {
  const lien = document.createElement('link');
  lien.rel = 'stylesheet';
  lien.href = 'https://fonts.googleapis.com/css2?family=MedievalSharp&family=Uncial+Antiqua&family=Pirata+One&family=IM+Fell+English+SC&display=swap';
  const pret = new Promise(ok => { lien.onload = ok; lien.onerror = ok; document.head.appendChild(lien); })
    .then(() => Promise.all([['Alegreya', 'bold'], ['Alegreya', 'normal'], ...ENSEIGNE.polices].map(([f, g]) => document.fonts.load(`${g === 'bold' ? 700 : 400} 20px "${f}"`).catch(() => null))));
  return Promise.race([pret, new Promise(ok => setTimeout(ok, 4000))]);
}
const POLICES = policesDuJeu();

const NIVEAUX = n => ['★ niveau 0', '★ niveau 1', '★★ niveau 2', '★★★ niveau 3'][n];

// Chaque catégorie : un nom, une phrase, et la liste de ses créations [{ cle, nom }].
// (on rend la main au navigateur entre deux catégories : la page ne se fige pas, et dit où elle en est)
async function categories(scene) {
  const G = window.GAME;
  const cats = [];
  const ajouter = (id, nom, phrase, items, large = false) => {
    cats.push({ id, nom, phrase, items: items.filter(i => i && scene.textures.exists(i.cle)), large });
    document.getElementById('chargement').textContent = `On peint les créations… (${cats.length} : ${nom})`;
    return new Promise(ok => setTimeout(ok, 0));
  };
  const sur = f => { try { return f(); } catch (e) { console.warn('Bibliothèque, une création a échoué :', e); return null; } };
  // une liste { clé: nom } en créations (celles qui n'existent pas sont écartées par ajouter)
  const liste = noms => Object.entries(noms).map(([cle, nom]) => ({ cle, nom }));

  // Les personnages en pied : tous les peuples (PROPORTIONS) et tous les figurants
  const peuples = { humain: 'Humain', hobbit: 'Hobbit', nain: 'Nain', elfe: 'Elfe', magicienne: 'Magicienne', panda: 'Panda',
    gobelin: 'Gobelin (Banni)', orc: 'Orc (Banni)', loupgarou: 'Loup-garou (Banni)', vampire: 'Vampire (Banni)', momie: 'Momie (Bannie)', troll: 'Troll (Banni)' };
  const persos = [];
  for (const r of Object.keys(PROPORTIONS)) persos.push(sur(() => ({ cle: corpsHD(scene, r), nom: peuples[r] || joli(r) })));
  for (const [k, f] of Object.entries(FIGURANTS)) persos.push(sur(() => ({ cle: corpsHD(scene, k), nom: f.nom })));
  persos.push(sur(() => ({ cle: corpsHD(scene, 'mentor', 'leves'), nom: 'Garrick, bras levés' })));
  for (const niveau of Object.keys(NIVEAUX_AVENTURIER)) {
    persos.push(sur(() => ({ cle: corpsHD(scene, { nom: 'Aldric Montfort', race: 'humain', niveau }), nom: `Aventurier · ${NIVEAUX_AVENTURIER[niveau].nom}` })));
  }
  persos.push(sur(() => ({ cle: textureJoueur(scene, G), nom: 'Toi (le joueur)' })));
  await ajouter('personnages', 'Personnages', 'Les peuples, les figurants du village, Garrick, et les tenues qui changent avec le niveau des aventuriers.', persos);

  // Les portraits du comptoir
  const portraits = [];
  const gens = [['Pippa Boisclair', 'hobbit', true], ['Durgan Barbe-de-Fer', 'nain', false], ["Mirabelle Lune-d'Argent", 'magicienne', true],
    ['Faelor Ventlune', 'elfe', false], ['Maud Rivecourt', 'humain', true], ['Aldric Montfort', 'humain', false], ['Helga Forgeterre', 'nain', true], ['Lindë Brisargent', 'elfe', true],
    ['Bao Bambou-Doux', 'panda', false], ['Zizka Mordille', 'gobelin', true], ['Gorrak Brise-Crâne', 'orc', false], ['Fenrick Lunegrise', 'loupgarou', false],
    ['Carmilla Nuit-Pâle', 'vampire', true], ['Nekhet Sable-Ancien', 'momie', false], ['Grumsh Mange-Pierre', 'troll', false]];
  for (const [nom, race, feminin] of gens) for (const ex of ['neutre', 'content', 'fache']) {
    portraits.push(sur(() => ({ cle: textureBusteHD(scene, { nom, race, feminin }, ex), nom: `${nom} · ${ex === 'fache' ? 'fâché' : ex}` })));
  }
  portraits.push(sur(() => ({ cle: textureBusteHD(scene, { nom: COLPORTEUR.nom, race: 'humain', figurant: 'colporteur' }, 'content'), nom: 'Barnabé le colporteur' })));
  // Toutes les poses (les bras et les mains), sur un même visage
  for (const pose of ['croises', 'hanche', 'menton', 'salut', 'pouce', 'poing', 'tete', 'mains', 'coeur', 'ventre', 'baton']) {
    portraits.push(sur(() => ({ cle: textureBusteHD(scene, { nom: 'Maud Rivecourt', race: 'humain', feminin: true }, 'neutre', { pose }), nom: `Pose · ${pose}` })));
  }
  await ajouter('portraits', 'Portraits', 'Les bustes des voyageurs au comptoir, avec leurs expressions et leurs poses (chaque peuple a les siennes, selon son humeur).', portraits);

  // Les objets
  const objets = [];
  for (const id of Object.keys(ITEMS)) objets.push({ cle: iconeObjet(scene, id), nom: ITEMS[id].nom });
  for (const id of Object.keys(MATERIAUX)) objets.push({ cle: iconeObjet(scene, id), nom: MATERIAUX[id].nom + ' (matériau)' });
  for (const id of Object.keys(CADEAUX)) objets.push({ cle: iconeObjet(scene, id), nom: CADEAUX[id].nom + ' (cadeau)' });
  for (const c of Object.keys(CATEGORIES)) objets.push({ cle: iconeObjet(scene, 'tr_' + c), nom: CATEGORIES[c].nom + ' de valeur' });
  await ajouter('objets', 'Objets', 'Les provisions (redessinées en 32 × 32, deux fois plus fines), les matériaux, les cadeaux du Bazar et les trésors rapportés de voyage.', objets);

  const armure = [];
  for (const p of ARMURE) {
    armure.push({ cle: 'hd_' + p.id, nom: p.nom });
    armure.push({ cle: 'hd_' + p.id + '_sombre', nom: pieceArmure(p.id, 'sombre').nom });
  }
  await ajouter('armure', 'Armure', "L'Armure du Dernier Rempart et sa version de la Nuit Éternelle, pièce par pièce.", armure);

  const icones = Object.keys(DESSINS_ICONES).map(k => ({ cle: 'hd_' + k, nom: joli(k) }));
  for (let n = 0; n <= 4; n++) icones.push({ cle: (creerBoursesHD(scene), 'bourseHD' + n), nom: `Bourse ${['vide', 'légère', 'moyenne', 'pleine', 'débordante'][n]}` });
  await ajouter('icones', 'Icônes et interface', 'Les petites icônes du jeu : cœurs, trèfle, trophées, bourses.', icones);

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
  await ajouter('mobilier', 'Mobilier', 'Chaque meuble du shop, de son état le plus humble au plus luxueux.', meubles);

  const interieur = [
    ...nouvelles(scene, () => creerInterieurHD(scene)), ...nouvelles(scene, () => creerDouilletHD(scene)),
    ...nouvelles(scene, () => creerDecorComptoir(scene)), ...nouvelles(scene, () => creerFenetreHD(scene)),
    ...nouvelles(scene, () => creerBureauHD(scene)), ...nouvelles(scene, () => creerAtelierHD(scene)),
    ...nouvelles(scene, () => coffreTresorHD(scene)), ...nouvelles(scene, () => cadreLivreHD(scene)),
  ].map(cle => ({ cle, nom: joli(cle) }));
  await ajouter('interieur', 'Intérieurs', "Murs, fenêtres, bougies, coin douillet, bureau, atelier : tout ce qui habille l'intérieur.", interieur, true);

  // L'extérieur
  const lieux = [];
  for (let n = 0; n <= 3; n++) lieux.push(sur(() => { creerFacadeHD(scene, n); return { cle: 'facadeHD_' + n, nom: `Façade · ${['humble chaumière', 'jolie maison', 'belle maison', 'la plus belle du village'][n]}` }; }));
  for (const b of Object.keys(BIOMES)) lieux.push(sur(() => ({ cle: paysageHD(scene, 480, 270, b, 0), nom: `Paysage · ${joli(b)}` })));
  lieux.push(sur(() => ({ cle: paysageHD(scene, 480, 270, 'comte', 'aube'), nom: 'Paysage · la Comté à l\'aube' })));
  lieux.push(sur(() => ({ cle: paysageHD(scene, 480, 270, 'comte', 0.95), nom: 'Paysage · la Comté la nuit' })));
  await ajouter('lieux', 'Lieux et paysages', 'La façade du shop à chaque niveau, et les paysages de chaque contrée (de jour, à l\'aube, de nuit).', lieux, true);

  const ville = [
    ...nouvelles(scene, () => creerLieuxMarcheHD(scene)), ...nouvelles(scene, () => creerDecorPlaceHD(scene)),
    ...nouvelles(scene, () => placeMarcheHD(scene)),
    ...nouvelles(scene, () => { charretteColporteurHD(scene); decorsEtalsHD(scene); propsVitrineHD(scene); chienHD(scene, 'profil', true); chienHD(scene, 'troisQuarts'); chienHD(scene, 'face'); }),
    ...Object.values(MARCHANDS).map(m => sur(() => tapisEtalHD(scene, m.couleur))).filter(Boolean),
    ...nouvelles(scene, () => creerBanqueHD(scene)), ...nouvelles(scene, () => creerEauHD(scene)),
    ...Object.values(MARCHANDS).map(m => sur(() => etalHD(scene, m.couleur))).filter(Boolean),
  ].map(cle => ({ cle, nom: joli(cle) }));
  await ajouter('ville', 'Marché et village', "Les étals et leurs tapis, les décorations de chaque marchand, le mendiant et son chien, la charrette du colporteur, les enchères, la fontaine, la banque des nains, et l'eau de la rivière.", ville);

  const carte = [...nouvelles(scene, () => creerCarteHD(scene)), ...nouvelles(scene, () => creerComptoirCarteHD(scene))].map(cle => ({ cle, nom: joli(cle) }));
  creerVignettesZonesHD(scene);
  for (const [k, z] of Object.entries(ZONES)) carte.push({ cle: 'vignetteZone_' + k, nom: z.nom });
  carte.push({ cle: 'vignetteZone_inconnue', nom: 'Contrée inconnue' });
  await ajouter('carte', 'Carte du monde', 'Le parchemin, ton comptoir, et le médaillon peint de chaque contrée.', carte);

  creerEmblemesHD(scene);
  const emblemes = Object.entries(EMBLEMES).map(([k, e]) => ({ cle: 'embleme_' + k, nom: e.nom }));
  await ajouter('emblemes', 'Emblèmes', 'Les écus des royaumes du Conseil, du Conseil et de sa Confrérie, des Bannis et de chacun de leurs peuples, et de la Main Noire.', emblemes);

  const recits = nouvelles(scene, () => creerRecitHD(scene)).map(cle => ({ cle, nom: joli(cle) }));
  await ajouter('recits', 'Récits de voyage', 'Les créatures, les décors et les effets des histoires que racontent les aventuriers.', recits);

  creerBaluchons(scene);
  const baluchons = scene.textures.getTextureKeys().filter(k => k.startsWith('baluchon_') || k.startsWith('tissu_'))
    .map(cle => ({ cle, nom: (cle.startsWith('tissu_') ? 'Tissu · ' : 'Baluchon · ') + joli(cle.replace(/^(baluchon|tissu)_/, '')) }));
  await ajouter('baluchons', 'Baluchons', 'Les baluchons préparés pour chaque voyageur.', baluchons);

  // ——— Ce qui est arrivé depuis (jusqu'à la v1.57) ———
  await POLICES;   // (les photos ont des textes : il faut les polices du jeu)
  // (chaque fonction peint ses textures ; on les range ensuite par leur clé, avec un nom en français)
  const ici = { regarder() {}, porte() {} };   // (la rue demande où sont ses portes : ici, nulle part)
  const decorFacade = (p, sol = 440) => { dessinerComte(p.add.graphics(), 0, 0, 960, sol + 30, 0); p.add.image(0, sol, pavesHD(p, 960, 100)).setOrigin(0).setScale(2); };

  // Les poses et les vues du moteur des corps
  const maud = { nom: 'Maud Rivecourt', race: 'humain', feminin: true, niveau: 'aguerri' }, poses = [];
  const POSES = { accueil: 'les bras ouverts (accueil)', baluchon: "le baluchon à l'épaule", leves: 'les bras levés', pense: 'pensive, la main au menton', stupeur: 'la stupeur',
    grimpe1: 'elle grimpe (1)', grimpe2: 'elle grimpe (2)', porteur: 'la pose du porteur (un enfant sur les épaules)', epaules: "assise sur les épaules de quelqu'un", empoigne: 'elle empoigne un filou (le videur)',
    plateau: 'le plateau (au bar)', mange: 'elle mange debout' };
  for (const [pose, nom] of Object.entries(POSES)) poses.push(sur(() => ({ cle: corpsHD(scene, maud, pose), nom: `Maud · ${nom}` })));
  const base = sur(() => corpsHD(scene, maud));
  if (base) for (const k of [1, 2]) poses.push({ cle: base + '_pas' + k, nom: `Maud · elle marche (pas ${k})` });
  const VUES = { troisQuarts: 'de trois quarts', face: 'de face', profil: 'de profil', dos: 'de dos' };
  for (const [vue, nom] of Object.entries(VUES)) poses.push(sur(() => ({ cle: corpsHD(scene, { nom: 'Aldric Montfort', race: 'humain', niveau: 'aguerri' }, null, vue), nom: `Aldric Montfort · ${nom}` })));
  await ajouter('poses', 'Poses et vues', 'Le moteur des corps : chaque geste est une vraie pose (jamais de bras en plus), et chaque personnage se voit sous quatre angles.', poses);

  // Les coupes et les barbes de la création (les vignettes du menu de l'apparence)
  const ap = { ...((G.joueur && G.joueur.apparence) || {}), barbe: 0, couleurBarbe: 0 }, coiffures = [];
  APPARENCE.coiffure.forEach((nom, i) => { for (const f of [false, true]) coiffures.push(sur(() => ({ cle: textureVignetteApparence(scene, { ...ap, coiffure: i }, f, 'petit'), nom: `Coupe · ${nom} (${f ? 'elle' : 'lui'}, à 15 ans)` }))); });
  APPARENCE.barbe.forEach((nom, i) => { if (i) coiffures.push(sur(() => ({ cle: textureVignetteApparence(scene, { ...ap, coiffure: 0, barbe: i }, false, 'adulte'), nom: `Barbe · ${nom}` }))); });
  await ajouter('coiffures', 'Coiffures et barbes', 'Toutes les coupes de la création (à 15 ans) et toutes les barbes (adulte, chez le barbier), dessinées sur la tête en volume du joueur.', coiffures);

  // Le bivouac des récits : manger, boire, se chauffer, dormir
  const bivouac = [];
  const BIVOUAC = { assis: 'au repos, assis', mangeAssis: 'mange sa ration', boit: 'boit à sa gourde', chauffe: 'se chauffe les mains au feu', dort: 'dort près des braises' };
  for (const qui of [{ nom: 'Aldric Montfort', race: 'humain', niveau: 'aguerri' }, { nom: 'Lindë Brisargent', race: 'elfe', feminin: true, niveau: 'aguerri' }])
    for (const [pose, nom] of Object.entries(BIVOUAC)) bivouac.push(sur(() => ({ cle: corpsHD(scene, qui, pose), nom: `${qui.nom} · ${qui.feminin ? nom.replace('assis', 'assise') : nom}` })));
  await ajouter('bivouac', 'Le bivouac', "Les gestes du soir dans les récits : l'aventurier mange vraiment, boit, se réchauffe et dort, avec de vraies poses.", bivouac);

  // Les pierres de l'interface et les pictogrammes
  const pierres = [];
  RANGS.forEach((r, i) => pierres.push(sur(() => ({ cle: plaqueRang(scene, 200, i, i >= 2 ? 'saphir' : null), nom: `Bouton · ${r.nom} (${r.quand})` }))));
  for (const [p, d] of Object.entries(PIERRES)) {
    pierres.push(sur(() => ({ cle: plaqueRang(scene, 200, 4, p), nom: `Bouton de la Demeure · ${d.nom}` })));
    pierres.push(sur(() => ({ cle: pierreSeule(scene, p, 15, 3), nom: `${d.nom} (pierre taillée) : ${d.sujet}` })));
    pierres.push(sur(() => ({ cle: pierreSeule(scene, p, 15, 2), nom: `${d.nom} (cabochon)` })));
  }
  sur(() => creerGlyphesHD(scene));
  const GLYPHES_NOMS = { soleil: 'Le soleil (la lumière)', lune: "La lune (l'ombre)", colere: 'La colère', larme: 'La larme', idee: "L'idée", merci: 'Merci', etoile: "L'étoile",
    main: 'La main', balai: 'Le balai', epees: 'Les épées croisées', lettre: 'La lettre', crane: 'Le crâne (les pièges)', son: 'Le son', muet: 'Muet' };
  for (const k of Object.keys(GLYPHES)) pierres.push({ cle: 'glyphe_' + k, nom: `Pictogramme · ${GLYPHES_NOMS[k] || joli(k)}` });
  await ajouter('pierres', 'Pierres et pictogrammes', "Les cinq rangs de boutons qui suivent la maison, une pierre précieuse par sujet, et les pictogrammes qui remplacent les émojis.", pierres);

  // Le luxe et l'étage
  for (const q of ['lit', 'coffre', 'comptoir', 'luminaire']) sur(() => textureLuxe(scene, q));
  sur(() => creerEtageHD(scene));
  await ajouter('luxe', "Le luxe et l'étage", "Le cinquième niveau du comptoir, du coffre, de la chambre et de l'éclairage ; la façade surélevée de l'appartement, le salon et le grenier.", liste({
    plateauComptoir_4: `Comptoir · ${AMELIORATIONS.comptoir.niveaux[4]}`, coffreHD_4: `Coffre · ${AMELIORATIONS.coffre.niveaux[4]}`, litHD_4: `Lit · ${AMELIORATIONS.chambre.niveaux[4]}`,
    luminaire_4: `Éclairage · ${AMELIORATIONS.eclairage.niveaux[4]}`, facadeHD_4: "La façade avec l'étage (l'appartement)", fauteuilHD: 'Le fauteuil du salon', grenierHD: 'Le grenier aménagé' }), true);

  // Les saisons : la Comté change de couleurs, et devant ta façade les arbres, les fleurs, les meules, la neige
  const saisons = [];
  for (const s of ORDRE_SAISONS) {
    SAISON_FORCEE = s;
    saisons.push(sur(() => ({ cle: paysageHD(scene, 480, 270, 'comte', 0), nom: `La Comté · ${SAISONS[s].nom} (${SAISONS[s].sous.toLowerCase()})` })));
    saisons.push(sur(() => ({ cle: photo(scene, 'photoSaison_' + s, 960, 540, p => { decorFacade(p); const facade = dessinerFacade(p, 560, 440, G.nomShop);
      decorSaison(p, { sol: 440, arbres: [[70, 1.15], [905, 1.05]], facade, bonhomme: 790, prof: 3 }); }), nom: `Ta façade · ${SAISONS[s].nom}` })));
  }
  SAISON_FORCEE = null;
  sur(() => creerIconesSaison(scene));
  for (const s of ORDRE_SAISONS) saisons.push({ cle: 'iconeSaison_' + s, nom: `Icône · ${SAISONS[s].nom}` });
  await ajouter('saisons', 'Les saisons', "Semailles, Moissons, Brumes, Givre : les couleurs de la Comté, et ce qui change devant ta porte (arbres, fleurs, meules, feuilles, neige et bonhomme de neige).", saisons, true);

  // La météo : les icônes, les pans de pluie et de neige, et un jour de chaque temps devant ta façade
  sur(() => creerTexturesMeteo(scene));
  const meteo = Object.keys(METEOS).map(k => sur(() => ({ cle: iconeMeteoHD(scene, k), nom: `Icône · ${METEOS[k].nom}` })));
  meteo.push(...liste({ meteoPluie: 'Le pan de pluie (il défile)', meteoNeige: 'Le pan de neige', meteoFeuilles: 'Les feuilles emportées par le vent' }));
  const jourAvant = G.jour;
  for (const type of ['pluie', 'orage', 'neige']) {   // (la canicule et le grand vent ne se voient qu'en mouvement : l'air qui tremble, les feuilles)
    const j = Array.from({ length: 400 }, (_, i) => i + 3).find(j => sur(() => meteoDu(G, j)) === type);
    if (!j) continue;
    G.jour = j;
    meteo.push(sur(() => ({ cle: photo(scene, 'photoMeteo_' + type, 960, 540, p => { decorFacade(p); const sol = p.children.list[p.children.list.length - 1]; dessinerFacade(p, 560, 440, G.nomShop);
      ambianceMeteo(p, { sol: 440, apres: sol, flaques: [[180, 470, 130, 14], [720, 495, 150, 16], [880, 462, 90, 11]] }); }), nom: `${METEOS[type].nom}, devant ta façade` })));
    if (type === 'pluie') meteo.push(sur(() => ({ cle: photo(scene, 'photoArdoise', 100, 126, p => ardoiseMeteo(p, 50, 124, G)), nom: "L'ardoise de Madame Ysmée" })));
  }
  G.jour = jourAvant;
  await ajouter('meteo', 'La météo', "Le temps qu'il fait : les icônes, l'ardoise d'Ysmée, la pluie qui tombe vraiment et ses flaques, l'orage, la neige.", meteo, true);

  // Le quotidien et le cambrioleur
  const quotidien = [0, 1].map(n => sur(() => ({ cle: cellierHD(scene, n), nom: `Le cellier · ${AMELIORATIONS.cellier.niveaux[n]}` })));
  quotidien.push(sur(() => ({ cle: chapeauFeteHD(scene), nom: "Le chapeau pointu d'anniversaire (un habitué)" })));
  quotidien.push(sur(() => ({ cle: photo(scene, 'photoGuirlande', 480, 64, p => guirlandeFanions(p, p.add.container(0, 0), 0, 480, 6, 24)), nom: 'La guirlande des jours de marché' })));
  await ajouter('quotidien', 'Le quotidien', "Le cellier qui garde les provisions au frais, l'anniversaire d'un habitué, les fanions des jours de marché.", quotidien);
  const cambrioleur = [0, 1].map(n => sur(() => ({ cle: serrureHD(scene, n), nom: `La porte de la rue · ${AMELIORATIONS.serrure.niveaux[n]}` })));
  for (const vue of ['troisQuarts', 'profil']) cambrioleur.push(sur(() => ({ cle: corpsHD(scene, VOLEUR_NUIT, null, vue), nom: `${VOLEUR_NUIT.nom}, le cambrioleur (${VUES[vue]})` })));
  await ajouter('cambrioleur', 'Le cambrioleur', 'La serrure de la porte de la rue (un loquet, puis le fer), et le voleur de la nuit.', cambrioleur);

  // La rue du shop
  sur(() => { creerRueHD(scene); creerLogoBanque(scene); });
  const rue = liste({ rueMaisonHD_0: 'La maison des Pommeroy', rueImpasseHD: "L'impasse du marché noir", rueForgeHD: 'La forge de Thorgal, le soir', rueForgeHD_jour: 'La forge de Thorgal, de jour',
    rueMaisonHD_1: 'La maison des Brindeloup', rueBanqueHD: 'La Banque Centrale Goyenne', logoBanque: 'Le logo de la Banque', rueArcheHD: "L'arche du Marché des Mastres, la nuit",
    rueArcheHD_jour: "L'arche du Marché des Mastres, de jour", reverbereHD: 'Le réverbère' });
  rue.push(sur(() => ({ cle: photo(scene, 'photoRue', LARGEUR_RUE, 540, p => construireRue(p, 0, { jour: true, ici }), { zoom: 0.5, bande: 960 }), nom: 'La rue entière, de jour (de la Confrérie à l\'arche du marché)' })));
  await ajouter('rue', 'La rue', "La rue du shop qu'on parcourt à pied : les voisins, l'impasse, la forge, la banque, l'arche du marché, et la rue entière.", rue, true);

  // L'enseigne : quatre planches (une par niveau de la maison), sept fonds, cinq écritures
  const enseigne = [], NOMS_ENSEIGNE = ['la planche brute', 'le panneau encadré', 'le panneau peint', "l'enseigne de maître"], nomShop = G.nomShop || NOM_SHOP_DEFAUT;
  const posee = (n, police, couleur) => { const [W, H] = ENSEIGNE.tailles[n], l = W * 2 + 8, h = 26 + (H + (n === 3 ? 8 : 0)) * 2;
    return photo(scene, `photoEnseigne_${n}_${police}_${couleur}`, l, h, p => poserEnseigne(p, l / 2, 0, n, nomShop, { police, couleur })); };
  for (let n = 0; n <= 3; n++) enseigne.push(sur(() => ({ cle: posee(n, 0, 'naturel'), nom: `Enseigne · ${NOMS_ENSEIGNE[n]}` })));
  ENSEIGNE.polices.forEach(([, , nom], i) => { if (i) enseigne.push(sur(() => ({ cle: posee(2, i, 'naturel'), nom: `Écriture · ${nom}` }))); });
  for (const c of ENSEIGNE.couleurs) if (c.c) enseigne.push(sur(() => ({ cle: posee(2, 0, c.cle), nom: `Fond · ${c.nom}` })));
  for (let n = 0; n <= 3; n++) enseigne.push(sur(() => ({ cle: texEnseigne(scene, n), nom: `La planche seule · ${NOMS_ENSEIGNE[n]}` })));
  await ajouter('enseigne', "L'enseigne", "L'enseigne du comptoir s'améliore avec la maison ; au bureau, on choisit son écriture (cinq polices) et la couleur du fond.", enseigne);

  // La boutique du rival (le paon), et ce qu'elle devient
  const rival = [sur(() => ({ cle: creerFacadeRivalHD(scene, 1), nom: `${RIVAL.boutique}, la boutique du paon` })), sur(() => ({ cle: creerFacadeRivalHD(scene, 2), nom: `${RIVAL.boutique}, quand il s'enrichit` })),
    sur(() => ({ cle: creerFacadeRivalHD(scene, 1, ORPHELINAT.facade), nom: "L'orphelinat (la même maison, repeinte)" })),
    sur(() => ({ cle: photo(scene, 'photoRival', 400, 356, p => dessinerFacadeRival(p, 200, 352, 1, RIVAL.boutique)), nom: `${RIVAL.boutique}, son enseigne et l'emblème du Conseil` })),
    sur(() => ({ cle: corpsHD(scene, 'rivalA'), nom: `${RIVAL.nom}, le paon` }))];
  await ajouter('rival', 'La boutique du rival', "La maison de maître du paon, juste à côté : pierre blanche, bleu du Conseil, colonnes et fronton ; puis l'orphelinat quand on la rachète.", rival, true);

  // Le petit bar
  const STYLES_BAR = { taverne: 'la taverne', auberge: "l'auberge", brasserie: 'la brasserie' }, bar = [];
  for (const [st, nom] of Object.entries(STYLES_BAR)) bar.push(sur(() => ({ cle: photo(scene, 'photoBar_' + st, 960, 540, p => salleBar(p, st)), nom: `La salle du petit bar · ${nom}` })));
  for (const [st, nom] of Object.entries(STYLES_BAR)) bar.push(sur(() => ({ cle: creerFacadeRivalHD(scene, st === 'brasserie' ? 2 : 1, BAR.facades[st]), nom: `La façade du bar · ${nom}` })));
  for (const e of Object.values(BAR.equipe)) bar.push(sur(() => ({ cle: corpsHD(scene, e.quoi), nom: `${e.nom}, ${e.titre}` })));
  await ajouter('bar', 'Le petit bar', "La maison d'à côté devenue un bar : la salle dans ses trois styles (le mur, le sol, la cuisine, l'étagère à bouteilles, le comptoir), ses façades et son équipe.", bar, true);

  // Le barbier
  const barbier = [];
  for (const m of ['argent', 'or', 'fer']) barbier.push(sur(() => ({ cle: anneauBarbeHD(scene, m), nom: `Anneau de barbe · ${m}` })));
  sur(() => { boutiqueBarbierHD(scene); boutiqueFermeeHD(scene); poteauBarbierHD(scene, 0); poteauBarbierHD(scene, 1); enseigneBarbierHD(scene); salonBarbierHD(scene); solBarbierHD(scene);
    fauteuilBarbierHD(scene); tabouretBarbierHD(scene); ciseauxHD(scene, true); ciseauxHD(scene, false); capeBarbierHD(scene); capeBarbierHD(scene, true); rasoirHD(scene); miroirMainHD(scene); mousseHD(scene); });
  const meche = sur(() => mecheHD(scene, APPARENCE.cheveux[0][1]));
  barbier.unshift(...liste({ boutiqueBarbierHD: "La boutique d'Orvin", boutiqueBarbierFermeeHD: "La boutique d'Orvin, fermée (les planches clouées)", poteauBarbierHD0: 'Le poteau du barbier (1)', poteauBarbierHD1: 'Le poteau du barbier (2)',
    enseigneBarbierHD: "L'enseigne du barbier", salonBarbierHD: 'Le salon', solBarbierHD: 'Le sol du salon', fauteuilBarbierHD: 'Le fauteuil', tabouretBarbierHD: 'Le tabouret',
    ciseauxHDO: 'Les ciseaux, ouverts', ciseauxHDF: 'Les ciseaux, fermés', capeBarbierHD: 'La cape', capeBarbierHDF: 'La cape, de face (dans le miroir)', rasoirBarbierHD: 'Le rasoir',
    miroirMainHD: 'Le miroir à main', mousseBarbierHD: 'La mousse à raser', [meche]: 'Une mèche coupée' }), sur(() => ({ cle: corpsHD(scene, 'barbier'), nom: FIGURANTS.barbier.nom + ', le barbier' })));
  await ajouter('barbier', 'Le barbier', "La boutique et le salon d'Orvin Tresse-d'Argent, ses outils, et les anneaux de barbe des fêtes.", barbier);

  // La Confrérie
  sur(() => creerConfrerieHD(scene));
  const confrerie = liste({ terrainConfrerie: 'Le terrain vague, avant les travaux', rueHospiceHD: "L'hospice de la Confrérie", rueChapelleHD: 'La chapelle du Rempart, le soir', rueChapelleHD_jour: 'La chapelle du Rempart, de jour' });
  SOLDATS_ESCOUADE.forEach(([, nom], i) => confrerie.push(sur(() => ({ cle: corpsHD(scene, 'soldat' + i), nom: `${nom}, de l'escouade` }))));
  await ajouter('confrerie', 'La Confrérie', "La chapelle du Rempart et l'hospice qui se bâtissent au bout de la rue, et les six soldats de l'escouade.", confrerie, true);

  // Le mécénat : ce que le monde montre de tes dons (on prête au joueur tous les paliers, le temps des photos)
  const mecenat = [], avantM = G.mecenat, avantC = G.confrerie;
  G.mecenat = { donne: 30000, conseil: 30000, bannis: 0, paliers: MECENAT.lumiere.map(p => p.id) };
  G.confrerie = { bati: Object.fromEntries(CONFRERIE.projets.map(p => [p.id, true])), chantier: null };
  mecenat.push(sur(() => ({ cle: photo(scene, 'photoRueMecenat', LARGEUR_RUE, 540, p => { construireRue(p, 0, { jour: true, ici }); rueDuMecenat(p, 0, 470, G); }, { zoom: 0.5, bande: 960 }), nom: 'La rue parée de tes dons (fanions, bannières, vitrail, fleurs)' })));
  mecenat.push(sur(() => ({ cle: photo(scene, 'photoPlaqueMecenes', 960, 540, p => plaqueDesMecenes(p)), nom: 'La plaque des mécènes, près de la fontaine' })));
  mecenat.push(sur(() => ({ cle: photo(scene, 'photoVitrail', 960, 540, p => vitrailDuMecene(p)), nom: 'Ton vitrail, à la chapelle du Rempart' })));
  G.mecenat = avantM; G.confrerie = avantC;
  await ajouter('mecenat', 'Le mécénat', 'Ce que le monde montre de tes dons au Rempart : la rue parée, la plaque des mécènes, ton vitrail.', mecenat, true);

  // Le repaire sous le comptoir
  sur(() => { creerRepaireHD(scene); textureGamin(scene); });
  await ajouter('repaire', 'Le repaire', "La cave de contrebande sous l'arrière-boutique, sa trappe et son tapis roulé, Fil-de-Fer le gamin des rues ; et la cave du marché noir, sur le même modèle.", liste({
    caveRepaire: 'La cave du repaire, sous le comptoir', trappeOuverte: 'La trappe ouverte dans le plancher', tapisRoule: 'Le tapis roulé', gamin: 'Fil-de-Fer, le gamin des rues',
    caveFond: 'La cave du marché noir (ses trois coins)', tableMainNoire: 'La table de la Main Noire', caissesContrebande: 'Les caisses de contrebande', feuCamp: 'Le feu de la cave' }), true);

  // La grand-place du marché (son sol, avec le plan que pose la scène), et les palettes des régions
  const place = [];
  const pads = Object.entries(LIEUX_PLACE).filter(([k]) => !['fontaine', 'arche', 'moulin', 'carte'].includes(k)).map(([k, [x, y]]) => PETITS_LIEUX.includes(k) ? [x / 2, y / 2 - 6, 44, 18] : [x / 2, y / 2 - 12, 104, 34]);
  pads.push([530, 500, 40, 20]);
  const plan = { centre: [450, 318], rTerre: 150, rDalles: 104, pads, chemins: [...pads.map(([x, y]) => [[450, 318], [x, y]]), [[450, 318], [450, 520], 12], [[450, 318], [900, 382], 8], [[0, 92], [900, 92], 11]], largeur: 8, pas: [[450, 432], [452, 452], [448, 472], [451, 492]] };
  place.push(sur(() => ({ cle: solPlaceHD(scene, 'solPlace_semailles', paletteSaisonComte('semailles'), 900, 520, plan), nom: 'Le sol de la grand-place (au printemps)' })));   // (une saison sur quatre : chacune prend près d'une seconde)
  for (const pal of Object.values(PALETTES_REGIONS)) {
    for (const v of [0, 1]) place.push(sur(() => ({ cle: arbrePlaceHD(scene, pal, v), nom: `Arbre (${v + 1}) · ${pal.nom}` })));
    place.push(sur(() => ({ cle: buissonPlaceHD(scene, pal), nom: `Buisson · ${pal.nom}` })));
  }
  place.push(sur(() => ({ cle: barrierePlaceHD(scene, 5), nom: 'La barrière' })), sur(() => ({ cle: barrierePlaceHD(scene, 2), nom: 'La barrière courte' })),
    sur(() => ({ cle: ombrePlaceHD(scene), nom: "L'ombre au sol" })), sur(() => ({ cle: planchetteHD(scene, 60, 22), nom: 'La planchette des lieux' })));
  await ajouter('place', 'La grand-place du marché', "La place, à la Stardew : herbe, terre battue sous les étals et sur les chemins, dalles au centre ; ses arbres et ses buissons dans les couleurs de chaque région.", place, true);

  // La nymphe des fontaines
  await ajouter('nymphe', 'La nymphe', "La nymphe des fontaines, en cinq états : de l'eau qui jaillit à une femme presque humaine, dont le bas de la robe reste de l'eau.",
    (sur(() => creerNympheHD(scene)), liste({ nymphe_0: 'Le jet d’eau', nymphe_1: 'La colonne prend une tête et deux yeux', nymphe_2: "Une silhouette d'eau, couronne et joyau au cœur", nymphe_3: 'Elle lève son sceptre de cristal', nymphe_4: 'Presque humaine, un diadème d’or' })));

  // Les chats
  sur(() => { creerChatRueHD(scene); creerCoinChatsHD(scene); });
  const POSES_CHAT = { m0: 'il marche (1)', m1: 'il marche (2)', m2: 'il marche (3)', m3: 'il marche (4)', assis0: 'assis', assis1: 'assis, la queue qui bat', tapi: 'tapi, il guette', bond: 'le bond du chasseur', dort0: 'endormi en boule', dort1: 'endormi, il respire' };
  const chats = Object.entries(POSES_CHAT).map(([k, nom]) => ({ cle: 'chatRue_' + k, nom: `Le chat de gouttière · ${nom}` }));
  chats.push(...liste({ souris_0: "La souris qu'il guette (1)", souris_1: "La souris qu'il guette (2)", bancRue: 'Le banc de la rue, où il aime s’asseoir' }));
  for (const [p, d] of Object.entries(PELAGES_CHAT)) chats.push(sur(() => ({ cle: creerChatHD(scene, { pelage: p, yeux: 'or', collier: 'aucun' }) + '_assis0', nom: `Pelage · ${d.nom}` })));
  for (const [y, d] of Object.entries(YEUX_CHAT)) if (y !== 'or') chats.push(sur(() => ({ cle: creerChatHD(scene, { pelage: 'noir', yeux: y, collier: 'aucun' }) + '_assis0', nom: `Yeux · ${d.nom}` })));
  for (const [c, d] of Object.entries(COLLIERS_CHAT)) if (c !== 'aucun') chats.push(sur(() => ({ cle: creerChatHD(scene, { pelage: 'roux', yeux: 'vert', collier: c }) + '_assis0', nom: d.nom })));
  chats.push(sur(() => ({ cle: creerChatHD(scene, lookCompagne(G)) + '_dort0', nom: 'Sa compagne, endormie' })));
  chats.push(sur(() => ({ cle: textureChatDebout(scene, lookChat(G)), nom: 'Ton chat, debout, le cigare à la patte (son secret)' })));
  chats.push(...liste({ panierDoubleHD: COIN_CHATS.panier.nom, arbreChatHD: COIN_CHATS.arbre.nom, cabaneChatHD: COIN_CHATS.cabane.nom, coussinBrodeHD: COIN_CHATS.coussin.nom, peloteHD: COIN_CHATS.pelote.nom }));
  chats.push(sur(() => ({ cle: photo(scene, 'photoCoinChats', 440, 240, p => dessinerCoinChats(p, 70, 200, { elements: Object.keys(COIN_CHATS) })), nom: 'Le coin des chats, tout aménagé' })));
  await ajouter('chats', 'Les chats', "Le chat de gouttière sous toutes ses poses, les pelages, les yeux et les colliers qu'on choisit, sa compagne, son secret, et le coin des chats.", chats);

  // Les chapeaux du chat
  const chapeaux = [];
  for (const [k, c] of Object.entries(CHAPEAUX_CHAT)) {
    chapeaux.push(sur(() => ({ cle: textureChapeauSeul(scene, k), nom: c.nom })));
    if (!c.refuse && !c.pourElle) chapeaux.push(sur(() => ({ cle: textureChatDebout(scene, lookChat(G), { chapeau: k }), nom: `${c.nom}, sur sa tête` })));
  }
  await ajouter('chapeaux', 'Les chapeaux du chat', "Quatre au rayon de Marcelline, les autres de par le monde (portés, perdus, cachés, rapportés de mission) ; la couronne est pour elle, et le chapeau pointu, il ne le portera jamais.", chapeaux);

  // Le Parrain
  sur(() => creerParrainHD(scene));
  const parrain = [sur(() => ({ cle: textureChatDebout(scene, lookChat(G), { tenue: 'parrain' }), nom: 'Le Parrain, en costume trois pièces' })),
    sur(() => ({ cle: textureChatDebout(scene, lookChat(G), { tenue: 'parrain', assis: true, caresse: true }), nom: 'Le Parrain, assis, il caresse la souris' })),
    ...liste({ fauteuilParrainHD: 'Le grand fauteuil de cuir à oreilles', tabouretHautHD: "Le haut tabouret (pour monter à hauteur d'homme)", gantNoirHD: 'Le gant noir (la Main Noire, c’est lui)',
      robeTombeeHD: 'La robe noire, tombée en tas', sourisBlancheHD: 'La souris blanche', porteManteauChatHD: 'Le porte-manteau du coin des chats' }),
    sur(() => ({ cle: textureChapeauSeul(scene, 'borsalino'), nom: CHAPEAUX_CHAT.borsalino.nom })), sur(() => ({ cle: textureCanne(scene, 'parrain'), nom: 'La canne du Parrain' }))];
  await ajouter('parrain', 'Le Parrain', 'La révélation : ton chat est le Parrain de la Main Noire. Son costume, son fauteuil, son haut tabouret, le gant noir, la robe tombée.', parrain);

  // Le Vieux Moulin
  sur(() => { creerMoulinHD(scene); creerFumeeHD(scene); });
  const moulin = liste({ moulinHD: 'Le moulin', roueMoulinHD: 'La roue à aubes', pontMoulinHD: 'Le pont de planches', pontMoulinHD_casse: 'Le pont, à la planche pourrie', roseauxHD_0: 'Les roseaux (1)', roseauxHD_1: 'Les roseaux (2)',
    pontonHD: "Le ponton de l'étang", barqueHD: 'La barque amarrée', renardHD: 'Le renard', renardHD_pas: 'Le renard, au pas', renardHD_infecte: "Le renard gagné par l'Engeance", renardHD_infecte_pas: "Le renard de l'Engeance, au pas",
    fumeeHD_0: 'Une bouffée de fumée (1)', fumeeHD_1: 'Une bouffée de fumée (2)', fumeeHD_2: 'Une bouffée de fumée (3)' });
  const VUES_MOULIN = [['sentier', 0, 'le sentier et ses roseaux'], ['ruisseau', 620, 'le ruisseau et le pont de planches'], ['moulin', 1360, 'le moulin et sa roue, sur le bief'], ['etang', LARGEUR_MOULIN - 960, "l'étang et son ponton"]];
  sur(() => photo(scene, 'photoMoulin_sentier', 960, 540, p => construireMoulin(p), { zoom: 0.5, vues: VUES_MOULIN.map(([k, x]) => ['photoMoulin_' + k, x]) }));
  for (const [k, , nom] of VUES_MOULIN) moulin.push({ cle: 'photoMoulin_' + k, nom: `Le Vieux Moulin, la nuit : ${nom}` });
  moulin.push(sur(() => ({ cle: photo(scene, 'photoMoulinAube', 960, 540, p => construireMoulin(p, { aube: true }), { zoom: 0.5, x: LARGEUR_MOULIN - 960 }), nom: "L'étang au lever du soleil (la fin de l'aventure)" })));
  await ajouter('moulin', 'Le Vieux Moulin', "Le décor de la quête du chat amoureux, qu'on parcourt à pied : le sentier et ses roseaux, le pont de planches, le moulin et sa roue, l'étang ; le renard, et la fumée des cigares.", moulin, true);

  // La pêche
  const peche = Object.keys(POISSONS).map(id => sur(() => ({ cle: texturePoisson(scene, id), nom: POISSONS[id].nom })));
  peche.push(sur(() => ({ cle: texturePoisson(scene, 'legende'), nom: `${LEGENDE_ETANG.nom}, la légende de l'étang` })));
  for (const id of Object.keys(PRISES_ETRANGES)) peche.push(sur(() => ({ cle: texturePrise(scene, id), nom: PRISES_ETRANGES[id].nom })));
  for (const c of CANNES_PEUPLES) peche.push(sur(() => ({ cle: textureCanne(scene, c.id), nom: `${c.nom} (${c.qui})` })));
  peche.push(sur(() => ({ cle: textureBouchon(scene), nom: 'Le bouchon' })), sur(() => ({ cle: cabanePecheurHD(scene), nom: 'La cabane du pêcheur' })),
    sur(() => ({ cle: corpsHD(scene, PECHEUR_COMTE), nom: `${PECHEUR_COMTE.nom}, le pêcheur` })), sur(() => ({ cle: joueurPecheur(scene), nom: 'JeuneGoy, sa canne à la main' })));
  for (const k of [0, 1]) peche.push(sur(() => ({ cle: textureChatDanse(scene, lookChat(G), k), nom: `Ton chat qui danse, le poisson levé (${k + 1})` })));
  peche.push(sur(() => ({ cle: photo(scene, 'photoCabanePecheur', 380, 270, p => poserCabanePecheur(p, 190)), nom: 'La cabane de Barnabé, au bout du marché' })));
  peche.push(sur(() => ({ cle: photo(scene, 'photoEtangJour', 960, 540, p => construireMoulin(p, { jour: true }), { zoom: 0.5, x: LARGEUR_MOULIN - 960 }), nom: "L'étang du Moulin, de jour (le coin de pêche)" })));
  await ajouter('peche', 'La pêche', "Les poissons de l'étang et leur légende, les prises étranges, les cannes de chaque peuple, la cabane de Barnabé et le chat qui danse.", peche, true);

  // La maison sur pattes et les Mages-Charpentiers
  const pattes = [], POSES_PATTE = { debout: 'debout', pas: 'en marche', accroupie: 'accroupie', repliee: 'repliée' };
  for (const s of PATTES.ordre) for (const [pose, nom] of Object.entries(POSES_PATTE)) pattes.push(sur(() => ({ cle: patteMaisonHD(scene, pose, s), nom: `${PATTES.sortes[s].nom} · ${nom}` })));
  pattes.push(sur(() => ({ cle: dessousMaisonHD(scene), nom: 'Le dessous de la maison soulevée' })));
  for (const s of PATTES.ordre) pattes.push(sur(() => ({ cle: attachesMaisonHD(scene, s), nom: `Les attaches · ${PATTES.sortes[s].nom}` })));
  pattes.push(sur(() => ({ cle: fagotHD(scene), nom: COMBUSTIBLES.fagot.nom })), sur(() => ({ cle: planchesRecupHD(scene), nom: COMBUSTIBLES.planche.nom })), sur(() => ({ cle: bucheCheneHD(scene), nom: COMBUSTIBLES.buche.nom })),
    sur(() => ({ cle: sacCharbonHD(scene), nom: COMBUSTIBLES.charbon.nom })), sur(() => ({ cle: bucheRuniqueHD(scene), nom: COMBUSTIBLES.runique.nom })));
  [[0, 'vide'], [6, 'à moitié'], [12, 'plein']].forEach(([n, nom]) => pattes.push(sur(() => ({ cle: filetBoisHD(scene, n), nom: `Le filet à bois · ${nom}` }))));
  [[0.1, 'presque éteint'], [0.5, 'à moitié'], [1, 'au plus fort']].forEach(([n, nom]) => pattes.push(sur(() => ({ cle: jaugeFeuHD(scene, n), nom: `Le cadran du feu · ${nom}` }))));
  pattes.push(sur(() => ({ cle: chantierMagesHD(scene), nom: 'Le chantier des Mages-Charpentiers' })), sur(() => ({ cle: atelierMagesHD(scene), nom: "L'atelier des Mages-Charpentiers" })),
    sur(() => ({ cle: corpsHD(scene, NAIN), nom: `${NAIN.nom} (nain)` })), sur(() => ({ cle: corpsHD(scene, MAGE), nom: MAGE.nom })));
  for (const s of ['chene', 'runique']) pattes.push(sur(() => ({ cle: photo(scene, 'photoPattes_' + s, 960, 540, p => { decorFacade(p); pattesRepliees(p, dessinerFacade(p, 560, 440, G.nomShop), { sorte: s, sol: 440 }); }),
    nom: `Ta façade, ses ${PATTES.sortes[s].nom.toLowerCase()} repliées` })));
  await ajouter('pattes', 'La maison sur pattes', "Les pattes (chêne, ferrées, runiques) sous toutes leurs poses, le dessous de la maison et ses attaches, le bois qu'elle mange, le filet, le cadran du feu ; le chantier et l'atelier des Mages-Charpentiers.", pattes, true);

  // Le grand voyage : la maison qui marche sur la route
  const voyage = [sur(() => ({ cle: photo(scene, 'photoRouteMarche', 960, 540, p => { decorRoute(p, 0); maisonEnRoute(p, 480, 470, { pose: 'marche' }); }), nom: 'Sur la route : la maison marche' })),
    sur(() => ({ cle: photo(scene, 'photoRouteSoir', 960, 540, p => { decorRoute(p, 0.6); maisonEnRoute(p, 480, 470, { pose: 'assise', fumee: 'maigre', filet: 4 }); }), nom: "Le soir : elle s'accroupit au bord du chemin" }))];
  // (v1.58, planche 77 validée) le décor de la route refait : le gué, la Porte des Hommes dans son mur, la tête de pont, les vergers, les imprévus
  const fondRoute = sur(() => paysageHD(scene, 960, 650, 'comte', 0, { sansAstre: true }));
  const SAISONS_NOM = { printemps: 'au printemps', ete: 'en été', automne: 'en automne', hiver: 'en hiver' };
  voyage.push(sur(() => ({ cle: textureGueHD(scene, 470, fondRoute), nom: 'Le gué : la rivière qui coupe la route, ses berges et son lit de galets' })),
    sur(() => ({ cle: textureGueHD(scene, 470, fondRoute, RUISSEAU), nom: 'Le ruisseau du petit pont' })),
    sur(() => ({ cle: porteFrontiereHD(scene, 470, fondRoute), nom: 'La Porte des Hommes, dans le mur de la frontière (en coupe : le passage sous la voûte)' })),
    sur(() => ({ cle: teteDePontHD(scene, 470), nom: 'La tour de la tête de pont, sur la haute rive' })),
    ...[6, 12, 18].map(g => sur(() => ({ cle: villageRoyaumeHD(scene, g), nom: 'Un village du Royaume des Hommes, sur les collines' }))),
    sur(() => ({ cle: borneRoyaumeHD(scene), nom: 'La borne aux couleurs du roi' })), sur(() => ({ cle: borneComteHD(scene), nom: 'La borne de la Comté' })),
    sur(() => ({ cle: vergerHD(scene, 'panier'), nom: 'Un panier de pommes, au pied des pommiers' })), sur(() => ({ cle: vergerHD(scene, 'echelle'), nom: "L'échelle contre le tronc" })),
    sur(() => ({ cle: isbaPoulesHD(scene, 0), nom: 'La cabane à pattes de poule du marchand nomade (pas 1)' })), sur(() => ({ cle: isbaPoulesHD(scene, 1), nom: 'La cabane à pattes de poule (pas 2)' })),
    sur(() => ({ cle: epeeCasseeHD(scene), nom: "L'épée cassée du héros blessé" })),
    ...Object.keys(SAISONS_NOM).map(sa => sur(() => ({ cle: arbreRiveHD(scene, sa, 'aulne', 1), nom: `Un aulne de la rive, ${SAISONS_NOM[sa]}` }))),
    sur(() => ({ cle: arbreRiveHD(scene, 'ete', 'buisson', 2), nom: 'Un buisson de la rive' })));
  await ajouter('voyage', 'Le grand voyage', 'La maison sur ses quatre pattes, sur la route de Pont-Royal : elle marche pas à pas, et le soir elle se pose au bord du chemin. Et le décor de la route (planche 77) : le gué, la Porte des Hommes dans son mur, la tête de pont, les villages et les bornes, les vergers, la cabane à pattes de poule, les arbres des rives.', voyage, true);

  // Pont-Royal
  const pont = liste({ pontRoyalHD: 'Pont-Royal vu du fleuve (le lot vide attend ta maison)', pontRoyalHD_plein: 'Pont-Royal vu du fleuve', rueDuPontHD: 'La rue du pont : le tonnelier, ton lot, la maison rose, la Halle des Bateliers' });
  sur(() => { pontRoyalHD(scene); pontRoyalHD(scene, { lot: false }); rueDuPontHD(scene); });
  for (const id of ORDRE_STYLES_PONT_ROYAL) pont.push(sur(() => ({ cle: maisonStylePR(scene, id), nom: `${STYLES_PONT_ROYAL[id].nom} (chez l'architecte)` })));
  pont.push(sur(() => ({ cle: bargeHD(scene), nom: 'Une barge du fleuve' })), sur(() => ({ cle: photo(scene, 'photoBarge', 300, 176, p => poserBarge(p, 150, 110, 2)), nom: 'La barge, son batelier et son reflet' })),
    sur(() => ({ cle: bouclierPontHD(scene), nom: 'Le bouclier de la garde' })), sur(() => ({ cle: photo(scene, 'photoGardePont', 150, 216, p => gardePont(p, 75, 212)), nom: 'Un garde du pont, sa lance et son bouclier' })),
    sur(() => ({ cle: corpsHD(scene, 'duc'), nom: FIGURANTS.duc.nom })), sur(() => ({ cle: corpsHD(scene, 'gardeRoyal'), nom: FIGURANTS.gardeRoyal.nom })));
  await ajouter('pontRoyal', 'Pont-Royal', "La ville du Royaume des Hommes bâtie sur le grand pont du fleuve : le pont à cinq arches et sa haute rive, la rue du pont et la Halle des Bateliers, les quatre styles de maison, les barges, la garde et le duc.", pont, true);

  // La menace sur la carte : le patch de la carte (menaceHD) pose ses dessins sur le parchemin, autour du médaillon de la contrée
  // (on prête à la partie une contrée menacée, puis une contrée perdue, le temps des photos)
  const menace = [], avantMenace = G.menace;
  const carteMenace = (cle, M, zone, l, h, dx, dy) => photo(scene, cle, l, h, p => {
    G.menace = M; p.G = G; p.etiquettes = []; p.monde = p.add.container(0, 0); p.dessus = p.add.container(0, 0).setVisible(false); p.bulle = p.add.container(0, 0);
    creerCarteHD(p); creerVignettesZonesHD(p); creerNuagesCarteHD(p); creerHalo(p);
    p.monde.add(p.add.image(0, 0, 'carteHD').setOrigin(0).setScale(2));
    CarteScene.prototype.dessinerZones.call(p);
  }, { x: ZONES[zone].x - dx, y: ZONES[zone].y - dy });
  menace.push(sur(() => ({ cle: carteMenace('photoMenace', { actives: [{ zone: 'collines', annonce: G.jour, bataille: G.jour + MENACE.delai, assaut: 58 }], perdues: {}, tenues: 0, tombees: 0 }, 'collines', 620, 250, 190, 120),
    nom: `${ZONES.collines.nom}, menacée : le halo qui bat, la fumée, l'armée qui vient de l'est, les yeux dans la brume` })));
  menace.push(sur(() => ({ cle: carteMenace('photoPerdue', { actives: [], perdues: { vergers: { depuis: G.jour, points: 0, sans: true, avant: 0, repriseDes: G.jour + 99, reprise: 0 } }, tenues: 0, tombees: 1 }, 'vergers', 300, 220, 150, 110),
    nom: `${ZONES.vergers.nom}, perdue : éteinte, le camp des pillards` })));
  G.menace = avantMenace;
  await ajouter('menace', 'La menace', "Sur la carte : la contrée qui rougit avant la bataille (halo, fumée, l'armée de l'est, des yeux violets dans la brume), et la contrée perdue, éteinte, avec le camp des pillards.", menace, true);

  // Le Carrefour
  const H = CARREFOUR_HD, carrefour = [sur(() => ({ cle: H.decor(scene), nom: 'Le Carrefour : le chemin entre le jour et la nuit' })), sur(() => ({ cle: H.poteau(scene), nom: 'Le poteau indicateur' })), sur(() => ({ cle: H.borne(scene), nom: 'La borne de pierre' }))];
  for (const camp of ['bien', 'mal']) carrefour.push(sur(() => ({ cle: H.vitrail(scene, 'cf_vit_' + camp, 120, 158, OFFRES_SERMENT[camp].verres, OFFRES_SERMENT[camp].contour), nom: camp === 'bien' ? 'Le vitrail de la lumière' : "Le vitrail de l'ombre" })));
  await ajouter('carrefour', 'Le Carrefour', 'Le grand décor du serment, peint en pixel art : le chemin qui se sépare entre le jour (la Citadelle) et la nuit (la Grande Muraille), le poteau, la borne, les deux vitraux.', carrefour, true);

  // Les oiseaux messagers
  sur(() => creerOiseauxMessagers(scene));
  await ajouter('oiseaux', 'Les oiseaux messagers', "Le pigeon et le corbeau (posés, ailes hautes, ailes basses), et l'aigle du Conseil.", liste({ pigeonPose: 'Le pigeon, posé', pigeonVolH: 'Le pigeon, ailes hautes', pigeonVolB: 'Le pigeon, ailes basses',
    corbeauPose: 'Le corbeau, posé', corbeauVolH: 'Le corbeau, ailes hautes', corbeauVolB: 'Le corbeau, ailes basses', aigleVolH: "L'aigle du Conseil, ailes hautes", aigleVolM: "L'aigle du Conseil, ailes au milieu",
    aigleVolB: "L'aigle du Conseil, ailes basses", aiglePose: "L'aigle du Conseil, posé" }));

  // Les épreuves des récits, et les reliques de la Faucheuse
  sur(() => { creerRecitEpreuvesHD(scene); creerReliquesFaucheuseHD(scene); });
  const epreuves = liste({ loupHD_pas: 'Le loup qui marche', loupHD_bond: 'Le loup qui bondit', loupHD_hurle: 'Le loup qui hurle', sanglierHD_pas: 'Le sanglier qui charge', chauveSourisHD0: 'La chauve-souris, ailes hautes',
    chauveSourisHD1: 'La chauve-souris, ailes basses', serpentHD0: 'Le serpent (1)', serpentHD1: 'Le serpent (2)', araignetteHD: 'La petite araignée, au bout de son fil', panneauRouteHD: 'Le panneau de la route',
    borneHD: 'La borne du chemin', tenteHD: 'La tente du campement', buissonHD: 'Le buisson épais', troncHD: 'Le tronc en travers du chemin', arcHD: "L'arc", flecheHD: 'La flèche',
    coffreRecitHD0: 'Le coffre au trésor, fermé', coffreRecitHD1: 'Le coffre au trésor, ouvert', paillasseHD: 'La paillasse des blessés', palmierHD: "Le palmier de l'oasis", arbreRecitHD: 'Un arbre feuillu',
    arbreMortHD: 'Un arbre mort', lumiereHD: 'La lumière qui perce le noir', tombeHD: 'La pierre tombale', golemHD: 'Le golem gardien', pierreLeveeHD: 'La pierre levée', autelHD: "L'autel de l'objet maudit",
    sarcophageHD: 'Le sarcophage dressé', cactusHD: 'Le cactus', troneHD: 'Le trône', montagneHD: 'La montagne enneigée (avalanche)' });
  for (const r of RELIQUES_FAUCHEUSE) epreuves.push({ cle: 'relique_' + r.id, nom: `${r.nom} (relique de la Faucheuse)` });
  await ajouter('epreuves', 'Les épreuves des récits', "Les images qui font de chaque épreuve une petite scène (le loup qui marche, bondit et hurle, le serpent, le coffre piégé...), et les souvenirs que laisse la Faucheuse.", epreuves);

  // Les repères au loin et les arbres de chaque destination
  const reperes = [], ARBRES_NOMS = { ronds: 'Les arbres ronds', pommiers: 'Les pommiers', saules: 'Les saules', cypres: 'Les cyprès', chenes: 'Les chênes', sapins: 'Les sapins', sapinsNeige: 'Les sapins enneigés',
    mallorns: 'Les mallorns', automne: "Les arbres d'automne", cactus: 'Les cactus', colonnes: 'Les colonnes brisées', pieux: 'Les pieux' };
  for (const [z, v] of Object.entries(VARIANTES_RECIT)) if (v.repere) reperes.push(sur(() => ({ cle: textureRepere(scene, v.repere), nom: `Repère · ${ZONES[z] ? ZONES[z].nom : joli(z)}` })));
  for (const [f, nom] of Object.entries(ARBRES_NOMS)) reperes.push(sur(() => ({ cle: textureArbre(scene, f), nom })));
  await ajouter('reperes', 'Les repères et les arbres', 'Ce qu’on voit au loin dans les récits, peint en pixel art (moulin, clocher, porte naine, Lothlórien, Fondcombe, Opale, la Bibliothèque, la pyramide...), et les arbres de chaque destination.', reperes, true);

  // Les variantes : chaque destination a son décor (comme le pose le récit : le paysage du royaume, puis la variante)
  const variantes = [];
  for (const z of Object.keys(VARIANTES_RECIT)) {
    const biome = ZONES[z] ? ZONES[z].biome : 'comte';
    variantes.push(sur(() => ({ cle: photo(scene, 'photoVariante_' + z, 960, 370, p => { const g = p.add.graphics(); dessinerComte(g, 0, 0, 960, 370, 0, biome); g.setDepth(-2); if (g.paysage) g.paysage.setDepth(-2);
      p.planMoyen = p.add.container(0, 0).setDepth(-0.5); p.premierPlan = p.add.container(0, 0).setDepth(6.5); planterVarianteRecit(p, z, biome); }, { zoom: 0.5 }), nom: ZONES[z] ? ZONES[z].nom : joli(z) })));
  }
  await ajouter('variantes', 'Les destinations des récits', 'Le ciel, le sol et les couleurs du royaume restent, mais chaque destination a ses arbres, son repère au loin, ses détails au premier plan et ses bêtes.', variantes, true);

  // L'ordre des onglets
  const ORDRE = ['personnages', 'poses', 'coiffures', 'portraits', 'objets', 'armure', 'icones', 'pierres', 'mobilier', 'luxe', 'interieur', 'lieux', 'saisons', 'meteo', 'quotidien', 'cambrioleur',
    'rue', 'enseigne', 'rival', 'bar', 'barbier', 'confrerie', 'mecenat', 'repaire', 'ville', 'place', 'nymphe', 'chats', 'chapeaux', 'parrain', 'moulin', 'peche', 'pattes', 'voyage', 'pontRoyal',
    'carte', 'menace', 'carrefour', 'emblemes', 'oiseaux', 'recits', 'epreuves', 'reperes', 'variantes', 'bivouac', 'baluchons'];
  const rang = c => (ORDRE.includes(c.id) ? ORDRE.indexOf(c.id) : ORDRE.length);
  return cats.filter(c => c.items.length).sort((a, b) => rang(a) - rang(b));
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

// Le moteur du jeu, tout petit et caché : il ne sert qu'à peindre. (En WebGL, comme le jeu : les photos des décors
// gardent leurs teintes, la nuit, les lueurs ; sans WebGL, Phaser repasse en canvas.)
new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'moteur',
  width: 16,
  height: 16,
  banner: false,
  audio: { noAudio: true },
  scene: {
    create() {
      const scene = this;
      setTimeout(async () => {
        try { nouvellePartie({}); } catch (e) { console.warn(e); }
        try { creerToutesLesTextures(scene); } catch (e) { console.warn(e); }
        construirePage(scene, await categories(scene));
      }, 30);
    },
  },
});
