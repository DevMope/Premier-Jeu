// (03/11, refonte Lumière et Ombre, étape 3) Au comptoir : la mise en scène des faits qui manquaient (les règles sont
// dans faitsHistoire.js). Le doyen qu'on écoute jusqu'au bout ou qu'on fait taire ; la fissure du Sage ; la sœur de
// la chapelle et la vampire au sac de limaille ; l'intendant du convoi et l'éclaireur loup-garou ; la voix du
// Drômmath ; l'avocat de « Monsieur Chat ». Même façon que les autres événements (ComptoirEvenements.js) : deux choix
// au plus, le ☀ ou le ☾ pour qui a la Clairvoyance, et rien ne bloque la file.

// Les visages : des figurants (couleurs, costume, carrure), le buste dans la même tenue qu'en pied
if (typeof FIGURANTS !== 'undefined') Object.assign(FIGURANTS, {
  // la sœur de la chapelle : robe claire, mantelet bleu de la Confrérie, la chaîne d'or de son ordre
  soeurClemence: { race: 'humain', feminin: true, nom: 'Sœur Clémence', costume: 'gardien', habit: 0xe4ddcc, cape: 0x2a4a8a, cheveux: 0x5a3a22, coiffure: 'chignon', peau: 1, niveau: 1, bouche: 1, buste: true, atours: { metal: 'or', coiffe: 'chaine' } },
  // la vampire des Bannis : capuche de nuit, doublure lie-de-vin
  ysolde: { race: 'vampire', feminin: true, nom: 'Ysolde Nuit-Close', costume: 'passeur', habit: 0x2a1a2e, cape: 0x4a0e1e, cheveux: 0x141018, coiffure: 'long', niveau: 1, buste: true },
  // l'intendant du convoi : un nain de la garde, tabard bleu, la barbe rousse tressée
  intendantBourrel: { race: 'nain', nom: 'Sergent Mathis Bourrel', costume: 'garde', habit: 0x2a4a8a, cheveux: 0x9a5a2a, barbe: 'nain', peau: 2, niveau: 2, buste: true },
  // l'éclaireur des Bannis : un loup-garou en cape de chasse, le poil gris
  fenrir: { race: 'loupgarou', nom: 'Fenrir Pas-Feutré', costume: 'passeur', habit: 0x3a3a2e, cape: 0x26261e, cheveux: 0x6a6a66, niveau: 1, buste: true },
  // la voix du Drômmath : une momie en robe de nuit, la chaîne d'or de l'Assemblée
  nekhet: { race: 'momie', feminin: true, nom: 'Nekhet', costume: 'gardien', habit: 0x22224a, cape: 0x12122a, cheveux: 0x1a1414, niveau: 2, vieux: true, bouche: 1, buste: true, atours: { metal: 'or', coiffe: 'chaine' } },
  // l'avocat de « Monsieur Chat » : habit noir de banquier, moustache cirée
  maitreFouine: { race: 'humain', nom: 'Maître Anselme Fouine', costume: 'banquier', habit: 0x1e1e24, cheveux: 0x2a2018, barbe: 'moustache', coiffure: 'court', peau: 0, niveau: 2, buste: true },
});

// Les objets posés sur le rebord : le sac de limaille, le jeton d'os du Drômmath, la caisse du convoi, l'assignation
function creerObjetsFaitsHD(scene) {
  if (scene.textures.exists('fait_sac')) return;
  const fabriquer = (cle, l, h, dessin) => { const t = toileObjet(l, h); dessin(t); t.contour(); t.texture(scene, cle); };
  fabriquer('fait_sac', 24, 22, t => {
    t.rampes.jute = rampe(0x9a8458); t.rampes.lien = rampe(0xc0a070); t.rampes.limaille = rampe(0x8a8e98);
    t.forme('jute', (x, y) => { const dy = y - 13, rx = 8.5 + dy * 0.25; return y >= 6 && y <= 21 && Math.abs(x + 0.5 - 11) <= rx ? [(x + 0.5 - 11) / (rx + 1), dy / 14, 0.75] : null; }, { motif: (x, y) => ((x + y) % 3 === 0 ? -0.5 : (x % 2 ? 0.2 : 0)) });
    t.forme('jute', ellipsoide(11, 4, 3.4, 2.6), { decalage: 0.3 });
    for (let x = 7; x <= 15; x++) t.poser(x, 6, 'lien', x % 2 ? 2 : 4);
    traitHD(t, 'lien', [[14, 6], [17, 8], [18, 11]], 0.7, 0.3);
    // la limaille qui s'échappe : des grains gris, quelques éclats
    for (const [x, y, k] of [[19, 20, 2], [20, 21, 3], [21, 20, 4], [22, 21, 2], [18, 21, 3], [21, 19, 5]]) t.poser(x, y, 'limaille', k);
  });
  fabriquer('fait_jeton', 15, 15, t => {
    t.rampes.os = rampe(0xe0d4b4);
    t.forme('os', ellipsoide(7, 7, 6.4, 6.4), { motif: (x, y) => (hachage(x, y, 17) > 0.88 ? -0.6 : 0) });
    // un croissant de lune gravé, et trois points (les trois portes du Drômmath)
    t.forme('encre', (x, y) => { const a = Math.hypot(x + 0.5 - 7, y + 0.5 - 7), b = Math.hypot(x + 0.5 - 8.6, y + 0.5 - 6); return a <= 3.6 && b > 3 ? [0, 0, 1] : null; }, { decalage: -0.4, ombre: false });
    for (const [x, y] of [[4, 11], [7, 12], [10, 11]]) t.poser(x, y, 'encre', 1);
  });
  fabriquer('fait_caisse', 32, 22, t => {
    t.rampes.azur = rampe(0x2a4a8a);
    t.forme('chene', (x, y) => (x >= 1 && x <= 30 && y >= 3 && y <= 21 ? [(x - 15.5) / 18, (y - 12) / 20, 0.8] : null), { motif: (x, y) => (y % 6 === 2 ? -0.8 : x % 9 === 0 ? -0.4 : 0) });
    for (const [x, y] of [[1, 3], [30, 3], [1, 21], [30, 21]]) for (let k = 0; k < 3; k++) { t.poser(x + (x < 15 ? k : -k), y, 'fer', 3); t.poser(x, y + (y < 12 ? k : -k), 'fer', 3); }
    // le soleil et la tour de la Confrérie, peints au pochoir
    t.forme('azur', (x, y) => (x >= 13 && x <= 18 && y >= 9 && y <= 17 ? [0, 0, 1] : null), { decalage: 0.1, ombre: false });
    t.forme('laiton', ellipsoide(15.5, 7, 2.2, 2.2), { decalage: 0.5, ombre: false });
    for (const x of [13, 15, 17]) t.poser(x, 8, 'azur', 3);
  });
  fabriquer('fait_assignation', 26, 20, t => {
    t.rampes.cireNoire = rampe(0x2a2024);
    for (let y = 0; y < 20; y++) for (let x = 0; x < 26; x++) t.poser(x, y, 'parchemin', x === 25 || y === 19 ? 2 : 4);
    for (const y of [3, 5, 7, 9]) for (let x = 2; x < 23; x++) if (hachage(x, y, 5) > 0.25) t.poser(x, y, 'encre', 2);
    // le cachet : une empreinte de patte dans la cire noire
    t.forme('cireNoire', ellipsoide(18, 14, 4.6, 4.2), { decalage: 0.2 });
    t.forme('encre', ellipsoide(18, 15.2, 1.8, 1.4), { decalage: -0.6, ombre: false });
    for (const [x, y] of [[15.6, 12.6], [17.2, 11.6], [18.8, 11.6], [20.4, 12.6]]) t.forme('encre', ellipsoide(x, y, 0.8, 0.8), { decalage: -0.6, ombre: false });
  });
}

Object.assign(CounterScene.prototype, {
  faitPoser(cle, x) { creerObjetsFaitsHD(this); return this.evtPoser(cle, x); },
  faitRetirer(o, dy = 30) { if (o && o.active) this.tweens.add({ targets: o, y: o.y + dy, alpha: 0, duration: 420, onComplete: () => o.destroy() }); },

  // --- 1. Le doyen : un vieux Banni dit sa phrase ; on peut l'écouter jusqu'au bout, ou le faire taire ---
  // (appelé par visiteAine, CounterScene.js) ; `radote` : la fin d'avant (il repart, la rue se moque)
  doyenAuComptoir(entree, a, radote) {
    const G = this.G, race = entree.race;
    if (!a || !a.recit || !a.recit.length || typeof ecouterDoyen !== 'function') return false;
    const fin = (texte, rue) => {
      this.dire(texte, a.nom);
      this.bouton('...', () => { if (rue) this.raconter(rue); this.bouton('...', null); this.time.delayedCall(rue ? 1800 : 400, () => this.partirPar(FENETRE.x - 80)); });
    };
    const taire = (parLaGarde = false) => {
      faireTaireDoyen(G, race);
      this.exprimer('inquiet');
      if (parLaGarde) return fin('(Les gardes le prennent chacun par un bras. Il ne se débat pas.) « Ce n’est rien, petit. J’ai l’habitude. »', 'La rue applaudit les gardes. Quelqu’un dit : « Bien fait. Il faisait peur aux clients. »');
      fin(`(${a.feminin ? 'Elle' : 'Il'} baisse la tête, et serre sa canne.) « Pardon. Je ne voulais pas t’attirer d’ennuis. »`, 'Dans la rue, on hoche la tête : « Il a bien raison. Pas de ces histoires-là, ici. »');
    };
    let page = 0, garde = gardeInterromptDoyen(G);
    const lire = () => {
      const dernier = page === a.recit.length - 1;
      this.dire(a.recit[page], a.nom);
      if (dernier) {
        this.bouton(a.feminin ? 'La remercier' : 'Le remercier', () => {
          ecouterDoyen(G, race);
          this.exprimer('content');
          fin('« Merci de m’avoir écouté jusqu’au bout. Plus personne ne le fait. »', 'Dans la rue, quelqu’un rit : « Les vieux racontent n’importe quoi. » Mais toi, tu te souviendras.');
        });
        return;
      }
      // à la deuxième page : on peut l'interrompre ; en Lumière, c'est la garde qui s'en charge
      if (page === 1 && garde) {
        garde = false;
        this.raconter('Deux gardes de la Confrérie s’approchent de la fenêtre : « Encore toi, le vieux ? On t’a déjà dit de garder tes histoires pour toi. Ce marchand-là, tu le laisses tranquille. »');
        this.choix(['« Laissez-le finir. »', () => { if (typeof regarder === 'function') regarder(G, 'confrerie', -2); this.raconter('Les gardes échangent un regard, haussent les épaules, et s’éloignent. Ils ont noté ton nom.'); page++; this.time.delayedCall(1400, lire); }, null, 'mal'],
          ['« Emmenez-le. »', () => taire(true), 'bien']);
        return;
      }
      if (page === 1) {
        this.choix(['Suite ▸', () => { page++; lire(); }, null, 'mal'], ['« Assez. Taisez-vous. »', () => taire(), 'bien']);
        return;
      }
      this.bouton('Suite ▸', () => { page++; lire(); });
    };
    this.choix(['« Racontez-moi. »', () => { this.exprimer('neutre'); lire(); }], ['« ... »', radote]);
    return true;
  },

  // --- 2. La fissure du Sage ---
  evt_fissure(e) {
    const G = this.G, f = FISSURES_SAGE.find(x => x.id === e.fissure), p = typeof palierCamp === 'function' ? palierCamp(G) : 0;
    if (!f) return this.evtFin();
    G.sageIci = G.jour;   // (en sa présence, la Clairvoyance s'éteint : le ☀ et le ☾ ne se voient plus)
    this.evtParchemin('Le Grand Sage', 'en tournée dans le bourg');
    if (typeof this.cadrerSageEnPied === 'function') this.cadrerSageEnPied();
    Son.jouer('cloche');
    this.evtDire(p >= 1 ? '« Mon enfant ! Le Rempart te doit beaucoup. Je passais, et je voulais te saluer moi-même. »'
      : p <= -1 ? '« Ah. Le marchand dont la garde parle tant. Je passais. Je voulais voir ton visage. »'
        : '« Un comptoir bien tenu, à ce qu’on dit. Je passais, et je voulais le voir de mes yeux. »', 'sage');
    this.bouton('« Grand Sage... »', () => {
      this.evtDire(f.sage, 'sage');
      this.bouton('...', () => {
        this.raconter(f.souvenir);
        if (f.fredon) this.evtPlus(500, () => this.evtFredon(7));
        this.choix(['Garder ça en mémoire', () => {
          evtFissure(G, e, 'garder');
          this.raconter('Tu souris au Sage, et tu ne dis rien. Mais quelque part en toi, une petite fêlure ne se referme pas.');
          this.evtPlus(900, () => { this.evtDire('« Que la Lumière te garde, mon enfant. »', 'sage'); this.bouton('« Au revoir, Grand Sage. »', () => this.evtFin()); });
        }, null, 'mal'], ['Chasser cette pensée', () => {
          evtFissure(G, e, 'chasser');
          this.raconter('Le Sage a sûrement raison. Il sait tant de choses. Tu chasses cette pensée, et elle s’en va.');
          this.evtPlus(900, () => { this.evtDire('« Le Rempart a besoin de cœurs simples. Le tien en est un. »', 'sage'); this.bouton('« Merci, Grand Sage. »', () => this.evtFin()); });
        }, 'bien']);
      });
    });
  },

  // --- 3. L'église-relais du chant ---
  evt_eglise(e) {
    const G = this.G, C = FAITS_HISTOIRE.eglise;
    if (e.qui === 'bannis') {
      this.evtParchemin('Ysolde Nuit-Close', 'une vampire, à la nuit tombée');
      const sac = this.faitPoser('fait_sac', SILL_GAUCHE_EVT + 6);
      this.evtDire('« Le jour où le Sage lancera son sort, c’est la cloche de ta chapelle qui portera l’oubli jusqu’à nous. Une pincée de limaille dans le battant, et elle sonnera faux. Garde ce sac jusqu’à demain. »', 'ysolde');
      this.choix(['Le cacher sous le comptoir', () => {
        evtEglise(G, e, 'saboter'); this.faitRetirer(sac, 40);
        this.exprimer('content');
        this.evtDire('« La nuit te le rendra. » (Elle remonte sa capuche, et la rue l’avale.)', 'ysolde');
        this.bouton('...', () => this.evtFin());
      }, null, 'mal'], ['« Pas chez moi. »', () => {
        evtEglise(G, e, 'refuser'); this.faitRetirer(sac, -6);
        this.exprimer('fache');
        this.evtDire('« Comme tu voudras. Les cloches sonneront pour toi aussi, un jour. »', 'ysolde');
        this.bouton('...', () => this.evtFin());
      }]);
      return;
    }
    this.evtParchemin('Sœur Clémence', 'de la chapelle du bourg');
    this.evtDire(`« Que la Lumière te garde. Notre cloche est un relais du chant : quand le Sage chantera, sa voix passera par elle. Des ombres rôdent autour du clocher. Pour la veille, il nous faudrait ${texteDon(C.don)}. »`, 'soeur');
    this.choix(['« Prenez-les, ma sœur. »', () => {
      const r = evtEglise(G, e, 'proteger'); this.bourse.maj(G.argent);
      this.exprimer('content');
      this.evtDire(`« Merci ! Cette nuit, nous veillerons. »${r.paye ? ` (Il t’en manquait : tu les as rachetés ${r.paye} p. au fournisseur.)` : ''}`, 'soeur');
      this.bouton('« Bonne veille, ma sœur. »', () => this.evtFin());
    }, null, 'bien'], ['« Je n’ai rien à donner. »', () => {
      evtEglise(G, e, 'refuser');
      this.exprimer('inquiet');
      this.evtDire('« Je comprends. Nous prierons pour avoir assez de lumière. »', 'soeur');
      this.bouton('...', () => this.evtFin());
    }]);
  },

  // --- 4. Le convoi de la Confrérie ---
  evt_convoi(e) {
    const G = this.G, C = FAITS_HISTOIRE.convoi, z = e.zone && ZONES[e.zone];
    if (e.qui === 'bannis') {
      this.evtParchemin('Fenrir Pas-Feutré', 'un éclaireur des Bannis');
      this.evtDire(`« Psst. Le convoi de la Confrérie charge ce soir, à deux rues d’ici${z ? `, pour la contrée ${deLieu(z.nom)}` : ''}. Par quelle porte sort-il, à l’aube ? D’ici, tu vois tout. »`, 'eclaireur');
      this.choix(['« Par la porte du moulin. »', () => {
        evtConvoi(G, e, 'renseigner');
        this.exprimer('content');
        this.evtDire('(Il montre les crocs : c’est un sourire.) « Les tiens mangeront ce soir, là-bas, dans les bois. Merci. »', 'eclaireur');
        this.bouton('...', () => this.evtFin());
      }, null, 'mal'], ['« Je ne sais rien. »', () => {
        evtConvoi(G, e, 'refuser');
        this.exprimer('fache');
        this.evtDire('« Bien sûr. Personne ne sait jamais rien. » (Il renifle l’air, et s’en va.)', 'eclaireur');
        this.bouton('...', () => this.evtFin());
      }]);
      return;
    }
    this.evtParchemin('Sergent Mathis Bourrel', 'intendance de la Confrérie');
    const caisse = this.faitPoser('fait_caisse', SILL_GAUCHE_EVT + 10);
    this.evtDire(`« Un convoi part à l’aube ${z ? `pour la contrée ${deLieu(z.nom)}, où l’on se bat` : 'vers les frontières'}. Il manque à chaque charrette ${texteDon(C.don)}. Tu nous les avances ? La Confrérie s’en souviendra. »`, 'intendant');
    this.choix([`Remplir la caisse`, () => {
      const r = evtConvoi(G, e, 'ravitailler'); this.bourse.maj(G.argent);
      this.exprimer('content');
      this.evtDire(`« Voilà qui tiendra chaud à l’escouade. »${r.paye ? ` (Il t’en manquait : ${r.paye} p. au fournisseur.)` : ''} (Il soulève la caisse d’un seul bras.)`, 'intendant');
      this.faitRetirer(caisse, -10);
      this.bouton('« Bonne route, sergent. »', () => this.evtFin());
    }, null, 'bien'], ['« Je n’ai rien en trop. »', () => {
      evtConvoi(G, e, 'refuser'); this.faitRetirer(caisse, -10);
      this.exprimer('neutre');
      this.evtDire('« Les temps sont durs pour tout le monde. » (Il note quelque chose sur sa tablette.)', 'intendant');
      this.bouton('...', () => this.evtFin());
    }]);
  },

  evt_convoiGuerre(e) { return this.evt_convoi(e); },

  // --- 5. Le Drômmath ---
  evt_drommath(e) {
    const G = this.G, D = etatFaits(G).drommath;
    this.evtParchemin('Nekhet', 'voix du Drômmath');
    this.evtDire('« Le Drômmath siège à la tombée du jour, à Cendrebourg. Il prépare la guerre qui vient : des lances, des remèdes, du pain pour les familles qui fuient. Chacun donne ce qu’il peut. »', 'nekhet');
    const peut = peutPayer(G, e.montant);
    this.choix([`Donner ${e.montant} p.`, () => {
      if (!peutPayer(G, e.montant)) return;
      evtDrommath(G, e, 'donner'); this.bourse.maj(G.argent);
      this.faitPoser('fait_jeton', SILL_GAUCHE_EVT + 14);
      this.exprimer('content');
      this.evtDire(`« Le Drômmath n’oublie pas. Garde ce jeton d’os : à Cendrebourg, il t’ouvrira des portes. »${D.dons > 1 ? ` (Tu as donné ${D.total.toLocaleString('fr-FR')} pièces au trésor de guerre.)` : ''}`, 'nekhet');
      this.bouton('« Que la nuit vous garde. »', () => this.evtFin());
    }, null, peut ? 'mal' : null], ['« Pas aujourd’hui. »', () => {
      evtDrommath(G, e, 'refuser');
      this.exprimer('neutre');
      this.evtDire('« Le jour viendra. Il vient toujours. »', 'nekhet');
      this.bouton('...', () => this.evtFin());
    }]);
  },

  // --- 6. L'avocat de « Monsieur Chat » (douze jours après la dénonciation du Parrain) ---
  evt_avocat(e) {
    const G = this.G, x = FAITS_HISTOIRE.parrain.avocat;
    this.evtParchemin('Maître Anselme Fouine', 'avocat au barreau du bourg');
    const papier = this.faitPoser('fait_assignation', SILL_GAUCHE_EVT + 6);
    this.evtDire(`« Maître Fouine, avocat. Mon client, disons… Monsieur Chat, vous poursuit pour atteinte à son honneur : vous l’avez traité de bandit devant la garde. Il réclame ${x} pièces. Ou trois croquettes d’or. »`, 'avocat');
    this.choix([`Payer ${x} p.`, () => {
      evtAvocat(G, e, 'payer'); this.bourse.maj(G.argent); this.faitRetirer(papier, -6);
      this.exprimer('content');
      this.evtDire('(Il recompte, deux fois.) « Mon client sera ravi. Il m’a chargé de vous dire : “Sans rancune. Presque.” »', 'avocat');
      this.bouton('...', () => this.evtFin());
    }], ['« Dehors ! »', () => {
      evtAvocat(G, e, 'dehors');
      this.exprimer('fache');
      this.evtDire('« Comme vous voudrez. Nous nous reverrons au tribunal. » (Il sort, en laissant derrière lui une légère odeur de poisson.)', 'avocat');
      this.bouton('...', () => this.evtFin());
    }]);
  },
});
