# Lumière et Ombre : la refonte (Q298, Q301, Q305)

Pour le suivi (le joueur lit les fiches) : les 12 fiches illustrées sont dans `scratchpad/lot3/a_valider/ombre-lumiere/fiches/` (PNG, 1968 px de large), générées par `scratchpad/lot3/ombre-lumiere/fiches.js` et `rendre.js`.

★ = validé par le joueur · ☆ = proposition de Claude. Ce document remplace, pour la façon de gagner des points et pour la voie neutre, les sections 3, 5 et 6 de `degres-ombre-lumiere.md` (dont les sept degrés, l'inertie et la simulation restent valables).

Ce que le joueur a dit (02/11, Q296 à Q306) ★ :
- la jauge visible est adoucie : moins le joueur sait où il en est, mieux c'est (Q296) ;
- les degrés plaisent, sauf le mot « tiède » (Q297) ;
- le système de gain de points et la voie neutre sont à refaire entièrement ; le jeu pousse vers la Lumière par les dialogues, les récits et les faits, pas par un barème qui rapporte plus de Lumière (Q298) ;
- un extrême atteint, plus de retour en arrière, sauf par les récits ; l'extrême de l'Ombre ferme les villes de la Lumière, et l'inverse (Q301) ;
- la carte et le résumé de VieuxGoy peuvent nommer le chemin suivi (Q304) ;
- une autre voie, ou une autre mise en scène, pour la 8e pièce, avec la même ville des Bannis (Q305) ;
- questions sans codes, propositions en images (Q302, Q303, Q306).

---

## 1. L'inventaire : ce qui fait bouger la jauge aujourd'hui (fiche 2)

La jauge (`G.lo.points`, de −100 à +100) ne bouge que par `pencher(G, clé)` (src/regles.js), avec le barème `BAREME_CAMP` (src/data.js, complété par src/voyage.js), le frein (`FREIN_CAMP`) et le serment ×1,5.

| Clé | Côté | Points | Où on l'appelle (la situation) |
|---|---|---|---|
| `mendiant` | ☀ | 1 | regles.js `donnerAuMendiant` (une fois par jour) |
| `soigner` | ☀ | 1 | regles.js `soigner(…, { gratuit })` |
| `dedommager` | ☀ | 1 | regles.js `dedommager(…, 'maximum')` |
| `routeAider` | ☀ | 1 | voyage.js : les faire entrer au chaud, soigner un blessé |
| `decoClaire` | ☀ | 2 | regles.js : acheter une décoration de lumière |
| `missionL` | ☀ | 3 | regles.js : une mission réussie en terre de lumière |
| `denoncer` | ☀ | 4 | regles.js `denoncerRecherche` (et la garde, quand on livre un recherché caché) |
| `denoncerMafia` | ☀ | 4 | mafia.js `denoncerMafia` |
| `ame` | ☾ | 1 | regles.js `recolter` : chaque mort « voulue » (piège, baluchon vide, aucune chance) |
| `routeSergent` | ☾ | 1 | voyage.js : soudoyer le sergent de la Porte des Hommes |
| `routeRancon` | ☾ | 1 | voyage.js : vendre les soins à un blessé |
| `piege` | ☾ | 2 | regles.js (un piège dans le baluchon) ; mafia.js `rendreService` ; CounterScene (le corbeau de la Main Noire, message de détresse) ; evenementsComptoir.js (soudoyer l'inspecteur des poids et mesures) |
| `miseNoire` | ☾ | 2 | mises.js `parierContre` |
| `commande` | ☾ | 2 | regles.js `honorerCommande` (les Bannis du marché noir) ; evenementsComptoir.js (le paquet de Garrick) |
| `decoSombre` | ☾ | 2 | regles.js : acheter une décoration d'ombre |
| `missionO` | ☾ | 3 | regles.js : une mission réussie pour les Bannis ; ombreAnnee.js : un contrat du marché noir |
| `cacher` | ☾ | 4 | regles.js `cacherRecherche` (repris si on le livre ensuite) |

Ce qui ne bouge pas la jauge alors qu'on le croirait :
- **le Parrain** : `choisirParrain` (parrain.js) appelle `pencherCamp`, qui n'écrit que dans `G.reussites`, un ancien compteur qui ne sert plus qu'à reprendre les très vieilles sauvegardes (`jaugeAncienne`). Se taire (☾ 1) et le dénoncer (☀ 2) **ne comptent pas**. Même chose pour l'appel à `pencherCamp` dans les recherchés (sans effet, mais `pencher` est aussi appelé) ;
- les commandes scellées du Conseil, le mécénat, les chantiers de la Confrérie et du repaire, le serment lui-même, le choix de la bande (Main Noire ou Serpent) : rien.

**D'où viennent les points** (parties automatiques de 120 jours, 4 par stratégie, `sim_degres.js` avec un compteur autour de `pencher`) :
- joueur de Lumière : 116 points de Lumière par partie, dont les missions 63 %, les dédommagements 24 %, le mendiant 11 %, les dénonciations 2 % ; il gagne aussi 34 points d'Ombre par les morts (« âmes offertes ») ;
- joueur de l'Ombre : 132 points d'Ombre, dont les commandes des Bannis 75 %, les recherchés cachés 14 % ;
- le neutre qui surveille la jauge : 64 de Lumière, 13 d'Ombre ; il n'a **aucune** mission chez les Bannis, parce que leurs terres restent cachées tant qu'on n'est pas descendu au marché noir (regles.js, `visiteMarcheNoir`).

**Ce qui lit la jauge** (une cinquantaine d'appels à `jaugeCamp`, `palierCamp`, `coteCamp`, `sermentDe`) : le HUD (la bulle avec le chiffre et le nom du palier, les « +N ☀ » qui flottent, `gainCamp`), le livre des deux voies (BureauScene), la gazette des paliers, la taxe de la Confrérie, les taux de la Banque, la garde (`GARDE.parPalier`), la chance du marché noir, la Main Noire (palier ≤ −2), les peuples qui viennent au comptoir (Bannis côté ombre, peuples de lumière tardifs), la réputation et le butin selon le camp (`EFFETS_CAMP`), la Confrérie et le repaire (`confrerieOuverte`, `repaireOuvert`), le mécénat (`regimeDesRiches`), la menace, la Nuit des Brumes, la diseuse, le Parrain, Garrick (CounterScene, evenementsComptoir), le Conseil, le rival, Pont-Royal (les taxes du duc), la forge (recettes de l'ombre), l'envie, le comptoir du matin, l'armure (`coteArmure`, le sceau), le Carrefour (`surveillerLO`), le succès « Ni l'un ni l'autre ».

---

## 2. Le nouveau système : trois mesures (fiches 1, 3 à 6)

### 2.1 L'allégeance ☆ (cachée) : pour qui tu travailles vraiment
- Les sept degrés de `degres-ombre-lumiere.md`, avec le nouveau mot à la place de « tiède » (proposé : « naissante » ; autres : « effleuré », « penchant ») : Ombre profonde, Ombre, Ombre naissante, Neutre, Lumière naissante, Lumière, Lumière ardente.
- Elle ne compte **que les faits qui servent un camp**, avec **le même poids des deux côtés** (chaque fait a son jumeau) :

| ☀ Pour la Confrérie | Poids | ☾ Pour les Bannis |
|---|---|---|
| Mission réussie dans une contrée de la Confrérie | 1 | Mission réussie dans une contrée des Bannis, contrat du marché noir |
| Afficher une décoration de la Confrérie | 1 | Afficher une décoration des Bannis |
| L'aigle du fauconnier du Conseil (détresse) | 1 | Le corbeau de la Main Noire (détresse) |
| Commande scellée du Conseil | 3 | Commande des Bannis, paquet de Garrick |
| Chantier de la Confrérie, mécénat du Sage | 3 | Chantier du repaire, don au Drômmath (nouveau) |
| Faire taire un doyen | 3 | Écouter un doyen, le croire |
| Chasser une fissure du Sage | 3 | Garder une fissure en mémoire |
| Dénoncer un vrai recherché | 5 | Cacher un recherché |
| Protéger une église-relais du chant ★ Q181 | 5 | Saboter une église-relais |
| Escorter un convoi de la Confrérie | 5 | Piller un convoi (les escarmouches ★) |
| Livrer la Main Noire | 8 | Monter en grade dans la Main Noire |
| Prêter serment à la Confrérie | 10 | Prêter serment aux Bannis |
| Dénoncer le Parrain | 10 | Baiser la bague du Parrain |

- Les faits secrets comptent (l'âme sait). Un recherché caché puis livré : les deux faits restent.
- Les **actes graves** (dénoncer, cacher, livrer la bande, le Parrain) ouvrent le dernier degré (avec le serment), et à 8 on ne redevient plus neutre.
- L'élan et l'inertie restent ceux de `degres-ombre-lumiere.md` (section 4).

### 2.2 Le cœur ☆ (caché) : la bonté n'est d'aucun camp
- Bonté : donner au mendiant 1, soigner sans faire payer 1, dédommager généreusement 1, aider sur la route 1, épargner un soldat hypnotisé ou relâcher un prisonnier 3, accueillir une famille en fuite 3.
- Cruauté : faire payer un blessé 1, parier contre un aventurier 2, envoyer quelqu'un sans aucune chance 2, glisser un piège 3, dénoncer un innocent 5, une mission de sabotage pour la Faucheuse ou un massacre 8.
- Pourquoi : le Sage appelle « Lumière » tout ce qui est bon ; le barème actuel fait de même, ce qui revient à mettre le mensonge du Sage dans les règles. En séparant, la révélation de la fin (★ Q138 : « il n'y a jamais eu de camps ») est aussi vraie dans les mécaniques.
- Ce qu'il change : Lumière ardente et grande cruauté → le duel avec Garrick ; Ombre profonde et grande cruauté → « le Boucher convaincu » (★ Q142), et plus personne de la Lumière à convaincre ; beaucoup de bonté → des aides au bon moment (témoin, messager, le pigeon ★ Q117) ; la carte de VieuxGoy (★ Q304).
- La Faucheuse garde sa jauge à part ★ (16/10).

### 2.3 Le regard du monde ☆ (visible mais flou) : ce que chaque camp croit de toi
- Deux renoms séparés : la Confrérie, les Bannis. On peut être bien vu des deux (le neutre au sauf-conduit), mal vu des deux, ou admiré par la Confrérie en servant les Bannis en secret (l'infiltré, ★ Q117).
- Ils ne comptent que ce qui se voit ou se sait : missions, commandes, décorations, chantiers, dénonciations ; **la bonté vue dans la Comté nourrit le renom de la Confrérie** (« Que la Lumière te bénisse ! »). Un fait secret ne compte que si la garde le découvre.
- Ils remplacent la jauge pour tous les effets lus aujourd'hui (taxes, banque, garde, marché noir, Bannis au comptoir, Main Noire, Confrérie et repaire, mécénat) et **déclenchent le Carrefour** : le monde t'invite quand il te croit à lui.
- Affichage (Q296) : plus de chiffre, plus de nom de palier, plus de « +N ☀ » ; au bureau, le blason de la Confrérie qui brille ou se ternit, la fleur de pommier des Bannis qui s'ouvre ou se ferme, une phrase entendue. Les ☀ / ☾ des boutons (avec du flair) : question 3.

---

## 3. Pousser vers la Lumière sans tricher (fiche 7)

Les points sont symétriques. Ce qui pousse :
1. **Ce qu'on raconte** : la version du Sage partout (l'ouverture, la gazette, les crieurs, le prêche des églises).
2. **Ce qu'on voit** : les conséquences immédiates sont flatteuses côté Lumière (le bandit dénoncé, la route sûre le lendemain) et coûteuses côté Ombre (la garde qui fouille) ; les vraies conséquences viennent plus tard (les fissures, les révélations).
3. **Ce que disent les gens** : la bonté appelée « Lumière » ; Garrick qui sonne complotiste au début ★.
4. **Les portes** : la Lumière vient à toi (garde, Conseil, Confrérie) ; l'Ombre se cherche (le mot de passe, la nuit, la cave, les terres cachées avant le marché noir, déjà dans le code).
5. **La peur** : l'Ombre coûte tout de suite (amendes, rumeurs) ; la Lumière, plus tard et en secret.
6. **L'invitation** : le Carrefour vient du regard du monde, et comme la bonté se voit et s'appelle « Lumière », la Confrérie invite presque toujours la première.

---

## 4. La voie neutre et son non-retour (fiche 8)

- On devient neutre par ses choix : ne jamais jurer, rester libre au Carrefour, servir les deux camps ; l'indécision (l'ancienne « tiédeur ») s'accumule en secret.
- **Le dernier appel** ☆ (nouvelle scène) : la même semaine, Garrick puis un Gardien viennent chacun convaincre le joueur. S'il ne répond à aucun alors que son allégeance est neutre, il devient **le spectateur** : point de non-retour (Q113 ★). Moment à trancher : vers la 5e pièce, ou à la 7e (l'annonce du sceau par Garrick ★).
- Le spectateur peut encore : tenir son comptoir, envoyer des missions (payées, sans allégeance), être bon ou cruel (le cœur bouge), les deux marchés, le sauf-conduit, l'amitié du Passeur.
- On ne lui propose plus : le serment ; la garde ne lui demande plus de dénoncer, ni les Bannis de cacher (les recherchés passent) ; les choix du Parrain ; les missions de guerre.
- Au sceau, il reste neutre quel que soit le regard du monde (règle nouvelle, à valider : aujourd'hui la jauge déciderait).
- Le jour de l'armure ★ : le Sage vient la chercher au comptoir ; la donner à Sire Valdric, la donner à un Banni, ou la garder pour personne.
- Autour ★ : Garrick blague, la Faucheuse se moque, le Sage remercie pour les taxes, la Main Noire disparaît.

---

## 5. Les extrêmes : plus de retour, sauf par les récits (Q301, fiche 9)

- Au dernier degré (Lumière ardente, Ombre profonde), aucun fait ne fait plus redescendre.
- Des **récits**, chacun une fois, offrent de redescendre d'un cran, sans changer de camp :
  - Lumière ardente, les récits du doute : la phrase du Sage qui contredit un indice ; l'enfant qui fredonne la berceuse que le Sage dit inexistante ; le mendiant et la médaille ; le témoin du projet souterrain. « Y repenser » : retour à Lumière, et l'occasion d'essayer de prévenir les Bannis s'ouvre.
  - Ombre profonde, les récits de la retenue : le soldat hypnotisé qui se réveille en mourant (★ Q142) ; une famille de la Lumière qui demande asile ; Garrick qui demande d'épargner un village ; le doyen « Avant, il n'y avait ni lumière ni ombre » ★. L'écouter : retour à Ombre, et l'on peut de nouveau convaincre des gens de la Lumière (une condition de la victoire des Bannis ★).
- Changer de camp passe toujours par le parjure ★, et seulement une fois redescendu.

## 6. Les villes fermées (Q301, fiche 10)

- Ombre profonde face aux villes de la Lumière (Pont-Royal…) : la contrebande par les tunnels du Passeur (la nuit, le bas-quartier, prix forts, rafles) ; un prête-nom (un employé tient l'étal, moitié des gains) ; le déguisement (barbier et garde-robe, risque d'être reconnu) ; les missions de nuit (délivrer un prisonnier banni, faire taire une église-relais) ; les lettres et les pigeons de la Main Noire.
- Lumière ardente face aux villes des Bannis (Cendrebourg) : le Passeur intermédiaire (il garde sa part) ; la foire neutre des pandas (★ royaume neutre respecté de tous) ; l'espionnage pour la Confrérie ; les échanges de prisonniers au pont des Trolls ; le pigeon, seule façon d'essayer de prévenir les Bannis, si un récit du doute l'a ouverte.
- Dans les deux cas, les aventuriers y vont toujours : c'est le marchand qu'on n'admet plus.

## 7. La 8e pièce (Q305, fiche 11)

Aujourd'hui (regles.js, `recompenserZones`), chaque royaume libéré donne la pièce suivante, et la 8e demande les Terres des Bannis : un joueur de Lumière doit y faire des missions (☾), et les parties automatiques n'y arrivent jamais en 200 jours.
- **A. On te la remet** : en Ombre, le Drômmath la tend à Cendrebourg, à la tombée du jour ; en Lumière, sur les ruines de Cendrebourg après la reddition ; en neutre, le Passeur l'achète au marché de Cendrebourg.
- **B. Le voyage à Cendrebourg** (ma préférence) : une seule expédition au lieu d'une conquête ; l'épreuve du Drômmath, l'ambassade ou le raid (selon le cœur), la traversée sous sauf-conduit.
- **C. Elle vient au comptoir** : un doyen ou Garrick frappe une nuit avec le Pavois des Mille Flèches ; la garder, la livrer à la garde, la vendre au Passeur.

## 8. Vérification (parties automatiques, 120 jours)

Avec les poids de l'allégeance seule (la bonté et la cruauté retirées des degrés, `POIDS2=1` dans `sim_degres.js`, 6 parties par stratégie) : les sept degrés restent atteints ; la Lumière ardente vers le jour 42, l'Ombre profonde vers le jour 72 ; le neutre reste neutre 97 % du temps ; aucune erreur.

## 9. Dans le code, après validation (rien n'est encore changé)

- `src/degres.js` : séparer l'allégeance (les degrés actuels, poids des fiches), le cœur (nouveau compteur), le regard du monde (deux renoms) ; le verrou des extrêmes (sans ancrage de 21 nuits : immédiat) ; les récits de retour ; le dernier appel et le spectateur.
- `src/regles.js` : `pencher` devient trois appels possibles (allégeance, cœur, regard) ; `palierCamp` / `coteCamp` lisent le regard du monde pour les effets du monde, l'allégeance pour le sceau et les fins ; `surveillerLO` (le Carrefour) lit le regard ; le Parrain branché pour de bon.
- `src/scenes/HudScene.js`, `BureauScene.js` : plus de chiffre ni de « +N ☀ » ; le blason et la fleur.
- La migration : l'allégeance reprend les degrés actuels ; le regard reprend la jauge ; le cœur part de zéro (ou des morts voulues et des dons au mendiant déjà comptés).

## 10. Les questions (fiche 12)

1. Trois mesures (allégeance cachée, cœur caché, regard du monde visible mais flou), la bonté qui ne compte plus comme Lumière : d'accord ?
2. Le mot à la place de « tiède » : « naissante », « effleuré » ou « penchant » ?
3. Plus aucun chiffre à l'écran ; les ☀ / ☾ sur les boutons (avec du flair) : on les garde ou on les enlève ?
4. Les avantages en argent de chaque côté (réputation en terres de la Confrérie, butin chez les Bannis) : on les garde ?
5. Le dernier appel du neutre : vers la 5e pièce, ou à la 7e ?
6. Le spectateur reste neutre au sceau, même si le monde le croit d'un camp : d'accord ?
7. La fin où JeuneGoy, ayant suivi la Lumière aveuglément et commis les pires atrocités envers les Bannis, affronte Garrick en duel et meurt (sauf sursis de la Faucheuse) : seulement au dernier degré de la Lumière et très cruel ? Et ce joueur ne peut plus essayer de prévenir les Bannis tant qu'un récit du doute ne l'a pas fait redescendre ?
8. Le neutre qui penche un peu : quand le Sage vient chercher l'armure au comptoir, garde-t-il les trois choix (Sire Valdric, un Banni, la garder pour personne), ou seulement celui de son côté et « la garder » ?
9. Les récits de retour : une fois chacun, un cran, sans changer de camp ?
10. Les villes fermées : quelles possibilités garder ?
11. La 8e pièce : A, B ou C ?

---

## 11. La suite (Q309 à Q311, le spectateur) ☆

Validé le 02/11 ★ (Q302 à Q316) : les trois mesures ; « naissante » / « effleuré » / « penchant » ; les ☀ ☾ gardés ; la fin de mort réservée au dernier degré de la Lumière et à la grande cruauté ; le neutre qui penche n'a que le choix de son côté et « la garder » ; les récits de retour ; toutes les possibilités des villes fermées ; la 8e pièce par un seul grand voyage à Cendrebourg (piste B). Les fiches de la suite : `scratchpad/lot3/a_valider/ombre-lumiere/fiches2/` (9 fiches, `fiches2.js`, `rendre2.js`).

### 11.1 Le dernier appel : le calcul (Q311)
- **Parties simulées** (pas de relevé des vraies parties du joueur) : `sim_degres.js` avec `SCEAU=0.6` (le joueur vise, plus d'une fois sur deux, un royaume pas encore libéré, quel que soit son camp) et `STOP7=7`, 7 stratégies × 12 parties, jusqu'au jour 450 (`lancer3.sh`, `sceau.js`).
- Règle de la piste B pour le calcul : le sceau = 7 royaumes libérés (n'importe lesquels, les terres des Bannis comprises) + le voyage à Cendrebourg (9 jours : 3 de préparatifs, 5 de route, 1 sur place).
- Résultat : 51 parties arrivent à la 7e pièce (29 faillites dans les premières semaines, 4 bloquées à 6 pièces, hors calcul). **7e pièce au jour 169 en moyenne** (écart 95, médiane 145, du jour 60 au jour 450). Sceau au jour 178 ; le dernier appel, une semaine avant : **jour 171**.
- Par stratégie : conquérant 94, Lumière 127, distrait 127, girouette 146, Main Noire 196, neutre 204, Ombre 259. **L'Ombre est bien plus lente** : ses clients bannis refusent les terres de la Confrérie, et l'armure demande des royaumes de la Lumière.
- Proposition : plutôt qu'un jour fixe (option A, jour 171), le dernier appel vient dans chaque partie **le soir où arrive la 7e pièce**, quand on prépare le voyage (option B) : une semaine environ avant le sceau, quel que soit le rythme.

### 11.2 Le spectateur
- Sa vie : la gazette de guerre (une carte du front), deux clients qui racontent la même bataille autrement, les réfugiés des deux camps, le commerce de guerre (tout se vend, et plus cher), les lettres de remerciement du Sage pour les taxes et la plaque, Garrick blagueur qui raconte le front, la Faucheuse qui compte les morts de la semaine, le chat qui rapporte ce que disent les bêtes ; la musique qui s'amincit, les lueurs d'incendie à l'horizon ; la cave vide un matin (la Main Noire ★).
- Ses quatre aides secrètes (le cœur, jamais l'allégeance) : une nuit à l'abri pour un blessé de n'importe quel camp ; le courrier des deux rives ; la lanterne à la fenêtre ; le registre des noms des morts des deux camps.
- À la fin : la carte de VieuxGoy « le Témoin », « l'Indécis » ou « le Marchand de guerre ».

### 11.3 La faculté qui montre les ☀ ☾ (Q309)
- Noms : la Lucidité (préférée), le Discernement, la Clairvoyance. Le flair reste pour le commerce (estimations, imposteurs).
- Elle se gagne en « ouvrant les yeux » (une lueur à chaque fois) : découvrir la vraie conséquence d'un choix, démasquer un imposteur, repérer un faux présage, écouter un doyen jusqu'au bout, remarquer une fissure du Sage, lire la berceuse. Visible sans chiffre : la lampe de chevet de la chambre.
- Paliers : 3 lueurs, un liseré sur les choix qui comptent ; 8, ☀ ou ☾ ; 15, une feuille (bon) ou une goutte rouge (cruel) ; 25, une phrase de présage au survol.
- Elle s'éteint en présence du Sage ; la Lumière ardente n'en gagne plus, sauf par un récit du doute.

### 11.4 Les avantages des camps (Q310)
- Tableau en 7 lignes (clients, objets, prix, lieux, événements, protections, risques) : la Lumière gagne l'argent et le confort, le neutre la liberté, l'Ombre la vérité et la fidélité (fiche 6 de la suite).
- La règle « l'Ombre gagne toujours moins » : aujourd'hui (parties simulées, argent moyen au jour 120) Lumière ≈ 70 000, neutre ≈ 52 000, Ombre ≈ 35 000 ; proposé : Lumière 100, neutre ≈ 95, Ombre ≈ 80.

### 11.5 Correction
- La fiche des villes fermées précise que la foire des pandas est **hors** des terres des Bannis : aux Monts de Bambou, terrain neutre, où un joueur de Lumière peut encore croiser des marchands bannis.

---

## 12. Troisième série (Q324, Q325, les Bannis au comptoir, Garrick et le neutre) ☆

Validé le 02/11 ★ (Q317 à Q325) : le dernier appel le soir de la 7e pièce ; la vie du spectateur comme base, mais Garrick cesse forcément de venir quand la guerre éclate (il devient le héros à la place de JeuneGoy) ; toutes les aides secrètes ; le neutre s'enrichit avec la guerre (grosses commandes d'armes, avec le futur système de forge) ; **la Clairvoyance** ; les trois façons de tenir un comptoir ; l'Ombre à 80 %. Principe ★ : chaque ajout oblige à mettre à jour les mécanismes plus anciens. Fiches : `scratchpad/lot3/a_valider/ombre-lumiere/fiches3/` (10 fiches, `fiches3.js`, `rendre3.js`).

### 12.1 Les dépenses par camp (Q324)
- Inventaire (fiche 1) : le quotidien (marché, Thorgal, Grippesou, colporteur, salaires, loyer, dédommagements, soins, secours) ; le comptoir et la maison (8 améliorations de 80 à 3 500 p., les styles de décor, l'étage 8 000 à 18 000 p., le coin des chats) ; les chantiers (orphelinat, bar, pattes, forge) ; soi-même (garde-robe, barbier, fêtes, jeux, diseuse, pêche, mendiant, fontaine) ; seulement la Lumière (chantiers de la Confrérie 6 000 à 20 000 p., mécénat, décor) ; seulement l'Ombre (repaire 3 000 à 12 000 p., marché noir, caisse, fosse, enveloppe du capitaine) ; le neutre (prix de la neutralité) ; les prélèvements (taxe de la Confrérie 12/16/22 %, pizzo, amendes, pots-de-vin, taxes du duc).
- Comptes simulés (`lancer4.sh`, `compta.js`, 6 parties de 150 jours, joueur qui dépense) : recettes par jour Lumière 4 993, neutre 3 561, Ombre 2 800 (56 %) ; la taxe de la Confrérie mange 31 % des recettes de la Lumière et 39 % de celles de l'Ombre ; les chantiers actuels ne coûtent que quelques jours de recettes au milieu de la partie.
- Proposé (fiches 2 à 4) : Lumière (cierges du départ, offrande de la semaine, armurerie consacrée 20 000, loge des Gardiens 40 000, réquisitions de guerre) ; Ombre (nourrir ceux qu'on cache, tunnel du Passeur 10 000, atelier du faussaire 8 000, trésor de guerre du Drômmath par paliers de 10 000 qui fait monter la préparation de la guerre, rançon d'un prisonnier 3 000 à 8 000, maison à Cendrebourg) ; neutre (sauf-conduit 200 par saison, part du Passeur 10 %, grande forge de guerre 12 000 / 20 000 / 30 000, grenier de guerre 6 000, pigeonnier 4 000, les deux réquisitions).
- Équilibre (fiche 5) : avec la règle (recettes 100 / 95 / 80) et les dépenses simulées, il reste chaque jour ≈ 2 100 (Lumière), 2 700 (neutre), 1 800 (Ombre) ; le grand but coûte 60 000, 72 000, 48 000 : environ 27 à 29 jours d'économies pour chacun.

### 12.2 L'armure par les royaumes de l'Ombre (Q325 B)
- Les terres des Bannis deviennent cinq royaumes : le Marais des Gobelins (Bourbier, Pont des Trolls), les Terres des Orcs (Fort, Mines Rouges, Clairière des Chamans), les Hauts des Loups (Repaire, Col des Hurlements), la Nuit-Pourpre (Château, Tour du Nécromancien), les Sables (Tombeaux). 12 royaumes en tout ; chacun des 7 premiers libérés, quels qu'ils soient, donne une pièce ; la 8e reste au grand voyage à Cendrebourg (avec la Lame sans Nom). L'Ombre « libère », la Lumière « conquiert ».
- Armes proposées : la Massue des Ponts, la Hache du Serment Muet, les Griffes de la Nuit sans Lune, le Calice de l'An Sans Nom, le Sceptre de la Grande Marée.
- Dans le code (après validation) : `ROYAUMES` et `ZONES[…].royaume` (data.js), `ARMES_LEGENDAIRES`, et ce qui lit `'bannis'` comme royaume (la carte : exterieurHD.js, CarteScene.js ; les emblèmes : emblemesHD.js).
- Simulation (`OMBRE_ROY=1`, 12 parties par stratégie) : 7e pièce de l'Ombre du jour 259 au jour 153 (Lumière 127 → 134) ; neutre inchangé (il ne descend pas au marché noir) ; la Main Noire paraît plus lente (196 → 261, très dispersé, de 74 à 413) ; toutes stratégies 169 → 174.

### 12.3 Les Bannis au comptoir
- Aujourd'hui : `peupleAccueilli` (regles.js) ; les Bannis seulement si `coteCamp === 'mal'`, les pandas seulement si `'bien'` ; les terres des Bannis cachées avant le marché noir.
- Proposé : on en parle → à la cave → la nuit par la porte de derrière (un Banni croisé à la cave) → au crépuscule déguisés (le regard des Bannis monte) → à visage découvert ; peuple par peuple, quand sa terre est libérée ou qu'un des siens doit la vie au joueur ; un risque de rumeur si un client de la Lumière est là ; la Clairvoyance reconnaît le Banni sous le manteau.
- L'inverse : les clients de la Lumière quittent le joueur très sombre dans l'ordre (paladins et pèlerins, nobles, humains), certains reviennent la nuit ; hobbits et pandas chez tout le monde sauf aux extrêmes.

### 12.4 Garrick et le neutre pendant la guerre
- Jusqu'au jour de l'armure, il passe toujours, blagueur. Puis, selon le choix de l'armure : un Banni → il vient la chercher et devient le champion de la Grande Muraille (la gazette le traite de traître) ; Sire Valdric → il devient le chef de la résistance, et la nouvelle vague fait oublier Garrick à JeuneGoy (une pipe inconnue sur le comptoir) ; la garder → « Tu l'avais. Tu l'avais, et tu l'as rangée. », il part affronter ce qui sort de la Porte.
- Ce que les choix du joueur ont fait de lui : aidé (le paquet, le prêt, la lettre, le remède du chat, le fragment de la berceuse) → fort et libre ; dénoncé par Lucien sans aide → en prison, le neutre l'apprend par son procès.
- Ensuite : les crieurs, les réfugiés, la Faucheuse (« Ton ami ? Pas encore. »), le chat ; l'après-fin (une lettre, une visite, ou une tombe).

---

## 13. La mise en œuvre (validée le 02/11, Q326 à Q335)

Le plan en dix étapes : `scratchpad/lot3/a_valider/ombre-lumiere/plan/le-plan.png` (le socle ; le monde lit le regard ; les faits qui manquent ; la Clairvoyance complète ; les Bannis au comptoir ; l'armure de l'Ombre ; le neutre ; les extrêmes ; les dépenses par camp ; les choix et les fins).

### Étape 1, le socle (faite, à valider)
- `src/degres.js` : l'allégeance (7 degrés, « naissante », avec « effleuré » et « penchant » pour les textes ; les faits validés de la fiche 4, de même poids des deux côtés ; le dernier degré verrouillé, `recitDeRetour` pour les récits à venir ; les actes graves ; le spectateur le soir de la 7e pièce) ; le cœur (`G.coeur`) ; le regard du monde (`G.regard`, Confrérie et Bannis, de −50 à 100, sept niveaux de phrases) ; la Clairvoyance (`G.clairvoyance` : une lueur par imposteur démasqué, par baluchon donné à un menteur dont on apprend le sort, par récit de doyen, pour la berceuse lue, pour un faux présage trahi ; au plus deux par nuit ; les ☀ ☾ à 8 lueurs ; la bougie de chevet plus grande et un halo pâle) ; `jaugeFloue` (la jauge d'avant, sans chiffre, une fois par jour, par pas de 20).
- Le barème distingue enfin ce qui était mêlé sous « piège » : `serviceMafia` (mafia.js), `corbeau` et `aigle` (CounterScene, message de détresse), `soudoyer` (l'inspecteur, evenementsComptoir.js) ; `denoncerInnocent` (le cœur) dans `denoncerRecherche`.
- Le Parrain : `choisirParrain` (parrain.js) appelait `pencherCamp`, qui n'écrivait que dans `G.reussites` : se taire, le dénoncer et baiser la bague passent maintenant par `pencher` (`parrainTaire`, `parrainDenoncer`, `parrainBague`) ; « le changer » par `noterFait`.
- L'écran : le HUD (une lueur floue au lieu du curseur, plus de « +N ☀ » ni d'annonce de palier ; la bulle dit « Ce qu'on dit de toi ») ; le livre des deux voies (BureauScene, `afficherCamps` : le blason de la Confrérie et ses rayons, la fleur de pommier des Bannis et ses pétales, les phrases, « Ce qu'on raconte », sans chiffre) ; le bilan du soir (« On dit de toi » et la jauge floue).
- Les ☀ ☾ des boutons suivent la Clairvoyance sans toucher à pixels.js : `brancherClairvoyance` enveloppe `marquerCamp` une fois la page chargée ; la première fois, c'est la Clairvoyance qui s'explique.
- La migration (sauvegarde.js) : l'allégeance d'après la jauge et le serment ; le cœur d'après les dons au mendiant et les âmes offertes ; le regard d'après la jauge ; la Clairvoyance à 8 lueurs pour qui voyait déjà les ☀ ☾ avec son flair.
- Les effets du monde (taxes, banque, garde, Carrefour, sceau…) lisent encore la jauge : c'est l'étape 2.
- Vérifié : smoke2, fuzz7 (graines 33, 230, 401), t_file, recit (succès, échec, mort), sim_coh (8 parties × 120 jours, aucun problème), t_formes (vieilles parties v1.20, v1.40, v1.60), 23 essais des règles (`test_degres.js`). En parties simulées, les ☀ ☾ apparaissent vers le jour 36 à 69 (avant : vers le jour 5, avec le flair).

### Le livre des deux voies en HD (Q336)
- `src/livreDeuxVoiesHD.js` (chargé dans `index.html` et `web/jeu.html` après `bureauHD.js`) : le blason ciselé de la Confrérie (double bordure d'or entaillée, filet d'argent, champ d'azur damassé, la tour crénelée et son soleil ; terni et fêlé quand la Confrérie se méfie) et ses huit rayons d'or, allumés deux par degré d'estime, qui s'allument un à un avec un éclat ; la fleur de pommier peinte des Bannis sur son médaillon de nuit (lune, étoiles, branche, feuilles), un bouton fermé, puis 1, 3, 4 et 5 pétales qui se déplient un par un, le cœur et ses étamines ; fanée quand les Bannis te maudissent. Halo et reflet quand l'estime est haute.

### Étape 2, le monde lit le regard (faite, à valider)
- `palierCamp` (regles.js) se calcule maintenant d'après le regard des deux camps (`palierDuRegard`, degres.js : l'estime de l'un retranche celle de l'autre) : tout ce qui lit `palierCamp` ou `coteCamp` suit le regard (la garde, la banque, la taxe, le marché noir, la Main Noire, les clients bannis et pandas, la Confrérie et le repaire, le mécénat, la menace, la gazette, les taxes du duc, la forge de l'ombre, l'armure donnée par l'un ou l'autre camp). La jauge floue du bandeau aussi.
- Le Carrefour vient quand un camp te fait confiance (palier ±2) ; la dernière offre au palier ±3 ; le parjure quand le monde te voit servir l'autre camp (palier ±1 de l'autre côté).
- Le sceau : sans serment, l'allégeance décide (0 : la fin neutre).
- La taxe de la Confrérie : 10 / 14 / 20 % de ce que la fortune a gagné depuis la semaine d'avant (`G.baseTaxe`), au-delà de 100 p. ; rien la première semaine d'une vieille partie. Parties simulées (6 × 150 jours) : 7 % des recettes pour la Lumière et le neutre, 11 % pour l'Ombre (avant : 31, 24, 39 %).
- Vérifié : smoke2, fuzz7 (33, 230, 401), t_file, recit (trois issues), sim_coh (8 × 120 jours), t_formes (v1.20, v1.40, v1.60), 29 essais des règles.
- Reste pour l'étape des dépenses : l'Ombre encaisse 55 % de la Lumière (règle : 80 %).

### La taxe et l'argent (03/11 : la taxe baissée refusée)
- `TAXE_CONFRERIE.mode` (data.js) : `'fortune'` (l'ancienne : 12 / 16 / 22 % de la fortune au-delà de 200 p., chaque semaine), `'gain'` (celle de l'étape 2, refusée), `'progressive'` (dans la branche, en attendant l'étape des dépenses : la fortune par tranches, la moitié du taux jusqu'à 5 000 p., le taux jusqu'à 20 000, une fois et demie jusqu'à 60 000, le double au-delà). `taxeDeLaConfrerie` (regles.js).
- Le bon joueur de `sim_coh` (DEPENSES=1), 3 à 6 parties de 200 jours par camp et par taxe (`lancer5.sh`, `argent.js`) : argent au jour 120 / 200 — ancienne : Lumière 199 k / 588 k, neutre 93 k / 546 k, Ombre 78 k / 121 k ; baissée : 258 k / 1 149 k, 146 k / 899 k, 159 k / 429 k ; progressive : 141 k / 379 k, 81 k / 349 k, 46 k / 75 k. Le robot cesse d'acheter vers 94 000 p. (Lumière, neutre) et 79 000 p. (Ombre) : il a tout pris de ce qu'il sait acheter.
- Ce qui s'achète aujourd'hui et ce qui est validé (fiche 2) : environ 280 000 p. (Lumière), 253 000 (neutre), 248 000 et le trésor sans fond (Ombre). Argent inutile au jour 120 : ancienne taxe, Lumière 13 k ; taxe baissée, Lumière 72 k ; progressive, rien. Au jour 200 : progressive, Lumière 193 k et neutre 189 k ; l'Ombre jamais.
- Le grand inventaire proposé (fiche 3) : 1 285 200 p. pour tous les camps (le comptoir et ses étages, la maison et ses styles, la chambre, l'arrière-boutique et la forge du joueur, le mécénat de bâtiments de la ville, une maison dans chaque ville, les collections, les gens, les fêtes, le cosmétique, la famille de l'après-fin), plus 140 000 à 230 000 par camp. Le bon joueur ne peut tout s'offrir qu'au jour 488 (neutre) et 636 (Lumière) ; l'Ombre, à son rythme actuel, jamais (d'où les 80 % à atteindre).
- Les taxes mises en scène (fiche 4) : la dîme du Rempart (Lumière), le prix de la paix (neutre, deux collecteurs), l'impôt des suspects (Ombre) ; ce qu'elles financent vraiment (les églises-relais, les frontières, le projet souterrain du dragon ; les caches du Drômmath).

### Les réponses du 03/11 sur l'argent
- **La taxe par côté** (dans la branche) : progressive pour la Lumière et le neutre ; l'ancienne pour l'Ombre (22 % de la fortune au-delà de 200 p.), parce que l'Ombre cache une partie de sa fortune : le percepteur ne la voit pas toute, et l'impôt des suspects ne grimpe pas avec elle. `TAXE_CONFRERIE.modeParCote` (data.js), lu par `taxeDeLaConfrerie` (regles.js). Le texte de l'impôt des suspects (fiche 4) le dit.
- **Le grand inventaire est validé**, avec ces changements, pour l'étape des dépenses :
  - les tableaux de la chambre sont de beaux paysages du monde ; peut-être un tableau d'avant le premier sort d'oubli, très difficile à obtenir ; **jamais de portrait de JeuneGoy** ;
  - pas de maison à acheter dans chaque ville : ce qui coûte, c'est la location et l'achat d'**emplacements** pour poser la maison sur pattes ;
  - pas de salle des armes légendaires : à la place, plus tard, une **librairie** dans le menu principal, où chaque personnage, arme et lieu rencontré s'ajoute ;
  - nouveaux cosmétiques : des **montures**, et des « **taxis** » vivants dans la ville des hobbits : une créature-bus originale, et des charrettes pour deux tirées par une créature-autruche à écailles et à tête d'iguane ; on peut choisir de vivre le trajet ;
  - la famille de l'après-fin : plus tard.

### Étape 3, les faits qui manquaient (faite, à valider)
- `src/faitsHistoire.js` (les règles, chargé après `degres.js`) et `src/scenes/ComptoirFaits.js` (la mise en scène et les figurants, après `ComptoirEvenements.js`), dans `index.html` et `web/jeu.html`. Les faits et leur barème sont dans `degres.js` (FAITS, BAREME_CAMP), chacun avec son jumeau de même poids : faire taire / écouter un doyen (3), chasser / garder une fissure (3, secret), protéger / saboter une église-relais (5), ravitailler un convoi / donner sa route (5), un don au Drômmath (3, le jumeau du mécénat du Sage).
- **Les doyens** : au comptoir, « Racontez-moi » puis le récit page à page ; à la deuxième page, « Assez. Taisez-vous. » (☀) ou la suite (☾) ; en Lumière (palier +2), deux gardes l'interrompent : « Laissez-le finir » (Confrérie −2) ou « Emmenez-le ». Le récit écouté au marché noir compte aussi (une fois par doyen) ; la lueur de Clairvoyance vient du récit retenu.
- **Les fissures du Sage** : un événement de l'histoire (dès le jour 45, 14 jours d'écart) quand un indice est connu : la berceuse, les pommiers de Grand-mère Ortie, la nuit au ciel orange (3e visite du vieux voyageur), la médaille du mendiant. Garder (une lueur) ou chasser. La Lumière ardente ne les voit plus. Le Sage aveugle la Clairvoyance (`G.sageIci`, posé aussi par sa visite du mécénat).
- **Les églises-relais** (dès ★3 ou le jour 80, trois au plus, six semaines d'écart) : Sœur Clémence (2 torches et 1 corde, rachetées si elles manquent ; le lendemain la cloche sonne juste, et à 15 lueurs on oublie un instant le nom de sa rue) ou Ysolde Nuit-Close (le sac de limaille sous le comptoir ; une fois sur trois la garde le trouve : 40 p. d'amende, Confrérie −6 ; sinon la cloche est fêlée).
- **Les convois** (dès le jour 55, quatre au plus ; quand une contrée de la Confrérie est attaquée, le convoi passe en priorité, une fois par attaque) : le sergent Bourrel (3 rations et 1 potion) ou Fenrir Pas-Feutré (la porte du moulin). Vers une contrée de la Confrérie attaquée : ±8 à la force de l'escouade (`menace.js`, `forceEscouade`, `m.convoi`). Une fois sur quatre, le pillage te fait soupçonner (Confrérie −6).
- **Le Drômmath** (Nekhet, voix du Drômmath) : quand les Bannis t'estiment (niveau 2), au palier −2, ou après le serment des Bannis ; un don de 4 % de la fortune (100 à 3 000 p.), au plus une fois toutes les six semaines (comme les autres événements au hasard) ; `G.faitsHistoire.drommath.total` garde le trésor de guerre (pour l'étape des dépenses).
- **Le Parrain dénoncé** : au réveil, jour 1 la gazette et la sardine dans un gant ; jour 3 la chorale de chats (le comptoir ouvre une heure plus tard, `retardDesFaits`) ; jour 6 la grève des chats (4 rations aux rats) ; jour 9 l'avis de recherche (17 chats arrêtés, le matou de la mère Pelote, un raton laveur) ; jour 12 Maître Fouine, avocat de « Monsieur Chat », au comptoir (60 p., ou un poisson pourri cloué sur la porte) ; jour 16 les pattes de velours (8 % de la fortune, 300 p. au plus ; la serrure de fer les arrête) ; jour 21 la lettre scellée d'une patte (la vengeance de la bande s'arrête) ; jour 30 les yeux sous un chapeau ; jour 45 la carte postale.
- Corrigé en passant : le ☀ ou le ☾ du second bouton d'un choix ne s'affichait pas quand ce bouton apparaissait avec le choix (`CounterScene.choix`). Les simulations jouent enfin les événements du comptoir (`resoudreEvenementSim`).

### L'argent de l'Ombre (05/11, priorité 1 : la règle des 80 %)
- **D'où venait l'écart** (sim_coh, 30 parties de 120 jours par camp, `comparer.js`) : le robot de l'Ombre ne découvrait jamais les terres des Bannis. Elles s'ouvrent le lendemain de la première visite au marché noir (`G.visiteMarcheNoir`, posé par la scène du marché noir), et la simulation entrait au marché noir sans la poser. Il servait donc l'Ombre dans les terres neutres, sans le butin des terres d'ombre. Avec un robot qui y descend comme un vrai joueur, l'Ombre passe de ~50 % à 70 % (sans dépenses) et 77 % (avec), sur l'argent des parties sans faillite.
- **Ce qui restait** : la renommée. Les terres d'ombre rapportent la moitié de la réputation (×0,5), même au marchand qui est de leur côté ; sa réputation plafonnait vers 14 à 25 (Lumière 40 à 66), donc moins de clients (707 contre 848). Et ses gains étaient plus réguliers que ceux de la Lumière.
- **Corrigé, sur les revenus de l'Ombre seulement** (la taxe et les prix de la maison ne bougent pas) :
  - `EFFETS_CAMP.mal.reputationAllie = 0,8` (data.js) : pour qui est du côté des Bannis, leurs terres rapportent 0,8 de réputation au lieu de 0,5 (la Lumière alliée : 1,5) ; `multReputationCamp` (regles.js) lit l'allié des deux côtés ;
  - `FORTUNE_OMBRE` (data.js), `aleaDeLOmbre` (regles.js, dans `partDuButin`) : dans les terres des Bannis, pour qui est de leur côté, le butin est ce qu'on trouve : ×0,4 trois fois sur dix, ×1 près d'une fois sur deux, ×1,72 une fois sur quatre (en moyenne, le même) ; tiré sous le nom et le jour du départ (recharger ne le change pas). Aucun texte nouveau à l'écran.
- **Après** (30 parties par camp, l'argent au jour 120 des parties sans faillite) : sans dépenses, Lumière 79,6 k, neutre 80,4 k, Ombre 62,3 k (78 %) ; avec dépenses, Lumière 119,3 k, neutre 118,8 k, Ombre 100,7 k (84 %). Faillites (toutes avant le jour 30) : Ombre 0 et 2 sur 30, Lumière 7 et 5, neutre 4 et 1. Irrégularité des recettes de la semaine (écart à la tendance) : Ombre 0,19 et 0,16, Lumière 0,15 et 0,14.
- Le robot corrigé : `scratchpad/lot3/ombre-lumiere/tests/sim_coh.js` (et la même ligne dans `scratchpad/sim_coh.js`).

## Les peuples des Bannis, leurs étoiles et les vampires (06/11, réponses du joueur à Q400 et Q409)

- **La carte** : on l'élargit un petit peu sur la droite, pour que les royaumes des Bannis respirent ; le Col des Hurlements remonte près du Repaire des Loups-garous (les Hauts des Loups d'un seul tenant). Aucune destination n'est enlevée.
- **Les étoiles** : les Bannis ont, comme la Lumière, une échelle de peuples jusqu'à 5 étoiles ; mais chez eux, **deux peuples à 3 étoiles** (et non deux à 4 comme du côté de la Lumière). Le sommet à 5 étoiles : **les vampires**.
- **Les vampires** : de grands manoirs à la manière de Dracula, très riches. Ils ne sont pas forcément aimés chez les Bannis : c'était déjà le cas avant le premier sort d'oubli, et leur hauteur naturelle les a rendus de nouveau exécrables. Mais vu leur richesse, les Bannis ne bronchent jamais trop… sauf les **trolls**, qui ont du mal avec ceux qui « pètent plus haut que leurs dents » (jeu de mots sur « péter plus haut que son cul », avec les dents des vampires).

## Les provisions à l'Ombre profonde (06/11, Q403 et Q410 validés)

- JeuneGoy n'a pas d'étal au marché : il y achète. Quand le marché lui est fermé, trois façons de se fournir : le **prête-nom** (Tobin ou Célestin fait les achats, contre une part, comme le coursier de l'orphelinat), les **lettres** portées par les pigeons de la Main Noire (commander à distance), et le **déguisement** (y aller soi-même, au risque d'être reconnu).
- **Le risque du déguisement** (proposé par le joueur) : reconnu, JeuneGoy prend une **amende** ; il peut essayer de **soudoyer** les autorités pour repartir avec ses provisions ; **plus il achète, plus il a de chances de se faire attraper en repartant**. Pour le soudoiement, plusieurs sommes possibles, chacune avec son dialogue et sa conséquence. Le détail est proposé au joueur (Q413 à Q415).
- **Si tout tourne mal** (Q414, 06/11) : en plus de l'amende et du panier saisi, une nuit au cachot ; le comptoir ouvre en retard le lendemain.
- **Le garde du marché** (Q415, 06/11) : un personnage qui revient, avec un nom, et qui se souvient des pots-de-vin ; à 15 lueurs, la Clairvoyance laisse deviner son prix. C'est **un hobbit qui se prend pour quelqu'un de très important**, alors qu'il n'est qu'un garde de marché et n'a jamais vu la guerre : très énervant, très agaçant… mais qui devient étonnamment très gentil dès qu'il reçoit un pot-de-vin.
