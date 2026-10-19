// Les outils partagés des portraits (le premier buste en 40×46 a laissé la place aux bustes HD de
// portraitsHD.js) : la couleur du contour, le hasard tiré d'un nom, les teintes.

const CONTOUR = 0x24140a;

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

// (v1.27) « teinte » vivait ici aussi, mais celle d'exterieurHD.js (chargée après) la remplaçait déjà partout :
// on garde celle-là seule, pour ne rien changer aux dessins.

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
