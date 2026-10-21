// (v1.37, planche 60 suite validée) De retour à la maison, après le Vieux Moulin :
// - le soir suivant, la conversation au coin du feu (dans ta chambre) : trois sujets dans l'ordre voulu (d'où il vient,
//   le mot sur le comptoir, et elle), puis le choix de l'endroit du coin des chats ;
// - le coin des chats (ta chambre ou l'arrière-boutique) : le grand panier, les deux gamelles, et ce qu'on y ajoute
//   petit à petit (un clic sur le panier) ;
// - le soir, il fume parfois quelque part dans la maison, et souffle une forme (de temps en temps une forme jamais vue) ;
// - le carnet des formes, au bureau.

// Où va chaque chose, selon la pièce (le coussin brodé : sur le rebord de ta fenêtre, ou sur la cabane)
const COIN_LIEUX = {
  chambre: { x: 0, sol: 503, places: { arbre: 650, panier: 290, gamelles: 380, cabane: 790, pelote: 210, coussin: [744, -272] } },
  arriere: { x: 130, sol: SOL_ARRIERE + 68, places: { arbre: 420, panier: 130, gamelles: 228, cabane: 300, pelote: 52, coussin: [300, -100] } },   // (l'arbre devant le buffet : à gauche, il cachait l'étagère)
};
// Le coin, ses chats (endormis dans le panier ; le tien te suit en promenade), et son panneau d'aménagement au clic
function poserCoinChats(scene, lieu, { dx = 0, chatDort = true, profondeur = 7.6 } = {}) {
  const G = window.GAME, coin = coinDesChats(G);
  if (!coin || coin.lieu !== lieu) return null;
  if (scene._coin) for (const o of scene._coin) if (o && o.destroy) o.destroy();
  const L = COIN_LIEUX[lieu], x = dx + L.x, SOL_COIN = L.sol, p = profondeur, avant = scene.children.list.length;
  const c = dessinerCoinChats(scene, x, SOL_COIN, { elements: coin.elements, noms: [nomChat(G), nomCompagne(G)], places: L.places, profondeur: p,
    pleines: [typeof gamellePleine === 'function' ? gamellePleine(G) : true, !(G.moulin && G.moulin.faimElle > 0)] });
  const px = x + L.places.panier;
  const lookElle = (G.moulin && G.moulin.compagne && G.moulin.compagne.look) || lookCompagne(G);
  const kE = creerChatHD(scene, lookElle), k = creerChatHD(scene, lookChat(G));
  const absent = typeof chatParti === 'function' && (chatParti(G) || chatBoude(G));   // (parti, ou il boude ailleurs)
  const elle = scene.add.image(px + (chatDort && !absent ? 24 : 0), SOL_COIN - 8, kE + '_dort0').setOrigin(0.5, 1).setScale(2.1).setDepth(p + 0.05).setFlipX(true);
  let souffle = 0;
  scene.time.addEvent({ delay: 1200, loop: true, callback: () => { if (elle.active) elle.setTexture(kE + '_dort' + (++souffle % 2)); } });
  // le panier se clique : ce qu'on peut ajouter au coin (et ton chat, quand il y dort : son panneau à lui)
  const zone = scene.add.rectangle(px, SOL_COIN - 20, 170, 60, 0xffffff, 0).setDepth(p + 0.85);
  if (scene.scene.key !== 'Dodo') zone.setInteractive({ useHandCursor: true });   // (pas au coucher : la scène avance au clic)
  zone.on('pointerdown', () => { if (scene.enConversation) return; Son.jouer('miaou'); ouvrirCoinChats(scene, () => poserCoinChats(scene, lieu, { dx, chatDort, profondeur })); });
  if (chatDort && !absent) {
    const moi = scene.add.image(px - 22, SOL_COIN - 10, k + '_dort1').setOrigin(0.5, 1).setScale(2.2).setDepth(p + 0.9);
    if (typeof ouvrirPanneauChat === 'function' && scene.scene.key !== 'Promenade' && scene.scene.key !== 'Dodo') moi.setInteractive({ useHandCursor: true }).on('pointerdown', () => { Son.jouer('miaou'); ouvrirPanneauChat(scene); });
  }
  scene.add.text(px, SOL_COIN - 78, 'Le coin des chats', style(11, '#f3e6c8', { fontStyle: 'bold italic', stroke: '#140c06', strokeThickness: 3 })).setOrigin(0.5).setDepth(p + 0.86);
  scene._coin = scene.children.list.slice(avant);
  return c;
}

// Le panneau « Le coin des chats » : ce qu'il y a, ce qu'on peut acheter (un clic, puis un second pour confirmer)
function ouvrirCoinChats(scene, quandAchat) {
  const G = window.GAME, coin = coinDesChats(G);
  if (!coin || scene.panneauCoin) return;
  const fixe = o => { o.setScrollFactor(0).setDepth(60); boite.add(o); return o; };
  const boite = scene.panneauCoin = scene.add.container(0, 0).setDepth(60);
  boite.add(scene.add.rectangle(480, 270, 960, 540, 0x0a0604, 0.55).setScrollFactor(0).setInteractive());
  fixe(scene.add.image(480, 275, panneauHD(scene, 560, 400)).setScale(2));
  fixe(scene.add.text(480, 98, 'Le coin des chats', style(21, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
  fixe(scene.add.text(480, 122, `${nomChatMaj(G)} et ${nomCompagne(G)} · ${coin.lieu === 'chambre' ? 'dans ta chambre, au coin du feu' : "dans l'arrière-boutique"} · bourse : ${Math.floor(G.argent)} p.`, style(12, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5));
  let attente = null;
  const lignes = [];
  Object.entries(COIN_CHATS).forEach(([cle, e], i) => {
    const y = 152 + i * 46, fait = coin.elements.includes(cle);
    fixe(scene.add.text(232, y, (fait ? '✓ ' : '') + e.nom, style(14, fait ? '#3a6a2a' : '#3b2410', { fontStyle: 'bold' })));
    fixe(scene.add.text(232, y + 18, e.texte, style(11, '#6b4a2a', { fontStyle: 'italic', wordWrap: { width: 380 } })));
    if (fait) { fixe(scene.add.text(728, y + 10, e.prix ? 'installé' : 'offert', style(12, '#6a7a5a', { fontStyle: 'bold' })).setOrigin(1, 0.5)); return; }
    const b = fixe(scene.add.text(728, y + 10, `${e.prix} p.`, style(13, '#fff4dc', { fontStyle: 'bold', backgroundColor: G.argent >= e.prix ? '#4f7a3a' : '#7a6a5a', padding: { x: 8, y: 4 } })).setOrigin(1, 0.5).setInteractive({ useHandCursor: true }));
    lignes.push([cle, b, e]);
    b.on('pointerdown', () => {
      if (attente !== cle) { for (const [, bb, ee] of lignes) bb.setText(`${ee.prix} p.`); attente = cle; b.setText(`Confirmer (${e.prix} p.)`); Son.jouer('clic'); return; }
      const r = acheterCoin(G, cle);
      if (r.erreur) { Son.jouer('refus'); b.setText(r.erreur.length > 22 ? 'Pas assez' : r.erreur); attente = null; return; }
      Son.jouer('achat');
      fermer();
      if (quandAchat) quandAchat();
      gainEnDirect(scene, scene.cameras.main.scrollX + 480, 200, `−${e.prix} p.`, false);
      if (r.gain) scene.time.delayedCall(500, () => gainEnDirect(scene, scene.cameras.main.scrollX + 480, 230, '+1 ♥ complicité', true));
      if (scene.dire) scene.dire(`${e.nom} : ${e.texte} Ils ronronnent.`);
    });
  });
  const fermer = () => { boite.destroy(); scene.panneauCoin = null; };
  const f = creerBouton(scene, 480, 452, 180, 'Fermer', fermer); fixe(f.fond); fixe(f.label);
}

// La vignette « Nouvelle forme de fumée » (en haut à droite, fixée à l'écran)
function vignetteForme(scene, forme) {
  const F = FORMES_FUMEE[forme]; if (!F) return;
  const c = scene.add.container(1200, 158).setScrollFactor(0).setDepth(2000);   // (sous la bulle du texte, qu'elle ne coupe pas)
  c.add(scene.add.rectangle(0, 0, 360, 60, 0x14181e, 0.96).setStrokeStyle(2, 0x5a6a7a));
  c.add(scene.add.text(-160, -20, 'NOUVELLE FORME DE FUMÉE', style(11, '#8ab0d0', { fontStyle: 'bold' })));
  c.add(scene.add.text(-160, -2, F.nom[0].toUpperCase() + F.nom.slice(1), style(16, '#ffffff', { fontStyle: 'bold' })));
  c.add(scene.add.text(-160, 18, 'Ajoutée à ton carnet des formes (au bureau)', style(11, '#b8c4d0')));
  Son.jouer('clochette');
  scene.tweens.add({ targets: c, x: 770, duration: 420, ease: 'Back.easeOut' });
  scene.time.delayedCall(4200, () => scene.tweens.add({ targets: c, x: 1200, duration: 380, onComplete: () => c.destroy() }));
}

// Le carnet des formes : celles que tu as vues sont dessinées, les autres restent « ??? »
function ouvrirCarnetFormes(scene) {
  const G = window.GAME;
  if (scene.carnetFormes) return;
  creerFumeeHD(scene);
  const boite = scene.carnetFormes = scene.add.container(0, 0).setDepth(60);
  const fixe = o => { o.setScrollFactor(0); boite.add(o); return o; };
  fixe(scene.add.rectangle(480, 270, 960, 540, 0x0a0604, 0.65).setInteractive());
  fixe(scene.add.image(480, 280, panneauHD(scene, 820, 440)).setScale(2));
  const vues = formesVues(G), toutes = Object.keys(FORMES_FUMEE);
  fixe(scene.add.text(480, 86, 'Le carnet des formes de fumée', style(21, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
  fixe(scene.add.text(480, 112, `${vues.filter(f => toutes.includes(f)).length} / ${toutes.length} — chaque fois que ${nomChat(G)} fume à la maison, il en souffle peut-être une nouvelle`, style(12, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5));
  toutes.forEach((f, i) => {
    const col = i % 7, lig = Math.floor(i / 7), px = 150 + col * 110, py = 200 + lig * 160;
    fixe(scene.add.rectangle(px, py + 10, 96, 120, 0x3b2410, 0.12).setStrokeStyle(1, 0x8a6a4a));
    if (vues.includes(f)) {
      const c = formeDeFumee(scene, f, px, py, px, py, { taille: 24, vit: false, profondeur: 61 });
      if (c) { c.setScrollFactor(0); boite.add(c); }
      fixe(scene.add.text(px, py + 56, FORMES_FUMEE[f].nom, style(11, '#3b2410', { fontStyle: 'bold', align: 'center', wordWrap: { width: 92 } })).setOrigin(0.5, 0));
    } else {
      fixe(scene.add.text(px, py, '?', style(34, '#a8987a', { fontStyle: 'bold' })).setOrigin(0.5));
      fixe(scene.add.text(px, py + 56, '???', style(11, '#8a7a5a', { fontStyle: 'bold' })).setOrigin(0.5, 0));
    }
  });
  const b = creerBouton(scene, 480, 470, 180, 'Fermer', () => { boite.destroy(); scene.carnetFormes = null; }); fixe(b.fond); fixe(b.label);
}

// --- La promenade du soir : le coin, la fumée du soir, et (le premier soir) la conversation ---
{
  const creer = PromenadeScene.prototype.create;
  PromenadeScene.prototype.create = function () {
    creer.call(this);
    const G = this.G, d = this.sys.settings.data || {};
    this.sys.settings.data = {};   // (sinon « Se promener » relancerait la conversation : Phaser garde les données d'avant)
    if (!(typeof moulinFait === 'function' && moulinFait(G))) return;
    // le coin dans ta chambre (celui de l'arrière-boutique est dessiné avec la pièce)
    poserCoinChats(this, 'chambre', { chatDort: false });
    poserCoinChats(this, 'arriere', { dx: 960, chatDort: false });
    if (d.conversation && conversationAFaire(G)) { this.time.delayedCall(500, () => conversationDuChat(this)); return; }
    const f = fumeeDuSoir(G);
    if (f && !f.vue) chatQuiFume(this, f);
  };
  const maj = PromenadeScene.prototype.update;
  PromenadeScene.prototype.update = function (t, d) { if (this.enConversation) return; return maj.call(this, t, d); };
}

// Il fume quelque part : à ta fenêtre, au coin du feu, ou dans l'arrière-boutique ; un clic, et il souffle sa forme
function chatQuiFume(scene, f) {
  const G = scene.G;
  if (scene.compagnon) { scene.compagnon.destroy(); scene.compagnon = null; }   // (il est occupé : il ne te suit pas)
  const pos = { fenetre: [744, 232, true, 2.2], feu: [172, SOL_PROMENADE, false, 2.6], arriere: [960 + 470, SOL_PROMENADE, true, 2.6] }[f.lieu];
  const [x, y, flip, e] = pos;
  const chat = scene.add.image(x, y, textureChatDebout(scene, lookChat(G))).setOrigin(0.5, 1).setScale(e).setDepth(8.6).setFlipX(flip).setInteractive({ useHandCursor: true });
  const sens = flip ? -1 : 1;
  const bout = { x: x + sens * 36 * e / 2.6, y: y - 98 * e / 2.6 };
  scene.add.image(bout.x, bout.y, 'halo').setScale(0.1).setTint(0xff8030).setBlendMode(Phaser.BlendModes.ADD).setDepth(8.7);
  filetDeFumee(scene, () => (chat.active ? bout : null));
  const signe = scene.add.text(x, y - 140 * e / 2.6, '💨', style(18, '#ffffff')).setOrigin(0.5).setDepth(8.8);
  scene.tweens.add({ targets: signe, y: signe.y - 6, duration: 700, yoyo: true, repeat: -1 });
  chat.on('pointerdown', () => {
    if (f.vue) return scene.dire(`${nomChatMaj(G)} fume tranquillement. « Une par soir, gamin. »`);
    f.vue = true; signe.destroy();
    const mx = x + sens * 16 * e / 2.6, my = y - 96 * e / 2.6;
    formeDeFumee(scene, f.forme, mx, my, x + sens * 170, Math.max(210, y - 230), { taille: 42, sens });   // (sous la bulle du texte)
    const nouvelle = f.neuve && voirForme(G, f.forme);
    if (nouvelle) { vignetteForme(scene, f.forme); if (typeof montrerSuccesEnAttente === 'function') montrerSuccesEnAttente(scene); scene.dire(`${nomChatMaj(G)} tire une longue bouffée... et souffle ${FORMES_FUMEE[f.forme].nom}. Une forme que tu n'avais jamais vue !`); }
    else scene.dire(`${nomChatMaj(G)} souffle ${FORMES_FUMEE[f.forme].nom}, pour le plaisir.`);
  });
  if (f.lieu === 'arriere') return;
  scene.time.delayedCall(800, () => scene.dire(f.lieu === 'fenetre' ? `${nomChatMaj(G)} est sur le rebord de ta fenêtre, le cigare aux babines.` : `${nomChatMaj(G)} fume ${typeof feuAllume === 'function' && feuAllume(G) ? 'au coin du feu' : 'devant la cheminée'}, dans ta chambre.`));
}

// --- La conversation au coin du feu (le soir suivant le Moulin) ---
async function conversationDuChat(scene) {
  const G = scene.G;
  scene.enConversation = true;
  scene.entrer(P_CHAMBRE, 440, true);
  if (scene.compagnon) scene.compagnon.setVisible(false);
  if (scene.allumerCheminee) scene.allumerCheminee();
  const caches = scene.children.list.filter(o => o.scrollFactorX === 0 && o.visible);   // (le nom de la pièce, Retour... : rangés le temps de parler)
  for (const o of caches) o.setVisible(false);
  const ui = [], fixe = o => { o.setScrollFactor(0).setDepth(40); ui.push(o); return o; };
  const attendre = ms => new Promise(ok => scene.time.delayedCall(ms, ok));
  // le décor : lui debout au coin du feu, elle qui dort sur le tapis, toi assis sur ton lit
  const chat = scene.add.image(250, SOL_PROMENADE, textureChatDebout(scene, lookChat(G))).setOrigin(0.5, 1).setScale(2.6).setDepth(8.6);
  const bout = { x: chat.x + 36, y: chat.y - 98 };
  scene.add.image(bout.x, bout.y, 'halo').setScale(0.1).setTint(0xff8030).setBlendMode(Phaser.BlendModes.ADD).setDepth(8.7);
  filetDeFumee(scene, () => (chat.active ? bout : null));
  const lookElle = (G.moulin.compagne && G.moulin.compagne.look) || lookCompagne(G), kE = creerChatHD(scene, lookElle);
  const elle = scene.add.image(330, SOL_PROMENADE, kE + '_dort0').setOrigin(0.5, 1).setScale(2.2).setDepth(8.55);
  let souffle = 0; scene.time.addEvent({ delay: 1200, loop: true, callback: () => { if (elle.active) elle.setTexture(kE + '_dort' + (++souffle % 2)); } });
  const cleA = textureJoueurAssis(scene, G), avant = scene.heros.texture.key;
  scene.heros.setTexture(cleA).setOrigin(0.5, (PIEDS_ASSIS[cleA] + 1) / scene.heros.height).setX(440).setY(436).setFlipX(true);
  // le bandeau (narration en italique, consigne en gras) et les choix
  const fond = fixe(scene.add.rectangle(480, 12, 920, 40, 0x2a1a10, 0.94).setStrokeStyle(2, 0xc9a227).setOrigin(0.5, 0));
  const narr = fixe(scene.add.text(40, 22, '', style(13, '#c9b48a', { fontStyle: 'italic', wordWrap: { width: 880 } })));
  const cons = fixe(scene.add.text(40, 40, '', style(14, '#fff4dc', { fontStyle: 'bold', wordWrap: { width: 880 } })));
  const dire = (n, c = '') => { narr.setText(n); cons.setText(c).setY(26 + narr.height); fond.setSize(920, 20 + narr.height + (c ? cons.height + 4 : 0)); };
  let boutons = [];
  const choisir = textes => new Promise(ok => {
    for (const b of boutons) b.destroy(); boutons = [];
    const n = textes.length, Lb = Math.min(300, 880 / n);
    boutons.push(fixe(scene.add.rectangle(480, 516, Lb * n + 20, 40, 0x2a1a10, 0.92).setStrokeStyle(2, 0xc9a227)));
    textes.forEach((t, i) => { const b = fixe(scene.add.text(480 + (i - (n - 1) / 2) * Lb, 516, t, style(14, '#fff4dc', { fontStyle: 'bold', backgroundColor: '#4f7a3a', padding: { x: 8, y: 5 } })).setOrigin(0.5).setInteractive({ useHandCursor: true }));
      b.on('pointerdown', () => { Son.jouer('clic'); for (const bb of boutons) bb.destroy(); boutons = []; ok(i); }); boutons.push(b); });
  });
  let bulle = null;
  const parler = async (texte) => {
    if (bulle) bulle.destroy();
    bulle = scene.add.text(250, SOL_PROMENADE - 150, texte, style(14, '#2a1608', { fontStyle: 'bold', backgroundColor: '#f4ead2', padding: { x: 7, y: 4 }, align: 'center' })).setOrigin(0.5, 1).setDepth(9.9);
    await choisir(['Suite ▸']);
  };
  const nom = nomChatMaj(G), elleNom = nomCompagne(G);
  dire(`Le soir suivant, dans ta chambre. Le feu crépite ; ${elleNom} dort sur le tapis, roulée en boule. ${nom} s'est levé sur ses pattes arrière, son cigare au coin des babines.`);
  await parler("« Bon. Je t'avais promis des explications.\nAssieds-toi. Ça risque d'être long. »");
  const SUJETS = [["📜 D'où vient-il ?", 'origine'], ['✉ Le mot sur le comptoir', 'mot'], ['🐾 Et elle ?', 'elle']];
  const faits = new Set();
  while (faits.size < SUJETS.length) {
    if (bulle) { bulle.destroy(); bulle = null; }
    const restants = SUJETS.filter(([, k]) => !faits.has(k));
    dire(faits.size ? 'Autre chose ?' : `${nom} tire une bouffée et attend.`, 'Tu peux lui demander ce que tu veux (dans l\'ordre que tu veux) :');
    const i = await choisir(restants.map(([t]) => t));
    const k = restants[i][1]; faits.add(k);
    if (k === 'origine') {
      dire('Il souffle doucement : la fumée dessine un grand chapeau pointu, qui flotte un moment au-dessus du lit.');
      formeDeFumee(scene, 'chapeau', chat.x + 16, chat.y - 96, 420, 210, { taille: 46, tenue: 5200 });
      if (voirForme(G, 'chapeau')) { vignetteForme(scene, 'chapeau'); if (typeof montrerSuccesEnAttente === 'function') montrerSuccesEnAttente(scene); }
      await parler("« Un vieux sorcier. Je ne me rappelle ni son visage, ni son nom...\nJuste son chapeau. Et que c'était un bel enfoiré. »");
      await parler("« Un matin, je me suis réveillé dans ta ville. Sans rien.\nJ'ai erré. Puis je l'ai trouvée, elle. Puis toi. »");
    } else if (k === 'mot') {
      dire('Tu te rappelles ce petit mot griffonné, signé d\'une patte. Tu avais ri. Lui, non.');
      await parler("« Le mot sur le comptoir, quand ma gamelle est restée vide ?\nUne patte dans l'encre. Tu croyais que c'était un hasard ? »");
      await parler("« Je me taisais pour elle, et pour moi. Un chat qui cause,\nça finit en cage chez un mage. Ou pire. »");
    } else {
      dire(`${elleNom} ouvre un œil, te regarde, et le referme.`);
      await parler("« Le Vieux Moulin, c'était notre lune de miel.\nJusqu'à ce que ce maudit renard s'en mêle. »");
      await parler("« Elle ne parle que le chat. Et elle ne fait confiance\nà personne — sauf à toi. »");
      await parler("« Il lui faut un coin à elle. Un vrai.\nPas un vieux coussin dans un courant d'air. »");
    }
  }
  if (bulle) { bulle.destroy(); bulle = null; }
  // où installer le coin
  dire('Où installer le coin des chats ?', 'Tu pourras l\'aménager ensuite, petit à petit (un clic sur leur panier).');
  const cartes = [];
  const carte = (cx, titre, l1, l2) => { cartes.push(fixe(scene.add.rectangle(cx, 215, 330, 150, 0x2a1a10, 0.94).setStrokeStyle(2, 0xc9a227)));
    cartes.push(fixe(scene.add.text(cx, 163, titre, style(15, '#f3d98a', { fontStyle: 'bold' })).setOrigin(0.5)));
    cartes.push(fixe(scene.add.text(cx, 215, l1 + '\n' + l2, style(12, '#e8dcc0', { align: 'center', wordWrap: { width: 300 }, lineSpacing: 3 })).setOrigin(0.5))); };
  carte(300, '🔥 Au coin du feu, dans ta chambre', 'Ils dorment au chaud, près de toi.', 'Il fumera à ta fenêtre en regardant la lune.');
  carte(660, "🛋 Dans l'arrière-boutique", 'À la place du vieux coussin, près du buffet.', "Plus de place : l'arbre à griffer et la cabane.");
  const lieu = (await choisir(['Dans ta chambre', "Dans l'arrière-boutique"])) === 0 ? 'chambre' : 'arriere';
  for (const c of cartes) c.destroy();
  installerCoin(G, lieu);
  if (typeof Sauvegarde !== 'undefined') Sauvegarde.planifier(G, 'Nuit');
  // le premier soir : on y va, ils s'installent
  scene.heros.setTexture(avant).setOrigin(0.5, 1).setY(SOL_PROMENADE);
  chat.destroy(); elle.destroy();
  if (lieu === 'chambre') poserCoinChats(scene, 'chambre', { chatDort: true });
  else { scene.entrer(P_ARRIERE, 960 + 560, true); for (const o of scene.vieuxCoin || []) o.setVisible(false); poserCoinChats(scene, 'arriere', { dx: 960, chatDort: true }); }
  Son.jouer('miaou');
  dire(`Le premier soir : le grand panier pour deux, et deux gamelles, chacune à son nom. ${nom} et ${elleNom} dorment serrés l'un contre l'autre.`, '(Clique sur leur panier pour aménager le coin.)');
  await choisir(['Bonne nuit, vous deux']);
  for (const o of ui) o.destroy();
  for (const o of caches) if (o.active) o.setVisible(true);
  scene.enConversation = false;
  if (scene.compagnon) scene.compagnon.setVisible(false);   // (ce soir, il dort avec elle)
  scene.dire(`${nom} ronronne déjà. Toi aussi, tu devrais aller dormir.`);
}

// --- Le soir, dans la maison : il t'attend pour parler ---
function soireeDeLaConversation(scene) {
  const G = scene.G;
  if (!(typeof conversationAFaire === 'function' && conversationAFaire(G)) || scene.fenetreMoulin) return false;
  const c = scene.fenetreMoulin = scene.add.container(0, 0).setDepth(40);
  c.add(scene.add.rectangle(480, 270, 960, 540, 0x0a0604, 0.6).setInteractive());
  c.add(scene.add.image(480, 280, panneauHD(scene, 560, 280)).setScale(2));
  c.add(scene.add.text(480, 200, `${nomChatMaj(G)} t'attend dans ta chambre, devant la cheminée, son cigare au coin des babines. Il a promis de tout t'expliquer.`, style(14, '#5a3a1a', { fontStyle: 'italic', align: 'center', wordWrap: { width: 500 }, lineSpacing: 3 })).setOrigin(0.5, 0));
  const fermer = () => { c.destroy(); scene.fenetreMoulin = null; };
  const b1 = creerBouton(scene, 360, 360, 220, 'Le rejoindre', () => { fermer(); scene.scene.pause(); scene.scene.launch('Promenade', { conversation: true }); });
  const b2 = creerBouton(scene, 620, 360, 200, 'Plus tard', () => { fermer(); scene.annoncer && scene.annoncer(`${nomChatMaj(G)} hausse les épaules. « Quand tu veux. Je bouge pas. »`); });
  c.add([b1.fond, b1.label, b2.fond, b2.label]);
  return true;
}

// --- Au moment de dormir : le coin, s'il est dans ta chambre (ils dorment déjà) ---
{
  const chambre = DodoScene.prototype.dessinerChambre;
  DodoScene.prototype.dessinerChambre = function () {
    chambre.call(this);
    if (this.scene.key === 'Dodo' && typeof coinDesChats === 'function') poserCoinChats(this, 'chambre', { chatDort: true, profondeur: 2.4 });
  };
}
