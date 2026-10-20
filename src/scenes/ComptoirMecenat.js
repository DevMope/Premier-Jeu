// (v1.32, planche 58 validée) Au comptoir : le Grand Sage vient remercier son mécène (son vrai dessin, en pied, cadré
// à la fenêtre comme un buste : la couronne, la barbe, la cape d'écailles, le bâton au cristal) ; et, pour le neutre, les
// deux percepteurs du prix de la neutralité, un Gardien du Conseil puis un Banni, qui prennent chacun leur moitié.
const SAGE_PERSONNE = { nom: 'Le Grand Sage', race: 'humain', feminin: false, figurant: 'sage', vieux: true };
const PERCEPTEUR_BANNI = { nom: 'Grishnak le Percepteur', race: 'orc', feminin: false, niveau: 'veteran' };
function personneDuPercepteur(entree) { return entree.camp === 'conseil' ? GARDE.capitaine : PERCEPTEUR_BANNI; }

// Les visites du jour (une fois chacune)
function visitesDuMecenat(G) {
  const m = G.mecenat;
  if (!m) return [];
  const v = [];
  if (m.visite === G.jour) v.push({ type: 'sage' });
  if (m.percepteurs === G.jour) v.push({ type: 'percepteur', camp: 'conseil' }, { type: 'percepteur', camp: 'bannis' });
  return v;
}

Object.assign(CounterScene.prototype, {
  // Le Grand Sage, de son vrai dessin : le corps en pied, cadré en haut, dans la fenêtre du comptoir
  cadrerSageEnPied() {
    const cle = corpsHD(this, 'sage', null, 'face'), tx = this.textures.get(cle).getSourceImage();
    const H = tx.height, W = tx.width, part = 0.5, haut = H * part;
    const e = (FENETRE.h * 1.02) / haut;
    this.perso.setTexture(cle).setFlipX(false).setAngle(0).setOrigin(0.5, 0).setCrop(0, 0, W, haut).setScale(e)
      .setPosition(FENETRE.x + FENETRE.w / 2, FENETRE.y + FENETRE.h - haut * e + 4).setVisible(true);
    this.buste = { personne: SAGE_PERSONNE, expression: 'content', enPied: true };
  },
  visiteSage() {
    const G = this.G, m = G.mecenat || { donne: 0, paliers: [] };
    this.titreCommande.setText(''); this.sousTitre.setText(''); this.texteSac.setText(''); this.texteChance.setText('');
    this.aideCommande.setVisible(false); this.boutonEscorte.setVisible(false);
    this.cadrerSageEnPied();
    this.tweens.add({ targets: this.perso, y: this.perso.y - 2, duration: 1600, yoyo: true, repeat: 2, ease: 'Sine.easeInOut' });
    Son.jouer('cloche');
    this.dire(`« ${m.donne.toLocaleString('fr-FR')} pièces, mon enfant. Autant de pièces pour les nôtres. Le Rempart tient debout grâce à des cœurs comme le tien. Je voulais te le dire en face. »`, 'Le Grand Sage — Gardien du Rempart', 'Le Grand Sage');
    // le tableau des paliers, sans aucun gain d'argent
    if (this.feuilleConseil) { this.feuilleConseil.destroy(); this.feuilleConseil = null; }
    const F = this.feuilleConseil = this.add.container(815, 135).setDepth(2.5);
    F.add(this.add.image(0, 0, panneauHD(this, 236, 214)).setScale(2));
    F.add(this.add.text(0, -86, 'Ton mécénat', style(15, '#5a0e0e', { fontStyle: 'bold' })).setOrigin(0.5));
    F.add(this.add.text(0, -66, 'rien en argent : un honneur', style(11, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5));
    const noms = { plaque: 'la plaque des mécènes', visite: 'la visite du Sage', vitrail: 'ton vitrail', titre: '« Bienfaiteur du Rempart »', retraite: 'les Jardins d’Aube' };
    MECENAT.lumiere.forEach((p, i) => { const ok = m.paliers.includes(p.id);
      F.add(this.add.text(-100, -44 + i * 22, `${ok ? '✓' : '·'} ${p.donne.toLocaleString('fr-FR')} p. — ${noms[p.id]}`, style(11, ok ? '#2f6a2a' : '#5a4a3a', { fontStyle: ok ? 'bold' : 'normal' }))); });
    if (typeof noterJournal === 'function') noterJournal('visite du Grand Sage (mécénat)');
    this.bouton("T'incliner", () => { m.visite = 'faite'; this.bouton('...', null); this.partirPar(FENETRE.x - 80); });
  },
  visitePercepteur(entree) {
    const G = this.G, m = G.mecenat || { conseil: 0, bannis: 0 }, conseil = entree.camp === 'conseil';
    this.titreCommande.setText(''); this.sousTitre.setText(''); this.texteSac.setText(''); this.texteChance.setText('');
    this.aideCommande.setVisible(false); this.boutonEscorte.setVisible(false);
    if (conseil) this.dire(`« Le Conseil prend sa moitié : ${m.conseil.toLocaleString('fr-FR')} pièces jusqu'ici. Pour que la garde regarde ailleurs quand les Bannis passent ta porte. »`, `${GARDE.capitaine.nom} — Percepteur du Conseil`, GARDE.capitaine.nom);
    else this.dire(`« Et nous la nôtre : ${m.bannis.toLocaleString('fr-FR')} pièces. Pour que nos lames regardent ailleurs, quand tu vends aux Gardiens. Tu as notre sauf-conduit, marchand. »`, `${PERCEPTEUR_BANNI.nom} — Percepteur des Bannis`, PERCEPTEUR_BANNI.nom);
    this.bouton('Hocher la tête', () => { if (!conseil) m.percepteurs = 'faits'; this.bouton('...', null); this.partirPar(FENETRE.x - 80); });
  },
});
