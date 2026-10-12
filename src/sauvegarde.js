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
        if (id) this.nuage = db.doc('data/users/' + id + '/sauvegarde');
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
    });
    return this.ecriture;
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
    Object.assign(window.GAME, JSON.parse(JSON.stringify(p.partie)));
    return window.GAME.lieu === 'Marche' ? 'Marche' : 'Nuit';
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

// Le petit texte « Partie sauvegardée ✓ » d'une scène, mis à jour à chaque sauvegarde.
function afficherStatutSauvegarde(scene, x, y, origineX) {
  const t = scene.add.text(x, y, Sauvegarde.statut, style(12, '#fff4dc', { fontStyle: 'italic', stroke: '#2a1a10', strokeThickness: 3 }))
    .setOrigin(origineX, 0.5).setDepth(25);
  Sauvegarde.surStatut = texte => { if (t.active) t.setText(texte); };
  scene.events.once('shutdown', () => { Sauvegarde.surStatut = null; });
}
