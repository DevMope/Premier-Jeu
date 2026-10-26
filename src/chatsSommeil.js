// (v1.65, retours du joueur sur le bureau) « Les chats dorment où ils veulent. »
// Chaque jour, ton chat choisit au hasard où il dort : dans le bureau (le tapis, le haut du meuble à tiroirs, le rebord
// de la fenêtre, la pile de vieux registres, la chaise quand tu n'y es pas) ou dans l'arrière-boutique (son coussin ou
// le grand panier du coin des chats, le panier des cadeaux, le vieux buffet, les sacs de pièces). Et comment : en
// boule, étalé de tout son long, ou sur le dos, les quatre pattes en l'air.
// (Le tirage ne dépend que du jour : le même endroit d'une pièce à l'autre, sans toucher au hasard du jeu.)

// Les endroits, la pièce où ils sont et les poses qui y tiennent
const PLACES_SOMMEIL = {
  tapis:   { piece: 'bureau',  poses: ['boule', 'etale', 'surDos'] },
  meuble:  { piece: 'bureau',  poses: ['boule', 'etale'] },
  fenetre: { piece: 'bureau',  poses: ['boule', 'etale'] },
  livres:  { piece: 'bureau',  poses: ['boule'] },
  chaise:  { piece: 'bureau',  poses: ['boule'] },
  coussin: { piece: 'arriere', poses: ['boule', 'surDos'] },   // (ou le grand panier du coin des chats, s'il est ici)
  panier:  { piece: 'arriere', poses: ['boule'] },
  buffet:  { piece: 'arriere', poses: ['etale', 'boule'] },
  sacs:    { piece: 'arriere', poses: ['surDos', 'boule'] },
};
const ORDRE_SOMMEIL = ['tapis', 'coussin', 'meuble', 'panier', 'fenetre', 'buffet', 'livres', 'sacs', 'chaise'];
const SACS_POUR_DORMIR = 3;   // (il faut au moins trois sacs de pièces pour s'y coucher : 450 pièces)

// Où dort-il aujourd'hui ? { place, pose, piece } ; null s'il n'est pas à la maison (pas adopté, parti, il boude)
function sommeilDuChat(G) {
  if (!(typeof chatAdopte === 'function' && chatAdopte(G))) return null;
  if (typeof chatParti === 'function' && chatParti(G)) return null;
  if (typeof chatBoude === 'function' && chatBoude(G)) return null;   // (il boude sur son coussin : l'arrière-boutique s'en occupe)
  let place = ORDRE_SOMMEIL[Math.floor(hachage(G.jour, 11, 6151) * ORDRE_SOMMEIL.length) % ORDRE_SOMMEIL.length];
  if (place === 'sacs' && Math.floor(Math.max(0, G.argent) / 150) < SACS_POUR_DORMIR) place = 'coussin';
  const P = PLACES_SOMMEIL[place], pose = P.poses[Math.floor(hachage(G.jour, 13, 6152) * P.poses.length) % P.poses.length];
  return { place, pose, piece: P.piece };
}
// Dans cette pièce-ci ? (au bureau, s'il dormait sur la chaise et que tu y es déjà assis : il est descendu sur le tapis)
function chatDortIci(G, piece, { chaiseLibre = true } = {}) {
  const d = sommeilDuChat(G);
  if (!d || d.piece !== piece) return null;
  if (d.place === 'chaise' && !chaiseLibre) return { place: 'tapis', pose: 'boule', piece };
  return d;
}

// --- Les poses de sommeil (en plus de la boule de creerChatHD) : étalé sur le flanc, sur le dos ; deux images chacune
// (il respire). Mêmes pelage, yeux et collier que ses autres poses. ---
function texturesSommeilChat(scene, look) {
  const pref = creerChatHD(scene, look);
  if (scene.textures.exists(pref + '_etale0')) return pref;
  const P = PELAGES_CHAT[look.pelage] || PELAGES_CHAT.gris, Y = YEUX_CHAT[look.yeux] || YEUX_CHAT.vert, C = COLLIERS_CHAT[look.collier] || COLLIERS_CHAT.aucun;
  const pelage = t => {
    t.rampes.poil = rampe(P.poil); t.rampes.ventre = rampe(P.ventre);
    if (P.taches) t.rampes.tache = rampe(P.taches);
    if (P.masque) t.rampes.masque = rampe(P.masque);
    t.rampes.oeil = rampe(Y.couleur);
    if (C.couleur) t.rampes.collier = rampe(C.couleur);
  };
  const rayures = P.rayures ? (x, y) => ((x + Math.floor(y / 2)) % 5 === 0 ? -1 : 0) : (x, y) => (hachage(x, y, 17) > 0.9 ? -0.4 : 0);
  const finir = (t, tete, pattes) => {
    if (P.taches) for (let y = 0; y < t.h; y++) for (let x = 0; x < t.l; x++) if (t.mat(x, y) === 'poil' && fbm(x * 0.22, y * 0.22, 433) > 0.56) t.poser(x, y, 'tache', t.k[y * t.l + x]);
    if (P.masque) {
      for (let y = 0; y < t.h; y++) for (let x = 0; x < t.l; x++) if (t.mat(x, y) === 'poil' && Math.hypot(x + 0.5 - tete[0], y + 0.5 - tete[1]) < 4.6) t.poser(x, y, 'masque', Math.max(0, t.k[y * t.l + x] - 1));
      for (const [px, py] of pattes) for (let y = py - 1; y <= py + 1; y++) for (let x = px - 1; x <= px + 1; x++) if (t.mat(x, y) === 'poil') t.poser(x, y, 'masque', t.k[y * t.l + x]);
    }
    t.contour();
  };
  const oreilles = (t, pts, bas = false) => { for (const ox of pts) t.forme('poil', (x, y) => {
    const h = bas ? y - pts.y0 : pts.y0 - y; return h >= 0 && h <= 3 && Math.abs(x + 0.5 - ox) <= (3 - h) * 0.6 + 0.3 ? [0, bas ? 0.6 : -0.6, 0.8] : null; }, { decalage: 0.3 }); };
  const collier = (t, pts) => { if (!C.couleur) return; for (const [x, y] of pts) if (t.mat(x, y)) t.poser(x, y, 'collier', 3); };
  // Étalé : couché sur le flanc de tout son long, les pattes allongées devant lui, la tête posée à plat, la queue droite
  for (const [k, g] of [[0, 0], [1, 0.5]]) {
    const t = toileDecor(46, 18); pelage(t);
    traitHD(t, 'poil', [[11, 13.5], [5, 15], [1.5, 14.5]], 1.3, 0.1);                         // la queue, posée derrière
    traitHD(t, 'poil', [[14, 13], [10.5, 16.2]], 1.2); traitHD(t, 'poil', [[17, 14], [14, 16.6]], 1.2);   // les pattes de derrière
    t.forme('poil', ellipsoide(22, 11.8 - g * 0.3, 12, 4.4 + g * 0.5), { motif: rayures });   // le corps, sur le flanc
    t.forme('ventre', ellipsoide(23, 14.6, 8.5, 1.4), { decalage: 0.3 });
    traitHD(t, 'poil', [[30, 13], [36, 15.2], [40.5, 15.6]], 1.15); traitHD(t, 'poil', [[29, 14.5], [34, 16.6], [38, 16.8]], 1.15);   // les pattes de devant, tendues
    t.forme('poil', ellipsoide(36.5, 10.4, 4.3, 3.6), { decalage: 0.2 });                     // la tête, posée
    const o = [34.5, 38.5]; o.y0 = 7; oreilles(t, o);
    t.forme('ventre', ellipsoide(39.5, 11.6, 2.2, 1.5), { decalage: 0.2 });
    for (const x of [36, 37]) t.poser(x, 10, 'encre', 1);                                      // l'œil fermé
    t.poser(41, 11, 'verreRouge', 4);
    collier(t, [[32, 10], [32, 11], [32, 12], [33, 12]]);
    finir(t, [36.5, 10.4], [[10, 16], [14, 16], [40, 15], [38, 16]]);
    t.texture(scene, pref + '_etale' + k);
  }
  // Sur le dos : le ventre en l'air, les pattes repliées vers le plafond, la tête renversée sur le côté, la queue en crosse
  for (const [k, g] of [[0, 0], [1, 0.5]]) {
    const t = toileDecor(40, 20); pelage(t);
    traitHD(t, 'poil', [[29, 16], [35, 17.5], [38, 14.5]], 1.3, 0.1);                         // la queue
    t.forme('poil', ellipsoide(19, 14.4, 11, 4.6), { motif: rayures });                       // le dos, contre le sol
    t.forme('ventre', ellipsoide(19.5, 12 - g * 0.3, 8.5, 2.6 + g * 0.4), { decalage: 0.5 });  // le ventre clair, en l'air
    // les pattes de devant repliées sur la poitrine, celles de derrière ouvertes, pliées au genou (le bout blanc des doigts)
    for (const pts of [[[12.5, 11.2], [12, 8], [9.6, 7.4]], [[15.5, 10.4], [15.6, 7.6], [13.4, 6.6]], [[24, 10.4], [25.2, 7.8], [27.6, 8.2]], [[27, 11.4], [29.6, 9.4], [31.6, 10.6]]]) {
      traitHD(t, 'poil', pts, 1.05); const [x, y] = pts[2]; t.forme('ventre', ellipsoide(x, y, 1.1, 1), { decalage: 0.3 });
    }
    t.forme('poil', ellipsoide(6.5, 14.2, 4.3, 3.7), { decalage: 0.2 });                      // la tête renversée
    const o = [4.5, 8.5]; o.y0 = 17; oreilles(t, o, true);
    t.forme('ventre', ellipsoide(4.4, 12.2, 2, 1.5), { decalage: 0.2 });
    for (const x of [6, 7]) t.poser(x, 14, 'encre', 1);
    t.poser(3, 12, 'verreRouge', 4);
    collier(t, [[10, 12], [10, 13], [11, 13], [11, 14]]);
    finir(t, [6.5, 14.2], [[11, 5], [16, 5], [25, 5], [29, 6]]);
    t.texture(scene, pref + '_surDos' + k);
  }
  return pref;
}
const IMAGES_SOMMEIL = { boule: '_dort', etale: '_etale', surDos: '_surDos' };

// Le chat endormi à son endroit : `ou` { x, bas, prof, flip } ; il respire ; un clic : `clic` (ou il miaule)
function poserChatEndormi(scene, d, ou, { echelle = 2.4, clic = null } = {}) {
  const G = window.GAME, look = lookChat(G), pref = texturesSommeilChat(scene, look), im = IMAGES_SOMMEIL[d.pose] || '_dort';
  const chat = scene.add.image(ou.x, ou.bas, pref + im + '0').setOrigin(0.5, 1).setScale(echelle).setDepth(ou.prof).setFlipX(!!ou.flip);
  chat.place = d.place; chat.pose = d.pose; chat.pref = pref; chat.endormi = true;
  let souffle = 0;
  chat.respire = scene.time.addEvent({ delay: 1100 + Math.floor(hachage(G.jour, 3, 6153) * 300), loop: true, callback: () => {
    if (chat.active && chat.endormi) chat.setTexture(pref + (IMAGES_SOMMEIL[chat.pose] || '_dort') + (++souffle % 2)); } });
  if (clic !== false) chat.setInteractive({ useHandCursor: true, pixelPerfect: true }).on('pointerdown', () => {
    if (!chat.endormi) return;
    if (clic) return clic(chat);
    if (typeof Son !== 'undefined') Son.jouer('miaou');
  });
  return chat;
}

// Tu as besoin de sa place : il ouvre un œil, s'assoit, saute à terre et va se recoucher plus loin (en boule).
// `saut` : où il retombe { x, bas, prof } ; `lit` : où il se recouche { x, bas, prof }. Renvoie une promesse.
function chatVaDormirAilleurs(scene, chat, saut, lit) {
  return new Promise(fini => {
    if (!chat || !chat.active) return fini();
    const pref = chat.pref, E = chat.scaleX;
    chat.endormi = false; chat.disableInteractive();
    const t = (ms, f) => scene.time.delayedCall(ms, f);
    chat.setTexture(pref + '_assis0').setFlipX(saut.x < chat.x);
    if (typeof Son !== 'undefined') t(120, () => Son.jouer('miaou'));
    t(520, () => {
      if (!chat.active) return fini();
      // le bond : un arc, de la chaise au plancher
      chat.setTexture(pref + '_tapi');
      t(160, () => {
        if (!chat.active) return fini();
        chat.setTexture(pref + '_bond');
        const x0 = chat.x, y0 = chat.y, haut = Math.min(y0, saut.bas) - 26;
        scene.tweens.addCounter({ from: 0, to: 1, duration: 360, onUpdate: tw => { const u = tw.getValue();
          chat.x = x0 + (saut.x - x0) * u; chat.y = (1 - u) * (1 - u) * y0 + 2 * u * (1 - u) * haut + u * u * saut.bas; },
          onComplete: () => {
            if (!chat.active) return fini();
            chat.setDepth(saut.prof).setTexture(pref + '_tapi');
            // il trotte jusqu'au tapis (ses quatre pattes vont avec ses pas), et se roule en boule
            t(140, () => {
              if (!chat.active) return fini();
              chat.setFlipX(lit.x < chat.x);
              let k = 0; const pas = scene.time.addEvent({ delay: 110, loop: true, callback: () => { if (chat.active) chat.setTexture(pref + '_m' + (++k % 4)); } });
              const d = Math.hypot(lit.x - chat.x, lit.bas - chat.y);
              scene.tweens.add({ targets: chat, x: lit.x, y: lit.bas, duration: Math.max(200, d / 0.16), onComplete: () => {
                pas.remove();
                if (!chat.active) return fini();
                chat.setDepth(lit.prof).setTexture(pref + '_assis0');
                t(380, () => { if (!chat.active) return fini(); chat.pose = 'boule'; chat.place = 'tapis'; chat.endormi = true; chat.setTexture(pref + '_dort0'); if (chat.input) chat.setInteractive(); fini(); });
              } });
            });
          } });
      });
    });
  });
}

// --- L'arrière-boutique ---
// (le vieux buffet : quand il y dort, le panier des cadeaux est posé par terre, à côté, pour lui laisser la place ;
// le panier des cadeaux : seulement quand il est vide, il se couche dedans ; ni l'un ni l'autre quand le coin des
// chats est installé ici : son arbre et sa cabane prennent le plancher devant le buffet)
function placeChatArriere(G, d) {
  const S = SOL_ARRIERE, coin = typeof coinDesChats === 'function' && (coinDesChats(G) || {}).lieu === 'arriere';
  const cadeaux = Object.values(G.cadeaux || {}).reduce((a, b) => a + b, 0);
  if ((d.place === 'buffet' && coin) || (d.place === 'panier' && (coin || cadeaux > 0))) d = { ...d, place: 'coussin', pose: 'boule' };
  return { d, ou: {
    coussin: { x: 200, bas: S + 76, prof: 0.4 },
    panier: { x: 562, bas: S - 70, prof: 1.25, rebord: S - 83, echelle: 2.2 },   // (dans le panier, roulé plus serré : le bas de son corps derrière l'osier)
    buffet: { x: 572, bas: S - 56, prof: 1.25 },
    sacs: { x: 900, bas: S - 8, prof: 2.05 },
  }[d.place] };
}
// Il dort ailleurs que sur son coussin (ou que dans le grand panier du coin des chats) aujourd'hui ?
function chatAilleursQueSonCoussin(G) { const d = sommeilDuChat(G); if (!d) return false; return d.piece !== 'arriere' || placeChatArriere(G, d).d.place !== 'coussin'; }
// Où est posé le panier des cadeaux : sur le buffet, ou par terre à côté quand le chat dort sur le buffet
function placePanierCadeaux(scene) {
  const G = window.GAME, d = scene.scene.key !== 'Promenade' && sommeilDuChat(G);
  if (d && d.piece === 'arriere' && placeChatArriere(G, d).d.place === 'buffet') return [497, SOL_ARRIERE + 26];
  return [562, SOL_ARRIERE - 62];
}
// Le chat endormi à sa place du jour, dans l'arrière-boutique (`saufCoussin` : son coussin est dessiné à part).
// Renvoie l'image, ou null s'il dort ailleurs (dans le bureau, ou sur son coussin quand `saufCoussin`).
function poserChatArriere(scene, { saufCoussin = false } = {}) {
  const G = window.GAME, d0 = scene.scene.key !== 'Promenade' && chatDortIci(G, 'arriere');
  if (!d0) return null;
  const { d, ou } = placeChatArriere(G, d0);
  if (d.place === 'coussin' && saufCoussin) return null;
  const dansPanier = d.place === 'panier';
  // (dans le panier, on le laisse au panier : un clic sur le panier l'ouvre, comme avant)
  const chat = poserChatEndormi(scene, d, ou, { echelle: ou.echelle || 2.4, clic: dansPanier ? false : () => { if (typeof Son !== 'undefined') Son.jouer('miaou'); if (typeof ouvrirPanneauChat === 'function') ouvrirPanneauChat(scene); } });
  if (dansPanier) { const h = chat.frame.height, haut = ou.bas - h * chat.scaleY; chat.setCrop(0, 0, chat.frame.width, Math.max(1, Math.round((ou.rebord - haut) / chat.scaleY))); }
  return chat;
}
