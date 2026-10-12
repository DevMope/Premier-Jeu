// Les portraits en buste des voyageurs, vus de près à la fenêtre du comptoir.
// Chaque visage est dessiné pixel par pixel, à partir de son nom (toujours le même visage pour
// la même personne) et de son peuple : un hobbit rond aux cheveux bouclés, une elfe élancée aux
// oreilles pointues, un nain à la grande barbe, une magicienne au chapeau pointu...
// Style : contour sombre, lumière venant d'en haut à gauche, ombres douces.
// Expressions : neutre, content, inquiet, fache ; plus les yeux fermés (clignement) et la
// bouche ouverte (quand il parle).

const BUSTE_L = 40;
const BUSTE_H = 46;
const CONTOUR = 0x24140a;
const EXPRESSIONS = ['neutre', 'content', 'inquiet', 'fache'];

// Les couleurs possibles, par peuple.
const PEAUX = [0xf3d2b0, 0xe8b890, 0xd09a70, 0xa8704a, 0x7a4a2a];
const COULEURS_PEUPLES = {
  humain: { peaux: [0, 1, 2, 3, 4], cheveux: [0x3a2a1a, 0x6b3e1e, 0xb5532a, 0xe8d890, 0x1a1a20, 0x8a8a8a],
    habits: [0x9a3a2a, 0x3a5a8a, 0x4f7a3a, 0x6a4a2a, 0x7a2a5a] },
  hobbit: { peaux: [0, 1, 2], cheveux: [0x6b3e1e, 0x8a5a2a, 0xb5532a, 0x3a2a1a],
    habits: [0x4f7a3a, 0x8a6a2a, 0xa8743c, 0x5a7a4a] },
  nain: { peaux: [1, 2, 3], cheveux: [0xb5532a, 0x7a3a1a, 0x3a2a1a, 0xa8a8a8, 0xd8a040],
    habits: [0x6a6f78, 0x7a3a2a, 0x3a4a5a] },
  elfe: { peaux: [0, 1], cheveux: [0xe8e0b0, 0xd8d8e8, 0x2a2a30, 0xc89a50],
    habits: [0x2f6a4a, 0x4a7a6a, 0x8a9aa8, 0x3a5a3a] },
  magicienne: { peaux: [0, 1, 2, 3], cheveux: [0xb0602a, 0x2a1a30, 0xd8c070, 0xa0a0b0, 0x8a2a5a],
    habits: [0x5a3a8a, 0x2a4a8a, 0x6a2a5a, 0x3a3a6a] },
};

// Un petit générateur de hasard, toujours le même pour un même nom.
function hasardDuNom(nom) {
  let h = 2166136261;
  for (const c of nom) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

function teinte(c, f) {
  const r = Math.min(255, Math.round(((c >> 16) & 255) * f));
  const g = Math.min(255, Math.round(((c >> 8) & 255) * f));
  const b = Math.min(255, Math.round((c & 255) * f));
  return (r << 16) | (g << 8) | b;
}

// Une toile de pixels : on y peint des formes, puis on la transforme en texture.
class Toile {
  constructor(l, h) {
    this.l = l;
    this.h = h;
    this.p = new Array(l * h).fill(null);
  }

  pixel(x, y, c) {
    x = Math.round(x); y = Math.round(y);
    if (x >= 0 && y >= 0 && x < this.l && y < this.h) this.p[y * this.l + x] = c;
  }

  lire(x, y) {
    return x >= 0 && y >= 0 && x < this.l && y < this.h ? this.p[y * this.l + x] : null;
  }

  rect(x, y, l, h, c) {
    for (let j = 0; j < h; j++) for (let i = 0; i < l; i++) this.pixel(x + i, y + j, c);
  }

  // Une ellipse éclairée d'en haut à gauche : lumière, couleur, ombre.
  ellipse(cx, cy, rx, ry, c, { ombre = true, lumiere = false } = {}) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy > 1) continue;
        let couleur = c;
        if (ombre && (dx > 0.45 || dy > 0.7)) couleur = teinte(c, 0.8);
        if (lumiere && dx < -0.3 && dy < -0.35) couleur = teinte(c, 1.12);
        this.pixel(x, y, couleur);
      }
    }
  }

  // Le contour sombre, tout autour de ce qui est peint.
  contour(c = CONTOUR) {
    const bord = [];
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.l; x++) {
        if (this.lire(x, y) !== null) continue;
        if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => this.lire(x + a, y + b) !== null)) bord.push([x, y]);
      }
    }
    for (const [x, y] of bord) this.pixel(x, y, c);
  }

  texture(scene, cle) {
    if (scene.textures.exists(cle)) scene.textures.remove(cle);
    const g = scene.make.graphics({ add: false });
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.l; x++) {
        const c = this.p[y * this.l + x];
        if (c === null) continue;
        g.fillStyle(c, 1).fillRect(x, y, 1, 1);
      }
    }
    g.generateTexture(cle, this.l, this.h);
    g.destroy();
  }
}

// Le « gène » d'un personnage : ses couleurs et ses traits, tirés de son nom.
function geneDe(p) {
  const r = hasardDuNom(p.nom || 'Inconnu');
  const choix = liste => liste[Math.floor(r() * liste.length)];
  const peuple = COULEURS_PEUPLES[p.race] || COULEURS_PEUPLES.humain;
  const peau = PEAUX[choix(peuple.peaux)];
  return {
    race: COULEURS_PEUPLES[p.race] ? p.race : 'humain',
    feminin: !!p.feminin,
    peau,
    cheveux: choix(peuple.cheveux),
    habit: choix(peuple.habits),
    coiffure: p.feminin ? choix(['long', 'long', 'queue', 'chignon']) : choix(['court', 'court', 'long', 'chauve', 'herisse']),
    barbe: p.race === 'nain' || (!p.feminin && p.race !== 'elfe' && r() < 0.4),
    yeux: choix([0x3a2a1a, 0x2a5a8a, 0x3a6a3a, 0x5a3a1a]),
    armure: r() < 0.35,
    taches: r() < 0.25,
  };
}

// Dessine le buste complet : épaules et habit, cou, tête, cheveux, visage, accessoires.
function dessinerBuste(gene, expression = 'neutre', { cligne = false, parle = false } = {}) {
  const t = new Toile(BUSTE_L, BUSTE_H);
  const g = gene;
  const cx = 20;
  const race = g.race;
  // Les proportions selon le peuple.
  const forme = {
    humain: { tete: [8, 9.5], cy: 17, epaules: 15 },
    hobbit: { tete: [8.5, 9], cy: 19, epaules: 14 },
    nain: { tete: [9, 8.5], cy: 18, epaules: 18 },
    elfe: { tete: [7, 10], cy: 16, epaules: 13 },
    magicienne: { tete: [7.5, 9.5], cy: 19, epaules: 14 },
  }[race];
  const [rx, ry] = forme.tete;
  const cy = forme.cy;
  const habit = g.habit;

  // Les cheveux longs, derrière la tête et les épaules.
  if (['long', 'queue'].includes(g.coiffure) || race === 'elfe') {
    t.ellipse(cx, cy + 2, rx + 2, ry + 3, g.cheveux, { ombre: true });
    if (g.coiffure === 'long' || race === 'elfe') t.rect(cx - rx - 2, cy, 4, 16, teinte(g.cheveux, 0.85)), t.rect(cx + rx - 2, cy, 4, 16, teinte(g.cheveux, 0.75));
  }

  // Les épaules et l'habit.
  const largeur = forme.epaules;
  for (let y = 31; y < BUSTE_H; y++) {
    const demi = Math.min(largeur, largeur - 5 + (y - 31) * 1.6);
    for (let x = Math.round(cx - demi); x <= Math.round(cx + demi); x++) {
      let c = habit;
      if (x > cx + demi * 0.45) c = teinte(habit, 0.78);
      if (x < cx - demi * 0.6 && y < 36) c = teinte(habit, 1.12);
      t.pixel(x, y, c);
    }
  }
  // Le col (en V) et le détail de l'habit selon le peuple.
  for (let k = 0; k < 4; k++) t.rect(cx - 2 + Math.floor(k / 2), 31 + k, 4 - 2 * Math.floor(k / 2), 1, g.peau);
  if (race === 'hobbit') {
    // Un gilet sur une chemise blanche, et des bretelles.
    t.rect(cx - 3, 31, 6, 15, 0xf3e6c8);
    t.rect(cx - 3, 33, 1, 13, teinte(habit, 0.6)); t.rect(cx + 2, 33, 1, 13, teinte(habit, 0.6));
    t.pixel(cx, 38, 0xe8c040); t.pixel(cx, 42, 0xe8c040);
  } else if (race === 'elfe') {
    // Une broche en forme de feuille.
    t.rect(cx - 1, 34, 3, 2, 0xe8c040); t.pixel(cx, 33, 0x4fa83a);
  } else if (race === 'magicienne') {
    // Un col haut et des étoiles brodées.
    t.rect(cx - 5, 30, 10, 2, teinte(habit, 1.25));
    for (const [x, y] of [[cx - 9, 38], [cx + 7, 41], [cx - 4, 43], [cx + 3, 36]]) t.pixel(x, y, 0xf0e070);
  } else if (g.armure || race === 'nain') {
    // Des épaulières de métal pour les guerriers.
    t.ellipse(cx - largeur + 3, 34, 4, 3, 0xa0a8b4, { lumiere: true });
    t.ellipse(cx + largeur - 3, 34, 4, 3, 0xa0a8b4, { lumiere: true });
  }
  if (race === 'humain' && !g.armure) {
    // Une sangle de sac en travers.
    for (let k = 0; k < 13; k++) t.pixel(cx - 9 + k, 33 + k, 0x5a3a1a);
  }

  // Le cou, puis la tête.
  t.rect(cx - 3, cy + ry - 3, 6, 6, teinte(g.peau, 0.85));
  // Les oreilles.
  if (race === 'elfe') {
    for (let k = 0; k < 5; k++) { t.pixel(cx - rx - 1 - k * 0.6, cy - k, g.peau); t.pixel(cx + rx + k * 0.6, cy - k, teinte(g.peau, 0.85)); }
  } else {
    const o = race === 'hobbit' ? 2.2 : 1.6;
    t.ellipse(cx - rx, cy + 1, o, 2.4, g.peau, { ombre: false });
    t.ellipse(cx + rx, cy + 1, o, 2.4, teinte(g.peau, 0.85), { ombre: false });
  }
  t.ellipse(cx, cy, rx, ry, g.peau, { lumiere: true });

  // Le visage.
  const ey = cy;            // la ligne des yeux
  const gx = cx - 4, dx = cx + 3; // l'œil gauche, l'œil droit (2 pixels de large)
  const sombre = teinte(g.peau, 0.62);
  if (cligne) {
    t.rect(gx, ey + 1, 2, 1, sombre); t.rect(dx, ey + 1, 2, 1, sombre);
  } else {
    t.rect(gx, ey, 2, 2, 0xf8f4ec); t.rect(dx, ey, 2, 2, 0xf8f4ec);
    t.rect(gx + 1, ey, 1, 2, g.yeux); t.rect(dx, ey, 1, 2, g.yeux);
    if (g.feminin) { t.pixel(gx - 1, ey - 1, CONTOUR); t.pixel(dx + 2, ey - 1, CONTOUR); }
  }
  // Les sourcils selon l'expression.
  const sourcil = teinte(g.cheveux, 0.7);
  const sourcils = {
    neutre: [[0, -2], [1, -2], [2, -2]],
    content: [[0, -3], [1, -3], [2, -3]],
    inquiet: [[0, -2], [1, -2], [2, -3]],
    fache: [[0, -3], [1, -2], [2, -2]],
  }[expression];
  for (const [i, j] of sourcils) { t.pixel(gx - 1 + i, ey + j, sourcil); t.pixel(dx + 2 - i, ey + j, sourcil); }
  // Le nez, et les taches de rousseur.
  t.pixel(cx, ey + 3, sombre); t.pixel(cx - 1, ey + 4, teinte(g.peau, 0.8));
  if (g.taches) for (const [i, j] of [[-5, 3], [-4, 4], [4, 3], [5, 4]]) t.pixel(cx + i, ey + j, teinte(g.peau, 0.88));
  // Les joues roses quand il est content (ou fâché, de colère).
  if (expression === 'content' || expression === 'fache') {
    const rose = expression === 'fache' ? 0xd05040 : 0xe89080;
    t.pixel(gx - 1, ey + 3, rose); t.pixel(dx + 2, ey + 3, rose);
  }
  // La bouche.
  const my = ey + 6;
  const levres = g.feminin ? 0xb04050 : 0x7a2a2a;
  if (parle) {
    t.rect(cx - 2, my - 1, 4, 3, 0x3a1010); t.rect(cx - 1, my + 1, 2, 1, 0xc04050);
  } else if (expression === 'content') {
    t.rect(cx - 2, my, 4, 1, levres); t.pixel(cx - 3, my - 1, levres); t.pixel(cx + 2, my - 1, levres);
  } else if (expression === 'fache') {
    t.rect(cx - 2, my, 4, 1, levres); t.pixel(cx - 3, my + 1, levres); t.pixel(cx + 2, my + 1, levres);
  } else if (expression === 'inquiet') {
    t.pixel(cx - 2, my, levres); t.pixel(cx - 1, my - 1, levres); t.pixel(cx, my, levres); t.pixel(cx + 1, my - 1, levres);
  } else {
    t.rect(cx - 2, my, 4, 1, levres);
  }

  // La barbe (par-dessus le bas du visage, en laissant voir la bouche).
  if (g.barbe) {
    const longue = race === 'nain';
    for (let y = ey + 4; y < (longue ? cy + ry + 13 : cy + ry + 1); y++) {
      const demi = longue ? Math.max(2, rx + 1 - Math.max(0, y - (cy + ry)) * 0.7) : Math.max(2, rx - (y - ey - 4) * 0.7);
      for (let x = Math.round(cx - demi); x <= Math.round(cx + demi); x++) {
        if (y >= my - 1 && y <= my + 1 && x >= cx - 2 && x <= cx + 1) continue; // la bouche
        if (y < my - 1 && Math.abs(x - cx) < 3) continue; // la moustache s'arrête sous le nez
        t.pixel(x, y, x > cx + demi * 0.4 ? teinte(g.cheveux, 0.8) : g.cheveux);
      }
    }
    t.rect(cx - 4, my - 1, 3, 1, g.cheveux); t.rect(cx + 1, my - 1, 3, 1, g.cheveux); // la moustache
    if (longue) { t.pixel(cx - 2, cy + ry + 8, 0xe8c040); t.pixel(cx + 2, cy + ry + 8, 0xe8c040); } // perles de tresse
  }

  // Les cheveux du dessus, selon la coiffure et le peuple.
  const ch = g.cheveux;
  if (race === 'hobbit') {
    // Des boucles en grappe
    for (const [i, j] of [[-7, -4], [-4, -7], [0, -8], [4, -7], [7, -4], [-8, 0], [8, 0]]) t.ellipse(cx + i, cy + j, 2.6, 2.6, ch, { lumiere: true });
  } else if (g.coiffure !== 'chauve' || race !== 'humain') {
    for (let y = Math.floor(cy - ry - 1); y < cy - ry * 0.25; y++) {
      for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
        const ddx = (x + 0.5 - cx) / (rx + 1), ddy = (y + 0.5 - cy) / (ry + 1);
        if (ddx * ddx + ddy * ddy > 1) continue;
        // La raie et la frange
        if (y > cy - ry * 0.55 && Math.abs(x - cx + 2) < 3 && g.coiffure !== 'herisse') continue;
        t.pixel(x, y, x > cx + rx * 0.4 ? teinte(ch, 0.78) : (x < cx - rx * 0.3 && y < cy - ry * 0.7 ? teinte(ch, 1.15) : ch));
      }
    }
    if (g.coiffure === 'herisse') for (let k = -6; k <= 6; k += 3) t.pixel(cx + k, cy - ry - 2, ch);
    if (g.coiffure === 'chignon') t.ellipse(cx, cy - ry - 2, 3, 2.5, ch, { lumiere: true });
    if (g.coiffure === 'queue') t.rect(cx + rx, cy - 2, 2, 10, teinte(ch, 0.8));
    // Les mèches sur les côtés du visage
    t.rect(cx - rx - 1, cy - 3, 2, 5, ch); t.rect(cx + rx, cy - 3, 2, 5, teinte(ch, 0.78));
  }
  // Les accessoires de tête.
  if (race === 'elfe') {
    // Un diadème d'or
    t.rect(cx - rx + 1, cy - ry * 0.55, rx * 2 - 1, 1, 0xe8c040); t.pixel(cx, cy - ry * 0.55 - 1, 0x8ad0f0);
  } else if (race === 'magicienne') {
    // Le chapeau pointu, avec son large bord
    const chapeau = habit;
    for (let y = 0; y < 11; y++) {
      const demi = 1 + y * 0.75;
      for (let x = Math.round(cx + 2 - demi - (10 - y) * 0.25); x <= Math.round(cx + 2 + demi - (10 - y) * 0.25); x++) t.pixel(x, y, x > cx + 2 ? teinte(chapeau, 0.78) : chapeau);
    }
    t.rect(cx - rx - 4, 10, rx * 2 + 9, 2, teinte(chapeau, 0.85));
    t.rect(cx - 5, 8, 11, 1, 0xe8c040);
  } else if (race === 'nain' && g.armure) {
    // Un casque à nasal
    t.ellipse(cx, cy - ry * 0.55, rx + 1, ry * 0.55, 0xa0a8b4, { lumiere: true });
    t.rect(cx, cy - ry * 0.4, 1, 5, 0x8a909a);
  }

  t.contour();
  return t;
}

// La texture d'un buste (créée à la demande, puis gardée en mémoire).
function textureBuste(scene, personne, expression = 'neutre', etat = {}) {
  const cle = `buste_${personne.race}_${personne.nom}_${expression}${etat.cligne ? '_c' : ''}${etat.parle ? '_p' : ''}`;
  if (!scene.textures.exists(cle)) dessinerBuste(geneDe(personne), expression, etat).texture(scene, cle);
  return cle;
}
