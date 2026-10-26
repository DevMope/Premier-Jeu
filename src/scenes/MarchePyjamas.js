// (planche 85 v2, validée) Les pyjamas de Marcelline : un second onglet dans sa garde-robe. Le joueur a déjà la chemise de
// lin et le pyjama rayé ; elle vend les quatre autres, chacun en sa saison (VENTE_PYJAMAS ; hors saison, il est grisé).
// Au survol, on se voit dedans ; acheté, il est dans l'armoire et on le met dès ce soir.

Object.assign(MarcheScene.prototype, {
  // Les deux onglets, sous le titre du panneau (c : le panneau de la garde-robe)
  ongletsMarcelline(c, actif) {
    [['vetements', 'Vêtements', () => this.ouvrirGardeRobe()], ['pyjamas', 'Pyjamas', () => this.ouvrirPyjamas()]].forEach(([id, nom, ouvrir], i) => {
      const sel = id === actif, x = 268 + i * 104;
      const fond = this.add.rectangle(x, 325, 96, 20, sel ? 0x8a3a1a : 0xc8b088).setStrokeStyle(1, 0x3b2410);
      const t = this.add.text(x, 325, nom, style(12, sel ? '#f8e8c8' : '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5);
      if (!sel) { fond.setInteractive({ useHandCursor: true }); fond.on('pointerdown', () => { Son.jouer('page'); ouvrir(); }); }
      c.add([fond, t]);
    });
  },

  ouvrirPyjamas() {
    const G = this.G;
    if (!lieuOuvert(G, 'garderobe')) return this.message(`${NOMS_LIEUX_MARCHE.garderobe} ouvre le jour ${OUVERTURE_LIEUX.garderobe}.`);
    this.montrer('garderobe');
    const c = this.panneau(MARCELLINE.nom, 'Les pyjamas : on les met pour dormir, à ton armoire');
    this.ongletsMarcelline(c, 'pyjamas');
    c.add(this.add.text(30, 340, "« Bien dormir, c'est la moitié du métier. Et en hiver, la laine, crois-moi... »", style(11, '#6b4a2a', { fontStyle: 'italic' })));
    // toi, dans le pyjama de ce soir (ou celui que tu regardes)
    creerIconesHD(this);
    const toi = this.add.image(900, 500, '__DEFAULT').setOrigin(0.5, 1).setFlipX(true);
    c.add(toi);
    const essayer = id => {
      const cle = `marcPyj_${id}_${signatureCorpsJoueur(G).replace(/[^\w]/g, '')}`;
      if (!this.textures.exists(cle)) dessinerJoueurNuit(G, id).texture(this, cle);
      toi.setTexture(cle).setScale(echelleJoueur(7));
    };
    essayer(pyjamaDeCetteNuit(G));
    const ids = Object.keys(PYJAMAS);
    const verrou = () => { if (this.verrouGR > this.time.now) return true; this.verrouGR = this.time.now + 400; return false; };
    ids.forEach((id, i) => {
      const p = PYJAMAS[id], x = 40 + (i % 2) * 400, y = 370 + Math.floor(i / 2) * 34, cp = couleursPyjama(id), a = aPyjama(G, id);
      const v = ventePyjama(G, id), gris = !a && !v.enVente;   // (hors saison : grisé, « revient aux Brumes », « revient au Givre »)
      const ic = this.add.image(x, y, habitHD(this, 'haut', cp.fond, 'plie', [cp.motif, cp.motifNom])).setScale(1.4);
      c.add(ic);
      const titre = this.add.text(x + 18, y - 7, `${p.nom}${p.prix && !PYJAMAS_DEPART.includes(id) ? ` · ${p.prix} p.` : ''}`, style(12, '#3b2410', { fontStyle: 'bold' })).setOrigin(0, 0.5);
      if (titre.width > 300) titre.setScale(300 / titre.width, 1);
      const dit = gris && p.cadeau ? p.cadeau : p.effet;
      const effet = this.add.text(x + 18, y + 8, dit, style(10, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0, 0.5);
      if (effet.width > 290) { let t = dit; while (t.length > 4 && effet.setText(t + '…').width > 290) t = t.slice(0, -1); }
      c.add([titre, effet]);
      if (gris) for (const o of [ic, titre, effet]) o.setAlpha(0.45);
      // (au survol : on se voit dedans)
      for (const o of [ic, titre, effet]) { o.setInteractive(); o.on('pointerover', () => essayer(id)); o.on('pointerout', () => essayer(pyjamaDeCetteNuit(G))); }
      if (a) {
        const dit = PYJAMAS_DEPART.includes(id) ? 'tu l’as déjà' : 'dans ton armoire';
        const etat = this.add.text(x + 340, y, dit + (id === pyjamaDeCetteNuit(G) ? ' · ce soir' : ''), style(10, '#2f6a2a', { fontStyle: 'italic', align: 'center', wordWrap: { width: 96 } })).setOrigin(0.5);
        c.add(etat);
      } else if (gris) {
        const etat = this.add.text(x + 340, y, v.quand, style(10, '#7a6a58', { fontStyle: 'italic', align: 'center', wordWrap: { width: 96 } })).setOrigin(0.5);
        c.add(etat);
      } else this.bouton(c, x + 340, y, 70, 'Acheter', () => {
        if (verrou()) return;
        const erreur = acheterPyjama(G, id);
        if (!erreur) Son.jouer('achat');
        this.ouvrirPyjamas();
        this.message(erreur || `${p.nom} : rangé${p.f ? 'e' : ''} dans ton armoire. Tu ${p.f ? 'la' : 'le'} mettras ce soir !`, erreur ? '#a03030' : '#2f6a2a');
      }, undefined, 21);
    });
  },
});
