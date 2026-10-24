// (planche 65 v2, à valider) Les chapeaux du chat. Quatre au départ, au rayon des chats de Marcelline ; les autres se
// trouvent de par le monde : portés par quelqu'un (on peut les échanger), perdus, cachés, ou rapportés d'une mission.
// Le carnet des chapeaux les montre en silhouette « ? » avec un indice, jusqu'à ce qu'on les trouve. Chacun se dessine
// dans la même toile que le chat (mêmes contours), posé sur sa tête : cx, cy est le centre de la tête (le museau à droite).
// `pourElle` : pour sa compagne ; `refuse` : il ne le portera jamais ; `ou` : comment on le trouve.
const OU_CHAPEAU = { marcelline: '🧵 Au rayon des chats', porte: '🧑 Porté par quelqu’un', perdu: '🎩 Perdu, oublié', cache: '🔍 Caché', mission: '🗺 Rapporté de mission', parrain: '🕴 Il se mérite' };
const CHAPEAUX_CHAT = {
  beret: { nom: 'Le béret', c: [0x1c1c24], ou: 'marcelline', prix: 14, replique: '« Ça me donne un air d’artiste. »' },
  bonnet: { nom: 'Le bonnet à pompon', c: [0xb02a2a, 0xeae0cc, 0xf4ecdc], ou: 'marcelline', prix: 10, replique: '« Il gratte. Mais mes oreilles te disent merci. »', saison: 'hiver' },
  gavroche: { nom: 'La casquette de gavroche', c: [0x6a5238, 0x4a3828], ou: 'marcelline', prix: 12, replique: '« Comme au bon vieux temps, dans la rue. »' },
  bonnetNuit: { nom: 'Le bonnet de nuit', c: [0x3a5a9a, 0xe8e4dc, 0xf4ecdc], ou: 'marcelline', prix: 8, replique: '« Pour dormir. Et seulement pour dormir. »' },
  paille: { nom: 'Le canotier de paille', c: [0xd8b860, 0x2a3a6a], ou: 'porte', indice: 'Une hobbite de la Comté le porte aux moissons. Elle l’échangerait bien.', replique: '« L’été, un chat a le droit d’avoir de l’allure. »', saison: 'ete' },
  melon: { nom: 'Le chapeau melon', c: [0x1e1e24, 0x5a3a24], ou: 'perdu', indice: 'Un client de la Banque l’oublie parfois sur le banc, en sortant.', replique: '« Très distingué. Je garde. »' },
  sherlock: { nom: 'La casquette de détective', c: [0x8a6a48, 0x5a3a20], ou: 'porte', indice: 'L’inspecteur de la Garde ne la quitte jamais... sauf contre un tuyau.', replique: '« Élémentaire, mon cher. »' },
  fez: { nom: 'Le fez', c: [0xa82020, 0x18161a], ou: 'cache', indice: 'Quelque chose de rouge dépasse des tonneaux, au marché.', replique: '« Je ne sais pas d’où il vient. Je l’adore. »' },
  tricorne: { nom: 'Le tricorne de pirate', c: [0x201c1c, 0xc9a227, 0xf0ece0], ou: 'mission', indice: 'Une épave, du côté de Port-Brisant. Un aventurier pourrait le rapporter.', replique: '« Moussaillon ! Hisse le cigare ! »' },
  hautDeForme: { nom: 'Le haut-de-forme', c: [0x16161a, 0x7a1a24], ou: 'perdu', indice: 'Un noble pressé l’oubliera bien un jour sur ton comptoir.', replique: '« Enfin un chapeau à ma hauteur. »' },
  couronne: { nom: 'La couronne de fleurs', c: [0xe87aa0, 0xf4d860, 0xf4f0e8, 0x4a8a3a], ou: 'mission', pourElle: true, indice: 'Les guérisseuses du Vallon en tressent pour qui les aide.', replique: 'Elle la garde toute la journée, et ne laisse personne y toucher.' },
  sorcier: { nom: 'Le chapeau pointu', c: [0x4a2a7a, 0xf4d860], ou: 'porte', refuse: true, indice: 'Un mage de passage au comptoir en porte un. Ton chat le reconnaît... (un éclat de vérité ?)', replique: 'Il crache. « Jamais. Plutôt mourir. »' },
  borsalino: { nom: 'Le borsalino', c: [0x2c2c32, 0x0e0e10], ou: 'parrain', indice: 'Il ne se vend pas. Il ne se trouve pas. Il se mérite.', replique: '« ... »' },
};
// (pour plus tard, quand ces lieux s'ouvriront) d'autres chapeaux à cacher dans le monde, sans dessin pour l'instant
const CHAPEAUX_A_VENIR = [
  { nom: 'Le chapeau conique des pandas', indice: 'Les Monts de Bambou (★4)' },
  { nom: 'Le casque à cornes des nains', indice: 'Les Pics Gelés' },
  { nom: 'La toque du petit bar', indice: 'Le cuisinier de ton bar, un soir de fête' },
];

function dessinerChapeauChat(t, cle, cx, cy) {
  const C = CHAPEAUX_CHAT[cle]; if (!C) return;
  C.c.forEach((c, i) => { t.rampes['chap' + (i + 1)] = rampe(c); });
  // un cylindre (ombré de gauche à droite), entre x0 et x1, de y0 à y1 ; `large(y)` : sa demi-largeur à cette hauteur
  const cylindre = (xc, y0, y1, large) => (x, y) => {
    if (y + 0.5 < y0 || y + 0.5 > y1) return null;
    const r = typeof large === 'function' ? large(y + 0.5) : large, nx = (x + 0.5 - xc) / r;
    return Math.abs(nx) > 1 ? null : [nx, -0.15, Math.sqrt(1 - nx * nx)];
  };
  const dessous = y0 => (x, y) => y + 0.5 <= y0;
  const bord = (rx, ry = 1.1, dy = -4.3, mat = 'chap1') => t.forme(mat, ellipsoide(cx, cy + dy, rx, ry), { decalage: -0.15 });
  if (cle === 'beret') {
    t.forme('chap1', ellipsoide(cx - 0.6, cy - 5.4, 5.7, 2.3), { motif: (x, y) => (hachage(x, y, 71) > 0.85 ? -0.4 : 0) });
    t.forme('chap1', ellipsoide(cx - 5.2, cy - 4.3, 1.7, 1.5), { decalage: -0.3 });   // (il retombe en arrière)
    t.poser(cx, cy - 8, 'chap1', 2); t.poser(cx, cy - 9, 'chap1', 3);
  } else if (cle === 'bonnet') {
    t.forme('chap1', ellipsoide(cx, cy - 4.8, 5.4, 4.3, dessous(cy - 3)), { motif: (x, y) => (x % 2 ? -0.35 : 0.2) });   // (les côtes du tricot)
    t.forme('chap2', cylindre(cx, cy - 4.4, cy - 2.4, 5.6), { motif: (x, y) => ((x + y) % 2 ? -0.3 : 0.2) });
    t.forme('chap3', ellipsoide(cx, cy - 9.8, 2, 1.9), { motif: (x, y) => (hachage(x, y, 72) > 0.6 ? -0.5 : 0) });
  } else if (cle === 'bonnetNuit') {
    t.forme('chap1', ellipsoide(cx, cy - 4.8, 5.3, 3.6, dessous(cy - 3)));
    traitHD(t, 'chap1', [[cx - 1, cy - 7], [cx - 4, cy - 9.6]], 2.3);
    traitHD(t, 'chap1', [[cx - 4, cy - 9.6], [cx - 7.2, cy - 8.6]], 1.7);
    traitHD(t, 'chap1', [[cx - 7.2, cy - 8.6], [cx - 9.2, cy - 5.6]], 1.1);
    for (let y = 0; y < t.h; y++) for (let x = 0; x < t.l; x++) if (t.mat(x, y) === 'chap1' && (x - y + 400) % 4 === 0) t.poser(x, y, 'chap2', t.teinte(x, y) + 1);   // (les rayures)
    t.forme('chap2', cylindre(cx, cy - 4, cy - 2.4, 5.5));
    t.forme('chap3', ellipsoide(cx - 9.5, cy - 4.6, 1.6, 1.6));
  } else if (cle === 'gavroche') {
    t.forme('chap1', ellipsoide(cx - 0.4, cy - 5.2, 5.6, 2.5, dessous(cy - 3.4)), { motif: (x, y) => ((x + y) % 3 === 0 ? -0.5 : (x - y) % 3 === 0 ? 0.3 : 0) });   // (le tweed)
    t.forme('chap2', ellipsoide(cx + 5.4, cy - 3.8, 3.4, 0.95), { decalage: -0.2 });   // (la visière)
    t.poser(cx - 0.4, cy - 7.6, 'chap2', 3);
  } else if (cle === 'paille') {
    bord(8.2, 1.3);
    t.forme('chap1', cylindre(cx, cy - 8.6, cy - 4.4, 3.9), { motif: (x, y) => (y % 2 ? -0.35 : 0.15) });
    t.forme('chap2', cylindre(cx, cy - 6.4, cy - 5, 4));
    t.forme('chap1', ellipsoide(cx, cy - 8.7, 3.9, 0.8), { decalage: 0.5 });
  } else if (cle === 'melon') {
    bord(6.6, 1.1);
    t.forme('chap1', ellipsoide(cx, cy - 6.3, 4.3, 3.3, dessous(cy - 4.4)), { decalage: 0.1 });
    t.forme('chap2', cylindre(cx, cy - 5.6, cy - 4.6, 4.3));
  } else if (cle === 'sherlock') {
    t.forme('chap1', ellipsoide(cx + 5.4, cy - 3.8, 2.6, 0.95), { decalage: -0.2 });
    t.forme('chap1', ellipsoide(cx - 5.4, cy - 3.8, 2.6, 0.95), { decalage: -0.3 });
    t.forme('chap1', ellipsoide(cx, cy - 5.4, 5.4, 3.5, dessous(cy - 3.3)), { motif: (x, y) => (x % 3 === 0 || y % 3 === 0 ? -0.6 : 0) });   // (les carreaux)
    for (const [dx, dy] of [[-1, -9], [0, -9], [1, -9], [0, -8]]) t.poser(cx + dx, cy + dy, 'chap2', 3);   // (les rabats noués sur le dessus)
  } else if (cle === 'fez') {
    t.forme('chap1', cylindre(cx, cy - 10.4, cy - 4.2, y => 2.3 + (y - (cy - 10.4)) / 6.2 * 1.4));
    t.forme('chap1', ellipsoide(cx, cy - 10.4, 2.3, 0.7), { decalage: -0.5 });
    traitHD(t, 'chap2', [[cx, cy - 10.6], [cx - 2.4, cy - 10.3], [cx - 3.6, cy - 7.4]], 0.55);
    t.forme('chap2', ellipsoide(cx - 3.7, cy - 6.4, 0.9, 1.4));
  } else if (cle === 'tricorne') {
    t.forme('chap1', ellipsoide(cx, cy - 5.6, 7, 2.6, dessous(cy - 3.6)));
    for (const [dx, dy] of [[-6.4, -7], [5.8, -6.8]]) t.forme('chap1', ellipsoide(cx + dx, cy + dy, 1.7, 2.1));   // (les deux cornes relevées)
    t.forme('chap1', ellipsoide(cx + 1.5, cy - 4.1, 2.2, 1.2), { decalage: -0.3 });                              // (la corne de devant)
    for (let x = 0; x < t.l; x++) for (let y = 0; y < t.h; y++) if (t.mat(x, y) === 'chap1') { t.poser(x, y, 'chap2', 4); break; }   // (le galon doré)
    t.poser(cx, cy - 6, 'chap3', 4); t.poser(cx - 1, cy - 5, 'chap3', 2); t.poser(cx + 1, cy - 5, 'chap3', 2);   // (une petite tête de mort)
  } else if (cle === 'hautDeForme') {
    bord(7, 1.2);
    t.forme('chap1', cylindre(cx, cy - 15.2, cy - 4.4, y => 3.6 + Math.max(0, (cy - 12 - y) * 0.12)), { decalage: 0.1 });
    t.forme('chap2', cylindre(cx, cy - 7.2, cy - 5.6, 3.7));
    t.forme('chap1', ellipsoide(cx, cy - 15.2, 3.9, 0.9), { decalage: 0.6 });
  } else if (cle === 'couronne') {
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2, x = Math.round(cx + Math.cos(a) * 5.2), y = Math.round(cy - 4.8 + Math.sin(a) * 1.4), devant = Math.sin(a) > -0.2;
      if (k % 3 === 2) { t.poser(x, y, 'chap4', 3); continue; }
      const m = ['chap1', 'chap2', 'chap3'][k % 3];
      for (const [dx, dy, i] of [[0, 0, 5], [-1, 0, 3], [1, 0, 3], [0, -1, 4], [0, 1, 2]]) if (devant || dx === 0) t.poser(x + dx, y + dy, m, i);
    }
  } else if (cle === 'sorcier') {
    bord(7, 1.2);
    t.forme('chap1', (x, y) => {
      const yy = y + 0.5; if (yy < cy - 18.5 || yy > cy - 4.4) return null;
      const u = (cy - 4.4 - yy) / 14.1, xc = cx - u * u * 4.5, r = (1 - u) * 4.4 + 0.3, nx = (x + 0.5 - xc) / r;
      return Math.abs(nx) > 1 ? null : [nx, -0.2, Math.sqrt(1 - nx * nx)];
    });
    t.forme('chap2', cylindre(cx, cy - 6.6, cy - 5.3, 4.2));
    for (const [dx, dy] of [[-1, -10], [1, -8], [-2, -13]]) t.poser(cx + dx, cy + dy, 'chap2', 5);
  } else if (cle === 'borsalino') {
    bord(7.3, 1.2);
    t.forme('chap1', ellipsoide(cx - 0.2, cy - 6.5, 4.4, 3.1, dessous(cy - 4.6)), { decalage: 0.1 });
    t.poser(cx - 0.2, cy - 9, 'chap1', 1); t.poser(cx + 1, cy - 9, 'chap1', 1);   // (le creux du dessus, pincé)
    t.forme('chap2', cylindre(cx, cy - 6, cy - 4.8, 4.4));
  }
}

// Le chapeau seul (pour le poser sur les autres poses du chat, ou le pendre au porte-manteau)
function textureChapeauSeul(scene, cle) {
  const k = 'chapeauChat_' + cle;
  if (scene.textures.exists(k)) return k;
  const t = toileDecor(24, 26);
  dessinerChapeauChat(t, cle, 12, 22);
  t.contour(); t.texture(scene, k);
  return k;
}
