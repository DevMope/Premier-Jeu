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
  volumes: { musique: 0.55, sons: 0.8 },
  coupe: { musique: false, sons: false },
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
    this.ctx = new AC();
    this.maitre = this.ctx.createGain(); this.maitre.gain.value = 0.9; this.maitre.connect(this.ctx.destination);
    // Une réverbération d'auberge : une réponse impulsionnelle de bruit qui s'éteint en 1,8 s
    const duree = 1.8, n = Math.floor(this.ctx.sampleRate * duree), imp = this.ctx.createBuffer(2, n, this.ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = imp.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.6) * 0.5; }
    this.reverb = this.ctx.createConvolver(); this.reverb.buffer = imp;
    this.reverbGain = this.ctx.createGain(); this.reverbGain.gain.value = 0.35;
    this.reverb.connect(this.reverbGain); this.reverbGain.connect(this.maitre);
    this.busSons = this.ctx.createGain(); this.busSons.connect(this.maitre); this.busSons.connect(this.reverb);
    this.busMusique = this.ctx.createGain(); this.busMusique.connect(this.maitre); this.busMusique.connect(this.reverb);
    this.appliquerVolumes();
    this.pret = true;
    if (this.themeVoulu) this.ambiance(this.themeVoulu);
  },
  reprendre() { if (this.ctx && this.ctx.state === 'suspended' && !(window.OfflineAudioContext && this.ctx instanceof OfflineAudioContext)) this.ctx.resume(); },
  appliquerVolumes() {
    if (!this.pret) return;
    this.busSons.gain.value = this.coupe.sons ? 0 : this.volumes.sons;
    this.busMusique.gain.value = this.coupe.musique ? 0 : this.volumes.musique;
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
    g.gain.setValueAtTime(Math.max(0.0005, v * s), fin);
    g.gain.exponentialRampToValueAtTime(0.0005, fin + r);
    for (const [type, mult, vol, detune] of I.voix) {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq * mult; o.detune.value = detune || 0;
      const og = ctx.createGain(); og.gain.value = vol; o.connect(og); og.connect(g);
      if (I.vibrato) { const lfo = ctx.createOscillator(); lfo.frequency.value = 5.2; const lg = ctx.createGain(); lg.gain.value = freq * I.vibrato; lfo.connect(lg); lg.connect(o.frequency); lfo.start(t + a); lfo.stop(fin + r + 0.1); }
      if (I.glisse) { o.frequency.setValueAtTime(freq * mult * I.glisse, t); o.frequency.exponentialRampToValueAtTime(freq * mult, t + a + 0.02); }
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
    if (T.reverb) { const r = this.ctx.createGain(); r.gain.value = T.reverb; bus.connect(r); r.connect(this.reverb); } // (plus de résonance pour ce thème)
    this.courant = bus;
    this.mesure = 0; this.graine = 7;
    this.horloge = this.ctx.currentTime + 0.1;
    const avance = () => {
      if (this.courant !== bus) return;
      while (this.horloge < this.ctx.currentTime + 0.6) { this.jouerMesure(T, this.horloge, bus); this.horloge += T.temps * 60 / T.tempo; this.mesure++; }
    };
    avance();
    this.boucle = setInterval(avance, 150);
  },
  arreter() {
    if (this.boucle) { clearInterval(this.boucle); this.boucle = null; }
    if (this.courant && this.ctx) { const b = this.courant, t = this.ctx.currentTime; b.gain.cancelScheduledValues(t); b.gain.setValueAtTime(b.gain.value || 1, t); b.gain.exponentialRampToValueAtTime(0.0005, t + 1.2); setTimeout(() => b.disconnect(), 1500); }
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
    if (T.basse) for (const [pos, deg, dur] of T.basse(m, accord)) this.note(T.instruments.basse, freq(deg, -1), t0 + pos * temps, dur * temps, 0.9, bus);
    // L'accompagnement : un arpège ou des accords plaqués
    if (T.accompagnement) for (const [pos, i, dur, force] of T.accompagnement(m)) this.note(T.instruments.accompagnement, freq(tons[i % 3] + Math.floor(i / 3) * 7), t0 + pos * temps, dur * temps, force ?? 0.6, bus);
    // La mélodie : le motif du thème sur certaines mesures, une broderie dans la gamme sinon
    const phrase = m % T.phrase;
    let notes;
    if (T.motif[phrase]) notes = T.motif[phrase];
    else {
      notes = []; let deg = tons[Math.floor(this.hasard() * 3)] + 7, pos = 0;
      const rythme = T.rythmes[Math.floor(this.hasard() * T.rythmes.length)];
      for (const dur of rythme) {
        if (this.hasard() < T.silence) { pos += dur; continue; }
        const saut = this.hasard() < 0.6 ? (this.hasard() < 0.5 ? -1 : 1) : (this.hasard() < 0.5 ? -2 : 2);
        deg = Math.max(accord + 4, Math.min(accord + 13, deg + saut));
        if (dur >= 1 && !tons.some(x => (x - deg) % 7 === 0)) deg += (this.hasard() < 0.5 ? -1 : 1); // une longue se pose sur l'accord
        notes.push([pos, deg, dur * 0.95]); pos += dur;
      }
    }
    for (const [pos, deg, dur] of notes) this.note(T.instruments.melodie, freq(deg + (T.octaveMelodie || 0) * 7), t0 + pos * temps, dur * temps, 0.8 + this.hasard() * 0.2, bus);
    // La percussion
    if (T.percussion && !this.coupe.musique) for (const [pos, quoi, force] of T.percussion(m)) this.percu(quoi, t0 + pos * temps, force ?? 1, bus);
  },
  percu(quoi, t, force, bus) {
    if (quoi === 'tambour') { const o = this.ctx.createOscillator(); const g = this.ctx.createGain(); o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12); g.gain.setValueAtTime(0.5 * force, t); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.25); o.connect(g); g.connect(bus); o.start(t); o.stop(t + 0.3); }
    else if (quoi === 'tambourin') this.bruit(0.08, t, bus, 0.16 * force, 6000, 'highpass');
    else if (quoi === 'bois') this.bruit(0.03, t, bus, 0.25 * force, 2400);
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
    if (son) SONS[son].call(this, 0.2, this.busSons, {});
    else {
      const T = THEMES[theme]; this.mesure = 0; this.graine = 7;
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
    S.call(this, this.ctx.currentTime + 0.01, this.busSons, options);
  },
};

// Les instruments : [forme d'onde, multiple de la fréquence, volume, désaccord en cents]
const INSTRUMENTS = {
  carillon: { voix: [['sine', 1, 0.7], ['sine', 2.76, 0.18], ['sine', 5.4, 0.07], ['sine', 0.5, 0.15]], attaque: 0.003, decroissance: 1.8, tenue: 0.06, relache: 1.2, volume: 0.2 },
  glas: { voix: [['sine', 1, 0.7], ['sine', 2.4, 0.25], ['sine', 3.9, 0.1], ['triangle', 0.5, 0.2]], attaque: 0.005, decroissance: 2.6, tenue: 0.08, relache: 1.8, volume: 0.24 },
  fluteDouce: { voix: [['sine', 1, 0.85], ['triangle', 1, 0.08], ['sine', 2, 0.03]], attaque: 0.09, decroissance: 0.15, tenue: 0.8, relache: 0.2, volume: 0.24, vibrato: 0.004, filtre: 1800 },
  choeur: { voix: [['sawtooth', 1, 0.2, -8], ['sawtooth', 1, 0.2, 8], ['sine', 1, 0.4], ['sine', 2, 0.1, 4]], attaque: 0.6, decroissance: 0.4, tenue: 0.9, relache: 0.9, volume: 0.1, filtre: 900, vibrato: 0.004 },
  flute: { voix: [['sine', 1, 0.7], ['triangle', 1, 0.25], ['sine', 2, 0.08]], attaque: 0.06, decroissance: 0.1, tenue: 0.8, relache: 0.15, volume: 0.22, vibrato: 0.006, bruit: { duree: 0.08, volume: 0.04, filtre: 3000 } },
  luth: { voix: [['triangle', 1, 0.8], ['sawtooth', 1, 0.15], ['sine', 2, 0.15]], attaque: 0.005, decroissance: 0.5, tenue: 0.12, relache: 0.25, volume: 0.22, filtre: 2600, glisse: 1.01 },
  harpe: { voix: [['sine', 1, 0.8], ['triangle', 1, 0.25], ['sine', 3, 0.06]], attaque: 0.004, decroissance: 0.9, tenue: 0.1, relache: 0.4, volume: 0.2 },
  celesta: { voix: [['sine', 1, 0.8], ['sine', 4, 0.12], ['sine', 2.4, 0.05]], attaque: 0.003, decroissance: 1.2, tenue: 0.05, relache: 0.6, volume: 0.22 },
  boiteAMusique: { voix: [['sine', 1, 0.7], ['sine', 3, 0.1], ['sine', 5.2, 0.03]], attaque: 0.002, decroissance: 0.8, tenue: 0.04, relache: 0.5, volume: 0.18 },
  cordes: { voix: [['sawtooth', 1, 0.3, -6], ['sawtooth', 1, 0.3, 6], ['sawtooth', 1.005, 0.2, 0]], attaque: 0.35, decroissance: 0.3, tenue: 0.85, relache: 0.5, volume: 0.1, filtre: 1500, vibrato: 0.003 },
  vielle: { voix: [['sawtooth', 1, 0.5], ['square', 1, 0.1, 4], ['sawtooth', 2, 0.12]], attaque: 0.08, decroissance: 0.2, tenue: 0.8, relache: 0.2, volume: 0.12, filtre: 1800, vibrato: 0.008 },
  basse: { voix: [['triangle', 1, 0.8], ['sine', 1, 0.5], ['sawtooth', 1, 0.08]], attaque: 0.01, decroissance: 0.4, tenue: 0.3, relache: 0.2, volume: 0.28, filtre: 500 },
  orgue: { voix: [['sine', 1, 0.6], ['sine', 2, 0.35], ['sine', 3, 0.12], ['sine', 0.5, 0.25]], attaque: 0.25, decroissance: 0.2, tenue: 0.9, relache: 0.6, volume: 0.1 },
  bourdon: { voix: [['sawtooth', 1, 0.3], ['sawtooth', 1, 0.3, 9], ['sine', 0.5, 0.5]], attaque: 1.2, decroissance: 0.5, tenue: 0.9, relache: 1.5, volume: 0.1, filtre: 600 },
  piano: { voix: [['triangle', 1, 0.7], ['sine', 2, 0.2], ['sawtooth', 1, 0.08]], attaque: 0.004, decroissance: 1.4, tenue: 0.08, relache: 0.5, volume: 0.2, filtre: 2200 },
};

// Les gammes, en demi-tons depuis la tonique
const GAMMES = {
  majeur: [0, 2, 4, 5, 7, 9, 11], mineur: [0, 2, 3, 5, 7, 8, 10], dorien: [0, 2, 3, 5, 7, 9, 10], mixolydien: [0, 2, 4, 5, 7, 9, 10], lydien: [0, 2, 4, 6, 7, 9, 11],
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
    instruments: { melodie: 'carillon', accompagnement: 'cordes', basse: 'basse' }, reverb: 0.5,
    motif: { 0: [[0, 7, 1], [1, 9, 1], [2, 11, 1]], 1: [[0, 14, 2], [2, 11, 1]], 2: [[0, 12, 1], [1, 11, 1], [2, 9, 1]], 3: [[0, 10, 3]], 4: [[0, 7, 1], [1, 9, 1], [2, 11, 1]], 5: [[0, 13, 2], [2, 14, 1]], 6: [[0, 12, 1.5], [1.5, 11, 0.5], [2, 9, 1]], 7: [[0, 7, 3]] },
    rythmes: [[1, 1, 1], [2, 1], [1, 2]], silence: 0.1,
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
    accords: [0, 0, 3, 3, 5, 5, 4, 4], octaveMelodie: 2,
    instruments: { melodie: 'celesta', accompagnement: 'harpe', basse: 'basse' }, reverb: 0.2,
    motif: { 0: [[0, 9, 1], [1, 11, 1], [2, 12, 1]], 1: [[0, 14, 2], [2, 12, 1]], 2: [[0, 11, 1], [1, 9, 1], [2, 7, 1]], 3: [[0, 9, 3]], 4: [[0, 9, 1], [1, 11, 1], [2, 14, 1]], 5: [[0, 16, 2], [2, 14, 1]], 6: [[0, 12, 1], [1, 11, 1], [2, 9, 1]], 7: [[0, 7, 3]] },
    rythmes: [[1, 1, 1], [2, 1]], silence: 0.2,
    basse: (m, a) => [[0, a, 2.8]],
    accompagnement: (m) => [[0, 0, 1, 0.5], [1, 1, 1, 0.4], [2, 2, 1, 0.4], [1.5, 3, 0.5, 0.3], [2.5, 4, 0.5, 0.3]],
  },
  // Le comptoir, troisième air : un barde qui gratte son luth au coin du feu, lent et chaud
  comptoir3: {
    base: NOTE.G / 2, gamme: GAMMES.mixolydien, tempo: 68, temps: 4, phrase: 8,
    accords: [0, 6, 3, 0, 4, 6, 3, 4], octaveMelodie: 1,
    instruments: { melodie: 'vielle', accompagnement: 'luth', basse: 'basse' },
    motif: { 0: [[0, 11, 1.5], [1.5, 9, 0.5], [2, 7, 2]], 1: [[0, 9, 1], [1, 10, 1], [2, 11, 2]], 4: [[0, 14, 1.5], [1.5, 12, 0.5], [2, 11, 2]], 5: [[0, 9, 1], [1, 7, 1], [2, 6, 2]] },
    rythmes: [[2, 2], [1, 1, 2], [1.5, 0.5, 2], [4]], silence: 0.35,
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
    instruments: { melodie: 'piano', accompagnement: 'cordes', basse: 'basse' }, reverb: 0.3,
    motif: { 0: [[0, 11, 2], [2, 10, 1], [3, 9, 1]], 1: [[0, 7, 3]], 4: [[0, 12, 2], [2, 11, 1], [3, 9, 1]], 5: [[0, 8, 4]] },
    rythmes: [[2, 2], [4], [1, 3]], silence: 0.4,
    basse: (m, a) => [[0, a, 3.8]],
    accompagnement: (m) => [[0, 0, 3.9, 0.3], [0, 1, 3.9, 0.25], [0, 2, 3.9, 0.25]],
  },
  recitPeur: {
    base: NOTE.E / 4, gamme: GAMMES.mineur, tempo: 72, temps: 4, phrase: 4,
    accords: [0, 0, 1, 0], octaveMelodie: 2,
    instruments: { melodie: 'vielle', accompagnement: 'choeur', basse: 'bourdon' }, reverb: 0.4,
    motif: { 0: [[0, 7, 2], [2, 8, 2]], 1: [[0, 7, 1], [1, 6, 1], [2, 8, 2]], 2: [[0, 13, 3], [3, 12, 1]], 3: [[0, 8, 4]] },
    rythmes: [[4]], silence: 0,
    basse: (m, a) => [[0, a, 3.9]],
    accompagnement: (m) => [[0, 0, 3.9, 0.6], [0, 1, 3.9, 0.35]],
    percussion: (m) => [[0, 'coeur', 1], [0.4, 'coeur', 0.6], [2, 'coeur', 1], [2.4, 'coeur', 0.6], [3.5, 'tambour', 0.5]],
  },
  recitEtonne: {
    base: NOTE.C / 2, gamme: GAMMES.lydien, tempo: 84, temps: 4, phrase: 8,
    accords: [0, 1, 0, 4, 0, 1, 3, 4], octaveMelodie: 2,
    instruments: { melodie: 'celesta', accompagnement: 'harpe', basse: 'basse' }, reverb: 0.35,
    motif: { 0: [[0, 7, 1], [1, 10, 1], [2, 14, 2]], 1: [[0, 13, 1], [1, 10, 1], [2, 11, 2]], 4: [[0, 7, 1], [1, 11, 1], [2, 14, 1], [3, 17, 1]], 5: [[0, 16, 2], [2, 14, 2]] },
    rythmes: [[1, 1, 2], [2, 2], [0.5, 0.5, 1, 2]], silence: 0.3,
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
  banque: {
    base: NOTE.F / 2, gamme: GAMMES.majeur, tempo: 84, temps: 4, phrase: 8,
    accords: [0, 3, 4, 0, 5, 3, 4, 0], octaveMelodie: 2,
    instruments: { melodie: 'harpe', accompagnement: 'orgue', basse: 'basse' },
    motif: { 0: [[0, 7, 1], [1, 11, 1], [2, 14, 2]], 1: [[0, 13, 1], [1, 11, 1], [2, 9, 2]] },
    rythmes: [[1, 1, 2], [2, 2], [1, 1, 1, 1]], silence: 0.3,
    basse: (m, a) => [[0, a, 3.8]],
    accompagnement: (m) => [[0, 0, 3.9, 0.3], [0, 1, 3.9, 0.25], [0, 2, 3.9, 0.25]],
  },
  // Les cinématiques : cordes et célesta, mystère et émerveillement (Harry Potter, le Hobbit)
  cinematique: {
    base: NOTE.D / 2, gamme: GAMMES.lydien, tempo: 72, temps: 4, phrase: 8,
    accords: [0, 0, 1, 1, 4, 4, 3, 3], octaveMelodie: 2,
    instruments: { melodie: 'celesta', accompagnement: 'cordes', basse: 'basse' },
    motif: { 0: [[0, 7, 1], [1, 11, 1], [2, 14, 1], [3, 13, 1]], 1: [[0, 11, 2], [2, 9, 2]], 4: [[0, 7, 1], [1, 11, 1], [2, 14, 1], [3, 17, 1]], 5: [[0, 16, 2], [2, 14, 2]] },
    rythmes: [[2, 2], [1, 1, 2], [4]], silence: 0.3,
    basse: (m, a) => [[0, a, 3.8]],
    accompagnement: (m) => [[0, 0, 3.9, 0.35], [0, 1, 3.9, 0.3], [0, 2, 3.9, 0.3]],
  },
  // La faillite : lent, piano et cordes, en mineur
  faillite: {
    base: NOTE.D / 2, gamme: GAMMES.mineur, tempo: 60, temps: 4, phrase: 4,
    accords: [0, 5, 3, 4], octaveMelodie: 2,
    instruments: { melodie: 'piano', accompagnement: 'cordes', basse: 'basse' },
    motif: { 0: [[0, 11, 2], [2, 10, 1], [3, 9, 1]], 1: [[0, 7, 4]] },
    rythmes: [[2, 2], [4]], silence: 0.4,
    basse: (m, a) => [[0, a, 3.8]],
    accompagnement: (m) => [[0, 0, 3.9, 0.3], [0, 1, 3.9, 0.25], [0, 2, 3.9, 0.25]],
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
  succes(t, bus) { [0, 4, 7, 12].forEach((d, i) => this.note('celesta', 523.25 * Math.pow(2, d / 12), t + i * 0.09, 0.3, 0.8, bus)); },
  // Un accord qui tombe (échec)
  echec(t, bus) { [7, 3, 0].forEach((d, i) => this.note('piano', 261.63 * Math.pow(2, d / 12), t + i * 0.16, 0.6, 0.7, bus)); },
  // Des pas sur le plancher
  pas(t, bus) { for (let i = 0; i < 4; i++) { this.bruit(0.05, t + i * 0.26, bus, 0.5, 320 + (i % 2) * 120); const o = this.ctx.createOscillator(); o.frequency.setValueAtTime(120, t + i * 0.26); o.frequency.exponentialRampToValueAtTime(60, t + i * 0.26 + 0.08); const g = this.ctx.createGain(); g.gain.setValueAtTime(0.25, t + i * 0.26); g.gain.exponentialRampToValueAtTime(0.0005, t + i * 0.26 + 0.12); o.connect(g); g.connect(bus); o.start(t + i * 0.26); o.stop(t + i * 0.26 + 0.15); } },
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
};

// Le thème de chaque scène du jeu
const THEME_PAR_SCENE = {
  Titre: 'titre', Intro: 'cinematique', IntroHistoire: 'cinematique', Comptoir: 'comptoir', Nuit: 'nuit', Dodo: 'nuit', Recit: 'recitEtonne', Faillite: 'faillite',
  Express: 'jeux', Banque: 'banque', Marche: 'marche', Atelier: 'comptoir', Bureau: 'comptoir', Carte: 'carte', Facade: 'marche', Arriere: 'comptoir', Renovation: 'cinematique', Promenade: 'nuit',
};
