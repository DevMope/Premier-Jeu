// (v0.80) Les repères au loin des récits, peints en pixel art : on voit de quoi ils sont faits
// (les blocs de grès de la pyramide, les rondins de la palissade, la paille des meules, la toile
// des ailes du moulin...). Chacun est une texture posée au fond du plan moyen, derrière les arbres.
// Les couleurs restent franches pour se détacher du paysage (un tout petit voile de lointain).

const RAMPES_REPERES = {
  paille: [0x5a4010, 0x8a6620, 0xb88e34, 0xd8b050, 0xecd078, 0xfaeab0],
  gres: [0x5a3c20, 0x8a5e34, 0xb4824a, 0xd0a064, 0xe4bc80, 0xf4d8a4],
  marbre: [0x6a6a74, 0x9a9aa4, 0xc0c0c8, 0xdadae0, 0xececf0, 0xffffff],
  chaume: [0x4a3410, 0x6e5018, 0x927024, 0xb48e38, 0xceaa50, 0xe4c878],
  torchis: [0x6a5a40, 0x9a8a68, 0xc0b08a, 0xd8caa4, 0xe8dcbc, 0xf6eed8],
  tuile: [0x3a1008, 0x5e1a10, 0x8a2a18, 0xae3e24, 0xcc5a34, 0xe68050],
  rondin: [0x1e120a, 0x34200e, 0x4c3016, 0x664420, 0x845a2e, 0xa47442],
  vert: [0x0e2410, 0x1a3a1a, 0x285624, 0x3a7430, 0x56963e, 0x80bc5c],
  vertPorte: [0x0a2a14, 0x14421e, 0x206028, 0x2e8036, 0x48a04c, 0x78c878],
  roche: [0x1a1a1e, 0x2e2e34, 0x46464e, 0x606068, 0x7e7e88, 0xa0a0aa],
  rochesombre: [0x101014, 0x1c1c22, 0x2a2a32, 0x3a3a44, 0x4e4e5a, 0x666674],
  or: [0x4a3008, 0x7a5410, 0xb08018, 0xd8a830, 0xf0cc58, 0xfff0a0],
  braiseR: [0x3a0806, 0x6a1208, 0xa0200c, 0xd04010, 0xf47a20, 0xffc060],
  peau: [0x3a2414, 0x5e3e22, 0x7e5832, 0x9e7444, 0xbc925e, 0xd8b480],
  plume: [0x3a0808, 0x6a1010, 0xa01c14, 0xc83a24, 0xe86a40, 0xffa070],
  os: [0x6a6250, 0x9a9078, 0xc0b89c, 0xd8d0b8, 0xece6d4, 0xfcf8ec],
  eau: [0x14284a, 0x1e3a66, 0x2a5084, 0x3a68a4, 0x5a88c0, 0x8ab0dc],
  opale: [0x4a3a7a, 0x6a5aa8, 0x8a80cc, 0xaca4e4, 0xd0c8f4, 0xf4f0ff],
  pierreBleue: [0x16161e, 0x22222e, 0x323244, 0x46465c, 0x5e5e78, 0x7a7a96],
  lumiere: [0x6a4a10, 0xa07420, 0xd0a030, 0xf0c848, 0xf8e080, 0xfff8c8],
  minerai: [0x3a0806, 0x601010, 0x902018, 0xc03424, 0xe25838, 0xff8a60],
  neige: [0x7a8a9a, 0xa4b4c4, 0xc4d2e0, 0xdce6f0, 0xeef4fa, 0xffffff],
  toileVoile: [0x6a5a44, 0x9a8a6c, 0xbcae8e, 0xd6caa8, 0xe8dec0, 0xf6f0dc],
};

function toileRepere(l, h) {
  const t = toileDecor(l, h);
  Object.assign(t.rampes, RAMPES_REPERES);
  return t;
}

// (v1.63) Un arbre peint par arbresHD.js dans la toile d'un repère (les rampes de l'essence, suffixées : plusieurs
// essences et saisons peuvent cohabiter dans une même toile)
function arbreDansRepere(t, suffixe, { espece = 'chene', saison = 'moissons', couleur = null, assombrir = 0, feuilles = null, ...o }) {
  const R = rampesArbre(saison, espece, couleur);
  if (feuilles) [R.arbFeuA, R.arbFeuB, R.arbFeuC] = feuilles.map(c => rampe(c));   // (des feuilles de la couleur du repère)
  for (const k in R) t.rampes[k + suffixe] = assombrir ? R[k].map(c => melangeCouleur(c, 0x0c0a14, assombrir)) : R[k];   // (assombrir : sous la lune)
  peindreArbre((x, y, m, i) => { if (x >= 0 && y >= 0 && x < t.l && y < t.h) t.poser(x, y, m + suffixe, i); }, { espece, saison, ...o });
}
// la saison des arbres des repères (celle de l'année ; la contrée décide s'il neige)
function saisonRepere() { return typeof saisonActuelle === 'function' ? saisonActuelle() : 'moissons'; }

// Remplir une zone, pixel par pixel, avec un ton choisi par une fonction
function remplir(t, mat, dedans, ton) {
  for (let y = 0; y < t.h; y++) for (let x = 0; x < t.l; x++) if (dedans(x, y)) t.poser(x, y, mat, ton(x, y));
}
// Un appareil de blocs taillés : les joints de mortier, des blocs un peu plus clairs ou plus sombres
function tonBlocs(x, y, bl, bh, base = 3, eclaire = null) {
  const rang = Math.floor(y / bh), dx = (x + (rang % 2) * Math.floor(bl / 2)) % bl, dy = y % bh;
  if (dy === 0 || dx === 0) return 1;                       // le joint
  const var_ = Math.floor(hachage(Math.floor((x + (rang % 2) * Math.floor(bl / 2)) / bl), rang, 77) * 3) - 1;
  return Math.max(0, Math.min(5, base + var_ + (dy === 1 ? 1 : 0) + (eclaire ? eclaire(x, y) : 0)));
}
function ligne(t, mat, ton, x0, y0, x1, y1, ep = 1) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
  for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; for (let a = -ep / 2; a < ep / 2; a++) for (let b = -ep / 2; b < ep / 2; b++) t.poser(Math.round(x + a), Math.round(y + b), mat, ton); }
}

const REPERES_HD = {
  // Les meules de foin dorées, et une porte ronde de hobbit creusée dans la colline
  meules: { l: 220, h: 80, dessin(t) {
    // la colline et sa porte ronde
    remplir(t, 'vert', (x, y) => (y >= 80 - 50 * Math.sqrt(Math.max(0, 1 - ((x - 160) / 60) ** 2))) && x > 100, (x, y) => (x < 150 ? 4 : 3) - (y > 70 ? 1 : 0) + ((x * 7 + y * 3) % 9 === 0 ? 1 : 0));
    t.forme('vertPorte', ellipsoide(160, 62, 11, 11), { decalage: 0.2 });
    for (let a = 0; a < 6.28; a += 0.25) t.poser(Math.round(160 + Math.cos(a) * 12), Math.round(62 + Math.sin(a) * 12), 'rondin', 2);
    t.forme('or', ellipsoide(160, 62, 1.6, 1.6), { decalage: 0.5 });
    for (let x = 150; x <= 170; x++) for (let y = 72; y < 80; y++) t.poser(x, y, 'rondin', 3);   // le seuil
    t.forme('tuile', boite(176, 52, 184, 60, 1), { decalage: 0.2 }); t.forme('lumiere', boite(178, 54, 182, 58, 0.5), { decalage: 1 });   // une fenêtre ronde éclairée
    // trois meules de foin, la paille en stries
    for (const [cx, r] of [[30, 20], [70, 16], [104, 13]]) {
      t.forme('paille', (x, y) => { const dx = x + 0.5 - cx, dy = y + 0.5 - (80 - r); return (dy <= 0 ? dx * dx + dy * dy * 1.3 <= r * r : Math.abs(dx) <= r && dy <= r) ? [dx / r, dy / r, 0.8] : null; },
        { motif: (x, y) => ((x * 3 + y * 7) % 5 === 0 ? -0.7 : (x + y * 2) % 7 === 0 ? 0.6 : 0) });
      for (let x = cx - r; x <= cx + r; x++) t.poser(x, 80 - r + 4, 'paille', 1);   // la corde
    }
  } },
  // Le moulin à vent : la tour de pierre, le toit de bardeaux, les quatre ailes de bois et de toile
  moulin: { l: 150, h: 170, dessin(t) {
    remplir(t, 'pierre', (x, y) => y >= 70 && y < 170 && Math.abs(x + 0.5 - 75) < 18 + (y - 70) * 0.12, (x, y) => tonBlocs(x, y, 8, 5, 3, (x) => (x < 72 ? 1 : x > 84 ? -1 : 0)));
    remplir(t, 'tuile', (x, y) => y >= 46 && y < 72 && Math.abs(x + 0.5 - 75) < (y - 44) * 0.85, (x, y) => ((y % 4) === 0 ? 1 : 3) + (x < 72 ? 1 : 0));
    t.forme('rondin', boite(68, 140, 82, 170, 2), { decalage: 0 });   // la porte
    t.forme('rondin', boite(70, 100, 80, 110, 1), { decalage: -0.2 }); t.forme('lumiere', boite(72, 102, 78, 108, 0.5), { decalage: 1 });
    // les ailes : un longeron de bois, une grille, la toile tendue
    for (let k = 0; k < 4; k++) {
      const a = k * Math.PI / 2 + 0.35, ca = Math.cos(a), sa = Math.sin(a), px = -sa, py = ca;
      ligne(t, 'rondin', 2, 75, 56, 75 + ca * 70, 56 + sa * 70, 2);
      for (let d = 18; d <= 68; d++) for (let w = 2; w <= 12; w++) {
        const x = Math.round(75 + ca * d + px * w), y = Math.round(56 + sa * d + py * w);
        t.poser(x, y, 'toileVoile', (d % 10 === 0 || w === 12 || w === 2) ? 1 : (w < 7 ? 4 : 3));
      }
    }
    t.forme('rondin', ellipsoide(75, 56, 5, 5), { decalage: 0.3 });
  } },
  // La chaumière des guérisseuses : torchis et colombages, toit de chaume, cheminée qui fume, potager
  chaumiere: { l: 170, h: 120, dessin(t) {
    remplir(t, 'torchis', (x, y) => x >= 30 && x < 140 && y >= 62 && y < 120, (x, y) => 4 - (x > 120 ? 1 : 0) + ((x * 5 + y * 3) % 13 === 0 ? -1 : 0));
    for (const x of [30, 58, 86, 112, 139]) for (let y = 62; y < 120; y++) t.poser(x, y, 'rondin', 2), t.poser(x + 1, y, 'rondin', 3);
    for (let x = 30; x < 140; x++) { t.poser(x, 62, 'rondin', 2); t.poser(x, 90, 'rondin', 2); }
    for (let k = 0; k < 28; k++) { t.poser(30 + k, 90 - k, 'rondin', 3); t.poser(139 - k, 90 - k, 'rondin', 3); }
    // le toit de chaume, épais et arrondi
    remplir(t, 'chaume', (x, y) => y >= 14 && y < 66 && Math.abs(x + 0.5 - 85) < (y - 10) * 1.32 + 2, (x, y) => (x % 3 === 0 ? 2 : 3) + (y < 24 ? 1 : 0) + (y === 65 ? -2 : 0) + (x < 70 ? 1 : 0));
    t.forme('pierre', boite(112, 6, 124, 30, 1), { decalage: 0.1 });   // la cheminée
    t.forme('rondin', boite(72, 92, 92, 120, 3), { decalage: -0.1 });   // la porte
    for (const fx of [44, 118]) { t.forme('lumiere', boite(fx - 7, 70, fx + 7, 84, 1), { decalage: 0.8 }); ligne(t, 'rondin', 2, fx, 70, fx, 84); ligne(t, 'rondin', 2, fx - 7, 77, fx + 7, 77); }
    // le jardin de simples : des plantes en rangs
    for (let x = 4; x < 166; x += 6) if (x < 28 || x > 142) { remplir(t, 'vert', (px, py) => Math.abs(px - x) < 3 && py >= 108 && py < 120 && (py - 108) >= Math.abs(px - x) * 2, () => 3); t.poser(x, 107, (x / 6) % 3 === 0 ? 'plume' : 'opale', 4); }
  } },
  // L'abbaye : la nef de pierre claire, les contreforts, le grand vitrail, le clocher et sa cloche
  clocher: { l: 230, h: 200, dessin(t) {
    remplir(t, 'platre', (x, y) => x >= 20 && x < 170 && y >= 110 && y < 200, (x, y) => tonBlocs(x, y, 10, 6, 3, (x) => (x < 40 ? 1 : 0)));
    remplir(t, 'ardoise', (x, y) => y >= 76 && y < 112 && x >= 14 + (112 - y) * 0.2 && x < 176 - (112 - y) * 0.2 && Math.abs(x + 0.5 - 95) < (y - 70) * 2.6, (x, y) => (y % 3 === 0 ? 2 : 4) - (x > 130 ? 1 : 0));
    for (const x of [40, 80, 120, 160]) remplir(t, 'platre', (px, py) => px >= x - 3 && px < x + 3 && py >= 120 + (px - x + 3) && py < 200, () => 2);   // les contreforts
    // le grand vitrail en rosace
    t.forme('pierre', ellipsoide(95, 140, 15, 15), { decalage: 0.1 });
    for (let y = 126; y <= 154; y++) for (let x = 81; x <= 109; x++) { const d = Math.hypot(x - 95, y - 140); if (d < 12) t.poser(x, y, ['tuile', 'eau', 'or', 'vert'][(Math.floor(Math.atan2(y - 140, x - 95) * 2.5 + 8) + (d > 6 ? 1 : 0)) % 4], d < 2 ? 5 : 4); }
    t.forme('rondin', boite(84, 168, 106, 200, 8), { decalage: -0.1 });
    // le clocher
    remplir(t, 'platre', (x, y) => x >= 178 && x < 214 && y >= 56 && y < 200, (x, y) => tonBlocs(x, y, 9, 6, 3, (x) => (x < 186 ? 1 : x > 206 ? -1 : 0)));
    remplir(t, 'ardoise', (x, y) => y >= 4 && y < 58 && Math.abs(x + 0.5 - 196) < (y - 2) * 0.42, (x, y) => (x < 196 ? 4 : 2));
    t.forme('rochesombre', boite(186, 72, 206, 96, 9), { decalage: 0 });
    t.forme('or', (x, y) => { const dx = x + 0.5 - 196, dy = y + 0.5 - 86; return dy > -8 && dy < 8 && Math.abs(dx) < 3 + (dy + 8) * 0.35 ? [dx / 7, dy / 8, 0.8] : null; }, { decalage: 0.3 });   // la cloche
    ligne(t, 'fer', 3, 196, 0, 196, 6); ligne(t, 'fer', 3, 193, 2, 199, 2);   // la croix
  } },
  // Le grand chêne millénaire, creux, et la cabane de rondins du bûcheron
  vieuxChene: { l: 220, h: 170, saison: true, dessin(t) {
    // le chêne : un tronc énorme, noueux, creux, et sa couronne
    // (v1.63 : peint comme tous les arbres, arbresHD.js, et de la saison ; le tronc énorme et son creux par-dessus)
    const sa = saisonRepere();
    arbreDansRepere(t, '_vc', { espece: 'chene', saison: sa, cx: 62, base: 168, H: 138, graine: 7, ecartG: 0.75, ecartD: 0.7, mousse: true });
    t.forme('rondin', (x, y) => { const w = 12 + Math.max(0, y - 140) * 0.9 + Math.sin(y * 0.3) * 2; return y >= 112 && y < 170 && Math.abs(x + 0.5 - 60) < w ? [(x - 60) / (w + 2), 0, 0.8] : null; }, { motif: (x, y) => ((x * 3 + Math.floor(y / 3)) % 6 === 0 ? -0.6 : 0) });
    t.forme('rochesombre', ellipsoide(58, 146, 6, 10), { decalage: -0.6 });   // le creux
    // la cabane
    remplir(t, 'rondin', (x, y) => x >= 130 && x < 210 && y >= 120 && y < 170, (x, y) => ((y - 120) % 7 === 0 ? 1 : (y - 120) % 7 === 1 ? 4 : 3));
    for (let y = 120; y < 170; y += 7) { t.forme('rondin', ellipsoide(130, y + 3.5, 3, 3.5), { decalage: 0.5 }); t.forme('rondin', ellipsoide(209, y + 3.5, 3, 3.5), { decalage: 0.2 }); }
    remplir(t, 'chaume', (x, y) => y >= 94 && y < 122 && Math.abs(x + 0.5 - 170) < (y - 90) * 1.7, (x, y) => (x % 4 === 0 ? 2 : 3) + (x < 160 ? 1 : 0));
    t.forme('lumiere', boite(176, 134, 190, 148, 1), { decalage: 0.8 });
    // la souche et sa hache plantée
    t.forme('rondin', boite(112, 154, 128, 170, 3), { decalage: 0.1 }); for (let a = 0; a < 6.28; a += 0.4) t.poser(Math.round(120 + Math.cos(a) * 4), Math.round(156 + Math.sin(a) * 1.5), 'chene', 4);
    ligne(t, 'chene', 4, 120, 154, 130, 140, 2); t.forme('fer', ellipsoide(131, 139, 4, 3), { decalage: 0.4 });
  } },
  // Le pont des trolls : un pont de moellons à trois arches, de la mousse, le panneau du péage, des os
  pont: { l: 300, h: 110, dessin(t) {
    remplir(t, 'pierre', (x, y) => {
      if (y < 30 || y >= 110) return false;
      for (const cx of [60, 150, 240]) { const dx = (x - cx) / 32, dy = (y - 110) / 58; if (dx * dx + dy * dy < 1) return false; }
      return true;
    }, (x, y) => tonBlocs(x, y, 9, 6, 3));
    for (let x = 0; x < 300; x++) { t.poser(x, 30, 'pierre', 5); if ((x * 7) % 5 < 2) t.poser(x, 31 + (x % 3), 'vert', 3); }   // le parapet et la mousse
    for (let x = 0; x < 300; x += 12) t.forme('pierre', boite(x, 20, x + 7, 30, 1), { decalage: 0.2 });   // les créneaux du parapet
    // le panneau du péage, planté au bout du pont
    ligne(t, 'rondin', 2, 280, 0, 280, 30, 2); t.forme('chene', boite(266, 2, 296, 14, 1), { decalage: 0.2 });
    ligne(t, 'tuile', 1, 270, 6, 290, 6); ligne(t, 'tuile', 1, 272, 9, 288, 9);
    for (const [x, y] of [[150, 104], [160, 106], [140, 107]]) t.forme('os', boite(x - 5, y - 1, x + 5, y + 1, 1), { decalage: 0.3 });   // des os sous l'arche
  } },
  // Les totems des chamans : du bois sculpté et peint, des visages, des ailes, des plumes, et une hutte de peaux
  totems: { l: 230, h: 170, dessin(t) {
    // la hutte de peaux, avec ses perches qui dépassent
    remplir(t, 'peau', (x, y) => y >= 90 && y < 170 && Math.abs(x + 0.5 - 180) < (y - 86) * 0.55, (x, y) => (x < 178 ? 4 : 3) + ((x + y) % 9 === 0 ? -1 : 0));
    for (const dx of [-6, 0, 6]) ligne(t, 'rondin', 2, 180 + dx * 0.4, 92, 180 + dx * 1.6, 78);
    for (let y = 110; y < 170; y += 12) for (let x = 160; x < 200; x += 8) if (t.mat(x, y) === 'peau') t.poser(x, y, 'plume', 4);   // les motifs peints
    t.forme('rochesombre', boite(174, 150, 186, 170, 5), { decalage: -0.2 });
    // trois totems
    for (const [cx, h] of [[40, 160], [100, 130], [140, 110]]) {
      const haut = 170 - h;
      remplir(t, 'rondin', (x, y) => y >= haut && Math.abs(x + 0.5 - cx) < 9, (x) => (x < cx - 3 ? 4 : x > cx + 4 ? 2 : 3));
      for (let k = 0; k < Math.floor(h / 30); k++) {   // un visage sculpté et peint tous les 30 pixels
        const y = haut + 8 + k * 30, c = ['plume', 'vert', 'eau', 'or'][(k + cx) % 4];
        for (let x = cx - 8; x <= cx + 8; x++) { t.poser(x, y, c, 4); t.poser(x, y + 20, c, 3); }
        t.forme('os', ellipsoide(cx - 4, y + 7, 2.4, 2), { decalage: 0.4 }); t.forme('os', ellipsoide(cx + 4, y + 7, 2.4, 2), { decalage: 0.4 });
        t.poser(cx - 4, y + 7, 'rochesombre', 0); t.poser(cx + 4, y + 7, 'rochesombre', 0);
        for (let x = cx - 5; x <= cx + 5; x++) t.poser(x, y + 14, 'rochesombre', 1);   // la bouche
      }
      // les ailes et les plumes au sommet
      remplir(t, 'plume', (x, y) => y >= haut - 4 && y < haut + 6 && Math.abs(x + 0.5 - cx) < 20 - (y - haut + 4), (x) => (x < cx ? 4 : 3));
      for (const dx of [-4, 0, 4]) ligne(t, 'plume', 5, cx + dx, haut - 4, cx + dx * 2, haut - 14);
    }
  } },
  // Le chevalement de la mine : poutres assemblées, la roue, le câble, l'entrée étayée, les rails, un wagonnet de minerai
  chevalement: { l: 220, h: 170, dessin(t) {
    // la colline rocheuse et l'entrée de galerie étayée
    remplir(t, 'roche', (x, y) => y >= 170 - 70 * Math.sqrt(Math.max(0, 1 - ((x - 160) / 70) ** 2)), (x, y) => 3 + (x < 140 ? 1 : 0) + ((x * 7 + y * 5) % 11 === 0 ? -1 : 0) + ((x * 3 + y) % 13 === 0 ? 1 : 0));
    t.forme('rochesombre', boite(146, 128, 176, 170, 4), { decalage: -0.8 });
    for (const x of [144, 176]) remplir(t, 'rondin', (px, py) => px >= x - 2 && px < x + 2 && py >= 124 && py < 170, () => 3);
    remplir(t, 'rondin', (px, py) => px >= 140 && px < 182 && py >= 122 && py < 127, () => 4);
    t.forme('lumiere', ellipsoide(160, 150, 3, 4), { decalage: 1 });   // une lanterne au fond
    // le chevalement de bois
    for (const [x0, x1] of [[20, 50], [80, 50]]) ligne(t, 'rondin', 3, x0, 170, x1, 30, 3);
    for (const y of [70, 110, 145]) { const d = (170 - y) * 30 / 140; ligne(t, 'rondin', 4, 20 + d, y, 80 - d, y, 2); }
    ligne(t, 'rondin', 2, 26, 145, 72, 70, 2); ligne(t, 'rondin', 2, 74, 145, 28, 70, 2);
    for (let a = 0; a < 6.28; a += 0.12) t.poser(Math.round(50 + Math.cos(a) * 12), Math.round(28 + Math.sin(a) * 12), 'fer', 3);   // la roue
    for (let k = 0; k < 6; k++) ligne(t, 'fer', 2, 50, 28, 50 + Math.cos(k) * 12, 28 + Math.sin(k) * 12);
    ligne(t, 'fer', 4, 62, 28, 146, 126);   // le câble
    // les rails et le wagonnet de minerai
    for (let x = 0; x < 150; x++) { t.poser(x, 166, 'fer', 4); if (x % 8 < 3) t.poser(x, 168, 'rondin', 3); }
    t.forme('fer', boite(92, 146, 124, 162, 2), { decalage: 0.1 });
    for (const x of [98, 118]) t.forme('rochesombre', ellipsoide(x, 164, 4, 4), { decalage: 0.3 });
    for (const [x, y] of [[98, 144], [106, 142], [114, 144], [102, 140], [110, 139]]) t.forme('minerai', ellipsoide(x, y, 4, 3), { decalage: 0.4 });
  } },
  // La porte de Khaz-Durim : une montagne taillée, deux rois nains de pierre, la porte de bronze et ses runes d'or
  porteNaine: { l: 300, h: 220, dessin(t) {
    remplir(t, 'roche', (x, y) => y >= 220 - (150 - Math.abs(x - 150)) * 1.4 + Math.sin(x * 0.2) * 4, (x, y) => 3 + (x < 130 ? 1 : 0) - (x > 200 ? 1 : 0) + ((x * 7 + y * 3) % 13 === 0 ? -1 : 0));
    // la façade taillée : un grand arc de blocs
    remplir(t, 'pierreBleue', (x, y) => y >= 90 && y < 220 && Math.abs(x + 0.5 - 150) < 70, (x, y) => tonBlocs(x, y, 12, 8, 3, (x) => (x < 110 ? 1 : 0)));
    remplir(t, 'pierreBleue', (x, y) => y >= 76 && y < 92 && Math.abs(x + 0.5 - 150) < 78, (x) => (x % 6 === 0 ? 1 : 4));   // la frise
    for (let x = 80; x <= 220; x += 10) t.poser(x, 84, 'or', 4);
    // la porte de bronze en arc, ses runes d'or
    t.forme('or', (x, y) => { const dx = x + 0.5 - 150, dy = y + 0.5 - 150; return y < 220 && Math.abs(dx) < 30 && (dy >= 0 || dx * dx + dy * dy < 900) ? [dx / 32, 0, 0.8] : null; }, { motif: (x, y) => (x === 150 ? -0.9 : 0) });
    remplir(t, 'rondin', (x, y) => t.mat(x, y) === 'or' && ((x + y) % 2 === 0), () => 0);
    for (let k = 0; k < 6; k++) { const y = 160 + k * 9; for (const x of [134, 166]) { t.poser(x, y, 'lumiere', 5); t.poser(x + 1, y + 1, 'lumiere', 4); t.poser(x - 1, y + 2, 'lumiere', 4); } }
    // deux rois nains de pierre, la hache sur l'épaule, de part et d'autre
    for (const cx of [96, 204]) {
      t.forme('roche', ellipsoide(cx, 116, 10, 11), { decalage: 0.2 });                 // la tête et son casque
      t.forme('roche', boite(cx - 9, 100, cx + 9, 108, 3), { decalage: 0.5 });
      t.forme('rochesombre', (x, y) => (y >= 122 && y < 150 && Math.abs(x + 0.5 - cx) < 12 - (y - 122) * 0.25 ? [0, 0.3, 0.8] : null), { motif: (x, y) => ((x + y) % 4 === 0 ? 0.4 : 0) });   // la barbe tressée
      t.forme('roche', boite(cx - 18, 124, cx + 18, 220, 3), { decalage: -0.1 });           // le corps
      t.forme('pierreBleue', boite(cx - 14, 150, cx + 14, 160, 1), { decalage: 0.3 });     // la ceinture
      ligne(t, 'roche', 1, cx + 16, 220, cx + 16, 100, 4); t.forme('roche', ellipsoide(cx + 22, 104, 7, 9), { decalage: 0.4 });   // la hache
    }
    // des braseros allumés au pied
    for (const x of [62, 238]) { t.forme('fer', boite(x - 6, 196, x + 6, 210, 2), { decalage: 0.2 }); t.forme('braiseR', ellipsoide(x, 192, 6, 7), { decalage: 0.8, bord: false }); }
  } },
  // Les arches elfiques de marbre blanc, ciselées, et un grand arbre argenté
  arches: { l: 280, h: 190, dessin(t) {
    for (const [cx, w, h] of [[60, 42, 120], [150, 50, 150], [240, 42, 120]]) {
      const base = 190, r = w / 2;
      remplir(t, 'marbre', (x, y) => {
        const dx = x + 0.5 - cx, top = base - h;
        if (y >= base || y < top - r) return false;
        const exterieur = Math.abs(dx) < r + 6 && (y >= top || dx * dx + (y - top) ** 2 < (r + 6) ** 2);
        const interieur = Math.abs(dx) < r && (y >= top || dx * dx + (y - top) ** 2 < r * r);
        return exterieur && !interieur;
      }, (x, y) => (x < cx ? 4 : 3) + ((y * 3) % 17 === 0 ? -1 : 0));
      for (let y = base - h; y < base; y += 14) { t.poser(cx - r - 3, y, 'vert', 4); t.poser(cx - r - 2, y + 1, 'vert', 3); t.poser(cx + r + 3, y + 5, 'vert', 3); }   // le lierre
      t.forme('lumiere', ellipsoide(cx, base - h - r - 3, 3, 3), { decalage: 1 });   // la pierre de lune au sommet
    }
    // l'arbre argenté
    t.forme('marbre', boite(144, 90, 156, 190, 3), { decalage: 0.1 });
    // ses branches fines, et un feuillage argenté fait de petites touffes qui laissent passer le ciel
    for (const [x1, y1] of [[118, 70], [182, 70], [132, 46], [168, 46], [150, 30]]) ligne(t, 'marbre', 3, 150, 96, x1, y1, 2);
    for (let k = 0; k < 46; k++) {
      const a = hachage(k, 1, 31) * Math.PI, r = 14 + hachage(k, 2, 31) * 44;
      const cx = 150 + Math.cos(a) * r * (k % 2 ? 1 : -1) * 0.95, cy = 74 - Math.sin(a) * r * 0.75;
      t.forme('neige', ellipsoide(cx, cy, 4.5, 3.4), { decalage: 0.1, motif: (x, y) => ((x + y) % 3 === 0 ? -0.6 : 0) });
      if (k % 5 === 0) t.poser(Math.round(cx), Math.round(cy) - 1, 'lumiere', 5);   // une feuille qui scintille
    }
  } },
  // Le lac des lunes : l'eau qui miroite, le reflet de la lune, un ponton de bois et une barque
  lac: { l: 360, h: 70, dessin(t) {
    remplir(t, 'eau', (x, y) => y >= 30 && ((x - 180) / 180) ** 2 + ((y - 50) / 20) ** 2 < 1, (x, y) => 3 + (y < 38 ? 2 : y < 46 ? 1 : 0) + ((x * 3 + y * 11) % 17 === 0 ? 1 : 0) - ((x * 5 + y * 7) % 23 === 0 ? 1 : 0));
    for (let k = 0; k < 8; k++) for (let x = 230 - 22 + k * 3; x < 230 + 22 - k * 3; x++) t.poser(x, 36 + k * 3, 'marbre', 5 - (k > 4 ? 1 : 0));   // le reflet de la lune
    // le ponton
    for (let x = 40; x < 110; x++) for (let y = 36; y < 40; y++) t.poser(x, y, 'chene', y === 36 ? 5 : (x % 8 === 0 ? 1 : 3));
    for (const x of [44, 70, 96]) ligne(t, 'rondin', 2, x, 40, x, 52, 2);
    // la barque amarrée
    remplir(t, 'chene', (x, y) => y >= 40 && y < 47 && Math.abs(x + 0.5 - 132) < 18 - (y - 40) * 1.5, (x, y) => (y === 40 ? 5 : y < 43 ? 3 : 2));
    ligne(t, 'chanvre', 3, 110, 38, 116, 42);
  } },
  // Les flèches de la Cité d'Opale : des tours de cristal irisé, des ponts suspendus, des globes de lumière
  flèches: { l: 260, h: 240, dessin(t) {
    for (const [cx, h, w] of [[40, 150, 14], [100, 220, 20], [160, 190, 18], [220, 140, 14]]) {
      remplir(t, 'opale', (x, y) => y >= 240 - h && Math.abs(x + 0.5 - cx) < w * Math.min(1, (y - (240 - h)) / 30 + 0.15), (x, y) => (x < cx - w / 3 ? 5 : x > cx + w / 3 ? 2 : 3) + ((y * 2 + x) % 23 === 0 ? 1 : 0));
      for (let y = 240 - h + 40; y < 236; y += 22) t.forme('lumiere', boite(cx - 2, y, cx + 2, y + 6, 1), { decalage: 0.9 });   // les fenêtres
      t.forme('lumiere', ellipsoide(cx, 240 - h - 6, 5, 5), { decalage: 1.2, bord: false });   // le globe au sommet
    }
    for (const [x0, x1, y] of [[40, 100, 140], [100, 160, 110], [160, 220, 150]]) for (let x = x0; x <= x1; x++) t.poser(x, Math.round(y + Math.sin((x - x0) / (x1 - x0) * Math.PI) * 6), 'opale', 1);   // les ponts suspendus
  } },
  // La Bibliothèque Interdite : une tour de pierre sombre, des fenêtres éclairées, un toit pointu, des livres qui tournent autour
  tourLivres: { l: 200, h: 260, dessin(t) {
    remplir(t, 'pierreBleue', (x, y) => y >= 80 && Math.abs(x + 0.5 - 100) < 42 + (y > 240 ? 6 : 0), (x, y) => tonBlocs(x, y, 10, 7, 3, (x) => (x < 80 ? 1 : x > 125 ? -1 : 0)));
    remplir(t, 'ardoise', (x, y) => y >= 6 && y < 82 && Math.abs(x + 0.5 - 100) < (y - 2) * 0.62, (x, y) => (x < 100 ? 4 : 2) + (y % 6 === 0 ? -1 : 0));
    for (let k = 0; k < 4; k++) for (const x of [82, 112]) { const y = 100 + k * 38; t.forme('rochesombre', boite(x - 6, y, x + 6, y + 18, 6), { decalage: 0 }); t.forme('lumiere', boite(x - 4, y + 2, x + 4, y + 18, 4), { decalage: 0.9 }); }
    t.forme('rondin', boite(86, 226, 114, 260, 14), { decalage: -0.1 });
    for (const [x, y, c] of [[30, 90, 'tuile'], [170, 130, 'eau'], [24, 170, 'vert'], [176, 60, 'opale']]) { t.forme(c, boite(x - 7, y - 5, x + 7, y + 5, 1), { decalage: 0.3 }); for (let k = -5; k <= 5; k++) t.poser(x + k, y, 'parchemin', 5); }   // les livres qui volent
  } },
  // Le squelette géant d'une bête du désert : le crâne cornu, la colonne, les côtes, à demi enfoui
  cotes: { l: 300, h: 110, dessin(t) {
    remplir(t, 'gres', (x, y) => y >= 98 + Math.sin(x * 0.05) * 4, (x, y) => 3 + ((x * 5 + y) % 9 === 0 ? 1 : 0));   // la dune
    for (let x = 60; x < 250; x++) t.forme('os', ellipsoide(x, 84 - Math.sin((x - 60) / 190 * Math.PI) * 22, 3, 3), { bord: false, decalage: 0.2 });   // la colonne
    for (let k = 0; k < 8; k++) {
      const x0 = 90 + k * 18, y0 = 84 - Math.sin((x0 - 60) / 190 * Math.PI) * 22, hh = 70 - Math.abs(k - 3.5) * 6;
      for (let j = 0; j < hh; j++) { const x = x0 + Math.sin(j / hh * 2.6) * 14, y = y0 + j * 0.25 - Math.sin(j / hh * Math.PI) * 10; t.forme('os', ellipsoide(x, y + j * 0.15, 2.2, 2.2), { bord: false, decalage: 0.1 }); }
    }
    t.forme('os', ellipsoide(46, 82, 20, 14));   // le crâne
    t.forme('rochesombre', ellipsoide(40, 80, 5, 4), { decalage: -0.5 });
    for (let j = 0; j < 30; j++) t.forme('os', ellipsoide(56 + j * 0.6, 70 - j * 1.2 + (j * j) * 0.02, 2.6 - j * 0.06, 2.6 - j * 0.06), { bord: false });   // la corne
    for (let x = 30; x < 64; x += 5) ligne(t, 'os', 4, x, 92, x + 1, 99);   // les dents
  } },
  // La pyramide des sables : des blocs de grès taillés en gradins, un parement lisse au sommet doré,
  // l'entrée sous un linteau, deux colonnes et un obélisque gravé de hiéroglyphes
  pyramide: { l: 320, h: 190, dessin(t) {
    const cx = 170, base = 190, h = 170;
    remplir(t, 'gres', (x, y) => y < base && y >= base - h && Math.abs(x + 0.5 - cx) < (y - (base - h)) * 0.95, (x, y) => {
      const gradin = Math.floor((y - (base - h)) / 7);
      if ((y - (base - h)) % 7 === 0) return 1;   // l'arête de chaque gradin, dans l'ombre
      const cote = x < cx ? 1 : -1;
      return tonBlocs(x, y, 12, 7, 3, () => cote) + (gradin < 3 ? 1 : 0);
    });
    remplir(t, 'or', (x, y) => y >= base - h && y < base - h + 18 && Math.abs(x + 0.5 - cx) < (y - (base - h)) * 0.95, (x) => (x < cx ? 5 : 3));   // le pyramidion doré
    // l'entrée : un linteau sur deux montants, et le noir du couloir
    t.forme('rochesombre', boite(cx - 10, base - 34, cx + 10, base, 1), { decalage: -0.8 });
    t.forme('gres', boite(cx - 16, base - 40, cx + 16, base - 34, 1), { decalage: 0.4 });
    for (const x of [cx - 13, cx + 13]) t.forme('gres', boite(x - 3, base - 34, x + 3, base, 1), { decalage: 0.2 });
    // l'obélisque gravé
    remplir(t, 'gres', (x, y) => y >= 70 && y < base && Math.abs(x + 0.5 - 30) < 6 - (190 - y) * 0.012, (x) => (x < 29 ? 4 : 2));
    remplir(t, 'or', (x, y) => y >= 62 && y < 72 && Math.abs(x + 0.5 - 30) < (y - 62) * 0.6, (x) => (x < 30 ? 5 : 3));
    for (let y = 80; y < 180; y += 9) { t.poser(29, y, 'rochesombre', 1); t.poser(31, y + 3, 'rochesombre', 1); t.poser(30, y + 6, 'rochesombre', 2); }
    // deux colonnes brisées devant
    for (const [x, hh] of [[280, 60], [304, 40]]) { remplir(t, 'gres', (px, py) => py >= base - hh && py < base && Math.abs(px + 0.5 - x) < 6, (px, py) => (px < x - 2 ? 4 : px > x + 2 ? 2 : 3) - (py % 10 === 0 ? 1 : 0)); t.forme('gres', boite(x - 8, base - hh - 4, x + 8, base - hh, 1), { decalage: 0.3 }); }
  } },
  // Le fort des orcs : une palissade de rondins taillés en pointe, la tour de guet, la bannière rouge
  // au crâne blanc, des crânes sur des piques, des torches
  palissade: { l: 320, h: 170, dessin(t) {
    for (let x = 0; x < 320; x += 11) {
      const h = 70 + ((x * 7) % 13) - (x > 120 && x < 200 ? 0 : 0), haut = 170 - h;
      remplir(t, 'rondin', (px, py) => px >= x && px < x + 10 && py >= haut && py < 170 && (py >= haut + 8 || Math.abs(px + 0.5 - x - 5) < (py - haut) * 0.65), (px) => (px - x < 3 ? 5 : px - x > 7 ? 2 : 3));
      for (const y of [haut + 26, haut + 56]) for (let k = 0; k < 10; k++) t.poser(x + k, y, 'fer', 2);   // les liens de fer
    }
    // la tour de guet
    remplir(t, 'rondin', (x, y) => x >= 140 && x < 190 && y >= 40 && y < 110, (x, y) => ((x - 140) % 7 === 0 ? 1 : (x - 140) % 7 < 3 ? 4 : 3));
    for (const x of [140, 189]) ligne(t, 'rondin', 2, x, 40, x, 170, 3);
    remplir(t, 'peau', (x, y) => y >= 14 && y < 42 && Math.abs(x + 0.5 - 165) < (y - 8) * 1.1, (x, y) => (x < 165 ? 4 : 2) + ((x + y) % 7 === 0 ? -1 : 0));   // le toit de peaux
    t.forme('rochesombre', boite(156, 60, 174, 76, 2), { decalage: -0.5 }); t.forme('braiseR', ellipsoide(165, 70, 4, 4), { decalage: 1, bord: false });
    // la bannière rouge au crâne blanc
    ligne(t, 'rondin', 2, 210, 0, 210, 120, 2);
    remplir(t, 'plume', (x, y) => x >= 212 && x < 240 && y >= 4 && y < 50 + (x % 6 < 3 ? 4 : 0), (x) => (x < 220 ? 4 : 3));
    t.forme('os', ellipsoide(226, 22, 6, 6), { decalage: 0.3 }); t.poser(224, 22, 'rochesombre', 0); t.poser(228, 22, 'rochesombre', 0); for (let x = 222; x <= 230; x += 2) t.poser(x, 28, 'os', 4);
    // des crânes sur des piques, des torches
    for (const x of [40, 90, 260, 300]) { ligne(t, 'rondin', 2, x, 92, x, 126, 2); t.forme('os', ellipsoide(x, 88, 5, 5), { decalage: 0.3 }); t.poser(x - 2, 88, 'rochesombre', 0); t.poser(x + 2, 88, 'rochesombre', 0); }
    for (const x of [118, 214]) { ligne(t, 'rondin', 3, x, 96, x, 120, 2); t.forme('braiseR', ellipsoide(x, 90, 4, 6), { decalage: 0.8, bord: false }); }
  } },
  // Les Mines Rouges : l'échafaudage de bois, la poulie et son seau, l'entrée de mine étayée, des
  // chariots de minerai rouge qui luit, des lanternes
  echafaudage: { l: 300, h: 180, dessin(t) {
    // la paroi rocheuse sombre (contraste avec la terre rouge)
    remplir(t, 'rochesombre', (x, y) => y >= 180 - 120 * Math.sqrt(Math.max(0, 1 - ((x - 200) / 100) ** 2)) + Math.sin(x * 0.3) * 3, (x, y) => 3 + ((x * 7 + y * 3) % 11 === 0 ? 1 : 0) - (x > 240 ? 1 : 0));
    for (let k = 0; k < 14; k++) t.forme('minerai', ellipsoide(130 + (k * 37) % 150, 90 + (k * 23) % 80, 2.5, 2), { decalage: 0.8, bord: false });   // les veines de minerai qui luisent
    t.forme('rochesombre', boite(176, 120, 224, 180, 10), { decalage: -1 });
    t.forme('braiseR', ellipsoide(200, 150, 10, 12), { decalage: -0.6, bord: false });   // la lueur au fond de la mine
    for (const x of [174, 226]) ligne(t, 'rondin', 4, x, 120, x, 180, 4); ligne(t, 'rondin', 4, 170, 118, 230, 118, 4);
    // l'échafaudage
    for (const x of [20, 60, 100, 140]) ligne(t, 'rondin', 4, x, 40, x, 180, 3);
    for (const y of [40, 85, 130]) { ligne(t, 'rondin', 5, 14, y, 146, y, 3); for (let x = 16; x < 146; x += 6) t.poser(x, y - 2, 'chene', 4); }
    ligne(t, 'rondin', 3, 20, 130, 60, 85, 2); ligne(t, 'rondin', 3, 100, 85, 140, 40, 2); ligne(t, 'rondin', 3, 60, 180, 100, 130, 2);
    // la poulie, sa corde et le seau
    for (let a = 0; a < 6.28; a += 0.2) t.poser(Math.round(140 + Math.cos(a) * 7), Math.round(30 + Math.sin(a) * 7), 'fer', 4);
    ligne(t, 'chanvre', 3, 147, 30, 147, 100, 1); t.forme('rondin', boite(141, 100, 153, 112, 2), { decalage: 0.2 });
    // les chariots de minerai et les lanternes
    for (const x of [236, 270]) { t.forme('fer', boite(x - 14, 160, x + 14, 174, 2), { decalage: 0.1 }); for (const [dx, dy] of [[-8, -2], [0, -4], [8, -2], [-4, -6], [4, -6]]) t.forme('minerai', ellipsoide(x + dx, 160 + dy, 4, 3), { decalage: 0.6 }); for (const dx of [-8, 8]) t.forme('rochesombre', ellipsoide(x + dx, 176, 4, 4), { decalage: 0.3 }); }
    for (const [x, y] of [[60, 70], [140, 116]]) { ligne(t, 'fer', 2, x, y - 10, x, y - 4); t.forme('lumiere', ellipsoide(x, y, 3, 4), { decalage: 1 }); }
  } },
  // La tour de guet naine des Pics : pierre bleutée, toit enneigé, fenêtre allumée, la bannière
  tourNaine: { l: 160, h: 200, dessin(t) {
    remplir(t, 'pierreBleue', (x, y) => y >= 60 && Math.abs(x + 0.5 - 80) < 28 + Math.max(0, y - 170) * 0.6, (x, y) => tonBlocs(x, y, 9, 6, 3, (x) => (x < 66 ? 1 : x > 96 ? -1 : 0)));
    for (let x = 48; x <= 112; x += 8) t.forme('pierreBleue', boite(x, 48, x + 5, 60, 1), { decalage: 0.3 });   // les créneaux
    remplir(t, 'neige', (x, y) => y >= 44 && y < 50 && Math.abs(x + 0.5 - 80) < 34, (x) => (x < 80 ? 5 : 4));
    t.forme('rochesombre', boite(72, 90, 88, 112, 8), { decalage: -0.4 }); t.forme('lumiere', boite(74, 94, 86, 112, 6), { decalage: 1 });
    t.forme('rondin', boite(70, 170, 90, 200, 10), { decalage: 0 });
    ligne(t, 'rondin', 2, 80, 0, 80, 48, 2);
    remplir(t, 'eau', (x, y) => x >= 82 && x < 108 && y >= 4 && y < 22 - (x - 82) * 0.2, (x) => (x < 90 ? 4 : 3));
    t.forme('or', ellipsoide(94, 12, 3, 3), { decalage: 0.4 });
    for (let x = 40; x < 120; x += 3) if ((x * 7) % 5 < 3) t.poser(x, 61 + (x % 2), 'neige', 5);   // la neige sur les rebords
  } },
  // Le cairn du col : des pierres empilées, les fanions de prière qui claquent, un chariot renversé, des os de loups
  cairn: { l: 260, h: 150, dessin(t) {
    for (let k = 0; k < 6; k++) t.forme('roche', ellipsoide(110, 140 - k * 18, 34 - k * 5, 11), { decalage: 0.2, motif: (x, y) => ((x * 7 + y * 3) % 9 === 0 ? -0.5 : 0) });
    for (let k = 0; k < 6; k++) for (let x = 110 - 28 + k * 5; x < 110 + 28 - k * 5; x += 3) t.poser(x, 130 - k * 18 - 9, 'neige', 5);
    ligne(t, 'rondin', 2, 110, 10, 110, 40, 3);
    for (let x = 110; x < 250; x++) { const y = Math.round(14 + (x - 110) * 0.55 + Math.sin(x * 0.08) * 3); t.poser(x, y, 'chanvre', 3); if ((x - 110) % 12 < 8 && (x - 110) % 12 > 0) for (let j = 1; j < 9; j++) t.poser(x, y + j, ['plume', 'or', 'eau', 'vert', 'marbre'][Math.floor((x - 110) / 12) % 5], j < 3 ? 4 : 3); }
    // le chariot renversé, une roue cassée
    t.forme('rondin', (x, y) => { const u = (x - 210) * 0.9 + (y - 128) * 0.4, v = -(x - 210) * 0.4 + (y - 128) * 0.9; return Math.abs(u) < 26 && Math.abs(v) < 9 ? [u / 30, v / 10, 0.8] : null; }, { motif: (x) => (x % 6 === 0 ? -0.8 : 0) });
    for (let a = 0; a < 5; a += 0.15) t.poser(Math.round(180 + Math.cos(a) * 12), Math.round(130 + Math.sin(a) * 12), 'rondin', 3);
    for (let k = 0; k < 5; k++) ligne(t, 'rondin', 2, 180, 130, 180 + Math.cos(k * 1.1) * 12, 130 + Math.sin(k * 1.1) * 12);
    for (const [x, y] of [[40, 144], [60, 146], [30, 147]]) t.forme('os', boite(x - 6, y - 1, x + 6, y + 1, 1), { decalage: 0.3 });
    t.forme('os', ellipsoide(70, 140, 6, 4), { decalage: 0.3 }); t.poser(68, 140, 'rochesombre', 0);
  } },
};

// La texture d'un repère (créée une fois)
function textureRepere(scene, quoi) {
  const r = REPERES_HD[quoi];
  const cle = 'repereHD_' + quoi + (r && r.saison ? '_' + saisonRepere() : '');
  if (scene.textures.exists(cle)) return cle;
  if (!r) return null;
  const t = toileRepere(r.l, r.h);
  r.dessin(t);
  t.contour();
  t.texture(scene, cle);
  return cle;
}

// --- (v0.81) Les repères refaits à la demande du joueur ---
Object.assign(RAMPES_REPERES, {
  feuilleOr: [0x5a3a06, 0x8a5c0a, 0xc08a14, 0xe0b028, 0xf4d04a, 0xfff090],
  argent: [0x5a6070, 0x8890a0, 0xb0b8c4, 0xd0d6de, 0xe8ecf0, 0xffffff],
  lueurBleue: [0x1a3a6a, 0x2a5aa0, 0x4a84d0, 0x78b0f0, 0xb0d8ff, 0xf0faff],
  automne: [0x4a1a06, 0x7a2e0a, 0xb04a12, 0xd86a20, 0xf0943a, 0xffc070],
  nuit: [0x0a0812, 0x14101e, 0x201a2e, 0x2e2640, 0x3e3456, 0x544a70],
  loup: [0x0c0c10, 0x18181e, 0x26262e, 0x363640, 0x4a4a56, 0x62626e],
  mousse: [0x0e2414, 0x1a3a1e, 0x26502a, 0x346a36, 0x468844, 0x60a858],
});
for (const [k, v] of Object.entries(RAMPES_REPERES)) if (!REPERES_HD.__rampes) REPERES_HD.__rampes = true;

// Un halo de lumière autour d'un point (des pixels clairs de plus en plus rares)
function halo(t, mat, cx, cy, r) {
  for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
    const d = Math.hypot(x - cx, y - cy);
    if (d <= r && hachage(x, y, 5) > d / r) t.poser(x, y, mat, d < r * 0.35 ? 5 : 4);
  }
}
// Une couronne de feuillage : un ellipsoïde dont le bord est découpé en touffes, et des reflets
function feuillage(t, mat, cx, cy, rx, ry, graine = 1) {
  t.forme(mat, (x, y) => {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy;
    const bord = 1 - 0.14 * hachage(Math.floor(x / 4), Math.floor(y / 4), graine);
    return d <= bord ? [dx, dy, Math.sqrt(Math.max(0, 1 - d))] : null;
  }, { motif: (x, y) => (hachage(x, y, graine + 3) > 0.86 ? 0.8 : hachage(x, y, graine + 7) > 0.88 ? -0.7 : 0) });
}

// Un étage de feuillage fait de nombreuses touffes (plus vivant qu'un seul disque) : le dessous dans l'ombre
function etageFeuilles(t, mat, cx, cy, rx, ry, graine, n = 26) {
  for (let k = 0; k < n; k++) {
    const a = hachage(k, 1, graine) * Math.PI * 2, r = Math.sqrt(hachage(k, 2, graine));
    const x = cx + Math.cos(a) * rx * r * 0.85, y = cy + Math.sin(a) * ry * r * 0.7 - ry * 0.15;
    const tr = 7 + hachage(k, 3, graine) * (rx / 6);
    feuillage(t, mat, x, y, tr, tr * 0.7, graine + k);
  }
  for (let x = Math.round(cx - rx); x <= cx + rx; x++) for (let y = Math.round(cy); y <= cy + ry; y++) if (t.mat(x, y) === mat && t.mat(x, y + 1) !== mat) { t.poser(x, y, mat, 1); t.poser(x, y - 1, mat, 2); }   // le dessous, dans l'ombre
}

Object.assign(REPERES_HD, {
  // Lothlórien : un mallorn géant au tronc d'argent, ses étages de feuilles d'or, un talan (plateforme)
  // et sa maison elfique aux fenêtres de lumière, l'escalier qui tourne autour du tronc et ses
  // lanternes, d'autres mallorns, et des lueurs bleues qui flottent
  lothlorien: { l: 400, h: 300, dessin(t) {
    // les mallorns du fond, de chaque côté
    // (v1.63 : peints comme ceux des collines, arbresHD.js)
    [[36, 200], [366, 214], [98, 150]].forEach(([cx, h], i) => arbreDansRepere(t, '_ml', { espece: 'mallorn', saison: 'moissons', cx, base: 298, H: h, graine: 11 + i, ecartX: 0.55, feuilles: [0xd0a024, 0xe8c040, 0xa87a16] }));
    // le grand tronc d'argent, épais, cannelé, ses racines qui s'étalent
    remplir(t, 'argent', (x, y) => { const w = 20 + Math.max(0, y - 240) ** 1.4 * 0.16; return y >= 60 && Math.abs(x + 0.5 - 200) < w; },
      (x, y) => (x < 190 ? 5 : x > 210 ? 2 : 3) + ((x - 200) % 7 === 0 ? -1 : 0) + ((y * 3 + x) % 23 === 0 ? -1 : 0));
    for (const [x1, y1] of [[100, 186], [300, 186], [120, 100], [280, 100], [170, 46], [230, 46]]) ligne(t, 'argent', 4, 200, y1 + 26, x1, y1, 4);   // les grandes branches qui montent
    // les étages de feuilles d'or, en touffes
    etageFeuilles(t, 'feuilleOr', 200, 196, 120, 30, 21, 30);
    etageFeuilles(t, 'feuilleOr', 200, 100, 140, 46, 22, 40);
    etageFeuilles(t, 'feuilleOr', 200, 44, 86, 30, 23, 22);
    // le talan : une plateforme blanche, la maison elfique, ses fenêtres en arc et son toit doré
    remplir(t, 'marbre', (x, y) => y >= 140 && y < 146 && Math.abs(x + 0.5 - 200) < 74, (x, y) => (y === 140 ? 5 : 3));
    remplir(t, 'marbre', (x, y) => y >= 114 && y < 140 && Math.abs(x + 0.5 - 200) < 42, (x) => (x < 190 ? 4 : 3));
    remplir(t, 'feuilleOr', (x, y) => y >= 98 && y < 116 && Math.abs(x + 0.5 - 200) < (y - 94) * 2.6, (x) => (x < 200 ? 5 : 3));
    for (const x of [172, 188, 212, 228]) t.forme('lumiere', (px, py) => { const dx = px + 0.5 - x, dy = py + 0.5 - 126; return Math.abs(dx) < 4 && dy < 12 && (dy > 0 || dx * dx + dy * dy < 16) ? [0, 0, 1] : null; }, { decalage: 1 });
    for (let x = 128; x <= 272; x += 7) ligne(t, 'marbre', 4, x, 140, x, 134, 1);
    // l'escalier blanc qui tourne autour du tronc, et ses lanternes
    for (let k = 0; k < 9; k++) { const y = 288 - k * 16, x = 200 + (k % 2 ? 30 : -30); ligne(t, 'marbre', 5, 200, y + 8, x, y, 2); if (k % 2 === 0) halo(t, 'lumiere', x, y - 4, 4.5); }
    // les lueurs bleues qui flottent
    for (let k = 0; k < 18; k++) halo(t, 'lueurBleue', 20 + hachage(k, 1, 9) * 360, 30 + hachage(k, 2, 9) * 250, 2.5 + hachage(k, 3, 9) * 2.5);
  } },
  // Fondcombe : la vallée cachée, les falaises et leurs cascades, la maison d'Elrond en pierre
  // claire, ses tours fines, ses arches et ses fenêtres dorées, le pont sur les chutes, les arbres d'automne
  fondcombe: { l: 420, h: 290, dessin(t) {
    // les falaises et la mousse
    // (des falaises aux bords déchiquetés, des strates claires et des ombres)
    const bordG = y => 70 + Math.sin(y * 0.05) * 18 + Math.sin(y * 0.19) * 7 - Math.max(0, 60 - y) * 0.9, bordD = y => 340 - Math.sin(y * 0.045) * 16 - Math.sin(y * 0.23) * 6 + Math.max(0, 40 - y) * 1.2;
    const extG = y => Math.max(0, 46 - y * 0.16 + Math.sin(y * 0.11) * 8 + Math.sin(y * 0.31) * 4), extD = y => Math.min(419, 374 + y * 0.16 - Math.sin(y * 0.1) * 8 - Math.sin(y * 0.27) * 4);
    remplir(t, 'roche', (x, y) => (x < bordG(y) && x > extG(y)) || (x > bordD(y) && x < extD(y)), (x, y) => { const strate = Math.floor((y + Math.sin(x * 0.1) * 4) / 9) % 3; return 2 + strate + (Math.abs(x - bordG(y)) < 4 || Math.abs(x - bordD(y)) < 4 || Math.abs(x - extG(y)) < 3 || Math.abs(x - extD(y)) < 3 ? 1 : 0) - (hachage(x >> 2, y >> 2, 2) > 0.8 ? 1 : 0); });
    const sa = 'brumes';   // (le joueur : la vallée garde son automne toute l'année ; les sapins restent verts, sans neige)
    for (let k = 0; k < 10; k++) { const g = k < 5, y = 60 + ((k * 53) % 200), x = g ? extG(y) + 8 + (k * 7) % 20 : extD(y) - 8 - (k * 7) % 20; arbreDansRepere(t, '_fs', { espece: 'sapin', saison: sa, cx: x, base: y + 22, H: 24, graine: 20 + k, neige: sa === 'givre' }); }   // des sapins accrochés aux parois (v1.63 : peints)
    for (let k = 0; k < 40; k++) { const x = hachage(k, 1, 4) < 0.5 ? hachage(k, 2, 4) * 90 : 330 + hachage(k, 2, 4) * 90, y = 30 + hachage(k, 3, 4) * 250; t.forme('mousse', ellipsoide(x, y, 5, 3), { decalage: 0.2, bord: false }); }
    // les cascades
    for (const [x0, l] of [[70, 8], [300, 10], [348, 6]]) remplir(t, 'lueurBleue', (x, y) => x >= x0 && x < x0 + l && y > 40, (x, y) => ((y + x * 3) % 7 < 3 ? 5 : 4));
    // la maison principale : des terrasses de pierre claire
    for (const [x0, x1, y0, h] of [[110, 230, 150, 70], [200, 320, 180, 60], [130, 200, 110, 50]]) {
      remplir(t, 'marbre', (x, y) => x >= x0 && x < x1 && y >= y0 && y < y0 + h, (x, y) => tonBlocs(x, y, 14, 9, 3, (x) => (x < x0 + 10 ? 1 : 0)));
      remplir(t, 'rondin', (x, y) => y >= y0 - 22 && y < y0 && Math.abs(x + 0.5 - (x0 + x1) / 2) < (x1 - x0) / 2 + 6 - (y0 - y) * ((x1 - x0) / 2 + 6) / 24, (x) => (x < (x0 + x1) / 2 ? 4 : 2));
      for (let x = x0 + 8; x < x1 - 8; x += 14) { t.forme('lumiere', (px, py) => { const dx = px + 0.5 - x, dy = py + 0.5 - (y0 + 14); return Math.abs(dx) < 4 && dy < 14 && (dy > 0 || dx * dx + dy * dy < 16) ? [0, 0, 1] : null; }, { decalage: 0.8 }); }
    }
    // deux tours fines au toit pointu
    for (const [cx, haut] of [[150, 40], [290, 70]]) { remplir(t, 'marbre', (x, y) => y >= haut && y < 200 && Math.abs(x + 0.5 - cx) < 9, (x) => (x < cx ? 5 : 3)); remplir(t, 'rondin', (x, y) => y >= haut - 34 && y < haut && Math.abs(x + 0.5 - cx) < (y - haut + 34) * 0.32, (x) => (x < cx ? 4 : 2)); t.forme('lumiere', boite(cx - 3, haut + 10, cx + 3, haut + 22, 3), { decalage: 1 }); }
    // le pont en arches sur les chutes
    remplir(t, 'marbre', (x, y) => { if (y < 236 || y >= 250 || x < 220 || x >= 340) return false; return true; }, (x, y) => (y === 236 ? 5 : 3));
    for (const cx of [250, 290, 330]) remplir(t, 'marbre', (x, y) => y >= 250 && y < 290 && Math.abs(x + 0.5 - cx) < 20 && !((x + 0.5 - cx) ** 2 + (y - 290) ** 2 < 300), (x) => (x < cx ? 4 : 2));
    // les arbres d'automne, et des lanternes
    // (v1.63 : peints comme tous les arbres ; un automne permanent, la vallée flamboie)
    [[112, 66, 'chene'], [172, 50, 'bouleau'], [372, 72, 'chene']].forEach(([cx, H, espece], i) => arbreDansRepere(t, '_fa' + i, { espece, saison: sa, cx, base: 288, H, graine: 30 + i, neige: sa === 'givre' }));
    for (let k = 0; k < 10; k++) halo(t, 'lumiere', 110 + hachage(k, 1, 6) * 220, 120 + hachage(k, 2, 6) * 150, 2.5);
  } },
  // La Cité d'Opale : un rempart de cristal et sa porte, une forêt de flèches et de coupoles, la
  // grande tour et son anneau qui flotte, des éclats de cristal en suspension, des ponts de lumière
  opaleCite: { l: 400, h: 300, dessin(t) {
    // les flèches, de la plus lointaine à la plus proche
    for (const [cx, h, w, dome] of [[40, 170, 12, 0], [80, 220, 14, 1], [130, 190, 16, 0], [270, 200, 16, 1], [320, 230, 14, 0], [360, 160, 12, 1]]) {
      remplir(t, 'opale', (x, y) => y >= 300 - h && Math.abs(x + 0.5 - cx) < w * Math.min(1, (y - (300 - h)) / 26 + 0.12), (x, y) => (x < cx - w / 3 ? 5 : x > cx + w / 3 ? 2 : 3) + ((y * 2 + x) % 19 === 0 ? 1 : 0));
      if (dome) t.forme('opale', ellipsoide(cx, 300 - h + 40, w + 6, w), { decalage: 0.4 });
      for (let y = 300 - h + 50; y < 260; y += 18) t.forme('lumiere', boite(cx - 2, y, cx + 2, y + 7, 2), { decalage: 1 });
      halo(t, 'lumiere', cx, 300 - h - 4, 4);
    }
    // la grande tour au centre et son anneau flottant
    remplir(t, 'opale', (x, y) => y >= 30 && Math.abs(x + 0.5 - 200) < 24 * Math.min(1, (y - 30) / 40 + 0.15), (x, y) => (x < 192 ? 5 : x > 210 ? 2 : 3) + (y % 24 === 0 ? -1 : 0));
    t.forme('opale', ellipsoide(200, 110, 34, 20), { decalage: 0.5 });
    for (let a = 0; a < 6.28; a += 0.02) { const x = Math.round(200 + Math.cos(a) * 54), y = Math.round(70 + Math.sin(a) * 12); if (!(Math.sin(a) < 0 && Math.abs(x - 200) < 22)) t.poser(x, y, 'or', Math.sin(a) > 0 ? 4 : 2); }
    for (let y = 130; y < 270; y += 20) t.forme('lumiere', boite(196, y, 204, y + 10, 3), { decalage: 1 });
    // des éclats de cristal qui flottent
    for (let k = 0; k < 9; k++) { const x = 30 + hachage(k, 1, 3) * 340, y = 10 + hachage(k, 2, 3) * 70; remplir(t, 'opale', (px, py) => Math.abs(px - x) / 3 + Math.abs(py - y) / 7 <= 1, (px) => (px < x ? 5 : 3)); }
    // les ponts de lumière entre les tours
    for (const [x0, x1, y] of [[80, 130, 150], [130, 176, 130], [224, 270, 140], [270, 320, 120]]) for (let x = x0; x <= x1; x++) t.poser(x, Math.round(y + Math.sin((x - x0) / (x1 - x0) * Math.PI) * 6), 'lumiere', 4);
    // le rempart de cristal et sa porte
    remplir(t, 'opale', (x, y) => y >= 254 && y < 300, (x, y) => tonBlocs(x, y, 16, 9, 2));
    for (let x = 0; x < 400; x += 14) t.forme('opale', boite(x, 246, x + 8, 254, 1), { decalage: 0.3 });
    t.forme('or', (x, y) => { const dx = x + 0.5 - 200, dy = y + 0.5 - 280; return y < 300 && Math.abs(dx) < 16 && (dy >= 0 || dx * dx + dy * dy < 256) ? [dx / 18, 0, 0.8] : null; }, { decalage: 0.2 });
  } },
  // La Bibliothèque Interdite : la grande tour et ses contreforts, deux tourelles, l'escalier qui
  // s'enroule dehors, un livre géant ouvert qui flotte au sommet, des rochers suspendus par des
  // chaînes, des piles de livres au pied
  bibliothequeHD: { l: 340, h: 300, dessin(t) {
    // les rochers flottants enchaînés
    for (const [cx, cy] of [[40, 60], [300, 90]]) { t.forme('roche', ellipsoide(cx, cy, 22, 10), { decalage: 0.1 }); remplir(t, 'roche', (x, y) => y > cy && y < cy + 18 && Math.abs(x + 0.5 - cx) < 18 - (y - cy), () => 2); ligne(t, 'fer', 2, cx + (cx < 170 ? 14 : -14), cy + 4, 170 + (cx < 170 ? -40 : 40), 150, 1); t.forme('pierreBleue', boite(cx - 8, cy - 22, cx + 8, cy - 8, 2), { decalage: 0.2 }); t.forme('lumiere', boite(cx - 2, cy - 18, cx + 2, cy - 12, 1), { decalage: 1 }); }
    // les tourelles
    for (const [cx, haut] of [[100, 120], [240, 140]]) { remplir(t, 'pierreBleue', (x, y) => y >= haut && Math.abs(x + 0.5 - cx) < 16, (x, y) => tonBlocs(x, y, 8, 6, 2, (x) => (x < cx - 6 ? 1 : 0))); remplir(t, 'ardoise', (x, y) => y >= haut - 40 && y < haut && Math.abs(x + 0.5 - cx) < (y - haut + 40) * 0.45, (x) => (x < cx ? 4 : 2)); t.forme('lumiere', boite(cx - 3, haut + 20, cx + 3, haut + 34, 3), { decalage: 1 }); }
    // la grande tour et ses contreforts
    remplir(t, 'pierreBleue', (x, y) => y >= 90 && Math.abs(x + 0.5 - 170) < 46 + Math.max(0, y - 270) * 0.6, (x, y) => tonBlocs(x, y, 10, 7, 3, (x) => (x < 150 ? 1 : x > 195 ? -1 : 0)));
    for (const s of [-1, 1]) remplir(t, 'pierreBleue', (x, y) => { const d = (x + 0.5 - 170) * s - 46; return d >= 0 && d < (y - 170) * 0.35 && y < 300; }, () => 2);
    remplir(t, 'ardoise', (x, y) => y >= 40 && y < 92 && Math.abs(x + 0.5 - 170) < (y - 36) * 0.9, (x, y) => (x < 170 ? 4 : 2) + (y % 6 === 0 ? -1 : 0));
    for (let k = 0; k < 4; k++) for (const x of [150, 190]) { const y = 112 + k * 40; t.forme('rochesombre', boite(x - 7, y, x + 7, y + 22, 7), { decalage: 0 }); t.forme('lumiere', boite(x - 5, y + 2, x + 5, y + 22, 5), { decalage: 0.9 }); }
    t.forme('rondin', boite(156, 262, 184, 300, 14), { decalage: -0.1 });
    // l'escalier qui s'enroule
    for (let k = 0; k < 12; k++) { const y = 290 - k * 17, x = k % 2 ? 222 : 118; ligne(t, 'pierre', 4, x, y, k % 2 ? 118 : 222, y - 17, 2); }
    // le livre géant ouvert qui flotte au sommet, ses pages lumineuses
    remplir(t, 'parchemin', (x, y) => y >= 6 && y < 30 && Math.abs(x + 0.5 - 170) < 44 && y > 6 + Math.abs(x + 0.5 - 170) * 0.12, (x, y) => (x === 170 ? 1 : (y % 4 === 0 && Math.abs(x - 170) > 6 && Math.abs(x - 170) < 38) ? 2 : 5));
    remplir(t, 'tuile', (x, y) => y >= 28 && y < 33 && Math.abs(x + 0.5 - 170) < 46, () => 2);
    for (let k = 0; k < 8; k++) halo(t, 'lumiere', 130 + k * 11, 4 - (k % 3) * 2, 2.5);
    // des piles de livres au pied
    for (const [x, n] of [[40, 5], [70, 3], [270, 4], [300, 6]]) for (let k = 0; k < n; k++) t.forme(['tuile', 'eau', 'vert', 'or', 'automne'][(k + x) % 5], boite(x - 12 + (k % 2) * 3, 296 - k * 5, x + 12 + (k % 2) * 3, 300 - k * 5, 1), { decalage: 0.2 });
  } },
  // Les Terres Désolées : le squelette géant, une seconde carcasse plus petite, un crâne cornu planté
  // sur une pique, des os partout, et des vautours perchés
  cotesHD: { l: 420, h: 130, dessin(t) {
    REPERES_HD.cotes.dessin({ ...t, poser: (x, y, m, k) => t.poser(x + 60, y + 20, m, k), forme: (m, f, o) => t.forme(m, (x, y) => f(x - 60, y - 20), o), mat: (x, y) => t.mat(x + 60, y + 20), l: t.l, h: t.h });
    // la petite carcasse (une cage thoracique et un crâne cornu)
    for (let k = 0; k < 5; k++) for (let j = 0; j < 22; j++) t.forme('os', ellipsoide(16 + k * 9 + Math.sin(j / 22 * 2.6) * 6, 100 + j * 0.7 - Math.sin(j / 22 * Math.PI) * 6, 1.6, 1.6), { bord: false });
    for (let x = 12; x < 60; x++) t.forme('os', ellipsoide(x, 98, 1.8, 1.8), { bord: false });
    t.forme('os', ellipsoide(64, 104, 8, 6)); t.poser(62, 103, 'rochesombre', 0);
    // le crâne cornu sur une pique
    ligne(t, 'rondin', 3, 384, 70, 384, 130, 2);
    t.forme('os', ellipsoide(384, 66, 9, 8)); t.poser(381, 65, 'rochesombre', 0); t.poser(387, 65, 'rochesombre', 0);
    for (const s of [-1, 1]) for (let j = 0; j < 16; j++) t.forme('os', ellipsoide(384 + s * (8 + j * 0.9), 62 - j * 0.9 + j * j * 0.03, 2 - j * 0.08, 2 - j * 0.08), { bord: false });
    // des os éparpillés
    for (let k = 0; k < 10; k++) { const x = 20 + hachage(k, 1, 8) * 380, y = 118 + hachage(k, 2, 8) * 10; t.forme('os', boite(x - 5, y - 1, x + 5, y + 1, 1), { decalage: 0.3 }); }
    // deux vautours perchés, voûtés, le cou pelé
    for (const [x, y] of [[176, 46], [300, 62]]) {
      t.forme('loup', ellipsoide(x, y, 7, 9), { decalage: 0.1 });
      t.forme('peau', ellipsoide(x + 6, y - 9, 3, 3), { decalage: 0.3 }); t.poser(x + 9, y - 9, 'or', 4);
      for (let k = 0; k < 4; k++) t.poser(x + 7 + k, y - 6 + k, 'os', 4);   // la collerette
    }
  } },
  // Le Col des Hurlements : un col de roches noires en dents de scie, une lune pâle, deux loups qui
  // hurlent sur un éperon, des arbres morts tordus, des crânes sur des pieux, une bannière déchirée
  colHurlements: { l: 420, h: 290, dessin(t) {
    t.forme('argent', ellipsoide(300, 70, 46, 46), { decalage: 0.6, bord: false });   // la lune
    for (const [x, y, r] of [[286, 60, 6], [312, 84, 4], [318, 58, 3]]) t.forme('argent', ellipsoide(x, y, r, r), { decalage: -0.8, bord: false });
    // les roches noires en dents de scie, de chaque côté
    const crete = x => { // la ligne des crêtes : deux grands crocs de roche, le col entre eux
      const dent = Math.abs(((x * 0.09) % 2) - 1) * 26;
      if (x < 160) return 40 + Math.abs(x - 70) * 1.3 + dent;
      if (x > 290) return 30 + Math.abs(x - 370) * 1.2 + dent;
      return 200 + dent * 0.5;
    };
    remplir(t, 'loup', (x, y) => y > crete(x), (x, y) => (y - crete(x) < 3 ? 4 : 2) + ((x + Math.floor(y / 6)) % 9 === 0 ? 1 : 0) - (hachage(x >> 3, y >> 3, 3) > 0.75 ? 1 : 0));
    // l'éperon et les deux loups qui hurlent
    remplir(t, 'nuit', (x, y) => y >= 150 && y < 290 && Math.abs(x + 0.5 - 220) < 22 + (y - 150) * 0.55, (x, y) => (x < 214 ? 4 : 2) + ((x + y) % 11 === 0 ? -1 : 0));
    // (les loups qui hurlent sont posés par-dessus : les vrais loups des récits, en silhouette)
    // des arbres morts tordus
    // (v1.63 : peints comme tous les arbres morts, arbresHD.js ; sous la lune, presque noirs, un peu de neige)
    [[60, 120], [370, 100]].forEach(([cx, H], i) => arbreDansRepere(t, '_cm', { espece: 'mort', saison: 'givre', cx, base: 288, H, graine: 40 + i, neige: true, assombrir: 0.55 }));
    // des crânes sur des pieux, une bannière déchirée
    for (const x of [130, 160, 290, 320]) { ligne(t, 'rondin', 1, x, 240, x, 290, 2); t.forme('os', ellipsoide(x, 236, 5, 5), { decalage: 0.2 }); t.poser(x - 2, 236, 'rochesombre', 0); t.poser(x + 2, 236, 'rochesombre', 0); }
    ligne(t, 'rondin', 2, 100, 170, 100, 290, 2);
    remplir(t, 'cuirRouge', (x, y) => x >= 102 && x < 136 && y >= 172 && y < 200 - ((x * 7) % 11), (x) => (x < 112 ? 3 : 2));
  } },
  // Les Pics Gelés : une aiguille de roche qui monte très haut, la tour de guet naine perchée tout en
  // haut, un pont de corde vers un autre pic, la mer de nuages en bas, des stalactites de glace,
  // une bannière gelée tendue par le vent
  sommet: { l: 400, h: 300, dessin(t) {
    // les deux pics
    for (const [cx, w, haut] of [[150, 70, 60], [322, 50, 104]]) {
      remplir(t, 'roche', (x, y) => y >= haut && Math.abs(x + 0.5 - cx) < 10 + (y - haut) * w / 240 + Math.sin(y * 0.15) * 3, (x, y) => (x < cx ? 4 : 2) + ((x * 5 + y * 3) % 11 === 0 ? -1 : 0));
      for (let y = haut; y < 300; y += 3) { const w2 = 10 + (y - haut) * w / 240; for (let x = Math.round(cx - w2); x < cx - w2 + 4 + ((y * 7) % 5); x++) t.poser(x, y, 'neige', 5); }   // la neige collée au flanc
    }
    // la tour naine tout en haut du grand pic
    remplir(t, 'pierreBleue', (x, y) => y >= 10 && y < 64 && Math.abs(x + 0.5 - 150) < 14, (x, y) => tonBlocs(x, y, 7, 5, 3, (x) => (x < 144 ? 1 : 0)));
    for (let x = 136; x <= 164; x += 6) t.forme('pierreBleue', boite(x, 4, x + 3, 10, 1), { decalage: 0.3 });
    remplir(t, 'neige', (x, y) => y >= 2 && y < 6 && Math.abs(x + 0.5 - 150) < 16, () => 5);
    t.forme('lumiere', boite(147, 26, 153, 38, 3), { decalage: 1 });
    // la bannière gelée, tendue à l'horizontale par le vent
    ligne(t, 'rondin', 2, 164, 0, 164, 20, 2); remplir(t, 'eau', (x, y) => x >= 166 && x < 196 && y >= 2 && y < 12 - (x - 166) * 0.1 + Math.sin(x * 0.5), (x) => (x < 176 ? 4 : 3));
    // le pont de corde entre les deux pics : il part du pied de la tour et arrive sur un petit
    // ponton de bois posé au sommet du pic de droite
    const pontY = x => { const u = (x - 166) / (312 - 166); return 68 + (102 - 68) * u + Math.sin(u * Math.PI) * 16; };
    for (let x = 166; x <= 312; x++) { const y = Math.round(pontY(x)); t.poser(x, y, 'rondin', x % 4 === 0 ? 1 : 3); if (x % 6 === 0) ligne(t, 'chanvre', 3, x, y, x, y - 8, 1); t.poser(x, y - 8 - Math.round(Math.sin((x - 166) / 146 * Math.PI) * -2), 'chanvre', 3); }
    remplir(t, 'chene', (x, y) => x >= 308 && x < 336 && y >= 100 && y < 105, (x, y) => (y === 100 ? 5 : 2));   // le ponton
    ligne(t, 'rondin', 2, 309, 105, 316, 116, 2); ligne(t, 'rondin', 2, 335, 105, 328, 116, 2);   // ses jambes de force, calées dans la roche
    for (const x of [166, 312]) ligne(t, 'rondin', 2, x, pontY(x) - 12, x, pontY(x) + 3, 2);   // les poteaux d'amarrage
    // des stalactites de glace sous le pont et la tour
    for (let k = 0; k < 12; k++) { const x = 140 + k * 13, y = k < 2 ? 64 : Math.round(pontY(Math.min(312, x))); for (let j = 0; j < 4 + (k % 3) * 2; j++) t.poser(x, y + 1 + j, 'lueurBleue', 5 - (j > 3 ? 1 : 0)); }
    // la mer de nuages en bas : on est au-dessus de tout
    for (let k = 0; k < 16; k++) feuillage(t, 'neige', 10 + k * 26, 288 - (k % 3) * 6, 22 + (k % 4) * 4, 12, k);
  } },
});

// --- (v0.81) Les arbres du plan moyen, peints eux aussi (au lieu des silhouettes) ---
const ARBRES_HD = {
  ronds(t) { tronc(t, 40, 120, 70, 4); feuillage(t, 'vert', 40, 52, 28, 24, 1); feuillage(t, 'vert', 22, 66, 16, 14, 2); feuillage(t, 'vert', 58, 66, 16, 14, 3); },
  pommiers(t) {
    tronc(t, 40, 120, 74, 4); ligne(t, 'rondin', 3, 40, 80, 26, 64, 2); ligne(t, 'rondin', 3, 40, 80, 56, 62, 2);
    feuillage(t, 'vert', 40, 56, 32, 24, 4);
    for (let k = 0; k < 11; k++) { const x = 16 + hachage(k, 1, 4) * 48, y = 40 + hachage(k, 2, 4) * 34; if (t.mat(Math.round(x), Math.round(y)) === 'vert') { t.forme('pomme', ellipsoide(x, y, 2.4, 2.4), { decalage: 0.5 }); t.poser(Math.round(x) - 1, Math.round(y) - 1, 'pomme', 5); } }
  },
  saules(t) {
    tronc(t, 40, 120, 60, 5);
    feuillage(t, 'vert', 40, 54, 34, 18, 5);
    for (let k = -8; k <= 8; k++) { const x = 40 + k * 4, l = 40 - Math.abs(k) * 2.5; for (let j = 0; j < l; j++) t.poser(Math.round(x + Math.sin(j * 0.15) * 1.5), 58 + j, 'vert', (j + k) % 4 === 0 ? 4 : 2 + (k < 0 ? 1 : 0)); }
  },
  cypres(t) { tronc(t, 40, 120, 106, 2); feuillage(t, 'vert', 40, 62, 10, 52, 6); },
  chenes(t) {
    tronc(t, 40, 120, 72, 7); ligne(t, 'rondin', 4, 40, 76, 18, 58, 3); ligne(t, 'rondin', 4, 40, 76, 62, 56, 3);
    for (const [x, y, r] of [[40, 42, 22], [18, 56, 16], [62, 56, 16], [28, 30, 14], [52, 30, 14]]) feuillage(t, 'vert', x, y, r, r * 0.8, x + y);
  },
  sapins(t) {
    tronc(t, 40, 120, 104, 3);
    for (let k = 0; k < 5; k++) remplir(t, 'sapin', (x, y) => { const y0 = 14 + k * 18, h = 30; return y >= y0 && y < y0 + h && Math.abs(x + 0.5 - 40) < (y - y0) * (0.55 + k * 0.08); }, (x, y) => (x < 40 ? 4 : 2) + ((x + y) % 5 === 0 ? -1 : 0));
  },
  sapinsNeige(t) { ARBRES_HD.sapins(t); for (let y = 0; y < t.h; y++) for (let x = 0; x < 40; x++) if (t.mat(x, y) === 'sapin' && t.mat(x, y - 1) !== 'sapin') { t.poser(x, y, 'neige', 5); t.poser(x, y + 1, 'neige', 4); } },
  mallorns(t) { remplir(t, 'argent', (x, y) => y >= 30 && Math.abs(x + 0.5 - 40) < 4 + Math.max(0, y - 108) * 0.6, (x) => (x < 40 ? 5 : 3)); ligne(t, 'argent', 4, 40, 70, 20, 58, 2); ligne(t, 'argent', 4, 40, 70, 60, 58, 2); etageFeuilles(t, 'feuilleOr', 40, 66, 30, 12, 7, 9); etageFeuilles(t, 'feuilleOr', 40, 32, 32, 18, 8, 12); },
  automne(t) { tronc(t, 40, 120, 70, 4); feuillage(t, 'automne', 40, 50, 28, 26, 9); feuillage(t, 'feuilleOr', 52, 40, 12, 10, 10); },
  cactus(t) {
    const bras = (x0, y0, x1, y1, w) => remplir(t, 'cactus', (x, y) => x >= Math.min(x0, x1) - w && x <= Math.max(x0, x1) + w && y >= Math.min(y0, y1) && y <= Math.max(y0, y1), (x) => (x % 3 === 0 ? 2 : 3) + (x < 40 ? 1 : 0));
    bras(40, 30, 40, 120, 6); bras(20, 56, 20, 80, 4); bras(20, 78, 34, 84, 0); bras(60, 46, 60, 74, 4); bras(46, 72, 60, 76, 0);
    for (const [x, y] of [[40, 30], [20, 56], [60, 46]]) t.forme('cactus', ellipsoide(x, y, 6, 4), { decalage: 0.3 });
    t.forme('plume', ellipsoide(40, 27, 3, 2), { decalage: 0.5 });   // une fleur au sommet
  },
  colonnes(t) { remplir(t, 'gres', (x, y) => y >= 40 && y < 120 && Math.abs(x + 0.5 - 40) < 9, (x, y) => (x < 36 ? 4 : x > 44 ? 2 : 3) - (y % 12 === 0 ? 1 : 0)); remplir(t, 'gres', (x, y) => y >= 34 + (x % 7) && y < 42 && Math.abs(x + 0.5 - 40) < 12, () => 4); remplir(t, 'gres', (x, y) => y >= 112 && Math.abs(x + 0.5 - 40) < 13, () => 3); },
  pieux(t) { for (const dx of [-14, 0, 14]) { remplir(t, 'rondin', (x, y) => y >= 60 + Math.abs(dx) && Math.abs(x + 0.5 - 40 - dx) < 4 && (y >= 70 + Math.abs(dx) || Math.abs(x + 0.5 - 40 - dx) < (y - 60 - Math.abs(dx)) * 0.4), (x) => (x < 40 + dx ? 4 : 2)); } ligne(t, 'fer', 2, 22, 96, 58, 96, 2); t.forme('os', ellipsoide(40, 56, 5, 5), { decalage: 0.3 }); t.poser(38, 56, 'rochesombre', 0); t.poser(42, 56, 'rochesombre', 0); },
};
function tronc(t, cx, bas, haut, w) {
  remplir(t, 'rondin', (x, y) => y >= bas - haut && y < bas && Math.abs(x + 0.5 - cx) < w + Math.max(0, y - bas + 8) * 0.6, (x, y) => (x < cx - 1 ? 4 : 2) + ((y * 3) % 11 === 0 ? -1 : 0));
}
Object.assign(RAMPES_REPERES, {
  pomme: [0x3a0808, 0x6a1010, 0x9a1c18, 0xc83226, 0xe85a40, 0xffa080],
  sapin: [0x08180e, 0x102818, 0x1a3c22, 0x26522e, 0x386c3c, 0x52884e],
  cactus: [0x0e2a14, 0x1a4420, 0x2a602e, 0x3e7c3c, 0x58984e, 0x80b46a],
});
function textureArbre(scene, forme, variante = 0, biome = 'comte') {
  if (typeof arbrePremierPlanHD === 'function' && ARBRES_PREMIER_PLAN[forme]) return arbrePremierPlanHD(scene, forme, biome, variante);   // (v1.63)
  const cle = 'arbreHD_' + forme;
  if (scene.textures.exists(cle)) return cle;
  if (!ARBRES_HD[forme]) return null;
  const t = toileRepere(80, 120);
  ARBRES_HD[forme](t);
  t.contour();
  t.texture(scene, cle);
  return cle;
}
