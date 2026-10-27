// (v1.64) Les trois sons refusés par le joueur sur la page d'écoute v1.61, refaits pour être réalistes : le marteau
// (du charpentier et de la forge), la foule du marché et la cloche du marché. Deux variantes de chacun (et deux nouvelles
// pour la foule, C et D, après le refus de A et B), à écouter sur docs/planches-v059/sons-v164.html.
//
// Les points d'accroche sont en place (voir sonAChoisir) : chaque son joue la variante notée dans SONS_A_CHOISIR, ou,
// sans variante notée (ou le drapeau `actif` baissé), le jeu garde l'ancien son (l'enclume) ou le silence.
//
// Ici, rien n'est un graphe Web Audio : chaque son est calculé échantillon par échantillon (des modes qui résonnent,
// des bruits filtrés, une réverbération), une seule fois, puis rejoué depuis son tampon. Le même code fabrique les
// fichiers .wav de la page d'écoute (sous Node, voir module.exports en bas).
// (27/10) Le joueur a choisi : le marteau B pour l'atelier et les charpentiers (les planches du marché, l'étage, les
// réparations), le marteau A pour la forge, la cloche A (chaque matin après le coq). Les foules A et B sont refusées ;
// C et D attendent son choix : tant que `foule` est vide, la place reste sans foule.
const SONS_A_CHOISIR = { actif: true, marteau: { forge: 'A', atelier: 'B' }, cloche: 'A', foule: null };

const FabriqueSons = (() => {
  // Les niveaux visés (mesurés sur les sons du jeu : l'enclume 0,056, le marteau de la v1.61 0,072, sa cloche 0,051,
  // son brouhaha 0,037) : un geste du jeu, un grand moment, un fond qui ne couvre pas les voix
  const NIVEAUX = { marteau: 0.066, cloche: 0.052, foule: 0.034, fondFoule: 0.024, eclatFoule: 0.05 };
  // --- Les outils ---
  // Un tirage au sort qui se rejoue à l'identique (une graine = une variante)
  const alea = graine => { let s = ((graine | 0) * 2654435761) >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; };
  const entre = (r, a, b) => a + (b - a) * r();
  // Un mode qui résonne : une sinusoïde qui s'éteint de 60 dB en `t60` secondes (une cloche, une enclume, une planche)
  function mode(x, sr, t0, f, amp, t60, attaque = 0.0012) {
    const n0 = Math.floor(t0 * sr);
    if (f <= 20 || f >= sr * 0.48 || n0 >= x.length || amp <= 0) return;
    const len = Math.min(x.length - Math.max(0, n0), Math.ceil(t60 * sr * 1.1));
    const w = 2 * Math.PI * f / sr, cw = Math.cos(w), sw = Math.sin(w), r = Math.pow(0.001, 1 / (t60 * sr)), na = Math.max(1, Math.floor(attaque * sr));
    let c = 1, s = 0, e = amp;
    for (let i = 0; i < len; i++) {
      const j = n0 + i; if (j >= 0) x[j] += e * (i < na ? i / na : 1) * s;
      const c2 = c * cw - s * sw; s = s * cw + c * sw; c = c2; e *= r;
      if ((i & 1023) === 1023) { const m = Math.hypot(c, s); c /= m; s /= m; }   // (pas de dérive)
    }
  }
  // Les coefficients d'un filtre du second ordre (RBJ) : passe-bas, passe-haut, passe-bande (crête à 0 dB)
  function coefs(type, f, q, sr) {
    const w = 2 * Math.PI * Math.min(f, sr * 0.45) / sr, cw = Math.cos(w), al = Math.sin(w) / (2 * q), a0 = 1 + al;
    let b0, b1, b2;
    if (type === 'lowpass') { b0 = (1 - cw) / 2; b1 = 1 - cw; b2 = b0; }
    else if (type === 'highpass') { b0 = (1 + cw) / 2; b1 = -(1 + cw); b2 = b0; }
    else { b0 = al; b1 = 0; b2 = -al; }
    return [b0 / a0, b1 / a0, b2 / a0, -2 * cw / a0, (1 - al) / a0];
  }
  function filtrer(x, type, f, q, sr) {
    const [b0, b1, b2, a1, a2] = coefs(type, f, q, sr);
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < x.length; i++) { const v = x[i], y = b0 * v + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = v; y2 = y1; y1 = y; x[i] = y; }
    return x;
  }
  // Un bruit filtré qui s'éteint (un choc, un frottement, un souffle), ajouté dans x à t0
  function choc(x, sr, t0, duree, amp, r, { type = 'bandpass', f = 2000, q = 1, attaque = 0.0008, pente = 5 } = {}) {
    const n = Math.max(2, Math.floor(duree * sr)), b = new Float32Array(n);
    for (let i = 0; i < n; i++) b[i] = r() * 2 - 1;
    filtrer(b, type, f, q, sr);
    const n0 = Math.floor(t0 * sr), na = Math.max(1, Math.floor(attaque * sr));
    for (let i = 0; i < n && n0 + i < x.length; i++) if (n0 + i >= 0) x[n0 + i] += amp * b[i] * (i < na ? i / na : 1) * Math.exp(-pente * i / n);
  }
  // La réverbération (huit filtres en peigne et quatre passe-tout, d'après Freeverb) : la pièce, la place, la halle
  function reverbe(x, sr, { taille = 0.6, amorti = 0.35, mix = 0.25, predelai = 0.012 } = {}) {
    const k = sr / 44100, longueurs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map(n => Math.max(8, Math.round(n * k * (0.55 + 0.6 * taille))));
    const passes = [556, 441, 341, 225].map(n => Math.max(4, Math.round(n * k))), fb = 0.72 + 0.26 * taille, pre = Math.round(predelai * sr);
    const combs = longueurs.map(n => ({ b: new Float32Array(n), i: 0, z: 0 })), aps = passes.map(n => ({ b: new Float32Array(n), i: 0 }));
    const out = new Float32Array(x.length);
    for (let n = 0; n < x.length; n++) {
      const entree = (n >= pre ? x[n - pre] : 0) * 0.015;
      let s = 0;
      for (const c of combs) { const y = c.b[c.i]; c.z = y * (1 - amorti) + c.z * amorti; c.b[c.i] = entree + c.z * fb; c.i = (c.i + 1) % c.b.length; s += y; }
      for (const a of aps) { const y = a.b[a.i]; const o = -s + y; a.b[a.i] = s + y * 0.5; a.i = (a.i + 1) % a.b.length; s = o; }
      out[n] = x[n] * (1 - mix * 0.5) + s * 3 * mix;
    }
    return out;
  }
  // Ramener un son à un niveau (la moyenne de ses passages forts, comme on a mesuré les autres sons du jeu) : chacun à
  // la hauteur de sa famille
  function niveler(x, rmsVoulu, cretMax = 0.92) {
    const fen = 1024, rms = [];
    for (let i = 0; i + fen <= x.length; i += fen) { let s = 0; for (let j = i; j < i + fen; j++) s += x[j] * x[j]; rms.push(Math.sqrt(s / fen)); }
    rms.sort((a, b) => b - a);
    const actives = rms.filter(v => v > 1e-4).length, haut = rms.slice(0, Math.max(1, Math.ceil(actives * 0.25))), moy = haut.reduce((a, b) => a + b, 0) / haut.length || 1e-9;
    let g = rmsVoulu / moy, crete = 0;
    for (let i = 0; i < x.length; i++) crete = Math.max(crete, Math.abs(x[i]));
    if (crete * g > cretMax) g = cretMax / crete;
    for (let i = 0; i < x.length; i++) x[i] *= g;
    return x;
  }
  // Repasser un son rendu à basse fréquence (le brouhaha lointain) à la fréquence du jeu : `k` fois plus de notes
  function surechantillonner(y, k) {
    const x = new Float32Array(y.length * k);
    for (let i = 0; i < x.length; i++) { const p = i / k, j = Math.floor(p), f = p - j; x[i] = (y[j] || 0) * (1 - f) + (y[j + 1] || 0) * f; }
    return x;
  }
  // Un fondu au début et à la fin (jamais de clic)
  function fondus(x, sr, debut = 0.004, fin = 0.05) {
    const a = Math.floor(debut * sr), b = Math.floor(fin * sr);
    for (let i = 0; i < a && i < x.length; i++) x[i] *= i / a;
    for (let i = 0; i < b && i < x.length; i++) x[x.length - 1 - i] *= i / b;
    return x;
  }

  // ======================================================================================
  // Le marteau. o.matiere : 'bois' (le charpentier qui cloue) ou 'metal' (le forgeron sur l'enclume) ;
  // o.duree : la longueur de la série de coups (2,4 s au jeu, plus longue sur la page d'écoute)
  // ======================================================================================
  // Un coup sur le bois : le choc du fer sur la tête du clou, la planche qui sonne (sourde et brève), le clou qui
  // chante un peu (plus aigu à mesure qu'il s'enfonce : il reste moins de clou libre), la tête du marteau
  function coupBois(x, sr, t, force, r, { enfonce = 0, poutre = false, rebond = false, pose = false } = {}) {
    choc(x, sr, t, 0.006, 0.9 * force, r, { type: 'bandpass', f: entre(r, 2200, 3200), q: 0.8, pente: 4 });
    choc(x, sr, t, 0.05, 0.5 * force, r, { type: 'lowpass', f: poutre ? 700 : 1100, q: 0.7, pente: 7 });
    const bas = poutre ? entre(r, 105, 140) : entre(r, 170, 240);
    for (const [m, a, t60] of [[1, 0.55, poutre ? 0.32 : 0.12], [2.31, 0.3, poutre ? 0.16 : 0.07], [3.9, 0.16, 0.05], [6.2, 0.07, 0.03]]) mode(x, sr, t, bas * m * entre(r, 0.97, 1.03), a * force, t60, 0.0008);
    if (!pose) {   // (le clou : il chante, de plus en plus aigu)
      const fc = 2300 * (1 + 0.55 * enfonce) * entre(r, 0.97, 1.03);
      mode(x, sr, t, fc, 0.12 * force * (1 - 0.7 * enfonce), 0.16 - 0.08 * enfonce, 0.0005);
      mode(x, sr, t, fc * 2.76, 0.04 * force * (1 - enfonce), 0.06, 0.0005);
    }
    mode(x, sr, t, entre(r, 3900, 4400), 0.05 * force, 0.05, 0.0005);   // (la tête du marteau)
    if (rebond) choc(x, sr, t + entre(r, 0.045, 0.07), 0.004, 0.18 * force, r, { type: 'bandpass', f: 2600, q: 1 });
  }
  // Un coup sur l'enclume. Sur le fer chaud (`surFer`), le métal mou étouffe la table : un choc plus mat, une
  // résonance courte ; à vide, la table chante longtemps (le « ting » du forgeron entre deux frappes)
  function coupEnclume(x, sr, t, force, r, { surFer = true, base = 880, grave = false } = {}) {
    const etouffe = surFer ? 0.32 : 1;
    choc(x, sr, t, 0.004, (surFer ? 0.6 : 0.9) * force, r, { type: 'highpass', f: 2500, q: 0.7, pente: 3 });
    if (surFer) choc(x, sr, t, 0.06, 0.55 * force, r, { type: 'lowpass', f: 900, q: 0.7, pente: 6 });
    const f = base * entre(r, 0.985, 1.015);
    for (const [m, a, t60] of [[1, 0.5, 2.2], [1.53, 0.32, 1.6], [2.31, 0.3, 1.3], [2.89, 0.2, 1.0], [3.71, 0.16, 0.8], [4.62, 0.1, 0.55], [5.4, 0.06, 0.4], [6.95, 0.04, 0.25]])
      mode(x, sr, t, f * m, a * force * (surFer ? 0.55 : 1), t60 * etouffe * (grave ? 1.25 : 1), 0.0005);
    mode(x, sr, t, entre(r, 3150, 3400), 0.08 * force, 0.12, 0.0004);   // (la tête du marteau)
    mode(x, sr, t, grave ? 95 : 130, 0.25 * force, 0.07, 0.002);   // (le billot qui encaisse)
  }
  // Le rythme des vrais coups : jamais au métronome (± 8 %), plus ou moins forts, des pauses pour souffler
  // A. « Coups francs » : le charpentier pose le clou (deux petits coups), puis l'enfonce en trois ou quatre coups
  //    qui accélèrent un peu ; le forgeron frappe des séries de 3 à 5 coups sur le fer, puis le retourne.
  function marteauA(sr, o = {}) {
    const r = alea(o.graine || 11), duree = o.duree || 2.4, metal = o.matiere === 'metal';
    const x = new Float32Array(Math.ceil((duree + (metal ? 2.2 : 0.6)) * sr));
    let t = 0.03;
    while (t < duree - 0.25) {
      if (metal) {
        const n = 3 + Math.floor(r() * 3), ecart = entre(r, 0.36, 0.46);
        for (let k = 0; k < n && t < duree; k++) { coupEnclume(x, sr, t, entre(r, 0.75, 1) * (k === 0 ? 0.85 : 1), r, { surFer: true }); t += ecart * entre(r, 0.92, 1.08); }
        if (t < duree - 0.5) { coupEnclume(x, sr, t - ecart * 0.45, 0.35, r, { surFer: false }); }   // (il retourne la pièce : le marteau effleure la table)
        t += entre(r, 0.55, 0.9);
      } else {
        coupBois(x, sr, t, 0.38, r, { enfonce: 0 }); t += entre(r, 0.24, 0.3);
        coupBois(x, sr, t, 0.42, r, { enfonce: 0.05 }); t += entre(r, 0.38, 0.48);
        const n = 3 + Math.floor(r() * 2);
        for (let k = 0; k < n && t < duree + 0.2; k++) { const fin = k === n - 1; coupBois(x, sr, t, entre(r, 0.85, 1), r, { enfonce: (k + 1) / n, pose: fin }); t += entre(r, 0.36, 0.44) * (1 - k * 0.04); }
        t += entre(r, 0.5, 0.8);
      }
    }
    return niveler(fondus(reverbe(x, sr, metal ? { taille: 0.5, amorti: 0.45, mix: 0.18 } : { taille: 0.35, amorti: 0.5, mix: 0.12 }), sr), NIVEAUX.marteau);
  }
  // B. « Le rythme de l'artisan » : le forgeron frappe le fer, et entre deux frappes laisse rebondir son marteau sur la
  //    table de l'enclume (« ting-ting ») pour garder la cadence ; une enclume plus lourde, une forge de pierre qui résonne.
  //    Le charpentier cloue dans une poutre (plus grave, qui vibre plus longtemps), son marteau rebondit après chaque coup.
  function marteauB(sr, o = {}) {
    const r = alea(o.graine || 23), duree = o.duree || 2.4, metal = o.matiere === 'metal';
    const x = new Float32Array(Math.ceil((duree + (metal ? 2.6 : 0.8)) * sr));
    let t = 0.03;
    if (metal) {
      while (t < duree - 0.2) {
        coupEnclume(x, sr, t, entre(r, 0.85, 1), r, { surFer: true, base: 690, grave: true });
        const tings = r() < 0.6 ? 2 : 1;
        for (let k = 0; k < tings; k++) coupEnclume(x, sr, t + 0.2 + k * 0.15 + entre(r, -0.015, 0.015), entre(r, 0.18, 0.28) / (k + 1), r, { surFer: false, base: 690, grave: true });
        t += entre(r, 0.62, 0.78);
        if (r() < 0.18) t += entre(r, 0.4, 0.7);   // (il regarde la pièce)
      }
    } else {
      while (t < duree - 0.2) {
        coupBois(x, sr, t, 0.35, r, { enfonce: 0, poutre: true, rebond: true }); t += entre(r, 0.32, 0.4);
        const n = 2 + Math.floor(r() * 3);
        for (let k = 0; k < n && t < duree + 0.2; k++) { coupBois(x, sr, t, entre(r, 0.8, 1), r, { enfonce: (k + 1) / n, poutre: true, rebond: true, pose: k === n - 1 }); t += entre(r, 0.5, 0.62); }
        t += entre(r, 0.6, 1.1);
      }
    }
    return niveler(fondus(reverbe(x, sr, metal ? { taille: 0.75, amorti: 0.3, mix: 0.3 } : { taille: 0.45, amorti: 0.45, mix: 0.16 }), sr), NIVEAUX.marteau);
  }

  // ======================================================================================
  // La cloche du marché : une cloche de bronze. Ses partiels ne sont pas harmoniques (le bourdon à l'octave du
  // dessous, la fondamentale, la tierce mineure, la quinte, la nominale à l'octave, puis des aigus serrés) ; chacun
  // s'éteint à son rythme (les graves durent, les aigus meurent vite) ; et chacun est double (la cloche n'est jamais
  // tout à fait ronde) : deux fréquences voisines qui battent, le « wouang-wouang » qui reste dans l'air.
  // ======================================================================================
  const PARTIELS_CLOCHE = [   // [rapport à la fondamentale, volume, durée de vie (rapportée à celle du bourdon)]
    [0.5, 0.55, 1], [1, 0.62, 0.62], [1.183, 0.5, 0.52], [1.506, 0.24, 0.32], [2, 0.78, 0.36], [2.514, 0.32, 0.22],
    [2.662, 0.28, 0.2], [3.011, 0.24, 0.16], [4.166, 0.16, 0.1], [5.433, 0.11, 0.07], [6.796, 0.07, 0.05], [8.215, 0.04, 0.035],
  ];
  function coupCloche(x, sr, t, f, force, r, { vie = 12, battement = 1, ecarts = null } = {}) {
    PARTIELS_CLOCHE.forEach(([m, a, v], i) => {
      const fi = f * m * (1 + (ecarts ? ecarts[i] : 0)), d = (ecarts ? ecarts[i + 20] : 0.8) * battement;   // (le battement : 0,3 à 2,5 Hz)
      const t60 = vie * v * (1 + (a > 0.3 ? 0.1 : 0));
      mode(x, sr, t, fi, a * force * 0.6, t60, 0.0015);
      mode(x, sr, t, fi + d, a * force * 0.4, t60 * 0.92, 0.0015);
    });
    // le battant qui frappe la pince : un « tonk » de fer, bref
    choc(x, sr, t, 0.012, 0.5 * force, r, { type: 'bandpass', f: entre(r, 1800, 2600), q: 0.9, pente: 6 });
    choc(x, sr, t, 0.03, 0.25 * force, r, { type: 'lowpass', f: 600, q: 0.7, pente: 6 });
  }
  // (les petits défauts de la cloche, toujours les mêmes pour une même cloche)
  function defautsCloche(graine, battement) { const r = alea(graine), e = []; for (let i = 0; i < 20; i++) e.push((r() - 0.5) * 0.008); for (let i = 0; i < 20; i++) e.push(0.3 + r() * 2.2 * battement); return e; }
  // A. « Le beffroi » : la grande cloche de la place (sol grave), lancée en volée : trois coups lents et inégaux
  //    (la cloche balance, le battant ne frappe pas au métronome), et la longue résonance qui s'éteint sur la place.
  function clocheA(sr, o = {}) {
    const r = alea(o.graine || 5), f = 196 * (o.hauteur || 1), coups = o.coups || 3, ecarts = defautsCloche(91, 1);
    const instants = []; let t = 0.05;
    for (let k = 0; k < coups; k++) { instants.push(t); t += entre(r, 1.85, 2.25); }
    const x = new Float32Array(Math.ceil((instants[instants.length - 1] + 11) * sr));
    instants.forEach((ti, k) => coupCloche(x, sr, ti, f, [1, 0.9, 0.82, 0.76, 0.7][k % 5] * entre(r, 0.94, 1.04), r, { vie: 13, battement: 1, ecarts }));
    return niveler(fondus(reverbe(x, sr, { taille: 0.85, amorti: 0.25, mix: 0.24, predelai: 0.03 }), sr, 0.002, 0.4), NIVEAUX.cloche);
  }
  // B. « La cloche de la halle » : une cloche plus petite (sol aigu), plus ronde de son mais moins parfaite (elle bat
  //    plus vite), tintée à la corde : le battant frappe un bord puis l'autre, fort, faible, fort... six coups, puis elle se tait.
  function clocheB(sr, o = {}) {
    const r = alea(o.graine || 7), f = 392 * (o.hauteur || 1), coups = o.coups || 6, ecarts = defautsCloche(47, 1.6);
    const instants = []; let t = 0.05;
    for (let k = 0; k < coups; k++) { instants.push(t); t += entre(r, 0.68, 0.82); }
    const x = new Float32Array(Math.ceil((instants[instants.length - 1] + 7) * sr));
    instants.forEach((ti, k) => coupCloche(x, sr, ti, f, (k % 2 ? 0.62 : 1) * (1 - k * 0.04) * entre(r, 0.94, 1.04), r, { vie: 7.5, battement: 1.6, ecarts }));
    return niveler(fondus(reverbe(x, sr, { taille: 0.65, amorti: 0.3, mix: 0.2, predelai: 0.02 }), sr, 0.002, 0.4), NIVEAUX.cloche);
  }

  // ======================================================================================
  // La foule du marché (v1.64, deuxième essai : les variantes A et B, trop graves, faisaient « fond d'horreur »).
  // Un marché animé, le matin : des voix claires, qui parlent vite et gaiement (l'intonation monte et descend, s'exclame,
  // ne s'effondre jamais vers le grave), dans l'air libre (peu de réverbération, pas de rumeur sourde) ; et tout près,
  // souvent, des éclats : des rires, des marchands qui hèlent, des enfants qui rient et s'écrient.
  // Chaque voix est vraiment une voix : une source (les cordes vocales, un peu de souffle) passée dans trois résonances
  // (les formants) qui glissent d'une voyelle à l'autre, syllabe après syllabe ; des consonnes ; des respirations.
  // ======================================================================================
  const VOYELLES = [[800, 1250, 2600], [420, 2050, 2650], [560, 1750, 2500], [290, 2250, 2950], [460, 820, 2500], [320, 760, 2300], [300, 1750, 2150], [420, 1450, 2350], [650, 1100, 2500]];
  const A_ = 0, E_ = 1, I_ = 3, O_ = 4;   // (les voyelles des rires et des appels : a, é, i, o)
  // Une voix de t0 à t0 + duree. o : f0 (la hauteur), k (les formants : 1 un homme, 1,15 une femme, 1,3 un enfant),
  // debit (syllabes par seconde), souffle, niveau ; rire ('ha', ou 'hi' pour un rire aigu d'enfant), heler (un marchand
  // qui appelle : « Ohé ! ... des pommes, des belles ! »), cri (un enfant qui s'écrie, « Ouiii ! »)
  function voix(x, sr, t0, duree, r, o = {}) {
    const f0 = o.f0 || 140, k = o.k || 1, debit = o.debit || 7, souffle = o.souffle || 0.06, niveau = o.niveau || 0.1, rire = o.rire;
    const syl = []; let t = 0;
    while (t < duree - 0.12) {
      const mots = rire ? 1 : 1 + Math.floor(r() * 4), exclame = r() < 0.45;
      const phrase = [];
      for (let m = 0; m < mots; m++) {
        const n = rire ? 4 + Math.floor(r() * 5) : 1 + Math.floor(r() * 3);
        for (let s = 0; s < n && t < duree - 0.1; s++) {
          const d = rire ? entre(r, 0.1, 0.14) : (1 / debit) * entre(r, 0.7, 1.3);
          phrase.push({ t, d, v: rire ? (rire === 'hi' ? I_ : r() < 0.7 ? A_ : E_) : Math.floor(r() * VOYELLES.length), c: rire ? 'h' : ['p', 's', 'm', 'l', '', 't', 'k', 'b'][Math.floor(r() * 8)], accent: r() < 0.45 ? entre(r, 0.08, 0.22) : 0 });
          t += d;
        }
        t += rire ? 0 : entre(r, 0.015, 0.07);
      }
      // le marchand : deux syllabes lancées haut (« Oh-é ! »), puis la dernière voyelle tenue et qui monte
      if (o.heler && phrase.length) { const der = phrase[phrase.length - 1]; der.d *= 3; der.v = r() < 0.5 ? O_ : E_; der.tenue = true; t = der.t + der.d; }
      if (o.cri && phrase.length) { const der = phrase[phrase.length - 1]; der.d *= 3.5; der.v = I_; der.tenue = true; t = der.t + der.d; }
      phrase.forEach(s => { s.exclame = exclame; s.debutPhrase = phrase[0].t; s.finPhrase = t; });
      syl.push(...phrase);
      t += rire ? duree : entre(r, 0.12, 0.6);   // (une respiration, l'autre répond)
    }
    if (!syl.length) return;
    const n0 = Math.floor(t0 * sr), n = Math.min(x.length - n0, Math.ceil(duree * sr));
    if (n <= 0) return;
    let phase = 0, si = 0, F = VOYELLES[syl[0].v].map(v => v * k);
    const res = [0, 0, 0].map(() => ({ y1: 0, y2: 0, a1: 0, a2: 0, b: 0 })), largeurs = [80, 100, 140], poids = [1, 1.5, 1.4];
    let lp = 0, bruitLp = 0, grain = 1;
    for (let i = 0; i < n; i++) {
      const tt = i / sr;
      while (si < syl.length - 1 && tt >= syl[si].t + syl[si].d) si++;
      const s = syl[si], dans = tt - s.t;
      if (dans < 0 || dans > s.d) { for (const q of res) { const y = -q.a1 * q.y1 - q.a2 * q.y2; q.y2 = q.y1; q.y1 = y; } continue; }
      const u = dans / s.d, cons = s.c;
      const tc = cons === 's' || cons === 'h' ? (rire ? 0.35 : 0.24) : cons === 'p' || cons === 't' || cons === 'k' || cons === 'b' ? 0.1 : 0;
      let voise = u < tc ? (cons === 'm' || cons === 'l' || cons === 'b' ? 0.5 : 0) : Math.min(1, (u - tc) / 0.1) * Math.min(1, (1 - u) / (s.tenue ? 0.12 : 0.2));
      // l'intonation, gaie : la phrase ondule autour de sa hauteur (jamais une descente vers le grave), les syllabes
      // accentuées sautent vers l'aigu, et une phrase sur deux finit en s'exclamant (elle monte)
      const up = (s.t + dans - s.debutPhrase) / Math.max(0.2, s.finPhrase - s.debutPhrase);
      let hauteur = f0 * (1.04 + 0.06 * Math.sin(2 * Math.PI * up) + s.accent * Math.sin(Math.PI * u));
      if (s.exclame && up > 0.7) hauteur *= 1 + (up - 0.7) * 0.9;
      if (rire) hauteur = f0 * (1.5 - 0.22 * (s.t / duree)) * (1 + 0.1 * Math.sin(Math.PI * u));   // (un rire qui pétille, à peine descendant)
      if (o.heler) hauteur = s.tenue ? f0 * (1.3 + 0.3 * Math.min(1, u * 1.6) - 0.1 * Math.max(0, u - 0.75) * 4) : f0 * (1.35 + s.accent);
      if (o.cri && s.tenue) hauteur = f0 * (1.4 + 0.35 * Math.sin(Math.PI * Math.min(1, u * 1.2)));
      if ((i & 31) === 0) grain = 1 + (r() - 0.5) * 0.01;
      hauteur *= grain;
      phase += hauteur / sr; if (phase >= 1) phase -= 1;
      const source = (2 * phase - 1) * 0.6 + (r() * 2 - 1) * souffle * (rire ? 3 : 1);
      lp += (source - lp) * 0.85;   // (une source claire)
      if ((i & 31) === 0) {
        const cible = VOYELLES[s.v];
        for (let j = 0; j < 3; j++) {
          F[j] += (cible[j] * k - F[j]) * 0.22;
          const w = 2 * Math.PI * Math.min(F[j], sr * 0.45) / sr, rr = Math.exp(-Math.PI * largeurs[j] / sr);
          res[j].a1 = -2 * rr * Math.cos(w); res[j].a2 = rr * rr; res[j].b = (1 - rr * rr) * poids[j];
        }
      }
      let y = 0;
      for (const q of res) { const v = q.b * lp * voise - q.a1 * q.y1 - q.a2 * q.y2; q.y2 = q.y1; q.y1 = v; y += v; }
      let c = 0;
      if (u < tc) {
        bruitLp += ((r() * 2 - 1) - bruitLp) * (cons === 's' ? 0.9 : 0.5);
        const e = cons === 'h' || cons === 's' ? Math.sin(Math.PI * u / tc) : (u < tc * 0.25 ? 1 : 0.15);
        c = (cons === 's' ? (r() * 2 - 1) - bruitLp : bruitLp) * e * (cons === 'h' ? 0.45 : 0.25);
      }
      x[n0 + i] += (y * 3.2 + c) * niveau;
    }
  }
  // De la clarté : on ajoute au son sa part au-dessus de 1 500 Hz (la « présence » des voix : les consonnes, le timbre)
  function eclaircir(x, sr, part) {
    const h = Float32Array.from(x); filtrer(h, 'highpass', 1200, 0.7, sr);
    for (let i = 0; i < x.length; i++) x[i] += h[i] * part;
  }
  // Le fond : `nVoix` voix qui bavardent chacune à son rythme, un peu adoucies par la distance (mais claires), en plein
  // air (peu de réverbération), et un léger souffle d'air. Rendu à la moitié de la fréquence du jeu.
  function fondFoule(sr, o = {}) {
    const r = alea(o.graine || 3), duree = o.duree || 8, nVoix = o.nVoix || 14, x = new Float32Array(Math.ceil(duree * sr)), y = new Float32Array(x.length);
    for (let v = 0; v < nVoix; v++) {
      const type = r(), femme = type < 0.45, enfant = type > 0.86;
      const t0 = entre(r, -1, 0.4);
      y.fill(0);
      voix(y, sr, Math.max(0, t0), duree - t0 + 1, r, { f0: enfant ? entre(r, 290, 370) : femme ? entre(r, 205, 270) : entre(r, 125, 165), k: enfant ? 1.3 : femme ? 1.15 : 1, debit: entre(r, 6.2, 8.2), souffle: 0.06, niveau: entre(r, 0.45, 1) * (o.proche ? 0.1 : 0.08) });
      filtrer(y, 'lowpass', entre(r, 2800, o.proche ? 5000 : 4000), 0.7, sr);
      filtrer(y, 'highpass', 230, 0.7, sr);
      for (let i = 0; i < x.length; i++) x[i] += y[i];
    }
    // l'air du matin : un souffle très léger, clair (pas de rumeur grave)
    const b = new Float32Array(x.length); for (let i = 0; i < b.length; i++) b[i] = r() * 2 - 1;
    filtrer(b, 'bandpass', 2200, 0.5, sr);
    for (let i = 0; i < x.length; i++) x[i] += b[i] * 0.006;
    eclaircir(x, sr, 2.2);
    return reverbe(x, sr, { taille: o.place ? 0.5 : 0.35, amorti: 0.6, mix: o.place ? 0.2 : 0.13, predelai: 0.015 });
  }
  // Un éclat tout près : 'rire', 'rires' (deux ou trois qui rient ensemble), 'heler' (un marchand), 'enfantRit',
  // 'enfantCrie', 'causerie' (deux voisins), 'pieces' (une poignée qu'on compte), 'moineaux' (dans l'arbre de la place)
  function eclatFoule(sr, quoi, o = {}) {
    const r = alea(o.graine || 9), x = new Float32Array(Math.ceil((quoi === 'causerie' ? 3.2 : 2.2) * sr)), homme = r() < 0.5;
    const rire = (t, h) => voix(x, sr, t, entre(r, 0.7, 1.1), r, h ? { f0: entre(r, 135, 165), k: 1, rire: 'ha', souffle: 0.1, niveau: 0.3 } : { f0: entre(r, 225, 270), k: 1.15, rire: 'ha', souffle: 0.1, niveau: 0.28 });
    if (quoi === 'rire') rire(0.05, homme);
    else if (quoi === 'rires') { rire(0.05, homme); rire(entre(r, 0.15, 0.3), !homme); if (r() < 0.6) rire(entre(r, 0.3, 0.5), r() < 0.5); }
    else if (quoi === 'heler') voix(x, sr, 0.05, entre(r, 1.2, 1.6), r, { f0: homme ? entre(r, 140, 170) : entre(r, 230, 270), k: homme ? 1 : 1.15, debit: 6, heler: true, souffle: 0.05, niveau: 0.36 });
    else if (quoi === 'enfantRit') voix(x, sr, 0.05, entre(r, 0.6, 0.9), r, { f0: entre(r, 300, 360), k: 1.3, rire: 'hi', souffle: 0.1, niveau: 0.26 });
    else if (quoi === 'enfantCrie') voix(x, sr, 0.05, entre(r, 0.7, 1), r, { f0: entre(r, 310, 370), k: 1.3, debit: 8, cri: true, souffle: 0.06, niveau: 0.27 });
    else if (quoi === 'causerie') {
      voix(x, sr, 0.05, 1.3, r, { f0: entre(r, 130, 160), k: 1, debit: 7.2, niveau: 0.22 });
      voix(x, sr, 1.45, 1.4, r, { f0: entre(r, 215, 255), k: 1.15, debit: 7.6, niveau: 0.2 });
      if (r() < 0.6) rire(2.55, homme);
    } else if (quoi === 'moineaux') {
      for (let k = 0, t = 0.05; k < 7; k++, t += entre(r, 0.08, 0.2)) { const f = entre(r, 3800, 5200), d = entre(r, 0.03, 0.06); const n1 = Math.floor(t * sr), n2 = Math.floor(d * sr); let ph = 0; for (let i = 0; i < n2 && n1 + i < x.length; i++) { const u = i / n2; ph += 2 * Math.PI * f * (1 + 0.25 * Math.sin(Math.PI * u) - 0.15 * u) / sr; x[n1 + i] += Math.sin(ph) * 0.05 * Math.sin(Math.PI * u); } }
    } else {
      for (let k = 0, t = 0.05; k < 5; k++, t += entre(r, 0.07, 0.16)) { const f = entre(r, 2300, 3100); mode(x, sr, t, f, 0.16, 0.25); mode(x, sr, t, f * 1.52, 0.07, 0.15); mode(x, sr, t, f * 2.7, 0.04, 0.1); }
    }
    filtrer(x, 'highpass', 170, 0.7, sr);
    if (quoi !== 'moineaux' && quoi !== 'pieces') eclaircir(x, sr, 1.8);
    return fondus(reverbe(x, sr, { taille: 0.35, amorti: 0.55, mix: 0.12 }), sr, 0.005, 0.15);
  }
  // Les deux variantes : les éclats, leur fréquence (en secondes entre deux), le nombre de voix du fond
  const ECLATS_FOULE = {
    // C. Le marché du matin : quatorze voix qui bavardent, les marchands qui hèlent, des rires, un enfant, les moineaux
    C: { quoi: ['heler', 'rire', 'heler', 'enfantRit', 'pieces', 'rires', 'heler', 'causerie', 'moineaux', 'enfantCrie'], ecart: [0.9, 2.2], nVoix: 14, proche: false, place: false, niveauFond: 1, niveauEclats: 0.8 },
    // D. Jour de grand marché : vingt voix plus proches, renvoyées par les façades, des rires en groupe, des enfants qui jouent
    D: { quoi: ['rires', 'enfantCrie', 'heler', 'rire', 'enfantRit', 'causerie', 'heler', 'rires', 'enfantRit', 'pieces'], ecart: [0.7, 1.8], nVoix: 20, proche: true, place: true, niveauFond: 1.1, niveauEclats: 0.72 },
  };
  // La foule entière, d'un seul tenant (pour la page d'écoute) : le fond, des éclats au hasard par-dessus
  function foule(variante, sr, o = {}) {
    const V = ECLATS_FOULE[variante], r = alea(o.graine || 17), duree = o.duree || 16;
    const fond = surechantillonner(fondFoule(sr / 2, { duree, nVoix: V.nVoix, proche: V.proche, place: V.place, graine: (o.graine || 17) + 1 }), 2);
    const x = new Float32Array(Math.ceil(duree * sr));
    for (let i = 0; i < x.length; i++) x[i] = (fond[i] || 0) * V.niveauFond;
    let t = entre(r, 0.4, 1.2), k = Math.floor(r() * V.quoi.length);
    while (t < duree - 1.5) {
      const e = eclatFoule(sr, V.quoi[k++ % V.quoi.length], { graine: Math.floor(r() * 1e6) }), g = V.niveauEclats * entre(r, 0.55, 1), n0 = Math.floor(t * sr);
      for (let i = 0; i < e.length && n0 + i < x.length; i++) x[n0 + i] += e[i] * g;
      t += entre(r, V.ecart[0], V.ecart[1]);
    }
    return niveler(fondus(x, sr, 0.8, 1), NIVEAUX.foule);
  }

  return { NIVEAUX, alea, mode, coefs, filtrer, choc, reverbe, niveler, surechantillonner, fondus, voix, marteauA, marteauB, clocheA, clocheB, fondFoule, eclatFoule, foule, ECLATS_FOULE };
})();

// --- Dans le jeu : les tampons, faits une fois, et les points d'accroche ---
if (typeof Son !== 'undefined') Object.assign(Son, {
  tamponsRefaits: {},
  // Le tampon de ce son refait (fabriqué à la première demande, puis gardé)
  tamponRefait(cle, fabriquer) {
    if (this.tamponsRefaits[cle]) return this.tamponsRefaits[cle];
    const sr = this.ctx.sampleRate, x = fabriquer(sr), b = this.ctx.createBuffer(1, x.length, sr);
    b.getChannelData(0).set(x);
    return (this.tamponsRefaits[cle] = b);
  },
  lireTampon(buf, t, bus, volume = 1) {
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    const g = this.ctx.createGain(); g.gain.value = volume;
    src.connect(g); g.connect(bus); src.start(t);
    src.onended = () => { try { src.disconnect(); g.disconnect(); } catch (e) { /* (déjà débranché) */ } };
    return { src, g };
  },
  // (en attente du choix du joueur) La foule du marché en fond, sans boucle qu'on entende : trois fonds de 8 s,
  // fabriqués une fois, qui s'enchaînent en fondu, chacun repris à un endroit tiré au sort, et des éclats proches
  // (un rire, un marchand, un enfant...) lâchés au hasard par-dessus. allumer = false : elle s'éteint en fondu.
  fouleMarche(allumer, variante = SONS_A_CHOISIR.foule) {
    if (!this.pret) return;
    if (!allumer) {
      clearTimeout(this.fouleMinuterie); clearTimeout(this.fouleEclats);
      if (this.fouleBus) { const b = this.fouleBus, t = this.ctx.currentTime; b.gain.cancelScheduledValues(t); b.gain.setValueAtTime(b.gain.value, t); b.gain.linearRampToValueAtTime(0, t + 1.2); setTimeout(() => b.disconnect(), 1500); }
      this.fouleBus = null;
      return;
    }
    if (this.fouleBus) return;
    const V = FabriqueSons.ECLATS_FOULE[variante] || FabriqueSons.ECLATS_FOULE.C, ctx = this.ctx, bus = this.fouleBus = ctx.createGain();
    bus.gain.setValueAtTime(0, ctx.currentTime); bus.gain.linearRampToValueAtTime(1, ctx.currentTime + 2.5); bus.connect(this.busSons);
    const fond = i => this.tamponRefait(`foule${variante}fond${i}`, sr => {
      const y = FabriqueSons.fondFoule(sr / 2, { duree: 8, nVoix: V.nVoix, proche: V.proche, place: V.place, graine: 101 + i * 13 });
      return FabriqueSons.surechantillonner(FabriqueSons.niveler(y, FabriqueSons.NIVEAUX.fondFoule), 2);
    });
    let dernier = -1;
    const enchainer = () => {
      if (this.fouleBus !== bus) return;
      let i = Math.floor(Math.random() * 3); if (i === dernier) i = (i + 1) % 3; dernier = i;
      const buf = fond(i), debut = Math.random() * (buf.duration - 5), d = Math.min(buf.duration - debut, 4 + Math.random() * 2.5), t = ctx.currentTime + 0.05;
      const src = ctx.createBufferSource(); src.buffer = buf; src.playbackRate.value = 0.97 + Math.random() * 0.06;
      const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(V.niveauFond, t + 1.5); g.gain.setValueAtTime(V.niveauFond, t + d - 1.5); g.gain.linearRampToValueAtTime(0, t + d);
      src.connect(g); g.connect(bus); src.start(t, debut, d + 0.1); src.onended = () => { try { src.disconnect(); g.disconnect(); } catch (e) { /* (rien) */ } };
      this.fouleMinuterie = setTimeout(enchainer, (d - 1.5) * 1000);   // (le suivant entre pendant que celui-ci s'éteint)
    };
    const eclat = () => {
      if (this.fouleBus !== bus) return;
      if (ctx.state === 'running') {
        const k = Math.floor(Math.random() * V.quoi.length), quoi = V.quoi[k];
        const buf = this.tamponRefait(`foule${variante}eclat${k}`, sr => FabriqueSons.niveler(FabriqueSons.eclatFoule(sr, quoi, { graine: 500 + k * 7 }), FabriqueSons.NIVEAUX.eclatFoule));
        this.lireTampon(buf, ctx.currentTime + 0.02, bus, V.niveauEclats * (0.5 + Math.random() * 0.5));
      }
      this.fouleEclats = setTimeout(eclat, (V.ecart[0] + Math.random() * (V.ecart[1] - V.ecart[0])) * 1000);
    };
    enchainer();
    this.fouleEclats = setTimeout(eclat, 1500 + Math.random() * 2000);
  },
});

// Les six sons, au format de SONS (pour Son.jouer). o.matiere pour le marteau ('bois' ou 'metal')
if (typeof SONS !== 'undefined') {
  for (const v of ['C', 'D']) SONS['foule' + v] = function (t, bus, o = {}) { const d = o.duree || 6; this.lireTampon(this.tamponRefait('foule' + v + d, sr => FabriqueSons.foule(v, sr, { duree: d })), t, bus); };
  for (const v of ['A', 'B']) {
    SONS['marteau' + v] = function (t, bus, o = {}) { const m = o.matiere === 'metal' ? 'metal' : 'bois', d = o.duree || 2.4, g = o.graine || 0; this.lireTampon(this.tamponRefait(`marteau${v}${m}${d}g${g}`, sr => FabriqueSons['marteau' + v](sr, { matiere: m, duree: d, graine: g || undefined })), t, bus); };
    SONS['cloche' + v] = function (t, bus, o = {}) { this.lireTampon(this.tamponRefait('cloche' + v + (o.coups || ''), sr => FabriqueSons['cloche' + v](sr, { coups: o.coups })), t, bus); };
  }
}

// Le point d'accroche des trois sons refaits : renvoie vrai si le nouveau son a joué (le joueur a choisi et le
// drapeau est levé), faux sinon (on garde alors l'ancien son). quoi : 'marteau' (o.matiere : 'bois' ou 'metal' ; o.lieu :
// 'forge' pour la forge), 'cloche', 'foule'
// (o.scene : la foule de fond de cette scène, éteinte quand elle s'arrête ou passe en pause)
function sonAChoisir(quoi, o = {}) {
  if (!SONS_A_CHOISIR.actif || typeof Son === 'undefined' || !Son.pret) return false;
  let v = SONS_A_CHOISIR[quoi];
  if (v && typeof v === 'object') v = v[o.lieu === 'forge' ? 'forge' : 'atelier'];   // (le marteau : une variante pour la forge, une pour l'atelier)
  if (!v || (quoi !== 'foule' && !SONS[quoi + v])) return false;   // (pas encore choisi : l'ancien son, ou rien)
  if (quoi === 'foule' && o.scene) {
    Son.fouleMarche(true, v);
    const eteindre = () => Son.fouleMarche(false);
    o.scene.events.once('shutdown', eteindre); o.scene.events.once('pause', eteindre); o.scene.events.once('sleep', eteindre);
    o.scene.events.once('resume', () => sonAChoisir('foule', o));
    return true;
  }
  Son.jouer(quoi + v, o);
  return true;
}

if (typeof module !== 'undefined' && module.exports) module.exports = { FabriqueSons, SONS_A_CHOISIR };
