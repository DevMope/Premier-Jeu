// (v1.32) Ce que paient les riches. Au-delà d'une belle fortune, une part de chaque butin (à partir des contrées ★3)
// ne reste pas au comptoir :
// - lumière : le mécénat du Grand Sage. Par décret, les marchands les plus riches deviennent ses mécènes ; ce qu'ils
//   donnent ne rapporte jamais d'argent, mais le monde le voit (la plaque des mécènes, la visite du Sage, le vitrail, un
//   titre, et à la fin la retraite de lumière) ;
// - neutre : le prix de la neutralité. Les deux camps réclament leur part pour laisser en paix celui qui ne choisit pas :
//   le Conseil d'un côté, les Bannis de l'autre ;
// - ombre : rien de plus (les amendes, la Main Noire et le recel lui coûtent déjà).
const MECENAT = {
  // la fortune (dettes déduites) au-delà de laquelle on paie, et la part de chaque butin par étoile au-delà de ★2
  // (★5 au plus : trois fois la part). Le Sage demande plus à ceux qui l'ont choisi.
  seuil: { lumiere: 15000, neutre: 20000 },
  parEtoile: { lumiere: 0.15, neutre: 0.10 },
  lumiere: [
    { donne: 2000, id: 'plaque', texte: 'Ton nom est gravé sur la plaque des mécènes, à la fontaine du marché.' },
    { donne: 6000, id: 'visite', texte: 'Le Grand Sage a fait savoir qu’il viendrait en personne te remercier au comptoir.' },
    { donne: 15000, id: 'vitrail', texte: 'Un vitrail à ton effigie est posé dans la chapelle du Rempart.' },
    { donne: 30000, id: 'titre', texte: 'Le Conseil te nomme « Bienfaiteur du Rempart ».' },
    { donne: 50000, id: 'retraite', texte: 'Le Grand Sage te réserve une maison dans les Jardins d’Aube, pour tes vieux jours.' },
  ],
  neutre: [
    { donne: 2000, id: 'saufConduit', texte: 'Les deux camps t’accordent leur sauf-conduit : on te laisse passer partout.' },
    { donne: 6000, id: 'passeur', texte: 'Le Passeur du Carrefour te fait confiance : il te parle comme à un ami.' },
    { donne: 15000, id: 'table', texte: 'Un soir, un Gardien et un Banni ont bu à ta table sans se battre. On en parle dans tout le Comté.' },
    { donne: 30000, id: 'carrefour', texte: 'Une maison t’attend au Carrefour, là où toutes les routes se croisent, pour tes vieux jours.' },
  ],
};
POSTES.mecenat = 'Mécénat du Grand Sage';
POSTES.neutralite = 'Prix de la neutralité';

function mecenatDe(G) { return (G.mecenat = G.mecenat || { donne: 0, conseil: 0, bannis: 0, paliers: [] }); }
// Le régime du comptoir : 'lumiere', 'neutre', ou null (l'ombre ne paie pas)
function regimeDesRiches(G) { const p = palierCamp(G); return p > 0 ? 'lumiere' : p < 0 ? null : 'neutre'; }
function nomPartDesRiches(regime) { return regime === 'lumiere' ? 'mécénat du Grand Sage' : 'prix de la neutralité'; }
// La part d'un butin qui s'en va (0 sous le seuil, en ★1-★2, ou pour l'ombre)
function partDesRiches(G, brut) {
  const regime = regimeDesRiches(G);
  if (!regime) return 0;
  const dettes = G.prets.reduce((s, p) => s + p.restant, 0);
  if (G.argent - dettes <= MECENAT.seuil[regime]) return 0;
  const et = typeof etoilesDe === 'function' ? Math.min(5, etoilesDe(G)) : 1;
  return Math.round(brut * MECENAT.parEtoile[regime] * Math.max(0, et - 2));
}
// Au retour d'un aventurier : la part est versée aussitôt. Renvoie { montant, regime } (montant 0 si rien)
function verserPartDesRiches(G, brut) {
  const regime = regimeDesRiches(G), montant = partDesRiches(G, brut);
  if (!montant) return { montant: 0, regime };
  const m = mecenatDe(G);
  if (regime === 'lumiere') payer(G, montant, 'mecenat');
  else { payer(G, montant, 'neutralite'); const c = Math.ceil(montant / 2); m.conseil += c; m.bannis += montant - c; }
  m.donne += montant;
  m.regime = regime;
  return { montant, regime };
}
// Au matin : les paliers franchis (une fois chacun), annoncés au réveil et dans la gazette
function matinDesRiches(G) {
  const m = G.mecenat;
  if (!m || !m.regime) return [];
  const lignes = [];
  for (const p of MECENAT[m.regime]) {
    if (m.donne < p.donne || m.paliers.includes(p.id)) continue;
    m.paliers.push(p.id);
    lignes.push(`${m.regime === 'lumiere' ? 'Le mécénat du Grand Sage' : 'Le prix de la neutralité'} (${m.donne.toLocaleString('fr-FR')} p. donnés) : ${p.texte}`);
    if (!G.annonceMecenat) G.annonceMecenat = p.texte;
  }
  return lignes;
}
