// L'atelier : les objets de valeur rachetés aux aventuriers. Chaque réparateur répare un objet
// à la fois ; tu choisis qui s'en charge et jusqu'à quel état aller (plus de jours et de matériaux, plus de valeur).
// Un objet cassé ou abîmé restauré jusqu'au parfait état vaut encore plus (« Restauré ★ »).
// La page s'ouvre par-dessus le soir, qui reste en pause.
// (v1.62, planche 83, validée) Un poste par réparateur, à la taille des personnages, et ses gestes (atelierGestesHD.js) ;
// une étiquette par poste ; la liste avec le buste du réparateur et l'avancement ; le bandeau de qui est libre, avec
// les salaires ; la fenêtre « Réparer » en trois temps : l'objet, qui répare, jusqu'où. Le joueur ne répare plus lui-même.
const OBJETS_PAR_PAGE_ATELIER = 8;
class AtelierScene extends Phaser.Scene {
  constructor() { super('Atelier'); }

  create() {
    lieuVu('atelier');   // (v1.61)
    this.time.delayedCall(500, () => conseilGarrick(this, 'atelier', true));
    const G = this.G = window.GAME;
    // (Phaser reprend la même scène d'une visite à l'autre : tout l'état se remet à zéro ici)
    this.fenetre = null; this.contenu = null; this.zoneEmployes = null; this.objetsPiece = null; this.gestes = []; this.page = 0;
    this.cameras.main.setBackgroundColor('#2a1a10');
    creerInterieurHD(this);
    creerPieceAtelierHD(this);
    creerHalo(this);
    if (typeof creerRecitHD === 'function') creerRecitHD(this);

    // La pièce : le râtelier, les quatre postes, le foyer de Marta, la lampe de Pip, l'étagère de velours
    this.add.image(0, 46, 'atelierPieceHD').setOrigin(0).setScale(2);
    this.add.image(784, 70, 'halo').setScale(2.4, 1.6).setTint(0xffd080).setAlpha(0.45).setBlendMode(Phaser.BlendModes.ADD);
    this.add.image(454, 150, 'halo').setScale(1.4, 1.2).setTint(0xff8030).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD);
    this.add.rectangle(480, 46, 960, 4, 0x1a0e06).setOrigin(0.5, 0).setDepth(6);
    this.add.rectangle(480, 226, 960, 4, 0x1a0e06).setOrigin(0.5, 0).setDepth(6);
    // (v1.61) le titre sort de sous la barre du haut (qui va jusqu'à x ≈ 350) ; l'aide passe sur deux lignes, avant « Fermer »
    const titre = this.add.text(364, 22, "L'atelier", style(26, '#f3d98a', { fontStyle: 'bold' })).setOrigin(0, 0.5);
    this.aide = this.add.text(titre.x + titre.width + 14, 23, '', style(11, '#c9b48a', { fontStyle: 'italic', lineSpacing: -2, wordWrap: { width: 816 - titre.x - titre.width - 14 } })).setOrigin(0, 0.5);
    this.texteInfo = this.add.text(480, 437, '', style(13, '#f3d98a', { fontStyle: 'bold', align: 'center', wordWrap: { width: 900 } })).setOrigin(0.5).setDepth(5);

    creerBouton(this, 890, 22, 120, 'Fermer', () => this.fermer());
    this.liste();
  }

  // --- Petits outils ---
  personne(id) { return { nom: EMPLOYES[id].nom, race: EMPLOYES[id].race, feminin: !!EMPLOYES[id].feminin, figurant: id }; }
  buste(x, y, id, h, expr = 'content') { const img = this.add.image(x, y, textureBusteHD(this, this.personne(id), expr)).setOrigin(0.5, 1); img.setScale(h / img.height); return img; }
  // un texte qui ne dépasse jamais sa place : la police rapetisse (jusqu'à `min`), puis le texte est raccourci
  tenir(txt, largeur, min = 9) {
    let t = parseInt(txt.style.fontSize, 10);
    while (txt.width > largeur && t > min) txt.setFontSize(--t);
    while (txt.width > largeur && txt.text.length > 4) txt.setText(txt.text.slice(0, -2).trimEnd() + '…');
    return txt;
  }
  // la pastille d'un état : sa couleur, et un texte qui se lit dessus (ETATS[e].encre : sombre sur le jaune et le vert)
  pastille(x, y, e, taille = 12, largeur = 74) {
    const d = ETATS[e];
    return [this.add.rectangle(x, y, largeur, taille + 8, d.couleur).setStrokeStyle(1, 0x2a1a10).setOrigin(0, 0.5),
      this.add.text(x + largeur / 2, y, d.nom, style(taille, d.encre || '#fff4dc', { fontStyle: 'bold' })).setOrigin(0.5)];
  }
  barre(x, y, l, f, couleur) {
    return [this.add.rectangle(x, y, l, 7, 0x3b2410).setOrigin(0, 0.5), this.add.rectangle(x + 1, y, Math.max(0, (l - 2) * Math.min(1, f)), 5, couleur).setOrigin(0, 0.5)];
  }
  // où en est une réparation (de 0 à 1)
  avancement(t) {
    const r = t.reparation, total = Math.max(r.total || dureeReparation(this.G, t, r.ouvrier, r.cible || t.etat + 1), r.jours);
    return total > 0 ? 1 - r.jours / total : 0;
  }
  reparationDe(id) { return enReparation(this.G).find(t => t.reparation.ouvrier === id) || null; }
  occupe(id) { return EMPLOYES[id].feminin ? 'occupée' : 'occupé'; }

  // --- La pièce : un poste par réparateur, et les objets qui attendent au râtelier et sur l'étagère ---
  piece() {
    const G = this.G;
    if (this.objetsPiece) this.objetsPiece.destroy();
    for (const g of this.gestes) g.arreter();
    this.gestes = [];
    const c = this.objetsPiece = this.add.container(0, 0).setDepth(1);
    const TEINTES = [0x7a5a4a, 0xa88a78, 0xd8ccbc, 0xffffff, 0xffffff];
    const poser = (t, x, y, echelle, pendu = false) => {
      const img = this.add.image(x, y, iconeObjet(this, 'tr_' + t.categorie)).setOrigin(0.5, pendu ? 0 : 1).setScale(echelle).setTint(TEINTES[t.etat]);
      if (t.etat === 0) img.setAngle(pendu ? 12 : -14);
      c.add(img);
      c.add(this.add.circle(x + (pendu ? 0 : 9), pendu ? y - 4 : y - 4, 4, ETATS[t.etat].couleur).setStrokeStyle(1, 0x2a1a10));
      return img;
    };
    // les postes, de gauche à droite : l'établi de Tobin, l'enclume de Marta, le cheval de Brann, l'établi de Pip
    REPARATEURS_ATELIER.forEach((id, i) => {
      const x = [136, 316, 498, 680][i];
      const embauche = G.employes.includes(id), travail = embauche && this.reparationDe(id);
      const img = this.add.image(x, 52, texturePosteAtelier(this, id, embauche ? 'repos' : 'vide')).setOrigin(0);
      c.add(img);
      if (travail) this.gestes.push(animerPosteAtelier(this, img, id, { forme: niveauEmploye(G, id) >= 2 }));
      this.etiquette(c, x + 96, id, embauche, travail);
    });
    // les objets qui attendent : armes et armures au râtelier (deux barres), le reste sur les deux rayons de velours
    const auRatelier = G.tresors.filter(t => !t.reparation && ['arme', 'armure'].includes(t.categorie));
    const surLEtagere = G.tresors.filter(t => !t.reparation && !['arme', 'armure'].includes(t.categorie));
    auRatelier.slice(0, 6).forEach((t, i) => poser(t, 32 + (i % 3) * 38, i < 3 ? 86 : 132, 2, true));
    surLEtagere.slice(0, 6).forEach((t, i) => poser(t, 890 + (i % 3) * 26, i < 3 ? 104 : 148, 1.4));
    const plus = (n, x, y) => { if (n > 0) c.add(this.add.text(x, y, `+${n}`, style(11, '#fff4dc', { fontStyle: 'bold', stroke: '#2a1a10', strokeThickness: 3 })).setOrigin(0.5)); };
    plus(auRatelier.length - 6, 70, 196); plus(surLEtagere.length - 6, 916, 196);
  }

  // L'étiquette d'un poste : l'objet sur l'établi, la cible et les jours qui restent ; sinon qui est libre (ou à embaucher)
  etiquette(c, x, id, embauche, t) {
    const w = 168, prenom = prenomDe(EMPLOYES[id].nom);
    c.add(this.add.image(x, 70, panneauHD(this, w, 40)).setScale(2).setDepth(5));
    let l1, l2, coul2 = '#5a3a20';
    if (t) {
      const cible = t.reparation.cible || t.etat + 1;
      c.add(this.add.image(x - 70, 66, iconeObjet(this, 'tr_' + t.categorie)).setScale(1.2));
      l1 = raccourcir(t.nom, 21); l2 = `${prenom} → ${ETATS[cible].nom} · ${t.reparation.jours} j`; coul2 = ETATS[cible].texte;
      c.add(this.barre(x - 58, 84, 116, this.avancement(t), ETATS[cible].couleur));
    } else if (embauche) { l1 = `${prenom} est libre`; l2 = { tobin: 'tout ce que tu lui confies', marta: 'tout, un jour plus vite', brann: 'un vêtement ? une armure ?', pip: 'un bijou ? un artefact ?' }[id]; coul2 = '#2f6a2a'; }
    else { l1 = 'Poste à pourvoir'; l2 = `${prenom} : à embaucher en bas`; coul2 = '#7a6a5a'; }
    const largeur = t ? 128 : 150, cx = t ? x + 8 : x;
    c.add(this.tenir(this.add.text(cx, t ? 62 : 63, l1, style(11, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5), largeur));
    c.add(this.tenir(this.add.text(cx, t ? 75 : 78, l2, style(10, coul2, { fontStyle: t ? 'bold' : 'bold italic' })).setOrigin(0.5), largeur));
  }

  // --- Le bandeau des réparateurs : qui est libre, qui travaille à quoi, son salaire et sa prochaine hausse ---
  employes() {
    const G = this.G;
    if (this.zoneEmployes) this.zoneEmployes.destroy();
    const c = this.zoneEmployes = this.add.container(0, 0);
    const places = placesEmployes(G);
    c.add(this.tenir(this.add.text(24, 453, `Tes réparateurs · ${G.employes.length} / ${places} poste${places > 1 ? 's' : ''}` + (salaires(G) ? ` · salaires : ${salaires(G)} p. par nuit` : '') +
      (places < EMPLOYES_DE_BASE + 2 ? ' · un établi de plus (améliorations) = une place de plus' : ''), style(12, '#f3e6c8', { fontStyle: 'bold' })).setOrigin(0, 0.5), 912));
    REPARATEURS_ATELIER.forEach((id, i) => {
      const e = EMPLOYES[id], x = 12 + i * 236, y = 463, L = 228;
      const embauche = G.employes.includes(id), t = embauche && this.reparationDe(id);
      const possible = embauche || G.employes.length < places;
      c.add(this.add.rectangle(x, y, L, 74, 0x3a2614).setOrigin(0).setStrokeStyle(2, embauche ? (t ? 0x8a6a3a : 0x6ab04a) : 0x5a4a3a));
      const b = this.buste(x + 28, y + 73, id, 64, embauche ? 'content' : 'neutre'); c.add(b);
      if (!embauche) b.setAlpha(0.7);
      const tx = x + 58, place = L - 62;
      // le bouton : renvoyer, embaucher, ou rien (plus d'établi libre)
      const btn = this.add.rectangle(x + L - 33, y + 12, 58, 18, embauche ? 0x8a3a2a : possible ? 0x4f7a3a : 0x5a4a3a).setStrokeStyle(2, 0x2a1a10);
      const txtBtn = this.tenir(this.add.text(x + L - 33, y + 12, embauche ? 'Renvoyer' : possible ? 'Embaucher' : 'Fermé', style(9, '#fff4dc', { fontStyle: 'bold' })).setOrigin(0.5), 54, 8);
      c.add([btn, txtBtn]);
      if (possible) btn.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.embaucherOuRenvoyer(id));
      c.add(this.tenir(this.add.text(tx, y + 12, e.nom, style(11, '#f3d98a', { fontStyle: 'bold' })).setOrigin(0, 0.5), place - 64));
      const ligne = (dy, txt, coul, taille = 10, gras = false) => c.add(this.tenir(this.add.text(tx, y + dy, txt, style(taille, coul, gras ? { fontStyle: 'bold' } : {})).setOrigin(0, 0.5), place));
      if (embauche) {
        ligne(28, t ? `Répare : ${raccourcir(t.nom, 17)} · ${t.reparation.jours} j` : 'Libre', t ? '#e8c890' : '#9ae07a', 10, true);
        // son salaire, et ses deux prochaines hausses : au début du mois, et au prochain niveau
        const n = niveauEmploye(G, id), h = prochainesHausses(G, id);
        ligne(44, `${salaireEmploye(G, id)} p. par nuit · +${h.mois.montant} p. dans ${h.mois.jours} j`, '#f3e6c8');
        ligne(60, h.niveau ? `Niveau ${n} · niv. ${h.niveau.niveau} dans ${h.niveau.reste} rép. (+${h.niveau.montant} p.${h.niveau.niveau === NIVEAU_EMPLOYE_DOUE ? ', −1 j' : ''})` : `Niveau ${n}, le plus haut`, '#c9b48a');
      } else {
        ligne(28, `${salaireEmploye(G, id)} p. par nuit pour commencer`, '#e8c890', 10, true);
        ligne(44, e.atout, '#c9b48a');
        ligne(60, possible ? 'Plus payé à chaque niveau et chaque mois' : "Pas d'établi libre (améliorations)", '#9a8a6a');
      }
    });
  }

  embaucherOuRenvoyer(id) {
    const G = this.G, e = EMPLOYES[id];
    if (!clicUnique(this, 600) || this.fenetre) return;
    if (G.employes.includes(id)) {
      const t = this.reparationDe(id);
      renvoyer(G, id);
      this.texteInfo.setText(`${e.nom} est parti${e.feminin ? 'e' : ''}.` + (t ? ` ${t.nom} reste dans son état : les matériaux non travaillés te sont rendus.` : ''));
    } else {
      const erreur = embaucher(G, id);
      if (erreur) { Son.jouer('refus'); return this.texteInfo.setText(erreur); }
      Son.jouer('plume');
      this.texteInfo.setText(`${e.nom} rejoint ton atelier ! Salaire : ${salaireEmploye(G, id)} pièces chaque nuit, un peu plus chaque mois et à chaque niveau.`);
    }
    this.liste();
  }

  // --- La liste des objets : l'état, puis qui y travaille (et où il en est), ou le bouton « Réparer… » ---
  liste() {
    const G = this.G;
    this.aide.setText(`Artisanat niv. ${niveauArtisanat(G)} · un objet cassé demande plus de travail\n${pluriel(placesEmployes(G), 'poste', 'postes')} de réparateur · enchères au Marché`);
    this.piece();
    if (this.contenu) this.contenu.destroy();
    const c = this.contenu = this.add.container(0, 0);
    c.add(this.add.image(480, 331, panneauHD(this, 932, 196)).setScale(2));
    c.add(this.add.text(36, 251, `Tes objets de valeur (${G.tresors.length} / ${placesAtelier(G)})`, style(14, '#3b2410', { fontStyle: 'bold' })).setOrigin(0, 0.5));
    c.add(this.add.text(924, 251, `Fer ${G.materiaux.fer} · Cuir ${G.materiaux.cuir} · Fil d'or ${G.materiaux.filOr || 0}`, style(13, '#5a3a20', { fontStyle: 'bold' })).setOrigin(1, 0.5));
    c.add(this.add.rectangle(480, 265, 900, 2, 0x8a6a3a, 0.6));
    this.employes();
    if (!G.tresors.length) {
      c.add(this.add.text(480, 340, "Rachète des objets aux aventuriers à la fin de leur récit :\nils apparaîtront ici, et dans la pièce au-dessus.",
        style(15, '#6b4a2a', { align: 'center', lineSpacing: 6 })).setOrigin(0.5));
      return;
    }
    // (v1.62) plus de huit objets (avec deux établis de plus, on en garde douze) : deux pages
    const pages = Math.ceil(G.tresors.length / OBJETS_PAR_PAGE_ATELIER);
    this.page = Math.min(this.page, pages - 1);
    if (pages > 1) {
      const fleche = (x, txt, d) => { const f = this.add.text(x, 251, txt, style(13, '#8a3a2a', { fontStyle: 'bold' })).setOrigin(0.5).setInteractive({ useHandCursor: true });
        f.on('pointerdown', () => { this.page = (this.page + d + pages) % pages; this.liste(); }); c.add(f); };
      fleche(560, '◀', -1); c.add(this.add.text(600, 251, `page ${this.page + 1} / ${pages}`, style(12, '#5a3a20', { fontStyle: 'bold' })).setOrigin(0.5)); fleche(640, '▶', 1);
    }
    const debut = this.page * OBJETS_PAR_PAGE_ATELIER, visibles = G.tresors.slice(debut, debut + OBJETS_PAR_PAGE_ATELIER);
    if (visibles.length > 4) c.add(this.add.rectangle(480, 346, 2, 150, 0x8a6a3a, 0.6));
    const libre = ouvrierLibre(G);
    visibles.forEach((t, i) => {
      const x0 = i < 4 ? 28 : 492, y = 287 + (i % 4) * 38;
      c.add(this.add.image(x0 + 12, y, iconeObjet(this, 'tr_' + t.categorie)).setScale(1.5));
      c.add(this.tenir(this.add.text(x0 + 30, y - 8, t.nom, style(13, '#3b2410', { fontStyle: 'bold' })).setOrigin(0, 0.5), 186));
      // Ce qu'il t'a coûté, et ce qu'il vaut maintenant
      const achat = t.prixAchat !== undefined ? `acheté ${t.prixAchat} p.` : CATEGORIES[t.categorie].nom;
      c.add(this.tenir(this.add.text(x0 + 30, y + 9, `${achat} · vaut ~${valeurTresor(t)} p.${estRestaure(t) ? ' ★' : ''}`,
        style(11, estRestaure(t) ? '#b8860b' : '#5a3a20', { fontStyle: 'bold' })).setOrigin(0, 0.5), 186));
      c.add(...this.pastille(x0 + 222, y, t.etat, 11));
      const droite = x0 + 436;
      if (t.reparation) {
        // le buste du réparateur, la cible, la barre d'avancement et les jours qui restent
        const o = t.reparation.ouvrier, cible = t.reparation.cible || t.etat + 1;
        if (EMPLOYES[o]) c.add(this.buste(x0 + 316, y + 18, o, 34));
        c.add(this.tenir(this.add.text(x0 + 336, y - 8, `${EMPLOYES[o] ? prenomDe(EMPLOYES[o].nom) : 'En cours'} → ${ETATS[cible].nom}`, style(11, ETATS[cible].texte, { fontStyle: 'bold' })).setOrigin(0, 0.5), 100));
        c.add(this.barre(x0 + 336, y + 9, 66, this.avancement(t), ETATS[cible].couleur));
        c.add(this.add.text(droite, y + 9, `${t.reparation.jours} j`, style(11, ETATS[cible].texte, { fontStyle: 'bold' })).setOrigin(1, 0.5));
      } else if (t.etat >= ETATS.length - 1) {
        c.add(this.add.text(droite, y, estRestaure(t) ? 'Restauré ★' : 'Parfait état', style(13, estRestaure(t) ? '#b8860b' : ETATS[ETATS.length - 1].texte, { fontStyle: 'bold italic' })).setOrigin(1, 0.5));
      } else {
        const btn = this.add.rectangle(droite - 64, y, 128, 28, 0x8a5a2b).setStrokeStyle(2, 0x3b2410).setInteractive({ useHandCursor: true });
        btn.on('pointerdown', () => {
          if (this.fenetre) return;
          if (!ouvrierLibre(G)) return this.texteInfo.setText(messagePasDOuvrier(G));
          this.choisirStade(t);
        });
        if (!libre) btn.setAlpha(0.5);
        c.add([btn, this.add.text(droite - 64, y, 'Réparer…', style(13, '#fff4dc', { fontStyle: 'bold' })).setOrigin(0.5)]);
      }
    });
  }

  // --- La fenêtre « Réparer », en trois temps : 1. l'objet ; 2. qui répare ; 3. jusqu'où ---
  // `choix` : { ouvrier, cible } ; par défaut, le plus rapide des libres, et l'état le plus haut qu'on peut se payer.
  choisirStade(t, choix = {}) {
    const G = this.G;
    if (this.fenetre) this.fenetre.destroy();
    const mat = CATEGORIES[t.categorie].materiau;
    const stades = [];
    for (let e = t.etat + 1; e < ETATS.length; e++) stades.push(e);
    const possible = e => (!mat || (G.materiaux[mat] || 0) >= materiauxReparation(t, e)) && G.argent >= prixReparation(t, e);
    const cible = choix.cible ?? ([...stades].reverse().find(possible) ?? stades[stades.length - 1]);
    const libres = ouvriersLibres(G);
    const ouvrier = choix.ouvrier && libres.includes(choix.ouvrier) ? choix.ouvrier : ouvrierLibre(G, t, cible);
    const plusRapide = ouvrierLibre(G, t, cible);
    const c = this.fenetre = this.add.container(0, 0).setDepth(40);
    const W = 900, H = 470, x0 = 480 - W / 2, y0 = 290 - H / 2;
    c.add(this.add.rectangle(480, 270, 960, 540, 0x000000, 0.6).setInteractive());
    c.add(this.add.image(480, 290, panneauHD(this, W, H)).setScale(2));
    const T = (x, y, txt, taille, coul, extra = {}) => { const o = this.add.text(x, y, txt, style(taille, coul, extra)); c.add(o); return o; };
    T(480, y0 + 24, `Réparer : ${t.nom}`, 18, '#3b2410', { fontStyle: 'bold' }).setOrigin(0.5);
    const entete = (x, n, txt) => { c.add(this.add.circle(x + 10, y0 + 56, 10, 0x8a5a2b)); T(x + 10, y0 + 56, String(n), 12, '#fff4dc', { fontStyle: 'bold' }).setOrigin(0.5); T(x + 26, y0 + 56, txt, 14, '#3b2410', { fontStyle: 'bold' }).setOrigin(0, 0.5); };
    entete(x0 + 24, 1, "L'objet"); entete(x0 + 216, 2, 'Qui répare ?'); entete(x0 + 586, 3, "Jusqu'où ?");
    for (const x of [x0 + 206, x0 + 576]) c.add(this.add.rectangle(x, y0 + 222, 2, 300, 0x8a6a3a, 0.6));
    // 1. l'objet, en grand : son état, ce qu'il vaut, ce qu'il demande
    c.add(this.add.image(x0 + 110, y0 + 150, iconeObjet(this, 'tr_' + t.categorie)).setScale(4.5).setTint([0x7a5a4a, 0xa88a78, 0xd8ccbc, 0xffffff, 0xffffff][t.etat]));
    c.add(this.pastille(x0 + 73, y0 + 212, t.etat, 12));
    this.tenir(T(x0 + 110, y0 + 242, `vaut ~${valeurTresor(t)} p.` + (t.prixAchat !== undefined ? ` · acheté ${t.prixAchat} p.` : ''), 12, '#5a3a20', { fontStyle: 'bold' }).setOrigin(0.5), 176);
    T(x0 + 110, y0 + 264, `${CATEGORIES[t.categorie].nom} : ${mat ? `il faut du ${MATERIAUX[mat].nom.toLowerCase()}` : 'sans matériau'}`, 12, '#5a3a20').setOrigin(0.5);
    if (mat) T(x0 + 110, y0 + 282, `(tu en as ${G.materiaux[mat] || 0})`, 12, '#5a3a20').setOrigin(0.5);
    if (t.etatInitial in BONUS_RESTAURE) T(x0 + 110, y0 + 324, `Restauré jusqu'au parfait\nétat : il vaudra ×${String(BONUS_RESTAURE[t.etatInitial]).replace('.', ',')}`, 11, '#b8860b', { fontStyle: 'bold italic', align: 'center' }).setOrigin(0.5);
    // 2. les réparateurs : les libres d'abord (le plus rapide en tête), puis les occupés, grisés
    const ordre = [...libres].sort((a, b) => dureeReparation(G, t, a, cible) - dureeReparation(G, t, b, cible) || salaireEmploye(G, a) - salaireEmploye(G, b))
      .concat(G.employes.filter(o => EMPLOYES[o] && !libres.includes(o)));
    if (!ordre.length) T(x0 + 391, y0 + 200, "Personne à l'atelier :\nembauche un réparateur\nen bas de l'écran.", 13, '#7a6a5a', { fontStyle: 'italic', align: 'center', lineSpacing: 4 }).setOrigin(0.5);
    ordre.slice(0, 4).forEach((id, i) => {
      const y = y0 + 80 + i * 76, x = x0 + 216, occupe = !libres.includes(id), sel = id === ouvrier;
      const fond = this.add.rectangle(x, y, 350, 68, occupe ? 0xd8c8a8 : sel ? 0xfff4dc : 0xf6ead0).setOrigin(0).setStrokeStyle(sel ? 3 : 2, sel ? 0xd4a020 : 0x8a6a3a);
      c.add(fond);
      const b = this.buste(x + 32, y + 66, id, 62); c.add(b); if (occupe) b.setAlpha(0.55);
      this.tenir(T(x + 66, y + 13, EMPLOYES[id].nom, 13, occupe ? '#7a6a5a' : '#3b2410', { fontStyle: 'bold' }).setOrigin(0, 0.5), occupe ? 270 : 190);
      this.tenir(T(x + 66, y + 32, EMPLOYES[id].atout + ` · niveau ${niveauEmploye(G, id)}${niveauEmploye(G, id) >= NIVEAU_EMPLOYE_DOUE ? ' (−1 jour)' : ''}`, 10, occupe ? '#8a7a6a' : '#5a3a20').setOrigin(0, 0.5), occupe ? 276 : 220);
      if (occupe) {
        const r = this.reparationDe(id);
        this.tenir(T(x + 66, y + 51, `${this.occupe(id)[0].toUpperCase()}${this.occupe(id).slice(1)} : ${r.nom}, encore ${pluriel(r.reparation.jours, 'jour', 'jours')}`, 11, '#9a3020', { fontStyle: 'bold italic' }).setOrigin(0, 0.5), 276);
        return;
      }
      const j = dureeReparation(G, t, id, cible);
      T(x + 66, y + 51, `${salaireEmploye(G, id)} p. par nuit`, 11, '#5a3a20', { fontStyle: 'bold' }).setOrigin(0, 0.5);
      T(x + 340, y + 38, `${j} j`, 20, sel ? '#2f6a2a' : '#3b2410', { fontStyle: 'bold' }).setOrigin(1, 0.5);
      if (id === plusRapide && libres.length > 1) T(x + 340, y + 14, 'le plus rapide', 10, '#2f6a2a', { fontStyle: 'bold italic' }).setOrigin(1, 0.5);
      fond.setInteractive({ useHandCursor: true }).on('pointerdown', () => { if (id !== ouvrier) { Son.jouer('clic'); this.choisirStade(t, { ouvrier: id, cible }); } });
    });
    // 3. jusqu'où : un état par ligne, pour le réparateur choisi (jours, matériau, fournitures, valeur à la fin)
    stades.forEach((e, i) => {
      const y = y0 + 80 + i * 76, x = x0 + 586, ok = possible(e), sel = e === cible;
      const j = dureeReparation(G, t, ouvrier, e), n = materiauxReparation(t, e), prix = prixReparation(t, e);
      const restaure = e === ETATS.length - 1 && t.etatInitial in BONUS_RESTAURE;
      const fond = this.add.rectangle(x, y, 290, 68, !ok ? 0xd8c8a8 : sel ? 0xfff4dc : 0xf6ead0).setOrigin(0).setStrokeStyle(sel ? 3 : 2, sel ? 0xd4a020 : 0x8a6a3a);
      c.add(fond);
      c.add(this.pastille(x + 12, y + 20, e, 12, 80));
      T(x + 280, y + 20, `→ ~${valeurTresor(t, e)} p.${restaure ? ' ★' : ''}`, 14, restaure ? '#b8860b' : ETATS[e].texte, { fontStyle: 'bold' }).setOrigin(1, 0.5);
      const manque = mat && (G.materiaux[mat] || 0) < n ? `il te faut ${n} ${MATERIAUX[mat].nom.toLowerCase()} (tu en as ${G.materiaux[mat] || 0})` : G.argent < prix ? `fournitures : ${prix} p. (tu n'as pas assez)` : null;
      this.tenir(T(x + 12, y + 49, manque || `${pluriel(j, 'jour', 'jours')}${mat ? ` · ${n} ${MATERIAUX[mat].nom.toLowerCase()}` : ''} · ${prix} p. de fournitures`, 12, manque ? '#9a3020' : '#3b2410', { fontStyle: 'bold' }).setOrigin(0, 0.5), 268);
      if (ok) fond.setInteractive({ useHandCursor: true }).on('pointerdown', () => { if (e !== cible) { Son.jouer('clic'); this.choisirStade(t, { ouvrier, cible: e }); } });
    });
    // la phrase qui résume, et les deux boutons
    c.add(this.add.rectangle(480, y0 + H - 64, W - 60, 2, 0x8a6a3a, 0.6));
    const lancer = ouvrier && possible(cible);
    const jours = ouvrier ? dureeReparation(G, t, ouvrier, cible) : 0;
    const resume = !ouvrier ? messagePasDOuvrier(G)
      : `${prenomDe(EMPLOYES[ouvrier].nom)} répare « ${t.nom} » jusqu'à « ${ETATS[cible].nom} » : ${pluriel(jours, 'jour', 'jours')}` + (mat ? `, ${materiauxReparation(t, cible)} ${MATERIAUX[mat].nom.toLowerCase()}` : '') + `, ${prixReparation(t, cible)} p.`;
    this.tenir(T(x0 + 30, y0 + H - 42, resume, 13, '#3b2410', { fontStyle: 'bold' }).setOrigin(0, 0.5), 520);
    const restaure = cible === ETATS.length - 1 && t.etatInitial in BONUS_RESTAURE;
    this.tenir(T(x0 + 30, y0 + H - 22, lancer ? `Une fois fini, il vaudra ~${valeurTresor(t, cible)} p.${restaure ? ' (Restauré ★)' : ''}` : ouvrier ? 'Choisis un état que tu peux te payer.' : '', 12, lancer ? (restaure ? '#b8860b' : ETATS[cible].texte) : '#9a3020', { fontStyle: 'bold' }).setOrigin(0, 0.5), 520);
    const b1 = creerBouton(this, x0 + W - 296, y0 + H - 32, 120, 'Annuler', () => this.fermerFenetre());
    const b2 = creerBouton(this, x0 + W - 118, y0 + H - 32, 216, 'Lancer la réparation', () => { if (lancer) this.lancerReparation(t, cible, ouvrier); });
    b2.setActif(!!lancer);
    c.add([b1.fond, b1.label, b2.fond, b2.label]);
  }

  fermerFenetre() { if (this.fenetre) this.fenetre.destroy(); this.fenetre = null; }

  lancerReparation(t, cible, ouvrier) {
    const G = this.G;
    const jours = dureeReparation(G, t, ouvrier, cible);
    const erreur = reparerTresor(G, t, cible, ouvrier);
    this.fermerFenetre();
    if (erreur) { Son.jouer('refus'); return this.texteInfo.setText(erreur); }
    Son.jouer('marteau');
    this.texteInfo.setText(`${prenomDe(EMPLOYES[ouvrier].nom)} se met au travail : ${t.nom} → ${ETATS[cible].nom} en ${pluriel(jours, 'jour', 'jours')}.`);
    this.liste();
  }

  fermer() {
    for (const g of this.gestes || []) g.arreter();
    this.scene.stop();
    this.scene.resume('Nuit');
  }
}
