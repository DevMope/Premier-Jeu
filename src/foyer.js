// (v1.05, lot B-5, planches 24 et 25 validées) Le foyer à nourrir : le bois de l'hiver et la gamelle du chat.
// - L'hiver sans bois : une nuit de Givre sans bûche, réveil fatigué (un client de moins) ; deux nuits de suite,
//   malade (le comptoir n'ouvre qu'à midi) et le chat part se réchauffer chez les voisins. On est prévenu : la
//   bûche rouge dans le bandeau, et une confirmation avant d'aller dormir.
// - La gamelle du chat : une ration tous les trois jours, prise dans ta réserve. Plus de ration : sa gamelle reste
//   vide ; au bout de trois jours il boude, puis il part un jour (un mot sur le comptoir, signé d'une patte) et
//   revient le lendemain soir comme si de rien n'était, une souris entre les dents. Il se méfie ensuite une
//   semaine (il chasse moins bien les rats, il ne sent plus venir la garde).

const FOYER = { gamelle: 3, boude: 3, part: 4, mefiance: 7, ratsMefiant: 0.5, ouvertureMalade: 12 };

// --- L'hiver sans bois ---
// (planche 85 v2) les nuits froides qu'il faut pour s'enrhumer : deux, trois dans un pyjama de laine ou de flanelle
function seuilRhume(G) { return typeof nuitsAvantRhume === 'function' ? nuitsAvantRhume(G) : 2; }
function foyerVide(G) { return typeof saisonDe === 'function' && saisonDe(G) === 'givre' && !feuAllume(G); }
function soirDuJour(G) { return G.lettresDuJour === G.jour; }
function froidDuJour(G, jour = G.jour) { return G.froid && G.froid.jour === jour ? G.froid.etat : null; }
// (v1.07) Demain se prévoit dès ce soir : sans bûche, la nuit sera froide (fatigué, ou malade si c'est la deuxième)
function nuitFroideCeSoir(G) { return saisonDe(G) === 'givre' && G.feu !== G.jour && G.banquetHiver !== G.jour + 1 && !(typeof banquetDu === 'function' && banquetDu(G)); }
function froidPrevu(G, jour = G.jour) {
  if (jour !== G.jour + 1) return froidDuJour(G, jour);
  return nuitFroideCeSoir(G) ? ((G.nuitsFroides || 0) + 1 >= seuilRhume(G) ? 'malade' : 'fatigue') : null;
}
function clientsFroid(G, jour = G.jour) { return froidPrevu(G, jour) ? -1 : 0; }
function retardFroid(G, jour = G.jour) { return froidPrevu(G, jour) === 'malade' ? Math.max(0, FOYER.ouvertureMalade - JOURNEE.ouverture) : 0; }   // (malade : on n'ouvre qu'à midi)

// --- La gamelle du chat ---
function etatGamelle(G) { const c = chatDe(G); if (c.adopte && c.repas === undefined) c.repas = c.adopteJour ?? G.jour; return c; }
function gamellePleine(G) { const c = etatGamelle(G); return c.adopte && G.jour - c.repas < FOYER.gamelle && !(c.faim > 0); }
function chatParti(G, jour = G.jour) {
  const c = G.chat;
  if (!(c && c.adopte && (c.parti === jour || c.rechauffe === jour))) return false;
  return !(jour === G.jour && soirDuJour(G));   // (v1.07 : le soir, il est rentré, comme le dit le bilan)
}
function chatBoude(G) { const c = G.chat; return !!(c && c.adopte && (c.faim || 0) >= FOYER.boude && c.parti !== G.jour); }
function chatMefiant(G) { const c = G.chat; return !!(c && c.adopte && c.mefiant >= G.jour); }
function nomChatMaj(G) { const n = nomChat(G); return n[0].toUpperCase() + n.slice(1); }

// La nuit, avant que le jour ne change : le froid et la gamelle
function nuitDuFoyer(G) {
  const froide = saisonDe(G) === 'givre' && G.feu !== G.jour && G.banquetHiver !== G.jour + 1;   // (le soir du banquet, on rentre le cœur au chaud)
  G.nuitsFroides = froide ? (G.nuitsFroides || 0) + 1 : 0;
  const c = etatGamelle(G);
  if (!c.adopte) return;
  if (c.parti === G.jour) { c.faim = 0; c.repas = G.jour; c.mefiant = G.jour + FOYER.mefiance; return; }   // (revenu ce soir : il a mangé ailleurs)
  if (G.jour - c.repas < FOYER.gamelle) return;
  if ((G.stock.ration || 0) > 0) { G.stock.ration--; c.repas = G.jour; c.faim = 0; return; }
  c.faim = (c.faim || 0) + 1;
  if (c.faim >= FOYER.part) c.parti = G.jour + 1;   // (demain matin, son panier est vide)
}

// Au réveil (G.jour est le nouveau jour) : ce que la nuit froide a laissé, le panier vide
function reveilDuFoyer(G, r) {
  const n = G.nuitsFroides || 0, c = G.chat;
  if (n) {
    // (pas de « pleine forme » après une nuit glacée)
    r.forme = null; r.lignes = r.lignes.filter(l => !l.includes('en pleine forme'));
    if (n < seuilRhume(G)) { G.froid = { jour: G.jour, etat: 'fatigue' }; r.lignes.push(`Brr... Il a gelé cette nuit, et la cheminée est restée froide. Tu te réveilles fatigué${eJ(G)}, les doigts gourds : tu serviras un client de moins aujourd'hui.` + (n > 1 ? ` Ton pyjama chaud t'a évité le rhume, cette fois.` : '')); }
    else {
      G.froid = { jour: G.jour, etat: 'malade' };
      r.lignes.push(`${n === 2 ? 'Deux' : 'Trois'} nuits sans feu${n > 2 ? ', même dans ton pyjama chaud' : ''} : tu as attrapé un mauvais rhume. Le comptoir n'ouvrira qu'à midi, et tu serviras un client de moins.`);
      if (c && c.adopte && c.parti !== G.jour) { c.rechauffe = G.jour; r.lignes.push(`${nomChatMaj(G)} est parti se réchauffer chez les voisins. Il reviendra ce soir.`); }
    }
  }
  if (c && c.adopte && c.parti === G.jour) r.lignes.push(`Au matin, le panier de ${nomChat(G)} est vide. Sur le comptoir, un petit mot griffonné...`);
}

// La ligne « Le foyer » du bilan du soir (ou null)
function ligneFoyer(G) {
  const c = G.chat;
  if (c && c.adopte) {
    const nom = nomChatMaj(G);
    if (c.parti === G.jour) return `${nom} est revenu ce soir, une souris pour toi entre les dents, comme si de rien n'était. Il se méfiera un peu de toi pendant une semaine.`;
    if ((c.faim || 0) >= FOYER.boude) return `Le foyer — ${nomChat(G)} n'a rien mangé depuis trois jours. Il te tourne le dos. Demain, il pourrait partir.`;
  }
  // (l'avertissement du froid passe avant les petites nouvelles du chat)
  if (foyerVide(G)) return 'Le foyer est vide : dehors, il gèle. Allume le feu avant de dormir (1 planche de bois).';
  if (c && c.adopte && (c.faim || 0) >= 1) return `Le foyer — la gamelle de ${nomChat(G)} est vide : plus une ration dans ta réserve.`;
  if (c && c.adopte && c.rechauffe === G.jour) return `${nomChatMaj(G)} revient, les moustaches pleines de givre : il était allé se réchauffer chez les voisins.`;
  return null;
}

// Le mot laissé sur le comptoir, le matin où le chat est parti (une fois)
function motDuChatDu(G) { const c = G.chat; return !!(c && c.adopte && c.parti === G.jour && c.motVu !== G.jour); }
function montrerMotDuChat(scene) {
  const G = window.GAME, c = G.chat;
  c.motVu = G.jour;
  const voile = scene.add.rectangle(480, 270, 960, 540, 0x0a0604, 0.6).setDepth(80).setInteractive();
  const narration = texteMixte(scene, 480, 70, "Sur le comptoir, un petit mot griffonné... et une empreinte de patte. (Qui a bien pu l'écrire ?)", { taille: 15, largeur: 760, align: 'center', extra: { stroke: '#0a0604', strokeThickness: 4 } }).setOrigin(0.5, 0.5).setDepth(82);
  const papier = scene.add.container(480, 280).setDepth(81).setAngle(-3);
  const g = scene.add.graphics(); g.fillStyle(0x3a2a18, 0.4).fillRect(-146, -86, 300, 182).fillStyle(0xf4ead2).fillRect(-150, -90, 300, 180).lineStyle(1, 0xc8b890).strokeRect(-150, -90, 300, 180);
  papier.add(g);
  papier.add(scene.add.text(0, -24, 'Parti voir ailleurs.\nPas de ration, pas de chat.', { fontFamily: '"IM Fell English SC", Georgia, serif', fontSize: '22px', color: '#2a1e14', align: 'center', lineSpacing: 6 }).setOrigin(0.5));
  papier.add(scene.add.text(-86, 62, c.nom ? `— ${c.nom.trim()[0].toUpperCase()}.` : '—', { fontFamily: '"IM Fell English SC", Georgia, serif', fontSize: '20px', color: '#2a1e14' }).setOrigin(0.5));
  const patte = scene.add.graphics(); patte.fillStyle(0x4a2a18).fillEllipse(0, 6, 22, 18); for (const [px, py] of [[-12, -8], [-4, -14], [5, -14], [13, -8]]) patte.fillEllipse(px, py, 7, 9);
  patte.setPosition(96, 52); papier.add(patte);
  papier.setScale(0.2).setAlpha(0);
  scene.tweens.add({ targets: papier, scale: 1, alpha: 1, duration: 450, ease: 'Back.easeOut' });
  Son.jouer('page');
  const indice = scene.add.text(950, 530, '▶ clique pour continuer', style(12, '#d6bf98', { fontStyle: 'italic' })).setOrigin(1, 1).setDepth(82);
  scene.time.delayedCall(600, () => voile.once('pointerdown', () => { for (const o of [voile, narration, papier, indice]) o.destroy(); }));
}
