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
