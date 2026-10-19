# Document de conception (GDD) — Premier-Jeu

> Titre : **Le Passage des Aventuriers** (le mot « Passage » reste à confirmer).
> Ce document résume l'idée du jeu et sert de référence pendant le développement.
> Il évoluera au fil des étapes.

## 1. Pitch

Un jeu de gestion narratif dans l'esprit de *Papers, Please*, *Dealer's Life Legends* et *Dave the Diver*, en pixel art 2D.

Le joueur est un jeune orphelin humain (homme ou femme, au choix) qui tient un comptoir de ravitaillement pour aventuriers. Il prépare leurs commandes (provisions, armes, munitions, soins…) depuis sa fenêtre de comptoir et **investit** dans leurs chances de réussite : un aventurier qui revient vivant partage son butin, un aventurier qui meurt fait tout perdre.

Le jeu couvre toute une vie : on commence à ~15 ans dans un petit comptoir cosy et on finit vieux et barbu, face à une menace qui grandit.

## 2. Boucle de jeu

```
MATIN       → Le Marché des Mastres : acheter le stock (légal), mini-jeux d'argent, mendiant
              (le marché n'est ouvert que le matin, avant la journée)
JOUR        → La carte : placer les voyageurs du jour sur leurs destinations
              Le comptoir : préparer leurs baluchons
SOIR        → Bilan, lettres, banque, atelier ; plus tard (rare) le Marché Noir
NUIT        → Aller dormir : petite scène au lit avec le bilan du jour → jour suivant
```

En arrière-plan, les aventuriers partis sont en quête pendant **plusieurs jours** (durée variable), puis reviennent (ou non) avec leur part du butin.

### 2.1 Le cœur : servir et investir
- Chaque jour, un nombre de voyageurs se présente. Ils font **la queue** devant la fenêtre : on voit combien de clients attendent encore.
  - **Prévus** : ils envoient une lettre 2 ou 3 jours avant avec leur commande (on peut anticiper le stock).
  - **Imprévus** : des événements spéciaux inédits (un nain pressé, un client blessé, une inspection de garde…).
- Chaque voyageur a une **commande** (besoins) liée à sa quête.
- Le joueur la remplit avec son stock. Plus la commande est complète et de qualité, plus la **chance de réussite** est élevée.
- Résultat de la quête : succès (retour + part du butin), mort valeureuse, ou mort sans gloire → investissement perdu.
- **Le récit** : quand un aventurier revient, il raconte son aventure dans une petite cinématique. On le voit affronter chaque épreuve, et comment chaque objet du colis l'a aidé (ou lui a manqué). S'il meurt, c'est son carnet de voyage qui raconte.
- **La Faucheuse** : les jours où des aventuriers ne reviendront pas, une silhouette noire attend tout au bout de la file. Quand elle arrive au comptoir, l'obscurité tombe, le froid fait vaciller les bougies, et elle annonce d'une voix glacée ceux qui ne reviendront jamais de voyage. Puis elle se dissout dans l'ombre (l'obscurité repart avec elle) et laisse leurs carnets, couverts de givre, sur le comptoir. On les lit un par un.
  - **De plus en plus terrifiante** avec le nombre d'âmes emportées (3, 7, 15) : nuit plus noire, silhouette plus grande qui déborde de la fenêtre, halo rouge, éclair de sang, puis des battements de cœur pendant toute sa visite. Ses paroles changent aussi (« 17 âmes sont passées par tes mains avant les miennes »).
  - **De plus en plus séduite** si tu lui offres des âmes exprès (Indifférente → Intriguée → Séduite → Éprise) : elle te salue en « mon marchand préféré », son nom change de couleur.
  - **Elle commente tes choix** : les morts que tu lui as offertes, celles que tu avais pourtant bien préparées, ta réputation et tes actes (« On t'aime, au village... S'ils savaient »).
- **Les morts voulues** font monter ta **jauge du mal** (séparée de ta réputation, qui est ta réputation dans le bien) et séduisent la Faucheuse. On retient la raison la plus grave : un **objet piégé** (+2), un **colis volontairement vide** (au moins 2 objets commandés pas donnés alors que tu les avais, +1), **aucune chance de revenir** (moins de 30 %, +0,5).
- **Les objets piégés** (corde effilochée, potion empoisonnée, épée fêlée, ration avariée...) : on ne les achète nulle part, la Faucheuse les glisse sous ton comptoir (son premier cadeau quand elle devient intriguée, puis un par mission). Dans le **tiroir secret** du comptoir, on en glisse un dans le baluchon à la place d'un objet commandé : le client n'y voit que du feu, mais l'épreuve qui en a besoin le tue. Risque : 35 % que le piège soit découvert (réputation −2).
- **Les missions de sabotage** : à partir de 3 de jauge du mal, la Faucheuse te désigne une âme pure qui viendra le lendemain à ton comptoir (☠ dans la file et sur la carte), avec l'objet piégé pour elle. Accepter ou refuser (elle est déçue : faveur −1). Réussi : une bourse de pièces glacées (30 à 60 p. selon le danger) et sa faveur. Raté : elle est déçue.
- **La Main Noire** ouvre ses prêts quand la jauge du mal atteint 6.
- **La prévision** : chaque soir, on sait combien de clients viendront le lendemain, sous forme de fourchette (« entre 3 et 6 clients »). Elle grandit avec la réputation, l'expérience (clients servis) et la variété du stock.
- **Les quêtes ont toutes des durées différentes** : certains reviennent le lendemain, d'autres après plusieurs semaines.
- Les fiches des voyageurs permettent de suivre : à venir / présents / partis / revenus / morts.

### 2.2 Économie
- Argent visible en temps réel (pile de pièces sur le bureau).
- Dépenses : achat de stock au marché, marché noir, améliorations, jeux d'argent, dons.
- Revenus : parts de butin des aventuriers revenus.
- Tableau de chiffre d'affaires : jour / semaine / mois / année.

### 2.3 Gérer son comptoir
- **La carte du matin** : en ouvrant le comptoir, on passe d'abord par la carte. On choisit chaque voyageur du jour qui cherche l'aventure (une bande en bas de la carte), on clique sur une zone (une bulle montre son danger, le butin espéré pour ce voyageur, la durée et ce qu'il faut), puis « Envoyer ici ». Une fois tout le monde placé : « Préparer les sacs ». La carte montre aussi les aventuriers en mission (⚔ jour du retour), les clients qui ont écrit (✉) et ta cible (☠) : une vue d'ensemble de tes alentours et de ta progression.
- **Mettre en attente** : un client peut retourner au bout de la file avec son colis commencé (et sa destination), pour servir les suivants d'abord. La première attente passe bien ; les suivantes l'agacent (−1 de relation).
- **Refuser** : on peut refuser un client (pour ne pas l'envoyer à une mort certaine) ou une commande par lettre. Ça coûte de la réputation : 1 point pour un client, 0,2 pour une lettre.
- **Les lettres** sont plus exigeantes (une ou deux épreuves demandent un objet de plus) mais rapportent 25 % de plus.
- **Les longues quêtes** demandent plus de rations et rapportent plus (+30 % de butin par jour en plus).
- **Les habitués et la réparation** : un aventurier revenu vivant peut revenir comme client. Il garde ses objets durables (épée, corde, gourde), qui s'usent à chaque épreuve (3 crans). Le joueur peut les réparer : ça ne coûte rien en stock, et c'est le client qui paie.
- **La réserve** est limitée (20 places au départ), et on peut l'agrandir en payant (30, 40, puis 55 places).
- **L'assortiment** du marché change chaque jour : les objets de base sont toujours là, les autres apparaissent au hasard en quantité limitée. Les prix varient (voir le Marché des Mastres).
- **Le marchand express** : le **Vieux Grippesou**, un vieux gobelin avare recroquevillé à côté de sa caravane (page à part, le client attend au comptoir). Il vend quelques objets au hasard, 2,5 fois plus cher (et certains jours du fer ou du cuir, à un prix délirant), **utilisables tout de suite** : ce dont le client a besoin va directement dans son colis, le reste dans la réserve. Ce n'est jamais rentable : ça sert juste à sauver un voyage.
- **La Banque Centrale Goyenne** (page à part) : des banquiers nains te toisent depuis leur immense bureau (Thorgrim Coffrefort et ses associés). Leurs prêts se débloquent avec la réputation (plus elle est haute, plus on peut emprunter, et moins cher). Les échéances sont prélevées chaque nuit.
- **La Main Noire** (la mafia) ne prêtera qu'au joueur qui a choisi le camp du mal, plus tard dans le jeu.
- **Les soins** : un aventurier qui revient blessé peut être soigné à la fin de son récit, une potion par cœur perdu. Il paie 1,5 fois le prix d'une potion. S'il n'est pas soigné, il repart plus fragile (un cœur de moins) à sa prochaine quête.
- **Pas d'achat à crédit** : on n'achète qu'avec l'argent qu'on a. Pour plus, il faut un prêt à la banque.
- **Le dédommagement des familles** est obligatoire quand un aventurier meurt (à la fin de son carnet). Trois montants au choix, en part du butin espéré : minimum (15 %), moyen (35 %, réputation +0,25), maximum (60 %, réputation +0,5). Plus on donne, plus un proche a de chances de venir reprendre la quête (15 %, 35 %, 60 %), et moins il y a de risque qu'il vienne en colère.
- **Les lettres** ne s'acceptent jamais toutes seules : on répond Oui ou Non le soir. Une lettre restée sans réponse le jour venu compte comme un refus.
- **La faillite** : on peut passer à découvert à cause des échéances de prêt ou des dédommagements ; à -100 pièces, le comptoir ferme. Une cinématique comique montre le banquier et ses gardes qui viennent tout saisir (parchemin de dettes trop long, garde qui trébuche, dernière pièce confisquée, planches clouées sur la porte).
- **Capital de départ** : 80 pièces, pour tenir le temps que les premiers aventuriers reviennent.

### 2.4 Le dispatch : choisir où envoyer les aventuriers
- La plupart des clients viennent **chercher l'aventure** sans destination, avec une envie (l'or, la gloire, le savoir, un monstre à combattre) et un niveau : **novice**, **aguerri** ou **vétéran** (un cœur de plus, vise plus gros). Chaque retour réussi les fait monter d'un niveau.
- **Le joueur choisit la zone sur une carte.** La quête (une des quêtes de la zone), la commande et la durée en découlent. Le butin grandit avec le danger (×1 à ×3).
- Ceux qui écrivent une lettre savent déjà où ils veulent aller.
- **Les zones** :

| Zone | Danger | Ouverte à | Matériel typique | Quêtes |
|---|---|---|---|---|
| Les Collines de la Comté | ★ | dès le début | rations, corde, torche | lettre à Brêche-Haute, sanglier |
| La Forêt des Murmures | ★★ | dès le début | flèches, torche, antidote | loup géant, ruines de Vieille-Tour, champignons de lune |
| Les Marécages de Brume-Noire | ★★ | dès le début | gourde, bandages, potion | fleur de lune, cloche engloutie |
| Les Mines abandonnées | ★★★ | réputation 3 | torches, épée, potion | mine de Grisefer |
| Les Terres Désolées | ★★★ | réputation 4 | gourdes, cape, bouclier | caravane, oasis perdue |
| Les Pics Gelés | ★★★★ | réputation 8 | cape chaude, cordes, épée | yéti, col des Glaces |
| Les Ruines du Roi-Sorcier | ★★★★ | réputation 10 | épée, amulette, torches | couronne du Roi-Sorcier |
| L'Antre de la Bête | ★★★★★ | réputation 15 | bouclier, épée, potion | la Bête de l'antre |

- **Découvertes** : un aventurier revenu d'une zone peut parler, dans son récit, d'une zone encore inconnue un cran plus dangereuse (35 %). Elle s'ouvre alors sur la carte, sans attendre la réputation.
- **Nouveaux objets** : antidote, cape chaude, bouclier, amulette. Ils sont vendus au marché, et Hilda la Tailleuse a rejoint la rue.
- **Le suréquipement** : on peut donner plus que la commande, dans la limite du sac (hobbit et magicienne 2, humain et elfe 3, nain 4). Un objet en plus qu'une épreuve demande donne +5 % pour la réussir ; des soins en plus (potion, bandages, antidote) donnent un cœur de réserve (un seul). Le client ne paie pas le surplus : c'est ton investissement. Chaque objet en plus demande une confirmation, pour éviter d'en donner par erreur.
- Chaque zone a **son paysage** dans les récits (forêt, marais, mines, désert, neige, ruines, antre) et ses épreuves propres.
- **Les baluchons** : on étale un tissu sur le comptoir, les objets s'y rangent, on le noue au bout d'un bâton, et le client repart avec sur l'épaule. Le tissu dépend du contenu (carreaux rouges pour les provisions, toile grise pour les armes, lin blanc à croix rouge pour les soins, toile brune rapiécée pour un peu de tout) ; le baluchon grossit avec le nombre d'objets.
- **Aller dormir** marque la fin de la journée : ton personnage rentre dans sa chambre, souffle la bougie et se couche, pendant que le bilan du jour s'affiche (clients servis, revenus, disparus, bénéfice). La lune passe, l'aube se lève, il saute du lit : direction le marché.

### 2.4 bis Le Marché des Mastres (le matin)
- La rue du marché est plus large que l'écran : on la parcourt avec des flèches ◀ ▶, et une flèche jaune montre le lieu qu'on regarde.
- **Rentrer chez toi** : après le marché, on peut repasser chez soi (réserve, lettres, atelier, bureau, banque) avant d'ouvrir le comptoir, ou retourner au marché.
Après la nuit, on se réveille au marché avant d'ouvrir le comptoir.
- **Trois étals**, chacun avec son marchand, ses objets et ses prix du jour (ça vaut le coup de comparer) :
  - **Maître Gédéon** (épicerie) : rations, gourdes, torches, bandages, toujours là ;
  - **Thorgal le Forgeron** (forge) : fer et cuir toujours là ; épées, flèches, cordes au hasard ;
  - **Mère Sauge** (apothicaire) : bandages toujours là ; potions au hasard.
- **Le marchandage** marche avec chacun des trois : plus on achète chez un marchand, meilleure est la relation, et plus il fait de remises. Ses amis ont droit à plus de quantité.
- **Le coin des jeux**, tenu par Fil-de-Fer (cousin du Vieux Grippesou) : **les dés** (deux dés chacun, le plus gros total gagne la mise) et **le bonneteau** (trouver la pièce sous le bon gobelet après le mélange, gagne le double). Trois parties de chaque par jour, mises de 5, 10 ou 20.
- **Le mendiant** : on peut lui donner 1, 5 ou 10 pièces. Ta générosité est mémorisée. Au-delà de 30 pièces, il t'offre le **Trèfle du mendiant** (+1 aux dés, bonneteau plus lent). Il pourra jouer un rôle plus tard dans l'histoire.
- **Les commandes prévues** : un bouton déroule ou referme la liste des commandes acceptées par lettre (aujourd'hui, demain, les jours suivants) et le **total à prévoir** pour toutes les satisfaire, objet par objet : combien il en faut aujourd'hui, en tout, combien tu en as, et combien il en manque. Les clients imprévus ne sont pas comptés.
- **La prévision** du soir est une estimation : le vrai nombre de clients est tiré à l'ouverture du comptoir, donc un stock varié acheté le matin attire encore du monde.

### 2.5 Achat-revente : trouvailles, atelier, enchères
- **Les trouvailles** : à la fin de son récit, un aventurier revenu vivant te montre parfois un ou deux objets de valeur. Il te les vend en dessous de leur valeur (encore moins cher si vous êtes amis).
- Chaque objet a une **catégorie** (arme, armure, bijou, artefact, vêtement) et un **état**, avec un code couleur : **cassé** (rouge, ×0,2), **abîmé** (orange, ×0,45), **usé** (jaune, ×0,7), **bon** (vert, ×1), **parfait** (or, ×1,4).
- **L'atelier** (8 places) : en lançant une réparation (toi ou un employé), tu **choisis jusqu'à quel état** aller : chaque état de plus coûte des jours et 1 matériau (fer pour les armes et armures, cuir pour les vêtements). La première étape dure selon la catégorie (vêtement 2 jours, arme et armure 3, bijou 4, artefact 5) ; les suivantes deux fois moins, l'objet étant déjà sur l'établi. On ajoute +2 jours à l'étape qui part de « Cassé », +1 à celle qui part d'« Abîmé », et on retire un jour par niveau d'artisanat (et un avec l'experte).
- **Restauré ★** : un objet acheté cassé ou abîmé et réparé jusqu'au parfait état vaut beaucoup plus (×1,3 s'il était cassé, ×1,15 s'il était abîmé, en plus du ×1,4 du parfait état). C'est le pari de l'atelier : long et coûteux en matériaux, mais très rentable.
- **Les employés** : on peut embaucher jusqu'à deux personnes pour réparer plusieurs objets à la fois : **Tobin l'apprenti** (4 p. par nuit) et **Marta la Rétameuse** (9 p. par nuit, ses réparations prennent un jour de moins). Les salaires sont payés chaque nuit.
- **Les enchères** (au Marché des Mastres, une vente par jour) : on propose un lot de 1 à 3 objets. Quatre enchérisseurs surenchérissent, chacun avec ses goûts : Lord Pommeroy (armes, armures), Dame Ysaline (bijoux, vêtements), Gros Bob le collectionneur (artefacts, bijoux), Thrain Fendroc (armes, artefacts). Un lot de la même catégorie plaît encore plus aux collectionneurs (+15 %).
- Le but : repérer l'objet abîmé qui prendra de la valeur une fois réparé.

### 2.6 Relations et familles
- Chaque client a une relation avec le joueur : **Ennemis jurés, En froid, Hypocrite, Neutre (ou Inconnu), Connaissance, Amis, Frères de sang**.
- **La couleur des noms** suit la relation, du rouge (pires ennemis) au vert vif (frères de sang) en passant par l'orange, l'ambre et le neutre : au comptoir, dans le registre, sur les lettres, au marché et dans les récits.
- Elle bouge selon tes actes : colis complet (+1), colis pauvre (−1), retour vivant (+2), réparation (+1), refus (−3), lettre refusée (−1).
- Effets : la part de butin reversée va de ×0,6 (pires ennemis) à ×1,25 (frères de sang).
- **Paliers de plus en plus durs** : une mission parfaite fait passer d'Inconnu à Connaissance (3 points), puis il en faut 8 pour Amis et 16 pour Frères de sang. Côté négatif : Hypocrite à −1, En froid à −4, Ennemis jurés sous −8.
- Paliers franchis la première fois : **Amis** → cadeau de matériaux ; **Frères de sang** → une décoration pour le shop ; **Ennemis jurés** → ta réserve est saccagée.
- **Les familles** : quand un aventurier meurt, un proche (fils, fille, frère, sœur, père, mère) peut venir au comptoir quelques jours plus tard. Ce qu'il veut dépend de la relation avec le disparu, plus un peu de hasard :
  - **la colère** : dédommager (25 p.) ou le renvoyer (il devient ton pire ennemi) ;
  - **un souvenir** : offrir un objet de ta réserve, ou refuser ;
  - **la relève** : il reprend la quête du disparu, et tu l'équipes ;
  - **un hommage** (frères de sang) : le disparu t'a laissé une décoration.

### 2.7 Compétences du joueur (le côté RPG)
- **Flair** : au début, l'estimation des chances (« Ton flair dit : ~60 % ») est faussée et arrondie. Elle s'affine avec l'expérience, jusqu'au pourcentage exact (40 clients servis).
- **Marchandage** : la relation avec chaque marchand du Marché des Mastres monte avec ce que tu dépenses chez lui (1 point par 25 pièces). Connaissance : −5 %, Amis : −10 % et plus de quantité, Frères de sang : −20 % et une décoration.
- **Artisanat** : réparer coûte des matières premières (fer pour l'épée, cuir pour la corde et la gourde). Au début il en faut 3 par réparation, puis 1 de moins tous les 4 réparations (minimum 1).
- **Les décorations** du shop donnent des bonus : Carte des contrées (+4 % par épreuve), Trophée de loup (plus de clients), Lanterne enchantée (+10 % de butin), Enclume naine (1 matériau de moins par réparation).
- Plus tard : des talents à choisir aux grands âges de la vie.

### 2.8 Risque : le marché noir
- Ouvre certains soirs seulement.
- Grimoires interdits, potions illégales, artefacts.
- Voyageurs nocturnes : quêtes farfelues, gros gains possibles, mais s'ils se font prendre, **les conséquences retombent sur le joueur**.

### 2.10 Idées notées pour plus tard
- **(v 0.61) Revoir la tenue de la garde de la Confrérie** : « déjà mieux », mais sa personnalisation est à reprendre (casque, tabard, variantes par grade).
- **Les familiers** : obtenir un ou plusieurs familiers selon les quêtes et les relations (le grand aigle en est un). Comment exactement : à définir.
- **Les zones conquises** : envoyer des aventuriers libérer (camp du bien) ou conquérir (camp du mal) une zone, pour pouvoir s'y installer et avancer dans l'histoire. Chaque nouvelle zone a son biome et son ambiance. Il faut financer le voyage et le nouveau shop : on ne déménage que pleinement préparé. À construire une fois le Bien et le Mal en place.
  - **Précisé par le joueur (v 0.40)** : débloquer une nouvelle zone permet d'y **déplacer notre auberge**. Nouveau décor et nouvel environnement, nouvelles possibilités esthétiques, nouveaux personnages du village d'à côté.
  - S'installer dans un **lieu du mal ou du bien influence la clientèle**, et donc la jauge du mal et du bien.
  - Chaque nouvelle zone débloquée apporte aussi **une nouvelle pièce d'armure** (déjà en place : une pièce par zone ouverte, une seule par matin).
  - La conquête d'une contrée ne donne donc **pas** de bonus de butin : sa vraie récompense, c'est de pouvoir s'y installer. Partie à peaufiner, elle prendra du temps.

- **Le chien du mendiant (noté en v 0.47)** : le mendiant est assis contre un tonneau avec son gros chien. Une fois par jour on peut donner une ration au chien. À force de le nourrir, on débloque une **cinématique un peu secrète** qui emmène vers une **aventure annexe, déconnectée du monde** (à inventer : un lieu hors de la carte, une histoire à part). Le compteur `G.chienNourri` est déjà en place pour s'en servir plus tard.

### 2.9 Aider pendant l'aventure
- **Le grand aigle** (familier à débloquer) : quand un aventurier en mission envoie un message de détresse, l'aigle peut lui apporter rapidement des objets.
- **Les mercenaires** : on peut en envoyer un nombre limité de fois par jour pour récupérer le butin perdu par un aventurier mort.

## 3. Le Bien et le Mal

### 3.1 Les races
| Forces du bien | Forces du mal |
|---|---|
| Humains | Gobelins |
| Elfes | Orcs |
| Nains | Loups-garous |
| Hobbits | Vampires |
| Pandas humanoïdes | Momies |
| Magiciennes | Trolls |

On découvre de nouvelles races en débloquant de nouvelles zones et de nouveaux shops.

### 3.2 Choisir son camp
Le joueur ne choisit pas son camp dans un menu : son camp se construit par ses actes.
- **Les objets achetés** : certains objets sont conçus plutôt pour les races du bien, d'autres pour les races du mal.
- **Le décor du shop** : un décor lumineux ou un décor maléfique.
- **Les quêtes qu'on fait réussir** : plus les missions d'un camp réussissent grâce à toi, plus ce camp t'apprécie.

### 3.3 Conséquences
- Le camp qui t'apprécie te fait de **meilleures affaires** (butins plus gros, clients plus riches).
- L'autre camp te fait de **mauvaises affaires** : visages fermés, dialogues froids, clients qui te font comprendre que tu n'es pas le bienvenu.
- **Deux fins possibles** : du côté de la menace, ou contre elle.

## 4. Progression
- **Commandes** de plus en plus grosses et chères ; investissements plus risqués.
- **Réputation** + **décoration/design** + **stock disponible** → attirent des voyageurs plus prestigieux, riches et exigeants.
- **Améliorations du shop** la nuit ; le shop lui-même change au fil du jeu (plusieurs shops / lieux).
- **Choix de vie** : vie de famille ou vagabond, chacun avec avantages et inconvénients.
- **Personnages récurrents** : voisins sympathiques, gens qui proposent des services contre récompense, influences malveillantes.
- **Le mendiant** : donner de l'argent peut avoir un impact plus tard.

## 5. Histoire
- **Création du personnage** : garçon ou fille, coiffure, couleur des cheveux, de la peau et des yeux, bouche (souriante, neutre, étonnée, grognon), barbe (elle pousse à 18 ans), couleurs des habits du haut et du bas. L'aperçu montre le personnage au début de l'aventure (15 ans).
- **Idée à développer plus tard, l'évolution du personnage** : le nom évolue avec l'âge, JeuneGoy (moins de 18 ans), HommeGoy (adulte), AncienGoy (60 ans et plus) ; JeuneGoy, FemmeGoy, AncienneGoy pour une fille. On commence à 15 ans, et une année passe à chaque année du calendrier (112 jours). Les cheveux blanchissent avec la vieillesse. (Déjà en place : le nom et l'âge au comptoir. À venir : le vieillissement visible, les talents à choisir aux grands âges.)
- **Prologue** (cinématique d'introduction) : le jeune orphelin sauve **Garrick Cœur-de-Chêne**, un aventurier emporté par une rivière, le soigne, répare ses armes, chasse pour le nourrir et lui prépare des provisions. Des jours plus tard, l'aventurier revient avec un trésor. Le jeune ne sait pas quoi demander, mais il a aimé s'occuper de lui → l'aventurier lui offre son **premier shop** et un petit capital.
- **Fil rouge** : une menace grandit (piste actuelle : un grand dragon sous la montagne mystique — *à confirmer*). Le monde a de plus en plus peur.
- **Deux fins** selon le camp du joueur :
  - **Le bien** : le joueur équipe le groupe d'aventuriers qui part affronter la menace.
  - **Le mal** : le joueur aide la menace à s'abattre sur le monde des gentils.

## 6. Environnement et interface

### Shop n°1 — la Comté
Petit entrepôt en bois, cosy, façon auberge du Poney Fringant. Les clients ne rentrent pas : ils se présentent à une **fenêtre de comptoir** (comme un « drive »).

**Vue 1 : face au comptoir**
- Fenêtre ouverte sur l'extérieur : voyageurs + paysage paisible façon la Comté.
- Bureau en bois avec :
  - pile de pièces (argent en temps réel) ;
  - fiches des voyageurs (à venir / présents / partis / revenus) ;
  - tableau du chiffre d'affaires ;
  - tiroirs cliquables → statistiques de la partie.
- Flèche → se retourner.

**Le bureau** (déjà en place, ouvert depuis le registre posé sur le comptoir ou le soir) :
- **le registre des fiches** : six onglets (À venir, Aujourd'hui, En mission, Revenus, Disparus, Répertoire) ; chaque fiche montre la relation et le prochain palier, les missions réussies, le butin rapporté, le matériel, les blessures, la commande ou le colis ;
- **l'ardoise du chiffre d'affaires** : recettes, dépenses et bénéfice du jour, de la semaine, du mois et de l'année (les prêts sont comptés à part) ;
- **quatre tiroirs** : tes compétences (flair et sa marge d'erreur, artisanat et prochain niveau, marchandage avec chaque marchand, main-d'œuvre et salaires), les aventuriers (servis, revenus, morts, taux de retour, refus, meilleurs clients, objets les plus donnés), le commerce (recettes et dépenses par poste, ventes aux enchères), la réputation (flair, artisanat, décorations, relations par niveau).
- **Le calendrier** : 7 jours par semaine, 4 semaines par mois, 4 mois par an (Mois des Semailles, des Moissons, des Brumes, du Givre). L'âge du personnage avance d'un an par année du calendrier (à revoir avec l'évolution du personnage).

**Vue 2 : arrière du shop**
- Le stock (tout ce qui a été acheté).
- Le lit → passer à la nuit / au jour suivant.

**Vue extérieure** : façade avec l'enseigne au nom choisi par le joueur.

**Autres lieux** : le Marché des Mastres (matin), le Marché Noir (certains soirs).

**Plus tard : le petit bar** dans le shop. On y entend des rumeurs et des histoires, on y vend des boissons et on y engage des mercenaires.

Le joueur ne quitte jamais vraiment son shop, sauf pour ces marchés (écrans/menus dédiés).

## 7. Ambiance et direction artistique
- Fantasy inspirée du *Hobbit*, du *Seigneur des Anneaux* et de *The Witcher 3*.
- Début : mystique, joli, cozy.
- Ton qui s'assombrit progressivement à mesure que la menace grandit, jusqu'à la délivrance finale.
- 2D, pas de vraie 3D : mélange dessin / pixel art (*Papers, Please*, *Dealer's Life Legends*, *Dave the Diver*, *Terraria* pour les forêts et l'eau).
- Références supplémentaires (ajoutées en v 0.47) : *Travellers Rest* (l'auberge cozy, les clients attablés, la vie du village) et *Stardew Valley* (les PNJ du village, les cadeaux et les relations, les saisons, les festivals, les petits secrets à débloquer). On s'en inspire à la fois pour les graphismes et pour les mécaniques à proposer.
- Pour la musique et les sons : *Harry Potter* (boîte à musique, célesta, valses mystérieuses), *Tavern Master* (auberge chaleureuse), en plus des jeux et films ci-dessus. Pour les intérieurs : *Cats & Chill* (placement libre des meubles, ambiance cozy). Pour l'humour des cinématiques : les jeux *Lego*.
- Depuis la v 0.48, les personnages sont des corps en volume à trois tons (ombre, teinte, lumière), contours épais, couleurs vives, deux fois plus fins : le reste du jeu (décors, objets, interface) doit suivre cette direction, avec plus de couleur.

## 8. Questions ouvertes
- La grande menace : un dragon, ou autre chose ?
- Comment se calcule précisément la chance de réussite d'une quête ?
- Comment fonctionnent les conséquences du marché noir (amende, garde, fermeture temporaire…) ?
- Combien de shops / lieux au total ?
- Durée d'une partie complète (nombre de jours/années) ?
- Comment mesurer le penchant du joueur (une jauge visible, ou seulement ressentie par les dialogues) ?
- Peut-on changer de camp en cours de partie ?
- Plus tard, la banque des gentils et la Main Noire pourront dépendre du camp choisi.

## 8 bis. Progression, chance et événements (décidé et construit)

- **La carte en trois terres** : à l'ouest les **terres de lumière** (Monastère des Pandas ★★, Sanctuaire des Elfes ★★★, Citadelle des Paladins ★★★★), au milieu les terres neutres, à l'est les **terres d'ombre** (Bourbier des Gobelins ★★, Repaire des Loups-garous ★★★, Tour du Nécromancien ★★★★). Une quête du bien réussie rapporte +1,5 de réputation (au lieu de +1) ; une quête du mal rapporte 35 % de butin en plus, aucune réputation, et +0,5 de jauge du mal. Seuls les **aventuriers vénaux** (ceux qui cherchent l'or) acceptent d'aller dans les terres d'ombre, en attendant les races du mal.
- **Le déblocage lent** : au-delà de 2 étoiles, une zone demande sa réputation (ou une découverte dans un récit) **et** des missions réussies dans les zones de l'étoile d'avant : 3 pour ★★★, 5 pour ★★★★, 8 pour ★★★★★. La bulle de la carte montre ce qu'il manque.
- **Les niveaux** : Novice, Aguerri (1 mission réussie), Vétéran (3), Héros (6), Légende (10). Chaque niveau donne des cœurs, du butin et un bonus à chaque épreuve. Seuls les héros osent les zones à 5 étoiles.
- **Le trèfle de chance** (0 à 10) : 1 au départ, plus selon la relation (−1 pour les ennemis, jusqu'à +3 pour les frères de sang), plus les cadeaux. Il peut **rattraper une épreuve ratée** (2 % par point) et, au dernier cœur, **changer la mort en échec** : il rebrousse chemin (7 % par point).
- **Les cadeaux** : au **Bazar de Rosalie** (marché). Un cadeau par client et par jour, depuis le tiroir à cadeaux du comptoir. Chaque peuple a ses goûts : aimé = +3 de chance et la relation monte ; neutre = +1 ; détesté = rien, et il est vexé. Les goûts découverts s'affichent dans sa fiche.
- **La mission ratée** : il revient vivant mais les mains vides. Ta mise est perdue, la réputation baisse (−0,5), et selon votre relation **au moment du départ**, de 1 malus (amis) à 4 (ennemis) parmi : il rumine (relation −2), il est trop blessé pour repartir avant 3 jours (sauf soins), la rumeur fait fuir des clients demain (−2), il te demandera des comptes (il exigera un objet en plus la prochaine fois, sinon relation −3).
- **Les lettres sont rares** (une chance sur trois le soir) et elles annoncent aussi des **événements** passés, en cours ou à venir : pénurie de fer, récolte record, fièvre des marais, braderie naine, hiver précoce (les prix montent ou baissent), tempête de sable ou brume (épreuves plus dures dans une zone), ruée vers l'or ou départ des yétis (plus de butin), foire ou armée d'orcs (plus ou moins de clients). Pas tout le temps : environ une nuit sur six.
- **Le crieur du marché** annonce chaque matin les nouvelles du jour : les événements, et une nouvelle absurde (« Un gobelin a été enseveli sous une bouse de Groliphant... »).

- **L'Armure du Dernier Rempart** : chaque nouvelle zone qui s'ouvre (en dehors des zones du départ) vaut une pièce de l'armure légendaire. Au réveil, un messager encapuchonné de la Confrérie du Dernier Rempart frappe à la porte et la remet ; la première fois, il raconte la légende : un champion portera de nouveau l'armure pour la dernière bataille, rassemble-la « pour le héros qui viendra ». Les pièces s'accrochent sur un **mannequin dans la chambre** (les manquantes en ombre) : Heaume du Veilleur, Gantelets de Braise, Spalières de l'Aube, Ceinturon des Serments, Jambières du Rempart, Solerets du Long Chemin, Plastron du Dernier Rempart, Pavois des Mille Flèches, et Aube-Lame. La carte annonce qu'une pièce attend derrière chaque zone fermée.
  - **L'armure sombre** : si ta jauge du mal dépasse ta réputation, c'est un messager de la **Main Noire** qui apporte les pièces de **l'Armure de la Nuit Éternelle** (Heaume du Corbeau, Griffes de Cendre, Spalières du Crépuscule, Ceinturon des Parjures, Jambières de l'Abîme, Solerets du Sentier Noir, Cuirasse de la Nuit Éternelle, Pavois des Lamentations, et Crépuscule). Les pièces déjà reçues suivent : elles s'assombrissent au réveil si tu bascules vers l'ombre, et se purifient si tu reviens vers la lumière.
  - **Le camp scellé** : quand l'armure est complète (9e pièce), ton camp est scellé pour de bon (la lumière ou l'ombre) ; plus de retour en arrière. Le camp de l'ombre ouvre la Main Noire. (Ce moment pourra être déplacé dans l'histoire.)
  - **Le secret (à ne jamais dire au joueur avant la fin)** : le joueur croit préparer l'armure pour un aventurier. Par un coup du sort, ce sera **lui**, avec le groupe d'aventuriers qu'il aura choisi, qui partira pour la dernière bataille. Le moment et la façon de le révéler sont à écrire.

À faire plus tard : **des tenues différentes selon le niveau des voyageurs** (novice en habits simples, vétéran mieux équipé, héros et légendes en tenues d'apparat) sur les portraits et les silhouettes.

À définir avec le joueur (en file d'attente) : **les goûts de chaque peuple** pour les cadeaux (les goûts actuels sont provisoires).

À définir plus tard : familiers (grand aigle), mercenaires, petit bar, zones conquises, vieillissement et talents, marché noir du soir, camp du mal et Main Noire, les deux fins.

## 9. Plan de développement (étape par étape)

Chaque étape doit donner une version **jouable**.

| # | Étape | Contenu |
|---|---|---|
| 1 ✅ | **Prototype du comptoir** | Une journée, 4 voyageurs en file d'attente, un stock fixe ; on donne des objets ; calcul de la chance de réussite ; cinématique du récit ; bilan. |
| 2 ✅ | **Les quêtes dans le temps** | Plusieurs jours ; quêtes de durées variables ; les aventuriers reviennent faire la queue pour raconter leur récit, ou la Faucheuse vient annoncer leur mort ; lettres de commandes annoncées ; prévision « entre X et Y clients » ; fournisseur simple le soir. |
| 2+ ✅ | **Gérer son comptoir** | Refus de clients et de lettres, lettres plus exigeantes, habitués et réparations, réserve limitée, assortiment variable, marchand express, banque et Main Noire, faillite. |
| 2++ ✅ | **Relations et cinématiques** | 7 niveaux de relation, familles des disparus, flair, marchandage, artisanat et matières premières, décorations, cinématique d'introduction, cinématique de faillite. |
| 3+ ✅ | **Achat-revente** | Trouvailles des aventuriers, atelier de réparation sur plusieurs jours, enchères par lots au Marché des Mastres. |
| 3 ✅ | **Le Marché des Mastres** | Le matin, avant d'ouvrir : trois étals (épicerie, forge, apothicaire) aux prix et assortiments variables, marchandage avec chaque marchand, dés et bonneteau, le mendiant. |
| 4 ✅ | **Les fiches et le bureau** | Le registre (fiches : à venir, aujourd'hui, en mission, revenus, disparus, répertoire), l'ardoise du chiffre d'affaires (jour, semaine, mois, année), trois tiroirs de statistiques, le calendrier. |
| 4+ ✅ | **Le dispatch** | Carte des 8 zones, clients qui cherchent l'aventure, niveaux, quêtes par zone, découvertes, nouveaux objets, suréquipement, paysages par zone ; colis dont la forme et la taille dépendent du contenu ; rue du marché qu'on parcourt avec des flèches. |
| 5 ✅ | **Les deux vues du shop** | Se retourner : l'arrière-boutique (étagères du stock, coin de la fortune, panier des cadeaux, tiroir secret, porte de la chambre) ; le nom du shop choisi à la création (et au bureau) ; la façade avec son enseigne chaque matin ; l'armure sombre. |
| 6 ✅ | **Sauvegarde** | Automatique le soir et le matin : navigateur, compte claude.ai (version en ligne), et code de sauvegarde à copier-coller. Bouton Continuer à l'écran titre. |
| 7 ✅ | **Graphismes pixel art HD** | Remplacer les formes par de vrais sprites et décors, en micro-étapes (ci-dessous). |
| 7a ✅ | Portraits | Bustes HD de tous les peuples, expressions, clignements, paroles. |
| 7b ✅ | Le comptoir | Mur, fenêtre, plateau, ardoise, parchemin ; JeuneGoy en HD. |
| 7c ✅ | Finitions du comptoir | Marchandises HD sur lit de toile, pièces d'or, boutons noyer et laiton, panneau de dialogue, registre en livre ouvert, tailles des peuples. |
| 7d ✅ | L'intérieur du shop | Arrière-boutique, chambre, bureau du registre, écran du soir ; bougies, luminaires et lumière ; améliorations du shop (4 niveaux de luxe). |
| 7e ✅ | L'extérieur | Paysages peints de toutes les contrées (ciel tramé, nuages, montagnes, arbres, chemin), façade à colombages et toit de chaume (enseigne qui se balance, fumée), étals à auvents et pavés du marché, Banque de pierre et d'or, carte illustrée à l'encre et à l'aquarelle. |
| 7f ✅ | Silhouettes HD en pied | Personnages entiers en HD partout (file, départs, récits, marché, carte, registre), couleurs propres à chaque voyageur, tenues selon le niveau (novice rapiécé → aguerri sacoche → vétéran épaulières de cuir → héros métal et cape → légende dorures), figurants costumés (garde, banquiers, colporteur, mentor, Grippesou). |
| 7g ✅ | Cinématiques animées | Vrais pas de marche (jambes, bras, poussière) pour tous les personnages et JeuneGoy, partout (file, départs, récits, prologue, faillite, chambre, façade) ; paysage qui glisse pendant les récits ; bond de joie et étincelles quand une épreuve est surmontée, recul et éclair rouge quand on est blessé ; rivière peinte qui coule ; cadres des textes. |
| 8 ✅ | **Réputation et améliorations** | Chaque palier de réputation est un événement (gazette, visiteur notable, déblocage) ; clients prestigieux (nobles, collectionneurs) qui paient le double mais ont une exigence ; brocante de Firmin (décorations) et garde-robe de Marcelline (vêtements portés par le joueur) ; commandes plus exigeantes aux hauts paliers (objets rares, matériel neuf). |
| 8¾ ✅ | **Refonte des personnages (relief et angles)** | Décidé en v 0.47 : les personnages n'existent que de face, c'est ce qui leur manque. Dessiner chaque peuple sous plusieurs angles (face, trois-quarts, profil, dos) pour qu'ils se retournent et bougent naturellement ; séparer le bras de l'avant-bras par les couleurs (pas seulement par le coude plié) ; casser un peu la règle du « tout plat » pour donner du relief, façon *Terraria* (moins de pixels, mais une impression de 3D par les jeux de couleurs et les angles). Ensuite, refonte des habits : plus jolis, inspirés des films et jeux de référence (le chapeau de la magicienne façon mage de *Terraria*). |
| 8½ ✅ | **Musique et sons** | À faire **avant** l'étape 9 : une musique d'ambiance par moment (marché, comptoir, nuit, cinématiques) et les bruitages (pièces, porte, clochette, pas, dés, plume…). |
| 9 ✅ | **Le Bien et le Mal** (v 0.53–0.54) | Races maléfiques, objets du bien / du mal, réputation par camp, dialogues qui changent. **Le marché noir en fait partie** (objets interdits, voyageurs nocturnes, conséquences). Comment augmenter le mal ou le bien de façon satisfaisante, logique et fluide. Idées validées pour cette étape : le camp de la lumière donne de meilleurs taux à la banque et plus de réputation dans les terres de lumière. |
| 9+ ✅ | **Registre et grand point final** (v 0.54) | Registre du bureau en blocs encadrés ; trois audits (récit, gameplay, visuel) et leurs correctifs : voir docs/audit-v054.md. |
| 9++ ✅ | **Le grand monde** (v 0.54, complété en v 0.55) | Carte qu'on fait glisser et zoomer, royaumes du Conseil dessinés (Comté ★ … Mages ★★★★★), Monts de Bambou, Terres sauvages, Terres des Bannis derrière la Grande Muraille, dix contrées de plus (24 en tout) avec leurs quêtes et leurs indices. Planches : docs/planches-v054/. |
| 9++++ ✅ | **v 0.55** | Œil de l'elfe dégagé (la tempe du côté tourné recule) ; emblèmes des orcs (vert sombre), des gobelins (dague) et des nains (marteau de paladin) ; le Monastère des Pandas à 4 étoiles ; six contrées de plus (Vallon des Guérisseuses ★2, Abbaye de Clairval ★3, Fort de Hautgarde ★3 côté lumière ; Clairière des Chamans ★2, Mines Rouges ★3, Col des Hurlements ★4 côté ombre), 30 en tout ; les ★2 s'ouvrent au jour 2 avec le **dévoilement** (la caméra glisse, la brume se dissipe, le médaillon se déplie, fanfare) ; la carte ne montre que le **monde connu**, zoomée dessus, et se dézoome à chaque contrée gagnée ; **sauts de temps** par palier d'étoiles (★2 : 1 mois, ★3 : 1 an, ★4 : 2 ans, ★5 : 3 ans) : le calendrier avance et le joueur grandit. |
| 9+++ ✅ | **Retouches et emblèmes** (validé le 15/10) | Loup-garou de biais et de profil avec un vrai long museau ; vampire plus pâle, longues canines bordées, goutte de sang chez certains ; momie aux orbites noires et pupilles jaunes ; seize emblèmes (Conseil au soleil à l'œil fermé, Confrérie du Dernier Rempart, cinq royaumes, Monts de Bambou, Bannis à la lune qui berce une fleur de pommier, six peuples bannis, Main Noire), sur la carte et au bout de la jauge. Planches : docs/planches-v055/. |
| 9½ ✅ | **v 0.57 — Lot visuel** (préparatifs : docs/etape9demi-preparatifs.md) | Pavés de ville arrondis ; joueur à la bonne taille ; cave du marché noir en trois coins (doyens, voyageurs, table de la Main Noire) ; roulotte de Grippesou ; banque en marbre ; chambre (trophées rares offerts par les frères de sang, lettres épinglées, portrait de famille) ; coin de forge bâché ; Bête de l'antre (provisoire, à refaire d'après le dragon de référence) ; interface nettoyée (plaques vides, étiquettes, boutons en bois doré...) ; cols de fourrure et haut col de vampire, cous qui entrent dans les habits ; **quatre fins de faillite** selon la cause (esclave de la Main Noire, larbin des banquiers, vengeance de la famille, retour à la forêt), chacune avec un **aperçu de la nouvelle vie** avant l'écran de fin ; **points de reprise** automatiques (chaque semaine et à chaque palier d'étoiles) et **trois emplacements de sauvegarde** ; **réglages du son** (volume général, musique, bruitages, voix, interface : glissières et interrupteurs, depuis le menu ☰ ou l'écran titre) (menu ☰ → Sauvegardes, écran titre, écran de faillite : reprendre, charger ou recommencer) ; intro (personnages plus grands, fondu, « Miam ! » variés) ; iris de la façade au comptoir. |
| 9½d ✅ | **v 0.58 — Cinématiques vivantes** (planches : docs/planches-v058/) | Les personnages se regardent quand ils se parlent, parlent avec leur voix et leur intonation, montrent leurs émotions (bulles « ! ? ♥ … ♪ ») et font des gestes (hocher la tête, sauter de joie, saluer, reculer, trembler) ; **bulles de pensée** avec une image (le trésor promis par Garrick, le shop qu'il imagine) ; une ombre au sol sous chacun ; intro : les pieds sur la berge puis sur le chemin, **Garrick blessé** (bandage, sang, manteau déchiré) au sauvetage puis guéri au retour, il te regarde pour te remercier puis repart de l'autre côté ; rénovation et faillites jouées de la même façon ; **le mannequin offert par Garrick** le matin de la première pièce d'armure (il explique qu'il faut retrouver toutes les pièces, une par contrée ouverte) ; **baluchon HD** porté sur l'épaule, qui rebondit à chaque pas ; les PNJ regardent où ils marchent ; promenade : la fenêtre ne fait que montrer la rue, on sort par la porte, la bougie est posée sur le plateau, un banc dans la rue, un chat rare qui marche vraiment, s'assoit sur le banc ou chasse une souris ; musique des cinématiques deux octaves plus bas (ocarina plus rond) ; **bruitages mesurés et équilibrés** par famille (et un vrai bruit quand on pose un objet dans le baluchon) ; conseil de Garrick visible sur la carte ; enseigne de la façade et parchemin du crieur qui manquaient parfois ; sur téléphone : rendu plus léger et carnet de bord du lancement (après un plantage, le jeu dit où il s'est arrêté) ; **le jeu ne gèle plus** sur une erreur (la boucle de Phaser est protégée, l'erreur est notée) ; les pièces d'armure récompensent une **contrée conquise** (plus de pièce au jour 2 sans raison) ; les contrées des Bannis n'apparaissent que le lendemain de la première descente au marché noir ; marché : étals vus de près bien rangés, **fontaine vue de près** (la pièce lancée, la gerbe, la pièce qui coule), le mendiant de près avec Brisquet qui mange, les passants qui parlent ; récits : **le ravin** (falaises, rivière ou gouffre, grappin, balancement, chute) ; planche test des contours : **B** choisi (contours marqués, hauts de crâne arrondis). |
| 9½e ✅ | **v 0.59 — Récits mis en scène + audit des gels** (planche : docs/planches-v059/) | Chaque sorte d'épreuve est jouée comme une petite scène, au niveau du ravin : la scène s'installe pendant qu'on lit, l'objet sert vraiment (torche qui perce le noir, flèches, bouclier, amulette...), l'issue suit le texte (la bête fuit ou tombe, les brigands volent ou jettent à l'eau) ; décors choisis selon le texte (crypte, mine, trône, momies, bibliothèque, quai, oasis...). Audit des gels : carte inerte après un dévoilement interrompu (le gel du jour 2), marché noir sans sortie à la 2e visite, chargement au même lieu, Passer pendant les fondus, promenade, fontaine et Brisquet bloqués. **Plus tard** : peaufiner le design des ennemis (bêtes, monstres, esprits). |
| 9½f ✅ | **v 0.60 — Équilibrage** | Loyer hebdomadaire au bourgmestre (20 p. + 15 p. par palier de réputation), alerte le soir quand la nuit va prélever plus que la bourse (faillite), fournitures de l'atelier (20 % de la valeur gagnée par la réparation), revente des vêtements à moitié prix chez Marcelline, hasard du jour fixé par une graine (recharger ne change plus les clients), Fil-de-Fer triche au bonneteau, un blessé revenu de mission rapporte moins de réputation et part en convalescence s'il n'est pas soigné, bilan des employés au bureau, deux clients minimum les premiers jours. **Plus tard (avec 10a/10b, les armes)** : de nouveaux matériaux plus chers (acier, mithril, cuir de wyverne...) qui vont avec les nouvelles armes, plutôt qu'une hausse des prix du fer et du cuir. |
| 10 ✅ (v 0.61) | **Profondeur : héros, ombre et lumière, Main Noire** | **10-1 Héros exigeants** : vétérans, héros et légendes refusent le plus souvent les missions trop faciles (ils acceptent très rarement), demandent des contrées à leur mesure, et reviennent parfois avec une **quête personnelle** (venger un frère d'armes, retrouver une relique) plus dure, mieux payée, racontée. **10-2 Morts voulues visibles** : la gazette du lendemain annonce le décès, la Faucheuse laisse un objet sur le comptoir qui s'accumule (pétale noir, plume, sablier...), le reflet du joueur dans la vitre s'assombrit à chaque âme. **10-3 Ombre et lumière** : quêtes de lumière = plus de réputation et gratitude des villages (cadeaux en nature) ; quêtes d'ombre = plus d'or et objets interdits, mais la garde rôde ; récits de fin et compagnons propres à chaque camp. **10-4 Main Noire façon mafia** : le **pizzo** (un collecteur passe chaque semaine prendre sa part ; sinon vitrine cassée, client disparu, incendie à l'atelier), les **services** (cacher un colis, écouler du volé, prêter un aventurier) qui effacent la dette mais penchent vers l'ombre et attirent la garde, les **rangs** (débiteur → associé → lieutenant, qui prête lui-même), la bande rivale **le Serpent à deux têtes** dirigée par deux chefs, et **la sortie** (racheter sa liberté très cher, ou dénoncer la Main Noire à la Confrérie : une fin propre). **10-5 Textes** : les 8 suggestions du rapport (remerciements variés, retour selon la contrée, conteur expressif, conclusion par quête, carnet des morts, compagnons visibles, carnet des choses étranges, ton Comté). **10-6** : une pièce d'armure par **royaume** libéré (toutes ses contrées conquises ; 8 royaumes, 8 pièces : Aube-Lame quitte l'armure), et une **arme légendaire** par royaume, accrochée au mur de la chambre (+0,1 client par jour chacune) : Pique-Bourdon (Comté), Aube-Lame (Hommes), Brise-Montagne (Nains), Chant-de-Lune (Elfes), le Bâton des Sept Étoiles (Mages), Souffle-de-Bambou (Pandas), Croc-de-Wyverne (Terres sauvages), la Lame sans Nom (Bannis). La Citadelle et Hautgarde (forts de la Confrérie) ne comptent pour aucun royaume. |
| 10½ ✅ | **v 0.62 — Grand ménage** | Simulation des règles sur des milliers de jours (stratégies lumière, ombre, Main Noire, neutre, conquête) et partie automatique longue ; relecture de tout le code de l'étape 10. Corrigés : registre qui plantait avec une visite (garde, collecteur, Serpent...) dans la file ; anciennes sauvegardes qui recevaient des pièces d'armure en double ; rachat de liberté qui laissait la dette ; colis de la bande que la garde ne pouvait jamais trouver ; détour pour la bande qui comptait dans la commande et rendait une mort « voulue » ; bande dénoncée qui revenait le jour même ; chez le Serpent, c'est Corvin qui collecte ; plus de prêt de la Main Noire après en être sorti ; quête personnelle périmée ; doublons du carnet des choses étranges ; souvenirs de la Faucheuse sur leur propre plateau (ils cachaient les décorations) ; pièce et arme du matin invisibles le soir ; double clic à la garde-robe ; police des boutons qui restait petite ; parchemin du messager agrandi si besoin ; textes (« 2 bandagess », « de la part de L'Abbaye », « te glisse fiole de poison », accords). **Rythme de l'armure** : avec un joueur qui vise les royaumes, 1re pièce vers le jour 11-12 et 7 royaumes sur 8 en 120 jours ; sans viser, beaucoup plus lent (à surveiller). |
| 9+++++ ✅ | **v 0.56** | **Garrick** redessiné en rôdeur (cheveux longs bruns, barbe nette, justaucorps sombre, long manteau olive, chemise bordeaux, baudrier, épée, pendentif fleur de pommier) avec sa **pipe** ; même teinte de peau en buste et en pied. **Nuages** gris et lourds sur les contrées pas encore ouvertes, qui s'écartent au dévoilement. Emblème des trolls sur fond brun. **Degrés de la Faucheuse** : le mal compte plus à mesure qu'on s'attache à elle ; à « Éprise », elle réclame un habitué ami (prime double, refus plus cher). **Les aînés des Bannis** (un par peuple : Grand-mère Ortie, Gromak le Vieux, Aïeule Lunegrise, Sévérin l'Ancien, Ankhar le Scribe, le Vieux Moussu) : très rares au comptoir à partir du jour 30, plus souvent au marché noir où l'on écoute leur **récit-cinématique** (buste, tableau du souvenir qui se colore, 5 pages) ; skins vieux (cheveux gris, rides, canne, fourrure blanchie, momie moisie avec sa toile d'araignée), **voix fatiguée** (lente, étouffée, chevrotante, avec des souffles). **Nouvelle musique du marché noir** : sombre et mystérieuse, rien que des graves (bourdon, contrebasse pincée, violoncelle), avec les gouttes, le cœur et les pièces. **L'ocarina remplace le célesta** (trop strident dans l'aigu). **La faillite devient dramatique** (cuivres, cordes en trémolo, orgue, timbales). Planche des sons : une page pour écouter musiques et voix. |
| 9¾ (en partie) | **Construire le récit tranché** | **Faits** : skin de Garrick, degrés de la Faucheuse, aînés (v 0.56), voix de la Faucheuse. **Reste** : une voix propre à Garrick (il parle encore avec la voix humaine commune) ; l'Antre ★6 cachée (l'Antre actuelle est ★5, dans les Terres sauvages) ; le système de combat au tour par tour ; les fins (amère, cachée, et la fin neutre décidée en lumière/ombre). Gardé pour l'arc final (étapes 13–15), sauf la voix de Garrick qui peut venir avant (voir « Le grand retournement »). |
| 9¾ bis (en partie) | **Trancher le reste du récit** | **Tranché le 15/10** : Main Noire, Faucheuse, armure, Bête/Antre ★6, noms, aînés ; fins amère et cachée (à détailler). **Encore ouvert** (docs/audit-v054.md) : le sort d'oubli (qui y échappe, comment il se brise), le Sage (nom, visage, apparition avant la fin), les pandas (neutres ? alliés qui doutent ?), Garrick après le jour 56 (selon ton camp ?), le mendiant (quelqu'un du passé ?), et **séparer le camp et la cruauté** (les âmes offertes poussent encore la jauge vers l'ombre) : à trancher avec le système lumière/ombre. |
| 10 ✅ | **Marché noir** | Fait à l'étape 9e (objets interdits, voyageurs nocturnes, conséquences). |
| 10a ✅ (v 0.63) | **Les armes de chaque peuple** (validé) | Chaque peuple a son arme préférée et la demande dans ses commandes ; Thorgal vend plus d'armes ; le **bois** devient un matériau du marché. Recettes et liste : voir « La forge » plus bas. |
| 10a½ ✅ (v 0.64) | **Des vêtements vivants + ménage** (validé) | Comme pour la Main Noire et le Serpent, tous les habits prennent des plis : au buste, plis de tension sous les aisselles, coutures d'épaules piquées, emmanchures froncées, tissu qui ondule, manches plissées ; en pied, fronces au coude et au genou, plis vers la ceinture, robes, tuniques et capes qui retombent en plis droits (le tablier du marchand reste raide). Chaque personne a ses plis à elle (tirés de son nom). Ménage : tests, simulations longues, partie automatique, relecture du code des armes ; ~550 lignes de l'ancien moteur retirées. Corrigés : seule l'épée s'usait (les autres armes étaient inusables) ; la réserve du soir sortait de l'écran (armes sur une ligne) ; chaque sorte d'arme comptait dans la variété du stock (elles comptent pour une) ; l'ardoise pouvait cacher une arme du baluchon et montrer un mauvais « en plus » ; armes des peuples de l'ombre absentes chez Thorgal alors que ces peuples venaient déjà ; l'épée fêlée et les sabotages de la Faucheuse ne marchaient plus qu'avec les humains ; achat chez Grippesou qui ignorait l'arme déjà donnée ; râtelier vide qui débordait ; pénurie de fer étendue aux armes de fer ; le bois affiché au marché. Planches : `docs/planches-v059/5-plis-vetements.jpg`, `5b-plis-zoom.jpg`. |
| 10c (v 0.65, planche à valider) | **La rue et le chat** | Le soir, « Dehors » devient toute la rue (trois écrans, la caméra suit) : maison des voisins, l'impasse du marché noir (sa lanterne rouge brûle les soirs où la porte dérobée s'ouvre : on y entre), la forge de Thorgal (braises derrière les vantaux), ton shop, une autre maison, la fontaine, la Banque Centrale Goyenne (on y entre), l'arche du Marché des Mastres ; réverbères et fenêtres éclairées. **Le chat de gouttière** : certains soirs (dès le 3e) il attend devant ta porte ; une ration par soir, trois soirs, et il te suit ; au premier bain on choisit son pelage (6), ses yeux (4), son collier (5) et son nom (collier et nom changeables ensuite). Il te suit pendant la promenade et dort en boule sur le coussin de l'arrière-boutique. Sans lui, des rats grignotent parfois rations et gourdes ; avec lui, plus de rats, une souris sur l'oreiller de temps en temps, et la veille d'une fouille il crache vers la porte (3 fois sur 4) : on peut alors tout cacher sous le plancher (la fouille ne trouve rien, l'amende reste). Planches : `docs/planches-v059/6-rue-et-chat.jpg`, `6b-adoption.jpg`. Retouches (17/10) : l'impasse devient une vraie ruelle en perspective entre les deux voisins (plus de murs collés), arche aux piliers coiffés et au faîte arrondi, détachée de la banque, et un nom sur chaque bâtiment (écriteaux, lettres gravées, bannière). **La rue de jour** : au réveil on sort dans la rue (forge ouverte et ses étincelles, passants), l'arche mène au marché, « Rentrer chez toi » depuis le marché ramène à pied par la rue ; raccourcis « Au marché » et « Chez toi » ; on entre à la banque. Planche : `6c-rue-jour-nuit.jpg`. |
| 10c+ (v 0.66, planche à valider) | **Retouches de la rue, logo, cheminée** | Le marché vu par l'arche est garni (le jour : maisons de la place, guirlandes de fanions, étals rayés, foule, caisses ; le soir : étals bâchés, fenêtres éclairées, une lanterne). L'impasse est fermée par deux piliers de pierre reliés d'une poutre où pend l'écriteau. **Le logo de la Banque Centrale Goyenne** (dessiné par le joueur : l'inquisiteur barbu à capuche et monocle d'or sur son tas de pièces) est sur le fronton et brodé sur les bannières de la banque. **La cheminée** : la souche de la chaumière descend jusqu'au toit (elle ne flotte plus) ; dans la chambre, une cheminée de pierre (le coffre passe au pied du lit) ; le soir, une planche de bois pour l'allumer (lien dans « Ta réserve » ou en cliquant sur la cheminée pendant la promenade) : les flammes éclairent la chambre même bougie soufflée, la fumée monte du toit (le soir, et encore le lendemain matin), et la nuit au chaud donne +15 % de chances d'être en forme au réveil ; le chat dort devant les braises. Planche : `6d-retouches-rue-cheminee.jpg`. |
| 10c++ (v 0.67, planche à valider) | **La nymphe de la fontaine** | D'après le dessin du joueur (cinq états, de l'eau à la femme presque humaine). Après **5 vœux** (une pièce par jour dans la fontaine du marché), puis **tous les 10 vœux**, le soir : « ✨ Une lueur bleue monte de la place du marché » dans le bilan du soir, et l'arche de la rue luit en bleu (des gouttes de lumière montent par-dessus les toits). On y entre : **cinématique** sur la grand-place endormie — la fontaine s'allume, l'eau se lève (jet, colonne qui prend une tête, silhouette couronnée, sceptre de cristal levé), puis **Ondine** apparaît : peau pâle, cheveux vert d'eau emportés comme un courant, diadème d'or, robe dont le bas reste de l'eau. Elle **bénit** les aventuriers 7 jours (+15 % aux épreuves de rivière et de marais, et à celles où il faut une gourde), offre la première fois le **Coquillage de la nymphe** (décoration rare, +0,3 client/jour, jamais en vente), et en dit un peu plus à chaque visite sur ce que l'eau se rappelle : des villages vidés puis effacés des cartes, un **sort d'oubli** qui « ne tient pas sur l'eau », des Bannis qui n'ont pas toujours été bannis. Puis elle redevient eau. Planche : `6f-nymphe.jpg`. |
| v 0.68 (planche à valider) | **Retours du joueur (17/10)** | **Dialogues façon Pokémon** : le texte s'écrit lettre après lettre avec un petit « bip » (cinématiques, comptoir, conseils de Garrick) ; un clic affiche tout, le suivant fait avancer. Conseils de Garrick plus lisibles (police plus grande, plus foncée, droite). Fin de la rénovation : Garrick parle dans la boîte de dialogue habituelle (plus de bulle d'un autre style). Les cases de dialogue disparaissent avec le fondu au changement de scène (carte, récits, retours au comptoir). **Plus aucun émoji** : pictogrammes en pixel art (colère, larme, idée, étincelle, main qui salue, balai, épées / lettre / crâne de la carte, étoile de réputation, son coupé) et textes sans émojis. **Marché** : bouton « Voir l'étal de près » en plaque de bois ; vue zoomée avec ta bourse, « tu en as N » sous chaque article, flèches (et ◀ ▶) pour passer d'un étal à l'autre, une lueur derrière chaque article ; l'épée toujours en vente chez Thorgal ; les étals en travaux n'ont plus de nom (surprise), et de rares passants en murmurent des indices ; la gazette ne dit plus la veille ce qui ouvre. **Le mendiant** : de près, en entier (plus de buste qui flotte) ; les pièces volent jusqu'à sa sébile et il pense à ce qu'il en fera (bulle de pensée : du pain, un cœur, Brisquet) ; même bulle pour Brisquet nourri et le chat de gouttière ; un soir sur quatre, il est au marché noir (avec Brisquet) et y parle à demi-mot. **Le baluchon** : le client le prend par le bâton, le lève à côté de lui, se retourne, et part le bâton à la main sur l'épaule, la poche dans le dos qui se balance à chaque pas. **L'armoire de la réserve** (promenade) : fermée par défaut, un clic l'ouvre. **Création du perso** : la couleur des yeux se voit, et on choisit la couleur des bottes. Le chat vu du comptoir est à la bonne échelle ; sortir de la banque ramène dans la rue ; toute l'arche du marché se clique. Planche : `7-retours-v068.jpg`. |
| v 0.69 (planche à valider) | **Récits, comptoir, persos assis** | La rivière du ravin fait partie du décor : elle passe derrière les falaises, dans leur ombre, et s'efface avec le plan (elle traînait à l'écran). Les yeux dans la nuit sont de vrais yeux en amande qui luisent, avec une pupille fendue, et qui clignent (on les prenait pour des baies). **Comptoir, page 2** : un onglet ▶ 1/2 tourne la page de la marchandise ; la page 2 range chaque arme dans sa case ; l'onglet bat quand l'arme que veut le client est rangée là. **Pose assise** (moteur des corps) : on s'assoit sur le banc de la rue pendant la promenade (un clic ailleurs pour se relever), et le jour des passants s'y reposent (un clic : ils parlent). Planche : `8-recits-comptoir-assis.jpg`. |
| v 0.70 | **La malle à vêtements, l'étal de Thorgal** | Le coffre au pied du lit devient **ta malle à vêtements** (validé le 17/10) : ce que tu as acheté chez Marcelline y dort ; un clic pendant la promenade l'ouvre, et l'on choisit ce qu'on porte (Porter / Ranger) — l'aperçu et ton personnage changent tout de suite. Posséder et porter sont deux choses distinctes (les effets ne comptent que si tu le portes) ; revendre retire de la malle. L'étal de Thorgal sur trois colonnes dit maintenant, comme les autres, « tu as N » et « N en vente ». |
| v 0.71 | **Nouvelle fumée, nouvelle eau** (validées le 17/10 ; le feu garde son dessin, à améliorer plus tard) | Particules CC0 de Kenney ramenées à notre grille et à notre palette (`assets/fx`, `docs/essais-assets`) : la fumée de la cheminée monte en vraies bouffées qui s'élargissent et dérivent ; les éclaboussures (pièce dans la fontaine, chutes dans l'eau des récits, Garrick qui sort de la rivière) ont une couronne de jets, des gouttes en cloche et des ronds. Au comptoir, la ligne d'arme dit « (ou une autre arme) » : n'importe quelle arme remplit la commande, celle du peuple du client donne un petit bonus. |
| v 0.72 | **Grippesou t'accueille à bras ouverts** (validé) | À l'Express, le gobelin est maintenant de face, les bras levés en V grands ouverts, les jambes bien campées, un large sourire sans froncer les sourcils, et il sautille d'impatience : il sait qu'il va faire affaire. Nouvelle pose « accueil » du moteur de corps, réutilisable pour d'autres PNJ. |
| v 0.73 | **Le sourire du Grinch, narrateur et paroles séparés, plus de vert sur vert** (validés) | Grippesou t'accueille avec un sourire immense façon Grinch (un croissant de dents qui remonte jusqu'aux joues). Chez le mendiant, la bulle ne contient plus que ses paroles ; ce qui se passe (le chien qui mange, le trèfle) est raconté à part, dans un bandeau sombre de narrateur. Sur les étals zoomés, le nom et « tu en as » sont posés sur une plaque sombre (plus de texte vert sur la toile verte) ; les onomatopées vertes des récits en forêt et au marais passent en tons chauds. |
| v 0.74 | **Le tableau d'affichage du marché** (design validé le 18/10) | Un panneau de bois sous un petit toit, à côté du crieur (la rue s'élargit un peu pour lui). Un « ! » au-dessus quand il y a du neuf (événement qui commence ou finit, nouvelles têtes mises à prix le premier jour de la semaine). De près : **la Gazette des Mastres** (les nouvelles du jour, sans le papier du marché noir), **l'Avis à la population** (événements en cours et à venir) et **trois avis de recherche façon primes de pirates** (« AVIS DE RECHERCHE », portrait sépia, « MORT OU VIF », nom, prime en gros chiffres, le crime). Huit bandits tournent chaque semaine ; plus un bandit reste affiché, plus sa prime grimpe (+20 % par semaine). Un clic sur une affiche la décroche pour la lire en grand. Prochaine étape (lot A) : un visage recherché peut venir dans la file (lumière : le dénoncer pour la prime ; ombre : le cacher). |
| v 0.75 | **Des bandits reconnaissables** (validé le 18/10) | Chaque tête mise à prix a ses signes distinctifs, pour la reconnaître au premier coup d'œil (et plus tard dans la file du comptoir) : cache-œil (Rufus, Snik), cicatrice cousue sur l'œil (Mélisande, Grok), balafre sur la joue (Bartok, Grok, Brumos), dent en or (Rufus, Grok), anneau d'or à l'oreille (Mélisande, Yara, Snik), larme tatouée (Yara), bandana rouge de pirate (Bartok, Brumos), monocle cerclé d'or (Vorag). Planche : `avis-recherche-visages.png`. |
| v 0.76 | **Les étals changent chaque matin** | Le joueur comprend que le marché tourne (décidé le 18/10 : on garde le tirage des armes tel quel) : Garrick le dit dans son conseil du marché, chaque étal zoomé le rappelle en bas (« Les étals changent chaque matin » ; chez Thorgal : « il ne sort que quelques armes chaque matin »), et les marchands le glissent parfois dans leur bulle. |
| v 0.77 | **Les deux contrées ★1 dès le jour 1** (option A, choisie le 18/10) | Les Vergers de Bourg-Joyeux ne demandent plus de réputation : ils s'ouvrent dès le premier jour avec les Collines de la Comté, puis les ★2 arrivent au jour 2. Plus jamais une ★1 après une ★2. |
| v 0.78 | **Des récits différents d'une destination à l'autre** (planche 11 : principe validé le 18/10, à détailler davantage) | Le ciel, le sol et les couleurs restent ceux du royaume (on sait toujours où l'on est), mais chaque destination a ses arbres, un repère au loin, ses détails au premier plan et ses bêtes (`recitVariantes.js`) : Collines (meules, moutons), Vergers (pommiers chargés, moulin, pommes au sol, abeilles), Vallon (saules, chaumière des guérisseuses, fleurs médicinales, papillons), Abbaye (cyprès, clocher, lavande, colombes), Forêt des Murmures (grands chênes, champignons, fougères, un cerf), Pont des Trolls (sapins, le pont de pierre, corbeaux), Chamans (totems, crânes et plumes, lucioles), Mines (chevalement, wagonnet, chauves-souris), Khaz-Durim (la porte naine dans la montagne, braises), Sanctuaire (bouleaux, arches elfiques, fleurs luisantes), Lac des Lunes (le lac et son reflet de lune, roseaux, poissons qui sautent), Opale (flèches de cristal, étincelles), Bibliothèque (la tour aux fenêtres éclairées, pages au sol, livres qui volent), Terres Désolées (cactus, squelette géant, vautours), Tombeaux (colonnes brisées, pyramide, poteries), Fort des Orcs (pieux, palissade, corbeaux), Mines Rouges (échafaudages, pierres rouges, braises), Pics Gelés (sapins, aigle), Col des Hurlements (cairn et fanion, corbeaux). Planche 10 : les provisions redessinées en 32 × 32. |
| v 0.79 | **Les nouvelles provisions dans le jeu** (planche 10 validée le 18/10) | Ration, gourde, flèches, potion, bandages, torche, corde, antidote, cape chaude, bouclier, amulette, fer, cuir, bois et fil d'or sont dessinés en 32 × 32 et affichés à la taille des anciennes icônes : deux fois plus de détails partout (étals, comptoir, commandes, récits). Les armes gardent leur dessin. |
| v 0.80 | **Des repères peints en pixel art** (planche 11 v2 validée le 18/10) | Les repères au loin des récits ne sont plus des silhouettes pâles mais de vrais dessins dont on voit les matériaux (`reperesHD.js`) : la pyramide en gradins de blocs de grès, son pyramidion doré, son obélisque gravé et ses colonnes ; le fort des orcs en rondins taillés en pointe, liés de fer, avec sa tour de guet, sa bannière rouge au crâne, des crânes sur des piques et des torches ; les Mines Rouges avec leur paroi sombre veinée de minerai qui luit, l'échafaudage, la poulie et son seau, les chariots de minerai, les lanternes ; la porte de Khaz-Durim en bronze et runes d'or entre deux rois nains de pierre, avec ses braseros ; le moulin de pierre et ses ailes de toile ; la chaumière en torchis et colombages, au toit de chaume, et son jardin de simples ; l'abbaye, sa rosace et son clocher ; les meules de foin et une porte ronde de hobbit ; le vieux chêne creux et la cabane de rondins du bûcheron (hache plantée dans la souche) ; le pont de moellons, sa mousse, le panneau du péage et des os sous l'arche ; les totems peints, à plumes, et la hutte de peaux ; le chevalement de mine, sa roue, son câble, l'entrée étayée et le wagonnet ; les arches de marbre et l'arbre argenté ; le lac, son ponton et sa barque ; les tours de cristal d'Opale reliées par des ponts ; la tour de la Bibliothèque et ses livres qui volent ; le squelette géant à demi enfoui ; la tour de guet naine enneigée ; le cairn, ses fanions de prière et le chariot renversé. Le fort et les mines se détachent maintenant du fond rouge. |
| v 0.81 | **Elfes majestueux, mages plus riches, lieux qui font peur** (planche 11 v3 validée le 18/10, sauf deux retouches faites en v0.82) | Demandes du 18/10. **Sanctuaire des Elfes façon Lothlórien** : un mallorn géant au tronc d'argent, trois étages de feuilles d'or en touffes, un talan blanc et sa maison aux fenêtres de lumière, l'escalier qui tourne autour du tronc et ses lanternes, des lueurs bleues qui flottent, d'autres mallorns autour. **Lac des Lunes façon Fondcombe** : la vallée entre des falaises à strates et leurs sapins, trois cascades, la maison en terrasses de pierre claire aux fenêtres en arc dorées, deux tours fines, un pont en arches, des arbres d'automne. **Cité d'Opale** : un rempart de cristal et sa porte d'or, une forêt de flèches et de coupoles, la grande tour et son anneau d'or qui flotte, des éclats de cristal suspendus, des ponts de lumière. **Bibliothèque** : la grande tour et ses contreforts, deux tourelles, l'escalier qui s'enroule, un livre géant ouvert qui flotte au sommet, des rochers enchaînés, des piles de livres ; les livres qui volent ont maintenant une couverture et des pages. **Terres Désolées** : trois carcasses (le grand squelette, une petite cage thoracique, un crâne cornu sur une pique), des os partout, deux vautours perchés et trois qui tournent dans le ciel. **Col des Hurlements** : un ciel lourd, des crocs de roche noire, une lune pâle, deux loups noirs qui hurlent sur l'éperon, des arbres morts tordus, des crânes sur des pieux, une bannière déchirée, le vent qui siffle. **Pics Gelés** : une aiguille de roche immense, la tour naine perchée tout en haut, un pont de corde vers un autre pic, une mer de nuages en dessous, des stalactites de glace, une bannière gelée tendue par le vent, le blizzard. **Les arbres du plan moyen sont peints** eux aussi (pommiers, saules, cyprès, chênes, sapins enneigés, mallorns, arbres d'automne, cactus, colonnes, pieux). |
| v 0.82 | **La forge chez soi (10b, planche 12 validée le 18/10 ; Baba aux cheveux courts)** | Au lendemain du saut d'un an (★3), Garrick propose la forge ; on la construit (300 p.) depuis l'arrière-boutique ou le bureau (nouveau tiroir « La forge »), les ouvriers la montent la nuit. **Aldo** (apprenti humain, 6 p./nuit, une arme toutes les deux nuits, puis compagnon après 8 armes et ouvrier confirmé après 20) et **Baba Marteau-d'Or** (maîtresse naine du sud, khôl et anneau d'or au nez, 12 p./nuit, 2 armes par nuit, dès ★4) en tablier de cuir. Le soir, on clique sur les armes à forger (recettes validées ; les matériaux sont pris tout de suite, on peut vider la commande) ; elles sortent la nuit et arrivent sur le râtelier, avec parfois du **bel ouvrage** (30 % pour Baba, 8 → 24 % pour Aldo) : il brille sur le râtelier, s'use deux fois moins vite et donne +1 relation. **Thorgal vend en gros** à qui a une forge (lots de 5 fer, cuir ou bois à −30 %). **Côté ombre**, la forge fabrique la lame empoisonnée (dague + poison), la lame de lune noire (2 fer + poudre de lune noire) et les griffes de l'ombre (griffes + passe-partout), que les Bannis commandent au marché noir (le Passeur n'en vend pas). Retouches de la planche 11 : les falaises de Fondcombe ont un bord extérieur naturel ; le pont des Pics Gelés arrive sur un ponton calé au sommet du pic de droite. |
| v 0.83 | **Contrôle complet (pendant le trajet du joueur)** | Correctif urgent : en v0.82, le tablier de cuir du forgeron faisait planter le dessin du joueur (promenade, intro, comptoir…) ; réparé. Le tiroir « La forge » du bureau était caché derrière « Fermer » : les 8 tiroirs sont resserrés. La phrase du chantier de la forge a un bandeau sombre (elle passait sur la hotte). La carte du matin, une fois fermée, gardait un écouteur de caméras qui pouvait planter et figer le jeu : il est retiré à la fermeture. Vérifié : audit des cas difficiles (marché noir, passer, dévoilement, fontaine, chien, promenade, intro, faillite, chargement), parcours de la forge (arrière-boutique, bureau, promenade, lots de Thorgal), nuits de forge (Aldo, Baba, bel ouvrage, armes de l'ombre), 17 écrans, 10 décors de récit, simulations longues et joueurs au hasard : aucune erreur. |
| v 0.84 | **Le lot bêta (retours des amis testeurs, 19/10)** | **Bugs** : la banque figeait le jeu (ouverte le soir après une visite de jour, « Quitter » rouvrait la rue et laissait le soir en pause : chaque page relancée repart maintenant de ses propres données) ; un prêt pouvait se prendre tout seul en entrant (la banque n'écoute qu'après un court instant, et un prêt se signe sur une fiche « Signer / Non merci ») ; le conseil de Garrick se ferme d'un clic n'importe où (ou Entrée, Espace, Échap) ; au marché noir, on ne pouvait pas le fermer du tout (la caméra de la cave a défilé et les clics tombaient à côté) : les conseils s'affichent maintenant dans le calque du bandeau, qui ne bouge jamais ; les musiques de la banque, de l'Express et de la forge s'arrêtent quand on les quitte (la page d'en dessous reprend la sienne) ; les étals de Firmin et Marcelline ne se chevauchent plus ; Ysolde et les magiciennes ont une frange et deux longues mèches sous le chapeau ; « saine et sauve ». **Confort** : ta dette en gros à la banque ; plus de confirmation pour les objets en plus (« offert » est dit) ; refuser un client qui a déjà des objets, ou l'envoyer sans rien, demande confirmation ; une grande alerte « il te manque N pièces » ; l'étagère dit « 20 → 30 places (+10) » ; les rangs s'écrivent « Aguerri · rang 2/5 » avec ce qu'ils changent ; au marché, on rachète en cliquant sur une ligne (vue mi-zoomée) et de tout près on voit les commandes prévues (« prévu : 2 » sous chaque article, et le panneau des lettres) ; ta réserve chez le colporteur ; potions revendues après un récit à ×1,1 ; « bourgmastre » ; une musique triste pour le récit d'un héros mort ; un marteau ⚒ qui bat sur la ligne d'un objet à réparer ; une fine bande lumière ⟷ ombre sous le bandeau, avec « +N lumière / ombre » et une annonce quand un palier change. **Planches à valider** (non publiées) : le curseur (épée, plume ou flèche, et la main gantée), la carte de progression façon RPG au retour, la fiche de mission (au choix avec la cinématique, après un premier récit), la porte de derrière de l'arrière-boutique vers la rue. |
| v 0.85 | **Grand ménage** | **Portes** : la porte d'entrée a quatre visages selon la façade (les mêmes dehors et dans l'arrière-boutique), plus grande que celle de la chambre. **Rue** : les passants parlent quand on clique dessus (nouvelles du jeu ou petites phrases drôles). **Rats** : un réveil avec une phrase variée (« quand le chat n'est pas là, les souris dansent »...). **Magiciennes** : le chapeau couvre bien la tête, la pointe ploie sans se couper. **Textes** : une trentaine d'accords corrigés (aventurière ou joueuse : « remise d'aplomb », « réveillée », « prête », « têtue, petite marchande » ; refuser ou envoyer une cliente : « la », « elle », « fâchée », « vivante » ; objets : « le sien est cassé », « Retires-en une », décorations et vêtements accrochés, revendus, portés au bon genre) ; « 1 partie restante » ; « le récit d'Aldric » (et non « de Aldric ») partout ; « de la Comté » ; « Brèche-Haute » ; « le nom de ton comptoir ». Le registre compte les vrais clients servis (l'expérience monte aussi la nuit). **Placement** : les titres de la forge et de la carte ne passent plus sous les plaques du jour et de la réputation ; la bourse de la vitrine n'est plus sous le bouton des commandes. Tests : règles, héros, Main Noire, simulation longue, tous les écrans, fuzz : 0 erreur. |
| v 0.86 | **Lot A « Le comptoir sous pression »** | **La journée** : une horloge au coin de la fenêtre (un petit cadran où le soleil tourne, l'heure, la course de 8 h à 18 h) ; servir prend 1 h (¾ h puis ½ h avec l'expérience), écouter un récit ¼ h, une visite ¼ h, passer chez Grippesou ½ h ; un sablier sur le coin des boutons ; le ciel rougit dans l'heure qui précède la fermeture ; à 18 h (½ h plus tard par niveau d'éclairage), une fiche : ceux qui t'avaient écrit reviennent demain en tête de file, les imprévus repartent, le colporteur remballe ; les retours de mission et les visites passent quand même. **Les recherchés** (dès la semaine 2, environ un par semaine, jamais le même jour) : une tête de l'avis de recherche entre... ou un honnête voyageur qui lui ressemble (un signe en commun) ; l'avis s'épingle sur l'ardoise pour comparer ; ☀ appeler la garde (ta part de la prime, réputation +1, lumière ; un innocent : réputation −2), ☾ le cacher derrière (ombre, un objet interdit sous le buffet ; la garde passe le plus souvent ensuite : mentir ou le livrer), le servir, le renvoyer ; au tableau du marché, un tampon « CAPTURÉ ». **Les imposteurs** (dès le jour 5, environ un client sur douze) : un faux héros, une fausse pèlerine, un faux neveu, un espion d'un marchand rival ; et des clients honnêtes qui ont l'air louches (l'héritier à l'armure neuve, le conteur, le vétéran rapiécé, le timide) ; « Inspecter » : observer (¼ h, ton flair choisit ce que tu vois) ou fouiller son sac (tout de suite, mais un honnête se vexe) ; une fiche d'indices et une jauge « louche » ; un imposteur refusé ou fouillé file (ton flair grandit) ; servi, il disparaît avec le baluchon et on apprend le lendemain ce qu'il en a fait. **Le marchandage** (dès le jour 3) : « Marchander » sa part du butin (20 %, puis +5 % par demande, ½ h) ; une jauge de patience ; il cède sous sa limite cachée, refuse au-delà, part fâché s'il n'a plus de patience ; ses tics trahissent qu'il a de la marge (ton flair les voit mieux) ; chaque peuple a son style (le hobbit pleurniche, le nain respecte qui tient bon, l'elfe s'impatiente, l'orc menace, le gobelin bluffe toujours) ; les trouvailles après le récit se marchandent aussi (−10 % par demande, jusqu'à son plancher, sinon il remballe). **Narration** : quand c'est le jeu qui raconte, une plume remplace le nom, le texte est en italique violet sur un parchemin plus pâle. |
| v 0.87 | **Campagne de tests (6 h)** | Parties automatiques à travers tous les écrans (jusqu'à 60 jours d'affilée, avec et sans ouvertures de pages en plein service), fuzz sur 16 graines, relecture du code et des textes du lot A. **Bugs corrigés** : une page fantôme (sans caméra) pouvait rester ouverte par-dessus les autres si l'on ouvrait la banque, l'atelier ou la promenade pendant le fondu du coucher (on ne reprend plus une page qui n'était pas en pause, et la nuit n'ouvre plus de page pendant un fondu) ; cacher un bandit puis le livrer rapportait deux fois de la lumière ; un recherché pouvait entrer alors qu'il était en mission, mort, ou déjà dans la file ; un sosie pouvait porter le nom d'un client du jour ; les clients reportés au lendemain pouvaient être tirés une seconde fois ; la prime de la garde entre dans les comptes ; le bouton de la garde restait affiché après la réponse ; la plume de la narration restait sous l'ombre de la Faucheuse ; le verdict du flair suit le prix marchandé. **Textes** : accords au féminin (inconnue, cachée, vue, « marchande », « dure en affaires »...), lieux réels (abbaye de Clairval, taverne de Bourg-Joyeux, marché noir), « Sire Aldric servi » et non « Sire servi », la marque du bandit nommée (« cette balafre »...), « Il n'est que 14 h : tu peux fermer plus tôt » quand la journée finit tôt. **À noter** : dans toutes les parties automatiques, la fermeture de 18 h n'a jamais été atteinte (servir va vite : 1 h puis ½ h) ; la pression du temps ne vient que de l'Express, du marchandage et de l'inspection. |
| v 0.88 | **La journée plus pleine** | Mesures : le nombre de clients monte (3 → 12 par jour) mais servir accélérait autant (1 h → ½ h) ; les journées finissaient toujours vers 12-15 h. Désormais le comptoir **ouvre à 10 h** (« Dix heures sonnent au clocher ») et servir passe de 1 h à **¾ h au plus vite** (dès 30 d'expérience). Fin de journée attendue : vers 14-15 h au début, 17 h en milieu de partie, 18-19 h en fin de partie (il faut alors choisir entre marchander, inspecter, l'Express... ou laisser repartir un imprévu) ; l'éclairage (jusqu'à 1 h 30 de plus) devient précieux. Les paliers de clients ne changent pas. Le taux d'imposteurs reste tel quel (à revoir avec les retours des amis testeurs). |
| v 0.89 | **Les vieilles sauvegardes remises d'aplomb** | Une partie commencée avant les règles actuelles pouvait garder une pièce d'armure gagnée à l'ancienne (une par contrée ouverte) et voir les terres des Bannis sans être jamais descendue au marché noir. Au chargement, une seule fois : une pièce d'armure par royaume libéré, pas plus (sauf camp déjà scellé) ; les terres des Bannis redeviennent cachées tant qu'on n'est pas descendu au marché noir et qu'on n'y a rien fait (mission, conquête, voyageur en route). |
| v 0.90 | **Lumière et ombre : la balance, le Carrefour, le serment** (planches 16 et 17, validées le 16/10) | **La balance devient un compteur de points** : chaque geste du barème la fait pencher (du plus petit au plus gros : le mendiant une fois par jour, soigner sans faire payer — un nouveau bouton au retour d'un blessé —, dédommager généreusement, une décoration +2, une mission de lumière +3, dénoncer un recherché +4 ; côté ombre, une âme offerte +1, un piège ou un service mafieux +2, une commande des Bannis +2, une mission pour les Bannis +3, cacher un recherché +4), avec le **frein** (×1 jusqu'à 25, ×0,4 jusqu'à 60, ×0,25 au-delà ; revenir vers le centre compte en entier) et un **journal** des derniers gestes. Une vieille partie reprend sa balance là où elle était. **La jauge en dégradé** (le blanc du milieu se fond dans le violet et le jaune, la zone neutre en pointillés, l'ombre à gauche et la lumière à droite partout, bandeau compris). **Le livre des deux voies** au bureau (le prochain palier de chaque côté, le barème, les derniers jours). **Les ☀ / ☾ en pixel art** sur les boutons des choix (appeler la garde, cacher un recherché, rendre un service, dédommager au maximum, soigner sans faire payer, donner au mendiant) dès 40 % de flair, expliqués la première fois. **Le Carrefour** : le soir où la balance atteint 60, la cinématique des deux visiteurs devant ta porte (Sire Aldric et Ilvane), puis la page jour/nuit et ses vitraux ; on ne peut jurer que du côté où l'on penche (le chemin d'en face est barré) ou rester libre ; le camp refusé fait une dernière offre à 90 ; l'autre camp s'ouvre si la balance atteint 60 de son côté. **Le serment** : ×1,5 de son côté ; Confrérie : sa bannière au comptoir, des taux d'ami à la Banque ; Bannis : la Main Noire prête sans intérêts, mais la garde passe plus souvent. **Le parjure** (passer le 1er palier de l'autre côté après avoir juré) : une scène, les avantages perdus, −3 de réputation, ce camp ne proposera plus. **Le sceau** : la dernière pièce n'est plus retenue en zone neutre ; le serment l'emporte ; sans serment et dans la zone neutre, l'armure attend quelqu'un d'autre (la fin neutre, à construire). **Garrick** prévient deux pièces avant la fin de l'armure. (L'armure compte 8 pièces depuis la v0.61 : les textes « 9e pièce » des planches correspondent à la dernière.) |
| v 0.91 | **Retours des amis testeurs (16/10)** | Provisions « fantômes » derrière la page 1 du comptoir ; après la nymphe, on revient dans la rue (on était renvoyé chez soi, d'où le « téléporté au comptoir ») ; la nuit de la fenêtre suit l'horloge ; écriture d'un carnet de mort lisible ; « Le marché » ; « En froid » et « Ennemis jurés » ; pastille rouge du tableau tant que les nouvelles du jour ne sont pas lues ; pensées de JeuneGoy devant le portrait de ses parents ; la règle des trophées dite sur l'étagère ; au marchandage, un client à bout de patience ne part plus qu'une fois sur quatre. Planches 18 à valider : l'enseigne par niveau de maison et sa police, le ciel heure par heure, les ambiances de l'écran titre (page à écouter). |
| v 0.92 | **Le matin, la réserve, Grippesou** | L'arrière-boutique s'ouvre aussi le matin, depuis la maison (« L'arrière-boutique », à côté du marché) ; sur l'étagère, un clic sur une planche permet de **jeter** une provision ou une arme dont on ne veut plus (1 ou tout, au rebut, sans argent en retour) ; à la fontaine vue de près, **très rarement** (1 fois sur 15, au plus une fois par jour, s'il y a au moins 3 pièces au fond), Grippesou vient pêcher les vœux des autres : il fouille l'eau, remonte une pièce, se voit pris sur le fait et la laisse retomber avant de détaler (« C'est pas c'que tu crois ! »). |
| v 0.93 | **Retours du 17/10 : la carte partout, l'enseigne, le ciel, la nymphe, la persuasion** (planche 18 validée) | **Corrigés** : la ligne du soir (chat, nymphe, garde) ne recouvre plus la liste « En mission » ; la **Faucheuse ferme toujours la file** (même quand un client se remet en attente) ; Grippesou un peu plus grand à la fontaine, qui fouille l'eau et sautille quand il tient sa pièce ; **trop de clients au jour 17** : la file ne dépasse plus ce que la journée permet de servir (les heures d'ouverture divisées par un service et un récit, plus un — 7 à 10 selon l'expérience et l'éclairage), les lettres et les clients d'hier passent d'abord ; « Journée pleine » le dit au bilan du soir. **Nouveau** : la **carte du monde consultable de partout** (bouton « Carte » au comptoir, à l'arrière-boutique, dans la chambre ; un panneau de bois au marché et au marché noir) ; **l'enseigne suit la maison entière** (planche brute, panneau encadré, panneau peint, enseigne de maître), avec **5 écritures et 7 fonds** au choix au bureau (clic sur le nom du shop, aperçu en direct) ; **le ciel heure par heure** dans la fenêtre du comptoir (aube dorée, plein jour, après-midi chaud, heure dorée, crépuscule rose et violet, nuit) ; **la nature de l'écran titre** selon l'heure de l'appareil (oiseaux le matin, cigales l'après-midi, grillons et chouette le soir) ; **la nymphe** : la 2e visite dit bien le 1er secret (il était sauté), 4 visites au plus, la 4e offre **la fiole** (une potion de plus chaque semaine) et ses adieux, puis tous les 10 vœux la fontaine s'illumine d'elle-même et la bénédiction revient ; **une goutte bleue** dans le bandeau tant qu'elle dure (un clic l'explique), une ligne au récit quand elle aide (« L'eau s'est écartée devant moi... »), une ligne au bureau (« Toi ») et la fontaine qui luit au marché ; **la persuasion** (nouvelle compétence au bureau) : elle monte avec les marchandages réussis (niveau 1 à 5, niveau 2 à 15) ; par niveau, +1 de patience au client, une chance qu'il lâche 5 % au-delà de sa limite (8 %, puis 15 %), et moins de départs fâchés. Planches 19 validées et construites : **les retours du jour résumés** (dès deux retours et un premier récit déjà vu, « Tout résumer » au comptoir : chacun est encaissé, un tableau dit tout, un clic sur une ligne rouvre son récit avec ses soins et ses trouvailles) ; **la feuille du jour** au bureau (onglet « Aujourd'hui », « Ranger la file » : novices, aguerris, héros ou lettres d'abord, gardé pour les jours suivants, ou chacun avec ses flèches ; les retours et les visites restent à leur place, et **la Faucheuse n'y figure jamais** — elle reste une surprise, toujours en dernier) ; les fonds de l'enseigne. **Le mendiant (validé)** : à 60 pièces données, « Tu as les yeux de ta mère... » ; à 100, une petite cinématique au marché, il te rend **la médaille de tes parents** (« Ils ne t'ont pas abandonné »), pendue ensuite sous leur portrait dans la chambre ; une fois par semaine, si tu lui as donné quelque chose, il chuchote une rumeur (un événement à venir, le prochain recherché) ; au marché noir, il est triste si tu penches vers l'ombre ; de nouvelles paroles selon ce qu'il se rappelle. L'aventure annexe avec Brisquet reste à écrire (plus tard, au bon moment). |
| v 0.95 | **Le Carrefour rééquilibré** (validé le 17/10) | **Serment de lumière** : +1 client par jour (les pèlerins), la garde ne fouille plus, un soin sur deux sans potion (les clercs), un paladin escorte une mission par semaine (un bouton au comptoir : +1 cœur au départ), +10 % de butin dans les terres de lumière. **Serment d'ombre** : le marché noir ouvre chaque soir, les objets interdits +10 %, le Passeur rapporte chaque semaine le baluchon d'un mort (ses objets durables et la moitié de ses provisions reviennent dans la réserve, le carnet le dit), +10 % de butin dans les terres d'ombre. Tout est écrit sur les vitraux du Carrefour. Planche 20c : l'été refait (un vrai champ de blé derrière la maison, des meules et une gerbe), **validée le 17/10** : les quatre saisons sont validées. |
| v 0.96 | **Heures de jeu et journal de bord** | Chaque sauvegarde affiche le temps joué (« jour 12 · 3 h 27 de jeu »), sur l'écran titre et dans la liste des emplacements. Le temps ne compte que quand la page est visible, hors écran titre, et s'il y a eu une action dans les 5 dernières minutes. **Journal de bord** (☰ > Journal de bord) : les 40 derniers événements de la session (scènes ouvertes, boutons cliqués, erreurs) et ceux de la session précédente, pour localiser un gel : après un gel, recharger puis ouvrir le journal et en faire une capture. |
| v 0.97 | **Grand house keep de nuit** | Gels et blocages : la double transition du résumé des retours, les erreurs en boucle du marché (enchères, Brisquet, tableau), la promenade (deux scènes à la fois), la banque (emprunt bloqué), le Carrefour sauté, un récit en erreur mène à sa fin. Fuites : les animations sans fin s'arrêtent avec leur objet, les oiseaux des récits, les particules, les écouteurs de la rue et des récits, les portraits des clients oubliés chaque soir. Règles : Grippesou ne se remplit plus au rechargement, le sabotage ne reste plus coincé, l'objet piégé n'est plus gardé, une lettre impossible ne fait plus planter le soir, le malus « blessé », la prévision de la forge. Textes : tout au féminin pour une joueuse (« marchande », « petite », rangs de la bande...), pluriels du Passeur, gain du bonneteau. Réputation à la mort : −1,5 / −0,5. |
| v 0.98 | **Le marché noir toute l'année** (planches 27 à 29) | Dans la cave, une 2e rangée : **Au Gobelet Fêlé** (le coin bar de Mère Nok : un verre 3 p., une rumeur, parfois un vrai tuyau — la garde qui viendra demain, un indice sur la fosse), **la fosse** (un combat par soir entre deux Bannis, cotes selon leur force cachée, le flair donne un indice plus ou moins juste ; mise 5 à 30 p. ; combat animé : élan, coups, esquives, poussière, foule, et une fin qui varie — K.O. au ralenti avec bandes noires, aux points, abandon, arbitre, coup bas disqualifié), **le bras de fer de Mog** (mise 10 p., une fois par soir : cliquer quand le repère passe dans le vert ; Mog pousse sans arrêt et un peu plus fort à chaque victoire contre lui ; gagner = mise doublée + respect). **La caisse du Passeur** (chez le Passeur, une par soir : 9 à 14 provisions ~40 % moins chères ; déballée la nuit dans la réserve ; si la garde vient le lendemain, saisie + amende sévère de 2,5 fois son prix, même cachée sous le plancher). **Les contrats de l'ombre** (certains soirs dès le jour 10, au bar : un Banni propose une mission ; tu choisis un habitué du niveau demandé et fournis le kit ; absent 2 jours ; réussite = 100 à 280 p. et ☾, échec = blessé ou disparu, et parfois la garde). L'amende de la garde ne compte plus la bourse au-delà de 1 500 p. (12 % plafonnés à 180 p.). Le Passeur porte son costume de pirate ; les femmes des peuples de l'ombre ont leur propre design. Simulation (ombre, 90 jours) : environ 6 500 p. |
| v 0.99 | **Les saisons** (lot B-1 et B-2) | Chaque mois est une saison, et elle se voit : la Comté change de couleurs partout où on la voit (fenêtre du comptoir, chambre, marché, express...) ; devant la façade et dans la rue, deux arbres au feuillage de saison, les fleurs et les pétales du printemps, les meules de l'été, les feuilles rousses et la brume de l'automne, la neige au sol, sur le toit (qui suit sa forme) et le bonhomme de neige de l'hiver. **L'icône de saison** à côté du jour (fleur, épi, feuille, flocon). **Le calendrier** (au bureau, un clic sur la date) : le mois en grille, les jours passés barrés, aujourd'hui entouré, les loyers, les fêtes (Solstice 13-15 des Moissons, Nuit des Brumes 26-28 des Brumes), les effets de la saison et le prochain grand rendez-vous. **Les effets** : prix de saison au marché, épreuves de crue / soif / brume / froid ×0,85 sans le bon objet, plus de novices au printemps, une mission sur dix retardée dans la brume, un client de moins l'hiver. **Le passage de saison** : le premier matin d'une saison, la façade change sous tes yeux (fondu de l'ancienne à la nouvelle), puis le titre ; après un saut de temps, les saisons défilent (« Les saisons passent... », « 1 an et 2 mois plus tard »). L'annonce des fêtes (la veille et chaque jour, au réveil) est prête et s'allumera avec les fêtes (B-3). |
| v 1.00 | **La Fête du Solstice** (lot B-3a, planches 22 v3, 22b v2, 30 et 30 v2) | Les 13, 14 et 15 des Moissons, annoncée par le crieur une semaine avant, puis la veille et chaque jour au réveil. Le marché en fête (lampions, bannières de la Confrérie). **Le tir à l'arc** du sergent Aubrin à la place du coin des jeux (plein écran, trois jauges ; lots en pièces, trèfle du Solstice, titre « Œil du Rempart »). **Le mât de cocagne** (main gauche, main droite, la force, la graisse ; en haut le jambon fumé ou le sac mystère). **L'étal de l'Union** (couronne de fleurs, écharpe bleu et or, cape blanche, portées par JeuneGoy ; bénédiction du comptoir par Frère Anselme). **La tarte du Solstice** chez Rosalie. **Les lanternes célestes** le dernier soir. Le moteur des corps sait grimper. La conquête d'une contrée demande une mission de plus par étoile. Corrigé : le rang des aventuriers affiché « undefined ». |
| v 1.01 | **La Nuit des Brumes** (lot B-3b, planches 31 et 31 v2) | Les 26, 27 et 28 des Brumes, au marché noir (la porte dérobée reste ouverte, sans mot de passe). Les lanternes rouges des ancêtres, le grand feu, les fêtards. **Les osselets de Grik** (cinq osselets, une relance, miser plus ; Grik triche, ton flair peut le voir). **L'étal des atours des ancêtres** (masque d'os, châle de brume, lanterne de ceinture : +1 de relation avec l'ombre pendant la fête). **Le grand soir** : l'hydromel noir (relation avec le Passeur et Mère Nok ; le lendemain, on ouvre une heure plus tard) et sa **vision** des parents (un voile de fumée violette, le souvenir qui brûle comme un parchemin, le réveil près du feu) ; le pain de cendre (protège d'un repli raté). **Les lanternes pour tes morts** (trois qualités ; sans hommage, −0,3 de réputation). **Garrick parle aux Bannis** dès la première année (« des jours meilleurs viendront »). Le moteur des corps sait porter un enfant sur ses épaules. Partout : la narration en italique couleur parchemin, les paroles droites et plus claires. |
| v 1.02 | **Le Grand Sage** (planche 32, d'après le dessin du joueur) | Le Grand Sage dans le moteur des corps (couronne d'or aux pierres bleues, longue barbe blanche qui tombe sous le menton même de profil, cape d'écailles de dragon rouges, robe violette brodée d'or sur la robe d'ivoire à l'arbre d'or, bâton torsadé au cristal bleu, runes, fioles, grimoire). **Son discours au deuxième Solstice** (le grand jour, en arrivant au marché, une fois) : les cloches, le cortège, la colonne de lumière, le discours validé en trois morceaux, l'acclamation, et Garrick qui n'applaudit pas. Corrigé : le zoom de la vision de l'hydromel sur les écrans HD (iPad). |
| v 1.03 | **Le Conseil des Gardiens** (planche 33 validée) | Les cinq Gardiens (Maître Bertolin Pommeval, Dame Aliénor de Hautval, Durgan Barbe-de-Fer, Dame Ilyriel, l'Archimage Séraphine), en robe aux couleurs de leur royaume, l'étole blanche du Conseil et la broche d'écaille rouge ; Sire Valdric, le Champion du Rempart. Au Solstice de l'an 2, le Gardien du Comté et le Champion montent sur l'estrade avant le Grand Sage. |
| v 1.04 | **Les armes portées** (planche 34 validée) | Chaque voyageur porte son arme sur lui, partout où on le voit en pied : dans le dos (épée, hache, marteau, arc, bambou), à la main (lance, bâton de mage, massue), aux mains (griffes), à la taille (dague, rapière, khopesh, fronde) ; avec le baluchon, la lance et le bâton passent dans le dos. Celui qui vient faire réparer son arme l'a déjà dans la file ; celui qui en achète une repart avec. Les armes sont un peu plus grosses (×1,3) pour se voir sur les petites silhouettes de la file. La salle du Conseil a son dallage de marbre crème veiné d'or (le damier est abandonné). |
| v 1.05 | **Le Long Hiver, Madame Ysmée, le foyer** (planches 35 et 36 validées) | **La Fête du Long Hiver** (20-22 du Givre) : la place enneigée, le grand sapin, les guirlandes, le bonhomme de neige ; la grande roue des cadeaux du Père Givrin (8 p., un tour par jour) ; les habits d'hiver (bonnet, moufles, écharpe : +1 de relation pendant la fête) ; le sapin de cristal (gros lot, +0,4 client/jour) ; le banquet du grand soir (Garrick trinque, un cadeau d'un voisin, réveil en forme) ; les cadeaux offerts pendant la fête touchent davantage. **Madame Ysmée** : sa tente violette dès le jour 10, son foulard violet, le présage du matin (le Corbeau, la Roue, la Tour, l'Étoile, le Soleil), trompeuse 2 fois sur 5, et les indices du flair. **Le foyer** : l'hiver sans bûche (fatigué, puis malade), la bûche rouge du bandeau et la confirmation au coucher ; la gamelle du chat, le chat qui boude, son mot sur le comptoir et son retour. |
| v 1.06 | **Audit des animations** (règle : jamais une image figée qui glisse) | Balayage de tout le jeu (robot joueur + chaque cinématique et 14 récits, avec un détecteur de personnages qui se déplacent sans marcher). Corrigés : la marche s'arrêtait trop tôt au début des scènes chargées (le personnage finissait le trajet en glissant : rénovation, faillites, intro, file du comptoir...) ; une marche relancée pouvait être coupée par la précédente ; JeuneGoy de trois-quarts n'avait pas d'images de pas (faillites, coucher) ; les passants de la grand-place du marché glissaient ; l'enfant de la vision trottine ; les banquiers gigotent pendant leur farandole ; le sanglier détale en trottinant ; les monstres des récits (yéti, troll, golem, la Bête) se dandinent lourdement quand ils avancent ; le voyageur emporté par la rivière se débat. Gardés tels quels (déjà animés autrement) : les sauts, les chutes, les roulades, Garrick qui flotte inconscient dans l'intro. |
| v 1.07 | **Grand house keep de nuit** | Relecture complète du lot B et des fêtes (deux relecteurs), robots joueurs, balayage des cinématiques, des textes qui débordent et des vieilles sauvegardes. **Blocages corrigés** : on ne pouvait plus quitter Madame Ysmée à la 2e visite, ni la roue des cadeaux le 2e jour (il fallait recharger la page) ; la fenêtre du foyer quittée par le menu empêchait de dormir les soirs suivants. **Règles** : la Tour ne fait plus venir la garde deux fois ; tirer une carte ne décide plus d'avance le sort de tous les absents ; le banquet n'est plus perdu par une sauvegarde au mauvais moment ; « l'arc long… il rejoint » (genre des armes de la roue) ; la prévision du soir compte le froid de la nuit (et la grasse matinée après l'hydromel), et le clocher sonne la bonne heure ; le chat est bien rentré le soir de son retour ; un aventurier en mission ne part plus en contrat de l'ombre (et un mort de contrat ne revient plus, on peut lui allumer une lanterne) ; huit lanternes des morts au plus par Nuit des Brumes ; la Nuit des Brumes n'est annoncée qu'à ceux qui connaissent le marché noir. **Moments uniques rendus accessibles** (les sauts de temps les faisaient manquer) : Garrick parle aux Bannis à ta première Nuit des Brumes au marché noir (et seulement s'il a fini son discours), le Grand Sage à ton deuxième Solstice vécu, n'importe quel jour de la fête ; le tout premier passage de saison (le mois sauté de la première nuit) est enfin montré. **Triche impossible** : un double-clic ne fait plus payer deux parties (tir, mât) ; la partie est sauvegardée dès qu'on mise (fosse, bras de fer, osselets, lanternes, roue, tir, mât) : recharger la page ne rend plus l'argent perdu. **Divers** : les oiseaux de l'aube des récits (fini le « cui cui » qui sortait de la bouche du voyageur) ; le bandeau des nouvelles du marché ne cache plus le titre ; l'écran de faillite propre ; une nuit ne plante plus avec un voyageur sans épreuve ; les flèches de la cave sont bloquées pendant un combat, un bras de fer ou le discours de Garrick. |
| v 1.08 | **House keep de nuit (suite)** | Robots joueurs envoyés aux trois fêtes, et un relecteur sur les « clics rapides ». **Corrigés** : la carte du monde ouverte depuis l'arrière-boutique ou le marché noir s'affichait *sous* la page (le jeu semblait figé) ; devant la trappe du marché noir (ou après « Pas ce soir »), les flèches de la cave faisaient entrer sans le mot de passe ; après « Remonter », l'accueil pouvait revenir par-dessus et une affaire conclue à ce moment échappait à la plainte ; une flèche cliquée juste avant « Défier » annulait le bras de fer (mise perdue, flèches bloquées) ; les osselets pouvaient être quittés en pleine partie (mise perdue) ; l'hydromel bu laissait encore « Refuser poliment » pendant le fondu ; au marché des fêtes, un jeu (tir à l'arc, mât, roue) et « Rentrer »/« Ouvrir » pouvaient partir en même temps (deux pages lancées) ; au bonneteau, quitter pendant le mélange puis rejouer laissait l'ancien mélange annoncer « choisis » trop tôt. Les robots ont maintenant un détecteur de « page cachée sous une autre ». |
| v 1.09 | **Garrick et le vieux tonneau** (planche 37 v2 validée) | Dans l'intro, Garrick arrive en se débattant dans la rivière : il agrippe un rondin qui bascule et l'envoie au fond (PLOUF, il boit la tasse), remonte en toussant, puis se cramponne à un vieux tonneau qui le porte jusqu'à toi ; tiré de l'eau, il lâche le tonneau, qui file avec le courant. |
| v 1.10 | **Lot C-1 : les commandes royales et l'impôt du Conseil** (planches 38 et 38 v2 validées) | Dès ★2, le 9 de chaque mois, le héraut de la Confrérie apporte une **commande royale** scellée (provisions, armes, et des « bel ouvrage » dès que ta forge tourne) : on brise le sceau, on lit la lettre, on accepte ou on refuse (−1). Acceptée, elle est **punaisée sur l'ardoise** (ce qui manque, le sablier). Le 16 au matin, il revient : tout y est (**LIVRÉE** : 600 p. à ★2, +50 % par étoile, +1 de réputation, l'impôt suivant moitié prix), ou c'est **MANQUÉE** (« Le Conseil est mécontent » : −2, impôt ×1,5 pendant 2 mois, pas de commande le mois suivant). Le 1er du mois, la **lettre du percepteur** : 5 % × étoiles au-delà de 300 p. × étoiles. Les « bel ouvrage » promis au Conseil ne partent plus dans les baluchons. Corrigé au passage : après un choix à deux boutons, le bouton du milieu restait affiché. |
| v 1.11 | **Lot C-5 : Lucien Belhomme, le paon d'à côté** (planches 40 v2 et 41 validées, version A) | Le 1er du mois qui suit ta première commande royale, l'ancien apprenti de Garrick ouvre « Au Comptoir Agréé » juste à côté de ta maison (sa façade à lui : pierre blanche, bleu du Conseil, enseigne ovale dorée) : banderole, ballons et badauds le matin, et il vient se présenter au comptoir. Selon sa **pression** (1 à 3), il attire un client de passage tous les deux jours, un par jour ou deux par jour : le client hésite dans la file, puis file chez le voisin sous tes yeux. Le **mois des comptoirs** : tes aventuriers revenus vainqueurs contre les siens (il sert autant de clients que toi, et en ramène vivants 55, 65 ou 75 sur 100 selon sa pression) ; le score reste en haut de l'écran (clic : le panneau). Le 1er du mois, le **crieur** vient en fin de file annoncer le bilan : tu gagnes, sa pression baisse ; il gagne, elle monte et il vient se pavaner ; battu à pression 1, il ferme et plie bagage. Il se moque aussi d'une commande royale manquée (au comptoir et dans la gazette). Sa boutique **à vendre** : la lettre du notaire le matin, puis « Chez le notaire » le soir ; 1 500 p. × étoiles pour en faire **l'orphelinat** (+3 de réputation ; les coursiers viendront avec leur planche) ou **le petit bar** (sa planche aussi) : en attendant, la maison est en travaux. |
| v 1.12 | **L'orphelinat du Comté** (planche 42 validée) | La maison du paon rachetée pour les orphelins : façade repeinte (vert tendre, bois, linge qui sèche au vent, craies, enfants qui jouent au cerceau). **Le soir, « L'orphelinat »** : la liste des courses des petits (6 objets, 10 avec le dortoir, jamais plus cher que le soir même), faite à l'aube et posée sur ton comptoir ; et l'onglet **Bâtir** : le dortoir (2 500 p. : deux courses par jour, liste de 10), l'école (5 000 p. : les courses ne prennent plus de temps, une rumeur du marché chaque matin), la grande salle (9 000 p. : de temps en temps un ancien de l'orphelinat en novice, ami dès le premier jour, avec son petit fil d'histoires) ; chacune bâtie en une nuit (+1 de réputation). **Au comptoir, le coursier** partage la ligne de Grippesou : un objet de l'étal, au prix du marché, en ¼ h (une course par jour, deux avec le dortoir) ; il court derrière la fenêtre et revient l'objet sous le bras. Aussi : les noms trop longs des lettres du soir ne passent plus sous Oui / Non ; les boutons de la lettre du notaire sont dans son panneau. |
| v 1.13 | **La disgrâce et la commande scellée** | « Commande royale » devient **« commande scellée »** partout. **L'échelle de la disgrâce** : chaque commande manquée est une faute (une livrée en efface une) ; 1re : −2, impôt ×1,5 ; 2e, **le sceau noir** : −3, impôt ×1,75, le paon reçoit tes commandes (sa pression monte) ; 3e, **la disgrâce** : −3, impôt ×2, le sceau quitte ta porte, plus de nobles, deux mois sans commande, puis **la commande du pardon** (plus grosse, 10 jours, sans prime) qui efface tout et rend le sceau. Penché vers les Bannis : l'impôt monte d'un quart de plus à chaque faute (jamais plus de ×2,5). Trois refus de suite : deux mois sans proposition. Le **sceau du Conseil** à droite de ta porte (première commande livrée). **Les anciens de l'orphelinat** parlent de l'orphelinat à chaque visite et au retour de mission. |
| v 1.14 | **Ménage (relectures, bots, scans)** | Relecture du Conseil : l'ordre de la nuit (les échéances du Conseil passent avant le paon), la lettre d'impôt montre la majoration et la ristourne avec les bons taux, le pardon raté ne parle plus de « troisième faute », tous les objets du marché ont leur nom dans les commandes scellées, plus de nobles pendant la disgrâce. Orphelinat : le coursier ne court plus si la réserve est pleine, la liste garde les restes, le titre « coursière » au féminin, pas de narration si le client est parti. Paon : il ne vole plus les clients prévus, nobles, recherchés, anciens de l'orphelinat, généreux, exigeants ni imposteurs ; son score ne se trompe plus le premier du mois. Le petit bar n'est plus en vente tant qu'il n'est pas construit (« bientôt »). Accords au féminin élargis (marchande, patronne, voisine, petite protégée). |
| v 1.15 | **Les eaux de la carte** (planche 46 validée) | La carte du monde a ses lacs, ses mers et ses rivières : la baie des Brisants, le lac de Lune chez les Elfes, le lac gelé des Nains, l'étang du Moulin près de ton comptoir (on y pêchera), le torrent des Nains et l'affluent du lac qui rejoignent un Grand Fleuve plus large, le ruisseau de la Comté jusqu'à l'étang, le Fleuve des Cendres chez les Bannis (sous le pont) ; une barque, une tortue géante qui nage ; les noms des eaux à la plume. Aussi : l'icône du jeune héros pour l'écran d'accueil de l'iPhone (le site), et deux nouvelles poses dans le moteur des corps (« empoigne », « plateau ») pour le futur bar. |
| 10b | **La forge chez soi** (validé) | À ★3 (le saut d'un an), on peut construire une forge dans l'arrière-boutique et engager un premier forgeron ; un second à ★4. Chaque nuit, ils fabriquent des armes avec les matériaux en stock. |
| 10c | **La rue et le familier** (validé : le chat chasse les rats de la réserve et prévient parfois de la garde) | La rue du comptoir s'agrandit : on y marche avec son personnage jusqu'aux lieux du quartier (marché, banque, forge, fontaine, plus tard le petit bar), en plus des raccourcis depuis la maison. En s'y promenant le soir, on croise le chat de gouttière : on le nourrit quelques soirs de suite, et il nous adopte (premier familier). |
| 11 | **Aider pendant l'aventure** | Messages de détresse, le grand aigle, les mercenaires. |
| 12 | **Le petit bar** | Rumeurs, boissons, recrutement de mercenaires. |
| 13 | **Histoire** | Prologue, personnages récurrents, mendiant, menace qui grandit. |
| 14 | **Vie du personnage** | Vieillissement, famille ou vagabond. |
| 15 | **Fins du jeu** | La fin du bien et la fin du mal. |

## Tailles des peuples

Des plus petits aux plus grands : hobbits et nains à peu près pareils (léger avantage aux nains),
puis humains, elfes, magiciennes. Les pandas (à venir) seront les plus grands parmi les peuples du
bien ; la liste des tailles des forces maléfiques sera donnée plus tard.
Silhouettes : hobbit 13 px, nain 14, humain 16, elfe 17, magicienne 18. Au comptoir, le buste des
petits peuples apparaît plus bas dans la fenêtre, celui des grands plus haut.

## La chambre : ce qu'une bonne nuit apporte (décidé, construit)
- **+1 d'expérience** par nuit et par niveau de lit (l'expérience compte jusqu'à 80 clients).
- **Bien dormi** : 15 % par niveau de se réveiller en forme : un client de plus ce jour-là, ou 10 % de remise chez tous les marchands.
- **Les rêves** (dès le lit sculpté, 25 % par niveau au-delà du premier) : un indice au réveil : le sort d'un aventurier qui rentre aujourd'hui, un événement à venir, ou la catégorie d'objets qui se vendra 15 % plus cher aux enchères.
- **Se remettre d'un mauvais jour** : après un mort ou une faillite frôlée (à moins de 30 p. du seuil), +0,15 de réputation par niveau au réveil.
- **La santé avec l'âge** (à construire avec le vieillissement, étape 14) : une bonne chambre ralentit la fatigue des vieux jours (constante `CHAMBRE.sante`, réservée).

## Améliorations du shop

Commandées le soir au bureau (tiroir « Améliorer le shop »), installées pendant la nuit
(sauf l'étagère, qui suit les agrandissements de la réserve). Chaque niveau terminé donne
+0,2 de réputation. 4 niveaux de luxe : bois brut → chêne ciré → noyer et laiton → ébène et dorures.

| Meuble | Niveaux | Prix | Bonus par niveau |
|---|---|---|---|
| Étagère de la réserve | Planches brutes, Chêne ciré, Noyer à moulures, Ébène et dorures | 60 / 140 / 260 | réserve 30 / 40 / 55 places |
| Comptoir | Chêne brut, Chêne verni, Noyer et laiton, Ébène et dorures | 150 / 400 / 900 | +4 % de butin reversé |
| Coffre de la fortune | Bois, Ferré, Coffre-fort de nain, Or gravé | 100 / 280 / 650 | intérêts 1 % par nuit (15 p. max) |
| Chambre | Paillasse, Lit de bois, Lit sculpté et édredon, Lit à baldaquin | 80 / 220 / 500 | +1 expérience par nuit |
| Éclairage | Bougies, Lanternes, Chandeliers, Lustre de cristal | 90 / 250 / 600 | +0,3 client par jour |

Tout futur objet améliorable suivra le même modèle (table AMELIORATIONS dans data.js).

## Le vrai début : la rénovation et la première journée

Après le prologue, Garrick emmène le héros devant son futur shop : une vieille auberge
abandonnée, sous la poussière et les toiles d'araignée. Petit gameplay de clic : on remet à
neuf chaque endroit délabré (façade, comptoir, arrière-boutique, chambre) ; à chaque clic,
JeuneGoy va jusqu'à l'endroit, un nuage de poussière, et l'endroit devient sa version propre.
Puis le shop restauré est filmé de gauche à droite (chambre → arrière-boutique → comptoir →
façade) et la première journée commence. Garrick reste ce jour-là et explique chaque écran la
première fois qu'on le découvre (carte, comptoir, colis, arrière-boutique, soir, bureau,
marché), puis reprend la route.

## ⚠ Le grand retournement (pour plus tard)

**Version à jour (décidée par le joueur le 14/10, remplace l'ancienne idée du « grand méchant ») :**
Garrick Cœur-de-Chêne, l'aventurier sauvé de la rivière au début, est en réalité **le chef des
Bannis**, c'est-à-dire des vrais justes. Aux yeux du monde, il « contrôle les forces du mal ». S'il
flottait dans le fleuve, c'est que des héros de la Confrérie l'avaient pris en chasse. Il ne recrute
pas le joueur directement (trop tôt, trop dangereux pour lui) : il le surveille, l'aide en douce
(coup de pouce, cadeaux), et plaisante à la légère sur ce que « tout le monde sait ». La grande
vérité n'arrive qu'à la fin ; un joueur attentif peut sentir avant que quelque chose cloche dans le
Conseil. (L'ancienne idée, Garrick « grand méchant que la fin du bien affronte », est abandonnée.)

**Le complot des Gardiens de la paix** (dit par le joueur en v 0.52) : les Gardiens de la paix, le
camp « gentil », ont commis des horreurs que tout le monde aurait pu pointer du doigt, et ont caché
la vérité ; ils ont baptisé « forces du mal » ceux qui les gênaient. Celui qui choisit les Gardiens
finit par servir des bourreaux maquillés en héros ; celui qui choisit les « forces du mal » se
retrouve, à la fin, du côté des justes. À tisser avec le temps par les récits et l'avancement ;
Garrick glisse des allusions très subtiles dès l'étape 9 (blagues, choses dites à la légère).

**Les réponses du joueur du 15/10 (tranchées, à construire aux étapes 9¾ et 13–15) :**
- **La Main Noire** est neutre : elle profite de la situation des Bannis, mais elle est aussi la seule
  à pouvoir vraiment les financer. Ni amie, ni ennemie : un rouage.
- **La Faucheuse** est du côté de la mort, et de rien d'autre. Elle aime la mort et veut pousser le
  joueur à tuer : la jauge du mal (les âmes offertes) monte d'autant plus vite que le joueur se
  plaît à la mort. Il faut définir les degrés de cette relation (jusqu'où on peut être proche de la
  mort), et lui donner **une voix à part entière** (audio.js).
- **Les aînés et doyens des Bannis** se souviennent des anciens récits (le sort d'oubli les a moins
  pris), mais ils passent pour des vieux séniles. Seul **Garrick** les prend au sérieux et veut
  démêler le vrai du faux. Vu l'importance qu'il prend : **un skin plus marquant et une voix à lui.**
- **L'armure du Dernier Rempart** appartenait à un héros des temps anciens, qui avait accueilli les
  peuples (aujourd'hui) bannis à bras ouverts, avant de subir le complot du grand Sage. (La
  Confrérie la distribue comme si elle était à elle.)
- **La Bête de l'antre et le dragon** : une **destination cachée, hors de tout royaume, à 6 étoiles**,
  la dernière, avec le « dragon sous la montagne » en leurre. C'est là que le joueur prend part au
  dernier combat avec sa nouvelle armure et sa nouvelle arme : le dernier combat officiel... et
  l'avant-dernier en vérité, car le vrai combat se joue contre le vrai Sage. Un petit **système de
  combat** à construire (étape à venir).
- **Les fins** : une fin **amère** (le Gardien qui a servi les bourreaux) et une fin **cachée**, à
  détailler une fois la majeure partie de l'histoire en place.
- **Les noms** : le Conseil des Gardiens gouverne ; la Confrérie du Dernier Rempart est son bras armé
  et siège à la Citadelle.
- **Le temps qui passe** : à chaque nouveau palier d'étoiles, quelques mois ou quelques années
  s'écoulent (construit en v 0.55 : `SAUTS_TEMPS`), et le joueur grandit avec la carte.
Questions à trancher : docs/etape9-preparatifs.md § 6.


## 10. Balayage des idées (v 0.50) : tout ce qui reste, rangé par étape

Relevé de toutes les idées exprimées au fil de la conversation et pas encore faites. Chaque entrée reprend une envie du joueur ; les étapes sont celles du plan ci-dessus.

### 8¾ Refonte des personnages (en cours)
- Refonte des **habits** dans le nouveau moteur : tenues par niveau, costumes des figurants, vêtements distincts par peuple (Hobbit, Witcher 3, Travellers Rest, Stardew) ; chapeau de mage façon *Terraria* pour la magicienne.
- Valider les planches avec le joueur avant chaque publication (règle fixée en v 0.49) ; rendu trois tons validé comme base (« la meilleure palette jusqu'ici »).
- **Plus de couleur dans tout le jeu** : décors, paysages, intérieurs, interface (seuls les personnages ont la palette vive pour l'instant), et la même finesse ×2 si c'est utile (décors, objets, bustes).
- Vérifier les expressions sur les peaux sombres avec le rendu trois tons ; vérifier les tailles enfant / adulte / vieux dans le nouveau moteur.
- Le peuple **panda** (le plus grand du bien) ; les tailles des peuples du mal seront données par le joueur.
- Les paysages et intérieurs à repasser avec le même relief ; le joueur fournira des références d'intérieur (cheminée, toits).
- Le « joint » de la garde-robe : à trancher avec le joueur (la pipe existe).
- Un paysage **crépuscule** pour le soir (promenade, marché noir).
- Mettre la bibliothèque des créations à jour avec le nouveau moteur.

### 8½ Musique et sons (en cours)
- Moteur Web Audio en place (11 thèmes, bruitages, réglages dans le menu). À faire : écouter les extraits avec le joueur, ajuster, et varier les thèmes (plus de motifs, une percussion de marché, un thème de fête).

### 9 Le Bien et le Mal (+ marché noir)
- **9a, construit (v 0.53)** : la jauge lumière ⟷ ombre (−100 à +100), calculée à partir des missions réussies pour chaque camp (±8), des âmes offertes et sabotages (−5 par point de `G.mal`) et, bientôt, des objets marqués (±3). Paliers à 25, 60, 90 de chaque côté (Lueur / Lumière / Lumière éclatante, Pénombre / Ombre / Ombre épaisse). Visible au bureau (tiroir « Lumière et ombre ») et sur l'ardoise du soir. Effets : réputation en terres de lumière ×1,2 (×1,5 côté lumière), butin d'ombre ×1,15 (×1,35 côté ombre), taux de la Banque Centrale −3 points par palier de lumière, gazette à chaque palier franchi, côté de l'armure suivant la jauge. Dans le monde, les camps s'appellent la Confrérie et les Bannis.
- **9e, construit (v 0.54)** : le marché noir. À partir du jour 6, un soir sur trois (un sur deux quand la jauge penche vers l'ombre), un papier glissé sous la porte (dans la gazette du matin) donne un mot de passe ; le soir, le bouton « 🏮 La porte dérobée » descend dans une cave aux lanternes rouges (musique propre, chat noir). Il faut choisir le bon mot parmi trois. En bas : le Passeur (figurant encapuchonné) vend quatre objets interdits (fiole de poison, grimoire interdit, poudre de lune noire, passe-partout) ; deux Bannis passent chacun une commande d'un objet interdit, payée bien plus cher (+2 de relation, la jauge penche vers l'ombre) ; on vend ses trouvailles de l'atelier 15 % au-dessus de leur valeur, sans questions ; la Main Noire tient la table du fond (prêt sans questions) quand `G.mal` atteint son seuil ou que la jauge est à l'Ombre ; un Banni murmure une rumeur sur le Conseil (registres brûlés, Vallée des Pommiers devenue le Bourbier, impôts pour un dragon que personne n'a vu, l'homme à la cape verte...). Chaque affaire augmente un risque (le chat noir s'agite) : en remontant, une plainte peut faire venir la garde le lendemain, qui saisira les objets interdits à la fouille.
- **9d, construit (v 0.54)** : la garde de la Confrérie (Capitaine Edmond Brisefer et un garde d'un peuple de la lumière : tabard bleu au soleil d'or, casque selon le peuple, cimier bleu pour l'elfe, casque rond pour le hobbit). Elle vient par surprise quand la jauge penche vers l'ombre (plus souvent avec des décorations sombres), ou le lendemain d'une plainte (marché noir). Première visite : amende (12 % de la bourse, au moins 15 p.) ; ensuite : fouille et saisie des objets interdits. On peut soudoyer le garde avec un trésor de l'atelier : chances selon ses goûts (`GOUTS_TRESORS`) et la valeur ; raté, l'amende tombe, et rarement (15 %) le garde garde l'objet. Garrick repasse aux jours 4, 10, 17, 25, 34, 44, 56 : il plaisante, glisse parfois des pièces, et laisse tomber des allusions (le dragon que personne n'a vu, le Sage sans âge, les pommiers des terres d'ombre que personne ne se rappelle). Un Banni paie 15 % de moins à un comptoir de la lumière.
- **9c, construit (v 0.54)** : quatre décorations de camp à la brocante (chandelier d'argent et bannière de la Confrérie côté lumière ; crâne de troll et lanterne-crâne côté ombre). Chacune fait pencher la jauge de 6 points, attire son camp (pandas, humains, ou tous les Bannis), et les clients réagissent en arrivant au comptoir (une phrase avant leur bonjour, ±1 de relation) : un Banni n'aime pas la bannière, un client de la lumière frissonne devant le crâne, etc. Les clients commentent aussi ton côté de la jauge. Les objets interdits (poison, grimoire) viendront avec le marché noir (9e).
- **9b, construit (v 0.53)** : les six peuples de l'ombre (gobelin 11, momie 15, vampire 16, orc 17, loup-garou 20, troll 24) et le panda (21) dans le moteur des corps (4 angles) et des bustes, par une table de traits (`TRAITS_PEUPLES` : peau, oreilles, museau, crocs, bandelettes, fourrure, crête). Noms, noms composés, familles, goûts, voix, tailles au comptoir. Les Bannis ne viennent au comptoir qu'une fois la jauge côté ombre (palier −1), les pandas qu'une fois côté lumière (palier +1) ; les Bannis acceptent les terres d'ombre et refusent celles de la Confrérie. Retouches du joueur (v 0.53) : momie bandée de la tête aux pieds avec deux orbites lumineuses ; orc aux petites défenses d'ivoire sorties du fond des mâchoires ; loup-garou gris au long museau, touffes aux joues et collerette ; troll des montagnes sans défenses, tête énorme, nez immense qui pend, tignasse hirsute et mousse, longs bras d'orang-outan, pieds griffus ; panda plus large et touffu ; gobelin vicieux (yeux jaunes fendus, dents pointues). Les Bannis ont l'air fâché par défaut (sourcils froncés, paupières basses, humeur « neutre » remplacée par « fâché » au comptoir) ; leur visage redevient normal une fois amis (relation ≥ 8) ou quand la jauge atteint l'Ombre (palier −2). À venir avec le marché noir (9e) : les rencontrer là d'abord. Note : « Inconnu » = relation à zéro, comme pour tous. Décisions prises et proposition du marché noir : docs/etape9-preparatifs.md § 4-5 (une jauge, sceau gardé, clients du mal rencontrés d'abord au marché noir le soir, garde récurrente avec habits de garde pour chaque race du bien et soudoiement, Garrick très subtil).
- Objets du bien / du mal au marché ; décors du shop « lumineux » ou « sombres » (brocante) ; les réussites comptées par camp.
- Dialogues et visages fermés du camp qui ne t'aime pas ; meilleures affaires avec le camp qui t'apprécie.
- Une vraie jauge du bien (ou confirmer que c'est la réputation) ; les effets du camp de la lumière (meilleurs taux à la banque, plus de réputation en terres de lumière) ; la Main Noire et la banque selon le camp.
- Le moment où le camp se scelle (aujourd'hui la 9e pièce) à caler avec l'histoire ; peut-on changer de camp ?
- Les goûts de chaque peuple à définir avec le joueur quand les races du mal arrivent.
- Un lieu du bien ou du mal pour l'auberge influence la clientèle et la jauge (avec les zones conquises).

### 10 Marché noir (base construite en 9e, à enrichir)
- Le soir, pas tous les jours : grimoires interdits, potions illégales, artefacts ; voyageurs nocturnes aux quêtes farfelues ; s'ils se font prendre, ça retombe sur le joueur (amende, garde, fermeture : à décider).
- Quelques événements nocturnes rares au shop (visiteur de nuit, incident).

### 11 Aider pendant l'aventure
- Messages de détresse en mission ; le **grand aigle** (familier) apporte vite des objets ; les **mercenaires** récupèrent le butin perdu (nombre limité par jour, recrutés au bar).
- Un système de familiers (aigle et autres), conditions d'obtention à inventer. **Le chat du shop** en fait partie (décidé en v 0.50) : on ne l'a pas au début du jeu, on l'adopte plus tard (un chat de gouttière qui rôde devant la fenêtre du comptoir la nuit, qu'on apprivoise en le nourrissant ?) ; il dort alors sur le coussin de l'arrière-boutique.

### Promenade du soir (à enrichir au fil des étapes)
- Décidé en v 0.50 : une pièce à la fois, une porte par pièce pour passer dans la suivante ou sortir ; le comptoir ne se traverse pas, on s'y installe et on regarde la rue par la fenêtre (étoiles filantes, chat de gouttière, passant à la lanterne, hibou).
- À ajouter plus tard : des choses à trouver (objets cachés, pièces, lettres glissées sous la porte), des animations cachées (souris sous l'étagère, la bougie qui s'éteint, un rêve à la fenêtre), des rencontres étonnantes la nuit (un voyageur attardé, Garrick qui passe, un fantôme, le colporteur qui campe devant le shop), et d'autres vues de la rue selon les saisons et le temps.

### 12 Le petit bar
- Rumeurs, histoires, boissons, recrutement de mercenaires ; clients attablés (*Travellers Rest*, *Tavern Master*).

### 13 Histoire et zones conquises
- ~~**Agrandir la carte**~~ (dit le 14/10) : **construit en 9++** (en attente de validation des planches). Chaque royaume a son petit secret glissé dans un récit (les caisses au sceau du Conseil à Port-Brisant, les galeries creusées « par d'autres mains » à Khaz-Durim, les elfes qui chantent « pour ne pas oublier » sans savoir quoi, le Sage qui n'a pas vieilli à Opale, les livres aux pages effacées de la Bibliothèque Interdite ; côté Bannis : le troll qui garde un pont sans savoir pourquoi, les dessins d'enfants sur les murs du Fort, les momies qui se souviennent des noms, la comtesse et son mari pendu « au temps d'avant »). Un tracé très ancien, presque effacé, passe bien à l'ouest de la Grande Muraille.
- **Déplacer l'auberge** dans une zone conquise : nouveau biome, décor, PNJ du village, financer le voyage et le nouveau shop ; combien de shops au total.
- **Le grand retournement (rappel, à ne pas oublier)** : Garrick Cœur-de-Chêne est le chef des Bannis (les vrais justes), et le Conseil des Gardiens cache un massacre sous un sort d'oubli. Indices déjà en place (v 0.54) : visites de Garrick, murmures du marché noir, quêtes d'ombre réécrites, taxe « pour la défense contre le dragon », nouvelles de la gazette. La révélation à l'étape 15.
- La menace qui grandit : gazette, dialogues, décor qui s'assombrit ; sa nature (dragon ?) à confirmer.
- L'armure : la révélation (c'est le joueur et son groupe qui partent) et la sélection du groupe.
- Le mendiant (rôle narratif) et son chien (cinématique secrète, aventure annexe hors carte).
- Personnages récurrents : voisins, services contre récompense, gens qui veulent influencer en mal ; le petit village où retrouver les PNJ et leur offrir des cadeaux.
- Le titre « Le Passage des Aventuriers » : le mot « Passage » à confirmer.

### 14 Vie du personnage
- Vieillissement visible (cheveux blancs, barbe, posture, taille) ; talents aux grands âges ; famille ou vagabond ; fiancé(e) puis marié(e) ; la santé avec l'âge (CHAMBRE.sante) ; durée d'une partie.

### 15 Fins du jeu
- Décidé le 15/10 : une fin amère (Gardien) et une fin cachée ; l'Antre à 6 étoiles, hors royaume, comme dernière destination (leurre du dragon), puis le vrai combat contre le Sage ; un petit système de combat à construire avant.
- **La révélation : le Conseil a menti.** Garrick, celui qu'on a sauvé au début, mène les Bannis ; les « forces du mal » sont les peuples que les Gardiens ont chassés de leurs terres, et le sort d'oubli peut être brisé. Les fins sont à reformuler avec le joueur (question ouverte : fin « Gardien » amère ou rachat possible, fin cachée).

### « On le fera plus tard » (dit par le joueur ; à caser dans les étapes au fur et à mesure)
- **La fontaine du marché** (v 0.52) : on peut jeter une pièce par jour. Ce que ça débloque reste à définir : une rencontre un soir de promenade, un coup de pouce pendant un voyage, un vœu qui se réalise après N pièces… (candidat : étapes 11 ou 13).
- **La vitrine des étals** (v 0.52) : le second zoom montre les marchandises de près ; à enrichir plus tard avec des objets rares du jour, des promotions, le marchand qui vante sa marchandise.
- **Les étals qui ouvrent jour après jour** (v 0.52) : calendrier à ajuster avec les retours des joueurs.

### Registre du bureau à clarifier (dit le 14/10) — fait (v 0.54)
- Chaque tiroir est fait de blocs encadrés et titrés (Toi, Flair, Artisanat, Marchandage, Main-d'œuvre ; Missions, Clients, Meilleurs clients ; Recettes, Dépenses ; Réputation, Armure, Faucheuse, Relations, Décorations ; Lumière et ombre).

### Le grand point final (dit le 14/10) — premier passage fait (v 0.54)
- Trois audits menés (récit, gameplay, visuel) : ce qui est corrigé, ce qui reste et les questions sont dans **docs/audit-v054.md**. Le reste (décors anciens, cinématiques, récit à trancher) est rangé en 9½ et 9¾.

### Équilibrage (à tout moment)
- Le ravitaillement et le cœur commandes / colis ; états (empoisonné) et demi-cœurs (pistes) ; les effets de la chambre ; les déblocages de chaque palier à valider avec le joueur ; la conquête des lieux n'a d'effet que quand l'auberge peut déménager.

### Diffusion
- L'artefact claude.ai et `main` (Cloudflare, adresse goyland.workers.dev) sont en v 0.57 (lot visuel 9½, faillites, sauvegardes, réglages du son), vérifiée sur PC, iPhone et iPad : toujours demander au joueur avant de pousser les versions suivantes ; l'artefact claude.ai se publie sans demander, sauf quand il y a de nouveaux designs graphiques (le joueur veut voir les planches d'abord).


## La forge (validée par le joueur le 16/10 : armes, recettes, 10a puis 10b à ★3/★4)

**Idée du joueur :** chaque peuple a ses armes préférées ; plus d'armes chez le forgeron ; plus tard, deux forgerons engagés fabriquent les armes avec les matériaux du marché ; des recettes logiques (une lance, c'est surtout du bois ; une épée, surtout du fer).

**Un nouveau matériau : le bois** (2 p. chez Thorgal, toujours en stock). Fer 4 p., cuir 3 p., fil d'or 6 p. ne changent pas.

| Arme | Peuples qui la préfèrent | Recette | Prix au marché |
|---|---|---|---|
| Épée | humains | 3 fer + 1 cuir | 15 p. (déjà là) |
| Hache de guerre | nains, orcs | 2 fer + 2 bois | 15 p. |
| Marteau de guerre | nains (paladins) | 3 fer + 1 bois | 16 p. |
| Arc long (+ flèches) | elfes | 3 bois + 1 cuir | 14 p. |
| Lance | humains (gardes), pandas | 3 bois + 1 fer | 11 p. |
| Bâton de mage | magiciennes | 3 bois + 1 fil d'or | 14 p. |
| Bâton de bambou | pandas | 3 bois | 7 p. |
| Fronde | hobbits | 2 cuir | 6 p. |
| Dague | gobelins, hobbits | 1 fer + 1 cuir | 8 p. |
| Rapière | vampires | 2 fer + 1 fil d'or | 17 p. |
| Khopesh | momies | 2 fer + 1 bois | 12 p. |
| Griffes de fer | loups-garous | 2 fer + 2 cuir | 14 p. |
| Massue cloutée | trolls | 4 bois + 1 fer | 12 p. |
| Bouclier | tous | 2 bois + 2 fer | 14 p. (déjà là) |

**Comment ça s'enchaîne :**
1. **10a (tout de suite après le lot visuel 9½)** : les commandes demandent l'arme du peuple du client (ou une arme au choix pour les autres) ; Thorgal vend ces armes, quelques-unes par jour ; donner l'arme préférée rapporte un peu plus de relation. Les armes sont durables et se réparent comme l'épée (au fer, ou au bois pour les armes en bois).
2. **10b (à ★3, avec le saut d'un an)** : Garrick propose de transformer un coin de l'arrière-boutique en forge (achat comme un agrandissement). On engage un premier forgeron (un apprenti humain, lent) ; à ★4, un second (une maîtresse naine, rapide et soignée). Le soir, on choisit ce qu'ils fabriquent ; les armes sortent le matin. Fabriquer coûte environ 60 % du prix du marché, mais prend une nuit et occupe les matériaux.
3. **Plus tard** : les forgerons ont un salaire par semaine ; une arme bien faite peut sortir en qualité « belle ouvrage » (vaut plus, s'use moins) ; côté ombre, la forge peut fabriquer des armes interdites pour le marché noir.

À trancher par le joueur : la liste d'armes, les recettes, le moment (★3 / ★4) et le salaire des forgerons.

### Décisions du joueur (étape 10a/10b/10c, après la v0.62)

- **10a (fait en v0.63)** : la liste et les recettes restent ; les matériaux plus chers (acier, mithril, cuir de wyverne) viendront **plus tard**, pour garder la découverte. Son arme à lui : +5 % sur le combat et +1 relation ; **une autre arme fait l'affaire avec un tout petit avantage** (+1,5 %). Un nain vétéran et plus préfère le marteau. Au comptoir, la case « Armes » ouvre le râtelier (★ = l'arme de son peuple). Thorgal vend trois armes par matin (celle qu'un client attendu commande est souvent là) ; celles des peuples de l'ombre une fois les Bannis venus au comptoir. Planche : `docs/planches-v059/4-armes.jpg`.
- **10b** : forge 300 p. ; apprenti humain (6 p./nuit) dès ★3, maîtresse naine (12 p./nuit) à ★4 ; la qualité « bel ouvrage » dès la 10b ; **l'apprenti progresse** sans jamais égaler la maîtresse (proposition : apprenti → compagnon → ouvrier confirmé, au fil des armes forgées ; il plafonne à environ 80 % de sa vitesse et de ses chances de « bel ouvrage ») ; **côté ombre, la forge fabrique aussi des armes interdites** pour le marché noir.
- **10c** : ordre laissé à Claude (10a, puis 10c, puis 10b) ; le chat, une fois apprivoisé, **se personnalise** (petit panel : pelage, yeux, collier) et le joueur lui **donne un nom**.
- **Armure** : on garde « toutes les contrées d'un royaume » ; à combiner avec d'autres idées (proposition : à mi-chemin d'un royaume, un messager apporte un écusson et un mot d'encouragement ; une fois 7 royaumes libérés, la dernière pièce vient d'elle-même au bout d'une semaine, apportée par ton camp).
- **Bruitages** (demande du joueur) : enrichir la banque de sons dans la D.A. actuelle, comme pour un film : pas (sur bois, pavés, herbe, neige, eau), portes, tissus, coffres, armes qui s'entrechoquent, foule, vent, oiseaux, feu, etc., en particulier dans les cinématiques.
- **Création du personnage** (demande du joueur) : plus de coupes de cheveux, de bouches, etc.

## Étape 10b « La forge chez soi » — préparatifs (18/10)

### État des lieux
- **Déjà là** : les 13 armes des peuples et le bouclier (10a), le bois chez Thorgal, le fer, le cuir et
  le fil d'or ; les armes sont durables et se réparent à l'atelier ; Thorgal ne sort que 3 armes par
  matin (on garde ce tirage, décidé le 18/10) ; le saut d'un an à ★3 ; les améliorations
  commandées le soir au bureau et posées la nuit ; les employés de l'atelier (salaire chaque nuit,
  Tobin qui progresse).
- **Pas encore là** : les recettes dans le code, la forge, les deux forgerons, la qualité « bel
  ouvrage », les armes interdites forgées.
- **Ce que la forge apporte au joueur** : n'importe quelle arme, n'importe quel jour (fini l'arc long
  introuvable), des armes « bel ouvrage » qu'on ne trouve pas au marché, et côté ombre des armes
  interdites pour le marché noir.

### Le découpage proposé
1. **10b-1 Les règles** : les recettes (tableau de la forge ci-dessus) ; chaque soir on met des armes
   en commande, les matériaux sont pris dans le stock tout de suite, les armes sortent le matin ;
   salaire chaque nuit ; la qualité « bel ouvrage ».
2. **10b-2 La construction** : au lendemain du saut d'un an (★3), Garrick propose la forge ; on
   l'achète au bureau (300 p.), les ouvriers la montent la nuit dans l'arrière-boutique.
3. **10b-3 Les forgerons** : l'apprenti humain dès ★3 (6 p./nuit), la maîtresse naine à ★4
   (12 p./nuit) ; leurs bustes et leurs corps ; l'apprenti qui progresse.
4. **10b-4 Le décor et l'interface** : la forge dans l'arrière-boutique (foyer, soufflet, enclume,
   bac de trempe, râtelier), qu'on voit en promenade, le feu qui rougeoie la nuit ; le panneau
   « Ce soir à la forge » (les armes, leur recette, ce qu'on a en stock, ce que ça coûte) ; le
   matin, les armes posées sur le râtelier, avec les « bel ouvrage » qui brillent.
5. **10b-5 L'ombre** : les armes interdites que la forge fabrique pour le marché noir.
6. **Planches à valider** avant de brancher : la forge (décor), les deux forgerons, le panneau.

### Les chiffres proposés (à valider)
- **Vitesse** : l'apprenti fait 1 arme toutes les 2 nuits au début ; la maîtresse 2 armes par nuit.
- **L'apprenti qui progresse** : apprenti → compagnon (après 8 armes : 1 arme par nuit) → ouvrier
  confirmé (après 20 armes : 1 arme par nuit, et plus de « bel ouvrage ») ; il plafonne à 80 % de
  la maîtresse.
- **Bel ouvrage** : 30 % de chances pour la maîtresse, de 8 % à 24 % pour l'apprenti. Une arme
  « bel ouvrage » se vend 40 % plus cher, s'use deux fois moins vite, et donne +1 relation de plus
  à un client de son peuple.
- **Le coût** : avec les recettes validées et les prix actuels des matériaux, forger revient en
  moyenne à **85 % du prix du marché** (de 64 % pour l'arc long à 100 % pour la fronde), salaire en
  plus, et pas aux 60 % prévus. Trois façons de corriger (question 1).
- **Côté ombre** (proposition) : la **lame empoisonnée** (une dague + une fiole de poison), la
  **lame de lune noire** (2 fer + de la poudre de lune noire : elle ne brille pas la nuit), et les
  **griffes de l'ombre** (des griffes de fer + un passe-partout fondu : elles ouvrent les serrures).
  Elles se vendent au marché noir, risquées comme les autres affaires interdites.

### Questions au joueur (10b)
1. **Le coût de la forge** : (A) Thorgal vend les matériaux en gros à qui a une forge (par lots de
   5, à −30 %) ; (B) des recettes plus légères à la forge (un matériau de moins par arme) ; (C) on
   garde tout tel quel : la forge sert à avoir l'arme qu'on veut quand on veut et du « bel
   ouvrage », pas à économiser.
2. **Les noms** des deux forgerons (proposition : **Aldo**, l'apprenti humain, grand, maladroit et
   plein de bonne volonté ; **Brunhilde Marteau-d'Or**, la maîtresse naine, tresses rousses,
   bras couverts de brûlures, peu bavarde).
3. **Les armes interdites** : les trois proposées ci-dessus, ou d'autres idées ?
4. **Où choisir les armes du soir** : dans l'arrière-boutique en promenade (on va voir les
   forgerons), au bureau avec le reste, ou les deux ?

### Réponses du joueur (18/10)
- **Les 5 morceaux** : validés.
- **Le coût** : choix laissé à Claude → **A, les matériaux en gros** : une fois la forge construite,
  Thorgal vend au forgeron du comptoir des lots de 5 (fer, cuir, bois) à −30 %. Les recettes du
  tableau ne changent pas ; forger revient alors à environ 60 % du prix du marché, comme prévu.
  (Choisi parce que ça garde les recettes validées, fait vivre la relation avec Thorgal, et pousse
  à prévoir ses achats plutôt qu'à acheter au jour le jour.)
- **Les forgerons** : **Aldo**, l'apprenti humain ; **Baba Marteau-d'Or**, la maîtresse naine, au
  visage du sud et de l'orient (peau brune, cheveux noirs courts, yeux soulignés de khôl,
  anneau d'or au nez).
- **Les armes interdites** : les trois proposées (lame empoisonnée, lame de lune noire, griffes de
  l'ombre), pour l'instant.
- **Les armes interdites seulement avec la forge** : oui ; elles ne se fabriquent qu'une fois la
  forge achetée (et la jauge côté ombre). On choisit les armes du soir **à la forge, dans
  l'arrière-boutique** (on va voir les forgerons), avec un raccourci depuis le bureau.

### Ensuite : le lot A « Le comptoir sous pression »
Dans l'ordre : 1 la journée (10 heures, le temps de chaque action), 2 les avis de recherche
dans la file (le tableau d'affichage et les visages sont faits), 6 les imposteurs et le flair,
4 le marchandage.

## Lot A « Le comptoir sous pression » — préparatifs (18/10)

### État des lieux
- **Déjà là** : le nombre de clients par jour suit les paliers de réputation (3 → 10) ; l'éclairage
  donne +0,3 client par jour et par niveau ; le flair (il grandit avec l'expérience, le monocle
  l'aide) estime les trouvailles ; ce qu'un client te reverse, c'est une part de son butin
  (multipliée par la relation, le comptoir, la lanterne...) ; le tableau d'affichage et les huit
  bandits aux signes distinctifs (v0.74–0.75) ; Grippesou et son express.
- **Pas encore là** : le temps qui passe au comptoir, les recherchés qui viennent dans la file,
  les imposteurs, le marchandage.

### Le découpage proposé
1. **A-1 La journée** : une horloge au comptoir, de 8 h à 18 h (un soleil qui traverse la
   fenêtre, et le ciel qui rougit vers le soir). Chaque action prend du temps : servir 1 h (½ h
   avec l'expérience), un retour de mission ¼ h, marchander +½ h, inspecter +¼ h, l'Express
   de Grippesou +½ h. À 18 h, le comptoir ferme. La lanterne (éclairage) ajoute une heure le soir.
   Plus tard : l'apprenti au guichet, qui sert seul les commandes simples.
2. **A-2 Les recherchés dans la file** : de temps en temps, une tête mise à prix entre au
   comptoir, avec ses signes distinctifs (cache-œil, cicatrice...). À toi de la reconnaître :
   côté lumière, tu peux appeler la garde (la prime de l'affiche, de la réputation) ; côté ombre,
   tu peux le cacher dans l'arrière-boutique (il te le rendra : un objet interdit, un service) ;
   ou le servir comme si de rien n'était. Dénoncer un innocent coûte cher (réputation, relation).
3. **A-3 Les imposteurs et le flair** : certains clients mentent (un faux héros, une fausse
   quête) ; servis, ils disparaissent avec le baluchon et ne reviennent jamais. Des indices les
   trahissent (un équipement trop neuf, une arme qui ne va pas avec leur peuple, une histoire qui
   se contredit) ; « Inspecter » (+¼ h) en révèle plus selon ton flair, mais jamais à 100 %.
4. **A-4 Le marchandage** : le client annonce la part de son butin qu'il te reversera ; tu peux
   demander plus. Une jauge de patience descend à chaque demande ; ses tics trahissent s'il
   bluffe (il transpire, détourne le regard, tapote le comptoir) ; chaque peuple a son style (le
   nain est dur mais respecte qui tient bon, le hobbit pleurniche, l'elfe a peu de patience, l'orc
   menace, le gobelin bluffe tout le temps). Trop insister : il part fâché.
5. **Planches à valider** avant de brancher : l'horloge au comptoir, la scène du recherché
   (garde ou cachette), la fiche d'inspection, la jauge de marchandage et les tics.

### Questions au joueur (lot A)
1. **À 18 h, les clients qui attendent encore** : (A) ils repartent (un peu de réputation en
   moins) ; (B) ils reviennent le lendemain matin, en tête de file ; (C) ceux qui avaient écrit
   reviennent, les imprévus repartent.
2. **Les recherchés** : à quelle fréquence (proposition : un par semaine environ, à partir de la
   semaine 2) ?
3. **Les imposteurs** : à partir de quand et à quelle fréquence (proposition : dès le jour 5,
   environ un client sur douze, un peu plus quand ta réputation grandit) ?
4. **Le marchandage** porte bien sur **la part du butin** que le client te reversera au retour ?
5. **L'ordre** : A-1, A-2, A-3, A-4, ou une autre préférence ?

### Réponses du joueur (lot A, 19/10)
1. **À 18 h** : (C) ceux qui avaient écrit reviennent le lendemain, les imprévus repartent.
2. **Les recherchés** : environ un par semaine, mais jamais le même jour de la semaine.
3. **Les imposteurs** : oui aux propositions (dès le jour 5, environ un client sur douze, un peu
   plus quand la réputation grandit).
4. **Le marchandage** : sur la part du butin, **et aussi** sur les trouvailles que le voyageur
   propose de te vendre après son récit.
5. **L'ordre** : laissé à Claude (A-1, A-2, A-3, A-4).

### Planches du lot A validées (20/10)
- Les quatre planches (horloge, recherché, inspection, marchandage) sont validées telles quelles.
- **Narration** : quand c'est le jeu qui raconte (et non un personnage qui parle), le texte doit se
  distinguer clairement des dialogues au comptoir.
- **(Règle générale, planche 31)** partout dans le jeu, une petite différence entre la narration et les
  paroles : la narration en italique couleur de vieux parchemin, les paroles « ... » droites, plus claires et
  plus appuyées, même au milieu d'une phrase (`texteMixte`, et `texte()` du marché noir le fait tout seul).
- **(Planche 31)** la vision des parents a son cadre à elle (pas les bulles de nuage des récits) : un voile de
  fumée violette qui ondule autour d'un ovale, des poussières d'or, un battement de cœur, l'image qui tangue ;
  le souvenir du feu brûle comme un vieux parchemin avant le réveil (les paupières qui se rouvrent).
- **Le sablier** sur les boutons : parfait.
- **Le recherché caché** : la garde passe ensuite le plus souvent (forte probabilité), mais pas à chaque fois.
- **L'inspection** : le joueur choisit entre deux façons : observer discrètement (¼ h, sans risque) ou
  fouiller franchement (immédiat, plus d'indices, mais un client honnête se vexe).
- **Les imposteurs** : plusieurs arnaqueurs différents, et plusieurs clients honnêtes qui ont l'air louches,
  chacun avec ses ruses et ses dialogues.

## Bêta-test avec des amis (19/10)

### À corriger ou améliorer (lot bêta, v0.84)
- Bugs : la banque peut figer le jeu ; en entrant dans la banque, un prêt peut se prendre tout seul ;
  au premier dialogue avec Garrick on ne peut pas cliquer « Compris » (il faut changer de pièce) ;
  la musique de la banque et celle de l'Express restent quand on change de pièce (vérifier toutes
  les musiques) ; les étals de Marceline la couturière et de Firmin le brocanteur ont leurs
  provisions et leurs textes qui se chevauchent ; Ysolde la magicienne n'a presque pas de cheveux
  sous le chapeau ; faute d'orthographe sur « saine et sauve » au comptoir.
- Confort : en très gros zoom au marché, voir aussi les commandes prévues par lettre ; rendre les
  rangs (novice, aguerri...) plus clairs pour qui ne les connaît pas ; une musique triste pour le
  récit d'un héros mort ; plus de confirmation pour les objets en plus dans les provisions ; un
  message bien visible quand on n'a pas assez d'argent ; l'amélioration de l'étagère dit combien
  de places on gagne ; « bourgmestre » devient « bourgmastre » ; voir sa dette à la banque ;
  potions revendues après un récit à ×1,1 au lieu de ×1,5 ; un objet à réparer bien visible ;
  refuser un client à qui on a déjà donné des objets demande confirmation (en rappelant que ces
  objets sont perdus) ; racheter partout au marché en vue mi-zoomée (et toujours de près sur
  l'étal) ; confirmer avant d'envoyer un voyageur sans provisions ; voir sa réserve chez le
  colporteur ; toujours mieux faire sentir le gain de lumière et d'ombre.
- Planches à valider : un curseur de souris dans le thème du jeu ; la progression des héros au
  retour façon RPG (comme Dispatch : l'expérience d'avant, ce qu'elle gagne, le rang qui monte) ;
  après le premier visionnage d'un récit, le choix entre la cinématique et une fiche résumé de
  l'aventure ; une porte dans l'arrière-boutique pour sortir dans la rue.

### Lumière et ombre : un vrai système de points, et un choix clair (à réfléchir, 19/10)
Le joueur (19/10) : il faut une façon *complète* de gagner des points de lumière ou d'ombre, et que
le choix de rejoindre un camp soit plus clair. Les gains plus visibles (v0.84) lui plaisent aussi.

**Aujourd'hui** : la jauge ne bouge qu'avec les missions réussies en terres de lumière ou d'ombre,
les âmes offertes à la Faucheuse et les objets marqués achetés. Le camp se scelle avec la 9e pièce
d'armure. C'est peu, et le joueur ne voit pas qu'il choisit.

**Proposition de Claude**
1. *Toutes les grandes actions comptent*, avec un barème connu :
   - ☀ lumière : mission réussie en terre de lumière (+3) ; dénoncer un recherché à la garde (+4,
     lot A) ; donner au mendiant (+1, une fois par jour) ; soigner un héros sans le faire payer (+1) ;
     dédommager une famille généreusement (+2) ; répondre à un message de détresse (+3, lot C) ;
     refuser le pizzo ou un service de la Main Noire (+2) ; vendre un objet du bien (+1).
   - ☾ ombre : mission réussie pour les Bannis (+3) ; âme offerte (+5) ; cacher un recherché (+4,
     lot A) ; vendre une arme interdite au marché noir (+2) ; glisser un objet piégé (+2) ; rendre un
     service à la Main Noire (+2) ; vendre un objet de l'ombre (+1).
2. *Le Carrefour* : la première fois que la jauge franchit un palier (d'un côté ou de l'autre), deux
   émissaires viennent le même soir : le héraut de la Confrérie et un messager des Bannis. Chacun dit
   ce que son camp offre (une page claire : remises, clients, objets, quêtes, ce qu'on perd chez
   l'autre camp). Le joueur peut **prêter serment** à l'un (ses gains comptent ×1,5 de ce côté), ou
   **rester libre** pour l'instant (il pourra prêter serment plus tard, au bureau).
3. *Le livre des deux voies*, au bureau (dans « Lumière et ombre ») : les paliers de chaque côté et ce
   qu'ils débloquent, le barème ci-dessus, et ce qui a fait bouger la jauge ces derniers jours.
4. *Les choix qui comptent se voient* : un petit ☀ ou ☾ sur les boutons des choix qui font bouger la
   jauge (au comptoir, au marché noir, avec la Faucheuse, avec les recherchés).
5. *Le point de non-retour annoncé* : quelques jours avant le sceau (la 9e pièce d'armure), Garrick
   prévient : « bientôt, ton camp sera scellé ».

**Questions au joueur**
1. Le Carrefour et le serment : oui ? À quel moment (au premier palier franchi, ou à un jour fixe) ?
2. Peut-on rester neutre jusqu'au bout ? Si oui, que gagne-t-on (par exemple : les deux marchés, mais
   aucune récompense de palier) ?
3. Les ☀ / ☾ sur les boutons : les montrer (le joueur sait ce qu'il fait) ou les garder cachés (il
   ne le découvre qu'après) ?
4. Le barème te va-t-il, ou certaines actions doivent-elles peser plus ?

### Lumière et ombre : réponses du joueur (19/10)
- **Tout le système est validé** : le barème, le Carrefour et le serment, le livre des deux voies, les
  ☀ / ☾ sur les boutons des choix (en pixel art), l'avertissement de Garrick avant le sceau.
- **Le livre des deux voies** montre seulement le palier suivant de chaque côté (ce qu'il offrira) ;
  les paliers d'après restent cachés : mystère et découverte.
- **Le Carrefour** : il y a 3 paliers de chaque côté (25, 60, 90 points) ; le Carrefour vient au
  **2e palier** (60), d'un côté ou de l'autre.
- **Les ☀ / ☾ sur les boutons** ne se voient qu'avec assez de flair (une faculté débloquée par
  l'expérience), bien avant le moment du choix de camp.
- **Le barème** : ce sont les points que chaque action rapporte (ex. mission en terre de lumière
  +3 ☀, âme offerte +5 ☾, cacher un recherché +4 ☾...), listés plus haut.
- **La fin neutre** (idée du joueur) : le joueur qui ne bascule jamais assez d'un côté remet l'armure
  au bras droit guerrier du Grand Sage. Plus tard, on apprend que ce guerrier a « dompté » le dragon
  (qui appartenait en fait au Grand Sage) et qu'ils ont anéanti les forces des Bannis : la paix
  revient sur les contrées... une fausse paix. Le joueur ne sait rien du complot, n'a pas de combat
  final avec son armure, et n'a jamais eu à choisir.
  Points à préciser (proposés par Claude) : être neutre = ne pas avoir prêté serment au Carrefour (ou
  ne jamais l'avoir atteint) et rester sous le 2e palier quand l'armure est complète ; quelques
  indices pour donner envie de rejouer (une ligne étrange de la gazette, un clin d'œil de la
  Faucheuse) ; ce que deviennent la Main Noire et la Faucheuse pour un joueur neutre ; si le comptoir
  continue après la fin (partie libre).
- **Réponses du joueur sur la fin neutre (19/10)** :
  1. Oui aux propositions, et **une zone de neutralité** au milieu de la jauge (entre la lumière et
     l'ombre), visible comme telle.
  2. **Des indices en plus seulement pour ceux qui ont fini le jeu en neutre** (Claude : un sceau
     gardé dans le navigateur, d'une partie à l'autre, qui débloque des lignes étranges de la gazette,
     des rêves, des phrases de passants, à la partie suivante).
  3. **La Main Noire disparaît** sans qu'on sache où elle est partie. **La Faucheuse se moque** du
     joueur neutre, qui n'a pas eu le cran de choisir ; à la fin, le Grand Sage ayant conquis toutes
     les terres, une conversation en cinématique où la Mort dit, d'une façon poétique et presque
     déçue (étonnant pour elle), que les puissants sont ses meilleurs clients.
  4. **Le joueur peut continuer à jouer** après la fin ; plus tard, plus d'easter eggs et de choses à
     découvrir pour la partie libre.

### Lumière et ombre : réponses sur les planches 16 (16/10)
1. **Zone neutre** de −25 à +25 : validée. Le blanc du milieu doit **se fondre progressivement** dans
   les deux camps (plusieurs teintes blanc → jaune côté lumière, blanc → violet côté ombre), au lieu
   de trois aplats.
2. **La fin neutre** = pas de serment + dans la zone neutre au sceau : validée, **à condition que
   chaque combinaison ait une issue logique** (vérifié par Claude, ci-dessous).
3. **Le barème** : validé si l'équilibrage tient (simulation à faire : le joueur ne doit pas monter
   trop vite d'un côté), et **à présenter du plus petit gain au plus gros**.
4. **Le Carrefour** : offres validées. Il doit être **un moment exceptionnel, au design unique**, qui
   marque le début d'un nouvel axe du jeu : une **cinématique** avec un membre de la Confrérie et un
   membre des Bannis, puis une **page de choix épique**. Deux pistes aimées : le chemin qui se sépare
   entre le jour et la nuit (préférée) et les deux vitraux. Claude propose une planche.
5. **Seuil de flair** de 40 % pour voir les ☀ / ☾ sur les boutons : validé.

**La fin neutre, toutes les combinaisons (vérifiées par Claude)** — les deux conditions sont
indépendantes, les quatre cas existent donc vraiment :

| Au sceau (9e pièce) | Dans la zone neutre | Hors de la zone neutre |
|---|---|---|
| **Sans serment** (libre, ou Carrefour jamais atteint) | **Fin neutre** | Camp scellé du côté où l'on penche, sans les bonus du serment |
| **Avec serment** | Le serment l'emporte : camp juré scellé (Garrick et le camp juré te reprochent ta tiédeur) | Même côté : camp juré scellé. Côté opposé : impossible, voir le parjure |

- **Incohérence trouvée dans le code actuel** : la 9e pièce est retenue tant que la jauge est dans la
  zone neutre (« on ne te scelle pas sans que tu aies choisi », audit v0.54). Avec la fin neutre, un
  joueur neutre n'aurait donc jamais eu son sceau. À changer : la 9e pièce arrive normalement (après
  le jour 24), et rester neutre devient un vrai choix, annoncé par Garrick à la 8e pièce.
- **Le parjure** (proposé) : un joueur qui a juré à un camp et qui passe le 1er palier de l'autre côté
  (au-delà de −25 pour un serment à la Confrérie, de +25 pour les Bannis) rompt son serment :
  cinématique courte, bonus perdus, les deux camps se méfient de lui. Il redevient « libre », et l'on
  retombe dans la première ligne du tableau.

**Équilibrage du barème (simulation de Claude, 16/10, 60 parties × 120 jours par stratégie)**
- **Sans frein**, un joueur engagé côté lumière atteint le Carrefour (60) vers le **jour 19** et le
  3e palier (90) vers le **jour 21** : beaucoup trop vite (le sceau ne vient qu'après le jour 24).
  Le premier responsable : le dédommagement (+2), très fréquent puisque les morts le sont.
- **Proposé** :
  1. le dédommagement passe à **+1** ;
  2. un **frein** : jusqu'au 1er palier chaque point compte en entier, entre 25 et 60 il compte
     **×0,4**, au-delà de 60 **×0,25** (les points qui te ramènent vers le centre comptent toujours
     en entier : on peut revenir, se racheter, ou rester neutre) ;
  3. le serment multiplie par 1,5 les points de ton côté (après le frein).
- **Avec ces réglages** (jour médian, joueur qui joue franchement un camp) :

  | | 1er palier (25) | Carrefour (60) | 3e palier (90) |
  |---|---|---|---|
  | Lumière | jour 14 | jour 25 | jour 64 (46 avec serment) |
  | Ombre | jour 14 | jour 41 | jour 74 (63 avec serment) |
  | Joueur qui ne choisit pas | jour ~66 | jamais | jamais |

  La lumière va un peu plus vite que l'ombre : c'est le chemin que le monde encourage (et c'est un
  mensonge, cf. « Le grand retournement »). À garder ainsi, ou à resserrer (au choix du joueur).
  Les chiffres seront revérifiés avec la partie automatique une fois le système branché.
- **Le barème, du plus petit au plus gros** :

  | ☀ Lumière | | ☾ Ombre | |
  |---|---|---|---|
  | Donner au mendiant (une fois par jour) | +1 | Offrir une âme à la Faucheuse | +1 |
  | Soigner sans faire payer | +1 | Un piège, un service de la Main Noire | +2 |
  | Dédommager généreusement | +1 | Mission réussie pour les Bannis | +3 |
  | Mission réussie en terre de lumière | +3 | Cacher un recherché | +4 |
  | Dénoncer un vrai recherché | +4 | | |

**Validé par le joueur (16/10, suite)** : les planches 17 (cinématique des deux visiteurs, page du
Carrefour jour/nuit et vitraux, après le serment), la jauge en dégradé, le parjure, le frein par
palier et le dédommagement à +1. La lumière qui va un peu plus vite que l'ombre est gardée : elle sert
l'histoire (c'est le chemin que le monde encourage).

**Qui peut jurer quoi au Carrefour (validé le 16/10)** : on ne peut jurer que du côté
où penche sa balance. Le Carrefour vient quand la jauge atteint 60 d'un côté ; le chemin d'en face
reste visible, mais il est barré (barrière, vitrail grisé et cadenassé, « Ce chemin t'est fermé : ta
balance penche vers la lumière »). Le joueur choisit donc entre **prêter serment à son côté** et
**rester libre**. La page montre les deux chemins pour faire sentir le passage d'un côté ou de
l'autre. Planche : planche-17-carrefour-chemin-ferme.png.
- Rester libre n'est pas définitif : si la jauge redescend sous 60 puis atteint 60 **de l'autre
  côté**, le Carrefour revient avec l'autre camp ; et le camp refusé fait **une dernière offre** au
  3e palier (90) de son côté.
- Pour changer de camp après un serment, il faut passer par le parjure.

**À faire : la jauge de la Mort, concrètement** (à proposer en planche) : ce qui la fait monter
(morts voulues, âmes offertes) ou non (accidents), ses degrés (ceux de la Faucheuse aujourd'hui),
ce qu'elle débloque pour les combats de la fin (un pouvoir, une arme, un familier... ou rien),
et où on la voit (au livre des deux voies ? une page à part ?).

### Récit : réponses du 16/10 (9¾ bis)
- **La Faucheuse et la jauge de la mort** : une âme offerte ne compte plus que **+1 ☾** dans la jauge
  lumière/ombre (la mort reste un thème de l'ombre). À la place, **une jauge à part, la Mort**, mesure
  ta relation avec la Faucheuse (elle s'appuie sur ses degrés actuels). Elle ne monte qu'avec les
  morts **voulues** (envoyer quelqu'un à la mort, l'âme offerte), pas avec les accidents. Pour les
  combats de la fin, la Faucheuse t'offre selon cette jauge **un pouvoir, une arme, un familier**...
  ou rien du tout si la relation n'a pas vraiment avancé (un joueur qui n'a eu que des accidents).
- **Garrick change complètement selon ton camp** : dialogues, visites, comportement.
  - **Côté lumière** : il est déçu de toi, et de lui-même (il n'a pas réussi à te ramener
    discrètement vers l'ombre) ; colère plus marquée au palier maximal de lumière. Il s'éloigne à
    mesure que tu parles avec les hauts membres de la lumière, et il cesse complètement de te parler
    quand tu rencontres le Grand Sage : une cinématique où il t'explique qu'il ne pourra plus te voir.
  - **Côté ombre** : l'inverse. Vous vous rapprochez, tu le vois de plus en plus souvent, tu en
    apprends plus sur l'histoire du monde, et ses théories, qui sonnaient complotistes au début, font
    de plus en plus sens.
  - Le reste est encore à définir.

### Règle générale : un grand moment = une cinématique (16/10)
Chaque grand changement ou grand choix du jeu a sa **cinématique et quelque chose de visuellement
différent** pour marquer le coup : la découverte du marché noir, la nymphe de la fontaine, chaque
pièce d'armure, le Carrefour, et tout autre événement important à venir. À revoir pour ceux qui
existent déjà (le marché noir n'a qu'une phrase du Passeur, par exemple) : planches à faire.

### Retours du 19/10 (suite)
- **Les rats** : au réveil, une phrase qu'on ne rate pas (« Cette nuit, tu as entendu de petits êtres
  grignoter... », « Quand le chat n'est pas là, les souris dansent... »), en tête des nouvelles du matin.
- **La porte d'entrée** : plus grande que celle de la chambre ; quatre modèles qui suivent la maison
  (chaumière, maison, belle maison, demeure), les mêmes vus de la rue et de l'arrière-boutique.
- **Les passants de la rue** ne parlent que si on clique dessus (comme au marché).

### Retours du 16/10 (lot v0.91)
**Faits (v0.91)** : provisions « fantômes » derrière la page 1 du comptoir ; la lueur de la fontaine, le
soir, ramenait chez soi après la nymphe (on revient maintenant dans la rue, devant l'arche) ; la nuit
de la fenêtre suit l'horloge (fermer à 14 h laisse le jour dehors) ; l'écriture d'un carnet de mort
tremble doucement (lisible) ; le bouton du matin s'appelle « Le marché » ; les relations « En froid »
et « Ennemis jurés » (au lieu de « Ne s'aiment pas » et « Pires ennemis ») ; le tableau du marché
porte une pastille rouge (le nombre de nouvelles) tant qu'on n'a pas lu les nouvelles du jour ; le
portrait de famille de la chambre : une pensée mélancolique de JeuneGoy à chaque clic ; l'étagère des
trophées dit ce qu'on y a et comment en gagner ; au marchandage, un client à bout de patience ne part
plus qu'une fois sur quatre (sinon il s'en tient à son dernier mot).

**Les parents de JeuneGoy (idée du joueur, à écrire)** : ils étaient humains, mais faisaient partie
des « forces maléfiques » ; ils ont combattu le Grand Sage à l'époque et n'ont pas survécu. JeuneGoy,
lui, croit qu'ils l'ont abandonné ou qu'ils ne voulaient pas de lui. (Garrick sait quelque chose :
il change de sujet quand JeuneGoy parle d'eux.) À tisser avec le grand retournement et le sort d'oubli.

**Les trophées (règle actuelle, maintenant dite en jeu)** : chaque aventurier qui devient frère ou sœur
de sang rapporte un trophée de ses aventures (12 en tout), posé sur l'étagère de la chambre. À
enrichir plus tard (proposé) : un trophée rapporté aussi par une quête personnelle réussie, et une
petite fiche par trophée (qui, quand, où).

**La nymphe : la logique d'aujourd'hui, et ce que Claude propose**
- Aujourd'hui : 5 vœux pour la première visite, puis une visite tous les 10 vœux, sans fin. Chaque
  visite **renouvelle la bénédiction 7 jours** (+15 % aux épreuves de rivière et de sangsues, et
  quand il manque une gourde) ; le coquillage n'est offert qu'à la 1re visite ; les 3 premières
  visites racontent un secret, ensuite elle ne dit plus que deux phrases. On ne voit nulle part la
  bénédiction ni ce qu'elle a donné.
- Proposé : (1) **un plafond** — après la 4e visite, ses paroles annoncent qu'elle a tout dit ; les
  pièces suivantes s'entassent au fond (un compteur), et la fontaine brille d'elle-même les jours de
  bénédiction ; (2) **voir la bénédiction** : une goutte bleue dans le bandeau du haut tant qu'elle
  dure (un clic : « Bénie de la nymphe jusqu'au jour X : … »), une ligne dans le récit quand elle
  aide (« L'eau s'écarte devant lui... »), et une ligne au bureau (« Toi ») ; (3) **ses cadeaux** :
  le coquillage sur l'étagère de l'arrière-boutique (déjà), plus un 2e souvenir à la 4e visite (une
  fiole d'eau de la fontaine : +1 cœur de soin, une fois par semaine).
  → **à valider par le joueur.**

**La persuasion (proposée par Claude, à valider)** : une nouvelle compétence au bureau (« Tes
compétences »), qui monte avec les marchandages réussis (comme le flair avec l'expérience).
Elle donne : +1 de patience au client par niveau (max +2), une chance qu'il lâche 5 % de plus même
au-dessus de sa limite (rarement), et elle réduit encore la chance qu'il parte fâché.

**À montrer en planches** : l'enseigne du comptoir qui s'améliore avec la maison (4 niveaux) et le
choix de la police de l'enseigne ; les ambiances sonores de l'écran titre (oiseaux, cigales, ruisseau,
vent dans les blés) ; les couleurs du ciel heure par heure (matin, midi, après-midi, fin de journée,
crépuscule, nuit).

### Retours du 17/10 (lot v0.93)
**Réponses aux questions**
- **Les aînés au marché noir** : ils n'arrivent qu'**à partir du jour 30** (le milieu du jeu) ; ensuite, à
  chaque descente au marché noir, une chance sur trois qu'un aîné soit au coin des doyens (à gauche de la
  cave), et très rarement (4 % par jour) un aîné passe au comptoir. Chacun ne raconte qu'une fois. Être
  du côté de la lumière ne les empêche pas : ça rend seulement le marché noir **plus rare** (un soir sur
  trois au lieu d'un sur deux quand on penche vers l'ombre). Ton ami ne les a pas encore vus parce qu'il
  n'a pas atteint le jour 30.
- **Comment on améliore la maison entière** : c'est déjà défini et en jeu. Chaque amélioration achetée
  au bureau (« Améliorer le comptoir » : l'étagère de la réserve, le comptoir, l'éclairage, le coffre, la
  chambre...) compte, sauf l'atelier ; **tous les 4
  niveaux d'amélioration, la maison monte d'un niveau** (chaumière → maison → belle maison → demeure),
  avec la rénovation (la visite façon livre) et, depuis la v0.93, l'enseigne qui va avec.
- **+10 clients par jour au jour 17** : le palier de réputation (7 à 8 clients), les bonus (+2), les
  lettres (environ 3) et ceux qui revenaient de la veille s'additionnaient, au-delà des 7 à 9 qu'une
  journée de 10 h à 18 h permet de servir. Corrigé en v0.93 (voir le tableau).

**Le mendiant : ce que Claude propose (validé le 17/10, construit en v0.93 sauf l'aventure de Brisquet)**
- **Qui il est** : un ancien compagnon d'armes des parents de JeuneGoy, du temps où ils combattaient le
  Grand Sage. Le sort d'oubli lui a pris son nom et son passé, mais pas tout à fait : il se souvient par
  bribes, et il reconnaît quelque chose dans ton visage. (Ça répond à « le mendiant, quelqu'un du passé ? »
  dans 9¾ bis.)
- **Ce que la générosité débloque** (le total donné, déjà compté) : 30 pièces → le trèfle (déjà) ;
  60 → il te regarde longuement : « Tu as les yeux de ta mère... » (une pensée à part, puis il se tait) ;
  100 → **une petite cinématique** : il te donne une médaille usée aux armes de tes parents (un souvenir
  pour l'étagère de la chambre, à côté du portrait), et une phrase sur la dernière bataille.
- **Brisquet** : à 10 rations, le chien t'attend un matin devant la porte et t'emmène ; c'est
  **la cinématique secrète** déjà prévue, vers l'aventure annexe hors de la carte (à écrire).
- **Une petite utilité, sans le rendre obligatoire** : une fois par semaine, si tu lui as donné quelque
  chose cette semaine-là, il chuchote une rumeur utile (une contrée où il se passera quelque chose demain,
  ou le visage du prochain recherché). Ne rien lui donner n'a aucune conséquence.
- **Au marché noir** (un soir sur quatre, déjà) : il parle à demi-mot ; si tu penches vers l'ombre, il a
  l'air triste et te le dit à sa façon.

**Planches 19 (validées le 17/10 ; la Faucheuse retirée de la feuille du jour pour garder la surprise)** : les retours du jour résumés d'un coup (quand deux retours ou plus
arrivent et que leurs récits sont déjà connus : un tableau, et « Écouter les récits » ou « Tout
encaisser ») ; la feuille du jour au bureau, onglet « Aujourd'hui » (ranger la file d'un coup — novices,
aguerris, héros ou lettres d'abord — ou chacun avec ses flèches ; les retours restent en tête et la
Faucheuse au bout) ; les sept fonds de l'enseigne sur les quatre niveaux de la maison.

### Préparation du lot B « L'année qui passe » (17/10, après la v0.93)
Ce qui existe déjà : le calendrier (4 mois de 28 jours, nommés Semailles, Moissons, Brumes, Givre ; la
date au bureau), les sauts de temps des paliers d'étoiles (28 jours, puis 1, 2, 3 ans), la cheminée et
le bois (une planche le soir, un réveil en forme), le chat, les employés et leurs salaires.

**B-1 Les saisons** (planche 20 : la façade aux quatre saisons)
- Le paysage, la façade, la rue et le marché changent de couleurs et de détails : fleurs et bourgeons
  (Semailles), blés dorés et grand soleil (Moissons), feuilles rousses et brume (Brumes), neige sur le
  toit, flocons et tas de bois (Givre).
- La saison se lit partout : une petite icône à côté du jour dans le bandeau, et la page « Calendrier »
  au bureau (le mois en grille, les fêtes marquées, le prochain grand rendez-vous).
- **Le premier matin d'une saison** : une petite cinématique sur la façade (les bourgeons qui s'ouvrent,
  la première neige qui tombe...) — un grand changement, un moment à part.
- **Ce que ça change au jeu (proposé, léger)** : Semailles, rivières en crue (épreuves de rivière un peu
  plus dures) et plus de novices ; Moissons, rations et gourdes moins chères, mais la soif plus dure sur
  les routes ; Brumes, on se perd plus facilement (torches plus demandées), potions moins chères ;
  Givre, le froid (capes chaudes demandées), un client de moins par jour, et le bois de chauffage compte
  (voir le foyer).
- Pendant les sauts de temps : un défilé des saisons sur la façade pendant que le joueur grandit.

**B-2 Les fêtes du village** (une par saison, annoncées une semaine avant par le crieur et le tableau)
- **La Fête des Premières Pousses** (Semailles) : le marché fleuri, un concours du plus beau comptoir
  (tes décorations comptent), une prime et de la réputation.
- **La Foire des Moissons** (Moissons) : +3 clients ce jour-là, un étal de foire au marché (jeux et
  lots), les prix montent un peu.
- **La Nuit des Lanternes** (Brumes) : le village se souvient de ses disparus ; tu poses une lanterne
  pour chaque aventurier mort que tu as équipé (un moment calme, ☀ si tu en poses, et la Faucheuse passe
  au loin...).
- **Le Solstice du Long Hiver** (Givre) : un banquet ; offrir un cadeau à tes habitués fait monter leur
  relation ; Garrick vient trinquer.
- Chaque fête a son matin mis en scène (le décor de la rue et du marché change pour la journée), et
  respecte la règle « un seul grand rendez-vous par semaine ».

**B-3 La diseuse et le présage du jour** (un personnage unique de plus)
- Une vieille diseuse s'installe sous une tente violette dans la rue (petite cinématique de découverte :
  la tente qui s'ouvre, les cartes qui se retournent seules).
- Chaque matin, pour 2 pièces, elle retourne une carte : un **présage** pour la journée (« Le Corbeau :
  quelqu'un te mentira aujourd'hui » → un imposteur dans la file ; « La Roue : un retour inattendu » ;
  « La Tour : la garde passera cette semaine » ; « L'Étoile : un client généreux »...).
- Proposé : ses présages disent vrai le plus souvent, mais pas toujours (plus ton flair est haut, mieux tu
  les comprends). Elle en sait plus qu'elle ne le dit sur le sort d'oubli (un fil de l'histoire).

**B-4 Le foyer à nourrir**
- Une ligne « Le foyer » au bilan du soir, une fois par semaine : la gamelle du chat (une ration tous
  les trois jours, sinon il boude et ne chasse plus les rats), le bois de chauffage en hiver (une planche
  par nuit de Givre, sinon un réveil fatigué : un client de moins), les salaires (déjà là).
- Plus tard (étape 14, la vie du personnage) : la famille.

**Questions pour toi avant de commencer**
1. Les effets des saisons sur le jeu : légers comme proposé, ou plus marqués ?
2. Les fêtes : une par saison (4 par an) comme proposé, ou deux ?
3. La diseuse : ses présages toujours vrais, ou parfois trompeurs ?
4. Le foyer : le chat peut-il bouder s'il n'est pas nourri ? Et l'hiver sans bois, juste un réveil
   fatigué, ou plus sévère ?

Ensuite viendront les planches : les fêtes (le marché décoré), la diseuse (son portrait et sa tente),
le calendrier du bureau et la petite icône de saison.

### Réponses du joueur sur le lot B (17/10)
1. **Les saisons, plus marquées** : des arbres au premier plan dont les feuilles changent (bourgeons,
   pleine feuille, roux, branches nues et neige), beaucoup de fleurs au printemps, des blés l'été, un
   **bonhomme de neige** dans le décor l'hiver, etc. Et **une jolie cinématique de passage pour chaque
   saison** (quatre cinématiques).
2. **Les fêtes : une par camp**. Côté lumière, une fête **officielle et très festive** (le village, la
   Confrérie, des bannières, des lampions, de la musique) ; côté Bannis, une fête **plus discrète mais
   très conviviale** (au marché noir, autour d'un feu, chants, partage). **Dates validées** : la fête de la
   lumière au solstice d'été (Moissons), celle des Bannis à la Nuit des Brumes (automne).
3. **La diseuse : parfois trompeuse**. Avec un flair à 100 %, de **tout petits indices**, pas dans ses
   paroles mais **dans le décor de l'animation du présage** (la flamme de la bougie qui vacille, une carte
   à l'envers, le chat de la diseuse qui détourne la tête...).
4. **Le chat peut bouder** s'il n'est pas nourri : par exemple il part un jour, et le joueur en est
   prévenu (une notification, un mot, sa gamelle vide...). **L'hiver sans bois doit être sévère**, mais le
   joueur doit être **mieux averti** quand il n'a pas mis de bûches.

### Idées du joueur (17/10)
- **Le chat amoureux** (quête annexe) : un jour, le chat disparaît ; le joueur lance une petite quête et
  découvre que le chat s'est trouvé une **compagne**, qui est **en danger** (noyade, prédateurs, accident :
  à choisir) et qu'il faut sauver. Plus tard, le couple a **deux petits** (une fille et un garçon). Le
  joueur peut **renommer tous les chats**, et aménager une **petite maison pour chats** avec leur espace.
- **L'étage** : la maison gagne un étage visible avec les améliorations ; on pourra exploiter cet espace
  pour de nouvelles fonctionnalités (la maison des chats, une nouvelle pièce...).
- **Le Carrefour à rééquilibrer** : le bonus de l'ombre est plus alléchant que celui de la lumière ;
  rendre la lumière plus attirante, et ajouter des bonus aux deux camps.
- **Plus tard** : plus d'améliorations, une nouvelle pièce (comme la forge ou l'atelier) ; le rival et le
  petit bar restent à faire (lot C).

### Le Carrefour rééquilibré (validé le 17/10, construit en v0.95 ; recel à +10 % au lieu de 20 %)
Aujourd'hui, après le serment : ×1,5 sur les gestes de son côté, et **Confrérie** : sa bannière au
comptoir et des taux d'ami à la Banque ; **Bannis** : la Main Noire prête **sans intérêts** (mais la garde
passe plus souvent). Les prêts gratuits pèsent plus lourd que des taux réduits : l'ombre est plus
alléchante. Proposé, en plus de ce qui existe :
- **Serment de lumière (la Confrérie du Dernier Rempart)**
  1. *Les pèlerins* : +1 client par jour (la Confrérie envoie du monde au comptoir).
  2. *Les clercs* : les soins coûtent moitié moins cher au retour des blessés.
  3. *La protection* : la garde ne fouille plus jamais ton comptoir (elle te sait loyal).
  4. *L'escorte* : une fois par semaine, un paladin accompagne une mission de ton choix (+1 cœur au
     départ), avec une petite scène au comptoir.
  5. *La bénédiction* : +10 % de butin dans les terres de lumière.
- **Serment d'ombre (les Bannis)**
  1. *La porte toujours ouverte* : le marché noir ouvre chaque soir.
  2. *Les receleurs* : les objets interdits se vendent 10 % plus cher.
  3. *Le Passeur* : une fois par semaine, il rapporte le baluchon d'un aventurier mort (ses objets
     reviennent dans ta réserve).
  4. *Les ombres* : +10 % de butin dans les terres d'ombre.
  (La garde qui passe plus souvent reste le prix à payer.)
- L'écran du Carrefour montrerait ces avantages sur chaque vitrail, pour qu'on choisisse en sachant.

### On le fera plus tard
- **Les instruments de musique** (idée du 16/10) : le joueur peut jouer d'instruments qu'il collectionne au fil de la partie. **3 instruments de base**, trouvables sans prérequis ; **2 instruments de lumière** et **2 d'ombre**, qu'on ne peut débloquer qu'après avoir **prêté serment** au camp correspondant (au Carrefour). (À préciser : où on les trouve, où et quand on en joue, ce que ça apporte.)
- **Plus de musiques** pour en enchaîner plusieurs et ne jamais lasser le joueur avec une seule.
- **Le jeu du forgeron** : quand la forge est achetée, le joueur peut forger lui-même, avec tout
  un mécanisme façon Kingdom Come: Deliverance 2 (chauffer au soufflet, sortir le métal à la
  bonne couleur, frapper en rythme sur l'enclume, tremper, aiguiser), en pixel art. À préparer :
  ce qu'il faut ajouter ou changer dans le jeu (voir la réponse de Claude du 19/10).
  **Ce qu'il faudra ajouter ou changer (analyse du 19/10)** :
  1. *Une scène de mini-jeu* « À l'enclume », lancée depuis la forge : chauffer au soufflet (la couleur
     du métal passe du rouge sombre au jaune ; trop blanc, il brûle), sortir la pièce au bon moment,
     frapper en rythme (une barre qui va et vient, des coups au bon endroit), étirer et plier, tremper
     au bon instant, aiguiser à la meule, monter la poignée.
  2. *Une qualité pour chaque arme* (0 à 100) : aujourd'hui une arme a seulement son usure et le
     « bel ouvrage ». La qualité du mini-jeu donnerait : 80 et plus = bel ouvrage ; moins de 40 = arme
     fragile (elle s'use plus vite). Les commandes exigeantes pourraient demander une qualité.
  3. *Du temps* : forger soi-même prend un moment (le soir, ou une ou deux heures de la journée avec
     l'horloge du lot A). C'est un choix : forger, ou servir au comptoir.
  4. *Une progression de forgeron pour le joueur* (apprenti → compagnon → maître) : chaque arme
     réussie fait progresser, et ouvre des recettes (les armes de peuple, puis les légendaires).
  5. *Peut-être une matière en plus* : le charbon (acheté chez Thorgal), pour que chauffer coûte un peu.
  6. *Aldo et Baba* : Aldo apprend plus vite quand tu forges avec lui ; Baba peut te donner des
     conseils (une « leçon » qui facilite une étape).
  7. *Des sons* (soufflet, braises, coups de marteau, trempe qui siffle) et une petite musique de forge.
  Questions à trancher plus tard : forger seulement le soir ? en plus d'Aldo et Baba ou à leur place ?

## La rue et le familier (validé par le joueur le 16/10)

- La rue devant le comptoir devient un vrai quartier qu'on parcourt avec son personnage (gauche-droite, comme la promenade du soir) : le marché, la banque, la forge de Thorgal, la fontaine, l'impasse du marché noir, plus tard le petit bar. Les raccourcis depuis la maison restent.
- **Le chat de gouttière** (premier familier) : certains soirs, il rôde dans la rue. On peut le nourrir (une ration) ; au bout de trois soirs, il nous suit et dort sur le coussin de l'arrière-boutique. Ses effets (validés) :
  - **Les rats** : sans chat, certains jours (rarement), des rats grignotent un peu de la réserve, seulement les choses comestibles (rations, gourdes, provisions). Jamais beaucoup : la perte doit rester légère, elle sert surtout à donner envie d'apprivoiser le chat. Une fois adopté, plus de rats.
  - **La garde** : le chat sent parfois venir la garde et prévient (il crache vers la porte la veille d'une fouille), ce qui laisse le temps de cacher les objets interdits. Pas à tous les coups.
- Les autres familiers (le grand aigle, etc.) viendront par les quêtes et les relations, comme prévu.

## Rendre le jeu plus palpitant (idées tirées des jeux de référence, décidées le 17/10)

Constat des simulations (v0.64) : le danger se concentre sur les jours 5 à 12 ; après le jour 20
l'argent s'envole (≈ 2 000 p. au jour 20, 7 500 au jour 30, 30 000 à 50 000 au jour 120) et plus
rien ne fait peur. Il faut des enjeux qui grandissent avec le joueur et des choix où l'on ne peut
pas tout avoir.

Réponses du joueur, idée par idée :
1. **La journée a une durée** — oui, mais on doit pouvoir servir bien plus de clients au jour 120
   qu'au jour 1 (paliers de réputation, rapidité, améliorations du comptoir).
2. **Le tableau d'affichage du marché** (« medieval notice board »), à côté du crieur (qui reste
   pour l'humour) : nouvelles du jour et tout ce qui touche le joueur ; une notification au-dessus
   du panneau quand il y a un changement important. Références : avis de recherche façon *One Piece*
   (« WANTED / Mort ou vif », portrait, prime) et petit panneau couvert de bois avec ses affiches.
3. **Le foyer à nourrir** (chat, apprenti, famille, bois de chauffage l'hiver) — oui pour tout.
4. **Marchander au comptoir** (jauge de patience, tics de bluff, style par peuple) — oui.
5. **Miser sur un aventurier** (avance contre une plus grosse part) — oui.
6. **Les imposteurs**, combinés au **flair** : un flair aiguisé les repère de loin, mais même au
   maximum on n'est jamais sûr à 100 %.
7. **La menace qui grandit** (attaque hebdomadaire, escouade à équiper, contrée perdue) — oui.
8. **Les commandes royales** (délai, très grosse prime) — oui.
9. **Agir pendant le récit** — le joueur est mitigé : réflexion à pousser (voir la proposition
   suivante), en gardant en tête le combat au tour par tour de la fin du jeu.
10. **Les saisons** — oui ; trouver un système qui fasse avancer le temps de façon satisfaisante
    malgré les sauts de temps par palier d'étoiles.
11. **Les fêtes du village** — oui.
12. **Les collections du Conseil** — oui, contenu à définir.
13. **Le présage du jour** (une diseuse, un personnage unique de plus) — oui.
14. **Le comptoir rival** — oui : un personnage très énervant (physique, dialogues, comportement).
    Le battre = pouvoir **le racheter** : offrir le shop à des orphelins, ou en faire un bâtiment de
    plus pour le joueur (à définir).
15. **Des prix qui suivent la renommée** — oui, à tester.
- Question du joueur : tout inclure, est-ce trop ? Des mécaniques se contrent-elles ? → **tranché** :
  tout garder, avec trois garde-fous validés : (a) chaque action au comptoir reste courte (le temps
  est le prix du choix, pas une corvée) ; (b) **un seul grand rendez-vous par semaine** (menace,
  commande royale, fête ou collection, tour à tour selon le calendrier) ; (c) foyer, mises, prix et
  rival réglés ensemble par la simulation.

### Décisions validées (17/10)
- **1 La journée** : 10 heures ; servir 1 h (½ h avec l'expérience), marchander +½ h, inspecter +¼ h,
  Grippesou +½ h. Plus de clients avec la réputation (paliers 3 → 10), plus vite avec l'expérience,
  plus de temps avec les améliorations (lanterne pour fermer à la nuit, apprenti au guichet pour
  les colis simples). Jour 1 : 3-4 clients tranquilles ; jour 120 : 10-12 en choisissant.
- **2 Le tableau** : le crieur lit le gros titre ; le panneau a toujours la même structure
  (nouvelles, règles du jour, prix qui bougent) ; avis de recherche « Mort ou vif » avec portrait
  et prime : un visage recherché peut venir dans la file (lumière : le dénoncer pour la prime ;
  ombre : le cacher, il te le rend) ; un « ! » au-dessus quand un changement important arrive.
- **9 → les messages de détresse** (avec l'étape 11 « aider pendant l'aventure ») : un pigeon
  arrive au comptoir pendant une mission (« Borin est coincé, il lui faut 2 torches ») ; on aide
  (aigle, mercenaire : argent et temps de journée) ou non ; le récit montre la conséquence. Pas de
  contrôle direct dans les récits : le combat au tour par tour reste pour la fin du jeu.
- **10 Les saisons** : les 4 mois de 28 jours sont les 4 saisons (Semailles, Moissons, Brumes,
  Givre) ; les sauts de temps (28 j, puis 1, 2, 3 ans) tombent juste. Calendrier visible (date,
  saison, prochaine fête), matin de changement de saison mis en scène (première neige, bourgeons),
  et pendant les sauts de temps un défilé des saisons sur la façade pendant que le joueur grandit.
- **14 Le rival** : le racheter ; son shop devient **le petit bar** (étape 12) ; ou l'offrir aux
  orphelins (réputation, peut-être des petits coursiers : à voir).

### L'ordre (laissé à Claude) : après 10c puis 10b
- **Lot A « Le comptoir sous pression »** : 1 la journée, 2 le tableau et les avis de recherche,
  6 imposteurs et flair, 4 le marchandage.
- **Lot B « L'année qui passe »** : 10 les saisons, 11 les fêtes, 13 la diseuse, 3 le foyer.
- **Lot C « Les grands enjeux »** : 7 la menace, 8 les commandes royales, 5 les mises, 15 les prix,
  14 le rival (et le bar), 12 les collections, 9 les messages de détresse.

### « On le fera plus tard »
- **La Faucheuse et le Grand Sage** (vers la fin du jeu, dit le 17/10) : si la relation avec la
  Faucheuse est au plus haut (Éprise), une petite conversation où elle dit qu'elle adore le Grand
  Sage, pour tous les « cadeaux » qu'il lui a offerts sans même qu'elle les demande ; elle-même
  n'aurait pas fait mieux. Elle fait allusion au massacre des forces « soi-disant maléfiques », mais
  reste floue : des indices, jamais la vérité dite en face (lien avec le grand retournement).
- **La nymphe de la fontaine** (idée du joueur, 17/10) — **construite en v 0.67, voir 10c++** : après 5
  vœux (5 pièces jetées dans la fontaine du marché, 5 jours différents), un soir l'arche du marché
  s'ouvre sur la place endormie ; la fontaine luit, et une nymphe des sources et des rivières en sort.
  Elle offre une bénédiction (par exemple : pendant 7 jours, les épreuves d'eau — rivières, marais,
  soif — réussissent mieux) et un souvenir pour l'étagère (un coquillage qui chante, une larme de
  source...). Elle pourrait revenir plus tard (tous les 10 vœux) et, discrètement, savoir quelque
  chose du sort d'oubli. Le cœur de la cheminée, le coût du bois, l'hiver : avec le lot B.
- **Les cinématiques de découverte** (idée du joueur, 17/10 ; liste proposée par Claude, à valider) :
  chaque personnage unique a son petit moment quand on le découvre, pour souligner son importance.
  Trois tailles : **petite** (5–10 s : un plan, un geste, une réplique, un jingle), **moyenne**
  (20–40 s : deux ou trois plans, une transformation ou une entrée en scène), **grande** (1 min et
  plus : plusieurs plans, musique propre, un choix ou une révélation). Faites : Garrick (l'intro,
  grande), la nymphe Ondine (moyenne, v0.67). Proposées :
  - **Grandes** : la **Faucheuse** (le comptoir s'assombrit, les bougies s'inclinent, sa faux passe
    la porte avant elle) ; le **Grand Sage** (sa venue au village, cortège du Conseil, cloches) ; la
    **Bête** (à l'Antre ★6 : les yeux dans le noir, puis le souffle).
  - **Moyennes** : le **chef de la Main Noire** (la table du fond, la main gantée qui pose la carte
    noire) ; les **deux chefs du Serpent à deux têtes** (ils entrent par deux portes à la fois) ;
    **Thorgal** à sa forge (le marteau, la gerbe d'étincelles, le premier « bel ouvrage ») ; le
    **Passeur** (la porte dérobée qui s'ouvre, la lanterne qui se lève sur sa capuche).
  - **Petites** : **Grippesou** et **Thorgrim** à la banque (le monocle qui brille), **Marcelline**
    (la garde-robe qui s'ouvre comme un rideau de théâtre), **Brisquet** le chien (il vole une
    saucisse), le **crieur** (sa cloche, la première gazette), le **mendiant** (sa première
    prophétie), le **chat** (le premier ronron, à l'adoption), chaque **héros légendaire** à sa
    première venue (son nom écrit en or).
- **Entrer chez les PNJ** (dit le 17/10, pour plus tard) : quand la relation est au maximum, on peut entrer dans leur maison (la rue du soir et du jour) : un intérieur à leur image, une petite scène, un cadeau ou un secret.
- **La banque de noms** (vers la fin des étapes) : le joueur fournira prénoms, noms, noms de villes
  et expressions à insérer dans le jeu.


### Le « house keep » (convenu le 17/10)

Quand le joueur dit « house keep », cela veut dire : optimisation et nettoyage du code si besoin, recherche de bugs et de gels, d'incohérences de récit ou de visuel, de déséquilibres ; tout ce qui peut aider le jeu à fonctionner parfaitement. À faire aussi d'office après chaque tâche terminée.

### Les mécanismes proposés par le joueur (règle du 17/10)

Quand le joueur propose de changer un mécanisme, Claude dit franchement s'il a un doute (simulation à l'appui si possible) avant ou pendant le changement, et propose de revenir en arrière si le résultat est moins bon. Exemple : la réputation perdue à la mort (v0.94 : −2/−1, trop punitif en simulation ; v0.96 : −1,5/−0,5, un compromis).

### Plan du lot B « L'année qui passe » (préparatifs du 17/10, après la v0.96)
Ordre : d'abord les planches (à valider), puis la construction en cinq morceaux, testés un par un.
On pousse sur Cloudflare après ces préparatifs et le grand house keep de la nuit.

**Les planches à venir**
- **Planche 21, les quatre passages de saison** (une petite cinématique chacune, en 3-4 images) :
  les bourgeons qui s'ouvrent et les pétales qui volent (Semailles) ; le soleil qui se lève sur les
  blés, les moissonneurs (Moissons) ; un coup de vent, les feuilles rousses et la brume qui monte
  (Brumes) ; les premiers flocons, le toit qui blanchit, des enfants qui font le bonhomme de neige (Givre).
- **Planche 22, les deux fêtes** : la Fête du Solstice (lumière, en Moissons : le village pavoisé,
  bannières de la Confrérie, lampions, musiciens) et la Nuit des Brumes (Bannis : au marché noir,
  un grand feu, des chants, on partage le pain).
- **Planche 23, la diseuse** : son portrait, sa tente violette dans la rue, l'animation du présage
  (les cartes qui se retournent) et les petits indices du flair (la bougie qui vacille, une carte à
  l'envers, son chat qui détourne la tête).
- **Planche 24, le calendrier et le foyer** : la page « Calendrier » du bureau (le mois en grille, les
  fêtes marquées), l'icône de saison à côté du jour, et l'avertissement « le foyer est vide ».
- **Planche 25, le chat qui boude** : la gamelle vide, le petit mot, le panier vide le lendemain, son retour.

**La construction**
- B-1 Les saisons : façade, rue, marché, paysage du comptoir ; arbres au premier plan, fleurs, blés,
  bonhomme de neige ; l'icône de saison et le calendrier.
- B-2 Les quatre cinématiques de passage (et le défilé des saisons pendant les sauts de temps).
- B-3 Les deux fêtes, annoncées une semaine avant (crieur, tableau d'affichage).
- B-4 La diseuse et ses présages (parfois trompeurs, indices selon le flair).
- B-5 Le foyer : le chat qui boude, l'hiver sans bois sévère mais annoncé.

**Propositions à valider**
1. Effets des saisons sur le jeu : ceux, légers, de la préparation (crues au printemps, soif l'été,
   brume l'automne, froid et un client de moins l'hiver), le visuel étant, lui, très marqué.
2. Hiver sans bois : 1re nuit sans bûche, réveil fatigué (un client de moins) ; 2e nuit de suite,
   malade (la boutique ouvre à midi) ; le chat part se réchauffer ailleurs. Averti : au coucher, une
   confirmation « Le foyer est vide, dormir quand même ? », et une bûche rouge dans le bandeau.
3. Les fêtes : celle de la lumière est ouverte à tous ; celle des Bannis seulement si le marché noir
   est connu, et le joueur y est mieux reçu selon sa jauge.
4. La diseuse arrive au jour 10 (une cinématique de découverte), 2 pièces le présage, une fois par jour.
5. Le chat boude après 3 jours sans ration : il part un jour (un mot sur le comptoir), puis revient.

### Réponses du joueur sur le plan du lot B (17/10)
1. **Effets des saisons : oui**, Claude choisit les conséquences concrètes :
   - **Semailles, les rivières en crue** : les épreuves de rivière sont plus dures sans corde
     (chance ×0,85 si l'aventurier n'est pas bien équipé), les cordes plus demandées dans les commandes,
     et plus de novices dans la file (le printemps des premiers départs).
   - **Moissons, la soif** : les épreuves de soif et de faim plus dures sans gourde ni ration (×0,85) ;
     au marché, rations et gourdes −20 % (la récolte).
   - **Brumes, la brume** : on se perd plus souvent (l'épreuve « Perdu » plus fréquente, plus dure sans
     torche, ×0,85) ; une mission sur dix dure un jour de plus (la brume retarde le retour) ; potions −20 %.
   - **Givre, le froid** : l'épreuve du froid plus dure sans cape chaude (×0,85), un client de moins
     par jour, et le bois du foyer compte (point 2).
2. **L'hiver sans bois : oui** tel que proposé (fatigué, puis malade et ouverture à midi, le chat part se
   réchauffer ; confirmation au coucher et bûche rouge dans le bandeau).
3. **Les fêtes : oui**, et chez les Bannis, **plus le joueur est du côté de la lumière, plus on sent
   qu'ils se forcent à être gentils** (sourires crispés, politesses appuyées, un regard échangé dans
   son dos, « Bienvenue... ami. »).
4. **La diseuse : oui** (jour 10, 2 pièces, une fois par jour).
5. **Le chat qui boude : oui**, et l'idée du **chat qui parle** (ci-dessous).

### Le secret du chat (idée du joueur, 17/10, « encore à peaufiner »)
- Quand le joueur atteint **la petite famille du chat** (la compagne sauvée, les deux petits), le chat
  révèle qu'**il savait parler depuis le début** : il attendait de voir si JeuneGoy était digne de
  confiance. Le mot qu'il laisse quand il boude était un premier indice.
- La scène : un **nouveau skin**, le chat **debout sur ses pattes arrière**, qui **s'allume un cigare**
  avant de parler. Une cinématique (grand changement).
- Son histoire : il appartenait à **un ancien sorcier** (le Grand Sage), mais il ne sait plus du tout qui
  c'était ; il sait juste que « c'était un bel enfoiré ». Un jour il s'est réveillé dans la ville de
  JeuneGoy, a erré, trouvé une compagne, puis JeuneGoy (un fil de plus vers le sort d'oubli).
- Il a gardé pour lui qu'il parlait et comprenait la langue commune, **pour sa sécurité et celle de sa
  compagne** : elle est au courant, mais ne fait pas confiance aux humains (sauf JeuneGoy, avec le temps).
- Son ton : **intelligent, mais perdu** par son manque de souvenirs. Sa compagne et ses petits **ne
  parlent que le chat**.
- Il aimerait retrouver **son vrai nom**, mais **le nom que JeuneGoy lui a donné lui plaît bien**.
- À placer avec la quête du chat amoureux (après le lot B) ; à peaufiner avec le joueur.

### Retours du joueur sur les planches 21 à 25 (17/10)
- **Planche 21 validée** (Givre · 1 retouché : les arbres presque dégarnis avant d'être nus).
- **Planche 22 validée** avec, dans la salle de la Nuit des Brumes, **des lanternes rouges partout** (à la
  chinoise) : la tradition des Bannis pour **honorer les ancêtres**.
- **Planche 23 validée.** La diseuse (Madame Ysmée) reste un mystère : **personne ne sait son vrai âge,
  d'où elle vient, son réel but, ni si elle a vraiment des pouvoirs** (à creuser plus tard, peut-être).
- **Planches 24 et 25 validées.**
- **Les prix des saisons, revus** (idée du joueur : ce qui manque coûte plus cher, pas moins) :
  - Semailles : les **cordes +10 %** (les crues) ; les **potions −10 %** (les herbes fraîches du printemps).
  - Moissons : les **gourdes +10 %** (l'eau est rare) ; les **rations −10 %** (la récolte).
  - Brumes : les **potions +10 %** (moins de plantes à cueillir dans les bois).
  - Givre : les **capes chaudes +10 %**.
  Claude a gardé une petite baisse au printemps et l'été (ce qui abonde vraiment) pour que chaque saison
  ait une bonne et une mauvaise nouvelle au marché ; l'automne et l'hiver n'en ont pas (les saisons dures).
- **Plus tard : l'atelier d'alchimie**, pour les potions, avec le même principe que la forge (inspiré de
  l'atelier d'alchimie de *Kingdom Come: Deliverance 2* : la recette pas à pas, les ingrédients, le
  chaudron, le temps de cuisson) ; **un seul employé** possible à engager pour les potions.

### Les fêtes, enrichies (idée du joueur, 17/10 ; prix des saisons validés)
Chaque fête dure **trois jours** (la veille, le grand jour, le lendemain) : décor, jeux, étals et tenues
n'existent que pendant ces trois jours. **Les tenues achetées sont gardées** dans la garde-robe (on peut les
remettre l'année suivante) ; ce sont les étals qui disparaissent.

**La Fête du Solstice (lumière, en Moissons) : « l'Union de la Confrérie »**
- Le marché en fête : guirlandes de fleurs sur chaque étal, bannières bleu et or, une estrade avec les
  musiciens, le défilé des paladins le grand jour.
- **Deux mini-jeux exclusifs** :
  1. *Le tir à l'arc de la Confrérie* : trois flèches, une cible, le vent qui tourne (viser au bon
     moment). Lots : pièces, un trèfle, et au meilleur score le titre « Œil du Rempart » (+réputation).
  2. *Le mât de cocagne* : grimper en rythme (cliquer au bon tempo) pour décrocher le jambon... ou un
     objet rare accroché tout en haut.
- **L'étal « Atours de l'Union »** : la couronne de fleurs du Solstice, l'écharpe bleu et or de la
  Confrérie, la cape blanche de l'Union (portées : +relation avec les clients de lumière ce jour-là).
- **Autres idées** : la tarte aux fruits du Solstice (un en-cas : +1 cœur au départ pour un client le
  jour même) ; la bénédiction du comptoir par un paladin (+réputation, le comptoir brille un jour) ;
  le soir, **les lanternes célestes** que tout le village lâche ensemble (la clôture de la fête).

**La Nuit des Brumes (Bannis, en Brumes) : « la nuit des ancêtres »**
- La salle du marché noir : le grand feu, **les lanternes rouges des ancêtres** partout, des tables de
  jeu, des conteurs.
- **Deux mini-jeux exclusifs** :
  1. *Les osselets des Bannis* : un jeu de dés en os, avec du bluff (miser, relancer, ou se coucher
     face à un gobelin qui triche un peu... et que le flair peut démasquer).
  2. *Le bras de fer de Mog* : tenir face à l'orc (cliquer en rythme sans craquer) ; gagner fait monter
     le respect des Bannis.
- **L'étal « Atours des ancêtres »** : le masque d'os ancestral, le châle de brume, la petite lanterne
  rouge à la ceinture (portés : +relation avec les clients d'ombre ce jour-là).
- **Autres idées** : l'hydromel noir et le pain de cendre (partagés autour du feu) ; **une lanterne
  pour chacun de tes aventuriers morts** (un moment calme, la Faucheuse passe au loin, ☾ si tu en
  allumes) ; le Passeur raconte une histoire des anciens (un fil de plus vers le sort d'oubli).
- Plus le joueur penche vers la lumière, plus l'accueil est forcé (et les gobelins trichent un peu plus
  aux osselets).

**Les deux camps se répondent** : un jeu d'adresse et un jeu de rythme (lumière) contre un jeu de bluff
et un jeu de force (ombre) ; trois atours chacun ; un moment de lumière (les lanternes célestes) contre
un moment de mémoire (les lanternes des ancêtres).


### Retours du joueur sur la planche 22 v3 (17/10, au coucher)
- **Tout est validé, y compris toutes les idées en plus**, sauf la maquette du **tir à l'arc**, trop simple
  et hors de la direction artistique : à refaire en pixel art, dans le décor du marché, avec JeuneGoy.
- **Les lanternes pour les aventuriers morts** (Nuit des Brumes), précisées par le joueur :
  - le joueur **paie chaque lanterne** et **choisit à qui il rend hommage** (parmi ses morts) ;
  - trois qualités, trois animations :
    - **basse qualité** : elle peine à s'envoler, hésite, retombe un peu, repart... (une touche d'humour) ;
    - **qualité moyenne** : elle monte droite et calme, c'est ce qu'il faut (une touche de sobriété) ;
    - **meilleure qualité** : beaucoup trop (« too much ») : des feux d'artifice, des gerbes d'étincelles,
      tout ça pour une seule personne ;
  - **les familles réagissent** au choix (une lanterne basse qualité ne convient que très rarement à une
    famille ; la moyenne honore ; la meilleure peut toucher... ou gêner) ;
  - le joueur peut **n'honorer personne** : la foule et les familles le voient d'un mauvais œil.
- **L'hydromel noir** (idée du joueur) : pendant le temps de la fête (à définir), le joueur peut en boire ou
  non. S'il boit, il finit complètement ivre et a **des visions de son enfance** : des bribes de ses parents,
  des moments joyeux, vite arrêtés par **le feu du dragon** qui dévore les derniers instants de la vision et
  le ramène à la réalité. Un ou deux anciens l'entourent, lui demandent si ça va, et lui disent en rigolant
  qu'il devrait boire encore un peu, que « cette boisson n'est que pour les vrais ». **Le joueur ne parle
  jamais dans le jeu** (règle générale).
- **Le Passeur** : un design propre à lui, **style un peu pirate** (références du joueur : Albator — la
  grande cape rouge en lambeaux, la cicatrice ; un capitaine pirate — le tricorne, le long manteau sombre à
  galons d'or, l'écharpe rouge à la taille, le sabre ; un corsaire — le foulard, les bottes hautes).

### L'hydromel noir et le pain de cendre (réponse de Claude, à valider)
- **Ce que Claude prévoyait** : l'hydromel noir était un geste de partage — en boire avec les Bannis fait
  monter leur respect (comme le bras de fer), le refuser les vexe un peu. **L'idée du joueur le remplace et le
  dépasse** : on garde le partage (accepter la coupe = respect), et l'ivresse ouvre la **vision de l'enfance**
  (les parents, un moment joyeux, puis le feu du dragon qui dévore la vision), suivie des anciens qui
  rigolent autour du joueur. Proposé : la vision change un peu chaque année (un nouveau fragment du passé),
  pour faire avancer le fil des parents et du sort d'oubli ; le lendemain, un réveil difficile (la boutique
  ouvre une heure plus tard).
- **Le pain de cendre** : le pain des ancêtres, cuit sous la cendre du grand feu ; chacun en rompt un morceau
  « pour les absents ». Proposé : JeuneGoy en rapporte un quignon, qui devient une provision unique au
  comptoir : donné à un aventurier qui part en terre d'ombre, il le protège une fois (comme le trèfle, un
  repli au lieu de la mort) et les Bannis qui l'apprennent le saluent plus chaleureusement.
- **Le temps de la fête** (à définir avec le joueur) : proposé, les trois jours de la fête ; l'hydromel et
  le pain de cendre seulement le grand jour (le soir de la Nuit des Brumes).

### Retours du joueur au réveil (18/10)
- **Planche 26 validée** : le Passeur en capitaine pirate / contrebandier (costume « pirate »).
- **Lanternes : validé.** **Hydromel noir : on combine** l'idée de Claude (le partage, le respect des
  Bannis) et celle du joueur (la vision d'enfance, les anciens) ; **oui au réveil difficile** ; **oui à un
  fragment de vision par an, mais chaque vision est écrite avec le joueur et validée par lui** (Claude peut
  proposer, le joueur contrôle). **Pain de cendre : validé.**
- **Le tir à l'arc, à refaire** (pas satisfait, le réalisme compte) :
  - un **étal simple**, bien intégré au marché comme les autres (pas d'incrustation) ;
  - le jeu se joue **en plein écran**, sans le décor du marché autour : un vrai mini-jeu dans le jeu ;
  - **trois jauges** : **largeur** (gauche-droite, avec la zone rouge), **hauteur** (haut-bas, avec la
    même zone rouge) et **puissance** ; avec les trois, on vise le centre de la cible ;
  - réalisme : rien ne flotte (le drapeau sur un mât planté, l'emblème sur une bannière accrochée).
- **Équilibre de l'ombre** : viser **4 000 à 6 000 pièces au jour 90** si possible (aujourd'hui ~2 800) ;
  sinon, que la lumière rapporte plus lui plaît aussi. Idée : **une activité de plus au marché noir**, autre
  que d'envoyer des gens en voyage.

### Retours du joueur (18/10, suite)
- **Planche 22b v2 validée** (l'étal simple au marché, le mini-jeu en plein écran à trois jauges).
- **Les atours** (question du joueur) : ce sont des **tenues de fête à acheter** à l'étal de la fête, le temps
  des trois jours ; on les garde ensuite dans la garde-robe ; portées, elles font monter la relation avec les
  clients du camp ce jour-là. Rien à gagner d'avance.
- **La caisse du Passeur : validée** (contrebande achetée au marché noir, revendue le lendemain au comptoir,
  saisie et amende si la garde passe).
- **Les paris de la fosse : validés**, et **le bras de fer de Mog devient permanent** au marché noir (il n'y
  a pas de jeux à l'année là-bas) ; les osselets restent un jeu de fête.
- Question du joueur : envoyer des clients ou des missions spéciales depuis le marché noir ? **Jamais prévu**
  jusqu'ici (le plus proche : le service « Prêter un aventurier » de la Main Noire). Proposition de Claude :
  **les contrats de l'ombre** (à valider).
- **Réputation : on ne touche à rien**, et **les lanternes permettent de se racheter** (+0,5 quand la
  lanterne convient à la famille ; un peu de réputation en moins si l'on n'honore personne). Le joueur suivra
  les parties de son ami.

### Retours du joueur (18/10, fin)
- **Les atours des ancêtres** (précision) : c'est l'étal de la Nuit des Brumes. La fête honore les ancêtres des
  Bannis, ceux qu'on a chassés avant eux et qui reposent dans les brumes ; on s'habille « comme eux » pour
  qu'ils reconnaissent les vivants : le **masque d'os** (le visage des anciens), le **châle de brume** (gris,
  effiloché, la brume où errent les âmes), la **petite lanterne rouge de ceinture** (pour guider les morts
  jusqu'au feu). À acheter pendant la fête, gardés ensuite ; portés : +relation avec les clients d'ombre ce jour-là.
- **La caisse du Passeur : amende sévère** si la garde trouve la caisse (caisse saisie + une amende qui fait
  mal, à régler à la simulation : de l'ordre de deux à trois fois le prix de la caisse).
- **Plus tard : la prison** (et un mécanisme autour : être arrêté, la boutique fermée, payer une caution, s'évader
  ?). Idée mise de côté.
- **Planche 27 : tout est validé.** Les combats de la fosse doivent avoir des animations « de blockbuster »
  (coups, esquives, ralenti, poussière, foule qui hurle, K.O. spectaculaire) ; un combat ne finit **pas toujours
  par K.O.** (abandon, aux points, arbitre qui arrête, coup bas...).
- **Les contrats de l'ombre : validés**, reçus au **coin bar des Bannis** : un petit comptoir de bar dans la cave
  du marché noir (il n'y a pas de table). Un Banni s'y accoude et propose la mission.
- **Le bar du joueur** (à mettre en place plus tard) se fournira **au bar des Bannis** : prix forts si le
  joueur penche vers la lumière, vrais prix s'il est du côté de l'ombre (ça rééquilibre aussi l'argent de
  l'ombre).
- **Planche 28 validée** (coin bar des Bannis « Au Gobelet Fêlé », Mère Nok, contrats de l'ombre, fournisseur du bar).
  Équilibrage : l'ombre peut monter jusqu'à **7 000** (cible 4 000-7 000).
- **Design féminin des peuples de l'ombre** (planche 29, à valider) : jusqu'ici les Bannies ne se distinguaient
  des hommes que par les lèvres ; désormais cheveux (queue de cheval, longue chevelure, crinière), cils,
  boucles d'oreilles, fleurs (trollesse, louve), diadème au rubis (momie).
- **Planche 29 v2 validée** (femmes de l'ombre : diadème au rubis et bandelettes roses de la momie, fleurs à cinq
  pétales, trollesse plus pâle, plus de col de fourrure-barbe).
- **Bras de fer à trois niveaux** (demande du joueur) : Grisk le gobelin (facile, mise 5 p., monte sur un tonneau),
  Mog l'orc (moyen, 10 p.), Bourk le troll (difficile, 20 p.). Battre l'un débloque le suivant ; chacun une fois par
  soir ; ils poussent plus fort, avec une zone verte plus étroite et un repère plus rapide, à mesure qu'on monte.
- **Nom de la race : « orc »**, jamais « orque » (même au féminin : « une orc », « les femmes orcs »).

### Préparatifs de la construction du lot B « L'année qui passe » (18/10, après la v0.98)
Toutes les planches sont validées (21, 22 v3, 22b v2, 23, 24, 25, 26). Ce qui existe déjà : le calendrier
(4 mois de 28 jours, un par saison : Semailles, Moissons, Brumes, Givre ; `dateDuJour`), les sauts de temps
des paliers d'étoiles (1 mois à 3 ans d'un coup), le chat adopté, le bois du foyer (`G.feu`), le crieur et le
tableau d'affichage, la garde-robe. Le lot B s'appuie dessus.

**Le découpage (une version par morceau, chacun testé : simulation, pilote, captures)**
- **B-1 · v0.99 — Les saisons qui se voient et qui comptent.** Le décor change avec le mois : façade, rue,
  marché, paysage du comptoir, carte (bourgeons et pétales ; blés et soleil haut ; feuilles rousses et brume ;
  arbres dégarnis puis nus, neige sur les toits, bonhomme de neige). L'icône de saison à côté du jour (bandeau),
  la page « Calendrier » du bureau (le mois en grille, les fêtes marquées). Les effets validés : épreuves de crue,
  de soif, de brume, de froid plus dures sans le bon objet (×0,85) ; les prix de saison au marché (cordes +10 %
  et potions −10 % aux Semailles, gourdes +10 % et rations −10 % aux Moissons, potions +10 % aux Brumes, capes
  +10 % au Givre) ; plus de novices au printemps, une mission sur dix retardée d'un jour dans la brume, un client
  de moins par jour l'hiver.
- **B-2 · v0.99 — Les passages de saison** (planche 21) : une petite cinématique le premier matin de chaque mois
  (3-4 images) ; pendant un saut de temps, les saisons défilent en accéléré (« Tu as vu passer deux hivers... »).
- **B-3 · v1.00 — Les deux fêtes**, annoncées une semaine avant par le crieur et le tableau d'affichage, trois jours
  chacune (la veille, le grand jour, le lendemain) :
  - **B-3a, la Fête du Solstice** (lumière, Moissons) : le marché pavoisé, l'étal et le **tir à l'arc** en plein
    écran à trois jauges (planche 22b), le **mât de cocagne**, les **atours de l'Union**, la tarte du Solstice, la
    bénédiction du comptoir, les **lanternes célestes** du dernier soir ;
  - **B-3b, la Nuit des Brumes** (Bannis, Brumes, si le marché noir est connu) : les lanternes rouges, le grand
    feu, les **osselets** (avec le gobelin tricheur), les **atours des ancêtres**, l'**hydromel noir** (respect des
    Bannis + la vision d'enfance + le réveil difficile), le **pain de cendre**, les **lanternes pour tes morts**
    (trois qualités, les familles qui réagissent), l'histoire du Passeur ; l'accueil plus forcé si tu penches vers
    la lumière.
- **B-4 · v1.01 — Madame Ysmée, la diseuse** (planche 23) : la tente violette dans la rue dès le jour 10 (une
  cinématique de découverte), 2 pièces le présage, une fois par jour, parfois trompeur ; les indices du flair.
- **B-5 · v1.01 — Le foyer et le chat** (planches 24 et 25) : l'hiver sans bois (fatigué, puis malade et ouverture
  à midi ; la confirmation au coucher, la bûche rouge dans le bandeau), le chat qui boude après 3 jours sans ration
  (le mot sur le comptoir, le panier vide, son retour).
- Après chaque morceau : un petit house keep ; après la v1.01, un grand house keep et Cloudflare (sur ta demande).

**Les dates proposées** (dans le mois de 28 jours) : la Fête du Solstice les **13, 14 et 15 des Moissons** (le grand
jour au milieu de l'été) ; la Nuit des Brumes les **26, 27 et 28 des Brumes** (le grand soir à la fin de l'automne,
juste avant le Givre). Dans une partie de 90 jours, on croise chaque fête au moins une fois (le 14 des Moissons tombe
au jour 42 sans saut de temps). Si un saut de temps passe par-dessus une fête, la gazette dit qu'on l'a vue passer
de loin (pas de fête manquée en silence).

**À valider par le joueur avant B-3b** (Claude propose, le joueur contrôle) :
1. **La première vision de l'hydromel noir** (proposition) :
   - une cuisine qui sent la cannelle ; une femme aux mains pleines de farine rit : « Doucement, petit voleur,
     ce sont les gâteaux du Solstice ! » ;
   - un homme te hisse sur ses épaules ; au loin, des lanternes montent au-dessus des toits : « Regarde, elles
     vont dire bonjour aux étoiles. » ;
   - ta mère te passe une médaille autour du cou (celle dont le mendiant se souvient) : « Elle te gardera,
     quand nous ne serons pas là. » ;
   - le ciel devient orange, une ombre immense passe sur le village, le feu du dragon dévore la cuisine, les
     rires, les visages... ;
   - tu rouvres les yeux près du grand feu : un vieil orc et une vieille gobeline penchés sur toi. « Ça va,
     petit ? » « Encore une coupe ? Cette boisson-là, c'est que pour les vrais ! »
2. **L'histoire du Passeur** (le soir de la Nuit des Brumes, proposition) : « Mon grand-père disait qu'avant, il
   n'y avait ni lumière ni ombre. Juste des voisins. Une nuit, quelqu'un a chanté sur la ville, une chanson que
   personne n'a entendue. Au matin, la moitié des gens avaient oublié qu'ils avaient été amis. L'autre moitié, on
   l'a appelée les Bannis. Bah. Les vieux racontent n'importe quoi. » (un fil de plus vers le sort d'oubli)

**Questions au joueur**
- Les dates des fêtes proposées te vont-elles ?
- La vision et l'histoire du Passeur : validées, ou à retoucher ?
- On garde l'ordre B-1 → B-5 (les saisons d'abord, la diseuse et le foyer à la fin) ?

### Réponses du joueur sur les préparatifs du lot B (18/10)
- **Dates des fêtes validées** (Solstice : 13-15 des Moissons ; Nuit des Brumes : 26-28 des Brumes). Rater une fête
  à cause d'un saut de temps n'est pas grave (elles reviennent chaque année).
- **Prévenir le joueur** : la veille et le jour même, un avertissement (« Demain, c'est la Fête du Solstice ! »),
  affiché quand le joueur n'est pas occupé (pas au milieu d'un client, d'un récit ou d'une cinématique).
- **La première vision de l'hydromel noir : validée** telle que proposée. **L'histoire du Passeur : validée.**
- **L'ordre B-1 → B-5 : validé.** v0.98 poussée sur Cloudflare.

### B-3a, la Fête du Solstice : construction (18/10)
- **Construit** (planches 22 v3 et 22b v2 validées) : les règles (`solstice.js`) ; le marché en fête les 13, 14 et 15
  des Moissons (lampions au-dessus de la place et de la rue, deux grandes bannières de la Confrérie pendues à leur
  traverse) ; **le tir à l'arc du sergent Aubrin** à la place du coin des jeux (10 p. la partie, 3 parties par jour) et
  le **mini-jeu plein écran à trois jauges** (largeur décalée par le vent, hauteur, puissance qu'on maintient puis
  qu'on lâche dans la bande) ; lots : 12 points → 8 p., 18 → 20 p., 24 → 35 p. et un **trèfle du Solstice** (un
  cadeau que tout le monde aime) ; battre le record du jour du sergent (22 à 27) : le titre **« Œil du Rempart »**
  (+1 de réputation, une fois par an) ; **l'étal de l'Union** chez Marcelline (couronne de fleurs 15 p., écharpe bleu
  et or 20 p., cape blanche 40 p. ; portés pendant la fête, +1 de relation avec chaque client de la lumière) ; **la
  bénédiction du comptoir** par Frère Anselme (offrande 15 p., +0,5 de réputation, le comptoir brille 3 jours) ; **la
  tarte du Solstice** chez Rosalie (6 p., un cadeau : +1 cœur au départ pour ce voyage, elle ne se garde pas la nuit) ;
  l'annonce du crieur une semaine avant ; la veille et chaque jour au réveil ; la fête « vue de loin » pendant un saut
  de temps.
- **Bug ancien corrigé** : `mafia.js` redéfinissait `nomRang` et écrasait celle des rangs d'aventurier : le rang des
  clients s'affichait « undefined » (dialogue d'accueil, panneau de commande, carte, récits). La version de la mafia
  s'appelle maintenant `nomRangMafia`.
- **Planche 30, à valider** : les atours portés par JeuneGoy, le comptoir béni, le mât de cocagne (maquette :
  cliquer à chaque temps pour grimper, trois glissades et c'est la chute, 20 secondes, 5 p. ; en haut le jambon ou un
  objet rare) et les lanternes célestes (le soir du 15, dans la rue).

### Retours du joueur sur la planche 30 (18/10)
- **Validés** : les atours portés (A), le comptoir béni (B), les lanternes célestes (D, « bravo »).
- **Grippesou** : ses jeux restent fermés pendant les fêtes (le tir à l'arc prend sa place) : c'est voulu.
- **Le mât de cocagne** : le jeu de grimper est gardé, mais la maquette était trop peu animée. **Règle générale** :
  dans toutes les animations du jeu, les personnages doivent avoir un minimum de mouvement (bras, jambes), jamais
  une image figée qui glisse. (Audit complet en v1.06 : voir le tableau des versions.)
- Le joueur trouvait dommage que le mât reprenne la mécanique du bras de fer (cliquer en rythme). **Proposition de
  Claude (planche 30 v2)** : *main gauche, main droite* (Q / D, ← / →, ou un clic à gauche / à droite) ; la même main
  deux fois de suite fait glisser ; la **force** s'épuise à chaque prise (il faut souffler, et l'on glisse un peu
  pendant ce temps) ; des **coulées de graisse** descendent le mât : attraper quand l'une passe sous la main, c'est
  une glissade ; trois glissades, c'est la chute ; 25 secondes, 5 p., trois essais par jour.
- **Les lots, tout en haut** : le **jambon fumé** (6 rations dans la réserve, à coup sûr) ou le **sac mystère** (au
  hasard : 2 amulettes, 3 potions, 2 capes chaudes et 2 antidotes, ou un bouclier et une arme rare : rapière,
  khopesh ou marteau de guerre).
- **Le moteur des corps sait maintenant grimper** (poses `grimpe1` / `grimpe2` : une main au-dessus de la tête, l'autre
  à hauteur du visage, un genou relevé ; pour tous les personnages) ; `textureJoueurPose` donne le joueur dans n'importe
  quelle pose et sous n'importe quel angle.

### Idées du joueur (18/10, après la planche 30 v2)
- **Lots du mât (vue C) : validés.** Règle des animations : validée (le passage complet se fera au bon moment).
- **La conquête d'une contrée** demande une mission de plus par étoile : **5 à 1 étoile, 6 à 2, 7 à 3, 8 à 4, 9 à 5**
  (construit en v1.00 ; les contrées déjà conquises d'une vieille partie le restent).
- **Le Grand Sage apparaît pour la première fois au deuxième Solstice** (an 2, le grand jour) : un discours de « paix et
  bienveillance » sur la place (cortège du Conseil, cloches). Il faut d'abord son dessin (planche à faire).
- **Garrick fait un discours pour les Bannis à la Nuit des Brumes, dès la première année** : pour les rassurer, des
  jours meilleurs sont à venir.
- **Une fête d'hiver (« Noël »)** avec **la grande roue des cadeaux** : un pourcentage de chances pour chaque sorte de
  lot (décorations, vêtements, provisions, armes...).

**Propositions de Claude, à valider**
1. *Le discours du Grand Sage* (an 2, Solstice, le 14 des Moissons, au marché) : « Peuple du Comté ! Voilà bien des
   hivers que le dragon ne trouble plus nos ciels. Ce n'est pas la chance qui vous garde : c'est l'Union. Que chaque
   comptoir soit une lanterne, chaque voisin un frère. Le Conseil ne vous demande qu'une chose : la bienveillance...
   et un peu de vigilance envers ceux qui ont choisi l'ombre. » Il sourit, la foule l'acclame. Au fond, Garrick ne
   l'applaudit pas (un indice pour les attentifs : les paroles sont belles, le regard l'est moins).
2. *Le discours de Garrick aux Bannis* (an 1, Nuit des Brumes, près du grand feu, si le marché noir est connu) : « Je
   sais ce qu'on dit de vous, là-haut. Je sais ce qu'on vous a pris, et ce qu'on vous a fait oublier. Mais écoutez-moi :
   la brume finit toujours par se lever. Un jour, vos enfants passeront la Grande Muraille sans baisser les yeux.
   Gardez vos lanternes allumées. Des jours meilleurs viennent. » (Les Bannis se taisent, puis lèvent leurs coupes ;
   JeuneGoy se demande ce que Garrick fait là.)
3. *La fête d'hiver* : **la Fête du Long Hiver**, les 20, 21 et 22 du Givre (la neige, le grand sapin de la place, le
   banquet). **La grande roue des cadeaux** (8 p. le tour, un tour par jour) : provisions 30 % (3 à 6 rations, torches,
   capes chaudes), pièces 20 % (10 à 40 p.), vêtements 15 % (un bonnet, des moufles, une écharpe d'hiver : nouveaux,
   gardés dans la malle), armes 15 % (une arme au hasard), décorations 15 % (une décoration de la brocante), **le gros
   lot 5 %** (une décoration exclusive : le sapin de cristal, +0,4 client par jour). On la placerait en **B-3c**, après
   la Nuit des Brumes.

### Réponses du joueur (18/10, après la v1.00)
- **Planche 30 v2 : tout est validé** (le mouvement de grimpe, la mécanique main gauche / main droite, les lots).
- **Le discours du Grand Sage** (an 2, Solstice) : **validé**. **Le joueur enverra un dessin du Grand Sage : Claude
  doit le lui rappeler** avant de construire la scène.
- **Le discours de Garrick aux Bannis** : validé, avec la fin retouchée : « Je sais ce qu'on dit de vous, là-haut. Je
  sais ce qu'on vous a pris, et ce qu'on vous a fait oublier. Mais écoutez-moi : la brume finit toujours par se lever.
  Un jour, vos enfants passeront la Grande Muraille sans baisser les yeux. Gardez vos lanternes allumées : des jours
  meilleurs viendront. »
- **La Fête du Long Hiver et la grande roue des cadeaux** : validées telles que proposées (B-3c, après la Nuit des Brumes).

### Réponses du joueur (18/10, après la v1.01)
- **Planche 31 v2 : validée** (« magnifique ») : la Nuit des Brumes est ouverte (v1.01).
- **Le dessin du Grand Sage** est arrivé (une image de référence) : couronne d'or aux pierres bleues, longue barbe et
  longs cheveux blancs, cape d'écailles de dragon rouges, robe violette brodée d'or sur une robe d'ivoire à l'arbre d'or,
  bâton torsadé au cristal bleu, avant-bras aux runes qui luisent, fioles bleues et grimoire à la ceinture. Construit
  dans le moteur des corps (figurant `sage`) et mis en scène : **planche 32, à valider**. La scène du discours est
  prête (`DiscoursSage` : les cloches, le cortège du Conseil, la colonne de lumière, le discours en trois morceaux,
  l'acclamation, puis Garrick qui n'applaudit pas) mais **fermée** (`SAGE_OUVERT = false`) jusqu'à la validation.
- *Note de Claude* : la cape d'écailles rouges est un indice de plus (le dragon appartenait au Grand Sage).
- **Planche 32 : validée** (« superbe ») ; la barbe de profil était mal placée (corrigé : elle tombe sous le menton,
  le bâton est tenu devant lui). Le discours est ouvert en v1.02.
- **Le Conseil des Gardiens, que préside le Grand Sage** (demandé le 18/10) : **planche 33, à valider**. Propositions
  de Claude : un Gardien par royaume du Conseil, en robe aux couleurs de son royaume, avec l'étole blanche du Conseil
  et une **broche d'écaille rouge** (tous la portent : un indice, le dragon) ; **Maître Bertolin Pommeval** (hobbit,
  Gardien du Comté, chaîne d'office), **Dame Aliénor de Hautval** (Gardienne des Hommes, cercle d'argent), **Durgan
  Barbe-de-Fer** (Gardien des Nains, petite couronne), **Dame Ilyriel** (Gardienne des Elfes, diadème de feuilles),
  **l'Archimage Séraphine** (Gardienne des Mages) ; et **Sire Valdric, le Champion du Rempart**, bras droit du Sage
  (acier noirci et or, cape d'écailles, grande épée dans le dos) : celui qui a « dompté » le dragon (voir la fin
  neutre). Les noms sont des propositions. La salle du Conseil à la Citadelle (maquette), et le cortège au Solstice
  (le Gardien du Comté et le Champion sur l'estrade : prêt, fermé par `CONSEIL_VALIDE` jusqu'à la validation).
- **Planche 33 : validée** (18/10), la correction de la barbe aussi. Le cortège est ouvert (v1.03).
- **Le damier noir et blanc** de la salle du Conseil est trop agressif : un dallage plus doux, plus noble (à refaire).
- **Les armes portées par les voyageurs** (idée du joueur, née de l'épée dans le dos du Champion) : un voyageur qui
  repart avec une arme la porte sur lui (dans le dos, à la main, à la taille... selon l'arme) ; et celui qui vient
  faire réparer son arme l'a déjà sur lui dans la file d'attente.
- **Construit pour la planche 34 (à valider)** : chaque voyageur qui possède une arme la porte (`armePortee` : celle qu'il
  vient d'acheter, sinon celle de son inventaire, même abîmée), partout où on le voit en pied. **Dans le dos** : l'épée,
  la hache, le marteau, l'arc, le bâton de bambou ; **à la main** : la lance, le bâton de mage, la massue (avec le
  baluchon, la lance et le bâton passent dans le dos, la massue à la taille) ; **aux mains** : les griffes ;
  **à la taille** : la dague, la rapière, le khopesh, la fronde. La salle du Conseil : un dallage de marbre crème veiné
  d'or (`dallageConseil`), une rosace et un tapis pourpre, au lieu du damier.
- **Planche 34 : validée** (18/10), avec des armes un peu plus grosses pour les petites silhouettes de la file (v1.04).

### B-3c, la Fête du Long Hiver : construite, fermée en attendant la planche 35 (18/10)
- **Les dates** : les 20, 21 et 22 du Givre (la fête de tout le village, les deux camps). Annoncée une semaine avant par
  le crieur, la veille et chaque jour au réveil ; marquée en bleu glacé dans le calendrier. Fermée tant que la planche 35
  n'est pas validée (`FETES_OUVERTES.hiver = false`, dans `hiver.js`).
- **Le marché** : la neige tassée sur les pavés, le grand sapin de la place (étages enneigés, guirlande rouge, boules,
  bougies, étoile d'or qui pulse), des guirlandes de sapin à nœuds rouges à la place des fanions, un bonhomme de neige.
- **La grande roue des cadeaux** (validée le 18/10), à la place du coin des jeux, tenue par **le Père Givrin** (proposé :
  un vieux nain jovial, manteau rouge bordé de fourrure, long bonnet à pompon) : 8 p. le tour, un tour par jour ; une
  roue en plein écran qui ralentit en faisant cliqueter ses clous. Lots : provisions 30 % (3 à 6 rations, 3 à 5 torches
  ou 2 capes chaudes), pièces 20 % (10 à 40 p.), habit d'hiver 15 %, une arme 15 % (celles des peuples de l'ombre
  seulement si on connaît le marché noir), une décoration de la brocante 15 % (jamais une décoration de camp : la roue
  ne fait pencher personne), **le gros lot 5 %** : le sapin de cristal (+0,4 client par jour, posé sur le plancher de
  l'arrière-boutique, il scintille). Déjà tout gagné : des pièces à la place.
- **Proposé, à valider** : les **habits d'hiver** (bonnet à pompon, moufles fourrées, écharpe du Long Hiver rayée rouge et
  blanc), gagnés seulement à la roue, rangés dans la malle ; portés pendant la fête, +1 de relation avec chaque client
  (les deux camps, une fois par jour), comme les atours des deux autres fêtes.
- **Proposé, à valider** : **le banquet du grand soir** (le 21, avant d'aller dormir, une fois par an) : tout le village
  attablé sous le sapin illuminé ; Garrick arrive dans la neige et lève sa chope : « Au Long Hiver ! Que vos foyers
  restent chauds... et vos portes ouvertes, même à ceux qu'on n'attend pas. » ; un voisin (Rosalie, Mère Sauge, Thorgal
  ou Firmin) glisse un petit cadeau près de ton assiette ; le lendemain, réveil en pleine forme (un client de plus).
- **Proposé, à valider** : **l'esprit du Long Hiver** : pendant les trois jours, tout cadeau offert au comptoir donne +1
  de relation en plus.
- **Petit bug corrigé au passage** : les dépenses des fêtes s'affichaient « fete » au registre (libellé : « Fêtes du village »).

### B-4, Madame Ysmée, la diseuse : construite (planche 23 validée, 18/10)
- **Sa tente violette** se dresse dans la rue au jour 10, entre ton comptoir et la maison des Brindeloup (une ligne
  dans les nouvelles du matin ce jour-là). Le jour, on y entre (« Madame Ysmée ») ; le soir, ses rideaux sont tirés,
  une lueur violette passe sous la toile.
- **La découverte** (la première fois) : la tente s'ouvre toute seule, la bougie s'allume, les cartes se retournent
  seules : « Entre, petit marchand. Les cartes m'avaient dit que tu viendrais. Je suis Ysmée. »
- **Son portrait** : celui de la planche 23, avec **son foulard violet** (qui restait à dessiner) noué sur la tête, ses pans
  derrière les oreilles et une rangée de petites pièces d'or sur le front. Elle respire, cligne des yeux ; son chat noir
  bat de la queue au bout de la table.
- **Le présage** : 2 p., une carte par matin, **avant l'ouverture du comptoir** (après, « les cartes ne parlent qu'au
  matin »). Cinq cartes :
  - **Le Corbeau** : quelqu'un te mentira aujourd'hui (un imposteur est glissé parmi les clients imprévus) ;
  - **La Roue** : un retour inattendu (un aventurier en mission, qui reviendra vivant, rentre aujourd'hui ; la carte ne
    sort que si quelqu'un est en mission) ;
  - **La Tour** : la garde passera cette semaine (dans 1 à 5 jours ; la carte ne sort que si la garde te surveille déjà,
    c'est-à-dire si ton comptoir penche vers l'ombre : elle prévient, elle n'invente pas de visite) ;
  - **L'Étoile** : un client généreux (8 à 18 p. de pourboire à son départ) ;
  - **Le Soleil** : des clients au cœur léger (+1 de patience au marchandage, toute la journée).
- **Parfois trompeuse** (deux fois sur cinq, demandé par le joueur) : le présage ne se réalise pas. Aucun indice dans ses paroles ; avec du
  flair, chacun des trois petits détails apparaît d'autant plus souvent que le flair est grand (la flamme qui vacille,
  la carte à l'envers, le chat qui détourne la tête ; à 100 %, les trois).
- Simulation (16 parties de 160 jours, un présage 7 matins sur 10) : aucun problème ; les amendes de la garde montent
  d'environ 10 % (la simulation ne profite pas de l'avertissement de la Tour pour cacher ce qu'il faut).

### B-5, le foyer et le chat qui boude : construits (planches 24 et 25 validées, 18/10)
- **L'hiver sans bois** : une nuit de Givre sans bûche, réveil fatigué (un client de moins, pas de « pleine forme ») ;
  deux nuits de suite, malade (le comptoir n'ouvre qu'à midi, un client de moins) et le chat part se réchauffer chez
  les voisins pour la journée. Le soir du banquet du Long Hiver compte comme une nuit au chaud.
- **Prévenu** : la bûche rouge clignote dans le bandeau le soir tant que le foyer est vide (un clic l'explique) ; la ligne
  « Le foyer est vide » au bilan du soir, avec « ▸ Mettre une bûche (1 planche) » ; et au coucher, la confirmation de la
  planche 24 (« Mettre une bûche » ou « Dormir quand même » ; sans bois : « Thorgal en vend à la forge »).
- **La gamelle du chat** (à son nom, dans l'arrière-boutique, pleine ou vide) : une ration tous les trois jours, prise
  dans la réserve. Plus de ration : la gamelle reste vide (ligne du soir) ; au bout de trois jours il boude (il te tourne
  le dos, « Rrrr. »), puis il part un jour : au matin, son coussin est vide et **un mot sur le comptoir** : « Parti voir
  ailleurs. Pas de ration, pas de chat. — M. » (l'initiale de son nom, et une empreinte de patte). Le lendemain soir, il
  revient comme si de rien n'était, une souris entre les dents ; il se méfie une semaine (il chasse moins bien les rats,
  une nuit sur deux ; il ne sent plus venir la garde). Parti, il ne te suit pas en promenade et ne protège pas la réserve.
- Simulation (16 parties de 160 jours, un joueur qui met une bûche 85 % des soirs d'hiver et garde le plus souvent une
  ration pour la gamelle) : aucun problème ; 33 réveils fatigués et 6 malades en tout.

### Réponses du joueur (18/10, après les planches 35 et 36)
- **Planche 35 : tout est validé** (« bravo ») : la Fête du Long Hiver est ouverte (v1.05), Père Givrin, habits d'hiver, banquet
  et esprit du Long Hiver compris.
- **« Fichu » n'est pas un mot courant** : Madame Ysmée porte un **foulard violet**.
- **Madame Ysmée se trompe 2 fois sur 5** (au lieu d'une fois sur quatre).
- **Planche 36 (le foyer, le chat qui boude) : parfait.**

### Retours du joueur (18/10, au coucher)
- **Garrick qui flotte dans l'intro** : à refaire (le joueur y pensait déjà). **Planche 37** préparée (trois pistes : sur
  le dos bras en croix, affalé sur un rondin, cramponné à un vieux tonneau ; Claude préfère le tonneau, qui colle au texte
  « comme un vieux tonneau »). Rien n'est changé dans le jeu avant validation.
- **« Cui cui »** : c'étaient les oiseaux de l'aube, mais le mot s'affichait près du voyageur, comme s'il le disait. En
  v1.07, trois petits oiseaux traversent le ciel de l'aube en gazouillant, avec leurs notes au-dessus d'eux.
- **v1.06 poussée sur Cloudflare** (accord du joueur).

## Lot C « Les grands enjeux » — préparatifs (19/10, après la v1.07)

### État des lieux
- **Faits** : lot A (la journée, le tableau et les avis de recherche, imposteurs et flair, marchandage), lot B (saisons,
  trois fêtes, Madame Ysmée, le foyer et le chat qui boude), la forge, le marché noir de l'année, la Main Noire.
- **Le constat des simulations (v1.07, 12 parties de 400 jours)** : le danger reste concentré sur les jours 5 à 15 ;
  ensuite l'argent s'envole (médiane ≈ 1 300 p. au jour 20, 5 700 au jour 30, 14 000 au jour 100 ; en moyenne plus de 100 000 au
  jour 400). Passé le premier mois, plus rien ne fait vraiment peur : c'est exactement ce que le lot C doit corriger.
- **Garde-fou déjà décidé** (17/10) : **un seul grand rendez-vous par semaine** (menace, commande royale, fête ou
  collection, tour à tour selon le calendrier) ; chaque action au comptoir reste courte ; foyer, mises, prix et rival
  réglés ensemble par la simulation.

### Le découpage proposé (dans cet ordre)
- **C-1 Les commandes royales** (8) : un messager du Conseil, sceau rouge, une fois par mois environ. Une grosse
  commande à livrer avant une date (par exemple 4 épées « bel ouvrage », 10 rations et 3 capes en 7 jours). Prime très
  grosse et réputation ; échec : réputation en baisse et le Conseil se méfie un temps. Fait travailler la forge et le
  stock, et donne un vrai but à l'argent accumulé.
- **C-2 La menace qui grandit** (7) : chaque semaine (hors fêtes et commandes), une contrée est menacée (orcs, pillards,
  la Bête...). On équipe une **escouade** (trois aventuriers, colis choisis) ; si elle échoue, la contrée est **perdue** :
  plus de missions là-bas, et ses prix montent, jusqu'à la reconquérir. La menace grandit avec les étoiles.
- **C-3 Les mises** (5) : avancer de l'argent à un aventurier avant son départ (20 à 100 p.) contre une plus grosse
  part du butin à son retour. S'il meurt, la mise est perdue. Un vrai pari, réservé aux aventuriers qu'on connaît.
- **C-4 Les prix qui suivent la renommée** (15) : plus tu es connu, plus tes clients acceptent de payer cher... mais le
  Conseil lève un **impôt du comptoir** chaque mois, proportionnel à ta fortune et à ta renommée (avec une ristourne
  pour les commandes royales réussies). L'argent garde de la valeur au jour 100.
- **C-5 Le comptoir rival** (14) : un concurrent ouvre en face, un personnage **vraiment agaçant** (physique, répliques,
  manières : à dessiner sur une planche). Il te vole des clients, casse les prix, raconte des bobards au crieur. On le
  bat en réputation sur un mois ; alors on peut **le racheter** : le donner aux orphelins (réputation, petits coursiers)
  ou en faire **le petit bar** (une pièce de plus, des rencontres le soir).
- **C-6 Les collections du Conseil** (12) : des séries à réunir (les trophées des sept royaumes, les armes des peuples,
  les souvenirs de la nymphe...) exposées dans une vitrine ; chaque série complète donne un titre et un petit bonus.
- **C-7 Les messages de détresse** (9) : un pigeon arrive au comptoir pendant une mission (« Borin est coincé, il lui
  faut 2 torches ») ; on aide (l'aigle du Conseil, un mercenaire : argent et temps de journée) ou non ; le récit montre
  la conséquence.
- **Hors lot, à placer quand tu veux** : la **quête du chat amoureux** (sa compagne en danger, puis deux petits, la
  maison des chats ; le secret du chat qui parle pour plus tard), et **Garrick qui flotte** (planche 37).

### Les planches à venir (avant de construire)
- Planche 38 : le messager royal, la lettre scellée et le panneau de la commande (avec son compte à rebours).
- Planche 39 : la carte menacée (la contrée qui rougit, l'escouade à équiper, une contrée perdue).
- Planche 40 : **le rival** (trois propositions de personnage agaçant) et sa boutique en face.
- Planche 41 : la vitrine des collections, et le petit bar.

### Questions au joueur (lot C)
1. **L'ordre** te va-t-il (commandes royales, menace, mises, prix et impôt, rival, collections, messages) ? Ou tu
   préfères commencer par le rival, le plus « personnage » ?
2. **L'impôt du Conseil** (pour que l'argent garde de la valeur) : d'accord sur le principe ? Le rival et les commandes
   royales suffiraient peut-être, mais la simulation montre qu'il faut un vrai « puits » d'argent.
3. **Une contrée perdue** : on peut la reconquérir (une mission spéciale), ou elle reste perdue jusqu'à la fin de
   l'année ?
4. **Le rival** : plutôt un **noble prétentieux**, un **gobelin bonimenteur**, ou un **ancien apprenti de Garrick**
   jaloux de toi (avec un lien au récit) ?
5. **La quête du chat amoureux** : avant le lot C, au milieu, ou après ?

### Réponses du joueur sur le lot C (19/10)
- **Cloudflare** : le compte s'appelle maintenant **goyniverse** (avant : goyland). Le jeu est à
  `premier-jeu.goyniverse.workers.dev`, en **v1.08** (accord du joueur). Les sauvegardes d'un navigateur restent
  attachées à l'ancienne adresse : on les transporte avec le code de sauvegarde (☰ > Sauvegardes).
- **Planche 37** : piste **C validée** (cramponné au vieux tonneau), puis **planche 37 v2 validée** (v1.09), avec une suite : Garrick essaie d'abord de
  s'accrocher au **rondin**, le rate (il roule et lui échappe), puis voit le tonneau et finit par s'y cramponner.
- **Le lot C** : il faut de nouveaux enjeux quand le joueur a autant d'argent ; tout est à définir. **L'ordre proposé
  est gardé** (Claude choisit l'ordre des tâches ; le joueur dira s'il veut une chose à un moment précis). Le joueur
  a très envie de se pencher sur le **rival**.
- **L'impôt du Conseil** : d'accord sur le principe, montants et règles à définir (simulation).
- **La contrée perdue** : c'était une proposition de Claude (C-2, la menace qui grandit), le joueur la trouve bonne.
  **D'abord définir la mécanique de perte** ; la reconquête est possible ensuite.
- **Le rival : l'ancien apprenti de Garrick.** Devenu le **lèche-bottes du Conseil et du Grand Sage**, dans l'espoir
  de rabattre son caquet à Garrick. Garrick a **arrêté son apprentissage** : l'apprenti était trop instable, il ne
  voulait que la guerre au lieu d'essayer de comprendre ce que Garrick essayait de lui dire (les révélations sur
  le monde, que Garrick ne connaît que par les récits des anciens doyens, un peu de fouille **en secret** dans les
  archives de la Confrérie, et ses **soupçons sur la Confrérie**). À tisser avec le grand retournement :
  - ses piques visent Garrick (« le vieux fou qui écoute les radotages des doyens ») : des indices, jamais la vérité ;
  - il a l'oreille du Conseil (fournisseur « agréé », prix cassés, faveurs) et il pourrait un jour **dénoncer
    Garrick** : une menace qui grandit avec lui ;
  - on le bat en réputation sur un mois ; alors on peut racheter sa boutique (les orphelins, ou le petit bar).
  - À dessiner sur la planche 40 : trois propositions de physique et de tenue, avec ses répliques.
- **La quête du chat amoureux** : Claude la place quand il le juge bon.

### C-1 et l'impôt du Conseil : chiffres proposés (simulation du 19/10, v1.09)
40 parties de 300 jours par réglage (stratégies mélangées ; la moitié des robots fait faillite avant le jour 15,
dans tous les réglages : l'impôt ne commence qu'à ★2 et ne touche pas le début du jeu).

| Réglage | Argent médian jour 50 | jour 100 | jour 200 |
| --- | --- | --- | --- |
| Aujourd'hui (rien) | 11 700 | 18 500 | 37 700 |
| Impôt 10 % par mois au-delà de 400 p. × étoiles | 5 900 | 14 000 | 29 800 |
| Impôt 20 % | 4 500 | 11 100 | 18 700 |
| Impôt 30 % | 5 200 | 9 000 | 20 500 |
| Impôt 20 % + commandes royales | 6 600 | 17 400 | 32 900 |
| Impôt progressif (5 % × étoiles) + commandes + ristourne | 9 900 | 18 900 | — |

- **Ce que ça montre** : l'impôt divise le magot par deux environ, sans faire tomber personne ; mais l'argent continue
  de monter (les revenus grandissent avec les étoiles). L'impôt seul ne fera pas « peur » : la vraie tension viendra de
  la menace (C-2), du rival (C-5) et de **grosses dépenses qui valent le coup** (racheter le rival, le petit bar, les
  collections).
- **Proposition, impôt du Conseil** : le 1er de chaque mois, dès ★2, un percepteur passe (une lettre au sceau du
  Conseil) : **5 % × tes étoiles** (10 % à ★2, 25 % à ★5) de ce que tu as **au-delà de 300 p. × étoiles**. Moitié prix le
  mois qui suit une commande royale réussie. Pas assez d'argent : une dette envers le Conseil (comme un prêt), pas la
  faillite tout de suite.
- **Proposition, commande royale** : une par mois, dès ★2 (le 9 du mois, livrée le 16 : jamais un jour de fête ; le 14
  tombait pendant la Fête du Solstice et la livraison du 21 pendant le Long Hiver). Prime **600 p. à ★2, +50 % par
  étoile**, +1 de réputation ; 7 jours pour livrer. La marchandise coûte environ 150 p. au marché, mais il faut des
  armes « bel ouvrage » (la forge, ou le marché noir). Ratée : -1 de réputation, et pas de commande le mois suivant.

### Réponses du joueur sur les planches 38 et 40 (19/10)
- **Le rival** : le **design A** (Lucien Belhomme, le paon du Conseil) est le préféré. Son caractère mélange A et B,
  avec une préférence pour A : vaniteux et moqueur au quotidien, mais avec le fond du va-t-en-guerre (il voulait la
  guerre, il menace de dénoncer les Bannis). On garde **uniquement le design de A**.
- **Sa boutique** : juste à côté de celle du joueur. **Sa façade ne doit jamais ressembler à celle du joueur**, quelles
  que soient leurs améliorations : une architecture à lui (planche 40 v2).
- **Planche 38 validée**, avec le **messager A** (le héraut bleu de la Confrérie). Il manque l'**échec** : le design du
  jour où la commande n'est pas remplie, et ses conséquences en plus (perte de réputation, **impôt plus cher pendant un
  temps**) : planche 38 v2.
- **Les chiffres de l'impôt du Conseil sont validés** (5 % × étoiles au-delà de 300 p. × étoiles, le 1er du mois dès ★2,
  moitié prix après une commande réussie, une dette envers le Conseil si on ne peut pas payer).

### C-1, les commandes royales et l'impôt du Conseil : construits (19/10, v1.10)
- **Le calendrier** : dès ★2, le **1er du mois** le percepteur passe (la lettre s'ouvre à l'ouverture du comptoir ; la
  toute première, même s'il n'y a rien à payer, pour expliquer) ; le **9**, le héraut apporte la commande ; le **16 au
  matin**, il revient la chercher (en tête de file). Commande jamais lue : elle s'en va. Acceptée et jamais livrée (le
  comptoir fermé avant lui) : elle compte comme manquée.
- **La commande** : tirée parmi des modèles selon les étoiles (★2 : rations, gourdes, torches, bandages, épées, capes,
  ce qu'on trouve toujours au marché ; ★3 à ★5 : boucliers, potions, antidotes en plus). Jamais plus que ta réserve ne
  peut garder (avec un peu de place pour les clients). Des armes « **bel ouvrage** » seulement si ta forge tourne : tant
  que la commande court, ces belles pièces restent de côté (elles ne partent plus dans les baluchons des clients, sauf
  s'il ne reste plus d'armes ordinaires).
- **Les chiffres** (simulation de 24 parties de 200 jours, robots qui achètent ce qui manque) : 77 commandes livrées
  pour 7 manquées ; l'impôt prend en moyenne ≈ 19 000 p. par partie sur 200 jours ; argent médian au jour 100 ≈ 15 000
  (au lieu de 18 500 sans le Conseil). Pas de faillite en plus. L'impôt ne peut jamais dépasser ce que tu as : la dette
  envers le Conseil reste un filet de sécurité.
- **À venir avec C-5** : Lucien Belhomme se moque d'une commande manquée (au comptoir et dans la gazette).
- **Relecture (19/10, après la v1.11)** : la part de « bel ouvrage » demandée se règle sur ce que ta forge peut sortir
  pendant les 7 jours (Aldo apprenti seul : aucune ; Aldo confirmé : une ; Baba : deux ou trois) ; le rappel du matin
  liste aussi les belles pièces qui manquent ; « 1 pièce d'impôt » au singulier ; la lettre d'impôt reprend les dettes
  comptées ce jour-là ; le joueur ne parle jamais (« Le raccompagner », « Le laisser partir », « Le laisser parler »,
  « Le remercier d'un signe ») ; après un refus, le récit « Le héraut tourne les talons... (réputation −1) » reste à
  l'écran jusqu'à ce que tu le laisses partir ; le panneau punaisé s'estompe d'un clic (l'ardoise dessous redevient
  cliquable) et revient d'un clic sur son sceau.

### Demande du joueur (19/10) : vers le jour 100, de quoi dépenser toute sa fortune (ou une grande partie)
- **La demande** : « au jour 100 il faudra inclure une mécanique pour que le joueur puisse dépenser toute sa fortune »,
  puis « ou une grande partie » : le joueur choisit combien il y met, mais ça doit pouvoir avaler l'essentiel du magot.
  Repère des simulations : vers le jour 100, l'argent médian est d'environ 15 000 p. (impôt du Conseil compris), et bien
  plus pour les bons joueurs. Il faut donc une dépense **sans plafond** (qui avale 5 000 comme 100 000 p.), qui **vaut
  le coup** sans rapporter d'argent en retour (sinon la fortune remonte), et qui pèse sur l'histoire.
- **Trois pistes proposées par Claude** (une planche pour choisir, avant de construire) :
  - **A. La Grande Expédition contre le dragon** : la Confrérie prélève sa taxe « pour la défense contre le dragon »
    depuis le premier jour ; vers le jour 100, on peut enfin financer l'expédition (vivres, armures, mercenaires,
    navires...). Plus on donne, plus elle a de chances ; son départ et son retour sont une grande cinématique, liée aux
    secrets de Garrick (le dragon existe-t-il vraiment ?).
  - **B. Les enchères du Conseil** : chaque mois, une relique légendaire mise aux enchères ; Lucien Belhomme surenchérit
    toujours. On peut tout miser ; les reliques gagnées vont dans la vitrine (lien avec C-6, les collections).
  - **C. Bâtir son quartier** : acheter les terrains autour du comptoir et y bâtir (auberge, temple, école des
    aventuriers, port...), chaque bâtiment très cher, visible dans la rue, avec ses visiteurs et ses petites histoires.
- **Place dans le lot C** : après C-5 (le rival), car le rachat de sa boutique et les enchères le concernent.

### Réponses du joueur sur la dépense du jour 100 (19/10)
- **B (les enchères du Conseil) validée** : l'idée plaît ; **les reliques sont à définir**.
- **C (racheter et bâtir le quartier) validée** : « racheter le quartier est une bonne idée ».
- **A (la Grande Expédition contre le dragon) : pas au jour 100.** Elle annoncera **le dernier arc du jeu**, tout proche
  de la fin officielle : son moment doit être calculé par rapport à la vie du jeu (ses événements, ses mécaniques), pas
  sur un jour fixe. À garder pour la fin, avec les secrets de Garrick et de la Confrérie.

### C-5 Le rival au quotidien : proposition (planche 41, à valider)
- **L'ouverture** : le 1er du mois qui suit ta première commande royale (acceptée ou non), « Au Comptoir Agréé » ouvre
  juste à côté (façade de la planche 40 v2). La gazette l'annonce, et Lucien vient se présenter au comptoir le jour même.
- **Sa « pression »** (de 1 à 3) : chaque jour, il attire des clients de ta file (1 tous les 2 jours, puis 1 par jour,
  puis 2 par jour). Jamais ceux qui t'ont écrit, ni les retours de mission, ni les visites.
- **Le mois des comptoirs** : le crieur compare chaque mois les deux comptoirs. Deux façons de compter :
  - **A (conseillée)** : les **aventuriers revenus vainqueurs** de chez toi, contre les siens (ses chiffres montent
    chaque jour, selon la taille de ton comptoir). Ombre ou lumière, les deux peuvent gagner.
  - **B** : la **réputation gagnée** dans le mois. Simple, mais nos simulations montrent que la voie de l'ombre gagne
    très peu de réputation (environ +2 par mois, contre +5 à +25 pour la lumière) : elle perdrait presque toujours.
- **La fin du mois** : tu gagnes, sa pression baisse d'un cran ; il gagne, elle monte d'un cran (3 au plus) et il vient
  se pavaner. **Tu gagnes un mois à pression 1** : il ferme, sa boutique est **à vendre** (on le reverra aux enchères).
- **Le rachat** (piste C validée, le premier terrain de ton quartier) : **1 500 p. × étoiles** (3 000 à ★2), quand tu
  veux. **L'orphelinat** (+3 de réputation, des petits coursiers qui font un achat du matin pour toi) ou **le petit
  bar** (une pièce de plus, le soir : rencontres, rumeurs, clients qui reviennent).
- Le score reste visible en haut de l'écran, près de ta réputation (un clic ouvre le détail).

### Réponses du joueur sur la planche 41 (19/10) : tout validé, version A
- **Le mois des comptoirs : version A** (en aventuriers revenus vainqueurs).
- **3.** Le crieur vient **à la fin de la file d'attente** (avant la Faucheuse, si elle vient le même jour) annoncer les
  résultats du mois.
- **5.** Le petit bar : parfait ; y prévoir **une ou deux missions secondaires**, un peu comme le mendiant ou le chat
  (à penser plus tard). Les coursiers de l'orphelinat : « une course du matin, c'est-à-dire ? » → à définir
  concrètement ; question du joueur : **nouvel axe d'améliorations avec de nouvelles choses, ou au service des
  mécaniques déjà en place ?**
- **Proposition de Claude pour les coursiers** (à valider) : **les deux**, dans cet ordre.
  - *Au service de l'existant* : (1) **la liste des courses**, le soir au bureau (ou le matin au réveil) : tu coches
    jusqu'à 6 objets parmi ce que le marché vend demain, au prix du marché ; ils sont sur ton comptoir à l'ouverture,
    sans aller au marché toi-même (le matin devient libre pour la diseuse, la nymphe, la forge...). (2) **Le coursier
    de la journée**, au comptoir, à côté de Grippesou : un gamin court au marché chercher un objet au prix normal, en
    ¼ h (Grippesou : ½ h et deux fois le prix). Une course par jour au début.
  - *Un petit axe nouveau, qui mange de l'argent* : l'orphelinat s'améliore, comme les meubles du comptoir :
    **le dortoir** (deux courses par jour), **l'école** (les orphelins apprennent : les courses ne prennent plus de
    temps, et ils rapportent une rumeur du marché le matin), **la grande salle** (les enfants grandis deviennent
    des novices qui viennent chez toi, fidèles dès le premier jour, avec un petit fil d'histoires). Chaque niveau
    coûte cher (1 000 à 5 000 p.), ce qui sert aussi la dépense du jour 100.

### C-5, le paon d'à côté : construit (19/10, v1.11)
- **Les chiffres retenus** (simulation de 32 parties de 220 jours) : il arrive à **pression 2** ; taux de vainqueurs
  **55 / 65 / 75 %** selon la pression ; il attire 0,5 / 1 / 2 clients de passage par jour. Avec ça, toutes les voies
  gagnent et perdent des mois (lumière : il ferme en 2 à 5 mois ; ombre et neutre : plus long, avec des allers-retours).
  Garde-fou : **trois mois de suite gagnés à pression 3, et il se relâche** (il retombe à pression 1) : personne ne
  reste coincé. Le premier essai (ses comptes incluaient les clients volés) le rendait imbattable à pression 3.
- **Ce qui attend sa planche** : le visage de la maison rachetée (orphelinat, petit bar), les coursiers, les missions
  secondaires du bar ; et la maison du paon dans la rue du marché (pour l'instant, on la voit le matin devant ta porte).

### Planches 42 et 43 : l'orphelinat (et les coursiers), le petit bar (19/10, à valider)
- **Planche 42, l'orphelinat** : la maison du paon repeinte (vert tendre, bois, linge qui sèche, craies, les enfants
  devant : jamais pareille à la tienne). **Les coursiers, concrètement** : (1) **la liste des courses**, le soir chez
  toi : jusqu'à 6 objets de ce que le marché vend demain, au prix du marché, sur ton comptoir à l'ouverture (le matin
  devient libre pour la diseuse, la nymphe, la forge) ; (2) **un coursier au comptoir** (à côté de Grippesou) : un gamin
  court chercher un objet qui manque, en ¼ h, au prix de l'étal (Grippesou : ½ h et le double) ; une course par jour.
  **Trois améliorations, chères** : le dortoir (1 500 p. : deux courses par jour, liste de 10), l'école (3 000 p. : les
  courses ne prennent plus de temps au comptoir, une rumeur du marché chaque matin), la grande salle (6 000 p. : de
  temps en temps un ancien de l'orphelinat vient chez toi en novice, ami dès le premier jour, avec son fil d'histoires).
  Réponse à la question du joueur : **les deux** (au service du marché et de Grippesou, et un petit axe neuf qui mange de
  l'argent).
- **Planche 43, le petit bar** : la maison du paon le soir (pierre ocre, étage bordeaux, lanternes, fenêtres allumées).
  Un bouton « Le petit bar » le soir, chez toi : toi derrière le comptoir, trois tables, des habitués qui disent une
  chose chacun (une rumeur vraie sur ce qui arrive demain, un merci, une bêtise), quelques pièces de verres, un habitué
  qui revient demain (+1 client), parfois un jeu de dés. Une soirée prend ½ h de sommeil (réveil un peu plus tard).
  **Deux missions secondaires** (comme le mendiant et le chat) : **A, le ménestrel sans luth** (des gobelins l'ont volé
  au Pont des Ronces ; un aventurier le rapporte comme épreuve en plus ; alors le barde joue chaque soir et le bar
  attire un client de plus par jour) ; **B, la recette perdue de la brasseuse** (trois ingrédients, un par contrée, en
  trouvailles ; la bière des Sept Royaumes donne +1 cœur aux aventuriers qui partent de chez toi). **Trois
  améliorations** : la cave (2 000 p. : plus de verres, rumeurs des deux côtés), la scène (4 000 p. : une veillée par
  semaine, un vieux récit avec un indice sur le monde), la terrasse (8 000 p. : ouvert à midi, +2 clients par jour, les
  nobles du Conseil y traînent).


### Réponses du joueur (19/10) : commandes manquées, noms, planche 42 validée, camp d'entraînement, le bar façon Dave the Diver
- **Planche 42 : tout validé**, avec deux demandes. (1) Les trois améliorations de l'orphelinat **plus chères** :
  le dortoir **2 500 p.**, l'école **5 000 p.**, la grande salle **9 000 p.** (au lieu de 1 500 / 3 000 / 6 000).
  (2) **Plus tard**, une fois les trois bâties : **un camp d'entraînement** pour préparer ceux qui veulent partir à
  l'aventure. Les anciens de l'orphelinat y gagnent, en plus d'être amis, une chance d'arriver à un niveau plus haut.
- **Proposition de Claude pour le camp** (à valider avec sa planche) : **20 000 p.**, la plus chère de toutes. Le niveau
  d'un ancien qui sort du camp : novice 55 %, aguerri 30 %, vétéran 12 %, héros 2,9 %, **légende 0,1 %** (un sur mille :
  sur une partie, à peu près 2 chances sur 100 d'en voir un). Le camp sert aussi le **dernier arc** : vers 85 % du jeu,
  quand tu laisses le comptoir à quelqu'un pour partir apprendre à te battre, c'est là que tu t'entraînes.
- **Le comptoir laissé à un autre vers 85 % du jeu** (idée du joueur) : tu embauches quelqu'un pour prendre ta place, et
  tu pars à l'aventure apprendre à combattre avant le dénouement. À relier au camp, au bar qui tourne seul et à la
  Grande Expédition contre le dragon.
- **« Commande royale » : un mot mal choisi** (il n'y a pas de rois). Propositions de Claude (à choisir) :
  **« commande scellée »** (recommandée : la lettre au sceau rouge, déjà dessinée), « la Levée du Conseil »,
  « commande des Gardiens », « réquisition du Conseil ».
- **Un nom stylé pour « les voyageurs »** (à choisir) : **« les Arpenteurs »** (recommandé : ceux qui arpentent le
  monde), « les Baluchonniers » (le surnom tendre, lié au baluchon), « les Errants », « les Lames-Vagabondes ».
- **Commande manquée deux fois de suite, ou plus** : aujourd'hui, chaque échec fait la même chose (−2 de réputation,
  impôt ×1,5 pendant 2 mois, pas de commande le mois suivant) ; rien ne monte. **Proposition de Claude, « l'échelle
  de la disgrâce »** (à valider) : chaque commande manquée est une **faute** ; une commande livrée en efface une.
  Refuser n'est pas une faute (c'est la sortie honnête), mais trois refus de suite et le Conseil ne propose plus rien
  pendant deux mois.
  - **1re faute** : comme aujourd'hui.
  - **2e faute** : −3 de réputation, impôt ×1,75 pendant 3 mois ; le héraut apporte une **lettre au sceau noir**
    (un avertissement) ; le Conseil confie tes commandes au paon : **sa pression monte d'un cran** tout de suite
    (s'il a fermé, rien) ; la gazette en parle.
  - **3e faute, la disgrâce** : on décroche le **sceau du Conseil** de ta porte (un petit écusson, accroché à ta
    première commande livrée), les **clients prestigieux** ne viennent plus, impôt ×2 pendant 3 mois, aucune commande
    pendant 2 mois. Pour en sortir : la **commande du pardon**, plus grosse, 10 jours, sans prime ; livrée, elle
    efface toutes les fautes et rend le sceau ; ratée, on recommence deux mois plus tard (rien de pire : c'est le
    plafond).
  - Garde-fous : jamais de fin de partie par là ; l'impôt ne dépasse jamais ce que tu as ; jamais plus de ×2.
- **Le petit bar, façon restaurant de Dave the Diver** (demande du joueur, à mettre en planche 43 v2) :
  - **Une soirée de bar jouable**, quand le joueur le veut, avec son horloge comme une journée de comptoir. Le joueur
    embauche **un cuisinier, un barman, un ou deux serveurs** (selon le monde qui peut venir en une soirée). C'est la
    première mécanique un peu complexe, comme la forge ou le combat de la fin.
  - **Le bar tourne seul** au bout de quelques jours, l'équipe au complet : aucun bonus, mais de quoi payer les
    employés et gagner un peu.
  - **Pas un ménestrel : une bande de musiciens** façon cantina de Star Wars (accoutrements et instruments bizarres).
    **Trois bandes au choix**, chacune avec sa paie.
  - **Le conteur du jour** (le joueur ne le choisit pas) : sa paie dépend de sa **renommée**, qui joue aussi sur le
    prix et le nombre de clients.
  - **Les prix sont ceux des installations, plus chers** ; il faut dire au joueur qu'il y aura des paies en plus.
  - **Ouvert à midi** à partir d'un moment, si le personnel est au complet **et** que le joueur a l'argent : à midi,
    le bar tourne seul (le joueur est à son comptoir).
  - **Personnalisable** : la pancarte, le plancher, le comptoir du bar, le mobilier. En plus des améliorations
    (caisses, musiciens, ouverture à midi), **trois améliorations esthétiques payantes**, dites « esthétiques » au
    joueur, qui changent l'intérieur et l'extérieur, le genre de bar et le mobilier.
- **Avis de Claude sur le bar** (à valider) : très bonne idée, et la plus grosse mécanique du jeu ; à construire en
  morceaux, comme la forge, chacun testé avant le suivant. Propositions :
  - **La soirée jouée** (19 h – minuit, cinq heures de jeu en quelques minutes) : les clients s'assoient, commandent ;
    le cuisinier et le barman préparent (une jauge au-dessus de chacun) ; toi, tu prends les commandes, tu portes les
    plats et les chopes (les serveurs portent le reste) ; il faut servir avant que la patience d'une table tombe. Des
    petits imprévus : une bagarre à calmer, un client qui file sans payer, un pourboire. La soirée jouée remplace les
    autres choses du soir (promenade, forge du soir, notaire) : c'est son prix en temps.
  - **Ce que la soirée jouée apporte de plus** que le bar seul : les pourboires, les rumeurs (vraies, sur demain),
    les missions secondaires, les habitués (+1 client au comptoir le lendemain), et la **renommée du bar**, qui monte.
  - **Le bar seul** : rentré chaque nuit, ≈ les salaires + 10 à 20 %. Jamais assez pour remplacer le comptoir.
  - **Les trois bandes** (inspirées de la cantina, sans la copier) : « Les Trois Gobelets » (gnomes et hobbits,
    flûtes-tuyaux et tambours bosselés : pas chers, un peu plus de monde) ; « Les Cornes de Brume » (orcs et ogres,
    grosses cornes de cuivre : plus de boissons fortes vendues, plus de bagarres) ; « Les Ombres Douces » (elfes et
    vampires sous des masques de cuir aux grands yeux noirs, longs instruments de verre : chères, attirent les nobles,
    prix plus hauts).
  - **Les missions secondaires** de la planche 43 restent, adaptées : A devient **l'instrument volé du chef de la
    bande** (au Pont des Ronces) ; B, **la recette perdue de la brasseuse**, ne change pas.
  - **Prix proposés** (installations seules, paies en plus, à valider en planche) : la cuisine 3 000 p., la scène des
    musiciens 6 000 p., la terrasse et l'ouverture à midi 12 000 p. ; les trois améliorations esthétiques 4 000,
    8 000 et 15 000 p. (taverne de quartier → auberge → grande brasserie).

### L'orphelinat : construit (19/10, v1.12)
- **Ce qui est fait** : tout ce que dit la planche 42, aux nouveaux prix (2 500 / 5 000 / 9 000 p.). Les objets que
  les petits achètent comptent pour ta relation avec les marchands, comme si tu y allais toi-même.
- **Les chiffres** (90 nuits simulées, une liste pleine chaque soir) : environ dix objets rapportés par jour avec le
  dortoir ; un ancien de l'orphelinat tous les quinze jours environ après la grande salle (jamais deux à moins de six
  jours d'écart) ; les anciens reviennent ensuite et poursuivent leur fil d'histoires.
- **Pas encore fait** : le camp d'entraînement (après les trois améliorations ; sa planche d'abord) ; le bar (planche
  43 v2 d'abord, d'après les réponses du joueur).

### Question du joueur (19/10) : équilibrer l'orphelinat face au bar, par un avantage au combat
- **La demande** : le bar aura beaucoup plus de choses à faire que l'orphelinat. Donner à l'orphelinat un avantage de
  même poids, par exemple dans les combats de la suite du jeu.
- **Avis de Claude** (à valider) : oui. Chaque voie garde son caractère au combat.
  - **L'orphelinat, « les nôtres »** : au dernier arc, jusqu'à trois anciens se battent à tes côtés, à leur niveau
    (le camp d'entraînement les fait plus forts). Quand tu pars apprendre à te battre, tu t'entraînes au camp : tu
    commences le combat un rang plus haut, avec une technique de plus. Un ancien mort en mission manque ce jour-là.
  - **Le bar, « l'argent et les oreilles »** : plus d'argent pour un meilleur équipement, et des rumeurs qui révèlent
    les faiblesses des ennemis avant le combat. Avantage plus petit au combat, puisque le bar rapporte déjà de l'argent
    et du jeu.
  - **Le réglage** : les deux voies arrivent au combat final à peu près aussi fortes, par des chemins différents. Les
    chiffres se règlent par simulation quand le combat existera.
  - **Le dire au joueur au moment du choix** : sur la lettre du notaire, l'orphelinat dit « plus calme, mais ils se
    souviendront de toi le jour venu ».

### Réponses du joueur (19/10) : anciens, disgrâce, « commande scellée », surnom des voyageurs, la vraie histoire du Grand Sage
- **Les anciens de l'orphelinat** parlent de l'orphelinat à chaque visite (le fil de six phrases, puis une phrase au
  hasard parmi six), et aussi **au retour de mission** (réussie : « Ce soir, à l'orphelinat, je vais tout raconter aux
  petits » ; ratée : « Ne dis rien aux petits »). Accordés au féminin pour les anciennes. **Construit (v1.13).**
- **Planche 43 v2 et toutes les idées du bar : validées.** (La planche dessinée vient d'abord : la salle, la soirée
  jouée, les trois bandes, les trois styles.)
- **L'échelle de la disgrâce : validée**, avec en plus **l'impôt qui monte à chaque faute**, plus fort pour qui penche
  vers les Bannis, sans abuser. **Construit (v1.13)** :
  | Faute | Réputation | Impôt | Pendant | Ce qui arrive |
  |---|---|---|---|---|
  | 1re | −2 | × 1,5 (ombre × 1,75) | 2 mois | pas de commande le mois suivant |
  | 2e, le sceau noir | −3 | × 1,75 (ombre × 2,25) | 3 mois | le paon reçoit tes commandes (sa pression +1) |
  | 3e, la disgrâce | −3 | × 2 (ombre × 2,5) | 3 mois | le sceau quitte ta porte, plus de nobles, deux mois sans commande |
  Une commande livrée efface une faute ; **la commande du pardon** (×1,5 d'objets, 10 jours, sans prime) les efface
  toutes et rend le sceau. Trois refus de suite : deux mois sans proposition (ce n'est pas une faute). Le **sceau du
  Conseil** est accroché à droite de ta porte dès ta première commande livrée ; dans la disgrâce, il ne reste qu'une
  marque plus claire sur le mur et le clou.
- **« Commande scellée »** remplace « commande royale » partout dans le jeu. **Fait (v1.13).**
- **Le surnom des voyageurs** : le joueur garde « voyageur », mais veut un surnom, comme « ceux qui tracent » (ceux
  qui tracent la route à travers les zones et les royaumes pour tout libérer). Propositions de Claude :
  **« les Ouvre-Routes »** (recommandé : clair, fier, se dit bien : « un Ouvre-Route de plus ! »), « les
  Fraie-Chemins », « les Traceurs d'Aube » (ceux qui ramènent le jour sur les terres libérées), « les
  Arpente-Royaumes ». (« Les Passeurs » irait avec le titre, mais le Passeur est déjà le vendeur du marché noir.)
- **Pourquoi tant de monstres dans ce monde** (récit du joueur) :
  - *La version officielle*, dite par le Grand Sage : « le dragon a ouvert la porte au mal, qui en a profité pour
    s'installer ».
  - *La vérité* : c'est le Grand Sage qui a **pactisé avec le chef des vraies forces maléfiques**, pour avoir assez de
    puissance et faire oublier au monde ce qu'il avait commis (le sort d'oubli). Les forces maléfiques se sont
    installées, comme le pacte l'avait prévu. Rusé, le Grand Sage a tout mis sur le dos du **dragon, fils du chef des
    forces maléfiques**. Avec la force offerte par le démon, il a **renvoyé le démon dans son monde** ; mais ce n'est
    qu'une question de temps avant son retour : **la vraie menace, avec le Grand Sage**.
  - **Les vraies forces maléfiques doivent avoir un nom** (à ne pas confondre avec les Bannis). Propositions de
    Claude : **« les Engeances »** (recommandé : on dit « une Engeance » pour un monstre, « les Engeances » pour
    l'armée), « l'Ost d'Outre-Porte », « la Marée Noire », « les Sans-Nom ». Pour leur chef, le démon : « Malgrim,
    le Roi d'Outre-Porte », « Vorhal l'Affamé », « Azarth ». Pour le dragon, son fils : à nommer avec le joueur.
  - **À accorder avec ce qui existe déjà** (proposition de Claude) : la fin neutre dit que le dragon « appartenait
    en fait au Grand Sage », et les visions des parents finissent dans le feu du dragon. Les deux tiennent si le
    Grand Sage **a enchaîné le dragon** avec la force du démon : le feu était bien celui du dragon, mais la volonté
    était celle du Sage. Le dragon serait alors une victime, lui aussi, et peut-être un allié possible à la fin.
  - **Les monstres à étoffer** (les actuels ne sont pas encore très originaux dans les récits) : proposition de
    Claude, une **planche 44 des Engeances**. Elles portent une même marque, pour ne jamais les confondre avec les
    peuples bannis (qui ne sont pas des monstres) : des fissures de lumière violette sur la peau et des yeux sans
    pupille. Une ou deux Engeances par sorte de contrée (forêt, marais, montagne, désert, ruines, mer), avec leur
    façon d'attaquer dans les récits (et l'objet qui aide contre elles). Plus on avance dans le jeu, plus elles sont
    nombreuses : la porte s'entrouvre.

### Planche 43 v2 : le petit bar façon Dave the Diver (19/10, à valider : docs/planches-v059/planche-43-v2-le-bar.png)
- **1. La soirée jouée** (19 h – minuit) : un bandeau en haut (l'heure, la caisse, les clients servis, la renommée).
  Chaque table montre sa commande (une chope, un plat, ou les deux) et sa patience (vert, orange, rouge). Le barman
  et le cuisinier (derrière la passe-plat de la cuisine) préparent, avec leur jauge ; toi, le plateau à la main, et
  les serveurs, vous portez. Clic sur une table : la commande ; clic sur le comptoir : la chope ; clic sur la table :
  servir.
- **2. Les imprévus** : calmer une bagarre (¼ h, une chope offerte, sinon la garde le lendemain), rattraper un
  filou (¼ h, sinon l'ardoise est perdue), un pourboire, une rumeur vraie sur demain.
- **3. Les trois bandes** : les Trois Gobelets (hobbits et gobelins, flûtes-tuyaux, tambour bosselé, 10 p. le soir),
  les Cornes de Brume (orcs et trolls, grosses cornes de cuivre, 18 p.), les Ombres Douces (elfes et vampires sous
  des masques de cuir aux grands yeux noirs, longs tubes de verre lumineux, 30 p.).
- **4. L'équipe et les installations** : cuisinier 12 p., barman 10 p., serveurs 6 p. chacun (le deuxième dès
  12 clients) ; la cuisine 3 000 p., la scène 6 000 p., la terrasse et l'ouverture à midi 12 000 p. ; l'avertissement
  en rouge (« les paies viennent en plus ») ; le conteur du jour (renommée sur 5, paie, clients en plus).
- **5. Le bilan** : soirée jouée (exemple : +69 p., renommée, rumeur, habitué, mission) contre bar tout seul
  (exemple : +14 p., aucun bonus).
- **6. Les trois styles** (esthétiques) : la taverne de quartier (au départ), l'auberge (4 000 p. : vert, fleurs,
  fanions), la grande brasserie (15 000 p. : vert-bleu profond, cuivre, lustre, carrelage, terrasse éclairée) ;
  intérieur et extérieur changent ensemble.

### Réponses du joueur (19/10, soir) : planche 43 v2 validée, le videur, les Ouvre-Routes, l'Engeance, Vorhal'Düm
- **Planche 43 v2 validée**, avec trois retouches (planche 43 v3) :
  - les clients étaient assis **sur** les tables : ils doivent être assis **sur des chaises**, à côté de la table ;
  - le damier de la grande brasserie **débordait sur le mur** : il reste au sol ;
  - de la taverne à l'auberge, l'intérieur ne change pas assez. Proposition retenue à montrer : **à chaque style,
    plusieurs pièces à changer** (le sol, les murs, les tables, les chaises, le comptoir, les lumières), comme les
    améliorations du comptoir.
- **Le videur** (nouveau) : la **dernière installation** du bar, et un employé de plus à embaucher. Il gère les
  bagarres et rattrape les filous, sans que tu y passes ton quart d'heure. Selon son niveau, il peut ne rien gérer
  du tout, en gérer un sur deux, ou tout gérer. Chiffres proposés sur la planche 43 v3.
- **Le surnom des voyageurs** : **les Ouvre-Routes** (validé). « Voyageur » reste le mot de tous les jours ; « un
  Ouvre-Route » est le surnom, fier, de ceux qui tracent la route à travers les royaumes pour tout libérer.
- **Les vraies forces du mal** : **l'Engeance** (validé). Un monstre de l'Engeance, l'armée de l'Engeance.
- **Leur chef, le démon** : **Vorhal'Düm l'Affamé** (choisi par le joueur).
- **Le dragon, son fils** : un nom à la façon de « Smaug le Terrible ». Propositions de Claude : **« Vhaldrak le
  Terrible »** (recommandé : « Vhal- » comme son père Vorhal'Düm, « -drak » pour le dragon ; on entend le lien sans
  qu'on le dise), « Ignarök le Terrible », « Skarvath la Cendre-Vive », « Draugmor le Dévoreur d'Aube ».
- **La vraie histoire, accordée** (validé par le joueur) :
  - le Grand Sage **garde le dragon prisonnier** : pour faire pression sur Vorhal'Düm (ça ne marchera pas
    éternellement), et pour que **sa version de l'histoire** reste dans toutes les têtes, sous le **sort d'oubli** ;
  - le dragon **a bien aidé** le Sage, avec l'Engeance et avec les pouvoirs que Vorhal'Düm avait donnés au Sage,
    comme le voulait leur pacte ;
  - **le dragon en allié** est possible si le joueur fait les bons choix, mais **ce doit être difficile**.
    Proposition de Claude (à valider plus tard) : il faut réunir trois choses, (1) assez d'**éclats de vérité**
    (des souvenirs qui percent le sort d'oubli : visions de la Nuit des Brumes, Madame Ysmée, lettres rares),
    (2) **briser ses chaînes** (un objet très rare, forgé chez toi), (3) ne **jamais** avoir vendu d'arme
    « tueuse de dragon » ni accepté de mission contre lui.
- **Le camp d'entraînement** : **validé tel quel** (20 000 p., après les trois améliorations de l'orphelinat ; les
  anciens de l'orphelinat ont des chances d'arriver à un niveau plus haut, 0,1 % en légende). Sa planche d'abord.

### Planche 43 v3 : le petit bar, retouches (19/10, à valider : docs/planches-v059/planche-43-v3-le-bar.png)
- **Les clients sur des chaises** : chacun a sa chaise à côté de sa table (tabouret dans la taverne, chaise à
  dossier dans l'auberge, velours rouge dans la brasserie), assis dessus, tourné vers la table.
- **Un vrai sol en profondeur** (du bas du mur jusqu'au bas de l'écran) : tables et clients sont posés dessus, sur
  deux rangs. Le damier de la brasserie ne monte plus jamais sur le mur.
- **Le videur** : dernière installation (15 000 p.), puis on l'embauche. Chaque soir, selon son niveau :
  | niveau | paie | ne gère rien | un sur deux | gère tout |
  |---|---|---|---|---|
  | novice | 8 p. | 30 % | 50 % | 20 % |
  | aguerri | 14 p. | 15 % | 45 % | 40 % |
  | vétéran | 22 p. | 5 % | 30 % | 65 % |
  Ce qu'il rate revient au joueur (¼ h), sinon la garde le lendemain ou l'ardoise perdue. Il monte d'un niveau
  toutes les 15 soirées. Quand le bar tourne seul, il évite aussi une partie des pertes.
- **Trois salles bien à elles** : la taverne (planches, poteaux, tabourets, bougies) ; l'auberge (chaux et
  colombages, soubassement vert, fenêtre fleurie, nappes à carreaux, tapis, lanternes, fanions) ; la grande
  brasserie (vert-bleu et moulures d'or, boiserie, miroir, marbre et cuivre, velours, damier, lustres).
- **Embellir pièce par pièce** : sept pièces (sol, murs, tables, chaises, comptoir, lumières, façade), achetées une
  par une, dans l'ordre qu'on veut, et qui se mélangent. Auberge : 500, 700, 600, 400, 700, 300, 800 p. (4 000 en
  tout) ; brasserie : 2 000, 2 200, 2 000, 1 500, 3 000, 1 300, 3 000 p. (15 000 en tout). Les pièces de la
  brasserie s'ouvrent quand l'auberge est complète. Esthétique seulement.

### Planche 44 : l'Engeance, Vorhal'Düm et le dragon (19/10, à valider : docs/planches-v059/planche-44-l-engeance.png)
- **La marque** : fissures de lumière violette sur tout le corps et yeux sans pupille. Des monstres, pas un peuple :
  jamais au comptoir (les Bannis, eux, sont des peuples). **La Porte s'entrouvre** : quelques-unes au début, de plus
  en plus, puis la marée vers la fin.
- **Une bête par sorte de contrée**, avec sa façon d'attaquer dans les récits et ce qui aide contre elle :
  - **le Cerf-Charogne** (forêts) : charge, bois de ronces → la hache, le bouclier ;
  - **la Noyeuse** (marais) : tire par les chevilles sous l'eau des gués → la corde, l'amulette ;
  - **le Brise-Roc** (montagnes, cols) : faux éboulis, fait tomber la montagne → le marteau ;
  - **le Scarabée-Sablier** (déserts) : creuse sous les pas, avale les chariots → la lance, de l'eau ;
  - **le Sans-Visage** (ruines, cryptes) : éteint les torches, **mange les souvenirs** (un lien avec le sort
    d'oubli) → les torches, l'amulette ;
  - **la Gueule-d'Abysse** (mer, grands lacs) : brise les barques par en dessous → l'arc, la lance.
- **Vorhal'Düm l'Affamé** : décharné, six cornes, six yeux sans pupille, une gueule au ventre. On le voit à peine,
  derrière l'arche de la Porte, enchaîné par le **sceau d'or du Sage**, qui se fêle peu à peu.
- **Le dragon enchaîné** dans sa caverne par les chaînes d'or du Sage : l'otage contre Vorhal'Düm et le gardien
  du sort d'oubli. Noms proposés : **Vhaldrak le Terrible** (recommandé), Ignarök le Terrible, Skarvath la
  Cendre-Vive, Draugmor le Dévoreur d'Aube.

### Réponses du joueur (19/10, nuit) : planche 43 v3 validée (deux retouches), planche 44 validée (sauf trois points)
- **Planche 43 v3 validée**, avec deux retouches (planche 43 v4 : docs/planches-v059/planche-43-v4-le-bar.png) :
  - les **bulles de commande** sur **fond noir** (bordées de clair) : la chope et le plat ressortent mieux ;
  - le **videur** tient le filou avec **sa vraie main** : nouvelle pose « empoigne » dans le moteur des corps
    (`src/corpsVueHD.js`, le bras du côté où il regarde, tendu devant lui à hauteur d'épaule). **Règle** : pour une
    animation, on peut créer une pose nouvelle, mais **jamais de bras en plus** dessiné par-dessus.
- **Planche 44** : tous les monstres validés. Retouches (planche 44 v2 : docs/planches-v059/planche-44-v2-l-engeance.png) :
  - la barre violette n'était pas claire : c'est **la Porte qui s'entrouvre au fil du jeu** (plus le jeu avance,
    plus il y a de bêtes de l'Engeance dans les récits). Redessinée : trois petites portes de plus en plus ouvertes,
    avec de plus en plus d'yeux ;
  - **Vorhal'Düm validé, mais sans bouche** (ni au ventre, ni au visage) : **il parle directement dans la tête** de
    ceux à qui il s'adresse ;
  - **la Porte** : plus mystique, **façon le Voile** (Harry Potter 5) : une arche de pierre brute, seule sur son
    estrade, au milieu de gradins ; un voile pâle et déchiré qui ondule et murmure ; Vorhal'Düm à peine visible
    derrière ; le sceau d'or du Sage, fêlé, en haut de l'arche ;
  - **le dragon s'appelle Vhaldrak le Terrible** (validé). Nouveau dessin, d'après Smaug, les dragons de House of
    the Dragon et l'image du joueur : une vouivre noire au ventre de braises, les ailes pour bras, le long cou en S,
    les cornes en arrière, l'œil d'or ; enchaînée au cou par les chaînes d'or du Sage.
- **Le pacte, corrigé** (pour bien comprendre) : **Vorhal'Düm** obtient du Sage le droit de **faire entrer son
  Engeance sur les terres des Bannis**, en les **partageant avec le Sage** ; en échange, il **donne au Sage une part
  de sa force**. Ce n'est pas le Sage qui a créé l'Engeance.
- **Ce que veut Vorhal'Düm** : que son Engeance **connaisse enfin la vie à la surface** (à approfondir plus tard).
- **Vhaldrak en allié** : les trois conditions sont validées : (1) assez d'**éclats de vérité**, (2) **briser ses
  chaînes** avec un objet très rare forgé chez soi, (3) n'avoir **jamais vendu d'arme « tueuse de dragon »**.

### Réponses du joueur (19/10, fin de nuit) : planches 43 v5, 44 v3, 45 ; idées (18 ans, icône, Conseil, ville, tortues)
- **Planche 43 v5** (docs/planches-v059/planche-43-v5-le-bar.png) :
  - le videur tient le filou **par les chevilles, tête en bas**, et le **secoue** : les pièces tombent de ses poches
    (bulle : « Vide tes poches. Toutes. Et après, tu sors. ») ;
  - le joueur (**adulte**, HommeGoy, à ce moment du jeu) **porte vraiment le plateau** : nouvelle pose « plateau »
    dans le moteur des corps (le bras du côté où il regarde, plié, la main ouverte à hauteur d'épaule, sous le
    plateau) ;
  - le reste est validé (« le troll qui se sert de son bras pour le porter, c'est mieux »).
- **Planche 44 v3** (docs/planches-v059/planche-44-v3-l-engeance.png) :
  - la nouvelle Porte est validée ; **la salle autour**, façon l'intérieur du vaisseau de Ronan (Les Gardiens de la
    Galaxie) : une salle immense et silencieuse, des piliers en lames qui montent dans le noir, **un sol de cercles de
    runes** autour du milieu (là où Ronan pose son marteau) ; **la Porte au centre**. **À 50 km à la ronde, même les
    bêtes les plus féroces n'osent pas approcher** ;
  - **Vhaldrak** : pattes et queue remises au propre (deux pattes bien posées : cuisse, jarret, pied à trois serres
    vers l'avant ; la queue en une seule courbe qui s'affine jusqu'à la pointe).
- **Planche 45 : l'icône de goyniverse sur l'écran d'accueil iPhone** (docs/planches-v059/planche-45-icone-ecran-accueil.png) :
  trois propositions : A le jeune héros au coucher du soleil, B la tête de Vhaldrak dans un anneau d'or, C le baluchon
  sur la route. Une fois choisie : une image 180 × 180 (`apple-touch-icon`), le nom sous l'icône, et l'ouverture en
  plein écran (sans la barre de Safari). Mise en ligne seulement avec l'accord du joueur (Cloudflare).

#### Idées du joueur (à mettre en place plus tard)
- **L'anniversaire des 18 ans** : pour que le joueur ne rate pas le passage de **JeuneGoy à HommeGoy**, une **fête
  d'anniversaire**, quand le moment est venu : Garrick, les **frères de sang**, les amis que le joueur s'est faits,
  **le mendiant** si sa relation est au maximum (quêtes secondaires), etc. Proposition de Claude : la veille du saut
  de temps vers 18 ans, un soir de fête au shop (gâteau, chandelles, cadeaux selon les amitiés), puis le réveil en
  HommeGoy (« Te voilà un homme, petit... enfin, plus si petit »). Les invités dépendent de ce que le joueur a fait.
- **Les Gardiens du Conseil, chacun son rôle** (à réfléchir ensemble). Propositions de Claude, pour lancer :
  Maître Bertolin Pommeval (le Comté) : **le trésor et l'impôt** ; Dame Aliénor de Hautval : **la justice et les
  primes** (les recherchés) ; Durgan Barbe-de-Fer : **la forge et les armes** (les commandes scellées) ; Dame
  Ilyriel : **les routes et les contrées** (les cartes, les permis) ; l'Archimage Séraphine : **le savoir et le sort
  d'oubli** (elle sait, peut-être) ; Sire Valdric : **la guerre** (le Rempart).
- **Une ville plus grande et plus vivante** : plus de maisons pendant la promenade, des bâtiments **en
  construction** (qui finissent par s'ouvrir), **des enfants qui jouent**, plus de passants qui font des choses.
- **Changer de ville en gardant sa maison** : **les tortues géantes** (la taille d'un bateau de croisière pour les
  plus grandes) transportent maisons, bâtiments et choses très lourdes ; tout le royaume les connaît et s'en sert
  pour déménager (comme la grande tortue de Spellcaster University, ou Zunesha, l'éléphant géant de One Piece qui
  porte une civilisation). **Un emplacement de maison par royaume.** Changer de ville change **les habitants, les
  décors, les marchés** (petites différences) et donne **des événements propres à chaque royaume**. Un joueur
  **d'ombre** peut s'installer **en terre des Bannis**, pas un joueur de lumière.
  - **Questions de Claude** (pour régler les incohérences, à voir avec le joueur) : ce qui suit la maison (le shop, la
    forge, l'arrière-boutique : oui ; **l'orphelinat, le bar, le paon, la banque** : restent dans leur ville ?) ;
    **les clients habitués et les héros** (ils suivent, ou on recommence des amitiés ?) ; **le prix et la durée** du
    voyage (un mois de fermeture ? une somme ?) ; **quand** (après un palier d'étoiles ? une fois par an ?) ;
    **revenir** dans une ancienne ville (oui, la maison peut repartir) ; **les commandes scellées et l'impôt** (le
    Conseil suit le joueur partout, ou chaque royaume a ses règles ?).

### Réponses du joueur (20/10) : planche 43 v5 validée, icône A, le représentant des Bannis, la vie en ville, les déménagements
- **Planche 43 v5 : tout est validé.** (Planche 44 v3 : pas encore de retour.)
- **Planche 45 : on garde l'icône A** (le jeune héros). **Fait (v1.15)** : `assets/icones/icone-180.png` pour l'écran
  d'accueil de l'iPhone (`apple-touch-icon`), une petite icône d'onglet, un `manifest.webmanifest` (Android) ; le nom
  sous l'icône est « goyniverse » ; le jeu s'ouvre en plein écran. En ligne seulement avec l'accord du joueur
  (Cloudflare).
- **Les 18 ans** : validé tel que proposé (la fête au shop la veille, les invités selon les amitiés, le réveil en
  HommeGoy).
- **Les rôles des Gardiens** : validés tels que proposés. **Et un septième siège : le « représentant des Bannis »**,
  choisi par le Grand Sage. Il est **à la botte du Conseil** et trahit les Bannis sans le savoir : le Conseil s'en
  sert pour faire dire et faire aux Bannis et aux peuples de la Confrérie ce qui arrange le Grand Sage. **Très naïf** :
  il croit sincèrement que la situation des Bannis se réglera par la politique. À peaufiner. Propositions de nom
  (Claude) : **Maître Ombrel Doux-Verbe** (un gobelin lettré, lunettes, rouleaux sous le bras, toujours un
  « compromis » à la bouche) ; « Brogan Main-Tendue » (un orc diplomate) ; « Sire Lucan des Deux-Rives » (un vampire
  poli). Il pourrait venir au comptoir et dire des choses qui sonnent juste... mais qui servent le Sage.
- **Rendre la ville plus vivante** (validé, et des idées en plus de Claude) : des **oiseaux** (pigeons sur les toits,
  hirondelles au printemps), des **rongeurs** (souris aux caves, écureuils dans les arbres), des chantiers qui
  avancent jour après jour, des enfants qui jouent (marelle, cerceau, cache-cache), un crieur, un rémouleur, des
  lavandières au lavoir, des chats, des chiens, du linge qui sèche. **Des petites choses à faire pour se détendre** :
  **arroser ses plantes** (des pots au rebord des fenêtres, qui fleurissent si on s'en occupe), nourrir les pigeons,
  jeter des ricochets dans le canal, pêcher un peu, cueillir des pommes, jouer aux osselets avec les enfants, allumer
  les lanternes le soir, donner un os au chien du marché. Rien d'obligatoire, rien qui rapporte beaucoup : juste du
  plaisir (et parfois un petit souvenir pour l'étagère).
- **Les tortues géantes de déménagement** : validé.

#### Les déménagements : réponses du joueur et propositions de Claude
1. **La Banque goyenne est dans tous les royaumes**, et ses bâtiments sont de plus en plus puissants et riches à
   mesure qu'on avance. **L'orphelinat et le bar restent dans leur ville** : il faut alors **un dédommagement**, ou que
   le joueur **garde certains avantages** selon les améliorations qu'il y avait faites. Et chaque royaume aura **ses
   propres mécaniques** (à inventer pour qu'elles collent avec le royaume).
   - *Proposition de Claude* : l'orphelinat et le bar **continuent de tourner tout seuls** dans l'ancienne ville (le
     bar avec son équipe, l'orphelinat avec les grands qui s'occupent des petits). Le joueur reçoit **chaque mois une
     petite lettre et une petite rente** (le bar seul, comme aujourd'hui), et garde **un avantage par amélioration**
     faite : l'école → la rumeur du matin continue (par lettre) ; la grande salle → les anciens de l'orphelinat
     peuvent encore venir le voir ; la scène du bar → le conteur du jour passe parfois en tournée, etc. Chaque nouveau
     royaume a son **bâtiment à lui** à la place (par exemple une écurie de griffons dans le royaume du ciel, une
     serre sous l'eau...).
2. **Les frères de sang et les voyageurs « avant-héros » ou héros** voyagent avec le joueur ; il dit au revoir aux
   autres et se fait de nouvelles amitiés. **Le joueur peut revenir voir ses anciennes villes.**
   - *Proposition de Claude* : une **ligne régulière de tortues** (plus petites, pour les voyageurs) relie les villes
     déjà habitées : un voyage d'un jour, pour une visite (on voit le bar, l'orphelinat, les anciens amis, on prend
     une lettre), puis on rentre. La maison, elle, ne bouge que pour un vrai déménagement.
3. **Le prix et le voyage** (cher, mais sans bloquer trop longtemps) :
   - *Conseil de Claude* : **un prix lié à ce que le joueur gagne**, pour qu'il ne soit jamais bloqué : environ
     **trois mois de bénéfice moyen**, avec un **plancher** (10 000 p. pour le premier déménagement) et un plafond qui
     monte à chaque royaume (×1,5 à chaque fois). Le prix comprend la tortue et le nouveau terrain. Et la Banque
     goyenne propose un **« prêt de déménagement »** à rembourser dans la nouvelle ville, pour ceux qui sont juste.
   - **Le voyage se vit** (proposition) : une cinématique de départ (la tortue soulève la maison), puis **quelques
     jours sur le dos de la tortue** : un **petit comptoir de voyage** pour les passagers, des **quêtes de bord** (un
     passager malade, un passager clandestin, une tempête, un marché flottant quand on croise une autre tortue) qui
     font avancer les jours, puis une cinématique d'arrivée. **De plus en plus long à chaque royaume** : 3 jours, puis
     5, puis 7, etc.
   - **Des lieux bien différents** pour chaque royaume (demandé par le joueur) : par exemple **une ville dans les
     cieux** (sur des îles volantes), **une ville sous l'eau** (sous une grande bulle), une ville dans les arbres
     géants, une ville creusée dans la montagne, une ville sur un lac gelé... (à choisir avec le joueur, un par royaume).
4. **Quand peut-on déménager** : quand un royaume est **complètement conquis/libéré**. Si un royaume est libéré trop
   vite, on peut **ajouter des lieux à libérer**, avec les nouvelles bêtes de **l'Engeance** (rare, voire presque
   absente au début, comme le montre la petite jauge de la Porte).
5. **Revenir dans ses anciennes villes** : voir le point 2 (la ligne régulière de tortues, pour une visite).
6. **Le Conseil gère tous les royaumes sauf ceux des Bannis.** Chez les Bannis, une autre mécanique :
   - **un Conseil des Bannis**, qui a l'air moins organisé, mais plus déterminé ; il réunit **les meilleurs
     guerriers**. **Garrick en fait partie**, et le joueur ne l'apprend **pas tout de suite** ;
   - comme un joueur d'ombre gagne moins d'argent, **pas d'impôt** chez les Bannis : le joueur **choisit ce qu'il
     offre en dons** ; les dons vont **aux familles les plus démunies** et à **reconstruire** les royaumes ravagés par
     le Grand Sage, le dragon et l'Engeance (et on le voit : les décors se réparent peu à peu).

#### Les vestiges des Bannis dans les royaumes du Conseil (idée du joueur)
Dans les décors des royaumes du Conseil, des **traces discrètes** que ces terres appartenaient autrefois aux Bannis.
Subtiles, mais qu'un joueur attentif peut remarquer :
- **les défenses de groliphants** (d'énormes bêtes, un mélange d'éléphant, de mammouth et d'hippopotame ; seuls les
  orcs s'en servent pour leurs maisons et bâtiments) : une défense couverte de mousse au loin dans un décor de
  hobbit, une autre qui sert de banc dans un jardin du Comté ;
- *idées de Claude, à compléter* : des **pierres levées gobelines** retournées pour faire des bornes de champ ; une
  **fresque orque** qui réapparaît sous la chaux d'un mur qui s'écaille ; un **pont de troll** (immense, aux marches
  trop hautes) repris pour une route ; des **noms de lieux** à moitié effacés (« Grokval » devenu « Grandval ») ; des
  **cryptes vampires** sous les vignes d'un domaine noble ; une **berceuse** que fredonnent les plus vieux sans savoir
  d'où elle vient ; des **totems** pris dans le tronc d'un vieil arbre ; un **mot de la langue orque** gravé sur une
  vieille cloche.

### Réponses du joueur (20/10, suite) : planche 44 v3 validée, Maître Ombrel, tout le reste validé
- **Planche 44 v3 validée.**
- **Le représentant des Bannis au Conseil** : **Maître Ombrel Doux-Verbe**, le gobelin lettré (lunettes, rouleaux sous
  le bras, toujours un « compromis » à la bouche). Naïf, choisi par le Grand Sage, à la botte du Conseil sans le
  savoir. **Il passe au comptoir** et dit des choses qui ont l'air justes, mais qui servent le Sage.
- **La ville vivante** : toutes les idées sont validées (oiseaux, rongeurs, chantiers, enfants, lavoir, rémouleur,
  arroser ses plantes, ricochets, osselets, lanternes...). **Ajout : un petit lac pour pêcher.**
- **Les déménagements** : toutes les propositions sont validées (orphelinat et bar qui tournent seuls avec une lettre
  et une rente, un avantage par amélioration, un bâtiment propre à chaque royaume, la ligne régulière de petites
  tortues pour revisiter, le prix ≈ trois mois de bénéfice avec plancher et prêt de déménagement, le voyage vécu à bord
  de plus en plus long, le Conseil des Bannis avec Garrick et les dons).
- **Les vestiges des Bannis** : tous validés.
- **Idées en plus** :
  - **dessiner les cours d'eau et les mers sur la carte du jeu** ;
  - **les tortues** de déménagement et de voyage **nagent autant qu'elles marchent** : des nageoires **et** des pattes ;
  - **des chimères façon griffons** (World of Warcraft) qui se débloquent **plus tard** et permettent de voyager plus
    vite.
- **Encore ouvert** : le lieu de chaque nouvelle ville (dans les cieux, sous l'eau, dans les arbres géants, dans la
  montagne, sur un lac gelé...) et à quel royaume il va.
- **Planche 46 : les eaux de la carte** (docs/planches-v059/planche-46-les-eaux-de-la-carte.png, à valider) : la baie
  des Brisants (sud-ouest), le lac de Lune (Elfes, autour de la contrée « le lac »), le lac gelé (Nains), l'étang du
  Moulin près du comptoir (pour la pêche), le torrent des Nains et l'affluent du lac qui rejoignent le Grand Fleuve
  (élargi), le ruisseau de la Comté jusqu'à l'étang, le Fleuve des Cendres chez les Bannis (gris, sous le pont) ; une
  barque sur le fleuve et une tortue géante qui nage dans la mer d'Opale. Les noms s'écrivent à la plume. **Dessiné dans
  le jeu (`creerCarteHD`), pas encore publié sur l'artefact** (en attente de validation).
- **Planche 46 validée** : les eaux de la carte sont publiées (v1.15, artefact).

#### Les lieux des villes et leur ordre (proposition de Claude, à valider)
On suit les étoiles des royaumes ; chaque ville a sa façon d'arriver (la tortue marche, nage... ou ne suffit plus) :
| ordre | royaume | la ville | l'arrivée | son événement | voyage |
|---|---|---|---|---|---|
| 1 | la Comté ★ | le village des collines (le départ, aujourd'hui) | — | (les fêtes déjà là) | — |
| 2 | les Hommes ★★ | **Port-Brisant, une ville sur pilotis**, dans la baie des Brisants : des canaux, des barques, un marché aux poissons | la tortue **nage** jusqu'au port | la Grande Marée (le port inondé un jour par an) | 3 jours |
| 3 | les Nains ★★★ | **une ville creusée dans la montagne** : sans soleil, des lanternes, des forges, des wagonnets ; la maison posée dans une grande niche taillée | la tortue **grimpe** la route des cols | la Nuit des Forges | 5 jours |
| 4 | les Elfes ★★★★ | **une ville sous l'eau, sous une grande bulle**, au fond du lac de Lune | la tortue **plonge** dans le lac | la nuit où la bulle chante | 7 jours |
| 5 | les Mages ★★★★★ | **une ville dans les cieux, sur des îles volantes** au-dessus d'Opale | la tortue ne vole pas : les mages **soulèvent la maison**, et c'est là que **les griffons (les chimères) se débloquent** | l'Éclipse des Arcanes | 9 jours |
| à côté | les Monts de Bambou | **une ville dans les bambous géants, en terrasses**, avec des ponts suspendus (un détour possible entre deux royaumes) | la tortue marche entre les tiges | la fête des lanternes de bambou | 4 jours |
| ombre | les Terres des Bannis | **Cendrebourg, une ville qui se reconstruit** dans les ruines, au bord du Fleuve des Cendres ; les maisons orques en défenses de groliphants (seulement pour un joueur d'ombre, à la place d'un royaume du Conseil) | la tortue passe la Grande Muraille de nuit | les dons et la reconstruction (on voit la ville se relever) | 6 jours |
| fin | les Terres sauvages | **la ville-tortue** : la ville entière vit sur le dos de la plus grande tortue, qui marche et nage sans jamais s'arrêter (comme Zunesha), au plus près de l'Antre du dragon | on ne la rejoint pas : on monte à bord | (vers ~85 % du jeu : le joueur confie le comptoir et part apprendre à se battre) | — |
- Le lac gelé des Nains pourrait accueillir un **petit village de pêcheurs sur la glace** (une visite, pas une ville).
