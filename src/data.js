// Contenu du jeu : objets, quêtes et noms des aventuriers.
// Pour ajouter une quête, un objet ou un nom, il suffit de modifier ce fichier.

// `durable` : l'aventurier garde l'objet après sa quête, et il s'use.
// `base` : toujours disponible chez le fournisseur.
const ITEMS = {
  ration:  { nom: 'Ration',   prix: 3,  base: true },
  gourde:  { nom: 'Gourde',   prix: 4,  base: true, durable: true },
  epee:    { nom: 'Épée',     prix: 15, durable: true },
  fleches: { nom: 'Flèches',  prix: 6 },
  potion:  { nom: 'Potion',   prix: 10 },
  bandage: { nom: 'Bandages', prix: 4,  base: true },
  torche:  { nom: 'Torche',   prix: 3,  base: true },
  corde:   { nom: 'Corde',    prix: 5,  durable: true },
};

// Un objet durable neuf supporte 3 quêtes avant de casser.
const USURE_MAX = 3;
// Ce que paie un aventurier pour faire réparer un de ses objets.
const PRIX_REPARATION = 6;

// Volontairement un peu trop juste : il faut choisir qui servir en priorité.
const STOCK_DEPART = {
  ration: 2, gourde: 2, epee: 1, fleches: 1,
  potion: 2, bandage: 1, torche: 3, corde: 1,
};

// Assez pour tenir les premiers jours, le temps que les aventuriers reviennent.
const ARGENT_DEPART = 80;

// En dessous de cette somme, c'est la faillite.
const SEUIL_FAILLITE = -100;

// La réserve : nombre d'objets qu'on peut stocker, et ses agrandissements.
const RESERVE_DEPART = 20;
const AGRANDISSEMENTS = [
  { capacite: 30, prix: 60 },
  { capacite: 40, prix: 140 },
  { capacite: 55, prix: 260 },
];

// Le marchand express passe au comptoir pendant la journée :
// pratique pour sauver un voyage, mais bien plus cher que le fournisseur.
const MARCHAND_EXPRESS = { nom: 'Fennick le Pressé', multiplicateur: 2.5 };

// Réputation perdue quand on refuse.
const REFUS_LETTRE = 0.5;
const REFUS_CLIENT = 1;

// Les prêts : la banque prête plus et moins cher quand ta réputation grandit.
// La Main Noire prête à tout le monde... à un prix terrible.
const PRETS = [
  { id: 'petit', preteur: 'Banque de la Comté', nom: 'Petit prêt', somme: 60, taux: 0.15, jours: 5, reputation: 0 },
  { id: 'marchand', preteur: 'Banque de la Comté', nom: 'Prêt marchand', somme: 150, taux: 0.10, jours: 7, reputation: 4 },
  { id: 'grand', preteur: 'Banque de la Comté', nom: 'Grand prêt', somme: 400, taux: 0.06, jours: 10, reputation: 10 },
  { id: 'mafia', preteur: 'La Main Noire', nom: 'Prêt sans questions', somme: 120, taux: 0.45, jours: 4, reputation: -Infinity },
];

// Une étape ajoutée aux longues quêtes qui n'ont pas déjà de rations.
const ETAPE_VIVRES = {
  type: 'route', besoin: 'ration',
  intro: 'Le voyage durait bien plus longtemps que prévu...',
  complet: "J'avais assez de rations pour tenir jusqu'au bout.",
  partiel: "J'ai dû sauter des repas sur la fin.",
  rien: "Je n'avais plus rien à manger depuis des jours.",
};

// Chance de réussir une épreuve selon ce que l'aventurier a reçu.
const CHANCE_EPREUVE = { complet: 0.9, partiel: 0.55, rien: 0.2 };

// Épreuves de combat : y mourir, c'est mourir valeureusement.
const EPREUVES_COMBAT = ['araignee', 'loup', 'bandits', 'sanglier'];

// Les modèles de quêtes. Chaque épreuve demande un objet (`besoin`) en une
// certaine quantité, et la commande du voyageur en est déduite.
// `duree` et `butin` sont des fourchettes [min, max] : chaque voyageur tire les siennes.
// Les textes sont le récit de l'aventurier, à la première personne.
// {e} devient « e » pour une aventurière (blessé{e} → blessée).
const QUETES = {
  lettre: {
    titre: 'Porter une lettre à Brêche-Haute',
    accueil: "Bonjour ! Je dois porter une lettre au village de Brêche-Haute, de l'autre côté de la rivière. Vous pourriez me préparer de quoi faire le voyage ?",
    pv: 2, duree: [1, 2], butin: [25, 35],
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
        partiel: 'Ma torche faiblissait, les bêtes hésitaient...',
        rien: "Sans lumière, je n'ai pas pu les éloigner.",
      },
    ],
  },
  mine: {
    titre: 'Nettoyer la mine de Grisefer',
    accueil: "Hrm. Des araignées géantes ont envahi la vieille mine de Grisefer. Le conseil paie bien pour s'en débarrasser. Il me faut du matériel solide, petit.",
    pv: 2, duree: [2, 3], butin: [50, 70],
    epreuves: [
      {
        type: 'route', besoin: 'ration', qte: 1,
        intro: "La route jusqu'à la montagne était longue.",
        complet: 'Ta ration était bien nourrissante. Le ventre plein, on marche deux fois plus vite.',
        partiel: "C'était juste, mais ça m'a suffi.",
        rien: "J'ai marché le ventre vide. Mauvaise idée.",
      },
      {
        type: 'grotte', besoin: 'torche', qte: 2,
        intro: 'Les galeries de la mine étaient plongées dans le noir complet.',
        complet: "Avec tes deux torches, j'y voyais comme en plein jour.",
        partiel: "Une seule torche... Elle s'est éteinte au fond de la mine.",
        rien: "J'avançais à tâtons dans le noir. Je suis tombé{e} dans un puits.",
      },
      {
        type: 'araignee', besoin: 'epee', qte: 1,
        intro: 'Et soudain, la reine des araignées est sortie de sa toile !',
        complet: "Ta lame était bien affûtée. Je l'ai tranchée en deux !",
        partiel: 'Mon arme était émoussée...',
        rien: "Je me suis battu{e} avec ma pioche. Elle n'était pas faite pour ça.",
      },
      {
        type: 'morsure', besoin: 'potion', qte: 1,
        intro: "Une araignée m'a mordu{e}. Son venin me brûlait le bras...",
        complet: "J'ai bu ta potion et la douleur est partie d'un coup.",
        partiel: "Le remède n'était pas assez fort...",
        rien: "Je n'avais aucun remède contre le venin.",
      },
    ],
  },
  fleur: {
    titre: 'Cueillir la fleur de lune',
    accueil: 'Bonsoir, enfin, bonjour ! Je pars cueillir la fleur de lune au cœur du marais des Brumes. Il paraît que les feux follets y égarent les voyageurs...',
    pv: 2, duree: [1, 2], butin: [35, 45],
    epreuves: [
      {
        type: 'route', besoin: 'gourde', qte: 1,
        intro: "L'eau du marais était croupie, impossible à boire.",
        complet: "Heureusement, ta gourde était pleine d'eau claire.",
        partiel: "J'ai dû économiser chaque gorgée...",
        rien: "J'ai bu l'eau du marais. Mon ventre s'en souvient encore.",
      },
      {
        type: 'nuit', besoin: 'torche', qte: 1,
        intro: "La fleur de lune ne s'ouvre qu'à minuit, dans le brouillard le plus épais.",
        complet: "Grâce à ta torche, j'ai trouvé la fleur au premier coup d'œil.",
        partiel: "Ma torche crachotait dans l'humidité...",
        rien: 'Je cherchais à tâtons dans la vase glacée.',
      },
      {
        type: 'feufollet', besoin: 'potion', qte: 1,
        intro: "Des feux follets ont dansé autour de moi. Leur chant m'attirait vers les eaux profondes...",
        complet: "J'ai bu ta potion et mon esprit s'est éclairci d'un coup.",
        partiel: 'Je résistais à peine à leur appel...',
        rien: "Je les ai suivis sans pouvoir m'en empêcher.",
      },
    ],
  },
  loup: {
    titre: 'Traquer le loup géant',
    accueil: "Salutations. Un loup géant décime les troupeaux des fermes de l'est. Je vais le traquer. Il me faut de quoi chasser... et de quoi panser mes plaies.",
    pv: 2, duree: [2, 3], butin: [40, 55],
    epreuves: [
      {
        type: 'route', besoin: 'gourde', qte: 1,
        intro: 'La traque a duré trois jours sous un soleil de plomb.',
        complet: "Ta gourde m'a gardé{e} hydraté{e} et l'esprit clair.",
        partiel: "Je manquais d'eau...",
        rien: "La soif me faisait tourner la tête. J'ai perdu sa trace un moment.",
      },
      {
        type: 'loup', besoin: 'fleches', qte: 2,
        intro: "Je l'ai trouvé au crépuscule. Une bête énorme, aux crocs comme des dagues.",
        complet: 'Deux flèches, deux tirs parfaits. Le loup est tombé.',
        partiel: "Une seule flèche ne suffisait pas à l'abattre...",
        rien: "Sans flèches, j'ai dû l'affronter au couteau.",
      },
      {
        type: 'blessure', besoin: 'bandage', qte: 1,
        intro: "Le loup m'avait lacéré l'épaule avant de tomber.",
        complet: "J'ai pansé ma blessure avec tes bandages. Elle a vite guéri.",
        partiel: "Je n'avais pas assez de bandages pour bien la couvrir.",
        rien: "La blessure s'est infectée sur le chemin du retour...",
      },
    ],
  },
  caravane: {
    titre: 'Escorter une caravane marchande',
    accueil: "Une caravane de marchands part vers le sud et cherche des escortes. On dit que des bandits rôdent sur la route... Il me faut de quoi tenir le voyage, et de quoi me défendre.",
    pv: 2, duree: [3, 4], butin: [55, 75],
    epreuves: [
      {
        type: 'route', besoin: 'ration', qte: 2,
        intro: 'Une semaine de route poussiéreuse derrière les chariots.',
        complet: 'Tes rations ont fait des envieux chez les marchands !',
        partiel: 'Les marchands ont partagé un peu de leur pain. Pas beaucoup.',
        rien: "Je mendiais des restes aux cuisiniers de la caravane...",
      },
      {
        type: 'bandits', besoin: 'epee', qte: 1,
        intro: 'Au détour d\'un col, les bandits nous attendaient !',
        complet: "Avec ton épée, je les ai repoussés à moi tout{e} seul{e} !",
        partiel: "Mon arme a tenu... à peine.",
        rien: 'Je me suis défendu{e} avec un bâton. Ils étaient trop nombreux.',
      },
      {
        type: 'blessure', besoin: 'bandage', qte: 1,
        intro: "Un des bandits m'avait entaillé la jambe.",
        complet: 'Tes bandages ont arrêté le sang tout de suite.',
        partiel: "J'ai serré ce que j'avais. Ça a tenu, plus ou moins.",
        rien: "J'ai boité jusqu'à la fin du voyage, en perdant beaucoup de sang.",
      },
    ],
  },
  ruines: {
    titre: 'Explorer les ruines de Vieille-Tour',
    accueil: "Les ruines de Vieille-Tour cachent un trésor, j'en suis sûr{e}. Il me faut de quoi descendre dans les souterrains.",
    pv: 2, duree: [1, 3], butin: [30, 80],
    epreuves: [
      {
        type: 'grotte', besoin: 'torche', qte: 1,
        intro: 'Les souterrains de la tour étaient noirs comme de l\'encre.',
        complet: 'Ta torche éclairait les vieilles fresques sur les murs. Magnifique.',
        partiel: "Ma lumière faiblissait déjà...",
        rien: "Je n'y voyais rien. Je me suis cogné{e} partout.",
      },
      {
        type: 'gouffre', besoin: 'corde', qte: 1,
        intro: 'Un gouffre sans fond me barrait le passage.',
        complet: "J'ai lancé ta corde, elle s'est accrochée de l'autre côté. Hop !",
        partiel: 'Ma corde était trop courte. J\'ai dû sauter le dernier mètre...',
        rien: "J'ai tenté de sauter par-dessus le vide.",
      },
      {
        type: 'morsure', besoin: 'potion', qte: 1,
        intro: 'Le coffre au trésor était piégé ! Une aiguille empoisonnée m\'a piqué la main.',
        complet: 'Ta potion a neutralisé le poison. Et le trésor était à moi !',
        partiel: 'Le poison me faisait trembler...',
        rien: 'Le poison montait dans mon bras...',
      },
    ],
  },
  sanglier: {
    titre: 'Chasser le sanglier des Hauts-Bois',
    accueil: "Le seigneur du coin offre une prime pour le sanglier qui ravage ses champs. Une petite chasse, rien de bien méchant !",
    pv: 2, duree: [1, 1], butin: [20, 30],
    epreuves: [
      {
        type: 'route', besoin: 'gourde', qte: 1,
        intro: "J'ai suivi ses traces toute la journée dans les bois.",
        complet: "Ta gourde m'a bien rafraîchi{e}.",
        partiel: "J'avais un peu soif, mais ça allait.",
        rien: "J'avais la gorge sèche comme du parchemin.",
      },
      {
        type: 'sanglier', besoin: 'fleches', qte: 1,
        intro: 'Le sanglier a chargé, ses défenses en avant !',
        complet: "Une flèche bien placée, et il s'est effondré.",
        partiel: "Ma flèche l'a frôlé...",
        rien: "Sans arc chargé, j'ai dû l'esquiver à mains nues.",
      },
    ],
  },
};

// Races du bien jouables pour l'instant, et leurs noms (nom, féminin ?).
const NOMS = {
  humain: [['Aldric Montfort', false], ['Maud Rivecourt', true], ['Gaspard Tourbier', false], ['Léna Vaucroix', true], ['Corentin Lefèvre', false]],
  hobbit: [['Milo Brindepin', false], ['Rosie Piedvert', true], ['Tobi Cantebourg', false], ['Lily Grandchamp', true]],
  nain: [['Brunhild Martelor', true], ['Borin Pied-de-Roc', false], ['Helga Forgeterre', true], ['Gromli Tranchepierre', false]],
  elfe: [['Faelor Ventlune', false], ['Sylwen Rosée', true], ['Aerin Haut-Chêne', false], ['Lindë Brisargent', true]],
  magicienne: [['Esmée Brume-Étoile', true], ['Ysolde Cendrecœur', true], ['Céleste Mille-Runes', true]],
};

// La première journée est écrite à la main.
const JOUR_1 = [
  { quete: 'lettre', nom: 'Pippa Boisclair', race: 'hobbit', feminin: true, butin: 30, duree: 1 },
  { quete: 'mine', nom: 'Durgan Barbe-de-Fer', race: 'nain', feminin: false, butin: 60, duree: 2 },
  { quete: 'fleur', nom: "Mirabelle Lune-d'Argent", race: 'magicienne', feminin: true, butin: 40, duree: 1 },
  { quete: 'loup', nom: 'Elwen Feuilleclaire', race: 'elfe', feminin: true, butin: 45, duree: 3 },
];
