// (v1.65, la ville des Hobbits en quartiers, chantier 3) La rue Soucolline, à pied : le vrai quartier du comptoir, au zoom
// et avec le socle des quartiers (QuartierScene.js), dessiné par quartierSoucolline.js. Elle remplace la rue d'avant, vue
// de côté (v0.65 à v1.64), et en garde tout ce qu'elle faisait :
//   - au sortir de chez soi, le matin, on y arrive par sa porte ; on y revient de la place par le porche, de la banque,
//     du barbier, des Mages, de la tente d'Ysmée par leur porte (QuartierScene.ouvrirPage) ;
//   - les passants vont et viennent, on leur parle ; quelqu'un se repose sur le banc, puis repart à pied ; le neutre qui
//     paie les deux camps voit passer des patrouilles mêlées (un garde et un Banni) ;
//   - le matin du jour 1, avec le didacticiel, Garrick t'accompagne jusqu'au porche ; le jour où il ouvre, Orvin attend sur
//     le pas de sa porte ;
//   - le soir (la promenade, data.nuit) : la même rue, à la nuit ; on y sort par la porte du comptoir, on s'assoit sur le
//     banc, le chat de gouttière attend certains soirs, ton chat te suit ; la porte dérobée de l'impasse, la banque, la
//     lueur de la fontaine sous le porche ; on rentre par sa porte, ou la promenade s'arrête (« ◀ Retour »).
// À Pont-Royal, la rue est celle du pont (RuePontScene, plus bas : la rue d'avant, de côté).
// Phaser réutilise la scène : tout l'état est remis à zéro dans create().
class RueScene extends QuartierScene {
  constructor() { super('Rue'); }

  init(data) {
    const d = data || {};
    this.depuis = d.depuis || 'shop';
    // (d'où l'on vient : la porte de chez soi, le porche de la place, la porte des Mages ; après la marche d'essai, devant le comptoir)
    const arrivee = d.arrivee || { marche: 'arche', place: 'arche', mages: 'mages', essai: 'apresEssai' }[this.depuis] || 'comptoir';
    this.donnees = { ...d, quartier: 'soucolline', arrivee };
    this.musiqueVoulue = d.nuit ? 'nuit' : null;
  }

  create() {
    const G = window.GAME;
    // (v1.57) à Pont-Royal : la rue sur le pont
    if (G && typeof aPontRoyal === 'function' && aPontRoyal(G)) { this.heros = null; this.monde = null; this.scene.start('RuePont', this.donnees); return; }
    this.garrick = null; this.orvin = null; this.orvinSalue = false; this.visiteurBanc = null; this.duo = null; this.compagnon = null; this.gouttiere = null;
    this.assis = null; this.boutonsChat = null; this.traceHeros = []; this.pense = null; this.retour = this.donnees.retour || 'Promenade';
    super.create();
    const P = this.passages, L = LOTS_SOUCO, YN = SOUCO.YN;
    if (!this.nuit) {
      // (v1.40) le matin du jour 1, avec le didacticiel : Garrick t'accompagne jusqu'à la place
      if (typeof didacticiel === 'function' && didacticiel(G) && G.tuto && G.jour === 1 && this.depuis !== 'marche') {
        this.garrick = this.marcheur('mentor', this.heros.x - 50, this.heros.y + 10);
        this.time.delayedCall(700, () => this.parleMonde(this.garrick, "« Allez, en route ! La place des Mastres, c'est au bout de la rue, sous le porche. Suis-moi, je te présente les marchands. »", 'Garrick'));
      }
      // (v1.48) le jour où il ouvre (et tant qu'on n'est pas entré), Orvin attend sur le pas de sa porte
      const pb = P.find(q => q.id === 'barbier');
      if (pb && typeof etatBarbier === 'function' && !etatBarbier(G).vu) {
        const o = this.orvin = imageCorps(this, pb.devant[0] + 40, YN + 30, FIGURANT_BARBIER, this.R.echelle, 'accueil').setFlipX(true);
        o.yTri = YN + 30; o.passant = true; this.monde.add(o); this.ici.ombre(o.x, o.y, 40);
        this.tweens.add({ targets: o, scaleY: o.scaleY * 1.012, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });   // (Q165 : il respire)
        this.ici.obstacles.push([o.x - 14, YN + 18, o.x + 14, YN + 36]); this.grilleQ = null;
        o.setInteractive({ useHandCursor: true }).on('pointerdown', () => { if (!this.bloque()) this.partirVers(pb.devant[0], pb.devant[1], pb); });
      }
      // (v0.68, v1.61) quelqu'un vient se reposer sur le banc, de temps en temps, à pied, puis repart
      this.time.addEvent({ delay: 9000, startAt: 8000, loop: true, callback: () => this.reposBanc() });
      if (Math.random() < 0.6) this.time.delayedCall(1500, () => this.reposBanc());
      // (v1.32, le mécénat) des pétales qui volent sur la rue
      if (typeof palierDuMecenat === 'function' && palierDuMecenat(G, 'titre')) this.time.addEvent({ delay: 420, loop: true, callback: () => {
        if (this.planVille) return;
        const pe = this.add.rectangle(Math.random() * 960, 30, 3, 3, Math.random() < 0.5 ? 0xf4c0d0 : 0xfff0a0).setDepth(1.6);
        this.tweens.add({ targets: pe, y: 480, x: pe.x + 80, angle: 360, duration: 6000 + Math.random() * 3000, onComplete: () => pe.destroy() });
      } });
      // (v1.32) le neutre qui paie les deux camps : un garde et un Banni font la ronde ensemble
      if (typeof palierDuMecenat === 'function' && palierDuMecenat(G, 'passeur')) this.time.delayedCall(2500, () => this.patrouille());
    } else {
      // le soir : ton chat te suit dehors ; certains soirs, le chat de gouttière attend devant ta porte
      if (typeof chatAdopte === 'function' && chatAdopte(G) && !(typeof chatParti === 'function' && chatParti(G))) this.creerCompagnon();
      if (typeof chatCeSoir === 'function' && chatCeSoir(G)) this.chatDeGouttiere();
      // le banc : on peut s'y asseoir un moment, regarder les étoiles
      const b = this.bancRue; this.ici.regarder(b.x - 54, b.y - 40, b.x + 54, b.y + 4, () => { this.asseoir(); return null; }, [b.x, b.y + 22]);
      // (v1.24, planche 50 v3) dehors sous les étoiles, il pense parfois à partir (sa pensée vient après le nom de la rue)
      if (typeof penserAPartir === 'function') this.time.delayedCall(4000, () => { if (this.fini || !this.heros.active || !penserAPartir(G, 'dehors')) return; if (!this.cible && !this.arrivant && !this.assis) { this.heros.setTexture(textureJoueurPose(this, G, 'face', 'pense')); this.pense = this.time.now; } });
    }
  }

  // Le soir, en bas : « Rentrer » (par ta porte, dans le comptoir) et « ◀ Retour » (la promenade s'arrête)
  boutonsDuBas() {
    if (!this.nuit) return super.boutonsDuBas();
    return [[640, 170, 'Rentrer', () => { const p = this.passages.find(q => q.id === 'comptoir'); if (p && !this.bloque()) { this.seLever(); this.partirVers(p.devant[0], p.devant[1], p); } }], [840, 210, '◀ Retour', () => this.finPromenade()]];
  }
  bloque() { return super.bloque() || !!this.boutonsChat; }

  // --- Le soir : rentrer, finir la promenade, la porte dérobée ---
  promenade() { const p = this.scene.get(this.retour); return p && p.sys && (p.sys.isPaused() || p.sys.isSleeping()) ? p : null; }
  rentrerDeLaPromenade() {
    const pr = this.promenade();
    this.fini = true; this.scene.stop();
    if (pr) { pr.scene.resume(); if (pr.revenirDeLaRue) pr.revenirDeLaRue(); }
    else this.scene.launch('Nuit', { matin: false });
  }
  finPromenade() {
    if (this.bloque()) return;
    this.seLever(); this.fini = true;
    fermerEnNoir(this, 'porte', () => {
      const pr = this.promenade(), nuit = this.scene.get('Nuit');
      if (nuit && nuit.lieu && this.G) Sauvegarde.planifier(this.G, nuit.lieu);
      this.scene.stop();
      if (pr) { pr.fini = true; pr.scene.stop(); }
      if (nuit && nuit.sys.isPaused()) { nuit.scene.resume(); if (nuit.G && nuit.tout) nuit.tout(); } else this.scene.launch('Nuit', { matin: false });
    });
  }
  allerAuMarcheNoir() {
    const pr = this.promenade(), nuit = this.scene.get('Nuit');
    if (nuit && nuit.lieu && this.G) Sauvegarde.planifier(this.G, nuit.lieu);
    this.fini = true; this.scene.stop();
    if (pr) { pr.fini = true; pr.scene.stop(); }
    this.scene.launch('MarcheNoir');
  }

  // --- Chaque image : ce qui vit en plus dans la rue ---
  apresImage(temps, dt) {
    super.apresImage(temps, dt);
    const h = this.heros;
    if (!h || !h.active) return;
    // la trace de JeuneGoy (Garrick et ton chat le suivent pas à pas, par où il est passé : jamais à travers un mur)
    const t = this.traceHeros, d = t.length ? Math.hypot(h.x - t[t.length - 1][0], h.y - t[t.length - 1][1]) : 99;
    if (d > 6) { t.push([h.x, h.y]); if (t.length > 80) t.shift(); }
    if (this.garrick) this.suivreTrace(this.garrick, 60, 0.3 * dt);
    if (this.compagnon) this.suivreTrace(this.compagnon, 40, 0.34 * dt);
    if (this.duo) this.majDuo(dt);
    if (this.visiteurBanc) this.majVisiteur(dt);
    // le pas sur place, debout : s'il était assis et qu'on le fait marcher, il se lève
    if (this.assis && (this.cible || this.enPassage)) this.seLever();
    if (this.assis && this.touches && ['left', 'right', 'up', 'down'].some(k => this.touches[k].isDown)) this.seLever();
    if (this.pense && (this.pasHeros || this.time.now - this.pense > 6000)) { this.pense = null; if (!this.assis) this.poserHeros(0); }
    // Orvin salue quand on approche
    if (this.orvin && !this.orvinSalue && Math.hypot(h.x - this.orvin.x, h.y - this.orvin.y) < 340) {
      this.orvinSalue = true;
      this.dire(etatBarbier(this.G).anniversaire === false ? "Orvin : « Bienvenue au Fil d'Argent ! Je viens de m'installer : le premier rasage est pour moi. Entre, l'ami ! »" : "Orvin : « Dix-huit ans ! J'attendais ce jour pour ouvrir : le premier rasage est pour moi. Entre, l'ami ! »");
    }
    for (const o of [this.garrick, this.compagnon]) if (o && o.bulle && o.bulle.active) o.bulle.setPosition(o.x, o.y - o.displayHeight - 8);
  }

  // Un personnage qui marche dans la rue (posé par les pieds, son ombre, ses images de pas) : quoi = un figurant ou un peuple
  marcheur(quoi, x, y) {
    const cle = corpsHD(this, quoi, null, 'face');
    const o = this.add.image(x, y, cle).setOrigin(0.5, 1).setScale(this.R.echelle * echelleCorps(cle));
    o.quoi = quoi; o.vue = 'face'; o.pas = 0; o.ombre = this.ici.ombre(x, y, 40); o.passant = true; o.yTri = y;
    this.monde.add(o);
    this.tweens.add({ targets: o, scaleY: o.scaleY * 1.012, duration: 1450, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });   // (Q165 : arrêté, il respire)
    return o;
  }
  // Un pas de marcheur vers (tx, ty) à la vitesse v : sa vue, ses images de pas, son ombre ; rend vrai s'il a bougé
  pasVers(o, tx, ty, v, dt) {
    const rx = tx - o.x, ry = ty - o.y, d = Math.hypot(rx, ry);
    if (d < 1.5) return false;
    const k = Math.min(1, v / d); o.x += rx * k; o.y += ry * k; o.yTri = o.y;
    o.vue = this.vueSelon(rx, ry); o.pas += dt;
    if (o.chat) { o.etape = Math.floor(o.pas / 110) % 4; o.setTexture(o.chat + '_m' + o.etape).setFlipX(rx < 0); }
    else { const base = corpsHD(this, o.quoi, null, o.vue), f = Math.floor(o.pas / 150) % 4, kk = f === 1 ? base + '_pas1' : f === 3 ? base + '_pas2' : base; o.setTexture(this.textures.exists(kk) ? kk : base).setFlipX(o.vue === 'profil' && rx < 0); }
    if (o.ombre) { o.ombre.setPosition(o.x + 2, o.y - 2); o.ombre.yTri = o.y - 0.5; }
    return true;
  }
  // Suivre JeuneGoy à `ecart` pas derrière lui, sur sa trace ; arrêté, on se tourne vers lui (le chat s'assoit, sa queue bat)
  suivreTrace(o, ecart, v) {
    const t = this.traceHeros, h = this.heros;
    let i = t.length - 1, reste = ecart;
    while (i > 0 && reste > 0) { reste -= Math.hypot(t[i][0] - t[i - 1][0], t[i][1] - t[i - 1][1]); i--; }
    const c = t.length && Math.hypot(h.x - o.x, h.y - o.y) > ecart * 0.8 ? t[Math.max(0, i)] : null;
    if (c && this.pasVers(o, c[0], c[1], v, 16)) return;
    o.pas = 0;
    if (o.chat) { o.temps = (o.temps || 0) + 16; if (o.temps > 420) { o.temps = 0; o.etape = ((o.etape || 0) + 1) % 2;
      // (Q172, proposition 5) assis, il bat de la queue, cligne des yeux, fait parfois sa toilette (gestesChatAssis)
      if (typeof gestesChatAssis === 'function') gestesChatAssis(this, o.chat);
      const g = this.textures.exists(o.chat + '_leche') ? (o.toilette > 0 ? (o.toilette-- % 2 ? '_leche' : '_cligne') : Math.random() < 0.08 ? '_cligne' : '_assis' + o.etape) : '_assis' + o.etape;
      if (!o.toilette && Math.random() < 0.035) o.toilette = 8;
      o.setTexture(o.chat + g).setFlipX(h.x < o.x); } }
    else if (o.vue !== 'face') { o.vue = 'face'; o.setTexture(corpsHD(this, o.quoi, null, 'face')).setFlipX(false); }
  }
  // Une bulle de parole au-dessus d'un personnage du monde (Garrick...), qui le suit
  parleMonde(o, texte, nom = 'Garrick') {
    if (!o || !o.active) return;
    if (o.bulle) o.bulle.destroy();
    Son.jouer('voix', { personne: { nom, race: 'humain' }, ton: 'content', duree: 1.4 });
    const b = o.bulle = this.add.text(o.x, o.y - o.displayHeight - 8, texte, style(12, '#2a1a0c', { backgroundColor: '#fff8e8', padding: { x: 8, y: 5 }, wordWrap: { width: 260 }, align: 'center' })).setOrigin(0.5, 1).setScale(0);
    b.yTri = 1e6 + 2; this.monde.add(b);
    this.tweens.add({ targets: b, scale: 1 / this.monde.scaleX, duration: 180, ease: 'Back.easeOut' });
    this.time.delayedCall(Math.max(3500, texte.length * 55), () => { if (b.active) this.tweens.add({ targets: b, alpha: 0, duration: 300, onComplete: () => b.destroy() }); });
  }

  // --- (v0.68, v1.61) Le banc : quelqu'un arrive à pied, s'assoit, puis se lève et repart, jusqu'au bout de la rue ---
  reposBanc() {
    if (this.nuit || this.visiteurBanc || this.bloque() || Math.random() < 0.5) return;
    const race = auHasard(['humain', 'humain', 'hobbit', 'nain', 'elfe', 'magicienne']);
    const quoi = { nom: auHasard(NOMS_PASSANTS_RUE) + ' ' + Math.floor(Math.random() * 99), race, niveau: auHasard(['novice', 'aguerri']), feminin: Math.random() < 0.5 };
    // (il arrive d'un bout de la rue, hors de la vue)
    const b = this.bancRue, depart = Math.random() < 0.5 ? [-200, 1650] : [2300, 1660], o = this.marcheur(quoi, ...depart);
    o.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.visiteurParle());
    o.etat = 'vient'; o.chemin = this.itineraire(o.x, o.y, b.x, b.y + 16); o.attente = 0;
    this.visiteurBanc = o;
  }
  majVisiteur(dt) {
    const o = this.visiteurBanc, b = this.bancRue;
    if (!o.active) { this.visiteurBanc = null; return; }
    if (o.etat === 'assis') {
      o.attente -= dt;
      if (o.attente <= 0 && !(o.bulle && o.bulle.active)) {   // il se lève, et repart à pied jusqu'au bout de la rue
        const d = this.marcheur(o.quoi, b.x + 30, b.y + 16); d.ombre.destroy(); d.ombre = o.ombre; if (d.ombre) d.ombre.setVisible(true);
        d.etat = 'part'; d.chemin = this.itineraire(d.x, d.y, Math.random() < 0.5 ? -250 : 3870, 1655);
        d.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.visiteurParle());
        o.destroy(); this.visiteurBanc = d;
      }
      return;
    }
    const c = o.chemin && o.chemin[0];
    if (!c) {
      if (o.etat === 'vient') {   // il s'assoit
        o.etat = 'assis'; o.attente = 9000 + Math.random() * 12000;
        // (assis : le corps assis de la rue d'avant, posé par les pieds, devant l'assise)
        const a = imageCorps(this, b.x + (Math.random() < 0.5 ? -20 : 20), b.y - 2, o.quoi, this.R.echelle, 'assis');
        a.quoi = o.quoi; a.etat = 'assis'; a.attente = o.attente; a.passant = true; a.yTri = b.y + 1; a.pas = 0; a.ombre = o.ombre; this.monde.add(a);
        a.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.visiteurParle());
        this.tweens.add({ targets: a, scaleY: a.scaleY * 1.012, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });   // (Q165 : assis, il respire)
        if (a.ombre) a.ombre.setVisible(false);
        o.destroy(); this.visiteurBanc = a;
      } else { if (o.ombre) o.ombre.destroy(); if (o.bulle) o.bulle.destroy(); o.destroy(); this.visiteurBanc = null; }
      return;
    }
    if (!this.pasVers(o, c[0], c[1], 0.07 * dt, dt)) o.chemin.shift();
  }
  visiteurParle() {
    const o = this.visiteurBanc; if (!o || this.bloque()) return;
    if (o.etat !== 'assis') return this.passantDeRue(o);
    this.partirVers(o.x + 60, this.bancRue.y + 24);
    this.direMonde(o, `« ${auHasard(['Belle journée, hein ? Je me pose deux minutes, mes pieds n\'en peuvent plus.', 'Je regarde passer les aventuriers. Il en part tous les jours, de chez toi !', 'Chut... j\'écoute les potins du marché.', 'Ce banc est le meilleur du village. Ne le dis à personne.'])} »`);
  }
  passantDeRue(o) { this.direMonde(o, typeof phrasePassant === 'function' ? phrasePassant(this.G) : 'Belle journée, hein ?'); }
  direMonde(o, texte) {
    if (o.bulle && o.bulle.active) return;
    Son.jouer('voix', { personne: { nom: o.quoi.nom, race: o.quoi.race, feminin: o.quoi.feminin }, ton: Phaser.Utils.Array.GetRandom(['content', 'rire', 'etonne', 'neutre']) });
    const b = o.bulle = this.add.text(o.x, o.y - o.displayHeight - 8, texte, style(12, '#3b2410', { fontStyle: 'italic', backgroundColor: '#f3e6c8', padding: { x: 8, y: 5 }, wordWrap: { width: 240 }, align: 'center' })).setOrigin(0.5, 1).setScale(0);
    b.yTri = 1e6 + 2; this.monde.add(b);
    this.tweens.add({ targets: b, scale: 1 / this.monde.scaleX, duration: 180, ease: 'Back.easeOut' });
    const suivre = () => { if (b.active && o.active) b.setPosition(o.x, o.y - o.displayHeight - 8); };
    this.events.on('update', suivre); this.events.once('shutdown', () => this.events.off('update', suivre));
    this.time.delayedCall(Math.max(2800, texte.length * 55), () => { this.events.off('update', suivre); if (b.active) this.tweens.add({ targets: b, alpha: 0, duration: 300, onComplete: () => b.destroy() }); });
  }

  // --- (v1.32) Une patrouille mêlée : le capitaine de la garde et le percepteur des Bannis, côte à côte, d'un bout à l'autre ---
  patrouille() {
    if (this.nuit || this.duo || typeof PERCEPTEUR_BANNI === 'undefined' || typeof GARDE === 'undefined') return;
    const sens = Math.random() < 0.5 ? 1 : -1, x0 = sens > 0 ? -200 : 3860, y = 1655;
    const a = this.marcheur(GARDE.capitaine, x0, y), b = this.marcheur(PERCEPTEUR_BANNI, x0 - sens * 46, y + 10);
    for (const o of [a, b]) o.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.passantDeRue(o));
    this.duo = { a, b, x1: sens > 0 ? 3880 : -300, sens };
  }
  majDuo(dt) {
    const D = this.duo;
    if (!D.a.active) { this.duo = null; return; }
    if (D.a.bulle && D.a.bulle.active || D.b.bulle && D.b.bulle.active) return;   // (ils s'arrêtent pour parler)
    const ok = this.pasVers(D.a, D.x1, 1655, 0.07 * dt, dt); this.pasVers(D.b, D.a.x - D.sens * 46, 1665, 0.075 * dt, dt);
    if (!ok) { for (const o of [D.a, D.b]) { if (o.ombre) o.ombre.destroy(); o.destroy(); } this.duo = null; this.time.delayedCall(30000 + Math.random() * 30000, () => this.sys.isActive() && this.patrouille()); }
  }

  // --- Le soir : ton chat, le chat de gouttière, le banc ---
  creerCompagnon() {
    const G = this.G, k = creerChatHD(this, lookChat(G)), h = this.heros;
    const c = this.compagnon = this.add.image(h.x - 34, h.y + 6, k + '_assis0').setOrigin(0.5, 1).setScale(1.4);
    c.chat = k; c.etape = 0; c.temps = 0; c.pas = 0; c.passant = true; c.yTri = c.y; c.ombre = this.ici.ombre(c.x, c.y, 26); this.monde.add(c);
    c.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
      if (this.bloque()) return;
      if (typeof chatBoude === 'function' && chatBoude(G)) { Son.jouer('grogne'); return this.dire(`${nomChatMaj(G)} te tourne le dos. « Rrrr. » Sa gamelle est vide depuis trois jours...`); }
      Son.jouer('miaou');
      this.dire(`${nomChat(G)} ronronne et se frotte contre ta jambe.`);
      if (typeof caresserChat === 'function' && caresserChat(G)) { const m = this.monde; gainEnDirect(this, m.x + c.x * m.scaleX, m.y + (c.y - 50) * m.scaleY, '+1 ♥ complicité', true); }
      this.boutonsChat = true;
      ouvrirPanneauChat(this, { quandFini: () => { this.boutonsChat = null; c.chat = creerChatHD(this, lookChat(G)); c.setTexture(c.chat + '_assis0'); } });
    });
  }
  // (v0.65) Le chat de gouttière, certains soirs, assis sur les pavés devant ta porte ; trois soirs de rations, et il t'adopte
  chatDeGouttiere() {
    const G = this.G, x = this.porteComptoir.cx - 96, y = SOUCO.YN + 40;
    creerChatRueHD(this);
    const c = this.gouttiere = this.add.image(x, y, 'chatRue_assis0').setOrigin(0.5, 1).setScale(1.4).setFlipX(true);
    c.yTri = y; c.passant = true; c.ombre = this.ici.ombre(x, y, 26); this.monde.add(c);
    this.ici.obstacles.push([x - 14, y - 10, x + 14, y + 4]); this.grilleQ = null;
    vieDuChatAssis(this, c, 'chatRue', () => !c.occupe);   // (Q165) la queue bat, il cligne des yeux, fait sa toilette
    const coeurs = () => '♥'.repeat(chatDe(G).soirs.length) + '♡'.repeat(CHAT.soirsPourAdopter - chatDe(G).soirs.length);
    c.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
      if (this.bloque() || c.occupe) return;
      this.partirVers(x + 50, y + 8);
      if (chatDe(G).soirs.includes(G.jour)) return this.dire(`Il a eu sa ration ce soir. Il fait sa toilette sans te quitter des yeux. ${coeurs()}`);
      Son.jouer('miaou');
      this.dire(`Un chat de gouttière, maigre et sale. Il te fixe de ses yeux verts... ${coeurs()}`);
      this.choixChat([`Lui donner une ration (${G.stock.ration || 0})`, () => this.nourrir(c)], ['Le laisser', () => this.dire('Il te suit du regard pendant que tu t\'éloignes.')]);
    });
  }
  choixChat(...options) {
    if (Array.isArray(this.boutonsChat)) for (const b of this.boutonsChat) { b.fond.destroy(); b.label.destroy(); }
    this.boutonsChat = options.map(([texte, action], i) => {
      const b = creerBouton(this, 480 + (i - (options.length - 1) / 2) * 280, 420, 260, texte, () => { for (const o of this.boutonsChat) { o.fond.destroy(); o.label.destroy(); } this.boutonsChat = null; action(); });
      b.fond.setDepth(46); b.label.setDepth(47);
      return b;
    });
  }
  async nourrir(c) {
    const G = this.G, r = nourrirChat(G);
    if (r.erreur) { Son.jouer('refus'); return this.dire(r.erreur); }
    c.occupe = true; Son.jouer('glisse');
    const ration = this.add.image(c.x - 22, c.y - 2, iconeObjet(this, 'ration')).setOrigin(0.5, 1).setScale(1.2); ration.yTri = c.y - 0.2; this.monde.add(ration);
    const pause = ms => new Promise(f => this.time.delayedCall(ms, f));
    c.setTexture('chatRue_tapi');
    this.tweens.add({ targets: c, y: c.y + 1.5, duration: 160, yoyo: true, repeat: 6 });
    this.tweens.add({ targets: ration, alpha: 0, scale: 0.6, duration: 1800 });
    await pause(1900); if (!c.active) return;
    ration.destroy();
    // (v0.68) repu, il pense à toi : une petite bulle de pensée heureuse
    creerIconesHD(this); const m = this.monde;
    bullePensee(this, m.x + c.x * m.scaleX, m.y + (c.y - c.displayHeight - 4) * m.scaleY, 'hd_coeur', { echelle: 1.8, profondeur: 44, cote: c.flipX ? -1 : 1, duree: 2000 });
    const aller = (vx, vy, vitesse = 0.12) => new Promise(f => { c.occupe = true; const fin = () => { c.ombre && c.ombre.setPosition(c.x + 2, c.y - 2); f(); };
      const pas = this.time.addEvent({ delay: 16, loop: true, callback: () => { if (!c.active) { pas.remove(); return fin(); } c.pas = (c.pas || 0) + 16; const rx = vx - c.x, ry = vy - c.y, d = Math.hypot(rx, ry);
        if (d < 2) { pas.remove(); return fin(); } const k = Math.min(1, vitesse * 16 / d); c.x += rx * k; c.y += ry * k; c.yTri = c.y; c.setTexture('chatRue_m' + (Math.floor(c.pas / 110) % 4)).setFlipX(rx < 0); if (c.ombre) c.ombre.setPosition(c.x + 2, c.y - 2); } }); });
    const h = this.heros;
    if (!r.adopte) {
      if (r.soirs >= 2) { await aller(h.x - 26, h.y + 2); Son.jouer('miaou'); await pause(700); }
      this.dire(r.soirs >= 2 ? 'Il mange, puis se frotte contre ta jambe avant de filer dans la nuit. ♥♥♡' : 'Il dévore la ration... et file dans la nuit sans un regard. ♥♡♡');
      await aller(c.x - 260, SOUCO.YN + 60, 0.16);
      if (c.queue) c.queue.remove(); if (c.ombre) c.ombre.destroy(); c.destroy(); this.gouttiere = null;
      return;
    }
    // Le troisième soir : il te suit jusqu'à la porte... et entre.
    await aller(h.x - 26, h.y + 2);
    Son.jouer('miaou');
    this.dire('Il mange, se frotte contre tes jambes... et te suit jusqu\'à la porte ! ♥♥♥');
    await pause(1600);
    if (c.queue) c.queue.remove(); if (c.ombre) c.ombre.destroy(); c.destroy(); this.gouttiere = null;
    this.boutonsChat = true;
    ouvrirPanneauChat(this, { adoption: true, quandFini: () => {
      this.boutonsChat = null;
      this.creerCompagnon();
      this.dire(`${nomChat(G)} est chez lui. Il a déjà choisi le coussin de l'arrière-boutique... et plus un rat n'osera entrer.`);
    } });
  }
  // (v0.68) S'asseoir sur le banc : il y va, s'assoit ; un clic ailleurs ou une flèche, et il se relève
  asseoir() {
    if (this.assis || this.bloque()) return;
    const b = this.bancRue, cle = textureJoueurAssis(this, this.G), h = this.heros;
    this.assis = { y: h.y };
    h.setTexture(cle).setPosition(b.x, b.y - 2).setFlipX(false); h.setOrigin(0.5, PIEDS_ASSIS[cle] ? (PIEDS_ASSIS[cle] + 1) / h.height : 1);
    h.yTri = b.y + 1; this.ombreHeros.setVisible(false);
    this.dire(Phaser.Utils.Array.GetRandom(['Tu t\'assois un moment sur le banc. Le ciel est plein d\'étoiles.', 'Un banc, la nuit, et le silence du village. Tu respires.', 'Tu t\'assois. Au loin, un hibou. La journée a été longue.']));
  }
  seLever() {
    if (!this.assis) return;
    const b = this.bancRue; this.assis = null;
    this.heros.setOrigin(0.5, 1).setPosition(b.x, b.y + 22); this.ombreHeros.setVisible(true); this.poserHeros(0);
  }
  // (assis, il ne se pose pas comme debout)
  poserHeros(pas) { if (this.assis) return; super.poserHeros(pas); }
  arreterPas() { if (this.assis) return; super.arreterPas(); }
}

const NOMS_PASSANTS_RUE = ['Passant', 'Passante', 'Voyageur', 'Colporteur', 'Badaud'];

// (v1.57, planche 75 v2) La rue sur le pont de Pont-Royal (la rue d'avant, vue de côté) : à gauche le tonnelier, ta maison
// sur son lot, la maison rose et la Halle des Bateliers ; derrière le parapet, le fleuve, l'autre rive et la citadelle.
class RuePontScene extends Phaser.Scene {
  constructor() { super('RuePont'); }

  init(data) { this.depuis = (data && data.depuis) || 'shop'; }

  create() {
    const G = this.G = window.GAME;
    this.fini = false; this.transition = false;
    if (typeof ouvrirDuNoir === 'function') ouvrirDuNoir(this, 400); else this.cameras.main.fadeIn(400);
    const sol = 470;
    const ici = {
      regarder: (x, y, l, h, texte) => {
        const z = this.add.rectangle(x + l / 2, y + h / 2, l, h, 0xffffff, 0).setDepth(8.4).setInteractive({ useHandCursor: true });
        z.on('pointerdown', () => { this.allerVers(x + l / 2); this.dire(texte); });
      },
      porte: (x, s, etiquette, page, { large = 80, haut = 110 } = {}) => {
        const z = this.add.rectangle(x, s - haut / 2 - 5, large, haut, 0xffffff, 0).setDepth(8.65).setInteractive({ useHandCursor: true });
        this.add.text(x, s - 140, etiquette, style(12, '#fff4dc', { fontStyle: 'bold italic', stroke: '#1a0e06', strokeThickness: 4 })).setOrigin(0.5).setDepth(8.6);
        z.on('pointerdown', () => this.passerPar(page, x));
      },
    };
    this.pont = true; this.largeur = 960;
    this.creerRuePont(ici, sol);
  }

  creerRuePont(ici, sol) {
    const G = this.G;
    dessinerComte(this.add.graphics(), 0, 0, 960, sol, 0);
    this.add.image(0, 0, rueDuPontHD(this)).setOrigin(0).setScale(2);
    this.add.image(0, sol, pavesHD(this, 960, 70)).setOrigin(0).setScale(2);
    const facade = dessinerFacade(this, 398, sol, G.nomShop);
    for (const o of [facade.image, facade.tonneaux, facade.enseigne]) if (o) o.setDepth(4);
    this.porteShop = { x: facade.porteX };
    const zp = this.add.rectangle(this.porteShop.x, sol - 60, 70, 120, 0xffffff, 0).setDepth(8.65).setInteractive({ useHandCursor: true });
    this.add.text(this.porteShop.x, sol - 150, 'Rentrer', style(12, '#fff4dc', { fontStyle: 'bold italic', stroke: '#1a0e06', strokeThickness: 4 })).setOrigin(0.5).setDepth(8.6);
    zp.on('pointerdown', () => this.passerPar('Maison', this.porteShop.x));
    ici.porte(846, sol, 'La Halle des Bateliers', 'Halle', { large: 160, haut: 150 });
    ici.regarder(0, 250, 160, 220, "La tonnelière cercle un tonneau à grands coups de maillet. « Bienvenue sur le pont, voisin ! Ici, tout arrive par le fleuve... et tout repart en tonneau. »");
    ici.regarder(612, 200, 98, 270, 'Une maison rose, haute et étroite. À la fenêtre du deuxième, une vieille dame arrose ses géraniums... et la rue en dessous.');
    ici.regarder(160, 300, 80, 90, 'Derrière le parapet, le grand fleuve. Les barges descendent vers la Halle, chargées de caisses et de tonneaux venus d\'autres royaumes.');
    // le panneau de la ville basse : le marché, la banque, l'architecte
    const pan = ecriteauRue(this, 196, 452, '◀ La ville basse', { taille: 13, profondeur: 8.62 }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    pan.on('pointerdown', () => this.passerPar('VilleBasse', 250));
    textureJoueur(this, G);
    const x0 = this.depuis === 'marche' ? 120 : this.porteShop.x + 40;
    this.heros = this.add.image(x0, SOL_PROMENADE, textureJoueur(this, G)).setOrigin(0.5, 1).setScale(echelleJoueur(7.5)).setDepth(8.5);
    this.cible = null; this.pas = 0;
    const fixe = o => o.setScrollFactor(0).setDepth(30);
    fixe(this.add.text(480, 22, `Le pont de Pont-Royal · jour ${G.jour}`, style(22, '#fff4dc', { fontStyle: 'bold', stroke: '#1a0e06', strokeThickness: 5 })).setOrigin(0.5));
    fixe(this.add.text(480, 48, '◀ ▶ ou clique au sol pour marcher · clique sur les maisons pour les regarder · le panneau mène à la ville basse', style(12, '#fff4dc', { fontStyle: 'italic', stroke: '#1a0e06', strokeThickness: 3 })).setOrigin(0.5));
    this.bulle = fixe(this.add.text(480, 78, '', style(14, '#3b2410', { fontStyle: 'italic', backgroundColor: '#ead9b0', padding: { x: 10, y: 6 }, wordWrap: { width: 640 }, align: 'center' })).setOrigin(0.5, 0).setVisible(false));
    for (const [x, l, texte, page] of [[110, 190, '◀ Chez toi', 'Maison'], [850, 200, 'Au marché ▶▶', 'Marche']]) { const b = creerBouton(this, x, 505, l, texte, () => this.passerPar(page)); fixe(b.fond); fixe(b.label); }
    this.input.on('pointerdown', (pointeur, sous) => { if (!sous.length) this.allerVers(pointeur.worldX); });
    this.touches = this.input.keyboard ? this.input.keyboard.createCursorKeys() : null;
    this.time.addEvent({ delay: 4500, startAt: 3500, loop: true, callback: () => this.passant() });
    this.passant();
    if (typeof ambianceMeteo === 'function') ambianceMeteo(this, { sol, flaques: [[250, 500, 120, 14], [640, 508, 150, 15]] });
    if (typeof saisonDe === 'function') { Son.nature(true, { saison: saisonDe(G), volume: 0.7, meteo: typeof meteoDu === 'function' ? meteoDu(G) : null }); this.events.once('shutdown', () => Son.nature(false)); }
    // (la première fois) le batelier salue le nouveau voisin
    const P = etatPontRoyal(G);
    if (!P.salueBatelier) { P.salueBatelier = true; this.time.delayedCall(900, () => this.dire('Le batelier, de la porte de la Halle : « Bienvenue sur le pont ! Ici, tout arrive par le fleuve. Passe voir la barge de la semaine. »')); }
  }

  passant() {
    const race = auHasard(['humain', 'humain', 'humain', 'humain', 'nain', 'elfe', 'hobbit']);
    // (v1.57) sur le pont, la garde fait sa ronde de temps en temps
    const quoi = Math.random() < 0.22 ? { race: 'humain', nom: 'Garde du pont ' + Math.floor(Math.random() * 99), costume: 'gardeRoyal', habit: 0x1c1c24, cheveux: 0x1a1612, coiffure: 'long', niveau: 'aguerri', armeEmportee: 'lance', serieux: true }
      : { nom: auHasard(NOMS_PASSANTS_RUE) + ' ' + Math.floor(Math.random() * 99), race, niveau: auHasard(['novice', 'aguerri']) };
    const sens = Math.random() < 0.5 ? 1 : -1, cam = this.cameras.main.scrollX;
    const x0 = sens > 0 ? cam - 60 : cam + 1020, x1 = sens > 0 ? this.largeur + 140 : -140;
    const p = imageCorps(this, x0, SOL_PROMENADE + 4 + Math.random() * 8, quoi, 7.2).setFlipX(sens < 0).setDepth(8.45);
    const duree = Math.abs(x1 - x0) * 11;
    pasDeMarche(this, p, duree, { poussiere: false });
    this.tweens.add({ targets: p, x: x1, duration: duree, onComplete: () => { if (p.bulle) p.bulle.destroy(); p.destroy(); } });
    p.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.passantParle(p));
  }

  passantParle(p) {
    if (!p.active || (p.bulle && p.bulle.active)) return;
    const cam = this.cameras.main;
    if (p.x < cam.scrollX + 40 || p.x > cam.scrollX + 920) return;
    const texte = phrasePassant(this.G);
    const tw = this.tweens.getTweensOf(p); tw.forEach(t => t.pause());
    if (p.marche) p.marche.paused = true;
    Son.jouer('voix', { personne: { nom: p.texture.key, race: 'humain' }, ton: Phaser.Utils.Array.GetRandom(['content', 'rire', 'etonne', 'neutre']) });
    const bulle = p.bulle = this.add.text(p.x, p.y - p.displayHeight - 8, texte, style(12, '#3b2410', { fontStyle: 'italic', backgroundColor: '#f3e6c8', padding: { x: 8, y: 5 }, wordWrap: { width: 230 }, align: 'center' })).setOrigin(0.5, 1).setDepth(9).setScale(0);
    this.tweens.add({ targets: bulle, scale: 1, duration: 180, ease: 'Back.easeOut' });
    const suivre = () => { if (bulle.active && p.active) bulle.setX(p.x); };
    this.events.on('update', suivre);
    this.events.once('shutdown', () => this.events.off('update', suivre));
    this.time.delayedCall(Math.max(3000, texte.length * 60), () => {
      this.events.off('update', suivre);
      if (bulle.active) this.tweens.add({ targets: bulle, alpha: 0, duration: 300, onComplete: () => bulle.destroy() });
      if (p.active) { tw.forEach(t => t.resume()); if (p.marche) p.marche.paused = false; }
    });
  }

  dire(texte) {
    this.bulle.setText(texte).setVisible(true).setAlpha(1);
    this.tweens.killTweensOf(this.bulle);
    this.tweens.add({ targets: this.bulle, alpha: 0, delay: 4000, duration: 600 });
  }

  allerVers(x) { this.cible = Phaser.Math.Clamp(x, 40, this.largeur - 40); }

  // Entrer quelque part : à pied jusqu'à la porte (si on la donne), puis on y va.
  passerPar(page, x = null) {
    if (this.transition || this.fini) return;
    this.transition = true;
    const aller = () => {
      if (page !== 'Marche') Son.jouer('porte');
      if (page === 'Halle') { this.transition = false; ouvrirHalle(this); return; }
      if (page === 'VilleBasse') { this.transition = false; menuVilleBasse(this); return; }
      this.fini = true;
      if (page === 'Marche' && typeof allerDansLaVille === 'function') return allerDansLaVille(this, { quartier: 'place', depuis: 'rue', genre: 'bord' });
      Sauvegarde.maintenant(this.G, page === 'Maison' ? 'Maison' : 'Marche');
      this.cameras.main.fadeOut(300);
      this.cameras.main.once('camerafadeoutcomplete', () => (page === 'Maison' ? this.scene.start('Nuit', { matin: true }) : this.scene.start('Marche')));
    };
    if (x === null) return aller();
    this.allerVers(x);
    const attendre = () => (this.cible === null ? aller() : this.time.delayedCall(60, attendre));
    attendre();
  }

  update(temps, delta) {
    if (!this.heros) return;
    let dx = 0;
    if (this.touches && (this.touches.left.isDown || this.touches.right.isDown) && !this.transition) {
      this.cible = null;
      dx = (this.touches.right.isDown ? 1 : -1) * 0.32 * delta;
    } else if (this.cible !== null) {
      const reste = this.cible - this.heros.x;
      dx = Math.sign(reste) * Math.min(Math.abs(reste), 0.32 * delta);
      if (Math.abs(reste) < 1) this.cible = null;
    }
    if (dx) {
      this.heros.x = Phaser.Math.Clamp(this.heros.x + dx, 40, this.largeur - 40);
      this.heros.setFlipX(dx < 0);
      this.pas += delta;
      if (!this.heros.marche) pasDeMarche(this, this.heros, 260, { sol: typeof saisonDe === 'function' && saisonDe(this.G) === 'givre' ? 'neige' : 'paves', volumePas: 0.55 });
      this.heros.y = SOL_PROMENADE - Math.abs(Math.sin(this.pas / 120)) * 2;
    } else this.heros.y = SOL_PROMENADE;
    this.cameras.main.scrollX = Phaser.Math.Clamp(this.heros.x - 480, 0, this.largeur - 960);
  }
}
