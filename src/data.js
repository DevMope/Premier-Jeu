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
  antidote: { nom: 'Antidote', prix: 8 },
  cape:    { nom: 'Cape chaude', prix: 9, durable: true },
  bouclier: { nom: 'Bouclier', prix: 14, durable: true },
  amulette: { nom: 'Amulette', prix: 20 },
};

// Les objets qui soignent : en plus de la commande, chacun donne un cœur de plus pendant le voyage.
const OBJETS_DE_SOIN = ['potion', 'bandage', 'antidote'];
// Le sac de l'aventurier : combien d'objets en plus de sa commande il peut porter.
const SAC = { hobbit: 2, magicienne: 2, humain: 3, elfe: 3, nain: 4 };
// Un objet en plus pour une épreuve qui le demande : +5 % de chances de la réussir.
const BONUS_SURPLUS = 0.05;

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
// Un vieux gobelin avare, recroquevillé à côté de sa caravane.
const MARCHAND_EXPRESS = { nom: 'Vieux Grippesou', multiplicateur: 2.5 };

// Soigner un aventurier revenu blessé : une potion par cœur perdu,
// et il te paie 1,5 fois le prix d'une potion.
const PRIX_SOIN = Math.round(ITEMS.potion.prix * 1.5);

// Le dédommagement obligatoire versé à la famille d'un aventurier mort :
// une part du butin qu'il espérait. Plus tu donnes, plus ta réputation remonte,
// et plus un proche aura envie de reprendre le flambeau.
const DEDOMMAGEMENTS = {
  minimum: { nom: 'Minimum', part: 0.15, reputation: 0, releve: 0.15 },
  moyen: { nom: 'Moyen', part: 0.35, reputation: 0.25, releve: 0.35 },
  maximum: { nom: 'Maximum', part: 0.6, reputation: 0.5, releve: 0.6 },
};

// Réputation perdue quand on refuse.
const REFUS_LETTRE = 0.2;
const REFUS_CLIENT = 1;

// Les prêts : les banquiers nains prêtent plus, et moins cher, quand ta réputation grandit.
// La Main Noire (`mal`) ne prête qu'à ceux qui ont choisi le camp du mal (plus tard dans le jeu).
const PRETS = [
  { id: 'petit', preteur: 'Banque naine', nom: 'Petit prêt', somme: 60, taux: 0.15, jours: 5, reputation: 0 },
  { id: 'marchand', preteur: 'Banque naine', nom: 'Prêt marchand', somme: 150, taux: 0.10, jours: 7, reputation: 4 },
  { id: 'grand', preteur: 'Banque naine', nom: 'Grand prêt', somme: 400, taux: 0.06, jours: 10, reputation: 10 },
  { id: 'mafia', preteur: 'La Main Noire', nom: 'Prêt sans questions', somme: 120, taux: 0.45, jours: 4, reputation: -Infinity, mal: true },
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
const EPREUVES_COMBAT = ['araignee', 'loup', 'bandits', 'sanglier', 'pillards', 'yeti', 'mortvivant', 'monstre'];

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
// Pippa a déjà sa lettre à porter ; les autres viennent chercher l'aventure : c'est toi qui choisis la zone.
const JOUR_1 = [
  { quete: 'lettre', nom: 'Pippa Boisclair', race: 'hobbit', feminin: true, butin: 30, duree: 1 },
  { quete: null, nom: 'Durgan Barbe-de-Fer', race: 'nain', feminin: false, niveau: 'veteran', envie: 'or' },
  { quete: null, nom: "Mirabelle Lune-d'Argent", race: 'magicienne', feminin: true, niveau: 'aguerri', envie: 'savoir' },
  { quete: null, nom: 'Elwen Feuilleclaire', race: 'elfe', feminin: true, niveau: 'aguerri', envie: 'gloire' },
];

// --- Le dispatch : les zones où envoyer les aventuriers ---

// Le niveau d'un aventurier : un vétéran a un cœur de plus et vise plus gros.
const NIVEAUX_AVENTURIER = {
  novice: { nom: 'Novice', pv: 0, butin: 0.9 },
  aguerri: { nom: 'Aguerri', pv: 0, butin: 1 },
  veteran: { nom: 'Vétéran', pv: 1, butin: 1.15 },
};

// Ce qu'ils viennent chercher.
const ENVIES = {
  or: "Je veux de l'or, beaucoup d'or ! Où est-ce que je peux en trouver ?",
  gloire: "Je cherche la gloire. Une aventure dont on parlera dans les tavernes !",
  savoir: "On dit que le monde regorge de secrets. Où devrais-je aller les chercher ?",
  monstre: "Il me faut un monstre à combattre. Tu connais un coin dangereux ?",
};

// Les zones, de la plus calme à la plus dangereuse. `biome` : les couleurs de son paysage.
// `reputation` : la réputation qui l'ouvre (sinon, un aventurier peut la découvrir dans un récit).
// `x`, `y` : sa place sur la carte.
const ZONES = {
  collines: {
    nom: 'Les Collines de la Comté', danger: 1, reputation: 0, x: 170, y: 330, biome: 'comte',
    description: 'Des routes tranquilles, des rivières et quelques loups. Parfait pour les débutants.',
    quetes: ['lettre', 'sanglier'],
  },
  foret: {
    nom: 'La Forêt des Murmures', danger: 2, reputation: 0, x: 330, y: 250, biome: 'foret',
    description: 'Des arbres immenses, des bêtes sauvages et des ruines oubliées sous la mousse.',
    quetes: ['loup', 'ruines', 'champignons'],
  },
  marais: {
    nom: 'Les Marécages de Brume-Noire', danger: 2, reputation: 0, x: 250, y: 140, biome: 'marais',
    description: 'Une eau croupie, des sangsues et des feux follets qui égarent les voyageurs.',
    quetes: ['fleur', 'sangsues'],
  },
  mines: {
    nom: 'Les Mines abandonnées', danger: 3, reputation: 3, x: 520, y: 300, biome: 'mines',
    description: 'Des galeries noires, des éboulements, et des araignées géantes. Mais quel minerai !',
    quetes: ['mine'],
  },
  desert: {
    nom: 'Les Terres Désolées', danger: 3, reputation: 4, x: 640, y: 380, biome: 'desert',
    description: 'Le soleil, la soif, les tempêtes de sable et les pillards. Les caravanes paient bien.',
    quetes: ['caravane', 'oasis'],
  },
  pics: {
    nom: 'Les Pics Gelés', danger: 4, reputation: 8, x: 600, y: 120, biome: 'neige',
    description: 'Le froid qui mord, les avalanches et les yétis. Il faut une cape chaude.',
    quetes: ['yeti', 'col'],
  },
  ruinesRoi: {
    nom: 'Les Ruines du Roi-Sorcier', danger: 4, reputation: 10, x: 780, y: 220, biome: 'ruines',
    description: "Des morts qui marchent et des malédictions anciennes. Une amulette n'est pas de trop.",
    quetes: ['roiSorcier'],
  },
  antre: {
    nom: "L'Antre de la Bête", danger: 5, reputation: 15, x: 860, y: 90, biome: 'antre',
    description: "Personne n'en est revenu depuis des années. Mais le trésor qu'on y raconte...",
    quetes: ['bete'],
  },
};

// Plus la zone est dangereuse, plus le butin est gros.
const BUTIN_PAR_DANGER = [0, 1, 1.25, 1.6, 2.1, 3];
// La chance qu'un aventurier revenu d'une zone parle d'une zone encore inconnue, plus dangereuse.
const CHANCE_DECOUVERTE = 0.35;

// --- Relations ---

// Les degrés de relation, du pire au meilleur, avec les points nécessaires.
// Une mission parfaite (colis complet +1, retour vivant +2) fait passer d'Inconnu à Connaissance ;
// chaque palier suivant demande plus d'efforts que le précédent (3, puis 5, puis 8 points).
// `butin` : la part que l'aventurier te reverse (×). `couleur` : affichage.
// Couleur du nom selon la relation : rouge pour les pires, vert vif pour les meilleurs.
// « couleur » sur fond clair (parchemin), « vive » sur fond sombre.
const NIVEAUX_RELATION = [
  { nom: 'Pires ennemis', min: -Infinity, butin: 0.6, couleur: '#b01818', vive: '#ff4a3a' },
  { nom: "Ne s'aiment pas", min: -8, butin: 0.8, couleur: '#c0481a', vive: '#ff8a3a' },
  { nom: 'Hypocrite', min: -3, butin: 0.9, couleur: '#a8780a', vive: '#f0c040' },
  { nom: 'Neutre', min: 0, butin: 1, couleur: '#6b5a40', vive: '#e8dcc0' },
  { nom: 'Connaissance', min: 3, butin: 1, couleur: '#5a8a20', vive: '#c0e870' },
  { nom: 'Amis', min: 8, butin: 1.1, couleur: '#2f8a2a', vive: '#80e060' },
  { nom: 'Frères de sang', min: 16, butin: 1.25, couleur: '#0f9a1a', vive: '#3aff5a' },
];

// Un objet très abîmé restauré jusqu'au parfait état vaut bien plus qu'un objet resté parfait :
// le travail se voit. Bonus selon l'état d'origine (Cassé ×1,3 ; Abîmé ×1,15).
const BONUS_RESTAURE = { 0: 1.3, 1: 1.15 };

// Ce qui fait bouger une relation.
const POINTS_RELATION = {
  colisComplet: 1,     // chances de retour d'au moins 75 %
  colisPauvre: -1,     // moins de 40 %
  retourVivant: 2,
  reparation: 1,
  refusClient: -3,
  refusLettre: -1,
};

// Les familles : prénoms par race, et liens de parenté.
const PRENOMS = {
  humain: { m: ['Bastien', 'Erwan', 'Mathis', 'Octave'], f: ['Clémence', 'Margot', 'Aline', 'Solène'] },
  hobbit: { m: ['Pépin', 'Basile', 'Hugues', 'Fulbert'], f: ['Pâquerette', 'Myrtille', 'Prune', 'Capucine'] },
  nain: { m: ['Gimrod', 'Balmor', 'Hrolf', 'Thurgan'], f: ['Dagna', 'Hilde', 'Brynja', 'Sigrun'] },
  elfe: { m: ['Elrion', 'Faenor', 'Ithil', 'Caladir'], f: ['Nimrielle', 'Galwen', 'Ilyra', 'Aelith'] },
  magicienne: { m: [], f: ['Morgane', 'Viviane', 'Isaure', 'Ondine'] },
};
const LIENS = [
  { nom: 'fils', feminin: false }, { nom: 'fille', feminin: true },
  { nom: 'frère', feminin: false }, { nom: 'sœur', feminin: true },
  { nom: 'père', feminin: false }, { nom: 'mère', feminin: true },
];

// --- Réparations ---

// Ce qu'il faut pour réparer chaque objet durable.
const MATERIAUX = {
  fer: { nom: 'Fer', prix: 4 },
  cuir: { nom: 'Cuir', prix: 3 },
};
const MATERIAU_DE = { epee: 'fer', corde: 'cuir', gourde: 'cuir', cape: 'cuir', bouclier: 'fer' };
const MATERIAUX_DEPART = { fer: 2, cuir: 2 };
// Au début il faut 3 matériaux par réparation ; l'artisanat en fait baisser le nombre.
const MATERIAUX_PAR_REPARATION = 3;

// --- Le Marché des Mastres (le matin) ---

// Les trois étals. `toujours` : objets disponibles tous les jours ; les autres apparaissent au hasard.
const MARCHANDS = {
  gedeon: {
    nom: 'Maître Gédéon', metier: 'Épicerie', race: 'hobbit', couleur: 0x4f7a3a,
    objets: ['ration', 'gourde', 'torche', 'bandage'], toujours: ['ration', 'gourde', 'torche', 'bandage'],
  },
  forge: {
    nom: 'Brunehaut la Forgeronne', metier: 'Forge', race: 'nain', couleur: 0x8a3a2a,
    objets: ['epee', 'fleches', 'corde', 'bouclier', 'fer', 'cuir'], toujours: ['fer', 'cuir'],
  },
  apothicaire: {
    nom: 'Mère Sauge', metier: 'Apothicaire', race: 'magicienne', couleur: 0x5a3a8a,
    objets: ['potion', 'bandage', 'antidote', 'amulette'], toujours: ['bandage'],
  },
  tailleuse: {
    nom: 'Hilda la Tailleuse', metier: 'Tissus et fourrures', race: 'humain', couleur: 0x2f5a8a,
    objets: ['cape', 'cuir'], toujours: ['cape'],
  },
};

// Les jeux d'argent du marché : 3 parties de chaque par jour, et ces mises.
const PARTIES_PAR_JOUR = 3;
const MISES = [5, 10, 20];

// Le mendiant : au-delà de ce total donné, il te remercie à sa façon.
const MENDIANT_SEUIL = 30;

// Chaque tranche dépensée chez un marchand vous rapproche un peu plus.
const DEPENSE_PAR_POINT = 25;
// Remise selon le niveau de relation avec le marchand.
const REMISES = { Connaissance: 0.05, Amis: 0.1, 'Frères de sang': 0.2 };

// --- Décorations du shop ---
// Offertes par les amis les plus proches. Chacune donne un petit avantage.
const DECORATIONS = {
  carte: { nom: 'Carte des contrées', effet: "Tes conseils sont meilleurs : +4 % de réussite à chaque épreuve." },
  trophee: { nom: 'Trophée de loup', effet: 'Impressionne les passants : plus de clients chaque jour.' },
  lanterne: { nom: 'Lanterne enchantée', effet: 'Porte chance : +10 % sur les parts de butin.' },
  enclume: { nom: 'Enclume naine', effet: 'Réparations plus faciles : 1 matériau de moins.' },
  trefle: { nom: 'Trèfle du mendiant', effet: 'Porte-bonheur : +1 à tes dés, et le bonneteau va moins vite.' },
};

// --- Ton personnage ---

// Les noms selon l'âge : petit (moins de 18 ans), adulte, ancien (60 ans et plus).
const NOMS_JOUEUR = {
  garcon: { petit: 'PetitGoy', adulte: 'HommeGoy', ancien: 'AncienGoy' },
  fille: { petit: 'PetiteGoy', adulte: 'FemmeGoy', ancien: 'AncienneGoy' },
};
const AGE_DEPART = 15;

// --- Le calendrier ---
// 7 jours par semaine, 4 semaines par mois, 4 mois par an (un par saison).
const JOURS_PAR_SEMAINE = 7;
const JOURS_PAR_MOIS = 28;
const JOURS_PAR_AN = 112;
const MOIS = ['Mois des Semailles', 'Mois des Moissons', 'Mois des Brumes', 'Mois du Givre'];

// --- La comptabilité ---
// Les catégories de recettes et de dépenses, pour l'ardoise et les statistiques.
const POSTES = {
  butins: 'Parts de butin', reparations: 'Réparations', soins: 'Soins', encheres: 'Enchères',
  jeux: 'Jeux', cadeaux: 'Cadeaux', marche: 'Achats au marché', express: 'Marchand express',
  trouvailles: 'Trouvailles', reserve: 'Agrandissements', dedommagements: 'Dédommagements',
  remboursements: 'Remboursements de prêts', dons: 'Dons au mendiant', prets: 'Prêts reçus', salaires: 'Salaires',
};
// On garde le détail des derniers jours (un peu plus d'une année).
const JOURS_DE_COMPTES = 120;
// Le registre garde les dernières aventures terminées.
const TAILLE_HISTORIQUE = 150;

// Les choix de la création du personnage.
const APPARENCE = {
  coiffure: ['Courts', 'Longs', 'Bouclés', 'Hérissés', 'Chauve'],
  cheveux: [['Châtain', 0x8a5a2a], ['Noir', 0x2a1a10], ['Roux', 0xb5532a], ['Blond', 0xe8d890], ['Auburn', 0x7a2a1a], ['Bleu nuit', 0x2a3a6a]],
  peau: [['Claire', 0xf0c8a0], ['Dorée', 0xd8a070], ['Mate', 0xa86a40], ['Sombre', 0x6a4028]],
  yeux: [['Marron', 0x4a2a10], ['Bleus', 0x2f6ac0], ['Verts', 0x2f8a3a], ['Gris', 0x6a7080], ['Violets', 0x7a3aa0]],
  bouche: ['Souriante', 'Neutre', 'Étonnée', 'Grognon'],
  barbe: ['Aucune', 'Moustache', 'Courte', 'Longue'],
  haut: [['Bleu', 0x3a5a8a], ['Rouge', 0x9a3a2a], ['Vert', 0x4f7a3a], ['Violet', 0x6a4aa0], ['Moutarde', 0xc9a227], ['Gris', 0x6a6f78]],
  bas: [['Brun', 0x6a5a40], ['Noir', 0x2a2a30], ['Vert', 0x3a4a3a], ['Bleu', 0x3a4a6a], ['Beige', 0xb09a70]],
};

// --- Achat-revente : trouvailles, atelier, enchères ---

// Les catégories d'objets de valeur. `materiau` : ce qu'il faut pour les réparer ;
// `duree` : jours de réparation au début (l'artisanat les raccourcit).
const CATEGORIES = {
  arme: { nom: 'Arme', materiau: 'fer', duree: 3 },
  armure: { nom: 'Armure', materiau: 'fer', duree: 3 },
  bijou: { nom: 'Bijou', materiau: null, duree: 4 },
  artefact: { nom: 'Artefact', materiau: null, duree: 5 },
  vetement: { nom: 'Vêtement', materiau: 'cuir', duree: 2 },
};

// Les états, du pire au meilleur, et leur effet sur la valeur.
// Un code couleur pour s'y retrouver d'un coup d'œil : du rouge (cassé) à l'or (parfait).
// `reparation` : jours de réparation en plus quand l'objet part de cet état.
const ETATS = [
  { nom: 'Cassé', valeur: 0.2, couleur: 0xc0302a, texte: '#c0302a', reparation: 2 },
  { nom: 'Abîmé', valeur: 0.45, couleur: 0xd8702a, texte: '#c8601a', reparation: 1 },
  { nom: 'Usé', valeur: 0.7, couleur: 0xd8c030, texte: '#a88a10', reparation: 0 },
  { nom: 'Bon', valeur: 1, couleur: 0x4a9a3a, texte: '#2f7a2a', reparation: 0 },
  { nom: 'Parfait', valeur: 1.4, couleur: 0xf0c020, texte: '#b8860b', reparation: 0 },
];

// Les employés qu'on peut embaucher pour réparer plusieurs objets à la fois.
// `rapide` : ses réparations prennent un jour de moins. Le salaire est payé chaque nuit.
const EMPLOYES = {
  tobin: { nom: "Tobin l'apprenti", race: 'hobbit', salaire: 4, rapide: false, description: 'Jeune et appliqué, il apprend vite.' },
  marta: { nom: 'Marta la Rétameuse', race: 'nain', salaire: 9, rapide: true, description: 'Une naine experte : ses réparations prennent un jour de moins.' },
};

// Les objets que les aventuriers peuvent rapporter (valeur en parfait état... presque).
const TRESORS = [
  { nom: 'Hache runique', categorie: 'arme', valeur: 60 },
  { nom: 'Dague elfique', categorie: 'arme', valeur: 45 },
  { nom: 'Arc en if ancien', categorie: 'arme', valeur: 55 },
  { nom: 'Marteau de guerre nain', categorie: 'arme', valeur: 70 },
  { nom: 'Casque de chevalier', categorie: 'armure', valeur: 50 },
  { nom: 'Bouclier blasonné', categorie: 'armure', valeur: 40 },
  { nom: 'Cotte de mailles', categorie: 'armure', valeur: 65 },
  { nom: 'Bague en argent', categorie: 'bijou', valeur: 35 },
  { nom: 'Amulette de jade', categorie: 'bijou', valeur: 55 },
  { nom: 'Couronne de baronnie', categorie: 'bijou', valeur: 90 },
  { nom: 'Orbe de brume', categorie: 'artefact', valeur: 100 },
  { nom: 'Statuette d\'ivoire', categorie: 'artefact', valeur: 60 },
  { nom: 'Sablier des anciens', categorie: 'artefact', valeur: 85 },
  { nom: 'Cape de voyageur', categorie: 'vetement', valeur: 25 },
  { nom: 'Bottes de sept lieues usées', categorie: 'vetement', valeur: 45 },
  { nom: 'Chapeau de mage', categorie: 'vetement', valeur: 35 },
];

// On ne garde que ce nombre d'objets de valeur à l'atelier.
const PLACES_ATELIER = 8;

// Les enchérisseurs du Marché des Mastres, et ce qu'ils aiment.
const ENCHERISSEURS = [
  { nom: 'Lord Pommeroy', race: 'humain', aime: ['arme', 'armure'] },
  { nom: 'Dame Ysaline', race: 'elfe', aime: ['bijou', 'vetement'] },
  { nom: 'Gros Bob le collectionneur', race: 'hobbit', aime: ['artefact', 'bijou'] },
  { nom: 'Thrain Fendroc', race: 'nain', aime: ['arme', 'artefact'] },
];
const OBJETS_PAR_LOT = 3;

// --- Les quêtes des nouvelles zones ---
Object.assign(QUETES, {
  champignons: {
    titre: 'Cueillir les champignons de lune',
    accueil: "La Forêt des Murmures, hein ? On dit que des champignons rares y poussent... et que des esprits farceurs les gardent.",
    pv: 2, duree: [1, 2], butin: [25, 40],
    epreuves: [
      {
        type: 'esprits', besoin: 'torche', qte: 1,
        intro: 'Des esprits farceurs ont soufflé sur mon chemin pour me perdre dans le noir.',
        complet: 'Ta torche les a fait fuir en ricanant.',
        partiel: 'Ma torche vacillait, ils me tournaient autour...',
        rien: "J'ai tourné en rond toute la nuit.",
      },
      {
        type: 'champignons', besoin: 'antidote', qte: 1,
        intro: "J'ai goûté un champignon pour vérifier. Mauvaise idée. Très mauvaise idée.",
        complet: "Heureusement, ton antidote m'a remis d'aplomb.",
        partiel: 'Je voyais des lapins qui parlaient...',
        rien: "J'ai été malade pendant deux jours.",
      },
    ],
  },
  sangsues: {
    titre: 'Retrouver la cloche engloutie',
    accueil: "Les Marécages ? D'accord. On dit qu'une cloche d'argent dort au fond de l'eau, quelque part dans la brume.",
    pv: 2, duree: [2, 3], butin: [35, 50],
    epreuves: [
      {
        type: 'route', besoin: 'gourde', qte: 1,
        intro: "L'eau du marais était imbuvable.",
        complet: "Ta gourde m'a sauvé{e}.",
        partiel: "J'ai dû économiser chaque gorgée.",
        rien: "J'ai bu l'eau verte. Je préfère ne pas en parler.",
      },
      {
        type: 'sangsues', besoin: 'bandage', qte: 2,
        intro: "En plongeant pour la cloche, des sangsues énormes se sont collées à mes jambes !",
        complet: "J'ai pansé les morsures avec tes bandages, rien de grave.",
        partiel: "Pas assez de bandages... ça saignait encore le lendemain.",
        rien: "Les morsures se sont infectées.",
      },
      {
        type: 'nuit', besoin: 'torche', qte: 1,
        intro: 'La brume était si épaisse que je ne voyais plus mes mains.',
        complet: "Ta torche m'a guidé{e} jusqu'à la terre ferme.",
        partiel: 'Ma torche fumait dans l\'humidité...',
        rien: "J'ai erré dans le noir et la vase.",
      },
    ],
  },
  oasis: {
    titre: "Cartographier l'oasis perdue",
    accueil: "Les Terres Désolées... On raconte qu'une oasis secrète se cache derrière les dunes. Les marchands paieraient cher pour la carte !",
    pv: 2, duree: [2, 4], butin: [50, 70],
    epreuves: [
      {
        type: 'soif', besoin: 'gourde', qte: 2,
        intro: 'Le soleil tapait si fort que le sable brûlait à travers mes bottes.',
        complet: "Avec tes deux gourdes, j'ai tenu sans problème.",
        partiel: "Une seule gourde... J'ai cru mourir de soif.",
        rien: "Je n'avais rien à boire. Les mirages se moquaient de moi.",
      },
      {
        type: 'tempete', besoin: 'cape', qte: 1,
        intro: 'Une tempête de sable a tout englouti.',
        complet: "Je me suis enroulé{e} dans ta cape en attendant que ça passe.",
        partiel: "J'ai protégé mon visage comme j'ai pu.",
        rien: "Le sable m'a fouetté{e} pendant des heures.",
      },
      {
        type: 'pillards', besoin: 'bouclier', qte: 1,
        intro: "Des pillards m'attendaient à l'oasis !",
        complet: "Ton bouclier a arrêté leurs flèches. Ils ont fui.",
        partiel: 'Mon bouclier a cédé au troisième coup...',
        rien: "Sans bouclier, j'ai dû fuir sous leurs flèches.",
      },
    ],
  },
  yeti: {
    titre: 'Chasser le yéti des Pics',
    accueil: "Les Pics Gelés ? Brrr. Un yéti terrorise les bergers là-haut. Sa fourrure vaut une fortune.",
    pv: 2, duree: [3, 4], butin: [70, 95],
    epreuves: [
      {
        type: 'froid', besoin: 'cape', qte: 1,
        intro: 'Le froid mordait jusqu\'aux os.',
        complet: "Ta cape chaude m'a gardé{e} au chaud même dans le blizzard.",
        partiel: 'Mes doigts gelaient...',
        rien: "J'ai cru que mes oreilles allaient tomber.",
      },
      {
        type: 'yeti', besoin: 'epee', qte: 1,
        intro: "Le yéti a surgi de la neige, deux fois plus grand qu'un ours !",
        complet: "Ton épée l'a fait reculer jusqu'au bord de la falaise.",
        partiel: 'Ma lame glissait sur sa fourrure...',
        rien: 'Je me suis battu{e} à coups de bâton. Il a rigolé.',
      },
      {
        type: 'blessure', besoin: 'bandage', qte: 1,
        intro: "Ses griffes m'avaient entaillé le bras.",
        complet: "Tes bandages ont fait l'affaire.",
        partiel: 'Le sang gelait dans les bandages trop fins.',
        rien: "La blessure ne voulait pas se refermer dans ce froid.",
      },
    ],
  },
  col: {
    titre: 'Franchir le col des Glaces',
    accueil: "On dit qu'au-delà du col des Glaces se cache une vallée pleine de cristaux. Personne ne l'a franchi cet hiver.",
    pv: 2, duree: [3, 4], butin: [65, 90],
    epreuves: [
      {
        type: 'froid', besoin: 'cape', qte: 1,
        intro: 'Le vent glacé soufflait sans relâche.',
        complet: 'Bien emmitouflé{e} dans ta cape, je ne sentais rien.',
        partiel: 'Le froid passait à travers tout.',
        rien: "J'ai cru geler sur place.",
      },
      {
        type: 'avalanche', besoin: 'corde', qte: 2,
        intro: 'Une avalanche a dévalé la pente juste au-dessus de moi !',
        complet: "Encordé{e} au rocher avec tes cordes, j'ai tenu bon.",
        partiel: 'Une seule corde... elle a failli lâcher.',
        rien: "La neige m'a emporté{e} sur cent mètres.",
      },
      {
        type: 'route', besoin: 'ration', qte: 2,
        intro: 'La descente a duré trois jours dans la neige.',
        complet: 'Tes rations étaient précieuses.',
        partiel: "J'ai fini le ventre vide.",
        rien: "Je n'avais plus rien à manger.",
      },
    ],
  },
  roiSorcier: {
    titre: 'Briser la couronne du Roi-Sorcier',
    accueil: "Les Ruines du Roi-Sorcier ? Là où les morts marchent ? ... Bon. Si c'est toi qui le dis. Prépare-moi bien.",
    pv: 2, duree: [3, 5], butin: [90, 120],
    epreuves: [
      {
        type: 'mortvivant', besoin: 'epee', qte: 1,
        intro: 'Des squelettes se sont relevés de leurs tombes en claquant des dents.',
        complet: 'Ton épée les a remis en morceaux. Ils ne se relèveront plus.',
        partiel: 'Ils se relevaient à chaque fois...',
        rien: "Sans arme, j'ai dû courir. Très vite.",
      },
      {
        type: 'malediction', besoin: 'amulette', qte: 1,
        intro: 'Dans la salle du trône, une voix a murmuré une malédiction.',
        complet: "Ton amulette a brillé et la malédiction s'est brisée.",
        partiel: "J'ai senti le froid de la mort sur ma nuque...",
        rien: "La malédiction m'a frappé{e} en plein cœur.",
      },
      {
        type: 'grotte', besoin: 'torche', qte: 2,
        intro: 'Les cryptes sous les ruines étaient noires comme la nuit.',
        complet: 'Avec tes torches, j\'ai trouvé la sortie.',
        partiel: 'Ma dernière torche s\'est éteinte trop tôt.',
        rien: "J'ai rampé dans le noir parmi les os.",
      },
    ],
  },
  bete: {
    titre: "Affronter la Bête de l'antre",
    accueil: "L'Antre de la Bête... Si j'en reviens, je serai riche pour toujours. Si. Donne-moi ce que tu as de meilleur.",
    pv: 3, duree: [4, 5], butin: [150, 220],
    epreuves: [
      {
        type: 'route', besoin: 'ration', qte: 3,
        intro: "La route vers l'antre traverse des terres brûlées.",
        complet: "Tes rations m'ont donné la force d'arriver.",
        partiel: "J'étais affamé{e} en arrivant.",
        rien: "J'avais l'estomac vide avant même le combat.",
      },
      {
        type: 'monstre', besoin: 'bouclier', qte: 1,
        intro: "La Bête m'a craché un torrent de flammes !",
        complet: "Ton bouclier a encaissé le feu. J'ai senti la chaleur, mais j'étais vivant{e}.",
        partiel: 'Mon bouclier a fondu à moitié...',
        rien: "Je n'avais rien pour me protéger des flammes.",
      },
      {
        type: 'monstre', besoin: 'epee', qte: 1,
        intro: "Il fallait frapper. Maintenant ou jamais.",
        complet: "Ta lame a trouvé la faille sous ses écailles !",
        partiel: 'Ma lame rebondissait sur ses écailles...',
        rien: 'Je l\'ai frappée avec une pierre. Elle a ri.',
      },
      {
        type: 'blessure', besoin: 'potion', qte: 1,
        intro: 'Le combat m\'avait laissé{e} à moitié mort{e}.',
        complet: 'Ta potion m\'a ramené{e} à la vie.',
        partiel: 'Le remède ne suffisait pas...',
        rien: "J'ai rampé hors de l'antre, à bout de forces.",
      },
    ],
  },
});
