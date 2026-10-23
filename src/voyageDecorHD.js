// (v1.57, planche 77) Les décors du grand voyage, refaits avec les règles du jeu : l'eau fait partie du décor (un lit creusé
// dans le chemin, des berges, le même rendu que la rivière de l'intro et des récits), une porte s'inscrit dans un mur et un
// paysage, un chemin a sa logique (une ville en hauteur se gagne par une rampe).

// --- Le gué ---
// Comme le ruisseau du Vieux Moulin (planche 60, validé) : la rivière sort d'un bouquet d'arbres au fond des champs,
// s'élargit en approchant, coupe la route et file jusqu'au bas de l'écran. La route y descend par deux berges en pente
// douce ; au milieu, un fond de galets où l'eau ne monte qu'aux chevilles de la maison. Coordonnées locales : X = 0 au
// milieu de la rivière, y du monde (le sol de la route est `sol`, le bas de l'écran 540).
const COULEURS_GUE = {};   // (les teintes de l'eau de chaque gué, pour l'eau autour des pattes)
const GUE = { nom: 'gue', loin: 112, demiLoin: 12, demiRoute: 172, demiBas: 224, berge: 58, creux: 12, niveau: 3, haut: 26 };
// (le ruisseau du pont étroit et du troll : la même eau, deux fois moins large)
const RUISSEAU = { ...GUE, nom: 'ruisseau', loin: 104, demiLoin: 6, demiRoute: 88, demiBas: 116, berge: 42, creux: 9 };
// la demi-largeur de l'eau à chaque hauteur (en perspective : étroite au loin, large devant)
function demiGue(y, sol, g = GUE) {
  const y0 = sol - g.loin;
  if (y < sol) { const u = Phaser.Math.Clamp((y - y0) / g.loin, 0, 1); return g.demiLoin + (g.demiRoute - g.demiLoin) * Math.pow(u, 1.5); }
  return g.demiRoute + (g.demiBas - g.demiRoute) * Phaser.Math.Clamp((y - sol) / (540 - sol), 0, 1);
}
// (des rives qui ne sont pas tirées à la règle : la rivière serpente un peu au loin, chaque bord a ses anses)
function meandreGue(y, sol, g = GUE) { const u = Phaser.Math.Clamp((sol - g.haut - y) / (g.loin - g.haut), 0, 1); return Math.sin(u * Math.PI * 1.15) * 46 * (g.demiRoute / GUE.demiRoute) * Math.sqrt(u) + (fbm(y * 0.05, 3, 951) - 0.5) * 10 * u; }
function riveGue(y, cote) { return (fbm(y * 0.09, cote > 0 ? 7 : 5, 952) - 0.5) * 14 + (fbm(y * 0.4, cote > 0 ? 9 : 8, 953) - 0.5) * 4; }
function bordsEauGue(y, sol, g = GUE) { const m = meandreGue(y, sol, g), d = demiGue(y, sol, g), r = g.demiRoute / GUE.demiRoute; return [m - d + riveGue(y, -1) * r, m + d + riveGue(y, 1) * r]; }
// la largeur de la berge en pente, de chaque côté (elle s'élargit vers nous, comme la route)
function bergeGue(y, sol, cote, g = GUE) { return g.berge * (1 + (y - sol) / 150) + (fbm(y * 0.12, cote > 0 ? 4 : 2, 955) - 0.5) * 10; }
// De combien un pied s'enfonce sous le niveau de la route, à X : rien sur la route, de plus en plus sur la berge, le
// fond de galets dans l'eau
function profondeurGue(X, sol = 470, g = GUE) {
  const [a, b] = bordsEauGue(sol, sol, g), m = (a + b) / 2, d = (b - a) / 2, r = Math.abs(X - m);
  const u = Phaser.Math.Clamp((d + g.berge - r) / (g.berge + 30), 0, 1);
  return g.creux * u * u * (3 - 2 * u);
}
function dansLEauGue(X, sol = 470, g = GUE) { const [a, b] = bordsEauGue(sol, sol, g); return X > a + 2 && X < b - 2; }

// La texture fixe du gué (en demi-pixels, comme le chemin) : l'eau, du filet lointain jusqu'au bas de l'écran ; les
// berges de la route ; le liseré de terre mouillée et les touffes d'herbe dans les champs. Les couleurs viennent du
// paysage où on la pose (le ciel s'y reflète, l'herbe des rives est celle des champs).
function textureGueHD(scene, sol, cleFond, g = GUE) {
  const cle = (g.nom === 'gue' ? 'gueHD_' : g.nom + 'HD_') + cleFond; if (scene.textures.exists(cle)) return cle;
  const X0 = -(g.demiBas + g.berge * 1.6 + 20), y0 = sol - g.loin - 4;
  const L = Math.round(-X0), H = Math.round((540 - y0) / 2), t = toileDecor(L, H);
  // les couleurs du paysage : le ciel (pour le reflet), l'herbe des champs au bord de la route
  const tex = scene.textures.get(cleFond).getSourceImage(), Lf = tex.width, Hf = tex.height;
  const pixel = (fx, fy) => { const c = scene.textures.getPixel(Math.round(fx * (Lf - 1)), Math.round(fy * (Hf - 1)), cleFond); return c ? Phaser.Display.Color.GetColor(c.red, c.green, c.blue) : 0x8090a0; };
  const ciel = melangeCouleur(pixel(0.3, 0.04), pixel(0.6, 0.12), 0.5), herbe = melangeCouleur(pixel(0.2, (sol + 180 - 40) / (sol + 180)), pixel(0.7, (sol + 180 - 46) / (sol + 180)), 0.5);
  const clair = melangeCouleur(ciel, 0x9cc8dc, 0.45), sombre = 0x24506a;
  t.rampes.eauG = [0, 1, 2, 3, 4, 5].map(i => melangeCouleur(sombre, clair, i / 5));
  COULEURS_GUE[cle] = t.rampes.eauG;
  t.rampes.herbeG = rampe(herbe); t.rampes.terreC = rampe(0x9a7a50); t.rampes.terreM = rampe(0x5e4630); t.rampes.galet = rampe(0x8a8478);
  t.rampes.galetM = [0, 1, 2, 3, 4, 5].map(i => melangeCouleur(t.rampes.galet[i], t.rampes.eauG[i], 0.45));
  const ornieres = y => { const p = (y - sol) / 70; return Math.abs(p - 0.45) < 0.03 || Math.abs(p - 0.75) < 0.035; };
  for (let j = 0; j < H; j++) {
    const y = y0 + j * 2, [a, b] = bordsEauGue(y, sol, g), route = y >= sol - g.haut;
    const k = Phaser.Math.Clamp((y - y0) / (540 - y0), 0, 1);   // 0 au loin, 1 devant
    for (let px = 0; px < L; px++) {
      const X = X0 + px * 2;
      if (X >= a && X <= b) {
        // l'eau : claire au loin (le ciel), profonde devant ; plus claire et tachée de galets là où le fond remonte (le gué,
        // le long de la route, et contre les berges) ; une ombre au ras de chaque berge
        const bord = Math.min(X - a, b - X), gue = Phaser.Math.Clamp(1 - Math.abs(y - sol) / 34, 0, 1);
        let f = 4.7 - Math.pow(k, 1.4) * 4.2 + gue * 1.3 + (route && bord < 24 ? (24 - bord) / 24 * 0.9 : 0) + (fbm(X * 0.015, y * 0.06, 957) - 0.5) * 0.7;
        if (bord < 4 + k * 4) f -= 1.2;   // (l'ombre de la berge au ras de l'eau)
        let ton = Math.floor(f); if (f - ton > (BAYER[j % 4][px % 4] + 0.5) / 16) ton++;
        t.poser(px, j, 'eauG', ton);
        // (le fond de galets qu'on devine par transparence, là où c'est peu profond : le gué et le pied des berges)
        const fond = gue + (route && bord < 18 ? 0.4 : 0);
        if (fond > 0.2 && fbm(X * 0.14, y * 0.32, 958) > 0.8 - fond * 0.1) t.poser(px, j, 'galetM', ton >= 4 ? 3 : 2);
        continue;
      }
      const cote = X < a ? -1 : 1, e = cote < 0 ? a - X : X - b;
      if (route) {
        // la berge : la terre de la route qui descend vers l'eau, de plus en plus mouillée ; les ornières y plongent
        const w = bergeGue(y, sol, cote, g); if (e > w) continue;
        const u = e / w;   // 1 en haut (la route), 0 au ras de l'eau
        let mat = u > 0.45 ? 'terreC' : 'terreM', ton = u > 0.45 ? 3 - (u < 0.65 ? 1 : 0) : 2 + (u > 0.25 ? 1 : 0);
        ton += Math.round((fbm(X * 0.05, y * 0.25, 961) - 0.5) * 2);
        if (ornieres(y) && u > 0.3) ton -= 1;
        if (e < 3) { mat = 'terreM'; ton = 1; }
        t.poser(px, j, mat, ton);
        if (hachage(px, j, 962) > (u < 0.5 ? 0.9 : 0.97)) t.poser(px, j, 'galet', 2 + Math.round(hachage(px, j, 963) * 2));
        if (y < sol - g.haut + 6 && u > 0.6 && fbm(X * 0.2, 0, 963) > 0.5) t.poser(px, j, 'herbeG', 2 + (j % 2));
        continue;
      }
      // dans les champs : le liseré de terre mouillée, puis l'herbe qui avance un peu sur l'eau, par touffes
      const lis = 2 + k * 4;
      if (e < lis) t.poser(px, j, 'terreM', e < 2 ? 1 : 2);
      else if (e < lis + 4 + k * 6 && fbm(y * 0.3, cote * 3, 954) > 0.42) t.poser(px, j, 'herbeG', 2 + (hachage(px, j, 956) > 0.6 ? 1 : 0));
    }
  }
  // de gros galets qui affleurent dans le courant, en aval du gué
  for (const [X, y, r] of [[-70, sol + 50, 4], [96, sol + 60, 5], [-150, sol + 58, 3]].map(([X, y, r]) => [X * g.demiRoute / GUE.demiRoute, y, r])) {
    const px = Math.round((X - X0) / 2), py = Math.round((y - y0) / 2);
    for (let dy = -r; dy <= 0; dy++) for (let dx = -Math.ceil(r * 1.5); dx <= r * 1.5; dx++) { const u = (dx / (r * 1.5)) ** 2 + (dy / r) ** 2; if (u <= 1) t.poser(px + dx, py + dy, 'galet', u > 0.7 ? 1 : dy < -r * 0.4 && dx < 0 ? 4 : 2 + (dx < 0 ? 1 : 0)); }
    for (let dx = -Math.ceil(r * 1.8); dx <= r * 1.8; dx++) if (hachage(dx, py, 960) > 0.3) t.poser(px + dx, py + 1, 'eauG', 5);   // l'écume où l'eau bute contre la pierre
  }
  t.texture(scene, cle);
  return cle;
}

// Les arbres des rives : des aulnes au feuillage en plusieurs touffes, aux couleurs des arbres du paysage (roux à
// l'automne, verts l'été, nus l'hiver) ; `buisson` : une touffe basse, pour le fond où la rivière disparaît
function arbreRiveHD(scene, saison, sorte = 'aulne', graine = 1) {
  const cle = `arbreRive_${sorte}_${saison || 'x'}_${graine}`; if (scene.textures.exists(cle)) return cle;
  const t = toileRepere(80, 120), nu = saison === 'hiver', vert = saison === 'printemps' || saison === 'ete';
  t.rampes.feuille = rampe(vert ? 0x4a7030 : 0x84401f);
  const h = (k, j) => hachage(k, j, 990 + graine);
  // (la couronne : plusieurs touffes fondues en une seule masse, éclairée d'en haut à gauche comme un tout ; des creux
  // plus sombres entre les touffes, quelques feuilles claires qui accrochent la lumière)
  const couronne = (touffes, cx, cy, rx, ry) => t.forme('feuille', (x, y) => {
    let dedans = false, creux = 1;
    for (const [bx, by, r] of touffes) { const d = ((x + 0.5 - bx) / r) ** 2 + ((y + 0.5 - by) / (r * 0.85)) ** 2; if (d <= 1 - 0.18 * hachage(x >> 2, y >> 2, graine)) { dedans = true; creux = Math.min(creux, d); } }
    if (!dedans) return null;
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
    return [dx, dy, Math.sqrt(Math.max(0.05, 1 - Math.min(1, dx * dx + dy * dy))) - (creux > 0.7 ? 0.25 : 0)];
  }, { tramage: true, motif: (x, y) => (hachage(x, y, graine + 3) > 0.9 ? 0.7 : hachage(x, y, graine + 7) > 0.9 ? -0.6 : 0) });
  if (sorte === 'buisson') {
    const tf = []; for (let k = 0; k < 6; k++) tf.push([14 + k * 10 + h(k, 1) * 6, 104 - h(k, 2) * 8, 10 + h(k, 3) * 5]);
    couronne(tf, 40, 98, 34, 16);
  } else {
    tronc(t, 40, 120, 64, 4);
    ligne(t, 'rondin', 2, 40, 78, 22 + h(1, 1) * 6, 60, 2); ligne(t, 'rondin', 2, 40, 72, 58 - h(1, 2) * 6, 54, 2);
    if (nu) { for (let k = 0; k < 6; k++) ligne(t, 'rondin', 1, 40 + (k - 2.5) * 6, 62 - k * 3, 40 + (k - 2.5) * 13, 30 + h(k, 5) * 12, 1); }
    else couronne([[40, 40, 20], [22, 54, 14], [58, 52, 15], [30, 28, 13], [52, 30, 13], [40, 58, 12], [14, 64, 8], [66, 62, 8]].map(([x, y, r], k) => [x + (h(k, 6) - 0.5) * 6, y + (h(k, 7) - 0.5) * 4, r]), 40, 46, 30, 26);
  }
  t.contour(); t.texture(scene, cle); return cle;
}

// Le gué posé dans le monde : un conteneur (qui défile avec la route) avec la texture, le courant (des rides qui
// descendent vers nous et s'écartent), les reflets, les arbres d'où sort la rivière, les roseaux des berges.
// Renvoie { c, devant } : `devant` (les roseaux du premier plan) passe devant la maison.
function poserGueHD(scene, sol, cleFond, g = GUE) {
  creerMoulinHD(scene); creerHalo(scene);
  const X0 = -(g.demiBas + g.berge * 1.6 + 20), y0 = sol - g.loin - 4;
  const c = scene.add.container(0, 0), devant = scene.add.container(0, 0);
  c.add(scene.add.image(X0, y0, textureGueHD(scene, sol, cleFond, g)).setOrigin(0).setScale(2));
  const saison = typeof saisonActuelle === 'function' ? saisonActuelle() : null;
  const vert = saison === 'printemps' || saison === 'ete', teinteArbre = 0xffffff, teinteRoseau = vert ? 0xffffff : saison === 'hiver' ? 0xb0a890 : 0xe0c88a;
  // les arbres du fond : la rivière sort de sous leurs branches (on ne voit pas d'où elle vient : elle vient de loin)
  for (const [X, dy, e, s2] of [[-40, 4, 0.5, 'aulne'], [26, 0, 0.56, 'aulne'], [-6, 8, 0.6, 'buisson'], [70, 6, 0.42, 'aulne'], [-92, 8, 0.4, 'buisson'], [44, 10, 0.5, 'buisson']]) c.add(scene.add.image(meandreGue(sol - g.loin, sol, g) + X, sol - g.loin + dy, arbreRiveHD(scene, saison, s2, Math.abs(X) % 5)).setOrigin(0.5, 1).setScale(e * 1.15).setTint(teinteArbre));
  // un saule (ou un aulne) sur chaque rive, au bord de la route : la rivière a ses arbres
  for (const [cote, dy, e] of [[-1, -30, 1.25], [1, -36, 1.05]]) { const y = sol + dy, [a, b] = bordsEauGue(y, sol, g); c.add(scene.add.image(cote < 0 ? a - 40 : b + 46, y, arbreRiveHD(scene, saison, 'aulne', cote < 0 ? 2 : 3)).setOrigin(0.5, 1).setScale(e).setTint(teinteArbre)); }
  // le courant : de petits traits clairs qui naissent au loin, descendent vers nous en s'écartant, et s'effacent
  for (let k = 0; k < 46; k++) {
    const y = y0 + 8 + hachage(k, 8, 926) * (536 - y0 - 8), [a, b] = bordsEauGue(y, sol, g), x = a + 6 + hachage(k, 9, 926) * (b - a - 12), w = 4 + (y - y0) / (540 - y0) * 18;
    const ri = scene.add.rectangle(x, y, w, 2, 0xffffff, 0.45).setBlendMode(Phaser.BlendModes.ADD); c.add(ri);
    scene.tweens.add({ targets: ri, alpha: 0.05, duration: 700 + (k % 7) * 150, yoyo: true, repeat: -1, delay: k * 60 });
    const yb = Math.min(536, y + 50), [ab, bb] = bordsEauGue(yb, sol, g), m = (a + b) / 2, mb = (ab + bb) / 2;
    scene.tweens.add({ targets: ri, y: yb, x: mb + (x - m) * (bb - ab) / Math.max(8, b - a), scaleX: 1.5, duration: 2600 + (k % 5) * 400, repeat: -1, delay: k * 90 });
  }
  // le gué lui-même : l'eau court sur les galets en petites vaguelettes blanches, en travers de la route
  for (let k = 0; k < 14; k++) {
    const y = sol - 6 + (k % 4) * 9, [a, b] = bordsEauGue(y, sol, g), x = a + 20 + hachage(k, 3, 927) * (b - a - 40);
    const v = scene.add.ellipse(x, y, 12 + (k % 3) * 6, 3, 0xf0f8ff, 0.5); c.add(v);
    scene.tweens.add({ targets: v, y: y + 12, alpha: 0, scaleX: 1.8, duration: 1300 + (k % 4) * 200, repeat: -1, delay: k * 130 });
  }
  // le ciel qui se reflète au milieu du courant, en tremblant
  for (let k = 0; k < 10; k++) { const y = y0 + 10 + k * 7, m = meandreGue(y, sol, g), ri = scene.add.rectangle(m + (hachage(k, 2, 929) - 0.5) * 8, y, 3 + k * 2, 2, 0xffffff, 0.5).setBlendMode(Phaser.BlendModes.ADD); c.add(ri); scene.tweens.add({ targets: ri, alpha: 0.12, scaleX: 0.5, duration: 400 + k * 60, yoyo: true, repeat: -1 }); }
  // les roseaux : quelques touffes sur les rives des champs, au ras de l'eau ; et au premier plan, devant la maison
  for (const [sx, y, e] of [[-1, sol - 62, 0.5], [1, sol - 50, 0.6], [-1, sol - 34, 0.8], [1, sol - 30, 0.75]]) { const [a, b] = bordsEauGue(y, sol, g), ro = scene.add.image(sx < 0 ? a - 2 : b + 2, y + 2, 'roseauxHD_' + (sx < 0 ? 0 : 1)).setOrigin(0.5, 1).setScale(e).setTint(teinteRoseau); c.add(ro); scene.tweens.add({ targets: ro, angle: 2, duration: 1400 + y, yoyo: true, repeat: -1 }); }
  for (const [sx, e] of [[-1, 1.9], [1, 1.7]]) { const [a, b] = bordsEauGue(540, sol, g), ro = scene.add.image((sx < 0 ? a - 6 : b + 6), 552, 'roseauxHD_' + (sx < 0 ? 1 : 0)).setOrigin(0.5, 1).setScale(e).setTint(teinteRoseau); devant.add(ro); scene.tweens.add({ targets: ro, angle: 2, duration: 1500, yoyo: true, repeat: -1 }); }
  // des scintillements à la surface
  const ev = scene.time.addEvent({ delay: 260, loop: true, callback: () => {
    if (!c.active) { ev.remove(); return; }
    const y = sol - 20 + Math.random() * (540 - sol + 10), [a, b] = bordsEauGue(y, sol, g), s = scene.add.image(a + Math.random() * (b - a), y, 'halo').setScale(0.08).setTint(0xffffff).setBlendMode(Phaser.BlendModes.ADD);
    c.add(s); scene.tweens.add({ targets: s, scale: 0.18, alpha: 0, y: y + 14, duration: 700, onComplete: () => s.destroy() });
  } });
  return { c, devant };
}

// --- La Porte des Hommes : la frontière du Royaume ---
// Un mur de frontière qui vient du fond des collines (en perspective, de plus en plus petit, avec ses tours) jusqu'à la
// route, où il s'épaissit en un châtelet qui l'enjambe : la route passe DANS la porte, par un long passage voûté (on le
// voit en coupe : le mur du fond dans la pénombre, ses torches et ses bannières, le vantail ouvert, la herse relevée, le
// jour qui entre par les deux bouts ; au-dessus, la voûte et le chemin de ronde). La voûte est un peu plus basse que la
// maison debout : elle plie les genoux pour passer. Derrière, la grosse tour ronde du châtelet.
// Coordonnées locales : X = 0 au milieu du passage ; la texture va de X = -1020 à 320, de y = -60 au sol (+12).
const PORTE_FR = { XA: -1020, XB: 320, YA: -60, demi: 280, plafond: 96, bandeau: 4 };
function porteFrontiereHD(scene, sol, cleFond) {
  const cle = 'porteFrontiereHD2_' + cleFond; if (scene.textures.exists(cle)) return cle;
  const P = PORTE_FR, D = P.demi, L = (P.XB - P.XA) / 2, H = Math.round((sol + 12 - P.YA) / 2), t = toileDecor(L, H); rampesVille(t);
  t.rampes.pierreO = rampe(0x8a8478); t.rampes.ombreP = rampe(0x585c6c); t.rampes.cheneP = rampe(0x6a4a2e); t.rampes.herbeP = rampe(0x6a7a3a);
  const tx = X => Math.round((X - P.XA) / 2), ty = Y => Math.round((Y - P.YA) / 2), pose = (X, Y, m, k) => t.poser(tx(X), ty(Y), m, k);
  // l'herbe du pied de mur prend la couleur des champs
  const tex = scene.textures.get(cleFond).getSourceImage(), c0 = scene.textures.getPixel(Math.round(tex.width * 0.3), Math.round(tex.height * 0.9), cleFond);
  if (c0) t.rampes.herbeP = rampe(Phaser.Display.Color.GetColor(c0.red, c0.green, c0.blue));
  // une pierre de taille (assises de 10, blocs de 24, joints décalés) à l'échelle s ; `a` : l'abscisse le long du mur
  const pierre = (a, Y, haut, s, graine) => {
    if (s < 0.22) return 3;
    const rf = (Y - haut) / (10 * s), r = Math.floor(rf), cf = (a + (r % 2) * 12) / 24, c = Math.floor(cf);
    return 3 + Math.round((hachage(c, r, graine) - 0.5) * 1.4) - (((rf % 1) < 2 / (10 * s) || (cf % 1) < 2 / (24 * s)) ? 1 : 0);
  };
  // 1. le mur qui part vers le fond, en perspective (s : l'échelle, 1 contre le châtelet, presque rien au loin). On voit
  // sa face, assise par assise, plus sombre au pied ; d'en haut, le chemin de ronde (un trait clair) et les merlons
  // qui se découpent sur le ciel ; ses tours carrées, de plus en plus petites, qui avancent devant lui.
  const mur = X => { const u = Phaser.Math.Clamp((X + 1000) / 720, 0, 1), s = 0.05 + 0.95 * Math.pow(u, 1.7);
    const base = sol - 26 - (1 - u) * 170 + (fbm(X * 0.006, 2, 1201) - 0.5) * 24 * (1 - u); return { s, base, haut: base - 250 * s }; };
  let a = 0;
  for (let X = -1000; X < -D; X += 2) {
    const { s, base, haut } = mur(X); a += 2 / s;
    for (let Y = haut; Y < base; Y += 2) pose(X, Y, 'pierreB', pierre(a, Y, haut, s, 1203) - (Y > base - 30 * s ? 1 : 0) + (Y < haut + 8 * s ? 1 : 0));
    if (((a / 18) % 1) < 0.55) for (let Y = haut - Math.max(2, 12 * s); Y < haut; Y += 2) pose(X, Y, 'pierreB', 4);
    pose(X, haut, 'pierreB', 5); if (s > 0.4) pose(X, haut + 2, 'pierreO', 2);   // (le chemin de ronde, et l'ombre du parapet)
    if (s > 0.3 && hachage(tx(X), 5, 1204) > 0.75) pose(X, base - 4, 'mousse', 2);
    if (hachage(tx(X), 1, 1204) > 0.35) pose(X, base, 'herbeP', 2 + (hachage(tx(X), 2, 1204) > 0.5 ? 1 : 0));
    if (s > 0.3 && hachage(tx(X), 3, 1204) > 0.55) pose(X, base - 2, 'herbeP', 3);
  }
  for (const X of [-560, -830]) {
    const { s, base, haut } = mur(X), w = 34 * s, top = haut - 60 * s;
    for (let Y = top; Y < base + 2; Y += 2) for (let dx = -w; dx <= w; dx += 2) pose(X + dx, Y, 'pierreB', dx > w * 0.45 ? 2 - (Y > base - 30 * s ? 1 : 0) : pierre(dx / s + X, Y, top, s, 1205) - (Y > base - 30 * s ? 1 : 0));
    for (let dx = -w - 4 * s; dx <= w + 4 * s; dx += 2) if (((dx + w) / (10 * s)) % 2 < 1.1) for (let Y = top - 10 * s; Y < top; Y += 2) pose(X + dx, Y, 'pierreB', dx > w * 0.45 ? 2 : 4);
    if (s > 0.2) for (const yy of [0.3, 0.6]) for (let Y = top + (base - top) * yy; Y < top + (base - top) * yy + 12 * s; Y += 2) pose(X - w * 0.2, Y, 'noirB', 1);
    for (let j = 0; j < 20 * s + 4; j += 2) pose(X, top - 10 * s - j, 'fer', 2);   // la hampe et sa flamme rouge
    for (let j = 0; j < 8 * s + 2; j += 2) for (let i = 0; i < 12 * s + 2; i += 2) if (i < (12 * s + 2) * (1 - j / (8 * s + 4))) pose(X + 2 + i, top - 30 * s - 2 + j, 'banniere', 3);
  }
  // 2. la grosse tour ronde du châtelet, derrière le passage : elle dépasse au-dessus du chemin de ronde
  { const X0 = 60, X1 = 196, top = -44, cx = (X0 + X1) / 2, r = (X1 - X0) / 2;
    for (let Y = top; Y < P.bandeau; Y += 2) for (let X = X0; X < X1; X += 2) { const k = (X - cx) / r, rang = Math.floor((Y - top) / 10), dec = (rang % 2) * 12;
      pose(X, Y, 'pierreB', Math.round(3.4 - k * 1.8) - ((Y - top) % 10 === 0 || (Math.round((X + dec) / 2) % 12 === 0 && Math.abs(k) < 0.85) ? 1 : 0)); }
    for (let X = X0 - 4; X < X1 + 4; X += 2) if (((X - X0 + 4) / 2) % 6 < 3) for (let Y = top - 10; Y < top; Y += 2) pose(X, Y, 'pierreB', X < cx ? 4 : 2);
    for (let Y = -30; Y < -16; Y += 2) { pose(cx - 12, Y, 'noirB', 0); pose(cx - 10, Y, 'noirB', 1); }
    banniereRoyale(t, tx(cx) + 6, ty(-36), 8, 18); }
  // 3. le passage : le mur du fond dans la pénombre (le jour entre par les deux bouts), ses assises, une arcade aveugle,
  // deux torches, deux bannières royales, le vantail de chêne ouvert contre le mur, la herse relevée dans sa rainure
  for (let Y = P.plafond; Y < sol; Y += 2) for (let X = -D; X < D; X += 2) {
    const jour = Math.max(0, 1 - Math.min(X + D, D - X) / 110), haut = Y < P.plafond + 24 ? -1 : 0;
    pose(X, Y, jour > 0.5 ? 'pierreB' : 'ombreP', pierre(X + D, Y, P.plafond, 1, 1210) - (jour > 0.5 ? 1 : 0) + Math.round(jour * 1.4) + haut - (Math.abs(X) < 90 ? 1 : 0));
  }
  for (const cx of [-120, 0, 120]) for (let Y = 170; Y < sol - 30; Y += 2) for (let X = cx - 40; X <= cx + 40; X += 2) {   // l'arcade aveugle
    const d = Math.hypot(X - cx, Math.max(0, 210 - Y)), dans = Y >= 210 ? Math.abs(X - cx) < 36 : d < 36, bord = Y >= 210 ? Math.abs(X - cx) >= 30 && Math.abs(X - cx) < 36 : d >= 30 && d < 36;
    if (bord) pose(X, Y, 'ombreP', 3); else if (dans) pose(X, Y, 'ombreP', 1 + (Y > sol - 60 ? 0 : 0));
  }
  for (const X of [-60, 60]) { for (let X2 = X - 2; X2 < X + 3; X2 += 2) pose(X2, 172, 'fer', 2); banniereRoyale(t, tx(X) - 6, ty(176), 12, 44); }
  for (const X of [-180, 180]) {   // les torches : le support de fer, la poignée de bois (la flamme est animée à part)
    for (let Y = sol - 236; Y < sol - 206; Y += 2) pose(X, Y, 'cheneSombre', 2);
    for (let X2 = X - 6; X2 <= X + 6; X2 += 2) pose(X2, sol - 206, 'fer', 2);
    for (let Y = sol - 206; Y < sol - 192; Y += 2) pose(X, Y, 'fer', 1);
  }
  for (let Y = P.plafond + 16; Y < sol - 4; Y += 2) for (let X = 214; X < 252; X += 2) {   // le vantail ouvert (planches, pentures)
    const penture = [150, 260, 380].some(h => Math.abs(Y - h) < 5), bord = X < 216 || X > 248;
    pose(X, Y, penture ? 'fer' : 'cheneP', penture ? 2 : bord ? 1 : 2 + ((Math.round(X / 2) % 4) === 0 ? -1 : 0) + (hachage(Math.round(X / 8), Math.round(Y / 40), 1211) > 0.7 ? 1 : 0));
  }
  for (let X = -D + 24; X < -D + 40; X += 2) for (let Y = P.plafond; Y < P.plafond + 30; Y += 2) if ((X + D) % 6 < 2 || (Y - P.plafond) % 8 < 2 || Y >= P.plafond + 26) pose(X, Y, 'fer', 1 + (Y >= P.plafond + 26 ? 1 : 0));   // la herse relevée
  for (const sx of [-1, 1]) for (let Y = P.plafond; Y < sol; Y += 2) for (let k = 0; k < 18; k += 2) {   // les arcs des deux bouts (claveaux au soleil)
    const X = sx < 0 ? -D + k : D - 2 - k; pose(X, Y, 'pierreB', 4 - (k > 12 ? 1 : 0) - ((Y - P.plafond) % 18 < 2 ? 2 : 0));
  }
  for (let X = -D; X < D; X += 2) { pose(X, sol - 2, 'pierreB', 4); pose(X, sol, 'pierreB', 2); }   // le seuil
  // 4. la voûte et le chemin de ronde, au-dessus du passage (en coupe) : les pierres de taille, les créneaux, les
  // mâchicoulis sur le bord, l'écu royal, deux archères
  for (let Y = P.bandeau; Y < P.plafond; Y += 2) for (let X = -D - 12; X < D + 12; X += 2) pose(X, Y, 'pierreB', pierre(X + 400, Y, P.bandeau, 1, 1212) + (Y < P.bandeau + 6 ? 1 : 0) - (Y > P.plafond - 10 ? 1 : 0));
  for (let X = -D - 12; X < D + 12; X += 2) if (((X + D + 12) / 2) % 9 < 5) for (let Y = P.bandeau - 18; Y < P.bandeau; Y += 2) pose(X, Y, 'pierreB', ((X + D + 12) / 2) % 9 < 1 ? 2 : 4);
  for (let X = -D - 12; X < D + 12; X += 2) { const c = ((X + D + 12) / 2) % 8; for (let Y = P.plafond - 12; Y < P.plafond; Y += 2) pose(X, Y, c < 2 ? 'noirB' : 'pierreB', c < 2 ? 1 : Y > P.plafond - 6 ? 2 : 4); }
  banniereRoyale(t, tx(-8), ty(22), 10, 22);
  for (const X of [-150, 130]) for (let Y = 30; Y < 52; Y += 2) { pose(X, Y, 'noirB', 0); pose(X + 2, Y, 'noirB', 1); }
  t.contour(); t.texture(scene, cle); return cle;
}
// La Porte posée dans le monde : la texture, la flamme des torches, la pénombre sur la route sous la voûte.
function poserPorteFrontiereHD(scene, sol, cleFond) {
  creerHalo(scene);
  const c = scene.add.container(0, 0);
  c.add(scene.add.image(PORTE_FR.XA, PORTE_FR.YA, porteFrontiereHD(scene, sol, cleFond)).setOrigin(0).setScale(2));
  for (const X of [-180, 180]) {
    const h = scene.add.image(X, sol - 242, 'halo').setScale(1.1).setTint(0xffb050).setAlpha(0.55).setBlendMode(Phaser.BlendModes.ADD);
    const f = scene.add.ellipse(X, sol - 242, 8, 14, 0xffd070); c.add([h, f]);
    scene.tweens.add({ targets: f, scaleY: 1.25, scaleX: 0.85, duration: 180, yoyo: true, repeat: -1 });
    scene.tweens.add({ targets: h, alpha: 0.35, duration: 260, yoyo: true, repeat: -1 });
  }
  // (l'ombre de la voûte sur la chaussée, sous le passage)
  const ombre = scene.add.rectangle(0, sol, PORTE_FR.demi * 2, 70, 0x0a0806, 0.3).setOrigin(0.5, 0);
  return { c, ombre };
}

// Le Royaume des Hommes, passé la Porte : un village de pierre blanche sur sa colline (maisons serrées, toits
// d'ardoise, le clocher), vu de loin ; et la borne au bord de la route pavée.
function villageRoyaumeHD(scene, graine = 1) {
  const cle = 'villageRoyaume_' + graine; if (scene.textures.exists(cle)) return cle;
  const L = 150, H = 70, t = toileDecor(L, H); rampesVille(t);
  const base = H - 6;
  // le clocher (une tour carrée, la flèche d'ardoise)
  const cx = 40 + (graine % 3) * 30;
  for (let y = base - 40; y < base; y++) for (let x = cx; x < cx + 8; x++) t.poser(x, y, 'pierreB', x < cx + 3 ? 4 : 2);
  for (let y = base - 58; y < base - 40; y++) for (let x = cx - 1; x < cx + 9; x++) if (Math.abs(x + 0.5 - cx - 4) <= (y - base + 58) * 0.3) t.poser(x, y, 'ardoise', x < cx + 4 ? 4 : 2);
  t.poser(cx + 3, base - 32, 'noirB', 1); t.poser(cx + 4, base - 32, 'noirB', 1);
  // les maisons, serrées, de plus en plus loin vers les bords
  const maisons = [[6, 14, 2], [22, 12, 1], [56, 14, 2], [72, 12, 2], [88, 16, 1], [106, 12, 2], [120, 14, 1]];
  for (const [x0, w, n] of maisons) if (Math.abs(x0 + w / 2 - cx - 4) > 9) maisonLointaine(t, x0, base - (hachage(x0, graine, 31) > 0.5 ? 2 : 0), w, n, { loin: true, graine: 6 * (graine * 7 + x0) + (x0 % 3 === 1 ? 1 : 0) });   // (graine multiple de 6 : enduit blanc ; +1 : pierre blanche)
  // un muret et des haies au pied du village
  for (let x = 0; x < L; x++) { if (hachage(x, graine, 33) > 0.25) t.poser(x, base + 1, 'mousse', 2 + (x % 3 === 0 ? 1 : 0)); if ((x % 7) < 5) t.poser(x, base + 2, 'pierreB', 3); }
  t.contour(); t.texture(scene, cle); return cle;
}
function borneRoyaumeHD(scene) {
  const cle = 'borneRoyaume'; if (scene.textures.exists(cle)) return cle;
  const t = toileDecor(14, 24); rampesVille(t);
  t.forme('pierreB', (x, y) => (y >= 4 && y < 23 && Math.abs(x + 0.5 - 7) < 5 - (y < 8 ? (8 - y) * 0.6 : 0) ? [(x - 7) / 5, -0.3, 0.9] : null), { decalage: 0.2 });
  for (let x = 3; x < 11; x++) for (let y = 4; y < 8; y++) if (t.mat(x, y)) t.poser(x, y, 'banniere', y === 4 ? 4 : 3);   // la tête peinte aux couleurs du roi
  for (const [x, y] of [[5, 12], [7, 12], [9, 12], [6, 15], [8, 15]]) t.poser(x, y, 'pierreB', 1);   // les lettres gravées
  for (let x = 1; x < 13; x++) t.poser(x, 23, 'mousse', 2);
  t.contour(); t.texture(scene, cle); return cle;
}

// --- La tête de pont de Pont-Royal ---
// La rive gauche est haute : la route du Royaume arrive à plat, à hauteur du tablier, jusqu'à la tour carrée qui garde
// l'entrée du pont (c'est le fleuve qui est en bas, dans son lit). La route passe sous la tour par un passage voûté
// (en coupe, comme la Porte des Hommes, plus court) ; derrière la tour commence le pont : le parapet, le fleuve en contrebas,
// l'autre rive. Coordonnées locales : X = 0 au milieu du passage ; la texture va de X = -170 à 170, de y = -150 au sol.
const TETE_PONT = { XA: -170, XB: 170, YA: -150, demi: 150, plafond: 96, bandeau: 4 };
function teteDePontHD(scene, sol) {
  const cle = 'teteDePontHD'; if (scene.textures.exists(cle)) return cle;
  const P = TETE_PONT, D = P.demi, L = (P.XB - P.XA) / 2, H = Math.round((sol + 12 - P.YA) / 2), t = toileDecor(L, H); rampesVille(t);
  t.rampes.ombreP = rampe(0x585c6c); t.rampes.cheneP = rampe(0x6a4a2e);
  const pose = (X, Y, m, k) => t.poser(Math.round((X - P.XA) / 2), Math.round((Y - P.YA) / 2), m, k);
  const pierre = (a, Y, haut, graine) => { const rf = (Y - haut) / 10, r = Math.floor(rf), cf = (a + (r % 2) * 12) / 24; return 3 + Math.round((hachage(Math.floor(cf), r, graine) - 0.5) * 1.4) - ((rf % 1) < 0.2 || (cf % 1) < 0.084 ? 1 : 0); };
  // le haut de la tour : ses assises, deux fenêtres à meneaux, la bannière ; son toit pointu d'ardoise
  for (let Y = -70; Y < P.bandeau; Y += 2) for (let X = -D - 8; X < D + 8; X += 2) pose(X, Y, 'pierreB', pierre(X + 300, Y, -70, 1301) + (X < -D + 10 ? 1 : 0) - (X > D - 10 ? 1 : 0));
  for (let k = 0; k < 40; k++) for (let X = -D - 14 + k * 2.2; X < D + 14 - k * 2.2; X += 2) pose(X, -72 - k * 2, 'ardoise', ((X + k) % 8) < 1 ? 1 : X < 0 ? 4 : 2);
  for (const fx of [-90, 50]) for (let Y = -54; Y < -24; Y += 2) for (let X = fx; X < fx + 40; X += 2) pose(X, Y, (X - fx === 18 || X - fx === 20) ? 'pierreB' : 'verre', (X - fx === 18 || X - fx === 20) ? 4 : 2 + (Y < -44 ? 1 : 0));
  banniereRoyale(t, Math.round((-10 - P.XA) / 2), Math.round((-60 - P.YA) / 2), 10, 26);
  // le passage : le mur du fond dans la pénombre (le jour entre par les deux bouts), une lanterne, la fenêtre grillée du
  // poste de garde, la herse relevée, le vantail ouvert, les arcs aux deux bouts, le seuil
  for (let Y = P.plafond; Y < sol; Y += 2) for (let X = -D; X < D; X += 2) {
    const jour = Math.max(0, 1 - Math.min(X + D, D - X) / 80);
    pose(X, Y, jour > 0.5 ? 'pierreB' : 'ombreP', pierre(X + D, Y, P.plafond, 1310) - (jour > 0.5 ? 1 : 0) + Math.round(jour * 1.4) - (Y < P.plafond + 20 ? 1 : 0));
  }
  for (let Y = 210; Y < 262; Y += 2) for (let X = -44; X < 4; X += 2) { const barre = (X + 44) % 12 < 2 || (Y - 210) % 14 < 2; pose(X, Y, barre ? 'fer' : 'lueur', barre ? 1 : 2 + (Y < 230 ? 1 : 0)); }
  for (let Y = P.plafond; Y < P.plafond + 60; Y += 2) pose(70, Y, 'fer', 1);
  for (let Y = P.plafond + 60; Y < P.plafond + 78; Y += 2) for (let X = 62; X < 80; X += 2) pose(X, Y, (Y - P.plafond - 60) % 6 < 2 ? 'fer' : 'lueur', (Y - P.plafond - 60) % 6 < 2 ? 2 : 4);   // la lanterne
  for (let X = -D + 18; X < -D + 32; X += 2) for (let Y = P.plafond; Y < P.plafond + 26; Y += 2) if ((X + D) % 6 < 2 || (Y - P.plafond) % 8 < 2 || Y >= P.plafond + 22) pose(X, Y, 'fer', 1 + (Y >= P.plafond + 22 ? 1 : 0));
  for (let Y = P.plafond + 14; Y < sol - 4; Y += 2) for (let X = 100; X < 132; X += 2) { const penture = [160, 270, 370].some(h => Math.abs(Y - h) < 5); pose(X, Y, penture ? 'fer' : 'cheneP', penture ? 2 : X < 102 || X > 128 ? 1 : 2 + ((Math.round(X / 2) % 4) === 0 ? -1 : 0)); }
  for (const sx of [-1, 1]) for (let Y = P.plafond; Y < sol; Y += 2) for (let k = 0; k < 16; k += 2) { const X = sx < 0 ? -D + k : D - 2 - k; pose(X, Y, 'pierreB', 4 - (k > 10 ? 1 : 0) - ((Y - P.plafond) % 18 < 2 ? 2 : 0)); }
  for (let X = -D; X < D; X += 2) { pose(X, sol - 2, 'pierreB', 4); pose(X, sol, 'pierreB', 2); }
  // la voûte en coupe, ses mâchicoulis
  for (let Y = P.bandeau; Y < P.plafond; Y += 2) for (let X = -D - 8; X < D + 8; X += 2) pose(X, Y, 'pierreB', pierre(X + 500, Y, P.bandeau, 1312) - (Y > P.plafond - 10 ? 1 : 0));
  for (let X = -D - 8; X < D + 8; X += 2) { const c = ((X + D + 8) / 2) % 8; for (let Y = P.plafond - 12; Y < P.plafond; Y += 2) pose(X, Y, c < 2 ? 'noirB' : 'pierreB', c < 2 ? 1 : Y > P.plafond - 6 ? 2 : 4); }
  t.contour(); t.texture(scene, cle); return cle;
}
function poserTeteDePontHD(scene, sol) {
  const c = scene.add.container(0, 0);
  c.add(scene.add.image(TETE_PONT.XA, TETE_PONT.YA, teteDePontHD(scene, sol)).setOrigin(0).setScale(2));
  // derrière la tour, le pont : le fleuve en contrebas et l'autre rive, le parapet (le pont sans ses maisons)
  const pont = [0, 1].map(k => scene.add.image(TETE_PONT.demi + k * 960, 0, rueDuPontHD(scene, { nu: true })).setOrigin(0).setScale(2));
  const h = scene.add.image(70, sol - 300, 'halo').setScale(0.7).setTint(0xffc060).setAlpha(0.5).setBlendMode(Phaser.BlendModes.ADD);
  scene.tweens.add({ targets: h, alpha: 0.3, duration: 300, yoyo: true, repeat: -1 });
  c.add(h);
  const ombre = scene.add.rectangle(0, sol, TETE_PONT.demi * 2, 70, 0x0a0806, 0.3).setOrigin(0.5, 0);
  return { c, pont, ombre };
}

// --- Les vergers : un panier de pommes (osier tressé, pommes rouges et jaunes) et une échelle appuyée contre un tronc ---
function vergerHD(scene, quoi) {
  const cle = 'vergerHD_' + quoi; if (scene.textures.exists(cle)) return cle;
  if (quoi === 'panier') {
    const t = toileDecor(16, 12); t.rampes.osier = rampe(0xb08a4a); t.rampes.pommeR = rampe(0xb8302a); t.rampes.pommeJ = rampe(0xc8a83a);
    for (let y = 5; y < 12; y++) for (let x = 1 + (y > 9 ? 1 : 0); x < 15 - (y > 9 ? 1 : 0); x++) t.poser(x, y, 'osier', ((x + y) % 3 === 0 ? 2 : 3) + (y === 5 ? 1 : 0) - (y === 11 ? 1 : 0));
    for (const [x, y, m] of [[4, 4, 'pommeR'], [7, 3, 'pommeJ'], [10, 4, 'pommeR'], [12, 4, 'pommeR'], [6, 5, 'pommeR'], [9, 5, 'pommeJ']]) { t.forme(m, ellipsoide(x, y, 1.8, 1.6), { decalage: 0.3 }); t.poser(x - 1, y - 1, m, 5); }
    t.contour(); t.texture(scene, cle); return cle;
  }
  const t = toileDecor(12, 44);   // l'échelle : deux montants qui s'écartent vers le bas, les barreaux
  for (let y = 0; y < 44; y++) { const e = y * 0.06; for (const x of [Math.round(3 - e), Math.round(8 + e)]) { t.poser(x, y, 'chene', 3); t.poser(x + 1, y, 'chene', 2); } if (y % 6 === 3) for (let x = Math.round(4 - e); x < Math.round(8 + e); x++) t.poser(x, y, 'chene', 4); }
  t.contour(); t.texture(scene, cle); return cle;
}

// --- Les imprévus de la route ---
// La cabane du marchand nomade, sur ses pattes de poule : une isba de rondins, son toit de bardeaux, sa lucarne, un
// auvent de toile sous lequel il vend ; deux pattes écailleuses jaunes aux cuisses emplumées (deux images : le pas)
function isbaPoulesHD(scene, k = 0) {
  const cle = 'isbaPoules_' + k; if (scene.textures.exists(cle)) return cle;
  const L = 84, H = 96, t = toileDecor(L, H); rampesVille(t);
  t.rampes.rondin = rampe(0x8a5a32); t.rampes.bardeau = rampe(0x6a4a3a); t.rampes.plume = rampe(0x7a5236); t.rampes.ecaille = rampe(0xd8a838); t.rampes.toileR = rampe(0xb84a3a);
  const bas = 52;
  // les pattes de poule : la cuisse emplumée sous le plancher, le tarse écailleux, trois doigts griffus devant, un derrière
  const patte = (hx, avance) => {
    const gx = hx + avance * 0.5, px = hx + avance;
    for (let y = bas; y < bas + 12; y++) for (let x = Math.round(gx - 6 + (y - bas) * 0.1); x < gx + 6 - (y - bas) * 0.3; x++) t.poser(x, y, 'plume', 2 + ((x + y) % 3 === 0 ? 1 : 0) - (y > bas + 9 ? 1 : 0));
    for (let y = bas + 12; y < H - 4; y++) { const x = Math.round(gx + (px - gx) * (y - bas - 12) / (H - 16 - bas)); for (let d = -2; d < 2; d++) t.poser(x + d, y, 'ecaille', (y % 3 === 0 ? 2 : 3) + (d < 0 ? 1 : 0)); }
    for (const a of [-0.4, 0, 0.4]) for (let r = 0; r < 9; r++) { const x = Math.round(px + Math.cos(a) * r + 2), y = Math.round(H - 4 + Math.sin(a) * r * 0.4); t.poser(x, y, 'ecaille', 3); if (r === 8) t.poser(x + 1, y, 'noirB', 1); }
    for (let r = 0; r < 5; r++) t.poser(px - r - 1, H - 4 + Math.round(r * 0.2), 'ecaille', 2);
  };
  patte(30, k ? 8 : -4); patte(54, k ? -4 : 8);
  // la cabane : les rondins (chaque rondin bombé, les bouts qui dépassent aux coins), une fenêtre, l'auvent rayé
  for (let y = 22; y < bas; y++) for (let x = 12; x < L - 12; x++) { const r = (y - 22) % 5; t.poser(x, y, 'rondin', r === 0 ? 1 : r === 1 ? 4 : 3 - (r === 4 ? 1 : 0)); }
  for (const x of [9, L - 13]) for (let y = 22; y < bas; y += 5) for (let dx = 0; dx < 4; dx++) for (let dy = 0; dy < 4; dy++) t.poser(x + dx, y + dy, 'rondin', dx === 0 || dy === 0 ? 4 : 2);
  for (let y = 30; y < 42; y++) for (let x = 46; x < 60; x++) t.poser(x, y, x === 46 || x === 59 || y === 30 || y === 41 || x === 53 ? 'cheneSombre' : 'lueur', x === 46 || x === 59 || y === 30 || y === 41 || x === 53 ? 1 : 3);
  for (let y = 42; y < 46; y++) for (let x = 40; x < 66; x++) t.poser(x, y, 'toileR', (Math.floor((x - 40) / 4) % 2 ? 'toileR' : 'toile') && 3);
  for (let x = 40; x < 66; x += 4) for (let y = 42; y < 46; y++) for (let dx = 0; dx < 2; dx++) t.poser(x + dx, y, 'pierreB', 4);
  for (let y = 26; y < 50; y++) for (let x = 18; x < 30; x++) t.poser(x, y, (x === 18 || x === 29 || y === 26) ? 'cheneSombre' : 'chene', (x === 18 || x === 29 || y === 26) ? 1 : 2 + ((x - 18) % 4 === 0 ? -1 : 0));   // la porte
  // le toit de bardeaux, raide, et sa cheminée de pierre
  for (let y = 0; y < 24; y++) for (let x = 4; x < L - 4; x++) { if (Math.abs(x + 0.5 - L / 2) > y * 1.55 + 2) continue; const r = Math.floor(y / 3), dec = (r % 2) * 3; t.poser(x, y, 'bardeau', (x + dec) % 6 === 0 || y % 3 === 2 ? 1 : 3 + (x < L / 2 ? 1 : 0)); }
  for (let y = 2; y < 14; y++) for (let x = 56; x < 62; x++) t.poser(x, y, 'pierre', x === 56 ? 4 : 2);
  t.contour(); t.texture(scene, cle); return cle;
}
// L'épée cassée du héros blessé, posée dans l'herbe ; la borne de pierre de la Comté (sans couleurs royales)
function epeeCasseeHD(scene) {
  const cle = 'epeeCassee'; if (scene.textures.exists(cle)) return cle;
  const t = toileDecor(30, 8); rampesVille(t);
  for (let x = 0; x < 6; x++) for (let y = 3; y < 5; y++) t.poser(x, y, 'cuir', 2 + (y === 3 ? 1 : 0));
  for (let y = 1; y < 7; y++) t.poser(6, y, 'laiton', 3);
  for (let x = 7; x < 17; x++) { t.poser(x, 3, 'argent', 4); t.poser(x, 4, 'argent', 2); }
  for (let x = 20; x < 29; x++) { t.poser(x, 4 + (x > 25 ? 1 : 0), 'argent', 3); t.poser(x, 5 + (x > 25 ? 1 : 0), 'argent', 1); }
  t.contour(); t.texture(scene, cle); return cle;
}
function borneComteHD(scene) {
  // (une borne de chemin, pas une tombe : courte et trapue, sa tête peinte aux couleurs de la Comté, une flèche gravée)
  const cle = 'borneComte2'; if (scene.textures.exists(cle)) return cle;
  const t = toileDecor(16, 18); rampesVille(t); t.rampes.vertC = rampe(0x4a7a3a);
  t.forme('pierre', (x, y) => (y >= 3 && y < 17 && Math.abs(x + 0.5 - 8) < 6 - (y < 6 ? (6 - y) * 0.7 : 0) + (y > 14 ? 1 : 0) ? [(x - 8) / 6, -0.3, 0.9] : null), { decalage: 0.4 });
  for (let y = 2; y < 7; y++) for (let x = 2; x < 14; x++) if (t.mat(x, y)) t.poser(x, y, y < 4 ? 'or' : 'vertC', y === 2 ? 4 : 3);   // (la tête peinte : or et vert)
  for (const [x, y] of [[5, 11], [6, 11], [7, 11], [8, 11], [9, 11], [10, 11], [9, 10], [9, 12], [8, 9], [8, 13]]) t.poser(x, y, 'pierre', 1);   // (la flèche gravée)
  for (let x = 1; x < 15; x++) { t.poser(x, 17, 'mousse', 2); if (x % 3 === 0) t.poser(x, 16, 'mousse', 3); }
  t.contour(); t.texture(scene, cle); return cle;
}
