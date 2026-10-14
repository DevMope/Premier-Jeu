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

// Les soins qu'on peut donner en plus de la commande :
// - une potion en plus = un cœur de réserve ;
// - un bandage en plus = il arrête un saignement (sinon, le saignement coûte un cœur de plus).
const OBJETS_DE_SOIN = ['potion', 'bandage'];
// La chance qu'un combat raté fasse saigner l'aventurier.
const CHANCE_SAIGNEMENT = 0.35;
// Pas plus de 2 bandages en plus de la commande : le reste ne lui servirait à rien.
const BANDAGES_EN_PLUS_MAX = 2;
// Le sac de l'aventurier : combien d'objets en plus de sa commande il peut porter.
const SAC = { hobbit: 2, magicienne: 2, humain: 3, elfe: 3, nain: 4, gobelin: 2, momie: 2, vampire: 3, loupgarou: 3, orc: 4, panda: 4, troll: 5 };
// Les peuples de l'ombre (les Bannis) et ceux qui n'arrivent que plus tard côté lumière
const PEUPLES_OMBRE = ['gobelin', 'orc', 'loupgarou', 'vampire', 'momie', 'troll'];
const PEUPLES_LUMIERE_TARD = ['panda'];

// --- Étape 9d : la garde de la Confrérie ---
// Un capitaine humain, et un garde d'un des peuples de la lumière à ses côtés (tabard bleu au
// soleil d'or). La première visite : une amende. Les suivantes : une fouille (les objets interdits
// sont saisis). On peut tenter de soudoyer le garde avec un trésor de l'atelier.
const GARDE = {
  capitaine: { nom: 'Capitaine Edmond Brisefer', race: 'humain', feminin: false, garde: true, costume: 'garde', niveau: 'veteran' },
  peuples: ['humain', 'nain', 'elfe', 'hobbit', 'panda'],
  noms: { humain: ['Sergent Basile Courtepaille', 'Garde Odette Vifargent'], nain: ['Garde Brokk Ferpoing', 'Garde Hilde Rocdur'], elfe: ['Garde Aelar Feuillevent', 'Garde Ilwen Clairebrise'],
    hobbit: ['Garde Pippin Rondelet', 'Garde Marguerite Fourneau'], panda: ['Garde Wen Bambou-Sage', 'Garde Lan Pas-Tranquille'] },
  amendeMin: 15, amendePart: 0.12,     // l'amende : 12 % de ta bourse, au moins 15 pièces
  soudoiement: 0.35, bonusGout: 0.4, bonusValeur: 0.25, gardeObjet: 0.15,   // les chances, et le risque qu'il garde l'objet sans rien faire
  chance: 0.16, parPalier: 0.1, parDeco: 0.06, delai: 5,                    // une visite surprise quand le comptoir penche vers l'ombre
};
// Ce que chaque peuple aime parmi les trésors (pour le soudoiement)
const GOUTS_TRESORS = { humain: ['arme', 'vetement'], nain: ['arme', 'armure'], elfe: ['bijou', 'artefact'], hobbit: ['vetement', 'bijou'], magicienne: ['artefact', 'bijou'], panda: ['artefact', 'vetement'] };

// --- Étape 9e : le marché noir ---
// Certains soirs, un papier glissé sous la porte : la porte dérobée de l'arrière-boutique s'ouvre
// sur une cave aux lanternes rouges. Le Passeur y vend des objets interdits, les Bannis y passent
// commande, on y vend ses trouvailles sans questions. Chaque affaire augmente le risque qu'une
// plainte fasse venir la garde le lendemain.
const INTERDITS = {
  poison: { nom: 'Fiole de poison', prix: 14, vente: [30, 44] },
  grimoire: { nom: 'Grimoire interdit', prix: 24, vente: [48, 70] },
  poudre: { nom: 'Poudre de lune noire', prix: 10, vente: [22, 32] },
  passe: { nom: 'Passe-partout', prix: 16, vente: [34, 48] },
};
const MARCHE_NOIR = {
  debut: 6,                     // le premier soir possible
  chance: 0.33, chanceOmbre: 0.5, // un soir sur trois, un sur deux quand la jauge penche vers l'ombre
  mots: ['Corbeau', 'Lanterne', 'Chardon', 'Minuit', 'Tonneau', 'Belette', 'Ronce', 'Brume'],
  risqueAchat: 0.05, risqueCommande: 0.12, risqueVente: 0.08,   // le risque d'une plainte, par affaire
  venteTresor: 1.15,           // une trouvaille se vend 15 % plus cher qu'à son prix (sans questions)
  ombreAffaire: 0.5,           // chaque commande d'un Banni fait pencher la jauge (en « objets de l'ombre »)
};
// Ce qu'on murmure dans la cave (des indices sur le Conseil des Gardiens, à la légère)
const MURMURES = [
  "Il paraît que le Sage du Conseil a fait brûler les vieux registres de naissance. Pourquoi brûler des naissances ?",
  "Mon grand-père était né dans la Vallée des Pommiers. On l'appelle le Bourbier, maintenant. Lui, il ne s'en souvenait pas.",
  "Personne n'a vu le dragon. Mais tout le monde a vu les impôts pour le combattre.",
  "Les gobelins chantent une berceuse dont plus personne ne connaît les paroles. Juste l'air.",
  "Les gardes ne descendent jamais ici sans être payés pour ne pas voir.",
  "Un homme à la cape verte passe parfois. Quand il parle, même les orcs se taisent.",
  "Avant, il y avait des villages de loups-garous sur la colline. Avant quoi ? Va savoir.",
  "On dit que les momies se souviennent de tout, parce qu'elles dormaient pendant le grand oubli.",
];

// --- Étape 9d : Garrick repasse prendre des nouvelles ---
// Toujours bienveillant, il plaisante, et laisse tomber des choses à la légère. (Le joueur ne sait
// pas encore que Garrick est le chef des Bannis, ni ce que le Conseil des Gardiens a fait.)
const GARRICK_VISITES = [
  { jour: 4, texte: "Alors, petit, ce comptoir ? Tu as l'air de t'en sortir ! Tiens, pour les débuts difficiles. ... Et ne crois pas tout ce qu'on raconte au marché. Les gens répètent ce qu'on leur a appris à répéter, ha ha !", cadeau: 20 },
  { jour: 10, texte: "Un dragon sous la montagne, hein ? Ça fait cent ans que j'entends ça. Personne ne l'a jamais vu, mais tout le monde le craint. Drôle de bête, tu ne trouves pas ?" },
  { jour: 17, texte: "On dit beaucoup de mal des gobelins. Moi j'en ai connu un qui rendait la monnaie juste ! Rare, hein ? Ha ha ! ... Si un jour un Banni frappe à ta porte, sers-le comme un autre. Une pièce, c'est une pièce." },
  { jour: 25, texte: "Le Conseil des Gardiens a encore voté une taxe. Ils ont l'air si sages, dans leurs grandes robes blanches... Bah. Ne m'écoute pas, je radote." },
  { jour: 34, texte: "Ma grand-mère disait qu'il poussait des pommiers, dans les terres d'ombre. Avant. Avant quoi ? Elle ne savait plus. Personne ne sait plus, d'ailleurs. C'est curieux, la mémoire.", cadeau: 30 },
  { jour: 44, texte: "Le grand Sage du Conseil... Tu savais que personne ne connaît son âge ? Mon père le voyait déjà vieux. Et son père avant lui. Ha ! Il doit avoir un bon apothicaire." },
  { jour: 56, texte: "Tu as bien grandi, petit. Un jour, je te raconterai d'où je viens vraiment. Pas aujourd'hui. Aujourd'hui, je t'achète une ration et je repars, ha ha !" },
];

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

// Les améliorations du shop : chaque meuble a 4 niveaux de luxe (0 à 3), commandés le soir au
// bureau ; les ouvriers les installent pendant la nuit. Chacune donne un petit bonus, et un
// shop plus beau gagne un peu de réputation. (La réserve suit ses agrandissements.)
const AMELIORATIONS = {
  reserve: { nom: "L'étagère de la réserve", niveaux: ['Planches brutes', 'Chêne ciré', 'Noyer à moulures', 'Ébène et dorures'],
    effet: 'Plus de place dans ta réserve.' },
  comptoir: { nom: 'Le comptoir', niveaux: ['Chêne brut', 'Chêne verni', 'Noyer et laiton', 'Ébène et dorures'], prix: [150, 400, 900],
    effet: 'Un beau comptoir inspire confiance : les aventuriers te reversent +4 % de butin par niveau.' },
  coffre: { nom: 'Le coffre de la fortune', niveaux: ['Coffre de bois', 'Coffre ferré', 'Coffre-fort de nain', "Coffre d'or gravé"], prix: [100, 280, 650],
    effet: 'Ta fortune rapporte des intérêts chaque nuit : 1 % par niveau (15 p. max par niveau).' },
  chambre: { nom: 'La chambre', niveaux: ['Paillasse', 'Lit de bois', 'Lit sculpté et édredon', 'Lit à baldaquin'], prix: [80, 220, 500],
    effet: "Mieux reposé : +1 d'expérience par nuit et par niveau ; des réveils en forme (un client ou une remise de plus) ; des rêves qui révèlent un indice ; et une nuit qui console après un mauvais jour." },
  eclairage: { nom: "L'éclairage", niveaux: ['Bougies', 'Lanternes', 'Chandeliers', 'Lustre de cristal'], prix: [90, 250, 600],
    effet: 'Un shop bien éclairé attire le regard : +0,3 client par jour et par niveau.' },
  atelier: { nom: "L'atelier", niveaux: ['Un établi', 'Deux établis', 'Trois établis'], prix: [220, 480],
    effet: "Un établi de plus : une place pour un employé de plus (2, puis 3, puis 4) et 2 places de plus pour les objets." },
};
// Ce qu'une bonne chambre apporte au réveil, par niveau de lit :
// - `forme` : chance de se réveiller en forme (un client de plus, ou 10 % de remise au marché ce jour-là) ;
// - `reve` : chance (dès le lit sculpté) de rêver d'un indice : le sort d'un aventurier qui rentre,
//   un événement à venir, ou ce qui se vendra cher aux enchères ;
// - `reconfort` : après un mauvais jour (un mort, ou la faillite frôlée), une part de réputation retrouvée ;
// - `sante` : pour plus tard, quand on vieillira : une bonne chambre ralentit la fatigue des vieux jours.
const CHAMBRE = { forme: 0.15, reve: 0.25, reconfort: 0.15, remise: 0.1, encheres: 1.15, sante: 0.25 };
// La réputation gagnée à chaque amélioration terminée.
const REPUTATION_AMELIORATION = 0.15;

// Le marchand express passe au comptoir pendant la journée :
// pratique pour sauver un voyage, mais bien plus cher que le fournisseur.
// Un vieux gobelin avare, recroquevillé à côté de sa caravane.
const MARCHAND_EXPRESS = { nom: 'Vieux Grippesou', multiplicateur: 2.5 };
// De temps en temps, Grippesou a aussi du fer ou du cuir... à un prix délirant.
const EXPRESS_MATERIAUX = { chance: 0.4, multiplicateur: 4.5 };

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
const REFUS_CLIENT = 0.5;

// Les prêts : les banquiers nains prêtent plus, et moins cher, quand ta réputation grandit.
// La Main Noire (`mal`) ne prête qu'à ceux qui ont choisi le camp du mal (plus tard dans le jeu).
const PRETS = [
  // Cinq prêts de la Banque Centrale Goyenne : il faut de plus en plus de réputation entre chacun.
  { id: 'petit', preteur: 'Banque Centrale Goyenne', nom: 'Petit prêt', somme: 60, taux: 0.15, jours: 5, reputation: -Infinity }, // le prêt de secours : toujours possible
  { id: 'artisan', preteur: 'Banque Centrale Goyenne', nom: "Prêt d'artisan", somme: 120, taux: 0.12, jours: 6, reputation: 3 },
  { id: 'marchand', preteur: 'Banque Centrale Goyenne', nom: 'Prêt marchand', somme: 220, taux: 0.09, jours: 8, reputation: 7 },
  { id: 'grand', preteur: 'Banque Centrale Goyenne', nom: 'Grand prêt', somme: 400, taux: 0.06, jours: 10, reputation: 12 },
  { id: 'guilde', preteur: 'Banque Centrale Goyenne', nom: 'Prêt de la Guilde', somme: 750, taux: 0.04, jours: 14, reputation: 18 },
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
// (audit v0.53, constat 1) Chaque étoile au-delà de la première rend chaque épreuve plus dure ;
// l'expérience de l'aventurier (son bonus de niveau) compense en partie.
const MALUS_DANGER = 0.08;

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
        intro: 'Des jours de marche à travers les collines...',
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
  // Les Bannis (ils ne viennent qu'une fois la jauge passée côté ombre) et les pandas (côté lumière)
  gobelin: [['Grinx Pincefer', false], ['Zizka Mordille', true], ['Ratchou Ventrecreux', false], ['Nibble Griffecourte', true]],
  orc: [['Gorrak Brise-Crâne', false], ['Urza Dent-de-Fer', true], ['Mogdar Poing-Noir', false], ['Sharga Hurlevent', true]],
  loupgarou: [['Fenrick Lunegrise', false], ["Ysra Croc-d'Argent", true], ['Varguel Pleine-Lune', false], ['Nocta Pelage-Noir', true]],
  vampire: [['Vladek Sangfroid', false], ['Carmilla Nuit-Pâle', true], ['Ambrose Veine-Noire', false], ['Lisbeth Crépuscule', true]],
  momie: [['Nekhet Sable-Ancien', false], ['Amunet Bandelette', true], ['Khafra Poussière', false], ['Tiyé Sept-Sceaux', true]],
  troll: [['Grumsh Mange-Pierre', false], ['Bolga Roc-Fendu', true], ['Ugrok Pont-Vieux', false], ['Thrunda Mousse-Grise', true]],
  panda: [['Bao Bambou-Doux', false], ['Mei Lune-Calme', true], ['Tenzin Pas-Lourd', false], ['Lin Feuille-Verte', true]],
};

// Quand les noms ci-dessus sont tous pris (beaucoup de clients, de longues missions), on en
// compose d'autres : un prénom et un nom de famille du même peuple.
const NOMS_COMPOSES = {
  humain: { m: ['Bertrand', 'Guillaume', 'Thibaut', 'Renaud', 'Arnaud', 'Gauvain'], f: ['Isabeau', 'Margot', 'Clémence', 'Aude', 'Blanche', 'Ysabelle'],
    familles: ['Desmarais', 'Hautval', 'Combebrune', 'Lorvent', 'Piquemont', 'Verrière'] },
  hobbit: { m: ['Pim', 'Bartho', 'Odo', 'Fosco', 'Pépin'], f: ['Daisy', 'Primula', 'Myrtille', 'Pervenche', 'Capucine'],
    familles: ['Sous-Colline', 'Boisfleuri', 'Pied-Léger', 'Tonnelier', 'Fougerac'] },
  nain: { m: ['Balgor', 'Durmik', 'Korvin', 'Thrandur', 'Bofur'], f: ['Hilde', 'Dagny', 'Runa', 'Sigrun', 'Ingrid'],
    familles: ["Marteau-d'Or", 'Barbe-Grise', 'Forge-Ardente', 'Pierre-Fendue', 'Poing-de-Fer'] },
  elfe: { m: ['Caelith', 'Aranor', 'Thalion', 'Ilvar', 'Erendis'], f: ['Naëlle', 'Elwyn', 'Sariel', 'Lyra', 'Ithil'],
    familles: ['Feuillargent', "Chant-d'Aube", 'Ventclair', 'Étoile-Pâle', 'Rive-Lune'] },
  magicienne: { m: [], f: ['Morgane', 'Albane', 'Sélène', 'Ondine', 'Iris', 'Mélusine'],
    familles: ["Brume-d'Opale", 'Cent-Sorts', 'Lune-Pâle', "Plume-d'Encre", 'Flamme-Bleue'] },
  gobelin: { m: ['Snik', 'Grob', 'Pikel', 'Mozz'], f: ['Tizzi', 'Nakka', 'Rizla', 'Gobbie'], familles: ['Pincefer', 'Mordille', 'Ventrecreux', 'Trousse-Bourse'] },
  orc: { m: ['Thrak', 'Mogrul', 'Durbag', 'Karg'], f: ['Urza', 'Gruna', 'Sharga', 'Morka'], familles: ['Brise-Crâne', 'Dent-de-Fer', 'Poing-Noir', 'Hurlevent'] },
  loupgarou: { m: ['Fenrick', 'Varguel', 'Lupan', 'Garrou'], f: ['Ysra', 'Nocta', 'Louve', 'Selva'], familles: ['Lunegrise', "Croc-d'Argent", 'Pleine-Lune', 'Pelage-Noir'] },
  vampire: { m: ['Vladek', 'Ambrose', 'Lucan', 'Sévrin'], f: ['Carmilla', 'Lisbeth', 'Morwenna', 'Ilse'], familles: ['Sangfroid', 'Nuit-Pâle', 'Veine-Noire', 'Crépuscule'] },
  momie: { m: ['Nekhet', 'Khafra', 'Sethos', 'Imhot'], f: ['Amunet', 'Tiyé', 'Nefret', 'Isha'], familles: ['Sable-Ancien', 'Bandelette', 'Poussière', 'Sept-Sceaux'] },
  troll: { m: ['Grumsh', 'Ugrok', 'Borrog', 'Tuk'], f: ['Bolga', 'Thrunda', 'Mogra', 'Hulda'], familles: ['Mange-Pierre', 'Roc-Fendu', 'Pont-Vieux', 'Mousse-Grise'] },
  panda: { m: ['Bao', 'Tenzin', 'Jian', 'Norbu'], f: ['Mei', 'Lin', 'Yuki', 'Pema'], familles: ['Bambou-Doux', 'Lune-Calme', 'Pas-Lourd', 'Feuille-Verte'] },
};

// La première journée est écrite à la main.
// Pippa a déjà sa lettre à porter ; les autres viennent chercher l'aventure : c'est toi qui choisis la zone.
const JOUR_1 = [
  { quete: 'lettre', nom: 'Pippa Boisclair', race: 'hobbit', feminin: true, butin: 30, duree: 1 },
  { quete: null, nom: 'Durgan Barbe-de-Fer', race: 'nain', feminin: false, niveau: 'novice', envie: 'or' },
  { quete: null, nom: "Mirabelle Lune-d'Argent", race: 'magicienne', feminin: true, niveau: 'novice', envie: 'savoir' },
];
// Les premiers jours, pas plus de clients que ça (sans compter les lettres) : on apprend.
const CLIENTS_DEBUT = { jours: 3, max: 3 };
// Chaque sorte d'objet en stock attire un peu de monde (0,15 avant : −35 %).
const CLIENTS_PAR_OBJET = 0.1;
// La réputation gagnée par une mission réussie (×1,5 dans les terres de lumière).
const GAIN_REPUTATION_SUCCES = 0.6;
// Les paliers de réputation : chacun relève le nombre maximum de clients de passage par jour
// (sans compter ceux des lettres). Entre deux paliers, plus de réputation = toujours plus de clients,
// mais jamais au-delà du plafond : de quoi garder le dispatch gérable et le temps de s'équiper.
// Chaque palier franchi est un événement : la gazette en parle, un visiteur notable vient te
// féliciter au comptoir, et quelque chose se débloque (`recompense`).
const PALIERS_CLIENTS = [
  { reputation: -Infinity, max: 3, nom: 'Échoppe inconnue' },
  { reputation: 2, max: 4, nom: 'Échoppe du coin', visiteur: 'bourgmestre', recompense: { type: 'etals' },
    gazette: "On commence à parler d'une petite échoppe pleine de promesses, au bout du village..." },
  { reputation: 5, max: 5, nom: 'Comptoir apprécié', visiteur: 'colporteur', recompense: { type: 'colporteur' },
    gazette: 'Les colporteurs des grands chemins ont ajouté un comptoir à leur tournée.' },
  { reputation: 9, max: 6, nom: 'Comptoir réputé', visiteur: 'heraut', recompense: { type: 'prestige', prime: 60 },
    gazette: 'La Confrérie du Dernier Rempart cite un comptoir en exemple. Les nobles dressent l\'oreille.' },
  { reputation: 14, max: 7, nom: 'Comptoir renommé', visiteur: 'bourgmestre', recompense: { type: 'decoration', id: 'blason', prime: 100 },
    gazette: 'Le bourg a décerné son blason à un marchand. Du jamais vu depuis trois générations !' },
  { reputation: 20, max: 8, nom: 'Comptoir célèbre', visiteur: 'legende', recompense: { type: 'legendes', prime: 150 },
    gazette: 'Une légende vivante aurait été vue devant un comptoir de la Comté. Les curieux affluent.' },
  { reputation: 28, max: 10, nom: 'Comptoir légendaire', visiteur: 'heraut', recompense: { type: 'decoration', id: 'sceau', prime: 300 },
    gazette: "La Confrérie a remis son sceau d'or. On viendra de loin pour ce comptoir-là." },
];
// Les clients prestigieux (dès le palier « Comptoir réputé ») : des nobles et des collectionneurs
// qui paient le double... mais qui ont une exigence. Si elle n'est pas remplie, ils repartent
// vexés, et ta réputation en prend un coup.
const PRESTIGIEUX = [
  { nom: 'Dame Aliénor de Hautval', race: 'humain', feminin: true },
  { nom: 'Sire Baudouin de Montclair', race: 'humain', feminin: false },
  { nom: 'Lord Edgard Pommeroy', race: 'humain', feminin: false },
  { nom: 'Dame Ysaline des Bois-Clairs', race: 'elfe', feminin: true },
  { nom: 'Seigneur Thrain Fendroc', race: 'nain', feminin: false },
  { nom: 'Comtesse Primula Sous-Colline', race: 'hobbit', feminin: true },
];
const CHANCE_PRESTIGE = 0.3;
const PRESTIGE_BUTIN = 2;
const PERTE_PRESTIGE = 0.5; // la réputation perdue quand un prestigieux repart vexé
const EXIGENCES = {
  comptoir: { nom: 'un beau comptoir', verifier: G => niveauAmelioration(G, 'comptoir') >= 1,
    texte: 'Un comptoir en chêne brut ? Je ne traite pas dans une échoppe de village. Faites-le vernir, et nous reparlerons.' },
  eclairage: { nom: 'un shop bien éclairé', verifier: G => niveauAmelioration(G, 'eclairage') >= 1,
    texte: "On n'y voit rien, ici ! Des bougies, à notre époque... Revenez me voir quand vous aurez des lanternes." },
  objet: { nom: 'un objet rare en stock', verifier: (G, id) => (G.stock[id] || 0) >= 1,
    texte: 'Pas la moindre {objet} en stock ? Et vous vous dites fournisseur ? Je vais voir ailleurs.' },
};
const OBJETS_EXIGES = ['amulette', 'antidote', 'cape', 'bouclier'];
// Dès ce palier (« Comptoir réputé »), une part des clients devient exigeante : commandes plus
// grosses, un objet rare en plus, et du matériel neuf (un objet usé compte moins).
const PALIER_EXIGEANT = 3;
const CHANCE_EXIGEANT = [0, 0, 0, 0.4, 0.6, 0.8, 0.9];
// Une fois le colporteur débloqué, il passe au comptoir certains jours.
const CHANCE_COLPORTEUR = 0.35;
const COLPORTEUR = { nom: 'Barnabé le colporteur', multiplicateur: 1.25 };
// Le premier jour où la Faucheuse peut venir annoncer les morts.
const JOUR_FAUCHEUSE = 5;
// Une contrée est « conquise » après ce nombre de missions réussies : son drapeau flotte sur ta carte.
const CONQUETE_ZONE = 5;

// --- Le dispatch : les zones où envoyer les aventuriers ---

// Le niveau d'un aventurier : un vétéran a un cœur de plus et vise plus gros.
// Les niveaux d'un aventurier, gagnés au fil de ses missions réussies (`succes`).
// `bonus` : un petit plus à chaque épreuve. Seuls les héros osent les zones à 5 étoiles.
const NIVEAUX_AVENTURIER = {
  novice: { nom: 'Novice', pv: 0, butin: 0.9, bonus: 0, succes: 0 },
  aguerri: { nom: 'Aguerri', pv: 0, butin: 1, bonus: 0.02, succes: 1 },
  veteran: { nom: 'Vétéran', pv: 1, butin: 1.15, bonus: 0.04, succes: 3 },
  heros: { nom: 'Héros', pv: 1, butin: 1.3, bonus: 0.06, succes: 6 },
  legende: { nom: 'Légende', pv: 2, butin: 1.5, bonus: 0.08, succes: 10 },
};
const ORDRE_NIVEAUX = Object.keys(NIVEAUX_AVENTURIER);

// Ce qu'ils viennent chercher.
const ENVIES = {
  or: "Je veux de l'or, beaucoup d'or ! Où est-ce que je peux en trouver ?",
  gloire: "Je cherche la gloire. Une aventure dont on parlera dans les tavernes !",
  savoir: "On dit que le monde regorge de secrets. Où devrais-je aller les chercher ?",
  monstre: "Il me faut un monstre à combattre. Tu connais un coin dangereux ?",
};

// Les zones, de la plus calme à la plus dangereuse. `biome` : les couleurs de son paysage.
// `reputation` : la réputation qui l'ouvre (sinon, un aventurier peut la découvrir dans un récit).
// Au-delà de 2 étoiles, il faut aussi des retours réussis dans l'étoile d'avant (RETOURS_POUR_ETOILE).
// `x`, `y` : sa place sur la carte. `camp` : 'bien' (terres de lumière, à l'ouest),
// 'mal' (terres d'ombre, à l'est), ou rien (les terres du milieu).
const ZONES = {
  collines: {
    nom: 'Les Collines de la Comté', danger: 1, reputation: 0, x: 820, y: 560, royaume: 'comte', biome: 'comte',
    description: 'Des routes tranquilles, des rivières et quelques loups. Parfait pour les débutants.',
    quetes: ['lettre', 'sanglier'],
  },
  foret: {
    nom: 'La Forêt des Murmures', danger: 2, reputation: 0, x: 640, y: 450, royaume: 'humains', biome: 'foret',
    description: 'Des arbres immenses, des bêtes sauvages et des ruines oubliées sous la mousse.',
    quetes: ['loup', 'ruines', 'champignons'],
  },
  marais: {
    nom: 'Les Marécages de Brume-Noire', danger: 2, reputation: 0, x: 430, y: 350, royaume: 'humains', biome: 'marais',
    description: 'Une eau croupie, des sangsues et des feux follets qui égarent les voyageurs.',
    quetes: ['fleur', 'sangsues'],
  },
  mines: {
    nom: 'Les Mines abandonnées', danger: 3, reputation: 3, x: 900, y: 330, royaume: 'nains', biome: 'mines',
    description: 'Des galeries noires, des éboulements, et des araignées géantes. Mais quel minerai !',
    quetes: ['mine'],
  },
  desert: {
    nom: 'Les Terres Désolées', danger: 3, reputation: 4, x: 1230, y: 560, royaume: 'sauvages', biome: 'desert',
    description: 'Le soleil, la soif, les tempêtes de sable et les pillards. Les caravanes paient bien.',
    quetes: ['caravane', 'oasis'],
  },
  pics: {
    nom: 'Les Pics Gelés', danger: 4, reputation: 8, x: 840, y: 105, royaume: 'nains', biome: 'neige',
    description: 'Le froid qui mord, les avalanches et les yétis. Il faut une cape chaude.',
    quetes: ['yeti', 'col'],
  },
  ruinesRoi: {
    nom: 'Les Ruines du Roi-Sorcier', danger: 4, reputation: 10, x: 1230, y: 330, royaume: 'sauvages', biome: 'ruines',
    description: "Des morts qui marchent et des malédictions anciennes. Une amulette n'est pas de trop.",
    quetes: ['roiSorcier'],
  },
  antre: {
    nom: "L'Antre de la Bête", danger: 5, reputation: 15, x: 1250, y: 110, royaume: 'sauvages', biome: 'antre',
    description: "Personne n'en est revenu depuis des années. Mais le trésor qu'on y raconte...",
    quetes: ['bete'],
  },
  // Les terres de lumière : les quêtes du bien font monter ta réputation.
  monastere: {
    nom: 'Le Monastère des Pandas', danger: 2, reputation: 0, x: 230, y: 625, royaume: 'bambous', biome: 'monastere', camp: 'bien',
    description: 'Des moines pandas, des jardins de bambous et des pèlerins à protéger sur la route.',
    quetes: ['pelerins'],
  },
  sanctuaire: {
    nom: 'Le Sanctuaire des Elfes', danger: 4, reputation: 8, x: 450, y: 135, royaume: 'elfes', biome: 'sanctuaire', camp: 'bien',
    description: "Une forêt d'argent où les elfes veillent sur l'Arbre-Mère. Il faut le défendre.",
    quetes: ['graine'],
  },
  citadelle: {
    nom: 'La Citadelle des Paladins', danger: 4, reputation: 9, x: 1385, y: 425, biome: 'citadelle', camp: 'bien',
    description: 'Le siège de la Confrérie du Dernier Rempart, face aux terres des Bannis. Assiégée nuit et jour.',
    quetes: ['siege'],
  },
  // Les terres d'ombre : plus d'or, mais tu nourris le mal. Seuls les aventuriers vénaux
  // (ceux qui ne cherchent que l'or) acceptent d'y aller.
  bourbier: {
    nom: 'Le Bourbier des Gobelins', danger: 2, reputation: 0, x: 1580, y: 565, royaume: 'bannis', biome: 'bourbier', camp: 'mal',
    description: "Selon l'avis du Conseil, les gobelins y paient en or volé ceux qui attaquent les caravanes.",
    quetes: ['pillage'],
  },
  repaire: {
    nom: 'Le Repaire des Loups-garous', danger: 3, reputation: 4, x: 1735, y: 265, royaume: 'bannis', biome: 'repaire', camp: 'mal',
    description: 'Sous la lune rouge, la meute paie pour qu\'on lui porte des pactes. Le Conseil dit que ce sont des sortilèges.',
    quetes: ['pacte'],
  },
  tour: {
    nom: 'La Tour du Nécromancien', danger: 4, reputation: 9, x: 1760, y: 110, royaume: 'bannis', biome: 'tour', camp: 'mal',
    description: 'Le Nécromancien réclame les reliques des temples de la Lumière. « Volées », dit le Conseil.',
    quetes: ['profanation'],
  },
  // --- Le grand monde (v0.54) : dix contrées de plus, rangées par royaume ---
  vergers: {
    nom: 'Les Vergers de Bourg-Joyeux', danger: 1, reputation: 1, x: 1080, y: 575, royaume: 'comte', biome: 'comte', vignette: 'vergers',
    description: 'Des pommiers à perte de vue, des fermiers généreux... et des renards bien trop gros.',
    quetes: ['renards'],
  },
  port: {
    nom: 'Port-Brisant', danger: 2, reputation: 2, x: 420, y: 590, royaume: 'humains', biome: 'cote',
    description: 'Le grand port des Hommes, sur le Fleuve. Des marins, des marchands, des contrebandiers.',
    quetes: ['contrebande'],
  },
  forge: {
    nom: 'Les Portes de Khaz-Durim', danger: 3, reputation: 5, x: 1020, y: 175, royaume: 'nains', biome: 'mines', vignette: 'forge',
    description: 'La cité des Nains, taillée dans la montagne. Ses convois de minerai attirent les pillards.',
    quetes: ['convoi'],
  },
  lac: {
    nom: 'Le Lac des Lunes', danger: 4, reputation: 8, x: 645, y: 235, royaume: 'elfes', biome: 'sanctuaire', vignette: 'lac', camp: 'bien',
    description: "Un lac d'argent où les elfes chantent chaque nuit. Des esprits froids rôdent sur ses rives.",
    quetes: ['lunes'],
  },
  opale: {
    nom: "La Cité d'Opale", danger: 5, reputation: 15, x: 205, y: 150, royaume: 'mages', biome: 'opale', camp: 'bien',
    description: 'La capitale des Mages, où siège le Sage du Conseil. On dit que ses tours chantent.',
    quetes: ['cristal'],
  },
  bibliotheque: {
    nom: 'La Bibliothèque Interdite', danger: 5, reputation: 18, x: 175, y: 410, royaume: 'mages', biome: 'opale', vignette: 'bibliotheque',
    description: "Tous les savoirs du monde, sous clé. Les Mages n'aiment pas qu'on y fouille.",
    quetes: ['grimoire'],
  },
  pont: {
    nom: 'Le Pont des Trolls', danger: 2, reputation: 1, x: 1760, y: 470, royaume: 'bannis', biome: 'foret', vignette: 'pont', camp: 'mal',
    description: "Un vieux pont moussu, gardé par des trolls. Le Conseil dit qu'ils mangent les voyageurs.",
    quetes: ['peage'],
  },
  fort: {
    nom: 'Le Fort des Orcs', danger: 3, reputation: 5, x: 1545, y: 365, royaume: 'bannis', biome: 'badlands', camp: 'mal',
    description: 'Une forteresse de pierre rouge dans les terres brûlées. Les orcs y paient en or.',
    quetes: ['forteresse'],
  },
  tombeaux: {
    nom: 'Les Tombeaux des Sables', danger: 3, reputation: 6, x: 1745, y: 620, royaume: 'bannis', biome: 'desert', vignette: 'tombeaux', camp: 'mal',
    description: 'Des tombeaux à demi enfouis, où les momies veillent sur leurs morts.',
    quetes: ['tombeaux'],
  },
  chateau: {
    nom: 'Le Château de Nuit-Pourpre', danger: 4, reputation: 10, x: 1560, y: 135, royaume: 'bannis', biome: 'nuitPourpre', camp: 'mal',
    description: 'Le château des vampires. On y donne des bals où il vaut mieux ne pas être le dessert.',
    quetes: ['bal'],
  },
};

// Les royaumes de la carte. Les cinq royaumes du Conseil (de 1 à 5 étoiles), les terres sauvages,
// les Monts de Bambou des pandas et les terres des Bannis, derrière la Grande Muraille.
// `x`, `y` : où l'on écrit son nom sur la carte. `couleur` : le lavis du royaume.
const ROYAUMES = {
  comte: { nom: 'La Comté des Hobbits', etoiles: 1, x: 950, y: 470, couleur: 0x8ac060 },
  humains: { nom: 'Le Royaume des Hommes', etoiles: 2, x: 540, y: 690, couleur: 0xd8b860 },
  nains: { nom: 'Le Royaume des Nains', etoiles: 3, x: 1065, y: 262, couleur: 0xb08868 },
  elfes: { nom: 'Le Royaume des Elfes', etoiles: 4, x: 520, y: 40, couleur: 0x7ac0a0 },
  mages: { nom: 'Le Royaume des Mages', etoiles: 5, x: 200, y: 285, couleur: 0x9a88e0 },
  bambous: { nom: 'Les Monts de Bambou', etoiles: 0, x: 245, y: 540, couleur: 0x9ad070 },
  sauvages: { nom: 'Les Terres sauvages', etoiles: 0, x: 1185, y: 452, couleur: 0xc8a070 },
  bannis: { nom: 'Les Terres des Bannis', etoiles: 0, x: 1650, y: 40, couleur: 0x6a4a7a },
};
// La taille du monde sur la carte (on le voit en entier en dézoomant de moitié)
const MONDE_CARTE = { L: 1864, H: 736, comptoir: { x: 945, y: 660 } };

// Pour ouvrir une zone à 3, 4 ou 5 étoiles : des retours réussis dans l'étoile d'avant.
const RETOURS_POUR_ETOILE = { 3: 3, 4: 5, 5: 8 };
// Les quêtes du bien : un peu plus de réputation. Celles du mal : plus d'or, et la jauge du mal.
// Étape 9a. Les terres de lumière rapportent plus de réputation (bien plus si tu es du côté de la
// lumière), les terres d'ombre plus de butin (bien plus si tu es du côté de l'ombre).
const EFFETS_CAMP = { bien: { reputation: 1.2, reputationAllie: 1.5, butin: 1, mal: 0 }, mal: { reputation: 0, butin: 1.15, butinAllie: 1.35, mal: 0.5 } };
// La jauge lumière ⟷ ombre, de −100 (l'ombre) à +100 (la lumière) : ce que le monde pense de toi.
// (Dans le monde, les deux camps s'appellent la Confrérie et les Bannis.)
const NOMS_CAMPS = { bien: 'la Confrérie', mal: 'les Bannis' };
const JAUGE_CAMP = { reussite: 8, mal: 5, objet: 6, max: 100, ecartMax: 14 };   // (ecartMax : l'écart des réussites compte au plus pour 14 missions : la jauge peut toujours revenir)
// Le dernier jour avant lequel la 9e pièce d'armure (le sceau du camp) ne peut pas arriver
const JOUR_SCEAU = 24;
// (audit v0.53, constat 2) La taxe de la Confrérie, chaque fin de semaine (tous les 7 jours) : une
// part de ce que tu as au-dessus de la franchise. « Pour la défense contre le dragon. » La
// Confrérie taxe moins ceux qui penchent vers la lumière, et plus ceux qui penchent vers l'ombre.
const TAXE_CONFRERIE = { franchise: 200, taux: { lumiere: 0.12, neutre: 0.16, ombre: 0.22 } };
// (constat 14) Le coup de pouce de Garrick quand tu n'as plus rien : des provisions sur le pas de la porte
const COUP_DE_POUCE = { argent: 12, stock: 2, delai: 15, cadeau: { ration: 2, gourde: 1, torche: 1 } };
const PALIERS_JAUGE = [25, 60, 90];                              // les paliers, de chaque côté
const NOMS_PALIERS_JAUGE = {
  3: 'Lumière éclatante', 2: 'Lumière', 1: 'Lueur', 0: 'Entre les deux', '-1': 'Pénombre', '-2': 'Ombre', '-3': 'Ombre épaisse',
};
const REMISE_BANQUE_LUMIERE = 0.03;   // par palier de lumière, les taux de la Banque Centrale baissent d'autant
const GAZETTE_PALIERS_JAUGE = {
  1: "On dit que ton comptoir sert bien la Confrérie. Les gens te saluent dans la rue.",
  2: "La Confrérie te cite en exemple : « un marchand qui sait de quel côté est la lumière ».",
  3: "Le conseil des Gardiens lui-même aurait parlé de ton comptoir. On te regarde avec respect.",
  '-1': "Des rumeurs courent : ton comptoir ferait affaire avec les Bannis. On te regarde de travers.",
  '-2': "La garde surveille ta rue. On dit que les Bannis connaissent ton nom.",
  '-3': "Plus personne ne doute : ton comptoir est celui des Bannis. La Confrérie ne te salue plus.",
};
// Tailles des peuples à venir (silhouettes, comme TAILLES_PEUPLES) : le panda côté lumière, les six peuples de l'ombre.
const TAILLES_PEUPLES_A_VENIR = { panda: 21, gobelin: 11, momie: 15, vampire: 16, orc: 17, loupgarou: 20, troll: 24 };

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
  gobelin: { m: ['Snik', 'Grob', 'Pikel'], f: ['Tizzi', 'Nakka', 'Rizla'] },
  orc: { m: ['Thrak', 'Mogrul', 'Karg'], f: ['Gruna', 'Morka', 'Urza'] },
  loupgarou: { m: ['Lupan', 'Garrou', 'Fenrick'], f: ['Louve', 'Selva', 'Nocta'] },
  vampire: { m: ['Lucan', 'Sévrin', 'Ambrose'], f: ['Morwenna', 'Ilse', 'Lisbeth'] },
  momie: { m: ['Sethos', 'Imhot', 'Khafra'], f: ['Nefret', 'Isha', 'Tiyé'] },
  troll: { m: ['Borrog', 'Tuk', 'Ugrok'], f: ['Mogra', 'Hulda', 'Bolga'] },
  panda: { m: ['Jian', 'Norbu', 'Bao'], f: ['Yuki', 'Pema', 'Mei'] },
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
  filOr: { nom: "Fil d'or", prix: 6 },   // pour les bijoux : on en use peu, mais le travail est long
};
const MATERIAU_DE = { epee: 'fer', corde: 'cuir', gourde: 'cuir', cape: 'cuir', bouclier: 'fer' };
const MATERIAUX_DEPART = { fer: 2, cuir: 2, filOr: 1 };
// Au début il faut 3 matériaux par réparation ; l'artisanat en fait baisser le nombre.
const MATERIAUX_PAR_REPARATION = 3;

// --- Le Marché des Mastres (le matin) ---

// Les trois étals. `toujours` : objets disponibles tous les jours ; les autres apparaissent au hasard.
// Les lieux du marché qui ouvrent un par un, les premiers jours (le jour d'ouverture). Les étals
// de provisions, le crieur et le mendiant sont là dès le premier jour.
const OUVERTURE_LIEUX = { jeux: 2, encheres: 3, brocante: 5, garderobe: 7, bazar: 9 };
const NOMS_LIEUX_MARCHE = { jeux: 'Le coin des jeux', encheres: 'Les enchères', brocante: 'La brocante de Firmin', garderobe: 'La garde-robe de Marcelline', bazar: 'Le Bazar de Rosalie' };

const MARCHANDS = {
  gedeon: {
    nom: 'Maître Gédéon', metier: 'Épicerie', race: 'hobbit', couleur: 0x4f7a3a,
    objets: ['ration', 'gourde', 'torche', 'bandage'], toujours: ['ration', 'gourde', 'torche', 'bandage'],
  },
  forge: {
    nom: 'Thorgal le Forgeron', metier: 'Forge', race: 'nain', couleur: 0x8a3a2a,
    objets: ['epee', 'fleches', 'corde', 'bouclier', 'fer', 'cuir'], toujours: ['fer', 'cuir'],
  },
  apothicaire: {
    nom: 'Mère Sauge', metier: 'Apothicaire', race: 'magicienne', couleur: 0x5a3a8a,
    objets: ['potion', 'bandage', 'antidote', 'amulette', 'filOr'], toujours: ['bandage', 'filOr'],
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
  trefle: { nom: 'Trèfle du mendiant', effet: 'Porte-bonheur : tu gagnes les égalités aux dés, et le bonneteau va moins vite.' },
  blason: { nom: 'Blason du bourg', effet: 'Les marchands du Marché des Mastres te font 5 % de remise.' },
  sceau: { nom: 'Sceau de la Confrérie', effet: 'Les aventuriers te font confiance : +1 de chance (trèfle) pour tous.' },
};

// --- La brocante de Firmin : des décorations pour ton shop ---
// Chacune se voit dans l'arrière-boutique, et attire un peuple (ou un peu tout le monde).
const DECOS = {
  tropheeCerf: { court: 'plus de nains', nom: 'Trophée de cerf', prix: 45, attire: 'nain', effet: 'Les nains se sentent chez eux : plus de clients nains.' },
  tapisserie: { court: 'plus d\'elfes', nom: 'Tapisserie des Trois Terres', prix: 60, attire: 'elfe', effet: 'Les elfes admirent le tissage : plus de clients elfes.' },
  carillon: { court: 'plus de hobbits', nom: 'Carillon de cuivre', prix: 30, attire: 'hobbit', effet: 'Son tintement plaît aux hobbits : plus de clients hobbits.' },
  horloge: { court: 'plus d\'humains', nom: 'Horloge à coucou', prix: 55, attire: 'humain', effet: 'Les humains aiment la ponctualité : plus de clients humains.' },
  globe: { court: 'plus de magiciennes', nom: 'Globe de cristal', prix: 70, attire: 'magicienne', effet: 'Les magiciennes y lisent des présages : plus de clientes magiciennes.' },
  fougere: { court: '+0,4 client/jour', nom: 'Fougère rare', prix: 25, attire: null, attrait: 0.4, effet: 'Un shop accueillant : +0,4 client par jour.' },
  // Étape 9c : les décorations des deux camps. Elles font pencher la jauge (lumière ou ombre),
  // attirent leur camp, et les clients de l'autre camp ne les aiment pas.
  chandelier: { court: 'lumière · attire les pandas', nom: "Chandelier d'argent", prix: 50, camp: 'bien', attire: 'panda', effet: 'Lumière : les pandas du Monastère se sentent chez eux. Les Bannis grimacent.' },
  banniere: { court: 'lumière · attire les humains', nom: 'Bannière de la Confrérie', prix: 40, camp: 'bien', attire: 'humain', effet: 'Lumière : les humains te font confiance. Les Bannis se méfient.' },
  craneTroll: { court: 'ombre · attire les Bannis', nom: 'Crâne de troll', prix: 45, camp: 'mal', attire: 'ombre', effet: "Ombre : les Bannis se sentent chez eux. Les gens de la lumière frissonnent." },
  lanterneCrane: { court: 'ombre · attire les Bannis', nom: 'Lanterne-crâne', prix: 55, camp: 'mal', attire: 'ombre', effet: "Ombre : une lueur verte qui attire les Bannis. La Confrérie n'aime pas ça." },
};
const BROCANTEUR = { nom: 'Firmin le brocanteur' };
// Plus de clients du peuple qu'une décoration attire : le poids de ce peuple est multiplié.
const ATTIRANCE_DECO = 2.2;

// --- La garde-robe de Marcelline : des vêtements et des accessoires pour toi ---
// Tout ce que tu achètes, tu le portes : on le voit sur toi, partout.
const GARDE_ROBE = {
  chapeau: { nom: 'Chapeau de cow-boy', prix: 18, effet: 'Tu as de l\'allure : +0,2 client par jour.' },
  bandana: { nom: 'Bandana rouge', prix: 8, effet: 'Un air de baroudeur : les novices te font confiance (+0,1 client par jour).' },
  cape: { nom: 'Cape de voyage', prix: 35, effet: 'Belle allure : +0,2 client par jour.' },
  echarpe: { nom: 'Écharpe de laine', prix: 12, effet: 'Bien au chaud : tes nuits te consolent un peu plus (+0,1 de réputation après un mauvais jour).' },
  monocle: { nom: 'Monocle', prix: 24, effet: 'Tu vois mieux : +10 % de flair.' },
  pipe: { nom: 'Pipe en bruyère', prix: 10, effet: 'Calme et posé : les marchands te font 2 % de remise.' },
  montre: { nom: 'Montre à gousset', prix: 40, effet: "Toujours à l'heure : +1 d'expérience chaque jour." },
  bague: { nom: 'Bague de marchand', prix: 30, effet: 'On te fait confiance : +1 de relation avec chaque nouveau client.' },
};
const MARCELLINE = { nom: 'Marcelline la couturière' };

// --- Ton personnage ---

// Les noms selon l'âge : petit (moins de 18 ans), adulte, ancien (60 ans et plus).
const NOMS_JOUEUR = {
  garcon: { petit: 'JeuneGoy', adulte: 'HommeGoy', ancien: 'AncienGoy' },
  fille: { petit: 'JeuneGoy', adulte: 'FemmeGoy', ancien: 'AncienneGoy' },
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
  sabotages: 'Primes de la Faucheuse',
  bazar: 'Cadeaux du Bazar',
  ameliorations: 'Améliorations du shop', interets: 'Intérêts du coffre',
  taxe: 'Taxe de la Confrérie', amende: 'Amendes de la garde', marcheNoir: 'Marché noir', decoration: 'Décorations', garderobe: 'Garde-robe', cadeau: 'Cadeaux reçus',
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
  // Les bijoux : un seul fil d'or suffit (quel que soit le stade visé), mais c'est un travail d'orfèvre, très long.
  bijou: { nom: 'Bijou', materiau: 'filOr', unSeul: true, duree: 5 },
  artefact: { nom: 'Artefact', materiau: null, duree: 6 }, // sans matériau, mais le plus long à restaurer
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
  tobin: { nom: "Tobin l'apprenti", race: 'hobbit', salaire: 4, rapide: false, apprenti: 5, description: 'Il apprend vite : après 5 réparations, il travaille un jour plus vite.' },
  marta: { nom: 'Marta la Rétameuse', race: 'nain', salaire: 9, rapide: true, description: 'Une naine experte : ses réparations prennent un jour de moins.' },
  pip: { nom: 'Pip le Joaillier', race: 'hobbit', salaire: 7, rapide: ['bijou', 'artefact'], description: 'Doigts de fée : un jour de moins sur les bijoux et les artefacts.' },
  brann: { nom: 'Brann le Tanneur', race: 'humain', salaire: 6, rapide: ['vetement', 'armure'], description: 'Un jour de moins sur les vêtements et les armures.' },
};
// Le nombre d'employés qu'on peut embaucher : 2, plus un par établi en plus (amélioration « atelier »).
const EMPLOYES_DE_BASE = 2;

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
// Chaque établi en plus (amélioration « atelier ») ajoute aussi des places pour les objets.
const PLACES_PAR_ETABLI = 2;
// L'expérience compte jusqu'à ce nombre de clients servis (pour le flair et pour attirer du monde).
const EXPERIENCE_MAX = 80;
// Les bonus d'attrait (stock varié, trophée, éclairage) peuvent dépasser le plafond du palier de réputation.
const BONUS_CLIENTS_MAX = 2;

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
        intro: "Pendant que je plongeais pour la cloche, des sangsues énormes se sont collées à mes jambes !",
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

// --- Le mal ---

// Les objets piégés : ils ressemblent aux vrais (l'aventurier n'y voit que du feu et les
// compte dans sa commande), mais lâchent au pire moment : l'épreuve qui en a besoin le tue.
// On ne les achète nulle part : c'est la Faucheuse qui les glisse sous ton comptoir.
const PIEGES = {
  corde: { nom: 'Corde effilochée', mort: "La corde a cédé d'un coup. Net. Comme si quelqu'un l'avait coupée..." },
  potion: { nom: 'Potion empoisonnée', mort: "J'ai bu la potion... Elle avait un goût amer. Ma vue se trouble..." },
  epee: { nom: 'Épée fêlée', mort: "Au premier coup, ma lame s'est brisée en deux. Je n'avais plus rien pour me défendre..." },
  ration: { nom: 'Ration avariée', mort: "La viande était verte à l'intérieur. Je me tords de douleur depuis des heures..." },
  gourde: { nom: 'Gourde empoisonnée', mort: "L'eau de ta gourde brûlait la gorge. Je n'arrive plus à respirer..." },
  torche: { nom: 'Torche mouillée', mort: "La torche ne s'est jamais allumée. Dans le noir, quelque chose s'est approché..." },
  bandage: { nom: 'Bandages souillés', mort: "La plaie a viré au noir sous les bandages. La fièvre ne tombe plus..." },
  antidote: { nom: 'Faux antidote', mort: "L'antidote n'a rien fait. Rien du tout. Le venin monte..." },
};

// Une mort « voulue » : tu savais, ou tu l'as fait exprès. Elle fait monter ta jauge du mal
// et séduit la Faucheuse (on retient la raison la plus grave).
const MORTS_VOULUES = {
  piege: { poids: 2, texte: 'un objet piégé' },
  colisVide: { poids: 1, texte: 'un baluchon volontairement vide' },
  sansChance: { poids: 0.5, texte: 'aucune chance de revenir' },
};
const SEUIL_SANS_CHANCE = 0.3;     // en dessous, tu l'envoies à la mort
const MANQUANTS_VOLONTAIRES = 2;   // objets commandés non donnés alors que tu les avais
const CHANCE_DEMASQUE = 0.35;      // un piège peut être découvert : réputation −2
const PERTE_DEMASQUE = 2;

// La Faucheuse : de plus en plus terrifiante avec le nombre de morts...
const TERREUR_FAUCHEUSE = [
  { morts: 0, ombre: 0.74, echelle: 9, secousse: 0.002, aura: 0 },
  { morts: 3, ombre: 0.83, echelle: 9.4, secousse: 0.004, aura: 0.25 },
  { morts: 7, ombre: 0.9, echelle: 9.8, secousse: 0.006, aura: 0.45 },
  { morts: 15, ombre: 0.95, echelle: 10.2, secousse: 0.009, aura: 0.7 },
];
// ... et de plus en plus séduite par toi si tu lui offres des âmes exprès.
const SEDUCTION_FAUCHEUSE = [
  { faveur: -Infinity, nom: 'Indifférente', couleur: '#ff3a2a' },
  { faveur: 2, nom: 'Intriguée', couleur: '#ff5a6a' },
  { faveur: 5, nom: 'Séduite', couleur: '#e04aa0' },
  { faveur: 10, nom: 'Éprise', couleur: '#c03ae0' },
];
// Les missions de sabotage : une fois assez noir, elle te désigne une âme pure à piéger.
const SEUIL_SABOTAGE = 3;          // jauge du mal
const PRIME_SABOTAGE = [30, 60];   // pièces froides, selon le danger de la zone
// La Main Noire prête à ceux dont la jauge du mal est assez haute.
const SEUIL_MAIN_NOIRE = 6;

// --- Les quêtes des terres de lumière et d'ombre ---
Object.assign(QUETES, {
  pelerins: {
    titre: 'Escorter les pèlerins au Monastère',
    accueil: "Le Monastère des Pandas ? Les pèlerins ont besoin d'une escorte, les routes ne sont plus sûres. C'est une bonne cause.",
    pv: 2, duree: [2, 3], butin: [25, 40],
    epreuves: [
      { type: 'route', besoin: 'gourde', qte: 1, intro: 'La route du Monastère grimpe sous un soleil de plomb. Les pèlerins avaient soif.',
        complet: 'Ta gourde a désaltéré tout le monde. Un vieux moine panda m\'a béni{e}.', partiel: "On a partagé le peu d'eau qu'on avait...", rien: 'Les plus vieux pèlerins se sont évanouis en chemin.' },
      { type: 'bandits', besoin: 'epee', qte: 1, intro: 'Des brigands nous attendaient au col des bambous !',
        complet: 'Ton épée les a fait fuir dans les bambous.', partiel: "Je les ai repoussés, mais avec mal.", rien: "Je n'avais rien pour défendre les pèlerins..." },
      { type: 'riviere', besoin: 'corde', qte: 1, intro: 'Le pont de lianes du Monastère était rompu.',
        complet: 'Avec ta corde, on a fait passer tout le monde, un par un.', partiel: 'La corde était trop courte, il a fallu improviser.', rien: "On a dû traverser à gué, et j'ai failli tout perdre." },
    ],
  },
  graine: {
    titre: "Rapporter la Graine d'argent au Sanctuaire",
    accueil: "Le Sanctuaire des Elfes ? On a volé une graine de l'Arbre-Mère. Les elfes paient pour qu'on la leur rapporte... et pour la gloire.",
    pv: 3, duree: [3, 4], butin: [45, 65],
    epreuves: [
      { type: 'esprits', besoin: 'torche', qte: 1, intro: "Dans la forêt d'argent, des esprits jaloux voulaient garder la graine.",
        complet: 'Ta torche les a tenus à distance.', partiel: 'Ma torche faiblissait...', rien: 'Ils m\'ont égaré{e} pendant une journée entière.' },
      { type: 'araignee', besoin: 'epee', qte: 1, intro: 'La graine était dans une toile d\'araignée géante.',
        complet: 'Un coup d\'épée, et la toile a cédé !', partiel: 'Je me suis battu{e} longtemps avant de la récupérer.', rien: "J'ai dû arracher la toile à mains nues." },
      { type: 'malediction', besoin: 'amulette', qte: 1, intro: 'Le voleur avait maudit la graine.',
        complet: 'Ton amulette a brisé le sort. Les elfes ont chanté pour moi.', partiel: "La malédiction m'a affaibli{e}...", rien: 'La malédiction me ronge depuis.' },
    ],
  },
  siege: {
    titre: 'Défendre la Citadelle assiégée',
    accueil: "La Citadelle des Paladins tient encore... à peine. Ils ont besoin de bras. Si je dois mourir, autant que ce soit pour la bonne cause.",
    pv: 3, duree: [3, 5], butin: [70, 100],
    epreuves: [
      { type: 'nuit', besoin: 'ration', qte: 2, intro: 'Le siège a duré des jours. Les vivres manquaient dans la Citadelle.',
        complet: 'Tes rations ont tenu tout le monde debout.', partiel: 'On a dû rationner les rations...', rien: 'La faim nous a affaiblis avant même la bataille.' },
      { type: 'mortvivant', besoin: 'bouclier', qte: 1, intro: 'Les morts sont montés à l\'assaut des remparts.',
        complet: 'Ton bouclier a tenu sous leurs coups.', partiel: "Mon bouclier s'est fendu...", rien: "Sans bouclier, j'ai pris des coups terribles." },
      { type: 'mortvivant', besoin: 'epee', qte: 1, intro: 'Leur chef, un chevalier squelette, m\'a défié{e} en duel.',
        complet: 'Ton épée l\'a renvoyé dans sa tombe !', partiel: "Je l'ai repoussé, sans le vaincre.", rien: "Je n'ai fait que fuir..." },
    ],
  },
  pillage: {
    titre: 'Arrêter une caravane « de pèlerins »',
    accueil: "Le Bourbier ? Les gobelins paient en or pour qu'on arrête une caravane de « pèlerins ». C'est ce que dit l'avis du Conseil, en tout cas. De l'or, c'est de l'or.",
    pv: 2, duree: [2, 3], butin: [40, 60],
    epreuves: [
      { type: 'route', besoin: 'ration', qte: 1, intro: "J'ai attendu la caravane deux jours, caché{e} dans la boue.",
        complet: 'Tes rations m\'ont tenu{e}.', partiel: "J'avais faim...", rien: "J'ai mangé un crapaud. Cru." },
      { type: 'bandits', besoin: 'epee', qte: 1, intro: 'Des pèlerins ? Ils portaient le tabard bleu de la Confrérie, et des chariots fermés à clé.',
        complet: "Ton épée a fait le travail. Dans les chariots... des gobelins enchaînés. Des enfants, surtout.", partiel: 'Un garde m\'a blessé{e} avant de fuir.', rien: 'Sans arme, les gardes m\'ont roué{e} de coups.' },
      { type: 'riviere', besoin: 'corde', qte: 1, intro: 'Pour rapporter le butin aux gobelins, il fallait traverser le bourbier.',
        complet: 'Avec ta corde, tout le monde est passé. Les gobelins pleuraient en revoyant leurs petits.', partiel: "J'ai perdu une partie du butin dans la boue.", rien: "Le bourbier a failli m'avaler." },
    ],
  },
  pacte: {
    titre: 'Livrer un pacte à la meute',
    accueil: "Le Repaire des Loups-garous ? On m'a confié un pacte à leur porter. Je ne veux pas savoir ce qu'il y a dedans. Ils paient le triple.",
    pv: 3, duree: [3, 4], butin: [60, 85],
    epreuves: [
      { type: 'nuit', besoin: 'torche', qte: 1, intro: 'Le Repaire ne se trouve que la nuit, sous la lune rouge.',
        complet: 'Ta torche m\'a guidé{e} jusqu\'à eux.', partiel: 'Ma torche s\'est éteinte en chemin.', rien: "J'ai erré dans le noir, entouré{e} de hurlements." },
      { type: 'loup', besoin: 'epee', qte: 1, intro: 'Un jeune loup a voulu me tester.',
        complet: 'Ton épée lui a appris le respect.', partiel: "Il m'a mordu{e} avant de reculer.", rien: 'Il a joué avec moi comme avec une souris.' },
      { type: 'morsure', besoin: 'antidote', qte: 1, intro: 'Une morsure de loup-garou... ça ne pardonne pas.',
        complet: "Ton antidote a arrêté la malédiction. Ouf.", partiel: 'Je hurle un peu à la lune depuis.', rien: 'Mes ongles poussent bizarrement depuis...' },
    ],
  },
  profanation: {
    titre: 'Reprendre les reliques d\'un temple',
    accueil: "La Tour du Nécromancien... Il veut les reliques du temple de la Lumière. Il dit qu'elles étaient à son peuple, avant. Avant quoi ? L'or n'a pas d'odeur.",
    pv: 3, duree: [3, 5], butin: [95, 135],
    epreuves: [
      { type: 'malediction', besoin: 'amulette', qte: 1, intro: 'Les reliques étaient protégées par une bénédiction... qui brûle les voleurs.',
        complet: 'Ton amulette m\'a protégé{e} de la lumière sacrée.', partiel: 'La lumière m\'a brûlé{e}...', rien: "J'en porte encore les marques." },
      { type: 'gouffre', besoin: 'corde', qte: 1, intro: 'Pour fuir, il fallait descendre la falaise derrière le temple.',
        complet: 'Ta corde a tenu jusqu\'en bas.', partiel: 'Les derniers mètres, je les ai faits en tombant.', rien: 'Je suis tombé{e}.' },
      { type: 'mortvivant', besoin: 'epee', qte: 1, intro: "À la Tour, le Nécromancien a pleuré sur les reliques. Ses gardes morts ne savaient pas que j'étais avec lui.",
        complet: 'Ton épée m\'a ouvert le chemin.', partiel: "Je m'en suis tiré{e} de justesse.", rien: 'Ils voulaient me garder comme serviteur...' },
    ],
  },
});

// --- Les quêtes du grand monde (v0.54) ---
// Chaque royaume a son petit secret : un détail qui cloche, glissé dans un récit, que seul un
// joueur attentif remarquera (rien n'y est dit franchement : la vérité est pour la fin).
Object.assign(QUETES, {
  renards: {
    titre: 'Garder les vergers de Bourg-Joyeux',
    accueil: "Les vergers de Bourg-Joyeux ? Des renards gros comme des veaux dévorent les pommes, la nuit. Les fermiers paient en pièces... et en tartes !",
    pv: 2, duree: [1, 2], butin: [20, 32],
    epreuves: [
      { type: 'route', besoin: 'ration', qte: 1, intro: "Une journée de marche entre les haies et les ruisseaux.",
        complet: 'Ta ration, sous un pommier, au soleil... la belle vie.', partiel: "J'ai grignoté des pommes vertes. Mauvaise idée.", rien: "J'avais si faim que j'ai volé une tarte. Le fermier n'a pas ri." },
      { type: 'nuit', besoin: 'torche', qte: 1, intro: 'La nuit, des yeux brillaient entre les pommiers...',
        complet: 'Ta torche les a tous fait détaler.', partiel: 'Ma torche crachotait, ils revenaient sans cesse.', rien: "Dans le noir, je n'ai rien vu venir." },
      { type: 'loup', besoin: 'fleches', qte: 1, intro: 'Le chef de la bande, un renard énorme, m\'a fait face.',
        complet: 'Une flèche bien placée, et il a filé sans demander son reste.', partiel: "Je l'ai effleuré. Il m'a mordu{e} au mollet.", rien: "Il m'a pris mon sac. Et mon chapeau." },
    ],
  },
  contrebande: {
    titre: 'Démasquer les contrebandiers de Port-Brisant',
    accueil: "Port-Brisant ? Le capitaine du port cherche quelqu'un pour surveiller les quais la nuit. Des caisses disparaissent. Ça paie bien et ça sent le poisson.",
    pv: 2, duree: [2, 3], butin: [35, 50],
    epreuves: [
      { type: 'route', besoin: 'gourde', qte: 1, intro: 'La route du Fleuve longe des marais salés.',
        complet: 'Ta gourde était la bienvenue sous ce soleil.', partiel: "J'ai bu l'eau du Fleuve. Elle avait un goût de vase.", rien: "J'avais la langue comme du cuir en arrivant." },
      { type: 'bandits', besoin: 'epee', qte: 1, intro: 'Sur le quai, à minuit, des hommes chargeaient des caisses dans une barque.',
        complet: "Ton épée les a convaincus de tout laisser. Les caisses portaient le sceau du Conseil. Le capitaine m'a dit d'oublier ce que j'avais vu. J'ai dit oui.", partiel: "Ils ont fui avec la moitié des caisses.", rien: "Ils m'ont jeté{e} à l'eau avec les poissons." },
      { type: 'riviere', besoin: 'corde', qte: 1, intro: 'Le dernier a sauté dans une barque. Il fallait le rattraper.',
        complet: 'Ta corde, lancée comme un grappin, et hop ! Je l\'ai ramené par le col.', partiel: "J'ai raté mon lancer. Deux fois.", rien: 'Il a disparu dans la brume du Fleuve.' },
    ],
  },
  convoi: {
    titre: 'Escorter un convoi de Khaz-Durim',
    accueil: "Les Nains de Khaz-Durim cherchent des escortes pour leurs convois de minerai. Les galeries sont longues, et pas toujours vides.",
    pv: 2, duree: [2, 3], butin: [50, 70],
    epreuves: [
      { type: 'grotte', besoin: 'torche', qte: 1, intro: 'Les galeries de la vieille route sont noires comme un four.',
        complet: "Ta torche éclairait des gravures très anciennes. Les Nains disent que ces galeries ont été creusées par d'autres mains, plus petites. Ils n'aiment pas qu'on en parle.", partiel: 'Ma torche a faibli à mi-chemin.', rien: 'On avançait à tâtons, en se tenant par la barbe.' },
      { type: 'gouffre', besoin: 'corde', qte: 1, intro: 'Un pont de pierre s\'était effondré au-dessus du gouffre.',
        complet: 'Avec ta corde, on a fait passer les wagonnets un par un.', partiel: 'On a perdu un wagonnet dans le vide.', rien: "Il a fallu faire un détour d'une journée." },
      { type: 'pillards', besoin: 'bouclier', qte: 1, intro: 'Des pillards attendaient le convoi à la sortie.',
        complet: 'Ton bouclier a encaissé leurs flèches. Les Nains ont applaudi.', partiel: "J'ai pris une flèche dans l'épaule.", rien: 'Ils ont emporté une partie du minerai.' },
    ],
  },
  lunes: {
    titre: 'Veiller sur le Lac des Lunes',
    accueil: "Le Lac des Lunes ? Les elfes cherchent quelqu'un pour veiller sur leurs chanteurs, la nuit. Des esprits froids sortent de l'eau. C'est beau et ça fait peur.",
    pv: 2, duree: [3, 4], butin: [65, 90],
    epreuves: [
      { type: 'froid', besoin: 'cape', qte: 1, intro: 'Les nuits au bord du lac sont glaciales.',
        complet: 'Ta cape m\'a gardé{e} au chaud toute la nuit.', partiel: 'Je claquais des dents.', rien: "J'ai attrapé un rhume d'elfe. C'est pire qu'un rhume normal." },
      { type: 'esprits', besoin: 'torche', qte: 1, intro: "À minuit, des formes pâles sont sorties de l'eau.",
        complet: "Ta torche les a tenues loin des chanteurs. Les elfes chantent « pour ne pas oublier », disent-ils. Quand je leur ai demandé quoi, ils ne savaient plus.", partiel: 'Un esprit a touché un chanteur. Il ne parle plus.', rien: 'Les esprits ont éteint toutes les lanternes.' },
      { type: 'feufollet', besoin: 'potion', qte: 1, intro: 'Un feu follet m\'a attiré{e} vers le fond du lac.',
        complet: "Ta potion m'a rendu les idées claires juste à temps.", partiel: "J'ai bu la tasse. Une grande tasse.", rien: 'Les elfes ont dû me repêcher.' },
    ],
  },
  cristal: {
    titre: "Livrer un cristal à la Cité d'Opale",
    accueil: "La Cité d'Opale ? Les Mages ont commandé un cristal de chant. Il faut le porter jusqu'au palais du Sage. Personne n'en revient tout à fait pareil.",
    pv: 3, duree: [4, 5], butin: [140, 200],
    epreuves: [
      { type: 'malediction', besoin: 'amulette', qte: 1, intro: 'Le cristal murmurait des choses. Il ne voulait pas qu\'on le transporte.',
        complet: 'Ton amulette l\'a fait taire.', partiel: 'Je l\'entendais encore la nuit...', rien: "Il m'a fait oublier mon propre nom pendant un jour." },
      { type: 'gouffre', besoin: 'corde', qte: 1, intro: 'Les ponts de lumière de la Cité s\'éteignent quand on ne s\'y attend pas.',
        complet: "Ta corde m'a rattrapé{e} au-dessus du vide.", partiel: 'Je me suis rattrapé{e} de justesse.', rien: 'Je suis tombé{e} dans les jardins. De haut.' },
      { type: 'monstre', besoin: 'bouclier', qte: 1, intro: 'Un golem gardien ne voulait pas me laisser entrer au palais.',
        complet: "Ton bouclier a tenu. Au palais, j'ai vu le Sage, de loin. Mon grand-père l'avait vu au même âge. Il n'a pas changé d'un cheveu.", partiel: 'Le golem m\'a cabossé{e}.', rien: "Le golem m'a raccompagné{e} dehors. Par la fenêtre." },
    ],
  },
  grimoire: {
    titre: 'Retrouver un grimoire à la Bibliothèque Interdite',
    accueil: "La Bibliothèque Interdite ? Un mage a perdu un grimoire là-dedans, et il paie une fortune pour qu'on le lui rapporte sans le lire.",
    pv: 3, duree: [4, 5], butin: [150, 210],
    epreuves: [
      { type: 'esprits', besoin: 'torche', qte: 1, intro: 'Entre les rayons, des lecteurs fantômes chuchotaient.',
        complet: "Ta torche les a fait reculer. Des rayons entiers de livres aux pages blanches. Pas abîmées : effacées. Le bibliothécaire a dit que c'était normal.", partiel: 'Ma torche a fait fuir les uns, pas les autres.', rien: "Ils m'ont suivi{e} pendant des heures." },
      { type: 'malediction', besoin: 'amulette', qte: 1, intro: 'Le grimoire était protégé par un sort.',
        complet: 'Ton amulette a absorbé le sort.', partiel: "J'ai les doigts qui picotent depuis.", rien: 'Le sort m\'a brûlé{e} les mains.' },
      { type: 'blessure', besoin: 'potion', qte: 1, intro: 'Les gardiens de pierre se sont réveillés à ma sortie.',
        complet: 'Ta potion m\'a remis{e} sur pied après leurs coups.', partiel: 'Je boite encore.', rien: "Je suis sorti{e} en rampant." },
    ],
  },
  peage: {
    titre: 'Porter du sel au Pont des Trolls',
    accueil: "Le Pont des Trolls ? Ils ne mangent personne, enfin je crois. Ils paient bien pour du sel et des remèdes. Le Conseil interdit d'y aller. Raison de plus pour que ça paie.",
    pv: 2, duree: [2, 3], butin: [40, 58],
    epreuves: [
      { type: 'route', besoin: 'ration', qte: 1, intro: 'La forêt moussue est longue à traverser.',
        complet: 'Tes rations m\'ont tenu{e} jusqu\'au pont.', partiel: "J'ai mangé de la mousse. Les trolls font pareil, paraît-il.", rien: 'Je suis arrivé{e} affamé{e}.' },
      { type: 'riviere', besoin: 'corde', qte: 1, intro: 'Le torrent sous le pont avait emporté une arche.',
        complet: "Ta corde m'a fait passer, sac et sel compris. Le vieux troll garde ce pont depuis toujours, dit-il. Il ne se souvient plus pourquoi. Il m'a offert de la soupe de mousse.", partiel: "Une partie du sel a fondu dans l'eau.", rien: 'Le torrent a failli m\'emporter.' },
      { type: 'froid', besoin: 'cape', qte: 1, intro: 'Au retour, la brume glacée des collines.',
        complet: 'Ta cape m\'a protégé{e} du froid.', partiel: "J'avais froid jusqu'aux os.", rien: 'Je suis rentré{e} en grelottant.' },
    ],
  },
  forteresse: {
    titre: 'Ravitailler le Fort des Orcs',
    accueil: "Le Fort des Orcs ? Ils ont besoin de vivres et de pansements. Ils paient en or, et ils ne posent pas de questions. Moi non plus.",
    pv: 2, duree: [2, 4], butin: [60, 85],
    epreuves: [
      { type: 'route', besoin: 'gourde', qte: 1, intro: 'Les terres brûlées : pas une goutte d\'eau sur des lieues.',
        complet: 'Ta gourde m\'a sauvé{e}.', partiel: "J'ai léché la rosée sur les cailloux.", rien: "J'ai cru mourir de soif." },
      { type: 'bandits', besoin: 'epee', qte: 1, intro: 'Des chasseurs de primes guettaient la route du Fort.',
        complet: "Ton épée les a fait fuir. Au Fort, les orcs n'attaquaient personne. Ils réparaient un mur. Sur les pierres, il y avait des dessins d'enfants, très vieux.", partiel: 'Ils m\'ont blessé{e} avant de fuir.', rien: 'Ils ont pris la moitié des vivres.' },
      { type: 'blessure', besoin: 'bandage', qte: 2, intro: 'Au Fort, beaucoup de blessés attendaient.',
        complet: 'Tes bandages ont soigné tout le monde. Un vieil orc a pleuré.', partiel: "Il n'y en avait pas assez pour tous.", rien: "Je n'avais rien pour les soigner." },
    ],
  },
  tombeaux: {
    titre: 'Rendre leurs noms aux Tombeaux des Sables',
    accueil: "Les Tombeaux des Sables ? Les momies cherchent quelqu'un qui sache lire. Si si. Elles paient en or ancien.",
    pv: 2, duree: [3, 4], butin: [60, 85],
    epreuves: [
      { type: 'soif', besoin: 'gourde', qte: 1, intro: 'Le désert des Tombeaux est sans pitié.',
        complet: 'Ta gourde m\'a gardé{e} en vie.', partiel: "J'ai économisé chaque goutte.", rien: "J'ai vu des oasis qui n'existaient pas." },
      { type: 'gouffre', besoin: 'corde', qte: 1, intro: 'Les tombeaux s\'ouvrent par le haut, au fond d\'un puits de sable.',
        complet: 'Ta corde m\'a descendu{e} en douceur.', partiel: 'La corde était courte, j\'ai sauté le reste.', rien: 'Je suis tombé{e} dans le sable mou.' },
      { type: 'malediction', besoin: 'amulette', qte: 1, intro: 'Les momies m\'ont demandé de lire les noms gravés sur les murs, à voix haute.',
        complet: "Ton amulette m'a protégé{e} de la poussière maudite. Les momies pleuraient du sable. Elles disaient que personne d'autre ne se souvient de ces noms.", partiel: 'La poussière m\'a fait tousser des jours.', rien: 'La poussière m\'a rendu{e} malade.' },
    ],
  },
  bal: {
    titre: 'Le bal masqué de Nuit-Pourpre',
    accueil: "Nuit-Pourpre ? La comtesse cherche quelqu'un pour garder son bal masqué. Il paraît qu'on y mange très bien. Il paraît.",
    pv: 3, duree: [3, 5], butin: [95, 130],
    epreuves: [
      { type: 'nuit', besoin: 'torche', qte: 1, intro: 'Le château ne se trouve que la nuit, au bout d\'une forêt morte.',
        complet: 'Ta torche m\'a guidé{e} jusqu\'aux grilles.', partiel: "Ma torche s'est éteinte devant la porte.", rien: "J'ai tourné en rond jusqu'à l'aube." },
      { type: 'bandits', besoin: 'epee', qte: 1, intro: 'Un chasseur de vampires de la Confrérie s\'est glissé parmi les invités.',
        complet: "Ton épée l'a désarmé. La comtesse a dansé toute la nuit avec un portrait. Son mari, dit-elle. Pendu, au temps d'avant.", partiel: "Il s'est enfui par une fenêtre.", rien: 'Il a semé la panique dans la salle.' },
      { type: 'morsure', besoin: 'antidote', qte: 1, intro: 'Un jeune vampire a un peu trop bu. De moi.',
        complet: 'Ton antidote m\'a évité de finir avec des crocs.', partiel: "J'ai envie de viande crue depuis.", rien: "Le soleil me pique les yeux, maintenant." },
    ],
  },
});

// --- La chance (le trèfle) ---

// Chaque voyageur a sa chance, de 0 à 10 : un peu au départ, plus avec une bonne relation, et
// avec les cadeaux qu'on lui fait. Elle peut le sauver d'une épreuve ratée de justesse, ou
// transformer une mort en simple échec : il rebrousse chemin, vivant.
const TREFLE_BASE = 1;
const TREFLE_MAX = 10;
const TREFLE_RELATION = [-1, -1, 0, 0, 1, 2, 3]; // selon le niveau de relation (Pires ennemis → Frères de sang)
const SAUVETAGE_PAR_TREFLE = 0.02;              // une épreuve ratée rattrapée
const REPLI_PAR_TREFLE = 0.07;                  // la mort évitée : il rebrousse chemin
// Quand la chance le sauve, le trèfle des cadeaux se fane : il perd la chance d'un cadeau aimé.
const TREFLE_CONSOMME = 3;

// Les cadeaux, au Bazar de Rosalie. Chaque race a ses goûts.
// Le genre et le nombre de chaque marchandise (pour bien accorder les phrases) :
// f / m, et p au pluriel.
const GENRE_OBJETS = {
  ration: 'f', gourde: 'f', epee: 'f', fleches: 'fp', potion: 'f', bandage: 'mp', torche: 'f', corde: 'f',
  antidote: 'm', cape: 'f', bouclier: 'm', amulette: 'f', fer: 'm', cuir: 'm', filOr: 'm',
};

const CADEAUX = {
  miel: { nom: 'Pot de miel', prix: 6 },
  tabac: { nom: 'Tabac à pipe', prix: 5 },
  broche: { nom: 'Broche ciselée', prix: 12 },
  livre: { nom: 'Livre ancien', prix: 9 },
  ferACheval: { nom: 'Fer à cheval porte-bonheur', prix: 7 },
  vin: { nom: 'Vin de la Comté', prix: 8 },
  gateau: { nom: 'Gâteau aux mûres', prix: 4 },
};
const GOUTS = {
  hobbit: { aime: ['miel', 'tabac', 'gateau'], deteste: ['livre'] },
  nain: { aime: ['vin', 'broche'], deteste: ['gateau'] },
  elfe: { aime: ['livre', 'broche'], deteste: ['tabac'] },
  humain: { aime: ['vin', 'ferACheval'], deteste: [] },
  magicienne: { aime: ['livre', 'ferACheval'], deteste: ['vin'] },
  gobelin: { aime: ['broche', 'ferACheval'], deteste: ['gateau'] },
  orc: { aime: ['vin', 'ferACheval'], deteste: ['livre'] },
  loupgarou: { aime: ['gateau', 'miel'], deteste: ['broche'] },
  vampire: { aime: ['vin', 'livre'], deteste: ['miel'] },
  momie: { aime: ['livre', 'broche'], deteste: ['vin'] },
  troll: { aime: ['gateau', 'miel'], deteste: ['livre'] },
  panda: { aime: ['miel', 'gateau', 'livre'], deteste: ['tabac'] },
};
const EFFET_CADEAU = { aime: { trefle: 3, relation: 1 }, neutre: { trefle: 1, relation: 0 }, deteste: { trefle: 0, relation: -1 } };

// --- La mission ratée ---

// Il revient vivant mais sans butin : ta mise est perdue, ta réputation baisse un peu, et selon
// votre relation au moment du départ, d'autres ennuis s'ajoutent.
const PERTE_ECHEC = 0.5;
const MALUS_ECHEC = {
  rumine: '{nom} rumine son échec : votre relation en prend un coup.',
  blesse: '{nom} est trop blessé{e} pour repartir avant plusieurs jours, sauf si tu {le} soignes.',
  rumeur: 'La rumeur court que tes baluchons ne suffisent pas : moins de clients demain.',
  comptes: '{nom} te demandera des comptes : la prochaine fois, {il} exigera un objet en plus.',
};
// Le nombre de malus selon la relation au départ (Pires ennemis → Frères de sang).
const NB_MALUS_ECHEC = [4, 4, 3, 2, 2, 1, 1];
const CONVALESCENCE = 3;
const RUMEUR_CLIENTS = 2;

// --- Les lettres, les événements et les nouvelles ---

// Les lettres de commande sont devenues rares.
const CHANCE_LETTRE = 0.3;
// Parfois, un événement se prépare, éclate ou s'est déjà produit : il change les prix, une zone
// ou le nombre de clients pendant quelques jours. Annoncé par une lettre ou par le crieur.
const CHANCE_EVENEMENT = 0.18;
const EVENEMENTS = {
  penurieFer: { type: 'prix', objets: ['epee', 'bouclier'], mult: 1.6,
    annonce: 'La mine de fer de Grisefer a été inondée. Les forgerons préviennent : les épées et les boucliers vont manquer.',
    nouvelle: 'Pénurie de fer : épées et boucliers hors de prix au marché !' },
  recolte: { type: 'prix', objets: ['ration', 'gourde'], mult: 0.6,
    annonce: 'Une récolte exceptionnelle dans la Comté ! Les rations ne vont rien coûter.',
    nouvelle: 'Récolte record : les rations et les gourdes sont bradées au marché.' },
  fievre: { type: 'prix', objets: ['potion', 'antidote', 'bandage'], mult: 1.7,
    annonce: 'La fièvre des marais gagne les villages. Les apothicaires sont dévalisés.',
    nouvelle: 'Fièvre des marais : potions, antidotes et bandages hors de prix !' },
  cordes: { type: 'prix', objets: ['corde', 'torche'], mult: 0.6,
    annonce: 'Les nains de Grisefer bradent leurs cordes et leurs torches avant de partir en pèlerinage.',
    nouvelle: 'Grande braderie naine : cordes et torches à prix cassés.' },
  hiver: { type: 'prix', objets: ['cape', 'torche'], mult: 1.5,
    annonce: 'Les anciens le sentent dans leurs os : un hiver précoce arrive.',
    nouvelle: 'Hiver précoce : les capes et les torches s\'arrachent.' },
  tempete: { type: 'danger', zone: 'desert', mult: -0.12,
    annonce: 'Une tempête de sable géante avance sur les Terres Désolées.',
    nouvelle: 'Tempête de sable sur les Terres Désolées : les épreuves y sont plus dures.' },
  brume: { type: 'danger', zone: 'marais', mult: -0.12,
    annonce: 'Une brume épaisse est tombée sur les Marécages de Brume-Noire. Plus épaisse que d\'habitude. Ce qui est beaucoup dire.',
    nouvelle: 'Brume épaisse sur les marécages : les voyageurs s\'y perdent.' },
  rueeOr: { type: 'butin', zone: 'mines', mult: 1.5,
    annonce: 'Un filon d\'or a été découvert au fond des Mines abandonnées !',
    nouvelle: 'Ruée vers l\'or dans les Mines : le butin y est bien plus gros.' },
  yetis: { type: 'butin', zone: 'pics', mult: 1.4,
    annonce: 'Les yétis des Pics Gelés ont migré vers le nord. Leurs trésors sont sans surveillance.',
    nouvelle: 'Les yétis ont quitté les Pics : leurs trésors attendent.' },
  foire: { type: 'clients', clients: 2,
    annonce: "La grande Foire d'automne se tiendra bientôt à Brêche-Haute. Des voyageurs vont affluer de partout !",
    nouvelle: "C'est la Foire ! Les voyageurs affluent." },
  orcs: { type: 'clients', clients: -2,
    annonce: 'Une armée d\'orcs a été aperçue près des collines. Les voyageurs se font rares.',
    nouvelle: 'Les orcs rôdent : peu de voyageurs osent sortir.' },
};

// Le crieur du marché : une nouvelle par jour, souvent absurde.
const NOUVELLES = [
  // (des indices sur le Conseil des Gardiens, glissés parmi les nouvelles absurdes)
  "Le Conseil des Gardiens rappelle qu'il est interdit de parler des « Terres d'avant ». Personne ne sait ce que c'est, mais c'est interdit.",
  "Une nouvelle taxe pour la défense contre le dragon de la montagne. Le dragon n'a pas été aperçu cette année. La taxe, si.",
  "Le grand Sage du Conseil fête son anniversaire. Son âge reste un secret d'État. Les bougies, elles, ont été commandées par charrettes.",
  "Un vieux moine panda affirme se souvenir d'une chanson « d'avant ». Le Conseil l'a invité à venir la chanter. On ne l'a pas revu.",
  "Des fermiers ont trouvé des fondations de maisons dans le Bourbier. Le Conseil assure qu'il s'agit de très grands terriers de gobelins.",
  "Un gobelin a été enseveli sous une bouse de Groliphant, ces éléphants de dix mètres au garrot. On n'a retrouvé que son chapeau. Il était content du chapeau.",
  'Le concours de lancer de nain de Brêche-Haute est annulé : le nain a gagné.',
  "Un troll a tenté de payer le péage du pont avec un caillou. Le péagiste, lui aussi troll, a rendu la monnaie en cailloux.",
  'La Guilde des Sorciers rappelle qu\'il est interdit de transformer son voisin en crapaud, même pendant les fêtes.',
  'Un dragon a été aperçu au-dessus des Pics Gelés. Vérification faite : un cerf-volant. Très gros. Avec des dents.',
  "Concours de la plus grosse citrouille de la Comté : le vainqueur a dû être évacué de son jardin par trois poneys.",
  'Un barde a chanté si faux à la taverne que le fantôme du grenier a demandé à être exorcisé.',
  "Les gobelins du Bourbier organisent leur premier concours de poésie. Le jury a été mangé.",
  "Un hobbit a mangé sept repas hier. Ses médecins s'inquiètent : d'habitude, c'est neuf.",
  'Une vache a été élue bourgmestre de Ravin-Moussu. Les habitants parlent du meilleur mandat depuis dix ans.',
  'Un nécromancien a relevé une armée de squelettes, qui s\'est aussitôt mise en grève pour réclamer de la peau.',
  'Les araignées des Mines abandonnées tissent désormais des pulls. Personne n\'ose en commander.',
  'Un elfe a souri en public. Les témoins sont encore sous le choc.',
  'Perdu : un mouton-garou, répond au nom de Bêêêrnard. Ne pas sortir les soirs de pleine lune.',
  'Un Groliphant a éternué dans la Forêt des Murmures : trois arbres ont déménagé.',
  "Le vieux Grippesou nie avoir vendu une épée en bois peinte à un chevalier. Le chevalier, lui, ne nie plus rien : il est en convalescence.",
  "Un mage a voulu faire pleuvoir de l'or. Il a fait pleuvoir des orques. La confusion est compréhensible.",
  'Un yéti des Pics Gelés réclame une écharpe. Les tricoteuses de la Comté ont lancé une collecte.',
  'Un champignon de lune a été élu « champignon le plus suspect de l\'année ». Il n\'a pas souhaité commenter.',
  "Un chevalier a combattu un moulin pendant trois heures. Le moulin l'a emporté aux points.",
  'Les loups-garous se plaignent : la pleine lune tombe encore un jour de lessive.',
  'Un pêcheur a attrapé un poisson qui parlait. Il l\'a relâché : il refusait de se taire.',
  'Les pandas du Monastère ont médité si fort qu\'un village voisin s\'est endormi pour deux jours.',
  'Une sorcière a perdu son balai. Récompense honnête, pas de questions, pas de crapauds.',
  "Un Groliphant s'est assis sur la diligence de Brêche-Haute. Les passagers sont arrivés à l'heure, mais plus plats.",
  "Les nains banquiers de la Banque Centrale Goyenne ont ri hier. Une seule fois. Les intérêts ont augmenté aussitôt.",
  'Un gobelin a essayé de voler la lune avec une échelle. Il est tombé à la troisième marche. Il retentera demain.',
];

// --- L'Armure du Dernier Rempart ---

// Chaque nouvelle zone débloquée, un messager de la Confrérie du Dernier Rempart t'apporte une
// pièce de l'armure légendaire, « pour le champion qui la portera lors de la dernière bataille ».
// (Le joueur croit la rassembler pour un aventurier... le scénario en décidera autrement.)
const ARMURE = [
  { id: 'heaume', nom: 'Le Heaume du Veilleur', texte: "Un casque d'argent terni, une crête en forme d'aile. Il voit plus loin que les yeux." },
  { id: 'gantelets', nom: 'Les Gantelets de Braise', texte: 'Encore tièdes, comme si la main qui les portait venait de les quitter.' },
  { id: 'spalieres', nom: "Les Spalières de l'Aube", texte: 'Deux épaulières gravées de soleils levants.' },
  { id: 'ceinturon', nom: 'Le Ceinturon des Serments', texte: 'Chaque boucle porte le nom d\'un héros tombé. Il reste de la place.' },
  { id: 'jambieres', nom: 'Les Jambières du Rempart', texte: "Elles n'ont jamais reculé d'un pas, dit-on." },
  { id: 'solerets', nom: 'Les Solerets du Long Chemin', texte: 'Usés par mille routes, et pourtant solides comme au premier jour.' },
  { id: 'plastron', nom: 'Le Plastron du Dernier Rempart', texte: 'Le cœur de l\'armure. Une fissure en travers, jamais réparée.' },
  { id: 'pavois', nom: 'Le Pavois des Mille Flèches', texte: 'Un grand bouclier criblé de pointes de flèches. Aucune ne l\'a traversé.' },
  { id: 'lame', nom: 'Aube-Lame', texte: "L'épée du champion. Sa lame s'éclaire quand les ténèbres approchent." },
];
// La première fois, le messager raconte la légende.
const LEGENDE_ARMURE = "« Il y a bien longtemps, un champion a porté cette armure contre les ténèbres. Ses pièces ont été dispersées " +
  "aux quatre coins du monde. On dit qu'un jour, quelqu'un la portera de nouveau, pour la dernière bataille. La Confrérie du " +
  "Dernier Rempart te confie la première pièce. Rassemble l'armure pour le héros qui viendra. Garde-la bien. »";

// Le nom du shop, sur l'enseigne de la façade (le joueur le choisit à la création).
const NOM_SHOP_DEFAUT = 'Le Comptoir des Aventuriers';
const NOM_SHOP_MAX = 32;

// L'armure sombre : si ta jauge du mal dépasse ta réputation, c'est la Main Noire qui t'envoie
// les pièces de l'Armure de la Nuit Éternelle, et celles que tu as déjà se corrompent (elles se
// purifient si tu reviens vers le bien). Quand l'armure est complète, ton camp est scellé.
const ARMURE_SOMBRE = {
  heaume: { nom: 'Le Heaume du Corbeau', texte: 'Un casque noir au bec de fer. On dit qu\'il murmure la nuit.' },
  gantelets: { nom: 'Les Griffes de Cendre', texte: 'Des doigts de métal crochus, toujours froids.' },
  spalieres: { nom: 'Les Spalières du Crépuscule', texte: 'Gravées de soleils couchants. Ou mourants.' },
  ceinturon: { nom: 'Le Ceinturon des Parjures', texte: 'Chaque boucle porte le nom d\'un traître. Il reste de la place.' },
  jambieres: { nom: "Les Jambières de l'Abîme", texte: 'Elles n\'ont jamais reculé non plus. Elles ont piétiné.' },
  solerets: { nom: 'Les Solerets du Sentier Noir', texte: 'Ils laissent des traces de suie sur le plancher.' },
  plastron: { nom: 'La Cuirasse de la Nuit Éternelle', texte: 'Le cœur de l\'armure. La fissure saigne encore.' },
  pavois: { nom: 'Le Pavois des Lamentations', texte: 'On y entend des pleurs, quand on colle l\'oreille.' },
  lame: { nom: 'Crépuscule', texte: "L'épée du champion noir. Sa lame s'assombrit quand la lumière approche." },
};
const NOMS_ARMURE = { clair: 'Armure du Dernier Rempart', sombre: 'Armure de la Nuit Éternelle' };
const LEGENDE_SOMBRE = "« La Main Noire te salue. Ton cœur a choisi l'ombre, et l'ombre te le rend. Cette pièce appartient " +
  "à l'Armure de la Nuit Éternelle : celui qui la portera mènera la dernière bataille... de notre côté. Celles que tu gardes " +
  "déjà vont noircir. Rassemble-la. Pour le champion qui viendra. »";
