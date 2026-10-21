// Le bureau : le registre des fiches (à gauche), l'ardoise du chiffre d'affaires
// et les tiroirs à statistiques (à droite). La page s'ouvre par-dessus le comptoir
// ou le soir, qui restent en pause.
const NOMS_RACES = { humain: 'Humain', hobbit: 'Hobbit', nain: 'Nain', elfe: 'Elfe', magicienne: 'Magicienne', gobelin: 'Gobelin', orc: 'Orc', loupgarou: 'Loup-garou', vampire: 'Vampire', momie: 'Momie', troll: 'Troll', panda: 'Panda' };
const ONGLETS = [
  ['avenir', 'À venir'], ['aujourdhui', "Aujourd'hui"], ['mission', 'En mission'],
  ['revenus', 'Revenus'], ['disparus', 'Disparus'], ['repertoire', 'Répertoire'],
];
const FICHES_PAR_PAGE = 9;   // (v0.57 : un peu d'air entre les fiches)
const TIROIRS = [['ameliorations', 'Améliorer le comptoir'], ['competences', 'Tes compétences'], ['aventuriers', 'Chiffres des missions'], ['commerce', 'Le commerce'], ['reputation', 'Réputation et relations'], ['camps', 'Lumière et ombre'], ['etrange', 'Choses étranges']];

class BureauScene extends Phaser.Scene {
  constructor() { super('Bureau'); }

  init(data) {
    this.retour = data.retour || 'Nuit';
    this.comptoir = data.comptoir || null;
    this.onglet = 'aujourdhui';
    this.pageListe = 0;
  }

  create() {
    const G = this.G = window.GAME;
    // Le dessus du bureau, et le registre ouvert dessus
    creerInterieurHD(this);
    creerBureauHD(this);
    this.add.image(0, 0, 'bureauBois').setOrigin(0).setScale(2).setTint(0xc8a888);
    vignette(this, 0.7, 0);
    this.add.image(22, 52, 'livreRegistre').setOrigin(0).setScale(2);
    bougie(this, 470, 528, { rayon: 130 });

    this.creerOnglets();
    this.creerArdoise();
    this.creerTiroirs();
    // (v0.99) la date ouvre le calendrier du mois (planche 24)
    const date = this.add.text(24, 500, `${dateEnTexte(G)} · semaine ${dateDuJour(G).semaine} · jour ${G.jour}  ▸ le calendrier`, style(14, '#f3e6c8', { fontStyle: 'italic' })).setInteractive({ useHandCursor: true });
    date.on('pointerover', () => date.setColor('#ffe066')); date.on('pointerout', () => date.setColor('#f3e6c8'));
    date.on('pointerdown', () => { Son.jouer('page'); this.ouvrirCalendrier(); });
    creerBouton(this, 850, 505, 180, 'Fermer', () => this.fermer());
    // Renommer le shop (l'enseigne de la façade)
    const pl = plaqueDuRang(this, 250, 'saphir');   // (v1.43) au rang de la maison
    this.add.image(640, 505, pl.cle).setScale(2);
    const enseigne = this.add.text(640 + pl.decal, 505, `✎ « ${G.nomShop} »`, style(13, '#f3d98a', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 3 }))
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    // (v0.93) un clic ouvre l'enseigne : son nom, son écriture, la couleur de son fond
    this.texteEnseigne = enseigne;
    enseigne.on('pointerdown', () => this.ouvrirEnseigne());

    if (!this.comptoir) this.onglet = 'mission';
    this.afficherListe();
    this.time.delayedCall(300, () => conseilGarrick(this, 'bureau'));
  }

  // (v0.99, planche 24) Le calendrier du mois : les jours passés barrés, aujourd'hui entouré, les loyers,
  // les fêtes, la saison et ses effets, le prochain grand rendez-vous
  ouvrirCalendrier() {
    const G = this.G;
    if (this.calendrier) this.calendrier.destroy();
    creerIconesSaison(this);
    const c = this.calendrier = this.add.container(0, 0).setDepth(60);
    c.add(this.add.rectangle(480, 270, 960, 540, 0x0a0604, 0.55).setInteractive());
    const g = this.add.graphics(); c.add(g);
    g.fillStyle(0xf0e2bc).fillRect(40, 30, 880, 470).lineStyle(4, 0x8a6a30).strokeRect(40, 30, 880, 470).lineStyle(1, 0xc8a050).strokeRect(48, 38, 864, 454);
    const d = dateDuJour(G), saison = saisonDe(G), S = SAISONS[saison];
    c.add(this.add.image(330, 66, 'iconeSaison_' + saison).setScale(1.6));
    c.add(this.add.image(630, 66, 'iconeSaison_' + saison).setScale(1.6));
    c.add(this.add.text(480, 66, `${MOIS[d.mois]} · an ${d.an}`, style(22, '#3b2410', { fontFamily: 'MedievalSharp, serif' })).setOrigin(0.5));
    const prix = Object.entries(PRIX_SAISON[saison]).map(([id, k]) => `${nomObjet(id).toLowerCase()} ${k > 1 ? '+' : '−'}${Math.round(Math.abs(k - 1) * 100)} %`).join(', ');
    c.add(this.add.text(480, 92, `${S.effet} · au marché : ${prix}`, style(12, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5));
    ['Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.', 'Dim.'].forEach((n, i) => c.add(this.add.text(140 + i * 102, 116, n, style(12, '#5a3a20', { fontStyle: 'bold' })).setOrigin(0.5)));
    for (let k = 0; k < JOURS_PAR_MOIS; k++) {
      const col = k % 7, ligne = Math.floor(k / 7), x = 92 + col * 102, y = 128 + ligne * 62, jeu = G.jour + (k + 1 - d.jourDuMois);
      const f = feteDuJour(G, jeu);
      g.fillStyle(f ? (f.camp === 'bien' ? 0xf8e8a0 : f.camp === 'tous' ? 0xd8ecf8 : 0xd8c8e8) : 0xf8f0d8).fillRect(x, y, 96, 56).lineStyle(1, 0xb89a6a).strokeRect(x, y, 96, 56);
      c.add(this.add.text(x + 5, y + 3, String(k + 1), style(11, '#3b2410', { fontStyle: 'bold' })));
      if (k + 1 < d.jourDuMois) g.lineStyle(2, 0x9a7a50, 0.8).lineBetween(x + 8, y + 50, x + 88, y + 8);   // (les jours passés, barrés)
      if (k + 1 === d.jourDuMois) g.lineStyle(3, 0xc02a1a).strokeEllipse(x + 48, y + 28, 90, 50);        // (aujourd'hui)
      if (jeu > 0 && jourDeLoyer(G, jeu)) { c.add(this.add.text(x + 48, y + 44, 'loyer', style(10, '#8a5a2a', { fontStyle: 'italic' })).setOrigin(0.5)); g.fillStyle(0xe8b830).fillCircle(x + 84, y + 12, 6).lineStyle(1, 0x8a6a10).strokeCircle(x + 84, y + 12, 6); }
      if (f) c.add(this.add.text(x + 48, y + 26, f.jour === 1 ? f.titre.replace('La ', '') : f.jour === 0 ? 'la veille' : 'le lendemain', style(10, f.camp === 'bien' ? '#2a4a8a' : f.camp === 'tous' ? '#1e5a8a' : '#5a2a6a', { fontStyle: 'bold', align: 'center', wordWrap: { width: 90 } })).setOrigin(0.5));
    }
    // les quatre saisons de l'année, celle d'aujourd'hui en avant
    ORDRE_SAISONS.forEach((s2, i) => {
      const x = 150 + i * 120;
      if (s2 === saison) g.fillStyle(0xf8e098).fillRect(x - 46, 380, 92, 56);
      c.add(this.add.image(x, 398, 'iconeSaison_' + s2).setScale(1.5));
      c.add(this.add.text(x, 424, SAISONS[s2].nom, style(12, '#3b2410', { fontStyle: s2 === saison ? 'bold' : 'normal' })).setOrigin(0.5));
    });
    const p = prochaineFete(G), now = feteDuJour(G);
    g.fillStyle(0xf8f0d8).fillRoundedRect(640, 378, 250, 64, 8).lineStyle(2, 0xb89a6a).strokeRoundedRect(640, 378, 250, 64, 8);
    c.add(this.add.text(765, 392, 'Prochain grand rendez-vous', style(12, '#5a3a20', { fontStyle: 'bold' })).setOrigin(0.5));
    c.add(this.add.text(765, 418, now ? `${now.titre} : c'est ${['demain le grand jour', "aujourd'hui", 'le dernier jour'][now.jour]} !` : p ? `${p.titre} dans ${pluriel(p.dans, 'jour', 'jours')}` : '—', style(12, '#2a4a8a', { fontStyle: 'bold', wordWrap: { width: 230 }, align: 'center' })).setOrigin(0.5));
    const b = creerBouton(this, 480, 470, 160, 'Fermer', () => { c.destroy(); this.calendrier = null; });
    c.add([b.fond, b.label].filter(Boolean));
  }

  // --- Les onglets du registre ---

  creerOnglets() {
    this.ongletsFonds = ONGLETS.map(([cle, nom], i) => {
      const x = 30 + i * 88;
      const fond = this.add.image(x + 43, 38, 'ongletHD').setScale(2).setInteractive({ useHandCursor: true });
      const texte = this.add.text(x + 43, 38, nom, style(12, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5);
      fond.on('pointerdown', () => { Son.jouer('page'); this.onglet = cle; this.pageListe = 0; this.afficherListe(); });
      return { cle, fond, texte };
    });
  }

  vider() {
    if (this.pages) this.pages.destroy();
    this.pages = this.add.container(0, 0);
    for (const o of this.ongletsFonds) {
      o.fond.setTexture(o.cle === this.onglet ? 'ongletHD_actif' : 'ongletHD').setY(o.cle === this.onglet ? 40 : 38);
      o.texte.setColor(o.cle === this.onglet ? '#3b2410' : '#f3e6c8');
    }
    return this.pages;
  }

  // Les fiches de l'onglet : { nom, race, ligne, detail() }
  fiches() {
    const G = this.G;
    const pctAffiche = c => niveauFlair(G) < 1 ? `~${Math.round(c * 10) * 10} %` : `${Math.round(c * 100)} %`;
    switch (this.onglet) {
      case 'avenir':
        return G.annonces.map(a => ({
          nom: a.voyageur.nom, race: a.voyageur.race,
          ligne: `Jour ${a.jour} · ${a.acceptee ? 'commande acceptée' : 'lettre à répondre'}`,
          detail: () => [`Arrive le jour ${a.jour} (lettre ${a.acceptee ? 'acceptée' : 'sans réponse'})`,
            `Quête : ${a.voyageur.quete}`, `Durée : ${pluriel(a.voyageur.duree, "jour", "jours")} · butin espéré ~${a.voyageur.butin} p.`,
            `Commande : ${commandeEnTexte(a.voyageur)}`],
        }));
      case 'aujourdhui': {
        const entrees = [...(this.comptoir && this.comptoir.entree ? [this.comptoir.entree] : []), ...G.file];
        return entrees.map(e => {
          if (e.type === 'client') {
            const v = e.voyageur;
            return { nom: v.nom, race: v.race, ligne: (e === (this.comptoir && this.comptoir.entree) ? 'Au comptoir · ' : 'Dans la file · ') + v.quete,
              detail: () => [`Quête : ${v.quete}`, `Commande : ${commandeEnTexte(v)}`, `Durée : ${pluriel(v.duree, "jour", "jours")} · butin espéré ~${v.butin} p.`] };
          }
          if (e.type === 'famille') {
            const p = e.visite.parent;
            return { nom: p.nom, race: p.race, ligne: `Visite : ${p.lien} ${dePersonne(e.visite.defunt.nom)}`, detail: () => [`Vient au sujet ${dePersonne(e.visite.defunt.nom)}.`] };
          }
          if (e.type === 'faucheuse') return null;   // (v0.93) elle reste une surprise
          // (audit v0.61) les visites sans voyageur (garde, Garrick, collecteur, Serpent, colporteur,
          // notable, aîné...) faisaient planter le registre
          if (!e.parti) {
            const p = CounterScene.prototype.personneDe.call({ G }, e) || {};
            const LIGNES = { garde: 'La garde de la Confrérie', garrick: 'Garrick passe te voir', collecteur: `Le collecteur de ${nomBande(G)}`, serpent: 'Le Serpent à deux têtes', colporteur: 'Le colporteur et sa hotte', notable: 'Un visiteur de marque', aine: 'Un aîné vient te parler', heraut: 'Le héraut du Conseil (commande scellée)', rival: "Lucien Belhomme, le voisin", crieur: 'Le crieur : le mois des comptoirs' };
            return { nom: p.nom || 'Un visiteur', race: p.race || 'humain', ligne: LIGNES[e.type] || 'Une visite', detail: () => [] };
          }
          const v = e.parti.voyageur;
          return { nom: v.nom, race: v.race,
            ligne: e.type === 'retour' ? 'Revient de mission !' : e.type === 'detresse' ? 'Un pigeon : son appel à l’aide' : 'Son carnet est posé sur ton comptoir...',
            detail: () => [`Parti${v.feminin ? 'e' : ''} le jour ${e.parti.depart} : ${v.quete}`] };
        }).filter(Boolean);
      }
      case 'mission':
        return enMission(G).map(p => ({
          nom: p.voyageur.nom, race: p.voyageur.race,
          ligne: `Retour jour ${p.retour} · préparé à ${pctAffiche(p.chance)}`,
          detail: () => [`Quête : ${p.voyageur.quete}`, `Parti${p.voyageur.feminin ? 'e' : ''} le jour ${p.depart}, retour prévu le jour ${p.retour}`,
            `Préparé à ${pctAffiche(p.chance)} · butin espéré ~${p.voyageur.butin} p.`,
            `Colis : ${Object.entries(p.colis).filter(([, n]) => n).map(([id, n]) => `${n} ${ITEMS[id].nom}`).join(', ') || 'rien'}`],
        }));
      case 'revenus':
      case 'disparus':
        return G.historique.filter(h => (this.onglet === 'revenus') === ['vivant', 'echec'].includes(h.issue)).map(h => ({
          nom: h.nom, race: h.race,
          ligne: h.issue === 'echec' ? `Jour ${h.retour} · mission ratée · ${h.quete}` : h.issue === 'vivant' ? `Jour ${h.retour} · +${h.gain} p. · ${h.quete}` : `Jour ${h.retour} · mort${(G.personnes[h.nom] || {}).feminin ? 'e' : ''} ${h.issue === 'valeureux' ? 'au combat' : 'sans gloire'}${h.voulu ? ' · offert à la Faucheuse' : ''}`,
          detail: () => [`Quête : ${h.quete} (jours ${h.depart} à ${h.retour})`,
            ...(() => { const f = (G.personnes[h.nom] || {}).feminin ? 'e' : '';
              return [h.issue === 'echec' ? `Revenu${f} vivant${f}, mais sans rien : mission ratée.` : h.issue === 'vivant' ? `Revenu${f} vivant${f}, a rapporté ${h.gain} pièces.` : `Mort${f} ${h.issue === 'valeureux' ? 'valeureusement au combat' : 'sans gloire'}.`]; })(),
            ...(h.voulu ? [`Offert à la Faucheuse : ${MORTS_VOULUES[h.voulu].texte}.`] : [])],
        }));
      default: {
        const marchands = Object.entries(MARCHANDS).map(([cle, m]) => [m.nom, { race: m.race, marchand: cle }]);
        const connus = Object.keys(G.relations).map(nom => {
          const m = marchands.find(([n]) => n === nom);
          return { nom, race: m ? m[1].race : (G.personnes[nom] || {}).race || 'humain', marchand: m && m[1].marchand };
        });
        connus.sort((a, b) => G.relations[b.nom] - G.relations[a.nom]);
        return connus.map(c => ({
          nom: c.nom, race: c.race,
          ligne: `${niveauRelation(G, c.nom).nom} (${G.relations[c.nom]} pts)${c.marchand ? ' · ' + MARCHANDS[c.marchand].metier : ''}`,
          detail: () => c.marchand ? [`${MARCHANDS[c.marchand].metier} du Marché des Mastres`, `Tu as dépensé ${G.depenses[c.marchand] || 0} pièces chez ${c.nom}.`,
            `Remise actuelle : ${Math.round(remiseMarchand(G, c.marchand) * 100)} %`] : [],
        }));
      }
    }
  }

  afficherListe() {
    const c = this.vider();
    const fiches = this.fiches();
    const pages = Math.max(1, Math.ceil(fiches.length / FICHES_PAR_PAGE));
    this.pageListe = Math.min(this.pageListe, pages - 1);
    c.add(this.add.text(161, 72, ONGLETS.find(o => o[0] === this.onglet)[1], style(16, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
    if (!fiches.length) {
      const vide = { avenir: 'Aucune lettre reçue.', aujourdhui: this.comptoir ? 'Plus personne aujourd\'hui.' : 'Le comptoir est fermé.', mission: 'Personne en mission.',
        revenus: 'Personne n\'est encore revenu.', disparus: 'Aucun disparu. Pour l\'instant.', repertoire: 'Tu ne connais encore personne.' }[this.onglet];
      c.add(this.add.text(161, 200, vide, style(13, '#6b4a2a', { fontStyle: 'italic', align: 'center', wordWrap: { width: 230 } })).setOrigin(0.5));
    }
    fiches.slice(this.pageListe * FICHES_PAR_PAGE, (this.pageListe + 1) * FICHES_PAR_PAGE).forEach((f, i) => {
      const y = 106 + i * 38;
      const fond = this.add.rectangle(161, y, 252, 32, 0xffffff, 0).setInteractive({ useHandCursor: true });
      fond.on('pointerover', () => fond.setFillStyle(0xd8c498, 1));
      fond.on('pointerout', () => fond.setFillStyle(0xffffff, 0));
      fond.on('pointerdown', () => this.afficherFiche(f));
      c.add([fond, imageCorps(this, 48, y + 14, f.race === 'faucheuse' ? 'faucheuse' : { nom: f.nom, race: f.race, niveau: (this.G.personnes[f.nom] || {}).niveau }, 1.8),
        this.add.text(66, y - 13, f.nom, style(13, couleurNom(this.G, f.nom), { fontStyle: 'bold' })),
        this.add.text(66, y + 3, raccourcir(f.ligne, 34), style(10, '#5a3a20'))]);
    });
    if (pages > 1) {
      const nav = (x, texte, sens) => {
        const t = this.add.text(x, 452, texte, style(14, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5).setInteractive({ useHandCursor: true });
        t.on('pointerdown', () => { this.pageListe = (this.pageListe + sens + pages) % pages; this.afficherListe(); });
        c.add(t);
      };
      nav(60, '◀', -1);
      nav(262, '▶', 1);
      c.add(this.add.text(161, 452, `page ${this.pageListe + 1} / ${pages}`, style(11, '#6b4a2a')).setOrigin(0.5));
    }
    c.add(this.add.text(423, 250, fiches.length ? 'Clique sur un nom\npour ouvrir sa fiche.' : '', style(14, '#8a6a4a', { fontStyle: 'italic', align: 'center' })).setOrigin(0.5));
    // (v0.93, planche 19) la feuille du jour : ranger la file
    if (this.onglet === 'aujourdhui' && this.G.file.some(e => e.type === 'client')) {
      const b = creerBouton(this, 423, 330, 220, '☰ Ranger la file', () => this.ouvrirFeuille());
      b.label.setFontSize(15);
      c.add([b.fond, b.label]);
    }
    this.ficheDroite = null;
  }

  // --- Une fiche (page de droite) ---

  afficherFiche(f) {
    const G = this.G;
    if (this.ficheDroite) this.ficheDroite.destroy();
    const c = this.ficheDroite = this.add.container(0, 0);
    this.pages.add(c);
    c.add(this.add.rectangle(423, 262, 258, 404, 0xead9b0));
    c.add(imageCorps(this, 335, 140, f.race === 'faucheuse' ? 'faucheuse' : { nom: f.nom, race: f.race, niveau: (this.G.personnes[f.nom] || {}).niveau }, 4));
    c.add(this.add.text(370, 80, f.nom, style(15, couleurNom(G, f.nom), { fontStyle: 'bold', wordWrap: { width: 175 } })));
    c.add(this.add.text(370, 120, NOMS_RACES[f.race] || '', style(12, '#5a3a20', { fontStyle: 'italic' })));

    const lignes = [];
    if (f.nom in G.relations) {
      const n = niveauRelation(G, f.nom);
      const pts = G.relations[f.nom];
      const suivant = NIVEAUX_RELATION[n.index + 1];
      lignes.push(`Relation : ${n.nom} (${pts} pts)`);
      if (suivant) lignes.push(`Prochain palier : ${suivant.nom} à ${suivant.min} pts`);
    } else {
      lignes.push('Relation : Inconnu');
    }
    // Son niveau, ses succès et sa chance.
    const fiche = G.personnes[f.nom];
    if (fiche || f.nom in G.relations) {
      const succes = succesDe(G, f.nom);
      const habitueNiv = (G.habitues.find(h => h.nom === f.nom) || {}).niveau;
      if (habitueNiv) lignes.push(`Rang : ${nomRang(habitueNiv)} (${EXPLICATION_RANGS[habitueNiv]}) · ${succes} mission${succes > 1 ? 's' : ''} réussie${succes > 1 ? 's' : ''}`);
      lignes.push(`Chance (trèfle) : ${trefleDe(G, f.nom)} / ${TREFLE_MAX}`);
      const gouts = fiche && fiche.gouts ? Object.entries(fiche.gouts) : [];
      const aime = gouts.filter(([, g]) => g === 'aime').map(([id]) => CADEAUX[id].nom.toLowerCase());
      const deteste = gouts.filter(([, g]) => g === 'deteste').map(([id]) => CADEAUX[id].nom.toLowerCase());
      if (aime.length) lignes.push(`Aime : ${aime.join(', ')}`);
      if (deteste.length) lignes.push(`Déteste : ${deteste.join(', ')}`);
    }
    const missions = G.historique.filter(h => h.nom === f.nom);
    if (missions.length) {
      const vivants = missions.filter(h => h.issue === 'vivant');
      lignes.push('', `Missions terminées : ${missions.length} (${vivants.length} réussie${vivants.length > 1 ? 's' : ''})`,
        `Butin rapporté : ${vivants.reduce((s, h) => s + h.gain, 0)} pièces`);
    }
    const habitue = G.habitues.find(h => h.nom === f.nom);
    if (habitue) {
      const objets = Object.entries(habitue.inventaire).map(([id, e]) => `${ITEMS[id].nom} ${e}/${USURE_MAX}`);
      if (objets.length) lignes.push(`Son matériel : ${objets.join(', ')}`);
      if (habitue.blessures) lignes.push(`Blessures non soignées : ${habitue.blessures}`);
    }
    const detail = f.detail();
    if (detail.length) lignes.push('', ...detail);
    c.add(this.add.text(304, 160, lignes.join('\n'), style(12, '#3b2410', { lineSpacing: 5, wordWrap: { width: 238 } })));
  }

  // --- L'ardoise du chiffre d'affaires ---

  // (v1.42, planche 68) le bénéfice du jour en grand ; le tableau complet (recettes, dépenses) sur un clic
  creerArdoise() {
    const G = this.G;
    this.add.image(578, 18, panneauHD(this, 364, 262, 'ardoise')).setOrigin(0).setScale(2);
    const craie = (x, y, texte, taille = 13, couleur = '#e8ecdf', origine = 0) =>
      this.add.text(x, y, texte, style(taille, couleur, { fontStyle: 'italic' })).setOrigin(origine, 0.5);
    craie(760, 48, "Chiffre d'affaires", 18, '#f3f0d8', 0.5);
    const d = debutsDePeriodes(G), signe = v => (v > 0 ? '+' : '') + v;
    const jour = bilanPeriode(G, G.jour, G.jour).benefice;
    craie(760, 92, 'Ton bénéfice aujourd’hui', 13, '#c9d4dc', 0.5);
    this.add.text(760, 132, signe(jour) + ' p.', style(34, jour >= 0 ? '#b8e0a0' : '#f0a8a0', { fontStyle: 'bold' })).setOrigin(0.5);
    this.add.graphics().lineStyle(1, 0x8a9a88).lineBetween(598, 160, 922, 160);
    const [sem, mois, an] = [d.semaine, d.mois, d.an].map(debut => bilanPeriode(G, debut, G.jour).benefice);
    craie(760, 178, `cette semaine ${signe(sem)} · ce mois ${signe(mois)} · cette année ${signe(an)}`, 12, '#c9d4dc', 0.5);
    const lien = this.add.text(760, 226, 'Recettes et dépenses ▸', style(13, '#f3d98a', { fontStyle: 'bold' })).setOrigin(0.5).setInteractive({ useHandCursor: true });
    lien.on('pointerover', () => lien.setColor('#fff4c0'));
    lien.on('pointerout', () => lien.setColor('#f3d98a'));
    lien.on('pointerdown', () => { Son.jouer('page'); this.detailComptes(); });
  }

  // le tableau complet : recettes, dépenses, bénéfice sur quatre périodes (un clic pour refermer)
  detailComptes() {
    if (this.comptes) return;
    const G = this.G, c = this.comptes = this.add.container(0, 0).setDepth(60);
    const voile = this.add.rectangle(480, 270, 960, 540, 0x000000, 0.45).setInteractive();
    c.add(voile);
    c.add(this.add.image(480, 262, panneauHD(this, 400, 270, 'ardoise')).setScale(2));
    const craie = (x, y, texte, taille = 13, couleur = '#e8ecdf', origine = 0) =>
      c.add(this.add.text(x, y, texte, style(taille, couleur, { fontStyle: 'italic' })).setOrigin(origine, 0.5));
    craie(480, 154, 'Recettes et dépenses', 18, '#f3f0d8', 0.5);
    const d = debutsDePeriodes(G);
    const periodes = [["Aujourd'hui", bilanPeriode(G, G.jour, G.jour)], ['Semaine', bilanPeriode(G, d.semaine, G.jour)],
      ['Mois', bilanPeriode(G, d.mois, G.jour)], ['Année', bilanPeriode(G, d.an, G.jour)]];
    periodes.forEach(([nom], i) => craie(420 + i * 72, 190, nom, 11, '#c8d4c0', 0.5));
    [['Recettes', 'recettes', '#b8e0a0'], ['Dépenses', 'depenses', '#f0a8a0'], ['Bénéfice', 'benefice', '#f3f0d8']].forEach(([nom, cle, couleur], r) => {
      const y = 222 + r * 32;
      craie(298, y, nom, 13, couleur);
      periodes.forEach(([, b], i) => {
        const v = b[cle];
        craie(420 + i * 72, y, (cle === 'benefice' && v > 0 ? '+' : '') + v, 14, cle === 'benefice' ? (v >= 0 ? '#b8e0a0' : '#f0a8a0') : couleur, 0.5);
      });
    });
    c.add(this.add.graphics().lineStyle(1, 0x8a9a88).lineBetween(298, 270, 662, 270));
    const total = Object.values(G.comptaTotal.pret).reduce((a, b) => a + b, 0);
    craie(298, 312, `Depuis le début : ${Object.values(G.comptaTotal.r).reduce((a, b) => a + b, 0)} p. de recettes`, 11, '#c8d4c0');
    craie(298, 330, total ? `Prêts reçus (hors chiffre d'affaires) : ${total} p.` : 'Les prêts ne comptent pas comme des recettes.', 11, '#c8d4c0');
    craie(480, 366, 'un clic pour refermer', 11, '#a8b4a0', 0.5);
    voile.on('pointerdown', () => { c.destroy(); this.comptes = null; });
  }

  // --- Les tiroirs ---

  // (v1.42, planche 68) en tuiles, chacune son picto, rangées par famille de couleur :
  // or = la boutique, bleu = toi, violet = l'étrange, vert = les chiffres
  creerTiroirs() {
    const OR = 0xd8a838, BLEU = 0x6a9ac9, VIOLET = 0x9a6ac9, VERT = 0x6a9a4a;
    const PICTOS = { ameliorations: ['balai', OR], forge: ['epees', OR], competences: ['idee', BLEU], reputation: ['etoile', BLEU], camps: ['soleil', BLEU],
      etrange: ['lune', VIOLET], carnet: ['lettre', VIOLET], formes: ['son', VIOLET], aventuriers: ['crane', VERT], commerce: ['pieceFace', VERT] };
    const ORDRE = ['ameliorations', 'forge', 'competences', 'reputation', 'camps', 'etrange', 'carnet', 'formes', 'aventuriers', 'commerce'];
    // (v0.82) un tiroir de plus, vers la forge, une fois qu'elle est proposée
    let tiroirs = forgeProposee(this.G) ? [...TIROIRS, ['forge', 'La forge']] : TIROIRS;
    // (v1.24) le carnet de JeuneGoy, dès sa première pensée de départ
    if (this.G.envie && this.G.envie.pensees && this.G.envie.pensees.length) tiroirs = [...tiroirs, ['carnet', 'Le carnet de JeuneGoy']];
    // (v1.37) le carnet des formes de fumée, dès que ton chat a parlé
    if (typeof moulinFait === 'function' && moulinFait(this.G)) tiroirs = [...tiroirs, ['formes', 'Le carnet des formes']];
    tiroirs = tiroirs.slice().sort((a, b) => ORDRE.indexOf(a[0]) - ORDRE.indexOf(b[0]));
    creerGlyphesHD(this); if (typeof creerPiecesHD === 'function') creerPiecesHD(this);
    const rangs = Math.ceil(tiroirs.length / 2), h = rangs > 4 ? 36 : 44, pas = h + 4;
    tiroirs.forEach(([cle, nom], i) => {
      const [picto, coul] = PICTOS[cle] || ['etoile', OR];
      const x = 594 + (i % 2) * 176, y = 288 + Math.floor(i / 2) * pas;
      const g = this.add.graphics();
      const dessiner = survol => g.clear().fillStyle(survol ? 0x3e2818 : 0x2a1a10, 0.94).fillRoundedRect(x, y, 168, h, 7)
        .fillStyle(coul).fillRoundedRect(x, y, 7, h, { tl: 7, bl: 7, tr: 0, br: 0 }).lineStyle(2, coul, survol ? 1 : 0.8).strokeRoundedRect(x, y, 168, h, 7);
      dessiner(false);
      this.add.image(x + 24, y + h / 2, picto === 'pieceFace' ? 'pieceFace' : 'glyphe_' + picto).setScale(picto === 'pieceFace' ? 1.6 : 1.9);
      this.add.text(x + 42, y + h / 2, nom, style(13, '#fff4dc', { fontStyle: 'bold', wordWrap: { width: 120 } })).setOrigin(0, 0.5);
      const zone = this.add.rectangle(x + 84, y + h / 2, 168, h, 0xffffff, 0).setInteractive({ useHandCursor: true });
      zone.on('pointerover', () => dessiner(true));
      zone.on('pointerout', () => dessiner(false));
      zone.on('pointerdown', () => this.ouvrirTiroir(cle, nom));
    });
  }

  ouvrirTiroir(cle, nom = (TIROIRS.find(t => t[0] === cle) || [])[1]) {
    const G = this.G;
    if (cle === 'formes') return ouvrirCarnetFormes(this);
    if (cle === 'forge') { this.scene.pause(); this.scene.launch('Forge', { appelant: 'Bureau' }); return; }
    this.onglet = null;
    const c = this.vider();
    if (cle === 'ameliorations') return this.afficherAmeliorations(c);
    if (cle === 'camps') return this.afficherCamps(c);
    c.add(this.add.text(161, 72, nom, style(16, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
    const top = (obj, n, format) => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n).map(format);
    // Chaque page est faite de blocs encadrés, un sujet par bloc (audit / demande du joueur : « des
    // catégories bien encadrées, qu'on distingue ce qui va avec quoi »)
    let gauche = [], droite = [];
    if (cle === 'competences') {
      const flair = niveauFlair(G);
      const prochainArtisanat = (niveauArtisanat(G) + 1) * 4;
      gauche = [
        { titre: 'Toi', lignes: [`${nomJoueur(G)}, ${ageJoueur(G)} ans`,
          // (v0.93) la bénédiction de la nymphe, et sa fiole
          benieJusqua(G) ? `Bénie de la nymphe jusqu'au jour ${benieJusqua(G)} (+${Math.round(NYMPHE.benediction.bonus * 100)} % rivières, marais, gourdes)` : '',
          G.nymphe && G.nymphe.fiole ? 'La fiole de la nymphe : une potion de plus chaque semaine' : ''] },
        { titre: `Flair : ${Math.round(flair * 100)} %`, lignes: [flair < 1 ? `Tes estimations peuvent se tromper de ±${Math.round(35 * (1 - flair))} %.` : 'Tes estimations sont exactes.', flair < 1 ? `Il monte en servant des clients (${G.experience} / ${EXPERIENCE_MAX}).` : ''] },
        { titre: `Artisanat : niveau ${niveauArtisanat(G)}`, lignes: [`Réparations faites : ${G.reparations} (niveau suivant à ${prochainArtisanat})`, `Matériaux par réparation : ${materiauxRequis(G)}`, `${niveauArtisanat(G)} jour(s) de moins à l'atelier`] },
        // (v0.93) la persuasion
        (() => { const n = niveauPersuasion(G), suivant = PERSUASION.paliers[n + 1];
          return { titre: `Persuasion : niveau ${n}`, lignes: [`Marchandages réussis : ${G.persuasion || 0}${suivant != null ? ` (niveau suivant à ${suivant})` : ''}`,
            n ? `+${n} de patience aux clients · ils partent moins fâchés` : 'Elle monte quand tu obtiens plus que ce qu\'on te proposait.',
            n ? `Parfois, un client lâche 5 % au-delà de sa limite (${Math.round(PERSUASION.auDela[n] * 100)} %)` : ''] }; })(),
      ];
      droite = [
        { titre: 'Marchandage', lignes: Object.entries(MARCHANDS).map(([m, d]) => `${d.nom} : ${niveauRelation(G, d.nom).nom}${remiseMarchand(G, m) ? ` (−${Math.round(remiseMarchand(G, m) * 100)} %)` : ''}`) },
        { titre: "Main-d'œuvre", lignes: [`${ouvriers(G).map(nomOuvrier).join(', ')}`, `${pluriel(ouvriers(G).length, "réparation", "réparations")} à la fois`, salaires(G) ? `Salaires : ${salaires(G)} p. par nuit` : 'Aucun employé',
          // (v0.60) le bilan de chacun : ce qu'il coûte, ce qu'il a fait gagner en valeur à l'atelier
          ...G.employes.map(id => { const b = bilanEmploye(G, id); return `${EMPLOYES[id].nom} : ${b.reparations} réparation${b.reparations > 1 ? 's' : ''}, +${b.valeur} p. de valeur pour ${b.cout} p. de salaire` + (b.cout >= 20 ? (b.solde >= 0 ? ' ✓' : ' (donne-lui du travail !)') : ''); })] },
      ];
    } else if (cle === 'carnet') {
      // (v1.24, planche 50 v3) le carnet de JeuneGoy : chaque pensée de départ, datée (les dix dernières)
      const notes = ((G.envie || {}).pensees || []).slice(-10);
      const blocs = notes.map(n => ({ titre: `Jour ${n.jour} · ${n.age} ans`, lignes: [n.texte.replace(/^« | »$/g, '')] }));
      gauche = blocs.slice(0, 5); droite = blocs.slice(5);
      if (!droite.length) droite = [{ titre: 'Le chemin parcouru', lignes: ['15 ans : rêver → 18 ans : voir → les secrets : savoir'] }];
    } else if (cle === 'etrange') {
      // (v0.60) le carnet des choses étranges : les indices glissés dans les récits
      // (les huit dernières : la page n'en tient pas plus)
      const notes = (G.etrangetes || []).slice(-8);
      const blocs = notes.length ? notes.map(n => ({ titre: `Jour ${n.jour} · ${n.nom}`, lignes: [`« ${n.texte} »`] }))
        : [{ titre: 'Rien encore', lignes: ["Certains récits laissent des questions sans réponse. Quand un aventurier en rapportera une, tu la noteras ici."] }];
      gauche = blocs.filter((_, i) => i % 2 === 0);
      droite = blocs.filter((_, i) => i % 2 === 1);
    } else if (cle === 'aventuriers') {
      const h = G.historique;
      const vivants = h.filter(x => x.issue === 'vivant').length;
      gauche = [
        { titre: 'Les missions', lignes: [`Réussies : ${vivants}`, `Ratées : ${h.filter(x => x.issue === 'echec').length}`, `Morts au combat : ${h.filter(x => x.issue === 'valeureux').length}`, `Morts sans gloire : ${h.filter(x => x.issue === 'sans gloire').length}`, `Taux de retour : ${h.length ? Math.round(vivants / h.length * 100) : 0} %`] },
        { titre: 'Les clients', lignes: [`Servis : ${G.stats.servis ?? G.experience}`, `Refusés : ${G.stats.refus}`, `Lettres acceptées : ${G.stats.lettresAcceptees} · refusées : ${G.stats.lettresRefusees}`] },
      ];
      const gains = {};
      h.forEach(x => { if (x.issue === 'vivant') gains[x.nom] = (gains[x.nom] || 0) + x.gain; });
      droite = [
        { titre: 'Meilleurs clients', lignes: top(gains, 5, ([n, v]) => `${n} : ${v} p.`) },
        { titre: 'Objets les plus donnés', lignes: top(G.stats.objets, 5, ([id, v]) => `${ITEMS[id].nom} : ${v}`) },
      ];
    } else if (cle === 'commerce') {
      gauche = [{ titre: 'Recettes (depuis le début)', lignes: top(G.comptaTotal.r, 10, ([p, v]) => `${POSTES[p] || p} : ${v} p.`) }];
      droite = [
        { titre: 'Dépenses (depuis le début)', lignes: top(G.comptaTotal.d, 10, ([p, v]) => `${POSTES[p] || p} : ${v} p.`) },
        { titre: 'Trouvailles', lignes: [`Vendues aux enchères : ${G.stats.ventes}`, `À l'atelier : ${G.tresors.length}`] },
      ];
    } else {
      const parNiveau = {};
      Object.keys(G.relations).forEach(n => { const k = niveauRelation(G, n).nom; parNiveau[k] = (parNiveau[k] || 0) + 1; });
      const F = G.faucheuse;
      const m = F.mission;
      gauche = [
        { titre: `Réputation : ${arrondi(G.reputation)}`, lignes: [`Retours réussis : ${[1, 2, 3, 4, 5].map(d => `${d}★ ${(G.succes || {})[d] || 0}`).join(' · ')}`] },
        { titre: NOMS_ARMURE[coteArmure(G)], lignes: [`${(G.armure || []).length} / ${ARMURE.length} pièces` + (G.camp ? ` · camp scellé : ${G.camp === 'mal' ? "l'ombre" : 'la lumière'}` : ''), `Armes légendaires : ${(G.armesLegendaires || []).length} / ${Object.keys(ARMES_LEGENDAIRES).length}`] },
        { titre: `La Faucheuse : ${seductionFaucheuse(G).nom}`, lignes: [`Âmes offertes : ${arrondi(G.mal)}` + (G.mal >= SEUIL_SABOTAGE ? ' · sabotages possibles' : '') + (G.mal >= SEUIL_MAIN_NOIRE ? ' · la Main Noire te connaît' : ''), `${F.morts} âme${F.morts > 1 ? 's' : ''} emportée${F.morts > 1 ? 's' : ''}` + (F.sabotages ? ` · ${F.sabotages} sabotage${F.sabotages > 1 ? 's' : ''}` : ''), ...(m && m.etat !== 'proposee' ? [`Mission de mort : ${m.cible.nom} (${PIEGES[m.piege].nom.toLowerCase()}, ${m.prime} p.)`] : [])] },
        { titre: 'Le mendiant', lignes: [`Donné : ${G.mendiant} p.`] },
      ];
      droite = [
        { titre: 'Tes relations', lignes: NIVEAUX_RELATION.slice().reverse().map(n => `${n.nom} : ${parNiveau[n.nom] || 0}`) },
        { titre: 'Décorations du comptoir', lignes: G.decorations.length ? G.decorations.map(id => `• ${DECORATIONS[id].nom}`) : ["aucune pour l'instant"] },
        // (v1.23) les collections de la vitrine, et les titres des séries complètes
        ...(typeof COLLECTIONS !== 'undefined' ? [{ titre: 'La vitrine des collections', lignes: [
          ...titresCollections(G).map(t => `★ « ${t} »`),
          Object.keys(COLLECTIONS).map(k => `${nbPieces(G, k)}/${totalSerie(k)}`).join(' · ') + ' (trophées · armes · nymphe · Conseil · Bannis · carte)'] }] : []),
      ];
    }
    this.pageEnBlocs(c, 42, 96, gauche);
    this.pageEnBlocs(c, 304, 96, droite);
  }

  // Une colonne de blocs encadrés : un titre sur un bandeau, puis ses lignes. Si la colonne
  // déborde de la page, on recommence plus serré.
  pageEnBlocs(c, x, y0, blocs, largeur = 244, bas = 470) {
    for (const taille of [12, 11, 10]) {
      const objets = [];
      let y = y0;
      for (const b of blocs) {
        let lignes = (b.lignes || []).filter(l => l !== '');
        if (!lignes.length) lignes = ["rien pour l'instant"];
        const titre = this.add.text(x + 8, y + 4, b.titre, style(taille + 1, '#6a1a10', { fontStyle: 'bold', wordWrap: { width: largeur - 16 } }));
        const corps = this.add.text(x + 8, y + titre.height + 9, lignes.join('\n'), style(taille, '#3b2410', { lineSpacing: taille > 11 ? 3 : 1, wordWrap: { width: largeur - 16 } }));
        const h = titre.height + 9 + (lignes.length ? corps.height + 6 : 0);
        const cadre = this.add.graphics();
        cadre.fillStyle(0xf4e8c8, 0.55).fillRect(x, y, largeur, h);
        cadre.fillStyle(0xd8b888, 0.7).fillRect(x, y, largeur, titre.height + 7);
        cadre.lineStyle(1.5, 0x8a5a2a, 0.9).strokeRect(x, y, largeur, h);
        objets.push(cadre, titre, corps);
        y += h + 8;
      }
      if (y <= bas || taille === 10) { c.add(objets); return y; }
      for (const o of objets) o.destroy();
    }
  }

  // --- La jauge lumière ⟷ ombre (étape 9a) ---

  // (v0.90) Le livre des deux voies. Page de gauche : la balance, et le prochain palier de chaque
  // côté (pas ceux d'après). Page de droite : ce qui fait pencher la balance, et tes derniers gestes.
  afficherCamps(c) {
    const G = this.G, j = jaugeCamp(G), lo = etatLO(G), serment = sermentDe(G);
    this.time.delayedCall(300, () => conseilGarrick(this, 'jauge', true));
    creerGlyphesHD(this); creerEmblemesHD(this);
    c.add(this.add.text(161, 70, 'Le livre des deux voies', style(16, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
    c.add(this.add.text(161, 90, 'De quel côté le monde te voit', style(11, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5, 0));
    c.add(this.add.image(50, 128, 'embleme_bannis').setScale(0.5));
    c.add(this.add.image(272, 128, 'embleme_confrerie').setScale(0.5));
    c.add(barreJauge(this, 161, 132, 196, j, { h: 14 }));
    c.add(this.add.text(161, 160, nomPalierCamp(G), style(15, j > 0 ? '#9a7a10' : j < 0 ? '#5a3a8a' : '#5a3a20', { fontStyle: 'bold' })).setOrigin(0.5, 0));
    const etat = G.camp ? `ton camp est scellé : ${G.camp === 'mal' ? "l'ombre" : 'la lumière'}`
      : G.sceauNeutre ? "ni la lumière, ni l'ombre : l'armure attend quelqu'un d'autre"
        : serment ? `serment prêté ${serment === 'bien' ? 'à la Confrérie' : 'aux Bannis'}` : Math.abs(j) < PALIERS_JAUGE[0] ? 'tu es dans la zone neutre' : `tu penches ${j > 0 ? 'vers la lumière' : "vers l'ombre"}`;
    c.add(this.add.text(161, 180, `Balance : ${j > 0 ? '+' : ''}${j} · ${etat}`, style(11, '#5a3a20', { wordWrap: { width: 240 }, align: 'center' })).setOrigin(0.5, 0));
    // le prochain palier de chaque côté (la lumière en haut, l'ombre en dessous)
    const pp = prochainsPaliers(G);
    let y = 210;
    for (const camp of ['bien', 'mal']) {
      const p = pp[camp];
      const fond = this.add.rectangle(161, y + 42, 236, 88, 0xe8d6b0).setStrokeStyle(2, 0x8a6a40);
      c.add(fond);
      c.add(this.add.image(56, y + 13, 'glyphe_' + (camp === 'bien' ? 'soleil' : 'lune')).setScale(2));
      const titre = p ? `${NOMS_PALIERS_JAUGE[p.palier]} (${p.seuil > 0 ? '+' : '−'}${Math.abs(p.seuil)})` : `${NOMS_PALIERS_JAUGE[camp === 'bien' ? 3 : -3]} : atteint`;
      c.add(this.add.text(70, y + 4, titre + (p && Math.abs(p.palier) === 2 ? ' · le Carrefour' : ''), style(13, camp === 'bien' ? '#8a6a10' : '#5a3a8a', { fontStyle: 'bold' })));
      let texte = p ? OFFRES_PALIERS[p.palier] : `Tu es allé${eJ(G)} au bout de ce chemin.`;
      const o = lo.offres[camp];
      if (p && Math.abs(p.palier) === 2 && o) texte = o === 'juree' ? 'Tu as déjà prêté serment de ce côté.' : o === 'parjure' ? 'Tu as rompu ton serment : ce camp ne te le proposera plus.' : 'Tu as choisi de rester libre. Le camp refusé reviendra une dernière fois au 3e palier.';
      c.add(this.add.text(52, y + 26, texte, style(11, '#3b2410', { wordWrap: { width: 214 }, lineSpacing: 1 })));
      y += 98;
    }
    const armure = `Le sceau : ${(G.armure || []).length} / ${ARMURE.length} pièces d'armure.`;
    c.add(this.add.text(161, y + 2, mafia(G).engage && !mafia(G).sorti ? `${armure}\n${NomBande(G)} : ${nomRangMafia(rangMafia(G), G)}` : `${armure}\nLes paliers d'après ? Le livre ne les montre pas encore...`,
      style(10, '#7a5a3a', { fontStyle: 'italic', wordWrap: { width: 236 }, align: 'center' })).setOrigin(0.5, 0));
    // page de droite : le barème, du plus petit au plus gros
    c.add(this.add.text(425, 70, 'Ce qui fait pencher la balance', style(14, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
    const bareme = Object.values(BAREME_CAMP).sort((a, b) => (a.camp === b.camp ? a.n - b.n : a.camp === 'bien' ? -1 : 1));
    bareme.forEach((b, i) => {
      const yy = 88 + i * 17;
      c.add(this.add.image(316, yy + 7, 'glyphe_' + (b.camp === 'bien' ? 'soleil' : 'lune')).setScale(1.2));
      c.add(this.add.text(328, yy, `+${b.n}`, style(11, b.camp === 'bien' ? '#8a6a10' : '#5a3a8a', { fontStyle: 'bold' })));
      c.add(this.add.text(350, yy + 1, b.texte, style(10, '#3b2410')));
    });
    const yj = 88 + bareme.length * 17 + 6;
    c.add(this.add.rectangle(425, yj, 236, 2, 0x8a6a40));
    c.add(this.add.text(425, yj + 6, 'Ces derniers jours', style(13, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5, 0));
    const journal = lo.journal.slice(0, 4);
    if (!journal.length) c.add(this.add.text(425, yj + 30, "Rien encore : la balance attend tes premiers gestes.", style(11, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5, 0));
    journal.forEach((e, i) => {
      const yy = yj + 28 + i * 19, b = BAREME_CAMP[e.cle] || { camp: 'bien' };
      c.add(this.add.image(316, yy + 7, 'glyphe_' + (b.camp === 'bien' ? 'soleil' : 'lune')).setScale(1.2));
      c.add(this.add.text(328, yy, raccourcir(`Jour ${e.jour} · +${e.n} · ${texteGeste(e)}`, 40), style(11, '#3b2410')));
    });
    c.add(this.add.text(425, yj + 108, `Au sceau (${ARMURE.length}e pièce d'armure), sans serment et dans la zone neutre : une autre fin...`, style(10, '#7a5a3a', { fontStyle: 'italic', align: 'center', wordWrap: { width: 230 } })).setOrigin(0.5, 0));
  }

  // --- Les améliorations du shop ---

  // Page de gauche : les meubles et leur niveau ; page de droite : le meuble choisi, avant/après.
  afficherAmeliorations(c, choisi = this.meubleChoisi || 'reserve') {
    const G = this.G;
    this.meubleChoisi = choisi;
    c.add(this.add.text(161, 72, 'Améliorer le comptoir', style(16, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
    c.add(this.add.text(161, 94, 'Commande le soir : les ouvriers\npassent pendant la nuit.', style(11, '#6b4a2a', { fontStyle: 'italic', align: 'center' })).setOrigin(0.5, 0));
    Object.entries(AMELIORATIONS).forEach(([cle, a], i) => {
      const y = 148 + i * 50;
      const n = niveauAmelioration(G, cle);
      const fond = this.add.rectangle(161, y, 252, 46, cle === choisi ? 0xd8c498 : 0xffffff, cle === choisi ? 1 : 0).setInteractive({ useHandCursor: true });
      fond.on('pointerdown', () => { const p = this.vider(); this.afficherAmeliorations(p, cle); });
      const etoiles = n ? '★'.repeat(n) : '—';
      const prevu = (G.travaux || []).includes(cle) ? ' · travaux cette nuit' : '';
      c.add([fond,
        this.add.text(44, y - 18, a.nom, style(13, '#3b2410', { fontStyle: 'bold' })),
        this.add.text(44, y, `${a.niveaux[n]}${prevu}`, style(11, '#5a3a20', { fontStyle: 'italic' })),
        this.add.text(278, y - 16, etoiles, style(14, '#b8860b')).setOrigin(1, 0)]);
    });
    // La page de droite
    const a = AMELIORATIONS[choisi];
    const n = niveauAmelioration(G, choisi);
    const suivant = ameliorationSuivante(G, choisi);
    c.add(this.add.text(423, 72, a.nom, style(15, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
    const texteEffet = this.add.text(423, 92, a.effet, style(11, '#5a3a20', { align: 'center', wordWrap: { width: 236 } })).setOrigin(0.5, 0);
    c.add(texteEffet);
    // (v1.30) l'image du meuble ne recouvre jamais le texte de l'effet (la chambre en a un long)
    const apercu = (niveau, y) => {
      const { cle, echelle } = this.apercuMeuble(choisi, niveau);
      const im = this.add.image(423, y, cle).setScale(echelle);
      if (y < 260) im.y = Math.max(y, texteEffet.y + texteEffet.height + 6 + im.displayHeight / 2);
      c.add(im);
      const lab = this.add.text(423, Math.max(y + 46, im.y + im.displayHeight / 2 + 8), `${niveau ? '★'.repeat(niveau) + '  ' : ''}${a.niveaux[niveau]}`, style(12, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5);
      c.add(lab);
      return lab.y + lab.height / 2;
    };
    const bas = apercu(n, 196);
    if (!suivant) {
      c.add(this.add.text(423, 330, 'Le plus beau qui soit !', style(14, '#8a6a10', { fontStyle: 'bold italic' })).setOrigin(0.5));
      return;
    }
    // (v1.31) la flèche et l'aperçu suivant se placent sous le premier libellé (le texte de la chambre est long)
    const yFleche = Math.max(262, bas + 12);
    c.add(this.add.text(423, yFleche, '▼', style(16, '#8a6a4a')).setOrigin(0.5));
    apercu(suivant.niveau, yFleche + 56);
    // (v0.84) l'étagère : combien de places on gagne, par rapport à aujourd'hui
    const agr = choisi === 'reserve' ? agrandissementSuivant(G) : null;
    if (agr) c.add(this.add.text(423, 394, `${G.capacite} places → ${agr.capacite} places (+${agr.capacite - G.capacite})`, style(13, '#2a5a20', { fontStyle: 'bold' })).setOrigin(0.5));
    const prevu = (G.travaux || []).includes(choisi);
    const b = creerBouton(this, 423, 428, 230, prevu ? 'Prévu cette nuit' : `Commander · ${suivant.prix} p.`, () => {
      const erreur = commanderAmelioration(G, choisi);
      const p = this.vider();
      this.afficherAmeliorations(p, choisi);
      if (erreur) p.add(this.add.text(423, 456, erreur, style(12, '#a03030', { fontStyle: 'bold' })).setOrigin(0.5));
      else p.add(this.add.text(423, 456, choisi === 'reserve' ? 'Ta réserve est agrandie !' : 'Commandé ! Les ouvriers viendront cette nuit.', style(12, '#3a6a20', { fontStyle: 'bold' })).setOrigin(0.5));
    });
    b.label.setFontSize(15);
    if (prevu) b.setActif(false);
    // (v0.84) trop cher : le bouton reste cliquable (grisé), pour dire clairement combien il manque
    else if (!peutPayer(G, suivant.prix)) { b.fond.setTint(0x9a9a9a); b.label.setAlpha(0.6); }
    c.add([b.fond, b.label]);
  }

  // La texture d'un meuble à un niveau donné, et l'échelle pour l'aperçu (page de droite).
  apercuMeuble(cle, n) {
    switch (cle) {
      case 'reserve': return { cle: etagereHD(this, n), echelle: 0.42 };
      case 'comptoir': return { cle: plateauComptoir(this, n), echelle: 0.5 };
      case 'coffre': return { cle: coffreHD(this, n), echelle: 2.4 };
      case 'chambre': return { cle: litHD(this, n), echelle: n >= 3 ? 0.55 : 1.2 };
      case 'atelier': return { cle: iconeObjet(this, 'enclume'), echelle: 2.6 + n * 0.5 };
      default: return { cle: luminaireHD(this, n), echelle: n >= 4 ? 1.1 : n >= 2 ? 1.6 : 2.6 };
    }
  }

  // (v0.93, planche 19) La feuille du jour : qui passe d'abord. On range tout d'un coup (un rangement
  // gardé pour les jours suivants) ou chacun avec ses flèches. Les retours et les visites restent à leur
  // place ; la Faucheuse n'y figure pas (elle reste une surprise, et passe toujours en dernier).
  ouvrirFeuille(page = 0) {
    const G = this.G;
    if (this.feuille) this.feuille.destroy();
    const c = this.feuille = this.add.container(0, 0).setDepth(60);
    c.add(this.add.rectangle(480, 270, 960, 540, 0x0a0604, 0.6).setInteractive());
    c.add(this.add.image(480, 270, panneauHD(this, 900, 510)).setScale(2));
    c.add(this.add.text(480, 44, `La feuille du jour ${G.jour}`, style(22, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
    c.add(this.add.text(480, 68, "Qui passe d'abord ? Range tout d'un coup, ou déplace chacun avec ses flèches", style(12, '#6a4a2a', { fontStyle: 'italic' })).setOrigin(0.5));
    const changer = () => { if (this.comptoir && this.comptoir.reconstruireFile) this.comptoir.reconstruireFile(); Son.jouer('plume'); };
    const mode = G.ordreFile || 'arrivee';
    ORDRES_FILE.forEach(([cle, nom], i) => {
      const x = 152 + i * 164, choisi = cle === mode;
      const fond = this.add.rectangle(x, 100, 154, 30, choisi ? 0x6b4a22 : 0xe8d4a8).setStrokeStyle(2, choisi ? 0xffe066 : 0x8a6a3a).setInteractive({ useHandCursor: true });
      fond.on('pointerdown', () => { G.ordreFile = cle; rangerFile(G, cle); changer(); this.ouvrirFeuille(page); });
      c.add([fond, this.add.text(x, 100, nom, style(12, choisi ? '#fff4dc' : '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5)]);
    });
    const NOTES = { retour: 'Retour de mission', famille: 'Une famille en deuil', garde: 'La garde', gardeRecherche: 'La garde', garrick: 'Garrick', collecteur: 'Le collecteur', serpent: 'Le Serpent à deux têtes',
      colporteur: 'Le colporteur', notable: 'Un visiteur de marque', aine: 'Un aîné des Bannis', carnet: 'Un carnet rapporté', heraut: 'Le messager du Conseil', rival: 'Le voisin', crieur: 'Le crieur', detresse: 'Un pigeon : appel à l\'aide', collectionneur: 'Le collectionneur' };
    const lignes = G.file.filter(e => e.type !== 'faucheuse');
    const PAR = 8, pages = Math.max(1, Math.ceil(lignes.length / PAR));
    page = Math.min(page, pages - 1);
    const COULEURS = [0x7a9a5a, 0x4a7aa0, 0x8a5aa0, 0xc89a30, 0xc04a30];
    lignes.slice(page * PAR, page * PAR + PAR).forEach((e, k) => {
      const i = page * PAR + k, y = 140 + k * 38, client = e.type === 'client';
      c.add(this.add.rectangle(480, y, 820, 34, !client ? 0xd8c8a0 : (i % 2 ? 0xe8d4a8 : 0xf0e0b8)).setStrokeStyle(1, 0xc9a870));
      c.add(this.add.text(86, y, `${i + 1}.`, style(13, '#6a4a2a', { fontStyle: 'bold' })).setOrigin(0.5));
      const p = client ? e.voyageur : e.parti ? e.parti.voyageur : e.type === 'famille' ? e.visite.parent : CounterScene.prototype.personneDe.call({ G }, e);
      if (p) { try { c.add(this.add.image(118, y + 16, textureBusteHD(this, p)).setOrigin(0.5, 1).setScale(0.27)); } catch (err) { /* (pas de buste pour ce visiteur) */ } }
      const v = client ? e.voyageur : null;
      c.add(this.add.text(150, y - 8, (p && p.nom) || NOTES[e.type] || 'Un visiteur', style(13, '#3b2410', { fontStyle: 'bold' })).setOrigin(0, 0.5));
      const note = client ? (e.reporte ? "T'avait écrit · revient d'hier" : v.prestige ? 'Client prestigieux' : v.prevu ? `Lettre · ${v.quete}` : 'De passage') : (NOTES[e.type] || 'Une visite') + ' · reste à sa place';
      c.add(this.add.text(150, y + 8, raccourcir(note, 60), style(10, '#6a4a2a', { fontStyle: 'italic' })).setOrigin(0, 0.5));
      if (v) {
        const r = Math.max(0, ORDRE_NIVEAUX.indexOf(v.niveau));
        c.add(this.add.rectangle(600, y, 110, 22, COULEURS[r]).setStrokeStyle(1, 0x2a1a08));
        c.add(this.add.text(600, y, nomRang(v.niveau, true), style(11, '#fff4dc', { fontStyle: 'bold' })).setOrigin(0.5));
        for (const [x, sens, t] of [[790, -1, '▲'], [840, 1, '▼']]) {
          const f = this.add.text(x, y, t, style(15, '#3b2410', { fontStyle: 'bold', backgroundColor: '#e0c890', padding: { x: 7, y: 1 } })).setOrigin(0.5).setInteractive({ useHandCursor: true });
          f.on('pointerdown', () => { if (deplacerDansFile(G, e, sens)) { G.ordreFile = 'arrivee'; changer(); } this.ouvrirFeuille(page); });
          c.add(f);
        }
      } else c.add(this.add.text(815, y, 'fixe', style(12, '#6a4a2a', { fontStyle: 'italic' })).setOrigin(0.5));
    });
    if (pages > 1) {
      for (const [x, t, sens] of [[380, '◀', -1], [580, '▶', 1]]) {
        const f = this.add.text(x, 450, t, style(16, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5).setInteractive({ useHandCursor: true });
        f.on('pointerdown', () => this.ouvrirFeuille((page + sens + pages) % pages));
        c.add(f);
      }
      c.add(this.add.text(480, 450, `page ${page + 1} / ${pages}`, style(12, '#6a4a2a')).setOrigin(0.5));
    }
    c.add(this.add.text(480, 474, 'Le rangement choisi est gardé pour les jours suivants. Déplacer quelqu\'un à la main le remet sur « Comme ils viennent ».', style(11, '#6a4a2a', { fontStyle: 'italic' })).setOrigin(0.5));
    const fermer = creerBouton(this, 480, 506, 180, 'Fermer', () => { c.destroy(); this.feuille = null; this.afficherListe(); });
    c.add([fermer.fond, fermer.label]);
  }

  // (v0.93) L'atelier de l'enseigne : le nom, l'une des cinq écritures, la couleur du fond,
  // avec l'enseigne telle qu'elle pend devant ta maison (elle s'embellit quand la maison grandit)
  ouvrirEnseigne() {
    const G = this.G;
    if (this.pageEnseigne) this.pageEnseigne.destroy();
    const c = this.pageEnseigne = this.add.container(0, 0).setDepth(60);
    c.add(this.add.rectangle(480, 270, 960, 540, 0x0a0604, 0.6).setInteractive());
    c.add(this.add.image(480, 272, panneauHD(this, 760, 470)).setScale(2));
    c.add(this.add.text(480, 66, 'Ton enseigne', style(24, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
    const n = niveauFacade(G), NIVEAUX = ['la planche brute de la chaumière', 'le panneau encadré de la maison', 'le panneau peint de la belle maison', "l'enseigne de maître de la demeure"];
    c.add(this.add.text(480, 92, `Aujourd'hui : ${NIVEAUX[n]}` + (n < 3 ? ' · elle s\'embellit quand ta maison grandit (améliore le comptoir)' : ''),
      style(12, '#6a4a2a', { fontStyle: 'italic', align: 'center', wordWrap: { width: 680 } })).setOrigin(0.5, 0));
    const r = reglagesEnseigne(G);
    // l'aperçu, sur un bout de mur
    c.add(this.add.rectangle(480, 190, 420, 130, 0x6a5040).setStrokeStyle(2, 0x3b2410));
    const apercu = poserEnseigne(this, 480, 128, n, G.nomShop).setScale(1.25);
    c.add(apercu);
    this.tweens.add({ targets: apercu, angle: { from: -2, to: 2 }, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    // les cinq écritures
    c.add(this.add.text(120, 272, "L'écriture", style(15, '#3b2410', { fontStyle: 'bold' })).setOrigin(0, 0.5));
    ENSEIGNE.polices.forEach(([famille, graisse, nom], i) => {
      const x = 254 + i * 130, choisi = i === r.police;
      const fond = this.add.rectangle(x, 272, 122, 40, choisi ? 0x6b4a22 : 0xe8d4a8).setStrokeStyle(2, choisi ? 0xffe066 : 0x8a6a3a).setInteractive({ useHandCursor: true });
      const t = this.add.text(x, 272, nom, { fontFamily: `"${famille}", Georgia, serif`, fontSize: '16px', fontStyle: graisse, color: choisi ? '#fff4dc' : '#3b2410', resolution: 3 }).setOrigin(0.5);
      if (t.width > 112) t.setScale(112 / t.width);
      if (document.fonts) document.fonts.load(`16px "${famille}"`).then(() => { if (t.active) { t.updateText(); t.setScale(1); if (t.width > 112) t.setScale(112 / t.width); } }).catch(() => {});
      fond.on('pointerdown', () => { G.enseigne = { ...reglagesEnseigne(G), police: i }; Son.jouer('plume'); this.ouvrirEnseigne(); });
      c.add([fond, t]);
    });
    // la couleur du fond
    c.add(this.add.text(120, 336, 'Le fond', style(15, '#3b2410', { fontStyle: 'bold' })).setOrigin(0, 0.5));
    ENSEIGNE.couleurs.forEach((coul, i) => {
      const x = 240 + i * 94, choisi = coul.cle === r.couleur;
      const teinte = coul.c ? coul.c[1] : null;
      const pastille = teinte != null ? this.add.rectangle(x, 330, 56, 30, teinte) : this.add.image(x, 330, texEnseigne(this, n, 'naturel')).setDisplaySize(56, 30);
      const cadre = this.add.rectangle(x, 330, 60, 34).setStrokeStyle(choisi ? 4 : 2, choisi ? 0xffe066 : 0x3b2410).setInteractive({ useHandCursor: true });
      cadre.on('pointerdown', () => { G.enseigne = { ...reglagesEnseigne(G), couleur: coul.cle }; Son.jouer('plume'); this.ouvrirEnseigne(); });
      c.add([pastille, cadre, this.add.text(x, 352, coul.nom, style(11, choisi ? '#3b2410' : '#6a4a2a', { fontStyle: choisi ? 'bold' : '' })).setOrigin(0.5, 0)]);
    });
    const renommer = creerBouton(this, 360, 430, 230, '✎ Changer le nom', () => demanderTexte('Le nom de ton comptoir', G.nomShop, NOM_SHOP_MAX, nom => {
      if (!nom) return;
      G.nomShop = nom;
      this.texteEnseigne.setText(`✎ « ${nom} »`);
      this.ouvrirEnseigne();
    }));
    const fermer = creerBouton(this, 620, 430, 180, 'Fermer', () => { c.destroy(); this.pageEnseigne = null; });
    c.add([renommer.fond, renommer.label, fermer.fond, fermer.label]);
  }

  fermer() {
    this.scene.stop();
    this.scene.resume(this.retour);
  }
}
