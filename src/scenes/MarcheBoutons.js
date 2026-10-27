// (planche 85 v2, retouche) Les deux boutons de la place, « La place · M » et « Ma liste · L », ne recouvrent plus jamais le
// nom d'un étal. Lieu ouvert, la place se cadre sur lui (cadrerPlace) ; contre le bord droit de la place (la garde-robe
// de Marcelline, la cabane de Barnabé), son enseigne tombait juste sous les boutons, en haut à droite. Désormais, à chaque
// cadrage sur un lieu, on regarde où tombent tous les écrits (bandes des étals, lettrages, enseignes pendues, textes de
// la place, et les textes de l'écran : le titre, « Partie sauvegardée », l'annonce du temps) à l'arrivée du cadrage, et
// les boutons prennent la première place libre : l'un sous l'autre en haut à droite comme avant, sinon en haut à gauche,
// sinon côte à côte juste sous le titre, à droite puis à gauche, sinon un peu plus bas. Le lieu refermé, ils reviennent
// en haut à droite.

const BOUTONS_PLACE = {
  // les places possibles, dans l'ordre de préférence : le centre du premier bouton, et le second dessous ('col') ou à côté ('ligne')
  places: [[882, 108, 'col'], [78, 108, 'col'], [762, 80, 'ligne'], [70, 80, 'ligne'], [882, 200, 'col'], [78, 200, 'col']],
  largeur: { col: 140, ligne: 124 }, ecart: { col: [0, 38], ligne: [130, 0] },
};

Object.assign(MarcheScene.prototype, {
  // (v1.64) Les deux boutons oubliés : détruits s'ils existent encore, et plus aucune référence. Phaser réutilise la scène
  // d'un jour à l'autre : sans cela, une relance de la scène pendant qu'un lieu était ouvert laissait la vue d'ensemble du
  // début de create() recréer une paire (les anciens boutons étaient ailleurs qu'en haut à droite), que la place
  // oubliait ensuite sans la détruire : deux paires à l'écran.
  oublierBoutonsPlace() {
    for (const b of this.boutonsPlace || []) for (const o of [b.fond, b.label]) if (o && o.active) o.destroy();
    this.boutonsPlace = null; this.placeBoutons = null;
  },

  // Les deux boutons, (re)créés à la place p : refaits plutôt que déplacés, pour que la pierre et son scintillement suivent
  creerBoutonsPlace(p = BOUTONS_PLACE.places[0]) {
    const [x, y, sens] = p, B = BOUTONS_PLACE, L = B.largeur[sens], [dx, dy] = B.ecart[sens];
    // (les nouveaux reprennent le rang des anciens dans la liste d'affichage : ce qui passait devant eux y passe encore)
    const rangs = (this.boutonsPlace || []).flatMap(b => [b.fond, b.label]).map(o => this.children.getIndex(o));
    this.oublierBoutonsPlace();
    if (!this.boutonsPlaceSurveilles) { this.boutonsPlaceSurveilles = true; this.events.on('shutdown', () => this.oublierBoutonsPlace()); }   // (une seule fois par scène : l'écoute survit aux relances)
    const b1 = creerBouton(this, x, y, L, 'La place · M', () => this.basculerCartePlace()); b1.label.setFontSize(13);
    const b2 = creerBouton(this, x + dx, y + dy, L, 'Ma liste · L', () => this.listeCourses()); b2.label.setFontSize(13);
    if (rangs.length === 4 && rangs.every(i => i >= 0)) [b1.fond, b1.label, b2.fond, b2.label].forEach((o, k) => this.children.moveTo(o, Math.min(rangs[k], this.children.length - 1)));
    this.boutonsPlace = [b1, b2]; this.placeBoutons = p;
  },

  // Le rectangle à l'écran qu'occupent les deux boutons à la place p (par défaut, la leur), avec une petite marge
  zoneBoutonsPlace(p = this.placeBoutons || BOUTONS_PLACE.places[0]) {
    const [x, y, sens] = p, B = BOUTONS_PLACE, L = B.largeur[sens], [dx, dy] = B.ecart[sens];
    return [x - L / 2 - 4, y - 24, x + dx + L / 2 + 4, y + dy + 24];
  },

  // Tout ce qui est écrit, à l'écran, pour un cadrage (px, py, z) de la place : [x0, y0, x1, y1] par écrit
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
    // les textes posés sur l'écran, hors de la place (le titre, la sauvegarde, l'annonce du temps), au-dessus du panneau
    const miens = new Set((this.boutonsPlace || []).map(b => b.label));
    for (const o of this.children.list) if (o.type === 'Text' && o.visible && o.alpha > 0.05 && o.text && !miens.has(o)) {
      const b = o.getBounds(); if (b.y < 300) r.push([b.x - 2, b.y - 2, b.right + 2, b.bottom + 2]);
    }
    return r;
  },

  // Lieu ouvert (cadrage px, py, z) : les boutons vont à la première place où ils ne cachent aucun écrit ; lieu refermé
  // (sans cadrage) : en haut à droite
  placerBoutonsPlace(px = null, py = null, z = null) {
    if (!this.boutonsPlace || !this.boutonsPlace.every(b => b.fond.active && b.label.active)) return;   // (v1.64 : pas de boutons, ou ceux d'une visite passée)
    const P = BOUTONS_PLACE.places;
    let choix = P[0];
    if (px !== null && this.place) {
      const ecrits = this.ecritsPlace(px, py, z);
      const recouvre = p => {
        const [a, b, c, d] = this.zoneBoutonsPlace(p);
        let s = 0;
        for (const [e, f, g, h] of ecrits) s += Math.max(0, Math.min(c, g) - Math.max(a, e)) * Math.max(0, Math.min(d, h) - Math.max(b, f));
        return s;
      };
      // la première place libre ; si aucune ne l'est, celle qui cache le moins
      choix = P.find(p => recouvre(p) === 0) || P.reduce((m, p) => (recouvre(p) < recouvre(m) ? p : m));
    }
    if (this.placeBoutons === choix) return;
    this.creerBoutonsPlace(choix);
  },
});
