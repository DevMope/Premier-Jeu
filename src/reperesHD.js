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
  vieuxChene: { l: 220, h: 170, dessin(t) {
    // la cabane
    remplir(t, 'rondin', (x, y) => x >= 130 && x < 210 && y >= 120 && y < 170, (x, y) => ((y - 120) % 7 === 0 ? 1 : (y - 120) % 7 === 1 ? 4 : 3));
    for (let y = 120; y < 170; y += 7) { t.forme('rondin', ellipsoide(130, y + 3.5, 3, 3.5), { decalage: 0.5 }); t.forme('rondin', ellipsoide(209, y + 3.5, 3, 3.5), { decalage: 0.2 }); }
    remplir(t, 'chaume', (x, y) => y >= 94 && y < 122 && Math.abs(x + 0.5 - 170) < (y - 90) * 1.7, (x, y) => (x % 4 === 0 ? 2 : 3) + (x < 160 ? 1 : 0));
    t.forme('lumiere', boite(176, 134, 190, 148, 1), { decalage: 0.8 });
    // la souche et sa hache plantée
    t.forme('rondin', boite(112, 154, 128, 170, 3), { decalage: 0.1 }); for (let a = 0; a < 6.28; a += 0.4) t.poser(Math.round(120 + Math.cos(a) * 4), Math.round(156 + Math.sin(a) * 1.5), 'chene', 4);
    ligne(t, 'chene', 4, 120, 154, 130, 140, 2); t.forme('fer', ellipsoide(131, 139, 4, 3), { decalage: 0.4 });
    // le chêne : un tronc énorme, noueux, creux, et sa couronne
    t.forme('rondin', (x, y) => { const w = 18 + Math.max(0, y - 140) * 0.9 + Math.sin(y * 0.3) * 2; return y >= 60 && y < 170 && Math.abs(x + 0.5 - 60) < w ? [(x - 60) / (w + 2), 0, 0.8] : null; }, { motif: (x, y) => ((x * 3 + Math.floor(y / 3)) % 6 === 0 ? -0.6 : 0) });
    t.forme('rochesombre', ellipsoide(58, 128, 7, 12), { decalage: -0.6 });   // le creux
    for (const [cx, cy, r] of [[60, 40, 34], [24, 58, 24], [96, 56, 26], [40, 24, 20], [82, 22, 22]]) t.forme('vert', ellipsoide(cx, cy, r, r * 0.8), { motif: (x, y) => ((x * 5 + y * 7) % 11 === 0 ? 0.7 : (x * 3 + y) % 7 === 0 ? -0.6 : 0) });
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
  const cle = 'repereHD_' + quoi;
  if (scene.textures.exists(cle)) return cle;
  const r = REPERES_HD[quoi];
  if (!r) return null;
  const t = toileRepere(r.l, r.h);
  r.dessin(t);
  t.contour();
  t.texture(scene, cle);
  return cle;
}
