// (v0.90) Le Carrefour : le grand décor peint en pixel art (480 × 270, affiché ×2) d'après la planche 17 :
// le chemin qui se sépare entre le jour (le soleil, la Citadelle) et la nuit (la lune, la Grande Muraille),
// le poteau, la borne de pierre, les deux vitraux et la plaque du titre.
const CARREFOUR_HD = (() => {
  const W = 480, H = 270;
  const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  const hex = c => '#' + c.toString(16).padStart(6, '0');
  const mix = (a, b, t) => { const r = (a >> 16) + (((b >> 16) - (a >> 16)) * t), g = ((a >> 8) & 255) + ((((b >> 8) & 255) - ((a >> 8) & 255)) * t), bb = (a & 255) + (((b & 255) - (a & 255)) * t); return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(bb); };
  // un dégradé en bandes tramées (façon pixel art) : stops [[t, couleur], ...]
  function rampe(stops, t, x, y) {
    for (let i = 0; i < stops.length - 1; i++) {
      const [t0, c0] = stops[i], [t1, c1] = stops[i + 1];
      if (t <= t1 || i === stops.length - 2) {
        const u = Math.max(0, Math.min(1, (t - t0) / (t1 - t0)));
        return u * 16 > BAYER[y & 3][x & 3] + 0.5 ? c1 : c0;
      }
    }
    return stops[stops.length - 1][1];
  }
  function toile(scene, cle, w, h, peindre) {
    if (scene.textures.exists(cle)) return cle;   // (peint une fois pour toute la partie)
    const t = scene.textures.createCanvas(cle, w, h), g = t.getContext();
    const px = (x, y, c) => { g.fillStyle = hex(c); g.fillRect(x | 0, y | 0, 1, 1); };
    const rect = (x, y, l, hh, c) => { g.fillStyle = hex(c); g.fillRect(x | 0, y | 0, l | 0, hh | 0); };
    peindre({ g, px, rect, w, h });
    t.refresh(); return cle;
  }
  // bruit simple
  const bruit = (x, y, s = 1) => { const n = Math.sin(x * 12.9898 * s + y * 78.233) * 43758.5453; return n - Math.floor(n); };
  const lisse = (x, s) => { const i = Math.floor(x), f = x - i, a = bruit(i, s), b = bruit(i + 1, s); return a + (b - a) * (f * f * (3 - 2 * f)); };

  // ---- Le grand décor : le chemin qui se sépare entre le jour et la nuit ----
  // frontière jour / nuit : une diagonale douce, qui passe par le poteau
  const frontiere = y => 262 - y * 0.18;
  function decor(scene, { eteint = null } = {}) {
    return toile(scene, 'cf_decor' + (eteint || ''), W, H, ({ px, rect }) => {
      const HZ = 150;
      const ciel = {
        jour: [[0, 0xfbe6a4], [0.35, 0xf6cf7c], [0.7, 0xf0a860], [1, 0xe8844a]],
        nuit: [[0, 0x0b0a24], [0.4, 0x1c1648], [0.75, 0x33246a], [1, 0x4e3384]],
      };
      const teinteCiel = (stops, t) => { for (let i = 0; i < stops.length - 1; i++) { const [t0, c0] = stops[i], [t1, c1] = stops[i + 1]; if (t <= t1) return mix(c0, c1, (t - t0) / (t1 - t0)); } return stops[stops.length - 1][1]; };
      const crep = [[0, 0x6a3a7a], [0.5, 0xb05a7a], [1, 0xe07a6a]];
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        if (y >= HZ + 30) continue;
        const f = frontiere(y), d = (x - f) / 46, t = y / (HZ + 30);
        const cj = teinteCiel(ciel.jour, t), cn = teinteCiel(ciel.nuit, t), cc = teinteCiel(crep, t);
        const u = Math.max(-1, Math.min(1, d));
        const c = u < 0 ? mix(cc, cj, -u) : mix(cc, cn, u);
        // une palette réduite : on arrondit la couleur, puis on trame entre deux pas voisins
        const q = v => { const k = 14, b = BAYER[y & 3][x & 3] / 16 - 0.5; return Math.max(0, Math.min(255, Math.round(v / k + b) * k)); };
        px(x, y, (q(c >> 16) << 16) | (q((c >> 8) & 255) << 8) | q(c & 255));
      }
      // le soleil (à gauche) et ses rayons
      const sx = 70, sy = 46;
      for (let y = -40; y <= 40; y++) for (let x = -40; x <= 40; x++) {
        const r = Math.hypot(x, y);
        if (r < 15) px(sx + x, sy + y, r < 11 ? 0xfff8d8 : 0xffe48a);
        else if (r < 40 && (r - 15) / 25 * 16 < BAYER[(sy + y) & 3][(sx + x) & 3] * 0.55) px(sx + x, sy + y, 0xfde9a8);
      }
      // la lune (à droite), un croissant, et les étoiles
      const lx = 412, ly = 40;
      for (let y = -14; y <= 14; y++) for (let x = -14; x <= 14; x++) {
        const a = Math.hypot(x, y) < 13, b = Math.hypot(x - 6, y - 3) < 11;
        if (a && !b) px(lx + x, ly + y, Math.hypot(x, y) > 11.5 ? 0xb8a8ee : 0xeee6ff);
      }
      for (let k = 0; k < 70; k++) {
        const x = Math.floor(bruit(k, 3) * W), y = Math.floor(bruit(k, 7) * 130);
        if (x > frontiere(y) + 14 && Math.hypot(x - lx, y - ly) > 20) { px(x, y, bruit(k, 9) > 0.8 ? 0xffffff : 0xb8b0e8); if (bruit(k, 11) > 0.9) { px(x + 1, y, 0x8a80c8); px(x - 1, y, 0x8a80c8); px(x, y + 1, 0x8a80c8); px(x, y - 1, 0x8a80c8); } }
      }
      // nuages dorés, côté jour
      for (const [cx, cy, l] of [[150, 70, 46], [30, 104, 34], [120, 118, 30]]) for (let x = -l; x <= l; x++) {
        const hh = Math.round((1 - (x / l) ** 2) * 7 + lisse(x / 5, cx) * 3);
        for (let y = 0; y < hh; y++) if (cx + x < frontiere(cy) - 6) px(cx + x, cy - y, y > hh - 3 ? 0xfff2c8 : 0xf8d898);
      }
      // collines lointaines
      for (let x = 0; x < W; x++) {
        const nuit = x > frontiere(HZ) ;
        const h1 = HZ - 14 - lisse(x / 38, 1) * 22, h2 = HZ - 2 - lisse(x / 22, 2) * 14;
        for (let y = Math.floor(h1); y < HZ + 30; y++) px(x, y, nuit ? (y < h1 + 2 ? 0x5a4290 : 0x3a2a66) : (y < h1 + 2 ? 0xc8b07a : 0xa8986a));
        for (let y = Math.floor(h2); y < HZ + 30; y++) px(x, y, nuit ? (y < h2 + 2 ? 0x3e2e6a : 0x2a1e4e) : (y < h2 + 2 ? 0x9ab65a : 0x7a9a48));
      }
      // la Citadelle (jour) : tours blanches, toits bleus, bannières
      const cit = (x0, base, hh, l, toit = true) => {
        rect(x0, base - hh, l, hh, 0xf2ead8); rect(x0 + l - 2, base - hh, 2, hh, 0xc8bca0); rect(x0, base - hh, 1, hh, 0xfffaf0);
        for (let y = base - hh + 4; y < base - 3; y += 6) rect(x0 + Math.floor(l / 2) - 1, y, 2, 3, 0x3a3048);
        if (toit) for (let k = 0; k < l / 2 + 3; k++) rect(x0 + l / 2 - k, base - hh - (l / 2 + 3) + k, k * 2, 1, k < 2 ? 0x6a8ad8 : 0x2a4a9a);
      };
      const cb = 136, o = 92;
      rect(52 + o, cb - 8, 92, 8, 0xe6dcc4); for (let x = 52 + o; x < 144 + o; x += 4) rect(x, cb - 10, 2, 2, 0xe6dcc4);
      cit(58 + o, cb, 26, 10); cit(78 + o, cb, 38, 12); cit(98 + o, cb, 50, 14); cit(118 + o, cb, 34, 12); cit(134 + o, cb, 24, 9);
      for (const [bx, by, c] of [[104 + o, cb - 70, 0x2a4a9a], [83 + o, cb - 52, 0xe0a820], [123 + o, cb - 47, 0xe0a820]]) {
        rect(bx, by, 1, 12, 0x3a2a1a);
        for (let k = 0; k < 7; k++) rect(bx + 1, by + k, 7 - Math.floor(k / 2), 1, c);
      }
      // la Grande Muraille (nuit) et ses lanternes
      for (let x = 262; x < W; x++) {
        const top = 128 + Math.sin(x / 30) * 3 + (x - 262) * 0.06;
        rect(x, top, 1, 12, 0x241a40); if ((x & 7) < 4) rect(x, top - 3, 1, 3, 0x241a40);
        if (x % 7 === 0) rect(x, top + 4, 1, 1, 0x3a2e60);
      }
      for (const lxx of [276, 300, 326, 352, 380, 410, 440, 468]) { const t = 128 + Math.sin(lxx / 30) * 3 + (lxx - 262) * 0.06; rect(lxx, t + 3, 2, 3, 0xff6a5a); px(lxx, t + 2, 0xffb0a0); }
      // une tour tordue sur la muraille
      for (const [tx, th] of [[304, 40], [322, 28]]) { rect(tx, 130 - th, 12, th, 0x1e1636); rect(tx + 10, 130 - th, 2, th, 0x161028); for (let k = 0; k < 10; k++) rect(tx + 6 - k / 2 + Math.floor(k / 3), 122 - th + k, 1 + k, 1, 0x2a2048); rect(tx + 5, 130 - th + 8, 2, 3, 0xd06aff); px(tx + 5, 130 - th + 7, 0xf0c0ff); }
      // le sol : prairie au soleil / lande violette
      for (let y = HZ + 10; y < H; y++) for (let x = 0; x < W; x++) {
        const f = frontiere(y) + 10, d = x - f;
        const nuit = d > 6 || (d > -6 && (d + 6) / 12 * 16 > BAYER[y & 3][x & 3]);
        const t = (y - HZ) / (H - HZ);
        const c = nuit ? rampe([[0, 0x2a1e4e], [0.5, 0x221842], [1, 0x160f2c]], t, x, y) : rampe([[0, 0x8aae4e], [0.5, 0x6e9a3e], [1, 0x557e30]], t, x, y);
        px(x, y, c);
        if (bruit(x, y, 5) > 0.985) px(x, y, nuit ? 0x5a46a0 : 0xd8e070);   // fleurs / lucioles
      }
      // les chemins : du bas au carrefour, puis l'un vers la Citadelle, l'autre vers la Muraille
      const chemin = (pts, l0, l1, clair, fonce, bord) => {
        for (let i = 0; i < pts.length - 1; i++) {
          const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
          const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
          for (let k = 0; k <= n; k++) {
            const u = k / n, x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u;
            const prog = (i + u) / (pts.length - 1), l = l0 + (l1 - l0) * prog;
            for (let dx = -l; dx <= l; dx++) {
              const xx = Math.round(x + dx), yy = Math.round(y);
              px(xx, yy, Math.abs(dx) > l - 1.2 ? bord : bruit(xx, yy, 2) > 0.8 ? fonce : clair);
            }
          }
        }
      };
      const fx = 236, fy = 196;   // le carrefour
      chemin([[240, 272], [238, 230], [fx, fy]], 34, 12, 0xd8b878, 0xbf9e60, 0x8a6a3a);
      chemin([[fx - 4, fy], [206, 178], [196, 160], [190, 138]], 10, 2, 0xe8cc8a, 0xd0b070, 0xa07a40);
      chemin([[fx + 4, fy], [266, 180], [300, 160], [314, 138]], 10, 2, 0x6a5a8a, 0x544870, 0x2e2648);
      // la moitié droite du chemin du bas, dans la nuit
            // l'éclairage : un voile qui s'éteint si l'on a choisi (maquette d'après le choix)
      if (eteint) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const nuit = x > frontiere(y) + 10;
        if ((eteint === 'nuit') === nuit && (BAYER[y & 3][x & 3] & 1)) px(x, y, nuit ? 0x0a0812 : 0x3a3428);
      }
    });
  }
  // le poteau indicateur (sans texte : les flèches sont des boutons posés dessus)
  function poteau(scene) {
    return toile(scene, 'cf_poteau', 12, 80, ({ rect }) => {
      rect(3, 0, 6, 80, 0x5a3a1e); rect(3, 0, 2, 80, 0x7a5430); rect(8, 0, 1, 80, 0x3a2410);
      for (let y = 6; y < 80; y += 11) rect(4, y, 4, 1, 0x4a2e16);
      rect(2, 0, 8, 2, 0x3a2410);
    });
  }
  // la borne de pierre (rester libre)
  function borne(scene) {
    return toile(scene, 'cf_borne', 26, 30, ({ px, rect }) => {
      for (let y = 0; y < 30; y++) for (let x = 0; x < 26; x++) {
        const dx = (x - 12.5) / 12.5, top = y < 8 ? Math.hypot(dx, (8 - y) / 8) <= 1 : Math.abs(dx) <= 1;
        if (!top) continue;
        const bord = x === 0 || x === 25 || y === 29 || (y < 8 && Math.hypot(dx, (8 - y) / 8) > 0.88);
        px(x, y, bord ? 0x2a2630 : x < 8 ? 0x9a96a2 : x > 18 ? 0x5a5664 : bruit(x, y, 4) > 0.85 ? 0x6a6674 : 0x7c7886);
      }
      rect(8, 12, 10, 1, 0x4a4654); rect(8, 16, 10, 1, 0x4a4654); rect(8, 20, 10, 1, 0x4a4654);
      for (let x = 2; x < 24; x++) if (bruit(x, 1, 8) > 0.5) px(x, 27 + (x & 1), 0x4a7a30);
    });
  }
  // un vitrail en ogive : cellules de verre, plombs, médaillon au centre
  function vitrail(scene, cle, l, h, verres, contour) {
    return toile(scene, cle, l, h, ({ px }) => {
      const r = l / 2;
      const dedans = (x, y) => { if (y >= r) return x >= 0 && x < l; const dy = r - y; return Math.hypot(x + 0.5 - r, dy) <= r; };
      for (let y = 0; y < h; y++) for (let x = 0; x < l; x++) {
        if (!dedans(x, y)) continue;
        const bord = !dedans(x - 2, y) || !dedans(x + 2, y) || !dedans(x, y - 2) || y > h - 3;
        if (bord) { px(x, y, contour); continue; }
        const cx = Math.floor((x - 3) / 11), cy = Math.floor((y - 3 + (cx & 1) * 5) / 11);
        const plomb = (x - 3) % 11 === 0 || (y - 3 + (cx & 1) * 5) % 11 === 0;
        if (plomb) { px(x, y, 0x120e16); continue; }
        const c = verres[Math.floor(bruit(cx, cy, 6) * verres.length)];
        const lx = (x - 3) % 11, ly = (y - 3 + (cx & 1) * 5) % 11;
        px(x, y, lx === 1 && ly < 4 || ly === 1 && lx < 4 ? mix(c, 0xffffff, 0.35) : lx > 8 || ly > 8 ? mix(c, 0x000000, 0.25) : c);
      }
    });
  }
  // la plaque du titre
  function plaque(scene, x, y, l, h, titre, sous) {
    const c = scene.add.container(x, y);
    const g = scene.add.graphics();
    g.fillStyle(0x1a100a, 0.92).fillRect(-l / 2, -h / 2, l, h);
    g.lineStyle(4, 0x6a4422).strokeRect(-l / 2 + 2, -h / 2 + 2, l - 4, h - 4);
    g.lineStyle(2, 0xc9a227).strokeRect(-l / 2 + 6, -h / 2 + 6, l - 12, h - 12);
    for (const [ax, ay] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.fillStyle(0xc9a227).fillRect(ax * (l / 2 - 9) - 3, ay * (h / 2 - 9) - 3, 6, 6);
    c.add(g);
    c.add(scene.add.text(0, sous ? -10 : 0, titre, style(34, '#f8e2a0', { fontStyle: 'bold', stroke: '#3a2008', strokeThickness: 6 })).setOrigin(0.5));
    if (sous) c.add(scene.add.text(0, 22, sous, style(14, '#e8d0a8', { fontStyle: 'italic' })).setOrigin(0.5));
    return c;
  }
  return { W, H, BAYER, toile, decor, poteau, borne, vitrail, plaque, bruit, lisse, mix, rampe, hex, frontiere };
})();
