// (v1.56, planches 64 v5 et 74 v3 validées) Chez les Mages-Charpentiers : le carnet de commande, ouvert par-dessus la rue.
// Trois pages : les pattes (chêne, ferrées, runiques), le filet et le bois qu'elle mange, la marche d'essai.
class MagesScene extends Phaser.Scene {
  constructor() { super('Mages'); }

  init(data) { this.retour = (data && data.retour) || 'Rue'; this.sorti = false; this.page = 'pattes'; this.objets = []; this.change = false; }

  create() {
    const G = this.G = window.GAME;
    if (this.retour) this.scene.moveAbove(this.retour);
    this.cameras.main.fadeIn(250);
    this.add.rectangle(480, 270, 960, 540, 0x0a0806, 0.88).setInteractive();
    this.add.image(480, 270, panneauHD(this, 920, 500)).setScale(2);
    this.add.text(480, 40, 'Chez les Mages-Charpentiers', style(21, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5);
    // la maîtresse-charpentière, dans le coin, qui parle
    const k = corpsHD(this, MAITRESSE_MAGES, null, 'troisQuarts');
    this.add.image(70, 505, k).setOrigin(0.5, 1).setScale(4.4 * echelleCorps(k)).setFlipX(true);
    const e = etatPattes(G);
    this.dit = this.add.text(140, 470, '', style(13, '#3b2410', { fontStyle: 'italic', wordWrap: { width: 560 } })).setOrigin(0, 0.5);
    this.parler(e.vu ? (pattesPosees(G) ? '« Alors, elle marche bien ? N\'oublie pas de lui garder du bois dans le filet. »' : '« Revenu ? Ta maison s\'ennuie toujours, je le vois d\'ici. »')
      : '« Ta maison s\'ennuie ? On lui pose des jambes. Chêne, fer ou runes : elle te suivra au bout du monde. »');
    e.vu = true;
    // les onglets
    this.onglets = [['pattes', 'Les pattes'], ['bois', 'Le filet et le bois'], ['essai', 'La marche d\'essai']].map(([cle, nom], i) => {
      const b = creerBouton(this, 230 + i * 250, 82, 220, nom, () => this.montrer(cle)); b.label.setFontSize(14); b.cle = cle; return b;
    });
    const s = creerBouton(this, 840, 500, 150, 'Sortir ▶', () => this.sortir()); s.label.setFontSize(15);
    this.argent = this.add.text(700, 500, '', style(15, '#3b2410', { fontStyle: 'bold' })).setOrigin(1, 0.5);
    this.montrer('pattes');
    this.time.delayedCall(500, () => conseilGarrick(this, 'mages', true));
  }

  parler(t) { this.dit.setText(t); if (typeof Son !== 'undefined') Son.jouer('voix', { personne: { nom: MAITRESSE_MAGES.nom, race: 'magicienne', feminin: true }, ton: 'content', duree: 1 }); }
  vider() { this.objets.forEach(o => o.destroy()); this.objets = []; }
  garder(...os) { for (const o of os.flat()) this.objets.push(o); return os[0]; }
  maj() { this.argent.setText(`${this.G.argent} p.`); }

  montrer(page) {
    this.page = page; this.vider(); this.maj();
    this.onglets.forEach(b => { b.fond.setTint(b.cle === page ? 0xfff0b0 : 0xb8a888); });
    if (page === 'pattes') this.pagePattes(); else if (page === 'bois') this.pageBois(); else this.pageEssai();
  }

  // --- Les pattes : trois cartes ---
  pagePattes() {
    const G = this.G, e = etatPattes(G), suivante = sorteSuivante(G);
    PATTES.ordre.forEach((so, i) => {
      const S = PATTES.sortes[so], x = 190 + i * 290, rang = PATTES.ordre.indexOf(so), actuel = e.sorte ? PATTES.ordre.indexOf(e.sorte) : -1;
      this.garder(this.add.rectangle(x, 262, 262, 300, rang <= actuel ? 0xd8e8c0 : 0xe8d8b8).setStrokeStyle(2, rang <= actuel ? 0x5a8a3a : 0x8a6a3a));
      this.garder(this.add.image(x - 46, 210, patteMaisonHD(this, 'debout', so)).setScale(2.1), this.add.image(x + 46, 210, patteMaisonHD(this, 'pas', so)).setScale(2.1));
      this.garder(this.add.text(x, 310, S.nom, style(16, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
      this.garder(this.add.text(x, 334, S.texte, style(11, '#4a2a10', { align: 'center', wordWrap: { width: 240 } })).setOrigin(0.5, 0));
      if (rang <= actuel) this.garder(this.add.text(x, 392, rang === actuel ? '✓ posées sur ta maison' : '✓ (remplacées)', style(14, '#2a6a2a', { fontStyle: 'bold' })).setOrigin(0.5));
      else if (so === suivante) {
        const ok = atelierMagesOuvert(G);
        const b = creerBouton(this, x, 392, 230, `${so === 'chene' ? 'Commander' : 'Changer'} · ${S.prix} p.`, () => {
          const r = acheterPattes(G);
          if (r.erreur) return this.parler(`« ${r.erreur} »`);
          this.change = true; Son.jouer('piece');
          this.parler(`« Voilà ! » ${r.texte}`); this.montrer('pattes');
        });
        b.label.setFontSize(13); this.garder(b.fond, b.label);
        if (!ok || !peutPayer(G, S.prix)) { b.fond.setTint(0x9a9a9a); b.label.setAlpha(0.6); }
      } else this.garder(this.add.text(x, 392, `après les ${PATTES.sortes[PATTES.ordre[rang - 1]].nom.toLowerCase()}`, style(12, '#8a6a4a', { fontStyle: 'italic' })).setOrigin(0.5));
    });
    this.garder(this.add.text(480, 432, 'Une fois posées, elles dorment repliées au coin des murs. Le grand voyage vers un autre royaume s\'ouvrira bientôt.', style(12, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5));
  }

  // --- Le filet et le bois ---
  pageBois() {
    const G = this.G, e = etatPattes(G), places = placesFilet(G);
    // le filet, à gauche
    this.garder(this.add.rectangle(230, 262, 330, 300, 0xe8d8b8).setStrokeStyle(2, 0x8a6a3a));
    this.garder(this.add.text(230, 128, PATTES.filets[e.filet].nom, style(16, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
    this.garder(this.add.image(230, 210, filetBoisHD(this, Math.min(12, Math.round(e.bois.length / places * 12)))).setScale(3));
    const h = heuresDeBois(G);
    this.garder(this.add.text(230, 290, `${e.bois.length} / ${places} places`, style(15, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
    this.garder(this.add.text(230, 312, `${h} h de marche${h >= PATTES.journee ? ` (≈ ${Math.floor(h / PATTES.journee * 10) / 10} jours de route)` : ''}`, style(13, '#8a3a1a', { fontStyle: 'bold' })).setOrigin(0.5));
    const suivant = PATTES.filets[e.filet + 1];
    if (suivant) {
      const b = creerBouton(this, 230, 368, 280, `${suivant.nom} (${suivant.places}) · ${suivant.prix} p.`, () => { const r = acheterFilet(G); if (r.erreur) return this.parler(`« ${r.erreur} »`); Son.jouer('piece'); this.parler(`« ${r.texte} »`); this.montrer('bois'); });
      b.label.setFontSize(12); this.garder(b.fond, b.label);
    } else this.garder(this.add.text(230, 368, 'Le plus grand qui soit.', style(12, '#2a6a2a', { fontStyle: 'italic' })).setOrigin(0.5));
    // le bois, à droite
    const dessins = { planche: planchesRecupHD(this), buche: bucheCheneHD(this), charbon: sacCharbonHD(this), runique: bucheRuniqueHD(this) };
    ORDRE_COMBUSTIBLES.forEach((id, i) => {
      const c = COMBUSTIBLES[id], y = 140 + i * 72, dispo = combustibleEnVente(G, id);
      this.garder(this.add.rectangle(650, y, 470, 64, i % 2 ? 0xe8d8b8 : 0xdccaa4).setStrokeStyle(1, 0x8a6a3a));
      this.garder(this.add.image(450, y, dessins[id]).setScale(id === 'charbon' ? 1.4 : 1.6));
      this.garder(this.add.text(500, y - 12, c.nom, style(14, '#3b2410', { fontStyle: 'bold' })).setOrigin(0, 0.5));
      const n = e.bois.filter(b => b === id).length;
      this.garder(this.add.text(500, y + 11, `${c.heures} h de marche · ${c.prix} p.${c.bois && G.materiaux.bois ? ` (${G.materiaux.bois} dans ta réserve)` : ''}${n ? ` · ${n} dans le filet` : ''}`, style(11, '#5a3a20')).setOrigin(0, 0.5));
      if (!dispo) { this.garder(this.add.text(870, y, `(${c.ou})`, style(11, '#8a6a4a', { fontStyle: 'italic', align: 'right', wordWrap: { width: 130 } })).setOrigin(1, 0.5)); return; }
      [[1, '+1'], [5, '+5']].forEach(([q, t], j) => {
        const b = creerBouton(this, 790 + j * 58, y, 52, t, () => {
          const r = acheterCombustible(G, id, q);
          if (r.erreur) return this.parler(`« ${r.erreur} »`);
          Son.jouer('piece'); this.parler(`« ${r.n} ${c.nom.toLowerCase()}${r.n > 1 ? 's' : ''} dans le filet${r.deReserve ? ` (dont ${r.deReserve} de ta réserve)` : ''}. »`); this.montrer('bois');
        });
        b.label.setFontSize(13); this.garder(b.fond, b.label);
      });
    });
    this.garder(this.add.text(650, 432, 'Une journée de route = 8 heures de marche. Le bois de Thorgal est livré ici, et Thorgal garde ta réserve de planches.', style(11, '#6b4a2a', { fontStyle: 'italic', align: 'center', wordWrap: { width: 470 } })).setOrigin(0.5));
  }

  // --- La marche d'essai ---
  pageEssai() {
    const G = this.G, e = etatPattes(G);
    this.garder(this.add.image(250, 270, patteMaisonHD(this, 'repliee', e.sorte || 'chene')).setScale(3.4).setTint(pattesPosees(G) ? 0xffffff : 0x8a8070));
    this.garder(this.add.text(600, 170, 'La marche d\'essai', style(18, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
    this.garder(this.add.text(600, 200, "Ta maison se lève sur ses pattes, fait quelques pas dans la rue sous les yeux des voisins, puis se rassoit. Une fois par jour, et elle mange une heure de bois.", style(13, '#4a2a10', { align: 'center', wordWrap: { width: 420 } })).setOrigin(0.5, 0));
    const pret = pattesPosees(G) && peutEssayer(G) && e.bois.length;
    const raison = !pattesPosees(G) ? 'Il lui faut d\'abord des pattes.' : !peutEssayer(G) ? 'Elle a déjà marché aujourd\'hui.' : !e.bois.length ? 'Le filet est vide : mets-y du bois.' : '';
    const b = creerBouton(this, 600, 330, 300, 'Faire marcher la maison !', () => {
      if (!pret) return this.parler(`« ${raison} »`);
      const r = marcheDEssai(G);
      if (r.erreur) return this.parler(`« ${r.erreur} »`);
      this.change = true; this.sortir('Essai');
    });
    b.label.setFontSize(15); this.garder(b.fond, b.label);
    if (!pret) { b.fond.setTint(0x9a9a9a); b.label.setAlpha(0.6); this.garder(this.add.text(600, 372, raison, style(12, '#8a3a1a', { fontStyle: 'italic' })).setOrigin(0.5)); }
    if (e.essais) this.garder(this.add.text(600, 400, `Déjà ${e.essais} marche${e.essais > 1 ? 's' : ''} d'essai.`, style(12, '#5a3a20')).setOrigin(0.5));
  }

  sortir(vers = null) {
    if (this.sorti) return;
    this.sorti = true;
    Sauvegarde.maintenant(this.G, 'Rue');
    Son.jouer('porte');
    this.cameras.main.fadeOut(250);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop();
      if (vers) { this.scene.stop(this.retour); this.scene.start(vers, { retour: this.retour }); return; }
      if (this.change) { this.scene.stop(this.retour); this.scene.start(this.retour, { depuis: 'mages' }); return; }   // (la rue se redessine : les pattes au coin des murs)
      this.scene.resume(this.retour);
    });
  }
}
