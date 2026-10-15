// (v0.67) La nymphe des fontaines, d'après le dessin du joueur : cinq états, de l'eau qui jaillit à
// une femme presque humaine qui garde son mystère. 0 : le jet d'eau ; 1 : la colonne prend une tête
// et deux yeux ; 2 : une silhouette d'eau, couronne, cheveux, robe qui ondule, un joyau au cœur ;
// 3 : elle se précise, lève son sceptre de cristal ; 4 : sa peau pâlit, ses cheveux foncent, sa robe
// vire au vert d'eau, un diadème d'or — mais le bas de sa robe reste de l'eau.
// Toiles de 56 × 104 (affichées en ×2), posées par le bas, au milieu de la vasque.

const NYMPHE_L = 56, NYMPHE_H = 104;

function creerNympheHD(scene) {
  if (scene.textures.exists('nymphe_4')) return;
  const cx = 28, sol = NYMPHE_H - 1;
  const rampes = t => Object.assign(t.rampes, {
    eau: [0x0a2a3a, 0x145a6e, 0x2a8aa0, 0x4ab8c8, 0x8ae0e8, 0xd8fcff],
    peauN: rampe(0xb4d2c8), cheveuxN: rampe(0x1e5a62), robeN: rampe(0x78c4a4), cristal: rampe(0x9aeaff), levres: rampe(0xb06a7a),
  });
  const tete = { x: cx, y: 22, rx: 6.5, ry: 7.5 };
  // la robe : des épaules à la taille, puis elle s'évase jusqu'à l'eau
  const robe = (x, y, evase = 1) => {
    if (y < 31 || y > sol) return null;
    const demi = y < 50 ? 6 + Math.sin(Math.min(1, (y - 31) / 6) * Math.PI / 2) * 3 - Math.max(0, y - 42) * 0.25 : 7 + (y - 50) * 0.3 * evase;
    const nx = (x + 0.5 - cx) / demi;
    return Math.abs(nx) <= 1 ? [nx * 0.8, -0.1, Math.sqrt(1 - nx * nx * 0.7)] : null;
  };
  // les plis de la robe qui tombent, et l'eau qui ruisselle (des traits clairs qui coulent)
  const plis = (x, y) => (y > 52 ? Math.sin((x - cx) * 1.1 + y * 0.08) * 0.6 : 0);
  const ruisselle = (x, y) => ((x * 7 + Math.floor(y / 3) * 3) % 11 === 0 ? 0.9 : (x * 5 + y) % 13 === 0 ? -0.6 : 0);
  const gouttes = (t, n, graine) => { for (let k = 0; k < n; k++) { const x = Math.round(4 + hachage(k, 1, graine) * (NYMPHE_L - 8)), y = Math.round(8 + hachage(k, 2, graine) * (NYMPHE_H - 30)); if (!t.mat(x, y)) t.poser(x, y, 'eau', 5 - (k % 2)); } };
  // l'éclaboussure au pied : l'eau de la vasque qui bouillonne
  const pied = (t, large) => t.forme('eau', (x, y) => (y > sol - 6 && Math.abs(x + 0.5 - cx) < large - (sol - y) * 0.6 + Math.sin(x * 1.3) * 1.2 ? [(x + 0.5 - cx) / large, -0.5, 0.8] : null), { motif: ruisselle });
  const sceptre = (t, mat) => {
    for (let y = 8; y < 46; y++) { const x = Math.round(43 + (46 - y) * 0.05); t.poser(x, y, mat, y % 5 ? 3 : 4); t.poser(x + 1, y, mat, 1); }
    t.forme('cristal', ellipsoide(45, 7, 2.6, 3.2), { decalage: 0.6 });
    for (const [dx, dy] of [[0, -5], [0, 5], [-5, 0], [5, 0], [-3, -3], [3, -3], [-3, 3], [3, 3]]) t.poser(45 + dx, 7 + dy, 'cristal', 5);
  };
  const brasLeve = (t, mat) => {   // le bras droit levé vers le sceptre
    traitHD(t, mat, [[cx + 6, 33], [cx + 11, 31], [cx + 14, 24]], 1.6, 0.1);
    t.forme(mat, ellipsoide(cx + 15, 23, 2, 2), { decalage: 0.3 });
  };
  const brasBas = (t, mat, cote) => traitHD(t, mat, [[cx + cote * 6, 33], [cx + cote * 9, 42], [cx + cote * 9, 52]], 1.5, -0.1);
  // un ruban qui ondule, de plus en plus fin : les mèches que le courant emporte
  const ruban = (t, mat, x0, y0, long, pente, onde, ep, graine) => {
    const pts = []; for (let k = 0; k <= 12; k++) { const u = k / 12; pts.push([x0 - u * long, y0 + u * long * pente + Math.sin(u * 5 + graine) * onde * u]); }
    for (let k = 0; k < 12; k++) traitHD(t, mat, [pts[k], pts[k + 1]], ep * (1 - k / 15), -0.1);
  };
  const cheveux = (t, mat, vole) => {
    // une chevelure ronde autour du crâne, qui tombe en nappes ondulées plus larges que les épaules ;
    // chez la dernière, elle part vers la gauche comme un courant
    t.forme(mat, (x, y) => {
      const dx = x + 0.5 - cx, dy = y + 0.5 - 20;
      if (dx * dx / 90 + dy * dy / 100 <= 1 && y < 26) return [dx / 10, dy / 10, 0.6];
      if (y >= 22 && y < 60) {
        const v = y - 22, glisse = vole ? -v * 0.35 : 0;
        const larg = 10 + Math.min(v, 10) * 0.25 - Math.max(0, v - 22) * 0.35 + Math.sin(y * 0.5) * 0.8;
        const d = dx - glisse;
        if (Math.abs(d) < larg && (vole || y < 56 - Math.abs(d) * 0.6)) return [d / 11, 0.2, 0.7];
      }
      return null;
    }, { decalage: -0.3, motif: (x, y) => ((x * 3 + Math.floor(y / 2)) % 5 === 0 ? -0.8 : (x + y) % 7 === 0 ? 0.5 : 0) });
    if (vole) { ruban(t, mat, cx - 7, 16, 16, 0.15, 3, 2.2, 0); ruban(t, mat, cx - 10, 30, 17, 0.35, 3, 2.4, 2); ruban(t, mat, cx - 18, 46, 10, 0.5, 2, 2, 4); }
  };
  // la frange sur le front, avec sa raie au milieu
  const frange = (t, mat) => t.forme(mat, (x, y) => {
    const dx = x + 0.5 - cx, dy = y + 0.5 - tete.y;
    return dx * dx / (tete.rx * tete.rx) + dy * dy / (tete.ry * tete.ry) <= 1.05 && y < 18 + Math.abs(dx) * 0.45 && Math.abs(dx) > 0.6 ? [dx / 7, -0.4, 0.8] : null;
  }, { decalage: -0.1 });
  const cou = (t, mat) => t.forme(mat, (x, y) => (y >= 27 && y < 33 && Math.abs(x + 0.5 - cx) < 2.2 ? [0, 0, 1] : null));
  const visage = (t, mat, yeux) => {
    t.forme(mat, ellipsoide(tete.x, tete.y, tete.rx, tete.ry), { decalage: 0.3 });
    for (const dx of [-2.5, 2.5]) { t.poser(Math.round(cx + dx), 22, yeux, 5); t.poser(Math.round(cx + dx), 23, yeux, 3); }
  };
  const couronne = (t, mat) => {
    for (let x = cx - 6; x <= cx + 6; x++) { t.poser(x, 15, mat, 4); t.poser(x, 16, mat, 2); }
    for (const dx of [-5, -2, 2, 5]) t.poser(cx + dx, 14, mat, 5);
    t.poser(cx, 13, mat, 5); t.poser(cx, 12, mat, 4);
  };

  for (let k = 0; k < 5; k++) {
    const t = toileDecor(NYMPHE_L, NYMPHE_H); rampes(t);
    if (k === 0) {
      // le jet d'eau et son parapluie de gouttes
      t.forme('eau', (x, y) => (y > 18 && y < sol && Math.abs(x + 0.5 - cx) < 3.2 + Math.max(0, y - sol + 12) * 0.4 ? [(x + 0.5 - cx) / 4, 0, 0.9] : null), { motif: ruisselle });
      for (let a = 0; a <= 1; a += 0.02) for (const s of [-1, 1]) { const x = Math.round(cx + s * a * 14), y = Math.round(20 - Math.sin(a * Math.PI) * 6 + a * a * 18); t.poser(x, y, 'eau', a < 0.3 ? 5 : 4); if (a < 0.5) t.poser(x, y + 1, 'eau', 3); }
      pied(t, 12); gouttes(t, 16, 950);
    } else if (k === 1) {
      t.forme('eau', (x, y) => (y > 30 && y < sol && Math.abs(x + 0.5 - cx) < 4 + (y - 30) * 0.08 ? [(x + 0.5 - cx) / 6, 0, 0.9] : null), { motif: ruisselle });
      t.forme('eau', ellipsoide(cx, 25, 7, 7.5), { decalage: 0.2 });
      for (const dx of [-3, 2]) { t.poser(cx + dx, 24, 'eau', 0); t.poser(cx + dx + 1, 24, 'eau', 0); t.poser(cx + dx, 25, 'eau', 1); }
      pied(t, 13); gouttes(t, 14, 951);
    } else if (k === 2) {
      cheveux(t, 'eau', false);
      t.forme('eau', (x, y) => robe(x, y), { motif: (x, y) => ruisselle(x, y) + plis(x, y) });
      brasBas(t, 'eau', -1); brasBas(t, 'eau', 1);
      cou(t, 'eau'); visage(t, 'eau', 'encre');
      couronne(t, 'eau');
      t.forme('eau', ellipsoide(cx, 40, 1.8, 1.8), { decalage: 1.2, bord: false });   // le joyau au cœur, qui luit
      pied(t, 15); gouttes(t, 12, 952);
    } else if (k === 3) {
      cheveux(t, 'eau', false);
      t.forme('eau', (x, y) => robe(x, y), { motif: (x, y) => ruisselle(x, y) * 0.5 + plis(x, y) });
      for (let x = cx - 7; x <= cx + 7; x++) t.poser(x, 50, 'eau', 5);   // la ceinture claire
      brasBas(t, 'eau', -1); brasLeve(t, 'eau');
      cou(t, 'eau'); visage(t, 'eau', 'encre');
      couronne(t, 'eau');
      sceptre(t, 'eau');
      pied(t, 15); gouttes(t, 10, 953);
    } else {
      cheveux(t, 'cheveuxN', true);
      t.forme('robeN', (x, y) => (y < 86 ? robe(x, y) : null), { motif: plis });
      // le bas de la robe se défait en eau
      t.forme('eau', (x, y) => (y >= 82 ? robe(x, y) : null), { motif: ruisselle });
      for (let x = cx - 7; x <= cx + 7; x++) { t.poser(x, 50, 'or', 4); t.poser(x, 51, 'or', 2); }   // la ceinture d'or
      brasBas(t, 'peauN', -1); brasLeve(t, 'peauN');
      cou(t, 'peauN'); visage(t, 'peauN', 'encre'); frange(t, 'cheveuxN');
      t.poser(cx - 1, 27, 'levres', 3); t.poser(cx, 27, 'levres', 3);
      couronne(t, 'or'); t.poser(cx, 15, 'cristal', 5); t.poser(cx, 16, 'cristal', 3);   // le diadème et sa pierre bleue
      sceptre(t, 'cristal');
      pied(t, 15); gouttes(t, 8, 954);
    }
    t.contour();
    t.texture(scene, 'nymphe_' + k);
  }
}
