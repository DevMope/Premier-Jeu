// (planche 85 v2, retouche) Les deux boutons de la place, « La place · M » et « Ma liste · L », ne recouvrent plus jamais le
// nom d'un étal. Lieu ouvert, la place se cadre sur lui (cadrerPlace) ; contre le bord droit de la place (la garde-robe
// de Marcelline, la cabane de Barnabé), son enseigne tombait juste sous les boutons, en haut à droite. Désormais, à chaque
// cadrage sur un lieu, on regarde où tombent tous les noms écrits de la place (bandes des étals, lettrages, enseignes
// pendues, textes) à l'arrivée du cadrage, et les boutons prennent la première place libre : en haut à droite comme
// avant, sinon en haut à gauche, sinon un peu plus bas. Le lieu refermé, ils reviennent en haut à droite.

const BOUTONS_PLACE = {
  largeur: 140, ecart: 38,
  // les places possibles (centre du premier bouton), dans l'ordre de préférence
  places: [[882, 108], [78, 108], [882, 200], [78, 200]],
};

Object.assign(MarcheScene.prototype, {
  // Les deux boutons, (re)créés au point (x, y) : refaits plutôt que déplacés, pour que la pierre et son scintillement suivent
  creerBoutonsPlace(x = BOUTONS_PLACE.places[0][0], y = BOUTONS_PLACE.places[0][1]) {
    // (les nouveaux reprennent le rang des anciens dans la liste d'affichage : ce qui passait devant eux y passe encore)
    const rangs = (this.boutonsPlace || []).flatMap(b => [b.fond, b.label]).map(o => this.children.getIndex(o));
    for (const b of this.boutonsPlace || []) { if (b.fond.active) b.fond.destroy(); if (b.label.active) b.label.destroy(); }
    const B = BOUTONS_PLACE;
    const b1 = creerBouton(this, x, y, B.largeur, 'La place · M', () => this.basculerCartePlace()); b1.label.setFontSize(13);
    const b2 = creerBouton(this, x, y + B.ecart, B.largeur, 'Ma liste · L', () => this.listeCourses()); b2.label.setFontSize(13);
    if (rangs.length === 4 && rangs.every(i => i >= 0)) [b1.fond, b1.label, b2.fond, b2.label].forEach((o, k) => this.children.moveTo(o, Math.min(rangs[k], this.children.length - 1)));
    this.boutonsPlace = [b1, b2]; this.placeBoutons = [x, y];
  },

  // Le rectangle à l'écran qu'occupent les deux boutons posés en (x, y), avec une petite marge
  zoneBoutonsPlace(x = this.placeBoutons ? this.placeBoutons[0] : BOUTONS_PLACE.places[0][0], y = this.placeBoutons ? this.placeBoutons[1] : BOUTONS_PLACE.places[0][1]) {
    const B = BOUTONS_PLACE;
    return [x - B.largeur / 2 - 4, y - 24, x + B.largeur / 2 + 4, y + B.ecart + 24];
  },

  // Tout ce qui est écrit sur la place, à l'écran, pour un cadrage (px, py, z) de la place : [x0, y0, x1, y1] par écrit
  ecritsPlace(px, py, z) {
    const r = [];
    const boite = (o, ox, oy, f) => {
      const w = o.displayWidth, h = o.displayHeight;
      const x0 = o.x - w * o.originX, y0 = o.y - h * o.originY;
      r.push([ox + x0 * f - 2, oy + y0 * f - 2, ox + (x0 + w) * f + 2, oy + (y0 + h) * f + 2]);
    };
    for (const g of this.place.list) {
      if (!g.visible) continue;
      if (g.type === 'Container') {
        const f = g.scaleX * z, ox = px + g.x * z, oy = py + g.y * z;
        if (g.bandeNom) { const [a, b, c, d] = g.bandeNom; r.push([ox + a * f, oy + b * f, ox + c * f, oy + d * f]); }
        for (const o of g.list) if (o.visible && (o.lettre || o.type === 'Text')) boite(o, ox, oy, f);
      } else if (g.lettre || g.type === 'Text') boite(g, px, py, z);
    }
    return r;
  },

  // Lieu ouvert (cadrage px, py, z) : les boutons vont à la première place où ils ne cachent aucun écrit ; lieu refermé
  // (sans cadrage) : en haut à droite
  placerBoutonsPlace(px = null, py = null, z = null) {
    if (!this.boutonsPlace) return;
    let choix = BOUTONS_PLACE.places[0];
    if (px !== null && this.place) {
      const ecrits = this.ecritsPlace(px, py, z);
      const recouvre = ([x, y]) => {
        const [a, b, c, d] = this.zoneBoutonsPlace(x, y);
        let s = 0;
        for (const [e, f, g, h] of ecrits) s += Math.max(0, Math.min(c, g) - Math.max(a, e)) * Math.max(0, Math.min(d, h) - Math.max(b, f));
        return s;
      };
      // la première place libre ; si aucune ne l'est, celle qui cache le moins
      choix = BOUTONS_PLACE.places.find(p => recouvre(p) === 0) || BOUTONS_PLACE.places.reduce((m, p) => (recouvre(p) < recouvre(m) ? p : m));
    }
    if (this.placeBoutons && this.placeBoutons[0] === choix[0] && this.placeBoutons[1] === choix[1]) return;
    this.creerBoutonsPlace(choix[0], choix[1]);
  },
});
