// (v1.64) Les sons des récits, validés par le joueur sur la page d'écoute (docs/planches-v059/sons-recits-v161.html) :
// les neuf musiques d'aventure (« En route », « Le danger approche », « Victoire ! » pour la forêt, la montagne et le
// marais), les trois morts d'un voyageur (selon l'endroit où il est tombé) et les bruitages gardés (les pas selon le
// sol, la lourde porte, l'épée tirée, la flèche, le feu de camp, la torche, le vent des cols, le corbeau, les moutons,
// les crapauds, l'aiguille et le cuir, la besace). Le marteau, la foule et la cloche du marché sont refaits à part
// (src/sonsRefaits.js), en attente du choix du joueur.
//
// Sobre en charge : un bruitage n'est fabriqué qu'une fois (rendu hors ligne dans un tampon, quelques variantes au
// plus), puis rejoué depuis le cache. Tout passe par les bus du jeu : les réglages de volume sont respectés.

// --- Deux petits outils pour les bruitages (à côté de Son.bruit) ---
Object.assign(Son, {
  // Un bruit filtré dont le filtre glisse de `de` à `a` Hz (ou passe par `par` à mi-chemin), avec une attaque et, si
  // on veut, une tenue (`relache` : la durée de la fin) : un frottement, un pas, le vent
  bruitGlisse(t, duree, bus, { type = 'bandpass', de = 1000, a = de, par = 0, q = 1, volume = 0.2, attaque = 0.005, relache = 0 } = {}) {
    const ctx = this.ctx, n = Math.max(1, Math.floor(ctx.sampleRate * duree)), buf = ctx.createBuffer(1, n, ctx.sampleRate), x = buf.getChannelData(0);
    for (let i = 0; i < n; i++) x[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = type; f.Q.value = q; f.frequency.setValueAtTime(de, t);
    if (par) { f.frequency.linearRampToValueAtTime(par, t + duree / 2); f.frequency.linearRampToValueAtTime(a, t + duree); }
    else if (a !== de) f.frequency.exponentialRampToValueAtTime(a, t + duree);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0005, t); g.gain.exponentialRampToValueAtTime(volume, t + attaque);
    if (relache) g.gain.setValueAtTime(volume, t + Math.max(attaque, duree - relache));
    g.gain.exponentialRampToValueAtTime(0.0005, t + duree);
    src.connect(f); f.connect(g); g.connect(bus); src.start(t); src.stop(t + duree + 0.05);
    return { src, f, g };
  },
  // Une note qui glisse de `de` à `a` Hz (un choc, une corde, un cri de bête), avec une attaque
  tonGlisse(t, duree, bus, { forme = 'sine', de = 440, a = de, volume = 0.2, attaque = 0.005, filtre = 0 } = {}) {
    const ctx = this.ctx, o = ctx.createOscillator(); o.type = forme;
    o.frequency.setValueAtTime(de, t); if (a !== de) o.frequency.exponentialRampToValueAtTime(a, t + duree);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0005, t); g.gain.exponentialRampToValueAtTime(volume, t + attaque); g.gain.exponentialRampToValueAtTime(0.0005, t + duree);
    if (filtre) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filtre; f.Q.value = 0.7; o.connect(f); f.connect(g); } else o.connect(g);
    g.connect(bus); o.start(t); o.stop(t + duree + 0.05);
    return { o, g };
  },

  // --- Le cache des bruitages : un son marqué `cache` (voir SONS_EN_CACHE) est rendu une fois hors ligne, puis
  // rejoué depuis son tampon. Une clé par réglage (le sol des pas, la durée du vent...), et quelques variantes tirées
  // au sort pour les sons qui doivent varier (les pas). Sans rendu hors ligne possible, le son se joue en direct.
  caches: {},
  // Le tampon prêt de ce son, joué dans `bus` (la première fois, le son se joue en direct pendant qu'on le fabrique). `o.volume` : un gain en plus (les pas du héros en ville)
  jouerCache(nom, bus, o = {}) {
    const S = SONS[nom], spec = S.cache, cle = nom + (spec.cle ? '|' + spec.cle(o) : '');
    const c = this.caches[cle] || (this.caches[cle] = { prets: [], enCours: 0, dernier: -1 });
    const ctx = this.ctx;
    const lire = buf => {
      if (this.ctx !== ctx) return;
      const src = ctx.createBufferSource(); src.buffer = buf;
      let sortie = bus;
      if (o.volume != null && o.volume !== 1) { sortie = ctx.createGain(); sortie.gain.value = Math.max(0, o.volume); sortie.connect(bus); }
      src.connect(sortie); src.start(ctx.currentTime + 0.005);
      src.onended = () => { try { src.disconnect(); if (sortie !== bus) sortie.disconnect(); } catch (e) { /* (déjà débranché) */ } };
      if (this.surJoue) this.surJoue(nom, o);
    };
    if (c.prets.length) {
      let i = Math.floor(Math.random() * c.prets.length);
      if (c.prets.length > 1 && i === c.dernier) i = (i + 1) % c.prets.length;   // (jamais deux fois de suite la même variante)
      c.dernier = i; lire(c.prets[i]);
      if (c.prets.length + c.enCours < (spec.variantes || 1)) this.rendreCache(nom, cle, o);
      return;
    }
    // pas encore de tampon : cette fois, le son se joue en direct (sans attendre), et on le fabrique pour les suivantes
    if (!c.enCours && !c.echec) this.rendreCache(nom, cle, o);
    let direct = bus;
    if (o.volume != null && o.volume !== 1) { direct = ctx.createGain(); direct.gain.value = Math.max(0, o.volume); direct.connect(bus); setTimeout(() => { try { direct.disconnect(); } catch (e) { /* (rien) */ } }, 12000); }
    S.call(this, ctx.currentTime + 0.01, direct, o);
    if (this.surJoue) this.surJoue(nom, o);
  },
  // Fabriquer une variante de plus de ce son (hors ligne, sur le fil du son) ; renvoie le tampon, ou null
  rendreCache(nom, cle, o = {}) {
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const c = this.caches[cle] || (this.caches[cle] = { prets: [], enCours: 0, dernier: -1 });
    if (!OAC || !this.ctx || c.echec) return Promise.resolve(null);
    const spec = SONS[nom].cache, duree = typeof spec.duree === 'function' ? spec.duree(o) : spec.duree, taux = this.ctx.sampleRate;
    let hors;
    c.enCours++;
    try {
      hors = new OAC(1, Math.ceil(taux * duree), taux);
      const vrai = this.ctx;
      this.ctx = hors;
      try { const sortie = hors.createGain(); sortie.connect(hors.destination); SONS[nom].call(this, 0.02, sortie, o); }   // (0,02 s : les pas tirent leur instant au hasard autour du leur)
      finally { this.ctx = vrai; }
    } catch (e) { c.enCours--; c.echec = true; c.erreur = String(e && e.message || e); return Promise.resolve(null); }
    return new Promise(fini => {
      let fait = false;
      const finir = buf => { if (!fait) { fait = true; fini(buf); } };
      hors.oncomplete = e => finir(e.renderedBuffer);
      try { const p = hors.startRendering(); if (p && p.then) p.then(finir, e => { c.erreur = String(e && e.message || e); finir(null); }); } catch (e) { c.erreur = String(e && e.message || e); finir(null); }
    }).then(buf => {
      c.enCours--;
      if (!buf) { c.echec = true; return null; }
      // (on coupe le silence de la fin : moins de mémoire)
      const x = buf.getChannelData(0); let n = x.length;
      while (n > 1 && Math.abs(x[n - 1]) < 0.0002) n--;
      let garde = buf;
      if (n < x.length - taux * 0.05 && this.ctx) { garde = this.ctx.createBuffer(1, n + 64, taux); garde.getChannelData(0).set(x.subarray(0, n)); }
      c.prets.push(garde);
      return garde;
    });
  },
  // Préparer d'avance les sons d'un moment (le récit d'une contrée) : un par un, sans à-coup
  prechauffer(liste) {
    if (!this.pret || !this.ctx) return;
    let k = 0;
    const suivant = () => {
      if (k >= liste.length || !this.pret) return;
      const [nom, o = {}] = liste[k++], S = SONS[nom];
      if (!S || !S.cache) return suivant();
      const cle = nom + (S.cache.cle ? '|' + S.cache.cle(o) : ''), c = this.caches[cle];
      if (c && (c.prets.length || c.enCours || c.echec)) return suivant();
      this.rendreCache(nom, cle, o).then(() => setTimeout(suivant, 30));
    };
    setTimeout(suivant, 60);
  },
  // Un son « de temps en temps » : pas plus d'une fois tous les `ecart` ms (les moutons qui bêlent, les crapauds)
  jouerParfois(nom, ecart, o = {}) {
    const t = Date.now(), cle = o.parfois || nom;
    this.derniersParfois = this.derniersParfois || {};
    if (t - (this.derniersParfois[cle] || 0) < ecart) return false;
    this.derniersParfois[cle] = t;
    this.jouer(nom, o);
    return true;
  },
  // (v1.64) Un son qui joue seul : la musique s'arrête (en fondu), le son passe, puis la musique `reprise` revient
  // doucement si personne n'en a changé entre-temps. Renvoie la durée du silence (ms).
  jouerSeul(nom, o = {}, reprise = null, duree = 7) {
    if (!this.pret) return 0;
    this.arreter();
    this.jouer(nom, o);
    clearTimeout(this.repriseSeul);
    if (reprise) this.repriseSeul = setTimeout(() => { if (!this.theme && this.themeVoulu === reprise) { this.themeVoulu = null; this.ambiance(reprise); } }, duree * 1000);
    return duree * 1000;
  },
});

// --- (v1.64, retour du joueur) Les sons du second plan : les moutons du pré. Lointains (plus bas, sans leurs aigus,
// un peu plus de réverbération), jamais par-dessus le premier plan : dès qu'un autre son ou une réplique joue, ils se
// baissent encore, et ils se taisent tout à fait si le premier plan vient de parler.
const SONS_SECOND_PLAN = new Set(['moutons']);
const SECOND_PLAN = { volume: 0.3, baisse: 0.08, filtre: 1500, reverb: 0.5, silence: 1.2, remonte: 1.6 };
Object.assign(Son, {
  busLointain() {
    if (this.lointain && this.lointain.ctx === this.ctx) return this.lointain.g;
    const ctx = this.ctx, g = ctx.createGain(), f = ctx.createBiquadFilter(), r = ctx.createGain();
    g.gain.value = SECOND_PLAN.volume; f.type = 'lowpass'; f.frequency.value = SECOND_PLAN.filtre; f.Q.value = 0.7; r.gain.value = SECOND_PLAN.reverb;
    g.connect(f); f.connect(this.busSons); f.connect(r); r.connect(this.reverb);
    this.lointain = { ctx, g };
    return g;
  },
  // un son du premier plan : le second plan se baisse, puis remonte doucement
  baisserLointain() {
    this.dernierPremierPlan = Date.now();
    const L = this.lointain; if (!L || L.ctx !== this.ctx) return;
    const t = this.ctx.currentTime, p = L.g.gain;
    p.cancelScheduledValues(t); p.setValueAtTime(p.value, t); p.linearRampToValueAtTime(SECOND_PLAN.baisse, t + 0.05);
    p.setValueAtTime(SECOND_PLAN.baisse, t + SECOND_PLAN.remonte); p.linearRampToValueAtTime(SECOND_PLAN.volume, t + SECOND_PLAN.remonte + 1);
  },
  jouerLointain(nom, o = {}) {
    if (Date.now() - (this.dernierPremierPlan || 0) < SECOND_PLAN.silence * 1000) return;   // (le premier plan vient de parler : on se tait)
    this.reprendre();
    const S = SONS[nom], bus = this.busLointain();
    if (S.cache) return this.jouerCache(nom, bus, o);
    S.call(this, this.ctx.currentTime + 0.01, bus, o);
  },
});
{
  const jouerDuJeu = Son.jouer;
  Son.jouer = function (nom, options = {}) {
    if (!this.pret) return;
    if (SONS_SECOND_PLAN.has(nom)) return this.jouerLointain(nom, options);
    this.baisserLointain();
    return jouerDuJeu.call(this, nom, options);
  };
}

// ======================================================================================
// Les musiques d'aventure (au format de THEMES)
// ======================================================================================
// « En route » : une marche en ré dorien (la sixte majeure du dorien, un peu celtique), 12 mesures.
// Le motif revient à chaque tour (mesures 0-7, 10-11), les mesures 8 et 9 sont brodées.
THEMES.aventureForet = {
  base: NOTE.D / 2, gamme: GAMMES.dorien, tempo: 104, temps: 4, phrase: 12,
  accords: [0, 0, 6, 3, 0, 2, 6, 4, 0, 6, 3, 0], octaveMelodie: 1,
  instruments: { melodie: 'flute', accompagnement: 'luth', basse: 'basse' }, reverb: 0.25,
  motif: {
    0: [[0, 7, 1], [1, 9, 0.5], [1.5, 10, 0.5], [2, 11, 1.5], [3.5, 10, 0.5]],
    1: [[0, 11, 1], [1, 12, 1], [2, 11, 1], [3, 9, 1]],
    2: [[0, 10, 1.5], [1.5, 9, 0.5], [2, 8, 1], [3, 10, 1]],
    3: [[0, 7, 3], [3, 8, 1]],
    4: [[0, 7, 1], [1, 9, 0.5], [1.5, 10, 0.5], [2, 11, 1], [3, 14, 1]],
    5: [[0, 13, 1.5], [1.5, 12, 0.5], [2, 11, 2]],
    6: [[0, 13, 1], [1, 11, 1], [2, 10, 1], [3, 9, 1]],
    7: [[0, 11, 4]],
    10: [[0, 12, 1], [1, 11, 1], [2, 10, 2]],
    11: [[0, 8, 1], [1, 9, 1], [2, 7, 2]],
  },
  rythmes: [[1, 1, 2], [1.5, 0.5, 1, 1], [1, 1, 1, 1], [2, 1, 1]], silence: 0.15,
  basse: (m, a) => [[0, a, 1.8], [2, a + 4, 1.8]],
  accompagnement: (m) => [[0, 0, 0.9, 0.5], [0.5, 2, 0.5, 0.28], [1, 1, 0.9, 0.38], [1.5, 2, 0.5, 0.28], [2, 0, 0.9, 0.45], [2.5, 2, 0.5, 0.28], [3, 1, 0.9, 0.38], [3.5, 3, 0.5, 0.25]],
  percussion: (m) => [[0, 'tambour', 0.55], [1, 'bois', 0.35], [2, 'tambour', 0.4], [3, 'bois', 0.35], [3.5, 'bois', 0.2]],
};
// La montagne : la même marche en mixolydien (plus clair, plus vaste), la vielle sur un bourdon
// qui tient toujours la tonique, de grandes cordes, une timbale toutes les quatre mesures
THEMES.aventureMontagne = Object.assign({}, THEMES.aventureForet, {
  gamme: GAMMES.mixolydien, tempo: 92, reverb: 0.5, silence: 0.2,
  accords: [0, 0, 6, 3, 0, 6, 6, 4, 0, 6, 3, 0],
  instruments: { melodie: 'vielle', accompagnement: 'cordes', basse: 'bourdon' },
  basse: (m) => [[0, 0, 3.9]], forceBasse: 2.5,
  accompagnement: (m) => [[0, 0, 3.9, 1], [0, 1, 3.9, 0.75], [0, 2, 3.9, 0.75]],
  percussion: (m) => [[0, 'timbale', m % 4 === 0 ? 0.5 : 0.3], [2, 'tambour', 0.45], [3.5, 'bois', 0.3]],
});
// Le marais : en mineur, plus lent, la vielle dans le grave, des cordes pincées, des gouttes
THEMES.aventureMarais = Object.assign({}, THEMES.aventureForet, {
  gamme: GAMMES.mineur, tempo: 84, octaveMelodie: 0, reverb: 0.6, lie: 1.1, silence: 0.3,
  accords: [0, 0, 6, 3, 0, 6, 3, 4, 0, 6, 3, 0],
  instruments: { melodie: 'vielle', accompagnement: 'pizzicato', basse: 'bourdon' },
  basse: (m) => [[0, 0, 3.9]], forceBasse: 1.5,
  accompagnement: (m) => [[0, 0, 0.8, 0.85], [1, 2, 0.8, 0.6], [2, 1, 0.8, 0.7], [3, 2, 0.8, 0.55]],
  percussion: (m) => [[0, 'tambour', 0.45], [1.5 + (m % 3) * 0.5, 'goutte', 0.6], [2, 'bois', 0.3]],
});

// « Le danger approche » : mi mineur harmonique (le ré dièse qui inquiète), un ostinato de cordes
// pincées et un tambour au galop ; la phrase finit sur l'accord de si majeur, qui relance la boucle
THEMES.dangerForet = {
  base: NOTE.E / 2, gamme: GAMMES.harmonique, tempo: 116, temps: 4, phrase: 12,
  accords: [0, 0, 5, 5, 0, 0, 3, 4, 5, 3, 4, 4], octaveMelodie: 1,
  instruments: { melodie: 'vielle', accompagnement: 'pizzicato', basse: 'basse' }, reverb: 0.3,
  motif: {
    0: [[0, 7, 0.5], [0.5, 8, 0.5], [1, 7, 1], [2, 11, 1.5], [3.5, 10, 0.5]],
    1: [[0, 9, 1], [1, 8, 0.5], [1.5, 7, 0.5], [2, 6, 2]],
    2: [[0, 12, 0.5], [0.5, 11, 0.5], [1, 12, 1], [2, 14, 1.5], [3.5, 12, 0.5]],
    3: [[0, 11, 2], [2, 9, 1], [3, 8, 1]],
    4: [[0, 7, 0.5], [0.5, 8, 0.5], [1, 7, 1], [2, 11, 1.5], [3.5, 12, 0.5]],
    5: [[0, 11, 1], [1, 10, 1], [2, 9, 1], [3, 8, 1]],
    6: [[0, 10, 1.5], [1.5, 12, 0.5], [2, 14, 2]],
    7: [[0, 13, 2], [2, 11, 2]],
    10: [[0, 11, 0.5], [0.5, 13, 0.5], [1, 15, 1], [2, 13, 1], [3, 11, 1]],
    11: [[0, 11, 1], [1, 12, 1], [2, 13, 2]],
  },
  rythmes: [[0.5, 0.5, 1, 1, 1], [1, 1, 1, 1], [0.5, 0.5, 0.5, 0.5, 2]], silence: 0.12,
  basse: (m, a) => [[0, a, 0.7], [0.75, a, 0.25], [1, a, 0.9], [2, a, 0.7], [2.75, a, 0.25], [3, a + 4, 0.9]],
  accompagnement: (m) => Array.from({ length: 8 }, (_, i) => [i * 0.5, i % 4 === 0 ? 0 : (i % 2 ? 2 : 1), 0.4, i % 2 ? 0.28 : 0.4]),
  percussion: (m) => [[0, 'tambour', 0.9], [0.75, 'tambour', 0.35], [1, 'tambour', 0.55], [2, 'tambour', 0.85], [2.75, 'tambour', 0.35], [3, 'tambour', 0.55], [1.5, 'bois', 0.3], [3.5, 'bois', 0.3], ...(m % 4 === 3 ? [[3.5, 'timbale', 0.6]] : [])],
};
// La montagne : des cuivres sombres, des cordes en trémolo, les timbales qui roulent en fin de phrase
THEMES.dangerMontagne = Object.assign({}, THEMES.dangerForet, {
  tempo: 100, reverb: 0.55, octaveMelodie: 0,
  instruments: { melodie: 'cuivres', accompagnement: 'cordesTremolo', basse: 'basse' },
  accompagnement: (m) => Array.from({ length: 16 }, (_, i) => [i * 0.25, i % 2 ? 1 : 0, 0.22, 0.22 + (i / 16) * 0.15]),
  percussion: (m) => [[0, 'timbale', 0.9], [2, 'timbale', 0.6], [3, 'tambour', 0.4], ...(m % 4 === 3 ? Array.from({ length: 8 }, (_, j) => [2 + j * 0.25, 'timbale', 0.15 + j * 0.06]) : [])],
});
// Le marais : la gamme hantée (celle de la tour), le violoncelle, un bourdon, le cœur, des gouttes
THEMES.dangerMarais = Object.assign({}, THEMES.dangerForet, {
  gamme: GAMMES.hante, tempo: 80, reverb: 0.7, lie: 1.2, silence: 0.3, octaveMelodie: 0,
  instruments: { melodie: 'violoncelle', accompagnement: 'pizzicato', basse: 'bourdon' },
  basse: (m) => [[0, 0, 3.9]], forceBasse: 1.4,
  accompagnement: (m) => [[0, 0, 0.5, 0.7], [1.5, 1, 0.5, 0.5], [2, 0, 0.5, 0.6], [3.5, 2, 0.5, 0.5]],
  percussion: (m) => [[0, 'coeur', 0.6], [0.4, 'coeur', 0.35], [1.25 + (m % 3) * 0.75, 'goutte', 0.55], ...(m % 2 ? [[3, 'souffle', 0.8]] : [])],
});

// « Victoire ! » : sol majeur, un motif de fanfare (sol-sol-si-ré-sol), le luth qui gratte, le tambourin
THEMES.triompheForet = {
  base: NOTE.G / 2, gamme: GAMMES.majeur, tempo: 112, temps: 4, phrase: 12,
  accords: [0, 0, 3, 4, 0, 5, 3, 4, 3, 4, 0, 0], octaveMelodie: 1,
  instruments: { melodie: 'fluteDouce', accompagnement: 'luth', basse: 'basse' }, reverb: 0.3,
  motif: {
    0: [[0, 7, 0.5], [0.5, 7, 0.5], [1, 9, 0.5], [1.5, 11, 0.5], [2, 14, 2]],
    1: [[0, 13, 1], [1, 12, 0.5], [1.5, 11, 0.5], [2, 12, 1], [3, 9, 1]],
    2: [[0, 10, 1.5], [1.5, 12, 0.5], [2, 14, 1], [3, 12, 1]],
    3: [[0, 11, 3], [3, 8, 1]],
    4: [[0, 7, 0.5], [0.5, 7, 0.5], [1, 9, 0.5], [1.5, 11, 0.5], [2, 14, 1.5], [3.5, 16, 0.5]],
    5: [[0, 16, 1], [1, 14, 1], [2, 12, 2]],
    6: [[0, 14, 1], [1, 12, 1], [2, 10, 1], [3, 12, 1]],
    7: [[0, 11, 2], [2, 13, 2]],
    10: [[0, 14, 1], [1, 13, 0.5], [1.5, 12, 0.5], [2, 11, 1], [3, 13, 1]],
    11: [[0, 14, 4]],
  },
  rythmes: [[1, 1, 2], [0.5, 0.5, 1, 2], [1, 0.5, 0.5, 1, 1]], silence: 0.1,
  basse: (m, a) => [[0, a, 0.9], [1, a + 4, 0.9], [2, a, 0.9], [3, a + 4, 0.9]],
  accompagnement: (m) => [[0, 0, 0.4, 0.5], [0, 1, 0.4, 0.36], [0, 2, 0.4, 0.36], [1, 0, 0.4, 0.36], [1, 2, 0.4, 0.3], [2, 0, 0.4, 0.45], [2, 1, 0.4, 0.36], [2, 2, 0.4, 0.36], [3, 1, 0.4, 0.3], [3.5, 2, 0.4, 0.26]],
  percussion: (m) => [[0, 'tambour', 0.75], [2, 'tambour', 0.55], [1, 'tambourin', 0.4], [3, 'tambourin', 0.4], [1.5, 'tambourin', 0.2], [3.5, 'tambourin', 0.2], ...(m % 12 === 11 ? [[0, 'timbale', 0.8]] : [])],
};
// La montagne : le cor (les cuivres), de grandes cordes tenues, les timbales
THEMES.triompheMontagne = Object.assign({}, THEMES.triompheForet, {
  tempo: 100, reverb: 0.5, octaveMelodie: 0,
  instruments: { melodie: 'cuivres', accompagnement: 'cordes', basse: 'basse' },
  accompagnement: (m) => [[0, 0, 3.9, 0.4], [0, 1, 3.9, 0.32], [0, 2, 3.9, 0.32], [0, 3, 3.9, 0.25]],
  percussion: (m) => [[0, 'timbale', 0.8], [2, 'timbale', 0.5], [1, 'tambour', 0.35], [3, 'tambour', 0.35], [3.5, 'tambour', 0.25]],
});
// Le marais : l'ocarina et la harpe en lydien (le soleil qui perce la brume) ; le IIe degré (la
// majeur) remplace le IVe, comme dans recitEtonne
THEMES.triompheMarais = Object.assign({}, THEMES.triompheForet, {
  gamme: GAMMES.lydien, tempo: 96, reverb: 0.45, lie: 1.1,
  accords: [0, 0, 1, 4, 0, 5, 1, 4, 1, 4, 0, 0],
  instruments: { melodie: 'ocarina', accompagnement: 'harpe', basse: 'basse' },
  accompagnement: (m) => [[0, 0, 0.9, 0.4], [0.5, 1, 0.9, 0.3], [1, 2, 0.9, 0.3], [1.5, 3, 0.9, 0.3], [2, 4, 0.9, 0.3], [2.5, 3, 0.9, 0.25], [3, 2, 0.9, 0.3], [3.5, 1, 0.9, 0.25]],
  percussion: (m) => [[0, 'tambour', 0.45], [2, 'bois', 0.3], [3, 'bois', 0.25]],
});

// ======================================================================================
// (v1.64, demande du joueur) Une musique pour chaque situation inquiétante, à la place de l'unique « récit qui fait
// peur » : la nuit dehors, la grotte, le feu follet, la malédiction, et le renard de l'Engeance au Vieux Moulin.
// Chacune a sa gamme, son tempo, ses instruments, son motif qui revient et ses petits bruits à elle.
// ======================================================================================
GAMMES.phrygien = [0, 1, 3, 5, 7, 8, 10];
GAMMES.locrien = [0, 1, 3, 5, 6, 8, 10];

// Les petits bruits de ces musiques, en plus des percussions du moteur (même format : moment, force, bus)
const PERCUS_PEUR = {
  // trois stridulations d'un grillon dans l'herbe
  grillon(t, force, bus) {
    for (let k = 0; k < 3; k++) { const o = this.ctx.createOscillator(), g = this.ctx.createGain(), tt = t + k * 0.05; o.frequency.value = 4300 + Math.random() * 300; g.gain.setValueAtTime(0, tt); g.gain.linearRampToValueAtTime(0.05 * force, tt + 0.006); g.gain.linearRampToValueAtTime(0, tt + 0.03); o.connect(g); g.connect(bus); o.start(tt); o.stop(tt + 0.04); }
  },
  // la chouette, au loin : « hou... hou-hou »
  chouette(t, force, bus) {
    for (const [dt, d] of [[0, 0.45], [0.75, 0.16], [0.97, 0.55]]) { const o = this.ctx.createOscillator(), g = this.ctx.createGain(), tt = t + dt; o.frequency.setValueAtTime(400, tt); o.frequency.linearRampToValueAtTime(365, tt + d); g.gain.setValueAtTime(0, tt); g.gain.linearRampToValueAtTime(0.1 * force, tt + 0.06); g.gain.linearRampToValueAtTime(0, tt + d); o.connect(g); g.connect(bus); o.start(tt); o.stop(tt + d + 0.02); }
  },
  // une goutte qui tombe dans une flaque de la grotte, et son écho contre la roche
  echoGoutte(t, force, bus) { for (const [dt, v] of [[0, 1], [0.23, 0.45], [0.46, 0.2]]) this.percu('goutte', t + dt, force * v, bus); },
  // le feu follet : un tintement de verre, très aigu et doux, qui flotte
  tintement(t, force, bus) {
    const f = [2349, 2637, 3136, 3520][Math.floor(Math.random() * 4)];
    for (const [m, v, d] of [[1, 0.05, 0.9], [2.01, 0.015, 0.5], [3.02, 0.008, 0.3]]) { const o = this.ctx.createOscillator(), g = this.ctx.createGain(); o.frequency.value = f * m; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v * force, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0005, t + d); o.connect(g); g.connect(bus); o.start(t); o.stop(t + d + 0.05); }
  },
  // la malédiction : des chuchotements (trois syllabes de souffle, sans voix)
  chuchote(t, force, bus) {
    for (let k = 0; k < 3; k++) this.bruitGlisse(t + k * (0.13 + Math.random() * 0.06), 0.12 + Math.random() * 0.08, bus, { de: 2200 + Math.random() * 1500, a: 1600 + Math.random() * 900, q: 3, volume: 0.035 * force, attaque: 0.03 });
  },
  // une branche qui craque dans le noir
  craque(t, force, bus) { this.bruit(0.02, t, bus, 0.18 * force, 1800); this.bruit(0.015, t + 0.04 + Math.random() * 0.03, bus, 0.1 * force, 2600); },
};
{
  const percuDuJeu = Son.percu;
  Son.percu = function (quoi, t, force, bus) { const P = PERCUS_PEUR[quoi]; if (P) return P.call(this, t, force, bus); return percuDuJeu.call(this, quoi, t, force, bus); };
}

// La nuit dehors : la harpe égrène lentement, une flûte douce chante bas et long, les grillons, une chouette au loin,
// une branche qui craque. Ré mineur, une phrase de 12 mesures qui descend vers la sensible et remonte, sans se poser.
THEMES.peurNuit = {
  base: NOTE.D / 2, gamme: GAMMES.mineur, tempo: 66, temps: 4, phrase: 12,
  accords: [0, 0, 5, 5, 3, 3, 4, 4, 0, 5, 6, 4], octaveMelodie: 1,
  instruments: { melodie: 'fluteDouce', accompagnement: 'harpe', basse: 'bourdon' }, reverb: 0.6, lie: 1.15,
  motif: {
    0: [[0, 7, 2], [2, 8, 1], [3, 9, 1]],
    1: [[0, 10, 3], [3, 9, 1]],
    2: [[0, 8, 2], [2, 7, 2]],
    3: [[0, 5, 3], [3, 6, 1]],
    4: [[0, 7, 1], [1, 10, 1], [2, 12, 2]],
    5: [[0, 11, 2], [2, 10, 1], [3, 8, 1]],
    6: [[0, 9, 2], [2, 6, 2]],
    7: [[0, 7, 4]],
    10: [[0, 9, 2], [2, 8, 1], [3, 7, 1]],
    11: [[0, 6, 4]],
  },
  rythmes: [[2, 2], [1, 1, 2], [3, 1]], silence: 0.35,
  basse: (m, a) => [[0, a, 3.9]],
  accompagnement: (m) => [[0, 0, 1.2, 0.34], [0.5, 1, 1.2, 0.26], [1, 2, 1.2, 0.28], [1.5, 4, 1.2, 0.24], [2.5, 2, 1.2, 0.22], [3, 1, 1.2, 0.2]],
  percussion: (m) => [[0.25 + (m % 3) * 0.5, 'grillon', 0.8], [2.6 - (m % 2) * 0.4, 'grillon', 0.6], ...(m % 6 === 5 ? [[1, 'chouette', 0.9]] : []), ...(m % 7 === 3 ? [[3.3, 'craque', 0.8]] : [])],
};
// La grotte : tout résonne. Une clarinette grave, sur le mode phrygien (le demi-ton qui étouffe), un bourdon qui ne
// bouge pas, des cordes pincées rares comme des pas qui reviennent en écho, et l'eau qui goutte contre la roche.
THEMES.peurGrotte = {
  base: NOTE.E / 2, gamme: GAMMES.phrygien, tempo: 54, temps: 4, phrase: 8,
  accords: [0, 0, 1, 0, 5, 1, 6, 0], octaveMelodie: 0,
  instruments: { melodie: 'clarinette', accompagnement: 'pizzicato', basse: 'bourdon' }, reverb: 0.95, lie: 1.2,
  motif: {
    0: [[0, 7, 3], [3, 8, 1]],
    1: [[0, 7, 2], [2, 5, 2]],
    2: [[1, 10, 1], [2, 8, 2]],
    3: [[0, 7, 4]],
    5: [[0, 11, 2], [2, 10, 1], [3, 8, 1]],
    7: [[0, 8, 2], [2, 7, 2]],
  },
  rythmes: [[3, 1], [2, 2], [4]], silence: 0.45,
  basse: (m) => [[0, 0, 3.95]],
  accompagnement: (m) => [[0, 0, 0.6, 0.8], [1.5, 2, 0.6, 0.5], ...(m % 2 ? [[3, 1, 0.6, 0.45]] : [])], forceBasse: 1.5,
  percussion: (m) => [[0.7 + (m % 4) * 0.6, 'echoGoutte', 0.8], ...(m % 3 === 2 ? [[2.4, 'goutte', 0.5]] : []), ...(m % 4 === 3 ? [[3.2, 'souffle', 1]] : [])],
};
// Le feu follet : une valse qui attire, à trois temps. L'ocarina chante une mélodie qui tourne sur elle-même, la
// harpe arpège, des tintements de verre flottent ; la gamme orientale (la seconde augmentée) qui envoûte et inquiète.
THEMES.peurFeuFollet = {
  base: NOTE.A / 2, gamme: GAMMES.freygish, tempo: 92, temps: 3, phrase: 12,
  accords: [0, 0, 3, 0, 6, 6, 0, 4, 3, 3, 4, 0], octaveMelodie: 1,
  instruments: { melodie: 'ocarina', accompagnement: 'harpe', basse: 'basse' }, reverb: 0.7, lie: 1.05,
  motif: {
    0: [[0, 7, 1], [1, 8, 1], [2, 9, 1]],
    1: [[0, 11, 2], [2, 9, 1]],
    2: [[0, 10, 1], [1, 9, 1], [2, 8, 1]],
    3: [[0, 7, 3]],
    4: [[0, 13, 1], [1, 12, 1], [2, 11, 1]],
    5: [[0, 10, 2], [2, 8, 1]],
    6: [[0, 9, 1], [1, 11, 1], [2, 14, 1]],
    7: [[0, 11, 3]],
    11: [[0, 8, 1], [1, 8, 1], [2, 7, 1]],
  },
  rythmes: [[1, 1, 1], [2, 1], [1, 2], [0.5, 0.5, 1, 1]], silence: 0.2,
  basse: (m, a) => [[0, a, 2.8]],
  accompagnement: (m) => [[0, 0, 0.9, 0.35], [1, 1, 0.9, 0.25], [1.5, 2, 0.9, 0.22], [2, 4, 0.9, 0.25], [2.5, 2, 0.9, 0.2]],
  percussion: (m) => [[0.5 + (m % 3) * 0.75, 'tintement', 0.8], ...(m % 2 ? [[2.25, 'tintement', 0.45]] : [])],
};
// La malédiction : un chœur qui tient des accords qui ne se résolvent jamais (le mode locrien, sans vraie quinte), la
// vielle qui chante comme une vieille complainte, des chuchotements, et la timbale qui roule à la fin de chaque phrase.
THEMES.peurMalediction = {
  base: NOTE.C / 2, gamme: GAMMES.locrien, tempo: 56, temps: 4, phrase: 8,
  accords: [0, 0, 1, 1, 0, 5, 4, 0], octaveMelodie: 1,
  instruments: { melodie: 'vielle', accompagnement: 'choeur', basse: 'bourdon' }, reverb: 0.8, lie: 1.3,
  motif: {
    0: [[0, 7, 2], [2, 8, 2]],
    1: [[0, 9, 1], [1, 8, 1], [2, 7, 2]],
    2: [[0, 11, 3], [3, 10, 1]],
    3: [[0, 8, 4]],
    4: [[0, 7, 1], [1, 6, 1], [2, 7, 2]],
    5: [[0, 12, 2], [2, 11, 2]],
    6: [[0, 10, 2], [2, 8, 2]],
    7: [[0, 7, 4]],
  },
  rythmes: [[2, 2], [4], [1, 1, 2]], silence: 0.25,
  basse: (m) => [[0, 0, 3.9]],
  accompagnement: (m) => [[0, 0, 3.8, 1.1], [0, 1, 3.8, 0.9], [0, 2, 3.8, 0.8]], forceBasse: 1.8,
  percussion: (m) => [[1.5, 'chuchote', 0.9], ...(m % 2 ? [[3.1, 'chuchote', 0.6]] : []), ...(m % 4 === 0 ? [[0, 'timbale', 0.35]] : []), ...(m % 4 === 3 ? Array.from({ length: 6 }, (_, j) => [2.5 + j * 0.25, 'timbale', 0.08 + j * 0.04]) : [])],
};
// Le renard de l'Engeance (au Vieux Moulin) : une course. La clarinette file en croches, les cordes pincées battent
// comme un cœur pressé, le tambour et le bois au galop ; ré mineur harmonique, et une timbale à chaque fin de phrase.
THEMES.peurRenard = {
  base: NOTE.D / 2, gamme: GAMMES.harmonique, tempo: 132, temps: 4, phrase: 8,
  accords: [0, 0, 5, 4, 0, 3, 4, 4], octaveMelodie: 1,
  instruments: { melodie: 'clarinette', accompagnement: 'pizzicato', basse: 'basse' }, reverb: 0.3,
  motif: {
    0: [[0, 7, 0.5], [0.5, 9, 0.5], [1, 10, 1], [2, 9, 0.5], [2.5, 7, 0.5], [3, 6, 1]],
    1: [[0, 7, 1.5], [1.5, 4, 0.5], [2, 6, 2]],
    4: [[0, 10, 0.5], [0.5, 11, 0.5], [1, 12, 1], [2, 11, 0.5], [2.5, 10, 0.5], [3, 9, 1]],
    5: [[0, 10, 1], [1, 8, 1], [2, 7, 2]],
    7: [[0, 6, 1], [1, 7, 0.5], [1.5, 8, 0.5], [2, 6, 2]],
  },
  rythmes: [[0.5, 0.5, 1, 1, 1], [1, 0.5, 0.5, 2], [0.5, 0.5, 0.5, 0.5, 1, 1]], silence: 0.1,
  basse: (m, a) => [[0, a, 0.45], [1, a + 4, 0.45], [2, a, 0.45], [3, a + 4, 0.45]],
  accompagnement: (m) => Array.from({ length: 8 }, (_, i) => [i * 0.5, [0, 2, 1, 2][i % 4], 0.3, i % 2 ? 0.3 : 0.45]),
  percussion: (m) => [[0, 'tambour', 0.6], [1.5, 'bois', 0.35], [2, 'tambour', 0.45], [3.5, 'bois', 0.35], ...(m % 8 === 7 ? [[3, 'timbale', 0.6]] : []), ...(m % 2 ? [[2.75, 'bois', 0.25]] : [])],
};
// La musique de chaque situation inquiétante d'un récit (les autres gardent l'ancienne, recitPeur)
const MUSIQUE_PEUR = { nuit: 'peurNuit', grotte: 'peurGrotte', feufollet: 'peurFeuFollet', malediction: 'peurMalediction' };
function musiquePeur(type) { return MUSIQUE_PEUR[type] || 'recitPeur'; }

// ======================================================================================
// Les sons des récits (au format de SONS : fonction(t, bus, options), appelée avec this = Son). Leurs niveaux sont
// réglés dans la fonction (mesurés comme les autres) : pas d'entrée dans VOLUME_SONS.
// ======================================================================================
const SONS_RECITS = {
  // Une grande cloche, plus riche que l'instrument « glas » : chaque partiel s'éteint à son rythme (les
  // graves durent, les aigus meurent vite), le bourdon et la fondamentale « battent » doucement, et le
  // battant donne un choc mat. o.freq : la note (la fondamentale), o.force, o.duree (la résonance)
  grandeCloche(t, bus, o = {}) {
    const ctx = this.ctx, f = o.freq || 146.83, duree = o.duree || 5;
    const g = ctx.createGain(); g.gain.value = 0.3 * (o.force || 1); g.connect(bus);
    // [multiple, volume, part de la durée, décalage en Hz (le battement)]
    for (const [mult, v, d, dec] of [[0.5, 0.3, 1, 0], [0.5, 0.18, 1, 0.7], [1, 0.36, 0.8, 0], [1, 0.16, 0.8, 1.1], [1.19, 0.24, 0.55, 0], [1.5, 0.14, 0.45, 0], [2, 0.24, 0.38, 0], [2.52, 0.1, 0.25, 0], [2.67, 0.08, 0.2, 0], [3.01, 0.06, 0.16, 0], [4.07, 0.04, 0.1, 0]]) {
      const osc = ctx.createOscillator(); osc.frequency.value = f * mult + dec;
      const gg = ctx.createGain(); gg.gain.setValueAtTime(0.0005, t); gg.gain.exponentialRampToValueAtTime(v, t + 0.006); gg.gain.exponentialRampToValueAtTime(0.0005, t + duree * d);
      osc.connect(gg); gg.connect(g); osc.start(t); osc.stop(t + duree * d + 0.05);
    }
    this.bruit(0.04, t, g, 0.2, 1200);
  },

  // --- La mort d'un voyageur (4 à 8 s), à la place de « glas » ---
  // A. Le chœur des disparus : une cloche grave, un chœur (mi mineur, la mineur, si majeur, mi mineur)
  //    sur un bourdon, et une voix seule au-dessus qui descend (sol, la, fa dièse, mi)
  mortChoeur(t, bus) {
    const niv = this.ctx.createGain(); niv.gain.value = 1.2; niv.connect(bus); bus = niv;
    const mi = d => 82.41 * Math.pow(2, d / 12);   // (en demi-tons depuis le mi grave)
    SONS.grandeCloche.call(this, t, bus, { freq: mi(12), force: 0.55, duree: 5 });
    this.note('bourdon', mi(0), t, 6.2, 1, bus);
    const accords = [[0, 2, [12, 19, 24]], [1.9, 1.6, [8, 17, 24]], [3.4, 1.3, [7, 14, 23]], [4.6, 2.4, [12, 15, 19]]];
    for (const [dt, d, notes] of accords) for (const n of notes) this.note('choeur', mi(n), t + dt, d, 0.6, bus);
    for (const [dt, d, n] of [[0.4, 1.5, 27], [1.9, 1.5, 29], [3.4, 1.2, 26], [4.6, 2.4, 24]]) this.note('choeur', mi(n), t + dt, d, 0.75, bus);
    this.percu('timbale', t + 4.6, 0.45, bus);
  },
  // B. Les cordes qui pleurent : le lamento (la basse descend la, sol, fa, mi au violoncelle), les cordes
  //    au-dessus (mi, ré, do, si), une timbale sur l'accord de mi majeur, puis la mineur tenu
  mortCordes(t, bus) {
    const niv = this.ctx.createGain(); niv.gain.value = 1; niv.connect(bus); bus = niv;
    const la = d => 55 * Math.pow(2, d / 12), pas = 0.95;   // (en demi-tons depuis le la grave)
    const etapes = [[12, [24, 27, 31], 43], [10, [22, 26, 29], 41], [8, [20, 24, 27], 39], [7, [19, 23, 26], 38]];
    etapes.forEach(([b, acc, haut], i) => {
      const ti = t + i * pas;
      this.note('violoncelle', la(b), ti, pas, 1, bus);
      for (const n of acc) this.note('cordes', la(n), ti, pas, 0.6, bus);
      this.note('cordes', la(haut), ti, pas, 0.8, bus);
    });
    this.percu('timbale', t + 3 * pas, 0.4, bus);
    const tf = t + 4 * pas;
    this.note('violoncelle', la(0), tf, 2.2, 0.6, bus); this.note('violoncelle', la(12), tf, 2.2, 0.8, bus);
    for (const n of [24, 27, 31]) this.note('cordes', la(n), tf, 2.2, 0.6, bus);
    this.note('cordes', la(36), tf, 2.2, 0.8, bus);
    this.percu('timbale', tf, 0.45, bus);
  },
  // C. Le grand glas : trois coups d'une grande cloche (ré), un bourdon, un chœur lointain en ré mineur
  mortGlas(t, bus) {
    const niv = this.ctx.createGain(); niv.gain.value = 0.95; niv.connect(bus); bus = niv;
    const f = 146.83;
    [0, 2.1, 4.2].forEach((dt, i) => SONS.grandeCloche.call(this, t + dt, bus, { freq: f, force: [1, 0.85, 0.75][i], duree: 5 }));
    this.note('bourdon', f / 2, t + 0.3, 5.5, 0.9, bus);
    for (const d of [0, 3, 7]) this.note('choeur', f * Math.pow(2, d / 12), t + 1.8, 4, 0.5, bus);
  },

  // --- Les bruitages ---
  // Des pas dehors, selon le sol : o.sol = 'herbe', 'neige', 'boue' ou 'paves' ; o.n pas (4)
  // (v1.64, la banque de pas) aussi : 'terre', 'parquet', 'feuilles' (les feuilles mortes), 'sable', 'pierre' (la
  // pierre de taille, qui résonne), 'gravier'. Chaque rendu tire ses petites différences : 4 variantes par sol en cache.
  pasDehors(t, bus, o = {}) {
    const sol = o.sol || 'herbe', n = o.n || 4, cadence = o.cadence || ({ boue: 0.55, neige: 0.48, sable: 0.5, feuilles: 0.45 }[sol] || 0.42);
    const niv = this.ctx.createGain(); niv.gain.value = NIVEAU_PAS[sol] || 1; niv.connect(bus); bus = niv;
    const h = () => 0.9 + Math.random() * 0.2;   // (chaque pas un peu différent)
    for (let i = 0; i < n; i++) {
      const tp = t + i * cadence + (Math.random() - 0.5) * 0.03, cote = i % 2 ? 0.92 : 1.08;   // (le pied gauche, le pied droit)
      if (sol === 'herbe') {
        this.tonGlisse(tp, 0.09, bus, { de: 95 * cote, a: 50, volume: 0.22, attaque: 0.006 });
        this.bruitGlisse(tp, 0.16, bus, { de: 2600 * cote, a: 1500, q: 0.8, volume: 0.07, attaque: 0.02 });
        this.bruitGlisse(tp + 0.05, 0.12, bus, { type: 'highpass', de: 4000, a: 3000, q: 0.5, volume: 0.03, attaque: 0.02 });
      } else if (sol === 'neige') {
        this.tonGlisse(tp, 0.08, bus, { de: 80, a: 45, volume: 0.15 });
        for (let k = 0; k < 9; k++) this.bruitGlisse(tp + 0.01 + k * 0.022 + Math.random() * 0.01, 0.018, bus, { de: (1800 + Math.random() * 1800) * cote, q: 3, volume: 0.01 + 0.09 * Math.sin((k + 1) / 10 * Math.PI), attaque: 0.002 });
      } else if (sol === 'boue') {
        this.bruitGlisse(tp, 0.12, bus, { type: 'lowpass', de: 400, a: 200, volume: 0.22, attaque: 0.01 });
        this.tonGlisse(tp + 0.02, 0.12, bus, { de: 210 * cote, a: 90, volume: 0.08, attaque: 0.01, filtre: 600 });
        // le pied qui se dégage : une succion qui remonte
        this.tonGlisse(tp + 0.24, 0.1, bus, { forme: 'triangle', de: 140 * cote, a: 420, volume: 0.05, attaque: 0.03, filtre: 900 });
        this.bruitGlisse(tp + 0.24, 0.1, bus, { de: 700, a: 1400, q: 4, volume: 0.05, attaque: 0.03 });
      } else if (sol === 'terre') {
        // la terre battue : un choc sourd, un peu de poussière qui crisse sous la semelle
        this.tonGlisse(tp, 0.1, bus, { de: 105 * cote * h(), a: 55, volume: 0.24, attaque: 0.005 });
        this.bruitGlisse(tp, 0.07, bus, { type: 'lowpass', de: 900, a: 400, volume: 0.1, attaque: 0.003 });
        this.bruitGlisse(tp + 0.03, 0.09, bus, { de: 1300 * h(), a: 900, q: 1.2, volume: 0.035, attaque: 0.015 });
      } else if (sol === 'parquet') {
        // le parquet : le talon sur la planche (un « toc » de bois qui sonne creux), la pointe, parfois la latte qui grince
        this.tonGlisse(tp, 0.08, bus, { de: 130 * cote * h(), a: 75, volume: 0.2, attaque: 0.003 });
        this.bruitGlisse(tp, 0.05, bus, { de: 520 * cote * h(), a: 430, q: 5, volume: 0.22, attaque: 0.002 });
        this.bruitGlisse(tp, 0.025, bus, { de: 1900 * h(), a: 1500, q: 1.5, volume: 0.07, attaque: 0.001 });
        this.bruitGlisse(tp + 0.075, 0.03, bus, { de: 850 * h(), a: 700, q: 4, volume: 0.07, attaque: 0.002 });
        if (Math.random() < 0.3) this.tonGlisse(tp + 0.09, 0.16, bus, { forme: 'sawtooth', de: 320 * h(), a: 290, volume: 0.012, attaque: 0.04, filtre: 1400 });
      } else if (sol === 'feuilles') {
        // les feuilles mortes : un froissement sec qui craque en petits morceaux, sur un pas mou
        this.tonGlisse(tp, 0.09, bus, { de: 90 * cote, a: 50, volume: 0.14, attaque: 0.006 });
        this.bruitGlisse(tp, 0.2, bus, { de: 3200 * h(), a: 2200, q: 0.9, volume: 0.035, attaque: 0.02 });
        for (let k = 0; k < 11; k++) this.bruitGlisse(tp + 0.005 + Math.random() * 0.17, 0.012, bus, { de: 2000 + Math.random() * 4000, q: 2.5, volume: 0.03 + Math.random() * 0.07, attaque: 0.001 });
      } else if (sol === 'sable') {
        // le sable : le pied s'enfonce un peu, un « chhh » doux qui glisse, presque pas de choc
        this.tonGlisse(tp, 0.1, bus, { de: 70 * cote, a: 45, volume: 0.1, attaque: 0.015 });
        this.bruitGlisse(tp, 0.2, bus, { de: 1700 * h(), a: 2600, q: 0.9, volume: 0.07, attaque: 0.04 });
        for (let k = 0; k < 5; k++) this.bruitGlisse(tp + 0.03 + k * 0.03 + Math.random() * 0.01, 0.015, bus, { de: 3000 + Math.random() * 2000, q: 2, volume: 0.015 + Math.random() * 0.02, attaque: 0.002 });
      } else if (sol === 'gravier') {
        // le gravier : les cailloux qui roulent et crissent sous la semelle, un choc sourd dessous
        this.tonGlisse(tp, 0.08, bus, { de: 95 * cote, a: 55, volume: 0.16, attaque: 0.004 });
        for (let k = 0; k < 16; k++) { const u = k / 16; this.bruitGlisse(tp + 0.004 + u * 0.13 + Math.random() * 0.01, 0.014, bus, { de: 1400 + Math.random() * 2600, q: 3, volume: (0.02 + Math.random() * 0.06) * Math.sin((u * 0.9 + 0.1) * Math.PI), attaque: 0.001 }); }
        this.bruitGlisse(tp, 0.12, bus, { type: 'lowpass', de: 1200, a: 600, volume: 0.04, attaque: 0.01 });
      } else if (sol === 'pierre') {
        // la pierre de taille : un talon net et clair sur une grande dalle, qui résonne un peu dans la salle
        this.bruitGlisse(tp, 0.03, bus, { de: 3200 * cote * h(), a: 2600, q: 3, volume: 0.14, attaque: 0.001 });
        this.tonGlisse(tp, 0.12, bus, { forme: 'triangle', de: 900 * cote * h(), a: 600, volume: 0.05, attaque: 0.001 });
        this.tonGlisse(tp, 0.06, bus, { de: 170, a: 90, volume: 0.13, attaque: 0.002 });
        this.bruitGlisse(tp + 0.002, 0.25, bus, { type: 'highpass', de: 2500, a: 2000, q: 0.6, volume: 0.012, attaque: 0.005 });
        this.bruitGlisse(tp + 0.08, 0.022, bus, { de: 3600 * cote, a: 3000, q: 2.5, volume: 0.05, attaque: 0.001 });
      } else {
        // le talon qui claque sur la pierre, puis la pointe
        this.bruitGlisse(tp, 0.035, bus, { de: 2400 * cote, a: 1800, q: 2.5, volume: 0.16, attaque: 0.002 });
        this.tonGlisse(tp, 0.05, bus, { forme: 'triangle', de: 650 * cote, a: 320, volume: 0.08, attaque: 0.002 });
        this.tonGlisse(tp, 0.07, bus, { de: 150, a: 80, volume: 0.15, attaque: 0.003 });
        this.bruitGlisse(tp + 0.07, 0.025, bus, { de: 3000 * cote, a: 2500, q: 2, volume: 0.06, attaque: 0.002 });
      }
    }
  },
  // Une lourde porte de bois clouté : le loquet de fer, les gonds qui grincent par à-coups, le battant qui retombe
  porteLourde(t, bus) {
    const ctx = this.ctx;
    const niv = ctx.createGain(); niv.gain.value = 0.65; niv.connect(bus); bus = niv;
    for (const [f, v, d] of [[1250, 0.1, 0.12], [1890, 0.05, 0.08], [2730, 0.03, 0.06]]) this.tonGlisse(t, d, bus, { de: f, a: f * 0.98, volume: v, attaque: 0.002 });
    this.bruit(0.02, t, bus, 0.2, 3000);
    const t1 = t + 0.25, d = 1.1;
    const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(95, t1); o.frequency.linearRampToValueAtTime(150, t1 + d * 0.6); o.frequency.linearRampToValueAtTime(118, t1 + d);
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 700; f.Q.value = 4;
    const hache = ctx.createGain(); hache.gain.value = 0.5;
    const lfo = ctx.createOscillator(); lfo.type = 'square'; lfo.frequency.setValueAtTime(18, t1); lfo.frequency.linearRampToValueAtTime(30, t1 + d);
    const lg = ctx.createGain(); lg.gain.value = 0.5; lfo.connect(lg); lg.connect(hache.gain);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0005, t1); g.gain.exponentialRampToValueAtTime(0.12, t1 + 0.2); g.gain.setValueAtTime(0.12, t1 + d - 0.25); g.gain.exponentialRampToValueAtTime(0.0005, t1 + d);
    o.connect(f); f.connect(hache); hache.connect(g); g.connect(bus); o.start(t1); o.stop(t1 + d + 0.05); lfo.start(t1); lfo.stop(t1 + d + 0.05);
    const t2 = t1 + d + 0.15;
    this.tonGlisse(t2, 0.35, bus, { de: 75, a: 38, volume: 0.3, attaque: 0.004 });
    this.bruitGlisse(t2, 0.25, bus, { type: 'lowpass', de: 500, a: 150, volume: 0.25, attaque: 0.003 });
    this.bruitGlisse(t2, 0.06, bus, { de: 1100, a: 800, q: 1.5, volume: 0.12, attaque: 0.002 });
    for (let k = 0; k < 3; k++) this.tonGlisse(t2 + 0.08 + k * 0.07, 0.06, bus, { de: 1500 + k * 120, a: 1400, volume: 0.03 / (k + 1), attaque: 0.002 });
  },
  // L'épée tirée du fourreau : le cuir, la lame qui glisse (un frottement métallique qui monte) et qui chante
  degainer(t, bus) {
    const niv = this.ctx.createGain(); niv.gain.value = 2.0; niv.connect(bus); bus = niv;
    this.bruitGlisse(t, 0.06, bus, { type: 'lowpass', de: 900, a: 400, volume: 0.12, attaque: 0.004 });
    this.bruitGlisse(t + 0.04, 0.42, bus, { de: 2200, a: 6500, q: 9, volume: 0.14, attaque: 0.3 });
    this.bruitGlisse(t + 0.04, 0.42, bus, { type: 'highpass', de: 5000, a: 7000, q: 0.7, volume: 0.03, attaque: 0.3 });
    const t1 = t + 0.44;
    for (const [f, v, d] of [[2960, 0.06, 1.1], [2975, 0.04, 1.0], [4420, 0.035, 0.8], [6230, 0.02, 0.5]]) this.tonGlisse(t1, d, bus, { de: f, a: f * 0.997, volume: v, attaque: 0.004 });
  },
  // La flèche : la corde de l'arc qui claque, la flèche qui file, puis qui se plante dans le bois en vibrant
  fleche(t, bus) {
    const ctx = this.ctx;
    const niv = ctx.createGain(); niv.gain.value = 1.3; niv.connect(bus); bus = niv;
    this.tonGlisse(t, 0.22, bus, { forme: 'triangle', de: 140, a: 95, volume: 0.25, attaque: 0.003, filtre: 900 });
    this.tonGlisse(t, 0.12, bus, { forme: 'sawtooth', de: 280, a: 190, volume: 0.05, attaque: 0.003, filtre: 1200 });
    this.bruit(0.02, t, bus, 0.15, 1500);
    this.bruitGlisse(t + 0.05, 0.38, bus, { de: 3200, a: 900, q: 2.5, volume: 0.09, attaque: 0.06 });
    const t1 = t + 0.45;
    this.tonGlisse(t1, 0.07, bus, { de: 480, a: 200, volume: 0.25, attaque: 0.002 });
    this.bruit(0.03, t1, bus, 0.25, 1300);
    const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = 190;
    const am = ctx.createGain(); am.gain.value = 0.5; const lfo = ctx.createOscillator(); lfo.frequency.value = 28; const lg = ctx.createGain(); lg.gain.value = 0.5; lfo.connect(lg); lg.connect(am.gain);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0005, t1); g.gain.exponentialRampToValueAtTime(0.07, t1 + 0.01); g.gain.exponentialRampToValueAtTime(0.0005, t1 + 0.4);
    o.connect(am); am.connect(g); g.connect(bus); o.start(t1); o.stop(t1 + 0.42); lfo.start(t1); lfo.stop(t1 + 0.42);
  },
  // Le feu de camp : le souffle grave des flammes qui ondule, les crépitements, une bûche qui craque (o.duree, 4 s)
  feuDeCamp(t, bus, o = {}) {
    const ctx = this.ctx, d = o.duree || 4;
    const niv = ctx.createGain(); niv.gain.value = 1.65; niv.connect(bus); bus = niv;
    const r = this.bruitGlisse(t, d, bus, { type: 'lowpass', de: 380, a: 300, q: 0.7, volume: 0.16, attaque: 0.6, relache: 0.8 });
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.7; const lg = ctx.createGain(); lg.gain.value = 120; lfo.connect(lg); lg.connect(r.f.frequency); lfo.start(t); lfo.stop(t + d + 0.05);
    this.bruitGlisse(t, d, bus, { type: 'highpass', de: 3500, a: 3000, q: 0.5, volume: 0.012, attaque: 0.6, relache: 0.8 });
    for (let i = 0; i < d * 14; i++) {
      const tc = t + 0.2 + Math.random() * (d - 0.4), fort = Math.random() < 0.15;
      this.bruitGlisse(tc, fort ? 0.02 : 0.008, bus, { de: 1500 + Math.random() * 3500, q: 2, volume: 0.02 + (fort ? 0.25 : 0.08) * Math.random(), attaque: 0.001 });
    }
    const tb = t + d * (0.4 + Math.random() * 0.3);
    this.tonGlisse(tb, 0.08, bus, { de: 160, a: 70, volume: 0.15, attaque: 0.003 });
    this.bruitGlisse(tb, 0.05, bus, { de: 2000, a: 900, q: 1.5, volume: 0.3, attaque: 0.002 });
  },
  // FWOUF : la torche qui prend d'un coup (un souffle qui s'ouvre), puis quelques pétillements
  torche(t, bus) {
    const niv = this.ctx.createGain(); niv.gain.value = 1.5; niv.connect(bus); bus = niv;
    this.bruitGlisse(t, 0.6, bus, { de: 300, a: 1800, q: 1.2, volume: 0.3, attaque: 0.06 });
    this.bruitGlisse(t, 0.9, bus, { type: 'lowpass', de: 250, a: 600, q: 0.7, volume: 0.25, attaque: 0.08 });
    this.tonGlisse(t, 0.25, bus, { de: 90, a: 55, volume: 0.15, attaque: 0.03 });
    for (let i = 0; i < 9; i++) this.bruitGlisse(t + 0.3 + Math.random() * 0.8, 0.01, bus, { de: 2000 + Math.random() * 3000, q: 2, volume: 0.06 + Math.random() * 0.1, attaque: 0.001 });
  },
  // Le vent des cols : une bourrasque qui enfle et retombe, et qui siffle dans les rochers (o.duree, 5 s)
  ventMontagne(t, bus, o = {}) {
    const d = o.duree || 5;
    const niv = this.ctx.createGain(); niv.gain.value = 1.3; niv.connect(bus); bus = niv;
    this.bruitGlisse(t, d, bus, { type: 'lowpass', de: 300, par: 1100, a: 350, q: 0.9, volume: 0.22, attaque: d * 0.45, relache: d * 0.5 });
    for (const [f0, v] of [[620, 0.16], [930, 0.08]]) this.bruitGlisse(t + 0.3, d - 0.3, bus, { de: f0 * 0.85, par: f0 * 1.25, a: f0 * 0.9, q: 28, volume: v, attaque: d * 0.4, relache: d * 0.5 });
  },
  // Le corbeau : deux « croâ » rauques (une scie nasale à deux formants, hachée vite : le râle)
  corbeau(t, bus) {
    const ctx = this.ctx;
    const niv = ctx.createGain(); niv.gain.value = 1.4; niv.connect(bus); bus = niv;
    for (const [dt, h, d] of [[0, 1, 0.3], [0.45, 0.93, 0.34]]) {
      const t1 = t + dt, o = ctx.createOscillator(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(420 * h, t1); o.frequency.linearRampToValueAtTime(460 * h, t1 + 0.05); o.frequency.exponentialRampToValueAtTime(300 * h, t1 + d);
      const rale = ctx.createGain(); rale.gain.value = 0.6; const lfo = ctx.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 62; const lg = ctx.createGain(); lg.gain.value = 0.4; lfo.connect(lg); lg.connect(rale.gain);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0005, t1); g.gain.exponentialRampToValueAtTime(0.25, t1 + 0.03); g.gain.setValueAtTime(0.22, t1 + d * 0.6); g.gain.exponentialRampToValueAtTime(0.0005, t1 + d);
      o.connect(rale);
      for (const [ff, q, v] of [[1000, 3, 1], [1700, 4, 0.6]]) { const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = ff * h; f.Q.value = q; const fg = ctx.createGain(); fg.gain.value = v; rale.connect(f); f.connect(fg); fg.connect(g); }
      g.connect(bus); o.start(t1); o.stop(t1 + d + 0.02); lfo.start(t1); lfo.stop(t1 + d + 0.02);
    }
  },
  // Les moutons : une brebis qui bêle, l'agneau qui répond, un autre plus loin (une voix nasale qui chevrote)
  // (v1.64) o.un : un seul bêlement, celui de la brebis ('brebis') ou de l'agneau ('agneau'), quand un mouton du pré bêle
  moutons(t, bus, o = {}) {
    const ctx = this.ctx;
    const niv = ctx.createGain(); niv.gain.value = 1.2; niv.connect(bus); bus = niv;
    const belement = (t1, f0, d, vol, chevrote) => {
      const o = ctx.createOscillator(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(f0 * 0.9, t1); o.frequency.linearRampToValueAtTime(f0, t1 + 0.08); o.frequency.linearRampToValueAtTime(f0 * 0.94, t1 + d * 0.8); o.frequency.exponentialRampToValueAtTime(f0 * 0.8, t1 + d);
      const vib = ctx.createGain(); vib.gain.value = 0.55; const lfo = ctx.createOscillator(); lfo.frequency.value = chevrote; const lg = ctx.createGain(); lg.gain.value = 0.45; lfo.connect(lg); lg.connect(vib.gain);
      const fm = ctx.createGain(); fm.gain.value = f0 * 0.03; lfo.connect(fm); fm.connect(o.frequency);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0005, t1); g.gain.exponentialRampToValueAtTime(vol, t1 + 0.06); g.gain.setValueAtTime(vol, t1 + d * 0.7); g.gain.exponentialRampToValueAtTime(0.0005, t1 + d);
      o.connect(vib);
      for (const [ff, q, v] of [[750, 3, 1], [1350, 4, 0.7], [2500, 5, 0.25]]) { const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = ff; f.Q.value = q; const fg = ctx.createGain(); fg.gain.value = v; vib.connect(f); f.connect(fg); fg.connect(g); }
      g.connect(bus); o.start(t1); o.stop(t1 + d + 0.02); lfo.start(t1); lfo.stop(t1 + d + 0.02);
    };
    if (o.un === 'brebis') return belement(t, 260, 0.75, 0.3, 7);
    if (o.un === 'agneau') return belement(t, 470, 0.5, 0.22, 10);
    belement(t, 260, 0.75, 0.3, 7);
    belement(t + 0.95, 470, 0.5, 0.22, 10);
    belement(t + 1.9, 230, 0.6, 0.12, 6.5);
  },
  // Les crapauds du marais : deux crapauds qui se répondent (« rrrôa » : des impulsions graves très serrées)
  crapauds(t, bus) {
    const niv = this.ctx.createGain(); niv.gain.value = 1.15; niv.connect(bus); bus = niv;
    const coasse = (t1, f0, n, ecart, vol) => { for (let k = 0; k < n; k++) this.tonGlisse(t1 + k * ecart, ecart * 0.8, bus, { forme: 'square', de: f0 * (1 + k / n * 0.15), a: f0 * 0.9, volume: vol * Math.sin((k + 1) / (n + 1) * Math.PI), attaque: 0.003, filtre: 700 }); };
    coasse(t, 150, 10, 0.028, 0.2); coasse(t + 0.7, 150, 10, 0.028, 0.2);
    coasse(t + 1.2, 230, 7, 0.024, 0.14);
    coasse(t + 1.9, 150, 12, 0.028, 0.2);
    this.percu('goutte', t + 2.4, 0.8, bus);
  },
  // La cloche du marché : le beffroi qui sonne trois coups (mi), le dernier qui résonne
  couture(t, bus) {
    const niv = this.ctx.createGain(); niv.gain.value = 3.7; niv.connect(bus); bus = niv;
    for (let i = 0; i < 3; i++) {
      const tp = t + i * 0.62;
      this.bruitGlisse(tp, 0.018, bus, { de: 3200, a: 2600, q: 2, volume: 0.18, attaque: 0.001 });
      this.tonGlisse(tp + 0.005, 0.04, bus, { de: 240, a: 160, volume: 0.1, attaque: 0.002 });
      this.bruitGlisse(tp + 0.12, 0.32, bus, { de: 1800, a: 4200, q: 5, volume: 0.06, attaque: 0.12 });
    }
  },
  // Les pièces dans la besace : elles tintent, étouffées par le cuir, de plus en plus serrées ; le cordon qu'on serre
  besace(t, bus, o = {}) {
    const ctx = this.ctx, n = Math.min(10, Math.max(3, Math.round((o.montant || 30) / 6)));
    const niv = ctx.createGain(); niv.gain.value = 0.95; niv.connect(bus); bus = niv;
    const cuir = ctx.createBiquadFilter(); cuir.type = 'lowpass'; cuir.frequency.value = 2400; cuir.Q.value = 0.7; cuir.connect(bus);
    this.tonGlisse(t, 0.12, bus, { de: 150, a: 70, volume: 0.25, attaque: 0.004 });
    let tp = t + 0.05;
    for (let i = 0; i < n; i++) { SONS.piece.call(this, tp, cuir, o); this.bruitGlisse(tp, 0.04, bus, { type: 'lowpass', de: 700, a: 300, volume: 0.06, attaque: 0.003 }); tp += 0.11 * Math.pow(0.86, i) + Math.random() * 0.02; }
    this.bruitGlisse(tp + 0.15, 0.2, bus, { de: 1800, a: 3200, q: 3, volume: 0.07, attaque: 0.05 });
  },
};
// Le volume de chaque sol (mesurés comme les pas de la v1.61 : le même niveau pour tous)
const NIVEAU_PAS = { herbe: 1.1, neige: 1.9, boue: 2.3, paves: 1.65, terre: 0.93, parquet: 1.39, feuilles: 1.73, sable: 1.9, gravier: 1.35, pierre: 2.3 };
const SOLS_PAS = Object.keys(NIVEAU_PAS);
Object.assign(SONS, SONS_RECITS);

// Les sons fabriqués une fois puis rejoués depuis le cache : leur durée de rendu (s), la clé de leurs réglages et
// le nombre de variantes gardées (les sons tirés au hasard : quelques versions, pour ne pas lasser l'oreille)
const SONS_EN_CACHE = {
  mortChoeur: { duree: 8.5 }, mortCordes: { duree: 7.8 }, mortGlas: { duree: 10 },
  pasDehors: { duree: o => 0.6 + (o.n || 4) * 0.56, cle: o => (o.sol || 'herbe') + (o.n || 4), variantes: 4 },
  porteLourde: { duree: 2.4 }, degainer: { duree: 1.8 }, fleche: { duree: 1.1, variantes: 2 },
  feuDeCamp: { duree: o => (o.duree || 4) + 0.4, cle: o => o.duree || 4, variantes: 2 }, torche: { duree: 1.5, variantes: 2 },
  ventMontagne: { duree: o => (o.duree || 5) + 0.3, cle: o => o.duree || 5, variantes: 2 }, corbeau: { duree: 1.1 },
  moutons: { duree: 3, cle: o => o.un || 'trois' }, crapauds: { duree: 3, variantes: 2 }, couture: { duree: 2.1 },
  besace: { duree: 2, cle: o => Math.min(10, Math.max(3, Math.round((o.montant || 30) / 6))), variantes: 2 },
};
for (const [nom, spec] of Object.entries(SONS_EN_CACHE)) SONS[nom].cache = spec;

// --- Où jouer quoi ---
// Les trois contrées musicales des récits : la forêt (et la Comté, les terres elfiques, la côte, les bambous), la
// montagne (les pics, les mines, les terres désolées et brûlées, les cités de pierre et de cristal), le marais (et les
// ruines, l'antre, les terres maudites des Bannis)
const CONTREE_MUSICALE = {
  comte: 'Foret', foret: 'Foret', sanctuaire: 'Foret', val: 'Foret', cote: 'Foret', monastere: 'Foret',
  mines: 'Montagne', neige: 'Montagne', desert: 'Montagne', badlands: 'Montagne', citadelle: 'Montagne', opale: 'Montagne',
  marais: 'Marais', bourbier: 'Marais', ruines: 'Marais', antre: 'Marais', tour: 'Marais', nuitPourpre: 'Marais', repaire: 'Marais',
};
function contreeMusicale(biome) { return CONTREE_MUSICALE[biome] || 'Foret'; }
// La musique d'un récit selon la contrée et le moment : 'route' (il marche), 'danger' (une bête, des brigands),
// 'victoire' (il revient avec le butin)
function musiqueRecit(biome, moment = 'route') {
  return ({ route: 'aventure', danger: 'danger', victoire: 'triomphe' }[moment] || 'aventure') + contreeMusicale(biome);
}
// Les épreuves où quelque chose l'attaque : la musique du danger de la contrée
const EPREUVES_DANGER = new Set(['loup', 'bandits', 'pillards', 'araignee', 'sanglier', 'yeti', 'monstre', 'mortvivant', 'esprits', 'morsure', 'sangsues', 'avalanche', 'danger']);

// La mort d'un voyageur, selon l'endroit où il est tombé :
//  - le chœur des disparus dans les forêts et les lieux elfiques ou sacrés (on chante pour lui) ;
//  - les cordes qui pleurent dans les plaines, les villages et sur la côte (les siens le pleurent) ;
//  - le grand glas dans les montagnes, les mines, les déserts, les marais, les ruines et les terres maudites (la cloche
//    lointaine d'un lieu où personne ne viendra le chercher).
const MORT_PAR_BIOME = {
  foret: 'mortChoeur', sanctuaire: 'mortChoeur', val: 'mortChoeur', opale: 'mortChoeur', monastere: 'mortChoeur', citadelle: 'mortChoeur',
  comte: 'mortCordes', cote: 'mortCordes',
};
const MORT_PAR_LIEU = { abbaye: 'mortChoeur', chamans: 'mortGlas', pont: 'mortGlas' };   // (l'abbaye est un lieu saint ; la clairière des chamans et le pont des trolls sont des terres d'ombre)
const DUREE_MORT = { mortChoeur: 7.5, mortCordes: 6.5, mortGlas: 8.2 };
function mortDuLieu(zone) {
  const z = ZONES[zone] || {};
  return MORT_PAR_LIEU[z.vignette] || MORT_PAR_BIOME[z.biome] || 'mortGlas';
}
// Le sol sous ses pieds dans un récit, selon la contrée et la saison : la neige des pics (et partout dehors au
// Givre), la vase des marais, le sable du désert et de la côte, le gravier des mines et des terres brûlées, la pierre de
// taille des cités et des châteaux, les vieux pavés des ruines, les feuilles mortes du val et des forêts aux Brumes, la
// terre sèche des sentiers aux Moissons et au monastère, l'herbe sinon
function solDuBiome(biome, saison = null) {
  if (biome === 'neige') return 'neige';
  if (saison === 'givre' && ['comte', 'foret', 'val', 'sanctuaire', 'repaire', 'monastere', 'citadelle'].includes(biome)) return 'neige';
  if (biome === 'marais' || biome === 'bourbier') return 'boue';
  if (biome === 'desert' || biome === 'cote') return 'sable';
  if (['mines', 'badlands', 'antre'].includes(biome)) return 'gravier';
  if (['opale', 'citadelle', 'nuitPourpre'].includes(biome)) return 'pierre';
  if (biome === 'ruines' || biome === 'tour') return 'paves';
  if (biome === 'val' || (saison === 'brumes' && ['foret', 'sanctuaire', 'repaire', 'comte'].includes(biome))) return 'feuilles';
  if (biome === 'monastere' || (saison === 'moissons' && biome === 'comte')) return 'terre';
  return 'herbe';
}
// Un pas (le talon qui se pose) sur ce sol ; `volume` : plus bas pour le héros en ville, où l'on marche longtemps
function jouerPas(sol, volume = 1) {
  if (typeof Son === 'undefined' || !Son.pret || !sol) return;
  Son.jouer('pasDehors', { sol, n: 1, volume });
}

// Les bruits de fond d'un récit, de temps en temps : le vent des cols, les crapauds du marais (les moutons des
// collines bêlent eux-mêmes, voir moutonVivant). Ils s'arrêtent avec la scène, et se taisent pendant « Passer ».
function ambianceSonoreRecit(scene, zone, biome) {
  const sons = [];
  if (biome === 'neige') sons.push(['ventMontagne', 9000, 16000, { duree: 5 }]);
  if (biome === 'marais' || biome === 'bourbier') sons.push(['crapauds', 8000, 16000, {}]);
  for (const [nom, min, max, o] of sons) {
    const tour = () => scene.time.delayedCall(min + Math.random() * (max - min), () => {
      if (!scene.sys.isActive()) return;
      if (!scene.rapide && !scene.finRecit) Son.jouer(nom, o);
      tour();
    });
    scene.time.delayedCall(1500 + Math.random() * 2500, () => { if (scene.sys.isActive() && !scene.rapide && !scene.finRecit) Son.jouer(nom, o); tour(); });
  }
  // (on prépare d'avance ce qui servira : les pas sur ce sol, la mort de ce lieu, les bruits de fond)
  const v = scene.parti && scene.parti.voyageur, r = scene.parti && scene.parti.resultat;
  const sol = scene.solRecit ? scene.solRecit() : solDuBiome(biome);
  Son.prechauffer([['pasDehors', { sol, n: 1 }], ['pasDehors', { sol, n: 1 }], ['pasDehors', { sol, n: 1 }], ...sons.map(([nom, , , o]) => [nom, o]),
    ...(r && !r.vivant ? [[mortDuLieu(zone)]] : []), ['degainer'], ['fleche'], ['torche'], ['feuDeCamp', {}], ['besace', { montant: (v && v.butin) || 30 }]]);
}
