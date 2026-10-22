// (v1.35) Les succès, façon Steam (la page du bureau viendra avec la planche 61) : une liste, ce que tu as débloqué et
// quand, et la vignette qui glisse en haut à droite quand tu en débloques un.
// (v1.50, planche 61 validée) Les 32 succès, en huit catégories et quatre médailles. Chacun a son icône (un objet du
// jeu frappé sur la médaille) ; `verifier` le reconnaît d'après l'état de la partie (sinon, un autre fichier le
// débloque au bon moment) ; `progres` donne [où tu en es, le but] pour la petite barre ; `cache` : un secret (« ??? »
// et un indice tant qu'on ne l'a pas).
const TIERS_SUCCES = { bronze: [0xb87333, 'Bronze'], argent: [0xc8d0d8, 'Argent'], or: [0xe8b830, 'Or'], secret: [0x9a6ad8, 'Secret'] };
const CATEGORIES_SUCCES = { comptoir: 'Le comptoir', aventuriers: 'Les aventuriers', ville: 'La ville', camps: 'Lumière et ombre', chat: 'Le chat', peche: 'La pêche', fetes: 'Les fêtes', vie: 'Ta vie' };
const servisSucces = G => (G.stats && G.stats.servis) || 0;
const SUCCES = {
  premierClient: { nom: 'Premier baluchon', texte: 'Remettre ton premier baluchon', cat: 'comptoir', palier: 'bronze', icone: 'ration', verifier: G => servisSucces(G) >= 1 },
  centClients: { nom: 'Cent baluchons', texte: 'Servir cent aventuriers', cat: 'comptoir', palier: 'argent', icone: 'gourde', verifier: G => servisSucces(G) >= 100, progres: G => [servisSucces(G), 100] },
  milleClients: { nom: 'Le comptoir de légende', texte: 'Servir mille aventuriers', cat: 'comptoir', palier: 'or', icone: 'amulette', verifier: G => servisSucces(G) >= 1000, progres: G => [servisSucces(G), 1000] },
  sansRefus: { nom: 'Jamais un refus', texte: 'Sept jours de suite sans refuser un client', cat: 'comptoir', palier: 'argent', icone: 'bandage', verifier: G => (G.serieSansRefus || 0) >= 7, progres: G => [G.serieSansRefus || 0, 7] },
  luxe: { nom: 'Le plus beau comptoir', texte: 'Rénover le comptoir jusqu\u2019au luxe', cat: 'comptoir', palier: 'or', icone: 'cape', verifier: G => typeof AMELIORATIONS !== 'undefined' && niveauAmelioration(G, 'comptoir') >= AMELIORATIONS.comptoir.niveaux.length - 1 },
  premierRetour: { nom: 'Ils reviennent !', texte: 'Un aventurier rentre et te raconte son aventure', cat: 'aventuriers', palier: 'bronze', icone: 'torche', verifier: G => ((G.stats && G.stats.retours) || 0) >= 1 },
  legende: { nom: 'Une légende est née', texte: 'Un de tes habitués devient une légende', cat: 'aventuriers', palier: 'or', icone: 'epee', verifier: G => (G.habitues || []).some(h => h.niveau === 'legende') },
  zeroMort: { nom: 'Personne ne meurt', texte: 'Trente jours sans perdre un aventurier', cat: 'aventuriers', palier: 'argent', icone: 'potion', verifier: G => servisSucces(G) >= 20 && joursSansPerte(G) >= 30, progres: G => [Math.min(30, joursSansPerte(G)), 30] },
  armure: { nom: 'L\u2019armure complète', texte: 'Réunir toutes les pièces de l\u2019armure', cat: 'aventuriers', palier: 'or', icone: 'bouclier', verifier: G => typeof ARMURE !== 'undefined' && (G.armure || []).length >= ARMURE.length, progres: G => [(G.armure || []).length, typeof ARMURE !== 'undefined' ? ARMURE.length : 1] },
  royaumes: { nom: 'Les royaumes libérés', texte: 'Libérer (ou conquérir) tous les royaumes de la carte', cat: 'aventuriers', palier: 'or', icone: 'arc', verifier: G => typeof ROYAUMES !== 'undefined' && Object.keys(ROYAUMES).every(r => royaumeLibere(G, r)), progres: G => [Object.keys(ROYAUMES).filter(r => royaumeLibere(G, r)).length, Object.keys(ROYAUMES).length] },
  fortune: { nom: 'La bourse pleine', texte: 'Avoir 10 000 pièces', cat: 'ville', palier: 'argent', icone: 'filOr', verifier: G => G.argent >= 10000, progres: G => [Math.max(0, Math.floor(G.argent)), 10000] },
  sansDette: { nom: 'Libre comme l\u2019air', texte: 'Rembourser un prêt jusqu\u2019au dernier sou', cat: 'ville', palier: 'bronze', icone: 'corde', verifier: G => (G.pretsRembourses || 0) >= 1 },
  bar: { nom: 'Le bar qui chante', texte: 'Cinq étoiles de renommée au petit bar', cat: 'ville', palier: 'argent', icone: 'gourde', verifier: G => !!(G.bar && G.bar.renommee >= 5) },
  orphelinat: { nom: 'Les petites mains', texte: 'Dix courses faites par les enfants de l\u2019orphelinat', cat: 'ville', palier: 'argent', icone: 'ration', verifier: G => ((G.orphelinat && G.orphelinat.coursesTotal) || 0) >= 10, progres: G => [(G.orphelinat && G.orphelinat.coursesTotal) || 0, 10] },
  rival: { nom: 'Le paon déplumé', texte: 'Racheter la boutique de ton rival', cat: 'ville', palier: 'or', icone: 'amulette', verifier: G => !!(G.rival && G.rival.racheteLe) },
  lumiere: { nom: 'Le serment de lumière', texte: 'Prêter serment à la lumière au Carrefour', cat: 'camps', palier: 'argent', icone: 'torche', verifier: G => sermentDe(G) === 'bien' },
  ombre: { nom: 'Le serment de l\u2019ombre', texte: 'Prêter serment à l\u2019ombre au Carrefour', cat: 'camps', palier: 'argent', icone: 'dague', verifier: G => sermentDe(G) === 'mal' },
  neutre: { nom: 'Ni l\u2019un ni l\u2019autre', texte: 'Garder la balance égale jusqu\u2019au jour 200', cat: 'camps', palier: 'or', icone: 'bouclier', verifier: G => G.jour >= 200 && !sermentDe(G) && palierCamp(G) === 0, progres: G => [Math.min(200, G.jour), 200] },
  parrain: { nom: 'Le Parrain', texte: 'Découvrir qui dirige vraiment la Main Noire', indice: 'un secret de la Main Noire', cat: 'camps', palier: 'secret', icone: 'cape', cache: true, verifier: G => !!(G.parrain && G.parrain.fait) },
  coeurDeChat: { nom: 'Cœur de chat', texte: 'Sauver la compagne de ton chat au Vieux Moulin', cat: 'chat', palier: 'or', icone: 'ration' },
  repertoireComplet: { nom: 'Le répertoire complet', texte: 'Voir ton chat souffler toutes ses formes de fumée', indice: 'une histoire de fumée', cat: 'chat', palier: 'secret', icone: 'torche', cache: true },
  nomChat: { nom: 'Un ami à quatre pattes', texte: 'Adopter ton chat et lui donner un nom', cat: 'chat', palier: 'bronze', icone: 'ration', verifier: G => !!(G.chat && G.chat.adopte && G.chat.nom) },
  // (les trois de la pêche : dans peche.js)
  tirArc: { nom: 'L\u2019Œil du Rempart', texte: 'Battre le record du sergent au tir à l\u2019arc', cat: 'fetes', palier: 'argent', icone: 'arc' },
  lanternes: { nom: 'Les lanternes des morts', texte: 'Allumer une lanterne pour chacun de tes morts', cat: 'fetes', palier: 'argent', icone: 'torche' },
  roue: { nom: 'La roue a tourné', texte: 'Gagner le gros lot de la grande roue', cat: 'fetes', palier: 'bronze', icone: 'amulette' },
  dixHuit: { nom: 'Dix-huit ans', texte: 'Fêter tes dix-huit ans', cat: 'vie', palier: 'bronze', icone: 'ration', verifier: G => !!G.feteFaite },
  anneaux: { nom: 'Les trois anneaux', texte: 'Avoir les trois anneaux de fête d\u2019Orvin', cat: 'vie', palier: 'argent', icone: 'amulette', verifier: G => typeof possede === 'function' && ['anneauArgent', 'anneauOr', 'anneauFer'].every(id => possede(G, id)), progres: G => [['anneauArgent', 'anneauOr', 'anneauFer'].filter(id => possede(G, id)).length, 3] },
  roiMiettes: { nom: 'Le roi des miettes', texte: 'Laisser ta barbe (ou tes cheveux) à l\u2019abandon', indice: 'une barbe très, très libre', cat: 'vie', palier: 'secret', icone: 'ration', cache: true, verifier: G => { const e = typeof etatPilosite === 'function' ? etatPilosite(G) : null; return !!(e && e.negligence >= 3); } },
  uneVie: { nom: 'Une vie entière', texte: 'Tenir ton comptoir jusqu\u2019à tes soixante ans', cat: 'vie', palier: 'or', icone: 'potion', verifier: G => ageJoueur(G) >= 60, progres: G => [ageJoueur(G), 60] },
};
function joursSansPerte(G) { return G.jour - (G.dernierePerte ?? 0); }
// (v1.38) rangés dans G.hautsFaits : G.succes compte déjà les missions réussies par étoiles, et succesDe() les missions
// d'un aventurier (le même nom ici écrasait celui des règles : plus personne ne montait de rang)
function hautsFaitsDe(G) { return (G.hautsFaits = G.hautsFaits || {}); }
function aLeSucces(G, cle) { return !!(G.hautsFaits && G.hautsFaits[cle]); }
// Débloquer : renvoie vrai la première fois (la vignette attend alors d'être montrée). `lieu` : pour la fiche
function debloquerSucces(G, cle, lieu = null) {
  if (!SUCCES[cle] || aLeSucces(G, cle)) return false;
  hautsFaitsDe(G)[cle] = G.jour;
  if (lieu) (G.lieuxSucces = G.lieuxSucces || {})[cle] = lieu;
  (G.succesAMontrer = G.succesAMontrer || []).push(cle);
  G.succesNonVus = (G.succesNonVus || 0) + 1;
  return true;
}
// Tout ce qui se reconnaît d'après l'état de la partie (appelé après chaque client servi, et chaque nuit)
function verifierSucces(G) {
  if (!G) return;
  for (const [cle, S] of Object.entries(SUCCES)) {
    if (!S.verifier || aLeSucces(G, cle)) continue;
    let ok = false; try { ok = S.verifier(G); } catch (e) { ok = false; }
    if (ok) debloquerSucces(G, cle);
  }
}
// La nuit : les séries (sans refus, sans perte), puis la vérification
function nuitDesSucces(G) {
  if (G.journal && G.journal.morts > 0) G.dernierePerte = G.jour;
  const refus = (G.stats && G.stats.refus) || 0;
  if (G.succesRefusVeille === undefined) G.succesRefusVeille = refus;
  if (refus > G.succesRefusVeille) G.serieSansRefus = 0;
  else if (G.journal && G.journal.servis > 0) G.serieSansRefus = (G.serieSansRefus || 0) + 1;
  G.succesRefusVeille = refus;
  verifierSucces(G);
}
function nombreSucces(G) { return Object.keys(SUCCES).filter(k => aLeSucces(G, k)).length; }

// --- Les médailles ---
// Une médaille : le ruban, le disque frappé, le rebord ; grise si elle est encore à gagner
function medailleHD(scene, palier, verrou = false) {
  const cle = 'medaille_' + palier + (verrou ? '_v' : ''); if (scene.textures.exists(cle)) return cle;
  const L = 40, H = 50, t = toileDecor(L, H), R = t.rampes;
  const c = verrou ? 0x6a6a72 : TIERS_SUCCES[palier][0];
  R.medaille = rampe(c); R.ruban = rampe(verrou ? 0x4a4a52 : palier === 'secret' ? 0x3a2a6a : 0x8a2a2a); R.ruban2 = rampe(verrou ? 0x5a5a62 : palier === 'secret' ? 0x5a4a9a : 0x2a4a8a);
  for (let y = 0; y < 18; y++) for (let x = 10; x < 30; x++) { const g = x < 20; if (Math.abs(x - 20) < 9 - y * 0.1) t.poser(x, y, g ? 'ruban' : 'ruban2', (x % 4 === 0 ? 2 : 3) + (y < 2 ? 1 : 0)); }
  const cx = 20, cy = 32, r = 15;
  for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) {
    const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
    if (d > r) continue;
    const lum = ((cx - x) + (cy - y)) / 20;
    if (d > r - 2.5) t.poser(x, y, 'medaille', 4 + Math.round(lum));
    else if (d > r - 3.5) t.poser(x, y, 'medaille', 1);
    else t.poser(x, y, 'medaille', 2 + Math.round(lum * 0.8) + (hachage(x, y, 61) > 0.92 ? 1 : 0));
  }
  for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; t.poser(Math.round(cx + Math.cos(a) * (r - 1.2)), Math.round(cy + Math.sin(a) * (r - 1.2)), 'medaille', 5); }
  t.contour(); t.texture(scene, cle); return cle;
}
// Une médaille posée, avec son icône frappée au centre (ou « ? » pour un secret pas encore trouvé)
function poserMedaille(s, x, y, palier, icone, e = 2, verrou = false, prof = 0) {
  if (typeof creerIconesHD === 'function') creerIconesHD(s);
  const o = [s.add.image(x, y, medailleHD(s, palier, verrou)).setScale(e).setDepth(prof)];
  if (palier === 'secret' && verrou) o.push(s.add.text(x, y + 7 * e, '?', style(Math.round(11 * e), '#cfc6e8', { fontStyle: 'bold', stroke: '#2a1a40', strokeThickness: 3 })).setOrigin(0.5).setDepth(prof + 0.1));
  else { const ic = s.add.image(x, y + 7 * e, iconeObjet(s, icone)).setScale(e * 0.62).setDepth(prof + 0.1); if (verrou) ic.setTint(0x8a8a90).setAlpha(0.7); o.push(ic); }
  return o;
}

// --- La vignette « SUCCÈS DÉBLOQUÉ » ---
// Elle glisse en haut à droite, reste un moment (un peu plus pour l'or), puis repart. `fin` : quand elle est partie.
function vignetteSucces(scene, cle, { x = 750, y = 100, duree = null, fin = null } = {}) {
  const S = SUCCES[cle]; if (!S) return null;
  const or = S.palier === 'or', d = duree || (or ? 5200 : 4200);
  const c = scene.add.container(x + 460, y).setScrollFactor(0).setDepth(2000);
  c.add(scene.add.rectangle(0, 0, 400, 78, 0x14181e, 0.97).setStrokeStyle(2, or ? 0xe8b830 : S.palier === 'secret' ? 0x9a6ad8 : 0x5a6a7a));
  c.add(scene.add.rectangle(-158, 0, 66, 66, 0x222c38).setStrokeStyle(1, 0x3a4a5a));
  poserMedaille(scene, -158, -6, S.palier, S.icone, 1.35).forEach(o => c.add(o));
  c.add(scene.add.text(-116, -28, 'SUCCÈS DÉBLOQUÉ', style(11, or ? '#f3d98a' : '#8ab0d0', { fontStyle: 'bold' })));
  c.add(scene.add.text(-116, -12, S.nom, style(16, '#ffffff', { fontStyle: 'bold' })));
  c.add(scene.add.text(-116, 10, S.texte, style(11, '#b8c4d0', { wordWrap: { width: 290 } })));
  c.add(scene.add.text(190, 28, TIERS_SUCCES[S.palier][1], style(9, '#7a8a9a', { fontStyle: 'italic' })).setOrigin(1, 1));
  if (typeof Son !== 'undefined') Son.jouer('succes');
  scene.tweens.add({ targets: c, x, duration: 450, ease: 'Back.easeOut' });
  scene.time.delayedCall(d, () => scene.tweens.add({ targets: c, x: x + 460, duration: 400, ease: 'Quad.easeIn', onComplete: () => { c.destroy(); if (fin) fin(); } }));
  const G = window.GAME;
  if (G && G.succesAMontrer) G.succesAMontrer = G.succesAMontrer.filter(k => k !== cle);
  return c;
}
// Celles qui attendent : le bandeau du haut (HudScene) les montre une à une dès qu'il est visible. Une scène où il
// est caché (le Moulin, la pêche...) peut les montrer elle-même.
function montrerSuccesEnAttente(scene) {
  const G = window.GAME;
  if (!(G && G.succesAMontrer && G.succesAMontrer.length)) return;
  const hud = scene.scene.get('Hud');
  if (hud && hud !== scene && hud.bandeau && hud.bandeau.visible) return;
  [...G.succesAMontrer].forEach((k, i) => scene.time.delayedCall(600 + i * 5000, () => scene.sys.isActive() && vignetteSucces(scene, k)));
}

// --- La page des succès (au bureau) ---
// La barre de progrès, les catégories à gauche, les médailles à droite (20 par page) ; un clic : la fiche.
function ouvrirPageSucces(scene, { fermer = null } = {}) {
  const G = window.GAME, P = 300;
  G.succesNonVus = 0;
  const c = scene.add.container(0, 0).setDepth(P).setScrollFactor(0);
  const ajouter = o => { c.add(o); return o; };
  ajouter(scene.add.rectangle(480, 270, 960, 540, 0x1a1008, 0.92).setInteractive());
  ajouter(scene.add.image(480, 284, panneauHD(scene, 920, 480)).setScale(2));
  const total = Object.keys(SUCCES).length, n = nombreSucces(G);
  ajouter(scene.add.text(480, 66, 'TES SUCCÈS', style(22, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
  ajouter(scene.add.rectangle(480, 96, 420, 16, 0x6b4a2a).setStrokeStyle(2, 0x3b2410));
  ajouter(scene.add.rectangle(272, 96, Math.max(1, 416 * n / total), 12, 0xe8b830).setOrigin(0, 0.5));
  ajouter(scene.add.text(480, 96, `${n} / ${total}  ·  ${Math.round(100 * n / total)} %`, style(11, '#1a0e06', { fontStyle: 'bold' })).setOrigin(0.5));
  let cat = 'tous', page = 0, vue = scene.add.container(0, 0), fiche = null;
  ajouter(vue);
  const cats = { tous: 'Tous les succès', ...CATEGORIES_SUCCES };
  const boutonsCat = Object.entries(cats).map(([k, nom], i) => {
    const y = 132 + i * 37, l = Object.keys(SUCCES).filter(x => k === 'tous' || SUCCES[x].cat === k);
    const f = ajouter(scene.add.rectangle(130, y, 170, 30, 0xe8d8b8).setStrokeStyle(2, 0x6b4a2a).setInteractive({ useHandCursor: true }));
    const t1 = ajouter(scene.add.text(54, y, nom, style(13, '#3b2410', { fontStyle: 'bold' })).setOrigin(0, 0.5));
    const t2 = ajouter(scene.add.text(208, y, `${l.filter(x => aLeSucces(G, x)).length}/${l.length}`, style(11, '#6b4a2a')).setOrigin(1, 0.5));
    f.on('pointerdown', () => { cat = k; page = 0; dessiner(); });
    return { k, f, t1, t2 };
  });
  ajouter(scene.add.text(130, 482, 'clic sur une médaille : le détail', style(11, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5));
  const fleches = ajouter(scene.add.text(580, 494, '', style(13, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5).setInteractive({ useHandCursor: true }));
  fleches.on('pointerdown', p => { const l = liste(); const pages = Math.ceil(l.length / 20); if (pages < 2) return; page = (page + (p.x < 580 ? pages - 1 : 1)) % pages; dessiner(); });
  const ordre = Object.keys(CATEGORIES_SUCCES);
  const liste = () => Object.keys(SUCCES).filter(x => cat === 'tous' || SUCCES[x].cat === cat).sort((a, b) => ordre.indexOf(SUCCES[a].cat) - ordre.indexOf(SUCCES[b].cat));
  function dessiner() {
    vue.removeAll(true);
    for (const b of boutonsCat) { const sel = b.k === cat; b.f.setFillStyle(sel ? 0x8a3a1a : 0xe8d8b8); b.t1.setColor(sel ? '#ffe9a8' : '#3b2410'); b.t2.setColor(sel ? '#ffe9a8' : '#6b4a2a'); }
    const l = liste(), pages = Math.max(1, Math.ceil(l.length / 20));
    fleches.setText(pages > 1 ? `◂  page ${page + 1} / ${pages}  ▸` : '');
    l.slice(page * 20, page * 20 + 20).forEach((cle, i) => {
      const S = SUCCES[cle], x = 290 + (i % 5) * 132, y = 160 + Math.floor(i / 5) * 92, ok = aLeSucces(G, cle), cache = S.cache && !ok;
      if (ok) vue.add(scene.add.image(x, y + 4, 'halo').setScale(0.55).setTint(0xfff0a0).setAlpha(0.45));
      poserMedaille(scene, x, y, S.palier, S.icone, 1.2, !ok).forEach(o => vue.add(o));
      vue.add(scene.add.text(x, y + 34, cache ? '???' : S.nom, style(10, ok ? '#3b2410' : '#8a7a6a', { fontStyle: 'bold', align: 'center', wordWrap: { width: 124 } })).setOrigin(0.5, 0));
      vue.add(scene.add.rectangle(x, y + 10, 110, 86, 0xffffff, 0.001).setInteractive({ useHandCursor: true }).on('pointerdown', () => ouvrirFiche(cle)));
    });
  }
  function ouvrirFiche(cle) {
    if (fiche) fiche.destroy();
    const S = SUCCES[cle], ok = aLeSucces(G, cle), cache = S.cache && !ok, etat = ok ? 'OBTENU' : cache ? 'SECRET' : 'À GAGNER';
    fiche = scene.add.container(0, 0).setDepth(P + 5).setScrollFactor(0);
    fiche.add(scene.add.rectangle(480, 270, 960, 540, 0x000000, 0.55).setInteractive().on('pointerdown', () => { fiche.destroy(); fiche = null; }));
    fiche.add(scene.add.image(480, 270, panneauHD(scene, 300, 440)).setScale(2));
    fiche.add(scene.add.text(480, 76, etat, style(12, ok ? '#2f6a2a' : cache ? '#6a3a9a' : '#8a6a4a', { fontStyle: 'bold' })).setOrigin(0.5));
    if (ok) fiche.add(scene.add.image(480, 196, 'halo').setScale(1.1).setTint(0xfff0a0).setAlpha(0.5));
    poserMedaille(scene, 480, 182, S.palier, S.icone, 3, !ok).forEach(o => fiche.add(o));
    fiche.add(scene.add.text(480, 270, cache ? '???' : S.nom, style(18, '#3b2410', { fontStyle: 'bold', align: 'center', wordWrap: { width: 260 } })).setOrigin(0.5, 0));
    fiche.add(scene.add.text(480, 306, cache ? `Un secret : il se découvre en jouant.\nIndice : ${S.indice || '...'}` : S.texte, style(13, '#4a2a10', { align: 'center', wordWrap: { width: 250 } })).setOrigin(0.5, 0));
    fiche.add(scene.add.text(480, 384, `${TIERS_SUCCES[S.palier][1]} · ${CATEGORIES_SUCCES[S.cat]}`, style(11, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5));
    let sous = cache ? 'Personne ne te le dira.' : '';
    if (ok) sous = `Obtenu le jour ${G.hautsFaits[cle]}${G.lieuxSucces && G.lieuxSucces[cle] ? `,\n${G.lieuxSucces[cle]}` : ''}`;
    else if (!cache && S.progres) { let pr = null; try { pr = S.progres(G); } catch (e) {} if (pr) { const [a, b] = pr; sous = `Tu en es à ${Math.min(a, b)} / ${b}`;
      fiche.add(scene.add.rectangle(480, 452, 200, 12, 0x6b4a2a)); fiche.add(scene.add.rectangle(382, 452, Math.max(1, 196 * Math.min(1, a / b)), 8, 0xe8b830).setOrigin(0, 0.5)); } }
    fiche.add(scene.add.text(480, 412, sous, style(12, ok ? '#2f6a2a' : '#8a6a4a', { fontStyle: 'bold', align: 'center', wordWrap: { width: 250 } })).setOrigin(0.5, 0));
    fiche.add(scene.add.text(480, 470, '(clic : fermer)', style(10, '#8a6a4a', { fontStyle: 'italic' })).setOrigin(0.5));
  }
  const b = creerBouton(scene, 852, 492, 150, 'Fermer', () => { if (fiche) fiche.destroy(); c.destroy(); if (fermer) fermer(); });
  c.add([b.fond, b.label]);
  dessiner();
  return c;
}
