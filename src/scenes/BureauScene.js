// Le bureau : le registre des fiches (à gauche), l'ardoise du chiffre d'affaires
// et les tiroirs à statistiques (à droite). La page s'ouvre par-dessus le comptoir
// ou le soir, qui restent en pause.
const NOMS_RACES = { humain: 'Humain', hobbit: 'Hobbit', nain: 'Nain', elfe: 'Elfe', magicienne: 'Magicienne' };
const ONGLETS = [
  ['avenir', 'À venir'], ['aujourdhui', "Aujourd'hui"], ['mission', 'En mission'],
  ['revenus', 'Revenus'], ['disparus', 'Disparus'], ['repertoire', 'Répertoire'],
];
const FICHES_PAR_PAGE = 10;
const TIROIRS = [['ameliorations', '🔨 Améliorer le shop'], ['competences', 'Tes compétences'], ['aventuriers', 'Les aventuriers'], ['commerce', 'Le commerce'], ['reputation', 'La réputation']];

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
    this.add.text(24, 500, `${dateEnTexte(G)} · semaine ${dateDuJour(G).semaine} · jour ${G.jour}`, style(14, '#f3e6c8', { fontStyle: 'italic' }));
    creerBouton(this, 850, 505, 180, 'Fermer', () => this.fermer());
    // Renommer le shop (l'enseigne de la façade)
    this.add.image(640, 505, plaqueBouton(this, 250)).setScale(2);
    const enseigne = this.add.text(640, 505, `✎ « ${G.nomShop} »`, style(13, '#f3d98a', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 3 }))
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    enseigne.on('pointerdown', () => demanderTexte('Le nom de ton shop', G.nomShop, NOM_SHOP_MAX, nom => {
      if (!nom) return;
      G.nomShop = nom;
      enseigne.setText(`✎ « ${nom} »`);
    }));

    if (!this.comptoir) this.onglet = 'mission';
    this.afficherListe();
  }

  // --- Les onglets du registre ---

  creerOnglets() {
    this.ongletsFonds = ONGLETS.map(([cle, nom], i) => {
      const x = 30 + i * 88;
      const fond = this.add.image(x + 43, 38, 'ongletHD').setScale(2).setInteractive({ useHandCursor: true });
      const texte = this.add.text(x + 43, 38, nom, style(12, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5);
      fond.on('pointerdown', () => { this.onglet = cle; this.pageListe = 0; this.afficherListe(); });
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
            `Quête : ${a.voyageur.quete}`, `Durée : ${a.voyageur.duree} jour(s) · butin espéré ~${a.voyageur.butin} p.`,
            `Commande : ${commandeEnTexte(a.voyageur)}`],
        }));
      case 'aujourdhui': {
        const entrees = [...(this.comptoir && this.comptoir.entree ? [this.comptoir.entree] : []), ...G.file];
        return entrees.map(e => {
          if (e.type === 'client') {
            const v = e.voyageur;
            return { nom: v.nom, race: v.race, ligne: (e === (this.comptoir && this.comptoir.entree) ? 'Au comptoir · ' : 'Dans la file · ') + v.quete,
              detail: () => [`Quête : ${v.quete}`, `Commande : ${commandeEnTexte(v)}`, `Durée : ${v.duree} jour(s) · butin espéré ~${v.butin} p.`] };
          }
          if (e.type === 'famille') {
            const p = e.visite.parent;
            return { nom: p.nom, race: p.race, ligne: `Visite : ${p.lien} de ${e.visite.defunt.nom}`, detail: () => [`Vient au sujet de ${e.visite.defunt.nom}.`] };
          }
          if (e.type === 'faucheuse') {
            return { nom: '???', race: 'faucheuse', ligne: 'Une silhouette noire, tout au bout de la file...',
              detail: () => ['Elle ne dit rien. Elle attend son tour.'] };
          }
          const v = e.parti.voyageur;
          return { nom: v.nom, race: v.race,
            ligne: e.type === 'retour' ? 'Revient de mission !' : 'Son carnet est posé sur ton comptoir...',
            detail: () => [`Parti le jour ${e.parti.depart} : ${v.quete}`] };
        });
      }
      case 'mission':
        return enMission(G).map(p => ({
          nom: p.voyageur.nom, race: p.voyageur.race,
          ligne: `Retour jour ${p.retour} · préparé à ${pctAffiche(p.chance)}`,
          detail: () => [`Quête : ${p.voyageur.quete}`, `Parti le jour ${p.depart}, retour prévu le jour ${p.retour}`,
            `Préparé à ${pctAffiche(p.chance)} · butin espéré ~${p.voyageur.butin} p.`,
            `Colis : ${Object.entries(p.colis).filter(([, n]) => n).map(([id, n]) => `${n} ${ITEMS[id].nom}`).join(', ') || 'rien'}`],
        }));
      case 'revenus':
      case 'disparus':
        return G.historique.filter(h => (this.onglet === 'revenus') === ['vivant', 'echec'].includes(h.issue)).map(h => ({
          nom: h.nom, race: h.race,
          ligne: h.issue === 'echec' ? `Jour ${h.retour} · mission ratée · ${h.quete}` : h.issue === 'vivant' ? `Jour ${h.retour} · +${h.gain} p. · ${h.quete}` : `Jour ${h.retour} · mort ${h.issue === 'valeureux' ? 'au combat' : 'sans gloire'}${h.voulu ? ' · ☠ offert' : ''}`,
          detail: () => [`Quête : ${h.quete} (jours ${h.depart} à ${h.retour})`,
            h.issue === 'echec' ? 'Revenu vivant, mais sans rien : mission ratée.' : h.issue === 'vivant' ? `Revenu vivant, a rapporté ${h.gain} pièces.` : `Mort ${h.issue === 'valeureux' ? 'valeureusement au combat' : 'sans gloire'}.`,
            ...(h.voulu ? [`☠ Offert à la Faucheuse : ${MORTS_VOULUES[h.voulu].texte}.`] : [])],
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
      const y = 104 + i * 34;
      const fond = this.add.rectangle(161, y, 252, 32, 0xffffff, 0).setInteractive({ useHandCursor: true });
      fond.on('pointerover', () => fond.setFillStyle(0xd8c498, 1));
      fond.on('pointerout', () => fond.setFillStyle(0xffffff, 0));
      fond.on('pointerdown', () => this.afficherFiche(f));
      c.add([fond, this.add.image(48, y + 14, 'perso_' + f.race).setOrigin(0.5, 1).setScale(1.8),
        this.add.text(66, y - 13, f.nom, style(13, couleurNom(this.G, f.nom), { fontStyle: 'bold' })),
        this.add.text(66, y + 3, f.ligne, style(10, '#5a3a20', { wordWrap: { width: 220 } }))]);
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
    this.ficheDroite = null;
  }

  // --- Une fiche (page de droite) ---

  afficherFiche(f) {
    const G = this.G;
    if (this.ficheDroite) this.ficheDroite.destroy();
    const c = this.ficheDroite = this.add.container(0, 0);
    this.pages.add(c);
    c.add(this.add.rectangle(423, 262, 258, 404, 0xead9b0));
    c.add(this.add.image(335, 140, 'perso_' + f.race).setOrigin(0.5, 1).setScale(4));
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
      if (habitueNiv) lignes.push(`Niveau : ${NIVEAUX_AVENTURIER[habitueNiv].nom} · ${succes} mission${succes > 1 ? 's' : ''} réussie${succes > 1 ? 's' : ''}`);
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

  creerArdoise() {
    const G = this.G;
    this.add.image(578, 18, panneauHD(this, 364, 262, 'ardoise')).setOrigin(0).setScale(2);
    const g = this.add.graphics();
    const craie = (x, y, texte, taille = 13, couleur = '#e8ecdf', origine = 0) =>
      this.add.text(x, y, texte, style(taille, couleur, { fontFamily: '"Comic Sans MS", "Segoe Print", cursive' })).setOrigin(origine, 0.5);
    craie(760, 48, "Chiffre d'affaires", 18, '#f3f0d8', 0.5);
    const d = debutsDePeriodes(G);
    const periodes = [
      ["Aujourd'hui", bilanPeriode(G, G.jour, G.jour)],
      ['Semaine', bilanPeriode(G, d.semaine, G.jour)],
      ['Mois', bilanPeriode(G, d.mois, G.jour)],
      ['Année', bilanPeriode(G, d.an, G.jour)],
    ];
    periodes.forEach(([nom], i) => craie(700 + i * 66, 84, nom, 11, '#c8d4c0', 0.5));
    [['Recettes', 'recettes', '#b8e0a0'], ['Dépenses', 'depenses', '#f0a8a0'], ['Bénéfice', 'benefice', '#f3f0d8']].forEach(([nom, cle, couleur], r) => {
      const y = 118 + r * 34;
      craie(598, y, nom, 13, couleur);
      periodes.forEach(([, b], i) => {
        const v = b[cle];
        craie(700 + i * 66, y, (cle === 'benefice' && v > 0 ? '+' : '') + v, 14, cle === 'benefice' ? (v >= 0 ? '#b8e0a0' : '#f0a8a0') : couleur, 0.5);
      });
    });
    g.lineStyle(1, 0x8a9a88).lineBetween(598, 168, 922, 168);
    const total = Object.values(G.comptaTotal.pret).reduce((a, b) => a + b, 0);
    craie(598, 230, `Depuis le début : ${Object.values(G.comptaTotal.r).reduce((a, b) => a + b, 0)} p. de recettes`, 11, '#c8d4c0');
    craie(598, 250, total ? `Prêts reçus (hors chiffre d'affaires) : ${total} p.` : 'Les prêts ne comptent pas comme des recettes.', 11, '#c8d4c0');
  }

  // --- Les tiroirs ---

  creerTiroirs() {
    TIROIRS.forEach(([cle, nom], i) => {
      const y = 304 + i * 38;
      const t = this.add.image(760, y, 'tiroirHD').setScale(2).setInteractive({ useHandCursor: true });
      this.add.text(745, y, nom, style(14, '#fff4dc', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 3 })).setOrigin(0.5);
      t.on('pointerover', () => t.setTexture('tiroirHD_clair'));
      t.on('pointerout', () => t.setTexture('tiroirHD'));
      t.on('pointerdown', () => this.ouvrirTiroir(cle, nom));
    });
  }

  ouvrirTiroir(cle, nom) {
    const G = this.G;
    this.onglet = null;
    const c = this.vider();
    if (cle === 'ameliorations') return this.afficherAmeliorations(c);
    c.add(this.add.text(161, 72, nom, style(16, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
    const top = (obj, n, format) => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n).map(format);
    let gauche = [], droite = [];
    if (cle === 'competences') {
      const flair = niveauFlair(G);
      const prochainArtisanat = (niveauArtisanat(G) + 1) * 4;
      gauche = [`${nomJoueur(G)}, ${ageJoueur(G)} ans`, '',
        `Flair : ${Math.round(flair * 100)} %`,
        flair < 1 ? `Tes estimations peuvent se tromper de ±${Math.round(35 * (1 - flair))} %.` : 'Tes estimations sont exactes.',
        flair < 1 ? `Progresse en servant des clients (${G.experience} / 40).` : '', '',
        `Artisanat : niveau ${niveauArtisanat(G)}`,
        `Réparations faites : ${G.reparations} (prochain niveau à ${prochainArtisanat})`,
        `Matériaux par réparation : ${materiauxRequis(G)}`,
        `Réparations à l'atelier : ${niveauArtisanat(G)} jour(s) de moins`];
      droite = ['Marchandage', ...Object.entries(MARCHANDS).map(([m, d]) =>
        `${d.nom} : ${niveauRelation(G, d.nom).nom}${remiseMarchand(G, m) ? ` (−${Math.round(remiseMarchand(G, m) * 100)} %)` : ''}`), '',
        "Main-d'œuvre", `${ouvriers(G).map(nomOuvrier).join(', ')}`,
        `${ouvriers(G).length} réparation(s) à la fois`, salaires(G) ? `Salaires : ${salaires(G)} p. par nuit` : 'Aucun employé'];
    } else if (cle === 'aventuriers') {
      const h = G.historique;
      const vivants = h.filter(x => x.issue === 'vivant').length;
      gauche = [`Clients servis : ${G.experience}`, `Missions réussies : ${vivants}`, `Missions ratées : ${h.filter(x => x.issue === 'echec').length}`,
        `Morts au combat : ${h.filter(x => x.issue === 'valeureux').length}`, `Morts sans gloire : ${h.filter(x => x.issue === 'sans gloire').length}`,
        `Taux de retour : ${h.length ? Math.round(vivants / h.length * 100) : 0} %`, '',
        `Clients refusés : ${G.stats.refus}`, `Lettres acceptées : ${G.stats.lettresAcceptees}`, `Lettres refusées : ${G.stats.lettresRefusees}`];
      const gains = {};
      h.forEach(x => { if (x.issue === 'vivant') gains[x.nom] = (gains[x.nom] || 0) + x.gain; });
      droite = ['Meilleurs clients', ...top(gains, 5, ([n, v]) => `${n} : ${v} p.`), '', 'Objets les plus donnés',
        ...top(G.stats.objets, 5, ([id, v]) => `${ITEMS[id].nom} : ${v}`)];
    } else if (cle === 'commerce') {
      gauche = ['Recettes depuis le début', ...top(G.comptaTotal.r, 10, ([p, v]) => `${POSTES[p] || p} : ${v} p.`)];
      droite = ['Dépenses depuis le début', ...top(G.comptaTotal.d, 10, ([p, v]) => `${POSTES[p] || p} : ${v} p.`), '',
        `Objets vendus aux enchères : ${G.stats.ventes}`, `Objets à l'atelier : ${G.tresors.length}`];
    } else {
      const parNiveau = {};
      Object.keys(G.relations).forEach(n => { const k = niveauRelation(G, n).nom; parNiveau[k] = (parNiveau[k] || 0) + 1; });
      const F = G.faucheuse;
      const m = F.mission;
      gauche = [`Réputation (bien) : ${arrondi(G.reputation)}`, `Jauge du mal : ${arrondi(G.mal)}` +
        (G.mal >= SEUIL_SABOTAGE ? ' · sabotages' : '') + (G.mal >= SEUIL_MAIN_NOIRE ? ' · Main Noire' : ''),
        `Retours réussis : ${[1, 2, 3, 4, 5].map(d => `${d}★ ${(G.succes || {})[d] || 0}`).join(' · ')}`,
        `${NOMS_ARMURE[coteArmure(G)]} : ${(G.armure || []).length} / ${ARMURE.length} pièces` + (G.camp ? ` · camp scellé : ${G.camp === 'mal' ? "l'ombre" : 'la lumière'}` : ''),
        `La Faucheuse : ${seductionFaucheuse(G).nom} · ${F.morts} âme${F.morts > 1 ? 's' : ''}` + (F.sabotages ? ` · ${F.sabotages} sabotage${F.sabotages > 1 ? 's' : ''}` : ''),
        ...(m && m.etat !== 'proposee' ? [`☠ Mission : ${m.cible.nom} (${PIEGES[m.piege].nom.toLowerCase()}, ${m.prime} p.)`] : []),
        `Flair : ${Math.round(niveauFlair(G) * 100)} %`, `Artisanat : niveau ${niveauArtisanat(G)}`,
        `Donné au mendiant : ${G.mendiant} p.`, '', 'Décorations',
        ...(G.decorations.length ? G.decorations.map(id => `• ${DECORATIONS[id].nom}`) : ['aucune pour l\'instant'])];
      droite = ['Tes relations', ...NIVEAUX_RELATION.slice().reverse().map(n => `${n.nom} : ${parNiveau[n.nom] || 0}`)];
    }
    if (!gauche.length || gauche.length === 1) gauche.push('Rien pour l\'instant.');
    c.add(this.add.text(42, 96, gauche.join('\n'), style(12, '#3b2410', { lineSpacing: 6, wordWrap: { width: 240 } })));
    c.add(this.add.text(304, 96, droite.join('\n'), style(12, '#3b2410', { lineSpacing: 6, wordWrap: { width: 240 } })));
  }

  // --- Les améliorations du shop ---

  // Page de gauche : les meubles et leur niveau ; page de droite : le meuble choisi, avant/après.
  afficherAmeliorations(c, choisi = this.meubleChoisi || 'reserve') {
    const G = this.G;
    this.meubleChoisi = choisi;
    c.add(this.add.text(161, 72, 'Améliorer le shop', style(16, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
    c.add(this.add.text(161, 94, 'Commande le soir : les ouvriers\npassent pendant la nuit.', style(11, '#6b4a2a', { fontStyle: 'italic', align: 'center' })).setOrigin(0.5, 0));
    Object.entries(AMELIORATIONS).forEach(([cle, a], i) => {
      const y = 152 + i * 58;
      const n = niveauAmelioration(G, cle);
      const fond = this.add.rectangle(161, y, 252, 52, cle === choisi ? 0xd8c498 : 0xffffff, cle === choisi ? 1 : 0).setInteractive({ useHandCursor: true });
      fond.on('pointerdown', () => { const p = this.vider(); this.afficherAmeliorations(p, cle); });
      const etoiles = n ? '★'.repeat(n) : '—';
      const prevu = (G.travaux || []).includes(cle) ? ' · 🔨 cette nuit' : '';
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
    c.add(this.add.text(423, 92, a.effet, style(11, '#5a3a20', { align: 'center', wordWrap: { width: 236 } })).setOrigin(0.5, 0));
    const apercu = (niveau, y) => {
      const { cle, echelle } = this.apercuMeuble(choisi, niveau);
      c.add(this.add.image(423, y, cle).setScale(echelle));
      c.add(this.add.text(423, y + 46, `${niveau ? '★'.repeat(niveau) + '  ' : ''}${a.niveaux[niveau]}`, style(12, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
    };
    apercu(n, 196);
    if (!suivant) {
      c.add(this.add.text(423, 330, 'Le plus beau qui soit !', style(14, '#8a6a10', { fontStyle: 'bold italic' })).setOrigin(0.5));
      return;
    }
    c.add(this.add.text(423, 262, '▼', style(16, '#8a6a4a')).setOrigin(0.5));
    apercu(suivant.niveau, 318);
    const prevu = (G.travaux || []).includes(choisi);
    const b = creerBouton(this, 423, 428, 230, prevu ? 'Prévu cette nuit' : `Commander · ${suivant.prix} p.`, () => {
      const erreur = commanderAmelioration(G, choisi);
      const p = this.vider();
      this.afficherAmeliorations(p, choisi);
      if (erreur) p.add(this.add.text(423, 456, erreur, style(12, '#a03030', { fontStyle: 'bold' })).setOrigin(0.5));
      else p.add(this.add.text(423, 456, choisi === 'reserve' ? 'Ta réserve est agrandie !' : 'Commandé ! Les ouvriers viendront cette nuit.', style(12, '#3a6a20', { fontStyle: 'bold' })).setOrigin(0.5));
    });
    b.label.setFontSize(15);
    if (prevu || !peutPayer(G, suivant.prix)) b.setActif(false);
    c.add([b.fond, b.label]);
  }

  // La texture d'un meuble à un niveau donné, et l'échelle pour l'aperçu (page de droite).
  apercuMeuble(cle, n) {
    switch (cle) {
      case 'reserve': return { cle: etagereHD(this, n), echelle: 0.42 };
      case 'comptoir': return { cle: plateauComptoir(this, n), echelle: 0.5 };
      case 'coffre': return { cle: coffreHD(this, n), echelle: 2.4 };
      case 'chambre': return { cle: litHD(this, n), echelle: n === 3 ? 0.55 : 1.2 };
      default: return { cle: luminaireHD(this, n), echelle: n >= 2 ? 1.6 : 2.6 };
    }
  }

  fermer() {
    this.scene.stop();
    this.scene.resume(this.retour);
  }
}
