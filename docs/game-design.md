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
- Chaque client a une relation avec le joueur : **Pires ennemis, Ne s'aiment pas, Hypocrite, Neutre (ou Inconnu), Connaissance, Amis, Frères de sang**.
- **La couleur des noms** suit la relation, du rouge (pires ennemis) au vert vif (frères de sang) en passant par l'orange, l'ambre et le neutre : au comptoir, dans le registre, sur les lettres, au marché et dans les récits.
- Elle bouge selon tes actes : colis complet (+1), colis pauvre (−1), retour vivant (+2), réparation (+1), refus (−3), lettre refusée (−1).
- Effets : la part de butin reversée va de ×0,6 (pires ennemis) à ×1,25 (frères de sang).
- **Paliers de plus en plus durs** : une mission parfaite fait passer d'Inconnu à Connaissance (3 points), puis il en faut 8 pour Amis et 16 pour Frères de sang. Côté négatif : Hypocrite à −1, Ne s'aiment pas à −4, Pires ennemis sous −8.
- Paliers franchis la première fois : **Amis** → cadeau de matériaux ; **Frères de sang** → une décoration pour le shop ; **Pires ennemis** → ta réserve est saccagée.
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
- **Les familiers** : obtenir un ou plusieurs familiers selon les quêtes et les relations (le grand aigle en est un). Comment exactement : à définir.
- **Les zones conquises** : envoyer des aventuriers libérer (camp du bien) ou conquérir (camp du mal) une zone, pour pouvoir s'y installer et avancer dans l'histoire. Chaque nouvelle zone a son biome et son ambiance. Il faut financer le voyage et le nouveau shop : on ne déménage que pleinement préparé. À construire une fois le Bien et le Mal en place.

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
- 2D, pas de vraie 3D : mélange dessin / pixel art (*Papers, Please*, *Dealer's Life Legends*, *Dave the Diver*).

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
| 7 | **Premiers graphismes pixel art** | Remplacer les formes par de vrais sprites et décors. |
| 8 | **Réputation et améliorations** | Clients plus exigeants, décoration, améliorations la nuit. |
| 9 | **Le Bien et le Mal** | Races maléfiques, objets du bien / du mal, réputation par camp, dialogues qui changent. |
| 10 | **Marché noir** | Objets interdits, voyageurs nocturnes, conséquences. |
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
