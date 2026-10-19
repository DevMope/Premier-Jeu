// (v1.24, planche 50 v3) L'envie de partir : de temps en temps, JeuneGoy pense à partir à l'aventure.
// Trois temps : il rêve (15 ans, le soir à la fenêtre), il veut voir (18 ans et plus, dehors sous les
// étoiles), il veut savoir (côté ombre, chaque secret découvert la rend plus forte). Elle vient aussi
// après le récit d'un héros revenu de loin. Chaque pensée s'écrit, datée, dans le carnet de JeuneGoy (au
// bureau). Le départ, lui, viendra plus tard.
const ENVIE = {
  ecart: 6,                // au moins quelques jours entre deux pensées (sauf la carte ancienne)
  chances: { fenetre: 0.12, dehors: 0.15, heros: 0.5, secret: 0.25, marcheNoir: 0.1, carte: 1 },
  ombre: 2,                // côté ombre : deux fois plus souvent quand il s'agit de secrets
  ageVoir: 18,
};
const PENSEES = {
  reve: [
    "« Derrière les collines, il paraît qu'il y a des montagnes qui touchent le ciel... Un jour, j'irai voir. »",
    "« Les étoiles filantes tombent toutes vers l'ouest. Je me demande ce qu'il y a, là-bas. »",
    "« Garrick a vu la mer. Moi, je n'ai vu que la rue du marché. Pour l'instant. »",
    "« Chaque baluchon que je ferme part plus loin que moi... »",
    "« Un jour, ce sera moi qui pousserai la porte avec un baluchon à l'épaule. »",
  ],
  voir: [
    "« Les Pics Gelés, Khaz-Durim, la mer d'Opale... Je ne veux plus seulement les entendre raconter. Je veux les voir. »",
    "« J'ai l'âge de partir, maintenant. Qu'est-ce qui me retient ? Le comptoir... et c'est tout. »",
    "« Les routes sentent la pluie et la poussière. J'aimerais les sentir sous mes pieds. »",
    "« Je connais chaque contrée par cœur, sur la carte. Aucune pour de vrai. »",
    "« Un jour, je fermerai le comptoir pour une saison. Juste une. »",
  ],
  savoir: [
    "« Elle se souvient de ce que tout le monde a oublié... Moi aussi, je veux savoir. La vérité, je la trouverai. »",
    "« Le sceau du Conseil sur des caisses cachées... Qu'est-ce qu'on ne nous dit pas ? »",
    "« Les Bannis n'ont pas toujours été des Bannis. Qui a décidé ça ? Et pourquoi ? »",
    "« Les histoires des aventuriers ne collent pas avec celles du Conseil. Quelqu'un ment. »",
    "« Il y a un morceau du monde que personne ne montre. Je veux le voir de mes yeux. »",
  ],
  heros: [
    "« Un jour, c'est moi qui raconterai ce que j'ai vu. »",
    "« {zone}... Rien que le nom donne envie de partir. »",
    "« Il est revenu avec des étoiles plein les yeux. Je veux les mêmes. »",
  ],
  carte: [
    "« Ce chemin à l'ouest de la Muraille... Personne n'en parle jamais. Un jour, j'irai voir où il mène. »",
  ],
};

function envie(G) { G.envie = G.envie || { pensees: [] }; return G.envie; }
// Le temps de ses pensées : il rêve, il veut voir, il veut savoir
function tempsEnvie(G, moment) {
  if (moment === 'heros' || moment === 'carte') return moment;
  const secrets = (G.etrangetes || []).length;
  if (moment === 'secret' || moment === 'marcheNoir' || (secrets >= 3 && Math.random() < 0.5)) return 'savoir';
  return ageJoueur(G) >= ENVIE.ageVoir ? 'voir' : 'reve';
}
// Une pensée, peut-être (rare) : renvoie { jour, age, texte, temps } ou null. `zone` : le nom d'une contrée lointaine.
function penserAPartir(G, moment, { zone = null, force = false } = {}) {
  const E = envie(G);
  if (!force && E.dernier && G.jour - E.dernier < ENVIE.ecart && moment !== 'carte') return null;
  if (moment === 'dehors' && ageJoueur(G) < ENVIE.ageVoir && !force) moment = 'fenetre';
  let p = ENVIE.chances[moment] || 0;
  if (moment === 'dehors') p *= 1 + 0.25 * Math.max(0, ageJoueur(G) - ENVIE.ageVoir);   // (plus souvent avec l'âge)
  if ((moment === 'secret' || moment === 'marcheNoir') && typeof coteCamp === 'function' && coteCamp(G) === 'mal') p *= ENVIE.ombre;
  if (!force && Math.random() >= p) return null;
  const temps = tempsEnvie(G, moment), deja = E.pensees.map(x => x.texte);
  const choix = PENSEES[temps].map(t => t.replace('{zone}', zone || 'Là-bas'));
  const neuves = choix.filter(t => !deja.includes(t));
  const texte = auHasard(neuves.length ? neuves : choix);
  const pensee = { jour: G.jour, age: ageJoueur(G), texte, temps };
  E.pensees.push(pensee);
  E.pensees = E.pensees.slice(-40);
  E.dernier = G.jour;
  (G.penseesNouvelles = G.penseesNouvelles || []).push(pensee);   // (le bandeau l'affiche : le médaillon et la bulle)
  return pensee;
}

// --- L'affichage : JeuneGoy en médaillon (la pose « il pense »), et sa bulle de pensée ---
// Une bulle de pensée : un nuage aux bords ronds, le texte en italique, deux petits ronds vers celui qui pense
function bulleDePensee(s, x, y, texte, l = 280, vers = [1, 0], prof = 60) {
  const t = s.add.text(0, 0, texte, style(13, '#2a1a0c', { fontStyle: 'bold italic', wordWrap: { width: l - 30 }, align: 'center' })).setOrigin(0.5);
  const h = t.height + 26, g = s.add.graphics();
  const bosses = []; for (let k = 0; k < 7; k++) bosses.push([-l / 2 + 14 + k * (l - 28) / 6, -h / 2 + 4], [-l / 2 + 14 + k * (l - 28) / 6, h / 2 - 4]);
  bosses.push([-l / 2 + 4, 0], [l / 2 - 4, 0]);
  for (const [bx, by] of bosses) g.fillStyle(0x2a1a10).fillCircle(bx, by, 15);
  g.fillStyle(0x2a1a10).fillRoundedRect(-l / 2 - 2, -h / 2 - 2, l + 4, h + 4, 18);
  for (const [bx, by] of bosses) g.fillStyle(0xfff8e8).fillCircle(bx, by, 13);
  g.fillStyle(0xfff8e8).fillRoundedRect(-l / 2, -h / 2, l, h, 16);
  const [vx, vy] = vers; [[22, 8], [40, 5]].forEach(([d, r]) => { const cx = vx * (l / 2 - 30) + vx * d * 0.6, cy = vy * (h / 2 + d); g.fillStyle(0x2a1a10).fillCircle(cx, cy, r + 2).fillStyle(0xfff8e8).fillCircle(cx, cy, r); });
  return s.add.container(x, y, [g, t]).setDepth(prof).setScrollFactor(0);
}
// JeuneGoy en médaillon : la tête est mesurée dans le dessin (du haut des cheveux au menton) et posée pile au
// milieu du cercle, le poing juste dessous (planche 50 v3, validée)
function medaillonJeuneGoy(s, x, y, G, r = 40, prof = 59) {
  const c = s.add.container(x, y).setDepth(prof).setScrollFactor(0);
  c.add(s.add.circle(0, 0, r + 7, 0x2a1a10)); c.add(s.add.circle(0, 0, r + 4, 0xc9a227)); c.add(s.add.circle(0, 0, r, 0x3a4a6a));
  const cle = textureJoueurPose(s, G, 'face', 'pense'), src = s.textures.get(cle).getSourceImage();
  let cv = src; if (!src.getContext) { cv = document.createElement('canvas'); cv.width = src.width; cv.height = src.height; cv.getContext('2d').drawImage(src, 0, 0); }
  const W = cv.width, Hh = cv.height, px = cv.getContext('2d').getImageData(0, 0, W, Hh).data, plein = (xx, yy) => px[(yy * W + xx) * 4 + 3] > 0;
  const largeur = yy => { let a = -1, b = -1; for (let xx = 0; xx < W; xx++) if (plein(xx, yy)) { if (a < 0) a = xx; b = xx; } return [a, b]; };
  let haut = 0; while (haut < Hh && largeur(haut)[0] < 0) haut++;
  let large = haut, lmax = 0; for (let yy = haut; yy < Hh * 0.35; yy++) { const [a, b] = largeur(yy); if (b - a >= lmax) { lmax = b - a; large = yy; } }   // (le plus large de la tête)
  let bas = large, mini = Infinity;   // (le menton : là où la silhouette est la plus étroite, avant le cou et les épaules)
  for (let yy = large; yy < Hh * 0.6; yy++) { const [a, b] = largeur(yy), l = b - a; if (l < mini) { mini = l; bas = yy; } else if (l > mini + 4) break; }
  let ta = W, tb = 0; for (let yy = haut; yy < bas; yy++) { const [a, b] = largeur(yy); if (a >= 0) { ta = Math.min(ta, a); tb = Math.max(tb, b); } }
  const e = (1.45 * r) / Math.max(1, bas - haut);
  const j = s.add.image(0, 0, cle).setOrigin(((ta + tb + 1) / 2) / W, ((haut + bas) / 2) / Hh).setScale(e);
  const cam = s.cameras.main, mk = s.make.graphics().fillCircle(x + cam.scrollX, y + cam.scrollY, r);
  j.setMask(mk.createGeometryMask());
  c.add(j);
  c.masque = mk;
  return c;
}
