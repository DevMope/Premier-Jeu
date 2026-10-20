// (v1.32, planche 55 validée) La décoration au choix : quand toutes les améliorations du shop sont faites, Maîtresse
// Ysaline Bellecroix, la tapissière, passe à l'arrière-boutique avec son carnet d'échantillons (1 500 p., une fois pour
// toutes). Ensuite, chaque pièce du décor (les murs, les boiseries, le sol, le tapis, le tableau) prend le style qu'on
// veut : rustique (celui d'aujourd'hui), bourgeois, royal, ou celui de son camp (le Rempart, Nocturne, Sylvestre).
// Un style acheté se remet quand on veut, sans repayer.
const STYLES_DECO = {
  rustique: { nom: 'Rustique', teinte: 0xc8a47c, mur: 0xb89a72, motif: 'aucun', motifC: 0xb89a72, bois: 0x8a5a32, boisSombre: 0x5a3a22,
    sol: 'plancher', solC: 0x8a5a32, tapis: [0x7a2a22, 0x2a2a5a, 0xc9a227], cadre: 0x5a3418 },
  bourgeois: { nom: 'Bourgeois', teinte: 0xf0e4d4, mur: 0x3e6a4e, motif: 'rayures', motifC: 0xd8c8a0, bois: 0x6a3e22, boisSombre: 0x3a2214,
    sol: 'chevrons', solC: 0x8a5428, tapis: [0x2a3a7a, 0x8a2a22, 0xc9a227], cadre: 0x5a3418 },
  royal: { nom: 'Royal', teinte: 0xf4ece4, mur: 0x5e1a3c, motif: 'lys', motifC: 0xd0a830, bois: 0xdcd2ba, boisSombre: 0xb89030,
    sol: 'damier', solC: 0xdcd8d0, solC2: 0x2c2a32, tapis: [0x9a1a1a, 0xc9a227, 0x2a1a4a], cadre: 0xd0a830 },
  rempart: { nom: 'Le Rempart', camp: 'lumière', teinte: 0xf4f0ea, mur: 0x8aa8cc, motif: 'etoiles', motifC: 0xf4ecd0, bois: 0xc8a066, boisSombre: 0x8a6a3a,
    sol: 'faience', solC: 0x2a5aa0, solC2: 0xe8e4dc, tapis: [0xe0dccc, 0x2a4a8a, 0xc9a227], cadre: 0xe8e0c8 },
  nocturne: { nom: 'Nocturne', camp: 'ombre', teinte: 0xe8e4f0, mur: 0x2a1e34, motif: 'losanges', motifC: 0x9aa0b4, bois: 0x3a2c2c, boisSombre: 0x161214,
    sol: 'ardoise', solC: 0x40464e, tapis: [0x4a1a5a, 0xa8aec0, 0x1a1020], cadre: 0x8a90a0 },
  sylvestre: { nom: 'Sylvestre', camp: 'neutre', teinte: 0xf0ece0, mur: 0x5e6e3c, motif: 'feuilles', motifC: 0x9aac64, bois: 0xa8987a, boisSombre: 0x5e4e3a,
    sol: 'flotte', solC: 0xb0a084, tapis: [0x4a6a2a, 0x8a5a2a, 0xd8c890], cadre: 0x6a5a3a },
};
const LYS_DECO = ['..o..', '.ooo.', 'o.o.o', 'ooooo', '..o..', '.o.o.'];
const FEUILLE_DECO = ['..o', '.oo', 'ooo', 'oo.', 'o..'];

// Le mur d'une pièce, au style choisi : papier peint (ou velours) à motif, colombages et lambris dans son bois
function murDeco(s, cle, st, { l = 480, h = 220, poteaux = [272, 412], graine = 310, fenetre = null } = {}) {
  if (s.textures.exists(cle)) s.textures.remove(cle);
  const t = toileDecor(l, h);
  t.rampes.papier = rampe(st.mur); t.rampes.motif = rampe(st.motifC); t.rampes.chene = rampe(st.bois); t.rampes.cheneSombre = rampe(st.boisSombre);
  const haut = h - 46;
  for (let y = 0; y < haut; y++) for (let x = 0; x < l; x++) {
    let i = 3 + Math.round((fbm(x * 0.05, y * 0.05, graine) - 0.5) * 0.9), m = false;
    if (st.motif === 'rayures') { const u = x % 12; if (u < 2) { m = true; i = u ? 3 : 2; } else if (u === 6) { m = true; i = 1; } }
    else if (st.motif === 'lys') { const cx = Math.floor(x / 22), cy = Math.floor(y / 24), ox = (x % 22) - 8 - (cy % 2) * 0, oy = (y % 24) - 9;
      const lx = ((x + (cy % 2) * 11) % 22) - 8; if (oy >= 0 && oy < 6 && lx >= 0 && lx < 5 && LYS_DECO[oy][lx] === 'o') { m = true; i = oy < 2 ? 4 : 3; }
      if (((x + y) % 2 === 0) && fbm(x * 0.3, y * 0.08, graine + 3) > 0.6) i++;   // le velours qui accroche la lumière
    }
    else if (st.motif === 'etoiles') { const sx = (x + (Math.floor(y / 18) % 2) * 9) % 18 - 9, sy = y % 18 - 9;
      if ((sx === 0 && Math.abs(sy) <= 2) || (sy === 0 && Math.abs(sx) <= 2) || (Math.abs(sx) === 1 && Math.abs(sy) === 1)) { m = true; i = sx === 0 && sy === 0 ? 5 : 4; }
      if (y >= 12 && y < 20) { m = true; i = (Math.floor(x / 4) + y) % 2 ? 2 : 4; }   // la frise sous la poutre
    }
    else if (st.motif === 'losanges') { const a = (x + y) % 18, b = (x - y + 1800) % 18;
      if (a === 0 || b === 0) { m = true; i = 2; } if (a === 0 && b === 0) { m = true; i = 5; } }
    else if (st.motif === 'feuilles') { const fx = (x + (Math.floor(y / 16) % 2) * 10) % 20 - 8, fy = y % 16 - 5;
      if (fy >= 0 && fy < 5 && fx >= 0 && fx < 3 && FEUILLE_DECO[fy][fx] === 'o') { m = true; i = 3 + (fx === 2 ? 1 : 0); } }
    t.poser(x, y, m ? 'motif' : 'papier', i);
  }
  planche(t, 0, 0, l, 10, 'cheneSombre', { graine: graine + 1, noeuds: st.motif === 'lys' ? 0 : 4 });
  for (let x = 0; x < l; x++) t.poser(x, 10, 'papier', 1);
  for (const x of poteaux) { planche(t, x, 10, 9, h - 10, 'cheneSombre', { horizontale: false, graine: graine + x, noeuds: st.motif === 'lys' ? 0 : 2 }); for (let y = 11; y < h; y++) t.poser(x + 9, y, 'papier', 1); }
  for (let x = 0; x < l; x += 12) planche(t, x, haut, 12, 46, 'chene', { horizontale: false, graine: graine + 50 + x, noeuds: 0 });
  for (let x = 0; x < l; x++) {
    t.poser(x, haut - 1, 'papier', 1);
    for (let y = haut; y < haut + 4; y++) t.poser(x, y, 'cheneSombre', y === haut ? 5 : y === haut + 3 ? 1 : 3);
    for (let y = h - 5; y < h; y++) t.poser(x, y, 'cheneSombre', y === h - 5 ? 4 : 1);
  }
  if (st.motif === 'lys') for (let x = 0; x < l; x += 12) for (let y = haut + 10; y < h - 10; y++) { t.poser(x + 2, y, 'cheneSombre', 4); t.poser(x + 9, y, 'cheneSombre', 2); }   // les filets d'or du lambris
  if (fenetre) { const { x: fx, y: fy, l: fl, h: fh } = fenetre;
    for (let y = fy - 5; y < fy + fh + 5; y++) for (let x = fx - 5; x < fx + fl + 5; x++) {
      const dedans = x >= fx && x < fx + fl && y >= fy && y < fy + fh;
      if (dedans) { const croisee = Math.abs(x + 0.5 - (fx + fl / 2)) < 1.5 || Math.abs(y + 0.5 - (fy + fh / 2)) < 1.5;
        if (croisee) t.poser(x, y, 'chene', 3); else { t.c[y * l + x] = null; t.m[y * l + x] = null; } continue; }
      t.poser(x, y, 'chene', (x < fx || y < fy) ? 4 : 2);
    } }
  t.texture(s, cle); return cle;
}

// Le sol, au style choisi : rangées de plus en plus hautes vers le bas (la perspective)
function solDeco(s, cle, st, { l = 480, h = 50, graine = 410 } = {}) {
  if (s.textures.exists(cle)) s.textures.remove(cle);
  const t = toileDecor(l, h);
  t.rampes.sol = rampe(st.solC); t.rampes.sol2 = rampe(st.solC2 || st.solC); t.rampes.chene = rampe(st.solC);
  let y = 0, k = 0;
  while (y < h) {
    const hl = Math.min(h - y, 5 + k);
    for (let yy = y; yy < y + hl; yy++) for (let x = 0; x < l; x++) {
      const ly = yy - y; let mat = 'sol', i = 3;
      if (st.sol === 'chevrons') {
        const w = hl * 2, j = Math.floor((x + (k % 2) * hl) / w), u = (x + (k % 2) * hl) % w;
        const d = (j % 2 ? u + ly : u + (hl - 1 - ly)) % hl;
        i = 3 + (hachage(j, k, graine) < 0.33 ? -1 : hachage(j, k, graine) > 0.7 ? 1 : 0) + Math.round((fbm(x * 0.2, yy * 0.4, graine) - 0.5));
        if (d === 0) i = 1; if (u === 0) i = 0; if (ly === 0) i = Math.max(i, 4);
      } else if (st.sol === 'damier') {
        const cw = 24, c = Math.floor(x / cw);
        mat = (c + k) % 2 ? 'sol2' : 'sol';
        const v = fbm(x * 0.12 + c * 3, yy * 0.25, graine + c);
        i = 3 + (v > 0.66 ? (mat === 'sol' ? -1 : 1) : v < 0.3 ? 1 : 0);
        if (x % cw === 0 || ly === 0) i = mat === 'sol' ? 1 : 0; if (ly === 1) i = Math.min(5, i + 1);
      } else if (st.sol === 'faience') {
        const cw = 14, c = Math.floor(x / cw), u = x % cw;
        mat = (c + k) % 2 ? 'sol' : 'sol2'; i = 3;
        const cx = Math.abs(u - cw / 2), cy = Math.abs(ly - hl / 2);
        if (mat === 'sol2' && cx + cy < hl * 0.35) { mat = 'sol'; i = 4; }   // la petite fleur bleue au milieu des carreaux blancs
        if (u === 0 || ly === 0) { mat = 'sol2'; i = 1; }
      } else if (st.sol === 'ardoise') {
        const graineR = k * 31, bords = []; for (let bx = 0, n = 0; bx < l; n++) { bords.push(bx); bx += 18 + Math.floor(hachage(n, k, graine) * 26) + k * 2; }
        const c = bords.filter(b => b <= x).length - 1, joint = bords.includes(x);
        i = 2 + Math.round(fbm(x * 0.15, yy * 0.3, graine + c) * 2) + (hachage(c, k, graine + 5) > 0.6 ? 1 : 0);
        if (joint || ly === 0) i = 0;
      } else {   // le plancher (et le bois flotté, plus clair, plus gris)
        const dec = (k * 37) % 60, pas = 70 + (k % 3) * 10, u = (x + dec) % pas;
        i = 3 + Math.round((fbm(x * 0.03, ly * 0.22 + k, graine) - 0.5) * 2);
        if (u === 0) i = 0; if (ly === 0) i = Math.max(i, 4); if (ly === hl - 1) i = 1;
      }
      t.poser(x, yy, mat, Math.max(0, Math.min(5, i)));
    }
    y += hl; k++;
  }
  for (let x = 0; x < l; x++) { t.poser(x, 0, 'sol', 0); t.poser(x, 1, 'sol', 1); }
  t.texture(s, cle); return cle;
}

// Le tapis, au style choisi : rectangulaire, bordure, médaillon, franges
function tapisDeco(s, cle, st) {
  if (s.textures.exists(cle)) s.textures.remove(cle);
  const L = 180, H = 24, t = toileDecor(L, H);
  t.rampes.fond = rampe(st.tapis[0]); t.rampes.bord = rampe(st.tapis[1]); t.rampes.med = rampe(st.tapis[2]);
  for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) {
    if (x < 3 || x > L - 4) { if (y % 2 === 0) t.poser(x, y, 'bord', 4); continue; }
    const bord = Math.min(x - 3, y, L - 4 - x, H - 1 - y);
    const d = Math.hypot((x + 0.5 - L / 2) / 24, (y + 0.5 - H / 2) / 7);
    if (bord < 3) t.poser(x, y, 'bord', bord === 1 ? 4 : 2);
    else if (d < 1) t.poser(x, y, 'med', d < 0.45 ? 4 : d > 0.85 ? 2 : 3);
    else t.poser(x, y, 'fond', 3 + ((x * 2 + y) % 9 === 0 ? 1 : 0) + ((x + y * 3) % 13 === 0 ? -1 : 0));
  }
  t.contour(); t.texture(s, cle); return cle;
}

// Le tableau au mur, au style choisi (un cadre, et ce qu'il y a dedans)
function tableauDeco(s, x, y, st, prof = 3) {
  const c = s.add.container(x, y).setDepth(prof), w = 92, h = 64, g = s.add.graphics();
  const cadre = rampe(st.cadre || 0x5a3418);
  g.fillStyle(0x000000, 0.35).fillRect(-w / 2 + 4, -h / 2 + 5, w, h);
  g.fillStyle(cadre[1]).fillRect(-w / 2, -h / 2, w, h).fillStyle(cadre[4]).fillRect(-w / 2 + 2, -h / 2 + 2, w - 4, h - 4).fillStyle(cadre[2]).fillRect(-w / 2 + 5, -h / 2 + 5, w - 10, h - 10);
  c.add(g);
  if (st.camp === 'lumière' || st.camp === 'ombre') {
    const fond = s.add.rectangle(0, 0, w - 14, h - 14, st.camp === 'ombre' ? 0x2a1a34 : 0x2a4a8a); c.add(fond);
    const em = s.add.image(0, 0, 'embleme_' + (st.camp === 'ombre' ? 'bannis' : 'confrerie')); em.setScale((h - 22) / em.height); c.add(em);
  } else {
    const p = s.add.image(0, 0, paysageHD(s, 78, 50, st.camp === 'neutre' ? 'foret' : 'comte', 0)).setDisplaySize(w - 14, h - 14); c.add(p);
  }
  if (st.cadre === 0xd0a830) { const o = s.add.graphics(); for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) o.fillStyle(0xf8e08a).fillCircle(a * (w / 2 - 2), b * (h / 2 - 2), 4); c.add(o); }
  return c;
}

const DECO = {
  carnet: 1500,
  pieces: [['murs', 'Les murs'], ['bois', 'Les boiseries'], ['sol', 'Le sol'], ['tapis', 'Le tapis'], ['tableau', 'Le tableau']],
  prix: { rustique: 0, bourgeois: 400, camp: 800, royal: 1200 },
};
// La tapissière passe quand toutes les améliorations du shop sont au plus haut
function decoProposee(G) { return Object.keys(AMELIORATIONS).every(k => !ameliorationSuivante(G, k)); }
function decoDe(G) { return G.deco && G.deco.carnet ? G.deco : null; }
// Le style de son camp (la 4e colonne du carnet)
function styleDuCamp(G) { const p = typeof palierCamp === 'function' ? palierCamp(G) : 0; return p > 0 ? 'rempart' : p < 0 ? 'nocturne' : 'sylvestre'; }
function colonnesDeco(G) { return ['rustique', 'bourgeois', 'royal', styleDuCamp(G)]; }
function prixDeco(st) { return STYLES_DECO[st].camp ? DECO.prix.camp : DECO.prix[st]; }
function acheterCarnet(G) {
  if (decoDe(G) || G.argent < DECO.carnet) return false;
  payer(G, DECO.carnet, 'decoration');
  G.deco = { carnet: G.jour, achetes: {}, poses: { murs: 'rustique', bois: 'rustique', sol: 'rustique', tapis: 'rustique', tableau: null } };
  return true;
}
function decoAchete(G, piece, st) { const d = decoDe(G); return !!d && (st === 'rustique' || (d.achetes[piece] || []).includes(st)); }
// Poser un style (l'acheter d'abord s'il ne l'est pas). Renvoie le prix payé, ou -1 si l'argent manque
function poserDeco(G, piece, st) {
  const d = decoDe(G); if (!d) return -1;
  let paye = 0;
  if (!decoAchete(G, piece, st)) { paye = prixDeco(st); if (G.argent < paye) return -1; payer(G, paye, 'decoration'); (d.achetes[piece] = d.achetes[piece] || []).push(st); }
  d.poses[piece] = st;
  return paye;
}

// --- À l'arrière-boutique ---

// Les textures du décor posé (le mur mêle le papier d'un style et le bois d'un autre). null : le décor d'origine
function texturesDeco(s, G) {
  const d = decoDe(G); if (!d) return null;
  const P = d.poses, M = STYLES_DECO[P.murs], B = STYLES_DECO[P.bois];
  const r = { teinteMur: M.teinte, teinteSol: STYLES_DECO[P.sol].teinte };
  if (P.murs !== 'rustique' || P.bois !== 'rustique') {
    r.mur = 'decoMur_' + P.murs + '_' + P.bois;
    if (!s.textures.exists(r.mur)) murDeco(s, r.mur, { ...M, bois: B.bois, boisSombre: B.boisSombre }, { poteaux: [272, 412], graine: 310 });
  }
  if (P.sol !== 'rustique') { r.sol = 'decoSol_' + P.sol; if (!s.textures.exists(r.sol)) solDeco(s, r.sol, STYLES_DECO[P.sol]); }
  if (P.tapis !== 'rustique') { r.tapis = 'decoTapis_' + P.tapis; if (!s.textures.exists(r.tapis)) tapisDeco(s, r.tapis, STYLES_DECO[P.tapis]); }
  r.tableau = P.tableau;
  return r;
}

// La tapissière, le premier soir où tout est amélioré (puis le bouton du carnet l'appelle)
function visiteTapissiere(s, apres) {
  const G = s.G || window.GAME; G.decoVue = G.decoVue || G.jour;
  const objets = [], voile = s.add.rectangle(480, 270, 960, 540, 0x0a0604, 0.45).setDepth(90).setInteractive(); objets.push(voile);
  const fig = imageCorps(s, 380, 506, { race: 'humain', nom: 'Ysaline Bellecroix', feminin: true, costume: 'noble', habit: 0x6a2a5a, cheveux: 0x3a2418, niveau: 3 }, 6.4).setDepth(91); objets.push(fig);
  s.tweens.add({ targets: fig, y: 508, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  const g = s.add.graphics().setDepth(91); objets.push(g);
  [[0x3e6a4e, 0xd8c8a0], [0x5e1a3c, 0xd0a830], [0x8aa8cc, 0xf4ecd0], [0x2a1e34, 0x9aa0b4]].forEach(([c1, c2], i) => { const x = 452 + i * 16; g.fillStyle(c1).fillRoundedRect(x, 420 - i * 3, 13, 92 + i * 3, 5).fillStyle(c2).fillRect(x + 2, 430 - i * 3, 9, 2).fillRect(x + 2, 450 - i * 3, 9, 2).fillStyle(0x000000, 0.25).fillRect(x + 9, 420 - i * 3, 4, 92 + i * 3); });
  const bul = s.add.container(580, 290).setDepth(92), gb = s.add.graphics(); objets.push(bul);
  gb.fillStyle(0xfff8e8).fillRoundedRect(-170, -70, 340, 132, 12).lineStyle(3, 0x8a6a3a).strokeRoundedRect(-170, -70, 340, 132, 12).fillStyle(0xfff8e8).fillTriangle(-150, 62, -120, 62, -170, 92); bul.add(gb);
  bul.add(s.add.text(-156, -60, 'Maîtresse Ysaline Bellecroix, tapissière', style(11, '#6b4a2a', { fontStyle: 'bold italic' })));
  bul.add(s.add.text(-156, -40, `« Ton comptoir est le plus beau du village... mais tout le monde a le même ! Mon carnet d'échantillons : choisis tes murs, ton sol, tes tapis, à ton goût. ${DECO.carnet.toLocaleString('fr-FR')} pièces, et il est à toi pour toujours. »`, style(12, '#2a1608', { wordWrap: { width: 312 } })));
  const fermer = () => { for (const o of objets) { if (o.fond) { o.fond.destroy(); o.label.destroy(); } else if (o.active) o.destroy(); } };
  const assez = G.argent >= DECO.carnet;
  const b1 = creerBouton(s, 500, 400, 230, assez ? `Acheter le carnet (${DECO.carnet} p.)` : `Il te manque ${DECO.carnet - G.argent} p.`, () => {
    if (!acheterCarnet(G)) { Son.jouer('refus'); return; }
    Son.jouer('pieces'); gainEnDirect(s, 500, 370, `−${DECO.carnet} p.`, false);
    if (typeof noterJournal === 'function') noterJournal('carnet de la tapissière acheté');
    fermer(); if (apres) apres(true);
  });
  const b2 = creerBouton(s, 740, 400, 160, 'Plus tard', () => { fermer(); if (apres) apres(false); });
  for (const b of [b1, b2]) { b.fond.setDepth(93); b.label.setDepth(93.1); objets.push(b); }
}

// Le carnet d'échantillons : 5 pièces × 4 styles. Un clic pose un style acheté ; un style pas encore acheté demande confirmation
function carnetDeco(s, rafraichir) {
  const G = s.G || window.GAME, cols = colonnesDeco(G), objets = [];
  const vider = () => { for (const o of objets) { if (o.fond) { o.fond.destroy(); o.label.destroy(); } else if (o.active) o.destroy(); } objets.length = 0; };
  const voile = s.add.rectangle(480, 270, 960, 540, 0x0a0604, 0.55).setDepth(90).setInteractive();
  if (typeof creerEmblemesHD === 'function') creerEmblemesHD(s);
  // les échantillons (dessinés une fois)
  for (const k of cols) { const S = STYLES_DECO[k];
    if (!s.textures.exists('decoEchMur_' + k)) murDeco(s, 'decoEchMur_' + k, S, { l: 120, h: 220, poteaux: [], graine: 310 });
    if (!s.textures.exists('decoEchSol_' + k)) solDeco(s, 'decoEchSol_' + k, S, { l: 120 });
    if (!s.textures.exists('decoEchTapis_' + k)) tapisDeco(s, 'decoEchTapis_' + k, S); }
  const L = s.add.container(480, 262).setDepth(91);
  const dessiner = (question = null) => {
    vider(); L.removeAll(true);
    const d = decoDe(G);
    L.add(s.add.image(0, 0, panneauHD(s, 720, 480)).setScale(2));
    L.add(s.add.text(0, -218, "LE CARNET D'ÉCHANTILLONS", style(19, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5));
    L.add(s.add.text(0, -196, 'Chaque pièce à son style · un style acheté se remet quand tu veux, sans repayer', style(12, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5));
    const X0 = -140, PX = 150, Y0 = -146, PY = 64, g = s.add.graphics(); L.add(g);
    cols.forEach((k, j) => { const S = STYLES_DECO[k]; L.add(s.add.text(X0 + j * PX, Y0 - 22, S.nom + (S.camp === 'lumière' ? ' ☀' : S.camp === 'ombre' ? ' ☾' : ''), style(13, '#3b2410', { fontStyle: 'bold' })).setOrigin(0.5)); });
    DECO.pieces.forEach(([id, nom], i) => { const y = Y0 + 14 + i * PY;
      L.add(s.add.text(-330, y, nom, style(13, '#3b2410', { fontStyle: 'bold' })).setOrigin(0, 0.5));
      cols.forEach((k, j) => { const x = X0 + j * PX, S = STYLES_DECO[k], pose = d.poses[id] === k, achete = decoAchete(G, id, k);
        g.fillStyle(0x2a1608).fillRect(x - 57, y - 22, 114, 44);
        let im;
        if (id === 'murs') im = s.add.image(x, y, 'decoEchMur_' + k).setCrop(4, 30, 110, 40).setPosition(x - 59, y - 50).setOrigin(0);
        else if (id === 'bois') im = s.add.image(x, y, 'decoEchMur_' + k).setCrop(4, 176, 110, 40).setPosition(x - 59, y - 198).setOrigin(0);
        else if (id === 'sol') im = s.add.image(x, y, 'decoEchSol_' + k).setCrop(4, 6, 110, 40).setPosition(x - 59, y - 28).setOrigin(0);
        else if (id === 'tapis') im = s.add.image(x, y, k === 'rustique' ? tapisHD(s, niveauAmelioration(G, 'chambre')) : 'decoEchTapis_' + k).setScale(k === 'rustique' ? 0.75 : 0.6);
        else { im = tableauDeco(s, 0, 0, S, 0); im.setScale(0.55).setPosition(x, y); }
        L.add(im);
        if (pose) g.lineStyle(3, 0x2f8a2a).strokeRect(x - 58, y - 23, 116, 46);
        const prix = prixDeco(k);
        L.add(s.add.text(x, y + 25, pose ? '✓ posé' : achete ? 'acheté' : `${prix} p.`, style(11, pose ? '#2f7a2a' : achete ? '#5a3a1a' : G.argent >= prix ? '#3b2410' : '#a03020', { fontStyle: 'bold' })).setOrigin(0.5, 0));
        const zone = s.add.zone(480 + x, 262 + y, 114, 44).setInteractive({ useHandCursor: true }).setDepth(92); objets.push(zone);
        zone.on('pointerdown', () => {
          if (pose) return;
          if (achete) { poserDeco(G, id, k); Son.jouer('glisse'); if (rafraichir) rafraichir(); dessiner(); return; }
          if (G.argent < prix) { Son.jouer('refus'); gainEnDirect(s, 480 + x, 262 + y, `il manque ${prix - G.argent} p.`, false, { taille: 12 }); return; }
          dessiner([id, k, nom, prix]);
        });
      }); });
    L.add(s.add.text(0, 186, `La 4e colonne suit ton camp. Ta fortune : ${G.argent.toLocaleString('fr-FR')} p.`, style(11, '#6b4a2a', { fontStyle: 'italic' })).setOrigin(0.5));
    if (question) {
      const [id, k, nom, prix] = question;
      const q = s.add.container(480, 262).setDepth(95), gq = s.add.graphics(); objets.push(q);
      gq.fillStyle(0x1a0e06, 0.92).fillRoundedRect(-230, -60, 460, 120, 12).lineStyle(2, 0xc9a227).strokeRoundedRect(-230, -60, 460, 120, 12); q.add(gq);
      q.add(s.add.text(0, -34, `${nom} en style ${STYLES_DECO[k].nom} : ${prix} pièces ?`, style(15, '#f3d98a', { fontStyle: 'bold', wordWrap: { width: 420 }, align: 'center' })).setOrigin(0.5));
      const oui = creerBouton(s, 390, 302, 160, 'Acheter', () => { const p = poserDeco(G, id, k); if (p < 0) { Son.jouer('refus'); return; }
        Son.jouer('pieces'); gainEnDirect(s, 390, 270, `−${p} p.`, false); if (rafraichir) rafraichir(); dessiner(); });
      const non = creerBouton(s, 570, 302, 160, 'Non', () => dessiner());
      for (const b of [oui, non]) { b.fond.setDepth(96); b.label.setDepth(96.1); objets.push(b); }
    }
    const f = creerBouton(s, 480, 498, 200, 'Fermer le carnet', () => { vider(); L.destroy(); voile.destroy(); if (rafraichir) rafraichir(); });
    f.fond.setDepth(93); f.label.setDepth(93.1); objets.push(f);
  };
  dessiner();
}
