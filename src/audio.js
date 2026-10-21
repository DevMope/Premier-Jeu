// La musique et les sons du jeu, tout synthétisés dans le navigateur (Web Audio) : aucun
// fichier à charger. Les musiques sont des boucles génératives : chaque moment du jeu a sa
// tonalité, son tempo, ses instruments et un motif qui revient (pour qu'on le retienne), le
// reste varie d'une mesure à l'autre pour ne pas lasser.
//
// Inspirations : la Comté du Hobbit (flûte et luth, gigues en 6/8), Stardew Valley et Travellers
// Rest (marchés chaleureux, nuits douces), Harry Potter (boîte à musique et célesta, valses
// mystérieuses), The Witcher 3 (bourdons, vielle et cordes pour les contrées sauvages), Tavern
// Master (auberge cosy), Terraria et Dave the Diver (petites mélodies claires), Papers, Please
// (le comptoir, grave et posé).

const Son = {
  ctx: null, pret: false,
  // (v0.57) cinq volumes : le général, puis la musique, les bruitages, les voix et l'interface (clics, pages)
  volumes: { general: 0.9, musique: 0.55, sons: 0.8, voix: 0.8, interface: 0.7 },
  coupe: { general: false, musique: false, sons: false, voix: false, interface: false },
  theme: null, boucle: null, horloge: 0, mesure: 0, graine: 1,
  courant: null,   // le bus de la musique en cours (pour le fondu)

  // --- Démarrage : au premier geste du joueur (les navigateurs l'exigent) ---
  demarrer() {
    if (this.pret) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      const p = JSON.parse(localStorage.getItem('passage_audio') || 'null');
      if (p) { this.volumes = { ...this.volumes, ...(p.volumes || {}) }; this.coupe = { ...this.coupe, ...(p.coupe || {}) }; }
    } catch (e) { /* (pas de réglages gardés) */ }
    // Sur iPhone et iPad, le son du web est coupé par le bouton silencieux (ou le mode silence) :
    // on se déclare comme un lecteur de musique, qui joue même en silencieux, comme un jeu.
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* (ancien Safari) */ }
    this.ctx = new AC();
    this.debloquer();
    this.maitre = this.ctx.createGain(); this.maitre.gain.value = 0.9; this.maitre.connect(this.ctx.destination);
    // Une réverbération d'auberge : une réponse impulsionnelle de bruit qui s'éteint en 1,8 s
    const duree = 1.8, n = Math.floor(this.ctx.sampleRate * duree), imp = this.ctx.createBuffer(2, n, this.ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = imp.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.6) * 0.5; }
    this.reverb = this.ctx.createConvolver(); this.reverb.buffer = imp;
    this.reverbGain = this.ctx.createGain(); this.reverbGain.gain.value = 0.35;
    this.reverb.connect(this.reverbGain); this.reverbGain.connect(this.maitre);
    this.busSons = this.ctx.createGain(); this.busSons.connect(this.maitre); this.busSons.connect(this.reverb);
    this.busMusique = this.ctx.createGain(); this.busMusique.connect(this.maitre); this.busMusique.connect(this.reverb);
    this.busVoix = this.ctx.createGain(); this.busVoix.connect(this.maitre); this.busVoix.connect(this.reverb);
    this.busInterface = this.ctx.createGain(); this.busInterface.connect(this.maitre);
    this.pret = true;
    this.appliquerVolumes();   // (v0.94 : après « prêt », sinon les volumes gardés étaient ignorés au rechargement)
    if (this.themeVoulu) this.ambiance(this.themeVoulu);
    if (this.natureVoulue) this.nature(true);
  },

  // --- (v0.93) La nature autour de l'écran titre, selon l'heure de l'appareil : les oiseaux le
  // matin, les cigales l'après-midi, les grillons et la chouette le soir (sous la musique) ---
  // (v0.99) dehors, dans la rue et devant le comptoir : la nature de la saison (opts.saison), plus bas
  nature(allumer, opts = {}) {
    this.natureVoulue = allumer;
    if (allumer) this.natureOpts = opts;
    opts = this.natureOpts || {};
    if (!this.pret) return;
    if (!allumer) {
      (this.natureMinuteries || []).forEach(clearTimeout); this.natureMinuteries = [];
      if (this.natureBus) { const b = this.natureBus, t = this.ctx.currentTime; b.gain.cancelScheduledValues(t); b.gain.setValueAtTime(b.gain.value, t); b.gain.linearRampToValueAtTime(0, t + 1);
        const n = this.natureNoeuds || []; setTimeout(() => { n.forEach(x => { try { x.stop(); } catch (e) { /* (déjà arrêté) */ } }); b.disconnect(); }, 1200); }
      this.natureBus = null; this.natureNoeuds = [];
      return;
    }
    if (this.natureBus) return;
    const ctx = this.ctx, sortie = this.natureBus = ctx.createGain(), noeuds = this.natureNoeuds = [], minuteries = this.natureMinuteries = [];
    sortie.gain.setValueAtTime(0, ctx.currentTime); sortie.gain.linearRampToValueAtTime(opts.volume || 1.3, ctx.currentTime + 2);
    sortie.connect(this.busMusique);
    const bruit = (duree = 2) => { const b = ctx.createBuffer(1, ctx.sampleRate * duree, ctx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; };
    const boucleBruit = (filtre, freq, q, gain) => { const src = ctx.createBufferSource(); src.buffer = bruit(3); src.loop = true; const f = ctx.createBiquadFilter(); f.type = filtre; f.frequency.value = freq; f.Q.value = q; const g = ctx.createGain(); g.gain.value = gain; src.connect(f).connect(g).connect(sortie); src.start(); noeuds.push(src); return { f, g }; };
    // (v0.97) une minuterie qui a sonné quitte la liste (elle grossissait sans fin) ; son coupé
    // (onglet en veille), on attend au lieu d'empiler des sons qui partiraient tous d'un coup au retour
    const plus = (ms, f) => { const id = setTimeout(() => { const i = minuteries.indexOf(id); if (i >= 0) minuteries.splice(i, 1); if (this.natureBus !== sortie) return; if (ctx.state === 'running') f(); else plus(1000, f); }, ms); minuteries.push(id); };
    const chaque = (min, max, f) => { const tour = () => { f(); plus(min + Math.random() * (max - min), tour); }; plus(Math.random() * min, tour); };
    const gazouillis = (base = 3200, vol = 0.05) => {
      const t0 = ctx.currentTime, n = 2 + Math.floor(Math.random() * 5);
      for (let k = 0; k < n; k++) {
        const t = t0 + k * (0.08 + Math.random() * 0.06), o = ctx.createOscillator(), m = ctx.createOscillator(), mg = ctx.createGain(), g = ctx.createGain(), f = base * (0.8 + Math.random() * 0.5);
        o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * (Math.random() < 0.5 ? 1.4 : 0.7), t + 0.07);
        m.frequency.value = 40 + Math.random() * 60; mg.gain.value = f * 0.08; m.connect(mg).connect(o.frequency);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
        o.connect(g).connect(sortie); o.start(t); m.start(t); o.stop(t + 0.1); m.stop(t + 0.1);
      }
    };
    const merle = () => { const t0 = ctx.currentTime;
      [1, 1.25, 0.9].forEach((r, k) => { const t = t0 + k * 0.22, o = ctx.createOscillator(), g = ctx.createGain(), f = 1700 * r * (0.95 + Math.random() * 0.1); o.type = 'sine';
        o.frequency.setValueAtTime(f, t); o.frequency.linearRampToValueAtTime(f * 1.08, t + 0.15);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.045, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2); o.connect(g).connect(sortie); o.start(t); o.stop(t + 0.22); }); };
    const tourterelle = () => { const t0 = ctx.currentTime;
      [[520, 0.35], [440, 0.5]].forEach(([f, d], k) => { const t = t0 + k * 0.45, o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = f;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.025, t + 0.08); g.gain.linearRampToValueAtTime(0, t + d); o.connect(g).connect(sortie); o.start(t); o.stop(t + d); }); };
    const chouette = () => { const t0 = ctx.currentTime;
      [[0, 0.5], [0.9, 0.18], [1.15, 0.6]].forEach(([dt, d]) => { const t = t0 + dt, o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(390, t); o.frequency.linearRampToValueAtTime(360, t + d);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.04, t + 0.06); g.gain.linearRampToValueAtTime(0, t + d); o.connect(g).connect(sortie); o.start(t); o.stop(t + d); }); };
    const vent = (vol = 0.05, freq = 500) => { const v = boucleBruit('lowpass', freq, 0.7, vol * 0.4);
      const souffle = () => { const t = ctx.currentTime, d = 4 + Math.random() * 4; v.g.gain.linearRampToValueAtTime(vol * (0.5 + Math.random() * 0.8), t + d / 2); v.g.gain.linearRampToValueAtTime(vol * 0.25, t + d); v.f.frequency.linearRampToValueAtTime(freq * (0.7 + Math.random() * 0.8), t + d); };
      souffle(); chaque(5000, 8000, souffle); };
    const cigales = (vol = 0.06) => { const c = boucleBruit('bandpass', 4600, 8, 0), lfo = ctx.createOscillator(), lg = ctx.createGain();
      lfo.frequency.value = 38; lg.gain.value = vol * 0.6; lfo.connect(lg).connect(c.g.gain); lfo.start(); noeuds.push(lfo);
      const vague = () => { const t = ctx.currentTime; c.g.gain.cancelScheduledValues(t); c.g.gain.setValueAtTime(c.g.gain.value, t); c.g.gain.linearRampToValueAtTime(vol * (0.4 + Math.random() * 0.6), t + 2.5); c.g.gain.linearRampToValueAtTime(vol * 0.08, t + 6 + Math.random() * 3); };
      vague(); chaque(7000, 11000, vague); };
    const grillons = () => { for (const [f, ecart] of [[4200, 0], [4600, 340]]) chaque(700, 900, () => plus(ecart, () => { const t = ctx.currentTime;
      for (let k = 0; k < 3; k++) { const o = ctx.createOscillator(), g = ctx.createGain(), tt = t + k * 0.05; o.frequency.value = f;
        g.gain.setValueAtTime(0, tt); g.gain.linearRampToValueAtTime(0.018, tt + 0.008); g.gain.linearRampToValueAtTime(0, tt + 0.035); o.connect(g).connect(sortie); o.start(tt); o.stop(tt + 0.04); } })); };
    const h = new Date().getHours();
    if (opts.saison === 'semailles') { vent(0.01, 400); chaque(700, 2000, () => gazouillis(3000 + Math.random() * 1500)); chaque(3000, 6000, merle); chaque(8000, 14000, tourterelle); }
    else if (opts.saison === 'moissons') { cigales(0.05); vent(0.012, 350); chaque(6000, 10000, () => gazouillis(3600, 0.025)); }
    else if (opts.saison === 'brumes') { vent(0.05, 520); chaque(9000, 16000, () => gazouillis(2600, 0.02)); }
    else if (opts.saison === 'givre') { vent(0.03, 260); }
    else if (h >= 6 && h < 12) { vent(0.012, 400); chaque(900, 2600, () => gazouillis(3000 + Math.random() * 1500)); chaque(3500, 7000, merle); chaque(9000, 16000, tourterelle); }
    else if (h >= 12 && h < 19) { cigales(); vent(0.015, 350); chaque(5000, 9000, () => gazouillis(3600, 0.03)); }
    else { grillons(); vent(0.018, 300); chaque(9000, 15000, chouette); }
  },
  // Safari ne laisse sortir le son qu'après une vraie action du joueur : on reprend le contexte et
  // on joue un échantillon muet pendant ce geste, ce qui « déverrouille » la sortie audio.
  // (Il peut aussi être « interrompu » : un appel, l'iPad mis en veille, l'app en arrière-plan.)
  reprendre() {
    if (!this.ctx || (window.OfflineAudioContext && this.ctx instanceof OfflineAudioContext)) return;
    if (this.ctx.state !== 'running') { try { this.ctx.resume(); } catch (e) { /* (rien) */ } }
    this.debloquer();
  },
  debloquer() {
    if (this.debloque && this.ctx.state === 'running') return;
    try {
      const muet = this.ctx.createBuffer(1, 1, 22050), src = this.ctx.createBufferSource();
      src.buffer = muet; src.connect(this.ctx.destination); src.start(0);
      this.debloque = true;
    } catch (e) { /* (rien) */ }
  },
  appliquerVolumes() {
    if (!this.pret) return;
    const v = quoi => (this.coupe[quoi] ? 0 : this.volumes[quoi]);
    this.maitre.gain.value = v('general');
    this.busSons.gain.value = v('sons');
    this.busMusique.gain.value = v('musique');
    this.busVoix.gain.value = v('voix');
    this.busInterface.gain.value = v('interface');
  },
  regler(quoi, valeur) {
    this.volumes[quoi] = Math.max(0, Math.min(1, valeur));
    this.appliquerVolumes(); this.sauver();
  },
  basculer(quoi) { this.coupe[quoi] = !this.coupe[quoi]; this.appliquerVolumes(); this.sauver(); },
  sauver() { try { localStorage.setItem('passage_audio', JSON.stringify({ volumes: this.volumes, coupe: this.coupe })); } catch (e) { /* tant pis */ } },

  // --- Les instruments : une note = oscillateurs + enveloppe (+ filtre), dans un bus ---
  note(instrument, freq, t, duree, force = 1, bus = null) {
    const ctx = this.ctx; bus = bus || this.busMusique;
    const I = INSTRUMENTS[instrument]; if (!I) return;
    const g = ctx.createGain(); g.gain.value = 0;
    let sortie = g;
    if (I.filtre) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = I.filtre * (freq > 440 ? 1.6 : 1); f.Q.value = 0.7; g.connect(f); sortie = f; }
    sortie.connect(bus);
    const a = I.attaque, d = I.decroissance, s = I.tenue, r = I.relache;
    const v = I.volume * force;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(v, t + a);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0005, v * s), t + a + d);
    const fin = t + Math.max(a + d, duree);
    // La fin de la note : un petit decrescendo, jamais une coupure sèche
    g.gain.linearRampToValueAtTime(Math.max(0.0005, v * s), fin);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0005, v * s * 0.35), fin + r * 0.5);
    g.gain.exponentialRampToValueAtTime(0.0005, fin + r);
    for (const [type, mult, vol, detune] of I.voix) {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = Math.min(18000, freq * mult); o.detune.value = detune || 0;
      const og = ctx.createGain(); og.gain.value = vol; o.connect(og); og.connect(g);
      if (I.vibrato) { const lfo = ctx.createOscillator(); lfo.frequency.value = 5.2; const lg = ctx.createGain(); lg.gain.value = freq * I.vibrato; lfo.connect(lg); lg.connect(o.frequency); lfo.start(t + a); lfo.stop(fin + r + 0.1); }
      if (I.glisse) { o.frequency.setValueAtTime(Math.min(18000, freq * mult * I.glisse), t); o.frequency.exponentialRampToValueAtTime(Math.min(18000, freq * mult), t + a + 0.02); }
      o.start(t); o.stop(fin + r + 0.1);
    }
    if (I.bruit) {
      // Un souffle au début de la note (flûte) ou un claquement (percussions)
      const b = this.bruit(I.bruit.duree, t, bus, I.bruit.volume * force, I.bruit.filtre);
    }
  },
  bruit(duree, t, bus, volume = 0.3, filtre = 2000, type = 'bandpass') {
    const ctx = this.ctx; const n = Math.floor(ctx.sampleRate * duree); const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = filtre; f.Q.value = 1.2;
    const g = ctx.createGain(); g.gain.setValueAtTime(volume, t); g.gain.exponentialRampToValueAtTime(0.0005, t + duree);
    src.connect(f); f.connect(g); g.connect(bus); src.start(t); src.stop(t + duree + 0.05);
    return src;
  },

  // --- La musique : un thème par moment, en fondu enchaîné ---
  ambiance(theme) {
    // Le comptoir a plusieurs musiques (c'est là qu'on passe le plus de temps) : une par jour, en alternance
    if (theme === 'comptoir') { const v = ['comptoir', 'comptoir2', 'comptoir3']; theme = v[((window.GAME && GAME.jour) || 1) % v.length]; }
    this.themeVoulu = theme;
    if (!this.pret) return;
    if (theme === this.theme) return;
    this.arreter();
    this.theme = theme;
    if (!theme || !THEMES[theme]) return;
    const T = THEMES[theme];
    const bus = this.ctx.createGain(); bus.gain.setValueAtTime(0.0005, this.ctx.currentTime); bus.gain.exponentialRampToValueAtTime(1, this.ctx.currentTime + 1.5);
    bus.connect(this.busMusique);
    if (T.reverb) { const r = this.ctx.createGain(); r.gain.value = T.reverb; bus.connect(r); r.connect(this.reverb); bus.resonance = r; } // (plus de résonance pour ce thème)
    this.courant = bus;
    this.mesure = 0; this.graine = 7; this.derniereNote = null;
    this.horloge = this.ctx.currentTime + 0.1;
    const avance = () => {
      if (this.courant !== bus) return;
      // (après une mise en veille, l'horloge du son a filé sans nous : on ne rattrape pas les
      // mesures manquées, sinon des milliers de notes partiraient d'un coup)
      if (this.horloge < this.ctx.currentTime) this.horloge = this.ctx.currentTime + 0.05;
      while (this.horloge < this.ctx.currentTime + 0.6) { this.jouerMesure(T, this.horloge, bus); this.horloge += T.temps * 60 / T.tempo; this.mesure++; }
    };
    avance();
    this.boucle = setInterval(avance, 150);
  },
  arreter() {
    if (this.boucle) { clearInterval(this.boucle); this.boucle = null; }
    if (this.courant && this.ctx) { const b = this.courant, t = this.ctx.currentTime; b.gain.cancelScheduledValues(t); b.gain.setValueAtTime(b.gain.value || 1, t); b.gain.exponentialRampToValueAtTime(0.0005, t + 1.2); setTimeout(() => { b.disconnect(); if (b.resonance) b.resonance.disconnect(); }, 1500); }
    this.courant = null; this.theme = null;
  },
  // Un tirage déterministe par thème (la même partie de la musique revient, mais pas à l'identique)
  hasard() { this.graine = (this.graine * 1103515245 + 12345) & 0x7fffffff; return this.graine / 0x7fffffff; },

  // Une mesure : l'accord du moment, la basse, l'accompagnement, la mélodie, la percussion
  jouerMesure(T, t0, bus) {
    const temps = 60 / T.tempo, m = this.mesure;
    const accord = T.accords[m % T.accords.length];                 // degré de la gamme (0 = tonique)
    const gamme = T.gamme;
    const freq = (deg, oct = 0) => T.base * Math.pow(2, (gamme[((deg % 7) + 7) % 7] + Math.floor(deg / 7) * 12 + oct * 12) / 12);
    const tons = [accord, accord + 2, accord + 4];                   // les notes de l'accord
    // La basse : la fondamentale, parfois la quinte, sur les temps forts
    if (T.basse) for (const [pos, deg, dur] of T.basse(m, accord)) this.note(T.instruments.basse, freq(deg, -1), t0 + pos * temps, dur * temps, 0.9 * (T.forceBasse || 1), bus);
    // L'accompagnement : un arpège ou des accords plaqués
    if (T.accompagnement) for (const [pos, i, dur, force] of T.accompagnement(m)) this.note(T.instruments.accompagnement, freq(tons[i % 3] + Math.floor(i / 3) * 7), t0 + pos * temps, dur * temps, force ?? 0.6, bus);
    // La mélodie : le motif du thème sur certaines mesures, une broderie dans la gamme sinon
    const phrase = m % T.phrase;
    let notes;
    if (T.motif[phrase]) { notes = T.motif[phrase]; this.derniereNote = notes[notes.length - 1][1]; }
    else {
      // La broderie repart de la dernière note jouée (pas de saut après une pause), se pose sur
      // une note de l'accord après un silence ou sur une longue, et la phrase se termine sur la
      // tonique, tenue (pour que l'oreille retombe sur ses pieds)
      notes = []; let deg = this.derniereNote ?? (tons[0] + 7), pos = 0, apresSilence = false;
      const rythme = T.rythmes[Math.floor(this.hasard() * T.rythmes.length)];
      const dernier = phrase === T.phrase - 1;
      for (let i = 0; i < rythme.length; i++) {
        const dur = rythme[i];
        if (dernier && i === rythme.length - 1) { notes.push([pos, accord === 0 ? 7 : 7, T.temps - pos]); break; }
        if (this.hasard() < T.silence && i > 0 && !dernier) { pos += dur; apresSilence = true; continue; }
        const saut = this.hasard() < 0.7 ? (this.hasard() < 0.5 ? -1 : 1) : (this.hasard() < 0.5 ? -2 : 2);
        deg = Math.max(accord + 4, Math.min(accord + 13, deg + saut));
        if ((dur >= 1 || apresSilence) && !tons.some(x => ((deg - x) % 7 + 7) % 7 === 0)) deg += (this.hasard() < 0.5 ? -1 : 1);
        if (!tons.some(x => ((deg - x) % 7 + 7) % 7 === 0) && (dur >= 1 || apresSilence)) deg += 1;
        apresSilence = false;
        notes.push([pos, deg, dur * (T.lie || 0.95)]); pos += dur;
      }
      if (notes.length) this.derniereNote = notes[notes.length - 1][1];
    }
    for (const [pos, deg, dur] of notes) this.note(T.instruments.melodie, freq(deg + (T.octaveMelodie || 0) * 7), t0 + pos * temps, dur * temps, 0.8 + this.hasard() * 0.2, bus);
    // La percussion
    if (T.percussion && !this.coupe.musique) for (const [pos, quoi, force] of T.percussion(m)) this.percu(quoi, t0 + pos * temps, force ?? 1, bus);
  },
  percu(quoi, t, force, bus) {
    if (quoi === 'tambour') { const o = this.ctx.createOscillator(); const g = this.ctx.createGain(); o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12); g.gain.setValueAtTime(0.5 * force, t); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.25); o.connect(g); g.connect(bus); o.start(t); o.stop(t + 0.3); }
    else if (quoi === 'tambourin') this.bruit(0.08, t, bus, 0.16 * force, 6000, 'highpass');
    else if (quoi === 'bois') this.bruit(0.03, t, bus, 0.25 * force, 2400);
    else if (quoi === 'pieces') { const g = this.ctx.createGain(); g.gain.value = force; g.connect(bus); SONS.piece.call(this, t, g, {}); if (force > 0.45) SONS.piece.call(this, t + 0.06, g, {}); }
    else if (quoi === 'timbale') { const o = this.ctx.createOscillator(); const g = this.ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(95, t); o.frequency.exponentialRampToValueAtTime(58, t + 0.25); g.gain.setValueAtTime(0.0005, t); g.gain.exponentialRampToValueAtTime(0.55 * force, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.9); o.connect(g); g.connect(bus); o.start(t); o.stop(t + 1); this.bruit(0.05, t, bus, 0.12 * force, 300); }
    else if (quoi === 'goutte') { const o = this.ctx.createOscillator(); const g = this.ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(1500, t); o.frequency.exponentialRampToValueAtTime(700, t + 0.08); g.gain.setValueAtTime(0.0005, t); g.gain.exponentialRampToValueAtTime(0.09 * force, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.18); o.connect(g); g.connect(bus); o.start(t); o.stop(t + 0.2); }
    else if (quoi === 'souffle') this.bruit(0.16, t, bus, 0.05 * force, 900);
    else if (quoi === 'coeur') { const o = this.ctx.createOscillator(); const g = this.ctx.createGain(); o.frequency.value = 50; g.gain.setValueAtTime(0.6 * force, t); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.35); o.connect(g); g.connect(bus); o.start(t); o.stop(t + 0.4); }
  },

  // Rendre un thème (ou un son) hors ligne, en WAV : pour l'écouter sans jouer, et pour les tests.
  async rendre(theme, secondes = 20, son = null) {
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const sauve = { ctx: this.ctx, maitre: this.maitre, reverb: this.reverb, reverbGain: this.reverbGain, busSons: this.busSons, busMusique: this.busMusique, pret: this.pret, theme: this.theme, courant: this.courant, boucle: this.boucle, mesure: this.mesure, graine: this.graine };
    this.ctx = new OAC(2, 44100 * secondes, 44100);
    this.maitre = this.ctx.createGain(); this.maitre.gain.value = 0.9; this.maitre.connect(this.ctx.destination);
    const duree = 1.8, n = Math.floor(44100 * duree), imp = this.ctx.createBuffer(2, n, 44100);
    for (let c = 0; c < 2; c++) { const d = imp.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.6) * 0.5; }
    this.reverb = this.ctx.createConvolver(); this.reverb.buffer = imp; this.reverbGain = this.ctx.createGain(); this.reverbGain.gain.value = 0.35; this.reverb.connect(this.reverbGain); this.reverbGain.connect(this.maitre);
    this.busSons = this.ctx.createGain(); this.busSons.connect(this.maitre); this.busSons.connect(this.reverb);
    this.busMusique = this.ctx.createGain(); this.busMusique.gain.value = 0.7; this.busMusique.connect(this.maitre); this.busMusique.connect(this.reverb);
    this.pret = true; this.boucle = null; this.courant = null; this.theme = null;
    if (Array.isArray(son)) for (const [nom, t] of son) SONS[nom].call(this, t, this.busCorrige(nom, this.busSons), {});
    else if (son) SONS[son].call(this, 0.2, this.busCorrige(son, this.busSons), {});
    else {
      const T = THEMES[theme]; this.mesure = 0; this.graine = 7; this.derniereNote = null;
      for (let t = 0.1; t < secondes; t += T.temps * 60 / T.tempo) { this.jouerMesure(T, t, this.busMusique); this.mesure++; }
    }
    const buffer = await this.ctx.startRendering();
    Object.assign(this, sauve);
    return buffer;
  },
  // Un AudioBuffer → un fichier WAV (16 bits)
  wav(buffer) {
    const n = buffer.length, canaux = buffer.numberOfChannels, taux = buffer.sampleRate;
    const out = new ArrayBuffer(44 + n * canaux * 2), v = new DataView(out);
    const ecrire = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    ecrire(0, 'RIFF'); v.setUint32(4, 36 + n * canaux * 2, true); ecrire(8, 'WAVE'); ecrire(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, canaux, true); v.setUint32(24, taux, true); v.setUint32(28, taux * canaux * 2, true); v.setUint16(32, canaux * 2, true); v.setUint16(34, 16, true); ecrire(36, 'data'); v.setUint32(40, n * canaux * 2, true);
    let o = 44;
    for (let i = 0; i < n; i++) for (let c = 0; c < canaux; c++) { const x = Math.max(-1, Math.min(1, buffer.getChannelData(c)[i])); v.setInt16(o, x < 0 ? x * 32768 : x * 32767, true); o += 2; }
    return out;
  },

  // --- Les sons du jeu ---
  jouer(nom, options = {}) {
    if (!this.pret) return;
    this.reprendre();
    const S = SONS[nom]; if (!S) return;
    // (chaque famille de sons passe par son propre volume)
    let bus = nom === 'voix' ? this.busVoix : SONS_INTERFACE.has(nom) ? this.busInterface : this.busSons;
    bus = this.busCorrige(nom, bus);
    S.call(this, this.ctx.currentTime + 0.01, bus, options);
  },
  // Un petit gain propre au son, le temps qu'il se joue (voir VOLUME_SONS)
  busCorrige(nom, bus) {
    const k = VOLUME_SONS[nom];
    if (!k) return bus;
    const g = this.ctx.createGain(); g.gain.value = k; g.connect(bus);
    setTimeout(() => g.disconnect(), 6000);
    return g;
  },
};

// Les instruments : [forme d'onde, multiple de la fréquence, volume, désaccord en cents]
const INSTRUMENTS = {
  clarinette: { voix: [['square', 1, 0.35], ['sine', 1, 0.5], ['sine', 3, 0.12], ['square', 2, 0.05]], attaque: 0.04, decroissance: 0.15, tenue: 0.85, relache: 0.18, volume: 0.17, vibrato: 0.007, filtre: 2600, glisse: 1.012 },
  accordeon: { voix: [['sawtooth', 1, 0.25, -7], ['sawtooth', 1, 0.25, 7], ['square', 2, 0.08], ['sine', 1, 0.3]], attaque: 0.03, decroissance: 0.1, tenue: 0.8, relache: 0.12, volume: 0.1, filtre: 1500 },
  guitare: { voix: [['triangle', 1, 0.7], ['sine', 1, 0.3], ['sine', 2, 0.12], ['sawtooth', 1, 0.06]], attaque: 0.008, decroissance: 0.9, tenue: 0.1, relache: 0.35, volume: 0.22, filtre: 2200, glisse: 1.008 },
  clochette: { voix: [['sine', 1, 0.6], ['sine', 2.0, 0.2], ['sine', 3.01, 0.12], ['sine', 4.2, 0.05]], attaque: 0.004, decroissance: 2.2, tenue: 0.05, relache: 1.5, volume: 0.16 },
  carillon: { voix: [['sine', 1, 0.7], ['sine', 2.76, 0.18], ['sine', 5.4, 0.07], ['sine', 0.5, 0.15]], attaque: 0.012, decroissance: 1.3, tenue: 0.08, relache: 0.9, volume: 0.17 },
  glas: { voix: [['sine', 1, 0.7], ['sine', 2.4, 0.25], ['sine', 3.9, 0.1], ['triangle', 0.5, 0.2]], attaque: 0.005, decroissance: 2.6, tenue: 0.08, relache: 1.8, volume: 0.24 },
  fluteDouce: { voix: [['sine', 1, 0.85], ['triangle', 1, 0.08], ['sine', 2, 0.03]], attaque: 0.09, decroissance: 0.15, tenue: 0.8, relache: 0.35, volume: 0.24, vibrato: 0.004, filtre: 1800 },
  choeur: { voix: [['sawtooth', 1, 0.2, -8], ['sawtooth', 1, 0.2, 8], ['sine', 1, 0.4], ['sine', 2, 0.1, 4]], attaque: 0.6, decroissance: 0.4, tenue: 0.9, relache: 0.9, volume: 0.1, filtre: 900, vibrato: 0.004 },
  flute: { voix: [['sine', 1, 0.7], ['triangle', 1, 0.25], ['sine', 2, 0.08]], attaque: 0.06, decroissance: 0.1, tenue: 0.8, relache: 0.15, volume: 0.22, vibrato: 0.006, bruit: { duree: 0.08, volume: 0.04, filtre: 3000 } },
  luth: { voix: [['triangle', 1, 0.8], ['sawtooth', 1, 0.15], ['sine', 2, 0.15]], attaque: 0.006, decroissance: 0.5, tenue: 0.12, relache: 0.45, volume: 0.22, filtre: 2600, glisse: 1.01 },
  harpe: { voix: [['sine', 1, 0.85], ['triangle', 1, 0.15], ['sine', 2, 0.04]], attaque: 0.012, decroissance: 1.0, tenue: 0.1, relache: 0.6, volume: 0.2, filtre: 2400 },
  celesta: { voix: [['sine', 1, 0.8], ['sine', 4, 0.12], ['sine', 2.4, 0.05]], attaque: 0.012, decroissance: 1.2, tenue: 0.05, relache: 0.6, volume: 0.22 },
  boiteAMusique: { voix: [['sine', 1, 0.7], ['sine', 3, 0.1], ['sine', 5.2, 0.03]], attaque: 0.01, decroissance: 0.8, tenue: 0.04, relache: 0.5, volume: 0.18 },
  cordes: { voix: [['sawtooth', 1, 0.3, -6], ['sawtooth', 1, 0.3, 6], ['sawtooth', 1.005, 0.2, 0]], attaque: 0.35, decroissance: 0.3, tenue: 0.85, relache: 0.5, volume: 0.1, filtre: 1500, vibrato: 0.003 },
  vielle: { voix: [['sawtooth', 1, 0.5], ['square', 1, 0.1, 4], ['sawtooth', 2, 0.12]], attaque: 0.08, decroissance: 0.2, tenue: 0.8, relache: 0.5, volume: 0.12, filtre: 1800, vibrato: 0.008 },
  basse: { voix: [['triangle', 1, 0.8], ['sine', 1, 0.5], ['sawtooth', 1, 0.08]], attaque: 0.01, decroissance: 0.4, tenue: 0.3, relache: 0.2, volume: 0.28, filtre: 500 },
  orgue: { voix: [['sine', 1, 0.6], ['sine', 2, 0.35], ['sine', 3, 0.12], ['sine', 0.5, 0.25]], attaque: 0.25, decroissance: 0.2, tenue: 0.9, relache: 0.6, volume: 0.1 },
  bourdon: { voix: [['sawtooth', 1, 0.3], ['sawtooth', 1, 0.3, 9], ['sine', 0.5, 0.5]], attaque: 1.2, decroissance: 0.5, tenue: 0.9, relache: 1.5, volume: 0.1, filtre: 600 },
  // (v0.57) L'ocarina, façon Zelda : rond, doux, un souffle au début ; il remplace le célesta, trop strident dans l'aigu
  // (v0.58 : plus rond encore — presque une sinusoïde pure, l'attaque plus douce, filtré plus bas,
  // un léger souffle grave ; un peu plus fort, car le grave paraît moins fort à l'oreille)
  ocarina: { voix: [['sine', 1, 0.95], ['sine', 2, 0.05], ['triangle', 0.5, 0.04]], attaque: 0.08, decroissance: 0.15, tenue: 0.88, relache: 0.32, volume: 0.28, vibrato: 0.004, filtre: 1100, bruit: { duree: 0.08, volume: 0.02, filtre: 900 } },
  // Les graves du marché noir : un violoncelle qui chante bas, une contrebasse pincée
  violoncelle: { voix: [['sawtooth', 1, 0.45], ['sawtooth', 1, 0.25, 7], ['sine', 0.5, 0.25]], attaque: 0.18, decroissance: 0.3, tenue: 0.85, relache: 0.5, volume: 0.15, filtre: 900, vibrato: 0.005 },
  pizzicato: { voix: [['triangle', 1, 0.8], ['sine', 1, 0.4], ['sine', 2, 0.08]], attaque: 0.005, decroissance: 0.5, tenue: 0.05, relache: 0.3, volume: 0.28, filtre: 700 },
  // Le drame (la faillite) : des cuivres sombres, des cordes en trémolo
  cuivres: { voix: [['sawtooth', 1, 0.4], ['sawtooth', 1, 0.3, -5], ['square', 0.5, 0.1]], attaque: 0.12, decroissance: 0.3, tenue: 0.8, relache: 0.45, volume: 0.14, filtre: 1100, vibrato: 0.003 },
  cordesTremolo: { voix: [['sawtooth', 1, 0.3, -6], ['sawtooth', 1, 0.3, 6]], attaque: 0.02, decroissance: 0.05, tenue: 0.8, relache: 0.08, volume: 0.07, filtre: 1600 },
  piano: { voix: [['triangle', 1, 0.7], ['sine', 2, 0.2], ['sawtooth', 1, 0.08]], attaque: 0.01, decroissance: 1.4, tenue: 0.08, relache: 0.8, volume: 0.2, filtre: 2200 },
};

// Les gammes, en demi-tons depuis la tonique
const GAMMES = {
  harmonique: [0, 2, 3, 5, 7, 8, 11],
  hante: [0, 2, 3, 6, 7, 8, 11], freygish: [0, 1, 4, 5, 7, 8, 10], majeur: [0, 2, 4, 5, 7, 9, 11], mineur: [0, 2, 3, 5, 7, 8, 10], dorien: [0, 2, 3, 5, 7, 9, 10], mixolydien: [0, 2, 4, 5, 7, 9, 10], lydien: [0, 2, 4, 6, 7, 9, 11],
};
const NOTE = { C: 261.63, D: 293.66, E: 329.63, F: 349.23, G: 392.0, A: 440.0, B: 493.88 };

// Les thèmes. `motif` : les mesures de la phrase qui ont une mélodie écrite ([position, degré, durée]) ;
// les autres sont brodées. `accords` : un degré par mesure. Les positions sont en temps.
const THEMES = {
  // L'écran titre : une valse de boîte à musique, mystérieuse et douce (façon Harry Potter),
  // sur un tapis de cordes
  titre: {
    base: NOTE.E / 2, gamme: GAMMES.mineur, tempo: 150, temps: 3, phrase: 8,
    accords: [0, 0, 5, 5, 3, 3, 4, 4], octaveMelodie: 2,
    instruments: { melodie: 'carillon', accompagnement: 'cordes', basse: 'basse' }, reverb: 0.3, lie: 1.1,
    motif: { 0: [[0, 7, 1.1], [1, 9, 1.1], [2, 11, 1.1]], 1: [[0, 14, 2.1], [2, 11, 1.1]], 2: [[0, 12, 1.1], [1, 11, 1.1], [2, 9, 1.1]], 3: [[0, 10, 3]], 4: [[0, 7, 1.1], [1, 9, 1.1], [2, 11, 1.1]], 5: [[0, 13, 2.1], [2, 14, 1.1]], 6: [[0, 12, 1.6], [1.5, 11, 0.6], [2, 9, 1.1]], 7: [[0, 7, 3]] },
    rythmes: [[1, 1, 1], [2, 1], [1, 2]], silence: 0,
    basse: (m, a) => [[0, a, 2.8]],
    accompagnement: (m) => [[0, 0, 3, 0.5], [0, 1, 3, 0.4], [0, 2, 3, 0.4]],
  },
  // Le marché : une gigue en 6/8, flûte et luth, tambourin (la Comté, Stardew)
  marche: {
    base: NOTE.G / 2, gamme: GAMMES.majeur, tempo: 170, temps: 6, phrase: 8,
    accords: [0, 0, 3, 4, 0, 5, 3, 4], octaveMelodie: 1,
    instruments: { melodie: 'fluteDouce', accompagnement: 'luth', basse: 'basse' },
    motif: { 0: [[0, 7, 1], [1, 9, 1], [2, 11, 1], [3, 14, 2], [5, 11, 1]], 1: [[0, 12, 1], [1, 11, 1], [2, 9, 1], [3, 7, 3]], 4: [[0, 11, 1], [1, 12, 1], [2, 14, 1], [3, 16, 2], [5, 14, 1]], 5: [[0, 13, 1], [1, 12, 1], [2, 11, 1], [3, 9, 3]] },
    rythmes: [[1, 1, 1, 1, 1, 1], [2, 1, 2, 1], [1, 1, 1, 3], [3, 1, 1, 1]], silence: 0.12,
    basse: (m, a) => [[0, a, 1.4], [3, a + 4, 1.4]],
    accompagnement: (m) => [[0, 0, 0.9, 0.7], [1, 1, 0.9, 0.4], [2, 2, 0.9, 0.4], [3, 3, 0.9, 0.6], [4, 1, 0.9, 0.4], [5, 2, 0.9, 0.4]],
    percussion: (m) => [[0, 'tambour', 1], [3, 'tambour', 0.6], [1, 'tambourin', 0.5], [2, 'tambourin', 0.4], [4, 'tambourin', 0.5], [5, 'tambourin', 0.4]],
  },
  // Le comptoir : posé et chaleureux, arpèges de luth et flûte discrète (Tavern Master, Papers Please en plus doux)
  comptoir: {
    base: NOTE.C / 2, gamme: GAMMES.majeur, tempo: 76, temps: 4, phrase: 8,
    accords: [0, 5, 3, 4, 0, 2, 3, 4], octaveMelodie: 2,
    instruments: { melodie: 'flute', accompagnement: 'luth', basse: 'basse' },
    motif: { 0: [[0, 9, 1.5], [1.5, 11, 0.5], [2, 12, 2]], 1: [[0, 11, 1], [1, 9, 1], [2, 7, 2]], 4: [[0, 12, 1.5], [1.5, 14, 0.5], [2, 11, 2]], 5: [[0, 9, 1], [1, 11, 1], [2, 7, 2]] },
    rythmes: [[2, 2], [1, 1, 2], [4], [1.5, 0.5, 2]], silence: 0.35,
    basse: (m, a) => [[0, a, 2], [2, a + 4, 2]],
    accompagnement: (m) => [[0, 0, 1, 0.5], [0.5, 1, 1, 0.35], [1, 2, 1, 0.4], [1.5, 3, 1, 0.35], [2, 2, 1, 0.4], [2.5, 1, 1, 0.35], [3, 0, 1, 0.4], [3.5, 1, 1, 0.3]],
  },
  // Le comptoir, deuxième air : une valse légère de harpe et de célesta (l'auberge un après-midi calme)
  comptoir2: {
    base: NOTE.D / 2, gamme: GAMMES.majeur, tempo: 104, temps: 3, phrase: 8,
    accords: [0, 0, 3, 3, 5, 5, 4, 4], octaveMelodie: 1,
    instruments: { melodie: 'harpe', accompagnement: 'orgue', basse: 'basse' }, reverb: 0.25,
    motif: { 0: [[0, 9, 1], [1, 11, 1], [2, 12, 1]], 1: [[0, 14, 2], [2, 12, 1]], 2: [[0, 11, 1], [1, 9, 1], [2, 7, 1]], 3: [[0, 9, 3]], 4: [[0, 9, 1], [1, 11, 1], [2, 14, 1]], 5: [[0, 16, 2], [2, 14, 1]], 6: [[0, 12, 1], [1, 11, 1], [2, 9, 1]], 7: [[0, 7, 3]] },
    rythmes: [[1, 1, 1], [2, 1]], silence: 0.2,
    basse: (m, a) => [[0, a, 2.8]],
    accompagnement: (m) => [[0, 0, 2.9, 0.35], [0, 1, 2.9, 0.28], [0, 2, 2.9, 0.28]],
  },
  // Le comptoir, troisième air : un barde qui gratte son luth au coin du feu, lent et chaud
  comptoir3: {
    base: NOTE.G / 2, gamme: GAMMES.mixolydien, tempo: 68, temps: 4, phrase: 8,
    accords: [0, 6, 3, 0, 4, 6, 3, 4], octaveMelodie: 1,
    instruments: { melodie: 'vielle', accompagnement: 'luth', basse: 'basse' },
    motif: { 0: [[0, 11, 1.5], [1.5, 9, 0.5], [2, 7, 2]], 1: [[0, 9, 1], [1, 10, 1], [2, 11, 2]], 4: [[0, 14, 1.5], [1.5, 12, 0.5], [2, 11, 2]], 5: [[0, 9, 1], [1, 7, 1], [2, 6, 2]] },
    rythmes: [[2, 2], [1, 1, 2], [1.5, 0.5, 2]], silence: 0.08, lie: 1.05,
    basse: (m, a) => [[0, a, 1.9], [2, a + 4, 1.9]],
    accompagnement: (m) => [[0, 0, 0.8, 0.5], [0, 1, 0.8, 0.4], [0, 2, 0.8, 0.4], [1.5, 1, 0.5, 0.3], [2, 0, 0.8, 0.45], [2, 2, 0.8, 0.35], [3.5, 1, 0.5, 0.3]],
    percussion: (m) => [[1, 'bois', 0.3], [3, 'bois', 0.3]],
  },
  // La nuit : boîte à musique très douce sur un orgue lointain, beaucoup de silence (les nuits de Stardew, la Comté endormie)
  nuit: {
    base: NOTE.A / 2, gamme: GAMMES.mineur, tempo: 58, temps: 4, phrase: 8,
    accords: [0, 5, 2, 6, 0, 5, 3, 4], octaveMelodie: 2,
    instruments: { melodie: 'boiteAMusique', accompagnement: 'orgue', basse: 'basse' },
    motif: { 0: [[0, 7, 2], [2, 9, 1], [3, 11, 1]], 1: [[0, 12, 3]], 4: [[0, 11, 2], [2, 9, 1], [3, 7, 1]], 5: [[0, 8, 3]] },
    rythmes: [[2, 2], [4], [1, 3]], silence: 0.45,
    basse: (m, a) => [[0, a, 3.8]],
    accompagnement: (m) => [[0, 0, 3.9, 0.3], [0, 1, 3.9, 0.25], [0, 2, 3.9, 0.25]],
  },
  // La carte des contrées : cordes et vielle, un souffle d'aventure (Witcher, le Hobbit en route)
  carte: {
    base: NOTE.D / 2, gamme: GAMMES.dorien, tempo: 96, temps: 4, phrase: 8,
    accords: [0, 0, 6, 6, 3, 3, 4, 4], octaveMelodie: 2,
    instruments: { melodie: 'vielle', accompagnement: 'cordes', basse: 'basse' },
    motif: { 0: [[0, 7, 1], [1, 10, 1], [2, 11, 2]], 1: [[0, 12, 1.5], [1.5, 11, 0.5], [2, 10, 2]], 4: [[0, 7, 1], [1, 10, 1], [2, 14, 2]], 5: [[0, 13, 1.5], [1.5, 12, 0.5], [2, 10, 2]] },
    rythmes: [[2, 2], [1, 1, 2], [1, 1, 1, 1]], silence: 0.25,
    basse: (m, a) => [[0, a, 2], [2, a, 2]],
    accompagnement: (m) => [[0, 0, 3.9, 0.35], [0, 1, 3.9, 0.3], [0, 2, 3.9, 0.3]],
    percussion: (m) => (m % 2 === 1 ? [[0, 'tambour', 0.8], [2.5, 'tambour', 0.5]] : [[0, 'tambour', 0.8]]),
  },
  // Les récits de voyage : bourdon et vielle, comme un barde (Witcher)
  recit: {
    base: NOTE.E / 2, gamme: GAMMES.mineur, tempo: 88, temps: 4, phrase: 8,
    accords: [0, 0, 5, 5, 6, 6, 4, 4], octaveMelodie: 2,
    instruments: { melodie: 'vielle', accompagnement: 'bourdon', basse: 'basse' },
    motif: { 0: [[0, 7, 1], [1, 8, 1], [2, 10, 2]], 1: [[0, 11, 2], [2, 10, 1], [3, 8, 1]], 4: [[0, 7, 1], [1, 8, 1], [2, 10, 1], [3, 12, 1]], 5: [[0, 11, 3], [3, 7, 1]] },
    rythmes: [[1, 1, 2], [2, 1, 1], [1, 1, 1, 1]], silence: 0.25,
    basse: (m, a) => [[0, a, 3.8]],
    accompagnement: (m) => (m % 2 === 0 ? [[0, 0, 7.8, 0.6], [0, 2, 7.8, 0.4]] : []),
    percussion: (m) => [[0, 'tambour', 0.9], [1.5, 'bois', 0.5], [2, 'tambour', 0.6], [3.5, 'bois', 0.4]],
  },
  // Les récits, selon ce qu'il s'y passe : la joie (flûte et luth, en marche), la tristesse (piano
  // et cordes, lent), la peur (bourdon, chœur grave, cœur qui bat, dissonances), l'étonnement
  // (célesta et harpe en lydien, comme une découverte)
  recitHeureux: {
    base: NOTE.G / 2, gamme: GAMMES.majeur, tempo: 108, temps: 4, phrase: 8,
    accords: [0, 3, 4, 0, 5, 3, 4, 0], octaveMelodie: 1,
    instruments: { melodie: 'fluteDouce', accompagnement: 'luth', basse: 'basse' },
    motif: { 0: [[0, 7, 1], [1, 9, 1], [2, 11, 1], [3, 12, 1]], 1: [[0, 14, 2], [2, 12, 1], [3, 11, 1]], 4: [[0, 11, 1], [1, 12, 1], [2, 14, 1], [3, 16, 1]], 5: [[0, 14, 3], [3, 11, 1]] },
    rythmes: [[1, 1, 2], [1, 1, 1, 1], [2, 1, 1]], silence: 0.15,
    basse: (m, a) => [[0, a, 1.9], [2, a + 4, 1.9]],
    accompagnement: (m) => [[0, 0, 0.9, 0.6], [1, 1, 0.9, 0.4], [2, 2, 0.9, 0.5], [3, 1, 0.9, 0.4]],
    percussion: (m) => [[0, 'tambour', 0.7], [2, 'tambour', 0.5], [1, 'tambourin', 0.3], [3, 'tambourin', 0.3]],
  },
  recitTriste: {
    base: NOTE.A / 2, gamme: GAMMES.mineur, tempo: 58, temps: 4, phrase: 8,
    accords: [0, 5, 3, 4, 0, 5, 6, 4], octaveMelodie: 2,
    instruments: { melodie: 'piano', accompagnement: 'cordes', basse: 'basse' }, reverb: 0.3, forceBasse: 1.5,
    motif: { 0: [[0, 11, 2], [2, 10, 1], [3, 9, 1]], 1: [[0, 7, 3.5]], 2: [[0, 9, 2], [2, 10, 2]], 3: [[0, 11, 4]], 4: [[0, 12, 2], [2, 11, 1], [3, 9, 1]], 5: [[0, 8, 4]], 6: [[0, 9, 1], [1, 10, 1], [2, 11, 2]], 7: [[0, 7, 4]] },
    rythmes: [[2, 2], [4], [1, 3]], silence: 0.1, lie: 1.1,
    basse: (m, a) => [[0, a, 3.8], [2, a, 1.8]],
    accompagnement: (m) => [[0, 0, 3.9, 0.45], [0, 1, 3.9, 0.3], [0, 2, 3.9, 0.3], [0, -3, 3.9, 0.35]],
  },
  recitPeur: {
    // Une tour hantée : clochettes lointaines sur une gamme étrange (demi-tons, triton), un
    // orgue grave qui tient deux notes qui frottent, un cœur qui bat de loin en loin
    base: NOTE.E / 2, gamme: GAMMES.hante, tempo: 62, temps: 4, phrase: 8,
    accords: [0, 0, 3, 3, 0, 0, 5, 3], octaveMelodie: 2,
    instruments: { melodie: 'clochette', accompagnement: 'orgue', basse: 'bourdon' }, reverb: 0.75, lie: 1.4,
    motif: { 0: [[0, 7, 1], [1, 8, 1], [2, 7, 1], [3, 12, 1]], 1: [[0, 11, 2], [2, 10, 2]], 2: [[0, 7, 1], [1, 8, 1], [2, 7, 1], [3, 5, 1]], 3: [[0, 6, 4]], 4: [[0, 12, 1], [1, 13, 1], [2, 12, 1], [3, 8, 1]], 5: [[0, 7, 2], [2, 6, 2]], 6: [[0, 9, 1], [1, 8, 1], [3, 7, 1]], 7: [[0, 7, 4]] },
    rythmes: [[1, 1, 2], [2, 2]], silence: 0.3,
    basse: (m, a) => [[0, a, 3.9]],
    accompagnement: (m) => [[0, 0, 7.8, 0.4], [0, 1, 7.8, 0.3]],
    percussion: (m) => (m % 2 === 0 ? [[0, 'coeur', 0.7], [0.5, 'coeur', 0.4]] : []),
  },
  recitEtonne: {
    base: NOTE.C / 2, gamme: GAMMES.lydien, tempo: 84, temps: 4, phrase: 8,
    accords: [0, 1, 0, 4, 0, 1, 3, 4], octaveMelodie: 1,
    instruments: { melodie: 'ocarina', accompagnement: 'harpe', basse: 'basse' }, reverb: 0.35,
    motif: { 0: [[0, 7, 1], [1, 10, 1], [2, 14, 2]], 1: [[0, 13, 1], [1, 10, 1], [2, 11, 2]], 4: [[0, 7, 1], [1, 11, 1], [2, 14, 1], [3, 17, 1]], 5: [[0, 16, 2], [2, 14, 2]] },
    rythmes: [[1, 1, 2], [2, 2], [0.5, 0.5, 1, 2]], silence: 0.15, lie: 1.15,
    basse: (m, a) => [[0, a, 3.8]],
    accompagnement: (m) => [[0, 0, 0.9, 0.4], [0.5, 1, 0.9, 0.3], [1, 2, 0.9, 0.3], [1.5, 3, 0.9, 0.3], [2, 4, 0.9, 0.3], [2.5, 3, 0.9, 0.25], [3, 2, 0.9, 0.3], [3.5, 1, 0.9, 0.25]],
  },
  // La Faucheuse : un glas, un chœur grave, le cœur qui bat (son thème sombre, le temps de sa visite)
  faucheuse: {
    base: NOTE.E / 4, gamme: GAMMES.mineur, tempo: 48, temps: 4, phrase: 4,
    accords: [0, 0, 5, 0], octaveMelodie: 1,
    instruments: { melodie: 'glas', accompagnement: 'choeur', basse: 'bourdon' }, reverb: 0.7,
    motif: { 0: [[0, 7, 4]], 1: [[0, 6, 2], [2, 7, 2]], 2: [[0, 5, 4]], 3: [[0, 6, 2], [2, 4, 2]] },
    rythmes: [[4]], silence: 0,
    basse: (m, a) => [[0, a, 3.9]],
    accompagnement: (m) => [[0, 0, 3.9, 0.5], [0, 1, 3.9, 0.3]],
    percussion: (m) => [[0, 'coeur', 1], [0.45, 'coeur', 0.6], [2, 'coeur', 1], [2.45, 'coeur', 0.6]],
  },
  // Le marché noir (v0.57) : sombre et mystérieux, rien que des graves. Un bourdon, une contrebasse
  // pincée, un violoncelle qui chante bas, de longs silences, des gouttes qui tombent dans la cave,
  // un cœur sourd et de temps en temps des pièces qui tintent
  marcheNoir: {
    base: NOTE.D / 2, gamme: GAMMES.hante, tempo: 58, temps: 4, phrase: 8,
    accords: [0, 0, 5, 4, 0, 3, 1, 4], octaveMelodie: -1, lie: 1.3,
    instruments: { melodie: 'violoncelle', accompagnement: 'pizzicato', basse: 'bourdon' }, reverb: 0.7,
    motif: { 0: [[0, 7, 1], [1, 9, 1], [2, 10, 2]], 3: [[0, 11, 1.5], [1.5, 10, 0.5], [2, 7, 2]], 4: [[1, 7, 1], [2, 6, 2]], 7: [[0, 4, 1], [1, 6, 1], [2, 7, 2]] },
    rythmes: [[2, 2], [1, 1, 2], [3, 1], [4]], silence: 0.45,
    basse: (m, a) => [[0, a, 3.95]],
    accompagnement: (m) => (m % 2 ? [[0, 0, 0.9, 0.5], [1, 1, 0.9, 0.4], [2, 2, 0.9, 0.4], [3, 1, 0.9, 0.35]] : [[0, 0, 1.5, 0.5], [2, 2, 1.5, 0.4]]),
    percussion: (m) => [[1.5 + (m % 3) * 0.7, 'goutte', 0.6], ...(m % 8 === 6 ? [[3, 'pieces', 0.2]] : []), ...(m % 4 === 0 ? [[0, 'coeur', 0.45]] : [])],
  },
  // Grippesou et les jeux : sautillant, un peu louche (luth et bois)
  jeux: {
    base: NOTE.E / 2, gamme: GAMMES.mineur, tempo: 128, temps: 4, phrase: 4,
    accords: [0, 0, 3, 4], octaveMelodie: 2,
    instruments: { melodie: 'luth', accompagnement: 'luth', basse: 'basse' },
    motif: { 0: [[0, 7, 0.5], [0.5, 7, 0.5], [1, 10, 0.5], [1.5, 9, 0.5], [2, 7, 1], [3, 11, 1]], 1: [[0, 10, 0.5], [0.5, 9, 0.5], [1, 7, 1], [2, 6, 2]] },
    rythmes: [[0.5, 0.5, 1, 1, 1], [1, 0.5, 0.5, 2]], silence: 0.2,
    basse: (m, a) => [[0, a, 0.9], [1, a, 0.9], [2, a + 4, 0.9], [3, a, 0.9]],
    accompagnement: (m) => [[0.5, 0, 0.4, 0.5], [0.5, 1, 0.4, 0.4], [1.5, 2, 0.4, 0.5], [2.5, 0, 0.4, 0.5], [3.5, 1, 0.4, 0.4]],
    percussion: (m) => [[0, 'bois', 0.8], [1, 'bois', 0.5], [2, 'bois', 0.8], [3, 'bois', 0.5]],
  },
  // La banque : un peu solennel, harpe et orgue
  // La banque : une danse klezmer (gamme freygish), clarinette qui ornemente sur l'oum-pah de
  // l'accordéon et de la basse, et des pièces qui tintent au fond (le coffre de Thorgrim)
  banque: {
    base: NOTE.D / 2, gamme: GAMMES.freygish, tempo: 132, temps: 2, phrase: 8,
    accords: [0, 0, 3, 0, 5, 3, 4, 0], octaveMelodie: 2, lie: 1.05,
    instruments: { melodie: 'clarinette', accompagnement: 'accordeon', basse: 'basse' },
    motif: { 0: [[0, 7, 0.5], [0.5, 8, 0.5], [1, 11, 1]], 1: [[0, 12, 0.5], [0.5, 11, 0.5], [1, 8, 0.5], [1.5, 7, 0.5]], 2: [[0, 10, 0.5], [0.5, 8, 0.5], [1, 7, 1]], 3: [[0, 8, 0.75], [0.75, 7, 0.25], [1, 6, 1]], 7: [[0, 7, 2]] },
    rythmes: [[0.5, 0.5, 1], [0.5, 0.5, 0.5, 0.5], [1, 0.5, 0.5], [0.25, 0.25, 0.5, 1]], silence: 0.1,
    basse: (m, a) => [[0, a, 0.45], [1, a + 4, 0.45]],
    accompagnement: (m) => [[0.5, 0, 0.35, 0.4], [0.5, 1, 0.35, 0.35], [1.5, 0, 0.35, 0.4], [1.5, 2, 0.35, 0.35]],
    percussion: (m) => (m % 2 === 0 ? [[0, 'pieces', 0.5], [1.5, 'pieces', 0.35]] : [[1, 'pieces', 0.4]]),
    reverb: 0.2,
  },
  // Les cinématiques : cordes et célesta, mystère et émerveillement (Harry Potter, le Hobbit)
  cinematique: {
    base: NOTE.D / 2, gamme: GAMMES.lydien, tempo: 72, temps: 4, phrase: 8,
    accords: [0, 0, 1, 1, 4, 4, 3, 3], octaveMelodie: 0,   // (v0.58 : deux octaves plus bas, l'ocarina dans son registre chaud)
    instruments: { melodie: 'ocarina', accompagnement: 'cordes', basse: 'basse' },
    motif: { 0: [[0, 7, 1], [1, 11, 1], [2, 14, 1], [3, 13, 1]], 1: [[0, 11, 2], [2, 9, 2]], 4: [[0, 7, 1], [1, 11, 1], [2, 14, 1], [3, 17, 1]], 5: [[0, 16, 2], [2, 14, 2]] },
    rythmes: [[2, 2], [1, 1, 2], [4]], silence: 0.3,
    basse: (m, a) => [[0, a, 3.8]],
    accompagnement: (m) => [[0, 0, 3.9, 0.35], [0, 1, 3.9, 0.3], [0, 2, 3.9, 0.3]],
  },
  // La faillite : lent, piano et cordes, en mineur
  // La faillite (v0.57) : le drame. Cuivres sombres en mineur harmonique, cordes en trémolo,
  // un orgue grave, des timbales qui roulent et frappent à chaque fin de phrase
  faillite: {
    base: NOTE.D / 2, gamme: GAMMES.harmonique, tempo: 54, temps: 4, phrase: 4,
    accords: [0, 5, 3, 4], octaveMelodie: 1, lie: 1.1,
    instruments: { melodie: 'cuivres', accompagnement: 'cordesTremolo', basse: 'orgue' }, reverb: 0.6,
    motif: { 0: [[0, 7, 1.5], [1.5, 8, 0.5], [2, 7, 2]], 1: [[0, 12, 2], [2, 11, 1], [3, 10, 1]], 2: [[0, 10, 3], [3, 9, 1]], 3: [[0, 8, 2], [2, 6, 2]] },
    rythmes: [[2, 2], [4]], silence: 0.1,
    basse: (m, a) => [[0, a, 3.9]],
    accompagnement: (m) => Array.from({ length: 16 }, (_, i) => [i * 0.25, i % 2 ? 1 : 0, 0.22, 0.3 + (i / 16) * 0.2]),
    percussion: (m) => [[0, 'timbale', m % 4 === 0 ? 1 : 0.6], ...(m % 4 === 3 ? Array.from({ length: 16 }, (_, j) => [2 + j * 0.125, 'timbale', 0.15 + j * 0.04]) : [])],
  },
  // La Faucheuse : un bourdon grave et un cœur qui bat
  danger: {
    base: NOTE.E / 4, gamme: GAMMES.mineur, tempo: 60, temps: 4, phrase: 4,
    accords: [0, 0, 0, 0], octaveMelodie: 1,
    instruments: { melodie: 'orgue', accompagnement: 'bourdon', basse: 'basse' },
    motif: { 0: [[0, 7, 4]], 1: [[0, 8, 4]], 2: [[0, 7, 4]], 3: [[0, 6, 4]] },
    rythmes: [[4]], silence: 0,
    basse: (m, a) => [[0, a, 3.8]],
    accompagnement: (m) => [[0, 0, 3.9, 0.5]],
    percussion: (m) => [[0, 'coeur', 1], [0.35, 'coeur', 0.6], [2, 'coeur', 1], [2.35, 'coeur', 0.6]],
  },
};

// Les sons. Chaque fonction reçoit le moment, le bus et les options.
// Les sons de l'interface (réglés à part des bruitages du monde)
// (v0.58) Le volume de chaque bruitage, mesuré puis corrigé : chacun est ramené au niveau de sa
// famille — l'interface discrète (-30 dB), l'ambiance et les bêtes (-27 dB), les gestes du jeu
// (-23 dB), les grands moments (-20 dB). Sans ça, une plume était 28 dB plus faible qu'un succès.
const VOLUME_SONS = { poser: 0.6, plume: 3.05, clic: 2.57, feu: 3.02, balai: 2.88, glisse: 4, des: 3.47, page: 1.24, sabots: 1.7, vent: 1.57, porte: 2.37, glou: 1.48, plouf: 1.48, aie: 1.29, coq: 1.23, passageDehors: 0.84, saut: 1.16, refus: 0.65, maillet: 1.4, pas: 1.36, fanfare: 1.7, siffle: 1.16, hibou: 0.67, echec: 1.46, grogne: 0.59, loup: 0.56, pieces: 0.73, achat: 0.73, sanglier: 0.46, caisse: 0.65, marteau: 0.65, bouclier: 0.56, clochette: 0.65, coeur: 0.64, cloche: 0.6, trefle: 0.55, succes: 0.38, nymphe: 0.7 };
const SONS_INTERFACE = new Set(['lettre', 'clic', 'page', 'plume', 'passage', 'passageDehors', 'refus']);

const SONS = {
  // Une pièce qui tinte : deux partiels aigus, très courts
  piece(t, bus, o) { const f = 2200 + Math.random() * 600; for (const [mult, v] of [[1, 0.25], [1.5, 0.12], [2.7, 0.06]]) { const osc = this.ctx.createOscillator(); osc.frequency.value = f * mult; const g = this.ctx.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.18); osc.connect(g); g.connect(bus); osc.start(t); osc.stop(t + 0.2); } this.bruit(0.02, t, bus, 0.15, 5000, 'highpass'); },
  // Plusieurs pièces qui tombent
  pieces(t, bus, o) { const n = Math.min(6, Math.max(2, Math.round((o.montant || 10) / 8))); for (let i = 0; i < n; i++) SONS.piece.call(this, t + i * 0.055 + Math.random() * 0.02, bus, o); },
  // La clochette de la porte
  clochette(t, bus) { for (const [mult, v, d] of [[1, 0.3, 0.9], [2.4, 0.12, 0.6], [4.1, 0.05, 0.4]]) { const osc = this.ctx.createOscillator(); osc.frequency.value = 1760 * mult; const g = this.ctx.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0005, t + d); osc.connect(g); g.connect(bus); osc.start(t); osc.stop(t + d + 0.1); } SONS.clochette2.call(this, t + 0.13, bus); },
  clochette2(t, bus) { for (const [mult, v, d] of [[1.19, 0.22, 0.8], [2.6, 0.08, 0.5]]) { const osc = this.ctx.createOscillator(); osc.frequency.value = 1760 * mult; const g = this.ctx.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0005, t + d); osc.connect(g); g.connect(bus); osc.start(t); osc.stop(t + d + 0.1); } },
  // La porte qui s'ouvre puis se referme (un grincement, puis un claquement de bois)
  porte(t, bus) { const osc = this.ctx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.setValueAtTime(180, t); osc.frequency.linearRampToValueAtTime(260, t + 0.3); const f = this.ctx.createBiquadFilter(); f.frequency.value = 900; const g = this.ctx.createGain(); g.gain.setValueAtTime(0.0005, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.08); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.35); osc.connect(f); f.connect(g); g.connect(bus); osc.start(t); osc.stop(t + 0.4); this.bruit(0.06, t + 0.42, bus, 0.8, 500); this.bruit(0.03, t + 0.46, bus, 0.4, 1200); },
  // (v0.68) Le texte qui défile, façon Pokémon : un petit « bip » doux, à peine audible, un peu
  // différent à chaque lettre
  lettre(t, bus) { const osc = this.ctx.createOscillator(); osc.type = 'square'; osc.frequency.value = 880 + Math.random() * 120; const g = this.ctx.createGain(); g.gain.setValueAtTime(0.025, t); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.035); osc.connect(g); g.connect(bus); osc.start(t); osc.stop(t + 0.04); },
  // Un clic de bouton : un petit « toc » de bois
  clic(t, bus) { this.bruit(0.025, t, bus, 0.22, 1800); const osc = this.ctx.createOscillator(); osc.frequency.value = 700; const g = this.ctx.createGain(); g.gain.setValueAtTime(0.08, t); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.05); osc.connect(g); g.connect(bus); osc.start(t); osc.stop(t + 0.06); },
  // Une page qu'on tourne, un parchemin
  page(t, bus) { this.bruit(0.18, t, bus, 0.12, 3500, 'highpass'); this.bruit(0.08, t + 0.12, bus, 0.08, 2000); },
  // Les dés qui roulent sur la table
  des(t, bus) { for (let i = 0; i < 6; i++) this.bruit(0.03, t + i * 0.07 + Math.random() * 0.03, bus, 0.6 - i * 0.07, 2200 + Math.random() * 800); },
  // La plume qui gratte
  plume(t, bus) { for (let i = 0; i < 4; i++) this.bruit(0.1, t + i * 0.12, bus, 0.06, 4500, 'highpass'); },
  // Un marteau sur l'enclume (l'atelier)
  marteau(t, bus) { for (const [mult, v] of [[1, 0.25], [2.3, 0.1], [3.7, 0.05]]) { const osc = this.ctx.createOscillator(); osc.frequency.value = 820 * mult; const g = this.ctx.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.5); osc.connect(g); g.connect(bus); osc.start(t); osc.stop(t + 0.6); } this.bruit(0.02, t, bus, 0.3, 3000); },
  // Un petit arpège de réussite
  // (v0.58) Un objet posé dans le baluchon : un petit choc mat sur le tissu, et le froissement
  poser(t, bus) {
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(170, t); o.frequency.exponentialRampToValueAtTime(75, t + 0.1);
    g.gain.setValueAtTime(0.0005, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.16);
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + 0.2);
    this.bruit(0.09, t, bus, 0.16, 1400, 'lowpass');
    this.bruit(0.12, t + 0.05, bus, 0.06, 3200);
  },
  // (v0.67) L'éveil de la nymphe : une harpe qui monte, et des clochettes d'eau par-dessus
  nymphe(t, bus) {
    [0, 4, 7, 11, 14, 18, 21, 26].forEach((d, i) => this.note('harpe', 293.66 * Math.pow(2, d / 12), t + i * 0.13, 1.4, 0.7, bus));
    [31, 28, 33].forEach((d, i) => this.note('celesta', 293.66 * Math.pow(2, d / 12), t + 1.1 + i * 0.22, 1.2, 0.5, bus));
  },
  succes(t, bus) { [0, 4, 7, 12].forEach((d, i) => this.note('ocarina', 523.25 * Math.pow(2, d / 12), t + i * 0.09, 0.3, 0.8, bus)); },
  // Un accord qui tombe (échec)
  echec(t, bus) { [7, 3, 0].forEach((d, i) => this.note('piano', 261.63 * Math.pow(2, d / 12), t + i * 0.16, 0.6, 0.7, bus)); },
  // Des pas sur le plancher
  pas(t, bus) { for (let i = 0; i < 4; i++) { this.bruit(0.05, t + i * 0.26, bus, 0.5, 320 + (i % 2) * 120); const o = this.ctx.createOscillator(); o.frequency.setValueAtTime(120, t + i * 0.26); o.frequency.exponentialRampToValueAtTime(60, t + i * 0.26 + 0.08); const g = this.ctx.createGain(); g.gain.setValueAtTime(0.25, t + i * 0.26); g.gain.exponentialRampToValueAtTime(0.0005, t + i * 0.26 + 0.12); o.connect(g); g.connect(bus); o.start(t + i * 0.26); o.stop(t + i * 0.26 + 0.15); } },
  // (v1.07) Les oiseaux de l'aube : des gazouillis vifs et aigus, en petites rafales
  oiseaux(t, bus) {
    for (let r = 0; r < 3; r++) {
      const t1 = t + r * 0.45 + Math.random() * 0.1, n = 3 + Math.floor(Math.random() * 3), base = 2800 + Math.random() * 1400;
      for (let k = 0; k < n; k++) {
        const tk = t1 + k * (0.07 + Math.random() * 0.04), f0 = base * (0.85 + Math.random() * 0.4), osc = this.ctx.createOscillator(), g = this.ctx.createGain();
        osc.frequency.setValueAtTime(f0, tk); osc.frequency.exponentialRampToValueAtTime(f0 * (Math.random() < 0.5 ? 1.35 : 0.75), tk + 0.06);
        g.gain.setValueAtTime(0.0005, tk); g.gain.exponentialRampToValueAtTime(0.09, tk + 0.01); g.gain.exponentialRampToValueAtTime(0.0005, tk + 0.08);
        osc.connect(g); g.connect(bus); osc.start(tk); osc.stop(tk + 0.09);
      }
    }
  },
  // Le hibou de la nuit
  hibou(t, bus) { for (const dt of [0, 0.32]) { const osc = this.ctx.createOscillator(); osc.frequency.setValueAtTime(420, t + dt); osc.frequency.exponentialRampToValueAtTime(360, t + dt + 0.25); const g = this.ctx.createGain(); g.gain.setValueAtTime(0.0005, t + dt); g.gain.exponentialRampToValueAtTime(0.22, t + dt + 0.05); g.gain.exponentialRampToValueAtTime(0.0005, t + dt + 0.28); osc.connect(g); g.connect(bus); osc.start(t + dt); osc.stop(t + dt + 0.3); } },
  // La cloche du crieur
  cloche(t, bus) { for (const [mult, v, d] of [[1, 0.3, 1.4], [2.0, 0.12, 0.9], [3.01, 0.06, 0.6], [4.2, 0.03, 0.4]]) { const osc = this.ctx.createOscillator(); osc.frequency.value = 660 * mult; const g = this.ctx.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0005, t + d); osc.connect(g); g.connect(bus); osc.start(t); osc.stop(t + d + 0.1); } },
  // Un tampon qui s'abat (la Faucheuse, le registre)
  tampon(t, bus) { this.bruit(0.05, t, bus, 0.35, 400); const osc = this.ctx.createOscillator(); osc.frequency.setValueAtTime(140, t); osc.frequency.exponentialRampToValueAtTime(60, t + 0.1); const g = this.ctx.createGain(); g.gain.setValueAtTime(0.3, t); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.2); osc.connect(g); g.connect(bus); osc.start(t); osc.stop(t + 0.25); },
  // Un tiroir ou un panneau qui glisse
  glisse(t, bus) { this.bruit(0.2, t, bus, 0.35, 900); this.bruit(0.04, t + 0.2, bus, 0.3, 500); },
  // Le froid de la Faucheuse : un souffle grave
  froid(t, bus) { this.bruit(1.2, t, bus, 0.12, 250); const osc = this.ctx.createOscillator(); osc.frequency.value = 55; const g = this.ctx.createGain(); g.gain.setValueAtTime(0.0005, t); g.gain.exponentialRampToValueAtTime(0.2, t + 0.4); g.gain.exponentialRampToValueAtTime(0.0005, t + 1.4); osc.connect(g); g.connect(bus); osc.start(t); osc.stop(t + 1.5); },
  // Le feu qui crépite (une bûche)
  feu(t, bus) { for (let i = 0; i < 6; i++) this.bruit(0.025, t + Math.random() * 0.5, bus, 0.3, 2500 + Math.random() * 2000); },

  // --- Les passages d'un lieu à l'autre (façon Pokémon : deux notes vives, un petit souffle) ---
  passage(t, bus) { for (const [dt, f] of [[0, 660], [0.07, 990]]) { const osc = this.ctx.createOscillator(); osc.type = 'square'; osc.frequency.value = f; const g = this.ctx.createGain(); g.gain.setValueAtTime(0.09, t + dt); g.gain.exponentialRampToValueAtTime(0.0005, t + dt + 0.09); osc.connect(g); g.connect(bus); osc.start(t + dt); osc.stop(t + dt + 0.1); } this.bruit(0.12, t + 0.04, bus, 0.14, 2200); },
  // Dehors : les deux notes descendent, et l'air du dehors (un souffle plus clair, un oiseau)
  passageDehors(t, bus) { for (const [dt, f] of [[0, 990], [0.07, 740]]) { const osc = this.ctx.createOscillator(); osc.type = 'square'; osc.frequency.value = f; const g = this.ctx.createGain(); g.gain.setValueAtTime(0.09, t + dt); g.gain.exponentialRampToValueAtTime(0.0005, t + dt + 0.09); osc.connect(g); g.connect(bus); osc.start(t + dt); osc.stop(t + dt + 0.1); } this.bruit(0.25, t + 0.04, bus, 0.1, 3500, 'highpass'); const o = this.ctx.createOscillator(); o.frequency.setValueAtTime(2400, t + 0.3); o.frequency.exponentialRampToValueAtTime(3200, t + 0.38); o.frequency.exponentialRampToValueAtTime(2600, t + 0.46); const g = this.ctx.createGain(); g.gain.setValueAtTime(0.0005, t + 0.3); g.gain.exponentialRampToValueAtTime(0.05, t + 0.33); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.48); o.connect(g); g.connect(bus); o.start(t + 0.3); o.stop(t + 0.5); },

  // --- Le commerce ---
  // Un achat : deux pièces sur le comptoir, puis un petit « ding » de satisfaction
  achat(t, bus, o) { SONS.piece.call(this, t, bus, o); SONS.piece.call(this, t + 0.07, bus, o); SONS.ting.call(this, t + 0.16, bus, 1.3); },
  ting(t, bus, o = {}) { const hauteur = typeof o === 'number' ? o : (o.hauteur || 1); for (const [mult, v, d] of [[1, 0.18, 0.5], [2.5, 0.05, 0.3]]) { const osc = this.ctx.createOscillator(); osc.frequency.value = 2093 * hauteur * mult; const g = this.ctx.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0005, t + d); osc.connect(g); g.connect(bus); osc.start(t); osc.stop(t + d + 0.05); } },
  // La caisse : une vente conclue au comptoir (clochette claire et poignée de pièces)
  caisse(t, bus, o) { SONS.ting.call(this, t, bus, 1); SONS.ting.call(this, t + 0.09, bus, 1.5); SONS.pieces.call(this, t + 0.12, bus, { montant: 30 }); },
  // Un refus, une erreur : un petit « bonk » sourd qui descend
  refus(t, bus) { const osc = this.ctx.createOscillator(); osc.type = 'triangle'; osc.frequency.setValueAtTime(220, t); osc.frequency.exponentialRampToValueAtTime(140, t + 0.18); const g = this.ctx.createGain(); g.gain.setValueAtTime(0.22, t); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.22); osc.connect(g); g.connect(bus); osc.start(t); osc.stop(t + 0.25); this.bruit(0.03, t, bus, 0.2, 600); },
  // Le maillet du commissaire-priseur : deux coups de bois secs
  maillet(t, bus) { for (const dt of [0, 0.22]) { this.bruit(0.03, t + dt, bus, 0.5, 1400); const osc = this.ctx.createOscillator(); osc.frequency.setValueAtTime(420, t + dt); osc.frequency.exponentialRampToValueAtTime(180, t + dt + 0.08); const g = this.ctx.createGain(); g.gain.setValueAtTime(0.25, t + dt); g.gain.exponentialRampToValueAtTime(0.0005, t + dt + 0.12); osc.connect(g); g.connect(bus); osc.start(t + dt); osc.stop(t + dt + 0.15); } },
  // Le coup de chiffon, le balai : trois « swish » de plus en plus vifs
  balai(t, bus) { for (let i = 0; i < 3; i++) this.bruit(0.16, t + i * 0.2, bus, 0.18 + i * 0.04, 1200 + i * 400, 'bandpass'); },
  // Une fanfare : un nouveau palier de réputation (quatre notes de trompette, la dernière tenue)
  fanfare(t, bus) { const trompette = [392, 523.25, 659.25, 783.99]; trompette.forEach((f, i) => this.note('vielle', f, t + i * 0.16, i === 3 ? 0.9 : 0.14, 1.6, bus)); this.note('vielle', 523.25, t + 0.48, 0.9, 0.9, bus); },
  // Le glas : un aventurier qui ne reviendra pas
  glas(t, bus) { this.note('glas', 110, t, 2, 1, bus); this.note('glas', 110, t + 1.4, 2, 0.8, bus); },

  // --- L'aventure (les onomatopées du carnet) ---
  // TCHAK : un coup d'épée, un choc métallique clair
  coup(t, bus) { this.bruit(0.03, t, bus, 0.5, 4000, 'highpass'); for (const [f, v] of [[1900, 0.18], [3100, 0.08]]) { const osc = this.ctx.createOscillator(); osc.frequency.setValueAtTime(f, t); osc.frequency.exponentialRampToValueAtTime(f * 0.7, t + 0.25); const g = this.ctx.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.3); osc.connect(g); g.connect(bus); osc.start(t); osc.stop(t + 0.35); } },
  // BLONG : le bouclier qui encaisse, un métal plus grave qui résonne
  bouclier(t, bus) { this.bruit(0.04, t, bus, 0.4, 900); for (const [mult, v, d] of [[1, 0.28, 0.7], [1.5, 0.1, 0.5], [2.9, 0.06, 0.3]]) { const osc = this.ctx.createOscillator(); osc.frequency.value = 330 * mult; const g = this.ctx.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0005, t + d); osc.connect(g); g.connect(bus); osc.start(t); osc.stop(t + d + 0.05); } },
  // FIOUU : une flèche, un sifflement qui file
  siffle(t, bus) { const osc = this.ctx.createOscillator(); osc.type = 'sine'; osc.frequency.setValueAtTime(2200, t); osc.frequency.exponentialRampToValueAtTime(500, t + 0.35); const g = this.ctx.createGain(); g.gain.setValueAtTime(0.0005, t); g.gain.exponentialRampToValueAtTime(0.16, t + 0.04); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.38); osc.connect(g); g.connect(bus); osc.start(t); osc.stop(t + 0.4); this.bruit(0.3, t, bus, 0.1, 5000, 'highpass'); },
  // HOP : un bond, une petite note qui monte
  saut(t, bus) { const osc = this.ctx.createOscillator(); osc.type = 'triangle'; osc.frequency.setValueAtTime(300, t); osc.frequency.exponentialRampToValueAtTime(720, t + 0.14); const g = this.ctx.createGain(); g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.2); osc.connect(g); g.connect(bus); osc.start(t); osc.stop(t + 0.22); },
  // AÏE : une plainte courte qui tombe
  aie(t, bus) { const osc = this.ctx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.setValueAtTime(520, t); osc.frequency.exponentialRampToValueAtTime(240, t + 0.25); const f = this.ctx.createBiquadFilter(); f.frequency.value = 1200; const g = this.ctx.createGain(); g.gain.setValueAtTime(0.0005, t); g.gain.exponentialRampToValueAtTime(0.16, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.28); osc.connect(f); f.connect(g); g.connect(bus); osc.start(t); osc.stop(t + 0.3); },
  // MIAM : deux bouchées gourmandes
  miam(t, bus) { for (const dt of [0, 0.2]) { const osc = this.ctx.createOscillator(); osc.type = 'triangle'; osc.frequency.setValueAtTime(180, t + dt); osc.frequency.exponentialRampToValueAtTime(120, t + dt + 0.12); const g = this.ctx.createGain(); g.gain.setValueAtTime(0.22, t + dt); g.gain.exponentialRampToValueAtTime(0.0005, t + dt + 0.15); osc.connect(g); g.connect(bus); osc.start(t + dt); osc.stop(t + dt + 0.18); this.bruit(0.04, t + dt, bus, 0.2, 800); } },
  // GLOU GLOU : des bulles qui montent (une potion qu'on boit)
  glou(t, bus) { for (let i = 0; i < 4; i++) { const dt = i * 0.13; const osc = this.ctx.createOscillator(); osc.frequency.setValueAtTime(300 + i * 60, t + dt); osc.frequency.exponentialRampToValueAtTime(900 + i * 120, t + dt + 0.09); const g = this.ctx.createGain(); g.gain.setValueAtTime(0.16, t + dt); g.gain.exponentialRampToValueAtTime(0.0005, t + dt + 0.1); osc.connect(g); g.connect(bus); osc.start(t + dt); osc.stop(t + dt + 0.12); } },
  // PLOUF : une chute dans l'eau, puis des bulles
  plouf(t, bus) { this.bruit(0.08, t, bus, 0.7, 400, 'lowpass'); this.bruit(0.4, t + 0.05, bus, 0.3, 1800); SONS.glou.call(this, t + 0.3, bus); },
  // OUSTE : un grognement de bête qui fuit
  grogne(t, bus) { const osc = this.ctx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.setValueAtTime(70, t); osc.frequency.linearRampToValueAtTime(48, t + 0.4); const f = this.ctx.createBiquadFilter(); f.frequency.value = 300; const g = this.ctx.createGain(); g.gain.setValueAtTime(0.0005, t); g.gain.exponentialRampToValueAtTime(0.3, t + 0.06); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.45); osc.connect(f); f.connect(g); g.connect(bus); osc.start(t); osc.stop(t + 0.5); this.bruit(0.4, t, bus, 0.12, 300); },
  // Le trèfle qui brille : un petit scintillement qui monte
  trefle(t, bus) { [0, 4, 7, 12, 16].forEach((d, i) => this.note('ocarina', 523.25 * Math.pow(2, d / 12), t + i * 0.06, 0.25, 0.5, bus)); },
  // Un cœur qui revient (les soins) : deux notes chaudes
  coeur(t, bus) { this.note('fluteDouce', 523.25, t, 0.25, 1, bus); this.note('fluteDouce', 783.99, t + 0.22, 0.5, 1, bus); },

  // --- Les bêtes ---
  // Le sanglier : des grognements graves et courts, le groin dans la terre
  sanglier(t, bus) { for (const [dt, d] of [[0, 0.16], [0.22, 0.12], [0.4, 0.26]]) { const osc = this.ctx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.setValueAtTime(62, t + dt); osc.frequency.linearRampToValueAtTime(44, t + dt + d); const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 260; f.Q.value = 2; const g = this.ctx.createGain(); g.gain.setValueAtTime(0.0005, t + dt); g.gain.exponentialRampToValueAtTime(0.5, t + dt + 0.03); g.gain.exponentialRampToValueAtTime(0.0005, t + dt + d); osc.connect(f); f.connect(g); g.connect(bus); osc.start(t + dt); osc.stop(t + dt + d + 0.02); this.bruit(d, t + dt, bus, 0.18, 180, 'lowpass'); } },
  // Le loup : un hurlement qui monte, se tient, puis retombe
  loup(t, bus) { const osc = this.ctx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.setValueAtTime(260, t); osc.frequency.exponentialRampToValueAtTime(520, t + 0.5); osc.frequency.setValueAtTime(520, t + 0.9); osc.frequency.exponentialRampToValueAtTime(330, t + 1.5); const f = this.ctx.createBiquadFilter(); f.frequency.value = 1100; f.Q.value = 1.5; const g = this.ctx.createGain(); g.gain.setValueAtTime(0.0005, t); g.gain.exponentialRampToValueAtTime(0.16, t + 0.3); g.gain.setValueAtTime(0.16, t + 0.9); g.gain.exponentialRampToValueAtTime(0.0005, t + 1.6); osc.connect(f); f.connect(g); g.connect(bus); osc.start(t); osc.stop(t + 1.65); },
  // Brisquet le chien : deux aboiements
  chien(t, bus) { for (const dt of [0, 0.26]) { const osc = this.ctx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.setValueAtTime(240, t + dt); osc.frequency.exponentialRampToValueAtTime(150, t + dt + 0.1); const f = this.ctx.createBiquadFilter(); f.frequency.value = 900; f.Q.value = 2; const g = this.ctx.createGain(); g.gain.setValueAtTime(0.0005, t + dt); g.gain.exponentialRampToValueAtTime(0.3, t + dt + 0.02); g.gain.exponentialRampToValueAtTime(0.0005, t + dt + 0.13); osc.connect(f); f.connect(g); g.connect(bus); osc.start(t + dt); osc.stop(t + dt + 0.15); this.bruit(0.05, t + dt, bus, 0.25, 700); } },
  // Le chat de la maison : un miaulement
  miaou(t, bus) { const osc = this.ctx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.setValueAtTime(620, t); osc.frequency.linearRampToValueAtTime(820, t + 0.15); osc.frequency.exponentialRampToValueAtTime(480, t + 0.5); const f = this.ctx.createBiquadFilter(); f.frequency.value = 1500; f.Q.value = 3; const g = this.ctx.createGain(); g.gain.setValueAtTime(0.0005, t); g.gain.exponentialRampToValueAtTime(0.14, t + 0.08); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.55); osc.connect(f); f.connect(g); g.connect(bus); osc.start(t); osc.stop(t + 0.6); },
  // Le coq du matin, au marché
  coq(t, bus) { const notes = [[520, 0.18], [680, 0.18], [860, 0.32], [640, 0.5]]; let dt = 0; for (const [f0, d] of notes) { const osc = this.ctx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.setValueAtTime(f0, t + dt); osc.frequency.linearRampToValueAtTime(f0 * 0.92, t + dt + d); const f = this.ctx.createBiquadFilter(); f.frequency.value = 1800; f.Q.value = 2.5; const g = this.ctx.createGain(); g.gain.setValueAtTime(0.0005, t + dt); g.gain.exponentialRampToValueAtTime(0.12, t + dt + 0.03); g.gain.exponentialRampToValueAtTime(0.0005, t + dt + d); osc.connect(f); f.connect(g); g.connect(bus); osc.start(t + dt); osc.stop(t + dt + d + 0.02); dt += d; } },
  // Le vol de la caméra à travers la forêt : un souffle qui passe tout près (un arbre qu'on frôle)
  vol(t, bus, o) {
    const ctx = this.ctx, duree = 0.45, n = Math.floor(ctx.sampleRate * duree), buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.4;
    f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(2600, t + 0.16); f.frequency.exponentialRampToValueAtTime(300, t + duree);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0005, t); g.gain.exponentialRampToValueAtTime(0.45 * ((o && o.force) || 1), t + 0.14); g.gain.exponentialRampToValueAtTime(0.0005, t + duree);
    src.connect(f); f.connect(g); g.connect(bus); src.start(t); src.stop(t + duree + 0.05);
    // (quelques feuilles qui claquent au passage)
    for (let i = 0; i < 3; i++) this.bruit(0.02, t + 0.1 + i * 0.05, bus, 0.2, 5000, 'highpass');
  },
  // Le vent du vol : un long souffle grave qui enfle puis s'apaise
  vent(t, bus, o) {
    const ctx = this.ctx, duree = (o && o.duree) || 4, n = Math.floor(ctx.sampleRate * duree), buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 0.8;
    f.frequency.setValueAtTime(300, t); f.frequency.linearRampToValueAtTime(900, t + duree * 0.6); f.frequency.linearRampToValueAtTime(250, t + duree);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0005, t); g.gain.exponentialRampToValueAtTime(0.22, t + duree * 0.5); g.gain.exponentialRampToValueAtTime(0.0005, t + duree);
    src.connect(f); f.connect(g); g.connect(bus); src.start(t); src.stop(t + duree + 0.05);
  },
  // (v0.98) La foule de la fosse qui rugit : un grand souffle de voix qui enfle et retombe
  foule(t, bus, o) {
    const duree = (o && o.duree) || 1.6, fort = (o && o.fort) || 1;
    for (const [freq, v] of [[420, 0.22], [900, 0.16], [1700, 0.08]]) this.bruit(duree, t, bus, v * fort, freq);
    for (let i = 0; i < 5; i++) { const osc = this.ctx.createOscillator(); osc.type = 'sawtooth'; const f0 = 140 + Math.random() * 160; osc.frequency.setValueAtTime(f0, t + i * 0.05); osc.frequency.linearRampToValueAtTime(f0 * 1.25, t + duree * 0.4); const fl = this.ctx.createBiquadFilter(); fl.frequency.value = 700; const g = this.ctx.createGain(); g.gain.setValueAtTime(0.0005, t); g.gain.exponentialRampToValueAtTime(0.03 * fort, t + duree * 0.3); g.gain.exponentialRampToValueAtTime(0.0005, t + duree); osc.connect(fl); fl.connect(g); g.connect(bus); osc.start(t); osc.stop(t + duree + 0.05); }
  },
  // (v0.98) BAM : un coup de poing qui porte, sourd et lourd
  impact(t, bus) { this.bruit(0.08, t, bus, 0.6, 500, 'lowpass'); const osc = this.ctx.createOscillator(); osc.type = 'sine'; osc.frequency.setValueAtTime(140, t); osc.frequency.exponentialRampToValueAtTime(45, t + 0.18); const g = this.ctx.createGain(); g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.22); osc.connect(g); g.connect(bus); osc.start(t); osc.stop(t + 0.25); this.bruit(0.02, t, bus, 0.3, 3000, 'highpass'); },
  // L'âne de Barnabé, les sabots sur les pavés
  sabots(t, bus) { for (let i = 0; i < 6; i++) { const dt = i * 0.17 + (i % 2) * 0.04; this.bruit(0.03, t + dt, bus, 0.45, 1600 + (i % 2) * 500); const osc = this.ctx.createOscillator(); osc.frequency.setValueAtTime(260, t + dt); osc.frequency.exponentialRampToValueAtTime(120, t + dt + 0.05); const g = this.ctx.createGain(); g.gain.setValueAtTime(0.14, t + dt); g.gain.exponentialRampToValueAtTime(0.0005, t + dt + 0.07); osc.connect(g); g.connect(bus); osc.start(t + dt); osc.stop(t + dt + 0.08); } },
};

// Les voix « 2 bits » : chaque peuple a son timbre et sa hauteur, chaque personnage sa petite
// mélodie (tirée de son nom), et on baragouine le temps de la phrase (façon Animal Crossing)
const VOIX = {
  humain: { forme: 'triangle', base: 200, ecart: 60, note: 0.085 },
  hobbit: { forme: 'triangle', base: 300, ecart: 70, note: 0.07 },
  nain: { forme: 'square', base: 105, ecart: 30, note: 0.11 },
  elfe: { forme: 'sine', base: 330, ecart: 90, note: 0.1 },
  magicienne: { forme: 'sine', base: 280, ecart: 80, note: 0.09 },
  gobelin: { forme: 'sawtooth', base: 380, ecart: 120, note: 0.06 },
  orc: { forme: 'square', base: 95, ecart: 30, note: 0.12 },
  loupgarou: { forme: 'sawtooth', base: 130, ecart: 45, note: 0.1 },
  vampire: { forme: 'sine', base: 170, ecart: 40, note: 0.13 },
  momie: { forme: 'triangle', base: 125, ecart: 25, note: 0.16 },
  troll: { forme: 'square', base: 70, ecart: 20, note: 0.17 },
  panda: { forme: 'triangle', base: 150, ecart: 40, note: 0.11 },
  faucheuse: { forme: 'sawtooth', base: 70, ecart: 15, note: 0.16 },
};
// Les intonations : la même voix, mais la phrase monte, descend, s'emballe ou traîne selon
// l'humeur. `pente` : de combien la hauteur glisse sur la phrase (en proportion) ; `vitesse` :
// le débit ; `duree` : la longueur de la phrase ; `forme` : un timbre forcé (le grognement)
const TONS = {
  neutre: { duree: 1, vitesse: 1, pente: 0, force: 1 },
  bonjour: { duree: 0.55, vitesse: 1, pente: 0.35, force: 1.1, courbe: [0, 0.3, 1] },           // « Bonjour ! » : ça monte
  auRevoir: { duree: 0.6, vitesse: 0.9, pente: -0.3, force: 1, courbe: [0.6, 1, 0.2] },         // « Au revoir… » : ça retombe
  merci: { duree: 0.4, vitesse: 1.2, pente: 0.25, force: 1, courbe: [0.2, 1, 0.7] },
  content: { duree: 0.7, vitesse: 1.3, pente: 0.2, force: 1.1, courbe: [0.2, 1, 0.5, 1] },       // guilleret, ça sautille
  fache: { duree: 0.8, vitesse: 1.7, pente: -0.15, force: 1.5, hauteur: 0.8, forme: 'sawtooth', courbe: [1, 1, 0.9, 1] },   // vite, bas, râpeux
  decu: { duree: 0.9, vitesse: 0.65, pente: -0.35, force: 0.8, courbe: [0.8, 0.5, 0] },         // lent, qui s'affaisse
  triste: { duree: 1.1, vitesse: 0.55, pente: -0.25, force: 0.7, hauteur: 0.9, courbe: [0.5, 0.3, 0] },
  etonne: { duree: 0.45, vitesse: 1.1, pente: 0.6, force: 1.2, courbe: [0, 0.2, 1] },           // un bond vers l'aigu
  inquiet: { duree: 0.7, vitesse: 1.2, pente: 0.15, force: 0.9, courbe: [0.3, 0.6, 0.4, 0.8] },  // ça tremblote
  peur: { duree: 0.5, vitesse: 1.6, pente: 0.5, force: 1.2, hauteur: 1.2, courbe: [0.2, 1, 1] },
  rire: { duree: 0.8, vitesse: 1.6, pente: -0.1, force: 1.1, courbe: [1, 0.6, 1, 0.6, 1, 0.6] },
  grogne: { duree: 0.6, vitesse: 0.8, pente: -0.2, force: 1.2, hauteur: 0.7, forme: 'sawtooth', courbe: [1, 0.8, 0.6] },
};
SONS.voix = function (t, bus, o) {
  const p = o.personne || {};
  const V = VOIX[o.race || p.race] || VOIX.humain;
  const T = TONS[o.ton] || TONS.neutre;
  const base = V.base * (p.feminin ? 1.35 : 1) * (o.hauteur || 1) * (T.hauteur || 1);
  let graine = 0; for (const c of (p.nom || o.nom || 'x')) graine = (graine * 31 + c.charCodeAt(0)) & 0xffff;
  const alea = () => { graine = (graine * 1103515245 + 12345) & 0x7fffffff; return graine / 0x7fffffff; };
  // Les aînés : une voix fatiguée, plus basse, lente, étouffée, qui chevrote, avec des souffles
  const vieux = !!(p.vieux || o.vieux);
  const duree = Math.min(vieux ? 2.6 : 2.2, o.duree || T.duree);
  const forme = T.forme || V.forme;
  const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = (forme === 'sine' ? 3000 : forme === 'sawtooth' ? 1200 : 1600) * (vieux ? 0.4 : 1); f.connect(bus);
  const courbe = T.courbe || [0.5, 0.5];
  const note = V.note / T.vitesse * (vieux ? 1.45 : 1);
  const souffle = vieux ? 0.3 : 0;
  for (let tt = 0; tt < duree; tt += note * (1 + alea() * 0.6)) {
    if (alea() < (o.ton && o.ton !== 'neutre' ? 0.08 : 0.18) + souffle) {   // (une respiration ; chez les aînés, un souffle qu'on entend)
      if (vieux) this.percu('souffle', t + tt, 0.5, f);
      continue;
    }
    const u = tt / duree;                                                  // où l'on en est dans la phrase
    const pos = u * (courbe.length - 1), i = Math.min(courbe.length - 2, Math.floor(pos)), c = courbe[i] + (courbe[i + 1] - courbe[i]) * (pos - i);
    const freq = base * (1 + T.pente * u + (c - 0.5) * 0.3) + (alea() - 0.5) * 2 * V.ecart * 0.6;
    const fr = vieux ? freq * 0.85 : freq;
    const osc = this.ctx.createOscillator(); osc.type = forme; osc.frequency.setValueAtTime(fr, t + tt); osc.frequency.exponentialRampToValueAtTime(fr * (vieux ? 0.88 : 0.9 + alea() * 0.2), t + tt + note);
    const g = this.ctx.createGain(); g.gain.setValueAtTime(0.0005, t + tt); g.gain.exponentialRampToValueAtTime(0.1 * (o.force || 1) * T.force * (vieux ? 0.8 : 1), t + tt + (vieux ? 0.04 : 0.01)); g.gain.exponentialRampToValueAtTime(0.0005, t + tt + note);
    osc.connect(g); g.connect(f); osc.start(t + tt); osc.stop(t + tt + note + 0.02);
    if (vieux) {   // le chevrotement : la hauteur tremble vite
      const lfo = this.ctx.createOscillator(), amp = this.ctx.createGain();
      lfo.frequency.value = 6.5 + alea() * 2; amp.gain.value = 45; lfo.connect(amp); amp.connect(osc.detune);
      lfo.start(t + tt); lfo.stop(t + tt + note + 0.02);
    }
  }
};

// Les onomatopées du carnet de voyage : le son qui va avec chaque mot
const SON_DES_MOTS = [['TCHAK', 'coup'], ['BLONG', 'bouclier'], ['FIOUU', 'siffle'], ['HOP', 'saut'], ['Miam', 'miam'], ['Glou', 'glou'], ['AÏE', 'aie'], ['OUILLE', 'aie'], ['CRAC', 'aie'], ['Atchoum', 'aie'], ['PLOUF', 'plouf'], ['Frrrt', 'page'], ['Frotte', 'balai'], ['Pfff', 'balai'], ['Tchac', 'balai'], ['Hop', 'saut']];
function sonDuMot(mot) { const trouve = SON_DES_MOTS.find(([m]) => mot.startsWith(m)); return trouve ? trouve[1] : null; }

// La création du personnage : le thème du titre, en plus doux (boîte à musique et harpe, sans
// les cordes), pour rester dans la même ambiance avant que l'histoire commence
THEMES.personnage = Object.assign({}, THEMES.titre, {
  tempo: 118, reverb: 0.4, lie: 1.2,
  instruments: { melodie: 'boiteAMusique', accompagnement: 'harpe', basse: 'basse' },
  basse: (m, a) => [[0, a, 2.8, 0.6]],
  accompagnement: (m) => [[0, 0, 1, 0.5], [1, 1, 1, 0.4], [2, 2, 1, 0.4]],
});

// Le thème de chaque scène du jeu
const THEME_PAR_SCENE = {
  Titre: 'titre', Peche: 'recitHeureux', Intro: 'personnage', IntroHistoire: 'cinematique', Comptoir: 'comptoir', Nuit: 'nuit', Dodo: 'nuit', Recit: 'recitEtonne', Faillite: 'faillite',
  MarcheNoir: 'marcheNoir', Express: 'jeux', Banque: 'banque', Marche: 'marche', Atelier: 'comptoir', Bureau: 'comptoir', Carte: 'carte', Facade: 'marche', Arriere: 'comptoir', Renovation: 'cinematique', Promenade: 'nuit', Rue: 'marche', Nymphe: 'cinematique', Carrefour: 'cinematique', DiscoursSage: 'cinematique', Roue: 'marche', Banquet: 'cinematique', Diseuse: 'cinematique',
};
