// (02/11, Q336) Le livre des deux voies, en HD : le blason ciselé de la Confrérie, dont les rayons d'or s'allument un
// à un, et la fleur de pommier peinte des Bannis, qui s'ouvre pétale après pétale. Le nombre de rayons allumés et de
// pétales ouverts suit le regard de chaque camp (regardDe, degres.js) ; on ne voit jamais de chiffre.
// Moteur : ToileHD (portraitsHD.js), une texture par pièce (le blason, un rayon, un pétale, le bouton, le cœur de la
// fleur, la branche, le médaillon de nuit), assemblées et animées dans la page (poserBlasonConfrerie, poserFleurBannis).

const BLASON_L = 56, BLASON_H = 66;
function dansBlason(x, y, m = 0) {
  const X = x + 0.5, Y = y + 0.5, haut = 1 + m, bas = BLASON_H - 1 - m * 1.25, demi = BLASON_L / 2 - 1 - m, y0 = 32;
  if (Y < haut || Y > bas) return false;
  let w = demi;
  if (Y > y0) { const u = (Y - y0) / (bas - y0); w = demi * Math.pow(Math.max(0, 1 - Math.pow(u, 1.6)), 0.62); }
  // les deux petites encoches du chef, à la mode des écus de tournoi
  if (Y < haut + 3 && Math.abs(Math.abs(X - BLASON_L / 2) - demi * 0.5) < 2.2 && m < 1) return false;
  return Math.abs(X - BLASON_L / 2) <= w;
}

function rampesLivreDeuxVoies(t, terni) {
  const R = t.rampes;
  R.orC = rampe(terni ? 0x8a7a52 : 0xe2b434); R.orF = rampe(terni ? 0x6a5a3a : 0xb8861f);
  R.argentC = rampe(terni ? 0x8a8a90 : 0xd4d8e2); R.azur = rampe(terni ? 0x4a5060 : 0x2a4c96);
  R.pierreB = rampe(terni ? 0xa8a49c : 0xeeeae0); R.porte = rampe(0x2a1c14);
  R.petaleB = [0xd8b8c0, 0xecd2d8, 0xf6e4e8, 0xfdf2f4, 0xfffafb, 0xffffff];
  R.petaleR = rampe(0xe090ac); R.bouton = rampe(0xd06a8c); R.sepale = rampe(0x5a8a3a); R.feuille = rampe(0x4a8a3a);
  R.etamine = rampe(0xf0c840); R.coeurF = rampe(0xa8b840); R.brindille = rampe(0x6a4a2e);
  R.nuit = rampe(0x2e2450); R.nuitF = rampe(0x1e1838); R.lune = rampe(0xece2c0); R.cercle = rampe(0x8a8aa0);
  R.fane = rampe(0x8a6a4a); R.faneF = rampe(0x5a4430);
}

// --- La Confrérie : le blason ---
function texturesBlasonConfrerie(scene) {
  for (const terni of [false, true]) {
    const cle = 'blasonConfrerieHD' + (terni ? '_terni' : '');
    if (scene.textures.exists(cle)) continue;
    const t = new ToileHD(BLASON_L, BLASON_H); rampesLivreDeuxVoies(t, terni);
    const cx = BLASON_L / 2;
    // la double bordure ciselée : l'or (avec ses entailles), un filet d'argent, puis le champ d'azur damassé
    t.forme('orC', (x, y) => dansBlason(x, y) && !dansBlason(x, y, 3) ? [(x + 0.5 - cx) / 26, (y - 30) / 34 - 0.15, 0.7] : null,
      { decalage: 0.3, motif: (x, y) => ((x + y) % 4 === 0 ? -0.9 : 0) + (hachage(x, y, 7) < 0.08 ? 0.8 : 0) });
    t.forme('argentC', (x, y) => dansBlason(x, y, 3) && !dansBlason(x, y, 4.4) ? [(x + 0.5 - cx) / 26, (y - 30) / 34, 0.7] : null, { decalage: 0.5, bord: false });
    t.forme('azur', (x, y) => dansBlason(x, y, 4.4) ? [(x + 0.5 - cx) / 30 * 0.5, (y - 30) / 40 * 0.5 - 0.1, 0.85] : null,
      { decalage: -0.1, bord: false, motif: (x, y) => { const d = Math.abs(((x - cx) * 0.9 + 40) % 9 - 4.5) + Math.abs((y + 40) % 9 - 4.5); return d < 1.2 ? 0.45 : (fbm(x * 0.2, y * 0.2, 31) - 0.5) * 0.6; } });
    // la tour du rempart, crénelée, ses pierres, sa porte cintrée et sa meurtrière
    const tour = (x, y) => {
      const X = x + 0.5, Y = y + 0.5;
      if (X >= 19 && X <= 37 && Y >= 30 && Y <= 54) return true;
      if (Y >= 25 && Y < 30 && X >= 17.5 && X <= 38.5) { const k = Math.floor((X - 17.5) / 3.5); return k % 2 === 0; }
      return false;
    };
    t.forme('pierreB', (x, y) => tour(x, y) ? [(x + 0.5 - cx) / 14, (y - 40) / 30 - 0.2, 0.8] : null,
      { decalage: 0.2, motif: (x, y) => { const rang = Math.floor((y - 30) / 4), joint = (y - 30) % 4 === 3 || (x + (rang % 2) * 3) % 6 === 0; return y >= 30 && joint ? -1.6 : 0; } });
    t.forme('porte', (x, y) => { const X = x + 0.5, Y = y + 0.5; return (X >= 24.5 && X <= 31.5 && Y >= 44 && Y <= 54) || Math.hypot(X - 28, Y - 44) <= 3.5 ? [0, -0.2, 0.9] : null; }, { decalage: -0.6, bord: false });
    t.forme('porte', (x, y) => { const X = x + 0.5, Y = y + 0.5; return X >= 27 && X <= 29 && Y >= 33 && Y <= 39 ? [0, 0, 1] : null; }, { decalage: -0.4, bord: false });
    // le petit soleil d'or, au chef, et ses rayons ciselés
    t.forme('orC', (x, y) => { const d = Math.hypot(x + 0.5 - cx, y + 0.5 - 15.5); return d <= 4.6 ? [(x + 0.5 - cx) / 6, (y + 0.5 - 15.5) / 6, 0.8] : null; }, { decalage: 0.6 });
    for (let k = 0; k < 12; k++) {
      const a = k * Math.PI / 6;
      for (let r = 5.8; r <= (k % 2 ? 7.6 : 9); r += 0.5) t.poser(Math.round(cx - 0.5 + Math.cos(a) * r), Math.round(15 + Math.sin(a) * r), 'orC', k % 2 ? 3 : 4);
    }
    // l'usure du blason terni : une fêlure en travers
    if (terni) for (let j = 0; j < 30; j++) { const x = Math.round(14 + j * 0.9 + Math.sin(j * 0.7) * 1.5), y = Math.round(12 + j * 1.4); if (dansBlason(x, y, 4.4)) t.poser(x, y, 'porte', 1); }
    t.contour();
    t.texture(scene, cle);
  }
  // un rayon d'or (allumé) et son double éteint
  for (const allume of [true, false]) {
    const cle = 'rayonConfrerieHD' + (allume ? '' : '_eteint');
    if (scene.textures.exists(cle)) continue;
    const t = new ToileHD(12, 20); rampesLivreDeuxVoies(t, !allume);
    t.forme('orC', (x, y) => { const v = (19 - y) / 19, w = 5.2 * (1 - v) + 0.4; return Math.abs(x + 0.5 - 6) <= w && y <= 19 ? [(x + 0.5 - 6) / 6, -0.2, 0.8] : null; }, { decalage: allume ? 0.5 : -0.3 });
    for (let y = 2; y < 18; y++) t.poser(5, y, 'orC', allume ? 5 : 3);
    t.contour();
    t.texture(scene, cle);
  }
}

// Le blason posé dans la page : `n` le niveau du regard (−2 à 4) ; les rayons allumés s'animent un par un
function poserBlasonConfrerie(scene, c, x, y, n, { anime = true } = {}) {
  texturesBlasonConfrerie(scene);
  const objets = [], allumes = Math.max(0, n) * 2;
  if (n >= 3 && typeof lumiere === 'function') { const h = lumiere(scene, x, y, n >= 4 ? 70 : 52, 0xffd870, 0.32); c.add(h); objets.push(h); }
  for (let k = 0; k < 8; k++) {
    const a = -Math.PI / 2 + k * Math.PI / 4, on = k < allumes;
    const r = scene.add.image(x + Math.cos(a) * 37, y + Math.sin(a) * 37, on ? 'rayonConfrerieHD' : 'rayonConfrerieHD_eteint').setRotation(a + Math.PI / 2).setAlpha(on ? 1 : 0.4);
    c.add(r); objets.push(r);
    if (on && anime) {
      r.setAlpha(0).setScale(0.6);
      scene.tweens.add({ targets: r, alpha: 1, scale: 1, delay: 300 + k * 160, duration: 260, ease: 'Back.easeOut' });
      // l'éclat qui court sur le rayon quand il s'allume
      const e = scene.add.image(r.x, r.y, 'rayonConfrerieHD').setRotation(r.rotation).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
      c.add(e); objets.push(e);
      scene.tweens.add({ targets: e, alpha: { from: 0.9, to: 0 }, delay: 420 + k * 160, duration: 420 });
    }
  }
  const b = scene.add.image(x, y, n < 0 ? 'blasonConfrerieHD_terni' : 'blasonConfrerieHD').setAlpha(n < 0 ? 0.85 : 1);
  c.add(b); objets.push(b);
  // le blason qui brille : un reflet qui passe, de temps en temps, quand la Confrérie te tient en estime
  if (n >= 2) {
    const reflet = scene.add.image(x, y, 'blasonConfrerieHD').setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
    c.add(reflet); objets.push(reflet);
    scene.tweens.add({ targets: reflet, alpha: { from: 0, to: 0.28 }, duration: 700, yoyo: true, repeat: -1, repeatDelay: 1800, delay: 600 + allumes * 160 });
  }
  return objets;
}

// --- Les Bannis : la fleur de pommier ---
function texturesFleurBannis(scene) {
  if (scene.textures.exists('medaillonBannisHD')) return;
  // le médaillon de nuit : un disque violet sombre, ses étoiles, le croissant de lune, un cercle d'argent terni
  let t = new ToileHD(80, 80); rampesLivreDeuxVoies(t, false);
  t.forme('cercle', (x, y) => { const d = Math.hypot(x + 0.5 - 40, y + 0.5 - 40); return d <= 38 && d > 35 ? [(x + 0.5 - 40) / 40, (y + 0.5 - 40) / 40, 0.6] : null; }, { decalage: 0.1 });
  t.forme('nuit', (x, y) => { const d = Math.hypot(x + 0.5 - 40, y + 0.5 - 40); return d <= 35 ? [(x + 0.5 - 40) / 70, (y + 0.5 - 40) / 70, 0.9] : null; },
    { decalage: -0.5, bord: false, motif: (x, y) => (fbm(x * 0.12, y * 0.12, 77) - 0.5) * 1.4 });
  for (let k = 0; k < 18; k++) { const x = Math.round(12 + hachage(k, 1, 41) * 56), y = Math.round(10 + hachage(k, 2, 41) * 40); if (Math.hypot(x - 40, y - 40) < 33) t.poser(x, y, 'lune', hachage(k, 3, 41) > 0.6 ? 5 : 3); }
  t.forme('lune', (x, y) => { const X = x + 0.5, Y = y + 0.5; return Math.hypot(X - 20, Y - 20) <= 8 && Math.hypot(X - 24, Y - 17) > 7 ? [(X - 20) / 9, (Y - 20) / 9, 0.7] : null; }, { decalage: 0.4 });
  t.contour(); t.texture(scene, 'medaillonBannisHD');
  // la branche : une brindille et deux feuilles
  t = new ToileHD(64, 40); rampesLivreDeuxVoies(t, false);
  for (let j = 0; j <= 60; j++) { const X = 2 + j * 0.85, Y = 36 - j * 0.42 + Math.sin(j * 0.15) * 1.5; for (let e = -1; e <= 1; e++) t.poser(Math.round(X), Math.round(Y + e), 'brindille', e < 0 ? 4 : e > 0 ? 1 : 3); }
  const feuille = (fx, fy, ang, lg) => (x, y) => { const dx = x + 0.5 - fx, dy = y + 0.5 - fy, u = dx * Math.cos(ang) + dy * Math.sin(ang), v = -dx * Math.sin(ang) + dy * Math.cos(ang);
    if (u < 0 || u > lg) return null; const w = Math.sin(Math.PI * u / lg) * lg * 0.32; return Math.abs(v) <= w ? [v / (w + 1) * 0.7, -0.3, 0.7] : null; };
  t.forme('feuille', feuille(18, 30, -2.2, 17), { decalage: 0.1, motif: (x, y) => (Math.abs((x - 12) * 0.6 + (y - 24)) < 0.8 ? -0.8 : 0) });
  t.forme('feuille', feuille(36, 26, 0.9, 15), { decalage: 0.2 });
  t.contour(); t.texture(scene, 'brancheBannisHD');
  // un pétale (la pointe vers le haut, la base en bas) : blanc, le bord rose, des nervures fines
  for (const fane of [false, true]) {
    t = new ToileHD(22, 26); rampesLivreDeuxVoies(t, false);
    const dedans = (x, y) => { const v = (25.5 - (y + 0.5)) / 25, u = (x + 0.5 - 11) / 11; if (v < 0 || v > 1) return null;
      const w = Math.sin(Math.PI * Math.pow(v, 0.75)) * 0.98 + 0.05 * (1 - v); const enc = v > 0.9 && Math.abs(u) < 0.12; return Math.abs(u) <= w && !enc ? [u * 0.7, (0.5 - v) * 0.5, 0.75] : null; };
    t.forme(fane ? 'fane' : 'petaleB', dedans, { decalage: 0.6, motif: (x, y) => { const v = (25.5 - y) / 25, u = (x - 10.5) / 11; return Math.abs(u) > Math.sin(Math.PI * Math.pow(Math.max(0, v), 0.75)) * 0.62 || v > 0.86 ? -1.7 : 0; } });
    if (!fane) {
      for (let y = 5; y < 26; y++) { const v = (25.5 - y) / 25; const w = Math.sin(Math.PI * Math.pow(v, 0.75)) * 0.62; for (const s of [-1, 1]) { const x = Math.round(10.5 + s * w * 11); if (t.mat(x, y) === 'petaleB') t.poser(x, y, 'petaleR', 3); } }
      for (const d of [-3, 0, 3]) for (let y = 12; y < 24; y++) { const x = Math.round(10.5 + d * (24 - y) / 12); if (t.mat(x, y)) t.poser(x, y, 'petaleB', 1); }
      for (let x = 8; x <= 13; x++) for (let y = 23; y <= 25; y++) if (t.mat(x, y)) t.poser(x, y, 'coeurF', 3);
    }
    t.contour(); t.texture(scene, fane ? 'petaleBannisHD_fane' : 'petaleBannisHD');
  }
  // le bouton fermé (rose foncé, ses sépales verts) et le cœur de la fleur (ses étamines)
  t = new ToileHD(20, 22); rampesLivreDeuxVoies(t, false);
  t.forme('bouton', (x, y) => { const X = x + 0.5, Y = y + 0.5; const w = 7.5 * Math.sin(Math.PI * Math.min(1, (Y - 1) / 17)); return Y > 1 && Y < 18 && Math.abs(X - 10) <= w * (Y < 9 ? Math.pow((Y - 1) / 8, 0.6) : 1) ? [(X - 10) / 9, (Y - 9) / 14, 0.75] : null; },
    { decalage: 0.2, motif: (x, y) => (Math.abs(x - 9.5 - (y - 9) * 0.25) < 0.6 || Math.abs(x - 12.5 + (y - 9) * 0.3) < 0.6 ? -1 : 0) });
  t.forme('sepale', (x, y) => { const X = x + 0.5, Y = y + 0.5; return Y >= 15 && Y <= 21 && Math.abs(X - 10) <= (21 - Y) * 0.9 + 1 && (Y > 18 || Math.abs((X - 10) % 4) < 1.6) ? [(X - 10) / 8, 0, 0.8] : null; }, { decalage: 0 });
  t.contour(); t.texture(scene, 'boutonBannisHD');
  t = new ToileHD(16, 16); rampesLivreDeuxVoies(t, false);
  t.forme('coeurF', (x, y) => Math.hypot(x + 0.5 - 8, y + 0.5 - 8) <= 3.2 ? [(x + 0.5 - 8) / 4, (y + 0.5 - 8) / 4, 0.7] : null, { decalage: 0.2 });
  for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5, r = 5.4 + (k % 2) * 1.2; t.forme('etamine', (x, y) => Math.hypot(x + 0.5 - 8 - Math.cos(a) * r, y + 0.5 - 8 - Math.sin(a) * r) <= 1.3 ? [Math.cos(a) * 0.5, Math.sin(a) * 0.5, 0.7] : null, { decalage: 0.6 }); }
  t.contour(); t.texture(scene, 'coeurBannisHD');
}

// La fleur posée dans la page : `n` le niveau du regard des Bannis (−2 à 4). 0 : un bouton fermé ; de 1 à 4 :
// une, deux, trois, puis cinq pétales qui s'ouvrent l'un après l'autre ; en dessous de 0, la fleur se fane.
function poserFleurBannis(scene, c, x, y, n, { anime = true } = {}) {
  texturesFleurBannis(scene);
  const objets = [];
  const ajouter = o => { c.add(o); objets.push(o); return o; };
  ajouter(scene.add.image(x, y, 'medaillonBannisHD').setAlpha(n < 0 ? 0.75 : 1));
  ajouter(scene.add.image(x - 6, y + 12, 'brancheBannisHD').setAlpha(n < 0 ? 0.7 : 1));
  const fx = x + 6, fy = y + 2;
  const ouverts = n <= 0 ? 0 : n >= 4 ? 5 : n === 3 ? 4 : n === 2 ? 3 : 1;
  if (n < 0) {
    // fanée : deux pétales brunis qui tombent, le bouton éteint
    for (const [a, dx, dy] of [[2.6, -4, 8], [3.6, 6, 10]]) ajouter(scene.add.image(fx + dx, fy + dy, 'petaleBannisHD_fane').setRotation(a).setScale(0.8).setOrigin(0.5, 1).setAlpha(n === -1 ? 0.9 : 0.7));
    ajouter(scene.add.image(fx, fy, 'boutonBannisHD').setTint(0x8a7a7a).setAlpha(0.8));
    return objets;
  }
  if (n >= 3 && typeof lumiere === 'function') ajouter(lumiere(scene, fx, fy, n >= 4 ? 52 : 40, 0xffd0e0, 0.22));
  for (let k = 0; k < ouverts; k++) {
    const a = -Math.PI / 2 + k * (2 * Math.PI / 5);
    const p = ajouter(scene.add.image(fx, fy, 'petaleBannisHD').setOrigin(0.5, 0.96).setRotation(a + Math.PI / 2).setScale(1.3));
    if (anime) {
      p.setScale(0.2, 0.4).setAlpha(0);
      scene.tweens.add({ targets: p, scaleX: 1.3, scaleY: 1.3, alpha: 1, delay: 350 + k * 260, duration: 420, ease: 'Back.easeOut' });
    }
  }
  if (ouverts < 5) ajouter(scene.add.image(fx, fy - (ouverts ? 1 : 2), 'boutonBannisHD').setScale(ouverts ? 0.85 : 1.25));
  if (ouverts) {
    const coeur = ajouter(scene.add.image(fx, fy, 'coeurBannisHD').setScale(1.2));
    if (anime) { coeur.setAlpha(0); scene.tweens.add({ targets: coeur, alpha: 1, delay: 350 + ouverts * 260, duration: 300 }); }
  }
  return objets;
}
