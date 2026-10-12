// Données du jeu : objets, stock de départ et voyageurs du jour.
// Pour ajouter un voyageur ou un objet, il suffit de modifier ce fichier.

const ITEMS = {
  ration:  { nom: 'Ration' },
  gourde:  { nom: 'Gourde' },
  epee:    { nom: 'Épée' },
  fleches: { nom: 'Flèches' },
  potion:  { nom: 'Potion' },
  bandage: { nom: 'Bandages' },
  torche:  { nom: 'Torche' },
  corde:   { nom: 'Corde' },
};

// Volontairement un peu trop juste : il faut choisir qui servir en priorité.
const STOCK_DEPART = {
  ration: 2, gourde: 1, epee: 1, fleches: 1,
  potion: 1, bandage: 1, torche: 2, corde: 1,
};

const ARGENT_DEPART = 20;

// Chance de réussir une épreuve selon ce que l'aventurier a reçu.
const CHANCE_EPREUVE = { complet: 0.9, partiel: 0.55, rien: 0.2 };

// Épreuves de combat : y mourir, c'est mourir valeureusement.
const EPREUVES_COMBAT = ['araignee', 'loup'];

// Chaque épreuve demande un objet (`besoin`) en une certaine quantité.
// La commande du voyageur est déduite de ses épreuves.
// Les textes sont le récit de l'aventurier, à la première personne.
const VOYAGEURS_JOUR_1 = [
  {
    id: 'pippa',
    nom: 'Pippa Boisclair',
    race: 'hobbit',
    feminin: true,
    pv: 2,
    butin: 30,
    accueil: "Bonjour ! Je dois porter une lettre au village de Brêche-Haute, de l'autre côté de la rivière. Vous pourriez me préparer de quoi faire le voyage ?",
    quete: 'Porter une lettre à Brêche-Haute',
    epreuves: [
      {
        type: 'route', besoin: 'ration', qte: 2,
        intro: 'Quatre jours de marche à travers les collines...',
        complet: "Tes rations m'ont tenu le ventre plein tout du long !",
        partiel: "J'ai dû me rationner... J'avais l'estomac dans les talons.",
        rien: "Je n'avais rien à manger. J'ai fini par goûter des baies douteuses...",
      },
      {
        type: 'riviere', besoin: 'corde', qte: 1,
        intro: 'Le pont de la rivière avait été emporté par la crue !',
        complet: "J'ai attaché ta corde à un arbre et j'ai traversé sans me mouiller les pieds.",
        partiel: "J'ai traversé avec un bout de corde trop court...",
        rien: "J'ai dû traverser à la nage dans le courant glacé.",
      },
      {
        type: 'nuit', besoin: 'torche', qte: 1,
        intro: 'La nuit tombée, des yeux brillaient autour de mon campement...',
        complet: "J'ai agité ta torche et les bêtes se sont enfuies !",
        partiel: "Ma torche faiblissait, les bêtes hésitaient...",
        rien: "Sans lumière, je n'ai pas pu les éloigner.",
      },
    ],
  },
  {
    id: 'durgan',
    nom: 'Durgan Barbe-de-Fer',
    race: 'nain',
    feminin: false,
    pv: 2,
    butin: 60,
    accueil: "Hrm. Des araignées géantes ont envahi la vieille mine de Grisefer. Le conseil paie bien pour s'en débarrasser. Il me faut du matériel solide, petit.",
    quete: 'Nettoyer la mine de Grisefer',
    epreuves: [
      {
        type: 'route', besoin: 'ration', qte: 1,
        intro: 'La route jusqu\'à la montagne était longue.',
        complet: 'Ta ration était bien nourrissante. Un nain le ventre plein est un nain heureux.',
        partiel: "C'était juste, mais ça m'a suffi.",
        rien: "J'ai marché le ventre vide. Mauvaise idée.",
      },
      {
        type: 'grotte', besoin: 'torche', qte: 2,
        intro: 'Les galeries de la mine étaient plongées dans le noir complet.',
        complet: 'Avec tes deux torches, j\'y voyais comme en plein jour.',
        partiel: "Une seule torche... Elle s'est éteinte au fond de la mine.",
        rien: "J'avançais à tâtons dans le noir. Je suis tombé dans un puits.",
      },
      {
        type: 'araignee', besoin: 'epee', qte: 1,
        intro: 'Et soudain, la reine des araignées est sortie de sa toile !',
        complet: "Ta lame était bien affûtée. Je l'ai tranchée en deux !",
        partiel: 'Mon arme était émoussée...',
        rien: "Je me suis battu avec ma pioche. Elle n'était pas faite pour ça.",
      },
      {
        type: 'morsure', besoin: 'potion', qte: 1,
        intro: "Une araignée m'a mordu. Son venin me brûlait le bras...",
        complet: "J'ai bu ta potion et la douleur est partie d'un coup.",
        partiel: "Le remède n'était pas assez fort...",
        rien: "Je n'avais aucun remède contre le venin.",
      },
    ],
  },
  {
    id: 'elwen',
    nom: 'Elwen Feuilleclaire',
    race: 'elfe',
    feminin: true,
    pv: 2,
    butin: 45,
    accueil: "Salutations. Un loup géant décime les troupeaux des fermes de l'est. Je vais le traquer. Il me faut de quoi chasser... et de quoi panser mes plaies.",
    quete: 'Traquer le loup géant',
    epreuves: [
      {
        type: 'route', besoin: 'gourde', qte: 1,
        intro: 'La traque a duré trois jours sous un soleil de plomb.',
        complet: "Ta gourde m'a gardée hydratée et l'esprit clair.",
        partiel: "Je manquais d'eau...",
        rien: "La soif me faisait tourner la tête. J'ai perdu sa trace un moment.",
      },
      {
        type: 'loup', besoin: 'fleches', qte: 2,
        intro: 'Je l\'ai trouvé au crépuscule. Une bête énorme, aux crocs comme des dagues.',
        complet: "Deux flèches, deux tirs parfaits. Le loup est tombé.",
        partiel: "Une seule flèche ne suffisait pas à l'abattre...",
        rien: "Sans flèches, j'ai dû l'affronter au couteau.",
      },
      {
        type: 'blessure', besoin: 'bandage', qte: 1,
        intro: 'Le loup m\'avait lacéré l\'épaule avant de tomber.',
        complet: "J'ai pansé ma blessure avec tes bandages. Elle a vite guéri.",
        partiel: "Je n'avais pas assez de bandages pour bien la couvrir.",
        rien: 'La blessure s\'est infectée sur le chemin du retour...',
      },
    ],
  },
];

// La commande d'un voyageur : { idObjet: quantité }
function commandeDe(voyageur) {
  const commande = {};
  for (const e of voyageur.epreuves) {
    commande[e.besoin] = (commande[e.besoin] || 0) + e.qte;
  }
  return commande;
}

// Niveau de préparation d'une épreuve selon ce que contient le colis.
function niveauEpreuve(epreuve, colis) {
  const donne = colis[epreuve.besoin] || 0;
  if (donne >= epreuve.qte) return 'complet';
  if (donne > 0) return 'partiel';
  return 'rien';
}

// Probabilité exacte que l'aventurier revienne vivant :
// il meurt s'il échoue autant d'épreuves qu'il a de points de vie.
function chanceDeRetour(voyageur, colis) {
  let proba = [1]; // proba[k] = probabilité d'avoir raté k épreuves
  for (const e of voyageur.epreuves) {
    const p = CHANCE_EPREUVE[niveauEpreuve(e, colis)];
    const suivante = new Array(proba.length + 1).fill(0);
    proba.forEach((pk, k) => {
      suivante[k] += pk * p;
      suivante[k + 1] += pk * (1 - p);
    });
    proba = suivante;
  }
  return proba.slice(0, voyageur.pv).reduce((a, b) => a + b, 0);
}

// Tire au sort le déroulement de l'aventure, épreuve par épreuve.
function simulerAventure(voyageur, colis) {
  let pv = voyageur.pv;
  const etapes = [];
  for (const e of voyageur.epreuves) {
    const niveau = niveauEpreuve(e, colis);
    const reussie = Math.random() < CHANCE_EPREUVE[niveau];
    if (!reussie) pv--;
    etapes.push({ epreuve: e, niveau, reussie, pvApres: pv });
    if (pv <= 0) break;
  }
  const derniere = etapes[etapes.length - 1];
  return {
    etapes,
    vivant: pv > 0,
    valeureux: pv <= 0 && EPREUVES_COMBAT.includes(derniere.epreuve.type),
  };
}

// État de la partie, partagé entre les scènes.
function nouvellePartie() {
  window.GAME = {
    jour: 1,
    argent: ARGENT_DEPART,
    stock: { ...STOCK_DEPART },
    file: VOYAGEURS_JOUR_1.map(v => ({ ...v })),
    partis: [], // { voyageur, colis, chance, resultat }
  };
}
