# Document de conception (GDD) — Premier-Jeu

> Titre provisoire. Ce document résume l'idée du jeu et sert de référence pendant le développement.
> Il évoluera au fil des étapes.

## 1. Pitch

Un jeu de gestion narratif dans l'esprit de *Papers, Please*, *Dealer's Life Legends* et *Dave the Diver*, en pixel art 2D.

Le joueur est un jeune orphelin humain (homme ou femme, au choix) qui tient un comptoir de ravitaillement pour aventuriers. Il prépare leurs commandes (provisions, armes, munitions, soins…) depuis sa fenêtre de comptoir et **investit** dans leurs chances de réussite : un aventurier qui revient vivant partage son butin, un aventurier qui meurt fait tout perdre.

Le jeu couvre toute une vie : on commence à ~15 ans dans un petit comptoir cosy et on finit vieux et barbu, face à une menace qui grandit.

## 2. Boucle de jeu

```
MATIN       → Le Mastre Marché : acheter le stock (légal), mini-jeux d'argent, mendiant
JOUR        → Le comptoir : servir les voyageurs, préparer leurs commandes
SOIR (rare) → Le Marché Noir : objets interdits, voyageurs nocturnes aux quêtes farfelues
NUIT        → Bilan, améliorations du shop, dormir → jour suivant
```

En arrière-plan, les aventuriers partis sont en quête pendant **plusieurs jours** (durée variable), puis reviennent (ou non) avec leur part du butin.

### 2.1 Le cœur : servir et investir
- Chaque jour, un nombre de voyageurs se présente. Ils font **la queue** devant la fenêtre : on voit combien de clients attendent encore.
  - **Prévus** : ils envoient une lettre 2 ou 3 jours avant avec leur commande (on peut anticiper le stock).
  - **Imprévus** : des événements spéciaux inédits (un nain pressé, un client blessé, une inspection de garde…).
- Chaque voyageur a une **commande** (besoins) liée à sa quête.
- Le joueur la remplit avec son stock. Plus la commande est complète et de qualité, plus la **chance de réussite** est élevée.
- Résultat de la quête : succès (retour + part du butin), mort valeureuse, ou mort sans gloire → investissement perdu.
- **Le récit** : quand un aventurier revient, il raconte son aventure dans une petite cinématique. On le voit affronter chaque épreuve, et comment chaque objet du colis l'a aidé (ou lui a manqué). S'il meurt, c'est son carnet de voyage retrouvé qui raconte.
- **La prévision** : chaque soir, on sait combien de clients viendront le lendemain, sous forme de fourchette (« entre 3 et 6 clients »). Elle grandit avec la réputation, l'expérience (clients servis) et la variété du stock.
- **Les quêtes ont toutes des durées différentes** : certains reviennent le lendemain, d'autres après plusieurs semaines.
- Les fiches des voyageurs permettent de suivre : à venir / présents / partis / revenus / morts.

### 2.2 Économie
- Argent visible en temps réel (pile de pièces sur le bureau).
- Dépenses : achat de stock au marché, marché noir, améliorations, jeux d'argent, dons.
- Revenus : parts de butin des aventuriers revenus.
- Tableau de chiffre d'affaires : jour / semaine / mois / année.

### 2.3 Gérer son comptoir
- **Refuser** : on peut refuser un client (pour ne pas l'envoyer à une mort certaine) ou une commande par lettre. Ça coûte de la réputation : 1 point pour un client, 0,5 pour une lettre.
- **Les lettres** sont plus exigeantes (une ou deux épreuves demandent un objet de plus) mais rapportent 25 % de plus.
- **Les longues quêtes** demandent plus de rations et rapportent plus (+30 % de butin par jour en plus).
- **Les habitués et la réparation** : un aventurier revenu vivant peut revenir comme client. Il garde ses objets durables (épée, corde, gourde), qui s'usent à chaque épreuve (3 crans). Le joueur peut les réparer : ça ne coûte rien en stock, et c'est le client qui paie.
- **La réserve** est limitée (20 places au départ), et on peut l'agrandir en payant (30, 40, puis 55 places).
- **L'assortiment** du fournisseur change chaque jour : les objets de base (rations, gourdes, torches, bandages) sont toujours là, les autres apparaissent au hasard en quantité limitée. Les prix varient.
- **Le marchand express** (Fennick le Pressé, personnage récurrent) passe au comptoir pendant la journée. Il vend quelques objets au hasard, 2,5 fois plus cher, livrés directement dans le colis. Ce n'est jamais rentable : ça sert juste à sauver un voyage.
- **La banque** : des prêts débloqués par la réputation (plus la réputation est haute, plus on peut emprunter, et moins cher). La Main Noire (la mafia) prête à tout le monde, à 45 %. Les échéances sont prélevées chaque nuit.
- **La faillite** : on peut être à découvert, mais à -100 pièces, le comptoir ferme. Une cinématique comique montre le banquier et ses gardes qui viennent tout saisir (parchemin de dettes trop long, garde qui trébuche, dernière pièce confisquée, planches clouées sur la porte).
- **Capital de départ** : 80 pièces, pour tenir le temps que les premiers aventuriers reviennent.

### 2.4 Relations et familles
- Chaque client a une relation avec le joueur : **Pires ennemis, Ne s'aiment pas, Hypocrite, Neutre (ou Inconnu), Connaissance, Amis, Frères de sang**.
- Elle bouge selon tes actes : colis complet (+1), colis pauvre (−1), retour vivant (+2), réparation (+1), refus (−3), lettre refusée (−1).
- Effets : la part de butin reversée va de ×0,6 (pires ennemis) à ×1,25 (frères de sang).
- Paliers franchis la première fois : **Amis** → cadeau de matériaux ; **Frères de sang** → une décoration pour le shop ; **Pires ennemis** → ta réserve est saccagée.
- **Les familles** : quand un aventurier meurt, un proche (fils, fille, frère, sœur, père, mère) peut venir au comptoir quelques jours plus tard. Ce qu'il veut dépend de la relation avec le disparu, plus un peu de hasard :
  - **la colère** : dédommager (25 p.) ou le renvoyer (il devient ton pire ennemi) ;
  - **un souvenir** : offrir un objet de ta réserve, ou refuser ;
  - **la relève** : il reprend la quête du disparu, et tu l'équipes ;
  - **un hommage** (frères de sang) : le disparu t'a laissé une décoration.

### 2.5 Compétences du joueur (le côté RPG)
- **Flair** : au début, l'estimation des chances (« Ton flair dit : ~60 % ») est faussée et arrondie. Elle s'affine avec l'expérience, jusqu'au pourcentage exact (40 clients servis).
- **Marchandage** : la relation avec Maître Gédéon, le fournisseur, monte avec ce que tu dépenses chez lui (1 point par 40 pièces). Connaissance : −5 %, Amis : −10 % et un objet rare de plus chaque soir, Frères de sang : −20 % et une décoration.
- **Artisanat** : réparer coûte des matières premières (fer pour l'épée, cuir pour la corde et la gourde). Au début il en faut 3 par réparation, puis 1 de moins tous les 4 réparations (minimum 1).
- **Les décorations** du shop donnent des bonus : Carte des contrées (+4 % par épreuve), Trophée de loup (plus de clients), Lanterne enchantée (+10 % de butin), Enclume naine (1 matériau de moins par réparation).
- Plus tard : des talents à choisir aux grands âges de la vie.

### 2.6 Risque : le marché noir
- Ouvre certains soirs seulement.
- Grimoires interdits, potions illégales, artefacts.
- Voyageurs nocturnes : quêtes farfelues, gros gains possibles, mais s'ils se font prendre, **les conséquences retombent sur le joueur**.

### 2.7 Aider pendant l'aventure
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
- **Prologue** (cinématique d'introduction, après le choix garçon/fille) : le jeune orphelin sauve **Garrick Cœur-de-Chêne**, un aventurier emporté par une rivière, le soigne, répare ses armes, chasse pour le nourrir et lui prépare des provisions. Des jours plus tard, l'aventurier revient avec un trésor. Le jeune ne sait pas quoi demander, mais il a aimé s'occuper de lui → l'aventurier lui offre son **premier shop** et un petit capital.
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

**Vue 2 : arrière du shop**
- Le stock (tout ce qui a été acheté).
- Le lit → passer à la nuit / au jour suivant.

**Vue extérieure** : façade avec l'enseigne au nom choisi par le joueur.

**Autres lieux** : le Mastre Marché (matin), le Marché Noir (certains soirs).

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

## 9. Plan de développement (étape par étape)

Chaque étape doit donner une version **jouable**.

| # | Étape | Contenu |
|---|---|---|
| 1 ✅ | **Prototype du comptoir** | Une journée, 4 voyageurs en file d'attente, un stock fixe ; on donne des objets ; calcul de la chance de réussite ; cinématique du récit ; bilan. |
| 2 ✅ | **Les quêtes dans le temps** | Plusieurs jours ; quêtes de durées variables ; les aventuriers reviennent faire la queue pour raconter leur récit, ou un colporteur rapporte leur carnet ; lettres de commandes annoncées ; prévision « entre X et Y clients » ; fournisseur simple le soir. |
| 2+ ✅ | **Gérer son comptoir** | Refus de clients et de lettres, lettres plus exigeantes, habitués et réparations, réserve limitée, assortiment variable, marchand express, banque et Main Noire, faillite. |
| 2++ ✅ | **Relations et cinématiques** | 7 niveaux de relation, familles des disparus, flair, marchandage, artisanat et matières premières, décorations, cinématique d'introduction, cinématique de faillite. |
| 3 | **Le Mastre Marché** | Acheter son stock le matin, prix, quantités limitées. |
| 4 | **Les fiches et le bureau** | Fiches voyageurs (à venir/présents/partis/revenus), voyageurs annoncés à l'avance, tableau de CA, tiroirs de stats. |
| 5 | **Les deux vues du shop** | Comptoir ↔ arrière (stock + lit), façade avec le nom du shop. |
| 6 | **Sauvegarde** | Sauvegarder / charger une partie. |
| 7 | **Premiers graphismes pixel art** | Remplacer les formes par de vrais sprites et décors. |
| 8 | **Réputation et améliorations** | Clients plus exigeants, décoration, améliorations la nuit. |
| 9 | **Le Bien et le Mal** | Races maléfiques, objets du bien / du mal, réputation par camp, dialogues qui changent. |
| 10 | **Marché noir** | Objets interdits, voyageurs nocturnes, conséquences. |
| 11 | **Aider pendant l'aventure** | Messages de détresse, le grand aigle, les mercenaires. |
| 12 | **Le petit bar** | Rumeurs, boissons, recrutement de mercenaires. |
| 13 | **Histoire** | Prologue, personnages récurrents, mendiant, menace qui grandit. |
| 14 | **Vie du personnage** | Vieillissement, famille ou vagabond. |
| 15 | **Fins du jeu** | La fin du bien et la fin du mal. |
