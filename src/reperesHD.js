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
  ambrennes(t) { Object.assign(t.rampes, rampesAmbrenne('moissons')); peindreAmbrenne((x, y, m, k) => t.poser(x, y, m, k), { cx: 40, base: 117, H: 100, graine: 3 }); },   // (planche 91 : l'ambrenne de Sérambre)
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

// --- (planche 91, validée) Les repères des elfes : le val d'Ardévanne (le pont de racines, l'île de la rotonde) et la forêt
// de Sérambre (la nef d'arches, l'Arbre-Mère). Peints comme les autres repères, avec l'ambrenne et la torsade (arbresHD.js).

Object.assign(RAMPES_REPERES, {
  pierreRousse: [0x34160c, 0x5a2a16, 0x844020, 0xaa5a2e, 0xc87a44, 0xe4a068],
  pierreRousseC: [0x4a2414, 0x74401e, 0x9e5c2e, 0xc27c42, 0xdc9c5e, 0xf0c088],
  erableR: [0x3a0a06, 0x681408, 0x9c220e, 0xc83a16, 0xe8602a, 0xff9450],
  erableO: [0x4a1a04, 0x7c3008, 0xb04e10, 0xd8721c, 0xf09a34, 0xffc664],
  erableJ: [0x4a3004, 0x7a5208, 0xb07c10, 0xd8a41c, 0xf0c838, 0xfff07c],
  erableLoinR: [0x6a3a30, 0x8a5040, 0xa86a54, 0xc0846a, 0xd4a084, 0xe6bea2],
  erableLoinO: [0x6a5034, 0x8a6a44, 0xa88458, 0xc0a06e, 0xd4b88a, 0xe6d0a8],
  sousBois: [0x2a1008, 0x441c0c, 0x5e2a12, 0x78381a, 0x944a24, 0xb05e30],
  herbeRousse: [0x2a2410, 0x46381a, 0x665024, 0x846a30, 0xa48840, 0xc4a85a],
  racine: [0x1a0e08, 0x2e1a0e, 0x462816, 0x603a20, 0x7c502c, 0x9a6a3c],
  tuileFeuille: [0x3a0e08, 0x641a0e, 0x902a14, 0xb8401c, 0xd8602a, 0xf08a44],
  eauLac: [0x1a2a3a, 0x284256, 0x3a5c72, 0x5a7e90, 0x86a6b2, 0xb8d0d4],
  lanterneF: [0x7a3a08, 0xb06010, 0xe0901c, 0xf8b838, 0xffd870, 0xfff4c0],
  dalleOr: [0x5a4a30, 0x84704c, 0xa8946a, 0xc8b48a, 0xe0d0aa, 0xf4ead0],
  lueurOr: [0x8a6010, 0xc09028, 0xe8c048, 0xf8e07c, 0xfff2b4, 0xfffbe8],
  ombreOr: [0x1e0e04, 0x2e1a08, 0x42280c, 0x5a3a12, 0x74501c, 0x906828],
  pierreElfe: [0x4a4840, 0x6e6a5e, 0x928c7c, 0xb4ae9c, 0xd2ccba, 0xece8da],
  preOr: [0x3a4a28, 0x56683a, 0x70864c, 0x8aa462, 0xa4bc7a, 0xbed29a],
  prePres: [0x4a4a22, 0x66643a, 0x82804a, 0x9a9450, 0xb0aa66, 0xc6c084],
  roseau: [0x2a2a10, 0x44401a, 0x645a24, 0x847830, 0xa49840, 0xc4b860],
});

// --- Petits outils ---
// les couleurs d'une essence sous un suffixe, voilées par la distance (vers `brume`)
function rampesVoilees(t, suffixe, espece, saison, voile = 0, brume = 0xe8dcc0, feuilles = null) {
  const R = rampesArbre(saison, espece, null);
  if (feuilles) [R.arbFeuA, R.arbFeuB, R.arbFeuC] = feuilles.map(c => Array.isArray(c) ? c : rampe(c));
  for (const k in R) t.rampes[k + suffixe] = voile ? R[k].map(c => melangeCouleur(c, brume, voile)) : R[k];
}
const putS = (t, suffixe) => (x, y, m, i) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < t.l && y < t.h) t.poser(x, y, m + suffixe, Math.max(0, Math.min(5, Math.round(i)))); };
// Une boule de feuillage, peinte dans sa boîte (bien plus vite qu'une forme sur toute la toile) : éclairée en haut à
// gauche, le bord découpé en touffes, quelques reflets
function bouleFeuillage(t, mat, cx, cy, rx, ry, g = 1, ombreBas = true) {
  for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++) for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy;
    if (d > 1 - 0.16 * hachage(x >> 1, y >> 1, g)) continue;
    const z = Math.sqrt(Math.max(0, 1 - d)), lum = dx * LUMIERE[0] + dy * LUMIERE[1] + z * LUMIERE[2];
    let i = Math.floor(1.4 + (lum + 0.15) * 3.4 + (hachage(x, y, g + 3) > 0.88 ? 0.8 : hachage(x, y, g + 7) > 0.9 ? -0.8 : 0));
    if (ombreBas && d > 0.7 && dy > 0.2) i = Math.min(i, 1);
    t.poser(x, y, mat, i);
  }
}
// Un coteau : la pente (sa ligne de crête `bord(x)`), couverte de couronnes d'automne serrées, plus pâles au loin
function coteau(t, bord, { x0 = 0, x1 = t.l, bas = () => t.h, graine = 1, loin = false, r = 5, mats = null }) {
  const M = mats || (loin ? ['erableLoinR', 'erableLoinO', 'erableLoinR'] : ['erableR', 'erableO', 'erableJ', 'erableO']);
  remplir(t, loin ? 'erableLoinR' : 'sousBois', (x, y) => x >= x0 && x < x1 && y >= bord(x) + 2 && y < bas(x), (x, y) => 2 + (hachage(x >> 2, y >> 2, graine) > 0.6 ? 1 : 0));
  const pts = [];
  for (let x = x0; x < x1; x += r * 0.9) for (let k = 0; k < 40; k++) {
    const y = bord(Math.round(x)) + r * 0.4 + k * r * 0.95; if (y > bas(Math.round(x)) - 1) break;
    pts.push([x + (hachage(Math.round(x), k, graine) - 0.5) * r, y, Math.round(x) * 41 + k]);
  }
  pts.sort((a, b) => a[1] - b[1]);
  for (const [x, y, k] of pts) { const rr = r * (0.75 + hachage(k, 3, graine) * 0.55); bouleFeuillage(t, M[Math.floor(hachage(k, 4, graine) * M.length)], x, y, rr, rr * 0.82, graine + k); }
}
// une petite lanterne-feuille qui luit (une feuille pliée en deux), pendue à son fil
function lanterneFeuille(t, x, y, taille = 1) {
  const h = Math.round(4 * taille), w = Math.max(1, Math.round(1.5 * taille));
  for (let j = 0; j < h; j++) { const demi = Math.round(w * Math.sin((j + 0.5) / h * Math.PI)); for (let i = -demi; i <= demi; i++) t.poser(x + i, y + j, 'lanterneF', i < 0 ? 5 : j === h - 1 ? 3 : 4); }
  if (taille >= 1.4) for (let j = 1; j < h - 1; j++) t.poser(x, y + j, 'lanterneF', 2);
  t.poser(x, y - 1, 'racine', 2);
}
function guirlandeLanternes(t, x0, y0, x1, y1, fleche, n, taille = 1) {
  const pt = u => [x0 + (x1 - x0) * u, y0 + (y1 - y0) * u + Math.sin(u * Math.PI) * fleche];
  for (let i = 0; i <= 80; i++) { const [x, y] = pt(i / 80); t.poser(Math.round(x), Math.round(y), 'racine', 3); }
  for (let k = 1; k <= n; k++) { const [x, y] = pt(k / (n + 1)); lanterneFeuille(t, Math.round(x), Math.round(y) + 2, taille); }
}
// une porte en arc, la lumière dedans, son encadrement de pierre claire
function arcLumineux(t, x, yb, w, h, mat = 'pierreRousseC') {
  const r = w / 2, haut = yb - h;
  const dedans = (px, py, m) => { const dx = px + 0.5 - x, dy = py + 0.5 - (haut + r); return py < yb && Math.abs(dx) < r + m && (py >= haut + r || dx * dx + dy * dy < (r + m) * (r + m)); };
  for (let py = haut - 3; py < yb; py++) for (let px = Math.floor(x - r - 2); px <= x + r + 2; px++) {
    if (dedans(px, py, 0)) t.poser(px, py, 'lumiere', py < haut + r ? 5 : py > yb - 3 ? 3 : 4);
    else if (dedans(px, py, 1.2)) t.poser(px, py, mat, px < x ? 5 : 3);
  }
}
// les tuiles en forme de feuille, en rangées décalées : le bord de chaque feuille, sa pointe claire
function tonEcailleToit(x, y, l = 5, h = 4) {
  const r = Math.floor(y / h), dec = (r % 2) * Math.floor(l / 2), u = (((x + dec) % l) + l) % l, v = y % h;
  return v === h - 1 || (v === h - 2 && (u === 0 || u === l - 1)) ? 1 : v === 0 && u > 0 && u < l - 1 ? 4 : 3;
}
// Une maison basse des terrasses : un mur de pierre rousse claire, une porte en arc qui luit, une petite fenêtre
// ronde, un toit en feuille (deux pans courbes qui se relèvent au bout, une nervure au faîte)
function maisonFeuille(t, cx, yb, w, { h = 9, sens = 1 } = {}) {
  remplir(t, 'pierreRousseC', (x, y) => y >= yb - h && y < yb && Math.abs(x + 0.5 - cx) < w, (x, y) => tonBlocs(x, y, 6, 3, 3, (xx) => (xx < cx - w + 2 ? 1 : xx > cx + w - 3 ? -1 : 0)));
  arcLumineux(t, cx - sens * Math.round(w * 0.3), yb, 4, Math.min(7, h - 1));
  if (w >= 7) { t.poser(cx + sens * Math.round(w * 0.45), yb - h + 3, 'lumiere', 5); t.poser(cx + sens * Math.round(w * 0.45) + 1, yb - h + 3, 'lumiere', 4); }
  const ht = Math.round(w * 0.95) + 3, y0 = yb - h;
  remplir(t, 'tuileFeuille', (x, y) => { const v = (y0 - y) / ht; if (v < 0 || v > 1) return false; const demi = (w + 3) * (1 - Math.pow(v, 0.75)) + (v < 0.18 ? (0.18 - v) * 12 : 0); return Math.abs(x + 0.5 - cx) < demi; },
    (x, y) => tonEcailleToit(x, y) + (x < cx ? 1 : -1) + (y === y0 ? -2 : 0));
  for (let y = y0 - ht; y < y0; y++) t.poser(cx, y, 'or', 3);   // (la nervure de la feuille, au faîte)
}
// Une terrasse sur une pente : un mur de pierre rousse (le haut suit `haut(x)`), l'herbe rousse dessus, du lierre
function murTerrasse(t, x0, x1, haut, h, { graine = 1, crete = null } = {}) {
  for (let x = Math.round(x0); x < x1; x++) {
    const yh = Math.round(haut(x));
    if (crete && yh < crete(x) + 6) continue;   // (le mur s'arrête où le coteau s'arrête)
    for (let y = yh; y < yh + h; y++) t.poser(x, y, 'pierreRousse', tonBlocs(x, y - yh + 40, 8, 4, 3, () => (x < x0 + 4 ? 1 : x > x1 - 4 ? -1 : 0)));
    t.poser(x, yh, 'pierreRousseC', 5); t.poser(x, yh - 1, 'herbeRousse', 3 + (hachage(x, 1, graine) > 0.7 ? 1 : 0));
    if (hachage(x, 2, graine) > 0.55) t.poser(x, yh - 2, 'herbeRousse', 2);
    if (hachage(x >> 1, 7, graine) > 0.86) for (let j = 0; j < 2 + (x % 3); j++) t.poser(x, yh + 1 + j, 'mousse', 3);
  }
}
// Le lac miroir : sous la rive `rive(x)`, le reflet de ce qui est au-dessus (renversé autour de la rive, un ton plus
// sombre, des rides qui le décalent), le ciel reflété là où il n'y a rien ; jusqu'à `fin(x)`
function refletDe(t, m) { const k = 'R_' + m; if (!t.rampes[k]) t.rampes[k] = t.rampes[m].map(c => melangeCouleur(c, 0x2e5068, 0.58)); return k; }
function rideEau(t, x, y, g) { return hachage(y, 1, g) > 0.55 && fbm(x * 0.07, y * 0.9, g) > 0.6; }
function lacMiroir(t, rive, fin, { graine = 1 } = {}) {
  for (let x = 0; x < t.l; x++) {
    const yr = Math.round(rive(x)), yf = Math.round(fin(x));
    for (let y = yr; y < yf && y < t.h; y++) {
      const p = (y - yr) / 60, ride = Math.round(Math.sin(y * 1.1 + graine + x * 0.02) * (0.4 + p * 1.4));
      const sx = Math.max(0, Math.min(t.l - 1, x + ride)), sy = 2 * yr - y - 1;
      const m = sy >= 0 ? t.mat(sx, sy) : null;
      if (m && m !== 'eauLac' && !m.startsWith('R_')) t.poser(x, y, refletDe(t, m), t.teinte(sx, sy) - 1);
      else t.poser(x, y, 'eauLac', 4 - Math.min(2, Math.floor(p * 2.2)));
      if (y > yr + 1 && rideEau(t, x, y, graine)) t.poser(x, y, 'eauLac', 4 + (hachage(x, y, graine) > 0.7 ? 1 : 0));   // (les rides, en traits couchés)
    }
  }
}
// un calque : une toile de la même taille, puis posée sur la toile (avec son reflet autour de `axe`, sur l'eau)
function calqueRepere(t) { const c = toileRepere(t.l, t.h); c.rampes = t.rampes; return c; }
function poserCalque(t, c, { axe = null, eau = null } = {}) {
  for (let y = 0; y < t.h; y++) for (let x = 0; x < t.l; x++) { const m = c.mat(x, y); if (m) t.poser(x, y, m, c.teinte(x, y)); }
  if (axe !== null) for (let y = axe; y < t.h; y++) for (let x = 0; x < t.l; x++) {
    if (eau && t.mat(x, y) !== 'eauLac' && !(eau(x, y))) continue;
    const ride = Math.round(Math.sin(y * 1.1 + x * 0.02) * (0.4 + (y - axe) / 50)), sy = 2 * axe - y - 1, sx = Math.max(0, Math.min(t.l - 1, x + ride));
    const m = sy >= 0 ? c.mat(sx, sy) : null;
    if (m && !rideEau(t, x, y, 5)) t.poser(x, y, refletDe(t, m), c.teinte(sx, sy) - 1);
  }
}
// Un pont de racines : des racines tressées en arche d'une rive à l'autre, le tablier usé par les pas, la main
// courante, les lanternes pendues dessous
function pontRacines(t, x0, y0, x1, y1, fleche, { ep = 3.2, graine = 1, lanternes = 4, brins = 4 } = {}) {
  const pt = u => [x0 + (x1 - x0) * u, y0 + (y1 - y0) * u - Math.sin(u * Math.PI) * fleche];
  const put = (x, y, m, i) => { x = Math.round(x); y = Math.round(y); if (t.dans(x, y)) t.poser(x, y, m === 'arbEcorce' ? 'racine' : 'mousse', Math.max(0, Math.min(5, Math.round(i) + 1))); };
  torsade(put, u => { const [x, y] = pt(u); return [x, y + ep * 0.7]; }, { largeur: u => ep * (1 + Math.pow(Math.abs(u - 0.5) * 2, 2) * 0.8), nb: brins, tours: Math.max(2, Math.abs(x1 - x0) / 30), g: graine, ecart: 0.55 });
  for (let i = 0; i <= 300; i++) { const [x, y] = pt(i / 300); t.poser(Math.round(x), Math.round(y - ep * 0.3), 'racine', 5); }
  const rampeY = u => pt(u)[1] - ep * 0.3 - 5;
  for (let i = 0; i <= 300; i++) { const u = i / 300, [x] = pt(u); t.poser(Math.round(x), Math.round(rampeY(u)), 'racine', 4); }
  const nP = Math.max(4, Math.round(Math.abs(x1 - x0) / 12));
  for (let k = 1; k < nP; k++) { const u = k / nP, [x, y] = pt(u); for (let j = Math.round(rampeY(u)) + 1; j < y - ep * 0.3; j++) t.poser(Math.round(x), j, 'racine', 2); }
  for (let k = 0; k < lanternes; k++) { const u = (k + 0.5) / lanternes, [x, y] = pt(u); const yl = Math.round(y + ep * 1.5); t.poser(Math.round(x), yl, 'racine', 2); t.poser(Math.round(x), yl + 1, 'racine', 2); lanterneFeuille(t, Math.round(x), yl + 3, 1); }
}
// Des colonnes de lumière qui tombent en biais : elles éclaircissent ce qu'elles traversent
function colonnesLumiere(t, rayons, { graine = 1, pente = 0.45, sauf = null } = {}) {
  for (const [xh, w, y0, y1] of rayons) for (let y = y0; y < y1; y++) {
    const xc = xh + (y - y0) * pente;
    for (let x = Math.floor(xc - w); x <= xc + w; x++) {
      if (!t.dans(x, y)) continue;
      const bord = Math.abs(x + 0.5 - xc) > w * 0.55;
      if (bord && (x + y) % 2) continue;   // (le bord du rayon, tramé)
      const m = t.mat(x, y);
      if (m && m !== 'lueurOr' && !(sauf && sauf(m))) t.poser(x, y, m, t.teinte(x, y) + (m === 'ombreOr' || m.endsWith('_fb') || m === 'feuillesSol' ? 2 : 1));
      if (m && !bord && hachage(x, y, graine + 9) > 0.985) t.poser(x, y, 'lueurOr', 4);   // (un grain de lumière dans le rayon)
    }
  }
}
function grainsOr(t, n, x0, y0, x1, y1, graine = 1) { for (let k = 0; k < n; k++) { const x = Math.round(x0 + hachage(k, 1, graine) * (x1 - x0)), y = Math.round(y0 + hachage(k, 2, graine) * (y1 - y0)); t.poser(x, y, 'lueurOr', 5); if (k % 4 === 0) { t.poser(x + 1, y, 'lueurOr', 3); t.poser(x, y + 1, 'lueurOr', 3); } } }
// Une arche vivante : deux ambrennes qui se penchent l'un vers l'autre et se tressent en ogive (s : le suffixe)
function archeVivante(t, xa, xb, yb, yA, s, { ep = 4, graine = 1, feuilles = true, n = 14, r = 9 } = {}) {
  const put = putS(t, s), xc = (xa + xb) / 2, demi = (xb - xa) / 2;
  const cote = sens => u => { const xp = sens < 0 ? xa : xb, h = yb - yA, th = 1.12; return [xp - sens * demi * (1 - Math.cos(u * th)) / (1 - Math.cos(th)), yb - h * Math.sin(u * th) / Math.sin(th)]; };
  const zb = new Map();
  for (const sens of [-1, 1]) torsade(put, cote(sens), { largeur: u => ep * (1.2 - u * 0.5) * (1 + Math.max(0, 0.1 - u) * 4), nb: 3, tours: 1.4, phase: sens > 0 ? 1.3 : 0, g: graine + sens, zb, ecart: 0.5 });
  for (const sens of [-1, 1]) for (let r2 = 0; r2 < 2; r2++) traitArbre(put, (sens < 0 ? xa : xb), yb - ep, (sens < 0 ? xa : xb) + sens * (ep * (1.6 + r2 * 1.2)) * (r2 ? 1 : -0.6), yb + 1, ep * 0.9, 1, 'arbEcorce', graine + 30 + r2 + sens);
  if (feuilles) couronneOr(put, { ccx: xc, ccy: yA + (yb - yA) * 0.08, rxc: demi * 1.15, ryc: Math.max(8, (yb - yA) * 0.2), n, r, g: graine + 5, ecaille: Math.max(1.6, r * 0.26), filtre: (x, y) => { const dx = (x - xc) / demi; return y < yA + (yb - yA) * (0.06 + dx * dx * 0.55); } });
}


// La rive de devant, mince (de l'herbe rousse et des roseaux, là où il y a de l'eau) : dessous, rien, c'est le pré du
// récit qui fait la rive proche
function riveDevant(t, rive, devant, g = 12) {
  for (let x = 0; x < t.l; x++) { const y0 = Math.round(devant(x)); if (y0 <= rive(x) + 1) continue;
    for (let y = y0; y < y0 + 3 && y < t.h; y++) t.poser(x, y, 'herbeRousse', 3 - (y - y0) + (hachage(x, y, g) > 0.7 ? 1 : 0));
    if (hachage(x, 1, g) > 0.5 && x % 2 === 0) { const h = 3 + Math.round(hachage(x, 2, g) * 6); for (let j = 0; j < h; j++) t.poser(x + (j > h - 3 ? 1 : 0), y0 + 1 - j, 'roseau', 2 + (j > h - 3 ? 2 : 0)); } }
}

// Le pré, tout en bas : le même vert que les collines du récit (la contrée de la vallée), pour que le repère ait les
// pieds dans l'herbe ; il commence sous la rive de devant, ou sous le bas des coteaux
function preDuBas(t, depuis, g = 3, mat = 'prePres') {
  for (let x = 0; x < t.l; x++) for (let y = Math.round(depuis(x)); y < t.h; y++) t.poser(x, y, mat, 3 + (hachage(x >> 1, y, g) > 0.75 ? 1 : 0) - (hachage(x, y, g + 1) > 0.85 ? 1 : 0));
}

Object.assign(RAMPES_REPERES, {
  montLoin: [0x4e4258, 0x62546c, 0x786a80, 0x908296, 0xaa9cae, 0xc6bac8],
  feuillesSol: [0x3a1c06, 0x5e3410, 0x84501a, 0xa86e26, 0xc89034, 0xe4b450],
});
// des monts lointains, bleutés par la distance : le versant à l'ombre, le versant au soleil, une brume au pied
function montsLoin(t, bord, bas, x0 = 0, x1 = t.l) {
  for (let x = x0; x < x1; x++) { const y0 = Math.round(bord(x)), pente = bord(x + 1) - bord(x - 1);
    for (let y = y0; y < bas; y++) t.poser(x, y, 'montLoin', (pente > 0 ? 3 : 2) + (y < y0 + 2 ? 1 : 0) + (y > bas - 8 ? 1 : 0) + (hachage(x >> 2, y >> 2, 4) > 0.82 ? 1 : 0)); }
}
// Le sol de la forêt d'or : un tapis de feuilles d'or tombées, plus sombre au pied des arbres, le bord en dentelle
function solFeuilles(t, sol, epais, x0 = 2, x1 = t.l - 2, g = 1) {
  for (let x = x0; x < x1; x++) { const y0 = Math.round(sol(x)) - 3, y1 = Math.round(sol(x) + epais - Math.pow((x - (x0 + x1) / 2) / ((x1 - x0) / 2), 6) * epais);
    for (let y = y0; y < y1; y++) { if (y === y1 - 1 && hachage(x, 3, g) > 0.5) continue; t.poser(x, y, 'feuillesSol', 3 + (y === y0 ? 1 : 0) - (y > y0 + 4 ? 1 : 0) + (hachage(x, y, g) > 0.8 ? 1 : hachage(x, y, g + 1) > 0.85 ? -1 : 0)); } }
}
// Un îlot de rochers de pierre rousse, arrondis, l'herbe rousse et des feuilles dessus
function ilotRoux(t, cx, yHaut, yEau, demi, g = 1) {
  const blocs = [];
  for (let k = 0; k < 14; k++) { const u = (k + 0.5) / 14 * 2 - 1, x = cx + u * demi * 0.92, h = (yEau - yHaut) * (1 - u * u * 0.55); blocs.push([x, yEau - h * (0.45 + hachage(k, 1, g) * 0.2), 7 + hachage(k, 2, g) * 6, h * 0.62]); }
  blocs.sort((a, b) => a[1] - b[1]).forEach(([x, y, rx, ry], k) => {
    for (let py = Math.floor(y - ry); py < yEau; py++) for (let px = Math.floor(x - rx); px <= x + rx; px++) {
      const dx = (px + 0.5 - x) / rx, dy = (py + 0.5 - y) / ry; if (dx * dx + Math.min(0, dy) ** 2 * 1 > 1) continue;
      const lum = -dx * 0.6 - Math.min(0, dy) * 0.5; t.poser(px, py, 'pierreRousse', Math.round(2.4 + lum * 2 + (hachage(px >> 1, py >> 1, g + k) > 0.8 ? 1 : 0) - (py > yEau - 4 ? 1 : 0)));
    }
  });
  for (let x = Math.round(cx - demi * 0.86); x <= cx + demi * 0.86; x++) { let y = 0; while (y < t.h && t.mat(x, y) !== 'pierreRousse') y++; for (let j = -2; j < 1; j++) t.poser(x, y + j, 'herbeRousse', 3 + j + (hachage(x, j, g) > 0.6 ? 1 : 0)); }
}
// Un pavillon rond à colonnes (une rotonde ouverte, la lumière entre les colonnes) et son toit en feuille : un cône
// bas aux bords festonnés comme une feuille d'érable, les nervures dorées, une flèche fine et sa lanterne
function rotonde(t, px, pb, r, hm, ht, { nc = 9 } = {}) {
  const yh = pb - hm;
  remplir(t, 'pierreRousse', (x, y) => y >= pb - 4 && y < pb + 1 && Math.abs(x + 0.5 - px) < r + 3 - (y - pb + 4) * -0.3, (x, y) => (y === pb - 4 ? 5 : 3) - (x > px + r * 0.5 ? 1 : 0));
  remplir(t, 'lumiere', (x, y) => y >= yh + 1 && y < pb - 4 && Math.abs(x + 0.5 - px) < r - 1, (x, y) => (y < yh + 6 ? 5 : 4));
  for (let k = 0; k <= nc; k++) { const a = Math.PI * k / nc, x = px - Math.cos(a) * (r - 2), w = 0.7 + Math.sin(a) * 1.7; remplir(t, 'pierreRousseC', (qx, qy) => qy >= yh && qy < pb - 4 && Math.abs(qx + 0.5 - x) < w, (qx) => (qx < x ? 5 : 3)); }
  remplir(t, 'pierreRousse', (x, y) => y >= yh - 3 && y < yh + 1 && Math.abs(x + 0.5 - px) < r + 1, (x, y) => (y === yh - 3 ? 5 : 3) - (x > px + r * 0.5 ? 1 : 0));
  // le toit : à chaque hauteur sa demi-largeur, et le bord bas festonné de lobes pointus (les pointes d'une feuille)
  const R = r + 6, lobes = 7, y0 = yh - 3;
  const demi = y => { const v = (y0 - y) / ht; return v < 0 || v > 1 ? -1 : R * Math.pow(1 - v, 1.35); };
  for (let y = y0 - ht; y <= y0 + 5; y++) for (let x = Math.floor(px - R - 1); x <= px + R + 1; x++) {
    const dx = x + 0.5 - px;
    let dedans = false;
    if (y <= y0) dedans = Math.abs(dx) < demi(y);
    else { const u = (dx / R + 1) / 2 * lobes, f = u - Math.floor(u), pointe = 5 * (1 - Math.abs(f - 0.5) * 2); dedans = Math.abs(dx) < R && y - y0 < pointe * Math.sqrt(Math.max(0, 1 - (dx / R) ** 2)) + 0.5; }
    if (!dedans) continue;
    const w = Math.max(1, demi(Math.min(y, y0))), u = dx / w;
    t.poser(x, y, 'tuileFeuille', (y > y0 ? 2 : tonEcailleToit(x, y, 6, 4)) + (u < -0.35 ? 1 : u > 0.45 ? -1 : 0));
  }
  for (let k = 0; k < lobes; k++) { const dx = ((k + 0.5) / lobes * 2 - 1) * R; for (let y = y0 - ht; y <= y0 + 3; y++) { const w = demi(Math.min(y, y0)); if (w <= 0) continue; const x = Math.round(px + dx * Math.min(1, w / R)); if (Math.abs(x - px) < w || y > y0) t.poser(x, y, 'or', dx < 0 ? 4 : 3); } }
  for (let y = y0 - ht - 9; y < y0 - ht + 1; y++) t.poser(px, y, 'or', 4);
  lanterneFeuille(t, px, y0 - ht - 7, 1.4);
}

Object.assign(REPERES_HD, {
  // ---------------------------------------------------------------------------------------------
  // Le val d'Ardévanne, vu de loin : le pont de racines. Deux coteaux en flammes descendent jusqu'au lac ; leurs
  // terrasses de pierre rousse portent des maisons basses aux toits en feuille ; deux vieux érables, un sur chaque
  // rive, ont tressé leurs racines par-dessus l'eau : un pont en arche et ses lanternes-feuilles ; le lac miroir
  // renvoie tout, et l'arche avec son reflet dessine un œil.
  ardevannePont: { l: 420, h: 264, dessin(t) {
    const rive = x => (x < 60 ? 186.8 + Math.pow(Math.max(0, 60 - x) / 40, 1.5) * 59 : x < 176 ? 152 + (176 - x) * 0.3 : x > 360 ? 183.9 + Math.pow(Math.max(0, x - 360) / 40, 1.5) * 62 : x > 246 ? 152 + (x - 246) * 0.28 : 152) + Math.sin(x * 0.11) * 0.8;
    const devant = x => 245 + Math.sin(x * 0.045) * 1.5;
    montsLoin(t, x => 104 + Math.sin(x * 0.045 + 1) * 6 + Math.sin(x * 0.11) * 2 + Math.pow((x - 212) / 120, 2) * 24, 154, 80, 344);
    coteau(t, x => 132 + Math.sin(x * 0.07) * 3, { x0: 140, x1: 284, bas: () => 154, graine: 3, loin: true, r: 3 });
    const crG = x => (x < 84 ? 54 + Math.pow((84 - x) / 84, 1.15) * 182 : 54 + Math.pow((x - 84) / 100, 1.5) * 98) + Math.sin(x * 0.09) * 2;
    const crD = x => (x > 338 ? 52 + Math.pow((x - 338) / 82, 1.15) * 184 : 52 + Math.pow((338 - x) / 96, 1.5) * 100) + Math.sin(x * 0.08) * 2;
    const cr = x => (x < 210 ? crG(x) : crD(x)), sous = f => x => f(x) > cr(x) + 12 && x > 58 && x < 362;
    const basC = x => Math.min(rive(x), 247) + 1;
    coteau(t, crG, { x0: 0, x1: 190, bas: basC, graine: 5, r: 5.5 });
    coteau(t, crD, { x0: 232, x1: 420, bas: basC, graine: 7, r: 5.5 });
    const tG = i => x => rive(x) - 12 - i * 16 + Math.sin(x * 0.05 + i) * 1.5, tD = i => x => rive(x) - 12 - i * 16 + Math.sin(x * 0.05 + i * 2) * 1.5;
    for (let i = 2; i >= 0; i--) { murTerrasse(t, 62 + i * 12, 166 - i * 28, tG(i), 6, { graine: 20 + i, crete: cr }); murTerrasse(t, 256 + i * 28, 358 - i * 12, tD(i), 6, { graine: 30 + i, crete: cr }); }
    [[40, tG(2), 7, 1], [96, tG(2), 6, -1], [26, tG(1), 8, 1], [80, tG(1), 8, 1], [124, tG(1), 6, -1], [54, tG(0), 9, 1], [108, tG(0), 8, -1], [146, tG(0), 6, -1],
     [302, tD(2), 6, 1], [358, tD(2), 7, -1], [316, tD(1), 7, 1], [386, tD(1), 8, -1], [284, tD(0), 6, 1], [336, tD(0), 9, -1], [396, tD(0), 7, -1]].filter(([x, f]) => sous(f)(x)).forEach(([x, f, w, s2]) => maisonFeuille(t, x, Math.round(f(x)) - 1, w, { h: Math.round(w * 1.1) + 1, sens: s2 }));
    [[12, tG(2)], [66, tG(2)], [52, tG(1)], [104, tG(1)], [82, tG(0)], [130, tG(0)], [266, tD(0)], [312, tD(0)], [330, tD(2)], [346, tD(1)], [372, tD(0)], [410, tD(1)]].filter(([x, f]) => sous(f)(x)).forEach(([x, f], k) =>
      arbreDansRepere(t, '_pa' + k, { espece: 'chene', saison: 'moissons', cx: x, base: Math.round(f(x)) - 1, H: 18 + (k * 7) % 9, graine: 50 + k, feuilles: [[0xc83a16, 0xe8602a, 0x8c200c], [0xd8721c, 0xf09a34, 0xa84a10], [0xd8a41c, 0xf0c838, 0xa87810]][k % 3] }));
    // les deux vieux érables des rives (en feuilles pleines : ici l'automne ne les dénude jamais), et leur pont de racines
    arbreDansRepere(t, '_va', { espece: 'chene', saison: 'moissons', cx: 154, base: 152, H: 94, graine: 61, ecartX: 1.05, ecartD: 0.55, feuilles: [0xc83a16, 0xe8602a, 0x8c200c] });
    arbreDansRepere(t, '_vb', { espece: 'chene', saison: 'moissons', cx: 268, base: 152, H: 88, graine: 64, ecartX: 1.05, ecartG: 0.55, feuilles: [0xd8721c, 0xf09a34, 0xa84a10] });
    pontRacines(t, 158, 148, 264, 148, 36, { ep: 3.8, graine: 4, lanternes: 5, brins: 5 });
    guirlandeLanternes(t, 22, tG(2)(22) - 15, 64, tG(2)(64) - 15, 4, 3); guirlandeLanternes(t, 332, tD(2)(332) - 14, 372, tD(2)(372) - 14, 4, 3);
    guirlandeLanternes(t, 84, tG(0)(84) - 14, 128, tG(0)(128) - 14, 4, 3); guirlandeLanternes(t, 314, tD(0)(314) - 14, 370, tD(0)(370) - 14, 5, 4);
    lacMiroir(t, rive, devant, { graine: 2 });
    // la rive de devant, mince ; la barque-feuille amarrée ; des lanternes posées sur l'eau
    riveDevant(t, rive, devant, 12);
    preDuBas(t, x => 248 + Math.sin(x * 0.07) * 1.2, 3);
    remplir(t, 'racine', (x, y) => { const dx = (x + 0.5 - 292) / 15, dy = (y + 0.5 - 226) / 3; return dx * dx + dy * dy <= 1 && y >= 225; }, (x) => (x < 292 ? 4 : 3));
    for (let x = 279; x < 306; x++) t.poser(x, 225, 'erableO', 4);
    for (const [x, y] of [[96, 206], [134, 222], [190, 204], [236, 226], [176, 236], [340, 208]]) { if (y > devant(x) - 5) continue; lanterneFeuille(t, x, y, 1); t.poser(x - 2, y + 4, 'eauLac', 5); t.poser(x + 2, y + 4, 'eauLac', 5); }
  } },

  // ---------------------------------------------------------------------------------------------
  // Le val d'Ardévanne, en arrivant : l'île de la rotonde. Au milieu du lac, un îlot de rochers roux, la rotonde de
  // la Dame (une colonnade qui luit sous un toit en feuille d'érable, festonné, aux nervures d'or), un érable immense
  // derrière ; deux ponts de racines le relient aux rives et à leurs terrasses ; des lanternes posées sur l'eau.
  ardevanneIle: { l: 420, h: 264, dessin(t) {
    const rive = x => (x < 50 ? 163 + Math.pow(Math.max(0, 50 - x) / 36, 1.5) * 83 : x < 120 ? 142 + (120 - x) * 0.3 : x > 370 ? 164.4 + Math.pow(Math.max(0, x - 370) / 36, 1.5) * 82 : x > 300 ? 142 + (x - 300) * 0.32 : 142) + Math.sin(x * 0.1) * 0.8;
    const devant = x => 245 + Math.sin(x * 0.05 + 1) * 1.5;
    montsLoin(t, x => 96 + Math.sin(x * 0.04 + 2) * 8 + Math.sin(x * 0.12) * 2 + Math.pow((x - 210) / 150, 2) * 26, 144, 50, 370);
    coteau(t, x => 116 + Math.sin(x * 0.06) * 4, { x0: 70, x1: 350, bas: () => 144, graine: 13, loin: true, r: 3.5 });
    const crG = x => (x < 74 ? 62 + Math.pow((74 - x) / 74, 1.15) * 174 : 62 + Math.pow((x - 74) / 60, 1.5) * 70) + Math.sin(x * 0.09) * 2;
    const crD = x => (x > 350 ? 60 + Math.pow((x - 350) / 70, 1.15) * 176 : 60 + Math.pow((350 - x) / 64, 1.5) * 72) + Math.sin(x * 0.08) * 2;
    const cr = x => (x < 210 ? crG(x) : crD(x)), sous = f => x => f(x) > cr(x) + 12 && x > 58 && x < 362;
    const basC = x => Math.min(rive(x), 247) + 1;
    coteau(t, crG, { x0: 0, x1: 134, bas: basC, graine: 15, r: 5.5 });
    coteau(t, crD, { x0: 286, x1: 420, bas: basC, graine: 17, r: 5.5 });
    const tG = i => x => rive(x) - 11 - i * 15, tD = i => x => rive(x) - 11 - i * 15;
    for (let i = 1; i >= 0; i--) { murTerrasse(t, 52 + i * 10, 120 - i * 26, tG(i), 6, { graine: 40 + i, crete: cr }); murTerrasse(t, 300 + i * 26, 368 - i * 10, tD(i), 6, { graine: 44 + i, crete: cr }); }
    [[30, tG(1), 7, 1], [72, tG(1), 6, -1], [18, tG(0), 8, 1], [58, tG(0), 7, 1], [100, tG(0), 6, -1], [348, tD(1), 7, 1], [392, tD(1), 6, -1], [322, tD(0), 6, 1], [366, tD(0), 8, -1], [404, tD(0), 6, -1]].filter(([x, f]) => sous(f)(x)).forEach(([x, f, w, s2]) => maisonFeuille(t, x, Math.round(f(x)) - 1, w, { h: Math.round(w * 1.1) + 1, sens: s2 }));
    [[46, tG(1)], [84, tG(0)], [112, tG(0)], [308, tD(0)], [372, tD(1)], [388, tD(0)]].filter(([x, f]) => sous(f)(x)).forEach(([x, f], k) => arbreDansRepere(t, '_pb' + k, { espece: 'chene', saison: 'moissons', cx: x, base: Math.round(f(x)) - 1, H: 18 + (k * 5) % 8, graine: 70 + k, feuilles: [[0xc83a16, 0xe8602a, 0x8c200c], [0xd8721c, 0xf09a34, 0xa84a10], [0xd8a41c, 0xf0c838, 0xa87810]][k % 3] }));
    lacMiroir(t, rive, devant, { graine: 5 });
    // l'îlot, sur son calque : il a sa propre ligne d'eau, plus près que la rive du fond
    const c = calqueRepere(t), yI = 196;
    arbreDansRepere(c, '_ei', { espece: 'chene', saison: 'moissons', cx: 214, base: 172, H: 124, graine: 71, ecartX: 1.2, feuilles: [0xc83a16, 0xe8602a, 0x8c200c] });
    ilotRoux(c, 210, 170, yI, 58, 3);
    rotonde(c, 210, 176, 26, 22, 26);
    // les escaliers de l'îlot jusqu'à l'eau, et les deux ponts de racines vers les rives
    for (let k = 0; k < 4; k++) for (let x = 204 - k * 2; x <= 216 + k * 2; x++) { c.poser(x, 178 + k * 4, 'pierreRousseC', 5); c.poser(x, 179 + k * 4, 'pierreRousseC', 3); c.poser(x, 180 + k * 4, 'pierreRousse', 2); }
    pontRacines(c, 100, 170, 162, 182, 13, { ep: 2.8, graine: 6, lanternes: 3 });
    pontRacines(c, 258, 182, 320, 170, 13, { ep: 2.8, graine: 7, lanternes: 3 });
    poserCalque(t, c, { axe: yI, eau: (x, y) => y < devant(x) });
    for (let k = 0; k < 14; k++) { const x = Math.round(20 + hachage(k, 1, 31) * 380), y = Math.round(200 + hachage(k, 2, 31) * 40); if (Math.abs(x - 210) < 64 || y > devant(x) - 6) continue; lanterneFeuille(t, x, y, 1); t.poser(x - 2, y + 4, 'eauLac', 5); t.poser(x + 2, y + 4, 'eauLac', 5); }
    remplir(t, 'racine', (x, y) => { const dx = (x + 0.5 - 302) / 15, dy = (y + 0.5 - 214) / 3; return dx * dx + dy * dy <= 1 && y >= 213; }, (x) => (x < 302 ? 4 : 3));
    for (let x = 289; x < 316; x++) t.poser(x, 213, 'erableO', 4);
    riveDevant(t, rive, devant, 14);
    preDuBas(t, x => 248 + Math.sin(x * 0.07 + 2) * 1.2, 4);
  } },

  // ---------------------------------------------------------------------------------------------
  // La forêt de Sérambre, vue de loin : la nef. Une futaie d'ambrennes sous un seul dôme d'écailles d'or ; au milieu, deux
  // arbres se penchent l'un vers l'autre et se tressent en ogive : l'entrée d'une nef d'arches vivantes qui s'enfonce
  // sous les arbres, le chemin de dalles pâles, et tout au bout la lueur de l'Arbre-Mère ; la lumière tombe en
  // colonnes entre les troncs.
  serambreNef: { l: 420, h: 264, dessin(t) {
    const sol = x => 246 + Math.sin(x * 0.04) * 2 + Math.pow((x - 210) / 210, 2) * 6;
    // le sous-bois, sombre et chaud, puis la futaie du fond (des troncs pâles, voilés) ; son bord est déchiqueté, plein
    // (planche 91, retour du joueur : ni bord droit, ni trous qui laisseraient voir derrière)
    for (let x = 20; x < 400; x++) { const haut = 150 + Math.abs(x - 210) * 0.08 + Math.sin(x * 0.07) * 4, bordX = Math.min(x - 20, 400 - x);
      for (let y = Math.round(haut); y < sol(x); y++) { if (bordX < 12 + 52 * hachage(x < 210 ? 1 : 2, Math.floor(y / 5), 9)) continue; t.poser(x, y, 'ombreOr', 1 + Math.round((y - haut) / 45) + (hachage(x >> 2, y >> 2, 3) > 0.75 ? 1 : 0)); } }
    rampesVoilees(t, '_fb', 'ambrenne', 'moissons', 0.5, 0x6a4a20);
    for (let k = 0; k < 11; k++) { const x = 34 + k * 35 + (hachage(k, 1, 7) - 0.5) * 14; if (Math.abs(x - 210) < 50) continue; torsade(putS(t, '_fb'), u => [x + Math.sin(u * 3 + k) * 2, 238 - u * 110], { largeur: u => (2.6 + hachage(k, 2, 7) * 1.4) * (1 + Math.max(0, 0.12 - u) * 4), nb: 3, tours: 1.2, g: 70 + k }); }
    couronneOr(putS(t, '_fb'), { ccx: 210, ccy: 146, rxc: 200, ryc: 14, n: 46, r: 12, g: 27, ecaille: 2.4 });
    halo(t, 'lueurOr', 210, 190, 20);
    // le dôme du fond
    rampesVoilees(t, '_f0', 'ambrenne', 'moissons', 0.28);
    couronneOr(putS(t, '_f0'), { ccx: 210, ccy: 86, rxc: 214, ryc: 62, n: 64, r: 18, g: 3, ecaille: 3 });
    solFeuilles(t, sol, 14, 4, 416, 3);
    // la nef : ses arches, de la plus loin à la plus proche, le chemin de dalles, l'Arbre-Mère tout au bout
    rampesVoilees(t, '_fm', 'ambrenne', 'moissons', 0.5, 0xfff0c0);
    torsade(putS(t, '_fm'), u => [210, 206 - u * 30], { largeur: () => 2.6, nb: 3, tours: 1, g: 9 });
    remplir(t, 'dalleOr', (x, y) => y >= 206 && y < 262 && Math.abs(x + 0.5 - 210) < 4 + (y - 206) * 0.78, (x, y) => { const d = y - 200, rang = Math.floor(Math.log(d) * 9); return Math.floor(Math.log(d + 1) * 9) !== rang || (((Math.floor((x - 210) / (2 + d * 0.16)) + rang) % 3 === 0) && hachage(x, rang, 5) > 0.4) ? 2 : 3 + (hachage(rang, x >> 2, 6) > 0.6 ? 1 : 0); });
    const nef = [[194, 226, 208, 150, 0.45, 1.5, 6, 4], [184, 236, 216, 132, 0.3, 2.1, 8, 5], [172, 248, 228, 112, 0.15, 3, 10, 6.5], [156, 264, 248, 84, 0, 4.8, 12, 8.5]];
    nef.forEach(([xa, xb, yb, yA, voile, ep, n, r], i) => { const s = '_fn' + i; rampesVoilees(t, s, 'ambrenne', 'moissons', voile); archeVivante(t, xa, xb, yb, yA, s, { ep, graine: 10 + i * 3, n, r }); });
    // les grands troncs torsadés de la futaie, droits jusque dans la couronne, leurs racines
    rampesVoilees(t, '_ft1', 'ambrenne', 'moissons', 0.16); rampesVoilees(t, '_ft0', 'ambrenne', 'moissons', 0);
    [[120, 240, 5, '_ft1'], [300, 240, 5, '_ft1'], [14, 252, 7.4, '_ft0'], [70, 248, 8.4, '_ft0'], [352, 248, 8.4, '_ft0'], [406, 252, 7.4, '_ft0']].forEach(([x, b, w, s], i) => {
      const put = putS(t, s);
      const pen = (x < 210 ? -1 : 1) * (6 + i * 2);
      torsade(put, u => [x + pen * u * u + Math.sin(u * 2.6 + i) * 3, b - u * (b - 104)], { largeur: u => w * (1 + Math.max(0, 0.2 - u) * 4) * (1 - u * 0.35), nb: 3, tours: 1.5, g: 20 + i, ecart: 0.52 });
      for (const sens of [-1, 1]) for (let r2 = 0; r2 < 2; r2++) traitArbre(put, x, b - w * 1.2, x + sens * w * (2 + r2 * 1.3), b + 1, w * (0.85 - r2 * 0.2), 1.2, 'arbEcorce', 40 + i + sens + r2 * 5);
      couronneOr(put, { ccx: x + pen, ccy: 100, rxc: 34 + w * 2, ryc: 22, n: 12, r: 15, g: 90 + i, ecaille: 3 });
    });
    // le dôme de devant, qui retombe en lobes sur les côtés et cache le haut des troncs
    couronneOr(putS(t, '_ft0'), { ccx: 210, ccy: 70, rxc: 216, ryc: 58, n: 54, r: 18, g: 17, ecaille: 3, filtre: (x, y) => y < 58 + Math.pow((x - 210) / 200, 2) * 90 });
    colonnesLumiere(t, [[30, 7, 40, 252], [104, 5, 60, 246], [262, 6, 40, 252], [326, 8, 30, 252]], { graine: 2, pente: 0.36 });
    for (let k = 0; k < 60; k++) { const y = 212 + hachage(k, 2, 8) * 48, x = 210 + (hachage(k, 1, 8) - 0.5) * (8 + (y - 206) * 1.6); t.poser(Math.round(x), Math.round(y), 'arbFeuB_ft0', 3 + (k % 3)); }
    grainsOr(t, 46, 20, 110, 400, 240, 7);
  } },

  // ---------------------------------------------------------------------------------------------
  // La forêt de Sérambre, au cœur : l'Arbre-Mère. Une ambrenne immense, son tronc de cinq brins de cuivre tressés ; ses
  // racines s'ouvrent en une haute porte en ogive où luit la Graine d'argent ; un cloître d'arches vivantes
  // l'entoure ; la lumière tombe en colonnes à travers la couronne.
  arbreMere: { l: 420, h: 264, dessin(t) {
    const base = 248, cx = 210, sol = x => base + Math.sin(x * 0.05) * 2 + Math.pow((x - 210) / 210, 2) * 6;
    rampesVoilees(t, '_fh', 'ambrenne', 'moissons', 0.4);
    couronneOr(putS(t, '_fh'), { ccx: 210, ccy: 116, rxc: 206, ryc: 18, n: 56, r: 14, g: 23, ecaille: 2.6 });
    preDuBas(t, x => 247 + Math.sin(x * 0.06) * 1.2, 5, 'preOr');
    for (let k = 0; k < 140; k++) { const x = Math.round(130 + hachage(k, 1, 51) * 160), y = Math.round(247 + hachage(k, 2, 51) * 12); t.poser(x, y, 'feuillesSol', 3 + (k % 3)); }   // (des feuilles d'or tombées au pied)
    rampesVoilees(t, '_c0', 'ambrenne', 'moissons', 0.34);
    archeVivante(t, 8, 74, 238, 128, '_c0', { ep: 3.2, graine: 3, n: 18, r: 9 });
    archeVivante(t, 346, 412, 238, 132, '_c0', { ep: 3.2, graine: 5, n: 18, r: 9 });
    rampesVoilees(t, '_c1', 'ambrenne', 'moissons', 0.14);
    archeVivante(t, 64, 136, 246, 140, '_c1', { ep: 3.8, graine: 7, n: 18, r: 10 });
    archeVivante(t, 284, 356, 246, 144, '_c1', { ep: 3.8, graine: 9, n: 18, r: 10 });
    rampesVoilees(t, '_am', 'ambrenne', 'moissons', 0);
    const put = putS(t, '_am');
    couronneOr(put, { ccx: cx, ccy: 62, rxc: 178, ryc: 54, n: 48, r: 19, g: 11, ecaille: 3.2 });
    const zb = new Map();
    // les maîtresses branches (elles restent sous la couronne), le tronc de cinq brins, les deux jambes de racines
    for (const [a, L] of [[-2.6, 78], [-2.15, 62], [-1.57, 34], [-1.0, 62], [-0.55, 78]]) torsade(put, u => [cx + Math.cos(a) * L * u, base - 182 + Math.sin(a) * L * u * 0.7 + Math.sin(u * Math.PI) * 5], { largeur: u => 7.5 - u * 4.5, nb: 2, tours: 1, g: 20 + L, ecart: 0.4 });
    torsade(put, u => [cx + Math.sin(u * 2.4) * 3, base - 50 - u * 136], { largeur: u => 22 - u * 6, nb: 5, tours: 1.2, g: 13, zb, ecart: 0.6 });
    for (const sens of [-1, 1]) torsade(put, u => [cx + sens * (11 + Math.sqrt(Math.sin(u * Math.PI / 2)) * 30 + Math.max(0, u - 0.8) * 70), base - 56 + u * 58], { largeur: u => 12 - u * 4, nb: 3, tours: 0.9, g: 40 + sens, zb, ecart: 0.5 });
    for (const [x1, k] of [[90, 1], [130, 2], [290, 3], [330, 4]]) traitArbre(put, cx + (x1 < cx ? -52 : 52), base - 6, x1, base + 1, 6.5, 1.5, 'arbEcorce', 60 + k);
    // la porte de lumière entre les racines, la Graine d'argent qui luit dans un creux de racine
    remplir(t, 'lumiere', (x, y) => { const dx = Math.abs(x + 0.5 - cx), h = base + 1 - y, m = t.mat(x, y); if (h < 0 || h > 58 || dx > 80) return false; if (m && !m.endsWith('_fh') && !m.startsWith('feuillesSol')) return false; const u = (56 - h) / 58, bord = 11 + Math.sqrt(Math.max(0, Math.sin(Math.max(0, u) * Math.PI / 2))) * 30 + Math.max(0, u - 0.8) * 70 - (12 - 4 * u) * 0.5; return u >= 0 && dx < bord; }, (x, y) => { const d = (Math.abs(x + 0.5 - cx) / 64) ** 2 + ((base - y) / 60) ** 2; return d < 0.3 ? 5 : d < 0.7 ? 4 : 3; });
    traitArbre(put, cx - 9, base - 3, cx + 9, base - 3, 4, 4, 'arbEcorce', 77);   // (le creux de racine où elle repose)
    halo(t, 'lueurOr', cx, base - 11, 11);
    t.forme('argent', ellipsoide(cx, base - 10, 3, 3.8), { decalage: 0.9 });
    couronneOr(put, { ccx: cx, ccy: 74, rxc: 190, ryc: 44, n: 34, r: 18, g: 17, ecaille: 3.2, filtre: (x, y) => y > 40 && (Math.abs(x - cx) > 26 || y < 92) });
    couronneOr(put, { ccx: cx, ccy: 74, rxc: 44, ryc: 14, n: 9, r: 15, g: 29, ecaille: 3.2 });
    colonnesLumiere(t, [[88, 7, 80, 250], [146, 5, 100, 250], [262, 6, 90, 250], [320, 8, 70, 250]], { graine: 4, pente: 0.3 });
    grainsOr(t, 50, 20, 100, 400, 240, 9);
  } },
});
