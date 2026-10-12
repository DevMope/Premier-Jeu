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
- Chaque jour, un nombre de voyageurs se présente.
  - **Prévus** : ils s'annoncent quelques jours à l'avance (on peut anticiper le stock).
  - **Imprévus** : *à décider* — simples clients en plus, ou événements spéciaux inédits.
- Chaque voyageur a une **commande** (besoins) liée à sa quête.
- Le joueur la remplit avec son stock. Plus la commande est complète et de qualité, plus la **chance de réussite** est élevée.
- Résultat de la quête : succès (retour + part du butin), mort valeureuse, ou mort sans gloire → investissement perdu.
- Les fiches des voyageurs permettent de suivre : à venir / présents / partis / revenus / morts.

### 2.2 Économie
- Argent visible en temps réel (pile de pièces sur le bureau).
- Dépenses : achat de stock au marché, marché noir, améliorations, jeux d'argent, dons.
- Revenus : parts de butin des aventuriers revenus.
- Tableau de chiffre d'affaires : jour / semaine / mois / année.

### 2.3 Risque : le marché noir
- Ouvre certains soirs seulement.
- Grimoires interdits, potions illégales, artefacts.
- Voyageurs nocturnes : quêtes farfelues, gros gains possibles, mais s'ils se font prendre, **les conséquences retombent sur le joueur**.

## 3. Progression
- **Commandes** de plus en plus grosses et chères ; investissements plus risqués.
- **Réputation** + **décoration/design** + **stock disponible** → attirent des voyageurs plus prestigieux, riches et exigeants.
- **Améliorations du shop** la nuit ; le shop lui-même change au fil du jeu (plusieurs shops / lieux).
- **Choix de vie** : vie de famille ou vagabond, chacun avec avantages et inconvénients.
- **Personnages récurrents** : voisins sympathiques, gens qui proposent des services contre récompense, influences malveillantes.
- **Le mendiant** : donner de l'argent peut avoir un impact plus tard.

## 4. Histoire
- **Prologue** : le jeune orphelin sauve un aventurier emporté par une rivière, le soigne, répare ses armes, chasse pour le nourrir et lui prépare des provisions. Des jours plus tard, l'aventurier revient avec un trésor. Le jeune ne sait pas quoi demander, mais il a aimé s'occuper de lui → l'aventurier lui offre son **premier shop** et un petit capital.
- **Fil rouge** : une menace grandit (piste actuelle : un grand dragon sous la montagne mystique — *à confirmer*). Le monde a de plus en plus peur.
- **Fin unique** : le joueur équipe le groupe d'aventuriers qui part affronter la menace.

## 5. Environnement et interface

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

Le joueur ne quitte jamais vraiment son shop, sauf pour ces marchés (écrans/menus dédiés).

## 6. Ambiance et direction artistique
- Fantasy inspirée du *Hobbit*, du *Seigneur des Anneaux* et de *The Witcher 3*.
- Début : mystique, joli, cozy.
- Ton qui s'assombrit progressivement à mesure que la menace grandit, jusqu'à la délivrance finale.
- 2D, pas de vraie 3D : mélange dessin / pixel art (*Papers, Please*, *Dealer's Life Legends*, *Dave the Diver*).

## 7. Questions ouvertes
- Les clients imprévus : simples clients en plus, ou événements spéciaux ?
- La grande menace : un dragon, ou autre chose ?
- Comment se calcule précisément la chance de réussite d'une quête ?
- Comment fonctionnent les conséquences du marché noir (amende, garde, fermeture temporaire…) ?
- Combien de shops / lieux au total ?
- Durée d'une partie complète (nombre de jours/années) ?

## 8. Plan de développement (étape par étape)

Chaque étape doit donner une version **jouable**.

| # | Étape | Contenu |
|---|---|---|
| 1 | **Prototype du comptoir** | Une journée, 3 voyageurs, un stock fixe ; on donne des objets ; calcul de la chance de réussite ; affichage de l'argent. Graphismes en formes simples. |
| 2 | **Les quêtes dans le temps** | Plusieurs jours, le lit pour passer au lendemain, quêtes de durées variables, retour ou mort, part du butin. |
| 3 | **Le Mastre Marché** | Acheter son stock le matin, prix, quantités limitées. |
| 4 | **Les fiches et le bureau** | Fiches voyageurs (à venir/présents/partis/revenus), voyageurs annoncés à l'avance, tableau de CA, tiroirs de stats. |
| 5 | **Les deux vues du shop** | Comptoir ↔ arrière (stock + lit), façade avec le nom du shop. |
| 6 | **Sauvegarde** | Sauvegarder / charger une partie. |
| 7 | **Premiers graphismes pixel art** | Remplacer les formes par de vrais sprites et décors. |
| 8 | **Réputation et améliorations** | Clients plus exigeants, décoration, améliorations la nuit. |
| 9 | **Marché noir** | Objets interdits, voyageurs nocturnes, conséquences. |
| 10 | **Histoire** | Prologue, personnages récurrents, mendiant, menace qui grandit. |
| 11 | **Vie du personnage** | Vieillissement, famille ou vagabond. |
| 12 | **Fin du jeu** | L'expédition finale contre la menace. |
