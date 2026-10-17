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
| v 0.95 | **Le Carrefour rééquilibré** (validé le 17/10) | **Serment de lumière** : +1 client par jour (les pèlerins), la garde ne fouille plus, un soin sur deux sans potion (les clercs), un paladin escorte une mission par semaine (un bouton au comptoir : +1 cœur au départ), +10 % de butin dans les terres de lumière. **Serment d'ombre** : le marché noir ouvre chaque soir, les objets interdits +10 %, le Passeur rapporte chaque semaine le baluchon d'un mort (ses objets durables et la moitié de ses provisions reviennent dans la réserve, le carnet le dit), +10 % de butin dans les terres d'ombre. Tout est écrit sur les vitraux du Carrefour. Planche 20c : l'été refait (un vrai champ de blé derrière la maison, des meules et une gerbe). |
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
