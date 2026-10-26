// (v1.63) Au comptoir : la mise en scène des dix-sept événements (les règles sont dans evenementsComptoir.js, les
// dessins dans evenementsComptoirHD.js). Même façon que les autres visites : la bulle, le nom sur sa plaque, deux choix
// au plus, le buste qui parle et qui change d'humeur. Rien ne bloque : une erreur dans un événement le termine, et la
// file reprend (evtSur).

const SILL_EVT = SOL_COMPTOIR + 7;
// (le rebord a sa tisane et son pot au coin droit : les objets des événements se posent à gauche, ou juste à droite du client)
const SILL_GAUCHE_EVT = FENETRE.x + 72, SILL_DROITE_EVT = FENETRE.x + FENETRE.w / 2 + 80;
// « la broche », « le pot de miel » : les cadeaux du Bazar, avec leur article
const ARTICLES_CADEAUX_EVT = { miel: 'le pot de miel', tabac: 'le tabac à pipe', broche: 'la broche ciselée', livre: 'le livre ancien', ferACheval: 'le fer à cheval', vin: 'le vin de la Comté', gateau: 'le gâteau aux mûres' };
const leCadeauEvt = id => ARTICLES_CADEAUX_EVT[id] || 'le cadeau';   // le rebord de la fenêtre, où l'on pose les objets (comme le carnet)

Object.assign(CounterScene.prototype, {
  // --- Les outils communs ---
  preparerEvenements() {
    this.evtObjets = [];   // ce que pose l'événement en cours (retiré quand il s'en va)
    this.evtDecor = [];    // ce qui reste le jour durant (les fanions, la caisse du pigeon, l'enfant sur son tonneau)
    this.enfantAssis = null;
    this.evtEnCours = null;
    this.evtMinuteries = [];
  },
  nettoyerEvenement() {
    if (!this.evtObjets) this.preparerEvenements();
    for (const o of this.evtObjets) if (o && o.active) o.destroy();
    this.evtObjets = [];
    for (const m of this.evtMinuteries) if (m && m.remove) m.remove();
    this.evtMinuteries = [];
    if (this.perso) this.perso.clearTint().setBlendMode(Phaser.BlendModes.NORMAL);
    this.evtEnCours = null;
  },
  evtGarder(o, decor = false) { (decor ? this.evtDecor : this.evtObjets).push(o); return o; },
  evtPlus(delai, f) { const m = this.time.delayedCall(delai, () => { if (this.sys.isActive()) this.evtSur(f); }); this.evtMinuteries.push(m); return m; },
  // Une erreur ne bloque jamais la file : on la note, et on passe à la suite
  evtSur(f) {
    try { return f(); } catch (e) {
      console.error('événement du comptoir', e);
      if (typeof noterJournal === 'function') noterJournal(`erreur événement : ${e.message}`);
      this.bouton('...', null); this.actionB = null; this.majBoutonsService();
      this.time.delayedCall(300, () => { if (this.buste) this.partirPar(FENETRE.x - 80); else this.voyageurSuivant(); });
    }
  },
  evtParchemin(titre, sous = '') {
    this.titreCommande.setFontSize(17).setText(titre);
    for (let taille = 16; this.titreCommande.width > 235 && taille >= 12; taille--) this.titreCommande.setFontSize(taille);
    this.sousTitre.setText(sous); this.texteSac.setText(''); this.texteChance.setText('');
    this.aideCommande.setVisible(false); this.boutonEscorte.setVisible(false);
  },
  // Parle sous son nom (la plaque) ; la bouche du buste bouge s'il est au comptoir
  evtDire(texte, cle) {
    const nom = NOMS_EVT[cle] || cle || '', qui = this.buste ? this.buste.personne.nom : null;
    this.dire(texte, nom, qui && nom.startsWith(qui) ? qui : (this.buste && cle && NOMS_EVT[cle] ? this.buste.personne.nom : null));
  },
  evtFin(x = FENETRE.x - 80) { this.bouton('...', null); this.actionB = null; this.majBoutonsService(); this.partirPar(x); },
  // Un objet posé sur le rebord de la fenêtre, qui tombe un peu en se posant
  evtPoser(cle, x, { echelle = 2, decor = false, profondeur = 3.2 } = {}) {
    creerObjetsEvtHD(this);
    const o = this.add.image(x, SILL_EVT - 8, cle).setOrigin(0.5, 1).setScale(echelle).setDepth(profondeur).setAlpha(0);
    this.tweens.add({ targets: o, y: SILL_EVT, alpha: 1, duration: 260, ease: 'Quad.easeIn', onComplete: () => Son.jouer('poser') });
    return this.evtGarder(o, decor);
  },
  // Un personnage qui attend dans la fenêtre, derrière celui qui parle
  evtCompagnon(quoi, x, { regarde = 1, decor = false } = {}) {
    const cle = corpsHD(this, quoi), f = echelleCorps(cle);
    const s = this.add.image(x, FILE.y, cle).setOrigin(0.5, 1).setScale(FILE.echelle * f * 1.12).setDepth(1.55).setFlipX(regarde < 0);
    s.setMask(this.masqueFenetre);
    this.time.delayedCall(1800 + Math.random() * 1600, () => this.attendreDansLaFile(s));
    return this.evtGarder(s, decor);
  },
  // Il s'en va en marchant (il se retourne d'abord)
  evtSortir(s, x, duree = 1500) {
    if (!s || !s.active) return;
    s.setFlipX(x < s.x);
    pasDeMarche(this, s, duree);
    this.tweens.add({ targets: s, x, duration: duree, ease: 'Sine.easeIn', onComplete: () => s.destroy() });
  },
  evtPrenom(nom) { return prenomDe(nom); },

  // --- L'arrivée : un événement à part entière, ou un incident pendant la visite d'un client ---
  arriveeEvenement(entree) {
    if (entree.type === 'evenement') {
      if (!this.evtObjets) this.preparerEvenements();
      this.evtEnCours = entree;
      if (!['vent', 'pigeon', 'pigeonRetour'].includes(entree.id)) this.avancer(JOURNEE.visite);
      const f = this['evt_' + entree.id];
      this.evtSur(() => (f ? f.call(this, entree) : this.evtFin()));
      return true;
    }
    if (entree.type === 'client' && entree.incident && !entree.incident.vu && !entree.attentes) {
      entree.incident.vu = true;
      if (!this.evtObjets) this.preparerEvenements();
      const f = this['inc_' + entree.incident.id];
      if (!f) return false;
      // (le client attend son tour de parler : ni « En attente », ni « Inspecter » pendant l'incident)
      this.voyageur = null; this.enService = false; this.majBoutonsService();
      this.evtSur(() => f.call(this, entree));
      return true;
    }
    return false;
  },
  // Personne ne s'avance : la file avance quand même d'une place (comme pour le pigeon de la détresse)
  debutEvenement(entree) {
    if (!evenementSansFile(entree)) return false;
    if (!this.evtObjets) this.preparerEvenements();
    this.perso.setVisible(false);
    const place = this.fileSprites.shift(); if (place) place.destroy();
    this.fileSprites.forEach((sprite, i) => {
      sprite.setVisible(!sprite.estPigeon);
      this.tweens.add({ targets: sprite, x: FILE.x - i * FILE.ecart, duration: 900, delay: 300 + i * 150, ease: 'Sine.easeInOut', onStart: () => sprite.estPigeon || pasDeMarche(this, sprite, 900) });
    });
    this.majFileAttente();
    this.arrivee(entree);
    return true;
  },
  // Le buste d'un visiteur qui n'est pas venu par la file (le revenant, l'enfant qui se relève)
  evtBusteSurPlace(personne, expression, { fondu = 500, depuisBas = 26 } = {}) {
    this.montrerBuste(personne, expression);
    const y = this.perso.y;
    this.perso.setAlpha(0).setY(y + depuisBas).setVisible(true);
    this.tweens.add({ targets: this.perso, alpha: 1, y, duration: fondu, ease: 'Sine.easeOut' });
  },

  // --- 1. Les yeux de ta mère ---
  evt_parents(e) {
    const G = this.G, J = accordEvt(G, '', 'e');
    this.evtParchemin('Un vieux voyageur', e.etape === 3 ? 'la troisième visite' : e.etape === 2 ? 'il est revenu' : '');
    if (e.etape === 1) {
      this.raconter("Un vieil homme s'arrête net devant ta fenêtre. Il te dévisage longtemps, appuyé sur sa canne, sans un mot.");
      this.bouton('« Monsieur ? »', () => {
        this.exprimer('inquiet');
        this.evtDire("Pardon... Tu as... tu as les yeux de ta mère. (Il recule d'un pas.) Non. Je me trompe sûrement. C'était il y a si longtemps.", 'parents');
        const r = evtParents(G, e);
        this.choix([r.mendiantLaDit ? '« Le mendiant aussi... »' : '« Ma mère ? »', () => {
          this.evtDire(`${r.mendiantLaDit ? "« Un mendiant ? Alors je ne suis pas fou. » " : ''}Il ouvre la bouche, puis la referme. « C'était juste là, sur le bout de ma langue... Je reviendrai. Quand ça me reviendra. »`, 'parents');
          this.bouton('Le laisser partir', () => this.evtFin());
        }], ['Le laisser partir', () => this.evtFin()]);
      });
      return;
    }
    if (e.etape === 2) {
      this.exprimer('content');
      this.evtDire("Me revoilà. Ça m'est revenu en marchant, d'un coup, comme une odeur. Ta mère chantait en reprisant les capes. Ton père, lui, riait trop fort.", 'parents');
      this.bouton('« Parlez-moi d\'eux ! »', () => {
        this.exprimer('neutre');
        this.evtDire("Ils étaient de ceux qui refusaient d'oublier. Il y avait un village, au bord d'un lac... Aucune carte ne le montre plus. (Il se frotte le front.)", 'parents');
        this.bouton(`« Pourquoi m'ont-ils laissé${J} ? »`, () => {
          evtParents(G, e);
          this.exprimer('inquiet');
          this.evtDire(`Laissé${J} ? Non... Ils t'ont caché${J}, la nuit où le ciel est devenu orange. Mais chaque fois que je quitte cette rue, j'oublie un peu plus. Retiens-le pour moi.`, 'parents');
          this.bouton('« Je m\'en souviendrai. »', () => this.evtFin());
        });
      });
      return;
    }
    // la troisième visite : la vérité, la berceuse, et il s'efface
    this.evtDire("Cette fois, je suis venu avant d'oublier. J'ai écrit sur ma main, tu vois ? Écoute-moi bien, et ne m'interromps pas.", 'parents');
    this.bouton('« Je vous écoute. »', () => {
      this.exprimer('inquiet');
      this.evtDire(`Ils ne t'ont pas abandonné${J}. Ils se sont battus contre le Grand Sage, et ils ont perdu. Leur dernier mot, c'était ton nom.`, 'parents');
      this.bouton('...', () => {
        evtParents(G, e);
        this.evtPoser('evt_berceuse', SILL_GAUCHE_EVT);
        this.exprimer('neutre');
        this.evtDire("(Il pose sur le comptoir une vieille page pliée en quatre.) Ta mère la chantait le soir. Je l'ai gardée toute ma vie sans savoir pourquoi. Maintenant, je sais.", 'parents');
        this.bouton('Prendre la berceuse', () => {
          for (const o of this.evtObjets) if (o.texture && o.texture.key === 'evt_berceuse') this.tweens.add({ targets: o, y: o.y + 30, alpha: 0, duration: 400 });
          this.raconter("Tu glisses la berceuse contre ton cœur. Quand tu relèves les yeux, le vieil homme s'éloigne déjà... et la rue semble l'effacer à chaque pas.");
          this.bouton('...', null);
          this.time.delayedCall(900, () => {
            this.partirPar(FENETRE.x - 80);
            this.time.delayedCall(700, () => this.tweens.add({ targets: this.perso, alpha: 0, duration: 1100 }));
          });
        });
      });
    });
  },

  // --- 2. Garrick a un souci ---
  evt_garrick(e) {
    const G = this.G, camp = e.camp, P = 'garrick';
    this.evtParchemin('Garrick a un souci', ['', 'son genou', 'une vieille dette', 'une lettre'][e.etape] || '');
    const finir = t => { this.evtDire(t, P); this.bouton('« À bientôt, Garrick. »', () => this.evtFin()); };
    if (e.etape === 1) {
      this.evtDire("Aïe... ne fais pas attention. C'est ce satané genou : la vieille blessure de la rivière, tu te souviens ? Il me rappelle à l'ordre quand le temps tourne.", P);
      const suite = camp === 'bien' ? "Les guérisseurs de la Confrérie voudraient m'inscrire dans leurs registres. Très peu pour moi."
        : camp === 'mal' ? "Le rebouteux des Bannis boit plus qu'il ne soigne. Je préfère encore tes mains." : "Je ne vais pas courir chez les guérisseurs pour un genou qui grince, hein ?";
      this.bouton('« Montre-moi ça. »', () => {
        this.evtDire(suite, P);
        const quoi = (G.stock.bandage || 0) > 0 ? 'un bandage' : (G.stock.potion || 0) > 0 ? 'une potion' : 'une compresse';
        this.choix([`Le soigner (${quoi})`, () => {
          const r = evtGarrick(G, e, 'soigner'); this.majStock();
          this.exprimer('content');
          finir(`(${r.soin === 'compresse' ? 'Une compresse d\'eau froide, bien serrée.' : r.soin === 'potion' ? 'Une gorgée de potion, et le genou se dénoue.' : 'Tu serres le bandage autour de son genou.'}) Ha ! Tu as de meilleures mains que tous les rebouteux de la Comté.`);
        }], ['« Va voir l\'apothicaire. »', () => { evtGarrick(G, e, 'apothicaire'); this.exprimer('neutre'); finir("L'apothicaire... Oui, oui. (Il repart en boitant, vexé comme un vieux chat.)"); }]);
      });
      return;
    }
    if (e.etape === 2) {
      if (camp === 'mal') {
        this.evtDire("J'ai une dette envers les Bannis : un service. Garde ce paquet sous ton comptoir cette nuit. Ne l'ouvre pas, et ne pose pas de questions.", P);
        this.choix(['Garder le paquet', () => { evtGarrick(G, e, 'paquet'); this.exprimer('content'); finir("(Il glisse sous ton comptoir un paquet ficelé, lourd comme une pierre.) Tu es quelqu'un de bien. Même si les tabards bleus diraient le contraire."); }, null, 'mal'],
          ['Refuser', () => { evtGarrick(G, e, 'refuser'); finir("Bien. Tu as raison de te méfier. Même de moi, ha ha."); }]);
        return;
      }
      const C = EVT_COMPTOIR.garrick, peut = peutPayer(G, C.pret);
      this.evtDire(`Je dois ${C.pret} pièces à un usurier de la Confrérie. Une vieille histoire. S'il fouille trop dans mes affaires, il trouvera des choses que je préfère garder pour moi.`, P);
      this.choix([peut ? `Lui prêter ${C.pret} p.` : `Il te manque ${Math.ceil(C.pret - G.argent)} p.`, peut ? () => {
        evtGarrick(G, e, 'preter'); this.dessinerPieces(); this.bourse.maj(G.argent);
        this.exprimer('content');
        finir(`Je te les rends dans une semaine, avec les intérêts. Parole de Garrick ! (Il fourre les pièces dans sa cape.)`);
      } : null], ['« Je ne peux pas. »', () => { evtGarrick(G, e, 'refuser'); this.exprimer('neutre'); finir("Je comprends. Je trouverai autrement. (Il sourit, mais ses yeux ne sourient pas.)"); }]);
      return;
    }
    // la lettre de son passé
    const lettre = this.evtPoser('evt_lettreGarrick', SILL_GAUCHE_EVT);
    const lire = suite => this.lettreEvt("G., ceux du lac comptent toujours sur toi. Ne laisse pas oublier. Ne les laisse pas tout effacer, même nos noms. Garde l'enfant loin de tout ça, tant qu'il le faudra. — A.", suite);
    if (camp === 'bien') {
      this.evtDire("Une lettre de mon passé m'a retrouvé. Si la garde la trouve chez moi... Brûle-la pour moi. Sans la lire.", P);
      this.choix(['La brûler sans la lire', () => {
        evtGarrick(G, e, 'bruler');
        this.bruler(lettre);
        this.exprimer('content');
        finir("(Le papier se tord dans la flamme de la bougie. Garrick ferme les yeux.) Merci. Un jour, je te dirai ce qu'il y avait dedans.");
      }], ['La lire', () => lire(() => { evtGarrick(G, e, 'lire'); this.exprimer('inquiet'); finir("Tu l'as lue. (Un long silence.) Alors tu sais qu'il y avait des gens, avant. Garde ça pour toi, petit. Promis ?"); })]);
      return;
    }
    this.evtDire("Une lettre d'un vieil ami, mort depuis longtemps. Mes yeux ne sont plus ce qu'ils étaient... Tu veux bien me la lire ?", P);
    this.choix(['La lire à voix haute', () => lire(() => { evtGarrick(G, e, 'lire'); this.exprimer('neutre'); finir("« Ne laisse pas oublier... » Il disait toujours ça. (Garrick replie la lettre et la range contre son cœur.)"); })],
      ['« Garde-la pour toi. »', () => { evtGarrick(G, e, 'garder'); finir("Tu as raison. Certaines choses se lisent seul. (Il reprend la lettre, doucement.)"); }]);
  },
  // Une lettre ouverte en grand, sur un parchemin ; un clic la referme
  lettreEvt(texte, suite) {
    this.bouton('...', null);
    const voile = this.add.rectangle(480, 270, 960, 540, 0x0a0604, 0.55).setDepth(40).setInteractive();
    const L = this.add.container(480, 250).setDepth(41);
    L.add(this.add.image(0, 0, panneauHD(this, 560, 250)).setScale(2));
    L.add(this.add.text(0, -96, 'Une lettre jaunie, à l’encre pâlie', style(13, '#6b4a2a', { fontStyle: 'bold italic' })).setOrigin(0.5));
    const t = this.add.text(0, -4, texte, style(17, '#3b2410', { fontStyle: 'italic', align: 'center', wordWrap: { width: 470 }, lineSpacing: 4 })).setOrigin(0.5);
    for (let k = 16; t.height > 180 && k >= 12; k--) t.setFontSize(k);
    L.add(t);
    L.add(this.add.text(0, 102, '▶ clique pour refermer', style(12, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5));
    L.setScale(0.3).setAlpha(0);
    this.tweens.add({ targets: L, scale: 1, alpha: 1, duration: 360, ease: 'Back.easeOut' });
    Son.jouer('page');
    this.time.delayedCall(450, () => voile.once('pointerdown', () => { voile.destroy(); L.destroy(); this.evtSur(suite); }));
  },
  // Le papier qui brûle : il noircit, se recroqueville, et s'envole en fumée
  bruler(o) {
    if (!o || !o.active) return;
    creerHalo(this); creerObjetsEvtHD(this);
    for (let k = 0; k < 6; k++) {
      const f = this.add.image(o.x - 10 + Math.random() * 20, o.y - 6, 'evt_flamme').setScale(2).setDepth(3.3).setOrigin(0.5, 1);
      this.tweens.add({ targets: f, y: f.y - 20 - Math.random() * 14, scale: 0.6, alpha: 0, duration: 700 + k * 120, delay: k * 90, onComplete: () => f.destroy() });
    }
    this.tweens.add({ targets: o, scaleY: 0.4, alpha: 0, duration: 1000, delay: 200, onStart: () => o.setTint(0x5a3a2a), onComplete: () => o.destroy() });
    const fumee = this.add.image(o.x, o.y - 20, 'halo').setScale(0.3).setTint(0x8a8078).setAlpha(0.5).setDepth(3.3);
    this.tweens.add({ targets: fumee, y: fumee.y - 50, scale: 0.8, alpha: 0, duration: 1600, delay: 500, onComplete: () => fumee.destroy() });
  },

  // --- 3. L'anniversaire du comptoir ---
  evt_anniversaire(e) {
    const G = this.G, hote = e.hote && e.hote.figurant === 'mentor' ? 'Garrick Cœur-de-Chêne' : (e.hote ? e.hote.nom : 'Garrick Cœur-de-Chêne');
    this.evtParchemin("L'anniversaire du comptoir", 'un an déjà !');
    // les fanions en travers de la fenêtre (ils restent jusqu'au soir), les habitués derrière
    creerObjetsEvtHD(this);
    const { x, y, w } = FENETRE, n = 13;
    const fil = this.evtGarder(this.add.graphics().setDepth(2.66), true);
    fil.lineStyle(2, 0x3a2a1a, 1); fil.beginPath();
    for (let k = 0; k <= n; k++) { const fx = x + 6 + k * (w - 12) / n, fy = y + 20 + Math.sin(k / n * Math.PI) * 18; if (k) fil.lineTo(fx, fy); else fil.moveTo(fx, fy); }
    fil.strokePath(); fil.setMask(this.masqueFenetre);
    for (let k = 0; k < n; k++) {
      const fx = x + 6 + (k + 0.5) * (w - 12) / n, fy = y + 20 + Math.sin((k + 0.5) / n * Math.PI) * 18;
      const f = this.evtGarder(this.add.image(fx, fy, 'evt_fanion' + (k % 4)).setOrigin(0.5, 0).setScale(2).setDepth(2.66), true);
      f.setMask(this.masqueFenetre);
      this.tweens.add({ targets: f, angle: { from: -6, to: 6 }, duration: 900 + (k % 3) * 200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: k * 70 });
    }
    (e.invites || []).slice(0, 3).forEach((p, i) => this.evtCompagnon(p, [x + 52, x + w - 50, x + 96][i], { regarde: i === 1 ? -1 : 1 }));
    const gateau = this.evtPoser('evt_gateau', SILL_GAUCHE_EVT + 8, { echelle: 2, decor: true });
    const flamme = this.evtGarder(this.add.image(gateau.x + 1, SILL_EVT - 56, 'evt_flamme').setOrigin(0.5, 1).setScale(2).setDepth(3.25), true);
    this.tweens.add({ targets: flamme, scaleX: { from: 1.7, to: 2.3 }, scaleY: { from: 2.2, to: 1.8 }, duration: 260, yoyo: true, repeat: -1 });
    Son.jouer('fanfare');
    this.evtConfettis();
    this.dire(`Surprise ! Un an, jour pour jour, que « ${G.nomShop} » a levé son store pour la première fois ! On ne pouvait pas laisser passer ça.`, hote, this.buste ? this.buste.personne.nom : null);
    this.bouton('« Vous êtes fous ! »', () => {
      const r = evtAnniversaire(G);
      this.dessinerPieces();
      const objet = { plaque: 'evt_plaque', enseigne: 'evt_enseigne', panier: 'evt_panier', bouquet: 'evt_bouquet' }[r.id];
      this.evtPoser(objet, SILL_DROITE_EVT - 20);
      const t = { plaque: 'De la part de tout le quartier : une plaque d\'argent, gravée à ton nom. Et une bourse, pour l\'année qui vient.',
        enseigne: 'Une enseigne sculptée par le menuisier de la rue Haute, et une petite bourse pour fêter ça.',
        panier: 'Un panier du marché, avec tout ce qu\'il faut pour une fête... et quelques pièces au fond.',
        bouquet: 'On n\'a pas grand-chose, mais on a cueilli ça ce matin. Et on s\'est cotisés, un peu.' }[r.id];
      this.dire(`${t} (+${r.pieces} p., réputation +${String(EVT_COMPTOIR.anniversaire.reputation).replace('.', ',')})`, hote, this.buste ? this.buste.personne.nom : null);
      this.bouton('Souffler la bougie', () => {
        Son.jouer('vent');
        this.tweens.killTweensOf(flamme);
        this.tweens.add({ targets: flamme, scale: 0, alpha: 0, duration: 250 });
        creerHalo(this);
        const fumee = this.evtGarder(this.add.image(flamme.x, flamme.y - 8, 'halo').setScale(0.15).setTint(0xb0a89a).setAlpha(0.6).setDepth(3.3));
        this.tweens.add({ targets: fumee, y: fumee.y - 40, scale: 0.5, alpha: 0, duration: 1400 });
        this.evtConfettis();
        this.dire('Bon anniversaire au comptoir ! Et à l\'année prochaine !', hote, this.buste ? this.buste.personne.nom : null);
        this.bouton('« Merci à tous ! »', () => {
          for (const s of this.evtObjets.filter(o => o.texture && o.texture.key.startsWith('corps_'))) this.evtSortir(s, s.x < 480 ? FENETRE.x - 60 : FENETRE.x + FENETRE.w + 60, 1700);
          this.evtFin();
        });
      });
    });
  },
  // Une pluie de confettis devant la fenêtre
  evtConfettis() {
    const couleurs = [0xe84a4a, 0xf0c040, 0x4ab84a, 0x4a8ae8, 0xe87ad8];
    for (let k = 0; k < 40; k++) {
      const c = this.add.rectangle(FENETRE.x + Math.random() * FENETRE.w, FENETRE.y - 6, 4, 3, couleurs[k % 5]).setDepth(3.4).setAngle(Math.random() * 90);
      this.tweens.add({ targets: c, y: SILL_EVT + Math.random() * 20, x: c.x + (Math.random() - 0.5) * 60, angle: c.angle + 360 * (Math.random() < 0.5 ? 1 : -1), duration: 1400 + Math.random() * 900, delay: Math.random() * 400, ease: 'Sine.easeIn',
        onComplete: () => this.tweens.add({ targets: c, alpha: 0, duration: 500, delay: 600, onComplete: () => c.destroy() }) });
    }
  },

  // --- 4. La chanson du barde ---
  evt_barde(e) {
    const G = this.G, C = EVT_COMPTOIR.barde;
    this.evtParchemin('Une barde de passage', 'elle a composé une chanson');
    creerObjetsEvtHD(this);
    const luth = this.evtGarder(this.add.image(FENETRE.x + FENETRE.w / 2 + 26, SILL_EVT + 4, 'evt_luth').setOrigin(0.5, 1).setScale(2.3).setAngle(-28).setDepth(2.2));
    luth.setMask(this.masqueFenetre);
    this.evtDire("Bien le bonjour ! Aëlis Corde-d'Or, pour vous servir. On m'a tant parlé de votre comptoir que j'en ai fait une chanson. Voulez-vous l'entendre ?", 'barde');
    this.bouton('« Chante ! »', () => {
      this.bouton('...', null);
      this.chansonEvt(e.couplets || coupletsDuBarde(G), luth, () => {
        this.evtDire(`Pour la chanson, une pièce ou deux ? Je la chanterai au marché ce soir... et elle dépendra un peu de votre générosité, hi hi.`, 'barde');
        this.choix([peutPayer(G, C.prix) ? `Lui donner ${C.prix} p.` : '« Je n\'ai rien sur moi. »', () => {
          const r = evtBarde(G, e, 'payer'); this.bourse.maj(G.argent);
          this.exprimer(r.paye ? 'content' : 'neutre');
          this.evtDire(r.paye ? 'Merci ! Je la chanterai de tout mon cœur, et le marché entier la fredonnera !' : 'Comme vous voudrez... (Elle accorde son luth en souriant.) Il faudra bien que je change un couplet ou deux.', 'barde');
          this.bouton('« Bonne route ! »', () => this.evtFin());
        }], ['« Elle est très bien ainsi. »', () => {
          evtBarde(G, e, 'refuser');
          this.exprimer('neutre');
          this.evtDire('Comme vous voudrez... (Elle accorde son luth en souriant.) Il faudra bien que je change un couplet ou deux.', 'barde');
          this.bouton('« Bonne route ! »', () => this.evtFin());
        }]);
      });
    });
  },
  // Les quatre vers, un par un, sur un parchemin ; les notes qui s'envolent du luth
  chansonEvt(vers, luth, suite) {
    // (le parchemin des paroles se pose sur la réserve : la barde reste visible dans la fenêtre)
    const L = this.evtGarder(this.add.container(412, 436).setDepth(42));
    L.add(this.add.image(0, 0, panneauHD(this, 560, 190)).setScale(2).setInteractive());   // (il retient les clics : rien ne s'ouvre dessous)
    L.add(this.add.text(0, -76, '« La complainte du comptoir »', style(15, '#5a0e0e', { fontStyle: 'bold italic' })).setOrigin(0.5));
    const lignes = vers.map((v, i) => { const t = this.add.text(0, -40 + i * 30, v, style(15, '#3b2410', { fontStyle: 'italic' })).setOrigin(0.5).setAlpha(0); for (let k = 14; t.width > 520 && k >= 11; k--) t.setFontSize(k); L.add(t); return t; });
    L.setAlpha(0); this.tweens.add({ targets: L, alpha: 1, duration: 300 });
    const notes = this.time.addEvent({ delay: 380, loop: true, callback: () => {
      if (!luth.active) return;
      const n = this.add.image(luth.x - 10 + Math.random() * 30, luth.y - 60, 'evt_note').setScale(2).setDepth(3.5).setTint([0xffffff, 0xffe8a0, 0xc8e0ff][Math.floor(Math.random() * 3)]);
      this.tweens.add({ targets: n, y: n.y - 50, x: n.x + (Math.random() - 0.5) * 40, alpha: 0, duration: 1500, onComplete: () => n.destroy() });
    } });
    this.evtMinuteries.push(notes);
    this.tweens.add({ targets: luth, angle: { from: -28, to: -24 }, duration: 300, yoyo: true, repeat: 14 });
    lignes.forEach((t, i) => this.evtPlus(500 + i * 1500, () => { this.tweens.add({ targets: t, alpha: 1, duration: 500 }); Son.jouer('voix', { personne: this.buste ? this.buste.personne : PERSONNES_EVT.barde, ton: 'content', duree: 1.1 }); if (this.buste) this.parler(1100); }));
    this.evtPlus(500 + lignes.length * 1500 + 600, () => {
      notes.remove();
      this.bouton('Applaudir', () => { Son.jouer('succes'); this.tweens.add({ targets: L, alpha: 0, duration: 300, onComplete: () => L.destroy() }); this.evtSur(suite); });
    });
  },

  // --- 5. Le revenant des Brumes ---
  evt_revenant(e) {
    const G = this.G, d = e.defunt, prenom = prenomDe(d.nom), J = d.feminin ? 'e' : '';
    this.evtParchemin('La Nuit des Brumes', e.vivant ? 'quelqu’un sort de la brume' : 'une ombre est revenue');
    Son.jouer('froid'); Son.ambiance('faucheuse');
    creerHalo(this);
    // la fenêtre s'assombrit, la brume monte de la rue
    const voile = this.evtGarder(this.add.rectangle(FENETRE.x + FENETRE.w / 2, FENETRE.y + FENETRE.h / 2, FENETRE.w, FENETRE.h, 0x081028, 0).setDepth(1.7));
    voile.setMask(this.masqueFenetre);
    this.tweens.add({ targets: voile, fillAlpha: 0.62, duration: 1200 });
    for (let k = 0; k < 7; k++) {
      const b = this.evtGarder(this.add.image(FENETRE.x - 40 + k * 70, SILL_EVT - 12 - (k % 3) * 14, 'halo').setScale(2.2, 0.5).setTint(0xb8c8e8).setAlpha(0).setDepth(2.4));
      b.setMask(this.masqueFenetre);
      this.tweens.add({ targets: b, alpha: 0.16, duration: 1500, delay: k * 120 });
      this.tweens.add({ targets: b, x: b.x + 40, duration: 4000 + k * 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    const fantome = !e.vivant;
    this.evtPlus(900, () => {
      this.evtBusteSurPlace(d, e.reproche ? 'fache' : 'neutre', { fondu: 1400, depuisBas: 10 });
      if (fantome) {
        this.perso.setTint(0x8ab4ff); this.tweens.add({ targets: this.perso, alpha: 0.7, duration: 1400, onComplete: () => this.perso.active && this.buste && this.tweens.add({ targets: this.perso, alpha: { from: 0.7, to: 0.55 }, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }) });
        // (une lueur froide autour de l'ombre)
        const lueur = this.evtGarder(this.add.image(this.perso.x, this.perso.y - 90, 'halo').setScale(2.6, 2.2).setTint(0x6a9ae8).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD).setDepth(1.8));
        lueur.setMask(this.masqueFenetre);
        this.tweens.add({ targets: lueur, alpha: 0.6, duration: 1400 });
        this.tweens.add({ targets: lueur, scaleX: 2.8, scaleY: 2.35, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 1400 });
      }
      this.raconter(fantome ? `Les bougies vacillent. Dans la brume, une silhouette pâle comme la lune se dessine derrière la vitre : ${prenom}.`
        : `Une silhouette sort de la brume, et ton cœur s'arrête... Mais ce n'est pas un fantôme : c'est ${prenom}, enveloppé${J} de brouillard.`);
      const nom = `${d.nom} — ${fantome ? 'une ombre' : 'sorti' + J + ' de la brume'}`;
      const parle = t => this.dire(t, nom, d.nom);
      this.bouton('...', () => {
        if (e.reproche) {
          parle(e.voulu ? `Tu savais, n'est-ce pas ? Ce que tu avais glissé dans mon baluchon. Je ne l'ai compris que là-bas, trop tard.`
            : `Mon baluchon était si léger... Il me manquait tant de choses, là-bas. Pourquoi m'as-tu laissé${J} partir comme ça ?`);
          const fin = t => { this.raconter(t); this.bouton('...', () => this.departOmbre(true)); };
          this.choix(['Demander pardon', () => { evtRevenant(G, e, 'pardon'); this.exprimer('neutre'); fin("L'ombre te regarde longtemps. « Allume une lanterne pour moi, cette nuit. Peut-être que ça suffira. » Puis elle se défait dans la brume."); }],
            ['Se taire', () => { evtRevenant(G, e, 'silence'); fin("« Le silence, encore. » L'ombre se détourne, et la brume l'emporte."); }]);
          return;
        }
        parle(fantome ? "N'aie pas cette tête-là. Tu m'avais bien équipé. Ce qui m'est arrivé là-bas, personne n'y pouvait rien. Je voulais te le dire, une fois."
          : "Cette nuit, on honore ceux qu'on a perdus. Sans ton baluchon, j'en aurais fait partie. Alors je suis venu te dire merci.".replace('venu', 'venu' + J));
        this.exprimer('content');
        this.bouton('« Merci d\'être venu' + J + '. »', () => {
          const r = evtRevenant(G, e, 'merci'); this.dessinerPieces();
          this.raconter(fantome ? `Une pièce froide comme le givre roule sur le comptoir (+${r.piece} p.). « Pour la route. La tienne. » L'ombre sourit, et s'efface.`
            : `${prenom} pose une pièce porte-bonheur sur le comptoir (+${r.piece} p.), et repart dans la brume.`);
          this.bouton('...', () => this.departOmbre(fantome));
        });
      });
    });
  },
  departOmbre(fantome) {
    this.bouton('...', null);
    for (const o of this.evtObjets) if (o.active && o.type === 'Image' && o.texture.key === 'halo') this.tweens.add({ targets: o, alpha: 0, duration: 1200 });
    for (const o of this.evtObjets) if (o.active && o.type === 'Rectangle') this.tweens.add({ targets: o, fillAlpha: 0, duration: 1200 });
    Son.ambiance('comptoir');
    this.tweens.killTweensOf(this.perso);
    if (!fantome) return this.partirPar(FENETRE.x - 80);
    this.tweens.add({ targets: this.perso, alpha: 0, duration: 1500, onComplete: () => { this.buste = null; this.perso.setVisible(false); this.voyageurSuivant(); } });
  },

  // --- 6. L'enfant perdu, puis l'apprenti ---
  evt_enfant(e) {
    const G = this.G;
    this.evtParchemin('Un enfant perdu', 'un petit hobbit tout seul');
    this.raconter('Une toute petite tête bouclée dépasse à peine du rebord. Deux grands yeux mouillés te regardent.');
    this.bouton('« Bonjour, toi. »', () => {
      this.evtDire("Vous avez pas vu ma maman ? Elle m'a dit d'attendre près de la fontaine, et puis... et puis je sais plus où elle est.", 'enfant');
      this.choix(['Le garder au comptoir', () => {
        evtEnfant(G, e, 'garder');
        this.raconter("Tu lui fais une place sur le petit tonneau, à côté de ta fenêtre. « Attends-la ici. Elle passera forcément. » Il hoche la tête, très sérieux.");
        // il descend du rebord, et va s'asseoir sur le tonneau ; il y restera jusqu'au soir
        this.bouton('...', null);
        this.tweens.add({ targets: this.perso, y: this.perso.y + 40, alpha: 0, duration: 500, ease: 'Quad.easeIn', onComplete: () => {
          this.buste = null; this.perso.setVisible(false);
          this.asseoirEnfant();
          const iF = G.file.findIndex(x => x.type === 'faucheuse' || x.type === 'crieur'), place = iF >= 0 ? iF : G.file.length;
          const soir = { type: 'evenement', id: 'enfantSoir', jour: G.jour };
          G.file.splice(place, 0, soir);
          this.fileSprites.splice(place, 0, this.spriteFile(soir, place).setVisible(false));
          this.majFileAttente();
          this.time.delayedCall(900, () => this.voyageurSuivant());
        } });
      }], ['Appeler la garde', () => {
        evtEnfant(G, e, 'garde');
        this.exprimer('inquiet');
        this.evtDire("La garde ? (Il renifle, puis hoche la tête.) D'accord... (Un garde le prend par la main et l'emmène vers la fontaine.)", 'enfant');
        this.bouton('« Bonne chance, petit. »', () => this.evtFin());
      }]);
    });
  },
  // Célestin sur son tonneau, au coin de la fenêtre : il balance les jambes en attendant
  asseoirEnfant() {
    creerObjetsEvtHD(this);
    const x = FENETRE.x + FENETRE.w - 46;
    const tonneau = this.evtGarder(this.add.image(x, FILE.y + 4, 'evt_tonneau').setOrigin(0.5, 1).setScale(2.2).setDepth(1.56), true);
    tonneau.setMask(this.masqueFenetre);
    const cle = corpsHD(this, 'celestinPetit', 'assis');
    const s = this.enfantAssis = this.evtGarder(imageCorps(this, x, FILE.y - 24, 'celestinPetit', FILE.echelle * 1.12, 'assis').setDepth(1.57).setFlipX(true), true);
    s.setMask(this.masqueFenetre);
    s.setAlpha(0); this.tweens.add({ targets: s, alpha: 1, duration: 300 });
    this.tweens.add({ targets: s, angle: { from: -1.5, to: 1.5 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return cle;
  },
  evt_enfantSoir(e) {
    const G = this.G, J = accordEvt(G, '', 'e');
    this.evtParchemin('Un enfant perdu', 'le soir tombe');
    if (this.enfantAssis && this.enfantAssis.active) { const s = this.enfantAssis; this.tweens.killTweensOf(s); this.tweens.add({ targets: s, alpha: 0, duration: 300, onComplete: () => s.destroy() }); }
    this.enfantAssis = null;
    this.raconter('La journée avance. Personne n\'est venu chercher Célestin. Il saute de son tonneau et revient à ta fenêtre.');
    this.evtPlus(500, () => {
      this.evtBusteSurPlace(PERSONNES_EVT.enfant, 'inquiet');
      this.bouton('...', () => {
        this.evtDire("Elle viendra pas, hein ? En vrai, elle est partie il y a longtemps. Je dors sous le pont, avec les autres.", 'enfantSoir');
        this.bouton('...', () => {
          this.raconter(`Un enfant des rues. Comme toi, avant que Garrick ne croise ta route.`);
          const orph = typeof orphelinatOuvert === 'function' && orphelinatOuvert(G);
          this.choix([orph ? "L'emmener à l'orphelinat" : 'Lui offrir un repas et un lit', () => {
            const r = evtEnfantSoir(G, e, 'recueillir'); this.majStock();
            this.exprimer('content');
            this.evtDire(`${r.ration ? 'Il dévore sa ration en trois bouchées. ' : 'Il dévore une tartine en trois bouchées. '}« Je saurai te le rendre. Promis, juré, craché ! »`, 'enfantSoir');
            this.bouton('« Allez, viens. »', () => this.evtFin(orph ? FENETRE.x - 80 : FENETRE.x + FENETRE.w + 80));
          }], ['Le laisser repartir', () => {
            evtEnfantSoir(G, e, 'laisser');
            this.exprimer('neutre');
            this.evtDire(`D'accord. (Il hausse les épaules, comme s'il avait l'habitude.) Merci pour le tonneau.`, 'enfantSoir');
            this.bouton('...', () => this.evtFin());
          }]);
        });
      });
    });
  },
  evt_enfantGrand(e) {
    const G = this.G;
    this.evtParchemin('Une visite', 'un visage connu');
    this.evtDire("Tu te souviens de moi ? Célestin, le petit du tonneau ! J'ai grandi, hein ? Bon, pas tant que ça. Je suis un hobbit.", 'enfantGrand');
    this.bouton('« Célestin ! Regarde-toi ! »', () => {
      this.evtDire("J'ai appris à repriser, à recoudre le cuir, à tout réparer avec trois fois rien. Tu n'aurais pas du travail pour moi, à ton atelier ?", 'enfantGrand');
      const dit = t => { evtEnfantGrand(G); this.exprimer('content'); this.evtDire(t, 'enfantGrand'); this.bouton('« À demain, à l\'atelier. »', () => this.evtFin()); };
      this.choix(['« Il y a une place pour toi. »', () => dit("(Il te serre la main, très fort.) Tu ne le regretteras pas ! (Célestin peut être embauché à l'atelier.)")],
        ['« Pas encore. Repasse. »', () => dit("Je t'attendrai à l'atelier, alors. Il y a toujours un tabouret de libre. (Célestin peut être embauché à l'atelier.)")]);
    });
  },

  // --- 7. L'averse ---
  evt_averse(e) {
    const G = this.G;
    this.evtParchemin('Une averse', 'un passant s\'abrite');
    this.raconter("L'averse redouble. Un passant se réfugie sous ton auvent, trempé jusqu'aux os.");
    this.bouton('...', () => {
      this.exprimer('inquiet');
      this.evtDire('Brrr ! Quel temps de chien. Vous permettez que je m\'abrite un instant ? Je ne dérangerai pas, promis.', 'averse');
      this.choix(['Lui offrir une tisane', () => {
        const r = evtAverse(G, e, 'tisane');
        const tasse = this.evtPoser('evt_tasse', SILL_GAUCHE_EVT, { echelle: 2.2 });
        this.vapeurEvt(tasse);
        this.exprimer('content');
        this.evtDire(`(Il serre la tasse entre ses mains gelées.) Merci. Tenez, pour la peine, un bruit qui court : ${r.rumeur.texte.charAt(0).toLowerCase() + r.rumeur.texte.slice(1)}`, 'averse');
        this.bouton('« Merci du conseil. »', () => this.evtFin());
      }], ['Le laisser s\'abriter', () => {
        evtAverse(G, e, 'rien');
        this.raconter("Il attend sans un mot que la pluie se calme, puis repart en courant, la capuche sur les yeux.");
        this.bouton('...', () => this.evtFin());
      }]);
    });
  },
  vapeurEvt(o) {
    creerHalo(this);
    const m = this.time.addEvent({ delay: 420, loop: true, callback: () => {
      if (!o.active) { m.remove(); return; }
      const v = this.add.image(o.x - 4 + Math.random() * 8, o.y - 22, 'halo').setScale(0.07).setTint(0xf0f0f0).setAlpha(0.5).setDepth(3.3);
      this.tweens.add({ targets: v, y: v.y - 26, x: v.x + (Math.random() - 0.5) * 10, scale: 0.16, alpha: 0, duration: 1400, onComplete: () => v.destroy() });
    } });
    this.evtMinuteries.push(m);
  },

  // --- 8. Le pickpocket : pendant que le client parle, une petite main se tend vers ta besace ---
  inc_pickpocket(entree) {
    const G = this.G, v = entree.voyageur, C = EVT_COMPTOIR.pickpocket;
    creerObjetsEvtHD(this);
    this.dire(auHasard(["Ah, quelle journée ! Vous savez ce qu'on raconte au marché, ce matin ? Le fils du meunier s'est fiancé avec... attendez, comment s'appelle-t-elle déjà...",
      "Ouf, enfin mon tour ! Figurez-vous qu'en venant, j'ai croisé un troupeau d'oies qui bloquait toute la rue. Des oies ! En plein bourg !"]), this.nomAvecRelation(v.nom), v.nom);
    this.bouton('...', null);
    const col = this.bourse.col(), xb = col.x + 14, yb = 520;
    const main = this.evtGarder(this.add.image(xb + 18, yb + 70, 'evt_main0').setOrigin(0.5, 0).setScale(2).setDepth(60).setAngle(-12));
    let fini = false;
    // le gamin qui détale dans la rue, derrière le client
    const detaler = () => {
      const cle = corpsHD(this, 'chapardeur'), g = this.evtGarder(this.add.image(FENETRE.x + FENETRE.w + 20, FILE.y + 2, cle).setOrigin(0.5, 1).setScale(FILE.echelle * echelleCorps(cle) * 1.05).setDepth(1.45).setFlipX(true));
      g.setMask(this.masqueFenetre);
      this.evtPlus(400, () => { pasDeMarche(this, g, 1300); this.tweens.add({ targets: g, x: FENETRE.x - 30, duration: 1300, ease: 'Linear', onComplete: () => g.destroy() }); });
    };
    const suite = (texte = '« Pardon, vous disiez ? »') => {
      detaler(); this.bouton(texte, () => { this.evtSur(() => this.arrivee(entree)); }); };
    this.evtPlus(1300, () => {
      Son.jouer('glisse');
      main.setInteractive({ useHandCursor: true });
      this.tweens.add({ targets: main, y: yb - 46, x: xb + 4, duration: 1100, ease: 'Sine.easeOut' });
      this.tweens.add({ targets: main, angle: { from: -12, to: -4 }, duration: 380, yoyo: true, repeat: 4, delay: 1100 });
      main.once('pointerdown', (p, lx, ly, ev) => {
        if (fini) return; fini = true; if (ev && ev.stopPropagation) ev.stopPropagation();
        evtPickpocket(G, true);
        this.tweens.killTweensOf(main);
        Son.jouer('aie');
        this.tweens.add({ targets: main, y: yb + 80, duration: 220, ease: 'Quad.easeIn' });
        const t = this.evtGarder(this.add.text(xb + 30, yb - 70, 'Ouste !', style(18, '#ffe9a0', { fontStyle: 'bold', stroke: '#2a1a10', strokeThickness: 5, brut: true })).setOrigin(0.5).setDepth(61));
        this.tweens.add({ targets: t, y: t.y - 20, alpha: 0, delay: 700, duration: 500 });
        this.raconter('Une petite main a filé sous le comptoir. Tu l\'as vue à temps : un gamin détale dans la rue, bredouille.');
        suite();
      });
    });
    this.evtPlus(1300 + C.delai, () => {
      if (fini) return; fini = true;
      main.disableInteractive();
      const r = evtPickpocket(G, false);
      main.setTexture('evt_main1');
      Son.jouer('pieces');
      for (let k = 0; k < Math.min(5, Math.ceil(r.perte / 3)); k++) {
        const pc = this.add.image(col.x + (Math.random() - 0.5) * 10, col.y, 'pieceFace').setScale(1.6).setDepth(59);
        this.tweens.add({ targets: pc, x: xb + 4, y: yb - 40, duration: 300, delay: k * 60, onComplete: () => pc.destroy() });
      }
      this.bourse.maj(G.argent);
      this.tweens.add({ targets: main, y: yb + 80, duration: 400, delay: 350, ease: 'Quad.easeIn' });
      this.raconter(r.perte ? `Une petite main a filé sous le comptoir... avec ${r.perte} pièces de ta besace ! Le temps de crier, le gamin a disparu au coin de la rue.` : 'Une petite main a fouillé ta besace... vide. Le gamin repart bredouille.');
      this.exprimer('inquiet');
      suite(r.perte ? '« Au voleur !... »' : undefined);
    });
  },

  // --- 9. Le troc ---
  evt_troc(e) {
    const G = this.G, o = objetDuTroc(G, e);
    this.evtParchemin('Un voyageur fauché', 'il propose un troc');
    this.evtDire("Je n'ai pas un sou, je vous le dis tout de suite. Mais j'ai ceci. (Il pose un objet sur le comptoir.)", 'troc');
    const objet = this.evtPoser('evt_troc' + (e.objet % OBJETS_TROC.length), SILL_GAUCHE_EVT, { echelle: 2.4 });
    this.bouton(`« Qu'est-ce que c'est ? »`, () => {
      this.evtDire(`${o.nom}. ${o.dit} Contre un baluchon de route, ça vous va ? Deux rations, une gourde, une torche.`, 'troc');
      const ok = peutTroquer(G), plein = G.tresors.length >= placesAtelier(G);
      this.choix([ok ? 'Faire le troc' : plein ? 'Ton atelier est plein' : 'Rien à mettre dedans', ok ? () => {
        const r = evtTroc(G, e, 'accepter'); this.majStock();
        this.tweens.add({ targets: objet, y: objet.y + 30, alpha: 0, duration: 400 });
        const liste = Object.entries(r.donnes || {}).map(([id, n]) => `${n} ${nomObjet(id).toLowerCase()}${n > 1 ? 's' : ''}`).join(', ');
        this.exprimer('content');
        this.raconter(`Tu lui prépares un baluchon (${liste}). L'objet rejoint ton atelier : « ${o.nom} », environ ${valeurTresor(r.tresor, ETATS.length - 1)} p. une fois remis à neuf.`);
        this.bouton('« Bonne route ! »', () => this.evtFin());
      } : null], ['« Non merci. »', () => {
        evtTroc(G, e, 'refuser');
        this.tweens.add({ targets: objet, y: objet.y + 30, alpha: 0, duration: 400 });
        this.evtDire('Tant pis. Quelqu\'un d\'autre en voudra. (Il remballe son trésor avec soin.)', 'troc');
        this.bouton('...', () => this.evtFin());
      }]);
    });
  },

  // --- 10. Le vantard ---
  evt_vantard(e) {
    const G = this.G;
    this.evtParchemin('Un « héros »', 'il veut un baluchon gratuit');
    this.geste('hanche', 2400);
    this.evtDire("Gonzague le Sans-Pareil ! Tu as sûrement entendu parler de moi. Non ? Ça viendra. Je pars terrasser la bête des Pics Gelés.", 'vantard');
    this.bouton('« Ah... bravo ? »', () => {
      this.geste('pouce', 2000);
      this.evtDire(`Pour la gloire, tu m'offres le baluchon ! Quand je reviendrai, tout le bourg saura d'où il venait. C'est de la publicité, ${accordEvt(G, 'mon brave', 'ma belle')} !`, 'vantard');
      this.choix(['Lui offrir le baluchon', () => {
        evtVantard(G, e, 'donner'); this.majStock();
        this.evtDire('Tu ne le regretteras pas ! (Il bombe le torse et repart en sifflant, ta ration, ta gourde et ta torche sur l\'épaule.)', 'vantard');
        this.bouton('« Reviens vivant ! »', () => this.evtFin());
      }], ['« La gloire ne nourrit pas. »', () => {
        evtVantard(G, e, 'refuser');
        this.exprimer('fache');
        this.evtDire('Pff ! Tu le regretteras quand on chantera mon nom dans tout le pays ! (Il repart, le nez en l\'air.)', 'vantard');
        this.bouton('...', () => this.evtFin());
      }]);
    });
  },

  // --- 11. L'espion du paon ---
  evt_espion(e) {
    const G = this.G;
    this.evtParchemin('Un client discret', 'il ne demande rien');
    creerObjetsEvtHD(this);
    const carnet = this.evtGarder(this.add.image(FENETRE.x + FENETRE.w / 2 + 68, SILL_EVT - 2, 'evt_carnet').setOrigin(0.5, 1).setScale(2).setDepth(3.2).setAngle(-8));
    this.tweens.add({ targets: carnet, angle: { from: -8, to: -4 }, duration: 260, yoyo: true, repeat: -1 });
    this.raconter("Un client s'accoude au comptoir. Il ne demande rien. Il regarde tes étagères, tes prix, et griffonne dans un petit carnet noir.");
    this.bouton('...', () => {
      this.evtDire('Hm ? Oh, je regarde seulement. Continuez, continuez. (Il tourne une page.)', 'espion');
      this.choix(['« Qu\'écrivez-vous là ? »', () => {
        evtEspion(G, e, 'demasquer');
        this.tweens.killTweensOf(carnet);
        this.exprimer('inquiet');
        this.raconter("Tu tends la main vers le carnet. Il pâlit : sur la couverture, l'œil d'un paon, le sceau du Comptoir Agréé. Tous tes prix y sont notés.");
        this.bouton('« Démasqué ! »', () => {
          this.dire('Je... Monsieur Belhomme voulait juste... (Il ramasse son carnet et file sans demander son reste.) Le voisin attirera un client de moins.', NOMS_EVT.espionDemasque, this.buste ? this.buste.personne.nom : null);
          this.tweens.add({ targets: carnet, x: carnet.x - 60, alpha: 0, duration: 400 });
          this.bouton('...', () => this.evtFin());
        });
      }], ['Le laisser regarder', () => {
        evtEspion(G, e, 'laisser');
        this.raconter("Il note, note encore, puis s'en va sans un mot. Demain, à côté, les prix seront juste un peu plus bas que les tiens.");
        this.bouton('...', () => this.evtFin());
      }]);
    });
  },

  // --- 12. Le pigeon blessé, et son retour ---
  evt_pigeon(e) {
    const G = this.G;
    this.evtParchemin('Un pigeon blessé');
    creerOiseauxMessagers(this); creerObjetsEvtHD(this);
    const rebord = { x: FENETRE.x + 70, y: SILL_EVT };
    const pg = this.evtGarder(this.add.sprite(FENETRE.x + FENETRE.w + 60, FENETRE.y + 50, 'pigeonVolH').setScale(2.6).setOrigin(0.5, 1).setDepth(12).play('volPigeon'), true);
    Son.jouer('oiseaux');
    // il vole de travers, puis s'abat sur le rebord, roule et se redresse à peine
    this.tweens.add({ targets: pg, x: rebord.x + 30, y: rebord.y - 30, duration: 1100, ease: 'Sine.easeIn' });
    this.tweens.add({ targets: pg, angle: { from: -10, to: 18 }, duration: 160, yoyo: true, repeat: 3 });
    this.evtPlus(1150, () => {
      pg.stop(); pg.setTexture('evt_pigeonBlesse').setAngle(40);
      Son.jouer('coup');
      this.tweens.add({ targets: pg, x: rebord.x, y: rebord.y, angle: 0, duration: 380, ease: 'Bounce.easeOut' });
      this.tweens.add({ targets: pg, scaleX: { from: 2.6, to: 2.5 }, duration: 120, yoyo: true, repeat: -1, delay: 500 });
      this.raconter('Un pigeon s\'abat sur le rebord de ta fenêtre, une aile pendante. Il tremble de tout son corps et ne peut plus repartir.');
      this.choix(['Le soigner', () => {
        const r = evtPigeon(G, e, 'soigner'); this.majStock();
        this.tweens.killTweensOf(pg);
        const caisse = this.evtGarder(this.add.image(rebord.x, SILL_EVT, 'evt_caisse').setOrigin(0.5, 1).setScale(2.2).setDepth(12.1).setAlpha(0), true);
        this.tweens.add({ targets: caisse, alpha: 1, duration: 300 });
        pg.setTexture('evt_pigeonSoigne').setScale(2.6).setDepth(12).setY(SILL_EVT - 14);
        this.tweens.add({ targets: pg, angle: { from: -2, to: 2 }, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.raconter(`Tu lui bandes l'aile avec ${r.soin === 'bandage' ? 'un bandage de ta réserve' : 'un bout de chiffon propre'}, et tu l'installes dans une caisse garnie de paille, au chaud.`);
        this.bouton('...', () => { this.bouton('...', null); this.voyageurSuivant(); });
      }], ['Le laisser repartir', () => {
        evtPigeon(G, e, 'laisser');
        this.tweens.killTweensOf(pg);
        this.raconter('Le pigeon finit par se relever. Il repart en voletant de travers, au ras des toits.');
        this.bouton('...', null);
        this.evtPlus(700, () => { pg.play('volPigeon').setAngle(-10); this.tweens.add({ targets: pg, x: FENETRE.x - 60, y: FENETRE.y + 40, duration: 1500, ease: 'Sine.easeIn', onComplete: () => { pg.destroy(); this.voyageurSuivant(); } }); });
      }]);
    });
  },
  evt_pigeonRetour(e) {
    const G = this.G;
    this.evtParchemin('Une visite à plumes');
    creerOiseauxMessagers(this); creerObjetsEvtHD(this);
    const rebord = { x: FENETRE.x + FENETRE.w / 2 + 56, y: SILL_EVT };
    const pg = this.evtGarder(this.add.sprite(FENETRE.x + FENETRE.w + 60, FENETRE.y + 40, 'pigeonVolH').setScale(2.6).setOrigin(0.5, 1).setDepth(12).play('volPigeon'));
    Son.jouer('oiseaux');
    this.tweens.add({ targets: pg, x: rebord.x, y: rebord.y, duration: 1300, ease: 'Sine.easeOut', onComplete: () => {
      pg.stop(); pg.setTexture('evt_pigeonFier');
      this.tweens.add({ targets: pg, angle: { from: -3, to: 4 }, duration: 480, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.raconter("Un pigeon se pose sur le rebord, une aile encore un peu de travers : c'est celui que tu as soigné ! Il tient quelque chose de brillant au bec.");
      this.bouton('Tendre la main', () => {
        const r = evtPigeonRetour(G); this.dessinerPieces();
        this.raconter(r.cadeau === 'filOr' ? "Il dépose dans ta main un fil d'or, arraché à quelque tapisserie (+1 fil d'or pour l'atelier). Puis il roucoule, très fier de lui."
          : `Il dépose dans ta main une pièce d'argent ramassée on ne sait où (+${r.pieces} p.). Puis il roucoule, très fier de lui.`);
        pg.setTexture('pigeonPose');
        this.bouton('« Merci, l\'ami ! »', () => {
          this.bouton('...', null);
          this.tweens.killTweensOf(pg);
          pg.play('volPigeon');
          this.tweens.add({ targets: pg, x: FENETRE.x + FENETRE.w + 60, y: FENETRE.y + 20, duration: 1300, ease: 'Sine.easeIn', onComplete: () => { pg.destroy(); this.voyageurSuivant(); } });
        });
      });
    } });
  },

  // --- 13. Les enfants qui jouent aux aventuriers ---
  evt_enfants(e) {
    const G = this.G;
    this.evtParchemin('Des aventuriers en herbe', 'trois petits, une casserole');
    const amis = COMPAGNONS_EVT.enfants.map((p, i) => this.evtCompagnon(p.figurant, [FENETRE.x + 64, FENETRE.x + FENETRE.w - 60][i], { regarde: i ? -1 : 1 }));
    this.geste('poing', 1800);
    this.evtDire('Halte ! Pimprenelle la Terrible, et sa compagnie ! On part terrasser le dragon du lavoir.', 'enfants');
    this.bouton('« Le dragon du lavoir ? »', () => {
      this.evtDire("C'est le chat de la mère Tisserand. Mais il est très méchant ! Il nous faut un VRAI baluchon, comme les vrais aventuriers.", 'enfants');
      const partir = () => { amis.forEach(s => this.evtSortir(s, FENETRE.x - 60, 1300)); this.evtFin(); };
      this.choix(['Leur faire un baluchon', () => {
        const r = evtEnfants(G, e, 'donner'); this.majStock();
        this.evtPoser('evt_baluchonJouet', FENETRE.x + FENETRE.w / 2 - 96, { echelle: 2.2 });
        Son.jouer('succes');
        this.exprimer('content');
        this.raconter(`Tu noues un vieux mouchoir au bout d'un bâton, avec ${r.ration ? 'une ration coupée en trois' : 'trois biscuits'} dedans. Les enfants poussent un cri de victoire. (Réputation +${String(EVT_COMPTOIR.enfants.reputation).replace('.', ',')})`);
        this.bouton('« Bonne chasse ! »', partir);
      }], ['« Revenez plus grands. »', () => {
        evtEnfants(G, e, 'refuser');
        this.exprimer('fache');
        this.evtDire('Pff ! On le terrassera quand même ! (La petite troupe repart au pas de charge.)', 'enfants');
        this.bouton('...', partir);
      }]);
    });
  },

  // --- 14. Les amoureux ---
  evt_amoureux(e) {
    const G = this.G;
    this.evtParchemin('Deux voyageurs', 'ensemble');
    const lui = this.evtCompagnon('elrian', FENETRE.x + 62, { regarde: -1 });
    this.evtDire("Psst ! Pas si fort... Lui, là-bas, c'est Elrian. Demain, ça fera un an qu'on se connaît. Il me faudrait un cadeau, en secret. Tu as quelque chose ?", 'amoureux');
    const id = cadeauPourAmoureux(G);
    const finir = t => { this.evtDire(t, 'amoureux'); this.bouton('« Pas un mot ! »', () => { this.evtSortir(lui, FENETRE.x - 60, 1500); this.evtFin(); }); };
    const fleur = () => {
      evtAmoureux(G, e, 'fleur');
      this.exprimer('content');
      finir("(Tu cueilles une fleur au pot de la fenêtre.) Oh... Elle est parfaite. Il va adorer. (Elle la cache dans sa manche, toute rouge.)");
    };
    if (id) {
      const prix = Math.round(CADEAUX[id].prix * EVT_COMPTOIR.amoureux.majoration);
      this.choix([`Lui vendre ${leCadeauEvt(id)} (${prix} p.)`, () => {
        const r = evtAmoureux(G, e, 'cadeau'); this.dessinerPieces();
        this.exprimer('content');
        finir(`(Elle cache ${leCadeauEvt(r.cadeau)} sous sa cape et te glisse ${r.prix} pièces.) Merci, merci ! Il ne se doutera de rien.`);
      }], ['Lui offrir une fleur', fleur]);
    } else this.choix(['Lui offrir une fleur', fleur], ['« Je n\'ai rien, désolé. »', () => { evtAmoureux(G, e, 'rien'); finir('Tant pis. Je lui chanterai une chanson naine. Il déteste ça, mais ça le fait rire.'); }]);
  },

  // --- 15. L'inspecteur des poids et mesures ---
  evt_inspecteur(e) {
    const G = this.G, C = EVT_COMPTOIR.inspecteur, caches = interditsEnReserve(G);
    this.evtParchemin('Un inspecteur', 'des poids et mesures');
    const balance = this.evtPoser('evt_balance', SILL_GAUCHE_EVT + 10);
    const peser = () => this.tweens.add({ targets: balance, angle: { from: -4, to: 4 }, duration: 260, yoyo: true, repeat: 3, onComplete: () => balance.setAngle(0) });
    this.evtDire('Maître Ambroise Trébuchet, inspecteur des poids et mesures du bourg. Contrôle de routine : vos balances, vos poids, et votre réserve.', 'inspecteur');
    const fin = (t, expr = 'neutre') => { this.exprimer(expr); this.evtDire(t, 'inspecteur'); this.bouton('« Au revoir, Maître. »', () => this.evtFin()); };
    if (!caches.length) {
      this.choix(['Ouvrir la réserve', () => { evtInspecteur(G, e, 'ouvrir'); peser(); fin(`(Il pèse, compte, soupèse.) Tout est juste. (Il appose son cachet sur ton comptoir : « Poids certifiés », réputation +${String(C.certifie).replace('.', ',')}.)`, 'content'); }],
        ['« Revenez demain. »', () => { evtInspecteur(G, e, 'refuser'); fin(`Revenez demain ? (Il note quelque chose dans son registre.) « Récalcitrant. » (Réputation −${String(C.recalcitrant).replace('.', ',')}.)`, 'fache'); }]);
      return;
    }
    this.raconter(`Sous le comptoir, ${INTERDITS[caches[0]].article} du Passeur ${caches.length > 1 ? 'et le reste tintent' : 'tinte'} doucement à chaque pas de l'inspecteur...`);
    const resultat = r => {
      this.bourse.maj(G.argent);
      if (r.soudoye) return fin("(Les pièces disparaissent dans sa manche.) Je n'ai rien vu. Je ne vois jamais rien, d'ailleurs. Bonne journée !", 'content');
      if (r.cache) return fin("(Pendant qu'il examine ta balance, tu fais glisser tes fioles sous une latte du plancher.) Tout est en ordre. Parfait.", 'content');
      const nom = r.confisque ? INTERDITS[r.confisque].article : 'un objet interdit';
      fin(`${r.surpris ? '(Une fiole roule jusqu\'à ses pieds. Il la ramasse lentement.) Et ça ?' : `(Il soulève un tissu, et s'arrête.) Tiens, tiens : ${nom}.`} Amende : ${r.amende} p., et l'objet est saisi.`, 'fache');
      this.bourse.maj(G.argent);
    };
    this.bouton('...', () => {
      this.choix(['Ouvrir la réserve', () => { peser(); resultat(evtInspecteur(G, e, 'ouvrir')); }], ['Gagner du temps...', () => {
        this.evtDire("Eh bien ? J'attends. Le bourg ne me paie pas à regarder les mouches.", 'inspecteur');
        this.choix(['Cacher les objets', () => { peser(); resultat(evtInspecteur(G, e, 'cacher')); }],
          [`Lui glisser ${C.pot} p.`, () => resultat(evtInspecteur(G, e, 'soudoyer')), 'mal']);
      }]);
    });
  },

  // --- 16. Le chat pose quelque chose devant un client ---
  inc_chat(entree) {
    const G = this.G, v = entree.voyageur, inc = entree.incident, c = chatDe(G), nomChat = c.nom || 'Ton chat';
    creerObjetsEvtHD(this);
    const pref = creerChatHD(this, typeof lookChat === 'function' ? lookChat(G) : (c.look || { pelage: 'gris', yeux: 'vert', collier: 'aucun' }));
    if (inc.trouvaille === 'souris') creerChatRueHD(this);
    this.bouton('...', null);
    const xArret = FENETRE.x + FENETRE.w / 2 + 52, y = SILL_EVT;
    const chat = this.evtGarder(this.add.image(FENETRE.x - 30, y, pref + '_m0').setOrigin(0.5, 1).setScale(2.2).setDepth(3.3));
    let k = 0;
    const pas = this.time.addEvent({ delay: 110, loop: true, callback: () => chat.active && chat.setTexture(pref + '_m' + (++k % 4)) });
    this.evtMinuteries.push(pas);
    Son.jouer('miaou');
    this.tweens.add({ targets: chat, x: xArret, duration: 1800, ease: 'Linear', onComplete: () => {
      pas.remove(); chat.setTexture(pref + '_assis0');
      const queue = this.time.addEvent({ delay: 500, loop: true, callback: () => chat.active && chat.setTexture(pref + '_assis' + (chat.texture.key.endsWith('0') ? 1 : 0)) });
      this.evtMinuteries.push(queue);
      const cle = { souris: 'souris_0', bouton: 'evt_bouton', plume: 'evt_plume' }[inc.trouvaille];
      const objet = this.evtGarder(this.add.image(xArret - 44, y, cle).setOrigin(0.5, 1).setScale(2.4).setDepth(3.3));
      Son.jouer('poser');
      const quoi = { souris: 'une souris', bouton: "un bouton d'argent", plume: 'une plume de geai' }[inc.trouvaille];
      this.raconter(`${nomChat} saute sur le comptoir et dépose fièrement ${quoi} devant ${prenomDe(v.nom)}.`);
      this.bouton('...', () => {
        const reaction = reactionAuChat(v, inc.trouvaille);
        this.exprimer(reaction === 'degoute' ? 'fache' : 'content');
        this.dire({ degoute: 'Par toutes les étoiles... Une souris ? Sur le comptoir ?! Et c\'est là que vous rangez mon baluchon ?',
          rit: inc.trouvaille === 'souris' ? 'Ha ha ! Un vrai chasseur ! Il a bon goût, ton chat.' : 'Ha ha ! C\'est pour moi ? Quel drôle de petit marchand !',
          touche: 'Oh ! C\'est pour moi ? Comme c\'est gentil... Merci, mon beau.' }[reaction], this.nomAvecRelation(v.nom), v.nom);
        const suite = choix => {
          const r = evtChat(G, inc, choix, v); this.dessinerPieces();
          this.raconter(choix === 'feliciter' ? `${nomChat} ronronne, très fier de ${c.femelle ? 'elle' : 'lui'}.${r.pieces ? ` Le bouton d'argent finit dans ta besace (+${r.pieces} p.).` : ''}` : `${nomChat} te lance un regard vexé et saute par terre${inc.trouvaille === 'souris' ? ', sa souris dans la gueule' : ''}.`);
          queue.remove();
          this.tweens.add({ targets: objet, alpha: 0, duration: 300 });
          chat.setFlipX(true);
          const pas2 = this.time.addEvent({ delay: 110, loop: true, callback: () => chat.active && chat.setTexture(pref + '_m' + (++k % 4)) });
          this.evtMinuteries.push(pas2);
          this.tweens.add({ targets: chat, x: FENETRE.x - 40, duration: 1700, onComplete: () => { pas2.remove(); chat.destroy(); } });
          this.bouton('Revenir au client', () => this.evtSur(() => this.arrivee(entree)));
        };
        this.choix([`Féliciter ${nomChat}`, () => suite('feliciter')], [`Gronder ${nomChat}`, () => suite('gronder')]);
      });
    } });
  },

  // --- 17. Le coup de vent : le store claque, les papiers s'envolent ; à toi de tout rattraper ---
  evt_vent(e) {
    const G = this.G, C = EVT_COMPTOIR.vent;
    this.evtParchemin('Un coup de vent !');
    creerObjetsEvtHD(this);
    Son.jouer('vent');
    this.cameras.main.shake(260, 0.006);
    // le store se décroche à moitié et claque contre le cadre
    const { y, h } = FENETRE;
    this.store.setVisible(true).setY(y - 10);
    this.tweens.add({ targets: this.store, y: y + h * 0.45, duration: 260, ease: 'Quad.easeIn', yoyo: true, repeat: 2, onYoyo: () => Son.jouer('coup'), onComplete: () => this.store.setVisible(false) });
    this.raconter('Un coup de vent s\'engouffre par la fenêtre ! Le store claque, et tes papiers s\'envolent dans tout le comptoir. Rattrape-les !');
    this.bouton('...', null);
    // le compte, en grand, sur le parchemin de la commande
    this.sousTitre.setText('papiers rattrapés');
    const bandeau = this.evtGarder(this.add.text(812, 128, '', style(34, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5).setDepth(5));
    const bloque = this.evtGarder(this.add.rectangle(480, 270, 960, 540, 0x000000, 0.001).setDepth(69).setInteractive());
    let attrapes = 0, fini = false;
    const n = C.papiers, papiers = [];
    const maj = () => bandeau.setText(`${attrapes} / ${n}`);
    maj();
    const departs = [[150, 120], [800, 120], [150, 90], [820, 80], [480, 140], [700, 60], [260, 60]];
    for (let i = 0; i < n; i++) {
      const [x0, y0] = departs[i % departs.length];
      const p = this.evtGarder(this.add.image(x0, y0, 'evt_papier' + (i % 4)).setScale(2.2).setDepth(70).setInteractive({ useHandCursor: true }));
      papiers.push(p);
      // il tourbillonne : une trajectoire en boucles, il bascule et se retourne (le papier qui ondule)
      const phase = Math.random() * 6.28, vx = (Math.random() < 0.5 ? -1 : 1) * (40 + Math.random() * 50), base = { t: 0 };
      p.vol = this.tweens.add({ targets: base, t: 1, duration: C.duree, delay: i * 180, onUpdate: () => {
        if (!p.active || p.pris) return;
        const t = base.t * C.duree / 1000;
        p.x = Phaser.Math.Clamp(x0 + vx * t + Math.sin(t * 2.4 + phase) * 70, -40, 1000);
        p.y = y0 + Math.sin(t * 1.7 + phase) * 60 + t * 18 - 30 * Math.sin(t * 3.1);
        p.angle = Math.sin(t * 5 + phase) * 35;
        p.scaleX = 2.2 * Math.cos(t * 4 + phase);
      } });
      p.once('pointerdown', (ptr, lx, ly, ev) => {
        if (fini || p.pris) return; if (ev && ev.stopPropagation) ev.stopPropagation();
        p.pris = true; attrapes++; maj();
        Son.jouer('page');
        if (p.vol) p.vol.stop();
        this.tweens.add({ targets: p, x: i % 2 ? 140 : 810, y: i % 2 ? 150 : 130, scale: 0.6, angle: 0, alpha: 0, duration: 450, ease: 'Quad.easeIn' });
        if (attrapes === n) terminer();
      });
    }
    const terminer = () => {
      if (fini) return; fini = true;
      const rates = n - attrapes;
      for (const p of papiers) if (!p.pris && p.active) { p.disableInteractive(); this.tweens.add({ targets: p, x: p.x + (p.x < 480 ? -300 : 300), y: p.y - 120, alpha: 0, duration: 900, ease: 'Quad.easeIn' }); }
      const r = evtVent(G, rates); this.bourse.maj(G.argent);
      bloque.destroy();
      bandeau.setText(`${attrapes} / ${n}`).setColor(rates ? '#8a2a1a' : '#2f6a2a'); this.sousTitre.setText(rates ? 'papiers rattrapés' : 'tout est rattrapé !');
      this.raconter(rates ? `${rates} papier${rates > 1 ? 's se sont envolés' : " s'est envolé"} par la fenêtre : il faudra racheter du papier et de l'encre (−${r.perte} p.).`
        : `Tu as tout rattrapé ! Dans la rue, un passant qui a tout vu applaudit. (Réputation +${String(C.bravo).replace('.', ',')})`);
      this.bouton('Remettre de l\'ordre', () => { this.bouton('...', null); this.voyageurSuivant(); });
    };
    this.evtPlus(C.duree + n * 180, terminer);
  },
});
