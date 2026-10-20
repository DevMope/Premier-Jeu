// (v1.28, planche 52 validée) Financer la Confrérie du Dernier Rempart : trois projets côté lumière, l'un après
// l'autre, chacun bâti en une nuit. L'hospice (les blessés guérissent deux fois plus vite, un soin gratuit par
// jour), la chapelle du Rempart (sa cloche bénit les départs : +3 % à chaque épreuve dans les contrées de la
// lumière), l'escouade (six soldats équipés à tes frais : chaque semaine, une contrée de la lumière avance d'un
// cran, et la gazette en parle). L'hospice et la chapelle se bâtissent sur le terrain vague, à gauche des Pommeroy.
const CONFRERIE = {
  projets: [
    { id: 'hospice', nom: "L'hospice", prix: 6000, effet: 'Les blessés guérissent deux fois plus vite. Un soin gratuit par jour.', decor: 'Une longue maison blanchie, la sœur Aveline et ses lits propres.' },
    { id: 'chapelle', nom: 'La chapelle', prix: 12000, effet: 'Sa cloche bénit les départs : +3 % à chaque épreuve dans les contrées de la lumière.', decor: 'La rosace, les vitraux, la cloche de bronze.' },
    { id: 'escouade', nom: "L'escouade", prix: 20000, effet: '+1 de conquête chaque semaine dans une contrée de la lumière.', decor: 'Six soldats aux tabards bleus, la bannière en tête.' },
  ],
  chapelle: 0.03,            // le bonus de la cloche, par épreuve, dans une contrée de la lumière
  reputation: 1,             // chaque projet bâti
};
POSTES.confrerie = 'Dons à la Confrérie';

function confrerieDe(G) { G.confrerie = G.confrerie || { bati: {}, chantier: null }; return G.confrerie; }
// Le livre des dons ne s'ouvre qu'à ceux qui marchent du côté de la lumière (la jauge, ou le serment)
function confrerieOuverte(G) { return coteCamp(G) === 'bien' || (typeof sermentDe === 'function' && sermentDe(G) === 'bien'); }
function confrerieA(G, id) { return !!(G.confrerie && G.confrerie.bati && G.confrerie.bati[id]); }
function projetConfrerie(G) { return CONFRERIE.projets.find(p => !confrerieA(G, p.id)) || null; }
function donneConfrerie(G) { return CONFRERIE.projets.filter(p => confrerieA(G, p.id)).reduce((s, p) => s + p.prix, 0); }
function totalConfrerie() { return CONFRERIE.projets.reduce((s, p) => s + p.prix, 0); }

// Financer le projet suivant : payé tout de suite, bâti dans la nuit
function financerConfrerie(G) {
  const p = projetConfrerie(G), c = confrerieDe(G);
  if (!p || !confrerieOuverte(G)) return { erreur: 'Rien à financer.' };
  if (c.chantier) return { erreur: 'Les maçons de la Confrérie sont déjà à l’ouvrage.' };
  if (!peutPayer(G, p.prix)) return { erreur: manqueArgent(G, p.prix, `Il te manque ${p.prix - Math.floor(G.argent)} pièces.`) };
  payer(G, p.prix, 'confrerie');
  c.chantier = p.id;
  return { ok: true, projet: p };
}

// --- Les effets ---
// L'hospice : deux fois moins de jours de repos par cœur perdu
function reposParCoeur(G) { return confrerieA(G, 'hospice') ? Math.ceil(CONVALESCENCE_PAR_COEUR / 2) : CONVALESCENCE_PAR_COEUR; }
// L'hospice : le premier soin de la journée ne coûte pas de potion (renvoie vrai, et le compte, s'il reste dû)
function soinHospice(G) {
  if (!confrerieA(G, 'hospice') || G.soinHospice === G.jour) return false;
  G.soinHospice = G.jour;
  return true;
}
function soinHospiceLibre(G) { return confrerieA(G, 'hospice') && G.soinHospice !== G.jour; }
// La chapelle : sa cloche bénit les départs vers les contrées de la lumière
function bonusChapelle(G, zone) { return G && confrerieA(G, 'chapelle') && ZONES[zone] && ZONES[zone].camp === 'bien' ? CONFRERIE.chapelle : 0; }

// L'escouade : chaque fin de semaine, une contrée de la lumière (ouverte, pas encore conquise) avance d'un cran
function marcheDeLEscouade(G) {
  const zs = Object.keys(ZONES).filter(z => ZONES[z].camp === 'bien' && zoneOuverte(G, z) && ((G.conquete || {})[z] || 0) < conqueteZone(z));
  if (!zs.length) return null;
  // (la plus avancée d'abord : l'escouade finit ce qui est commencé)
  zs.sort((a, b) => ((G.conquete[b] || 0) / conqueteZone(b)) - ((G.conquete[a] || 0) / conqueteZone(a)));
  const z = zs[0];
  G.conquete = G.conquete || {};
  G.conquete[z] = (G.conquete[z] || 0) + 1;
  const conquise = G.conquete[z] >= conqueteZone(z);
  return { zone: z, conquise };
}

// La nuit : le chantier se termine ; et le dernier jour de la semaine, l'escouade marche
function nuitDeLaConfrerie(G) {
  const c = G.confrerie;
  if (!c) return;
  if (c.chantier) {
    const p = CONFRERIE.projets.find(x => x.id === c.chantier);
    c.bati[c.chantier] = G.jour + 1;
    c.chantier = null;
    G.reputation += CONFRERIE.reputation;
    c.annonce = p ? p.id : null;
  }
  if (confrerieA(G, 'escouade') && c.bati.escouade <= G.jour && G.jour % 7 === 0) c.marche = marcheDeLEscouade(G);
}
// Au matin : ce qui vient d'être bâti, la marche de l'escouade
function matinDeLaConfrerie(G) {
  const lignes = [], c = G.confrerie;
  if (!c) return lignes;
  if (c.annonce) {
    const p = CONFRERIE.projets.find(x => x.id === c.annonce);
    const quoi = { hospice: "l'hospice de la Confrérie est bâti sur le terrain vague", chapelle: 'la chapelle du Rempart est bâtie, sa cloche sonne pour la première fois', escouade: "l'escouade de la Confrérie est équipée : six soldats, la bannière en tête" }[c.annonce];
    lignes.push(`Toute la nuit, des maçons et des chants : ${quoi} (+${CONFRERIE.reputation} de réputation). ${p ? p.effet : ''}`);
    if (!G.annonceConfrerie) G.annonceConfrerie = `La Confrérie du Dernier Rempart remercie « ${G.nomShop} » : ${quoi.replace(/^l'/, "l'").replace(/ \(.*/, '')}.`;
    c.annonce = null;
  }
  if (c.marche) {
    const z = ZONES[c.marche.zone];
    lignes.push(`L'escouade de la Confrérie est revenue ${deLieu(z.nom)} : la conquête avance (+1).` + (c.marche.conquise ? ` ⚑ ${z.nom} : contrée conquise !` : ''));
    if (!G.annonceConfrerie) G.annonceConfrerie = `L'escouade de la Confrérie, payée par un marchand du Comté, a repris du terrain ${aLieu(z.nom)}. ${c.marche.conquise ? 'La contrée est libérée !' : 'Les Bannis reculent.'}`;
    c.marcheVue = c.marche;
    c.marche = null;
  }
  return lignes;
}
