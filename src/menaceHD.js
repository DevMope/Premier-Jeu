// (v1.33, planche 39 validée) La menace sur la carte : la contrée qui rougit (halo qui bat, fumée, l'armée qui vient de
// l'est, des yeux violets dans la brume), les fils dorés des voisines conquises, la bulle « Défendre » (trois places, la
// force de l'escouade contre l'assaut, la prime) ; la contrée perdue (éteinte, le camp des pillards) et sa reprise.
(function () {
  if (typeof CarteScene === 'undefined') return;
  const P = CarteScene.prototype, dessinerZones = P.dessinerZones, choisirZone = P.choisirZone, fermerBulle = P.fermerBulle;
  // (le ruban des menaces s'efface quand une bulle s'ouvre : il la chevaucherait)
  P.fermerBulle = function () { fermerBulle.call(this); for (const r of this.rubans || []) r.setVisible(true); };

  P.dessinerZones = function () {
    dessinerZones.call(this);
    const G = this.G, M = etatMenace(G);
    for (const m of M.actives) if (zoneOuverte(G, m.zone)) sansPlanter('carteMenace', () => menaceSurCarte(this, m.zone, false));
    for (const z of Object.keys(M.perdues)) if (zoneOuverte(G, z)) sansPlanter('cartePerdue', () => menaceSurCarte(this, z, true));
    sansPlanter('rubanMenace', () => rubanMenace(this));
    for (const [z, j] of Object.entries(M.drapeaux || {})) if (G.jour - j <= 7 && zoneOuverte(G, z) && !M.perdues[z] && !menaceSur(G, z)) sansPlanter('drapeauMenace', () => drapeauTenue(this, z));
  };

  P.choisirZone = function (cle) {
    const G = this.G;
    for (const r of this.rubans || []) r.setVisible(false);
    if (!menaceSur(G, cle) && !contreePerdue(G, cle)) return choisirZone.call(this, cle);
    const z = ZONES[cle], e = this.versEcran(z.x, z.y);
    if (this.k < 0.75 || e.x < 40 || e.x > 920 || e.y < 70 || e.y > 400) { this.fermerBulle(); return this.vue(Math.max(this.k, 0.9), z.x, z.y, () => this.choisirZone(cle)); }
    this.zoneChoisie = cle;
    this.anneau.setVisible(true).setPosition(z.x, z.y);
    this.bulle.removeAll(true);
    bulleDeMenace(this, cle);
  };

  // Envoyer le voyageur choisi défendre (ou reprendre) la contrée : la suite comme une mission ordinaire
  P.envoyerMenace = function (cle, mode) {
    const v = this.selection;
    if (!v) return;
    if (mode === 'defendre') envoyerDefendre(this.G, v, cle); else envoyerReprendre(this.G, v, cle);
    Son.jouer('bouclier');
    if (!this.planification) return this.fermer({ destination: cle });
    this.place[v.id] = cle;
    const entree = this.G.file.find(x => x.voyageur === v);
    if (entree) entree.planifie = true;
    this.selection = this.voyageurs.find(x => !this.place[x.id]) || null;
    this.fermerBulle();
    this.tout();
  };
})();

// La contrée menacée (ou perdue), sur la carte
function menaceSurCarte(c, cle, perdue) {
  const G = c.G, z = ZONES[cle], p = c.pieces[cle], M = c.monde;
  if (!p || !p.pastille) return;
  // (le fanion de la conquête laisse sa place à l'étiquette de la menace)
  for (const e of c.etiquettes) if (e.o && e.o.text && /^⚑/.test(e.o.text) && Math.abs(e.o.x - (z.x + 50)) < 1 && Math.abs(e.o.y - (z.y - 22)) < 1) e.o.setVisible(false);
  const h = c.add.image(z.x, z.y, 'halo').setScale(2.1, 1.7).setTint(perdue ? 0x302028 : 0xd02010).setAlpha(perdue ? 0.6 : 0.75);
  if (!perdue) h.setBlendMode(Phaser.BlendModes.ADD);
  M.addAt(h, M.getIndex(p.ombre));
  c.tweens.add({ targets: h, alpha: perdue ? 0.45 : 0.35, duration: 700, yoyo: true, repeat: -1 });
  // la fumée qui monte
  for (let i = 0; i < 7; i++) {
    const f = c.add.circle(z.x - 30 + i * 10, z.y - 20, 6 + (i % 3) * 3, perdue ? 0x1a1414 : 0x4a4040, 0.7); M.add(f);
    c.tweens.add({ targets: f, y: f.y - 46 - i * 4, x: f.x + 10, alpha: 0, scale: 2.2, duration: 1800 + i * 160, repeat: -1, delay: i * 240 });
  }
  if (perdue) {
    p.pastille.setTint(0x9a8a80);
    // le camp des pillards : deux tentes, un feu, une bannière noire aux yeux violets
    const g = c.add.graphics(); M.add(g);
    for (const dx of [-44, 34]) g.fillStyle(0x1a1010).fillTriangle(z.x + dx - 17, z.y + 24, z.x + dx + 17, z.y + 24, z.x + dx, z.y - 1)
      .fillStyle(0xa07a4a).fillTriangle(z.x + dx - 14, z.y + 22, z.x + dx + 14, z.y + 22, z.x + dx, z.y + 2)
      .fillStyle(0x1a1010).fillTriangle(z.x + dx - 3, z.y + 22, z.x + dx + 3, z.y + 22, z.x + dx, z.y + 12);
    const ban = c.add.container(z.x - 4, z.y - 18); M.add(ban); const gb = c.add.graphics(); ban.add(gb);
    gb.fillStyle(0x2a1a10).fillRect(0, -44, 3, 44).fillStyle(0x1a1018).fillRect(3, -44, 22, 14).fillStyle(0x7a2aa0).fillCircle(10, -37, 2).fillCircle(18, -37, 2);
    c.tweens.add({ targets: ban, angle: 3, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const feu = c.add.image(z.x - 6, z.y + 22, 'halo').setScale(0.35).setTint(0xff7020).setBlendMode(Phaser.BlendModes.ADD); M.add(feu);
    c.tweens.add({ targets: feu, scale: 0.45, alpha: 0.6, duration: 260, yoyo: true, repeat: -1 });
  } else {
    // les fils dorés des voisines conquises : elles envoient des renforts
    const s = soutienVoisines(G, cle), gf = c.add.graphics(); M.addAt(gf, M.getIndex(h));
    for (const v of s.conquises) {
      const o = ZONES[v], n = Math.max(4, Math.round(Math.hypot(o.x - z.x, o.y - z.y) / 16));
      for (let i = 1; i < n; i += 2) { const a = i / n, b = (i + 1) / n; const x0 = o.x + (z.x - o.x) * a, y0 = o.y + (z.y - o.y) * a, x1 = o.x + (z.x - o.x) * b, y1 = o.y + (z.y - o.y) * b; gf.lineStyle(7, 0x4a2a08, 0.8).lineBetween(x0, y0, x1, y1).lineStyle(4, 0xf0c030, 1).lineBetween(x0, y0, x1, y1); }
    }
    c.tweens.add({ targets: gf, alpha: 0.6, duration: 900, yoyo: true, repeat: -1 });
    // l'armée qui vient de l'est : des pointillés rouges, de petites bannières noires qui avancent
    const g = c.add.graphics(); M.add(g); g.lineStyle(4, 0x8a1a10, 0.9);
    const pts = []; for (let t = 0; t <= 1.0001; t += 0.06) pts.push([z.x + 60 + t * 330, z.y + 6 + Math.sin(t * 5) * 22 + t * 30]);
    pts.forEach((q, i) => { if (i % 2 === 0 && pts[i + 1]) g.lineBetween(q[0], q[1], pts[i + 1][0], pts[i + 1][1]); });
    g.fillStyle(0x8a1a10).fillTriangle(z.x + 52, z.y + 6, z.x + 68, z.y - 2, z.x + 68, z.y + 14);
    for (const [dx, dy] of [[150, 30], [230, 22], [310, 52]]) {
      const b = c.add.container(z.x + dx, z.y + dy); M.add(b); const gb = c.add.graphics(); b.add(gb);
      gb.fillStyle(0x2a1a10).fillRect(-1, -22, 3, 24).fillStyle(0x1a1018).fillRect(2, -22, 14, 10).fillStyle(0x7a2aa0).fillCircle(7, -17, 2).fillCircle(12, -17, 2);
      c.tweens.add({ targets: b, x: b.x - 8, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }
  // des yeux violets dans la brume, qui clignent (l'Engeance : personne ne dit son nom)
  for (const [dx, dy, d] of [[-62, -34, 0], [64, -40, 500], [-70, 20, 900]]) {
    const y = c.add.container(z.x + dx, z.y + dy); M.add(y);
    y.add(c.add.image(0, 0, 'halo').setScale(0.25).setTint(0x7a2aa0).setAlpha(0.5).setBlendMode(Phaser.BlendModes.ADD));
    y.add(c.add.rectangle(-4, 0, 4, 3, 0xd8a0ff)); y.add(c.add.rectangle(4, 0, 4, 3, 0xd8a0ff));
    c.tweens.add({ targets: y, scaleY: 0.1, duration: 120, yoyo: true, repeat: -1, repeatDelay: 1600 + d, delay: d });
  }
  // l'étiquette : menacée (et dans combien de jours), perdue, ou la reprise en cours
  const m = menaceSur(G, cle), pp = contreePerdue(G, cle);
  const texte = perdue ? (repriseOuverte(G, cle) ? `⚔ À reprendre ${pp.reprise || 0}/${MENACE.perdues.retours}` : '✖ Perdue') : `⚔ Menacée · ${Math.max(0, m.bataille - G.jour)} j`;
  const t = c.add.text(z.x + 50, z.y - 22, texte, style(11, perdue ? '#e8dcd0' : '#fff4dc', { fontStyle: 'bold', backgroundColor: perdue ? '#1a1418' : '#a82010', padding: { x: 3, y: 1 } })).setOrigin(0.5);
  M.add(t); c.etiquettes.push({ o: t, etiquette: true, detail: true });
  if (!perdue) c.tweens.add({ targets: t, alpha: 0.75, duration: 500, yoyo: true, repeat: -1 });
}

// Une contrée qui a tenu : la bannière bleu et or plantée sur son médaillon, une semaine
function drapeauTenue(c, cle) {
  const z = ZONES[cle], M = c.monde, ban = c.add.container(z.x + 2, z.y - 52); M.add(ban);
  const g = c.add.graphics(); ban.add(g);
  g.fillStyle(0x5a3a1a).fillRect(-1, -6, 3, 46).fillStyle(0x2a5aa8).fillRect(2, -6, 30, 20).fillStyle(0xc9a227).fillRect(2, -6, 30, 3).fillCircle(17, 4, 4);
  c.tweens.add({ targets: ban, angle: 4, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
}

// Le ruban du haut : les contrées menacées, d'un coup d'œil (on y glisse en le touchant)
function rubanMenace(c) {
  const G = c.G, M = etatMenace(G);
  c.rubans = [];
  M.actives.filter(m => zoneOuverte(G, m.zone)).forEach((m, i) => {
    const j = Math.max(0, m.bataille - G.jour);
    const t = c.add.text(930, 64 + i * 24, `⚔ ${ZONES[m.zone].nom} menacée · bataille ${j ? `dans ${j} jour${j > 1 ? 's' : ''}` : 'cette nuit'}`,
      style(13, '#fff4dc', { fontStyle: 'bold', backgroundColor: '#8a1a10', padding: { x: 6, y: 3 } })).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    t.on('pointerdown', () => c.choisirZone(m.zone));
    c.dessus.add(t); c.rubans.push(t);
    c.tweens.add({ targets: t, alpha: 0.8, duration: 700, yoyo: true, repeat: -1 });
  });
}

// La bulle d'une contrée menacée (Défendre) ou perdue (Reprendre)
function bulleDeMenace(c, cle) {
  const G = c.G, z = ZONES[cle], v = c.selection, m = menaceSur(G, cle), pp = contreePerdue(G, cle), w = 380;
  const ct = c.add.container(0, 0), txt = (x, y, s, t, o = {}) => { const o2 = c.add.text(x, y, s, style(t, o.couleur || '#f3e6c8', { wordWrap: { width: w - 24 }, lineSpacing: 2, ...o })); ct.add(o2); return o2; };
  const fermer = c.add.text(w - 22, 0, '✕', style(14, '#c9b48a', { fontStyle: 'bold' })).setOrigin(1, 0).setInteractive({ useHandCursor: true });
  fermer.on('pointerdown', () => c.fermerBulle());
  let bas, cadre;
  const bouton = (y, libelle, couleur, f) => { const b = c.add.text(w - 24, y, libelle, style(14, '#fff4dc', { fontStyle: 'bold', backgroundColor: couleur, padding: { x: 8, y: 5 } })).setOrigin(1, 0).setInteractive({ useHandCursor: true }); b.on('pointerdown', f); ct.add(b); return b.y + b.height; };
  const refus = (y, s) => { const t = txt(w - 24, y, s, 13, { couleur: '#f0a8a0', fontStyle: 'italic', align: 'right' }).setOrigin(1, 0); return t.y + t.height; };
  if (m) {
    cadre = 0xd04030;
    txt(0, 0, `⚔ Défendre ${z.nom}  ${'★'.repeat(z.danger)}`, 14, { couleur: '#f3d98a', fontStyle: 'bold' });
    const j = m.bataille - G.jour;
    txt(0, 22, `La bataille ${j > 1 ? `dans ${j} jours` : j === 1 ? 'cette nuit' : 'cette nuit'} (jour ${m.bataille}). Trois places :`, 13, { couleur: '#f0b8a8', fontStyle: 'italic' });
    // les trois places : ceux qui sont partis, ceux qu'on a prévus ce matin, les places libres
    const ds = defenseursDe(G, cle).map(d => ({ ...d, part: true }));
    const prevus = G.file.filter(e => e.planifie && e.voyageur && e.voyageur.defense === cle && !ds.some(d => d.nom === e.voyageur.nom)).map(e => ({ nom: e.voyageur.nom, v: e.voyageur }));
    const places = [...ds, ...prevus].slice(0, MENACE.places);
    for (let i = 0; i < MENACE.places; i++) {
      const x = 58 + i * 118, y = 46, d = places[i];
      ct.add(c.add.rectangle(x, y + 44, 104, 88, 0x3b2410).setStrokeStyle(2, d ? 0xc9a227 : 0x6a5a3a));
      if (!d) { txt(x, y + 30, '+', 26, { couleur: '#8a7450', fontStyle: 'bold' }).setOrigin(0.5); txt(x, y + 60, 'un Ouvre-Route\nau comptoir', 11, { couleur: '#a89470', fontStyle: 'italic', align: 'center' }).setOrigin(0.5); continue; }
      const per = d.parti ? d.parti.voyageur : d.v;
      if (d.confrerie) { if (!c.textures.exists('embleme_conseil') && typeof creerEmblemesHD === 'function') creerEmblemesHD(c); if (c.textures.exists('embleme_conseil')) ct.add(c.add.image(x, y + 38, 'embleme_conseil').setScale(0.32)); }
      else if (per) { try { const im = c.add.image(x, y + 70, textureBusteHD(c, per)).setOrigin(0.5, 1); im.setScale(58 / im.height); ct.add(im); } catch (e) { /* (pas de buste) */ } }
      txt(x, y + 72, d.confrerie ? 'La Confrérie' : d.nom.split(' ')[0], 12, { fontStyle: 'bold' }).setOrigin(0.5, 0);
      txt(x, y + 2, d.part ? `${Math.round(d.chance * 100)} %` : 'prévu', 12, { couleur: d.part ? '#b8e0a0' : '#f3d98a', fontStyle: 'bold', backgroundColor: '#1a1008', padding: { x: 2, y: 0 } }).setOrigin(0.5, 0);
    }
    // la force de l'escouade contre l'assaut
    const libre = places.length < MENACE.places, avecLui = v && libre && !refusDefense(G, v, cle);
    const force = forceEscouade(G, cle), estime = avecLui ? forceEscouade(G, cle, 0.78) : force;
    const gy = 158, g = c.add.graphics(); ct.add(g);
    txt(0, gy - 9, "Force de l'escouade", 13);
    const X0 = 150, L = 170, xa = X0 + L * Math.min(1, m.assaut / 100);
    g.fillStyle(0x1a1008).fillRect(X0, gy - 7, L, 14);
    if (estime > force) g.fillStyle(0x6aa04a, 0.4).fillRect(X0, gy - 7, L * Math.min(1, estime / 100), 14);
    g.fillStyle(force >= m.assaut ? 0x6aa04a : 0xc89030).fillRect(X0, gy - 7, L * Math.min(1, force / 100), 14).lineStyle(2, 0xd04030).lineBetween(xa, gy - 11, xa, gy + 11);
    txt(X0 + L + 6, gy - 8, `${force} %`, 12, { couleur: force >= m.assaut ? '#b8e0a0' : '#f0d090', fontStyle: 'bold' });
    txt(xa, gy + 10, "l'assaut", 10, { couleur: '#f0a8a0', fontStyle: 'italic' }).setOrigin(0.5, 0);
    const s = soutienVoisines(G, cle);
    const lignes = [
      s.points > 0 ? `⚑ Voisines conquises (${s.conquises.length}) : +${s.points} %` : s.isolee ? `⚑ Contrée isolée : ${s.points} %` : '⚑ Aucune voisine conquise : pas de renforts',
      avecLui ? `Avec ${v.nom.split(' ')[0]} bien équipé${v.feminin ? 'e' : ''} : environ ${estime} %` : '',
      `Prime ${z.camp === 'mal' ? 'des Bannis' : 'du Conseil'} : ${MENACE.prime[z.danger] || 900} p. · +${MENACE.reputation} réputation · +1 ⚑`,
      'Chacun part avec le colis de la contrée, et un combat de plus.',
    ].filter(Boolean);
    const t = txt(0, gy + 26, lignes.join('\n'), 13);
    bas = t.y + t.height;
    if (v && j >= 1) {
      const r = refusDefense(G, v, cle);
      if (r) bas = refus(bas + 6, r);
      else if (!libre) bas = refus(bas + 6, 'Les trois places sont prises.');
      else bas = bouton(bas + 6, `Envoyer ${v.nom.split(' ')[0]} défendre ⚔`, '#8a2a1a', () => c.envoyerMenace(cle, 'defendre'));
      // (la contrée reste ouverte aux missions ordinaires)
      if (!refusZone(G, v, cle)) { const o = c.add.text(0, bas - 22, 'ou une mission ordinaire ▶', style(12, '#c9b48a', { fontStyle: 'italic' })).setInteractive({ useHandCursor: true }); o.on('pointerdown', () => c.envoyer(cle)); ct.add(o); }
    }
  } else {
    cadre = 0x6a5a58;
    txt(0, 0, `✖ ${z.nom} — perdue`, 14, { couleur: '#f3d98a', fontStyle: 'bold' });
    const prov = provisionsDeContree(cle).map(id => nomObjet(id).toLowerCase());
    const reprise = repriseOuverte(G, cle);
    const lignes = [
      `${pp.sans ? "Personne ne l'a défendue." : "L'escouade a été repoussée."} Les pillards y campent.`, '',
      "✖ Plus de missions là-bas (les Ouvre-Routes refusent d'y aller).",
      prov.length ? `✖ ${prov.join(' et ')} : +${Math.round(MENACE.perdues.hausse * 100)} % au marché.` : '',
      z.royaume && ROYAUMES[z.royaume] ? `✖ ${ROYAUMES[z.royaume].nom} ne peut plus être libéré.` : '', '',
      reprise ? `⚔ La reprise : ${pp.reprise || 0} / ${MENACE.perdues.retours} Ouvre-Routes revenus vivants. Un peu plus dure (−${pp.points * 1.5} % par épreuve).`
        : `⚔ Dans ${pp.repriseDes - G.jour} jour${pp.repriseDes - G.jour > 1 ? 's' : ''}, on pourra la reprendre.`,
      `Reprise, elle reviendra à ⚑ ${Math.max(0, pp.avant - pp.points)} / ${conqueteZone(cle)} (${pp.points} point${pp.points > 1 ? 's' : ''} perdu${pp.points > 1 ? 's' : ''}), +${MENACE.perdues.reputation} réputation.`,
    ].filter((l, i, a) => l || (a[i - 1] && a[i + 1]));
    const t = txt(0, 24, lignes.join('\n'), 13);
    bas = t.y + t.height;
    if (v && reprise) { const r = refusDefense(G, v, cle); bas = r ? refus(bas + 6, r) : bouton(bas + 6, `Envoyer ${v.nom.split(' ')[0]} reprendre ⚔`, '#5a2a6a', () => c.envoyerMenace(cle, 'reprendre')); }
  }
  ct.add(fermer);
  const h = bas + 20, e = c.versEcran(z.x, z.y), ecart = 62 * c.k;
  const bx = Phaser.Math.Clamp(e.x + (e.x > 480 ? -w / 2 - ecart : w / 2 + ecart), w / 2 + 18, 942 - w / 2);
  const by = Phaser.Math.Clamp(e.y, 54 + h / 2, 420 - h / 2);
  ct.setPosition(bx - w / 2 + 12, by - h / 2 + 10);
  c.bulle.add(c.add.rectangle(bx, by, w, h, 0x2a1a10, 0.96).setStrokeStyle(2, cadre));
  c.bulle.add(ct);
}
