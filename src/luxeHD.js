// (v1.30, planche 54 validée) Le luxe : un cinquième niveau pour le comptoir, le coffre, la chambre et l'éclairage,
// peint à partir des dessins du niveau 3 (déjà en jeu), qu'on enrichit (marbre veiné, gemmes, velours étoilé, une
// seconde couronne de cristal). Et l'étage : la façade surélevée de l'appartement, le fauteuil du salon, le grenier.
const lxToileCanvas = (s, cle) => { const src = s.textures.get(cle).getSourceImage(); const c = document.createElement('canvas'); c.width = src.width; c.height = src.height; c.getContext('2d').drawImage(src, 0, 0); return c; };
const lxPixels = (c, f) => { const ctx = c.getContext('2d'), d = ctx.getImageData(0, 0, c.width, c.height), p = d.data;
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) { const i = (y * c.width + x) * 4; if (p[i + 3]) f(p, i, x, y); } ctx.putImageData(d, 0, 0); return c; };
const lxPoint = (c, x, y, coul, a = 255) => { const ctx = c.getContext('2d'); ctx.fillStyle = coul; ctx.globalAlpha = a / 255; ctx.fillRect(x, y, 1, 1); ctx.globalAlpha = 1; };
const lxGemme = (c, x, y, [f, m, cl]) => { for (const [dx, dy, k] of [[0, -1, 1], [-1, 0, 1], [0, 0, 1], [1, 0, 0], [0, 1, 0], [-1, -1, 2], [1, 1, 0]]) lxPoint(c, x + dx, y + dy, [f, m, cl][k === 2 ? 2 : k === 1 ? 1 : 0]); lxPoint(c, x - 1, y - 1, '#ffffff'); };
const lxLum = (p, i) => (p[i] * 0.3 + p[i + 1] * 0.59 + p[i + 2] * 0.11) / 255;

// La texture du niveau « luxe » d'un meuble : 'lit', 'coffre', 'comptoir' ou 'luminaire'
function textureLuxe(s, quoi) {
  const cle = { lit: 'litHD_4', coffre: 'coffreHD_4', comptoir: 'plateauComptoir_4', luminaire: 'luminaire_4' }[quoi];
  if (s.textures.exists(cle)) return cle;
  creerInterieurHD(s);
  if (quoi === 'lit') litHD(s, 3); if (quoi === 'coffre') coffreHD(s, 3); if (quoi === 'comptoir') plateauComptoir(s, 3); if (quoi === 'luminaire') luminaireHD(s, 3);
  // --- le lit royal : le baldaquin tendu de velours bleu nuit, brodé d'étoiles d'or ---
  if (quoi === 'lit') { const c = lxPixels(lxToileCanvas(s, 'litHD_3'), (p, i, x, y) => { const r = p[i], g = p[i + 1], b = p[i + 2];
      if (r > g * 1.6 && r > b * 1.4 && r > 50) { const l = lxLum(p, i) * 1.25; p[i] = 30 * l + 10; p[i + 1] = 50 * l + 14; p[i + 2] = 150 * l + 40;
        if ((x * 7 + y * 3) % 23 === 0) { p[i] = 255; p[i + 1] = 214; p[i + 2] = 90; } } });
    s.textures.addCanvas('litHD_4', c); }
  // --- le coffre du trésorier : l'or gravé, serti de rubis, de saphirs et d'émeraudes, une couronne sur le couvercle ---
  if (quoi === 'coffre') { const c = lxToileCanvas(s, 'coffreHD_3');
    lxGemme(c, 6, 14, ['#6a0a10', '#c81e2a', '#ff7a80']); lxGemme(c, 31, 14, ['#0a1a6a', '#2a4ae0', '#8ab0ff']); lxGemme(c, 6, 31, ['#0a4a1a', '#1ea040', '#8af0a0']); lxGemme(c, 31, 31, ['#6a0a10', '#c81e2a', '#ff7a80']);
    const ctx = c.getContext('2d'); ctx.fillStyle = '#7a520e'; ctx.fillRect(13, 2, 11, 4); ctx.fillStyle = '#f4d464'; ctx.fillRect(13, 2, 11, 1); for (const x of [13, 18, 23]) { ctx.fillStyle = '#dcae36'; ctx.fillRect(x, 0, 1, 2); }
    lxGemme(c, 18, 4, ['#0a1a6a', '#2a4ae0', '#8ab0ff']);
    s.textures.addCanvas('coffreHD_4', c); }
  // --- le comptoir de marbre veiné et d'or : l'ébène devient marbre blanc ---
  if (quoi === 'comptoir') { const c = lxPixels(lxToileCanvas(s, 'plateauComptoir_3'), (p, i, x, y) => { const r = p[i], g = p[i + 1], b = p[i + 2], l = lxLum(p, i);
      if (l < 0.42 && Math.abs(r - b) < 40) { const veine = Math.abs(Math.sin(x * 0.045 + Math.sin(y * 0.2 + x * 0.01) * 2.4)) < 0.08 ? 0.75 : 1, v = (0.78 + l * 0.5) * veine * 255;
        p[i] = Math.min(255, v); p[i + 1] = Math.min(255, v * 0.97); p[i + 2] = Math.min(255, v * 0.93); } });
    s.textures.addCanvas('plateauComptoir_4', c); }
  // --- le grand lustre à deux couronnes de cristal ---
  if (quoi === 'luminaire') { const src = s.textures.get('luminaire_3').getSourceImage(), W = src.width, H = src.height, c = document.createElement('canvas'); c.width = W + 8; c.height = Math.round(H * 1.7);
    const ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = false;
    ctx.drawImage(src, Math.round((c.width - W * 0.66) / 2), 0, Math.round(W * 0.66), Math.round(H * 0.66));
    ctx.drawImage(src, 4, c.height - H, W, H);
    ctx.fillStyle = '#b0821c'; ctx.fillRect(Math.floor(c.width / 2), Math.round(H * 0.6), 1, c.height - H - Math.round(H * 0.6) + 4);
    for (let k = 0; k < 9; k++) { const x = 6 + k * (W - 4) / 8, y = c.height - 3 - (k % 2) * 2; ctx.fillStyle = '#e8f4ff'; ctx.fillRect(Math.round(x), y, 1, 3); ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(x), y, 1, 1); }
    s.textures.addCanvas('luminaire_4', c); }
  return cle;
}

// L'étage : la façade surélevée (l'appartement), le fauteuil du salon, le grenier aménagé
function creerEtageHD(s) {
  if (s.textures.exists('grenierHD')) return;
  creerFacadeHD(s, 3); creerInterieurHD(s);
  // --- la façade avec l'étage en plus (l'appartement) : le toit remonte d'un étage, un balcon de fer forgé ---
  { const src = s.textures.get('facadeHD_3').getSourceImage(), [ex, ey, el, eh] = FACADE.etage, W = src.width, H = src.height, c = document.createElement('canvas');
    c.width = W; c.height = H + eh; const ctx = c.getContext('2d');
    ctx.drawImage(src, 0, 0, W, ey, 0, 0, W, ey);                 // le toit
    ctx.drawImage(src, 0, ey, W, eh, 0, ey, W, eh);               // le nouvel étage (l'appartement)
    ctx.drawImage(src, 0, ey, W, H - ey, 0, ey + eh, W, H - ey);  // l'étage d'avant et le rez-de-chaussée
    // le balcon de l'appartement : une dalle de pierre, une rambarde de fer forgé à volutes, deux pots de fleurs
    const by = ey + eh - 6, bx0 = 40, bx1 = 160;
    ctx.fillStyle = '#5a5a62'; ctx.fillRect(bx0 - 4, by + 4, bx1 - bx0 + 8, 3); ctx.fillStyle = '#9a9aa4'; ctx.fillRect(bx0 - 4, by + 4, bx1 - bx0 + 8, 1);
    ctx.fillStyle = '#1a1c22'; ctx.fillRect(bx0, by - 10, bx1 - bx0, 1); ctx.fillRect(bx0, by + 3, bx1 - bx0, 1);
    for (let x = bx0; x <= bx1; x += 5) ctx.fillRect(x, by - 10, 1, 13);
    for (let x = bx0 + 2; x < bx1; x += 10) { ctx.fillRect(x, by - 6, 3, 1); ctx.fillRect(x + 1, by - 7, 1, 3); }
    for (const px of [bx0 + 8, bx1 - 14]) { ctx.fillStyle = '#8a3a1e'; ctx.fillRect(px, by - 15, 7, 5); ctx.fillStyle = '#3a8a2a'; ctx.fillRect(px - 1, by - 19, 9, 4); ctx.fillStyle = '#e04a6a'; ctx.fillRect(px + 1, by - 20, 2, 2); ctx.fillRect(px + 5, by - 19, 2, 2); }
    s.textures.addCanvas('facadeHD_4', c); }
  // --- un fauteuil de velours rouge, à pieds de lion, clouté d'or ---
  { const t = toileDecor(40, 46);
    t.forme('cuirRouge', (x, y) => (x >= 8 && x <= 31 && y >= 2 && y <= 26 ? [(x - 19.5) / 14, -0.3, 0.8] : null), { motif: (x, y) => ((x + y) % 7 === 0 ? -0.6 : 0) });
    for (let y = 2; y <= 26; y++) for (const x of [6, 7, 32, 33]) t.poser(x, y, 'cheneSombre', x === 6 || x === 32 ? 4 : 2);
    for (let x = 6; x <= 33; x++) { t.poser(x, 1, 'cheneSombre', 4); t.poser(x, 0, 'cheneSombre', 5); }
    t.forme('cuirRouge', (x, y) => (x >= 4 && x <= 35 && y >= 26 && y <= 33 ? [0, (y - 29) / 6, 0.9] : null), { decalage: 0.4 });
    for (const [x0, x1] of [[1, 6], [33, 38]]) for (let y = 18; y <= 34; y++) for (let x = x0; x <= x1; x++) t.poser(x, y, y < 21 ? 'cuirRouge' : 'cheneSombre', y < 21 ? 4 : x === x0 ? 4 : 2);
    for (let x = 4; x <= 35; x += 3) t.poser(x, 33, 'laiton', 5);
    for (let x = 9; x <= 30; x += 3) t.poser(x, 3, 'laiton', 5);
    for (const fx of [5, 32]) for (let y = 34; y < 46; y++) for (let x = fx; x < fx + 4; x++) t.poser(x + (y > 42 ? (fx < 20 ? -1 : 1) : 0), y, 'cheneSombre', y > 42 ? 4 : x === fx ? 4 : 2);
    t.contour(); t.texture(s, 'fauteuilHD'); }
  // --- le grenier aménagé : sous les chevrons, des étagères neuves, une lucarne ---
  { const L = 480, H = 270, t = toileDecor(L, H); Object.assign(t.rampes, RAMPES_RUE);
    enduit(t, 0, 0, L, 230, 970, true);
    // le plancher
    for (let k = 0; k < 6; k++) planche(t, 0, 230 + k * 7, L, 7, 'chene', { graine: 971 + k, noeuds: 3 });
    // les deux pans du toit qui descendent jusqu'au plancher, couverts de planches, et les chevrons
    for (let y = 0; y < 230; y++) { const w = Math.max(0, 150 - y * 0.62); for (let x = 0; x < w; x++) { t.poser(x, y, 'chene', 2 + ((x + y * 0.62) % 14 < 1.2 ? -1 : 0) + (x > w - 3 ? 2 : 0)); t.poser(L - 1 - x, y, 'chene', 1 + ((x + y * 0.62) % 14 < 1.2 ? -1 : 0) + (x > w - 3 ? 2 : 0)); } }
    for (let x = 0; x < L; x++) for (let y = 0; y < 10; y++) t.poser(x, y, 'cheneSombre', y < 2 ? 4 : 2);   // (la panne faîtière)
    for (const px of [150, 330]) for (let y = 10; y < 230; y++) for (let x = px; x < px + 10; x++) t.poser(x, y, 'cheneSombre', x === px ? 4 : x === px + 9 ? 1 : 3);   // (deux poteaux)
    // la lucarne, au fond, avec le ciel
    for (let y = 40; y < 100; y++) for (let x = 210; x < 270; x++) { const bord = x < 214 || x > 265 || y < 44 || y > 95 || x === 240 || y === 70; t.poser(x, y, bord ? 'cheneSombre' : 'vitre', bord ? 3 : 4 + (y < 60 ? 1 : 0)); }
    // les étagères neuves, entre les poteaux et sous les pentes
    for (const [x0, l] of [[164, 160]]) for (const ey of [130, 170, 210]) { planche(t, x0, ey, l, 5, 'chene', { graine: 980 + ey, noeuds: 2 }); for (const xx of [x0 + 4, x0 + l - 8]) for (let y = ey + 5; y < ey + 12; y++) t.poser(xx, y, 'fer', 2); }
    t.texture(s, 'grenierHD'); }
}
