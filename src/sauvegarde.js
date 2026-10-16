// La sauvegarde de la partie, à trois endroits :
// 1. ce navigateur (localStorage), automatiquement ;
// 2. ton compte claude.ai (version en ligne uniquement), dans un espace privé ;
// 3. un code de sauvegarde à copier-coller, pour garder une copie ou changer d'appareil.
// On ne sauvegarde qu'à des moments calmes : le soir et le matin au marché.

const CLE_LOCALE = 'comptoir-des-aventuriers/sauvegarde';
const VERSION_SAUVEGARDE = 1;
const PREFIXE_CODE = 'COMPTOIR1:';

const Sauvegarde = {
  nuage: null,        // le document de ton compte, s'il est disponible
  nuagePret: null,    // la promesse de connexion au compte
  minuterie: null,
  ecriture: Promise.resolve(),
  statut: '',
  surStatut: null,    // appelé quand le statut change (pour l'afficher)

  // Se connecte à ton compte claude.ai si la page est ouverte dans claude.ai.
  connecterNuage() {
    if (this.nuagePret) return this.nuagePret;
    this.nuagePret = (async () => {
      try {
        if (!window.claude || !window.claude.use) return;
        const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
        if (!db || !user) return;
        const id = await user.id();
        if (id) { this.nuage = db.doc('data/users/' + id + '/sauvegarde'); this.docCompte = nom => db.doc('data/users/' + id + '/' + nom); }
      } catch (e) { this.nuage = null; }
    })();
    return this.nuagePret;
  },

  // Le paquet sauvegardé : la partie, et de quoi l'afficher dans la liste.
  paquet(G, lieu) {
    G.lieu = lieu;
    return JSON.parse(JSON.stringify({ version: VERSION_SAUVEGARDE, date: Date.now(), jour: G.jour, nom: nomJoueur(G), partie: G }));
  },

  // Sauvegarde un peu plus tard (on regroupe les clics rapprochés).
  planifier(G, lieu) {
    clearTimeout(this.minuterie);
    this.minuterie = setTimeout(() => this.maintenant(G, lieu), 1200);
  },

  // Sauvegarde tout de suite.
  maintenant(G, lieu) {
    clearTimeout(this.minuterie);
    // (v0.57) au matin, un point de reprise automatique : chaque semaine, et à chaque palier d'étoiles
    if (lieu === 'Marche' && !G.faillite) this.pointDeRepriseSiBesoin(G);
    const p = this.paquet(G, lieu);
    let local = false;
    try {
      localStorage.setItem(CLE_LOCALE, JSON.stringify(p));
      local = true;
    } catch (e) { /* navigation privée ou stockage bloqué */ }
    // Une seule écriture à la fois vers le compte.
    this.ecriture = this.ecriture.then(async () => {
      await this.connecterNuage();
      let nuage = false;
      if (this.nuage) {
        try { await this.nuage.set(p); nuage = true; } catch (e) { nuage = false; }
      }
      this.changerStatut(local || nuage
        ? `Partie sauvegardée ✓ (${[local && 'ce navigateur', nuage && 'ton compte'].filter(Boolean).join(' + ')})`
        : 'Sauvegarde impossible ici : pense au code de sauvegarde !');
    }).catch(() => {});   // (audit v0.59 : un échec ne doit pas bloquer les sauvegardes suivantes)
    return this.ecriture;
  },

  // --- (v0.57) Les points de reprise et les trois emplacements de sauvegarde ---
  // Un emplacement : 'reprise' (automatique), ou 1, 2, 3 (à la main). Dans ce navigateur, et sur
  // ton compte claude.ai quand il est disponible.
  cle(nom) { return CLE_LOCALE + '/' + (nom === 'reprise' ? 'reprise' : 'emplacement' + nom); },
  async ecrireEmplacement(nom, p) {
    let ok = false;
    try { localStorage.setItem(this.cle(nom), JSON.stringify(p)); ok = true; } catch (e) { /* stockage bloqué */ }
    await this.connecterNuage();
    if (this.docCompte) { try { await this.docCompte(nom === 'reprise' ? 'reprise' : 'emplacement' + nom).set(p); ok = true; } catch (e) { /* tant pis */ } }
    return ok;
  },
  async lireEmplacement(nom) {
    let locale = null, nuage = null;
    try { locale = JSON.parse(localStorage.getItem(this.cle(nom))); } catch (e) { locale = null; }
    await this.connecterNuage();
    if (this.docCompte) { try { const d = await this.docCompte(nom === 'reprise' ? 'reprise' : 'emplacement' + nom).get(); nuage = d.exists ? JSON.parse(JSON.stringify(d.data())) : null; } catch (e) { nuage = null; } }
    return [locale, nuage].filter(p => p && p.partie).sort((a, b) => b.date - a.date)[0] || null;
  },
  async emplacements() {
    const [reprise, a, b, c] = await Promise.all(['reprise', 1, 2, 3].map(n => this.lireEmplacement(n)));
    return { reprise, 1: a, 2: b, 3: c };
  },
  pointDeRepriseSiBesoin(G) {
    const paliers = (G.paliersEtoiles || []).length;
    const semaine = G.jour - (G.repriseJour || 0) >= 7;
    const palier = paliers !== (G.reprisePaliers || 1);
    if (!semaine && !palier && G.repriseJour) return;
    G.repriseJour = G.jour;
    G.reprisePaliers = paliers;
    const p = this.paquet(G, 'Marche');
    p.raison = palier ? 'Nouveau palier d\'étoiles' : 'Début de semaine';
    this.ecrireEmplacement('reprise', p);
  },
  // Sauvegarder à la main dans un emplacement : on y copie la dernière sauvegarde « au calme »
  // (le matin ou le soir), comme le dit le menu : en pleine journée, on reprend au matin.
  async sauverEmplacement(G, n) {
    const p = this.lireLocale() || this.paquet(G, 'Nuit');
    return this.ecrireEmplacement(n, { ...p, date: Date.now() });
  },

  changerStatut(texte) {
    this.statut = texte;
    if (this.surStatut) this.surStatut(texte);
  },

  lireLocale() {
    try {
      const p = JSON.parse(localStorage.getItem(CLE_LOCALE));
      return p && p.partie ? p : null;
    } catch (e) { return null; }
  },

  async lireNuage() {
    await this.connecterNuage();
    if (!this.nuage) return null;
    try {
      const s = await this.nuage.get();
      return s.exists ? JSON.parse(JSON.stringify(s.data())) : null;
    } catch (e) { return null; }
  },

  // Les sauvegardes trouvées, et la plus récente des deux.
  async trouver() {
    const locale = this.lireLocale();
    const nuage = await this.lireNuage();
    const meilleure = [locale, nuage].filter(Boolean).sort((a, b) => b.date - a.date)[0] || null;
    return { locale, nuage, meilleure, compte: !!this.nuage };
  },

  // Recharge une partie sauvegardée. Les champs ajoutés au jeu depuis gardent leur valeur de départ.
  charger(p) {
    nouvellePartie();
    const defauts = JSON.parse(JSON.stringify(window.GAME));
    const brut = JSON.parse(JSON.stringify(p.partie));
    const G = Object.assign(window.GAME, JSON.parse(JSON.stringify(p.partie)));
    // (audit v0.53) Les objets imbriqués (faucheuse, stats, journal...) gardent les sous-champs
    // ajoutés depuis : on complète avec les valeurs de départ au lieu de les écraser.
    for (const [k, d] of Object.entries(defauts)) {
      if (d && typeof d === 'object' && !Array.isArray(d) && brut[k] && typeof brut[k] === 'object' && !Array.isArray(brut[k])) G[k] = { ...d, ...brut[k] };
    }
    mettreAJourPartie(G, brut);
    return ['Marche', 'Maison'].includes(G.lieu) ? G.lieu : 'Nuit';
  },

  async supprimer() {
    try { localStorage.removeItem(CLE_LOCALE); } catch (e) { /* rien à faire */ }
    await this.connecterNuage();
    if (this.nuage) { try { await this.nuage.delete(); } catch (e) { /* tant pis */ } }
  },

  // Le code de sauvegarde : la partie, en texte copiable.
  exporter(p) {
    return PREFIXE_CODE + btoa(unescape(encodeURIComponent(JSON.stringify(p))));
  },

  importer(code) {
    const texte = code.trim();
    if (!texte.startsWith(PREFIXE_CODE)) throw new Error("Ce n'est pas un code de sauvegarde du Comptoir.");
    const p = JSON.parse(decodeURIComponent(escape(atob(texte.slice(PREFIXE_CODE.length)))));
    if (!p.partie) throw new Error('Ce code est incomplet.');
    return p;
  },
};

// La fenêtre « Sauvegardes » (en HTML, par-dessus le jeu) : copier ou coller un code, supprimer.
function ouvrirFenetreSauvegardes(trouvees, surCharger, surFermer) {
  const fond = document.createElement('div');
  fond.style.cssText = 'position:fixed;inset:0;background:rgba(10,6,3,.75);display:flex;align-items:center;justify-content:center;padding:16px;z-index:10;font-family:Georgia,serif';
  const boite = document.createElement('div');
  boite.style.cssText = 'background:#ead9b0;color:#3b2410;border:4px solid #8a6a3a;max-width:560px;width:100%;padding:20px;display:flex;flex-direction:column;gap:10px;max-height:100%;overflow:auto';
  fond.appendChild(boite);
  const decrire = p => p ? `${p.nom}, jour ${p.jour} — ${new Date(p.date).toLocaleString('fr-FR')}` : 'aucune';
  const titre = document.createElement('h2');
  titre.textContent = 'Sauvegardes';
  titre.style.cssText = 'margin:0;font-size:22px';
  const infos = document.createElement('p');
  infos.style.cssText = 'margin:0;font-size:14px;line-height:1.5';
  infos.textContent = `Ce navigateur : ${decrire(trouvees.locale)}\nTon compte claude.ai : ${trouvees.compte ? decrire(trouvees.nuage) : 'indisponible ici (seulement dans la version en ligne, connecté)'}`;
  infos.style.whiteSpace = 'pre-line';
  const etiquette = document.createElement('label');
  etiquette.htmlFor = 'code-sauvegarde';
  etiquette.textContent = 'Code de sauvegarde (copie-le pour le garder, ou colles-en un pour charger une partie) :';
  etiquette.style.fontSize = '13px';
  const zone = document.createElement('textarea');
  zone.id = 'code-sauvegarde';
  zone.rows = 5;
  zone.style.cssText = 'width:100%;box-sizing:border-box;font-family:monospace;font-size:11px;word-break:break-all';
  zone.value = trouvees.meilleure ? Sauvegarde.exporter(trouvees.meilleure) : '';
  const message = document.createElement('p');
  message.style.cssText = 'margin:0;font-size:13px;font-weight:bold;min-height:1.2em';
  const rangee = document.createElement('div');
  rangee.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px';
  const bouton = (texte, action) => {
    const b = document.createElement('button');
    b.textContent = texte;
    b.style.cssText = 'background:#8a5a2b;color:#fff4dc;border:2px solid #3b2410;padding:8px 12px;font:bold 14px Georgia,serif;cursor:pointer';
    b.addEventListener('click', action);
    rangee.appendChild(b);
    return b;
  };
  const fermer = () => { fond.remove(); if (surFermer) surFermer(); };
  bouton('Copier le code', () => {
    if (!zone.value) { message.textContent = 'Aucune sauvegarde à copier pour le moment.'; return; }
    const repli = () => { zone.focus(); zone.select(); message.textContent = 'Code sélectionné : fais Ctrl+C (ou Copier) pour le garder.'; };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(zone.value).then(() => { message.textContent = 'Code copié ! Garde-le précieusement.'; }, repli);
    } else repli();
  });
  bouton('Charger ce code', () => {
    try {
      const p = Sauvegarde.importer(zone.value);
      fond.remove();
      surCharger(p);
    } catch (e) {
      message.textContent = e.message || 'Ce code ne fonctionne pas.';
    }
  });
  let confirmation = false;
  const suppr = bouton('Supprimer la sauvegarde', async () => {
    if (!confirmation) {
      confirmation = true;
      suppr.textContent = 'Vraiment ? Clique encore pour supprimer';
      return;
    }
    await Sauvegarde.supprimer();
    message.textContent = 'Sauvegarde supprimée.';
    zone.value = '';
    suppr.textContent = 'Supprimer la sauvegarde';
    confirmation = false;
  });
  bouton('Fermer', fermer);
  boite.append(titre, infos, etiquette, zone, message, rangee);
  document.body.appendChild(fond);
}

// (v0.57) La fenêtre « Tes sauvegardes » : le point de reprise automatique, trois emplacements
// (sauvegarder ici / charger), et l'accès aux codes de sauvegarde.
async function ouvrirFenetreEmplacements({ peutSauver = false, surCharger, surFermer, surCodes = null }) {
  const fond = document.createElement('div');
  fond.style.cssText = 'position:fixed;inset:0;background:rgba(10,6,3,.75);display:flex;align-items:center;justify-content:center;padding:16px;z-index:10;font-family:Georgia,serif';
  const boite = document.createElement('div');
  boite.style.cssText = 'background:#ead9b0;color:#3b2410;border:4px solid #8a6a3a;max-width:600px;width:100%;padding:20px;display:flex;flex-direction:column;gap:12px;max-height:100%;overflow:auto';
  fond.appendChild(boite);
  document.body.appendChild(fond);
  const titre = document.createElement('h2');
  titre.textContent = 'Tes sauvegardes';
  titre.style.cssText = 'margin:0;font-size:22px';
  const message = document.createElement('p');
  message.style.cssText = 'margin:0;font-size:13px;font-weight:bold;min-height:1.2em';
  const liste = document.createElement('div');
  liste.style.cssText = 'display:flex;flex-direction:column;gap:8px';
  const bouton = (parent, texte, action) => {
    const b = document.createElement('button');
    b.textContent = texte;
    b.style.cssText = 'background:#8a5a2b;color:#fff4dc;border:2px solid #3b2410;padding:6px 10px;font:bold 13px Georgia,serif;cursor:pointer';
    b.addEventListener('click', action);
    parent.appendChild(b);
    return b;
  };
  const fermer = () => { fond.remove(); if (surFermer) surFermer(); };
  const decrire = p => p ? `${p.nom}, jour ${p.jour} — ${new Date(p.date).toLocaleString('fr-FR')}` : 'vide';
  const dessiner = async () => {
    liste.textContent = 'Recherche...';
    const e = await Sauvegarde.emplacements();
    liste.textContent = '';
    for (const nom of ['reprise', 1, 2, 3]) {
      const p = e[nom];
      const ligne = document.createElement('div');
      ligne.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;border:2px solid #b8965e;padding:8px;background:#f2e4c0';
      const texte = document.createElement('div');
      texte.style.cssText = 'font-size:14px;line-height:1.4;min-width:0;flex:1 1 220px';
      texte.innerHTML = '';
      const b1 = document.createElement('strong'); b1.textContent = nom === 'reprise' ? 'Point de reprise (automatique)' : `Emplacement ${nom}`;
      const b2 = document.createElement('div'); b2.textContent = decrire(p) + (nom === 'reprise' && p && p.raison ? ` · ${p.raison}` : '');
      texte.append(b1, b2);
      const actions = document.createElement('div');
      actions.style.cssText = 'display:flex;gap:6px';
      if (peutSauver && nom !== 'reprise') {
        let confirmer = false;
        const bs = bouton(actions, 'Sauvegarder ici', async () => {
          if (p && !confirmer) { confirmer = true; bs.textContent = 'Écraser ? Clique encore'; return; }
          const ok = await Sauvegarde.sauverEmplacement(window.GAME, nom);
          message.textContent = ok ? `Partie sauvegardée dans l'emplacement ${nom}.` : 'Sauvegarde impossible ici : pense au code de sauvegarde.';
          dessiner();
        });
      }
      if (p) bouton(actions, 'Charger', () => { fond.remove(); surCharger(p); });
      ligne.append(texte, actions);
      liste.appendChild(ligne);
    }
  };
  const bas = document.createElement('div');
  bas.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px';
  if (surCodes) bouton(bas, 'Codes de sauvegarde…', () => { fond.remove(); surCodes(); });
  bouton(bas, 'Fermer', fermer);
  const aide = document.createElement('p');
  aide.style.cssText = 'margin:0;font-size:13px;line-height:1.5';
  aide.textContent = 'Le point de reprise se fait tout seul, chaque semaine et à chaque nouveau palier d\'étoiles. Les trois emplacements sont à toi : sauvegarde où tu veux, quand tu veux (en pleine journée, tu reprendras au matin de ce jour-là).';
  boite.append(titre, aide, liste, message, bas);
  dessiner();
}

// Charge une partie depuis n'importe où (menu, faillite) : toutes les pages s'arrêtent, et l'on
// repart au bon endroit de la journée.
function lancerPartieChargee(sceneQuelconque, p) {
  const lieu = Sauvegarde.charger(p);
  const gestion = sceneQuelconque.scene.manager;
  for (const s of gestion.getScenes(false)) {
    // (audit v0.59) un arrêt immédiat : mis en file, il arrêtait la scène qu'on venait de relancer
    if (s.scene.key !== 'Hud' && (s.scene.isActive() || s.scene.isPaused() || s.scene.isSleeping())) gestion.stop(s.scene.key);
  }
  if (lieu === 'Maison') gestion.start('Nuit', { matin: true });
  else gestion.start(lieu, lieu === 'Nuit' ? { matin: false } : {});
}

// Le petit texte « Partie sauvegardée ✓ » d'une scène, mis à jour à chaque sauvegarde.
function afficherStatutSauvegarde(scene, x, y, origineX) {
  const t = scene.add.text(x, y, Sauvegarde.statut, style(12, '#fff4dc', { fontStyle: 'italic', stroke: '#2a1a10', strokeThickness: 3 }))
    .setOrigin(origineX, 0.5).setDepth(25);
  Sauvegarde.surStatut = texte => { if (t.active) t.setText(texte); };
  scene.events.once('shutdown', () => { Sauvegarde.surStatut = null; });
}

// Une partie sauvegardée avant une mise à jour du jeu : on complète ce qui manque.
// `brut` : la partie telle qu'elle était sauvegardée (avant d'être fondue dans une partie neuve,
// qui a déjà tous les champs récents : c'est donc sur elle qu'on regarde ce qui manquait).
function mettreAJourPartie(G, brut = G) {
  for (const id of Object.keys(ITEMS)) if (G.stock[id] === undefined) G.stock[id] = 0;
  G.zonesDecouvertes = G.zonesDecouvertes || [];
  G.employes = G.employes || [];
  G.materiaux = G.materiaux || {};
  for (const id of Object.keys(MATERIAUX)) if (G.materiaux[id] === undefined) G.materiaux[id] = 0;
  G.mal = G.mal || 0;
  if (!brut.reussites) {
    // (audit v0.53) Les réussites par camp d'avant la jauge : on les retrouve dans l'historique
    G.reussites = { bien: 0, mal: 0 };
    for (const h of G.historique || []) { const z = ZONES[h.zone]; if (h.issue === 'vivant' && z && z.camp) G.reussites[z.camp]++; }
  }
  G.reussites = { bien: 0, mal: 0, ...(G.reussites || {}) };
  if (!brut.malCorrige) {
    // (audit v0.53) Les missions en terres d'ombre ne comptent plus dans les « âmes offertes »
    // (audit v0.54 : on regarde la sauvegarde brute, la partie neuve a déjà malCorrige)
    G.malCorrige = true;
    let ombre = 0;
    for (const h of G.historique || []) { const z = ZONES[h.zone]; if (h.issue === 'vivant' && z && z.camp === 'mal') ombre++; }
    G.mal = Math.max(0, (G.mal || 0) - 0.5 * ombre);
    // Un camp scellé par l'ancienne règle (une seule mort suffisait) est recalculé
    if (G.camp) G.camp = palierCamp(Object.assign({}, G, { camp: null })) <= -1 ? 'mal' : 'bien';
  }
  // (audit v0.54) L'écart des réussites est borné pour que la jauge puisse toujours revenir
  if (G.reussites.bien - G.reussites.mal > JAUGE_CAMP.ecartMax) G.reussites.bien = G.reussites.mal + JAUGE_CAMP.ecartMax;
  if (G.reussites.mal - G.reussites.bien > JAUGE_CAMP.ecartMax) G.reussites.mal = G.reussites.bien + JAUGE_CAMP.ecartMax;
  G.objetsCamp = { bien: 0, mal: 0, ...(G.objetsCamp || {}) };
  G.palierJaugeVu = G.palierJaugeVu || 0;
  G.garde = G.garde || { visites: 0, dernier: 0, saisies: 0 };
  G.interdits = G.interdits || {};
  G.belOuvrage = G.belOuvrage || {};   // (v0.82)
  G.garrickVu = G.garrickVu || [];
  G.decalageJours = G.decalageJours || 0;
  G.ainesVus = G.ainesVus || []; G.ainesRecits = G.ainesRecits || []; G.trophees = G.trophees || [];
  // (v0.55) une partie ancienne a déjà ouvert des paliers : on ne lui fait pas sauter de temps après coup
  if (!brut.paliersEtoiles) G.paliersEtoiles = [1, ...new Set(zonesOuvertes(G).map(z => ZONES[z].danger))];
  G.chienNourri = G.chienNourri || 0;
  G.chienJour = G.chienJour || 0;
  G.fontaineJour = G.fontaineJour || 0;
  G.fontainePieces = G.fontainePieces || 0;
  G.nomShop = G.nomShop || NOM_SHOP_DEFAUT;
  G.ameliorations = { comptoir: 0, coffre: 0, chambre: 0, eclairage: 0, atelier: 0, ...(G.ameliorations || {}) };
  G.travaux = G.travaux || [];
  G.tutoVu = G.tutoVu || {};
  G.travauxFinis = G.travauxFinis || [];
  // Le forgeron s'appelle désormais Thorgal : on garde votre relation.
  for (const table of [G.relations, G.personnes]) {
    if (table && 'Brunehaut la Forgeronne' in table) {
      table['Thorgal le Forgeron'] = table['Brunehaut la Forgeronne'];
      delete table['Brunehaut la Forgeronne'];
    }
  }
  G.cadeaux = G.cadeaux || {};
  G.evenements = G.evenements || [];
  G.courrier = G.courrier || [];
  if (!brut.succes) {
    // Les retours réussis d'avant la mise à jour, par nombre d'étoiles.
    G.succes = {};
    for (const h of G.historique) {
      if (h.issue !== 'vivant') continue;
      const d = ZONES[h.zone] ? ZONES[h.zone].danger : 1;
      G.succes[d] = (G.succes[d] || 0) + 1;
      const p = G.personnes[h.nom] = G.personnes[h.nom] || { race: h.race };
      p.succes = (p.succes || 0) + 1;
    }
  }
  G.expressMateriaux = G.expressMateriaux || {};
  G.pieges = G.pieges || {};
  if (!brut.faucheuse) G.faucheuse = { faveur: 0, morts: G.historique.filter(h => !['vivant', 'echec'].includes(h.issue)).length, visites: 0, cadeau: false, mission: null, sabotages: 0 };
  for (const t of G.tresors) {
    if (t.reparation && !t.reparation.ouvrier) t.reparation.ouvrier = 'toi';
    if (t.reparation && !t.reparation.cible) t.reparation.cible = t.etat + 1;
    if (t.etatInitial === undefined) t.etatInitial = t.etat;
  }
  const voyageurs = [...G.annonces.map(a => a.voyageur), ...G.partis.map(p => p.voyageur)];
  for (const v of voyageurs) {
    if (!v.niveau) v.niveau = 'aguerri';
    if (!v.envie) v.envie = 'gloire';
    if (v.queteId && !v.zone) v.zone = zoneDeQuete(v.queteId);
  }
  for (const h of G.habitues) if (!h.niveau) h.niveau = 'aguerri';
  if (!brut.conquete) {
    // La conquête des contrées, d'après les retours réussis déjà notés au registre.
    G.conquete = {};
    for (const h of G.historique) if (h.issue === 'vivant' && ZONES[h.zone]) G.conquete[h.zone] = (G.conquete[h.zone] || 0) + 1;
  }
  G.piecesAVenir = G.piecesAVenir || [];
  if (G.palierVu === undefined) G.palierVu = 0;
  G.decos = G.decos || [];
  G.garderobe = G.garderobe || [...(G.tenue || [])];   // (v0.69 : ce qu'on possède ; G.tenue = ce qu'on porte)
  G.tenue = G.tenue || [];
  G.zonesDecouvertes = [...new Set(G.zonesDecouvertes)];
  if (!brut.zonesConnues) {
    // Les zones déjà ouvertes avant l'armure : leurs pièces sont déjà sur le mannequin.
    const auDepart = Object.keys(ZONES).filter(z => ZONES[z].danger <= 2 && !ZONES[z].reputation);
    G.zonesConnues = zonesOuvertes(G);
    G.armure = ARMURE.slice(0, G.zonesConnues.filter(z => !auDepart.includes(z)).length).map(p => p.id);
    G.nouvellesPieces = [];
  }
  // (v0.61) Une partie d'avant : nouvellePartie() a posé royaumesRecompenses = [], ce qui ferait livrer
  // de nouveau chaque royaume déjà libéré. On l'efface : recompenserZones() fera la migration (les
  // royaumes déjà libérés donnent leur arme sans cérémonie, et aucune pièce d'armure en plus).
  if (!brut.royaumesRecompenses) delete G.royaumesRecompenses;
  // (v0.61) un prêt de la Main Noire contracté avant la v0.60 : on lui appartient déjà un peu
  if ((G.prets || []).some(p => p.preteur === 'La Main Noire')) engagerMafia(G);
  // (v0.61) Aube-Lame n'est plus une pièce de l'armure : elle rejoint les armes légendaires
  G.armesLegendaires = G.armesLegendaires || [];
  if (G.armure.includes('lame')) {
    G.armure = G.armure.filter(id => id !== 'lame');
    if (!G.armesLegendaires.includes('aubeLame')) G.armesLegendaires.push('aubeLame');
  }
  G.armure = G.armure.filter(id => ARMURE.some(p => p.id === id));
  if (!brut.revueV089) revoirVieillePartie(G);
  // (v0.90) la balance devient un compteur de points : une vieille partie la reprend là où elle était
  if (!brut.lo) G.lo = { points: jaugeAncienne(G), journal: [], serment: null, offres: {}, parjures: 0, carrefour: null, parjure: null };
  G.lo = { journal: [], offres: {}, parjures: 0, ...G.lo };
}

// (v0.89) Une partie commencée avant les règles actuelles pouvait garder une pièce d'armure gagnée
// à l'ancienne (par contrée ouverte) et voir les terres des Bannis sans être jamais descendue au
// marché noir. On la remet d'aplomb une fois : une pièce par royaume libéré, pas plus (sauf camp
// déjà scellé), et les Bannis cachés tant qu'on n'a ni visité le marché noir ni rien fait chez eux.
function revoirVieillePartie(G) {
  G.revueV089 = true;
  if (!G.camp) {
    const liberes = Object.keys(ROYAUMES).filter(r => royaumeLibere(G, r)).length;
    if (G.armure.length > liberes) {
      G.armure = G.armure.slice(0, liberes);
      G.nouvellesPieces = (G.nouvellesPieces || []).filter(n => !n.piece || G.armure.includes(n.piece));
    }
  }
  const ombre = z => ZONES[z] && ZONES[z].camp === 'mal';
  const vraimentDescendu = G.visiteMarcheNoir > 0;   // (0 : posé par l'ancienne migration v0.58)
  const traces = (G.historique || []).some(h => ombre(h.zone))
    || Object.keys(G.conquete || {}).some(z => ombre(z) && G.conquete[z] > 0)
    || [...(G.annonces || []), ...(G.partis || [])].some(a => a.voyageur && ombre(a.voyageur.zone));
  if (!vraimentDescendu && !traces) {
    delete G.visiteMarcheNoir;
    G.zonesDecouvertes = G.zonesDecouvertes.filter(z => !ombre(z));
    G.zonesConnues = (G.zonesConnues || []).filter(z => !ombre(z));
  }
}

// Une petite fenêtre pour écrire un texte (le nom du shop). `surValider(texte)` reçoit le texte
// nettoyé, ou rien si on annule.
function demanderTexte(titre, valeur, max, surValider) {
  const fond = document.createElement('div');
  fond.style.cssText = 'position:fixed;inset:0;background:rgba(10,6,3,.75);display:flex;align-items:center;justify-content:center;padding:16px;z-index:10;font-family:Georgia,serif';
  const boite = document.createElement('form');
  boite.style.cssText = 'background:#ead9b0;color:#3b2410;border:4px solid #8a6a3a;max-width:440px;width:100%;padding:20px;display:flex;flex-direction:column;gap:12px';
  const etiquette = document.createElement('label');
  etiquette.textContent = titre;
  etiquette.htmlFor = 'texte-demande';
  etiquette.style.cssText = 'font-size:18px;font-weight:bold';
  const champ = document.createElement('input');
  champ.id = 'texte-demande';
  champ.maxLength = max;
  champ.value = valeur;
  champ.style.cssText = 'font:16px Georgia,serif;padding:8px;border:2px solid #8a6a3a;background:#fff8e8;color:#3b2410';
  const rangee = document.createElement('div');
  rangee.style.cssText = 'display:flex;gap:8px;justify-content:flex-end';
  const bouton = (texte, type) => {
    const b = document.createElement('button');
    b.type = type;
    b.textContent = texte;
    b.style.cssText = 'background:#8a5a2b;color:#fff4dc;border:2px solid #3b2410;padding:8px 14px;font:bold 14px Georgia,serif;cursor:pointer';
    rangee.appendChild(b);
    return b;
  };
  const fermer = texte => { fond.remove(); surValider(texte); };
  bouton('Annuler', 'button').addEventListener('click', () => fermer(null));
  bouton('Valider', 'submit');
  boite.addEventListener('submit', e => {
    e.preventDefault();
    const texte = champ.value.replace(/\s+/g, ' ').trim();
    fermer(texte || null);
  });
  boite.append(etiquette, champ, rangee);
  fond.appendChild(boite);
  document.body.appendChild(fond);
  champ.focus();
  champ.select();
}
